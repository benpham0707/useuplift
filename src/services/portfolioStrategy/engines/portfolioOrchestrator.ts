// @ts-nocheck
/**
 * Portfolio Strategy Orchestrator
 *
 * The central coordinator for the entire PASS (Portfolio & Application Strategy System).
 * This orchestrator manages the complete analysis pipeline:
 *
 * PIPELINE STAGES:
 * 1. Component Evaluation (parallel)
 *    - Academic evaluation
 *    - Activity portfolio analysis
 *    - Award evaluation
 *
 * 2. Holistic Synthesis
 *    - Combines all evaluations
 *    - Detects application archetypes
 *    - Generates unique value proposition
 *
 * 3. Strategy Analysis
 *    - School fit assessment
 *    - Admission probability estimation
 *    - List optimization
 *
 * 4. Actionable Guidance
 *    - Prioritized action items
 *    - Timeline and milestones
 *    - Progress tracking
 *
 * QUALITY PRINCIPLES:
 * - Parallel execution where possible for performance
 * - Comprehensive caching at every stage
 * - Graceful degradation on component failures
 * - Full audit trail and cost tracking
 */

import {
  StudentProfileInput,
  PortfolioStrategyAnalysis,
  AnalysisRequestConfig,
  AnalysisCacheEntry,
} from '../types';
import { AcademicInputData, AcademicEvaluation } from '../types/academic';
import { ActivitiesInputData, ActivityPortfolioAnalysis } from '../types/activities';
import { AwardsInputData, AwardEvaluation } from '../types/awards';
import { HolisticProfileSynthesis, GoalsAspirations, PersonalContext, EssayQualitySummary } from '../types/synthesis';
import { SchoolFitOutput } from '../types/schoolFit';
import { GuidanceReport } from '../types/guidance';
import { AcademicEvaluator } from './academicEvaluator';
import { ActivityAnalyzer } from './activityAnalyzer';
import { AwardEvaluator } from './awardEvaluator';
import { HolisticSynthesizer } from './holisticSynthesizer';
import { SchoolFitEngine } from './schoolFitEngine';
import { GuidanceEngine } from './guidanceEngine';
import {
  generateInputHash,
  portfolioAnalysisCache,
  generateHashedCacheKey,
  CacheUtils,
} from '../utils';

// ============================================================================
// SYSTEM CONSTANTS
// ============================================================================

const SYSTEM_VERSION = '1.0.0';
const DEFAULT_ANALYSIS_DEPTH = 'standard';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// ANALYSIS METADATA TRACKING
// ============================================================================

interface AnalysisMetrics {
  startTime: number;
  componentTimes: Record<string, number>;
  totalCostCents: number;
  tokensUsed: number;
  modelUsed: string;
  errors: Array<{ component: string; error: string }>;
}

function createMetricsTracker(): AnalysisMetrics {
  return {
    startTime: Date.now(),
    componentTimes: {},
    totalCostCents: 0,
    tokensUsed: 0,
    modelUsed: 'heuristic', // Default, updated if LLM used
    errors: [],
  };
}

// ============================================================================
// COMPONENT RESULT TYPES
// ============================================================================

interface ComponentEvaluationResults {
  academic: AcademicEvaluation | null;
  activities: ActivityPortfolioAnalysis | null;
  awards: AwardEvaluation | null;
}

interface PipelineState {
  input: StudentProfileInput;
  config: AnalysisRequestConfig;
  metrics: AnalysisMetrics;
  components: ComponentEvaluationResults;
  synthesis: HolisticProfileSynthesis | null;
  schoolFit: SchoolFitOutput | null;
  guidance: GuidanceReport | null;
}

// ============================================================================
// DEFAULT FALLBACK GENERATORS
// ============================================================================

/**
 * Generate minimal academic evaluation when component fails
 */
