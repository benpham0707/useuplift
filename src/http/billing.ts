import { Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Check if Stripe is configured
const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
if (!isStripeConfigured) {
}

type CreditPack = {
  name: string;
  amount: number;
  currency: string;
  credits: number;
};

// NEW CREDIT PACKS (no subscriptions)
const CREDIT_PACKS: Record<string, CreditPack> = {
  starter_pack: {
    name: 'Starter Pack',
    amount: 8000, // $80.00
    currency: 'usd',
    credits: 400,
  },
  full_season_pack: {
    name: 'Full Season Pack',
    amount: 20000, // $200.00
    currency: 'usd',
    credits: 1200,
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

    let pack = CREDIT_PACKS[type as keyof typeof CREDIT_PACKS];

    // Handle dynamic custom packs (custom_50, custom_100, ..., custom_2000)
    // $13 per 50 credits
    if (!pack && type.startsWith('custom_')) {
        const credits = parseInt(type.split('_')[1]);
        // Validate: multiple of 50, between 50 and 2000
        if (!isNaN(credits) && credits % 50 === 0 && credits >= 50 && credits <= 2000) {
             pack = {
                name: `${credits} Credits (Custom Pack)`,
                amount: (credits / 50) * 1300, // $13 per 50 credits ($1300 cents)
                currency: 'usd',
                credits: credits,
             };
        }
    }

    if (!pack) {
      return res.status(400).json({ error: 'Invalid pack type' });
    }

    // Check if user has referral discount active (10% off)
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, referral_discount_active')
      .eq('user_id', userId)
      .single();

    let finalAmount = pack.amount;
    let referralDiscountApplied = false;

    if (profile?.referral_discount_active) {
      // Apply 10% discount
      finalAmount = Math.round(pack.amount * 0.9);
      referralDiscountApplied = true;
    }

    // Get or create customer
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Get email from profile if available (set during onboarding)
      const email = profile?.email || undefined;

      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
          authProvider: 'clerk',
        },
      });
      customerId = customer.id;
      
      // Update or upsert the profile with stripe_customer_id
      if (profile) {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId);
      } else {
        // Create profile if it doesn't exist
        await supabase
          .from('profiles')
          .insert({ 
            user_id: userId, 
            stripe_customer_id: customerId,
            credits: 0 
          });
      }
    }

    // All credit packs are one-time payments (no subscriptions)
    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',  // Collect and save billing address for tax calculation
      },
      line_items: [
        {
          price_data: {
            currency: pack.currency,
            product_data: {
              name: pack.name,
              description: referralDiscountApplied 
                ? `${pack.credits} credits (10% referral discount applied)` 
                : `${pack.credits} credits`,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Always one-time payment
      success_url: successUrl || `${req.headers.origin}/pricing?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing?canceled=true`,
      metadata: {
        userId,
        type,
        credits: pack.credits,
        referral_discount_applied: referralDiscountApplied ? 'true' : 'false',
        original_amount: pack.amount,
        final_amount: finalAmount,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
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
        return res.status(400).send('Webhook Error: Missing raw body');
      }
      event = stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);
    } else {
      event = req.body; // For local testing without signature verification if secret is missing
    }
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await processCheckoutSession(session);
        break;
      }
      // Removed subscription renewal logic - we only do one-time credit packs now
    }
  } catch (error) {
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
        res.status(500).json({ error: error.message });
    }
}

export const createPortalSession = async (req: Request, res: Response) => {
    // No longer needed - we don't have subscriptions to manage
    // Users can just buy more credit packs as needed
    return res.status(404).json({ 
        error: 'Customer portal not available. Purchase credit packs directly from the pricing page.' 
    });
}

async function processCheckoutSession(session: any) {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;
    const credits = parseInt(session.metadata?.credits || '0');
    const paymentId = session.payment_intent as string || session.id;

    if (userId && credits > 0) {
        await grantCredits(userId, credits, type, paymentId);
        
        // Check if this is the referee's first purchase and grant referrer bonus
        await grantReferrerPurchaseBonus(userId, paymentId);
    }
}

async function grantReferrerPurchaseBonus(refereeUserId: string, paymentId: string) {
    try {
        // Check if this user is a referee and the purchase bonus hasn't been granted
        const { data: referral } = await supabase
            .from('referrals')
            .select('referrer_user_id, purchase_bonus_granted_at')
            .eq('referee_user_id', refereeUserId)
            .maybeSingle();

        if (!referral || referral.purchase_bonus_granted_at) {
            // Either not a referee or bonus already granted
            return;
        }

        const referrerId = referral.referrer_user_id;
        const now = new Date().toISOString();

        // Check for idempotency - make sure we haven't already granted this specific bonus
        const bonusDescription = `Referral purchase bonus: ${refereeUserId.slice(0, 8)}... made first purchase (+25 credits)`;
        const { data: existingBonus } = await supabase
            .from('credit_transactions')
            .select('id')
            .eq('user_id', referrerId)
            .eq('type', 'bonus')
            .eq('stripe_payment_id', `referral_purchase_${paymentId}`)
            .maybeSingle();

        if (existingBonus) {
            // Bonus already granted for this payment
            return;
        }

        // Grant referrer +25 credits
        const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', referrerId)
            .single();

        if (referrerProfile) {
            const newBalance = (referrerProfile.credits || 0) + 25;
            await supabase
                .from('profiles')
                .update({ credits: newBalance })
                .eq('user_id', referrerId);

            // Log the bonus transaction with unique reference
            await supabase
                .from('credit_transactions')
                .insert({
                    user_id: referrerId,
                    amount: 25,
                    type: 'bonus',
                    description: bonusDescription,
                    stripe_payment_id: `referral_purchase_${paymentId}`,
                });

            // Mark purchase bonus as granted
            await supabase
                .from('referrals')
                .update({ purchase_bonus_granted_at: now })
                .eq('referee_user_id', refereeUserId);
        }
    } catch (error) {
        console.error('Error granting referrer purchase bonus:', error);
        // Don't throw - we don't want to fail the entire checkout processing
    }
}

async function grantCredits(userId: string, amount: number, type: string, referenceId?: string) {
  // Check for idempotency
  if (referenceId) {
      const { data: existing } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('stripe_payment_id', referenceId)
          .eq('user_id', userId)
          .maybeSingle();
      
      if (existing) {
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
      type: 'addon_purchase', // All are credit pack purchases now
      description: `Purchased ${amount} credits via ${type}`,
      stripe_payment_id: referenceId
    });
}
