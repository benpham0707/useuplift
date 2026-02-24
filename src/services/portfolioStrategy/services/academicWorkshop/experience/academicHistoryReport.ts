// @ts-nocheck
/**
 * Academic History Analysis Report
 *
 * Comprehensive analysis that focuses on what ACTUALLY matters:
 * - How admissions officers will read and evaluate this transcript
 * - What the numbers mean in context
 * - Where this student stands competitively
 * - What concerns might arise and how to address them
 *
 * NOT focused on "narrative" (academics don't have narratives to write)
 * FOCUSED on evaluation, interpretation, and actionable guidance.
 */

import { callUnifiedLLM } from '../../../../../lib/llm/unified';
import type { AcademicHistoryInput, HeuristicFoundation, HarvardScore } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface GradeDistribution {
  aRange: number;
  bRange: number;
  cOrBelow: number;
  concerningGrades: { course: string; grade: string; concern: string }[];
}

export interface GPAAnalysis {
  rawGPA: number;
  yearWeightedGPA: number;

  contextualInterpretation: {
    forSchoolType: string;
    forTargetSchools: string;
    comparedToAdmittedStudents: string;
  };

  trajectoryAssessment: {
    pattern: 'strong_ascending' | 'moderate_ascending' | 'stable_high' | 'stable_mid' | 'declining' | 'volatile';
    significance: string;
    admissionsImpact: string;
  };

  gradeDistribution: GradeDistribution;
}

export interface APAnalysis {
  apsTaken: number;
  apsAvailableAtSchool: number | null;
  utilizationRate: number | null;
  difficultyDistribution: {
    tier1Hardest: string[];
    tier2Hard: string[];
    tier3Medium: string[];
    tier4Easier: string[];
  };
  competitiveAssessment: string;
}

export interface RigorEvaluation {
  overallRigorLevel: 'maximum' | 'high' | 'above_average' | 'average' | 'below_average' | 'minimal';
  rigorScore: number;

  apAnalysis: APAnalysis;

  gpaRigorTradeoff: {
    pattern: 'chose_rigor' | 'balanced' | 'protected_gpa' | 'struggled_with_rigor' | 'unclear';
    admissionsRead: string;
    recommendation: string;
  };

  rigorByYear: {
    year: string;
    rigorLevel: string;
    courseHighlights: string[];
    assessment: string;
  }[];
}

export interface SubjectDepth {
  subject: string;
  depth: 'exceptional' | 'strong' | 'adequate' | 'weak' | 'absent';
  highestCourse: string;
  yearsStudied: number;
  analysis: string;
}

export interface MajorPreparation {
  intendedMajor: string;
  preparationScore: number;

  requiredCourses: {
    requirement: string;
    status: 'exceeded' | 'completed' | 'in_progress' | 'missing';
    yourCourse: string;
    grade?: string;
  }[];

  subjectDepths: SubjectDepth[];

  competitivePositioning: {
    amongMajorApplicants: string;
    strengthsForMajor: string[];
    gapsForMajor: string[];
  };

  credibilityAssessment: string;
}

export interface DetectedIssue {
  issue: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  evidence: string[];
  whatAOsThink: string;
  canBeExplained: boolean;
  howToAddress: string;
}

export interface RedFlagsAndConcerns {
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  detectedIssues: DetectedIssue[];
  absentConcerns: string[];
}

export interface AOQuestion {
  question: string;
  whyTheyreAsking: string;
  howToAnswer: string;
}

export interface AdmissionsOfficerPerspective {
  firstImpression: string;
  whatStandsOut: {
    positive: string[];
    negative: string[];
  };

  questionsAOsWillHave: AOQuestion[];

  howThisComparesToPool: {
    atTargetSchools: string;
    relativeStrengths: string[];
    relativeWeaknesses: string[];
  };

  predictedOutcome: {
    academicallyQualified: boolean;
    qualification: string;
    whatElseNeeded: string;
  };
}

export interface ActionableGuidance {
  forAdditionalInfo: {
    shouldExplain: string[];
    draftLanguage: { topic: string; suggestedText: string }[];
  };

  forCounselorLetter: string[];

  forInterviews: {
    anticipatedQuestions: string[];
    suggestedFraming: string[];
  };

  ifTimeRemains: {
    courseRecommendations: string[];
    testingRecommendations: string[];
  };
}

export interface ResearchDataPoint {
  dataPoint: string;
  source: string;
  applicationToYou: string;
}

export interface ResearchContext {
  relevantDataPoints: ResearchDataPoint[];
  whatAdmissionsOfficersSay: {
    quote: string;
    source: string;
    relevance: string;
  }[];
}

export interface AcademicHistoryReport {
  // Meta
  generatedAt: string;
  targetSchoolTier: 'ivy_plus' | 'top_20' | 'top_50' | 'state_flagship';

  // Executive Summary
  executiveSummary: {
    harvardScore: HarvardScore;
    oneSentenceRead: string;
    coreStrengths: string[];
    primaryConcerns: string[];
    bottomLine: string;
  };