function createFallbackAcademicEvaluation(input: AcademicInputData): AcademicEvaluation {
  return {
    overallScore: 50,
    overallTier: 'competitive',
    confidence: 0.3,
    gpaStrength: {
      score: 50,
      tier: 'competitive',
      adjustedGPA: input.gpa?.value || 3.0,
      maxPotentialGPA: input.gpa?.scale || 4.0,
      percentileEstimate: 50,
      strengthDescription: 'Unable to fully evaluate GPA',
      contextFactors: [],
    },
    courseRigor: {
      score: 50,
      tier: 'competitive',
      rigorLevel: 'moderate',
      apCoursesCount: input.courses?.filter(c => c.level === 'AP').length || 0,
      honorsCoursesCount: input.courses?.filter(c => c.level === 'Honors').length || 0,
      strengthDescription: 'Unable to fully evaluate course rigor',
      recommendations: [],
    },
    testingStrength: {
      score: 50,
      tier: 'competitive',
      hasScores: !!input.testScores,
      submissionRecommendation: input.testScores ? 'submit' : 'skip',
      strengthDescription: 'Unable to fully evaluate testing',
      recommendations: [],
    },
    gradeTrend: {
      direction: 'stable',
      description: 'Unable to determine trend',
      implication: 'Insufficient data',
    },
    classRank: {
      hasRank: false,
      description: 'Rank not provided',
    },
    schoolFit: {},
    narrative: 'Academic evaluation incomplete due to processing error.',
    recommendations: ['Complete full academic profile for better analysis'],
    inputDataHash: generateInputHash(input),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generate minimal activity analysis when component fails
 */
function createFallbackActivityAnalysis(input: ActivitiesInputData): ActivityPortfolioAnalysis {
  return {
    overallScore: 50,
    overallTier: 'competitive',
    confidence: 0.3,
    tierDistribution: { tier1: 0, tier2: 0, tier3: input.activities?.length || 0, tier4: 0 },
    activityAssessments: (input.activities || []).map((act, i) => ({
      activityIndex: i,
      activityName: act.name,
      tier: 3 as const,
      tierScore: 50,
      tierJustification: 'Fallback evaluation',
      strengthFactors: [],
      improvementOpportunities: [],
    })),
    spikeAnalysis: {
      hasSpike: false,
      spikeStrength: 'none',
      spikeAreas: [],
      depthBreadthProfile: 'balanced',
      depthVsBreadthScore: 50,
    },
    coherenceAnalysis: {
      coherenceScore: 50,
      primaryTheme: 'general',
      supportingThemes: [],
      strengthDescription: 'Unable to fully analyze coherence',
      gapsIdentified: [],
    },
    commitmentAnalysis: {
      averageYearsPerActivity: 2,
      averageHoursPerWeek: 5,
      consistencyScore: 50,
      progressionScore: 50,
      summerEngagementScore: 50,
    },
    leadershipAnalysis: {
      leadershipScore: 50,
      leadershipTier: 'emerging',
      positionsCount: 0,
      scopeDistribution: {},
      leadershipNarrative: 'Unable to fully analyze leadership',
    },
    upgradeRecommendations: [],
    newActivitySuggestions: [],
    narrative: 'Activity analysis incomplete due to processing error.',
    inputDataHash: generateInputHash(input),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generate minimal award evaluation when component fails
 */
function createFallbackAwardEvaluation(input: AwardsInputData): AwardEvaluation {
  return {
    overallScore: 50,
    overallTier: 'competitive',
    confidence: 0.3,
    totalAwardsCount: input.awards?.length || 0,
    awardAssessments: (input.awards || []).map((award, i) => ({
      awardIndex: i,
      awardName: award.name,
      recognitionLevel: 'local' as const,
      selectivityTier: 'moderate' as const,
      score: 50,
      justification: 'Fallback evaluation',
      commonAppLevel: 'school' as const,
      commonAppCategoryFit: award.category || 'other',
      improvementSuggestions: [],
    })),
    distributionAnalysis: {
      levelDistribution: { international: 0, national: 0, state: 0, regional: 0, local: 0 },
      categoryDistribution: {},
      strengthAreas: [],
      gapAreas: [],
    },
    highlightsAnalysis: {
      topAwards: [],
      uniqueDistinctions: [],
      narrative: 'Unable to fully analyze award highlights',
    },
    commonAppOptimization: {
      recommendedHonors: [],
      categoryBalance: {},
      optimizationNotes: [],
    },
    competitiveContext: {
      percentileEstimate: 50,
      comparisonNarrative: 'Unable to determine competitive context',
      standoutFactors: [],
      concernAreas: [],
    },
    gapAnalysis: {
      missingLevels: [],
      underrepresentedCategories: [],
      recommendations: [],
    },
    narrative: 'Award evaluation incomplete due to processing error.',
    inputDataHash: generateInputHash(input),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generate minimal holistic synthesis when component fails
 */
function createFallbackSynthesis(
  components: ComponentEvaluationResults,
  context: PersonalContext,
  goals: GoalsAspirations
): HolisticProfileSynthesis {
  return {
    overallScore: 50,
    profileTier: 'competitive',
    confidence: 0.3,
    componentWeights: {
      academic: { baseWeight: 30, adjustedWeight: 30, adjustmentReason: '' },
      activities: { baseWeight: 30, adjustedWeight: 30, adjustmentReason: '' },
      awards: { baseWeight: 15, adjustedWeight: 15, adjustmentReason: '' },
      essays: { baseWeight: 20, adjustedWeight: 20, adjustmentReason: '' },
      context: { baseWeight: 5, adjustedWeight: 5, adjustmentReason: '' },
    },
    componentScores: {
      academic: components.academic?.overallScore || 50,
      activities: components.activities?.overallScore || 50,
      awards: components.awards?.overallScore || 50,
      essays: 50,
      context: 50,
    },
    applicationBrand: {
      primaryArchetype: 'the_well_rounded',
      archetypeStrength: 50,
      supportingArchetypes: [],
      brandNarrative: 'Unable to fully determine application brand',
      differentiators: [],
      potentialWeaknesses: [],
    },
    coherenceAnalysis: {
      overallCoherence: 50,
      academicActivityAlignment: 50,
      activityAwardAlignment: 50,
      thematicConsistency: 50,
      narrativeClarity: 50,
      coherenceNarrative: 'Unable to fully analyze coherence',
      disconnects: [],
      recommendations: [],
    },
    uniqueValueProposition: {
      summary: 'Profile analysis incomplete',
      uniqueQualities: [],
      competitiveAdvantages: [],
      potentialConcerns: [],
      recommendedEmphasis: [],
    },
    contextImpact: {
      advantagesRecognized: [],
      challengesAcknowledged: [],
      adjustmentsApplied: [],
    },
    strengthsWeaknesses: {
      topStrengths: [],
      areasForImprovement: [],
      hiddenAssets: [],
      criticalGaps: [],
    },
    narrative: 'Holistic synthesis incomplete due to processing error.',
    inputDataHash: generateInputHash({ components, context, goals }),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generate minimal school fit analysis when component fails
 */
function createFallbackSchoolFit(goals: GoalsAspirations): SchoolFitOutput {
  return {
    detailedAssessments: {},
    categorizedList: {
      reach: [],
      target: [],
      likely: [],
      safety: [],
    },
    suggestions: {
      underexplored: [],
      betterFit: [],
      considerations: [],
    },
    strategyRecommendations: {
      listBalance: {
        currentBalance: { reach: 0, target: 0, likely: 0, safety: 0 },
        recommendedBalance: { reach: 3, target: 4, likely: 3, safety: 2 },
        assessment: 'Unable to assess school list balance',
        recommendations: ['Complete profile for school fit analysis'],
      },
      edEaStrategy: {
        recommendation: 'Consider early decision strategically',
        rationale: 'Unable to provide specific ED/EA strategy',
        topEDCandidates: [],
        eaRecommendations: [],
      },
      applicationPriority: [],
      deadlineStrategy: {
        priorityOrder: [],
        criticalDeadlines: [],
        recommendations: [],
      },
    },
    narrative: 'School fit analysis incomplete due to processing error.',
    inputDataHash: generateInputHash(goals),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generate minimal guidance report when component fails
 */
function createFallbackGuidance(goals: GoalsAspirations): GuidanceReport {
  return {
    summary: {
      totalActions: 0,
      criticalActions: 0,
      completedActions: 0,
      inProgressActions: 0,
      overallProgress: 0,
      topPriorities: [],
    },
    academicGuidance: {
      priorityLevel: 'medium',
      improvements: [],
      testingStrategy: {
        recommendation: 'Consult with counselor',
        rationale: 'Unable to provide specific testing strategy',
        recommendations: [],
      },
    },
    activitiesGuidance: {
      priorityLevel: 'medium',
      deepenRecommendations: [],
      addRecommendations: [],
      spikeBuilding: {
        hasSpikeOpportunity: false,
        recommendations: [],
      },
    },
    awardsGuidance: {
      priorityLevel: 'medium',
      pursuableAwards: [],
      applicationStrategies: [],
    },
    essayGuidance: {
      priorityLevel: 'high',
      topicRecommendations: [],
      approachGuidance: [],
      commonPitfalls: [],
    },
    schoolListGuidance: {
      priorityLevel: 'medium',
      listAdjustments: [],
      researchRecommendations: [],
    },
    milestones: [],
    applicationCalendar: [],
    progressTracking: {
      currentPhase: 'planning',
      phaseProgress: 0,
      overallReadiness: 0,
      keyMetrics: {},
      recentProgress: [],
    },
    narrative: 'Guidance generation incomplete due to processing error.',
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// PORTFOLIO STRATEGY ORCHESTRATOR CLASS
// ============================================================================

export class PortfolioStrategyOrchestrator {
  private academicEvaluator: AcademicEvaluator;
  private activityAnalyzer: ActivityAnalyzer;
  private awardEvaluator: AwardEvaluator;
  private holisticSynthesizer: HolisticSynthesizer;
  private schoolFitEngine: SchoolFitEngine;
  private guidanceEngine: GuidanceEngine;

  constructor() {
    // Initialize all component engines
    this.academicEvaluator = new AcademicEvaluator();
    this.activityAnalyzer = new ActivityAnalyzer();
    this.awardEvaluator = new AwardEvaluator();
    this.holisticSynthesizer = new HolisticSynthesizer();
    this.schoolFitEngine = new SchoolFitEngine();
    this.guidanceEngine = new GuidanceEngine();
  }

  // ==========================================================================
  // MAIN ANALYSIS ENTRY POINT
  // ==========================================================================

  /**
   * Execute complete portfolio strategy analysis
   *
   * This is the main entry point for the PASS system.
   * Takes complete student profile and returns comprehensive analysis.
   */
  async analyze(
    profile: StudentProfileInput,
    config?: Partial<AnalysisRequestConfig>
  ): Promise<PortfolioStrategyAnalysis> {
    // Build effective config
    const effectiveConfig: AnalysisRequestConfig = {
      userId: profile.userId,
      targetSchools: config?.targetSchools,
      forceRefresh: config?.forceRefresh ?? false,
      analysisDepth: config?.analysisDepth ?? DEFAULT_ANALYSIS_DEPTH,
      skipComponents: config?.skipComponents ?? [],
    };

    // Check cache unless force refresh
    if (!effectiveConfig.forceRefresh) {
      const cached = this.checkCache(profile, effectiveConfig);
      if (cached) {
        console.log('[Orchestrator] Returning cached analysis');
        return cached;
      }
    }

    // Initialize pipeline state
    const state: PipelineState = {
      input: profile,
      config: effectiveConfig,
      metrics: createMetricsTracker(),
      components: {
        academic: null,
        activities: null,
        awards: null,
      },
      synthesis: null,
      schoolFit: null,
      guidance: null,
    };

    try {
      // Stage 1: Component evaluations (parallel)
      await this.executeComponentEvaluations(state);

      // Stage 2: Holistic synthesis
      await this.executeHolisticSynthesis(state);

      // Stage 3: School fit analysis
      await this.executeSchoolFitAnalysis(state);

      // Stage 4: Guidance generation
      await this.executeGuidanceGeneration(state);

      // Assemble final result
      const result = this.assembleResult(state);

      // Cache result
      this.cacheResult(profile, effectiveConfig, result);

      return result;
    } catch (error) {
      console.error('[Orchestrator] Pipeline failed:', error);
      // Return partial result with available data
      return this.assemblePartialResult(state, error);
    }
  }

  // ==========================================================================
  // STAGE 1: COMPONENT EVALUATIONS (PARALLEL)
  // ==========================================================================

  private async executeComponentEvaluations(state: PipelineState): Promise<void> {
    const { input, config, metrics } = state;
    const skip = config.skipComponents || [];

    console.log('[Orchestrator] Stage 1: Component evaluations');

    // Build parallel execution promises
    const promises: Promise<void>[] = [];

    // Academic evaluation
    if (!skip.includes('academic')) {
      promises.push(
        this.evaluateAcademic(input.academic, config.targetSchools, metrics)
          .then(result => { state.components.academic = result; })
          .catch(error => {
            metrics.errors.push({ component: 'academic', error: String(error) });
            state.components.academic = createFallbackAcademicEvaluation(input.academic);
          })
      );
    }

    // Activity analysis
    if (!skip.includes('activities')) {
      promises.push(
        this.analyzeActivities(input.activities, metrics)
          .then(result => { state.components.activities = result; })
          .catch(error => {
            metrics.errors.push({ component: 'activities', error: String(error) });
            state.components.activities = createFallbackActivityAnalysis(input.activities);
          })
      );
    }

    // Award evaluation
    if (!skip.includes('awards')) {
      promises.push(
        this.evaluateAwards(input.awards, metrics)
          .then(result => { state.components.awards = result; })
          .catch(error => {
            metrics.errors.push({ component: 'awards', error: String(error) });
            state.components.awards = createFallbackAwardEvaluation(input.awards);
          })
      );
    }

    // Execute all in parallel
    await Promise.all(promises);

    console.log(`[Orchestrator] Stage 1 complete. Errors: ${metrics.errors.length}`);
  }

  private async evaluateAcademic(
    input: AcademicInputData,
    targetSchools: string[] | undefined,
    metrics: AnalysisMetrics
  ): Promise<AcademicEvaluation> {
    const startTime = Date.now();
    console.log('[Orchestrator] Evaluating academic profile...');

    const result = await this.academicEvaluator.evaluate(input, targetSchools);

    metrics.componentTimes['academic'] = Date.now() - startTime;
    console.log(`[Orchestrator] Academic evaluation complete (${metrics.componentTimes['academic']}ms)`);

    return result;
  }

  private async analyzeActivities(
    input: ActivitiesInputData,
    metrics: AnalysisMetrics
  ): Promise<ActivityPortfolioAnalysis> {
    const startTime = Date.now();
    console.log('[Orchestrator] Analyzing activities...');

    const result = await this.activityAnalyzer.analyze(input);

    metrics.componentTimes['activities'] = Date.now() - startTime;
    console.log(`[Orchestrator] Activity analysis complete (${metrics.componentTimes['activities']}ms)`);

    return result;
  }

  private async evaluateAwards(
    input: AwardsInputData,
    metrics: AnalysisMetrics
  ): Promise<AwardEvaluation> {
    const startTime = Date.now();
    console.log('[Orchestrator] Evaluating awards...');

    const result = await this.awardEvaluator.evaluate(input);

    metrics.componentTimes['awards'] = Date.now() - startTime;
    console.log(`[Orchestrator] Award evaluation complete (${metrics.componentTimes['awards']}ms)`);

    return result;
  }

  // ==========================================================================
  // STAGE 2: HOLISTIC SYNTHESIS
  // ==========================================================================

  private async executeHolisticSynthesis(state: PipelineState): Promise<void> {
    const { input, config, metrics, components } = state;

    if (config.skipComponents?.includes('synthesis')) {
      console.log('[Orchestrator] Stage 2: Skipped (synthesis)');
      return;
    }

    console.log('[Orchestrator] Stage 2: Holistic synthesis');
    const startTime = Date.now();

    try {
      // Ensure we have component results (use fallbacks if needed)
      const academic = components.academic || createFallbackAcademicEvaluation(input.academic);
      const activities = components.activities || createFallbackActivityAnalysis(input.activities);
      const awards = components.awards || createFallbackAwardEvaluation(input.awards);

      state.synthesis = await this.holisticSynthesizer.synthesize(
        academic,
        activities,
        awards,
        input.personalContext,
        input.goals,
        input.essayQuality
      );

      metrics.componentTimes['synthesis'] = Date.now() - startTime;
      console.log(`[Orchestrator] Synthesis complete (${metrics.componentTimes['synthesis']}ms)`);
    } catch (error) {
      metrics.errors.push({ component: 'synthesis', error: String(error) });
      state.synthesis = createFallbackSynthesis(
        components,
        input.personalContext,
        input.goals
      );
      console.error('[Orchestrator] Synthesis failed, using fallback:', error);
    }
  }

  // ==========================================================================
  // STAGE 3: SCHOOL FIT ANALYSIS
  // ==========================================================================

  private async executeSchoolFitAnalysis(state: PipelineState): Promise<void> {
    const { input, config, metrics, synthesis } = state;

    if (config.skipComponents?.includes('schoolFit')) {
      console.log('[Orchestrator] Stage 3: Skipped (schoolFit)');
      return;
    }

    console.log('[Orchestrator] Stage 3: School fit analysis');
    const startTime = Date.now();

    try {
      // Ensure we have synthesis (use fallback if needed)
      const effectiveSynthesis = synthesis || createFallbackSynthesis(
        state.components,
        input.personalContext,
        input.goals
      );

      state.schoolFit = await this.schoolFitEngine.analyze(
        effectiveSynthesis,
        input.goals,
        config.targetSchools
      );

      metrics.componentTimes['schoolFit'] = Date.now() - startTime;
      console.log(`[Orchestrator] School fit analysis complete (${metrics.componentTimes['schoolFit']}ms)`);
    } catch (error) {
      metrics.errors.push({ component: 'schoolFit', error: String(error) });
      state.schoolFit = createFallbackSchoolFit(input.goals);
      console.error('[Orchestrator] School fit failed, using fallback:', error);
    }
  }

  // ==========================================================================
  // STAGE 4: GUIDANCE GENERATION
  // ==========================================================================

  private async executeGuidanceGeneration(state: PipelineState): Promise<void> {
    const { input, config, metrics, synthesis, schoolFit } = state;

    if (config.skipComponents?.includes('guidance')) {
      console.log('[Orchestrator] Stage 4: Skipped (guidance)');
      return;
    }

    console.log('[Orchestrator] Stage 4: Guidance generation');
    const startTime = Date.now();

    try {
      // Ensure we have dependencies (use fallbacks if needed)
      const effectiveSynthesis = synthesis || createFallbackSynthesis(
        state.components,
        input.personalContext,
        input.goals
      );
      const effectiveSchoolFit = schoolFit || createFallbackSchoolFit(input.goals);

      state.guidance = await this.guidanceEngine.generateGuidance(
        effectiveSynthesis,
        effectiveSchoolFit,
        input.goals
      );

      metrics.componentTimes['guidance'] = Date.now() - startTime;
      console.log(`[Orchestrator] Guidance generation complete (${metrics.componentTimes['guidance']}ms)`);
    } catch (error) {
      metrics.errors.push({ component: 'guidance', error: String(error) });
      state.guidance = createFallbackGuidance(input.goals);
      console.error('[Orchestrator] Guidance generation failed, using fallback:', error);
    }
  }

  // ==========================================================================
  // RESULT ASSEMBLY
  // ==========================================================================

  private assembleResult(state: PipelineState): PortfolioStrategyAnalysis {
    const { input, metrics, components, synthesis, schoolFit, guidance } = state;
    const totalTime = Date.now() - metrics.startTime;

    // Generate input hash for cache invalidation
    const inputDataHash = generateInputHash(input);

    return {
      // Metadata
      analyzedAt: new Date().toISOString(),
      version: SYSTEM_VERSION,
      userId: input.userId,

      // Component evaluations
      academic: components.academic || createFallbackAcademicEvaluation(input.academic),
      activities: components.activities || createFallbackActivityAnalysis(input.activities),
      awards: components.awards || createFallbackAwardEvaluation(input.awards),

      // Synthesis
      holistic: synthesis || createFallbackSynthesis(components, input.personalContext, input.goals),

      // Strategy
      schoolFit: schoolFit || createFallbackSchoolFit(input.goals),

      // Guidance
      guidance: guidance || createFallbackGuidance(input.goals),

      // Cache key
      inputDataHash,

      // Analysis metadata
      analysisMetadata: {
        totalCostCents: metrics.totalCostCents,
        modelUsed: metrics.modelUsed,
        tokensUsed: metrics.tokensUsed,
        analysisTimeMs: totalTime,
      },
    };
  }

  private assemblePartialResult(
    state: PipelineState,
    error: unknown
  ): PortfolioStrategyAnalysis {
    console.warn('[Orchestrator] Assembling partial result due to error:', error);
    return this.assembleResult(state);
  }

  // ==========================================================================
  // CACHING
  // ==========================================================================

  private checkCache(
    profile: StudentProfileInput,
    config: AnalysisRequestConfig
  ): PortfolioStrategyAnalysis | null {
    const { key } = generateHashedCacheKey('portfolio', 'analysis', {
      userId: profile.userId,
      academic: profile.academic,
      activities: profile.activities,
      awards: profile.awards,
      goals: profile.goals,
      targetSchools: config.targetSchools,
    });

    const cached = portfolioAnalysisCache.get(key);
    if (cached) {
      console.log('[Orchestrator] Cache hit for portfolio analysis');
      return cached as PortfolioStrategyAnalysis;
    }

    return null;
  }

  private cacheResult(
    profile: StudentProfileInput,
    config: AnalysisRequestConfig,
    result: PortfolioStrategyAnalysis
  ): void {
    const { key } = generateHashedCacheKey('portfolio', 'analysis', {
      userId: profile.userId,
      academic: profile.academic,
      activities: profile.activities,
      awards: profile.awards,
      goals: profile.goals,
      targetSchools: config.targetSchools,
    });

    portfolioAnalysisCache.set(key, result);
    console.log('[Orchestrator] Cached portfolio analysis');
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Invalidate all cached analysis for a user
   */
  invalidateUserCache(userId: string): void {
    CacheUtils.invalidateByPrefix(`portfolio_analysis_${userId}`);
    console.log(`[Orchestrator] Invalidated cache for user: ${userId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const stats = portfolioAnalysisCache.stats();
    return {
      size: stats.size,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    };
  }

  /**
   * Clear all caches (for testing or maintenance)
   */
  clearAllCaches(): void {
    portfolioAnalysisCache.clear();
    console.log('[Orchestrator] Cleared all caches');
  }

  // ==========================================================================
  // PARTIAL ANALYSIS METHODS
  // ==========================================================================

  /**
   * Run only academic evaluation
   */
  async analyzeAcademicOnly(
    academic: AcademicInputData,
    targetSchools?: string[]
  ): Promise<AcademicEvaluation> {
    return this.academicEvaluator.evaluate(academic, targetSchools);
  }

  /**
   * Run only activity analysis
   */
  async analyzeActivitiesOnly(
    activities: ActivitiesInputData
  ): Promise<ActivityPortfolioAnalysis> {
    return this.activityAnalyzer.analyze(activities);
  }

  /**
   * Run only award evaluation
   */
  async analyzeAwardsOnly(
    awards: AwardsInputData
  ): Promise<AwardEvaluation> {
    return this.awardEvaluator.evaluate(awards);
  }

  /**
   * Get quick profile summary without full analysis
   * Useful for dashboard displays or progress tracking
   */
  async getQuickSummary(profile: StudentProfileInput): Promise<{
    academicTier: string;
    activitiesTier: string;
    awardsTier: string;
    estimatedProfileTier: string;
    confidence: number;
  }> {
    // Run component evaluations in parallel
    const [academic, activities, awards] = await Promise.all([
      this.academicEvaluator.evaluate(profile.academic),
      this.activityAnalyzer.analyze(profile.activities),
      this.awardEvaluator.evaluate(profile.awards),
    ]);

    // Quick tier estimation
    const scores = [
      academic.overallScore * 0.35,
      activities.overallScore * 0.35,
      awards.overallScore * 0.15,
    ];
    const avgScore = scores.reduce((a, b) => a + b, 0) / 0.85; // Normalize to 100

    let estimatedTier: string;
    if (avgScore >= 85) estimatedTier = 'exceptional';
    else if (avgScore >= 70) estimatedTier = 'highly_competitive';
    else if (avgScore >= 55) estimatedTier = 'competitive';
    else if (avgScore >= 40) estimatedTier = 'developing';
    else estimatedTier = 'building';

    return {
      academicTier: academic.overallTier,
      activitiesTier: activities.overallTier,
      awardsTier: awards.overallTier,
      estimatedProfileTier: estimatedTier,
      confidence: Math.min(academic.confidence, activities.confidence, awards.confidence),
    };
  }

  /**
   * Refresh specific component without full re-analysis
   */
  async refreshComponent(
    profile: StudentProfileInput,
    component: 'academic' | 'activities' | 'awards'
  ): Promise<AcademicEvaluation | ActivityPortfolioAnalysis | AwardEvaluation> {
    switch (component) {
      case 'academic':
        return this.academicEvaluator.evaluate(profile.academic);
      case 'activities':
        return this.activityAnalyzer.analyze(profile.activities);
      case 'awards':
        return this.awardEvaluator.evaluate(profile.awards);
      default:
        throw new Error(`Unknown component: ${component}`);
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const portfolioOrchestrator = new PortfolioStrategyOrchestrator();
