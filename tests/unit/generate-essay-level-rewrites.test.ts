// ============================================================================
// generateEssayLevelRewrites — mocked-LLM integration test
// ============================================================================
// Validates the end-to-end essay-level rewrite generator with a mocked
// callClaudeWithRetry. Covers:
//   - Single LLM call (not per-paragraph fan-out)
//   - Cached prefix carries cacheBreakpoint: true
//   - Two userPromptBlocks (prefix + tail)
//   - cacheSystemPrompt: true
//   - JSON output parsing into typed annotations
//   - Q5 back-compat: rewriteExample mirrors draftVariants[0].text
//   - Q6c fallback: zero drafts → awareness-mode annotation
//   - Defensive parsing: malformed output doesn't throw
//   - Cost computed from response usage

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the LLM module before the import that uses it.
vi.mock('../../src/lib/llm/claude', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/llm/claude')>();
  return { ...actual, callClaudeWithRetry: vi.fn() };
});

import { callClaudeWithRetry } from '../../src/lib/llm/claude';
import {
  generateEssayLevelRewrites,
} from '../../src/services/essayIntelligence/analysis/rewriteGeneration';
import type {
  GenerateEssayLevelRewritesInput,
  L5GrowthAnnotation,
  L5GrowthFallbackAnnotation,
} from '../../src/services/essayIntelligence/analysis/rewriteGeneration';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures
// ───────────────────────────────────────────────────────────────────────────

function makeInput(): GenerateEssayLevelRewritesInput {
  return {
    gaps: [
      {
        id: 'CAND_L3_P2S4_xyz',
        anchorLocation: { paragraph: 2, sentence: null, spanText: null },
        candidateAnchors: [
          {
            paragraph: 3,
            sentence: 0,
            source: 'mem_moment',
            momentDescription: 'The mastery claim',
          },
        ],
        missingMechanism: 'intellectual_scaffolding',
        whatItShouldProvide: 'a turning-point sentence',
        architecturalReason: 'P2 is only sustained scene',
        unlocksNext: 'P3 gift-giving becomes natural',
        expectedImpact: 'transformative',
        consolidatedFrom: ['CAND_L3_P2S4_xyz'],
        wordBudget: {
          paragraphCurrentWords: 95,
          essayCurrentWords: 491,
          essayMaxWords: 650,
          targetDelta: { min: 30, max: 47 },
        },
      },
    ],
    styleProfile: {
      registerBaseline: 'conversational',
      distinctivePatterns: ['em-dash pivots', 'magical metaphor'],
      voiceMarkers: ['em-dash pivots'],
      voiceWeaknesses: ['abstract civic vocabulary'],
      vocabularyDomains: [
        { domain: 'whimsical domestic', exampleWords: ['menagerie'] },
        { domain: 'magical/mythic', exampleWords: ['mage', 'wizard'] },
      ],
      sentenceRhythmBaseline: 'clause-heavy with staccato emphasis',
      tonalQualities: ['earnestness'],
      intellectualFingerprint: 'thinks through metaphor systems',
      imageSystem: 'three registers layer (domestic → natural → textile)',
      signatureMove: {
        oneSentenceName: 'Disproportion-then-inversion architecture',
        readerEffect: 'reader pulled forward by misdirection',
        whyItIsTheirs: 'depends on making reader underestimate crochet',
      },
    },
    constraints: {
      preserveSpans: [
        {
          description: 'The misdirection opening',
          locations: [{ paragraph: 0, sentence: 0 }],
          whyProtect: 'establishes voice contract',
        },
      ],
      signatureMoveInstances: [],
      emotionalRegisterConstraint: 'preserve restraint on trauma',
      highEffectivenessParagraphs: [
        { paragraph: 0, effectiveness: 80, why: 'voice contract' },
      ],
    },
    context: {
      essayText: 'P0 text\n\nP1 text\n\nP2 text\n\nP3 text',
      paragraphs: [
        { index: 0, text: 'P0', structuralRole: 'opening', effectiveness: 80, verdict: 'V0' },
        { index: 1, text: 'P1', structuralRole: 'history', effectiveness: 65, verdict: 'V1' },
        { index: 2, text: 'P2', structuralRole: 'struggle', effectiveness: 80, verdict: 'V2' },
        { index: 3, text: 'P3', structuralRole: 'mastery', effectiveness: 65, verdict: 'V3' },
      ],
      throughLineMap: null,
      transformativeInsight: {
        insight: 'The grandmother\'s intentional reversal is the essay\'s core.',
        whyThisTransforms: 'Reframes inheritance from necessity to choice.',
      },
    },
  };
}

