/**
 * Stage 2: Conditional Teaching Service
 *
 * SELECTIVE TEACHING (Only teaches activities that need it)
 *
 * PURPOSE:
 * ========
 * Unlike the old approach that taught ALL activities equally, this service:
 * 1. Uses Stage 1's teaching candidate selection to focus effort
 * 2. Provides DEEP teaching for activities with highest improvement potential
 * 3. Gives QUICK encouragement to already-strong activities
 * 4. Matches Common App Workshop's teaching quality standards
 *
 * TEACHING QUALITY STANDARDS (matching Common App Workshop):
 * =========================================================
 * 1. CELEBRATION FIRST - Always acknowledge what's working before critique
 * 2. RESEARCH-BACKED - Cite Sara Harberson, dean quotes, admissions insights
 * 3. SPECIFIC & ACTIONABLE - Before/after examples from THEIR description
 * 4. VOICE PRESERVATION - Maintain student's authentic voice
 * 5. STORY INTEGRATION - Connect improvements to their narrative
 *
 * MODEL: Sonnet for teaching quality
 * COST: ~$0.10-0.15 (only teaching ~5 activities deeply instead of all 10)
 */

import { callClaude } from '@/lib/llm/claude';
import {
  ActivityWorkshopSessionInput,
  ActivityWorkshopInput,
  AnalysisContext,
  StoryContext,
  TeachingContext,
  ActivityTeaching,
  ActivityTier,
} from '../types';

// Import citation service for research-backed teaching
import { activityCitationService } from '../activityCitationService';

/**
 * Teaching depth configuration
 */
const TEACHING_CONFIG = {
  /** Target word count for deep teaching */
  deepTeachingWords: { min: 600, max: 1000 },
  /** Target word count for medium teaching */
  mediumTeachingWords: { min: 300, max: 500 },
  /** Target word count for quick encouragement */
  quickEncouragementWords: { min: 100, max: 200 },
  /** Maximum activities to teach in one batch call */
  batchSize: 5,
};

/**
 * Stage 2: Conditional Teaching Service
 *
 * Delivers targeted, high-quality teaching to activities that need it
 */
export class Stage2ConditionalTeachingService {
  private readonly MODEL = 'claude-sonnet-4-5-20250514';

  /**
   * Run conditional teaching
   *
   * @param input - Workshop session input
   * @param storyContext - Stage 0 story context
   * @param analysisContext - Stage 1 analysis context
   * @returns TeachingContext with selective teaching delivered
   */
  async teach(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext
  ): Promise<TeachingContext> {
    const startTime = Date.now();
    console.log(`[Stage2] Starting conditional teaching`);
    console.log(`[Stage2] Deep candidates: ${analysisContext.teachingCandidates.deepTeachingIds.length}`);
    console.log(`[Stage2] Medium candidates: ${analysisContext.teachingCandidates.mediumTeachingIds.length}`);
    console.log(`[Stage2] Quick encouragement: ${analysisContext.teachingCandidates.quickEncouragementIds.length}`);

    const teachingDelivered: TeachingContext['teachingDelivered'] = [];
    const quickEncouragements: TeachingContext['quickEncouragements'] = [];
    const skippedActivities: TeachingContext['skippedActivities'] = [];

    // Step 1: Deep teaching for priority activities
    if (analysisContext.teachingCandidates.deepTeachingIds.length > 0) {
      console.log(`[Stage2] Generating deep teaching...`);
      const deepTeaching = await this.generateBatchTeaching(
        input,
        storyContext,
        analysisContext,
        analysisContext.teachingCandidates.deepTeachingIds,
        'deep'
      );
      teachingDelivered.push(...deepTeaching.map(t => ({
        activityId: t.activityId,
        teachingDepth: 'deep' as const,
        teaching: t,
      })));
    }

    // Step 2: Medium teaching for secondary activities
    if (analysisContext.teachingCandidates.mediumTeachingIds.length > 0) {
      console.log(`[Stage2] Generating medium teaching...`);
      const mediumTeaching = await this.generateBatchTeaching(
        input,
        storyContext,
        analysisContext,
        analysisContext.teachingCandidates.mediumTeachingIds,
        'medium'
      );
      teachingDelivered.push(...mediumTeaching.map(t => ({
        activityId: t.activityId,
        teachingDepth: 'medium' as const,
        teaching: t,
      })));
    }

    // Step 3: Quick encouragements for strong activities
    if (analysisContext.teachingCandidates.quickEncouragementIds.length > 0) {
      console.log(`[Stage2] Generating quick encouragements...`);
      const encouragements = await this.generateQuickEncouragements(
        input,
        storyContext,
        analysisContext,
        analysisContext.teachingCandidates.quickEncouragementIds
      );
      quickEncouragements.push(...encouragements);
    }

    // Step 4: Mark skipped activities
    for (const activityId of analysisContext.teachingCandidates.skipTeachingIds) {
      const analysis = analysisContext.activities[activityId];
      skippedActivities.push({
        activityId,
        reason: analysis?.classification?.tier === 1 ? 'already_excellent' : 'no_improvement_path',
        status: 'No teaching needed - activity is already strong',
      });
    }

    // Step 5: Generate portfolio-level teaching
    console.log(`[Stage2] Generating portfolio teaching...`);
    const portfolioTeaching = await this.generatePortfolioTeaching(
      input,
      storyContext,
      analysisContext
    );

    // Step 6: Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(teachingDelivered, quickEncouragements);

    const result: TeachingContext = {
      teachingDelivered,
      quickEncouragements,
      skippedActivities,
      portfolioTeaching,
      qualityMetrics,
      teachingMetadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: { input: 0, output: 0 }, // TODO: Track actual
        cost: 0, // TODO: Calculate actual
        activitiesTaught: teachingDelivered.length,
        activitiesSkipped: skippedActivities.length,
      },
    };

