// ============================================================================
// D-1.15 Item 6 sibling closure — analyzeEdit-brief-fidelity (2026-04-30)
// ============================================================================
//
// Spec: docs/audit/phase-1-integrity-audit.md §6 Item 6 — sibling fidelity
//   gap surfaced by Item 6's three-agent audit (round-1 MED finding,
//   2026-04-30). Item 6 closed the brief→editScope translation hop, but
//   left the production Sonnet call that drives the EditUnderstanding
//   that flows into the brief untested. This file closes that sibling.
//
// What this file tests:
//   The full production chain that Item 6 honestly named as
//   `analyzeEdit-brief-fidelity-untested` at
//   `tests/integration/d1-15-brief-editscope-translation.test.ts:13-44`:
//
//     [HOP 1, REAL]    (oldText, newText) → computeEditDiff (mechanical, no API)
//     [HOP 2a, REAL]   editUnderstandingService.understandEdit (Sonnet API)
//                        → EditUnderstanding {significance, changeType, ...}
//     [HOP 2b, REAL]   versionTracker.recordEdit + generateReanalysisBrief
//                        (mechanical aggregation; no API)
//                        → ReanalysisBrief
//     [HOP 3, REAL]    buildEditScopeFromBrief
//                        → IterationRecord.editScope
//
// Note on naming:
//   The Item 6 audit named the missing call site as
//   `editUnderstandingService.analyzeEdit`. The production method is
//   actually `understandEdit` (the audit's "analyzeEdit" was a working
//   name); the deliverable name `analyzeEdit-brief-fidelity` is preserved
//   for traceability with the audit doc. The Sonnet boundary IS
//   `understandEdit`. The brief synthesis itself
//   (`versionTracker.generateReanalysisBrief`) is mechanical — no LLM —
//   but it depends on each PendingChange's `understanding.changeType`
//   and `understanding.significance`, which ARE LLM-derived via
//   understandEdit's Sonnet call. So driving the real understandEdit IS
//   driving the real Sonnet contribution to the brief.
//
// Why two surfaces:
//   1. CAPTURED-FIXTURE REPLAY (always-on, deterministic). Mocks
//      callClaudeWithRetry to replay a recorded EditUnderstanding output.
//      Drives the real chain (real versionTracker, real
//      generateReanalysisBrief, real buildEditScopeFromBrief). Pins down
//      the chain integrity contract independent of LLM nondeterminism.
//   2. REAL-API RUN (gated by RUN_ANALYZE_EDIT_FIDELITY=1). Same chain,
//      real understandEdit Sonnet call. Asserts contract holds against
//      live LLM output (with looser bounds for LLM-derived fields). Use
//      to verify the captured fixture is still representative or to
//      re-record after a prompt change.
//
//   Captured-fixture replay is the same pattern D-1.15 used for
//   landing-detector calibration: deterministic CI gate + opt-in real-API
//   re-capture. The CAPTURED_SONNET_RAW fixture below is INITIAL —
//   schema-aligned to the editUnderstandingService Sonnet output contract
//   (validateSignificance + validateChangeType + the JSON shape at
//   editUnderstandingService.ts:702-724). It MUST be replaced with a
//   real-API capture before this test gates Phase 2 closure decisions
//   on its assertions about LLM-DERIVED fields. The chain-integrity
//   assertions (HOP 2b → HOP 3 plumbing) are valid against either the
//   schema-aligned fixture or a real capture, because they test the
//   plumbing, not the LLM judgment. To re-record:
//     RUN_ANALYZE_EDIT_FIDELITY=record \
//       npx vitest run tests/integration/d1-15-analyze-edit-brief-fidelity.test.ts
//   Then paste the logged JSON into CAPTURED_SONNET_RAW.
//
// LLM-first compliance (per feedback_llm-first-design.md):
//   - No closed taxonomies introduced. The test ASSERTS that the LLM-
//     produced changeType is in the validated set, but that set is
//     editUnderstandingService.ts's existing VALID_CHANGE_TYPES — not
//     a new closed taxonomy.
//   - No `?? 'medium'` centrist defaults introduced. The captured
//     fixture replays a specific LLM-said significance; the assertions
//     check shape integrity, not enforce a default.
//   - No banned-phrase regex. The fixture captures actual prose; the
//     test asserts it is non-empty, not that it matches a pattern.
//   - No mandatory-field gate beyond what the production parser already
//     enforces (significance, changeType, profileImpact required by
//     editUnderstandingService.ts:1352-1356).
//
// Diagnosability principle (per Tue's 2026-04-30 directive): each
// describe block names the contract it pins down. When a test fails,
// the failure points at one specific contract — not "the chain is
// broken somewhere."

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — the mock factory runs before any import that
// pulls callClaudeWithRetry transitively (which editUnderstandingService
// does at module load).
// [Item 6 sibling closure: analyzeEdit-brief-fidelity 2026-04-30]
// We mock callClaudeWithRetry rather than callClaude because that's the
// boundary editUnderstandingService imports directly. The retry layer
// itself is unit-tested separately (tests/unit/llm-retry.test.ts), so
// mocking at the retry boundary is safe.
//
// We preserve the actual module's other exports (calculateCost, types,
// constants, etc.) via vi.importActual so editUnderstandingService's
// other imports (calculateCost is read at lines 1160 + 1290 + 1329)
// keep working. The async-factory + vi.importActual + spread pattern
// matches the working d1-8-prior-annotations-wireup test (line 47-55).
//
// CRITICAL: do NOT add `vi.unmock('../../src/lib/llm/claude')` anywhere
// in this file. vi.unmock is hoisted alongside vi.mock — a single
// vi.unmock anywhere in this file silently cancels the mock at hoist
// time, leaving the real callClaudeWithRetry exposed. The real-API
// gated test at the bottom uses mockImplementation(actualFn) instead
// to call through to the real path, which is the canonical "partial
// mock with selective real-API call-through" pattern.
vi.mock('../../src/lib/llm/claude', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/llm/claude')>(
    '../../src/lib/llm/claude',
  );
  return {
    ...actual,
    callClaudeWithRetry: vi.fn(),
    // Mock callClaude too because callClaudeWithRetry delegates to it
    // (claude.ts:764). Belt-and-suspenders against silent real-API hits.
    callClaude: vi.fn(),
  };
});

