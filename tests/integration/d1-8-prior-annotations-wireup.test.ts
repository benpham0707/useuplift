// ============================================================================
// D-1.8 PRIOR ANNOTATIONS WIRE-UP — integration test (CONTRACT ANCHOR)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.8 (this deliverable's contract).
//
// Per the contract: "Mock-LLM integration test asserts the L5 call's
// argument list contains a populated Map on iteration 2."
//
// Architectural choice: the orchestrator's wire-up at line 850 is encapsulated
// in `buildPriorAnnotationsForOrchestrator` (D-1.8 composer). Testing the
// composer directly — with only `detectLanding` mocked — avoids stubbing the
// full L1/L2/L3/L3.75/L4 surface, which would dwarf the test's signal-to-noise.
// The composer's output IS what gets passed into `deepAnnotationService.generateAnnotations`
// (the orchestrator becomes a one-line caller of the composer), so asserting
// on the composer's return value asserts the line-850 contract directly.
//
// Six required scenarios per the D-1.8 plan §5:
//   1. Iteration 1 first-pass → composer returns `undefined`.
//   2. Iteration 2 with one prior taughtMove + populated snapshotText →
//      composer returns Map with prior keyed under (remapped) NEW idx.
//   3. Iteration 2 with empty taughtMoves[] → composer returns Map(0)
//      (structurally distinct from undefined).
//   4. Iteration 2 with structural reorder (P1↔P2) → priors land at
//      correctly-remapped NEW key.
//   5. Iteration 2 with paragraph deleted under prior move → move dropped,
//      [priorAnnotationsBuilder] move-dropped telemetry fires.
//   6. Iteration 2 with missing snapshotText → composer returns `undefined`,
//      structural-absence debug log fires.
//
// All scenarios additionally assert: when the composer returns a Map, the
// prior moves' `taughtAtIteration === currentIteration - 1` constraint
// determines what's threaded; signal-A pass-through to detectLanding works.

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type {
  EssayProfile,
  IterationLedger,
  IterationRecord,
  TaughtMove,
} from '../../src/services/essayIntelligence/profileTypes';
import type { LandingDetectorOutput } from '../../src/services/essayIntelligence/analysis/landingDetector';

// vi.mock is hoisted. The composer pulls in landingDetector transitively
// via priorAnnotationsBuilder.
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
import { buildPriorAnnotationsForOrchestrator } from '../../src/services/essayIntelligence/analysis/priorAnnotationsBuilder';

const mockDetect = vi.mocked(detectLanding);

// ─── Fixture helpers ───────────────────────────────────────────────────

function makeLanding(overrides: Partial<LandingDetectorOutput> = {}): LandingDetectorOutput {
  return {
    status: 'addressed',
    confidence: 0.9,
    reasoning: 'mock reasoning',
    signalsUsed: ['edit_vs_critique'],
    ...overrides,
  };
}

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

function makeIterationRecord(overrides: Partial<IterationRecord> = {}): IterationRecord {
  return {
    iteration: 1,
    triggeredBy: 'first_pass',
    carryForwardSummary: { carried: [], rederived: [], refreshed: [] },
    costBreakdown: {},
    comprehensiveBaselineCost: 0,
    carryForwardSavings: 0,
    escalationLevel: 0,
    rationale: '',
    startedAt: '2026-04-27T00:00:00.000Z',
    finishedAt: '2026-04-27T00:00:00.000Z',
    ...overrides,
  };
}

function makeLedger(overrides: Partial<IterationLedger> = {}): IterationLedger {
  return {
    currentIteration: 1,
    iterations: [],
    taughtMoves: [],
    recentDecisions: [],
    ...overrides,
  };
}

/**
 * Build a minimal EssayProfile sufficient for the composer's needs.
 * The composer reads `profile.iterationLedger`, optionally calls
 * `getPriorIterationSnapshotText(profile, currentIteration)`. Other
 * profile fields are unused at this layer; they get a defaulted
 * structurally-valid stub.
 */
