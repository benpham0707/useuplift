// ============================================================================
// PARAGRAPH REMAP BUILDER (Phase 1 D-1.7 — F7 mitigation)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.7 (this deliverable's contract).
//
// What this does:
//   Builds a deterministic OLD-paragraph-index → NEW-paragraph-index map for
//   a structural edit (reorder / insert / delete / paired modification).
//   `priorAnnotationsBuilder` (D-1.6) uses this map to re-key prior-iteration
//   TaughtMoves into the current iteration's paragraph layout BEFORE running
//   the landing detector — so a critique against OLD P3 lands at NEW P2 when
//   the student swapped P2↔P3, not at NEW P3 (which is now a different
//   paragraph and would be a misattribution).
//
//   The algorithm mirrors `editUnderstandingService.computeEditDiff`'s
//   pairing logic exactly. The two MUST stay lockstep — if they disagree on
//   which old paragraph is "the same as" which new paragraph, the builder
//   and the diff carry contradictory views of what the edit was, and
//   downstream debugging becomes ~impossible. The helpers `hashString`,
//   `splitParagraphs`, and `overlapRatio` are imported from
//   `editUnderstandingService` (D1 sub-option in the D-1.7 plan) precisely
//   to eliminate the drift hazard.
//
// Output shape:
//   `Map<oldIdx, ParagraphRemapEntry>` where ParagraphRemapEntry is either
//   the new index (number) or `{ dropped: true, reason }`. The richer
//   shape (vs. `number | null`) lets the builder pass the drop reason
//   straight to telemetry without re-deriving it. Use `isDropped(entry)`
//   for predicate checks; use `newIndexOrNull(entry)` for terse access.
//
// Failure surface (per the spec's "Remap function error → throw"):
//   - Malformed inputs (non-arrays, EditDiff missing structural fields) →
//     throw fail-fast.
//   - Cross-validation mismatch between computed deletions and
//     `diff.structural.paragraphsRemoved` → throw. This is the belt-and-
//     suspenders catch for the case where the helpers somehow drift from
//     `computeEditDiff` despite sharing source.
//   - Ambiguity (e.g., one old paragraph could match two new candidates,
//     positional tiebreak picks one, the other gets `dropped`) → NOT an
//     error; the move is dropped from priorAnnotations rather than
//     misattributed (the durable Finding carries the claim instead).

import {
  hashString,
  splitParagraphs,
  overlapRatio,
} from './editUnderstandingService';
import type { EditDiff } from '../profileTypes';

// ─── Public types ──────────────────────────────────────────────────────

export type ParagraphRemapDropReason =
  | 'paragraph_deleted'
  | 'ambiguous_remap_no_unique_target';

export type ParagraphRemapEntry =
  | number
  | { dropped: true; reason: ParagraphRemapDropReason };

/**
 * Map keyed by OLD (pre-edit) paragraph index. Every old index in
 * `[0, oldParagraphTexts.length)` appears exactly once in the map. Domain
 * coverage is part of the contract — callers can trust that any oldIdx
 * within range produces a defined entry.
 */
export type ParagraphRemap = ReadonlyMap<number, ParagraphRemapEntry>;

export interface BuildParagraphRemapInput {
  oldParagraphTexts: readonly string[];
  newParagraphTexts: readonly string[];
  /**
   * Used for cross-validation only. The remap is computed from the texts
   * (the source of truth); the diff is consulted to verify our computed
   * deletion set matches `structural.paragraphsRemoved` — if it doesn't,
   * the helpers have drifted and we throw rather than silently disagree
   * with downstream consumers of the diff.
   *
   * Phase-5b cross-validation (audit fix): for every `paragraphChanges[]`
   * entry with `changeType: 'modified'`, the remap MUST have an OLD→NEW
   * pairing landing at that NEW index — phase-2 overlap-pairing should
   * agree with `computeEditDiff`'s pairing on the same inputs. So we also
   * read `paragraphChanges` here.
   */
  diff: Pick<EditDiff, 'structural' | 'paragraphChanges'>;
}

// ─── Public predicates ─────────────────────────────────────────────────

export function isDropped(
  entry: ParagraphRemapEntry,
): entry is { dropped: true; reason: ParagraphRemapDropReason } {
  return typeof entry === 'object' && entry !== null && 'dropped' in entry;
}

/**
 * Convenience: return the new index if mapped, else `null` (collapses both
 * drop reasons). Useful for callers that only care about the "is there a
 * landing site or not" question.
 */