import { callClaudeWithRetry } from '../../src/lib/llm/claude';
import type { ClaudeResponse } from '../../src/lib/llm/claude';
import {
  editUnderstandingService,
  splitParagraphs,
} from '../../src/services/essayIntelligence/analysis/editUnderstandingService';
import { buildEditScopeFromBrief } from '../../src/services/essayIntelligence/analysis/editScopeBuilder';
import { VersionTracker } from '../../src/services/essayIntelligence/versionTracker';
import { ProfileRouter } from '../../src/services/essayIntelligence/profileManager/profileRouter';
import { createInitialProfile } from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import type {
  EssayProfile,
  ReanalysisBrief,
  EditChangeType,
} from '../../src/services/essayIntelligence/profileTypes';

const mockCallClaudeWithRetry = vi.mocked(callClaudeWithRetry);

// ─── Fixture: (oldText, newText) pair derived from piano essay ────────────

/**
 * The fixture exercises a SINGLE-PARAGRAPH MODIFIED edit on a real essay
 * paragraph. This is intentionally the cheapest meaningful shape:
 *   - Real essay text (not a contrived toy)
 *   - One word-level change inside one sentence
 *   - High overlap (>30%) so computeEditDiff classifies as 'modified',
 *     not as add+remove (which would be a different code path)
 *   - Specific enough to drive a non-trivial Sonnet response (the change
 *     shifts "captivated" → "transfixed", which is a tonal/register edit)
 *
 * The change matches the MODERATE significance anchor in the system
 * prompt (editUnderstandingService.ts:591-593): "Changes meaning within
 * a sentence without structural ripple."
 *
 * Cost estimate: input ~500 tokens (essay + system prompt) +
 * output ~300 tokens = ~$0.005-0.01 for the Sonnet call,
 * + ~$0.001 for the Haiku triviality filter. Total ~$0.01-0.02
 * per real-API run, well under the deliverable's <$0.10 ceiling.
 */
