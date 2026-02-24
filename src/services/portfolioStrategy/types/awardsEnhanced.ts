// @ts-nocheck
/**
 * Enhanced Award Types - Research-Backed Award Analysis System
 *
 * This module extends the base award types with:
 * - Sara Harberson 4-tier classification system
 * - Authenticity detection framework
 * - Context modifiers (geographic, demographic, timing)
 * - School-specific valuation
 * - Research citation integration
 *
 * Based on Section 2 research: /docs/research/section2-awards/
 *
 * @module awardsEnhanced
 */

import {
  AwardCategory,
  AwardRecognitionLevel,
  AwardSelectivity,
  CommonAppHonorLevel,
  AwardAssessment,
  KnownAwardProfile,
} from './awards';

// ============================================================================
// SARA HARBERSON 4-TIER CLASSIFICATION SYSTEM
// ============================================================================

/**
 * Award tier based on Sara Harberson's framework
 *
 * Tier 1: <2% acceptance rate OR <500 recipients nationally (Exceptional)
 * Tier 2: 1-5% acceptance rate OR 500-5,000 recipients (Outstanding)
 * Tier 3: 5-15% acceptance rate (Strong)
 * Tier 4: 15-50% or merit-threshold only (Baseline)
 */
export type AwardTier = 1 | 2 | 3 | 4;

/**
 * Tier point values for scoring
 */
export const TIER_POINTS: Record<AwardTier, number> = {
  1: 4, // Exceptional
  2: 3, // Outstanding
  3: 2, // Strong
  4: 1, // Baseline
};

/**
 * Tier classification rules with quantitative thresholds
 */
export interface TierClassificationRules {
  tier: AwardTier;
  label: 'exceptional' | 'outstanding' | 'strong' | 'baseline';
  selectivityThreshold: { min: number; max: number }; // Percentage
  recipientThreshold: { max: number }; // Annual recipients nationally
  points: number;
  admissionsImpact: 'major' | 'moderate' | 'minor';
}

export const TIER_CLASSIFICATION_RULES: TierClassificationRules[] = [
  {
    tier: 1,
    label: 'exceptional',
    selectivityThreshold: { min: 0, max: 2 },
    recipientThreshold: { max: 500 },
    points: 4,
    admissionsImpact: 'major',
  },
  {
    tier: 2,
    label: 'outstanding',
    selectivityThreshold: { min: 1, max: 5 },
    recipientThreshold: { max: 5000 },
    points: 3,
    admissionsImpact: 'moderate',
  },
  {
    tier: 3,
    label: 'strong',
    selectivityThreshold: { min: 5, max: 15 },
    recipientThreshold: { max: 20000 },
    points: 2,
    admissionsImpact: 'minor',
  },
  {
    tier: 4,
    label: 'baseline',
    selectivityThreshold: { min: 15, max: 100 },
    recipientThreshold: { max: Infinity },
    points: 1,
    admissionsImpact: 'minor',
  },
];

// ============================================================================
// CONTEXT MODIFIERS
// ============================================================================

/**
 * Geographic context modifier
 * Awards from competitive states carry more weight
 */
export interface GeographicModifier {
  state: string;
  competitiveness: 'highly_competitive' | 'competitive' | 'moderate' | 'limited';
  modifier: number; // -0.5 to +0.5 tier adjustment
  explanation: string;
}

/**
 * Competitive states for context calibration
 */
export const COMPETITIVE_STATES: Record<string, GeographicModifier> = {
  CA: { state: 'California', competitiveness: 'highly_competitive', modifier: 0.5, explanation: 'Largest talent pool, most competitive state programs' },
  NY: { state: 'New York', competitiveness: 'highly_competitive', modifier: 0.5, explanation: 'Large talent pool, strong competition' },
  TX: { state: 'Texas', competitiveness: 'highly_competitive', modifier: 0.5, explanation: 'Large population, competitive programs' },
  MA: { state: 'Massachusetts', competitiveness: 'highly_competitive', modifier: 0.5, explanation: 'Academic culture, elite competition' },
  NJ: { state: 'New Jersey', competitiveness: 'competitive', modifier: 0.25, explanation: 'Strong academic programs' },
  VA: { state: 'Virginia', competitiveness: 'competitive', modifier: 0.25, explanation: 'TJ and strong STEM programs' },
  IL: { state: 'Illinois', competitiveness: 'competitive', modifier: 0.25, explanation: 'Chicago area talent pool' },
  PA: { state: 'Pennsylvania', competitiveness: 'competitive', modifier: 0.25, explanation: 'Major metros, solid competition' },
  // Default for unlisted states
  DEFAULT: { state: 'Other', competitiveness: 'moderate', modifier: 0, explanation: 'Standard competition level' },
};

