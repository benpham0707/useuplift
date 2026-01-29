/**
 * Action Items Generation Types
 *
 * Comprehensive type definitions for generating, prioritizing, and tracking
 * actionable recommendations. The system produces specific, achievable,
 * time-bound actions tailored to the student's profile and timeline.
 *
 * Key Insight: Good advice is useless without clear next steps. This system
 * transforms analysis into action - telling students exactly what to do,
 * when to do it, and how much it will help.
 *
 * Action Item Principles:
 * 1. Specific - Not "improve activities" but "Apply to USACO by November 15"
 * 2. Achievable - Matched to current ability and resources
 * 3. Prioritized - Most important first, with clear reasoning
 * 4. Time-bound - Deadlines and milestones
 * 5. Measurable - Know when it's done
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { GradeLevel, YearPhase } from './timeline';
import { ProfileStrengthTier } from './profileAssessment';
import { EssayType, EssayStatus } from './essaySystem';
import { MajorCategory } from './majorGuidance';
import { SpikeArea } from './activityOptimization';

// ============================================================================
// ACTION ITEM CLASSIFICATION
// ============================================================================

/**
 * Action item categories
 */
export type ActionCategory =
  // Academic
  | 'course_selection'
  | 'gpa_improvement'
  | 'testing'
  | 'academic_enrichment'

  // Activities
  | 'activity_deepening'
  | 'activity_leadership'
  | 'activity_starting'
  | 'activity_dropping'
  | 'spike_development'

  // Awards & Recognition
  | 'competition_entry'
  | 'award_application'
  | 'recognition_seeking'

  // Essays
  | 'essay_brainstorming'
  | 'essay_drafting'
  | 'essay_revising'
  | 'essay_research'

  // Applications
  | 'school_research'
  | 'school_list'
  | 'demonstrated_interest'
  | 'application_completion'

  // Relationships
  | 'teacher_relationship'
  | 'recommender_selection'
  | 'mentor_finding'

  // Summer
  | 'summer_planning'
  | 'program_application'

  // Other
  | 'profile_documentation'
  | 'interview_prep'
  | 'other';

/**
 * Action priority levels
 */
export type ActionPriority =
  | 'critical'      // Must do - deadline or major impact
  | 'high'          // Should do soon - significant impact
  | 'medium'        // Important but not urgent
  | 'low'           // Nice to do if time allows
  | 'optional';     // Could help, not necessary

/**
 * Action time horizon
 */
export type ActionTimeHorizon =
  | 'immediate'     // This week
  | 'short_term'    // This month
  | 'medium_term'   // This quarter/semester
  | 'long_term'     // This year
  | 'ongoing';      // Continuous

/**
 * Action effort level
 */
export type ActionEffort =
  | 'minimal'       // < 1 hour
  | 'low'           // 1-3 hours
  | 'medium'        // 3-10 hours
  | 'high'          // 10-30 hours
  | 'very_high';    // 30+ hours

/**
 * Action status
 */
export type ActionStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'skipped'
  | 'deferred';

// ============================================================================
// CORE ACTION ITEM TYPES
// ============================================================================

/**
 * Complete action item
 */
export interface ActionItem {
  // Identification
  id: string;
  category: ActionCategory;
  createdAt: string;
  updatedAt: string;

  // Core content
  title: string;                    // Short, action-oriented (e.g., "Apply to RSI")
  description: string;              // Detailed explanation
  rationale: string;                // Why this matters
  specificSteps: string[];          // Exact steps to complete

  // Priority and timing
  priority: ActionPriority;
  timeHorizon: ActionTimeHorizon;
  deadline?: string;                // Hard deadline if applicable
  idealCompletionDate?: string;     // Recommended completion
  windowOpens?: string;             // When action becomes possible
  windowCloses?: string;            // When opportunity expires

  // Effort and resources
  effort: ActionEffort;
  estimatedHours: number;
  resourcesNeeded: string[];
  prerequisites: string[];          // Actions that must be done first

