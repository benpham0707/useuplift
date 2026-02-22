// @ts-nocheck
/**
 * Batch Activity Analysis Service
 *
 * COST-OPTIMIZED ANALYSIS - Single API call for entire portfolio
 *
 * This service leverages:
 * 1. Research-Backed Profiler for pre-computed analysis (grade weighting,
 *    Sara Harberson scoring, spike detection, time realism, authenticity)
 * 2. SINGLE batch API call for all activities instead of per-activity calls
 * 3. Comprehensive context in prompt for quality maintenance
 *
 * COST COMPARISON:
 * - Old approach: ~$0.08-0.12 per activity × 10 activities = $0.80-1.20
 * - New approach: ~$0.15-0.25 for entire portfolio = 75-80% cost reduction
 *
 * MODEL: Sonnet for quality (analysis requires nuanced judgment)
 */

import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../../lib/llm/claude';
import { callClaude } from '@/lib/llm/claude';
import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  ActivityAnalysis,
  PortfolioAnalysis,
  IActivityAnalysisService,
} from './types';
import { ActivityProfile } from './profile/types';
import { profileBridgeService } from './profileBridge';

import { ActivityTier, ActivityCategory, LeadershipType, RecognitionLevel, ImpactType } from '../../types';
import { SpikeType, SpikeStrength, MajorCategory, ImpactTier } from '../../knowledge';
import { parseClaudeJSON } from '../../../commonAppWorkshop/utils/jsonParser';

// Import Research-Backed Profiler for pre-computation
import {
  ResearchBackedProfiler,
  researchBackedProfiler,
  EnhancedPortfolioAssessment,
  EnhancedActivityAssessment,
  GRADE_LEVEL_WEIGHTS,
  TIME_REALISM_THRESHOLDS,
  SPIKE_CRITERIA,
  HARVARD_RATING_MAP,
} from '../../engines/researchBackedProfiler';

import { NuancedProfilingInput } from '../../types/nuancedProfiling';
import { normalizeMajor } from '../../knowledge/fieldSpecificExpectations';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_BATCH_ANALYSIS = 16000; // Larger for batch processing
const MAX_TOKENS_PORTFOLIO_SYNTHESIS = 8000;

// ============================================================================
// BATCH ANALYSIS PROMPT
// ============================================================================

const BATCH_ACTIVITY_ANALYSIS_PROMPT = `You are a senior college admissions consultant with 20+ years of experience. Analyze ALL activities in this portfolio comprehensively in a SINGLE response.

## Student Profile:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}
Grade Level: {{gradeLevel}}
First-gen: {{firstGen}}
Low-income: {{lowIncome}}

## Research-Backed Pre-Analysis (from validated profiler):
{{preAnalysis}}

## All Activities to Analyze:
{{activitiesList}}

## SARA HARBERSON 4-TIER FRAMEWORK:
- Tier 1: National/international recognition, < 1% achievement (USAMO, Intel finalist, D1 recruit)
- Tier 2: State/regional recognition with leadership impact (state champion, AIME, Eagle Scout)
- Tier 3: School/local recognition with commitment (varsity, club officer, consistent volunteer)
- Tier 4: Participation without distinction (club member, one-time events)

## STANDARDIZED DESCRIPTION ISSUE TYPES:
When identifying description issues, use ONLY these exact types:
- vague_description: Description uses general language without specifics
- missing_quantification: No numbers, metrics, or measurable outcomes
- weak_role_clarity: Role/position is unclear or undefined
- buried_leadership: Leadership role exists but isn't highlighted
- hidden_impact: Real impact exists but isn't communicated
- generic_contribution: Contribution sounds like anyone could do it
- missing_progression: No evidence of growth over time
- title_mismatch: Title implies more than description supports
- buried_achievement: Significant achievements mentioned but not emphasized
- weak_differentiator: Nothing distinguishes this from similar activities
- resume_speak: Corporate jargon without substance
- missing_context: Lacks important context (selectivity, scope, etc.)
- shallow_depth: Surface-level involvement described
- authenticity_gap: Claims feel exaggerated or unsupported
- tier_misperception: Description suggests different tier than reality

## Your Task:
Using the pre-analysis data AND your expert judgment, provide comprehensive analysis for EACH activity AND the portfolio as a whole.

Respond in this exact JSON format:
{
  "activities": {
    "<activity_id>": {
      "classification": {
        "tier": 1|2|3|4,
        "tierConfidence": "high"|"medium"|"low",
        "tierReasoning": "Detailed explanation citing specific evidence",
        "detectedCategory": "academic_competition|research|stem_project|arts_performance|...",
        "categoryConfidence": 0-100
      },
      "recognition": {
        "level": "international|national|regional|state|district|school|local|none",
        "evidence": ["specific evidence"],
        "authenticityScore": 0-100,
        "authenticityFactors": ["factors"]
      },
      "leadership": {
        "type": "founder|president_captain|executive_board|team_lead|mentor_teacher|...|none",
        "evidence": ["evidence"],
        "impactScope": "individual|team|organization|community|regional|national",
        "leadershipQuality": "exceptional|strong|solid|developing|none"
      },
      "impact": {
        "type": "quantifiable|organizational|community|personal_growth|skill_development|...",
        "evidence": ["evidence"],
        "quantifiableMetrics": [{"metric": "name", "value": "X", "tier": "transformational|exceptional|strong|solid|moderate|minimal", "verified": true|false}],
        "impactScore": 0-100,
        "impactNarrative": "summary"
      },
      "timeInvestment": {
        "totalHours": number,
        "hoursPerWeek": number,
        "weeksPerYear": number,
        "yearsInvolved": number,
        "commitmentLevel": "exceptional|significant|moderate|minimal",
        "progressionEvidence": ["evidence"]
      },
      "redFlags": [{"flag": "description", "severity": "critical|moderate|minor", "evidence": "trigger", "implication": "meaning"}],
      "greenFlags": [{"flag": "description", "strength": "exceptional|strong|notable", "evidence": "what", "admissionsValue": "why"}],
      "descriptionQuality": {
        "specificity": 0-10,
        "impactClarity": 0-10,
        "uniqueness": 0-10,
        "actionVerbs": 0-10,
        "quantification": 0-10,
        "overallScore": 0-100,
        "issues": [{"type": "vague_description|missing_quantification|weak_role_clarity|buried_leadership|hidden_impact|generic_contribution|missing_progression|title_mismatch|buried_achievement|weak_differentiator|resume_speak|missing_context|shallow_depth|authenticity_gap|tier_misperception", "evidence": "specific evidence from description"}],
        "strengths": ["positives"]
      },
      "narrativePotential": {
        "storytellingValue": "high|medium|low",
        "uniqueAngles": ["angles"],
        "emotionalResonance": "what emotional thread",
        "growthArc": "growth story",
        "essayWorthiness": "excellent|good|possible|unlikely"
      },
      "schoolFit": {
        "bestFitSchoolTypes": ["types"],
        "alignedValues": ["values"],
        "potentialConcerns": ["concerns"]
      }
    }
  },
  "portfolioSynthesis": {
    "tierDistribution": {
      "tier1": number,
      "tier2": number,
      "tier3": number,
      "tier4": number,
      "portfolioTier": 1|2|3|4,
      "tierRationale": "explanation"
    },
    "spikeAnalysis": {
      "hasSpike": true|false,
      "spikeType": "research_scientist|tech_builder|entrepreneur|...|null",
      "spikeStrength": "national|regional|local|emerging|none",
      "spikeActivities": ["activity_ids"],
      "spikeEvidence": ["evidence"],
      "spikeAuthenticity": 0-100,
      "spikeNarrative": "story",
      "spikeDevelopmentStage": "mature|developing|emerging|absent"
    },
    "coherenceAnalysis": {
      "score": 0-100,
      "assessment": "exceptional|strong|moderate|weak|scattered",
      "primaryTheme": "main theme",
      "secondaryThemes": ["supporting themes"],
      "thematicConnections": [{"activity1": "id", "activity2": "id", "connection": "how", "strength": "strong|moderate|weak"}],
      "disconnectedActivities": [{"activityId": "id", "reason": "why"}],
      "narrativeThread": "overarching story"
    },
    "majorAlignment": {
      "intendedMajor": "major",
      "alignmentScore": 0-100,
      "stronglyAligned": ["ids"],
      "moderatelyAligned": ["ids"],
      "misaligned": ["ids"],
      "gaps": ["missing"],
      "competitiveBenchmark": "comparison"
    },
    "depthBreadthProfile": {
      "profile": "deep_spike|focused|balanced|broad|scattered",
      "depthScore": 0-100,
      "breadthScore": 0-100,
      "optimalBalance": "assessment"
    },
    "hiddenGems": {
      "undersoldActivities": [{"activityId": "id", "currentPresentation": "how", "trueValue": "actual", "whyUndersold": "reason"}],
      "workFamilyContributions": {"present": true|false, "activities": ["ids"], "value": "value"},
      "constrainedExcellence": {"present": true|false, "context": "constraints", "activities": ["ids"]}
    },
    "competitiveAssessment": {
      "overallStrength": "exceptional|strong|competitive|developing|needs_work",
      "strengthAreas": ["areas"],
      "weaknessAreas": ["areas"],
      "differentiators": ["unique"],
      "commonalities": ["typical"],
      "competitiveEdge": "summary"
    },
    "gapsIdentified": [{"gap": "what", "severity": "critical|significant|minor", "impactOnApplication": "how", "affectedSchools": ["schools"]}],
    "commonAppReadiness": {
      "readyForSubmission": true|false,
      "activitiesCount": number,
      "topActivitiesIdentified": ["top 10 ids"],
      "orderingRecommendation": ["ordered ids"],
      "descriptionReadiness": [{"activityId": "id", "ready": true|false, "issues": ["issues"]}]
    }
  }
}

IMPORTANT:
- Analyze ALL activities thoroughly - this is the only analysis pass
- Use the pre-analysis data to inform but not override your judgment
- Be rigorous - don't inflate tiers
- Cite specific evidence from descriptions
- Consider the full portfolio context when assessing each activity`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function convertToNuancedInput(input: ActivityWorkshopSessionInput): NuancedProfilingInput {
  const majorCategory = normalizeMajor(input.studentContext?.intendedMajor || 'undeclared');

  return {
    studentContext: {
      intendedMajor: majorCategory,
      gradeLevel: input.studentContext?.gradeLevel || 11,
      majorCertainty: 'exploring',
    },
    activities: input.activities.map(activity => ({
      id: activity.id,
      name: activity.title,
      organization: activity.organization,
      category: mapWorkshopCategoryToActivityCategory(activity.category),
      description: activity.description,
      role: activity.role || 'Member',
      hoursPerWeek: activity.hoursPerWeek,
      weeksPerYear: activity.weeksPerYear,
      yearsInvolved: activity.yearsInvolved || 1,
      gradeLevels: activity.gradeLevels || [input.studentContext?.gradeLevel || 11],
      isPaid: activity.isPaid,
      achievements: activity.achievements?.map(a => ({
        title: a.title,
        level: mapAchievementLevel(a.level),
        date: a.date,
      })),
    })),
  };
}

