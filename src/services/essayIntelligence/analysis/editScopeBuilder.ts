// ============================================================================
// EDIT-SCOPE BUILDER (D-1.15 deferred-item closure 2026-04-30 — Item 6)
// ============================================================================
// Spec: docs/audit/phase-1-integrity-audit.md §6 Item 6 — "brief→editScope
//   translation untested" (carried from D-1.15.4 Q5).
//
// What this does:
//   Pure deterministic translation from a ReanalysisBrief (plus the
//   orchestrator's input significance + changeTypes) into the
//   IterationRecord.editScope shape that commitIterationRecord persists.
//
//   Extracted from analysisOrchestrator.commitIterationRecord (formerly inline
//   at analysisOrchestrator.ts:2076-2106) so the live derivation chain is
//   testable as a unit:
//
//     (oldText, newText) → computeEditDiff → ReanalysisBrief →
//                       → buildEditScopeFromBrief → IterationRecord.editScope
//
//   D-1.15 scenario tests previously hard-coded the editScope.structural
//   shape on a manually-pushed IterationRecord, which left the live
//   derivation untested. With this extraction, tests can drive the
//   counting logic directly against fixture briefs without driving the
//   full orchestrator.
//
// Behavioral contract (must remain identical to the prior inline logic):
//   - `triggeredBy !== 'edit'` → return `undefined` (first_pass /
//     student_request iterations carry no editScope per the §7.1 contract).
//   - `triggeredBy === 'edit'` → return a fully-populated editScope.
//     `paragraphsChanged` and `structural.reordered` come from the brief
//     when present; falsy fallbacks (`[]` / `false`) match prior behavior
//     for missing-brief edges (e.g., a malformed input upstream — the
//     orchestrator's pre-call validation handles invariant violations).
//   - `structural.added` and `structural.removed` are counted from
//     `brief.netChanges[]` by `changeType` — `'added'` / `'paragraph_added'`
//     bump `added`; `'removed'` / `'paragraph_removed'` / `'deleted'` bump
//     `removed`. This is the counting logic the audit's "real counts matter
//     for D-4.11 escalation calibration" comment guards.
//
// Failure surface (per the no-fallback charter):
//   Pure function, no throws. Invariant violations (e.g., a `triggeredBy
//   === 'edit'` iteration with `brief === undefined`) are upstream
//   concerns; this helper accepts the absence honestly via `?? []` /
//   `?? false` / `?? 'minor'` fallbacks that match the prior inline shape.
//   The `?? 'minor'` default is NOT a centrist-default-masking-LLM-silence
//   antipattern — `editSignificance` is set deterministically by the
//   orchestrator's brief-construction path; this fallback is the same
//   one the prior inline code had, preserved verbatim.

import type {
  EditChangeType,
  IterationRecord,
  ReanalysisBrief,
} from '../profileTypes';

/**
 * Build IterationRecord.editScope from a ReanalysisBrief.
 *
 * @param triggeredBy — what triggered the iteration. Only 'edit' produces
 *   a populated editScope; 'first_pass' and 'student_request' return undefined.
 * @param brief — the orchestrator's reanalysisBrief input. Optional because
 *   pre-D-1.10-snapshot iterations and degraded-input paths may have it
 *   absent; the falsy-fallback shape preserves the prior inline behavior.
 * @param editSignificance — significance hint from PipelineInput.
 *   Defaults to 'minor' when absent (matches prior inline behavior).
 * @param editChangeTypes — change-type hints from PipelineInput.
 *   Defaults to [] when absent (matches prior inline behavior).
 *
 * @returns IterationRecord['editScope'] — undefined for non-edit
 *   iterations, populated otherwise.
 */
export function buildEditScopeFromBrief(
  triggeredBy: IterationRecord['triggeredBy'],
  brief: ReanalysisBrief | undefined,
  editSignificance: 'minor' | 'moderate' | 'significant' | 'transformative' | undefined,
  editChangeTypes: EditChangeType[] | undefined,
): IterationRecord['editScope'] {
  if (triggeredBy !== 'edit') {
    return undefined;
  }

  let addedCount = 0;
  let removedCount = 0;
  if (brief && Array.isArray(brief.netChanges)) {
    for (const change of brief.netChanges) {
      if (change.changeType === 'added' || change.changeType === 'paragraph_added') {
        addedCount++;
      }
      if (
        change.changeType === 'removed' ||
        change.changeType === 'paragraph_removed' ||
        change.changeType === 'deleted'
      ) {
        removedCount++;
      }
    }
  }

  return {
    paragraphsChanged: brief?.structural.paragraphsChanged ?? [],
    significance: editSignificance ?? 'minor',
    changeTypes: editChangeTypes ?? [],
    structural: {
      reordered: brief?.structural.hasReordering ?? false,
      added: addedCount,
      removed: removedCount,
    },
  };
}
