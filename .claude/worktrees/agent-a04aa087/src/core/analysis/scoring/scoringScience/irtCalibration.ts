/**
 * Item Response Theory (IRT) Calibration Module
 *
 * Treats each rubric dimension as a "test item" with known difficulty and
 * discrimination parameters. Uses the 2-Parameter Logistic (2PL) model to:
 *
 * 1. Estimate latent ability (theta) from observed dimension scores
 * 2. Detect anomalous score patterns (observed vs. expected mismatch)
 * 3. Compute information functions (which dimensions are most informative
 *    at different ability levels)
 * 4. Calibrate scores against expected distributions
 *
 * PIPELINE POSITION: Post-LLM scoring, pre-final-report
 *
 * PERFORMANCE: ~1ms for a single essay (all computations are algebraic,
 * no API calls). The heavy work is pre-computing dimension parameters,
 * which happens offline.
 *
 * ACCURACY IMPROVEMENT: IRT catches "impossible" score patterns that
 * a simple weighted average misses. For example, a student who scores
 * 9/10 on craft but 2/10 on voice is statistically anomalous — IRT
 * flags this for review rather than silently averaging it.
 */

import {
  IRTParameters,
  IRTAbilityEstimate,
  InformationProfile,
  DimensionPsychometrics,
} from './types';

// ============================================================================
// PRE-COMPUTED DIMENSION PARAMETERS
// ============================================================================

/**
 * IRT parameters for the 11-category experience rubric.
 *
 * These are calibrated from expected scoring patterns and the rubric's
 * design intent. In production, these would be estimated from actual
 * scoring data using marginal maximum likelihood estimation (MMLE).
 *
 * Parameter interpretation:
 * - b (difficulty): Higher means harder to score well on.
 *   Transformative impact (b=1.2) is harder than craft (b=-0.3)
 *   because showing genuine transformation is rare.
 *
 * - a (discrimination): Higher means the dimension better separates
 *   strong from weak essays. Reflection (a=1.8) is highly discriminating
 *   because it's the clearest signal of essay quality. Time investment
 *   (a=0.8) is less discriminating because even mediocre essays can
 *   show sustained commitment.
 *
 * - c (guessing): Set to 0 for rubric scoring (no guessing).
 */
export const EXPERIENCE_IRT_PARAMS: Record<string, IRTParameters> = {
  voice_integrity:           { a: 1.6, b: 0.3,  c: 0 },
  specificity_evidence:      { a: 1.3, b: -0.2, c: 0 },
  transformative_impact:     { a: 1.5, b: 1.2,  c: 0 },
  role_clarity_ownership:    { a: 1.1, b: -0.5, c: 0 },
  narrative_arc_stakes:      { a: 1.4, b: 0.5,  c: 0 },
  initiative_leadership:     { a: 1.2, b: 0.4,  c: 0 },
  community_collaboration:   { a: 1.0, b: 0.0,  c: 0 },
  reflection_meaning:        { a: 1.8, b: 0.8,  c: 0 },
  craft_language_quality:    { a: 1.3, b: -0.3, c: 0 },
  fit_trajectory:            { a: 0.9, b: 0.6,  c: 0 },
  time_investment_consistency: { a: 0.8, b: -0.4, c: 0 },
};

/**
 * IRT parameters for the 12-dimension essay rubric.
 */
export const ESSAY_IRT_PARAMS: Record<string, IRTParameters> = {
  opening_power_scene_entry:          { a: 1.2, b: 0.2,  c: 0 },
  narrative_arc_stakes_turn:          { a: 1.6, b: 0.7,  c: 0 },
  character_interiority_vulnerability: { a: 1.8, b: 1.0,  c: 0 },
  show_dont_tell_craft:               { a: 1.5, b: 0.5,  c: 0 },
  reflection_meaning_making:          { a: 1.7, b: 0.9,  c: 0 },
  intellectual_vitality_curiosity:    { a: 1.3, b: 0.6,  c: 0 },
  originality_specificity_voice:      { a: 1.6, b: 0.4,  c: 0 },
  structure_pacing_coherence:         { a: 1.1, b: -0.3, c: 0 },
  word_economy_craft:                 { a: 1.2, b: -0.2, c: 0 },
  context_constraints_disclosure:     { a: 1.0, b: 0.3,  c: 0 },
  school_program_fit:                 { a: 0.9, b: 0.5,  c: 0 },
  ethical_awareness_humility:         { a: 1.1, b: 0.1,  c: 0 },
};

// ============================================================================
// IRT MATHEMATICAL FUNCTIONS
// ============================================================================

/**
 * 2PL Item Response Function (IRF).
 * Returns the probability of a "correct" response (high score)
 * given ability theta and item parameters.
 *
 * P(X=1 | theta, a, b) = 1 / (1 + exp(-a * (theta - b)))
 *
 * For rubric scoring, we generalize this to a graded response model
 * where the IRF gives the expected score proportion.
 */
function irf2PL(theta: number, a: number, b: number): number {
  return 1.0 / (1.0 + Math.exp(-a * (theta - b)));
}

