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
  SCENARIO_2_STRUCTURAL_REORDER,
  SCENARIO_3_PARAGRAPH_DELETE,
  SCENARIO_4_PARAGRAPH_INSERT,
  SCENARIO_5_MULTI_PARAGRAPH_CASCADE,
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

// ============================================================================
// Scenario 2 — structural reorder (P1 ↔ P2 swap)
// ============================================================================
//
// Tests the **paragraph remap** wire (D-1.7). Iter-1 has moves on P0/P1/P2/P3
// (all 4 paragraphs, max remap coverage). Iter-2 swaps P1 ↔ P2.
// paragraphRemapBuilder uses content-hash matching: identical text matches
// at any position, so the swap is detected as:
//   - 0 → 0 (P0 identity)
//   - 1 → 2 (iter-1's P1 content now lives at iter-2's P2)
//   - 2 → 1 (iter-1's P2 content now lives at iter-2's P1)
//   - 3 → 3 (P3 identity)
// The Map keys post-remap should be {0, 1, 2, 3} (sorted) but the iter-1
// move from P1 must land at iter-2 Map key 2, and the iter-1 move from P2
// must land at iter-2 Map key 1. This swap is what Scenario 2 specifically
// verifies — annotation content is per-paragraph-unique (P0/P1/P2/P3
// embedded in content per buildIter1L5Annotations) so the test can pinpoint
// which iter-1 source landed at which iter-2 slot.

