// ============================================================================
// D-1.15 Deferred-Item Closure — Item 6: brief→editScope translation
// ============================================================================
//
// Spec: docs/audit/phase-1-integrity-audit.md §6 Item 6 (carried from
//   D-1.15.4 Q5).
//
// What this file tests (and what it DOESN'T):
//   This file exercises TWO of the three hops in the production chain:
//
//     [HOP 1, REAL]    (oldText, newText) → editUnderstandingService.computeEditDiff
//     [HOP 2, IN-TEST] EditDiff → ReanalysisBrief
//                        (synthesized by `constructBriefFromDiff` below;
//                         production produces this via the LLM-touching
//                         `editUnderstandingService.analyzeEdit` Sonnet call,
//                         which is OUT OF SCOPE for Item 6 — it's an
//                         analyzeEdit-fidelity concern, not a translation
//                         concern)
//     [HOP 3, REAL]    ReanalysisBrief → buildEditScopeFromBrief → IterationRecord.editScope
//
//   Item 6's audit spec named the chain as "computeEditDiff → briefBuilder →
//   commitIterationRecord," and what was untested was specifically the
//   commitIterationRecord-side translation (D-1.15 Scenarios 1–5 hard-coded
//   editScope.structural on a manually-pushed IterationRecord rather than
//   driving the counts-from-netChanges logic). HOP 3's translation logic
//   (formerly inline at analysisOrchestrator.commitIterationRecord lines
//   2076-2106; extracted to analysis/editScopeBuilder.ts as part of Item 6
//   closure) is fully exercised here.
//
//   The HOP-2 LLM-touching gap (production analyzeEdit→brief) remains a
//   separate untested area — surfaced for Phase 2 fix-cycle as
//   `analyzeEdit-brief-fidelity-untested` rather than rolled into Item 6.
//   Round-1 audit MED finding 2026-04-30: closed by acknowledging this
//   honestly here rather than overstating coverage.
//
// Why two surfaces:
//   1. PURE-FUNCTION TESTS — buildEditScopeFromBrief in isolation, exhaustive
//      coverage of the counting logic and falsy-fallback edges. These pin
//      down the translation contract independent of where briefs come from.
//   2. LIVE-DERIVATION CHAIN TESTS — drive computeEditDiff against
//      synthetic (oldText, newText) pairs that mirror the D-1.15 scenario
//      kinds, construct a brief whose `structural` and `netChanges[]` shape
//      mirrors what a production `analyzeEdit` would produce given that
//      diff, and assert the resulting editScope counts match the diff's
//      structural shape. This pins down the chain as a unit.
//
// Diagnosability principle (per Tue's 2026-04-30 directive): when a test
// fails, the failure must point at one specific contract. Each describe
// block names the contract it pins down; assertions inside each block
// vary inputs but exercise the same contract.

