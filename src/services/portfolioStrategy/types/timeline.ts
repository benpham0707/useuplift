/**
 * Timeline Guidance Types
 *
 * Comprehensive type definitions for grade-specific guidance and timeline-aware
 * recommendations. The system recognizes that what a student can do varies
 * dramatically by grade level, and guidance must be tailored accordingly.
 *
 * Key Insight: A recommendation that's brilliant for a junior is useless for
 * a senior, and what's appropriate for a freshman would be premature pressure.
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';

// ============================================================================
// GRADE LEVEL CLASSIFICATION
// ============================================================================

/**
 * Student grade level
 */
export type GradeLevel = '9th' | '10th' | '11th' | '12th' | 'gap_year' | 'transfer';

/**
 * Academic year phase (within a grade)
 */
export type YearPhase =
  | 'fall_semester'
  | 'winter_break'
  | 'spring_semester'
  | 'summer';

/**
 * Time until application submission
 */
export type ApplicationTimeline =
  | 'years_away'        // 9th-10th grade
  | 'year_plus'         // Early 11th grade
  | 'months_away'       // Late 11th / summer
  | 'imminent'          // Fall senior year
  | 'in_progress'       // Currently applying
  | 'submitted';        // Done for cycle

// ============================================================================
// TIMELINE CONTEXT
// ============================================================================

/**
 * Complete timeline context for a student
 */
export interface TimelineContext {
  // Current position
  currentGrade: GradeLevel;
  currentPhase: YearPhase;
  graduationYear: number;

  // Application timeline
  applicationTimeline: ApplicationTimeline;
  monthsUntilEarlyDeadline: number;
  monthsUntilRegularDeadline: number;

  // Key dates
  keyDates: {
    earlyDeadlines: Date;       // Typically Nov 1-15
    regularDeadlines: Date;     // Typically Jan 1-15
    currentDate: Date;
    seniorYearStart: Date;
  };

  // Time available
  timeAvailable: {
    summersRemaining: number;   // Full summers before application
    semestersRemaining: number; // Full semesters before senior fall
    weeksUntilDeadline: number;
  };

  // Development phase
  developmentPhase: DevelopmentPhase;
}

/**
 * Student development phase
 */
export type DevelopmentPhase =
  | 'exploration'       // 9th grade: try things, find interests
  | 'commitment'        // 10th grade: narrow down, go deeper
  | 'peak_performance'  // 11th grade: maximize achievements
  | 'execution'         // 12th grade: convert to applications
  | 'completion';       // Post-submission

// ============================================================================
// GRADE-SPECIFIC PRIORITIES
// ============================================================================

/**
 * Grade-specific priority framework
 */
export interface GradeSpecificPriorities {
  grade: GradeLevel;
  phase: YearPhase;

  // What matters most right now
  topPriorities: {
    priority: string;
    category: PriorityCategory;
    importance: 'critical' | 'high' | 'medium';
    rationale: string;
    actionableSteps: string[];
  }[];

  // What's NOT a priority yet
  prematureActions: {
    action: string;
    whyPremature: string;
    whenAppropriate: string;
  }[];

  // Key opportunities this period
  keyOpportunities: {
    opportunity: string;
    deadline?: Date;
    whyNow: string;
    howToSeize: string[];
  }[];

  // Common mistakes for this grade
  commonMistakes: {
    mistake: string;
    whyItHappens: string;
    howToAvoid: string;
  }[];
}

/**
 * Priority categories
 */
export type PriorityCategory =
  | 'academic'
  | 'activities'
  | 'testing'
  | 'relationships'
  | 'exploration'
  | 'essays'
  | 'applications'
  | 'interviews'
  | 'decisions';

// ============================================================================
// FRESHMAN (9TH GRADE) FRAMEWORK
// ============================================================================

/**
 * 9th grade specific guidance
 */
export interface FreshmanGuidance {
  phase: 'exploration';

  // Academic focus
  academicPriorities: {
    courseSelection: string[];
    gradeFoundation: string;
    rigorIntroduction: string;
    foreignLanguageStart: boolean;
  };

  // Activity exploration
  activityExploration: {
    recommendedToTry: number;    // 5-7 activities
    commitmentLevel: string;     // Low commitment, high exploration
    leadershipExpectation: string; // None expected yet
    focusOn: string[];           // Finding genuine interests
  };

  // Relationship building
  relationshipBuilding: {
    teacherConnections: string;
    counselorIntro: string;
    mentorSeeking: boolean;
  };

  // What NOT to worry about
  dontWorryAbout: string[];

  // Summer after 9th
  summerStrategy: {
    focus: string;
    appropriate: string[];
    unnecessary: string[];
  };
}

// ============================================================================
// SOPHOMORE (10TH GRADE) FRAMEWORK
// ============================================================================

/**
 * 10th grade specific guidance
 */
export interface SophomoreGuidance {
  phase: 'commitment';

  // Academic focus
  academicPriorities: {
    courseEscalation: string[];
    firstAPs: string[];
    psatPreparation: string;
    gradeStrengthening: string;
  };

