/**
 * Harvard Scale Calibration
 *
 * Calibration data and functions for the Harvard 1-6 scoring scale.
 * Used to ensure consistent scoring across the PASS system.
 *
 * HARVARD SCALE:
 * 1 - Exceptional: Top 1%, virtually certain admit (90%+ at T10)
 * 2 - Outstanding: Top 5%, strong candidate (60-80% at T10)
 * 3 - Strong: Top 15%, competitive (30-50% at T10)
 * 4 - Good: Top 30%, possible admit (10-25% at T10)
 * 5 - Average: Average for pool (<10% at T10)
 * 6 - Concerning: Below average (<5% at T10)
 */

import { HarvardScore, HarvardScoreDecimal } from '../types';

// ============================================================================
// CALIBRATION PROFILES
// ============================================================================

/**
 * Exemplar student profiles for each score level
 * Used to calibrate LLM scoring and verify consistency
 */
export interface CalibrationProfile {
  score: HarvardScore;
  label: string;
  academicIndicators: string[];
  activityIndicators: string[];
  characterIndicators: string[];
  typicalOutcomes: string[];
  admitProbability: {
    harvard: number;
    t10: number;
    t20: number;
    t50: number;
  };
  realWorldExamples: string[];
}

export const CALIBRATION_PROFILES: Record<HarvardScore, CalibrationProfile> = {
  1: {
    score: 1,
    label: 'Exceptional',
    academicIndicators: [
      '4.0 UW GPA with most rigorous curriculum',
      'Perfect or near-perfect test scores (1570+ SAT, 35+ ACT)',
      '5s on all AP exams (8+ exams)',
      'National academic competition recognition (USAMO, Intel finalist)',
      'Published research or significant academic work',
    ],
    activityIndicators: [
      'Multiple Tier 1 activities',
      'National/international recognition in primary area',
      'Founded organization with significant impact',
      'Clear spike with exceptional depth',
    ],
    characterIndicators: [
      'Genuine intellectual passion that shapes their life',
      'Leadership that transforms their environment',
      'Authentic voice that stands out immediately',
      'Clear sense of purpose and direction',
    ],
    typicalOutcomes: [
      'Admitted to Harvard, Stanford, MIT with high confidence',
      'Full scholarships at any school',
      'Multiple T10 acceptances',
    ],
    admitProbability: {
      harvard: 0.40, // Even exceptional students face lottery
      t10: 0.90,
      t20: 0.98,
      t50: 1.0,
    },
    realWorldExamples: [
      'Regeneron Science Talent Search finalist with original cancer research',
      'IMO gold medalist who founded math education nonprofit',
      'Published author whose book was adopted by schools',
      'Child actor with national credits who maintains 4.0',
    ],
  },
  2: {
    score: 2,
    label: 'Outstanding',
    academicIndicators: [
      '3.9+ UW GPA with rigorous curriculum',
      'Very strong test scores (1500+ SAT, 34+ ACT)',
      'Multiple 5s on AP exams',
      'State-level academic recognition',
      'Research experience with meaningful contribution',
    ],
    activityIndicators: [
      '1-2 Tier 1 activities or multiple Tier 2',
      'State/regional recognition in primary area',
      'Clear leadership with measurable impact',
      'Strong spike developing',
    ],
    characterIndicators: [
      'Clear intellectual interests with depth',
      'Effective leadership that makes a difference',
      'Authentic and memorable in essays',
      'Shows genuine growth and self-awareness',
    ],
    typicalOutcomes: [
      'Strong chance at T10 schools',
      'Likely admits at T20 schools',
      'Merit scholarships at most schools',
    ],
    admitProbability: {
      harvard: 0.15,
      t10: 0.70,
      t20: 0.85,
      t50: 0.98,
    },
    realWorldExamples: [
      'State debate champion with political internship',
      'AIME qualifier who founded coding education program',
      'All-state musician leading youth orchestra',
      'Student body president with policy changes implemented',
    ],
  },
  3: {
    score: 3,
    label: 'Strong',
    academicIndicators: [
      '3.7+ UW GPA with challenging curriculum',
      'Strong test scores (1400+ SAT, 32+ ACT)',
      'Several AP courses with good scores',
      'Some academic recognition',
    ],
    activityIndicators: [
      'Tier 2-3 activities with leadership',
      'School/local recognition',
      'Consistent commitment (2+ years)',
      'Developing expertise in one area',
    ],
    characterIndicators: [
      'Intellectual curiosity beyond requirements',
      'Holds leadership positions with some accomplishments',
      'Essays show genuine personality',
      'Demonstrates growth over time',
    ],
    typicalOutcomes: [
      'Competitive at T20 schools',
      'Strong chance at T50 schools',
      'Good merit aid at many schools',
    ],
    admitProbability: {
      harvard: 0.05,
      t10: 0.35,
      t20: 0.55,
      t50: 0.85,
    },
    realWorldExamples: [
      'Varsity captain with all-conference honors',
      'Club president with new initiatives',
      'Regular volunteer (100+ hours) with leadership',
      'Strong academic performer with clear interests',
    ],
  },
  4: {
    score: 4,
    label: 'Good',
    academicIndicators: [
      '3.5+ UW GPA',
      'Solid test scores (1300+ SAT, 29+ ACT)',
      'Some AP/honors courses',
      'Meets academic requirements',
    ],
    activityIndicators: [
      'Tier 3-4 activities',
      'Some involvement but limited distinction',
      'Participates without leading',
    ],
    characterIndicators: [
      'Adequate self-presentation',
      'Some interests evident',
      'Generic but acceptable essays',
    ],
    typicalOutcomes: [
      'Possible at T20 with hooks',
      'Competitive at T50 schools',
      'Strong at regional universities',
    ],
    admitProbability: {
      harvard: 0.02,
      t10: 0.15,
      t20: 0.30,
      t50: 0.65,
    },
    realWorldExamples: [
      'Good student with standard activities',
      'Participates in multiple clubs without leadership',
      'Part-time job with basic responsibility',
    ],
  },
  5: {
    score: 5,
    label: 'Average',
    academicIndicators: [
      '3.0-3.4 UW GPA',
      'Average test scores (1200-1300 SAT)',
      'Limited advanced coursework',
    ],
    activityIndicators: [
      'Tier 4 activities only',
      'Minimal involvement',
      'Short-term participation',
    ],
    characterIndicators: [
      'Generic presentation',
      'Limited self-awareness',
      'Essays don\'t stand out',
    ],
    typicalOutcomes: [
      'Unlikely at T50',
      'Competitive at T100',
      'Strong at regional schools',
    ],
    admitProbability: {
      harvard: 0.005,
      t10: 0.05,
      t20: 0.12,
      t50: 0.35,
    },
    realWorldExamples: [
      'Average student meeting minimum requirements',
      'Few extracurriculars',
      'Limited engagement outside school',
    ],
  },
  6: {
    score: 6,
    label: 'Concerning',
    academicIndicators: [
      'Below 3.0 GPA',
      'Below average test scores',
      'Limited rigorous coursework',
      'Academic concerns',
    ],
    activityIndicators: [
      'Minimal or no activities',
      'No demonstrated interests',
    ],
    characterIndicators: [
      'Concerning patterns',
      'No clear direction',
      'Red flags present',
    ],
    typicalOutcomes: [
      'T50 very unlikely',
      'May face admissions challenges broadly',
    ],
    admitProbability: {
      harvard: 0.001,
      t10: 0.02,
      t20: 0.05,
      t50: 0.15,
    },
    realWorldExamples: [
      'Student with academic struggles',
      'No extracurricular engagement',
      'Concerns about college readiness',
    ],
  },
};

