// ============================================================================
// D-1.15 Deferred-Item Closure — Item 5: iter-2 IterationRecord fidelity
// ============================================================================
//
// Spec: docs/audit/phase-1-integrity-audit.md §6 Item 5.
//
// What this file tests (and what it DOESN'T):
//   D-1.15 Scenarios 1–5 (`tests/integration/phase1-iteration-ledger.ts`)
//   manually pushed an IterationRecord to `iterationLedger.iterations[]`
//   with hard-coded fields, rather than driving the orchestrator path that
//   actually populates them. That left a fidelity gap: every assertion in
//   D-1.15 ran against fields the test author chose, not fields the
//   orchestrator threaded. If the orchestrator's `commitIterationRecord`
//   regressed silently (say, started zeroing `costBreakdown` or dropping
//   `events`), D-1.15's assertions would still pass.
//
//   Item 5 closes that gap: drive `analysisOrchestrator.analyzeEssay` for
//   an iter-2 (`triggeredBy: 'edit'`) path, let the REAL `commitIterationRecord`
//   run inside `buildPartialResult` (the L2-abort path), and assert every
//   IterationRecord field is populated honestly from orchestrator inputs —
//   PipelineInput threading, real CostSummary from `costTracker`, real
//   telemetry buffer drain, real `synthesizeCarryForwardSummary` call.
//
//   Per the LLM-first design rule "no hard-coded behavior": fields under
//   test must be PROVEN to flow from real producers (input, costTracker,
//   telemetry buffer, recentDecisions), not from constants the test author
//   inserted.
//
// Why the L2-abort seam:
//   commitIterationRecord has TWO call sites — the success path
//   (analysisOrchestrator.ts:1435, after every layer completes) and the
//   buildPartialResult path (analysisOrchestrator.ts:2379, on layer-failure
//   abort). Driving the success path would require mocking 8+ layer services
//   (firstImpressions, structuralCartographer, scoutPass, sequentialDeepWalk,
//   holisticSynthesis, analysisPass, crystallizer, deepAnnotationService)
//   each with their full type contracts. The L2-abort seam is upstream of
//   most of those, requires only L1 success + L2 throw, and exercises the
//   SAME commitIterationRecord helper. It's the smallest
//   mock surface that proves the contract (per Tue's "investigate, don't
//   gold-plate" directive).
//
//   The success-path coverage gap (was every layer's costBreakdown entry
//   composed correctly when ALL layers run?) is a DIFFERENT contract —
//   field-level honesty is what Item 5 audits, and the L2-abort path is
//   sufficient because L1's cost gets recorded honestly via `costTracker.record`,
//   which is the same mechanism every other layer uses.
//
// What we mock at the LLM boundary (zero API spend per Phase 1 charter):
//   - firstImpressionsService.analyze — returns valid stub impressions for
//     the fixture essay (4 paragraphs from harvard-mites-2029) with cost=$0.05
//   - structuralCartographerService.analyze — emits an iteration telemetry
//     event for iter=2 (so events[] flushing is testable), then throws
//     (drives the L2 abort path)
//   - scoutPassService.analyze — throws (L2.5 also fails; either failure
//     would trigger Promise.all rejection, but mocking both is honest about
//     the abort condition)
//
// Assertions are organized per-IterationRecord-field so a regression points
// at a specific contract (per Tue's diagnosability directive 2026-04-30):
//   - "iteration counter"
//   - "edit-trigger fields" (triggeredBy, editScope)
//   - "cost fields" (costBreakdown, comprehensiveBaselineCost, carryForwardSavings)
//   - "synthesis fields" (carryForwardSummary)
//   - "telemetry fields" (events[])
//   - "snapshot fields" (snapshotText)
//   - "timing fields" (startedAt / finishedAt)
//   - "escalation fields" (escalationLevel)
//   - "rationale"

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (hoisted) ──────────────────────────────────────────────────
//
// vi.mock is hoisted to the top of the module, so these MUST come BEFORE
// any imports that reach into the mocked modules. Pattern mirrors
// `tests/integration/phase1-iteration-ledger.ts`.