  // Activity commitment
  activityCommitment: {
    narrowingTo: number;         // 3-4 core activities
    seekingLeadership: boolean;  // Starting to seek
    competitionEntry: string;    // Begin competing
    initiativeStarting: boolean; // Consider starting something
  };

  // Summer programs
  summerProgramStrategy: {
    applicationTiming: string;   // Apply in fall/winter
    targetPrograms: string[];    // Governor's Schools, regional programs
    researchExploration: boolean;
  };

  // Planning ahead
  forwardPlanning: {
    juniorYearPlanning: string[];
    testingTimeline: string;
    spikeIdentification: string;
  };
}

// ============================================================================
// JUNIOR (11TH GRADE) FRAMEWORK
// ============================================================================

/**
 * 11th grade specific guidance - THE critical year
 */
export interface JuniorGuidance {
  phase: 'peak_performance';

  // Academic peak
  academicPriorities: {
    mostRigorousSchedule: string;
    apCourseload: string;        // 4-6 APs typical for competitive
    testCompletionPlan: string;  // SAT/ACT timing
    gradeProtection: string;     // Can't afford drops
  };

  // Activity peak
  activityPeak: {
    leadershipPositions: string; // Peak positions this year
    majorAchievements: string;   // Competitions, awards
    spikeMaximization: string;   // Go deepest this year
  };

  // Testing strategy
  testingStrategy: {
    satActTiming: string;        // Spring junior year ideal
    subjectTests: string;        // If applicable
    apExamPrep: string;          // May matters
    retakePlanning: string;      // Summer/fall if needed
  };

  // Summer before senior year - CRITICAL
  criticalSummer: {
    importance: string;          // Most important summer
    idealActivities: string[];   // Research, programs, projects
    essayPreparation: string;    // Begin brainstorming
    collegeVisits: string;       // Visit top choices
  };

  // Application preparation
  applicationPrep: {
    schoolListDevelopment: string;
    teacherAsking: string;       // Ask in spring
    essayBrainstorming: string;  // Start late spring
    collegeResearch: string;     // Know your targets
  };

  // Timeline by month
  monthByMonth: {
    september: string[];
    october: string[];
    november: string[];
    december: string[];
    january: string[];
    february: string[];
    march: string[];
    april: string[];
    may: string[];
    june: string[];
    july: string[];
    august: string[];
  };
}

// ============================================================================
// SENIOR (12TH GRADE) FRAMEWORK
// ============================================================================

/**
 * 12th grade specific guidance - Execution year
 */
export interface SeniorGuidance {
  phase: 'execution';

  // Academic maintenance
  academicMaintenance: {
    seniorSlumpPrevention: string;
    gradeMaintenance: string;
    rigorMaintenance: string;
    midYearReportMatters: boolean;
  };

  // Activity maintenance
  activityMaintenance: {
    continueCommitments: string;
    dontAddNew: string;         // Don't start new activities
    finalAchievements: string;
    descriptionFinalization: string;
  };

  // Application execution
  applicationExecution: {
    edEaStrategy: string;
    regularDeadlineStrategy: string;
    essayPolishing: string;
    applicationReview: string;
  };

  // Timeline by period
  fallTimeline: {
    september: string[];        // Finalize essays, ED apps
    october: string[];          // Submit EA apps
    november: string[];         // ED/EA deadlines
    december: string[];         // ED decisions, RD prep
  };

  springTimeline: {
    january: string[];          // RD deadlines
    february: string[];         // Wait, additional info
    march: string[];            // Decisions begin
    april: string[];            // Compare offers, decide
    may: string[];              // Commit, deposits
  };

  // Decision framework
  decisionFramework: {
    comparingOffers: string;
    negotiatingAid: string;
    finalDecision: string;
    waitlistStrategy: string;
  };
}

// ============================================================================
// CRITICAL DEADLINES
// ============================================================================

/**
 * Critical deadline tracking
 */
export interface CriticalDeadlines {
  // Application deadlines
  applicationDeadlines: {
    schoolName: string;
    deadlineType: 'ED' | 'ED2' | 'EA' | 'REA' | 'RD' | 'Rolling';
    deadline: Date;
    daysUntil: number;
    status: 'upcoming' | 'imminent' | 'passed';
    priority: 'critical' | 'high' | 'medium';
  }[];

  // Test deadlines
  testDeadlines: {
    testName: string;
    registrationDeadline: Date;
    testDate: Date;
    lastTestDateForDeadline: string;
  }[];

  // Financial aid deadlines
  financialAidDeadlines: {
    form: 'FAFSA' | 'CSS_Profile' | 'School_Specific';
    deadline: Date;
    schoolsAffected: string[];
  }[];

  // Program deadlines
  programDeadlines: {
    programName: string;
    deadline: Date;
    category: 'summer_program' | 'scholarship' | 'competition';
    importance: string;
  }[];
}

// ============================================================================
// ACTION TIMELINE
// ============================================================================

/**
 * Timeline-aware action item
 */
export interface TimelineAction {
  action: string;
  category: PriorityCategory;