function makeProfile(args: {
  ledger: IterationLedger;
  essayText?: string;
}): EssayProfile {
  // Minimal stub — only fields the composer touches matter. Cast through
  // unknown is acceptable here because we're constructing a fixture for
  // an integration test of an isolated subsystem; the rest of the profile
  // is irrelevant to the wire-up under test.
  return {
    iterationLedger: args.ledger,
    essayText: args.essayText ?? '',
    // The composer doesn't read these but the profile type requires them
    // structurally. Use empty defaults.
    paragraphs: [],
    connections: { all: [], byParagraph: new Map(), bySentence: new Map() },
    editHistory: [],
    findings: [],
  } as unknown as EssayProfile;
}

/**
 * [round-1 audit T2.4 closure] Drop telemetry now flows through
 * iterationTelemetry. We capture by spying on console.log (which
 * emitIterationEvent writes through with the [IterationTelemetry] prefix)
 * and reshape the structured event back into the legacy payload shape so
 * existing assertions still work.
 */
function captureDropLogs(): {
  spy: { mockRestore: () => void };
  payloads: Array<Record<string, unknown>>;
} {
  const payloads: Array<Record<string, unknown>> = [];
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
    spy: { mockRestore: () => vi.restoreAllMocks() },
    payloads,
  };
}

function captureComposerLogs(): {
  spy: ReturnType<typeof vi.spyOn>;
  lines: string[];
} {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[priorAnnotationsBuilder.composer]')) {
      lines.push([args[0], ...args.slice(1).map(String)].join(' '));
    }
  });
  return { spy, lines };
}

// ─── Scenario 1: Iteration 1 first-pass ────────────────────────────────

describe('D-1.8 — Scenario 1: iteration 1 first-pass', () => {
  beforeEach(() => mockDetect.mockReset());

  it('composer returns strictly undefined; detector never called; iter-1 short-circuit log fires', async () => {
    const { spy, lines } = captureComposerLogs();
    try {
      const profile = makeProfile({
        ledger: makeLedger({ currentIteration: 1, taughtMoves: [makeMove()] }),
        essayText: 'P0 first.\n\nP1 second.',
      });

      const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
        profile,
        currentEssayText: 'P0 first.\n\nP1 second.',
      });

      expect(result).toBeUndefined();
      expect(mockDetect).not.toHaveBeenCalled();
      expect(lines.some((l) => l.includes('iter <= 1'))).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── Scenario 2: Iter-2 with one prior + populated snapshotText ────────

describe('D-1.8 — Scenario 2: iter 2 with prior + snapshot', () => {
  beforeEach(() => mockDetect.mockReset());

  it('composer returns populated Map; prior keyed at correct paragraph; signal-A passed to detector', async () => {
    // P1 maintains identity (high word overlap, edited but recognizably same paragraph).
    const oldText =
      'P0 stays the same throughout this edit.\n\n' +
      'Mom watched the kettle whistle while she folded laundry on the chair.';
    const newText =
      'P0 stays the same throughout this edit.\n\n' +
      'Mom watched the kettle whistle while she folded laundry on the kitchen table.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [
          makeMove({
            id: 'M-iter1-p1',
            taughtAtIteration: 1,
            location: { paragraphIndex: 1 },
            contentSummary: 'P1 needed concrete sensory detail.',
          }),
        ],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding({ status: 'addressed' }));

    const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
      profile,
      currentEssayText: newText,
      editSignificance: 'significant',
    });

    expect(result).toBeInstanceOf(Map);
    expect(result?.size).toBe(1);
    expect(result?.has(1)).toBe(true); // identity remap (both have 2 paragraphs, same content at 0)
    expect(result?.get(1)?.priorAnnotations).toHaveLength(1);
    expect(result?.get(1)?.priorAnnotations[0].content).toBe('P1 needed concrete sensory detail.');
    expect(result?.get(1)?.priorAnnotations[0].addressedByEdit).toBe(true);

    // Detector got the right signal-A: oldText/newText for paragraph 1, threaded significance.
    expect(mockDetect).toHaveBeenCalledTimes(1);
    const call = mockDetect.mock.calls[0][0];
    expect(call.priorTaughtMove.id).toBe('M-iter1-p1');
    expect(call.edit.oldText).toContain('folded laundry on the chair');
    expect(call.edit.newText).toContain('folded laundry on the kitchen table');
    expect(call.edit.significance).toBe('significant'); // threaded from editSignificance
  });
});

