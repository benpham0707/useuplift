// @ts-nocheck
/**
 * Stage 1: Context-Aware Analysis Service
 *
 * STORY-ENRICHED ANALYSIS (Builds on batch analysis with story context)
 *
 * PURPOSE:
 * ========
 * Takes the story context from Stage 0 and enriches the activity analysis.
 * The story provides crucial context that changes how we interpret activities:
 * - A "founder" who is actually a caretaker archetype should be evaluated differently
 * - Activities that form a spike should be analyzed as a cohesive unit
 * - Contextual factors (first-gen, work obligations) adjust tier expectations
 *
 * WHAT IT ADDS TO BATCH ANALYSIS:
 * ==============================
 * 1. Story-influenced tier adjustments (respecting context)
 * 2. Teaching candidate selection (which activities need teaching)
 * 3. Teaching priorities (what order to teach)
 * 4. Portfolio-level teaching needs identification
 *
 * MODEL: Sonnet for quality (nuanced analysis requires strong reasoning)
 * COST: ~$0.15-0.20 (same as batch, but with richer context)
 */

import { callClaude } from '@/lib/llm/claude';
import {
  ActivityWorkshopSessionInput,
  ActivityWorkshopInput,
  PortfolioAnalysis,
  ActivityAnalysis,
  StoryContext,
  AnalysisContext,
  ActivityTier,
} from '../types';

// Import the batch analysis service for sub-batch analysis + profiler
import { batchActivityAnalysisService } from '../batchActivityAnalysisService';

// Import expert analysis prompt for counselor-level reasoning
import { buildExpertAnalysisPrompt } from '../expertSystemPrompts';

// Import expert knowledge assembly
import { assembleExpertContext } from '../expertCounselorKnowledgeBase';

// Import scoring orchestrator for parallel scoring
import { scoringOrchestrator, type ScoringOrchestratorResult } from '../scoring';

/**
 * Thresholds for teaching candidate selection
 */
const TEACHING_THRESHOLDS = {
  /** Activities at or below this tier get deep teaching */
  deepTeaching: 3 as ActivityTier,
  /** Activities at this tier get medium teaching */
  mediumTeaching: 2 as ActivityTier,
  /** Activities above this threshold get quick encouragement only */
  quickEncouragement: 1 as ActivityTier,
  /** Maximum activities to provide deep teaching for */
  maxDeepTeaching: 5,
  /** Minimum improvement potential to qualify for teaching */
  minImprovementPotential: 0.4,
};

/**
 * Stage 1: Context-Aware Analysis Service
 *
 * Enriches batch analysis with story context and identifies teaching candidates
 */
export class Stage1ContextAwareAnalysisService {
  private readonly MODEL = 'claude-sonnet-4-5-20250929';
  // R2: Removed instance-level _accumulatedUsage to prevent race conditions on concurrent calls

  /** Maximum activities per sub-batch for parallel LLM analysis */
  private readonly SUB_BATCH_SIZE = 2;

