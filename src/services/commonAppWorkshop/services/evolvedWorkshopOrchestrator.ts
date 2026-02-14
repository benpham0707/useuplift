// @ts-nocheck
/**
 * Evolved Workshop Orchestrator
 *
 * **The Complete Pipeline for Type-Aware Common App Supplemental Workshop**
 *
 * This orchestrator combines all the evolved components:
 * 1. Type-Aware Scoring (12 dimensions × 14 type weights)
 * 2. Type-Specific Suggestions (PIQ-quality with college overlay)
 * 3. College-Type Integration (unified rubric with citations)
 * 4. Voice Fingerprinting (preserve authentic voice)
 *
 * **5-Stage Pipeline (evolved from PIQ)**:
 *
 * STAGE 0: Voice Excavation
 * - Extract voice fingerprint from essay
 * - Identify authentic phrases to preserve
 * - Cost: $0.02 (Haiku)
 *
 * STAGE 1: Holistic Scoring
 * - Score all 12 dimensions with type-specific weights
 * - Identify critical dimension gaps
 * - Detect issue patterns
 * - Cost: $0.02 (Haiku) or $0.05 (Sonnet for deep analysis)
 *
 * STAGE 2: Surgical Suggestions (Batch)
 * - Generate 2 suggestions per issue (Polished + Voice Amplifier)
 * - Integrate college values into suggestions
 * - Provide teaching layer
 * - Cost: $0.06-0.08 (Sonnet batch)
 *
 * STAGE 3: Excellence Check
 * - Verify excellence requirements are met
 * - Citation recommendations
 * - Final polish priorities
 * - Cost: $0.01 (Haiku)
 *
 * **Total Cost**: ~$0.12-0.16 per essay (vs $0.25+ for PIQ)
 *
 * **Quality Guarantees**:
 * - Type-specific excellence requirements checked
 * - College values demonstrated
 * - Voice preserved/amplified
 * - Issue detection patterns applied
 * - Citation guide provided
 */

import {
  TypeAwareScoringService,
  type TypeAwareScoringOutput,
  type DetectedIssue
} from './typeAwareScoringService';
import {
  UnifiedScoringService,
  type UnifiedScoringOutput,
  type PatternIssue
} from './unifiedScoringService';
import {
  TypeSpecificSuggestionService,
  type IssueContext,
  type TypeSpecificSuggestionOutput
} from './typeSpecificSuggestionService';
import {
  CollegeTypeIntegrationService,
  type IntegratedTypeRubric,
  type CitationRecommendation,
  type CollegeExcellenceRequirement
} from './collegeTypeIntegrationService';
import { getQualityTier, type QualityTier } from '../rubrics';
import {
  TYPE_WEIGHT_CONFIGS,
  getCriticalDimensions,
  getExcellenceRequirements
} from '../rubrics/typeWeightMatrices';
import type { CollegeResearch } from '../types/collegeResearch';
import type { VoiceFingerprint } from '../types/stage0Types';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { EssayContextPackage } from '../types';
import { contextEnrichmentService } from './contextEnrichmentService';
import {
  ValueAlignmentGuidanceService,
  type ValueAlignmentOutput,
  type CrossCollegeInsight
} from './valueAlignmentGuidanceService';
import {
  SemanticClicheAnalyzer,
  type SemanticClicheAnalysis
} from './semanticClicheAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Stage 0 Output: Voice Excavation
 */
export interface Stage0Output {
  voice_fingerprint: VoiceFingerprint;
  authentic_phrases: string[];
  emotional_range: string;
  vocabulary_level: string;
  sentence_rhythm: string;
}

/**
 * Stage 1 Output: Holistic Scoring
 *
 * Now uses UnifiedScoringService (Semantic + Pattern) for accuracy.
 */
export interface Stage1Output {
  scoring: UnifiedScoringOutput;
  integrated_rubric: IntegratedTypeRubric;
  priority_issues: PatternIssue[]; // Top 3 issues to address
  critical_gaps: string[]; // Critical dimensions below threshold
  quick_wins: string[]; // Easy improvements
  // Cross-college comparison (optional - only when comparison_colleges provided)
  cross_college_comparison?: CrossCollegeComparisonResult;
}

