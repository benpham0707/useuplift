// ============================================================================
// D-1.11 INTEGRATION — CarryForwardDecision append + synthesis end-to-end
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.11 + D-1.11 Plan agent §10 (test strategy).
//
// Six scenarios per the Plan agent §10:
//   A. First-pass with no carry-forward decisions → empty rolled-up summary
//   B. Focused-mode arbitration produces 'partial_refresh' decision (DP-1
//      ack: focused mode landed; comprehensive path NOT exercised here
//      because focused goes through processEditAndMaybeReanalyze, not
//      analyzeEssay — covered at the seam-test level)
//   C. Comprehensive re-analysis with iter-2 paragraph carry decisions
//      via DP-2 produces 'partial_refresh' entries in carryForwardSummary.refreshed
//   D. Pruning at 5+ iterations: iter 7 retains iters 3..7 only
//   E. Validation throw on iteration mismatch caught by safeAppendCarryForwardDecision;
//      structured telemetry emitted; analysis continues
//   F. Finding evolution at L3 walk produces an 'llm_judgment' decision
//
// We test at the seam level — exercising the mutators, synthesizer, and
// safe-append helper directly — rather than driving the full
// analyzeEssay pipeline. Rationale: the D-1.11 Steps 6-12 wirings are
// straightforward decision-shape construction + safeAppendCarryForwardDecision
// calls; the LOGIC under test is the mutator's validation, the synthesizer's
// bucketing, and the pruning. Running the full LLM pipeline would dwarf
// the test signal-to-noise. Full-pipeline coverage lives at D-1.15
// (mock-LLM iteration 1→2 flow).

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createInitialProfile,
  incrementIteration,
  appendCarryForwardDecision,
  pruneRecentDecisions,
} from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import {
  synthesizeCarryForwardSummary,
  safeAppendCarryForwardDecision,
} from '../../src/services/essayIntelligence/analysis/carryForwardSynthesis';
import { __resetTelemetryForTesting } from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import type {
  CarryForwardDecision,
  EssayProfile,
  IterationRecord,
} from '../../src/services/essayIntelligence/profileTypes';

function makeProfile(): EssayProfile {
  return createInitialProfile({
    essayText: 'P0 first.\n\nP1 second.',
    paragraphTexts: ['P0 first.', 'P1 second.'],
    sentenceTexts: [['P0 first.'], ['P1 second.']],
    metadata: { essayType: 'common_app', wordCount: 4 },
  });
}

function decision(overrides: Partial<CarryForwardDecision> = {}): CarryForwardDecision {
  return {
    iteration: 1,
    itemKey: 'mode_selection',
    decision: 'partial_refresh',
    rationale: 'test',
    costSavedIfCarry: 0,
    costSpentIfRederive: 0,
    arbitrationMechanism: 'validity_test',
    ...overrides,
  };
}

beforeEach(() => {
  __resetTelemetryForTesting();
});

// ─── Scenario A: first-pass with no decisions → empty summary ──────────

describe('D-1.11 — Scenario A: first-pass with no carry-forward decisions', () => {
  it('iter 1 with no decisions appended → carryForwardSummary is { [], [], [] } honestly', () => {
    const profile = makeProfile();
    incrementIteration(profile, 'first_pass');
    expect(profile.iterationLedger.recentDecisions).toEqual([]);

    // Synthesizer over empty decisions → empty summary.
    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      1,
    );
    expect(summary).toEqual({ carried: [], rederived: [], refreshed: [] });
  });
});

// ─── Scenario B: focused-mode arbitration → partial_refresh decision ───

describe('D-1.11 — Scenario B: re-analysis with focused-mode arbitration', () => {
  it('records mode_selection decision with arbitrationMechanism=validity_test, decision=partial_refresh (focused) or rederive (comprehensive)', () => {
    const profile = makeProfile();
    profile.iterationLedger.currentIteration = 2; // simulate post-increment for iter-2 re-analysis

    // Mode-selection decision attached to the new iteration (iter 2)
    appendCarryForwardDecision(profile, decision({
      iteration: 2,
      itemKey: 'mode_selection',
      decision: 'partial_refresh', // focused mode chose to refresh some + carry rest
      rationale: 'FocusedAnalyzer.selectAnalysisMode → focused',
      arbitrationMechanism: 'validity_test',
    }));

    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      2,
    );
    expect(summary.refreshed).toContain('mode_selection');
    expect(summary.carried).toEqual([]);
    expect(summary.rederived).toEqual([]);
  });

  it('comprehensive mode produces a rederive decision for mode_selection', () => {
    const profile = makeProfile();
    profile.iterationLedger.currentIteration = 2;
    appendCarryForwardDecision(profile, decision({
      iteration: 2,
      itemKey: 'mode_selection',
      decision: 'rederive',
      rationale: 'FocusedAnalyzer.selectAnalysisMode → comprehensive',
      arbitrationMechanism: 'validity_test',
    }));
    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      2,
    );
    expect(summary.rederived).toContain('mode_selection');
  });
});

