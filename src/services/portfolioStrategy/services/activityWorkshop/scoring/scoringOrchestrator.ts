// @ts-nocheck
/**
 * Scoring Orchestrator — Decomposed Architecture
 *
 * Orchestrates the complete scoring pipeline:
 *   1. Description Scoring (Sonnet batch, with caching) — HOW well written
 *   2. Feature Extraction (Haiku per-activity parallel) — WHAT the activity contains
 *   3. Tier Classification (deterministic code) — WHERE it sits in the 6-tier system
 *   4. Activity Rule Scoring (deterministic code) — base component scores from evidence
 *   5. Nuance Calibration (Sonnet per-activity) — adjust scores within tier bounds
 *   6. Portfolio Calibration (deterministic code) — cross-activity consistency
 *   7. Portfolio Scoring (Sonnet) — holistic assessment, always fresh
 *   8. Teaching Layer (Sonnet) — optional, always fresh
 *
 * Steps 1 and 2 run in PARALLEL. Steps 3-6 are sequential but fast.
 * Fallback: if extraction fails for an activity, legacy single-pass scoring is used.
 *
 * CACHING STRATEGY:
 * - Description scores cached per-activity (hash of input)
 * - Activity scores cached per-activity (hash of input) — stores full pipeline result
 * - Evidence + tier cached alongside score for portfolio calibration
 * - Portfolio calibration ALWAYS runs fresh (cross-activity, instant, $0)
 * - Portfolio scoring ALWAYS runs fresh (holistic quality)
 * - Teaching layer ALWAYS runs fresh
 *
 * COST (10 activities):
 * - First run: ~$0.03-0.06 (extraction + nuance + descriptions + portfolio)
 * - With caching (1 change): ~$0.02-0.04 (1 Haiku + 1 Sonnet nuance + portfolio)
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
  ExtractedEvidence,
  TierClassification,
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

// Decomposed pipeline components
import { featureExtractorService } from './featureExtractor';
import type { BatchFeatureExtractionInput, ActivityFeatureExtraction } from './featureTypes';
import { classifyTier } from './tierClassifier';
import { activityRuleScorerService } from './activityRuleScorer';
import { descriptionRuleScorerService } from './descriptionRuleScorer';
import { calibrateBatch } from './nuanceCalibrationService';
import type { NuanceCalibratedResult } from './nuanceCalibrationTypes';
import { calibratePortfolio } from './portfolioCalibrator';
import type { CalibrationInput } from './portfolioCalibrator';

// Expertise Signaling Library — deterministic expertise matching ($0, <1ms)
import {
  getExpertiseDomain,
  getExpertiseDomainWithSubResolution,
  matchExpertiseSignals,
  buildExpertiseTeachingContext,
  batchMatchExpertiseSignals,
  EXPERTISE_DOMAINS,
  getExemplarsForDomain,
} from './expertiseSignaling';
import type { ExpertiseMatchResult, ExpertiseTeachingContext, Exemplar, DescriptionTransform } from './expertiseSignaling';

// Cross-user cache — Supabase-backed scoring cache shared across users
import { crossUserCacheService } from './crossUserCacheService';
import { KB_VERSION } from './knowledge';

// Impressiveness Analyzer — field-specific context ($0, <1ms)
// Wired to the rich impressivenessCalibration module (12 domains, 5-level ladders, exemplars)
import { analyzeImpressiveness } from './impressivenessCalibration';
import type { ImpressionAnalysisResult } from './impressivenessCalibration';

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

/** M1: Maximum entries in the evidence cache before eviction */
const MAX_EVIDENCE_CACHE_SIZE = 500;

export class ScoringOrchestrator {
  private cacheService: ScoringCacheService;
  /** Evidence + tier cache — stored alongside activity score cache for portfolio calibration */
  private evidenceCache = new Map<string, { evidence: ExtractedEvidence; tier: TierClassification; descriptionScore?: DescriptionScore }>();

  constructor(cacheService?: ScoringCacheService) {
    this.cacheService = cacheService || scoringCacheService;
  }

  private evidenceCacheKey(sessionId: string, activityId: string): string {
    return `${sessionId}:${activityId}`;
  }

