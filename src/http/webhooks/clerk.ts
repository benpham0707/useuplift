import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS (webhook doesn't have user JWT)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️  Supabase credentials missing for Clerk webhook');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Clerk webhook event types we handle
interface ClerkUserCreatedEvent {
  type: 'user.created';
  data: {
    id: string; // Clerk user ID (e.g., "user_2q...")
    email_addresses: Array<{
      email_address: string;
      id: string;
      verification: { status: string };
    }>;
    first_name: string | null;
    last_name: string | null;
    created_at: number;
  };
}

interface ClerkUserDeletedEvent {
  type: 'user.deleted';
  data: {
    id: string;
    deleted: boolean;
  };
}

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent | { type: string; data: unknown };

/**
 * Handles Clerk webhook events.
 * 
 * Currently handles:
 * - user.created: Creates a profile row in Supabase
 * - user.deleted: (Optional) Could delete profile row
 * 
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks > Add Endpoint
 * 2. URL: https://your-api-domain.com/api/v1/webhooks/clerk
 * 3. Select events: user.created
 * 4. Copy signing secret to CLERK_WEBHOOK_SECRET env var
 */
export async function handleClerkWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ CLERK_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!supabase) {
    console.error('❌ Supabase client not available for webhook');
    return res.status(500).json({ error: 'Database not configured' });
  }

  // Get the Svix headers for verification
  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('❌ Missing Svix headers');
    return res.status(400).json({ error: 'Missing webhook headers' });
  }

  // Get raw body for signature verification
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.error('❌ Raw body not available for webhook verification');
    return res.status(400).json({ error: 'Raw body not available' });
  }

  let payload: ClerkWebhookEvent;

  try {
    const wh = new Webhook(webhookSecret);
    payload = wh.verify(rawBody.toString(), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err?.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle user.created event
  if (payload.type === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name } = payload.data as any;
    const primaryEmail = email_addresses?.[0]?.email_address;

    console.log(`📥 Clerk webhook: user.created for ${clerkUserId} (${primaryEmail})`);

    try {
      // Check if profile already exists (idempotency)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', clerkUserId)
        .maybeSingle();

      if (existingProfile) {
        console.log(`ℹ️  Profile already exists for ${clerkUserId}`);
        return res.json({ received: true, action: 'profile_exists' });
      }

      // Create the profile
      // Note: Email is stored in personal_information.primary_email, not in profiles
      // The user's email is available from Clerk and will be captured during onboarding
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: clerkUserId,
          user_context: 'high_school_11th', // Default context
          credits: 10, // Free credits for new users
          has_completed_assessment: false,
          status: 'initial',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Failed to create profile:', insertError);
        // Return 200 anyway to prevent Clerk from retrying
        // Log the error for investigation
        return res.json({ received: true, error: insertError.message });
      }

      console.log(`✅ Profile created for ${clerkUserId}: ${newProfile.id}`);
      return res.json({ received: true, action: 'profile_created', profileId: newProfile.id });

    } catch (err: any) {
      console.error('❌ Error handling user.created:', err?.message);
      // Return 200 to prevent retry loops
      return res.json({ received: true, error: err?.message });
    }
  }

  // Handle user.deleted event (optional - for cleanup)
  if (payload.type === 'user.deleted') {
    const { id: clerkUserId } = payload.data as any;
    console.log(`📥 Clerk webhook: user.deleted for ${clerkUserId}`);
    
    // Optional: Delete or soft-delete the profile
    // For now, just acknowledge
    return res.json({ received: true, action: 'user_deleted_acknowledged' });
  }

  // Acknowledge other events we don't handle
  console.log(`📥 Clerk webhook: ${payload.type} (not handled)`);
  return res.json({ received: true, action: 'event_not_handled' });
}