    console.log(`[Stage2] Teaching complete in ${Date.now() - startTime}ms`);
    console.log(`[Stage2] Delivered: ${teachingDelivered.length} teachings, ${quickEncouragements.length} encouragements`);

    return result;
  }

  /**
   * Generate batch teaching for multiple activities
   */
  private async generateBatchTeaching(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[],
    depth: 'deep' | 'medium'
  ): Promise<ActivityTeaching[]> {
    if (activityIds.length === 0) return [];

    const prompt = this.buildBatchTeachingPrompt(
      input,
      storyContext,
      analysisContext,
      activityIds,
      depth
    );

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt: this.getTeachingSystemPrompt(depth),
        userPrompt: prompt,
        maxTokens: depth === 'deep' ? 8000 : 4000,
        temperature: 0.4, // Some creativity for engaging teaching
      });

      return this.parseTeachingResponse(response.content, activityIds, input, analysisContext);
    } catch (error) {
      console.error(`[Stage2] Batch teaching failed:`, error);
      // Fallback to basic teaching
      return activityIds.map(id => this.createFallbackTeaching(id, input, analysisContext));
    }
  }

  /**
   * Build batch teaching prompt
   */
  private buildBatchTeachingPrompt(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[],
    depth: 'deep' | 'medium'
  ): string {
    const wordRange = depth === 'deep'
      ? TEACHING_CONFIG.deepTeachingWords
      : TEACHING_CONFIG.mediumTeachingWords;

    // Format student story context
    const storySection = `
## STUDENT STORY:
${storyContext.narrativeIdentity.storyEssence}
Archetype: ${storyContext.narrativeIdentity.archetype}
Primary Theme: ${storyContext.narrativeIdentity.primaryTheme}
${storyContext.spikeHypothesis.likelySpike ? `Spike Area: ${storyContext.spikeHypothesis.spikeArea} (${storyContext.spikeHypothesis.maturity})` : 'No clear spike yet'}
`;

    // Format portfolio teaching needs
    const needsSection = `
## PORTFOLIO-LEVEL NEEDS:
Primary Issue: ${analysisContext.portfolioTeachingNeeds.primaryIssue}
Strengths to Highlight: ${analysisContext.portfolioTeachingNeeds.strengthsToHighlight.join(', ')}
`;

    // Format activities to teach
    const activitiesSection = activityIds.map(id => {
      const activity = input.activities.find(a => a.id === id);
      const analysis = analysisContext.activities[id];
      const priority = analysisContext.teachingPriorities.find(p => p.activityId === id);
      const storyRole = storyContext.activityStoryRoles.find(r => r.activityId === id);

      if (!activity || !analysis) return '';

      return `
### ACTIVITY: ${activity.title} (ID: ${id})
Current Description: "${activity.description}"
Role: ${activity.role || 'Member'}
Organization: ${activity.organization || 'N/A'}
Time: ${activity.hoursPerWeek}hrs/wk × ${activity.weeksPerYear}wks/yr

**Analysis Results:**
- Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence} confidence)
- Tier Reasoning: ${analysis.classification.tierReasoning}
- Description Quality: ${analysis.descriptionQuality.overallScore}/100
- Description Issues: ${analysis.descriptionQuality.issues.join('; ') || 'None identified'}
- Description Strengths: ${analysis.descriptionQuality.strengths.join('; ') || 'None identified'}
- Green Flags: ${analysis.greenFlags.map(f => f.flag).join('; ') || 'None'}
- Red Flags: ${analysis.redFlags.map(f => `${f.flag} (${f.severity})`).join('; ') || 'None'}
- Narrative Potential: ${analysis.narrativePotential.essayWorthiness} - ${analysis.narrativePotential.growthArc}

**Story Role:** ${storyRole?.storyRole || 'Unknown'} (centrality: ${storyRole?.centralityScore || 0}/100)
**Teaching Priority:** ${priority?.priority || 'N/A'} - ${priority?.reason || 'Standard'}
**Teaching Focus Areas:** ${priority?.teachingFocus?.join(', ') || 'General improvement'}
`;
    }).join('\n---\n');

    return `Provide ${depth} teaching for these ${activityIds.length} activities.

${storySection}
${needsSection}

## ACTIVITIES TO TEACH:
${activitiesSection}

## TEACHING REQUIREMENTS:

1. **CELEBRATE FIRST** - Start each activity's teaching with genuine praise
2. **BE SPECIFIC** - Use their exact words from the description
3. **SHOW DON'T TELL** - Provide before/after examples
4. **CONNECT TO STORY** - Link improvements to their narrative
5. **WORD COUNT** - ${wordRange.min}-${wordRange.max} words per activity

Respond with JSON:
{
  "teachings": [
    {
      "activityId": "id",
      "tierExplanation": {
        "assignedTier": 1-4,
        "explanation": { "text": "Why this tier with celebration first", "citations": [] },
        "benchmarksUsed": [{ "tier": 2, "benchmark": "What Tier 2 requires", "source": "Sara Harberson", "studentMeets": true, "gap": null }],
        "whatMakesThisTier": { "text": "Specific evidence", "citations": [] },
        "whatWouldChangeIt": { "text": "Specific actionable steps", "citations": [] }
      },
      "strengthTeaching": [
        {
          "strength": "What's working",
          "whyItMatters": { "text": "Research-backed importance", "citations": [] },
          "howToLeverage": "How to use this strength",
          "inApplications": "Where to highlight"
        }
      ],
      "improvementTeaching": [
        {
          "issue": "What to improve",
          "whyItMatters": { "text": "Why this matters", "citations": [] },
          "howToFix": "Step by step guidance",
          "exampleBefore": "Current weak text",
          "exampleAfter": "Improved version",
          "priority": "high|medium|low"
        }
      ],
      "descriptionOptimization": {
        "originalDescription": "Their current description",
        "optimizedDescription": "Your improved version (150 chars max)",
        "characterCount": 145,
        "changesExplained": [{ "change": "What changed", "reason": "Why" }]
      },
      "narrativeGuidance": {
        "howToTalkAboutThis": { "text": "Framing advice", "citations": [] },
        "uniqueAngle": "What makes this special",
        "connectionToStory": "How it fits their narrative",
        "interviewTips": ["Tip 1", "Tip 2"]
      }
    }
  ]
}`;
  }

  /**
   * Get system prompt for teaching
   */
  private getTeachingSystemPrompt(depth: 'deep' | 'medium'): string {
    return `You are an exceptional college essay coach known for warm, encouraging feedback that transforms students' applications.

## YOUR TEACHING STYLE:

1. **WARM & CELEBRATORY**
   - "This is wonderful because..." not "This is weak because..."
   - Find genuine strengths before addressing improvements
   - Students should feel encouraged, not deflated

2. **RESEARCH-BACKED**
   - Cite Sara Harberson's tier system when explaining classifications
   - Reference what admissions officers look for
   - Use phrases like "Top universities value..." or "According to former Stanford dean..."

3. **SPECIFIC & ACTIONABLE**
   - Don't say "add more detail" - show exactly what detail to add
   - Before: "Helped organize events"
   - After: "Coordinated 12 community events reaching 500+ participants"

4. **VOICE-PRESERVING**
   - Keep the student's authentic voice in optimized descriptions
   - Don't make it sound like an adult wrote it
   - Enhance, don't replace their personality

5. **STORY-CONNECTED**
   - Every improvement should strengthen their narrative
   - Connect activities to their archetype/theme
   - Help them see how activities work together

## DEPTH: ${depth.toUpperCase()}
${depth === 'deep' ? `
- Provide comprehensive teaching (600-1000 words per activity)
- Include multiple before/after examples
- Address all identified issues
- Provide upgrade pathways where relevant
` : `
- Provide focused teaching (300-500 words per activity)
- One key before/after example
- Address top 2-3 issues
- Keep recommendations actionable
`}

Output valid JSON only.`;
  }

  /**
   * Parse teaching response
   */
  private parseTeachingResponse(
    response: string,
    activityIds: string[],
    input: ActivityWorkshopSessionInput,
    analysisContext: AnalysisContext
  ): ActivityTeaching[] {
    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      if (!parsed.teachings || !Array.isArray(parsed.teachings)) {
        throw new Error('Invalid response structure');
      }

      return parsed.teachings.map((t: Record<string, unknown>) => {
        const activityId = t.activityId as string;
        const activity = input.activities.find(a => a.id === activityId);
        const analysis = analysisContext.activities[activityId];

        return {
          activityId,
          tierExplanation: this.normalizeTierExplanation(t.tierExplanation, analysis),
          strengthTeaching: t.strengthTeaching || [],
          improvementTeaching: t.improvementTeaching || [],
          upgradePathway: t.upgradePathway,
          descriptionOptimization: this.normalizeDescriptionOptimization(
            t.descriptionOptimization,
            activity
          ),
          narrativeGuidance: this.normalizeNarrativeGuidance(t.narrativeGuidance),
        } as ActivityTeaching;
      });
    } catch (error) {
      console.error('[Stage2] Failed to parse teaching response:', error);
      return activityIds.map(id => this.createFallbackTeaching(id, input, analysisContext));
    }
  }

  /**
   * Normalize tier explanation
   */
  private normalizeTierExplanation(
    tierExplanation: Record<string, unknown> | undefined,
    analysis: AnalysisContext['activities'][string]
  ): ActivityTeaching['tierExplanation'] {
    const tier = (tierExplanation?.assignedTier || analysis?.classification?.tier || 4) as ActivityTier;

    return {
      assignedTier: tier,
      explanation: tierExplanation?.explanation as ActivityTeaching['tierExplanation']['explanation'] || {
        text: analysis?.classification?.tierReasoning || 'Tier assessment pending',
        citations: [],
      },
      benchmarksUsed: tierExplanation?.benchmarksUsed as ActivityTeaching['tierExplanation']['benchmarksUsed'] || [],
      whatMakesThisTier: tierExplanation?.whatMakesThisTier as ActivityTeaching['tierExplanation']['whatMakesThisTier'] || {
        text: 'Based on recognition level and impact',
        citations: [],
      },
      whatWouldChangeIt: tierExplanation?.whatWouldChangeIt as ActivityTeaching['tierExplanation']['whatWouldChangeIt'] || {
        text: 'Consider adding quantifiable metrics and leadership progression',
        citations: [],
      },
    };
  }

  /**
   * Normalize description optimization
   */
  private normalizeDescriptionOptimization(
    optimization: Record<string, unknown> | undefined,
    activity: ActivityWorkshopInput | undefined
  ): ActivityTeaching['descriptionOptimization'] {
    return {
      originalDescription: (optimization?.originalDescription as string) || activity?.description || '',
      optimizedDescription: (optimization?.optimizedDescription as string) || activity?.description || '',
      characterCount: (optimization?.characterCount as number) || (activity?.description?.length || 0),
      changesExplained: (optimization?.changesExplained as ActivityTeaching['descriptionOptimization']['changesExplained']) || [],
    };
  }

  /**
   * Normalize narrative guidance
   */
  private normalizeNarrativeGuidance(
    guidance: Record<string, unknown> | undefined
  ): ActivityTeaching['narrativeGuidance'] {
    return {
      howToTalkAboutThis: guidance?.howToTalkAboutThis as ActivityTeaching['narrativeGuidance']['howToTalkAboutThis'] || {
        text: 'Frame this activity in terms of growth and impact',
        citations: [],
      },
      uniqueAngle: (guidance?.uniqueAngle as string) || 'Focus on what makes your experience distinctive',
      connectionToStory: (guidance?.connectionToStory as string) || 'This activity connects to your broader narrative',
      interviewTips: (guidance?.interviewTips as string[]) || ['Be prepared to discuss specific examples of your contributions'],
    };
  }

  /**
   * Create fallback teaching when LLM fails
   */
  private createFallbackTeaching(
    activityId: string,
    input: ActivityWorkshopSessionInput,
    analysisContext: AnalysisContext
  ): ActivityTeaching {
    const activity = input.activities.find(a => a.id === activityId);
    const analysis = analysisContext.activities[activityId];

    return {
      activityId,
      tierExplanation: this.normalizeTierExplanation(undefined, analysis),
      strengthTeaching: analysis?.greenFlags?.map(f => ({
        strength: f.flag,
        whyItMatters: { text: f.admissionsValue, citations: [] },
        howToLeverage: 'Highlight this in your application',
        inApplications: 'Essays, interviews, and additional information',
      })) || [],
      improvementTeaching: analysis?.descriptionQuality?.issues?.map(issue => ({
        issue,
        whyItMatters: { text: 'This affects how admissions officers perceive your involvement', citations: [] },
        howToFix: 'Add specific details and quantifiable outcomes',
        exampleBefore: activity?.description?.substring(0, 50) || '',
        exampleAfter: 'Consider adding specific metrics and outcomes',
        priority: 'medium' as const,
      })) || [],
      descriptionOptimization: {
        originalDescription: activity?.description || '',
        optimizedDescription: activity?.description || '',
        characterCount: activity?.description?.length || 0,
        changesExplained: [],
      },
      narrativeGuidance: this.normalizeNarrativeGuidance(undefined),
    };
  }

  /**
   * Generate quick encouragements for strong activities
   */
  private async generateQuickEncouragements(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[]
  ): Promise<TeachingContext['quickEncouragements']> {
    if (activityIds.length === 0) return [];

    const prompt = this.buildEncouragementPrompt(input, storyContext, analysisContext, activityIds);

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt: `You are a warm, encouraging college counselor. Provide brief, genuine celebrations of strong activities. Be specific about what makes each activity excellent.`,
        userPrompt: prompt,
        maxTokens: 2000,
        temperature: 0.5,
      });

      return this.parseEncouragementResponse(response.content, activityIds);
    } catch (error) {
      console.error('[Stage2] Encouragement generation failed:', error);
      return activityIds.map(id => ({
        activityId: id,
        celebration: 'This is a strong activity that showcases your commitment.',
        strengthReason: 'Demonstrates sustained engagement and impact.',
      }));
    }
  }

  /**
   * Build encouragement prompt
   */
  private buildEncouragementPrompt(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[]
  ): string {
    const activities = activityIds.map(id => {
      const activity = input.activities.find(a => a.id === id);
      const analysis = analysisContext.activities[id];
      const storyRole = storyContext.activityStoryRoles.find(r => r.activityId === id);

      return `
- ${activity?.title} (Tier ${analysis?.classification?.tier})
  Description: "${activity?.description}"
  Story Role: ${storyRole?.storyRole}
  Green Flags: ${analysis?.greenFlags?.map(f => f.flag).join(', ') || 'Strong overall'}
`;
    }).join('\n');

    return `Provide brief, warm encouragements for these STRONG activities (no critique needed):

${activities}

Respond with JSON:
{
  "encouragements": [
    {
      "activityId": "id",
      "celebration": "2-3 sentences celebrating what's exceptional about this",
      "strengthReason": "1 sentence on why this works well",
      "quickTip": "Optional: one sentence if there's a tiny enhancement (not required)"
    }
  ]
}`;
  }

  /**
   * Parse encouragement response
   */
  private parseEncouragementResponse(
    response: string,
    activityIds: string[]
  ): TeachingContext['quickEncouragements'] {
    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      return (parsed.encouragements || []).map((e: Record<string, string>) => ({
        activityId: e.activityId,
        celebration: e.celebration || 'This is an excellent activity.',
        strengthReason: e.strengthReason || 'Shows strong engagement.',
        quickTip: e.quickTip,
      }));
    } catch (error) {
      return activityIds.map(id => ({
        activityId: id,
        celebration: 'This is a strong activity that showcases your commitment.',
        strengthReason: 'Demonstrates sustained engagement and impact.',
      }));
    }
  }

  /**
   * Generate portfolio-level teaching
   */
  private async generatePortfolioTeaching(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext
  ): Promise<TeachingContext['portfolioTeaching']> {
    // Build a quick synthesis from existing analysis
    return {
      narrativeTeaching: {
        currentState: analysisContext.portfolioTeachingNeeds.primaryIssue,
        recommendation: analysisContext.portfolioTeachingNeeds.strengthsToHighlight.join('. ') ||
          'Focus on strengthening the connections between your activities.',
        twoSentencePitch: `${storyContext.narrativeIdentity.storyEssence} Through ${storyContext.narrativeIdentity.primaryTheme}, they demonstrate authentic passion and impact.`,
      },
      coherenceTeaching: {
        currentScore: analysisContext.coherenceAnalysis.score,
        improvements: analysisContext.coherenceAnalysis.disconnectedActivities.length > 0
          ? [`Connect ${analysisContext.coherenceAnalysis.disconnectedActivities.map(d => d.activityId).join(', ')} to your main narrative`]
          : ['Your activities show good coherence - maintain this thread in your essays'],
      },
      strategicDirection: analysisContext.spikeAnalysis.hasSpike
        ? `Continue developing your ${analysisContext.spikeAnalysis.spikeType || 'specialized'} spike - this differentiates you.`
        : `Consider deepening your involvement in ${storyContext.narrativeIdentity.primaryTheme} to develop a clearer spike.`,
    };
  }

  /**
   * Calculate quality metrics for the teaching delivered
   */
  private calculateQualityMetrics(
    teachingDelivered: TeachingContext['teachingDelivered'],
    quickEncouragements: TeachingContext['quickEncouragements']
  ): TeachingContext['qualityMetrics'] {
    let citationsCount = 0;
    let examplesCount = 0;
    let totalDepthScore = 0;

    for (const td of teachingDelivered) {
      // Count citations
      citationsCount += td.teaching.tierExplanation.explanation.citations?.length || 0;
      citationsCount += td.teaching.strengthTeaching.reduce(
        (sum, s) => sum + (s.whyItMatters.citations?.length || 0), 0
      );

      // Count before/after examples
      examplesCount += td.teaching.improvementTeaching.filter(
        i => i.exampleBefore && i.exampleAfter
      ).length;

      // Calculate depth score
      const depthScore = td.teachingDepth === 'deep' ? 10 : td.teachingDepth === 'medium' ? 7 : 4;
      totalDepthScore += depthScore;
    }

    // Add encouragement depth
    totalDepthScore += quickEncouragements.length * 3;

    const totalItems = teachingDelivered.length + quickEncouragements.length;

    return {
      celebrationFirst: true, // Our prompts enforce this
      citationsIncluded: citationsCount,
      examplesIncluded: examplesCount,
      averageDepth: totalItems > 0 ? totalDepthScore / totalItems : 0,
    };
  }
}

// Export singleton
export const stage2ConditionalTeachingService = new Stage2ConditionalTeachingService();