describe('D-1.15 Scenario 2 — structural reorder (P1 ↔ P2 swap)', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  // ─── Layer 1: mock-call assertions ──────────────────────────────────

  describe('mock surface — landingDetector firing pattern', () => {
    it('detectLanding is called once per iter-1 prior move (4 priors → 4 calls)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      });
      // SCENARIO_2 anchors 4 moves (one per paragraph). Reorder doesn't
      // drop any prior — all 4 detector calls expected.
      expect(mockDetect).toHaveBeenCalledTimes(SCENARIO_2_STRUCTURAL_REORDER.iter1MoveAnchors.length);
    });

    it('detectLanding receives every iter-1 prior move id (no priors silently dropped during remap)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      });
      const calledMoveIds = mockDetect.mock.calls.map((c) => c[0].priorTaughtMove.id).sort();
      const expectedIds = expectedIter1MoveIds(SCENARIO_2_STRUCTURAL_REORDER).sort();
      expect(calledMoveIds).toEqual(expectedIds);
    });
  });

  // ─── Layer 2: priorAnnotations Map shape (THE remap wire under test) ─

  describe('priorAnnotations Map population (paragraph remap: 1↔2 swap)', () => {
    it('Map keys span the full set of iter-2 paragraph indices (4 keys: 0-3)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      const keys = Array.from(priors.keys()).sort((a, b) => a - b);
      // No drops, no duplicates — every iter-1 move lands at exactly one
      // iter-2 paragraph slot.
      expect(keys).toEqual([0, 1, 2, 3]);
    });

    it('iter-1 P1 move lands at iter-2 Map key 2 (swap target); iter-1 P2 move lands at key 1', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      // iter-1's P1 move (content embeds "anchor at P1") should land at
      // iter-2 Map key 2 because P1's content is now at index 2 post-swap.
      const atKey1 = priors.get(1)?.priorAnnotations ?? [];
      const atKey2 = priors.get(2)?.priorAnnotations ?? [];
      expect(atKey1).toHaveLength(1);
      expect(atKey2).toHaveLength(1);
      // Content distinguishability proves which iter-1 source landed where.
      expect(
        atKey2[0].content,
        'iter-2 Map key 2 should hold iter-1 P1 source (P1 content moved to index 2)',
      ).toMatch(/anchor at P1/);
      expect(
        atKey1[0].content,
        'iter-2 Map key 1 should hold iter-1 P2 source (P2 content moved to index 1)',
      ).toMatch(/anchor at P2/);
    });

    it('identity-remapped paragraphs (P0, P3) keep their iter-1 sources at the same key', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      const atKey0 = priors.get(0)?.priorAnnotations ?? [];
      const atKey3 = priors.get(3)?.priorAnnotations ?? [];
      expect(atKey0[0].content).toMatch(/anchor at P0/);
      expect(atKey3[0].content).toMatch(/anchor at P3/);
    });
  });

  // ─── Layer 3: D-1.6.5 landing write-back across the remap ───────────

  describe('D-1.6.5 landing write-back (every prior gets landing populated even after remap)', () => {
    it('every iter-1 taughtMove has landing populated post-remap', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);

      for (const move of profile.iterationLedger.taughtMoves) {
        expect(move.landing, `pre-condition: move.landing undefined for ${move.id}`).toBeUndefined();
      }

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      });

      for (const move of profile.iterationLedger.taughtMoves) {
        expect(
          move.landing,
          `move.landing populated for ${move.id} post-reorder (D-1.6.5 wire)`,
        ).toBeDefined();
        expect(move.landing?.detectedAtIteration).toBe(2);
      }
    });
  });

  // ─── Layer 4: iter-2 commit shape captures the structural reorder ───

  describe('iter-2 commit shape reflects structural reorder', () => {
    it('iter-2 IterationRecord.editScope.structural.reordered === true; paragraphsChanged covers swapped indices', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_2_STRUCTURAL_REORDER);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
      });

      const decision: CarryForwardDecision = {
        iteration: 2,
        itemKey: 'mode_selection',
        decision: 'rederive',
        rationale:
          'iter-2 structural_reorder — Rule 3 (paragraphs reordered) forces comprehensive.',
        arbitrationMechanism: 'comprehensive_rule',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0.05,
      };
      appendCarryForwardDecision(profile, decision);
      const summary = synthesizeCarryForwardSummary(
        profile.iterationLedger.recentDecisions,
        2,
      );

      const iter2Record: IterationRecord = {
        iteration: 2,
        triggeredBy: 'edit',
        editScope: {
          paragraphsChanged: getEditedParagraphIndices(SCENARIO_2_STRUCTURAL_REORDER.edit),
          significance: expectedEditSignificance(SCENARIO_2_STRUCTURAL_REORDER.edit),
          changeTypes: [],
          // Structural reorder: reordered=true; no paragraphs added or
          // removed (count unchanged).
          structural: { reordered: true, added: 0, removed: 0 },
        },
        carryForwardSummary: summary,
        costBreakdown: {},
        comprehensiveBaselineCost: 0.5,
        carryForwardSavings: 0,
        escalationLevel: 0,
        rationale: 'iter-2 structural_reorder comprehensive re-analysis (D-1.15 Scenario 2)',
        startedAt: ITER2_STARTED_AT,
        finishedAt: ITER2_FINISHED_AT,
        snapshotText: iter2Text,
      };
      profile.iterationLedger.iterations.push(iter2Record);

      expect(profile.iterationLedger.iterations).toHaveLength(2);
      expect(profile.iterationLedger.iterations[1].editScope?.structural.reordered).toBe(true);
      expect(profile.iterationLedger.iterations[1].editScope?.paragraphsChanged.sort()).toEqual([1, 2]);
      expect(profile.iterationLedger.iterations[1].editScope?.significance).toBe('significant');
    });
  });

  // ─── Layer 5: structural validation of the iter-2 essay text ────────

  describe('iter-2 essay text reflects the swap', () => {
    it('iter-2 P1 content equals iter-1 P2 content (and vice versa); P0 and P3 unchanged', () => {
      const iter2Text = applyScenarioEdit(
        SCENARIO_2_STRUCTURAL_REORDER.essayText,
        SCENARIO_2_STRUCTURAL_REORDER.edit,
      );
      const iter1Paras = splitParagraphs(SCENARIO_2_STRUCTURAL_REORDER.essayText);
      const iter2Paras = splitParagraphs(iter2Text);

      expect(iter2Paras).toHaveLength(iter1Paras.length);
      expect(iter2Paras[0], 'P0 unchanged').toBe(iter1Paras[0]);
      expect(iter2Paras[1], 'iter-2 P1 = iter-1 P2 (swap)').toBe(iter1Paras[2]);
      expect(iter2Paras[2], 'iter-2 P2 = iter-1 P1 (swap)').toBe(iter1Paras[1]);
      expect(iter2Paras[3], 'P3 unchanged').toBe(iter1Paras[3]);
    });
  });
});

