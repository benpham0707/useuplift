/**
 * Activity Scoring Module
 *
 * Comprehensive 1-10 scoring system for extracurricular activities with:
 * - Description Score: How well the activity is written/presented
 * - Activity Score: How good the activity is objectively
 * - Portfolio Score: Overall extracurriculars section assessment
 * - Teaching Layer: Deep transformation guidance with research-backed rewrites
 * - Intelligent Caching: Avoid re-scoring unchanged activities
 *
 * API CALL ARCHITECTURE (BATCH-BASED):
 * The pipeline makes 3-4 total API calls regardless of activity count:
 *
 * // R6: Fix model documentation — scoring uses Sonnet, not Haiku
 * 1. Description Batch (Sonnet) - All descriptions in ONE call
 * 2. Activity Batch (Sonnet) - All activities in ONE call
 * 3. Portfolio Analysis (Sonnet) - Holistic scoring, always fresh
 * 4. Teaching Layer (Sonnet) - Optional, always fresh
 *
 * Caching Strategy (QUALITY PRESERVED):
 * - Individual scores are cached per-activity
 * - Cache REDUCES BATCH SIZE (not API call count)
 * - If 9/10 activities unchanged: batch scores 1 instead of 10
 * - Portfolio-level analysis ALWAYS runs fresh (holistic quality)
 * - Teaching layer ALWAYS runs fresh (depends on portfolio)
 *
 * Usage:
 * ```typescript
 * import {
 *   scoringOrchestrator,
 * } from '@services/portfolioStrategy/services/activityWorkshop/scoring';
 *
 * // First scoring request - creates a session
 * const result1 = await scoringOrchestrator.scorePortfolio({
 *   activities: [...activities],
 *   studentContext: { intendedMajor: "Computer Science" },
 * });
 *
 * // Get the session ID for subsequent requests
 * const sessionId = result1.cacheInfo?.sessionId;
 *
 * // User tweaks one activity's description...
 * activities[2].description = "Updated description...";
 *
 * // Second request - only re-scores the changed activity
 * const result2 = await scoringOrchestrator.scorePortfolio({
 *   activities: [...activities],
 *   studentContext: { intendedMajor: "Computer Science" },
 *   cacheOptions: {
 *     sessionId,  // Reuse session for caching
 *   },
 * });
 *
 * // Check what was cached vs fresh
 * console.log(`Activities from cache: ${result2.cacheInfo?.summary.descriptionsCached}`);
 * console.log(`Activities re-scored: ${result2.cacheInfo?.summary.descriptionsFresh}`);
 * console.log(`Est. cost saved: $${result2.cacheInfo?.savings.estimatedCostSaved}`);
 *
 * // Force fresh analysis if needed (ignores cache)
 * const freshResult = await scoringOrchestrator.scorePortfolio({
 *   activities: [...activities],
 *   cacheOptions: { forceFresh: true },
 * });
 *
 * // Access scoring rubric
 * const { rubric, teaching, cacheInfo } = result1;
 * console.log(`Overall Score: ${rubric.overallScore.total}/10`);
 * console.log(`Competitive Tier: ${rubric.harvardScale.description}`);
 *
 * // Access teaching transformations
 * if (teaching) {
 *   for (const transform of teaching.activityTransformations) {
 *     console.log(`${transform.activityName}:`);
 *     console.log(`  Before: ${transform.rewrite.original}`);
 *     console.log(`  After:  ${transform.rewrite.suggested}`);
 *   }
 * }
 * ```
 *
 * Cost Estimates (10 activities):
 * - First run: ~$0.05-0.08 (scoring only) or ~$0.10-0.14 (with teaching)
 * - Subsequent runs with 1 changed activity: ~$0.03-0.05 (smaller batches)
 * - Savings come from smaller batch sizes = fewer tokens = lower cost
 */

// Types
export * from './types';

// Services
export {
  DescriptionScoringService,
  descriptionScoringService,
  type DescriptionScoringInput,
  type DescriptionScoringResult,
  type BatchDescriptionScoringInput,
  type BatchDescriptionScoringResult,
} from './descriptionScoringService';

export {
  ActivityScoringService,
  activityScoringService,
  type ActivityScoringInput,
  type ActivityScoringResult,
  type BatchActivityScoringInput,
  type BatchActivityScoringResult,
} from './activityScoringService';

