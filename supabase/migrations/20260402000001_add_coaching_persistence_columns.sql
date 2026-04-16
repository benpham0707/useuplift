-- Cross-Session Coaching Persistence
-- Adds coaching_state and profile_cache columns to essay_understanding.
-- coaching_state: persists CoachingSessionMemory between sessions.
-- profile_cache: caches EssayProfile to skip re-analysis on unchanged text.
--
-- Defensive table guard: Supabase branch-preview environments do not always
-- carry upstream migrations from main into the branch DB, so the ALTER below
-- can fail with "relation does not exist" on fresh preview branches even
-- though production / local dev have the table from 20260304000002. We
-- inline CREATE TABLE IF NOT EXISTS so this migration is self-sufficient:
-- production and local environments see a no-op CREATE and then apply the
-- new columns; preview environments that don't have the table get both
-- the table and the columns in one step.

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

ALTER TABLE essay_understanding
  ADD COLUMN IF NOT EXISTS coaching_state JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_cache JSONB DEFAULT NULL;

COMMENT ON COLUMN essay_understanding.coaching_state IS
  'Full CoachingSessionMemory + LearningStyleObservations. Persisted per coaching turn.';
COMMENT ON COLUMN essay_understanding.profile_cache IS
  'Cached EssayProfile from last analysis pipeline. Used to skip re-analysis when text_hash matches.';
