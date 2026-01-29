/**
 * Portfolio Strategy Scoring Utilities
 *
 * Standardized scoring algorithms used across all PASS engines.
 * These utilities ensure consistent, defensible scoring with clear rationale.
 *
 * QUALITY PRINCIPLES:
 * - Every score has a transparent calculation
 * - Context adjustments are documented
 * - Scores include confidence levels
 */

// ============================================================================
// SCORE NORMALIZATION
// ============================================================================

/**
 * Normalize a value to a 0-100 scale
 */
export function normalizeToScale(
  value: number,
  min: number,
  max: number,
  clamp: boolean = true
): number {
  if (max === min) return 50; // Avoid division by zero

  let normalized = ((value - min) / (max - min)) * 100;

  if (clamp) {
    normalized = Math.max(0, Math.min(100, normalized));
  }

  return Math.round(normalized * 10) / 10; // Round to 1 decimal
}

/**
 * Apply a sigmoid curve for smoother scoring (avoids hard cutoffs)
 * Good for metrics where extremes should have diminishing returns
 */
export function sigmoidNormalize(
  value: number,
  midpoint: number,
  steepness: number = 1
): number {
  const x = (value - midpoint) * steepness;
  const sigmoid = 1 / (1 + Math.exp(-x));
  return Math.round(sigmoid * 100 * 10) / 10;
}

/**
 * Calculate percentile position within a range
 */
export function calculatePercentile(
  value: number,
  percentile25: number,
  percentile50: number,
  percentile75: number
): { position: 'above_75th' | '50th_to_75th' | '25th_to_50th' | 'below_25th'; exactPercentile: number } {
  let exactPercentile: number;

  if (value >= percentile75) {
    // Above 75th - extrapolate
    const range = percentile75 - percentile50;
    if (range === 0) {
      exactPercentile = 87.5; // Default if no range
    } else {
      exactPercentile = Math.min(99, 75 + ((value - percentile75) / range) * 25);
    }
    return { position: 'above_75th', exactPercentile };
  }

  if (value >= percentile50) {
    // Between 50th and 75th
    const range = percentile75 - percentile50;
    if (range === 0) {
      exactPercentile = 62.5;
    } else {
      exactPercentile = 50 + ((value - percentile50) / range) * 25;
    }
    return { position: '50th_to_75th', exactPercentile };
  }

  if (value >= percentile25) {
    // Between 25th and 50th
    const range = percentile50 - percentile25;
    if (range === 0) {
      exactPercentile = 37.5;
    } else {
      exactPercentile = 25 + ((value - percentile25) / range) * 25;
    }
    return { position: '25th_to_50th', exactPercentile };
  }

  // Below 25th - extrapolate
  const range = percentile50 - percentile25;
  if (range === 0) {
    exactPercentile = 12.5;
  } else {
    exactPercentile = Math.max(1, 25 - ((percentile25 - value) / range) * 25);
  }
  return { position: 'below_25th', exactPercentile };
}

// ============================================================================
// WEIGHTED SCORING
// ============================================================================

export interface WeightedScoreComponent {
  score: number;
  weight: number;
  name: string;
}

export interface WeightedScoreResult {
  finalScore: number;
  components: Array<{
    name: string;
    score: number;
    weight: number;
    contribution: number;
    contributionPercent: number;
  }>;
  breakdown: string;
}

/**
 * Calculate weighted score with detailed breakdown
 */
export function calculateWeightedScore(
  components: WeightedScoreComponent[]
): WeightedScoreResult {
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);

  if (totalWeight === 0) {
    return {
      finalScore: 0,
      components: [],
      breakdown: 'No valid weights provided',
    };
  }

  // Normalize weights to sum to 1
  const normalizedComponents = components.map((c) => ({
    ...c,
    normalizedWeight: c.weight / totalWeight,
  }));

  // Calculate weighted sum
  const finalScore =
    normalizedComponents.reduce((sum, c) => sum + c.score * c.normalizedWeight, 0);

  const componentBreakdown = normalizedComponents.map((c) => ({
    name: c.name,
    score: c.score,
    weight: Math.round(c.normalizedWeight * 100),
    contribution: Math.round(c.score * c.normalizedWeight * 10) / 10,
    contributionPercent: Math.round((c.score * c.normalizedWeight / finalScore) * 100),
  }));

  const breakdown = componentBreakdown
    .map((c) => `${c.name}: ${c.score} × ${c.weight}% = ${c.contribution}`)
    .join(', ');

  return {
    finalScore: Math.round(finalScore * 10) / 10,
    components: componentBreakdown,
    breakdown,
  };
}

// ============================================================================
// TIER CALCULATION
// ============================================================================

