// ============================================================================
// CARRY-FORWARD SYNTHESIS — pure helper unit tests (D-1.11)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.11 + D-1.11 Plan agent §7 (synthesis bridge).
//
// `synthesizeCarryForwardSummary(decisions, iteration)` is the pure
// function that bridges between `iterationLedger.recentDecisions[]`
// (the per-decision append store) and `IterationRecord.carryForwardSummary`
// (the per-iteration rolled-up summary). D-1.10 stubs the summary as
// `{ carried: [], rederived: [], refreshed: [] }`; D-1.11's synthesizer
// fills it from the decisions appended during the iteration.
//
// Mapping rules (per D-1.11 Plan §7):
//   filter decisions where decision.iteration === iteration
//   for each d:
//     if d.decision === 'carry'           → push d.itemKey to carried
//     if d.decision === 'rederive'        → push d.itemKey to rederived
//     if d.decision === 'partial_refresh' → push d.itemKey to refreshed
//   return { carried, rederived, refreshed }
//     (each Array<string>, deduplicated, stable order)
//
// "Stable order" means insertion order (the order decisions were appended
// during the iteration). "Deduplicated" means the same itemKey appearing
// twice with the same decision lands once in the rolled-up array (a
// theoretical case if the orchestrator records the same decision at
// two call sites; deterministically deduped to keep the audit clean).

import { describe, it, expect } from 'vitest';

import { vi } from 'vitest';
import {
  synthesizeCarryForwardSummary,
  safeAppendCarryForwardDecision,
} from '../../src/services/essayIntelligence/analysis/carryForwardSynthesis';
import { createInitialProfile, incrementIteration } from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import { __resetTelemetryForTesting } from '../../src/services/essayIntelligence/telemetry/iterationTelemetry';
import type { CarryForwardDecision, EssayProfile } from '../../src/services/essayIntelligence/profileTypes';

function makeDecision(overrides: Partial<CarryForwardDecision> = {}): CarryForwardDecision {
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

describe('synthesizeCarryForwardSummary — empty inputs', () => {
  it('returns the empty-arrays shape on empty decisions list', () => {
    expect(synthesizeCarryForwardSummary([], 1)).toEqual({
      carried: [],
      rederived: [],
      refreshed: [],
    });
  });

  it('returns empty when all decisions are from a different iteration', () => {
    const decisions = [
      makeDecision({ iteration: 1, itemKey: 'a' }),
      makeDecision({ iteration: 2, itemKey: 'b' }),
      makeDecision({ iteration: 3, itemKey: 'c' }),
    ];
    expect(synthesizeCarryForwardSummary(decisions, 99)).toEqual({
      carried: [],
      rederived: [],
      refreshed: [],
    });
  });
});

describe('synthesizeCarryForwardSummary — single-bucket sorting', () => {
  it('all-carry decisions land in the carried bucket', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'voiceMap' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'P0.understanding' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.carried).toEqual(['voiceMap', 'P0.understanding']);
    expect(result.rederived).toEqual([]);
    expect(result.refreshed).toEqual([]);
  });

  it('all-rederive decisions land in the rederived bucket', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'rederive', itemKey: 'L5.P3.annotations' }),
      makeDecision({ iteration: 1, decision: 'rederive', itemKey: 'thematicArchitecture' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.rederived).toEqual(['L5.P3.annotations', 'thematicArchitecture']);
    expect(result.carried).toEqual([]);
    expect(result.refreshed).toEqual([]);
  });

  it('all-partial_refresh decisions land in the refreshed bucket', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'partial_refresh', itemKey: 'F7.maturity' }),
      makeDecision({ iteration: 1, decision: 'partial_refresh', itemKey: 'mode_selection' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.refreshed).toEqual(['F7.maturity', 'mode_selection']);
    expect(result.carried).toEqual([]);
    expect(result.rederived).toEqual([]);
  });
});

describe('synthesizeCarryForwardSummary — mixed buckets', () => {
  it('three buckets populate independently from a mixed decisions list', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'voiceMap' }),
      makeDecision({ iteration: 1, decision: 'partial_refresh', itemKey: 'mode_selection' }),
      makeDecision({ iteration: 1, decision: 'rederive', itemKey: 'L5.P0.annotations' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'P1.understanding' }),
      makeDecision({ iteration: 1, decision: 'partial_refresh', itemKey: 'F7' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.carried).toEqual(['voiceMap', 'P1.understanding']);
    expect(result.rederived).toEqual(['L5.P0.annotations']);
    expect(result.refreshed).toEqual(['mode_selection', 'F7']);
  });
});

