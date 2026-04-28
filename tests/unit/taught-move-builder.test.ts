// ============================================================================
// TAUGHT MOVE BUILDER — self-test (D-1.2)
// ============================================================================
// Per the D-1.2 contract: "Mock-LLM unit test: feed a fixture
// L5AnnotationResult, assert the buffered TaughtMoves match the
// expected shape. Property test: TaughtMove ID stability — same
// L5Annotation in two runs produces the same TaughtMove ID
// (deterministic) (D-1.13)."
//
// This file covers the unit-test portion. The dedicated property test
// (D-1.13) lives at tests/property/taughtMoveIdStability.ts as its
// own deliverable; that one exercises 1000 random shapes for
// statistical determinism. Here we cover the contract surface +
// adversarial edges.

import { describe, beforeEach, it, expect } from 'vitest';

import type { L5Annotation } from '../../src/services/essayIntelligence/analysis/deepAnnotationService';
import {
  generateTaughtMoveId,
  l5AnnotationToTaughtMove,
  l5AnnotationsToTaughtMoves,
  bufferTaughtMoves,
  flushTaughtMovesForIteration,
  clearTaughtMovesForIteration,
  __resetTaughtMoveBufferForTesting,
} from '../../src/services/essayIntelligence/analysis/taughtMoveBuilder';

function makeAnnotation(overrides: Partial<L5Annotation> = {}): L5Annotation {
  return {
    id: 'A-1',
    location: { paragraphIndex: 0, sentenceIndex: 1, spanText: 'a span' },
    type: 'growth',
    teachingIntent: 'show, don\'t tell',
    teachingMode: 'awareness',
    content: 'Notice how this paragraph asserts emotion rather than embodies it.',
    teachingRationale: 'connects to the essay\'s scene-vs-summary discipline',
    northStarConnection: 'Through-line: pawnshop-as-frame relies on shown moments.',
    stakes: 'AO loses confidence in interiority claims when scenes don\'t earn them.',
    priority: 2,
    phase: 'craft',
    rewriteExample: null,
    wordEconomyCut: null,
    antiPatternExample: null,
    transferablePrinciple: null,
    confidence: 0.88,
    crossParagraphRefs: [],
    capacityBuildingNote: null,
    ...overrides,
  };
}

describe('D-1.2 — generateTaughtMoveId', () => {
  it('produces the format M-{iter}-{paragraphIndex}-{annotation.id}', () => {
    const ann = makeAnnotation({ id: 'A-7', location: { paragraphIndex: 3, sentenceIndex: 0, spanText: null } });
    expect(generateTaughtMoveId(ann, 2)).toBe('M-2-3-A-7');
  });

  it('is deterministic — same (annotation, iteration) → same id', () => {
    const ann = makeAnnotation({ id: 'A-X' });
    const id1 = generateTaughtMoveId(ann, 5);
    const id2 = generateTaughtMoveId(ann, 5);
    expect(id1).toBe(id2);
  });

  it('changes when iteration changes', () => {
    const ann = makeAnnotation({ id: 'A-X' });
    expect(generateTaughtMoveId(ann, 1)).not.toBe(generateTaughtMoveId(ann, 2));
  });

  it('throws on negative iteration', () => {
    const ann = makeAnnotation();
    expect(() => generateTaughtMoveId(ann, -1)).toThrow(/non-negative finite number/);
  });

  it('throws on missing annotation', () => {
    expect(() =>
      generateTaughtMoveId(undefined as unknown as L5Annotation, 1),
    ).toThrow(/annotation is missing/);
  });

  it('throws on missing annotation.id', () => {
    const ann = makeAnnotation({ id: undefined as unknown as string });
    expect(() => generateTaughtMoveId(ann, 1)).toThrow(/annotation\.id is missing/);
  });

  it('throws on missing paragraphIndex', () => {
    const ann = makeAnnotation({
      location: { paragraphIndex: undefined as unknown as number, sentenceIndex: null, spanText: null },
    });
    expect(() => generateTaughtMoveId(ann, 1)).toThrow(/paragraphIndex is missing/);
  });
});