  // Impact assessment
  impact: {
    scoreImprovement: HarvardScoreDecimal;  // Expected Harvard score improvement
    affectedAreas: string[];
    impactDescription: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  };

  // Context
  relevantFor: {
    grades: GradeLevel[];
    profileTiers: ProfileStrengthTier[];
    majors?: MajorCategory[];
    spikeAreas?: SpikeArea[];
  };

  // Dependencies and relationships
  dependencies: {
    blockedBy: string[];            // Action IDs that must complete first
    enables: string[];              // Action IDs this enables
    conflicts: string[];            // Actions this conflicts with
  };

  // Tracking
  status: ActionStatus;
  progress?: number;                // 0-100 percentage
  completedAt?: string;
  notes?: string;

  // Categorization
  tags: string[];
  isRecurring: boolean;
  recurringSchedule?: string;
}

/**
 * Action item with simplified view
 */
export interface ActionItemSummary {
  id: string;
  title: string;
  priority: ActionPriority;
  deadline?: string;
  effort: ActionEffort;
  status: ActionStatus;
  impactScore: HarvardScoreDecimal;
  category: ActionCategory;
}

// ============================================================================
// ACTION GENERATION
// ============================================================================

/**
 * Context for generating action items
 */
export interface ActionGenerationContext {
  // Student info
  gradeLevel: GradeLevel;
  currentPhase: YearPhase;
  profileStrength: ProfileStrengthTier;
  intendedMajor?: MajorCategory;
  spikeArea?: SpikeArea;

  // Current state
  currentActivities: string[];
  currentCourses: string[];
  testScores?: {
    sat?: number;
    act?: number;
    apScores?: { subject: string; score: number }[];
  };
  essayStatus: Record<EssayType, EssayStatus>;
  targetSchools?: string[];

  // Constraints
  constraints: {
    financialConstraints: boolean;
    geographicConstraints: string[];
    timeConstraints: string[];
    otherConstraints: string[];
  };

  // Preferences
  preferences: {
    focusAreas: ActionCategory[];
    avoidAreas: ActionCategory[];
    riskTolerance: 'high' | 'medium' | 'low';
  };
}

/**
 * Generated action plan
 */
export interface ActionPlan {
  // Metadata
  generatedAt: string;
  generatedFor: {
    gradeLevel: GradeLevel;
    phase: YearPhase;
    profileStrength: ProfileStrengthTier;
  };

  // Summary
  summary: {
    totalActions: number;
    criticalActions: number;
    estimatedTotalHours: number;
    topPriority: string;
    overallFocus: string;
  };

  // Categorized actions
  actionsByCategory: Record<ActionCategory, ActionItem[]>;

  // Prioritized list
  prioritizedActions: ActionItem[];

  // Timeline view
  timeline: {
    immediate: ActionItem[];       // This week
    thisMonth: ActionItem[];
    thisQuarter: ActionItem[];
    thisYear: ActionItem[];
    ongoing: ActionItem[];
  };

  // Critical path
  criticalPath: {
    action: ActionItem;
    deadline: string;
    consequence: string;
  }[];

  // Milestones
  milestones: {
    date: string;
    milestone: string;
    actionsRequired: string[];
    significance: string;
  }[];

  // Success metrics
  successMetrics: {
    metric: string;
    target: string;
    currentState: string;
    actionsToAchieve: string[];
  }[];
}

// ============================================================================
// PRIORITY SCORING
// ============================================================================

/**
 * Priority scoring factors
 */
export interface PriorityScoring {
  // Time factors
  urgency: {
    score: number;              // 1-10
    deadline?: string;
    missedOpportunityCost: string;
  };

  // Impact factors
  impact: {
    score: number;              // 1-10
    scoreImprovement: HarvardScoreDecimal;
    breadthOfImpact: number;    // How many areas affected
  };

  // Effort factors
  efficiency: {
    score: number;              // 1-10 (impact/effort ratio)
    effortRequired: ActionEffort;
    returnOnInvestment: string;
  };