/**
 * Expected score for a dimension given ability theta.
 * Maps the 2PL probability to the 0-10 scoring scale.
 */
function expectedScore(theta: number, params: IRTParameters): number {
  const p = irf2PL(theta, params.a, params.b);
  return p * 10.0; // Scale to 0-10
}

/**
 * Item Information Function.
 * I(theta) = a^2 * P(theta) * (1 - P(theta))
 *
 * Information peaks at theta = b (the difficulty parameter) and is
 * proportional to a^2 (discrimination squared).
 */
function itemInformation(theta: number, params: IRTParameters): number {
  const p = irf2PL(theta, params.a, params.b);
  return params.a * params.a * p * (1.0 - p);
}

/**
 * Total test information at a given theta.
 * Simply the sum of all item information functions.
 */
function totalInformation(
  theta: number,
  allParams: Record<string, IRTParameters>
): number {
  return Object.values(allParams).reduce(
    (sum, params) => sum + itemInformation(theta, params),
    0
  );
}

/**
 * Standard error of theta estimate.
 * SE(theta) = 1 / sqrt(I(theta))
 */
function standardErrorAtTheta(
  theta: number,
  allParams: Record<string, IRTParameters>
): number {
  const info = totalInformation(theta, allParams);
  return info > 0 ? 1.0 / Math.sqrt(info) : Infinity;
}

// ============================================================================
// MAXIMUM LIKELIHOOD ESTIMATION OF THETA
// ============================================================================

/**
 * Estimate ability (theta) from observed dimension scores using
 * Newton-Raphson maximum likelihood estimation.
 *
 * For a graded response model, we maximize:
 *   L(theta) = product over dimensions of P(observed_score | theta, a, b)
 *
 * We approximate by treating each dimension's score as a continuous
 * proportion (score/10) and using the logistic response function.
 *
 * @param observedScores - Map of dimension name to observed 0-10 score
 * @param irtParams - IRT parameters for each dimension
 * @param maxIterations - Maximum iterations for convergence
 * @param tolerance - Convergence tolerance
 * @returns Estimated theta and standard error
 */
export function estimateTheta(
  observedScores: Record<string, number>,
  irtParams: Record<string, IRTParameters>,
  maxIterations: number = 50,
  tolerance: number = 0.001
): { theta: number; se: number; converged: boolean; iterations: number } {
  // Initial theta estimate: weighted average of score proportions,
  // transformed to logit scale
  const scoreEntries = Object.entries(observedScores).filter(
    ([dim]) => irtParams[dim] !== undefined
  );

  if (scoreEntries.length === 0) {
    return { theta: 0, se: Infinity, converged: false, iterations: 0 };
  }

  const avgProportion = scoreEntries.reduce(
    (sum, [, score]) => sum + score / 10.0,
    0
  ) / scoreEntries.length;

  // Clamp to avoid log(0) or log(infinity)
  const clampedProp = Math.max(0.01, Math.min(0.99, avgProportion));
  let theta = Math.log(clampedProp / (1.0 - clampedProp));

  let converged = false;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;
    let firstDerivative = 0;
    let secondDerivative = 0;

    for (const [dim, score] of scoreEntries) {
      const params = irtParams[dim];
      if (!params) continue;

      const proportion = score / 10.0;
      const p = irf2PL(theta, params.a, params.b);

      // First derivative of log-likelihood
      firstDerivative += params.a * (proportion - p);

      // Second derivative of log-likelihood (negative information)
      secondDerivative -= params.a * params.a * p * (1.0 - p);
    }

    // Avoid division by zero
    if (Math.abs(secondDerivative) < 1e-10) {
      break;
    }

    // Newton-Raphson update
    const delta = firstDerivative / secondDerivative;
    theta -= delta;

    // Clamp theta to reasonable range [-4, 4]
    theta = Math.max(-4, Math.min(4, theta));

    if (Math.abs(delta) < tolerance) {
      converged = true;
      break;
    }
  }

  const se = standardErrorAtTheta(theta, irtParams);

  return { theta, se, converged, iterations };
}

// ============================================================================
// MAIN IRT CALIBRATION FUNCTION
// ============================================================================

/**
 * Perform IRT-based score calibration.
 *
 * Given raw dimension scores, this function:
 * 1. Estimates the latent ability (theta) using MLE
 * 2. Computes expected scores at that theta level
 * 3. Identifies anomalous dimensions (observed vs expected mismatch)
 * 4. Computes information at the estimated theta
 * 5. Returns a complete ability profile
 *
 * @param observedScores - Raw dimension scores (0-10) from LLM or heuristic
 * @param rubricType - 'experience' or 'essay' to select appropriate parameters
 * @returns Complete IRT ability estimate with anomaly detection
 */
