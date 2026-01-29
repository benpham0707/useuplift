/**
 * PASS Rubrics Module
 *
 * Exports all rubric definitions and scoring functions for the PASS system.
 */

// Activity Tier Classification - Types
export type {
  TierCriteria,
  CategoryBenchmark,
  TierClassificationInput,
  TierClassificationResult,
  SpikeDetectionInput,
  SpikeDetectionResult,
} from './activityTierRubric';

// Activity Tier Classification - Values
export {
  TIER_CRITERIA,
  CATEGORY_BENCHMARKS,
  classifyActivityTier,
  detectSpike,
  activityTierRubric,
} from './activityTierRubric';

// Character Dimension Assessment - Types
export type {
  DimensionRubric,
  LevelCriteria,
} from './characterDimensionRubrics';

// Character Dimension Assessment - Values
export {
  DIMENSION_WEIGHTS,
  ALL_DIMENSION_RUBRICS,
  DIMENSION_RUBRICS,
  calculateWeightedCharacterScore,
  getDimensionRubric,
  getLevelCriteria,
  INTELLECTUAL_VITALITY_RUBRIC,
  LEADERSHIP_QUALITY_RUBRIC,
  COMMUNITY_IMPACT_RUBRIC,
  PERSONAL_GROWTH_RUBRIC,
  RESILIENCE_GRIT_RUBRIC,
  CREATIVITY_INNOVATION_RUBRIC,
  AUTHENTICITY_VOICE_RUBRIC,
  characterDimensionRubrics,
} from './characterDimensionRubrics';

// Harvard Scale Calibration - Types
export type {
  CalibrationProfile,
  ScoreAdjustment,
  ScoreValidation,
} from './harvardScaleCalibration';

// Harvard Scale Calibration - Values
export {
  CALIBRATION_PROFILES,
  SCORE_ADJUSTMENTS,
  getAdmitProbability,
  getCalibrationProfile,
  getScoreIndicators,
  applyScoreAdjustments,
  validateScore,
  harvardScaleCalibration,
} from './harvardScaleCalibration';