  /**
   * Run context-aware analysis with PARALLEL sub-batch processing (v4.2)
   *
   * Instead of sending all activities in one huge LLM call that times out,
   * we split into sub-batches of 1-2 activities and process them in parallel.
   * The profiler still runs on ALL activities first for portfolio-level context.
   *
   * @param input - Workshop session input
   * @param storyContext - Stage 0 story context output
   * @returns AnalysisContext with teaching candidates identified
   */
  async analyze(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext
  ): Promise<AnalysisContext> {
    const startTime = Date.now();
    // R2: Use local accumulator instead of instance-level to prevent race conditions
    const localUsage = { input_tokens: 0, output_tokens: 0 };
    console.log(`[Stage1] Starting context-aware analysis for ${input.activities.length} activities`);

    // Step 1a: Run profiler on ALL activities (instant, heuristic — no API call)
    console.log(`[Stage1] Running profiler on all activities...`);
    const profilerResult = await batchActivityAnalysisService.runProfiler(input);
    console.log(`[Stage1] Profiler complete in ${Date.now() - startTime}ms`);

    // Step 1b-1f: Run sub-batch analysis AND scoring IN PARALLEL
    // Scoring orchestrator makes 3 batch API calls while sub-batch analysis makes its own calls
    const chunks = chunkActivities(input.activities, this.SUB_BATCH_SIZE);
    console.log(`[Stage1] Analyzing ${input.activities.length} activities in ${chunks.length} parallel sub-batches of ≤${this.SUB_BATCH_SIZE}...`);
    console.log(`[Stage1] Running scoring orchestrator in parallel...`);

    const parallelStartTime = Date.now();
    const [subBatchSettled, scoringResult] = await Promise.all([
      // Sub-batch analysis — use allSettled so partial results survive individual failures
      Promise.allSettled(
        chunks.map((chunk, i) => {
          const subInput: ActivityWorkshopSessionInput = {
            activities: chunk,
            studentContext: input.studentContext,
          };
          console.log(`[Stage1] Sub-batch ${i + 1}/${chunks.length}: ${chunk.map(a => a.id).join(', ')}`);
          return batchActivityAnalysisService.analyzeSubBatch(subInput, profilerResult);
        })
      ),
      // Scoring orchestrator (NEW — runs in parallel)
      this.runScoring(input),
    ]);

    // R5: Extract successful sub-batch results with usage info, log failures
    const subBatchResults = subBatchSettled
      .filter((r): r is PromiseFulfilledResult<{ activities: Record<string, ActivityAnalysis>; usage?: { input_tokens: number; output_tokens: number } }> => r.status === 'fulfilled')
      .map(r => r.value);

    const failedBatches = subBatchSettled.filter(r => r.status === 'rejected');
    if (failedBatches.length > 0) {
      console.warn(`[Stage1] ${failedBatches.length}/${chunks.length} sub-batches failed`);
      for (const failed of failedBatches) {
        if (failed.status === 'rejected') {
          console.error('[Stage1] Sub-batch failure:', failed.reason);
        }
      }
    }

    if (subBatchResults.length === 0) {
      throw new Error(`All ${chunks.length} sub-batches failed`);
    }

    console.log(`[Stage1] Parallel analysis + scoring complete in ${Date.now() - parallelStartTime}ms (${subBatchResults.length}/${chunks.length} sub-batches succeeded)`);

    // R5: Accumulate sub-batch token usage (the most expensive part of the pipeline)
    for (const result of subBatchResults) {
      if (result.usage) {
        localUsage.input_tokens += result.usage.input_tokens;
        localUsage.output_tokens += result.usage.output_tokens;
      }
    }

    // Step 1c: Merge sub-batch results into unified PortfolioAnalysis
    const mergedActivities: Record<string, ActivityAnalysis> = {};
    // R5: Use .activities from the new return shape
    for (const subResult of subBatchResults) {
      Object.assign(mergedActivities, subResult.activities);
    }

    const portfolioFields = batchActivityAnalysisService.buildPortfolioFieldsFromProfiler(input, profilerResult);
    const baseAnalysis: PortfolioAnalysis = {
      activities: mergedActivities,
      ...portfolioFields,
    };

    // Recompute tier distribution from actual per-activity tiers (not the profiler's independent count)
    // The profiler and sub-batch analysis may assign different tiers since they're separate LLM calls
    const recomputedTiers = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    for (const analysis of Object.values(mergedActivities)) {
      const tier = analysis.classification?.tier;
      if (tier === 1) recomputedTiers.tier1++;
      else if (tier === 2) recomputedTiers.tier2++;
      else if (tier === 3) recomputedTiers.tier3++;
      else recomputedTiers.tier4++;
    }
    baseAnalysis.tierDistribution.tier1 = recomputedTiers.tier1;
    baseAnalysis.tierDistribution.tier2 = recomputedTiers.tier2;
    baseAnalysis.tierDistribution.tier3 = recomputedTiers.tier3;
    baseAnalysis.tierDistribution.tier4 = recomputedTiers.tier4;
    console.log(`[Stage1] Merged ${Object.keys(mergedActivities).length} activity analyses`);
    console.log(`[Stage1] Tier distribution (recomputed): T1=${recomputedTiers.tier1}, T2=${recomputedTiers.tier2}, T3=${recomputedTiers.tier3}, T4=${recomputedTiers.tier4}`);

    // Step 1d: Get story-enriched adjustments via LLM
    console.log(`[Stage1] Getting story-enriched adjustments...`);
    // R2: Pass localUsage to track story adjustment API cost
    const storyAdjustments = await this.getStoryEnrichedAdjustments(
      input,
      baseAnalysis,
      storyContext,
      localUsage
    );

    // Step 1e: Select teaching candidates based on analysis + story
    console.log(`[Stage1] Selecting teaching candidates...`);
    const teachingCandidates = this.selectTeachingCandidates(
      baseAnalysis,
      storyContext,
      storyAdjustments
    );

    // Step 1f: Prioritize teaching order
    const teachingPriorities = this.prioritizeTeaching(
      input,
      baseAnalysis,
      storyContext,
      teachingCandidates
    );

    // Step 1g: Identify portfolio-level teaching needs
    const portfolioTeachingNeeds = this.identifyPortfolioTeachingNeeds(
      baseAnalysis,
      storyContext
    );

    // R2: Accumulate scoring token usage into local accumulator
    if (scoringResult?.tokensUsed?.total) {
      localUsage.input_tokens += scoringResult.tokensUsed.total.input || 0;
      localUsage.output_tokens += scoringResult.tokensUsed.total.output || 0;
    }

    // Assemble the AnalysisContext
    const analysisContext: AnalysisContext = {
      ...baseAnalysis,
      storyEnrichment: {
        storyContextUsed: true,
        storyInfluencedScores: storyAdjustments,
      },
      teachingCandidates,
      teachingPriorities,
      portfolioTeachingNeeds,
      // Populate scoring if available (v4.3)
      // Reconcile tier assessments: when scoring and analysis disagree, annotate the scoring rationale
      scoring: scoringResult ? (() => {
        const rubric = scoringResult.rubric!;
        const scoresById = Object.fromEntries(scoringResult.scoresByActivityId || new Map());

        // Reconcile tiers: scoring runs in parallel with analysis, so may evaluate tiers independently
        for (const actScore of rubric.activityScores) {
          const analysisActivity = baseAnalysis.activities[actScore.activityId];
          if (!analysisActivity) continue;

          const analysisTier = analysisActivity.classification?.tier;
          // Use the tier field directly from the scoring breakdown (more reliable than regex on rationale)
          const scoringTier = actScore.activityScore.breakdown.tierAssessment.tier;

          if (analysisTier && scoringTier && analysisTier !== scoringTier) {
            // Tiers disagree — annotate the scoring rationale to acknowledge the discrepancy
            actScore.activityScore.breakdown.tierAssessment.rationale =
              `[Context: Tier ${analysisTier}] ${actScore.activityScore.breakdown.tierAssessment.rationale} ` +
              `Note: The contextual analysis (which factors in story arc and constraint adjustments) assigned Tier ${analysisTier} to this activity.`;
          }
        }

        return {
          portfolioRubric: rubric,
          activityScoresById: scoresById,
          scoringComplete: true,
        };
      })() : undefined,
      // R2: Use local accumulator for thread-safe metadata
      analysisMetadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: {
          input: localUsage.input_tokens,
          output: localUsage.output_tokens,
        },
        cost: this.calculateCost(localUsage),
        storyContextProvided: true,
      },
    };