// ─── Scenario 3: Iter-2 with empty taughtMoves ─────────────────────────

describe('D-1.8 — Scenario 3: iter 2 with empty taughtMoves[]', () => {
  beforeEach(() => mockDetect.mockReset());

  it('composer returns empty Map (NOT undefined); detector never called', async () => {
    const oldText = 'P0 same.\n\nP1 same.';
    const newText = 'P0 same.\n\nP1 different now.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [], // empty — no priors to thread
      }),
      essayText: newText,
    });

    const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
      profile,
      currentEssayText: newText,
    });

    expect(result).toBeInstanceOf(Map);
    expect(result?.size).toBe(0); // structurally distinct from undefined
    expect(mockDetect).not.toHaveBeenCalled();
  });
});

// ─── Scenario 4: Iter-2 with structural reorder ────────────────────────

describe('D-1.8 — Scenario 4: iter 2 with P1↔P2 reorder', () => {
  beforeEach(() => mockDetect.mockReset());

  it('prior on OLD P1 lands at NEW P2 (remap correctly applied)', async () => {
    // Three paragraphs, swap P1 and P2.
    const oldText = 'P0 anchor.\n\nP1 was middle.\n\nP2 was last.';
    const newText = 'P0 anchor.\n\nP2 was last.\n\nP1 was middle.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [
          makeMove({
            id: 'M-old-p1',
            taughtAtIteration: 1,
            location: { paragraphIndex: 1 }, // OLD index — points at "P1 was middle."
            contentSummary: 'Critique against the middle paragraph.',
          }),
        ],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding({ status: 'addressed' }));

    const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
      profile,
      currentEssayText: newText,
    });

    expect(result).toBeInstanceOf(Map);
    expect(result?.size).toBe(1);
    // OLD P1 ("P1 was middle.") is at NEW index 2 (last paragraph).
    expect(result?.has(2)).toBe(true);
    expect(result?.has(1)).toBe(false);
    expect(result?.get(2)?.priorAnnotations[0].content).toBe('Critique against the middle paragraph.');

    // Detector still receives signal-A keyed against OLD index — both old
    // and new texts are for the SAME conceptual paragraph (the middle one).
    const call = mockDetect.mock.calls[0][0];
    expect(call.edit.oldText).toBe('P1 was middle.');
    expect(call.edit.newText).toBe('P1 was middle.'); // unchanged, just moved
  });
});

// ─── Scenario 5: Iter-2 with paragraph deleted under prior move ────────

