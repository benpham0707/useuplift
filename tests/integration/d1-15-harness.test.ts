// ============================================================================
// D-1.15.1 Harness Smoke Test — Verify iter-1 setup + scenario edit primitives
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.15. This file tests the FOUNDATION that D-1.15.2 through D-1.15.6
//   build on. Without this smoke test, harness bugs (e.g., iter-1 setup
//   producing a malformed ledger, applyScenarioEdit splitting paragraphs
//   incorrectly) would surface in scenario tests conflated with the
//   actual iter-1→iter-2 logic D-1.15 is designed to verify.
//
// Diagnosability principle (per Tue's 2026-04-30 directive): when a scenario
// test fails, the failure must point at one specific contract. The harness
// smoke test ensures the iter-1 setup primitives ARE that contract — so
// failures are localized to "iter-2 logic broke" or "harness produced bad
// iter-1 state," never an undifferentiable composite.
//
// What this file asserts:
//   1. Every D1_15_SCENARIOS entry has a structurally valid iter-1 profile
//      (ledger shape, taughtMove IDs stable, snapshotText byte-identical
//      to scenario.essayText, etc.).
//   2. applyScenarioEdit produces valid iter-2 essay text for every edit
//      shape (paragraph count changes match expected per edit kind).
//   3. expectedIter1MoveIds is deterministic across calls (same scenario
//      → same IDs, even across separate D1-15 harness imports).
//   4. The scenarios cover all 5 spec-required edit kinds (small_edit,
//      structural_reorder, paragraph_delete, paragraph_insert,
//      multi_paragraph_cascade) — fail-fast if any kind goes missing.

import { describe, it, expect } from 'vitest';
import {
  D1_15_SCENARIOS,
  SCENARIO_1_SMALL_EDIT,
  SCENARIO_2_STRUCTURAL_REORDER,
  SCENARIO_3_PARAGRAPH_DELETE,
  SCENARIO_4_PARAGRAPH_INSERT,
  SCENARIO_5_MULTI_PARAGRAPH_CASCADE,
  applyScenarioEdit,
  buildIter1Profile,
  expectedIter1MoveIds,
  splitParagraphs,
  D1_15_ESSAY_ID,
  ITER1_STARTED_AT,
} from '../fixtures/d1-15';

// ─── Spec coverage check ────────────────────────────────────────────────

