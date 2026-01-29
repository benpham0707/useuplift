/**
 * Nuanced Extracurricular Profiling Types
 *
 * Comprehensive type definitions for deep, professional-grade activity analysis
 * that understands the subtleties and context that elite admissions counselors use.
 *
 * This system goes beyond basic tier classification to understand:
 * - Field-specific expectations and benchmarks
 * - Description quality with coaching feedback
 * - Time commitment credibility and efficiency
 * - Activity interconnections and narrative coherence
 * - Major-activity alignment with gap detection
 *
 * @module nuancedProfiling
 */

import { ActivityTier, ActivityCategory, LeadershipType, RecognitionLevel, ImpactType } from './activities';
import { MajorCategory } from '../knowledge/majorActivityAlignment';

// ============================================================================
// FIELD-SPECIFIC EXPECTATIONS
// ============================================================================

/**
 * What's expected/impressive for a specific field
 */
export interface FieldExpectations {
  major: MajorCategory;

  // Tier expectations for competitive applicants
  tierExpectations: {
    minimumTier1Count: number; // How many Tier 1s expected (usually 0-2)
    minimumTier2Count: number; // How many Tier 2s expected (usually 1-3)
    expectedActivities: string[]; // Activities competitive applicants typically have
    bonusActivities: string[]; // Activities that stand out
    warningSignals: string[]; // Activities that raise questions for this major
  };

  // Field-specific impact metrics
  impactBenchmarks: {
    exceptional: { metric: string; threshold: string }[];
    strong: { metric: string; threshold: string }[];
    baseline: { metric: string; threshold: string }[];
  };

  // Field-specific description expectations
  descriptionExpectations: {
    keyTerms: string[]; // Terms that signal field knowledge
    actionVerbs: string[]; // Strong verbs for this field
    quantificationExamples: string[]; // How to quantify impact
    avoidTerms: string[]; // Terms that suggest unfamiliarity
  };

  // Typical progression for genuine interest
  genuineInterestMarkers: {
    earlySignals: string[]; // 9th-10th grade indicators
    developmentPattern: string[]; // How interest typically deepens
    matureIndicators: string[]; // 11th-12th grade markers of authenticity
  };

  // Common mistakes applicants make
  commonMistakes: {
    mistake: string;
    whyItHurts: string;
    howToFix: string;
  }[];
}

// ============================================================================
// DESCRIPTION QUALITY ANALYSIS
// ============================================================================

/**
 * Detailed description quality assessment with coaching
 */
export interface DescriptionQualityAnalysis {
  activityId: string;
  originalDescription: string;

  // Overall assessment
  overallScore: number; // 0-100
  qualityLevel: 'exceptional' | 'strong' | 'adequate' | 'weak' | 'problematic';

  // Dimension scores
  dimensions: {
    specificity: {
      score: number; // 0-100
      evidence: string[];
      issues: string[];
    };
    impactClarity: {
      score: number;
      evidence: string[];
      issues: string[];
    };
    quantification: {
      score: number;
      metricsFound: string[];
      missingMetrics: string[];
    };
    actionVerbs: {
      score: number;
      strongVerbs: string[];
      weakVerbs: string[];
    };
    uniqueness: {
      score: number;
      uniqueElements: string[];
      genericElements: string[];
    };
    fieldAlignment: {
      score: number;
      alignedTerms: string[];
      misalignedTerms: string[];
    };
  };

  // Specific issues detected
  issues: {
    type: 'vague' | 'generic' | 'inflated' | 'passive' | 'missing_impact' | 'no_ownership' | 'wrong_tone';
    severity: 'critical' | 'major' | 'minor';
    location: string; // Which part of description
    explanation: string;
    fix: string;
  }[];

  // Coaching feedback
  coaching: {
    whatWorksWell: string[];
    priorityImprovements: string[];
    specificSuggestions: {
      current: string;
      suggested: string;
      reason: string;
    }[];
    reframingAdvice: string; // How to better position this activity
  };

