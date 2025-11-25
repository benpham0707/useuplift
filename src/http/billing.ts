import { Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing for billing service');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Check if Stripe is configured
const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
if (!isStripeConfigured) {
  console.warn('⚠️  Stripe not configured - billing features will be disabled');
}

type SubscriptionPlan = {
  name: string;
  amount: number;
  currency: string;
  credits: number;
  interval: 'month' | 'year';
};

type AddonPlan = {
  name: string;
  amount: number;
  currency: string;
  credits: number;
};

type Plan = SubscriptionPlan | AddonPlan;

const PLANS: Record<string, Plan> = {
  pro_monthly: {
    name: 'Pro Monthly Subscription',
    amount: 2000, // $20.00
    currency: 'usd',
    credits: 100,
    interval: 'month',
  },
  pro_yearly: {
    name: 'Pro Annual Subscription',
    amount: 19200, // $192.00 (Save 20%)
    currency: 'usd',
    credits: 1200, // 100 * 12
    interval: 'year',
  },
  // Legacy fallback
  subscription: {
    name: 'Monthly Subscription',
    amount: 2000, // $20.00
    currency: 'usd',
    credits: 100,
    interval: 'month',
  },
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    if (!isStripeConfigured) {
      return res.status(503).json({ error: 'Billing not configured' });
    }

    const { type, successUrl, cancelUrl } = req.body;
    const userId = (req as any).auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let plan = PLANS[type as keyof typeof PLANS];

    // Handle dynamic addons (addon_50, addon_100, ..., addon_500)
    if (!plan && type.startsWith('addon_')) {
        const credits = parseInt(type.split('_')[1]);
        // Validate: multiple of 50, between 50 and 500
        if (!isNaN(credits) && credits % 50 === 0 && credits >= 50 && credits <= 500) {
             plan = {
                name: `${credits} Credits Pack`,
                amount: (credits / 50) * 1000, // $10 per 50 credits ($1000 cents)
                currency: 'usd',
                credits: credits,
             };
        }
    }

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Get or create customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email') // Assuming email might be on profile or we fetch from auth
      .eq('user_id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Fetch user email from auth if not in profile (using supabase admin)
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData.user?.email;

      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    const isSubscription = 'interval' in plan;
    
    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      automatic_tax: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
            },
            unit_amount: plan.amount,
            ...(isSubscription ? { recurring: { interval: (plan as SubscriptionPlan).interval } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl || `${req.headers.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/billing/cancel`,
      metadata: {
        userId,
        type,
        credits: plan.credits,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  if (!isStripeConfigured) {
    return res.status(503).json({ error: 'Billing not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        console.error('Webhook Error: Missing raw body for signature verification');
        return res.status(400).send('Webhook Error: Missing raw body');
      }
      event = stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);
    } else {
      event = req.body; // For local testing without signature verification if secret is missing
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await processCheckoutSession(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        // Handle recurring payments for subscriptions
        const invoice = event.data.object as any;
        if (invoice.billing_reason === 'subscription_cycle') {
           const subscriptionId = invoice.subscription;
           const { data: subscription } = await supabase
             .from('subscriptions')
             .select('user_id')
             .eq('stripe_subscription_id', subscriptionId)
             .single();

           if (subscription) {
             // Grant monthly credits (100 is default for subscription renewal)
             // Ideally we should store the plan credits on the subscription or metadata
             await grantCredits(subscription.user_id, 100, 'subscription_renewal', invoice.payment_intent || invoice.id);
           }
        }
        break;
      }
      // Handle subscription updates/cancellations as needed
    }
  } catch (error) {
     console.error('Error processing webhook:', error);
     return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
};

export const verifySession = async (req: Request, res: Response) => {
    try {
        if (!isStripeConfigured) {
          return res.status(503).json({ error: 'Billing not configured' });
        }

        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
             await processCheckoutSession(session);
             res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Payment not successful' });
        }
    } catch (error: any) {
        console.error('Error verifying session:', error);
        res.status(500).json({ error: error.message });
    }
}

async function processCheckoutSession(session: any) {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;
    const credits = parseInt(session.metadata?.credits || '0');
    const paymentId = session.payment_intent as string || session.subscription as string || session.id;

    if (userId && credits > 0) {
        await grantCredits(userId, credits, type, paymentId);
        
        if (type === 'pro_monthly' || type === 'pro_yearly' || type === 'subscription') {
            await handleSubscriptionCreated(userId, session);
        }
    }
}

async function grantCredits(userId: string, amount: number, type: string, referenceId?: string) {
  // Check for idempotency
  if (referenceId) {
      const { data: existing } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('stripe_payment_id', referenceId)
          .single();
      
      if (existing) {
          console.log(`Transaction ${referenceId} already processed.`);
          return;
      }
  }

  // 1. Get current credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('user_id', userId)
    .single();

  const currentCredits = profile?.credits || 0;
  const newBalance = currentCredits + amount;

  // 2. Update profile
  await supabase
    .from('profiles')
    .update({ credits: newBalance })
    .eq('user_id', userId);

  // 3. Log transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: amount,
      type: type.includes('subscription') || type === 'pro_monthly' || type === 'pro_yearly' ? 'subscription_grant' : 'addon_purchase',
      description: `Purchased ${amount} credits via ${type}`,
      stripe_payment_id: referenceId
    });
}

async function handleSubscriptionCreated(userId: string, session: any) {
    // Check if subscription already exists
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', session.subscription)
        .single();

    if (existing) return;

    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        status: 'active',
        current_period_end: new Date(session.expires_at ? session.expires_at * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000) 
      });
      
    await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('user_id', userId);
}