// ============================================================================
// SCORE CALIBRATION FUNCTIONS
// ============================================================================

/**
 * Get admission probability for a given score and school tier
 */
export function getAdmitProbability(
  score: HarvardScoreDecimal,
  schoolTier: 'harvard' | 't10' | 't20' | 't50'
): number {
  const floorScore = Math.floor(score) as HarvardScore;
  const ceilScore = Math.min(6, Math.ceil(score)) as HarvardScore;
  const fraction = score - floorScore;

  const floorProb = CALIBRATION_PROFILES[floorScore].admitProbability[schoolTier];
  const ceilProb = CALIBRATION_PROFILES[ceilScore].admitProbability[schoolTier];

  // Linear interpolation
  return floorProb + (ceilProb - floorProb) * fraction;
}

/**
 * Get calibration profile for a score
 */
export function getCalibrationProfile(score: HarvardScore): CalibrationProfile {
  return CALIBRATION_PROFILES[score];
}

/**
 * Get all indicators for a score level
 */
export function getScoreIndicators(score: HarvardScore): {
  academic: string[];
  activities: string[];
  character: string[];
} {
  const profile = CALIBRATION_PROFILES[score];
  return {
    academic: profile.academicIndicators,
    activities: profile.activityIndicators,
    character: profile.characterIndicators,
  };
}