import { describe, it, expect } from 'vitest';
import { buildEditScopeFromBrief } from '../../src/services/essayIntelligence/analysis/editScopeBuilder';
import { computeEditDiff } from '../../src/services/essayIntelligence/analysis/editUnderstandingService';
import type {
  EditChangeType,
  EditDiff,
  IterationRecord,
  ReanalysisBrief,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Construct a minimal ReanalysisBrief with the fields buildEditScopeFromBrief
 * actually reads. Other ReanalysisBrief fields are fillered with empty
 * defaults so the type-checker is happy without distracting from the test.
 */
function buildMinimalBrief(args: {
  paragraphsChanged?: number[];
  hasReordering?: boolean;
  hasInsertions?: boolean;
  hasDeletions?: boolean;
  changeScope?: ReanalysisBrief['structural']['changeScope'];
  netChanges?: ReanalysisBrief['netChanges'];
}): ReanalysisBrief {
  return {
    netChanges: args.netChanges ?? [],
    structural: {
      paragraphsChanged: args.paragraphsChanged ?? [],
      hasReordering: args.hasReordering ?? false,
      hasInsertions: args.hasInsertions ?? false,
      hasDeletions: args.hasDeletions ?? false,
      changeScope: args.changeScope ?? 'sentence',
    },
    staleAreas: [],
    summaryForPrompt: '',
  };
}

/**
 * Construct a synthetic brief whose `structural` and `netChanges[]` shape
 * mirrors what the production `editUnderstandingService.analyzeEdit` would
 * produce given a particular EditDiff. Used by the live-derivation tests
 * to exercise the diff → brief → editScope chain without driving an
 * actual LLM call.
 *
 * Specifically: walks the diff's `paragraphChanges[]`, emits one entry in
 * `netChanges[]` per paragraph-level change (added / removed / modified).
 * Reads `structural` directly from the diff and translates to the brief's
 * structural shape (paragraphsAdded ∪ paragraphsRemoved ∪ modified-indices →
 * `paragraphsChanged`; `paragraphsReordered` → `hasReordering`).
 *
 * NOTE: production analyzeEdit may produce richer brief shapes (e.g.,
 * sentence-level netChanges entries, or merged paragraph entries). This
 * helper produces the simpler paragraph-level shape because the editScope
 * counter only cares about changeType counts, not the granularity. A
 * future test expansion could add a sentence-level brief variant if the
 * production analyzeEdit's behavior diverges.
 */
function constructBriefFromDiff(diff: EditDiff): ReanalysisBrief {
  const netChanges: ReanalysisBrief['netChanges'] = [];
  const paragraphsChanged: number[] = [];

  for (const change of diff.paragraphChanges) {
    paragraphsChanged.push(change.paragraphIndex);
    if (change.changeType === 'added') {
      netChanges.push({
        location: { paragraph: change.paragraphIndex },
        oldText: '',
        newText: '',
        significance: 'moderate',
        changeType: 'paragraph_added',
      });
    } else if (change.changeType === 'removed') {
      netChanges.push({
        location: { paragraph: change.paragraphIndex },
        oldText: '',
        newText: '',
        significance: 'moderate',
        changeType: 'paragraph_removed',
      });
    } else {
      // 'modified' — emit a 'modified' netChanges entry. The buildEditScope
      // counting logic ignores 'modified' (it only counts added/removed),
      // matching production: edits that don't restructure paragraph count
      // don't bump structural.added/.removed.
      netChanges.push({
        location: { paragraph: change.paragraphIndex },
        oldText: '',
        newText: '',
        significance: 'moderate',
        changeType: 'modified',
      });
    }
  }

  return {
    netChanges,
    structural: {
      paragraphsChanged: [...new Set(paragraphsChanged)].sort((a, b) => a - b),
      hasReordering: diff.structural.paragraphsReordered,
      hasInsertions: diff.structural.paragraphsAdded.length > 0,
      hasDeletions: diff.structural.paragraphsRemoved.length > 0,
      changeScope:
        diff.paragraphChanges.length === 0
          ? 'sentence'
          : diff.paragraphChanges.length === 1
            ? 'paragraph'
            : 'multi_paragraph',
    },
    staleAreas: [],
    summaryForPrompt: '',
  };
}

// ─── Surface 1: Pure-function contract pin-down ───────────────────────

describe('Item 6 — buildEditScopeFromBrief: triggeredBy gating', () => {
  it("returns undefined when triggeredBy is 'first_pass' (no editScope on first iteration)", () => {
    const brief = buildMinimalBrief({ paragraphsChanged: [0, 1] });
    const result = buildEditScopeFromBrief('first_pass', brief, 'moderate', ['meaning_evolution']);
    expect(result).toBeUndefined();
  });

  it("returns undefined when triggeredBy is 'student_request' (per the §7.1 contract)", () => {
    const brief = buildMinimalBrief({ paragraphsChanged: [0, 1] });
    const result = buildEditScopeFromBrief('student_request', brief, 'moderate', ['meaning_evolution']);
    expect(result).toBeUndefined();
  });

  it("returns a populated editScope when triggeredBy is 'edit'", () => {
    const brief = buildMinimalBrief({ paragraphsChanged: [0, 1] });
    const result = buildEditScopeFromBrief('edit', brief, 'moderate', ['meaning_evolution']);
    expect(result).toBeDefined();
    expect(result?.paragraphsChanged).toEqual([0, 1]);
  });
});

describe('Item 6 — buildEditScopeFromBrief: brief.structural carry-forward', () => {
  it('carries paragraphsChanged from brief.structural', () => {
    const brief = buildMinimalBrief({ paragraphsChanged: [2, 5, 7] });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.paragraphsChanged).toEqual([2, 5, 7]);
  });

  it('carries hasReordering from brief.structural to editScope.structural.reordered', () => {
    const briefWithReorder = buildMinimalBrief({ hasReordering: true });
    const briefWithoutReorder = buildMinimalBrief({ hasReordering: false });
    expect(buildEditScopeFromBrief('edit', briefWithReorder, 'minor', [])?.structural.reordered).toBe(true);
    expect(buildEditScopeFromBrief('edit', briefWithoutReorder, 'minor', [])?.structural.reordered).toBe(false);
  });

  it('returns paragraphsChanged=[] when brief is undefined (preserves prior inline fallback)', () => {
    const result = buildEditScopeFromBrief('edit', undefined, 'minor', []);
    expect(result?.paragraphsChanged).toEqual([]);
  });

  it('returns structural.reordered=false when brief is undefined', () => {
    const result = buildEditScopeFromBrief('edit', undefined, 'minor', []);
    expect(result?.structural.reordered).toBe(false);
  });
});

