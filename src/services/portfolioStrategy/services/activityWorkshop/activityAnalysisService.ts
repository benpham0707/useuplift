/**
 * Activity Analysis Service (Stage 1)
 *
 * COMPREHENSIVE ANALYSIS - The foundation for all teaching and guidance.
 *
 * This service provides deep, standalone analysis that:
 * 1. Classifies each activity with full reasoning
 * 2. Detects patterns (spike, coherence, depth/breadth)
 * 3. Identifies hidden gems and red flags
 * 4. Assesses competitive positioning
 * 5. Maps gaps and opportunities
 *
 * The analysis output is complete enough to:
 * - Stand alone as valuable insight
 * - Power the Teaching Service (Stage 2)
 * - Integrate with PASS pipeline stages
 *
 * MODEL: Sonnet for quality (analysis requires nuanced judgment)
 * COST: ~$0.08-0.12 per portfolio analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  ActivityAnalysis,
  PortfolioAnalysis,
  IActivityAnalysisService,
} from './types';

import { ActivityTier, ActivityCategory, LeadershipType, RecognitionLevel, ImpactType } from '../../types';
import { SpikeType, SpikeStrength, MajorCategory, ImpactTier } from '../../knowledge';
import { parseClaudeJSON } from '../../../commonAppWorkshop/utils/jsonParser';

// Import knowledge databases for context
import {
  ADMISSION_IMPACT_MULTIPLIERS,
  RED_FLAG_PATTERNS,
  SPIKE_DEFINITIONS,
  COHERENCE_SCORE_INTERPRETATION,
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  BENEFICIARY_METRICS,
} from '../../knowledge';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_SINGLE_ACTIVITY = 3000;
const MAX_TOKENS_PORTFOLIO = 8000;

// ============================================================================
// SINGLE ACTIVITY ANALYSIS PROMPT
// ============================================================================

const SINGLE_ACTIVITY_ANALYSIS_PROMPT = `You are a senior college admissions consultant with 20+ years of experience evaluating extracurricular activities at elite institutions. Your task is to provide a COMPREHENSIVE ANALYSIS of this single activity.

## Activity to Analyze:
Title: {{title}}
Organization: {{organization}}
Role: {{role}}
Category: {{category}}
Description: {{description}}
Hours/week: {{hoursPerWeek}}
Weeks/year: {{weeksPerYear}}
Years involved: {{yearsInvolved}}
Grade levels: {{gradeLevels}}
Is paid: {{isPaid}}
Achievements: {{achievements}}

## Student Context:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}
Grade Level: {{gradeLevel}}

## SARA HARBERSON 4-TIER FRAMEWORK:
- Tier 1: National/international recognition, < 1% achievement (USAMO, Intel finalist, D1 recruit)
- Tier 2: State/regional recognition with leadership impact (state champion, AIME, Eagle Scout)
- Tier 3: School/local recognition with commitment (varsity, club officer, consistent volunteer)
- Tier 4: Participation without distinction (club member, one-time events)

## Your Task:
Analyze this activity comprehensively. Be rigorous, evidence-based, and specific.

## Respond in this exact JSON format:
{
  "classification": {
    "tier": 1|2|3|4,
    "tierConfidence": "high"|"medium"|"low",
    "tierReasoning": "Detailed explanation citing specific evidence from description",
    "detectedCategory": "academic_competition|research|stem_project|arts_performance|arts_visual|arts_literary|athletics|community_service|leadership_governance|entrepreneurship|work_experience|family_responsibilities|cultural_heritage|religious_faith|special_interest|internship|summer_program|other",
    "categoryConfidence": 0-100
  },

  "recognition": {
    "level": "international|national|regional|state|district|school|local|none",
    "evidence": ["specific evidence from description"],
    "authenticityScore": 0-100,
    "authenticityFactors": ["what suggests this is/isn't authentic"]
  },

  "leadership": {
    "type": "founder|president_captain|executive_board|team_lead|mentor_teacher|committee_chair|elected_representative|appointed_leader|informal_leader|none",
    "evidence": ["specific evidence"],
    "impactScope": "individual|team|organization|community|regional|national",
    "leadershipQuality": "exceptional|strong|solid|developing|none"
  },

  "impact": {
    "type": "quantifiable|organizational|community|personal_growth|skill_development|creative_output|competitive_success|mentorship|unclear",
    "evidence": ["specific evidence"],
    "quantifiableMetrics": [
      {"metric": "name", "value": "X", "tier": "transformational|exceptional|strong|solid|moderate|minimal", "verified": true|false}
    ],
    "impactScore": 0-100,
    "impactNarrative": "Summary of the impact story"
  },

  "timeInvestment": {
    "totalHours": number,
    "hoursPerWeek": number,
    "weeksPerYear": number,
    "yearsInvolved": number,
    "commitmentLevel": "exceptional|significant|moderate|minimal",
    "progressionEvidence": ["evidence of growth/progression over time"]
  },

  "redFlags": [
    {
      "flag": "description",
      "severity": "critical|moderate|minor",
      "evidence": "what triggered this",
      "implication": "what this means for admissions"
    }
  ],

  "greenFlags": [
    {
      "flag": "description",
      "strength": "exceptional|strong|notable",
      "evidence": "what demonstrates this",
      "admissionsValue": "why this matters"
    }
  ],

  "descriptionQuality": {
    "specificity": 0-10,
    "impactClarity": 0-10,
    "uniqueness": 0-10,
    "actionVerbs": 0-10,
    "quantification": 0-10,
    "overallScore": 0-100,
    "issues": ["specific problems with description"],
    "strengths": ["what's working well"]
  },

  "databaseMatches": [
    {
      "database": "which knowledge database",
      "matchedEntry": "specific benchmark/achievement matched",
      "tier": 1-4,
      "relevance": 0-100,
      "insight": "what this match tells us"
    }
  ],

  "narrativePotential": {
    "storytellingValue": "high|medium|low",
    "uniqueAngles": ["potential story angles"],
    "emotionalResonance": "what emotional thread exists",
    "growthArc": "what growth story is possible",
    "essayWorthiness": "excellent|good|possible|unlikely"
  },

  "schoolFit": {
    "bestFitSchoolTypes": ["research universities", "LACs", "engineering schools", etc.],
    "alignedValues": ["what values this demonstrates"],
    "potentialConcerns": ["what schools might worry about"]
  }
}

Be rigorous. Don't inflate tiers. Cite specific evidence. Consider context.`;

// ============================================================================
// PORTFOLIO ANALYSIS PROMPT
// ============================================================================

const PORTFOLIO_ANALYSIS_PROMPT = `You are a senior college admissions consultant providing a COMPREHENSIVE PORTFOLIO ANALYSIS. You have already analyzed each activity individually. Now synthesize everything into a complete portfolio assessment.

## Student Context:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}
Grade Level: {{gradeLevel}}
First-gen: {{firstGen}}
Low-income: {{lowIncome}}

## Individual Activity Analyses:
{{activityAnalysesSummary}}

## Your Task:
Synthesize all individual analyses into a comprehensive portfolio assessment. Focus on patterns, coherence, competitive positioning, and strategic insights.

## SPIKE DETECTION CRITERIA:
- Strong: Multiple Tier 1-2 activities in same area, national recognition
- Moderate: Tier 2 activities with clear theme, state/regional recognition
- Weak: Tier 3 concentration, interest visible but not remarkable
- None: Scattered activities without thematic connection

## COHERENCE SCORING:
- 85-100 (Exceptional): Clear narrative thread, activities reinforce each other
- 70-84 (Strong): Visible theme with mostly aligned activities
- 50-69 (Moderate): Emerging focus but diluted
- 30-49 (Weak): No clear theme
- 0-29 (Scattered): Random activities, possible resume padding

## Respond in this exact JSON format:
{
  "tierDistribution": {
    "tier1": number,
    "tier2": number,
    "tier3": number,
    "tier4": number,
    "portfolioTier": 1|2|3|4,
    "tierRationale": "explanation of overall portfolio tier"
  },

  "spikeAnalysis": {
    "hasSpike": true|false,
    "spikeType": "research_scientist|tech_builder|entrepreneur|writer_intellectual|policy_advocate|performing_artist|visual_artist|athlete_leader|community_builder|healthcare_servant|environmental_champion|cultural_bridge|maker_inventor|educator_mentor|journalist_communicator"|null,
    "spikeStrength": "national|regional|local|emerging|none",
    "spikeActivities": ["activity_ids that form the spike"],
    "spikeEvidence": ["evidence of spike"],
    "spikeAuthenticity": 0-100,
    "spikeNarrative": "the story the spike tells",
    "spikeDevelopmentStage": "mature|developing|emerging|absent"
  },

  "coherenceAnalysis": {
    "score": 0-100,
    "assessment": "exceptional|strong|moderate|weak|scattered",
    "primaryTheme": "main thematic thread",
    "secondaryThemes": ["supporting themes"],
    "thematicConnections": [
      {
        "activity1": "id",
        "activity2": "id",
        "connection": "how they connect",
        "strength": "strong|moderate|weak"
      }
    ],
    "disconnectedActivities": [
      {"activityId": "id", "reason": "why disconnected"}
    ],
    "narrativeThread": "the overarching story these activities tell"
  },

  "majorAlignment": {
    "intendedMajor": "major name",
    "alignmentScore": 0-100,
    "stronglyAligned": ["activity_ids"],
    "moderatelyAligned": ["activity_ids"],
    "misaligned": ["activity_ids"],
    "gaps": ["what's missing for this major"],
    "competitiveBenchmark": "how this compares to competitive applicants for this major"
  },

  "depthBreadthProfile": {
    "profile": "deep_spike|focused|balanced|broad|scattered",
    "depthScore": 0-100,
    "breadthScore": 0-100,
    "optimalBalance": "assessment of whether this balance works"
  },

  "hiddenGems": {
    "undersoldActivities": [
      {
        "activityId": "id",
        "currentPresentation": "how it's presented",
        "trueValue": "what it's actually worth",
        "whyUndersold": "why student isn't getting credit"
      }
    ],
    "workFamilyContributions": {
      "present": true|false,
      "activities": ["ids"],
      "value": "what admissions value this has"
    },
    "constrainedExcellence": {
      "present": true|false,
      "context": "what constraints exist",
      "activities": ["ids showing maximization"]
    }
  },

  "competitiveAssessment": {
    "overallStrength": "exceptional|strong|competitive|developing|needs_work",
    "strengthAreas": ["areas where student excels"],
    "weaknessAreas": ["areas needing improvement"],
    "differentiators": ["what makes this profile unique"],
    "commonalities": ["what's typical/expected"],
    "competitiveEdge": "summary of competitive position"
  },

  "gapsIdentified": [
    {
      "gap": "what's missing",
      "severity": "critical|significant|minor",
      "impactOnApplication": "how this affects applications",
      "affectedSchools": ["schools that care about this"]
    }
  ],

  "commonAppReadiness": {
    "readyForSubmission": true|false,
    "activitiesCount": number,
    "topActivitiesIdentified": ["top 10 in order of impact"],
    "orderingRecommendation": ["recommended order"],
    "descriptionReadiness": [
      {"activityId": "id", "ready": true|false, "issues": ["specific issues"]}
    ]
  },

  "analysisConfidence": {
    "overallConfidence": 0-100,
    "dataQuality": 0-100,
    "classificationConfidence": 0-100,
    "spikeConfidence": 0-100,
    "factors": [
      {"factor": "what affects confidence", "impact": "positive|negative", "score": number}
    ]
  }
}

Be comprehensive. This analysis should provide complete insight into the student's extracurricular profile.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatSingleActivityPrompt(
  activity: ActivityWorkshopInput,
  studentContext?: ActivityWorkshopSessionInput['studentContext']
): string {
  return SINGLE_ACTIVITY_ANALYSIS_PROMPT
    .replace('{{title}}', activity.title)
    .replace('{{organization}}', activity.organization || 'Not specified')
    .replace('{{role}}', activity.role || 'Not specified')
    .replace('{{category}}', activity.category)
    .replace('{{description}}', activity.description)
    .replace('{{hoursPerWeek}}', String(activity.hoursPerWeek || 0))
    .replace('{{weeksPerYear}}', String(activity.weeksPerYear || 0))
    .replace('{{yearsInvolved}}', String(activity.yearsInvolved || 1))
    .replace('{{gradeLevels}}', (activity.gradeLevels || []).join(', ') || 'Not specified')
    .replace('{{isPaid}}', String(activity.isPaid || false))
    .replace(
      '{{achievements}}',
      activity.achievements?.map((a) => `${a.title} (${a.level || 'unspecified'})`).join(', ') || 'None listed'
    )
    .replace('{{intendedMajor}}', studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{gradeLevel}}', String(studentContext?.gradeLevel || 'Not specified'));
}

function formatPortfolioPrompt(
  input: ActivityWorkshopSessionInput,
  activityAnalyses: Record<string, ActivityAnalysis>
): string {
  const activitySummaries = Object.entries(activityAnalyses)
    .map(([id, analysis]) => {
      const activity = input.activities.find((a) => a.id === id);
      return `
ACTIVITY: ${activity?.title || id}
ID: ${id}
Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence} confidence)
Category: ${analysis.classification.detectedCategory}
Recognition: ${analysis.recognition.level}
Leadership: ${analysis.leadership.type} (${analysis.leadership.leadershipQuality})
Impact Score: ${analysis.impact.impactScore}/100
Commitment: ${analysis.timeInvestment.commitmentLevel}
Red Flags: ${analysis.redFlags.length} (${analysis.redFlags.map((f) => f.flag).join(', ') || 'none'})
Green Flags: ${analysis.greenFlags.length} (${analysis.greenFlags.map((f) => f.flag).join(', ') || 'none'})
Description Quality: ${analysis.descriptionQuality.overallScore}/100
Narrative Potential: ${analysis.narrativePotential.storytellingValue}
---`;
    })
    .join('\n');

  return PORTFOLIO_ANALYSIS_PROMPT
    .replace('{{intendedMajor}}', input.studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', input.studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{gradeLevel}}', String(input.studentContext?.gradeLevel || 'Not specified'))
    .replace('{{firstGen}}', String(input.studentContext?.firstGen || false))
    .replace('{{lowIncome}}', String(input.studentContext?.lowIncome || false))
    .replace('{{activityAnalysesSummary}}', activitySummaries);
}


// ============================================================================
// ACTIVITY ANALYSIS SERVICE CLASS
// ============================================================================

export class ActivityAnalysisService implements IActivityAnalysisService {
  private _anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - client created on first use
  }

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not found. Ensure dotenv.config() is called before importing services.');
      }
      this._anthropic = new Anthropic({ apiKey });
    }
    return this._anthropic;
  }

  /**
   * Analyze a single activity comprehensively
   */
  async analyzeActivity(
    activity: ActivityWorkshopInput,
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): Promise<ActivityAnalysis> {
    const prompt = formatSingleActivityPrompt(activity, studentContext);

    try {
      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_SINGLE_ACTIVITY,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<ActivityAnalysis>(responseText, `ActivityAnalysis:${activity.title}`);

      // Ensure activityId is set
      return {
        ...parsed,
        activityId: activity.id,
      };
    } catch (error) {
      console.error('[ActivityAnalysis] Error analyzing activity:', error);
      return this.createFallbackActivityAnalysis(activity);
    }
  }

  /**
   * Analyze complete portfolio
   */
  async analyzePortfolio(input: ActivityWorkshopSessionInput): Promise<PortfolioAnalysis> {
    console.log(`[ActivityAnalysis] Starting portfolio analysis for ${input.activities.length} activities`);

    // Step 1: Analyze each activity individually
    const activityAnalyses: Record<string, ActivityAnalysis> = {};

    for (const activity of input.activities) {
      console.log(`[ActivityAnalysis] Analyzing: ${activity.title}`);
      const analysis = await this.analyzeActivity(activity, input.studentContext);
      activityAnalyses[activity.id] = analysis;
    }

    console.log(`[ActivityAnalysis] Individual analyses complete, synthesizing portfolio...`);

    // Step 2: Portfolio-level synthesis
    const prompt = formatPortfolioPrompt(input, activityAnalyses);

    try {
      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_PORTFOLIO,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<Omit<PortfolioAnalysis, 'activities'>>(responseText, 'PortfolioAnalysis');

      if (!parsed) {
        console.error('[ActivityAnalysis] Failed to parse portfolio response, using fallback');
        return this.createFallbackPortfolioAnalysis(input, activityAnalyses);
      }

      // Combine individual analyses with portfolio synthesis
      return {
        activities: activityAnalyses,
        ...parsed,
      };
    } catch (error) {
      console.error('[ActivityAnalysis] Error in portfolio synthesis:', error);
      return this.createFallbackPortfolioAnalysis(input, activityAnalyses);
    }
  }

  /**
   * Create fallback analysis for single activity
   */
  private createFallbackActivityAnalysis(activity: ActivityWorkshopInput): ActivityAnalysis {
    const description = activity.description.toLowerCase();

    // Basic heuristic tier detection
    let tier: ActivityTier = 4;
    let recognition: RecognitionLevel = 'none';

    if (description.includes('national') || description.includes('international')) {
      tier = 1;
      recognition = description.includes('international') ? 'international' : 'national';
    } else if (description.includes('state') || description.includes('regional')) {
      tier = 2;
      recognition = description.includes('state') ? 'state' : 'regional';
    } else if (description.includes('school') || description.includes('local')) {
      tier = 3;
      recognition = 'school';
    }

    return {
      activityId: activity.id,
      classification: {
        tier,
        tierConfidence: 'low',
        tierReasoning: 'Fallback heuristic analysis - full LLM analysis unavailable',
        detectedCategory: this.detectCategoryHeuristic(activity),
        categoryConfidence: 50,
      },
      recognition: {
        level: recognition,
        evidence: [],
        authenticityScore: 50,
        authenticityFactors: ['Unable to verify - using fallback'],
      },
      leadership: {
        type: this.detectLeadershipHeuristic(activity),
        evidence: [],
        impactScope: 'individual',
        leadershipQuality: 'none',
      },
      impact: {
        type: 'unclear',
        evidence: [],
        quantifiableMetrics: [],
        impactScore: 50,
        impactNarrative: 'Unable to analyze impact - using fallback',
      },
      timeInvestment: {
        totalHours: (activity.hoursPerWeek || 0) * (activity.weeksPerYear || 0) * (activity.yearsInvolved || 1),
        hoursPerWeek: activity.hoursPerWeek || 0,
        weeksPerYear: activity.weeksPerYear || 0,
        yearsInvolved: activity.yearsInvolved || 1,
        commitmentLevel: 'moderate',
        progressionEvidence: [],
      },
      redFlags: [],
      greenFlags: [],
      descriptionQuality: {
        specificity: 5,
        impactClarity: 5,
        uniqueness: 5,
        actionVerbs: 5,
        quantification: 5,
        overallScore: 50,
        issues: ['Unable to perform full analysis'],
        strengths: [],
      },
      databaseMatches: [],
      narrativePotential: {
        storytellingValue: 'medium',
        uniqueAngles: [],
        emotionalResonance: 'Unable to determine',
        growthArc: 'Unable to determine',
        essayWorthiness: 'possible',
      },
      schoolFit: {
        bestFitSchoolTypes: [],
        alignedValues: [],
        potentialConcerns: ['Analysis incomplete'],
      },
    };
  }

  /**
   * Create fallback portfolio analysis
   */
  private createFallbackPortfolioAnalysis(
    input: ActivityWorkshopSessionInput,
    activityAnalyses: Record<string, ActivityAnalysis>
  ): PortfolioAnalysis {
    // Calculate tier distribution
    const tierDistribution = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    for (const analysis of Object.values(activityAnalyses)) {
      const key = `tier${analysis.classification.tier}` as keyof typeof tierDistribution;
      tierDistribution[key]++;
    }

    return {
      activities: activityAnalyses,
      tierDistribution: {
        ...tierDistribution,
        portfolioTier: this.calculatePortfolioTier(tierDistribution),
        tierRationale: 'Calculated from individual tier distribution',
      },
      spikeAnalysis: {
        hasSpike: false,
        spikeStrength: 'none',
        spikeActivities: [],
        spikeEvidence: [],
        spikeAuthenticity: 50,
        spikeNarrative: 'Unable to perform spike analysis - using fallback',
        spikeDevelopmentStage: 'absent',
      },
      coherenceAnalysis: {
        score: 50,
        assessment: 'moderate',
        primaryTheme: 'Unable to determine',
        secondaryThemes: [],
        thematicConnections: [],
        disconnectedActivities: [],
        narrativeThread: 'Unable to determine',
      },
      depthBreadthProfile: {
        profile: 'balanced',
        depthScore: 50,
        breadthScore: 50,
        optimalBalance: 'Unable to determine',
      },
      hiddenGems: {
        undersoldActivities: [],
        workFamilyContributions: { present: false, activities: [], value: '' },
        constrainedExcellence: { present: false, context: '', activities: [] },
      },
      competitiveAssessment: {
        overallStrength: 'competitive',
        strengthAreas: [],
        weaknessAreas: ['Analysis incomplete'],
        differentiators: [],
        commonalities: [],
        competitiveEdge: 'Unable to determine',
      },
      gapsIdentified: [],
      commonAppReadiness: {
        readyForSubmission: false,
        activitiesCount: input.activities.length,
        topActivitiesIdentified: input.activities.map((a) => a.id),
        orderingRecommendation: input.activities.map((a) => a.id),
        descriptionReadiness: input.activities.map((a) => ({
          activityId: a.id,
          ready: false,
          issues: ['Analysis incomplete'],
        })),
      },
      analysisConfidence: {
        overallConfidence: 30,
        dataQuality: 50,
        classificationConfidence: 30,
        spikeConfidence: 20,
        factors: [{ factor: 'Using fallback analysis', impact: 'negative', score: -40 }],
      },
    };
  }

  /**
   * Calculate overall portfolio tier from distribution
   */
  private calculatePortfolioTier(dist: { tier1: number; tier2: number; tier3: number; tier4: number }): ActivityTier {
    if (dist.tier1 >= 2) return 1;
    if (dist.tier1 >= 1 || dist.tier2 >= 3) return 2;
    if (dist.tier2 >= 1 || dist.tier3 >= 3) return 3;
    return 4;
  }

  /**
   * Heuristic category detection
   */
  private detectCategoryHeuristic(activity: ActivityWorkshopInput): ActivityCategory {
    const combined = `${activity.title} ${activity.description}`.toLowerCase();

    if (combined.includes('research') || combined.includes('lab')) return 'research';
    if (combined.includes('competition') || combined.includes('olympiad')) return 'academic_competition';
    if (combined.includes('volunteer') || combined.includes('nonprofit')) return 'community_service';
    if (combined.includes('orchestra') || combined.includes('theater')) return 'arts_performance';
    if (combined.includes('sport') || combined.includes('varsity')) return 'athletics';
    if (combined.includes('founded') || combined.includes('startup')) return 'entrepreneurship';
    if (activity.isPaid) return 'work_experience';

    return 'other';
  }

  /**
   * Heuristic leadership detection
   */
  private detectLeadershipHeuristic(activity: ActivityWorkshopInput): LeadershipType {
    const combined = `${activity.title} ${activity.description} ${activity.role || ''}`.toLowerCase();

    if (combined.includes('founded') || combined.includes('created')) return 'founder';
    if (combined.includes('president') || combined.includes('captain')) return 'president_captain';
    if (combined.includes('vice') || combined.includes('secretary')) return 'executive_board';

    return 'none';
  }
}

// Export singleton
export const activityAnalysisService = new ActivityAnalysisService();
