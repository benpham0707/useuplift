// @ts-nocheck
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
 * - Competitive positioning tier (descriptive label, not numeric rating)
 * - Portfolio narrative assessment
 * - Competitive context analysis
 * - Diagnostic observations (not prescriptive actions — teaching layer handles those)
 *
 * PRESENTATION NOTE: The competitive tier is presented as a QUALITATIVE LABEL
 * (e.g., "Outstanding - Top 5%") derived from the 1-10 score, NOT as a separate
 * numeric rating (e.g., "2/6"). The 1-10 portfolio score is the primary metric.
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
  getTierName,
} from './types';
import { ActivityScore } from './types';
import { DescriptionScore } from './types';

/**
 * Extract the first sentence from a string without splitting on decimal numbers.
 *
 * The naive `.split('.')[0]` approach breaks when the text contains decimal
 * scores like "6.5/10" — it truncates at the decimal point instead of the
 * actual sentence boundary. This function uses a regex that matches a period
 * followed by a space and an uppercase letter (or end-of-string), which
 * correctly skips decimal points embedded in numbers.
 */
function extractFirstSentence(text: string): string {
  if (!text) return '';
  // Match a period that is followed by whitespace + uppercase letter,
  // whitespace + end-of-string, or is the very last character.
  // This avoids splitting on decimal numbers like "6.5" or "7.2".
  const match = text.match(/^(.*?\.)(?:\s+[A-Z]|\s*$)/);
  if (match) {
    return match[1];
  }
  // Fallback: if no sentence boundary found, return the full text
  return text;
}

/**
 * Build a one-liner summary for an activity using the CORRECT tier and score.
 *
 * Previously this used `overallRationale.split('.')[0]` which had two bugs:
 * 1. Truncation at decimal points in scores (e.g., "score 6.5/10" became "score 6.")
 * 2. LLM-generated tier labels could be incorrect (e.g., claiming "Tier 3" for a Tier 2 activity)
 *
 * This function extracts the first sentence properly and validates the tier label
 * against the authoritative tier from the scoring breakdown.
 */
