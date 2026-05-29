// ============================================================================
// D-1.15 Iter-1 Setup — Build a profile with iter-1 already committed
// ============================================================================
//
// Purpose: produce a starting `EssayProfile` whose iter-1 ledger state is
// FULLY committed (snapshotText set, taughtMoves[] buffered & flushed,
// IterationRecord pushed to iterations[]) so the integration test can
// drive iter-2 against a realistic starting state.
//
// Why we don't drive iter-1 through `analyzeEssay`:
// - D-1.10's tests already proved the seam primitives compose correctly.
// - Driving the full pipeline on iter-1 would require mocking 8+ services
//   (firstImpressions, structuralCartographer, scoutPass, sequentialDeepWalk,
//   holisticSynthesis, analysisPass, crystallizer, deepAnnotationService)
//   plus auxiliary services (growthEngine, findingPromotion, manifest merge,
//   re-read step) for no additional diagnostic value at the iter-2 boundary
//   D-1.15 actually tests.
// - The seam-direct setup is FASTER, more deterministic, and forces every
//   future "the orchestrator silently changed iter-1's commit shape" bug
//   into a focused fixture-update commit rather than diffuse pipeline
//   debugging.
//
// What this setup DOES exercise (for real, not mocked):
//   - createInitialProfile: paragraph/sentence parsing + ledger seeding
//   - incrementIteration: ledger advance to currentIteration=1
//   - l5AnnotationToTaughtMove: the pure-function id-stable transformer
//     (D-1.13 contract)
//   - bufferTaughtMoves + flushTaughtMovesForIteration: real buffer
//     primitives so iter-1's moves land in iterationLedger.taughtMoves[]
//     via the same code path the orchestrator uses
//   - commitIterationDirectly: mirror of analysisOrchestrator.commitIterationRecord's
//     core mutation pattern (iterations.push + taughtMoves already-flushed),
//     same shape D-1.10's test uses
//
// What gets MOCKED at the iter-2 boundary (downstream of this setup):
//   - detectLanding (vi.mock at landingDetector module level)
//   - focusedAnalyzer.runFocusedAnalysis (vi.mock at module level)
//   - editUnderstandingService methods (vi.mock at module level)
//   - analyzeEssay / analyzeEssayWithBrief for comprehensive scenarios
//
// Per Tue's diagnosability directive (2026-04-30): each public function in
// this file does ONE thing and emits ONE clear shape. When an integration
// test fails, the failure points at a specific helper's output, not a
// composite "setup failed somewhere" mystery.

import {
  createInitialProfile,
  incrementIteration,
} from '../../../src/services/essayIntelligence/profileManager/essayProfileManager';
import {
  bufferTaughtMoves,
  flushTaughtMovesForIteration,
  l5AnnotationToTaughtMove,
  __resetTaughtMoveBufferForTesting,
} from '../../../src/services/essayIntelligence/analysis/taughtMoveBuilder';
import { __resetTelemetryForTesting } from '../../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import type {
  EssayProfile,
  IterationRecord,
  TaughtMove,
} from '../../../src/services/essayIntelligence/profileTypes';
import type { Scenario } from './scenarios';
import { applyScenarioEdit, splitParagraphs } from './scenarios';
import { buildIter1L5Annotations } from './layerFixtures';

/**
 * Stable iter-1 commit timestamps. Real orchestrator uses `new Date().toISOString()`
 * — but the integration test asserts on iter-1 ledger byte-equality across
 * iter-2's commit, so commit timestamps MUST be deterministic.
 *
 * The constants are arbitrary but inside the project's typical 2026 window
 * so any check that validates "iteration finished within reasonable time
 * window" doesn't flag them.
 */
export const ITER1_STARTED_AT = '2026-04-29T10:00:00.000Z';
export const ITER1_FINISHED_AT = '2026-04-29T10:00:30.000Z';

