/**
 * Profile Assessment Types
 *
 * Comprehensive type definitions for evaluating a student's current profile
 * strength and strategic positioning. This enables tailored guidance based
 * on where the student actually stands, not generic advice.
 *
 * Key Insight: A student who's already competitive for T20 needs different
 * guidance than someone building toward T50. Strategy must fit reality.
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { GradeLevel } from './timeline';
import { ActivityTier } from './activities';

// ============================================================================
// PROFILE STRENGTH CLASSIFICATION
// ============================================================================

/**
 * Overall profile strength tier
 */
export type ProfileStrengthTier =
  | 'exceptional'           // Competitive at any school (T5)
  | 'highly_competitive'    // Strong for T10-20
  | 'competitive'           // Solid for T20-40
  | 'developing'            // Building toward competitive
  | 'building'              // Significant work needed
  | 'rebuilding';           // Overcoming challenges

/**
 * Profile strength by component
 */
export interface ComponentStrengthProfile {
  academic: {
    tier: ProfileStrengthTier;
    score: HarvardScoreDecimal;
    strengths: string[];
    weaknesses: string[];
    trajectory: 'improving' | 'stable' | 'declining';
  };

  activities: {
    tier: ProfileStrengthTier;
    score: HarvardScoreDecimal;
    spikePresent: boolean;
    spikeArea?: string;
    strengths: string[];
    weaknesses: string[];
  };

  awards: {
    tier: ProfileStrengthTier;
    score: HarvardScoreDecimal;
    highestLevel: 'international' | 'national' | 'state' | 'regional' | 'school' | 'none';
    strengths: string[];
    weaknesses: string[];
  };

  essays: {
    tier: ProfileStrengthTier;
    score: HarvardScoreDecimal;
    status: 'not_started' | 'drafting' | 'revising' | 'polished';
    strengths: string[];
    weaknesses: string[];
  };

  recommendations: {
    tier: ProfileStrengthTier;
    score: HarvardScoreDecimal;
    relationshipQuality: 'excellent' | 'good' | 'adequate' | 'weak';
    strengths: string[];
    concerns: string[];
  };
}

// ============================================================================
// COMPREHENSIVE PROFILE ASSESSMENT
// ============================================================================

/**
 * Complete profile assessment
 */
export interface ProfileAssessment {
  // Metadata
  assessedAt: string;
  gradeLevel: GradeLevel;

  // Overall assessment
  overallTier: ProfileStrengthTier;
  overallScore: HarvardScoreDecimal;
  overallNarrative: string;

  // Component breakdown
  componentStrengths: ComponentStrengthProfile;

  // School tier fit
  schoolTierFit: {
    reachTier: SchoolTierFit;
    targetTier: SchoolTierFit;
    safetyTier: SchoolTierFit;
    optimalTargetRange: string;
  };

  // Competitive positioning
  competitivePositioning: {
    strongestAreas: string[];
    weakestAreas: string[];
    uniqueDifferentiators: string[];
    commoditizedAspects: string[];
    strategicAdvantages: string[];
    strategicDisadvantages: string[];
  };

  // Gap analysis
  gapAnalysis: {
    criticalGaps: Gap[];
    significantGaps: Gap[];
    minorGaps: Gap[];
    overallGapAssessment: string;
  };

  // Improvement potential
  improvementPotential: {
    overallPotential: 'high' | 'moderate' | 'limited';
    timelineConstraint: string;
    mostImpactfulChanges: string[];
    realisticCeiling: ProfileStrengthTier;
    ceilingJustification: string;
  };

  // Strategic recommendations
  strategicRecommendations: {
    playToStrengths: string[];
    addressWeaknesses: string[];
    strategicFocus: string;
    timeAllocation: Record<string, number>; // percentage of effort
  };
}

/**
 * Gap in profile
 */
