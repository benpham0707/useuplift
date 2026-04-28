// ============================================================================
// CARRY-FORWARD SYNTHESIS (D-1.11)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.11 + D-1.11 Plan agent §7 (synthesis bridge).
//
// Pure helper that bridges between `iterationLedger.recentDecisions[]`
// (the per-decision append store written by `appendCarryForwardDecision`)
// and `IterationRecord.carryForwardSummary` (the per-iteration rolled-up
// summary). D-1.10's `commitIterationRecord` stubs the summary as
// `{ carried: [], rederived: [], refreshed: [] }`; D-1.11 amends the
// commit helper to call this synthesizer in place of the stub.
//
// Why a pure helper instead of inline:
//   - Testable in isolation without scaffolding an orchestrator.
//   - The mapping rule (decision → carried/rederived/refreshed) is the
//     sole load-bearing logic; isolating it is a reuse hedge for the
//     L3.75 targeted-refresh prompt (Phase 4+) which will read the same
//     mapping in reverse (section-invalidation flags → which sections
//     to re-derive).
//   - Append-only invariant friendly: this function NEVER mutates its
//     inputs; it constructs a fresh summary object each call.

import type { CarryForwardDecision, EssayProfile, IterationRecord } from '../profileTypes';
import { appendCarryForwardDecision } from '../profileManager/essayProfileManager';
import { emitIterationEvent } from '../telemetry/iterationTelemetry';

/**
 * Synthesize the rolled-up `carryForwardSummary` for a given iteration
 * from the full decisions ledger.
 *
 * Mapping rules:
 *   filter decisions where `decision.iteration === iteration`
 *   for each d:
 *     'carry'           → push d.itemKey to `carried`
 *     'rederive'        → push d.itemKey to `rederived`
 *     'partial_refresh' → push d.itemKey to `refreshed`
 *     anything else     → silently dropped (runtime validation lives in
 *                         appendCarryForwardDecision; the synthesizer is
 *                         purely descriptive of the data it receives)
 *
 * Each output array is deduplicated within its own bucket and preserves
 * insertion order. An itemKey appearing in two DIFFERENT buckets (e.g.,
 * the same key recorded as 'carry' AND 'partial_refresh' in the same
 * iteration) surfaces in BOTH output arrays — this is intentional, so
 * an orchestrator-bug producing inconsistent decisions for the same
 * itemKey leaves a visible audit trail rather than being silently
 * masked by the synthesizer.
 *
 * Pure: never mutates the input array. Returns a fresh
 * `{ carried, rederived, refreshed }` object on every call.
 */
export function synthesizeCarryForwardSummary(
  decisions: ReadonlyArray<CarryForwardDecision>,
  iteration: number,
): IterationRecord['carryForwardSummary'] {
  if (!Array.isArray(decisions)) {
    throw new Error(
      `[carryForwardSynthesis.synthesizeCarryForwardSummary] decisions must be an array; got ${typeof decisions}.`,
    );
  }
  if (!Number.isInteger(iteration) || iteration < 0) {
    throw new Error(
      `[carryForwardSynthesis.synthesizeCarryForwardSummary] iteration must be a non-negative integer; got ${iteration}.`,
    );
  }

  // Use Sets for in-loop deduplication, then materialize to arrays at
  // the end. JavaScript Sets preserve insertion order so the resulting
  // arrays mirror the order decisions were appended during the iteration.
  const carried = new Set<string>();
  const rederived = new Set<string>();
  const refreshed = new Set<string>();

  for (const d of decisions) {
    if (d.iteration !== iteration) continue;
    switch (d.decision) {
      case 'carry':
        carried.add(d.itemKey);
        break;
      case 'rederive':
        rederived.add(d.itemKey);
        break;
      case 'partial_refresh':
        refreshed.add(d.itemKey);
        break;
      default:
        // Out-of-enum value — synthesizer is descriptive only; we drop
        // silently here. Runtime validation against the enum lives in
        // `appendCarryForwardDecision` (essayProfileManager.ts:D-1.11
        // mutators), which is the boundary where the audit trail's
        // structural integrity is enforced. By the time decisions reach
        // here, anything out-of-enum has already bypassed the validator
        // (e.g., legacy data, manual JSONB edits, type-cast bug).
        break;
    }
  }

  return {
    carried: [...carried],
    rederived: [...rederived],
    refreshed: [...refreshed],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// D-1.11 — Decision-point safe-append helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely append a CarryForwardDecision at an orchestrator decision point.
 *
 * Per the D-1.11 Plan agent §9 failure-surface design: the underlying
 * `appendCarryForwardDecision` mutator throws on validation failure (the
 * audit-trail invariants are non-negotiable), but a decision-point append
 * MUST NOT abort the analysis — an audit-trail bug at a decision point
 * is worse if it propagates to user-facing failure than if it's logged
 * and skipped. So every decision-point call site wraps the append in
 * this helper, which:
 *
 *   1. Tries the append.
 *   2. On throw, emits a structured `iterationTelemetry` failure event
 *      with code:'carry_forward_decision_append_failure' so audit grep
 *      finds the dropped decision.
 *   3. Logs to console.error for tail-able dev visibility.
 *   4. Returns false to signal the append was dropped (caller can
 *      ignore or use for further telemetry).
 *
 * This is the ONE charter-sanctioned swallow site in D-1.11 (per
 * no-fallback charter §8). The justification: the alternative
 * (aborting analysis over an audit-trail bug) is worse for the user
 * than a missing audit entry.
 *
 * The ESLint `no-silent-fallback` rule is appeased via the explicit
 * emit + console.error + structured-throw upstream. We do NOT add a
 * `// eslint-disable-next-line` because the catch DOES emit and log;
 * the rule only flags catches that are TRULY silent.
 */
export function safeAppendCarryForwardDecision(
  essayId: string,
  profile: EssayProfile,
  decision: CarryForwardDecision,
): boolean {
  try {
    appendCarryForwardDecision(profile, decision);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitIterationEvent(essayId, {
      iteration: profile.iterationLedger?.currentIteration ?? -1,
      step: 'carryForward.decision_append_failure',
      status: 'failed',
      error: {
        message,
        code: 'carry_forward_decision_append_failure',
        context: {
          itemKey: decision?.itemKey ?? '<unknown>',
          decisionType: decision?.decision ?? '<unknown>',
          attemptedIteration: decision?.iteration ?? -1,
          actualCurrentIteration: profile.iterationLedger?.currentIteration ?? -1,
        },
      },
      timestamp: new Date().toISOString(),
    });
    console.error(
      `[carryForwardSynthesis] decision append dropped (non-fatal): ${message}`,
    );
    return false;
  }
}