  /** M1: Evict oldest evidence cache entries when size exceeds limit */
  private enforceEvidenceCacheSize(): void {
    if (this.evidenceCache.size <= MAX_EVIDENCE_CACHE_SIZE) return;
    const excess = this.evidenceCache.size - MAX_EVIDENCE_CACHE_SIZE;
    const keys = this.evidenceCache.keys();
    for (let i = 0; i < excess; i++) {
      const { value: key, done } = keys.next();
      if (done) break;
      this.evidenceCache.delete(key);
    }
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
      // Steps 1 & 2: Decomposed scoring pipeline
      //   Feature extraction (Haiku) → Tier + Expertise + Rule scoring (code) →
      //   Description scoring (code, $0) → Nuance calibration (Sonnet) →
      //   Portfolio calibration (code)
      //
      // Description scoring is now DETERMINISTIC — uses features already extracted
      // by Haiku, eliminating the separate Sonnet description batch call.
      // Saves ~$0.01-0.02 per portfolio with identical type output.
      // ========================================================================
      const pipelineStart = Date.now();
      console.log(`[ScoringOrchestrator] Starting decomposed scoring pipeline...`);

      const actHelperResult = await this.scoreActivitiesDecomposed(
        input.activities, activityInputs,
        enableCache, forceFresh, sessionId,
        input.studentContext, activityCacheResults
      );

      if (!actHelperResult.success) {
        return { success: false, error: actHelperResult.error };
      }

      const activityScores = actHelperResult.scores!;
      const descriptionScores: DescriptionScore[] = actHelperResult.descriptionScores || [];

      // Fall back to LLM description scoring for any activities missing scores
      // (extraction failures or cache entries from before deterministic scoring)
      const missingDescIndices: number[] = [];
      for (let i = 0; i < input.activities.length; i++) {
        if (!descriptionScores[i]) missingDescIndices.push(i);
        // Mirror activity cache results for description cache tracking
        descriptionCacheResults.set(input.activities[i].id, activityCacheResults.get(input.activities[i].id) ?? false);
      }

      if (missingDescIndices.length > 0) {
        console.log(`[ScoringOrchestrator] ${missingDescIndices.length} activities need LLM description scoring (extraction fallback)...`);
        const fallbackInputs = missingDescIndices.map(i => descriptionInputs[i].input);
        const fallbackResult = await descriptionScoringService.scoreDescriptionsBatch({
          activities: fallbackInputs,
          targetPlatform: input.targetPlatform,
        });
        if (fallbackResult.success && fallbackResult.scores) {
          for (let j = 0; j < missingDescIndices.length; j++) {
            if (fallbackResult.scores[j]) {
              descriptionScores[missingDescIndices[j]] = fallbackResult.scores[j];
              descriptionCacheResults.set(input.activities[missingDescIndices[j]].id, false);
            }
          }
          if (fallbackResult.tokensUsed) {
            tokensUsed.descriptionScoring = fallbackResult.tokensUsed;
          }
        }
      }

      console.log(`[ScoringOrchestrator] Pipeline complete in ${Date.now() - pipelineStart}ms`);

      // Description scoring is deterministic ($0) — included in pipeline timing
      timing.descriptionScoringMs = 0;
      timing.activityScoringMs = actHelperResult.timingMs!;

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

      // Retrieve previous portfolio score from cache session for anchoring
      let previousScore: PortfolioScoringInput['previousScore'] | undefined;
      if (enableCache && !forceFresh) {
        const session = this.cacheService.getSession(sessionId);
        if (session?.previousPortfolioScore) {
          previousScore = session.previousPortfolioScore;
          console.log(`[ScoringOrchestrator] Using previous score anchor: ${previousScore.total}/10`);
        }
      }

      const portfolioInput: PortfolioScoringInput = {
        activities: activitiesWithScores,
        studentContext: {
          intendedMajor: input.studentContext?.intendedMajor,
          schoolType: input.studentContext?.schoolType,
          gradeLevel: input.studentContext?.gradeLevel,
          contextualFactors: input.studentContext?.contextualFactors,
        },
        previousScore,
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

      console.log(`[ScoringOrchestrator] Portfolio scored in ${timing.portfolioScoringMs}ms: ${portResult.rubric.overallScore.total}/10`);

      // Store portfolio score in session for anchoring on next run
      if (enableCache && !forceFresh) {
        const bd = portResult.rubric.breakdown;
        this.cacheService.setPreviousPortfolioScore(sessionId, {
          total: portResult.rubric.overallScore.total,
          breakdown: {
            tierDistribution: bd.tierDistribution.score,
            spikeDetection: bd.spikeDetection.score,
            coherence: bd.coherence.score,
            majorAlignment: bd.majorAlignment.score,
            presentationQuality: bd.presentationQuality.score,
          },
          competitiveTier: portResult.rubric.harvardScale.description,
        });
      }

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
          // Per-activity expertise data for field-specific teaching
          expertiseData: (() => {
            const map = new Map();
            for (let idx = 0; idx < input.activities.length; idx++) {
              const actId = input.activities[idx].id;
              if (allTeachingContexts[idx] && actId) {
                map.set(actId, {
                  teachingContext: allTeachingContexts[idx],
                  exemplars: allExemplars[idx] || [],
                  transforms: allTransforms[idx] || [],
                });
              }
            }
            return map.size > 0 ? map : undefined;
          })(),
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
        if (score) {
          descriptionScores[index] = score;
          // Cache the result
          if (enableCache && !forceFresh) {
            this.cacheService.setDescriptionScore(sessionId, descriptionInputs[index].id, descInput, score);
          }
        }
      }

      // Retry missing description scores individually (same quality, prompt cached)
      const missingDescs = descToScore.filter(d => !descriptionScores[d.index]);
      if (missingDescs.length > 0) {
        console.warn(`[ScoringOrchestrator] ${missingDescs.length}/${descToScore.length} description scores missing from batch. Retrying individually...`);

        for (const missing of missingDescs) {
          const retryResult = await descriptionScoringService.scoreDescription(missing.input, targetPlatform);
          if (retryResult.success && retryResult.score) {
            descriptionScores[missing.index] = retryResult.score;
            console.log(`[ScoringOrchestrator] Description retry SUCCESS for activity ${missing.index + 1}`);
            if (enableCache && !forceFresh) {
              this.cacheService.setDescriptionScore(sessionId, descriptionInputs[missing.index].id, missing.input, retryResult.score);
            }
            if (retryResult.tokensUsed) {
              tokensUsed = {
                input: (tokensUsed?.input || 0) + retryResult.tokensUsed.input,
                output: (tokensUsed?.output || 0) + retryResult.tokensUsed.output,
              };
            }
          } else {
            console.error(`[ScoringOrchestrator] Description retry FAILED for activity ${missing.index + 1}: ${retryResult.error}`);
          }
        }

        // Final check — if still missing, fail
        const stillMissing = descToScore.filter(d => !descriptionScores[d.index]);
        if (stillMissing.length > 0) {
          return {
            success: false,
            error: `Description scoring failed for ${stillMissing.length} activities even after individual retry`,
          };
        }
      }

      if (descResult.tokensUsed) {
        tokensUsed = {
          input: (tokensUsed?.input || 0) + descResult.tokensUsed.input,
          output: (tokensUsed?.output || 0) + descResult.tokensUsed.output,
        };
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
        if (score) {
          activityScores[index] = score;
          // Cache the result
          if (enableCache && !forceFresh) {
            this.cacheService.setActivityScore(sessionId, activityInputs[index].id, actInput, score);
          }
        }
      }

      // Retry missing activity scores individually (same Sonnet quality, prompt cached)
      const missingActs = actToScore.filter(a => !activityScores[a.index]);
      if (missingActs.length > 0) {
        console.warn(`[ScoringOrchestrator] ${missingActs.length}/${actToScore.length} activity scores missing from batch. Retrying individually...`);

        for (const missing of missingActs) {
          const retryResult = await activityScoringService.scoreActivity(missing.input);
          if (retryResult.success && retryResult.score) {
            activityScores[missing.index] = retryResult.score;
            console.log(`[ScoringOrchestrator] Activity retry SUCCESS for activity ${missing.index + 1}`);
            if (enableCache && !forceFresh) {
              this.cacheService.setActivityScore(sessionId, activityInputs[missing.index].id, missing.input, retryResult.score);
            }
            if (retryResult.tokensUsed) {
              tokensUsed = {
                input: (tokensUsed?.input || 0) + retryResult.tokensUsed.input,
                output: (tokensUsed?.output || 0) + retryResult.tokensUsed.output,
              };
            }
          } else {
            console.error(`[ScoringOrchestrator] Activity retry FAILED for activity ${missing.index + 1}: ${retryResult.error}`);
          }
        }

        // Final check — if still missing, fail
        const stillMissing = actToScore.filter(a => !activityScores[a.index]);
        if (stillMissing.length > 0) {
          return {
            success: false,
            error: `Activity scoring failed for ${stillMissing.length} activities even after individual retry`,
          };
        }
      }

      if (actResult.tokensUsed) {
        tokensUsed = {
          input: (tokensUsed?.input || 0) + actResult.tokensUsed.input,
          output: (tokensUsed?.output || 0) + actResult.tokensUsed.output,
        };
      }
    }