describe('Item 6 — buildEditScopeFromBrief: significance and changeTypes pass-through', () => {
  it('carries editSignificance verbatim', () => {
    const brief = buildMinimalBrief({});
    expect(buildEditScopeFromBrief('edit', brief, 'minor', [])?.significance).toBe('minor');
    expect(buildEditScopeFromBrief('edit', brief, 'moderate', [])?.significance).toBe('moderate');
    expect(buildEditScopeFromBrief('edit', brief, 'significant', [])?.significance).toBe('significant');
    expect(buildEditScopeFromBrief('edit', brief, 'transformative', [])?.significance).toBe('transformative');
  });

  it("defaults significance to 'minor' when undefined (preserves prior inline fallback)", () => {
    const brief = buildMinimalBrief({});
    expect(buildEditScopeFromBrief('edit', brief, undefined, [])?.significance).toBe('minor');
  });

  it('carries editChangeTypes verbatim', () => {
    const brief = buildMinimalBrief({});
    const types: EditChangeType[] = ['meaning_evolution', 'specificity_added'];
    const result = buildEditScopeFromBrief('edit', brief, 'minor', types);
    expect(result?.changeTypes).toEqual(types);
  });

  it('defaults changeTypes to [] when undefined', () => {
    const brief = buildMinimalBrief({});
    expect(buildEditScopeFromBrief('edit', brief, 'minor', undefined)?.changeTypes).toEqual([]);
  });
});

describe('Item 6 — buildEditScopeFromBrief: netChanges counting (the load-bearing logic)', () => {
  it("counts 'added' and 'paragraph_added' as additions", () => {
    const brief = buildMinimalBrief({
      netChanges: [
        { location: { paragraph: 0 }, oldText: '', newText: '', significance: 'minor', changeType: 'added' },
        { location: { paragraph: 1 }, oldText: '', newText: '', significance: 'minor', changeType: 'paragraph_added' },
      ],
    });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.structural.added).toBe(2);
    expect(result?.structural.removed).toBe(0);
  });

  it("counts 'removed', 'paragraph_removed', and 'deleted' as removals", () => {
    const brief = buildMinimalBrief({
      netChanges: [
        { location: { paragraph: 0 }, oldText: '', newText: '', significance: 'minor', changeType: 'removed' },
        { location: { paragraph: 1 }, oldText: '', newText: '', significance: 'minor', changeType: 'paragraph_removed' },
        { location: { paragraph: 2 }, oldText: '', newText: '', significance: 'minor', changeType: 'deleted' },
      ],
    });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.structural.added).toBe(0);
    expect(result?.structural.removed).toBe(3);
  });

  it("does NOT count 'modified' as either addition or removal", () => {
    const brief = buildMinimalBrief({
      netChanges: [
        { location: { paragraph: 0 }, oldText: '', newText: '', significance: 'minor', changeType: 'modified' },
        { location: { paragraph: 1 }, oldText: '', newText: '', significance: 'minor', changeType: 'modified' },
      ],
    });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.structural.added).toBe(0);
    expect(result?.structural.removed).toBe(0);
  });

  it("counts a mixed netChanges array correctly (added + removed + modified)", () => {
    const brief = buildMinimalBrief({
      netChanges: [
        { location: { paragraph: 0 }, oldText: '', newText: '', significance: 'minor', changeType: 'added' },
        { location: { paragraph: 1 }, oldText: '', newText: '', significance: 'minor', changeType: 'modified' },
        { location: { paragraph: 2 }, oldText: '', newText: '', significance: 'minor', changeType: 'removed' },
        { location: { paragraph: 3 }, oldText: '', newText: '', significance: 'minor', changeType: 'paragraph_added' },
        { location: { paragraph: 4 }, oldText: '', newText: '', significance: 'minor', changeType: 'modified' },
      ],
    });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.structural.added).toBe(2); // added + paragraph_added
    expect(result?.structural.removed).toBe(1); // removed
  });

  it("returns added=0, removed=0 when brief is undefined (preserves prior inline fallback)", () => {
    const result = buildEditScopeFromBrief('edit', undefined, 'minor', []);
    expect(result?.structural.added).toBe(0);
    expect(result?.structural.removed).toBe(0);
  });

  it("returns added=0, removed=0 when brief.netChanges is empty", () => {
    const brief = buildMinimalBrief({ netChanges: [] });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.structural.added).toBe(0);
    expect(result?.structural.removed).toBe(0);
  });

  it('handles unknown changeType strings without crashing or counting', () => {
    // Defensive: the changeType field is `string`, not a closed enum, so
    // unknown values flow through the brief. The counter ignores them
    // (matches prior inline behavior — no `?? unknown` masking).
    const brief = buildMinimalBrief({
      netChanges: [
        { location: { paragraph: 0 }, oldText: '', newText: '', significance: 'minor', changeType: 'wholly_novel_change_kind' },
      ],
    });
    const result = buildEditScopeFromBrief('edit', brief, 'minor', []);
    expect(result?.structural.added).toBe(0);
    expect(result?.structural.removed).toBe(0);
  });
});

