// @ts-nocheck
/**
 * Batch Activity Teaching Service
 *
 * COST-OPTIMIZED TEACHING - Single API call for entire portfolio
 *
 * This service provides teaching and guidance based on batch analysis:
 * 1. Single API call for all activity teachings instead of per-activity calls
 * 2. Leverages the complete portfolio analysis context for coherent guidance
 * 3. Maintains quality through comprehensive prompt engineering
 *
 * COST COMPARISON:
 * - Old approach: ~$0.08-0.12 per activity × 10 activities = $0.80-1.20
 * - New approach: ~$0.20-0.30 for entire portfolio = 75% cost reduction
 *
 * MODEL: Sonnet for quality (teaching is user-facing)
 */

import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../../lib/llm/claude';
import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  ActivityAnalysis,
  PortfolioAnalysis,
  ActivityTeaching,
  PortfolioTeaching,
  IActivityTeachingService,
  CitedText,
} from './types';

import { ActivityTier } from '../../types';
import { SpikeType, SpikeStrength } from '../../knowledge';
import { activityCitationService } from './activityCitationService';
import { parseClaudeJSON } from '../../../commonAppWorkshop/utils/jsonParser';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_BATCH_TEACHING = 16000;

// ============================================================================
// BATCH TEACHING PROMPT
// ============================================================================

