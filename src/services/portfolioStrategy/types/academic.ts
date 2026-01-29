/**
 * Academic Evaluation Types
 *
 * Comprehensive type definitions for academic profile assessment.
 * These types support deep analysis of GPA, course rigor, testing,
 * and school-specific benchmarking.
 */

// ============================================================================
// CORE ACADEMIC TYPES
// ============================================================================

/**
 * Overall academic strength tier
 * Based on holistic assessment of all academic factors
 */
export type AcademicTier =
  | 'exceptional'    // Top 1% - Perfect/near-perfect across all metrics
  | 'strong'         // Top 5% - Excellent with minor gaps
  | 'competitive'    // Top 15% - Solid profile, competitive at selective schools
  | 'developing'     // Top 30% - Good foundation, room for improvement
  | 'needs_work';    // Below top 30% - Significant gaps to address

/**
 * GPA type classification
 */
export type GPAType = 'unweighted' | 'weighted' | 'uc_capped' | 'uc_uncapped';

/**
 * GPA scale used by the school
 */
export type GPAScale = '4.0' | '5.0' | '6.0' | '100' | 'other';

/**
 * Grade trend direction
 */
export type GradeTrend = 'strong_upward' | 'upward' | 'stable' | 'downward' | 'strong_downward';

/**
 * Test score policy at a school
 */
export type TestPolicy = 'required' | 'optional' | 'test_blind' | 'test_flexible';

/**
 * Class rank reporting method
 */
export type RankReportingMethod = 'exact' | 'decile' | 'quartile' | 'quintile' | 'none';

/**
 * Course rigor level
 */
export type CourseRigorLevel = 'maximum' | 'very_high' | 'high' | 'moderate' | 'low';

// ============================================================================
// INPUT TYPES (from student data)
// ============================================================================

/**
 * Raw GPA data from student profile
 */
export interface GPAData {
  value: number;
  scale: GPAScale;
  type: GPAType;
  isWeighted: boolean;
}

/**
 * Class rank data
 */
export interface ClassRankData {
  rank?: number;
  classSize?: number;
  reportingMethod: RankReportingMethod;
  decile?: number;
  quartile?: number;
  quintile?: number;
}

/**
 * Standardized test scores
 */
export interface StandardizedTestScores {
  sat?: {
    total: number;
    math: number;
    ebrw: number;
    essay?: { reading: number; analysis: number; writing: number };
    superscoreTotal?: number;
    superscoredMath?: number;
    superscoredEBRW?: number;
    attempts: number;
  };
  act?: {
    composite: number;
    english: number;
    math: number;
    reading: number;
    science: number;
    writing?: number;
    superscoreComposite?: number;
    attempts: number;
  };
  subjectTests?: Array<{
    subject: string;
    score: number;
    date: string;
  }>;
}

/**
 * Course history entry
 */
export interface CourseEntry {
  name: string;
  subject: string;
  level: 'regular' | 'honors' | 'ap' | 'ib_sl' | 'ib_hl' | 'dual_enrollment' | 'college';
  grade: string;
  gradePoints?: number;
  year: string;
  semester?: string;
  credits?: number;
}

/**
 * AP/IB exam result
 */
export interface APExamResult {
  subject: string;
  score: number; // 1-5 for AP, 1-7 for IB
  year: string;
}

/**
 * School context for GPA evaluation
 */
export interface SchoolContext {
  name: string;
  type: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool';
  state: string;
  country: string;
  ceebCode?: string;
  isCompetitive: boolean; // Known competitive school
  averageGPA?: number; // School's average GPA if known
  apCoursesOffered?: number; // Total AP courses available
  ibProgram?: boolean;
}

/**
 * Complete academic input data
 */
export interface AcademicInputData {
  gpa: GPAData;
  classRank?: ClassRankData;
  testScores?: StandardizedTestScores;
  courseHistory: CourseEntry[];
  apExams?: APExamResult[];
  ibExams?: APExamResult[];
  schoolContext: SchoolContext;
  expectedGraduation: string;
  currentGrade: number; // 9, 10, 11, 12
}

// ============================================================================
// EVALUATION OUTPUT TYPES
// ============================================================================

/**
 * GPA strength assessment
 */
export interface GPAStrengthAssessment {
  score: number; // 0-100
  tier: AcademicTier;
  unweightedEquivalent: number; // Normalized to 4.0 scale
  weightedEquivalent?: number; // Normalized if applicable
  context: string; // Human-readable explanation
  benchmarkComparison: string; // How it compares to competitive applicants
  schoolContextAdjustment: number; // Adjustment for school difficulty (-10 to +10)
  strengths: string[];
  concerns: string[];
}

/**
 * Course rigor assessment
 */