    console.log(`[Stage1] Analysis complete in ${Date.now() - startTime}ms`);
    console.log(`[Stage1] Teaching candidates: ${teachingCandidates.deepTeachingIds.length} deep, ${teachingCandidates.mediumTeachingIds.length} medium, ${teachingCandidates.quickEncouragementIds.length} quick`);
    if (scoringResult?.success) {
      console.log(`[Stage1] Scoring: Portfolio ${scoringResult.rubric?.overallScore.total}/10, Harvard ${scoringResult.rubric?.harvardScale.rating}/6`);
    } else {
      console.log(`[Stage1] Scoring: Not available (non-fatal)`);
    }

    return analysisContext;
  }

  /**
   * Run the scoring orchestrator (non-fatal — pipeline continues if this fails)
   *
   * Makes 3 batch API calls: descriptions, activities, portfolio
   * Runs in parallel with sub-batch analysis for zero additional wall-clock time
   */
  private async runScoring(input: ActivityWorkshopSessionInput): Promise<ScoringOrchestratorResult | null> {
    const scoringStart = Date.now();
    try {
      console.log(`[Stage1] Scoring orchestrator starting...`);
      const result = await scoringOrchestrator.scorePortfolio({
        activities: input.activities,
        targetPlatform: input.targetPlatform,
        studentContext: {
          intendedMajor: input.studentContext?.intendedMajor,
          gradeLevel: input.studentContext?.gradeLevel,
          targetSchools: input.studentContext?.targetSchools,
        },
        teachingOptions: { includeTeaching: false }, // Teaching happens in Stage 2
      });
      console.log(`[Stage1] Scoring complete in ${Date.now() - scoringStart}ms (success=${result.success})`);
      return result.success ? result : null;
    } catch (error) {
      console.error(`[Stage1] Scoring failed in ${Date.now() - scoringStart}ms (non-fatal):`, error);
      return null;
    }
  }

  /**
   * Get story-enriched tier adjustments via LLM
   */
  // R2: Accept localUsage parameter for thread-safe token tracking
  private async getStoryEnrichedAdjustments(
    input: ActivityWorkshopSessionInput,
    baseAnalysis: PortfolioAnalysis,
    storyContext: StoryContext,
    localUsage: { input_tokens: number; output_tokens: number }
  ): Promise<AnalysisContext['storyEnrichment']['storyInfluencedScores']> {
    const prompt = this.buildStoryAdjustmentPrompt(input, baseAnalysis, storyContext);

    // Build expert context for counselor-level analysis
    const expertSystemPrompt = this.buildExpertSystemPrompt(input);

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt: expertSystemPrompt,
        userPrompt: prompt,
        maxTokens: 2000,
        temperature: 0.2,
      });

      // R2: Accumulate usage into local accumulator for cost tracking
      if (response.usage) {
        localUsage.input_tokens += response.usage.input_tokens || 0;
        localUsage.output_tokens += response.usage.output_tokens || 0;
      }

      return this.parseStoryAdjustments(response.content, input, baseAnalysis);
    } catch (error) {
      console.error('[Stage1] Story adjustment failed, using base tiers:', error);
      // Return empty adjustments (use base tiers)
      return [];
    }
  }

  /**
   * Build prompt for story-enriched adjustments
   */
  private buildStoryAdjustmentPrompt(
    input: ActivityWorkshopSessionInput,
    baseAnalysis: PortfolioAnalysis,
    storyContext: StoryContext
  ): string {
    // Format the story context
    const storySection = `
## STUDENT STORY (from Stage 0):
Story Essence: ${storyContext.narrativeIdentity.storyEssence}
Archetype: ${storyContext.narrativeIdentity.archetype} (${storyContext.narrativeIdentity.archetypeConfidence}% confidence)
Primary Theme: ${storyContext.narrativeIdentity.primaryTheme}
Secondary Themes: ${storyContext.narrativeIdentity.secondaryThemes.join(', ') || 'None'}

### Spike Hypothesis:
${storyContext.spikeHypothesis.likelySpike ? `
- Area: ${storyContext.spikeHypothesis.spikeArea}
- Maturity: ${storyContext.spikeHypothesis.maturity}
- Evidence: ${storyContext.spikeHypothesis.evidence}
` : 'No clear spike detected'}

### Contextual Factors:
- Work/Family Obligations: ${storyContext.contextualFactors.hasWorkFamilyObligations ? `YES - ${storyContext.contextualFactors.workFamilyContext}` : 'No'}
- Resource Constraints: ${storyContext.contextualFactors.hasResourceConstraints ? `YES - ${storyContext.contextualFactors.constraintsContext}` : 'No'}
- Geographic Limitations: ${storyContext.contextualFactors.hasGeographicLimitations ? `YES - ${storyContext.contextualFactors.geographicContext}` : 'No'}
- First-Gen Indicators: ${storyContext.contextualFactors.firstGenIndicators}
- International: ${storyContext.contextualFactors.internationalIndicators}

### Activity Story Roles:
${storyContext.activityStoryRoles.map(r =>
  `- ${r.activityId}: ${r.storyRole} (centrality: ${r.centralityScore}/100) - ${r.roleExplanation}`
).join('\n')}
`;

    // Format base analysis tiers
    const baseTiers = input.activities.map(a => {
      const analysis = baseAnalysis.activities[a.id];
      return `- ${a.id} (${a.title}): Tier ${analysis?.classification?.tier || 'Unknown'}`;
    }).join('\n');

    return `Given this student's story and the base tier analysis, identify any activities where the story context should ADJUST the tier assessment.

${storySection}

## BASE TIER ANALYSIS:
${baseTiers}

## YOUR TASK:
Review each activity's tier in light of the story context. Consider:

1. **Contextual Uplift**: Activities that show exceptional effort given constraints
   - A student working 20+ hrs/week who still maintains a Tier 3 activity deserves recognition
   - First-gen students starting activities later show initiative despite disadvantage
   - Rural students creating opportunities where none exist

2. **Spike Coherence**: Activities that form the spike should be viewed holistically
   - If 3 activities form a clear spike, their collective impact > individual tiers
   - Don't double-penalize spike activities for being similar

3. **Story Role Value**: Core identity activities carry more weight
   - A "core_identity" Tier 3 may matter more than a "filler" Tier 2
   - Obligations (family work) should not be penalized

4. **Authenticity Premium**: Activities with clear passion evidence
   - Sustained multi-year commitment despite lower tier = valuable
   - Clear growth trajectory deserves recognition

Respond with JSON:
{
  "adjustments": [
    {
      "activityId": "activity-id",
      "originalTier": 3,
      "adjustedTier": 2,
      "reason": "Given work obligations of 25hrs/week, maintaining robotics club leadership shows exceptional dedication. The contextual effort elevates this from typical Tier 3 to strong Tier 2."
    }
  ],
  "noAdjustmentRationale": "Brief explanation if no adjustments needed"
}

IMPORTANT:
- Only adjust tiers where story context CLEARLY warrants it
- Don't inflate tiers without strong justification
- Maximum 1-tier adjustment in either direction
- Provide specific evidence for each adjustment

CALIBRATION RULES:
- A tier adjustment is a BIG deal. Only adjust when the story context provides CLEAR, SPECIFIC evidence that the standard tier doesn't capture the full picture.
- Work obligations (20+ hours/week) justify +1 tier adjustment for PARTICIPATION activities, but NOT for quality of output.
- First-generation status justifies +1 for ACCESS to resources, but NOT for the quality of work done with those resources.
- Geographic constraints justify +1 for limited OPPORTUNITY, but the student's actual achievements must still be evaluated on merit.
- NEVER adjust more than 1 tier. NEVER adjust a Tier 1 activity up (it's already the top).
- When in doubt, DO NOT adjust. The scoring system handles nuance better than a blunt tier bump.`;
  }

  /**
   * Build expert system prompt with counselor-level analysis intelligence
   *
   * When expert context is available, uses the full expert analysis framework.
   * Falls back to a solid baseline prompt otherwise.
   */
  private buildExpertSystemPrompt(input: ActivityWorkshopSessionInput): string {
    try {
      const expertContext = assembleExpertContext({
        activities: input.activities.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          role: a.role,
          hoursPerWeek: a.hoursPerWeek,
          weeksPerYear: a.weeksPerYear,
          yearsInvolved: a.yearsInvolved || 1,
          gradeLevels: a.gradeLevels?.map(g => String(g)),
        })),
        studentContext: input.studentContext ? {
          intendedMajor: input.studentContext.intendedMajor,
          targetSchools: input.studentContext.targetSchools,
          isFirstGen: input.studentContext.firstGen,
          hasWorkObligations: input.studentContext.hasWorkObligations,
          workHoursPerWeek: input.studentContext.workHoursPerWeek,
          constraintNotes: input.studentContext.constraintNotes,
          geographicContext: input.studentContext.geographicContext,
        } : undefined,
      });

      // Use expert analysis prompt with constraint intelligence, school archetypes, etc.
      return buildExpertAnalysisPrompt(expertContext) + '\n\nOutput valid JSON only.';
    } catch (error) {
      console.warn('[Stage1] Expert context assembly failed, using baseline prompt:', error);
      return this.getBaselineSystemPrompt();
    }
  }

  /**
   * Baseline system prompt (fallback when expert context unavailable)
   */
  private getBaselineSystemPrompt(): string {
    return `You are an expert college admissions counselor who understands that context matters.

Your role is to review tier assessments in light of a student's personal story and circumstances.

KEY PRINCIPLES:

1. CONTEXT CHANGES INTERPRETATION
   - The same activity means different things for different students
   - A first-gen student starting a club shows more initiative than a legacy student joining an existing one
   - Rural students don't have access to the same opportunities as suburban students

2. CONSTRAINTS DESERVE RECOGNITION
   - Working 20+ hours/week while maintaining activities is exceptional
   - Family obligations (caregiving, translation) are valuable even if not "resume-worthy"
   - Financial constraints that limit travel to competitions don't diminish achievement

3. SPIKE COHERENCE MATTERS
   - Activities forming a spike should be viewed as a cohesive unit
   - The story they tell together > individual tier assessments

4. DON'T OVER-ADJUST
   - Context explains, it doesn't transform
   - A Tier 4 with good context is still Tier 4 (maybe strong Tier 4)
   - Maximum adjustment is usually 1 tier

Output valid JSON only.`;
  }

  /**
   * Parse story adjustment response
   */
  private parseStoryAdjustments(
    response: string,
    input: ActivityWorkshopSessionInput,
    baseAnalysis: PortfolioAnalysis
  ): AnalysisContext['storyEnrichment']['storyInfluencedScores'] {
    try {
      // Extract JSON
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      if (!parsed.adjustments || !Array.isArray(parsed.adjustments)) {
        return [];
      }

      return parsed.adjustments.map((adj: {
        activityId: string;
        originalTier: number;
        adjustedTier: number;
        reason: string;
      }) => ({
        activityId: adj.activityId,
        originalTierEstimate: (adj.originalTier || baseAnalysis.activities[adj.activityId]?.classification?.tier || 4) as ActivityTier,
        adjustedTier: adj.adjustedTier as ActivityTier,
        adjustmentReason: adj.reason || 'Story context adjustment',
      }));
    } catch (error) {
      console.error('[Stage1] Failed to parse story adjustments:', error);
      return [];
    }
  }

  /**
   * Select teaching candidates based on analysis and story context
   */
  private selectTeachingCandidates(
    baseAnalysis: PortfolioAnalysis,
    storyContext: StoryContext,
    adjustments: AnalysisContext['storyEnrichment']['storyInfluencedScores']
  ): AnalysisContext['teachingCandidates'] {
    const deepTeachingIds: string[] = [];
    const mediumTeachingIds: string[] = [];
    const quickEncouragementIds: string[] = [];
    const skipTeachingIds: string[] = [];

    // Create a map of adjusted tiers
    const adjustedTiers = new Map<string, ActivityTier>();
    for (const adj of adjustments) {
      adjustedTiers.set(adj.activityId, adj.adjustedTier);
    }

    // Categorize each activity
    for (const [activityId, analysis] of Object.entries(baseAnalysis.activities)) {
      const tier = adjustedTiers.get(activityId) || analysis.classification.tier;
      const storyRole = storyContext.activityStoryRoles.find(r => r.activityId === activityId);
      const isCoreToStory = storyRole?.storyRole === 'core_identity' || storyRole?.storyRole === 'passion_pursuit';
      const centralityScore = storyRole?.centralityScore || 50;

      // Calculate improvement potential
      const improvementPotential = this.calculateImprovementPotential(analysis, tier);

      // Check if this activity is part of the student's spike
      const isInSpike = storyContext.spikeHypothesis.spikeActivityIds.includes(activityId);

      // Decision logic — strategic importance overrides tier-based defaults
      // Spike and core activities get deep teaching because they differentiate
      // the student at target schools and need the most polish
      if ((isCoreToStory || isInSpike) && tier >= 2) {
        // Spike/core identity/passion pursuit activities with room to improve → deep teaching
        deepTeachingIds.push(activityId);
      } else if (tier === 1 && !isCoreToStory) {
        // Tier 1 non-core: skip teaching (already excellent)
        skipTeachingIds.push(activityId);
      } else if (tier === 1 && isCoreToStory) {
        // Tier 1 core: quick encouragement (celebrate, maybe refine)
        quickEncouragementIds.push(activityId);
      } else if (tier === 2 && improvementPotential < TEACHING_THRESHOLDS.minImprovementPotential) {
        // Tier 2 with low improvement potential: quick encouragement
        quickEncouragementIds.push(activityId);
      } else if (tier === 2) {
        // Tier 2 with improvement potential: medium teaching
        mediumTeachingIds.push(activityId);
      } else if (tier >= 3 && centralityScore >= 60) {
        // Tier 3-4 that's central to story: deep teaching
        deepTeachingIds.push(activityId);
      } else if (tier >= 3 && improvementPotential >= TEACHING_THRESHOLDS.minImprovementPotential) {
        // Tier 3-4 with improvement potential: deep teaching
        deepTeachingIds.push(activityId);
      } else if (tier === 3) {
        // Tier 3 lower priority: medium teaching
        mediumTeachingIds.push(activityId);
      } else {
        // Tier 4 low centrality: quick encouragement or skip
        if (storyRole?.storyRole === 'filler') {
          skipTeachingIds.push(activityId);
        } else {
          quickEncouragementIds.push(activityId);
        }
      }
    }

    // Cap deep teaching to prevent cognitive overload
    if (deepTeachingIds.length > TEACHING_THRESHOLDS.maxDeepTeaching) {
      // Move excess to medium
      const excess = deepTeachingIds.splice(TEACHING_THRESHOLDS.maxDeepTeaching);
      mediumTeachingIds.push(...excess);
    }

    return {
      deepTeachingIds,
      mediumTeachingIds,
      quickEncouragementIds,
      skipTeachingIds,
      selectionCriteria: {
        deepThreshold: TEACHING_THRESHOLDS.deepTeaching,
        mediumThreshold: TEACHING_THRESHOLDS.mediumTeaching,
        skipThreshold: TEACHING_THRESHOLDS.quickEncouragement,
      },
    };
  }

  /**
   * Calculate improvement potential for an activity
   */
  private calculateImprovementPotential(
    analysis: PortfolioAnalysis['activities'][string],
    tier: ActivityTier
  ): number {
    let potential = 0;

    // Tier-based potential (lower tier = more room to improve)
    potential += (4 - tier) * 0.2;

    // Description quality (poor description = high potential)
    const descQuality = analysis.descriptionQuality?.overallScore || 50;
    potential += (100 - descQuality) / 200; // 0-0.5 based on description

    // Green flags without recognition = undersold
    const greenFlags = analysis.greenFlags?.length || 0;
    const recognition = analysis.recognition?.level || 'none';
    if (greenFlags >= 2 && recognition === 'none') {
      potential += 0.2; // Undersold activity
    }

    // No quantifiable metrics = room to add specifics
    const metrics = analysis.impact?.quantifiableMetrics?.length || 0;
    if (metrics === 0) {
      potential += 0.1;
    }

    return Math.min(1.0, potential);
  }

  /**
   * Prioritize teaching order
   */
  private prioritizeTeaching(
    input: ActivityWorkshopSessionInput,
    baseAnalysis: PortfolioAnalysis,
    storyContext: StoryContext,
    candidates: AnalysisContext['teachingCandidates']
  ): AnalysisContext['teachingPriorities'] {
    const allTeachingIds = [
      ...candidates.deepTeachingIds,
      ...candidates.mediumTeachingIds,
    ];

    const priorities: AnalysisContext['teachingPriorities'] = [];

    for (const activityId of allTeachingIds) {
      const analysis = baseAnalysis.activities[activityId];
      const activity = input.activities.find(a => a.id === activityId);
      const storyRole = storyContext.activityStoryRoles.find(r => r.activityId === activityId);
      const isInSpike = storyContext.spikeHypothesis.spikeActivityIds.includes(activityId);

      // Calculate priority score
      let priorityScore = 0;

      // Core identity activities get highest priority
      if (storyRole?.storyRole === 'core_identity') priorityScore += 30;
      if (storyRole?.storyRole === 'passion_pursuit') priorityScore += 20;

      // Spike activities get priority
      if (isInSpike) priorityScore += 25;

      // Centrality matters
      priorityScore += (storyRole?.centralityScore || 0) / 5;

      // Higher tier activities need more refined teaching
      priorityScore += (5 - (analysis.classification?.tier || 4)) * 5;

      // Poor description quality = urgent
      const descQuality = analysis.descriptionQuality?.overallScore || 50;
      if (descQuality < 40) priorityScore += 15;

      // Map score to priority 1-5
      let priority: 1 | 2 | 3 | 4 | 5;
      if (priorityScore >= 70) priority = 1;
      else if (priorityScore >= 55) priority = 2;
      else if (priorityScore >= 40) priority = 3;
      else if (priorityScore >= 25) priority = 4;
      else priority = 5;

      // Determine expected impact
      let expectedImpact: 'transformative' | 'significant' | 'moderate' | 'minimal';
      if (priorityScore >= 70) expectedImpact = 'transformative';
      else if (priorityScore >= 55) expectedImpact = 'significant';
      else if (priorityScore >= 40) expectedImpact = 'moderate';
      else expectedImpact = 'minimal';

      // Determine teaching focus areas
      const teachingFocus: string[] = [];
      if (descQuality < 60) teachingFocus.push('description_optimization');
      if (analysis.impact?.quantifiableMetrics?.length === 0) teachingFocus.push('add_metrics');
      if (analysis.redFlags?.length > 0) teachingFocus.push('address_red_flags');
      if (analysis.narrativePotential?.essayWorthiness === 'excellent' || analysis.narrativePotential?.essayWorthiness === 'good') {
        teachingFocus.push('essay_potential');
      }
      if (isInSpike) teachingFocus.push('spike_integration');

      priorities.push({
        activityId,
        priority,
        reason: this.generatePriorityReason(activity, storyRole, isInSpike, descQuality),
        expectedImpact,
        teachingFocus,
      });
    }

    // Sort by priority
    return priorities.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate human-readable priority reason
   */
  private generatePriorityReason(
    activity: ActivityWorkshopSessionInput['activities'][number] | undefined,
    storyRole: StoryContext['activityStoryRoles'][number] | undefined,
    isInSpike: boolean,
    descQuality: number
  ): string {
    const reasons: string[] = [];

    if (storyRole?.storyRole === 'core_identity') {
      reasons.push('Core to student identity');
    }
    if (isInSpike) {
      reasons.push('Part of spike area');
    }
    if (descQuality < 40) {
      reasons.push('Description needs significant improvement');
    }
    if (storyRole && storyRole.centralityScore >= 70) {
      reasons.push('High centrality to narrative');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Standard teaching priority';
  }

  /**
   * Identify portfolio-level teaching needs
   */
  private identifyPortfolioTeachingNeeds(
    baseAnalysis: PortfolioAnalysis,
    storyContext: StoryContext
  ): AnalysisContext['portfolioTeachingNeeds'] {
    // Identify primary issue
    let primaryIssue = '';
    let primaryIssueSeverity: 'critical' | 'significant' | 'moderate' | 'minor' = 'minor';

    if (baseAnalysis.coherenceAnalysis.score < 50) {
      primaryIssue = 'Portfolio lacks coherent narrative thread';
      primaryIssueSeverity = baseAnalysis.coherenceAnalysis.score < 30 ? 'critical' : 'significant';
    } else if (!baseAnalysis.spikeAnalysis.hasSpike && storyContext.spikeHypothesis.likelySpike) {
      primaryIssue = 'Potential spike exists but is not clearly presented';
      primaryIssueSeverity = 'significant';
    } else if (baseAnalysis.tierDistribution.tier4 >= 5) {
      primaryIssue = 'Too many Tier 4 activities diluting portfolio impact';
      primaryIssueSeverity = 'significant';
    } else if (baseAnalysis.gapsIdentified.some(g => g.severity === 'critical')) {
      const criticalGap = baseAnalysis.gapsIdentified.find(g => g.severity === 'critical');
      primaryIssue = criticalGap?.gap || 'Critical gap in portfolio';
      primaryIssueSeverity = 'critical';
    } else {
      primaryIssue = 'Optimize activity descriptions and ordering';
      primaryIssueSeverity = 'moderate';
    }

    // Secondary issues
    const secondaryIssues: string[] = [];
    if (baseAnalysis.coherenceAnalysis.disconnectedActivities.length > 2) {
      secondaryIssues.push(`${baseAnalysis.coherenceAnalysis.disconnectedActivities.length} activities feel disconnected from main narrative`);
    }
    if (baseAnalysis.depthBreadthProfile.profile === 'scattered') {
      secondaryIssues.push('Portfolio appears scattered rather than focused');
    }
    if (baseAnalysis.commonAppReadiness?.descriptionReadiness?.filter(d => !d.ready).length > 3) {
      secondaryIssues.push('Multiple descriptions need improvement before submission');
    }

    // Strengths to highlight
    const strengthsToHighlight: string[] = [];
    if (baseAnalysis.spikeAnalysis.hasSpike) {
      strengthsToHighlight.push(`Strong spike in ${baseAnalysis.spikeAnalysis.spikeType || 'specialized area'}`);
    }
    if (baseAnalysis.tierDistribution.tier1 >= 1) {
      strengthsToHighlight.push(`${baseAnalysis.tierDistribution.tier1} Tier 1 activity(ies)`);
    }
    if (baseAnalysis.coherenceAnalysis.score >= 70) {
      strengthsToHighlight.push('Strong narrative coherence across activities');
    }
    if (storyContext.narrativeIdentity.archetypeConfidence >= 80) {
      strengthsToHighlight.push(`Clear ${storyContext.narrativeIdentity.archetype} identity`);
    }

    // Strategic gaps
    const strategicGaps = baseAnalysis.gapsIdentified
      .filter(g => g.severity !== 'minor')
      .map(g => g.gap);

    return {
      primaryIssue,
      primaryIssueSeverity,
      secondaryIssues,
      strengthsToHighlight,
      strategicGaps,
    };
  }

  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    // Sonnet pricing: $3/M input, $15/M output
    const inputCost = (usage.input_tokens / 1_000_000) * 3;
    const outputCost = (usage.output_tokens / 1_000_000) * 15;
    return inputCost + outputCost;
  }
}

// ============================================================================
// UTILITY
// ============================================================================

/** Split an array into chunks of the given size */
function chunkActivities<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// Export singleton
export const stage1ContextAwareAnalysisService = new Stage1ContextAwareAnalysisService();