  // Optimized description suggestion
  suggestedDescription: {
    text: string; // 150-char optimized version
    characterCount: number;
    improvements: string[];
  };
}

// ============================================================================
// TIME COMMITMENT ANALYSIS
// ============================================================================

/**
 * Detailed time commitment credibility analysis
 */
export interface TimeCommitmentAnalysis {
  activityId: string;

  // Raw data
  hoursPerWeek: number;
  weeksPerYear: number;
  yearsInvolved: number;
  totalHours: number;
  gradeLevels: number[];

  // Credibility assessment
  credibility: {
    score: number; // 0-100
    level: 'highly_credible' | 'credible' | 'questionable' | 'implausible';
    concerns: string[];
  };

  // Category-specific benchmarks
  categoryBenchmark: {
    typicalHoursPerWeek: { min: number; max: number };
    typicalWeeksPerYear: { min: number; max: number };
    isWithinNorms: boolean;
    deviation: string; // 'normal', 'high', 'very_high', 'implausible'
  };

  // Efficiency analysis (impact per hour)
  efficiency: {
    score: number; // 0-100
    level: 'exceptional' | 'high' | 'average' | 'low' | 'concerning';
    impactPerHour: string; // Qualitative assessment
    comparison: string; // How this compares to similar activities
  };

  // Progression analysis
  progression: {
    hasProgression: boolean;
    pattern: 'increasing' | 'stable' | 'decreasing' | 'fluctuating' | 'unknown';
    significanceSignal: string; // What the pattern suggests
  };

  // Realism check
  realismCheck: {
    claimedTier: ActivityTier;
    expectedMinimumHours: number;
    expectedMaximumHours: number;
    isRealistic: boolean;
    redFlags: string[];
  };

  // Combined with other activities
  portfolioContext: {
    totalWeeklyHours: number;
    percentageOfTotal: number;
    isSustainable: boolean;
    balanceAssessment: string;
  };
}

// ============================================================================
// ACTIVITY INTERCONNECTION ANALYSIS
// ============================================================================

/**
 * How activities connect and reinforce each other
 */
export interface ActivityInterconnection {
  activity1Id: string;
  activity2Id: string;

  connectionType:
    | 'skill_transfer' // Skills from A used in B
    | 'thematic_alignment' // Same theme/interest
    | 'progression' // A led to B naturally
    | 'complementary' // Different aspects of same interest
    | 'resource_sharing' // Same organization/community
    | 'impact_amplification' // Together greater than sum
    | 'none'; // No meaningful connection

  strength: 'strong' | 'moderate' | 'weak' | 'none';

  explanation: string;

  narrativeValue: {
    storyPotential: 'high' | 'medium' | 'low';
    suggestedNarrative: string;
  };
}

/**
 * Complete interconnection analysis for portfolio
 */
export interface PortfolioInterconnectionAnalysis {
  // Overall connectivity
  overallConnectivity: {
    score: number; // 0-100
    level: 'highly_connected' | 'well_connected' | 'moderately_connected' | 'loosely_connected' | 'disconnected';
    primaryThread: string;
    secondaryThreads: string[];
  };

  // Activity clusters (groups that connect)
  clusters: {
    id: string;
    activities: string[];
    theme: string;
    strength: number;
    narrativePotential: string;
  }[];

  // Orphan activities (don't connect well)
  orphanActivities: {
    activityId: string;
    reason: string;
    suggestion: string; // How to connect or whether to deemphasize
  }[];

  // Individual connections
  connections: ActivityInterconnection[];

  // Narrative synthesis
  narrativeSynthesis: {
    primaryNarrative: string;
    supportingNarratives: string[];
    gaps: string[];
    strengtheningSuggestions: string[];
  };

