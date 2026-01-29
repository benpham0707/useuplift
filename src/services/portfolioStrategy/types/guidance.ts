/**
 * Guidance & Action Types
 *
 * Comprehensive type definitions for actionable recommendations,
 * prioritized guidance, and progress tracking. This is where
 * analysis becomes action.
 */

// ============================================================================
// CORE ACTION TYPES
// ============================================================================

/**
 * Action item priority levels
 */
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Action item category
 */
export type ActionCategory =
  | 'academic'      // Course selection, GPA improvement, testing
  | 'activity'      // Extracurricular activities
  | 'award'         // Awards and recognition to pursue
  | 'essay'         // Essay preparation and writing
  | 'school'        // School list and applications
  | 'networking'    // Recommendations, demonstrated interest
  | 'admin';        // Administrative tasks

/**
 * Action item effort level
 */
export type ActionEffort = 'minimal' | 'moderate' | 'significant' | 'major';

/**
 * Action item status
 */
export type ActionStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';

/**
 * Time horizon for actions
 */
export type TimeHorizon = 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'ongoing';

// ============================================================================
// ACTION ITEM TYPES
// ============================================================================

/**
 * Detailed action item
 */
export interface ActionItem {
  // Identification
  id: string;
  title: string;
  description: string;

  // Classification
  category: ActionCategory;
  priority: ActionPriority;
  timeHorizon: TimeHorizon;

  // Impact assessment
  impact: {
    description: string;
    magnitude: 'transformative' | 'significant' | 'moderate' | 'incremental';
    affectedAreas: string[];
    potentialScoreIncrease?: number;
  };

  // Effort assessment
  effort: {
    level: ActionEffort;
    hoursRequired?: number;
    complexity: 'simple' | 'moderate' | 'complex';
    dependencies: string[];
  };

  // Timeline
  timeline: {
    suggestedStart?: string;
    deadline?: string;
    isTimeSensitive: boolean;
    timeSensitiveReason?: string;
  };

  // Implementation
  steps: {
    step: string;
    details?: string;
    resources?: string[];
  }[];

  // Resources
  resources?: {
    type: 'link' | 'document' | 'contact' | 'tool';
    name: string;
    url?: string;
    description?: string;
  }[];

  // Tracking
  status: ActionStatus;
  progress?: number; // 0-100
  notes?: string;

  // Relationships
  relatedActions?: string[];
  relatedSchools?: string[];
  relatedActivities?: string[];
}

/**
 * Action item summary (lighter weight)
 */
export interface ActionItemSummary {
  id: string;
  title: string;
  category: ActionCategory;
  priority: ActionPriority;
  effort: ActionEffort;
  deadline?: string;
  status: ActionStatus;
}

// ============================================================================
// CATEGORY-SPECIFIC GUIDANCE TYPES
// ============================================================================

/**
 * Academic guidance
 */
export interface AcademicGuidance {
  currentStrength: string;
  overallAssessment: string;

  // Course selection
  courseRecommendations: {
    forNextSemester: string[];
    forNextYear: string[];
    reasoning: string;
  };

  // GPA improvement
  gpaImprovement?: {
    needed: boolean;
    targetGPA?: number;
    strategies: string[];
  };

  // Testing strategy
  testingStrategy: {
    currentStatus: string;
    recommendations: ActionItem[];
    retakeAdvice?: string;
    superscoreStrategy?: string;
  };

  // Actions
  improvements: ActionItem[];
}

/**
 * Activities guidance
 */
export interface ActivitiesGuidance {
  currentStrength: string;
  overallAssessment: string;

  // Deepen existing activities
  deepenRecommendations: {
    activityId: string;
    activityName: string;
    currentTier: number;
    targetTier: number;
    actions: ActionItem[];
  }[];

  // Add new activities
  addRecommendations: {
    suggestion: string;
    rationale: string;
    fitWithProfile: string;
    howToStart: ActionItem;
  }[];

  // Positioning improvements
  positioningRecommendations: {
    activityId: string;
    activityName: string;
    currentPositioning: string;
    improvedPositioning: string;
    actions: string[];
  }[];

  // Time allocation advice
  timeAllocationAdvice: string[];
}

/**
 * Awards guidance
 */
export interface AwardsGuidance {
  currentStrength: string;
  overallAssessment: string;

  // Awards to pursue
  pursuerecommendations: {
    award: string;
    category: string;
    deadline?: string;
    difficulty: 'high' | 'medium' | 'low';
    potentialImpact: string;
    howToPrepare: ActionItem;
  }[];

  // How to highlight current awards
  highlightRecommendations: {
    awardId: string;
    awardName: string;
    currentPresentation: string;
    improvedPresentation: string;
  }[];
}

/**
 * Essay guidance
 */
export interface EssayGuidance {
  readiness: 'ready' | 'almost_ready' | 'needs_preparation' | 'not_ready';
  readinessExplanation: string;

