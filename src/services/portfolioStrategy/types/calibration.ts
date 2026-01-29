/**
 * Context Calibration Types
 *
 * Comprehensive type definitions for the Context Calibration stage that
 * adjusts scores based on student circumstances. This implements holistic
 * review principles where context matters for fair evaluation.
 *
 * Research Foundation:
 * - Elite colleges explicitly consider context in admissions
 * - "Context of achievement" is a core holistic review principle
 * - Students from disadvantaged backgrounds may have fewer opportunities
 *   but can still demonstrate exceptional potential
 *
 * Calibration Categories:
 * 1. Socioeconomic Context - first-gen, income, resources
 * 2. Geographic Context - rural, under-resourced areas
 * 3. Personal Circumstances - adversity, family responsibilities
 * 4. Educational Context - school resources, opportunity access
 * 5. Identity Context - URM status, immigrant background
 */

import { HarvardScoreDecimal, ContextAdjustmentFactor } from './scoring';

// ============================================================================
// CONTEXT CATEGORIES
// ============================================================================

/**
 * Context category types
 */
export type ContextCategory =
  | 'socioeconomic'
  | 'geographic'
  | 'personal'
  | 'educational'
  | 'identity';

/**
 * Individual context factor
 */
export interface ContextFactor {
  factor: ContextAdjustmentFactor;
  category: ContextCategory;
  present: boolean;
  severity: 'significant' | 'moderate' | 'mild' | 'none';
  verified: boolean;
  verificationSource?: string;
  description?: string;
}

// ============================================================================
// SOCIOECONOMIC CONTEXT
// ============================================================================

/**
 * Socioeconomic context assessment
 */
export interface SocioeconomicContext {
  // First-generation status
  firstGeneration: {
    isFirstGen: boolean;
    definition: 'neither_parent_4year' | 'neither_parent_any_college' | 'unknown';
    verified: boolean;
    impact: string;
  };

  // Income level
  incomeLevel: {
    level: 'low' | 'moderate' | 'comfortable' | 'affluent' | 'unknown';
    qualifiesForFeeWaiver: boolean;
    qualifiesForPellGrant: boolean;
    financialHardship: boolean;
    impact: string;
  };

  // Resource access
  resourceAccess: {
    hasPrivateCounselor: boolean;
    hasTutoring: boolean;
    hasTestPrep: boolean;
    hasExtracurricularFunding: boolean;
    resourceLevel: 'abundant' | 'adequate' | 'limited' | 'severely_limited';
    impact: string;
  };

  // Work necessity
  workNecessity: {
    mustWork: boolean;
    hoursPerWeek: number;
    contributesToFamily: boolean;
    impact: string;
  };

  // Overall socioeconomic adjustment
  adjustment: {
    applicable: boolean;
    amount: number;
    justification: string;
  };
}

// ============================================================================
// GEOGRAPHIC CONTEXT
// ============================================================================

/**
 * Geographic context assessment
 */
export interface GeographicContext {
  // Location type
  locationType: {
    type: 'urban' | 'suburban' | 'rural' | 'remote';
    specificChallenges: string[];
  };

  // Regional opportunities
  regionalOpportunities: {
    level: 'abundant' | 'adequate' | 'limited' | 'severely_limited';
    nearestMajorCity: string;
    distanceMiles: number;
    accessToCompetitions: boolean;
    accessToInternships: boolean;
    accessToMentors: boolean;
    impact: string;
  };

  // State/region factors
  stateFactors: {
    state: string;
    isUnderrepresentedState: boolean;
    competitiveContext: string;
  };

  // International factors (if applicable)
  internationalFactors?: {
    country: string;
    educationalSystemChallenges: string[];
    accessToUSOpportunities: boolean;
    languageBarriers: boolean;
    visaChallenges: boolean;
    impact: string;
  };

  // Overall geographic adjustment
  adjustment: {
    applicable: boolean;
    amount: number;
    justification: string;
  };
}

// ============================================================================
// PERSONAL CIRCUMSTANCES
// ============================================================================

/**
 * Personal circumstances assessment
 */
