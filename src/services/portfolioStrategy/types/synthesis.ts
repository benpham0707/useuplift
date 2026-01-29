/**
 * Holistic Profile Synthesis Types
 *
 * Comprehensive type definitions for combining all evaluation components
 * into a unified profile assessment. This is the heart of the PASS system -
 * where individual evaluations become a coherent application narrative.
 */

import { AcademicEvaluation, AcademicTier } from './academic';
import { ActivityPortfolioAnalysis, ActivityTier, SpikeStrength } from './activities';
import { AwardEvaluation } from './awards';

// ============================================================================
// CORE SYNTHESIS TYPES
// ============================================================================

/**
 * Overall profile strength tier
 */
export type ProfileTier =
  | 'exceptional'          // Top 1% - Competitive at any school
  | 'highly_competitive'   // Top 5% - Strong at T20
  | 'competitive'          // Top 15% - Competitive at T30
  | 'developing'           // Top 30% - Room for improvement
  | 'building';            // Below top 30% - Significant work needed

/**
 * Application archetype - the "brand" of the applicant
 */
export type ApplicationArchetype =
  | 'the_innovator'              // Creates new things, entrepreneurial spirit
  | 'the_researcher'             // Deep intellectual pursuit, academic focus
  | 'the_leader'                 // Natural leader, organizational impact
  | 'the_artist'                 // Creative expression, artistic excellence
  | 'the_athlete'                // Athletic achievement, competitive drive
  | 'the_advocate'               // Social impact, community change
  | 'the_polymath'               // Excellence across multiple domains
  | 'the_specialist'             // Deep expertise in narrow area
  | 'the_builder'                // Hands-on creation, engineering mindset
  | 'the_connector'              // Brings people together, community builder
  | 'the_overcomer'              // Triumph over adversity
  | 'the_mentor'                 // Teaching, helping others grow
  | 'undefined';                 // No clear archetype yet

/**
 * Component weight (how much each area matters for this student)
 */
export interface ComponentWeight {
  weight: number;      // 0-100, should sum to 100 across all components
  strength: number;    // 0-100, how strong they are in this area
  contribution: number; // weight * strength / 100, contribution to overall score
  importance: string;  // Why this weight for this student
}

// ============================================================================
// PERSONAL CONTEXT TYPES
// ============================================================================

/**
 * Personal context that affects evaluation
 */
export interface PersonalContext {
  // Demographics
  isFirstGeneration: boolean;
  isLowIncome: boolean;
  isUnderrepresentedMinority: boolean;
  isInternational: boolean;
  isRuralStudent: boolean;

  // Circumstances
  hasSignificantAdversity: boolean;
  adversityNarrative?: string;
  familyResponsibilities?: {
    type: string;
    hoursPerWeek: number;
    impact: string;
  };

  // Educational context
  schoolResources: 'well_resourced' | 'moderate' | 'under_resourced';
  accessToOpportunities: 'full' | 'limited' | 'severely_limited';
  geographicContext: string;

  // Context boost calculation
  contextBoost: {
    applicable: boolean;
    boostAmount: number; // 0-15 points potential
    justification: string;
  };
}

/**
 * Goals and aspirations input
 */
export interface GoalsAspirations {
  intendedMajor: string;
  alternativeMajors?: string[];
  careerInterests: string[];
  collegePreferences: {
    size: 'small' | 'medium' | 'large' | 'any';
    location: 'urban' | 'suburban' | 'rural' | 'any';
    region: string[];
    publicPrivate: 'public' | 'private' | 'any';
  };
  financialAidNeed: 'high' | 'moderate' | 'low' | 'none';
  targetSchools?: string[];
}

// ============================================================================
// UNIQUE VALUE PROPOSITION TYPES
// ============================================================================

/**
 * What makes this student unique
 */
export interface UniqueValueProposition {
  // Primary differentiator
  primaryDifferentiator: {
    what: string;
    evidence: string[];
    rarity: 'very_rare' | 'rare' | 'uncommon' | 'common';
    strength: number; // 0-100
  };

  // Supporting elements
  supportingElements: {
    element: string;
    evidence: string;
    howItSupports: string;
  }[];

  // Competitive advantages
  competitiveAdvantages: {
    advantage: string;
    context: string; // When/where this is an advantage
    schools: string[]; // Schools that would value this
  }[];

  // Vulnerabilities to address
  vulnerabilities: {
    vulnerability: string;
    severity: 'critical' | 'moderate' | 'minor';
    mitigation: string;
  }[];

  // Unique combination
  uniqueCombination: {
    elements: string[];
    narrative: string;
    rarity: string;
  };
}

/**
 * Application brand/archetype analysis
 */
export interface ApplicationBrand {
  // Primary archetype
  primaryArchetype: ApplicationArchetype;
  archetypeConfidence: number; // 0-100
  archetypeJustification: string;

  // Secondary archetype (if applicable)
  secondaryArchetype?: ApplicationArchetype;

  // Core narrative
  coreNarrative: {
    oneLineSummary: string;
    elevatorPitch: string; // 30-second version
    fullNarrative: string; // Paragraph version
  };

  // Key themes
  keyThemes: {
    theme: string;
    evidence: string[];
    strength: number;
  }[];

  // Proof points
  proofPoints: {
    claim: string;
    evidence: string;
    source: 'academic' | 'activity' | 'award' | 'essay' | 'context';
  }[];

