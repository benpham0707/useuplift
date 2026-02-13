// @ts-nocheck
/**
 * Scoring Orchestrator
 *
 * Orchestrates the complete scoring pipeline with intelligent caching.
 *
 * API CALL STRUCTURE (BATCH-BASED):
 * 1. Description batch (Sonnet) - All descriptions in ONE call
 * 2. Activity batch (Sonnet) - All activities in ONE call  [PARALLEL with step 1]
 * 3. Portfolio scoring (Sonnet) - Holistic analysis, always fresh
 * 4. Teaching layer (Sonnet) - Optional, always fresh
 *
 * Total: 3-4 API calls regardless of activity count.
 *
 * CACHING STRATEGY (REDUCES BATCH SIZE):
 * - Individual scores are cached per-activity
 * - Cache hits are EXCLUDED from the batch call
 * - If 9/10 activities unchanged, batch only scores 1 activity
 * - Portfolio analysis ALWAYS runs fresh (holistic quality)
 * - Teaching layer ALWAYS runs fresh (depends on portfolio)
 *
 * Returns a complete PortfolioScoreRubric with:
 * - Individual activity scores with rationales
 * - Combined activity scores (70% activity + 30% description)
 * - Overall portfolio score (1-10)
 * - Harvard 1-6 scale equivalent
 * - Detailed breakdowns and recommendations
 * - Cache usage information (what was cached vs fresh)
 *
 * Optionally includes deep teaching content:
 * - Concrete description rewrites
 * - Transformation principles
 * - Research-backed citations
 * - Strategic portfolio guidance
 *
 * COST (10 activities):
 * - First run: ~$0.05-0.08 (scoring) or ~$0.10-0.14 (with teaching)
 * - With caching (1 change): ~$0.03-0.05 (smaller batches = fewer tokens)
 */

import {
  descriptionScoringService,
  DescriptionScoringInput,
  DescriptionScore,
} from './descriptionScoringService';

import {
  activityScoringService,
  ActivityScoringInput,
  ActivityScore,
} from './activityScoringService';

import {
  portfolioScoringService,
  ActivityWithScores,
  PortfolioScoringInput,
} from './portfolioScoringService';

import {
  PortfolioScoreRubric,
  ActivityScoreRubric,
} from './types';

import {
  activityTeachingLayerService,
} from './activityTeachingLayerService';

import {
  TeachingLayerOutput,
  TeachingLayerInput,
} from './teachingLayerTypes';

import {
  scoringCacheService,
  ScoringCacheService,
} from './scoringCacheService';

import {
  CacheUsageInfo,
  PortfolioChangeDetection,
} from './scoringCacheTypes';

import { ActivityWorkshopInput, ActivityWorkshopSessionInput } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ScoringOrchestratorInput {
  /** Activities to score */
  activities: ActivityWorkshopInput[];
  /** Target application platform — affects character limits for description scoring */
  targetPlatform?: import('../types').ApplicationPlatform;
  /** Student context for portfolio scoring */
  studentContext?: {
    intendedMajor?: string;
    schoolType?: string;
    gradeLevel?: number;
    contextualFactors?: string[];
    targetSchools?: string[];
    applicationTimeline?: string;
  };
  /** Teaching layer options */
  teachingOptions?: {
    /** Whether to include teaching layer (default: false) */
    includeTeaching?: boolean;
    /** Maximum activities to generate transformations for (default: 3) */
    maxTransformations?: number;
    /** Include alternative rewrites (default: true) */
    includeAlternatives?: boolean;
    /** Include craft teaching sections (default: true) */
    includeCraftTeaching?: boolean;
    /** Focus on specific activities by ID */
    focusActivities?: string[];
  };
  /** Caching options for optimizing repeated scoring */
  cacheOptions?: {
    /**
     * Session ID to use for caching.
     * If not provided, a new session is created.
     * Reuse the session ID across multiple scoring requests to benefit from caching.
     */
    sessionId?: string;
    /**
     * Whether to use caching (default: true)
     * When enabled, unchanged activities use cached scores.
     */
    enableCache?: boolean;
    /**
     * Force fresh analysis, ignoring all cached scores (default: false)
     * Use this when you want to re-score everything from scratch.
     */
    forceFresh?: boolean;
  };
}

