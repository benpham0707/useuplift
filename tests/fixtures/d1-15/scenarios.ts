// ============================================================================
// D-1.15 Scenario Definitions — Multi-Essay Foundation
// ============================================================================
//
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.15 — Mock-LLM integration test (full iteration 1→2 flow).
//
// Tue's directive (2026-04-30):
// 1. "Don't keep it just a mock — keep the real end product in mind." Each
//    scenario uses a real elite-tier admitted essay drawn from
//    tests/fixtures/elite-examples-2025.ts (Harvard / UCLA / UCB cycle 2024-25)
//    OR a deliberately-constructed paragraph-shape fixture where a structural
//    edit pattern (insert / delete / reorder) needs a specific paragraph count
//    that the real essays don't naturally provide.
// 2. "Don't bias toward one essay." Every scenario uses a DIFFERENT essay so
//    no single voice / paragraph-count / archetype dominates the test surface.
//
// Diagnosability principle (per Tue's 2026-04-30 directive):
// Scenario fixtures live in this central module so when a scenario assertion
// fails, the failure points directly at one definition here — not buried in
// an iter-1 setup chain or an iter-2 mock chain.
//
// [C-1 audit closure 2026-04-30] D-0.11 mock-LLM framework deliberately
// bypassed for D-1.15. Reasons:
//   - D-0.11's value-add is prompt-string → response-fixture lookup with
//     parser robustness (the framework lives in tests/test-helpers/mockLlm.ts
//     and exports `mockLlmCall` / `mockLlmFailure`).
//   - D-1.15's contract is ledger-state assertions, not parser robustness.
//     Function-level vi.mock at the layer boundary (detectLanding,
//     focusedAnalyzer.runFocusedAnalysis, editUnderstandingService methods,
//     analyzeEssay for comprehensive scenarios) is the right interposition
//     for a ledger-state contract.
//   - D-1.16 (failure-injection test, the next deliverable in the sequence)
//     WILL use D-0.11's `mockLlmFailure` to drive structured error paths.
//     That's where parser-robustness contracts live.
// The boundary-level vi.mock approach matches D-1.8's pattern (which mocked
// `detectLanding` directly) and D-1.10's pattern (which exercised seam
// primitives without touching the LLM mock framework). D-1.15 inherits
// both patterns.
//
// [C-4 audit closure 2026-04-30] Deferred edit-shape coverage. The five
// scenarios cover EXACTLY the spec's enumerated edit kinds:
//   - small_edit, structural_reorder, paragraph_delete, paragraph_insert,
//     multi_paragraph_cascade.
// Edit shapes NOT covered (deliberately deferred):
//   - paragraph-merge (combining two paragraphs into one)
//   - paragraph-split (breaking one paragraph into two)
//   - transformative-significance pure rewrite (>50% paragraphs touched
//     simultaneously, edit understanding classifies as 'transformative')
// These three are out-of-scope for D-1.15. paragraph-merge and -split
// land naturally in D-1.16's failure-injection scenarios; transformative
// rewrites land in D-1.17's cross-phase audit. Don't add them here without
// surfacing for spec ratification first — D-1.15's five-scenario contract
// is closed.

import type { ExperienceEntry } from '../../../src/core/types/experience';
import { ELITE_EXAMPLES_2025 } from '../elite-examples-2025';

// ─── Edit shapes (per scenario) ────────────────────────────────────────

/**
 * Discriminated union describing how iter-2's edit transforms the iter-1
 * essay. The harness uses this to (i) compute the iter-2 essay text from
 * the iter-1 text, (ii) shape the mocked layer outputs to be consistent
 * with the edit, and (iii) construct expected ledger assertions.
 *
 * The discriminator is the literal `kind` field. Each variant carries
 * exactly the data needed to reconstruct the edited essay.
 */