/**
 * Demographic context modifier
 */
export interface DemographicModifier {
  factor: 'first_gen' | 'low_income' | 'rural' | 'underrepresented' | 'resource_limited';
  modifier: number; // Positive adjustment for overcoming barriers
  explanation: string;
}

/**
 * Timing context modifier
 * Natural progression vs suspicious clustering
 */
export interface TimingModifier {
  pattern: 'natural_progression' | 'early_achiever' | 'late_bloomer' | 'compressed' | 'suspicious';
  modifier: number;
  explanation: string;
}

/**
 * Combined context assessment
 */
export interface AwardContextAssessment {
  geographic: GeographicModifier | null;
  demographic: DemographicModifier[];
  timing: TimingModifier;
  baseTier: AwardTier;
  adjustedTier: number; // Can be fractional (e.g., 1.5)
  effectiveTier: AwardTier; // Rounded to 1-4
  contextNarrative: string;
}

// ============================================================================
// AUTHENTICITY DETECTION FRAMEWORK
// ============================================================================

/**
 * Red flag severity levels
 */
export type RedFlagSeverity = 'severe' | 'moderate' | 'minor';

/**
 * Red flag indicator
 */
export interface RedFlagIndicator {
  type: string;
  severity: RedFlagSeverity;
  description: string;
  evidence: string[];
  actionRequired: 'reject' | 'investigate' | 'note';
}

/**
 * Pay-to-play detection
 */
export interface PayToPlayDetection {
  indicators: {
    requiresPayment: boolean;
    noSelectiveProcess: boolean;
    recentlyFounded: boolean;
    noVerifiableWinners: boolean;
    marketingFocused: boolean;
  };
  knownPayToPlay: boolean;
  organizationName?: string;
  likelihood: 'confirmed' | 'likely' | 'possible' | 'unlikely';
  explanation: string;
}

/**
 * Known pay-to-play organizations
 */
export const KNOWN_PAY_TO_PLAY: string[] = [
  'national society of high school scholars',
  'nshss',
  'who\'s who among american high school students',
  'who\'s who',
  'national honor roll',
  'united states achievement academy',
  'national youth leadership forum',
  'nylf',
  'envision',
  'global young leaders conference',
  'national society of leadership and success',
  'nsls',
  'international scholar laureate program',
  'islp',
  'alpha lambda delta', // While legitimate, often confused with pay-to-play
  'national youth leadership council',
  'people to people ambassador programs',
];

/**
 * Award inflation detection
 */
export interface AwardInflationCheck {
  inflationIndicators: {
    titleMismatch: boolean; // Title sounds grander than reality
    levelOverclaim: boolean; // Claims national when regional
    scopeExaggeration: boolean; // "International" for local org
    roleInflation: boolean; // "Winner" vs "participant"
  };
  inflationSeverity: 'none' | 'minor' | 'moderate' | 'major' | 'fabrication';
  suggestedCorrection?: string;
  explanation: string;
}

/**
 * Timing red flag assessment
 */
export interface TimingRedFlagAssessment {
  patterns: {
    seniorYearExplosion: boolean; // 5+ awards suddenly in senior year
    noEarlyAchievements: boolean; // Nothing before junior year
    suspiciousCompression: boolean; // Many awards in short timeframe
    naturalProgression: boolean; // Shows growth over time
  };
  trajectory: 'natural' | 'compressed' | 'suspicious' | 'red_flag';
  explanation: string;
  yearsActive: number[];
  awardsPerYear: Record<number, number>;
}

/**
 * Cross-validation with other application components
 */
export interface CrossValidation {
  activityAlignment: {
    aligned: boolean;
    relatedActivities: string[];
    gaps: string[];
  };
  essayMentioned: boolean;
  recommenderAware: boolean;
  schoolProfileSupports: boolean;
  overallConsistency: 'high' | 'medium' | 'low' | 'concerning';
}

/**
 * Complete authenticity assessment
 */
export interface AwardAuthenticityAssessment {
  awardId: string;
  awardName: string;

  // Verification status
  verificationStatus: {
    isKnownAward: boolean;
    hasVerifiableResults: boolean;
    organizationVerified: boolean;
    selectionProcessClear: boolean;
  };

  // Red flags
  redFlags: RedFlagIndicator[];
  totalRedFlagScore: number; // 0-100, higher = more concerning