  // Detailed Sections
  gpaAnalysis: GPAAnalysis;
  rigorEvaluation: RigorEvaluation;
  majorPreparation: MajorPreparation;
  redFlagsAndConcerns: RedFlagsAndConcerns;
  admissionsOfficerPerspective: AdmissionsOfficerPerspective;
  actionableGuidance: ActionableGuidance;
  researchContext: ResearchContext;

  // Cost tracking
  analysisMetadata: {
    totalCost: number;
    processingTimeMs: number;
  };
}

// ============================================================================
// RESEARCH CONTEXT TO INCLUDE IN PROMPT
// ============================================================================

const RESEARCH_BENCHMARKS = `
ADMISSIONS RESEARCH BENCHMARKS (use these in your analysis):

GPA BENCHMARKS:
- Harvard: 74% of admits had 4.0+ unweighted GPA
- MIT: Average admitted GPA is 4.17 weighted
- Top 20: Most admits have 3.8+ unweighted
- Average Harvard admit has ~8 APs

AP DIFFICULTY TIERS:
- Tier 1 (Hardest): Physics C E&M, Physics C Mechanics, Chemistry, Calculus BC
  (Pass rate <55%, Five rate 12-30%)
- Tier 2 (Hard): Biology, US History, English Literature, European History
- Tier 3 (Medium): Statistics, Psychology, CS A, Calculus AB
- Tier 4 (Easier): Environmental Science, Human Geography, CS Principles

YEAR WEIGHTING:
- Freshman: 15% weight
- Sophomore: 22% weight
- Junior: 35% weight (MOST IMPORTANT)
- Senior: 28% weight

KEY ADMISSIONS INSIGHTS:
- "We'd rather see a B in a rigorous course than an A in an easy one" — Common AO sentiment
- 22% of college rescissions involve senior year grade decline
- Two-stage model: Academic qualification eliminates 75-90%, then holistic review
`;

const MAJOR_REQUIREMENTS = `
MAJOR-SPECIFIC REQUIREMENTS:

COMPUTER SCIENCE / ENGINEERING:
- Required: Calculus (BC preferred), Physics
- Expected: AP CS A, strong math sequence
- Differentiating: Multivariable, Linear Algebra, research

PRE-MED / BIOLOGY:
- Required: Biology, Chemistry (both AP preferred)
- Expected: Physics, Calculus
- Differentiating: Research experience, both AP Bio + AP Chem

ECONOMICS / BUSINESS:
- Required: Strong math (Calc minimum)
- Expected: Statistics, Economics if offered
- Differentiating: Calc BC or beyond

HUMANITIES:
- Required: Strong English sequence
- Expected: History APs, language depth (4+ years)
- Differentiating: AP Lit + AP Lang, philosophy
`;

// ============================================================================
// MAIN PROMPT
// ============================================================================

const COMPREHENSIVE_ANALYSIS_PROMPT = `You are a senior admissions officer at a highly selective university. You've read thousands of transcripts and know exactly how admissions committees evaluate academic records.

Your task is to provide a COMPREHENSIVE analysis of this student's academic history - not generic feedback, but specific insights into what their record MEANS and how it will be EVALUATED.

${RESEARCH_BENCHMARKS}

${MAJOR_REQUIREMENTS}

---

STUDENT TRANSCRIPT:
{formattedTranscript}

SCHOOL CONTEXT:
- Type: {schoolType}
- AP Courses Offered: {apsOffered}
- College Attendance Rate: {collegeRate}%
{schoolNotes}

INTENDED MAJOR: {intendedMajor}
TARGET SCHOOL TIER: {targetTier}

HEURISTIC DATA:
{heuristicSummary}

---

Provide a comprehensive analysis with these sections:

## 1. EXECUTIVE SUMMARY
- Harvard Score (1-6 scale, with 1 being exceptional)
- One-sentence read: "This is a student who..."
- 2-3 core strengths (specific, not generic)
- 2-3 primary concerns (if any)
- Bottom line assessment for target school tier

## 2. GPA ANALYSIS
- What does this GPA mean IN CONTEXT?
- How does trajectory affect interpretation?
- Any concerning grades? What do they signal?
- Comparison to typical admits at target schools

## 3. RIGOR EVALUATION
- How challenging was this courseload RELATIVE TO AVAILABILITY?
- AP difficulty breakdown (how many Tier 1/2 vs Tier 3/4?)
- GPA-Rigor tradeoff analysis: Did they protect GPA or chase rigor?
- Year-by-year rigor assessment

## 4. MAJOR PREPARATION
- How well prepared for intended major?
- Required courses: completed/missing?
- Subject depth in relevant areas
- Competitive position among applicants for this major

## 5. RED FLAGS & CONCERNS
- What issues might AOs flag?
- Severity of each issue
- Can it be explained? How?
- What's NOT a concern (good news)?

## 6. ADMISSIONS OFFICER PERSPECTIVE
- First impression when reading this transcript
- What stands out (positive and negative)?
- Questions AOs will have
- How this compares to the applicant pool
- Is this student academically qualified? What else do they need?

## 7. ACTIONABLE GUIDANCE
- What should be explained in Additional Information?
- DRAFT LANGUAGE for explanations (actual sentences they can use)
- What should counselor letter mention?
- Interview prep: anticipated questions

## 8. RESEARCH CONTEXT
- 2-3 relevant data points with sources
- 1-2 admissions officer quotes that apply

BE SPECIFIC. Reference actual courses and grades. Generic statements like "strong academics" are useless. Tell them exactly what their record means.

Respond with JSON matching the AcademicHistoryReport structure.`;

