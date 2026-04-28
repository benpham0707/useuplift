// ============================================================================
// ITERATION TELEMETRY (Phase 0 D-0.9)
// ============================================================================
// Spec: INTEGRATED_BUILD_SEQUENCE.md D-0.9 / L5_IMPLEMENTATION_PLAN §2 D-0.9.
// Companion type: IterationTelemetryEvent in profileTypes.ts (D-0.9 amend
// to D-0.1's §7.1 spec — added as optional field on IterationRecord).
//
// Pure emission. NO retries. NO fallback. NO swallowed errors. Per the
// no-fallback charter (§0): if emit throws, the calling code halts —
// telemetry is not allowed to mask a real failure with a graceful
// degradation. The console-log sink is structured for tail-able local
// dev with the `[IterationTelemetry]` prefix.
//
// Buffer model: events accumulate in an in-memory map keyed by iteration
// number during the iteration. The orchestrator flushes the buffer into
// the IterationRecord.events[] at iteration commit (Phase 1 D-1.10) via
// `flushEventsForIteration()` and `clearEventsForIteration()`.
//
// emitStepStart returns a `stepId` that emitStepSuccess / emitStepFailure
// take to correlate the lifecycle pair. The stepId is opaque to callers;
// the only contract is "pass the same stepId to the success/failure call
// that emitStepStart returned."

import type { IterationTelemetryEvent } from '../profileTypes';

/**
 * In-memory event buffer keyed by iteration number.
 *
 * Map<iteration, IterationTelemetryEvent[]>. Pure module-level state —
 * the telemetry module is a singleton in process. The orchestrator
 * flushes per iteration; tests reset via `__resetTelemetryForTesting()`.
 *
 * ⚠️ [thread-safety / D-1.11 Step 0 deferred fix] This buffer is keyed
 * ONLY by iteration number. Two essays both running iter=N in the same
 * process will write to the same bucket; `flushEventsForIteration(N)`
 * returns the merged event stream of BOTH essays (the flush returns
 * a `.slice()` non-destructive copy, then `clearEventsForIteration`
 * deletes the entire bucket).
 *
 * IMPACT: AUDIT-ONLY corruption — events end up in the wrong essay's
 * `IterationRecord.events[]` audit trail. NOT load-bearing for next
 * iteration's analysis (unlike the TaughtMove buffer, which D-1.11
 * Step 0 already keyed by `(essayId, iter)`).
 *
 * RUNTIME ASSUMPTION: today's production model is one
 * `ReanalysisOrchestrator` instance per essay session, single-essay-at-a-
 * time. Two `analyzeEssay` calls don't interleave at the same iteration
 * in this model. The collision is LATENT — one shared-worker /
 * batch-analysis refactor away from corrupting audit trails silently.
 *
 * DEFERRED FIX (tracked): rekey by `(essayId, iter)` — same pattern
 * as `taughtMoveBuilder` (D-1.11 Step 0). Requires threading `essayId`
 * through `emitStepStart`/`emitStepSuccess`/`emitStepFailure` and their
 * callers (`landingDetector.ts`, `essayProfileManager.ts`,
 * `buildCostLedger.ts`). Wider refactor; landing as its own focused
 * commit before D-1.11 Step 14 (integration test) so the test can
 * cover the concurrent-essay path.
 */
const eventsByIteration: Map<number, IterationTelemetryEvent[]> = new Map();

/**
 * Started-step lookup keyed by `stepId`. Holds the start timestamp so
 * `emitStepSuccess` / `emitStepFailure` can compute durationMs without
 * the caller having to track it.
 *
 * Map<stepId, { iteration, step, paragraphIndex?, startedAtMs }>.
 */
interface InFlightStep {
  iteration: number;
  step: string;
  paragraphIndex?: number;
  startedAtMs: number;
}
const inFlightSteps: Map<string, InFlightStep> = new Map();

/**
 * Monotonic counter for stepId generation. Module-level so different
 * concurrent steps in the same iteration get distinct ids.
 */
let stepIdCounter = 0;

/**
 * Emit a fully-formed event. Used by the orchestrator for pre-built
 * events (e.g., events reconstructed from a prior store, or events
 * synthesized at iteration boundaries).
 *
 * Pure: pushes to the in-memory buffer for `event.iteration` AND emits
 * the `[IterationTelemetry]`-prefixed structured console log.
 *
 * Failure surface: if buffer push throws or console.log throws, the
 * exception propagates. Callers must NOT wrap this in try/catch
 * unless they re-throw. Per no-fallback discipline: a telemetry
 * failure halts the caller; we do not silently lose events.
 */
export function emitIterationEvent(event: IterationTelemetryEvent): void {
  const bucket = eventsByIteration.get(event.iteration);
  if (bucket) {
    bucket.push(event);
  } else {
    eventsByIteration.set(event.iteration, [event]);
  }
  // Structured console log for tail-able local dev. Single-line JSON
  // so logs can be piped through jq / grep without multi-line concerns.
  // The prefix is the agreed contract for log filtering.
  console.log('[IterationTelemetry]', JSON.stringify(event));
}

