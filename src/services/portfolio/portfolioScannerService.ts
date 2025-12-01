/**
 * Portfolio Scanner Service - Main Orchestrator
 *
 * This is the main entry point for the UC-focused holistic portfolio scanner.
 * It orchestrates the 4-stage, 9-LLM-call pipeline:
 *
 * Stage 1: Holistic Understanding (1 LLM call)
 * Stage 2: Dimension Deep Dive (6 parallel LLM calls)
 * Stage 3: Synthesis (1 LLM call)
 * Stage 4: Strategic Guidance (1 LLM call)
 *
 * Total: 9 LLM calls, with Stage 2 running in parallel for efficiency
 *
 * Calibrated to UC admissions reality with three evaluation modes:
 * - 'berkeley': UC Berkeley-specific weights and benchmarks
 * - 'ucla': UCLA-specific weights and benchmarks
 * - 'general_uc': General UC system
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PortfolioData,
  PortfolioAnalysisResult,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
  DimensionAnalyses,
  PortfolioSynthesis,
  StrategicGuidance,
  AnalysisOptions,
} from './types';

// Stage 1
import { analyzeHolisticPortfolio } from './stage1_holistic/holisticPortfolioAnalyzer';

// Stage 2
import {
  analyzeAcademicExcellence,
  analyzeLeadership,
  analyzeIntellectualCuriosity,
  analyzeCommunityImpact,
  analyzeAuthenticityVoice,
  analyzeFutureReadiness,
} from './stage2_dimensions';

// Stage 3
import { synthesizePortfolio } from './stage3_synthesis';

// Stage 4
import { generateStrategicGuidance } from './stage4_guidance';

/**
 * Main Portfolio Scanner Service
 *
 * @param portfolio - Complete student portfolio data
 * @param options - Analysis options including UC mode
 * @returns Complete portfolio analysis result
 */
