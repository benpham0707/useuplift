/**
 * Description Scoring Service (SONNET-POWERED)
 *
 * LLM-powered scoring of activity descriptions with nuanced, research-backed assessment.
 * Evaluates HOW WELL the 150-character description presents the activity, independent
 * of the activity's inherent quality.
 *
 * CORE INSIGHT: Description quality is where students have the MOST CONTROL.
 * They can't change what they did, but they CAN change how they present it.
 * A Tier 4 activity with a 10/10 description beats a Tier 2 activity with a 3/10 description.
 *
 * SCORING DIMENSIONS (10 total points, variable weighting):
 *
 * 1. ROLE OWNERSHIP (0-2.5 points) - Does the reader know exactly what THIS student did?
 *    - The fundamental question: "Could you describe this student's specific contribution?"
 *    - Separates individual from team/org, makes ownership unmistakable
 *
 * 2. ACTION PRECISION (0-2.0 points) - How specific and powerful is the language?
 *    - Verb hierarchy: Elite (designed, engineered) > Good (led, managed) > Weak (helped, participated)
 *    - Active voice, precise language that conveys exact nature of work
 *
 * 3. EVIDENCE OF IMPACT (0-2.0 points) - Is there clear cause-and-effect?
 *    - Shows what student did → what resulted (not just claims, but evidence)
 *    - "So what?" is answered with specifics, not generics
 *
 * 4. STRATEGIC QUANTIFICATION (0-1.5 points) - Are numbers used meaningfully?
 *    - Quality over quantity: meaningful metrics that demonstrate scale
 *    - Flags vanity metrics and context-free numbers
 *
 * 5. DIFFERENTIATION SIGNAL (0-2.0 points) - What makes THIS student stand out?
 *    - The 1,000-student test: "If 1,000 others did this activity, what did YOU do differently?"
 *    - Unique contribution, not generic active-member description
 *
 * MODEL: Sonnet - This is where nuance matters most. Description quality requires
 * understanding context, detecting subtle issues (overclaiming, vague language),
 * and making calibrated judgments that Haiku cannot reliably make.
 *
 * PHILOSOPHY: This is a DIAGNOSTIC layer. We identify where the description stands
 * and what issues exist. The Teaching Layer provides the prescription for improvement.
 *
 * COST: ~$0.02-0.03 per activity (Sonnet for quality, worth it for accuracy)
 */

