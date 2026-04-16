/**
 * Mode Selector — Unit Tests
 *
 * Validates the deterministic structural guardrail in
 * `FocusedAnalyzer.selectAnalysisMode()`. Focus: a single-paragraph content
 * rewrite with unchanged paragraph count/order MUST select `focused`, not
 * `comprehensive`. Comprehensive is reserved for true paragraph-level
 * structural changes (add / remove / reorder).
 *
 * Pure-function test, no LLM calls. Run:
 *   npx tsx tests/unit/mode-selector.test.ts
 */

import { FocusedAnalyzer } from '../../src/services/essayIntelligence/analysis/focusedAnalyzer';
import type {
  EditUnderstandingOutput,
  EditUnderstanding,
  EditDiff,
  EssayProfile,
  ConfidenceLevel,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}\n        expected: ${String(expected)}\n        actual:   ${String(actual)}`);
  }
}

function makeDiff(opts: {
  paragraphsAdded?: number[];
  paragraphsRemoved?: number[];
  paragraphsReordered?: boolean;
  paragraphDelta?: number;
  changedParagraphIndices?: number[];
}): EditDiff {
  const changed = opts.changedParagraphIndices ?? [];
  return {
    structural: {
      paragraphsAdded: opts.paragraphsAdded ?? [],
      paragraphsRemoved: opts.paragraphsRemoved ?? [],
      paragraphsReordered: opts.paragraphsReordered ?? false,
      paragraphDelta: opts.paragraphDelta ?? 0,
    },
    paragraphChanges: changed.map(idx => ({
      paragraphIndex: idx,
      changeType: 'modified' as const,
      sentenceChanges: [
        { sentenceIndex: 0, changeType: 'modified' as const, oldText: 'old', newText: 'new' },
      ],
    })),
    stats: { totalSentencesChanged: changed.length, totalWordsChanged: changed.length * 4, changeRatio: 0.05 },
  };
}

function makeUnderstanding(opts: {
  significance: EditUnderstanding['significance'];
  scope?: EditUnderstanding['scopeRecommendation']['scope'];
}): EditUnderstanding {
  return {
    significance: opts.significance,
    significanceReasoning: 'test',
    changeType: 'meaning_evolution',
    apparentPurpose: 'test',
    purposeConfidence: 0.8,
    profileImpact: {
      directImpact: 'test',
      connectionImpact: [],
      paragraphImpact: null,
      holisticImpact: null,
    },
    scopeRecommendation: {
      scope: opts.scope ?? 'paragraph_reanalysis',
      reasoning: 'test',
      targets: [],
    },
  };
}

function makeProfile(confidenceLevel: ConfidenceLevel): EssayProfile {
  // selectAnalysisMode only reads profile.index.confidenceLevel.
  // Cast through unknown since we don't need a fully-populated profile here.
  return { index: { confidenceLevel } } as unknown as EssayProfile;
}

function makeOutput(diff: EditDiff, understanding: EditUnderstanding): EditUnderstandingOutput {
  return {
    diff,
    understanding,
    stalenessEffects: [],
    analysisMode: 'focused',
  };
}

// ─── tests ───────────────────────────────────────────────────────────────────

console.log('\n[mode-selector] Single-paragraph content rewrite, unchanged structure');
{
  // The piano-essay scenario: P1 replaced by a new 4-sentence scene; 7→7 paragraphs;
  // role unchanged. LLM (incorrectly) labels it transformative. Guardrail should
  // override and route to focused.
  const diff = makeDiff({ changedParagraphIndices: [0] });
  const understanding = makeUnderstanding({ significance: 'transformative', scope: 'paragraph_reanalysis' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'focused', 'Same-paragraph content rewrite (LLM said transformative) → focused');
}

console.log('\n[mode-selector] Same-paragraph rewrite with significance=significant');
{
  const diff = makeDiff({ changedParagraphIndices: [0] });
  const understanding = makeUnderstanding({ significance: 'significant', scope: 'paragraph_reanalysis' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'focused', 'Same-paragraph rewrite, significance=significant → focused');
}

console.log('\n[mode-selector] Paragraph added');
{
  const diff = makeDiff({
    paragraphsAdded: [3],
    paragraphDelta: 1,
    changedParagraphIndices: [3],
  });
  const understanding = makeUnderstanding({ significance: 'significant', scope: 'paragraph_reanalysis' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'comprehensive', 'Paragraph added → comprehensive');
}

console.log('\n[mode-selector] Paragraph reordered');
{
  const diff = makeDiff({
    paragraphsReordered: true,
    changedParagraphIndices: [0, 2],
  });
  const understanding = makeUnderstanding({ significance: 'moderate', scope: 'paragraph_reanalysis' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'comprehensive', 'Paragraph reordered → comprehensive');
}

console.log('\n[mode-selector] Two paragraphs edited, no structural change');
{
  const diff = makeDiff({ changedParagraphIndices: [1, 4] });
  const understanding = makeUnderstanding({ significance: 'significant', scope: 'paragraph_reanalysis' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'focused', 'Two paragraphs edited, no structural change → focused');
}

console.log('\n[mode-selector] Two paragraphs edited but LLM labeled transformative (no structural change)');
{
  // Even if LLM over-labels, guardrail must downgrade.
  const diff = makeDiff({ changedParagraphIndices: [1, 4] });
  const understanding = makeUnderstanding({ significance: 'transformative', scope: 'paragraph_reanalysis' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'focused', 'Two paragraphs edited, transformative-but-no-structure → focused');
}

console.log('\n[mode-selector] Confidence=initial always forces comprehensive');
{
  const diff = makeDiff({ changedParagraphIndices: [0] });
  const understanding = makeUnderstanding({ significance: 'minor' });
  const profile = makeProfile('initial');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'comprehensive', 'confidence=initial → comprehensive');
}

console.log('\n[mode-selector] Paragraph removed');
{
  const diff = makeDiff({
    paragraphsRemoved: [2],
    paragraphDelta: -1,
    changedParagraphIndices: [2],
  });
  const understanding = makeUnderstanding({ significance: 'significant' });
  const profile = makeProfile('deep');
  const mode = FocusedAnalyzer.selectAnalysisMode(makeOutput(diff, understanding), profile);
  assertEq(mode, 'comprehensive', 'Paragraph removed → comprehensive');
}

// ─── summary ─────────────────────────────────────────────────────────────────

console.log(`\n[mode-selector] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