// ============================================================================
// Scenario 3 — paragraph delete (P2 removed)
// ============================================================================
//
// Tests the **drop-on-delete** path of priorAnnotationsBuilder. UCB
// cell-tower essay has 5 paragraphs; iter-1 has moves on P0/P2/P4. Iter-2
// deletes P2.
//
// Expected post-delete remap:
//   - old 0 → new 0 (identity)
//   - old 1 → new 1 (identity)
//   - old 2 → DROPPED (paragraph_deleted) — D-1.7 round-2 LOW-1 closure
//   - old 3 → new 2 (shift down)
//   - old 4 → new 3 (shift down)
//
// Effect on iter-1 priors:
//   - P0 move: lands at iter-2 Map key 0 (identity), landing populated
//   - P2 move: DROPPED before detection (priorAnnotationsBuilder.ts:200-213
//     drop-on-deleted-paragraph branch) — landing stays undefined per
//     the D-1.6.5 contract verified in d1-8 tests case (iii)
//   - P4 move: lands at iter-2 Map key 3 (shifted), landing populated
//
// Detector call count: 2 (not 3) — the dropped move skips detection.

describe('D-1.15 Scenario 3 — paragraph delete (P2 removed)', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  // ─── Layer 1: mock-call assertions (drop bypasses detector) ─────────

  describe('mock surface — landingDetector NOT called for dropped paragraph', () => {
    it('detectLanding called 2 times (3 priors with 1 dropped → 2 detections)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_3_PARAGRAPH_DELETE);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
      });
      // SCENARIO_3 anchors 3 moves at P0/P2/P4. P2 is deleted in iter-2,
      // so its move drops before detection. Expected: 2 calls.
      expect(mockDetect).toHaveBeenCalledTimes(2);
    });

    it('detectLanding receives ONLY the surviving (non-dropped) iter-1 prior move ids', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_3_PARAGRAPH_DELETE);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
      });
      // The dropped move's id should NOT be in the called set. The
      // surviving moves are at P0 and P4 (per SCENARIO_3.iter1MoveAnchors
      // ordering: index 0 = P0, index 1 = P2 (dropped), index 2 = P4).
      const allExpectedIds = expectedIter1MoveIds(SCENARIO_3_PARAGRAPH_DELETE);
      const survivingIds = [allExpectedIds[0], allExpectedIds[2]].sort();
      const droppedId = allExpectedIds[1];
      const calledMoveIds = mockDetect.mock.calls.map((c) => c[0].priorTaughtMove.id).sort();
      expect(calledMoveIds).toEqual(survivingIds);
      expect(calledMoveIds).not.toContain(droppedId);
    });
  });

  // ─── Layer 2: priorAnnotations Map — drop semantics ─────────────────

  describe('priorAnnotations Map (drop on deleted paragraph; surviving moves shift)', () => {
    it('Map size === 2 (one entry per surviving prior; dropped move absent)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_3_PARAGRAPH_DELETE);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;
      expect(priors.size).toBe(2);
    });

    it('Map keys reflect post-delete index shift: P0 stays at 0; P4 shifts to 3', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_3_PARAGRAPH_DELETE);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      const keys = Array.from(priors.keys()).sort((a, b) => a - b);
      // P0 → 0 (identity); P2 → DROPPED; P4 → 3 (because P2's removal
      // shifts everything from old-P3 onward down by 1).
      expect(keys).toEqual([0, 3]);

      // Content distinguishability — the iter-1 P0 source landed at key 0;
      // iter-1 P4 source landed at key 3.
      expect(priors.get(0)?.priorAnnotations[0].content).toMatch(/anchor at P0/);
      expect(priors.get(3)?.priorAnnotations[0].content).toMatch(/anchor at P4/);
    });
  });

  // ─── Layer 3: D-1.6.5 landing write-back (drop = no detection = undefined) ─

  describe('D-1.6.5 landing write-back semantics under drop', () => {
    it('surviving iter-1 moves get landing populated; dropped move stays undefined', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_3_PARAGRAPH_DELETE);
      const allMoveIds = expectedIter1MoveIds(SCENARIO_3_PARAGRAPH_DELETE);
      const droppedMoveId = allMoveIds[1]; // SCENARIO_3.iter1MoveAnchors[1] is P2.

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
      });

      for (const move of profile.iterationLedger.taughtMoves) {
        if (move.id === droppedMoveId) {
          // Dropped move: drop happens at priorAnnotationsBuilder.ts:200-213
          // BEFORE the detector call site at line 221. Detector never runs
          // for this move; landing stays undefined.
          expect(
            move.landing,
            `dropped move ${move.id} (P2) landing must remain undefined (drop = no detection)`,
          ).toBeUndefined();
        } else {
          // Surviving moves: detector runs, landing populated by D-1.6.5
          // wire.
          expect(
            move.landing,
            `surviving move ${move.id} landing populated post-iter-2 (D-1.6.5 wire)`,
          ).toBeDefined();
          expect(move.landing?.detectedAtIteration).toBe(2);
        }
      }
    });
  });

  // ─── Layer 4: iter-2 commit shape captures the deletion ─────────────

  describe('iter-2 commit shape reflects paragraph deletion', () => {
    it('iter-2 IterationRecord.editScope.structural.removed === 1; paragraphsChanged covers deleted index', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_3_PARAGRAPH_DELETE);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
      });

      const decision: CarryForwardDecision = {
        iteration: 2,
        itemKey: 'mode_selection',
        decision: 'rederive',
        rationale:
          'iter-2 paragraph_delete — Rule 4 (paragraph removed) forces comprehensive.',
        arbitrationMechanism: 'comprehensive_rule',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0.05,
      };
      appendCarryForwardDecision(profile, decision);
      const summary = synthesizeCarryForwardSummary(
        profile.iterationLedger.recentDecisions,
        2,
      );

      const iter2Record: IterationRecord = {
        iteration: 2,
        triggeredBy: 'edit',
        editScope: {
          paragraphsChanged: getEditedParagraphIndices(SCENARIO_3_PARAGRAPH_DELETE.edit),
          significance: expectedEditSignificance(SCENARIO_3_PARAGRAPH_DELETE.edit),
          changeTypes: [],
          // Paragraph deleted: removed=1, added=0, reordered=false.
          structural: { reordered: false, added: 0, removed: 1 },
        },
        carryForwardSummary: summary,
        costBreakdown: {},
        comprehensiveBaselineCost: 0.5,
        carryForwardSavings: 0,
        escalationLevel: 0,
        rationale: 'iter-2 paragraph_delete comprehensive re-analysis (D-1.15 Scenario 3)',
        startedAt: ITER2_STARTED_AT,
        finishedAt: ITER2_FINISHED_AT,
        snapshotText: iter2Text,
      };
      profile.iterationLedger.iterations.push(iter2Record);

      expect(profile.iterationLedger.iterations).toHaveLength(2);
      expect(profile.iterationLedger.iterations[1].editScope?.structural.removed).toBe(1);
      expect(profile.iterationLedger.iterations[1].editScope?.structural.added).toBe(0);
      expect(profile.iterationLedger.iterations[1].editScope?.paragraphsChanged).toEqual([2]);
    });
  });

  // ─── Layer 5: structural validation of the iter-2 essay text ────────

  describe('iter-2 essay text reflects the deletion', () => {
    it('iter-2 has paragraph count = iter-1 - 1; deleted paragraph absent', () => {
      const iter2Text = applyScenarioEdit(
        SCENARIO_3_PARAGRAPH_DELETE.essayText,
        SCENARIO_3_PARAGRAPH_DELETE.edit,
      );
      const iter1Paras = splitParagraphs(SCENARIO_3_PARAGRAPH_DELETE.essayText);
      const iter2Paras = splitParagraphs(iter2Text);

      expect(iter2Paras).toHaveLength(iter1Paras.length - 1);
      // The deleted paragraph (iter-1 P2) is gone from iter-2 entirely.
      expect(iter2Paras).not.toContain(iter1Paras[2]);
      // iter-1 P0 and P1 remain at indices 0 and 1.
      expect(iter2Paras[0]).toBe(iter1Paras[0]);
      expect(iter2Paras[1]).toBe(iter1Paras[1]);
      // iter-1 P3 and P4 shift down by 1.
      expect(iter2Paras[2]).toBe(iter1Paras[3]);
      expect(iter2Paras[3]).toBe(iter1Paras[4]);
    });
  });
});