  // Preparation actions
  preparationActions: ActionItem[];

  // Topic development
  topicRecommendations: {
    essayType: string;
    potentialTopics: string[];
    topicsToAvoid: string[];
    narrativeAdvice: string;
  }[];

  // Writing timeline
  writingTimeline: {
    phase: string;
    deadline: string;
    tasks: string[];
  }[];
}

/**
 * School list guidance
 */
export interface SchoolListGuidance {
  listStrength: 'excellent' | 'good' | 'fair' | 'needs_work';
  listAssessment: string;

  // Modifications
  modifications: {
    add: {
      schoolId: string;
      schoolName: string;
      reason: string;
      category: 'reach' | 'target' | 'likely';
    }[];
    remove: {
      schoolId: string;
      schoolName: string;
      reason: string;
    }[];
    recategorize: {
      schoolId: string;
      schoolName: string;
      currentCategory: string;
      suggestedCategory: string;
      reason: string;
    }[];
  };

  // Application strategy actions
  strategyActions: ActionItem[];
}

// ============================================================================
// MILESTONE & PROGRESS TRACKING TYPES
// ============================================================================

/**
 * Milestone definition
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;

  // Timeline
  targetDate: string;
  isFlexible: boolean;
  flexibilityWindow?: string;

  // Dependencies
  dependencies: string[]; // Other milestone IDs
  blockedBy?: string[];

  // Status
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'missed';
  completedDate?: string;

  // Associated actions
  associatedActions: string[];

  // Success criteria
  successCriteria: string[];
}

/**
 * Progress summary
 */
export interface ProgressSummary {
  // Overall progress
  overallProgress: number; // 0-100
  progressAssessment: 'on_track' | 'slightly_behind' | 'significantly_behind' | 'ahead';

  // Category breakdown
  categoryProgress: {
    category: ActionCategory;
    totalActions: number;
    completedActions: number;
    progress: number;
    status: 'on_track' | 'needs_attention' | 'at_risk';
  }[];

  // Milestone status
  milestoneStatus: {
    total: number;
    completed: number;
    inProgress: number;
    upcoming: number;
    atRisk: number;
  };

  // Next priorities
  nextPriorities: ActionItemSummary[];

  // Alerts
  alerts: {
    type: 'deadline_approaching' | 'milestone_at_risk' | 'action_blocked' | 'schedule_conflict';
    message: string;
    relatedItemId: string;
    urgency: 'high' | 'medium' | 'low';
  }[];
}

// ============================================================================
// COMPLETE GUIDANCE REPORT OUTPUT
// ============================================================================

/**
 * Complete Guidance Report
 */
export interface GuidanceReport {
  // Timestamp and version
  generatedAt: string;
  version: string;

  // Executive summary
  executiveSummary: {
    overallReadiness: 'strong' | 'good' | 'developing' | 'needs_work';
    keyStrengths: string[];
    criticalActions: string[];
    oneLineSummary: string;
    fullSummary: string;
  };

  // Priority actions (across all categories)
  priorityActions: {
    immediate: ActionItem[]; // Do this week
    shortTerm: ActionItem[]; // Do this month
    mediumTerm: ActionItem[]; // Do this quarter
    ongoing: ActionItem[]; // Continuous actions
  };

  // Category-specific guidance
  categoryGuidance: {
    academic: AcademicGuidance;
    activities: ActivitiesGuidance;
    awards: AwardsGuidance;
    essays: EssayGuidance;
    schools: SchoolListGuidance;
  };

  // Milestones
  milestones: Milestone[];

  // Progress tracking
  progress: ProgressSummary;

  // Application calendar
  applicationCalendar: {
    month: string;
    focus: string;
    keyDeadlines: { date: string; item: string }[];
    actions: ActionItemSummary[];
  }[];

  // Risk assessment
  riskAssessment: {
    risks: {
      risk: string;
      likelihood: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      mitigation: string;
    }[];
    overallRiskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  };

  // All actions (complete list)
  allActions: ActionItem[];

  // Metadata
  inputDataHash: string;
  confidenceScore: number;
}

// ============================================================================
// GUIDANCE GENERATION CONFIGURATION
// ============================================================================

/**
 * Configuration for guidance generation
 */
export interface GuidanceGenerationConfig {
  // Current date context
  currentDate: string;
  currentGradeLevel: number;
  targetGraduationYear: number;

  // User preferences
  preferences: {
    preferredPace: 'aggressive' | 'balanced' | 'relaxed';
    availableHoursPerWeek: number;
    focusAreas: ActionCategory[];
  };

  // Priority rules
  priorityRules: {
    condition: string;
    priorityAdjustment: number;
  }[];

  // Deadline configurations
  deadlineBuffer: number; // Days before deadline to flag as urgent
}
