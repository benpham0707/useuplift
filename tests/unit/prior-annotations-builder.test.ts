// ============================================================================
// PRIOR ANNOTATIONS BUILDER — self-test (D-1.6)
// ============================================================================
// Per the D-1.6 contract: "Mock-LLM unit test feeding mock landing-detector
// responses; asserting the Map structure matches expected."
//
// Covers:
//   1. Iteration gating — iteration 1 returns undefined (no priors); the
//      detector is NEVER called.
//   2. Empty ledger at iteration ≥ 2 returns an empty Map (structurally
//      distinct from the iteration-1 undefined).
//   3. Iteration filtering — only moves with taughtAtIteration ===
//      currentIteration - 1 are evaluated.
//   4. Paragraph grouping — multiple priors at the same paragraph land in
//      one PriorAnnotationContext.priorAnnotations[] array.
//   5. addressedByEdit derivation: addressed → true; everything else (incl.
//      partially_addressed, unaddressed, changed_target) → false.
//   6. Signal pass-through — Signal A always passed; Signal B passed only
//      when present per paragraph; Signal C passed only when present per
//      move.
//   7. Failure surface: missing edit for a paragraph with priors → throws
//      with move id + paragraph index named.
//   8. Failure surface: detector throws → re-throws with priorMoveId in
//      error context, preserving cause chain.
//   9. Input validation: bad inputs throw before any detector call.
//
// detectLanding is vi.mock'd. Detector outputs are seeded per move via a
// per-move map keyed by TaughtMove.id, so each test controls exactly what
// landing the detector "returns" for each move.

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { TaughtMove, IterationLedger } from '../../src/services/essayIntelligence/profileTypes';
import type { LandingDetectorOutput } from '../../src/services/essayIntelligence/analysis/landingDetector';

// vi.mock is hoisted. We mock the named export with a placeholder fn that we
// rebind per-test via vi.mocked(detectLanding).mockImplementation. The
// awaitable return value is what the production code consumes; the
// implementation can vary per test.
vi.mock('../../src/services/essayIntelligence/analysis/landingDetector', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/landingDetector')
  >('../../src/services/essayIntelligence/analysis/landingDetector');
  return {
    ...actual,
    detectLanding: vi.fn(),
  };
});

import { detectLanding } from '../../src/services/essayIntelligence/analysis/landingDetector';
import {
  buildPriorAnnotations,
  type EditSignal,
  type PriorAnnotationsBuilderInput,
} from '../../src/services/essayIntelligence/analysis/priorAnnotationsBuilder';

const mockDetect = vi.mocked(detectLanding);

// ─── Fixture helpers ───────────────────────────────────────────────────

function makeMove(overrides: Partial<TaughtMove> = {}): TaughtMove {
  return {
    id: 'M-1-0-A-1',
    annotationId: 'A-1',
    location: { paragraphIndex: 0, sentenceIndex: 0 },
    taughtAtIteration: 1,
    teachingMode: 'awareness',
    contentSummary: 'Default move content summary.',
    ...overrides,
  };
}

function makeLedger(taughtMoves: TaughtMove[] = []): IterationLedger {
  return {
    currentIteration: 1,
    iterations: [],
    taughtMoves,
    recentDecisions: [],
  };
}

function makeEdit(overrides: Partial<EditSignal> = {}): EditSignal {
  return {
    oldText: 'old',
    newText: 'new',
    significance: 'minor',
    ...overrides,
  };
}

function makeLanding(overrides: Partial<LandingDetectorOutput> = {}): LandingDetectorOutput {
  return {
    status: 'addressed',
    confidence: 0.9,
    reasoning: 'mock reasoning',
    signalsUsed: ['edit_vs_critique'],
    ...overrides,
  };
}

/**
 * Returns a detector mock that responds based on a per-move id → output map.
 *
 * Note on phantom no-args calls: vitest's runner invokes spy fns as part of
 * its cleanup-hook iteration (callCleanupHooks at @vitest/runner:746). These
 * are not production-code-driven and arrive with no args. They don't affect
 * the test's assertions, which inspect mock.calls[N] from the
 * production-driven calls only. We return a safe default landing on those
 * no-args calls rather than throwing.
 */
function seedDetectorByMoveId(map: Map<string, LandingDetectorOutput>): void {
  mockDetect.mockImplementation(async (...args: unknown[]) => {
    const input = args[0] as { priorTaughtMove: TaughtMove } | undefined;
    if (!input) {
      return makeLanding(); // phantom cleanup-hook invocation; ignore.
    }
    const out = map.get(input.priorTaughtMove.id);
    if (!out) {
      throw new Error(`Unseeded mock for move id="${input.priorTaughtMove.id}"`);
    }
    return out;
  });
}

