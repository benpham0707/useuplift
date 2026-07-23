import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';
import { provisionProfile } from '@/services/profileProvisioning';

// Use service role key to bypass RLS (webhook doesn't have user JWT)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
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
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // Get the Svix headers for verification
  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing webhook headers' });
  }

  // Get raw body for signature verification
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
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
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle user.created event
  if (payload.type === 'user.created') {
    const { id: clerkUserId } = payload.data as any;

    try {
      const profile = await provisionProfile(supabase, clerkUserId);
      console.info('[profile-provisioning]', { userId: clerkUserId, created: profile.created });
      return res.json({ received: true, action: profile.created ? 'profile_created' : 'profile_exists', profileId: profile.id });

    } catch (err: any) {
      console.error('[profile-provisioning] failed', { userId: clerkUserId, error: err?.message });
      return res.status(500).json({ received: false, error: 'Profile provisioning failed' });
    }
  }

  // Handle user.deleted event (optional - for cleanup)
  if (payload.type === 'user.deleted') {
    const { id: clerkUserId } = payload.data as any;
    
    // Optional: Delete or soft-delete the profile
    // For now, just acknowledge
    return res.json({ received: true, action: 'user_deleted_acknowledged' });
  }

  // Acknowledge other events we don't handle
  return res.json({ received: true, action: 'event_not_handled' });
}
