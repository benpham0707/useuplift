-- Defensive bootstrap for Supabase branch-preview environments.
--
-- Why this exists: Supabase branch previews don't carry main's migration
-- history into the branch DB, and once a migration filename has been seen
-- on a PR it is cached — edits to the file are not re-applied. The ALTER
-- in 20260402000001_add_coaching_persistence_columns.sql therefore fails
-- on preview branches with "relation essay_understanding does not exist"
-- (the underlying CREATE from 20260304000002 never ran in the preview DB).
--
-- This migration is a new filename (so it gets pushed) that idempotently
-- ensures the essay_understanding table and the two coaching-persistence
-- columns exist. Production and local environments already have both —
-- every statement below is CREATE/ADD IF NOT EXISTS and is a no-op there.

CREATE TABLE IF NOT EXISTS essay_understanding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT essay_understanding_unique_active UNIQUE (essay_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_essay_understanding_user_id ON essay_understanding(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_essay_id ON essay_understanding(essay_id);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_text_hash ON essay_understanding(text_hash);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_updated_at ON essay_understanding(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_jsonb ON essay_understanding USING gin (understanding jsonb_path_ops);

ALTER TABLE essay_understanding
  ADD COLUMN IF NOT EXISTS coaching_state JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_cache JSONB DEFAULT NULL;

ALTER TABLE essay_understanding ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'essay_understanding'
      AND policyname = 'Users can view own essay understanding'
  ) THEN
    CREATE POLICY "Users can view own essay understanding"
      ON essay_understanding FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'essay_understanding'
      AND policyname = 'Users can insert own essay understanding'
  ) THEN
    CREATE POLICY "Users can insert own essay understanding"
      ON essay_understanding FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'essay_understanding'
      AND policyname = 'Users can update own essay understanding'
  ) THEN
    CREATE POLICY "Users can update own essay understanding"
      ON essay_understanding FOR UPDATE
      USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'essay_understanding'
      AND policyname = 'Users can delete own essay understanding'
  ) THEN
    CREATE POLICY "Users can delete own essay understanding"
      ON essay_understanding FOR DELETE
      USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'essay_understanding'
      AND policyname = 'Service role full access to essay understanding'
  ) THEN
    CREATE POLICY "Service role full access to essay understanding"
      ON essay_understanding FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_essay_understanding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_essay_understanding_updated_at'
  ) THEN
    CREATE TRIGGER trigger_essay_understanding_updated_at
      BEFORE UPDATE ON essay_understanding
      FOR EACH ROW
      EXECUTE FUNCTION update_essay_understanding_updated_at();
  END IF;
END $$;