function makeInput(overrides: Partial<PriorAnnotationsBuilderInput> = {}): PriorAnnotationsBuilderInput {
  return {
    iterationLedger: makeLedger(),
    currentIteration: 2,
    perParagraphEdits: new Map(),
    ...overrides,
  };
}

// ─── 1. Iteration gating ───────────────────────────────────────────────

describe('D-1.6 — iteration gating', () => {
  beforeEach(() => mockDetect.mockReset());

  it('returns undefined on iteration 1 (no priors structurally)', async () => {
    const ledger = makeLedger([makeMove({ taughtAtIteration: 0 })]); // even with phantom moves, iter 1 → undefined
    const result = await buildPriorAnnotations({
      iterationLedger: ledger,
      currentIteration: 1,
      perParagraphEdits: new Map(),
    });
    expect(result).toBeUndefined();
    expect(mockDetect).not.toHaveBeenCalled();
  });

  it('returns empty Map on iteration ≥ 2 with no prior moves at iteration N-1', async () => {
    const ledger = makeLedger([makeMove({ taughtAtIteration: 5 })]); // moves exist but not at iteration 1
    const result = await buildPriorAnnotations({
      iterationLedger: ledger,
      currentIteration: 2,
      perParagraphEdits: new Map(),
    });
    expect(result).toBeInstanceOf(Map);
    expect(result?.size).toBe(0);
    expect(mockDetect).not.toHaveBeenCalled();
  });
});

// ─── 2. Iteration filtering ────────────────────────────────────────────

describe('D-1.6 — iteration filtering', () => {
  beforeEach(() => mockDetect.mockReset());

  it('only evaluates moves with taughtAtIteration === currentIteration - 1', async () => {
    const moves = [
      makeMove({ id: 'M-iter1', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-iter2', taughtAtIteration: 2, location: { paragraphIndex: 1 } }),
      makeMove({ id: 'M-iter3', taughtAtIteration: 3, location: { paragraphIndex: 2 } }),
    ];
    const ledger = makeLedger(moves);
    seedDetectorByMoveId(new Map([['M-iter2', makeLanding()]]));

    const result = await buildPriorAnnotations({
      iterationLedger: ledger,
      currentIteration: 3, // priors are at iteration 2
      perParagraphEdits: new Map([[1, makeEdit()]]),
    });

    expect(mockDetect).toHaveBeenCalledTimes(1);
    expect(mockDetect.mock.calls[0][0].priorTaughtMove.id).toBe('M-iter2');
    expect(result?.has(1)).toBe(true);
    expect(result?.has(0)).toBe(false);
    expect(result?.has(2)).toBe(false);
  });
});

// ─── 3. Paragraph grouping ─────────────────────────────────────────────

describe('D-1.6 — paragraph grouping', () => {
  beforeEach(() => mockDetect.mockReset());

  it('groups multiple priors at same paragraph into one PriorAnnotationContext', async () => {
    const moves = [
      makeMove({ id: 'M-A', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-B', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-C', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-A', makeLanding({ status: 'addressed' })],
        ['M-B', makeLanding({ status: 'partially_addressed' })],
        ['M-C', makeLanding({ status: 'unaddressed' })],
      ]),
    );

    const result = await buildPriorAnnotations({
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      perParagraphEdits: new Map([
        [0, makeEdit()],
        [1, makeEdit()],
      ]),
    });

    expect(result?.get(0)?.priorAnnotations).toHaveLength(2);
    expect(result?.get(1)?.priorAnnotations).toHaveLength(1);
    expect(mockDetect).toHaveBeenCalledTimes(3);
  });
});

// ─── 4. addressedByEdit derivation ─────────────────────────────────────

describe('D-1.6 — addressedByEdit derivation', () => {
  beforeEach(() => mockDetect.mockReset());

  it.each([
    ['addressed', true],
    ['partially_addressed', false],
    ['unaddressed', false],
    ['changed_target', false],
  ] as const)('landing.status="%s" → addressedByEdit=%s', async (status, expected) => {
    const move = makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 0 } });
    seedDetectorByMoveId(new Map([['M-1', makeLanding({ status })]]));
    const result = await buildPriorAnnotations({
      iterationLedger: makeLedger([move]),
      currentIteration: 2,
      perParagraphEdits: new Map([[0, makeEdit()]]),
    });
    expect(result?.get(0)?.priorAnnotations[0].addressedByEdit).toBe(expected);
  });
});

