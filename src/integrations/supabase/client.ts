/**
 * Supabase Client
 *
 * SECURITY: All credentials are loaded from environment variables.
 * No hardcoded fallbacks - missing credentials will cause clear errors.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables (Vite uses import.meta.env)
const VITE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const VITE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// SECURITY: Require credentials from environment, no hardcoded fallbacks
export const SUPABASE_URL = VITE_URL;
export const SUPABASE_PUBLISHABLE_KEY = VITE_ANON;

// Check for configuration errors
export function getSupabaseConfigErrors(): string[] {
  const errors: string[] = [];
  if (!SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }
  return errors;
}

// Validate configuration
const configErrors = getSupabaseConfigErrors();
if (configErrors.length > 0) {
  console.error('[Supabase] CRITICAL: Missing configuration:', configErrors);
}

// Create client only if configured
export const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null as any; // Will cause clear errors if used without proper configuration