/** Build a realistic LLM response for the input above. */
function makeValidResponse(): unknown {
  return {
    growthAnnotations: [
      {
        id: 'ann_growth_1',
        addressesGapId: 'CAND_L3_P2S4_xyz',
        type: 'growth',
        teachingMode: 'action',
        content: 'The mastery claim happens in white space.',
        teachingRationale: 'P2 is the only sustained scene; without a turning point...',
        stakes: 'AO will close the gap with skepticism.',
        northStarConnection: 'Through-line requires the bridge.',
        anchorLocation: { paragraphIndex: 3, sentenceIndex: 0, spanText: 'I learned to channel' },
        priority: 1,
        phase: 'architecture',
        confidence: 0.88,
        draftVariants: [
          {
            text: 'Then one afternoon the hook stopped fighting me — not because I\'d changed my grip, but because my hands had stopped expecting it to be hard.',
            intensityLevel: 'minimal',
            wordDelta: 30,
            voicePreservationNotes: 'Uses em-dash pivot, mage/wizard register continued.',
            addressesGapMechanism: 'intellectual_scaffolding',
            antiPattern: {
              text: 'After months of practice, I finally got the hang of it.',
              whyItFails: 'Tells without showing; loses the magical register.',
            },
            wordEconomyCut: null,
            voiceCheck: {
              distinctivePatternsUsed: ['em-dash pivots'],
              vocabularyDomainsUsed: ['magical/mythic'],
              sentenceLengthAvg: 14.5,
              selfReportedPass: true,
            },
          },
          {
            text: 'I don\'t know which afternoon was the one. I\'d unraveled the same six stitches three times when the seventh came clean — not because I\'d done anything differently, but because my hands had stopped expecting resistance. The chrysanthemum I made next was crooked. It looked like itself.',
            intensityLevel: 'scene',
            wordDelta: 45,
            voicePreservationNotes: 'Em-dash pivot + temporal compression + specific number.',
            addressesGapMechanism: 'intellectual_scaffolding',
            antiPattern: {
              text: 'Slowly, over many afternoons, I began to understand my grandmother\'s patient teaching.',
              whyItFails: 'Generic transformation language; drops magic and objects.',
            },
            wordEconomyCut: {
              location: { paragraph: 1, sentence: 6 },
              quote: 'wisdom and confidence',
              wordsRemoved: 3,
              reason: 'Tight without losing meaning.',
            },
            voiceCheck: {
              distinctivePatternsUsed: ['em-dash pivots', 'temporal compression'],
              vocabularyDomainsUsed: ['magical/mythic', 'textile'],
              sentenceLengthAvg: 17.0,
              selfReportedPass: true,
            },
          },
        ],
        rewriteExample: 'Then one afternoon the hook stopped fighting me — not because I\'d changed my grip, but because my hands had stopped expecting it to be hard.',
        fallbackReason: null,
      },
    ],
    preservationAnnotations: [
      {
        id: 'ann_preserve_1',
        type: 'strength',
        teachingMode: 'awareness',
        content: 'The misdirection opening is the voice contract.',
        teachingRationale: 'Three-sentence architecture establishes intimacy.',
        rewriteExample: null,
        weakeningAntiPattern: 'Replacing the taxidermy joke with a direct opener.',
        technique: 'misdirection opening',
        anchorLocation: { paragraphIndex: 0, sentenceIndex: 0, spanText: 'My nightstand' },
        priority: 2,
        phase: 'craft',
        confidence: 0.9,
      },
    ],
    reframeAnnotation: {
      id: 'ann_reframe',
      type: 'teaching',
      teachingMode: 'consequence',
      content: 'The grandmother\'s reversal is the essay\'s core.',
      teachingRationale: 'Reframes inheritance from necessity to choice.',
      rewriteExample: null,
      location: { paragraphIndex: 0, sentenceIndex: null, spanText: null },
      insight: 'The grandmother\'s intentional reversal is the essay\'s core.',
      whyThisTransforms: 'Reframes inheritance from necessity to choice.',
      priority: 1,
      phase: 'architecture',
      confidence: 0.95,
    },
  };
}