vi.mock('../../src/services/essayIntelligence/analysis/firstImpressions', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/firstImpressions')
  >('../../src/services/essayIntelligence/analysis/firstImpressions');
  return {
    ...actual,
    firstImpressionsService: {
      analyze: vi.fn(),
    },
  };
});

vi.mock('../../src/services/essayIntelligence/analysis/structuralCartographer', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/structuralCartographer')
  >('../../src/services/essayIntelligence/analysis/structuralCartographer');
  return {
    ...actual,
    structuralCartographerService: {
      analyze: vi.fn(),
    },
  };
});

vi.mock('../../src/services/essayIntelligence/analysis/scoutPass', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/essayIntelligence/analysis/scoutPass')
  >('../../src/services/essayIntelligence/analysis/scoutPass');
  return {
    ...actual,
    scoutPassService: {
      analyze: vi.fn(),
    },
  };
});

import { firstImpressionsService } from '../../src/services/essayIntelligence/analysis/firstImpressions';
import { structuralCartographerService } from '../../src/services/essayIntelligence/analysis/structuralCartographer';
import { scoutPassService } from '../../src/services/essayIntelligence/analysis/scoutPass';

import { AnalysisOrchestrator } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type {
  PipelineInput,
} from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { InMemoryCheckpointStore } from '../../src/services/essayIntelligence/profileManager/checkpointStore';
import {
  emitIterationEvent,
  __resetTelemetryForTesting,
} from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import { __resetTaughtMoveBufferForTesting } from '../../src/services/essayIntelligence/analysis/taughtMoveBuilder';
import type {
  CarryForwardDecision,
  EssayProfile,
  IterationLedger,
  IterationRecord,
  ParagraphFirstImpression,
  ReanalysisBrief,
} from '../../src/services/essayIntelligence/profileTypes';
import type { FirstImpressionsResult } from '../../src/services/essayIntelligence/analysis/firstImpressions';

const mockL1 = vi.mocked(firstImpressionsService.analyze);
const mockL2 = vi.mocked(structuralCartographerService.analyze);
const mockL25 = vi.mocked(scoutPassService.analyze);

// ─── Fixture: a 4-paragraph essay (multi-paragraph diversity directive) ──

const FIXTURE_ESSAY = `Three days before I got on a plane to go across the country for six weeks I quit milk cold-turkey. I had gone to the chiropractor for a check up. I learned my body had developed a hormone imbalance. I was afraid.

Within the next 48-hours before the tower's approval at City Hall, I rallied everyone. Through this educational conference, I developed a plan of action.

Living in a building with 80 people I've never met was not easy. The first few days were not kind. That first Thursday night however, things started to change.

As the program progressed I felt more comfortable and safe. I gained priceless confidence. Through all of this somehow cutting out the biggest part of my diet became the least impactful part of my summer.`;

const FIXTURE_PARAGRAPHS = FIXTURE_ESSAY.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

const ESSAY_ID = 'd1-15-item5-iter2-fidelity';

// ─── Helper: build a valid ParagraphFirstImpression for paragraph i ────

function buildStubImpression(paragraphText: string, index: number): ParagraphFirstImpression {
  // Split on sentence-ending punctuation followed by space/newline, mirroring
  // L1's typical sentence breakdown. Stable enough for the test.
  const sentenceTexts = paragraphText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  return {
    paragraphIndex: index,
    apparentPurpose: `paragraph ${index} stub purpose`,
    emotionalRegister: 'matter-of-fact',
    voiceObservation: `paragraph ${index} stub voice`,
    craftNotices: [`craft notice ${index}`],
    tags: [`tag-p${index}-a`, `tag-p${index}-b`],
    sentences: sentenceTexts.map((text, sentenceIndex) => ({
      index: sentenceIndex,
      text,
      apparentPurpose: `sentence ${index}.${sentenceIndex} purpose`,
      rhetoricalFunction: 'concrete-detail',
      toneShift: false,
      notableElements: [],
      tags: [`stag-${index}.${sentenceIndex}`],
    })),
    notablePhrases: [],
  };
}