    const timingMs = Date.now() - startTime;
    console.log(`[ScoringOrchestrator] Activities scored in ${timingMs}ms (${actToScore.length} fresh, ${activityInputs.length - actToScore.length} cached)`);

    return { success: true, scores: activityScores, tokensUsed, timingMs };
  }

  // ========================================================================
  // Decomposed Activity Scoring Pipeline
  // ========================================================================

  /**
   * Score activities using the decomposed pipeline:
   *   Feature Extraction (Haiku) → Tier Classification (code) →
   *   Rule Scoring (code) → Nuance Calibration (Sonnet) →
   *   Portfolio Calibration (code)
   *
   * Falls back to legacy single-pass scoring for activities where extraction fails.
   */
  private async scoreActivitiesDecomposed(
    activities: ActivityWorkshopInput[],
    activityInputs: { id: string; input: ActivityScoringInput }[],
    enableCache: boolean,
    forceFresh: boolean,
    sessionId: string,
    studentContext: ScoringOrchestratorInput['studentContext'],
    cacheResults: Map<string, boolean>
  ): Promise<{
    success: boolean;
    scores?: ActivityScore[];
    descriptionScores?: DescriptionScore[];
    tokensUsed?: { input: number; output: number };
    timingMs?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    console.log(`[ScoringOrchestrator] Starting decomposed activity scoring for ${activities.length} activities...`);

    const activityScores: ActivityScore[] = new Array(activities.length);
    const descriptionScores: (DescriptionScore | null)[] = new Array(activities.length).fill(null);
    const allEvidence: (ExtractedEvidence | null)[] = new Array(activities.length).fill(null);
    const allTiers: (TierClassification | null)[] = new Array(activities.length).fill(null);
    const allImpressions: (ImpressionAnalysisResult | null)[] = new Array(activities.length).fill(null);
    const allTeachingContexts: Array<ExpertiseTeachingContext | undefined> = new Array(activities.length).fill(undefined);
    const allExemplars: Array<Exemplar[]> = new Array(activities.length).fill([]);
    const allTransforms: Array<DescriptionTransform[]> = new Array(activities.length).fill([]);
    const toExtract: number[] = []; // indices needing fresh pipeline (full scoring)
    const toExtractEvidenceOnly: number[] = []; // indices with cached scores but needing evidence for portfolio calibration

    // ---- Phase 0: Check cache (2-tier: session cache → cross-user cache) ----
    let crossUserHits = 0;
    for (let i = 0; i < activities.length; i++) {
      const { id, input: actInput } = activityInputs[i];

      if (enableCache && !forceFresh) {
        // Tier 1: Session cache (fastest, in-memory)
        const cacheResult = this.cacheService.getActivityScore(sessionId, id, actInput);
        const evKey = this.evidenceCacheKey(sessionId, id);
        const evCached = this.evidenceCache.get(evKey);

        if (cacheResult.hit && cacheResult.value && evCached) {
          activityScores[i] = cacheResult.value;
          allEvidence[i] = evCached.evidence;
          allTiers[i] = evCached.tier;
          if (evCached.descriptionScore) {
            descriptionScores[i] = evCached.descriptionScore;
          }
          cacheResults.set(id, true);
          console.log(`[ScoringOrchestrator] Activity ${i + 1} (${activities[i].title}): SESSION CACHE HIT`);
          continue;
        }

        // Tier 2: Cross-user cache (Supabase, shared across users)
        try {
          const fingerprint = crossUserCacheService.computeFingerprint({
            description: activities[i].description,
            role: activities[i].role,
            category: activities[i].category,
            title: activities[i].title,
            hoursPerWeek: activities[i].hoursPerWeek,
            yearsActive: activities[i].yearsInvolved,
          });
          const crossUserResult = await crossUserCacheService.lookup(fingerprint);

          if (crossUserResult && crossUserResult.isValid) {
            // C1: Cross-user hit — reconstruct scores from cached entry
            const cachedEntry = crossUserResult.entry;

            // Reconstruct ActivityScore from cached components
            activityScores[i] = {
              total: cachedEntry.activityScore.total,
              breakdown: cachedEntry.activityScore.components as unknown as ActivityScore['breakdown'],
              tierJustification: 'Restored from cross-user cache',
              comparisonBenchmarks: { similar: [], percentile: 'N/A (cached)' } as unknown as ActivityScore['comparisonBenchmarks'],
              improvementPaths: [],
              overallRationale: 'Score restored from cross-user cache',
            };

            // Reconstruct DescriptionScore from cached breakdown
            descriptionScores[i] = {
              total: cachedEntry.descriptionScore.total,
              breakdown: cachedEntry.descriptionScore.breakdown as unknown as DescriptionScore['breakdown'],
              strengths: [],
              improvements: [],
              overallRationale: 'Score restored from cross-user cache',
            };

            console.log(`[ScoringOrchestrator] Activity ${i + 1} (${activities[i].title}): CROSS-USER CACHE HIT (age: ${Math.round(crossUserResult.cacheAge / 3600000)}h, score: ${cachedEntry.activityScore.total.toFixed(1)})`);
            crossUserHits++;
            cacheResults.set(id, true);

            // Still need evidence for portfolio calibration — extract features only, skip nuance LLM
            toExtractEvidenceOnly.push(i);
            continue;
          }
        } catch (err) {
          // Cross-user cache failure is never fatal — just skip
          console.warn(`[ScoringOrchestrator] Cross-user cache error for activity ${i + 1}:`, err instanceof Error ? err.message : err);
        }
      }

      toExtract.push(i);
      cacheResults.set(id, false);
    }

    const cachedCount = activities.length - toExtract.length - toExtractEvidenceOnly.length;
    console.log(`[ScoringOrchestrator] Cache: ${cachedCount} session cached, ${crossUserHits} cross-user hits, ${toExtractEvidenceOnly.length} evidence-only, ${toExtract.length} need fresh scoring`);

    let tokensUsed: { input: number; output: number } | undefined;

    // Combine indices that need feature extraction (both full pipeline and evidence-only)
    const allToExtract = [...toExtract, ...toExtractEvidenceOnly];
    const evidenceOnlySet = new Set(toExtractEvidenceOnly);

    // ---- Phase 1: Feature Extraction (Haiku, parallel per-activity) ----
    if (allToExtract.length > 0) {
      const extractStart = Date.now();

      const extractionInput: BatchFeatureExtractionInput = {
        activities: allToExtract.map(i => ({
          id: activities[i].id,
          title: activities[i].title,
          description: activities[i].description,
          role: activities[i].role,
          category: activities[i].category,
          organization: activities[i].organization,
          hoursPerWeek: activities[i].hoursPerWeek,
          weeksPerYear: activities[i].weeksPerYear,
          yearsInvolved: activities[i].yearsInvolved,
          gradeLevels: activities[i].gradeLevels,
          isPaid: activities[i].isPaid,
          achievements: activities[i].achievements,
        })),
        studentContext: studentContext ? {
          intendedMajor: studentContext.intendedMajor,
          gradeLevel: studentContext.gradeLevel,
        } : undefined,
      };

      const extractionResult = await featureExtractorService.extractBatch(extractionInput);
      const extractMs = Date.now() - extractStart;
      console.log(`[ScoringOrchestrator] Feature extraction: ${extractMs}ms, ${extractionResult.failures.length} failures`);

      tokensUsed = extractionResult.totalTokens
        ? { input: extractionResult.totalTokens.input, output: extractionResult.totalTokens.output }
        : undefined;

      // ---- Phase 2: Tier Classification + Phase 3a: Rule Scoring (both instant) ----
      const ruleStart = Date.now();
      const nuanceInputs: Array<{
        index: number;
        evidence: ExtractedEvidence;
        tier: TierClassification;
        activityScore: ActivityScore;
        meta: { title: string; description: string; type?: string; position?: string };
        expertiseContext?: {
          domainId: string;
          confidence: 'high' | 'medium' | 'low';
          signalCount: number;
          trapCount: number;
          expertiseScore: number;
          topSignals: string[];
          topTraps: string[];
        };
        impressionContext?: ImpressionAnalysisResult;
      }> = [];
      const legacyFallbackIndices: number[] = [];

      for (let j = 0; j < allToExtract.length; j++) {
        const i = allToExtract[j];
        const isEvidenceOnly = evidenceOnlySet.has(i);
        const extraction = extractionResult.extractions[j];

        if (!extraction) {
          if (isEvidenceOnly) {
            // Evidence-only: extraction failed but we already have cached scores — just skip evidence
            console.warn(`[ScoringOrchestrator] Evidence extraction failed for "${activities[i].title}" (cross-user cached, skipping evidence)`);
            continue;
          }
          // Extraction failed — will fall back to legacy scorer
          console.warn(`[ScoringOrchestrator] Extraction failed for "${activities[i].title}", using legacy fallback`);
          legacyFallbackIndices.push(i);
          continue;
        }

        // Phase 2: Tier classification (deterministic, ~0ms)
        const evidence = extraction.activityEvidence;
        const tier = classifyTier(evidence);

        // Phase 2b: Expertise signal matching (deterministic, <1ms, $0)
        const detectedType = extraction.descriptionFeatures.detectedActivityType;
        const expertiseDomain = getExpertiseDomainWithSubResolution(
          detectedType,
          [activities[i].title, activities[i].role ?? '', activities[i].category ?? ''],
        );
        let expertiseResult: ExpertiseMatchResult | undefined;
        if (expertiseDomain) {
          expertiseResult = matchExpertiseSignals(
            activities[i].description,
            extraction.descriptionFeatures,
            expertiseDomain,
            activities[i].role,
          );
        }

        // Phase 2b-ii: Build teaching context + exemplars (deterministic, <1ms, $0)
        let teachingCtx: ExpertiseTeachingContext | undefined;
        let activityExemplars: Exemplar[] = [];
        let applicableTransforms: DescriptionTransform[] = [];
        if (expertiseDomain && expertiseResult) {
          teachingCtx = buildExpertiseTeachingContext(expertiseDomain, expertiseResult, activities[i].role);
          activityExemplars = getExemplarsForDomain(expertiseDomain.domainId, tier.internalTier) ?? [];
          applicableTransforms = expertiseResult.applicableTransforms ?? [];
        }
        allTeachingContexts[i] = teachingCtx;
        allExemplars[i] = activityExemplars;
        allTransforms[i] = applicableTransforms;

        // Phase 2c: Impressiveness analysis (deterministic, <1ms, $0)
        // Provides field-specific context: WHY this achievement level matters, major alignment, depth markers
        const impressionResult = analyzeImpressiveness(
          evidence,
          tier,
          expertiseResult,
          studentContext?.intendedMajor,
          activities[i].description,
        );
        allImpressions[i] = impressionResult;

        // Phase 2c-ii: Enrich exemplars from impressiveness calibration
        // If the new module found domain-specific exemplars, convert and merge with existing
        if (impressionResult.exemplars && impressionResult.exemplars.length > 0) {
          const newExemplars: Exemplar[] = impressionResult.exemplars.map(e => ({
            domainId: e.domainId,
            tier: e.targetTier as 1 | 2 | 3 | 4 | 5 | 6,
            description: e.text,
            whyItWorks: e.whyItWorks,
            techniques: e.demonstratesDimensions,
          }));
          // Prefer new impressiveness-calibrated exemplars, append any old ones that aren't duplicates
          const existingIds = new Set(newExemplars.map(e => e.description));
          const unique = allExemplars[i].filter(e => !existingIds.has(e.description));
          allExemplars[i] = [...newExemplars, ...unique].slice(0, 5);
        }

        {
          const markerNote = (impressionResult.technicalDepthMarkers ?? []).length > 0
            ? `, ${(impressionResult.technicalDepthMarkers ?? []).length} depth markers`
            : '';
          const alignNote = impressionResult.majorAlignment && impressionResult.majorAlignment.relevance !== 'unrelated'
            ? `, major=${impressionResult.majorAlignment.relevance}(${impressionResult.majorAlignment.boostFactor})`
            : '';
          console.log(`[ScoringOrchestrator] Activity ${i + 1}: impression=${impressionResult.percentileRange}${markerNote}${alignNote}`);
        }

        // For evidence-only indices (cross-user cache hit), store evidence/tier but skip scoring
        if (isEvidenceOnly) {
          allEvidence[i] = evidence;
          allTiers[i] = tier;
          console.log(`[ScoringOrchestrator] Activity ${i + 1} (${activities[i].title}): evidence extracted for cached score (tier=${tier.internalTier})`);
          continue;
        }

        // Phase 2d: Description scoring (deterministic, <1ms, $0)
        // Uses features already extracted by Haiku — no separate LLM call needed
        const descScore = descriptionRuleScorerService.scoreDescription(
          extraction.descriptionFeatures, expertiseResult
        );
        descriptionScores[i] = descScore;

        // Phase 3a: Rule scoring (deterministic, ~0ms)
        const ruleScore = activityRuleScorerService.scoreActivity(evidence, tier);

        // Phase 3b: Apply expertise-based scoring adjustments (deterministic, ~0ms)
        if (expertiseResult && expertiseResult.confidence !== 'low') {
          const adj = expertiseResult.assessment.scoringAdjustments;
          // Adjust authenticity component (maps to communityCharacter)
          if (adj.authenticityModifier !== 0) {
            const cc = ruleScore.breakdown.communityCharacter;
            cc.score = Math.max(0, Math.min(10, Math.round((cc.score + adj.authenticityModifier) * 10) / 10));
            cc.rationale += ` [Expertise: ${adj.authenticityModifier > 0 ? '+' : ''}${adj.authenticityModifier.toFixed(2)} authenticity signal]`;
          }
        }

        const expertiseNote = expertiseResult
          ? `, expertise=${expertiseResult.assessment.expertiseScore.toFixed(1)} (${expertiseResult.detectedSignals.length}sig/${expertiseResult.detectedTraps.length}trap)`
          : '';
        console.log(`[ScoringOrchestrator] Activity ${i + 1} (${activities[i].title}): tier=${tier.internalTier}, ruleScore=${ruleScore.total.toFixed(1)}${expertiseNote}`);

        allEvidence[i] = evidence;
        allTiers[i] = tier;
        activityScores[i] = ruleScore;

        // Selective nuance calibration: skip Sonnet call for clear-cut cases
        // If the rule score is firmly in the middle of the tier range (25%+ from edges)
        // AND expertise matching confirms the scoring, the deterministic score is reliable
        const tierSpan = tier.scoreRange.max - tier.scoreRange.min;
        const distFromMin = ruleScore.total - tier.scoreRange.min;
        const distFromMax = tier.scoreRange.max - ruleScore.total;
        const isMiddleOfTier = tierSpan > 0 && distFromMin >= tierSpan * 0.25 && distFromMax >= tierSpan * 0.25;
        const expertiseConfident = expertiseResult != null && expertiseResult.confidence !== 'low';
        const skipNuance = isMiddleOfTier && expertiseConfident;

        if (skipNuance) {
          console.log(`[ScoringOrchestrator] Activity ${i + 1}: skipping nuance (score ${ruleScore.total.toFixed(1)} firmly in tier ${tier.internalTier} range)`);
        } else {
          // Queue for nuance calibration with expertise context
          nuanceInputs.push({
            index: i,
            evidence,
            tier,
            activityScore: ruleScore,
            meta: {
              title: activities[i].title,
              description: activities[i].description,
              type: activities[i].category,
              position: activities[i].role,
            },
            expertiseContext: expertiseResult ? {
              domainId: expertiseResult.domainId,
              confidence: expertiseResult.confidence,
              signalCount: expertiseResult.detectedSignals.length,
              trapCount: expertiseResult.detectedTraps.length,
              expertiseScore: expertiseResult.assessment.expertiseScore,
              topSignals: expertiseResult.detectedSignals.slice(0, 3).map(s => s.signal.id),
              topTraps: expertiseResult.detectedTraps.slice(0, 3).map(t => t.trap.id),
            } : undefined,
            impressionContext: impressionResult,
          });
        }
      }

      const skippedNuanceCount = toExtract.length - legacyFallbackIndices.length - nuanceInputs.length;
      console.log(`[ScoringOrchestrator] Tier + rule + desc scoring: ${Date.now() - ruleStart}ms (${nuanceInputs.length} need nuance, ${skippedNuanceCount} skipped, ${toExtractEvidenceOnly.length} evidence-only)`);

      // ---- Phase 3b: Nuance Calibration (Sonnet per-activity, concurrent) ----
      if (nuanceInputs.length > 0) {
        const nuanceStart = Date.now();
        console.log(`[ScoringOrchestrator] Starting nuance calibration for ${nuanceInputs.length} activities (${skippedNuanceCount} skipped as clear-cut)...`);

        const nuanceResults = await calibrateBatch(
          nuanceInputs.map(n => ({
            evidence: n.evidence,
            tier: n.tier,
            activityScore: n.activityScore,
            meta: n.meta,
            expertiseContext: n.expertiseContext,
            impressionContext: n.impressionContext,
          }))
        );

        for (let k = 0; k < nuanceInputs.length; k++) {
          const { index } = nuanceInputs[k];
          const nuance = nuanceResults[k];
          if (nuance && nuance.calibrationApplied) {
            this.applyNuanceToActivityScore(activityScores[index], nuance);
            console.log(`[ScoringOrchestrator] Activity ${index + 1}: nuance adjusted ${activityScores[index].total.toFixed(1)}`);
          }
        }

        // Add nuance tokens to total
        // (nuance calibration uses Sonnet, but token tracking is internal to the service)
        const nuanceMs = Date.now() - nuanceStart;
        console.log(`[ScoringOrchestrator] Nuance calibration: ${nuanceMs}ms`);
      }

      // ---- Legacy fallback for extraction failures ----
      if (legacyFallbackIndices.length > 0) {
        console.log(`[ScoringOrchestrator] Running legacy scorer for ${legacyFallbackIndices.length} activities...`);
        for (const i of legacyFallbackIndices) {
          const legacyResult = await activityScoringService.scoreActivity(activityInputs[i].input);
          if (legacyResult.success && legacyResult.score) {
            activityScores[i] = legacyResult.score;
            // No evidence/tier for legacy — won't participate in portfolio calibration
          } else {
            return {
              success: false,
              error: `Activity scoring failed for "${activities[i].title}" (legacy fallback): ${legacyResult.error}`,
            };
          }
        }
      }
    }

    // ---- Phase 4: Portfolio Calibration (deterministic, cross-activity, instant) ----
    // Only calibrate activities that have evidence + tier (skip legacy fallbacks)
    const calibrationInputs: CalibrationInput[] = [];
    const calibrationIndexMap: number[] = []; // maps calibration result index → original index

    for (let i = 0; i < activities.length; i++) {
      if (allEvidence[i] && allTiers[i]) {
        calibrationInputs.push({
          activityId: activities[i].id,
          activityTitle: activities[i].title,
          score: activityScores[i],
          tier: allTiers[i]!,
          evidence: allEvidence[i]!,
        });
        calibrationIndexMap.push(i);
      }
    }

    if (calibrationInputs.length > 0) {
      const calibStart = Date.now();
      const calibrationResult = calibratePortfolio(
        calibrationInputs,
        studentContext?.intendedMajor
      );

      // Apply calibrated scores back
      for (let c = 0; c < calibrationResult.activities.length; c++) {
        const originalIndex = calibrationIndexMap[c];
        activityScores[originalIndex] = calibrationResult.activities[c].score;
      }

      const calibMs = Date.now() - calibStart;
      console.log(
        `[ScoringOrchestrator] Portfolio calibration: ${calibMs}ms, ` +
        `${calibrationResult.summary.activitiesAdjusted}/${calibrationResult.summary.totalActivities} adjusted, ` +
        `rules: [${calibrationResult.summary.rulesApplied.join(', ')}]`
      );
    }

    // ---- Cache fresh results (session cache + cross-user cache) ----
    if (enableCache && !forceFresh) {
      for (const i of toExtract) {
        if (activityScores[i]) {
          // Session cache (in-memory, per-session)
          this.cacheService.setActivityScore(
            sessionId, activities[i].id, activityInputs[i].input, activityScores[i]
          );
          if (allEvidence[i] && allTiers[i]) {
            this.evidenceCache.set(this.evidenceCacheKey(sessionId, activities[i].id), {
              evidence: allEvidence[i]!,
              tier: allTiers[i]!,
              descriptionScore: descriptionScores[i] ?? undefined,
            });
            this.enforceEvidenceCacheSize();
          }

          // Cross-user cache (Supabase, shared across users) — fire-and-forget
          try {
            const fingerprint = crossUserCacheService.computeFingerprint({
              description: activities[i].description,
              role: activities[i].role,
              category: activities[i].category,
              title: activities[i].title,
              hoursPerWeek: activities[i].hoursPerWeek,
              yearsActive: activities[i].yearsInvolved,
            });
            const tier = allTiers[i];
            crossUserCacheService.write(fingerprint, {
              descriptionTotal: descriptionScores[i]?.total ?? 0,
              descriptionBreakdown: (descriptionScores[i]?.breakdown ?? {}) as Record<string, unknown>,
              activityTotal: activityScores[i].total,
              activityComponents: {
                tierScore: activityScores[i].breakdown.tierAssessment.score,
                recognitionScore: activityScores[i].breakdown.recognitionLevel.score,
                leadershipScore: activityScores[i].breakdown.leadershipImpact.score,
                communityScore: activityScores[i].breakdown.communityCharacter.score,
                commitmentScore: activityScores[i].breakdown.commitmentProgression.score,
              },
              internalTier: (tier?.internalTier ?? 4) as import('./types').InternalTier,
              externalTier: (tier?.externalTier ?? 3) as (1 | 2 | 3 | 4),
            }).catch(err => {
              console.warn(`[ScoringOrchestrator] Cross-user cache write failed for activity ${i + 1}:`, err instanceof Error ? err.message : err);
            });
          } catch (err) {
            // Cross-user cache write failure is never fatal
          }
        }
      }
    }

    const timingMs = Date.now() - startTime;
    console.log(
      `[ScoringOrchestrator] Decomposed scoring complete in ${timingMs}ms ` +
      `(${cachedCount} session cached, ${crossUserHits} cross-user cached, ${toExtract.length} fresh)`
    );

    return { success: true, scores: activityScores, descriptionScores: descriptionScores as DescriptionScore[], tokensUsed, timingMs };
  }

  /**
   * Apply nuance calibration adjustments to an ActivityScore.
   * Mutates the score in place.
   */
  private applyNuanceToActivityScore(score: ActivityScore, nuance: NuanceCalibratedResult): void {
    if (!nuance.calibrationApplied) return;

    const { breakdown } = score;
    const { adjustedComponents } = nuance;

    // Update component scores
    breakdown.recognitionLevel.score = adjustedComponents.recognitionScore;
    breakdown.leadershipImpact.score = adjustedComponents.leadershipScore;
    breakdown.communityCharacter.score = adjustedComponents.communityScore;
    breakdown.commitmentProgression.score = adjustedComponents.commitmentScore;

    // Recalculate weighted scores
    breakdown.recognitionLevel.weightedScore = adjustedComponents.recognitionScore * breakdown.recognitionLevel.weight;
    breakdown.leadershipImpact.weightedScore = adjustedComponents.leadershipScore * breakdown.leadershipImpact.weight;
    breakdown.communityCharacter.weightedScore = adjustedComponents.communityScore * breakdown.communityCharacter.weight;
    breakdown.commitmentProgression.weightedScore = adjustedComponents.commitmentScore * breakdown.commitmentProgression.weight;

    // Update total
    score.total = nuance.adjustedActivityTotal;
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
   *
   * NOTE: The `harvard` field returns the internal rating number (1-6).
   * For USER-FACING display, use `competitiveTier` instead to show the descriptive label.
   */
  getScoreSummary(rubric: PortfolioScoreRubric): {
    overall: { score: number; level: string; competitiveTier: string };
    activities: { id: string; title: string; combined: number; description: number; activity: number }[];
    topStrengths: string[];
    topImprovements: string[];
  } {
    return {
      overall: {
        score: rubric.overallScore.total,
        level: portfolioScoringService.getScoreLevelDescription(rubric.overallScore.total),
        // harvard rating removed — redundant with competitiveTier, saves downstream tokens
        competitiveTier: rubric.harvardScale.description, // USE THIS for user-facing display
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
