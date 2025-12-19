/**
 * Type-Specific Suggestion Service
 *
 * **PIQ-Quality Suggestion Generation for Supplementals**
 *
 * This service generates surgical suggestions using:
 * 1. Type-specific rubrics (14 types, each with critical dimensions)
 * 2. College overlay (values, red flags, key quotes)
 * 3. Voice fingerprint (preserve authentic voice)
 * 4. 2-Suggestion Framework (Polished Original + Voice Amplifier)
 *
 * **Key Innovations Over Generic Feedback**:
 * - Suggestions MUST align with type-specific excellence requirements
 * - Suggestions MUST demonstrate college-specific values
 * - Suggestions MUST preserve voice fingerprint
 * - Each issue gets 2 distinct suggestions (safe path + authentic path)
 *
 * **Quality Guarantees**:
 * - No banned terms (tapestry, realm, delve, etc.)
 * - Suggestions different from original (no parroting)
 * - College evidence cited in each suggestion
 * - Voice markers preserved in polished, amplified in voice
 *
 * **Cost Model**:
 * - Uses Sonnet for suggestion generation (~$0.05 per issue)
 * - Batch mode for multiple issues (~$0.08 for 3 issues)
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { SupplementalDimension, QualityTier } from '../rubrics';
import {
  TYPE_WEIGHT_CONFIGS,
  getCriticalDimensions,
  getExcellenceRequirements,
  getTopDimensions
} from '../rubrics/typeWeightMatrices';
import { DIMENSION_DEFINITIONS } from '../rubrics/universalSupplementalRubric';
import type { CollegeResearch, CollegeCoreValue, CollegeKeyQuote } from '../types/collegeResearch';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { VoiceFingerprint } from '../types/stage0Types';
import type { DetectedIssue, DimensionScore } from './typeAwareScoringService';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-20250514';

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// Banned terms that should NEVER appear in suggestions
const BANNED_TERMS = [
  'tapestry', 'realm', 'unwavering', 'testament', 'delve',
  'showcase', 'underscore', 'something', 'journey', 'toolbox',
  'unlocking potential', 'truly', 'really', 'honestly', 'basically',
  'incredible', 'amazing', 'life-changing', 'transformative experience'
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Word count constraints for the specific prompt
 */
export interface WordCountConstraints {
  min: number;
  max: number;
  current: number;
  delta: number; // positive = over, negative = under
  status: 'under' | 'within' | 'over' | 'severely_over';
}

/**
 * Type-specific suggestion constraints
 * Each essay type has different requirements for how suggestions should be formatted
 */
export interface TypeSpecificConstraints {
  max_suggestion_length: number;  // Max words for replacement text
  preserve_requirements: string[];  // What MUST be preserved
  avoid_patterns: string[];  // What to avoid in suggestions
  prioritize: string[];  // What to emphasize
  word_efficiency: 'ruthless' | 'moderate' | 'flexible';  // How aggressive with word cuts
}

/**
 * Type-specific constraint configurations for all 14 types
 */