export interface PersonalCircumstances {
  // Significant adversity
  adversity: {
    present: boolean;
    types: AdversityType[];
    severity: 'life_altering' | 'significant' | 'moderate' | 'mild' | 'none';
    duration: 'ongoing' | 'resolved' | 'improving';
    responseQuality: 'exceptional' | 'strong' | 'adequate' | 'struggling';
    narrativePotential: string;
  };

  // Family responsibilities
  familyResponsibilities: {
    present: boolean;
    types: FamilyResponsibilityType[];
    hoursPerWeek: number;
    impact: string;
    demonstration: string;
  };

  // Health challenges
  healthChallenges: {
    present: boolean;
    type: 'physical' | 'mental' | 'chronic' | 'learning_difference' | 'none';
    impactOnAchievements: string;
    accommodationsUsed: boolean;
  };

  // Life disruptions
  lifeDisruptions: {
    present: boolean;
    types: LifeDisruptionType[];
    timing: string;
    recovery: string;
  };

  // Overall personal circumstances adjustment
  adjustment: {
    applicable: boolean;
    amount: number;
    justification: string;
  };
}

/**
 * Types of adversity
 */
export type AdversityType =
  | 'family_illness'
  | 'personal_illness'
  | 'loss_of_family_member'
  | 'domestic_instability'
  | 'housing_insecurity'
  | 'food_insecurity'
  | 'immigration_challenges'
  | 'discrimination'
  | 'natural_disaster'
  | 'violence_exposure'
  | 'parent_incarceration'
  | 'foster_care'
  | 'other';

/**
 * Types of family responsibilities
 */
export type FamilyResponsibilityType =
  | 'sibling_care'
  | 'parent_care'
  | 'grandparent_care'
  | 'translation_interpretation'
  | 'family_business'
  | 'household_management'
  | 'financial_contribution'
  | 'other';

/**
 * Types of life disruptions
 */
export type LifeDisruptionType =
  | 'relocation'
  | 'school_change'
  | 'family_separation'
  | 'pandemic_impact'
  | 'financial_crisis'
  | 'legal_issues'
  | 'other';

// ============================================================================
// EDUCATIONAL CONTEXT
// ============================================================================

/**
 * Educational context assessment
 */
export interface EducationalContext {
  // School resources
  schoolResources: {
    level: 'well_resourced' | 'adequate' | 'under_resourced' | 'severely_under_resourced';
    apCoursesAvailable: number;
    counselorRatio: number;
    collegeGoingRate: number;
    averageSAT?: number;
    impact: string;
  };

  // Opportunity access
  opportunityAccess: {
    researchOpportunities: boolean;
    internshipAccess: boolean;
    competitionAccess: boolean;
    summerProgramAccess: boolean;
    mentorAccess: boolean;
    level: 'abundant' | 'adequate' | 'limited' | 'severely_limited';
    impact: string;
  };

  // School type
  schoolType: {
    type: 'public' | 'public_magnet' | 'charter' | 'private' | 'parochial' | 'homeschool';
    selectivity: 'highly_selective' | 'selective' | 'open_enrollment';
    specialFocus?: string;
  };

  // Academic support
  academicSupport: {
    hasGuidanceCounselor: boolean;
    hasCollegeCounselor: boolean;
    hasAcademicSupport: boolean;
    supportQuality: 'excellent' | 'adequate' | 'limited' | 'none';
    impact: string;
  };

  // Overall educational context adjustment
  adjustment: {
    applicable: boolean;
    amount: number;
    justification: string;
  };
}

// ============================================================================
// IDENTITY CONTEXT
// ============================================================================

/**
 * Identity context assessment
 */
export interface IdentityContext {
  // Underrepresented status
  underrepresentedStatus: {
    isURM: boolean;
    urmCategory?: string;
    universityContext: string;
  };

  // Immigrant background
  immigrantBackground: {
    isImmigrant: boolean;
    generation: '1st' | '1.5' | '2nd' | 'later' | 'not_applicable';
    challenges: string[];
    strengths: string[];
  };

  // Cultural factors
  culturalFactors: {
    relevantFactors: string[];
    culturalContributions: string[];
    uniquePerspective: string;
  };

