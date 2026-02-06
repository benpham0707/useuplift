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
import { activityCitationService, ActivityCitation } from '../activityCitationService';

// Import knowledge assembly service for deep, research-backed teaching
import {
  knowledgeAssemblyService,
  ActivityKnowledgeContext,
} from '../knowledgeAssemblyService';

// Import robust JSON parser
import { parseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';

// Import expert system prompts for deep counselor-level thinking
import {
  buildExpertTeachingPrompt,
  buildActivityExpertContext,
} from '../expertSystemPrompts';

// Import expert knowledge assembly
import {
  assembleExpertContext,
  ExpertKnowledgeContext,
} from '../expertCounselorKnowledgeBase';

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
  private readonly MODEL = 'claude-sonnet-4-5-20250929';
  private _accumulatedCost = 0;
  private _accumulatedTokens = { input: 0, output: 0 };

  private trackUsage(usage: { input_tokens?: number; output_tokens?: number } | undefined): void {
    if (!usage) return;
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    this._accumulatedTokens.input += inputTokens;
    this._accumulatedTokens.output += outputTokens;
    // Sonnet pricing: $3/M input, $15/M output
    this._accumulatedCost += (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  }

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
    // Reset cost accumulator for this run
    this._accumulatedCost = 0;
    this._accumulatedTokens = { input: 0, output: 0 };

    const deepTeachingIds = analysisContext.teachingCandidates.deepTeachingIds;
    const mediumTeachingIds = analysisContext.teachingCandidates.mediumTeachingIds;

    console.log(`[Stage2] Starting conditional teaching (v4.2 — parallel individual processing)`);
    console.log(`[Stage2] Deep candidates: ${deepTeachingIds.length}`);
    console.log(`[Stage2] Medium candidates: ${mediumTeachingIds.length}`);
    console.log(`[Stage2] Quick encouragement: ${analysisContext.teachingCandidates.quickEncouragementIds.length}`);

    const teachingDelivered: TeachingContext['teachingDelivered'] = [];
    const quickEncouragements: TeachingContext['quickEncouragements'] = [];
    const skippedActivities: TeachingContext['skippedActivities'] = [];

    // Step 1: Assemble knowledge contexts for ALL teaching candidates ONCE
    const allTeachingIds = [...deepTeachingIds, ...mediumTeachingIds];
    const knowledgeContexts: Map<string, ActivityKnowledgeContext> = new Map();
    let expertContext: ExpertKnowledgeContext | undefined;

    if (allTeachingIds.length > 0) {
      console.log(`[Stage2] Assembling enriched knowledge context for ${allTeachingIds.length} activities...`);

      // Build portfolio-level expert context once (shared)
      expertContext = assembleExpertContext({
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

      if (expertContext.constraintLevel) {
        console.log(`[Stage2] Constraint level detected: ${expertContext.constraintLevel.name} (Level ${expertContext.constraintLevel.level})`);
      }
      if (expertContext.narrativeArc) {
        console.log(`[Stage2] Narrative arc detected: ${expertContext.narrativeArc.name}`);
      }
      console.log(`[Stage2] Character traits: demonstrated=${expertContext.characterTraits.demonstrated.length}, missing=${expertContext.characterTraits.missing.length}`);

      // Assemble per-activity knowledge contexts
      for (const activityId of allTeachingIds) {
        const activity = input.activities.find(a => a.id === activityId);
        const analysis = analysisContext.activities[activityId];
        if (activity && analysis) {
          const knowledgeContext = knowledgeAssemblyService.assembleEnrichedKnowledgeContext(
            activity,
            analysis,
            expertContext,
            input.studentContext
          );
          knowledgeContexts.set(activityId, knowledgeContext);
          console.log(`[Stage2] Enriched knowledge assembled for "${activity.title}": ${knowledgeContext.issueTeaching.length} issues, ${knowledgeContext.citations.length} citations`);
        }
      }
    }

    // Step 2: Process ALL deep + medium activities in PARALLEL (no batch attempt)
    if (allTeachingIds.length > 0) {
      console.log(`[Stage2] Processing ${allTeachingIds.length} activities individually IN PARALLEL...`);

      // Build parallel tasks: each activity gets its own LLM call
      const parallelTasks = [
        ...deepTeachingIds.map(id => ({
          id,
          depth: 'deep' as const,
          promise: this.processSingleActivity(
            input, storyContext, analysisContext, id,
            knowledgeContexts.get(id), 'deep', expertContext
          ).catch(error => {
            console.error(`[Stage2] Failed to process ${id}, using knowledge fallback:`, error);
            return this.createKnowledgeBasedFallback(id, input, analysisContext, knowledgeContexts.get(id));
          }),
        })),
        ...mediumTeachingIds.map(id => ({
          id,
          depth: 'medium' as const,
          promise: this.processSingleActivity(
            input, storyContext, analysisContext, id,
            knowledgeContexts.get(id), 'medium', expertContext
          ).catch(error => {
            console.error(`[Stage2] Failed to process ${id}, using knowledge fallback:`, error);
            return this.createKnowledgeBasedFallback(id, input, analysisContext, knowledgeContexts.get(id));
          }),
        })),
      ];

      // Run ALL teaching calls in parallel
      const results = await Promise.all(parallelTasks.map(t => t.promise));

      // Map results to teachingDelivered with correct depth tags
      for (let i = 0; i < parallelTasks.length; i++) {
        const task = parallelTasks[i];
        const teaching = results[i];
        teachingDelivered.push({
          activityId: task.id,
          teachingDepth: task.depth,
          teaching,
        });
      }

      // Enrich with citations from knowledge contexts
      const enrichedTeachings = this.enrichTeachingsWithCitations(
        teachingDelivered.map(td => td.teaching),
        knowledgeContexts
      );
      for (let i = 0; i < teachingDelivered.length; i++) {
        teachingDelivered[i].teaching = enrichedTeachings[i];
      }
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
        tokensUsed: { ...this._accumulatedTokens },
        cost: this._accumulatedCost,
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
   *
   * KNOWLEDGE-DRIVEN APPROACH:
   * 1. Assemble knowledge context for each activity
   * 2. Inject knowledge into prompt (tier benchmarks, teaching bundles, citations)
   * 3. LLM applies knowledge (doesn't invent it)
   * 4. Post-process with citation attachment
   */
  private async generateBatchTeaching(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[],
    depth: 'deep' | 'medium'
  ): Promise<ActivityTeaching[]> {
    if (activityIds.length === 0) return [];

    // STEP 1: Assemble ENRICHED knowledge context for each activity
    // Uses expert counselor intelligence for deeper analysis
    console.log(`[Stage2] Assembling enriched knowledge context for ${activityIds.length} activities...`);
    const knowledgeContexts: Map<string, ActivityKnowledgeContext> = new Map();

    // Build portfolio-level expert context once (shared across all activities)
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

    if (expertContext.constraintLevel) {
      console.log(`[Stage2] Constraint level detected: ${expertContext.constraintLevel.name} (Level ${expertContext.constraintLevel.level})`);
    }
    if (expertContext.narrativeArc) {
      console.log(`[Stage2] Narrative arc detected: ${expertContext.narrativeArc.name}`);
    }
    console.log(`[Stage2] Character traits: demonstrated=${expertContext.characterTraits.demonstrated.length}, missing=${expertContext.characterTraits.missing.length}`);

    for (const activityId of activityIds) {
      const activity = input.activities.find(a => a.id === activityId);
      const analysis = analysisContext.activities[activityId];

      if (activity && analysis) {
        // Use enriched knowledge context — pass pre-built expert context to avoid redundant assembly
        const knowledgeContext = knowledgeAssemblyService.assembleEnrichedKnowledgeContext(
          activity,
          analysis,
          expertContext,
          input.studentContext
        );
        knowledgeContexts.set(activityId, knowledgeContext);

        console.log(`[Stage2] Enriched knowledge assembled for "${activity.title}": ${knowledgeContext.issueTeaching.length} issues, ${knowledgeContext.citations.length} citations`);
      }
    }

    // STEP 2: Build knowledge-enriched prompt
    const prompt = this.buildKnowledgeEnrichedPrompt(
      input,
      storyContext,
      analysisContext,
      activityIds,
      knowledgeContexts,
      depth
    );

    // Calculate timeout based on complexity - knowledge-enriched prompts need more time
    // Base: 180 seconds, plus 60 seconds per activity for deep teaching
    const timeoutMs = depth === 'deep'
      ? 180000 + (activityIds.length * 60000) // 3 min base + 1 min per activity
      : 120000 + (activityIds.length * 30000); // 2 min base + 30 sec per activity

    console.log(`[Stage2] Calling LLM with timeout: ${timeoutMs / 1000}s for ${activityIds.length} activities (${depth})`);

    // Calculate token limit based on activity count - need enough space for full JSON
    // Each activity needs ~3000-4000 tokens for deep teaching, ~1500-2000 for medium
    const tokensPerActivity = depth === 'deep' ? 4000 : 2000;
    const maxTokens = Math.min(16000, activityIds.length * tokensPerActivity + 1000); // Cap at 16k

    console.log(`[Stage2] Using maxTokens: ${maxTokens} for ${activityIds.length} activities (${depth})`);

    // Select system prompt: use expert prompt when expert context available
    const systemPrompt = expertContext
      ? buildExpertTeachingPrompt(expertContext, depth)
      : this.getKnowledgeDrivenSystemPrompt(depth);

    console.log(`[Stage2] Using ${expertContext ? 'EXPERT' : 'standard'} system prompt`);

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt,
        userPrompt: prompt,
        maxTokens,
        temperature: 0.3, // Lower temperature for more consistent application of knowledge
        timeoutMs, // Pass explicit timeout
      });

      this.trackUsage(response.usage);
      console.log(`[Stage2] LLM response received (${response.usage?.output_tokens || 0} tokens)`);

      // STEP 3: Parse and enrich with citations
      const teachings = this.parseTeachingResponse(response.content, activityIds, input, analysisContext, storyContext, expertContext);

      // Validate we got teachings for all activities
      if (teachings.length < activityIds.length) {
        console.log(`[Stage2] Partial response: got ${teachings.length}/${activityIds.length} activities, processing missing individually`);

        // Process missing activities individually
        const receivedIds = new Set(teachings.map(t => t.activityId));
        const missingIds = activityIds.filter(id => !receivedIds.has(id));

        if (missingIds.length > 0) {
          const additionalTeachings = await this.processActivitiesIndividually(
            input, storyContext, analysisContext, missingIds, knowledgeContexts, depth, expertContext
          );
          teachings.push(...additionalTeachings);
        }
      }

      // STEP 4: Post-process with citation attachment from knowledge contexts
      return this.enrichTeachingsWithCitations(teachings, knowledgeContexts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Stage2] Batch teaching failed:`, errorMessage);

      // Check if it's a JSON parsing error - if so, try processing individually
      if (errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Colon expected')) {
        console.log(`[Stage2] JSON parsing failed, processing activities individually...`);
        return this.processActivitiesIndividually(input, storyContext, analysisContext, activityIds, knowledgeContexts, depth, expertContext);
      }

      // Check if it's a timeout - if so, try with a simpler prompt
      if (errorMessage.includes('timed out')) {
        console.log(`[Stage2] Timeout detected, processing activities individually...`);
        return this.processActivitiesIndividually(input, storyContext, analysisContext, activityIds, knowledgeContexts, depth, expertContext);
      }

      // For other errors, use knowledge-based fallback
      console.log(`[Stage2] Using knowledge-based fallback`);
      return activityIds.map(id => this.createKnowledgeBasedFallback(id, input, analysisContext, knowledgeContexts.get(id)));
    }
  }

  /**
   * Generate simplified teaching as retry mechanism
   * Uses a more compact prompt that's less likely to timeout
   */
  private async generateSimplifiedTeaching(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[],
    knowledgeContexts: Map<string, ActivityKnowledgeContext>,
    depth: 'deep' | 'medium'
  ): Promise<ActivityTeaching[]> {
    console.log(`[Stage2] Generating simplified teaching for ${activityIds.length} activities...`);

    // Build a more compact prompt without the full knowledge context
    const activities = activityIds.map(id => {
      const activity = input.activities.find(a => a.id === id);
      const analysis = analysisContext.activities[id];
      if (!activity || !analysis) return null;

      return {
        id,
        title: activity.title,
        description: activity.description,
        role: activity.role,
        tier: analysis.classification.tier,
        issues: analysis.descriptionQuality.issues.slice(0, 3), // Top 3 issues only
        strengths: analysis.descriptionQuality.strengths.slice(0, 2),
        redFlags: analysis.redFlags.slice(0, 2).map(f => f.flag),
        greenFlags: analysis.greenFlags.slice(0, 2).map(f => f.flag),
      };
    }).filter(Boolean);

    const simplifiedPrompt = `Provide teaching for these activities. Be concise but helpful.

STUDENT: ${storyContext.narrativeIdentity.storyEssence}

ACTIVITIES:
${activities.map(a => `
- ${a!.title} (ID: ${a!.id})
  Description: "${a!.description}"
  Tier: ${a!.tier}
  Issues: ${a!.issues.join(', ') || 'None'}
  Strengths: ${a!.strengths.join(', ') || 'General'}
`).join('\n')}

For each activity, provide JSON:
{
  "teachings": [
    {
      "activityId": "id",
      "celebration": { "headline": "What's great about this", "strengths": ["strength1", "strength2"] },
      "tierExplanation": {
        "assignedTier": 1-4,
        "explanation": { "text": "Why this tier", "citations": [] },
        "benchmarksUsed": [],
        "whatMakesThisTier": { "text": "Evidence", "citations": [] },
        "whatWouldChangeIt": { "text": "How to improve", "citations": [] }
      },
      "strengthTeaching": [{ "strength": "main strength", "whyItMatters": { "text": "why", "citations": [] }, "howToLeverage": "how", "inApplications": "where" }],
      "improvementTeaching": [{ "issue": "main issue", "whyItMatters": { "text": "why", "citations": [] }, "howToFix": "steps", "exampleBefore": "before", "exampleAfter": "after", "priority": "high" }],
      "descriptionOptimization": { "originalDescription": "original", "optimizedDescription": "improved (≤150 chars)", "characterCount": 145, "changesExplained": [{ "change": "what", "reason": "why" }] },
      "narrativeGuidance": { "howToTalkAboutThis": { "text": "framing", "citations": [] }, "uniqueAngle": "angle", "connectionToStory": "connection", "interviewTips": ["tip1"] }
    }
  ]
}`;

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt: `You are a warm, encouraging college essay coach. Provide helpful teaching that celebrates strengths first, then offers specific improvements with before/after examples.`,
        userPrompt: simplifiedPrompt,
        maxTokens: 4000,
        temperature: 0.3,
        timeoutMs: 120000, // 2 minutes for simplified prompt
      });

      this.trackUsage(response.usage);
      console.log(`[Stage2] Simplified response received`);
      const teachings = this.parseTeachingResponse(response.content, activityIds, input, analysisContext, storyContext, expertContext);
      return this.enrichTeachingsWithCitations(teachings, knowledgeContexts);
    } catch (retryError) {
      console.error(`[Stage2] Simplified teaching also failed:`, retryError);
      // Final fallback to knowledge-based teaching
      return activityIds.map(id => this.createKnowledgeBasedFallback(id, input, analysisContext, knowledgeContexts.get(id)));
    }
  }

  /**
   * Process activities individually when batch processing fails
   *
   * This is the RELIABILITY FALLBACK - ensures we always get LLM-quality teaching
   * by processing one activity at a time if batch processing has JSON issues
   */
  private async processActivitiesIndividually(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[],
    knowledgeContexts: Map<string, ActivityKnowledgeContext>,
    depth: 'deep' | 'medium',
    expertContext?: ExpertKnowledgeContext
  ): Promise<ActivityTeaching[]> {
    console.log(`[Stage2] Processing ${activityIds.length} activities individually IN PARALLEL for reliability`);

    // Process all activities in parallel for speed
    const results = await Promise.all(
      activityIds.map(async (activityId) => {
        try {
          console.log(`[Stage2] Processing activity: ${activityId}`);
          const teaching = await this.processSingleActivity(
            input,
            storyContext,
            analysisContext,
            activityId,
            knowledgeContexts.get(activityId),
            depth,
            expertContext
          );
          return teaching;
        } catch (error) {
          console.error(`[Stage2] Failed to process ${activityId}, using knowledge fallback:`, error);
          return this.createKnowledgeBasedFallback(activityId, input, analysisContext, knowledgeContexts.get(activityId));
        }
      })
    );

    return results;
  }

  /**
   * Process a single activity with focused LLM call
   *
   * Uses a simplified prompt to ensure JSON completeness
   */
  private async processSingleActivity(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityId: string,
    knowledge: ActivityKnowledgeContext | undefined,
    depth: 'deep' | 'medium',
    expertContext?: ExpertKnowledgeContext
  ): Promise<ActivityTeaching> {
    const activity = input.activities.find(a => a.id === activityId);
    const analysis = analysisContext.activities[activityId];

    if (!activity || !analysis) {
      throw new Error(`Activity ${activityId} not found`);
    }

    // Build expert context section for this specific activity
    const activityExpertSection = expertContext
      ? buildActivityExpertContext(expertContext, activityId, activity.description)
      : '';

    // Build a focused prompt for just this one activity
    const prompt = `Provide ${depth} teaching for this activity.

STUDENT CONTEXT:
- Story: ${storyContext.narrativeIdentity.storyEssence}
- Intended Major: ${input.studentContext?.intendedMajor || 'Not specified'}
${expertContext?.constraintLevel ? `- Constraint Level: ${expertContext.constraintLevel.name} (Level ${expertContext.constraintLevel.level}) — ${expertContext.constraintLevel.description}` : ''}
${expertContext?.narrativeArc ? `- Narrative Arc: ${expertContext.narrativeArc.name} — ${expertContext.narrativeArc.description}` : ''}

ACTIVITY: ${activity.title}
- Description: "${activity.description}"
- Role: ${activity.role || 'Member'}
- Tier: ${analysis.classification.tier}
- Issues: ${analysis.descriptionQuality.issues.join('; ') || 'None major'}
- Strengths: ${analysis.descriptionQuality.strengths.join('; ') || 'Good overall'}
- Green Flags: ${analysis.greenFlags.map(f => f.flag).join('; ') || 'None'}
- Red Flags: ${analysis.redFlags.map(f => f.flag).join('; ') || 'None'}

${knowledge ? `KNOWLEDGE CONTEXT:
- Tier Criteria: ${knowledge.saraHarbersonCriteria.definition}
- Category: ${knowledge.categoryInsights.categoryName}
- Top Issues to Address: ${knowledge.issueTeaching.slice(0, 2).map(i => i.theProblem.headline).join('; ')}` : ''}

${activityExpertSection ? `EXPERT COUNSELOR INTELLIGENCE:
${activityExpertSection}` : ''}

TEACHING PROTOCOL:
1. CELEBRATE FIRST — Acknowledge what's genuinely working. Be specific.
2. EDUCATE — Explain WHY this matters using admissions psychology (the 8-minute read, committee pitch test).
3. TRANSFORM — Show concrete before/after. Quote their text, then show the improved version.
4. CONNECT — Link to their broader narrative and how this activity fits their story.

Respond with JSON for ONE activity:
{
  "activityId": "${activityId}",
  "celebration": {
    "headline": "One celebratory sentence about what's great",
    "strengths": ["strength1", "strength2"]
  },
  "tierExplanation": {
    "assignedTier": ${analysis.classification.tier},
    "explanation": { "text": "Why this tier - use Sara Harberson criteria", "citations": [] },
    "benchmarksUsed": [{ "tier": ${analysis.classification.tier}, "benchmark": "criteria met", "source": "Sara Harberson", "studentMeets": true, "evidence": "specific evidence" }],
    "whatMakesThisTier": { "text": "specific evidence from their description", "citations": [] },
    "whatWouldChangeIt": { "text": "actionable steps to improve tier", "citations": [] }
  },
  "strengthTeaching": [{
    "strength": "main strength",
    "whyItMatters": { "text": "why admissions cares - use AO psychology", "citations": [] },
    "howToLeverage": "how to use this",
    "inApplications": "where to highlight"
  }],
  "improvementTeaching": [{
    "issue": "main issue to fix",
    "whyItMatters": { "text": "why this matters - reference committee pitch test or 8-minute read", "citations": [] },
    "howToFix": "step by step guidance",
    "exampleBefore": "quote their weak text here",
    "exampleAfter": "your improved version here",
    "priority": "high"
  }],
  "descriptionOptimization": {
    "originalDescription": "${activity.description.replace(/"/g, '\\"').substring(0, 200)}",
    "optimizedDescription": "your improved version (max 150 chars)",
    "characterCount": 145,
    "changesExplained": [{ "change": "what changed", "reason": "why" }]
  },
  "narrativeGuidance": {
    "howToTalkAboutThis": { "text": "how to discuss in interviews", "citations": [] },
    "uniqueAngle": "what makes this distinctive",
    "connectionToStory": "how it fits their narrative",
    "interviewTips": ["tip 1", "tip 2"]
  }
}`;

    // Select system prompt: use expert prompt for individual activities too
    const systemPrompt = expertContext
      ? buildExpertTeachingPrompt(expertContext, depth)
      : `You are a warm, encouraging college admissions advisor. Provide teaching that celebrates strengths first, then offers specific improvements with before/after examples. Output valid JSON only.`;

    const response = await callClaude({
      model: this.MODEL,
      systemPrompt,
      userPrompt: prompt,
      maxTokens: depth === 'deep' ? 4000 : 2500,
      temperature: 0.3,
      timeoutMs: 120000, // 2 minutes per activity - reliability over speed
    });

    this.trackUsage(response.usage);

    // Parse the single activity response
    const parsed = parseClaudeJSON<ActivityTeaching>(response.content, 'SingleActivityTeaching');

    // Ensure activityId is set
    parsed.activityId = activityId;

    // Normalize the parsed response — improvements first so we can synthesize optimization
    const normalizedImprovements = (parsed.improvementTeaching || []).map(i =>
      this.normalizeImprovementTeaching(i as unknown as Record<string, unknown>, activity)
    );

    return {
      activityId,
      celebration: parsed.celebration,
      tierExplanation: this.normalizeTierExplanation(parsed.tierExplanation as unknown as Record<string, unknown>, analysis),
      strengthTeaching: (parsed.strengthTeaching || []).map(s =>
        this.normalizeStrengthTeaching(s as unknown as Record<string, unknown>)
      ),
      improvementTeaching: normalizedImprovements,
      descriptionOptimization: this.normalizeDescriptionOptimization(
        parsed.descriptionOptimization as unknown as Record<string, unknown>,
        activity,
        normalizedImprovements
      ),
      narrativeGuidance: this.normalizeNarrativeGuidance(
        parsed.narrativeGuidance as unknown as Record<string, unknown>,
        {
          storyEssence: storyContext.narrativeIdentity.storyEssence,
          narrativeArc: expertContext?.narrativeArc?.name,
          constraintLevel: expertContext?.constraintLevel?.name,
          activityTitle: activity?.title,
        }
      ),
    };
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
   * Build knowledge-enriched prompt that grounds LLM in research-backed content
   */
  private buildKnowledgeEnrichedPrompt(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityIds: string[],
    knowledgeContexts: Map<string, ActivityKnowledgeContext>,
    depth: 'deep' | 'medium'
  ): string {
    const wordRange = depth === 'deep'
      ? TEACHING_CONFIG.deepTeachingWords
      : TEACHING_CONFIG.mediumTeachingWords;

    // Format student story context
    const storySection = `
## STUDENT STORY CONTEXT
Archetype: ${storyContext.narrativeIdentity.archetype}
Story Essence: ${storyContext.narrativeIdentity.storyEssence}
Primary Theme: ${storyContext.narrativeIdentity.primaryTheme}
${storyContext.spikeHypothesis.likelySpike ? `Spike Area: ${storyContext.spikeHypothesis.spikeArea} (${storyContext.spikeHypothesis.maturity})` : 'Spike: Developing'}
Intended Major: ${input.studentContext?.intendedMajor || 'Not specified'}
Target Schools: ${input.studentContext?.targetSchools?.join(', ') || 'Not specified'}
`;

    // Format each activity with its knowledge context
    const activitiesSections = activityIds.map(id => {
      const activity = input.activities.find(a => a.id === id);
      const analysis = analysisContext.activities[id];
      const knowledge = knowledgeContexts.get(id);
      const priority = analysisContext.teachingPriorities.find(p => p.activityId === id);

      if (!activity || !analysis || !knowledge) return '';

      // Format the knowledge context for this activity
      const knowledgePrompt = knowledgeAssemblyService.formatForPrompt(knowledge);

      return `
${'='.repeat(80)}
ACTIVITY: ${activity.title} (ID: ${id})
${'='.repeat(80)}

### STUDENT'S CURRENT DESCRIPTION:
"${activity.description}"
(${activity.description.length} characters)

### ACTIVITY DETAILS:
- Role: ${activity.role || 'Member'}
- Organization: ${activity.organization || 'N/A'}
- Time Commitment: ${activity.hoursPerWeek}hrs/week × ${activity.weeksPerYear}weeks/year × ${activity.yearsInvolved} years
- Grade Levels: ${activity.gradeLevels?.join(', ') || 'Not specified'}

### ANALYSIS RESULTS:
- Current Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence} confidence)
- Tier Reasoning: ${analysis.classification.tierReasoning}
- Description Quality Score: ${analysis.descriptionQuality.overallScore}/100
- Detected Issues: ${analysis.descriptionQuality.issues.join('; ') || 'None major'}
- Detected Strengths: ${analysis.descriptionQuality.strengths.join('; ') || 'None identified'}
- Red Flags: ${analysis.redFlags.map(f => `${f.flag} (${f.severity})`).join('; ') || 'None'}
- Green Flags: ${analysis.greenFlags.map(f => f.flag).join('; ') || 'None'}

### TEACHING PRIORITY: ${priority?.priority || 'Standard'} - ${priority?.reason || 'General improvement needed'}
Focus Areas: ${priority?.teachingFocus?.join(', ') || 'Description quality, tier justification'}

### RESEARCH-BACKED KNOWLEDGE FOR THIS ACTIVITY:
${knowledgePrompt}

${'─'.repeat(80)}`;
    }).join('\n\n');

    return `You are providing ${depth} teaching for ${activityIds.length} activities.

${storySection}

## YOUR TASK

For each activity below, you have been provided with:
1. **Sara Harberson tier criteria** - Use EXACTLY these criteria to explain tier placement
2. **Category-specific benchmarks** - Reference these real numbers and examples
3. **Teaching bundles for detected issues** - Follow THE PROBLEM → WHY THIS WORKS → WHAT TO DO structure
4. **Field expectations** - Connect advice to their intended major
5. **Citations** - Include citation markers where evidence supports claims

IMPORTANT INSTRUCTIONS:
- APPLY the knowledge provided - don't invent different benchmarks or criteria
- REFERENCE specific numbers from the benchmarks (e.g., "USAMO has ~270 qualifiers nationally")
- USE the teaching bundle structure for each detected issue
- INCLUDE citation markers like {{cite_1}} where the provided evidence supports your claims
- BE SPECIFIC - use their exact words from the description in before/after examples
- CELEBRATE first, then teach - maintain warm, encouraging tone

## ACTIVITIES TO TEACH:
${activitiesSections}

## OUTPUT REQUIREMENTS

Word count per activity: ${wordRange.min}-${wordRange.max} words

**CRITICAL**: Your JSON must follow this EXACT structure. Each field is required.

{
  "teachings": [
    {
      "activityId": "id",

      "celebration": {
        "headline": "One powerful sentence celebrating their strongest aspect (be genuine, be specific)",
        "strengths": ["List 2-3 specific things working well, citing green flags and analysis"],
        "tone": "This MUST come first. Make them feel seen and appreciated before any critique."
      },

      "tierExplanation": {
        "assignedTier": 1-4,
        "explanation": {
          "text": "Start with celebration, then explain tier using EXACT Sara Harberson criteria from knowledge base. Quote specific benchmarks like 'USAMO has ~270 qualifiers nationally' from the provided context. Never invent statistics.",
          "citations": []
        },
        "benchmarksUsed": [
          {
            "tier": "The tier level",
            "benchmark": "COPY EXACT benchmark text from SARA HARBERSON TIER CRITERIA section above",
            "source": "Sara Harberson Framework",
            "studentMeets": true,
            "evidence": "Quote from their description proving they meet this"
          },
          {
            "tier": "Next tier level",
            "benchmark": "What they'd need for next tier FROM THE KNOWLEDGE BASE",
            "source": "Sara Harberson Framework",
            "studentMeets": false,
            "gap": "Specific gap: what they're missing"
          }
        ],
        "whatMakesThisTier": {
          "text": "Map their SPECIFIC description to the tier criteria. Quote their actual achievements.",
          "citations": []
        },
        "whatWouldChangeIt": {
          "text": "Concrete, actionable steps to reach next tier. Use benchmarks from knowledge base.",
          "citations": []
        }
      },

      "strengthTeaching": [
        {
          "strength": "Specific strength identified (from green flags)",
          "theProblem": "What would be lost if they didn't highlight this properly",
          "whyItMatters": {
            "text": "Use psychology/research from teaching bundles: WHY admissions officers value this",
            "citations": []
          },
          "howToLeverage": "Specific actions to maximize this strength",
          "inApplications": "Exactly where and how to highlight (essays, interview, additional info)"
        }
      ],

      "improvementTeaching": [
        {
          "issue": "Exact issue type from teaching bundle (e.g., 'vague_description')",

          "theProblem": {
            "headline": "COPY the headline from the teaching bundle",
            "explanation": "How this specifically manifests in THEIR description",
            "admissionsImpact": "COPY admissions_impact from teaching bundle",
            "inTheirDescription": "Quote the EXACT problematic text from their description"
          },

          "whyThisWorks": {
            "psychology": "COPY the psychology principle from teaching bundle",
            "research": "COPY the research_insight from teaching bundle",
            "quote": "Include the admissions_quote if available",
            "source": "Include the quote_source"
          },

          "whatToDo": {
            "principle": "The core principle for fixing this",
            "steps": [
              "Step 1: Specific action they can take",
              "Step 2: Another specific action",
              "Step 3: How to verify it worked"
            ]
          },

          "transformation": {
            "before": "QUOTE their EXACT text that has this issue (copy from their description)",
            "after": "Your improved version applying ALL the principles from the teaching bundle",
            "whyItWorks": "Explain exactly what changed and why it's more effective",
            "characterCount": { "before": 45, "after": 92 }
          },

          "priority": "high|medium|low"
        }
      ],

      "descriptionOptimization": {
        "originalDescription": "Their COMPLETE current description (exact copy)",
        "optimizedDescription": "Your COMPLETE improved version (must be ≤150 characters for Common App)",
        "characterCount": 145,
        "transformationBreakdown": [
          {
            "originalPhrase": "Exact phrase from original",
            "newPhrase": "Your replacement",
            "principleApplied": "Which teaching bundle principle this uses",
            "impact": "Why this change matters"
          }
        ]
      },

      "narrativeGuidance": {
        "howToTalkAboutThis": {
          "text": "Framing advice: how to discuss this activity in interviews and essays",
          "citations": []
        },
        "uniqueAngle": "What makes THEIR version of this activity distinctive",
        "connectionToStory": "How this activity fits their ${storyContext.narrativeIdentity.archetype} narrative",
        "essayPotential": "Specific essay angle or moment that could come from this activity",
        "interviewTips": [
          "Specific tip 1 based on common mistakes from category insights",
          "Specific tip 2 about what to emphasize"
        ],
        "commonMistakesToAvoid": ["From the category insights common_mistakes section"]
      }
    }
  ]
}`;
  }

  /**
   * Get knowledge-driven system prompt
   *
   * ENHANCED: Follows PIQ Workshop's proven teaching flow structure
   */
  private getKnowledgeDrivenSystemPrompt(depth: 'deep' | 'medium'): string {
    return `You are a world-class college admissions advisor who teaches students how to present their activities with maximum impact.

## YOUR TEACHING PHILOSOPHY

You believe that every student has done meaningful work—the challenge is helping them articulate it. Your role is to APPLY the research-backed knowledge provided to each student's specific situation, transforming generic descriptions into memorable, impactful ones.

## CRITICAL RULES

1. **KNOWLEDGE APPLICATION (NOT INVENTION)**
   - You have access to comprehensive knowledge bases for each activity
   - USE the Sara Harberson tier criteria EXACTLY as provided
   - APPLY the teaching bundle structures (THE PROBLEM → WHY THIS WORKS → WHAT TO DO)
   - QUOTE the specific benchmarks and statistics from the knowledge context
   - DO NOT invent statistics, criteria, or benchmarks—use ONLY what's provided

2. **TEACHING STRUCTURE (FOLLOW EXACTLY)**

   For each issue you address, structure your teaching as:

   **THE PROBLEM:**
   - State the headline from the teaching bundle
   - Explain why this matters for admissions (use the admissions_impact provided)
   - Show how it manifests in THEIR specific description

   **WHY THIS WORKS:**
   - Cite the psychology principle from the bundle
   - Reference the research insight
   - Include the admissions quote if provided

   **WHAT TO DO:**
   - Give the principle
   - Provide specific, numbered steps
   - Show THEIR before text → YOUR improved after text
   - Explain WHY the transformation works

3. **TRANSFORMATION REQUIREMENTS**

   Every improvement teaching MUST include:
   - **exampleBefore**: The EXACT weak text from their description (quote directly)
   - **exampleAfter**: Your improved version that:
     * Applies the teaching principle
     * Uses specific numbers where possible
     * Keeps within Common App character limits
     * Preserves their authentic voice
   - **whyItWorks**: Connect to the psychology/research from the teaching bundle

4. **TIER EXPLANATION REQUIREMENTS**

   When explaining tier placement:
   - Reference the EXACT Sara Harberson definition provided
   - List which specific criteria they meet or miss
   - Provide concrete steps to reach the next tier
   - Use the benchmarks from the knowledge context (don't make up numbers)

5. **TONE: CELEBRATE → TEACH → TRANSFORM**

   Order matters:
   1. FIRST: Genuine celebration of what's working (find the green flags)
   2. THEN: Research-backed teaching on what to improve
   3. FINALLY: Concrete transformation with before/after

6. **CITATION MARKERS**
   - Use {{cite_N}} markers where the knowledge base supports your claims
   - This makes your teaching verifiable and builds student trust

## QUALITY STANDARDS

${depth === 'deep' ? `
**DEEP TEACHING (600-1000 words per activity):**
- Address EVERY issue from the teaching bundles
- Multiple before/after examples per issue
- Full tier explanation with all benchmark criteria
- Complete upgrade pathway to next tier
- Connect to student's intended major and story
- Interview preparation tips for this activity
- How to discuss this in essays
` : `
**MEDIUM TEACHING (300-500 words per activity):**
- Address the TOP 2-3 priority issues
- One strong before/after example per issue
- Clear tier explanation with key criteria
- Most impactful upgrade step
- Keep immediately actionable
`}

## OUTPUT FORMAT

Your output MUST be valid JSON. Structure each teaching to maximize depth and utility while following the exact schema provided in the prompt.

Remember: Students are counting on you to transform their applications. The knowledge is provided—your job is to apply it with precision, warmth, and expertise.`;
  }

  /**
   * Enrich teachings with citations from knowledge contexts
   */
  private enrichTeachingsWithCitations(
    teachings: ActivityTeaching[],
    knowledgeContexts: Map<string, ActivityKnowledgeContext>
  ): ActivityTeaching[] {
    return teachings.map(teaching => {
      const knowledge = knowledgeContexts.get(teaching.activityId);
      if (!knowledge) return teaching;

      // Enrich tier explanation with citations
      if (teaching.tierExplanation.explanation.citations.length === 0 && knowledge.citations.length > 0) {
        const tierCitations = knowledge.citations.filter(c => c.type === 'tier_justification');
        teaching.tierExplanation.explanation.citations = tierCitations.slice(0, 2);
      }

      // Enrich improvement teaching with citations
      teaching.improvementTeaching = teaching.improvementTeaching.map(imp => {
        if (imp.whyItMatters.citations.length === 0) {
          // Find relevant citation from knowledge
          const relevantCitation = knowledge.citations.find(
            c => c.relevance.toLowerCase().includes(imp.issue.toLowerCase().split(' ')[0])
          );
          if (relevantCitation) {
            imp.whyItMatters.citations = [relevantCitation];
          }
        }
        return imp;
      });

      // Enrich strength teaching with citations
      teaching.strengthTeaching = teaching.strengthTeaching.map(strength => {
        if (strength.whyItMatters.citations.length === 0) {
          const greenFlagCitation = knowledge.citations.find(c => c.type === 'green_flag');
          if (greenFlagCitation) {
            strength.whyItMatters.citations = [greenFlagCitation];
          }
        }
        return strength;
      });

      return teaching;
    });
  }

  /**
   * Create knowledge-based fallback when LLM fails
   * Uses the knowledge assembly directly without LLM
   */
  private createKnowledgeBasedFallback(
    activityId: string,
    input: ActivityWorkshopSessionInput,
    analysisContext: AnalysisContext,
    knowledge: ActivityKnowledgeContext | undefined
  ): ActivityTeaching {
    const activity = input.activities.find(a => a.id === activityId);
    const analysis = analysisContext.activities[activityId];

    if (!knowledge) {
      return this.createFallbackTeaching(activityId, input, analysisContext);
    }

    // Build teaching directly from knowledge context
    const tier = knowledge.saraHarbersonCriteria.tier;

    return {
      activityId,
      tierExplanation: {
        assignedTier: tier,
        explanation: {
          text: `This activity is classified as ${knowledge.saraHarbersonCriteria.tierName}. ${knowledge.saraHarbersonCriteria.definition} Based on the ${knowledge.categoryInsights.categoryName} category, ${knowledge.categoryInsights.competitiveContext}`,
          citations: knowledge.citations.filter(c => c.type === 'tier_justification').slice(0, 2),
        },
        benchmarksUsed: knowledge.saraHarbersonCriteria.evidence.slice(0, 3).map((ev, i) => ({
          tier,
          benchmark: ev,
          source: 'Sara Harberson Framework',
          studentMeets: i === 0, // Assume meets first criterion
          gap: i > 0 ? 'Opportunity for improvement' : null,
        })),
        whatMakesThisTier: {
          text: `${knowledge.categoryInsights.categoryName} activities at Tier ${tier} typically demonstrate: ${knowledge.saraHarbersonCriteria.examples.slice(0, 2).join('; ')}`,
          citations: [],
        },
        whatWouldChangeIt: {
          text: tier > 1
            ? `To reach Tier ${tier - 1}, focus on: ${knowledge.tierBenchmarks.find(t => t.tier === (tier - 1) as 1|2|3|4)?.metrics.slice(0, 2).join('; ') || 'higher-level recognition'}`
            : 'This is already at the highest tier. Focus on depth and authenticity.',
          citations: [],
        },
      },
      strengthTeaching: analysis?.greenFlags?.slice(0, 2).map(f => ({
        strength: f.flag,
        whyItMatters: {
          text: f.admissionsValue || 'This demonstrates authentic engagement.',
          citations: knowledge.citations.filter(c => c.type === 'green_flag').slice(0, 1),
        },
        howToLeverage: 'Highlight this in your application materials.',
        inApplications: 'Essays, interviews, and additional information section.',
      })) || [],
      improvementTeaching: knowledge.issueTeaching.slice(0, 3).map(issue => ({
        issue: issue.theProblem.headline,
        whyItMatters: {
          text: `${issue.theProblem.explanation} ${issue.theProblem.admissionsImpact}`,
          citations: [],
        },
        howToFix: `${issue.whatToDo.principle} Steps: ${issue.whatToDo.steps.slice(0, 2).join('; ')}`,
        exampleBefore: issue.examples[0]?.before || activity?.description?.substring(0, 50) || '',
        exampleAfter: issue.examples[0]?.after || 'Add specific metrics and outcomes',
        priority: issue.metadata.difficulty === 'simple' ? 'high' : 'medium',
      })),
      descriptionOptimization: {
        originalDescription: activity?.description || '',
        optimizedDescription: activity?.description || '', // Can't optimize without LLM
        characterCount: activity?.description?.length || 0,
        changesExplained: knowledge.issueTeaching.length > 0
          ? [{ change: 'Apply teaching principles', reason: knowledge.issueTeaching[0].whatToDo.principle }]
          : [],
      },
      narrativeGuidance: {
        howToTalkAboutThis: {
          text: `Frame this ${knowledge.categoryInsights.categoryName} activity by focusing on ${knowledge.categoryInsights.topAchievements[0] || 'your unique contribution'}.`,
          citations: [],
        },
        uniqueAngle: knowledge.fieldExpectations?.relevanceAssessment?.alignmentReason ||
          'Focus on what makes your experience distinctive.',
        connectionToStory: `This activity connects to your broader narrative through ${knowledge.fieldExpectations?.majorName || 'your academic interests'}.`,
        interviewTips: knowledge.categoryInsights.commonMistakes.slice(0, 2).map(m => `Avoid: ${m}`),
      },
    };
  }

  /**
   * Parse teaching response using robust JSON parser
   *
   * ENHANCED: Handles the deeper schema with celebration, theProblem, whyThisWorks structures
   */
  private parseTeachingResponse(
    response: string,
    activityIds: string[],
    input: ActivityWorkshopSessionInput,
    analysisContext: AnalysisContext,
    storyContext?: StoryContext,
    expertContext?: ExpertKnowledgeContext
  ): ActivityTeaching[] {
    try {
      // Use robust JSON parser that handles LLM output quirks
      const parsed = parseClaudeJSON<{ teachings: Array<Record<string, unknown>> }>(
        response,
        'Stage2Teaching'
      );

      if (!parsed.teachings || !Array.isArray(parsed.teachings)) {
        throw new Error('Invalid response structure - missing teachings array');
      }

      // Build valid ID set for reconciliation
      const validIdSet = new Set(activityIds);

      return parsed.teachings.map((t: Record<string, unknown>, index: number) => {
        let activityId = (t.activityId as string) || (t.activity_id as string) || '';

        // Reconcile LLM-generated IDs back to actual input IDs
        if (!validIdSet.has(activityId)) {
          // Strategy 1: Positional mapping (LLM usually returns in same order)
          if (index < activityIds.length) {
            console.log(`[Stage2] ID reconciliation: "${activityId}" → "${activityIds[index]}" (positional)`);
            activityId = activityIds[index];
          } else {
            // Strategy 2: Fuzzy substring match
            const match = activityIds.find(validId => {
              const normalizedLlm = activityId.toLowerCase().replace(/[_\s-]/g, '');
              const normalizedValid = validId.toLowerCase().replace(/[_\s-]/g, '');
              return normalizedLlm.includes(normalizedValid) || normalizedValid.includes(normalizedLlm);
            });
            if (match) {
              console.log(`[Stage2] ID reconciliation: "${activityId}" → "${match}" (fuzzy)`);
              activityId = match;
            }
          }
        }

        const activity = input.activities.find(a => a.id === activityId);
        const analysis = analysisContext.activities[activityId];

        // Normalize celebration (new field)
        const celebration = t.celebration as Record<string, unknown> | undefined;

        // Normalize improvement teaching with deeper structure
        const rawImprovementTeaching = (t.improvementTeaching || []) as Array<Record<string, unknown>>;
        const normalizedImprovementTeaching = rawImprovementTeaching.map(imp =>
          this.normalizeImprovementTeaching(imp, activity)
        );

        // Normalize strength teaching with deeper structure
        const rawStrengthTeaching = (t.strengthTeaching || []) as Array<Record<string, unknown>>;
        const normalizedStrengthTeaching = rawStrengthTeaching.map(str =>
          this.normalizeStrengthTeaching(str)
        );

        return {
          activityId,
          // Add celebration if present
          celebration: celebration ? {
            headline: celebration.headline as string || '',
            strengths: (celebration.strengths as string[]) || [],
          } : undefined,
          tierExplanation: this.normalizeTierExplanation(t.tierExplanation, analysis),
          strengthTeaching: normalizedStrengthTeaching,
          improvementTeaching: normalizedImprovementTeaching,
          upgradePathway: t.upgradePathway,
          descriptionOptimization: this.normalizeDescriptionOptimization(
            t.descriptionOptimization,
            activity,
            normalizedImprovementTeaching
          ),
          narrativeGuidance: this.normalizeNarrativeGuidance(
            t.narrativeGuidance,
            {
              storyEssence: storyContext?.narrativeIdentity?.storyEssence,
              narrativeArc: expertContext?.narrativeArc?.name,
              constraintLevel: expertContext?.constraintLevel?.name,
              activityTitle: activity?.title,
            }
          ),
        } as ActivityTeaching;
      });
    } catch (error) {
      console.error('[Stage2] Failed to parse teaching response:', error);
      return activityIds.map(id => this.createFallbackTeaching(id, input, analysisContext));
    }
  }

  /**
   * Normalize improvement teaching with enhanced deep structure
   */
  private normalizeImprovementTeaching(
    imp: Record<string, unknown>,
    activity: ActivityWorkshopInput | undefined
  ): ActivityTeaching['improvementTeaching'][number] {
    // Handle both old format (flat) and new format (nested theProblem, whyThisWorks, etc.)
    const theProblem = imp.theProblem as Record<string, unknown> | undefined;
    const whyThisWorks = imp.whyThisWorks as Record<string, unknown> | undefined;
    const whatToDo = imp.whatToDo as Record<string, unknown> | undefined;
    const transformation = imp.transformation as Record<string, unknown> | undefined;

    // Extract issue - prefer new format, fall back to old
    const issue = (theProblem?.headline as string) ||
                  (imp.issue as string) ||
                  'Description needs improvement';

    // Build whyItMatters from new structure or old
    let whyItMattersText = '';
    if (theProblem?.explanation) {
      whyItMattersText = `${theProblem.explanation}`;
      if (theProblem.admissionsImpact) {
        whyItMattersText += ` ${theProblem.admissionsImpact}`;
      }
    } else if (imp.whyItMatters) {
      const wim = imp.whyItMatters as Record<string, unknown> | string;
      whyItMattersText = typeof wim === 'string' ? wim : (wim.text as string) || '';
    }

    // Build howToFix from new structure or old
    let howToFix = '';
    if (whatToDo) {
      howToFix = whatToDo.principle as string || '';
      const steps = whatToDo.steps as string[] | undefined;
      if (steps && steps.length > 0) {
        howToFix += ` Steps: ${steps.join('; ')}`;
      }
    } else {
      howToFix = (imp.howToFix as string) || 'Apply the teaching principles to strengthen this section.';
    }

    // Get before/after from transformation or directly
    const exampleBefore = (transformation?.before as string) ||
                          (imp.exampleBefore as string) ||
                          activity?.description?.substring(0, 50) || '';
    const exampleAfter = (transformation?.after as string) ||
                         (imp.exampleAfter as string) ||
                         'Improved version with specific metrics and outcomes';

    return {
      issue,
      whyItMatters: {
        text: whyItMattersText || 'This affects how admissions officers perceive your involvement.',
        citations: [],
        // Add enriched data if available
        ...(whyThisWorks && {
          psychology: whyThisWorks.psychology as string,
          research: whyThisWorks.research as string,
          quote: whyThisWorks.quote as string,
          quoteSource: whyThisWorks.source as string,
        }),
      },
      howToFix,
      exampleBefore,
      exampleAfter,
      // Include transformation analysis if available
      ...(transformation?.whyItWorks && {
        transformationAnalysis: transformation.whyItWorks as string,
      }),
      priority: (imp.priority as 'high' | 'medium' | 'low') || 'medium',
    };
  }

  /**
   * Normalize strength teaching with enhanced structure
   */
  private normalizeStrengthTeaching(
    str: Record<string, unknown>
  ): ActivityTeaching['strengthTeaching'][number] {
    const whyItMatters = str.whyItMatters as Record<string, unknown> | string | undefined;

    return {
      strength: (str.strength as string) || 'This demonstrates authentic engagement.',
      whyItMatters: {
        text: typeof whyItMatters === 'string'
          ? whyItMatters
          : (whyItMatters?.text as string) || 'This demonstrates authentic engagement.',
        citations: (whyItMatters && typeof whyItMatters !== 'string')
          ? (whyItMatters.citations as ActivityCitation[]) || []
          : [],
      },
      howToLeverage: (str.howToLeverage as string) || 'Highlight this in your application.',
      inApplications: (str.inApplications as string) || 'Essays, interviews, and additional information.',
      // Add theProblem if present (what would be lost without highlighting)
      ...(str.theProblem && { theProblem: str.theProblem as string }),
    };
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
   *
   * When the LLM doesn't provide an optimizedDescription (or it matches the original),
   * synthesizes one from the best improvementTeaching exampleAfter — which contains
   * the actual rewritten description the LLM generated.
   */
  private normalizeDescriptionOptimization(
    optimization: Record<string, unknown> | undefined,
    activity: ActivityWorkshopInput | undefined,
    normalizedImprovements?: ActivityTeaching['improvementTeaching']
  ): ActivityTeaching['descriptionOptimization'] {
    const originalDescription = (optimization?.originalDescription as string) || activity?.description || '';
    let optimizedDescription = (optimization?.optimizedDescription as string) || '';
    let changesExplained = (optimization?.changesExplained as ActivityTeaching['descriptionOptimization']['changesExplained']) || [];

    // Check if the LLM actually provided a different optimized description
    const hasRealOptimization = optimizedDescription.length > 0
      && optimizedDescription !== originalDescription
      && optimizedDescription !== activity?.description;

    if (!hasRealOptimization && normalizedImprovements && normalizedImprovements.length > 0) {
      // Synthesize from the best improvement teaching exampleAfter
      // Find the highest-priority improvement that has a real exampleAfter
      const bestImprovement = normalizedImprovements
        .filter(imp =>
          imp.exampleAfter
          && imp.exampleAfter.length > 10
          && imp.exampleAfter !== 'Improved version with specific metrics and outcomes'
          && imp.exampleAfter !== activity?.description?.substring(0, 50)
        )
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1);
        })[0];

      if (bestImprovement?.exampleAfter) {
        optimizedDescription = bestImprovement.exampleAfter;
        // Build changesExplained from improvements if not already populated
        if (changesExplained.length === 0) {
          changesExplained = normalizedImprovements
            .filter(imp => imp.issue && imp.howToFix)
            .slice(0, 3)
            .map(imp => ({
              change: imp.issue,
              reason: typeof imp.howToFix === 'string' ? imp.howToFix.substring(0, 200) : 'Apply teaching guidance',
            }));
        }
      }
    }

    // Final fallback: if still no optimization, use the original
    if (!optimizedDescription) {
      optimizedDescription = originalDescription;
    }

    return {
      originalDescription,
      optimizedDescription,
      characterCount: optimizedDescription.length,
      changesExplained,
    };
  }

  /**
   * Normalize narrative guidance
   *
   * Handles multiple LLM response formats:
   * - howToTalkAboutThis as { text, citations } object
   * - howToTalkAboutThis as plain string
   * - Alternative key names (howToFrame, framingAdvice, etc.)
   *
   * When context is available, synthesizes meaningful guidance instead of generic defaults.
   */
  private normalizeNarrativeGuidance(
    guidance: Record<string, unknown> | undefined,
    context?: {
      storyEssence?: string;
      narrativeArc?: string;
      constraintLevel?: string;
      activityTitle?: string;
    }
  ): ActivityTeaching['narrativeGuidance'] {
    // Extract howToTalkAboutThis — handle string or object format
    let howToTalkAboutThis: ActivityTeaching['narrativeGuidance']['howToTalkAboutThis'];

    const rawHow = guidance?.howToTalkAboutThis || guidance?.howToFrame || guidance?.framingAdvice;
    if (rawHow && typeof rawHow === 'object') {
      const howObj = rawHow as Record<string, unknown>;
      howToTalkAboutThis = {
        text: (howObj.text as string) || 'Frame this activity in terms of growth and impact',
        citations: (howObj.citations as Array<{ source: string; text: string }>) || [],
      };
    } else if (rawHow && typeof rawHow === 'string') {
      howToTalkAboutThis = { text: rawHow, citations: [] };
    } else {
      // Synthesize from context instead of using generic text
      const contextText = context?.narrativeArc
        ? `Frame this within your ${context.narrativeArc} — show how it connects to your broader pattern of growth and impact`
        : context?.storyEssence
        ? `Connect this to your story: ${context.storyEssence.substring(0, 100)}`
        : 'Frame this activity in terms of growth and impact';
      howToTalkAboutThis = { text: contextText, citations: [] };
    }

    // Extract uniqueAngle — handle alternative keys
    const rawAngle = (guidance?.uniqueAngle as string)
      || (guidance?.unique_angle as string)
      || (guidance?.distinctiveElement as string);

    const uniqueAngle = rawAngle || (
      context?.activityTitle
        ? `What makes your ${context.activityTitle} experience distinctive from other applicants`
        : 'Focus on what makes your experience distinctive'
    );

    // Extract connectionToStory — handle alternative keys
    const rawConnection = (guidance?.connectionToStory as string)
      || (guidance?.connection_to_story as string)
      || (guidance?.storyConnection as string)
      || (guidance?.narrativeConnection as string);

    const connectionToStory = rawConnection || (
      context?.storyEssence
        ? `This activity reinforces your narrative: ${context.storyEssence.substring(0, 120)}`
        : 'This activity connects to your broader narrative'
    );

    // Extract interviewTips — handle string or array
    const rawTips = guidance?.interviewTips || guidance?.interview_tips;
    let interviewTips: string[];
    if (Array.isArray(rawTips)) {
      interviewTips = rawTips.map(t => typeof t === 'string' ? t : String(t));
    } else if (typeof rawTips === 'string') {
      interviewTips = [rawTips];
    } else {
      interviewTips = ['Be prepared to discuss specific examples of your contributions'];
    }

    return { howToTalkAboutThis, uniqueAngle, connectionToStory, interviewTips };
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

      this.trackUsage(response.usage);
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
- ID: "${id}" | ${activity?.title} (Tier ${analysis?.classification?.tier})
  Description: "${activity?.description}"
  Story Role: ${storyRole?.storyRole}
  Green Flags: ${analysis?.greenFlags?.map(f => f.flag).join(', ') || 'Strong overall'}
`;
    }).join('\n');

    return `Provide brief, warm encouragements for these STRONG activities (no critique needed):

${activities}

IMPORTANT: Use the EXACT activity IDs provided above (e.g., "${activityIds[0]}").

Respond with JSON:
{
  "encouragements": [
    {
      "activityId": "exact-id-from-above",
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
      const parsed = parseClaudeJSON<Record<string, unknown>>(response, 'Encouragements');
      const encouragements = (parsed.encouragements || []) as Array<Record<string, string>>;

      // Build a set of valid IDs for fast lookup
      const validIds = new Set(activityIds);

      // Map LLM-generated IDs back to actual IDs using positional + fuzzy matching
      return encouragements.map((e, index) => {
        let activityId = e.activityId || e.activity_id || e.id || '';

        // If the LLM returned an ID we don't recognize, reconcile it
        if (!validIds.has(activityId)) {
          // Strategy 1: Positional mapping (if LLM returned same count in same order)
          if (index < activityIds.length) {
            activityId = activityIds[index];
          } else {
            // Strategy 2: Find closest match by substring overlap
            const match = activityIds.find(validId => {
              const normalizedLlm = activityId.toLowerCase().replace(/[_\s-]/g, '');
              const normalizedValid = validId.toLowerCase().replace(/[_\s-]/g, '');
              return normalizedLlm.includes(normalizedValid) || normalizedValid.includes(normalizedLlm);
            });
            activityId = match || activityIds[0] || activityId;
          }
        }

        return {
          activityId,
          celebration: e.celebration || 'This is an excellent activity.',
          strengthReason: e.strengthReason || e.strength_reason || 'Shows strong engagement.',
          quickTip: e.quickTip || e.quick_tip || undefined,
        };
      });
    } catch (error) {
      console.error('[Stage2] Encouragement parse failed, using fallback:', error);
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
   *
   * ENHANCED: Now includes knowledge application validation
   */
  private calculateQualityMetrics(
    teachingDelivered: TeachingContext['teachingDelivered'],
    quickEncouragements: TeachingContext['quickEncouragements']
  ): TeachingContext['qualityMetrics'] {
    let citationsCount = 0;
    let examplesCount = 0;
    let totalDepthScore = 0;
    let knowledgeApplicationScore = 0;
    let transformationsWithAnalysis = 0;
    let celebrationCount = 0;
    let psychologyReferencesCount = 0;

    for (const td of teachingDelivered) {
      // Count citations
      citationsCount += td.teaching.tierExplanation.explanation.citations?.length || 0;
      citationsCount += td.teaching.strengthTeaching.reduce(
        (sum, s) => sum + (s.whyItMatters.citations?.length || 0), 0
      );

      // Count before/after examples
      const transformations = td.teaching.improvementTeaching.filter(
        i => i.exampleBefore && i.exampleAfter
      );
      examplesCount += transformations.length;

      // Count transformations with analysis (shows knowledge was applied)
      transformationsWithAnalysis += td.teaching.improvementTeaching.filter(
        i => i.transformationAnalysis && i.transformationAnalysis.length > 0
      ).length;

      // Check for celebration (critical for quality)
      if (td.teaching.celebration?.headline) {
        celebrationCount++;
      }

      // Count psychology/research references (shows teaching bundle usage)
      psychologyReferencesCount += td.teaching.improvementTeaching.filter(
        i => i.whyItMatters.psychology || i.whyItMatters.research
      ).length;

      // Calculate depth score
      const depthScore = td.teachingDepth === 'deep' ? 10 : td.teachingDepth === 'medium' ? 7 : 4;
      totalDepthScore += depthScore;

      // Calculate knowledge application score for this teaching
      // Points for: citations, benchmarks, transformation analysis, psychology references
      const teachingKnowledgeScore =
        (td.teaching.tierExplanation.benchmarksUsed?.length || 0) * 2 +
        (td.teaching.tierExplanation.explanation.citations?.length || 0) * 1 +
        (transformationsWithAnalysis * 3) +
        (psychologyReferencesCount * 2);

      knowledgeApplicationScore += teachingKnowledgeScore;
    }

    // Add encouragement depth
    totalDepthScore += quickEncouragements.length * 3;

    const totalItems = teachingDelivered.length + quickEncouragements.length;
    const teachingCount = teachingDelivered.length;

    // Log quality insights for debugging
    if (teachingCount > 0) {
      console.log(`[Stage2 Quality] Activities taught: ${teachingCount}`);
      console.log(`[Stage2 Quality] Citations: ${citationsCount}`);
      console.log(`[Stage2 Quality] Before/After Examples: ${examplesCount}`);
      console.log(`[Stage2 Quality] Transformations with Analysis: ${transformationsWithAnalysis}`);
      console.log(`[Stage2 Quality] Celebrations: ${celebrationCount}/${teachingCount}`);
      console.log(`[Stage2 Quality] Psychology References: ${psychologyReferencesCount}`);
      console.log(`[Stage2 Quality] Knowledge Application Score: ${knowledgeApplicationScore}`);
    }

    return {
      celebrationFirst: celebrationCount >= teachingCount * 0.8, // 80%+ have celebration
      citationsIncluded: citationsCount,
      examplesIncluded: examplesCount,
      averageDepth: totalItems > 0 ? totalDepthScore / totalItems : 0,
      // Extended quality metrics
      knowledgeApplicationScore: knowledgeApplicationScore,
      transformationsWithAnalysis: transformationsWithAnalysis,
      psychologyReferencesCount: psychologyReferencesCount,
    };
  }

  /**
   * Validate that teaching output properly applied knowledge context
   *
   * This is a quality gate that can flag teachings that seem to have
   * ignored the knowledge base and fallen back to generic advice.
   */
  private validateKnowledgeApplication(
    teaching: ActivityTeaching,
    knowledge: ActivityKnowledgeContext
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check 1: Tier explanation should reference Sara Harberson criteria
    const tierText = teaching.tierExplanation.explanation.text.toLowerCase();
    const hasSaraReference = tierText.includes('sara harberson') ||
                             tierText.includes('tier criteria') ||
                             tierText.includes('harberson');
    if (!hasSaraReference) {
      issues.push('Tier explanation does not reference Sara Harberson framework');
    }

    // Check 2: Should have benchmarks if knowledge context provided them
    if (knowledge.tierBenchmarks.length > 0 && (!teaching.tierExplanation.benchmarksUsed || teaching.tierExplanation.benchmarksUsed.length === 0)) {
      issues.push('No benchmarks used despite knowledge context providing them');
    }

    // Check 3: Improvement teaching should match issue types from knowledge
    const expectedIssues = knowledge.issueTeaching.map(i => i.issueType);
    const teachingIssues = teaching.improvementTeaching.map(i => i.issue.toLowerCase());

    for (const expected of expectedIssues.slice(0, 3)) { // Check top 3
      const expectedNormalized = expected.replace(/_/g, ' ');
      const found = teachingIssues.some(ti =>
        ti.includes(expectedNormalized) || expectedNormalized.includes(ti.split(' ')[0])
      );
      if (!found) {
        issues.push(`Expected issue "${expected}" not addressed in teaching`);
      }
    }

    // Check 4: Should have before/after examples
    const hasExamples = teaching.improvementTeaching.some(
      i => i.exampleBefore && i.exampleAfter && i.exampleBefore.length > 10 && i.exampleAfter.length > 10
    );
    if (!hasExamples) {
      issues.push('No meaningful before/after transformation examples');
    }

    // Check 5: Celebration should exist for quality teaching
    if (!teaching.celebration?.headline) {
      issues.push('Missing celebration section (should celebrate first)');
    }

    return {
      valid: issues.length <= 2, // Allow minor issues
      issues,
    };
  }
}

// Export singleton
export const stage2ConditionalTeachingService = new Stage2ConditionalTeachingService();