const BATCH_TEACHING_PROMPT = `You are an expert college admissions counselor providing EDUCATIONAL GUIDANCE based on comprehensive analysis. Provide teaching for ALL activities AND the portfolio as a whole in a SINGLE response.

## Student Context:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}
Grade Level: {{gradeLevel}}

## Complete Portfolio Analysis:
{{portfolioAnalysisJson}}

## Your Task:
Based on the analysis, provide EDUCATIONAL, ACTIONABLE guidance for EACH activity AND the portfolio as a whole. Help the student understand:
1. WHY each activity is classified at its tier (with specific benchmarks)
2. WHAT strengths to leverage
3. HOW to improve specific issues
4. WHAT optimized descriptions look like
5. STRATEGIC portfolio positioning

## Respond in this exact JSON format:
{
  "activityTeachings": {
    "<activity_id>": {
      "tierExplanation": {
        "assignedTier": 1|2|3|4,
        "explanation": "Detailed explanation of why this tier",
        "benchmarksUsed": [{"tier": 1|2|3|4, "benchmark": "specific benchmark", "source": "Sara Harberson Framework / Competition Database", "studentMeets": true|false, "gap": "what would be needed if not meeting"}],
        "whatMakesThisTier": "clear criteria explanation",
        "whatWouldChangeIt": "specific steps to move to next tier"
      },
      "strengthTeaching": [{"strength": "name", "whyItMatters": "educational explanation", "howToLeverage": "specific advice", "inApplications": "how to present"}],
      "improvementTeaching": [{"issue": "specific issue", "whyItMatters": "why problematic", "howToFix": "actionable steps", "exampleBefore": "current phrasing", "exampleAfter": "improved version", "priority": "high|medium|low"}],
      "upgradePathway": {
        "currentTier": 1|2|3|4,
        "targetTier": 1|2|3,
        "feasibility": "high|medium|low",
        "timeRequired": "realistic estimate",
        "steps": [{"step": 1, "action": "specific action", "rationale": "why this matters", "milestone": "success indicator", "timeframe": "when", "resources": ["helpful resources"]}],
        "successIndicators": ["how to know upgraded"],
        "risks": ["what could go wrong"]
      },
      "descriptionOptimization": {
        "originalDescription": "current description",
        "optimizedDescription": "150-char optimized version",
        "characterCount": number,
        "changesExplained": [{"change": "what changed", "reason": "why better"}],
        "alternativeVersions": ["optional alternatives"]
      },
      "narrativeGuidance": {
        "howToTalkAboutThis": "guidance on presenting",
        "uniqueAngle": "what makes distinctive",
        "connectionToStory": "broader narrative connection",
        "interviewTips": ["tips for interviews"],
        "essayPotential": {"viable": true|false, "angle": "potential approach", "cautionAreas": ["what to avoid"]}
      }
    }
  },
  "portfolioTeaching": {
    "narrativeTeaching": {
      "twoSentencePitch": "compelling two-sentence summary",
      "extendedPitch": "3-4 sentence essay version",
      "archetype": "research_scientist|tech_builder|entrepreneur|writer_intellectual|...|well_rounded|emerging",
      "archetypeExplanation": "why this archetype fits",
      "howToPresent": "guidance on presenting narrative",
      "narrativeStrengths": ["what's working"],
      "narrativeWeaknesses": ["what needs work"]
    },
    "spikeTeaching": {
      "currentState": "assessment of current spike",
      "whatMakesASpike": "educational explanation",
      "studentSpikeAssessment": "honest assessment",
      "developmentStrategy": {
        "strategy": "recommended approach",
        "focusActivities": ["activity_ids to double down"],
        "deprioritizeActivities": ["activity_ids to reduce"],
        "newOpportunities": ["things to consider starting"],
        "timeline": "when to accomplish what",
        "rationale": "why this strategy"
      }
    },
    "coherenceTeaching": {
      "currentCoherence": "assessment of connections",
      "whatMakesCoherence": "educational explanation",
      "connectingActivities": [{"activity1": "id", "activity2": "id", "howToConnect": "draw connection"}],
      "addressingDisconnects": [{"activityId": "id", "issue": "why disconnected", "solutions": ["options"], "recommendation": "best approach"}],
      "strengtheningStrategies": ["ways to improve coherence"]
    },
    "commonAppStrategy": {
      "recommendedOrder": ["activity_ids in optimal order"],
      "orderRationale": "why this order creates best impression",
      "whatToHighlight": [{"activityId": "id", "why": "reason", "how": "technique"}],
      "whatToMinimize": [{"activityId": "id", "why": "reason", "alternativeApproach": "how to handle"}],
      "overallPositioning": "strategic positioning advice",
      "characterCountStrategy": "how to use 150 chars effectively"
    },
    "gapFillingGuidance": [{"gap": "what's missing", "severity": "critical|significant|minor", "solutions": [{"solution": "option", "feasibility": "high|medium|low", "timeRequired": "estimate", "impact": "expected benefit"}], "recommendedApproach": "best solution"}],
    "strategicRecommendations": {
      "immediate": ["do in next 2 weeks"],
      "shortTerm": ["do in next 3-6 months"],
      "longTerm": ["do in next 1-2 years"],
      "activitiesToStop": [{"activityId": "id", "reason": "why", "alternative": "what instead"}],
      "activitiesToDeepen": [{"activityId": "id", "howToDeepen": "specific actions", "expectedOutcome": "what you'll achieve"}],
      "newActivitiesToConsider": [{"suggestion": "activity", "rationale": "why fits", "fitWithProfile": "how connects", "feasibility": "high|medium|low"}]
    },
    "schoolSpecificGuidance": [{"school": "name", "fitScore": 0-100, "strengths": ["what profile has"], "concerns": ["what might worry"], "positioningTips": ["how to present"]}]
  }
}

IMPORTANT:
- Provide teaching for ALL activities in the activityTeachings object
- Be specific and actionable - students should know exactly what to do
- Cite specific benchmarks and frameworks
- Optimize descriptions to exactly 150 characters
- Consider the full portfolio context when advising on each activity`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatBatchTeachingPrompt(
  input: ActivityWorkshopSessionInput,
  portfolioAnalysis: PortfolioAnalysis
): string {
  // Create a comprehensive analysis summary for each activity
  const activitySummaries = Object.entries(portfolioAnalysis.activities)
    .map(([id, analysis]) => {
      const activity = input.activities.find(a => a.id === id);
      return `
### ${activity?.title || id} (${id}):
- Description: "${activity?.description}"
- Role: ${activity?.role || 'Not specified'}
- Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence} confidence)
- Recognition: ${analysis.recognition.level}
- Leadership: ${analysis.leadership.type} (${analysis.leadership.leadershipQuality})
- Impact Score: ${analysis.impact.impactScore}/100
- Red Flags: ${analysis.redFlags.length > 0 ? analysis.redFlags.map(f => f.flag).join(', ') : 'None'}
- Green Flags: ${analysis.greenFlags.length > 0 ? analysis.greenFlags.map(f => f.flag).join(', ') : 'None'}
- Description Quality: ${analysis.descriptionQuality.overallScore}/100
  - Issues: ${analysis.descriptionQuality.issues.join('; ') || 'None'}
- Narrative Potential: ${analysis.narrativePotential.storytellingValue}
`;
    }).join('\n');

  // Portfolio-level summary
  const portfolioSummary = `
## Portfolio-Level Analysis:
- Tier Distribution: T1: ${portfolioAnalysis.tierDistribution.tier1}, T2: ${portfolioAnalysis.tierDistribution.tier2}, T3: ${portfolioAnalysis.tierDistribution.tier3}, T4: ${portfolioAnalysis.tierDistribution.tier4}
- Portfolio Tier: ${portfolioAnalysis.tierDistribution.portfolioTier}
- Has Spike: ${portfolioAnalysis.spikeAnalysis.hasSpike} (${portfolioAnalysis.spikeAnalysis.spikeStrength})
- Spike Activities: ${portfolioAnalysis.spikeAnalysis.spikeActivities.join(', ') || 'None identified'}
- Coherence: ${portfolioAnalysis.coherenceAnalysis.score}/100 (${portfolioAnalysis.coherenceAnalysis.assessment})
- Primary Theme: ${portfolioAnalysis.coherenceAnalysis.primaryTheme}
- Competitive Strength: ${portfolioAnalysis.competitiveAssessment.overallStrength}
- Gaps: ${portfolioAnalysis.gapsIdentified.map(g => g.gap).join(', ') || 'None critical'}
- Common App Order Recommendation: ${portfolioAnalysis.commonAppReadiness.orderingRecommendation.join(', ')}

## Activity Details:
${activitySummaries}
`;

  return BATCH_TEACHING_PROMPT
    .replace('{{intendedMajor}}', input.studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', input.studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{gradeLevel}}', String(input.studentContext?.gradeLevel || 'Not specified'))
    .replace('{{portfolioAnalysisJson}}', portfolioSummary);
}


