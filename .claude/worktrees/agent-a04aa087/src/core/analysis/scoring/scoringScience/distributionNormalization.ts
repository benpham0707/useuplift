/**
 * Score Distribution Normalization Module
 *
 * LLMs exhibit a well-documented "score compression" bias: they cluster
 * scores around the 5-7 range, effectively using only 30% of the 0-10
 * scale. This module corrects for this by:
 *
 * 1. Z-SCORE NORMALIZATION: Standardize against expected distributions
 * 2. PERCENTILE RANKING: Map scores to percentile positions
 * 3. STANINE CONVERSION: Map to 9-point stanine bands for clear grading
 * 4. RANGE EXPANSION: Ensure the full 1-10 scale is meaningfully used
 *
 * The module also detects when normalization is needed (score compression
 * detection) and provides health metrics for the score distribution.
 *
 * PIPELINE POSITION: Post-IRT, post-constraint, pre-final-report
 * PERFORMANCE: < 1ms (all algebraic operations)
 *
 * ACCURACY IMPROVEMENT: A student who scores 6/10 across all dimensions
 * might be at the 50th percentile (average) or the 70th (above average),
 * depending on how compressed the scoring distribution is. Normalization
 * ensures a 6 means the same thing across different LLM runs.
 */

import {
  NormalizationResult,
  NormalizationReport,
} from './types';

// ============================================================================
// EXPECTED SCORE DISTRIBUTIONS
// ============================================================================

/**
 * Expected score distribution parameters for each dimension of the
 * experience rubric. These represent "typical" score distributions
 * from calibrated human raters (not LLMs).
 *
 * In production, these would be estimated from historical scoring data.
 * For now, they encode our rubric design intent:
 * - Most activities should score 3-6 (median around 4.5)
 * - Elite activities score 7-9
 * - Perfect 10s should be extremely rare (top 1-2%)
 * - 0-2 indicates fundamental problems
 */
export const EXPECTED_DISTRIBUTIONS: Record<string, {
  mean: number;
  std_dev: number;
  /** Practical ceiling (score at 99th percentile) */
  p99: number;
  /** Practical floor (score at 1st percentile) */
  p01: number;
}> = {
  // Voice and craft tend to cluster mid-range (most people write averagely)
  voice_integrity:           { mean: 4.5, std_dev: 2.0, p99: 9.5, p01: 1.0 },
  craft_language_quality:    { mean: 4.8, std_dev: 1.8, p99: 9.0, p01: 1.5 },

  // Evidence has a wider range (some people are specific, many aren't)
  specificity_evidence:      { mean: 4.0, std_dev: 2.3, p99: 9.5, p01: 0.5 },

  // Impact and reflection are hard — most people score low
  transformative_impact:     { mean: 3.5, std_dev: 2.2, p99: 9.5, p01: 0.5 },
  reflection_meaning:        { mean: 3.8, std_dev: 2.1, p99: 9.5, p01: 0.5 },

  // Narrative arc is moderately accessible
  narrative_arc_stakes:      { mean: 4.2, std_dev: 2.0, p99: 9.5, p01: 0.5 },

  // Leadership and role vary widely
  initiative_leadership:     { mean: 4.3, std_dev: 2.2, p99: 9.5, p01: 0.5 },
  role_clarity_ownership:    { mean: 4.5, std_dev: 2.0, p99: 9.0, p01: 1.0 },

  // Collaboration is either there or not (somewhat bimodal)
  community_collaboration:   { mean: 4.0, std_dev: 2.5, p99: 9.5, p01: 0.5 },

  // Fit and time are contextual
  fit_trajectory:            { mean: 4.0, std_dev: 2.0, p99: 9.0, p01: 1.0 },
  time_investment_consistency: { mean: 5.0, std_dev: 2.0, p99: 9.5, p01: 1.5 },

  // Essay rubric dimensions
  opening_power_scene_entry:          { mean: 4.5, std_dev: 2.2, p99: 9.5, p01: 0.5 },
  narrative_arc_stakes_turn:          { mean: 4.2, std_dev: 2.1, p99: 9.5, p01: 0.5 },
  character_interiority_vulnerability: { mean: 3.8, std_dev: 2.3, p99: 9.5, p01: 0.5 },
  show_dont_tell_craft:               { mean: 4.0, std_dev: 2.2, p99: 9.5, p01: 0.5 },
  reflection_meaning_making:          { mean: 3.8, std_dev: 2.1, p99: 9.5, p01: 0.5 },
  intellectual_vitality_curiosity:    { mean: 4.0, std_dev: 2.0, p99: 9.0, p01: 0.5 },
  originality_specificity_voice:      { mean: 4.2, std_dev: 2.2, p99: 9.5, p01: 0.5 },
  structure_pacing_coherence:         { mean: 5.0, std_dev: 1.8, p99: 9.0, p01: 1.5 },
  word_economy_craft:                 { mean: 5.0, std_dev: 1.8, p99: 9.0, p01: 1.5 },
  context_constraints_disclosure:     { mean: 3.5, std_dev: 2.3, p99: 9.5, p01: 0.5 },
  school_program_fit:                 { mean: 4.0, std_dev: 2.2, p99: 9.5, p01: 0.5 },
  ethical_awareness_humility:         { mean: 4.5, std_dev: 2.0, p99: 9.0, p01: 1.0 },
};

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Convert a raw score to a z-score relative to expected distribution.
 */
