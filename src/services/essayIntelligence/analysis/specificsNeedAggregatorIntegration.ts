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
import { emitIterationEvent } from '../telemetry/iterationTelemetry';

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
  /**
   * D-2.6 round 1.8: optional additional emissions from sources outside
   * the per-paragraph + essay-level profile-state footprint (e.g.,
   * FindingStore stuck-hypothesis maturity-refresh service produces a
   * SpecificsNeedEmission[] not stored on any per-layer field).
   * Concatenated AFTER the per-layer collected emissions, preserving the
   * stable-order contract documented above. Default [].
   */
  additionalEmissions: ReadonlyArray<SpecificsNeedEmission> = [],
): SpecificsNeedAggregationIntegrationResult {
  const collected = collectEmissionsFromProfile(profile);
  const allEmissions: SpecificsNeedEmission[] = [
    ...collected,
    ...additionalEmissions,
  ];
  const queueManager = new QuestionQueueManager(profile.questionQueue ?? []);
  const aggregationResult = aggregateSpecificsNeedEmissions(
    allEmissions,
    queueManager,
    iteration,
  );
  profile.questionQueue = queueManager.getAll();
  return {
    aggregationResult,
    hadEmissions: allEmissions.length > 0,
  };
}

/** Step name for the Phase 5.6 telemetry event. Pinned for test contracts. */
export const PHASE_5_6_STEP_NAME = 'phase5_6_specifics_need_aggregation' as const;

/**
 * Orchestrator-facing wrapper around `runSpecificsNeedAggregation` that
 * adds telemetry + console-logging at the established Phase 5.6 contract.
 *
 *   On success with at least one emission: emits a 'succeeded' iteration
 *     event carrying the AggregationResult counters as metadata, plus a
 *     human-readable orchestrator log line. Silence is signal — when
 *     `hadEmissions=false`, we emit nothing (no event, no log).
 *
 *   On schema-invalid emission throw: emits a 'failed' iteration event
 *     with `code: 'specifics_need_aggregation_failed'` and
 *     `context.downstreamBehavior` describing what state Phase 6 will
 *     see. The throw is swallowed at this boundary so the L5 annotation
 *     pass isn't blocked by an upstream prompt contract violation
 *     (legitimate isolation boundary, not a degraded fallback — see
 *     the file header for the no-fallback charter framing).
 *
 * Returns the IntegrationResult on success, or null on caught failure.
 * Callers that need to react to failure should consult the telemetry
 * buffer rather than the return value (the buffer is the audit-trail
 * substrate).
 */
export function runSpecificsNeedAggregationWithTelemetry(
  profile: EssayProfile,
  iteration: number,
  essayId: string,
  /**
   * D-2.6 forwards FindingStore stuck-hypothesis emissions through this
   * parameter — they're produced by `refreshFindingMaturity` (a separate
   * Sonnet call) before the orchestrator hits Phase 5.6, then handed to
   * the aggregator wrapper here.
   */
  additionalEmissions: ReadonlyArray<SpecificsNeedEmission> = [],
): SpecificsNeedAggregationIntegrationResult | null {
  try {
    const result = runSpecificsNeedAggregation(
      profile,
      iteration,
      additionalEmissions,
    );
    if (result.hadEmissions) {
      emitIterationEvent(essayId, {
        iteration,
        step: PHASE_5_6_STEP_NAME,
        status: 'succeeded',
        timestamp: new Date().toISOString(),
        metadata: {
          totalEmissions: result.aggregationResult.totalEmissions,
          addedToQueue: result.aggregationResult.addedToQueue,
          deduplicatedAgainstExisting:
            result.aggregationResult.deduplicatedAgainstExisting,
          deduplicatedWithinRun:
            result.aggregationResult.deduplicatedWithinRun,
          byLayer: result.aggregationResult.byLayer,
        },
      });
      console.log(
        `[Orchestrator] Phase 5.6 specifics-need aggregation complete: ` +
          `received=${result.aggregationResult.totalEmissions}, ` +
          `added=${result.aggregationResult.addedToQueue}, ` +
          `dedup_existing=${result.aggregationResult.deduplicatedAgainstExisting}, ` +
          `dedup_within_run=${result.aggregationResult.deduplicatedWithinRun}`,
      );
    }
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      '[Orchestrator] Phase 5.6: Specifics-need aggregation failed:',
      msg,
    );
    emitIterationEvent(essayId, {
      iteration,
      step: PHASE_5_6_STEP_NAME,
      status: 'failed',
      error: {
        message: msg,
        code: 'specifics_need_aggregation_failed',
        context: {
          downstreamBehavior:
            'Pipeline continues to Phase 6 with the question queue in its pre-aggregation state plus any partial mutations the aggregator made before the throw. Already-minted questions from earlier emissions persist (sequential validate→mint).',
        },
      },
      timestamp: new Date().toISOString(),
    });
    return null;
  }
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
  // Option 5 rebuild: emissions live at one location —
  // profile.specificsNeedEmissions[] — populated by Phase B
  // (essayLevelEmissionService) at Phase 5.55. Replaces the prior round 1.8
  // 4-source collection (paragraph.understanding, paragraph.analysis,
  // essayUnderstanding, northStar). Backward-compat: legacy profiles with
  // emissions in the prior locations are still read in case a coordinator
  // upgrade lags during deploy; can be deleted once all profiles have
  // refreshed.
  const out: SpecificsNeedEmission[] = [];

  if (profile.specificsNeedEmissions && profile.specificsNeedEmissions.length > 0) {
    out.push(...profile.specificsNeedEmissions);
    return out;
  }

  // Backward-compat fallback (delete once all profiles refresh).
  for (const paragraph of profile.paragraphs ?? []) {
    const walkEmissions = paragraph.understanding?.specificsNeedEmissions;
    if (walkEmissions && walkEmissions.length > 0) out.push(...walkEmissions);
    const analysisEmissions = paragraph.analysis?.specificsNeedEmissions;
    if (analysisEmissions && analysisEmissions.length > 0) out.push(...analysisEmissions);
  }
  if (profile.essayUnderstanding?.specificsNeedEmissions) {
    out.push(...profile.essayUnderstanding.specificsNeedEmissions);
  }
  if (profile.northStar?.specificsNeedEmissions) {
    out.push(...profile.northStar.specificsNeedEmissions);
  }
  return out;
}
