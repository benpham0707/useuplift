/**
 * Writing Engine Types
 *
 * Type definitions for the computational writing enrichment pipeline.
 * Pre-analysis → Prompt Enrichment → Post-LLM Calibration
 *
 * All pre-analysis is pure computation (<30ms, zero LLM calls).
 */

import type { RegisterAnalysis } from '../stylometrics/types';
import type { AIDetectionResult } from '../stylometrics/types';
import type { ConstraintCheckResult, RevisionPriorityReport } from '../../core/analysis/scoring/scoringScience/types';

// ============================================================================
// PRE-ANALYSIS RESULT
// ============================================================================

/**
 * Register profile from the register analyzer.
 */
export interface RegisterProfile {
  primaryRegister: RegisterAnalysis['primaryRegister'];
  formalityScore: number;
  internalConsistency: number;
  registerShifts: Array<{
    sentenceIndex: number;
    from: string;
    to: string;
    severity: 'subtle' | 'noticeable' | 'jarring';
  }>;
}

/**
 * Compression statistics from the information-theoretic analyzer.
 */
export interface CompressionStats {
  overallRatio: number;
  uniquenessScore: number;
}

/**
 * AI detection flags from the statistical AI detector.
 */
export interface AIDetectionFlags {
  aiProbability: number;
  confidence: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  dominantSignals: string[];
  signalSummary: {
    burstiness: number;
    sentenceLengthVariance: number;
    vocabularyUniformity: number;
    functionWordAnomaly: number;
    repetitionRegularity: number;
  };
}

/**
 * Basic text statistics from textUtils.
 */
export interface TextStats {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  vocabularyRichness: number;
}

/**
 * Complete pre-analysis result from WritingPreAnalyzer.
 * Pure computation, no LLM calls, <30ms.
 */
export interface PreAnalysisResult {
  register: RegisterProfile;
  compression: CompressionStats;
  aiDetection: AIDetectionFlags;
  textStats: TextStats;
  /** Total computation time in milliseconds */
  computeTimeMs: number;
}

// ============================================================================
// ENRICHMENT BLOCK
// ============================================================================

/**
 * Formatted prompt injection block for workshop LLM calls.
 * Token-budgeted and workshop-specific.
 */
export interface EnrichmentBlock {
  /** The formatted text to inject into the prompt */
  content: string;
  /** Estimated token count of the content */
  estimatedTokens: number;
  /** Which workshop this was formatted for */
  workshopType: 'common_app' | 'piq' | 'activity_description' | 'activity_scoring';
}

// ============================================================================
// CALIBRATION RESULT
// ============================================================================

/**
 * Post-LLM calibration result combining constraint satisfaction
 * and revision priority analysis.
 */
export interface CalibrationResult {
  /** Constraint satisfaction check results */
  constraintCheck: ConstraintCheckResult;
  /** Revision priority ranking */
  revisionPriorities: RevisionPriorityReport;
  /** Whether any adjustments were made */
  hasAdjustments: boolean;
  /** Adjusted scores (only populated if constraints were violated) */
  adjustedScores?: Record<string, number>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Feature flag and configuration for the writing engine.
 */
export interface WritingEngineConfig {
  /** Master feature flag — if false, all enrichment is disabled */
  enabled: boolean;
  /** Maximum tokens for enrichment blocks per workshop type */
  tokenBudgets: {
    common_app: number;
    piq: number;
    activity_description: number;
    activity_scoring: number;
  };
}

/**
 * Default configuration values.
 */
export const DEFAULT_WRITING_ENGINE_CONFIG: WritingEngineConfig = {
  enabled: true,
  tokenBudgets: {
    common_app: 120,
    piq: 110,
    activity_description: 70,
    activity_scoring: 85,
  },
};
