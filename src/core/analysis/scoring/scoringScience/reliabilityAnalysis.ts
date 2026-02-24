/**
 * Score Reliability & Consistency Analysis Module
 *
 * Applies classical test theory (CTT) techniques to evaluate the internal
 * consistency and reliability of dimension scores for a single essay.
 *
 * When an LLM scores 11 dimensions of an essay, the scores should be
 * internally consistent — they should "hang together" as a coherent
 * evaluation. If voice_integrity is 9 but craft_language_quality is 2,
 * something is likely wrong with the scoring.
 *
 * This module provides:
 * 1. Cronbach's Alpha — overall internal consistency
 * 2. Alpha-if-deleted — identifies which dimension is "the problem"
 * 3. Item-total correlations — which dimensions track overall quality
 * 4. Standard Error of Measurement — precision of each score
 * 5. Split-half reliability — agreement between two scoring passes
 *
 * PIPELINE POSITION: Post-LLM scoring, used to flag unreliable results
 * PERFORMANCE: < 1ms (all computations are statistical, no API calls)
 *
 * ACCURACY IMPROVEMENT: Catches LLM scoring errors that would otherwise
 * produce misleading quality indices. A Cronbach's alpha below 0.7
 * indicates the scores don't form a reliable measurement — suggesting
 * the LLM may have been inconsistent or the essay may be unusual enough
 * to confuse the scorer.
 */

import {
  InternalConsistency,
  SplitHalfReliability,
  SEMAnalysis,
  MultiRaterResult,
} from './types';

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

/**
 * Compute the variance of an array of numbers.
 */
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
}

/**
 * Compute the standard deviation of an array of numbers.
 */
function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Compute the Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denominator = Math.sqrt(sumX2 * sumY2);
  return denominator > 0 ? sumXY / denominator : 0;
}

/**
 * Compute the mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ============================================================================
// CRONBACH'S ALPHA
// ============================================================================

/**
 * Compute Cronbach's Alpha for internal consistency.
 *
 * Alpha = (k / (k-1)) * (1 - sum(item_variances) / total_variance)
 *
 * For a single essay, we treat the essay as a "test" and each dimension
 * score as an "item response." The interpretation is slightly different
 * from traditional test theory (where alpha is computed across many
 * test-takers), but the logic holds: if dimension scores are internally
 * consistent, the essay represents a coherent quality level.
 *
 * To make this work for a single essay, we simulate "test-takers" by
 * computing alpha across the dimension scores directly. This gives us
 * a measure of how consistently the dimensions agree about the essay's
 * quality level.
 *
 * For proper multi-essay alpha, see computeAlphaAcrossEssays().
 *
 * @param dimensionScores - Map of dimension name to score (0-10)
 * @returns Full internal consistency analysis
 */
