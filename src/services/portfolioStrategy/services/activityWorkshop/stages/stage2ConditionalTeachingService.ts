// @ts-nocheck
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
  DescriptionReference,
  getDescriptionCharLimit,
  getPlatformName,
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
} from '../expertSystemPrompts';

// Import expert knowledge assembly
import {
  assembleExpertContext,
  ExpertKnowledgeContext,
} from '../expertCounselorKnowledgeBase';

// Import scoring teaching layer for deep transformation guidance
import {
  activityTeachingLayerService,
} from '../scoring';
import type { TeachingLayerOutput } from '../scoring/teachingLayerTypes';

// Import profile types and bridge for enriched teaching with real student data
import type { ActivityProfile } from '../profile/types';
import { profileBridgeService } from '../profileBridge';

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
  // R3: Removed instance-level _accumulatedCost and _accumulatedTokens to prevent concurrent call corruption

  // R3: trackUsage only writes to local accumulators (no instance state)
  private trackUsage(
    usage: { input_tokens?: number; output_tokens?: number } | undefined,
    localCost?: { value: number },
    localTokens?: { input: number; output: number }
  ): void {
    if (!usage) return;
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
    if (localCost) localCost.value += cost;
    if (localTokens) {
      localTokens.input += inputTokens;
      localTokens.output += outputTokens;
    }
  }

  /**
   * Run conditional teaching
   *
   * @param input - Workshop session input
   * @param storyContext - Stage 0 story context
   * @param analysisContext - Stage 1 analysis context
   * @param activityProfiles - Optional map of activity ID → rich profile data from conversations
   * @returns TeachingContext with selective teaching delivered
   */
  async teach(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    activityProfiles?: Record<string, ActivityProfile>
  ): Promise<TeachingContext> {
    const startTime = Date.now();
    // R3: Local accumulators for thread-safe concurrent teach() calls (no instance state)
    const localCost = { value: 0 };
    const localTokens = { input: 0, output: 0 };

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

    // ============================================================================
    // Steps 2 + 3 + 6: Run LLM calls in PARALLEL
    //
    // These are verified independent — they all read from Stage 0+1 outputs
    // but produce separate outputs that are combined afterward:
    //   Step 2: Deep/medium teaching for WEAK activities (uses knowledge contexts)
    //   Step 3: Quick encouragements for STRONG activities (different activity set)
    //   Step 6: Scoring teaching layer (uses scoring rubric for description rewrites)
    //
    // Step 7 (merge) reconciles Step 2 vs Step 6 rewrites AFTER both complete.
    // ============================================================================

    // Build per-activity teaching tasks (promises start executing immediately)
    const parallelTasks: Array<{ id: string; depth: 'deep' | 'medium'; promise: Promise<ActivityTeaching> }> = [];
    if (allTeachingIds.length > 0) {
      console.log(`[Stage2] Processing ${allTeachingIds.length} activities individually...`);
      parallelTasks.push(
        ...deepTeachingIds.map(id => ({
          id,
          depth: 'deep' as const,
          promise: this.processSingleActivity(
            input, storyContext, analysisContext, id,
            knowledgeContexts.get(id), 'deep', expertContext, localCost, localTokens,
            activityProfiles
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
            knowledgeContexts.get(id), 'medium', expertContext, localCost, localTokens,
            activityProfiles
          ).catch(error => {
            console.error(`[Stage2] Failed to process ${id}, using knowledge fallback:`, error);
            return this.createKnowledgeBasedFallback(id, input, analysisContext, knowledgeContexts.get(id));
          }),
        })),
      );
    }

    const quickEncouragementIds = analysisContext.teachingCandidates.quickEncouragementIds;
    const hasScoring = !!analysisContext.scoring?.scoringComplete;
    console.log(`[Stage2] Running parallel block: ${parallelTasks.length} teaching + ${quickEncouragementIds.length > 0 ? 1 : 0} encouragement + ${hasScoring ? 1 : 0} scoring teaching calls`);

    const [teachingResults, encouragementResults, scoringTeachingOutput] = await Promise.all([
      // Step 2: Per-activity teaching (each activity is its own Sonnet call)
      Promise.all(parallelTasks.map(t => t.promise)),

      // Step 3: Quick encouragements for strong activities (1 Sonnet call)
      quickEncouragementIds.length > 0
        ? this.generateQuickEncouragements(
            input, storyContext, analysisContext,
            quickEncouragementIds, localCost, localTokens
          )
        : Promise.resolve([] as TeachingContext['quickEncouragements']),

      // Step 6: Scoring teaching layer (1 Sonnet call, uses scoring rubric only)
      hasScoring
        ? (async () => {
            const scoringTeachingStart = Date.now();
            try {
              const teachingResult = await activityTeachingLayerService.generateTeaching({
                scoringRubric: analysisContext.scoring!.portfolioRubric,
                activities: input.activities,
                targetPlatform: input.targetPlatform,
                studentContext: {
                  intendedMajor: input.studentContext?.intendedMajor,
                  targetSchools: input.studentContext?.targetSchools,
                  currentGrade: input.studentContext?.gradeLevel,
                },
                options: {
                  maxTransformations: Math.min(input.activities.length, 5),
                  includeAlternatives: true,
                  includeCraftTeaching: true,
                },
              });
              if (teachingResult.success && teachingResult.teaching) {
                console.log(`[Stage2] Scoring teaching complete in ${Date.now() - scoringTeachingStart}ms`);
                console.log(`[Stage2] Transformations: ${teachingResult.teaching.activityTransformations.length}, Priorities: ${teachingResult.teaching.strategicPriorities.length}`);
                return teachingResult.teaching;
              } else {
                console.log(`[Stage2] Scoring teaching returned no results (success=${teachingResult.success})`);
                return null;
              }
            } catch (error) {
              console.error(`[Stage2] Scoring teaching failed in ${Date.now() - scoringTeachingStart}ms (non-fatal):`, error);
              return null;
            }
          })()
        : (async () => {
            console.log(`[Stage2] Scoring data not available, skipping scoring teaching layer`);
            return null;
          })(),
    ]);

    // === Post-parallel processing (all sync operations) ===

    // Map per-activity teaching results to teachingDelivered
    for (let i = 0; i < parallelTasks.length; i++) {
      const task = parallelTasks[i];
      const teaching = teachingResults[i];
      teachingDelivered.push({
        activityId: task.id,
        teachingDepth: task.depth,
        teaching,
      });
    }

    // Enrich with citations from knowledge contexts (sync)
    if (teachingDelivered.length > 0) {
      const enrichedTeachings = this.enrichTeachingsWithCitations(
        teachingDelivered.map(td => td.teaching),
        knowledgeContexts
      );
      for (let i = 0; i < teachingDelivered.length; i++) {
        teachingDelivered[i].teaching = enrichedTeachings[i];
      }
    }

    // Quick encouragements (from parallel result)
    quickEncouragements.push(...encouragementResults);

    // Step 4: Mark skipped activities (sync)
    for (const activityId of analysisContext.teachingCandidates.skipTeachingIds) {
      const analysis = analysisContext.activities[activityId];
      skippedActivities.push({
        activityId,
        reason: analysis?.classification?.tier === 1 ? 'already_excellent' : 'no_improvement_path',
        status: 'No teaching needed - activity is already strong',
      });
    }

    // Step 5: Generate portfolio-level teaching (sync — no LLM call)
    console.log(`[Stage2] Generating portfolio teaching...`);
    const portfolioTeaching = await this.generatePortfolioTeaching(
      input,
      storyContext,
      analysisContext
    );

    // Build scoring teaching from parallel result
    let scoringTeaching: TeachingContext['scoringTeaching'] | undefined;
    if (scoringTeachingOutput) {
      scoringTeaching = {
        activityTransformations: scoringTeachingOutput.activityTransformations,
        connectionStrategies: scoringTeachingOutput.connectionStrategies,
        strategicPriorities: scoringTeachingOutput.strategicPriorities,
        craftTeaching: scoringTeachingOutput.craftTeaching,
        fullOutput: scoringTeachingOutput,
      };
    }

    // Step 7: Upgrade Stage 2 description optimizations with scoring teaching rewrites
    // The scoring teaching layer produces strictly char-constrained, principled rewrites.
    // When available and better, prefer those over Stage 2's own (often over-limit) rewrites.
    if (scoringTeaching?.activityTransformations?.length) {
      const charLimit = getDescriptionCharLimit(input.targetPlatform);
      console.log(`[Stage2] Checking ${scoringTeaching.activityTransformations.length} scoring rewrites against ${teachingDelivered.length} Stage 2 teachings (limit: ${charLimit})`);

      for (const transformation of scoringTeaching.activityTransformations) {
        // Match by activityId first, then by activityName as fallback
        // teachingDelivered items are { activityId, teachingDepth, teaching: ActivityTeaching }
        let td = teachingDelivered.find(t => t.activityId === transformation.activityId);
        if (!td) {
          // LLM may have used title as activityId — try matching by looking up the activity
          const matchingActivity = input.activities.find(a =>
            a.title === transformation.activityName || a.id === transformation.activityId
          );
          if (matchingActivity) {
            td = teachingDelivered.find(t => t.activityId === matchingActivity.id);
          }
        }

        if (!td?.teaching?.descriptionOptimization) {
          console.log(`[Stage2] No teaching match for "${transformation.activityName}" (id: ${transformation.activityId})`);
          continue;
        }

        const descOpt = td.teaching.descriptionOptimization;
        const scoringRewrite = transformation.rewrite?.suggested;
        const currentRewrite = descOpt.optimizedDescription;

        // Prefer scoring rewrite if: (a) within char limit, (b) different from original, (c) Stage 2's rewrite exceeds limit
        if (scoringRewrite
          && scoringRewrite.length <= charLimit
          && scoringRewrite !== descOpt.originalDescription
          && currentRewrite.length > charLimit) {
          console.log(`[Stage2] Upgrading "${transformation.activityName}" rewrite: ${currentRewrite.length}→${scoringRewrite.length} chars (scoring teaching preferred)`);
          descOpt.optimizedDescription = scoringRewrite;
          descOpt.characterCount = scoringRewrite.length;
          // Merge changes from scoring transformation
          if (transformation.rewrite?.changesApplied?.length) {
            descOpt.changesExplained = transformation.rewrite.changesApplied.map(c => ({
              change: c.element,
              reason: c.rationale,
            }));
          }
        } else if (scoringRewrite) {
          console.log(`[Stage2] Keeping Stage 2 rewrite for "${transformation.activityName}" (scoring: ${scoringRewrite.length}, stage2: ${currentRewrite.length}, limit: ${charLimit})`);
        }
      }
    }

    // Step 8: Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(teachingDelivered, quickEncouragements);

    const result: TeachingContext = {
      teachingDelivered,
      quickEncouragements,
      skippedActivities,
      portfolioTeaching,
      scoringTeaching,
      qualityMetrics,
      teachingMetadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: { ...localTokens },
        cost: localCost.value,
        activitiesTaught: teachingDelivered.length,
        activitiesSkipped: skippedActivities.length,
      },
    };

    console.log(`[Stage2] Teaching complete in ${Date.now() - startTime}ms`);
    console.log(`[Stage2] Delivered: ${teachingDelivered.length} teachings, ${quickEncouragements.length} encouragements`);
    if (scoringTeaching) {
      console.log(`[Stage2] Scoring teaching: ${scoringTeaching.activityTransformations.length} transformations, ${scoringTeaching.craftTeaching?.length || 0} craft elements`);
    }

    return result;
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
    expertContext?: ExpertKnowledgeContext,
    localCost?: { value: number },
    localTokens?: { input: number; output: number },
    activityProfiles?: Record<string, ActivityProfile>
  ): Promise<ActivityTeaching> {
    const activity = input.activities.find(a => a.id === activityId);
    const analysis = analysisContext.activities[activityId];

    if (!activity || !analysis) {
      throw new Error(`Activity ${activityId} not found`);
    }

    // NOTE: Expert context (school archetypes, constraints, narrative arc, character traits,
    // authenticity assessment) is already in the CACHED system prompt via buildExpertTeachingPrompt().
    // Do NOT re-inject it per activity — it wastes ~300-400 input tokens per call for zero benefit.

    // Build profile context block if a rich profile exists for this activity
    let profileContext = '';
    let hasProfileData = false;
    if (activityProfiles?.[activityId]) {
      const profile = activityProfiles[activityId];
      if (profileBridgeService.isProfileUseful(profile)) {
        hasProfileData = true;
        const summary = profileBridgeService.summarizeForTeaching(profile, activity.description);
        const verifiedMetricsBlock = Object.entries(summary.verifiedMetrics).length > 0
          ? `VERIFIED FACTS THE STUDENT CONFIRMED:\n${Object.entries(summary.verifiedMetrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
          : '';
        const authenticQuotesBlock = summary.authenticQuotes.length > 0
          ? `\nAUTHENTIC STUDENT VOICE (preserve their words):\n${summary.authenticQuotes.map(q => `- "${q}"`).join('\n')}`
          : '';
        const gapsBlock = summary.gapsVsDescription.length > 0
          ? `\nCRITICAL GAPS (profile shows these, but description DOESN'T mention them):\n${summary.gapsVsDescription.map(g => `- ${g}`).join('\n')}\n\nUSE THESE GAPS as the PRIMARY basis for improvement teaching. The student has the REAL story — help them get it into their ${getDescriptionCharLimit(input.targetPlatform)} characters.`
          : '';
        const suggestedElementsBlock = summary.suggestedDescriptionElements.length > 0
          ? `\nTOP ELEMENTS TO INCLUDE IN DESCRIPTION:\n${summary.suggestedDescriptionElements.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
          : '';
        const keyMomentsBlock = summary.keyMoments.length > 0
          ? `\nKEY MOMENTS FROM THEIR JOURNEY:\n${summary.keyMoments.map(m => `- ${m}`).join('\n')}`
          : '';
        const impactBlock = summary.impactHighlights && summary.impactHighlights !== 'No impact data available'
          ? `\nVERIFIED IMPACT: ${summary.impactHighlights}`
          : '';
        const skillsBlock = summary.skillsDemonstrated.length > 0
          ? `\nSKILLS DEMONSTRATED:\n${summary.skillsDemonstrated.map(s => `- ${s}`).join('\n')}`
          : '';

        profileContext = `
PERSONALIZED CONTEXT (from student's own conversation — use this to ground your teaching):

${verifiedMetricsBlock}${authenticQuotesBlock}${gapsBlock}${keyMomentsBlock}${suggestedElementsBlock}${impactBlock}${skillsBlock}

IMPORTANT: Use this verified context to make your teaching SPECIFIC and PERSONAL:
- Reference the student's actual numbers and achievements in exampleAfter rewrites
- Point out specific gaps: "You told me X, but your description doesn't mention it"
- Use their authentic voice in rewrites when possible
- The optimizedDescription MUST incorporate verified facts from above
`;
        console.log(`[Stage2] Profile context injected for "${activity.title}": ${Object.keys(summary.verifiedMetrics).length} verified metrics, ${summary.gapsVsDescription.length} gaps, ${summary.authenticQuotes.length} quotes`);
      }
    }

    // Build a focused prompt for just this one activity
    // Per-activity prompts only include activity-specific data.
    const prompt = `Provide ${depth} teaching for this activity.

ACTIVITY: ${activity.title}
- Description: "${activity.description}"
- Role: ${activity.role || 'Member'}
- Tier: ${analysis.classification.tier}
- Issues: ${analysis.descriptionQuality.issues.join('; ') || 'None major'}
- Strengths: ${analysis.descriptionQuality.strengths.join('; ') || 'Good overall'}
- Green Flags: ${analysis.greenFlags.map(f => f.flag).join('; ') || 'None'}
- Red Flags: ${analysis.redFlags.map(f => f.flag).join('; ') || 'None'}

${knowledge ? `RESEARCH-BACKED KNOWLEDGE CONTEXT:

${knowledgeAssemblyService.formatForPrompt(knowledge)}` : ''}
${profileContext}
TEACHING PROTOCOL:
1. CELEBRATE ONLY WHEN GENUINE — If the activity has a noteworthy strength (strong metric, unique approach, real impact), celebrate it with a specific quote. If the description is weak or generic, SKIP celebration and focus on improvement teaching. Don't manufacture praise.
2. EDUCATE CONCISELY — For obvious fixes (passive voice, missing numbers), explain WHY in 1 sentence. For non-obvious strategic insights, 2-3 sentences are fine if every sentence adds value.
3. TRANSFORM — Show concrete before/after. QUOTE their actual text, then show the improved version. NEVER skip this.
4. CONNECT — Link to their broader narrative and how this activity fits their story.

CRITICAL QUALITY RULES:
- Celebrations must be SPECIFIC and CONDITIONAL: Quote an actual strong phrase from their description. If nothing is genuinely noteworthy, OMIT celebration field entirely.
- Every improvementTeaching entry MUST have non-empty exampleBefore (quoted from their description) AND exampleAfter (your rewrite).
- If you cannot produce a real before/after, explain in howToFix what the student should write instead.
- WHY explanations: Be direct and concise. Cut filler. Every sentence must add value.

ANTI-REDUNDANCY RULES (CRITICAL — violation makes output feel like a broken record):
- Do NOT re-explain the student's narrative arc or "Multiplier Arc" pattern. If relevant, reference it in ONE phrase max (e.g., "fits their builder arc") — never re-derive or re-explain it.
- Do NOT restate the student's constraint profile or background (first-gen, working, rural, etc.). Those are covered in the holistic section. Focus ONLY on how constraints specifically affect THIS activity's evaluation.
- Do NOT repeat the student's overall pitch/story essence. Each activity's teaching should stand on its own with activity-specific insights.
- Every sentence must be UNIQUE to THIS activity. If you catch yourself writing something you'd write for any other activity, delete it and write something specific to this one.

Respond with JSON for ONE activity:
{
  "activityId": "${activityId}",
  "celebration": {
    "headline": "ONLY IF genuinely strong: One celebratory sentence that QUOTES a specific phrase that demonstrates real impact/achievement. E.g.: 'Your phrase \"designed curriculum for 30+ students\" instantly signals ownership — AOs see YOU did this, not the club.' OMIT THIS ENTIRE FIELD if the description is weak/generic.",
    "strengths": ["Specific strength citing evidence from description", "Second specific strength"],
    "references": [{ "quotedText": "exact substring from their description", "type": "strength", "label": "short highlight label" }]
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
    "inApplications": "where to highlight",
    "references": [{ "quotedText": "exact text from description evidencing this strength", "type": "strength", "label": "label" }]
  }],
  "improvementTeaching": [{
    "issue": "main issue to fix",
    "whyItMatters": { "text": "why this matters - reference committee pitch test or 8-minute read", "citations": [] },
    "howToFix": "step by step guidance",
    "exampleBefore": "quote their weak text here",
    "exampleAfter": "your improved version here${hasProfileData ? ' — USE verified facts from PERSONALIZED CONTEXT above for exampleAfter. Reference their REAL metrics and achievements, not fabricated ones.' : ''}",
    "priority": "high",
    "references": [{ "quotedText": "exact text from description with this issue", "type": "issue", "label": "label" }]
  }],
  "descriptionOptimization": {
    "originalDescription": "${activity.description.replace(/"/g, '\\"').substring(0, 200)}",
    "optimizedDescription": "your improved version (AIM FOR ${getDescriptionCharLimit(input.targetPlatform) - 5} chars or fewer — HARD LIMIT: ${getDescriptionCharLimit(input.targetPlatform)} chars for ${getPlatformName(input.targetPlatform)})${hasProfileData ? ' — MUST incorporate the verified facts from PERSONALIZED CONTEXT. Use the student\\'s REAL metrics and achievements to write a description grounded in their actual experience, not generic improvements.' : ''}",
    "characterCount": ${getDescriptionCharLimit(input.targetPlatform) - 10},
    "changesExplained": [{ "change": "what changed", "reason": "why" }]
  },
  "narrativeGuidance": {
    "howToTalkAboutThis": { "text": "SPECIFIC framing advice for THIS activity only: exactly how to discuss it in interviews and essays. Focus on what makes THIS activity's contribution unique — do NOT re-explain the student's overall narrative or constraint background.", "citations": [] },
    "uniqueAngle": "ONE concrete detail that makes THIS student's version of this activity different from 1000 others doing the same thing.",
    "connectionToStory": "One sentence: how this activity specifically complements their other activities. Name specific activities, don't re-derive the overall narrative.",
    "interviewTips": ["Specific prep tip referencing THIS activity's details", "A concrete question they might get and how to answer it"]
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
      maxTokens: depth === 'deep' ? 6500 : 5000,
      temperature: 0.3,
      timeoutMs: depth === 'deep' ? 210000 : 150000,
      cacheSystemPrompt: true, // Cache system prompt across parallel activity calls
    });

    this.trackUsage(response.usage, localCost, localTokens);

    // Parse the single activity response
    const parsed = parseClaudeJSON<ActivityTeaching>(response.content, 'SingleActivityTeaching');

    // Ensure activityId is set
    parsed.activityId = activityId;

    // Validate celebration references
    if (parsed.celebration?.references) {
      parsed.celebration.references = (parsed.celebration.references as Array<Record<string, unknown>>).filter(
        (ref: Record<string, unknown>) => ref?.quotedText && typeof ref.quotedText === 'string' && (ref.quotedText as string).length > 0
      ).map((ref: Record<string, unknown>) => ({
        quotedText: ref.quotedText as string,
        type: (ref.type as string) || 'strength',
        label: (ref.label as string) || '',
      })) as DescriptionReference[];
    }

    // Normalize the parsed response — improvements first so we can synthesize optimization
    // Filter out useless/placeholder improvements that the LLM failed to generate properly
    const normalizedImprovements = (parsed.improvementTeaching || []).map(i =>
      this.normalizeImprovementTeaching(i as unknown as Record<string, unknown>, activity)
    ).filter(imp => !(imp as Record<string, unknown>)._empty);

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
        normalizedImprovements,
        input.targetPlatform
      ),
      narrativeGuidance: this.normalizeNarrativeGuidance(
        parsed.narrativeGuidance as unknown as Record<string, unknown>,
        {
          storyEssence: storyContext.narrativeIdentity.storyEssence,
          narrativeArc: expertContext?.narrativeArc?.name,
          constraintLevel: expertContext?.constraintLevel?.name,
          activityTitle: activity?.title,
          strengths: analysis?.greenFlags?.map(f => f.flag),
          category: analysis?.classification?.detectedCategory,
          tier: analysis?.classification?.tier,
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
4. **CONNECT TO STORY** - Link improvements to their narrative briefly (one phrase, don't re-explain the arc)
5. **WORD COUNT** - ${wordRange.min}-${wordRange.max} words per activity

ANTI-REDUNDANCY: Student story and constraint profile are stated ONCE in the Student Story section above. Do NOT restate them per activity. Each activity's teaching must contain ONLY activity-specific insights.

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
        "optimizedDescription": "Your improved version (AIM FOR ${getDescriptionCharLimit(input.targetPlatform) - 5} chars or fewer — HARD LIMIT: ${getDescriptionCharLimit(input.targetPlatform)} chars for ${getPlatformName(input.targetPlatform)})",
        "characterCount": ${getDescriptionCharLimit(input.targetPlatform) - 10},
        "changesExplained": [{ "change": "What changed", "reason": "Why" }]
      },
      "narrativeGuidance": {
        "howToTalkAboutThis": { "text": "SPECIFIC framing for THIS activity only. Do NOT re-explain narrative arc or constraints.", "citations": [] },
        "uniqueAngle": "ONE concrete detail that makes THIS student's version different from 1000 others",
        "connectionToStory": "One sentence: how this activity complements their other activities (name them). Do NOT re-derive the overall narrative.",
        "interviewTips": ["Specific prep tip for THIS activity", "Concrete question they might get and how to answer"]
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

ANTI-GENERIC CHECKLIST (apply to every piece of teaching you write):
1. Could this feedback apply to ANY student? If yes, rewrite with THIS student's specific data.
2. Does the improvement suggestion include a concrete BEFORE/AFTER example using THEIR actual description text? If not, add one.
3. If you included a celebration: Does it cite a SPECIFIC strong phrase/metric from their description? If not, omit celebration entirely.
4. Is the tier explanation grounded in what SPECIFICALLY makes this a Tier [N] activity vs Tier [N±1]?
5. Are WHY explanations concise? For obvious fixes (passive voice, missing numbers), 1 sentence max. For strategic insights, ensure every sentence adds value.

BANNED PHRASES (never use these — they are meaningless filler):
- "Great job!" / "Well done!" / "Impressive!" (unless citing specific achievement)
- "Consider adding more detail" / "Think about how you can..."
- "This shows your dedication" / "This is a strong activity" (without specific evidence)
- Verbose WHY explanations that repeat obvious points or pad length without adding insight

ANTI-REDUNDANCY: Student story, constraints, and narrative arc are stated once at the top of the prompt. Do NOT re-explain them per activity. Brief references (1 phrase) are fine; re-derivations are NOT. Every sentence must be unique to the specific activity.

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

ANTI-REDUNDANCY RULES (CRITICAL — read before writing ANY activity):
- The student's story, constraint profile, and narrative arc are stated ONCE in the Student Story Context above. Do NOT restate them per activity.
- Do NOT re-explain the narrative arc pattern in each activity's teaching. A brief reference ("fits their builder arc") is fine — re-deriving or re-explaining it is NOT.
- Do NOT recite the student's constraint background (first-gen, working, rural) in each activity. When constraints affect tier evaluation, state the SPECIFIC impact on THIS activity only.
- Each activity's teaching must contain ZERO sentences that could be copy-pasted to another activity unchanged. Every sentence must be unique to this specific activity.

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
        "headline": "ONLY IF genuinely noteworthy: One sentence celebrating their strongest specific aspect with evidence. OMIT THIS ENTIRE FIELD if nothing is genuinely strong.",
        "strengths": ["List 2-3 specific things working well, citing green flags and analysis"],
        "tone": "Celebrate only when warranted. Don't force praise."
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
        "optimizedDescription": "Your COMPLETE improved version (AIM FOR ${getDescriptionCharLimit(input.targetPlatform) - 5} chars or fewer — HARD LIMIT: ${getDescriptionCharLimit(input.targetPlatform)} chars for ${getPlatformName(input.targetPlatform)})",
        "characterCount": ${getDescriptionCharLimit(input.targetPlatform) - 10},
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
          "text": "SPECIFIC framing for THIS activity only: a concrete example sentence for interviews/essays. Do NOT re-explain their overall narrative arc or constraint background.",
          "citations": []
        },
        "uniqueAngle": "ONE concrete detail from their description that makes THIS student's version different from 1000 others doing the same activity.",
        "connectionToStory": "One sentence: how this activity complements their other activities (name them). Do NOT re-derive the overall narrative.",
        "essayPotential": "A specific essay angle or moment from this activity — name the exact scene, challenge, or realization that would make a compelling essay",
        "interviewTips": [
          "A concrete question they might get about this activity and exactly how to answer it using their specific details",
          "A common mistake to avoid when discussing this type of activity, with an alternative approach"
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

5. **TONE: CONDITIONAL CELEBRATION → TEACH → TRANSFORM**

   Order matters:
   1. FIRST (IF WARRANTED): Genuine celebration of what's actually strong. If nothing is noteworthy, skip to teaching.
   2. THEN: Concise, research-backed teaching on what to improve (brief for obvious fixes, deeper for non-obvious insights)
   3. FINALLY: Concrete transformation with before/after

6. **CITATION MARKERS**
   - Use {{cite_N}} markers where the knowledge base supports your claims
   - This makes your teaching verifiable and builds student trust

7. **ANTI-REDUNDANCY (CRITICAL)**
   - The student's narrative arc, constraint profile, and story pitch are stated ONCE at the top. Do NOT repeat them per activity.
   - When referencing the narrative arc, use a brief label (e.g., "builder arc") — never re-explain what it means.
   - When constraints affect an activity's evaluation, state the SPECIFIC impact — don't recite the generic constraint profile.
   - Every sentence in each activity's output must be UNIQUE to that activity. Zero copy-paste between activities.

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
          text: `Your ${activity?.title || 'activity'} is classified as ${knowledge.saraHarbersonCriteria.tierName}. ${knowledge.saraHarbersonCriteria.definition} ${knowledge.categoryInsights.competitiveContext}`,
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
      // R2-9: Improved fallback strength teaching with student-specific framing
      strengthTeaching: analysis?.greenFlags?.slice(0, 2).map(f => ({
        strength: f.admissionsValue || f.flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        whyItMatters: {
          text: f.admissionsValue
            ? `Your ${activity?.title || 'activity'} demonstrates ${f.admissionsValue.toLowerCase()}, which admissions officers value because it shows genuine engagement beyond surface participation.`
            : `In the context of ${knowledge.categoryInsights.categoryName} activities, your ${activity?.title || 'activity'} shows qualities that stand out to admissions officers.`,
          citations: knowledge.citations.filter(c => c.type === 'green_flag').slice(0, 1),
        },
        howToLeverage: `In your ${activity?.title || 'activity'} description, lead with this strength. Frame it using active language: what you specifically did, not what the organization achieved.`,
        inApplications: knowledge.fieldExpectations?.majorName
          ? `Especially relevant for ${knowledge.fieldExpectations.majorName} applications — mention in essays about why this major.`
          : 'Reference in your personal statement and any "additional information" sections.',
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
          text: `When discussing your ${activity?.title || 'activity'}, focus on ${knowledge.categoryInsights.topAchievements[0] || 'your unique contribution'}. Lead with what makes YOUR experience specific, not the general category.`,
          citations: [],
        },
        uniqueAngle: knowledge.fieldExpectations?.relevanceAssessment?.alignmentReason ||
          `What sets your ${activity?.title || 'activity'} apart is the specific context — emphasize what only YOU experienced.`,
        connectionToStory: knowledge.fieldExpectations?.majorName
          ? `Your ${activity?.title || 'activity'} strengthens your ${knowledge.fieldExpectations.majorName} narrative by demonstrating hands-on engagement beyond academics.`
          : `This activity adds dimension to your story — it shows who you are beyond test scores and grades.`,
        interviewTips: knowledge.categoryInsights.commonMistakes.slice(0, 1).map(m => `When discussing ${activity?.title || 'this activity'} in interviews, avoid: ${m}`),
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
        // Filter out useless/placeholder improvements that the LLM failed to generate properly
        const rawImprovementTeaching = (t.improvementTeaching || []) as Array<Record<string, unknown>>;
        const normalizedImprovementTeaching = rawImprovementTeaching.map(imp =>
          this.normalizeImprovementTeaching(imp, activity)
        ).filter(imp => !(imp as Record<string, unknown>)._empty);

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
            normalizedImprovementTeaching,
            input.targetPlatform
          ),
          narrativeGuidance: this.normalizeNarrativeGuidance(
            t.narrativeGuidance,
            {
              storyEssence: storyContext?.narrativeIdentity?.storyEssence,
              narrativeArc: expertContext?.narrativeArc?.name,
              constraintLevel: expertContext?.constraintLevel?.name,
              activityTitle: activity?.title,
              strengths: analysis?.greenFlags?.map(f => f.flag),
              category: analysis?.classification?.detectedCategory,
              tier: analysis?.classification?.tier,
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
      howToFix = (imp.howToFix as string) || '';
    }

    // R2-6: Expanded placeholder/lazy output detection
    const isPlaceholder = (text: string): boolean => {
      if (!text || text.length < 10) return true;
      const lower = text.toLowerCase();
      const placeholders = [
        // Original patterns
        'improved version with specific',
        'apply the teaching principles',
        'improved version with metrics',
        'specific metrics and outcomes',
        'apply teaching guidance',
        // R2-6: New patterns for common LLM shortcuts
        'add more specific',
        'consider adding more detail',
        'you could try adding',
        'you might want to',
        'it would be better if',
        'think about including',
        'your improved version',
        'insert specific',
        'include relevant details',
        'add quantifiable metrics here',
        'replace with your actual',
        '[your',
        '[insert',
        '[add',
      ];
      return placeholders.some(p => lower.includes(p));
    };

    // Get before/after from transformation or directly — reject placeholders
    const rawExampleBefore = (transformation?.before as string) || (imp.exampleBefore as string) || '';
    const rawExampleAfter = (transformation?.after as string) || (imp.exampleAfter as string) || '';

    const exampleBefore = isPlaceholder(rawExampleBefore) ? '' : rawExampleBefore;
    const exampleAfter = isPlaceholder(rawExampleAfter) ? '' : rawExampleAfter;

    // If howToFix is a placeholder, clear it so we don't output useless text
    if (isPlaceholder(howToFix)) {
      howToFix = '';
    }

    // If both before/after and howToFix are empty, this improvement is garbage — return null marker
    const isUselessImprovement = !exampleAfter && !howToFix && !whyItMattersText;

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
      priority: isUselessImprovement ? 'low' as const : ((imp.priority as 'high' | 'medium' | 'low') || 'medium'),
      // Pass through validated text references for frontend highlighting
      ...(Array.isArray(imp.references) && (imp.references as Array<Record<string, unknown>>).length > 0 && {
        references: (imp.references as Array<Record<string, unknown>>).filter(
          ref => ref?.quotedText && typeof ref.quotedText === 'string' && (ref.quotedText as string).length > 0
        ).map(ref => ({
          quotedText: ref.quotedText as string,
          type: (ref.type as string) || 'issue',
          label: (ref.label as string) || '',
        })) as DescriptionReference[],
      }),
      // Mark as useless so the caller can filter it out
      ...(isUselessImprovement && { _empty: true }),
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
      // Pass through validated text references for frontend highlighting
      ...(Array.isArray(str.references) && str.references.length > 0 && {
        references: (str.references as Array<Record<string, unknown>>).filter(
          ref => ref?.quotedText && typeof ref.quotedText === 'string' && (ref.quotedText as string).length > 0
        ).map(ref => ({
          quotedText: ref.quotedText as string,
          type: (ref.type as string) || 'strength',
          label: (ref.label as string) || '',
        })) as DescriptionReference[],
      }),
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
    normalizedImprovements?: ActivityTeaching['improvementTeaching'],
    targetPlatform?: import('../types').ApplicationPlatform
  ): ActivityTeaching['descriptionOptimization'] {
    const charLimit = getDescriptionCharLimit(targetPlatform);
    const originalDescription = (optimization?.originalDescription as string) || activity?.description || '';
    let optimizedDescription = (optimization?.optimizedDescription as string) || '';
    let changesExplained = (optimization?.changesExplained as ActivityTeaching['descriptionOptimization']['changesExplained']) || [];

    // Sanitize LLM-provided changesExplained — truncate long reasons to concise summaries
    changesExplained = changesExplained.map(c => ({
      change: c.change,
      reason: this.conciseChangeReason(c.reason),
    }));

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
          && imp.exampleAfter !== activity?.description?.substring(0, 50)
        )
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1);
        })[0];

      if (bestImprovement?.exampleAfter) {
        optimizedDescription = bestImprovement.exampleAfter;
        // Build concise changesExplained from improvements if not already populated
        if (changesExplained.length === 0) {
          changesExplained = normalizedImprovements
            .filter(imp => imp.issue && (imp.howToFix || imp.exampleAfter))
            .slice(0, 3)
            .map(imp => ({
              change: imp.issue,
              reason: this.conciseChangeReason(imp.howToFix || ''),
            }));
        }
      }
    }

    // Final fallback: if still no optimization, use the original
    if (!optimizedDescription) {
      optimizedDescription = originalDescription;
    }

    // Validate character limit — flag if over limit but don't truncate (student needs to see the full suggestion)
    const isOverLimit = optimizedDescription.length > charLimit;
    if (isOverLimit && optimizedDescription !== originalDescription) {
      console.warn(`[Stage2] Description optimization for "${activity?.title}" is ${optimizedDescription.length} chars (limit: ${charLimit}). Adding warning.`);
      changesExplained = [
        ...changesExplained,
        {
          change: `Character count: ${optimizedDescription.length}/${charLimit}`,
          reason: `This suggestion exceeds the ${getPlatformName(targetPlatform)} ${charLimit}-character limit by ${optimizedDescription.length - charLimit} characters. You'll need to trim it down — focus on keeping the strongest metrics and cutting filler words.`,
        },
      ];
    }

    return {
      originalDescription,
      optimizedDescription,
      characterCount: optimizedDescription.length,
      changesExplained,
    };
  }

  /**
   * Convert a long howToFix paragraph into a concise change summary.
   * Extracts the first actionable sentence instead of truncating mid-word.
   */
  private conciseChangeReason(text: string): string {
    if (!text || text.length <= 120) return text;

    // If it starts with "Step 1:" style, extract just the core action
    const stepMatch = text.match(/^(?:Step \d+:\s*)?(.+?)(?:\.\s*Step \d+|$)/s);
    if (stepMatch && stepMatch[1].length <= 150) {
      const sentence = stepMatch[1].trim();
      return sentence.endsWith('.') ? sentence : sentence + '.';
    }

    // Extract first complete sentence (ending in . ! or ?)
    const sentenceMatch = text.match(/^(.+?[.!?])\s/);
    if (sentenceMatch && sentenceMatch[1].length <= 150) {
      return sentenceMatch[1];
    }

    // Truncate at a word boundary + ellipsis
    const truncated = text.substring(0, 117);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 60 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  /**
   * Generate category-specific framing advice for narrative guidance.
   * Each activity type gets fundamentally different framing — no shared template.
   */
  private getCategorySpecificFraming(category: string, title: string, tier?: number): string {
    const cat = category.toLowerCase();

    if (cat.includes('research') || cat.includes('stem') || cat.includes('academic')) {
      return `When discussing ${title}, lead with YOUR specific contribution and methodology — not the lab or professor. AOs want to hear what YOU designed, built, or discovered. Describe one specific technical challenge you solved and why the problem matters.`;
    }
    // Check family/farm BEFORE work — "work_family_responsibility" contains both
    if (cat.includes('family') || cat.includes('caregiv') || cat.includes('farm')) {
      return `When discussing ${title}, state facts with confidence — no victimhood framing. Frame your responsibilities as skills: management, logistics, problem-solving. Let the hours/commitment speak to the sacrifice; your description should speak to your competence.`;
    }
    if (cat.includes('work') || cat.includes('employ') || cat.includes('job')) {
      return `When discussing ${title}, don't apologize or minimize — frame your work experience using business language. Lead with your promotion or biggest responsibility, then explain what skills it built that transfer to your academic goals. AOs respect work ethic; give them concrete evidence of it.`;
    }
    if (cat.includes('service') || cat.includes('volunteer') || cat.includes('tutor') || cat.includes('community') || cat.includes('education')) {
      return `When discussing ${title}, lead with impact on OTHERS, not what you learned. Specific outcomes (grade improvements, retention rates, program growth) matter more than hours served. Show that you built something sustainable, not just showed up.`;
    }
    if (cat.includes('leader') || cat.includes('government') || cat.includes('council') || cat.includes('club')) {
      return `When discussing ${title}, focus on what CHANGED because of your leadership — not that you held a position. AOs see thousands of 'president' titles; they remember the ones who can say 'I changed X, and here's the proof.'`;
    }
    if (cat.includes('art') || cat.includes('music') || cat.includes('creative') || cat.includes('perform') || cat.includes('theater') || cat.includes('film')) {
      return `When discussing ${title}, lead with your highest-selectivity credential and body of work. AOs can't evaluate artistic quality from text, so external validation (awards, exhibitions, audiences) and output volume are your proof points.`;
    }
    if (cat.includes('athlet') || cat.includes('sport') || cat.includes('team')) {
      return `When discussing ${title}, focus on your growth arc and leadership contribution rather than just stats. Show what changed on the team because of you — that's what AOs remember.`;
    }

    // Generic fallback for uncategorized activities
    return `When discussing ${title}, lead with your most concrete, specific achievement — the detail that makes an admissions officer stop scanning and actually read. Avoid generic descriptions; specificity is what makes you memorable.`;
  }

  /**
   * Generate category-specific interview tips.
   * Each activity type gets different preparation questions.
   */
  private getCategorySpecificInterviewTips(category: string, title: string, strengths?: string[]): string[] {
    const cat = category.toLowerCase();
    const strengthNote = strengths?.length ? ` Your key differentiators: ${strengths.slice(0, 2).join(', ')}.` : '';

    if (cat.includes('research') || cat.includes('stem') || cat.includes('academic')) {
      return [
        `Prepare to explain your research methodology in 2 minutes to someone without a technical background — AOs may not have STEM expertise.${strengthNote}`,
        `Have a clear answer for: "What did YOU specifically contribute?" vs. what the lab/professor did. Distinguish your intellectual contribution from execution tasks.`,
      ];
    }
    // Check family/farm BEFORE work — "work_family_responsibility" contains both
    if (cat.includes('family') || cat.includes('caregiv') || cat.includes('farm')) {
      return [
        `If asked about family responsibilities, be matter-of-fact. State what you do, the scale, and the skills it built. Let the interviewer draw the "impressive" conclusion themselves.${strengthNote}`,
        `Prepare to connect your family work to your academic interests: "Managing [farm/household/caregiving] taught me to think in systems — which is exactly what drew me to [your major]."`,
      ];
    }
    if (cat.includes('work') || cat.includes('employ') || cat.includes('job')) {
      return [
        `When asked about challenges, have ONE specific story ready: a shift that went wrong, a difficult customer, a problem you solved. Be concrete, not general.${strengthNote}`,
        `Prepare to answer: "What did this job teach you that you couldn't learn in school?" — connect your work skills to your academic or career goals.`,
      ];
    }
    if (cat.includes('service') || cat.includes('volunteer') || cat.includes('tutor') || cat.includes('community') || cat.includes('education')) {
      return [
        `Have a specific student/person story ready — not "I helped many students" but "There was one student, Maria, who..." Personal stories are 10x more memorable than statistics.${strengthNote}`,
        `Be ready to answer: "Why do you keep doing this?" — show sustained motivation beyond a requirement. What pulls you back each week?`,
      ];
    }
    if (cat.includes('leader') || cat.includes('government') || cat.includes('council') || cat.includes('club')) {
      return [
        `Prepare your "what I changed" story: Before you led, X was true. After, Y was true. Use specific numbers if possible.${strengthNote}`,
        `Have a ready answer for: "What was your biggest failure as a leader?" — AOs test for self-awareness and growth. Pick a real failure and what you learned.`,
      ];
    }
    if (cat.includes('art') || cat.includes('music') || cat.includes('creative') || cat.includes('perform') || cat.includes('theater') || cat.includes('film')) {
      return [
        `Prepare to discuss your creative process, not just your achievements. AOs want to understand HOW you think creatively and what drives your artistic choices.${strengthNote}`,
        `Have your "most meaningful piece/performance" story ready — not your biggest award, but the work that best represents who you are as an artist.`,
      ];
    }
    if (cat.includes('athlet') || cat.includes('sport') || cat.includes('team')) {
      return [
        `Prepare a story about a setback or loss and how you responded — AOs use athletics to assess resilience and character, not just talent.${strengthNote}`,
        `Be ready to discuss your role beyond your position: Did you mentor younger players? Change team culture? Create a training system?`,
      ];
    }

    // Generic fallback
    return [
      `Prepare ONE specific story from ${title} that reveals your character — not your resume. AOs remember stories, not bullet points.${strengthNote}`,
      `Have a clear answer for: "What would you miss most about ${title} if you had to stop?" — this reveals genuine passion vs. resume-building.`,
    ];
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
  /**
   * Detect if LLM-provided text is a generic template that could apply to ANY activity.
   * These are signs the LLM used a fill-in-the-blank pattern instead of genuine analysis.
   */
  private isGenericGuidance(text: string): boolean {
    if (!text || text.length < 20) return true;
    const genericPatterns = [
      'lead with your most concrete, specific achievement',
      'the detail that makes an admissions officer stop scanning',
      'avoid generic descriptions; specificity is what makes you memorable',
      'frame this activity in terms of growth and impact',
      'focus on what makes your experience distinctive',
      'prepare one specific story from',
      'what would you miss most about',
      'reveals genuine passion vs. resume-building',
      'reveals your character — not your resume',
      'aos remember stories, not bullet points',
    ];
    const lower = text.toLowerCase();
    return genericPatterns.filter(p => lower.includes(p)).length >= 2;
  }

  /**
   * Detect if interview tips are templated mad-libs (same template with activity title swapped in).
   */
  private isTemplatedInterviewTips(tips: string[]): boolean {
    if (!tips || tips.length === 0) return true;
    const templateSignals = [
      'prepare one specific story from',
      'what would you miss most about',
      'reveals genuine passion vs. resume-building',
      'reveals your character — not your resume',
      'aos remember stories, not bullet points',
    ];
    const lower = tips.join(' ').toLowerCase();
    return templateSignals.filter(s => lower.includes(s)).length >= 2;
  }

  private normalizeNarrativeGuidance(
    guidance: Record<string, unknown> | undefined,
    context?: {
      storyEssence?: string;
      narrativeArc?: string;
      constraintLevel?: string;
      activityTitle?: string;
      /** Activity strengths from analysis (green flags) */
      strengths?: string[];
      /** Activity category (e.g., 'stem_project', 'work_paid_employment') */
      category?: string;
      /** Activity tier from analysis */
      tier?: number;
    }
  ): ActivityTeaching['narrativeGuidance'] {
    const title = context?.activityTitle || 'this activity';
    const arc = context?.narrativeArc;
    const constraint = context?.constraintLevel;
    const cat = context?.category || '';

    // Extract howToTalkAboutThis — handle string or object format
    let howToTalkAboutThis: ActivityTeaching['narrativeGuidance']['howToTalkAboutThis'];

    const rawHow = guidance?.howToTalkAboutThis || guidance?.howToFrame || guidance?.framingAdvice;
    let rawHowText = '';
    if (rawHow && typeof rawHow === 'object') {
      rawHowText = ((rawHow as Record<string, unknown>).text as string) || '';
    } else if (rawHow && typeof rawHow === 'string') {
      rawHowText = rawHow;
    }

    // Use LLM text ONLY if it's genuinely specific (not a generic template)
    if (rawHowText && !this.isGenericGuidance(rawHowText)) {
      const citations = (rawHow && typeof rawHow === 'object')
        ? ((rawHow as Record<string, unknown>).citations as Array<{ source: string; text: string }>) || []
        : [];
      howToTalkAboutThis = { text: rawHowText, citations };
    } else {
      // Use category-specific framing — fundamentally different per activity type
      const categoryFraming = this.getCategorySpecificFraming(cat, title, context?.tier);

      let contextText: string;
      if (arc && constraint) {
        contextText = `${categoryFraming} Given your ${constraint} background, emphasize what this reveals about your resourcefulness — not just what you accomplished, but what it took to accomplish it alongside your other commitments.`;
      } else if (arc) {
        contextText = `${categoryFraming} Connect it to your ${arc} by showing how the skills from this experience feed into your other activities.`;
      } else if (context?.storyEssence) {
        contextText = `${categoryFraming} Tie it back to your broader story: ${context.storyEssence}.`;
      } else {
        contextText = categoryFraming;
      }
      howToTalkAboutThis = { text: contextText, citations: [] };
    }

    // Filter out template placeholder values the LLM may have parroted back
    const isTemplateValue = (val: string | undefined): boolean => {
      if (!val || val.length < 20) return true;
      const templates = ['angle', 'what makes this distinctive', 'what makes this special', 'one concrete thing',
        'focus on what makes your experience distinctive'];
      return templates.some(t => val.toLowerCase().trim() === t || val.toLowerCase().includes('what makes your') && val.toLowerCase().includes('distinctive from other'));
    };

    // Extract uniqueAngle — handle alternative keys
    const rawAngle = (guidance?.uniqueAngle as string)
      || (guidance?.unique_angle as string)
      || (guidance?.distinctiveElement as string);

    let uniqueAngle: string;
    if (rawAngle && !isTemplateValue(rawAngle)) {
      uniqueAngle = rawAngle;
    } else if (context?.strengths?.length && context?.activityTitle) {
      uniqueAngle = `Your ${context.activityTitle} stands out because of: ${context.strengths.slice(0, 2).join('; ')}. In interviews, lead with these concrete differentiators.`;
    } else if (context?.activityTitle) {
      uniqueAngle = `Think about what makes YOUR version of ${context.activityTitle} different from every other applicant doing the same thing. The answer is usually in the specific details, not the title.`;
    } else {
      uniqueAngle = 'Focus on what makes your experience distinctive — the specific details, not the title or role.';
    }

    // Extract connectionToStory — handle alternative keys
    const rawConnection = (guidance?.connectionToStory as string)
      || (guidance?.connection_to_story as string)
      || (guidance?.storyConnection as string)
      || (guidance?.narrativeConnection as string);

    // Only use LLM connection if it's genuinely activity-specific (not just the story essence repeated)
    let connectionToStory: string;
    const isJustStoryEssenceRepeated = rawConnection && context?.storyEssence
      && rawConnection.includes(context.storyEssence.substring(0, 40));
    if (rawConnection && !isJustStoryEssenceRepeated) {
      connectionToStory = rawConnection;
    } else {
      // Generate activity-specific connection based on category
      connectionToStory = this.getCategorySpecificStoryConnection(cat, title, context?.storyEssence, context?.narrativeArc);
    }

    // Extract interviewTips — handle string or array
    const rawTips = guidance?.interviewTips || guidance?.interview_tips;
    let interviewTips: string[];
    if (Array.isArray(rawTips) && !this.isTemplatedInterviewTips(rawTips.map(t => typeof t === 'string' ? t : String(t)))) {
      interviewTips = rawTips.map(t => typeof t === 'string' ? t : String(t));
    } else if (typeof rawTips === 'string' && !this.isGenericGuidance(rawTips)) {
      interviewTips = [rawTips];
    } else {
      // Generate category-specific interview tips — NOT the same template for every activity
      interviewTips = this.getCategorySpecificInterviewTips(cat, title, context?.strengths);
    }

    return { howToTalkAboutThis, uniqueAngle, connectionToStory, interviewTips };
  }

  /**
   * Generate activity-specific story connection based on category.
   * Each activity type connects to the narrative differently.
   */
  private getCategorySpecificStoryConnection(category: string, title: string, storyEssence?: string, arc?: string): string {
    const cat = category.toLowerCase();
    const arcName = arc || 'your narrative';

    if (cat.includes('research') || cat.includes('stem') || cat.includes('academic')) {
      return `${title} is the technical proof point of ${arcName} — it validates that your intellectual curiosity has real-world depth, not just classroom interest.`;
    }
    // Check family/farm BEFORE work — "work_family_responsibility" contains both
    if (cat.includes('family') || cat.includes('caregiv') || cat.includes('farm')) {
      return `${title} is the foundation of your story — the responsibility that shaped your time management, work ethic, and perspective. Every other activity was accomplished AROUND this obligation.`;
    }
    if (cat.includes('work') || cat.includes('employ') || cat.includes('job')) {
      return `${title} provides the constraint context that makes every other achievement more impressive — it shows you built your profile while carrying adult responsibilities.`;
    }
    if (cat.includes('service') || cat.includes('volunteer') || cat.includes('tutor') || cat.includes('community') || cat.includes('education')) {
      return `${title} demonstrates that your skills serve others, not just yourself — it transforms your profile from "talented individual" to "community multiplier."`;
    }
    if (cat.includes('leader') || cat.includes('government') || cat.includes('council') || cat.includes('club')) {
      return `${title} shows you don't just participate — you build. The initiative to create or lead something connects directly to ${arcName}.`;
    }
    if (cat.includes('art') || cat.includes('music') || cat.includes('creative') || cat.includes('perform') || cat.includes('theater') || cat.includes('film')) {
      return `${title} reveals the creative dimension of your profile — it shows intellectual range beyond your primary academic focus.`;
    }
    if (cat.includes('athlet') || cat.includes('sport') || cat.includes('team')) {
      return `${title} provides evidence of discipline, resilience, and teamwork that complements your academic profile.`;
    }

    // Generic with some story essence context
    if (storyEssence && storyEssence.length <= 100) {
      return `${title} reinforces your narrative: ${storyEssence}`;
    }
    return `${title} adds a distinct dimension to your overall story and strengthens your profile's coherence.`;
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
        strength: f.admissionsValue || f.flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        whyItMatters: { text: f.admissionsValue || `Your ${activity?.title || 'activity'} shows this quality, which admissions officers look for.`, citations: [] },
        howToLeverage: `In your ${activity?.title || 'activity'} description, highlight this strength with specific evidence.`,
        inApplications: 'Reference in essays, interviews, and additional information sections.',
      })) || [],
      improvementTeaching: analysis?.descriptionQuality?.issues?.map(issue => ({
        issue,
        whyItMatters: { text: `In your ${activity?.title || 'activity'} description, this affects how admissions officers perceive your involvement.`, citations: [] },
        howToFix: 'Add specific details and quantifiable outcomes from your actual experience.',
        exampleBefore: activity?.description?.substring(0, 80) || '',
        exampleAfter: 'Add specific metrics: numbers of people impacted, hours invested, measurable outcomes.',
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
    activityIds: string[],
    localCost?: { value: number },
    localTokens?: { input: number; output: number }
  ): Promise<TeachingContext['quickEncouragements']> {
    if (activityIds.length === 0) return [];

    const prompt = this.buildEncouragementPrompt(input, storyContext, analysisContext, activityIds);

    try {
      const response = await callClaude({
        model: this.MODEL,
        // R2-2: Enhanced system prompt requiring specific evidence-based encouragements
        systemPrompt: `You are an honest college counselor. Celebrate only when activities are genuinely strong.

CRITICAL: Celebrations must be CONDITIONAL and SPECIFIC:
1. ONLY celebrate if the activity has a noteworthy strength (specific metric, unique achievement, real impact)
2. If you celebrate, QUOTE the specific strong phrase from their description
3. Explain WHY this detail impresses AOs (be concise - 1-2 sentences)
4. Connect to their story role
5. If the description is weak/generic, DO NOT celebrate - skip to improvement teaching

BANNED: Generic praise ("shows dedication", "strong activity", "impressive") without specific evidence.

Example of GOOD celebration (genuinely strong):
"Your phrase 'designed peer-review system adopted by 3 departments' is concrete, scalable impact that stands out — most club presidents describe 'organizing events' but you've built infrastructure that outlasts you."

Example of NO celebration (weak activity):
Skip celebration entirely - the activity "helped tutor students" is generic and needs improvement, not praise.`,
        userPrompt: prompt,
        maxTokens: 2000,
        temperature: 0.5,
        cacheSystemPrompt: true, // Cache fixed system prompt
      });

      this.trackUsage(response.usage, localCost, localTokens);
      return this.parseEncouragementResponse(response.content, activityIds);
    } catch (error) {
      console.error('[Stage2] Encouragement generation failed:', error);
      // R2-2: Improved fallback with activity-specific data instead of generic praise
      return activityIds.map(id => {
        const activity = input.activities.find(a => a.id === id);
        const analysis = analysisContext.activities[id];
        const tier = analysis?.classification?.tier || 3;
        const topFlag = analysis?.greenFlags?.[0]?.flag || 'sustained engagement';
        return {
          activityId: id,
          celebration: `Your ${activity?.title || 'activity'} is performing at Tier ${tier} — ${topFlag} is exactly what admissions officers look for.`,
          strengthReason: `This strengthens your ${storyContext.narrativeIdentity.archetype} narrative.`,
        };
      });
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

Student Story: ${storyContext.narrativeIdentity.storyEssence}
Archetype: ${storyContext.narrativeIdentity.archetype}

${activities}

IMPORTANT: Use the EXACT activity IDs provided above (e.g., "${activityIds[0]}").

Respond with JSON:
{
  "encouragements": [
    {
      "activityId": "exact-id-from-above",
      "celebration": "ONLY IF genuinely strong: 1-2 sentences quoting a specific strong phrase and explaining why it works. E.g.: 'Your \"converting 3 classrooms into study spaces\" is tangible, measurable initiative that stands out.' OMIT THIS FIELD if description is weak/generic.",
      "strengthReason": "1 sentence connecting to their story. E.g.: 'This anchors your builder archetype — you create infrastructure, not just participate.'",
      "quickTip": "Optional: one SPECIFIC enhancement with numbers/evidence. NOT generic advice like 'add more details'."
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
      // R2-2: Slightly better fallback — at least acknowledges it's a strong activity by tier
      return activityIds.map(id => ({
        activityId: id,
        celebration: 'This activity earned a strong tier assessment, reflecting genuine quality in your engagement.',
        strengthReason: 'Activities at this level contribute meaningfully to your application narrative.',
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
    // Build substantive portfolio-level teaching from analysis data
    const fullTheme = storyContext.narrativeIdentity.primaryTheme;
    // Truncate theme for inline use in sentences (use first clause if too long)
    const theme = fullTheme.length > 50
      ? fullTheme.split(/[—,;]/)[0].trim()
      : fullTheme;
    const archetype = storyContext.narrativeIdentity.archetype;
    const essence = storyContext.narrativeIdentity.storyEssence;
    const strengths = analysisContext.portfolioTeachingNeeds.strengthsToHighlight;

    // Build archetype-aware narrative quality description
    const archetypeNarrative = archetype === 'builder' ? 'creation and initiative'
      : archetype === 'caretaker' ? 'service and responsibility'
      : archetype === 'scholar' ? 'intellectual curiosity and rigor'
      : archetype === 'innovator' ? 'innovation and problem-solving'
      : archetype === 'leader' ? 'leadership and community impact'
      : archetype === 'advocate' ? 'advocacy and social change'
      : 'authentic engagement';

    // Build a genuine two-sentence pitch
    const essenceClean = essence.endsWith('.') ? essence : `${essence}.`;
    const twoSentencePitch = `${essenceClean} Your focus on ${theme.toLowerCase()} ties your activities into a compelling narrative of ${archetypeNarrative}.`;

    // Build meaningful recommendation from strengths
    let recommendation: string;
    if (strengths.length >= 2) {
      recommendation = `Your strongest portfolio signals are ${strengths.slice(0, 2).join(' and ')}. Lean into these across your essays and interview — they differentiate you from applicants with similar activities but less depth.`;
    } else if (strengths.length === 1) {
      recommendation = `Your strongest portfolio signal is ${strengths[0]}. Make sure this comes through in your essays and interview, not just your activity list.`;
    } else {
      recommendation = 'Focus on strengthening the connections between your activities so admissions readers can see a clear narrative thread.';
    }

    // Build substantive coherence improvements
    const coherenceImprovements: string[] = [];
    const disconnected = analysisContext.coherenceAnalysis.disconnectedActivities;
    if (disconnected.length > 0) {
      for (const d of disconnected.slice(0, 3)) {
        const activity = input.activities.find(a => a.id === d.activityId);
        if (activity) {
          coherenceImprovements.push(
            `${activity.title} feels disconnected from your ${theme} narrative. In your essays, show how this experience shaped your perspective or skills in a way that connects to your other work.`
          );
        }
      }
    }
    if (analysisContext.coherenceAnalysis.score >= 70 && coherenceImprovements.length === 0) {
      coherenceImprovements.push(`Your activities show strong coherence around ${theme}. In your essays, explicitly reference how different activities informed each other.`);
    } else if (coherenceImprovements.length === 0) {
      coherenceImprovements.push('Your activity list covers diverse areas. Use your personal statement to draw a connecting thread — what do ALL these experiences reveal about who you are?');
    }

    // Build strategic direction with specifics
    let strategicDirection: string;
    if (analysisContext.spikeAnalysis.hasSpike) {
      const spikeArea = analysisContext.spikeAnalysis.spikeType || theme;
      strategicDirection = `Your ${spikeArea} spike is your competitive advantage. Continue deepening it — admissions readers at schools like ${input.studentContext?.targetSchools?.[0] || 'selective universities'} look for applicants who show genuine depth over manufactured breadth.`;
    } else {
      const bestTier = Object.entries(analysisContext.activities)
        .sort(([, a], [, b]) => (a.classification?.tier || 4) - (b.classification?.tier || 4))[0];
      const bestActivity = bestTier ? input.activities.find(a => a.id === bestTier[0]) : null;
      strategicDirection = bestActivity
        ? `You don't have a clear spike yet, but ${bestActivity.title} shows the most promise. Deepening your impact there — taking on more leadership, seeking external recognition, or publishing results — could develop it into a genuine differentiator.`
        : `Consider deepening your involvement in ${theme} to develop a clearer spike. Selective schools value depth over breadth.`;
    }

    return {
      narrativeTeaching: {
        currentState: analysisContext.portfolioTeachingNeeds.primaryIssue,
        recommendation,
        twoSentencePitch,
      },
      coherenceTeaching: {
        currentScore: analysisContext.coherenceAnalysis.score,
        improvements: coherenceImprovements,
      },
      strategicDirection,
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
