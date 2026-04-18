-- Preview-env repair: guarantee `essay_understanding` exists before any
-- downstream migration tries to ALTER it.
--
-- Root cause: the canonical table-creating migration at
-- 20260304000002_add_essay_understanding.sql uses
--   `essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE`
-- On Supabase branch-preview environments the `essays` table is often
-- missing (preview DBs don't reliably inherit main's migration history),
-- so the FK target resolution fails, Postgres silently rolls back the
-- CREATE, and the table never exists. Downstream migrations (like
-- 20260402000001) then fail with "relation essay_understanding does not
-- exist" (SQLSTATE 42P01).
--
-- Prior workarounds (20260402000000 bootstrap + 20260402000001 inline
-- CREATE) tried to fix this by creating the table without FK at later
-- timestamps — but Supabase's migration cache appears to have sealed the
-- broken state from an earlier run, so re-running the fixed versions of
-- those files doesn't produce a fresh execution. A NEW migration
-- filename has no cache entry and IS guaranteed to run.
--
-- This migration is idempotent and safe in every environment:
--   - Production / local dev: the real table already exists from
--     20260304000002 with full FK + indexes + RLS; the CREATE IF NOT
--     EXISTS is a no-op, the FK is preserved.
--   - Preview branch DBs where CREATE silently failed earlier: this
--     creates the table without FK so the branch can bring up enough
--     schema to run CI checks.
--
-- The FK to essays(id) is intentionally omitted — see prior files
-- 20260402000000 and 20260402000001 for the same reasoning.

CREATE TABLE IF NOT EXISTS essay_understanding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  essay_type TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  understanding JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_eqi INTEGER,
  impression_label TEXT,
  readiness_level TEXT,
  total_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  analysis_passes JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_analysis_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add the coaching-persistence columns in the same migration so preview
-- environments don't need 20260402000001 to run correctly to pass CI.
ALTER TABLE essay_understanding
  ADD COLUMN IF NOT EXISTS coaching_state JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_cache JSONB DEFAULT NULL;