// ─── Surface 2: Live-derivation chain (computeEditDiff → brief → editScope) ──

describe('Item 6 — live derivation: small_edit (single paragraph modified, high overlap)', () => {
  it('produces editScope with no added/removed counts; paragraphsChanged matches diff', () => {
    // P0 unchanged, P1 modified (high overlap so computeEditDiff treats it
    // as 'modified', not as remove+add), P2 unchanged. The 30% word-overlap
    // threshold (editUnderstandingService.computeEditDiff:374) gates whether
    // a modification is preserved as 'modified' vs split into two paragraph-
    // level changes.
    const oldText = 'P0 first paragraph.\n\nP1 original middle paragraph that introduces the central conflict.\n\nP2 third paragraph.';
    const newText = 'P0 first paragraph.\n\nP1 original middle paragraph that introduces the central conflict and complicates it.\n\nP2 third paragraph.';
    const diff = computeEditDiff(oldText, newText);

    // Sanity: the diff itself has the shape we expect.
    // NOTE: computeEditDiff's `structural.paragraphsAdded` and
    // `paragraphsRemoved` are the RAW hash-mismatch sets BEFORE the
    // overlap-pairing logic identifies modifications. A high-overlap
    // modification appears in BOTH paragraphsAdded (new index) AND
    // paragraphsRemoved (old index), then gets re-classified as
    // 'modified' via the pairing logic at editUnderstandingService.ts:
    // 372-390. The authoritative shape for "this was modified, not
    // added/removed" is `paragraphChanges[].changeType === 'modified'`.
    expect(diff.paragraphChanges).toHaveLength(1);
    expect(diff.paragraphChanges[0].changeType).toBe('modified');
    // Both raw sets contain index 1 (the modified paragraph). The
    // pairing logic will re-classify, but the raw sets reflect
    // hash-mismatch.
    expect(diff.structural.paragraphsAdded).toEqual([1]);
    expect(diff.structural.paragraphsRemoved).toEqual([1]);
    expect(diff.structural.paragraphsReordered).toBe(false);

    // Translate diff → brief → editScope.
    const brief = constructBriefFromDiff(diff);
    const editScope = buildEditScopeFromBrief('edit', brief, 'moderate', ['meaning_evolution']);

    // The translated editScope should reflect the diff honestly: one paragraph
    // changed, no structural additions or removals.
    expect(editScope?.paragraphsChanged).toEqual([1]);
    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(0);
    expect(editScope?.structural.reordered).toBe(false);
    expect(editScope?.significance).toBe('moderate');
    expect(editScope?.changeTypes).toEqual(['meaning_evolution']);
  });
});