export type ScenarioEdit =
  | {
      kind: 'small_edit';
      /** Paragraph index whose content is being revised (0-indexed). */
      paragraphIndex: number;
      /** Replacement text for the paragraph. */
      newParagraphText: string;
    }
  | {
      kind: 'structural_reorder';
      /** Paragraph indices being swapped (0-indexed). */
      indexA: number;
      indexB: number;
    }
  | {
      kind: 'paragraph_delete';
      /** Paragraph index to remove (0-indexed). */
      paragraphIndex: number;
    }
  | {
      kind: 'paragraph_insert';
      /** Where the new paragraph appears (0-indexed; 0 = prepend, length = append). */
      insertAfterIndex: number;
      /** Text of the inserted paragraph. */
      newParagraphText: string;
    }
  | {
      kind: 'multi_paragraph_cascade';
      /**
       * Multiple paragraphs being edited at once. Each entry replaces the
       * paragraph at `paragraphIndex` with `newParagraphText`. The harness
       * applies them in array order; later entries see the earlier ones'
       * mutations.
       */
      edits: Array<{ paragraphIndex: number; newParagraphText: string }>;
    };

// ─── Scenario shape ─────────────────────────────────────────────────────

/**
 * One scenario the integration test exercises.
 *
 * - `id` is the assertion-message-friendly identifier (used in describe blocks
 *   so failures pinpoint the scenario).
 * - `essayText` is the iter-1 cold-start essay. Drawn from real admitted
 *   essays where possible, with provenance commented at the source.
 * - `iter1MoveAnchors` lists which paragraphs iter-1's L5 should have
 *   produced taughtMoves on. The harness uses this to construct iter-1's
 *   buffered moves before commit, AND to assert iter-2's priorAnnotations
 *   Map population semantics post-edit.
 * - `edit` is the iter-2 transformation.
 * - `expectedMode` is what the iter-2 mode-selection should pick. NOTE
 *   (D-1.15.2 H-4 audit closure 2026-04-30): all 5 D-1.15 scenarios run
 *   on a fresh profile with `confidenceLevel='initial'`, which forces
 *   comprehensive mode via FocusedAnalyzer.selectAnalysisMode Rule 1
 *   (focusedAnalyzer.ts:759-762). The field is preserved on the type for
 *   future scenarios that might seed a higher-confidence profile and
 *   exercise the focused branch — but for the current 5 scenarios,
 *   expectedMode === 'comprehensive' uniformly.
 * - `provenance` is the human-readable comment explaining where the essay
 *   came from and why it suits the scenario.
 */
export interface Scenario {
  id: string;
  essayText: string;
  iter1MoveAnchors: Array<{ paragraphIndex: number; sentenceIndex?: number }>;
  edit: ScenarioEdit;
  expectedMode: 'focused' | 'comprehensive';
  provenance: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function eliteEssayText(id: string): string {
  const entry = ELITE_EXAMPLES_2025.find((e: ExperienceEntry) => e.id === id);
  if (!entry) {
    throw new Error(
      `[d1-15/scenarios] Elite essay id="${id}" not found in ELITE_EXAMPLES_2025. ` +
        `Either the id changed in elite-examples-2025.ts or this scenario references a stale entry.`,
    );
  }
  return entry.description_original;
}

/**
 * Split essay text into paragraphs the way the orchestrator does (double-
 * newline boundary, drop empty entries). Mirror of
 * createInitialProfile's paragraph splitter. Kept local so future drift
 * in the orchestrator's splitting rule is caught by the harness's own
 * type-check rather than silently divergent fixtures.
 */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
}

// ─── Scenarios (one per iter-2 edit shape) ──────────────────────────────

/**
 * Scenario 1: small edit — single paragraph (P2) of the Harvard MITES
 * essay revised. Provenance: real admitted essay, 4 paragraphs,
 * narrative-voice register. Small-edit pattern (≤1 paragraph touched,
 * < significant threshold) is the canonical iter-2 happy path —
 * exercises the priorAnnotations builder, the D-1.6.5 landing write-back
 * wire, and a clean mode-selection decision (comprehensive due to Rule 1
 * fresh-profile confidence; would be focused if iter-1 had already
 * matured the profile).
 */
