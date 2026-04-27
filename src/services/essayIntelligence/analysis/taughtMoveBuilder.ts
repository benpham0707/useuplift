// ============================================================================
// TAUGHT MOVE BUILDER (Phase 1 D-1.2)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_ITERATION_LOOP_DESIGN.md
//   §7.1 (TaughtMove type), §7.2 (taughtMoves[] appended at L5 end).
// Companion type: TaughtMove in profileTypes.ts (D-0.1).
//
// Two responsibilities, kept narrow:
//   1. Pure transformation: l5AnnotationToTaughtMove(annotation,
//      iteration) maps an L5Annotation into a TaughtMove with a stable,
//      deterministic id.
//   2. Transient buffering: between L5 emission and the iteration-end
//      commit (D-1.10), the orchestrator buffers TaughtMoves keyed by
//      iteration number; D-1.10 flushes the buffer into
//      iterationLedger.taughtMoves[] atomically with the IterationRecord.
//
// Why a separate module from iterationTelemetry: the buffers have
// different lifetimes (telemetry events accumulate during the iteration;
// TaughtMoves accumulate post-L5-emission only) and different commit
// semantics (telemetry events end up on IterationRecord.events[];
// TaughtMoves end up on iterationLedger.taughtMoves[]). Keeping the
// buffers separate makes each concern auditable in isolation.
//
// ID derivation: `M-${iteration}-${annotation.location.paragraphIndex}-${annotation.id}`.
// The contract names the format `M-{iteration}-{paragraphIndex}-{sequenceInParagraph}`;
// using L5Annotation.id as the trailing segment satisfies both the
// contract's "stable across runs" requirement (D-1.13) and the
// "unique within (iteration, paragraphIndex)" requirement (L5Annotation.id
// is unique within an L5AnnotationResult). A running per-paragraph
// counter would NOT be deterministic across runs because annotation
// generation order is not guaranteed stable.

import type { L5Annotation } from './deepAnnotationService';
import type { TaughtMove } from '../profileTypes';

// ─── ID derivation ─────────────────────────────────────────────────────

/**
 * Derive the TaughtMove id from an L5Annotation + iteration.
 *
 * Stable: same (annotation, iteration) → same id across any number of
 * runs (D-1.13 property test enforces this). The annotation's .id is
 * itself stable (assigned at L5 generation time and treated as
 * immutable; the L5 prompt is instructed to keep IDs deterministic).
 *
 * Throws if any required field is missing — fail-fast per the D-1.2
 * contract: "TaughtMove construction throws on missing required
 * L5Annotation fields → fail-fast; iteration halts before commit."
 */
export function generateTaughtMoveId(
  annotation: L5Annotation,
  iteration: number,
): string {
  if (!Number.isFinite(iteration) || iteration < 0) {
    throw new Error(
      `[taughtMoveBuilder.generateTaughtMoveId] iteration must be a non-negative finite number; got ${JSON.stringify(iteration)}.`,
    );
  }
  if (!annotation || typeof annotation !== 'object') {
    throw new Error(
      `[taughtMoveBuilder.generateTaughtMoveId] annotation is missing or not an object.`,
    );
  }
  if (!annotation.id || typeof annotation.id !== 'string') {
    throw new Error(
      `[taughtMoveBuilder.generateTaughtMoveId] annotation.id is missing or not a string; got ${JSON.stringify(annotation.id)}.`,
    );
  }
  if (!annotation.location || typeof annotation.location.paragraphIndex !== 'number') {
    throw new Error(
      `[taughtMoveBuilder.generateTaughtMoveId] annotation.location.paragraphIndex is missing or not a number ` +
        `(annotation.id=${annotation.id}); got ${JSON.stringify(annotation.location)}.`,
    );
  }
  return `M-${iteration}-${annotation.location.paragraphIndex}-${annotation.id}`;
}

// ─── Annotation → TaughtMove transformer ───────────────────────────────

/**
 * Pure transformation. Maps an L5Annotation to a TaughtMove ready for
 * append. `landing` is intentionally undefined — populated by the
 * landing detector (D-1.3 / D-1.6) on the iteration AFTER delivery.
 *
 * Type coercions:
 *   - L5Annotation.location.sentenceIndex: number | null
 *     → TaughtMove.location.sentenceIndex?: number   (null → undefined)
 *   - L5Annotation.location.spanText: string | null
 *     → TaughtMove.location.spanText?: string         (null → undefined)
 *   - L5Annotation.stakes: string | null
 *     → TaughtMove.stakesSnapshot?: string            (null → undefined)
 *
 * findingId: L5Annotation does not currently carry a finding link;
 *   left undefined here. Future Phase 1+ deliverable can populate when
 *   the L5 prompt emits findingId per the SpecificsNeed signal flow.
 *
 * contentSummary: pass-through of L5Annotation.content. Per the
 *   TaughtMove JSDoc the field carries a 1-2 sentence content snapshot;
 *   the full annotation prose lives in the iteration checkpoint via
 *   annotationId. If L5 emits multi-paragraph content, that's a prompt
 *   quality concern, not a transformer concern.
 */
