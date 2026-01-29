/**
 * Universal Scoring Types
 *
 * Comprehensive type definitions for the Harvard 1-6 scoring scale and
 * Universal Holistic Score calculation. This file defines the core scoring
 * framework that underlies all portfolio assessments.
 *
 * Harvard 1-6 Scale:
 * 1 = Exceptional (Top 1%, 90-98% admit rate at T10)
 * 2 = Excellent (Top 5%, 70-90% admit rate at T10)
 * 3 = Good (Top 15%, 40-70% admit rate at T10)
 * 4 = Adequate (Top 30%, 15-40% admit rate at T10)
 * 5 = Below Average (Below top 30%, 5-15% admit rate at T10)
 * 6 = Concerning (Significant weaknesses, <5% admit rate at T10)
 *
 * Universal Holistic Score Formula:
 * UHS = (Academic × 0.15) + (Activities × 0.25) + (Character × 0.30) +
 *       (Narrative × 0.20) + (Fit × 0.10) + ContextAdjustment - RedFlagDeductions
 */

// ============================================================================
// HARVARD SCORING SCALE
// ============================================================================

/**
 * Harvard 1-6 score type
 */
export type HarvardScore = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Harvard score with decimal precision (for weighted calculations)
 */
export type HarvardScoreDecimal = number; // 1.0 to 6.0

/**
 * Harvard score descriptors
 */
export const HARVARD_SCORE_DESCRIPTORS: Record<HarvardScore, {
  label: string;
  description: string;
  percentile: string;
  t10AdmitRate: string;
}> = {
  1: {
    label: 'Exceptional',
    description: 'Among the best we see. Genuine excellence with national/international impact. Would be a top admit at any school.',
    percentile: 'Top 1%',
    t10AdmitRate: '90-98%',
  },
  2: {
    label: 'Excellent',
    description: 'Significantly above typical strong applicant. Outstanding achievement with meaningful impact.',
    percentile: 'Top 5%',
    t10AdmitRate: '70-90%',
  },
  3: {
    label: 'Good',
    description: 'Solid, competitive profile. Clear strengths but not exceptional. Competitive at selective schools.',
    percentile: 'Top 15%',
    t10AdmitRate: '40-70%',
  },
  4: {
    label: 'Adequate',
    description: 'Meets expectations but lacks distinguishing features. Average for selective school applicant pool.',
    percentile: 'Top 30%',
    t10AdmitRate: '15-40%',
  },
  5: {
    label: 'Below Average',
    description: 'Gaps or weaknesses present. Below typical applicant quality for selective schools.',
    percentile: 'Below top 30%',
    t10AdmitRate: '5-15%',
  },
  6: {
    label: 'Concerning',
    description: 'Significant weaknesses or red flags. Would need substantial mitigation.',
    percentile: 'Bottom half',
    t10AdmitRate: '<5%',
  },
};

/**
 * Convert Harvard score to 0-100 scale
 */
export function harvardScoreToPercentage(score: HarvardScore | HarvardScoreDecimal): number {
  // Linear mapping: 1 = 100, 6 = 0
  return Math.round((6 - score) * 20);
}

/**
 * Convert 0-100 percentage to Harvard score
 */
export function percentageToHarvardScore(percentage: number): HarvardScoreDecimal {
  // Reverse of above: 100 = 1, 0 = 6
  return Math.max(1, Math.min(6, 6 - (percentage / 20)));
}

// ============================================================================
// COMPONENT SCORING
// ============================================================================

/**
 * Portfolio component types for scoring
 */
export type ScoringComponent =
  | 'academic'
  | 'activities'
  | 'character'
  | 'narrative'
  | 'fit';

/**
 * Component weight configuration
 */
export interface ComponentWeights {
  academic: number;
  activities: number;
  character: number;
  narrative: number;
  fit: number;
}

/**
 * Default component weights (sum to 1.0)
 */
export const DEFAULT_COMPONENT_WEIGHTS: ComponentWeights = {
  academic: 0.15,
  activities: 0.25,
  character: 0.30,
  narrative: 0.20,
  fit: 0.10,
};

/**
 * Individual component score
 */
export interface ComponentScore {
  component: ScoringComponent;
  harvardScore: HarvardScoreDecimal;
  weight: number;
  weightedContribution: number;
  confidence: number;
  justification: string;
  subScores?: {
    name: string;
    score: HarvardScoreDecimal;
    weight: number;
  }[];
}

// ============================================================================
// CONTEXT ADJUSTMENTS
// ============================================================================

/**
 * Context adjustment factors
 */
export interface ContextAdjustment {
  factor: ContextAdjustmentFactor;
  adjustment: number; // Positive number that improves score
  maxAdjustment: number;
  justification: string;
  verified: boolean;
}