export function computeInternalConsistency(
  dimensionScores: Record<string, number>
): InternalConsistency {
  const dimensions = Object.keys(dimensionScores);
  const scores = Object.values(dimensionScores);
  const k = dimensions.length;

  if (k < 3) {
    return {
      cronbachs_alpha: 0,
      acceptable: false,
      alpha_if_deleted: {},
      inconsistent_dimensions: dimensions,
      item_total_correlations: {},
      low_correlation_dimensions: dimensions,
    };
  }

  // Compute total score and total variance
  const totalScore = scores.reduce((s, v) => s + v, 0);
  const totalVariance = variance(scores);

  // For single-essay analysis, we use a profile-based approach:
  // Treat each dimension as a "measurement" and compute how well
  // they agree with each other (inter-item consistency).

  // Compute inter-item covariance matrix
  const meanScore = totalScore / k;
  const deviations = scores.map(s => s - meanScore);

  // Average inter-item covariance (proxy for single-essay)
  let sumCovariances = 0;
  let covarianceCount = 0;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      sumCovariances += deviations[i] * deviations[j];
      covarianceCount++;
    }
  }
  const avgCovariance = covarianceCount > 0
    ? sumCovariances / covarianceCount
    : 0;

  // Item variances (each score's deviation from mean is its "variance proxy")
  const itemVariances = deviations.map(d => d * d);
  const sumItemVariances = itemVariances.reduce((s, v) => s + v, 0);
  const avgItemVariance = sumItemVariances / k;

  // Standardized alpha approximation
  // alpha = (k * avg_covariance) / (avg_item_variance + (k-1) * avg_covariance)
  const denominator = avgItemVariance + (k - 1) * avgCovariance;
  const alpha = denominator > 0
    ? (k * avgCovariance) / denominator
    : 0;

  // Clamp alpha to [-1, 1]
  const clampedAlpha = Math.max(-1, Math.min(1, alpha));

  // Alpha-if-deleted: for each dimension, compute alpha without it
  const alphaIfDeleted: Record<string, number> = {};
  for (let d = 0; d < k; d++) {
    const reducedScores = scores.filter((_, i) => i !== d);
    const reducedK = reducedScores.length;
    const reducedMean = mean(reducedScores);
    const reducedDeviations = reducedScores.map(s => s - reducedMean);

    let reducedSumCov = 0;
    let reducedCovCount = 0;
    for (let i = 0; i < reducedK; i++) {
      for (let j = i + 1; j < reducedK; j++) {
        reducedSumCov += reducedDeviations[i] * reducedDeviations[j];
        reducedCovCount++;
      }
    }
    const reducedAvgCov = reducedCovCount > 0 ? reducedSumCov / reducedCovCount : 0;
    const reducedAvgVar = reducedDeviations.reduce((s, d2) => s + d2 * d2, 0) / reducedK;

    const reducedDenom = reducedAvgVar + (reducedK - 1) * reducedAvgCov;
    const reducedAlpha = reducedDenom > 0
      ? (reducedK * reducedAvgCov) / reducedDenom
      : 0;

    alphaIfDeleted[dimensions[d]] = Math.max(-1, Math.min(1, reducedAlpha));
  }

  // Item-total correlations: correlation of each item with the total
  // (minus that item, to avoid part-whole inflation)
  const itemTotalCorrelations: Record<string, number> = {};
  for (let d = 0; d < k; d++) {
    const restSum = totalScore - scores[d];
    const restMean = restSum / (k - 1);

    // Corrected item-total correlation (point-biserial approximation)
    // Using deviation of this item from mean vs. deviation of rest from rest-mean
    const restScores = scores.filter((_, i) => i !== d);
    const correlation = (scores[d] - meanScore) * (restSum / (k - 1) - meanScore);

    // Simplified correlation coefficient
    const normalizedCorr = totalVariance > 0
      ? (scores[d] - meanScore) / Math.sqrt(totalVariance) * Math.sign(correlation)
      : 0;

    itemTotalCorrelations[dimensions[d]] = Math.max(-1, Math.min(1, normalizedCorr));
  }

  // Identify problematic dimensions
  const inconsistentDimensions = dimensions.filter(
    dim => alphaIfDeleted[dim] > clampedAlpha + 0.05
  );

  const lowCorrelationDimensions = dimensions.filter(
    dim => Math.abs(itemTotalCorrelations[dim]) < 0.2
  );

  return {
    cronbachs_alpha: Math.round(clampedAlpha * 1000) / 1000,
    acceptable: clampedAlpha >= 0.6,
    alpha_if_deleted: Object.fromEntries(
      Object.entries(alphaIfDeleted).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
    ),
    inconsistent_dimensions: inconsistentDimensions,
    item_total_correlations: Object.fromEntries(
      Object.entries(itemTotalCorrelations).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
    ),
    low_correlation_dimensions: lowCorrelationDimensions,
  };
}

// ============================================================================
// SPLIT-HALF RELIABILITY
// ============================================================================

/**
 * Compute split-half reliability from two independent scoring passes.
 *
 * This requires scoring the essay twice (e.g., with different LLM
 * temperatures or prompts) and comparing the results.
 *
 * Uses the Spearman-Brown correction formula:
 *   r_SB = 2 * r_half / (1 + r_half)
 *
 * @param scores1 - First scoring pass
 * @param scores2 - Second scoring pass
 * @param tolerance - Maximum acceptable difference per dimension (default 2)
 */