// ============================================================================
// FORMATTERS
// ============================================================================

function formatTranscript(input: AcademicHistoryInput): string {
  const coursesByYear: Record<string, typeof input.courses> = {};

  for (const course of input.courses || []) {
    const year = course.year || 'Unknown';
    if (!coursesByYear[year]) coursesByYear[year] = [];
    coursesByYear[year].push(course);
  }

  const yearOrder = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
  let output = '';

  for (const year of yearOrder) {
    const courses = coursesByYear[year] || [];
    if (courses.length === 0) continue;

    const apCount = courses.filter((c) => (c.level || '').toLowerCase().includes('ap')).length;
    output += `\n${year.toUpperCase()} (${apCount} AP courses):\n`;

    for (const course of courses) {
      output += `  • ${course.name} [${course.level || 'Standard'}] - ${course.grade || 'N/A'}\n`;
    }
  }

  return output;
}

function formatHeuristics(h: HeuristicFoundation): string {
  return `GPA: ${h.rawMetrics.avgGPA.toFixed(2)} (Year-weighted: ${h.trajectory.yearWeightedGPA.toFixed(2)})
Trajectory: ${h.trajectory.gpaTrajectoryType}
AP Courses: ${h.rawMetrics.apCourses}
Honors Courses: ${h.rawMetrics.honorsCourses}
Rigor Trend: ${h.trajectory.rigorTrajectoryType}
${h.redFlags.critical.length > 0 ? `Critical Flags: ${h.redFlags.critical.join(', ')}` : ''}
${h.redFlags.warning.length > 0 ? `Warnings: ${h.redFlags.warning.join(', ')}` : ''}`;
}

// ============================================================================
// ANALYZER
// ============================================================================

export interface AnalysisReportResult {
  success: boolean;
  report?: AcademicHistoryReport;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export class AcademicHistoryReportGenerator {
  async generate(
    input: AcademicHistoryInput,
    heuristics: HeuristicFoundation,
    targetTier: 'ivy_plus' | 'top_20' | 'top_50' | 'state_flagship' = 'top_20'
  ): Promise<AnalysisReportResult> {
    const startTime = Date.now();

    const ctx = input.schoolContext || {};
    const prompt = COMPREHENSIVE_ANALYSIS_PROMPT
      .replace('{formattedTranscript}', formatTranscript(input))
      .replace('{schoolType}', ctx.schoolType || 'Public')
      .replace('{apsOffered}', String(ctx.apCoursesOffered || 'Unknown'))
      .replace('{collegeRate}', String(ctx.collegeAttendanceRate || 'Unknown'))
      .replace('{schoolNotes}', ctx.notes || '')
      .replace('{intendedMajor}', input.intendedMajor || 'Undeclared')
      .replace('{targetTier}', targetTier)
      .replace('{heuristicSummary}', formatHeuristics(heuristics));

    try {
      const response = await callUnifiedLLM<AcademicHistoryReport>(prompt, {
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.6,
        maxTokens: 6000,
        systemPrompt: `You are a senior admissions officer providing comprehensive transcript analysis.
Be SPECIFIC - reference actual courses and grades.
Generic feedback is useless; tell them exactly what their record means and how it will be evaluated.
Respond only with valid JSON.`,
        useJsonMode: true,
      });

      const cost =
        (response.usage.input_tokens * 3) / 1_000_000 +
        (response.usage.output_tokens * 15) / 1_000_000;

      const report = this.validateAndComplete(response.content, heuristics, targetTier, cost, Date.now() - startTime);

      return {
        success: true,
        report,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost,
        },
      };
    } catch (error) {
      console.error('[AcademicHistoryReportGenerator] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateAndComplete(
    data: unknown,
    heuristics: HeuristicFoundation,
    targetTier: string,
    cost: number,
    timeMs: number
  ): AcademicHistoryReport {
    const raw = data as Record<string, unknown>;

    // Deep validation would go here - for now, trust LLM output structure
    // and add metadata
    return {
      ...(raw as AcademicHistoryReport),
      generatedAt: new Date().toISOString(),
      targetSchoolTier: targetTier as AcademicHistoryReport['targetSchoolTier'],
      analysisMetadata: {
        totalCost: cost,
        processingTimeMs: timeMs,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicHistoryReportGenerator = new AcademicHistoryReportGenerator();

export async function generateAcademicHistoryReport(
  input: AcademicHistoryInput,
  heuristics: HeuristicFoundation,
  targetTier?: 'ivy_plus' | 'top_20' | 'top_50' | 'state_flagship'
): Promise<AnalysisReportResult> {
  return academicHistoryReportGenerator.generate(input, heuristics, targetTier);
}
