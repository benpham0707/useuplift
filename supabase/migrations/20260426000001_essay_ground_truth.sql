-- =====================================================
-- ESSAY GROUND TRUTH — Phase 0 D-0.7
-- =====================================================
-- Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md §4.6
--   ("Table: essay_ground_truth — one row per GroundTruthFact / StoryFragment
--    / IntentSignal, with foreign key to essay profile and digQuestionId
--    reference.")
-- Contract: INTEGRATED_BUILD_SEQUENCE.md D-0.7 / L5_IMPLEMENTATION_PLAN §2 D-0.7.
--
-- Durable per-record store for the three Conversator-captured types
-- (D-0.3): GroundTruthFact, StoryFragment, IntentSignal. Survives
-- iterations as first-class durable state per L5_E2E_INTEGRITY_AUDIT §5.3.
-- Compact array copies also live on EssayProfile root (D-0.5) for fast
-- analysis-prompt access; this table is the durable source of truth.
--
-- Auth: Clerk JWT via auth.jwt() ->> 'sub'.
--
-- Spec divergences from build-sequence prose, applied to mirror activity
-- precedent + the essay_understanding pattern:
--   - profile_id is UUID FK → profiles.id (build-sequence prose said
--     "text fk"; precedent + spec language "Schema mirrors activity-side"
--     both call for UUID FK to id).
--   - essay_id is UUID FK → essays.id (essays.id is UUID).
--   - confidence is constrained to ('high' | 'medium' | 'low') matching
--     GroundTruthFact.confidence (D-0.3); the contract said "text" with
--     no constraint, but the field's domain is strictly ternary, and
--     adding the CHECK now beats adding it later.
-- =====================================================

-- =====================================================
-- 1. TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.essay_ground_truth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  -- One of D-0.3's three durable record types. record_data JSONB carries
  -- the type-specific shape; the discriminator here drives index hits
  -- and consumer routing.
  record_type TEXT NOT NULL CHECK (record_type IN ('fact', 'fragment', 'intent')),
  record_data JSONB NOT NULL,
  -- Links into UnderstandingQuestion.id (D-0.2). NULL when the record
  -- was a spontaneous correction-of-fact rather than a dig answer
  -- (per L5_E2E_INTEGRITY_AUDIT §4.7).
  dig_question_id TEXT,
  -- Optional anchors. Both NULL = essay-level. paragraph populated
  -- without sentence = paragraph-level. Used by the consumer-routing
  -- prompts so analysis layers can scope the record to its locus.
  applies_to_paragraph INT,
  applies_to_sentence INT,
  -- Confidence is a closed ternary for facts; for fragments / intents
  -- the field may be NULL (extractor doesn't always emit confidence
  -- on those shapes — see GroundTruthFact only carries confidence in D-0.3).
  confidence TEXT CHECK (confidence IS NULL OR confidence IN ('high', 'medium', 'low')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- updated_at supports the supersededBy linking pattern: when a student
  -- corrects an earlier fact, the OLDER fact's record_data gets
  -- supersededBy set via UPDATE — updated_at audits when (security
  -- review S5).
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

-- Primary read path: analysis layers fetching all records for an essay
-- of a given type (e.g., "all GroundTruthFacts for essay X to inject as
-- a cached block in the L3 prompt").
CREATE INDEX IF NOT EXISTS idx_essay_ground_truth_profile_essay_type
  ON public.essay_ground_truth(profile_id, essay_id, record_type);

-- Secondary read path: dig answer extractor / queue consumer joining
-- back to UnderstandingQuestion.dig.
CREATE INDEX IF NOT EXISTS idx_essay_ground_truth_dig_question
  ON public.essay_ground_truth(dig_question_id)
  WHERE dig_question_id IS NOT NULL;

-- =====================================================
-- 3. UPDATED_AT TRIGGER
-- Reuses set_timestamp() from 20260219000000_activity_profiles_and_chat.sql.
-- =====================================================

DO $$ BEGIN
  CREATE TRIGGER essay_ground_truth_set_timestamp
  BEFORE UPDATE ON public.essay_ground_truth
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- Same two-check tenancy pattern as essay_chat_conversations:
-- profile_id AND essay_id must both belong to the caller.
-- =====================================================

ALTER TABLE public.essay_ground_truth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerk: Users can view own essay ground truth" ON public.essay_ground_truth
  FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY "Clerk: Users can insert own essay ground truth" ON public.essay_ground_truth
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

-- UPDATE is allowed because supersededBy linking modifies record_data
-- on the older fact when a student corrects (per L5_E2E_INTEGRITY_AUDIT
-- §5.3). The updated_at trigger captures when. WITH CHECK prevents the
-- update from rewriting profile_id / essay_id to a victim's tenant.
CREATE POLICY "Clerk: Users can update own essay ground truth" ON public.essay_ground_truth
  FOR UPDATE TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY "Clerk: Users can delete own essay ground truth" ON public.essay_ground_truth
  FOR DELETE TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY "Service role full access - essay ground truth" ON public.essay_ground_truth
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 5. GRANTS
-- =====================================================

REVOKE ALL ON public.essay_ground_truth FROM PUBLIC;
REVOKE ALL ON public.essay_ground_truth FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.essay_ground_truth TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.essay_ground_truth IS
  'Durable per-record store for D-0.3 Conversator-captured types: GroundTruthFact / StoryFragment / IntentSignal. record_type discriminates; record_data JSONB carries the type-specific shape. Survives iterations per L5_E2E_INTEGRITY_AUDIT §5.3.';

COMMENT ON COLUMN public.essay_ground_truth.record_data IS
  'Type-specific JSONB matching the D-0.3 type for record_type: fact → GroundTruthFact, fragment → StoryFragment, intent → IntentSignal.';

COMMENT ON COLUMN public.essay_ground_truth.dig_question_id IS
  'UnderstandingQuestion.id (D-0.2) that prompted this answer. NULL for spontaneous corrections-of-fact captured by the continuous-chat handler (L5_E2E_INTEGRITY_AUDIT §4.7).';