export const SCENARIO_1_SMALL_EDIT: Scenario = {
  id: 'scenario-1-small-edit',
  essayText: eliteEssayText('harvard-mites-2029'),
  iter1MoveAnchors: [
    // L5 plausibly anchors moves on P0 (hook), P2 (body), P3 (resolution).
    // Three is realistic for a 4-paragraph elite-tier essay; aligns with
    // typical L5 output density observed in tests/output/checkpoint3/.
    { paragraphIndex: 0 },
    { paragraphIndex: 2 },
    { paragraphIndex: 3 },
  ],
  edit: {
    kind: 'small_edit',
    paragraphIndex: 2,
    // Real-edit-shaped revision: tightens a sentence in the body paragraph
    // about the cell-tower-style 48-hour turnaround. Single semantic move,
    // small-edit significance.
    newParagraphText:
      "Living in a building with eighty strangers, in a place I had never been, while quitting milk cold-turkey was not easy. The first few days were brutal: stomach ulcers, awkward silences, the persistent feeling I did not belong. That first Thursday night, everything started to shift.",
  },
  // Mode-selection rule 1 (FocusedAnalyzer.selectAnalysisMode at
  // focusedAnalyzer.ts:759-762): confidenceLevel='initial' forces
  // 'comprehensive' regardless of edit shape. The default
  // createInitialProfile sets confidenceLevel='initial', so iter-2's first
  // re-analysis on a fresh profile always goes comprehensive in production.
  // This is realistic: a profile only earns 'developing' / 'high' confidence
  // after multiple iterations; iter-2 of a fresh essay always re-runs the
  // full pipeline. All 5 D-1.15 scenarios share this property.
  expectedMode: 'comprehensive',
  provenance:
    'Harvard MITES 2029 admitted essay (elite-examples-2025.ts:harvard-mites-2029); 4 paragraphs; narrative-voice. Small-edit scenario revises P2 with a tightened sentence — single-paragraph touch under significant threshold. Comprehensive mode triggered by confidence=initial (Rule 1).',
};

/**
 * Scenario 2: structural reorder — swap P1↔P2 in the UCLA cancer-awareness
 * essay. Reorder creates a different rhetorical shape (reflection-before-
 * action vs action-before-reflection) without changing word content. Tests
 * priorAnnotations index-remap (D-1.7).
 */
export const SCENARIO_2_STRUCTURAL_REORDER: Scenario = {
  id: 'scenario-2-structural-reorder',
  essayText: eliteEssayText('ucla-cancer-awareness-2029'),
  iter1MoveAnchors: [
    // Moves on every paragraph maximizes index-remap coverage: every prior
    // move's paragraphIndex must remap correctly when the swap happens.
    { paragraphIndex: 0 },
    { paragraphIndex: 1 },
    { paragraphIndex: 2 },
    { paragraphIndex: 3 },
  ],
  edit: {
    kind: 'structural_reorder',
    indexA: 1,
    indexB: 2,
  },
  expectedMode: 'comprehensive',
  provenance:
    'UCLA cancer-awareness 2029 admitted essay (elite-examples-2025.ts:ucla-cancer-awareness-2029); 4 paragraphs; reflection-action-action-resolution arc. Structural-reorder scenario swaps P1 (in-the-bubble reflection) with P2 (the awareness-week action), creating action-before-reflection. Tests D-1.7 paragraph remap on prior moves.',
};

/**
 * Scenario 3: paragraph delete — remove P2 from the UC Berkeley cell-tower
 * essay. The deleted paragraph has a prior move on it; the move must drop
 * cleanly with `priorAnnotations.move_dropped` telemetry.
 */
