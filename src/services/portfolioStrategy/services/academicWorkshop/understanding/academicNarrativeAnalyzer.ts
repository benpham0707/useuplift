/**
 * Academic Narrative Analyzer (Layer 3a)
 *
 * Extracts the STORY behind an academic record using LLM understanding.
 * Unlike pattern matching, this service understands context, nuance,
 * and the human story embedded in course choices and grades.
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type {
  AcademicHistoryInput,
  AcademicNarrativeAnalysis,
  NarrativeType,
  KeyMoment,
  CharacterTrait,
  PassionSignal,
  RedNarrative,
  HeuristicFoundation,
} from '../types';

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

const NARRATIVE_ANALYSIS_PROMPT = `You are an expert college admissions counselor with 20+ years of experience reading academic transcripts. Your role is to extract the STORY behind the numbers - what does this academic record reveal about who this student is?

Unlike pattern-matching systems, you understand context, nuance, and the human story embedded in course choices and grades. You read transcripts like narratives, not spreadsheets.

STUDENT ACADEMIC RECORD:
{formattedCourses}

SCHOOL CONTEXT:
- School type: {schoolType}
- Available AP courses: {apCount}
- College attendance rate: {collegeRate}%
{schoolNotes}

INTENDED MAJOR: {intendedMajor}

HEURISTIC SIGNALS (use as input, not as conclusions):
{heuristicSummary}

TASK: Read this transcript like a story. What narrative emerges?

Analyze the following:

1. NARRATIVE TYPE
Which archetype best captures this student's academic journey?
- "rising_star": Started weaker but now excelling - shows growth mindset
- "consistent_excellence": Always at or near the top - reliable high performer
- "late_bloomer": Junior/Senior surge - found their stride later
- "struggling_fighter": Challenges visible but effort evident - resilience
- "strategic_scholar": Calculated, optimized approach - may be too safe
- "passion_driven": Depth over breadth - clear intellectual interests
- "unfocused": No clear direction - concerning lack of purpose
- "gpa_protector": Avoiding challenge for grades - prioritizing metrics over learning

2. KEY MOMENTS (2-4 pivotal moments)
What course choices, grade changes, or patterns reveal something important?
- What decisions tell us about character?
- Where do you see turning points?
- What patterns break and why might that be?

3. CHARACTER TRAITS REVEALED
Based on the transcript, what can we infer about:
- Work ethic (evidence of sustained effort?)
- Intellectual curiosity (going beyond requirements?)
- Risk tolerance (willing to take challenging courses?)
- Self-awareness (course choices match strengths?)
- Growth mindset (improving after setbacks?)

For each trait, cite specific evidence from the transcript.

4. PASSION SIGNALS
Where do you see genuine intellectual engagement?
- Subject areas showing clear sustained interest
- Evidence of going beyond requirements
- Depth patterns (multiple years, multiple courses in an area)
Rate confidence 0-100 for each identified passion.

5. CONTEXT UTILIZATION
Given what was available at their school, how well did this student use their opportunities?
- "maximized": Took every challenging opportunity available, created more
- "good": Used most opportunities well
- "moderate": Average utilization of available resources
- "underutilized": Left significant opportunities on the table

6. RED NARRATIVES
What concerning stories might an admissions officer construct from this record?
- GPA protection patterns (dropping after struggles, avoiding hard courses)
- Rigor avoidance
- Unexplained inconsistencies
- Passion vs practice mismatches (says they love X but avoided X courses)

For each, also note potential mitigating context.

Respond with a JSON object matching this structure:
{
  "narrativeType": "string (one of the types above)",
  "narrativeSummary": "string (2-3 sentence summary of the academic story)",
  "keyMoments": [
    { "year": "string", "event": "string", "significance": "string" }
  ],
  "characterTraits": [
    { "trait": "string", "evidence": "string", "strength": "strong|moderate|weak" }
  ],
  "passionSignals": [
    { "subject": "string", "indicators": ["string"], "confidence": number }
  ],
  "contextUtilization": "maximized|good|moderate|underutilized",
  "redNarratives": [
    { "issue": "string", "context": "string", "mitigation": "string (optional)" }
  ]
}`;

// ============================================================================
// FORMATTER HELPERS
// ============================================================================

function formatCoursesForPrompt(input: AcademicHistoryInput): string {
  const coursesByYear: Record<string, typeof input.courses> = {};

  for (const course of input.courses) {
    const year = course.year || 'Unknown';
    if (!coursesByYear[year]) {
      coursesByYear[year] = [];
    }
    coursesByYear[year].push(course);
  }

  const yearOrder = ['Freshman', 'Sophomore', 'Junior', 'Senior', '9th', '10th', '11th', '12th'];

  const sortedYears = Object.keys(coursesByYear).sort((a, b) => {
    const aIndex = yearOrder.findIndex((y) => a.toLowerCase().includes(y.toLowerCase()));
    const bIndex = yearOrder.findIndex((y) => b.toLowerCase().includes(y.toLowerCase()));
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  let formatted = '';
  for (const year of sortedYears) {
    formatted += `\n${year}:\n`;
    for (const course of coursesByYear[year]) {
      const level = course.level || 'Standard';
      const grade = course.grade || 'N/A';
      formatted += `  - ${course.name} (${level}) - Grade: ${grade}\n`;
    }
  }

  return formatted;
}

function formatHeuristicSummary(heuristics: HeuristicFoundation): string {
  const lines: string[] = [];

  lines.push(`GPA Trajectory: ${heuristics.trajectory.gpaTrajectoryType}`);
  lines.push(`Rigor Trajectory: ${heuristics.trajectory.rigorTrajectoryType}`);
  lines.push(`Year-Weighted GPA: ${heuristics.trajectory.yearWeightedGPA.toFixed(2)}`);

  if (heuristics.redFlags.critical.length > 0) {
    lines.push(`Critical Flags: ${heuristics.redFlags.critical.join(', ')}`);
  }
  if (heuristics.redFlags.warning.length > 0) {
    lines.push(`Warnings: ${heuristics.redFlags.warning.join(', ')}`);
  }

  if (heuristics.commitment.sustainedSequences > 0) {
    lines.push(`Sustained Subject Sequences: ${heuristics.commitment.sustainedSequences}`);
  }
  if (heuristics.commitment.deepDives.length > 0) {
    lines.push(`Deep Dives: ${heuristics.commitment.deepDives.join(', ')}`);
  }

  lines.push(`Major Alignment: ${heuristics.majorAlignment.alignmentScore}%`);

  lines.push(`\nRaw Metrics:`);
  lines.push(`  Total Courses: ${heuristics.rawMetrics.totalCourses}`);
  lines.push(`  AP Courses: ${heuristics.rawMetrics.apCourses}`);
  lines.push(`  Honors Courses: ${heuristics.rawMetrics.honorsCourses}`);
  lines.push(`  Average GPA: ${heuristics.rawMetrics.avgGPA.toFixed(2)}`);

  return lines.join('\n');
}

// ============================================================================
// MAIN ANALYZER
// ============================================================================

export interface NarrativeAnalyzerOptions {
  temperature?: number;
  maxRetries?: number;
}

export interface NarrativeAnalyzerResult {
  success: boolean;
  analysis?: AcademicNarrativeAnalysis;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class AcademicNarrativeAnalyzer {
  private readonly defaultTemperature = 0.7;
  private readonly maxRetries = 2;

  async analyze(
    input: AcademicHistoryInput,
    heuristics: HeuristicFoundation,
    options: NarrativeAnalyzerOptions = {}
  ): Promise<NarrativeAnalyzerResult> {
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxRetries = options.maxRetries ?? this.maxRetries;

    // Build the prompt
    const formattedCourses = formatCoursesForPrompt(input);
    const schoolContext = input.schoolContext || {};
    const heuristicSummary = formatHeuristicSummary(heuristics);

    const prompt = NARRATIVE_ANALYSIS_PROMPT
      .replace('{formattedCourses}', formattedCourses)
      .replace('{schoolType}', schoolContext.schoolType || 'Public')
      .replace('{apCount}', String(schoolContext.apCoursesOffered || 'Unknown'))
      .replace('{collegeRate}', String(schoolContext.collegeAttendanceRate || 'Unknown'))
      .replace('{schoolNotes}', schoolContext.notes || '')
      .replace('{intendedMajor}', input.intendedMajor || 'Undeclared')
      .replace('{heuristicSummary}', heuristicSummary);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await callUnifiedLLM<AcademicNarrativeAnalysis>(prompt, {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250514',
          temperature,
          maxTokens: 2000,
          systemPrompt:
            'You are an expert college admissions counselor specializing in academic record analysis. Respond only with valid JSON.',
          useJsonMode: true,
        });

        // Validate the response structure
        const analysis = this.validateAndNormalize(response.content);

        // Calculate cost (Sonnet pricing: $3/1M input, $15/1M output)
        const cost =
          (response.usage.input_tokens * 3) / 1_000_000 +
          (response.usage.output_tokens * 15) / 1_000_000;

        return {
          success: true,
          analysis,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cost,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[NarrativeAnalyzer] Attempt ${attempt + 1} failed:`, lastError.message);

        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error during narrative analysis',
    };
  }

  private validateAndNormalize(content: unknown): AcademicNarrativeAnalysis {
    if (!content || typeof content !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    const data = content as Record<string, unknown>;

    // Validate narrative type
    const validNarrativeTypes: NarrativeType[] = [
      'rising_star',
      'consistent_excellence',
      'late_bloomer',
      'struggling_fighter',
      'strategic_scholar',
      'passion_driven',
      'unfocused',
      'gpa_protector',
    ];

    const narrativeType = validNarrativeTypes.includes(data.narrativeType as NarrativeType)
      ? (data.narrativeType as NarrativeType)
      : 'unfocused';

    // Validate and normalize arrays
    const keyMoments: KeyMoment[] = Array.isArray(data.keyMoments)
      ? data.keyMoments.map((m: unknown) => {
          const moment = m as Record<string, unknown>;
          return {
            year: String(moment.year || ''),
            event: String(moment.event || ''),
            significance: String(moment.significance || ''),
          };
        })
      : [];

    const characterTraits: CharacterTrait[] = Array.isArray(data.characterTraits)
      ? data.characterTraits.map((t: unknown) => {
          const trait = t as Record<string, unknown>;
          return {
            trait: String(trait.trait || ''),
            evidence: String(trait.evidence || ''),
            strength: (['strong', 'moderate', 'weak'].includes(trait.strength as string)
              ? trait.strength
              : 'moderate') as 'strong' | 'moderate' | 'weak',
          };
        })
      : [];

    const passionSignals: PassionSignal[] = Array.isArray(data.passionSignals)
      ? data.passionSignals.map((p: unknown) => {
          const passion = p as Record<string, unknown>;
          return {
            subject: String(passion.subject || ''),
            indicators: Array.isArray(passion.indicators)
              ? passion.indicators.map(String)
              : [],
            confidence: typeof passion.confidence === 'number' ? passion.confidence : 50,
          };
        })
      : [];

    const redNarratives: RedNarrative[] = Array.isArray(data.redNarratives)
      ? data.redNarratives.map((r: unknown) => {
          const red = r as Record<string, unknown>;
          return {
            issue: String(red.issue || ''),
            context: String(red.context || ''),
            mitigation: red.mitigation ? String(red.mitigation) : undefined,
          };
        })
      : [];

    const validContextUtilization = ['maximized', 'good', 'moderate', 'underutilized'];
    const contextUtilization = validContextUtilization.includes(
      data.contextUtilization as string
    )
      ? (data.contextUtilization as 'maximized' | 'good' | 'moderate' | 'underutilized')
      : 'moderate';

    return {
      narrativeType,
      narrativeSummary: String(data.narrativeSummary || 'Unable to generate summary.'),
      keyMoments,
      characterTraits,
      passionSignals,
      contextUtilization,
      redNarratives,
    };
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE EXPORT
// ============================================================================

export const academicNarrativeAnalyzer = new AcademicNarrativeAnalyzer();

export async function analyzeAcademicNarrative(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation,
  options?: NarrativeAnalyzerOptions
): Promise<NarrativeAnalyzerResult> {
  return academicNarrativeAnalyzer.analyze(input, heuristics, options);
}