const FIXTURE_OLD_TEXT = `From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound. With just seven notes, I could weave melodies that tell stories, evoke emotions, and connect deeply with others. Music became my language—a blend of expression and analytical thinking that challenged me to innovate within rhythm and harmony's constraints.

Composing is like solving a puzzle; each note and chord must align perfectly to convey the intended emotion. I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood. It wasn't just about creating something new but expressing a part of myself through each composition.`;

const FIXTURE_NEW_TEXT = `From the moment my fingers first danced across the piano keys, I was transfixed by the power to create worlds through sound. With just seven notes, I could weave melodies that tell stories, evoke emotions, and connect deeply with others. Music became my language—a blend of expression and analytical thinking that challenged me to innovate within rhythm and harmony's constraints.

Composing is like solving a puzzle; each note and chord must align perfectly to convey the intended emotion. I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood. It wasn't just about creating something new but expressing a part of myself through each composition.`;

/**
 * Captured EditUnderstanding output — the SonnetUnderstandingRaw shape
 * editUnderstandingService.understandEdit's Sonnet call would produce on
 * the (FIXTURE_OLD_TEXT, FIXTURE_NEW_TEXT) pair.
 *
 * RECORDING PROVENANCE: this fixture is hand-aligned to the
 * editUnderstandingService Sonnet output schema (the SonnetUnderstandingRaw
 * shape declared at editUnderstandingService.ts:98-127, with the JSON
 * structure required by the system prompt at lines 702-724). The
 * specific *judgments* in this fixture (significance='moderate',
 * changeType='word_refinement', etc.) are believable for a single-word
 * register-shift edit on the piano essay, but they are NOT a real-API
 * capture — they are the test author's best-effort prediction of what
 * the production Sonnet call would produce on this (oldText, newText)
 * pair given the system prompt's calibration anchors.
 *
 * To replace this with a true real-API capture (which de-risks any
 * drift between hand-aligned and live LLM output), run:
 *   RUN_ANALYZE_EDIT_FIDELITY=record \
 *     npx vitest run tests/integration/d1-15-analyze-edit-brief-fidelity.test.ts
 * The gated describe block at the bottom of this file logs the
 * captured EditUnderstanding to stdout. Paste that JSON over this
 * constant and remove this caveat once the recording lands.
 *
 * Critically: the CHAIN-INTEGRITY assertions in this file (HOP 2b →
 * HOP 3 plumbing) hold under either fixture variant — they test how
 * versionTracker / generateReanalysisBrief / buildEditScopeFromBrief
 * propagate whatever EditUnderstanding the LLM returns. The LLM-
 * judgment assertions (e.g., `expect(...significance).toBe('moderate')`)
 * are the only ones that depend on the captured fixture being
 * representative, and even those are bounded — once a real capture
 * lands, those exact-equality assertions can be tightened with
 * confidence; until then they pin the schema-aligned fixture.
 *
 * The shape MUST satisfy the editUnderstandingService.ts validators:
 *   - significance ∈ {minor, moderate, significant, transformative}
 *     (validateSignificance at line 1040)
 *   - changeType ∈ VALID_CHANGE_TYPES (validateChangeType at line 1029)
 *   - profileImpact, scopeRecommendation present (line 1352-1366)
 *   - purposeConfidence in [0, 1] (clamped at line 1410)
 */
