

## Fix: Supabase Client Crash — Safe Lazy Initialization Wrapper

### The Real Problem

The error keeps recurring because of two compounding issues:

1. The `.env` file (auto-managed by Lovable Cloud) is not present on disk, so `import.meta.env.VITE_SUPABASE_URL` is `undefined`
2. `src/integrations/supabase/client.ts` (also auto-generated) calls `createClient()` eagerly at module load — which throws immediately when the URL is undefined, crashing the entire app before anything renders

Previous fixes only recreated the `.env` file, but it keeps disappearing because it is managed by the auto-generation system. Writing it manually gets overwritten or removed.

### The Solution: Two-Pronged Approach

#### 1. Recreate `.env` (necessary but not sufficient alone)

Write the `.env` file with the correct variable names:

```
VITE_SUPABASE_PROJECT_ID="wrppjajhxiftzddeeqsk"
VITE_SUPABASE_URL="https://wrppjajhxiftzddeeqsk.supabase.co"
VITE_SUPABASE_ANON_KEY="<the anon key>"
```

#### 2. Create a safe wrapper module (the real fix)

Create `src/integrations/supabase/safeClient.ts` — a wrapper that:
- Uses lazy initialization (only creates the client when first accessed)
- Does NOT throw at module load time if env vars are missing
- Shows a clear error in the console instead of a white screen crash
- Falls back to hardcoded publishable values as a last resort (these are public keys, safe to embed)

Then update the two files that import from `client.ts`:
- `src/app/experiences/api.ts` — change import to use `safeClient`
- `src/services/credits/creditsService.ts` — already creates its own client, no change needed

Also update `src/App.tsx` to remove the config error gate that blocks the entire app, since the safe client handles this gracefully.

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.env` | Create | Restore env vars (may be overwritten, but needed) |
| `src/integrations/supabase/safeClient.ts` | Create | Lazy-init wrapper that never crashes at load time |
| `src/app/experiences/api.ts` | Modify | Import from `safeClient` instead of `client` |
| `src/App.tsx` | Modify | Remove Supabase config error gate (safe client handles it) |

### Technical Details

The safe client pattern:

```typescript
// src/integrations/supabase/safeClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hard-coded fallback values (these are publishable/public keys, safe to embed)
const FALLBACK_URL = 'https://wrppjajhxiftzddeeqsk.supabase.co';
const FALLBACK_KEY = '<anon key>';

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;
    _client = createClient<Database>(url, key, {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
    });
  }
  return _client;
}

// For backward compatibility with code doing `supabase.from(...)`
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  }
});
```

This uses a Proxy so existing code like `supabase.from('table')` works without any changes, but the actual client is only created on first use (not at import time).

### Why This Finally Fixes It

- Even if `.env` disappears again, the app will not crash — the fallback values kick in
- The lazy initialization pattern means importing the module never throws
- The Proxy preserves the exact same API as the original export
- Other services in the codebase already use this lazy pattern successfully