function buildActivityOneLiner(activity: ActivityWithScores, combinedScore: number): string {
  const rationale = activity.activityScore.overallRationale;
  const correctTier = activity.activityScore.breakdown.tierAssessment.tier;
  const correctTierName = getTierName(correctTier);
  const roundedScore = Math.round(combinedScore * 10) / 10;

  // Extract the first full sentence without breaking on decimal numbers
  let firstSentence = extractFirstSentence(rationale);

  // Fix incorrect tier labels in the LLM-generated text.
  // The LLM sometimes assigns the wrong tier number in its natural language.
  // Replace any "Tier N" reference with the correct tier from the scoring breakdown.
  firstSentence = firstSentence.replace(
    /Tier\s+[1-4]/gi,
    `Tier ${correctTier}`
  );

  // If the rationale is empty or just a score stub, build a clean one-liner
  if (!firstSentence || firstSentence.length < 15) {
    return `Tier ${correctTier} — ${correctTierName} (${roundedScore}/10).`;
  }

  return firstSentence;
}

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
  /**
   * Previous portfolio score from a prior run in the same session.
   * Used as a calibration anchor — the AI sees what it scored previously
   * and only adjusts for material changes, reducing run-to-run variance.
   */
  previousScore?: {
    total: number;
    breakdown: {
      tierDistribution: number;
      spikeDetection: number;
      coherence: number;
      majorAlignment: number;
      presentationQuality: number;
    };
    competitiveTier: string;
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

## COMPETITIVE POSITIONING TIER

Based on the portfolio score (1-10), assess the student's competitive positioning tier:

- **Exceptional**: Score 9-10. National/international distinction, recruited athlete level, published research, professional accomplishment. Top 1% of applicants.
- **Outstanding**: Score 7.5-8.9. State champion, significant regional impact, clear spike with recognition. Top 5% of applicants.
- **Good**: Score 6-7.4. School leader, meaningful local impact, developing focus. Top 15% of applicants.
- **Average**: Score 4-5.9. Solid participation, multiple activities but no distinction. Top 40% of applicants.
- **Below Average**: Score 2.5-3.9. Limited engagement, scattered activities, no clear impact.
- **Weak**: Score 1-2.4. Minimal meaningful activity, possible padding.

## OUTPUT FORMAT (JSON):

Remember: Use second person ("you/your") throughout. This is diagnostic analysis, not prescriptive actions.

{
  "overallScore": {
    "total": <1-10>,
    "confidence": <0.0-1.0>,
    "formula": "tierDistribution×0.25 + spikeDetection×0.25 + coherence×0.20 + majorAlignment×0.15 + presentationQuality×0.15",
    "rationale": "<2-3 sentences explaining where you stand overall — use 'you/your'>"
  },
  "competitivePositioning": {
    "tier": "<Exceptional|Outstanding|Good|Average|Below Average|Weak>",
    "description": "<what this tier means — e.g., 'Top 5% of applicants with state-level recognition'>",
    "rationale": "<why you received this tier — speak to the student>"
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

  // Build previous score anchor if available (reduces run-to-run variance)
  let previousScoreContext = '';
  if (input.previousScore) {
    const ps = input.previousScore;
    previousScoreContext = `
PREVIOUS ASSESSMENT (from this student's prior submission):
- Overall Score: ${ps.total}/10
- Tier Distribution: ${ps.breakdown.tierDistribution}/10
- Spike Detection: ${ps.breakdown.spikeDetection}/10
- Coherence: ${ps.breakdown.coherence}/10
- Major Alignment: ${ps.breakdown.majorAlignment}/10
- Presentation Quality: ${ps.breakdown.presentationQuality}/10
- Competitive Tier: ${ps.competitiveTier}

SCORING CONSISTENCY INSTRUCTION: You previously scored this portfolio ${ps.total}/10. Review the current submission and determine if the portfolio has MATERIALLY changed. If the activities, descriptions, and overall composition are substantially the same, your score should be within ±0.3 of the previous score. Only deviate more if there are clear, specific improvements or regressions you can point to. Explain any score changes in your rationale.
`;
  }

  return `Evaluate this complete extracurricular portfolio:

PORTFOLIO SUMMARY:
- Total Activities: ${input.activities.length}
- Average Description Score: ${avgDescScore.toFixed(1)}/10
${contextText}
${previousScoreContext}
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
          cacheSystemPrompt: true, // Enable Anthropic prompt caching
          temperature: 0.15, // Low temperature for scoring consistency (reduced from 0.3)
          maxTokens: 3500, // Increased to ensure no truncation of competitive tier descriptions
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

    // Normalize competitive positioning (legacy: harvardScale)
    const positioningData = (d.competitivePositioning || d.harvardScale) as Record<string, unknown> | undefined;

    // Map tier string to Harvard rating for backward compatibility
    const tierToRating = (tier: string): 1 | 2 | 3 | 4 | 5 | 6 => {
      const lowerTier = tier.toLowerCase();
      if (lowerTier.includes('exceptional')) return 1;
      if (lowerTier.includes('outstanding')) return 2;
      if (lowerTier.includes('good')) return 3;
      if (lowerTier.includes('average') && !lowerTier.includes('below')) return 4;
      if (lowerTier.includes('below')) return 5;
      return 6;
    };

    // Support both new (tier string) and old (rating number) formats
    let harvardRating: 1 | 2 | 3 | 4 | 5 | 6;
    if (positioningData?.tier && typeof positioningData.tier === 'string') {
      harvardRating = tierToRating(String(positioningData.tier));
    } else if (positioningData?.rating) {
      harvardRating = Math.min(6, Math.max(1, Number(positioningData.rating))) as 1 | 2 | 3 | 4 | 5 | 6;
    } else {
      harvardRating = 4;
    }

    const harvardScale: HarvardScaleAssessment = {
      rating: harvardRating,
      description: String(
        positioningData?.description || HARVARD_SCALE_DEFINITIONS[harvardRating]
      ),
      rationale: String(positioningData?.rationale || ''),
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

    // ISSUE 5 FIX: Always recalculate overallScore.total from breakdown components
    // using the canonical formula. This ensures a single consistent 0-10 scale
    // regardless of what the LLM returned as its "total". The LLM-provided total
    // is used only as a sanity check — if it diverges > 1.0, the recalculated
    // value takes precedence.
    const recalculatedTotal = Math.round((
      breakdown.tierDistribution.score * 0.25 +
      breakdown.spikeDetection.score * 0.25 +
      breakdown.coherence.score * 0.20 +
      breakdown.majorAlignment.score * 0.15 +
      breakdown.presentationQuality.score * 0.15
    ) * 10) / 10;

    const llmTotal = overallScore.total;
    const totalDivergence = Math.abs(recalculatedTotal - llmTotal);
    if (totalDivergence > 1.0) {
      console.warn(
        `[PortfolioScoringService] LLM total (${llmTotal}) diverges from formula (${recalculatedTotal}) by ${totalDivergence.toFixed(1)}. Using recalculated value.`
      );
    }
    // Always use recalculated total for consistency
    overallScore.total = Math.min(10, Math.max(1, recalculatedTotal));

    // Also reconcile the Harvard scale rating with the recalculated total
    // to ensure the competitive tier label matches the actual score
    const scoreToHarvardRating = (score: number): 1 | 2 | 3 | 4 | 5 | 6 => {
      if (score >= 9.0) return 1;
      if (score >= 7.5) return 2;
      if (score >= 6.0) return 3;
      if (score >= 4.0) return 4;
      if (score >= 2.5) return 5;
      return 6;
    };
    const recalculatedRating = scoreToHarvardRating(overallScore.total);
    if (recalculatedRating !== harvardScale.rating) {
      harvardScale.rating = recalculatedRating;
      harvardScale.description = HARVARD_SCALE_DEFINITIONS[recalculatedRating];
    }

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
          oneLiner: buildActivityOneLiner(activity, combinedScore),
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
