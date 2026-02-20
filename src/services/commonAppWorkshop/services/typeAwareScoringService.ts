// @ts-nocheck
/**
 * Type-Aware Scoring Service
 *
 * **The Core of the Evolved Generation System**
 *
 * This service scores supplemental essays using:
 * 1. 12 Universal Dimensions (from universalSupplementalRubric.ts)
 * 2. Type-Specific Weights (from typeWeightMatrices.ts - 14 matrices, all sum to 100)
 * 3. Issue Detection Patterns (from issueDetectionPatterns.ts - 19 patterns)
 * 4. College Overlay (optional - adds college-specific context)
 *
 * **How It Works**:
 * - Claude scores all 12 dimensions (0-10 each)
 * - Weights are applied based on essay type (why_us weights research_depth, challenge weights growth_transformation)
 * - Critical dimensions are flagged (if low, these tank the overall score)
 * - Issue patterns are detected for targeted feedback
 * - Final weighted score (0-100) and quality tier computed
 *
 * **Quality Tiers**:
 * - Excellent: 85+ (top 10% quality)
 * - Strong: 70-84 (competitive)
 * - Needs Work: 50-69 (significant gaps)
 * - Weak: <50 (fundamental issues)
 *
 * **Cost Model**:
 * - Scoring uses Haiku for efficiency ($0.02 per essay)
 * - Optional Sonnet for deeper analysis ($0.05 per essay)
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import {
  DIMENSION_DEFINITIONS,
  getAllDimensions,
  getQualityTier,
  isRedFlagPhrase,
  type SupplementalDimension,
  type QualityTier
} from '../rubrics';
import {
  TYPE_WEIGHT_CONFIGS,
  calculateWeightedScore,
  getCriticalDimensions,
  getNotApplicableDimensions,
  getExcellenceRequirements,
  getTopDimensions
} from '../rubrics/typeWeightMatrices';
import {
  ALL_ISSUE_PATTERNS,
  detectPhrasePatterns,
  getPatternsByType,
  type IssuePattern,
  type IssueSeverity
} from '../rubrics/issueDetectionPatterns';
import type { CollegeResearch, CollegeCoreValue } from '../types/collegeResearch';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

const HAIKU_PRICING = {
  input: 0.25 / 1_000_000,   // $0.25 per million input tokens
  output: 1.25 / 1_000_000,  // $1.25 per million output tokens
};

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,   // $3 per million input tokens
  output: 15.0 / 1_000_000, // $15 per million output tokens
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Single dimension score with justification
 */
export interface DimensionScore {
  dimension: SupplementalDimension;
  score: number; // 0-10
  justification: string;
  strengths: string[];
  weaknesses: string[];
  evidence_quotes: string[]; // Direct quotes from essay
}

/**
 * Detected issue with severity and fix guidance
 */
export interface DetectedIssue {
  pattern_id: string;
  pattern_name: string;
  severity: IssueSeverity;
  affected_dimensions: SupplementalDimension[];
  location: string; // Quote or location in essay
  problem_description: string;
  fix_suggestions: string[];
  score_impact: number; // -1 to -5
}

/**
 * Red flag detected in essay
 */
export interface RedFlagDetection {
  phrase: string;
  matched_pattern: string;
  reason: string;
  suggestion: string;
}

/**
 * Critical dimension assessment
 */
export interface CriticalDimensionAssessment {
  dimension: SupplementalDimension;
  is_critical_for_type: boolean;
  score: number;
  meets_threshold: boolean; // Critical dimensions need 7+ to pass
  gap_from_threshold: number;
  impact_if_not_met: string;
}

/**
 * Complete scoring output
 */
export interface TypeAwareScoringOutput {
  // Type context
  essay_type: SupplementalType;
  type_name: string;
  word_count: number;
  word_range: { min: number; max: number };
  word_count_ok: boolean;

  // Dimension scores
  dimension_scores: DimensionScore[];

  // Critical dimension assessment
  critical_assessment: CriticalDimensionAssessment[];

  // Weighted score
  weighted_score: number; // 0-100
  quality_tier: QualityTier;

  // Issue detection
  detected_issues: DetectedIssue[];
  red_flags: RedFlagDetection[];

  // Excellence requirements
  excellence_requirements: {
    requirement: string;
    met: boolean;
    evidence: string;
  }[];

  // Summary
  summary: {
    overall_assessment: string;
    top_strengths: string[];
    priority_improvements: string[];
    score_projection_if_fixed: number;
  };