const CAPTURED_SONNET_RAW = {
  significance: 'moderate' as const,
  significanceReasoning:
    "MODERATE. 'captivated' → 'transfixed' shifts the sentence's emotional register from generic enchantment toward something more bodily and arrested — the speaker's response moves from a soft-focus 'taken with' to a sharper 'cannot look away.' P0S0's understanding (the opening hook) needs updating: the sentence's tonal contribution to voiceMap entry [opening] shifts marginally, but the paragraph's structural role (P0: opens the music thread with an origin moment) is unchanged. No connections traverse this sentence in the connection graph.",
  changeType: 'word_refinement' as EditChangeType,
  changeTypes: ['word_refinement', 'tonal_voice_shift'] as EditChangeType[],
  apparentPurpose:
    'The student is sharpening the opening hook — replacing a softer enchantment word with a more arrested, embodied one to make the entry into the essay feel more vivid.',
  purposeConfidence: 0.75,
  profileImpact: {
    directImpact:
      "P0S0's observedFunctions and tonalRegister fields need a light update: the sentence shifts from 'soft enchantment' to 'arrested attention.' The voiceMap entry for this opening sentence may shift register by one notch toward bodily/concrete.",
    connectionImpact: [],
    paragraphImpact: null,
    holisticImpact: 'voice_map: opening register shifts marginally; voice_identity unchanged.',
    holisticSections: ['voice_map'],
  },
  scopeRecommendation: {
    scope: 'sentence_update' as const,
    reasoning:
      'sentence_update. Impact is precisely bounded: P0S0 observedFunctions/tonalRegister updates. The paragraph structural role is unchanged. The voiceMap may shift one entry but the underlying voice identity is preserved. No connections involve P0S0 in the connection graph. Scope above sentence_update would be over-broad.',
    targets: ['P0S0', 'voiceMap.opening'],
  },
  unaffectedAreas: [
    'thematic_architecture: the music-as-language thesis is unchanged.',
    'narrative_strategy: the personal-statement arc is unchanged.',
    'character_revelation: no new self-disclosure is added by this swap.',
    'connection graph: no connections traverse P0S0.',
  ],
};

/**
 * The Haiku triviality filter's REAL classification on this edit. The
 * filter system prompt (editUnderstandingService.ts:470-494) explicitly
 * lists "generic → specific" word swaps as REAL.
 */
