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
 * In-memory event buffer keyed by (essayId, iteration) compound key.
 *
 * Pure module-level state — the telemetry module is a singleton in
 * process. The orchestrator flushes per (essayId, iteration); tests
 * reset via `__resetTelemetryForTesting()`.
 *
 * [D-1.11 Step 15 closure] Pre-Step-15 the buffer was keyed by
 * iteration number ALONE — two essays both running iter=N in the same
 * process would cross-pollinate (`flushEventsForIteration(N)` returned
 * the merged event stream of BOTH essays). Compound (essayId, iter)
 * keying makes cross-essay collision impossible at the type level,
 * matching the taughtMoveBuilder pattern (D-1.11 Step 0).
 *
 * Compound key built via `bufferKey(essayId, iteration)` using a
 * delimiter character unlikely to appear in essayIds (chr 0x1F unit
 * separator).
 */
function bufferKey(essayId: string, iteration: number): string {
  return `${essayId}${iteration}`;
}
const eventsByEssayAndIteration: Map<string, IterationTelemetryEvent[]> = new Map();

/**
 * Started-step lookup keyed by `stepId`. Holds the start timestamp +
 * essayId so `emitStepSuccess` / `emitStepFailure` can derive the
 * buffer key from stepId without the caller threading essayId through
 * the success/failure call.
 */
interface InFlightStep {
  essayId: string;
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
export function emitIterationEvent(essayId: string, event: IterationTelemetryEvent): void {
  if (typeof essayId !== 'string' || essayId.length === 0) {
    throw new Error(
      `[IterationTelemetry] emitIterationEvent: essayId must be a non-empty string; got ${JSON.stringify(essayId)}.`,
    );
  }
  const k = bufferKey(essayId, event.iteration);
  const bucket = eventsByEssayAndIteration.get(k);
  if (bucket) {
    bucket.push(event);
  } else {
    eventsByEssayAndIteration.set(k, [event]);
  }
  // Structured console log for tail-able local dev. Single-line JSON
  // so logs can be piped through jq / grep without multi-line concerns.
  // The prefix is the agreed contract for log filtering. Includes
  // essayId in the log envelope (not in the event itself — the event
  // shape stays unchanged so existing IterationRecord.events[] audit
  // consumers don't have to deal with a new field).
  console.log('[IterationTelemetry]', JSON.stringify({ essayId, ...event }));
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
  essayId: string,
  iteration: number,
  step: string,
  context?: { paragraphIndex?: number; model?: string },
): { stepId: string } {
  if (typeof essayId !== 'string' || essayId.length === 0) {
    throw new Error(
      `[IterationTelemetry] emitStepStart: essayId must be a non-empty string; got ${JSON.stringify(essayId)}.`,
    );
  }
  const stepId = `step-${essayId}-${iteration}-${step}-${++stepIdCounter}`;
  const startedAtMs = Date.now();
  inFlightSteps.set(stepId, {
    essayId,
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
  emitIterationEvent(essayId, event);
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
  emitIterationEvent(inFlight.essayId, event);
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
    // surfaces it. essayId is also unknown here, so the event lands
    // in a sentinel `'<unknown-essay>'` bucket — visible to flush via
    // explicit query but won't pollute any real essay's events[].
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
    emitIterationEvent('<unknown-essay>', fallbackEvent);
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
  emitIterationEvent(inFlight.essayId, event);
}

/**
 * Read all events for a given (essayId, iteration) without removing
 * them. Used by the orchestrator when committing IterationRecord
 * (Phase 1 D-1.10) to populate `events[]` from the buffer.
 *
 * [D-1.11 Step 15] essayId is now a required parameter — see the
 * top-of-file thread-safety comment. Concurrent essays at the same
 * iteration don't cross-pollinate.
 */
export function flushEventsForIteration(
  essayId: string,
  iteration: number,
): IterationTelemetryEvent[] {
  return eventsByEssayAndIteration.get(bufferKey(essayId, iteration))?.slice() ?? [];
}

/**
 * Clear the buffer for a given (essayId, iteration). Called by the
 * orchestrator AFTER a successful flushEventsForIteration + IterationRecord
 * commit so memory doesn't grow unboundedly across long sessions.
 */
export function clearEventsForIteration(essayId: string, iteration: number): void {
  eventsByEssayAndIteration.delete(bufferKey(essayId, iteration));
}

/**
 * Test-only reset. NOT exported in the production API — but the test
 * helper imports the symbol directly via `__resetTelemetryForTesting`.
 * The double-underscore prefix and the eslint-disable on the file
 * import in tests signals "internal access for tests only."
 */
export function __resetTelemetryForTesting(): void {
  eventsByEssayAndIteration.clear();
  inFlightSteps.clear();
  stepIdCounter = 0;
}