  // Brand consistency
  brandConsistency: {
    score: number; // 0-100
    alignedElements: string[];
    misalignedElements: string[];
    recommendations: string[];
  };
}

// ============================================================================
// COHERENCE ANALYSIS TYPES
// ============================================================================

/**
 * Cross-component coherence analysis
 */
export interface CoherenceAnalysis {
  overallCoherenceScore: number; // 0-100

  // Where components reinforce each other
  alignments: {
    components: string[]; // e.g., ['academic', 'activities']
    alignment: string;
    strength: 'strong' | 'moderate' | 'weak';
    narrativeValue: string;
  }[];

  // Where components seem disconnected
  disconnects: {
    components: string[];
    disconnect: string;
    severity: 'concerning' | 'notable' | 'minor';
    resolution: string;
  }[];

  // Narrative thread analysis
  narrativeThread: {
    exists: boolean;
    thread: string;
    supportingEvidence: string[];
    gaps: string[];
  };

  // Consistency checks
  consistencyChecks: {
    check: string;
    result: 'consistent' | 'inconsistent' | 'partially_consistent';
    details: string;
  }[];

  // Recommendations for improving coherence
  coherenceRecommendations: string[];
}

// ============================================================================
// ESSAY QUALITY INPUT TYPES
// ============================================================================

/**
 * Essay quality summary (from existing PIQ/Common App analysis)
 */
export interface EssayQualitySummary {
  hasEssayAnalysis: boolean;

  // Overall essay strength
  overallEssayScore?: number;
  overallEssayTier?: 'exceptional' | 'strong' | 'average' | 'weak';

  // Individual essay scores
  essays?: {
    essayId: string;
    essayType: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }[];

  // Voice and authenticity
  voiceStrength?: number;
  authenticityScore?: number;

  // Key insights
  essayInsights?: {
    bestEssay: string;
    biggestConcern: string;
    overallNarrative: string;
  };
}

// ============================================================================
// COMPLETE HOLISTIC SYNTHESIS OUTPUT
// ============================================================================

/**
 * Complete Holistic Profile Synthesis
 */
export interface HolisticProfileSynthesis {
  // Timestamp and version
  synthesizedAt: string;
  version: string;

  // Overall profile strength
  profileStrength: {
    overallScore: number; // 0-100
    tier: ProfileTier;
    tierJustification: string;
    narrative: string; // 2-3 paragraph summary
  };

  // Component weights and contributions
  componentWeights: {
    academic: ComponentWeight;
    activities: ComponentWeight;
    awards: ComponentWeight;
    essays: ComponentWeight;
    context: ComponentWeight;
  };

  // Score breakdown
  scoreBreakdown: {
    baseScore: number;
    academicContribution: number;
    activitiesContribution: number;
    awardsContribution: number;
    essaysContribution: number;
    contextBoost: number;
    coherenceBonus: number;
    finalScore: number;
    scoreExplanation: string;
  };

  // Personal context
  personalContext: PersonalContext;

  // Unique value proposition
  uniqueValue: UniqueValueProposition;

  // Application brand
  applicationBrand: ApplicationBrand;

  // Cross-component coherence
  coherenceAnalysis: CoherenceAnalysis;

  // Synthesized strengths and concerns
  strengthsAndConcerns: {
    majorStrengths: {
      strength: string;
      evidence: string[];
      impactOnAdmissions: string;
    }[];
    minorStrengths: string[];
    majorConcerns: {
      concern: string;
      severity: 'critical' | 'significant' | 'moderate';
      mitigation: string;
    }[];
    minorConcerns: string[];
  };

  // Competitive positioning
  competitivePositioning: {
    strongestAreas: string[];
    weakestAreas: string[];
    differentiators: string[];
    riskFactors: string[];
    overallAssessment: string;
  };

  // Application strategy insights
  strategyInsights: {
    playToStrengths: string[];
    addressWeaknesses: string[];
    narrativeFocus: string;
    schoolTypeRecommendations: string;
  };

  // Raw component evaluations (for reference)
  componentEvaluations: {
    academic: AcademicEvaluation;
    activities: ActivityPortfolioAnalysis;
    awards: AwardEvaluation;
    essays: EssayQualitySummary;
  };

  // Metadata
  inputDataHash: string;
  confidenceScore: number;
}

// ============================================================================
// SYNTHESIS CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for synthesis weighting
 */
export interface SynthesisWeightingConfig {
  // Base weights (can be adjusted based on profile)
  baseWeights: {
    academic: number;
    activities: number;
    awards: number;
    essays: number;
    context: number;
  };

  // Adjustment rules
  adjustmentRules: {
    condition: string;
    adjustments: Partial<Record<keyof SynthesisWeightingConfig['baseWeights'], number>>;
  }[];

  // Minimum/maximum bounds
  bounds: {
    component: keyof SynthesisWeightingConfig['baseWeights'];
    min: number;
    max: number;
  }[];
}

/**
 * Archetype detection configuration
 */
export interface ArchetypeDetectionConfig {
  archetypes: {
    archetype: ApplicationArchetype;
    indicators: {
      source: 'academic' | 'activities' | 'awards' | 'essays';
      indicator: string;
      weight: number;
    }[];
    minimumScore: number;
  }[];
}
