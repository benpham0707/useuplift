/**
 * Portfolio Scoring Service (DIAGNOSTIC LAYER)
 *
 * LLM-powered DIAGNOSTIC analysis of the entire extracurriculars section.
 * This is the "doctor" layer — it identifies WHERE THE STUDENT STANDS.
 * The Teaching Layer (separate service) provides the PRESCRIPTION (how to improve).
 *
 * ARCHITECTURE: Two-Stage Analysis
 * 1. Portfolio Scoring (this service) → DIAGNOSIS: Scores, observations, positioning
 * 2. Teaching Layer (separate) → PRESCRIPTION: Actions, rewrites, timeline
 *
 * SCORING COMPONENTS (each 1-10, weighted average):
 * 1. Tier Distribution (25%) - Quality distribution across tiers
 * 2. Spike Detection (25%) - Presence and strength of focused depth
 * 3. Coherence (20%) - Do activities tell a unified story?
 * 4. Major Alignment (15%) - How well activities support intended major
 * 5. Presentation Quality (15%) - Average description quality
 *
 * Also provides:
 * - Harvard 1-6 scale equivalent
 * - Portfolio narrative assessment
 * - Competitive context analysis
 * - Diagnostic observations (not prescriptive actions — teaching layer handles those)
 *
 * IMPORTANT: Uses second person ("you/your") throughout. Speaks directly to the student.
 *
 * COST: ~$0.03 (Sonnet for nuanced, thoughtful holistic assessment)
 */

import { callClaude } from '@/lib/llm/claude';
// R7: Use robust parseClaudeJSON with jsonrepair fallback
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import {
  PortfolioScoreRubric,
  PortfolioScoreBreakdown,
  PortfolioScoreComponent,
  HarvardScaleAssessment,
  PortfolioNarrative,
  CompetitiveContext,
  ActivityScoreRubric,
  PORTFOLIO_SCORE_LEVELS,
  HARVARD_SCALE_DEFINITIONS,
} from './types';
import { ActivityScore } from './types';
import { DescriptionScore } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityWithScores {
  id: string;
  title: string;
  type?: string;
  position?: string;
  description: string;
  descriptionScore: DescriptionScore;
  activityScore: ActivityScore;
}

export interface PortfolioScoringInput {
  /** All activities with their individual scores */
  activities: ActivityWithScores[];
  /** Student context */
  studentContext: {
    intendedMajor?: string;
    schoolType?: string;
    gradeLevel?: number;
    contextualFactors?: string[];
  };
}