  // Feasibility factors
  feasibility: {
    score: number;              // 1-10
    prerequisites: boolean;     // Prerequisites met?
    resourcesAvailable: boolean;
    skillsAvailable: boolean;
  };

  // Overall priority
  overallScore: number;         // Weighted combination
  calculatedPriority: ActionPriority;
  priorityJustification: string;
}

/**
 * Priority calculation weights
 */
export const PRIORITY_WEIGHTS = {
  urgency: 0.30,
  impact: 0.35,
  efficiency: 0.20,
  feasibility: 0.15,
};

// ============================================================================
// CATEGORY-SPECIFIC ACTION TEMPLATES
// ============================================================================

/**
 * Course selection action template
 */
export interface CourseSelectionAction extends ActionItem {
  category: 'course_selection';
  courseDetails: {
    courseName: string;
    alternatives: string[];
    prerequisites: string[];
    whenToTake: GradeLevel;
    whyImportant: string;
    forMajors: MajorCategory[];
  };
}

/**
 * Competition entry action template
 */
export interface CompetitionAction extends ActionItem {
  category: 'competition_entry';
  competitionDetails: {
    competitionName: string;
    organizingBody: string;
    deadline: string;
    registrationProcess: string;
    preparationNeeded: string;
    expectedOutcome: string;
    pastResults?: string;
  };
}

/**
 * Summer program action template
 */
export interface SummerProgramAction extends ActionItem {
  category: 'program_application';
  programDetails: {
    programName: string;
    organization: string;
    deadline: string;
    applicationComponents: string[];
    selectivity: string;
    cost: string;
    financialAid: boolean;
    tips: string[];
  };
}

/**
 * Essay action template
 */
export interface EssayAction extends ActionItem {
  category: 'essay_brainstorming' | 'essay_drafting' | 'essay_revising' | 'essay_research';
  essayDetails: {
    essayType: EssayType;
    schoolName?: string;
    wordLimit: number;
    prompt?: string;
    currentStatus: EssayStatus;
    targetStatus: EssayStatus;
    feedbackIncorporated: string[];
  };
}

/**
 * Recommender action template
 */
export interface RecommenderAction extends ActionItem {
  category: 'teacher_relationship' | 'recommender_selection';
  recommenderDetails: {
    recommenderType: 'teacher' | 'counselor' | 'other';
    subject?: string;
    relationshipStrength: HarvardScoreDecimal;
    targetStrength: HarvardScoreDecimal;
    strategyForStrengthening: string[];
    askDate?: string;
  };
}

// ============================================================================
// ACTION TRACKING
// ============================================================================

/**
 * Action progress tracking
 */
export interface ActionProgress {
  actionId: string;
  status: ActionStatus;
  progress: number;                 // 0-100

  // Timeline
  startedAt?: string;
  lastUpdated: string;
  completedAt?: string;
  dueDate?: string;

  // Progress notes
  updates: {
    date: string;
    note: string;
    progressDelta: number;
  }[];

  // Blockers
  blockers: {
    blocker: string;
    severity: 'critical' | 'significant' | 'minor';
    resolution?: string;
  }[];

  // Outcome
  outcome?: {
    successful: boolean;
    actualImpact: string;
    lessonsLearned: string[];
  };
}

/**
 * Action completion report
 */
export interface ActionCompletionReport {
  actionId: string;
  title: string;
  category: ActionCategory;

  // Completion details
  completedAt: string;
  actualEffort: ActionEffort;
  actualHours: number;

  // Outcome assessment
  outcome: {
    successful: boolean;
    expectedImpact: HarvardScoreDecimal;
    actualImpact?: HarvardScoreDecimal;
    description: string;
  };

  // Learnings
  learnings: {
    whatWorked: string[];
    whatDidnt: string[];
    surprises: string[];
    recommendations: string[];
  };

  // Follow-up
  followUpActions: string[];
}

// ============================================================================
// ACTION PLAN CUSTOMIZATION
// ============================================================================

/**
 * Customization options for action plan
 */