function buildStubL1Result(): FirstImpressionsResult {
  const impressions = FIXTURE_PARAGRAPHS.map((p, i) => buildStubImpression(p, i));
  const totalSentences = impressions.reduce((sum, imp) => sum + imp.sentences.length, 0);
  const totalWords = FIXTURE_ESSAY.split(/\s+/).filter((w) => w.length > 0).length;

  // The orchestrator builds initialProfileIndex itself only if needed; the
  // service contract requires it. Build a minimal one matching ProfileIndex.
  return {
    impressions,
    initialProfileIndex: {
      essayLength: { paragraphs: impressions.length, sentences: totalSentences, words: totalWords },
      confidenceLevel: 'initial',
      topicTags: [],
      paragraphDigest: impressions.map((imp, i) => ({
        index: i,
        roleSummary: imp.apparentPurpose,
        tags: imp.tags,
        themes: [],
        sentenceCount: imp.sentences.length,
        hasStrengths: false,
        hasWeaknesses: false,
        connectionCount: 0,
        improvementPriority: 0,
      })),
      sectionTokenCounts: {
        voiceIdentity: 0,
        voiceMap: 0,
        emotionalTopography: 0,
        momentEarnednessMap: 0,
        thematicArchitecture: 0,
        narrativeStrategy: 0,
        characterRevelation: 0,
        craftAssessment: 0,
        entanglements: 0,
        admissionsPositioning: 0,
        northStar: 0,
        connections: 0,
        paragraphs: impressions.map(() => 0),
      },
      connectionGraph: [],
      northStarSummary: { throughLineSummary: null, structuralRoles: [], maturity: 'absent' },
      stalenessSnapshot: { strongStale: [], moderateStale: [], weakStale: [], lastChangeAt: null },
      activeConcerns: [],
      improvementPhase: {
        level: 'foundation',
        reasoning: 'stub',
        focusAreas: [],
        deferredAreas: [],
        readinessAssessment: 'stub',
        legacyReadiness: { essayLevel: 0, paragraphLevel: 0, sentenceLevel: 0, wordLevel: 0 },
        dimensionPhases: [],
        coachingLens: 'stub',
        transition: null,
      },
      fullAnalysisCount: 0,
      lastComprehensiveAt: null,
    },
    cost: 0.05, // load-bearing: feeds costSummary.totalCost via costTracker
    tokenUsage: {
      inputTokens: 1000,
      outputTokens: 500,
      cacheReadTokens: 200,
      cacheWriteTokens: 100,
    },
    timingMs: 1234,
    paragraphTimings: impressions.map((_, i) => ({ index: i, timingMs: 300, success: true })),
  };
}

// ─── Helper: build a stub iter-1 IterationRecord for prior ledger seed ──

function buildIter1Record(): IterationRecord {
  return {
    iteration: 1,
    triggeredBy: 'first_pass',
    carryForwardSummary: { carried: [], rederived: [], refreshed: [] },
    costBreakdown: { L1: 0.05 },
    comprehensiveBaselineCost: 0.05,
    carryForwardSavings: 0,
    escalationLevel: 0,
    rationale: 'iter-1 first_pass (Item 5 fidelity test seed)',
    startedAt: '2026-04-29T10:00:00.000Z',
    finishedAt: '2026-04-29T10:00:30.000Z',
    snapshotText: FIXTURE_ESSAY,
  };
}

function buildPriorIterationLedger(): IterationLedger {
  return {
    currentIteration: 1, // increment will advance to 2
    iterations: [buildIter1Record()],
    taughtMoves: [],
    recentDecisions: [],
  };
}

