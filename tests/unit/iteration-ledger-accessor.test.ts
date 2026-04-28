// ============================================================================
// ITERATION LEDGER ACCESSOR / MUTATOR — self-test (D-1.1)
// ============================================================================
// Per the D-1.1 contract: "Unit tests covering: fresh profile, legacy
// profile, corrupt iterationLedger, increment with each trigger reason."
//
// Four contract scenarios + adversarial edges:
//   1. Fresh profile (createInitialProfile) → currentIteration = 0,
//      arrays empty.
//   2. Legacy profile (iterationLedger absent on load) → defensive
//      hydration via fromCheckpoint emits a warning + telemetry event;
//      after hydration, arrays are empty + currentIteration = 0.
//   3. Corrupt iterationLedger → validateAndNormalizeIterationLedger throws
//      fail-fast with field-naming diagnostic.
//   4. incrementIteration with each trigger reason → currentIteration
//      bumps; rejects empty / dynamic-string-passing paths.

import { describe, beforeEach, it, expect, vi } from 'vitest';

import {
  createInitialProfile,
  getCurrentIteration,
  incrementIteration,
  validateAndNormalizeIterationLedger,
  appendCarryForwardDecision,
  pruneRecentDecisions,
} from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import type {
  CarryForwardDecision,
  EssayProfile,
  IterationLedger,
} from '../../src/services/essayIntelligence/profileTypes';

function makeBaselineProfile(): EssayProfile {
  return createInitialProfile({
    essayText: 'short test essay.',
    paragraphTexts: ['short test essay.'],
    sentenceTexts: [['short test essay.']],
    metadata: { essayType: 'common_app', wordCount: 3 },
  });
}

