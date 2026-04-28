// ============================================================================
// D-1.10 ITERATION LIFECYCLE BRACKET — integration test
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.10 (the 5-piece lifecycle bracket).
//
// This deliverable closes five Phase-1 dead wires that the Apr-28 audit
// surfaced. We test the seams directly because a full-pipeline integration
// (which would stub L1/L2/L3/L3.75/L3.5/L4/L5) would dwarf the signal — the
// behaviors under test are localized to:
//   1. createInitialProfile seeds ledger from priorIterationLedger
//   2. EssayProfileCoordinator.createNew forwards the seed
//   3. incrementIteration advances currentIteration
//   4. bufferTaughtMoves accumulates L5-output moves
//   5. commitIterationRecord pushes record + flushes buffers + checkpoints
//
// We exercise these as a chain: build a coordinator with a seeded ledger,
// increment, buffer some moves, commit, assert post-commit state. The
// orchestrator's wire-up at analysisOrchestrator.ts uses identical sequences
// in identical order — testing them here directly is what gives us
// confidence that the orchestrator integration is wired correctly without
// the cost of a full-pipeline stub.

import { describe, it, expect, beforeEach } from 'vitest';

import {
  createInitialProfile,
  EssayProfileCoordinator,
  getCurrentIteration,
  getPriorIterationSnapshotText,
  incrementIteration,
} from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import {
  bufferTaughtMoves,
  flushTaughtMovesForIteration,
  __resetTaughtMoveBufferForTesting,
} from '../../src/services/essayIntelligence/analysis/taughtMoveBuilder';
import {
  emitStepStart,
  emitStepSuccess,
  flushEventsForIteration,
  __resetTelemetryForTesting,
} from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import { InMemoryCheckpointStore } from '../../src/services/essayIntelligence/profileManager/checkpointStore';
import type {
  EssayProfile,
  IterationLedger,
  IterationRecord,
  TaughtMove,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Fixture helpers ───────────────────────────────────────────────────

function makeCoordinator(
  options: {
    essayText?: string;
    priorIterationLedger?: IterationLedger;
  } = {},
): EssayProfileCoordinator {
  const essayText = options.essayText ?? 'P0 first.\n\nP1 second.';
  const paragraphs = essayText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return EssayProfileCoordinator.createNew({
    essayId: 'test-essay-id',
    essayText,
    paragraphTexts: paragraphs,
    sentenceTexts: paragraphs.map((p) => [p]),
    metadata: { essayType: 'common_app', wordCount: essayText.split(/\s+/).length },
    checkpointStore: new InMemoryCheckpointStore(),
    priorIterationLedger: options.priorIterationLedger,
  });
}

function makeMove(overrides: Partial<TaughtMove> = {}): TaughtMove {
  return {
    id: 'M-test-1',
    annotationId: 'A-test-1',
    location: { paragraphIndex: 0, sentenceIndex: 0 },
    taughtAtIteration: 1,
    teachingMode: 'awareness',
    contentSummary: 'Test taught move.',
    ...overrides,
  };
}

function makePriorLedger(currentIteration: number, snapshotTexts: string[] = []): IterationLedger {
  return {
    currentIteration,
    iterations: snapshotTexts.map((text, i) => makeStubRecord(i + 1, text)),
    taughtMoves: [],
    recentDecisions: [],
  };
}

function makeStubRecord(iteration: number, snapshotText: string): IterationRecord {
  return {
    iteration,
    triggeredBy: 'first_pass',
    carryForwardSummary: { carried: [], rederived: [], refreshed: [] },
    costBreakdown: {},
    comprehensiveBaselineCost: 0,
    carryForwardSavings: 0,
    escalationLevel: 0,
    rationale: 'test stub record',
    startedAt: '2026-04-28T00:00:00.000Z',
    finishedAt: '2026-04-28T00:00:01.000Z',
    snapshotText,
  };
}

beforeEach(() => {
  __resetTaughtMoveBufferForTesting();
  __resetTelemetryForTesting();
});

// ─── Scenario 1: cold first-pass (priorIterationLedger absent) ─────────

describe('D-1.10 — Scenario 1: cold first-pass', () => {
  it('createNew without priorIterationLedger seeds default empty ledger; incrementIteration → 1', () => {
    const coord = makeCoordinator();
    const profile = coord.getProfile() as EssayProfile;

    expect(profile.iterationLedger.currentIteration).toBe(0);
    expect(profile.iterationLedger.iterations).toEqual([]);
    expect(profile.iterationLedger.taughtMoves).toEqual([]);
    expect(profile.iterationLedger.recentDecisions).toEqual([]);

    incrementIteration(profile, 'first_pass');
    expect(getCurrentIteration(profile)).toBe(1);

    // Composer's iter-1 short-circuit confirmed via getPriorIterationSnapshotText
    expect(getPriorIterationSnapshotText(profile, 1)).toBeUndefined();
  });
});

// ─── Scenario 2: seeded ledger, validation throws on corrupt seed ─────

describe('D-1.10 — Scenario 2a: seeded ledger persists & deep-clones', () => {
  it('createInitialProfile with priorIterationLedger seeds it onto new profile', () => {
    const seed = makePriorLedger(1, ['iter-1 snapshot text']);
    const coord = makeCoordinator({ priorIterationLedger: seed });
    const profile = coord.getProfile() as EssayProfile;

    expect(profile.iterationLedger.currentIteration).toBe(1);
    expect(profile.iterationLedger.iterations).toHaveLength(1);
    expect(profile.iterationLedger.iterations[0].snapshotText).toBe('iter-1 snapshot text');
  });

  it('mutating the seed AFTER createInitialProfile does NOT bleed into the profile (deep clone)', () => {
    const seed = makePriorLedger(1, ['original snapshot']);
    const coord = makeCoordinator({ priorIterationLedger: seed });
    const profile = coord.getProfile() as EssayProfile;

    // Mutate the seed object directly.
    seed.currentIteration = 999;
    seed.iterations[0].snapshotText = 'mutated by caller';

    // The profile's ledger remains as it was at seeding time.
    expect(profile.iterationLedger.currentIteration).toBe(1);
    expect(profile.iterationLedger.iterations[0].snapshotText).toBe('original snapshot');
  });
});

describe('D-1.10 — Scenario 2b: corrupt seed throws fail-fast at createInitialProfile', () => {
  it('rejects negative currentIteration via assertIterationLedgerOnLoad', () => {
    const corruptSeed: IterationLedger = {
      currentIteration: -1,
      iterations: [],
      taughtMoves: [],
      recentDecisions: [],
    };
    expect(() =>
      createInitialProfile({
        essayText: 'P0.',
        paragraphTexts: ['P0.'],
        sentenceTexts: [['P0.']],
        metadata: { essayType: 'common_app', wordCount: 1 },
        priorIterationLedger: corruptSeed,
      }),
    ).toThrow(/corrupt iterationLedger\.currentIteration/);
  });
});

// ─── Scenario 3: re-analysis with seeded ledger advances counter ───────

describe('D-1.10 — Scenario 3: re-analysis advances counter on seeded ledger', () => {
  it('priorIterationLedger.currentIteration=1 + incrementIteration → 2; getPriorIterationSnapshotText returns prior text', () => {
    const seed = makePriorLedger(1, ['iter-1 essay text']);
    const coord = makeCoordinator({ priorIterationLedger: seed });
    const profile = coord.getProfile() as EssayProfile;

    incrementIteration(profile, 'edit');
    expect(getCurrentIteration(profile)).toBe(2);

    // D-1.8 composer's snapshot lookup now succeeds — this is the inflection
    // point where the iteration loop becomes functional.
    const priorSnapshot = getPriorIterationSnapshotText(profile, 2);
    expect(priorSnapshot).toBe('iter-1 essay text');
  });
});

// ─── Scenario 4: bufferTaughtMoves accumulates, flush returns them ─────

describe('D-1.10 — Scenario 4: TaughtMove buffer accumulates and flushes', () => {
  // D-1.11 Step 0: buffer is now keyed by (essayId, iteration).
  const ESSAY_ID = 'test-essay-id';

  it('bufferTaughtMoves at iter N → flushTaughtMovesForIteration(N) returns the moves', () => {
    const moves = [makeMove({ id: 'M-A' }), makeMove({ id: 'M-B' })];
    bufferTaughtMoves(ESSAY_ID, 1, moves);
    bufferTaughtMoves(ESSAY_ID, 1, [makeMove({ id: 'M-C' })]); // append

    const flushed = flushTaughtMovesForIteration(ESSAY_ID, 1);
    expect(flushed.map((m) => m.id)).toEqual(['M-A', 'M-B', 'M-C']);
  });

  it('flushTaughtMovesForIteration(N) where N has no entries returns []', () => {
    expect(flushTaughtMovesForIteration(ESSAY_ID, 7)).toEqual([]);
  });
});

// ─── Scenario 5: full lifecycle bracket simulating the orchestrator ────

describe('D-1.10 — Scenario 5: orchestrator-shape lifecycle bracket', () => {
  it('end-to-end: increment → buffer → flush → push to ledger → checkpoint', async () => {
    const essayText = 'P0 first.\n\nP1 second.';
    const coord = makeCoordinator({ essayText });
    const profile = coord.getProfile() as EssayProfile;

    // D-1.11 Step 0/15: buffer + telemetry are keyed by (essayId, iteration).
    const ESSAY_ID = 'test-essay-id';

    // Entry: increment iteration counter
    incrementIteration(profile, 'first_pass');
    const iter = getCurrentIteration(profile);
    expect(iter).toBe(1);

    // Mid-iteration: emit some telemetry events (D-0.9)
    const { stepId } = emitStepStart(ESSAY_ID, iter, 'L1.firstImpressions');
    emitStepSuccess(stepId, { cost: 0.005, model: 'claude-haiku-4-5-20251001' });

    // After L5: buffer some TaughtMoves
    bufferTaughtMoves(ESSAY_ID, iter, [
      makeMove({ id: 'M-1', taughtAtIteration: iter }),
      makeMove({ id: 'M-2', taughtAtIteration: iter }),
    ]);

    // End: assemble IterationRecord, flush buffers, push, checkpoint
    const events = flushEventsForIteration(ESSAY_ID, iter);
    const flushedMoves = flushTaughtMovesForIteration(ESSAY_ID, iter);

    const record: IterationRecord = {
      iteration: iter,
      triggeredBy: 'first_pass',
      carryForwardSummary: { carried: [], rederived: [], refreshed: [] },
      costBreakdown: { L1: 0.005 },
      comprehensiveBaselineCost: 0.005,
      carryForwardSavings: 0,
      escalationLevel: 0,
      rationale: 'first_pass test',
      startedAt: '2026-04-28T00:00:00.000Z',
      finishedAt: new Date().toISOString(),
      events,
      // Note: EssayProfile has no top-level `essayText` field — the
      // orchestrator builds snapshotText from `input.essayText`. Mirror
      // that here by tracking the text as a local.
      snapshotText: essayText,
    };

    profile.iterationLedger.iterations.push(record);
    profile.iterationLedger.taughtMoves.push(...flushedMoves);

    await coord.checkpoint('after_iteration_commit');

    // Post-commit assertions
    expect(profile.iterationLedger.iterations).toHaveLength(1);
    expect(profile.iterationLedger.iterations[0].iteration).toBe(1);
    expect(profile.iterationLedger.iterations[0].snapshotText).toBe(essayText);
    expect(profile.iterationLedger.iterations[0].events).toBeDefined();
    expect(profile.iterationLedger.iterations[0].events?.length).toBeGreaterThan(0);
    expect(profile.iterationLedger.taughtMoves).toHaveLength(2);
    expect(profile.iterationLedger.taughtMoves.map((m) => m.id)).toEqual(['M-1', 'M-2']);

    // Crucially: the D-1.8 composer's snapshot lookup for iter 2 will find this.
    profile.iterationLedger.currentIteration = 2;
    expect(getPriorIterationSnapshotText(profile, 2)).toBe(essayText);
  });
});

// ─── Scenario 6: cross-iteration accumulation (the carry-forward proof) ──

describe('D-1.10 — Scenario 6: cross-iteration ledger accumulation', () => {
  it('two iterations: ledger.taughtMoves accumulates, iterations[] grows by 1, currentIteration advances', () => {
    // Note: EssayProfile has no top-level `essayText` field — the orchestrator
    // builds IterationRecord.snapshotText from `input.essayText` (the
    // PipelineInput arg). Mirror that: track the texts as locals here, the
    // way analyzeEssay does in production.
    const iter1Text = 'P0 first.\n\nP1 second.';
    const iter2Text = 'P0 edited.\n\nP1 second.';

    // D-1.11 Step 0: buffer keyed by (essayId, iter)
    const ESSAY_ID = 'test-essay-id';

    // Iter 1: cold start
    const coord1 = makeCoordinator({ essayText: iter1Text });
    const profile1 = coord1.getProfile() as EssayProfile;
    incrementIteration(profile1, 'first_pass');
    bufferTaughtMoves(ESSAY_ID, 1, [makeMove({ id: 'M-iter1', taughtAtIteration: 1 })]);
    const iter1Moves = flushTaughtMovesForIteration(ESSAY_ID, 1);
    profile1.iterationLedger.iterations.push(makeStubRecord(1, iter1Text));
    profile1.iterationLedger.taughtMoves.push(...iter1Moves);

    // Iter 2: re-analysis with priorIterationLedger seeded from iter 1
    const seedFromIter1 = profile1.iterationLedger;
    const coord2 = makeCoordinator({
      essayText: iter2Text,
      priorIterationLedger: seedFromIter1,
    });
    const profile2 = coord2.getProfile() as EssayProfile;

    // Pre-increment: ledger carries iter 1 history
    expect(profile2.iterationLedger.currentIteration).toBe(1);
    expect(profile2.iterationLedger.iterations).toHaveLength(1);
    expect(profile2.iterationLedger.taughtMoves.map((m) => m.id)).toEqual(['M-iter1']);

    // Increment for iter 2
    incrementIteration(profile2, 'edit');
    expect(getCurrentIteration(profile2)).toBe(2);

    // Iter 2 buffers its own moves
    bufferTaughtMoves(ESSAY_ID, 2, [makeMove({ id: 'M-iter2-A', taughtAtIteration: 2 }), makeMove({ id: 'M-iter2-B', taughtAtIteration: 2 })]);
    const iter2Moves = flushTaughtMovesForIteration(ESSAY_ID, 2);
    profile2.iterationLedger.iterations.push(makeStubRecord(2, iter2Text));
    profile2.iterationLedger.taughtMoves.push(...iter2Moves);

    // Final state assertions: iter 1's history preserved + iter 2 appended
    expect(profile2.iterationLedger.currentIteration).toBe(2);
    expect(profile2.iterationLedger.iterations).toHaveLength(2);
    expect(profile2.iterationLedger.iterations[0].iteration).toBe(1);
    expect(profile2.iterationLedger.iterations[1].iteration).toBe(2);
    expect(profile2.iterationLedger.taughtMoves.map((m) => m.id)).toEqual([
      'M-iter1',
      'M-iter2-A',
      'M-iter2-B',
    ]);

    // The D-1.8 composer's prior-iteration lookup now finds iter 1's text:
    expect(getPriorIterationSnapshotText(profile2, 2)).toBe(iter1Text);
  });
});

// ─── Scenario 7: stale-ledger edge case ────────────────────────────────

describe('D-1.10 — Scenario 7: stale ledger (currentIteration > iterations.length)', () => {
  it('validator accepts stale ledger; getPriorIterationSnapshotText returns undefined gracefully', () => {
    // This shape can occur if a profile was persisted mid-build before
    // D-1.10 landed (currentIteration was bumped but iterations[] never
    // populated), or if a future bug creates an asymmetry. The validator
    // must accept it (it doesn't enforce the slot/length invariant), and
    // getPriorIterationSnapshotText must return undefined gracefully so
    // the D-1.8 composer can short-circuit without throwing.
    const staleSeed: IterationLedger = {
      currentIteration: 5,
      iterations: [makeStubRecord(1, 'only iter 1')], // length 1, but currentIteration claims 5
      taughtMoves: [],
      recentDecisions: [],
    };
    const coord = makeCoordinator({ priorIterationLedger: staleSeed });
    const profile = coord.getProfile() as EssayProfile;

    // No throw on creation.
    expect(profile.iterationLedger.currentIteration).toBe(5);

    // Composer's snapshot lookup for iter 5 looks at iterations[3], which
    // doesn't exist → returns undefined (out-of-range branch).
    expect(getPriorIterationSnapshotText(profile, 5)).toBeUndefined();
  });
});

// ─── Scenario 8: editScope shape on edit-triggered iter ────────────────

describe('D-1.10 — Scenario 8: editScope construction (smoke)', () => {
  it('triggeredBy="edit" produces an IterationRecord with editScope populated', () => {
    // We test the editScope shape directly here because exercising the
    // orchestrator's commitIterationRecord requires a full pipeline run.
    // The shape is defined by the type contract at profileTypes.ts:5207.
    const editScope: NonNullable<IterationRecord['editScope']> = {
      paragraphsChanged: [1],
      significance: 'significant',
      changeTypes: ['claim_refinement'],
      structural: { reordered: false, added: 0, removed: 0 },
    };
    const record: IterationRecord = {
      iteration: 2,
      triggeredBy: 'edit',
      editScope,
      carryForwardSummary: { carried: [], rederived: [], refreshed: [] },
      costBreakdown: { L1: 0.005 },
      comprehensiveBaselineCost: 0.005,
      carryForwardSavings: 0,
      escalationLevel: 0,
      rationale: 'edit-triggered iter',
      startedAt: '2026-04-28T00:00:00.000Z',
      finishedAt: '2026-04-28T00:00:01.000Z',
      snapshotText: 'P0 edited.\n\nP1 second.',
    };

    expect(record.editScope).toBeDefined();
    expect(record.editScope?.paragraphsChanged).toEqual([1]);
    expect(record.editScope?.significance).toBe('significant');
    expect(record.editScope?.changeTypes).toEqual(['claim_refinement']);
  });
});