describe('D-1.8 — Scenario 5: iter 2 with deleted paragraph', () => {
  beforeEach(() => mockDetect.mockReset());

  it('prior on deleted paragraph is dropped; telemetry payload has paragraph_deleted reason', async () => {
    const { spy, payloads } = captureDropLogs();
    try {
      // Three paragraphs → two. P1 deleted.
      const oldText = 'P0 first.\n\nP1 doomed.\n\nP2 third.';
      const newText = 'P0 first.\n\nP2 third.';

      const profile = makeProfile({
        ledger: makeLedger({
          currentIteration: 2,
          iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
          taughtMoves: [
            makeMove({
              id: 'M-doomed',
              taughtAtIteration: 1,
              location: { paragraphIndex: 1 }, // OLD P1 — being deleted
              contentSummary: 'A critique that survives only as a Finding.',
            }),
          ],
        }),
        essayText: newText,
      });

      const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
        profile,
        currentEssayText: newText,
      });

      expect(result).toBeInstanceOf(Map);
      expect(result?.size).toBe(0); // M-doomed dropped, no other priors
      expect(mockDetect).toHaveBeenCalledTimes(0);

      // Telemetry assertions: drop event fired with the right metadata.
      expect(payloads).toHaveLength(1);
      expect(payloads[0]).toMatchObject({
        moveId: 'M-doomed',
        oldParagraphIndex: 1,
        reason: 'paragraph_deleted',
        currentIteration: 2,
        taughtAtIteration: 1,
      });
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── Scenario 6: Iter-2 with missing snapshotText ──────────────────────

describe('D-1.8 — Scenario 6: iter 2 with missing snapshotText (pre-D-1.10)', () => {
  beforeEach(() => mockDetect.mockReset());

  it('composer returns undefined gracefully; structural-absence log fires; no throw', async () => {
    const { spy, lines } = captureComposerLogs();
    try {
      const profile = makeProfile({
        ledger: makeLedger({
          currentIteration: 2,
          iterations: [makeIterationRecord({ iteration: 1 /* snapshotText: undefined */ })],
          taughtMoves: [makeMove({ taughtAtIteration: 1 })],
        }),
        essayText: 'P0 current.\n\nP1 current.',
      });

      const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
        profile,
        currentEssayText: 'P0 current.\n\nP1 current.',
      });

      expect(result).toBeUndefined();
      expect(mockDetect).not.toHaveBeenCalled();
      expect(lines.some((l) => l.includes('snapshot') && l.includes('unavailable'))).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── Bonus: caller-supplied priorEssayText override beats ledger snapshot ──

describe('D-1.8 — caller priorEssayText override takes precedence over ledger snapshot', () => {
  beforeEach(() => mockDetect.mockReset());

  it('when both override and ledger snapshot present, override wins', async () => {
    // Use realistic overlap so the remap pairs P1 successfully.
    const ledgerOldText =
      'STALE ledger snapshot first paragraph.\n\nThe ledger version of paragraph one stale text here.';
    const overrideOldText =
      'FRESH caller override first paragraph stays.\n\n' +
      'The caller fresh override version of paragraph one.';
    const newText =
      'FRESH caller override first paragraph stays.\n\n' +
      'The caller fresh override version of paragraph one with more care.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: ledgerOldText })],
        taughtMoves: [
          makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 1 } }),
        ],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding({ status: 'partially_addressed' }));

    const result = await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
      profile,
      currentEssayText: newText,
      priorEssayTextOverride: overrideOldText,
    });

    expect(result?.size).toBe(1);
    const call = mockDetect.mock.calls[0][0];
    // Override drove the diff — old text comes from override, not ledger.
    expect(call.edit.oldText).toContain('caller fresh override');
    expect(call.edit.oldText).not.toContain('ledger');
    expect(call.edit.newText).toContain('with more care');
  });
});

// ─── Bonus: editSignificance fallback to mechanical bucket ─────────────

