/**
 * Semantic Scoring Service
 *
 * This service replaces feature-counting with genuine semantic understanding.
 * Instead of looking for specific patterns or counting features, it teaches
 * Claude the PRINCIPLES of good writing and asks it to assess whether essays
 * achieve those principles - regardless of how.
 *
 * Key differences from rule-based scoring:
 * 1. No hard patterns - Claude assesses meaning, not features
 * 2. Multiple valid paths to excellence - no single formula
 * 3. Recognizes unconventional excellence
 * 4. Penalizes performative writing (trying to impress vs. communicate)
 * 5. Assesses effect on reader, not checklist completion
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import {
  CORE_WRITING_PRINCIPLES,
  TYPE_SPECIFIC_PRINCIPLES,
  PERFORMATIVE_INDICATORS,
  EXCELLENCE_IS_DIVERSE,
  type WritingPrinciple,
  type TypeSpecificPrinciple,
  type PerformativeIndicator
} from '../rubrics/writingPrinciples';

// ============================================================================
// WORD COUNT SYSTEM
// ============================================================================

/**
 * Default word limits by essay type
 * These are typical limits - colleges may override these
 */
export const DEFAULT_WORD_LIMITS: Record<SupplementalType, { min: number; max: number; typical: number }> = {
  short_answer: { min: 20, max: 50, typical: 50 },      // Very short, every word counts
  why_us: { min: 100, max: 250, typical: 250 },         // Standard supplemental
  why_major: { min: 100, max: 250, typical: 250 },      // Standard supplemental
  community: { min: 100, max: 250, typical: 250 },      // Standard supplemental
  diversity: { min: 200, max: 650, typical: 350 },      // Often longer, sensitive topic
  intellectual: { min: 100, max: 250, typical: 250 },   // Standard supplemental
  extracurricular: { min: 100, max: 350, typical: 250 },// Can be longer for depth
  challenge: { min: 150, max: 650, typical: 350 },      // Often longer for narrative
  leadership: { min: 100, max: 250, typical: 250 },     // Standard supplemental
  creative: { min: 50, max: 500, typical: 250 },        // Varies widely
  values: { min: 100, max: 300, typical: 250 },         // Standard supplemental
  future_goals: { min: 100, max: 250, typical: 200 },   // Often shorter
  additional_info: { min: 50, max: 650, typical: 300 }, // Variable, context-dependent
  optional: { min: 50, max: 400, typical: 250 }         // Variable
};

/**
 * Word efficiency expectations by essay type
 * Determines how strictly we judge word usage
 */
export type WordEfficiencyMode = 'ruthless' | 'moderate' | 'flexible';

export const TYPE_WORD_EFFICIENCY: Record<SupplementalType, WordEfficiencyMode> = {
  short_answer: 'ruthless',     // Every word must earn its place
  why_us: 'moderate',           // Specific details need space
  why_major: 'moderate',        // Intellectual depth needs room
  community: 'moderate',        // Examples need specificity
  diversity: 'flexible',        // Sensitive topics need space
  intellectual: 'moderate',     // Ideas need explanation
  extracurricular: 'flexible',  // Growth arcs need space
  challenge: 'flexible',        // Narrative needs breathing room
  leadership: 'moderate',       // Context matters
  creative: 'flexible',         // Voice/style may vary
  values: 'moderate',           // Stories need examples
  future_goals: 'moderate',     // Clarity over elaboration
  additional_info: 'moderate',  // Purpose-dependent
  optional: 'moderate'          // Quality over quantity
};

/**
 * Word count input - can be customized per college/prompt
 */
export interface WordCountConfig {
  /** Current word count of the essay */
  current: number;
  /** Maximum allowed words (from college prompt) */
  max: number;
  /** Minimum recommended words (optional, from college or default) */
  min?: number;
  /** Whether this is a college-specific limit (vs. default) */
  isCollegeSpecific?: boolean;
}

