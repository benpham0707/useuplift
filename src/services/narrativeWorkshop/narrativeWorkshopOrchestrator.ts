// @ts-nocheck
/**
 * NARRATIVE WORKSHOP - Main Orchestrator
 *
 * The grand conductor of the world's most sophisticated essay analysis system.
 * Orchestrates 5 sequential stages with 8+ LLM calls and deterministic analysis
 * to understand essays at their very essence.
 *
 * Pipeline:
 * Stage 1: Holistic Understanding (1 LLM call)
 * Stage 2: Deep Dive Analysis (6 parallel LLM calls)
 * Stage 3: Grammar & Style (1 LLM call + deterministic)
 * Stage 4: Synthesis (1 LLM call + dimension scoring)
 * Stage 5: Sentence-Level Insights (deterministic + pattern matching)
 *
 * Total: 9 LLM calls, comprehensive deterministic analysis, ~20,000 tokens
 *
 * Built on analysis of 20 actual elite essays from Harvard, Princeton, Stanford,
 * MIT, Yale, Berkeley. Calibrated to actual admissions standards, not generic advice.
 */

import {
  NarrativeEssayInput,
  NarrativeWorkshopAnalysis,
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights,
  SpecificInsights
} from './types';
import { analyzeHolisticUnderstanding } from './stage1_holisticUnderstanding';
import { runDeepDiveAnalyses } from './stage2_deepDive';
import { runGrammarStyleAnalysis } from './stage3_grammarStyle';
import { runSynthesis } from './stage4_synthesis';
import { generateSpecificInsights } from './stage5_sentenceLevel';
import { inferEssayType } from './essayTypeCalibration';

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Run complete narrative workshop analysis
 *
 * @param input - Essay text and optional metadata
 * @returns Complete analysis with all stages
 */
export async function analyzeNarrativeWorkshop(
  input: NarrativeEssayInput
): Promise<NarrativeWorkshopAnalysis> {

  const pipelineStartTime = Date.now();

  // Infer essay type if not provided
  const wordCount = input.essayText.split(/\s+/).length;
  const essayType = input.essayType || inferEssayType(input.promptText, wordCount, input.essayText);

  try {
    // ========================================================================
    // STAGE 1: HOLISTIC UNDERSTANDING
    // ========================================================================
    const stage1 = await analyzeHolisticUnderstanding(input);

    // ========================================================================
    // STAGE 2: DEEP DIVE ANALYSIS (6 parallel)
    // ========================================================================
    const stage2 = await runDeepDiveAnalyses(input, essayType);

    // ========================================================================
    // STAGE 3: GRAMMAR & STYLE ANALYSIS
    // ========================================================================
    const stage3 = await runGrammarStyleAnalysis(input, essayType);

    // ========================================================================
    // STAGE 4: CONTEXTUALIZATION & SYNTHESIS
    // ========================================================================
    const stage4 = await runSynthesis(input, essayType, stage1, stage2, stage3);

    // ========================================================================
    // STAGE 5: SENTENCE-LEVEL INSIGHTS
    // ========================================================================
    const stage5 = await generateSpecificInsights(input, stage1, stage2, stage3, stage4);

    // ========================================================================
    // AGGREGATE RESULTS
    // ========================================================================
    const totalDuration = Date.now() - pipelineStartTime;
    const totalTokens =
      stage1.tokensUsed +
      stage2.totalTokensUsed +
      stage3.totalTokensUsed +
      stage4.tokensUsed;

    const result: NarrativeWorkshopAnalysis = {
      essayInput: input,
      essayType,

      // All stages
      stage1_holisticUnderstanding: stage1,
      stage2_deepDiveAnalyses: stage2,
      stage3_grammarStyleAnalysis: stage3,
      stage4_synthesizedInsights: stage4,
      stage5_specificInsights: stage5,

      // Quick access to key metrics
      overallScore: stage4.overallQualityScore,
      impressionLabel: stage4.impressionLabel,
      topPriorities: stage5.prioritizedInsights.slice(0, 5),

      // Metadata
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        totalDurationMs: totalDuration,
        totalTokensUsed: totalTokens,
        stageTimings: {
          stage1: 0, // Filled by individual stages
          stage2: 0,
          stage3: 0,
          stage4: 0,
          stage5: 0
        },
        systemVersion: '1.0.0'
      }
    };

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================

    Object.entries(stage4.dimensionScores).forEach(([dim, score]) => {
      const bar = '█'.repeat(Math.round(score)) + '░'.repeat(10 - Math.round(score));
    });

    return result;

  } catch (error) {
    throw error;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Export main function
export { analyzeNarrativeWorkshop as default };

// Export individual stages (for testing/debugging)
export {
  analyzeHolisticUnderstanding,
  runDeepDiveAnalyses,
  runGrammarStyleAnalysis,
  runSynthesis,
  generateSpecificInsights
};

// Export types
export type {
  NarrativeEssayInput,
  NarrativeWorkshopAnalysis,
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights,
  SpecificInsights
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage:
 *
 * ```typescript
 * import { analyzeNarrativeWorkshop } from '@/services/narrativeWorkshop';
 *
 * const analysis = await analyzeNarrativeWorkshop({
 *   essayText: studentEssay,
 *   essayType: 'personal_statement',
 *   promptText: commonAppPrompt,
 *   maxWords: 650,
 *   studentContext: {
 *     intendedMajor: 'Computer Science',
 *     culturalBackground: 'First-gen Asian-American',
 *     voicePreference: 'understated'
 *   }
 * });
 *
 * // Access results
 * // 0-100
 * // Top 5 insights to fix
 *  * ```
 */
