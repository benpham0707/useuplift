/**
 * Layer 1: First Impressions Service
 *
 * Parallel-per-paragraph Haiku calls that produce purely DESCRIPTIVE observations.
 * This is the hardest constraint in the system: LLMs naturally evaluate, but L1
 * MUST NOT. Every output describes WHAT IS, never HOW WELL.
 *
 * L3 (Sonnet) later supersedes these simple string observations with richer
 * ObservationEntry[] arrays — L1 is temporary scaffolding, not the final word.
 *
 * After all impressions complete, builds the initial ProfileIndex with paragraph
 * digests, topic tags, and sentence counts.
 *
 * Consumed by: analysis orchestrator (feeds L2, L2.5, and L3)
 * Output type: ParagraphFirstImpression[] (from profileTypes.ts)
 */

import { callClaudeWithRetry, calculateCost, classifyError } from '../../../lib/llm/claude';
import type { ClaudeResponse, LayerError } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import type {
  ParagraphFirstImpression,
  ProfileIndex,
  ImprovementPhase,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const TEMPERATURE = 0.2;
const MAX_TOKENS = 2000;

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface FirstImpressionsResult {
  impressions: ParagraphFirstImpression[];
  initialProfileIndex: ProfileIndex;
  cost: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  timingMs: number;
  /** Per-paragraph timing for diagnostics */
  paragraphTimings: Array<{ index: number; timingMs: number; success: boolean }>;
}

// ============================================================================
// SYSTEM PROMPT (static, cacheable across all parallel paragraph calls)
// ============================================================================

/**
 * The L1 system prompt enforces DESCRIPTIVE-ONLY output through multiple
 * forcing functions:
 *
 * 1. Vocabulary constraint: explicit banned words list
 * 2. Frame constraint: every observation must answer "what IS" not "how well"
 * 3. Negative examples: show what NOT to produce
 * 4. Role framing: "cataloger" not "critic"
 *
 * If the output contains evaluative language ("effective," "strong," "weak,"
 * "powerful," "compelling," "clumsy," "awkward"), the prompt has failed.
 */
const SYSTEM_PROMPT = `You are a literary cataloger — your job is to DESCRIBE what you observe in a paragraph of a college application essay, the way a naturalist describes what they see in a forest. You do NOT judge quality. You do NOT evaluate effectiveness. You NOTICE and RECORD.

YOUR CONSTRAINTS — THESE ARE ABSOLUTE:

BANNED WORDS (never use these or synonyms):
effective, ineffective, strong, weak, powerful, powerless, compelling, uncompelling, excellent, poor, good, bad, impressive, disappointing, clumsy, awkward, graceful, elegant, successful, unsuccessful, masterful, amateurish, sophisticated, simplistic, well-crafted, poorly-crafted, beautiful, ugly, brilliant, dull, vivid, flat, dynamic, static, engaging, boring, captivating, tedious, resonant, hollow, authentic, inauthentic, convincing, unconvincing, natural, forced, polished, rough, refined, crude

FRAME CONSTRAINT: Every observation must be completable with "I notice that..." NOT "I think this is..."
  CORRECT: "The sentence uses present tense to describe a past event"
  CORRECT: "The narrator shifts from first person to second person mid-paragraph"
  CORRECT: "The word 'shattered' appears in a context about family dinners"
  WRONG: "The present tense effectively creates immediacy"
  WRONG: "The narrator skillfully shifts perspective"
  WRONG: "The word choice is powerful here"

WHAT YOU PRODUCE FOR EACH PARAGRAPH (paragraph-level — be specific but compact):
1. apparentPurpose: One sentence — what this paragraph appears to be doing (scene-setting, person-introduction, event-description, reflection, argument).
2. emotionalRegister: One short phrase — emotional tone present (urgent, contemplative, anxious, playful, matter-of-fact). Describe the emotion, do NOT judge whether it works.
3. voiceObservation: One sentence — what the narrator's voice sounds like here (formal, conversational, fragmented, flowing).
4. craftNotices: Up to 5 specific craft choices observed (sentence length patterns, imagery, dialogue, tense, punctuation). One short phrase each.
5. tags: 3-5 topic/content tags (e.g., "family", "competition", "self-discovery", "cultural-identity").

FOR EACH SENTENCE (BE BRIEF — one short phrase per field):
1. apparentPurpose: ≤10 words — what this sentence does in the paragraph.
2. rhetoricalFunction: ONE label (scene-setting | character-introduction | argument-advancing | transition | reflection | concrete-detail | emotional-disclosure | other).
3. toneShift: boolean.
4. notableElements: 0-3 short labels (metaphor / proper-noun / direct-quote / unusual-word). Empty array if nothing notable.
5. tags: 1-3 content tags. Empty array if not applicable.

PER-SENTENCE BREVITY DISCIPLINE: First impressions are LIGHTWEIGHT. Each sentence's per-field output should fit on one short line. If you find yourself writing full prose for a per-sentence field, STOP — rewrite as a phrase. The total per-paragraph output should fit comfortably under 1500 tokens.

FIELD-SPECIFIC EXAMPLES (correct vs incorrect):

apparentPurpose (paragraph): "Introduces a physical setting through sensory details, places narrator inside a specific location." NOT "This paragraph effectively establishes the scene and draws the reader in with vivid sensory language."

voiceObservation: "Short declarative sentences, no adjectives, second-person address, staccato rhythm." NOT "The narrator's voice is refreshingly direct and achieves a compelling conversational tone."

tags: CONTENT labels (what is discussed), NOT quality labels. Use "family-dinner", "violin-practice", "code-switching" — NOT "powerful-moment", "vivid-scene".

FOR NOTABLE PHRASES (cap at 3 per paragraph — pick the most distinctive):
1. phrase: Exact text.
2. sentenceIndex: Which sentence it appears in.
3. significance: ≤15 words — WHAT makes it notable (position, unusualness, relationship to other elements). NOT whether it's good or bad.

OUTPUT: Valid JSON matching this schema:
{
  "paragraphIndex": <number>,
  "apparentPurpose": "<what this paragraph appears to be doing>",
  "emotionalRegister": "<what emotional tone is present>",
  "voiceObservation": "<what the voice sounds like>",
  "craftNotices": ["<specific craft choice observed>", ...],
  "tags": ["<topic tag>", ...],
  "sentences": [
    {
      "index": <number>,
      "text": "<the sentence text>",
      "apparentPurpose": "<what this sentence does>",
      "rhetoricalFunction": "<functional label>",
      "toneShift": <boolean>,
      "notableElements": ["<element>", ...],
      "tags": ["<tag>", ...]
    }
  ],
  "notablePhrases": [
    {
      "phrase": "<exact text>",
      "sentenceIndex": <number>,
      "significance": "<what makes it notable — NO quality judgment>"
    }
  ]
}

FINAL CHECK: Before outputting, scan your JSON for ANY word from the banned list or ANY evaluative framing. If found, rephrase as pure description.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildUserPrompt(
  paragraphText: string,
  paragraphIndex: number,
  totalParagraphs: number,
  allParagraphs: string[],
): string {
  // PLAN.md: each L1 call receives the full essay text (for context) + the target paragraph
  const markedEssay = allParagraphs
    .map((p, i) => {
      const marker = i === paragraphIndex ? `>>> [P${i + 1}] <<<` : `[P${i + 1}]`;
      return `${marker} ${p.trim()}`;
    })
    .join('\n\n');

  return `FULL ESSAY (${totalParagraphs} paragraphs — you are observing paragraph ${paragraphIndex + 1}, marked with >>>):

${markedEssay}

TARGET PARAGRAPH ${paragraphIndex + 1}:
${paragraphText}

Produce the observation JSON for the target paragraph. Remember: describe WHAT IS, never HOW WELL.`;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateImpression(
  raw: Record<string, unknown>,
  paragraphIndex: number,
  paragraphText: string,
): ParagraphFirstImpression {
  // Split paragraph into sentences for validation
  const sentences = splitIntoSentences(paragraphText);

  const rawSentences = Array.isArray(raw.sentences) ? raw.sentences as Array<Record<string, unknown>> : [];

  // Validate and normalize sentences
  const validatedSentences: ParagraphFirstImpression['sentences'] = sentences.map((sentenceText, i) => {
    const rawSentence = rawSentences[i] as Record<string, unknown> | undefined;

    return {
      index: i,
      text: sentenceText,
      apparentPurpose: typeof rawSentence?.apparentPurpose === 'string'
        ? rawSentence.apparentPurpose
        : 'Not classified',
      rhetoricalFunction: typeof rawSentence?.rhetoricalFunction === 'string'
        ? rawSentence.rhetoricalFunction
        : 'unclassified',
      toneShift: typeof rawSentence?.toneShift === 'boolean'
        ? rawSentence.toneShift
        : false,
      notableElements: Array.isArray(rawSentence?.notableElements)
        ? (rawSentence.notableElements as unknown[]).filter((e): e is string => typeof e === 'string')
        : [],
      tags: Array.isArray(rawSentence?.tags)
        ? (rawSentence.tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [],
    };
  });

  // Validate notable phrases
  const rawPhrases = Array.isArray(raw.notablePhrases) ? raw.notablePhrases as Array<Record<string, unknown>> : [];
  const validatedPhrases: ParagraphFirstImpression['notablePhrases'] = rawPhrases
    .filter((p): p is Record<string, unknown> => p !== null && typeof p === 'object')
    .map(p => ({
      phrase: typeof p.phrase === 'string' ? p.phrase : '',
      sentenceIndex: typeof p.sentenceIndex === 'number' ? p.sentenceIndex : 0,
      significance: typeof p.significance === 'string' ? p.significance : '',
    }))
    .filter(p => p.phrase.length > 0);

  // Validate craft notices
  const rawCraftNotices = Array.isArray(raw.craftNotices) ? raw.craftNotices : [];
  const craftNotices = (rawCraftNotices as unknown[]).filter((c): c is string => typeof c === 'string');

  // Validate tags
  const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
  const tags = (rawTags as unknown[]).filter((t): t is string => typeof t === 'string');

  return {
    paragraphIndex,
    apparentPurpose: typeof raw.apparentPurpose === 'string' ? raw.apparentPurpose : 'Not classified',
    emotionalRegister: typeof raw.emotionalRegister === 'string' ? raw.emotionalRegister : 'Not classified',
    voiceObservation: typeof raw.voiceObservation === 'string' ? raw.voiceObservation : 'Not classified',
    craftNotices,
    tags,
    sentences: validatedSentences,
    notablePhrases: validatedPhrases,
  };
}

// ============================================================================
// SENTENCE SPLITTING
// ============================================================================

/**
 * Split paragraph text into sentences. Uses a simple heuristic:
 * split on sentence-ending punctuation followed by a space or end of string,
 * but handle common abbreviations.
 */
function splitIntoSentences(text: string): string[] {
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return [];

  // Split on sentence boundaries: period, exclamation, question mark
  // followed by space+uppercase or end of string.
  // Preserve the punctuation with the sentence.
  const sentences: string[] = [];
  let current = '';

  for (let i = 0; i < normalized.length; i++) {
    current += normalized[i];

    const ch = normalized[i];
    const isEnd = ch === '.' || ch === '!' || ch === '?';

    if (isEnd) {
      // Check if this looks like a real sentence ending
      const nextChar = normalized[i + 1];
      const isLastChar = i === normalized.length - 1;

      // Common abbreviations to skip: Mr., Mrs., Dr., St., etc.
      const lowerCurrent = current.toLowerCase();
      const isAbbreviation = ch === '.' && (
        lowerCurrent.endsWith('mr.') ||
        lowerCurrent.endsWith('mrs.') ||
        lowerCurrent.endsWith('dr.') ||
        lowerCurrent.endsWith('st.') ||
        lowerCurrent.endsWith('jr.') ||
        lowerCurrent.endsWith('sr.') ||
        lowerCurrent.endsWith('vs.') ||
        lowerCurrent.endsWith('etc.') ||
        lowerCurrent.endsWith('e.g.') ||
        lowerCurrent.endsWith('i.e.')
      );

      if (!isAbbreviation && (isLastChar || nextChar === ' ' || nextChar === '"' || nextChar === '\'' || nextChar === ')')) {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          sentences.push(trimmed);
        }
        current = '';
      }
    }
  }

  // Push any remaining text as a sentence
  const remaining = current.trim();
  if (remaining.length > 0) {
    sentences.push(remaining);
  }

  return sentences;
}

// ============================================================================
// PLACEHOLDER IMPRESSION (for failed paragraphs)
// ============================================================================

function buildPlaceholderImpression(
  paragraphIndex: number,
  paragraphText: string,
  errorMessage: string,
): ParagraphFirstImpression {
  const sentences = splitIntoSentences(paragraphText);
  console.warn(
    `[FirstImpressions] Paragraph ${paragraphIndex + 1} failed, using placeholder: ${errorMessage}`,
  );

  return {
    paragraphIndex,
    apparentPurpose: `[L1 failed — placeholder] ${errorMessage}`,
    emotionalRegister: 'Not classified — L1 call failed',
    voiceObservation: 'Not classified — L1 call failed',
    craftNotices: [],
    tags: [],
    sentences: sentences.map((text, i) => ({
      index: i,
      text,
      apparentPurpose: 'Not classified — L1 call failed',
      rhetoricalFunction: 'unclassified',
      toneShift: false,
      notableElements: [],
      tags: [],
    })),
    notablePhrases: [],
  };
}

// ============================================================================
// PROFILE INDEX BUILDER
// ============================================================================

/**
 * Build the initial ProfileIndex from L1 impressions.
 * Most fields are null/empty at this stage — populated by later layers.
 */
function buildInitialProfileIndex(
  impressions: ParagraphFirstImpression[],
  essayText: string,
): ProfileIndex {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const totalWords = essayText.split(/\s+/).filter(w => w.length > 0).length;
  const totalSentences = impressions.reduce((sum, imp) => sum + imp.sentences.length, 0);

  // Collect all unique tags across paragraphs
  const allTags = new Set<string>();
  for (const imp of impressions) {
    for (const tag of imp.tags) {
      allTags.add(tag);
    }
  }

  // Build paragraph digests
  const paragraphDigest: ProfileIndex['paragraphDigest'] = impressions.map((imp, i) => ({
    index: i,
    roleSummary: imp.apparentPurpose,
    tags: imp.tags,
    themes: [], // Populated by L3.75
    sentenceCount: imp.sentences.length,
    hasStrengths: false, // Populated by L3.5
    hasWeaknesses: false, // Populated by L3.5
    connectionCount: 0, // Populated by L2.5/L3
    improvementPriority: 0, // Populated by L4
  }));

  // Initial improvement phase — Foundation until later layers determine otherwise
  const initialImprovementPhase: ImprovementPhase = {
    level: 'foundation',
    reasoning: 'Initial L1 pass — deeper analysis needed to determine improvement phase',
    focusAreas: ['thesis clarity', 'structural coherence', 'narrative arc'],
    deferredAreas: ['sentence-level craft', 'word-level polish', 'distinction markers'],
    readinessAssessment: 'Initial analysis — essay has not yet been scored at the paragraph level.',
    legacyReadiness: { essayLevel: 0, paragraphLevel: 0, sentenceLevel: 0, wordLevel: 0 },
    dimensionPhases: [],
    coachingLens: 'Initial analysis in progress. Full phase assessment will be determined after paragraph-level scoring.',
    transition: null,
  };

  return {
    essayLength: {
      paragraphs: paragraphs.length,
      sentences: totalSentences,
      words: totalWords,
    },
    confidenceLevel: 'initial',
    topicTags: Array.from(allTags),
    paragraphDigest,
    sectionTokenCounts: {
      voiceIdentity: 0,
      voiceMap: 0,
      emotionalTopography: 0,
      momentEarnednessMap: 0,
      thematicArchitecture: 0,
      narrativeStrategy: 0,
      characterRevelation: 0,
      craftAssessment: 0,
      entanglements: 0,
      admissionsPositioning: 0,
      northStar: 0,
      connections: 0,
      paragraphs: paragraphs.map(() => 0),
    },
    connectionGraph: [],
    northStarSummary: {
      throughLineSummary: null,
      structuralRoles: [],
      maturity: 'absent',
    },
    stalenessSnapshot: {
      strongStale: [],
      moderateStale: [],
      weakStale: [],
      lastChangeAt: null,
    },
    activeConcerns: [],
    improvementPhase: initialImprovementPhase,
    fullAnalysisCount: 0,
    lastComprehensiveAt: null,
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class FirstImpressionsService {
  /**
   * Run L1 first impressions for all paragraphs in parallel.
   *
   * Each paragraph gets a separate Haiku call. If one fails, it gets a
   * placeholder — the pipeline continues. After all calls complete,
   * builds the initial ProfileIndex.
   */
  async analyze(essayText: string): Promise<FirstImpressionsResult> {
    const startTime = Date.now();
    const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    if (paragraphs.length === 0) {
      throw new Error('[FirstImpressions] Essay text is empty — no paragraphs found');
    }

    // Track cumulative token usage
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    let totalCost = 0;
    const paragraphTimings: FirstImpressionsResult['paragraphTimings'] = [];

    // Run all paragraphs in parallel
    const impressionPromises: Promise<ParagraphFirstImpression>[] = paragraphs.map(
      (paragraphText, index) => this.analyzeParagraph(
        paragraphText,
        index,
        paragraphs.length,
        paragraphs,
      ).then(result => {
        // Accumulate tokens and cost
        totalInputTokens += result.tokenUsage.inputTokens;
        totalOutputTokens += result.tokenUsage.outputTokens;
        totalCacheReadTokens += result.tokenUsage.cacheReadTokens;
        totalCacheWriteTokens += result.tokenUsage.cacheWriteTokens;
        totalCost += result.cost;
        paragraphTimings.push({
          index,
          timingMs: result.timingMs,
          success: true,
        });
        return result.impression;
      }).catch(error => {
        // On failure, return placeholder — don't abort the pipeline
        const errorMessage = error instanceof Error ? error.message : String(error);
        paragraphTimings.push({
          index,
          timingMs: Date.now() - startTime,
          success: false,
        });
        return buildPlaceholderImpression(index, paragraphText, errorMessage);
      }),
    );

    const impressions = await Promise.all(impressionPromises);

    // Build initial ProfileIndex from impressions
    const initialProfileIndex = buildInitialProfileIndex(impressions, essayText);

    const timingMs = Date.now() - startTime;

    return {
      impressions,
      initialProfileIndex,
      cost: totalCost,
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheReadTokens: totalCacheReadTokens,
        cacheWriteTokens: totalCacheWriteTokens,
      },
      timingMs,
      paragraphTimings,
    };
  }

  /**
   * Analyze a single paragraph. Returns the impression plus cost/timing metadata.
   * Throws on failure (caller handles fallback).
   */
  private async analyzeParagraph(
    paragraphText: string,
    paragraphIndex: number,
    totalParagraphs: number,
    allParagraphs: string[],
  ): Promise<{
    impression: ParagraphFirstImpression;
    cost: number;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheWriteTokens: number;
    };
    timingMs: number;
  }> {
    const startTime = Date.now();

    const userPrompt = buildUserPrompt(paragraphText, paragraphIndex, totalParagraphs, allParagraphs);

    const response: ClaudeResponse<Record<string, unknown>> = await callClaudeWithRetry<Record<string, unknown>>(
      {
        model: HAIKU_MODEL,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
    );

    const parsed = parseLlmJsonOutput(response.content, `L1 firstImpressions P${paragraphIndex}`);
    const impression = validateImpression(parsed, paragraphIndex, paragraphText);
    const cost = calculateCost(response.usage, HAIKU_MODEL);
    console.log(
      `[EssayIntelligence] L1 P${paragraphIndex}: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );

    return {
      impression,
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      timingMs: Date.now() - startTime,
    };
  }
}

export const firstImpressionsService = new FirstImpressionsService();
