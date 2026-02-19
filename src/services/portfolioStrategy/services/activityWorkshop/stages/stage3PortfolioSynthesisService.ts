// @ts-nocheck
/**
 * Stage 3: Portfolio Synthesis Service
 *
 * FINAL ACTIONABLE STRATEGY (Quick synthesis using Haiku)
 *
 * PURPOSE:
 * ========
 * Brings together all previous stages into a cohesive, actionable plan:
 * 1. Final competitive tier assessment (derived from portfolio score)
 * 2. Optimally ordered activity list with final descriptions
 * 3. Prioritized action plan (immediate, short-term, long-term)
 * 4. School fit summary (if target schools provided)
 * 5. Celebratory closing message
 *
 * This is the "landing pad" - everything the student needs to act on.
 *
 * MODEL: Haiku for quick synthesis (data already analyzed, just synthesizing)
 * COST: ~$0.02-0.03
 */

import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import {
  ActivityWorkshopSessionInput,
  StoryContext,
  AnalysisContext,
  TeachingContext,
  SynthesisContext,
} from '../types';

// Import profile types and bridge for enriched synthesis with real student data
import type { ActivityProfile } from '../profile/types';
import { profileBridgeService } from '../profileBridge';

/**
 * Stage 3: Portfolio Synthesis Service
 *
 * Creates the final actionable synthesis from all previous stages
 */
export class Stage3PortfolioSynthesisService {
  private readonly MODEL = 'claude-haiku-4-5-20251001';