const CAPTURED_HAIKU_FILTER_RAW = {
  classification: 'REAL' as const,
  reason:
    "Word swap shifts emotional register — affects how the AO experiences the speaker's relationship to music.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Build a Readonly<EssayProfile> from raw essay text, suitable for feeding
 * into understandEdit. Uses createInitialProfile (the production constructor)
 * so the profile shape is canonical — not a hand-rolled stub that drifts
 * from the type. Splits paragraphs via the production splitParagraphs to
 * keep paragraph boundaries identical to what computeEditDiff uses.
 */
function buildProfileForFixture(essayText: string): EssayProfile {
  const paragraphTexts = splitParagraphs(essayText);
  // Sentence split: simple regex matching production's behavior closely
  // enough for the profile's sentence stubs. The exact splitter doesn't
  // matter — understandEdit doesn't read sentence text from the profile;
  // the router does, but only for routing decisions, not for assertion
  // shape. The crucial invariant is paragraphTexts.length matches what
  // computeEditDiff sees.
  const sentenceTexts = paragraphTexts.map((p) =>
    p
      .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );
  const wordCount = essayText.split(/\s+/).filter((w) => w.length > 0).length;

  return createInitialProfile({
    essayText,
    paragraphTexts,
    sentenceTexts,
    metadata: {
      essayType: 'common_app',
      wordCount,
      promptText: 'Tell us about yourself.',
    },
  });
}

/**
 * Wrap a parsed JSON object as a ClaudeResponse — matches the wire format
 * editUnderstandingService consumes when callClaudeWithRetry is invoked
 * with `useJsonMode: true`. With JSON mode, content is the already-parsed
 * object (not a JSON string).
 */
function makeClaudeResponse(content: object): ClaudeResponse<unknown> {
  return {
    content,
    usage: {
      input_tokens: 500,
      output_tokens: 300,
      // cache fields optional — production handles undefined gracefully
    },
    stopReason: 'end_turn',
  };
}

// Real-API gate. Two values:
//   '1' / 'live' — run the real Sonnet call against live API
//   'record'    — run the real Sonnet call AND log the captured output
//                 so it can be pasted back into CAPTURED_SONNET_RAW above
const RUN_REAL_API = process.env.RUN_ANALYZE_EDIT_FIDELITY;
const SHOULD_RUN_REAL_API = !!RUN_REAL_API;

// ─── Surface 1: Captured-fixture replay (deterministic, always-on) ───────

describe('analyzeEdit-brief-fidelity — captured replay: chain integrity (Sonnet → versionTracker → editScope)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drives the full chain and produces an editScope whose shape mirrors the LLM understanding', async () => {
    // Mock the two callClaudeWithRetry invocations the pipeline will make:
    //   call 1: Haiku triviality filter (returns 'REAL')
    //   call 2: Sonnet understanding (returns the captured raw output)
    // The order matches the runtime sequence in understandEdit (filter
    // first, then Sonnet on REAL classification).
    mockCallClaudeWithRetry
      .mockResolvedValueOnce(makeClaudeResponse(CAPTURED_HAIKU_FILTER_RAW) as ClaudeResponse<string>)
      .mockResolvedValueOnce(makeClaudeResponse(CAPTURED_SONNET_RAW) as ClaudeResponse<unknown>);

    // Build a real profile from the OLD text so the router has actual
    // paragraph data (not stub).
    const profile = buildProfileForFixture(FIXTURE_OLD_TEXT);
    const router = new ProfileRouter();

    // ── HOP 2a: Run understandEdit (real EditUnderstandingService logic,
    //           mocked LLM boundary) ──────────────────────────────────
    const editResult = await editUnderstandingService.understandEdit(
      FIXTURE_OLD_TEXT,
      FIXTURE_NEW_TEXT,
      profile,
      router,
    );

    // The mock should have been invoked at least once (Haiku filter)
    // and at most twice (Haiku + Sonnet). Two calls confirms the filter
    // returned REAL and Sonnet was actually invoked — the path we want
    // to test. If filter had returned TRIVIAL, Sonnet would not run and
    // the EditUnderstanding would be the synthesized "trivial" stub.
    expect(mockCallClaudeWithRetry).toHaveBeenCalledTimes(2);

    // The returned EditUnderstandingOutput must have the LLM-derived
    // shape — not the trivial stub.
    expect(editResult.trivialFilter.wasFiltered).toBe(false);
    expect(editResult.output.understanding.significance).toBe('moderate');
    expect(editResult.output.understanding.changeType).toBe('word_refinement');
    expect(editResult.output.understanding.scopeRecommendation.scope).toBe('sentence_update');

    // The diff itself must show this is a single-paragraph modification
    // (the chain assumption: the brief's paragraphsChanged comes from
    // the diff via versionTracker, NOT directly from the LLM).
    expect(editResult.output.diff.paragraphChanges).toHaveLength(1);
    expect(editResult.output.diff.paragraphChanges[0].changeType).toBe('modified');
    expect(editResult.output.diff.paragraphChanges[0].paragraphIndex).toBe(0);

    // ── HOP 2b: Drive versionTracker (real production path; no LLM) ──
    const tracker = new VersionTracker();
    tracker.initialize(FIXTURE_OLD_TEXT);
    tracker.recordEdit(editResult.output, FIXTURE_NEW_TEXT);

    // Brief generation is mechanical aggregation across PendingChanges
    const brief: ReanalysisBrief = tracker.generateReanalysisBrief();

    // Brief invariants from the production aggregation logic
    // (versionTracker.ts:632-778):
    //   - paragraphsChanged includes P0 (the only changed paragraph)
    //   - hasReordering is false (single-word swap, no shift)
    //   - hasInsertions/hasDeletions: derived from understanding.changeType.
    //     'word_refinement' is neither 'addition' nor 'deletion' nor
    //     'reorder', so the structural flags should remain false (the
    //     production fallback at versionTracker.ts:683-686 only flips
    //     them on empty oldText/newText, which doesn't apply here).
    //   - netChanges is non-empty (at least one PendingChange recorded)
    expect(brief.structural.paragraphsChanged).toContain(0);
    expect(brief.structural.hasReordering).toBe(false);
    expect(brief.structural.hasInsertions).toBe(false);
    expect(brief.structural.hasDeletions).toBe(false);
    expect(brief.netChanges.length).toBeGreaterThan(0);
    // The brief's netChanges entries propagate the LLM-derived
    // changeType from understandEdit. No 'paragraph_added' /
    // 'paragraph_removed' entries on a word-level edit.
    for (const entry of brief.netChanges) {
      expect(entry.changeType).not.toBe('paragraph_added');
      expect(entry.changeType).not.toBe('paragraph_removed');
    }

    // ── HOP 3: Translate brief → editScope via the Item 6 helper ─────
    const editScope = buildEditScopeFromBrief(
      'edit',
      brief,
      'moderate',
      ['meaning_evolution'],
    );

    // The full-chain contract:
    //   - editScope.paragraphsChanged tracks brief.structural.paragraphsChanged
    //     (which tracks the diff's modified paragraph)
    //   - structural.added / .removed are 0 because no paragraph_added /
    //     paragraph_removed netChanges exist (single-paragraph word swap)
    //   - structural.reordered is false (no shift in this edit shape)
    expect(editScope?.paragraphsChanged).toEqual(brief.structural.paragraphsChanged);
    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(0);
    expect(editScope?.structural.reordered).toBe(false);
    expect(editScope?.significance).toBe('moderate');
    expect(editScope?.changeTypes).toEqual(['meaning_evolution']);
  });
});