/**
 * Word count assessment output
 */
export interface WordCountAssessment {
  /** Current word count */
  current: number;
  /** Target word count range */
  target: { min: number; max: number };
  /** Status relative to limits */
  status: 'severely_under' | 'under' | 'optimal' | 'over' | 'severely_over';
  /** How efficiently the essay uses its word budget */
  efficiency_score: number;  // 0-10
  /** Whether word economy is helping or hurting the essay */
  word_economy_analysis: string;
  /** Specific word-related feedback */
  feedback: string;
  /** Recommended action if any */
  recommendation: 'cut_significant' | 'cut_minor' | 'good' | 'expand_minor' | 'expand_significant' | null;
}

// ============================================================================
// TYPES
// ============================================================================

export interface SemanticDimensionScore {
  dimension: string;
  score: number;  // 0-10
  principle_alignment: string;  // How well essay achieves the underlying principle
  evidence: string;  // Specific evidence from the essay
  excellence_path: string;  // Which path to excellence this essay takes (if any)
}

export interface PerformativeAssessment {
  indicator_id: string;
  detected: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  evidence: string;
  impact_on_score: number;  // Negative adjustment
}

export interface SemanticScoringOutput {
  essay_type: SupplementalType;

  // Core principle assessment
  principle_scores: {
    principle_id: string;
    principle_name: string;
    score: number;  // 0-10
    how_achieved: string;  // How the essay achieves (or fails) this principle
    reader_effect: string;  // What effect this has on the reader
  }[];

  // Type-specific assessment
  type_assessment: {
    reader_question_answered: boolean;
    answer_quality: number;  // 0-10
    excellence_path_identified: string | null;
    success_principles_met: string[];
    pitfalls_present: string[];
  };

  // Performative writing detection
  performative_assessment: PerformativeAssessment[];
  authenticity_score: number;  // 0-10, penalized by performative indicators

  // Word count assessment (dynamic per prompt/college)
  word_count_assessment: WordCountAssessment;

  // Overall assessment
  total_score: number;  // 0-100
  quality_tier: 'weak' | 'needs_work' | 'strong' | 'excellent';
  is_good_enough: boolean;

  // What makes this essay work (or not)
  core_strength: string;
  core_weakness: string;
  reader_experience: string;  // How a reader would feel after reading this

  // Unconventional excellence recognition
  unconventional_but_effective: boolean;
  unconventional_notes: string | null;

  tokens_used: { input: number; output: number };
}

// ============================================================================
// PROMPT CONSTRUCTION
// ============================================================================

const SEMANTIC_SCORING_SYSTEM_PROMPT = `You are an expert college admissions essay evaluator with deep understanding
of what makes supplemental essays effective. You assess essays based on PRINCIPLES,
not patterns. You recognize that excellent writing takes many forms.

YOUR CORE PHILOSOPHY:
${EXCELLENCE_IS_DIVERSE}

CRITICAL MINDSET:
- You are NOT looking for specific features, patterns, or formulas
- You ARE assessing whether the essay WORKS - whether it achieves its purpose
- An unconventional essay that succeeds is BETTER than a conventional essay that fails
- You trust your judgment about effect on reader, not checklists
- You can recognize excellence even when it looks different from templates

WORD COUNT PHILOSOPHY:
- Word limits are constraints that demand efficiency, not arbitrary rules
- The smaller the word limit, the more ruthless every word choice must be
- An essay at 95% of limit with filler is WORSE than one at 80% with punch
- Exceeding limits shows inability to edit and disrespect for reader's time
- Being way under limit (without being sharp) shows lack of depth or effort
- Short essays (50 words) must be surgically precise
- Long essays (500+ words) can breathe but should still have no fat`;

/**
 * Build word count context for the prompt based on type and optional college override
 */