describe('D-1.8 — editSignificance absent → mechanical fallback fires', () => {
  beforeEach(() => mockDetect.mockReset());

  it('without editSignificance, per-paragraph significance comes from changeRatio buckets — TRANSFORMATIVE bucket', async () => {
    // High-sentence-count paragraph with all sentences modified — ratio ~1.0
    // is unambiguously in the transformative bucket regardless of ±1
    // sentence-tokenizer drift (because 7/8 = 0.875 is also > 0.80, and
    // 8/9 = 0.888 is also > 0.80 — bucket is stable across reasonable
    // tokenizer variance).
    const oldText =
      'P0 stays the same in this edit pass.\n\n' +
      'The kettle whistled. Mom folded laundry. Sister read on couch. Brother stirred soup. ' +
      'Dad pruned roses. Cat watched the kettle. Dog waited at door. Clock chimed five.';
    const newText =
      'P0 stays the same in this edit pass.\n\n' +
      'The kettle whistled loudly. Mom folded laundry quickly. Sister read on the green couch. Brother stirred warm soup. ' +
      'Dad pruned wild roses. Cat watched the silver kettle. Dog waited patiently at the door. Clock chimed five times.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [makeMove({ id: 'M-1', taughtAtIteration: 1, location: { paragraphIndex: 1 } })],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding());

    await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
      profile,
      currentEssayText: newText,
      // editSignificance intentionally omitted — exercise mechanical fallback.
    });

    const call = mockDetect.mock.calls[0][0];
    // STRICT assertion (audit fix 3): pin to exact bucket. With 8 sentences
    // all modified, ratio = 8/8 = 1.0 > 0.80 cut → transformative. Even
    // if the tokenizer mis-counts by ±1, ratio remains > 0.80 → still
    // transformative. The boundary is unambiguous on this fixture.
    expect(call.edit.significance).toBe('transformative');
  });

  it('without editSignificance, MINOR bucket lands when changeRatio ≤ 0.10', async () => {
    // 10-sentence paragraph with a single typo edit on one sentence — the
    // diff still flags the paragraph as 'modified' (one sentenceChange of
    // type 'modified'), but ratio 1/10 = 0.10 sits exactly at the inclusive
    // upper bound → 'minor'. Stable under ±1 tokenizer drift: 1/9 = 0.111
    // and 1/11 = 0.091 — both also map to 'minor' (0.091) or 'moderate'
    // (0.111). To stay strictly in the minor bucket regardless of drift,
    // we use 12 sentences (1/12 = 0.083, 1/11 = 0.091, 1/13 = 0.077 — all
    // safely below the 0.10 cut).
    const oldText =
      'P0 stays the same in this edit pass.\n\n' +
      'The kettle whistled. Mom folded laundry. Sister read books. ' +
      'Brother stirred soup. Dad pruned roses. Cat watched birds. ' +
      'Dog waited at door. Clock chimed five. Wind rustled leaves. ' +
      'Sun set behind mountains. Moon rose over hills. Stars filled night sky.';
    // Tweak only the first sentence — single typo correction.
    const newText =
      'P0 stays the same in this edit pass.\n\n' +
      'The kettle whistled loudly. Mom folded laundry. Sister read books. ' +
      'Brother stirred soup. Dad pruned roses. Cat watched birds. ' +
      'Dog waited at door. Clock chimed five. Wind rustled leaves. ' +
      'Sun set behind mountains. Moon rose over hills. Stars filled night sky.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [makeMove({ id: 'M-2', taughtAtIteration: 1, location: { paragraphIndex: 1 } })],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding());

    await buildPriorAnnotationsForOrchestrator({
        essayId: "test-essay-d18",
      profile,
      currentEssayText: newText,
    });

    const call = mockDetect.mock.calls[0][0];
    // STRICT: 1 of ~12 sentences modified → ratio ~0.083 → minor. Stable
    // under ±1 tokenizer count.
    expect(call.edit.significance).toBe('minor');
  });
});

