/**
 * Activity Workshop Service (Orchestrator) - v4.2 PIPELINE
 *
 * PARALLEL PROCESSING PIPELINE
 *
 * ARCHITECTURE EVOLUTION:
 * ======================
 * v1.0 - Per-activity analysis: $1.60-2.40 for 10 activities
 * v2.0 - Batch processing: $0.35-0.55 (75-80% reduction)
 * v3.0 - Research-Backed Profiler integration
 * v4.0 - 4-STAGE PIPELINE with story context & conditional teaching
 * v4.1 - Holistic narrative at beginning AND end
 * v4.2 - PARALLEL sub-batch analysis + parallel individual teaching
 *
 * v4.2 PIPELINE:
 * ==============
 *
 * Stage 0: Story Detection (Haiku, ~$0.005)
 *   - Quick archetype classification
 *
 * Stage 1: Parallel Analysis (~45s wall clock)
 *   - Profiler on ALL activities (instant, heuristic)
 *   - Parallel LLM sub-batches of 2 (Sonnet)
 *   - Merge + story-enriched adjustments + teaching candidate selection
 *
 * Stage 2: Parallel Individual Teaching (~120s wall clock)
 *   - Each activity: individual LLM call in parallel
 *   - Quick encouragements + portfolio teaching
 *
 * Stage 3: Portfolio Synthesis (Haiku, ~$0.005)
 *   - Final Harvard 1-6 assessment
 *
 * Final Narrative (Sonnet, ~$0.07)
 *   - Single narrative pass at end of pipeline
 *
 * TOTAL COST: ~$0.35-0.40, TIME: ~5 min (was ~29 min in v4.1)
 */

import { v4 as uuidv4 } from 'uuid';

import {
  ActivityWorkshopSessionInput,
  ActivityWorkshopResult,
  ActivityWorkshopSession,
  ActivityWorkshopPipelineResult,
  PortfolioAnalysis,
  PortfolioTeaching,
  IActivityWorkshopService,
  StoryContext,
  AnalysisContext,
  TeachingContext,
  SynthesisContext,
  PortfolioNarrative,
} from './types';

// Import 4-stage pipeline services
import {
  stage0StoryDetectionService,
  stage1ContextAwareAnalysisService,
  stage2ConditionalTeachingService,
  stage3PortfolioSynthesisService,
} from './stages';

// Import holistic portfolio narrative service (v4.1)
import { portfolioNarrativeService } from './stages/portfolioNarrativeService';

// Legacy batch services (for v3.0 compatibility/fallback)
import { batchActivityAnalysisService } from './batchActivityAnalysisService';
import { batchActivityTeachingService } from './batchActivityTeachingService';

// ============================================================================
// CONSTANTS
// ============================================================================

const VERSION = '4.2.0'; // v4.2: Parallel sub-batch analysis + parallel individual teaching

// Feature flags
const USE_4_STAGE_PIPELINE = true; // Set to false to use v3.0 batch services

// Simple in-memory session storage
const sessionStorage = new Map<string, ActivityWorkshopSession>();

// ============================================================================
// COST ESTIMATION (v4.0)
// ============================================================================

interface CostTracking {
  analysisCost: number;
  teachingCost: number;
  totalCost: number;
  tokensUsed: {
    analysis: { input: number; output: number };
    teaching: { input: number; output: number };
  };
}

function estimatePipelineCost(numActivities: number): {
  stage0: number;
  stage1: number;
  stage2: number;
  stage3: number;
  total: number;
} {
  // Stage 0: Haiku - ~1500 input, ~800 output
  const stage0 = (1500 / 1_000_000) * 0.25 + (800 / 1_000_000) * 1.25;

  // Stage 1: Sonnet batch - same as v3.0 analysis
  const stage1BaseInput = 4000 + numActivities * 600;
  const stage1BaseOutput = 3000 + numActivities * 500;
  const stage1 = (stage1BaseInput / 1_000_000) * 3 + (stage1BaseOutput / 1_000_000) * 15;

  // Stage 2: Sonnet conditional - only ~5 activities deep + quick for rest
  const deepTeachingCount = Math.min(5, numActivities);
  const quickCount = numActivities - deepTeachingCount;
  const stage2Input = 4000 + deepTeachingCount * 800 + quickCount * 200;
  const stage2Output = 3000 + deepTeachingCount * 700 + quickCount * 150;
  const stage2 = (stage2Input / 1_000_000) * 3 + (stage2Output / 1_000_000) * 15;

  // Stage 3: Haiku synthesis - ~2000 input, ~1500 output
  const stage3 = (2000 / 1_000_000) * 0.25 + (1500 / 1_000_000) * 1.25;

  return {
    stage0,
    stage1,
    stage2,
    stage3,
    total: stage0 + stage1 + stage2 + stage3,
  };
}

