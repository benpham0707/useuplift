/**
 * Award & Recognition Evaluation Types
 *
 * Comprehensive type definitions for honors and awards assessment.
 * These types support classification of recognition levels, Common App
 * optimization, and strategic positioning of achievements.
 */

// ============================================================================
// CORE AWARD TYPES
// ============================================================================

/**
 * Award recognition level (hierarchical)
 */
export type AwardRecognitionLevel =
  | 'international'    // IMO medals, ISEF Grand Prize, international olympiad
  | 'national'         // National Merit, USAMO, national competition winner
  | 'regional'         // Multi-state recognition, regional competitions
  | 'state'            // State-level awards, All-State selections
  | 'district'         // District/county recognition
  | 'school'           // School-wide awards, departmental honors
  | 'local';           // Community/local recognition

/**
 * Award selectivity classification
 */
export type AwardSelectivity =
  | 'highly_selective'    // <1% of participants/eligibles
  | 'selective'           // 1-5% selection rate
  | 'competitive'         // 5-15% selection rate
  | 'merit_based'         // Merit threshold, not competitive
  | 'participation';      // Awarded for participation

/**
 * Award category
 */
export type AwardCategory =
  | 'academic_olympiad'           // Math, Science, Computing olympiads
  | 'academic_competition'        // Science Bowl, Academic Decathlon
  | 'science_fair'                // ISEF, regional fairs
  | 'research_recognition'        // Published research, Regeneron STS
  | 'standardized_test'           // National Merit, AP Scholar
  | 'academic_honor'              // Honor roll, Dean's list
  | 'scholarship'                 // Merit scholarships
  | 'arts_competition'            // Music, visual arts, writing competitions
  | 'athletic'                    // All-State, MVP, records
  | 'leadership'                  // Leadership awards
  | 'community_service'           // Service awards, volunteer recognition
  | 'entrepreneurship'            // Business competitions, startup awards
  | 'debate_speech'               // Debate, Model UN, speech awards
  | 'journalism_writing'          // Writing awards, journalism honors
  | 'stem_competition'            // Robotics, coding, engineering
  | 'summer_program_selection'    // RSI, MOSTEC, competitive programs
  | 'other';

/**
 * Common App honors section levels
 */
export type CommonAppHonorLevel =
  | 'school'
  | 'state_regional'
  | 'national'
  | 'international';

// ============================================================================
// INPUT TYPES (from student data)
// ============================================================================

/**
 * Raw award/honor data from student profile
 */
export interface AwardInputData {
  id: string;
  name: string;
  category: AwardCategory;
  recognitionLevel: AwardRecognitionLevel;
  dateReceived: string;
  gradeLevel: number;
  description?: string;
  organization?: string;
  selectivityInfo?: string; // e.g., "Top 300 of 1,800 applicants"
  isAcademic: boolean;
  relatedActivity?: string; // Activity ID if connected
  verifiable: boolean;
}

/**
 * Complete awards input
 */
export interface AwardsInputData {
  academicHonors: AwardInputData[];
  formalRecognition: AwardInputData[];
  competitionResults: AwardInputData[];
  publications?: AwardInputData[];
  intendedMajor?: string; // For relevance scoring
}

// ============================================================================
// ASSESSMENT OUTPUT TYPES
// ============================================================================

/**
 * Individual award assessment
 */
export interface AwardAssessment {
  awardId: string;
  awardName: string;
  category: AwardCategory;

  // Classification
  recognitionLevel: AwardRecognitionLevel;
  selectivity: AwardSelectivity;
  selectivityScore: number; // 0-100

  // Relevance scoring
  relevanceToMajor: 'high' | 'medium' | 'low' | 'not_applicable';
  relevanceExplanation: string;

  // Narrative value
  narrativeValue: {
    storytellingPotential: 'high' | 'medium' | 'low';
    uniqueness: 'very_unique' | 'somewhat_unique' | 'common';
    proofPoint: string; // What this proves about the student
  };

  // Common App optimization
  commonAppOptimization: {
    suggestedLevel: CommonAppHonorLevel;
    optimizedDescription: string; // Max 100 characters
    shouldInclude: boolean;
    priorityRank: number; // 1-based ranking
    alternativeDescription?: string;
  };

  // Context and insights
  competitiveContext: string; // How impressive this is
  admissionsImpact: 'major' | 'moderate' | 'minor';
}

/**
 * Award distribution analysis
 */
export interface AwardDistributionAnalysis {
  distribution: {
    international: AwardAssessment[];
    national: AwardAssessment[];
    regional: AwardAssessment[];
    state: AwardAssessment[];
    district: AwardAssessment[];
    school: AwardAssessment[];
    local: AwardAssessment[];
  };

  summary: {
    totalAwards: number;
    tier1Awards: number; // International/National
    tier2Awards: number; // Regional/State
    tier3Awards: number; // District/School/Local
    academicCount: number;
    nonAcademicCount: number;
  };