export const TYPE_SUGGESTION_CONSTRAINTS: Record<SupplementalType, TypeSpecificConstraints> = {
  why_us: {
    max_suggestion_length: 80,
    preserve_requirements: ['specific program names', 'professor names', 'course numbers'],
    avoid_patterns: ['generic college praise', 'could swap name'],
    prioritize: ['research depth', 'mutual fit', 'unique resources'],
    word_efficiency: 'moderate'
  },
  why_major: {
    max_suggestion_length: 90,
    preserve_requirements: ['origin story details', 'field-specific concepts', 'intellectual curiosity'],
    avoid_patterns: ['career-only focus', 'generic passion statements'],
    prioritize: ['intellectual depth', 'field knowledge', 'specific questions'],
    word_efficiency: 'moderate'
  },
  community: {
    max_suggestion_length: 75,
    preserve_requirements: ['past community examples', 'specific orgs named'],
    avoid_patterns: ['vague promises', 'generic involvement'],
    prioritize: ['past predicts future', 'specific contributions', 'community research'],
    word_efficiency: 'moderate'
  },
  diversity: {
    max_suggestion_length: 120,
    preserve_requirements: ['authentic voice', 'specific experiences', 'growth evidence'],
    avoid_patterns: ['victim narrative', 'preachy tone', 'defensive language'],
    prioritize: ['vulnerability balance', 'perspective → contribution', 'resilience'],
    word_efficiency: 'flexible'
  },
  intellectual: {
    max_suggestion_length: 100,
    preserve_requirements: ['specific ideas/concepts', 'self-directed exploration', 'questions'],
    avoid_patterns: ['generic curiosity', 'surface-level engagement'],
    prioritize: ['intellectual depth', 'idea connections', 'thinking evolution'],
    word_efficiency: 'moderate'
  },
  extracurricular: {
    max_suggestion_length: 120,
    preserve_requirements: ['specific activity details', 'impact numbers', 'growth arc'],
    avoid_patterns: ['resume list', 'surface-level many'],
    prioritize: ['depth over breadth', 'character revelation', 'sustained commitment'],
    word_efficiency: 'flexible'
  },
  challenge: {
    max_suggestion_length: 150,
    preserve_requirements: ['response actions', 'growth evidence', 'sensory details'],
    avoid_patterns: ['trauma dump', 'victim language', 'instant resolution'],
    prioritize: ['20/80 rule', 'agency', 'multiple attempts', 'before/after'],
    word_efficiency: 'flexible'
  },
  leadership: {
    max_suggestion_length: 100,
    preserve_requirements: ['specific impact', 'team context', 'vulnerability'],
    avoid_patterns: ['title focus', 'bragging', 'authoritarian style'],
    prioritize: ['actions over titles', 'collaborative approach', 'growth as leader'],
    word_efficiency: 'moderate'
  },
  creative: {
    max_suggestion_length: 90,
    preserve_requirements: ['creative process details', 'unique perspective', 'personality'],
    avoid_patterns: ['generic creativity claims', 'product-only focus'],
    prioritize: ['process over product', 'identity connection', 'authenticity'],
    word_efficiency: 'moderate'
  },
  values: {
    max_suggestion_length: 100,
    preserve_requirements: ['values in action', 'origin story', 'consistency evidence'],
    avoid_patterns: ['stated values without stories', 'preachy statements'],
    prioritize: ['show don\'t tell', 'nuance', 'self-awareness'],
    word_efficiency: 'moderate'
  },
  future_goals: {
    max_suggestion_length: 75,
    preserve_requirements: ['specific goals', 'past-future connection', 'impact on others'],
    avoid_patterns: ['generic ambitions', 'career-only'],
    prioritize: ['clarity', 'achievability', 'values alignment'],
    word_efficiency: 'moderate'
  },
  additional_info: {
    max_suggestion_length: 150,
    preserve_requirements: ['new information', 'context', 'ownership'],
    avoid_patterns: ['excuses', 'redundant content', 'over-explanation'],
    prioritize: ['strategic value', 'conciseness', 'no-excuse context'],
    word_efficiency: 'moderate'
  },
  short_answer: {
    max_suggestion_length: 40,
    preserve_requirements: ['specificity', 'personality', 'every word earns place'],
    avoid_patterns: ['filler words', 'generic statements', 'throat clearing'],
    prioritize: ['punch', 'memorability', 'ruthless concision'],
    word_efficiency: 'ruthless'
  },
  optional: {
    max_suggestion_length: 120,
    preserve_requirements: ['new dimension', 'strategic purpose', 'quality bar'],
    avoid_patterns: ['repeated themes', 'low-value content'],
    prioritize: ['gap filling', 'reader\'s time worth', 'complementary content'],
    word_efficiency: 'moderate'
  }
};

/**
 * Issue context for suggestion generation
 */
export interface IssueContext {
  issue_id: string;
  quote: string;
  location: string;
  diagnosis: {
    problem: string;
    symptom_type: string;
    affected_dimensions: SupplementalDimension[];
    score_impact: number;
  };
  surrounding_context: string;
  relevant_college_values: CollegeCoreValue[];
  relevant_quotes: CollegeKeyQuote[];
}

