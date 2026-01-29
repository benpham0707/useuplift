/**
 * Authenticated Supabase Client Factory
 *
 * Creates a Supabase client with Clerk JWT authentication headers.
 * This ensures RLS policies can verify the user via auth.jwt() ->> 'sub'
 *
 * SECURITY: All credentials loaded from environment variables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// SECURITY: Load credentials from environment only
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Validate at module load
if (!SUPABASE_URL) {
  console.error('[AuthSupabase] CRITICAL: SUPABASE_URL is not configured');
}
if (!SUPABASE_ANON_KEY) {
  console.error('[AuthSupabase] CRITICAL: SUPABASE_ANON_KEY is not configured');
}

/**
 * Get a Supabase client with Clerk JWT authentication
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @returns Authenticated Supabase client
 * @throws Error if Supabase is not configured
 */
export function getAuthenticatedSupabaseClient(
  clerkToken: string
): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  }

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
 *
 * SECURITY: This only checks structure, not signature.
 * Signature verification should be done by Clerk SDK.
 */
export function verifyClerkTokenStructure(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (don't verify signature - Supabase/Clerk will do that)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Check for 'sub' claim (Clerk user ID)
    if (!payload.sub || typeof payload.sub !== 'string') {
      return false;
    }

    // Check if it looks like a Clerk user ID
    if (!payload.sub.startsWith('user_')) {
      return false;
    }

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
