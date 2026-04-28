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
import { __resetTelemetryForTesting } from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import {
  buildPriorAnnotations,
  mechanicalSignificance,
  MECHANICAL_SIGNIFICANCE_CUTS,
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
    essayId: 'test-essay-builder',
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
      essayId: "test-essay-builder",
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
        essayId: "test-essay-builder",
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
        essayId: "test-essay-builder",
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
        essayId: "test-essay-builder",
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

  it('rejects paragraphRemap that is not a Map when provided', async () => {
    await expect(
      buildPriorAnnotations({
        ...makeInput(),
        paragraphRemap: {} as unknown as Map<number, number>,
      }),
    ).rejects.toThrow(/paragraphRemap must be a Map when present/);
  });
});

// ============================================================================
// D-1.7 — paragraphRemap support (index remap on structural reorder)
// ============================================================================
// Per the D-1.7 contract: "Synthetic fixtures simulating each edit type
// (reorder, insert, delete, multi-paragraph) — assert the remapped Map for
// each." These tests pass `paragraphRemap` literals directly so the
// builder's remap-application logic is exercised without coupling to
// `paragraphRemapBuilder` (which has its own F1–F18 coverage).
//
// Drop-telemetry assertions spy on `console.log` and look for the
// `[priorAnnotationsBuilder] move-dropped` prefix that the production
// emitter writes.

import type {
  ParagraphRemap,
  ParagraphRemapEntry,
} from '../../src/services/essayIntelligence/analysis/paragraphRemapBuilder';

function dropEntry(
  reason: 'paragraph_deleted' | 'ambiguous_remap_no_unique_target',
): ParagraphRemapEntry {
  return { dropped: true, reason };
}

function makeRemap(entries: Array<[number, ParagraphRemapEntry]>): ParagraphRemap {
  return new Map(entries);
}

/**
 * [round-1 audit T2.4 closure] Drop telemetry now flows through
 * `iterationTelemetry` instead of `console.log`. Tests capture via
 * `flushEventsForIteration(iter)` and reshape the structured event back
 * into the legacy payload shape so existing assertions still work.
 *
 * The event shape (from priorAnnotationsBuilder.emitMoveDropped) is:
 *   { iteration, step: 'priorAnnotations.move_dropped',
 *     paragraphIndex, status: 'succeeded',
 *     error: { code: <reason>, context: { moveId, taughtAtIteration,
 *              findingId, contentSummarySnippet, source } } }
 *
 * We synthesize the payload shape `{ moveId, oldParagraphIndex, reason,
 * taughtAtIteration, currentIteration, findingId?, contentSummarySnippet,
 * timestamp }` so tests written before the telemetry switch keep
 * passing without rewriting their `expect(payloads[0]).toMatchObject(...)`
 * assertions.
 *
 * Returns a `payloads` proxy whose `.length` and indexed access reflect
 * the events drained from the buffer at the moment the test reads it.
 * The `spy.mockRestore()` is a no-op (kept for API symmetry with the
 * old console-spy pattern); test cleanup happens via `__resetTelemetryForTesting`.
 */
function captureDropLogs(): {
  spy: { mockRestore: () => void };
  payloads: Array<Record<string, unknown>>;
} {
  // Reset the telemetry buffer so prior tests' events don't leak in.
  __resetTelemetryForTesting();
  const payloads: Array<Record<string, unknown>> = [];
  // Build a self-updating proxy: the test harness calls payloads.length
  // and payloads[N] AFTER the production code has run, so we need to
  // drain on-read. Simpler approach: return the array and have a
  // `.refresh()` method... but the existing tests just access payloads
  // directly. Cleanest: install a wrapper around emitIterationEvent
  // via a vi.spyOn on the underlying console.log channel that the
  // event ultimately writes through, OR directly on emitIterationEvent.
  //
  // We use vi.spyOn on console.log because emitIterationEvent calls
  // console.log('[IterationTelemetry]', JSON.stringify(event)) on every
  // event (iterationTelemetry.ts:79). This keeps the test architecture
  // simple — no need to drain buffers post-hoc.
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    if (args[0] !== '[IterationTelemetry]' || typeof args[1] !== 'string') return;
    const event = JSON.parse(args[1]) as {
      iteration: number;
      step: string;
      paragraphIndex?: number;
      error?: { code?: string; context?: Record<string, unknown> };
      timestamp: string;
    };
    if (event.step !== 'priorAnnotations.move_dropped') return;
    const ctx = event.error?.context ?? {};
    payloads.push({
      moveId: ctx.moveId,
      oldParagraphIndex: event.paragraphIndex,
      reason: event.error?.code,
      taughtAtIteration: ctx.taughtAtIteration,
      currentIteration: event.iteration,
      findingId: ctx.findingId,
      contentSummarySnippet: ctx.contentSummarySnippet,
      timestamp: event.timestamp,
    });
  });
  return {
    spy: {
      mockRestore: () => {
        vi.restoreAllMocks();
      },
    },
    payloads,
  };
}