export interface Gap {
  area: string;
  description: string;
  severity: 'critical' | 'significant' | 'minor';
  addressable: boolean;
  timeToAddress: string;
  howToAddress: string[];
  impactIfAddressed: string;
}

/**
 * School tier fit assessment
 */
export interface SchoolTierFit {
  tierDescription: string;
  fitLevel: 'strong' | 'moderate' | 'stretch' | 'significant_reach';
  probabilityRange: { low: number; high: number };
  keyFactors: string[];
  exampleSchools: string[];
}

// ============================================================================
// ACADEMIC PROFILE ASSESSMENT
// ============================================================================

/**
 * Detailed academic profile assessment
 */
export interface AcademicProfileAssessment {
  // GPA analysis
  gpaAnalysis: {
    unweightedGPA: number;
    weightedGPA?: number;
    gpaScale: number;
    percentile: number;
    trend: 'strong_upward' | 'upward' | 'stable' | 'downward' | 'strong_downward';
    trendNarrative: string;
    strengthLevel: HarvardScoreDecimal;
  };

  // Course rigor
  rigorAnalysis: {
    apCoursesTotal: number;
    apCoursesAvailable: number;
    rigorUtilization: number; // percentage of available rigor taken
    honorsCoursesTotal: number;
    rigorLevel: 'maximum' | 'high' | 'moderate' | 'low';
    rigorInContext: string;
    strengthLevel: HarvardScoreDecimal;
  };

  // Testing
  testingAnalysis: {
    satScore?: number;
    actScore?: number;
    satSuperscored?: number;
    actSuperscored?: number;
    apScores: { subject: string; score: number }[];
    testStrength: 'exceptional' | 'strong' | 'competitive' | 'average' | 'below_average' | 'not_submitted';
    testStrategy: 'submit' | 'consider_submitting' | 'dont_submit' | 'needs_improvement';
    strengthLevel: HarvardScoreDecimal;
  };

  // Academic fit for targets
  academicFitAssessment: {
    t10Fit: 'competitive' | 'borderline' | 'below_typical';
    t20Fit: 'competitive' | 'borderline' | 'below_typical';
    t50Fit: 'competitive' | 'borderline' | 'below_typical';
    stateSchoolFit: 'strong' | 'competitive' | 'adequate';
  };

  // Academic recommendations
  academicRecommendations: {
    courseRecommendations: string[];
    testingRecommendations: string[];
    gradeImprovementRecommendations: string[];
  };
}

// ============================================================================
// ACTIVITY PROFILE ASSESSMENT
// ============================================================================

/**
 * Detailed activity profile assessment
 */
export interface ActivityProfileAssessment {
  // Overview
  totalActivities: number;
  yearsOfInvolvement: number;
  averageCommitmentLevel: 'deep' | 'moderate' | 'shallow';

  // Tier distribution
  tierDistribution: {
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
    averageTier: number;
    distributionAssessment: string;
  };

  // Spike analysis
  spikeAnalysis: {
    hasSpike: boolean;
    spikeStrength: 'national' | 'regional' | 'local' | 'emerging' | 'none';
    spikeArea?: string;
    spikeActivities?: string[];
    spikeDevelopmentPotential: string;
    spikeRecommendations: string[];
  };

  // Leadership analysis
  leadershipAnalysis: {
    leadershipPositions: number;
    founderInitiatives: number;
    leadershipLevel: 'exceptional' | 'strong' | 'moderate' | 'limited';
    leadershipNarrative: string;
    leadershipGaps: string[];
  };

  // Thematic coherence
  coherenceAnalysis: {
    coherenceScore: number;
    primaryTheme?: string;
    themeStrength: 'strong' | 'moderate' | 'weak' | 'absent';
    disconnectedActivities: string[];
    coherenceRecommendations: string[];
  };

  // Impact analysis
  impactAnalysis: {
    quantifiedImpacts: string[];
    impactLevel: 'transformative' | 'significant' | 'moderate' | 'limited';
    impactGaps: string[];
    impactRecommendations: string[];
  };

