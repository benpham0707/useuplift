/**
 * Stage 3: Grammar & Style Analysis - Main Orchestrator
 *
 * Combines two analysis approaches:
 * 1. Grammar Analysis (deterministic, fast, no LLM)
 * 2. Style Analysis (LLM-based, nuanced)
 *
 * Grammar runs first (instant), then style analysis.
 */

import { NarrativeEssayInput, GrammarStyleAnalysis } from '../types';
import { analyzeGrammar } from './grammarAnalyzer';
import { analyzeStyle } from './styleAnalyzer';

/**
 * Run grammar and style analysis
 */
export async function runGrammarStyleAnalysis(
  input: NarrativeEssayInput,
  essayType: string
): Promise<GrammarStyleAnalysis> {
  console.log('\n' + '='.repeat(80));
  console.log('STAGE 3: GRAMMAR & STYLE ANALYSIS');
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    // Run deterministic grammar analysis first (instant)
    const grammarAnalysis = analyzeGrammar(input.essayText);

    // Then run LLM-based style analysis
    const styleAnalysis = await analyzeStyle(input, essayType);

    const duration = Date.now() - startTime;

    const result: GrammarStyleAnalysis = {
      grammarAnalysis,
      styleAnalysis,
      totalTokensUsed: styleAnalysis.tokensUsed, // Only style uses LLM
      analysisCompletedAt: new Date().toISOString()
    };

    console.log('\n✅ Grammar & style analysis complete');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Grammar score: ${grammarAnalysis.overallGrammarScore}/10`);
    console.log(`   Style score: ${styleAnalysis.overallStyleScore}/10`);
    console.log(`   Total tokens: ${result.totalTokensUsed}`);
    console.log('\n' + '='.repeat(80) + '\n');

    return result;

  } catch (error) {
    console.error('❌ Grammar & style analysis failed:', error);
    throw error;
  }
}

// Export individual analyzers
export { analyzeGrammar } from './grammarAnalyzer';
export { analyzeStyle } from './styleAnalyzer';