function createCostTracking(numActivities: number): CostTracking {
  const pipelineCost = estimatePipelineCost(numActivities);

  return {
    analysisCost: pipelineCost.stage0 + pipelineCost.stage1,
    teachingCost: pipelineCost.stage2 + pipelineCost.stage3,
    totalCost: pipelineCost.total,
    tokensUsed: {
      analysis: {
        input: 4000 + numActivities * 600,
        output: 3000 + numActivities * 500,
      },
      teaching: {
        input: 4000 + Math.min(5, numActivities) * 800,
        output: 3000 + Math.min(5, numActivities) * 700,
      },
    },
  };
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateInput(input: ActivityWorkshopSessionInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.activities || input.activities.length === 0) {
    errors.push('At least one activity is required');
    return { isValid: false, errors, warnings };
  }

  for (const activity of input.activities) {
    if (!activity.id) {
      errors.push(`Activity missing ID`);
    }
    if (!activity.title || activity.title.trim().length === 0) {
      errors.push(`Activity ${activity.id}: Title is required`);
    }
    if (!activity.description || activity.description.trim().length === 0) {
      errors.push(`Activity ${activity.id}: Description is required`);
    }
    if (activity.description && activity.description.length < 10) {
      warnings.push(`Activity ${activity.id}: Description is very short`);
    }
    if (activity.hoursPerWeek && activity.hoursPerWeek > 40) {
      warnings.push(`Activity ${activity.id}: ${activity.hoursPerWeek} hours/week is unusually high`);
    }
  }

  const ids = input.activities.map((a) => a.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate activity IDs detected');
  }

  if (input.activities.length > 15) {
    warnings.push('More than 15 activities provided; Common App allows only 10');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// LEGACY TYPE CONVERSION (v4.0 → v3.0 compatibility)
// ============================================================================

/**
 * Convert AnalysisContext to legacy PortfolioAnalysis
 */
function convertToLegacyAnalysis(analysisContext: AnalysisContext): PortfolioAnalysis {
  // AnalysisContext extends PortfolioAnalysis, so just return it
  // The extra fields won't hurt legacy consumers
  return analysisContext;
}

/**
 * Convert TeachingContext to legacy PortfolioTeaching
 */
function convertToLegacyTeaching(
  teachingContext: TeachingContext,
  storyContext: StoryContext,
  analysisContext: AnalysisContext
): PortfolioTeaching {
  // Build activities map from teaching delivered
  const activities: PortfolioTeaching['activities'] = {};

  for (const td of teachingContext.teachingDelivered) {
    activities[td.activityId] = td.teaching;
  }

  // Also add fallback teaching for quick encouragements
  for (const qe of teachingContext.quickEncouragements) {
    activities[qe.activityId] = {
      activityId: qe.activityId,
      tierExplanation: {
        assignedTier: analysisContext.activities[qe.activityId]?.classification?.tier || 2,
        explanation: { text: qe.strengthReason, citations: [] },
        benchmarksUsed: [],
        whatMakesThisTier: { text: qe.celebration, citations: [] },
        whatWouldChangeIt: { text: qe.quickTip || 'Already strong!', citations: [] },
      },
      strengthTeaching: [
        {
          strength: 'Already strong activity',
          whyItMatters: { text: qe.strengthReason, citations: [] },
          howToLeverage: 'Continue with current approach',
          inApplications: 'Highlight in essays and interviews',
        },
      ],
      improvementTeaching: qe.quickTip
        ? [
            {
              issue: 'Minor enhancement opportunity',
              whyItMatters: { text: 'Could make a good activity even better', citations: [] },
              howToFix: qe.quickTip,
              exampleBefore: '',
              exampleAfter: '',
              priority: 'low',
            },
          ]
        : [],
      descriptionOptimization: {
        originalDescription: '',
        optimizedDescription: '',
        characterCount: 0,
        changesExplained: [],
      },
      narrativeGuidance: {
        howToTalkAboutThis: { text: qe.celebration, citations: [] },
        uniqueAngle: 'Strong authentic engagement',
        connectionToStory: `Connects to your ${storyContext.narrativeIdentity.primaryTheme} narrative`,
        interviewTips: ['Be ready to discuss your genuine passion'],
      },
    };
  }

  return {
    activities,
    narrativeTeaching: {
      twoSentencePitch: teachingContext.portfolioTeaching.narrativeTeaching.twoSentencePitch,
      extendedPitch: teachingContext.portfolioTeaching.narrativeTeaching.currentState,
      archetype: storyContext.narrativeIdentity.archetype,
      archetypeExplanation: { text: storyContext.narrativeIdentity.storyEssence, citations: [] },
      howToPresent: { text: teachingContext.portfolioTeaching.narrativeTeaching.recommendation, citations: [] },
      narrativeStrengths: analysisContext.portfolioTeachingNeeds.strengthsToHighlight,
      narrativeWeaknesses: analysisContext.portfolioTeachingNeeds.secondaryIssues,
    },
    spikeTeaching: {
      currentState: {
        text: analysisContext.spikeAnalysis.hasSpike
          ? `You have a developing spike in ${analysisContext.spikeAnalysis.spikeType}`
          : 'No clear spike detected yet',
        citations: [],
      },
      whatMakesASpike: {
        text: 'A spike shows depth: progression, leadership, and recognition in one area',
        citations: [],
      },
      studentSpikeAssessment: {
        text: storyContext.spikeHypothesis.evidence,
        citations: [],
      },
      developmentStrategy: analysisContext.spikeAnalysis.hasSpike
        ? undefined
        : {
            strategy: 'Focus on deepening your strongest area',
            focusActivities: storyContext.spikeHypothesis.spikeActivityIds,
            deprioritizeActivities: [],
            newOpportunities: [],
            timeline: '6-12 months',
            rationale: { text: teachingContext.portfolioTeaching.strategicDirection, citations: [] },
          },
    },
    coherenceTeaching: {
      currentCoherence: {
        text: `Score: ${teachingContext.portfolioTeaching.coherenceTeaching.currentScore}/100`,
        citations: [],
      },
      whatMakesCoherence: {
        text: 'Activities should connect through a clear narrative thread',
        citations: [],
      },
      connectingActivities: [],
      addressingDisconnects: analysisContext.coherenceAnalysis.disconnectedActivities.map(d => ({
        activityId: d.activityId,
        issue: d.reason,
        solutions: teachingContext.portfolioTeaching.coherenceTeaching.improvements,
        recommendation: 'Connect to your main narrative',
      })),
      strengtheningStrategies: teachingContext.portfolioTeaching.coherenceTeaching.improvements.map(i => ({
        text: i,
        citations: [],
      })),
    },
    commonAppStrategy: {
      recommendedOrder: analysisContext.commonAppReadiness?.orderingRecommendation || [],
      orderRationale: { text: 'Ordered by tier and impact', citations: [] },
      whatToHighlight: [],
      whatToMinimize: [],
      overallPositioning: { text: teachingContext.portfolioTeaching.strategicDirection, citations: [] },
      characterCountStrategy: 'Maximize impact within 150 characters',
    },
    gapFillingGuidance: analysisContext.gapsIdentified.map(g => ({
      gap: g.gap,
      severity: g.severity,
      solutions: [{ solution: 'Address this gap strategically', feasibility: 'medium', timeRequired: '3-6 months', impact: g.impactOnApplication }],
      recommendedApproach: { text: g.impactOnApplication, citations: [] },
    })),
    strategicRecommendations: {
      immediate: analysisContext.portfolioTeachingNeeds.strengthsToHighlight.map(s => ({ text: s, citations: [] })),
      shortTerm: [],
      longTerm: [],
      activitiesToStop: [],
      activitiesToDeepen: [],
      newActivitiesToConsider: [],
    },
  };
}

// ============================================================================
// ACTIVITY WORKSHOP SERVICE CLASS (v4.0)
// ============================================================================

export class ActivityWorkshopService implements IActivityWorkshopService {
  /**
   * Run full v4.2 pipeline with parallel processing
   *
   * STAGE 0: Story Detection (Haiku)
   * STAGE 1: Parallel Analysis (Sonnet sub-batches of 2)
   * STAGE 2: Parallel Individual Teaching (Sonnet)
   * STAGE 3: Portfolio Synthesis (Haiku)
   * FINAL NARRATIVE (Sonnet — single pass)
   */
  async runPipeline(input: ActivityWorkshopSessionInput): Promise<ActivityWorkshopPipelineResult> {
    const sessionId = uuidv4();
    const startTime = Date.now();

    console.log(`\n[ActivityWorkshop v4.2] ══════════════════════════════════════`);
    console.log(`[ActivityWorkshop v4.2] Starting PARALLEL PIPELINE`);
    console.log(`[ActivityWorkshop v4.2] Session: ${sessionId}`);
    console.log(`[ActivityWorkshop v4.2] Activities: ${input.activities.length}`);
    console.log(`[ActivityWorkshop v4.2] ══════════════════════════════════════\n`);

    // Validate input
    const validation = validateInput(input);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`[ActivityWorkshop v4.2] Warnings: ${validation.warnings.join(', ')}`);
    }

    // ========================================================================
    // STAGE 0: STORY DETECTION (Haiku, ~$0.005)
    // ========================================================================
    console.log(`[Stage 0] ─────────────────────────────────────────`);
    console.log(`[Stage 0] STORY DETECTION`);
    console.log(`[Stage 0] ─────────────────────────────────────────`);

    const stage0StartTime = Date.now();
    const storyContext = await stage0StoryDetectionService.detectStory(input);

    console.log(`[Stage 0] Complete in ${Date.now() - stage0StartTime}ms`);
    console.log(`[Stage 0] Archetype: ${storyContext.narrativeIdentity.archetype}`);
    console.log(`[Stage 0] Story: ${storyContext.narrativeIdentity.storyEssence.substring(0, 80)}...`);
    console.log(`[Stage 0] Spike Hypothesis: ${storyContext.spikeHypothesis.likelySpike ? storyContext.spikeHypothesis.spikeArea : 'None'}\n`);

    // ========================================================================
    // STAGE 1: PARALLEL ANALYSIS (Sonnet sub-batches of 2)
    // ========================================================================
    console.log(`[Stage 1] ─────────────────────────────────────────`);
    console.log(`[Stage 1] PARALLEL CONTEXT-AWARE ANALYSIS`);
    console.log(`[Stage 1] ─────────────────────────────────────────`);

    const stage1StartTime = Date.now();
    const analysisContext = await stage1ContextAwareAnalysisService.analyze(input, storyContext);

    console.log(`[Stage 1] Complete in ${Date.now() - stage1StartTime}ms`);
    console.log(`[Stage 1] Tier Distribution: T1=${analysisContext.tierDistribution.tier1}, T2=${analysisContext.tierDistribution.tier2}, T3=${analysisContext.tierDistribution.tier3}, T4=${analysisContext.tierDistribution.tier4}`);
    console.log(`[Stage 1] Teaching Candidates: ${analysisContext.teachingCandidates.deepTeachingIds.length} deep, ${analysisContext.teachingCandidates.mediumTeachingIds.length} medium`);
    console.log(`[Stage 1] Primary Need: ${analysisContext.portfolioTeachingNeeds.primaryIssue}\n`);

    // ========================================================================
    // STAGE 2: PARALLEL INDIVIDUAL TEACHING (Sonnet)
    // ========================================================================
    console.log(`[Stage 2] ─────────────────────────────────────────`);
    console.log(`[Stage 2] PARALLEL INDIVIDUAL TEACHING`);
    console.log(`[Stage 2] ─────────────────────────────────────────`);

    const stage2StartTime = Date.now();
    const teachingContext = await stage2ConditionalTeachingService.teach(input, storyContext, analysisContext);

    console.log(`[Stage 2] Complete in ${Date.now() - stage2StartTime}ms`);
    console.log(`[Stage 2] Taught: ${teachingContext.teachingDelivered.length} activities`);
    console.log(`[Stage 2] Quick Encouragements: ${teachingContext.quickEncouragements.length}`);
    console.log(`[Stage 2] Skipped: ${teachingContext.skippedActivities.length}\n`);

    // ========================================================================
    // STAGE 3: PORTFOLIO SYNTHESIS (Haiku, ~$0.005)
    // ========================================================================
    console.log(`[Stage 3] ─────────────────────────────────────────`);
    console.log(`[Stage 3] PORTFOLIO SYNTHESIS (Actionable Strategy)`);
    console.log(`[Stage 3] ─────────────────────────────────────────`);

    const stage3StartTime = Date.now();
    const synthesisContext = await stage3PortfolioSynthesisService.synthesize(
      input,
      storyContext,
      analysisContext,
      teachingContext
    );

    console.log(`[Stage 3] Complete in ${Date.now() - stage3StartTime}ms`);
    console.log(`[Stage 3] Harvard Scale: ${synthesisContext.finalAssessment.harvardScale}/6`);
    console.log(`[Stage 3] Overall Strength: ${synthesisContext.finalAssessment.overallStrength}\n`);

    // ========================================================================
    // FINAL NARRATIVE (Sonnet, ~$0.07 — single pass at end)
    // ========================================================================
    console.log(`[Narrative] ─────────────────────────────────────────`);
    console.log(`[Narrative] PORTFOLIO NARRATIVE (Final Analysis)`);
    console.log(`[Narrative] ─────────────────────────────────────────`);

    const narrativeStartTime = Date.now();
    let finalNarrative: PortfolioNarrative | undefined;

    try {
      // Call analyzeImprovedNarrative with analysis context for richer narrative.
      // No cached initial exists, so it returns a plain PortfolioNarrative.
      const narrativeResult = await portfolioNarrativeService.analyzeImprovedNarrative(
        input,
        sessionId,
        analysisContext
      );
      finalNarrative = narrativeResult as PortfolioNarrative;
      console.log(`[Narrative] Complete in ${Date.now() - narrativeStartTime}ms`);
      console.log(`[Narrative] Story: ${finalNarrative.story.pitch.substring(0, 100)}...`);
      console.log(`[Narrative] Coherence: ${finalNarrative.coherence.assessment} (${finalNarrative.coherence.score}/100)`);
    } catch (error) {
      console.error(`[Narrative] Final analysis failed:`, error);
      finalNarrative = undefined;
    }

    // ========================================================================
    // PIPELINE COMPLETE
    // ========================================================================
    const totalTime = Date.now() - startTime;

    // Calculate total cost
    const narrativeCost = finalNarrative?.metadata.cost || 0;
    const totalCost = synthesisContext.pipelineCost.total + narrativeCost;

    console.log(`\n[ActivityWorkshop v4.2] ══════════════════════════════════════`);
    console.log(`[ActivityWorkshop v4.2] PIPELINE COMPLETE`);
    console.log(`[ActivityWorkshop v4.2] Total time: ${totalTime}ms`);
    console.log(`[ActivityWorkshop v4.2] Total cost: $${totalCost.toFixed(4)}`);
    console.log(`[ActivityWorkshop v4.2] ──────────────────────────────────────`);
    console.log(`[ActivityWorkshop v4.2] NARRATIVE SUMMARY:`);
    console.log(`[ActivityWorkshop v4.2]   Story: ${finalNarrative?.story.pitch.substring(0, 80) || 'N/A'}...`);
    console.log(`[ActivityWorkshop v4.2]   Coherence: ${finalNarrative?.coherence.assessment || 'N/A'} (${finalNarrative?.coherence.score || 'N/A'}/100)`);
    console.log(`[ActivityWorkshop v4.2]   Spike: ${finalNarrative?.spike.primarySpike.area || 'Developing'}`);
    console.log(`[ActivityWorkshop v4.2] ══════════════════════════════════════\n`);

    // Convert to legacy formats for backward compatibility
    const legacyAnalysis = convertToLegacyAnalysis(analysisContext);
    const legacyTeaching = convertToLegacyTeaching(teachingContext, storyContext, analysisContext);

    return {
      sessionId,
      version: '4.2.0',
      completedAt: new Date().toISOString(),

      // Single narrative pass (v4.2)
      finalNarrative,

      // Stage outputs
      stage0: storyContext,
      stage1: analysisContext,
      stage2: teachingContext,
      stage3: synthesisContext,

      // Legacy compatibility
      analysis: legacyAnalysis,
      teaching: legacyTeaching,

      totalCost,
    };
  }

  /**
   * Analyze a complete portfolio (LEGACY COMPATIBLE ENTRY POINT)
   *
   * This maintains backward compatibility with v3.0 consumers.
   * Internally uses the 4-stage pipeline when USE_4_STAGE_PIPELINE is true.
   */
  async analyzePortfolio(input: ActivityWorkshopSessionInput): Promise<ActivityWorkshopResult> {
    const sessionId = uuidv4();

    console.log(`[ActivityWorkshop] Starting analysis for session ${sessionId}`);
    console.log(`[ActivityWorkshop] Mode: ${USE_4_STAGE_PIPELINE ? 'v4.0 (4-stage pipeline)' : 'v3.0 (batch)'}`);

    // Validate input
    const validation = validateInput(input);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    // Create session
    const session: ActivityWorkshopSession = {
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input,
      context: {
        analysisComplete: false,
        teachingComplete: false,
      },
    };
    sessionStorage.set(sessionId, session);

    try {
      if (USE_4_STAGE_PIPELINE) {
        // Run new 4-stage pipeline
        const pipelineResult = await this.runPipeline(input);

        // Update session
        session.analysis = pipelineResult.analysis;
        session.teaching = pipelineResult.teaching;
        session.context.analysisComplete = true;
        session.context.teachingComplete = true;
        session.updatedAt = new Date().toISOString();
        sessionStorage.set(sessionId, session);

        // Convert to legacy result format
        return {
          sessionId,
          analyzedAt: pipelineResult.completedAt,
          version: VERSION,
          analysis: pipelineResult.analysis,
          teaching: pipelineResult.teaching,
          costTracking: createCostTracking(input.activities.length),
        };
      } else {
        // Use v3.0 batch services (legacy fallback)
        const analysis = await batchActivityAnalysisService.analyzePortfolio(input);
        session.analysis = analysis;
        session.context.analysisComplete = true;

        const teaching = await batchActivityTeachingService.teachPortfolio(input, analysis);
        session.teaching = teaching;
        session.context.teachingComplete = true;

        session.updatedAt = new Date().toISOString();
        sessionStorage.set(sessionId, session);

        return {
          sessionId,
          analyzedAt: new Date().toISOString(),
          version: '3.0.0', // Legacy version
          analysis,
          teaching,
          costTracking: createCostTracking(input.activities.length),
        };
      }
    } catch (error) {
      session.context.lastError = error instanceof Error ? error.message : 'Unknown error';
      session.updatedAt = new Date().toISOString();
      sessionStorage.set(sessionId, session);

      console.error(`[ActivityWorkshop] Error in session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Run Stage 1 only (analysis without teaching)
   */
  async runAnalysis(input: ActivityWorkshopSessionInput): Promise<PortfolioAnalysis> {
    const validation = validateInput(input);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    if (USE_4_STAGE_PIPELINE) {
      // Run stages 0 and 1
      const storyContext = await stage0StoryDetectionService.detectStory(input);
      const analysisContext = await stage1ContextAwareAnalysisService.analyze(input, storyContext);
      return convertToLegacyAnalysis(analysisContext);
    } else {
      return batchActivityAnalysisService.analyzePortfolio(input);
    }
  }

  /**
   * Run teaching from existing analysis
   */
  async runTeaching(
    input: ActivityWorkshopSessionInput,
    analysis: PortfolioAnalysis
  ): Promise<PortfolioTeaching> {
    const validation = validateInput(input);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    if (USE_4_STAGE_PIPELINE) {
      // Need story context for teaching, so run stage 0
      const storyContext = await stage0StoryDetectionService.detectStory(input);

      // Create mock AnalysisContext from legacy analysis
      const analysisContext: AnalysisContext = {
        ...analysis,
        storyEnrichment: {
          storyContextUsed: false,
          storyInfluencedScores: [],
        },
        teachingCandidates: {
          deepTeachingIds: Object.keys(analysis.activities).filter(
            id => analysis.activities[id].classification.tier >= 3
          ),
          mediumTeachingIds: Object.keys(analysis.activities).filter(
            id => analysis.activities[id].classification.tier === 2
          ),
          quickEncouragementIds: Object.keys(analysis.activities).filter(
            id => analysis.activities[id].classification.tier === 1
          ),
          skipTeachingIds: [],
          selectionCriteria: { deepThreshold: 3, mediumThreshold: 2, skipThreshold: 1 },
        },
        teachingPriorities: [],
        portfolioTeachingNeeds: {
          primaryIssue: 'General optimization',
          primaryIssueSeverity: 'moderate',
          secondaryIssues: [],
          strengthsToHighlight: [],
          strategicGaps: [],
        },
        analysisMetadata: {
          generatedAt: new Date().toISOString(),
          modelUsed: 'legacy',
          tokensUsed: { input: 0, output: 0 },
          cost: 0,
          storyContextProvided: false,
        },
      };

      const teachingContext = await stage2ConditionalTeachingService.teach(
        input,
        storyContext,
        analysisContext
      );

      return convertToLegacyTeaching(teachingContext, storyContext, analysisContext);
    } else {
      return batchActivityTeachingService.teachPortfolio(input, analysis);
    }
  }

  /**
   * Legacy compatibility aliases
   */
  async analysisOnly(input: ActivityWorkshopSessionInput): Promise<PortfolioAnalysis> {
    return this.runAnalysis(input);
  }

  async teachingFromAnalysis(
    input: ActivityWorkshopSessionInput,
    analysis: PortfolioAnalysis
  ): Promise<PortfolioTeaching> {
    return this.runTeaching(input, analysis);
  }

  // Session management
  async getSession(sessionId: string): Promise<ActivityWorkshopSession | null> {
    return sessionStorage.get(sessionId) || null;
  }

  async updateSession(sessionId: string, updates: Partial<ActivityWorkshopSession>): Promise<void> {
    const session = sessionStorage.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    sessionStorage.set(sessionId, { ...session, ...updates, updatedAt: new Date().toISOString() });
  }

  async deleteSession(sessionId: string): Promise<void> {
    sessionStorage.delete(sessionId);
  }

  async listSessions(): Promise<string[]> {
    return Array.from(sessionStorage.keys());
  }

  /**
   * Get estimated cost for pipeline
   */
  getEstimatedCost(numActivities: number): {
    analysisCost: number;
    teachingCost: number;
    totalCost: number;
    breakdown: {
      stage0: number;
      stage1: number;
      stage2: number;
      stage3: number;
    };
  } {
    const estimate = estimatePipelineCost(numActivities);
    return {
      analysisCost: estimate.stage0 + estimate.stage1,
      teachingCost: estimate.stage2 + estimate.stage3,
      totalCost: estimate.total,
      breakdown: {
        stage0: estimate.stage0,
        stage1: estimate.stage1,
        stage2: estimate.stage2,
        stage3: estimate.stage3,
      },
    };
  }
}

// Export singleton instance
export const activityWorkshopService = new ActivityWorkshopService();