// ─── 5. Annotation field population ────────────────────────────────────

describe('D-1.6 — annotation field population', () => {
  beforeEach(() => mockDetect.mockReset());

  it('populates content from contentSummary, teachingMode from move, type as taught_move', async () => {
    const move = makeMove({
      id: 'M-1',
      taughtAtIteration: 1,
      location: { paragraphIndex: 3 },
      teachingMode: 'connection',
      contentSummary: 'Something specific about cross-paragraph echo.',
    });
    seedDetectorByMoveId(new Map([['M-1', makeLanding({ status: 'partially_addressed' })]]));
    const result = await buildPriorAnnotations({
      iterationLedger: makeLedger([move]),
      currentIteration: 2,
      perParagraphEdits: new Map([[3, makeEdit()]]),
    });
    const ann = result?.get(3)?.priorAnnotations[0];
    expect(ann?.content).toBe('Something specific about cross-paragraph echo.');
    expect(ann?.teachingMode).toBe('connection');
    expect(ann?.type).toBe('taught_move');
    expect(ann?.addressedByEdit).toBe(false);
  });
});

// ─── 6. Signal pass-through ────────────────────────────────────────────

describe('D-1.6 — signal pass-through', () => {
  beforeEach(() => mockDetect.mockReset());

  it('always passes Signal A (edit) to detector', async () => {
    const move = makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 0 } });
    const edit = makeEdit({ oldText: 'OLD', newText: 'NEW', significance: 'significant' });
    seedDetectorByMoveId(new Map([['M-1', makeLanding()]]));
    await buildPriorAnnotations({
      iterationLedger: makeLedger([move]),
      currentIteration: 2,
      perParagraphEdits: new Map([[0, edit]]),
    });
    expect(mockDetect.mock.calls[0][0].edit).toEqual(edit);
  });

  it('passes Signal B (redetection) only when present for the paragraph', async () => {
    const moves = [
      makeMove({ id: 'M-with-B', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-without-B', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-with-B', makeLanding()],
        ['M-without-B', makeLanding()],
      ]),
    );
    await buildPriorAnnotations({
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      perParagraphEdits: new Map([
        [0, makeEdit()],
        [1, makeEdit()],
      ]),
      perParagraphRedetection: new Map([[0, { symptomFlagged: true, reasoning: 'still flagged' }]]),
    });
    const callForA = mockDetect.mock.calls.find(
      (c) => c[0].priorTaughtMove.id === 'M-with-B',
    )?.[0];
    const callForB = mockDetect.mock.calls.find(
      (c) => c[0].priorTaughtMove.id === 'M-without-B',
    )?.[0];
    expect(callForA?.newAnalysisAtLocation).toEqual({ symptomFlagged: true, reasoning: 'still flagged' });
    expect(callForB?.newAnalysisAtLocation).toBeUndefined();
  });

  it('passes Signal C (chat behavior) only when present for the move', async () => {
    const moves = [
      makeMove({ id: 'M-with-C', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-without-C', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-with-C', makeLanding()],
        ['M-without-C', makeLanding()],
      ]),
    );
    await buildPriorAnnotations({
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      perParagraphEdits: new Map([
        [0, makeEdit()],
        [1, makeEdit()],
      ]),
      perMoveChatBehavior: new Map([
        ['M-with-C', { engaged: true, mood: 'curious', raw: 'how do I show this?' }],
      ]),
    });
    const callForC = mockDetect.mock.calls.find(
      (c) => c[0].priorTaughtMove.id === 'M-with-C',
    )?.[0];
    const callWithoutC = mockDetect.mock.calls.find(
      (c) => c[0].priorTaughtMove.id === 'M-without-C',
    )?.[0];
    expect(callForC?.chatBehavior).toEqual({ engaged: true, mood: 'curious', raw: 'how do I show this?' });
    expect(callWithoutC?.chatBehavior).toBeUndefined();
  });
});

// ─── 7. Failure surface — missing edit ─────────────────────────────────