export interface CourseRigorAssessment {
  score: number; // 0-100
  level: CourseRigorLevel;
  apCourseCount: number;
  ibCourseCount: number;
  honorsCourseCount: number;
  dualEnrollmentCount: number;
  totalAdvancedCourses: number;
  maxAvailableAdvanced: number; // Based on school context
  rigorUtilizationRate: number; // Percentage of available rigor taken
  coreSubjectRigor: {
    english: CourseRigorLevel;
    math: CourseRigorLevel;
    science: CourseRigorLevel;
    socialStudies: CourseRigorLevel;
    foreignLanguage: CourseRigorLevel;
  };
  context: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

/**
 * Testing strength assessment
 */
export interface TestingStrengthAssessment {
  score: number; // 0-100
  tier: AcademicTier;
  hasSAT: boolean;
  hasACT: boolean;
  strongerTest?: 'sat' | 'act' | 'comparable';
  satAnalysis?: {
    total: number;
    percentile: number;
    mathStrength: 'strong' | 'average' | 'weak';
    ebrwStrength: 'strong' | 'average' | 'weak';
    superscoreAdvice?: string;
    retakeRecommendation?: string;
  };
  actAnalysis?: {
    composite: number;
    percentile: number;
    strengthAreas: string[];
    weakAreas: string[];
    superscoreAdvice?: string;
    retakeRecommendation?: string;
  };
  subjectTestsAnalysis?: {
    count: number;
    strongScores: string[]; // 750+
    averageScores: string[]; // 700-749
    weakScores: string[]; // Below 700
    recommendation: string;
  };
  apExamsAnalysis?: {
    totalExams: number;
    fivesCount: number;
    foursCount: number;
    threesOrBelowCount: number;
    averageScore: number;
    strengthSubjects: string[];
    concernSubjects: string[];
  };
  overallTestingStrategy: string;
  context: string;
}

/**
 * Grade trend analysis
 */
export interface GradeTrendAnalysis {
  direction: GradeTrend;
  freshmanGPA?: number;
  sophomoreGPA?: number;
  juniorGPA?: number;
  seniorGPA?: number; // First semester if available
  trajectory: number[]; // GPA by semester
  implications: string;
  narrative: string;
  admissionsImpact: 'positive' | 'neutral' | 'negative';
  recommendations: string[];
}

/**
 * Class rank analysis
 */
export interface ClassRankAnalysis {
  hasRank: boolean;
  percentile?: number; // 0-100 (higher = better)
  tier?: 'top_1' | 'top_5' | 'top_10' | 'top_25' | 'top_50' | 'bottom_50';
  context: string;
  competitiveContext: string; // How this compares at target schools
  recommendations: string[];
}

/**
 * School-specific academic fit assessment
 */
export interface SchoolAcademicFit {
  schoolId: string;
  schoolName: string;
  meetsBenchmark: boolean;
  gpaPercentile: 'above_75th' | '50th_to_75th' | '25th_to_50th' | 'below_25th';
  testPercentile?: 'above_75th' | '50th_to_75th' | '25th_to_50th' | 'below_25th';
  academicCompetitiveness: 'very_competitive' | 'competitive' | 'below_average' | 'significantly_below';
  gapAnalysis: string;
  recommendation: string;
}

/**
 * Complete Academic Evaluation Output
 */
export interface AcademicEvaluation {
  // Timestamp and version
  evaluatedAt: string;
  version: string;

  // Overall assessment
  overallScore: number; // 0-100
  overallTier: AcademicTier;
  overallNarrative: string; // 2-3 sentence summary

  // Component assessments
  gpaStrength: GPAStrengthAssessment;
  courseRigor: CourseRigorAssessment;
  testingStrength: TestingStrengthAssessment;
  gradeTrend: GradeTrendAnalysis;
  classRank: ClassRankAnalysis;

  // School-specific assessments
  schoolFit: Record<string, SchoolAcademicFit>;

  // Synthesized insights
  academicNarrative: {
    headline: string; // One line summary
    strengths: string[];
    concerns: string[];
    uniqueAspects: string[]; // What stands out
  };

  // Actionable guidance
  recommendations: {
    immediate: string[]; // Things to do now
    courseSelection: string[]; // For next semester/year
    testing: string[]; // Test prep/retake advice
    positioning: string[]; // How to present in applications
  };

  // Metadata
  inputDataHash: string; // For cache invalidation
  confidenceScore: number; // How confident we are in this assessment
}

// ============================================================================
// BENCHMARK TYPES (for comparison)
// ============================================================================

/**
 * Academic benchmarks for a specific school
 */
export interface SchoolAcademicBenchmarks {
  schoolId: string;
  schoolName: string;
  dataYear: string;

  gpa: {
    percentile25: number;
    percentile50: number;
    percentile75: number;
    average: number;
  };

  sat?: {
    percentile25: number;
    percentile50: number;
    percentile75: number;
    average: number;
    mathPercentile50: number;
    ebrwPercentile50: number;
  };

  act?: {
    percentile25: number;
    percentile50: number;
    percentile75: number;
    average: number;
  };

  classRankExpectation: string; // e.g., "Top 10% strongly preferred"
  courseRigorExpectation: string; // e.g., "Most rigorous available expected"
}

/**
 * Admission statistics context
 */
export interface AcademicAdmissionContext {
  schoolId: string;
  acceptanceRate: number;
  academicIndexWeight: number; // How much academics matter (0-100)
  testOptionalPolicy: TestPolicy;
  superscorePolicy: boolean;
  subjectTestPolicy: 'required' | 'recommended' | 'considered' | 'not_considered';
  hollisticFactors: string[]; // Other factors that can offset academics
}
