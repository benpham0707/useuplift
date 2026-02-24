/**
 * Scoring Science Module
 *
 * A psychometric calibration system for rubric-based essay evaluation.
 * Applies Item Response Theory, Bayesian updating, constraint satisfaction,
 * reliability analysis, and distribution normalization to produce
 * calibrated, uncertainty-aware scores.
 *
 * QUICK START:
 *
 *   import { runScoringPipeline, DEFAULT_EXPERIENCE_CONFIG } from './scoringScience';
 *
 *   const rawScores = { voice_integrity: 6.5, specificity_evidence: 4.0, ... };
 *   const result = runScoringPipeline(rawScores, DEFAULT_EXPERIENCE_CONFIG);
 *
 *   console.log(result.quality_index);       // 62.3 (calibrated QI)
 *   console.log(result.quality_index_ci);     // [55.1, 69.5] (95% CI)
 *   console.log(result.reliability.assessment); // 'moderate'
 *
 * MODULE ARCHITECTURE:
 *
 *   types.ts                    — All type definitions
 *   irtCalibration.ts          — Item Response Theory (theta estimation)
 *   bayesianUpdating.ts        — Prior computation & posterior updating
 *   reliabilityAnalysis.ts     — Cronbach's alpha, SEM, multi-rater
 *   constraintSatisfaction.ts  — Logical coherence enforcement
 *   distributionNormalization.ts — Z-score, percentile, stanine conversion
 *   diminishingReturns.ts      — Marginal utility & revision priorities
 *   weightOptimization.ts      — Gradient descent weight tuning + PCA
 *   scoringSciencePipeline.ts  — Unified orchestrator
 */

// ── Types ──────────────────────────────────────────────────────────
export type {
  CalibratedScore,
  CalibrationType,
  DimensionPsychometrics,
  IRTParameters,
  IRTAbilityEstimate,
  InformationProfile,
  ScorePrior,
  ScorePosterior,
  PreScreenResult,
  InternalConsistency,
  SplitHalfReliability,
  SEMAnalysis,
  MultiRaterResult,
  DimensionConstraint,
  ConstraintCheckResult,
  WeightOptimizationResult,
  NormalizationResult,
  NormalizationReport,
  MarginalImprovementAnalysis,
  RevisionPriorityReport,
  ScoringCalibratedResult,
} from './types';

// ── IRT Calibration ────────────────────────────────────────────────
export {
  calibrateWithIRT,
  estimateTheta,
  computeInformationProfile,
  EXPERIENCE_IRT_PARAMS,
  ESSAY_IRT_PARAMS,
} from './irtCalibration';

// ── Bayesian Updating ──────────────────────────────────────────────
export {
  computePriors,
  updateWithObservation,
  updateAllDimensions,
  preScreen,
} from './bayesianUpdating';
export type { ComputationalSignals } from './bayesianUpdating';

// ── Reliability Analysis ───────────────────────────────────────────
export {
  computeInternalConsistency,
  computeSplitHalfReliability,
  computeSEM,
  computeMultiRaterAgreement,
} from './reliabilityAnalysis';

// ── Constraint Satisfaction ────────────────────────────────────────
export {
  checkConstraints,
  summarizeViolations,
  EXPERIENCE_CONSTRAINTS,
  ESSAY_CONSTRAINTS,
} from './constraintSatisfaction';

// ── Distribution Normalization ─────────────────────────────────────
export {
  normalizeScores,
  applyNormalization,
  EXPECTED_DISTRIBUTIONS,
} from './distributionNormalization';

// ── Diminishing Returns ────────────────────────────────────────────
export {
  analyzeDimension,
  generateRevisionPriorities,
} from './diminishingReturns';

// ── Weight Optimization ────────────────────────────────────────────
export {
  computeCorrelationMatrix,
  simplifiedPCA,
  optimizeWeights,
} from './weightOptimization';

// ── Pipeline ───────────────────────────────────────────────────────
export {
  runScoringPipeline,
  quickCalibrate,
  summarizeCalibration,
  DEFAULT_EXPERIENCE_CONFIG,
  DEFAULT_ESSAY_CONFIG,
} from './scoringSciencePipeline';
export type { ScoringPipelineConfig } from './scoringSciencePipeline';