  // Specific checks
  payToPlayCheck: PayToPlayDetection;
  inflationCheck: AwardInflationCheck;
  timingCheck: TimingRedFlagAssessment;
  crossValidation: CrossValidation;

  // Overall assessment
  authenticityScore: number; // 0-100, higher = more authentic
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'severe';
  recommendation: 'include' | 'include_with_caution' | 'investigate' | 'exclude';
  explanation: string;
}

// ============================================================================
// SCHOOL-SPECIFIC VALUATION
// ============================================================================

/**
 * School award preferences
 */
export interface SchoolAwardPreference {
  schoolId: string;
  schoolName: string;

  // Category preferences (1-5 scale, 5 = highest value)
  categoryPreferences: Record<AwardCategory, number>;

  // Specific awards this school particularly values
  highValueAwards: string[];

  // What this school looks for in awards
  valueStatement: string;

  // Context for evaluation
  context: {
    emphasisArea: 'stem' | 'humanities' | 'arts' | 'balanced' | 'research';
    looksBeyondTier: boolean; // Some schools care more about story than prestige
    valuesUniqueness: boolean;
  };
}

/**
 * Pre-defined school preferences based on research
 */
export const SCHOOL_AWARD_PREFERENCES: SchoolAwardPreference[] = [
  {
    schoolId: 'mit',
    schoolName: 'Massachusetts Institute of Technology',
    categoryPreferences: {
      academic_olympiad: 5,
      stem_competition: 5,
      research_recognition: 5,
      science_fair: 5,
      entrepreneurship: 4,
      academic_competition: 4,
      standardized_test: 3,
      academic_honor: 2,
      arts_competition: 2,
      athletic: 2,
      leadership: 3,
      community_service: 3,
      debate_speech: 3,
      journalism_writing: 2,
      scholarship: 2,
      summer_program_selection: 4,
      other: 2,
    },
    highValueAwards: ['usamo_qualifier', 'usaco_gold', 'usaco_platinum', 'isef_finalist', 'regeneron_sts', 'rsi_attendee'],
    valueStatement: 'MIT values demonstrated technical ability and maker mentality. STEM olympiads and research carry exceptional weight.',
    context: { emphasisArea: 'stem', looksBeyondTier: false, valuesUniqueness: true },
  },
  {
    schoolId: 'stanford',
    schoolName: 'Stanford University',
    categoryPreferences: {
      academic_olympiad: 4,
      stem_competition: 4,
      research_recognition: 5,
      science_fair: 4,
      entrepreneurship: 5,
      academic_competition: 4,
      standardized_test: 3,
      academic_honor: 2,
      arts_competition: 4,
      athletic: 4,
      leadership: 5,
      community_service: 4,
      debate_speech: 4,
      journalism_writing: 4,
      scholarship: 3,
      summer_program_selection: 4,
      other: 3,
    },
    highValueAwards: ['regeneron_sts', 'thiel_fellowship', 'youngarts_winner', 'tasp_attendee'],
    valueStatement: 'Stanford emphasizes intellectual vitality and self-directed impact. Values innovation and entrepreneurial spirit.',
    context: { emphasisArea: 'balanced', looksBeyondTier: true, valuesUniqueness: true },
  },
  {
    schoolId: 'harvard',
    schoolName: 'Harvard University',
    categoryPreferences: {
      academic_olympiad: 4,
      stem_competition: 4,
      research_recognition: 4,
      science_fair: 4,
      entrepreneurship: 4,
      academic_competition: 4,
      standardized_test: 3,
      academic_honor: 3,
      arts_competition: 4,
      athletic: 4,
      leadership: 5,
      community_service: 5,
      debate_speech: 5,
      journalism_writing: 4,
      scholarship: 3,
      summer_program_selection: 4,
      other: 3,
    },
    highValueAwards: ['toc_champion', 'toc_finalist', 'presidential_scholar', 'national_merit_finalist'],
    valueStatement: 'Harvard values well-rounded excellence with emphasis on leadership and personal impact. Strong personal rating crucial.',
    context: { emphasisArea: 'balanced', looksBeyondTier: true, valuesUniqueness: true },
  },
  {
    schoolId: 'yale',
    schoolName: 'Yale University',
    categoryPreferences: {
      academic_olympiad: 4,
      stem_competition: 3,
      research_recognition: 4,
      science_fair: 3,
      entrepreneurship: 3,
      academic_competition: 4,
      standardized_test: 3,
      academic_honor: 3,
      arts_competition: 5,
      athletic: 4,
      leadership: 4,
      community_service: 4,
      debate_speech: 5,
      journalism_writing: 5,
      scholarship: 3,
      summer_program_selection: 4,
      other: 3,
    },
    highValueAwards: ['scholastic_gold_medal', 'youngarts_winner', 'toc_champion', 'pulitzer_center'],
    valueStatement: 'Yale has strong arts culture and values humanities excellence. Writing, debate, and artistic achievements weighted heavily.',
    context: { emphasisArea: 'humanities', looksBeyondTier: true, valuesUniqueness: true },
  },
  {
    schoolId: 'caltech',
    schoolName: 'California Institute of Technology',
    categoryPreferences: {
      academic_olympiad: 5,
      stem_competition: 5,
      research_recognition: 5,
      science_fair: 5,
      entrepreneurship: 3,
      academic_competition: 4,
      standardized_test: 4,
      academic_honor: 2,
      arts_competition: 1,
      athletic: 1,
      leadership: 2,
      community_service: 2,
      debate_speech: 2,
      journalism_writing: 1,
      scholarship: 2,
      summer_program_selection: 4,
      other: 1,
    },
    highValueAwards: ['usamo_qualifier', 'usapho_qualifier', 'isef_grand', 'regeneron_sts_finalist'],
    valueStatement: 'Caltech focuses almost exclusively on STEM credentials. Research and olympiad performance are paramount.',
    context: { emphasisArea: 'stem', looksBeyondTier: false, valuesUniqueness: false },
  },
];