export const SCENARIO_3_PARAGRAPH_DELETE: Scenario = {
  id: 'scenario-3-paragraph-delete',
  essayText: eliteEssayText('ucb-cell-tower-2029'),
  iter1MoveAnchors: [
    { paragraphIndex: 0 },
    // P2 — this move will be dropped when iter-2 deletes P2.
    { paragraphIndex: 2 },
    { paragraphIndex: 4 },
  ],
  edit: {
    kind: 'paragraph_delete',
    paragraphIndex: 2,
  },
  expectedMode: 'comprehensive',
  provenance:
    'UCB cell-tower 2029 admitted essay (elite-examples-2025.ts:ucb-cell-tower-2029); 5 paragraphs; political-advocacy narrative. Paragraph-delete scenario removes P2 (the realization paragraph) — a deliberate digression cut. P2 carries a prior taughtMove that must drop with structured telemetry per D-1.7 round-2 LOW-1 closure.',
};

/**
 * Scenario 4: paragraph insert — add a new bridge paragraph between P1 and
 * P2 of the Harvard MITES essay. Tests that priorAnnotations indices shift
 * correctly for paragraphs after the insertion AND that the new paragraph
 * has no priorAnnotations entry (no history).
 */
export const SCENARIO_4_PARAGRAPH_INSERT: Scenario = {
  id: 'scenario-4-paragraph-insert',
  essayText: eliteEssayText('harvard-mites-2029'),
  iter1MoveAnchors: [
    // Moves on P1, P2 ensure the post-insert remap is non-trivial: P1's
    // move stays at index 1; P2's move shifts from index 2 to index 3.
    { paragraphIndex: 1 },
    { paragraphIndex: 2 },
  ],
  edit: {
    kind: 'paragraph_insert',
    // Insert AFTER P1 (so the new paragraph becomes P2; existing P2 shifts to P3).
    insertAfterIndex: 1,
    newParagraphText:
      "Looking back, the conversation with my chiropractor was just the surface of what scared me. Underneath was a quieter fear: that the body I had treated like a passenger had been keeping its own ledger — and the totals were due.",
  },
  expectedMode: 'comprehensive',
  provenance:
    'Harvard MITES 2029 admitted essay (elite-examples-2025.ts:harvard-mites-2029) with a synthetic bridge paragraph inserted between P1 and P2. The insertion is realistic in shape — the kind of "missing reflection" beat a coach might surface on a teaching pass. Tests post-insert index shift on prior moves AND the no-history-for-new-paragraph invariant.',
};

/**
 * Scenario 5: multi-paragraph cascade — touches 3+ paragraphs in the UCLA
 * cancer-awareness essay. Triggers comprehensive mode (focused threshold
 * exceeded). Exercises the carry-forward arbitration spine across multiple
 * paragraphs, including landing-detector calls on every prior move.
 */
export const SCENARIO_5_MULTI_PARAGRAPH_CASCADE: Scenario = {
  id: 'scenario-5-multi-paragraph-cascade',
  essayText: eliteEssayText('ucla-cancer-awareness-2029'),
  iter1MoveAnchors: [
    { paragraphIndex: 0 },
    { paragraphIndex: 1 },
    { paragraphIndex: 2 },
    { paragraphIndex: 3 },
  ],
  edit: {
    kind: 'multi_paragraph_cascade',
    edits: [
      {
        paragraphIndex: 0,
        newParagraphText:
          "The first day I rolled [Name's] wheelchair around campus, I expected sympathy. What I got instead were stares — long, evaluating stares, the kind that classify a person before they speak. One classmate even laughed and said, \"Sure to land you the National Honor Society.\" I felt my jaw set. \"[Name] isn't a project for my résumé. He's my friend.\"",
      },
      {
        paragraphIndex: 2,
        newParagraphText:
          "Awareness Week began as a wall of names — donors, sponsors, volunteers — and ended as something I could not have named at the start: a community willing to sit, listen, and refuse to look away. We raised enough to cover three months of [Name's] treatments, but the real number was the count of people who showed up the morning after the walkathon to thank his mother by name.",
      },
      {
        paragraphIndex: 3,
        newParagraphText:
          "Today the halls feel different. Classmates still stop to greet [Name], but the stares have shifted register — admiration, recognition, a willingness to slow down. What he taught me, without ever sitting me down to say it, is that empathy is not a soft virtue. It is the discipline of paying attention when paying attention is inconvenient.",
      },
    ],
  },
  expectedMode: 'comprehensive',
  provenance:
    'UCLA cancer-awareness 2029 admitted essay (elite-examples-2025.ts:ucla-cancer-awareness-2029); 4 paragraphs. Multi-paragraph-cascade scenario rewrites P0, P2, P3 in one iter-2 commit — three-paragraph touch exceeds focused-mode threshold and triggers comprehensive re-analysis. Exercises landing detection on EVERY prior taughtMove (one per paragraph) plus the carry-forward arbitration ladder.',
};

