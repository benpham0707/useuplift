/**
 * Writing Engine — Public API
 *
 * Computational writing enrichment pipeline:
 *   PreAnalyze → Enrich Prompt → Post-LLM Calibrate
 *
 * All pre-analysis is pure computation (<30ms, zero LLM calls).
 * Feature flag: ENABLE_COMPUTATIONAL_ENRICHMENT (default: true)
 */

// Types
export type {
  PreAnalysisResult,
  EnrichmentBlock,
  CalibrationResult,
  WritingEngineConfig,
  RegisterProfile,
  CompressionStats,
  AIDetectionFlags,
  TextStats,
} from './types';
export { DEFAULT_WRITING_ENGINE_CONFIG } from './types';

// Pre-analyzer
export { WritingPreAnalyzer, writingPreAnalyzer } from './writingPreAnalyzer';

// Prompt enrichment formatters
export {
  formatForCommonApp,
  formatForPIQ,
  formatForActivityDescription,
  formatForActivityScoring,
  isWithinBudget,
} from './promptEnrichmentFormatter';

// Post-LLM calibrator
export { PostLLMCalibrator, postLLMCalibrator } from './postLLMCalibrator';
