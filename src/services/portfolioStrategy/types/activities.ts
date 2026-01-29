/**
 * Activity Portfolio Analysis Types
 *
 * Comprehensive type definitions for extracurricular activity assessment.
 * These types support deep analysis of activity tiers, spike detection,
 * thematic coherence, leadership, and strategic positioning.
 */

// ============================================================================
// CORE ACTIVITY TYPES
// ============================================================================

/**
 * Activity tier levels (industry standard)
 * Based on CollegeVine and admissions consultant frameworks
 */
export type ActivityTier = 1 | 2 | 3 | 4;

/**
 * Detailed tier descriptions for classification
 */
export const ACTIVITY_TIER_DESCRIPTIONS = {
  1: 'National/international recognition, founding successful organizations, significant research with publications, Olympic-level athletics',
  2: 'State/regional leadership, significant awards, sustained high-level achievement, published work',
  3: 'School leadership, consistent commitment, demonstrated local impact, meaningful contribution',
  4: 'General participation, club membership, basic involvement without leadership or distinction',
} as const;

/**
 * Activity category taxonomy
 */
export type ActivityCategory =
  | 'academic_competition'      // Math Olympiad, Science Bowl, Debate
  | 'research'                  // Lab research, independent research
  | 'stem_project'              // Robotics, coding projects, engineering
  | 'arts_performance'          // Music, theater, dance performance
  | 'arts_visual'               // Painting, photography, film
  | 'arts_literary'             // Creative writing, journalism, poetry
  | 'athletics'                 // Sports, individual or team
  | 'community_service'         // Volunteering, nonprofit work
  | 'leadership_governance'     // Student government, club leadership
  | 'entrepreneurship'          // Starting businesses, organizations
  | 'work_experience'           // Paid employment
  | 'family_responsibilities'   // Caregiving, family business
  | 'cultural_heritage'         // Cultural organizations, language preservation
  | 'religious_faith'           // Religious activities, faith-based service
  | 'special_interest'          // Hobbies, collections, niche interests
  | 'internship'                // Professional internships
  | 'summer_program'            // Summer programs, camps, institutes
  | 'other';

/**
 * Leadership type classification
 */
export type LeadershipType =
  | 'founder'                   // Created the organization/initiative
  | 'president_captain'         // Top leadership position
  | 'executive_board'           // VP, Secretary, Treasurer, etc.
  | 'team_lead'                 // Led a team/project/section
  | 'mentor_teacher'            // Taught or mentored others
  | 'committee_chair'           // Led a committee or working group
  | 'elected_representative'    // Elected by peers
  | 'appointed_leader'          // Selected for leadership
  | 'informal_leader'           // Led without title
  | 'none';                     // No leadership role

/**
 * Recognition/achievement level
 */
export type RecognitionLevel =
  | 'international'             // IMO, ISEF Grand Prize, Olympics
  | 'national'                  // National finalist/winner, All-American
  | 'regional'                  // Multi-state recognition
  | 'state'                     // State-level recognition
  | 'district'                  // District/county level
  | 'school'                    // School-level recognition
  | 'local'                     // Community/local recognition
  | 'none';                     // No external recognition

/**
 * Impact type classification
 */
export type ImpactType =
  | 'quantifiable'              // Numbers: raised $X, served Y people
  | 'organizational'            // Changed how organization works
  | 'community'                 // Impact on community
  | 'personal_growth'           // Personal development story
  | 'skill_development'         // Developed significant skills
  | 'creative_output'           // Created something (art, code, product)
  | 'competitive_success'       // Won competitions
  | 'mentorship'                // Helped others grow
  | 'unclear';                  // Impact not clearly articulated

/**
 * Spike strength classification
 */
export type SpikeStrength =
  | 'national'                  // National-level spike (Tier 1 activities)
  | 'regional'                  // Regional/state spike (Tier 1-2 activities)
  | 'local'                     // Local spike (Tier 2-3 activities)
  | 'emerging'                  // Developing spike (potential but not yet realized)
  | 'none';                     // No clear spike

/**
 * Depth vs breadth classification
 */
export type DepthBreadthProfile =
  | 'deep_spike'                // 1-2 activities at very high level
  | 'depth_focused'             // 3-4 activities with clear depth
  | 'balanced'                  // Mix of depth and breadth
  | 'broad_engaged'             // Many activities, moderate depth
  | 'spread_thin';              // Too many activities, insufficient depth

// ============================================================================
// INPUT TYPES (from student data)
// ============================================================================

/**
 * Time commitment data
 */
export interface TimeCommitment {
  hoursPerWeek: number;
  weeksPerYear: number;
  totalHours: number;
  yearsInvolved: number;
  gradeLevels: number[]; // 9, 10, 11, 12
  isCurrent: boolean;
  isYearRound: boolean;
  isSeasonal: boolean;
}