describe('synthesizeCarryForwardSummary — iteration filtering', () => {
  it('only decisions matching the requested iteration are included', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'iter1-only' }),
      makeDecision({ iteration: 2, decision: 'carry', itemKey: 'iter2-target' }),
      makeDecision({ iteration: 3, decision: 'rederive', itemKey: 'iter3-only' }),
      makeDecision({ iteration: 2, decision: 'partial_refresh', itemKey: 'iter2-also' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 2);
    expect(result.carried).toEqual(['iter2-target']);
    expect(result.refreshed).toEqual(['iter2-also']);
    expect(result.rederived).toEqual([]);
    expect(result.carried).not.toContain('iter1-only');
    expect(result.rederived).not.toContain('iter3-only');
  });
});

describe('synthesizeCarryForwardSummary — deduplication', () => {
  it('deduplicates identical itemKey within the same bucket (same iteration)', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'voiceMap' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'voiceMap' }), // duplicate
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'P0' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.carried).toEqual(['voiceMap', 'P0']);
  });

  it('preserves itemKey across DIFFERENT buckets (carry vs refresh of same key surfaces both)', () => {
    // This is a hypothetical case; in production a single itemKey
    // shouldn't get both 'carry' and 'partial_refresh' in the same
    // iteration. But if it does (orchestrator bug), the synthesizer
    // surfaces BOTH so the audit trail catches the inconsistency
    // rather than silently dropping one.
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'voiceMap' }),
      makeDecision({ iteration: 1, decision: 'partial_refresh', itemKey: 'voiceMap' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.carried).toEqual(['voiceMap']);
    expect(result.refreshed).toEqual(['voiceMap']);
  });
});

describe('synthesizeCarryForwardSummary — order preservation', () => {
  it('preserves insertion order within each bucket', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'first' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'second' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'third' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'fourth' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.carried).toEqual(['first', 'second', 'third', 'fourth']);
  });

  it('interleaved decisions preserve their order within each bucket independently', () => {
    const decisions = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'c1' }),
      makeDecision({ iteration: 1, decision: 'rederive', itemKey: 'r1' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'c2' }),
      makeDecision({ iteration: 1, decision: 'refresh' as 'partial_refresh', itemKey: 'should-not-appear' }), // invalid; should drop
      makeDecision({ iteration: 1, decision: 'partial_refresh', itemKey: 'pr1' }),
      makeDecision({ iteration: 1, decision: 'rederive', itemKey: 'r2' }),
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'c3' }),
    ];
    const result = synthesizeCarryForwardSummary(decisions, 1);
    expect(result.carried).toEqual(['c1', 'c2', 'c3']);
    expect(result.rederived).toEqual(['r1', 'r2']);
    expect(result.refreshed).toEqual(['pr1']);
    // Invalid 'refresh' (not in the enum) should be filtered out, not throw —
    // the synthesizer is purely descriptive of the data it receives; runtime
    // validation lives in appendCarryForwardDecision.
  });
});

describe('synthesizeCarryForwardSummary — pure function (no input mutation)', () => {
  it('does not mutate the input decisions array', () => {
    const decisions: CarryForwardDecision[] = [
      makeDecision({ iteration: 1, decision: 'carry', itemKey: 'a' }),
      makeDecision({ iteration: 1, decision: 'rederive', itemKey: 'b' }),
    ];
    const beforeSnapshot = JSON.stringify(decisions);
    synthesizeCarryForwardSummary(decisions, 1);
    expect(JSON.stringify(decisions)).toBe(beforeSnapshot);
  });

  it('returns a fresh object each call (no shared mutable references)', () => {
    const decisions: CarryForwardDecision[] = [];
    const result1 = synthesizeCarryForwardSummary(decisions, 1);
    const result2 = synthesizeCarryForwardSummary(decisions, 1);
    expect(result1).not.toBe(result2);
    expect(result1.carried).not.toBe(result2.carried);
  });
});