  distributionAssessment: string;
  distributionStrength: 'exceptional' | 'strong' | 'good' | 'average' | 'weak';
}

/**
 * Award highlights analysis
 */
export interface AwardHighlightsAnalysis {
  mostImpressive: {
    award: AwardAssessment;
    whyImpressive: string;
  };

  mostRelevantToGoals: {
    award: AwardAssessment;
    relevanceExplanation: string;
  };

  bestStory: {
    award: AwardAssessment;
    storyPotential: string;
  };

  mostUnique: {
    award: AwardAssessment;
    uniquenessExplanation: string;
  };
}

/**
 * Common App honors optimization
 */
export interface CommonAppHonorsOptimization {
  // Primary recommendation (top 5)
  recommendedTop5: {
    awards: AwardAssessment[];
    reasoning: string;
    totalImpact: string;
  };

  // Alternative configurations
  alternatives: {
    configuration: AwardAssessment[];
    useCase: string; // When to use this configuration
    tradeoffs: string;
  }[];

  // Awards to exclude and why
  exclusions: {
    award: AwardAssessment;
    reason: string;
  }[];

  // Optimization strategy
  strategy: {
    balanceApproach: string; // e.g., "Lead with national, support with school"
    narrativeAlignment: string;
    levelDistribution: Record<CommonAppHonorLevel, number>;
  };
}

/**
 * Competitive context analysis
 */
export interface AwardCompetitiveContext {
  strengthVsPool: 'exceptional' | 'strong' | 'average' | 'below_average';
  percentileEstimate: number; // Where they fall among competitive applicants
  comparisonNarrative: string;

  // School-specific context
  schoolSpecificContext: Record<string, {
    schoolId: string;
    strengthAtThisSchool: 'strong' | 'competitive' | 'average' | 'weak';
    explanation: string;
  }>;

  // Peer comparison
  peerComparison: {
    typicalT20Applicant: string;
    studentComparison: string;
  };
}

/**
 * Gap analysis for awards
 */
export interface AwardGapAnalysis {
  missingCategories: {
    category: AwardCategory;
    importance: 'critical' | 'important' | 'nice_to_have';
    explanation: string;
    suggestions: string[];
  }[];

  opportunitiesToPursue: {
    opportunity: string;
    category: AwardCategory;
    timeline: string;
    difficulty: 'high' | 'medium' | 'low';
    potentialImpact: string;
    howToApproach: string[];
  }[];

  strengtheningRecommendations: string[];
}

// ============================================================================
// KNOWN AWARD DATABASE TYPES
// ============================================================================

/**
 * Known award profile (for recognition database)
 */
export interface KnownAwardProfile {
  id: string;
  name: string;
  aliases: string[]; // Alternative names
  category: AwardCategory;
  recognitionLevel: AwardRecognitionLevel;
  selectivity: AwardSelectivity;

  // Selection data
  annualRecipients?: number;
  annualApplicants?: number;
  selectionRate?: number;

  // Description
  description: string;
  website?: string;

  // Admissions context
  admissionsImpact: 'major' | 'moderate' | 'minor';
  howAdmissionsViewIt: string;

  // Relevance mapping
  relevantMajors: string[];
  relevantColleges?: string[]; // Schools that particularly value this

  // Common App guidance
  suggestedDescription: string;
  suggestedLevel: CommonAppHonorLevel;
}

// ============================================================================
// COMPLETE AWARD EVALUATION OUTPUT
// ============================================================================

/**
 * Complete Award Evaluation Output
 */
export interface AwardEvaluation {
  // Timestamp and version
  evaluatedAt: string;
  version: string;

  // Overall assessment
  overallScore: number; // 0-100
  overallStrength: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
  overallNarrative: string;

  // Distribution analysis
  distribution: AwardDistributionAnalysis;

  // Individual assessments
  awardAssessments: Record<string, AwardAssessment>;

  // Highlights
  highlights: AwardHighlightsAnalysis;

  // Common App optimization
  commonAppOptimization: CommonAppHonorsOptimization;

  // Competitive context
  competitiveContext: AwardCompetitiveContext;

  // Gap analysis
  gapAnalysis: AwardGapAnalysis;

  // Synthesized insights
  awardsNarrative: {
    headline: string;
    strengths: string[];
    concerns: string[];
    uniqueAspects: string[];
    admissionsStory: string; // How awards support the application narrative
  };

  // Connection to activities
  activityConnections: {
    awardId: string;
    activityId: string;
    connectionStrength: 'strong' | 'moderate' | 'weak';
    narrativeValue: string;
  }[];

  // Actionable guidance
  recommendations: {
    presentation: string[]; // How to present current awards
    pursue: string[]; // Awards to go after
    timeline: string[]; // Time-sensitive opportunities
    positioning: string[]; // Strategic positioning advice
  };

  // Metadata
  inputDataHash: string;
  confidenceScore: number;
}
