// ============================================================================
// SPECIFICS-NEED AGGREGATOR — orchestrator integration helper (D-2.8)
// ============================================================================
// Pure function that wraps the D-2.7 aggregator for the orchestrator's
// Phase 5 → Phase 6 boundary. Three responsibilities:
//
//   1. Collect SpecificsNeedEmission[] from every layer's profile-state
//      footprint (per-paragraph walk + analysis, essay-level holistic +
//      northStar). Stable order: ascending paragraph index with walk-
//      before-analysis within each, then holistic, then northStar. Order
//      determinism matters because the aggregator's within-run dedup is
//      first-emission-wins.
//
//   2. Construct a fresh QuestionQueueManager from profile.questionQueue,
//      delegate to aggregateSpecificsNeedEmissions, and write the queue
//      back. Mirrors the holistic synthesis growth-cycle pattern at
//      analysisOrchestrator.ts:1527 / :1822.
//
//   3. Return the AggregationResult so the orchestrator can emit telemetry
//      (per-layer counts, dedup deltas, additions). No side effects beyond
//      the in-place mutation of profile.questionQueue.
//
// FindingStore stuck-hypothesis emissions (sourceLayer='finding_maturity')
// are NOT collected here. D-2.6 lands a separate service that scans the
// FindingStore for stuck hypotheses and emits its own SpecificsNeedEmission[];
// the orchestrator will concatenate that array into the call below when
// D-2.6 ships. Until then, the 'finding_maturity' layer naturally
// contributes 0 emissions, which is correct (silence is a valid signal —
// round 1.6 §3 Test 3).
//
// No-fallback charter: if collection or aggregation throws, the error
// propagates. The orchestrator's Phase 6 surrounding catch path
// (buildPartialResult) handles surface telemetry. We do not swallow.
// ============================================================================

import type { EssayProfile, SpecificsNeedEmission } from '../profileTypes';
import { QuestionQueueManager } from './questionQueueManager';
import {
  aggregateSpecificsNeedEmissions,
  type AggregationResult,
} from './specificsNeedAggregator';

export interface SpecificsNeedAggregationIntegrationResult {
  /** Stats from the aggregator call — totals, dedup counts, byLayer breakdown. */
  aggregationResult: AggregationResult;
  /**
   * True iff at least one emission was collected from any layer. Lets the
   * orchestrator skip telemetry / cost-ledger noise when no layer surfaced
   * a gap-and-approach this iteration (the common case in a polished essay).
   */
  hadEmissions: boolean;
}

/**
 * Run specifics-need aggregation against the live profile.
 *
 * Reads from each layer's `specificsNeedEmissions[]` field on the profile
 * (per-paragraph and essay-level), aggregates via D-2.7, mutates
 * profile.questionQueue in place. Returns the AggregationResult so the
 * orchestrator can emit a single telemetry event covering this step.
 *
 * Idempotent within an iteration: D-2.11 property tests confirm that calling
 * this twice with the same profile state and the same iteration number
 * produces zero net change on the second call (existing matches still get
 * single-increment-per-existing-match; new mints already exist after pass 1
 * so within-run dedup folds pass 2's identical emissions).
 *
 * @param profile — the live EssayProfile being analyzed. Mutated in place
 *   (profile.questionQueue updated; per-layer emission fields untouched).
 * @param iteration — the current iteration number, threaded through to
 *   `UnderstandingQuestion.raisedDuringIteration` on minted entries.
 *
 * @throws Error from aggregateSpecificsNeedEmissions on any schema-invalid
 *   emission (sequential validate→mint semantics — partial mutations
 *   persist before the throw, consistent with priorAnnotationsBuilder
 *   D-1.6 pattern). The orchestrator's catch handles propagation.
 */
export function runSpecificsNeedAggregation(
  profile: EssayProfile,
  iteration: number,
): SpecificsNeedAggregationIntegrationResult {
  const collected = collectEmissionsFromProfile(profile);
  const queueManager = new QuestionQueueManager(profile.questionQueue ?? []);
  const aggregationResult = aggregateSpecificsNeedEmissions(
    collected,
    queueManager,
    iteration,
  );
  profile.questionQueue = queueManager.getAll();
  return {
    aggregationResult,
    hadEmissions: collected.length > 0,
  };
}

/**
 * Walk the profile and concatenate every layer's specificsNeedEmissions[]
 * in a deterministic order:
 *
 *   For each paragraph (ascending index):
 *     1. paragraph.understanding.specificsNeedEmissions  (L3 walk)
 *     2. paragraph.analysis.specificsNeedEmissions       (L3.5 analysis)
 *
 *   Then essay-level:
 *     3. essayUnderstanding.specificsNeedEmissions       (L3.75 holistic)
 *     4. northStar.specificsNeedEmissions                (L4 crystallization)
 *
 * Order matters because the aggregator's within-run dedup is first-
 * emission-wins: when two emissions match on (anchorParagraph, anchorSentence,
 * shape) AND their framingSeeds cross the Jaccard 0.5 threshold, the FIRST
 * one mints the question and the rest fold into it. With this ordering,
 * temporally-earlier signals (walk before analysis, paragraph-scope before
 * essay-scope) take priority — which matches how a counselor would
 * weight the signals.
 *
 * The order is also stable across runs for any given profile state:
 * paragraph index is fixed, the per-paragraph emissions array order is
 * fixed by the prompt's emission order (a single LLM call producing a
 * single ordered output). Determinism is what makes idempotency possible.
 */
function collectEmissionsFromProfile(
  profile: EssayProfile,
): SpecificsNeedEmission[] {
  const out: SpecificsNeedEmission[] = [];

  for (const paragraph of profile.paragraphs ?? []) {
    const walkEmissions = paragraph.understanding?.specificsNeedEmissions;
    if (walkEmissions && walkEmissions.length > 0) {
      out.push(...walkEmissions);
    }
    const analysisEmissions = paragraph.analysis?.specificsNeedEmissions;
    if (analysisEmissions && analysisEmissions.length > 0) {
      out.push(...analysisEmissions);
    }
  }

  const holisticEmissions = profile.essayUnderstanding?.specificsNeedEmissions;
  if (holisticEmissions && holisticEmissions.length > 0) {
    out.push(...holisticEmissions);
  }

  const northStarEmissions = profile.northStar?.specificsNeedEmissions;
  if (northStarEmissions && northStarEmissions.length > 0) {
    out.push(...northStarEmissions);
  }

  return out;
}