describe('D-1.6 — missing edit failure surface', () => {
  beforeEach(() => mockDetect.mockReset());

  it('throws with move id + paragraph index when edit is missing', async () => {
    const move = makeMove({ id: 'M-orphan', taughtAtIteration: 1, location: { paragraphIndex: 7 } });
    await expect(
      buildPriorAnnotations({
        iterationLedger: makeLedger([move]),
        currentIteration: 2,
        perParagraphEdits: new Map(), // no entry for paragraph 7
      }),
    ).rejects.toThrow(/missing edit signal for paragraphIndex=7.*move id="M-orphan"/);
    expect(mockDetect).not.toHaveBeenCalled();
  });
});

// ─── 8. Failure surface — detector error ───────────────────────────────

describe('D-1.6 — detector error failure surface', () => {
  beforeEach(() => mockDetect.mockReset());

  it('re-throws detector errors enriched with priorMoveId, preserving cause', async () => {
    const move = makeMove({ id: 'M-fail', taughtAtIteration: 1, location: { paragraphIndex: 0 } });
    const innerErr = new Error('rate limit exceeded');
    mockDetect.mockRejectedValueOnce(innerErr);
    let caught: Error | undefined;
    try {
      await buildPriorAnnotations({
        iterationLedger: makeLedger([move]),
        currentIteration: 2,
        perParagraphEdits: new Map([[0, makeEdit()]]),
      });
    } catch (err) {
      caught = err as Error;
    }
    expect(caught).toBeDefined();
    expect(caught?.message).toMatch(/landing detector failed for prior move id="M-fail"/);
    expect(caught?.message).toMatch(/paragraphIndex=0/);
    expect(caught?.message).toMatch(/rate limit exceeded/);
    expect((caught as Error & { cause?: unknown })?.cause).toBe(innerErr);
  });

  it('halts at first detector failure (does not call detector for subsequent moves)', async () => {
    const moves = [
      makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-2', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
    ];
    mockDetect.mockRejectedValueOnce(new Error('first fails'));
    await expect(
      buildPriorAnnotations({
        iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map([
          [0, makeEdit()],
          [1, makeEdit()],
        ]),
      }),
    ).rejects.toThrow();
    // Only the first move's detector call was attempted.
    expect(mockDetect).toHaveBeenCalledTimes(1);
  });
});

// ─── 9. Input validation ───────────────────────────────────────────────

describe('D-1.6 — input validation', () => {
  beforeEach(() => mockDetect.mockReset());

  it('rejects missing input', async () => {
    await expect(
      buildPriorAnnotations(undefined as unknown as PriorAnnotationsBuilderInput),
    ).rejects.toThrow(/input is missing/);
    expect(mockDetect).not.toHaveBeenCalled();
  });

  it('rejects missing iterationLedger', async () => {
    await expect(
      buildPriorAnnotations({
        ...makeInput(),
        iterationLedger: undefined as unknown as IterationLedger,
      }),
    ).rejects.toThrow(/iterationLedger is missing/);
  });

  it('rejects non-array taughtMoves', async () => {
    await expect(
      buildPriorAnnotations({
        ...makeInput(),
        iterationLedger: { ...makeLedger(), taughtMoves: 'oops' as unknown as TaughtMove[] },
      }),
    ).rejects.toThrow(/taughtMoves must be an array/);
  });

  it('rejects non-integer currentIteration', async () => {
    await expect(
      buildPriorAnnotations({ ...makeInput(), currentIteration: 1.5 }),
    ).rejects.toThrow(/currentIteration must be a positive integer/);
  });

  it('rejects negative currentIteration', async () => {
    await expect(
      buildPriorAnnotations({ ...makeInput(), currentIteration: 0 }),
    ).rejects.toThrow(/currentIteration must be a positive integer/);
  });

  it('rejects perParagraphEdits that is not a Map', async () => {
    await expect(
      buildPriorAnnotations({
        ...makeInput(),
        perParagraphEdits: {} as unknown as Map<number, EditSignal>,
      }),
    ).rejects.toThrow(/perParagraphEdits must be a Map/);
  });

  it('rejects perParagraphRedetection that is not a Map when provided', async () => {
    await expect(
      buildPriorAnnotations({
        ...makeInput(),
        perParagraphRedetection: 'oops' as unknown as Map<number, never>,
      }),
    ).rejects.toThrow(/perParagraphRedetection must be a Map when present/);
  });

  it('rejects perMoveChatBehavior that is not a Map when provided', async () => {
    await expect(
      buildPriorAnnotations({
        ...makeInput(),
        perMoveChatBehavior: [] as unknown as Map<string, never>,
      }),
    ).rejects.toThrow(/perMoveChatBehavior must be a Map when present/);
  });
});