// ─── Public registry ────────────────────────────────────────────────────

/**
 * All scenarios in spec order. The integration test imports this array
 * (or specific scenarios by name) and runs assertions. The registry shape
 * makes it easy to: (i) add a 6th scenario for future deliverables, (ii)
 * generate parameterized assertions, (iii) verify spec-completeness at
 * a glance (count === 5).
 */
export const D1_15_SCENARIOS: Scenario[] = [
  SCENARIO_1_SMALL_EDIT,
  SCENARIO_2_STRUCTURAL_REORDER,
  SCENARIO_3_PARAGRAPH_DELETE,
  SCENARIO_4_PARAGRAPH_INSERT,
  SCENARIO_5_MULTI_PARAGRAPH_CASCADE,
];

/**
 * Apply a ScenarioEdit to an iter-1 essay text. Returns the iter-2 text
 * the harness will pass to processEdit().
 *
 * This is a deterministic transformation: given iter-1 text + edit, the
 * iter-2 text is fully determined. No LLM involvement.
 *
 * Throws on out-of-range indices — protects against scenario fixtures
 * referencing paragraphs that don't exist in the source essay (e.g., a
 * future essay-text edit reduces paragraph count below what the scenario
 * expects).
 */
export function applyScenarioEdit(iter1Text: string, edit: ScenarioEdit): string {
  const paras = splitParagraphs(iter1Text);

  switch (edit.kind) {
    case 'small_edit': {
      if (edit.paragraphIndex < 0 || edit.paragraphIndex >= paras.length) {
        throw new Error(
          `[d1-15/scenarios] small_edit.paragraphIndex=${edit.paragraphIndex} out of range; ` +
            `essay has ${paras.length} paragraphs`,
        );
      }
      const out = [...paras];
      out[edit.paragraphIndex] = edit.newParagraphText;
      return out.join('\n\n');
    }

    case 'structural_reorder': {
      if (
        edit.indexA < 0 ||
        edit.indexA >= paras.length ||
        edit.indexB < 0 ||
        edit.indexB >= paras.length
      ) {
        throw new Error(
          `[d1-15/scenarios] structural_reorder indices A=${edit.indexA} B=${edit.indexB} out of range; ` +
            `essay has ${paras.length} paragraphs`,
        );
      }
      const out = [...paras];
      [out[edit.indexA], out[edit.indexB]] = [out[edit.indexB], out[edit.indexA]];
      return out.join('\n\n');
    }

    case 'paragraph_delete': {
      if (edit.paragraphIndex < 0 || edit.paragraphIndex >= paras.length) {
        throw new Error(
          `[d1-15/scenarios] paragraph_delete.paragraphIndex=${edit.paragraphIndex} out of range; ` +
            `essay has ${paras.length} paragraphs`,
        );
      }
      const out = [...paras];
      out.splice(edit.paragraphIndex, 1);
      return out.join('\n\n');
    }

    case 'paragraph_insert': {
      // insertAfterIndex range: 0 to length-1 (the new paragraph becomes
      // index insertAfterIndex+1). Prepend (insertAfterIndex=-1) was
      // considered as defensive support but no scenario uses it; tightened
      // to ≥ 0 per C-8 audit closure (2026-04-30) — we don't ship dead
      // defensive code. If a future scenario needs prepend, widen the
      // range AND add a smoke-test for the prepend path.
      if (edit.insertAfterIndex < 0 || edit.insertAfterIndex >= paras.length) {
        throw new Error(
          `[d1-15/scenarios] paragraph_insert.insertAfterIndex=${edit.insertAfterIndex} out of range ` +
            `(must be 0..${paras.length - 1}); essay has ${paras.length} paragraphs`,
        );
      }
      const out = [...paras];
      out.splice(edit.insertAfterIndex + 1, 0, edit.newParagraphText);
      return out.join('\n\n');
    }

    case 'multi_paragraph_cascade': {
      const out = [...paras];
      for (const e of edit.edits) {
        if (e.paragraphIndex < 0 || e.paragraphIndex >= out.length) {
          throw new Error(
            `[d1-15/scenarios] multi_paragraph_cascade.edits paragraphIndex=${e.paragraphIndex} out of range; ` +
              `essay has ${out.length} paragraphs (after preceding edits)`,
          );
        }
        out[e.paragraphIndex] = e.newParagraphText;
      }
      return out.join('\n\n');
    }
  }
}