describe('Item 6 — live derivation: paragraph_insert (one paragraph added)', () => {
  it('produces editScope.structural.added=1 and paragraphsChanged contains the new index', () => {
    // P0 unchanged, P1 unchanged, NEW P2 inserted, P3 (was P2) unchanged.
    const oldText = 'P0 alpha.\n\nP1 beta.\n\nP2 gamma.';
    const newText = 'P0 alpha.\n\nP1 beta.\n\nNEW inserted material here.\n\nP2 gamma.';
    const diff = computeEditDiff(oldText, newText);

    // The diff identifies the new paragraph as added at index 2 (where
    // "NEW inserted material" lives in newText). Assert the actual index
    // rather than just length — round-1 audit LOW closure 2026-04-30:
    // toBe(1)-on-length passes spuriously if the index drifts.
    expect(diff.structural.paragraphsAdded).toEqual([2]);
    expect(diff.structural.paragraphsRemoved).toEqual([]);
    expect(diff.structural.paragraphDelta).toBe(1);

    const brief = constructBriefFromDiff(diff);
    const editScope = buildEditScopeFromBrief('edit', brief, 'significant', ['meaning_evolution']);

    expect(editScope?.structural.added).toBe(1);
    expect(editScope?.structural.removed).toBe(0);
    // NOTE: computeEditDiff's reorder detection (editUnderstandingService.ts:
    // 313-331) flags any index-shift as paragraphsReordered=true. Inserting
    // a paragraph at index 2 shifts old-P2 to new-P3, which the detector
    // reads as a reorder. The brief carries this through, so editScope.
    // structural.reordered is true even on a pure insert. This is
    // computeEditDiff's production behavior; downstream consumers (D-4.11
    // escalation calibration) observe the same flag. Whether the over-
    // aggressive detection is a bug or by-design is out of Item 6's scope.
    // FORWARD-LINK (round-1 audit MED closure 2026-04-30): if a future
    // deliverable tightens computeEditDiff's reorder heuristic so that
    // pure inserts/deletes no longer flag reordered=true, this expectation
    // (and the paragraph_delete sibling at the next describe) needs to
    // flip to `false`. Find these tests by grepping for
    // `[REORDER-OVER-DETECTION-FORWARD-LINK]`.
    // [REORDER-OVER-DETECTION-FORWARD-LINK]
    expect(editScope?.structural.reordered).toBe(true);
    // paragraphsChanged includes the new paragraph index.
    expect(editScope?.paragraphsChanged).toContain(diff.structural.paragraphsAdded[0]);
  });
});

describe('Item 6 — live derivation: paragraph_delete (one paragraph removed)', () => {
  it('produces editScope.structural.removed=1 and paragraphsChanged contains the deleted index', () => {
    const oldText = 'P0 alpha.\n\nP1 beta will be deleted.\n\nP2 gamma.';
    const newText = 'P0 alpha.\n\nP2 gamma.';
    const diff = computeEditDiff(oldText, newText);

    // Assert the actual deleted index (1) rather than just length — round-1
    // audit LOW closure 2026-04-30.
    expect(diff.structural.paragraphsRemoved).toEqual([1]);
    expect(diff.structural.paragraphsAdded).toEqual([]);
    expect(diff.structural.paragraphDelta).toBe(-1);

    const brief = constructBriefFromDiff(diff);
    const editScope = buildEditScopeFromBrief('edit', brief, 'significant', ['meaning_evolution']);

    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(1);
    // Same shift-as-reorder behavior as the paragraph_insert test —
    // deleting P1 shifts old-P2 to new-P1, which the detector reads as a
    // reorder. See the inline FORWARD-LINK comment in the paragraph_insert
    // test for the full rationale; sibling forward-link marker below.
    // [REORDER-OVER-DETECTION-FORWARD-LINK]
    expect(editScope?.structural.reordered).toBe(true);
    expect(editScope?.paragraphsChanged).toContain(diff.structural.paragraphsRemoved[0]);
  });
});

describe('Item 6 — live derivation: structural_reorder (paragraphs swapped)', () => {
  it('produces editScope.structural.reordered=true with no add/remove counts', () => {
    // P0 and P1 swap. computeEditDiff flags paragraphsReordered=true.
    const oldText = 'P0 alpha first.\n\nP1 beta second.\n\nP2 gamma third.';
    const newText = 'P1 beta second.\n\nP0 alpha first.\n\nP2 gamma third.';
    const diff = computeEditDiff(oldText, newText);

    expect(diff.structural.paragraphsReordered).toBe(true);
    // After reorder, both paragraphs match somewhere — no add/remove.
    expect(diff.structural.paragraphsAdded).toEqual([]);
    expect(diff.structural.paragraphsRemoved).toEqual([]);

    const brief = constructBriefFromDiff(diff);
    const editScope = buildEditScopeFromBrief('edit', brief, 'significant', ['meaning_evolution']);

    expect(editScope?.structural.reordered).toBe(true);
    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(0);
  });
});

