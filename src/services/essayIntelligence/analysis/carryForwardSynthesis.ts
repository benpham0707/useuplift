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

import type { CarryForwardDecision, IterationRecord } from '../profileTypes';

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
