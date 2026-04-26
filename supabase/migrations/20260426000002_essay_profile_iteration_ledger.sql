-- =====================================================
-- ESSAYPROFILE JSONB BACKFILL — Phase 0 D-0.8
-- =====================================================
-- Spec: INTEGRATED_BUILD_SEQUENCE.md D-0.8 / L5_IMPLEMENTATION_PLAN §2 D-0.8.
-- Companion runtime hydration: essayProfileManager.fromCheckpoint() (D-0.8 TS-side).
--
-- D-0.5 added five required fields to the EssayProfile interface:
--   iterationLedger, groundTruthFacts, storyFragments, intentSignals,
--   conversatorSessionLog.
-- Existing essay_understanding.profile_cache JSONB rows pre-date these
-- fields and lack them. New profiles (created via createInitialProfile)
-- already populate defaults; this migration backfills historical rows.
--
-- Idempotency + concurrent-write safety: the SET clause uses an in-row
-- CASE re-check (not a WHERE guard) so that when fromCheckpoint() runtime
-- hydration interleaves with the migration, the migration's right-biased
-- `||` merge cannot clobber the runtime write.
--
-- Postgres MVCC isolates per-statement reads, but a WHERE-guard pattern
-- ("WHERE NOT (profile_cache ? 'iterationLedger')") evaluates at read
-- time and can pass a row that gets written by the runtime path before
-- the migration's UPDATE commits — leaving the runtime's hydration
-- overwritten by the migration's defaults. The in-SET CASE re-evaluates
-- against the row Postgres locked for UPDATE, closing the gap.
-- (postgres-best-practices review B1)
--
-- Rerunning the migration is also safe: rows that already have
-- iterationLedger see the CASE return profile_cache unchanged.
--
-- Defaults match createInitialProfile() exactly (essayProfileManager.ts):
--   iterationLedger.currentIteration = 0 (orchestrator increments to 1
--                                         on first-pass entry)
--   iterationLedger.{iterations, taughtMoves, recentDecisions} = []
--   groundTruthFacts/storyFragments/intentSignals/conversatorSessionLog = []
--
-- The schema column already exists (essay_understanding.profile_cache,
-- added by 20260402000001_add_coaching_persistence_columns.sql:47). JSONB
-- is schema-free; the new keys land via merge without a column change.
-- =====================================================

-- =====================================================
-- 1. BACKFILL UPDATE — idempotent
-- =====================================================

UPDATE public.essay_understanding
SET profile_cache = CASE
  -- Re-check inside SET, evaluated against the row Postgres locked for
  -- UPDATE. If a concurrent runtime write populated iterationLedger
  -- between the WHERE eval and this row's lock acquisition, return the
  -- existing profile_cache untouched — never overwrite hydrated state.
  WHEN profile_cache ? 'iterationLedger' THEN profile_cache
  ELSE profile_cache || jsonb_build_object(
    'iterationLedger', jsonb_build_object(
      'currentIteration', 0,
      'iterations', '[]'::jsonb,
      'taughtMoves', '[]'::jsonb,
      'recentDecisions', '[]'::jsonb
    ),
    'groundTruthFacts', '[]'::jsonb,
    'storyFragments', '[]'::jsonb,
    'intentSignals', '[]'::jsonb,
    'conversatorSessionLog', '[]'::jsonb
  )
END
WHERE profile_cache IS NOT NULL
  AND NOT (profile_cache ? 'iterationLedger');

-- =====================================================
-- 2. POST-MIGRATION DIAGNOSTIC
-- Logs the backfill count to migration output (visible in supabase db push
-- logs and the diagnostic_canary pattern from 20260402000000_..._bootstrap).
-- Intentionally NOT a CREATE FUNCTION; this is one-shot per migration apply.
-- =====================================================

DO $$
DECLARE
  backfilled_count INT;
  total_with_cache INT;
BEGIN
  -- Count rows that ended up with iterationLedger present (post-merge).
  SELECT COUNT(*) INTO total_with_cache
  FROM public.essay_understanding
  WHERE profile_cache IS NOT NULL;

  SELECT COUNT(*) INTO backfilled_count
  FROM public.essay_understanding
  WHERE profile_cache IS NOT NULL
    AND profile_cache ? 'iterationLedger';

  RAISE NOTICE '[D-0.8 backfill] essay_understanding rows with non-NULL profile_cache: %', total_with_cache;
  RAISE NOTICE '[D-0.8 backfill] rows with iterationLedger key present (post-merge): %', backfilled_count;

  -- Sanity: every non-NULL profile_cache should now carry iterationLedger.
  IF total_with_cache <> backfilled_count THEN
    RAISE WARNING '[D-0.8 backfill] mismatch: % rows still missing iterationLedger after merge. Check for concurrent writes during migration.',
      total_with_cache - backfilled_count;
  END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN public.essay_understanding.profile_cache IS
  'EssayProfile JSONB cache. Includes Phase 0 D-0.5 root fields: iterationLedger, groundTruthFacts, storyFragments, intentSignals, conversatorSessionLog. Backfilled by 20260426000002_essay_profile_iteration_ledger.sql for historical rows. Runtime hydration fallback in EssayProfileCoordinator.fromCheckpoint() handles edge cases (NULL caches, partial backfills).';