/**
 * The essay id used by all D-1.15 scenarios. Stable so test fixtures /
 * mocks key off a known value. Arbitrary string — no semantic meaning
 * beyond the ledger field.
 */
export const D1_15_ESSAY_ID = 'd1-15-test-essay';

/**
 * Build an `EssayProfile` with iter-1 fully committed for the given scenario.
 *
 * Output invariants (asserted by D-1.15.2's first sub-case as a
 * type-safety net — if the harness ever produces a malformed iter-1
 * state, that test fails before any iter-2 logic runs):
 *
 *   - profile.iterationLedger.currentIteration === 1
 *   - profile.iterationLedger.iterations.length === 1
 *   - profile.iterationLedger.iterations[0].iteration === 1
 *   - profile.iterationLedger.iterations[0].snapshotText === scenario.essayText
 *   - profile.iterationLedger.taughtMoves.length === scenario.iter1MoveAnchors.length
 *   - every taughtMove.id === generateTaughtMoveId(sourceAnnotation, 1)
 *   - every taughtMove.taughtAtIteration === 1
 *   - every taughtMove.landing === undefined (D-1.6.5 will populate
 *     landing on iter-2's prior-annotations-builder run; iter-1 commit
 *     leaves it undefined)
 *   - profile.iterationLedger.recentDecisions === [] (iter-1 first-pass
 *     has no carry-forward decisions; iter-2 is the first iteration that
 *     produces them)
 */
export function buildIter1Profile(scenario: Scenario): EssayProfile {
  // Reset module-level state from any prior test in the same vitest run.
  // The buffer + telemetry modules are essayId+iteration-keyed but a
  // shared cache; resetting per scenario prevents cross-test leakage.
  //
  // [H-2 audit closure 2026-04-30] We deliberately do NOT reset the
  // build-cost ledger (`__resetLedgerForTesting` from
  // src/services/essayIntelligence/telemetry/buildCostLedger.ts). The
  // cost ledger tracks REAL API spend across the build process — it's
  // a project-wide artifact, not per-test scaffolding. D-1.15 makes zero
  // API calls (mocked layers return totalCost: 0), so resetting the
  // ledger here would (i) silently corrupt project-wide build cost
  // accounting if a parallel test made real calls, (ii) couple the
  // harness to a module it doesn't otherwise depend on. If a future
  // scenario actually needs ledger isolation, that scenario's setup
  // should reset explicitly.
  __resetTaughtMoveBufferForTesting();
  __resetTelemetryForTesting();

  const paragraphTexts = splitParagraphs(scenario.essayText);
  // Build sentence stubs as the orchestrator does (one entry per paragraph
  // until L1 produces sentence breakdown). The integration test never
  // exercises sentence-level analysis on iter-1's setup — it only needs
  // the paragraph profiles populated correctly.
  const sentenceTexts = paragraphTexts.map((p) => [p]);
  const wordCount = scenario.essayText.split(/\s+/).filter((w) => w.length > 0).length;

  const profile = createInitialProfile({
    essayText: scenario.essayText,
    paragraphTexts,
    sentenceTexts,
    metadata: {
      essayType: 'common_app',
      wordCount,
    },
  });

  // Advance to iter 1.
  incrementIteration(profile, 'first_pass');

  // Build iter-1 L5 annotations from the scenario's iter1MoveAnchors,
  // convert each to a TaughtMove via the real l5AnnotationToTaughtMove
  // (D-1.13 pure-function contract — id stable across runs), and buffer
  // them via the real bufferTaughtMoves primitive. Then flush them.
  const annotations = buildIter1L5Annotations(scenario);
  const moves: TaughtMove[] = annotations.map((a) => l5AnnotationToTaughtMove(a, 1));
  bufferTaughtMoves(D1_15_ESSAY_ID, 1, moves);
  const flushedMoves = flushTaughtMovesForIteration(D1_15_ESSAY_ID, 1);

  // Push iter-1's IterationRecord. The shape mirrors what the orchestrator's
  // commitIterationRecord builds at end of analyzeEssay; we omit fields the
  // integration test never reads (events[], costBreakdown contents, etc.)
  // and populate fields the test DOES read (iteration, snapshotText,
  // triggeredBy, carryForwardSummary, escalationLevel) with realistic
  // values.
  const iter1Record: IterationRecord = {
    iteration: 1,
    triggeredBy: 'first_pass',
    carryForwardSummary: { carried: [], rederived: [], refreshed: [] },
    costBreakdown: {},
    comprehensiveBaselineCost: 0,
    carryForwardSavings: 0,
    escalationLevel: 0,
    rationale: 'iter-1 first-pass (D-1.15 harness commit)',
    startedAt: ITER1_STARTED_AT,
    finishedAt: ITER1_FINISHED_AT,
    // snapshotText is the iter-1 essay text — the source of truth for
    // priorAnnotationsBuilder's old-text resolution on iter-2.
    snapshotText: scenario.essayText,
  };

  // Mirror the analysisOrchestrator's commit pattern (D-1.10 known-good).
  // We push the record + the already-flushed taughtMoves directly. Per
  // D-1.10 the seam-level test uses this exact pattern; D-1.15 reuses it
  // for the same reason.
  profile.iterationLedger.iterations.push(iter1Record);
  if (flushedMoves.length > 0) {
    profile.iterationLedger.taughtMoves.push(...flushedMoves);
  }

  return profile;
}

