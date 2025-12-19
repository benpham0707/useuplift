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
