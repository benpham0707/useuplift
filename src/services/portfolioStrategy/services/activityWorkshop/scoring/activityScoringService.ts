// @ts-nocheck
/**
 * Activity Scoring Service
 *
 * LLM-powered scoring of activities on a 1-10 scale.
 * Evaluates HOW GOOD the activity is objectively, independent of description quality.
 *
 * SCORING COMPONENTS (each scored 0-10, then weighted):
 * 1. Tier Assessment (30% weight) - Sara Harberson's 4-tier framework
 * 2. Recognition Level (25% weight) - External validation and awards
 * 3. Leadership & Impact (12.5% weight) - CONDITIONAL: only when applicable
 * 4. Community & Character (15% weight) - Character traits and community benefit
 * 5. Commitment & Progression (17.5% weight) - Time invested and growth
 *
 * When Leadership is not applicable (solo activities), weights redistribute:
 * - Tier: 34.3%, Recognition: 28.6%, Community: 17.1%, Commitment: 20%
 *
 * COST: ~$0.02 per activity (Sonnet for nuanced tier assessment)
 */

import { callClaude } from '@/lib/llm/claude';
// R7: Use robust parseClaudeJSON with jsonrepair fallback
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import {
  ActivityScore,
  ActivityScoreBreakdown,
  TierAssessmentComponent,
  RecognitionComponent,
  LeadershipComponent,
  CommunityCharacterComponent,
  CommitmentComponent,
  ComparisonBenchmarks,
  ACTIVITY_SCORE_LEVELS,
} from './types';
import { formatBenchmarksForPrompt, formatBatchBenchmarksForPrompt } from './comparisonBenchmarksLibrary';

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityScoringInput {
  /** Activity title */
  title: string;
  /** Activity description */
  description: string;
  /** Activity type/category */
  type?: string;
  /** Position/role held */
  position?: string;
  /** Organization name */
  organization?: string;
  /** Grade levels involved (9, 10, 11, 12) */
  grades?: number[];
  /** Hours per week */
  hoursPerWeek?: number;
  /** Weeks per year */
  weeksPerYear?: number;
  /** Any honors or awards mentioned */
  honors?: string;
  /** Student's intended major for context */
  intendedMajor?: string;
}