describe('D-1.15.1 harness — scenario registry', () => {
  it('exports exactly 5 scenarios per the §D-1.15 spec', () => {
    // Five scenarios per the spec: small edit / structural reorder /
    // paragraph delete / paragraph insert / multi-paragraph cascade.
    // If a future deliverable adds a sixth scenario, surface to Tue
    // for ratification per the standing operational charter — don't
    // silently increment.
    expect(D1_15_SCENARIOS).toHaveLength(5);
  });

  it('covers all 5 spec-required edit kinds (no missing edit shape)', () => {
    const kinds = D1_15_SCENARIOS.map((s) => s.edit.kind).sort();
    expect(kinds).toEqual([
      'multi_paragraph_cascade',
      'paragraph_delete',
      'paragraph_insert',
      'small_edit',
      'structural_reorder',
    ]);
  });

  it('every scenario has a non-empty essayText drawn from a real source', () => {
    for (const s of D1_15_SCENARIOS) {
      expect(s.essayText.length, `${s.id} essayText`).toBeGreaterThan(100);
      expect(s.provenance, `${s.id} provenance`).toMatch(/elite-examples|admitted|essay/i);
    }
  });

  it('every scenario has at least one iter1MoveAnchor (otherwise iter-2 has nothing to remap)', () => {
    for (const s of D1_15_SCENARIOS) {
      expect(s.iter1MoveAnchors.length, `${s.id} iter1MoveAnchors`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every iter1MoveAnchor.paragraphIndex is in range for the scenario essay', () => {
    for (const s of D1_15_SCENARIOS) {
      const paraCount = splitParagraphs(s.essayText).length;
      for (const anchor of s.iter1MoveAnchors) {
        expect(
          anchor.paragraphIndex,
          `${s.id} iter1MoveAnchor.paragraphIndex=${anchor.paragraphIndex} (essay has ${paraCount} paragraphs)`,
        ).toBeLessThan(paraCount);
        expect(anchor.paragraphIndex).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ─── Iter-1 profile setup invariants ───────────────────────────────────

describe('D-1.15.1 harness — buildIter1Profile invariants', () => {
  it('Scenario 1: produces a profile with currentIteration=1 and one IterationRecord', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    expect(profile.iterationLedger.currentIteration).toBe(1);
    expect(profile.iterationLedger.iterations).toHaveLength(1);
    expect(profile.iterationLedger.iterations[0].iteration).toBe(1);
    expect(profile.iterationLedger.iterations[0].triggeredBy).toBe('first_pass');
  });

  it('Scenario 1: snapshotText is byte-identical to scenario.essayText', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    const recordedSnapshot = profile.iterationLedger.iterations[0].snapshotText;
    expect(recordedSnapshot).toBe(SCENARIO_1_SMALL_EDIT.essayText);
  });

  it('Scenario 1: taughtMoves length matches iter1MoveAnchors length', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    expect(profile.iterationLedger.taughtMoves).toHaveLength(
      SCENARIO_1_SMALL_EDIT.iter1MoveAnchors.length,
    );
  });

  it('Scenario 1: every iter-1 taughtMove has taughtAtIteration=1 and landing=undefined', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    for (const move of profile.iterationLedger.taughtMoves) {
      expect(move.taughtAtIteration).toBe(1);
      // D-1.6.5 carve-out: landing is populated by the prior-annotations-
      // builder on iter-2 ONLY. Iter-1 commit leaves it undefined.
      expect(move.landing).toBeUndefined();
    }
  });

  it('Scenario 1: taughtMove.id values are deterministic and match expectedIter1MoveIds', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    const expectedIds = expectedIter1MoveIds(SCENARIO_1_SMALL_EDIT);
    const actualIds = profile.iterationLedger.taughtMoves.map((m) => m.id);
    expect(actualIds).toEqual(expectedIds);
  });

  it('Scenario 1: recentDecisions starts empty (iter-1 first-pass has no carry-forward decisions)', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    expect(profile.iterationLedger.recentDecisions).toEqual([]);
  });

  it('Scenario 1: iter-1 IterationRecord has stable startedAt timestamp (not new Date())', () => {
    const profile = buildIter1Profile(SCENARIO_1_SMALL_EDIT);
    expect(profile.iterationLedger.iterations[0].startedAt).toBe(ITER1_STARTED_AT);
  });

  // The remaining 4 scenarios share the same invariants — exercise each
  // with one assertion per scenario to catch scenario-specific data drift
  // (e.g., a scenario using a deleted essay id, or a paragraph anchor
  // exceeding the essay's paragraph count).
  it.each([
    SCENARIO_2_STRUCTURAL_REORDER,
    SCENARIO_3_PARAGRAPH_DELETE,
    SCENARIO_4_PARAGRAPH_INSERT,
    SCENARIO_5_MULTI_PARAGRAPH_CASCADE,
  ])('$id: produces a structurally valid iter-1 profile', (scenario) => {
    const profile = buildIter1Profile(scenario);
    expect(profile.iterationLedger.currentIteration).toBe(1);
    expect(profile.iterationLedger.iterations[0].snapshotText).toBe(scenario.essayText);
    expect(profile.iterationLedger.taughtMoves).toHaveLength(scenario.iter1MoveAnchors.length);
    for (const move of profile.iterationLedger.taughtMoves) {
      expect(move.taughtAtIteration).toBe(1);
      expect(move.landing).toBeUndefined();
    }
  });

  it('expectedIter1MoveIds is deterministic across separate calls', () => {
    // Calls within the same vitest worker should be identical (D-1.13
    // pure-function contract). Cross-call determinism guards against a
    // future regression where buildIter1L5Annotations introduces hidden
    // state (e.g., a counter in module scope).
    const ids1 = expectedIter1MoveIds(SCENARIO_1_SMALL_EDIT);
    const ids2 = expectedIter1MoveIds(SCENARIO_1_SMALL_EDIT);
    expect(ids1).toEqual(ids2);
    // Sanity: IDs are non-empty and unique within a scenario.
    expect(ids1.length).toBe(SCENARIO_1_SMALL_EDIT.iter1MoveAnchors.length);
    expect(new Set(ids1).size).toBe(ids1.length);
  });
});

// ─── applyScenarioEdit transformations ─────────────────────────────────

describe('D-1.15.1 harness — applyScenarioEdit transformations', () => {
  it('small_edit: replaces target paragraph; paragraph count unchanged', () => {
    const beforeCount = splitParagraphs(SCENARIO_1_SMALL_EDIT.essayText).length;
    const after = applyScenarioEdit(SCENARIO_1_SMALL_EDIT.essayText, SCENARIO_1_SMALL_EDIT.edit);
    const afterParas = splitParagraphs(after);
    expect(afterParas).toHaveLength(beforeCount);
    if (SCENARIO_1_SMALL_EDIT.edit.kind === 'small_edit') {
      expect(afterParas[SCENARIO_1_SMALL_EDIT.edit.paragraphIndex]).toBe(
        SCENARIO_1_SMALL_EDIT.edit.newParagraphText,
      );
    }
  });

  it('structural_reorder: paragraph count unchanged; the two indices have swapped content', () => {
    const beforeParas = splitParagraphs(SCENARIO_2_STRUCTURAL_REORDER.essayText);
    const after = applyScenarioEdit(
      SCENARIO_2_STRUCTURAL_REORDER.essayText,
      SCENARIO_2_STRUCTURAL_REORDER.edit,
    );
    const afterParas = splitParagraphs(after);
    expect(afterParas).toHaveLength(beforeParas.length);
    if (SCENARIO_2_STRUCTURAL_REORDER.edit.kind === 'structural_reorder') {
      const { indexA, indexB } = SCENARIO_2_STRUCTURAL_REORDER.edit;
      expect(afterParas[indexA]).toBe(beforeParas[indexB]);
      expect(afterParas[indexB]).toBe(beforeParas[indexA]);
      // Other paragraphs unchanged.
      for (let i = 0; i < beforeParas.length; i++) {
        if (i !== indexA && i !== indexB) {
          expect(afterParas[i]).toBe(beforeParas[i]);
        }
      }
    }
  });

  it('paragraph_delete: paragraph count decreases by 1; deleted paragraph is gone', () => {
    const beforeParas = splitParagraphs(SCENARIO_3_PARAGRAPH_DELETE.essayText);
    const after = applyScenarioEdit(
      SCENARIO_3_PARAGRAPH_DELETE.essayText,
      SCENARIO_3_PARAGRAPH_DELETE.edit,
    );
    const afterParas = splitParagraphs(after);
    expect(afterParas).toHaveLength(beforeParas.length - 1);
    if (SCENARIO_3_PARAGRAPH_DELETE.edit.kind === 'paragraph_delete') {
      const deletedText = beforeParas[SCENARIO_3_PARAGRAPH_DELETE.edit.paragraphIndex];
      expect(afterParas).not.toContain(deletedText);
    }
  });

  it('paragraph_insert: paragraph count increases by 1; new paragraph is at insertAfterIndex+1', () => {
    const beforeParas = splitParagraphs(SCENARIO_4_PARAGRAPH_INSERT.essayText);
    const after = applyScenarioEdit(
      SCENARIO_4_PARAGRAPH_INSERT.essayText,
      SCENARIO_4_PARAGRAPH_INSERT.edit,
    );
    const afterParas = splitParagraphs(after);
    expect(afterParas).toHaveLength(beforeParas.length + 1);
    if (SCENARIO_4_PARAGRAPH_INSERT.edit.kind === 'paragraph_insert') {
      expect(afterParas[SCENARIO_4_PARAGRAPH_INSERT.edit.insertAfterIndex + 1]).toBe(
        SCENARIO_4_PARAGRAPH_INSERT.edit.newParagraphText,
      );
    }
  });

  it('multi_paragraph_cascade: paragraph count unchanged; every edit applied', () => {
    const beforeParas = splitParagraphs(SCENARIO_5_MULTI_PARAGRAPH_CASCADE.essayText);
    const after = applyScenarioEdit(
      SCENARIO_5_MULTI_PARAGRAPH_CASCADE.essayText,
      SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit,
    );
    const afterParas = splitParagraphs(after);
    expect(afterParas).toHaveLength(beforeParas.length);
    if (SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit.kind === 'multi_paragraph_cascade') {
      for (const e of SCENARIO_5_MULTI_PARAGRAPH_CASCADE.edit.edits) {
        expect(afterParas[e.paragraphIndex]).toBe(e.newParagraphText);
      }
    }
  });

  it('throws on out-of-range paragraph index (small_edit)', () => {
    expect(() =>
      applyScenarioEdit('P0\n\nP1', { kind: 'small_edit', paragraphIndex: 5, newParagraphText: 'x' }),
    ).toThrow(/out of range/i);
  });

  it('throws on out-of-range paragraph index (paragraph_delete)', () => {
    expect(() =>
      applyScenarioEdit('P0\n\nP1', { kind: 'paragraph_delete', paragraphIndex: 5 }),
    ).toThrow(/out of range/i);
  });

  // [R-6 audit closure 2026-04-30] Additional throw-path coverage and
  // same-paragraph cascade semantics. Pre-fix the smoke test only
  // exercised throws for small_edit and paragraph_delete; insert /
  // reorder / cascade out-of-range paths were structurally identical
  // but unverified.

  it('throws on out-of-range index (paragraph_insert above range)', () => {
    expect(() =>
      applyScenarioEdit('P0\n\nP1', {
        kind: 'paragraph_insert',
        insertAfterIndex: 5,
        newParagraphText: 'x',
      }),
    ).toThrow(/out of range/i);
  });

  it('throws on out-of-range index (paragraph_insert below range — prepend disallowed)', () => {
    // C-8 audit closure: insertAfterIndex=-1 (prepend) was tightened to
    // ≥ 0 because no scenario uses it. Verify the throw path actually
    // fires for negative values.
    expect(() =>
      applyScenarioEdit('P0\n\nP1', {
        kind: 'paragraph_insert',
        insertAfterIndex: -1,
        newParagraphText: 'x',
      }),
    ).toThrow(/out of range/i);
  });

  it('throws on out-of-range index (structural_reorder)', () => {
    expect(() =>
      applyScenarioEdit('P0\n\nP1', { kind: 'structural_reorder', indexA: 0, indexB: 5 }),
    ).toThrow(/out of range/i);
  });

  it('throws on out-of-range index (multi_paragraph_cascade)', () => {
    expect(() =>
      applyScenarioEdit('P0\n\nP1', {
        kind: 'multi_paragraph_cascade',
        edits: [{ paragraphIndex: 5, newParagraphText: 'x' }],
      }),
    ).toThrow(/out of range/i);
  });

  it('multi_paragraph_cascade with two edits hitting the same paragraph: second-write-wins', () => {
    // Same-paragraph cascade is uncommon but possible (e.g., a prompt
    // engineer accidentally lists the same paragraph twice). The
    // applyScenarioEdit semantics: edits apply in array order; later
    // entries see earlier mutations. Final state == last write wins.
    const before = 'P0 first.\n\nP1 original.\n\nP2 last.';
    const after = applyScenarioEdit(before, {
      kind: 'multi_paragraph_cascade',
      edits: [
        { paragraphIndex: 1, newParagraphText: 'P1 first overwrite.' },
        { paragraphIndex: 1, newParagraphText: 'P1 second overwrite (this wins).' },
      ],
    });
    const afterParas = splitParagraphs(after);
    expect(afterParas).toHaveLength(3);
    expect(afterParas[1]).toBe('P1 second overwrite (this wins).');
    // Other paragraphs untouched.
    expect(afterParas[0]).toBe('P0 first.');
    expect(afterParas[2]).toBe('P2 last.');
  });
});

// ─── D1_15_ESSAY_ID convention ─────────────────────────────────────────

describe('D-1.15.1 harness — essayId convention', () => {
  it('D1_15_ESSAY_ID is a non-empty string', () => {
    expect(D1_15_ESSAY_ID).toBe('d1-15-test-essay');
  });
});