// ─── Edit-shape helpers (R-3 audit closure 2026-04-30) ─────────────────

/**
 * Return the paragraph indices an edit touches in iter-1 indexing space.
 * Used by integration assertions to populate `editScope.paragraphsChanged`
 * without spelling out the discriminated-union narrowing in every test.
 *
 * Semantics per edit kind:
 *   - small_edit: [paragraphIndex]
 *   - structural_reorder: [indexA, indexB]
 *   - paragraph_delete: [paragraphIndex]
 *   - paragraph_insert: [insertAfterIndex] (adjacent paragraph; the new
 *     paragraph itself is at insertAfterIndex+1 in iter-2 space, but the
 *     "what changed" for editScope is the surrounding context)
 *   - multi_paragraph_cascade: [...edits.map(e => e.paragraphIndex)]
 */
export function getEditedParagraphIndices(edit: ScenarioEdit): number[] {
  switch (edit.kind) {
    case 'small_edit':
      return [edit.paragraphIndex];
    case 'structural_reorder':
      return [edit.indexA, edit.indexB];
    case 'paragraph_delete':
      return [edit.paragraphIndex];
    case 'paragraph_insert':
      return [edit.insertAfterIndex];
    case 'multi_paragraph_cascade':
      return edit.edits.map((e) => e.paragraphIndex);
  }
}

/**
 * The scenario-canonical edit-significance label. Used by integration
 * assertions and by the buildPriorAnnotationsForOrchestrator call's
 * `editSignificance` argument so the harness threads a consistent
 * mechanical-fallback equivalent that matches what the real
 * editUnderstandingService would classify for the edit shape.
 */
export function expectedEditSignificance(
  edit: ScenarioEdit,
): 'minor' | 'moderate' | 'significant' | 'transformative' {
  switch (edit.kind) {
    case 'small_edit':
      return 'minor';
    case 'structural_reorder':
      // Reordering same paragraphs preserves words; significance is
      // architectural, not lexical. 'significant' is the LLM-realistic
      // label for "structure changed but voice preserved."
      return 'significant';
    case 'paragraph_delete':
    case 'paragraph_insert':
      // Structural shape change → significant.
      return 'significant';
    case 'multi_paragraph_cascade':
      // Multiple paragraphs rewritten → transformative (the LLM-realistic
      // label for >2 paragraphs touched simultaneously per
      // FocusedAnalyzer.selectAnalysisMode Rule 5).
      return 'transformative';
  }
}