export interface ActivityScoringResult {
  success: boolean;
  score?: ActivityScore;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface BatchActivityScoringInput {
  activities: ActivityScoringInput[];
  /** Student context for holistic assessment */
  studentContext?: {
    intendedMajor?: string;
    schoolType?: string;
    contextualFactors?: string[];
  };
}

export interface BatchActivityScoringResult {
  success: boolean;
  scores?: ActivityScore[];
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ============================================================================
// WEIGHT CONSTANTS
// ============================================================================

/** Standard weights when leadership component applies */
const STANDARD_WEIGHTS = {
  tier: 0.30,
  recognition: 0.25,
  leadership: 0.125,
  community: 0.15,
  commitment: 0.175,
};

/** Adjusted weights when leadership component doesn't apply (solo activities) */
const NO_LEADERSHIP_WEIGHTS = {
  tier: 0.343,
  recognition: 0.286,
  leadership: 0.00,
  community: 0.171,
  commitment: 0.20,
};

// ============================================================================
// PROMPTS
// ============================================================================

const ACTIVITY_SCORING_SYSTEM_PROMPT = `You are an expert college admissions officer evaluating extracurricular activities.

Your task is to score activities on a 1-10 scale, evaluating HOW GOOD the activity is objectively (not how well it's described).

## CRITICAL INSTRUCTIONS FOR RATIONALES:

Your rationales must be SPECIFIC, INSIGHTFUL, and EDUCATIONAL - NOT generic summaries.

❌ BAD RATIONALE (just summarizes what user already knows):
"National recognition through USAMO qualification, plus your training platform has been featured in competitive math communities."

✅ GOOD RATIONALE (provides insight and context the user doesn't know):
"USAMO qualification places you among the top 500 math students nationally (0.03% of high school students). For context, most state math champions never reach this level. This is the threshold where MIT/Caltech actively recruit."

❌ BAD RATIONALE (generic):
"Shows leadership through captain role and team management."

✅ GOOD RATIONALE (specific comparative framing):
"Debate captains who also develop training programs for novices are rare—most captains focus only on their own competition prep. Your 8 novice-to-varsity conversions suggests coaching ability that would stand out even at national-circuit schools."

## SCORING COMPONENTS (each 0-10, then weighted):

### 1. TIER ASSESSMENT (30% weight) - Sara Harberson's 4-Tier Framework
NOTE: Commitment & Progression is weighted 17.5%, Leadership & Impact 12.5%. Sustained dedication and growth matter more than titles.

**Tier 1 (Score 9-10)**: National/international distinction, <1% of applicants
- USAMO/USACO qualifier, Intel/Regeneron finalist, published peer-reviewed research, D1 recruited athlete, professional accomplishment

**Tier 2 (Score 7-8)**: State/regional impact with leadership
- State competition winner (not just participant), founded organization with 100+ people reached, regional awards

**Tier 3 (Score 4-6)**: School-level distinction with meaningful commitment
- Club president, team captain, school award winner, multi-year commitment with growth

**Tier 4 (Score 1-3)**: Participation without distinction
- Club member, occasional volunteer, one-time events

TIER CALIBRATION EXAMPLES:
- T1: "Founded coding bootcamp that trained 200+ underserved students, featured in local news, invited to state education conference"
- T2: "Captain of varsity debate team, won 3 regional tournaments, mentored JV debaters"
- T3: "President of Science Club, organized monthly speaker events, member for 3 years"
- T4: "Member of Spanish Club, participated in cultural events"

COMMON MISCALIBRATION: Activities involving disadvantaged backgrounds or overcoming hardship get inflated tiers. Evaluate the ACHIEVEMENT, not the circumstances. Context matters for teaching, but tier assessment must be based on demonstrated impact and recognition.

### 2. RECOGNITION LEVEL (25% weight)

Score 9-10: International/national (IMO, nationals winner, D1 scholarship offer)
Score 7-8: State-level (state champion, All-State selection)
Score 5-6: Regional/district (regional competition placement)
Score 3-4: School-level (school awards, team MVP)
Score 1-2: No formal recognition

In your rationale, explain what this recognition means in context. Example: "All-State Orchestra typically takes 120 musicians from a pool of 8,000+ auditionees statewide (1.5% acceptance rate)."

### 3. LEADERSHIP & IMPACT (12.5% weight) - CONDITIONAL

Set isApplicable=FALSE for solo/individual activities (research, individual competitions, personal projects, family work).
When isApplicable=FALSE, score=0, brief rationale why.

When applicable:
Score 9-10: Founder/president with measurable community-wide impact (100+ people)
Score 7-8: Executive officer with clear organizational contributions
Score 5-6: Team lead or contributor with measurable impact
Score 3-4: Participant with occasional leadership moments
Score 1-2: Passive member

In rationale, distinguish between title and actual impact. Example: "Being VP is common—what's uncommon is your documented 30% waste reduction. Most environmental clubs cite 'awareness' rather than measurable outcomes."

### 4. COMMUNITY & CHARACTER (15% weight)

Evaluates what the activity reveals about the student's character and benefit to others.

Score 9-10: Activity clearly benefits others significantly + remarkable character trait
Score 7-8: Genuine community contribution + strong character signals
Score 5-6: Some benefit to others + positive character traits
Score 3-4: Primarily self-focused but shows discipline/dedication
Score 1-2: Appears as resume padding, no character depth evident

Character traits to consider: service, innovation, resilience, curiosity, empathy, discipline, creativity, integrity

In rationale, explain what character trait is demonstrated and why it matters. Example: "Building a math training platform for free when you could monetize it shows genuine desire to help others succeed—admissions officers notice this 'pay it forward' mentality."

### 5. COMMITMENT & PROGRESSION (17.5% weight)

Score 9-10: 3+ years, dramatic growth (member → captain → founder of new initiative)
Score 7-8: 2-3 years with clear deepening engagement
Score 5-6: 1-2 years, steady involvement
Score 3-4: <1 year but meaningful intensity
Score 1-2: One-time or sporadic

In rationale, explain the arc. Example: "Starting as a freshman participant and becoming the person who trains other trainers shows the kind of mastery arc that admissions values—you didn't just participate, you became essential to the program."

## OUTPUT FORMAT (JSON):

{
  "total": <1-10>,
  "breakdown": {
    "tierAssessment": {
      "score": <0-10>,
      "maxScore": 10,
      "weight": 0.30,  // Tier
      "weightedScore": <score × weight>,
      "tier": <1|2|3|4>,
      "rationale": "<SPECIFIC insight with comparative framing>"
    },
    "recognitionLevel": {
      "score": <0-10>,
      "maxScore": 10,
      "weight": 0.25,
      "weightedScore": <score × weight>,
      "level": "<international|national|state|regional|school|local|none>",
      "rationale": "<SPECIFIC insight with what this recognition means>"
    },
    "leadershipImpact": {
      "score": <0-10 or 0 if not applicable>,
      "maxScore": 10,
      "weight": <0.125 or 0.00>,
      "weightedScore": <score × weight>,
      "isApplicable": <true|false>,
      "role": "<founder|president_captain|executive|team_lead|contributor|participant|member|not_applicable>",
      "impactScope": "<national|regional|community|organization|team|individual|not_applicable>",
      "rationale": "<SPECIFIC insight or explanation of why not applicable>"
    },
    "communityCharacter": {
      "score": <0-10>,
      "maxScore": 10,
      "weight": 0.15,
      "weightedScore": <score × weight>,
      "primaryTrait": "<service|innovation|resilience|curiosity|empathy|discipline|creativity|integrity>",
      "communityBenefit": "<significant|moderate|minimal|self-focused>",
      "authenticitySignal": "<highly_authentic|genuine|neutral|resume_padding>",
      "rationale": "<SPECIFIC insight about character and community value>"
    },
    "commitmentProgression": {
      "score": <0-10>,
      "maxScore": 10,
      "weight": 0.175,
      "weightedScore": <score × weight>,
      "years": <estimated years>,
      "showsProgression": <true|false>,
      "sustainedThroughJunior": <true|false>,
      "rationale": "<SPECIFIC insight about commitment trajectory>"
    },
    "weightConfig": {
      "tierWeight": <0.30 or 0.343>,
      "recognitionWeight": <0.25 or 0.286>,
      "leadershipWeight": <0.125 or 0.00>,
      "communityWeight": <0.15 or 0.171>,
      "commitmentWeight": <0.175 or 0.20>,
      "leadershipApplicable": <true|false>
    }
  },
  "tierJustification": "<1-2 sentences: WHY this specific activity lands at this tier, citing evidence from the description. Do NOT repeat generic tier definitions or percentiles — focus on what THIS student did.>",
  "comparisonBenchmarks": {
    "similarTo": "<specific example of similar-tier activity with context>",
    "above": "<specific example of what would be higher tier>",
    "below": "<specific example of what would be lower tier>"
  },
  "improvementPaths": ["<specific, actionable path to elevate score>"],
  "overallRationale": "<2-3 sentence INSIGHTFUL summary, not just repeating scores>"
}

REMEMBER: Be rigorous, specific, and educational. Provide insights the student wouldn't know. Compare to real benchmarks. Never just summarize what they told you.`;

const buildActivityScoringPrompt = (input: ActivityScoringInput): string => {
  const parts: string[] = [];

  parts.push(`Evaluate this extracurricular activity:`);
  parts.push(`\nTITLE: ${input.title}`);

  if (input.type) parts.push(`TYPE: ${input.type}`);
  if (input.position) parts.push(`POSITION/ROLE: ${input.position}`);
  if (input.organization) parts.push(`ORGANIZATION: ${input.organization}`);

  parts.push(`\nDESCRIPTION: "${input.description}"`);

  if (input.grades && input.grades.length > 0) {
    parts.push(`\nGRADES PARTICIPATED: ${input.grades.join(', ')}`);
  }

  if (input.hoursPerWeek || input.weeksPerYear) {
    const timeInfo: string[] = [];
    if (input.hoursPerWeek) timeInfo.push(`${input.hoursPerWeek} hrs/week`);
    if (input.weeksPerYear) timeInfo.push(`${input.weeksPerYear} weeks/year`);
    parts.push(`TIME COMMITMENT: ${timeInfo.join(', ')}`);
  }

  if (input.honors) parts.push(`HONORS/AWARDS: ${input.honors}`);
  if (input.intendedMajor) parts.push(`\nSTUDENT'S INTENDED MAJOR: ${input.intendedMajor}`);

  // Inject pre-researched benchmarks for this activity category
  const benchmarks = formatBenchmarksForPrompt(input.title, input.type, input.description);
  if (benchmarks) {
    parts.push(benchmarks);
  }

  parts.push(`\nFirst, determine if Leadership & Impact component applies to this activity type.`);
  parts.push(`Then provide your scoring in the JSON format specified.`);
  parts.push(`Use the comparison benchmarks above to calibrate your scores and populate the comparisonBenchmarks fields.`);

  return parts.join('\n');
};

const buildBatchActivityScoringPrompt = (input: BatchActivityScoringInput): string => {
  const activitiesText = input.activities
    .map((activity, index) => {
      const parts: string[] = [];
      parts.push(`\n--- ACTIVITY ${index + 1} ---`);
      parts.push(`Title: ${activity.title}`);
      if (activity.type) parts.push(`Type: ${activity.type}`);
      if (activity.position) parts.push(`Position: ${activity.position}`);
      if (activity.organization) parts.push(`Organization: ${activity.organization}`);
      parts.push(`Description: "${activity.description}"`);
      if (activity.grades?.length) parts.push(`Grades: ${activity.grades.join(', ')}`);
      if (activity.hoursPerWeek) parts.push(`Hours/week: ${activity.hoursPerWeek}`);
      if (activity.weeksPerYear) parts.push(`Weeks/year: ${activity.weeksPerYear}`);
      if (activity.honors) parts.push(`Honors: ${activity.honors}`);
      return parts.join('\n');
    })
    .join('\n');

  let contextText = '';
  if (input.studentContext) {
    const contextParts: string[] = [];
    if (input.studentContext.intendedMajor) {
      contextParts.push(`Intended Major: ${input.studentContext.intendedMajor}`);
    }
    if (input.studentContext.schoolType) {
      contextParts.push(`School Type: ${input.studentContext.schoolType}`);
    }
    if (input.studentContext.contextualFactors?.length) {
      contextParts.push(`Context: ${input.studentContext.contextualFactors.join(', ')}`);
    }
    if (contextParts.length > 0) {
      contextText = `\n\nSTUDENT CONTEXT:\n${contextParts.join('\n')}`;
    }
  }

  // Inject pre-researched benchmarks for all activity categories in batch
  const batchBenchmarks = formatBatchBenchmarksForPrompt(
    input.activities.map(a => ({ title: a.title, type: a.type, description: a.description }))
  );

  return `Evaluate these ${input.activities.length} extracurricular activities:
${activitiesText}${contextText}
${batchBenchmarks}
For EACH activity:
1. Determine if Leadership & Impact applies (solo activities = NO)
2. Score each component 0-10 with INSIGHTFUL rationales
3. Apply appropriate weights based on leadership applicability
4. Use the comparison benchmarks above to calibrate scores and populate comparisonBenchmarks fields

SCORE SPREAD CALIBRATION (R2-5):
- Scores MUST spread across the full 1-10 range based on actual quality differences.
- If two activities are both Tier 3, they may still differ by 2-3 points based on recognition level and commitment depth.
- Do NOT cluster all scores around 5-6. A portfolio with genuine variation should have scores ranging across at least 4 points (e.g., 3 to 7, or 5 to 9).
- Each component score MUST be justified by the rubric criteria — not approximated from the overall impression.

Provide scores for ALL activities in this JSON format:
{
  "scores": [
    {
      "activityIndex": 1,
      "total": <1-10>,
      "breakdown": { ... full breakdown with weightConfig ... },
      "tierJustification": "...",
      "comparisonBenchmarks": { ... },
      "improvementPaths": [...],
      "overallRationale": "..."
    },
    ... (one for each activity)
  ]
}`;
};

// ============================================================================
// SERVICE
// ============================================================================

export class ActivityScoringService {
  /**
   * Score a single activity
   */
  async scoreActivity(input: ActivityScoringInput): Promise<ActivityScoringResult> {
    try {
      const response = await callClaude(
        buildActivityScoringPrompt(input),
        {
          model: 'claude-sonnet-4-5-20250929',
          systemPrompt: ACTIVITY_SCORING_SYSTEM_PROMPT,
          cacheSystemPrompt: true, // Enable Anthropic prompt caching
          temperature: 0.15, // Low temperature for scoring consistency
          maxTokens: 2000,
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      const parsed = this.parseScoreResponse(response.content);
      if (!parsed) {
        return {
          success: false,
          error: 'Failed to parse scoring response',
        };
      }

      return {
        success: true,
        score: parsed,
        tokensUsed: response.usage,
      };
    } catch (error) {
      console.error('[ActivityScoringService] Error scoring activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Score multiple activities in a single API call
   */
  async scoreActivitiesBatch(input: BatchActivityScoringInput): Promise<BatchActivityScoringResult> {
    if (input.activities.length === 0) {
      return { success: true, scores: [] };
    }

    if (input.activities.length === 1) {
      const result = await this.scoreActivity(input.activities[0]);
      return {
        success: result.success,
        scores: result.score ? [result.score] : undefined,
        error: result.error,
        tokensUsed: result.tokensUsed,
      };
    }

    try {
      // Scale maxTokens with activity count: ~2000 tokens per activity score output
      const batchMaxTokens = Math.min(16000, input.activities.length * 2500 + 1000);
      const response = await callClaude(
        buildBatchActivityScoringPrompt(input),
        {
          model: 'claude-sonnet-4-5-20250929',
          systemPrompt: ACTIVITY_SCORING_SYSTEM_PROMPT,
          cacheSystemPrompt: true, // Enable Anthropic prompt caching — 90% cost reduction on cache hits
          temperature: 0.15, // Low temperature for scoring consistency
          maxTokens: batchMaxTokens,
          timeoutMs: 240000, // 4 min — batch scoring 5+ activities with Sonnet 4.5 needs more time
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      const parsed = this.parseBatchScoreResponse(response.content, input.activities.length);
      if (!parsed) {
        return {
          success: false,
          error: 'Failed to parse batch scoring response',
        };
      }

      return {
        success: true,
        scores: parsed,
        tokensUsed: response.usage,
      };
    } catch (error) {
      console.error('[ActivityScoringService] Error scoring activities batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse single score response
   */
  private parseScoreResponse(content: string): ActivityScore | null {
    try {
      // R7: Use robust parseClaudeJSON with jsonrepair fallback
      const data = tryParseClaudeJSON<Record<string, unknown>>(content, 'ActivityScoringService');
      if (!data) return null;
      return this.normalizeScoreData(data);
    } catch (error) {
      console.error('[ActivityScoringService] Parse error:', error);
      return null;
    }
  }

  /**
   * Parse batch score response
   * Uses activityIndex from LLM output to correctly order results,
   * falling back to sequential order if activityIndex is missing.
   */
  parseBatchScoreResponse(content: string, expectedCount: number): ActivityScore[] | null {
    try {
      // R7: Use robust parseClaudeJSON with jsonrepair fallback
      const data = tryParseClaudeJSON<Record<string, unknown>>(content, 'ActivityScoringService.batch');
      if (!data) return null;

      if (!data.scores || !Array.isArray(data.scores)) {
        console.error('[ActivityScoringService] Invalid batch response structure');
        return null;
      }

      // Try to use activityIndex for correct ordering
      const hasActivityIndex = data.scores.every(
        (s: Record<string, unknown>) => typeof s?.activityIndex === 'number'
      );

      if (hasActivityIndex) {
        // Place scores by activityIndex (1-based from LLM)
        const scores: ActivityScore[] = new Array(expectedCount);
        for (const scoreData of data.scores as Record<string, unknown>[]) {
          const idx = (scoreData.activityIndex as number) - 1; // Convert to 0-based
          if (idx >= 0 && idx < expectedCount) {
            const normalized = this.normalizeScoreData(scoreData);
            if (normalized) {
              scores[idx] = normalized;
            }
          }
        }

        const filledCount = scores.filter(Boolean).length;
        if (filledCount !== expectedCount) {
          console.warn(`[ActivityScoringService] Expected ${expectedCount} scores, got ${filledCount} (by activityIndex)`);
        }

        return scores;
      }

      // Fallback: sequential ordering
      const scores: ActivityScore[] = new Array(expectedCount);
      let placed = 0;
      for (const scoreData of data.scores) {
        if (placed >= expectedCount) break;
        const normalized = this.normalizeScoreData(scoreData);
        if (normalized) {
          scores[placed] = normalized;
          placed++;
        }
      }

      if (placed !== expectedCount) {
        console.warn(`[ActivityScoringService] Expected ${expectedCount} scores, got ${placed}`);
      }

      return scores;
    } catch (error) {
      console.error('[ActivityScoringService] Batch parse error:', error);
      return null;
    }
  }

  /**
   * Normalize and validate score data
   */
  private normalizeScoreData(data: unknown): ActivityScore | null {
    if (!data || typeof data !== 'object') return null;

    const d = data as Record<string, unknown>;
    if (!d.breakdown) return null;

    const breakdown = d.breakdown as Record<string, unknown>;

    // Determine if leadership is applicable
    const leadershipData = breakdown.leadershipImpact as Record<string, unknown> | undefined;
    const leadershipApplicable = leadershipData?.isApplicable !== false;

    // Get weight config
    const weights = leadershipApplicable ? STANDARD_WEIGHTS : NO_LEADERSHIP_WEIGHTS;

    // Normalize tier assessment
    const normalizeTier = (comp: unknown): TierAssessmentComponent => {
      if (!comp || typeof comp !== 'object') {
        return {
          score: 0,
          maxScore: 10,
          weight: weights.tier,
          weightedScore: 0,
          tier: 4,
          rationale: 'Unable to assess',
        };
      }
      const c = comp as Record<string, unknown>;
      const score = Math.min(10, Math.max(0, Number(c.score) || 0));
      return {
        score,
        maxScore: 10,
        weight: weights.tier,
        weightedScore: Number((score * weights.tier).toFixed(2)),
        tier: ([1, 2, 3, 4].includes(Number(c.tier)) ? Number(c.tier) : 4) as 1 | 2 | 3 | 4,
        rationale: String(c.rationale || 'No rationale'),
      };
    };

    // Normalize recognition
    const normalizeRecognition = (comp: unknown): RecognitionComponent => {
      const validLevels = ['international', 'national', 'state', 'regional', 'school', 'local', 'none'] as const;
      if (!comp || typeof comp !== 'object') {
        return {
          score: 0,
          maxScore: 10,
          weight: weights.recognition,
          weightedScore: 0,
          level: 'none',
          rationale: 'Unable to assess',
        };
      }
      const c = comp as Record<string, unknown>;
      const level = validLevels.includes(c.level as typeof validLevels[number])
        ? (c.level as typeof validLevels[number])
        : 'none';
      const score = Math.min(10, Math.max(0, Number(c.score) || 0));
      return {
        score,
        maxScore: 10,
        weight: weights.recognition,
        weightedScore: Number((score * weights.recognition).toFixed(2)),
        level,
        rationale: String(c.rationale || 'No rationale'),
      };
    };

    // Normalize leadership
    const normalizeLeadership = (comp: unknown): LeadershipComponent => {
      const validRoles = ['founder', 'president_captain', 'executive', 'team_lead', 'contributor', 'participant', 'member', 'not_applicable'] as const;
      const validScopes = ['national', 'regional', 'community', 'organization', 'team', 'individual', 'not_applicable'] as const;
      if (!comp || typeof comp !== 'object') {
        return {
          score: 0,
          maxScore: 10,
          weight: weights.leadership,
          weightedScore: 0,
          isApplicable: leadershipApplicable,
          role: leadershipApplicable ? 'member' : 'not_applicable',
          impactScope: leadershipApplicable ? 'individual' : 'not_applicable',
          rationale: 'Unable to assess',
        };
      }
      const c = comp as Record<string, unknown>;
      const isApplicable = c.isApplicable !== false;
      const role = validRoles.includes(c.role as typeof validRoles[number])
        ? (c.role as typeof validRoles[number])
        : (isApplicable ? 'member' : 'not_applicable');
      const impactScope = validScopes.includes(c.impactScope as typeof validScopes[number])
        ? (c.impactScope as typeof validScopes[number])
        : (isApplicable ? 'individual' : 'not_applicable');
      const score = isApplicable ? Math.min(10, Math.max(0, Number(c.score) || 0)) : 0;
      const actualWeight = isApplicable ? weights.leadership : 0;
      return {
        score,
        maxScore: 10,
        weight: actualWeight,
        weightedScore: Number((score * actualWeight).toFixed(2)),
        isApplicable,
        role,
        impactScope,
        rationale: String(c.rationale || 'No rationale'),
      };
    };

    // Normalize community & character
    const normalizeCommunityCharacter = (comp: unknown): CommunityCharacterComponent => {
      const validTraits = ['service', 'innovation', 'resilience', 'curiosity', 'empathy', 'discipline', 'creativity', 'integrity'] as const;
      const validBenefits = ['significant', 'moderate', 'minimal', 'self-focused'] as const;
      const validSignals = ['highly_authentic', 'genuine', 'neutral', 'resume_padding'] as const;

      if (!comp || typeof comp !== 'object') {
        return {
          score: 5,
          maxScore: 10,
          weight: weights.community,
          weightedScore: Number((5 * weights.community).toFixed(2)),
          primaryTrait: 'discipline',
          communityBenefit: 'minimal',
          authenticitySignal: 'neutral',
          rationale: 'Unable to assess',
        };
      }
      const c = comp as Record<string, unknown>;
      const score = Math.min(10, Math.max(0, Number(c.score) || 5));
      const primaryTrait = validTraits.includes(c.primaryTrait as typeof validTraits[number])
        ? (c.primaryTrait as typeof validTraits[number])
        : 'discipline';
      const communityBenefit = validBenefits.includes(c.communityBenefit as typeof validBenefits[number])
        ? (c.communityBenefit as typeof validBenefits[number])
        : 'minimal';
      const authenticitySignal = validSignals.includes(c.authenticitySignal as typeof validSignals[number])
        ? (c.authenticitySignal as typeof validSignals[number])
        : 'neutral';
      return {
        score,
        maxScore: 10,
        weight: weights.community,
        weightedScore: Number((score * weights.community).toFixed(2)),
        primaryTrait,
        communityBenefit,
        authenticitySignal,
        rationale: String(c.rationale || 'No rationale'),
      };
    };

    // Normalize commitment
    const normalizeCommitment = (comp: unknown): CommitmentComponent => {
      if (!comp || typeof comp !== 'object') {
        return {
          score: 0,
          maxScore: 10,
          weight: weights.commitment,
          weightedScore: 0,
          years: 0,
          showsProgression: false,
          sustainedThroughJunior: false,
          rationale: 'Unable to assess',
        };
      }
      const c = comp as Record<string, unknown>;
      const score = Math.min(10, Math.max(0, Number(c.score) || 0));
      return {
        score,
        maxScore: 10,
        weight: weights.commitment,
        weightedScore: Number((score * weights.commitment).toFixed(2)),
        years: Math.max(0, Number(c.years) || 0),
        showsProgression: Boolean(c.showsProgression),
        sustainedThroughJunior: Boolean(c.sustainedThroughJunior),
        rationale: String(c.rationale || 'No rationale'),
      };
    };

    // Build normalized breakdown
    const normalizedBreakdown: ActivityScoreBreakdown = {
      tierAssessment: normalizeTier(breakdown.tierAssessment),
      recognitionLevel: normalizeRecognition(breakdown.recognitionLevel),
      leadershipImpact: normalizeLeadership(breakdown.leadershipImpact),
      communityCharacter: normalizeCommunityCharacter(breakdown.communityCharacter),
      commitmentProgression: normalizeCommitment(breakdown.commitmentProgression),
      weightConfig: {
        tierWeight: weights.tier,
        recognitionWeight: weights.recognition,
        leadershipWeight: weights.leadership,
        communityWeight: weights.community,
        commitmentWeight: weights.commitment,
        leadershipApplicable,
      },
    };

    // Calculate total from weighted component scores
    const calculatedTotal =
      normalizedBreakdown.tierAssessment.weightedScore +
      normalizedBreakdown.recognitionLevel.weightedScore +
      normalizedBreakdown.leadershipImpact.weightedScore +
      normalizedBreakdown.communityCharacter.weightedScore +
      normalizedBreakdown.commitmentProgression.weightedScore;

    // Round to 1 decimal place
    const total = Math.round(calculatedTotal * 10) / 10;

    // Normalize comparison benchmarks
    const benchmarks = d.comparisonBenchmarks as Record<string, unknown> | undefined;
    const comparisonBenchmarks: ComparisonBenchmarks = {
      similarTo: benchmarks?.similarTo ? String(benchmarks.similarTo) : 'Similar-tier activity',
      above: benchmarks?.above ? String(benchmarks.above) : 'Higher-tier activity',
      below: benchmarks?.below ? String(benchmarks.below) : 'Lower-tier activity',
    };

    return {
      total: Math.min(10, Math.max(1, total)),
      breakdown: normalizedBreakdown,
      tierJustification: String(d.tierJustification || ''),
      comparisonBenchmarks,
      improvementPaths: Array.isArray(d.improvementPaths) ? d.improvementPaths.map(String) : [],
      overallRationale: String(d.overallRationale || this.generateRationale(total)),
    };
  }

  /**
   * Generate fallback rationale
   */
  private generateRationale(score: number): string {
    const levelKey = Math.min(10, Math.max(1, Math.round(score))) as keyof typeof ACTIVITY_SCORE_LEVELS;
    return `This activity scores ${score}/10. ${ACTIVITY_SCORE_LEVELS[levelKey] || 'See component breakdowns for details.'}`;
  }

  /**
   * Get score level description
   */
  getScoreLevelDescription(score: number): string {
    const levelKey = Math.min(10, Math.max(1, Math.round(score))) as keyof typeof ACTIVITY_SCORE_LEVELS;
    return ACTIVITY_SCORE_LEVELS[levelKey] || 'Unknown';
  }

  /**
   * Format score for display with weights shown
   */
  formatScoreDisplay(breakdown: ActivityScoreBreakdown): string {
    const lines: string[] = [];

    lines.push(`Tier Assessment: ${breakdown.tierAssessment.score}/10 (×${(breakdown.tierAssessment.weight * 100).toFixed(0)}% = ${breakdown.tierAssessment.weightedScore.toFixed(1)})`);
    lines.push(`Recognition Level: ${breakdown.recognitionLevel.score}/10 (×${(breakdown.recognitionLevel.weight * 100).toFixed(0)}% = ${breakdown.recognitionLevel.weightedScore.toFixed(1)})`);

    if (breakdown.weightConfig.leadershipApplicable) {
      lines.push(`Leadership & Impact: ${breakdown.leadershipImpact.score}/10 (×${(breakdown.leadershipImpact.weight * 100).toFixed(0)}% = ${breakdown.leadershipImpact.weightedScore.toFixed(1)})`);
    } else {
      lines.push(`Leadership & Impact: N/A (solo activity - weight redistributed)`);
    }

    lines.push(`Community & Character: ${breakdown.communityCharacter.score}/10 (×${(breakdown.communityCharacter.weight * 100).toFixed(0)}% = ${breakdown.communityCharacter.weightedScore.toFixed(1)})`);
    lines.push(`Commitment & Progression: ${breakdown.commitmentProgression.score}/10 (×${(breakdown.commitmentProgression.weight * 100).toFixed(0)}% = ${breakdown.commitmentProgression.weightedScore.toFixed(1)})`);

    const total =
      breakdown.tierAssessment.weightedScore +
      breakdown.recognitionLevel.weightedScore +
      breakdown.leadershipImpact.weightedScore +
      breakdown.communityCharacter.weightedScore +
      breakdown.commitmentProgression.weightedScore;

    lines.push(`───────────────────────────`);
    lines.push(`TOTAL: ${total.toFixed(1)}/10`);

    return lines.join('\n');
  }
}

// Export singleton
export const activityScoringService = new ActivityScoringService();