/**
 * Types of context adjustments
 */
export type ContextAdjustmentFactor =
  | 'first_generation'
  | 'low_income'
  | 'under_resourced_school'
  | 'rural_geographic'
  | 'significant_adversity'
  | 'family_responsibilities'
  | 'limited_opportunities'
  | 'immigrant_background'
  | 'underrepresented_field'; // e.g., woman in CS, man in nursing

/**
 * Context adjustment limits
 */
export const CONTEXT_ADJUSTMENT_LIMITS: Record<ContextAdjustmentFactor, number> = {
  first_generation: 0.3,
  low_income: 0.3,
  under_resourced_school: 0.25,
  rural_geographic: 0.2,
  significant_adversity: 0.4,
  family_responsibilities: 0.25,
  limited_opportunities: 0.3,
  immigrant_background: 0.15,
  underrepresented_field: 0.15,
};

/**
 * Maximum total context adjustment
 */
export const MAX_TOTAL_CONTEXT_ADJUSTMENT = 0.5; // Half a Harvard point maximum

// ============================================================================
// RED FLAG DEDUCTIONS
// ============================================================================

/**
 * Red flag deduction by severity tier
 */
export interface RedFlagDeduction {
  flagId: string;
  severity: 1 | 2 | 3 | 4;
  deduction: number;
  canBeMitigated: boolean;
  mitigatedDeduction?: number;
}

/**
 * Red flag severity to deduction mapping
 */
export const RED_FLAG_DEDUCTION_RANGES: Record<1 | 2 | 3 | 4, { min: number; max: number }> = {
  1: { min: 2.0, max: 3.0 },  // Critical - potentially fatal
  2: { min: 1.0, max: 1.5 },  // Severe - serious damage
  3: { min: 0.5, max: 0.75 }, // Moderate - noticeable impact
  4: { min: 0.1, max: 0.25 }, // Minor - small penalty
};

// ============================================================================
// UNIVERSAL HOLISTIC SCORE
// ============================================================================

/**
 * Universal Holistic Score calculation result
 */
export interface UniversalHolisticScore {
  // Final score
  finalScore: HarvardScoreDecimal;
  finalScoreRounded: HarvardScore;
  percentageEquivalent: number;

  // Score breakdown
  breakdown: {
    // Component contributions (weighted)
    academicContribution: number;
    activitiesContribution: number;
    characterContribution: number;
    narrativeContribution: number;
    fitContribution: number;
    baseScore: number;

    // Adjustments
    contextAdjustment: number;
    redFlagDeductions: number;
    coherenceBonus: number;

    // Final calculation
    preAdjustmentScore: number;
    postAdjustmentScore: number;
    finalScore: number;
  };

  // Individual component scores
  componentScores: ComponentScore[];

  // Context adjustments applied
  contextAdjustments: ContextAdjustment[];
  totalContextAdjustment: number;

  // Red flags and deductions
  redFlagDeductions: RedFlagDeduction[];
  totalRedFlagDeduction: number;

  // Coherence bonus (when components reinforce each other)
  coherenceBonus: {
    applied: boolean;
    amount: number;
    justification: string;
  };

  // Confidence and metadata
  confidence: number;
  calculatedAt: string;
  version: string;

  // Narrative summary
  scoreSummary: {
    headline: string;
    paragraph: string;
    strengthsContributing: string[];
    areasHurting: string[];
    biggestOpportunity: string;
  };
}

// ============================================================================
// SCHOOL-SPECIFIC WEIGHT ADJUSTMENTS
// ============================================================================

/**
 * School type categories for weight adjustment
 */
export type SchoolType =
  | 'stem_focused'       // MIT, Caltech, Georgia Tech
  | 'research_university' // Harvard, Stanford, Princeton
  | 'liberal_arts'       // Williams, Amherst, Swarthmore
  | 'ivy_league'         // Harvard, Yale, Princeton, etc.
  | 'public_flagship'    // Berkeley, Michigan, UVA
  | 'arts_focused'       // RISD, Juilliard, Berklee
  | 'business_focused'   // Wharton, Stern, Ross
  | 'general';           // Default weights

/**
 * School-specific weight adjustments
 */
