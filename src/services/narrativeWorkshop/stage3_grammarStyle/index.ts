// @ts-nocheck
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

    return result;

  } catch (error) {
    throw error;
  }
}

// Export individual analyzers
export { analyzeGrammar } from './grammarAnalyzer';
export { analyzeStyle } from './styleAnalyzer';