function buildWordCountContext(
  essayType: SupplementalType,
  currentWordCount: number,
  wordConfig?: WordCountConfig
): {
  contextText: string;
  wordMin: number;
  wordMax: number;
  efficiencyMode: WordEfficiencyMode;
} {
  const defaults = DEFAULT_WORD_LIMITS[essayType];
  const efficiencyMode = TYPE_WORD_EFFICIENCY[essayType];

  // Use college-specific limits if provided, otherwise defaults
  const wordMax = wordConfig?.max ?? defaults.max;
  const wordMin = wordConfig?.min ?? defaults.min;
  const isCollegeSpecific = wordConfig?.isCollegeSpecific ?? false;

  // Calculate status
  const percentOfMax = (currentWordCount / wordMax) * 100;
  let status: string;
  let statusEmoji: string;

  if (currentWordCount < wordMin * 0.7) {
    status = 'SEVERELY UNDER';
    statusEmoji = '🔴';
  } else if (currentWordCount < wordMin) {
    status = 'UNDER';
    statusEmoji = '🟡';
  } else if (currentWordCount <= wordMax) {
    status = 'WITHIN LIMIT';
    statusEmoji = '🟢';
  } else if (currentWordCount <= wordMax * 1.1) {
    status = 'SLIGHTLY OVER';
    statusEmoji = '🟡';
  } else {
    status = 'SEVERELY OVER';
    statusEmoji = '🔴';
  }

  // Build efficiency guidance based on type
  let efficiencyGuidance: string;
  switch (efficiencyMode) {
    case 'ruthless':
      efficiencyGuidance = `⚡ RUTHLESS EFFICIENCY REQUIRED: With only ${wordMax} words, EVERY word must earn its place.
        No filler, no throat-clearing, no padding. Judge harshly any wasted words.
        A 40-word answer with punch beats a 50-word answer with filler.`;
      break;
    case 'moderate':
      efficiencyGuidance = `📏 MODERATE EFFICIENCY: Essay has ${wordMax} words to work with.
        There's room for specificity and examples, but no room for fluff.
        Trim any sentence that doesn't add value. Watch for repetition.`;
      break;
    case 'flexible':
      efficiencyGuidance = `📖 FLEXIBLE EFFICIENCY: With ${wordMax} words, narrative can breathe.
        Still no fat, but there's room for showing over telling.
        Judge pacing and flow, not just word count. Some types need space.`;
      break;
  }

  const sourceNote = isCollegeSpecific
    ? '(College-specific limit)'
    : '(Default limit for this essay type)';

  const contextText = `
═══════════════════════════════════════════════════════════════════════════════
WORD COUNT ASSESSMENT ${sourceNote}
═══════════════════════════════════════════════════════════════════════════════

📊 CURRENT: ${currentWordCount} words
📏 LIMIT: ${wordMin}-${wordMax} words
${statusEmoji} STATUS: ${status} (${Math.round(percentOfMax)}% of max)

${efficiencyGuidance}

SCORING IMPACT:
- If severely over: Automatic -10 to -15 points (shows inability to edit)
- If slightly over: -5 points (needs trimming)
- If under but sparse: -5 to -10 points (underdeveloped)
- If under but punchy: No penalty (efficient is good!)
- If optimal with no filler: Bonus consideration`;

  return {
    contextText,
    wordMin,
    wordMax,
    efficiencyMode
  };
}

