import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Delete user account
 * 
 * This endpoint:
 * 1. Soft-deletes the Supabase profile (preserves data)
 * 2. Deletes the Clerk user (prevents immediate re-login)
 * 
 * When the user tries to sign up again with the same email:
 * - The webhook will detect the orphaned profile
 * - Restore their old profile (with existing credits, NOT new free credits)
 * - They won't be able to exploit free credits by deleting/recreating
 */
export async function deleteAccount(req: Request, res: Response) {
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    return res.status(500).json({ error: 'Clerk not configured for account deletion' });
  }

  try {
    // Step 1: Soft-delete the Supabase profile
    // This preserves all user data (essays, credits, etc.) for potential restoration
    const { error: supabaseError } = await supabase
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (supabaseError) {
      console.error('Failed to soft-delete profile:', supabaseError);
      return res.status(500).json({ error: 'Failed to delete profile data' });
    }

    // Step 2: Delete the Clerk user
    // This prevents the user from immediately logging back in
    // They would need to sign up again (which triggers the re-link flow)
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!clerkResponse.ok) {
      const errorText = await clerkResponse.text();
      console.error('Failed to delete Clerk user:', errorText);
      // Don't fail the whole request - profile is already soft-deleted
      // User can still be cleaned up manually
      return res.json({ 
        success: true, 
        warning: 'Profile deleted but Clerk account may still exist',
        message: 'Your account has been deleted. If you sign up again with the same email, your data will be restored.'
      });
    }

    return res.json({ 
      success: true,
      message: 'Your account has been deleted. If you sign up again with the same email, your data will be restored (but you will not receive new free credits).'
    });

  } catch (error: any) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
}

/**
 * Check if user is a returning user (has orphaned profile)
 * 
 * This can be called after sign-up to check if the user's profile was restored
 * and show them an appropriate message
 */
export async function checkReturningUser(req: Request, res: Response) {
  const userId = (req as any).auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Check if this profile was recently restored (deleted_at was null-ed recently)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, credits, updated_at, created_at')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.json({ isReturningUser: false });
    }

    // If updated_at is much more recent than created_at, might be a restored account
    const createdAt = new Date(profile.created_at).getTime();
    const updatedAt = new Date(profile.updated_at).getTime();
    const timeDiff = updatedAt - createdAt;
    
    // If the profile was updated significantly after creation (more than 1 day),
    // and has non-standard credits, it's likely a restored account
    const isLikelyRestored = timeDiff > 24 * 60 * 60 * 1000 && profile.credits !== 10;

    return res.json({ 
      isReturningUser: isLikelyRestored,
      credits: profile.credits,
      message: isLikelyRestored 
        ? 'Welcome back! Your previous account data has been restored.'
        : undefined
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

