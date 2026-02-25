/**
 * Diminishing Returns Detection & Revision Priority Module
 *
 * Models the "improvement curve" for each rubric dimension to guide
 * students toward the most impactful revisions. Uses marginal utility
 * theory to answer: "Where should I spend my next hour of editing?"
 *
 * Key insight: improving voice_integrity from 4 to 5 adds more value
 * than improving craft_language_quality from 8 to 9, because:
 * 1. Voice has higher weight (10% vs 7%)
 * 2. The 4→5 gap is in the "high leverage" zone
 * 3. Improving from 8→9 has diminishing returns (near ceiling)
 * 4. The effort to gain +1 at high scores is exponentially harder
 *
 * PIPELINE POSITION: Post-calibration, feeds into coaching output
 * PERFORMANCE: < 1ms (algebraic operations)
 *
 * ACCURACY IMPROVEMENT: Prevents students from over-polishing already-strong
 * dimensions while neglecting weak ones. The effort-adjusted ranking
 * accounts for how hard each improvement actually is.
 */

import {
  MarginalImprovementAnalysis,
  RevisionPriorityReport,
} from './types';

// ============================================================================
// IMPROVEMENT CURVE MODEL
// ============================================================================

/**
 * Model the marginal utility of improving a dimension by 1 point.
 *
 * The utility function has three components:
 * 1. Weight contribution: higher-weight dimensions provide more QI gain
 * 2. Diminishing returns: utility decreases as score approaches ceiling
 * 3. Threshold effects: some improvements cross meaningful boundaries
 *    (e.g., moving from "weak" to "acceptable" band)
 *
 * The diminishing returns curve follows a modified logarithmic function:
 *   utility(score) = weight * (1 - (score/10)^gamma) * 10
 *
 * where gamma controls the steepness of diminishing returns.
 * - gamma = 1.0: linear diminishing returns
 * - gamma = 1.5: moderate diminishing returns (our default)
 * - gamma = 2.0: steep diminishing returns
 */
function marginalUtility(
  currentScore: number,
  dimensionWeight: number,
  gamma: number = 1.5
): number {
  // Base utility from weight and position on the curve
  const normalizedScore = currentScore / 10.0;
  const positionFactor = Math.max(0, 1.0 - Math.pow(normalizedScore, gamma));

  // Weight amplification
  const weightFactor = dimensionWeight * 10; // Scale weight to make differences visible

  // Threshold bonus: extra value for crossing key boundaries
  let thresholdBonus = 0;
  if (currentScore < 4 && currentScore >= 3) {
    // Crossing from "weak" to "below average" — high value
    thresholdBonus = 0.3;
  } else if (currentScore < 6 && currentScore >= 5) {
    // Crossing from "below average" to "acceptable" — moderate value
    thresholdBonus = 0.2;
  } else if (currentScore < 8 && currentScore >= 7) {
    // Crossing from "good" to "strong" — some value
    thresholdBonus = 0.1;
  }

  return (positionFactor * weightFactor) + thresholdBonus;
}

/**
 * Estimate the practical ceiling for a dimension based on essay characteristics.
 *
 * Some dimensions have natural ceilings for certain types of essays:
 * - A 100-word activity description can't score 10/10 on narrative arc
 * - A "Why us" essay has limited scope for vulnerability
 * - Work experience descriptions rarely achieve 10/10 on leadership
 *
 * @param dimension - The dimension name
 * @param wordCount - Essay word count
 * @param activityCategory - Optional activity category for experience rubric
 */
function practicalCeiling(
  dimension: string,
  wordCount: number,
  activityCategory?: string
): number {
  let ceiling = 10.0;

  // Word count caps
  if (wordCount < 100) {
    ceiling = Math.min(ceiling, 6);
  } else if (wordCount < 200) {
    ceiling = Math.min(ceiling, 8);
  }

  // Dimension-specific caps based on context
  if (activityCategory === 'work') {
    if (dimension === 'initiative_leadership') ceiling = Math.min(ceiling, 8);
    if (dimension === 'fit_trajectory') ceiling = Math.min(ceiling, 7);
  }
  if (activityCategory === 'athletics') {
    if (dimension === 'reflection_meaning') ceiling = Math.min(ceiling, 8);
  }

  return ceiling;
}

/**
 * Estimate the difficulty of improving a dimension by 1 point.
 *
 * Difficulty increases with current score (improving from 8 to 9 is
 * harder than improving from 3 to 4) and varies by dimension (some
 * dimensions are inherently harder to improve).
 */
function estimateDifficulty(
  dimension: string,
  currentScore: number
): 'easy' | 'moderate' | 'hard' | 'very_hard' {
  // Base difficulty from current score position
  let difficultyLevel = currentScore / 10.0;

  // Some dimensions are inherently harder to improve
  const hardDimensions = [
    'transformative_impact',
    'reflection_meaning',
    'character_interiority_vulnerability',
    'reflection_meaning_making',
  ];
  const moderateDimensions = [
    'narrative_arc_stakes',
    'voice_integrity',
    'narrative_arc_stakes_turn',
    'originality_specificity_voice',
  ];
  const easyDimensions = [
    'specificity_evidence',
    'time_investment_consistency',
    'craft_language_quality',
    'word_economy_craft',
    'structure_pacing_coherence',
  ];

  if (hardDimensions.includes(dimension)) {
    difficultyLevel += 0.15;
  } else if (easyDimensions.includes(dimension)) {
    difficultyLevel -= 0.10;
  }

  if (difficultyLevel < 0.3) return 'easy';
  if (difficultyLevel < 0.55) return 'moderate';
  if (difficultyLevel < 0.8) return 'hard';
  return 'very_hard';
}