export interface ActionPlanCustomization {
  // Time availability
  hoursPerWeek: number;
  busyPeriods: {
    period: string;
    reason: string;
  }[];

  // Focus preferences
  focusAreas: ActionCategory[];
  avoidAreas: ActionCategory[];

  // Risk tolerance
  riskTolerance: 'high' | 'medium' | 'low';
  preferredApproach: 'aggressive' | 'balanced' | 'conservative';

  // Constraints
  budgetConstraint?: number;
  travelConstraints?: string[];
  familyObligations?: string[];

  // Special circumstances
  specialCircumstances: string[];
}

/**
 * Adjusted action plan based on customization
 */
export interface AdjustedActionPlan extends ActionPlan {
  // Original vs adjusted
  adjustments: {
    original: ActionItem;
    adjusted: ActionItem;
    reason: string;
  }[];

  // Removed actions
  removedActions: {
    action: ActionItem;
    reason: string;
    alternative?: string;
  }[];

  // Added actions
  addedActions: {
    action: ActionItem;
    reason: string;
  }[];

  // Feasibility assessment
  feasibilityAssessment: {
    achievable: boolean;
    totalHoursRequired: number;
    hoursAvailable: number;
    adjustmentsNeeded: string[];
  };
}

// ============================================================================
// ACTION SEQUENCES
// ============================================================================

/**
 * Sequence of related actions
 */
export interface ActionSequence {
  sequenceId: string;
  name: string;
  description: string;
  goal: string;

  // Actions in order
  actions: {
    order: number;
    action: ActionItem;
    dependency: string;           // Why it must come after previous
    gatekeeper: boolean;          // Must complete before continuing?
  }[];

  // Timeline
  totalDuration: string;
  startDate?: string;
  endDate?: string;

  // Success criteria
  successCriteria: {
    criterion: string;
    measurable: boolean;
    target: string;
  }[];

  // Progress
  currentStep: number;
  overallProgress: number;
}

/**
 * Common action sequences
 */
export const COMMON_ACTION_SEQUENCES: {
  name: string;
  forGrades: GradeLevel[];
  description: string;
  actionTypes: ActionCategory[];
}[] = [
  {
    name: 'Summer Program Application Sequence',
    forGrades: ['10th', '11th'],
    description: 'Complete sequence for applying to competitive summer programs',
    actionTypes: ['summer_planning', 'program_application', 'essay_drafting'],
  },
  {
    name: 'Essay Development Sequence',
    forGrades: ['11th', '12th'],
    description: 'Full essay development from brainstorm to final',
    actionTypes: ['essay_brainstorming', 'essay_drafting', 'essay_revising'],
  },
  {
    name: 'Recommender Cultivation Sequence',
    forGrades: ['10th', '11th'],
    description: 'Build relationships for strong recommendations',
    actionTypes: ['teacher_relationship', 'recommender_selection'],
  },
  {
    name: 'Spike Development Sequence',
    forGrades: ['9th', '10th', '11th'],
    description: 'Develop activity from participation to leadership/recognition',
    actionTypes: ['activity_deepening', 'activity_leadership', 'competition_entry'],
  },
  {
    name: 'Application Completion Sequence',
    forGrades: ['12th'],
    description: 'Complete all application components',
    actionTypes: ['application_completion', 'essay_revising', 'school_research'],
  },
];

// ============================================================================
// ACTION ITEM TEMPLATES BY GRADE
// ============================================================================

/**
 * Template actions by grade level
 */
export interface GradeActionTemplates {
  gradeLevel: GradeLevel;
  phase: YearPhase;

  // Typical critical actions
  criticalActions: {
    title: string;
    category: ActionCategory;
    description: string;
    deadline?: string;
  }[];

  // Typical high-priority actions
  highPriorityActions: {
    title: string;
    category: ActionCategory;
    description: string;
    timeHorizon: ActionTimeHorizon;
  }[];

  // Actions to avoid
  actionsToAvoid: {
    action: string;
    whyToAvoid: string;
  }[];

  // Recommended focus
  recommendedFocus: string;
  keyMilestones: string[];
}