  // Skill progression map
  skillProgression: {
    skill: string;
    activities: string[]; // In chronological order of development
    progressionEvidence: string;
  }[];
}

// ============================================================================
// MAJOR-ACTIVITY ALIGNMENT (DEEP ANALYSIS)
// ============================================================================

/**
 * Deep major alignment analysis with gap detection
 */
export interface MajorAlignmentAnalysis {
  intendedMajor: MajorCategory;
  majorCertainty: 'certain' | 'likely' | 'exploring' | 'undecided';

  // Overall alignment assessment
  overallAlignment: {
    score: number; // 0-100
    level: 'exceptional' | 'strong' | 'adequate' | 'weak' | 'misaligned';
    narrative: string;
  };

  // Activity-by-activity alignment
  activityAlignments: {
    activityId: string;
    alignmentScore: number; // 0-5
    alignmentType: 'core' | 'supporting' | 'complementary' | 'neutral' | 'misaligned';
    explanation: string;
    howToStrengthen?: string;
  }[];

  // Strongly aligned activities
  stronglyAligned: {
    activities: string[];
    collectiveStrength: string;
    narrative: string;
  };

  // Gap analysis
  gaps: {
    gapType: 'missing_depth' | 'missing_breadth' | 'missing_research' | 'missing_leadership' | 'missing_practical';
    description: string;
    severity: 'critical' | 'significant' | 'moderate' | 'minor';
    recommendation: string;
    suggestedActivities: string[];
  }[];

  // Red flags for this major
  redFlags: {
    issue: string;
    severity: 'critical' | 'moderate' | 'minor';
    explanation: string;
    mitigation: string;
  }[];

  // Competitive assessment
  competitiveAssessment: {
    vsTypicalApplicant: 'well_above' | 'above' | 'at_par' | 'below' | 'well_below';
    vsTopApplicant: 'competitive' | 'developing' | 'needs_work';
    strengthsForMajor: string[];
    weaknessesForMajor: string[];
  };

  // Recommendations
  recommendations: {
    immediate: string[]; // Can do now
    shortTerm: string[]; // Within 3-6 months
    longTerm: string[]; // 6+ months
    descriptionOptimizations: string[]; // How to reframe existing activities
  };
}

// ============================================================================
// AUTHENTICITY SIGNALS
// ============================================================================

/**
 * Signals of genuine vs manufactured interest
 */
export interface AuthenticityAnalysis {
  activityId: string;

  // Overall authenticity
  overallScore: number; // 0-100
  level: 'highly_authentic' | 'authentic' | 'neutral' | 'questionable' | 'likely_manufactured';

  // Positive signals
  authenticitySignals: {
    signal: string;
    evidence: string;
    strength: 'strong' | 'moderate' | 'weak';
  }[];

  // Concern signals
  concernSignals: {
    signal: string;
    evidence: string;
    severity: 'high' | 'medium' | 'low';
    mitigation?: string;
  }[];

  // Timeline analysis
  timelineAssessment: {
    startTiming: 'early' | 'mid' | 'late' | 'very_late';
    progression: 'natural' | 'accelerated' | 'stagnant' | 'suspicious';
    longevity: 'sustained' | 'moderate' | 'brief';
    overallImpression: string;
  };

  // Verification indicators
  verificationIndicators: {
    hasExternalValidation: boolean;
    validationTypes: string[];
    verifiabilityLevel: 'highly_verifiable' | 'verifiable' | 'somewhat_verifiable' | 'difficult_to_verify';
  };
}

// ============================================================================
// COMPREHENSIVE NUANCED PROFILE
// ============================================================================

/**
 * Complete nuanced activity profile output
 */
export interface NuancedActivityProfile {
  // Metadata
  evaluatedAt: string;
  version: string;

  // Student context
  studentContext: {
    intendedMajor: MajorCategory;
    majorCertainty: 'certain' | 'likely' | 'exploring' | 'undecided';
    gradeLevel: number;
    constraints?: string[]; // First-gen, low-income, etc.
  };