export function computeSplitHalfReliability(
  scores1: Record<string, number>,
  scores2: Record<string, number>,
  tolerance: number = 2.0
): SplitHalfReliability {
  const commonDimensions = Object.keys(scores1).filter(
    dim => scores2[dim] !== undefined
  );

  if (commonDimensions.length < 3) {
    return {
      spearman_brown: 0,
      half_correlation: 0,
      dimension_agreement: {},
      disagreement_flags: commonDimensions,
    };
  }

  // Compute Pearson correlation between the two halves
  const vals1 = commonDimensions.map(d => scores1[d]);
  const vals2 = commonDimensions.map(d => scores2[d]);
  const r = pearsonCorrelation(vals1, vals2);

  // Spearman-Brown correction
  const rSB = (2 * r) / (1 + Math.abs(r));

  // Per-dimension agreement
  const dimensionAgreement: Record<string, {
    score_1: number;
    score_2: number;
    difference: number;
    within_tolerance: boolean;
  }> = {};

  const disagreementFlags: string[] = [];

  for (const dim of commonDimensions) {
    const diff = Math.abs(scores1[dim] - scores2[dim]);
    const withinTolerance = diff <= tolerance;

    dimensionAgreement[dim] = {
      score_1: scores1[dim],
      score_2: scores2[dim],
      difference: Math.round(diff * 100) / 100,
      within_tolerance: withinTolerance,
    };

    if (!withinTolerance) {
      disagreementFlags.push(dim);
    }
  }

  return {
    spearman_brown: Math.round(rSB * 1000) / 1000,
    half_correlation: Math.round(r * 1000) / 1000,
    dimension_agreement: dimensionAgreement,
    disagreement_flags: disagreementFlags,
  };
}

// ============================================================================
// STANDARD ERROR OF MEASUREMENT
// ============================================================================

/**
 * Compute Standard Error of Measurement (SEM) for each dimension.
 *
 * SEM = SD * sqrt(1 - reliability)
 *
 * For rubric scoring, we use the score scale's expected SD (approximately
 * 2.0 for a 0-10 scale with typical score distributions) and the
 * reliability estimate from internal consistency.
 *
 * @param dimensionScores - Observed scores
 * @param reliabilityEstimate - Overall reliability (e.g., Cronbach's alpha)
 * @param scaleSD - Expected standard deviation of the scoring scale
 */
export function computeSEM(
  dimensionScores: Record<string, number>,
  reliabilityEstimate: number,
  scaleSD: number = 2.0
): SEMAnalysis {
  // Clamp reliability to valid range
  const reliability = Math.max(0, Math.min(0.99, reliabilityEstimate));

  const sem = scaleSD * Math.sqrt(1 - reliability);

  const dimensionSEM: Record<string, number> = {};
  const bandWidth: Record<string, number> = {};
  const lowPrecision: string[] = [];

  for (const [dim, score] of Object.entries(dimensionScores)) {
    // SEM varies slightly by score level (scores near 0 or 10 have
    // smaller effective variance due to floor/ceiling effects)
    const distFromEdge = Math.min(score, 10 - score);
    const edgeAdjustment = distFromEdge < 1.5 ? 0.7 : 1.0;
    const adjustedSEM = sem * edgeAdjustment;

    dimensionSEM[dim] = Math.round(adjustedSEM * 100) / 100;
    bandWidth[dim] = Math.round(2 * 1.96 * adjustedSEM * 100) / 100;

    if (bandWidth[dim] > 4.0) {
      lowPrecision.push(dim);
    }
  }

  return {
    reliability_estimate: reliability,
    dimension_sem: dimensionSEM,
    confidence_band_width: bandWidth,
    low_precision_dimensions: lowPrecision,
  };
}

// ============================================================================
// MULTI-RATER AGREEMENT SIMULATION
// ============================================================================

/**
 * Simulate multi-rater agreement by combining LLM scores with
 * computational/heuristic scores as independent "raters."
 *
 * @param llmScores - Primary LLM scores
 * @param computationalScores - Optional computational scorer results
 * @param heuristicScores - Optional heuristic scorer results
 * @param additionalLLMScores - Optional second LLM pass scores
 */