// ============================================================================
// SCORE ADJUSTMENT FACTORS
// ============================================================================

/**
 * Context-based score adjustments
 * These factors can modify the raw score based on applicant context
 */
export interface ScoreAdjustment {
  factor: string;
  category: 'positive' | 'negative' | 'contextual';
  maxAdjustment: number; // In score points (e.g., -0.5 means can improve score by 0.5)
  description: string;
  applicableConditions: string[];
}

export const SCORE_ADJUSTMENTS: ScoreAdjustment[] = [
  // Positive adjustments (improve score = lower number)
  {
    factor: 'first_generation',
    category: 'positive',
    maxAdjustment: -0.3,
    description: 'First-generation college student context',
    applicableConditions: [
      'Neither parent has 4-year degree',
      'Limited college guidance available',
      'Self-navigated application process',
    ],
  },
  {
    factor: 'socioeconomic_disadvantage',
    category: 'positive',
    maxAdjustment: -0.4,
    description: 'Significant socioeconomic challenges',
    applicableConditions: [
      'Low-income household',
      'Worked to support family',
      'Limited access to resources',
    ],
  },
  {
    factor: 'geographic_disadvantage',
    category: 'positive',
    maxAdjustment: -0.2,
    description: 'Geographic limitations on opportunities',
    applicableConditions: [
      'Rural area with limited resources',
      'Underrepresented region',
      'Limited access to programs',
    ],
  },
  {
    factor: 'personal_circumstances',
    category: 'positive',
    maxAdjustment: -0.5,
    description: 'Significant personal adversity overcome',
    applicableConditions: [
      'Major health challenge',
      'Family crisis',
      'Immigration/refugee experience',
    ],
  },

  // Negative adjustments (worsen score = higher number)
  {
    factor: 'privileged_underperformance',
    category: 'negative',
    maxAdjustment: 0.3,
    description: 'Achievements don\'t match available resources',
    applicableConditions: [
      'Elite prep school with average results',
      'Extensive resources but limited accomplishments',
      'Legacy/donor with unimpressive profile',
    ],
  },
  {
    factor: 'red_flag_detected',
    category: 'negative',
    maxAdjustment: 1.0,
    description: 'Red flags identified in application',
    applicableConditions: [
      'Inconsistencies in materials',
      'Suspected fabrication',
      'Character concerns',
    ],
  },

  // Contextual (direction depends on specifics)
  {
    factor: 'legacy_status',
    category: 'contextual',
    maxAdjustment: -0.2,
    description: 'Legacy status consideration',
    applicableConditions: [
      'Parent attended target school',
      'May help at schools that consider legacy',
    ],
  },
  {
    factor: 'recruited_athlete',
    category: 'contextual',
    maxAdjustment: -1.0,
    description: 'Athletic recruitment consideration',
    applicableConditions: [
      'On coach\'s recruitment list',
      'Sport needs at target school',
    ],
  },
  {
    factor: 'institutional_priority',
    category: 'contextual',
    maxAdjustment: -0.3,
    description: 'Fits institutional priorities',
    applicableConditions: [
      'Underrepresented major at school',
      'Geographic diversity priority',
      'Specific skill school needs',
    ],
  },
];