// ============================================================================
// RESEARCH CITATION INTEGRATION
// ============================================================================

/**
 * Research source citation
 */
export interface ResearchCitation {
  sourceId: string;
  module: string; // e.g., '2.1_TIER_CLASSIFICATION_SYSTEM'
  section: string;
  quote?: string;
  relevance: 'primary' | 'supporting';
}

/**
 * Research-backed insight
 */
export interface ResearchBackedInsight {
  insight: string;
  confidence: 'high' | 'medium' | 'low';
  citations: ResearchCitation[];
  applicability: string[];
}

// ============================================================================
// ENHANCED AWARD PROFILE (EXTENDS BASE)
// ============================================================================

/**
 * Enhanced known award profile with tier system and research backing
 */
export interface EnhancedKnownAwardProfile extends KnownAwardProfile {
  // Tier classification
  tier: AwardTier;
  tierJustification: string;

  // Enhanced selectivity data
  selectivityData: {
    acceptanceRate: number; // Percentage
    annualApplicants: number;
    annualRecipients: number;
    selectionProcess: string;
    verificationUrl?: string;
  };

  // Authenticity indicators
  authenticity: {
    verificationDifficulty: 'easy' | 'moderate' | 'difficult';
    publicResults: boolean;
    organizationReputation: 'excellent' | 'good' | 'unknown' | 'questionable';
  };

  // School-specific value
  schoolSpecificValue: Record<string, number>; // schoolId -> value multiplier

  // Research backing
  researchCitations: ResearchCitation[];
}

// ============================================================================
// ENHANCED AWARD ASSESSMENT OUTPUT
// ============================================================================

/**
 * Enhanced individual award assessment
 */
export interface EnhancedAwardAssessment extends AwardAssessment {
  // Tier classification
  tier: AwardTier;
  tierLabel: 'exceptional' | 'outstanding' | 'strong' | 'baseline';
  tierPoints: number;

  // Context-adjusted tier
  contextAssessment: AwardContextAssessment;

  // Authenticity assessment
  authenticityAssessment: AwardAuthenticityAssessment;

  // School-specific scores
  schoolSpecificScores: Record<string, {
    score: number;
    explanation: string;
  }>;

  // Research backing
  researchInsights: ResearchBackedInsight[];
}

// ============================================================================
// PORTFOLIO-LEVEL ANALYSIS
// ============================================================================

/**
 * Award portfolio pattern detection
 */
export interface AwardPortfolioPatterns {
  // Clustering analysis
  thematicCoherence: {
    score: number; // 0-100
    primaryTheme: string;
    supportingThemes: string[];
    disconnectedAwards: string[];
    explanation: string;
  };

  // Padding detection
  paddingIndicators: {
    lowTierOverload: boolean; // Many tier 4 awards
    quantityOverQuality: boolean;
    lacksDepth: boolean;
    suspiciousPattern: boolean;
  };
  paddingRisk: 'none' | 'low' | 'medium' | 'high';

  // Trajectory analysis
  trajectory: {
    pattern: 'ascending' | 'consistent' | 'descending' | 'erratic' | 'late_burst';
    naturalProgression: boolean;
    keyMilestones: { year: number; award: string; significance: string }[];
  };

