// @ts-nocheck
/**
 * Academic Spike & Narrative Analyzer
 *
 * Generates deeply personalized analysis of:
 * - Section 1: Academic Spike Assessment
 * - Section 2: Transcript Narrative Quality
 *
 * This analyzer identifies the distinctive academic pattern and tells
 * the story of the transcript, not just reporting scores.
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type { AcademicHistoryInput, HeuristicFoundation } from '../types';
import type {
  AcademicSpikeAssessment,
  TranscriptNarrative,
  AcademicSpikeType,
} from './types';

// ============================================================================
// PROMPT
// ============================================================================

const SPIKE_NARRATIVE_PROMPT = `You are a senior admissions officer at Harvard with 20 years of experience reading transcripts. You're known for your ability to quickly identify what makes a student DISTINCTIVE academically and what story their transcript tells.

Unlike basic transcript reviews, you look for PATTERNS that reveal character, priorities, and intellectual identity. You read transcripts like stories, not spreadsheets.

STUDENT TRANSCRIPT:
{formattedTranscript}

SCHOOL CONTEXT:
{schoolContext}

INTENDED MAJOR: {intendedMajor}

HEURISTIC SUMMARY:
{heuristicSummary}

---

ANALYSIS TASK: Provide two deeply personalized assessments.

## PART 1: ACADEMIC SPIKE ASSESSMENT

Identify the student's distinctive academic pattern. Not every student has a spike—if there isn't one, say so honestly.

Spike Types:
- "intellectual_explorer": Curiosity-driven exploration across domains, unusual course combinations
- "depth_specialist": Deep expertise in specific area, 3-4+ years of progression in one field
- "rising_star": Dramatic improvement trajectory, significant growth visible
- "balanced_achiever": Consistent excellence across all subjects, no weak areas
- "strategic_optimizer": Calculated course selection, efficiency-focused
- "passionate_specialist": Clear passion in narrow area, activities + courses align
- "no_clear_spike": No distinctive pattern emerges

For your assessment, consider:
- What would make THIS student memorable compared to 10,000 other applicants?
- What story does an AO tell their committee about this student?
- Is this pattern distinctive or common?

## PART 2: TRANSCRIPT NARRATIVE QUALITY

Every transcript tells a story. What story does THIS transcript tell?

Analyze:
1. THE ACADEMIC STORY - One sentence summary (like "Builder of mathematical ecosystems")
2. WHAT'S WORKING - 2-3 patterns that create a compelling narrative
3. WHERE STORY BREAKS DOWN - 2-3 elements that weaken or contradict the narrative
4. CURRENT READ vs STRONGER FRAME - How it reads now vs how it could be positioned

Be SPECIFIC. Reference actual courses, grades, and patterns. Generic feedback is useless.

Bad example: "You have good grades and challenging courses."
Good example: "Your progression from Honors Precalc to AP Calc BC to Multivariable demonstrates not just capability but mathematical appetite—most students plateau after AP Calc BC."

---

Respond with JSON matching this structure:
{
  "spikeAssessment": {
    "spikeType": "string (one of the types above)",
    "spikeDescription": "string (2-3 sentences about what makes this student distinctive)",
    "admissionsOfficerRead": "string (what AOs will see/remember, in quotes)",
    "distinctiveness": "highly_distinctive|moderately_distinctive|common|concerning",
    "distinctivenessExplanation": "string (why this level of distinctiveness)",
    "competitiveAdvantage": "string (how this spike helps in admissions)"
  },
  "transcriptNarrative": {
    "score": number (0-10),
    "academicStory": "string (one-line brand/identity)",
    "narrativeArcAnalysis": {
      "whatsWorking": [
        {
          "pattern": "string (name of the pattern)",
          "evidence": ["string (specific courses/grades)", "string"],
          "whyItMatters": "string (admissions significance)"
        }
      ],
      "whereStoryBreaksDown": [
        {
          "issue": "string (name of the issue)",
          "evidence": ["string (specific evidence)", "string"],
          "howToAddress": "string (mitigation strategy)",
          "severity": "critical|moderate|minor"
        }
      ]
    },
    "currentRead": "string (how the transcript currently reads to AOs)",
    "strongerFrame": "string (how it could be positioned more effectively)",
    "transformationAdvice": "string (how to shift from current to stronger)"
  }
}`;

// ============================================================================
// FORMATTERS
// ============================================================================

function formatTranscriptForPrompt(input: AcademicHistoryInput): string {
  const coursesByYear: Record<string, typeof input.courses> = {};

  for (const course of input.courses || []) {
    const year = course.year || 'Unknown';
    if (!coursesByYear[year]) {
      coursesByYear[year] = [];
    }
    coursesByYear[year].push(course);
  }

  const yearOrder = ['Freshman', 'Sophomore', 'Junior', 'Senior', '9th', '10th', '11th', '12th'];
  const sortedYears = Object.keys(coursesByYear).sort((a, b) => {
    const aIdx = yearOrder.findIndex((y) => a.toLowerCase().includes(y.toLowerCase()));
    const bIdx = yearOrder.findIndex((y) => b.toLowerCase().includes(y.toLowerCase()));
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  let output = '';
  for (const year of sortedYears) {
    const courses = coursesByYear[year];
    const apCount = courses.filter((c) =>
      (c.level || '').toLowerCase().includes('ap')
    ).length;
    const honorsCount = courses.filter((c) =>
      (c.level || '').toLowerCase().includes('honors')
    ).length;

    output += `\n${year.toUpperCase()} (${apCount} AP, ${honorsCount} Honors):\n`;

    for (const course of courses) {
      const level = course.level || 'Standard';
      const grade = course.grade || 'N/A';
      output += `  • ${course.name} [${level}] - ${grade}\n`;
    }
  }

  return output;
}

function formatSchoolContext(input: AcademicHistoryInput): string {
  const ctx = input.schoolContext || {};
  const lines: string[] = [];

  lines.push(`School Type: ${ctx.schoolType || 'Public (assumed)'}`);
  lines.push(`AP Courses Offered: ${ctx.apCoursesOffered || 'Unknown'}`);
  lines.push(`College Attendance Rate: ${ctx.collegeAttendanceRate || 'Unknown'}%`);

  if (ctx.competitiveRanking) {
    lines.push(`Ranking: ${ctx.competitiveRanking}`);
  }
  if (ctx.notes) {
    lines.push(`Notes: ${ctx.notes}`);
  }

  return lines.join('\n');
}

function formatHeuristicSummary(heuristics: HeuristicFoundation): string {
  const lines: string[] = [];

  lines.push(`Total Courses: ${heuristics.rawMetrics.totalCourses}`);
  lines.push(`AP Courses: ${heuristics.rawMetrics.apCourses}`);
  lines.push(`IB Courses: ${heuristics.rawMetrics.ibCourses}`);
  lines.push(`Honors Courses: ${heuristics.rawMetrics.honorsCourses}`);
  lines.push(`Overall GPA: ${heuristics.rawMetrics.avgGPA.toFixed(2)}`);
  lines.push(`Year-Weighted GPA: ${heuristics.trajectory.yearWeightedGPA.toFixed(2)}`);
  lines.push(`GPA Trajectory: ${heuristics.trajectory.gpaTrajectoryType}`);
  lines.push(`Rigor Trajectory: ${heuristics.trajectory.rigorTrajectoryType}`);

  if (heuristics.commitment.sustainedSequences > 0) {
    lines.push(`Sustained Sequences: ${heuristics.commitment.sustainedSequences}`);
    lines.push(`Deep Dives: ${heuristics.commitment.deepDives.join(', ')}`);
  }

  if (heuristics.redFlags.critical.length > 0) {
    lines.push(`Critical Flags: ${heuristics.redFlags.critical.join(', ')}`);
  }
  if (heuristics.redFlags.warning.length > 0) {
    lines.push(`Warnings: ${heuristics.redFlags.warning.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// ANALYZER
// ============================================================================

export interface SpikeNarrativeResult {
  success: boolean;
  spike?: AcademicSpikeAssessment;
  narrative?: TranscriptNarrative;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class SpikeNarrativeAnalyzer {
  async analyze(
    input: AcademicHistoryInput,
    heuristics: HeuristicFoundation
  ): Promise<SpikeNarrativeResult> {
    const prompt = SPIKE_NARRATIVE_PROMPT
      .replace('{formattedTranscript}', formatTranscriptForPrompt(input))
      .replace('{schoolContext}', formatSchoolContext(input))
      .replace('{intendedMajor}', input.intendedMajor || 'Undeclared')
      .replace('{heuristicSummary}', formatHeuristicSummary(heuristics));

    try {
      const response = await callUnifiedLLM<{
        spikeAssessment: AcademicSpikeAssessment;
        transcriptNarrative: TranscriptNarrative;
      }>(prompt, {
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.7,
        maxTokens: 3000,
        systemPrompt:
          'You are a senior Harvard admissions officer providing deeply personalized transcript analysis. Be specific—reference actual courses and grades. Generic feedback is useless. Respond only with valid JSON.',
        useJsonMode: true,
      });

      const data = response.content;

      // Validate and normalize
      const spike = this.validateSpike(data.spikeAssessment);
      const narrative = this.validateNarrative(data.transcriptNarrative);

      const cost =
        (response.usage.input_tokens * 3) / 1_000_000 +
        (response.usage.output_tokens * 15) / 1_000_000;

      return {
        success: true,
        spike,
        narrative,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost,
        },
      };
    } catch (error) {
      console.error('[SpikeNarrativeAnalyzer] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateSpike(data: unknown): AcademicSpikeAssessment {
    const raw = data as Record<string, unknown>;

    const validTypes: AcademicSpikeType[] = [
      'intellectual_explorer',
      'depth_specialist',
      'rising_star',
      'balanced_achiever',
      'strategic_optimizer',
      'passionate_specialist',
      'no_clear_spike',
    ];

    const validDistinctiveness = [
      'highly_distinctive',
      'moderately_distinctive',
      'common',
      'concerning',
    ] as const;

    return {
      spikeType: validTypes.includes(raw.spikeType as AcademicSpikeType)
        ? (raw.spikeType as AcademicSpikeType)
        : 'no_clear_spike',
      spikeDescription: String(raw.spikeDescription || 'Unable to determine distinctive pattern.'),
      admissionsOfficerRead: String(raw.admissionsOfficerRead || 'No clear read.'),
      distinctiveness: validDistinctiveness.includes(
        raw.distinctiveness as (typeof validDistinctiveness)[number]
      )
        ? (raw.distinctiveness as (typeof validDistinctiveness)[number])
        : 'common',
      distinctivenessExplanation: String(raw.distinctivenessExplanation || ''),
      competitiveAdvantage: String(raw.competitiveAdvantage || ''),
    };
  }

  private validateNarrative(data: unknown): TranscriptNarrative {
    const raw = data as Record<string, unknown>;
    const arc = raw.narrativeArcAnalysis as Record<string, unknown> | undefined;

    return {
      score: typeof raw.score === 'number' ? Math.max(0, Math.min(10, raw.score)) : 5,
      academicStory: String(raw.academicStory || 'Academic story unclear.'),
      narrativeArcAnalysis: {
        whatsWorking: Array.isArray(arc?.whatsWorking)
          ? arc.whatsWorking.map((w: unknown) => {
              const item = w as Record<string, unknown>;
              return {
                pattern: String(item.pattern || ''),
                evidence: Array.isArray(item.evidence) ? item.evidence.map(String) : [],
                whyItMatters: String(item.whyItMatters || ''),
              };
            })
          : [],
        whereStoryBreaksDown: Array.isArray(arc?.whereStoryBreaksDown)
          ? arc.whereStoryBreaksDown.map((b: unknown) => {
              const item = b as Record<string, unknown>;
              return {
                issue: String(item.issue || ''),
                evidence: Array.isArray(item.evidence) ? item.evidence.map(String) : [],
                howToAddress: String(item.howToAddress || ''),
                severity: ['critical', 'moderate', 'minor'].includes(item.severity as string)
                  ? (item.severity as 'critical' | 'moderate' | 'minor')
                  : 'moderate',
              };
            })
          : [],
      },
      currentRead: String(raw.currentRead || 'Current read unclear.'),
      strongerFrame: String(raw.strongerFrame || 'Stronger frame not determined.'),
      transformationAdvice: String(raw.transformationAdvice || ''),
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const spikeNarrativeAnalyzer = new SpikeNarrativeAnalyzer();

export async function analyzeSpikeAndNarrative(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation
): Promise<SpikeNarrativeResult> {
  return spikeNarrativeAnalyzer.analyze(input, heuristics);
}