describe('synthesizeCarryForwardSummary — input validation', () => {
  it('throws on non-array decisions input', () => {
    expect(() =>
      synthesizeCarryForwardSummary(null as unknown as CarryForwardDecision[], 1),
    ).toThrow(/decisions must be an array/);
    expect(() =>
      synthesizeCarryForwardSummary(undefined as unknown as CarryForwardDecision[], 1),
    ).toThrow(/decisions must be an array/);
    expect(() =>
      synthesizeCarryForwardSummary({} as unknown as CarryForwardDecision[], 1),
    ).toThrow(/decisions must be an array/);
  });

  it('throws on non-integer iteration', () => {
    expect(() => synthesizeCarryForwardSummary([], 1.5)).toThrow(
      /iteration must be a non-negative integer/,
    );
    expect(() => synthesizeCarryForwardSummary([], -1)).toThrow(
      /iteration must be a non-negative integer/,
    );
    expect(() => synthesizeCarryForwardSummary([], NaN)).toThrow(
      /iteration must be a non-negative integer/,
    );
  });
});

describe('safeAppendCarryForwardDecision — happy path', () => {
  function makeProfile(): EssayProfile {
    const profile = createInitialProfile({
      essayText: 'P0.',
      paragraphTexts: ['P0.'],
      sentenceTexts: [['P0.']],
      metadata: { essayType: 'common_app', wordCount: 1 },
    });
    incrementIteration(profile, 'first_pass'); // currentIteration = 1
    return profile;
  }

  function makeDecision(overrides: Partial<CarryForwardDecision> = {}): CarryForwardDecision {
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

  it('returns true and appends the decision on the happy path', () => {
    const profile = makeProfile();
    const ok = safeAppendCarryForwardDecision('test-essay-cfs', profile, makeDecision());
    expect(ok).toBe(true);
    expect(profile.iterationLedger.recentDecisions).toHaveLength(1);
  });
});

describe('safeAppendCarryForwardDecision — failure swallow', () => {
  function makeProfile(): EssayProfile {
    const profile = createInitialProfile({
      essayText: 'P0.',
      paragraphTexts: ['P0.'],
      sentenceTexts: [['P0.']],
      metadata: { essayType: 'common_app', wordCount: 1 },
    });
    incrementIteration(profile, 'first_pass');
    return profile;
  }

  it('catches iteration-mismatch errors, emits telemetry, returns false (does not abort caller)', async () => {
    __resetTelemetryForTesting();
    const profile = makeProfile(); // currentIteration=1
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const ok = safeAppendCarryForwardDecision('test-essay-cfs', profile, {
        iteration: 99, // mismatch — currentIteration is 1
        itemKey: 'mode_selection',
        decision: 'partial_refresh',
        rationale: 'test',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0,
        arbitrationMechanism: 'validity_test',
      });
      expect(ok).toBe(false);
      // Decision NOT appended (validation rejected it).
      expect(profile.iterationLedger.recentDecisions).toHaveLength(0);
      // console.error fired with the diagnostic.
      expect(errorSpy).toHaveBeenCalled();
      expect(String(errorSpy.mock.calls[0][0] ?? '')).toMatch(/decision append dropped/);

      // Telemetry event captured the structured failure.
      const { flushEventsForIteration } = await import(
        '../../src/services/essayIntelligence/telemetry/iterationTelemetry'
      );
      const events = flushEventsForIteration('test-essay-cfs', 1);
      const failureEvent = events.find(
        (e) => e.step === 'carryForward.decision_append_failure',
      );
      expect(failureEvent).toBeDefined();
      expect(failureEvent?.status).toBe('failed');
      expect(failureEvent?.error?.code).toBe('carry_forward_decision_append_failure');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('catches enum-violation errors and continues (audit trail records the bug)', () => {
    __resetTelemetryForTesting();
    const profile = makeProfile();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const ok = safeAppendCarryForwardDecision('test-essay-cfs', profile, {
        iteration: 1,
        itemKey: 'mode_selection',
        decision: 'bogus' as CarryForwardDecision['decision'], // invalid enum
        rationale: 'test',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0,
        arbitrationMechanism: 'validity_test',
      });
      expect(ok).toBe(false);
      expect(profile.iterationLedger.recentDecisions).toHaveLength(0);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
