/**
 * Safe Supabase Client Wrapper
 *
 * Uses lazy initialization to avoid creating the client at module-load time.
 * Fails CLOSED if the Supabase env config is missing — we do NOT fall back to a
 * hardcoded project, because that silently connects to the WRONG Supabase
 * project and masks a deploy misconfiguration.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clerkAuthFetch } from './clerkAuthFetch';

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      // Fail loud at first use (not at module load) so a misconfigured deploy is
      // obvious instead of silently talking to an unknown project.
      throw new Error(
        '[safeClient] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
        'Refusing to start with an unconfigured Supabase client. Set these env ' +
        'vars (e.g. in the deploy environment) and redeploy.'
      );
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
