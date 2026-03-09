/**
 * Sequential Deep Walk — Layer 3 Core Engine
 *
 * Walks the essay paragraph by paragraph, calling Sonnet for each one.
 * Each call receives the current RunningUnderstanding and returns BOTH
 * a ParagraphDeepAnalysis AND an updated RunningUnderstanding. This is
 * how holistic understanding compounds across the essay.
 *
 * Key design:
 *   - System prompt (~1500 tokens) is CACHED across all paragraph calls
 *   - Full essay text with [P1]..[PN] markers is included in user prompt
 *   - RunningUnderstanding grows with each iteration
 *   - Supports incremental re-walk from a specific paragraph
 */

import type {
  EssayUnderstanding,
  StructuralCartography,
  RunningUnderstanding,
  ParagraphDeepAnalysis,
  WordVerdict,
} from '../types';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { RunningUnderstandingManager, runningUnderstandingManager } from './runningUnderstandingManager';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEEP_WALK_MODEL = 'claude-sonnet-4-5-20250929';
const DEEP_WALK_TEMPERATURE = 0.3;
const DEEP_WALK_MAX_TOKENS = 3000;
const DEEP_WALK_TIMEOUT_MS = 120_000;

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface DeepWalkResult {
  paragraphAnalyses: ParagraphDeepAnalysis[];
  finalUnderstanding: RunningUnderstanding;
  intermediateSnapshots: RunningUnderstanding[];
  cost: number;
  timingMs: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
}

// ============================================================================
// SYSTEM PROMPT (CACHEABLE)
// ============================================================================