import { callClaude } from '@/lib/llm/claude';
import {
  DescriptionScore,
  DescriptionScoreBreakdown,
  DescriptionScoreComponent,
  DESCRIPTION_SCORE_LEVELS,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface DescriptionScoringInput {
  /** The activity description to score (typically 150 chars max) */
  description: string;
  /** Activity title for context */
  activityTitle: string;
  /** Activity type for context */
  activityType?: string;
  /** Position/role held (helps assess authenticity) */
  position?: string;
  /** Hours per week (helps assess if description matches investment) */
  hoursPerWeek?: number;
  /** Weeks per year (helps assess if description matches investment) */
  weeksPerYear?: number;
}

export interface DescriptionScoringResult {
  success: boolean;
  score?: DescriptionScore;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface BatchDescriptionScoringInput {
  activities: DescriptionScoringInput[];
}

export interface BatchDescriptionScoringResult {
  success: boolean;
  scores?: DescriptionScore[];
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ============================================================================
// PROMPTS - RESEARCH-BACKED RUBRIC
// ============================================================================

const DESCRIPTION_SCORING_SYSTEM_PROMPT = `You are an expert college admissions evaluator with deep experience reading thousands of activity descriptions. Your task is to DIAGNOSE the quality of activity descriptions—not prescribe fixes, just accurately assess where they stand.

CORE INSIGHT: Description quality is independent of activity quality. A Tier 4 activity can have a 10/10 description. A Tier 1 activity can have a 3/10 description. You are evaluating CRAFT, not the activity itself.

THE 6-SECOND TEST (How Admissions Officers Read):
- Seconds 1-2: Scan for role/title and time commitment
- Seconds 3-4: Skim description for differentiation signals
- Seconds 5-6: Decide if this adds to narrative or is noise

Great descriptions make the reader STOP and want to learn more. Weak descriptions get skipped.

═══════════════════════════════════════════════════════════════════════════════
SCORING RUBRIC (10 points total)
═══════════════════════════════════════════════════════════════════════════════

## DIMENSION 1: ROLE OWNERSHIP (0-2.5 points)
**Core Question: Does the reader know exactly what THIS student did?**

| Score | Criteria |
|-------|----------|
| 2.5   | Unmistakably clear ownership; reader can describe student's exact contribution in one sentence |
| 2.0   | Clear role with minor ambiguity; predominantly student-focused |
| 1.5   | Role discernible but mixed with organizational description |
| 1.0   | Vague role; hard to distinguish individual from team/org contribution |
| 0.5   | Almost entirely org-focused; student appears passive |
| 0     | No discernible individual contribution |

Diagnostic questions:
- Could you tell me exactly what this student did (not what the club/team did)?
- Is it clear THIS student did it, or could any member claim this?
- Does the description work for 1 person or 100 people equally?

Red flags: "We worked on...", "The team achieved...", "Our organization..."

## DIMENSION 2: ACTION PRECISION (0-2.0 points)
**Core Question: How specific and powerful is the language?**

| Score | Criteria |
|-------|----------|
| 2.0   | Precise, vivid verbs conveying exact nature of work |
| 1.5   | Strong but somewhat generic action verbs |
| 1.0   | Acceptable but weak verbs |
| 0.5   | Passive or vague |
| 0     | No action language; entirely passive/descriptive |

Verb hierarchy (highest to lowest):
- ELITE: designed, engineered, pioneered, negotiated, diagnosed, synthesized, architected
- GOOD: led, managed, directed, trained, analyzed, implemented, launched
- ACCEPTABLE: organized, coordinated, developed, created
- WEAK: worked on, handled, ran, supported
- POOR: participated, involved, assisted, helped, member of, part of

## DIMENSION 3: EVIDENCE OF IMPACT (0-2.0 points)
**Core Question: Is there clear cause-and-effect showing meaningful outcomes?**

| Score | Criteria |
|-------|----------|
| 2.0   | Clear causal chain: specific action → measurable/observable outcome |
| 1.5   | Impact claimed with some evidence but causation not airtight |
| 1.0   | Generic impact claims without specifics ("improved", "helped", "made difference") |
| 0.5   | Activity-focused with implied but unstated impact |
| 0     | No impact mentioned; purely describes what the activity is |

Red flags: "made a positive impact", "helped the community", "learned valuable skills"

## DIMENSION 4: STRATEGIC QUANTIFICATION (0-1.5 points)
**Core Question: Are numbers used meaningfully to demonstrate scale and significance?**

| Score | Criteria |
|-------|----------|
| 1.5   | Meaningful metrics demonstrating scale and significance |
| 1.0   | Numbers present but context unclear or significance modest |
| 0.5   | Numbers exist but trivial or potentially misleading |
| 0     | No quantification |

Meaningful metrics: "$12K raised", "200 students served", "40% improvement", "3 publications"
Vanity metrics: "attended 10 meetings", "participated in 5 events", "team of 3"

Red flags: Numbers without context, inflated-sounding but small numbers

## DIMENSION 5: DIFFERENTIATION SIGNAL (0-2.0 points)
**Core Question: What did THIS student do that 1,000 others in the same activity didn't?**

| Score | Criteria |
|-------|----------|
| 2.0   | Clear unique contribution; something only this student did or created |
| 1.5   | Notable differentiation; went beyond typical member contribution |
| 1.0   | Some individual flavor but largely typical active-member description |
| 0.5   | Generic; could describe any engaged participant |
| 0     | Template-like; indistinguishable from thousands of similar descriptions |

Differentiation signals:
- Created something new (methodology, program, resource, product)
- Achieved external recognition (publication, award, adoption by others)
- Solved a specific problem in a unique way
- Shows intellectual curiosity/initiative beyond assigned duties

═══════════════════════════════════════════════════════════════════════════════
CALIBRATION EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

### EXAMPLE 1: Math Tutoring (Same Activity, Different Quality Descriptions)

**Score: 2/10 (Poor)**
"Tutored students in math after school. Helped them with homework and prepared for tests. Made a positive impact on their grades."

- Role Ownership: 0.5 (vague, anyone could write this)
- Action Precision: 0.5 ("tutored", "helped", "prepared" all weak)
- Evidence of Impact: 0.5 ("positive impact" is meaningless)
- Quantification: 0 (none)
- Differentiation: 0 (could describe any tutor ever)
**Total: 1.5 → 2**

**Score: 5/10 (Average)**
"Tutored 15 students weekly in Algebra II and Pre-Calculus. Created practice problems and study guides. Students improved an average of one letter grade."

- Role Ownership: 1.5 (clear role but mixed with outcomes)
- Action Precision: 1.0 ("tutored", "created" acceptable)
- Evidence of Impact: 1.0 (outcome mentioned but generic)
- Quantification: 1.0 (15 students, one letter grade)
- Differentiation: 0.5 (slightly more specific but still generic)
**Total: 5**

**Score: 9/10 (Excellent)**
"Developed 'Visual Calculus' method for ADHD learners after noticing pattern confusion. Created 47 YouTube tutorials (23K views); approach adopted by 3 schools. 93% of my students now self-report math confidence."

- Role Ownership: 2.5 (unmistakably clear what THEY did)
- Action Precision: 2.0 ("developed", "created", "adopted")
- Evidence of Impact: 2.0 (clear cause-effect, external validation)
- Quantification: 1.5 (47 tutorials, 23K views, 3 schools, 93%)
- Differentiation: 2.0 (unique methodology, external adoption)
**Total: 10 → 9** (slightly docked for minor polish room)

### EXAMPLE 2: Hospital Volunteering

**Score: 1/10 (Very Poor)**
"Volunteered at local hospital helping patients and staff. Gained valuable experience in healthcare. Committed to serving others."

- Role Ownership: 0 (what did they actually DO?)
- Action Precision: 0.5 ("volunteered", "helping" passive)
- Evidence of Impact: 0 (no outcomes)
- Quantification: 0 (none)
- Differentiation: 0 (completely generic)
**Total: 0.5 → 1**

**Score: 8/10 (Very Good)**
"Redesigned patient check-in workflow after observing 40+ wait time complaints. Proposed new triage questionnaire—piloted program reduced average wait 22%. Presented findings to hospital board."

- Role Ownership: 2.5 (crystal clear individual contribution)
- Action Precision: 2.0 ("redesigned", "proposed", "piloted", "presented")
- Evidence of Impact: 2.0 (clear causation, measured outcome)
- Quantification: 1.0 (40+ complaints, 22% reduction)
- Differentiation: 1.5 (unique initiative, external validation)
**Total: 9 → 8** (minor room for stronger quantification)

### EXAMPLE 3: Student Government (Middle Ground)

**Score: 5/10 (Average)**
"Junior Class President. Organized homecoming, prom, and class events. Led meetings and managed budget of $3,000. Represented class at school board meetings."

- Role Ownership: 2.0 (clear role via title, but description is duty list)
- Action Precision: 1.0 ("organized", "led", "managed" acceptable but generic)
- Evidence of Impact: 0.5 (events happened, but what was outcome?)
- Quantification: 1.0 ($3,000 provides some scale)
- Differentiation: 0.5 (sounds like any class president)
**Total: 5**

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL DIAGNOSTIC CHECKS
═══════════════════════════════════════════════════════════════════════════════

## AUTHENTICITY CHECK
- Does language match apparent experience level?
- Are claims proportionate to time invested?
- Red flag: grandiose claims without evidence ("revolutionized", "transformed" without specifics)

## INFORMATION DENSITY
- Characters used vs information conveyed
- Reward: saying more with less
- Penalize: filler words, redundancy, unnecessary phrases

## OVERCLAIMING DETECTION
- Claims that sound impressive but lack evidence
- Words like "revolutionary", "groundbreaking" without substantiation
- Misattribution of team/org accomplishments to individual

═══════════════════════════════════════════════════════════════════════════════
SCORE INTERPRETATION
═══════════════════════════════════════════════════════════════════════════════

| Range | Label    | What It Means |
|-------|----------|---------------|
| 9-10  | Elite    | Exceptional craft; stands out immediately; makes reader want to learn more |
| 7-8.9 | Strong   | Well-written; clear contribution and impact; minor room for improvement |
| 5-6.9 | Adequate | Acceptable but generic; tells the story but doesn't differentiate |
| 3-4.9 | Weak     | Significant issues; doesn't serve student well; needs substantial revision |
| 0-2.9 | Poor     | Major problems; may hurt application; needs complete rewrite |

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "total": <1-10, calculated from dimensions>,
  "breakdown": {
    "specificity": {
      "score": <0-2.5 for roleOwnership>,
      "maxScore": 2.5,
      "rationale": "<specific observation about role clarity>"
    },
    "impactClarity": {
      "score": <0-2>,
      "maxScore": 2,
      "rationale": "<specific observation about impact evidence>"
    },
    "actionLanguage": {
      "score": <0-2>,
      "maxScore": 2,
      "rationale": "<verbs identified and assessment>"
    },
    "quantification": {
      "score": <0-1.5>,
      "maxScore": 1.5,
      "rationale": "<numbers identified and whether meaningful>"
    },
    "authenticityVoice": {
      "score": <0-2>,
      "maxScore": 2,
      "rationale": "<differentiation assessment>"
    }
  },
  "strengths": ["<what the description does well>"],
  "improvements": ["<specific issues identified>"],
  "overallRationale": "<2-3 sentence diagnosis of where this description stands>",
  "diagnosticFlags": {
    "overclaiming": <true/false>,
    "underrepresenting": <true/false>,
    "genericLanguage": <true/false>,
    "missingOwnership": <true/false>
  }
}

NOTE: Map new dimensions to legacy field names:
- roleOwnership → specificity
- evidenceOfImpact → impactClarity
- actionPrecision → actionLanguage
- strategicQuantification → quantification
- differentiationSignal → authenticityVoice

Be precise, fair, and diagnostic. Your job is to accurately assess—the teaching layer handles improvement guidance.`;

const buildDescriptionScoringPrompt = (input: DescriptionScoringInput): string => {
  const timeContext = input.hoursPerWeek && input.weeksPerYear
    ? `\nTIME INVESTMENT: ${input.hoursPerWeek} hrs/week, ${input.weeksPerYear} weeks/year`
    : '';

  return `Score this activity description:

ACTIVITY: ${input.activityTitle}${input.activityType ? ` (${input.activityType})` : ''}${input.position ? `\nPOSITION: ${input.position}` : ''}${timeContext}

DESCRIPTION (${input.description.length} characters):
"${input.description}"

Apply the rubric precisely. Provide your scoring in the JSON format specified.`;
};

const buildBatchDescriptionScoringPrompt = (inputs: DescriptionScoringInput[]): string => {
  const activitiesText = inputs
    .map((input, index) => {
      const timeContext = input.hoursPerWeek && input.weeksPerYear
        ? `\nTime: ${input.hoursPerWeek} hrs/week, ${input.weeksPerYear} weeks/year`
        : '';
      return `
ACTIVITY ${index + 1}: ${input.activityTitle}${input.activityType ? ` (${input.activityType})` : ''}${input.position ? `\nPosition: ${input.position}` : ''}${timeContext}
Description (${input.description.length} chars): "${input.description}"`;
    })
    .join('\n\n');

  return `Score these ${inputs.length} activity descriptions:

${activitiesText}

Apply the rubric precisely to EACH activity. Provide your scoring for ALL activities in this JSON format:
{
  "scores": [
    {
      "activityIndex": 1,
      "total": <1-10>,
      "breakdown": {
        "specificity": { "score": <0-2.5>, "maxScore": 2.5, "rationale": "..." },
        "impactClarity": { "score": <0-2>, "maxScore": 2, "rationale": "..." },
        "actionLanguage": { "score": <0-2>, "maxScore": 2, "rationale": "..." },
        "quantification": { "score": <0-1.5>, "maxScore": 1.5, "rationale": "..." },
        "authenticityVoice": { "score": <0-2>, "maxScore": 2, "rationale": "..." }
      },
      "strengths": ["..."],
      "improvements": ["..."],
      "overallRationale": "...",
      "diagnosticFlags": { "overclaiming": false, "underrepresenting": false, "genericLanguage": true, "missingOwnership": false }
    },
    ... (one for each activity)
  ]
}`;
};

// ============================================================================
// SERVICE
// ============================================================================

export class DescriptionScoringService {
  /**
   * Score a single activity description using Sonnet for nuanced assessment
   */
  async scoreDescription(input: DescriptionScoringInput): Promise<DescriptionScoringResult> {
    try {
      const response = await callClaude(
        buildDescriptionScoringPrompt(input),
        {
          model: 'claude-sonnet-4-5-20250514', // Sonnet for nuanced description assessment
          systemPrompt: DESCRIPTION_SCORING_SYSTEM_PROMPT,
          temperature: 0.3,
          maxTokens: 1500,
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      // Parse JSON response
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
      console.error('[DescriptionScoringService] Error scoring description:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Score multiple activity descriptions in a single API call
   * More efficient for portfolios with many activities
   */
  async scoreDescriptionsBatch(
    input: BatchDescriptionScoringInput
  ): Promise<BatchDescriptionScoringResult> {
    if (input.activities.length === 0) {
      return { success: true, scores: [] };
    }

    // For single activity, use the single method
    if (input.activities.length === 1) {
      const result = await this.scoreDescription(input.activities[0]);
      return {
        success: result.success,
        scores: result.score ? [result.score] : undefined,
        error: result.error,
        tokensUsed: result.tokensUsed,
      };
    }

    try {
      const response = await callClaude(
        buildBatchDescriptionScoringPrompt(input.activities),
        {
          model: 'claude-sonnet-4-5-20250514', // Sonnet for nuanced description assessment
          systemPrompt: DESCRIPTION_SCORING_SYSTEM_PROMPT,
          temperature: 0.3,
          maxTokens: 6000, // More tokens for batch
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      // Parse batch JSON response
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
      console.error('[DescriptionScoringService] Error scoring descriptions batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse single score response from LLM
   */
  private parseScoreResponse(content: string): DescriptionScore | null {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

      const data = JSON.parse(jsonStr);

      // Validate and normalize the response
      return this.normalizeScoreData(data);
    } catch (error) {
      console.error('[DescriptionScoringService] Parse error:', error);
      return null;
    }
  }

  /**
   * Parse batch score response from LLM
   */
  private parseBatchScoreResponse(content: string, expectedCount: number): DescriptionScore[] | null {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

      const data = JSON.parse(jsonStr);

      if (!data.scores || !Array.isArray(data.scores)) {
        console.error('[DescriptionScoringService] Invalid batch response structure');
        return null;
      }

      // Normalize each score
      const scores: DescriptionScore[] = [];
      for (const scoreData of data.scores) {
        const normalized = this.normalizeScoreData(scoreData);
        if (normalized) {
          scores.push(normalized);
        }
      }

      // Warn if count mismatch but still return what we got
      if (scores.length !== expectedCount) {
        console.warn(
          `[DescriptionScoringService] Expected ${expectedCount} scores, got ${scores.length}`
        );
      }

      return scores;
    } catch (error) {
      console.error('[DescriptionScoringService] Batch parse error:', error);
      return null;
    }
  }

  /**
   * Normalize and validate score data from LLM response
   * Maps new dimension names to legacy field names for compatibility
   */
  private normalizeScoreData(data: unknown): DescriptionScore | null {
    if (!data || typeof data !== 'object') return null;

    const d = data as Record<string, unknown>;

    // Validate required fields
    if (typeof d.total !== 'number' || !d.breakdown) {
      return null;
    }

    const breakdown = d.breakdown as Record<string, unknown>;

    // Helper to normalize a component with variable max scores
    const normalizeComponent = (comp: unknown, maxScore: number): DescriptionScoreComponent => {
      if (!comp || typeof comp !== 'object') {
        return { score: 0, maxScore, rationale: 'Unable to assess' };
      }
      const c = comp as Record<string, unknown>;
      return {
        score: Math.min(maxScore, Math.max(0, Number(c.score) || 0)),
        maxScore,
        rationale: String(c.rationale || 'No rationale provided'),
      };
    };

    // Build normalized breakdown with correct max scores
    // Note: Using new weights but mapping to legacy field names
    const normalizedBreakdown: DescriptionScoreBreakdown = {
      specificity: normalizeComponent(breakdown.specificity, 2.5), // Role Ownership
      impactClarity: normalizeComponent(breakdown.impactClarity, 2), // Evidence of Impact
      actionLanguage: normalizeComponent(breakdown.actionLanguage, 2), // Action Precision
      quantification: normalizeComponent(breakdown.quantification, 1.5), // Strategic Quantification
      authenticityVoice: normalizeComponent(breakdown.authenticityVoice, 2), // Differentiation Signal
    };

    // Calculate total from components to ensure consistency
    // New weights: 2.5 + 2 + 2 + 1.5 + 2 = 10
    const calculatedTotal =
      normalizedBreakdown.specificity.score +
      normalizedBreakdown.impactClarity.score +
      normalizedBreakdown.actionLanguage.score +
      normalizedBreakdown.quantification.score +
      normalizedBreakdown.authenticityVoice.score;

    // Use calculated total
    const total = Math.round(calculatedTotal * 10) / 10; // Round to 1 decimal

    return {
      total: Math.min(10, Math.max(1, total)),
      breakdown: normalizedBreakdown,
      strengths: Array.isArray(d.strengths) ? d.strengths.map(String) : [],
      improvements: Array.isArray(d.improvements) ? d.improvements.map(String) : [],
      overallRationale: String(d.overallRationale || this.generateRationale(total)),
      suggestedRewrite: d.suggestedRewrite ? String(d.suggestedRewrite) : undefined,
    };
  }

  /**
   * Generate a fallback rationale based on score
   */
  private generateRationale(score: number): string {
    const roundedScore = Math.round(score);
    const levelKey = Math.min(10, Math.max(1, roundedScore)) as keyof typeof DESCRIPTION_SCORE_LEVELS;
    return `This description scores ${score}/10. ${DESCRIPTION_SCORE_LEVELS[levelKey] || 'See component breakdowns for details.'}`;
  }

  /**
   * Get score level description for display
   */
  getScoreLevelDescription(score: number): string {
    const levelKey = Math.min(10, Math.max(1, Math.round(score))) as keyof typeof DESCRIPTION_SCORE_LEVELS;
    return DESCRIPTION_SCORE_LEVELS[levelKey] || 'Unknown';
  }

  /**
   * Get interpretation label for a score
   */
  getScoreInterpretation(score: number): 'elite' | 'strong' | 'adequate' | 'weak' | 'poor' {
    if (score >= 9) return 'elite';
    if (score >= 7) return 'strong';
    if (score >= 5) return 'adequate';
    if (score >= 3) return 'weak';
    return 'poor';
  }
}

// Export singleton
export const descriptionScoringService = new DescriptionScoringService();