describe('Item 6 — live derivation: multi-paragraph cascade (multiple modifications)', () => {
  it('produces editScope with multiple paragraphsChanged but no structural add/remove', () => {
    // P0, P1, P2 all modified (voice-preserving edits).
    const oldText = 'P0 original first.\n\nP1 original middle.\n\nP2 original last.';
    const newText = 'P0 revised first paragraph here.\n\nP1 revised middle paragraph here.\n\nP2 revised last paragraph here.';
    const diff = computeEditDiff(oldText, newText);

    // Each paragraph is "added then removed" in the diff because content
    // changed beyond the 30% overlap threshold for some, OR matched as
    // modified for others. Either way: structural.paragraphsReordered is false
    // and the paragraph count is unchanged.
    expect(diff.structural.paragraphsReordered).toBe(false);
    expect(diff.structural.paragraphDelta).toBe(0);

    const brief = constructBriefFromDiff(diff);
    const editScope = buildEditScopeFromBrief('edit', brief, 'transformative', ['meaning_evolution', 'specificity_added']);

    // The exact added/removed counts depend on the overlap-pairing heuristic
    // in computeEditDiff (editUnderstandingService.ts:372-390). The contract
    // this test pins: structural.added === structural.removed when paragraph
    // count is preserved (each unpaired remove gets a sibling unpaired add
    // of the same count). The relational invariant IS the contract here;
    // absolute counts are implementation-defined by the overlap heuristic.
    // Round-1 audit LOW (Agent 3) note 2026-04-30: a counter regression
    // could leave both counts at 0 and pass this assertion spuriously, so
    // also pin paragraphDelta=0 (paragraph count preserved) and at least
    // one paragraph changed (cascade is non-trivial).
    expect(editScope?.structural.added).toBe(editScope?.structural.removed);
    expect(diff.structural.paragraphDelta).toBe(0);
    expect((editScope?.paragraphsChanged.length ?? 0)).toBeGreaterThan(0);
    expect(editScope?.significance).toBe('transformative');
    expect(editScope?.changeTypes).toEqual(['meaning_evolution', 'specificity_added']);
  });
});

describe('Item 6 — live derivation: no-op edit (oldText === newText)', () => {
  it('produces editScope with empty paragraphsChanged and zero counts', () => {
    const text = 'P0 unchanged.\n\nP1 unchanged.\n\nP2 unchanged.';
    const diff = computeEditDiff(text, text);

    expect(diff.paragraphChanges).toEqual([]);
    expect(diff.structural.paragraphsAdded).toEqual([]);
    expect(diff.structural.paragraphsRemoved).toEqual([]);
    expect(diff.structural.paragraphsReordered).toBe(false);

    const brief = constructBriefFromDiff(diff);
    const editScope = buildEditScopeFromBrief('edit', brief, 'minor', []);

    expect(editScope?.paragraphsChanged).toEqual([]);
    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(0);
    expect(editScope?.structural.reordered).toBe(false);
  });
});

// ─── Type sanity ──────────────────────────────────────────────────────

describe('Item 6 — type contract', () => {
  it('the helper return type matches IterationRecord.editScope exactly', () => {
    // This is a compile-time check disguised as a runtime test — if the
    // helper's return type drifts from IterationRecord['editScope'], the
    // type check below fails to compile. Vitest run still has to succeed
    // for this assertion to count, but the real value is the typecheck.
    const result: IterationRecord['editScope'] = buildEditScopeFromBrief(
      'edit',
      buildMinimalBrief({ paragraphsChanged: [0] }),
      'minor',
      [],
    );
    expect(result).toBeDefined();
    // Tightened (round-1 audit LOW closure 2026-04-30 Agent 2): the
    // significance annotation is the actual union, not the broader
    // `string` — so a type drift on significance fails this compile.
    if (result) {
      const _: {
        paragraphsChanged: number[];
        significance: 'minor' | 'moderate' | 'significant' | 'transformative';
        changeTypes: EditChangeType[];
        structural: { reordered: boolean; added: number; removed: number };
      } = result;
      expect(_.paragraphsChanged).toEqual([0]);
    }
  });
});