// ─── B1: undefined remap → identity ────────────────────────────────────

describe('D-1.7 — B1: no_remap_identity', () => {
  beforeEach(() => mockDetect.mockReset());

  it('with paragraphRemap omitted, behaves exactly as D-1.6 (identity)', async () => {
    const moves = [
      makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-2', taughtAtIteration: 1, location: { paragraphIndex: 2 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-1', makeLanding()],
        ['M-2', makeLanding()],
      ]),
    );

    const result = await buildPriorAnnotations({
      essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      perParagraphEdits: new Map([
        [0, makeEdit()],
        [2, makeEdit()],
      ]),
    });

    expect(result?.has(0)).toBe(true);
    expect(result?.has(2)).toBe(true);
    expect(result?.size).toBe(2);
  });
});

// ─── B2: empty remap (no entries) → identity for everything ───────────

describe('D-1.7 — B2: empty_remap_treated_as_identity', () => {
  beforeEach(() => mockDetect.mockReset());

  it('empty Map remap leaves every move at its old index (identity fallback)', async () => {
    const moves = [
      makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
      makeMove({ id: 'M-2', taughtAtIteration: 1, location: { paragraphIndex: 2 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-1', makeLanding()],
        ['M-2', makeLanding()],
      ]),
    );

    const result = await buildPriorAnnotations({
      essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      perParagraphEdits: new Map([
        [0, makeEdit()],
        [2, makeEdit()],
      ]),
      paragraphRemap: makeRemap([]),
    });

    expect(result?.get(0)?.priorAnnotations).toHaveLength(1);
    expect(result?.get(2)?.priorAnnotations).toHaveLength(1);
  });
});

// ─── B3: swap re-keys correctly ────────────────────────────────────────

describe('D-1.7 — B3: swap_keys_correctly', () => {
  beforeEach(() => mockDetect.mockReset());

  it('OLD P2↔P3 swap puts iter-1 P3 moves under iter-2 NEW P2 slot', async () => {
    const moves = [
      makeMove({ id: 'M-2', taughtAtIteration: 1, location: { paragraphIndex: 2 } }),
      makeMove({ id: 'M-3', taughtAtIteration: 1, location: { paragraphIndex: 3 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-2', makeLanding()],
        ['M-3', makeLanding()],
      ]),
    );

    // OLD 2 → NEW 3, OLD 3 → NEW 2 (and 0,1 identity covered by absence)
    const remap = makeRemap([
      [0, 0],
      [1, 1],
      [2, 3],
      [3, 2],
    ]);

    const result = await buildPriorAnnotations({
      essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      // Edit signals keyed by OLD index (the orchestrator's contract per D-1.7 plan)
      perParagraphEdits: new Map([
        [2, makeEdit()],
        [3, makeEdit()],
      ]),
      paragraphRemap: remap,
    });

    expect(result?.get(2)?.priorAnnotations).toHaveLength(1); // M-3 lands here
    expect(result?.get(3)?.priorAnnotations).toHaveLength(1); // M-2 lands here
    expect(result?.has(0)).toBe(false);
    expect(result?.has(1)).toBe(false);
  });
});

// ─── B4: delete drops move + emits telemetry ───────────────────────────

describe('D-1.7 — B4: delete_drops_move', () => {
  beforeEach(() => mockDetect.mockReset());

  it('move at deleted paragraph is dropped from Map; telemetry payload has reason + ids', async () => {
    const { spy, payloads } = captureDropLogs();
    try {
      const moves = [
        makeMove({ id: 'M-deleted', taughtAtIteration: 1, location: { paragraphIndex: 0 }, contentSummary: 'critique that survives only as a Finding' }),
        makeMove({ id: 'M-kept', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
      ];
      seedDetectorByMoveId(new Map([['M-kept', makeLanding()]]));
      const remap = makeRemap([
        [0, dropEntry('paragraph_deleted')],
        [1, 0],
      ]);

      const result = await buildPriorAnnotations({
        essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map([[1, makeEdit()]]),
        paragraphRemap: remap,
      });

      expect(result?.size).toBe(1);
      expect(result?.get(0)?.priorAnnotations).toHaveLength(1); // M-kept lands at NEW 0

      expect(payloads).toHaveLength(1);
      expect(payloads[0]).toMatchObject({
        moveId: 'M-deleted',
        oldParagraphIndex: 0,
        reason: 'paragraph_deleted',
        taughtAtIteration: 1,
        currentIteration: 2,
      });
      expect(payloads[0].contentSummarySnippet).toEqual(expect.stringContaining('critique'));
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── B5: multi-edit with multiple drops ────────────────────────────────

describe('D-1.7 — B5: multi_edit', () => {
  beforeEach(() => mockDetect.mockReset());

  it('handles compound structural change: 2 drops + 2 remapped survivors', async () => {
    const { spy, payloads } = captureDropLogs();
    try {
      const moves = [
        makeMove({ id: 'M-A', taughtAtIteration: 1, location: { paragraphIndex: 0 } }),
        makeMove({ id: 'M-B', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
        makeMove({ id: 'M-C', taughtAtIteration: 1, location: { paragraphIndex: 2 } }),
        makeMove({ id: 'M-D', taughtAtIteration: 1, location: { paragraphIndex: 3 } }),
      ];
      seedDetectorByMoveId(
        new Map([
          ['M-A', makeLanding()],
          ['M-D', makeLanding()],
        ]),
      );
      // From F13: {0:2, 1:dropped, 2:dropped, 3:1}
      const remap = makeRemap([
        [0, 2],
        [1, dropEntry('paragraph_deleted')],
        [2, dropEntry('paragraph_deleted')],
        [3, 1],
      ]);

      const result = await buildPriorAnnotations({
        essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map([
          [0, makeEdit()],
          [3, makeEdit()],
        ]),
        paragraphRemap: remap,
      });

      expect(result?.get(2)?.priorAnnotations).toHaveLength(1); // M-A
      expect(result?.get(1)?.priorAnnotations).toHaveLength(1); // M-D
      expect(result?.size).toBe(2);
      expect(payloads.map((p) => p.moveId).sort()).toEqual(['M-B', 'M-C']);
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── B6: multiple priors at same OLD paragraph, both remapped ──────────

describe('D-1.7 — B6: multiple_priors_same_paragraph_remapped', () => {
  beforeEach(() => mockDetect.mockReset());

  it('two priors at OLD P2 both group under NEW P5', async () => {
    const moves = [
      makeMove({ id: 'M-A', taughtAtIteration: 1, location: { paragraphIndex: 2 } }),
      makeMove({ id: 'M-B', taughtAtIteration: 1, location: { paragraphIndex: 2 } }),
    ];
    seedDetectorByMoveId(
      new Map([
        ['M-A', makeLanding()],
        ['M-B', makeLanding()],
      ]),
    );
    const remap = makeRemap([[2, 5]]);

    const result = await buildPriorAnnotations({
      essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
      currentIteration: 2,
      perParagraphEdits: new Map([[2, makeEdit()]]),
      paragraphRemap: remap,
    });

    expect(result?.get(5)?.priorAnnotations).toHaveLength(2);
    expect(result?.size).toBe(1);
  });
});

// ─── B7: dropped move never calls detector ─────────────────────────────

describe('D-1.7 — B7: dropped_does_NOT_call_detector', () => {
  beforeEach(() => mockDetect.mockReset());

  it('dropped move skips landing detector entirely', async () => {
    const { spy } = captureDropLogs();
    try {
      const moves = [makeMove({ id: 'M-dropped', taughtAtIteration: 1, location: { paragraphIndex: 0 } })];
      const remap = makeRemap([[0, dropEntry('paragraph_deleted')]]);

      const result = await buildPriorAnnotations({
        essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map([[0, makeEdit()]]),
        paragraphRemap: remap,
      });

      expect(result?.size).toBe(0);
      expect(mockDetect).toHaveBeenCalledTimes(0);
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── B8: dropped move does NOT need an edit signal ─────────────────────

describe('D-1.7 — B8: dropped_does_NOT_require_edit_signal', () => {
  beforeEach(() => mockDetect.mockReset());

  it('drop happens BEFORE edit-signal lookup; missing edit does not throw on dropped paragraph', async () => {
    const { spy, payloads } = captureDropLogs();
    try {
      const moves = [makeMove({ id: 'M-dropped', taughtAtIteration: 1, location: { paragraphIndex: 7 } })];
      const remap = makeRemap([[7, dropEntry('paragraph_deleted')]]);

      const result = await buildPriorAnnotations({
        essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map(), // intentionally empty — would throw if reached
        paragraphRemap: remap,
      });

      expect(result?.size).toBe(0);
      expect(payloads).toHaveLength(1);
      expect(mockDetect).toHaveBeenCalledTimes(0);
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── B9: non-dropped still requires edit signal (D-1.6 contract preserved) ──

describe('D-1.7 — B9: non_dropped_still_requires_edit_signal', () => {
  beforeEach(() => mockDetect.mockReset());

  it('remapped (not dropped) move still throws on missing edit signal at OLD index', async () => {
    const moves = [makeMove({ id: 'M-remapped', taughtAtIteration: 1, location: { paragraphIndex: 0 } })];
    const remap = makeRemap([[0, 1]]); // OLD 0 → NEW 1, NOT dropped

    await expect(
      buildPriorAnnotations({
        essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map(), // missing entry for OLD 0 → throw
        paragraphRemap: remap,
      }),
    ).rejects.toThrow(/missing edit signal for paragraphIndex=0/);
  });
});

// ─── B10: iteration 1 ignores remap ────────────────────────────────────

describe('D-1.7 — B10: iter_1_ignores_remap', () => {
  beforeEach(() => mockDetect.mockReset());

  it('currentIteration=1 returns undefined regardless of remap presence', async () => {
    const remap = makeRemap([[0, dropEntry('paragraph_deleted')]]);
    const result = await buildPriorAnnotations({
      essayId: "test-essay-builder",
      iterationLedger: makeLedger([makeMove({ id: 'M-x', taughtAtIteration: 0, location: { paragraphIndex: 0 } })]),
      currentIteration: 1,
      perParagraphEdits: new Map(),
      paragraphRemap: remap,
    });
    expect(result).toBeUndefined();
    expect(mockDetect).not.toHaveBeenCalled();
  });
});

// ─── B11: addressedByEdit derivation survives remap ───────────────────

describe('D-1.7 — B11: addressedByEdit_after_remap', () => {
  beforeEach(() => mockDetect.mockReset());

  it('detector status flows into the remapped slot correctly', async () => {
    const move = makeMove({
      id: 'M-1',
      taughtAtIteration: 1,
      location: { paragraphIndex: 2 },
      contentSummary: 'remapped critique',
    });
    seedDetectorByMoveId(new Map([['M-1', makeLanding({ status: 'addressed' })]]));
    const remap = makeRemap([[2, 5]]);

    const result = await buildPriorAnnotations({
      essayId: "test-essay-builder",
      iterationLedger: makeLedger([move]),
      currentIteration: 2,
      perParagraphEdits: new Map([[2, makeEdit()]]),
      paragraphRemap: remap,
    });

    const ann = result?.get(5)?.priorAnnotations[0];
    expect(ann?.content).toBe('remapped critique');
    expect(ann?.addressedByEdit).toBe(true);
  });
});

// ─── B12: ambiguous_remap_no_unique_target reason flows through telemetry ──

describe('D-1.7 — B12: ambiguous_drop_reason', () => {
  beforeEach(() => mockDetect.mockReset());

  it('ambiguous drop reason surfaces in telemetry payload distinctly from paragraph_deleted', async () => {
    const { spy, payloads } = captureDropLogs();
    try {
      const moves = [makeMove({ id: 'M-amb', taughtAtIteration: 1, location: { paragraphIndex: 1 } })];
      const remap = makeRemap([[1, dropEntry('ambiguous_remap_no_unique_target')]]);

      await buildPriorAnnotations({
        essayId: "test-essay-builder",
      iterationLedger: makeLedger(moves),
        currentIteration: 2,
        perParagraphEdits: new Map(),
        paragraphRemap: remap,
      });

      expect(payloads).toHaveLength(1);
      expect(payloads[0].reason).toBe('ambiguous_remap_no_unique_target');
    } finally {
      spy.mockRestore();
    }
  });
});

// ============================================================================
// D-1.8 — mechanicalSignificance boundary calibration (audit fix 1)
// ============================================================================
// The bucket cuts (0.10, 0.40, 0.80) are calibration-anchored to
// editUnderstandingService prompt anchors. A silent slip at any boundary
// would let mis-bucketed significance flow into landing-detector inputs and
// degrade the loop's quality without any test catching it. These tests pin
// the boundaries explicitly so a future change must update the test
// (visible diff) rather than drift through unnoticed.

describe('D-1.8 — mechanicalSignificance: bucket cuts are stable', () => {
  it('exposes cuts as a frozen const', () => {
    expect(MECHANICAL_SIGNIFICANCE_CUTS.minor).toBe(0.10);
    expect(MECHANICAL_SIGNIFICANCE_CUTS.moderate).toBe(0.40);
    expect(MECHANICAL_SIGNIFICANCE_CUTS.significant).toBe(0.80);
    expect(Object.isFrozen(MECHANICAL_SIGNIFICANCE_CUTS)).toBe(true);
  });
});

describe('D-1.8 — mechanicalSignificance: minor↔moderate boundary (0.10)', () => {
  it('changeRatio = 0 → minor (typo-only edit, trivial floor)', () => {
    expect(mechanicalSignificance(0)).toBe('minor');
  });
  it('changeRatio = 0.099 → minor (just below cut)', () => {
    expect(mechanicalSignificance(0.099)).toBe('minor');
  });
  it('changeRatio = 0.10 → minor (cut is INCLUSIVE upper bound)', () => {
    expect(mechanicalSignificance(0.10)).toBe('minor');
  });
  it('changeRatio = 0.101 → moderate (just above cut)', () => {
    expect(mechanicalSignificance(0.101)).toBe('moderate');
  });
});

describe('D-1.8 — mechanicalSignificance: moderate↔significant boundary (0.40)', () => {
  it('changeRatio = 0.399 → moderate (just below cut)', () => {
    expect(mechanicalSignificance(0.399)).toBe('moderate');
  });
  it('changeRatio = 0.40 → moderate (cut is INCLUSIVE upper bound)', () => {
    expect(mechanicalSignificance(0.40)).toBe('moderate');
  });
  it('changeRatio = 0.401 → significant (just above cut)', () => {
    expect(mechanicalSignificance(0.401)).toBe('significant');
  });
});

describe('D-1.8 — mechanicalSignificance: significant↔transformative boundary (0.80)', () => {
  it('changeRatio = 0.799 → significant (just below cut)', () => {
    expect(mechanicalSignificance(0.799)).toBe('significant');
  });
  it('changeRatio = 0.80 → significant (cut is INCLUSIVE upper bound)', () => {
    expect(mechanicalSignificance(0.80)).toBe('significant');
  });
  it('changeRatio = 0.801 → transformative (just above cut)', () => {
    expect(mechanicalSignificance(0.801)).toBe('transformative');
  });
  it('changeRatio = 1.0 → transformative (full deletion / replacement)', () => {
    expect(mechanicalSignificance(1.0)).toBe('transformative');
  });
});

describe('D-1.8 — mechanicalSignificance: input validation', () => {
  it('rejects NaN', () => {
    expect(() => mechanicalSignificance(NaN)).toThrow(/finite, non-negative/);
  });
  it('rejects Infinity', () => {
    expect(() => mechanicalSignificance(Infinity)).toThrow(/finite, non-negative/);
  });
  it('rejects negative ratios', () => {
    expect(() => mechanicalSignificance(-0.01)).toThrow(/finite, non-negative/);
  });
});