const MOCK_USAGE = {
  input_tokens: 7000,
  output_tokens: 5000,
  cache_creation_input_tokens: 4500,
  cache_read_input_tokens: 0,
};

// ───────────────────────────────────────────────────────────────────────────
// Test setup
// ───────────────────────────────────────────────────────────────────────────

describe('generateEssayLevelRewrites — mocked LLM', () => {
  beforeEach(() => {
    vi.mocked(callClaudeWithRetry).mockReset();
  });

  afterEach(() => {
    vi.mocked(callClaudeWithRetry).mockReset();
  });

  // ──── Single LLM call, correct shape ────────────────────────────────

  it('makes exactly one LLM call (not per-paragraph fan-out)', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    await generateEssayLevelRewrites(makeInput());
    expect(vi.mocked(callClaudeWithRetry)).toHaveBeenCalledTimes(1);
  });

  it('passes userPromptBlocks with [prefix, tail] and cacheBreakpoint on prefix only', async () => {
    let captured: any;
    vi.mocked(callClaudeWithRetry).mockImplementation(async (input) => {
      captured = input;
      return {
        content: makeValidResponse(),
        usage: { ...MOCK_USAGE },
        stopReason: 'end_turn',
      } as any;
    });

    await generateEssayLevelRewrites(makeInput());
    expect(captured.userPromptBlocks).toHaveLength(2);
    expect(captured.userPromptBlocks[0].cacheBreakpoint).toBe(true);
    expect(captured.userPromptBlocks[1].cacheBreakpoint).toBeFalsy();
  });

  it('sets cacheSystemPrompt: true (system prompt enters the cache)', async () => {
    let captured: any;
    vi.mocked(callClaudeWithRetry).mockImplementation(async (input) => {
      captured = input;
      return {
        content: makeValidResponse(),
        usage: { ...MOCK_USAGE },
        stopReason: 'end_turn',
      } as any;
    });

    await generateEssayLevelRewrites(makeInput());
    expect(captured.cacheSystemPrompt).toBe(true);
  });

  it('uses Sonnet model + JSON mode + low temperature', async () => {
    let captured: any;
    vi.mocked(callClaudeWithRetry).mockImplementation(async (input) => {
      captured = input;
      return {
        content: makeValidResponse(),
        usage: { ...MOCK_USAGE },
        stopReason: 'end_turn',
      } as any;
    });

    await generateEssayLevelRewrites(makeInput());
    expect(captured.model).toBe('claude-sonnet-4-5-20250929');
    expect(captured.useJsonMode).toBe(true);
    expect(captured.temperature).toBe(0.3);
  });

  // ──── Output parsing ────────────────────────────────────────────────

  it('parses growth annotations with draftVariants and back-compat rewriteExample', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.growthAnnotations).toHaveLength(1);
    const ann = out.growthAnnotations[0] as L5GrowthAnnotation;
    expect(ann.type).toBe('growth');
    expect(ann.teachingMode).toBe('action');
    expect(ann.draftVariants).toHaveLength(2);
    expect(ann.draftVariants[0].intensityLevel).toBe('minimal');
    expect(ann.draftVariants[1].intensityLevel).toBe('scene');
    // Q5 back-compat: rewriteExample mirrors first draft text.
    expect(ann.rewriteExample).toBe(ann.draftVariants[0].text);
  });

  it('parses preservation annotations with weakeningAntiPattern + technique', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.preservationAnnotations).toHaveLength(1);
    expect(out.preservationAnnotations[0].technique).toBe('misdirection opening');
    expect(out.preservationAnnotations[0].weakeningAntiPattern).toMatch(/Replacing/);
    expect(out.preservationAnnotations[0].rewriteExample).toBeNull();
  });

  it('parses reframe annotation with insight + whyThisTransforms', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.reframeAnnotation).not.toBeNull();
    expect(out.reframeAnnotation!.insight).toMatch(/intentional reversal/);
    expect(out.reframeAnnotation!.type).toBe('teaching');
    expect(out.reframeAnnotation!.teachingMode).toBe('consequence');
  });

  // ──── Q6c fallback: zero drafts → awareness-mode annotation ─────────

  it('Q6c: LLM emits zero drafts → fallback annotation (awareness mode, no drafts)', async () => {
    const response = makeValidResponse() as any;
    response.growthAnnotations[0].draftVariants = [];
    response.growthAnnotations[0].fallbackReason = 'zero_drafts_after_retry';
    response.growthAnnotations[0].rewriteExample = null;

    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: response,
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.growthAnnotations).toHaveLength(1);
    const ann = out.growthAnnotations[0] as L5GrowthFallbackAnnotation;
    expect(ann.type).toBe('growth');
    expect(ann.teachingMode).toBe('awareness');
    expect(ann.draftVariants).toEqual([]);
    expect(ann.rewriteExample).toBeNull();
    expect(ann.fallbackReason).toBe('zero_drafts_after_retry');
  });

  it('Q6c: LLM emits draftVariants:[] without fallbackReason → fallback inferred', async () => {
    const response = makeValidResponse() as any;
    response.growthAnnotations[0].draftVariants = [];
    delete response.growthAnnotations[0].fallbackReason;

    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: response,
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    const ann = out.growthAnnotations[0] as L5GrowthFallbackAnnotation;
    expect(ann.teachingMode).toBe('awareness');
    expect(ann.fallbackReason).toBe('zero_drafts_after_retry');
  });

  // ──── Defensive parsing: malformed output ──────────────────────────

  it('does NOT throw when LLM returns empty/missing fields', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: {},
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.growthAnnotations).toEqual([]);
    expect(out.preservationAnnotations).toEqual([]);
    expect(out.reframeAnnotation).toBeNull();
  });

  it('does NOT throw when LLM returns non-object content', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: null as unknown,
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.growthAnnotations).toEqual([]);
  });

  it('drops malformed draft entries (missing text) but keeps valid ones', async () => {
    const response = makeValidResponse() as any;
    response.growthAnnotations[0].draftVariants.push({
      // Missing 'text' field — should be dropped.
      intensityLevel: 'insight',
      wordDelta: 25,
    });

    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: response,
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    const ann = out.growthAnnotations[0] as L5GrowthAnnotation;
    // Original 2 valid drafts retained; malformed third dropped.
    expect(ann.draftVariants).toHaveLength(2);
  });

  // ──── Cost computation + telemetry ──────────────────────────────────

  it('computes cost from response usage', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    // Sonnet pricing: $3/M input, $15/M output → 7000*$3/M + 5000*$15/M = $0.021 + $0.075 = $0.096
    expect(out.cost).toBeGreaterThan(0.05);
    expect(out.cost).toBeLessThan(0.2);
  });

  it('populates token usage including cache fields', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    expect(out.tokenUsage.inputTokens).toBe(7000);
    expect(out.tokenUsage.outputTokens).toBe(5000);
    expect(out.tokenUsage.cacheWriteTokens).toBe(4500);
    expect(out.tokenUsage.cacheReadTokens).toBe(0);
  });

  it('emits one voiceCheckResult per draft', async () => {
    vi.mocked(callClaudeWithRetry).mockResolvedValue({
      content: makeValidResponse(),
      usage: { ...MOCK_USAGE },
      stopReason: 'end_turn',
    } as any);

    const out = await generateEssayLevelRewrites(makeInput());
    // One growth annotation × 2 drafts = 2 voiceCheck results.
    expect(out.voiceCheckResults).toHaveLength(2);
    expect(out.voiceCheckResults[0].passes.usedAtLeastOneDistinctivePattern).toBe(true);
  });
});