export type TierLabel = 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';

export interface TierThresholds {
  exceptional: number;  // >= this is exceptional
  strong: number;       // >= this is strong
  competitive: number;  // >= this is competitive
  developing: number;   // >= this is developing
  // Below developing is needs_work
}

export const DEFAULT_TIER_THRESHOLDS: TierThresholds = {
  exceptional: 90,
  strong: 75,
  competitive: 60,
  developing: 40,
};

/**
 * Calculate tier from score
 */
export function calculateTier(
  score: number,
  thresholds: TierThresholds = DEFAULT_TIER_THRESHOLDS
): TierLabel {
  if (score >= thresholds.exceptional) return 'exceptional';
  if (score >= thresholds.strong) return 'strong';
  if (score >= thresholds.competitive) return 'competitive';
  if (score >= thresholds.developing) return 'developing';
  return 'needs_work';
}

/**
 * Get tier description
 */
export function getTierDescription(tier: TierLabel): string {
  const descriptions: Record<TierLabel, string> = {
    exceptional: 'Top 1% - Competitive at any selective institution',
    strong: 'Top 5% - Strong candidate at T20 schools',
    competitive: 'Top 15% - Competitive at selective schools with other strong factors',
    developing: 'Top 30% - Building foundation with room for improvement',
    needs_work: 'Significant gaps to address before applying to selective schools',
  };
  return descriptions[tier];
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

export interface ConfidenceFactors {
  dataCompleteness: number;   // 0-1: How much required data is present
  dataQuality: number;        // 0-1: How reliable/verified the data is
  sampleSize?: number;        // Optional: For aggregate comparisons
  recency?: number;           // 0-1: How recent the data is
}

/**
 * Calculate confidence score for an assessment
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  const weights = {
    dataCompleteness: 0.4,
    dataQuality: 0.4,
    sampleSize: 0.1,
    recency: 0.1,
  };

  let totalWeight = weights.dataCompleteness + weights.dataQuality;
  let weightedSum = factors.dataCompleteness * weights.dataCompleteness +
                    factors.dataQuality * weights.dataQuality;

  if (factors.sampleSize !== undefined) {
    // Normalize sample size: 100+ samples = high confidence
    const normalizedSampleSize = Math.min(1, factors.sampleSize / 100);
    weightedSum += normalizedSampleSize * weights.sampleSize;
    totalWeight += weights.sampleSize;
  }

  if (factors.recency !== undefined) {
    weightedSum += factors.recency * weights.recency;
    totalWeight += weights.recency;
  }

  return Math.round((weightedSum / totalWeight) * 100);
}

// ============================================================================
// CONTEXT ADJUSTMENTS
// ============================================================================

export interface ContextAdjustment {
  factor: string;
  adjustment: number;  // -15 to +15
  reasoning: string;
}

/**
 * Apply context adjustments to a base score
 */
export function applyContextAdjustments(
  baseScore: number,
  adjustments: ContextAdjustment[],
  maxTotalAdjustment: number = 20
): { adjustedScore: number; totalAdjustment: number; adjustments: ContextAdjustment[] } {
  // Calculate total adjustment (capped)
  let totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
  totalAdjustment = Math.max(-maxTotalAdjustment, Math.min(maxTotalAdjustment, totalAdjustment));

  // Apply adjustment and clamp to 0-100
  const adjustedScore = Math.max(0, Math.min(100, baseScore + totalAdjustment));

  return {
    adjustedScore,
    totalAdjustment,
    adjustments,
  };
}

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

export interface CompetitivePosition {
  position: 'above_average' | 'average' | 'below_average';
  percentileEstimate: number;
  narrative: string;
}

/**
 * Determine competitive position relative to peer group
 */
export function determineCompetitivePosition(
  score: number,
  averageScore: number,
  standardDeviation: number = 15
): CompetitivePosition {
  const zScore = (score - averageScore) / standardDeviation;

  if (zScore >= 0.5) {
    return {
      position: 'above_average',
      percentileEstimate: Math.min(99, Math.round(50 + zScore * 34)),
      narrative: `Stronger than ${Math.round(50 + Math.min(49, zScore * 34))}% of competitive applicants`,
    };
  }

  if (zScore >= -0.5) {
    return {
      position: 'average',
      percentileEstimate: Math.round(50 + zScore * 34),
      narrative: `Within typical range for competitive applicants (${Math.round(50 + zScore * 34)}th percentile)`,
    };
  }

  return {
    position: 'below_average',
    percentileEstimate: Math.max(1, Math.round(50 + zScore * 34)),
    narrative: `Below ${Math.round(100 - (50 + zScore * 34))}% of competitive applicants - improvement recommended`,
  };
}

// ============================================================================
// AGGREGATE SCORING
// ============================================================================

/**
 * Calculate aggregate score from multiple evaluations
 */
export function aggregateScores(scores: number[], method: 'mean' | 'weighted_mean' | 'median' | 'geometric_mean' = 'mean'): number {
  if (scores.length === 0) return 0;

  switch (method) {
    case 'mean':
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;

    case 'median': {
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    case 'geometric_mean': {
      // Good for scores that multiply effects
      const product = scores.reduce((a, b) => a * b, 1);
      return Math.round(Math.pow(product, 1 / scores.length) * 10) / 10;
    }

    default:
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
  }
}

// ============================================================================
// SCORE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert GPA to different scales
 */
export function convertGPA(gpa: number, fromScale: string, toScale: string): number {
  // First normalize to 4.0 scale
  let normalized: number;

  switch (fromScale) {
    case '4.0':
      normalized = gpa;
      break;
    case '5.0':
      normalized = (gpa / 5.0) * 4.0;
      break;
    case '6.0':
      normalized = (gpa / 6.0) * 4.0;
      break;
    case '100':
      // Letter grade conversion
      if (gpa >= 93) normalized = 4.0;
      else if (gpa >= 90) normalized = 3.7;
      else if (gpa >= 87) normalized = 3.3;
      else if (gpa >= 83) normalized = 3.0;
      else if (gpa >= 80) normalized = 2.7;
      else if (gpa >= 77) normalized = 2.3;
      else if (gpa >= 73) normalized = 2.0;
      else if (gpa >= 70) normalized = 1.7;
      else if (gpa >= 67) normalized = 1.3;
      else if (gpa >= 63) normalized = 1.0;
      else if (gpa >= 60) normalized = 0.7;
      else normalized = 0;
      break;
    default:
      normalized = gpa;
  }

  // Convert from 4.0 to target scale
  switch (toScale) {
    case '4.0':
      return Math.round(normalized * 100) / 100;
    case '5.0':
      return Math.round((normalized / 4.0) * 5.0 * 100) / 100;
    case '100':
      // Approximate reverse conversion
      if (normalized >= 4.0) return 97;
      if (normalized >= 3.7) return 92;
      if (normalized >= 3.3) return 88;
      if (normalized >= 3.0) return 85;
      if (normalized >= 2.7) return 82;
      if (normalized >= 2.3) return 78;
      if (normalized >= 2.0) return 75;
      if (normalized >= 1.7) return 72;
      if (normalized >= 1.3) return 68;
      if (normalized >= 1.0) return 65;
      return 60;
    default:
      return normalized;
  }
}

/**
 * Convert ACT to SAT equivalent (concordance table)
 */
export function actToSAT(actScore: number): number {
  // Based on College Board/ACT concordance tables
  const concordance: Record<number, number> = {
    36: 1590,
    35: 1540,
    34: 1500,
    33: 1460,
    32: 1430,
    31: 1400,
    30: 1370,
    29: 1340,
    28: 1310,
    27: 1280,
    26: 1240,
    25: 1210,
    24: 1180,
    23: 1140,
    22: 1110,
    21: 1080,
    20: 1040,
    19: 1010,
    18: 970,
    17: 930,
    16: 890,
    15: 850,
    14: 800,
    13: 760,
    12: 710,
    11: 670,
  };

  const clamped = Math.max(11, Math.min(36, Math.round(actScore)));
  return concordance[clamped] || 1000;
}

/**
 * Convert SAT to ACT equivalent
 */
export function satToACT(satScore: number): number {
  // Reverse concordance
  if (satScore >= 1570) return 36;
  if (satScore >= 1530) return 35;
  if (satScore >= 1490) return 34;
  if (satScore >= 1450) return 33;
  if (satScore >= 1420) return 32;
  if (satScore >= 1390) return 31;
  if (satScore >= 1360) return 30;
  if (satScore >= 1330) return 29;
  if (satScore >= 1300) return 28;
  if (satScore >= 1260) return 27;
  if (satScore >= 1230) return 26;
  if (satScore >= 1200) return 25;
  if (satScore >= 1160) return 24;
  if (satScore >= 1130) return 23;
  if (satScore >= 1100) return 22;
  if (satScore >= 1060) return 21;
  if (satScore >= 1030) return 20;
  return Math.max(11, Math.round((satScore - 400) / 50) + 11);
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * Generate a hash for input data (for cache invalidation)
 */
export function generateInputHash(data: unknown): string {
  const jsonString = JSON.stringify(data, Object.keys(data as object).sort());
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