function createCitedText(text: string, citations: ReturnType<typeof activityCitationService.getCitationsForTier> = []): CitedText {
  return activityCitationService.attachCitations(text, citations);
}

// ============================================================================
// BATCH ACTIVITY TEACHING SERVICE CLASS
// ============================================================================

interface BatchTeachingResponse {
  activityTeachings: Record<string, {
    tierExplanation: {
      assignedTier: number;
      explanation: string;
      benchmarksUsed: { tier: number; benchmark: string; source: string; studentMeets: boolean; gap?: string }[];
      whatMakesThisTier: string;
      whatWouldChangeIt: string;
    };
    strengthTeaching: { strength: string; whyItMatters: string; howToLeverage: string; inApplications: string }[];
    improvementTeaching: { issue: string; whyItMatters: string; howToFix: string; exampleBefore: string; exampleAfter: string; priority: string }[];
    upgradePathway?: {
      currentTier: number;
      targetTier: number;
      feasibility: string;
      timeRequired: string;
      steps: { step: number; action: string; rationale: string; milestone: string; timeframe: string; resources?: string[] }[];
      successIndicators: string[];
      risks: string[];
    };
    descriptionOptimization: {
      originalDescription: string;
      optimizedDescription: string;
      characterCount: number;
      changesExplained: { change: string; reason: string }[];
      alternativeVersions?: string[];
    };
    narrativeGuidance: {
      howToTalkAboutThis: string;
      uniqueAngle: string;
      connectionToStory: string;
      interviewTips: string[];
      essayPotential?: { viable: boolean; angle: string; cautionAreas: string[] };
    };
  }>;
  portfolioTeaching: {
    narrativeTeaching: {
      twoSentencePitch: string;
      extendedPitch: string;
      archetype: string;
      archetypeExplanation: string;
      howToPresent: string;
      narrativeStrengths: string[];
      narrativeWeaknesses: string[];
    };
    spikeTeaching: {
      currentState: string;
      whatMakesASpike: string;
      studentSpikeAssessment: string;
      developmentStrategy?: {
        strategy: string;
        focusActivities: string[];
        deprioritizeActivities: string[];
        newOpportunities: string[];
        timeline: string;
        rationale: string;
      };
    };
    coherenceTeaching: {
      currentCoherence: string;
      whatMakesCoherence: string;
      connectingActivities: { activity1: string; activity2: string; howToConnect: string }[];
      addressingDisconnects: { activityId: string; issue: string; solutions: string[]; recommendation: string }[];
      strengtheningStrategies: string[];
    };
    commonAppStrategy: {
      recommendedOrder: string[];
      orderRationale: string;
      whatToHighlight: { activityId: string; why: string; how: string }[];
      whatToMinimize: { activityId: string; why: string; alternativeApproach: string }[];
      overallPositioning: string;
      characterCountStrategy: string;
    };
    gapFillingGuidance: {
      gap: string;
      severity: string;
      solutions: { solution: string; feasibility: string; timeRequired: string; impact: string }[];
      recommendedApproach: string;
    }[];
    strategicRecommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
      activitiesToStop: { activityId: string; reason: string; alternative?: string }[];
      activitiesToDeepen: { activityId: string; howToDeepen: string; expectedOutcome: string }[];
      newActivitiesToConsider: { suggestion: string; rationale: string; fitWithProfile: string; feasibility: string }[];
    };
    schoolSpecificGuidance?: { school: string; fitScore: number; strengths: string[]; concerns: string[]; positioningTips: string[] }[];
  };
}