// ─── Helper: build the iter-2 ReanalysisBrief threaded via PipelineInput ──

function buildIter2Brief(): ReanalysisBrief {
  return {
    netChanges: [
      {
        location: { paragraph: 1 },
        oldText: 'P1 original',
        newText: 'P1 revised',
        significance: 'moderate',
        changeType: 'modified', // counter ignores 'modified' — drives editScope.added=0
      },
      {
        location: { paragraph: 2 },
        oldText: '',
        newText: 'P2 newly added',
        significance: 'significant',
        changeType: 'paragraph_added', // bumps editScope.added
      },
    ],
    structural: {
      paragraphsChanged: [1, 2],
      hasReordering: false,
      hasInsertions: true,
      hasDeletions: false,
      changeScope: 'multi_paragraph',
    },
    staleAreas: ['P1.understanding', 'P2.understanding'],
    summaryForPrompt: 'iter-2 brief: P1 revised, P2 inserted',
  };
}

// ─── Helper: build the iter-2 mode-selection decision ──────────────────

function buildIter2ModeDecision(): Omit<CarryForwardDecision, 'iteration'> {
  return {
    itemKey: 'mode_selection.iter2',
    decision: 'rederive',
    rationale: 'comprehensive forced because confidenceLevel=initial on iter-1 fresh profile',
    costSavedIfCarry: 0,
    costSpentIfRederive: 0.5,
    arbitrationMechanism: 'comprehensive_rule',
  };
}

// ─── Helper: build the PipelineInput for an iter-2 edit-triggered run ──

function buildIter2Input(overrides: Partial<PipelineInput> = {}): PipelineInput {
  return {
    essayId: ESSAY_ID,
    essayText: FIXTURE_ESSAY,
    essayType: 'common_app',
    checkpointStore: new InMemoryCheckpointStore(),
    triggeredBy: 'edit',
    priorIterationLedger: buildPriorIterationLedger(),
    reanalysisBrief: buildIter2Brief(),
    editSignificance: 'significant',
    editChangeTypes: ['meaning_evolution', 'specificity_added'],
    focusedEscalationLevel: 3, // load-bearing: must surface verbatim on IterationRecord.escalationLevel
    modeSelectionDecision: buildIter2ModeDecision(),
    ...overrides,
  };
}

// ─── beforeEach: reset all module-level state ──────────────────────────

beforeEach(() => {
  __resetTaughtMoveBufferForTesting();
  __resetTelemetryForTesting();
  mockL1.mockReset();
  mockL2.mockReset();
  mockL25.mockReset();

  // Default mock surface — every test inherits these unless it overrides.
  mockL1.mockResolvedValue(buildStubL1Result());

  // L2 mock: emit a real iteration-2 telemetry event BEFORE throwing, so
  // commitIterationRecord's flushEventsForIteration(input.essayId, iter=2)
  // call drains a real event onto IterationRecord.events[].
  mockL2.mockImplementation(async () => {
    emitIterationEvent(ESSAY_ID, {
      iteration: 2,
      step: 'L2.structuralCartographer',
      status: 'failed',
      error: {
        message: 'L2 stub: forced abort to drive buildPartialResult path',
        code: 'l2_stub_forced_abort',
      },
      timestamp: '2026-04-30T11:00:00.000Z',
    });
    throw new Error('L2 stub: forced abort to drive buildPartialResult path');
  });

  // L2.5 also fails. Both fail simultaneously inside Promise.all; the
  // catch path observes whichever rejected first. We don't depend on
  // which — the `try { await Promise.all([L2, L2.5]) } catch` block at
  // analysisOrchestrator.ts:629 handles either.
  mockL25.mockRejectedValue(new Error('L2.5 stub: forced abort'));
});

// ============================================================================
// THE TEST
// ============================================================================

