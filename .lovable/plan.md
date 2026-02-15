

## Fix: Migration Safety Rewrite

### Problem
The migration `20260215091237_...sql` uses bare `CREATE TABLE` for 5 tables that already exist in production (`profiles`, `credit_transactions`, `essays`, `essay_analysis_reports`, `essay_revision_history`). Running this would destroy existing data and columns.

### Environment Variable Status
All 4 code files already use `VITE_SUPABASE_ANON_KEY` correctly:
- `src/integrations/supabase/client.ts` -- already correct
- `src/services/credits/creditsService.ts` -- already correct  
- `src/components/BugReportWidget.tsx` -- already correct
- `src/App.tsx` -- already correct

The `supabaseUrl is required` runtime error is caused by the auto-generated `.env` not being present. This resolves when Lovable Cloud syncs the environment. No code changes needed for this.

### Migration Rewrite

Rewrite `supabase/migrations/20260215091237_784d3a47-0bde-4361-b8ba-e99be99e90a4.sql`:

1. **Remove entirely**: `CREATE TABLE` + `ALTER TABLE ENABLE RLS` + `CREATE POLICY` blocks for `profiles`, `credit_transactions`, `essays`, `essay_analysis_reports`, `essay_revision_history` (lines 6-269). These tables exist with richer schemas in production.

2. **Change to `CREATE TABLE IF NOT EXISTS`**: The 7 new tables (`personal_information`, `academic_journey`, `experiences_activities`, `personal_growth`, `family_responsibilities`, `goals_aspirations`, `support_network`).

3. **Wrap RLS policies** for those 7 tables using `DROP POLICY IF EXISTS` then `CREATE POLICY` pattern.

4. **Keep** the `CREATE OR REPLACE FUNCTION update_updated_at_column()` as-is (already safe).

5. **Wrap all triggers** in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` blocks. Only include triggers for the 7 new tables (the existing tables' triggers already exist).

### Technical Details

**File modified:**
- `supabase/migrations/20260215091237_784d3a47-0bde-4361-b8ba-e99be99e90a4.sql` -- full rewrite

**No changes needed:**
- `supabase/migrations/20260215091256_...` (already uses `ADD COLUMN IF NOT EXISTS`)
- All 4 env var files (already correct)
- `supabase/functions/notify-new-signin/index.ts` (already fixed)