export const SCHOOL_TYPE_WEIGHT_ADJUSTMENTS: Record<SchoolType, Partial<ComponentWeights>> = {
  stem_focused: {
    academic: 0.25,    // +0.10
    activities: 0.20,  // -0.05
    character: 0.25,   // -0.05
    narrative: 0.15,   // -0.05
    fit: 0.15,         // +0.05
  },
  research_university: {
    academic: 0.20,
    activities: 0.25,
    character: 0.25,
    narrative: 0.20,
    fit: 0.10,
  },
  liberal_arts: {
    academic: 0.15,
    activities: 0.20,
    character: 0.30,
    narrative: 0.25,   // Higher - essays matter more
    fit: 0.10,
  },
  ivy_league: {
    academic: 0.15,
    activities: 0.25,
    character: 0.30,
    narrative: 0.20,
    fit: 0.10,
  },
  public_flagship: {
    academic: 0.30,    // Higher - more numbers-driven
    activities: 0.25,
    character: 0.20,
    narrative: 0.15,
    fit: 0.10,
  },
  arts_focused: {
    academic: 0.10,    // Lower - talent matters most
    activities: 0.35,  // Portfolio/audition
    character: 0.20,
    narrative: 0.25,
    fit: 0.10,
  },
  business_focused: {
    academic: 0.20,
    activities: 0.30,  // Leadership/impact matters
    character: 0.25,
    narrative: 0.15,
    fit: 0.10,
  },
  general: DEFAULT_COMPONENT_WEIGHTS,
};

// ============================================================================
// SCORE COMPARISON UTILITIES
// ============================================================================

/**
 * Compare two Harvard scores
 */
export function compareHarvardScores(
  score1: HarvardScoreDecimal,
  score2: HarvardScoreDecimal
): 'better' | 'same' | 'worse' {
  if (score1 < score2 - 0.25) return 'better';
  if (score1 > score2 + 0.25) return 'worse';
  return 'same';
}

/**
 * Get tier label for Harvard score
 */
export function getScoreTierLabel(score: HarvardScoreDecimal): string {
  if (score <= 1.5) return 'Exceptional';
  if (score <= 2.5) return 'Excellent';
  if (score <= 3.5) return 'Good';
  if (score <= 4.5) return 'Adequate';
  if (score <= 5.5) return 'Below Average';
  return 'Concerning';
}

/**
 * Get admission probability estimate for T10 schools
 */
export function getT10AdmissionProbability(score: HarvardScoreDecimal): {
  low: number;
  mid: number;
  high: number;
} {
  // Based on Harvard score descriptors
  if (score <= 1.5) return { low: 90, mid: 94, high: 98 };
  if (score <= 2.5) return { low: 70, mid: 80, high: 90 };
  if (score <= 3.5) return { low: 40, mid: 55, high: 70 };
  if (score <= 4.5) return { low: 15, mid: 27, high: 40 };
  if (score <= 5.5) return { low: 5, mid: 10, high: 15 };
  return { low: 1, mid: 3, high: 5 };
}

// ============================================================================
// ACTIVITY TIER MAPPING
// ============================================================================

/**
 * Activity tier (Harberson 4-3-2-1 system, inverted for scoring)
 */
export type ActivityTierScore = 1 | 2 | 3 | 4;

/**
 * Activity tier descriptions
 */
export const ACTIVITY_TIER_DESCRIPTIONS: Record<ActivityTierScore, {
  label: string;
  description: string;
  examples: string[];
  harvardEquivalent: HarvardScore;
}> = {
  1: {
    label: 'National/Elite',
    description: 'National/international recognition, founding successful organizations, Olympic-level athletics',
    examples: [
      'IMO/IOI medalist',
      'ISEF Grand Prize',
      'National Debate TOC winner',
      'Recruited D1 athlete',
      'Founded nonprofit serving 10,000+',
    ],
    harvardEquivalent: 1,
  },
  2: {
    label: 'State/Excellent',
    description: 'State/regional leadership, significant awards, published work',
    examples: [
      'State debate champion',
      'Regional Science Olympiad winner',
      'Varsity team captain',
      'Research published in journal',
      'Founded local chapter of national org',
    ],
    harvardEquivalent: 2,
  },
  3: {
    label: 'Regional/Good',
    description: 'School leadership, consistent commitment, meaningful local impact',
    examples: [
      'Club president',
      'JV team captain',
      'Regular volunteer coordinator',
      'School award winner',
      'Consistent 2+ year involvement',
    ],
    harvardEquivalent: 3,
  },
  4: {
    label: 'Participation/Basic',
    description: 'General participation, club membership, basic involvement',
    examples: [
      'Club member',
      'Occasional volunteer',
      'Team participant',
      'No leadership role',
      'Less than 1 year involvement',
    ],
    harvardEquivalent: 5, // Note: Maps to 5, not 4, because this is just baseline
  },
};

/**
 * Convert activity tier to Harvard score contribution
 */
export function activityTierToHarvardContribution(tier: ActivityTierScore): HarvardScoreDecimal {
  return ACTIVITY_TIER_DESCRIPTIONS[tier].harvardEquivalent;
}
