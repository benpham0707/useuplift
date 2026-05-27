/**
 * Diagnostic Snapshot — Stage 2.G (Item 4, option b)
 *
 * Prepends a ~220-token diagnostic frame at the TOP of every L6 coaching
 * turn's user prompt. The coach reads this before the conversation, before
 * findings, before sidecars — it's the lead-with calibration anchor.
 *
 * Sources from `profile.executiveBrief` (Stage 2.A) when present, falling
 * back to `aoFirstRead.committeeOneLiner` + improvement phase when the
 * Brief is unavailable. Returns the empty string when nothing's available
 * — no fake snapshot, no guessing.
 *
 * Design rationale: the original ROUND_7 P2-8 finding (prompt overload)
 * proposed reordering essay-text-before-verdicts. HEAD verification
 * (CPR-C2) showed the L6 prompt has no monolithic essay-text or verdict
 * block to reorder — it's ~20 distributed sidecars. This module is the
 * rescope per plan §12: instead of reordering, we lead with a calibrated
 * frame the coach uses to anchor every turn.
 *
 * Flag: ENABLE_DIAGNOSTIC_SNAPSHOT=true (default off until Phase 6 regen
 * confirms quality). Independent of ENABLE_EXECUTIVE_BRIEF — the snapshot
 * has graceful fallback when Brief is null.
 */

import type { EssayProfile } from '../profileTypes';

// ============================================================================
// FEATURE FLAG
// ============================================================================

export function isDiagnosticSnapshotEnabled(): boolean {
  return process.env.ENABLE_DIAGNOSTIC_SNAPSHOT === 'true';
}

// ============================================================================
// BLOCK BUILDER
// ============================================================================

/**
 * Build the Diagnostic Snapshot block for L6 user-prompt injection.
 *
 * Returns the empty string when the flag is off OR when no source data is
 * available (no Brief, no committee one-liner, no phase). Empty string is
 * the explicit "no snapshot this turn" signal — callers concatenate with
 * `${snapshot ? snapshot + '\n\n' : ''}`.
 *
 * Sub-decisions locked 2026-05-27:
 *   1. NO model sentences (bulky; coach references them via existing
 *      improvementQueue section).
 *   2. Top 3 directives only (headline framing; full 5 in dump).
 *   3. Phase level + focusAreas (skip reasoning — downstream-derivable).
 *   4. Include committeeOneLiner (anchors "what this essay IS").
 *   5. Partial-emit when only some fields available.
 */
export function buildDiagnosticSnapshot(profile: Readonly<EssayProfile>): string {
  if (!isDiagnosticSnapshotEnabled()) return '';

  const brief = profile.executiveBrief ?? null;
  const committeeOneLiner = profile.aoFirstRead?.committeeOneLiner ?? null;
  const phase = profile.index?.improvementPhase ?? null;

  // Hard sanity-default: when nothing's available, emit nothing.
  if (!brief && !committeeOneLiner && !phase) return '';

  const lines: string[] = ['=== DIAGNOSTIC SNAPSHOT (lead with this) ==='];

  if (brief) {
    lines.push(`VERDICT: ${brief.verdict}`);
    lines.push(`TARGET TIER: ${brief.targetTier}`);

    if (brief.directives.length > 0) {
      lines.push('TOP DIRECTIVES (act on these first):');
      // Defense — Brief validator enforces exactly 5, but read defensively.
      const topDirectives = brief.directives.slice(0, 3);
      for (let i = 0; i < topDirectives.length; i++) {
        const d = topDirectives[i];
        lines.push(`  ${i + 1}. ${d.action} — ${d.rationale}`);
      }
    }
  }

  if (committeeOneLiner && committeeOneLiner.trim().length > 0) {
    lines.push(`COMMITTEE ONE-LINER: ${committeeOneLiner}`);
  }

  if (phase) {
    const focusAreas = phase.focusAreas?.length > 0
      ? phase.focusAreas.join(', ')
      : '(none specified)';
    lines.push(`CURRENT PHASE: ${phase.level} — focus: ${focusAreas}`);
  }

  return lines.join('\n');
}
