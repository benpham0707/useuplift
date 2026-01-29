/**
 * Supabase Client
 *
 * SECURITY: All credentials are loaded from environment variables.
 * No hardcoded fallbacks - missing credentials will cause clear errors.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables (Vite uses import.meta.env)
const VITE_URL = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
const VITE_ANON = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// SECURITY: Require credentials from environment, no hardcoded fallbacks
export const SUPABASE_URL = VITE_URL;
export const SUPABASE_PUBLISHABLE_KEY = VITE_ANON;

// Validate configuration
if (!SUPABASE_URL) {
  console.error('[Supabase] CRITICAL: VITE_SUPABASE_URL is not configured');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('[Supabase] CRITICAL: VITE_SUPABASE_ANON_KEY is not configured');
}

// Create client only if configured (will throw clear errors if used without config)
export const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null as any; // Will cause clear errors if used without proper configuration
