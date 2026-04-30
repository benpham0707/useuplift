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
//
// [Phase-1 deferred-items closure 2026-04-30 — Items 1, 2, 3 from
//  phase-1-integrity-audit.md §6] Three additional edit shapes are now
// covered as Scenarios 6, 7, 8 — added to this same harness as sibling
// extensions (per Tue's authorization 2026-04-30):
//   - paragraph-merge (Scenario 6) — combining two adjacent paragraphs
//     into one (net paragraph count -1).
//   - paragraph-split (Scenario 7) — splitting one paragraph into two
//     (net paragraph count +1).
//   - transformative pure-rewrite (Scenario 8) — >50% of paragraphs
//     replaced with non-voice-preserving overhauls (overlap < 0.30
//     threshold; iter-1 priors on rewritten paragraphs DROP).
// These three were originally deferred to Phase 2 fix-cycles; surfacing
// them now into D-1.15's harness keeps edit-shape coverage co-located
// rather than scattered across deliverables. The 5-scenario contract is
// EXPANDED, not invalidated — Scenarios 1-5 remain unchanged.

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
    }
  | {
      kind: 'paragraph_merge';
      /**
       * Two adjacent paragraphs combine into one. `secondIndex` MUST equal
       * `firstIndex + 1` (validated at applyScenarioEdit). The merged
       * paragraph replaces the first index; the second is removed. Net
       * paragraph count decreases by 1.
       *
       * Edit-shape semantics for downstream remap:
       *   - The merged text typically has high overlap with `firstIndex`
       *     (the merge keeps most of the first paragraph's content) and
       *     moderate overlap with `secondIndex`. Greedy overlap-pairing
       *     in paragraphRemapBuilder Phase 2 selects iter-1 firstIndex →
       *     iter-2 firstIndex (modified). iter-1 secondIndex has no pair
       *     remaining → classified as paragraph_deleted; any prior move on
       *     it DROPS.
       *
       * [Phase-1 Item 1 closure 2026-04-30] Added per
       * docs/audit/phase-1-integrity-audit.md §6 #1.
       */
      firstIndex: number;
      secondIndex: number;
      mergedText: string;
    }
  | {
      kind: 'paragraph_split';
      /**
       * One paragraph splits into two adjacent paragraphs. The original
       * paragraph at `paragraphIndex` is replaced by `firstHalf` followed
       * by `secondHalf` (separated by `\n\n`). Net paragraph count
       * increases by 1.
       *
       * `splitAfterSentence` is informational only — the harness uses
       * `firstHalf` / `secondHalf` directly so the split point is exact.
       * It's preserved on the type so a future fixture audit can locate
       * the originating sentence boundary without re-parsing the texts.
       *
       * Edit-shape semantics for downstream remap:
       *   - Whichever half retains the majority of the original paragraph's
       *     words pairs with iter-1 paragraphIndex via overlap >= 0.30
       *     (modified). The shorter half has overlap < 0.30 with the
       *     original → it's a structurally NEW paragraph (paragraph_added);
       *     no priorAnnotations entry exists for it.
       *
       * [Phase-1 Item 2 closure 2026-04-30] Added per
       * docs/audit/phase-1-integrity-audit.md §6 #2.
       */
      paragraphIndex: number;
      splitAfterSentence: number;
      firstHalf: string;
      secondHalf: string;
    }
  | {
      kind: 'transformative_rewrite';
      /**
       * >50% of the paragraphs are overhauled with non-voice-preserving
       * replacements. Each replacement MUST have < 0.30 Jaccard overlap
       * with EVERY old paragraph in the source essay so the diff
       * classifies each as paragraph_added + the corresponding old
       * paragraph as paragraph_removed (no overlap-pairing rescue).
       *
       * Edit-shape semantics for downstream remap:
       *   - Untouched paragraphs (NOT in `edits[]`) match by hash → identity.
       *   - Rewritten paragraphs (in `edits[]`) have <0.30 overlap with
       *     anything → iter-1 ancestor at that index is classified
       *     paragraph_deleted; iter-2 paragraph at that index is
       *     paragraph_added. Any iter-1 prior move on a rewritten
       *     paragraph DROPS.
       *
       * The fixture is responsible for guaranteeing the <0.30 overlap
       * property — typically by writing replacement content with
       * disjoint vocabulary from the original (different scene, different
       * domain, different verb register).
       *
       * Mode-selection trigger:
       *   - In production, this edit shape triggers Rule 4
       *     (paragraphsAdded > 0 OR paragraphsRemoved > 0) before Rule 5
       *     (transformative significance) gets a chance. Both routes lead
       *     to comprehensive mode; Rule 4 is the proximate cause.
       *
       * [Phase-1 Item 3 closure 2026-04-30] Added per
       * docs/audit/phase-1-integrity-audit.md §6 #3.
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
    // [D-1.15.6a closure 2026-04-30] Edit shape replaced. Originally these
    // were full-paragraph rewrites — but Tue's product-direction clarification
    // (2026-04-30) is that the system tests improvement paths that PRESERVE
    // voice and authentic meaning, not full rewrites. Each entry below
    // changes exactly ONE sentence per paragraph (the kind of surgical
    // coaching-style improvement the system actually encourages: replace a
    // cliché with concrete sensory detail, tighten a grammatical mess,
    // sharpen a vague verb). Surrounding sentences are preserved verbatim
    // so overlap with the original stays well above the 0.30 threshold,
    // computeEditDiff classifies each as `modified` (not remove+add), and
    // all 4 iter-1 priors survive into iter-2's priorAnnotations Map with
    // landing detection firing on each.
    edits: [
      {
        paragraphIndex: 0,
        // Surgical change: clichéd "Classmates even smirked" + filler
        // dialogue → sharper single classmate + concrete noun. First and
        // third sentences identical.
        newParagraphText:
          "The first day I rolled [Name's] wheelchair around school, people stared and whispered about him. One classmate snickered, \"This will land you an automatic A in service hours.\" Dumbstruck by the lack of empathy around me, I picked my jaw up off the ground and replied, \"[Name] isn't some charity project for his incurable cancer. He is my friend.\"",
      },
      {
        paragraphIndex: 2,
        // Surgical change: clichéd "fight alongside him during his battle"
        // → concrete action paired with sensory specificity. First, second,
        // and fourth sentences identical.
        newParagraphText:
          "Weeks following, I hosted a [Cancer] Awareness Week to help my peers to not only empathize with [Name], but also see life through his eyes. Through spending time with [Name], I've been inspired by his positive outlook. I wanted to show him that his school community would walk into the same waiting rooms he walked into, learn the same vocabulary his doctors used. As people began to put their priorities in perspective, hundreds of community members participated in the walkathons and school fundraisers that I hosted for him, raising $15,000 to ease his family's financial burden for his monthly treatments.",
      },
      {
        paragraphIndex: 3,
        // Surgical change: tighten the grammatically tangled second
        // sentence ("The shortsightedness in... are meaningless without...")
        // into clean parallel construction. First sentence identical.
        newParagraphText:
          "Today, as we walk down the halls together, classmates still stare–they stare with admiration as they give [Name] a warm \"What's up!\" Through my friendship with [Name], both my community and I understand the lesson most adults only learn at the end of their lives: the race to superficial success goes flat without the people we forget to thank along the way.",
      },
    ],
  },
  expectedMode: 'comprehensive',
  // [D-1.15.6a closure 2026-04-30] Per Tue's product-direction clarification:
  // the system tests voice-preserving surgical improvements, not full
  // rewrites. Each iter-2 edit modifies one sentence per paragraph; the
  // surrounding text is preserved. Overlap with each original paragraph
  // stays well above the 0.30 threshold (editUnderstandingService.ts:374),
  // so computeEditDiff classifies each as `modified` rather than
  // remove+add. paragraphRemapBuilder threads all 4 iter-1 priors through
  // to iter-2; landing-detection fires on every prior; the priorAnnotations
  // Map populates fully. This is the multi-survivor cascade the spec
  // intended — 4 surviving priors, 4 landing detections, full carry-forward
  // arbitration spine exercised.
  provenance:
    'UCLA cancer-awareness 2029 admitted essay (elite-examples-2025.ts:ucla-cancer-awareness-2029); 4 paragraphs. Multi-paragraph-cascade scenario applies surgical voice-preserving improvements to P0, P2, P3 (one sentence per paragraph, surrounding text preserved verbatim — the kind of coaching-style edit the system encourages). Overlap stays above 0.30 → computeEditDiff classifies each as `modified`; paragraphRemapBuilder threads all 4 iter-1 priors through to iter-2; landing detection fires on every prior. Tests the multi-survivor cascade carry-forward arbitration spine: 4 simultaneous landing detections + iter-2 commit shape with editScope.paragraphsChanged covering [0,2,3].',
};

/**
 * Scenario 6: paragraph merge — combine UCB cell-tower's P1 (the letter-on-
 * the-door discovery) with P2 (the 48-hour mobilization opener) into a
 * single paragraph at iter-2 index 1. Net paragraph count: 5 → 4. Tests
 * the multi-paragraph collapse path: the merged paragraph pairs with
 * iter-1 P1 via overlap (P1's content is fully preserved in the merged
 * text), and iter-1 P2's prior move DROPS via paragraph_deleted because
 * its content has no remaining unpaired counterpart in iter-2.
 *
 * [Phase-1 Item 1 closure 2026-04-30] Added per
 * docs/audit/phase-1-integrity-audit.md §6 #1.
 */
export const SCENARIO_6_PARAGRAPH_MERGE: Scenario = {
  id: 'scenario-6-paragraph-merge',
  essayText: eliteEssayText('ucb-cell-tower-2029'),
  iter1MoveAnchors: [
    // Anchors on every paragraph maximize merge-coverage diagnostic value:
    //   - P0 stays at iter-2 P0 (identity, hash match) → survives
    //   - P1 pairs with the merged iter-2 P1 via overlap → survives (modified)
    //   - P2 has no pair (its content folded into merged P1, but iter-1 P1
    //     already claimed that pairing) → DROPS as paragraph_deleted
    //   - P3 shifts to iter-2 P2 (-1 from merge) → survives (hash identity)
    //   - P4 shifts to iter-2 P3 (-1 from merge) → survives (hash identity)
    //
    // Net detector calls: 4 (P0/P1/P3/P4 survive; P2 drops before detection).
    { paragraphIndex: 0 },
    { paragraphIndex: 1 },
    { paragraphIndex: 2 },
    { paragraphIndex: 3 },
    { paragraphIndex: 4 },
  ],
  edit: {
    kind: 'paragraph_merge',
    firstIndex: 1,
    secondIndex: 2,
    // Merged paragraph: ALL of iter-1 P1 (so overlap with P1 is ~1.0,
    // dominantly > 0.30) PLUS the first sentence of iter-1 P2 (the
    // "Within the next 48-hours" mobilization opener). This keeps the
    // narrative arc continuous — letter discovery flows directly into
    // mobilization — the kind of merge a coach surfaces when the original
    // P1→P2 transition reads jumpy. Overlap with iter-1 P2 stays low
    // (single-sentence overlap on a 3-sentence source paragraph) so
    // greedy pairing prefers P1 → merged; P2 → unpaired → deleted.
    mergedText:
      "Driving up to my front door, I found a letter taped on my front door in bold letters: \"VERIZON'S CELLULAR TOWER INSTALLATION\". \"Who-the-what-now!?\" I exclaimed as I found that 5 houses had received same notice. After researching the effects of cellular towers, I found that close vicinity to one would put my family at a high risk of cancer. Within the next 48-hours before the tower's approval at City Hall, I rallied everyone and their grandmas to be proactive for the sake of their health.",
  },
  expectedMode: 'comprehensive',
  provenance:
    'UCB cell-tower 2029 admitted essay (elite-examples-2025.ts:ucb-cell-tower-2029); 5 paragraphs; political-advocacy narrative. Paragraph-merge scenario combines P1 (letter discovery) with P2 (48-hour mobilization opener) into a single paragraph at iter-2 index 1 — the kind of "tighten this jumpy transition" coaching edit. Net paragraph count: 5 → 4. Tests overlap-pairing greediness (iter-1 P1 wins the merged-paragraph pairing) AND drop-on-no-pair (iter-1 P2 prior DROPS via paragraph_deleted). Comprehensive mode triggered by Rule 4 (paragraph removed) at FocusedAnalyzer.selectAnalysisMode.',
};

/**
 * Scenario 7: paragraph split — split Harvard MITES essay's P3 (the long
 * closing paragraph) into two paragraphs after its first sentence. Net
 * paragraph count: 4 → 5. Tests the structural-add path where one half
 * pairs via overlap (modified) and the other half is structurally NEW
 * (paragraph_added; no priorAnnotations entry).
 *
 * Split point: after the first sentence ("As the program progressed I
 * only felt more comfortable and safe, enough so to even go up and speak
 * at a family meeting."). Both halves have overlap > 0.30 with the
 * original P3 (each is a verbatim subset). Measured values:
 *   - firstHalf vs iter-1 P3 ≈ 0.367
 *   - secondHalf vs iter-1 P3 ≈ ~0.81
 *
 * paragraphRemapBuilder Phase-2 (paragraphRemapBuilder.ts:208) iterates
 * `unpairedNewIndices` in insertion order (low-to-high paragraph index)
 * and for each unpaired new, finds the best unpaired old. Since iter-2
 * P3 (firstHalf) appears BEFORE iter-2 P4 (secondHalf) in the new
 * indices, firstHalf is processed first and pairs with iter-1 P3
 * (the only unpaired old, overlap > 0.30). secondHalf is processed
 * next, finds no remaining unpaired old, and is classified as
 * paragraph_added.
 *
 * Effect: iter-1 P3 prior pairs with iter-2 P3 (firstHalf, modified).
 * The new iter-2 P4 (secondHalf) has no iter-1 ancestor.
 *
 * [Investigation note 2026-04-30] This pairing direction is the
 * OPPOSITE of the naive "highest overlap wins" intuition: structural
 * position (insertion order in newParas) drives Phase-2 tiebreak when
 * multiple news qualify for the same old. The smoke test's overlap-
 * threshold sentinels lock this behavior in.
 *
 * [Phase-1 Item 2 closure 2026-04-30] Added per
 * docs/audit/phase-1-integrity-audit.md §6 #2.
 */
export const SCENARIO_7_PARAGRAPH_SPLIT: Scenario = {
  id: 'scenario-7-paragraph-split',
  essayText: eliteEssayText('harvard-mites-2029'),
  iter1MoveAnchors: [
    // P1 stays at iter-2 P1 (identity); P3 shifts to iter-2 P3 (the
    // first-half / firstHalf paragraph) via Phase-2 first-seen-new
    // pairing. Two priors → two detector calls. The new iter-2 P4
    // (secondHalf) has no entry.
    { paragraphIndex: 1 },
    { paragraphIndex: 3 },
  ],
  edit: {
    kind: 'paragraph_split',
    paragraphIndex: 3,
    splitAfterSentence: 0,
    // First half: only the opening sentence of iter-1 P3.
    // Jaccard overlap with iter-1 P3 ≈ 0.367 (above the 0.30 threshold —
    // qualifies for Phase-2 pairing).
    firstHalf:
      'As the program progressed I only felt more comfortable and safe, enough so to even go up and speak at a family meeting.',
    // Second half: sentences 2-4 of iter-1 P3 verbatim.
    // Jaccard overlap with iter-1 P3 ≈ 0.81. Both halves qualify for
    // Phase-2 pairing, but Phase-2's first-seen-new iteration order
    // (paragraphRemapBuilder.ts:208) means firstHalf is paired first
    // and consumes the only unpaired-old slot. secondHalf becomes
    // paragraph_added by exclusion.
    secondHalf:
      'These people, this family, treated me right. I gained priceless confidence, social skills, self-worth, empathetic ability, and mental fortitude to take with me and grow on for the rest of my life. Through all of this somehow cutting out the biggest part of my diet became the least impactful part of my summer.',
  },
  expectedMode: 'comprehensive',
  provenance:
    'Harvard MITES 2029 admitted essay (elite-examples-2025.ts:harvard-mites-2029); 4 paragraphs. Paragraph-split scenario splits the closing paragraph (P3) after its first sentence — the "give the family-meeting realization beat its own paragraph" coaching edit. Net paragraph count: 4 → 5. Both split halves have overlap > 0.30 with iter-1 P3 (firstHalf ≈ 0.37, secondHalf ≈ 0.81); Phase-2 first-seen-new iteration assigns iter-1 P3 → firstHalf (the lower-indexed unpaired new), making secondHalf paragraph_added by exclusion. Iter-1 P3 prior threads to iter-2 Map key 3. Comprehensive mode triggered by Rule 4 (paragraph added) at FocusedAnalyzer.selectAnalysisMode.',
};

/**
 * Scenario 8: transformative pure-rewrite — replace 3 of 4 paragraphs in
 * the UCLA cancer-awareness essay with non-voice-preserving overhauls
 * (different domain entirely: a robotics-competition narrative). Each
 * replacement uses disjoint vocabulary from EVERY old paragraph so the
 * Jaccard overlap stays well below the 0.30 threshold, and computeEditDiff
 * classifies each pair as remove+add rather than modified.
 *
 * P2 (the "Cancer Awareness Week" beat) is preserved verbatim — the only
 * paragraph that survives the rewrite. This is the canonical "topic-pivot"
 * edit shape: a coach who flagged the original essay as off-prompt and
 * the student wholesale-rewrote 75% of it, retaining one anchor beat for
 * continuity (or because the student didn't get to that part of the
 * rewrite yet).
 *
 * Effect on iter-1 priors:
 *   - P0 prior: DROPPED (overlap < 0.30 with all iter-2 paragraphs)
 *   - P1 prior: DROPPED (same)
 *   - P2 prior: identity-remap to iter-2 P2 (hash match) → survives
 *   - P3 prior: DROPPED
 *
 * Detector calls: 1 (only the surviving P2 prior).
 * structural counts: added=3, removed=3, reordered=false.
 *
 * Mode-selection: Rule 4 (paragraphsAdded > 0 OR paragraphsRemoved > 0)
 * fires before Rule 5 (transformative significance) gets a chance — both
 * lead to comprehensive, but Rule 4 is the proximate trigger.
 *
 * [Phase-1 Item 3 closure 2026-04-30] Added per
 * docs/audit/phase-1-integrity-audit.md §6 #3.
 */
export const SCENARIO_8_TRANSFORMATIVE_REWRITE: Scenario = {
  id: 'scenario-8-transformative-rewrite',
  essayText: eliteEssayText('ucla-cancer-awareness-2029'),
  iter1MoveAnchors: [
    // Anchors on all 4 paragraphs maximize drop-coverage diagnostic value:
    // 3 of 4 priors should DROP (P0, P1, P3 are rewritten); 1 survives
    // (P2 is preserved verbatim → hash-identity remap → detector fires
    // for that one move).
    { paragraphIndex: 0 },
    { paragraphIndex: 1 },
    { paragraphIndex: 2 },
    { paragraphIndex: 3 },
  ],
  edit: {
    kind: 'transformative_rewrite',
    // Robotics-competition narrative — disjoint vocabulary from cancer-
    // awareness narrative. Each new paragraph uses domain-specific words
    // (chassis, autonomous, scrimmage, controller, regional) that don't
    // appear in any original paragraph; common words are minimized.
    // Verified by hand: Jaccard overlap with each iter-1 paragraph is
    // well below 0.30. (Per LLM-first design: this is fixture-level
    // verification — the assertion downstream pins Map size === 1 +
    // detector calls === 1 as deliberate sentinels for the threshold,
    // mirroring Scenario 5's threshold-sentinel discipline.)
    edits: [
      {
        paragraphIndex: 0,
        newParagraphText:
          "Our robotics chassis tipped over during the regional scrimmage, scattering plastic gears across the field. Chen, our captain, just laughed and grabbed her controller — she had built this thing six times before, and tipping was just data. I knelt beside the autonomous module trying to remember the wiring diagram I had memorized three weeks earlier.",
      },
      {
        paragraphIndex: 1,
        newParagraphText:
          "Engineering club had taught me that prototypes fail in proportion to how much you trusted the simulation. The simulation had said our gear ratio was fine. The pavement said otherwise. I rebuilt the drivetrain twice that night using zip-ties and a 3D-printed coupler I sketched on graph paper.",
      },
      // P2 (paragraphIndex: 2) is INTENTIONALLY ABSENT from edits[] — it
      // remains verbatim from iter-1 so iter-1 P2's prior survives via
      // hash-identity remap. This is the load-bearing detail of the
      // scenario: it proves that even under transformative rewrite,
      // ONE surviving anchor is sufficient to fire the D-1.6.5 wire and
      // populate landing on the surviving move.
      {
        paragraphIndex: 3,
        newParagraphText:
          "We placed seventh that weekend — not what we wanted, but enough to qualify. Driving home in Chen's mom's minivan, I realized engineering rewards you for staying inside the failure long enough to map it. The next morning I sketched a new chassis on the back of my homework. Three months later we won state.",
      },
    ],
  },
  expectedMode: 'comprehensive',
  provenance:
    'UCLA cancer-awareness 2029 admitted essay (elite-examples-2025.ts:ucla-cancer-awareness-2029); 4 paragraphs. Transformative-rewrite scenario replaces P0/P1/P3 (75% — exceeds the >50% spec threshold) with a disjoint-domain robotics-competition narrative; P2 preserved verbatim. Each replacement has Jaccard overlap < 0.30 with every iter-1 paragraph → computeEditDiff classifies each as paragraph_added + iter-1 paragraph as paragraph_removed (not modified). 3 of 4 iter-1 priors DROP via paragraph_deleted; 1 survives via hash-identity remap. Tests the maximum-drop case the spec contemplates: detector calls = 1 (not 4), Map size = 1, structural counts {added: 3, removed: 3, reordered: false}. Comprehensive mode triggered by Rule 4 (paragraphsAdded > 0 OR paragraphsRemoved > 0) at FocusedAnalyzer.selectAnalysisMode — Rule 4 fires before Rule 5 (transformative significance) gets a chance, but both lead to comprehensive.',
};

// ─── Public registry ────────────────────────────────────────────────────

/**
 * All scenarios in spec order. The integration test imports this array
 * (or specific scenarios by name) and runs assertions. The registry shape
 * makes it easy to: (i) add new scenarios for future deliverables, (ii)
 * generate parameterized assertions, (iii) verify spec-completeness at
 * a glance (count === 8: 5 spec-original + 3 deferred-item closures).
 *
 * Edit-shape coverage (8 total):
 *   1. small_edit (Scenario 1)
 *   2. structural_reorder (Scenario 2)
 *   3. paragraph_delete (Scenario 3)
 *   4. paragraph_insert (Scenario 4)
 *   5. multi_paragraph_cascade (Scenario 5)
 *   6. paragraph_merge (Scenario 6) — Phase-1 Item 1 closure
 *   7. paragraph_split (Scenario 7) — Phase-1 Item 2 closure
 *   8. transformative_rewrite (Scenario 8) — Phase-1 Item 3 closure
 */
export const D1_15_SCENARIOS: Scenario[] = [
  SCENARIO_1_SMALL_EDIT,
  SCENARIO_2_STRUCTURAL_REORDER,
  SCENARIO_3_PARAGRAPH_DELETE,
  SCENARIO_4_PARAGRAPH_INSERT,
  SCENARIO_5_MULTI_PARAGRAPH_CASCADE,
  SCENARIO_6_PARAGRAPH_MERGE,
  SCENARIO_7_PARAGRAPH_SPLIT,
  SCENARIO_8_TRANSFORMATIVE_REWRITE,
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

    case 'paragraph_merge': {
      // Range guards: both indices must be in the paragraph array AND
      // adjacent (secondIndex === firstIndex + 1). Adjacency is the
      // semantic invariant — merging non-adjacent paragraphs would either
      // (a) reorder content (which is structural_reorder territory), or
      // (b) require a different scenario kind (`merge_disjoint`) the spec
      // does not contemplate. Surface the violation rather than silently
      // applying a non-adjacent merge.
      if (edit.firstIndex < 0 || edit.firstIndex >= paras.length) {
        throw new Error(
          `[d1-15/scenarios] paragraph_merge.firstIndex=${edit.firstIndex} out of range; ` +
            `essay has ${paras.length} paragraphs`,
        );
      }
      if (edit.secondIndex < 0 || edit.secondIndex >= paras.length) {
        throw new Error(
          `[d1-15/scenarios] paragraph_merge.secondIndex=${edit.secondIndex} out of range; ` +
            `essay has ${paras.length} paragraphs`,
        );
      }
      if (edit.secondIndex !== edit.firstIndex + 1) {
        throw new Error(
          `[d1-15/scenarios] paragraph_merge requires adjacent indices ` +
            `(secondIndex === firstIndex + 1); got firstIndex=${edit.firstIndex}, secondIndex=${edit.secondIndex}`,
        );
      }
      const out = [...paras];
      // Replace firstIndex with mergedText; remove secondIndex.
      out[edit.firstIndex] = edit.mergedText;
      out.splice(edit.secondIndex, 1);
      return out.join('\n\n');
    }

    case 'paragraph_split': {
      if (edit.paragraphIndex < 0 || edit.paragraphIndex >= paras.length) {
        throw new Error(
          `[d1-15/scenarios] paragraph_split.paragraphIndex=${edit.paragraphIndex} out of range; ` +
            `essay has ${paras.length} paragraphs`,
        );
      }
      const out = [...paras];
      // Replace target paragraph with two paragraphs (firstHalf, secondHalf).
      out.splice(edit.paragraphIndex, 1, edit.firstHalf, edit.secondHalf);
      return out.join('\n\n');
    }

    case 'transformative_rewrite': {
      // Range guards on every entry. Same semantics as multi_paragraph_cascade
      // (later entries see earlier mutations) — but transformative_rewrite
      // is conceptually different: replacements are non-voice-preserving
      // (low overlap), whereas multi_paragraph_cascade replacements are
      // voice-preserving (high overlap, modified-classified).
      const out = [...paras];
      for (const e of edit.edits) {
        if (e.paragraphIndex < 0 || e.paragraphIndex >= out.length) {
          throw new Error(
            `[d1-15/scenarios] transformative_rewrite.edits paragraphIndex=${e.paragraphIndex} out of range; ` +
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
    case 'paragraph_merge':
      // Both indices participate — the merged paragraph occupies firstIndex
      // and secondIndex's content is folded in (then secondIndex removed).
      return [edit.firstIndex, edit.secondIndex];
    case 'paragraph_split':
      // The split target — only one paragraph index is "edited" in iter-1
      // indexing space (the new paragraph is structurally added at
      // paragraphIndex+1 in iter-2 space, but editScope.paragraphsChanged
      // tracks iter-1-indexed change locations).
      return [edit.paragraphIndex];
    case 'transformative_rewrite':
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
    case 'paragraph_merge':
      // Merging two paragraphs collapses one — structural shape change,
      // significance is architectural (identical category to delete since
      // net paragraph count drops by 1).
      return 'significant';
    case 'paragraph_split':
      // Splitting one paragraph into two adds one — structural shape
      // change, significance is architectural (identical category to
      // insert since net paragraph count rises by 1).
      return 'significant';
    case 'transformative_rewrite':
      // >50% of paragraphs replaced with non-voice-preserving overhauls.
      // This is the canonical 'transformative' label; the LLM
      // edit-understanding service produces this exact category for
      // pure rewrites with low cross-version overlap.
      return 'transformative';
  }
}
