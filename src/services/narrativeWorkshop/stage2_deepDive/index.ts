/**
 * Stage 2: Deep Dive Analysis - Main Orchestrator
 *
 * Runs 6 parallel focused analyses on different essay sections:
 * 1. Opening Analysis
 * 2. Body Development Analysis
 * 3. Climax/Turning Point Analysis
 * 4. Conclusion/Reflection Analysis
 * 5. Character Development Analysis
 * 6. Stakes/Tension Analysis
 *
 * All 6 run in PARALLEL for maximum performance.
 */

import { NarrativeEssayInput, DeepDiveAnalyses } from '../types';
import { analyzeOpening } from './openingAnalyzer';
import { analyzeBodyDevelopment } from './bodyDevelopmentAnalyzer';
import { analyzeClimaxTurningPoint } from './climaxTurningPointAnalyzer';
import { analyzeConclusionReflection } from './conclusionReflectionAnalyzer';
import { analyzeCharacterDevelopment } from './characterDevelopmentAnalyzer';
import { analyzeStakesTension } from './stakesTensionAnalyzer';

/**
 * Run all 6 deep dive analyses in parallel
 */
export async function runDeepDiveAnalyses(
  input: NarrativeEssayInput,
  essayType: string
): Promise<DeepDiveAnalyses> {
  console.log('\n' + '='.repeat(80));
  console.log('STAGE 2: DEEP DIVE ANALYSIS (6 Parallel Analyzers)');
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    // Run all 6 analyzers in parallel
    const [
      opening,
      bodyDevelopment,
      climaxTurningPoint,
      conclusionReflection,
      characterDevelopment,
      stakesTension
    ] = await Promise.all([
      analyzeOpening(input, essayType),
      analyzeBodyDevelopment(input, essayType),
      analyzeClimaxTurningPoint(input, essayType),
      analyzeConclusionReflection(input, essayType),
      analyzeCharacterDevelopment(input, essayType),
      analyzeStakesTension(input, essayType),
    ]);

    const totalTokensUsed =
      opening.tokensUsed +
      bodyDevelopment.tokensUsed +
      climaxTurningPoint.tokensUsed +
      conclusionReflection.tokensUsed +
      characterDevelopment.tokensUsed +
      stakesTension.tokensUsed;

    const duration = Date.now() - startTime;

    const result: DeepDiveAnalyses = {
      opening,
      bodyDevelopment,
      climaxTurningPoint,
      conclusionReflection,
      characterDevelopment,
      stakesTension,
      totalTokensUsed,
      analysesCompletedAt: new Date().toISOString()
    };

    console.log('\n✅ Deep dive analyses complete');
    console.log(`   Duration: ${duration}ms (parallel execution)`);
    console.log(`   Total tokens: ${totalTokensUsed}`);
    console.log('\n' + '='.repeat(80) + '\n');

    return result;

  } catch (error) {
    console.error('❌ Deep dive analyses failed:', error);
    throw error;
  }
}

// Export all analyzers
export { analyzeOpening } from './openingAnalyzer';
export { analyzeBodyDevelopment } from './bodyDevelopmentAnalyzer';
export { analyzeClimaxTurningPoint } from './climaxTurningPointAnalyzer';
export { analyzeConclusionReflection } from './conclusionReflectionAnalyzer';
export { analyzeCharacterDevelopment } from './characterDevelopmentAnalyzer';
export { analyzeStakesTension } from './stakesTensionAnalyzer';
