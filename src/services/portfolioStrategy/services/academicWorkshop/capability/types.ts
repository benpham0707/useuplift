/**
 * Capability Profile Types
 *
 * Data structures for building a reusable, cached understanding of a student's
 * demonstrated academic capabilities based on their complete course history.
 *
 * Philosophy: Students should take the difficulty level that allows them to
 * achieve their best grades, calibrated to their proven abilities. This system
 * analyzes historical performance to understand what difficulty level maximizes
 * both GPA AND appropriate intellectual stretch.
 *
 * Key Insight: We don't assume "rigor over GPA" is always the right tradeoff.
 * Instead, we analyze each student's demonstrated capability to recommend
 * personalized course difficulty that achieves optimal outcomes.
 */

import type { CourseRecord } from '../types';

// ============================================================================
// CORE CAPABILITY PROFILE
// ============================================================================

/**
 * The complete capability profile for a student.
 * This is the cached, reusable understanding that drives all recommendations.
 */
export interface AcademicCapabilityProfile {
  // Identification
  profileId: string;
  generatedAt: Date;
  dataCompleteness: DataCompleteness;

  // Overall Capability Assessment
  overallCapability: OverallCapabilityAssessment;

  // Subject-Specific Capabilities
  subjectCapabilities: SubjectCapabilityMap;

  // Challenge Tolerance
  challengeTolerance: ChallengeTolerance;

  // Learning Patterns
  learningPatterns: LearningPatterns;

  // Derived Recommendations
  optimalDifficultyLevel: OptimalDifficultyLevel;

  // Metadata
  confidence: number; // 0-100 based on data quality and history length
  lastUpdated: Date;
  courseCount: number;
  yearsAnalyzed: number;
}

// ============================================================================
// DATA QUALITY
// ============================================================================

export interface DataCompleteness {
  overallScore: number; // 0-100
  yearsWithData: ('freshman' | 'sophomore' | 'junior' | 'senior')[];
  subjectsWithMultipleDataPoints: string[];
  hasGradeHistory: boolean;
  hasCourseRecords: boolean;
  hasSchoolContext: boolean;
  confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
}

// ============================================================================
// OVERALL CAPABILITY
// ============================================================================

export interface OverallCapabilityAssessment {
  /**
   * The student's demonstrated capability tier.
   * Based on their track record across all subjects and difficulty levels.
   */
  capabilityTier: CapabilityTier;

  /**
   * GPA the student typically achieves at different difficulty levels
   */
  performanceByDifficulty: PerformanceByDifficulty;

  /**
   * The "stretch zone" - where the student is challenged but can still succeed
   */
  optimalStretchPoint: OptimalStretchPoint;

  /**
   * Consistency of performance (how predictable are their results?)
   */
  performanceConsistency: PerformanceConsistency;

  /**
   * Natural language summary of their overall capability
   */
  capabilitySummary: string;
}

/**
 * Capability tiers based on demonstrated performance
 */
export type CapabilityTier =
  | 'elite'           // Excels in most challenging courses (A/A- in AP/IB)
  | 'high_achiever'   // Strong in challenging courses (B+/A- in AP, A in Honors)
  | 'solid_performer' // Competent in moderate challenge (A in Honors, B in AP)
  | 'steady_builder'  // Best at standard pace (A in Regular, struggles in AP)
  | 'needs_support';  // Requires foundational work before advancing

export interface PerformanceByDifficulty {
  ap_ib: {
    avgGrade: number; // 4.0 scale
    sampleSize: number;
    gradeRange: { min: number; max: number };
    subjects: string[];
  } | null;
  honors: {
    avgGrade: number;
    sampleSize: number;
    gradeRange: { min: number; max: number };
    subjects: string[];
  } | null;
  regular: {
    avgGrade: number;
    sampleSize: number;
    gradeRange: { min: number; max: number };
    subjects: string[];
  } | null;
}

export interface OptimalStretchPoint {
  /**
   * The difficulty level where the student achieves optimal balance:
   * - High enough to show intellectual growth
   * - Not so high that grades suffer significantly
   */
  recommendedDifficultyLevel: 'ap_ib' | 'honors' | 'regular';

  /**
   * Expected GPA at this level based on historical performance
   */
  expectedGPA: number;

  /**
   * How confident are we in this recommendation?
   */
  confidence: number; // 0-100

  /**
   * Rationale for this recommendation
   */
  rationale: string;
}

export interface PerformanceConsistency {
  /**
   * How consistent is the student's performance?
   */
  consistencyLevel: 'highly_consistent' | 'mostly_consistent' | 'variable' | 'unpredictable';