  // Timeline context
  appropriateFor: GradeLevel[];
  bestTiming: {
    grade: GradeLevel;
    phase: YearPhase;
    monthsWindow: number;       // How long this is relevant
  };

  // Urgency
  urgency: {
    level: 'critical' | 'high' | 'medium' | 'low';
    deadline?: Date;
    consequenceOfMissing: string;
  };

  // Dependencies
  dependencies: {
    mustHappenFirst: string[];
    enablesNext: string[];
  };

  // Effort
  effort: {
    timeRequired: string;
    difficultyLevel: 'easy' | 'moderate' | 'challenging';
    resourcesNeeded: string[];
  };

  // Impact
  expectedImpact: {
    scoreImprovement: HarvardScoreDecimal;
    affectedAreas: string[];
    longTermBenefit: string;
  };
}

// ============================================================================
// MONTHLY PLANNING
// ============================================================================

/**
 * Monthly planning framework
 */
export interface MonthlyPlan {
  month: number;               // 1-12
  grade: GradeLevel;

  // Focus areas
  primaryFocus: string;
  secondaryFocus: string[];

  // Tasks
  mustDo: string[];            // Non-negotiable
  shouldDo: string[];          // High priority
  couldDo: string[];           // If time allows

  // Opportunities
  timelyOpportunities: {
    opportunity: string;
    deadline: Date;
    action: string;
  }[];

  // Check-ins
  progressChecks: string[];
}

// ============================================================================
// TIMELINE ASSESSMENT
// ============================================================================

/**
 * Assessment of student's timeline utilization
 */
export interface TimelineAssessment {
  // Current position
  currentPosition: {
    grade: GradeLevel;
    phase: YearPhase;
    monthsUntilApplication: number;
  };

  // Timeline utilization
  utilizationAssessment: {
    score: HarvardScoreDecimal;
    onTrack: boolean;
    aheadOrBehind: 'ahead' | 'on_track' | 'slightly_behind' | 'significantly_behind';
    assessment: string;
  };

  // Opportunities used/missed
  opportunityAnalysis: {
    capitalizedOn: string[];
    missedOpportunities: string[];
    remainingOpportunities: string[];
  };

  // Catch-up plan (if needed)
  catchUpPlan?: {
    needed: boolean;
    priority1: string;
    priority2: string;
    priority3: string;
    timeline: string;
    feasibility: 'highly_feasible' | 'feasible' | 'challenging' | 'difficult';
  };

  // Recommendations
  timelineRecommendations: {
    immediate: string[];
    thisMonth: string[];
    thisQuarter: string[];
    thisYear: string[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Grade level priorities by phase
 */
export const GRADE_LEVEL_FOCUS: Record<GradeLevel, {
  primaryFocus: string;
  secondaryFocus: string[];
  notYetRelevant: string[];
}> = {
  '9th': {
    primaryFocus: 'Academic foundation and interest exploration',
    secondaryFocus: ['Try diverse activities', 'Build teacher relationships', 'Develop study habits'],
    notYetRelevant: ['Test prep', 'Essay writing', 'College applications', 'Interview prep'],
  },
  '10th': {
    primaryFocus: 'Commitment to core activities and academic rigor',
    secondaryFocus: ['First AP courses', 'Begin leadership pursuit', 'PSAT practice', 'Research summer programs'],
    notYetRelevant: ['College essays', 'Application strategy', 'Final school list'],
  },
  '11th': {
    primaryFocus: 'Peak performance and application preparation',
    secondaryFocus: ['SAT/ACT completion', 'Maximum activity achievement', 'College research', 'Essay brainstorming'],
    notYetRelevant: ['Final decision making', 'Enrollment deposits'],
  },
  '12th': {
    primaryFocus: 'Application execution and decision making',
    secondaryFocus: ['Essay polishing', 'Interview preparation', 'Grade maintenance', 'Financial aid'],
    notYetRelevant: ['Activity expansion', 'New test taking'],
  },
  'gap_year': {
    primaryFocus: 'Meaningful experience and application strengthening',
    secondaryFocus: ['Work experience', 'Independent projects', 'Travel with purpose', 'Skill development'],
    notYetRelevant: [],
  },
  'transfer': {
    primaryFocus: 'College GPA and transfer-specific positioning',
    secondaryFocus: ['Why transfer essay', 'College activities', 'Professor recommendations'],
    notYetRelevant: ['High school activities', 'High school testing'],
  },
};

/**
 * Months until deadlines by grade (approximate)
 */
export const MONTHS_UNTIL_DEADLINE: Record<GradeLevel, { earlyDeadline: number; regularDeadline: number }> = {
  '9th': { earlyDeadline: 38, regularDeadline: 40 },
  '10th': { earlyDeadline: 26, regularDeadline: 28 },
  '11th': { earlyDeadline: 14, regularDeadline: 16 },
  '12th': { earlyDeadline: 2, regularDeadline: 4 },
  'gap_year': { earlyDeadline: 2, regularDeadline: 4 },
  'transfer': { earlyDeadline: 6, regularDeadline: 8 },
};