  // Strategic recommendations
  activityRecommendations: {
    strengthen: string[];
    add: string[];
    deprioritize: string[];
    positioningAdvice: string[];
  };
}

// ============================================================================
// PROFILE COMPARISON
// ============================================================================

/**
 * Profile comparison to peer pools
 */
export interface ProfileComparison {
  // Comparison pools
  comparedTo: {
    pool: ComparisonPool;
    yourPercentile: number;
    assessment: string;
  }[];

  // Relative strengths
  relativeStrengths: {
    area: string;
    yourLevel: string;
    typicalLevel: string;
    advantage: 'significant' | 'moderate' | 'slight' | 'none';
  }[];

  // Relative weaknesses
  relativeWeaknesses: {
    area: string;
    yourLevel: string;
    typicalLevel: string;
    disadvantage: 'significant' | 'moderate' | 'slight' | 'none';
  }[];

  // Key differentiators
  keyDifferentiators: {
    differentiator: string;
    rarity: 'very_rare' | 'rare' | 'uncommon' | 'common';
    relevance: string;
  }[];
}

/**
 * Comparison pool types
 */
export type ComparisonPool =
  | 't5_applicants'
  | 't10_applicants'
  | 't20_applicants'
  | 't50_applicants'
  | 'state_school_applicants'
  | 'intended_major_applicants'
  | 'geographic_peers';

// ============================================================================
// STRATEGIC POSITIONING
// ============================================================================

/**
 * Strategic positioning analysis
 */
export interface StrategicPositioning {
  // Current position
  currentPosition: {
    tier: ProfileStrengthTier;
    narrative: string;
    bestFitSchools: string[];
  };

  // Positioning options
  positioningOptions: {
    option: PositioningOption;
    description: string;
    requirements: string[];
    likelihood: 'high' | 'moderate' | 'low';
    tradeoffs: string[];
  }[];

  // Recommended positioning
  recommendedPositioning: {
    primaryAngle: string;
    supportingAngles: string[];
    narrative: string;
    schoolsWhereThisWorks: string[];
  };

  // Archetype fit
  archetypeFit: {
    bestFitArchetype: ApplicationArchetype;
    archetypeStrength: 'strong' | 'moderate' | 'weak';
    alternativeArchetypes: ApplicationArchetype[];
    archetypeGaps: string[];
  };
}

/**
 * Positioning options
 */
export type PositioningOption =
  | 'spike_specialist'        // Lead with spike
  | 'well_rounded_excellence' // Strong across the board
  | 'unique_perspective'      // Lead with unique background/view
  | 'impact_maker'            // Lead with community impact
  | 'intellectual_explorer'   // Lead with intellectual curiosity
  | 'future_leader'           // Lead with leadership potential
  | 'creative_innovator'      // Lead with creative/entrepreneurial
  | 'rising_trajectory';      // Lead with growth story

/**
 * Application archetype
 */
export type ApplicationArchetype =
  | 'the_researcher'
  | 'the_leader'
  | 'the_innovator'
  | 'the_artist'
  | 'the_athlete'
  | 'the_advocate'
  | 'the_polymath'
  | 'the_specialist'
  | 'the_builder'
  | 'the_connector'
  | 'the_overcomer'
  | 'the_mentor';

// ============================================================================
// IMPROVEMENT POTENTIAL
// ============================================================================

/**
 * Improvement potential analysis
 */
export interface ImprovementPotential {
  // Overall potential
  overallPotential: 'high' | 'moderate' | 'limited';
  currentTier: ProfileStrengthTier;
  achievableTier: ProfileStrengthTier;
  timeRequired: string;

  // By area
  areaImprovements: {
    area: string;
    currentScore: HarvardScoreDecimal;
    achievableScore: HarvardScoreDecimal;
    improvement: number;
    howToAchieve: string[];
    timeRequired: string;
    effort: 'high' | 'moderate' | 'low';
    priority: 'critical' | 'high' | 'medium' | 'low';
  }[];