function mapWorkshopCategoryToActivityCategory(category: string): string {
  const mapping: Record<string, string> = {
    work: 'work_experience',
    volunteer: 'community_service',
    school_activity: 'leadership_governance',
    project: 'stem_project',
  };
  return mapping[category] || 'other';
}

function mapAchievementLevel(level?: string): 'international' | 'national' | 'state' | 'regional' | 'school' | 'local' {
  if (!level) return 'school';
  const normalized = level.toLowerCase();
  if (normalized.includes('international') || normalized.includes('global')) return 'international';
  if (normalized.includes('national')) return 'national';
  if (normalized.includes('state')) return 'state';
  if (normalized.includes('regional')) return 'regional';
  if (normalized.includes('local')) return 'local';
  return 'school';
}

function formatPreAnalysis(profilerResult: EnhancedPortfolioAssessment): string {
  const lines: string[] = [];

  // Overall Assessment
  lines.push(`## Overall Assessment:`);
  lines.push(`- Competitive Level: ${profilerResult.overallAssessment.competitiveLevel}`);
  lines.push(`- Harvard Rating Estimate: ${profilerResult.overallAssessment.harvardRatingEstimate}/6`);
  lines.push(`- Strength: ${profilerResult.overallAssessment.strengthSummary}`);
  lines.push(`- Weakness: ${profilerResult.overallAssessment.weaknessSummary}`);
  lines.push('');

  // Spike Analysis
  lines.push(`## Spike Analysis (Stanford Model):`);
  lines.push(`- Has Spike: ${profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike}`);
  lines.push(`- Spike Strength: ${profilerResult.portfolioAnalysis.spikeAnalysis.spikeStrength}`);
  lines.push(`- Breadth vs Depth: ${profilerResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth}`);
  lines.push(`- Admissions Implication: ${profilerResult.portfolioAnalysis.spikeAnalysis.admissionsImplication}`);
  lines.push('');

  // Time Realism
  lines.push(`## Time Realism Check:`);
  lines.push(`- Total Weekly Hours: ${profilerResult.portfolioAnalysis.timeRealism.totalWeeklyHours}`);
  lines.push(`- Credibility: ${profilerResult.portfolioAnalysis.timeRealism.level}`);
  lines.push(`- Reasoning: ${profilerResult.portfolioAnalysis.timeRealism.reasoning}`);
  lines.push('');

  // Per-Activity Pre-Analysis
  lines.push(`## Per-Activity Pre-Analysis:`);
  for (const assessment of profilerResult.activityAssessments) {
    lines.push(`\n### ${assessment.activityName} (${assessment.activityId}):`);
    lines.push(`- Harberson Score: ${assessment.harbersonScore.totalPoints}/11 (Duration: ${assessment.harbersonScore.durationPoints}, Leadership: ${assessment.harbersonScore.leadershipPoints}, Major Alignment: ${assessment.harbersonScore.majorAlignmentPoints}, Hours: ${assessment.harbersonScore.hoursPoints})`);
    lines.push(`- Suggested Tier: ${assessment.tier} (Harvard Rating: ${assessment.harvardRating})`);
    lines.push(`- Authenticity: ${assessment.authenticity.level} (${assessment.authenticity.score}/100)`);
    if (assessment.authenticity.positiveSignals.length > 0) {
      lines.push(`  - Positive: ${assessment.authenticity.positiveSignals.slice(0, 2).join('; ')}`);
    }
    if (assessment.authenticity.concernSignals.length > 0) {
      lines.push(`  - Concerns: ${assessment.authenticity.concernSignals.slice(0, 2).join('; ')}`);
    }
    lines.push(`- Time Credibility: ${assessment.timeCredibility.level}`);
    lines.push(`- Major Alignment: ${assessment.majorAlignment.type}`);
    lines.push(`- Grade Analysis: Started ${assessment.gradeLevelAnalysis.startedEarly ? 'early' : 'late'}, ${assessment.gradeLevelAnalysis.sustainedThroughJunior ? 'sustained through junior year' : 'not sustained through junior year'}`);
    lines.push(`- Description Quality: ${assessment.descriptionQuality.level} (${assessment.descriptionQuality.score}/100)`);
    if (assessment.priorityImprovements.length > 0) {
      lines.push(`- Priority Improvements: ${assessment.priorityImprovements.slice(0, 2).join('; ')}`);
    }
  }

  // Recommendations Summary
  lines.push(`\n## Key Recommendations:`);
  if (profilerResult.recommendations.immediate.length > 0) {
    lines.push(`- Immediate: ${profilerResult.recommendations.immediate.slice(0, 2).join('; ')}`);
  }
  if (profilerResult.recommendations.shortTerm.length > 0) {
    lines.push(`- Short-term: ${profilerResult.recommendations.shortTerm.slice(0, 2).join('; ')}`);
  }

  return lines.join('\n');
}