/**
 * Convert difficulty to a numeric multiplier for effort-adjusted ranking.
 * Lower is better (easy improvements are preferred).
 */
function difficultyMultiplier(difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard'): number {
  switch (difficulty) {
    case 'easy': return 1.0;
    case 'moderate': return 1.5;
    case 'hard': return 2.5;
    case 'very_hard': return 4.0;
  }
}

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze marginal improvement potential for a single dimension.
 */
export function analyzeDimension(
  dimension: string,
  currentScore: number,
  weight: number,
  wordCount: number = 300,
  activityCategory?: string
): MarginalImprovementAnalysis {
  const ceiling = practicalCeiling(dimension, wordCount, activityCategory);
  const nearCeiling = currentScore >= ceiling - 1.0;
  const difficulty = estimateDifficulty(dimension, currentScore);

  // Compute utility curve for +1 through +5
  const utilityCurve: MarginalImprovementAnalysis['utility_curve'] = [];
  let cumulativeUtility = 0;

  for (let improvement = 1; improvement <= 5; improvement++) {
    const projectedScore = Math.min(ceiling, currentScore + improvement);
    const actualImprovement = projectedScore - currentScore;

    if (actualImprovement <= 0) break;

    const mu = marginalUtility(currentScore + improvement - 1, weight);
    cumulativeUtility += mu;

    // QI delta from this improvement point
    const qiDelta = weight * 10; // Each +1 point * weight * 10 = QI contribution

    utilityCurve.push({
      improvement,
      projected_score: Math.round(projectedScore * 10) / 10,
      marginal_utility: Math.round(mu * 1000) / 1000,
      cumulative_utility: Math.round(cumulativeUtility * 1000) / 1000,
      quality_index_delta: Math.round(qiDelta * 10) / 10,
    });
  }

  // Effort-adjusted rank score: utility / difficulty
  const marginalUtilityNext = utilityCurve.length > 0
    ? utilityCurve[0].marginal_utility
    : 0;
  const effortAdjustedScore = marginalUtilityNext / difficultyMultiplier(difficulty);

  return {
    dimension,
    current_score: currentScore,
    marginal_utility_next_point: marginalUtilityNext,
    utility_curve: utilityCurve,
    ceiling_distance: Math.round((ceiling - currentScore) * 10) / 10,
    near_ceiling: nearCeiling,
    difficulty,
    effort_adjusted_rank: Math.round(effortAdjustedScore * 1000) / 1000,
  };
}

/**
 * Generate a complete revision priority report.
 *
 * Analyzes all dimensions and produces a ranked list of where the
 * student should focus their revision efforts.
 *
 * @param scores - Current dimension scores
 * @param weights - Dimension weights
 * @param wordCount - Essay word count
 * @param activityCategory - Optional activity category
 * @returns Complete revision priority report
 */
export function generateRevisionPriorities(
  scores: Record<string, number>,
  weights: Record<string, number>,
  wordCount: number = 300,
  activityCategory?: string
): RevisionPriorityReport {
  // Analyze all dimensions
  const analyses: MarginalImprovementAnalysis[] = [];

  for (const [dim, score] of Object.entries(scores)) {
    const weight = weights[dim] ?? 0;
    if (weight <= 0) continue;

    analyses.push(
      analyzeDimension(dim, score, weight, wordCount, activityCategory)
    );
  }

  // Sort by effort-adjusted rank (descending — higher is better investment)
  analyses.sort((a, b) => b.effort_adjusted_rank - a.effort_adjusted_rank);

  // Assign rank numbers
  analyses.forEach((a, i) => {
    a.effort_adjusted_rank = i + 1;
  });

  // Top 3 recommendations
  const topRecs = analyses.slice(0, 3).map(a => {
    const targetImprovement = a.near_ceiling ? 1 : 2;
    const targetScore = Math.min(
      a.current_score + targetImprovement,
      a.current_score + a.ceiling_distance
    );

    const expectedQIGain = a.utility_curve.length > 0
      ? a.utility_curve.slice(0, targetImprovement).reduce(
          (s, u) => s + u.quality_index_delta,
          0
        )
      : 0;

    return {
      dimension: a.dimension,
      current: a.current_score,
      target: Math.round(targetScore * 10) / 10,
      expected_quality_gain: Math.round(expectedQIGain * 10) / 10,
      effort: a.difficulty,
      rationale: a.near_ceiling
        ? `Near ceiling (${a.ceiling_distance.toFixed(1)} points away). Small improvement still has value due to high weight.`
        : `${a.difficulty === 'easy' ? 'Quick win' : a.difficulty === 'moderate' ? 'Good return on effort' : 'Significant improvement needed'}: ` +
          `+${targetImprovement} points would add ~${expectedQIGain.toFixed(1)} to quality index.`,
    };
  });

  // Deprioritized dimensions
  const deprioritized = analyses
    .filter(a => a.near_ceiling || a.marginal_utility_next_point < 0.05)
    .map(a => ({
      dimension: a.dimension,
      reason: a.near_ceiling
        ? `Already at ${a.current_score}/10 (ceiling: ${(a.current_score + a.ceiling_distance).toFixed(1)}). Focus elsewhere.`
        : `Low marginal value (${a.marginal_utility_next_point.toFixed(3)}). Improvement here has minimal impact on overall quality.`,
    }));

  return {
    ranked_dimensions: analyses,
    top_recommendations: topRecs,
    deprioritized,
  };
}
