

## Fix: Migration Safety + Edge Function Build Error

### 1. Environment Variable Names (Already Fixed)
The last diff shows all 4 files have already been updated from `VITE_SUPABASE_PUBLISHABLE_KEY` to `VITE_SUPABASE_ANON_KEY`. No further changes needed here.

### 2. Migration Safety (20260215091237)
Rewrite the migration to avoid destroying existing production tables:

- **Remove** bare `CREATE TABLE` for these 5 existing tables: `profiles`, `credit_transactions`, `essays`, `essay_analysis_reports`, `essay_revision_history`. Also remove their associated `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements (they already exist).
- **Change** to `CREATE TABLE IF NOT EXISTS` for the 7 new tables: `personal_information`, `academic_journey`, `experiences_activities`, `personal_growth`, `family_responsibilities`, `goals_aspirations`, `support_network`. Keep their RLS/policy statements but wrap in `DO $$ ... EXCEPTION` blocks.
- **Wrap** each trigger in a safe block:
  ```sql
  DO $$ BEGIN
    CREATE TRIGGER ...;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ```
- Keep the `CREATE OR REPLACE FUNCTION` for `update_updated_at_column` as-is (it's already safe).

### 3. Edge Function Build Error (notify-new-signin)
The build error is a Deno type-checking issue in `supabase/functions/notify-new-signin/index.ts`. Line 55 has a missing statement after the `if (upsertErr)` check -- there's no block or statement, causing the next comment/line to be parsed incorrectly.

**Fix**: Add a no-op or logging statement after `if (upsertErr)`:
```typescript
if (upsertErr) {
  console.error('Upsert error:', upsertErr);
}
```

### Technical Details

**Files to modify:**
1. `supabase/migrations/20260215091237_784d3a47-0bde-4361-b8ba-e99be99e90a4.sql` -- full rewrite removing existing table creates, adding IF NOT EXISTS and trigger safety wrappers
2. `supabase/functions/notify-new-signin/index.ts` -- fix the dangling `if` on line 55

**No changes needed:**
- `supabase/migrations/20260215091256_...` (already uses `ADD COLUMN IF NOT EXISTS`)
- The 4 env var files (already fixed per the diff)

