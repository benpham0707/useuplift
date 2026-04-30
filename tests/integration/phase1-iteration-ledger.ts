// ============================================================================
// D-1.15 — Phase 1 Iteration Ledger Integration Test (mock-LLM, iter 1 → 2)
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.15 — "Use mock-LLM framework. Load a test essay; run iteration 1
//   with mocked layer responses; assert ledger state. Apply a small edit;
//   run iteration 2 with mocked responses; assert priorAnnotations populated
//   correctly, taughtMoves landed with `landing.status` populated,
//   recentDecisions reflects iteration 2's decisions. Repeat for: structural
//   reorder edit, paragraph delete, paragraph insert, multi-paragraph cascade."
//
// Filename: literal `phase1-iteration-ledger.ts` per the spec (no `.test.ts`
// suffix — separate test category from unit / integration / property,
// matching the convention D-1.13 / D-1.14 established for property tests).
//
// ─── Architectural decision (D-1.15.2 ratified 2026-04-30) ──────────────
//
// D-1.15 tests at the **priorAnnotationsBuilder integration spine** level —
// the seam where the iteration loop's continuity is actually wired. We do
// NOT drive `processEdit()` end-to-end because:
//
//   (i) ALL five scenarios trigger comprehensive mode in production
//       (FocusedAnalyzer.selectAnalysisMode rule 1: confidenceLevel='initial'
//       on a fresh profile forces comprehensive regardless of edit shape).
//       Driving processEdit through to comprehensive means stubbing
//       `analyzeEssayWithBrief` which itself wraps the 8+ layer services.
//
//   (ii) The contracts D-1.15 actually asserts (priorAnnotations Map
//        populated correctly, iter-1 taughtMoves[i].landing populated by
//        D-1.6.5 wire, iter-2 IterationRecord shape correct, recentDecisions
//        reflects iter-2 decisions) ALL live at the
//        `buildPriorAnnotationsForOrchestrator` seam. Mocking the layers
//        above that seam adds noise without diagnostic value.
//
//   (iii) processEdit's orchestration concerns (mode selection, version
//         tracker, coordinator rebuild) are tested by D-1.10 (coordinator),
//         D-1.11 (decisions), and D-1.12 (halt-on-error) at their own
//         seam levels. Re-testing them inside D-1.15 would duplicate
//         coverage without adding signal.
//
// Coverage gap acknowledged (C-5 audit closure 2026-04-30): the manual
// iter-2 IterationRecord push omits `events`, `comprehensiveBaselineCost`
// (set to placeholder 0.5), `escalationLevel` (set to 0), and `costBreakdown`
// (set to {}). These fields would be populated by the real
// commitIterationRecord; D-1.15 doesn't assert on them in this scenario.
// D-1.15.7's audit doc is the right place to surface this for a follow-up
// deliverable that tightens the synthesis fidelity if Phase 2+ surfaces a
// regression.
//
// What we DO test for real (per scenario):
//   - buildIter1Profile (D-1.15.1) committed iter-1 correctly
//   - applyScenarioEdit produces a valid iter-2 text
//   - incrementIteration advances ledger to currentIteration=2
//   - buildPriorAnnotationsForOrchestrator runs with mocked detector,
//     building the Map with correct paragraph-index remap (D-1.7)
//   - The D-1.6.5 landing write-back fires per iter-1 prior move
//   - The carve-out (D-1.15.0) is honored — landing transitions exactly
//     undefined → populated, never any other mutation
//   - Manual iter-2 commit (mirroring orchestrator's commitIterationRecord)
//     produces a structurally valid post-iter-2 ledger
//
// What we mock at the LLM boundary:
//   - detectLanding (vi.mock at landingDetector module level)
//
// Layered assertion pattern (per Tue's diagnosability directive 2026-04-30):
// each `it` asserts in this order so failure level pinpoints the broken
// contract:
//   (1) mock-call-count: were the right number of detector calls made?
//   (2) mock-input-shape: did each call receive the right priorTaughtMove?
//   (3) ledger-shape: top-level structure (iterations.length, currentIteration)
//   (4) ledger-semantic: detailed content (landing populated, IDs preserved,
//       remap applied, decisions reflected)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — must come BEFORE the import that uses it.
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
import { appendCarryForwardDecision } from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import { synthesizeCarryForwardSummary } from '../../src/services/essayIntelligence/analysis/carryForwardSynthesis';
import type {
  CarryForwardDecision,
  IterationRecord,
} from '../../src/services/essayIntelligence/profileTypes';

