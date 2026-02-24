/**
 * Clerk Configuration Helper
 *
 * Provides the Clerk publishable key with a hardcoded fallback
 * so the app never crashes if the .env file is missing.
 */

// Hard-coded fallback publishable key (this is a PUBLIC key, safe to embed)
// HARD-CODED DATA: Clerk publishable key for the Uplift production Clerk application
const FALLBACK_CLERK_KEY = 'pk_live_Y2xlcmsudXBsaWZ0LWFwcC5jb20k';

export const CLERK_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || FALLBACK_CLERK_KEY;

/**
 * Returns true if a valid Clerk key is available.
 */
export function hasClerkKey(): boolean {
  return !!CLERK_PUBLISHABLE_KEY;
}
