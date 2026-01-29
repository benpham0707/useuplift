/**
 * School Fit & Strategy Types
 *
 * Comprehensive type definitions for college matching, admission probability
 * estimation, and application strategy. This connects student profiles to
 * specific schools with personalized guidance.
 */

import { ProfileTier, ApplicationArchetype } from './synthesis';

// ============================================================================
// CORE SCHOOL FIT TYPES
// ============================================================================

/**
 * School category in application list
 */
export type SchoolCategory = 'reach' | 'target' | 'likely';

/**
 * Application decision type
 */
export type DecisionType =
  | 'ED'    // Early Decision (binding)
  | 'ED2'   // Early Decision II (binding, later deadline)
  | 'EA'    // Early Action (non-binding)
  | 'REA'   // Restrictive Early Action
  | 'RD';   // Regular Decision

/**
 * Application status
 */
export type ApplicationStatus =
  | 'researching'
  | 'considering'
  | 'planning_to_apply'
  | 'in_progress'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'
  | 'deferred'
  | 'withdrawn';

/**
 * Demonstrated interest importance
 */
export type DemonstratedInterestImportance =
  | 'critical'      // Significantly impacts admission
  | 'important'     // Meaningful factor
  | 'considered'    // Minor factor
  | 'not_tracked';  // School doesn't track it

/**
 * Interview importance
 */
export type InterviewImportance =
  | 'required'
  | 'strongly_recommended'
  | 'recommended'
  | 'optional'
  | 'not_offered';

// ============================================================================
// SCHOOL PROFILE TYPES
// ============================================================================

/**
 * Comprehensive college admission profile
 */
export interface CollegeAdmissionProfile {
  // Identification
  collegeId: string;
  collegeName: string;
  commonName: string;
  location: {
    city: string;
    state: string;
    country: string;
    region: string;
  };

  // Basic stats
  ranking: {
    usNews?: number;
    forbes?: number;
    niche?: number;
  };
  type: 'private' | 'public';
  size: 'small' | 'medium' | 'large'; // <5k, 5-15k, >15k undergrad
  undergradEnrollment: number;

  // Admission statistics
  admissionStats: {
    acceptanceRate: number;
    acceptanceRateED?: number;
    acceptanceRateEA?: number;
    acceptanceRateRD?: number;
    totalApplicants: number;
    totalAdmitted: number;
    totalEnrolled: number;
    yieldRate: number;
    dataYear: string;
  };

  // Academic benchmarks
  academicBenchmarks: {
    gpa: {
      percentile25: number;
      percentile50: number;
      percentile75: number;
      average?: number;
    };
    sat?: {
      percentile25: number;
      percentile50: number;
      percentile75: number;
      mathPercentile50?: number;
      ebrwPercentile50?: number;
    };
    act?: {
      percentile25: number;
      percentile50: number;
      percentile75: number;
    };
  };

  // Application requirements
  applicationRequirements: {
    testPolicy: 'required' | 'optional' | 'test_blind';
    essayCount: number;
    essayWordCounts: number[];
    letterOfRecCount: number;
    interviewPolicy: InterviewImportance;
    applicationPlatforms: ('common_app' | 'coalition' | 'proprietary')[];
  };

  // Demonstrated interest
  demonstratedInterest: {
    tracksInterest: boolean;
    importance: DemonstratedInterestImportance;
    howToShow: string[];
  };

  // Deadlines
  deadlines: {
    ED?: string;
    ED2?: string;
    EA?: string;
    REA?: string;
    RD: string;
  };

  // What they value
  institutionalValues: {
    coreValues: string[];
    whatTheyLookFor: string[];
    redFlags: string[];
    admissionsPhilosophy: string;
  };

  // Strong programs
  academicStrengths: {
    strongMajors: string[];
    competitiveMajors: string[];
    lesserKnownStrengths: string[];
  };

  // Financial
  financial: {
    averageNetPrice: number;
    meetsFullNeed: boolean;
    meritAidAvailable: boolean;
    averageMeritAid?: number;
  };

  // Campus culture
  culture: {
    vibe: string[];
    studentBodyDescription: string;
    notRightFor: string[];
  };
}

// ============================================================================
// FIT ANALYSIS TYPES
// ============================================================================

/**
 * Detailed fit dimension score
 */
export interface FitDimensionScore {
  score: number; // 0-100
  weight: number; // How much this matters
  assessment: 'excellent' | 'good' | 'fair' | 'poor';
  context: string;
  strengths: string[];
  concerns: string[];
}

/**
 * Complete fit analysis for a single school
 */
export interface SchoolFitAnalysis {
  schoolId: string;
  schoolName: string;

  // Overall fit
  overallFitScore: number; // 0-100
  category: SchoolCategory;
  admissionProbability: {
    estimate: number; // 0-100
    range: { low: number; high: number };
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
  };

  // Dimension-by-dimension fit
  fitDimensions: {
    academic: FitDimensionScore;
    activities: FitDimensionScore;
    values: FitDimensionScore; // Student values vs college values
    culture: FitDimensionScore;
    program: FitDimensionScore; // Major/program strength
    financial: FitDimensionScore;
  };

  // College-specific insights
  collegeInsights: {
    whatTheyValueThatYouHave: string[];
    whatYouOfferTheyNeed: string[];
    potentialConcerns: string[];
    howToStandOut: string;
    differentiationStrategy: string;
  };

  // Application strategy
  applicationStrategy: {
    recommendedDecisionType: DecisionType;
    decisionTypeReasoning: string;
    shouldApply: boolean;
    applyReasoning: string;
    priority: 'high' | 'medium' | 'low';
  };