export {
  PortfolioScoringService,
  portfolioScoringService,
  type ActivityWithScores,
  type PortfolioScoringInput,
  type PortfolioScoringResult,
} from './portfolioScoringService';

// Orchestrator - runs all scoring in sequence
export {
  ScoringOrchestrator,
  scoringOrchestrator,
  type ScoringOrchestratorInput,
  type ScoringOrchestratorResult,
} from './scoringOrchestrator';

// Teaching Layer - deep guidance and transformations (uses Sonnet)
export * from './teachingLayerTypes';

export {
  ActivityTeachingLayerService,
  activityTeachingLayerService,
} from './activityTeachingLayerService';

// Comparison Benchmarks Library - pre-researched activity benchmarks
export {
  matchActivityToCategory,
  getBenchmarksForActivity,
  formatBenchmarksForPrompt,
  formatBatchBenchmarksForPrompt,
  type BenchmarkEntry,
  type CategoryBenchmarks,
} from './comparisonBenchmarksLibrary';

// Caching - intelligent caching for repeated scoring requests
export * from './scoringCacheTypes';

export {
  ScoringCacheService,
  scoringCacheService,
} from './scoringCacheService';

// Profile Integration - bridges ActivityProfile with GUIDANCE (not scoring)
// IMPORTANT: Profiles enhance teaching/guidance, NOT scores
// Scores remain from admissions officer perspective (what they see on application)
export {
  ProfileIntegrationService,
  profileIntegrationService,
  type DescriptionGapAnalysis,
  type MissingElement,
  type TeachingProfileContext,
  type ProfileEnhancedTeachingInput,
} from './profileIntegrationService';

// Feature Extraction — Layer 1 of cognitive decomposition
// Haiku-powered extraction of structured features (no judgment, no scoring)
export * from './featureTypes';

export {
  FeatureExtractorService,
  featureExtractorService,
} from './featureExtractor';

// Tier Classifier — Layer 2 deterministic tier classification
// Pure code, no LLM — maps ExtractedEvidence to TierClassification
export {
  TierClassifierService,
  tierClassifierService,
  classifyTier,
  clampToTierRange,
  clampComponentScore,
  getInternalTierName,
  getTierScoreRange,
  getTierComponentConstraints,
  toExternalTier,
} from './tierClassifier';

// Scoring Rules — Layer 3 constants (verb hierarchy, weights, lookup tables)
export * from './scoringRules';

// Description Rule Scorer — Layer 3a deterministic description scoring
// Pure code, no LLM — maps ExtractedDescriptionFeatures to DescriptionScore
export {
  DescriptionRuleScorerService,
  descriptionRuleScorerService,
} from './descriptionRuleScorer';

// Activity Rule Scorer — Layer 3b deterministic activity scoring
// Pure code, no LLM — maps ExtractedEvidence + TierClassification to ActivityScore
export {
  ActivityRuleScorerService,
  activityRuleScorerService,
} from './activityRuleScorer';

// Nuance Calibration Types — Layer 4 type definitions
export * from './nuanceCalibrationTypes';

// Achievement Intelligence Database — Layer 4 deep calibration benchmarks
// 500+ entries across 18 categories with subcategories, achievement ladders, role hierarchies
export {
  ACHIEVEMENT_DATABASE,
  getCategoryKeywordIndex,
  getSubcategoryKeywordIndex,
  getAchievementCategory,
  getAchievementCategoryKeys,
  getEntriesForTier,
  getSubcategoryProfile,
  getTotalEntryCount,
} from './achievementIntelligence';

// Achievement Retrieval — Layer 4 smart matching & calibration context assembly
// Pure code, no LLM — assembles CalibrationContext from evidence + tier + activity metadata
export {
  AchievementRetrievalService,
  achievementRetrievalService,
  getCalibrationContext,
} from './achievementRetrieval';

// Nuance Calibration Service — Layer 4 Sonnet-powered score adjustment
// Hybrid: rule scorer bounds + Sonnet nuance within those bounds
export {
  NuanceCalibrationService,
  nuanceCalibrationService,
  calibrateActivity,
  calibrateBatch,
} from './nuanceCalibrationService';