const SYSTEM_PROMPT = `You are an expert college admissions essay analyst performing a deep, paragraph-by-paragraph analysis.

For each paragraph you analyze, you must return a JSON object with EXACTLY two top-level keys:

1. "paragraphAnalysis" — a detailed 5-angle analysis of THIS paragraph
2. "updatedUnderstanding" — the updated running understanding incorporating THIS paragraph

=== OUTPUT SCHEMA ===

{
  "paragraphAnalysis": {
    "paragraphIndex": <number — 0-indexed paragraph number>,

    "structural": {
      "actualRole": <string — what this paragraph actually does>,
      "intendedRole": <string — what the writer likely intended>,
      "roleEffectiveness": <number 0-100 — how well it fulfills its role>,
      "placementVerdict": <string — assessment of where this paragraph sits>,
      "essentialContent": <string — the core content this paragraph carries>,
      "currentGaps": [<string — what's missing or underdeveloped>],
      "connectionToPrior": <string|null — how it connects to the previous paragraph>,
      "connectionToNext": <string|null — how it connects to the next paragraph>
    },

    "rhetoric": {
      "primaryClaim": <string|null — the main claim or point made>,
      "evidenceQuality": <number 0-100>,
      "evidenceTypes": [<string — types of evidence used: anecdote, statistic, comparison, etc.>],
      "persuasiveness": <number 0-100>,
      "redundancyWithOtherParagraphs": <string|null — overlap with other paragraphs>,
      "uniqueContribution": <string — what this paragraph uniquely adds>
    },

    "emotional": {
      "emotionalRegister": <string — e.g. "earnest", "reflective", "anxious", "determined">,
      "voiceAuthenticity": <number 0-100>,
      "emotionalDepth": <number 0-100>,
      "showVsTellVerdict": <string — assessment of showing vs telling>,
      "strongestEmotionalMoment": <string|null — the most emotionally resonant moment>,
      "emotionalGap": <string|null — where emotion is missing or forced>
    },

    "craft": {
      "sentenceRhythmAssessment": <string — pacing/rhythm analysis>,
      "wordChoiceHighlights": [
        {
          "word": <string>,
          "verdict": <"excellent"|"adequate"|"weak"|"wrong">,
          "reason": <string>,
          "alternative": <string|null>
        }
      ],
      "imageQuality": <number 0-100 — vividness of imagery>,
      "voiceConsistency": <number 0-100 — consistency with essay's established voice>,
      "craftStandout": <string|null — best craft element>,
      "craftWeakness": <string|null — worst craft element>
    },

    "sentences": [
      {
        "index": <number — 0-indexed within this paragraph>,
        "text": <string — the sentence text>,
        "role": <string — what this sentence does>,
        "effectiveness": <number 0-100>,
        "isStrength": <boolean>,
        "issue": <string|null — if not a strength, what's wrong>,
        "suggestion": <string|null — improvement suggestion>,
        "rewriteExample": <string|null — example rewrite>,
        "wordFlags": [
          {
            "word": <string>,
            "issue": <string>,
            "alternative": <string>
          }
        ]
      }
    ],

    "overallScore": <number 0-100>,
    "topStrength": <string>,
    "topImprovement": <string>,
    "admissionsImpact": <string — how an admissions officer would perceive this paragraph>
  },

  "updatedUnderstanding": {
    "emergingThesis": <string — the essay's emerging thesis/central message>,
    "thesisConfidence": <number 0-100>,
    "thematicThreads": [
      {
        "thread": <string — theme name>,
        "introducedAt": <number — 0-indexed paragraph>,
        "lastSeenAt": <number — 0-indexed paragraph>,
        "strength": <"dominant"|"supporting"|"hinted"|"dropped">
      }
    ],

    "arcSoFar": <string — description of the narrative arc so far>,
    "arcType": <string|null — e.g. "transformation", "realization", "challenge_growth">,
    "currentMomentum": <"building"|"sustaining"|"releasing"|"stalling">,
    "turningPointDetected": <number|null — 0-indexed paragraph of turning point>,

    "voiceFingerprint": {
      "dominantRegister": <string — e.g. "earnest and reflective">,
      "authenticMoments": [<string — phrases that feel genuine>],
      "voiceDrifts": [
        {
          "paragraph": <number>,
          "from": <string>,
          "to": <string>
        }
      ],
      "consistencyScore": <number 0-100>
    },

    "emotionalArc": [
      {
        "paragraph": <number — 0-indexed>,
        "register": <string>,
        "depth": <number 0-100>,
        "isEarned": <boolean — true if the emotion feels justified by the content>
      }
    ],
    "emotionalPeak": {
      "paragraph": <number>,
      "moment": <string>
    },

    "strengthsFound": [
      {
        "quality": <string — e.g. "vivid sensory detail">,
        "paragraph": <number>,
        "evidence": <string — brief quote or description>
      }
    ],
    "weaknessesFound": [
      {
        "quality": <string — e.g. "generic language">,
        "paragraph": <number>,
        "description": <string>,
        "severity": <"critical"|"significant"|"minor">
      }
    ],

    "connections": [
      {
        "type": <"callback"|"contrast"|"escalation"|"parallel"|"contradiction">,
        "paragraphs": [<number>, <number>],
        "description": <string>
      }
    ],
    "redundancies": [
      {
        "paragraphs": [<number>],
        "overlappingContent": <string>
      }
    ],

    "aoTakeaway": <string — what an admissions officer would think so far>,
    "memorabilityFactor": <string|null — what makes this essay memorable>,
    "revealedQualities": [<string — character qualities revealed so far>]
  }
}

=== INSTRUCTIONS ===

1. Analyze the TARGET paragraph deeply across all 5 angles (structural, rhetoric, emotional, craft, sentences).
2. Update the RunningUnderstanding to reflect what you've now learned. The RunningUnderstanding is CUMULATIVE — it represents everything learned from ALL paragraphs analyzed so far.
3. Look for cross-paragraph connections, thematic threads, and how this paragraph advances (or stalls) the essay's arc.
4. Be specific and evidence-based. Quote actual phrases from the text.
5. Score honestly — a mediocre paragraph should score 40-60, not 70+.
6. The admissionsImpact should reflect how a real AO would react to this paragraph in context.

Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

// ============================================================================
// SEQUENTIAL DEEP WALK
// ============================================================================

export class SequentialDeepWalk {
  private readonly manager: RunningUnderstandingManager;

  constructor(manager?: RunningUnderstandingManager) {
    this.manager = manager ?? runningUnderstandingManager;
  }

  /**
   * Walk the essay paragraph by paragraph, building compound understanding.
   */
  async walkEssay(
    essayText: string,
    understanding: EssayUnderstanding,
    structuralMap: StructuralCartography,
    options?: {
      startFromParagraph?: number;
      existingRunningUnderstanding?: RunningUnderstanding;
    }
  ): Promise<DeepWalkResult> {
    const startTime = Date.now();
    const paragraphs = this.splitIntoParagraphs(essayText);

    if (paragraphs.length === 0) {
      const empty = this.manager.createEmpty();
      return {
        paragraphAnalyses: [],
        finalUnderstanding: empty,
        intermediateSnapshots: [],
        cost: 0,
        timingMs: 0,
        tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      };
    }

    const startIndex = options?.startFromParagraph ?? 0;
    let currentRU = options?.existingRunningUnderstanding ?? this.manager.createEmpty();

    const paragraphAnalyses: ParagraphDeepAnalysis[] = [];
    const intermediateSnapshots: RunningUnderstanding[] = [];
    let totalCost = 0;
    const totalTokens = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };

    // Build the marked essay text (used in every call)
    const markedEssay = this.buildMarkedEssayText(paragraphs);

    for (let i = startIndex; i < paragraphs.length; i++) {
      const userPrompt = this.buildUserPrompt(
        markedEssay,
        paragraphs,
        i,
        understanding,
        structuralMap,
        currentRU
      );

      const response = await callClaudeWithRetry<{
        paragraphAnalysis: unknown;
        updatedUnderstanding: unknown;
      }>({
        model: DEEP_WALK_MODEL,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: DEEP_WALK_MAX_TOKENS,
        temperature: DEEP_WALK_TEMPERATURE,
        timeoutMs: DEEP_WALK_TIMEOUT_MS,
        useJsonMode: true,
        cacheSystemPrompt: true,
      });

      // Parse the response
      const parsed = this.parseResponse(response, i);

      // Validate the updated RunningUnderstanding
      const validation = this.manager.validate(parsed.updatedUnderstanding);
      if (!validation.valid) {
        console.warn(
          `[SequentialDeepWalk] Paragraph ${i} RunningUnderstanding validation warnings:`,
          validation.errors
        );
      }

      paragraphAnalyses.push(parsed.paragraphAnalysis);
      currentRU = parsed.updatedUnderstanding;
      intermediateSnapshots.push({ ...currentRU });

      // Accumulate cost and tokens
      const callCost = calculateCost(response.usage, DEEP_WALK_MODEL);
      totalCost += callCost;
      totalTokens.inputTokens += response.usage.input_tokens;
      totalTokens.outputTokens += response.usage.output_tokens;
      totalTokens.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
      totalTokens.cacheWriteTokens += response.usage.cache_creation_input_tokens ?? 0;
    }

    return {
      paragraphAnalyses,
      finalUnderstanding: currentRU,
      intermediateSnapshots,
      cost: totalCost,
      timingMs: Date.now() - startTime,
      tokenUsage: totalTokens,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // PARAGRAPH SPLITTING
  // ══════════════════════════════════════════════════════════════

  /**
   * Split essay text into paragraphs. Uses double-newline as delimiter,
   * filters out empty paragraphs.
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  // ══════════════════════════════════════════════════════════════
  // PROMPT CONSTRUCTION
  // ══════════════════════════════════════════════════════════════

  /**
   * Build the full essay text with [P1]..[PN] markers.
   */
  private buildMarkedEssayText(paragraphs: string[]): string {
    return paragraphs
      .map((p, i) => `[P${i + 1}] ${p}`)
      .join('\n\n');
  }

  /**
   * Build the user prompt for analyzing a specific paragraph.
   */
  private buildUserPrompt(
    markedEssay: string,
    paragraphs: string[],
    paragraphIndex: number,
    understanding: EssayUnderstanding,
    structuralMap: StructuralCartography,
    currentRU: RunningUnderstanding
  ): string {
    const sections: string[] = [];

    // ── FULL ESSAY ──
    sections.push('=== FULL ESSAY ===');
    sections.push(markedEssay);

    // ── TARGET PARAGRAPH ──
    sections.push(`\n=== ANALYZING PARAGRAPH ${paragraphIndex + 1} of ${paragraphs.length} ===`);
    sections.push(paragraphs[paragraphIndex]);

    // ── LAYER 1 DATA FOR THIS PARAGRAPH ──
    const paraUnderstanding = understanding.paragraphs[paragraphIndex];
    if (paraUnderstanding) {
      sections.push('\n=== LAYER 1 DATA (deterministic analysis) ===');
      sections.push(`Specificity Score: ${paraUnderstanding.specificityScore}/100`);
      sections.push(`Scene/Summary: ${paraUnderstanding.sceneOrSummary}`);

      if (paraUnderstanding.functionAnalysis) {
        const fa = paraUnderstanding.functionAnalysis;
        sections.push(`Function: ${fa.detectedFunction} (confidence: ${fa.confidence})`);
      }

      // Sentence-level metrics
      if (paraUnderstanding.sentences.length > 0) {
        sections.push('\nSentence-level metrics:');
        for (const sent of paraUnderstanding.sentences) {
          const m = sent.metrics;
          const flags: string[] = [];
          if (m.isPassiveVoice) flags.push('passive');
          if (m.hasCliche) flags.push('cliche');
          if (m.hasFiller) flags.push('filler');
          if (m.hasSensoryLanguage) flags.push('sensory+');
          if (m.hasConcreteDetail) flags.push('concrete+');

          const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
          sections.push(`  S${sent.index + 1}: ${m.wordCount}w, specificity=${m.specificityScore}, voice=${m.voiceStrengthScore}${flagStr}`);
        }
      }

      // Flagged words
      const allFlags = paraUnderstanding.sentences.flatMap(s => s.flaggedWords);
      if (allFlags.length > 0) {
        sections.push('\nFlagged words:');
        for (const fw of allFlags) {
          const alt = fw.flags[0]?.alternative ? ` → "${fw.flags[0].alternative}"` : '';
          sections.push(`  "${fw.word}" (${fw.flags[0]?.category ?? 'unknown'})${alt}`);
        }
      }
    }

    // ── LAYER 2 STRUCTURAL INFO ──
    const structRole = structuralMap.paragraphRoles[paragraphIndex];
    if (structRole) {
      sections.push('\n=== LAYER 2 DATA (structural cartography) ===');
      sections.push(`Role: ${structRole.role}`);
      sections.push(`Narrative Function: ${structRole.narrativeFunction}`);
      sections.push(`Strength Contribution: ${structRole.strengthContribution}`);
      if (structRole.weaknessFlag) {
        sections.push(`Weakness Flag: ${structRole.weaknessFlag}`);
      }
    }

    // Transition info for this paragraph
    const transitionIn = structuralMap.transitions.find(t => t.toParagraph === paragraphIndex);
    const transitionOut = structuralMap.transitions.find(t => t.fromParagraph === paragraphIndex);
    if (transitionIn || transitionOut) {
      sections.push('\nTransitions:');
      if (transitionIn) {
        sections.push(`  From P${transitionIn.fromParagraph + 1}: ${transitionIn.quality} — ${transitionIn.mechanism}`);
      }
      if (transitionOut) {
        sections.push(`  To P${transitionOut.toParagraph + 1}: ${transitionOut.quality} — ${transitionOut.mechanism}`);
      }
    }

    // ── RUNNING UNDERSTANDING ──
    sections.push('\n' + this.manager.serialize(currentRU));

    return sections.join('\n');
  }

  // ══════════════════════════════════════════════════════════════
  // RESPONSE PARSING
  // ══════════════════════════════════════════════════════════════

  /**
   * Parse the Sonnet response into typed ParagraphDeepAnalysis + RunningUnderstanding.
   */
  private parseResponse(
    response: ClaudeResponse<{ paragraphAnalysis: unknown; updatedUnderstanding: unknown }>,
    expectedIndex: number
  ): { paragraphAnalysis: ParagraphDeepAnalysis; updatedUnderstanding: RunningUnderstanding } {
    const content = response.content;

    return {
      paragraphAnalysis: this.parseParagraphAnalysis(content.paragraphAnalysis, expectedIndex),
      updatedUnderstanding: this.manager.parse(content.updatedUnderstanding),
    };
  }

  /**
   * Parse raw JSON into a typed ParagraphDeepAnalysis with defaults for missing fields.
   */
  private parseParagraphAnalysis(raw: unknown, expectedIndex: number): ParagraphDeepAnalysis {
    if (!raw || typeof raw !== 'object') {
      return this.createEmptyParagraphAnalysis(expectedIndex);
    }

    const obj = raw as Record<string, unknown>;

    return {
      paragraphIndex: typeof obj.paragraphIndex === 'number' ? obj.paragraphIndex : expectedIndex,

      structural: this.parseStructural(obj.structural),
      rhetoric: this.parseRhetoric(obj.rhetoric),
      emotional: this.parseEmotional(obj.emotional),
      craft: this.parseCraft(obj.craft),
      sentences: this.parseSentences(obj.sentences),

      overallScore: this.clampScore(obj.overallScore),
      topStrength: typeof obj.topStrength === 'string' ? obj.topStrength : '',
      topImprovement: typeof obj.topImprovement === 'string' ? obj.topImprovement : '',
      admissionsImpact: typeof obj.admissionsImpact === 'string' ? obj.admissionsImpact : '',
    };
  }

  private parseStructural(raw: unknown): ParagraphDeepAnalysis['structural'] {
    if (!raw || typeof raw !== 'object') {
      return {
        actualRole: '', intendedRole: '', roleEffectiveness: 50,
        placementVerdict: '', essentialContent: '', currentGaps: [],
        connectionToPrior: null, connectionToNext: null,
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      actualRole: typeof obj.actualRole === 'string' ? obj.actualRole : '',
      intendedRole: typeof obj.intendedRole === 'string' ? obj.intendedRole : '',
      roleEffectiveness: this.clampScore(obj.roleEffectiveness),
      placementVerdict: typeof obj.placementVerdict === 'string' ? obj.placementVerdict : '',
      essentialContent: typeof obj.essentialContent === 'string' ? obj.essentialContent : '',
      currentGaps: Array.isArray(obj.currentGaps)
        ? obj.currentGaps.filter((g): g is string => typeof g === 'string')
        : [],
      connectionToPrior: typeof obj.connectionToPrior === 'string' ? obj.connectionToPrior : null,
      connectionToNext: typeof obj.connectionToNext === 'string' ? obj.connectionToNext : null,
    };
  }

  private parseRhetoric(raw: unknown): ParagraphDeepAnalysis['rhetoric'] {
    if (!raw || typeof raw !== 'object') {
      return {
        primaryClaim: null, evidenceQuality: 50, evidenceTypes: [],
        persuasiveness: 50, redundancyWithOtherParagraphs: null, uniqueContribution: '',
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      primaryClaim: typeof obj.primaryClaim === 'string' ? obj.primaryClaim : null,
      evidenceQuality: this.clampScore(obj.evidenceQuality),
      evidenceTypes: Array.isArray(obj.evidenceTypes)
        ? obj.evidenceTypes.filter((e): e is string => typeof e === 'string')
        : [],
      persuasiveness: this.clampScore(obj.persuasiveness),
      redundancyWithOtherParagraphs: typeof obj.redundancyWithOtherParagraphs === 'string'
        ? obj.redundancyWithOtherParagraphs
        : null,
      uniqueContribution: typeof obj.uniqueContribution === 'string' ? obj.uniqueContribution : '',
    };
  }

  private parseEmotional(raw: unknown): ParagraphDeepAnalysis['emotional'] {
    if (!raw || typeof raw !== 'object') {
      return {
        emotionalRegister: '', voiceAuthenticity: 50, emotionalDepth: 50,
        showVsTellVerdict: '', strongestEmotionalMoment: null, emotionalGap: null,
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      emotionalRegister: typeof obj.emotionalRegister === 'string' ? obj.emotionalRegister : '',
      voiceAuthenticity: this.clampScore(obj.voiceAuthenticity),
      emotionalDepth: this.clampScore(obj.emotionalDepth),
      showVsTellVerdict: typeof obj.showVsTellVerdict === 'string' ? obj.showVsTellVerdict : '',
      strongestEmotionalMoment: typeof obj.strongestEmotionalMoment === 'string'
        ? obj.strongestEmotionalMoment
        : null,
      emotionalGap: typeof obj.emotionalGap === 'string' ? obj.emotionalGap : null,
    };
  }

  private parseCraft(raw: unknown): ParagraphDeepAnalysis['craft'] {
    if (!raw || typeof raw !== 'object') {
      return {
        sentenceRhythmAssessment: '', wordChoiceHighlights: [],
        imageQuality: 50, voiceConsistency: 50,
        craftStandout: null, craftWeakness: null,
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      sentenceRhythmAssessment: typeof obj.sentenceRhythmAssessment === 'string'
        ? obj.sentenceRhythmAssessment
        : '',
      wordChoiceHighlights: this.parseWordChoiceHighlights(obj.wordChoiceHighlights),
      imageQuality: this.clampScore(obj.imageQuality),
      voiceConsistency: this.clampScore(obj.voiceConsistency),
      craftStandout: typeof obj.craftStandout === 'string' ? obj.craftStandout : null,
      craftWeakness: typeof obj.craftWeakness === 'string' ? obj.craftWeakness : null,
    };
  }

  private parseWordChoiceHighlights(raw: unknown): ParagraphDeepAnalysis['craft']['wordChoiceHighlights'] {
    if (!Array.isArray(raw)) return [];
    const validVerdicts: WordVerdict[] = ['excellent', 'adequate', 'weak', 'wrong'];
    return raw
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        word: typeof item.word === 'string' ? item.word : '',
        verdict: (typeof item.verdict === 'string' && validVerdicts.includes(item.verdict as WordVerdict))
          ? item.verdict as WordVerdict
          : 'adequate' as WordVerdict,
        reason: typeof item.reason === 'string' ? item.reason : '',
        alternative: typeof item.alternative === 'string' ? item.alternative : null,
      }))
      .filter(w => w.word.length > 0);
  }

  private parseSentences(raw: unknown): ParagraphDeepAnalysis['sentences'] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map((item, idx) => ({
        index: typeof item.index === 'number' ? item.index : idx,
        text: typeof item.text === 'string' ? item.text : '',
        role: typeof item.role === 'string' ? item.role : '',
        effectiveness: this.clampScore(item.effectiveness),
        isStrength: typeof item.isStrength === 'boolean' ? item.isStrength : false,
        issue: typeof item.issue === 'string' ? item.issue : null,
        suggestion: typeof item.suggestion === 'string' ? item.suggestion : null,
        rewriteExample: typeof item.rewriteExample === 'string' ? item.rewriteExample : null,
        wordFlags: this.parseSentenceWordFlags(item.wordFlags),
      }));
  }

  private parseSentenceWordFlags(raw: unknown): Array<{ word: string; issue: string; alternative: string }> {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        word: typeof item.word === 'string' ? item.word : '',
        issue: typeof item.issue === 'string' ? item.issue : '',
        alternative: typeof item.alternative === 'string' ? item.alternative : '',
      }))
      .filter(f => f.word.length > 0);
  }

  private clampScore(val: unknown): number {
    if (typeof val !== 'number' || Number.isNaN(val)) return 50;
    return Math.max(0, Math.min(100, Math.round(val)));
  }

  private createEmptyParagraphAnalysis(index: number): ParagraphDeepAnalysis {
    return {
      paragraphIndex: index,
      structural: {
        actualRole: '', intendedRole: '', roleEffectiveness: 50,
        placementVerdict: '', essentialContent: '', currentGaps: [],
        connectionToPrior: null, connectionToNext: null,
      },
      rhetoric: {
        primaryClaim: null, evidenceQuality: 50, evidenceTypes: [],
        persuasiveness: 50, redundancyWithOtherParagraphs: null, uniqueContribution: '',
      },
      emotional: {
        emotionalRegister: '', voiceAuthenticity: 50, emotionalDepth: 50,
        showVsTellVerdict: '', strongestEmotionalMoment: null, emotionalGap: null,
      },
      craft: {
        sentenceRhythmAssessment: '', wordChoiceHighlights: [],
        imageQuality: 50, voiceConsistency: 50,
        craftStandout: null, craftWeakness: null,
      },
      sentences: [],
      overallScore: 50,
      topStrength: '',
      topImprovement: '',
      admissionsImpact: '',
    };
  }
}

/** Singleton instance */
export const sequentialDeepWalk = new SequentialDeepWalk();
