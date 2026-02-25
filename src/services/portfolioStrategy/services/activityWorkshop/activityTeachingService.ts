// @ts-nocheck
/**
 * Activity Teaching Service (Stage 2)
 *
 * GUIDANCE POWERED BY ANALYSIS - Teaching that builds on comprehensive understanding.
 *
 * This service consumes the full analysis output to provide:
 * 1. Cited explanations for tier classifications
 * 2. Strength leverage strategies
 * 3. Improvement prescriptions with examples
 * 4. Upgrade pathways with milestones
 * 5. Description optimization
 * 6. Portfolio narrative and strategic guidance
 *
 * KEY PRINCIPLE: Teaching requires understanding. The analysis provides the
 * understanding; this service translates it into actionable guidance.
 *
 * MODEL: Sonnet for quality (teaching is user-facing)
 * COST: ~$0.08-0.12 per portfolio teaching
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

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_ACTIVITY_TEACHING = 4000;
const MAX_TOKENS_PORTFOLIO_TEACHING = 8000;

// ============================================================================
// ACTIVITY TEACHING PROMPT
// ============================================================================

const ACTIVITY_TEACHING_PROMPT = `You are an expert college admissions counselor providing TEACHING AND GUIDANCE based on a comprehensive analysis. Your role is to help the student understand and improve.

## Activity Information:
Title: {{title}}
Description: {{description}}
Role: {{role}}

## Analysis Results (from Stage 1):
{{analysisJson}}

## Student Context:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}

## Your Task:
Based on the analysis, provide EDUCATIONAL, ACTIONABLE guidance. Help the student understand:
1. WHY their specific activity is classified at this tier (cite evidence from THEIR description)
2. WHAT strengths to leverage
3. HOW to improve specific issues
4. WHAT an optimized description looks like
5. HOW to talk about this activity

IMPORTANT: The UI already shows generic tier definitions, percentiles, and framework descriptions in an interactive tooltip. Do NOT repeat generic tier characterizations (e.g., "Tier 2 activities are characterized by...") or percentile brackets (e.g., "top 5-10%"). Focus entirely on what's SPECIFIC to this student's activity.

Be specific, cite benchmarks, give concrete examples.

## Respond in this exact JSON format:
{
  "tierExplanation": {
    "assignedTier": 1|2|3|4,
    "explanation": "Why THIS activity earns this tier — cite specific evidence from the student's description. Include the key factors (e.g., 'Three factors place this at Tier 2: (1) original methodology, (2) real dataset, (3) paper submission'). Skip generic tier definitions.",
    "benchmarksUsed": [
      {
        "tier": 1|2|3|4,
        "benchmark": "specific benchmark this student meets or misses",
        "source": "Sara Harberson Framework / Competition Database / etc.",
        "studentMeets": true|false,
        "gap": "what would be needed if not meeting"
      }
    ],
  },

  "strengthTeaching": [
    {
      "strength": "name of strength",
      "whyItMatters": "educational explanation of why admissions values this",
      "howToLeverage": "specific advice on maximizing this strength",
      "inApplications": "how to present this in applications"
    }
  ],

  "improvementTeaching": [
    {
      "issue": "specific issue identified",
      "whyItMatters": "why this is a problem for admissions",
      "howToFix": "specific actionable steps",
      "exampleBefore": "current problematic phrasing",
      "exampleAfter": "improved version",
      "priority": "high|medium|low"
    }
  ],

  "upgradePathway": {
    "currentTier": 1|2|3|4,
    "targetTier": 1|2|3,
    "feasibility": "high|medium|low — honest assessment given student's constraints and remaining time",
    "timeRequired": "realistic estimate (e.g., '2-4 months' not vague)",
    "steps": [
      {
        "step": 1,
        "action": "Most impactful action specific to THIS activity — not generic advice. Reference what they've already built.",
        "rationale": "What specific admissions evidence this creates (e.g., 'Published paper transforms this from claimed research to externally validated contribution')",
        "milestone": "Concrete proof of completion an AO would see on the application",
        "timeframe": "Realistic given their constraints",
        "resources": ["Specific resources — name actual programs, competitions, organizations, not generic 'look for opportunities'"]
      }
    ],
    "successIndicators": ["Observable proof on their application that this upgrade happened — what would the AO read differently?"],
    "risks": ["Honest obstacles — time constraints, competition difficulty, seasonal deadlines, etc."]
  },

  "descriptionOptimization": {
    "originalDescription": "current description",
    "optimizedDescription": "150-char optimized version for Common App",
    "characterCount": number,
    "changesExplained": [
      {"change": "what changed", "reason": "why it's better"}
    ],
    "alternativeVersions": ["optional alternative phrasings"]
  },

  "narrativeGuidance": {
    "howToTalkAboutThis": "guidance on presenting this activity",
    "uniqueAngle": "what makes this distinctive",
    "connectionToStory": "how it connects to broader narrative",
    "interviewTips": ["tips for discussing in interviews"],
    "essayPotential": {
      "viable": true|false,
      "angle": "potential essay approach",
      "cautionAreas": ["what to avoid"]
    }
  }
}

Be helpful and educational. The goal is for the student to learn, not just receive a score.`;

// ============================================================================
// PORTFOLIO TEACHING PROMPT
// ============================================================================

const PORTFOLIO_TEACHING_PROMPT = `You are an expert college admissions counselor providing STRATEGIC PORTFOLIO GUIDANCE based on comprehensive analysis. Help the student understand their overall positioning and how to improve.

## Student Context:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}
Grade Level: {{gradeLevel}}

## Portfolio Analysis Summary:
{{portfolioAnalysisJson}}

## Individual Activity Teachings:
{{activityTeachingsSummary}}

## Your Task:
Provide STRATEGIC, EDUCATIONAL guidance on the complete portfolio. Focus on:
1. The portfolio narrative (two-sentence pitch)
2. Spike development or cultivation
3. Coherence improvement
4. Common App optimization
5. Gap filling strategies
6. Time-sensitive recommendations

## Respond in this exact JSON format:
{
  "narrativeTeaching": {
    "twoSentencePitch": "compelling two-sentence summary",
    "extendedPitch": "3-4 sentence version for essays",
    "archetype": "research_scientist|tech_builder|entrepreneur|etc.|well_rounded|emerging",
    "archetypeExplanation": "why this archetype fits",
    "howToPresent": "guidance on presenting this narrative",
    "narrativeStrengths": ["what's working"],
    "narrativeWeaknesses": ["what needs work"]
  },

  "spikeTeaching": {
    "currentState": "assessment of current spike",
    "whatMakesASpike": "educational explanation of spike concept",
    "studentSpikeAssessment": "honest assessment of student's spike",
    "developmentStrategy": {
      "strategy": "recommended approach",
      "focusActivities": ["activity_ids to double down on"],
      "deprioritizeActivities": ["activity_ids to reduce"],
      "newOpportunities": ["things to consider starting"],
      "timeline": "when to accomplish what",
      "rationale": "why this strategy"
    }
  },

  "coherenceTeaching": {
    "currentCoherence": "assessment of how well activities connect",
    "whatMakesCoherence": "educational explanation",
    "connectingActivities": [
      {
        "activity1": "id",
        "activity2": "id",
        "howToConnect": "how to draw the connection"
      }
    ],
    "addressingDisconnects": [
      {
        "activityId": "id",
        "issue": "why it feels disconnected",
        "solutions": ["options for addressing"],
        "recommendation": "best approach"
      }
    ],
    "strengtheningStrategies": ["ways to improve coherence"]
  },

  "commonAppStrategy": {
    "recommendedOrder": ["activity_ids in optimal order"],
    "orderRationale": "why this order creates best impression",
    "whatToHighlight": [
      {"activityId": "id", "why": "reason", "how": "technique"}
    ],
    "whatToMinimize": [
      {"activityId": "id", "why": "reason", "alternativeApproach": "how to handle"}
    ],
    "overallPositioning": "strategic positioning advice",
    "characterCountStrategy": "how to use 150 chars effectively"
  },

  "gapFillingGuidance": [
    {
      "gap": "what's missing",
      "severity": "critical|significant|minor",
      "solutions": [
        {
          "solution": "option",
          "feasibility": "high|medium|low",
          "timeRequired": "estimate",
          "impact": "expected benefit"
        }
      ],
      "recommendedApproach": "best solution for this student"
    }
  ],

  "strategicRecommendations": {
    "immediate": ["do in next 2 weeks"],
    "shortTerm": ["do in next 3-6 months"],
    "longTerm": ["do in next 1-2 years"],
    "activitiesToStop": [
      {"activityId": "id", "reason": "why", "alternative": "what instead"}
    ],
    "activitiesToDeepen": [
      {"activityId": "id", "howToDeepen": "specific actions", "expectedOutcome": "what you'll achieve"}
    ],
    "newActivitiesToConsider": [
      {"suggestion": "activity", "rationale": "why it fits", "fitWithProfile": "how it connects", "feasibility": "high|medium|low"}
    ]
  },

  "schoolSpecificGuidance": [
    {
      "school": "school name",
      "fitScore": 0-100,
      "strengths": ["what this profile has for this school"],
      "concerns": ["what might worry this school"],
      "positioningTips": ["how to present for this school"]
    }
  ]
}

Be strategic and helpful. The goal is empowering the student to present their best self.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatActivityTeachingPrompt(
  activity: ActivityWorkshopInput,
  analysis: ActivityAnalysis,
  studentContext?: ActivityWorkshopSessionInput['studentContext']
): string {
  return ACTIVITY_TEACHING_PROMPT
    .replace('{{title}}', activity.title)
    .replace('{{description}}', activity.description)
    .replace('{{role}}', activity.role || 'Not specified')
    .replace('{{analysisJson}}', JSON.stringify(analysis, null, 2))
    .replace('{{intendedMajor}}', studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', studentContext?.targetSchools?.join(', ') || 'Not specified');
}

function formatPortfolioTeachingPrompt(
  input: ActivityWorkshopSessionInput,
  portfolioAnalysis: PortfolioAnalysis,
  activityTeachings: Record<string, ActivityTeaching>
): string {
  const teachingsSummary = Object.entries(activityTeachings)
    .map(([id, teaching]) => `
Activity ${id}:
- Tier: ${teaching.tierExplanation.assignedTier}
- Key Strengths: ${teaching.strengthTeaching.map((s) => s.strength).join(', ')}
- Priority Issues: ${teaching.improvementTeaching.filter((i) => i.priority === 'high').map((i) => i.issue).join(', ') || 'None'}
- Upgrade Feasibility: ${teaching.upgradePathway?.feasibility || 'N/A'}
---`).join('\n');

  return PORTFOLIO_TEACHING_PROMPT
    .replace('{{intendedMajor}}', input.studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', input.studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{gradeLevel}}', String(input.studentContext?.gradeLevel || 'Not specified'))
    .replace('{{portfolioAnalysisJson}}', JSON.stringify({
      tierDistribution: portfolioAnalysis.tierDistribution,
      spikeAnalysis: portfolioAnalysis.spikeAnalysis,
      coherenceAnalysis: portfolioAnalysis.coherenceAnalysis,
      competitiveAssessment: portfolioAnalysis.competitiveAssessment,
      gapsIdentified: portfolioAnalysis.gapsIdentified,
      hiddenGems: portfolioAnalysis.hiddenGems,
    }, null, 2))
    .replace('{{activityTeachingsSummary}}', teachingsSummary);
}

function parseJSONResponse<T>(response: string): T | null {
  try {
    // Remove markdown code fences if present
    let cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    let jsonStr = jsonMatch[0];

    // Fix common LLM JSON issues:
    // 1. Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    // 2. Fix unquoted keys (rare but happens)
    jsonStr = jsonStr.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    // 3. Replace unescaped newlines inside strings with escaped version
    jsonStr = jsonStr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });

    return JSON.parse(jsonStr) as T;
  } catch (error: any) {
    console.error('[ActivityTeaching] Failed to parse JSON:', error.message);
    return null;
  }
}

function createCitedText(text: string, citations: ReturnType<typeof activityCitationService.getCitationsForTier>): CitedText {
  return activityCitationService.attachCitations(text, citations);
}

// ============================================================================
// ACTIVITY TEACHING SERVICE CLASS
// ============================================================================

export class ActivityTeachingService implements IActivityTeachingService {
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
   * Provide teaching for a single activity based on its analysis
   */
  async teachActivity(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis,
    portfolioAnalysis: PortfolioAnalysis,
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): Promise<ActivityTeaching> {
    const prompt = formatActivityTeachingPrompt(activity, analysis, studentContext);

    try {
      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_ACTIVITY_TEACHING,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = parseJSONResponse<{
        tierExplanation: {
          assignedTier: number;
          explanation: string;
          benchmarksUsed: { tier: number; benchmark: string; source: string; studentMeets: boolean; gap?: string }[];
          whatMakesThisTier?: string;
          whatWouldChangeIt?: string;
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
      }>(responseText);

      if (!parsed) {
        return this.createFallbackActivityTeaching(activity, analysis);
      }

      // Get citations for enrichment
      const tierCitations = activityCitationService.getCitationsForTier(activity, parsed.tierExplanation.assignedTier as ActivityTier);
      const upgradeCitations = parsed.upgradePathway
        ? activityCitationService.getCitationsForUpgrade(activity, analysis.classification.tier, parsed.upgradePathway.targetTier as ActivityTier)
        : [];

      return {
        activityId: activity.id,
        tierExplanation: {
          assignedTier: parsed.tierExplanation.assignedTier as ActivityTier,
          explanation: createCitedText(parsed.tierExplanation.explanation, tierCitations),
          benchmarksUsed: parsed.tierExplanation.benchmarksUsed.map((b) => ({
            tier: b.tier as ActivityTier,
            benchmark: b.benchmark,
            source: b.source,
            studentMeets: b.studentMeets,
            gap: b.gap,
          })),
          whatMakesThisTier: createCitedText(parsed.tierExplanation.whatMakesThisTier || '', tierCitations),
          whatWouldChangeIt: createCitedText(parsed.tierExplanation.whatWouldChangeIt || '', upgradeCitations),
        },
        strengthTeaching: parsed.strengthTeaching.map((s) => {
          const greenCitations = activityCitationService.getCitationsForGreenFlag(s.strength, activity);
          return {
            strength: s.strength,
            whyItMatters: createCitedText(s.whyItMatters, greenCitations),
            howToLeverage: s.howToLeverage,
            inApplications: s.inApplications,
          };
        }),
        improvementTeaching: parsed.improvementTeaching.map((i) => {
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
        upgradePathway: parsed.upgradePathway
          ? {
              currentTier: parsed.upgradePathway.currentTier as ActivityTier,
              targetTier: parsed.upgradePathway.targetTier as ActivityTier,
              feasibility: parsed.upgradePathway.feasibility as 'high' | 'medium' | 'low',
              timeRequired: parsed.upgradePathway.timeRequired,
              steps: parsed.upgradePathway.steps.map((s) => ({
                step: s.step,
                action: s.action,
                rationale: createCitedText(s.rationale, upgradeCitations),
                milestone: s.milestone,
                timeframe: s.timeframe,
                resources: s.resources,
              })),
              successIndicators: parsed.upgradePathway.successIndicators,
              risks: parsed.upgradePathway.risks,
            }
          : undefined,
        descriptionOptimization: {
          originalDescription: activity.description,
          optimizedDescription: parsed.descriptionOptimization.optimizedDescription,
          characterCount: parsed.descriptionOptimization.optimizedDescription.length,
          changesExplained: parsed.descriptionOptimization.changesExplained,
          alternativeVersions: parsed.descriptionOptimization.alternativeVersions,
        },
        narrativeGuidance: {
          howToTalkAboutThis: createCitedText(parsed.narrativeGuidance.howToTalkAboutThis, []),
          uniqueAngle: parsed.narrativeGuidance.uniqueAngle,
          connectionToStory: parsed.narrativeGuidance.connectionToStory,
          interviewTips: parsed.narrativeGuidance.interviewTips,
          essayPotential: parsed.narrativeGuidance.essayPotential,
        },
      };
    } catch (error) {
      console.error('[ActivityTeaching] Error teaching activity:', error);
      return this.createFallbackActivityTeaching(activity, analysis);
    }
  }

  /**
   * Provide teaching for complete portfolio based on analysis
   */
  async teachPortfolio(
    input: ActivityWorkshopSessionInput,
    portfolioAnalysis: PortfolioAnalysis
  ): Promise<PortfolioTeaching> {
    console.log(`[ActivityTeaching] Starting portfolio teaching for ${input.activities.length} activities`);

    // Step 1: Teach each activity individually
    const activityTeachings: Record<string, ActivityTeaching> = {};

    for (const activity of input.activities) {
      const analysis = portfolioAnalysis.activities[activity.id];
      if (analysis) {
        console.log(`[ActivityTeaching] Teaching: ${activity.title}`);
        activityTeachings[activity.id] = await this.teachActivity(
          activity,
          analysis,
          portfolioAnalysis,
          input.studentContext
        );
      }
    }

    console.log(`[ActivityTeaching] Individual teachings complete, generating portfolio guidance...`);

    // Step 2: Portfolio-level teaching
    const prompt = formatPortfolioTeachingPrompt(input, portfolioAnalysis, activityTeachings);

    try {
      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_PORTFOLIO_TEACHING,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = parseJSONResponse<Omit<PortfolioTeaching, 'activities'>>(responseText);

      if (!parsed) {
        return this.createFallbackPortfolioTeaching(input, portfolioAnalysis, activityTeachings);
      }

      // Get citations for portfolio-level content
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

      // Transform parsed response with citations
      return {
        activities: activityTeachings,
        narrativeTeaching: {
          twoSentencePitch: parsed.narrativeTeaching.twoSentencePitch,
          extendedPitch: parsed.narrativeTeaching.extendedPitch,
          archetype: parsed.narrativeTeaching.archetype as SpikeType | 'well_rounded' | 'emerging',
          archetypeExplanation: createCitedText(parsed.narrativeTeaching.archetypeExplanation, spikeCitations),
          howToPresent: createCitedText(parsed.narrativeTeaching.howToPresent, []),
          narrativeStrengths: parsed.narrativeTeaching.narrativeStrengths,
          narrativeWeaknesses: parsed.narrativeTeaching.narrativeWeaknesses,
        },
        spikeTeaching: {
          currentState: createCitedText(parsed.spikeTeaching.currentState, spikeCitations),
          whatMakesASpike: createCitedText(parsed.spikeTeaching.whatMakesASpike, spikeCitations),
          studentSpikeAssessment: createCitedText(parsed.spikeTeaching.studentSpikeAssessment, spikeCitations),
          developmentStrategy: parsed.spikeTeaching.developmentStrategy
            ? {
                strategy: parsed.spikeTeaching.developmentStrategy.strategy,
                focusActivities: parsed.spikeTeaching.developmentStrategy.focusActivities,
                deprioritizeActivities: parsed.spikeTeaching.developmentStrategy.deprioritizeActivities,
                newOpportunities: parsed.spikeTeaching.developmentStrategy.newOpportunities,
                timeline: parsed.spikeTeaching.developmentStrategy.timeline,
                rationale: createCitedText(parsed.spikeTeaching.developmentStrategy.rationale, spikeCitations),
              }
            : undefined,
        },
        coherenceTeaching: {
          currentCoherence: createCitedText(parsed.coherenceTeaching.currentCoherence, coherenceCitations),
          whatMakesCoherence: createCitedText(parsed.coherenceTeaching.whatMakesCoherence, coherenceCitations),
          connectingActivities: parsed.coherenceTeaching.connectingActivities,
          addressingDisconnects: parsed.coherenceTeaching.addressingDisconnects,
          strengtheningStrategies: parsed.coherenceTeaching.strengtheningStrategies.map((s) =>
            createCitedText(s, coherenceCitations)
          ),
        },
        commonAppStrategy: {
          recommendedOrder: parsed.commonAppStrategy.recommendedOrder,
          orderRationale: createCitedText(parsed.commonAppStrategy.orderRationale, []),
          whatToHighlight: parsed.commonAppStrategy.whatToHighlight,
          whatToMinimize: parsed.commonAppStrategy.whatToMinimize,
          overallPositioning: createCitedText(parsed.commonAppStrategy.overallPositioning, []),
          characterCountStrategy: parsed.commonAppStrategy.characterCountStrategy,
        },
        gapFillingGuidance: parsed.gapFillingGuidance.map((g) => ({
          gap: g.gap,
          severity: g.severity as 'critical' | 'significant' | 'minor',
          solutions: g.solutions.map((s) => ({
            solution: s.solution,
            feasibility: s.feasibility as 'high' | 'medium' | 'low',
            timeRequired: s.timeRequired,
            impact: s.impact,
          })),
          recommendedApproach: createCitedText(g.recommendedApproach, []),
        })),
        strategicRecommendations: {
          immediate: parsed.strategicRecommendations.immediate.map((r) => createCitedText(r, [])),
          shortTerm: parsed.strategicRecommendations.shortTerm.map((r) => createCitedText(r, [])),
          longTerm: parsed.strategicRecommendations.longTerm.map((r) => createCitedText(r, [])),
          activitiesToStop: parsed.strategicRecommendations.activitiesToStop,
          activitiesToDeepen: parsed.strategicRecommendations.activitiesToDeepen,
          newActivitiesToConsider: parsed.strategicRecommendations.newActivitiesToConsider.map((n) => ({
            suggestion: n.suggestion,
            rationale: createCitedText(n.rationale, []),
            fitWithProfile: n.fitWithProfile,
            feasibility: n.feasibility as 'high' | 'medium' | 'low',
          })),
        },
        schoolSpecificGuidance: parsed.schoolSpecificGuidance,
      };
    } catch (error) {
      console.error('[ActivityTeaching] Error in portfolio teaching:', error);
      return this.createFallbackPortfolioTeaching(input, portfolioAnalysis, activityTeachings);
    }
  }

  /**
   * Create fallback teaching for single activity
   */
  private createFallbackActivityTeaching(activity: ActivityWorkshopInput, analysis: ActivityAnalysis): ActivityTeaching {
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
        whatMakesThisTier: createCitedText('Unable to generate detailed explanation - using fallback', []),
        whatWouldChangeIt: createCitedText('Unable to generate upgrade guidance - using fallback', []),
      },
      strengthTeaching: analysis.greenFlags.map((f) => ({
        strength: f.flag,
        whyItMatters: { text: f.admissionsValue, citations: [] },
        howToLeverage: 'Emphasize this in your application',
        inApplications: 'Include specific examples and metrics',
      })),
      improvementTeaching: analysis.redFlags.map((f) => ({
        issue: f.flag,
        whyItMatters: { text: f.implication, citations: [] },
        howToFix: 'Address this concern before submitting',
        exampleBefore: 'Current presentation',
        exampleAfter: 'Improved presentation',
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
        howToTalkAboutThis: { text: 'Unable to generate guidance - using fallback', citations: [] },
        uniqueAngle: 'Highlight what makes your experience unique',
        connectionToStory: 'Connect to your broader narrative',
        interviewTips: ['Be specific', 'Show impact', 'Demonstrate growth'],
      },
    };
  }

  /**
   * Create fallback portfolio teaching
   */
  private createFallbackPortfolioTeaching(
    input: ActivityWorkshopSessionInput,
    portfolioAnalysis: PortfolioAnalysis,
    activityTeachings: Record<string, ActivityTeaching>
  ): PortfolioTeaching {
    return {
      activities: activityTeachings,
      narrativeTeaching: {
        twoSentencePitch: 'Unable to generate pitch - using fallback',
        extendedPitch: 'Unable to generate extended pitch - using fallback',
        archetype: 'well_rounded',
        archetypeExplanation: { text: 'Unable to determine archetype', citations: [] },
        howToPresent: { text: 'Focus on your authentic story', citations: [] },
        narrativeStrengths: portfolioAnalysis.competitiveAssessment.strengthAreas,
        narrativeWeaknesses: portfolioAnalysis.competitiveAssessment.weaknessAreas,
      },
      spikeTeaching: {
        currentState: { text: `Spike: ${portfolioAnalysis.spikeAnalysis.hasSpike ? 'Detected' : 'Not detected'}`, citations: [] },
        whatMakesASpike: { text: 'Deep concentration in one area with external validation', citations: [] },
        studentSpikeAssessment: { text: portfolioAnalysis.spikeAnalysis.spikeNarrative, citations: [] },
      },
      coherenceTeaching: {
        currentCoherence: { text: `Coherence: ${portfolioAnalysis.coherenceAnalysis.score}/100`, citations: [] },
        whatMakesCoherence: { text: 'Activities that connect and reinforce each other', citations: [] },
        connectingActivities: [],
        addressingDisconnects: [],
        strengtheningStrategies: [],
      },
      commonAppStrategy: {
        recommendedOrder: portfolioAnalysis.commonAppReadiness.orderingRecommendation,
        orderRationale: { text: 'Default ordering based on tier', citations: [] },
        whatToHighlight: [],
        whatToMinimize: [],
        overallPositioning: { text: 'Unable to generate positioning strategy', citations: [] },
        characterCountStrategy: 'Use all 150 characters with action verbs and metrics',
      },
      gapFillingGuidance: portfolioAnalysis.gapsIdentified.map((g) => ({
        gap: g.gap,
        severity: g.severity,
        solutions: [],
        recommendedApproach: { text: 'Address before application deadline', citations: [] },
      })),
      strategicRecommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        activitiesToStop: [],
        activitiesToDeepen: [],
        newActivitiesToConsider: [],
      },
    };
  }
}

// Export singleton
export const activityTeachingService = new ActivityTeachingService();