  /**
   * Standard deviation of grades across all courses
   */
  gradeVariance: number;

  /**
   * Does performance vary more by subject or by difficulty?
   */
  primaryVarianceFactor: 'subject' | 'difficulty' | 'balanced';

  /**
   * Notable outliers (courses where performance was significantly different)
   */
  outliers: CourseOutlier[];
}

export interface CourseOutlier {
  courseName: string;
  subject: string;
  level: string;
  grade: number;
  expectedGrade: number;
  deviation: number; // How far from expected
  likelyExplanation: string;
}

// ============================================================================
// SUBJECT-SPECIFIC CAPABILITIES
// ============================================================================

export type SubjectCapabilityMap = {
  [subject in SubjectArea]?: SubjectCapability;
};

export type SubjectArea =
  | 'math'
  | 'science'
  | 'english'
  | 'social_studies'
  | 'foreign_language'
  | 'arts'
  | 'computer_science';

export interface SubjectCapability {
  /**
   * The student's capability level in this subject
   */
  capabilityLevel: SubjectCapabilityLevel;

  /**
   * Performance trend in this subject over time
   */
  trend: 'improving' | 'stable' | 'declining';

  /**
   * Maximum difficulty level the student has succeeded at (A/A-)
   */
  provenSuccessLevel: 'ap_ib' | 'honors' | 'regular' | 'none';

  /**
   * Performance at different difficulty levels in this subject
   */
  performanceByLevel: {
    ap_ib?: { avgGrade: number; courses: string[] };
    honors?: { avgGrade: number; courses: string[] };
    regular?: { avgGrade: number; courses: string[] };
  };

  /**
   * Recommended next course difficulty in this subject
   */
  recommendedNextLevel: 'ap_ib' | 'honors' | 'regular';

  /**
   * Confidence in this assessment (based on sample size)
   */
  confidence: number;

  /**
   * Natural language insight about this subject
   */
  insight: string;
}

export type SubjectCapabilityLevel =
  | 'exceptional'    // Consistently excels at highest levels
  | 'strong'         // Performs well in challenging courses
  | 'competent'      // Solid performance at moderate difficulty
  | 'developing'     // Still building foundation
  | 'challenged';    // Struggles in this area

// ============================================================================
// CHALLENGE TOLERANCE
// ============================================================================

export interface ChallengeTolerance {
  /**
   * How well does the student handle increased difficulty?
   */
  toleranceLevel: ToleranceLevel;

  /**
   * Historical evidence of handling challenge
   */
  challengeHistory: ChallengeEvent[];

  /**
   * Pattern when moving from Honors to AP or Regular to Honors
   */
  levelTransitionPattern: LevelTransitionPattern;

  /**
   * How many difficulty levels can the student handle simultaneously?
   * (e.g., taking multiple APs in one year)
   */
  simultaneousChallengeCapacity: number;

  /**
   * Warning signs that suggest the student is over-challenged
   */
  overloadIndicators: string[];

  /**
   * Natural language summary
   */
  summary: string;
}

export type ToleranceLevel =
  | 'high'      // Thrives under challenge, grades don't suffer
  | 'moderate'  // Can handle challenge but grades dip slightly
  | 'sensitive' // Challenge significantly impacts performance
  | 'unknown';  // Insufficient data

export interface ChallengeEvent {
  year: string;
  event: string; // e.g., "Moved from Honors to AP Physics"
  outcome: 'thrived' | 'adapted' | 'struggled' | 'withdrew';
  gradeImpact: number; // Change in grade (positive = improved)
}

export interface LevelTransitionPattern {
  /**
   * Typical grade change when moving up a difficulty level
   */
  typicalGradeDrop: number;

  /**
   * How long does it take the student to adapt to new difficulty?
   */
  adaptationPattern: 'quick' | 'gradual' | 'prolonged' | 'unknown';

  /**
   * Evidence from past transitions
   */
  transitions: {
    from: string;
    to: string;
    gradeBefore: number;
    gradeAfter: number;
    semester: string;
  }[];
}

// ============================================================================
// LEARNING PATTERNS
// ============================================================================

export interface LearningPatterns {
  /**
   * Does the student perform better in certain semesters?
   */
  semesterPattern: 'fall_strong' | 'spring_strong' | 'consistent' | 'unknown';

  /**
   * Does the student perform better at certain times of day (if data available)?
   */
  schedulePreference: string | null;

  /**
   * How does the student's performance change over the course of a year?
   */
  withinYearTrajectory: 'front_loaded' | 'back_loaded' | 'consistent' | 'dips_mid';

