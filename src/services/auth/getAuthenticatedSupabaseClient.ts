/**
 * Authenticated Supabase Client Factory
 *
 * Creates a Supabase client with Clerk JWT authentication headers
 * This ensures RLS policies can verify the user via auth.jwt() ->> 'sub'
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { SUPABASE_URL } from '@/integrations/supabase/client';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbGFwbHBrdXZ4a3Jkd3NncnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NDUsImV4cCI6MjA3MTMxNjY0NX0.LN3_avY7B0UnwCVEza9B5M9_EG3GMWlRFwQsZ8yq8Vc";

/**
 * Get a Supabase client with Clerk JWT authentication
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @returns Authenticated Supabase client
 */
export function getAuthenticatedSupabaseClient(
  clerkToken: string
): SupabaseClient<Database> {
  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

/**
 * Helper to verify JWT contains required claims
 */
export function verifyClerkToken(token: string): boolean {
  try {
    // Decode JWT (don't verify signature - Supabase will do that)
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check for 'sub' claim (Clerk user ID)
    if (!payload.sub || !payload.sub.startsWith('user_')) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
