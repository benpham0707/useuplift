/**
 * Clerk-authenticated fetch for the shared Supabase clients.
 *
 * WHY: Uplift authenticates with Clerk, not Supabase Auth. Postgres RLS resolves
 * the current user via `auth.jwt() ->> 'sub'` (the Clerk user id). For RLS to see
 * the user, every Supabase Data API request must carry the Clerk-issued session
 * token in the Authorization header. The shared browser clients
 * (`safeClient.ts`, `client.ts`) previously sent only the anon key, so all their
 * requests ran as `anon` — which is why the database had to be left wide open and
 * triggered the CRITICAL rls_disabled_in_public advisory.
 *
 * This wrapper attaches the Clerk token to each request (overriding the default
 * anon Authorization header). When the user is logged out, no token is available
 * and the request proceeds anonymously (anon key) — correct for public data
 * (e.g. the `colleges` reference table) and denied for everything user-scoped.
 *
 * We intentionally use a custom fetch instead of supabase-js's `accessToken`
 * option: the codebase calls `supabase.auth.getUser()/getSession()` in ~40 places,
 * and the `accessToken` option makes those calls throw. The fetch wrapper keeps
 * them working (returning a null Clerk-less session) while still authenticating
 * Data API calls as the Clerk user.
 *
 * Clerk's native Supabase integration validates this session token through the
 * Clerk JWKS configured in Supabase Third-Party Auth. Do not use the deprecated
 * `supabase` JWT template here: its signing algorithm/key can drift from the
 * Supabase verifier and surface as PGRST301 before RLS is evaluated.
 */
export async function clerkAuthFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (typeof window !== 'undefined') {
    try {
      const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
      const token = clerk?.session
        ? await clerk.session.getToken()
        : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Fall back to anonymous: leave the default anon-key Authorization intact.
    }
  }

  return fetch(input, { ...init, headers });
}