import {
  D1_15_ESSAY_ID,
  SCENARIO_1_SMALL_EDIT,
  applyScenarioEdit,
  buildLanding,
  expectedEditSignificance,
  expectedIter1MoveIds,
  getEditedParagraphIndices,
  setupIter2,
  splitParagraphs,
} from '../fixtures/d1-15';

const mockDetect = vi.mocked(detectLanding);

// ─── Iter-2 commit timestamps (deterministic, per D-1.15.1 convention) ─

const ITER2_STARTED_AT = '2026-04-30T10:00:00.000Z';
const ITER2_FINISHED_AT = '2026-04-30T10:00:30.000Z';

// ============================================================================
// Scenario 1 — small edit (single-paragraph revision in P2)
// ============================================================================

describe('D-1.15 Scenario 1 — small edit (single-paragraph revision in P2)', () => {
  // [R-4 audit closure 2026-04-30] Default the happy-path mock in beforeEach.
  // Most tests want the canonical "landing addressed" outcome; tests that
  // need a different shape override locally with mockReset + a fresh
  // mockResolvedValue.
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  // ─── Layer 1: mock-call assertions ──────────────────────────────────

  describe('mock surface — landingDetector firing pattern', () => {
    it('detectLanding is called exactly once per iter-1 prior move (3 priors → 3 calls)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // Three iter-1 priors per SCENARIO_1.iter1MoveAnchors → three detector
      // calls. If this asserts a different number, either iter-1 setup
      // produced wrong move count OR priorAnnotationsBuilder's
      // priorIteration filter regressed.
      expect(mockDetect).toHaveBeenCalledTimes(SCENARIO_1_SMALL_EDIT.iter1MoveAnchors.length);
    });

    it('detectLanding receives every iter-1 prior move id (no priors silently dropped)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      const calledMoveIds = mockDetect.mock.calls.map((c) => c[0].priorTaughtMove.id).sort();
      const expectedIds = expectedIter1MoveIds(SCENARIO_1_SMALL_EDIT).sort();
      expect(calledMoveIds).toEqual(expectedIds);
    });
  });

  // ─── Layer 2: priorAnnotations Map shape ────────────────────────────

  describe('priorAnnotations Map population (small_edit on P2: identity remap)', () => {
    it('Map is populated (not undefined) when iter≥2 and priors exist', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      const priors = await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // Map (not undefined) is the iter-2 contract per D-1.8.
      expect(priors).toBeInstanceOf(Map);
    });

    it("Map keys match iter-1 prior moves' paragraph indices unchanged (small_edit ≠ structural change)", async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      const priors = await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // small_edit only revises P2's content — paragraph count unchanged,
      // remap is identity for surviving paragraphs. SCENARIO_1 anchors
      // moves at P0, P2, P3; the Map should have those exact keys.
      expect(priors).toBeInstanceOf(Map);
      const keys = Array.from((priors as Map<number, unknown>).keys()).sort((a, b) => a - b);
      const expectedKeys = SCENARIO_1_SMALL_EDIT.iter1MoveAnchors
        .map((a) => a.paragraphIndex)
        .sort((a, b) => a - b);
      expect(keys).toEqual(expectedKeys);
    });

    it('addressedByEdit=true on every annotation when detector returns "addressed"', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      })) as Map<number, { priorAnnotations: Array<{ addressedByEdit: boolean }> }>;

      for (const [paragraphIdx, ctx] of priors) {
        for (const ann of ctx.priorAnnotations) {
          expect(ann.addressedByEdit, `addressedByEdit at P${paragraphIdx}`).toBe(true);
        }
      }
    });
  });

  // ─── Layer 3: D-1.6.5 landing write-back (the wire under test) ──────

  describe('D-1.6.5 landing write-back (the carve-out producer)', () => {
    it('every iter-1 taughtMove has landing populated post-buildPriorAnnotations', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);

      // Pre-condition: iter-1 setup MUST leave landing undefined (D-1.15.1
      // invariant). If this fails, iter-1 setup regressed.
      for (const move of profile.iterationLedger.taughtMoves) {
        expect(
          move.landing,
          `iter-1 setup leaves landing undefined for move ${move.id}`,
        ).toBeUndefined();
      }

      // Override the default mock with richer content to verify exact
      // pass-through of detector output to the ledger entry.
      mockDetect.mockReset();
      mockDetect.mockResolvedValue(
        buildLanding({
          status: 'addressed',
          confidence: 0.91,
          reasoning: 'student edit substantively addresses the prior teaching move',
          signalsUsed: ['edit_vs_critique'],
        }),
      );

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // Post-condition: every iter-1 prior move now has landing populated
      // with the detector's output + detectedAtIteration === currentIteration.
      // This is the D-1.6.5 wire firing for real.
      // [R-6 audit closure] Per-field assertion messages name the contract
      // under test (D-1.6.5 wire) so a diagnostic regression points at the
      // right deliverable.
      for (const move of profile.iterationLedger.taughtMoves) {
        expect(
          move.landing,
          `move.landing populated for ${move.id} (D-1.6.5 wire)`,
        ).toBeDefined();
        expect(move.landing?.status, `landing.status for ${move.id}`).toBe('addressed');
        expect(move.landing?.confidence, `landing.confidence for ${move.id}`).toBe(0.91);
        expect(
          move.landing?.detectedAtIteration,
          `landing.detectedAtIteration for ${move.id} (must equal currentIteration=2)`,
        ).toBe(2);
        expect(
          move.landing?.signalsUsed,
          `landing.signalsUsed for ${move.id}`,
        ).toEqual(['edit_vs_critique']);
      }
    });

    it('D-1.15.0 carve-out honored: landing transitions exactly once (re-running buildPriorAnnotations on same profile throws)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      // First call populates landing.
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // Second call on the SAME profile (without resetting landing) hits
      // the carve-out throw at priorAnnotationsBuilder.ts:243-263. This
      // protects the invariant: landing transitions undefined → populated
      // exactly once. In production the priorIteration filter prevents
      // re-detection; this test exercises the defense-in-depth throw.
      await expect(
        buildPriorAnnotationsForOrchestrator({
          essayId: D1_15_ESSAY_ID,
          profile,
          currentEssayText: iter2Text,
          editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
        }),
      ).rejects.toThrow(/D-1\.15\.0 carve-out violation/);
    });
  });

  // ─── Layer 4: iter-2 ledger commit + recentDecisions ────────────────

  describe('iter-2 ledger commit (manual mirror of orchestrator commitIterationRecord)', () => {
    it('post-commit ledger: currentIteration=2, iterations.length=2, iter-1 record byte-equal', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      const iter1RecordSnapshot = JSON.parse(
        JSON.stringify(profile.iterationLedger.iterations[0]),
      ) as IterationRecord;

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // Append iter-2's mode-selection decision (D-1.11 contract).
      // [R-9 audit closure] Comprehensive mode: decision='rederive' (full
      // re-compute, not partial_refresh which is for sub-field carry),
      // arbitrationMechanism='comprehensive_rule' (no arbitration — the
      // mode-selection rule forced this; not validity_test or llm_judgment).
      // Per profileTypes.ts:5520-5545.
      const modeSelectionDecision: CarryForwardDecision = {
        iteration: 2,
        itemKey: 'mode_selection',
        decision: 'rederive',
        rationale:
          'iter-2 small_edit on P2 — confidence=initial forces comprehensive (Rule 1); iter-1 priors landing-detected and threaded into L5 prompt context.',
        arbitrationMechanism: 'comprehensive_rule',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0.05,
      };
      appendCarryForwardDecision(profile, modeSelectionDecision);

      // Synthesize iter-2's carryForwardSummary from recentDecisions
      // (mirrors what analysisOrchestrator.commitIterationRecord does at
      // line 2127-2128).
      const summary = synthesizeCarryForwardSummary(
        profile.iterationLedger.recentDecisions,
        2,
      );

      // Push iter-2's IterationRecord. Mirrors commitIterationDirectly's
      // pattern from D-1.10's tests. C-5 closure: omits events,
      // comprehensiveBaselineCost (placeholder 0.5), escalationLevel (0),
      // costBreakdown ({}) — see top-of-file note.
      const iter2Record: IterationRecord = {
        iteration: 2,
        triggeredBy: 'edit',
        editScope: {
          paragraphsChanged: getEditedParagraphIndices(SCENARIO_1_SMALL_EDIT.edit),
          significance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
          changeTypes: [],
          structural: { reordered: false, added: 0, removed: 0 },
        },
        carryForwardSummary: summary,
        costBreakdown: {},
        comprehensiveBaselineCost: 0.5,
        carryForwardSavings: 0,
        escalationLevel: 0,
        rationale: 'iter-2 small_edit comprehensive re-analysis (D-1.15 Scenario 1)',
        startedAt: ITER2_STARTED_AT,
        finishedAt: ITER2_FINISHED_AT,
        snapshotText: iter2Text,
      };
      profile.iterationLedger.iterations.push(iter2Record);

      // ── Assertions ──

      // Top-level shape.
      expect(profile.iterationLedger.currentIteration, 'currentIteration after iter-2 commit').toBe(2);
      expect(profile.iterationLedger.iterations, 'iterations.length after iter-2 commit').toHaveLength(2);

      // Iter-1's record is byte-identical to its pre-commit snapshot
      // (D-1.14 append-only invariant — iterations[] entries are immutable
      // post-commit).
      expect(
        profile.iterationLedger.iterations[0],
        'iter-1 IterationRecord must be byte-identical to pre-commit snapshot (D-1.14 invariant)',
      ).toEqual(iter1RecordSnapshot);

      // Iter-2's record has correct shape.
      expect(
        profile.iterationLedger.iterations[1].iteration,
        'iter-2 IterationRecord.iteration',
      ).toBe(2);
      expect(
        profile.iterationLedger.iterations[1].triggeredBy,
        'iter-2 triggeredBy (edit, not first_pass)',
      ).toBe('edit');
      expect(
        profile.iterationLedger.iterations[1].snapshotText,
        'iter-2 snapshotText (post-edit essay text)',
      ).toBe(iter2Text);
      expect(
        profile.iterationLedger.iterations[1].editScope?.paragraphsChanged,
        'iter-2 editScope.paragraphsChanged (Scenario 1: only P2)',
      ).toEqual([2]);
      expect(
        profile.iterationLedger.iterations[1].editScope?.significance,
        'iter-2 editScope.significance (small_edit → minor)',
      ).toBe('minor');

      // [R-7 audit closure] Ordering invariant — iter-2 must be timestamped
      // strictly after iter-1. Without this assertion, the ITER1_/ITER2_*
      // constants would be inert. With it, a future regression where iter-2
      // gets stamped with iter-1's timestamps (or earlier) is caught.
      expect(
        profile.iterationLedger.iterations[1].startedAt > profile.iterationLedger.iterations[0].startedAt,
        'iter-2.startedAt must be strictly after iter-1.startedAt',
      ).toBe(true);
    });

    it('recentDecisions reflects iter-2: appended mode_selection decision visible', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // Pre-condition: recentDecisions empty (iter-1 first-pass has no
      // decisions; iter-2 hasn't appended yet).
      expect(profile.iterationLedger.recentDecisions).toHaveLength(0);

      const decision: CarryForwardDecision = {
        iteration: 2,
        itemKey: 'mode_selection',
        decision: 'rederive',
        rationale: 'iter-2 mode selection (comprehensive)',
        arbitrationMechanism: 'comprehensive_rule',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0.05,
      };
      appendCarryForwardDecision(profile, decision);

      expect(profile.iterationLedger.recentDecisions).toHaveLength(1);
      expect(profile.iterationLedger.recentDecisions[0].iteration).toBe(2);
      expect(profile.iterationLedger.recentDecisions[0].itemKey).toBe('mode_selection');
      expect(profile.iterationLedger.recentDecisions[0].decision).toBe('rederive');
      expect(profile.iterationLedger.recentDecisions[0].arbitrationMechanism).toBe(
        'comprehensive_rule',
      );
    });

    it('iter-1 taughtMoves preserved through iter-2 commit (D-1.14 append-only)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_1_SMALL_EDIT);
      const iter1MoveIdsBefore = profile.iterationLedger.taughtMoves.map((m) => m.id);

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_1_SMALL_EDIT.edit),
      });

      // After iter-2's priorAnnotations + commit, iter-1's taughtMove IDs
      // are the same first N entries — append-only with the D-1.15.0
      // landing carve-out for the landing field only.
      const iter1MoveIdsAfter = profile.iterationLedger.taughtMoves
        .slice(0, iter1MoveIdsBefore.length)
        .map((m) => m.id);
      expect(iter1MoveIdsAfter).toEqual(iter1MoveIdsBefore);

      // taughtAtIteration unchanged for iter-1 priors.
      for (const move of profile.iterationLedger.taughtMoves) {
        expect(move.taughtAtIteration).toBe(1);
      }
    });
  });

  // ─── Layer 5: structural validation of the complete iter-2 picture ──

  describe('iter-2 essay text and paragraph structure', () => {
    it('iter-2 essay text differs from iter-1 only at the edited paragraph (P2)', () => {
      const iter2Text = applyScenarioEdit(SCENARIO_1_SMALL_EDIT.essayText, SCENARIO_1_SMALL_EDIT.edit);
      const iter1Paras = splitParagraphs(SCENARIO_1_SMALL_EDIT.essayText);
      const iter2Paras = splitParagraphs(iter2Text);

      expect(iter2Paras).toHaveLength(iter1Paras.length);
      for (let i = 0; i < iter1Paras.length; i++) {
        if (i === 2) {
          // The edited paragraph differs.
          expect(iter2Paras[i]).not.toBe(iter1Paras[i]);
        } else {
          // Other paragraphs unchanged.
          expect(iter2Paras[i], `paragraph ${i} unchanged`).toBe(iter1Paras[i]);
        }
      }
    });
  });
});
