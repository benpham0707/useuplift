

## Fix White Screen — Root Causes and Plan

### What's Wrong

The white screen has **three causes**, two of which require YOUR action:

---

### 1. Missing Supabase Secrets (YOU need to do this)

Your Lovable project currently only has these secrets configured:
- ANTHROPIC_API_KEY
- LOVABLE_API_KEY

It is **missing**:
- `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

**How to add them:**
1. Go to your Lovable project settings (gear icon)
2. Navigate to "Environment Variables" or "Secrets"
3. Add `VITE_SUPABASE_URL` with your Supabase project URL
4. Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key

You can find both values in your Supabase dashboard under Project Settings > API.

Without these, the app deliberately blocks rendering (the `ConfigError` component in `App.tsx` catches this).

---

### 2. Missing Clerk Secret (YOU need to do this)

`VITE_CLERK_PUBLISHABLE_KEY` also needs to be added as a secret in Lovable. You can find this in your Clerk dashboard under API Keys.

---

### 3. Code Fixes (I will do these after you approve)

**File: `src/services/auth/getAuthenticatedSupabaseClient.ts`**
- Line 68: Replace `Buffer.from(parts[1], 'base64url').toString()` with browser-compatible `atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))` — `Buffer` is Node.js-only and crashes in the browser.

**File: `src/services/workshop/teachingLayerService.ts`**  
- Line 70: Guard the `createClient` call so it doesn't crash when env vars are missing. Change from `createClient(supabaseUrl || '', ...)` to a lazy initialization pattern that only creates the client when actually called.

---

### Summary

| Issue | Who fixes it | What |
|-------|-------------|------|
| Missing `VITE_SUPABASE_URL` | You | Add secret in Lovable project settings |
| Missing `VITE_SUPABASE_ANON_KEY` | You | Add secret in Lovable project settings |
| Missing `VITE_CLERK_PUBLISHABLE_KEY` | You | Add secret in Lovable project settings |
| `Buffer` crash in browser | Me (code fix) | Replace with `atob()` |
| `createClient('')` crash | Me (code fix) | Guard with null check |

Once you add the three secrets, approve this plan and I will make the two code fixes. The white screen should then be resolved.

