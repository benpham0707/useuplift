// ============================================================================
// PRIOR ANNOTATIONS BUILDER (Phase 1 D-1.6)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_ITERATION_LOOP_DESIGN.md
//   §5 (landing detection — the heart of the loop)
//   §7.5 (pseudo-flow that this file implements)
//   §7.1 (TaughtMove + IterationLedger types this consumes)
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.6 (this deliverable's contract).
//
// What this does:
//   The dead-wire fix at analysisOrchestrator.ts:850. The L5 prompt at
//   deepAnnotationService.ts:1402–1416 ALREADY consumes a `priorAnnotations`
//   parameter correctly — but the orchestrator was passing `undefined`. This
//   builder is what fills that argument on iteration ≥ 2.
//
//   The builder reads `iterationLedger.taughtMoves[]`, filters to the prior
//   iteration's moves, runs the landing detector (D-1.3 + D-1.4 prompt) on
//   each, groups by paragraphIndex, and returns the per-paragraph context the
//   L5 prompt knows how to consume.
//
//   On iteration 1 → returns `undefined` (no priors exist). On iteration ≥ 2
//   with no prior moves → returns an empty Map. On iteration ≥ 2 with priors
//   → returns a populated Map keyed by paragraphIndex.
//
// Failure surface (per the no-fallback charter):
//   - Missing edit for a paragraph with priors → throw with the move id +
//     paragraph index named. The orchestrator MUST provide an EditSignal
//     for every paragraph that has prior moves; for unedited paragraphs,
//     `oldText === newText` with `significance: 'minor'` is the honest
//     representation.
//   - Landing detector failure on any move → re-throw, structurally
//     enriched with the priorMoveId so the orchestrator's error path can
//     name the failing move (telemetry surfaces the chain).
//   - Malformed inputs (negative iteration, missing ledger) → fail-fast.
//   - We do NOT silently skip moves on missing edits, default to
//     `addressedByEdit: false` on detector failure, or fabricate landing
//     statuses. Every failure mode is visible; the iteration halts.
//
// Index remap on structural reorder is D-1.7 (this file's extension). When
// a `paragraphRemap` is supplied, prior moves' OLD paragraph indices are
// translated to NEW indices before grouping; moves whose paragraph was
// deleted (or ambiguously remapped to no unique target) are DROPPED rather
// than misattributed (the durable Finding carries the claim instead). The
// drop decision is logged via console (tail-able with the
// `[priorAnnotationsBuilder]` prefix) but is NOT a failure — only remap-
// derivation errors throw.

import { detectLanding, type LandingDetectorInput } from './landingDetector';
import {
  buildParagraphRemap,
  isDropped,
  type ParagraphRemap,
  type ParagraphRemapDropReason,
} from './paragraphRemapBuilder';
import {
  computeEditDiff,
  splitParagraphs,
} from './editUnderstandingService';
import {
  getCurrentIteration,
  getPriorIterationSnapshotText,
} from '../profileManager/essayProfileManager';
import { emitIterationEvent } from '../telemetry/iterationTelemetry';
import type {
  EssayProfile,
  IterationLedger,
  PriorAnnotationContext,
  TaughtMove,
} from '../profileTypes';

// ─── Public input types ────────────────────────────────────────────────

/**
 * Per-paragraph edit signal used by the landing detector. The orchestrator
 * MUST construct one entry for every paragraph that has prior moves; for
 * paragraphs the student didn't touch, `oldText === newText` with
 * `significance: 'minor'` is the correct honest representation.
 */
export interface EditSignal {
  oldText: string;
  newText: string;
  significance: 'minor' | 'moderate' | 'significant' | 'transformative';
}

/** Optional Signal B (re-detection) per paragraph. */
export interface RedetectionSignal {
  symptomFlagged: boolean;
  reasoning?: string;
}

/** Optional Signal C (chat behavior) per individual TaughtMove. */
export interface ChatBehaviorSignal {
  engaged: boolean;
  mood: 'curious' | 'frustrated' | 'dismissive' | 'neutral';
  raw?: string;
}

/** Builder input. All optional signals default to absent. */
export interface PriorAnnotationsBuilderInput {
  /**
   * D-1.11 Step 15: essay ID for telemetry buffer keying. Threaded
   * through to detectLanding's LandingDetectorInput so its emitStepStart/
   * Success/Failure calls land in the correct (essayId, iter) audit
   * bucket. Without this, concurrent essays would cross-pollinate
   * each other's landing-detector telemetry streams.
   */
  essayId: string;
  /** The full iteration ledger. `taughtMoves[]` is the source of priors. */
  iterationLedger: IterationLedger;
  /**
   * The iteration the orchestrator is CURRENTLY producing analysis for.
   * Iteration 1 → no priors exist (returns undefined). Iteration N (N ≥ 2)
   * → priors are the moves with `taughtAtIteration === N - 1`.
   */
  currentIteration: number;
  /**
   * Edit signal per paragraph (keyed by zero-indexed paragraphIndex). MUST
   * cover every paragraph referenced by prior moves; missing entries throw.
   */
  perParagraphEdits: Map<number, EditSignal>;
  /** Optional Signal B per paragraph. Absent paragraphs → no B passed. */
  perParagraphRedetection?: Map<number, RedetectionSignal>;
  /** Optional Signal C per move (keyed by TaughtMove.id). Absent → no C. */
  perMoveChatBehavior?: Map<string, ChatBehaviorSignal>;
  /**
   * Optional OLD → NEW paragraph index remap (D-1.7). When supplied:
   *   - Moves whose `location.paragraphIndex` maps to a `dropped` entry are
   *     DROPPED from priorAnnotations (not misattributed). A
   *     `[priorAnnotationsBuilder] move-dropped` console event is emitted
   *     for the orchestrator's debug surface.
   *   - Moves whose `location.paragraphIndex` is NOT a key in the remap
   *     fall through to identity (oldIdx === newIdx) — this preserves the
   *     D-1.6 baseline for ranges the remap doesn't cover.
   *   - Moves whose `location.paragraphIndex` maps to a number `n` are
   *     grouped under NEW key `n` in the result Map. Edit-signal lookup
   *     (`perParagraphEdits.get(...)`) STILL uses the OLD index; the
   *     orchestrator builds `perParagraphEdits` keyed by OLD indices.
   *
   * Compute via `buildParagraphRemap` (D-1.7 sibling helper). When omitted,
   * builder behaves exactly as D-1.6 (identity for all priors).
   */
  paragraphRemap?: ParagraphRemap;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Build the per-paragraph PriorAnnotationContext map for the current
 * iteration's L5 prompt.
 *
 * Returns:
 *   - `undefined` when `currentIteration <= 1` (no priors structurally).
 *   - Empty `Map` when `currentIteration ≥ 2` but the ledger has no prior
 *     moves at iteration `currentIteration - 1`.
 *   - Populated `Map<paragraphIndex, PriorAnnotationContext>` otherwise.
 *
 * Sequential detector calls — the no-silent-fallback ESLint rule (D-0.12)
 * flags `Promise.allSettled`; first-failure-throws is the desired behavior
 * here (a detector failure halts the iteration; partial data is not useful
 * for downstream L5).
 *
 * Telemetry: each detectLanding call emits its own start/success/failure
 * step events; this builder doesn't add a wrapping step (the per-move
 * granularity is more useful for debugging).
 */
export async function buildPriorAnnotations(
  input: PriorAnnotationsBuilderInput,
): Promise<Map<number, PriorAnnotationContext> | undefined> {
  validateInput(input);

  if (input.currentIteration <= 1) {
    return undefined;
  }

  const priorIteration = input.currentIteration - 1;
  const priors = input.iterationLedger.taughtMoves.filter(
    (m) => m.taughtAtIteration === priorIteration,
  );

  // No priors → return empty Map (structurally distinct from iteration 1's
  // `undefined`; tells the L5 prompt "we're past iteration 1 but nothing
  // carried forward").
  if (priors.length === 0) {
    return new Map();
  }

  const result = new Map<number, PriorAnnotationContext>();

  // Sequential — keeps error chain clean and avoids the lint rule on
  // Promise.allSettled. Per-move detector call ~3–5s; small N typical (5–10
  // moves per iteration) so total ~15–50s. Acceptable for off-critical-path.
  for (const move of priors) {
    const oldParagraphIndex = move.location.paragraphIndex;

    // D-1.7: consult remap BEFORE edit-signal lookup. Dropped moves don't
    // need an edit signal (the paragraph is gone or ambiguous), so the
    // missing-edit fail-fast must NOT fire on them. Drop here, log,
    // continue — orchestrator's debug surface tail picks up the event.
    const remapEntry = input.paragraphRemap?.get(oldParagraphIndex);
    if (remapEntry !== undefined && isDropped(remapEntry)) {
      emitMoveDropped({
        essayId: input.essayId,
        moveId: move.id,
        oldParagraphIndex,
        reason: remapEntry.reason,
        taughtAtIteration: move.taughtAtIteration,
        currentIteration: input.currentIteration,
        findingId: move.findingId,
        contentSummarySnippet: move.contentSummary.slice(0, 80),
      });
      continue;
    }
    // newParagraphIndex resolution: explicit number from remap, OR
    // identity fallback when remap doesn't cover this old index (no
    // structural change for this paragraph) OR when remap absent entirely.
    const newParagraphIndex =
      typeof remapEntry === 'number' ? remapEntry : oldParagraphIndex;

    const detectorInput = buildDetectorInput(move, input);
    const landing = await runDetectorWithEnrichedError(detectorInput, move);

    // D-1.6.5: Write back the detected landing to the source TaughtMove on
    // the ledger. Before this fix, detector output was consumed only into
    // `addressedByEdit` below — `move.landing` stayed `undefined` forever,
    // making the cross-iteration audit and any future landing-history
    // consumer (cross-iteration synthesis, Conversator "have we worked on
    // this before?" handler) impossible.
    //
    // Honors the D-1.15.0 carve-out (see
    // tests/property/iterationLedgerAppendOnly.ts top-of-file block):
    // one-shot `undefined → populated` transition only. The
    // priorIteration filter at line 177-179 should prevent re-detecting
    // the same move on a later iteration (we only consider moves where
    // `taughtAtIteration === currentIteration - 1`), so a populated
    // landing entering this loop is a contract violation worth halting on.
    //
    // The filter returns same-reference TaughtMove objects from the
    // ledger array (Array.filter preserves element refs), so this
    // assignment mutates the canonical entry on
    // `iterationLedger.taughtMoves[]` directly. That is the intended
    // persistence path — no separate write needed.
    if (move.landing !== undefined) {
      // R-6 audit closure (D-1.6.5, 2026-04-30): `pending` status is
      // treated as already-populated by this throw — the D-1.15.0
      // carve-out is `undefined → populated`, NOT `pending → populated`.
      // If a future async/streaming detector wants to write `pending`
      // first and the terminal status later, the carve-out spec must
      // be widened FIRST (and Property 5 + this throw updated). Don't
      // silently allow `pending → terminal` overwrites by relaxing
      // this check — that would erode the spec amendment's tight scope.
      throw new Error(
        `[priorAnnotationsBuilder] D-1.15.0 carve-out violation: TaughtMove ` +
          `id="${move.id}" already has landing populated ` +
          `(status="${move.landing.status}", ` +
          `detectedAtIteration=${move.landing.detectedAtIteration}). ` +
          `Re-detection on iteration ${input.currentIteration} would have mutated ` +
          `a populated landing field, which is forbidden by the one-shot rule. ` +
          `Investigate the priorIteration filter (priorAnnotationsBuilder.ts:177-179) — ` +
          `it should have excluded this move.`,
      );
    }
    move.landing = {
      status: landing.status,
      detectedAtIteration: input.currentIteration,
      confidence: landing.confidence,
      reasoning: landing.reasoning,
      signalsUsed: landing.signalsUsed,
    };

    const annotation = {
      content: move.contentSummary,
      // PriorAnnotationContext.type is documented as `string`; the
      // downstream consumer (deepAnnotationService.ts:1402–1416) only reads
      // `addressedByEdit`, `teachingMode`, and `content`. We populate
      // `'taught_move'` as an honest marker that this entry was
      // reconstituted from a prior-iteration TaughtMove (carry-forward
      // path) rather than minted fresh by L5 in this iteration.
      type: 'taught_move',
      teachingMode: move.teachingMode,
      addressedByEdit: landing.status === 'addressed',
    };

    const existing = result.get(newParagraphIndex);
    if (existing) {
      existing.priorAnnotations.push(annotation);
    } else {
      result.set(newParagraphIndex, { priorAnnotations: [annotation] });
    }
  }

  return result;
}

/**
 * Structured drop log for the orchestrator's debug surface (D-1.7). Emits
 * a single-line JSON record with the `[priorAnnotationsBuilder]` prefix —
 * tail-able alongside the iterationTelemetry stream. Distinct from the
 * iteration's event ledger because a drop is neither a "started" nor
 * "succeeded" / "failed" step; it's a deliberate skip.
 */
function emitMoveDropped(payload: {
  essayId: string;
  moveId: string;
  oldParagraphIndex: number;
  reason: ParagraphRemapDropReason;
  taughtAtIteration: number;
  currentIteration: number;
  findingId?: string;
  contentSummarySnippet: string;
}): void {
  // [round-1 audit §4.F / T2.4 closure] Switch from console.log to the
  // structured iterationTelemetry channel so drops land in
  // IterationRecord.events[] alongside every other iteration event.
  //
  // [round-2 audit LOW-1 closure 2026-04-28] Status flipped from
  // 'succeeded' to 'failed'. The IterationTelemetryEvent type
  // (profileTypes.ts:IterationTelemetryEvent) documents `error` as
  // "populated only on `status: 'failed'`" — populating `error`
  // alongside `status: 'succeeded'` violated that invariant.
  // Semantically a drop IS a degradation from the audit-trail's
  // perspective (the move's prior context is lost from the L5 prompt
  // even though the no-misattribution contract makes the drop
  // deliberate); 'failed' makes that visible in audit grep without
  // changing the system's graceful-degradation behavior. Matches the
  // sibling `carryForward.decision_append_failure` event's status.
  emitIterationEvent(payload.essayId, {
    iteration: payload.currentIteration,
    step: 'priorAnnotations.move_dropped',
    paragraphIndex: payload.oldParagraphIndex,
    status: 'failed',
    error: {
      message: `prior-iteration TaughtMove dropped from priorAnnotations (reason: ${payload.reason})`,
      code: payload.reason,
      context: {
        moveId: payload.moveId,
        taughtAtIteration: payload.taughtAtIteration,
        findingId: payload.findingId,
        contentSummarySnippet: payload.contentSummarySnippet,
        source: 'priorAnnotationsBuilder',
      },
    },
    timestamp: new Date().toISOString(),
  });
}

// ─── Internal helpers ──────────────────────────────────────────────────

/**
 * Construct the LandingDetectorInput for a given prior move. Throws if the
 * required edit signal for the move's paragraph is missing — the
 * orchestrator must always provide it.
 */
function buildDetectorInput(
  move: TaughtMove,
  input: PriorAnnotationsBuilderInput,
): LandingDetectorInput {
  const paragraphIndex = move.location.paragraphIndex;
  const edit = input.perParagraphEdits.get(paragraphIndex);
  if (!edit) {
    throw new Error(
      `[priorAnnotationsBuilder] missing edit signal for paragraphIndex=${paragraphIndex}; ` +
        `prior move id="${move.id}" cannot be evaluated. The orchestrator must provide an ` +
        `EditSignal entry for every paragraph that has prior moves (use oldText === newText ` +
        `with significance "minor" for unedited paragraphs).`,
    );
  }

  const newAnalysisAtLocation = input.perParagraphRedetection?.get(paragraphIndex);
  const chatBehavior = input.perMoveChatBehavior?.get(move.id);

  const detectorInput: LandingDetectorInput = {
    essayId: input.essayId,
    priorTaughtMove: move,
    edit,
  };
  if (newAnalysisAtLocation !== undefined) {
    detectorInput.newAnalysisAtLocation = newAnalysisAtLocation;
  }
  if (chatBehavior !== undefined) {
    detectorInput.chatBehavior = chatBehavior;
  }
  return detectorInput;
}

/**
 * Run the landing detector and enrich any thrown error with the priorMoveId.
 * The detector's own error already includes structured context via its
 * emitStepFailure call; this wrapper adds the builder-level context so the
 * orchestrator's catch can identify which move's evaluation failed.
 */
async function runDetectorWithEnrichedError(
  detectorInput: LandingDetectorInput,
  move: TaughtMove,
): Promise<Awaited<ReturnType<typeof detectLanding>>> {
  try {
    return await detectLanding(detectorInput);
  } catch (err) {
    const wrapped = new Error(
      `[priorAnnotationsBuilder] landing detector failed for prior move id="${move.id}" ` +
        `at paragraphIndex=${move.location.paragraphIndex}: ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
    // Preserve the original cause for stack traversal upstream.
    (wrapped as Error & { cause?: unknown }).cause = err;
    throw wrapped;
  }
}

/**
 * Fail-fast input validation. Catches caller-side bugs before any detector
 * call is made.
 */
function validateInput(input: PriorAnnotationsBuilderInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('[priorAnnotationsBuilder] input is missing or not an object.');
  }
  if (typeof input.essayId !== 'string' || input.essayId.length === 0) {
    throw new Error('[priorAnnotationsBuilder] input.essayId is missing or empty (D-1.11 Step 15: required for telemetry buffer keying).');
  }
  if (!input.iterationLedger || typeof input.iterationLedger !== 'object') {
    throw new Error('[priorAnnotationsBuilder] input.iterationLedger is missing or not an object.');
  }
  if (!Array.isArray(input.iterationLedger.taughtMoves)) {
    throw new Error('[priorAnnotationsBuilder] input.iterationLedger.taughtMoves must be an array.');
  }
  if (
    typeof input.currentIteration !== 'number' ||
    !Number.isInteger(input.currentIteration) ||
    input.currentIteration < 1
  ) {
    throw new Error(
      `[priorAnnotationsBuilder] input.currentIteration must be a positive integer; ` +
        `got ${JSON.stringify(input.currentIteration)}.`,
    );
  }
  if (!(input.perParagraphEdits instanceof Map)) {
    throw new Error('[priorAnnotationsBuilder] input.perParagraphEdits must be a Map.');
  }
  if (
    input.perParagraphRedetection !== undefined &&
    !(input.perParagraphRedetection instanceof Map)
  ) {
    throw new Error('[priorAnnotationsBuilder] input.perParagraphRedetection must be a Map when present.');
  }
  if (
    input.perMoveChatBehavior !== undefined &&
    !(input.perMoveChatBehavior instanceof Map)
  ) {
    throw new Error('[priorAnnotationsBuilder] input.perMoveChatBehavior must be a Map when present.');
  }
  if (input.paragraphRemap !== undefined && !(input.paragraphRemap instanceof Map)) {
    throw new Error('[priorAnnotationsBuilder] input.paragraphRemap must be a Map when present.');
  }
}

// ============================================================================
// PER-PARAGRAPH EDIT-SIGNAL HELPER (D-1.8)
// ============================================================================
//
// Bridge between the mechanical `EditDiff` + per-iteration paragraph remap
// and the keyed `Map<oldIdx, EditSignal>` shape the builder consumes. The
// orchestrator produces this Map at Phase 6 right before calling
// `buildPriorAnnotations`. Signed contract:
//
//   - Keyed by OLD paragraph index (matching prior moves' location.paragraphIndex).
//   - Covers EVERY old paragraph in [0, oldParagraphTexts.length) — even
//     unchanged ones (`oldText === newText`, `significance: 'minor'`). The
//     builder's missing-edit fail-fast (D-1.6 contract) requires full domain
//     coverage for any paragraph that has a prior move; covering all of them
//     is simpler and harmless.
//   - newText resolution per old index uses the supplied `paragraphRemap`:
//     `remap[oldIdx] === <number>` → use `newParagraphTexts[that number]`;
//     `remap[oldIdx]` is dropped → use `''` (empty); remap absent → identity.
//   - significance: see §3 of the D-1.8 plan. The honest priority is the
//     LLM-judged overall significance from `editUnderstandingService` (when
//     available, propagated uniformly per locked decision); mechanical
//     fallback derives per-paragraph significance from `changeRatio` cuts.

/**
 * The mechanical-significance bucket cuts (D-1.8 §4). Each cut is the
 * INCLUSIVE upper bound of its bucket. Calibration-anchored to the
 * `editUnderstandingService` prompt anchors:
 *   - 0.10: noise floor (typo / one-word swap).
 *   - 0.40: paragraph-identity inflection (matches the inverse of the 0.30
 *     overlap-pairing threshold in computeEditDiff).
 *   - 0.80: wholesale-replacement floor (paragraphs above this are
 *     effectively new, even if technically "modified").
 */
export const MECHANICAL_SIGNIFICANCE_CUTS = Object.freeze({
  minor: 0.10,
  moderate: 0.40,
  significant: 0.80,
} as const);

/**
 * Map a per-paragraph `changeRatio` to a coarse `EditSignal.significance`
 * bucket. Used as the FALLBACK when no upstream LLM-judged significance was
 * threaded through `PipelineInput.editSignificance`. When that signal IS
 * present, the orchestrator uses it directly (locked decision: never discard
 * paid LLM output to redo a coarser derivation).
 */
export function mechanicalSignificance(
  changeRatio: number,
): EditSignal['significance'] {
  if (!Number.isFinite(changeRatio) || changeRatio < 0) {
    throw new Error(
      `[priorAnnotationsBuilder.mechanicalSignificance] changeRatio must be a finite, non-negative number; got ${changeRatio}.`,
    );
  }
  if (changeRatio <= MECHANICAL_SIGNIFICANCE_CUTS.minor) return 'minor';
  if (changeRatio <= MECHANICAL_SIGNIFICANCE_CUTS.moderate) return 'moderate';
  if (changeRatio <= MECHANICAL_SIGNIFICANCE_CUTS.significant) return 'significant';
  return 'transformative';
}

// [round-1 audit T3.2 closure] The dead `computeChangeRatioForParagraph`
// placeholder (zero callers; existed only to document the signature)
// was removed. The actual per-paragraph changeRatio computation is
// inline in `buildPerParagraphEdits` below where the OLD index, the
// NEW index from the remap, and the diff entry are all in scope —
// inline is clearer than three lookups via a helper that would have
// to receive all three parameters anyway.

export interface BuildPerParagraphEditsInput {
  /** Pre-edit paragraphs (`splitParagraphs(priorSnapshotText)`). */
  oldParagraphTexts: readonly string[];
  /** Post-edit paragraphs (`splitParagraphs(currentEssayText)`). */
  newParagraphTexts: readonly string[];
  /**
   * Mechanical diff between old and new texts. Caller computes via
   * `computeEditDiff(oldText, newText, profile?)` from editUnderstandingService.
   */
  diff: {
    paragraphChanges: ReadonlyArray<{
      paragraphIndex: number;
      changeType: 'modified' | 'added' | 'removed';
      sentenceChanges: ReadonlyArray<{ changeType: string }>;
    }>;
  };
  /**
   * OLD → NEW remap from D-1.7. Required: every old index must have an
   * entry (D-1.7 helper guarantees full-domain coverage).
   */
  paragraphRemap: ParagraphRemap;
  /**
   * Optional LLM-judged overall edit significance from upstream
   * `editUnderstandingService.understandEdit()`. When present, applied
   * UNIFORMLY to every changed paragraph (locked D-1.8 decision: don't
   * fabricate per-paragraph LLM judgments we didn't pay for; uniform
   * propagation is the honest read of "the LLM judged the whole edit at
   * this level"). When absent, mechanical-significance fallback fires.
   */
  editSignificance?: EditSignal['significance'];
}

/**
 * Build the per-paragraph edit-signal Map keyed by OLD paragraph index.
 * Covers ALL old paragraphs (even unchanged ones — see contract above).
 *
 * Pure / no I/O. Throws fail-fast on caller-side bugs (mismatched array
 * lengths, missing remap entries, etc.) — the orchestrator's Phase 6
 * catch routes to buildPartialResult per the D-1.8 failure surface.
 */
export function buildPerParagraphEdits(
  input: BuildPerParagraphEditsInput,
): Map<number, EditSignal> {
  validateBuildPerParagraphEditsInput(input);

  const { oldParagraphTexts, newParagraphTexts, diff, paragraphRemap, editSignificance } = input;

  // Index `paragraphChanges` by the index they're keyed under, splitting
  // by changeType. computeEditDiff stores: NEW-idx for 'modified'/'added',
  // OLD-idx for 'removed'.
  const modifiedByNewIdx = new Map<number, { sentenceChanges: ReadonlyArray<{ changeType: string }> }>();
  const removedOldIdxSet = new Set<number>();
  for (const pc of diff.paragraphChanges) {
    if (pc.changeType === 'modified') modifiedByNewIdx.set(pc.paragraphIndex, { sentenceChanges: pc.sentenceChanges });
    else if (pc.changeType === 'removed') removedOldIdxSet.add(pc.paragraphIndex);
    // 'added' entries are NEW indices with no OLD counterpart — they don't
    // produce an entry in the OLD-keyed Map.
  }

  const splitSentencesLite = (text: string): string[] =>
    // Same boundary rule as splitSentences in editUnderstandingService for
    // the ratio denominator. We keep this lite-and-local to avoid coupling.
    // The denominator is approximate; the bucket cuts are coarse enough
    // that a sentence-tokenizer mismatch of ±1 won't change the bucket.
    text.split(/(?<=[.!?])\s+(?=[A-Z"'])/).filter((s) => s.trim().length > 0);

  const result = new Map<number, EditSignal>();

  for (let oldIdx = 0; oldIdx < oldParagraphTexts.length; oldIdx++) {
    const oldText = oldParagraphTexts[oldIdx];
    const remapEntry = paragraphRemap.get(oldIdx);
    if (remapEntry === undefined) {
      // D-1.7 helper guarantees full-domain coverage. A missing entry is
      // structural corruption — fail-fast.
      throw new Error(
        `[priorAnnotationsBuilder.buildPerParagraphEdits] paragraphRemap is missing an entry ` +
          `for oldParagraphIndex=${oldIdx}. Helper invariant violated; check buildParagraphRemap output.`,
      );
    }

    let newText: string;
    let significance: EditSignal['significance'];

    if (isDropped(remapEntry)) {
      // Paragraph deleted (or ambiguously remapped). The builder will drop
      // moves on this paragraph BEFORE looking up the edit signal, but
      // we still produce an honest entry in case the caller iterates.
      newText = '';
      // eslint-disable-next-line no-silent-fallback -- mode-selection: when paragraph is dropped (deleted/ambiguous), `editSignificance` from upstream LLM is preferred; mechanical fallback to 'transformative' models the wholesale-loss semantics the locked D-1.8 decision §"Significance source" picked.
      significance = editSignificance ?? 'transformative';
    } else {
      const newIdx = remapEntry; // number
      newText = newParagraphTexts[newIdx];
      if (newText === undefined) {
        throw new Error(
          `[priorAnnotationsBuilder.buildPerParagraphEdits] paragraphRemap maps ` +
            `oldParagraphIndex=${oldIdx} → newParagraphIndex=${newIdx}, but ` +
            `newParagraphTexts has length ${newParagraphTexts.length}. Helper input mismatch.`,
        );
      }

      // changeRatio for this old paragraph:
      //   - if modified: count of (added+removed+modified) sentenceChanges / oldSentences.length
      //   - if removed (caught above via isDropped on remap; but defensive):
      //       full deletion → 1.0
      //   - else (unchanged): 0.0
      const oldSentencesCount = Math.max(1, splitSentencesLite(oldText).length);
      let changeRatio = 0;
      if (removedOldIdxSet.has(oldIdx)) {
        changeRatio = 1.0;
      } else {
        const mod = modifiedByNewIdx.get(newIdx);
        if (mod) {
          let nonUnchanged = 0;
          for (const sc of mod.sentenceChanges) {
            if (sc.changeType !== 'unchanged') nonUnchanged++;
          }
          changeRatio = nonUnchanged / oldSentencesCount;
        }
      }

      // eslint-disable-next-line no-silent-fallback -- mode-selection: prefer the LLM-judged overall edit significance from upstream `editUnderstandingService` (locked D-1.8 decision: don't discard paid LLM output to redo a coarser derivation). Mechanical fallback only fires when no upstream signal exists (cold direct analyzeEssay calls, edits without an editOutput).
      significance = editSignificance ?? mechanicalSignificance(changeRatio);
    }

    result.set(oldIdx, { oldText, newText, significance });
  }

  return result;
}

function validateBuildPerParagraphEditsInput(input: BuildPerParagraphEditsInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('[priorAnnotationsBuilder.buildPerParagraphEdits] input is missing or not an object.');
  }
  if (!Array.isArray(input.oldParagraphTexts)) {
    throw new Error('[priorAnnotationsBuilder.buildPerParagraphEdits] input.oldParagraphTexts must be an array.');
  }
  if (!Array.isArray(input.newParagraphTexts)) {
    throw new Error('[priorAnnotationsBuilder.buildPerParagraphEdits] input.newParagraphTexts must be an array.');
  }
  if (!input.diff || !Array.isArray(input.diff.paragraphChanges)) {
    throw new Error('[priorAnnotationsBuilder.buildPerParagraphEdits] input.diff.paragraphChanges must be an array.');
  }
  if (!(input.paragraphRemap instanceof Map)) {
    throw new Error('[priorAnnotationsBuilder.buildPerParagraphEdits] input.paragraphRemap must be a Map.');
  }
  if (
    input.editSignificance !== undefined &&
    !['minor', 'moderate', 'significant', 'transformative'].includes(input.editSignificance)
  ) {
    throw new Error(
      `[priorAnnotationsBuilder.buildPerParagraphEdits] input.editSignificance must be one of ` +
        `'minor' | 'moderate' | 'significant' | 'transformative'; got ${JSON.stringify(input.editSignificance)}.`,
    );
  }
}

// ============================================================================
// ORCHESTRATOR COMPOSER (D-1.8)
// ============================================================================
//
// The single entry point analysisOrchestrator calls at Phase 6 to replace
// the line-850 `undefined`. Wraps the full composition: iteration check →
// prior-snapshot lookup → diff compute → remap build → per-paragraph edits
// → builder call. Returns the per-paragraph annotation context Map (or
// undefined when there are structurally no priors to thread).
//
// This shape was chosen over having the orchestrator hold a 30-line block
// of composition logic. Reasons:
//   - Encapsulation: the entire D-1.6/D-1.7/D-1.8 surface is one function.
//     Future deliverables (D-1.10 ledger commit, D-1.11 carry-forward
//     decisions) can extend the composer without bloating the orchestrator.
//   - Testability: the integration test imports this directly. No stubbing
//     of the full analyzeEssay pipeline (L1/L2/L3/L3.75/L4) is required.
//     Only `detectLanding` (Haiku call inside the builder) needs mocking.
//   - Failure surface stays uniform: any throw inside the composer flows
//     up through Phase 6's existing catch → buildPartialResult per the
//     D-1.8 plan §7.
//
// Graceful degradation cases that return `undefined` (NOT a throw):
//   - currentIteration <= 1 (no priors structurally exist).
//   - Prior-iteration snapshot text not found (pre-D-1.10 ledger; cold
//     ledger; missing slot). This is structural absence, not silent
//     fallback — the wire-up debug-logs the cause for tail-able audit.

export interface BuildPriorAnnotationsForOrchestratorInput {
  /**
   * D-1.11 Step 15: essay ID for telemetry buffer keying. Threaded
   * through to buildPriorAnnotations → buildDetectorInput → detectLanding
   * so the landing-detector's telemetry events land in the correct
   * (essayId, iter) audit bucket.
   */
  essayId: string;
  /** The fully-hydrated profile from the coordinator at Phase 6 entry. */
  profile: Readonly<EssayProfile>;
  /** Current essay text (input.essayText at the orchestrator). */
  currentEssayText: string;
  /**
   * Optional caller-supplied prior text override. Preferred over the
   * iterationLedger snapshot when present (caller intent is more
   * authoritative). When absent, the composer reads
   * `getPriorIterationSnapshotText(profile, currentIteration)`.
   */
  priorEssayTextOverride?: string;
  /**
   * Optional LLM-judged overall edit significance from upstream
   * `editUnderstandingService`. Propagates uniformly to per-paragraph
   * EditSignals when present (locked D-1.8 decision). Mechanical fallback
   * fires when absent.
   */
  editSignificance?: EditSignal['significance'];
}

/**
 * Result kind — `undefined` distinguishes "structurally no priors" (iter 1
 * or missing snapshot) from `Map(0)` (iter ≥ 2 ledger has zero
 * `taughtAtIteration === currentIteration - 1` entries). The
 * deepAnnotationService prompt at line 1402–1416 already discriminates on
 * `undefined` vs Map presence.
 */
export type PriorAnnotationsForOrchestrator =
  | Map<number, PriorAnnotationContext>
  | undefined;

/**
 * The composer. Pure async — no I/O beyond what the builder's detectLanding
 * call performs. Logs structural-absence cases via console for the
 * orchestrator's debug surface.
 */
export async function buildPriorAnnotationsForOrchestrator(
  input: BuildPriorAnnotationsForOrchestratorInput,
): Promise<PriorAnnotationsForOrchestrator> {
  const { profile, currentEssayText, priorEssayTextOverride, editSignificance } = input;

  const currentIteration = getCurrentIteration(profile);
  if (currentIteration <= 1) {
    // [round-1 audit §4.D / T1.4 closure] iter≤1 is structural absence,
    // not silent fallback — there genuinely is no prior iteration on
    // first-pass. Emit as 'succeeded' (not 'failed') because the branch
    // is the correct, expected behavior for this iteration count, not
    // a degradation. Console.log retained for tail-able dev visibility.
    emitIterationEvent(input.essayId, {
      iteration: currentIteration,
      step: 'priorAnnotations.composer.firstPassShortCircuit',
      status: 'succeeded',
      timestamp: new Date().toISOString(),
    });
    console.log(
      '[priorAnnotationsBuilder.composer] iter <= 1 — no prior iteration exists; threading priorAnnotations=undefined',
    );
    return undefined;
  }

  // Prior text resolution: caller override > ledger snapshot > undefined.
  let priorEssayText: string | undefined = priorEssayTextOverride;
  if (priorEssayText === undefined) {
    priorEssayText = getPriorIterationSnapshotText(profile, currentIteration);
  }

  if (priorEssayText === undefined) {
    // [round-1 audit §4.D / T1.4 closure] iter≥2 with NO snapshot is
    // a structural-absence DEGRADATION (the composer SHOULD have a
    // prior text on iter≥2; missing it means the ledger's snapshotText
    // wasn't populated by D-1.10's commit, or createNew didn't seed
    // priorIterationLedger correctly). Emit status:'failed' so audit
    // grep surfaces the degradation. Behavior unchanged: thread
    // undefined gracefully so L5 still runs, just without priors.
    emitIterationEvent(input.essayId, {
      iteration: currentIteration,
      step: 'priorAnnotations.composer.snapshotUnavailable',
      status: 'failed',
      error: {
        message: `prior-iteration snapshot unavailable on iter=${currentIteration} (likely pre-D-1.10 ledger or cold start)`,
        code: 'prior_snapshot_unavailable',
        context: { currentIteration },
      },
      timestamp: new Date().toISOString(),
    });
    console.log(
      `[priorAnnotationsBuilder.composer] iter=${currentIteration}: prior-iteration snapshot ` +
        `unavailable (likely pre-D-1.10 ledger or cold start); threading priorAnnotations=undefined`,
    );
    return undefined;
  }

  const oldParas = splitParagraphs(priorEssayText);
  const newParas = splitParagraphs(currentEssayText);
  const diff = computeEditDiff(priorEssayText, currentEssayText, profile);

  const paragraphRemap = buildParagraphRemap({
    oldParagraphTexts: oldParas,
    newParagraphTexts: newParas,
    diff,
  });

  const perParagraphEdits = buildPerParagraphEdits({
    oldParagraphTexts: oldParas,
    newParagraphTexts: newParas,
    diff,
    paragraphRemap,
    editSignificance,
  });

  const priorAnnotations = await buildPriorAnnotations({
    essayId: input.essayId,
    iterationLedger: profile.iterationLedger,
    currentIteration,
    perParagraphEdits,
    paragraphRemap,
  });

  return priorAnnotations;
}
