/**
 * Year & Subject Analyzer
 *
 * Generates deeply personalized analysis of:
 * - Section 3: Year-by-Year Analysis (like per-activity tables)
 * - Section 4: Subject Depth Analysis
 *
 * Creates detailed tables and assessments for each year and subject,
 * with specific course references and actionable insights.
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type { AcademicHistoryInput, HeuristicFoundation } from '../types';
import type {
  YearAnalysis,
  SubjectAnalysis,
  RigorRating,
  GradeRating,
  StoryContribution,
  YearStatus,
  DepthLevel,
  SubjectTrajectory,
  NarrativeFit,
  MajorRelevance,
} from './types';

// ============================================================================
// RESEARCH CONTEXT
// ============================================================================

const YEAR_WEIGHT_CONTEXT = `
YEAR WEIGHTING (from admissions research):
- Freshman: 15% weight - Foundation year, mistakes forgiven if corrected
- Sophomore: 22% weight - Expectations increase, patterns emerge
- Junior: 35% weight - MOST IMPORTANT - peak challenge year, most recent complete grades
- Senior: 28% weight - Watch for senioritis, mid-year report matters

KEY INSIGHT: A strong junior year with slight senior dip is better than
mediocre junior with strong senior (AOs trust completed grades over promises).
`;

const SUBJECT_DEPTH_CONTEXT = `
SUBJECT DEPTH EXPECTATIONS by major:

STEM MAJORS (CS, Engineering, Math, Physics):
- REQUIRED: Calc BC minimum, Physics strongly preferred
- EXPECTED: 4 years math progression, 3+ years science
- DIFFERENTIATING: Multivariable, Linear Algebra, research

PRE-MED / Biology:
- REQUIRED: Bio + Chem, ideally AP
- EXPECTED: Physics, strong math through Calc
- DIFFERENTIATING: AP Chem + Bio, research experience

HUMANITIES (English, History, Poli Sci):
- REQUIRED: Strong English progression
- EXPECTED: History APs, language depth
- DIFFERENTIATING: Philosophy, AP Language continuation

ECONOMICS / Business:
- REQUIRED: Strong math (Calc minimum)
- EXPECTED: Economics, Statistics
- DIFFERENTIATING: Math depth beyond Calc AB
`;

// ============================================================================
// PROMPT
// ============================================================================

const YEAR_SUBJECT_PROMPT = `You are a senior admissions officer conducting a detailed transcript review. Your task is to analyze this transcript YEAR BY YEAR and SUBJECT BY SUBJECT, providing the specific insights that will help this student understand exactly how their record reads.

${YEAR_WEIGHT_CONTEXT}

${SUBJECT_DEPTH_CONTEXT}

STUDENT TRANSCRIPT:
{formattedTranscript}

SCHOOL CONTEXT:
{schoolContext}

INTENDED MAJOR: {intendedMajor}

---

## TASK 1: YEAR-BY-YEAR ANALYSIS

For EACH year (Freshman, Sophomore, Junior, Senior), provide:

1. RIGOR UTILIZATION
   - Rating: maximized/strong/moderate/limited/concerning
   - How many APs taken vs available?
   - Did they challenge themselves appropriately for this year?

2. PERFORMANCE
   - GPA for this year
   - Rating: exceptional/strong/solid/mixed/concerning
   - How did they perform in their HARDEST courses this year?
   - Note specific courses and grades that matter

3. STORY CONTRIBUTION
   - Does this year help or hurt their narrative?
   - pillar: This year is central to their story
   - supports: This year adds to the narrative
   - neutral: Neither helps nor hurts
   - detracts: This year weakens their story

4. STATUS
   - ready: No explanation needed
   - needs_context: Should be explained in Additional Info
   - needs_addressing: Requires mitigation strategy
   - critical: Major concern requiring strong explanation

5. KEY MOMENT (if any)
   - Was there a pivotal decision or outcome this year?

## TASK 2: SUBJECT DEPTH ANALYSIS

For each major subject area (Math, Science, English, History/Social Studies, Language, CS if applicable), provide:

1. DEPTH LEVEL: exceptional/strong/adequate/surface/absent
2. TRAJECTORY: ascending/sustained_high/sustained/declining/flat
3. COURSE PROGRESSION: Show the path (e.g., "Honors → AP → Dual Enrollment")
4. NARRATIVE FIT: core_pillar/supports_story/neutral/disconnected/contradicts
5. MAJOR ALIGNMENT: required/recommended/complementary/irrelevant (for their intended major)
6. COMPETITIVE POSITION: Where does this depth place them among applicants?
7. RECOMMENDATION: What should they do about this subject?

Be SPECIFIC. Reference actual courses and grades. Generic analysis is useless.

---

Respond with JSON:
{
  "yearAnalysis": [
    {
      "year": "Freshman",
      "yearWeight": "15% (foundation year)",
      "rigorUtilization": {
        "rating": "string",
        "visualRating": "★★★★☆",
        "details": "string (specific courses taken)",
        "apsTaken": number,
        "apsAvailable": number or null,
        "utilizationPercent": number or null
      },
      "performance": {
        "gpa": number,
        "rating": "string",
        "underPressure": "string (how they did in hardest courses)",
        "notableCourses": [
          {"course": "string", "grade": "string", "significance": "string"}
        ]
      },
      "storyContribution": "string",
      "storyExplanation": "string",
      "status": "string",
      "statusExplanation": "string",
      "keyMoment": {"event": "string", "significance": "string"} or null
    }
  ],
  "subjectAnalysis": [
    {
      "subject": "Mathematics",
      "depthLevel": "string",
      "depthScore": number (0-5),
      "yearsOfStudy": number,
      "trajectory": "string",
      "highestLevel": "string (specific course)",
      "courseProgression": "string (e.g., 'Algebra 2 → Precalc → AP Calc BC → Multivariable')",
      "narrativeFit": "string",
      "narrativeExplanation": "string",
      "majorAlignment": "string",
      "majorAlignmentNote": "string",
      "competitivePosition": "string",
      "analysis": "string (detailed paragraph)",
      "recommendation": "string"
    }
  ]
}`;

// ============================================================================
// FORMATTERS
// ============================================================================

function formatTranscript(input: AcademicHistoryInput): string {
  const coursesByYear: Record<string, typeof input.courses> = {};

  for (const course of input.courses || []) {
    const year = course.year || 'Unknown';
    if (!coursesByYear[year]) {
      coursesByYear[year] = [];
    }
    coursesByYear[year].push(course);
  }

  const yearOrder = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
  let output = '';

  for (const year of yearOrder) {
    const courses = coursesByYear[year] || [];
    if (courses.length === 0) continue;

    output += `\n${year.toUpperCase()}:\n`;
    for (const course of courses) {
      const level = course.level || 'Standard';
      const grade = course.grade || 'N/A';
      output += `  • ${course.name} [${level}] - Grade: ${grade}\n`;
    }
  }

  return output;
}

function formatSchoolContext(input: AcademicHistoryInput): string {
  const ctx = input.schoolContext || {};
  return `School Type: ${ctx.schoolType || 'Public'}
AP Courses Offered: ${ctx.apCoursesOffered || 'Unknown'}
College Rate: ${ctx.collegeAttendanceRate || 'Unknown'}%`;
}

// ============================================================================
// ANALYZER
// ============================================================================

export interface YearSubjectResult {
  success: boolean;
  yearAnalysis?: YearAnalysis[];
  subjectAnalysis?: SubjectAnalysis[];
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class YearSubjectAnalyzer {
  async analyze(
    input: AcademicHistoryInput,
    heuristics: HeuristicFoundation
  ): Promise<YearSubjectResult> {
    const prompt = YEAR_SUBJECT_PROMPT
      .replace('{formattedTranscript}', formatTranscript(input))
      .replace('{schoolContext}', formatSchoolContext(input))
      .replace('{intendedMajor}', input.intendedMajor || 'Undeclared');

    try {
      const response = await callUnifiedLLM<{
        yearAnalysis: YearAnalysis[];
        subjectAnalysis: SubjectAnalysis[];
      }>(prompt, {
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250514',
        temperature: 0.6,
        maxTokens: 4000,
        systemPrompt:
          'You are a senior admissions officer providing detailed year-by-year and subject-by-subject transcript analysis. Be specific with courses and grades. Respond only with valid JSON.',
        useJsonMode: true,
      });

      const yearAnalysis = this.validateYearAnalysis(response.content.yearAnalysis);
      const subjectAnalysis = this.validateSubjectAnalysis(response.content.subjectAnalysis);

      const cost =
        (response.usage.input_tokens * 3) / 1_000_000 +
        (response.usage.output_tokens * 15) / 1_000_000;

      return {
        success: true,
        yearAnalysis,
        subjectAnalysis,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost,
        },
      };
    } catch (error) {
      console.error('[YearSubjectAnalyzer] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateYearAnalysis(data: unknown): YearAnalysis[] {
    if (!Array.isArray(data)) return [];

    const validRigor: RigorRating[] = ['maximized', 'strong', 'moderate', 'limited', 'concerning'];
    const validGrade: GradeRating[] = ['exceptional', 'strong', 'solid', 'mixed', 'concerning'];
    const validStory: StoryContribution[] = ['pillar', 'supports', 'neutral', 'detracts'];
    const validStatus: YearStatus[] = ['ready', 'needs_context', 'needs_addressing', 'critical'];

    return data.map((item: unknown) => {
      const raw = item as Record<string, unknown>;
      const rigor = raw.rigorUtilization as Record<string, unknown> | undefined;
      const perf = raw.performance as Record<string, unknown> | undefined;
      const keyMoment = raw.keyMoment as Record<string, unknown> | undefined;

      return {
        year: String(raw.year || ''),
        yearWeight: String(raw.yearWeight || ''),
        rigorUtilization: {
          rating: validRigor.includes(rigor?.rating as RigorRating)
            ? (rigor?.rating as RigorRating)
            : 'moderate',
          visualRating: String(rigor?.visualRating || '★★★☆☆'),
          details: String(rigor?.details || ''),
          apsTaken: typeof rigor?.apsTaken === 'number' ? rigor.apsTaken : 0,
          apsAvailable: typeof rigor?.apsAvailable === 'number' ? rigor.apsAvailable : null,
          utilizationPercent:
            typeof rigor?.utilizationPercent === 'number' ? rigor.utilizationPercent : null,
        },
        performance: {
          gpa: typeof perf?.gpa === 'number' ? perf.gpa : 0,
          rating: validGrade.includes(perf?.rating as GradeRating)
            ? (perf?.rating as GradeRating)
            : 'solid',
          underPressure: String(perf?.underPressure || ''),
          notableCourses: Array.isArray(perf?.notableCourses)
            ? perf.notableCourses.map((c: unknown) => {
                const course = c as Record<string, unknown>;
                return {
                  course: String(course.course || ''),
                  grade: String(course.grade || ''),
                  significance: String(course.significance || ''),
                };
              })
            : [],
        },
        storyContribution: validStory.includes(raw.storyContribution as StoryContribution)
          ? (raw.storyContribution as StoryContribution)
          : 'neutral',
        storyExplanation: String(raw.storyExplanation || ''),
        status: validStatus.includes(raw.status as YearStatus)
          ? (raw.status as YearStatus)
          : 'ready',
        statusExplanation: String(raw.statusExplanation || ''),
        keyMoment:
          keyMoment?.event
            ? {
                event: String(keyMoment.event),
                significance: String(keyMoment.significance || ''),
              }
            : undefined,
      };
    });
  }

  private validateSubjectAnalysis(data: unknown): SubjectAnalysis[] {
    if (!Array.isArray(data)) return [];

    const validDepth: DepthLevel[] = ['exceptional', 'strong', 'adequate', 'surface', 'absent'];
    const validTraj: SubjectTrajectory[] = [
      'ascending',
      'sustained_high',
      'sustained',
      'declining',
      'flat',
    ];
    const validFit: NarrativeFit[] = [
      'core_pillar',
      'supports_story',
      'neutral',
      'disconnected',
      'contradicts',
    ];
    const validMajor: MajorRelevance[] = ['required', 'recommended', 'complementary', 'irrelevant'];

    return data.map((item: unknown) => {
      const raw = item as Record<string, unknown>;

      return {
        subject: String(raw.subject || ''),
        depthLevel: validDepth.includes(raw.depthLevel as DepthLevel)
          ? (raw.depthLevel as DepthLevel)
          : 'adequate',
        depthScore: typeof raw.depthScore === 'number' ? Math.max(0, Math.min(5, raw.depthScore)) : 2.5,
        yearsOfStudy: typeof raw.yearsOfStudy === 'number' ? raw.yearsOfStudy : 0,
        trajectory: validTraj.includes(raw.trajectory as SubjectTrajectory)
          ? (raw.trajectory as SubjectTrajectory)
          : 'sustained',
        highestLevel: String(raw.highestLevel || ''),
        courseProgression: String(raw.courseProgression || ''),
        narrativeFit: validFit.includes(raw.narrativeFit as NarrativeFit)
          ? (raw.narrativeFit as NarrativeFit)
          : 'neutral',
        narrativeExplanation: String(raw.narrativeExplanation || ''),
        majorAlignment: raw.majorAlignment
          ? validMajor.includes(raw.majorAlignment as MajorRelevance)
            ? (raw.majorAlignment as MajorRelevance)
            : 'complementary'
          : undefined,
        majorAlignmentNote: raw.majorAlignmentNote ? String(raw.majorAlignmentNote) : undefined,
        competitivePosition: String(raw.competitivePosition || ''),
        analysis: String(raw.analysis || ''),
        recommendation: String(raw.recommendation || ''),
      };
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const yearSubjectAnalyzer = new YearSubjectAnalyzer();

export async function analyzeYearsAndSubjects(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation
): Promise<YearSubjectResult> {
  return yearSubjectAnalyzer.analyze(input, heuristics);
}