  // Field underrepresentation
  fieldUnderrepresentation: {
    applies: boolean;
    field: string;
    demographicGroup: string;
    significance: string;
  };

  // Overall identity context adjustment
  adjustment: {
    applicable: boolean;
    amount: number;
    justification: string;
  };
}

// ============================================================================
// COMPLETE CALIBRATION ASSESSMENT
// ============================================================================

/**
 * Complete context calibration assessment
 */
export interface ContextCalibration {
  // Metadata
  calibratedAt: string;
  version: string;

  // Individual context assessments
  socioeconomic: SocioeconomicContext;
  geographic: GeographicContext;
  personal: PersonalCircumstances;
  educational: EducationalContext;
  identity: IdentityContext;

  // Summary of context factors
  contextFactorsSummary: {
    allFactors: ContextFactor[];
    significantFactors: ContextFactor[];
    totalFactorCount: number;
    significantFactorCount: number;
  };

  // Total adjustment calculation
  totalAdjustment: {
    rawTotal: number;
    cappedTotal: number; // Cannot exceed MAX_TOTAL_CONTEXT_ADJUSTMENT (0.5)
    breakdown: {
      socioeconomic: number;
      geographic: number;
      personal: number;
      educational: number;
      identity: number;
    };
    justification: string;
  };

  // Context narrative
  contextNarrative: {
    headline: string;
    summary: string;
    keyFactors: string[];
    howItAffectedAchievements: string;
    demonstratedResilience: string;
    potentialUnlocked: string;
  };

  // Achievement recontextualization
  achievementRecontextualization: {
    originalAssessment: string;
    contextualizedAssessment: string;
    whatWouldHaveBeenPossible: string;
    whatTheyAccomplishedDespite: string;
  };

  // School-specific context relevance
  schoolSpecificRelevance: Record<string, {
    schoolId: string;
    contextRelevance: 'high' | 'moderate' | 'low';
    schoolValuesThisContext: boolean;
    recommendedEmphasis: string;
  }>;

  // Recommendations
  recommendations: {
    essayTopics: string[];
    additionalContextToProvide: string[];
    interviewPrep: string[];
    letterWriterGuidance: string[];
  };

  // Verification status
  verificationStatus: {
    fullyVerified: boolean;
    partiallyVerified: boolean;
    unverifiedClaims: string[];
    recommendedVerification: string[];
  };
}

// ============================================================================
// CALIBRATION CONFIGURATION
// ============================================================================

/**
 * Calibration configuration
 */
export interface CalibrationConfig {
  maxTotalAdjustment: number;
  requireVerification: boolean;
  schoolSpecificWeighting: boolean;
  includeNarrativeGuidance: boolean;
}

/**
 * Default calibration configuration
 */
export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  maxTotalAdjustment: 0.5,
  requireVerification: false,
  schoolSpecificWeighting: true,
  includeNarrativeGuidance: true,
};

// ============================================================================
// CALIBRATION UTILITIES
// ============================================================================

/**
 * Calculate adjustment for a single factor
 */
export function calculateFactorAdjustment(
  factor: ContextFactor,
  maxAdjustment: number
): number {
  if (!factor.present || factor.severity === 'none') {
    return 0;
  }

  const severityMultiplier: Record<string, number> = {
    significant: 1.0,
    moderate: 0.6,
    mild: 0.3,
    none: 0,
  };

  const verificationMultiplier = factor.verified ? 1.0 : 0.8;

  return maxAdjustment * severityMultiplier[factor.severity] * verificationMultiplier;
}

/**
 * Context impact level descriptions
 */
export const CONTEXT_IMPACT_LEVELS = {
  exceptional: 'Student has overcome extraordinary circumstances. Achievements should be viewed through lens of significant adversity.',
  significant: 'Notable context factors that meaningfully affected opportunities. Achievements are impressive given circumstances.',
  moderate: 'Some context factors present. Achievements should be considered in light of limited opportunities in certain areas.',
  minimal: 'Context is largely typical. Standard evaluation applies.',
  privileged: 'Student had exceptional access to resources and opportunities. Achievements should be evaluated accordingly.',
};
