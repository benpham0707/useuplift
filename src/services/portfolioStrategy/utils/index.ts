/**
 * Portfolio Strategy Utilities
 *
 * Central export for all PASS system utility functions.
 */

// Scoring utilities
export {
  normalizeToScale,
  sigmoidNormalize,
  calculatePercentile,
  calculateWeightedScore,
  calculateTier,
  getTierDescription,
  calculateConfidence,
  applyContextAdjustments,
  determineCompetitivePosition,
  aggregateScores,
  convertGPA,
  actToSAT,
  satToACT,
  generateInputHash,
  type WeightedScoreComponent,
  type WeightedScoreResult,
  type TierLabel,
  type TierThresholds,
  type ConfidenceFactors,
  type ContextAdjustment,
  type CompetitivePosition,
  DEFAULT_TIER_THRESHOLDS,
} from './scoring';

// Validation utilities
export {
  validateGPA,
  validateTestScores,
  validateCourses,
  validateActivity,
  validateActivities,
  validateAward,
  validateAwards,
  validateStudentProfile,
  validateAcademicInput,
  sanitizeString,
  sanitizeNumber,
  sanitizeGPA,
  clamp,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from './validation';

// Caching utilities
export {
  AnalysisCache,
  generateAnalysisCacheKey,
  generateHashedCacheKey,
  memoizeAsync,
  warmCache,
  invalidateRelatedCaches,
  createPersistentCache,
  academicEvaluationCache,
  activityAnalysisCache,
  awardEvaluationCache,
  holisticSynthesisCache,
  schoolFitCache,
  portfolioAnalysisCache,
  CacheUtils,
  type CacheEntry,
  type CacheStats,
  type CacheConfig,
  type CachePersistenceAdapter,
  type InvalidationStrategy,
} from './caching';