/**
 * Polished Original suggestion
 */
export interface PolishedOriginalSuggestion {
  type: 'polished_original';
  text: string;
  rationale: string;
  what_changed: string[];
  voice_preservation: string;
  excellence_alignment: string; // How it aligns with type-specific excellence
  college_alignment: string; // How it aligns with college values
  score_impact: {
    dimension: SupplementalDimension;
    before: number;
    after: number;
    increase: number;
  };
  evidence_used: {
    quote: string;
    source: string;
  };
  when_to_use: string;
  safety_level: 'very_safe' | 'safe' | 'moderate_risk';
}

/**
 * Voice Amplifier suggestion
 */
export interface VoiceAmplifierSuggestion {
  type: 'voice_amplifier';
  text: string;
  rationale: string;
  what_changed: string[];
  voice_preservation: string;
  excellence_alignment: string;
  college_alignment: string;
  score_impact: {
    dimension: SupplementalDimension;
    before: number;
    after: number;
    increase: number;
  };
  evidence_used: {
    quote: string;
    source: string;
  };
  when_to_use: string;
  risk_level: 'low' | 'medium' | 'high';
  why_authentic: string;
  spark_moments: string[];
}

/**
 * Teaching layer for understanding the suggestion
 */
export interface SuggestionTeaching {
  type_specific_principle: string; // Why this matters for THIS type
  college_specific_context: string; // Why this college cares
  excellence_requirement_addressed: string; // Which excellence requirement this helps
  how_to_choose: {
    polished_when: string;
    voice_when: string;
    can_combine: string;
  };
  socratic_prompts: string[];
}

/**
 * Complete suggestion for a single issue
 */
export interface IssueSuggestion {
  issue_id: string;
  issue_quote: string;
  diagnosis_summary: string;
  suggestions: {
    polished_original: PolishedOriginalSuggestion;
    voice_amplifier: VoiceAmplifierSuggestion;
  };
  teaching: SuggestionTeaching;
}

/**
 * Complete batch output
 */
export interface TypeSpecificSuggestionOutput {
  essay_type: SupplementalType;
  type_name: string;
  college_name: string | null;

  issues: IssueSuggestion[];