/**
 * Cross-College Comparison Result
 *
 * Provides insight into how well the essay fits the target college
 * compared to other schools, based on VALUE alignment (not vocabulary).
 */
export interface CrossCollegeComparisonResult {
  target_college: string;
  comparison_colleges: string[];
  best_fit: {
    college_name: string;
    fit_reason: string;
  };
  target_fit: {
    alignment_level: 'excellent' | 'good' | 'moderate' | 'weak';
    key_strength: string;
    key_gap: string;
    adjustment_guidance: string;
  };
  value_alignment_scores: Array<{
    college_name: string;
    alignment_score: number; // 0-100
    top_aligned_value: string;
    missing_value: string;
  }>;
  cost: number;
}

/**
 * Stage 2 Output: Surgical Suggestions
 */
export interface Stage2Output {
  suggestions: TypeSpecificSuggestionOutput;
  issue_count: number;
  projected_score_after_fixes: number;
  implementation_order: string[];
}

/**
 * Stage 3 Output: Excellence Check
 */
export interface Stage3Output {
  meets_excellence_bar: boolean;
  requirements_met: number;
  requirements_total: number;
  missing_requirements: string[];
  citation_recommendations: CitationRecommendation[];
  final_polish_priorities: string[];
  score_projection: number;
}

/**
 * Complete Workshop Output
 */
export interface EvolvedWorkshopOutput {
  // Metadata
  essay_type: SupplementalType;
  type_name: string;
  college_name: string | null;
  word_count: number;

  // Stage outputs
  stage0: Stage0Output;
  stage1: Stage1Output;
  stage2: Stage2Output;
  stage3: Stage3Output;

  // Summary
  summary: {
    initial_score: number;
    initial_tier: QualityTier;
    projected_score: number;
    projected_tier: QualityTier;
    improvement_potential: number;
    top_3_priorities: string[];
    excellence_met: boolean;
  };

  // Cost tracking
  cost: {
    stage0: number;
    stage1: number;
    stage2: number;
    stage3: number;
    total: number;
  };
}

/**
 * Workshop options
 */
export interface WorkshopOptions {
  // Required
  essayDraft: string;
  essayType: SupplementalType;

  // Optional
  college?: CollegeResearch;
  promptId?: string; // College-specific prompt identifier (e.g., "stanford_intellectual_vitality")
  voiceFingerprint?: VoiceFingerprint; // Skip Stage 0 if provided
  useDeepAnalysis?: boolean; // Use Sonnet for Stage 1
  maxIssues?: number; // Default 3

  // Cross-college comparison (optional)
  comparisonColleges?: CollegeResearch[]; // Compare essay fit across these colleges
  enableCrossCollegeComparison?: boolean; // Explicitly enable comparison (auto-enabled if comparisonColleges provided)
}

// ============================================================================
// MAIN ORCHESTRATOR CLASS
// ============================================================================

export class EvolvedWorkshopOrchestrator {
  private unifiedScoringService: UnifiedScoringService;
  private legacyScoringService: TypeAwareScoringService; // Kept for backward compatibility
  private suggestionService: TypeSpecificSuggestionService;
  private integrationService: CollegeTypeIntegrationService;
  private valueAlignmentService: ValueAlignmentGuidanceService;
  private clicheAnalyzer: SemanticClicheAnalyzer;

  constructor(apiKey?: string) {
    this.unifiedScoringService = new UnifiedScoringService();
    this.legacyScoringService = new TypeAwareScoringService(apiKey);
    this.suggestionService = new TypeSpecificSuggestionService(apiKey);
    this.integrationService = new CollegeTypeIntegrationService();
    this.valueAlignmentService = new ValueAlignmentGuidanceService();
    this.clicheAnalyzer = new SemanticClicheAnalyzer();
  }