describe('Item 5 — iter-2 IterationRecord fidelity (E2E orchestrator drive)', () => {
  /**
   * Helper: drive analyzeEssay for an iter-2 path and return the committed
   * IterationRecord (the LAST entry in iterations[], which is iter 2).
   *
   * Used by every `it` block below so each can focus on assertions for
   * its specific contract. Diagnosability: if drive fails, the failure
   * surfaces here with the original PipelineResult.layersFailed shape.
   */
  async function driveIter2(
    inputOverrides: Partial<PipelineInput> = {},
  ): Promise<{ record: IterationRecord; profile: EssayProfile; input: PipelineInput }> {
    const orchestrator = new AnalysisOrchestrator();
    const input = buildIter2Input(inputOverrides);
    const result = await orchestrator.analyzeEssay(input);
    const profile = result.profile as EssayProfile;
    const ledger = profile.iterationLedger;
    expect(ledger.currentIteration).toBe(2);
    expect(ledger.iterations).toHaveLength(2);
    const record = ledger.iterations[1];
    expect(record.iteration).toBe(2);
    return { record, profile, input };
  }

  // ─── Iteration counter ──────────────────────────────────────────────

  describe('iteration counter (matches IterationLedger.currentIteration)', () => {
    it('record.iteration equals 2 (one increment past priorIterationLedger.currentIteration=1)', async () => {
      const { record } = await driveIter2();
      // The contract: incrementIteration(profile, 'edit') runs at line 563
      // BEFORE any layer; commitIterationRecord reads getCurrentIteration
      // AFTER the increment. So a regression that swapped the order would
      // see iteration=1 here.
      expect(record.iteration).toBe(2);
    });
  });

  // ─── Edit-trigger fields ────────────────────────────────────────────

  describe('edit-trigger fields (triggeredBy, editScope)', () => {
    it("triggeredBy = 'edit' (carries from PipelineInput, not orchestrator default)", async () => {
      const { record } = await driveIter2();
      expect(record.triggeredBy).toBe('edit');
    });

    it('editScope is populated (not undefined) for triggeredBy="edit"', async () => {
      const { record } = await driveIter2();
      expect(record.editScope).toBeDefined();
    });

    it('editScope.paragraphsChanged carries verbatim from reanalysisBrief.structural.paragraphsChanged', async () => {
      const { record } = await driveIter2();
      // brief at fixture line ~250 says paragraphsChanged=[1, 2]; that flows
      // through buildEditScopeFromBrief unchanged. A regression that read
      // the wrong field on the brief would surface here.
      expect(record.editScope?.paragraphsChanged).toEqual([1, 2]);
    });

    it('editScope.significance carries verbatim from PipelineInput.editSignificance', async () => {
      const { record } = await driveIter2();
      expect(record.editScope?.significance).toBe('significant');
    });

    it('editScope.changeTypes carries verbatim from PipelineInput.editChangeTypes', async () => {
      const { record } = await driveIter2();
      expect(record.editScope?.changeTypes).toEqual(['meaning_evolution', 'specificity_added']);
    });

    it('editScope.structural counts honestly from brief.netChanges (1 paragraph_added, 0 removed)', async () => {
      const { record } = await driveIter2();
      // The fixture brief has one 'paragraph_added' netChange and one
      // 'modified' (which the counter ignores). So added=1, removed=0.
      // This proves the counting logic ran against THE BRIEF, not against
      // a hard-coded test value.
      expect(record.editScope?.structural.added).toBe(1);
      expect(record.editScope?.structural.removed).toBe(0);
      expect(record.editScope?.structural.reordered).toBe(false);
    });
  });

  // ─── Cost fields ────────────────────────────────────────────────────

  describe('cost fields (costBreakdown, comprehensiveBaselineCost, carryForwardSavings)', () => {
    it('costBreakdown.L1 equals the L1 stub cost (0.05) — fed by costTracker.record', async () => {
      const { record } = await driveIter2();
      // L1 stub returned cost=0.05; costTracker.record('L1', 0.05, ...) at
      // analysisOrchestrator.ts:462 lands it on CostSummary.layers, which
      // commitIterationRecord aggregates into costBreakdown[layer]. A
      // regression that hard-coded costBreakdown to {} would fail here.
      expect(record.costBreakdown.L1).toBeCloseTo(0.05, 6);
    });

    it('costBreakdown does NOT contain L2/L2.5 entries (those layers threw before recording cost)', async () => {
      const { record } = await driveIter2();
      // Honesty check: the L2 mock throws before any costTracker.record call.
      // costBreakdown should reflect REAL spend, not anticipated layers.
      // This pins down the contract that costBreakdown is backed by
      // CostSummary.layers (real spend) rather than a static layer list.
      expect(record.costBreakdown).not.toHaveProperty('L2');
      expect(record.costBreakdown).not.toHaveProperty('L2.5');
    });

    it('comprehensiveBaselineCost equals costSummary.totalCost (sum of all recorded layers)', async () => {
      const { record } = await driveIter2();
      // Per analysisOrchestrator.ts:2129 — comprehensiveBaselineCost is
      // populated from costSummary.totalCost. With only L1=0.05 recorded
      // before the L2 abort, totalCost=0.05.
      expect(record.comprehensiveBaselineCost).toBeCloseTo(0.05, 6);
    });

    it('carryForwardSavings = 0 (D-1.11 documented stub for first iteration of edit cycle)', async () => {
      const { record } = await driveIter2();
      // Per analysisOrchestrator.ts:2130 inline comment — carryForwardSavings
      // is currently a documented stub (= 0). This assertion exists so a
      // future deliverable that activates the field has a forced touch-point
      // (the test will fail with a clear "you changed the field; update
      // the assertion" diagnostic rather than silently passing on a 0
      // that no longer reflects the field's semantic).
      expect(record.carryForwardSavings).toBe(0);
    });
  });

  // ─── Synthesis fields (carryForwardSummary) ─────────────────────────

  describe('synthesis fields (carryForwardSummary from recentDecisions)', () => {
    it('carryForwardSummary.rederived contains the iter-2 modeSelectionDecision itemKey', async () => {
      const { record } = await driveIter2();
      // The PipelineInput carries modeSelectionDecision { decision: 'rederive',
      // itemKey: 'mode_selection.iter2' }; the orchestrator appends it to
      // recentDecisions at line 575-580 with iteration=currentIter (=2);
      // commitIterationRecord calls synthesizeCarryForwardSummary which
      // rolls 'rederive' decisions into the `rederived` bucket. A regression
      // that skipped the synthesis call (or mis-routed buckets) fails here.
      expect(record.carryForwardSummary.rederived).toContain('mode_selection.iter2');
    });

    it('carryForwardSummary.carried is empty (no carry decisions appended this iteration)', async () => {
      const { record } = await driveIter2();
      expect(record.carryForwardSummary.carried).toEqual([]);
    });

    it('carryForwardSummary.refreshed is empty (no partial_refresh decisions appended this iteration)', async () => {
      const { record } = await driveIter2();
      expect(record.carryForwardSummary.refreshed).toEqual([]);
    });

    it('carryForwardSummary buckets are arrays (shape contract)', async () => {
      const { record } = await driveIter2();
      // Pin the shape: arrays, not objects, not undefined. A regression that
      // returned the raw decisions[] (an unrolled array of CarryForwardDecision
      // objects rather than itemKey strings) would fail here.
      expect(Array.isArray(record.carryForwardSummary.carried)).toBe(true);
      expect(Array.isArray(record.carryForwardSummary.rederived)).toBe(true);
      expect(Array.isArray(record.carryForwardSummary.refreshed)).toBe(true);
    });

    it('carryForwardSummary contents are itemKey strings, not decision objects', async () => {
      const { record } = await driveIter2();
      for (const k of record.carryForwardSummary.rederived) {
        expect(typeof k).toBe('string');
      }
    });
  });

  // ─── Telemetry fields (events[]) ────────────────────────────────────

  describe('telemetry fields (events[] drained from emitIterationEvent buffer)', () => {
    it('events[] is populated with the iter=2 event the L2 stub emitted', async () => {
      const { record } = await driveIter2();
      // The L2 stub at the beforeEach() emits an iteration=2 event before
      // throwing; commitIterationRecord drains the buffer via
      // flushEventsForIteration(input.essayId, iter=2) and lands the event
      // on IterationRecord.events. A regression that flushed for the wrong
      // iteration or wrong essayId would surface as undefined / empty.
      expect(record.events).toBeDefined();
      const events = record.events ?? [];
      const l2Event = events.find((e) => e.step === 'L2.structuralCartographer');
      expect(l2Event).toBeDefined();
      expect(l2Event?.iteration).toBe(2);
      expect(l2Event?.status).toBe('failed');
    });

    it('every event in record.events[] has iteration === 2 (filtered by iteration key)', async () => {
      const { record } = await driveIter2();
      const events = record.events ?? [];
      for (const e of events) {
        expect(e.iteration, `event ${e.step} on iter-2 record`).toBe(2);
      }
    });
  });

  // ─── Snapshot fields ────────────────────────────────────────────────

  describe('snapshot fields (snapshotText byte-equal to PipelineInput.essayText)', () => {
    it('snapshotText is byte-equal to PipelineInput.essayText (the post-iteration text)', async () => {
      const { record, input } = await driveIter2();
      expect(record.snapshotText).toBe(input.essayText);
    });

    it('snapshotText differs from the iter-1 record snapshotText when the input differs', async () => {
      const editedText = `${FIXTURE_ESSAY}\n\nP4 newly added paragraph for fidelity test.`;
      const { record, profile } = await driveIter2({ essayText: editedText });
      // iter-1 record's snapshotText was the original FIXTURE_ESSAY (from
      // buildIter1Record); iter-2's must reflect the edited input. Pins
      // the contract that snapshotText is sourced from input.essayText,
      // not from the prior ledger or some constant.
      expect(record.snapshotText).toBe(editedText);
      expect(record.snapshotText).not.toBe(profile.iterationLedger.iterations[0].snapshotText);
    });
  });

  // ─── Timing fields ──────────────────────────────────────────────────

  describe('timing fields (startedAt / finishedAt as wall-clock ISO timestamps)', () => {
    it('startedAt is a valid ISO timestamp string', async () => {
      const { record } = await driveIter2();
      expect(typeof record.startedAt).toBe('string');
      const startedDate = new Date(record.startedAt);
      expect(Number.isNaN(startedDate.getTime())).toBe(false);
      // ISO format check — toISOString round-trip equals input.
      expect(startedDate.toISOString()).toBe(record.startedAt);
    });

    it('finishedAt is a valid ISO timestamp string', async () => {
      const { record } = await driveIter2();
      expect(typeof record.finishedAt).toBe('string');
      const finishedDate = new Date(record.finishedAt);
      expect(Number.isNaN(finishedDate.getTime())).toBe(false);
      expect(finishedDate.toISOString()).toBe(record.finishedAt);
    });

    it('startedAt <= finishedAt (the iteration cannot finish before it starts)', async () => {
      const { record } = await driveIter2();
      const started = new Date(record.startedAt).getTime();
      const finished = new Date(record.finishedAt).getTime();
      expect(started).toBeLessThanOrEqual(finished);
    });

    it('startedAt is later than the iter-1 finishedAt (chronological progression)', async () => {
      const { record, profile } = await driveIter2();
      // Sanity: iter-1 finished at the seed timestamp '2026-04-29T10:00:30Z';
      // iter-2's startedAt was set by the orchestrator at analyzeEssay entry
      // (Date.now()), which is "now" in the test runner's clock — guaranteed
      // later than the 2026-04-29 fixture timestamp.
      const iter1Finished = new Date(profile.iterationLedger.iterations[0].finishedAt).getTime();
      const iter2Started = new Date(record.startedAt).getTime();
      expect(iter2Started).toBeGreaterThan(iter1Finished);
    });
  });

  // ─── Escalation fields ──────────────────────────────────────────────

  describe('escalation fields (escalationLevel threaded from PipelineInput)', () => {
    it('escalationLevel = 3 (verbatim from PipelineInput.focusedEscalationLevel)', async () => {
      const { record } = await driveIter2();
      // The fixture sets focusedEscalationLevel: 3. commitIterationRecord
      // at line 2140 reads `input.focusedEscalationLevel ?? 0` — the
      // ?? fallback only fires for undefined input. With 3 supplied, the
      // record carries 3. A regression that dropped the threading (e.g.,
      // hardcoded 0) fails here.
      expect(record.escalationLevel).toBe(3);
    });

    it('escalationLevel defaults to 0 when PipelineInput.focusedEscalationLevel is undefined', async () => {
      const { record } = await driveIter2({ focusedEscalationLevel: undefined });
      // Pins the documented `?? 0` fallback. This isn't a centrist-default-
      // masking-LLM-silence antipattern: focusedEscalationLevel is set
      // deterministically by reanalysisOrchestrator (or absent for cold
      // first-pass / direct calls), not produced by an LLM. The 0 default
      // is the structural absence value.
      expect(record.escalationLevel).toBe(0);
    });
  });

  // ─── Rationale ──────────────────────────────────────────────────────

  describe('rationale (non-empty string describing the iteration outcome)', () => {
    it('rationale is a non-empty string', async () => {
      const { record } = await driveIter2();
      expect(typeof record.rationale).toBe('string');
      expect(record.rationale.length).toBeGreaterThan(0);
    });

    it("rationale on the L2-abort path describes the abort (contains 'aborted iteration' substring)", async () => {
      const { record } = await driveIter2();
      // analysisOrchestrator.ts:2375-2377 builds the partial-result rationale
      // as `aborted iteration: layers=[...], failed=[...], reason="..."`.
      // Pin the substring contract so a regression that stripped layer-failure
      // detail from the rationale fails diagnostically.
      expect(record.rationale).toMatch(/aborted iteration/);
      // The rationale should also name a failed layer. Either L2 or L2.5
      // could be the one that surfaces (Promise.all races on rejection),
      // so accept either.
      expect(record.rationale).toMatch(/L2\/L2\.5/);
    });
  });

  // ─── Cross-field structural sanity ──────────────────────────────────

  describe('cross-field structural sanity (compound contracts)', () => {
    it('carryForwardSavings = comprehensiveBaselineCost - sum(costBreakdown) (D-1.11 documented identity)', async () => {
      const { record } = await driveIter2();
      // Per analysisOrchestrator.ts:2130 the field is documented as
      // `= comprehensiveBaselineCost - sum(costBreakdown); for first_pass = 0`.
      // For first iteration of the edit cycle the stub returns 0; this
      // assertion pins the identity in case a future deliverable activates
      // a non-zero value that breaks the documented arithmetic.
      const sumBreakdown = Object.values(record.costBreakdown).reduce((s, v) => s + v, 0);
      expect(record.carryForwardSavings).toBeCloseTo(record.comprehensiveBaselineCost - sumBreakdown, 6);
    });

    it('iter-1 record is preserved byte-equal across the iter-2 commit', async () => {
      const { profile } = await driveIter2();
      // The iter-1 record was seeded via priorIterationLedger.iterations[0];
      // committing iter-2 must not mutate iter-1's bytes. Pins the append-
      // only invariant for the iterations[] ledger.
      expect(profile.iterationLedger.iterations[0]).toEqual(buildIter1Record());
    });

    it('iterations[].iteration values are strictly monotonic [1, 2]', async () => {
      const { profile } = await driveIter2();
      const iters = profile.iterationLedger.iterations.map((r) => r.iteration);
      expect(iters).toEqual([1, 2]);
    });
  });
});