  overall_strategy: {
    cohesive_approach: string;
    voice_consistency: string;
    priority_order: string;
    implementation_tips: string[];
  };

  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// SUGGESTION PROMPT
// ============================================================================

const TYPE_SPECIFIC_SUGGESTION_PROMPT = `You are generating PIQ-quality surgical suggestions for a supplemental essay.

CRITICAL REQUIREMENTS:
1. All suggestions must align with TYPE-SPECIFIC excellence requirements
2. All suggestions must demonstrate COLLEGE-SPECIFIC values (if provided)
3. All suggestions must PRESERVE the student's authentic voice
4. NO BANNED TERMS: {bannedTerms}
5. Generate 2 DISTINCT suggestions per issue:
   - POLISHED ORIGINAL: Safe, incremental improvement
   - VOICE AMPLIFIER: Authentic, risky alternative that amplifies personality
6. WORD COUNT CONSTRAINTS: {wordCountGuidance}
7. SUGGESTION LENGTH: Max {maxSuggestionLength} words per replacement

═══════════════════════════════════════════════════════════
ESSAY CONTEXT
═══════════════════════════════════════════════════════════

ESSAY TYPE: {essayType}
TYPE NAME: {typeName}

WORD COUNT STATUS:
- Current: {currentWordCount} words
- Limit: {wordMin}-{wordMax} words
- Status: {wordCountStatus}
{wordCountAction}

TYPE-SPECIFIC CONSTRAINTS FOR SUGGESTIONS:
- PRESERVE these elements: {preserveRequirements}
- AVOID these patterns: {avoidPatterns}
- PRIORITIZE these qualities: {prioritizeQualities}
- Word efficiency level: {wordEfficiency}

CRITICAL DIMENSIONS FOR THIS TYPE:
{criticalDimensions}

EXCELLENCE REQUIREMENTS FOR THIS TYPE:
{excellenceRequirements}

TOP 3 DIMENSIONS BY WEIGHT:
{topDimensions}

═══════════════════════════════════════════════════════════
COLLEGE CONTEXT
═══════════════════════════════════════════════════════════

{collegeContext}

═══════════════════════════════════════════════════════════
VOICE FINGERPRINT (MUST PRESERVE)
═══════════════════════════════════════════════════════════

{voiceFingerprint}

═══════════════════════════════════════════════════════════
FULL ESSAY DRAFT
═══════════════════════════════════════════════════════════

{essayDraft}

═══════════════════════════════════════════════════════════
ISSUES TO ADDRESS (generate 2 suggestions each)
═══════════════════════════════════════════════════════════

{issuesFormatted}

═══════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════

For EACH issue, provide:

### POLISHED ORIGINAL
- text: Refined version (exact replacement text)
- rationale: Why this works (cite type requirements AND college values)
- what_changed: List of specific improvements
- voice_preservation: How we kept authenticity
- excellence_alignment: Which type-specific excellence requirement this addresses
- college_alignment: Which college value this demonstrates
- score_impact: { dimension, before, after, increase }
- evidence_used: { quote, source }
- when_to_use: Student guidance
- safety_level: very_safe | safe | moderate_risk

### VOICE AMPLIFIER
- text: Authentic alternative (exact replacement text)
- rationale: Why this feels more genuine
- what_changed: List of specific improvements
- voice_preservation: How we amplified authenticity
- excellence_alignment: Which type-specific excellence requirement this addresses
- college_alignment: Which college value this demonstrates
- score_impact: { dimension, before, after, increase }
- evidence_used: { quote, source }
- when_to_use: Student guidance
- risk_level: low | medium | high
- why_authentic: What makes this real
- spark_moments: Phrases where personality shines

### TEACHING
- type_specific_principle: Why this matters for THIS essay type
- college_specific_context: Why THIS college cares about this
- excellence_requirement_addressed: Which requirement this helps meet
- how_to_choose: { polished_when, voice_when, can_combine }
- socratic_prompts: 2-3 questions to deepen thinking

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "issues": [
    {
      "issue_id": "...",
      "issue_quote": "...",
      "diagnosis_summary": "...",
      "suggestions": {
        "polished_original": { ... },
        "voice_amplifier": { ... }
      },
      "teaching": { ... }
    }
  ],
  "overall_strategy": {
    "cohesive_approach": "How all suggestions work together",
    "voice_consistency": "How we maintained unified voice",
    "priority_order": "Which issue to tackle first and why",
    "implementation_tips": ["tip 1", "tip 2", "tip 3"]
  }
}`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format college context for prompt
 */
function formatCollegeContext(college?: CollegeResearch): string {
  if (!college) {
    return 'No specific college provided. Generate universal quality suggestions.';
  }

  const values = college.coreValues?.slice(0, 4) || [];
  const quotes = college.keyQuotes?.slice(0, 3) || [];

  return `
COLLEGE: ${college.collegeName}

CORE VALUES TO DEMONSTRATE:
${values.map((v: CollegeCoreValue, i: number) => `${i + 1}. ${v.valueName}: ${v.essayImplication}
   Evidence: "${v.evidence?.[0]?.quote || 'N/A'}"
   Definition: ${v.definition}`).join('\n')}

KEY QUOTES TO CITE:
${quotes.map((q: CollegeKeyQuote, i: number) => `${i + 1}. "${q.quote}" - ${q.source?.name || 'Unknown'}
   Context: ${q.context}`).join('\n')}
`;
}

/**
 * Format voice fingerprint for prompt
 */
function formatVoiceFingerprint(voice?: VoiceFingerprint): string {
  if (!voice) {
    return 'No voice fingerprint provided. Infer voice from essay.';
  }

  return `
DOMINANT REGISTER: ${voice.dominant_register}
VOICE QUALITIES: ${voice.voice_qualities?.join(', ') || 'Not specified'}
VOCABULARY LEVEL: ${voice.vocabulary_level || 'Not specified'}
AUTHENTIC PHRASES (MUST preserve in polished, amplify in voice):
${voice.authentic_phrases?.map(p => `- "${p}"`).join('\n') || '- No specific phrases identified'}
EMOTIONAL RANGE: ${voice.emotional_range || 'Not specified'}
SENTENCE RHYTHM: ${voice.sentence_rhythm || 'Not specified'}
`;
}

/**
 * Format issues for prompt
 */
function formatIssues(issues: IssueContext[]): string {
  return issues.map((issue, idx) => `
───────────────────────────────────────────────────────────
ISSUE ${idx + 1}: ${issue.diagnosis.problem}
───────────────────────────────────────────────────────────

ISSUE ID: ${issue.issue_id}
TARGET QUOTE: "${issue.quote}"
LOCATION: ${issue.location}

DIAGNOSIS:
- Problem: ${issue.diagnosis.problem}
- Symptom Type: ${issue.diagnosis.symptom_type}
- Affected Dimensions: ${issue.diagnosis.affected_dimensions.join(', ')}
- Score Impact: ${issue.diagnosis.score_impact}

SURROUNDING CONTEXT:
${issue.surrounding_context}

RELEVANT COLLEGE VALUES:
${issue.relevant_college_values.map(v => `- ${v.value_name}: ${v.what_demonstrates_it}`).join('\n') || '- None specified'}

RELEVANT QUOTES TO CITE:
${issue.relevant_quotes.map(q => `- "${q.quote}" (${q.source})`).join('\n') || '- None specified'}
`).join('\n\n');
}

/**
 * Validate suggestion (no banned terms, different from original)
 */
function validateSuggestion(
  suggestion: any,
  originalQuote: string,
  voice?: VoiceFingerprint
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!suggestion.text || !suggestion.rationale) {
    return { valid: false, warnings: ['Missing text or rationale'] };
  }