export function newIndexOrNull(entry: ParagraphRemapEntry): number | null {
  return isDropped(entry) ? null : entry;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Build the OLD → NEW paragraph index remap for a structural edit.
 *
 * Algorithm phases (mirroring computeEditDiff lines 256–369 exactly):
 *   1. Hash-equal positional matching: paragraphs with identical content,
 *      pair each new index to its positionally-closest unconsumed old
 *      index (same as the unchanged-detection pass in computeEditDiff).
 *   1b. Cross-validate phase-1 consumption against
 *       `diff.structural.paragraphsRemoved` (which is itself a phase-1
 *       complement). Mismatch → throw — this is the catch for helper drift.
 *   2. Overlap pairing on remaining: for unpaired new indices, find the
 *      best unpaired old index with `overlapRatio > 0.30`.
 *   3. Mark every still-unpaired old index as a drop, with a reason:
 *      - `paragraph_deleted` when no new paragraph shares its hash, or
 *      - `ambiguous_remap_no_unique_target` when at least one new
 *        paragraph shares its hash but was already claimed by a duplicate.
 */
export function buildParagraphRemap(
  input: BuildParagraphRemapInput,
): ParagraphRemap {
  validateInput(input);

  const { oldParagraphTexts: oldParas, newParagraphTexts: newParas } = input;

  // Phase 1: structurally identical (same hash, positional-closest).
  // Mirrors computeEditDiff lines 256–290 exactly. Build hash → indices map
  // first so duplicate paragraphs (same hash) all get tracked.
  const oldHashToIndices = new Map<number, number[]>();
  for (let oi = 0; oi < oldParas.length; oi++) {
    const h = hashString(oldParas[oi]);
    const bucket = oldHashToIndices.get(h);
    if (bucket) {
      bucket.push(oi);
    } else {
      oldHashToIndices.set(h, [oi]);
    }
  }

  const newHashes = newParas.map((p) => hashString(p));

  const remap = new Map<number, ParagraphRemapEntry>();
  const phase1ConsumedOld = new Set<number>();

  for (let ni = 0; ni < newParas.length; ni++) {
    const h = newHashes[ni];
    const candidates = oldHashToIndices.get(h);
    if (!candidates || candidates.length === 0) continue;

    // Among unconsumed candidates, pick the one positionally closest to ni.
    // Strict-less ties → first-seen wins (stable iteration). Identical to
    // computeEditDiff's tiebreak.
    const available = candidates.filter((oi) => !phase1ConsumedOld.has(oi));
    if (available.length === 0) continue;

    const best = available.reduce((prev, curr) =>
      Math.abs(curr - ni) < Math.abs(prev - ni) ? curr : prev,
    );
    phase1ConsumedOld.add(best);
    remap.set(best, ni);
  }

  // Phase 5 (cross-validation, evaluated here while phase-1 state is fresh):
  // computeEditDiff's `paragraphsRemoved` is the complement of
  // `unchangedOldIndices` — i.e., old indices NOT consumed by phase 1.
  // It does NOT account for the overlap-pairing pass (lines 339–369),
  // which means modified-and-reordered paragraphs (paired via overlap) still
  // appear in `paragraphsRemoved`. So we cross-validate phase-1 consumption,
  // not the final dropped set.
  const computedPhase1Removed = new Set<number>();
  for (let oi = 0; oi < oldParas.length; oi++) {
    if (!phase1ConsumedOld.has(oi)) computedPhase1Removed.add(oi);
  }
  const expectedRemoved = new Set<number>(input.diff.structural.paragraphsRemoved);
  if (!setsEqual(computedPhase1Removed, expectedRemoved)) {
    const computedSorted = [...computedPhase1Removed].sort((a, b) => a - b);
    const expectedSorted = [...expectedRemoved].sort((a, b) => a - b);
    throw new Error(
      `[paragraphRemapBuilder] paragraphRemap mismatch with ` +
        `diff.structural.paragraphsRemoved: computedPhase1Removed=${JSON.stringify(computedSorted)} ` +
        `expected=${JSON.stringify(expectedSorted)}. The remap helpers have drifted ` +
        `from editUnderstandingService.computeEditDiff; this is the catch the spec calls ` +
        `out as "the part hardest to debug post-hoc."`,
    );
  }

  // Phase 2: paired modifications — overlap >= 0.30, mirroring
  // computeEditDiff lines 339–369.
  const unpairedOldIndices: number[] = [];
  for (let oi = 0; oi < oldParas.length; oi++) {
    if (!phase1ConsumedOld.has(oi)) unpairedOldIndices.push(oi);
  }
  const consumedNew = new Set<number>();
  for (const v of remap.values()) {
    if (typeof v === 'number') consumedNew.add(v);
  }
  const unpairedNewIndices: number[] = [];
  for (let ni = 0; ni < newParas.length; ni++) {
    if (!consumedNew.has(ni)) unpairedNewIndices.push(ni);
  }

  const pairedOldByOverlap = new Set<number>();
  for (const ni of unpairedNewIndices) {
    let bestOldIdx: number | undefined;
    let bestOverlap = 0.30; // strict-greater threshold; matches computeEditDiff

    for (const oi of unpairedOldIndices) {
      if (pairedOldByOverlap.has(oi)) continue;
      const ov = overlapRatio(oldParas[oi], newParas[ni]);
      if (ov > bestOverlap) {
        bestOverlap = ov;
        bestOldIdx = oi;
      }
    }

    if (bestOldIdx !== undefined) {
      remap.set(bestOldIdx, ni);
      pairedOldByOverlap.add(bestOldIdx);
    }
  }

  // Phase 3 + 4: every remaining old index is a drop. Disambiguate the
  // reason: if at least one new paragraph shares this old's hash but was
  // already consumed by another old index (i.e., duplicated content where
  // the other duplicate claimed the only target), the reason is
  // `ambiguous_remap_no_unique_target`. Otherwise it's `paragraph_deleted`.
  for (let oi = 0; oi < oldParas.length; oi++) {
    if (remap.has(oi)) continue;
    if (pairedOldByOverlap.has(oi)) continue; // (defensive — should already be in remap)
    const h = hashString(oldParas[oi]);
    const sameHashNewIndices: number[] = [];
    for (let ni = 0; ni < newHashes.length; ni++) {
      if (newHashes[ni] === h) sameHashNewIndices.push(ni);
    }
    const reason: ParagraphRemapDropReason =
      sameHashNewIndices.length > 0
        ? 'ambiguous_remap_no_unique_target'
        : 'paragraph_deleted';
    remap.set(oi, { dropped: true, reason });
  }

  // Phase 5b (audit fix): cross-validate phase-2 pairings against
  // `diff.paragraphChanges[]` modified entries. The diff and the remap
  // both pair unpaired-old-with-unpaired-new via the same 0.30 overlap
  // threshold + greedy strategy. Phase 1 cross-validation (above) catches
  // hash-equal drift; this phase-5b catch detects drift in the overlap
  // pass — silent if missed because the two pipelines run independently
  // and a misalignment only surfaces downstream as a misattributed
  // priorAnnotation. Specifically: every `paragraphChanges[]` entry with
  // `changeType: 'modified'` should have a corresponding OLD→NEW remap
  // pairing landing at that NEW index. If it doesn't, phase-2 has drifted.
  if (input.diff.paragraphChanges !== undefined) {
    const remapNewIndices = new Set<number>();
    for (const v of remap.values()) {
      if (typeof v === 'number') remapNewIndices.add(v);
    }
    const missingPairings: number[] = [];
    for (const pc of input.diff.paragraphChanges) {
      if (pc.changeType !== 'modified') continue;
      if (!remapNewIndices.has(pc.paragraphIndex)) {
        missingPairings.push(pc.paragraphIndex);
      }
    }
    if (missingPairings.length > 0) {
      throw new Error(
        `[paragraphRemapBuilder] phase-2 cross-validation failed: ` +
          `diff.paragraphChanges flags NEW paragraph indices ${JSON.stringify(missingPairings)} ` +
          `as 'modified' (paired in computeEditDiff via overlap-pairing), but the remap does not ` +
          `contain a corresponding OLD→NEW mapping. This indicates phase-2 overlap-pairing has ` +
          `drifted between this helper and editUnderstandingService.computeEditDiff — most ` +
          `commonly because the 0.30 overlap threshold or the greedy ordering changed in one ` +
          `place but not the other.`,
      );
    }
  }

  return remap;
}

// ─── Internal helpers ──────────────────────────────────────────────────

function setsEqual(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function validateInput(input: BuildParagraphRemapInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('[paragraphRemapBuilder] input is missing or not an object.');
  }
  if (!Array.isArray(input.oldParagraphTexts)) {
    throw new Error('[paragraphRemapBuilder] input.oldParagraphTexts must be an array.');
  }
  if (!Array.isArray(input.newParagraphTexts)) {
    throw new Error('[paragraphRemapBuilder] input.newParagraphTexts must be an array.');
  }
  for (let i = 0; i < input.oldParagraphTexts.length; i++) {
    if (typeof input.oldParagraphTexts[i] !== 'string') {
      throw new Error(
        `[paragraphRemapBuilder] input.oldParagraphTexts[${i}] must be a string.`,
      );
    }
  }
  for (let i = 0; i < input.newParagraphTexts.length; i++) {
    if (typeof input.newParagraphTexts[i] !== 'string') {
      throw new Error(
        `[paragraphRemapBuilder] input.newParagraphTexts[${i}] must be a string.`,
      );
    }
  }
  if (!input.diff || typeof input.diff !== 'object') {
    throw new Error('[paragraphRemapBuilder] input.diff is missing or not an object.');
  }
  if (!input.diff.structural || typeof input.diff.structural !== 'object') {
    throw new Error('[paragraphRemapBuilder] input.diff.structural is missing.');
  }
  if (!Array.isArray(input.diff.structural.paragraphsRemoved)) {
    throw new Error(
      '[paragraphRemapBuilder] input.diff.structural.paragraphsRemoved must be an array.',
    );
  }
}

// ─── Re-export for callers that want the helpers without a second import ──

export { splitParagraphs };