  // Spike alignment
  spikeAlignment: {
    aligned: boolean;
    spikeArea: string;
    supportingAwards: string[];
    contradictingAwards: string[];
  };
}

/**
 * Complete enhanced award evaluation
 */
export interface EnhancedAwardEvaluation {
  // Metadata
  evaluatedAt: string;
  version: string;
  analysisPhase: 'tier_classification' | 'authenticity' | 'context' | 'synthesis';

  // Overall scores
  overallScore: number; // 0-100
  overallTierScore: number; // Sum of tier points
  overallStrength: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
  authenticityScore: number; // 0-100, portfolio-level

  // Tier distribution
  tierDistribution: {
    tier1: EnhancedAwardAssessment[];
    tier2: EnhancedAwardAssessment[];
    tier3: EnhancedAwardAssessment[];
    tier4: EnhancedAwardAssessment[];
    summary: {
      tier1Count: number;
      tier2Count: number;
      tier3Count: number;
      tier4Count: number;
      totalPoints: number;
      averageTier: number;
    };
  };

  // Individual assessments
  awardAssessments: Record<string, EnhancedAwardAssessment>;

  // Portfolio patterns
  portfolioPatterns: AwardPortfolioPatterns;

  // Authenticity summary
  authenticitySummary: {
    overallRisk: 'none' | 'low' | 'medium' | 'high' | 'severe';
    flaggedAwards: string[];
    recommendations: string[];
  };

  // School-specific evaluation
  schoolSpecificEvaluation: Record<string, {
    schoolId: string;
    overallScore: number;
    strength: 'exceptional' | 'strong' | 'competitive' | 'below_average';
    topAwards: string[];
    explanation: string;
  }>;

  // Research-backed narrative
  narrative: {
    headline: string;
    strengthsWithCitations: { strength: string; citation: ResearchCitation }[];
    concernsWithCitations: { concern: string; citation: ResearchCitation }[];
    strategicPositioning: string;
    admissionsOfficerPerspective: string;
  };

  // Actionable recommendations
  recommendations: {
    commonAppStrategy: {
      top5: string[];
      alternates: string[];
      ordering: string;
      levelDistribution: Record<CommonAppHonorLevel, number>;
    };
    improvements: {
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
      rationale: string;
      researchBacking: ResearchCitation[];
    }[];
    schoolSpecific: Record<string, string[]>;
  };

  // Confidence and metadata
  confidenceScore: number;
  inputDataHash: string;
  researchModulesUsed: string[];
}

// ============================================================================
// INPUT TYPES FOR ENHANCED ANALYSIS
// ============================================================================

/**
 * Enhanced award input with context data
 */
export interface EnhancedAwardInput {
  // Base award data
  id: string;
  name: string;
  category: AwardCategory;
  recognitionLevel: AwardRecognitionLevel;
  dateReceived: string;
  gradeLevel: number;
  description?: string;
  organization?: string;
  selectivityInfo?: string;
  isAcademic: boolean;
  relatedActivity?: string;
  verifiable: boolean;

  // Enhanced context
  state?: string; // For geographic context
  specificPlacement?: string; // e.g., "2nd place", "Top 10%"
  competitionSize?: number; // Number of participants
  websiteUrl?: string; // For verification
}

/**
 * Complete enhanced awards input
 */
export interface EnhancedAwardsInput {
  awards: EnhancedAwardInput[];

  // Student context for calibration
  studentContext: {
    state: string;
    schoolType: 'public' | 'private' | 'magnet' | 'charter' | 'homeschool';
    isFirstGen: boolean;
    isLowIncome: boolean;
    isRural: boolean;
    intendedMajor?: string;
    spikeArea?: string;
  };

  // Target schools for school-specific evaluation
  targetSchools?: string[];

  // Related activities for cross-validation
  relatedActivities?: {
    activityId: string;
    activityName: string;
    category: string;
  }[];
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  AwardTier,
  TierClassificationRules,
  GeographicModifier,
  DemographicModifier,
  TimingModifier,
  AwardContextAssessment,
  RedFlagSeverity,
  RedFlagIndicator,
  PayToPlayDetection,
  AwardInflationCheck,
  TimingRedFlagAssessment,
  CrossValidation,
  AwardAuthenticityAssessment,
  SchoolAwardPreference,
  ResearchCitation,
  ResearchBackedInsight,
  EnhancedKnownAwardProfile,
  EnhancedAwardAssessment,
  AwardPortfolioPatterns,
  EnhancedAwardEvaluation,
  EnhancedAwardInput,
  EnhancedAwardsInput,
};
