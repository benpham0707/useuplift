/**
 * Safe Supabase Client Wrapper
 * 
 * Uses lazy initialization to prevent crashes when environment variables
 * are missing at module load time. Falls back to hardcoded publishable
 * (public) keys as a last resort.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clerkAuthFetch } from './clerkAuthFetch';

// Hard-coded fallback values (these are publishable/public keys, safe to embed)
const FALLBACK_URL = 'https://wrppjajhxiftzddeeqsk.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycHBqYWpoeGlmdHpkZGVlcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTI2NTcsImV4cCI6MjA4NjY4ODY1N30.cFgyAcfDn6e15KYr_xpiLwfgyUJyOSlE9PoHD3aXhhs';

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

    if (!import.meta.env.VITE_SUPABASE_URL) {
      console.warn('[safeClient] VITE_SUPABASE_URL missing, using fallback');
    }
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('[safeClient] VITE_SUPABASE_ANON_KEY missing, using fallback');
    }

    _client = createClient<Database>(url, key, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
      // Authenticate Data API requests as the Clerk user so RLS
      // (auth.jwt() ->> 'sub') applies. Falls back to anon when logged out.
      global: {
        fetch: clerkAuthFetch,
      },
    });
  }
  return _client;
}

// Proxy provides backward-compatible `supabase.from(...)` usage
// without eagerly creating the client at import time
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