  // Quick wins
  quickWins: {
    action: string;
    impact: string;
    effort: string;
    timeline: string;
  }[];

  // Long-term investments
  longTermInvestments: {
    investment: string;
    payoff: string;
    timeline: string;
    commitment: string;
  }[];

  // Constraints
  constraints: {
    constraint: string;
    impact: string;
    workaround?: string;
  }[];
}

// ============================================================================
// PROFILE TRAJECTORY
// ============================================================================

/**
 * Profile trajectory analysis
 */
export interface ProfileTrajectory {
  // Historical trajectory
  historicalTrajectory: {
    direction: 'accelerating' | 'steady_growth' | 'plateau' | 'declining';
    evidence: string[];
    narrative: string;
  };

  // Projected trajectory
  projectedTrajectory: {
    withCurrentPace: ProfileStrengthTier;
    withRecommendedChanges: ProfileStrengthTier;
    bestCase: ProfileStrengthTier;
    worstCase: ProfileStrengthTier;
  };

  // Key inflection points
  inflectionPoints: {
    point: string;
    timing: string;
    impact: string;
    action: string;
  }[];
}

// ============================================================================
// PROFILE CONSTANTS
// ============================================================================

/**
 * Profile tier to school range mapping
 */
export const PROFILE_TIER_SCHOOL_RANGES: Record<ProfileStrengthTier, {
  reachRange: string;
  targetRange: string;
  safetyRange: string;
  exampleReach: string[];
  exampleTarget: string[];
  exampleSafety: string[];
}> = {
  exceptional: {
    reachRange: 'T5 (still reach for everyone)',
    targetRange: 'T5-T10',
    safetyRange: 'T20-T30',
    exampleReach: ['Harvard', 'Stanford', 'MIT'],
    exampleTarget: ['Princeton', 'Yale', 'Columbia'],
    exampleSafety: ['Northwestern', 'Duke', 'Vanderbilt'],
  },
  highly_competitive: {
    reachRange: 'T5-T10',
    targetRange: 'T10-T20',
    safetyRange: 'T30-T50',
    exampleReach: ['Princeton', 'Stanford', 'MIT'],
    exampleTarget: ['Northwestern', 'Duke', 'Brown'],
    exampleSafety: ['NYU', 'Boston College', 'USC'],
  },
  competitive: {
    reachRange: 'T10-T20',
    targetRange: 'T30-T50',
    safetyRange: 'T50-T100',
    exampleReach: ['Cornell', 'Rice', 'Georgetown'],
    exampleTarget: ['Boston University', 'Northeastern', 'Wisconsin'],
    exampleSafety: ['State flagships', 'Solid regional schools'],
  },
  developing: {
    reachRange: 'T30-T50',
    targetRange: 'T50-T100',
    safetyRange: 'T100+',
    exampleReach: ['Boston University', 'Northeastern'],
    exampleTarget: ['State schools', 'Good regional universities'],
    exampleSafety: ['Less selective state schools', 'Regional colleges'],
  },
  building: {
    reachRange: 'T50-T100',
    targetRange: 'T100+',
    safetyRange: 'Open admission',
    exampleReach: ['Solid state schools'],
    exampleTarget: ['Regional universities'],
    exampleSafety: ['Community college pathway', 'Open admission schools'],
  },
  rebuilding: {
    reachRange: 'Varies based on circumstances',
    targetRange: 'Focus on fit and opportunity',
    safetyRange: 'Multiple backup options',
    exampleReach: ['Depends on specific situation'],
    exampleTarget: ['Schools that value growth'],
    exampleSafety: ['Gap year', 'Community college'],
  },
};

/**
 * Component weight in overall profile
 */
export const PROFILE_COMPONENT_WEIGHTS: Record<string, number> = {
  academic: 25,
  activities: 30,
  essays: 25,
  recommendations: 10,
  character: 10,
};