// ─── Scenario C: per-paragraph priorAnnotations refresh decisions ──────

describe('D-1.11 — Scenario C: comprehensive re-analysis paragraph refresh decisions (DP-2)', () => {
  it('per-paragraph priorAnnotations carries → L5.P{i}.annotations refresh entries', () => {
    const profile = makeProfile();
    profile.iterationLedger.currentIteration = 2;

    // Simulate the DP-2 wire-up: orchestrator builds priorAnnotations Map
    // for paragraphs 0 and 1, emits one decision per covered paragraph.
    appendCarryForwardDecision(profile, decision({
      iteration: 2,
      itemKey: 'L5.P0.annotations',
      decision: 'partial_refresh',
      rationale: 'priorAnnotations carried into L5 prompt (paragraph 0): 2 prior moves, 1 marked addressed by edit',
      arbitrationMechanism: 'validity_test',
    }));
    appendCarryForwardDecision(profile, decision({
      iteration: 2,
      itemKey: 'L5.P1.annotations',
      decision: 'partial_refresh',
      rationale: 'priorAnnotations carried into L5 prompt (paragraph 1): 1 prior moves, 0 marked addressed by edit',
      arbitrationMechanism: 'validity_test',
    }));

    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      2,
    );
    expect(summary.refreshed).toEqual(['L5.P0.annotations', 'L5.P1.annotations']);
  });
});

// ─── Scenario D: pruning at 5+ iterations ──────────────────────────────

describe('D-1.11 — Scenario D: pruning retains last-5-iterations window', () => {
  it('iter 7 with decisions across iters 1-7 → after prune, only iters 3-7 remain', () => {
    const profile = makeProfile();
    profile.iterationLedger.currentIteration = 7;

    // Seed 3 decisions per iter across iters 1-7 (21 total)
    for (let iter = 1; iter <= 7; iter++) {
      profile.iterationLedger.recentDecisions.push(
        decision({ iteration: iter, itemKey: `iter${iter}-A`, decision: 'carry' }),
        decision({ iteration: iter, itemKey: `iter${iter}-B`, decision: 'rederive' }),
        decision({ iteration: iter, itemKey: `iter${iter}-C`, decision: 'partial_refresh' }),
      );
    }
    expect(profile.iterationLedger.recentDecisions).toHaveLength(21);

    pruneRecentDecisions(profile, 5);

    const remainingIters = new Set(
      profile.iterationLedger.recentDecisions.map((d) => d.iteration),
    );
    expect([...remainingIters].sort()).toEqual([3, 4, 5, 6, 7]);
    expect(profile.iterationLedger.recentDecisions).toHaveLength(15); // 5 iters × 3 decisions

    // The pruned summary still synthesizes correctly for the most recent iter.
    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      7,
    );
    expect(summary.carried).toEqual(['iter7-A']);
    expect(summary.rederived).toEqual(['iter7-B']);
    expect(summary.refreshed).toEqual(['iter7-C']);
  });
});

// ─── Scenario E: validation throw caught by safeAppendCarryForwardDecision ──

describe('D-1.11 — Scenario E: append-time validation throw is caught + emits telemetry', () => {
  it('iteration-mismatch decision returns false, emits structured failure event, leaves ledger untouched', async () => {
    const profile = makeProfile();
    incrementIteration(profile, 'first_pass'); // currentIteration = 1
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const ok = safeAppendCarryForwardDecision('test-essay-d111', profile, decision({
        iteration: 99, // mismatch — currentIteration is 1
        itemKey: 'should-not-be-recorded',
      }));
      expect(ok).toBe(false);
      // Decision was REJECTED — ledger untouched.
      expect(profile.iterationLedger.recentDecisions).toHaveLength(0);

      // Structured telemetry surfaces the failure for audit grep.
      const { flushEventsForIteration } = await import(
        '../../src/services/essayIntelligence/telemetry/iterationTelemetry'
      );
      const events = flushEventsForIteration('test-essay-d111', 1);
      const failure = events.find(
        (e) => e.step === 'carryForward.decision_append_failure',
      );
      expect(failure).toBeDefined();
      expect(failure?.error?.code).toBe('carry_forward_decision_append_failure');
    } finally {
      errorSpy.mockRestore();
    }
  });
});

