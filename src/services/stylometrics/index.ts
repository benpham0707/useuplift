/**
 * Stylometric Analysis Module
 *
 * Statistical voice modeling for measuring writing authenticity and
 * voice consistency. All analysis is pure computation — zero API cost,
 * < 20ms execution time.
 *
 * Primary entry point: StylometricAnalyzer class
 *
 * Usage:
 *   import { stylometricAnalyzer } from '@/services/stylometrics';
 *
 *   // Full analysis
 *   const result = stylometricAnalyzer.analyze(essayText);
 *
 *   // Compare two texts
 *   const consistency = stylometricAnalyzer.compareTexts(essay1, essay2);
 *
 *   // Track voice evolution
 *   const evolution = stylometricAnalyzer.trackEvolution(original, revised);
 *
 *   // Portfolio consistency check
 *   const portfolio = stylometricAnalyzer.checkPortfolio([e1, e2, e3]);
 *
 *   // Map to rubric dimensions
 *   const rubric = stylometricAnalyzer.mapToRubric(result);
 */

// Core analyzer (primary export)
export { StylometricAnalyzer, stylometricAnalyzer } from './stylometricAnalyzer';

// Types (all interface/type exports)
export type {
  VoiceFingerprint,
  StylometricAnalysis,
  AIDetectionResult,
  SignalScore,
  VoiceConsistencyScore,
  VoiceInconsistency,
  VoiceEvolutionResult,
  RegisterAnalysis,
  RhythmAnalysis,
  IdiolectProfile,
  RubricMapping,
} from './types';

// Individual analyzers (for targeted use cases)
export { buildFingerprint } from './fingerprintBuilder';
export { detectAIWriting } from './aiDetector';
export { compareFingerprints, comparePortfolio, trackVoiceEvolution } from './voiceComparator';
export { analyzeRegister } from './registerAnalyzer';
export { analyzeRhythm } from './rhythmAnalyzer';
export { detectIdiolect } from './idiolectDetector';

// Utility functions (for advanced usage)
export {
  tokenize,
  splitSentences,
  splitParagraphs,
  countSyllables,
  mean,
  stdDev,
  variance,
  skewness,
  median,
  coefficientOfVariation,
  autocorrelation,
  shannonEntropy,
} from './textUtils';

// Constants (for extending or calibrating)
export { FUNCTION_WORDS, FUNCTION_WORD_SET } from './constants';