// ============================================================================
// Scenario 4 — paragraph insert (new paragraph between P1 and P2)
// ============================================================================
//
// Tests the **shift-on-insert** path of priorAnnotationsBuilder. Harvard
// MITES essay (4 paragraphs); iter-1 has moves on P1 and P2. Iter-2
// inserts a new bridge paragraph AFTER P1 (so the new paragraph becomes
// iter-2 index 2; existing P2 shifts to P3, P3 shifts to P4).
//
// Expected post-insert remap (paragraphRemapBuilder hash-positional matching):
//   - old 0 → new 0 (identity)
//   - old 1 → new 1 (identity — insertion is AFTER P1, so P1 keeps position)
//   - old 2 → new 3 (shifted +1 by the inserted paragraph)
//   - old 3 → new 4 (shifted +1)
//   - new 2 (the inserted bridge) → has no old counterpart; not in the remap
//
// Effect on iter-1 priors:
//   - P1 move: lands at iter-2 Map key 1 (identity), landing populated
//   - P2 move: lands at iter-2 Map key 3 (shifted +1), landing populated
//   - The new iter-2 P2 (the bridge) has NO priorAnnotations entry (no
//     iter-1 history exists for that paragraph)

describe('D-1.15 Scenario 4 — paragraph insert (new bridge between P1 and P2)', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  // ─── Layer 1: mock-call assertions ──────────────────────────────────

  describe('mock surface — landingDetector firing pattern (no insert phantom calls)', () => {
    it('detectLanding called once per iter-1 prior move (2 priors → 2 calls; new paragraph adds no detection)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      });
      // SCENARIO_4 anchors 2 moves at P1, P2. The inserted paragraph has
      // no iter-1 history → no detection. Expected: 2 calls.
      expect(mockDetect).toHaveBeenCalledTimes(2);
    });

    it('detectLanding receives every iter-1 prior move id (no priors silently dropped on insert)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      });
      const calledMoveIds = mockDetect.mock.calls.map((c) => c[0].priorTaughtMove.id).sort();
      const expectedIds = expectedIter1MoveIds(SCENARIO_4_PARAGRAPH_INSERT).sort();
      expect(calledMoveIds).toEqual(expectedIds);
    });
  });

  // ─── Layer 2: priorAnnotations Map — shift semantics + new-paragraph absence ─

  describe('priorAnnotations Map (shift-on-insert; new paragraph has no entry)', () => {
    it('Map size === 2 (one per surviving prior; inserted paragraph absent)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;
      expect(priors.size).toBe(2);
    });

    it('Map keys reflect post-insert index shift: P1 stays at 1; P2 shifts to 3', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      const keys = Array.from(priors.keys()).sort((a, b) => a - b);
      // P1 → 1 (identity, insertion is AFTER P1); P2 → 3 (shifted by +1).
      expect(keys).toEqual([1, 3]);

      // Content distinguishability — iter-1 P1 source landed at key 1;
      // iter-1 P2 source landed at key 3.
      expect(priors.get(1)?.priorAnnotations[0].content).toMatch(/anchor at P1/);
      expect(priors.get(3)?.priorAnnotations[0].content).toMatch(/anchor at P2/);
    });

    it('inserted paragraph (iter-2 index 2) has NO priorAnnotations entry (no iter-1 history)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      // The inserted paragraph (now at iter-2 P2, the "bridge") has no
      // iter-1 ancestor — no Map entry exists for it. Verify the
      // structural absence: get(2) returns undefined.
      expect(
        priors.get(2),
        'inserted iter-2 P2 (the bridge paragraph) must have no priorAnnotations entry — no history exists',
      ).toBeUndefined();
    });
  });

  // ─── Layer 3: D-1.6.5 landing write-back (every surviving move populated) ─

  describe('D-1.6.5 landing write-back (every iter-1 move gets landing populated post-insert)', () => {
    it('both iter-1 taughtMoves have landing populated post-insert', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);

      for (const move of profile.iterationLedger.taughtMoves) {
        expect(move.landing).toBeUndefined();
      }

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      });

      for (const move of profile.iterationLedger.taughtMoves) {
        expect(
          move.landing,
          `move.landing populated for ${move.id} post-insert (D-1.6.5 wire)`,
        ).toBeDefined();
        expect(move.landing?.detectedAtIteration).toBe(2);
      }
    });
  });

  // ─── Layer 4: iter-2 commit shape captures the insertion ────────────

  describe('iter-2 commit shape reflects paragraph insertion', () => {
    it('iter-2 IterationRecord.editScope.structural.added === 1; paragraphsChanged covers insert anchor', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_4_PARAGRAPH_INSERT);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
      });

      const decision: CarryForwardDecision = {
        iteration: 2,
        itemKey: 'mode_selection',
        decision: 'rederive',
        rationale:
          'iter-2 paragraph_insert — Rule 4 (paragraph added) forces comprehensive.',
        arbitrationMechanism: 'comprehensive_rule',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0.05,
      };
      appendCarryForwardDecision(profile, decision);
      const summary = synthesizeCarryForwardSummary(
        profile.iterationLedger.recentDecisions,
        2,
      );

      const iter2Record: IterationRecord = {
        iteration: 2,
        triggeredBy: 'edit',
        editScope: {
          paragraphsChanged: getEditedParagraphIndices(SCENARIO_4_PARAGRAPH_INSERT.edit),
          significance: expectedEditSignificance(SCENARIO_4_PARAGRAPH_INSERT.edit),
          changeTypes: [],
          // Paragraph inserted: added=1, removed=0, reordered=false.
          structural: { reordered: false, added: 1, removed: 0 },
        },
        carryForwardSummary: summary,
        costBreakdown: {},
        comprehensiveBaselineCost: 0.5,
        carryForwardSavings: 0,
        escalationLevel: 0,
        rationale: 'iter-2 paragraph_insert comprehensive re-analysis (D-1.15 Scenario 4)',
        startedAt: ITER2_STARTED_AT,
        finishedAt: ITER2_FINISHED_AT,
        snapshotText: iter2Text,
      };
      profile.iterationLedger.iterations.push(iter2Record);

      expect(profile.iterationLedger.iterations).toHaveLength(2);
      expect(profile.iterationLedger.iterations[1].editScope?.structural.added).toBe(1);
      expect(profile.iterationLedger.iterations[1].editScope?.structural.removed).toBe(0);
      // paragraphsChanged for paragraph_insert = [insertAfterIndex] per
      // getEditedParagraphIndices. SCENARIO_4 has insertAfterIndex=1.
      expect(profile.iterationLedger.iterations[1].editScope?.paragraphsChanged).toEqual([1]);
    });
  });

  // ─── Layer 5: structural validation of the iter-2 essay text ────────

  describe('iter-2 essay text reflects the insertion', () => {
    it('iter-2 paragraph count = iter-1 + 1; bridge paragraph at index 2; existing paragraphs shifted', () => {
      const iter2Text = applyScenarioEdit(
        SCENARIO_4_PARAGRAPH_INSERT.essayText,
        SCENARIO_4_PARAGRAPH_INSERT.edit,
      );
      const iter1Paras = splitParagraphs(SCENARIO_4_PARAGRAPH_INSERT.essayText);
      const iter2Paras = splitParagraphs(iter2Text);

      expect(iter2Paras).toHaveLength(iter1Paras.length + 1);
      // P0, P1 stay at 0, 1.
      expect(iter2Paras[0]).toBe(iter1Paras[0]);
      expect(iter2Paras[1]).toBe(iter1Paras[1]);
      // P2 in iter-2 is the inserted bridge.
      if (SCENARIO_4_PARAGRAPH_INSERT.edit.kind === 'paragraph_insert') {
        expect(iter2Paras[2]).toBe(SCENARIO_4_PARAGRAPH_INSERT.edit.newParagraphText);
      }
      // iter-1 P2 and P3 shifted to iter-2 P3 and P4.
      expect(iter2Paras[3]).toBe(iter1Paras[2]);
      expect(iter2Paras[4]).toBe(iter1Paras[3]);
    });
  });
});