  // Demonstrated interest guidance
  demonstratedInterestGuidance: {
    tracksInterest: boolean;
    importance: DemonstratedInterestImportance;
    recommendedActions: string[];
    timeline: string[];
  };

  // Essay strategy
  supplementalEssayStrategy: {
    numberOfEssays: number;
    keyPrompts: string[];
    narrativeAlignment: string; // How to align with your brand
    uniqueAngle: string;
    commonMistakes: string[];
    exampleApproaches: string[];
  };

  // Why this school (for the student)
  whyThisSchool: {
    academicReasons: string[];
    cultureReasons: string[];
    careerReasons: string[];
    uniqueOpportunities: string[];
    potentialConcerns: string[];
  };
}

/**
 * School fit assessment summary
 */
export interface SchoolFitAssessment {
  schoolId: string;
  schoolName: string;
  fitScore: number;
  category: SchoolCategory;
  probabilityEstimate: number;
  oneLineSummary: string;
  topReasons: string[];
  topConcerns: string[];
}

// ============================================================================
// SCHOOL LIST TYPES
// ============================================================================

/**
 * Categorized school list
 */
export interface CategorizedSchoolList {
  reach: SchoolFitAssessment[];
  target: SchoolFitAssessment[];
  likely: SchoolFitAssessment[];

  summary: {
    totalSchools: number;
    reachCount: number;
    targetCount: number;
    likelyCount: number;
    listBalance: 'well_balanced' | 'too_top_heavy' | 'too_conservative' | 'needs_more_schools';
    listAssessment: string;
  };
}

/**
 * School suggestions
 */
export interface SchoolSuggestions {
  // Schools they might not have considered
  underrated: {
    school: SchoolFitAssessment;
    whyConsider: string;
    fitStrength: string;
  }[];

  // Schools that would strengthen their list
  strategicAdds: {
    school: SchoolFitAssessment;
    whatItAdds: string; // e.g., "Good target with strong CS program"
    category: SchoolCategory;
  }[];

  // Schools they should reconsider
  reconsider: {
    schoolId: string;
    schoolName: string;
    reason: string;
    alternative?: string;
  }[];
}

/**
 * Application strategy recommendations
 */
export interface ApplicationStrategyRecommendations {
  // List composition
  recommendedListSize: {
    total: number;
    reach: number;
    target: number;
    likely: number;
    reasoning: string;
  };

  // Early decision recommendation
  earlyDecisionRecommendation?: {
    school: string;
    reasoning: string;
    riskAssessment: string;
    alternatives: string[];
    financialConsiderations: string;
  };

  // Early action recommendations
  earlyActionRecommendations: {
    schools: string[];
    reasoning: string;
    priorityOrder: string[];
  };

  // Demonstrated interest priorities
  demonstratedInterestPriorities: {
    schoolId: string;
    schoolName: string;
    importance: DemonstratedInterestImportance;
    actionsToTake: string[];
  }[];

  // Essay priorities
  supplementalEssayPriorities: {
    schoolId: string;
    schoolName: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }[];

  // Timeline recommendations
  applicationTimeline: {
    phase: string;
    deadline: string;
    tasks: string[];
  }[];
}

// ============================================================================
// COMPLETE SCHOOL FIT ANALYSIS OUTPUT
// ============================================================================

/**
 * Complete School Fit Analysis Output
 */
export interface SchoolFitOutput {
  // Timestamp and version
  analyzedAt: string;
  version: string;

  // Categorized school list
  schoolList: CategorizedSchoolList;

  // Detailed assessments for each school
  detailedAssessments: Record<string, SchoolFitAnalysis>;

  // Strategic recommendations
  strategy: ApplicationStrategyRecommendations;

  // School suggestions
  suggestions: SchoolSuggestions;

  // Overall list assessment
  listAssessment: {
    overallStrength: 'excellent' | 'good' | 'fair' | 'needs_work';
    narrative: string;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };

  // Best matches (top 5)
  bestMatches: {
    schoolId: string;
    schoolName: string;
    fitScore: number;
    whyBestMatch: string;
  }[];

  // Metadata
  inputDataHash: string;
  confidenceScore: number;
}

// ============================================================================
// PROBABILITY ESTIMATION TYPES
// ============================================================================

/**
 * Factors used in probability estimation
 */
export interface ProbabilityFactors {
  // Academic factors
  academic: {
    gpaFactor: number; // Based on percentile placement
    testScoreFactor: number;
    rigorFactor: number;
    trendFactor: number;
    combinedAcademicScore: number;
  };

  // Non-academic factors
  nonAcademic: {
    activitiesFactor: number;
    awardsFactor: number;
    essaysFactor: number; // If available
    leadershipFactor: number;
    spikeFactor: number;
    combinedNonAcademicScore: number;
  };

  // Context factors
  context: {
    demonstratedInterestFactor: number;
    legacyFactor: number;
    athleteFactor: number;
    firstGenFactor: number;
    geographicFactor: number;
    majorCompetitivenessFactor: number;
    combinedContextScore: number;
  };

  // Final calculation
  calculation: {
    baseRate: number; // School's overall acceptance rate
    adjustedRate: number; // After all factors
    confidenceAdjustment: number;
    finalEstimate: number;
  };
}

/**
 * Probability estimation configuration
 */
export interface ProbabilityEstimationConfig {
  // Factor weights
  weights: {
    academic: number;
    nonAcademic: number;
    context: number;
  };

  // Academic percentile mappings
  academicPercentileMappings: {
    above75th: number;
    percentile50to75: number;
    percentile25to50: number;
    below25th: number;
  };

  // School type adjustments
  schoolTypeAdjustments: {
    ivy: number;
    elite: number; // Non-Ivy T20
    selective: number; // T30-50
    competitive: number; // Other selective
  };
}
