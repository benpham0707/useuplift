import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

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
 * - user.created: Creates a profile row in Supabase, or re-links an orphaned profile
 *   if the user previously had an account with the same email
 * - user.deleted: Soft-deletes the profile (sets deleted_at timestamp)
 *   Data is preserved so returning users can recover their account
 * 
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks > Add Endpoint
 * 2. URL: https://uplift-backend-cyqk.onrender.com/api/v1/webhooks/clerk
 * 3. Select events: user.created, user.deleted
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
    const { id: clerkUserId, email_addresses, first_name, last_name } = payload.data as any;
    const primaryEmail = email_addresses?.[0]?.email_address;

    try {
      // Check if profile already exists with this Clerk ID (idempotency)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', clerkUserId)
        .maybeSingle();

      if (existingProfile) {
        return res.json({ received: true, action: 'profile_exists' });
      }

      // Check if there's an orphaned profile with the same email (user re-registering)
      // This handles the case where a user was deleted from Clerk but their data remains
      if (primaryEmail) {
        const { data: orphanedProfile } = await supabase
          .from('personal_information')
          .select('profile_id, profiles!inner(id, user_id, deleted_at)')
          .eq('primary_email', primaryEmail.toLowerCase())
          .not('profiles.deleted_at', 'is', null) // Only match soft-deleted profiles
          .maybeSingle();

        if (orphanedProfile?.profile_id) {
          // Re-link the orphaned profile to the new Clerk user ID
          const { error: relinkError } = await supabase
            .from('profiles')
            .update({ 
              user_id: clerkUserId,
              deleted_at: null, // Reactivate the profile
              updated_at: new Date().toISOString()
            })
            .eq('id', orphanedProfile.profile_id);

          if (relinkError) {
            return res.json({ received: true, error: relinkError.message });
          }

          return res.json({ 
            received: true, 
            action: 'profile_relinked', 
            profileId: orphanedProfile.profile_id,
            message: 'Existing profile restored for returning user'
          });
        }
      }

      // Create new profile for first-time user
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
        // Return 200 anyway to prevent Clerk from retrying
        return res.json({ received: true, error: insertError.message });
      }

      return res.json({ received: true, action: 'profile_created', profileId: newProfile.id });

    } catch (err: any) {
      // Return 200 to prevent retry loops
      return res.json({ received: true, error: err?.message });
    }
  }

  // Handle user.deleted event - Soft delete to preserve data
  if (payload.type === 'user.deleted') {
    const { id: clerkUserId } = payload.data as any;
    
    try {
      // Soft delete: Mark profile as deleted but preserve all data
      // If the user re-registers with the same email, their profile will be restored
      const { error: softDeleteError } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', clerkUserId);

      if (softDeleteError) {
        return res.json({ received: true, error: softDeleteError.message });
      }

      return res.json({ received: true, action: 'profile_soft_deleted' });
    } catch (err: any) {
      return res.json({ received: true, error: err?.message });
    }
  }

  // Acknowledge other events we don't handle
  return res.json({ received: true, action: 'event_not_handled' });
}