describe('analyzeEdit-brief-fidelity — captured replay: trivial-filter early return short-circuits the chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns trivial-stub understanding without calling Sonnet, and the brief reflects no LLM-derived changeType', async () => {
    // When the Haiku filter returns TRIVIAL, understandEdit short-
    // circuits and never invokes Sonnet. The returned EditUnderstanding
    // is a hard-coded stub (editUnderstandingService.ts:1172-1189) with
    // changeType='word_refinement' and scope='sentence_update'. This
    // test pins down that the chain still produces a valid editScope
    // even on this path — the brief synthesis must not crash on the
    // stub understanding.
    mockCallClaudeWithRetry.mockResolvedValueOnce(
      makeClaudeResponse({
        classification: 'TRIVIAL',
        reason: 'Spelling fix only — no understanding shift.',
      }) as ClaudeResponse<string>,
    );

    const profile = buildProfileForFixture(FIXTURE_OLD_TEXT);
    const router = new ProfileRouter();

    const editResult = await editUnderstandingService.understandEdit(
      FIXTURE_OLD_TEXT,
      FIXTURE_NEW_TEXT,
      profile,
      router,
    );

    // Sonnet was NOT invoked — only the Haiku filter ran.
    expect(mockCallClaudeWithRetry).toHaveBeenCalledTimes(1);
    expect(editResult.trivialFilter.wasFiltered).toBe(true);
    expect(editResult.output.understanding.significance).toBe('minor');

    // Drive the chain on the trivial stub
    const tracker = new VersionTracker();
    tracker.initialize(FIXTURE_OLD_TEXT);
    tracker.recordEdit(editResult.output, FIXTURE_NEW_TEXT);
    const brief = tracker.generateReanalysisBrief();
    const editScope = buildEditScopeFromBrief('edit', brief, 'minor', []);

    // Even on the trivial path, the chain produces a valid editScope.
    // No add/remove counts (still a word-level edit). The structural
    // reordered flag depends on diff alone (no shift), so false.
    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(0);
    expect(editScope?.structural.reordered).toBe(false);
  });
});

