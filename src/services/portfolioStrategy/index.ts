/**
 * Portfolio & Application Strategy System (PASS)
 *
 * Comprehensive college application portfolio analysis and strategy system.
 * This is the main entry point for the entire PASS system.
 *
 * SYSTEM ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                    PORTFOLIO STRATEGY ORCHESTRATOR                  │
 * │                        (Main Entry Point)                           │
 * └───────────────────────────┬─────────────────────────────────────────┘
 *                             │
 *         ┌───────────────────┼───────────────────┐
 *         │                   │                   │
 *         ▼                   ▼                   ▼
 * ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
 * │   Academic    │   │   Activity    │   │    Award      │
 * │   Evaluator   │   │   Analyzer    │   │   Evaluator   │
 * └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
 *         │                   │                   │
 *         └───────────────────┼───────────────────┘
 *                             │
 *                             ▼
 *                  ┌─────────────────────┐
 *                  │     Holistic        │
 *                  │    Synthesizer      │
 *                  └──────────┬──────────┘
 *                             │
 *                             ▼
 *                  ┌─────────────────────┐
 *                  │   School Fit &      │
 *                  │  Strategy Engine    │
 *                  └──────────┬──────────┘
 *                             │
 *                             ▼
 *                  ┌─────────────────────┐
 *                  │   Guidance &        │
 *                  │   Action Engine     │
 *                  └─────────────────────┘
 *
 * QUALITY PRINCIPLES:
 * - Depth over breadth: Every assessment includes context and justification
 * - Context-aware: Adjustments for school resources, background, circumstances
 * - Actionable: All analysis leads to specific, prioritized recommendations
 * - Transparent: Scoring methodology is explicit and explainable
 *
 * USAGE:
 * ```typescript
 * import { portfolioOrchestrator, StudentProfileInput } from './portfolioStrategy';
 *
 * const profile: StudentProfileInput = {
 *   userId: 'user_123',
 *   academic: { gpa: {...}, courses: [...], testScores: {...} },
 *   activities: { activities: [...] },
 *   awards: { awards: [...] },
 *   personalContext: { firstGeneration: false, ... },
 *   goals: { targetSchoolTier: 'highly_selective', ... },
 * };
 *
 * const analysis = await portfolioOrchestrator.analyze(profile);
 * ```
 */

// ============================================================================
// MAIN ORCHESTRATOR (Primary Entry Point)
// ============================================================================

export {
  PortfolioStrategyOrchestrator,
  portfolioOrchestrator,
} from './engines';

// ============================================================================
// INDIVIDUAL ENGINES (For direct access when needed)
// ============================================================================

export {
  // Academic evaluation
  AcademicEvaluator,
  academicEvaluator,

  // Activity analysis
  ActivityAnalyzer,
  activityAnalyzer,

  // Award evaluation
  AwardEvaluator,
  awardEvaluator,

  // Holistic synthesis
  HolisticSynthesizer,
  holisticSynthesizer,

  // School fit analysis
  SchoolFitEngine,
  schoolFitEngine,

  // Guidance generation
  GuidanceEngine,
  guidanceEngine,
} from './engines';

// ============================================================================
// ALL TYPES
// ============================================================================

export * from './types';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  // Scoring utilities
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

  // Validation utilities
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

  // Caching utilities
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
} from './utils';

// ============================================================================
// DATA ACCESS (For reference data queries)
// ============================================================================

export {
  COLLEGE_PROFILES,
  getCollegeProfile,
  getAllCollegeProfiles,
  getCollegesWithEDAdvantage,
  getCollegesbySelectivity,
} from './data';

// ============================================================================
// QUICK ACCESS HELPERS
// ============================================================================

/**
 * Convenience function for quick analysis
 * Uses default configuration for standard analysis
 */
export async function analyzePortfolio(
  profile: import('./types').StudentProfileInput,
  options?: Partial<import('./types').AnalysisRequestConfig>
): Promise<import('./types').PortfolioStrategyAnalysis> {
  const { portfolioOrchestrator } = await import('./engines');
  return portfolioOrchestrator.analyze(profile, options);
}

/**
 * Get quick profile summary without full analysis
 * Useful for dashboards and progress indicators
 */
export async function getQuickProfileSummary(
  profile: import('./types').StudentProfileInput
): Promise<{
  academicTier: string;
  activitiesTier: string;
  awardsTier: string;
  estimatedProfileTier: string;
  confidence: number;
}> {
  const { portfolioOrchestrator } = await import('./engines');
  return portfolioOrchestrator.getQuickSummary(profile);
}

/**
 * Analyze academic profile only
 */
export async function analyzeAcademic(
  academic: import('./types').AcademicInputData,
  targetSchools?: string[]
): Promise<import('./types').AcademicEvaluation> {
  const { portfolioOrchestrator } = await import('./engines');
  return portfolioOrchestrator.analyzeAcademicOnly(academic, targetSchools);
}

/**
 * Analyze activities only
 */
export async function analyzeActivities(
  activities: import('./types').ActivitiesInputData
): Promise<import('./types').ActivityPortfolioAnalysis> {
  const { portfolioOrchestrator } = await import('./engines');
  return portfolioOrchestrator.analyzeActivitiesOnly(activities);
}

/**
 * Analyze awards only
 */
export async function analyzeAwards(
  awards: import('./types').AwardsInputData
): Promise<import('./types').AwardEvaluation> {
  const { portfolioOrchestrator } = await import('./engines');
  return portfolioOrchestrator.analyzeAwardsOnly(awards);
}