export function l5AnnotationToTaughtMove(
  annotation: L5Annotation,
  iteration: number,
): TaughtMove {
  const id = generateTaughtMoveId(annotation, iteration);
  if (!annotation.teachingMode) {
    throw new Error(
      `[taughtMoveBuilder.l5AnnotationToTaughtMove] annotation.teachingMode is missing ` +
        `(annotation.id=${annotation.id}, derivedId=${id}).`,
    );
  }
  if (typeof annotation.content !== 'string') {
    throw new Error(
      `[taughtMoveBuilder.l5AnnotationToTaughtMove] annotation.content must be a string ` +
        `(annotation.id=${annotation.id}, derivedId=${id}); got ${typeof annotation.content}.`,
    );
  }
  return {
    id,
    annotationId: annotation.id,
    // findingId stays undefined; populate when L5 emits the linkage.
    location: {
      paragraphIndex: annotation.location.paragraphIndex,
      sentenceIndex:
        annotation.location.sentenceIndex !== null
          ? annotation.location.sentenceIndex
          : undefined,
      spanText:
        annotation.location.spanText !== null
          ? annotation.location.spanText
          : undefined,
    },
    taughtAtIteration: iteration,
    teachingMode: annotation.teachingMode,
    contentSummary: annotation.content,
    stakesSnapshot: annotation.stakes !== null ? annotation.stakes : undefined,
    // landing left undefined — set by landing detector next iteration.
    // deepenedBy / supersededBy left undefined — set if/when this move
    // is later linked into a chain.
  };
}

/**
 * Convenience: transform every annotation in an L5AnnotationResult-like
 * collection into TaughtMoves. Walks paragraphAnnotations, essay-level,
 * and cross-paragraph annotations in that fixed order so the resulting
 * TaughtMove array is itself deterministic for a given input.
 *
 * Inputs are the three annotation arrays from L5AnnotationResult;
 * extracted as separate parameters rather than the full result so this
 * transformer doesn't depend on the cost / timing fields of the result.
 */
export function l5AnnotationsToTaughtMoves(
  paragraphAnnotations: Array<{ paragraphIndex: number; annotations: L5Annotation[] }>,
  essayLevelAnnotations: L5Annotation[],
  crossParagraphAnnotations: L5Annotation[],
  iteration: number,
): TaughtMove[] {
  const moves: TaughtMove[] = [];
  for (const para of paragraphAnnotations) {
    for (const annotation of para.annotations) {
      moves.push(l5AnnotationToTaughtMove(annotation, iteration));
    }
  }
  for (const annotation of essayLevelAnnotations) {
    moves.push(l5AnnotationToTaughtMove(annotation, iteration));
  }
  for (const annotation of crossParagraphAnnotations) {
    moves.push(l5AnnotationToTaughtMove(annotation, iteration));
  }
  return moves;
}

// ─── Transient buffer ──────────────────────────────────────────────────
//
// The buffer holds TaughtMoves between L5 emission and iteration-end
// commit (D-1.10). Keyed by iteration number. The orchestrator:
//   1. After deepAnnotationService.generateAnnotations returns, calls
//      bufferTaughtMoves(iteration, transformedMoves).
//   2. At iteration end (D-1.10), calls flushTaughtMovesForIteration
//      to retrieve the moves, pushes them onto profile.iterationLedger.
//      taughtMoves[] atomically with the IterationRecord, then calls
//      clearTaughtMovesForIteration to free the buffer.
//
// If the iteration crashes between buffer + commit, the buffer entries
// are lost — that's correct. No half-committed audit trail.

const taughtMoveBuffer: Map<number, TaughtMove[]> = new Map();

/**
 * Append moves to the buffer for the given iteration. Pushed onto the
 * existing entry or initializes a new one.
 *
 * Defensive: throws if `iteration` is invalid or `moves` is not an array.
 */
export function bufferTaughtMoves(iteration: number, moves: TaughtMove[]): void {
  if (!Number.isFinite(iteration) || iteration < 0) {
    throw new Error(
      `[taughtMoveBuilder.bufferTaughtMoves] iteration must be non-negative finite number; got ${JSON.stringify(iteration)}.`,
    );
  }
  if (!Array.isArray(moves)) {
    throw new Error(
      `[taughtMoveBuilder.bufferTaughtMoves] moves must be an array; got ${typeof moves}.`,
    );
  }
  const existing = taughtMoveBuffer.get(iteration);
  if (existing) {
    existing.push(...moves);
  } else {
    taughtMoveBuffer.set(iteration, [...moves]);
  }
}

/**
 * Read the buffered moves for an iteration without removing them.
 * Returns a defensive copy so the caller can't mutate the buffer.
 */
export function flushTaughtMovesForIteration(iteration: number): TaughtMove[] {
  return taughtMoveBuffer.get(iteration)?.slice() ?? [];
}

/**
 * Clear the buffer for an iteration. Called by the orchestrator AFTER
 * a successful flush + commit so memory doesn't grow unboundedly.
 */
export function clearTaughtMovesForIteration(iteration: number): void {
  taughtMoveBuffer.delete(iteration);
}

/**
 * Test-only reset. Clears every iteration's buffer.
 */
export function __resetTaughtMoveBufferForTesting(): void {
  taughtMoveBuffer.clear();
}