describe('analyzeEdit-brief-fidelity — captured replay: brief.netChanges propagates LLM-derived changeType into editScope counts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when the LLM reports changeType='content_expansion' on an added paragraph, the brief's netChanges flows into editScope.structural.added", async () => {
    // This test pins down the cross-hop dependency that the prompt
    // explicitly called out: "the brief's netChanges[] is non-empty
    // and entries have valid changeType strings."
    //
    // Construction: a paragraph-insertion edit. The OLD has 2 paragraphs,
    // the NEW has 3. computeEditDiff classifies P2 as 'added'. When
    // versionTracker.recordEdit synthesizes the PendingChange, it tags
    // the entry with the EditUnderstanding's changeType. For an
    // 'addition' (LLM term) / 'content_expansion' (canonical), the
    // brief's structural.hasInsertions becomes true.
    //
    // Important: versionTracker.ts:679-681 maps understanding.changeType
    // values 'addition' / 'deletion' / 'reorder' to structural flags
    // — but those are LLM-alias values, NOT the canonical
    // EditChangeType set. Production validates with validateChangeType
    // which canonicalizes. So 'content_expansion' (canonical) does NOT
    // trigger hasInsertions; the fallback at line 683-686 (empty
    // oldText/newText inference) handles the structural detection.
    // This test pins that production behavior so a future change to
    // versionTracker's mapping doesn't silently regress the chain.

    const oldText = `P0 first paragraph alpha.\n\nP1 second paragraph beta.`;
    const newText = `P0 first paragraph alpha.\n\nP1 second paragraph beta.\n\nP2 newly inserted third paragraph here.`;

    // Mock filter REAL + Sonnet 'content_expansion' response
    mockCallClaudeWithRetry
      .mockResolvedValueOnce(
        makeClaudeResponse({
          classification: 'REAL',
          reason: 'Paragraph addition — content shifts.',
        }) as ClaudeResponse<string>,
      )
      .mockResolvedValueOnce(
        makeClaudeResponse({
          ...CAPTURED_SONNET_RAW,
          significance: 'significant',
          changeType: 'content_expansion',
          changeTypes: ['content_expansion'],
          significanceReasoning:
            'SIGNIFICANT. New paragraph adds material that may shift the essay arc. Connection graph may extend.',
          scopeRecommendation: {
            scope: 'paragraph_reanalysis',
            reasoning: 'New paragraph needs full role-mapping.',
            targets: ['P2'],
          },
        }) as ClaudeResponse<unknown>,
      );

    const profile = buildProfileForFixture(oldText);
    const router = new ProfileRouter();

    const editResult = await editUnderstandingService.understandEdit(
      oldText,
      newText,
      profile,
      router,
    );

    expect(editResult.output.understanding.changeType).toBe('content_expansion');
    expect(editResult.output.diff.structural.paragraphsAdded).toEqual([2]);

    const tracker = new VersionTracker();
    tracker.initialize(oldText);
    tracker.recordEdit(editResult.output, newText);
    const brief = tracker.generateReanalysisBrief();

    // The brief's structural.paragraphsChanged includes the added paragraph.
    // hasInsertions: production behavior depends on whether versionTracker
    // recognizes 'content_expansion' as an insertion-class changeType.
    // The branch at versionTracker.ts:679-681 maps 'addition' (alias)
    // but NOT 'content_expansion' (canonical), so the structural flag
    // depends on the line 684-686 fallback. We assert what the LLM-
    // derived changeType actually puts on the netChanges entry —
    // whatever the production behavior is, the entry's changeType
    // string flows through honestly.
    expect(brief.structural.paragraphsChanged).toContain(2);
    expect(brief.netChanges.length).toBeGreaterThan(0);
    const insertEntry = brief.netChanges.find((c) => c.location.paragraph === 2);
    expect(insertEntry).toBeDefined();
    // The entry's changeType is the LLM-derived value (validated to
    // canonical form by validateChangeType inside understandEdit).
    expect(insertEntry?.changeType).toBe('content_expansion');

    // ── HOP 3 ───────────────────────────────────────────────────────
    const editScope = buildEditScopeFromBrief(
      'edit',
      brief,
      'significant',
      ['meaning_evolution'],
    );

    // editScope.structural.added counts brief.netChanges entries with
    // changeType 'added' / 'paragraph_added' (per buildEditScopeFromBrief).
    // 'content_expansion' is NOT in that set, so structural.added is 0.
    // This is the LLM-first principle's TRUE TEST: editScope's counts
    // flow directly from netChanges' changeType strings, with no
    // implicit "this looks like an insertion" inference. If a future
    // change adds 'content_expansion' to the counted set, this
    // assertion will flip and the change author will be forced to
    // think about whether canonical changeTypes should drive
    // structural counts.
    // [FORWARD-LINK: structural-counter-canonical-types — if buildEditScope
    //  starts counting 'content_expansion' as an addition, update here.]
    expect(editScope?.structural.added).toBe(0);
    expect(editScope?.structural.removed).toBe(0);
    // paragraphsChanged carries through.
    expect(editScope?.paragraphsChanged).toContain(2);
  });
});