export interface PortfolioScoringResult {
  success: boolean;
  rubric?: PortfolioScoreRubric;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ============================================================================
// PROMPTS
// ============================================================================

const PORTFOLIO_SCORING_SYSTEM_PROMPT = `You are an expert college admissions officer evaluating a complete extracurricular portfolio.

Your task is to provide a holistic DIAGNOSTIC assessment of the entire activities section. You are the "doctor" giving a diagnosis — identifying where the student stands, what's strong, and what needs attention. The "prescription" (specific improvement actions) comes later in a separate teaching layer, so focus purely on ANALYSIS here.

IMPORTANT: Use second person ("you/your") throughout. Speak directly to the student.

## SCORING RUBRIC (5 components, each scored 1-10):

### 1. TIER DISTRIBUTION (Weight: 25%)
How are activities distributed across quality tiers?

- 10: Multiple Tier 1 activities (national/international distinction)
- 8-9: One Tier 1 + strong Tier 2s
- 6-7: Strong Tier 2s with emerging Tier 1
- 4-5: Mostly Tier 3 (school-level)
- 2-3: Mostly Tier 3/4 mix
- 1: All Tier 4 (participation without distinction)

### 2. SPIKE DETECTION (Weight: 25%)
Is there a clear area of exceptional depth?

- 10: Clear, mature spike with national/international recognition in one area
- 8-9: Developing spike with regional/state recognition
- 6-7: Emerging spike visible (2-3 related activities showing depth)
- 4-5: Hint of focus but not developed
- 2-3: Scattered, no clear focus area
- 1: Completely random, unrelated activities

**What constitutes a spike**:
- Multiple activities in related area (e.g., 3+ STEM activities for aspiring engineer)
- Progression in one area (member → leader → founder)
- Depth over breadth (better to be excellent at one thing than mediocre at five)

### 3. COHERENCE (Weight: 20%)
Do activities tell a unified story?

- 10: Perfect narrative thread connecting all activities (clear archetype emerges)
- 8-9: Strong theme with 1-2 outliers that don't detract
- 6-7: Theme visible but some disconnect
- 4-5: Weak connections, trying to "check boxes"
- 2-3: Random collection of unrelated activities
- 1: Contradictory activities (e.g., animal rights + hunting club)

**Coherence signals**:
- Activities reinforce each other
- Can summarize in two sentences
- Clear archetype (innovator, leader, scholar, artist, community builder)

### 4. MAJOR ALIGNMENT (Weight: 15%)
How well do activities support the intended major?

- 10: Perfect alignment with competitive depth (e.g., published research for intended researcher)
- 8-9: Strong alignment with meaningful experience
- 6-7: Good alignment with gaps (has related activities but missing depth)
- 4-5: Partial alignment (one or two related activities)
- 2-3: Weak alignment (nothing directly related)
- 1: No alignment (activities contradict stated interest)

**Note**: If no intended major specified, assess general intellectual consistency.

### 5. PRESENTATION QUALITY (Weight: 15%)
Average quality of descriptions (derived from individual scores)

- Score = Average of all description scores

## HARVARD 1-6 SCALE MAPPING

Translate portfolio score to Harvard's extracurricular rating:

- **1 (Exceptional)**: Score 9-10. National/international distinction, recruited athlete level, published research, professional accomplishment. Top 1% of applicants.
- **2 (Outstanding)**: Score 7.5-8.9. State champion, significant regional impact, clear spike with recognition. Top 5% of applicants.
- **3 (Good)**: Score 6-7.4. School leader, meaningful local impact, developing focus. Top 15% of applicants.
- **4 (Average)**: Score 4-5.9. Solid participation, multiple activities but no distinction. Top 40% of applicants.
- **5 (Below Average)**: Score 2.5-3.9. Limited engagement, scattered activities, no clear impact.
- **6 (Weak)**: Score 1-2.4. Minimal meaningful activity, possible padding.

## OUTPUT FORMAT (JSON):

Remember: Use second person ("you/your") throughout. This is diagnostic analysis, not prescriptive actions.

{
  "overallScore": {
    "total": <1-10>,
    "confidence": <0.0-1.0>,
    "formula": "tierDistribution×0.25 + spikeDetection×0.25 + coherence×0.20 + majorAlignment×0.15 + presentationQuality×0.15",
    "rationale": "<2-3 sentences explaining where you stand overall — use 'you/your'>"
  },
  "harvardScale": {
    "rating": <1-6>,
    "description": "<what this rating means>",
    "rationale": "<why you received this rating — speak to the student>"
  },
  "breakdown": {
    "tierDistribution": {
      "score": <1-10>,
      "maxScore": 10,
      "rationale": "<analysis of your tier distribution — what it shows about your activities>"
    },
    "spikeDetection": {
      "score": <1-10>,
      "maxScore": 10,
      "rationale": "<analysis of your spike presence and strength — do you have one, how developed is it>"
    },
    "coherence": {
      "score": <1-10>,
      "maxScore": 10,
      "rationale": "<analysis of your narrative coherence — how well your activities tell a unified story>"
    },
    "majorAlignment": {
      "score": <1-10>,
      "maxScore": 10,
      "rationale": "<analysis of alignment with your intended major>"
    },
    "presentationQuality": {
      "score": <1-10>,
      "maxScore": 10,
      "rationale": "<analysis of your description quality>"
    }
  },
  "narrative": {
    "archetype": "<innovator|leader|scholar|artist|athlete|community_builder|mixed>",
    "storyLine": "<2-3 sentence story your portfolio tells — 'Your activities show...' or 'You come across as...'>",
    "twoSentencePitch": "<how an admissions officer would describe you to the committee>",
    "differentiators": ["<what makes you unique>"],
    "commonalities": ["<what's expected/common given your profile>"]
  },
  "competitiveContext": {
    "assessment": "<where you stand competitively — direct assessment>",
    "targetSchoolFit": "<how well your activities position you for competitive schools>",
    "differentiators": ["<what sets you apart from similar applicants>"],
    "commonalities": ["<what you share with typical applicants — not necessarily bad>"],
    "competitiveGaps": ["<DIAGNOSTIC: areas where similar successful applicants often have more strength — identify, don't prescribe>"]
  },
  "keyStrengths": ["<your top 3 portfolio strengths — what's working well>"],
  "keyGaps": ["<top 3 areas needing attention — diagnostic observations, not action items>"],
  "prioritizedRecommendations": [
    {
      "priority": 1,
      "focus": "<area needing most attention — e.g., 'Your spike depth', 'Your description craft'>",
      "observation": "<what the diagnosis shows — e.g., 'Your research activity could anchor a stronger spike'>",
      "impact": "<why this matters for your application>"
    },
    {
      "priority": 2,
      "focus": "...",
      "observation": "...",
      "impact": "..."
    },
    {
      "priority": 3,
      "focus": "...",
      "observation": "...",
      "impact": "..."
    }
  ]
}

## DIAGNOSTIC PHILOSOPHY: IDENTIFY WHERE YOU STAND

Your role is DIAGNOSIS, not prescription. Identify:
- What's working well in the student's portfolio
- What areas need attention
- How they compare to competitive applicants

The prioritizedRecommendations are OBSERVATIONS about where attention should focus, not action plans. Structure them as:

1. **IDENTIFY SPIKE POTENTIAL** — Where is the strongest foundation for a spike? What activity could anchor their narrative if developed further?

2. **IDENTIFY DESCRIPTION GAPS** — Which activities have the biggest gap between the activity itself and how it's presented? Where is description craft holding back strong activities?

3. **IDENTIFY NARRATIVE DISCONNECTION** — Which activities feel disconnected from the overall story? Which ones are hardest for an admissions officer to connect to the student's focus?

Remember: Every activity has value. Your job is to diagnose the current state, not prescribe removal or minimization. The teaching layer will provide specific actions based on your diagnosis.

Use second person throughout. Speak directly to the student as "you."`;

// NOTE: The philosophy has changed from prescriptive (telling students what to do)
// to diagnostic (identifying where they stand). The teaching layer now handles
// the prescriptive "how to improve" content, while scoring focuses on "where you are."

const buildPortfolioScoringPrompt = (input: PortfolioScoringInput): string => {
  const activitiesText = input.activities
    .map((activity, index) => {
      const combinedScore =
        activity.activityScore.total * 0.7 + activity.descriptionScore.total * 0.3;
      const tier = activity.activityScore.breakdown.tierAssessment.tier;

      return `
ACTIVITY ${index + 1}: ${activity.title}${activity.type ? ` (${activity.type})` : ''}
Position: ${activity.position || 'Not specified'}
Description: "${activity.description}"
Tier: ${tier}
Activity Score: ${activity.activityScore.total}/10 - ${activity.activityScore.breakdown.tierAssessment.rationale}
Description Score: ${activity.descriptionScore.total}/10
Combined Score: ${combinedScore.toFixed(1)}/10`;
    })
    .join('\n');

  const contextParts: string[] = [];
  if (input.studentContext.intendedMajor) {
    contextParts.push(`Intended Major: ${input.studentContext.intendedMajor}`);
  }
  if (input.studentContext.schoolType) {
    contextParts.push(`School Type: ${input.studentContext.schoolType}`);
  }
  if (input.studentContext.gradeLevel) {
    contextParts.push(`Current Grade: ${input.studentContext.gradeLevel}`);
  }
  if (input.studentContext.contextualFactors?.length) {
    contextParts.push(`Context: ${input.studentContext.contextualFactors.join(', ')}`);
  }

  const contextText =
    contextParts.length > 0 ? `\nSTUDENT CONTEXT:\n${contextParts.join('\n')}` : '';

  // Calculate average description score for reference
  const avgDescScore =
    input.activities.length > 0
      ? input.activities.reduce((sum, a) => sum + a.descriptionScore.total, 0) /
        input.activities.length
      : 0;

  return `Evaluate this complete extracurricular portfolio:

PORTFOLIO SUMMARY:
- Total Activities: ${input.activities.length}
- Average Description Score: ${avgDescScore.toFixed(1)}/10
${contextText}

ACTIVITIES:
${activitiesText}

Provide your holistic portfolio assessment in the JSON format specified.`;
};

// ============================================================================
// SERVICE
// ============================================================================

export class PortfolioScoringService {
  /**
   * Score a complete portfolio
   */
  async scorePortfolio(input: PortfolioScoringInput): Promise<PortfolioScoringResult> {
    if (input.activities.length === 0) {
      return {
        success: false,
        error: 'No activities to score',
      };
    }

    try {
      const response = await callClaude(
        buildPortfolioScoringPrompt(input),
        {
          model: 'claude-sonnet-4-5-20250929',
          systemPrompt: PORTFOLIO_SCORING_SYSTEM_PROMPT,
          temperature: 0.3,
          maxTokens: 3000,
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      const parsed = this.parsePortfolioResponse(response.content, input);
      if (!parsed) {
        return {
          success: false,
          error: 'Failed to parse portfolio scoring response',
        };
      }

      return {
        success: true,
        rubric: parsed,
        tokensUsed: response.usage,
      };
    } catch (error) {
      console.error('[PortfolioScoringService] Error scoring portfolio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse portfolio response
   */
  private parsePortfolioResponse(
    content: string,
    input: PortfolioScoringInput
  ): PortfolioScoreRubric | null {
    try {
      // R7: Use robust parseClaudeJSON with jsonrepair fallback
      const data = tryParseClaudeJSON<Record<string, unknown>>(content, 'PortfolioScoringService');
      if (!data) return null;

      return this.normalizePortfolioData(data, input);
    } catch (error) {
      console.error('[PortfolioScoringService] Parse error:', error);
      return null;
    }
  }

  /**
   * Normalize and validate portfolio data
   */
  private normalizePortfolioData(
    data: unknown,
    input: PortfolioScoringInput
  ): PortfolioScoreRubric | null {
    if (!data || typeof data !== 'object') return null;

    const d = data as Record<string, unknown>;

    // Normalize overall score
    const overallData = d.overallScore as Record<string, unknown> | undefined;
    const overallScore = {
      total: Math.min(10, Math.max(1, Number(overallData?.total) || 5)),
      confidence: Math.min(1, Math.max(0, Number(overallData?.confidence) || 0.7)),
      formula: String(
        overallData?.formula ||
          'tierDistribution×0.25 + spikeDetection×0.25 + coherence×0.20 + majorAlignment×0.15 + presentationQuality×0.15'
      ),
      rationale: String(overallData?.rationale || 'See component breakdowns.'),
    };

    // Normalize Harvard scale
    const harvardData = d.harvardScale as Record<string, unknown> | undefined;
    const harvardRating = Math.min(6, Math.max(1, Number(harvardData?.rating) || 4)) as 1 | 2 | 3 | 4 | 5 | 6;
    const harvardScale: HarvardScaleAssessment = {
      rating: harvardRating,
      description: String(
        harvardData?.description || HARVARD_SCALE_DEFINITIONS[harvardRating]
      ),
      rationale: String(harvardData?.rationale || ''),
    };

    // Normalize breakdown
    const breakdownData = d.breakdown as Record<string, unknown> | undefined;
    const normalizeComponent = (
      comp: unknown,
      defaultRationale: string
    ): PortfolioScoreComponent => {
      if (!comp || typeof comp !== 'object') {
        return { score: 5, maxScore: 10, rationale: defaultRationale };
      }
      const c = comp as Record<string, unknown>;
      return {
        score: Math.min(10, Math.max(1, Number(c.score) || 5)),
        maxScore: 10,
        rationale: String(c.rationale || defaultRationale),
      };
    };

    // Calculate presentation quality from actual description scores
    const avgDescScore =
      input.activities.length > 0
        ? input.activities.reduce((sum, a) => sum + a.descriptionScore.total, 0) /
          input.activities.length
        : 5;

    const breakdown: PortfolioScoreBreakdown = {
      tierDistribution: normalizeComponent(
        breakdownData?.tierDistribution,
        'Tier distribution analysis'
      ),
      spikeDetection: normalizeComponent(
        breakdownData?.spikeDetection,
        'Spike detection analysis'
      ),
      coherence: normalizeComponent(breakdownData?.coherence, 'Coherence analysis'),
      majorAlignment: normalizeComponent(
        breakdownData?.majorAlignment,
        'Major alignment analysis'
      ),
      presentationQuality: {
        score: Math.round(avgDescScore),
        maxScore: 10,
        rationale: String(
          (breakdownData?.presentationQuality as Record<string, unknown>)?.rationale ||
            `Average description quality: ${avgDescScore.toFixed(1)}/10`
        ),
      },
    };

    // Normalize narrative
    const narrativeData = d.narrative as Record<string, unknown> | undefined;
    const narrative: PortfolioNarrative = {
      archetype: String(narrativeData?.archetype || 'mixed'),
      storyLine: String(narrativeData?.storyLine || 'Portfolio story not analyzed'),
      twoSentencePitch: String(narrativeData?.twoSentencePitch || ''),
      differentiators: Array.isArray(narrativeData?.differentiators)
        ? narrativeData.differentiators.map(String)
        : [],
      commonalities: Array.isArray(narrativeData?.commonalities)
        ? narrativeData.commonalities.map(String)
        : [],
    };

    // Normalize competitive context
    const contextData = d.competitiveContext as Record<string, unknown> | undefined;
    const competitiveContext: CompetitiveContext = {
      assessment: String(contextData?.assessment || ''),
      targetSchoolFit: String(contextData?.targetSchoolFit || ''),
      differentiators: Array.isArray(contextData?.differentiators)
        ? contextData.differentiators.map(String)
        : [],
      commonalities: Array.isArray(contextData?.commonalities)
        ? contextData.commonalities.map(String)
        : [],
      competitiveGaps: Array.isArray(contextData?.competitiveGaps)
        ? contextData.competitiveGaps.map(String)
        : [],
    };

    // Normalize recommendations (now diagnostic observations, not prescriptive actions)
    const recsData = d.prioritizedRecommendations as unknown[] | undefined;
    const prioritizedRecommendations = Array.isArray(recsData)
      ? recsData.slice(0, 5).map((rec, i) => {
          const r = rec as Record<string, unknown>;
          // Support both old format (recommendation/effort) and new format (focus/observation)
          const focus = String(r.focus || r.recommendation || '');
          const observation = String(r.observation || r.recommendation || '');
          const impact = String(r.impact || '');
          // Old format compatibility: convert effort to new format
          const effortValue = String(r.effort || 'medium').toLowerCase();
          const effort = ['low', 'medium', 'high'].includes(effortValue)
            ? (effortValue as 'low' | 'medium' | 'high')
            : 'medium';
          return {
            priority: Math.min(3, Math.max(1, Number(r.priority) || (i + 1))) as 1 | 2 | 3,
            // Store in both old and new formats for compatibility
            recommendation: observation || focus,
            focus,
            observation,
            impact,
            effort,
          };
        })
      : [];

    // Build activity score rubrics
    const activityScores: ActivityScoreRubric[] = input.activities.map((activity) => {
      const combinedScore =
        activity.activityScore.total * 0.7 + activity.descriptionScore.total * 0.3;
      return {
        activityId: activity.id,
        activityTitle: activity.title,
        descriptionScore: activity.descriptionScore,
        activityScore: activity.activityScore,
        combinedScore: {
          total: Math.round(combinedScore * 10) / 10,
          formula: 'activityScore × 0.7 + descriptionScore × 0.3',
          rationale: `Activity quality (${activity.activityScore.total}/10) weighted 70%, description quality (${activity.descriptionScore.total}/10) weighted 30%.`,
        },
        summary: {
          oneLiner: activity.activityScore.overallRationale.split('.')[0] + '.',
          topStrength:
            activity.descriptionScore.strengths[0] ||
            activity.activityScore.improvementPaths[0] ||
            'Good effort',
          topImprovement:
            activity.descriptionScore.improvements[0] ||
            activity.activityScore.improvementPaths[0] ||
            'Continue developing',
        },
      };
    });

    // Calculate averages for metadata
    const avgActivityScore =
      input.activities.length > 0
        ? input.activities.reduce((sum, a) => sum + a.activityScore.total, 0) /
          input.activities.length
        : 0;

    return {
      overallScore,
      harvardScale,
      breakdown,
      narrative,
      competitiveContext,
      keyStrengths: Array.isArray(d.keyStrengths) ? d.keyStrengths.map(String) : [],
      keyGaps: Array.isArray(d.keyGaps) ? d.keyGaps.map(String) : [],
      prioritizedRecommendations,
      activityScores,
      metadata: {
        scoredAt: new Date().toISOString(),
        modelUsed: 'claude-sonnet-4-5-20250929',
        totalActivities: input.activities.length,
        averageDescriptionScore: Math.round(avgDescScore * 10) / 10,
        averageActivityScore: Math.round(avgActivityScore * 10) / 10,
      },
    };
  }

  /**
   * Get portfolio score level description
   */
  getScoreLevelDescription(score: number): string {
    const levelKey = Math.min(10, Math.max(1, Math.round(score))) as keyof typeof PORTFOLIO_SCORE_LEVELS;
    return PORTFOLIO_SCORE_LEVELS[levelKey] || 'Unknown';
  }

  /**
   * Get Harvard scale description
   */
  getHarvardScaleDescription(rating: 1 | 2 | 3 | 4 | 5 | 6): string {
    return HARVARD_SCALE_DEFINITIONS[rating];
  }
}

// Export singleton
export const portfolioScoringService = new PortfolioScoringService();
