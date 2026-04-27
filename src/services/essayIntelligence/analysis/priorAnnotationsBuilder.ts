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
  isDropped,
  type ParagraphRemap,
  type ParagraphRemapDropReason,
} from './paragraphRemapBuilder';
import type {
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
  moveId: string;
  oldParagraphIndex: number;
  reason: ParagraphRemapDropReason;
  taughtAtIteration: number;
  currentIteration: number;
  findingId?: string;
  contentSummarySnippet: string;
}): void {
  console.log(
    '[priorAnnotationsBuilder] move-dropped',
    JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
  );
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