/**
 * Leadership position within an activity
 */
export interface LeadershipPosition {
  title: string;
  type: LeadershipType;
  startDate: string;
  endDate?: string;
  responsibilities: string[];
  achievements: string[];
}

/**
 * Achievement/recognition within an activity
 */
export interface ActivityAchievement {
  achievement: string;
  level: RecognitionLevel;
  date: string;
  description?: string;
  verifiable: boolean;
}

/**
 * Raw activity data from student profile
 */
export interface ActivityInputData {
  id: string;
  name: string;
  organization?: string;
  category: ActivityCategory;
  description: string;
  role: string;
  timeCommitment: TimeCommitment;
  leadershipPositions: LeadershipPosition[];
  achievements: ActivityAchievement[];
  impact?: string;
  isPaid: boolean;
  verificationUrl?: string;
  supervisorContact?: string;
}

/**
 * Complete activities input
 */
export interface ActivitiesInputData {
  activities: ActivityInputData[];
  totalWeeklyHours: number;
  primaryFocus?: string; // Student's stated primary focus
}

// ============================================================================
// TIER CLASSIFICATION TYPES
// ============================================================================

/**
 * Detailed tier classification result for a single activity
 */
export interface ActivityTierAssessment {
  activityId: string;
  activityName: string;
  category: ActivityCategory;

  // Tier assignment
  assignedTier: ActivityTier;
  tierConfidence: number; // 0-100
  tierJustification: string;

  // Scoring breakdown
  tierFactors: {
    recognitionLevel: { level: RecognitionLevel; score: number; weight: number };
    leadershipQuality: { type: LeadershipType; score: number; weight: number };
    impactDemonstrated: { type: ImpactType; score: number; weight: number };
    timeCommitment: { score: number; weight: number };
    uniqueness: { score: number; weight: number };
    progression: { score: number; weight: number }; // Growth over time
  };

  // Strategic insights
  upgradePathway?: {
    targetTier: ActivityTier;
    steps: string[];
    feasibility: 'high' | 'medium' | 'low';
    timeRequired: string;
  };

  // Common App positioning
  commonAppPositioning: {
    suggestedActivityType: string;
    suggestedPosition: string;
    suggestedOrganization: string;
    suggestedDescription: string; // Optimized 150-char description
    orderPriority: number; // 1-10, where to place in list
  };

  // Narrative contribution
  narrativeValue: {
    contributesToTheme: string[];
    uniqueAspect: string;
    storytellingPotential: 'high' | 'medium' | 'low';
  };
}

// ============================================================================
// SPIKE ANALYSIS TYPES
// ============================================================================

/**
 * Theme cluster for spike detection
 */
export interface ThemeCluster {
  theme: string;
  themeCategory: string; // e.g., "STEM", "Social Impact", "Arts"
  activities: string[]; // Activity IDs
  totalTierScore: number; // Sum of tier values (lower = better)
  averageTier: number;
  tier1Count: number;
  tier2Count: number;
  externalValidation: string[]; // Awards, recognition in this theme
  coherenceScore: number; // 0-100, how well activities connect
}

/**
 * Complete spike analysis
 */
export interface SpikeAnalysis {
  hasSpike: boolean;
  spikeStrength: SpikeStrength;

  primarySpike?: {
    area: string;
    description: string;
    activities: string[];
    tier1Activities: string[];
    recognition: string[];
    narrative: string; // One-paragraph spike story
    admissionsImpact: string;
  };

  secondarySpike?: {
    area: string;
    activities: string[];
    strength: SpikeStrength;
  };

  // For students without clear spikes
  spikeRecommendations?: {
    mostPromising: {
      area: string;
      currentStrength: string;
      pathToSpike: string[];
    };
    alternativeStrategies: string[];
  };

  // College-specific spike relevance
  spikeRelevance: Record<string, {
    schoolId: string;
    relevance: 'high' | 'medium' | 'low';
    explanation: string;
  }>;
}

// ============================================================================
// THEMATIC COHERENCE TYPES
// ============================================================================

/**
 * Thematic coherence analysis
 */
export interface ThematicCoherenceAnalysis {
  overallCoherenceScore: number; // 0-100

  primaryTheme: {
    theme: string;
    activities: string[];
    strength: number;
    narrative: string;
  };

  secondaryTheme?: {
    theme: string;
    activities: string[];
    strength: number;
    connectionToPrimary?: string;
  };

  // Theme distribution
  themeDistribution: Record<string, number>; // theme -> activity count

  // Coherence insights
  coherenceInsights: {
    narrativeThread: string; // The story the activities tell
    disconnectedActivities: string[]; // Activities that don't fit
    strengtheningOpportunities: string[]; // How to improve coherence
  };