// ============================================================================
// Scenario 5 — multi-paragraph cascade (surgical voice-preserving improvements)
// ============================================================================
//
// Tests the **multi-survivor cascade** of priorAnnotationsBuilder under
// realistic product behavior. UCLA cancer-awareness essay (4 paragraphs);
// iter-1 has moves on every paragraph (P0/P1/P2/P3). Iter-2 applies
// surgical 1-sentence-per-paragraph improvements to P0, P2, P3 — the
// kind of coaching-style edit the system actually encourages
// (specificity, concrete sensory detail, sharper verbs, tightening
// grammatical messes). P1 unchanged.
//
// ─── Edit shape (D-1.15.6a ratification 2026-04-30) ─────────────────────
//
// Per Tue's product-direction clarification (2026-04-30): the system
// tests improvement paths that PRESERVE voice and authentic meaning, not
// full-paragraph rewrites. Each iter-2 edit modifies one sentence per
// paragraph; the surrounding text is preserved verbatim. This:
//   (i) reflects realistic student-system interaction — a coach surfaces
//       a teaching point, the student tightens one sentence in response.
//   (ii) keeps overlap-ratio well above the 0.30 threshold defined at
//        editUnderstandingService.ts:374, so computeEditDiff classifies
//        each as `modified` rather than remove+add.
//   (iii) lets paragraphRemapBuilder thread all 4 iter-1 priors through
//        to iter-2 with identity remap (0→0, 1→1, 2→2, 3→3); zero drops.
//
// Effect on iter-1 priors:
//   - P0 move: lands at iter-2 Map key 0 (modified, identity remap), landing populated
//   - P1 move: lands at iter-2 Map key 1 (unchanged, identity remap), landing populated
//   - P2 move: lands at iter-2 Map key 2 (modified, identity remap), landing populated
//   - P3 move: lands at iter-2 Map key 3 (modified, identity remap), landing populated
//
// This exercises the multi-survivor cascade carry-forward arbitration
// spine: 4 surviving priors, 4 simultaneous landing detections, full
// iter-2 commit shape with editScope.paragraphsChanged covering [0,2,3].
// The cascade pressure here is on the *landing-detection wire* (4
// detectors fire, all results threaded back to source moves via D-1.6.5),
// NOT the drop-wire (which Scenario 3's paragraph_delete already covers
// at the dedicated drop-on-deletion path).
//
// **Threshold coupling note:** if a future deliverable tunes the 0.30
// constant in editUnderstandingService.ts:374, the modified-vs-add+remove
// boundary shifts. The assertions below pin Map size === 4 + detectLanding
// called 4 times as deliberate threshold sentinels. If those flip to
// Map size === 1 + 1 detection, that signals the surgical edits crossed
// below the new threshold — at which point the FIXTURE's edit shape
// needs gentling (smaller surgical changes), not the test's behavior.

