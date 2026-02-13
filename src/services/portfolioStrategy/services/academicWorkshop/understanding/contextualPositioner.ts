// @ts-nocheck
/**
 * Contextual Positioner (Layer 3b)
 *
 * Provides comparative positioning of academic records against relevant benchmarks.
 * Unlike rigid percentile cutoffs, this service considers the full context:
 * school resources, regional opportunities, and applicant pool characteristics.
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type {
  AcademicHistoryInput,
  ContextualPositioning,
  HeuristicFoundation,
  RelativeRigor,
  RelativePerformance,
} from '../types';

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

const POSITIONING_PROMPT = `You are a college admissions data analyst specializing in comparative positioning. Your expertise is contextualizing academic records against relevant benchmarks while accounting for opportunity and resource differences.

You understand that a 3.8 GPA at a competitive magnet school means something different than a 3.8 at an under-resourced rural school. You consider what was POSSIBLE, not just what was achieved.

STUDENT RECORD SUMMARY:
{recordSummary}

SCHOOL CONTEXT:
{schoolContext}

HEURISTIC FOUNDATION:
{heuristicSummary}

APPLICANT POOL CONTEXT:
This student will be compared against:
- Other students from {schoolType} schools
- Other applicants to {targetSelectivity} colleges
- Other students interested in {intendedMajor}

TASK: Provide contextual positioning analysis.

1. RELATIVE RIGOR
Compared to the TOP students at similar schools (same resources, same region), how does this courseload compare?
- "top_5%": Maximum possible rigor, created additional opportunities (dual enrollment, independent study, summer programs)
- "top_10%": Near-maximum available rigor, minor gaps explainable by scheduling conflicts
- "top_25%": Strong rigor, above the typical competitive applicant at this school
- "top_50%": Average for competitive applicants, nothing distinguishing
- "below_average": Limited rigor relative to what was available

Consider: If the school only offers 5 APs and student took 4, that's different than taking 4 from 20 available.

2. RELATIVE PERFORMANCE
Compared to students with similar rigor levels at similar schools:
- "exceptional": Significantly above expected - thriving under challenge
- "strong": Meets or slightly exceeds expectations - capable and consistent
- "solid": Meeting reasonable expectations - doing the work
- "mixed": Below potential - signs of struggle or inconsistency
- "concerning": Significant underperformance given opportunities

Consider: A 3.6 in the most rigorous track may indicate better performance than a 3.9 in standard courses.

3. OPPORTUNITY UTILIZATION (0-100)
What percentage of available academic opportunities did this student seize?
Consider:
- APs/IBs taken vs. offered
- Honors track enrollment
- Advanced sequences completed
- Research/independent study if available
- Summer academic programs
100 = maximized every opportunity and created more
50 = average utilization
<30 = significant opportunities left unused

4. COMPETITIVE CONTEXT
Write 2-3 sentences explaining how admissions officers at selective schools would likely view this academic record in context. Be specific and nuanced.

5. PEER COMPARISON
Complete this sentence with a specific, contextual comparison:
"Among students at similar schools with similar resources, this student's academic record..."

6. SCHOOL TIER ASSESSMENT
One sentence describing how the school context affects interpretation of this record.

7. TARGET SCHOOL FIT
For each tier, indicate the likely fit based on academics alone:
- Top Tier (Ivy+, Stanford, MIT): strong/competitive/reach/significant_reach
- Mid Tier (Top 20-50): strong/competitive/reach/significant_reach
- Safety Tier (Solid state schools): strong/competitive/reach/significant_reach

Respond with a JSON object matching this structure:
{
  "relativeRigor": "top_5%|top_10%|top_25%|top_50%|below_average",
  "relativePerformance": "exceptional|strong|solid|mixed|concerning",
  "opportunityUtilization": number (0-100),
  "competitiveContext": "string (2-3 sentences)",
  "peerComparison": "string (completing the sentence above)",
  "schoolTierAssessment": "string",
  "targetSchoolFit": {
    "topTier": "strong|competitive|reach|significant_reach",
    "midTier": "strong|competitive|reach|significant_reach",
    "safetyTier": "strong|competitive|reach|significant_reach"
  }
}`;

// ============================================================================
// FORMATTER HELPERS
// ============================================================================

function formatRecordSummary(input: AcademicHistoryInput, heuristics: HeuristicFoundation): string {
  const lines: string[] = [];

  lines.push(`Total Courses: ${heuristics.rawMetrics.totalCourses}`);
  lines.push(`AP Courses: ${heuristics.rawMetrics.apCourses}`);
  lines.push(`IB Courses: ${heuristics.rawMetrics.ibCourses}`);
  lines.push(`Honors Courses: ${heuristics.rawMetrics.honorsCourses}`);
  lines.push(`Overall GPA: ${heuristics.rawMetrics.avgGPA.toFixed(2)}`);
  lines.push(`Year-Weighted GPA: ${heuristics.trajectory.yearWeightedGPA.toFixed(2)}`);

  lines.push(`\nYearly GPAs:`);
  for (const yearData of heuristics.rawMetrics.yearlyGPAs) {
    lines.push(`  ${yearData.year}: ${yearData.gpa.toFixed(2)}`);
  }

  lines.push(`\nTrajectory: ${heuristics.trajectory.gpaTrajectoryType}`);
  lines.push(`Rigor Trend: ${heuristics.trajectory.rigorTrajectoryType}`);

  if (heuristics.commitment.sustainedSequences > 0) {
    lines.push(`\nSustained Sequences: ${heuristics.commitment.sustainedSequences}`);
    lines.push(`Deep Dives: ${heuristics.commitment.deepDives.join(', ') || 'None identified'}`);
  }

  if (heuristics.majorAlignment.alignmentScore > 0) {
    lines.push(`\nMajor Alignment: ${heuristics.majorAlignment.alignmentScore}%`);
    if (heuristics.majorAlignment.gaps.length > 0) {
      lines.push(`Gaps: ${heuristics.majorAlignment.gaps.join(', ')}`);
    }
  }

  return lines.join('\n');
}

function formatSchoolContext(input: AcademicHistoryInput): string {
  const ctx = input.schoolContext || {};
  const lines: string[] = [];

  lines.push(`School Type: ${ctx.schoolType || 'Public (assumed)'}`);
  lines.push(`AP Courses Offered: ${ctx.apCoursesOffered || 'Unknown'}`);
  lines.push(`IB Program: ${ctx.ibProgram ? 'Yes' : 'No/Unknown'}`);
  lines.push(`College Attendance Rate: ${ctx.collegeAttendanceRate || 'Unknown'}%`);
  lines.push(`Average Class Size: ${ctx.avgClassSize || 'Unknown'}`);

  if (ctx.competitiveRanking) {
    lines.push(`Competitive Ranking: ${ctx.competitiveRanking}`);
  }
  if (ctx.region) {
    lines.push(`Region: ${ctx.region}`);
  }
  if (ctx.notes) {
    lines.push(`Additional Context: ${ctx.notes}`);
  }

  // Resource level inference
  const resourceLevel = inferResourceLevel(ctx);
  lines.push(`\nInferred Resource Level: ${resourceLevel}`);

  return lines.join('\n');
}

function inferResourceLevel(
  ctx: NonNullable<AcademicHistoryInput['schoolContext']>
): string {
  const apCount = ctx.apCoursesOffered || 0;
  const collegeRate = ctx.collegeAttendanceRate || 50;

  if (apCount >= 15 && collegeRate >= 90) {
    return 'High Resources (competitive, well-funded)';
  } else if (apCount >= 10 && collegeRate >= 75) {
    return 'Above Average Resources';
  } else if (apCount >= 5 && collegeRate >= 50) {
    return 'Average Resources';
  } else if (apCount >= 2) {
    return 'Limited Resources';
  } else {
    return 'Very Limited Resources (context should weigh heavily)';
  }
}

function formatHeuristicSummary(heuristics: HeuristicFoundation): string {
  const lines: string[] = [];

  lines.push(`GPA-Rigor Interaction: ${heuristics.trajectory.gpaRigorInteraction}`);

  if (heuristics.redFlags.critical.length > 0) {
    lines.push(`Critical Concerns: ${heuristics.redFlags.critical.join(', ')}`);
  }
  if (heuristics.redFlags.warning.length > 0) {
    lines.push(`Warnings: ${heuristics.redFlags.warning.join(', ')}`);
  }
  if (heuristics.commitment.concerningDrops.length > 0) {
    lines.push(`Concerning Drops: ${heuristics.commitment.concerningDrops.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN POSITIONER
// ============================================================================

export interface PositionerOptions {
  targetSelectivity?: 'top_10' | 'top_25' | 'top_50' | 'any';
  temperature?: number;
  maxRetries?: number;
}

export interface PositionerResult {
  success: boolean;
  positioning?: ContextualPositioning;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class ContextualPositioner {
  private readonly defaultTemperature = 0.6;
  private readonly maxRetries = 2;

  async analyze(
    input: AcademicHistoryInput,
    heuristics: HeuristicFoundation,
    options: PositionerOptions = {}
  ): Promise<PositionerResult> {
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const targetSelectivity = options.targetSelectivity ?? 'top_25';

    // Build the prompt
    const recordSummary = formatRecordSummary(input, heuristics);
    const schoolContext = formatSchoolContext(input);
    const heuristicSummary = formatHeuristicSummary(heuristics);
    const schoolType = input.schoolContext?.schoolType || 'public';

    const prompt = POSITIONING_PROMPT
      .replace('{recordSummary}', recordSummary)
      .replace('{schoolContext}', schoolContext)
      .replace('{heuristicSummary}', heuristicSummary)
      .replace('{schoolType}', schoolType)
      .replace('{targetSelectivity}', targetSelectivity)
      .replace('{intendedMajor}', input.intendedMajor || 'undeclared');

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await callUnifiedLLM<ContextualPositioning>(prompt, {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250514',
          temperature,
          maxTokens: 1500,
          systemPrompt:
            'You are an expert college admissions data analyst. Provide nuanced, contextual positioning. Respond only with valid JSON.',
          useJsonMode: true,
        });

        // Validate the response structure
        const positioning = this.validateAndNormalize(response.content);

        // Calculate cost (Sonnet pricing)
        const cost =
          (response.usage.input_tokens * 3) / 1_000_000 +
          (response.usage.output_tokens * 15) / 1_000_000;

        return {
          success: true,
          positioning,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cost,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[ContextualPositioner] Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error during contextual positioning',
    };
  }

  private validateAndNormalize(content: unknown): ContextualPositioning {
    if (!content || typeof content !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    const data = content as Record<string, unknown>;

    // Validate enums
    const validRigor: RelativeRigor[] = [
      'top_5%',
      'top_10%',
      'top_25%',
      'top_50%',
      'below_average',
    ];
    const validPerformance: RelativePerformance[] = [
      'exceptional',
      'strong',
      'solid',
      'mixed',
      'concerning',
    ];
    const validFit = ['strong', 'competitive', 'reach', 'significant_reach'] as const;

    const relativeRigor = validRigor.includes(data.relativeRigor as RelativeRigor)
      ? (data.relativeRigor as RelativeRigor)
      : 'top_50%';

    const relativePerformance = validPerformance.includes(
      data.relativePerformance as RelativePerformance
    )
      ? (data.relativePerformance as RelativePerformance)
      : 'solid';

    // Normalize opportunity utilization to 0-100
    let opportunityUtilization = 50;
    if (typeof data.opportunityUtilization === 'number') {
      opportunityUtilization = Math.max(0, Math.min(100, data.opportunityUtilization));
    }

    // Validate target school fit
    const targetFitData = data.targetSchoolFit as Record<string, unknown> | undefined;
    const targetSchoolFit = {
      topTier: validFit.includes(targetFitData?.topTier as (typeof validFit)[number])
        ? (targetFitData?.topTier as (typeof validFit)[number])
        : 'reach',
      midTier: validFit.includes(targetFitData?.midTier as (typeof validFit)[number])
        ? (targetFitData?.midTier as (typeof validFit)[number])
        : 'competitive',
      safetyTier: validFit.includes(targetFitData?.safetyTier as (typeof validFit)[number])
        ? (targetFitData?.safetyTier as (typeof validFit)[number])
        : 'strong',
    };

    return {
      relativeRigor,
      relativePerformance,
      opportunityUtilization,
      competitiveContext: String(
        data.competitiveContext || 'Unable to generate competitive context.'
      ),
      peerComparison: String(data.peerComparison || 'is in line with typical applicants.'),
      schoolTierAssessment: String(
        data.schoolTierAssessment || 'School context assessment unavailable.'
      ),
      targetSchoolFit,
    };
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const contextualPositioner = new ContextualPositioner();

export async function analyzeContextualPosition(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation,
  options?: PositionerOptions
): Promise<PositionerResult> {
  return contextualPositioner.analyze(input, heuristics, options);
}
