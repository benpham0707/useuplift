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
  PortfolioAnalysis,
  StoryContext,
  AnalysisContext,
  ActivityTier,
} from '../types';

// Import the batch analysis service for base analysis
import { batchActivityAnalysisService } from '../batchActivityAnalysisService';

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
  private readonly MODEL = 'claude-sonnet-4-5-20250514';

  /**
   * Run context-aware analysis
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
    console.log(`[Stage1] Starting context-aware analysis for ${input.activities.length} activities`);

    // Step 1: Run batch analysis (or use cached if available)
    console.log(`[Stage1] Running batch analysis...`);
    const baseAnalysis = await batchActivityAnalysisService.analyzePortfolio(input);
    console.log(`[Stage1] Batch analysis complete`);

    // Step 2: Get story-enriched adjustments via LLM
    console.log(`[Stage1] Getting story-enriched adjustments...`);
    const storyAdjustments = await this.getStoryEnrichedAdjustments(
      input,
      baseAnalysis,
      storyContext
    );

    // Step 3: Select teaching candidates based on analysis + story
    console.log(`[Stage1] Selecting teaching candidates...`);
    const teachingCandidates = this.selectTeachingCandidates(
      baseAnalysis,
      storyContext,
      storyAdjustments
    );

    // Step 4: Prioritize teaching order
    const teachingPriorities = this.prioritizeTeaching(
      input,
      baseAnalysis,
      storyContext,
      teachingCandidates
    );

    // Step 5: Identify portfolio-level teaching needs
    const portfolioTeachingNeeds = this.identifyPortfolioTeachingNeeds(
      baseAnalysis,
      storyContext
    );

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
      analysisMetadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: { input: 0, output: 0 }, // TODO: Track actual tokens
        cost: 0, // TODO: Calculate actual cost
        storyContextProvided: true,
      },
    };

    console.log(`[Stage1] Analysis complete in ${Date.now() - startTime}ms`);
    console.log(`[Stage1] Teaching candidates: ${teachingCandidates.deepTeachingIds.length} deep, ${teachingCandidates.mediumTeachingIds.length} medium, ${teachingCandidates.quickEncouragementIds.length} quick`);

    return analysisContext;
  }

  /**
   * Get story-enriched tier adjustments via LLM
   */
  private async getStoryEnrichedAdjustments(
    input: ActivityWorkshopSessionInput,
    baseAnalysis: PortfolioAnalysis,
    storyContext: StoryContext
  ): Promise<AnalysisContext['storyEnrichment']['storyInfluencedScores']> {
    const prompt = this.buildStoryAdjustmentPrompt(input, baseAnalysis, storyContext);

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt: this.getSystemPrompt(),
        userPrompt: prompt,
        maxTokens: 2000,
        temperature: 0.2,
      });

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
- Provide specific evidence for each adjustment`;
  }

  /**
   * System prompt for story adjustments
   */
  private getSystemPrompt(): string {
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

      // Decision logic
      if (tier === 1 && !isCoreToStory) {
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
}

// Export singleton
export const stage1ContextAwareAnalysisService = new Stage1ContextAwareAnalysisService();