/**
 * Begin a step. Returns a stepId the caller passes to
 * `emitStepSuccess` / `emitStepFailure` on completion.
 *
 * Records a `status: 'started'` event AND registers the step's start
 * timestamp internally so durationMs can be computed at completion
 * without the caller tracking it.
 */
export function emitStepStart(
  iteration: number,
  step: string,
  context?: { paragraphIndex?: number; model?: string },
): { stepId: string } {
  const stepId = `step-${iteration}-${step}-${++stepIdCounter}`;
  const startedAtMs = Date.now();
  inFlightSteps.set(stepId, {
    iteration,
    step,
    paragraphIndex: context?.paragraphIndex,
    startedAtMs,
  });
  const event: IterationTelemetryEvent = {
    iteration,
    step,
    paragraphIndex: context?.paragraphIndex,
    status: 'started',
    model: context?.model,
    timestamp: new Date(startedAtMs).toISOString(),
  };
  emitIterationEvent(event);
  return { stepId };
}

/**
 * Mark a step succeeded. Reads the step's start metadata via stepId,
 * computes durationMs, and emits a `status: 'succeeded'` event.
 *
 * If `stepId` is unknown (caller never called emitStepStart, or already
 * completed the step), throws — this is a programming error worth
 * surfacing immediately, not a soft failure to log around.
 */
export function emitStepSuccess(
  stepId: string,
  output?: {
    cost?: number;
    tokenUsage?: IterationTelemetryEvent['tokenUsage'];
    model?: string;
  },
): void {
  const inFlight = inFlightSteps.get(stepId);
  if (!inFlight) {
    throw new Error(
      `[IterationTelemetry] emitStepSuccess called with unknown stepId="${stepId}". ` +
        `Either emitStepStart was never called for this step, or success/failure was already emitted.`,
    );
  }
  inFlightSteps.delete(stepId);
  const finishedAtMs = Date.now();
  const event: IterationTelemetryEvent = {
    iteration: inFlight.iteration,
    step: inFlight.step,
    paragraphIndex: inFlight.paragraphIndex,
    status: 'succeeded',
    cost: output?.cost,
    tokenUsage: output?.tokenUsage,
    durationMs: finishedAtMs - inFlight.startedAtMs,
    model: output?.model,
    timestamp: new Date(finishedAtMs).toISOString(),
  };
  emitIterationEvent(event);
}

/**
 * Mark a step failed. Same shape as emitStepSuccess but populates the
 * error context. Per no-fallback discipline, the caller is expected
 * to halt or re-throw; this function does not swallow the error,
 * only records it.
 */
export function emitStepFailure(
  stepId: string,
  error: Error,
  context?: { code?: string; extra?: Record<string, unknown>; model?: string },
): void {
  const inFlight = inFlightSteps.get(stepId);
  if (!inFlight) {
    // Failure path is harder to be strict about — if a step throws
    // before emitStepStart returned (extreme race), or if the caller
    // forgot the start, we still want the failure logged. Emit a
    // best-effort event without iteration / step context, but mark
    // the missing-start in the error.context so the audit trail
    // surfaces it.
    const fallbackEvent: IterationTelemetryEvent = {
      iteration: -1,
      step: 'unknown',
      status: 'failed',
      error: {
        message: error.message,
        code: context?.code,
        context: {
          ...context?.extra,
          telemetryNote: `emitStepFailure called with unknown stepId="${stepId}" — emitStepStart never registered or already completed.`,
        },
      },
      timestamp: new Date().toISOString(),
    };
    emitIterationEvent(fallbackEvent);
    return;
  }
  inFlightSteps.delete(stepId);
  const finishedAtMs = Date.now();
  const event: IterationTelemetryEvent = {
    iteration: inFlight.iteration,
    step: inFlight.step,
    paragraphIndex: inFlight.paragraphIndex,
    status: 'failed',
    error: {
      message: error.message,
      code: context?.code,
      context: context?.extra,
    },
    durationMs: finishedAtMs - inFlight.startedAtMs,
    model: context?.model,
    timestamp: new Date(finishedAtMs).toISOString(),
  };
  emitIterationEvent(event);
}

/**
 * Read all events for a given iteration without removing them. Used
 * by the orchestrator when committing IterationRecord (Phase 1 D-1.10)
 * to populate `events[]` from the buffer.
 */
export function flushEventsForIteration(iteration: number): IterationTelemetryEvent[] {
  return eventsByIteration.get(iteration)?.slice() ?? [];
}

/**
 * Clear the buffer for a given iteration. Called by the orchestrator
 * AFTER a successful flushEventsForIteration + IterationRecord commit
 * so memory doesn't grow unboundedly across long sessions.
 */
export function clearEventsForIteration(iteration: number): void {
  eventsByIteration.delete(iteration);
}

/**
 * Test-only reset. NOT exported in the production API — but the test
 * helper imports the symbol directly via `__resetTelemetryForTesting`.
 * The double-underscore prefix and the eslint-disable on the file
 * import in tests signals "internal access for tests only."
 */
export function __resetTelemetryForTesting(): void {
  eventsByIteration.clear();
  inFlightSteps.clear();
  stepIdCounter = 0;
}