function buildScoringPrompt(
  essayType: SupplementalType,
  essay: string,
  wordCount: number,
  wordCountContext: ReturnType<typeof buildWordCountContext>
): string {
  const typePrinciples = TYPE_SPECIFIC_PRINCIPLES[essayType];

  // Format core writing principles
  const corePrinciplesText = CORE_WRITING_PRINCIPLES.map(p => `
### ${p.name}

**Reader Effect**: ${p.reader_effect}

**Valid Approaches** (not exhaustive):
${p.valid_approaches.map(a => `- ${a}`).join('\n')}

**Positive Signals** (contextual, not hard patterns):
${p.positive_signals.map(s => `- ${s}`).join('\n')}

**Undermining Signals** (contextual, not hard patterns):
${p.undermining_signals.map(s => `- ${s}`).join('\n')}

**Common Misconceptions**:
${p.misconceptions.map(m => `- ${m}`).join('\n')}
`).join('\n---\n');

  // Format performative indicators
  const performativeText = PERFORMATIVE_INDICATORS.map(p => `
### ${p.name}
${p.description}

**Reader Perception**: ${p.reader_perception}

**Recognition Cues** (contextual):
${p.recognition_cues.map(c => `- ${c}`).join('\n')}

**Underlying Cause**: ${p.underlying_cause}
`).join('\n---\n');

  return `
═══════════════════════════════════════════════════════════════════════════════
ESSAY TYPE: ${essayType.toUpperCase()} (${typePrinciples.type})
═══════════════════════════════════════════════════════════════════════════════

THE READER'S QUESTION:
${typePrinciples.reader_question}

SUCCESS PRINCIPLES FOR THIS TYPE:
${typePrinciples.success_principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}

VALID PATHS TO EXCELLENCE (many are possible):
${typePrinciples.excellence_paths.map(p => `• ${p}`).join('\n')}

TYPE-SPECIFIC PITFALLS:
${typePrinciples.type_pitfalls.map(p => `⚠ ${p}`).join('\n')}

EXCELLENT READER EXPERIENCE:
${typePrinciples.excellent_reader_experience}

═══════════════════════════════════════════════════════════════════════════════
CORE WRITING PRINCIPLES (Universal)
═══════════════════════════════════════════════════════════════════════════════

${corePrinciplesText}

═══════════════════════════════════════════════════════════════════════════════
PERFORMATIVE WRITING INDICATORS (Penalize These)
═══════════════════════════════════════════════════════════════════════════════

These indicate the student is PERFORMING rather than communicating genuinely.

${performativeText}

${wordCountContext.contextText}

═══════════════════════════════════════════════════════════════════════════════
THE ESSAY TO EVALUATE
═══════════════════════════════════════════════════════════════════════════════

Word Count: ${wordCount}

---BEGIN ESSAY---
${essay}
---END ESSAY---

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Evaluate this essay based on PRINCIPLES, not patterns. Remember:
- Excellence can look many different ways
- Don't penalize unconventional approaches that WORK
- Assess EFFECT on reader, not checklist completion
- Detect and penalize performative writing
- Assess word economy based on the word limit and efficiency mode

Provide your assessment as a JSON object with this structure:

{
  "principle_scores": [
    {
      "principle_id": "specificity_creates_trust",
      "principle_name": "Specificity Creates Trust",
      "score": 0-10,
      "how_achieved": "How the essay achieves or fails this principle",
      "reader_effect": "What effect this has on the reader"
    },
    // ... for all 6 core principles
  ],

  "type_assessment": {
    "reader_question_answered": true/false,
    "answer_quality": 0-10,
    "excellence_path_identified": "Which path to excellence, if any, or null",
    "success_principles_met": ["list", "of", "principles", "achieved"],
    "pitfalls_present": ["list", "of", "pitfalls", "if any"]
  },

  "performative_assessment": [
    {
      "indicator_id": "trying_to_impress",
      "detected": true/false,
      "severity": "none|mild|moderate|severe",
      "evidence": "Specific evidence from essay",
      "impact_on_score": -X (negative number, 0 if not detected)
    },
    // ... for all performative indicators
  ],

  "word_count_assessment": {
    "status": "severely_under|under|optimal|over|severely_over",
    "efficiency_score": 0-10,
    "word_economy_analysis": "Whether the essay uses its word budget well - is every word earning its place? Is there filler? Is it underdeveloped?",
    "feedback": "Specific feedback on word usage",
    "recommendation": "cut_significant|cut_minor|good|expand_minor|expand_significant|null"
  },

  "authenticity_score": 0-10,

  "total_score": 0-100,
  "quality_tier": "weak|needs_work|strong|excellent",
  "is_good_enough": true/false,

  "core_strength": "The main thing that makes this essay work (if anything)",
  "core_weakness": "The main thing holding this essay back (if anything)",
  "reader_experience": "How a reader would feel after reading this essay",

  "unconventional_but_effective": true/false,
  "unconventional_notes": "If true, explain what's unconventional and why it works"
}

SCORING GUIDELINES:
- Total score is holistic, not arithmetic (don't just average principle scores)
- Performative indicators should REDUCE the score
- Word count issues should affect total_score per the impact guidelines above
- An authentic 7/10 essay beats a performative 9/10 feature-count
- "Good enough" means 85+ AND passes type-specific success principles
- Be willing to recognize excellence even when it surprises you

Return ONLY the JSON object, no other text.`;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class SemanticScoringService {
  private client: Anthropic;
  private model: string = 'claude-sonnet-4-5-20250514';

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Score an essay using semantic understanding of writing principles
   *
   * @param essay - The essay text to score
   * @param essayType - The type of supplemental essay (e.g., 'why_us', 'diversity')
   * @param options - Optional configuration
   * @param options.wordLimit - College-specific word limit (overrides default for type)
   * @param options.wordMin - College-specific minimum word count (optional)
   * @param options.collegeName - Name of college for context (optional)
   */
  async scoreEssay(
    essay: string,
    essayType: SupplementalType,
    options?: {
      wordLimit?: number;
      wordMin?: number;
      collegeName?: string;
    }
  ): Promise<SemanticScoringOutput> {
    const wordCount = essay.split(/\s+/).filter(w => w.length > 0).length;

    // Build word count config from options or defaults
    const wordConfig: WordCountConfig | undefined = options?.wordLimit ? {
      current: wordCount,
      max: options.wordLimit,
      min: options.wordMin,
      isCollegeSpecific: true
    } : undefined;

    // Build word count context for the prompt
    const wordCountContext = buildWordCountContext(essayType, wordCount, wordConfig);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0.3,
      system: SEMANTIC_SCORING_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildScoringPrompt(essayType, essay, wordCount, wordCountContext)
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    let parsed;
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse response:', content.text);
      throw new Error('Failed to parse scoring response');
    }

    // Build word count assessment from parsed response + computed values
    const wordCountAssessment: WordCountAssessment = {
      current: wordCount,
      target: {
        min: wordCountContext.wordMin,
        max: wordCountContext.wordMax
      },
      status: parsed.word_count_assessment?.status ?? this.computeWordStatus(wordCount, wordCountContext.wordMin, wordCountContext.wordMax),
      efficiency_score: parsed.word_count_assessment?.efficiency_score ?? 5,
      word_economy_analysis: parsed.word_count_assessment?.word_economy_analysis ?? 'Word economy not assessed',
      feedback: parsed.word_count_assessment?.feedback ?? '',
      recommendation: parsed.word_count_assessment?.recommendation ?? null
    };

    return {
      essay_type: essayType,
      principle_scores: parsed.principle_scores,
      type_assessment: parsed.type_assessment,
      performative_assessment: parsed.performative_assessment,
      authenticity_score: parsed.authenticity_score,
      word_count_assessment: wordCountAssessment,
      total_score: parsed.total_score,
      quality_tier: parsed.quality_tier,
      is_good_enough: parsed.is_good_enough,
      core_strength: parsed.core_strength,
      core_weakness: parsed.core_weakness,
      reader_experience: parsed.reader_experience,
      unconventional_but_effective: parsed.unconventional_but_effective,
      unconventional_notes: parsed.unconventional_notes,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    };
  }

  /**
   * Compute word count status based on limits
   */
  private computeWordStatus(current: number, min: number, max: number): WordCountAssessment['status'] {
    if (current < min * 0.7) return 'severely_under';
    if (current < min) return 'under';
    if (current <= max) return 'optimal';
    if (current <= max * 1.1) return 'over';
    return 'severely_over';
  }

  /**
   * Quick assessment - faster but less detailed
   *
   * @param essay - The essay text to assess
   * @param essayType - The type of supplemental essay
   * @param options - Optional configuration for word limits
   */
  async quickAssess(
    essay: string,
    essayType: SupplementalType,
    options?: {
      wordLimit?: number;
      wordMin?: number;
    }
  ): Promise<{
    score: number;
    tier: 'weak' | 'needs_work' | 'strong' | 'excellent';
    core_issue: string;
    is_performative: boolean;
    word_status: 'under' | 'optimal' | 'over';
  }> {
    const typePrinciples = TYPE_SPECIFIC_PRINCIPLES[essayType];
    const wordCount = essay.split(/\s+/).filter(w => w.length > 0).length;

    // Get word limits (college-specific or default)
    const defaults = DEFAULT_WORD_LIMITS[essayType];
    const wordMax = options?.wordLimit ?? defaults.max;
    const wordMin = options?.wordMin ?? defaults.min;
    const wordStatus = wordCount < wordMin ? 'under' : wordCount > wordMax ? 'over' : 'optimal';

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: `Quick assessment of this ${essayType} essay (${wordCount} words, limit: ${wordMin}-${wordMax}):

The reader is asking: ${typePrinciples.reader_question}

---
${essay}
---

Return JSON only:
{
  "score": 0-100,
  "tier": "weak|needs_work|strong|excellent",
  "core_issue": "Main strength or weakness in one sentence",
  "is_performative": true if essay feels like performance rather than genuine communication
}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...parsed,
      word_status: wordStatus
    };
  }

  /**
   * Helper to get word limit info for a given essay type and optional college override
   */
  static getWordLimitInfo(
    essayType: SupplementalType,
    collegeWordLimit?: number,
    collegeWordMin?: number
  ): {
    min: number;
    max: number;
    typical: number;
    efficiency_mode: WordEfficiencyMode;
    is_college_specific: boolean;
  } {
    const defaults = DEFAULT_WORD_LIMITS[essayType];
    const efficiency = TYPE_WORD_EFFICIENCY[essayType];

    return {
      min: collegeWordMin ?? defaults.min,
      max: collegeWordLimit ?? defaults.max,
      typical: defaults.typical,
      efficiency_mode: efficiency,
      is_college_specific: collegeWordLimit !== undefined
    };
  }
}

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

/**
 * Compare semantic scoring with pattern-based scoring to identify discrepancies
 */
export function identifyApproachDiscrepancy(
  semanticScore: number,
  patternScore: number,
  unconventionalButEffective: boolean
): {
  significant_discrepancy: boolean;
  likely_cause: string;
  trust_semantic: boolean;
} {
  const difference = Math.abs(semanticScore - patternScore);

  if (difference < 10) {
    return {
      significant_discrepancy: false,
      likely_cause: 'Scores align - essay follows conventional patterns and succeeds/fails conventionally',
      trust_semantic: true
    };
  }

  if (semanticScore > patternScore && unconventionalButEffective) {
    return {
      significant_discrepancy: true,
      likely_cause: 'Essay succeeds through unconventional means that pattern-based scoring misses',
      trust_semantic: true
    };
  }

  if (patternScore > semanticScore) {
    return {
      significant_discrepancy: true,
      likely_cause: 'Essay has correct features but doesn\'t actually WORK - performative or shallow',
      trust_semantic: true
    };
  }

  return {
    significant_discrepancy: true,
    likely_cause: 'Unknown discrepancy - review manually',
    trust_semantic: true  // Default to semantic as it's more holistic
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SemanticScoringService;