export async function analyzePortfolio(
  portfolio: PortfolioData,
  options: AnalysisOptions = {
    depth: 'comprehensive',
    uc_mode: 'general_uc',
    include_synthesis: true,
    include_guidance: true,
  }
): Promise<PortfolioAnalysisResult> {
  const startTime = Date.now();
  const analysisId = uuidv4();

  const stageTimings = {
    stage1_holistic_ms: 0,
    stage2_dimensions_ms: 0,
    stage3_synthesis_ms: 0,
    stage4_guidance_ms: 0,
  };

  let llmCalls = 0;

  try {
    // =========================================================================
    // STAGE 1: Holistic Portfolio Understanding
    // =========================================================================
    const stage1Start = Date.now();

    const holistic = await analyzeHolisticPortfolio(portfolio, options.uc_mode);
    llmCalls += 1;

    stageTimings.stage1_holistic_ms = Date.now() - stage1Start;

    // =========================================================================
    // STAGE 2: Dimension Deep Dive (6 parallel LLM calls)
    // =========================================================================
    const stage2Start = Date.now();

    // Run all 6 dimension analyzers in parallel
    const [
      academicExcellence,
      leadershipInitiative,
      intellectualCuriosity,
      communityImpact,
      authenticityVoice,
      futureReadiness,
    ] = await Promise.all([
      analyzeAcademicExcellence(portfolio, holistic, options.uc_mode),
      analyzeLeadership(portfolio, holistic, options.uc_mode),
      analyzeIntellectualCuriosity(portfolio, holistic, options.uc_mode),
      analyzeCommunityImpact(portfolio, holistic, options.uc_mode),
      analyzeAuthenticityVoice(portfolio, holistic, options.uc_mode),
      analyzeFutureReadiness(portfolio, holistic, options.uc_mode),
    ]);
    llmCalls += 6;

    const dimensions: DimensionAnalyses = {
      academicExcellence,
      leadershipInitiative,
      intellectualCuriosity,
      communityImpact,
      authenticityVoice,
      futureReadiness,
      metadata: {
        duration_ms: Date.now() - stage2Start,
        llm_calls: 6,
      },
    };

    stageTimings.stage2_dimensions_ms = Date.now() - stage2Start;

    // =========================================================================
    // STAGE 3: Synthesis (if enabled)
    // =========================================================================
    let synthesis: PortfolioSynthesis;

    if (options.include_synthesis) {
      const stage3Start = Date.now();

      synthesis = await synthesizePortfolio(portfolio, holistic, dimensions, options.uc_mode);
      llmCalls += 1;

      stageTimings.stage3_synthesis_ms = Date.now() - stage3Start;
    } else {
      // Generate minimal synthesis without LLM
      synthesis = generateMinimalSynthesis(holistic, dimensions);
    }

    // =========================================================================
    // STAGE 4: Strategic Guidance (if enabled)
    // =========================================================================
    let guidance: StrategicGuidance;

    if (options.include_guidance) {
      const stage4Start = Date.now();

      guidance = await generateStrategicGuidance(
        portfolio,
        holistic,
        dimensions,
        synthesis,
        options.uc_mode
      );
      llmCalls += 1;

      stageTimings.stage4_guidance_ms = Date.now() - stage4Start;
    } else {
      // Generate minimal guidance without LLM
      guidance = generateMinimalGuidance();
    }

    // =========================================================================
    // COMPILE FINAL RESULT
    // =========================================================================
    const totalDuration = Date.now() - startTime;

    const result: PortfolioAnalysisResult = {
      analysis_id: analysisId,
      portfolio_id: portfolio.profile?.student_id || 'unknown',
      analysis_version: 'v1.0.0',
      created_at: new Date().toISOString(),
      uc_evaluation_mode: options.uc_mode,

      holistic,
      dimensions,
      synthesis,
      guidance,

      performance: {
        total_duration_ms: totalDuration,
        stage_durations: stageTimings,
        llm_calls: llmCalls,
        total_tokens: 0, // Would need to track from API responses
        cost_usd: estimateCost(llmCalls),
      },

      engine: 'sophisticated_multilayer_v1',
      confidence: calculateOverallConfidence(holistic, dimensions, synthesis),
    };

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Quick analysis mode - runs only essential stages
 */
export async function analyzePortfolioQuick(
  portfolio: PortfolioData,
  mode: UCEvaluationMode = 'general_uc'
): Promise<PortfolioAnalysisResult> {
  return analyzePortfolio(portfolio, {
    depth: 'quick',
    uc_mode: mode,
    include_synthesis: true,
    include_guidance: false,
  });
}

/**
 * Generate minimal synthesis without LLM call
 */
function generateMinimalSynthesis(
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses
): PortfolioSynthesis {
  const scores = [
    dimensions.academicExcellence?.score || 5,
    dimensions.leadershipInitiative?.score || 5,
    dimensions.intellectualCuriosity?.score || 5,
    dimensions.communityImpact?.score || 5,
    dimensions.authenticityVoice?.score || 5,
    dimensions.futureReadiness?.score || 5,
  ];

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    overallScore: Math.round(avgScore * 10) / 10,
    profileArchetype: 'Emerging',
    archetypeExplanation: 'Minimal synthesis - run full analysis for detailed archetype.',
    narrativeSummary: holistic.overallFirstImpression || 'Unable to generate narrative.',
    hiddenStrengths: [],
    dimensionalInteractions: {
      synergies: [],
      tensions: [],
      overallCoherence: 5.0,
    },
    comparativeBenchmarking: {
      vsTypicalUCApplicant: 'Run full analysis for comparison',
      vsTop10PercentUC: 'Run full analysis for comparison',
      competitiveAdvantages: [],
      competitiveWeaknesses: [],
      percentileEstimate: 'Top 50%',
    },
    ucCampusAlignment: {
      topTierUCs: {
        fitScore: 5.0,
        rationale: 'Run full analysis for campus fit',
        specificCampuses: [],
      },
      midTierUCs: {
        fitScore: 6.0,
        rationale: 'Run full analysis for campus fit',
        campuses: [],
      },
      allUCs: {
        likelyAdmits: [],
        possibleAdmits: [],
        reaches: [],
      },
    },
    admissionsOfficerPerspective: {
      first10Seconds: 'Run full analysis for AO perspective',
      memorability: 'Run full analysis for AO perspective',
      likelyReaction: 'neutral',
      ucSpecificAppeal: 'Run full analysis for UC-specific insights',
    },
    confidence: 0.3,
  };
}

/**
 * Generate minimal guidance without LLM call
 */
function generateMinimalGuidance(): StrategicGuidance {
  return {
    prioritizedRecommendations: [
      {
        priority: 1,
        dimension: 'General',
        recommendation: 'Run full analysis for detailed recommendations',
        rationale: 'Guidance requires complete analysis',
        timeline: 'N/A',
        estimatedImpact: 'N/A',
        difficultyLevel: 'moderate',
        specificSteps: ['Enable include_guidance option'],
        ucRelevance: 'Full analysis provides UC-specific guidance',
      },
    ],
    targetOutcomes: {
      shortTerm: {
        timeline: '3-6 months',
        goals: ['Run full analysis for goals'],
        expectedScoreChange: 'N/A',
      },
      mediumTerm: {
        timeline: '6-12 months',
        goals: ['Run full analysis for goals'],
        expectedScoreChange: 'N/A',
      },
      longTerm: {
        timeline: '1-2 years',
        goals: ['Run full analysis for goals'],
        expectedScoreChange: 'N/A',
      },
    },
    criticalWarnings: ['Run full analysis for warnings'],
    aspirationalTarget: 'Run full analysis for target',
  };
}

/**
 * Estimate cost based on LLM calls
 * Assumes Claude Sonnet 4.5 pricing
 */
function estimateCost(llmCalls: number): number {
  // Rough estimate: ~3000 input tokens + ~2000 output tokens per call
  // Sonnet 4.5: $3 per million input, $15 per million output
  const inputTokensPerCall = 3000;
  const outputTokensPerCall = 2000;

  const totalInput = llmCalls * inputTokensPerCall;
  const totalOutput = llmCalls * outputTokensPerCall;

  const inputCost = (totalInput / 1_000_000) * 3;
  const outputCost = (totalOutput / 1_000_000) * 15;

  return Math.round((inputCost + outputCost) * 100) / 100;
}

/**
 * Calculate overall confidence from all stages
 */
function calculateOverallConfidence(
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses,
  synthesis: PortfolioSynthesis
): number {
  const confidences = [
    holistic.confidence || 0.7,
    dimensions.academicExcellence?.confidence || 0.7,
    dimensions.leadershipInitiative?.confidence || 0.7,
    dimensions.intellectualCuriosity?.confidence || 0.7,
    dimensions.communityImpact?.confidence || 0.7,
    dimensions.authenticityVoice?.confidence || 0.7,
    dimensions.futureReadiness?.confidence || 0.7,
    synthesis.confidence || 0.7,
  ];

  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  return Math.round(avgConfidence * 100) / 100;
}

// Import for database analysis
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { fetchAndTransformPortfolioData } from './utils/supabaseFetcher';

/**
 * Analyze portfolio directly from Supabase database
 *
 * This is the most convenient function for production use.
 * It fetches ALL 150-200+ data fields from the database and runs the complete analysis.
 *
 * @param supabase - Supabase client instance
 * @param profileId - The profile ID to analyze
 * @param options - Analysis options (defaults to comprehensive general UC analysis)
 * @returns Complete portfolio analysis result
 *
 * @example
 * ```typescript
 * import { analyzePortfolioFromDatabase } from '@/services/portfolio';
 * import { supabaseAdmin } from '@/supabase/admin';
 *
 * const result = await analyzePortfolioFromDatabase(supabaseAdmin, profileId, {
 *   uc_mode: 'berkeley',
 *   depth: 'comprehensive',
 *   include_synthesis: true,
 *   include_guidance: true,
 * });
 * ```
 */
export async function analyzePortfolioFromDatabase(
  supabase: SupabaseClient<Database>,
  profileId: string,
  options: AnalysisOptions = {
    depth: 'comprehensive',
    uc_mode: 'general_uc',
    include_synthesis: true,
    include_guidance: true,
  }
): Promise<PortfolioAnalysisResult> {

  // Fetch and transform all portfolio data from database
  const portfolioData = await fetchAndTransformPortfolioData(supabase, profileId);

  // Run the complete analysis pipeline
  return analyzePortfolio(portfolioData, options);
}

// Export types for consumers
export type {
  PortfolioData,
  PortfolioAnalysisResult,
  UCEvaluationMode,
  AnalysisOptions,
  HolisticPortfolioUnderstanding,
  DimensionAnalyses,
  PortfolioSynthesis,
  StrategicGuidance,
};