function formatActivitiesList(activities: ActivityWorkshopInput[]): string {
  return activities.map((activity, index) => `
### Activity ${index + 1}: ${activity.title} (ID: ${activity.id})
- Organization: ${activity.organization || 'Not specified'}
- Role: ${activity.role || 'Not specified'}
- Category: ${activity.category}
- Description: ${activity.description}
- Hours/week: ${activity.hoursPerWeek || 0}
- Weeks/year: ${activity.weeksPerYear || 0}
- Years involved: ${activity.yearsInvolved || 1}
- Grade levels: ${(activity.gradeLevels || []).join(', ') || 'Not specified'}
- Is paid: ${activity.isPaid || false}
- Achievements: ${activity.achievements?.map(a => `${a.title} (${a.level || 'unspecified'})`).join(', ') || 'None listed'}
`).join('\n---\n');
}

/**
 * Format activities list with optional profile enrichment for sub-batch prompts.
 *
 * When an ActivityProfile exists for an activity and is useful, appends a
 * VERIFIED STUDENT CONTEXT block with facts, recognition, scale, story, and
 * impact highlights. This materially improves tier accuracy — especially for
 * undersold activities where the 150-char description undersells the reality.
 *
 * Cost impact: ~50-200 extra tokens per activity with a profile.
 */
function formatActivitiesListWithProfiles(
  activities: ActivityWorkshopInput[],
  activityProfiles?: Record<string, ActivityProfile>
): string {
  return activities.map((activity, index) => {
    // Base activity block (identical to formatActivitiesList)
    let block = `
### Activity ${index + 1}: ${activity.title} (ID: ${activity.id})
- Organization: ${activity.organization || 'Not specified'}
- Role: ${activity.role || 'Not specified'}
- Category: ${activity.category}
- Description: ${activity.description}
- Hours/week: ${activity.hoursPerWeek || 0}
- Weeks/year: ${activity.weeksPerYear || 0}
- Years involved: ${activity.yearsInvolved || 1}
- Grade levels: ${(activity.gradeLevels || []).join(', ') || 'Not specified'}
- Is paid: ${activity.isPaid || false}
- Achievements: ${activity.achievements?.map(a => `${a.title} (${a.level || 'unspecified'})`).join(', ') || 'None listed'}`;

    // Enrich with profile data when available
    if (activityProfiles?.[activity.id]) {
      const profile = activityProfiles[activity.id];
      if (profileBridgeService.isProfileUseful(profile)) {
        const summary = profileBridgeService.summarizeForAnalysis(profile);
        const formattedContext = profileBridgeService.formatForPrompt(summary);
        if (formattedContext) {
          block += `\n\nVERIFIED STUDENT CONTEXT (from conversation — treat as confirmed facts):\n${formattedContext}`;
        }
      }
    }

    return block;
  }).join('\n---\n');
}

function formatBatchPrompt(
  input: ActivityWorkshopSessionInput,
  preAnalysis: string
): string {
  return BATCH_ACTIVITY_ANALYSIS_PROMPT
    .replace('{{intendedMajor}}', input.studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', input.studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{gradeLevel}}', String(input.studentContext?.gradeLevel || 'Not specified'))
    .replace('{{firstGen}}', String(input.studentContext?.firstGen || false))
    .replace('{{lowIncome}}', String(input.studentContext?.lowIncome || false))
    .replace('{{preAnalysis}}', preAnalysis)
    .replace('{{activitiesList}}', formatActivitiesList(input.activities));
}

// ============================================================================
// SUB-BATCH ANALYSIS: SPLIT INTO SYSTEM (CACHED) + USER (DYNAMIC) PROMPTS
//
// The system prompt contains ALL static content (Harberson framework, issue
// types, JSON schema) and is cached across parallel sub-batch calls.
// The user prompt contains ONLY dynamic per-batch data (student context,
// filtered pre-analysis, activities).
// ============================================================================

