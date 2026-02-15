

## Fix: Clerk "Missing Publishable Key" Error

### Problem
The `.env` file is auto-managed and keeps getting removed. When it's gone, `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` is `undefined`, and `main.tsx` blocks the entire app with the error page you're seeing.

The `VITE_CLERK_PUBLISHABLE_KEY` secret IS configured in Lovable Cloud, but Vite needs it in a physical `.env` file to inject it at build time.

### Solution

**1. Recreate `.env` with all required variables**

Restore the `.env` file with all three Supabase vars plus the Clerk key. The Clerk key value will need to come from the configured secret.

**2. Make `main.tsx` and `clerk.ts` resilient (the real fix)**

Apply the same lazy/fallback pattern we used for Supabase:
- Remove the aggressive error gate in `main.tsx` that blocks the entire app
- Instead, allow the app to render and handle missing Clerk config gracefully (e.g., redirect to a sign-in prompt rather than a dead error page)
- If the key is available, use it normally; if not, show a user-friendly message inside the app rather than replacing the entire DOM

### Files to Modify

| File | Change |
|------|--------|
| `.env` | Recreate with `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` |
| `src/main.tsx` | Remove the error gate that replaces the DOM; always render the React app |
| `src/config/clerk.ts` | Keep validation logic but remove the side-effect console logging at module level that runs before the app mounts |
| `src/App.tsx` | Add a top-level check: if Clerk key is missing, show an in-app error component instead of crashing |

### Technical Details

In `main.tsx`, replace the current pattern:
- Remove the `if (!clerkConfig.isValid)` block that writes raw HTML and throws
- Always render `ClerkProvider` — if the key is empty string, Clerk will show its own error but won't crash the app
- Alternatively, conditionally wrap with `ClerkProvider` only when the key exists, and show a fallback UI component otherwise

This ensures the app always boots into React, making it debuggable and recoverable rather than a dead HTML error page.
