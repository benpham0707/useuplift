

## Fix: BugReportWidget Import Error

### Problem
`BugReportWidget.tsx` imports `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` directly from `src/integrations/supabase/client.ts`, but that auto-generated file does not export those constants. Since we cannot edit the auto-generated client file, we need to fix the import in BugReportWidget.

### Solution
Update `src/components/BugReportWidget.tsx` (line 15) to read the values from `import.meta.env` directly instead of importing from the client file:

**Change line 15 from:**
```ts
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
```

**To:**
```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

This is a one-line fix. No other files need changes.