  // Activity-level analysis
  activityProfiles: {
    activityId: string;
    activityName: string;

    // Basic classification
    tier: ActivityTier;
    tierConfidence: number;

    // Deep analysis
    descriptionQuality: DescriptionQualityAnalysis;
    timeCommitment: TimeCommitmentAnalysis;
    authenticity: AuthenticityAnalysis;
    majorAlignment: {
      score: number;
      type: 'core' | 'supporting' | 'complementary' | 'neutral' | 'misaligned';
    };

    // Overall assessment
    overallStrength: 'exceptional' | 'strong' | 'solid' | 'adequate' | 'weak';
    strategicValue: number; // 0-100, how much this helps the application
    narrativeContribution: string;

    // Action items
    priorityImprovements: string[];
  }[];

  // Portfolio-level analysis
  portfolioAnalysis: {
    // Major alignment
    majorAlignment: MajorAlignmentAnalysis;

    // Interconnections
    interconnections: PortfolioInterconnectionAnalysis;

    // Time credibility
    totalTimeCredibility: {
      totalClaimedHours: number;
      credibilityScore: number;
      sustainabilityAssessment: string;
    };

    // Overall narrative
    narrativeStrength: {
      score: number;
      primaryStory: string;
      supportingElements: string[];
      gaps: string[];
    };
  };

  // Field-specific assessment
  fieldSpecificAssessment: {
    expectations: FieldExpectations;
    meetsExpectations: boolean;
    exceedsIn: string[];
    fallsShortIn: string[];
    competitivePosition: string;
  };

  // Comprehensive recommendations
  recommendations: {
    // Description improvements
    descriptionPriorities: {
      activityId: string;
      currentDescription: string;
      suggestedDescription: string;
      improvementRationale: string;
    }[];

    // Activity strategy
    activityStrategy: {
      activitiesToHighlight: string[];
      activitiesToDeemphasize: string[];
      activitiesToExpand: string[];
      newActivitiesSuggested: string[];
    };

    // Narrative strategy
    narrativeStrategy: {
      primaryNarrative: string;
      howToSupport: string[];
      commonAppOrder: string[];
    };

    // Time-bound actions
    actionPlan: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  };

  // Confidence and caveats
  analysisConfidence: {
    overallConfidence: number;
    caveats: string[];
    areasNeedingMoreInfo: string[];
  };
}

// ============================================================================
// ANALYSIS REQUEST TYPES
// ============================================================================

/**
 * Input for nuanced profiling analysis
 */
export interface NuancedProfilingInput {
  activities: {
    id: string;
    name: string;
    organization?: string;
    category: ActivityCategory;
    description: string;
    role: string;
    hoursPerWeek: number;
    weeksPerYear: number;
    yearsInvolved: number;
    gradeLevels: number[];
    isPaid: boolean;
    achievements?: { title: string; level: RecognitionLevel; date: string }[];
  }[];

  studentContext: {
    intendedMajor: string;
    majorCertainty?: 'certain' | 'likely' | 'exploring' | 'undecided';
    gradeLevel: number;
    targetSchools?: string[];
    isFirstGen?: boolean;
    isLowIncome?: boolean;
    isRural?: boolean;
    isInternational?: boolean;
  };

  analysisOptions?: {
    includeDescriptionCoaching?: boolean;
    includeOptimizedDescriptions?: boolean;
    includeFieldComparison?: boolean;
    detailLevel?: 'comprehensive' | 'standard' | 'summary';
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export type {
  FieldExpectations,
  DescriptionQualityAnalysis,
  TimeCommitmentAnalysis,
  ActivityInterconnection,
  PortfolioInterconnectionAnalysis,
  MajorAlignmentAnalysis,
  AuthenticityAnalysis,
  NuancedActivityProfile,
  NuancedProfilingInput,
};