export class BatchActivityTeachingService implements IActivityTeachingService {
  private _anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - client created on first use
  }

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = getAnthropicClient();
    }
    return this._anthropic;
  }

  /**
   * Teach a single activity (extracts from batch for consistency)
   */
  async teachActivity(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis,
    portfolioAnalysis: PortfolioAnalysis,
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): Promise<ActivityTeaching> {
    // For single activity, create minimal input and run batch
    const input: ActivityWorkshopSessionInput = {
      activities: [activity],
      studentContext,
    };
    const minimalPortfolioAnalysis: PortfolioAnalysis = {
      ...portfolioAnalysis,
      activities: { [activity.id]: analysis },
    };
    const result = await this.teachPortfolio(input, minimalPortfolioAnalysis);
    return result.activities[activity.id];
  }

  /**
   * Teach complete portfolio using batch processing
   *
   * This is the main entry point - teaches ALL activities in ONE API call
   */
  async teachPortfolio(
    input: ActivityWorkshopSessionInput,
    portfolioAnalysis: PortfolioAnalysis
  ): Promise<PortfolioTeaching> {
    console.log(`[BatchActivityTeaching] Starting batch teaching for ${input.activities.length} activities`);
    const startTime = Date.now();

    const prompt = formatBatchTeachingPrompt(input, portfolioAnalysis);

    try {
      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_BATCH_TEACHING,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<BatchTeachingResponse>(responseText, 'BatchActivityTeaching');

      if (!parsed) {
        console.error('[BatchActivityTeaching] Failed to parse response, using fallback');
        return this.createFallbackPortfolioTeaching(input, portfolioAnalysis);
      }

      console.log(`[BatchActivityTeaching] Batch teaching complete in ${Date.now() - startTime}ms`);

      // Transform parsed response to PortfolioTeaching format
      return this.transformBatchResponse(input, portfolioAnalysis, parsed);
    } catch (error) {
      console.error('[BatchActivityTeaching] Error in batch teaching:', error);
      return this.createFallbackPortfolioTeaching(input, portfolioAnalysis);
    }
  }

  /**
   * Transform batch response to PortfolioTeaching format with citations
   */
  private transformBatchResponse(
    input: ActivityWorkshopSessionInput,
    portfolioAnalysis: PortfolioAnalysis,
    parsed: BatchTeachingResponse
  ): PortfolioTeaching {
    // Transform activity teachings
    const activityTeachings: Record<string, ActivityTeaching> = {};

    for (const activity of input.activities) {
      const teachingData = parsed.activityTeachings[activity.id];
      const analysis = portfolioAnalysis.activities[activity.id];

      if (teachingData && analysis) {
        // Get citations for this activity
        const tierCitations = activityCitationService.getCitationsForTier(activity, teachingData.tierExplanation.assignedTier as ActivityTier);
        const upgradeCitations = teachingData.upgradePathway
          ? activityCitationService.getCitationsForUpgrade(activity, analysis.classification.tier, teachingData.upgradePathway.targetTier as ActivityTier)
          : [];

        activityTeachings[activity.id] = {
          activityId: activity.id,
          tierExplanation: {
            assignedTier: teachingData.tierExplanation.assignedTier as ActivityTier,
            explanation: createCitedText(teachingData.tierExplanation.explanation, tierCitations),
            benchmarksUsed: teachingData.tierExplanation.benchmarksUsed.map(b => ({
              tier: b.tier as ActivityTier,
              benchmark: b.benchmark,
              source: b.source,
              studentMeets: b.studentMeets,
              gap: b.gap,
            })),
            whatMakesThisTier: createCitedText(teachingData.tierExplanation.whatMakesThisTier, tierCitations),
            whatWouldChangeIt: createCitedText(teachingData.tierExplanation.whatWouldChangeIt, upgradeCitations),
          },
          strengthTeaching: teachingData.strengthTeaching.map(s => {
            const greenCitations = activityCitationService.getCitationsForGreenFlag(s.strength, activity);
            return {
              strength: s.strength,
              whyItMatters: createCitedText(s.whyItMatters, greenCitations),
              howToLeverage: s.howToLeverage,
              inApplications: s.inApplications,
            };
          }),
          improvementTeaching: teachingData.improvementTeaching.map(i => {
            const redCitations = activityCitationService.getCitationsForRedFlag(i.issue, activity);
            return {
              issue: i.issue,
              whyItMatters: createCitedText(i.whyItMatters, redCitations),
              howToFix: i.howToFix,
              exampleBefore: i.exampleBefore,
              exampleAfter: i.exampleAfter,
              priority: i.priority as 'high' | 'medium' | 'low',
            };
          }),
          upgradePathway: teachingData.upgradePathway ? {
            currentTier: teachingData.upgradePathway.currentTier as ActivityTier,
            targetTier: teachingData.upgradePathway.targetTier as ActivityTier,
            feasibility: teachingData.upgradePathway.feasibility as 'high' | 'medium' | 'low',
            timeRequired: teachingData.upgradePathway.timeRequired,
            steps: teachingData.upgradePathway.steps.map(s => ({
              step: s.step,
              action: s.action,
              rationale: createCitedText(s.rationale, upgradeCitations),
              milestone: s.milestone,
              timeframe: s.timeframe,
              resources: s.resources,
            })),
            successIndicators: teachingData.upgradePathway.successIndicators,
            risks: teachingData.upgradePathway.risks,
          } : undefined,
          descriptionOptimization: {
            originalDescription: activity.description,
            optimizedDescription: teachingData.descriptionOptimization.optimizedDescription,
            characterCount: teachingData.descriptionOptimization.optimizedDescription.length,
            changesExplained: teachingData.descriptionOptimization.changesExplained,
            alternativeVersions: teachingData.descriptionOptimization.alternativeVersions,
          },
          narrativeGuidance: {
            howToTalkAboutThis: createCitedText(teachingData.narrativeGuidance.howToTalkAboutThis, []),
            uniqueAngle: teachingData.narrativeGuidance.uniqueAngle,
            connectionToStory: teachingData.narrativeGuidance.connectionToStory,
            interviewTips: teachingData.narrativeGuidance.interviewTips,
            essayPotential: teachingData.narrativeGuidance.essayPotential,
          },
        };
      } else {
        // Fallback for missing activity teaching
        activityTeachings[activity.id] = this.createFallbackActivityTeaching(activity, analysis);
      }
    }

    // Get portfolio-level citations
    const spikeCitations = portfolioAnalysis.spikeAnalysis.spikeType
      ? activityCitationService.getCitationsForSpike(
          portfolioAnalysis.spikeAnalysis.spikeType,
          portfolioAnalysis.spikeAnalysis.spikeStrength
        )
      : [];
    const coherenceCitations = activityCitationService.getCitationsForCoherence(
      portfolioAnalysis.coherenceAnalysis.score,
      portfolioAnalysis.coherenceAnalysis.assessment
    );

    const pt = parsed.portfolioTeaching;

    return {
      activities: activityTeachings,
      narrativeTeaching: {
        twoSentencePitch: pt.narrativeTeaching.twoSentencePitch,
        extendedPitch: pt.narrativeTeaching.extendedPitch,
        archetype: pt.narrativeTeaching.archetype as SpikeType | 'well_rounded' | 'emerging',
        archetypeExplanation: createCitedText(pt.narrativeTeaching.archetypeExplanation, spikeCitations),
        howToPresent: createCitedText(pt.narrativeTeaching.howToPresent, []),
        narrativeStrengths: pt.narrativeTeaching.narrativeStrengths,
        narrativeWeaknesses: pt.narrativeTeaching.narrativeWeaknesses,
      },
      spikeTeaching: {
        currentState: createCitedText(pt.spikeTeaching.currentState, spikeCitations),
        whatMakesASpike: createCitedText(pt.spikeTeaching.whatMakesASpike, spikeCitations),
        studentSpikeAssessment: createCitedText(pt.spikeTeaching.studentSpikeAssessment, spikeCitations),
        developmentStrategy: pt.spikeTeaching.developmentStrategy ? {
          strategy: pt.spikeTeaching.developmentStrategy.strategy,
          focusActivities: pt.spikeTeaching.developmentStrategy.focusActivities,
          deprioritizeActivities: pt.spikeTeaching.developmentStrategy.deprioritizeActivities,
          newOpportunities: pt.spikeTeaching.developmentStrategy.newOpportunities,
          timeline: pt.spikeTeaching.developmentStrategy.timeline,
          rationale: createCitedText(pt.spikeTeaching.developmentStrategy.rationale, spikeCitations),
        } : undefined,
      },
      coherenceTeaching: {
        currentCoherence: createCitedText(pt.coherenceTeaching.currentCoherence, coherenceCitations),
        whatMakesCoherence: createCitedText(pt.coherenceTeaching.whatMakesCoherence, coherenceCitations),
        connectingActivities: pt.coherenceTeaching.connectingActivities,
        addressingDisconnects: pt.coherenceTeaching.addressingDisconnects,
        strengtheningStrategies: pt.coherenceTeaching.strengtheningStrategies.map(s => createCitedText(s, coherenceCitations)),
      },
      commonAppStrategy: {
        recommendedOrder: pt.commonAppStrategy.recommendedOrder,
        orderRationale: createCitedText(pt.commonAppStrategy.orderRationale, []),
        whatToHighlight: pt.commonAppStrategy.whatToHighlight,
        whatToMinimize: pt.commonAppStrategy.whatToMinimize,
        overallPositioning: createCitedText(pt.commonAppStrategy.overallPositioning, []),
        characterCountStrategy: pt.commonAppStrategy.characterCountStrategy,
      },
      gapFillingGuidance: pt.gapFillingGuidance.map(g => ({
        gap: g.gap,
        severity: g.severity as 'critical' | 'significant' | 'minor',
        solutions: g.solutions.map(s => ({
          solution: s.solution,
          feasibility: s.feasibility as 'high' | 'medium' | 'low',
          timeRequired: s.timeRequired,
          impact: s.impact,
        })),
        recommendedApproach: createCitedText(g.recommendedApproach, []),
      })),
      strategicRecommendations: {
        immediate: pt.strategicRecommendations.immediate.map(r => createCitedText(r, [])),
        shortTerm: pt.strategicRecommendations.shortTerm.map(r => createCitedText(r, [])),
        longTerm: pt.strategicRecommendations.longTerm.map(r => createCitedText(r, [])),
        activitiesToStop: pt.strategicRecommendations.activitiesToStop,
        activitiesToDeepen: pt.strategicRecommendations.activitiesToDeepen,
        newActivitiesToConsider: pt.strategicRecommendations.newActivitiesToConsider.map(n => ({
          suggestion: n.suggestion,
          rationale: createCitedText(n.rationale, []),
          fitWithProfile: n.fitWithProfile,
          feasibility: n.feasibility as 'high' | 'medium' | 'low',
        })),
      },
      schoolSpecificGuidance: pt.schoolSpecificGuidance,
    };
  }

  /**
   * Create fallback teaching for single activity
   */
  private createFallbackActivityTeaching(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis
  ): ActivityTeaching {
    const tierCitations = activityCitationService.getCitationsForTier(activity, analysis.classification.tier);

    return {
      activityId: activity.id,
      tierExplanation: {
        assignedTier: analysis.classification.tier,
        explanation: createCitedText(
          `This activity is classified as Tier ${analysis.classification.tier}. ${analysis.classification.tierReasoning}`,
          tierCitations
        ),
        benchmarksUsed: [],
        whatMakesThisTier: createCitedText('Analysis based on Sara Harberson framework', tierCitations),
        whatWouldChangeIt: createCitedText('Seek external recognition and deepen impact', []),
      },
      strengthTeaching: analysis.greenFlags.map(f => ({
        strength: f.flag,
        whyItMatters: { text: f.admissionsValue, citations: [] },
        howToLeverage: 'Emphasize this in your application',
        inApplications: 'Include specific examples and metrics',
      })),
      improvementTeaching: analysis.redFlags.map(f => ({
        issue: f.flag,
        whyItMatters: { text: f.implication, citations: [] },
        howToFix: 'Address this concern before submitting',
        exampleBefore: 'Current presentation',
        exampleAfter: 'Improved presentation with specifics',
        priority: f.severity === 'critical' ? 'high' : f.severity === 'moderate' ? 'medium' : 'low',
      })),
      descriptionOptimization: {
        originalDescription: activity.description,
        optimizedDescription: activity.description.slice(0, 150),
        characterCount: Math.min(activity.description.length, 150),
        changesExplained: [],
        alternativeVersions: [],
      },
      narrativeGuidance: {
        howToTalkAboutThis: { text: 'Focus on specific impact and personal growth', citations: [] },
        uniqueAngle: 'Highlight what makes your experience unique',
        connectionToStory: 'Connect to your broader narrative',
        interviewTips: ['Be specific about your role', 'Quantify your impact', 'Show personal growth'],
      },
    };
  }

  /**
   * Create fallback portfolio teaching
   */
  private createFallbackPortfolioTeaching(
    input: ActivityWorkshopSessionInput,
    portfolioAnalysis: PortfolioAnalysis
  ): PortfolioTeaching {
    const activityTeachings: Record<string, ActivityTeaching> = {};

    for (const activity of input.activities) {
      const analysis = portfolioAnalysis.activities[activity.id];
      if (analysis) {
        activityTeachings[activity.id] = this.createFallbackActivityTeaching(activity, analysis);
      }
    }

    return {
      activities: activityTeachings,
      narrativeTeaching: {
        twoSentencePitch: `Student demonstrates ${portfolioAnalysis.spikeAnalysis.hasSpike ? 'focused excellence' : 'diverse interests'} across their activities.`,
        extendedPitch: portfolioAnalysis.coherenceAnalysis.narrativeThread || 'Unable to generate extended pitch',
        archetype: 'well_rounded',
        archetypeExplanation: { text: 'Profile shows balanced involvement', citations: [] },
        howToPresent: { text: 'Lead with your strongest activities', citations: [] },
        narrativeStrengths: portfolioAnalysis.competitiveAssessment.strengthAreas,
        narrativeWeaknesses: portfolioAnalysis.competitiveAssessment.weaknessAreas,
      },
      spikeTeaching: {
        currentState: { text: `Spike: ${portfolioAnalysis.spikeAnalysis.hasSpike ? 'Detected' : 'Not detected'}`, citations: [] },
        whatMakesASpike: { text: 'Deep concentration in one area with external validation', citations: [] },
        studentSpikeAssessment: { text: portfolioAnalysis.spikeAnalysis.spikeNarrative, citations: [] },
      },
      coherenceTeaching: {
        currentCoherence: { text: `Coherence: ${portfolioAnalysis.coherenceAnalysis.score}/100 (${portfolioAnalysis.coherenceAnalysis.assessment})`, citations: [] },
        whatMakesCoherence: { text: 'Activities that connect and reinforce each other tell a compelling story', citations: [] },
        connectingActivities: [],
        addressingDisconnects: [],
        strengtheningStrategies: [],
      },
      commonAppStrategy: {
        recommendedOrder: portfolioAnalysis.commonAppReadiness.orderingRecommendation,
        orderRationale: { text: 'Ordered by tier and impact', citations: [] },
        whatToHighlight: [],
        whatToMinimize: [],
        overallPositioning: { text: portfolioAnalysis.competitiveAssessment.competitiveEdge, citations: [] },
        characterCountStrategy: 'Use all 150 characters with action verbs and metrics',
      },
      gapFillingGuidance: portfolioAnalysis.gapsIdentified.map(g => ({
        gap: g.gap,
        severity: g.severity,
        solutions: [],
        recommendedApproach: { text: 'Address before application deadline', citations: [] },
      })),
      strategicRecommendations: {
        immediate: [{ text: 'Review and optimize activity descriptions', citations: [] }],
        shortTerm: [{ text: 'Deepen involvement in primary activities', citations: [] }],
        longTerm: [{ text: 'Continue building toward your spike', citations: [] }],
        activitiesToStop: [],
        activitiesToDeepen: [],
        newActivitiesToConsider: [],
      },
    };
  }
}

// Export singleton
export const batchActivityTeachingService = new BatchActivityTeachingService();