// ─── Iter-2 setup helper (R-1 audit closure 2026-04-30) ────────────────

/**
 * Bundle the common iter-2 preparation flow. Used by integration tests
 * across all 5 scenarios to avoid duplicating `buildIter1Profile +
 * applyScenarioEdit + incrementIteration` in every `it`.
 *
 * Returns the iter-2-ready `profile` (currentIteration=2, iter-1 fully
 * committed) plus the `iter2Text` (iter-2 essay after applying the
 * scenario's edit).
 *
 * Diagnosability: the helper is deterministic — same scenario in,
 * same outputs out. When a downstream assertion fails, the failure
 * points at the assertion, not at setup variability.
 *
 * NOTE: callers MUST set their `mockDetect.mockResolvedValue(...)`
 * BEFORE calling buildPriorAnnotationsForOrchestrator. The helper does
 * NOT install a default mock — that decision is the test's, since
 * different scenarios may want different landing semantics.
 */
export function setupIter2(scenario: Scenario): {
  profile: EssayProfile;
  iter2Text: string;
} {
  const profile = buildIter1Profile(scenario);
  const iter2Text = applyScenarioEdit(scenario.essayText, scenario.edit);
  incrementIteration(profile, 'edit');
  return { profile, iter2Text };
}

/**
 * Re-derive the expected iter-1 TaughtMove IDs for a scenario. Used by
 * iter-2 assertions to verify the prior-annotations builder threaded the
 * correct prior moves into the L5 prompt context.
 *
 * Why this re-derives instead of reading from `profile`: the integration
 * test inspects `profile.iterationLedger.taughtMoves[i].id` AS THE
 * SYSTEM-UNDER-TEST. Reading the expected IDs from the same source we're
 * asserting on would be circular — any bug in iter-1 setup that produced
 * wrong IDs would silently match its own broken expectation. Instead we
 * regenerate the same L5 annotations buildIter1Profile uses, run them
 * through the same l5AnnotationToTaughtMove pure function, and assert
 * the profile's IDs match this independent re-derivation.
 *
 * Determinism sources: (i) fixed annotation ids per scenario
 * (`A-iter1-${scenario.id}-${idx}`), (ii) D-1.13 pure-function id stability
 * contract for l5AnnotationToTaughtMove. Both are property-tested in
 * tests/property/.
 */
export function expectedIter1MoveIds(scenario: Scenario): string[] {
  const annotations = buildIter1L5Annotations(scenario);
  return annotations.map((a) => l5AnnotationToTaughtMove(a, 1).id);
}