  // Cost tracking
  cost: number;
  model_used: string;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// SCORING PROMPT
// ============================================================================

const TYPE_AWARE_SCORING_PROMPT = `You are scoring a supplemental essay using a type-specific rubric system.

═══════════════════════════════════════════════════════════
ESSAY TYPE: {essayType}
TYPE NAME: {typeName}
WORD RANGE: {wordMin}-{wordMax} words
═══════════════════════════════════════════════════════════

ESSAY TO SCORE:
---
{essayDraft}
---
Word Count: {wordCount}

═══════════════════════════════════════════════════════════
DIMENSION WEIGHTS FOR THIS TYPE (must sum to 100)
═══════════════════════════════════════════════════════════

{dimensionWeightsFormatted}

CRITICAL DIMENSIONS (must be 7+ for strong essay):
{criticalDimensions}

DIMENSIONS NOT APPLICABLE FOR THIS TYPE:
{notApplicableDimensions}

═══════════════════════════════════════════════════════════
12 UNIVERSAL DIMENSIONS TO SCORE
═══════════════════════════════════════════════════════════

{dimensionDefinitionsFormatted}

═══════════════════════════════════════════════════════════
EXCELLENCE REQUIREMENTS FOR THIS TYPE
═══════════════════════════════════════════════════════════

{excellenceRequirements}

═══════════════════════════════════════════════════════════
COLLEGE CONTEXT (if provided)
═══════════════════════════════════════════════════════════

{collegeContext}

═══════════════════════════════════════════════════════════
SCORING INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. Score EACH of the 12 dimensions on a 0-10 scale:
   - 9-10: Excellent (top 10%)
   - 7-8: Strong (competitive)
   - 5-6: Adequate (needs work)
   - 3-4: Weak (significant issues)
   - 1-2: Poor (fundamental problems)

2. For each dimension, provide:
   - score (0-10)
   - justification (1-2 sentences)
   - strengths (bullet points)
   - weaknesses (bullet points)
   - evidence_quotes (direct quotes from essay)

3. Identify issues by checking for these patterns:
   - SWAP_TEST_FAIL: Could swap college name
   - GENERIC_OPENING: "I've always been passionate about..."
   - ESSAY_SPEAK: "This experience taught me..."
   - VULNERABILITY_DUMP: Oversharing without growth
   - LISTING_NOT_SHOWING: Surface lists without depth
   - MISSING_SPECIFICITY: Vague, no concrete details

4. Check excellence requirements - did essay meet each one?

5. Calculate weighted score: sum(dimension_score × weight) / 10

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "dimension_scores": [
    {
      "dimension": "specificity_evidence",
      "score": 7,
      "justification": "...",
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "evidence_quotes": ["...", "..."]
    },
    // ... all 12 dimensions
  ],
  "detected_issues": [
    {
      "pattern_id": "SWAP_TEST_FAIL",
      "pattern_name": "College Name Swap Test Failure",
      "severity": "critical",
      "affected_dimensions": ["fit_demonstration", "research_depth"],
      "location": "Your essay could work for almost any selective college",
      "problem_description": "...",
      "fix_suggestions": ["...", "..."],
      "score_impact": -4
    }
  ],
  "red_flags": [
    {
      "phrase": "I have always been passionate about",
      "matched_pattern": "generic_opening",
      "reason": "...",
      "suggestion": "..."
    }
  ],
  "excellence_requirements": [
    {
      "requirement": "Names 3-5 specific resources",
      "met": false,
      "evidence": "Only mentions 1 program by name"
    }
  ],
  "summary": {
    "overall_assessment": "...",
    "top_strengths": ["...", "..."],
    "priority_improvements": ["...", "..."],
    "score_projection_if_fixed": 78
  }
}`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format dimension definitions for prompt
 */
function formatDimensionDefinitions(): string {
  const dimensions = getAllDimensions();
  return dimensions.map(dim => {
    const def = DIMENSION_DEFINITIONS[dim];
    return `
**${def.name}** (${dim})
${def.description}
Measures: ${def.what_it_measures}
Scoring:
- Excellent (9-10): ${def.scoring_criteria.excellent}
- Strong (7-8): ${def.scoring_criteria.strong}
- Adequate (5-6): ${def.scoring_criteria.adequate}
- Weak (3-4): ${def.scoring_criteria.weak}
- Poor (1-2): ${def.scoring_criteria.poor}
`;
  }).join('\n');
}

/**
 * Format dimension weights for a specific type
 */
function formatDimensionWeights(type: SupplementalType): string {
  const config = TYPE_WEIGHT_CONFIGS[type];
  const weights = config.weights;

  return Object.entries(weights)
    .sort(([, a], [, b]) => b - a) // Sort by weight descending
    .map(([dim, weight]) => `- ${dim}: ${weight}%${weight >= 12 ? ' (HIGH PRIORITY)' : weight >= 10 ? ' (IMPORTANT)' : ''}`)
    .join('\n');
}

/**
 * Format college context for scoring
 */
function formatCollegeContext(college?: CollegeResearch): string {
  if (!college) {
    return 'No specific college context provided. Score based on universal essay quality standards.';
  }

  const values = college.coreValues?.slice(0, 3) || [];
  const valueStr = values.map((v: CollegeCoreValue) =>
    `- ${v.valueName}: ${v.essayImplication}`
  ).join('\n');

  return `
College: ${college.collegeName}
Core Values:
${valueStr}

Consider how well the essay demonstrates these values.
`;
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = model.includes('haiku') ? HAIKU_PRICING : SONNET_PRICING;
  return inputTokens * pricing.input + outputTokens * pricing.output;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class TypeAwareScoringService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Score an essay with type-aware rubric
   *
   * This is the core scoring function that:
   * 1. Scores all 12 dimensions
   * 2. Applies type-specific weights
   * 3. Detects issues and red flags
   * 4. Checks excellence requirements
   * 5. Provides actionable summary
   */
  async scoreEssay(
    essayDraft: string,
    essayType: SupplementalType,
    options: {
      college?: CollegeResearch;
      useDeepAnalysis?: boolean; // Use Sonnet instead of Haiku
    } = {}
  ): Promise<TypeAwareScoringOutput> {
    const { college, useDeepAnalysis = false } = options;

    const config = TYPE_WEIGHT_CONFIGS[essayType];
    const wordCount = essayDraft.split(/\s+/).length;

    // Pre-process: detect red flags locally (faster than API)
    const localRedFlags = this.detectLocalRedFlags(essayDraft);
    const localIssuePatterns = detectPhrasePatterns(essayDraft);

    // Build prompt
    const prompt = TYPE_AWARE_SCORING_PROMPT
      .replace('{essayType}', essayType)
      .replace('{typeName}', config.name)
      .replace('{wordMin}', String(config.word_range.min))
      .replace('{wordMax}', String(config.word_range.max))
      .replace('{essayDraft}', essayDraft)
      .replace('{wordCount}', String(wordCount))
      .replace('{dimensionWeightsFormatted}', formatDimensionWeights(essayType))
      .replace('{criticalDimensions}', getCriticalDimensions(essayType).join(', '))
      .replace('{notApplicableDimensions}', getNotApplicableDimensions(essayType).join(', ') || 'None')
      .replace('{dimensionDefinitionsFormatted}', formatDimensionDefinitions())
      .replace('{excellenceRequirements}', getExcellenceRequirements(essayType).map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .replace('{collegeContext}', formatCollegeContext(college));

    // Make API call
    const model = useDeepAnalysis ? SONNET_MODEL : HAIKU_MODEL;
    const response = await this.client.messages.create({
      model,
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for consistent scoring
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse response
    const parsed = parseClaudeJSON(content.text, 'TypeAwareScoringOutput');

    // Calculate weighted score from dimension scores
    const dimensionScores: Record<SupplementalDimension, number> = {} as Record<SupplementalDimension, number>;
    for (const ds of parsed.dimension_scores) {
      dimensionScores[ds.dimension as SupplementalDimension] = ds.score;
    }
    const weightedScore = calculateWeightedScore(essayType, dimensionScores);

    // Assess critical dimensions
    const criticalDimensions = getCriticalDimensions(essayType);
    const criticalAssessment: CriticalDimensionAssessment[] = criticalDimensions.map(dim => {
      const score = dimensionScores[dim] || 0;
      return {
        dimension: dim,
        is_critical_for_type: true,
        score,
        meets_threshold: score >= 7,
        gap_from_threshold: Math.max(0, 7 - score),
        impact_if_not_met: `${dim} is critical for ${config.name}. Score of ${score} may significantly hurt overall impression.`
      };
    });

    // Merge local red flags with API-detected ones
    const allRedFlags = [
      ...localRedFlags,
      ...(parsed.red_flags || [])
    ];

    // Merge local issue patterns with API-detected ones
    const typePatterns = getPatternsByType(essayType);
    const localDetectedIssues = localIssuePatterns.map(patternId => {
      const pattern = typePatterns.find(p => p.id === patternId);
      if (!pattern) return null;
      return {
        pattern_id: pattern.id,
        pattern_name: pattern.name,
        severity: pattern.severity,
        affected_dimensions: pattern.affected_dimensions,
        location: 'Detected via phrase matching',
        problem_description: pattern.problem_description,
        fix_suggestions: pattern.fix_suggestions,
        score_impact: pattern.score_impact
      };
    }).filter(Boolean) as DetectedIssue[];

    const allIssues = [
      ...localDetectedIssues,
      ...(parsed.detected_issues || [])
    ];

    // Calculate cost
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens,
      model
    );

    return {
      essay_type: essayType,
      type_name: config.name,
      word_count: wordCount,
      word_range: config.word_range,
      word_count_ok: wordCount >= config.word_range.min && wordCount <= config.word_range.max,

      dimension_scores: parsed.dimension_scores,
      critical_assessment: criticalAssessment,

      weighted_score: weightedScore,
      quality_tier: getQualityTier(weightedScore),

      detected_issues: allIssues,
      red_flags: allRedFlags,

      excellence_requirements: parsed.excellence_requirements || [],

      summary: {
        overall_assessment: parsed.summary?.overall_assessment || `Essay scores ${weightedScore}/100 (${getQualityTier(weightedScore)})`,
        top_strengths: parsed.summary?.top_strengths || [],
        priority_improvements: parsed.summary?.priority_improvements || [],
        score_projection_if_fixed: parsed.summary?.score_projection_if_fixed || Math.min(100, weightedScore + 15)
      },

      cost,
      model_used: model,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    };
  }

  /**
   * Detect red flags locally (faster than API)
   */
  private detectLocalRedFlags(essayDraft: string): RedFlagDetection[] {
    const redFlags: RedFlagDetection[] = [];

    // Check each sentence
    const sentences = essayDraft.split(/[.!?]+/).filter(s => s.trim().length > 0);

    for (const sentence of sentences) {
      const result = isRedFlagPhrase(sentence);
      if (result.isRedFlag) {
        redFlags.push({
          phrase: sentence.trim().substring(0, 100) + (sentence.length > 100 ? '...' : ''),
          matched_pattern: result.matchedPatterns[0] || 'generic',
          reason: result.reason,
          suggestion: result.suggestion
        });
      }
    }

    return redFlags;
  }

  /**
   * Quick score (Haiku only, no deep analysis)
   */
  async quickScore(
    essayDraft: string,
    essayType: SupplementalType
  ): Promise<{ score: number; tier: QualityTier; topIssues: string[] }> {
    const result = await this.scoreEssay(essayDraft, essayType);
    return {
      score: result.weighted_score,
      tier: result.quality_tier,
      topIssues: result.summary.priority_improvements.slice(0, 3)
    };
  }

  /**
   * Compare essay against type-specific excellence requirements
   */
  async checkExcellence(
    essayDraft: string,
    essayType: SupplementalType
  ): Promise<{
    meetsExcellenceBar: boolean;
    requirementsMet: number;
    requirementsTotal: number;
    missingRequirements: string[];
  }> {
    const result = await this.scoreEssay(essayDraft, essayType);

    const met = result.excellence_requirements.filter(r => r.met).length;
    const total = result.excellence_requirements.length;
    const missing = result.excellence_requirements
      .filter(r => !r.met)
      .map(r => r.requirement);

    return {
      meetsExcellenceBar: met >= Math.ceil(total * 0.8) && result.weighted_score >= 85,
      requirementsMet: met,
      requirementsTotal: total,
      missingRequirements: missing
    };
  }

  /**
   * Get dimension-specific feedback for a weak dimension
   */
  getDimensionFeedback(
    dimension: SupplementalDimension,
    score: number,
    essayType: SupplementalType
  ): {
    dimension: string;
    current_score: number;
    weight_for_type: number;
    is_critical: boolean;
    improvement_guidance: string;
    excellence_criteria: string;
  } {
    const def = DIMENSION_DEFINITIONS[dimension];
    const weight = TYPE_WEIGHT_CONFIGS[essayType].weights[dimension];
    const isCritical = getCriticalDimensions(essayType).includes(dimension);

    let guidance = '';
    if (score < 5) {
      guidance = `Major improvement needed. Focus on: ${def.scoring_criteria.adequate}`;
    } else if (score < 7) {
      guidance = `Good foundation, needs strengthening. Target: ${def.scoring_criteria.strong}`;
    } else if (score < 9) {
      guidance = `Strong, can push to excellent. Consider: ${def.scoring_criteria.excellent}`;
    } else {
      guidance = 'Excellent. Maintain this quality.';
    }

    return {
      dimension: def.name,
      current_score: score,
      weight_for_type: weight,
      is_critical: isCritical,
      improvement_guidance: guidance,
      excellence_criteria: def.scoring_criteria.excellent
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DimensionScore,
  DetectedIssue,
  RedFlagDetection,
  CriticalDimensionAssessment,
  TypeAwareScoringOutput
};