// ─── Surface 2: Real-API gated run ─────────────────────────────────────────
//
// Run with: RUN_ANALYZE_EDIT_FIDELITY=1 npx vitest run \
//   tests/integration/d1-15-analyze-edit-brief-fidelity.test.ts
//
// Run with: RUN_ANALYZE_EDIT_FIDELITY=record npx vitest run \
//   tests/integration/d1-15-analyze-edit-brief-fidelity.test.ts
//   (logs the captured output for re-pasting into CAPTURED_SONNET_RAW)
//
// Cost: ~$0.01-0.02 per run (one Haiku filter + one Sonnet understanding
// call against ~500-input-token essay text). Auto-recorded to
// BUILD_COST_LEDGER.md via claude.ts's instrumentation.

describe.skipIf(!SHOULD_RUN_REAL_API)(
  'analyzeEdit-brief-fidelity — REAL API: chain integrity against live Sonnet',
  () => {
    it('drives the full chain end-to-end against the real LLM and asserts shape contract holds', async () => {
      // CRITICAL: this block runs the real Sonnet call. Cost auto-records
      // to BUILD_COST_LEDGER.md. Hard cap of $9.00 (warn $7.00) enforced
      // at claude.ts:573-574.
      //
      // [Item 6 sibling closure: analyzeEdit-brief-fidelity 2026-04-30]
      // The module-level vi.mock at the top of this file replaces
      // callClaudeWithRetry with a vi.fn(). We CANNOT use vi.unmock here
      // — vi.unmock is hoisted alongside vi.mock, so a vi.unmock call
      // anywhere in this file would silently cancel the mock at hoist
      // time. Instead, we install a mockImplementation that calls
      // through to the real callClaudeWithRetry function (loaded via
      // vi.importActual). This is the canonical vitest "partial mock —
      // some tests use captured fixture, others call through to real
      // implementation" pattern.
      const actual = await vi.importActual<typeof import('../../src/lib/llm/claude')>(
        '../../src/lib/llm/claude',
      );
      mockCallClaudeWithRetry.mockImplementation(actual.callClaudeWithRetry as never);

      const profile = buildProfileForFixture(FIXTURE_OLD_TEXT);
      const router = new ProfileRouter();

      const editResult = await editUnderstandingService.understandEdit(
        FIXTURE_OLD_TEXT,
        FIXTURE_NEW_TEXT,
        profile,
        router,
      );

      // Looser assertions for live LLM output: shape integrity, not
      // exact values. The LLM may classify this as 'minor' or 'moderate'
      // — both are reasonable for a single-word register shift.
      expect(['minor', 'moderate', 'significant']).toContain(
        editResult.output.understanding.significance,
      );
      // changeType must be in the canonical validated set
      expect([
        'word_refinement',
        'meaning_evolution',
        'tonal_voice_shift',
        'content_expansion',
        'content_reduction',
        'structural_reorganization',
      ]).toContain(editResult.output.understanding.changeType);

      // Diff invariants are deterministic (mechanical) regardless of LLM
      expect(editResult.output.diff.paragraphChanges).toHaveLength(1);
      expect(editResult.output.diff.paragraphChanges[0].changeType).toBe('modified');

      // Chain
      const tracker = new VersionTracker();
      tracker.initialize(FIXTURE_OLD_TEXT);
      tracker.recordEdit(editResult.output, FIXTURE_NEW_TEXT);
      const brief = tracker.generateReanalysisBrief();
      const editScope = buildEditScopeFromBrief(
        'edit',
        brief,
        editResult.output.understanding.significance,
        [],
      );

      // Chain integrity contract (regardless of LLM output):
      expect(editScope?.paragraphsChanged).toEqual(brief.structural.paragraphsChanged);
      expect(editScope?.structural.added).toBe(0);
      expect(editScope?.structural.removed).toBe(0);
      expect(editScope?.structural.reordered).toBe(false);
      expect(editScope?.significance).toBe(editResult.output.understanding.significance);

      // Record mode: log the captured Sonnet output for pasting back into
      // CAPTURED_SONNET_RAW above. Look for this in test stdout.
      if (RUN_REAL_API === 'record') {
        // eslint-disable-next-line no-console
        console.log(
          '\n=== CAPTURED_SONNET_RAW (paste this into the constant above) ===\n',
          JSON.stringify(editResult.output.understanding, null, 2),
          '\n=== END CAPTURE ===\n',
        );
      }
    });
  },
);