  /**
   * Run portfolio synthesis
   *
   * @param input - Original workshop input
   * @param storyContext - Stage 0 output
   * @param analysisContext - Stage 1 output
   * @param teachingContext - Stage 2 output
   * @param activityProfiles - Optional map of activity ID → rich profile data from conversations
   * @returns SynthesisContext with final actionable strategy
   */
  async synthesize(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    teachingContext: TeachingContext,
    activityProfiles?: Record<string, ActivityProfile>
  ): Promise<SynthesisContext> {
    const startTime = Date.now();
    console.log(`[Stage3] Starting portfolio synthesis`);

    // Calculate total pipeline cost
    const pipelineCost = {
      stage0: storyContext.metadata.cost,
      stage1: analysisContext.analysisMetadata.cost,
      stage2: teachingContext.teachingMetadata.cost,
      stage3: 0, // Will be updated after this call
      total: 0,
    };

    // Build synthesis prompt
    const prompt = this.buildSynthesisPrompt(
      input,
      storyContext,
      analysisContext,
      teachingContext,
      activityProfiles
    );

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt: this.getSystemPrompt(),
        userPrompt: prompt,
        maxTokens: 3000,
        temperature: 0.3,
      });

      const synthesis = this.parseSynthesisResponse(
        response.content,
        input,
        storyContext,
        analysisContext,
        teachingContext
      );

      // Calculate stage 3 cost
      const stage3Cost = this.calculateCost(response.usage);
      pipelineCost.stage3 = stage3Cost;
      pipelineCost.total = pipelineCost.stage0 + pipelineCost.stage1 + pipelineCost.stage2 + pipelineCost.stage3;

      synthesis.pipelineCost = pipelineCost;
      synthesis.synthesisMetadata = {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: {
          input: response.usage?.input_tokens || 0,
          output: response.usage?.output_tokens || 0,
        },
        cost: stage3Cost,
      };

      console.log(`[Stage3] Synthesis complete in ${Date.now() - startTime}ms`);
      console.log(`[Stage3] Strength: ${synthesis.finalAssessment.overallStrength}`);
      console.log(`[Stage3] Total pipeline cost: $${pipelineCost.total.toFixed(4)}`);

      return synthesis;
    } catch (error) {
      console.error('[Stage3] Synthesis failed:', error);
      return this.createFallbackSynthesis(
        input,
        storyContext,
        analysisContext,
        teachingContext,
        pipelineCost
      );
    }
  }

  /**
   * Build synthesis prompt
   */
  private buildSynthesisPrompt(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    teachingContext: TeachingContext,
    activityProfiles?: Record<string, ActivityProfile>
  ): string {
    // Summarize story
    const storySummary = `
## STUDENT PROFILE:
Story: ${storyContext.narrativeIdentity.storyEssence}
Archetype: ${storyContext.narrativeIdentity.archetype}
Theme: ${storyContext.narrativeIdentity.primaryTheme}
Spike: ${storyContext.spikeHypothesis.likelySpike ? `${storyContext.spikeHypothesis.spikeArea} (${storyContext.spikeHypothesis.maturity})` : 'Not yet developed'}
Context: ${[
  storyContext.contextualFactors.hasWorkFamilyObligations ? 'Work/family obligations' : '',
  storyContext.contextualFactors.firstGenIndicators ? 'First-gen' : '',
  storyContext.contextualFactors.hasResourceConstraints ? 'Resource constraints' : '',
].filter(Boolean).join(', ') || 'Standard context'}
`;

    // Summarize analysis
    const analysisSummary = `
## PORTFOLIO ANALYSIS:
Tier Distribution: T1=${analysisContext.tierDistribution.tier1}, T2=${analysisContext.tierDistribution.tier2}, T3=${analysisContext.tierDistribution.tier3}, T4=${analysisContext.tierDistribution.tier4}
Portfolio Tier: ${analysisContext.tierDistribution.portfolioTier}
Coherence: ${analysisContext.coherenceAnalysis.score}/100 (${analysisContext.coherenceAnalysis.assessment})
Spike: ${analysisContext.spikeAnalysis.hasSpike ? `Yes - ${analysisContext.spikeAnalysis.spikeType}` : 'No clear spike'}
Competitive Level: ${analysisContext.competitiveAssessment.overallStrength}
Primary Need: ${analysisContext.portfolioTeachingNeeds.primaryIssue}
`;

    // Scoring data (v4.3) — gives Haiku real scores for better synthesis
    let scoringSummary = '';
    if (analysisContext.scoring?.scoringComplete) {
      const rubric = analysisContext.scoring.portfolioRubric;
      const activityScoreLines = rubric.activityScores.map(s =>
        `- ${s.activityTitle}: ${s.combinedScore.total.toFixed(1)}/10 (Activity: ${s.activityScore.total.toFixed(1)}, Description: ${s.descriptionScore.total.toFixed(1)})`
      ).join('\n');
      scoringSummary = `
## SCORING DATA (1-10 Scale):
Portfolio Score: ${rubric.overallScore.total.toFixed(1)}/10
Competitive Tier: ${rubric.harvardScale.description}
Key Strengths: ${rubric.keyStrengths.slice(0, 3).join('; ')}
Key Gaps: ${rubric.keyGaps.slice(0, 3).join('; ')}

Per-Activity Scores:
${activityScoreLines}
`;
    }

    // Summarize teaching delivered
    const teachingSummary = `
## TEACHING DELIVERED:
Deep Teaching: ${teachingContext.teachingDelivered.filter(t => t.teachingDepth === 'deep').length} activities
Medium Teaching: ${teachingContext.teachingDelivered.filter(t => t.teachingDepth === 'medium').length} activities
Quick Encouragement: ${teachingContext.quickEncouragements.length} activities
Skipped: ${teachingContext.skippedActivities.length} activities
`;

    // List activities with optimized descriptions, scores, and optional profile narrative data
    let hasAnyProfiles = false;
    const activitiesList = input.activities.map(a => {
      const analysis = analysisContext.activities[a.id];
      const teaching = teachingContext.teachingDelivered.find(t => t.activityId === a.id);
      const optimizedDesc = teaching?.teaching.descriptionOptimization.optimizedDescription || a.description;
      const activityScore = analysisContext.scoring?.activityScoresById[a.id];

      const scoreLine = activityScore
        ? `- Score: ${activityScore.combinedScore.total.toFixed(1)}/10 (Activity: ${activityScore.activityScore.total.toFixed(1)}, Description: ${activityScore.descriptionScore.total.toFixed(1)})`
        : '';

      // Enrich with profile narrative context when available
      let connectionContext = '';
      if (activityProfiles?.[a.id]) {
        const profile = activityProfiles[a.id];
        if (profileBridgeService.isProfileUseful(profile)) {
          hasAnyProfiles = true;
          const summary = profileBridgeService.summarizeForSynthesis(profile);
          connectionContext = `\n  Narrative Role: ${summary.narrativeRole}`;
          if (summary.uniqueAngle) {
            connectionContext += `\n  Unique Angle: ${summary.uniqueAngle}`;
          }
          if (summary.narrativeContribution) {
            connectionContext += `\n  Narrative Contribution: ${summary.narrativeContribution}`;
          }
          if (summary.bestDescriptionElements.length > 0) {
            connectionContext += `\n  Best Description Elements: ${summary.bestDescriptionElements.slice(0, 3).join('; ')}`;
          }
          if (summary.characterTraits.length > 0) {
            connectionContext += `\n  Character Traits: ${summary.characterTraits.join(', ')}`;
          }
          if (summary.spikeRelevance) {
            connectionContext += `\n  Spike Connection: ${summary.spikeRelevance}`;
          }
          if (summary.majorAlignment) {
            connectionContext += `\n  Major Alignment: ${summary.majorAlignment}`;
          }
        }
      }

      return `
${a.id}: ${a.title}
- Tier: ${analysis?.classification?.tier || 4}
${scoreLine}
- Original (${a.description.length} chars): "${a.description.substring(0, 100)}..."
- Optimized (${optimizedDesc.length} chars): "${optimizedDesc.substring(0, 100)}..."${connectionContext}
`;
    }).join('');

    // Target schools if provided
    const schoolsSection = input.studentContext?.targetSchools?.length
      ? `\n## TARGET SCHOOLS:\n${input.studentContext.targetSchools.join(', ')}`
      : '';

    return `Synthesize this analysis into a final actionable strategy.

${storySummary}
${analysisSummary}
${scoringSummary}
${teachingSummary}
${schoolsSection}

## ACTIVITIES:
${activitiesList}

## YOUR TASK:

Create a final synthesis that gives the student EVERYTHING they need to act.

Respond with JSON:
{
  "finalAssessment": {
    "overallStrength": "exceptional|strong|competitive|developing|needs_work",
    "confidence": 0-100
  },
  "orderedActivities": [
    {
      "rank": 1,
      "activityId": "id",
      "reason": "Why this is #1",
      "finalDescription": "The optimized 150-char description",
      "characterCount": 145
    }
  ],
  "actionPlan": {
    "immediate": [
      { "action": "Do this now", "activityId": "optional", "impact": "Why it matters" }
    ],
    "shortTerm": [
      { "action": "Do in 1-3 months", "activityId": "optional", "impact": "Why", "deadline": "optional" }
    ],
    "longTerm": [
      { "action": "Strategic 3+ months", "activityId": "optional", "impact": "Why" }
    ]
  },
  "schoolFitSummary": [
    {
      "school": "School Name",
      "fitLevel": "excellent|good|moderate|challenging",
      "keyStrengths": ["strength1"],
      "keyConcerns": ["concern1"]
    }
  ],
  "finalMessage": {
    "celebration": "2-3 sentences celebrating their strengths",
    "keyTakeaway": "The ONE most important thing to remember",
    "closing": "Encouraging closing sentence"
  }
}

IMPORTANT:
- Order activities by impact (strongest first)
- Make action plan SPECIFIC and actionable — reference actual activities and roles by name
- Celebration should be genuine and warm
- For finalDescription fields: ${hasAnyProfiles ? 'When an activity has Unique Angle / Narrative Contribution / Best Description Elements / Character Traits / Spike Connection data listed above, use those VERIFIED FACTS to write descriptions grounded in the student\'s REAL achievements. Incorporate the Best Description Elements directly. These activities have rich profile data from conversation — prefer their actual metrics over fabricated examples.' : 'Include vivid, specific suggested metrics and details (like "trained 12+ new employees" or "organized fundraiser raising $3,200") even if the student didn\'t mention exact numbers. These serve as EXAMPLES that inspire students to fill in their own real figures. The goal is to show WHAT KIND of details make descriptions compelling.'}
- For action plan items: Keep advice forward-looking and actionable. Suggest what the student SHOULD DO (e.g., "quantify your tutoring impact with grade improvements"), not retrospective claims about what was achieved.`;
  }

  /**
   * System prompt for synthesis
   */
  private getSystemPrompt(): string {
    return `You are an expert college counselor providing a final synthesis of a student's activity portfolio analysis.

Your role is to:
1. Assess overall portfolio strength honestly
2. Order activities optimally for Common App (strongest impact first)
3. Create an actionable plan they can execute
4. End on an encouraging, celebratory note

Be honest but kind. Students deserve truthful feedback delivered warmly.

Output valid JSON only.`;
  }

  /**
   * Parse synthesis response
   */
  private parseSynthesisResponse(
    response: string,
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    teachingContext: TeachingContext
  ): SynthesisContext {
    try {
      const parsed = parseClaudeJSON<Record<string, unknown>>(response, 'Stage3Synthesis');
      console.log('[Stage3] JSON parsed successfully');

      // Derive Harvard scale from portfolio score instead of asking AI to compute it (saves tokens)
      const portfolioScore = analysisContext.scoring?.portfolioRubric?.overallScore?.total;
      const derivedHarvard = this.deriveHarvardFromScore(portfolioScore);

      return {
        finalAssessment: {
          harvardScale: derivedHarvard,
          harvardScaleRationale: `Derived from portfolio score ${portfolioScore?.toFixed(1) || 'N/A'}/10`,
          overallStrength: this.validateOverallStrength(parsed.finalAssessment?.overallStrength),
          confidence: parsed.finalAssessment?.confidence || 70,
        },
        orderedActivities: this.normalizeOrderedActivities(
          parsed.orderedActivities,
          input,
          analysisContext,
          teachingContext
        ),
        actionPlan: this.normalizeActionPlan(parsed.actionPlan, input),
        schoolFitSummary: parsed.schoolFitSummary || undefined,
        finalMessage: this.normalizeFinalMessage(parsed.finalMessage, storyContext),
        pipelineCost: { stage0: 0, stage1: 0, stage2: 0, stage3: 0, total: 0 },
        synthesisMetadata: {
          generatedAt: '',
          modelUsed: '',
          tokensUsed: { input: 0, output: 0 },
          cost: 0,
        },
      };
    } catch (error) {
      console.error('[Stage3] Failed to parse synthesis response:', error);
      return this.createFallbackSynthesis(
        input,
        storyContext,
        analysisContext,
        teachingContext,
        { stage0: 0, stage1: 0, stage2: 0, stage3: 0, total: 0 }
      );
    }
  }

  /**
   * Derive Harvard 1-6 rating from portfolio score (no AI computation needed)
   * Maps the 1-10 portfolio score to the 1-6 scale for backward compatibility.
   */
  private deriveHarvardFromScore(score: number | undefined): 1 | 2 | 3 | 4 | 5 | 6 {
    if (!score) return 4;
    if (score >= 8.5) return 1;
    if (score >= 7.0) return 2;
    if (score >= 5.5) return 3;
    if (score >= 4.0) return 4;
    if (score >= 2.5) return 5;
    return 6;
  }

  /**
   * Validate overall strength value
   */
  private validateOverallStrength(
    strength: string | undefined
  ): SynthesisContext['finalAssessment']['overallStrength'] {
    const valid = ['exceptional', 'strong', 'competitive', 'developing', 'needs_work'] as const;
    if (strength && valid.includes(strength as typeof valid[number])) {
      return strength as typeof valid[number];
    }
    return 'competitive';
  }

  /**
   * Normalize ordered activities
   */
  private normalizeOrderedActivities(
    activities: Array<{
      rank: number;
      activityId: string;
      reason: string;
      finalDescription: string;
      characterCount: number;
    }> | undefined,
    input: ActivityWorkshopSessionInput,
    analysisContext: AnalysisContext,
    teachingContext: TeachingContext
  ): SynthesisContext['orderedActivities'] {
    if (activities && activities.length > 0) {
      return activities.map(a => ({
        rank: a.rank,
        activityId: a.activityId,
        reason: a.reason || 'Based on tier and impact',
        finalDescription: a.finalDescription || input.activities.find(act => act.id === a.activityId)?.description || '',
        characterCount: a.characterCount || a.finalDescription?.length || 0,
      }));
    }

    // R2-4: Fallback ordering — tier primary, combined score tiebreaker, input order last
    const ordered = input.activities
      .map(a => ({
        activity: a,
        tier: analysisContext.activities[a.id]?.classification?.tier || 4,
        combinedScore: analysisContext.scoring?.activityScoresById[a.id]?.combinedScore?.total ?? 0,
      }))
      .sort((a, b) => {
        // Primary: tier ascending (Tier 1 first)
        if (a.tier !== b.tier) return a.tier - b.tier;
        // Tiebreaker: combined score descending (higher score first)
        if (a.combinedScore !== b.combinedScore) return b.combinedScore - a.combinedScore;
        // Final tiebreaker: preserve input order
        return input.activities.indexOf(a.activity) - input.activities.indexOf(b.activity);
      });

    return ordered.map((item, index) => {
      const teaching = teachingContext.teachingDelivered.find(t => t.activityId === item.activity.id);
      const finalDesc = teaching?.teaching.descriptionOptimization.optimizedDescription || item.activity.description;

      return {
        rank: index + 1,
        activityId: item.activity.id,
        reason: `Tier ${item.tier} activity`,
        finalDescription: finalDesc,
        characterCount: finalDesc.length,
      };
    });
  }

  /**
   * Normalize a single action plan item from LLM output.
   * Handles: plain strings, objects with standard keys, objects with alternate keys.
   */
  private normalizeActionItem(
    item: unknown
  ): { action: string; activityId?: string; impact: string; deadline?: string } | null {
    if (!item) return null;

    // Handle plain string items
    if (typeof item === 'string') {
      return { action: item, impact: '' };
    }

    if (typeof item !== 'object') return null;

    const obj = item as Record<string, unknown>;

    // Extract action from multiple possible key names
    const action = (obj.action as string)
      || (obj.action_item as string)
      || (obj.task as string)
      || (obj.recommendation as string)
      || (obj.step as string)
      || (obj.description as string)
      || '';

    if (!action) {
      // Last resort: stringify the object values
      const firstStringValue = Object.values(obj).find(v => typeof v === 'string' && (v as string).length > 5);
      if (firstStringValue) {
        return { action: firstStringValue as string, impact: '' };
      }
      return null;
    }

    const activityId = (obj.activityId as string)
      || (obj.activity_id as string)
      || (obj.activityID as string)
      || undefined;

    const impact = (obj.impact as string)
      || (obj.why as string)
      || (obj.reason as string)
      || (obj.rationale as string)
      || '';

    const deadline = (obj.deadline as string)
      || (obj.timeframe as string)
      || (obj.timeline as string)
      || undefined;

    return { action, activityId, impact, deadline };
  }

  /**
   * Build a set of numbers/metrics the student actually mentioned,
   * so we can detect when the LLM invents specifics.
   */
  private buildStudentFactSet(input: ActivityWorkshopSessionInput): Set<string> {
    const facts = new Set<string>();
    // Collect all text the student actually provided
    const allText = input.activities.map(a => {
      const parts = [
        a.description,
        a.title,
        a.role,
        String(a.hoursPerWeek),
        String(a.weeksPerYear),
        String(a.yearsInvolved || ''),
        ...(a.achievements?.map(ach => ach.title) || []),
      ];
      return parts.join(' ');
    }).join(' ') + ' ' + (input.studentContext?.constraintNotes || '');

    // Extract all numbers the student mentioned
    const numbers = allText.match(/\d+/g) || [];
    for (const n of numbers) facts.add(n);
    return facts;
  }

  /**
   * Detect if an action plan item contains fabricated specifics
   * (numbers/percentages not present in student input).
   */
  private flagHallucinatedSpecifics(
    action: string,
    impact: string,
    studentFacts: Set<string>
  ): string | undefined {
    const fullText = `${action} ${impact}`;
    // Find percentage claims like "8% improvement", "15% increase"
    const percentClaims = fullText.match(/(\d+(?:\.\d+)?)\s*%/g) || [];
    // Find specific number claims like "200-acre", "$5,000 revenue"
    const specificClaims = fullText.match(/\b(\d{2,})\s*[-]?\s*(?:acre|student|member|hour|dollar|participant|attendee)/gi) || [];

    const fabricated: string[] = [];
    for (const claim of [...percentClaims, ...specificClaims]) {
      const num = claim.match(/(\d+)/)?.[1];
      if (num && !studentFacts.has(num)) {
        fabricated.push(claim.trim());
      }
    }

    if (fabricated.length > 0) {
      return `[Verify: ${fabricated.join(', ')} — not from your input]`;
    }
    return undefined;
  }

  /**
   * Normalize action plan — robust against all LLM format variations
   */
  private normalizeActionPlan(
    plan: Record<string, unknown> | undefined,
    input: ActivityWorkshopSessionInput
  ): SynthesisContext['actionPlan'] {
    const studentFacts = this.buildStudentFactSet(input);

    const normalizeList = (
      items: unknown,
      fallback: { action: string; impact: string }
    ) => {
      if (!Array.isArray(items) || items.length === 0) {
        return [fallback];
      }
      const normalized = items
        .map(item => this.normalizeActionItem(item))
        .filter((item): item is NonNullable<typeof item> => item !== null && item.action.length > 0)
        .map(item => {
          // Check for hallucinated specifics
          const flag = this.flagHallucinatedSpecifics(item.action, item.impact, studentFacts);
          if (flag) {
            item.impact = item.impact ? `${item.impact} ${flag}` : flag;
          }
          return item;
        });
      return normalized.length > 0 ? normalized : [fallback];
    };

    // Handle alternative key names for the plan categories
    const immediate = plan?.immediate || plan?.immediate_actions || plan?.immediateActions || plan?.now;
    const shortTerm = plan?.shortTerm || plan?.short_term || plan?.shortTermActions || plan?.upcoming;
    const longTerm = plan?.longTerm || plan?.long_term || plan?.longTermActions || plan?.future;

    return {
      immediate: normalizeList(immediate, {
        action: 'Review and update activity descriptions',
        impact: 'Ensures accurate representation',
      }),
      shortTerm: normalizeList(shortTerm, {
        action: 'Finalize Common App activity order',
        impact: 'Presents strongest profile first',
      }),
      longTerm: normalizeList(longTerm, {
        action: 'Continue deepening primary activities',
        impact: 'Strengthens spike development',
      }),
    };
  }

  /**
   * Normalize final message
   */
  private normalizeFinalMessage(
    message: {
      celebration?: string;
      keyTakeaway?: string;
      closing?: string;
    } | undefined,
    storyContext: StoryContext
  ): SynthesisContext['finalMessage'] {
    return {
      celebration: message?.celebration ||
        `Your portfolio shows genuine ${storyContext.narrativeIdentity.archetype} energy. The commitment you've shown to ${storyContext.narrativeIdentity.primaryTheme} demonstrates authentic passion that admissions officers value.`,
      keyTakeaway: message?.keyTakeaway ||
        'Focus on telling your story coherently across all activities.',
      closing: message?.closing ||
        'You have a compelling story to tell. Trust your authentic voice.',
    };
  }

  /**
   * Create fallback synthesis when LLM fails
   */
  private createFallbackSynthesis(
    input: ActivityWorkshopSessionInput,
    storyContext: StoryContext,
    analysisContext: AnalysisContext,
    teachingContext: TeachingContext,
    pipelineCost: SynthesisContext['pipelineCost']
  ): SynthesisContext {
    // Derive Harvard scale from portfolio score when available, otherwise from tier distribution
    const portfolioScore = analysisContext.scoring?.portfolioRubric?.overallScore?.total;
    const harvardScale = this.deriveHarvardFromScore(portfolioScore);

    return {
      finalAssessment: {
        harvardScale,
        harvardScaleRationale: `Derived from portfolio score ${portfolioScore?.toFixed(1) || 'N/A'}/10`,
        overallStrength: analysisContext.competitiveAssessment.overallStrength,
        confidence: 60, // Lower for fallback
      },
      orderedActivities: this.normalizeOrderedActivities(
        undefined,
        input,
        analysisContext,
        teachingContext
      ),
      actionPlan: this.normalizeActionPlan(undefined, input),
      finalMessage: this.normalizeFinalMessage(undefined, storyContext),
      pipelineCost,
      synthesisMetadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'fallback',
        tokensUsed: { input: 0, output: 0 },
        cost: 0,
      },
    };
  }

  /**
   * Calculate cost from token usage
   */
  private calculateCost(usage: { input_tokens?: number; output_tokens?: number } | undefined): number {
    if (!usage) return 0;
    // Haiku pricing: $0.25/M input, $1.25/M output
    const inputCost = ((usage.input_tokens || 0) / 1_000_000) * 0.25;
    const outputCost = ((usage.output_tokens || 0) / 1_000_000) * 1.25;
    return inputCost + outputCost;
  }
}

// Export singleton
export const stage3PortfolioSynthesisService = new Stage3PortfolioSynthesisService();