describe('D-1.2 — l5AnnotationToTaughtMove', () => {
  it('maps every required field correctly', () => {
    const ann = makeAnnotation({
      id: 'A-42',
      location: { paragraphIndex: 4, sentenceIndex: 2, spanText: 'highlighted' },
      teachingMode: 'consequence',
      content: 'consequence summary',
      stakes: 'high stakes',
    });
    const tm = l5AnnotationToTaughtMove(ann, 3);
    expect(tm.id).toBe('M-3-4-A-42');
    expect(tm.annotationId).toBe('A-42');
    expect(tm.location.paragraphIndex).toBe(4);
    expect(tm.location.sentenceIndex).toBe(2);
    expect(tm.location.spanText).toBe('highlighted');
    expect(tm.taughtAtIteration).toBe(3);
    expect(tm.teachingMode).toBe('consequence');
    expect(tm.contentSummary).toBe('consequence summary');
    expect(tm.stakesSnapshot).toBe('high stakes');
    expect(tm.landing).toBeUndefined();
    expect(tm.findingId).toBeUndefined();
  });

  it('coerces sentenceIndex null → undefined', () => {
    const ann = makeAnnotation({
      location: { paragraphIndex: 0, sentenceIndex: null, spanText: null },
    });
    const tm = l5AnnotationToTaughtMove(ann, 1);
    expect(tm.location.sentenceIndex).toBeUndefined();
    expect(tm.location.spanText).toBeUndefined();
  });

  it('coerces stakes null → stakesSnapshot undefined', () => {
    const ann = makeAnnotation({ stakes: null });
    const tm = l5AnnotationToTaughtMove(ann, 1);
    expect(tm.stakesSnapshot).toBeUndefined();
  });

  it('throws when teachingMode is missing', () => {
    const ann = makeAnnotation({ teachingMode: undefined as unknown as 'awareness' });
    expect(() => l5AnnotationToTaughtMove(ann, 1)).toThrow(/teachingMode is missing/);
  });

  it('throws when content is not a string', () => {
    const ann = makeAnnotation({ content: undefined as unknown as string });
    expect(() => l5AnnotationToTaughtMove(ann, 1)).toThrow(/content must be a string/);
  });
});

describe('D-1.2 — l5AnnotationsToTaughtMoves (whole-result transform)', () => {
  it('transforms paragraph + essay-level + cross-paragraph annotations in order', () => {
    const ann1 = makeAnnotation({ id: 'A-p0-1', location: { paragraphIndex: 0, sentenceIndex: 0, spanText: null } });
    const ann2 = makeAnnotation({ id: 'A-p0-2', location: { paragraphIndex: 0, sentenceIndex: 1, spanText: null } });
    const ann3 = makeAnnotation({ id: 'A-essay-1', location: { paragraphIndex: 0, sentenceIndex: null, spanText: null } });
    const ann4 = makeAnnotation({ id: 'A-cross-1', location: { paragraphIndex: 1, sentenceIndex: null, spanText: null } });

    const moves = l5AnnotationsToTaughtMoves(
      [{ paragraphIndex: 0, annotations: [ann1, ann2] }],
      [ann3],
      [ann4],
      1,
    );
    expect(moves.map((m) => m.id)).toEqual([
      'M-1-0-A-p0-1',
      'M-1-0-A-p0-2',
      'M-1-0-A-essay-1',
      'M-1-1-A-cross-1',
    ]);
  });

  it('returns a stable, deterministic move sequence across two transform passes', () => {
    const annA = makeAnnotation({ id: 'A-1' });
    const annB = makeAnnotation({ id: 'A-2', location: { paragraphIndex: 1, sentenceIndex: 0, spanText: null } });
    const r1 = l5AnnotationsToTaughtMoves(
      [{ paragraphIndex: 0, annotations: [annA] }, { paragraphIndex: 1, annotations: [annB] }],
      [],
      [],
      7,
    );
    const r2 = l5AnnotationsToTaughtMoves(
      [{ paragraphIndex: 0, annotations: [annA] }, { paragraphIndex: 1, annotations: [annB] }],
      [],
      [],
      7,
    );
    expect(r1.map((m) => m.id)).toEqual(r2.map((m) => m.id));
  });
});