describe('D-1.15 Scenario 5 — multi-paragraph cascade (surgical voice-preserving improvements)', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockDetect.mockResolvedValue(buildLanding({ status: 'addressed' }));
  });

  // ─── Layer 1: mock-call assertions (4 surviving priors → 4 detections) ─

  describe('mock surface — landingDetector firing on every surviving prior', () => {
    it('detectLanding called 4 times (all 4 iter-1 priors survive the surgical-edit cascade)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_5_MULTI_PARAGRAPH_CASCADE);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
      });
      // Surgical 1-sentence-per-paragraph improvements preserve overlap
      // > 0.30 → all 4 iter-1 priors classified `modified` and survive
      // into iter-2 priorAnnotations Map. Expected: 4 calls.
      expect(mockDetect).toHaveBeenCalledTimes(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.iter1MoveAnchors.length);
    });

    it('detectLanding receives every iter-1 prior move id (multi-survivor cascade)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_5_MULTI_PARAGRAPH_CASCADE);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
      });
      const calledMoveIds = mockDetect.mock.calls.map((c) => c[0].priorTaughtMove.id).sort();
      const expectedIds = expectedIter1MoveIds(SCENARIO_5_MULTI_PARAGRAPH_CASCADE).sort();
      expect(calledMoveIds).toEqual(expectedIds);
    });
  });

  // ─── Layer 2: priorAnnotations Map — all 4 priors survive ───────────

  describe('priorAnnotations Map (multi-survivor cascade: all 4 priors thread through)', () => {
    it('Map size === 4 (all surviving priors at identity-remapped keys)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_5_MULTI_PARAGRAPH_CASCADE);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;
      expect(priors.size).toBe(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.iter1MoveAnchors.length);
    });

    it('Map keys span the full set of iter-2 paragraph indices (identity remap: 0,1,2,3)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_5_MULTI_PARAGRAPH_CASCADE);
      const priors = (await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
      })) as Map<number, { priorAnnotations: Array<{ content: string }> }>;

      const keys = Array.from(priors.keys()).sort((a, b) => a - b);
      expect(keys).toEqual([0, 1, 2, 3]);

      // Content distinguishability — each iter-1 source landed at its
      // identity-remapped iter-2 key (no swap, no drop, no shift).
      expect(priors.get(0)?.priorAnnotations[0].content).toMatch(/anchor at P0/);
      expect(priors.get(1)?.priorAnnotations[0].content).toMatch(/anchor at P1/);
      expect(priors.get(2)?.priorAnnotations[0].content).toMatch(/anchor at P2/);
      expect(priors.get(3)?.priorAnnotations[0].content).toMatch(/anchor at P3/);
    });
  });

  // ─── Layer 3: D-1.6.5 landing — every surviving move populated ──────

  describe('D-1.6.5 landing write-back (every iter-1 move gets landing populated post-cascade)', () => {
    it('all 4 iter-1 taughtMoves have landing populated post-cascade (4 simultaneous detections)', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_5_MULTI_PARAGRAPH_CASCADE);

      for (const move of profile.iterationLedger.taughtMoves) {
        expect(
          move.landing,
          `pre-condition: move.landing undefined for ${move.id}`,
        ).toBeUndefined();
      }

      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
      });

      // Multi-survivor cascade: every iter-1 prior gets landing populated
      // by D-1.6.5 wire. The cascade pressure here is on the
      // landing-detection wire (4 detectors fire, all results threaded
      // back to source moves), not the drop-wire.
      for (const move of profile.iterationLedger.taughtMoves) {
        expect(
          move.landing,
          `move.landing populated for ${move.id} post-cascade (D-1.6.5 wire)`,
        ).toBeDefined();
        expect(
          move.landing?.detectedAtIteration,
          `landing.detectedAtIteration for ${move.id}`,
        ).toBe(2);
      }
    });
  });

  // ─── Layer 4: iter-2 commit shape captures the cascade ──────────────

  describe('iter-2 commit shape reflects multi-paragraph cascade', () => {
    it('iter-2 IterationRecord captures the cascade — paragraphsChanged covers 3 indices, significance=transformative', async () => {
      const { profile, iter2Text } = setupIter2(SCENARIO_5_MULTI_PARAGRAPH_CASCADE);
      await buildPriorAnnotationsForOrchestrator({
        essayId: D1_15_ESSAY_ID,
        profile,
        currentEssayText: iter2Text,
        editSignificance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
      });

      const decision: CarryForwardDecision = {
        iteration: 2,
        itemKey: 'mode_selection',
        decision: 'rederive',
        rationale:
          'iter-2 multi_paragraph_cascade (surgical voice-preserving) — Rule 5 (transformative AND >2 paragraphs changed) forces comprehensive.',
        arbitrationMechanism: 'comprehensive_rule',
        costSavedIfCarry: 0,
        costSpentIfRederive: 0.05,
      };
      appendCarryForwardDecision(profile, decision);
      const summary = synthesizeCarryForwardSummary(
        profile.iterationLedger.recentDecisions,
        2,
      );

      // Cascade structural for surgical voice-preserving edits: paragraph
      // count is preserved (4 in, 4 out — no net add/remove). The
      // `paragraphChanges` array classifies each edited paragraph as
      // `modified`. So structural.{added,removed} are 0 (count semantics:
      // net change in paragraph count). reordered=false (identity remap).
      const iter2Record: IterationRecord = {
        iteration: 2,
        triggeredBy: 'edit',
        editScope: {
          paragraphsChanged: getEditedParagraphIndices(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
          significance: expectedEditSignificance(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit),
          changeTypes: [],
          structural: { reordered: false, added: 0, removed: 0 },
        },
        carryForwardSummary: summary,
        costBreakdown: {},
        comprehensiveBaselineCost: 0.5,
        carryForwardSavings: 0,
        escalationLevel: 0,
        rationale: 'iter-2 multi_paragraph_cascade comprehensive re-analysis (D-1.15 Scenario 5)',
        startedAt: ITER2_STARTED_AT,
        finishedAt: ITER2_FINISHED_AT,
        snapshotText: iter2Text,
      };
      profile.iterationLedger.iterations.push(iter2Record);

      expect(profile.iterationLedger.iterations).toHaveLength(2);
      expect(profile.iterationLedger.iterations[1].editScope?.paragraphsChanged.sort((a, b) => a - b)).toEqual([0, 2, 3]);
      expect(profile.iterationLedger.iterations[1].editScope?.significance).toBe('transformative');
    });
  });

  // ─── Layer 5: structural validation of the iter-2 essay text ────────

  describe('iter-2 essay text reflects the cascade', () => {
    it('iter-2 P0/P2/P3 differ from iter-1; P1 unchanged; paragraph count preserved', () => {
      const iter2Text = applyScenarioEdit(
        SCENARIO_5_MULTI_PARAGRAPH_CASCADE.essayText,
        SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit,
      );
      const iter1Paras = splitParagraphs(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.essayText);
      const iter2Paras = splitParagraphs(iter2Text);

      expect(iter2Paras).toHaveLength(iter1Paras.length);
      // P0, P2, P3 differ.
      expect(iter2Paras[0]).not.toBe(iter1Paras[0]);
      expect(iter2Paras[2]).not.toBe(iter1Paras[2]);
      expect(iter2Paras[3]).not.toBe(iter1Paras[3]);
      // P1 unchanged.
      expect(iter2Paras[1]).toBe(iter1Paras[1]);
    });
  });
});
