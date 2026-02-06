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
 * 1. Description Batch (Haiku) - All descriptions in ONE call
 * 2. Activity Batch (Haiku) - All activities in ONE call
 * 3. Portfolio Analysis (Haiku) - Holistic scoring, always fresh
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
 * console.log(`Harvard Rating: ${rubric.harvardScale.rating}`);
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