  // Brand alignment
  brandAlignment: {
    suggestedArchetype: string; // e.g., "The Researcher", "The Leader"
    archetypeStrength: number;
    supportingActivities: string[];
  };
}

// ============================================================================
// COMMITMENT & LEADERSHIP ANALYSIS TYPES
// ============================================================================

/**
 * Time commitment analysis
 */
export interface CommitmentAnalysis {
  totalWeeklyHours: number;
  averageHoursPerActivity: number;

  // Commitment quality
  sustainedCommitments: number; // Activities with 2+ years
  deepCommitments: number; // 10+ hours/week
  progressionShown: number; // Activities showing growth over time

  // Profile classification
  depthVsBreadth: DepthBreadthProfile;
  depthBreadthExplanation: string;

  // Time distribution
  timeDistribution: {
    category: ActivityCategory;
    hours: number;
    percentage: number;
  }[];

  // Commitment insights
  insights: {
    mostDedicated: string; // Activity with most hours
    longestCommitment: string; // Activity with most years
    balanceAssessment: string;
  };

  // Recommendations
  recommendations: string[];
}

/**
 * Leadership profile analysis
 */
export interface LeadershipAnalysis {
  overallLeadershipScore: number; // 0-100

  // Leadership inventory
  formalPositions: number;
  founderInitiatives: number;
  electedPositions: number;
  teamLeadership: number;
  mentorshipRoles: number;

  // Leadership quality
  leadershipQuality: {
    depth: 'exceptional' | 'strong' | 'moderate' | 'limited';
    breadth: 'diverse' | 'focused' | 'narrow';
    impact: 'transformative' | 'significant' | 'moderate' | 'limited';
  };

  // Leadership narrative
  leadershipNarrative: {
    headline: string;
    story: string;
    keyExamples: string[];
  };

  // Leadership style
  leadershipStyle: {
    primary: string; // e.g., "Initiative-taker", "Team builder"
    characteristics: string[];
    evidence: string[];
  };

  // Gaps and recommendations
  gaps: string[];
  recommendations: string[];
}

// ============================================================================
// COMPLETE ACTIVITY PORTFOLIO ANALYSIS OUTPUT
// ============================================================================

/**
 * Activity upgrade recommendation
 */
export interface ActivityUpgradeRecommendation {
  activityId: string;
  activityName: string;
  currentTier: ActivityTier;
  potentialTier: ActivityTier;
  upgradeSteps: string[];
  resources: string[];
  feasibility: 'high' | 'medium' | 'low';
  impactIfAchieved: string;
}

/**
 * New activity suggestion
 */
export interface NewActivitySuggestion {
  suggestion: string;
  category: ActivityCategory;
  rationale: string;
  fitWithProfile: string;
  potentialTier: ActivityTier;
  timeRequired: string;
  howToStart: string[];
}

/**
 * Complete Activity Portfolio Analysis Output
 */
export interface ActivityPortfolioAnalysis {
  // Timestamp and version
  evaluatedAt: string;
  version: string;

  // Overall assessment
  overallScore: number; // 0-100
  overallStrength: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
  overallNarrative: string;

  // Tier breakdown
  tierBreakdown: {
    tier1: ActivityTierAssessment[];
    tier2: ActivityTierAssessment[];
    tier3: ActivityTierAssessment[];
    tier4: ActivityTierAssessment[];
  };
  tierSummary: {
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
    averageTier: number;
    tierDistributionAssessment: string;
  };

  // Individual activity assessments
  activityAssessments: Record<string, ActivityTierAssessment>;

  // Spike analysis
  spikeAnalysis: SpikeAnalysis;

  // Thematic coherence
  thematicCoherence: ThematicCoherenceAnalysis;

  // Commitment analysis
  commitmentAnalysis: CommitmentAnalysis;

  // Leadership analysis
  leadershipAnalysis: LeadershipAnalysis;

  // Synthesized insights
  portfolioNarrative: {
    headline: string;
    oneLineSummary: string;
    strengths: string[];
    concerns: string[];
    uniqueAspects: string[];
    competitiveAdvantages: string[];
  };

  // Common App optimization
  commonAppOptimization: {
    suggestedOrder: string[]; // Activity IDs in recommended order
    activitiesToHighlight: string[];
    activitiesToDeemphasize: string[];
    narrativeStrategy: string;
  };

  // Actionable guidance
  recommendations: {
    upgrades: ActivityUpgradeRecommendation[];
    newActivities: NewActivitySuggestion[];
    positioningAdvice: string[];
    timeAllocation: string[];
  };

  // Metadata
  inputDataHash: string;
  confidenceScore: number;
}
