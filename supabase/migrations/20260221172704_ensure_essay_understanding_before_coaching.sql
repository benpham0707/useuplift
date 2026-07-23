-- Preflight for branch previews that do not replay the original
-- essay_understanding migration before the coaching-persistence migration.
--
-- This version intentionally sorts immediately before
-- 20260402000001_add_coaching_persistence_columns.sql, the first migration
-- that alters this table. In complete production histories the CREATE is a
-- no-op. In a clean preview it provides the minimal, secure table required by
-- the subsequent migration. The production migration that originally created
-- this table remains authoritative for its FK, indexes, and trigger.

CREATE TABLE IF NOT EXISTS public.essay_understanding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL,
  user_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  essay_type text NOT NULL,
  text_hash text NOT NULL,
  understanding jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_eqi integer,
  impression_label text,
  readiness_level text,
  total_cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  analysis_passes jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_analysis_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT essay_understanding_unique_active UNIQUE (essay_id, user_id)
);

-- A preview-created public table must remain closed to browser roles.
ALTER TABLE public.essay_understanding ENABLE ROW LEVEL SECURITY;