export interface ScoringOrchestratorResult {
  success: boolean;
  rubric?: PortfolioScoreRubric;
  /** Deep teaching content (if requested) */
  teaching?: TeachingLayerOutput;
  error?: string;
  /** Individual scores by activity ID for quick lookup */
  scoresByActivityId?: Map<string, ActivityScoreRubric>;
  /** Timing metrics */
  timing?: {
    descriptionScoringMs: number;
    activityScoringMs: number;
    portfolioScoringMs: number;
    teachingMs: number;
    totalMs: number;
  };
  /** Token usage */
  tokensUsed?: {
    descriptionScoring: { input: number; output: number };
    activityScoring: { input: number; output: number };
    portfolioScoring: { input: number; output: number };
    teaching: { input: number; output: number };
    total: { input: number; output: number };
  };
  /**
   * Cache usage information
   * Shows which scores were cached vs freshly computed
   */
  cacheInfo?: CacheUsageInfo;
  /**
   * Change detection results
   * Shows what changed since the last scoring run in this session
   */
  changeDetection?: PortfolioChangeDetection;
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export class ScoringOrchestrator {
  private cacheService: ScoringCacheService;

  constructor(cacheService?: ScoringCacheService) {
    this.cacheService = cacheService || scoringCacheService;
  }

  /**
   * Run the complete scoring pipeline with intelligent caching
   *
   * Caching behavior:
   * - Individual description/activity scores are cached per-activity
   * - Unchanged activities use cached scores (no API call)
   * - Changed activities get fresh scores
   * - Portfolio analysis ALWAYS runs fresh (holistic quality)
   * - Teaching layer ALWAYS runs fresh
   */
  async scorePortfolio(input: ScoringOrchestratorInput): Promise<ScoringOrchestratorResult> {
    const startTime = Date.now();
    console.log(`[ScoringOrchestrator] Starting scoring for ${input.activities.length} activities`);

    if (input.activities.length === 0) {
      return {
        success: false,
        error: 'No activities to score',
      };
    }

    // Resolve caching options
    const enableCache = input.cacheOptions?.enableCache !== false; // Default: true
    const forceFresh = input.cacheOptions?.forceFresh === true;    // Default: false
    const sessionId = enableCache && !forceFresh
      ? this.cacheService.getOrCreateSession(input.cacheOptions?.sessionId).sessionId
      : input.cacheOptions?.sessionId || 'no-cache';

    console.log(`[ScoringOrchestrator] Cache: enabled=${enableCache}, forceFresh=${forceFresh}, sessionId=${sessionId}`);

    const timing: ScoringOrchestratorResult['timing'] = {
      descriptionScoringMs: 0,
      activityScoringMs: 0,
      portfolioScoringMs: 0,
      teachingMs: 0,
      totalMs: 0,
    };

    const tokensUsed = {
      descriptionScoring: { input: 0, output: 0 },
      activityScoring: { input: 0, output: 0 },
      portfolioScoring: { input: 0, output: 0 },
      teaching: { input: 0, output: 0 },
      total: { input: 0, output: 0 },
    };

    // Track cache hits/misses for reporting
    const descriptionCacheResults = new Map<string, boolean>();
    const activityCacheResults = new Map<string, boolean>();

    try {
      // Prepare inputs for all activities
      const descriptionInputs: { id: string; input: DescriptionScoringInput }[] = input.activities.map((a) => ({
        id: a.id,
        input: {
          description: a.description,
          activityTitle: a.title,
          activityType: a.category,
          position: a.role,
        },
      }));

      const activityInputs: { id: string; input: ActivityScoringInput }[] = input.activities.map((a) => ({
        id: a.id,
        input: {
          title: a.title,
          description: a.description,
          type: a.category,
          position: a.role,
          organization: a.organization,
          grades: a.gradeLevels,
          hoursPerWeek: a.hoursPerWeek,
          weeksPerYear: a.weeksPerYear,
          honors: a.achievements?.map((ach) => ach.title).join(', '),
          intendedMajor: input.studentContext?.intendedMajor,
        },
      }));

      // Detect changes for reporting
      const changeDetection = enableCache && !forceFresh
        ? this.cacheService.detectChanges(
            sessionId,
            input.activities.map((a, i) => ({
              id: a.id,
              descriptionInput: descriptionInputs[i].input,
              activityInput: activityInputs[i].input,
            }))
          )
        : undefined;

      // ========================================================================
      // Steps 1 & 2: Score descriptions and activities in PARALLEL (with caching)
      // ========================================================================
      const parallelStart = Date.now();
      console.log(`[ScoringOrchestrator] Starting parallel description + activity scoring...`);

      const [descHelperResult, actHelperResult] = await Promise.all([
        this.scoreDescriptionsWithCache(
          descriptionInputs, enableCache, forceFresh, sessionId,
          input.targetPlatform, descriptionCacheResults
        ),
        this.scoreActivitiesWithCache(
          activityInputs, enableCache, forceFresh, sessionId,
          input.studentContext, activityCacheResults
        ),
      ]);

      console.log(`[ScoringOrchestrator] Parallel scoring complete in ${Date.now() - parallelStart}ms`);

      if (!descHelperResult.success) {
        return { success: false, error: descHelperResult.error };
      }
      if (!actHelperResult.success) {
        return { success: false, error: actHelperResult.error };
      }

      const descriptionScores = descHelperResult.scores!;
      const activityScores = actHelperResult.scores!;
      timing.descriptionScoringMs = descHelperResult.timingMs!;
      timing.activityScoringMs = actHelperResult.timingMs!;

      if (descHelperResult.tokensUsed) {
        tokensUsed.descriptionScoring = descHelperResult.tokensUsed;
      }
      if (actHelperResult.tokensUsed) {
        tokensUsed.activityScoring = actHelperResult.tokensUsed;
      }

      // Update session with current activity IDs for next comparison
      if (enableCache && !forceFresh) {
        this.cacheService.updateLastActivityIds(sessionId, input.activities.map((a) => a.id));
      }

      // ========================================================================
      // Step 3: Portfolio scoring (ALWAYS FRESH - holistic analysis)
      // ========================================================================
      const portStart = Date.now();
      console.log(`[ScoringOrchestrator] Scoring portfolio (always fresh - holistic analysis)...`);

      const activitiesWithScores: ActivityWithScores[] = input.activities.map((activity, index) => ({
        id: activity.id,
        title: activity.title,
        type: activity.category,
        position: activity.role,
        description: activity.description,
        descriptionScore: descriptionScores[index],
        activityScore: activityScores[index],
      }));

      const portfolioInput: PortfolioScoringInput = {
        activities: activitiesWithScores,
        studentContext: {
          intendedMajor: input.studentContext?.intendedMajor,
          schoolType: input.studentContext?.schoolType,
          gradeLevel: input.studentContext?.gradeLevel,
          contextualFactors: input.studentContext?.contextualFactors,
        },
      };

      const portResult = await portfolioScoringService.scorePortfolio(portfolioInput);

      timing.portfolioScoringMs = Date.now() - portStart;

      if (!portResult.success || !portResult.rubric) {
        return {
          success: false,
          error: `Portfolio scoring failed: ${portResult.error}`,
        };
      }

      if (portResult.tokensUsed) {
        tokensUsed.portfolioScoring = portResult.tokensUsed;
      }

      console.log(`[ScoringOrchestrator] Portfolio scored in ${timing.portfolioScoringMs}ms`);

      // ========================================================================
      // Step 4: Generate teaching content (optional, ALWAYS FRESH)
      // ========================================================================
      let teaching: TeachingLayerOutput | undefined;
      const teachingRequested = input.teachingOptions?.includeTeaching === true;

      if (teachingRequested) {
        const teachStart = Date.now();
        console.log(`[ScoringOrchestrator] Generating teaching content (always fresh)...`);

        const teachingInput: TeachingLayerInput = {
          scoringRubric: portResult.rubric,
          activities: input.activities,
          targetPlatform: input.targetPlatform,
          studentContext: {
            intendedMajor: input.studentContext?.intendedMajor,
            targetSchools: input.studentContext?.targetSchools,
            applicationTimeline: input.studentContext?.applicationTimeline,
            // Pass grade level for timeline-aware teaching
            currentGrade: input.studentContext?.gradeLevel,
          },
          options: {
            maxTransformations: input.teachingOptions?.maxTransformations,
            includeAlternatives: input.teachingOptions?.includeAlternatives,
            includeCraftTeaching: input.teachingOptions?.includeCraftTeaching,
            focusActivities: input.teachingOptions?.focusActivities,
          },
        };

        const teachResult = await activityTeachingLayerService.generateTeaching(teachingInput);

        timing.teachingMs = Date.now() - teachStart;

        if (teachResult.success && teachResult.teaching) {
          teaching = teachResult.teaching;
          tokensUsed.teaching = teachResult.teaching.metadata.tokensUsed;
          console.log(`[ScoringOrchestrator] Teaching generated in ${timing.teachingMs}ms`);
        } else {
          console.warn(`[ScoringOrchestrator] Teaching generation failed: ${teachResult.error}`);
          // Continue without teaching - it's optional
        }
      }

      timing.totalMs = Date.now() - startTime;

      // Calculate total tokens
      tokensUsed.total = {
        input:
          tokensUsed.descriptionScoring.input +
          tokensUsed.activityScoring.input +
          tokensUsed.portfolioScoring.input +
          tokensUsed.teaching.input,
        output:
          tokensUsed.descriptionScoring.output +
          tokensUsed.activityScoring.output +
          tokensUsed.portfolioScoring.output +
          tokensUsed.teaching.output,
      };

      // Build cache usage info
      const cacheInfo = this.cacheService.buildCacheUsageInfo(
        sessionId,
        input.activities.map((a) => ({ id: a.id, title: a.title })),
        descriptionCacheResults,
        activityCacheResults,
        forceFresh,
        teachingRequested
      );

      console.log(`[ScoringOrchestrator] Total scoring completed in ${timing.totalMs}ms`);
      console.log(`[ScoringOrchestrator] Cache summary: ${cacheInfo.savings.apiCallsSaved} API calls saved, ~$${cacheInfo.savings.estimatedCostSaved.toFixed(4)} saved`);

      // Build score lookup map
      const scoresByActivityId = new Map<string, ActivityScoreRubric>();
      for (const score of portResult.rubric.activityScores) {
        scoresByActivityId.set(score.activityId, score);
      }

      return {
        success: true,
        rubric: portResult.rubric,
        teaching,
        scoresByActivityId,
        timing,
        tokensUsed,
        cacheInfo,
        changeDetection,
      };
    } catch (error) {
      console.error('[ScoringOrchestrator] Error in scoring pipeline:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========================================================================
  // Private helpers for parallel scoring
  // ========================================================================

  /**
   * Score descriptions with caching (called in parallel with activity scoring)
   */
  private async scoreDescriptionsWithCache(
    descriptionInputs: { id: string; input: DescriptionScoringInput }[],
    enableCache: boolean,
    forceFresh: boolean,
    sessionId: string,
    targetPlatform: ScoringOrchestratorInput['targetPlatform'],
    cacheResults: Map<string, boolean>
  ): Promise<{
    success: boolean;
    scores?: DescriptionScore[];
    tokensUsed?: { input: number; output: number };
    timingMs?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    console.log(`[ScoringOrchestrator] Scoring descriptions...`);

    const descriptionScores: DescriptionScore[] = [];
    const descToScore: { index: number; input: DescriptionScoringInput }[] = [];

    // Check cache for each description
    for (let i = 0; i < descriptionInputs.length; i++) {
      const { id, input: descInput } = descriptionInputs[i];

      if (enableCache && !forceFresh) {
        const cacheResult = this.cacheService.getDescriptionScore(sessionId, id, descInput);
        if (cacheResult.hit && cacheResult.value) {
          descriptionScores[i] = cacheResult.value;
          cacheResults.set(id, true);
          console.log(`[ScoringOrchestrator] Description ${i + 1}: CACHE HIT`);
          continue;
        }
      }

      // Cache miss - need to score
      descToScore.push({ index: i, input: descInput });
      cacheResults.set(id, false);
    }

    let tokensUsed: { input: number; output: number } | undefined;

    // Score descriptions that had cache misses
    if (descToScore.length > 0) {
      console.log(`[ScoringOrchestrator] Scoring ${descToScore.length} descriptions (${descriptionInputs.length - descToScore.length} cached)`);

      const descResult = await descriptionScoringService.scoreDescriptionsBatch({
        activities: descToScore.map((d) => d.input),
        targetPlatform,
      });

      if (!descResult.success || !descResult.scores) {
        return {
          success: false,
          error: `Description scoring failed: ${descResult.error}`,
        };
      }

      // Place results in correct positions and cache them
      for (let j = 0; j < descToScore.length; j++) {
        const { index, input: descInput } = descToScore[j];
        const score = descResult.scores[j];
        descriptionScores[index] = score;

        // Cache the result
        if (enableCache && !forceFresh) {
          this.cacheService.setDescriptionScore(sessionId, descriptionInputs[index].id, descInput, score);
        }
      }

      // Validate no missing scores after batch mapping (C2)
      const missingDescs = descToScore.filter(d => !descriptionScores[d.index]);
      if (missingDescs.length > 0) {
        console.error(`[ScoringOrchestrator] ${missingDescs.length}/${descToScore.length} description scores missing after batch`);
        return {
          success: false,
          error: `Description scoring returned incomplete results: ${descResult.scores?.length || 0}/${descToScore.length} scores`,
        };
      }

      if (descResult.tokensUsed) {
        tokensUsed = descResult.tokensUsed;
      }
    }

    const timingMs = Date.now() - startTime;
    console.log(`[ScoringOrchestrator] Descriptions scored in ${timingMs}ms (${descToScore.length} fresh, ${descriptionInputs.length - descToScore.length} cached)`);

    return { success: true, scores: descriptionScores, tokensUsed, timingMs };
  }

  /**
   * Score activities with caching (called in parallel with description scoring)
   */
  private async scoreActivitiesWithCache(
    activityInputs: { id: string; input: ActivityScoringInput }[],
    enableCache: boolean,
    forceFresh: boolean,
    sessionId: string,
    studentContext: ScoringOrchestratorInput['studentContext'],
    cacheResults: Map<string, boolean>
  ): Promise<{
    success: boolean;
    scores?: ActivityScore[];
    tokensUsed?: { input: number; output: number };
    timingMs?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    console.log(`[ScoringOrchestrator] Scoring activities...`);

    const activityScores: ActivityScore[] = [];
    const actToScore: { index: number; input: ActivityScoringInput }[] = [];

    // Check cache for each activity
    for (let i = 0; i < activityInputs.length; i++) {
      const { id, input: actInput } = activityInputs[i];

      if (enableCache && !forceFresh) {
        const cacheResult = this.cacheService.getActivityScore(sessionId, id, actInput);
        if (cacheResult.hit && cacheResult.value) {
          activityScores[i] = cacheResult.value;
          cacheResults.set(id, true);
          console.log(`[ScoringOrchestrator] Activity ${i + 1}: CACHE HIT`);
          continue;
        }
      }

      // Cache miss - need to score
      actToScore.push({ index: i, input: actInput });
      cacheResults.set(id, false);
    }

    let tokensUsed: { input: number; output: number } | undefined;

    // Score activities that had cache misses
    if (actToScore.length > 0) {
      console.log(`[ScoringOrchestrator] Scoring ${actToScore.length} activities (${activityInputs.length - actToScore.length} cached)`);

      const actResult = await activityScoringService.scoreActivitiesBatch({
        activities: actToScore.map((a) => a.input),
        studentContext,
      });

      if (!actResult.success || !actResult.scores) {
        return {
          success: false,
          error: `Activity scoring failed: ${actResult.error}`,
        };
      }

      // Place results in correct positions and cache them
      for (let j = 0; j < actToScore.length; j++) {
        const { index, input: actInput } = actToScore[j];
        const score = actResult.scores[j];
        activityScores[index] = score;

        // Cache the result
        if (enableCache && !forceFresh) {
          this.cacheService.setActivityScore(sessionId, activityInputs[index].id, actInput, score);
        }
      }

      // Validate no missing scores after batch mapping (C2)
      const missingActs = actToScore.filter(a => !activityScores[a.index]);
      if (missingActs.length > 0) {
        console.error(`[ScoringOrchestrator] ${missingActs.length}/${actToScore.length} activity scores missing after batch`);
        return {
          success: false,
          error: `Activity scoring returned incomplete results: ${actResult.scores?.length || 0}/${actToScore.length} scores`,
        };
      }

      if (actResult.tokensUsed) {
        tokensUsed = actResult.tokensUsed;
      }
    }

    const timingMs = Date.now() - startTime;
    console.log(`[ScoringOrchestrator] Activities scored in ${timingMs}ms (${actToScore.length} fresh, ${activityInputs.length - actToScore.length} cached)`);

    return { success: true, scores: activityScores, tokensUsed, timingMs };
  }

  /**
   * Quick method to score just descriptions
   */
  async scoreDescriptionsOnly(
    activities: ActivityWorkshopInput[]
  ): Promise<{ success: boolean; scores?: DescriptionScore[]; error?: string }> {
    const inputs: DescriptionScoringInput[] = activities.map((a) => ({
      description: a.description,
      activityTitle: a.title,
      activityType: a.category,
      position: a.role,
    }));

    const result = await descriptionScoringService.scoreDescriptionsBatch({ activities: inputs });
    return {
      success: result.success,
      scores: result.scores,
      error: result.error,
    };
  }

  /**
   * Quick method to score just activities
   */
  async scoreActivitiesOnly(
    activities: ActivityWorkshopInput[],
    intendedMajor?: string
  ): Promise<{ success: boolean; scores?: ActivityScore[]; error?: string }> {
    const inputs: ActivityScoringInput[] = activities.map((a) => ({
      title: a.title,
      description: a.description,
      type: a.category,
      position: a.role,
      organization: a.organization,
      grades: a.gradeLevels,
      hoursPerWeek: a.hoursPerWeek,
      weeksPerYear: a.weeksPerYear,
      honors: a.achievements?.map((ach) => ach.title).join(', '),
      intendedMajor,
    }));

    const result = await activityScoringService.scoreActivitiesBatch({ activities: inputs });
    return {
      success: result.success,
      scores: result.scores,
      error: result.error,
    };
  }

  /**
   * Generate teaching content from existing scoring results
   * Use this when you already have a rubric and want to add teaching separately
   */
  async generateTeachingFromRubric(
    rubric: PortfolioScoreRubric,
    activities: ActivityWorkshopInput[],
    options?: ScoringOrchestratorInput['teachingOptions']
  ): Promise<{ success: boolean; teaching?: TeachingLayerOutput; error?: string }> {
    console.log(`[ScoringOrchestrator] Generating teaching from existing rubric...`);

    const teachingInput: TeachingLayerInput = {
      scoringRubric: rubric,
      activities,
      options: {
        maxTransformations: options?.maxTransformations,
        includeAlternatives: options?.includeAlternatives,
        includeCraftTeaching: options?.includeCraftTeaching,
        focusActivities: options?.focusActivities,
      },
    };

    const result = await activityTeachingLayerService.generateTeaching(teachingInput);

    return {
      success: result.success,
      teaching: result.teaching,
      error: result.error,
    };
  }

  /**
   * Get score summary for display
   */
  getScoreSummary(rubric: PortfolioScoreRubric): {
    overall: { score: number; level: string; harvard: number };
    activities: { id: string; title: string; combined: number; description: number; activity: number }[];
    topStrengths: string[];
    topImprovements: string[];
  } {
    return {
      overall: {
        score: rubric.overallScore.total,
        level: portfolioScoringService.getScoreLevelDescription(rubric.overallScore.total),
        harvard: rubric.harvardScale.rating,
      },
      activities: rubric.activityScores.map((a) => ({
        id: a.activityId,
        title: a.activityTitle,
        combined: a.combinedScore.total,
        description: a.descriptionScore.total,
        activity: a.activityScore.total,
      })),
      topStrengths: rubric.keyStrengths.slice(0, 3),
      topImprovements: rubric.keyGaps.slice(0, 3),
    };
  }
}

// Export singleton
export const scoringOrchestrator = new ScoringOrchestrator();
