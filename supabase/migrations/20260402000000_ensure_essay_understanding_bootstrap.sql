-- Defensive bootstrap for Supabase branch-preview environments.
--
-- Supabase branch previews don't always carry main's migrations, so the
-- ALTER in 20260402000001 fails with "relation essay_understanding does
-- not exist". This migration idempotently ensures the table exists.
--
-- NOTE: FK to essays(id) is intentionally omitted here — on preview
-- environments the essays table may not exist either, which would silently
-- roll back the entire CREATE. Production and local environments already
-- have the full table (FK, indexes, RLS, triggers) from 20260304000002;
-- the CREATE TABLE IF NOT EXISTS below is a no-op there. The column
-- ADDs that follow are the actual contribution.

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

ALTER TABLE essay_understanding
  ADD COLUMN IF NOT EXISTS coaching_state JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_cache JSONB DEFAULT NULL;
