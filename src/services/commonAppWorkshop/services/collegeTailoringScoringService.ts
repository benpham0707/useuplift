/**
 * College Tailoring Scoring Service
 *
 * Uses Claude to score essays against the college-specific tailoring rubric.
 * This enables:
 * 1. Measuring how well an essay is tailored to a specific college
 * 2. Comparing before/after enhancement scores
 * 3. Creating a feedback loop for iterative improvement
 *
 * **Architecture**:
 * - Semantic scoring with Sonnet for accuracy
 * - Pattern detection for clichés and research signals
 * - College-specific weights and elite markers
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { CollegeResearch } from '../types/collegeResearch';
import {
  type TailoringDimension,
  type TailoringDimensionScore,
  type TailoringAssessment,
  type EliteCraftMarker,
  TAILORING_DIMENSION_DEFINITIONS,
  getCollegeTailoringWeights,
  getEliteCraftMarkers,
  calculateTailoringScore,
  getTailoringTier,
  generateTailoringImprovements,
} from '../rubrics/collegeTailoringRubric';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-20250514';

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// TYPES
// ============================================================================

export interface TailoringScoringInput {
  essay_text: string;
  college: CollegeResearch;
  prompt_id?: string;
  prompt_text?: string;
  essay_type?: string;
}

export interface TailoringScoringOutput {
  assessment: TailoringAssessment;
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

interface ClaudeTailoringResponse {
  dimension_scores: Array<{
    dimension: TailoringDimension;
    score: number;
    evidence: string[];
    issues: string[];
    improvements: string[];
  }>;
  values_demonstrated: Array<{
    value_id: string;
    value_name: string;
    evidence: string[];
    strength: 'strong' | 'moderate' | 'weak' | 'absent';
    semantic_reasoning?: string; // WHY this value is/isn't present
  }>;
  cliches_detected: Array<{
    pattern: string;
    severity: 'critical' | 'moderate' | 'minor';
    location: string;
    fix_suggestion: string;
  }>;
  research_signals: Array<{
    type: 'program' | 'faculty' | 'resource' | 'value' | 'generic';
    content: string;
    specificity: 'specific' | 'generic';
  }>;
  elite_markers_present: string[];
  elite_markers_missing: string[];
  would_work_for_other_colleges: boolean;
  distinctiveness_note: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CollegeTailroingScoringService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Score an essay against the college tailoring rubric
   */
  async scoreEssay(input: TailoringScoringInput): Promise<TailoringScoringOutput> {
    const { essay_text, college, prompt_id, prompt_text, essay_type } = input;

    const collegeId = college.collegeId?.toLowerCase() || college.collegeName.toLowerCase();
    const weights = getCollegeTailoringWeights(collegeId);
    const eliteMarkers = getEliteCraftMarkers(collegeId);

    // Build the scoring prompt
    const prompt = this.buildScoringPrompt(
      essay_text,
      college,
      weights,
      eliteMarkers,
      prompt_id,
      prompt_text,
      essay_type
    );

    try {
      const response = await this.client.messages.create({
        model: SONNET_MODEL,
        max_tokens: 4000, // Increased for semantic value reasoning which requires more output
        temperature: 0, // Zero temperature for deterministic scoring - reduces variance
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = parseClaudeJSON<ClaudeTailoringResponse>(content.text);

      if (!parsed) {
        throw new Error('Failed to parse scoring response');
      }

      // Calculate costs
      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const cost = (inputTokens * SONNET_PRICING.input) + (outputTokens * SONNET_PRICING.output);

      // Build dimension scores with weights
      // Clamp and round scores to ensure consistency
      const dimensionScores: TailoringDimensionScore[] = parsed.dimension_scores.map(d => ({
        ...d,
        score: Math.max(1, Math.min(10, Math.round(d.score))), // Clamp 1-10, round to integer
        weight: weights.weights[d.dimension],
      }));

      // Calculate overall tailoring score (round to integer for consistency)
      const tailoringScore = Math.round(calculateTailoringScore(dimensionScores, weights.weights));

      // Generate improvements
      const { quick_wins, strategic_improvements } = generateTailoringImprovements(
        dimensionScores,
        collegeId
      );

      // Calculate tailoring gap (potential improvement)
      const tailoringGap = 100 - tailoringScore;

      const assessment: TailoringAssessment = {
        college_id: collegeId,
        college_name: college.collegeName,
        tailoring_score: tailoringScore,
        dimension_scores: dimensionScores,
        values_demonstrated: parsed.values_demonstrated,
        cliches_detected: parsed.cliches_detected,
        research_signals: parsed.research_signals,
        elite_markers_present: parsed.elite_markers_present,
        elite_markers_missing: parsed.elite_markers_missing,
        quick_wins,
        strategic_improvements,
        tailoring_gap: tailoringGap,
        would_work_for_other_colleges: parsed.would_work_for_other_colleges,
        distinctiveness_note: parsed.distinctiveness_note,
      };

      return {
        assessment,
        cost,
        tokens_used: {
          input: inputTokens,
          output: outputTokens,
        },
      };
    } catch (error) {
      console.error('[CollegeTailoringScoringService] Scoring failed:', error);
      throw error;
    }
  }

  /**
   * Compare two versions of an essay (before/after enhancement)
   */
  async compareVersions(
    before: TailoringScoringInput,
    after: TailoringScoringInput
  ): Promise<{
    before_assessment: TailoringAssessment;
    after_assessment: TailoringAssessment;
    improvement: {
      score_delta: number;
      dimensions_improved: string[];
      dimensions_degraded: string[];
      net_improvement: boolean;
    };
    total_cost: number;
  }> {
    // Score both versions
    const [beforeResult, afterResult] = await Promise.all([
      this.scoreEssay(before),
      this.scoreEssay(after),
    ]);

    // Calculate improvements
    const scoreDelta = afterResult.assessment.tailoring_score - beforeResult.assessment.tailoring_score;

    const dimensionsImproved: string[] = [];
    const dimensionsDegraded: string[] = [];

    for (const afterDim of afterResult.assessment.dimension_scores) {
      const beforeDim = beforeResult.assessment.dimension_scores.find(
        d => d.dimension === afterDim.dimension
      );
      if (beforeDim) {
        if (afterDim.score > beforeDim.score) {
          dimensionsImproved.push(afterDim.dimension);
        } else if (afterDim.score < beforeDim.score) {
          dimensionsDegraded.push(afterDim.dimension);
        }
      }
    }

    return {
      before_assessment: beforeResult.assessment,
      after_assessment: afterResult.assessment,
      improvement: {
        score_delta: scoreDelta,
        dimensions_improved: dimensionsImproved,
        dimensions_degraded: dimensionsDegraded,
        net_improvement: scoreDelta > 0 && dimensionsDegraded.length === 0,
      },
      total_cost: beforeResult.cost + afterResult.cost,
    };
  }

  /**
   * Build the scoring prompt
   */
  private buildScoringPrompt(
    essay_text: string,
    college: CollegeResearch,
    weights: ReturnType<typeof getCollegeTailoringWeights>,
    eliteMarkers: EliteCraftMarker[],
    prompt_id?: string,
    prompt_text?: string,
    essay_type?: string
  ): string {
    // Build core values section with FULL semantic guidance (is/isNot)
    const coreValues = college.coreValues?.slice(0, 5).map(v => ({
      id: v.valueId,
      name: v.valueName,
      definition: v.definition,
      essay_implication: v.essayImplication,
      // Include semantic "is" and "isNot" for nuanced detection
      is: v.is || [],
      isNot: v.isNot || [],
    })) || [];

    // Build clichés section
    const cliches = college.redFlags?.slice(0, 10).map(f => ({
      pattern: f.pattern,
      why_problematic: f.deanQuote?.why_problematic || 'Overused pattern',
    })) || [];

    // Build dimension criteria
    const dimensionCriteria = Object.entries(TAILORING_DIMENSION_DEFINITIONS)
      .map(([id, def]) => `
**${def.name}** (Weight: ${weights.weights[id as TailoringDimension]}%)
- What it measures: ${def.what_it_measures}
- Excellent (9-10): ${def.scoring_criteria.excellent}
- Strong (7-8): ${def.scoring_criteria.strong}
- Adequate (5-6): ${def.scoring_criteria.adequate}
- Weak (3-4): ${def.scoring_criteria.weak}
- Poor (1-2): ${def.scoring_criteria.poor}
`).join('\n');

    // Build elite markers section
    const eliteMarkersSection = eliteMarkers.length > 0
      ? eliteMarkers.map(m => `
**${m.name}**: ${m.description}
- Signals: ${m.detection_signals.join(', ')}
- Anti-patterns: ${m.anti_patterns.join(', ')}
`).join('\n')
      : 'No college-specific elite markers defined.';

    return `You are an expert college admissions essay evaluator specializing in ${college.collegeName}.

Your job is to score how well this essay is TAILORED to ${college.collegeName} specifically.
This is NOT a universal quality score - it measures COLLEGE-SPECIFIC FIT.

## CRITICAL ANTI-BIAS GUIDELINES

**DO NOT reward name-dropping without substance.**
An essay that mentions 5 Stanford programs but has no authentic voice should score LOWER than
an essay with zero program mentions but genuine intellectual curiosity.

**Reference Calibration:**
- Essay with 0 program mentions + strong values demonstrated = CAN score 85+
- Essay with 5 program mentions + hollow connections = should score < 50
- Program names are DECORATIVE unless connected to personal narrative

**Key Question:** Would an admissions officer who reads 50 essays a day find this AUTHENTIC,
or would they recognize it as "consultant-optimized"?

**Real Example of What Works (no programs, scored 85+):**
"The question that keeps me up at night isn't about CRISPR - it's simpler: why do I feel guilty
when I step on an ant? That guilt led me through Peter Singer, Buddhist ethics, and to building
an Arduino sensor that warns insects. My friends think I'm weird. I think I'm onto something."
→ This IS Stanford without saying Stanford. The mindset is the fit.

**Real Example of What Fails (5 programs, scored < 40):**
"I want to study at Stanford because of Professor Fei-Fei Li's work at SAIL and HAI.
I am also interested in the Program in Ethics in Society and SymSys."
→ This is name-dropping. No authentic connection. Any motivated Googler could write this.

## ESSAY TO SCORE

${essay_text}

${prompt_text ? `## PROMPT\n${prompt_text}\n` : ''}
${essay_type ? `## ESSAY TYPE\n${essay_type}\n` : ''}

## ${college.collegeName.toUpperCase()} CORE VALUES - SEMANTIC DETECTION GUIDE

For each value, use the "IS" and "IS NOT" indicators to identify it semantically in the essay.
Do NOT use keyword matching - look for the UNDERLYING BEHAVIORS and MINDSETS.

${coreValues.map(v => `### ${v.name} (ID: ${v.id})
**Definition**: ${v.definition}
**Essay Implication**: ${v.essay_implication}

**THIS VALUE IS PRESENT when the essay shows**:
${v.is.length > 0 ? v.is.map(i => `  ✓ ${i}`).join('\n') : '  (No specific indicators defined)'}

**THIS VALUE IS ABSENT/WRONG when the essay shows**:
${v.isNot.length > 0 ? v.isNot.map(i => `  ✗ ${i}`).join('\n') : '  (No anti-patterns defined)'}
`).join('\n')}

## ${college.collegeName.toUpperCase()} CLICHÉS TO AVOID

${cliches.map(c => `- "${c.pattern}": ${c.why_problematic}`).join('\n')}

## SCORING DIMENSIONS

${dimensionCriteria}

## CRITICAL DIMENSIONS FOR ${college.collegeName.toUpperCase()}

These dimensions matter MOST: ${weights.critical_dimensions.join(', ')}
Rationale: ${weights.rationale}

## ELITE CRAFT MARKERS FOR ${college.collegeName.toUpperCase()}

${eliteMarkersSection}

## SCORE CALIBRATION ANCHORS (Use These as Reference)

**These are ground-truth examples to anchor your scoring:**

| Essay Type | Expected Total Score | Key Dimension Scores |
|------------|---------------------|---------------------|
| Zero programs, strong authentic voice showing Stanford values | 85-95 | value_alignment: 9, research_depth: 3-5, distinctiveness: 8+ |
| Programs WITH genuine personal connection | 85-95 | value_alignment: 9+, research_depth: 8+, citation_integration: 9+ |
| 5+ program mentions, hollow connections, no voice | 25-40 | value_alignment: 2, research_depth: 4, citation_integration: 2 |
| Generic "dream school" praise, college name swappable | 15-30 | distinctiveness: 1-2, cliche_avoidance: 1-3 |

**Before finalizing scores, cross-reference against these anchors.**

## YOUR TASK

Score this essay on all 8 tailoring dimensions. For each dimension:
1. Give a score 1-10
2. Cite specific evidence from the text
3. List any issues found
4. Suggest specific improvements

**SCORING CONSISTENCY RULES:**
- Use whole numbers only (no decimals)
- Scores should be relative to the calibration anchors above
- When uncertain between two scores, prefer the lower score
- Evidence must directly support the score given

**SPECIAL SCORING RULES:**

For research_depth:
- Do NOT give 7+ just because programs are mentioned
- Ask: "Is the program mention ESSENTIAL to the narrative, or decorative?"
- Ask: "Would removing the program name hurt the essay's meaning?"
- If programs feel inserted, cap at 5 regardless of count

For citation_integration:
- Zero citations with authentic voice can score 6+
- Forced citations with thin connection should score 3-4
- Natural citations that DRIVE the narrative score 8+

For distinctiveness:
- Focus on MINDSET match, not vocabulary match
- An essay about curiosity can be Stanford-distinctive without mentioning Stanford
- Ask: "If I removed all college names, would I still know this is for Stanford?"

Also identify:
- Which college values are demonstrated (with SEMANTIC evidence - explain WHY, not just WHERE)
- Any clichés detected (with locations and fix suggestions)
- Research signals (specific vs generic references) - FLAG if they feel inserted
- Which elite markers are present/missing
- Whether this essay would work for other colleges

## VALUE DETECTION - CRITICAL INSTRUCTIONS

For EACH of the ${coreValues.length} core values listed above, you MUST:
1. Determine if it is present (strong/moderate) or absent/weak
2. Provide semantic reasoning - WHAT in the essay demonstrates this value?
3. Reference the "IS" indicators that match (or "IS NOT" anti-patterns that apply)
4. You must include ALL values in the output, even if absent

Example semantic reasoning:
- GOOD: "The essay shows 'intellectual_vitality' through the student's 3-month self-directed exploration of ethics, which matches 'pursuing topics beyond requirements because they fascinate you'"
- BAD: "The essay mentions 'intellectual' so intellectual_vitality is present" (this is keyword matching, NOT semantic)

## OUTPUT FORMAT (JSON)

{
  "dimension_scores": [
    {
      "dimension": "value_alignment",
      "score": 7,
      "evidence": ["Quote from essay showing value alignment..."],
      "issues": ["Missing demonstration of X value..."],
      "improvements": ["Add specific example of Y value in action..."]
    },
    // ... all 8 dimensions
  ],
  "values_demonstrated": [
    {
      "value_id": "intellectual_vitality",
      "value_name": "Intellectual Vitality",
      "evidence": ["Quote showing this value..."],
      "strength": "strong",
      "semantic_reasoning": "The essay demonstrates self-directed exploration beyond requirements - the student pursued ethics research for 3 months unprompted, which directly matches the 'IS' indicator 'Questions you can't stop thinking about'"
    }
  ],
  "cliches_detected": [
    {
      "pattern": "dream school",
      "severity": "critical",
      "location": "paragraph 2",
      "fix_suggestion": "Remove and replace with specific reason for fit"
    }
  ],
  "research_signals": [
    {
      "type": "program",
      "content": "Program in Ethics in Society",
      "specificity": "specific"
    }
  ],
  "elite_markers_present": ["rabbit_hole_depth", "genuine_uncertainty"],
  "elite_markers_missing": ["self_directed_exploration"],
  "would_work_for_other_colleges": false,
  "distinctiveness_note": "This essay is distinctly Stanford - the intellectual curiosity and questioning mindset would not translate to MIT or Harvard applications."
}

Be rigorous and specific. Use exact quotes from the essay as evidence.`;
  }
}

// Singleton export
export const collegeTailroingScoringService = new CollegeTailroingScoringService();