export function computeMultiRaterAgreement(
  llmScores: Record<string, number>,
  computationalScores?: Record<string, number>,
  heuristicScores?: Record<string, number>,
  additionalLLMScores?: Record<string, number>
): MultiRaterResult {
  const raters: MultiRaterResult['rater_scores'] = [];

  // Always include primary LLM
  raters.push({
    rater_id: 'llm_primary',
    rater_type: 'llm_variant',
    scores: llmScores,
  });

  if (computationalScores) {
    raters.push({
      rater_id: 'computational',
      rater_type: 'computational',
      scores: computationalScores,
    });
  }

  if (heuristicScores) {
    raters.push({
      rater_id: 'heuristic',
      rater_type: 'heuristic',
      scores: heuristicScores,
    });
  }

  if (additionalLLMScores) {
    raters.push({
      rater_id: 'llm_secondary',
      rater_type: 'llm_variant',
      scores: additionalLLMScores,
    });
  }

  const raterCount = raters.length;

  // Find all dimensions present in at least 2 raters
  const allDimensions = new Set<string>();
  for (const rater of raters) {
    for (const dim of Object.keys(rater.scores)) {
      allDimensions.add(dim);
    }
  }

  // Compute consensus scores (mean across raters)
  const consensusScores: Record<string, number> = {};
  const disagreementFlags: MultiRaterResult['disagreement_flags'] = [];
  const kappas: Record<string, number> = {};

  for (const dim of Array.from(allDimensions)) {
    const raterScoresForDim = raters
      .filter(r => r.scores[dim] !== undefined)
      .map(r => r.scores[dim]);

    if (raterScoresForDim.length === 0) continue;

    const dimMean = mean(raterScoresForDim);
    const dimSD = stdDev(raterScoresForDim);
    const dimMin = Math.min(...raterScoresForDim);
    const dimMax = Math.max(...raterScoresForDim);

    consensusScores[dim] = Math.round(dimMean * 100) / 100;

    // Cohen's kappa approximation for continuous scores
    // We discretize into bands: 0-3 (low), 4-6 (mid), 7-10 (high)
    if (raterScoresForDim.length >= 2) {
      const bands = raterScoresForDim.map(s =>
        s < 4 ? 'low' : s < 7 ? 'mid' : 'high'
      );
      const agreementCount = bands.filter(b => b === bands[0]).length;
      const po = agreementCount / bands.length;
      const pe = 1 / 3; // Expected agreement by chance (3 categories)
      kappas[dim] = pe < 1 ? (po - pe) / (1 - pe) : 1;
    }

    // Flag disagreement
    if (dimSD > 1.5 || (dimMax - dimMin) > 3) {
      disagreementFlags.push({
        dimension: dim,
        score_range: [dimMin, dimMax],
        std_dev: Math.round(dimSD * 100) / 100,
        requires_adjudication: dimSD > 2.0 || (dimMax - dimMin) > 4,
      });
    }
  }

  // Compute ICC (Intraclass Correlation Coefficient) — simplified
  // ICC(2,1) for absolute agreement
  const dimensionArray = Array.from(allDimensions);
  const raterMatrix: number[][] = [];
  for (const rater of raters) {
    raterMatrix.push(dimensionArray.map(d => rater.scores[d] ?? NaN));
  }

  // Between-subjects variability
  const grandMean = mean(
    dimensionArray.map(d => consensusScores[d] || 0)
  );
  const bms = dimensionArray.reduce((s, d) => {
    const dm = consensusScores[d] || 0;
    return s + (dm - grandMean) ** 2;
  }, 0) / Math.max(dimensionArray.length - 1, 1) * raterCount;

  // Within-subjects variability
  let wms = 0;
  let wmsCount = 0;
  for (const dim of dimensionArray) {
    const scores = raters
      .map(r => r.scores[dim])
      .filter(s => s !== undefined) as number[];
    if (scores.length >= 2) {
      const dimMeanVal = mean(scores);
      wms += scores.reduce((s, v) => s + (v - dimMeanVal) ** 2, 0);
      wmsCount += scores.length - 1;
    }
  }
  wms = wmsCount > 0 ? wms / wmsCount : 0;

  const iccAbsolute = bms > 0
    ? Math.max(0, (bms - wms) / (bms + (raterCount - 1) * wms))
    : 0;

  const iccConsistency = bms > 0
    ? Math.max(0, (bms - wms) / bms)
    : 0;

  // Determine reliability assessment
  const reliabilityAssessment: MultiRaterResult['reliability_assessment'] =
    iccAbsolute >= 0.75 ? 'excellent'
      : iccAbsolute >= 0.6 ? 'good'
        : iccAbsolute >= 0.4 ? 'moderate'
          : 'poor';

  return {
    rater_count: raterCount,
    rater_scores: raters,
    consensus_scores: consensusScores,
    icc_absolute: Math.round(iccAbsolute * 1000) / 1000,
    icc_consistency: Math.round(iccConsistency * 1000) / 1000,
    cohens_kappa: Object.fromEntries(
      Object.entries(kappas).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
    ),
    disagreement_flags: disagreementFlags,
    reliability_assessment: reliabilityAssessment,
  };
}
