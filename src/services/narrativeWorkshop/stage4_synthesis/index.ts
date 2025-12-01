/**
 * Stage 4: Contextualization & Synthesis - Main Orchestrator
 *
 * The strategic brain that aggregates all previous analyses into:
 * 1. 12 dimension scores (essay-type-weighted)
 * 2. Holistic assessment and insights
 * 3. Improvement roadmap (quick wins → transformative moves)
 * 4. Admissions officer perspective
 * 5. Comparative context
 *
 * This is where everything comes together into actionable guidance.
 */

import {
  NarrativeEssayInput,
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights
} from '../types';
import { calculateDimensionScores } from './dimensionScorer';
import { synthesizeInsights } from './synthesisEngine';

/**
 * Run synthesis and generate holistic assessment
 */
export async function runSynthesis(
  input: NarrativeEssayInput,
  essayType: string,
  stage1: HolisticUnderstanding,
  stage2: DeepDiveAnalyses,
  stage3: GrammarStyleAnalysis
): Promise<SynthesizedInsights> {

  const startTime = Date.now();

  try {
    // Step 1: Calculate dimension scores (deterministic)
    const dimensionScores = calculateDimensionScores(stage1, stage2, stage3, essayType);

    // Step 2: Generate holistic synthesis (LLM)
    const synthesis = await synthesizeInsights(
      input,
      essayType,
      stage1,
      stage2,
      stage3,
      dimensionScores
    );

    const duration = Date.now() - startTime;

    return synthesis;

  } catch (error) {
    throw error;
  }
}

// Export individual components
export { calculateDimensionScores } from './dimensionScorer';
export { synthesizeInsights } from './synthesisEngine';