/**
 * Grade-specific action templates
 */
export const GRADE_ACTION_TEMPLATES: Record<GradeLevel, GradeActionTemplates> = {
  '9th': {
    gradeLevel: '9th',
    phase: 'fall_semester',
    criticalActions: [
      { title: 'Establish strong study habits', category: 'gpa_improvement', description: 'GPA matters from day 1' },
      { title: 'Explore 5-7 activities', category: 'activity_starting', description: 'Try many things to find interests' },
    ],
    highPriorityActions: [
      { title: 'Build relationships with teachers', category: 'teacher_relationship', description: 'Start early', timeHorizon: 'ongoing' },
      { title: 'Take challenging courses within ability', category: 'course_selection', description: 'Balance rigor and success', timeHorizon: 'immediate' },
    ],
    actionsToAvoid: [
      { action: 'Focusing on college applications', whyToAvoid: 'Too early, will cause burnout' },
      { action: 'Committing heavily to one activity', whyToAvoid: 'Still in exploration phase' },
    ],
    recommendedFocus: 'Academic foundation and interest exploration',
    keyMilestones: ['Strong first semester grades', 'Identified 3-4 interesting activities'],
  },
  '10th': {
    gradeLevel: '10th',
    phase: 'fall_semester',
    criticalActions: [
      { title: 'Take PSAT seriously', category: 'testing', description: 'Practice for National Merit', deadline: 'October' },
      { title: 'Narrow activities to 3-4 core', category: 'activity_deepening', description: 'Time to commit' },
    ],
    highPriorityActions: [
      { title: 'Seek first leadership positions', category: 'activity_leadership', description: 'Run for officer roles', timeHorizon: 'short_term' },
      { title: 'Research summer programs', category: 'summer_planning', description: 'Many deadlines in fall/winter', timeHorizon: 'short_term' },
      { title: 'Begin competing in area of interest', category: 'competition_entry', description: 'Build track record', timeHorizon: 'medium_term' },
    ],
    actionsToAvoid: [
      { action: 'Paying for expensive pre-college programs', whyToAvoid: 'Better free options exist' },
      { action: 'Spreading too thin', whyToAvoid: 'Time for depth over breadth' },
    ],
    recommendedFocus: 'Deepen commitment to core interests, first leadership',
    keyMilestones: ['PSAT taken', 'Leadership position secured', 'Summer program identified'],
  },
  '11th': {
    gradeLevel: '11th',
    phase: 'fall_semester',
    criticalActions: [
      { title: 'Complete SAT/ACT', category: 'testing', description: 'Finish testing by spring', deadline: 'Spring' },
      { title: 'Apply to elite summer programs', category: 'program_application', description: 'Deadlines Nov-Feb', deadline: 'December-February' },
      { title: 'Maximize activity achievements', category: 'spike_development', description: 'Last full year' },
    ],
    highPriorityActions: [
      { title: 'Build college list', category: 'school_list', description: 'Research schools seriously', timeHorizon: 'medium_term' },
      { title: 'Cultivate recommender relationships', category: 'teacher_relationship', description: 'Ask end of junior year', timeHorizon: 'medium_term' },
      { title: 'Begin essay brainstorming', category: 'essay_brainstorming', description: 'Start in spring', timeHorizon: 'medium_term' },
    ],
    actionsToAvoid: [
      { action: 'Waiting until senior year to test', whyToAvoid: 'No time for retakes' },
      { action: 'Neglecting academics for activities', whyToAvoid: 'Junior year grades matter most' },
    ],
    recommendedFocus: 'Peak performance - this is THE year for achievements',
    keyMilestones: ['Testing complete', 'Summer plans set', 'Recommenders identified', 'Essay topics selected'],
  },
  '12th': {
    gradeLevel: '12th',
    phase: 'fall_semester',
    criticalActions: [
      { title: 'Complete ED/EA applications', category: 'application_completion', description: 'Deadlines Nov 1-15', deadline: 'November 1-15' },
      { title: 'Polish personal statement', category: 'essay_revising', description: 'Should be done by mid-October', deadline: 'October 15' },
      { title: 'Submit financial aid forms', category: 'other', description: 'FAFSA/CSS Profile', deadline: 'October-November' },
    ],
    highPriorityActions: [
      { title: 'Complete RD applications', category: 'application_completion', description: 'January deadlines', timeHorizon: 'medium_term' },
      { title: 'Prepare for interviews', category: 'interview_prep', description: 'Schools with interviews', timeHorizon: 'short_term' },
      { title: 'Maintain senior year grades', category: 'gpa_improvement', description: 'No senior slide', timeHorizon: 'ongoing' },
    ],
    actionsToAvoid: [
      { action: 'Starting new activities', whyToAvoid: 'Too late to matter, looks desperate' },
      { action: 'Major schedule changes', whyToAvoid: 'Maintain consistency' },
    ],
    recommendedFocus: 'Application execution - convert your work into admits',
    keyMilestones: ['EA/ED submitted', 'All RD apps submitted', 'Grades maintained', 'Decision made'],
  },
  'gap_year': {
    gradeLevel: 'gap_year',
    phase: 'fall_semester',
    criticalActions: [
      { title: 'Establish structured gap year plan', category: 'other', description: 'Clear goals and activities' },
    ],
    highPriorityActions: [
      { title: 'Document gap year experiences', category: 'profile_documentation', description: 'For reapplications', timeHorizon: 'ongoing' },
    ],
    actionsToAvoid: [
      { action: 'Unstructured time', whyToAvoid: 'Must justify gap year' },
    ],
    recommendedFocus: 'Meaningful, structured experience with clear growth',
    keyMilestones: ['Clear plan in place', 'Major project/experience completed'],
  },
  'transfer': {
    gradeLevel: 'transfer',
    phase: 'fall_semester',
    criticalActions: [
      { title: 'Maintain strong college GPA', category: 'gpa_improvement', description: 'Most important factor' },
      { title: 'Develop compelling "Why transfer" narrative', category: 'essay_drafting', description: 'Must be authentic' },
    ],
    highPriorityActions: [
      { title: 'Engage in college activities', category: 'activity_starting', description: 'Show engagement', timeHorizon: 'ongoing' },
      { title: 'Build professor relationships', category: 'teacher_relationship', description: 'For recommendations', timeHorizon: 'ongoing' },
    ],
    actionsToAvoid: [
      { action: 'Badmouthing current school', whyToAvoid: 'Red flag' },
    ],
    recommendedFocus: 'Academic excellence + clear, positive reasons for transfer',
    keyMilestones: ['Strong first semester GPA', 'Transfer essays drafted', 'Professor recommendations secured'],
  },
};

// ============================================================================
// ACTION IMPACT ESTIMATION
// ============================================================================

/**
 * Estimate impact of completing actions
 */
export interface ActionImpactEstimation {
  // Individual action impact
  actionImpacts: {
    actionId: string;
    action: string;
    estimatedImpact: HarvardScoreDecimal;
    affectedDimensions: string[];
    confidence: 'high' | 'medium' | 'low';
  }[];

  // Cumulative impact
  cumulativeImpact: {
    currentScore: HarvardScoreDecimal;
    projectedScore: HarvardScoreDecimal;
    improvement: HarvardScoreDecimal;
    projectAtGrade: GradeLevel;
  };

  // By category
  impactByCategory: Record<ActionCategory, {
    actionsCount: number;
    totalImpact: HarvardScoreDecimal;
    topAction: string;
  }>;

  // Timeline impact
  timelineImpact: {
    inOneMonth: HarvardScoreDecimal;
    inThreeMonths: HarvardScoreDecimal;
    inSixMonths: HarvardScoreDecimal;
    inOneYear: HarvardScoreDecimal;
  };

  // Key insights
  insights: {
    highestROIActions: string[];
    quickWins: string[];
    bigLifts: string[];
    optionalEnhancements: string[];
  };
}