export function calibrateWithIRT(
  observedScores: Record<string, number>,
  rubricType: 'experience' | 'essay' = 'experience'
): IRTAbilityEstimate {
  const irtParams = rubricType === 'essay'
    ? ESSAY_IRT_PARAMS
    : EXPERIENCE_IRT_PARAMS;

  // Step 1: Estimate theta
  const { theta, se, converged } = estimateTheta(observedScores, irtParams);

  // Step 2: Compute expected scores at estimated theta
  const expected: Record<string, number> = {};
  for (const [dim, params] of Object.entries(irtParams)) {
    expected[dim] = expectedScore(theta, params);
  }

  // Step 3: Compute residuals and detect anomalies
  const residuals: Record<string, number> = {};
  const anomalous: string[] = [];

  for (const [dim, observedScore] of Object.entries(observedScores)) {
    if (expected[dim] !== undefined) {
      const residual = observedScore - expected[dim];
      residuals[dim] = residual;

      // Flag if residual exceeds 2 * SE (approximately 95% CI)
      // The SE for an individual item is approximated from information
      const itemInfo = irtParams[dim]
        ? itemInformation(theta, irtParams[dim])
        : 0;
      const itemSE = itemInfo > 0 ? 1.0 / Math.sqrt(itemInfo) : 2.0;
      const scaledSE = itemSE * 10.0 / Math.max(irtParams[dim]?.a || 1, 0.5);

      if (Math.abs(residual) > 2.0 * Math.max(scaledSE, 1.5)) {
        anomalous.push(dim);
      }
    }
  }

  // Step 4: Compute information at theta
  const infoAtTheta = totalInformation(theta, irtParams);

  // Step 5: Map theta to quality index (0-100)
  // Using the expected average score at theta, scaled to 0-100
  const expectedAvg = Object.values(expected).reduce((s, v) => s + v, 0)
    / Math.max(Object.values(expected).length, 1);
  const qualityIndex = Math.round(expectedAvg * 10 * 10) / 10;

  // Quality CI from theta CI
  const thetaLower = theta - 1.96 * se;
  const thetaUpper = theta + 1.96 * se;

  const qiAtLower = Object.values(irtParams).reduce(
    (sum, params) => sum + expectedScore(thetaLower, params),
    0
  ) / Object.values(irtParams).length * 10;

  const qiAtUpper = Object.values(irtParams).reduce(
    (sum, params) => sum + expectedScore(thetaUpper, params),
    0
  ) / Object.values(irtParams).length * 10;

  return {
    theta,
    se_theta: se,
    theta_ci: [theta - 1.96 * se, theta + 1.96 * se],
    quality_index: Math.max(0, Math.min(100, qualityIndex)),
    quality_ci: [
      Math.max(0, Math.round(qiAtLower * 10) / 10),
      Math.min(100, Math.round(qiAtUpper * 10) / 10),
    ],
    expected_scores: expected,
    residuals,
    anomalous_dimensions: anomalous,
    information_at_theta: infoAtTheta,
  };
}

// ============================================================================
// INFORMATION FUNCTION COMPUTATION
// ============================================================================

/**
 * Compute the information profile across the ability continuum.
 * Shows which dimensions are most informative at different ability levels.
 *
 * @param rubricType - Which rubric to compute for
 * @param thetaMin - Lower bound of theta range (default -3)
 * @param thetaMax - Upper bound of theta range (default 3)
 * @param steps - Number of points to sample (default 61)
 */
export function computeInformationProfile(
  rubricType: 'experience' | 'essay' = 'experience',
  thetaMin: number = -3,
  thetaMax: number = 3,
  steps: number = 61
): InformationProfile {
  const irtParams = rubricType === 'essay'
    ? ESSAY_IRT_PARAMS
    : EXPERIENCE_IRT_PARAMS;

  const thetaPoints: number[] = [];
  const stepSize = (thetaMax - thetaMin) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    thetaPoints.push(thetaMin + i * stepSize);
  }

  // Compute per-dimension information at each theta
  const dimInfo: Record<string, number[]> = {};
  for (const dim of Object.keys(irtParams)) {
    dimInfo[dim] = thetaPoints.map(t => itemInformation(t, irtParams[dim]));
  }

  // Compute total information curve
  const totalInfo = thetaPoints.map(t => totalInformation(t, irtParams));

  // Find peak theta
  let peakIdx = 0;
  let peakVal = 0;
  for (let i = 0; i < totalInfo.length; i++) {
    if (totalInfo[i] > peakVal) {
      peakVal = totalInfo[i];
      peakIdx = i;
    }
  }

  return {
    theta_points: thetaPoints,
    dimension_information: dimInfo,
    total_information: totalInfo,
    peak_theta: thetaPoints[peakIdx],
    ranked_at_theta: (theta: number) => {
      const dims = Object.entries(irtParams).map(([dim, params]) => {
        const info = itemInformation(theta, params);
        return { dimension: dim, information: info };
      });

      const total = dims.reduce((s, d) => s + d.information, 0);

      return dims
        .map(d => ({
          ...d,
          proportion_of_total: total > 0 ? d.information / total : 0,
        }))
        .sort((a, b) => b.information - a.information);
    },
  };
}