function toZScore(
  rawScore: number,
  mean: number,
  stdDev: number
): number {
  if (stdDev <= 0) return 0;
  return (rawScore - mean) / stdDev;
}

/**
 * Convert a z-score to a percentile using the standard normal CDF
 * approximation (Abramowitz and Stegun).
 */
function zToPercentile(z: number): number {
  // Approximation of the standard normal CDF
  // Accurate to ~0.5% for |z| < 4
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z >= 0 ? 1 : -1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);

  const cdf = 0.5 * (1.0 + sign * y);
  return Math.max(0, Math.min(100, cdf * 100));
}

/**
 * Convert a percentile to a stanine (1-9).
 *
 * Stanine boundaries:
 *   1: 0-4%     (very low)
 *   2: 4-11%    (low)
 *   3: 11-23%   (below average)
 *   4: 23-40%   (below middle)
 *   5: 40-60%   (middle)
 *   6: 60-77%   (above middle)
 *   7: 77-89%   (above average)
 *   8: 89-96%   (high)
 *   9: 96-100%  (very high)
 */
function percentileToStanine(percentile: number): number {
  if (percentile < 4)  return 1;
  if (percentile < 11) return 2;
  if (percentile < 23) return 3;
  if (percentile < 40) return 4;
  if (percentile < 60) return 5;
  if (percentile < 77) return 6;
  if (percentile < 89) return 7;
  if (percentile < 96) return 8;
  return 9;
}

/**
 * Normalize a raw score to use the full 0-10 range more effectively.
 *
 * The approach:
 * 1. Compute z-score relative to expected distribution
 * 2. Map z-score back to 0-10 with the expected distribution's spread
 * 3. Apply gentle expansion to counteract LLM compression
 *
 * This is NOT the same as just scaling — it respects the expected
 * distribution shape, so a "genuinely average" score stays near 5.
 */
function normalizeScore(
  rawScore: number,
  expectedMean: number,
  expectedSD: number
): number {
  const z = toZScore(rawScore, expectedMean, expectedSD);

  // Map z-score back to 0-10 using a target distribution
  // Target: mean=5, SD=2.5 (uses more of the scale than typical LLM output)
  const targetMean = 5.0;
  const targetSD = 2.5;
  let normalized = targetMean + z * targetSD;

  // Clamp to valid range
  return Math.max(0, Math.min(10, Math.round(normalized * 100) / 100));
}

// ============================================================================
// MAIN NORMALIZATION FUNCTION
// ============================================================================

/**
 * Normalize a full set of dimension scores.
 *
 * @param rawScores - Raw dimension scores (0-10)
 * @param technique - Normalization approach to use
 * @returns Complete normalization report with per-dimension results
 */
