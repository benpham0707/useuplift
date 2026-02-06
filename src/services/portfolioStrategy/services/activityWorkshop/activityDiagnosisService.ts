/**
 * Activity Diagnosis Service (Haiku-powered)
 *
 * Fast triage and classification of activities using Claude Haiku.
 * Inspired by PIQ Workshop's Stage 0 diagnosis approach.
 *
 * Responsibilities:
 * 1. Quick tier classification with confidence
 * 2. Red flag detection
 * 3. Green flag (strength) detection
 * 4. Description quality assessment
 * 5. Database matching for specific achievements
 * 6. Portfolio-level pattern detection (spike, coherence)
 *
 * Uses: Claude Haiku for speed (~$0.25/$1.25 per million tokens)
 * Target: <$0.01 per activity diagnosis
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  ActivityDiagnosis,
  PortfolioDiagnosis,
  IActivityDiagnosisService,
} from './types';

import { ActivityTier, ActivityCategory, LeadershipType, RecognitionLevel, ImpactType } from '../../types';

import { SpikeType, SpikeStrength, MajorCategory, ImpactTier } from '../../knowledge';
import { parseClaudeJSON } from '../../../commonAppWorkshop/utils/jsonParser';

// Import knowledge databases for matching
import {
  ADMISSION_IMPACT_MULTIPLIERS,
  RED_FLAG_PATTERNS,
  METRIC_RED_FLAGS,
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  SPIKE_DEFINITIONS,
  COHERENCE_SCORE_INTERPRETATION,
} from '../../knowledge';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS_PER_ACTIVITY = 1500;
const MAX_TOKENS_PORTFOLIO = 3000;

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

const SINGLE_ACTIVITY_DIAGNOSIS_PROMPT = `You are an expert college admissions counselor specializing in extracurricular activity evaluation. Analyze this activity and provide a structured diagnosis.

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

## Your Task:
Diagnose this activity across multiple dimensions. Be precise and critical.

## Tier Classification Framework:
- Tier 1: National/international recognition, top 1% achievement, published research, Olympic-level
- Tier 2: State/regional recognition, significant leadership with documented impact
- Tier 3: School-level leadership, consistent multi-year commitment, local impact
- Tier 4: General participation, membership without distinction

## Respond in this exact JSON format:
{
  "preliminaryTier": 1|2|3|4,
  "tierConfidence": "high"|"medium"|"low",
  "tierReasoning": "One sentence explanation",

  "detectedCategory": "academic_competition|research|stem_project|arts_performance|arts_visual|arts_literary|athletics|community_service|leadership_governance|entrepreneurship|work_experience|family_responsibilities|cultural_heritage|religious_faith|special_interest|internship|summer_program|other",

  "detectedRecognition": "international|national|regional|state|district|school|local|none",
  "recognitionEvidence": ["evidence1", "evidence2"],

  "detectedLeadership": "founder|president_captain|executive_board|team_lead|mentor_teacher|committee_chair|elected_representative|appointed_leader|informal_leader|none",
  "leadershipEvidence": ["evidence1"],

  "detectedImpact": "quantifiable|organizational|community|personal_growth|skill_development|creative_output|competitive_success|mentorship|unclear",
  "impactEvidence": ["evidence1"],
  "quantifiableMetrics": [{"metric": "name", "value": "X", "tier": "transformational|exceptional|strong|solid|moderate|minimal"}],

  "redFlags": [
    {"flag": "description", "severity": "critical|moderate|minor", "evidence": "what triggered this"}
  ],

  "greenFlags": [
    {"flag": "description", "strength": "exceptional|strong|notable", "evidence": "what demonstrates this"}
  ],

  "descriptionQuality": {
    "specificity": 0-10,
    "impactClarity": 0-10,
    "uniqueness": 0-10,
    "issues": ["issue1", "issue2"]
  },

  "matchedBenchmarks": [
    {"database": "name", "match": "specific achievement matched", "tier": 1-4, "relevance": 0-100}
  ]
}

Be critical but fair. Look for both red flags and genuine strengths. Match against known competition standards, program selectivity, and impact benchmarks.`;

const PORTFOLIO_DIAGNOSIS_PROMPT = `You are an expert college admissions counselor. Analyze this student's complete activity portfolio and provide a portfolio-level diagnosis.

## Student Context:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}
Grade Level: {{gradeLevel}}
First-gen: {{firstGen}}
Low-income: {{lowIncome}}

## Activities (with individual diagnoses):
{{activitiesSummary}}

## Your Task:
Provide portfolio-level analysis focusing on spike detection, coherence, and strategic positioning.

## Spike Detection Framework:
- Strong spike: Multiple Tier 1-2 activities in related area with national recognition
- Moderate spike: Tier 2 activities with clear theme and state/regional recognition
- Emerging spike: Clear focus but lacking top-tier achievements
- No spike: Scattered activities without clear concentration

## Coherence Assessment:
- Exceptional (85-100): Clear narrative thread, activities reinforce each other
- Strong (70-84): Visible theme with mostly aligned activities
- Moderate (50-69): Emerging focus but diluted by unrelated activities
- Weak (30-49): No clear theme, activities seem unconnected
- Scattered (0-29): Random activities, possible resume padding

## Respond in this exact JSON format:
{
  "tierDistribution": {
    "tier1": number,
    "tier2": number,
    "tier3": number,
    "tier4": number
  },

  "spikeDetection": {
    "hasSpike": boolean,
    "spikeType": "research_scientist|tech_builder|entrepreneur|writer_intellectual|policy_advocate|performing_artist|visual_artist|athlete_leader|community_builder|healthcare_servant|environmental_champion|cultural_bridge|maker_inventor|educator_mentor|journalist_communicator|null",
    "spikeStrength": "national|regional|local|emerging|none",
    "spikeActivities": ["activity_id1", "activity_id2"],
    "spikeEvidence": ["evidence1", "evidence2"]
  },

  "coherenceScore": 0-100,
  "coherenceAssessment": "exceptional|strong|moderate|weak|scattered",
  "themesCovered": ["theme1", "theme2"],

  "majorAlignment": {
    "alignmentScore": 0-100,
    "alignedActivities": ["id1", "id2"],
    "misalignedActivities": ["id3"],
    "gaps": ["gap1", "gap2"]
  },

  "overallStrength": "exceptional|strong|competitive|developing|needs_work",
  "keyStrengths": ["strength1", "strength2"],
  "criticalGaps": ["gap1", "gap2"],

  "priorityIssues": [
    {
      "issue": "description",
      "severity": "critical|high|medium|low",
      "affectedActivities": ["id1"],
      "recommendation": "what to do"
    }
  ]
}

Focus on actionable insights. Identify the single most impactful improvement the student could make.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatActivityForPrompt(activity: ActivityWorkshopInput): string {
  return SINGLE_ACTIVITY_DIAGNOSIS_PROMPT.replace('{{title}}', activity.title)
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
      activity.achievements?.map((a) => `${a.title} (${a.level || 'unspecified level'})`).join(', ') || 'None listed'
    );
}

function formatPortfolioForPrompt(
  input: ActivityWorkshopSessionInput,
  activityDiagnoses: Record<string, ActivityDiagnosis>
): string {
  const activitiesSummary = input.activities
    .map((a) => {
      const diagnosis = activityDiagnoses[a.id];
      return `
Activity ID: ${a.id}
Title: ${a.title}
Preliminary Tier: ${diagnosis?.preliminaryTier || 'Unknown'}
Category: ${diagnosis?.detectedCategory || a.category}
Recognition: ${diagnosis?.detectedRecognition || 'None'}
Leadership: ${diagnosis?.detectedLeadership || 'None'}
Red Flags: ${diagnosis?.redFlags?.length || 0}
Green Flags: ${diagnosis?.greenFlags?.length || 0}
Hours/week: ${a.hoursPerWeek}
---`;
    })
    .join('\n');

  return PORTFOLIO_DIAGNOSIS_PROMPT.replace('{{intendedMajor}}', input.studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', input.studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{gradeLevel}}', String(input.studentContext?.gradeLevel || 'Not specified'))
    .replace('{{firstGen}}', String(input.studentContext?.firstGen || false))
    .replace('{{lowIncome}}', String(input.studentContext?.lowIncome || false))
    .replace('{{activitiesSummary}}', activitiesSummary);
}


// ============================================================================
// ACTIVITY DIAGNOSIS SERVICE CLASS
// ============================================================================

export class ActivityDiagnosisService implements IActivityDiagnosisService {
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
   * Diagnose a single activity using Haiku
   */
  async diagnoseActivity(activity: ActivityWorkshopInput): Promise<ActivityDiagnosis> {
    const prompt = formatActivityForPrompt(activity);

    try {
      const response = await this.anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: MAX_TOKENS_PER_ACTIVITY,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<{
        preliminaryTier: number;
        tierConfidence: string;
        tierReasoning: string;
        detectedCategory: string;
        detectedRecognition: string;
        recognitionEvidence: string[];
        detectedLeadership: string;
        leadershipEvidence: string[];
        detectedImpact: string;
        impactEvidence: string[];
        quantifiableMetrics: { metric: string; value: string | number; tier: string }[];
        redFlags: { flag: string; severity: string; evidence: string }[];
        greenFlags: { flag: string; strength: string; evidence: string }[];
        descriptionQuality: {
          specificity: number;
          impactClarity: number;
          uniqueness: number;
          issues: string[];
        };
        matchedBenchmarks: { database: string; match: string; tier: number; relevance: number }[];
      }>(responseText, `ActivityDiagnosis:${activity.title}`);

      return {
        activityId: activity.id,
        preliminaryTier: (parsed.preliminaryTier as ActivityTier) || 4,
        tierConfidence: (parsed.tierConfidence as 'high' | 'medium' | 'low') || 'low',
        detectedCategory: (parsed.detectedCategory as ActivityCategory) || 'other',
        categoryConfidence: 70,
        detectedRecognition: (parsed.detectedRecognition as RecognitionLevel) || 'none',
        recognitionEvidence: parsed.recognitionEvidence || [],
        detectedLeadership: (parsed.detectedLeadership as LeadershipType) || 'none',
        leadershipEvidence: parsed.leadershipEvidence || [],
        detectedImpact: (parsed.detectedImpact as ImpactType) || 'unclear',
        impactEvidence: parsed.impactEvidence || [],
        quantifiableMetrics: parsed.quantifiableMetrics?.map((m) => ({
          metric: m.metric,
          value: m.value,
          tier: m.tier as ImpactTier,
        })),
        redFlags:
          parsed.redFlags?.map((f) => ({
            flag: f.flag,
            severity: f.severity as 'critical' | 'moderate' | 'minor',
            evidence: f.evidence,
          })) || [],
        greenFlags:
          parsed.greenFlags?.map((f) => ({
            flag: f.flag,
            strength: f.strength as 'exceptional' | 'strong' | 'notable',
            evidence: f.evidence,
          })) || [],
        descriptionQuality: parsed.descriptionQuality || {
          specificity: 5,
          impactClarity: 5,
          uniqueness: 5,
          issues: [],
        },
        databaseMatches:
          parsed.matchedBenchmarks?.map((m) => ({
            database: m.database,
            match: m.match,
            tier: m.tier,
            relevance: m.relevance,
          })) || [],
      };
    } catch (error) {
      console.error('[ActivityDiagnosis] Error diagnosing activity:', error);
      return this.createFallbackDiagnosis(activity);
    }
  }

  /**
   * Diagnose the complete portfolio
   */
  async diagnosePortfolio(input: ActivityWorkshopSessionInput): Promise<PortfolioDiagnosis> {
    // First, diagnose all activities individually
    const activityDiagnoses: Record<string, ActivityDiagnosis> = {};

    // Diagnose activities in parallel for speed
    const diagnosisPromises = input.activities.map(async (activity) => {
      const diagnosis = await this.diagnoseActivity(activity);
      return { id: activity.id, diagnosis };
    });

    const results = await Promise.all(diagnosisPromises);
    for (const { id, diagnosis } of results) {
      activityDiagnoses[id] = diagnosis;
    }

    // Now do portfolio-level analysis
    const prompt = formatPortfolioForPrompt(input, activityDiagnoses);

    try {
      const response = await this.anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: MAX_TOKENS_PORTFOLIO,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<{
        tierDistribution: { tier1: number; tier2: number; tier3: number; tier4: number };
        spikeDetection: {
          hasSpike: boolean;
          spikeType: string | null;
          spikeStrength: string;
          spikeActivities: string[];
          spikeEvidence: string[];
        };
        coherenceScore: number;
        coherenceAssessment: string;
        themesCovered: string[];
        majorAlignment: {
          alignmentScore: number;
          alignedActivities: string[];
          misalignedActivities: string[];
          gaps: string[];
        };
        overallStrength: string;
        keyStrengths: string[];
        criticalGaps: string[];
        priorityIssues: {
          issue: string;
          severity: string;
          affectedActivities: string[];
          recommendation: string;
        }[];
      }>(responseText, 'PortfolioDiagnosis');

      // Calculate tier distribution from individual diagnoses if not provided
      const tierDistribution = parsed.tierDistribution || this.calculateTierDistribution(activityDiagnoses);

      return {
        activities: activityDiagnoses,
        tierDistribution,
        spikeDetection: {
          hasSpike: parsed.spikeDetection?.hasSpike || false,
          spikeType: (parsed.spikeDetection?.spikeType as SpikeType) || undefined,
          spikeStrength: (parsed.spikeDetection?.spikeStrength as SpikeStrength) || 'none',
          spikeActivities: parsed.spikeDetection?.spikeActivities || [],
          spikeEvidence: parsed.spikeDetection?.spikeEvidence || [],
        },
        coherenceScore: parsed.coherenceScore || 50,
        coherenceAssessment:
          (parsed.coherenceAssessment as 'exceptional' | 'strong' | 'moderate' | 'weak' | 'scattered') || 'moderate',
        themesCovered: parsed.themesCovered || [],
        majorAlignment: input.studentContext?.intendedMajor
          ? {
              major: input.studentContext.intendedMajor as MajorCategory,
              alignmentScore: parsed.majorAlignment?.alignmentScore || 50,
              alignedActivities: parsed.majorAlignment?.alignedActivities || [],
              misalignedActivities: parsed.majorAlignment?.misalignedActivities || [],
              gaps: parsed.majorAlignment?.gaps || [],
            }
          : undefined,
        overallStrength:
          (parsed.overallStrength as 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work') ||
          'competitive',
        keyStrengths: parsed.keyStrengths || [],
        criticalGaps: parsed.criticalGaps || [],
        priorityIssues:
          parsed.priorityIssues?.map((issue) => ({
            issue: issue.issue,
            severity: issue.severity as 'critical' | 'high' | 'medium' | 'low',
            affectedActivities: issue.affectedActivities,
            recommendation: issue.recommendation,
          })) || [],
      };
    } catch (error) {
      console.error('[ActivityDiagnosis] Error diagnosing portfolio:', error);
      return this.createFallbackPortfolioDiagnosis(input, activityDiagnoses);
    }
  }

  /**
   * Create fallback diagnosis for an activity (when API fails)
   */
  private createFallbackDiagnosis(activity: ActivityWorkshopInput): ActivityDiagnosis {
    // Heuristic-based fallback
    const description = activity.description.toLowerCase();

    // Basic tier estimation
    let tier: ActivityTier = 4;
    let recognition: RecognitionLevel = 'none';
    let leadership: LeadershipType = 'none';

    // Look for national/international indicators
    if (
      description.includes('national') ||
      description.includes('international') ||
      description.includes('olympiad') ||
      description.includes('finalist')
    ) {
      tier = 1;
      recognition = description.includes('international') ? 'international' : 'national';
    } else if (description.includes('state') || description.includes('regional')) {
      tier = 2;
      recognition = description.includes('state') ? 'state' : 'regional';
    } else if (description.includes('school') || description.includes('local')) {
      tier = 3;
      recognition = 'school';
    }

    // Look for leadership indicators
    if (description.includes('founded') || description.includes('created') || description.includes('started')) {
      leadership = 'founder';
    } else if (description.includes('president') || description.includes('captain')) {
      leadership = 'president_captain';
    } else if (
      description.includes('vice') ||
      description.includes('secretary') ||
      description.includes('treasurer')
    ) {
      leadership = 'executive_board';
    }

    return {
      activityId: activity.id,
      preliminaryTier: tier,
      tierConfidence: 'low',
      detectedCategory: this.detectCategoryHeuristic(activity),
      categoryConfidence: 50,
      detectedRecognition: recognition,
      recognitionEvidence: [],
      detectedLeadership: leadership,
      leadershipEvidence: [],
      detectedImpact: 'unclear',
      impactEvidence: [],
      redFlags: [],
      greenFlags: [],
      descriptionQuality: {
        specificity: 5,
        impactClarity: 5,
        uniqueness: 5,
        issues: ['Unable to perform full analysis - using heuristic fallback'],
      },
      databaseMatches: [],
    };
  }

  /**
   * Create fallback portfolio diagnosis
   */
  private createFallbackPortfolioDiagnosis(
    input: ActivityWorkshopSessionInput,
    activityDiagnoses: Record<string, ActivityDiagnosis>
  ): PortfolioDiagnosis {
    const tierDistribution = this.calculateTierDistribution(activityDiagnoses);

    return {
      activities: activityDiagnoses,
      tierDistribution,
      spikeDetection: {
        hasSpike: false,
        spikeStrength: 'none',
        spikeActivities: [],
        spikeEvidence: [],
      },
      coherenceScore: 50,
      coherenceAssessment: 'moderate',
      themesCovered: [],
      overallStrength: 'competitive',
      keyStrengths: [],
      criticalGaps: ['Unable to perform full portfolio analysis - using fallback'],
      priorityIssues: [],
    };
  }

  /**
   * Calculate tier distribution from diagnoses
   */
  private calculateTierDistribution(
    activityDiagnoses: Record<string, ActivityDiagnosis>
  ): PortfolioDiagnosis['tierDistribution'] {
    const distribution = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };

    for (const diagnosis of Object.values(activityDiagnoses)) {
      const tierKey = `tier${diagnosis.preliminaryTier}` as keyof typeof distribution;
      distribution[tierKey]++;
    }

    return distribution;
  }

  /**
   * Heuristic category detection
   */
  private detectCategoryHeuristic(activity: ActivityWorkshopInput): ActivityCategory {
    const combined = `${activity.title} ${activity.description}`.toLowerCase();

    if (combined.includes('research') || combined.includes('lab')) return 'research';
    if (combined.includes('competition') || combined.includes('olympiad')) return 'academic_competition';
    if (combined.includes('volunteer') || combined.includes('nonprofit')) return 'community_service';
    if (combined.includes('orchestra') || combined.includes('theater') || combined.includes('dance'))
      return 'arts_performance';
    if (combined.includes('sport') || combined.includes('varsity') || combined.includes('team')) return 'athletics';
    if (combined.includes('founded') || combined.includes('startup') || combined.includes('business'))
      return 'entrepreneurship';
    if (activity.isPaid) return 'work_experience';

    return 'other';
  }
}

// Export singleton instance
export const activityDiagnosisService = new ActivityDiagnosisService();