/**
 * Apply adjustments to a base score
 */
export function applyScoreAdjustments(
  baseScore: HarvardScoreDecimal,
  adjustments: Array<{ factor: string; magnitude: number }>
): HarvardScoreDecimal {
  let adjustedScore = baseScore;

  for (const adj of adjustments) {
    const adjustmentDef = SCORE_ADJUSTMENTS.find(a => a.factor === adj.factor);
    if (adjustmentDef) {
      // Ensure adjustment doesn't exceed maximum
      const boundedMagnitude = Math.abs(adj.magnitude) <= Math.abs(adjustmentDef.maxAdjustment)
        ? adj.magnitude
        : adjustmentDef.maxAdjustment * Math.sign(adj.magnitude);

      adjustedScore += boundedMagnitude;
    }
  }

  // Bound to valid score range
  return Math.max(1.0, Math.min(6.0, adjustedScore)) as HarvardScoreDecimal;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a score is consistent with provided evidence
 */
export interface ScoreValidation {
  isValid: boolean;
  concerns: string[];
  suggestedScore?: HarvardScoreDecimal;
}

export function validateScore(
  claimedScore: HarvardScoreDecimal,
  evidence: {
    academicLevel: 'exceptional' | 'strong' | 'good' | 'average' | 'below_average';
    activityLevel: 'tier1' | 'tier2' | 'tier3' | 'tier4';
    characterLevel: 'exceptional' | 'strong' | 'good' | 'average' | 'concerning';
  }
): ScoreValidation {
  const concerns: string[] = [];

  // Map evidence to expected score ranges
  const academicRange: Record<string, [number, number]> = {
    exceptional: [1.0, 2.0],
    strong: [2.0, 3.5],
    good: [3.0, 4.5],
    average: [4.0, 5.5],
    below_average: [5.0, 6.0],
  };

  const activityRange: Record<string, [number, number]> = {
    tier1: [1.0, 2.0],
    tier2: [1.5, 3.0],
    tier3: [2.5, 4.5],
    tier4: [4.0, 6.0],
  };

  const characterRange: Record<string, [number, number]> = {
    exceptional: [1.0, 2.0],
    strong: [2.0, 3.5],
    good: [3.0, 4.5],
    average: [4.0, 5.5],
    concerning: [5.0, 6.0],
  };

  // Check each dimension
  const academicExpected = academicRange[evidence.academicLevel];
  if (claimedScore < academicExpected[0] - 0.5 || claimedScore > academicExpected[1] + 0.5) {
    concerns.push(`Academic level (${evidence.academicLevel}) doesn't support score ${claimedScore}`);
  }

  const activityExpected = activityRange[evidence.activityLevel];
  if (claimedScore < activityExpected[0] - 0.5 || claimedScore > activityExpected[1] + 0.5) {
    concerns.push(`Activity level (${evidence.activityLevel}) doesn't support score ${claimedScore}`);
  }

  const characterExpected = characterRange[evidence.characterLevel];
  if (claimedScore < characterExpected[0] - 0.5 || claimedScore > characterExpected[1] + 0.5) {
    concerns.push(`Character level (${evidence.characterLevel}) doesn't support score ${claimedScore}`);
  }

  // Calculate suggested score if concerns
  let suggestedScore: HarvardScoreDecimal | undefined;
  if (concerns.length > 0) {
    const avgMin = (academicExpected[0] + activityExpected[0] + characterExpected[0]) / 3;
    const avgMax = (academicExpected[1] + activityExpected[1] + characterExpected[1]) / 3;
    suggestedScore = ((avgMin + avgMax) / 2) as HarvardScoreDecimal;
  }

  return {
    isValid: concerns.length === 0,
    concerns,
    suggestedScore,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const harvardScaleCalibration = {
  CALIBRATION_PROFILES,
  SCORE_ADJUSTMENTS,
  getAdmitProbability,
  getCalibrationProfile,
  getScoreIndicators,
  applyScoreAdjustments,
  validateScore,
};
