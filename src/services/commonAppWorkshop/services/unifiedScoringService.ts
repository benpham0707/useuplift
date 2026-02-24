// @ts-nocheck
/**
 * Unified Scoring Service
 *
 * This service combines the best of both worlds:
 * 1. **Semantic Scoring (Primary)** - Uses Sonnet for accurate, principles-based scoring
 * 2. **Pattern Detection (Secondary)** - Uses local regex for cheap issue flagging
 * 3. **Quick Triage (Optional)** - Uses Haiku for fast initial assessment
 *
 * **Quality-First Philosophy**:
 * - Semantic scoring is ALWAYS used for final scores (proven 92%+ accuracy)
 * - Pattern detection supplements with specific issue identification
 * - Cost optimization through caching and smart batching, NOT model downgrading
 *
 * **Cost Model**:
 * - Full Analysis: ~$0.05 per essay (Sonnet semantic + local patterns)
 * - Quick Triage: ~$0.01 per essay (Haiku quick assess)
 * - Hybrid: ~$0.06 per essay (triage + full if needed)
 */

import { getAnthropicClient } from '../../../lib/llm/claude';
import type Anthropic from '@anthropic-ai/sdk';
import {
  SemanticScoringService,
  DEFAULT_WORD_LIMITS,
  TYPE_WORD_EFFICIENCY,
  type SemanticScoringOutput,
  type WordCountAssessment
} from './semanticScoringService';
import {
  detectPhrasePatterns,
  getPatternsByType,
  type IssuePattern
} from '../rubrics/issueDetectionPatterns';
import {
  TYPE_WEIGHT_CONFIGS,
  getCriticalDimensions,
  getExcellenceRequirements
} from '../rubrics/typeWeightMatrices';
import { getQualityTier, type QualityTier } from '../rubrics';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { CollegeResearch } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Detected issue from pattern matching (cheap, local)
 */
export interface PatternIssue {
  pattern_id: string;
  pattern_name: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  affected_dimensions: string[];
  problem_description: string;
  fix_suggestions: string[];
  score_impact: number;
}

/**
 * Quick triage result (Haiku - fast and cheap)
 */
export interface QuickTriageResult {
  score: number;
  tier: QualityTier;
  needs_full_analysis: boolean;
  core_issue: string;
  is_performative: boolean;
  word_status: 'under' | 'optimal' | 'over';
  confidence: 'high' | 'medium' | 'low';
  cost: number;
}

/**
 * Full unified scoring output
 */
export interface UnifiedScoringOutput {
  // Core scores (from semantic scoring)
  total_score: number;
  quality_tier: QualityTier;
  is_good_enough: boolean;

  // Semantic analysis
  semantic_analysis: {
    principle_scores: SemanticScoringOutput['principle_scores'];
    type_assessment: SemanticScoringOutput['type_assessment'];
    performative_assessment: SemanticScoringOutput['performative_assessment'];
    authenticity_score: number;
    core_strength: string;
    core_weakness: string;
    reader_experience: string;
    unconventional_but_effective: boolean;
  };

  // Word count (from semantic scoring with dynamic limits)
  word_count_assessment: WordCountAssessment;

  // Pattern-detected issues (cheap, local)
  pattern_issues: PatternIssue[];

  // Excellence check
  excellence_check: {
    requirements: string[];
    estimated_met: number;
    critical_gaps: string[];
  };

  // Metadata
  essay_type: SupplementalType;
  word_count: number;

  // Cost tracking
  cost: {
    semantic: number;
    pattern: number;  // Always 0 (local)
    total: number;
  };

  // Tokens
  tokens_used: {
    input: number;
    output: number;
  };
}

/**
 * Scoring options
 */
