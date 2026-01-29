/**
 * Multi-Dimensional Scorer (Layer 4)
 *
 * Holistic scoring across 4 dimensions using LLM understanding.
 * Unlike rigid thresholds, this scorer considers the full context
 * of the student's narrative and positioning to assign nuanced scores.
 *
 * Dimensions:
 * - Rigor (0-3): How challenging was the courseload?
 * - Performance (0-2.5): How well did they perform?
 * - Intellectual Character (0-2.5): What does this reveal about the person?
 * - Trajectory (0-2): Where is this going?
 *
 * Total: 0-10 points → Maps to Harvard 1-6 scale
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type {
  AcademicHistoryInput,
  AcademicDimensionScores,
  AcademicNarrativeAnalysis,
  ContextualPositioning,
  HeuristicFoundation,
  RigorScore,
  PerformanceScore,
  IntellectualCharacterScore,
  TrajectoryScore,
  RIGOR_RUBRIC,
  PERFORMANCE_RUBRIC,
  CHARACTER_RUBRIC,
  TRAJECTORY_RUBRIC,
} from '../types';

// ============================================================================
// SCORING PROMPT
// ============================================================================

const SCORING_PROMPT = `You are a senior admissions officer at a highly selective university, calibrated on thousands of academic records. Your role is to provide nuanced, holistic scoring that goes beyond pattern matching.

You have already reviewed the narrative analysis and contextual positioning for this student. Now assign dimension scores using your expert judgment.

STUDENT NARRATIVE ANALYSIS:
{narrativeSummary}

Key Character Traits:
{characterTraits}

Passion Signals:
{passionSignals}

Red Narratives to Consider:
{redNarratives}

CONTEXTUAL POSITIONING:
{positioningSummary}

RAW ACADEMIC DATA:
{rawDataSummary}

HEURISTIC SIGNALS:
{heuristicSummary}

---

SCORING TASK: Assign scores across 4 dimensions. Use the full scale - don't cluster around the middle.

## DIMENSION 1: RIGOR (0-3 points)
How challenging was this courseload relative to what was available?

Rubric:
- 3.0: Exceptional - Maximum available rigor, created additional opportunities
- 2.5: Excellent - Near-maximum rigor, 8+ AP/IB courses, challenged consistently
- 2.0: Strong - Above-average rigor, 5-7 AP/IB courses
- 1.5: Solid - Average competitive rigor, 3-4 AP/IB courses
- 1.0: Moderate - Below-average rigor, 1-2 AP/IB or mostly honors
- 0.5: Limited - Minimal rigor despite availability
- 0.0: Concerning - No rigor despite availability OR clear avoidance

CRITICAL: Adjust for context. 4 APs at a school offering 5 is different than 4 at a school offering 20.

## DIMENSION 2: PERFORMANCE (0-2.5 points)
How well did they perform under their chosen rigor?

Rubric:
- 2.5: Exceptional - 3.95+ UW in most rigorous track, no grade below A-
- 2.0: Excellent - 3.8-3.94 UW, strong in rigorous courses
- 1.5: Strong - 3.6-3.79 UW, solid performance, some Bs acceptable in hardest courses
- 1.0: Good - 3.4-3.59 UW, Bs common but no Cs
- 0.5: Moderate - 3.0-3.39 UW, significant variation
- 0.0: Concerning - <3.0 or Ds/Fs present

TRAJECTORY ADJUSTMENT:
- Add +0.25 for clear ascending trajectory
- Subtract -0.25 for declining trajectory
- Weight Jr/Sr years more heavily

## DIMENSION 3: INTELLECTUAL CHARACTER (0-2.5 points)
What does this record reveal about intellectual engagement?

Rubric:
- 2.5: Remarkable - Clear intellectual passion, deep subject expertise, goes beyond curriculum
- 2.0: Strong - Evident curiosity, sustained multi-year commitment, advanced work
- 1.5: Solid - Good depth in 1-2 areas, some evidence of investment beyond grades
- 1.0: Adequate - Standard progression, competent but no clear passion
- 0.5: Limited - Surface-level engagement, appears grade-focused
- 0.0: Concerning - Strategic avoidance, GPA protection over learning

THIS IS THE "NUANCE" DIMENSION - use narrative analysis heavily here.

## DIMENSION 4: TRAJECTORY (0-2 points)
What direction is this academic record heading?

Rubric:
- 2.0: Ascending - Clear upward trend, taking on more challenge, improvement visible
- 1.5: Stable Strong - Consistently strong throughout, maintained excellence
- 1.0: Mixed - Some ups and downs, no clear direction
- 0.5: Declining - Downward trend in rigor or grades
- 0.0: Concerning - Sharp decline, rigor avoidance, grade collapse

---

For EACH dimension, provide:
1. Score (to 0.5 precision, 0.25 for performance trajectory adjustment)
2. Rationale (2-3 sentences explaining WHY this score - be specific)
3. Key Evidence (2-3 specific pieces of evidence from the record)
4. Benchmark Comparison (how does this compare to typical applicants at selective schools)

Also provide:
- rawTotal: Sum of all 4 dimension scores (0-10)
- weightedTotal: Apply any final adjustments based on holistic impression

Respond with a JSON object matching this structure:
{
  "rigor": {
    "score": number,
    "rationale": "string",
    "keyEvidence": ["string", "string"],
    "benchmarkComparison": "string",
    "contextAdjustment": "string (how school context affected score)"
  },
  "performance": {
    "score": number,
    "rationale": "string",
    "keyEvidence": ["string", "string"],
    "benchmarkComparison": "string",
    "trajectoryBonus": number (-0.25 to +0.25)
  },
  "intellectualCharacter": {
    "score": number,
    "rationale": "string",
    "keyEvidence": ["string", "string"],
    "benchmarkComparison": "string",
    "passionAreas": ["string"]
  },
  "trajectory": {
    "score": number,
    "rationale": "string",
    "keyEvidence": ["string", "string"],
    "benchmarkComparison": "string",
    "projectedDirection": "ascending|stable|concerning"
  },
  "rawTotal": number,
  "weightedTotal": number
}`;

// ============================================================================
// FORMATTER HELPERS
// ============================================================================

function formatNarrativeSummary(narrative: AcademicNarrativeAnalysis): string {
  return `Narrative Type: ${narrative.narrativeType}
Summary: ${narrative.narrativeSummary}
Context Utilization: ${narrative.contextUtilization}`;
}

function formatCharacterTraits(narrative: AcademicNarrativeAnalysis): string {
  if (narrative.characterTraits.length === 0) {
    return 'No character traits identified.';
  }

  return narrative.characterTraits
    .map((t) => `- ${t.trait} (${t.strength}): ${t.evidence}`)
    .join('\n');
}

function formatPassionSignals(narrative: AcademicNarrativeAnalysis): string {
  if (narrative.passionSignals.length === 0) {
    return 'No clear passion signals identified.';
  }

  return narrative.passionSignals
    .map((p) => `- ${p.subject} (${p.confidence}% confidence): ${p.indicators.join(', ')}`)
    .join('\n');
}

function formatRedNarratives(narrative: AcademicNarrativeAnalysis): string {
  if (narrative.redNarratives.length === 0) {
    return 'No significant red narratives identified.';
  }

  return narrative.redNarratives
    .map((r) => {
      let line = `- ${r.issue}: ${r.context}`;
      if (r.mitigation) {
        line += ` (Mitigation: ${r.mitigation})`;
      }
      return line;
    })
    .join('\n');
}

function formatPositioningSummary(positioning: ContextualPositioning): string {
  return `Relative Rigor: ${positioning.relativeRigor}
Relative Performance: ${positioning.relativePerformance}
Opportunity Utilization: ${positioning.opportunityUtilization}%
Competitive Context: ${positioning.competitiveContext}
Peer Comparison: ${positioning.peerComparison}
Target School Fit: Top Tier (${positioning.targetSchoolFit.topTier}), Mid Tier (${positioning.targetSchoolFit.midTier})`;
}

function formatRawDataSummary(input: AcademicHistoryInput, heuristics: HeuristicFoundation): string {
  const lines: string[] = [];

  lines.push(`Total Courses: ${heuristics.rawMetrics.totalCourses}`);
  lines.push(`AP Courses: ${heuristics.rawMetrics.apCourses}`);
  lines.push(`IB Courses: ${heuristics.rawMetrics.ibCourses}`);
  lines.push(`Honors Courses: ${heuristics.rawMetrics.honorsCourses}`);
  lines.push(`Overall GPA: ${heuristics.rawMetrics.avgGPA.toFixed(2)}`);
  lines.push(`Year-Weighted GPA: ${heuristics.trajectory.yearWeightedGPA.toFixed(2)}`);

  lines.push(`\nYearly Breakdown:`);
  for (const yearData of heuristics.rawMetrics.yearlyGPAs) {
    lines.push(`  ${yearData.year}: ${yearData.gpa.toFixed(2)}`);
  }

  if (input.intendedMajor) {
    lines.push(`\nIntended Major: ${input.intendedMajor}`);
    lines.push(`Major Alignment: ${heuristics.majorAlignment.alignmentScore}%`);
  }

  return lines.join('\n');
}

function formatHeuristicSummary(heuristics: HeuristicFoundation): string {
  const lines: string[] = [];

  lines.push(`GPA Trajectory: ${heuristics.trajectory.gpaTrajectoryType}`);
  lines.push(`Rigor Trajectory: ${heuristics.trajectory.rigorTrajectoryType}`);
  lines.push(`GPA-Rigor Interaction: ${heuristics.trajectory.gpaRigorInteraction}`);

  if (heuristics.redFlags.critical.length > 0) {
    lines.push(`\nCritical Flags: ${heuristics.redFlags.critical.join(', ')}`);
  }
  if (heuristics.redFlags.warning.length > 0) {
    lines.push(`Warnings: ${heuristics.redFlags.warning.join(', ')}`);
  }

  if (heuristics.commitment.sustainedSequences > 0) {
    lines.push(`\nSustained Sequences: ${heuristics.commitment.sustainedSequences}`);
  }
  if (heuristics.commitment.deepDives.length > 0) {
    lines.push(`Deep Dives: ${heuristics.commitment.deepDives.join(', ')}`);
  }
  if (heuristics.commitment.concerningDrops.length > 0) {
    lines.push(`Concerning Drops: ${heuristics.commitment.concerningDrops.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN SCORER
// ============================================================================

export interface ScorerOptions {
  temperature?: number;
  maxRetries?: number;
}

export interface ScorerResult {
  success: boolean;
  scores?: AcademicDimensionScores;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class MultiDimensionalScorer {
  private readonly defaultTemperature = 0.5; // Lower temp for more consistent scoring
  private readonly maxRetries = 2;

  async score(
    input: AcademicHistoryInput,
    heuristics: HeuristicFoundation,
    narrative: AcademicNarrativeAnalysis,
    positioning: ContextualPositioning,
    options: ScorerOptions = {}
  ): Promise<ScorerResult> {
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxRetries = options.maxRetries ?? this.maxRetries;

    // Build the prompt
    const prompt = SCORING_PROMPT
      .replace('{narrativeSummary}', formatNarrativeSummary(narrative))
      .replace('{characterTraits}', formatCharacterTraits(narrative))
      .replace('{passionSignals}', formatPassionSignals(narrative))
      .replace('{redNarratives}', formatRedNarratives(narrative))
      .replace('{positioningSummary}', formatPositioningSummary(positioning))
      .replace('{rawDataSummary}', formatRawDataSummary(input, heuristics))
      .replace('{heuristicSummary}', formatHeuristicSummary(heuristics));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await callUnifiedLLM<AcademicDimensionScores>(prompt, {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250514',
          temperature,
          maxTokens: 2000,
          systemPrompt:
            'You are a senior admissions officer providing nuanced academic scoring. Be specific in your rationales and use the full scoring range. Respond only with valid JSON.',
          useJsonMode: true,
        });

        // Validate and normalize the response
        const scores = this.validateAndNormalize(response.content);

        // Calculate cost
        const cost =
          (response.usage.input_tokens * 3) / 1_000_000 +
          (response.usage.output_tokens * 15) / 1_000_000;

        return {
          success: true,
          scores,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cost,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[MultiDimensionalScorer] Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error during multi-dimensional scoring',
    };
  }

  private validateAndNormalize(content: unknown): AcademicDimensionScores {
    if (!content || typeof content !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    const data = content as Record<string, unknown>;

    // Validate rigor score
    const rigorData = data.rigor as Record<string, unknown> | undefined;
    const rigor: RigorScore = {
      score: this.clampScore(rigorData?.score, 0, 3),
      rationale: String(rigorData?.rationale || 'No rationale provided'),
      keyEvidence: this.normalizeStringArray(rigorData?.keyEvidence),
      benchmarkComparison: String(rigorData?.benchmarkComparison || ''),
      contextAdjustment: String(rigorData?.contextAdjustment || 'No context adjustment noted'),
    };

    // Validate performance score
    const perfData = data.performance as Record<string, unknown> | undefined;
    const trajectoryBonus = this.clampScore(perfData?.trajectoryBonus, -0.25, 0.25);
    const performance: PerformanceScore = {
      score: this.clampScore(perfData?.score, 0, 2.5),
      rationale: String(perfData?.rationale || 'No rationale provided'),
      keyEvidence: this.normalizeStringArray(perfData?.keyEvidence),
      benchmarkComparison: String(perfData?.benchmarkComparison || ''),
      trajectoryBonus,
    };

    // Validate intellectual character score
    const charData = data.intellectualCharacter as Record<string, unknown> | undefined;
    const intellectualCharacter: IntellectualCharacterScore = {
      score: this.clampScore(charData?.score, 0, 2.5),
      rationale: String(charData?.rationale || 'No rationale provided'),
      keyEvidence: this.normalizeStringArray(charData?.keyEvidence),
      benchmarkComparison: String(charData?.benchmarkComparison || ''),
      passionAreas: this.normalizeStringArray(charData?.passionAreas),
    };

    // Validate trajectory score
    const trajData = data.trajectory as Record<string, unknown> | undefined;
    const validDirections = ['ascending', 'stable', 'concerning'] as const;
    const trajectory: TrajectoryScore = {
      score: this.clampScore(trajData?.score, 0, 2),
      rationale: String(trajData?.rationale || 'No rationale provided'),
      keyEvidence: this.normalizeStringArray(trajData?.keyEvidence),
      benchmarkComparison: String(trajData?.benchmarkComparison || ''),
      projectedDirection: validDirections.includes(
        trajData?.projectedDirection as (typeof validDirections)[number]
      )
        ? (trajData?.projectedDirection as (typeof validDirections)[number])
        : 'stable',
    };

    // Calculate totals
    const rawTotal = rigor.score + performance.score + intellectualCharacter.score + trajectory.score;

    // Apply weighted total (can include holistic adjustments)
    let weightedTotal = rawTotal;
    // Apply performance trajectory bonus to weighted total
    weightedTotal += trajectoryBonus;

    return {
      rigor,
      performance,
      intellectualCharacter,
      trajectory,
      rawTotal: Math.round(rawTotal * 100) / 100,
      weightedTotal: Math.round(weightedTotal * 100) / 100,
    };
  }

  private clampScore(value: unknown, min: number, max: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      return (min + max) / 2; // Default to middle if invalid
    }
    return Math.max(min, Math.min(max, value));
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const multiDimensionalScorer = new MultiDimensionalScorer();

export async function scoreAcademicDimensions(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation,
  narrative: AcademicNarrativeAnalysis,
  positioning: ContextualPositioning,
  options?: ScorerOptions
): Promise<ScorerResult> {
  return multiDimensionalScorer.score(input, heuristics, narrative, positioning, options);
}