describe('D-1.1 — iteration ledger accessor / mutator / validator', () => {
  describe('1. Fresh profile (createInitialProfile)', () => {
    it('starts with currentIteration=0 and empty sub-arrays', () => {
      const profile = makeBaselineProfile();
      expect(getCurrentIteration(profile)).toBe(0);
      expect(profile.iterationLedger.iterations).toEqual([]);
      expect(profile.iterationLedger.taughtMoves).toEqual([]);
      expect(profile.iterationLedger.recentDecisions).toEqual([]);
    });
  });

  describe('2. incrementIteration — each trigger reason', () => {
    it("increments from 0 to 1 on first 'first_pass' trigger", () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      expect(getCurrentIteration(profile)).toBe(1);
    });

    it('increments cumulatively across multiple iterations', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      incrementIteration(profile, 'edit');
      incrementIteration(profile, 'student_request');
      expect(getCurrentIteration(profile)).toBe(3);
    });

    it("accepts 'edit' trigger", () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'edit');
      expect(getCurrentIteration(profile)).toBe(1);
    });

    it("accepts 'student_request' trigger", () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'student_request');
      expect(getCurrentIteration(profile)).toBe(1);
    });

    it('throws on empty triggeredBy reason', () => {
      const profile = makeBaselineProfile();
      expect(() =>
        incrementIteration(profile, '' as unknown as 'first_pass'),
      ).toThrow(/triggeredBy is required/);
    });

    it('throws on invalid triggeredBy string', () => {
      const profile = makeBaselineProfile();
      expect(() =>
        incrementIteration(profile, 'arbitrary_reason' as unknown as 'first_pass'),
      ).toThrow(/triggeredBy is required and must be one of/);
    });

    it('does NOT mutate iterations[] / taughtMoves[] (those commit at iteration end via D-1.10)', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      expect(profile.iterationLedger.iterations).toEqual([]);
      expect(profile.iterationLedger.taughtMoves).toEqual([]);
    });
  });

  describe('3. getCurrentIteration — error path', () => {
    it('throws if iterationLedger is missing (non-canonical profile construction)', () => {
      // Simulate a profile constructed via raw cast bypassing
      // createInitialProfile / fromCheckpoint.
      const corruptProfile = { iterationLedger: undefined } as unknown as EssayProfile;
      expect(() => getCurrentIteration(corruptProfile)).toThrow(
        /iterationLedger is missing/,
      );
    });
  });

  describe('4. incrementIteration — missing-ledger error path', () => {
    it('throws if iterationLedger is missing', () => {
      const corruptProfile = {} as unknown as EssayProfile;
      expect(() => incrementIteration(corruptProfile, 'first_pass')).toThrow(
        /iterationLedger is missing/,
      );
    });
  });

  describe('5. validateAndNormalizeIterationLedger — corrupt-field detection', () => {
    it('passes on a clean ledger', () => {
      const ledger: IterationLedger = {
        currentIteration: 0,
        iterations: [],
        taughtMoves: [],
        recentDecisions: [],
      };
      expect(() => validateAndNormalizeIterationLedger(ledger, 'essay-1')).not.toThrow();
    });

    it('throws fail-fast on currentIteration as string', () => {
      const ledger = {
        currentIteration: '1' as unknown as number,
        iterations: [],
        taughtMoves: [],
        recentDecisions: [],
      } as IterationLedger;
      expect(() => validateAndNormalizeIterationLedger(ledger, 'essay-1')).toThrow(
        /corrupt iterationLedger\.currentIteration on load \(essayId=essay-1\)/,
      );
    });

    it('throws fail-fast on negative currentIteration', () => {
      const ledger = {
        currentIteration: -1,
        iterations: [],
        taughtMoves: [],
        recentDecisions: [],
      } as IterationLedger;
      expect(() => validateAndNormalizeIterationLedger(ledger, 'essay-2')).toThrow(
        /currentIteration on load/,
      );
    });

    it('throws fail-fast on iterations as string', () => {
      const ledger = {
        currentIteration: 0,
        iterations: 'not-an-array' as unknown as [],
        taughtMoves: [],
        recentDecisions: [],
      } as IterationLedger;
      expect(() => validateAndNormalizeIterationLedger(ledger, 'essay-3')).toThrow(
        /corrupt iterationLedger\.iterations on load/,
      );
    });

    it('throws fail-fast on taughtMoves as object', () => {
      const ledger = {
        currentIteration: 0,
        iterations: [],
        taughtMoves: { fake: true } as unknown as [],
        recentDecisions: [],
      } as IterationLedger;
      expect(() => validateAndNormalizeIterationLedger(ledger, 'essay-4')).toThrow(
        /corrupt iterationLedger\.taughtMoves on load/,
      );
    });

    it('coerces null array fields to empty arrays (legacy serializer compat)', () => {
      const ledger = {
        currentIteration: 5,
        iterations: null as unknown as [],
        taughtMoves: null as unknown as [],
        recentDecisions: null as unknown as [],
      } as IterationLedger;
      validateAndNormalizeIterationLedger(ledger, 'essay-5');
      expect(ledger.iterations).toEqual([]);
      expect(ledger.taughtMoves).toEqual([]);
      expect(ledger.recentDecisions).toEqual([]);
      expect(ledger.currentIteration).toBe(5); // unchanged
    });
  });

  describe('6. Legacy profile load via real fromCheckpoint (round-1 audit T1.5 closure)', () => {
    // [round-1 audit §5.A / T1.5 closure] Previous test body called
    // console.warn + emitIterationEvent BY HAND inside the test — it
    // exercised zero production code, just the test harness's own
    // ability to spy on its own emissions. Replaced with a real
    // EssayProfileCoordinator.fromCheckpoint call against a minimal
    // legacy-shaped profile (iterationLedger absent, but otherwise
    // structurally valid) so the production hydration block actually
    // runs and the warn + emit assertions verify production behavior.
    //
    // Post-T1.4: the legacy-hydration emit is now status:'failed' with
    // code:'legacy_hydration' (was 'succeeded'). Test asserts the new
    // severity to lock the audit closure.

    beforeEach(async () => {
      const { __resetTelemetryForTesting } = await import(
        '../../src/services/essayIntelligence/telemetry/iterationTelemetry'
      );
      __resetTelemetryForTesting();
    });

    it('production fromCheckpoint hydrates a legacy profile with empty ledger and emits structured failure event', async () => {
      const { EssayProfileCoordinator } = await import(
        '../../src/services/essayIntelligence/profileManager/essayProfileManager'
      );
      const { InMemoryCheckpointStore } = await import(
        '../../src/services/essayIntelligence/profileManager/checkpointStore'
      );
      const { flushEventsForIteration } = await import(
        '../../src/services/essayIntelligence/telemetry/iterationTelemetry'
      );

      // Build a minimal legacy-shaped EssayProfile: every field needed for
      // fromCheckpoint to NOT trigger the migration path, but with
      // iterationLedger genuinely missing (the field this test exercises).
      // We use createInitialProfile to construct a valid baseline, then
      // delete the iterationLedger field to simulate a pre-D-0.5 row.
      const baselineProfile = createInitialProfile({
        essayText: 'Legacy essay text for fromCheckpoint exercise.',
        paragraphTexts: ['Legacy essay text for fromCheckpoint exercise.'],
        sentenceTexts: [['Legacy essay text for fromCheckpoint exercise.']],
        metadata: { essayType: 'common_app', wordCount: 6 },
      });
      // Force into legacy-row shape: clear iterationLedger so the
      // production hydration branch fires. Type cast through `unknown`
      // because the type forbids undefined here, but JSONB rows
      // pre-D-0.5 had this field absent.
      const legacyProfile = {
        ...baselineProfile,
        // Set improvementCandidateSnapshot to an empty-but-present value
        // so the migration block at fromCheckpoint head doesn't run
        // (we're testing iterationLedger hydration, not migration).
        improvementCandidateSnapshot: {
          candidates: [],
          version: 1,
          lastMutatedAt: new Date().toISOString(),
        },
      } as EssayProfile;
      // The actual deletion — bypass TypeScript's structural check with
      // `as unknown as Record<...>` since `iterationLedger` is required
      // on the EssayProfile type but legacy JSONB rows don't have it.
      delete (legacyProfile as unknown as Record<string, unknown>).iterationLedger;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        // Drive the actual production path. This is where the legacy-
        // hydration block (essayProfileManager.ts:1500-1525) fires —
        // not in the test body.
        const coord = EssayProfileCoordinator.fromCheckpoint(
          legacyProfile,
          'test-essay-legacy',
          new InMemoryCheckpointStore(),
        );
        const hydratedLedger = coord.getProfile().iterationLedger;

        // (a) Hydrated ledger has the expected default shape.
        expect(hydratedLedger.currentIteration).toBe(0);
        expect(hydratedLedger.iterations).toEqual([]);
        expect(hydratedLedger.taughtMoves).toEqual([]);
        expect(hydratedLedger.recentDecisions).toEqual([]);

        // (b) console.warn fired with the actual production message.
        expect(warnSpy).toHaveBeenCalled();
        const warnMessage = String(warnSpy.mock.calls[0][0] ?? '');
        expect(warnMessage).toMatch(/iterationLedger missing on loaded profile/);
        expect(warnMessage).toMatch(/test-essay-legacy/);

        // (c) Telemetry emitted via the real production emitIterationEvent
        //     with step='profile.fromCheckpoint.legacyHydration' AND
        //     status='failed' (post-T1.4 severity flip).
        const events = flushEventsForIteration('test-essay-legacy', 0);
        const legacyEvent = events.find(
          (e) => e.step === 'profile.fromCheckpoint.legacyHydration',
        );
        expect(legacyEvent).toBeDefined();
        expect(legacyEvent?.status).toBe('failed');
        expect(legacyEvent?.error?.code).toBe('legacy_hydration');
        expect((legacyEvent?.error?.context as Record<string, unknown> | undefined)?.essayId).toBe('test-essay-legacy');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('production fromCheckpoint also emits four legacyBackfill events for missing ground-truth/story/intent/conversator arrays', async () => {
      const { EssayProfileCoordinator } = await import(
        '../../src/services/essayIntelligence/profileManager/essayProfileManager'
      );
      const { InMemoryCheckpointStore } = await import(
        '../../src/services/essayIntelligence/profileManager/checkpointStore'
      );
      const { flushEventsForIteration } = await import(
        '../../src/services/essayIntelligence/telemetry/iterationTelemetry'
      );

      const baselineProfile = createInitialProfile({
        essayText: 'P0.',
        paragraphTexts: ['P0.'],
        sentenceTexts: [['P0.']],
        metadata: { essayType: 'common_app', wordCount: 1 },
      });
      const legacyProfile = {
        ...baselineProfile,
        improvementCandidateSnapshot: {
          candidates: [],
          version: 1,
          lastMutatedAt: new Date().toISOString(),
        },
      } as EssayProfile;
      // Strip all four legacy-backfill targets to simulate a pre-D-0.5
      // row that lacks the conversator/ground-truth fields.
      const stripped = legacyProfile as unknown as Record<string, unknown>;
      delete stripped.iterationLedger;
      delete stripped.groundTruthFacts;
      delete stripped.storyFragments;
      delete stripped.intentSignals;
      delete stripped.conversatorSessionLog;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        EssayProfileCoordinator.fromCheckpoint(
          legacyProfile,
          'test-essay-bare-legacy',
          new InMemoryCheckpointStore(),
        );
        const events = flushEventsForIteration('test-essay-bare-legacy', 0);

        // All four backfill steps emitted with status='failed' + code='legacy_backfill'.
        for (const field of ['groundTruthFacts', 'storyFragments', 'intentSignals', 'conversatorSessionLog']) {
          const ev = events.find(
            (e) => e.step === `profile.fromCheckpoint.legacyBackfill.${field}`,
          );
          expect(ev, `expected legacyBackfill event for ${field}`).toBeDefined();
          expect(ev?.status).toBe('failed');
          expect(ev?.error?.code).toBe('legacy_backfill');
        }
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // D-1.11 Step 2-3: appendCarryForwardDecision + pruneRecentDecisions
  // ═════════════════════════════════════════════════════════════════════════
  // Mutators that close the recentDecisions[] dead wire identified in the
  // pre-D-1.11 audit. Spec at L5_IMPLEMENTATION_PLAN.md §D-1.11.
  //
  // Append-time validation contract (per D-1.11 Plan agent §9):
  //   - profile.iterationLedger must exist (mirror D-1.1's check)
  //   - decision.iteration MUST equal profile.iterationLedger.currentIteration
  //     (catches stale-closure / wrong-iter appends)
  //   - decision.itemKey: non-empty, < 200 chars (sanity bound)
  //   - decision.decision: enum-checked at runtime
  //   - decision.arbitrationMechanism: enum-checked at runtime
  // On validation failure: throw. The CALLER wraps in try/catch +
  // structured log so audit-trail bugs don't abort analysis (this is the
  // ONE swallow site; the helper itself throws).
  //
  // Pruning policy (per D-1.11 Plan agent §6):
  //   "Last 5 iterations" = iteration-NUMBER window, not record count.
  //   When committing iter N: retain decisions where decision.iteration >= N - 4.

  describe('7. appendCarryForwardDecision (D-1.11)', () => {
    function makeDecision(
      overrides: Partial<CarryForwardDecision> = {},
    ): CarryForwardDecision {
      return {
        iteration: 1,
        itemKey: 'mode_selection',
        decision: 'partial_refresh',
        rationale: 'Rule 4: significance=moderate → focused mode',
        costSavedIfCarry: 0.10,
        costSpentIfRederive: 0,
        arbitrationMechanism: 'validity_test',
        ...overrides,
      };
    }

    it('appends a valid decision to recentDecisions[]', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass'); // currentIteration → 1

      const decision = makeDecision({ iteration: 1 });
      appendCarryForwardDecision(profile, decision);

      expect(profile.iterationLedger.recentDecisions).toHaveLength(1);
      expect(profile.iterationLedger.recentDecisions[0]).toEqual(decision);
    });

    it('accumulates multiple decisions across appends', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      appendCarryForwardDecision(profile, makeDecision({ iteration: 1, itemKey: 'mode_selection' }));
      appendCarryForwardDecision(profile, makeDecision({ iteration: 1, itemKey: 'F7' }));
      appendCarryForwardDecision(profile, makeDecision({ iteration: 1, itemKey: 'voice_map' }));
      expect(profile.iterationLedger.recentDecisions).toHaveLength(3);
      expect(profile.iterationLedger.recentDecisions.map((d) => d.itemKey)).toEqual([
        'mode_selection',
        'F7',
        'voice_map',
      ]);
    });

    it('throws when iterationLedger is missing on profile', () => {
      const profile = makeBaselineProfile();
      delete (profile as unknown as Record<string, unknown>).iterationLedger;
      expect(() => appendCarryForwardDecision(profile, makeDecision())).toThrow(
        /iterationLedger is missing/,
      );
    });

    it('throws when decision.iteration mismatches profile.currentIteration', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass'); // currentIteration → 1
      // Decision claims iteration 2 — stale closure or logic bug.
      expect(() =>
        appendCarryForwardDecision(profile, makeDecision({ iteration: 2 })),
      ).toThrow(/iteration mismatch/);
    });

    it('throws when itemKey is empty', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      expect(() =>
        appendCarryForwardDecision(profile, makeDecision({ itemKey: '' })),
      ).toThrow(/itemKey/);
    });

    it('throws when itemKey exceeds 200 characters', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      const huge = 'x'.repeat(201);
      expect(() =>
        appendCarryForwardDecision(profile, makeDecision({ itemKey: huge })),
      ).toThrow(/itemKey/);
    });

    it('throws on invalid decision enum', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      expect(() =>
        appendCarryForwardDecision(profile, makeDecision({
          decision: 'bogus' as CarryForwardDecision['decision'],
        })),
      ).toThrow(/decision must be one of/);
    });

    it('throws on invalid arbitrationMechanism enum', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      expect(() =>
        appendCarryForwardDecision(profile, makeDecision({
          arbitrationMechanism: 'bogus' as CarryForwardDecision['arbitrationMechanism'],
        })),
      ).toThrow(/arbitrationMechanism must be one of/);
    });

    it('preserves prior decisions across an append (append-only invariant)', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      const original = makeDecision({ iteration: 1, itemKey: 'original' });
      appendCarryForwardDecision(profile, original);
      const snapshot = JSON.stringify(profile.iterationLedger.recentDecisions);

      appendCarryForwardDecision(profile, makeDecision({ iteration: 1, itemKey: 'second' }));
      // Original must be byte-identical to its snapshot (append-only).
      expect(JSON.stringify(profile.iterationLedger.recentDecisions[0])).toBe(
        JSON.stringify(JSON.parse(snapshot)[0]),
      );
    });

    it('accepts all three valid decision enum values', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      const decisions: Array<CarryForwardDecision['decision']> = ['carry', 'rederive', 'partial_refresh'];
      for (const d of decisions) {
        expect(() =>
          appendCarryForwardDecision(profile, makeDecision({ decision: d, itemKey: `key-${d}` })),
        ).not.toThrow();
      }
      expect(profile.iterationLedger.recentDecisions).toHaveLength(3);
    });

    it('accepts all three valid arbitrationMechanism enum values', () => {
      const profile = makeBaselineProfile();
      incrementIteration(profile, 'first_pass');
      const mechs: Array<CarryForwardDecision['arbitrationMechanism']> = [
        'validity_test',
        'llm_judgment',
        'comprehensive_rule',
      ];
      for (const m of mechs) {
        expect(() =>
          appendCarryForwardDecision(profile, makeDecision({ arbitrationMechanism: m, itemKey: `key-${m}` })),
        ).not.toThrow();
      }
      expect(profile.iterationLedger.recentDecisions).toHaveLength(3);
    });
  });

  describe('8. pruneRecentDecisions (D-1.11)', () => {
    function makeDecision(iter: number, itemKey: string): CarryForwardDecision {
      return {
        iteration: iter,
        itemKey,
        decision: 'partial_refresh',
        rationale: 'test',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0,
        arbitrationMechanism: 'validity_test',
      };
    }

    it('retains decisions from the last N iterations (iteration-number window, not record count)', () => {
      const profile = makeBaselineProfile();
      // Seed currentIteration directly; pretend we're at iter 7.
      profile.iterationLedger.currentIteration = 7;
      // Pre-populate decisions across iters 1-7 (3 per iter).
      for (let i = 1; i <= 7; i++) {
        profile.iterationLedger.recentDecisions.push(
          makeDecision(i, `key-${i}-A`),
          makeDecision(i, `key-${i}-B`),
          makeDecision(i, `key-${i}-C`),
        );
      }

      pruneRecentDecisions(profile, 5);

      // Iter 7 — keepLastN=5 → retain iters 3-7 (window of 5 iter numbers).
      const remainingIters = new Set(profile.iterationLedger.recentDecisions.map((d) => d.iteration));
      expect([...remainingIters].sort()).toEqual([3, 4, 5, 6, 7]);
      expect(profile.iterationLedger.recentDecisions).toHaveLength(5 * 3); // 5 iters × 3 decisions
    });

    it('preserves order of retained decisions (no resorting)', () => {
      const profile = makeBaselineProfile();
      profile.iterationLedger.currentIteration = 4;
      // Append in a deliberate order across iters 1-4
      for (let i = 1; i <= 4; i++) {
        profile.iterationLedger.recentDecisions.push(
          makeDecision(i, `iter${i}-first`),
          makeDecision(i, `iter${i}-second`),
        );
      }
      pruneRecentDecisions(profile, 3); // retain iters 2-4

      const keys = profile.iterationLedger.recentDecisions.map((d) => d.itemKey);
      expect(keys).toEqual([
        'iter2-first', 'iter2-second',
        'iter3-first', 'iter3-second',
        'iter4-first', 'iter4-second',
      ]);
    });

    it('no-op when all decisions are already within the window', () => {
      const profile = makeBaselineProfile();
      profile.iterationLedger.currentIteration = 3;
      profile.iterationLedger.recentDecisions.push(
        makeDecision(1, 'k1'),
        makeDecision(2, 'k2'),
        makeDecision(3, 'k3'),
      );
      pruneRecentDecisions(profile, 5); // window [-1, 3] retains all
      expect(profile.iterationLedger.recentDecisions).toHaveLength(3);
    });

    it('drops everything when keepLastN is 0', () => {
      const profile = makeBaselineProfile();
      profile.iterationLedger.currentIteration = 3;
      profile.iterationLedger.recentDecisions.push(
        makeDecision(1, 'k1'),
        makeDecision(2, 'k2'),
        makeDecision(3, 'k3'),
      );
      pruneRecentDecisions(profile, 0); // window above currentIteration → empty
      expect(profile.iterationLedger.recentDecisions).toEqual([]);
    });

    it('handles empty recentDecisions gracefully', () => {
      const profile = makeBaselineProfile();
      profile.iterationLedger.currentIteration = 5;
      expect(() => pruneRecentDecisions(profile, 5)).not.toThrow();
      expect(profile.iterationLedger.recentDecisions).toEqual([]);
    });

    it('throws when iterationLedger is missing', () => {
      const profile = makeBaselineProfile();
      delete (profile as unknown as Record<string, unknown>).iterationLedger;
      expect(() => pruneRecentDecisions(profile, 5)).toThrow(/iterationLedger is missing/);
    });

    it('throws when keepLastN is negative', () => {
      const profile = makeBaselineProfile();
      expect(() => pruneRecentDecisions(profile, -1)).toThrow(/keepLastN must be a non-negative integer/);
    });

    it('throws when keepLastN is non-integer', () => {
      const profile = makeBaselineProfile();
      expect(() => pruneRecentDecisions(profile, 2.5)).toThrow(/keepLastN must be a non-negative integer/);
    });
  });
});