// ────────────────────────────────────────────────────────────────────────
// D-1.6.5 — Landing write-back wire
// ────────────────────────────────────────────────────────────────────────
//
// Closes F-01 from the Phase 1 dead-wire audit (2026-04-30): the landing
// detector ran but its result was consumed only into a transient
// `addressedByEdit` boolean — the canonical `move.landing` field on the
// ledger stayed `undefined` forever. F-01 was the producer-half of the
// gap that motivated D-1.15.0's carve-out; D-1.6.5 lands the producer
// itself.
//
// These tests are co-located with D-1.8's wire-up tests because they
// share the `vi.mock(detectLanding)` setup. The diagnostic naming is
// deliberate: when one of these fails, the test name points at the
// write-back wire specifically, not the broader D-1.8 surface.
describe('D-1.6.5 — landing write-back to source TaughtMove', () => {
  beforeEach(() => mockDetect.mockReset());

  it('after detection, source move.landing is populated with all 5 fields and detectedAtIteration === currentIteration', async () => {
    const oldText =
      'P0 stays the same throughout this edit.\n\n' +
      'Mom watched the kettle whistle while she folded laundry on the chair.';
    const newText =
      'P0 stays the same throughout this edit.\n\n' +
      'Mom watched the kettle whistle while she folded laundry on the kitchen table.';

    const sourceMove = makeMove({
      id: 'M-iter1-p1',
      taughtAtIteration: 1,
      location: { paragraphIndex: 1 },
      contentSummary: 'P1 needed concrete sensory detail.',
    });
    // Pre-condition: source move's landing must be undefined before
    // detection runs. If this assertion ever fails, the fixture builder
    // changed and the carve-out's "one-shot undefined → populated"
    // semantics no longer hold from the test's starting point.
    expect(sourceMove.landing).toBeUndefined();

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [sourceMove],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(
      makeLanding({
        status: 'addressed',
        confidence: 0.92,
        reasoning: 'student rewrote the sentence with concrete detail (kitchen table)',
        signalsUsed: ['edit_vs_critique'],
      }),
    );

    await buildPriorAnnotationsForOrchestrator({
      essayId: 'test-essay-d165',
      profile,
      currentEssayText: newText,
      editSignificance: 'significant',
    });

    // Post-condition: source move.landing is now populated with the
    // detector output + detectedAtIteration === currentIteration. The
    // mutation goes through the array reference returned by Array.filter,
    // so the ledger's source move IS this object.
    const ledgerMove = profile.iterationLedger.taughtMoves[0];
    expect(ledgerMove.id).toBe('M-iter1-p1');
    expect(ledgerMove.landing).toBeDefined();
    expect(ledgerMove.landing?.status).toBe('addressed');
    expect(ledgerMove.landing?.confidence).toBe(0.92);
    expect(ledgerMove.landing?.reasoning).toBe(
      'student rewrote the sentence with concrete detail (kitchen table)',
    );
    expect(ledgerMove.landing?.signalsUsed).toEqual(['edit_vs_critique']);
    // detectedAtIteration === currentIteration (NOT taughtAtIteration + 1
    // — same value in normal flow but distinct concepts).
    expect(ledgerMove.landing?.detectedAtIteration).toBe(2);
  });

  it('throws on D-1.15.0 carve-out violation if move.landing is already populated', async () => {
    // Construct a move with an already-populated landing. This should
    // never happen under normal flow because the priorIteration filter
    // (priorAnnotationsBuilder.ts:177-179) excludes moves whose
    // taughtAtIteration !== currentIteration - 1. If the filter ever
    // loosens, this catches the resulting carve-out violation.
    const preLandedMove = makeMove({
      id: 'M-pre-landed',
      taughtAtIteration: 1,
      location: { paragraphIndex: 1 },
      contentSummary: 'P1 carry-forward content.',
    });
    preLandedMove.landing = {
      status: 'partially_addressed',
      detectedAtIteration: 2,
      confidence: 0.6,
      reasoning: 'pre-existing landing from a hypothetical prior call',
      signalsUsed: ['edit_vs_critique'],
    };

    const oldText = 'P0 stays.\n\nP1 with content to detect against.';
    const newText = 'P0 stays.\n\nP1 with edited content for detection.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [preLandedMove],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding({ status: 'addressed' }));

    await expect(
      buildPriorAnnotationsForOrchestrator({
        essayId: 'test-essay-d165-violation',
        profile,
        currentEssayText: newText,
        editSignificance: 'significant',
      }),
    ).rejects.toThrow(/D-1\.15\.0 carve-out violation/);
  });

  it('throws on carve-out violation regardless of prior detectedAtIteration value (R-3 closure: assertion is purely about populated-ness, not iteration equality)', async () => {
    // R-3 review-finding closure: the prior carve-out test used
    // detectedAtIteration: 2 which matches currentIteration. A stronger
    // test asserts the throw fires even when detectedAtIteration is
    // an older iteration (e.g., 1) — proving the throw guards
    // populated-ness, not iteration-clash.
    const olderLandedMove = makeMove({
      id: 'M-older-landed',
      taughtAtIteration: 1,
      location: { paragraphIndex: 1 },
      contentSummary: 'P1 carry-forward content.',
    });
    olderLandedMove.landing = {
      status: 'addressed',
      detectedAtIteration: 1, // older than currentIteration
      confidence: 0.8,
      reasoning: 'hypothetical earlier landing record',
      signalsUsed: ['edit_vs_critique'],
    };

    const oldText = 'P0 stays.\n\nP1 with content.';
    const newText = 'P0 stays.\n\nP1 with edited content.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [olderLandedMove],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding({ status: 'addressed' }));

    await expect(
      buildPriorAnnotationsForOrchestrator({
        essayId: 'test-essay-d165-older-violation',
        profile,
        currentEssayText: newText,
        editSignificance: 'significant',
      }),
    ).rejects.toThrow(/D-1\.15\.0 carve-out violation/);
  });

  it('detector throws → write-back never happens; move.landing stays undefined (C-1 closure: hardens against future refactors that hoist write-back above the await)', async () => {
    // C-1 contract-audit closure: symmetry with the dropped-move case —
    // if the detector throws, the write-back must NOT have run, and the
    // source move.landing must remain undefined. This guards against
    // a future refactor that accidentally moves the write-back BEFORE
    // the await (which would persist a fabricated/zero landing on
    // detector failure).
    const sourceMove = makeMove({
      id: 'M-detector-fails',
      taughtAtIteration: 1,
      location: { paragraphIndex: 1 },
      contentSummary: 'P1 needed sensory detail.',
    });
    expect(sourceMove.landing).toBeUndefined();

    const oldText = 'P0 stays.\n\nP1 original text content here.';
    const newText = 'P0 stays.\n\nP1 edited text content for detection.';

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [sourceMove],
      }),
      essayText: newText,
    });

    // Detector rejects. The wire enriches the error (per
    // priorAnnotationsBuilder.ts runDetectorWithEnrichedError) and
    // re-throws — write-back never runs.
    mockDetect.mockRejectedValueOnce(new Error('simulated detector LLM failure'));

    await expect(
      buildPriorAnnotationsForOrchestrator({
        essayId: 'test-essay-d165-detector-fail',
        profile,
        currentEssayText: newText,
        editSignificance: 'significant',
      }),
    ).rejects.toThrow();

    // The throw bubbled out before the write-back. Source move.landing
    // remains undefined — no fabricated landing persisted.
    const ledgerMove = profile.iterationLedger.taughtMoves[0];
    expect(ledgerMove.landing).toBeUndefined();
  });

  it('dropped moves (paragraph deleted) skip detection AND skip write-back; their landing stays undefined', async () => {
    // Iter-1 had a move on P1 (chair text). Iter-2 deletes that paragraph
    // entirely; the remap drops the move. Detector must NOT be called
    // for this move, AND the source move.landing must remain undefined
    // (no detection ran, no write-back).
    const oldText =
      'P0 stays.\n\n' +
      'Mom watched the kettle whistle while she folded laundry on the chair.\n\n' +
      'P2 conclusion text that survives.';
    const newText =
      'P0 stays.\n\n' +
      'P2 conclusion text that survives.';

    const droppedMove = makeMove({
      id: 'M-dropped',
      taughtAtIteration: 1,
      location: { paragraphIndex: 1 },
      contentSummary: 'P1 needed sensory detail.',
    });
    expect(droppedMove.landing).toBeUndefined();

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [droppedMove],
      }),
      essayText: newText,
    });

    mockDetect.mockResolvedValue(makeLanding({ status: 'addressed' }));

    await buildPriorAnnotationsForOrchestrator({
      essayId: 'test-essay-d165-drop',
      profile,
      currentEssayText: newText,
      editSignificance: 'significant',
    });

    // Detector NOT called for dropped moves — drop happens before the
    // detector call site (line 200-213 in builder).
    expect(mockDetect).not.toHaveBeenCalled();

    // Source move.landing remains undefined — no write-back happens for
    // dropped moves. This is the correct semantics: a dropped move's
    // landing is structurally undefined (the paragraph is gone, there's
    // nothing to detect against).
    const ledgerMove = profile.iterationLedger.taughtMoves[0];
    expect(ledgerMove.landing).toBeUndefined();
  });

  it('multiple priors → each move gets its own landing; iteration-2 currentIteration uniformly applied', async () => {
    // Three moves on three distinct paragraphs from iter-1; iter-2 edits
    // all three. Each detector call returns distinct landing details;
    // each move.landing must reflect its own detection (not cross-contaminated)
    // and detectedAtIteration must be 2 across all three.
    const oldText =
      'P0 paragraph zero text here.\n\n' +
      'P1 paragraph one earlier text.\n\n' +
      'P2 paragraph two original text.';
    const newText =
      'P0 paragraph zero with edits.\n\n' +
      'P1 paragraph one revised text.\n\n' +
      'P2 paragraph two updated text.';

    const moveP0 = makeMove({
      id: 'M-p0',
      taughtAtIteration: 1,
      location: { paragraphIndex: 0 },
      contentSummary: 'P0 needs richer hook.',
    });
    const moveP1 = makeMove({
      id: 'M-p1',
      taughtAtIteration: 1,
      location: { paragraphIndex: 1 },
      contentSummary: 'P1 needs sensory specifics.',
    });
    const moveP2 = makeMove({
      id: 'M-p2',
      taughtAtIteration: 1,
      location: { paragraphIndex: 2 },
      contentSummary: 'P2 needs sharper resolution.',
    });

    const profile = makeProfile({
      ledger: makeLedger({
        currentIteration: 2,
        iterations: [makeIterationRecord({ iteration: 1, snapshotText: oldText })],
        taughtMoves: [moveP0, moveP1, moveP2],
      }),
      essayText: newText,
    });

    // Sequence-dependent mock: returns landings in builder iteration
    // order (which is ledger-array order today). Assertions below use
    // findMove-by-id, so they remain correct even if builder iteration
    // order changes — but the sequence-of-returns would need updating
    // if the builder ever parallelizes. R-4 audit-finding noted this
    // brittleness; the id-keyed mockImplementation alternative had a
    // type-resolution issue with vi.mocked + async closures here, so
    // we kept the sequence form. If the builder parallelizes in a
    // future deliverable, this test's mock setup must be revisited.
    mockDetect
      .mockResolvedValueOnce(
        makeLanding({ status: 'addressed', confidence: 0.91, reasoning: 'P0 reasoning', signalsUsed: ['edit_vs_critique'] }),
      )
      .mockResolvedValueOnce(
        makeLanding({ status: 'partially_addressed', confidence: 0.65, reasoning: 'P1 reasoning', signalsUsed: ['edit_vs_critique', 'redetection'] }),
      )
      .mockResolvedValueOnce(
        makeLanding({ status: 'unaddressed', confidence: 0.85, reasoning: 'P2 reasoning', signalsUsed: ['edit_vs_critique'] }),
      );

    await buildPriorAnnotationsForOrchestrator({
      essayId: 'test-essay-d165-multi',
      profile,
      currentEssayText: newText,
      editSignificance: 'significant',
    });

    expect(mockDetect).toHaveBeenCalledTimes(3);

    // Find each move on the ledger and verify its landing.
    const findMove = (id: string) =>
      profile.iterationLedger.taughtMoves.find((m) => m.id === id);
    expect(findMove('M-p0')?.landing?.status).toBe('addressed');
    expect(findMove('M-p0')?.landing?.confidence).toBe(0.91);
    expect(findMove('M-p0')?.landing?.reasoning).toBe('P0 reasoning');
    expect(findMove('M-p0')?.landing?.detectedAtIteration).toBe(2);

    expect(findMove('M-p1')?.landing?.status).toBe('partially_addressed');
    expect(findMove('M-p1')?.landing?.confidence).toBe(0.65);
    expect(findMove('M-p1')?.landing?.reasoning).toBe('P1 reasoning');
    expect(findMove('M-p1')?.landing?.signalsUsed).toEqual([
      'edit_vs_critique',
      'redetection',
    ]);

    expect(findMove('M-p2')?.landing?.status).toBe('unaddressed');
    expect(findMove('M-p2')?.landing?.reasoning).toBe('P2 reasoning');
    expect(findMove('M-p2')?.landing?.detectedAtIteration).toBe(2);
  });
});