export function normalizeScores(
  rawScores: Record<string, number>,
  technique: 'z_score' | 'percentile_rank' | 'stanine' = 'z_score'
): NormalizationReport {
  const dimensions: Record<string, NormalizationResult> = {};
  const rawValues = Object.values(rawScores);

  for (const [dim, rawScore] of Object.entries(rawScores)) {
    const expected = EXPECTED_DISTRIBUTIONS[dim];

    // Use dimension-specific distribution if available, otherwise global
    const dimMean = expected?.mean ?? 4.5;
    const dimSD = expected?.std_dev ?? 2.0;

    const zScore = toZScore(rawScore, dimMean, dimSD);
    const percentile = zToPercentile(zScore);
    const stanine = percentileToStanine(percentile);
    const normalizedScore = normalizeScore(rawScore, dimMean, dimSD);

    dimensions[dim] = {
      dimension: dim,
      raw_score: rawScore,
      z_score: Math.round(zScore * 100) / 100,
      percentile: Math.round(percentile * 10) / 10,
      stanine,
      normalized_score: technique === 'z_score'
        ? normalizedScore
        : technique === 'stanine'
          ? stanine  // Stanine is 1-9, would need different handling
          : normalizedScore,
      technique,
    };
  }

  // Distribution health metrics
  const effectiveMin = rawValues.length > 0 ? Math.min(...rawValues) : 0;
  const effectiveMax = rawValues.length > 0 ? Math.max(...rawValues) : 10;
  const effectiveRange: [number, number] = [effectiveMin, effectiveMax];
  const theoreticalRange: [number, number] = [0, 10];
  const rangeUtilization = (effectiveMax - effectiveMin) / 10;

  // Detect score compression
  const scoreSD = rawValues.length > 1
    ? Math.sqrt(
        rawValues.reduce((s, v) => s + (v - rawValues.reduce((a, b) => a + b, 0) / rawValues.length) ** 2, 0)
        / (rawValues.length - 1)
      )
    : 0;
  const compressionDetected = scoreSD < 1.5 || rangeUtilization < 0.4;

  const recommendations: string[] = [];
  if (compressionDetected) {
    recommendations.push(
      'Score compression detected: LLM is clustering scores in a narrow range. ' +
      'Consider using normalized scores for more meaningful differentiation.'
    );
  }
  if (effectiveMin > 3) {
    recommendations.push(
      `Floor effect: lowest score is ${effectiveMin}/10. ` +
      'The LLM may be reluctant to assign very low scores even when warranted.'
    );
  }
  if (effectiveMax < 8) {
    recommendations.push(
      `Ceiling avoidance: highest score is ${effectiveMax}/10. ` +
      'The LLM may be avoiding high scores. Consider if any dimension deserves 8+.'
    );
  }

  return {
    dimensions,
    distribution_health: {
      score_compression_detected: compressionDetected,
      effective_range: effectiveRange,
      theoretical_range: theoreticalRange,
      range_utilization: Math.round(rangeUtilization * 100) / 100,
      recommendations,
    },
  };
}

/**
 * Apply normalization to scores and return adjusted values.
 * This is a convenience function that extracts just the normalized scores.
 *
 * @param rawScores - Raw dimension scores
 * @param aggressiveness - How strongly to normalize (0=no change, 1=full normalization)
 * @returns Adjusted scores blended between raw and normalized
 */
export function applyNormalization(
  rawScores: Record<string, number>,
  aggressiveness: number = 0.5
): Record<string, number> {
  const report = normalizeScores(rawScores);
  const result: Record<string, number> = {};

  for (const [dim, raw] of Object.entries(rawScores)) {
    const normalized = report.dimensions[dim]?.normalized_score ?? raw;

    // Blend between raw and normalized based on aggressiveness
    const blended = raw * (1 - aggressiveness) + normalized * aggressiveness;
    result[dim] = Math.round(Math.max(0, Math.min(10, blended)) * 100) / 100;
  }

  return result;
}
