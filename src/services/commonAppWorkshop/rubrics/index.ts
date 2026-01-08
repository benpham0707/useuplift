/**
 * Universal Supplemental Essay Rubric System
 *
 * Export all rubric components:
 * - Universal dimensions (12 dimensions that apply to all types)
 * - Type weight matrices (14 type-specific weight configurations)
 * - Issue detection patterns (40+ patterns for targeted feedback)
 */

// Universal Dimensions
export {
  DIMENSION_DEFINITIONS,
  QUALITY_TIER_DEFINITIONS,
  getDimensionDefinition,
  getAllDimensions,
  getQualityTier,
  getQualityTierDefinition,
  isRedFlagPhrase,
  getScoreBandDescription
} from './universalSupplementalRubric';

export type {
  SupplementalDimension,
  DimensionScore,
  QualityTier,
  DimensionDefinition,
  QualityTierDefinition
} from './universalSupplementalRubric';

// Type Weight Matrices
export {
  TYPE_WEIGHT_CONFIGS,
  getTypeWeightConfig,
  getDimensionWeight,
  getCriticalDimensions,
  getNotApplicableDimensions,
  getExcellenceRequirements,
  calculateWeightedScore,
  validateWeights,
  getTopDimensions
} from './typeWeightMatrices';

export type {
  DimensionWeightMatrix,
  TypeWeightConfig
} from './typeWeightMatrices';

// Issue Detection
export {
  ALL_ISSUE_PATTERNS,
  getAllIssuePatterns,
  getPatternsByType,
  getPatternsBySeverity,
  getPatternById,
  detectPhrasePatterns,
  getFixSuggestions,
  calculateIssueImpact
} from './issueDetectionPatterns';

export type {
  IssueSeverity,
  IssuePattern,
  DetectedIssue
} from './issueDetectionPatterns';

// College Tailoring Rubric (Phase 2)
export {
  TAILORING_DIMENSION_DEFINITIONS,
  STANFORD_TAILORING_WEIGHTS,
  MIT_TAILORING_WEIGHTS,
  HARVARD_TAILORING_WEIGHTS,
  STANFORD_ELITE_MARKERS,
  MIT_ELITE_MARKERS,
  HARVARD_ELITE_MARKERS,
  getCollegeTailoringWeights,
  getEliteCraftMarkers,
  calculateTailoringScore,
  getTailoringTier,
  generateTailoringImprovements
} from './collegeTailoringRubric';

export type {
  TailoringDimension,
  TailoringDimensionScore,
  TailoringAssessment,
  TailoringDimensionDefinition,
  CollegeTailoringWeights,
  EliteCraftMarker
} from './collegeTailoringRubric';

// Anti-Bias Calibration (Prevents self-fulfilling scoring)
export {
  DIMENSION_BIAS_RISKS,
  ANTI_BIAS_ADJUSTMENTS,
  CALIBRATION_EXAMPLES,
  antiBiasFramework,
  checkNameDropping,
  checkNaturalFlow,
  checkBaselineQuality,
  checkScoreCalibration,
  validateAgainstCalibration,
} from './antiBiasCalibration';

export type {
  DimensionBiasRisk,
  AntiGamingGuardrail,
  GuardrailResult,
  CalibrationExample,
  ScoreAdjustment,
} from './antiBiasCalibration';