  if (suggestion.text === originalQuote) {
    return { valid: false, warnings: ['Suggestion identical to original'] };
  }

  const lowerText = suggestion.text.toLowerCase();
  for (const term of BANNED_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      warnings.push(`Contains banned term: "${term}"`);
    }
  }

  // Check voice preservation for polished original
  if (suggestion.type === 'polished_original' && voice?.authentic_phrases) {
    const preserved = voice.authentic_phrases.filter(p =>
      suggestion.text.toLowerCase().includes(p.toLowerCase())
    );
    if (preserved.length < voice.authentic_phrases.length * 0.4) {
      warnings.push('May over-edit authentic voice');
    }
  }

  return { valid: warnings.length === 0, warnings };
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  return inputTokens * SONNET_PRICING.input + outputTokens * SONNET_PRICING.output;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class TypeSpecificSuggestionService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate type-specific suggestions for multiple issues (batch mode)
   *
   * This is the main entry point for PIQ-quality suggestion generation.
   * It uses a single API call for all issues (cost efficient + coherent strategy).
   */
  async generateSuggestions(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
      wordLimits?: { min: number; max: number };  // College-specific word limits override
    } = {}
  ): Promise<TypeSpecificSuggestionOutput> {
    const { college, voice, wordLimits } = options;

    if (issues.length === 0 || issues.length > 5) {
      throw new Error('Batch suggestion supports 1-5 issues (optimal: 3)');
    }

    const config = TYPE_WEIGHT_CONFIGS[essayType];
    const constraints = TYPE_SUGGESTION_CONSTRAINTS[essayType];

    // Calculate word count status
    const wordCount = essayDraft.split(/\s+/).length;
    const effectiveWordLimits = wordLimits || config.word_range;
    const wordDelta = wordCount - effectiveWordLimits.max;
    const wordStatus = this.getWordCountStatus(wordCount, effectiveWordLimits);
    const wordCountAction = this.getWordCountAction(wordStatus, wordDelta, constraints.word_efficiency);
    const wordCountGuidance = this.getWordCountGuidance(wordStatus, constraints.word_efficiency);

    // Build prompt with all constraints
    const prompt = TYPE_SPECIFIC_SUGGESTION_PROMPT
      .replace('{bannedTerms}', BANNED_TERMS.join(', '))
      .replace('{essayType}', essayType)
      .replace('{typeName}', config.name)
      .replace('{currentWordCount}', String(wordCount))
      .replace('{wordMin}', String(effectiveWordLimits.min))
      .replace('{wordMax}', String(effectiveWordLimits.max))
      .replace('{wordCountStatus}', wordStatus)
      .replace('{wordCountAction}', wordCountAction)
      .replace('{wordCountGuidance}', wordCountGuidance)
      .replace('{maxSuggestionLength}', String(constraints.max_suggestion_length))
      .replace('{preserveRequirements}', constraints.preserve_requirements.join(', '))
      .replace('{avoidPatterns}', constraints.avoid_patterns.join(', '))
      .replace('{prioritizeQualities}', constraints.prioritize.join(', '))
      .replace('{wordEfficiency}', constraints.word_efficiency.toUpperCase())
      .replace('{criticalDimensions}', getCriticalDimensions(essayType).map(d => {
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name}: ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{excellenceRequirements}', getExcellenceRequirements(essayType).map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .replace('{topDimensions}', getTopDimensions(essayType, 3).map(d => {
        const weight = config.weights[d];
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name} (${weight}%): ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{collegeContext}', formatCollegeContext(college))
      .replace('{voiceFingerprint}', formatVoiceFingerprint(voice))
      .replace('{essayDraft}', essayDraft)
      .replace('{issuesFormatted}', formatIssues(issues));

    // Make API call
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000, // Room for multiple issues with full teaching
      temperature: 0.7, // Creative but not random
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse response
    const parsed = parseClaudeJSON(content.text, 'TypeSpecificSuggestionOutput');

    // Validate and filter suggestions
    const validatedIssues: IssueSuggestion[] = [];

    for (const issue of parsed.issues || []) {
      const originalIssue = issues.find(i => i.issue_id === issue.issue_id);
      const originalQuote = originalIssue?.quote || '';

      // Validate polished
      const polishedValidation = validateSuggestion(
        issue.suggestions?.polished_original,
        originalQuote,
        voice
      );

      // Validate voice
      const voiceValidation = validateSuggestion(
        issue.suggestions?.voice_amplifier,
        originalQuote,
        voice
      );

      // Add warnings to suggestions
      if (issue.suggestions?.polished_original) {
        issue.suggestions.polished_original.validation_warnings = polishedValidation.warnings;
      }
      if (issue.suggestions?.voice_amplifier) {
        issue.suggestions.voice_amplifier.validation_warnings = voiceValidation.warnings;
      }

      validatedIssues.push(issue);
    }

    // Calculate cost
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return {
      essay_type: essayType,
      type_name: config.name,
      college_name: college?.collegeName || null,

      issues: validatedIssues,

      overall_strategy: parsed.overall_strategy || {
        cohesive_approach: 'Address issues in priority order',
        voice_consistency: 'Maintain authentic voice throughout',
        priority_order: 'Focus on critical dimensions first',
        implementation_tips: ['Apply suggestions gradually', 'Re-read for flow', 'Preserve voice markers']
      },

      cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    };
  }

  /**
   * Get word count status based on current count and limits
   */
  private getWordCountStatus(
    wordCount: number,
    limits: { min: number; max: number }
  ): 'under' | 'within' | 'over' | 'severely_over' {
    if (wordCount < limits.min) return 'under';
    if (wordCount <= limits.max) return 'within';
    if (wordCount <= limits.max * 1.15) return 'over';
    return 'severely_over';
  }

  /**
   * Get actionable word count guidance for the prompt
   */
  private getWordCountAction(
    status: string,
    delta: number,
    efficiency: 'ruthless' | 'moderate' | 'flexible'
  ): string {
    if (status === 'within') {
      return '✓ Word count is within limits. Focus on quality improvements.';
    }
    if (status === 'under') {
      return `⚠ Essay is ${Math.abs(delta)} words UNDER minimum. Suggestions should ADD content, not trim.`;
    }
    if (status === 'over') {
      const action = efficiency === 'ruthless'
        ? `CRITICAL: Essay is ${delta} words OVER. Every suggestion MUST be shorter than original. Cut aggressively.`
        : `Essay is ${delta} words over. Prefer suggestions that tighten language while preserving meaning.`;
      return `⚠ ${action}`;
    }
    // severely_over
    return `🚨 SEVERELY OVER by ${delta} words. Suggestions MUST cut words. Prioritize condensation over other improvements.`;
  }

  /**
   * Get word count guidance for overall approach
   */
  private getWordCountGuidance(
    status: string,
    efficiency: 'ruthless' | 'moderate' | 'flexible'
  ): string {
    const baseGuidance: Record<string, string> = {
      under: 'Suggestions should expand and add depth without padding',
      within: 'Balance quality improvements with word efficiency',
      over: 'Suggestions should be more concise than originals',
      severely_over: 'PRIORITIZE word reduction in every suggestion'
    };

    const efficiencyMod: Record<string, string> = {
      ruthless: '. Apply maximum word efficiency - every word must earn its place',
      moderate: '. Balance content quality with reasonable word efficiency',
      flexible: '. Prioritize content quality; word count is secondary'
    };

    return baseGuidance[status] + efficiencyMod[efficiency];
  }

  /**
   * Generate suggestions for a single issue (smaller, more focused)
   */
  async generateSingleIssueSuggestion(
    essayDraft: string,
    essayType: SupplementalType,
    issue: IssueContext,
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
    } = {}
  ): Promise<IssueSuggestion> {
    const result = await this.generateSuggestions(
      essayDraft,
      essayType,
      [issue],
      options
    );

    return result.issues[0];
  }

  /**
   * Create issue context from scoring output
   */
  static createIssueContext(
    detectedIssue: DetectedIssue,
    essayDraft: string,
    college?: CollegeResearch
  ): IssueContext {
    // Find surrounding context
    const quoteIndex = essayDraft.indexOf(detectedIssue.location);
    const start = Math.max(0, quoteIndex - 300);
    const end = Math.min(essayDraft.length, quoteIndex + detectedIssue.location.length + 300);
    const surroundingContext = quoteIndex >= 0
      ? essayDraft.substring(start, end)
      : essayDraft.substring(0, 600);

    // Find relevant college values
    const relevantValues: CollegeCoreValue[] = [];
    if (college?.coreValues) {
      for (const dim of detectedIssue.affected_dimensions) {
        const matchingValue = college.coreValues.find((v: CollegeCoreValue) =>
          v.valueName.toLowerCase().includes(dim.toLowerCase()) ||
          dim.toLowerCase().includes(v.valueName.toLowerCase())
        );
        if (matchingValue) {
          relevantValues.push(matchingValue);
        }
      }
    }

    // Find relevant quotes
    const relevantQuotes: CollegeKeyQuote[] = [];
    if (college?.keyQuotes) {
      for (const dim of detectedIssue.affected_dimensions) {
        const matchingQuote = college.keyQuotes.find((q: CollegeKeyQuote) =>
          q.useCases?.some(uc => uc.dimension?.toLowerCase().includes(dim.toLowerCase()))
        );
        if (matchingQuote) {
          relevantQuotes.push(matchingQuote);
        }
      }
    }

    return {
      issue_id: detectedIssue.pattern_id,
      quote: detectedIssue.location,
      location: 'In essay draft',
      diagnosis: {
        problem: detectedIssue.problem_description,
        symptom_type: detectedIssue.pattern_name,
        affected_dimensions: detectedIssue.affected_dimensions,
        score_impact: detectedIssue.score_impact
      },
      surrounding_context: surroundingContext,
      relevant_college_values: relevantValues,
      relevant_quotes: relevantQuotes.slice(0, 2)
    };
  }
}

// ============================================================================
// EXPORTS
// All types, interfaces, and constants are exported at their definitions above.
// TypeSpecificSuggestionService is the main class export.
// TYPE_SUGGESTION_CONSTRAINTS contains all 14 type-specific constraint configs.
// ============================================================================