const SUB_BATCH_SYSTEM_PROMPT = `You are a senior college admissions consultant with 20+ years of experience. Analyze the activities provided comprehensively.

## SARA HARBERSON 4-TIER FRAMEWORK:
- Tier 1: National/international recognition, < 1% achievement (USAMO, Intel finalist, D1 recruit)
- Tier 2: State/regional recognition with leadership impact (state champion, AIME, Eagle Scout)
- Tier 3: School/local recognition with commitment (varsity, club officer, consistent volunteer)
- Tier 4: Participation without distinction (club member, one-time events)

## STANDARDIZED DESCRIPTION ISSUE TYPES:
When identifying description issues, use ONLY these exact types:
- vague_description: Description uses general language without specifics
- missing_quantification: No numbers, metrics, or measurable outcomes
- weak_role_clarity: Role/position is unclear or undefined
- buried_leadership: Leadership role exists but isn't highlighted
- hidden_impact: Real impact exists but isn't communicated
- generic_contribution: Contribution sounds like anyone could do it
- missing_progression: No evidence of growth over time
- title_mismatch: Title implies more than description supports
- buried_achievement: Significant achievements mentioned but not emphasized
- weak_differentiator: Nothing distinguishes this from similar activities
- resume_speak: Corporate jargon without substance
- missing_context: Lacks important context (selectivity, scope, etc.)
- shallow_depth: Surface-level involvement described
- authenticity_gap: Claims feel exaggerated or unsupported
- tier_misperception: Description suggests different tier than reality

## Your Task:
Using the pre-analysis data AND your expert judgment, provide comprehensive analysis for EACH activity provided AND a portfolio synthesis section.

## OUTPUT FORMAT:
Respond in this exact JSON format:
${JSON.stringify({
  activities: {
    "<activity_id>": {
      classification: { tier: "1|2|3|4", tierConfidence: "high|medium|low", tierReasoning: "string", detectedCategory: "string", categoryConfidence: "0-100" },
      recognition: { level: "string", evidence: ["string"], authenticityScore: "0-100", authenticityFactors: ["string"] },
      leadership: { type: "string", evidence: ["string"], impactScope: "string", leadershipQuality: "string" },
      impact: { type: "string", evidence: ["string"], quantifiableMetrics: [{ metric: "name", value: "X", tier: "string", verified: true }], impactScore: "0-100", impactNarrative: "string" },
      timeInvestment: { totalHours: 0, hoursPerWeek: 0, weeksPerYear: 0, yearsInvolved: 0, commitmentLevel: "string", progressionEvidence: ["string"] },
      redFlags: [{ flag: "string", severity: "critical|moderate|minor", evidence: "string", implication: "string" }],
      greenFlags: [{ flag: "string", strength: "exceptional|strong|notable", evidence: "string", admissionsValue: "string" }],
      descriptionQuality: { specificity: "0-10", impactClarity: "0-10", uniqueness: "0-10", actionVerbs: "0-10", quantification: "0-10", overallScore: "0-100", issues: [{ type: "issue_type", evidence: "string" }], strengths: ["string"] },
      narrativePotential: { storytellingValue: "high|medium|low", uniqueAngles: ["string"], emotionalResonance: "string", growthArc: "string", essayWorthiness: "excellent|good|possible|unlikely" },
      schoolFit: { bestFitSchoolTypes: ["string"], alignedValues: ["string"], potentialConcerns: ["string"] },
    },
  },
  portfolioSynthesis: {
    tierDistribution: { tier1: 0, tier2: 0, tier3: 0, tier4: 0, portfolioTier: "1-4", tierRationale: "string" },
    spikeAnalysis: { hasSpike: true, spikeType: "string|null", spikeStrength: "string", spikeActivities: ["ids"], spikeEvidence: ["string"], spikeAuthenticity: "0-100", spikeNarrative: "string", spikeDevelopmentStage: "mature|developing|emerging|absent" },
    coherenceAnalysis: { score: "0-100", assessment: "string", primaryTheme: "string", secondaryThemes: ["string"], thematicConnections: [], disconnectedActivities: [], narrativeThread: "string" },
    majorAlignment: { intendedMajor: "string", alignmentScore: "0-100", stronglyAligned: ["ids"], moderatelyAligned: ["ids"], misaligned: ["ids"], gaps: ["string"], competitiveBenchmark: "string" },
    depthBreadthProfile: { profile: "string", depthScore: "0-100", breadthScore: "0-100", optimalBalance: "string" },
    hiddenGems: { undersoldActivities: [], workFamilyContributions: { present: false, activities: [], value: "string" }, constrainedExcellence: { present: false, context: "string", activities: [] } },
    competitiveAssessment: { overallStrength: "string", strengthAreas: ["string"], weaknessAreas: ["string"], differentiators: ["string"], commonalities: ["string"], competitiveEdge: "string" },
    gapsIdentified: [],
    commonAppReadiness: { readyForSubmission: false, activitiesCount: 0, topActivitiesIdentified: [], orderingRecommendation: [], descriptionReadiness: [] },
  },
}, null, 0)}

IMPORTANT:
- Analyze ALL activities thoroughly
- Use the pre-analysis data to inform but not override your judgment
- Be rigorous - don't inflate tiers
- Cite specific evidence from descriptions
- Consider the full portfolio context when assessing each activity

NOTE ON VERIFIED STUDENT CONTEXT: Some activities may include a "VERIFIED STUDENT CONTEXT" section with facts confirmed through student conversation. Use this context for:
- More accurate TIER ASSESSMENT (e.g., if description says "helped with tutoring" but verified context confirms "redesigned curriculum used by 3 schools", the tier should reflect actual scope)
- Better HIDDEN GEM detection (identifying undersold activities)
- More accurate RED/GREEN FLAG assessment (verified facts can confirm or contradict description claims)
However, activity description quality SCORES (specificity, impactClarity, uniqueness, actionVerbs, quantification, overallScore) must reflect what an admissions officer would see from the DESCRIPTION TEXT ALONE. Do NOT inflate description quality scores based on information that only appears in the verified context — those scores measure how well the student presents themselves in writing.`;

function formatSubBatchUserPrompt(
  input: ActivityWorkshopSessionInput,
  preAnalysis: string,
  activityProfiles?: Record<string, ActivityProfile>
): string {
  return `## Student Profile:
Intended Major: ${input.studentContext?.intendedMajor || 'Not specified'}
Target Schools: ${input.studentContext?.targetSchools?.join(', ') || 'Not specified'}
Grade Level: ${input.studentContext?.gradeLevel || 'Not specified'}
First-gen: ${input.studentContext?.firstGen || false}
Low-income: ${input.studentContext?.lowIncome || false}

## Pre-Analysis (from validated profiler):
${preAnalysis}

## Activities to Analyze:
${formatActivitiesListWithProfiles(input.activities, activityProfiles)}

Respond with the JSON format specified in your instructions.`;
}


// ============================================================================
// BATCH ACTIVITY ANALYSIS SERVICE CLASS
// ============================================================================

interface BatchAnalysisResponse {
  activities: Record<string, Omit<ActivityAnalysis, 'activityId' | 'databaseMatches'>>;
  portfolioSynthesis: Omit<PortfolioAnalysis, 'activities' | 'analysisConfidence'>;
}

/**
 * Normalize issues from LLM response to string[] format
 *
 * The LLM may output issues in various formats:
 * 1. Structured: [{type: "vague_description", evidence: "..."}]
 * 2. Plain strings: ["vague description", "missing metrics"]
 *
 * This normalizes to string[] containing the standardized issue type names
 * for direct mapping to teaching knowledge base.
 */
function normalizeIssues(issues: unknown): string[] {
  if (!issues || !Array.isArray(issues)) {
    return [];
  }

  return issues.map(issue => {
    // Handle structured format: {type: "...", evidence: "..."}
    if (typeof issue === 'object' && issue !== null && 'type' in issue) {
      return (issue as { type: string }).type;
    }
    // Handle plain string format
    if (typeof issue === 'string') {
      return issue;
    }
    return String(issue);
  }).filter(Boolean);
}

export class BatchActivityAnalysisService implements IActivityAnalysisService {
  private _anthropic: Anthropic | null = null;
  private profiler: ResearchBackedProfiler;

  constructor() {
    // Lazy initialization - don't create client until needed
    // This allows dotenv.config() to run before first API call
    this.profiler = researchBackedProfiler;
  }