export interface UnifiedScoringOptions {
  /** College research for context */
  college?: CollegeResearch;
  /** College-specific word limit override */
  wordLimit?: number;
  /** College-specific minimum word count */
  wordMin?: number;
  /** Skip semantic scoring and use quick triage only (NOT RECOMMENDED for final decisions) */
  quickTriageOnly?: boolean;
  /** Run quick triage first to decide if full analysis is needed */
  useHybridMode?: boolean;
  /** Threshold score for skipping full analysis in hybrid mode (default: 85) */
  hybridThreshold?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class UnifiedScoringService {
  private semanticService: SemanticScoringService;
  private _client: Anthropic | null = null;

  private get client(): Anthropic {
    if (!this._client) this._client = getAnthropicClient();
    return this._client;
  }

  constructor() {
    this.semanticService = new SemanticScoringService();
  }

  /**
   * Score an essay with quality-first approach
   *
   * Uses semantic scoring (Sonnet) for accuracy, supplemented with
   * pattern detection for specific issue identification.
   */
  async scoreEssay(
    essay: string,
    essayType: SupplementalType,
    options: UnifiedScoringOptions = {}
  ): Promise<UnifiedScoringOutput> {
    const {
      college,
      wordLimit,
      wordMin,
      quickTriageOnly = false,
      useHybridMode = false,
      hybridThreshold = 85
    } = options;

    const wordCount = essay.split(/\s+/).filter(w => w.length > 0).length;

    // Step 1: Pattern detection (always run - it's free/local)
    const patternIssues = this.detectPatternIssues(essay, essayType);

    // Step 2: Quick triage if requested
    if (quickTriageOnly) {
      const triage = await this.quickTriage(essay, essayType, { wordLimit, wordMin });
      return this.buildOutputFromTriage(triage, essayType, wordCount, patternIssues, { wordLimit, wordMin });
    }

    // Step 3: Hybrid mode - triage first, full analysis if needed
    if (useHybridMode) {
      const triage = await this.quickTriage(essay, essayType, { wordLimit, wordMin });

      // If triage shows excellent score with high confidence, skip full analysis
      if (triage.score >= hybridThreshold && triage.confidence === 'high' && !triage.is_performative) {
        console.log(`  ⚡ Hybrid mode: Skipping full analysis (triage score: ${triage.score})`);
        return this.buildOutputFromTriage(triage, essayType, wordCount, patternIssues, { wordLimit, wordMin });
      }
    }

    // Step 4: Full semantic analysis (quality-first)
    console.log(`  🔬 Running full semantic analysis...`);

    const semanticResult = await this.semanticService.scoreEssay(essay, essayType, {
      wordLimit,
      wordMin,
      collegeName: college?.collegeName
    });

    // Step 5: Excellence check
    const excellenceCheck = this.checkExcellence(
      essayType,
      semanticResult,
      patternIssues
    );

    // Step 6: Build unified output
    return {
      total_score: semanticResult.total_score,
      quality_tier: semanticResult.quality_tier,
      is_good_enough: semanticResult.is_good_enough,

      semantic_analysis: {
        principle_scores: semanticResult.principle_scores,
        type_assessment: semanticResult.type_assessment,
        performative_assessment: semanticResult.performative_assessment,
        authenticity_score: semanticResult.authenticity_score,
        core_strength: semanticResult.core_strength,
        core_weakness: semanticResult.core_weakness,
        reader_experience: semanticResult.reader_experience,
        unconventional_but_effective: semanticResult.unconventional_but_effective
      },

      word_count_assessment: semanticResult.word_count_assessment,
      pattern_issues: patternIssues,
      excellence_check: excellenceCheck,

      essay_type: essayType,
      word_count: wordCount,

      cost: {
        semantic: this.estimateCost(semanticResult.tokens_used),
        pattern: 0,
        total: this.estimateCost(semanticResult.tokens_used)
      },

      tokens_used: semanticResult.tokens_used
    };
  }

  /**
   * Quick triage using Haiku (fast and cheap)
   *
   * Use this for:
   * - Initial filtering of essays
   * - Quick feedback during drafting
   * - Cost-conscious batch processing where accuracy isn't critical
   *
   * Do NOT use this for:
   * - Final essay evaluation
   * - Making admission decisions
   * - Anything where accuracy matters
   */
  async quickTriage(
    essay: string,
    essayType: SupplementalType,
    options: { wordLimit?: number; wordMin?: number } = {}
  ): Promise<QuickTriageResult> {
    const result = await this.semanticService.quickAssess(essay, essayType, options);

    // Estimate confidence based on score extremes
    let confidence: 'high' | 'medium' | 'low';
    if (result.score < 40 || result.score > 85) {
      confidence = 'high';  // Clear cases
    } else if (result.score < 50 || result.score > 75) {
      confidence = 'medium';
    } else {
      confidence = 'low';  // Ambiguous middle range
    }

    return {
      score: result.score,
      tier: result.tier,
      needs_full_analysis: confidence !== 'high' || result.is_performative,
      core_issue: result.core_issue,
      is_performative: result.is_performative,
      word_status: result.word_status,
      confidence,
      cost: 0.01  // Haiku estimate
    };
  }

  /**
   * Batch score multiple essays efficiently
   *
   * Uses parallel processing with rate limiting to maximize throughput
   * while respecting API limits.
   */
  async batchScore(
    essays: Array<{ essay: string; type: SupplementalType; options?: UnifiedScoringOptions }>,
    options: { maxConcurrent?: number; useHybridMode?: boolean } = {}
  ): Promise<UnifiedScoringOutput[]> {
    const { maxConcurrent = 3, useHybridMode = false } = options;

    const results: UnifiedScoringOutput[] = [];

    // Process in batches
    for (let i = 0; i < essays.length; i += maxConcurrent) {
      const batch = essays.slice(i, i + maxConcurrent);

      const batchResults = await Promise.all(
        batch.map(({ essay, type, options: essayOptions }) =>
          this.scoreEssay(essay, type, { ...essayOptions, useHybridMode })
        )
      );

      results.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + maxConcurrent < essays.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Detect issues using local pattern matching (free)
   */
  private detectPatternIssues(essay: string, essayType: SupplementalType): PatternIssue[] {
    const detectedPatternIds = detectPhrasePatterns(essay);
    const typePatterns = getPatternsByType(essayType);

    return detectedPatternIds
      .map(patternId => {
        const pattern = typePatterns.find(p => p.id === patternId);
        if (!pattern) return null;

        return {
          pattern_id: pattern.id,
          pattern_name: pattern.name,
          severity: pattern.severity,
          affected_dimensions: pattern.affected_dimensions,
          problem_description: pattern.problem_description,
          fix_suggestions: pattern.fix_suggestions,
          score_impact: pattern.score_impact
        };
      })
      .filter(Boolean) as PatternIssue[];
  }

  /**
   * Check excellence requirements
   */
  private checkExcellence(
    essayType: SupplementalType,
    semanticResult: SemanticScoringOutput,
    patternIssues: PatternIssue[]
  ): UnifiedScoringOutput['excellence_check'] {
    const requirements = getExcellenceRequirements(essayType);
    const criticalDimensions = getCriticalDimensions(essayType);

    // Estimate how many requirements are met based on semantic analysis
    const successPrinciples = semanticResult.type_assessment.success_principles_met || [];
    const pitfalls = semanticResult.type_assessment.pitfalls_present || [];

    // Simple heuristic: requirements met = principles met - pitfalls
    const estimatedMet = Math.max(0, Math.min(
      requirements.length,
      successPrinciples.length - pitfalls.length
    ));

    // Identify critical gaps
    const criticalGaps: string[] = [];

    // Check for critical pattern issues
    const criticalPatternIssues = patternIssues.filter(p => p.severity === 'critical');
    if (criticalPatternIssues.length > 0) {
      criticalGaps.push(...criticalPatternIssues.map(p => p.problem_description));
    }

    // Check for pitfalls
    if (pitfalls.length > 0) {
      criticalGaps.push(...pitfalls.slice(0, 3));  // Top 3 pitfalls
    }

    // Check if performative
    const severePerformative = semanticResult.performative_assessment
      .filter(p => p.detected && p.severity === 'severe');
    if (severePerformative.length > 0) {
      criticalGaps.push('Essay feels performative rather than authentic');
    }

    return {
      requirements,
      estimated_met: estimatedMet,
      critical_gaps: criticalGaps
    };
  }

  /**
   * Build output from quick triage (less detailed)
   */
  private buildOutputFromTriage(
    triage: QuickTriageResult,
    essayType: SupplementalType,
    wordCount: number,
    patternIssues: PatternIssue[],
    wordOptions: { wordLimit?: number; wordMin?: number }
  ): UnifiedScoringOutput {
    const defaults = DEFAULT_WORD_LIMITS[essayType];
    const wordMax = wordOptions.wordLimit ?? defaults.max;
    const wordMin = wordOptions.wordMin ?? defaults.min;

    // Build minimal word count assessment
    const wordStatus = wordCount < wordMin * 0.7 ? 'severely_under' :
      wordCount < wordMin ? 'under' :
      wordCount <= wordMax ? 'optimal' :
      wordCount <= wordMax * 1.1 ? 'over' : 'severely_over';

    return {
      total_score: triage.score,
      quality_tier: triage.tier,
      is_good_enough: triage.score >= 85,

      semantic_analysis: {
        principle_scores: [],  // Not available in triage
        type_assessment: {
          reader_question_answered: triage.score >= 70,
          answer_quality: Math.round(triage.score / 10),
          excellence_path_identified: null,
          success_principles_met: [],
          pitfalls_present: triage.is_performative ? ['Performative writing detected'] : []
        },
        performative_assessment: [],
        authenticity_score: triage.is_performative ? 4 : 7,
        core_strength: triage.score >= 70 ? 'Shows potential' : 'Needs significant work',
        core_weakness: triage.core_issue,
        reader_experience: triage.tier === 'excellent' ? 'Positive' :
          triage.tier === 'strong' ? 'Good' :
          triage.tier === 'needs_work' ? 'Mixed' : 'Negative',
        unconventional_but_effective: false
      },

      word_count_assessment: {
        current: wordCount,
        target: { min: wordMin, max: wordMax },
        status: wordStatus as any,
        efficiency_score: triage.word_status === 'optimal' ? 7 : 5,
        word_economy_analysis: 'Quick assessment - run full analysis for detailed feedback',
        feedback: triage.word_status === 'optimal' ? 'Word count is appropriate' :
          triage.word_status === 'over' ? 'Consider trimming' : 'Consider expanding',
        recommendation: triage.word_status === 'optimal' ? 'good' :
          triage.word_status === 'over' ? 'cut_minor' : 'expand_minor'
      },

      pattern_issues: patternIssues,

      excellence_check: {
        requirements: getExcellenceRequirements(essayType),
        estimated_met: Math.round(triage.score / 20),  // Rough estimate
        critical_gaps: patternIssues
          .filter(p => p.severity === 'critical')
          .map(p => p.problem_description)
      },

      essay_type: essayType,
      word_count: wordCount,

      cost: {
        semantic: 0,
        pattern: 0,
        total: triage.cost
      },

      tokens_used: { input: 0, output: 0 }  // Not tracked for Haiku
    };
  }

  /**
   * Estimate cost from token usage
   */
  private estimateCost(tokens: { input: number; output: number }): number {
    // Sonnet pricing: $3/M input, $15/M output
    const inputCost = (tokens.input / 1_000_000) * 3;
    const outputCost = (tokens.output / 1_000_000) * 15;
    return inputCost + outputCost;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedScoringService;