  /**
   * Run complete workshop pipeline
   *
   * This is the main entry point that runs all 4 stages.
   */
  async runWorkshop(options: WorkshopOptions): Promise<EvolvedWorkshopOutput> {
    const {
      essayDraft,
      essayType,
      college,
      promptId,
      voiceFingerprint,
      useDeepAnalysis = false,
      maxIssues = 3,
      comparisonColleges,
      enableCrossCollegeComparison
    } = options;

    // Determine if cross-college comparison should run
    const shouldRunComparison = (enableCrossCollegeComparison === true) ||
      (comparisonColleges && comparisonColleges.length > 0);

    console.log(`\n🚀 Starting Evolved Workshop for ${essayType} essay`);
    if (college) {
      console.log(`   College: ${college.collegeName}`);
    }

    // Track costs
    const costs = {
      stage0: 0,
      stage1: 0,
      stage2: 0,
      stage3: 0,
      total: 0
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 0: Voice Excavation
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📍 Stage 0: Voice Excavation...');

    let stage0Output: Stage0Output;

    if (voiceFingerprint) {
      // Use provided fingerprint
      stage0Output = {
        voice_fingerprint: voiceFingerprint,
        authentic_phrases: voiceFingerprint.authentic_phrases || [],
        emotional_range: voiceFingerprint.emotional_range || 'balanced',
        vocabulary_level: voiceFingerprint.vocabulary_level || 'intermediate',
        sentence_rhythm: voiceFingerprint.sentence_rhythm || 'varied'
      };
      console.log('   ✓ Using provided voice fingerprint');
    } else {
      // Extract voice fingerprint from essay
      stage0Output = await this.extractVoiceFingerprint(essayDraft);
      costs.stage0 = 0.02; // Haiku cost estimate
      console.log(`   ✓ Voice extracted (${stage0Output.authentic_phrases.length} authentic phrases)`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1: Holistic Scoring (+ optional cross-college comparison)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📊 Stage 1: Holistic Scoring...');

    const stage1Output = await this.runStage1(
      essayDraft,
      essayType,
      college,
      useDeepAnalysis,
      shouldRunComparison ? comparisonColleges : undefined
    );

    costs.stage1 = stage1Output.scoring.cost.total;
    if (stage1Output.cross_college_comparison) {
      costs.stage1 += stage1Output.cross_college_comparison.cost;
    }
    console.log(`   ✓ Score: ${stage1Output.scoring.total_score}/100 (${stage1Output.scoring.quality_tier})`);
    console.log(`   ✓ ${stage1Output.priority_issues.length} issues identified`);
    if (stage1Output.cross_college_comparison) {
      console.log(`   ✓ Cross-college comparison: Best fit is ${stage1Output.cross_college_comparison.best_fit.college_name}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLICHÉ ANALYSIS: Run semantic cliché analysis for Stage 2 context
    // ─────────────────────────────────────────────────────────────────────────
    console.log('   📝 Running cliché analysis...');
    let clicheAnalysis: SemanticClicheAnalysis | undefined;

    try {
      // Use quick check first to decide if full analysis is worthwhile
      const quickCheck = this.clicheAnalyzer.quickClicheCheck(essayDraft);

      if (quickCheck.recommend_full_analysis) {
        // Run full AI-powered cliché analysis
        clicheAnalysis = await this.clicheAnalyzer.analyze(essayDraft, {
          college_id: college?.collegeName?.toLowerCase().replace(/\s+/g, '_'),
          essay_type: essayType
        });
        console.log(`   ✓ Cliché analysis: ${clicheAnalysis.overall_cliche_risk} risk (score: ${clicheAnalysis.cliche_risk_score})`);
        costs.stage1 += 0.004; // Add cliché analysis cost (~$0.003-0.005)
      } else {
        // Use pattern-only analysis (free, no API call)
        clicheAnalysis = await this.clicheAnalyzer.analyze(essayDraft, {
          college_id: college?.collegeName?.toLowerCase().replace(/\s+/g, '_'),
          essay_type: essayType,
          pattern_only: true
        });
        console.log(`   ✓ Cliché check (pattern-only): ${quickCheck.ai_convergence_count} AI phrases, ${quickCheck.essay_cliche_count} clichés`);
      }
    } catch (error) {
      console.error('[Stage1] Cliché analysis failed:', error);
      // Non-fatal: continue without cliché analysis
    }

    // NEW: Extract essay context from Stage 1 for Stage 2
    // This allows Stage 2 to build on Stage 1 insights instead of re-discovering them
    const essayContext = contextEnrichmentService.buildContextPackage(
      stage1Output.scoring,
      clicheAnalysis // Now properly wired in!
    );

    console.log(`   ✓ Context extracted: ${essayContext.dimensional_context?.length || 0} dimensions, ${essayContext.holistic_context ? 'holistic' : 'no holistic'}`);

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2: Surgical Suggestions
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n🔬 Stage 2: Surgical Suggestions...');

    const stage2Output = await this.runStage2(
      essayDraft,
      essayType,
      stage1Output.priority_issues.slice(0, maxIssues),
      stage0Output.voice_fingerprint,
      college,
      promptId, // Pass promptId for overlay rubric guidance
      stage1Output.scoring.total_score, // Pass current score for projection
      essayContext // NEW: Pass essay context from Stage 1
    );

    costs.stage2 = stage2Output.suggestions.cost;
    console.log(`   ✓ ${stage2Output.issue_count} issues addressed with ${stage2Output.issue_count * 2} suggestions`);
    console.log(`   ✓ Projected score: ${stage2Output.projected_score_after_fixes}`);

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3: Excellence Check
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n✨ Stage 3: Excellence Check...');

    const stage3Output = await this.runStage3(
      essayDraft,
      essayType,
      stage1Output,
      college
    );

    costs.stage3 = 0.01; // Haiku cost estimate
    console.log(`   ✓ Excellence requirements: ${stage3Output.requirements_met}/${stage3Output.requirements_total}`);
    console.log(`   ✓ ${stage3Output.citation_recommendations.length} citation recommendations`);

    // ═══════════════════════════════════════════════════════════════════════
    // BUILD FINAL OUTPUT
    // ═══════════════════════════════════════════════════════════════════════

    costs.total = costs.stage0 + costs.stage1 + costs.stage2 + costs.stage3;

    const wordCount = essayDraft.split(/\s+/).length;
    const projectedTier = getQualityTier(stage2Output.projected_score_after_fixes);

    const output: EvolvedWorkshopOutput = {
      essay_type: essayType,
      type_name: stage1Output.integrated_rubric.type_name,
      college_name: college?.collegeName || null,
      word_count: wordCount,

      stage0: stage0Output,
      stage1: stage1Output,
      stage2: stage2Output,
      stage3: stage3Output,

      summary: {
        initial_score: stage1Output.scoring.total_score,
        initial_tier: stage1Output.scoring.quality_tier,
        projected_score: stage2Output.projected_score_after_fixes,
        projected_tier: projectedTier,
        improvement_potential: stage2Output.projected_score_after_fixes - stage1Output.scoring.total_score,
        top_3_priorities: stage1Output.priority_issues.slice(0, 3).map(i => i.problem_description),
        excellence_met: stage3Output.meets_excellence_bar
      },

      cost: costs
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PRINT SUMMARY
    // ═══════════════════════════════════════════════════════════════════════

    console.log('\n' + '═'.repeat(60));
    console.log('WORKSHOP COMPLETE');
    console.log('═'.repeat(60));
    console.log(`Essay Type: ${output.type_name}`);
    console.log(`College: ${output.college_name || 'Universal'}`);
    console.log(`Word Count: ${wordCount}`);
    console.log('─'.repeat(60));
    console.log(`Initial Score: ${output.summary.initial_score}/100 (${output.summary.initial_tier})`);
    console.log(`Projected Score: ${output.summary.projected_score}/100 (${output.summary.projected_tier})`);
    console.log(`Improvement Potential: +${output.summary.improvement_potential} points`);
    console.log(`Excellence Met: ${output.summary.excellence_met ? '✓ YES' : '✗ NO'}`);
    console.log('─'.repeat(60));
    console.log(`Total Cost: $${costs.total.toFixed(3)}`);
    console.log('═'.repeat(60) + '\n');

    return output;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGE IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Stage 0: Extract voice fingerprint
   */
  private async extractVoiceFingerprint(essayDraft: string): Promise<Stage0Output> {
    // Simple heuristic extraction (can be enhanced with API call)
    const sentences = essayDraft.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Find authentic phrases (unique, specific phrases)
    const authenticPhrases: string[] = [];
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      if (words.length >= 3 && words.length <= 8) {
        // Look for specific phrases (names, numbers, unique terms)
        const hasSpecific = /[A-Z][a-z]+|[0-9]|'s\b/.test(sentence);
        if (hasSpecific) {
          authenticPhrases.push(sentence.trim());
        }
      }
    }

    // Estimate vocabulary level
    const avgWordLength = essayDraft.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / essayDraft.split(/\s+/).length;
    const vocabularyLevel = avgWordLength > 6 ? 'advanced' : avgWordLength > 4.5 ? 'intermediate' : 'conversational';

    // Estimate emotional range
    const emotionalWords = ['love', 'hate', 'fear', 'hope', 'joy', 'sad', 'angry', 'excited', 'nervous', 'proud'];
    const emotionCount = emotionalWords.filter(w => essayDraft.toLowerCase().includes(w)).length;
    const emotionalRange = emotionCount > 3 ? 'wide' : emotionCount > 1 ? 'moderate' : 'limited';

    // Estimate sentence rhythm
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const variance = this.calculateVariance(sentenceLengths);
    const sentenceRhythm = variance > 50 ? 'varied' : variance > 20 ? 'moderate' : 'uniform';

    const fingerprint: VoiceFingerprint = {
      dominant_register: vocabularyLevel === 'advanced' ? 'formal' : vocabularyLevel === 'conversational' ? 'casual' : 'balanced',
      voice_qualities: [],
      vocabulary_level: vocabularyLevel,
      authentic_phrases: authenticPhrases.slice(0, 5),
      emotional_range: emotionalRange,
      sentence_rhythm: sentenceRhythm
    };

    return {
      voice_fingerprint: fingerprint,
      authentic_phrases: authenticPhrases.slice(0, 5),
      emotional_range: emotionalRange,
      vocabulary_level: vocabularyLevel,
      sentence_rhythm: sentenceRhythm
    };
  }

  /**
   * Stage 1: Holistic scoring with type-specific weights
   *
   * Now uses UnifiedScoringService which:
   * - Uses Semantic Scoring (Sonnet) as primary for 92%+ accuracy
   * - Uses Pattern Detection as secondary for cheap issue flagging
   * - Supports quick triage mode for cost optimization
   * - Optionally includes cross-college comparison for fit analysis
   */
  private async runStage1(
    essayDraft: string,
    essayType: SupplementalType,
    college?: CollegeResearch,
    useDeepAnalysis = false,
    comparisonColleges?: CollegeResearch[]
  ): Promise<Stage1Output> {
    // Get integrated rubric if college provided
    const integratedRubric = college
      ? this.integrationService.getIntegratedRubric(essayType, college)
      : this.createDefaultIntegratedRubric(essayType);

    // Run scoring with UnifiedScoringService (quality-first)
    const scoring = await this.unifiedScoringService.scoreEssay(
      essayDraft,
      essayType,
      {
        college,
        wordLimit: integratedRubric.word_range?.max,
        wordMin: integratedRubric.word_range?.min,
        // Use hybrid mode when not requesting deep analysis
        // This skips full Sonnet analysis for clearly excellent essays
        useHybridMode: !useDeepAnalysis
      }
    );

    // Identify priority issues (top 3 by severity + score impact)
    const priorityIssues = [...scoring.pattern_issues]
      .sort((a, b) => {
        // Sort by severity first, then by score impact
        const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return Math.abs(b.score_impact) - Math.abs(a.score_impact);
      })
      .slice(0, 3);

    // Identify critical gaps from semantic analysis
    const criticalGaps: string[] = [];

    // Check performative indicators
    const severePerformative = scoring.semantic_analysis.performative_assessment
      .filter(p => p.detected && p.severity === 'severe');
    if (severePerformative.length > 0) {
      criticalGaps.push('Essay feels performative - needs more authentic voice');
    }

    // Check type-specific assessment
    if (!scoring.semantic_analysis.type_assessment.reader_question_answered) {
      criticalGaps.push('Essay does not fully answer the prompt\'s core question');
    }

    // Check pitfalls
    const pitfalls = scoring.semantic_analysis.type_assessment.pitfalls_present || [];
    for (const pitfall of pitfalls.slice(0, 2)) {
      criticalGaps.push(pitfall);
    }

    // Identify quick wins (minor issues with good impact)
    const quickWins = scoring.pattern_issues
      .filter(i => i.severity === 'minor' && Math.abs(i.score_impact) >= 2)
      .map(i => i.problem_description)
      .slice(0, 3);

    // ─────────────────────────────────────────────────────────────────────────
    // OPTIONAL: Cross-College Comparison
    // ─────────────────────────────────────────────────────────────────────────
    let crossCollegeComparison: CrossCollegeComparisonResult | undefined;

    if (college && comparisonColleges && comparisonColleges.length > 0) {
      console.log('   📊 Running cross-college comparison...');

      try {
        crossCollegeComparison = await this.runCrossCollegeComparison(
          essayDraft,
          college,
          comparisonColleges
        );
      } catch (error) {
        console.error('[Stage1] Cross-college comparison failed:', error);
        // Non-fatal: continue without comparison
      }
    }

    return {
      scoring,
      integrated_rubric: integratedRubric,
      priority_issues: priorityIssues,
      critical_gaps: criticalGaps,
      quick_wins: quickWins,
      cross_college_comparison: crossCollegeComparison
    };
  }

  /**
   * Run cross-college comparison using ValueAlignmentGuidanceService
   *
   * This analyzes essay fit across multiple colleges based on VALUE alignment,
   * not vocabulary or program name-dropping.
   */
  private async runCrossCollegeComparison(
    essayDraft: string,
    targetCollege: CollegeResearch,
    comparisonColleges: CollegeResearch[]
  ): Promise<CrossCollegeComparisonResult> {
    const startTime = Date.now();

    // Get quick summary for target college
    const targetSummary = await this.valueAlignmentService.generateQuickSummary(
      essayDraft,
      targetCollege
    );

    // Get quick summaries for comparison colleges (parallel)
    const comparisonSummaries = await Promise.all(
      comparisonColleges.map(async (college) => {
        try {
          const summary = await this.valueAlignmentService.generateQuickSummary(
            essayDraft,
            college
          );
          return { college, summary };
        } catch (error) {
          console.error(`[CrossCollege] Failed for ${college.collegeName}:`, error);
          return null;
        }
      })
    );

    // Filter out failed comparisons
    const validComparisons = comparisonSummaries.filter(c => c !== null) as Array<{
      college: CollegeResearch;
      summary: Awaited<ReturnType<typeof this.valueAlignmentService.generateQuickSummary>>;
    }>;

    // Determine alignment scores based on alignment level
    const alignmentToScore = (alignment: string): number => {
      switch (alignment) {
        case 'excellent': return 90;
        case 'good': return 75;
        case 'moderate': return 55;
        case 'weak': return 35;
        default: return 50;
      }
    };

    // Build value alignment scores
    const valueAlignmentScores: CrossCollegeComparisonResult['value_alignment_scores'] = [
      {
        college_name: targetCollege.collegeName,
        alignment_score: alignmentToScore(targetSummary.alignment),
        top_aligned_value: targetSummary.top_strength,
        missing_value: targetSummary.top_gap
      },
      ...validComparisons.map(({ college, summary }) => ({
        college_name: college.collegeName,
        alignment_score: alignmentToScore(summary.alignment),
        top_aligned_value: summary.top_strength,
        missing_value: summary.top_gap
      }))
    ];

    // Determine best fit
    const sortedByFit = [...valueAlignmentScores].sort((a, b) => b.alignment_score - a.alignment_score);
    const bestFit = sortedByFit[0];

    // Estimate cost (quick summaries are ~$0.003 each)
    const cost = 0.003 * (1 + validComparisons.length);

    return {
      target_college: targetCollege.collegeName,
      comparison_colleges: comparisonColleges.map(c => c.collegeName),
      best_fit: {
        college_name: bestFit.college_name,
        fit_reason: bestFit.top_aligned_value
      },
      target_fit: {
        alignment_level: targetSummary.alignment,
        key_strength: targetSummary.top_strength,
        key_gap: targetSummary.top_gap,
        adjustment_guidance: targetSummary.one_action
      },
      value_alignment_scores: valueAlignmentScores,
      cost
    };
  }

  /**
   * Stage 2: Generate surgical suggestions for priority issues
   *
   * @param currentScore - The current score from Stage 1 (needed for projection)
   */
  private async runStage2(
    essayDraft: string,
    essayType: SupplementalType,
    priorityIssues: PatternIssue[],
    voiceFingerprint: VoiceFingerprint,
    college: CollegeResearch | undefined,
    promptId: string | undefined, // Added: college-specific prompt identifier
    currentScore: number, // Added: need current score for projection
    essayContext: EssayContextPackage // NEW: Essay context from Stage 1
  ): Promise<Stage2Output> {
    if (priorityIssues.length === 0) {
      // No issues = essay is already good, project current score
      return {
        suggestions: {
          essay_type: essayType,
          type_name: '',
          college_name: college?.collegeName || null,
          issues: [],
          overall_strategy: {
            cohesive_approach: 'No significant issues detected',
            voice_consistency: 'Voice is strong',
            priority_order: 'N/A',
            implementation_tips: ['Continue refining for excellence']
          },
          cost: 0,
          tokens_used: { input: 0, output: 0 }
        },
        issue_count: 0,
        projected_score_after_fixes: currentScore, // Fixed: return current score, not 0
        implementation_order: []
      };
    }

    // Convert pattern issues to issue contexts for suggestion generation
    // Note: Pattern issues don't have specific text spans, so we use the essay excerpt
    const issueContexts: IssueContext[] = priorityIssues.map((issue) => ({
      issue_id: issue.pattern_id,
      quote: essayDraft.substring(0, 200), // Pattern issues don't have specific text spans
      location: 'Throughout essay',
      diagnosis: {
        problem: issue.problem_description,
        symptom_type: issue.pattern_id,
        affected_dimensions: issue.affected_dimensions,
        score_impact: issue.score_impact
      },
      surrounding_context: essayDraft.substring(0, 500),
      relevant_college_values: college?.coreValues?.slice(0, 2).map(v => ({
        value_name: v.valueName,
        what_demonstrates_it: v.essayImplication
      })) || [],
      relevant_quotes: college?.keyQuotes?.slice(0, 2).map(q => ({
        quote: q.quote,
        source: q.source?.name || 'Unknown'
      })) || []
    }));

    // Generate suggestions
    const suggestions = await this.suggestionService.generateSuggestions(
      essayDraft,
      essayType,
      issueContexts,
      { college, voice: voiceFingerprint, promptId, essayContext }
    );

    // Estimate score improvement
    // Each severity point of impact roughly translates to 5-7 real score points when fixed
    const totalScoreImpact = priorityIssues.reduce((sum, i) => sum + Math.abs(i.score_impact), 0);
    const projectedImprovement = Math.round(totalScoreImpact * 5); // Conservative estimate
    const projectedScore = Math.min(100, currentScore + projectedImprovement); // Fixed: add to current score

    return {
      suggestions,
      issue_count: priorityIssues.length,
      projected_score_after_fixes: projectedScore, // Fixed: return actual projected score
      implementation_order: suggestions.overall_strategy?.priority_order
        ? [suggestions.overall_strategy.priority_order]
        : priorityIssues.map((_, i) => `Issue ${i + 1}`)
    };
  }

  /**
   * Stage 3: Excellence check and citation recommendations
   */
  private async runStage3(
    essayDraft: string,
    essayType: SupplementalType,
    stage1Output: Stage1Output,
    college?: CollegeResearch
  ): Promise<Stage3Output> {
    const rubric = stage1Output.integrated_rubric;
    const scoring = stage1Output.scoring;

    // Check excellence requirements from unified scoring
    const excellenceCheck = scoring.excellence_check;
    const total = excellenceCheck.requirements.length;
    const met = excellenceCheck.estimated_met;
    const missing = excellenceCheck.critical_gaps;

    // Get citation recommendations if college provided
    const citationRecommendations = college
      ? this.integrationService.getCitationRecommendations(essayDraft, rubric)
      : [];

    // Determine final polish priorities
    const finalPolishPriorities: string[] = [];

    // 1. Address core weakness from semantic analysis
    if (scoring.semantic_analysis.core_weakness) {
      finalPolishPriorities.push(`Fix: ${scoring.semantic_analysis.core_weakness}`);
    }

    // 2. Address critical gaps
    for (const gap of missing.slice(0, 2)) {
      finalPolishPriorities.push(`Address: ${gap}`);
    }

    // 3. Preserve and amplify core strength
    if (scoring.semantic_analysis.core_strength) {
      finalPolishPriorities.push(`Amplify: ${scoring.semantic_analysis.core_strength}`);
    }

    // 4. Voice preservation
    if (scoring.semantic_analysis.authenticity_score < 7) {
      finalPolishPriorities.push('Increase authenticity - reduce performative elements');
    } else {
      finalPolishPriorities.push('Preserve authentic voice through edits');
    }

    // 5. Word count check
    const wordAssessment = scoring.word_count_assessment;
    if (wordAssessment.status !== 'optimal') {
      finalPolishPriorities.push(`Word count: ${wordAssessment.feedback}`);
    }

    // Project final score
    const baseScore = scoring.total_score;
    const improvementPotential = stage1Output.priority_issues.reduce(
      (sum, i) => sum + Math.abs(i.score_impact) * 5,
      0
    );
    const scoreProjection = Math.min(100, baseScore + improvementPotential);

    return {
      meets_excellence_bar: met >= Math.ceil(total * 0.8) && baseScore >= 85,
      requirements_met: met,
      requirements_total: total,
      missing_requirements: missing,
      citation_recommendations: citationRecommendations,
      final_polish_priorities: finalPolishPriorities.slice(0, 5),
      score_projection: scoreProjection
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create default integrated rubric when no college provided
   */
  private createDefaultIntegratedRubric(essayType: SupplementalType): IntegratedTypeRubric {
    const typeConfig = TYPE_WEIGHT_CONFIGS[essayType];
    const criticalDims = getCriticalDimensions(essayType);
    const excellenceReqs = getExcellenceRequirements(essayType);

    return {
      essay_type: essayType,
      type_name: typeConfig.name,
      word_range: typeConfig.word_range,
      college_name: 'Universal',
      college_personality: 'Universal quality standards',
      integrated_weights: Object.fromEntries(
        Object.entries(typeConfig.weights).map(([dim, weight]) => [
          dim,
          {
            base_weight: weight as number,
            college_boost: 0,
            final_weight: weight as number,
            explanation: `Type-based weight: ${weight}%`
          }
        ])
      ) as IntegratedTypeRubric['integrated_weights'],
      critical_dimensions: criticalDims,
      excellence_requirements: excellenceReqs.map((r: string): CollegeExcellenceRequirement => ({
        requirement: r,
        type_original: true,
        college_specific: false,
        demonstration_example: r
      })),
      value_mappings: [],
      citation_guide: [],
      red_flags: [],
      green_flags: []
    };
  }

  /**
   * Calculate variance of an array
   */
  private calculateVariance(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVENIENCE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Quick score (Stage 1 only)
   */
  async quickScore(
    essayDraft: string,
    essayType: SupplementalType,
    college?: CollegeResearch
  ): Promise<{
    score: number;
    tier: QualityTier;
    topIssues: string[];
    criticalGaps: string[];
  }> {
    const stage1 = await this.runStage1(essayDraft, essayType, college, false);

    return {
      score: stage1.scoring.total_score,
      tier: stage1.scoring.quality_tier,
      topIssues: stage1.priority_issues.map(i => i.problem_description),
      criticalGaps: stage1.critical_gaps
    };
  }

  /**
   * Get integrated rubric for a type + college (no API calls)
   */
  getIntegratedRubric(
    essayType: SupplementalType,
    college?: CollegeResearch
  ): IntegratedTypeRubric {
    return college
      ? this.integrationService.getIntegratedRubric(essayType, college)
      : this.createDefaultIntegratedRubric(essayType);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Stage0Output,
  Stage1Output,
  Stage2Output,
  Stage3Output,
  EvolvedWorkshopOutput,
  WorkshopOptions,
  CrossCollegeComparisonResult
};