  /**
   * Get the Anthropic client, creating it lazily if needed
   */
  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = getAnthropicClient();
    }
    return this._anthropic;
  }

  /**
   * Analyze a single activity (redirects to batch for consistency)
   */
  async analyzeActivity(
    activity: ActivityWorkshopInput,
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): Promise<ActivityAnalysis> {
    // For single activity, just run through the batch processor with one activity
    const input: ActivityWorkshopSessionInput = {
      activities: [activity],
      studentContext,
    };
    const result = await this.analyzePortfolio(input);
    return result.activities[activity.id];
  }

  /**
   * Analyze complete portfolio using batch processing
   *
   * This is the main entry point - analyzes ALL activities in ONE API call
   */
  async analyzePortfolio(input: ActivityWorkshopSessionInput): Promise<PortfolioAnalysis> {
    console.log(`[BatchActivityAnalysis] Starting batch analysis for ${input.activities.length} activities`);
    const startTime = Date.now();

    // Step 1: Run Research-Backed Profiler for pre-computation
    console.log(`[BatchActivityAnalysis] Running research-backed profiler...`);
    const nuancedInput = convertToNuancedInput(input);
    const profilerResult = await this.profiler.analyzeProfile(nuancedInput);
    console.log(`[BatchActivityAnalysis] Profiler complete in ${Date.now() - startTime}ms`);

    // Step 2: Format pre-analysis for LLM context
    const preAnalysis = formatPreAnalysis(profilerResult);

    // Step 3: Single batch API call for all activities
    console.log(`[BatchActivityAnalysis] Making batch API call...`);
    const prompt = formatBatchPrompt(input, preAnalysis);

    try {
      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_BATCH_ANALYSIS,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<BatchAnalysisResponse>(responseText, 'BatchActivityAnalysis');

      if (!parsed) {
        console.error('[BatchActivityAnalysis] Failed to parse response, using profiler-based fallback');
        return this.createFallbackFromProfiler(input, profilerResult);
      }

      console.log(`[BatchActivityAnalysis] Batch analysis complete in ${Date.now() - startTime}ms`);

      // Step 4: Combine parsed response with activity IDs and database matches
      const activities: Record<string, ActivityAnalysis> = {};

      for (const activity of input.activities) {
        const analysisData = parsed.activities[activity.id];
        if (analysisData) {
          // Find the profiler assessment for this activity
          const profilerAssessment = profilerResult.activityAssessments.find(
            a => a.activityId === activity.id
          );

          // Normalize issues from potentially structured format to string[]
          const normalizedIssues = normalizeIssues(analysisData.descriptionQuality?.issues);

          activities[activity.id] = {
            activityId: activity.id,
            ...analysisData,
            descriptionQuality: {
              ...analysisData.descriptionQuality,
              issues: normalizedIssues,
            },
            databaseMatches: this.generateDatabaseMatches(activity, profilerAssessment),
          };
        } else {
          // Fallback for missing activity
          activities[activity.id] = this.createFallbackActivityAnalysis(activity, profilerResult);
        }
      }

      return {
        activities,
        ...parsed.portfolioSynthesis,
        analysisConfidence: {
          overallConfidence: profilerResult.analysisConfidence.overallConfidence,
          dataQuality: 80,
          classificationConfidence: 75,
          spikeConfidence: profilerResult.analysisConfidence.overallConfidence,
          factors: [
            { factor: 'Research-backed profiler pre-analysis', impact: 'positive', score: 15 },
            { factor: 'Batch processing consistency', impact: 'positive', score: 10 },
            ...(profilerResult.analysisConfidence.caveats.length > 0
              ? [{ factor: profilerResult.analysisConfidence.caveats[0], impact: 'negative' as const, score: -10 }]
              : []),
          ],
        },
      };
    } catch (error) {
      console.error('[BatchActivityAnalysis] Error in batch analysis:', error);
      return this.createFallbackFromProfiler(input, profilerResult);
    }
  }

  /**
   * Generate database matches from profiler assessment
   */
  private generateDatabaseMatches(
    activity: ActivityWorkshopInput,
    profilerAssessment?: EnhancedActivityAssessment
  ): ActivityAnalysis['databaseMatches'] {
    const matches: ActivityAnalysis['databaseMatches'] = [];

    if (profilerAssessment) {
      // Add Harberson framework match
      matches.push({
        database: 'Sara Harberson Point System',
        matchedEntry: `Duration: ${profilerAssessment.harbersonScore.durationPoints}/4, Leadership: ${profilerAssessment.harbersonScore.leadershipPoints}/3`,
        tier: profilerAssessment.tier,
        relevance: 95,
        insight: `Harberson total: ${profilerAssessment.harbersonScore.totalPoints}/11 points, suggested rank #${profilerAssessment.harbersonScore.ranking}`,
      });

      // Add Harvard rating match
      matches.push({
        database: 'Harvard 1-6 Rating System',
        matchedEntry: HARVARD_RATING_MAP[profilerAssessment.harvardRating].description,
        tier: profilerAssessment.tier,
        relevance: 90,
        insight: `Harvard rating ${profilerAssessment.harvardRating}/6 based on recognition level and impact`,
      });

      // Add grade weighting insight
      if (profilerAssessment.gradeLevelAnalysis.sustainedThroughJunior) {
        matches.push({
          database: 'Grade-Level Weighting Research',
          matchedEntry: 'Junior year activity sustained (weight: 1.0)',
          tier: profilerAssessment.tier,
          relevance: 85,
          insight: 'Activity maintained through critical junior year - highest admissions weight',
        });
      }
    }

    return matches;
  }

  /**
   * Create fallback from profiler results when LLM fails
   */
  private createFallbackFromProfiler(
    input: ActivityWorkshopSessionInput,
    profilerResult: EnhancedPortfolioAssessment
  ): PortfolioAnalysis {
    const activities: Record<string, ActivityAnalysis> = {};

    for (const activity of input.activities) {
      activities[activity.id] = this.createFallbackActivityAnalysis(activity, profilerResult);
    }

    // Map spike strength
    const spikeStrengthMap: Record<string, SpikeStrength> = {
      exceptional: 'national',
      strong: 'regional',
      moderate: 'local',
      weak: 'emerging',
      none: 'none',
    };

    return {
      activities,
      tierDistribution: {
        tier1: profilerResult.portfolioAnalysis.tierDistribution.tier1Count,
        tier2: profilerResult.portfolioAnalysis.tierDistribution.tier2Count,
        tier3: profilerResult.portfolioAnalysis.tierDistribution.tier3Count,
        tier4: profilerResult.portfolioAnalysis.tierDistribution.tier4Count,
        portfolioTier: this.calculatePortfolioTier(profilerResult.portfolioAnalysis.tierDistribution),
        tierRationale: profilerResult.overallAssessment.admissionsOfficerPerspective,
      },
      spikeAnalysis: {
        hasSpike: profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike,
        spikeStrength: spikeStrengthMap[profilerResult.portfolioAnalysis.spikeAnalysis.spikeStrength] || 'none',
        spikeActivities: profilerResult.portfolioAnalysis.spikeAnalysis.spikeActivities,
        spikeEvidence: [profilerResult.portfolioAnalysis.spikeAnalysis.reasoning],
        spikeAuthenticity: 70,
        spikeNarrative: profilerResult.portfolioAnalysis.spikeAnalysis.admissionsImplication,
        spikeDevelopmentStage: this.mapSpikeStrengthToDevelopmentStage(
          profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike,
          profilerResult.portfolioAnalysis.spikeAnalysis.spikeStrength
        ),
      },
      coherenceAnalysis: {
        score: profilerResult.portfolioAnalysis.narrativeCoherence.score,
        assessment: this.mapCoherenceAssessment(profilerResult.portfolioAnalysis.narrativeCoherence.score),
        primaryTheme: profilerResult.portfolioAnalysis.narrativeCoherence.primaryTheme,
        secondaryThemes: profilerResult.portfolioAnalysis.narrativeCoherence.supportingThemes,
        thematicConnections: [],
        disconnectedActivities: profilerResult.portfolioAnalysis.narrativeCoherence.orphanActivities.map(id => ({
          activityId: id,
          reason: 'Not aligned with primary spike area',
        })),
        narrativeThread: profilerResult.portfolioAnalysis.narrativeCoherence.storyPotential,
      },
      majorAlignment: {
        intendedMajor: profilerResult.studentContext.intendedMajor,
        alignmentScore: profilerResult.portfolioAnalysis.majorAlignment.overallScore,
        stronglyAligned: profilerResult.portfolioAnalysis.majorAlignment.coreActivities,
        moderatelyAligned: [],
        misaligned: [],
        gaps: profilerResult.portfolioAnalysis.majorAlignment.gaps,
        competitiveBenchmark: profilerResult.portfolioAnalysis.majorAlignment.competitivePosition,
      },
      depthBreadthProfile: {
        profile: this.mapBreadthVsDepth(profilerResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth),
        depthScore: profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike ? 75 : 40,
        breadthScore: profilerResult.activityAssessments.length >= 6 ? 70 : 50,
        optimalBalance: profilerResult.portfolioAnalysis.spikeAnalysis.admissionsImplication,
      },
      hiddenGems: {
        undersoldActivities: [],
        workFamilyContributions: { present: false, activities: [], value: '' },
        constrainedExcellence: { present: false, context: '', activities: [] },
      },
      competitiveAssessment: {
        overallStrength: this.mapCompetitiveLevel(profilerResult.overallAssessment.competitiveLevel),
        strengthAreas: [profilerResult.overallAssessment.strengthSummary],
        weaknessAreas: [profilerResult.overallAssessment.weaknessSummary],
        differentiators: [],
        commonalities: [],
        competitiveEdge: profilerResult.overallAssessment.admissionsOfficerPerspective,
      },
      gapsIdentified: profilerResult.portfolioAnalysis.majorAlignment.gaps.map(gap => ({
        gap,
        severity: 'significant' as const,
        impactOnApplication: 'May affect competitiveness for intended major',
        affectedSchools: [],
      })),
      commonAppReadiness: {
        readyForSubmission: profilerResult.activityAssessments.length >= 5,
        activitiesCount: input.activities.length,
        topActivitiesIdentified: profilerResult.commonAppOrdering.order.slice(0, 10),
        orderingRecommendation: profilerResult.commonAppOrdering.order,
        descriptionReadiness: input.activities.map(a => {
          const assessment = profilerResult.activityAssessments.find(pa => pa.activityId === a.id);
          return {
            activityId: a.id,
            ready: (assessment?.descriptionQuality.score || 0) >= 60,
            issues: assessment?.descriptionQuality.issues || [],
          };
        }),
      },
      analysisConfidence: {
        overallConfidence: 65, // Lower confidence for fallback
        dataQuality: 70,
        classificationConfidence: 60,
        spikeConfidence: 55,
        factors: [
          { factor: 'Using profiler-based fallback', impact: 'negative', score: -20 },
          { factor: 'Research-backed methodology retained', impact: 'positive', score: 10 },
        ],
      },
    };
  }

  /**
   * Create fallback analysis for single activity from profiler
   */
  private createFallbackActivityAnalysis(
    activity: ActivityWorkshopInput,
    profilerResult: EnhancedPortfolioAssessment
  ): ActivityAnalysis {
    const profilerAssessment = profilerResult.activityAssessments.find(
      a => a.activityId === activity.id
    );

    if (!profilerAssessment) {
      // Ultimate fallback - heuristic-based
      return this.createHeuristicFallback(activity);
    }

    return {
      activityId: activity.id,
      classification: {
        tier: profilerAssessment.tier,
        tierConfidence: profilerAssessment.tierConfidence >= 80 ? 'high' : profilerAssessment.tierConfidence >= 60 ? 'medium' : 'low',
        tierReasoning: profilerAssessment.reasoning.conclusion,
        detectedCategory: this.detectCategoryHeuristic(activity),
        categoryConfidence: 70,
      },
      recognition: {
        level: this.mapHarvardToRecognition(profilerAssessment.harvardRating),
        evidence: [],
        authenticityScore: profilerAssessment.authenticity.score,
        authenticityFactors: [
          ...profilerAssessment.authenticity.positiveSignals,
          ...profilerAssessment.authenticity.concernSignals.map(s => `CONCERN: ${s}`),
        ],
      },
      leadership: {
        type: this.detectLeadershipHeuristic(activity),
        evidence: [],
        impactScope: this.mapLeadershipScope(profilerAssessment.harbersonScore.leadershipPoints),
        leadershipQuality: profilerAssessment.harbersonScore.leadershipPoints >= 3 ? 'exceptional' :
                          profilerAssessment.harbersonScore.leadershipPoints >= 2 ? 'strong' :
                          profilerAssessment.harbersonScore.leadershipPoints >= 1 ? 'solid' : 'none',
      },
      impact: {
        type: 'skill_development',
        evidence: [],
        quantifiableMetrics: [],
        // R2-10: Fixed formula — maps 11-point Harberson scale to 0-100 proportionally
        impactScore: Math.min(100, Math.max(10, Math.round((profilerAssessment.harbersonScore.totalPoints / 11) * 100))),
        impactNarrative: profilerAssessment.reasoning.admissionsOfficerPerspective,
      },
      timeInvestment: {
        totalHours: profilerAssessment.timeCredibility.totalHours,
        hoursPerWeek: profilerAssessment.timeCredibility.weeklyHours,
        weeksPerYear: activity.weeksPerYear,
        yearsInvolved: activity.yearsInvolved || 1,
        commitmentLevel: profilerAssessment.harbersonScore.durationPoints >= 4 ? 'exceptional' :
                        profilerAssessment.harbersonScore.durationPoints >= 3 ? 'significant' :
                        profilerAssessment.harbersonScore.durationPoints >= 2 ? 'moderate' : 'minimal',
        progressionEvidence: [],
      },
      redFlags: profilerAssessment.timeCredibility.redFlags.map(flag => ({
        flag,
        severity: 'moderate' as const,
        evidence: 'From time realism check',
        implication: 'May warrant scrutiny from admissions officers',
      })),
      greenFlags: profilerAssessment.authenticity.positiveSignals.map(signal => ({
        flag: signal,
        strength: 'notable' as const,
        evidence: 'From authenticity assessment',
        admissionsValue: 'Demonstrates genuine engagement',
      })),
      descriptionQuality: {
        specificity: Math.round(profilerAssessment.descriptionQuality.score / 10),
        impactClarity: Math.round(profilerAssessment.descriptionQuality.score / 10),
        uniqueness: 5,
        actionVerbs: 5,
        quantification: 5,
        overallScore: profilerAssessment.descriptionQuality.score,
        issues: profilerAssessment.descriptionQuality.issues,
        strengths: profilerAssessment.descriptionQuality.strengths,
      },
      databaseMatches: this.generateDatabaseMatches(activity, profilerAssessment),
      narrativePotential: {
        storytellingValue: profilerAssessment.tier <= 2 ? 'high' : profilerAssessment.tier === 3 ? 'medium' : 'low',
        uniqueAngles: [],
        emotionalResonance: 'Potential for authentic personal narrative',
        growthArc: profilerAssessment.gradeLevelAnalysis.progressionPattern === 'increasing' ?
                   'Clear growth trajectory visible' : 'Growth trajectory could be highlighted',
        essayWorthiness: profilerAssessment.tier <= 2 ? 'excellent' : profilerAssessment.tier === 3 ? 'good' : 'possible',
      },
      schoolFit: {
        bestFitSchoolTypes: [],
        alignedValues: [],
        potentialConcerns: profilerAssessment.authenticity.concernSignals,
      },
    };
  }

  /**
   * Create heuristic-based fallback when profiler has no data
   */
  private createHeuristicFallback(activity: ActivityWorkshopInput): ActivityAnalysis {
    const description = activity.description.toLowerCase();
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
        tierReasoning: 'Heuristic analysis - full analysis unavailable',
        detectedCategory: this.detectCategoryHeuristic(activity),
        categoryConfidence: 50,
      },
      recognition: {
        level: recognition,
        evidence: [],
        authenticityScore: 50,
        authenticityFactors: ['Unable to fully verify - using heuristics'],
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

  // ============================================================================
  // HELPER MAPPING METHODS
  // ============================================================================

  /**
   * Map profiler spike strength to a development stage label.
   *
   * The profiler computes spike strength as exceptional|strong|moderate|weak|none.
   * This maps those to the pipeline-wide maturity labels so that Stage 1 and
   * Stage 3 use consistent terminology.
   */
  private mapSpikeStrengthToDevelopmentStage(
    hasSpike: boolean,
    spikeStrength: string
  ): 'mature' | 'developing' | 'emerging' | 'absent' {
    if (!hasSpike) return 'absent';
    if (spikeStrength === 'exceptional' || spikeStrength === 'strong') return 'mature';
    if (spikeStrength === 'moderate') return 'developing';
    // weak spike → emerging (there's signal but it's not strong yet)
    return 'emerging';
  }

  private calculatePortfolioTier(dist: { tier1Count: number; tier2Count: number; tier3Count: number; tier4Count: number }): ActivityTier {
    if (dist.tier1Count >= 2) return 1;
    if (dist.tier1Count >= 1 || dist.tier2Count >= 3) return 2;
    if (dist.tier2Count >= 1 || dist.tier3Count >= 3) return 3;
    return 4;
  }

  private mapCoherenceAssessment(score: number): 'exceptional' | 'strong' | 'moderate' | 'weak' | 'scattered' {
    if (score >= 85) return 'exceptional';
    if (score >= 70) return 'strong';
    if (score >= 50) return 'moderate';
    if (score >= 30) return 'weak';
    return 'scattered';
  }

  private mapBreadthVsDepth(profile: string): 'deep_spike' | 'focused' | 'balanced' | 'broad' | 'scattered' {
    if (profile === 'depth_focused') return 'deep_spike';
    if (profile === 'balanced') return 'balanced';
    return 'broad';
  }

  private mapCompetitiveLevel(level: string): 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work' {
    const mapping: Record<string, 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work'> = {
      highly_competitive: 'exceptional',
      competitive: 'competitive',
      developing: 'developing',
      needs_work: 'needs_work',
    };
    return mapping[level] || 'competitive';
  }

  private mapHarvardToRecognition(rating: 1 | 2 | 3 | 4 | 5 | 6): RecognitionLevel {
    const mapping: Record<number, RecognitionLevel> = {
      1: 'national',
      2: 'state',
      3: 'regional',
      4: 'school',
      5: 'local',
      6: 'none',
    };
    return mapping[rating] || 'none';
  }

  private mapLeadershipScope(points: number): 'individual' | 'team' | 'organization' | 'community' | 'regional' | 'national' {
    if (points >= 3) return 'organization';
    if (points >= 2) return 'team';
    if (points >= 1) return 'team';
    return 'individual';
  }

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

  private detectLeadershipHeuristic(activity: ActivityWorkshopInput): LeadershipType {
    const combined = `${activity.title} ${activity.description} ${activity.role || ''}`.toLowerCase();

    if (combined.includes('founded') || combined.includes('created')) return 'founder';
    if (combined.includes('president') || combined.includes('captain')) return 'president_captain';
    if (combined.includes('vice') || combined.includes('secretary')) return 'executive_board';

    return 'none';
  }

  // ============================================================================
  // PUBLIC METHODS FOR PARALLEL SUB-BATCH PROCESSING (v4.2)
  // ============================================================================

  /**
   * Run ONLY the profiler step on all activities (instant, no API call).
   * Used by Stage 1 to pre-compute portfolio-level metrics before
   * splitting into parallel sub-batches.
   */
  async runProfiler(input: ActivityWorkshopSessionInput): Promise<EnhancedPortfolioAssessment> {
    const nuancedInput = convertToNuancedInput(input);
    return this.profiler.analyzeProfile(nuancedInput);
  }

  /**
   * Analyze a SUB-BATCH of activities (1-2) with pre-computed profiler data.
   *
   * Unlike analyzePortfolio() which runs the profiler + sends ALL activities,
   * this accepts pre-computed profiler results and only sends a subset of
   * activities to the LLM. Portfolio-level profiler context is included but
   * per-activity pre-analysis is FILTERED to only this sub-batch's activities
   * to avoid wasting input tokens on irrelevant data.
   *
   * Uses callClaude() with cacheSystemPrompt: true so the static prompt header
   * (Harberson framework, issue types, JSON schema) is cached across parallel
   * sub-batch calls — saving ~5,000+ input tokens per session.
   *
   * Returns per-activity analyses only (no portfolio synthesis).
   *
   * @param subInput - Workshop session input scoped to this sub-batch's activities
   * @param profilerResult - Pre-computed profiler result for all activities
   * @param activityProfiles - Optional map of activity ID → ActivityProfile from chat system.
   *   When present, appends verified student context (facts, recognition, scale, impact)
   *   to each activity in the prompt for more accurate tier assessment and undersold detection.
   */
  // R5: Return type includes usage so Stage 1 can track sub-batch token costs
  async analyzeSubBatch(
    subInput: ActivityWorkshopSessionInput,
    profilerResult: EnhancedPortfolioAssessment,
    activityProfiles?: Record<string, ActivityProfile>
  ): Promise<{ activities: Record<string, ActivityAnalysis>; usage?: { input_tokens: number; output_tokens: number } }> {
    const activities: Record<string, ActivityAnalysis> = {};

    // Filter pre-analysis to ONLY include activities in this sub-batch
    // (avoids sending data for all 10 activities when analyzing only 2)
    const subBatchActivityIds = new Set(subInput.activities.map(a => a.id));
    const filteredProfilerResult = {
      ...profilerResult,
      activityAssessments: profilerResult.activityAssessments.filter(
        a => subBatchActivityIds.has(a.activityId)
      ),
    };
    const preAnalysis = formatPreAnalysis(filteredProfilerResult);
    const userPrompt = formatSubBatchUserPrompt(subInput, preAnalysis, activityProfiles);

    // Scale maxTokens to sub-batch size (fewer activities = fewer tokens needed)
    const maxTokens = Math.min(MAX_TOKENS_BATCH_ANALYSIS, subInput.activities.length * 6500 + 2000);

    try {
      const response = await callClaude({
        model: SONNET_MODEL,
        systemPrompt: SUB_BATCH_SYSTEM_PROMPT,
        userPrompt,
        maxTokens,
        temperature: 0.2,
        cacheSystemPrompt: true, // Cache static header across parallel sub-batch calls
        timeoutMs: 210000, // 3.5 min — sub-batch output is large (~6,500 tokens/activity)
      });

      // R5: Capture usage from sub-batch API call
      const usage = response.usage ? { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens } : undefined;

      const parsed = parseClaudeJSON<BatchAnalysisResponse>(response.content, 'SubBatchAnalysis');

      if (!parsed) {
        console.warn('[SubBatchAnalysis] Parse failed, using profiler fallback for sub-batch');
        for (const activity of subInput.activities) {
          activities[activity.id] = this.createFallbackActivityAnalysis(activity, profilerResult);
        }
        return { activities, usage };
      }

      for (const activity of subInput.activities) {
        const analysisData = parsed.activities[activity.id];
        if (analysisData) {
          const profilerAssessment = profilerResult.activityAssessments.find(
            a => a.activityId === activity.id
          );
          const normalizedIssues = normalizeIssues(analysisData.descriptionQuality?.issues);
          activities[activity.id] = {
            activityId: activity.id,
            ...analysisData,
            descriptionQuality: {
              ...analysisData.descriptionQuality,
              issues: normalizedIssues,
            },
            databaseMatches: this.generateDatabaseMatches(activity, profilerAssessment),
          };
        } else {
          activities[activity.id] = this.createFallbackActivityAnalysis(activity, profilerResult);
        }
      }

      return { activities, usage };
    } catch (error) {
      console.error('[SubBatchAnalysis] Error, using profiler fallback:', error);
      for (const activity of subInput.activities) {
        activities[activity.id] = this.createFallbackActivityAnalysis(activity, profilerResult);
      }
      // R5: Return undefined usage on error
      return { activities, usage: undefined };
    }
  }

  /**
   * Build portfolio-level analysis fields from profiler data.
   * Used by Stage 1 to construct the PortfolioAnalysis after merging
   * per-activity results from parallel sub-batches.
   */
  buildPortfolioFieldsFromProfiler(
    input: ActivityWorkshopSessionInput,
    profilerResult: EnhancedPortfolioAssessment
  ): Omit<PortfolioAnalysis, 'activities'> {
    const spikeStrengthMap: Record<string, SpikeStrength> = {
      exceptional: 'national',
      strong: 'regional',
      moderate: 'local',
      weak: 'emerging',
      none: 'none',
    };

    return {
      tierDistribution: {
        tier1: profilerResult.portfolioAnalysis.tierDistribution.tier1Count,
        tier2: profilerResult.portfolioAnalysis.tierDistribution.tier2Count,
        tier3: profilerResult.portfolioAnalysis.tierDistribution.tier3Count,
        tier4: profilerResult.portfolioAnalysis.tierDistribution.tier4Count,
        portfolioTier: this.calculatePortfolioTier(profilerResult.portfolioAnalysis.tierDistribution),
        tierRationale: profilerResult.overallAssessment.admissionsOfficerPerspective,
      },
      spikeAnalysis: {
        hasSpike: profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike,
        spikeStrength: spikeStrengthMap[profilerResult.portfolioAnalysis.spikeAnalysis.spikeStrength] || 'none',
        spikeActivities: profilerResult.portfolioAnalysis.spikeAnalysis.spikeActivities,
        spikeEvidence: [profilerResult.portfolioAnalysis.spikeAnalysis.reasoning],
        spikeAuthenticity: 70,
        spikeNarrative: profilerResult.portfolioAnalysis.spikeAnalysis.admissionsImplication,
        spikeDevelopmentStage: this.mapSpikeStrengthToDevelopmentStage(
          profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike,
          profilerResult.portfolioAnalysis.spikeAnalysis.spikeStrength
        ),
      },
      coherenceAnalysis: {
        score: profilerResult.portfolioAnalysis.narrativeCoherence.score,
        assessment: this.mapCoherenceAssessment(profilerResult.portfolioAnalysis.narrativeCoherence.score),
        primaryTheme: profilerResult.portfolioAnalysis.narrativeCoherence.primaryTheme,
        secondaryThemes: profilerResult.portfolioAnalysis.narrativeCoherence.supportingThemes,
        thematicConnections: [],
        disconnectedActivities: profilerResult.portfolioAnalysis.narrativeCoherence.orphanActivities.map(id => ({
          activityId: id,
          reason: 'Not aligned with primary spike area',
        })),
        narrativeThread: profilerResult.portfolioAnalysis.narrativeCoherence.storyPotential,
      },
      majorAlignment: {
        intendedMajor: profilerResult.studentContext.intendedMajor,
        alignmentScore: profilerResult.portfolioAnalysis.majorAlignment.overallScore,
        stronglyAligned: profilerResult.portfolioAnalysis.majorAlignment.coreActivities,
        moderatelyAligned: [],
        misaligned: [],
        gaps: profilerResult.portfolioAnalysis.majorAlignment.gaps,
        competitiveBenchmark: profilerResult.portfolioAnalysis.majorAlignment.competitivePosition,
      },
      depthBreadthProfile: {
        profile: this.mapBreadthVsDepth(profilerResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth),
        depthScore: profilerResult.portfolioAnalysis.spikeAnalysis.hasSpike ? 75 : 40,
        breadthScore: profilerResult.activityAssessments.length >= 6 ? 70 : 50,
        optimalBalance: profilerResult.portfolioAnalysis.spikeAnalysis.admissionsImplication,
      },
      hiddenGems: {
        undersoldActivities: [],
        workFamilyContributions: { present: false, activities: [], value: '' },
        constrainedExcellence: { present: false, context: '', activities: [] },
      },
      competitiveAssessment: {
        overallStrength: this.mapCompetitiveLevel(profilerResult.overallAssessment.competitiveLevel),
        strengthAreas: [profilerResult.overallAssessment.strengthSummary],
        weaknessAreas: [profilerResult.overallAssessment.weaknessSummary],
        differentiators: [],
        commonalities: [],
        competitiveEdge: profilerResult.overallAssessment.admissionsOfficerPerspective,
      },
      gapsIdentified: profilerResult.portfolioAnalysis.majorAlignment.gaps.map(gap => ({
        gap,
        severity: 'significant' as const,
        impactOnApplication: 'May affect competitiveness for intended major',
        affectedSchools: [],
      })),
      commonAppReadiness: {
        readyForSubmission: profilerResult.activityAssessments.length >= 5,
        activitiesCount: input.activities.length,
        topActivitiesIdentified: profilerResult.commonAppOrdering.order.slice(0, 10),
        orderingRecommendation: profilerResult.commonAppOrdering.order,
        descriptionReadiness: input.activities.map(a => {
          const assessment = profilerResult.activityAssessments.find(pa => pa.activityId === a.id);
          return {
            activityId: a.id,
            ready: (assessment?.descriptionQuality.score || 0) >= 60,
            issues: assessment?.descriptionQuality.issues || [],
          };
        }),
      },
      analysisConfidence: {
        overallConfidence: 75,
        dataQuality: 80,
        classificationConfidence: 75,
        spikeConfidence: profilerResult.analysisConfidence.overallConfidence,
        factors: [
          { factor: 'Parallel sub-batch LLM analysis', impact: 'positive', score: 12 },
          { factor: 'Research-backed profiler pre-analysis', impact: 'positive', score: 15 },
          ...(profilerResult.analysisConfidence.caveats.length > 0
            ? [{ factor: profilerResult.analysisConfidence.caveats[0], impact: 'negative' as const, score: -10 }]
            : []),
        ],
      },
    };
  }
}

// Export singleton
export const batchActivityAnalysisService = new BatchActivityAnalysisService();