  /**
   * Does the student do better with certain course types?
   */
  courseTypeStrengths: {
    testHeavy: boolean;
    projectBased: boolean;
    writingIntensive: boolean;
    labBased: boolean;
  };

  /**
   * Recovery pattern after a setback
   */
  recoveryPattern: 'quick_bounce' | 'gradual_recovery' | 'persistent_impact' | 'unknown';

  /**
   * Multi-year growth trajectory
   */
  overallGrowthPattern: GrowthPattern;
}

export type GrowthPattern =
  | 'accelerating'   // Getting better faster each year
  | 'linear'         // Steady improvement
  | 'plateaued'      // Reached a ceiling
  | 'cyclical'       // Up and down pattern
  | 'declining';     // Getting worse

// ============================================================================
// OPTIMAL DIFFICULTY LEVEL (THE KEY OUTPUT)
// ============================================================================

export interface OptimalDifficultyLevel {
  /**
   * Overall recommended course load difficulty
   */
  overall: DifficultyRecommendation;

  /**
   * Subject-specific recommendations
   */
  bySubject: {
    [subject in SubjectArea]?: DifficultyRecommendation;
  };

  /**
   * Recommended total number of AP/IB courses for next year
   */
  recommendedAPCount: {
    minimum: number;
    optimal: number;
    maximum: number;
  };

  /**
   * What GPA can the student expect with these recommendations?
   */
  projectedGPA: {
    conservative: number;
    expected: number;
    optimistic: number;
  };

  /**
   * Key principles guiding these recommendations
   */
  guidingPrinciples: string[];
}

export interface DifficultyRecommendation {
  /**
   * Recommended difficulty level
   */
  level: 'ap_ib' | 'honors' | 'regular';

  /**
   * How confident are we?
   */
  confidence: number; // 0-100

  /**
   * Rationale for this recommendation
   */
  rationale: string;

  /**
   * What grade should the student expect?
   */
  expectedGrade: string; // e.g., "A-" or "B+"

  /**
   * Should the student stretch above this? Under what conditions?
   */
  stretchCondition: string | null;

  /**
   * Warning signs that suggest backing off
   */
  backoffTriggers: string[];
}

// ============================================================================
// PROGRESSION ADVICE (TAILORED RECOMMENDATIONS)
// ============================================================================

export interface ProgressionAdvice {
  /**
   * Overall guidance for the next academic year
   */
  overallGuidance: string;

  /**
   * Specific course recommendations
   */
  courseRecommendations: CourseRecommendation[];

  /**
   * What to avoid
   */
  whatToAvoid: string[];

  /**
   * GPA protection strategies (if relevant)
   */
  gpaProtectionStrategies: string[];

  /**
   * Challenge-seeking opportunities (balanced with GPA goals)
   */
  challengeOpportunities: string[];

  /**
   * Key success factors for this student
   */
  successFactors: string[];

  /**
   * Warning signs to watch for
   */
  warningSignsToWatch: string[];
}

export interface CourseRecommendation {
  subject: SubjectArea;
  recommendedLevel: 'ap_ib' | 'honors' | 'regular';
  specificCourses?: string[];
  rationale: string;
  expectedOutcome: string;
  alternativeIfStruggling: string;
}

// ============================================================================
// CAPABILITY PROFILE GENERATION
// ============================================================================

export interface CapabilityProfileInput {
  courses: CourseRecord[];
  gradeHistory?: {
    freshman?: { gpa: number; courses: number };
    sophomore?: { gpa: number; courses: number };
    junior?: { gpa: number; courses: number };
    senior?: { gpa: number; courses: number };
  };
  schoolContext: {
    apCoursesOffered?: number;
    type?: string;
  };
  intendedMajor?: string;
  currentYear?: 'freshman' | 'sophomore' | 'junior' | 'senior';
}

export interface CapabilityProfileResult {
  success: boolean;
  profile?: AcademicCapabilityProfile;
  progressionAdvice?: ProgressionAdvice;
  error?: string;
}

// ============================================================================
// GRADE CONVERSION UTILITIES
// ============================================================================

export const GRADE_TO_GPA: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

export const GPA_TO_GRADE = (gpa: number): string => {
  if (gpa >= 3.85) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.15) return 'B+';
  if (gpa >= 2.85) return 'B';
  if (gpa >= 2.5) return 'B-';
  if (gpa >= 2.15) return 'C+';
  if (gpa >= 1.85) return 'C';
  if (gpa >= 1.5) return 'C-';
  if (gpa >= 1.15) return 'D+';
  if (gpa >= 0.85) return 'D';
  if (gpa >= 0.5) return 'D-';
  return 'F';
};