describe('D-1.2 — transient buffer lifecycle', () => {
  // D-1.11 Step 0: buffer is now keyed by (essayId, iteration). Tests use
  // a stable test essayId; cross-essay collision tests use distinct ids.
  const TEST_ESSAY_ID = 'test-essay-uuid-1';

  beforeEach(() => {
    __resetTaughtMoveBufferForTesting();
  });

  it('starts empty for a fresh iteration', () => {
    expect(flushTaughtMovesForIteration(TEST_ESSAY_ID, 1)).toEqual([]);
  });

  it('accumulates moves across multiple bufferTaughtMoves calls in the same iteration', () => {
    const m1 = l5AnnotationToTaughtMove(makeAnnotation({ id: 'A-1' }), 1);
    const m2 = l5AnnotationToTaughtMove(makeAnnotation({ id: 'A-2', location: { paragraphIndex: 1, sentenceIndex: 0, spanText: null } }), 1);
    bufferTaughtMoves(TEST_ESSAY_ID, 1, [m1]);
    bufferTaughtMoves(TEST_ESSAY_ID, 1, [m2]);
    expect(flushTaughtMovesForIteration(TEST_ESSAY_ID, 1).map((m) => m.id)).toEqual(['M-1-0-A-1', 'M-1-1-A-2']);
  });

  it('keeps separate buffers per iteration', () => {
    const m1 = l5AnnotationToTaughtMove(makeAnnotation({ id: 'A-1' }), 1);
    const m2 = l5AnnotationToTaughtMove(makeAnnotation({ id: 'A-2' }), 2);
    bufferTaughtMoves(TEST_ESSAY_ID, 1, [m1]);
    bufferTaughtMoves(TEST_ESSAY_ID, 2, [m2]);
    expect(flushTaughtMovesForIteration(TEST_ESSAY_ID, 1)).toHaveLength(1);
    expect(flushTaughtMovesForIteration(TEST_ESSAY_ID, 2)).toHaveLength(1);
  });

  it('flush returns a defensive copy — caller mutation does not leak', () => {
    const m = l5AnnotationToTaughtMove(makeAnnotation(), 1);
    bufferTaughtMoves(TEST_ESSAY_ID, 1, [m]);
    const flushed = flushTaughtMovesForIteration(TEST_ESSAY_ID, 1);
    flushed.pop();
    expect(flushTaughtMovesForIteration(TEST_ESSAY_ID, 1)).toHaveLength(1);
  });

  it('clearTaughtMovesForIteration empties the buffer', () => {
    bufferTaughtMoves(TEST_ESSAY_ID, 3, [l5AnnotationToTaughtMove(makeAnnotation(), 3)]);
    clearTaughtMovesForIteration(TEST_ESSAY_ID, 3);
    expect(flushTaughtMovesForIteration(TEST_ESSAY_ID, 3)).toEqual([]);
  });

  it('throws on invalid iteration in bufferTaughtMoves', () => {
    expect(() => bufferTaughtMoves(TEST_ESSAY_ID, -1, [])).toThrow(/non-negative finite number/);
    expect(() => bufferTaughtMoves(TEST_ESSAY_ID, NaN, [])).toThrow(/non-negative finite number/);
  });

  it('throws when moves is not an array', () => {
    expect(() => bufferTaughtMoves(TEST_ESSAY_ID, 1, undefined as unknown as never[])).toThrow(/moves must be an array/);
  });

  it('throws on invalid essayId (D-1.11 Step 0)', () => {
    expect(() => bufferTaughtMoves('', 1, [])).toThrow(/essayId must be a non-empty string/);
    expect(() => bufferTaughtMoves(undefined as unknown as string, 1, [])).toThrow(/essayId must be a non-empty string/);
  });

  // D-1.11 Step 0: concurrent-essay collision regression test.
  // Pre-fix: two essays both buffering at iter=1 would cross-pollinate
  // (single-key Map<iter, moves> + non-destructive flush returned merged
  // moves to both essays' commits). Post-fix: compound key prevents the
  // collision at the type level.
  it('two essays buffering at the same iteration do not cross-pollinate (concurrent-essay safety)', () => {
    const ESSAY_A = 'essay-A-uuid';
    const ESSAY_B = 'essay-B-uuid';

    const aMove = l5AnnotationToTaughtMove(makeAnnotation({ id: 'A-from-essay-A' }), 1);
    const bMove = l5AnnotationToTaughtMove(makeAnnotation({ id: 'A-from-essay-B' }), 1);

    bufferTaughtMoves(ESSAY_A, 1, [aMove]);
    bufferTaughtMoves(ESSAY_B, 1, [bMove]);

    // Each essay sees ONLY its own move
    const aFlushed = flushTaughtMovesForIteration(ESSAY_A, 1);
    const bFlushed = flushTaughtMovesForIteration(ESSAY_B, 1);

    expect(aFlushed).toHaveLength(1);
    expect(aFlushed[0].annotationId).toBe('A-from-essay-A');
    expect(bFlushed).toHaveLength(1);
    expect(bFlushed[0].annotationId).toBe('A-from-essay-B');

    // Clearing one essay's buffer does not touch the other's
    clearTaughtMovesForIteration(ESSAY_A, 1);
    expect(flushTaughtMovesForIteration(ESSAY_A, 1)).toEqual([]);
    expect(flushTaughtMovesForIteration(ESSAY_B, 1)).toHaveLength(1);
  });
});

describe('D-1.2 — light property check (foundation for D-1.13)', () => {
  it('100 randomly-generated annotation shapes produce stable IDs across two passes', () => {
    const annotations: L5Annotation[] = Array.from({ length: 100 }, (_, i) =>
      makeAnnotation({
        id: `A-rand-${i}-${Math.floor(Math.random() * 100000)}`,
        location: {
          paragraphIndex: Math.floor(Math.random() * 12),
          sentenceIndex: Math.random() > 0.5 ? Math.floor(Math.random() * 6) : null,
          spanText: Math.random() > 0.5 ? `span-${i}` : null,
        },
        teachingMode: (['awareness', 'consequence', 'connection', 'action'] as const)[i % 4],
      }),
    );
    const iter = 4;
    const ids1 = annotations.map((a) => generateTaughtMoveId(a, iter));
    const ids2 = annotations.map((a) => generateTaughtMoveId(a, iter));
    expect(ids1).toEqual(ids2);
    // Each id is unique within the (iter, paragraphIndex) — collision-free.
    expect(new Set(ids1).size).toBe(annotations.length);
  });
});
