# Prepared fix — `safeClient` wrong-project fallback → fail closed (Exit 7b)

**Status:** ✅ IMPLEMENTED in **PR #38** (`safeClient.ts` + `creditsService.ts` —
fallback removed, fail-closed throw). This file is the rationale record.
**Risk:** low, no DB change. App-code only.

## Problem
`src/integrations/supabase/safeClient.ts:13` hardcodes a **different** Supabase
project as a fallback:
```ts
const FALLBACK_URL = 'https://wrppjajhxiftzddeeqsk.supabase.co';
const FALLBACK_KEY = 'eyJ…ref":"wrppjajhxiftzddeeqsk"…';  // anon JWT of the WRONG project
```
If `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing at load (exactly the
condition suspected in the Vercel 0s failure), the app **silently connects to an
unknown project** instead of failing — masking the misconfig and risking writes to
the wrong DB. `src/services/credits/creditsService.ts:14` carries the same constant.

## Fix — fail closed (matches CLAUDE.md "no degraded fallbacks")
Replace the fallback constants + lazy init in `safeClient.ts`:
```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clerkAuthFetch } from './clerkAuthFetch';

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // Fail loud at first use (NOT at module load — preserves the lazy-init intent)
      throw new Error(
        '[safeClient] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
        'Refusing to start with an unconfigured Supabase client. ' +
        'Set these env vars (e.g. in the Vercel project) and redeploy.'
      );
    }
    _client = createClient<Database>(url, key, {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
      global: { fetch: clerkAuthFetch },
    });
  }
  return _client;
}
// keep the existing Proxy export unchanged
```
Apply the analogous removal of `FALLBACK_URL`/`FALLBACK_KEY` in
`creditsService.ts` (use the env values directly; throw if absent).

## Verify
- `npx tsc --noEmit` clean.
- `npm run build` (vite) clean with env present.
- Grep proves the wrong project id is gone:
  `grep -rn wrppjajhxiftzddeeqsk src` → 0 matches.
- Negative test: build/run with `VITE_SUPABASE_URL` unset → first `supabase.from()`
  throws the explicit error (no silent connection to `wrppjajhxiftzddeeqsk`).

## Why not applied now
Operator chose to keep hardening **documented only** this iteration, and `safeClient.ts`
is owned by the still-open PR #36 — editing it here would create a conflicting parallel
change. Fold this into #36 (or a stacked follow-up) when the security PR is next touched.