// ─── Scenario F: L3 walk finding evolution → llm_judgment decision ─────

describe('D-1.11 — Scenario F: L3 walk findingEvolution produces llm_judgment decision', () => {
  it('walk-emitted findingEvolution lands as a per-finding partial_refresh with arbitrationMechanism=llm_judgment', () => {
    const profile = makeProfile();
    profile.iterationLedger.currentIteration = 3;

    // Simulate DP-3a: walk emits findingEvolution { findingId: 'F7', newMaturity: 'deepened', reasoning: ... }
    appendCarryForwardDecision(profile, decision({
      iteration: 3,
      itemKey: 'F7',
      decision: 'partial_refresh',
      rationale: 'walk maturity → deepened: new sentence-level evidence consolidated the claim',
      arbitrationMechanism: 'llm_judgment',
    }));
    appendCarryForwardDecision(profile, decision({
      iteration: 3,
      itemKey: 'F12',
      decision: 'rederive',
      rationale: 'walk maturity → superseded (supersedes F12): replaced by F19',
      arbitrationMechanism: 'llm_judgment',
    }));

    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      3,
    );
    expect(summary.refreshed).toContain('F7');
    expect(summary.rederived).toContain('F12');

    // Verify llm_judgment arbitrationMechanism is preserved on the
    // raw decision (the synthesizer drops it in the rolled-up summary,
    // but the recentDecisions[] entries retain it for cost-trajectory
    // analysis).
    const f7Decision = profile.iterationLedger.recentDecisions.find((d) => d.itemKey === 'F7');
    expect(f7Decision?.arbitrationMechanism).toBe('llm_judgment');
  });
});

// ─── Bonus: end-to-end iteration record build with synthesized summary ──

describe('D-1.11 — bonus: full iteration-record build via synthesizer', () => {
  it('synthesize → build IterationRecord → carryForwardSummary buckets are correct', () => {
    const profile = makeProfile();
    profile.iterationLedger.currentIteration = 2;

    // Simulate DP-1 + DP-2 + DP-3a all firing for iter 2:
    appendCarryForwardDecision(profile, decision({
      iteration: 2, itemKey: 'mode_selection', decision: 'rederive',
      rationale: 'comprehensive', arbitrationMechanism: 'validity_test',
    }));
    appendCarryForwardDecision(profile, decision({
      iteration: 2, itemKey: 'L5.P0.annotations', decision: 'partial_refresh',
      rationale: 'priorAnnotations carried', arbitrationMechanism: 'validity_test',
    }));
    appendCarryForwardDecision(profile, decision({
      iteration: 2, itemKey: 'F3', decision: 'partial_refresh',
      rationale: 'walk deepened', arbitrationMechanism: 'llm_judgment',
    }));
    appendCarryForwardDecision(profile, decision({
      iteration: 2, itemKey: 'voice_map', decision: 'carry',
      rationale: 'unchanged', arbitrationMechanism: 'validity_test',
    }));

    const summary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      2,
    );

    // Construct the IterationRecord shape commitIterationRecord would build.
    const record: IterationRecord = {
      iteration: 2,
      triggeredBy: 'edit',
      carryForwardSummary: summary,
      costBreakdown: {},
      comprehensiveBaselineCost: 0,
      carryForwardSavings: 0,
      escalationLevel: 0,
      rationale: 'edit iteration completed',
      startedAt: '2026-04-28T00:00:00.000Z',
      finishedAt: '2026-04-28T00:00:01.000Z',
      snapshotText: 'P0 first.\n\nP1 second.',
    };

    expect(record.carryForwardSummary.carried).toEqual(['voice_map']);
    expect(record.carryForwardSummary.rederived).toEqual(['mode_selection']);
    expect(record.carryForwardSummary.refreshed).toEqual(['L5.P0.annotations', 'F3']);
  });
});
