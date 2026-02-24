/**
 * Bayesian Score Updating Module
 *
 * Computes prior score distributions from computational signals (pre-LLM),
 * then updates with observed LLM scores to produce calibrated posteriors.
 *
 * The key insight: before the LLM even runs, we can estimate likely score
 * ranges from text features (readability, narrative structure, vocabulary,
 * etc.). These priors serve three purposes:
 *
 * 1. PRE-SCREENING: If the prior is very confident, we may skip LLM scoring
 * 2. CALIBRATION: If the LLM diverges wildly from the prior, flag for review
 * 3. IMPROVEMENT: Use prior as context in the LLM prompt ("based on text
 *    features, this essay likely scores X on dimension Y")
 *
 * MATHEMATICAL FOUNDATION:
 * - Prior: N(mu_prior, sigma_prior^2) from computational signals
 * - Likelihood: N(llm_score, sigma_llm^2) from LLM confidence
 * - Posterior: N(mu_post, sigma_post^2) via conjugate update
 *
 * mu_post = (mu_prior * sigma_llm^2 + llm_score * sigma_prior^2)
 *           / (sigma_prior^2 + sigma_llm^2)
 *
 * sigma_post^2 = (sigma_prior^2 * sigma_llm^2)
 *                / (sigma_prior^2 + sigma_llm^2)
 *
 * PIPELINE POSITION: Pre-LLM (prior computation) and Post-LLM (updating)
 * PERFORMANCE: < 1ms per essay (all algebraic operations)
 */

import {
  ScorePrior,
  ScorePosterior,
  PreScreenResult,
} from './types';

// ============================================================================
// COMPUTATIONAL SIGNAL DEFINITIONS
// ============================================================================

/**
 * Computational signals that can inform priors.
 * These map text features to expected score ranges per dimension.
 */
export interface ComputationalSignals {
  /** Word count of the essay/description */
  word_count: number;

  /** Flesch-Kincaid readability score */
  readability_score?: number;

  /** Passive voice ratio (0-1) */
  passive_ratio: number;

  /** Number of concrete numbers/metrics found */
  concrete_numbers_count: number;

  /** Number of temporal markers (narrative structure) */
  temporal_markers_count: number;

  /** Whether stakes/tension indicators are present */
  has_stakes_indicators: boolean;

  /** Number of named individuals mentioned */
  named_individuals_count: number;

  /** Whether before/after comparison is present */
  has_before_after: boolean;

  /** Reflection quality heuristic score (0-10) */
  reflection_depth_heuristic: number;

  /** Sentence variety score (0-10) */
  sentence_variety: number;

  /** Buzzword count */
  buzzword_count: number;

  /** Whether credit is given to others */
  credit_given: boolean;

  /** Insight depth score from heuristic (0-10) */
  insight_depth: number;

  /** Authenticity score from heuristic detector (0-10) */
  authenticity_score?: number;
}

// ============================================================================
// SIGNAL-TO-PRIOR MAPPING FUNCTIONS
// ============================================================================

/**
 * Signal weight configuration for each dimension.
 * Defines which computational signals inform which dimensions
 * and how strongly.
 */
const SIGNAL_WEIGHTS: Record<string, Array<{
  signal: keyof ComputationalSignals;
  weight: number;
  /** Transform signal value to 0-10 score contribution */
  transform: (value: number | boolean) => number;
}>> = {
  voice_integrity: [
    { signal: 'passive_ratio', weight: 0.25,
      transform: (v) => Math.max(0, 10 - (v as number) * 15) },
    { signal: 'buzzword_count', weight: 0.20,
      transform: (v) => Math.max(0, 10 - (v as number) * 2) },
    { signal: 'sentence_variety', weight: 0.25,
      transform: (v) => v as number },
    { signal: 'authenticity_score', weight: 0.30,
      transform: (v) => (v as number) || 5 },
  ],
  specificity_evidence: [
    { signal: 'concrete_numbers_count', weight: 0.35,
      transform: (v) => Math.min(10, (v as number) * 2.5) },
    { signal: 'has_before_after', weight: 0.25,
      transform: (v) => (v as boolean) ? 7 : 3 },
    { signal: 'word_count', weight: 0.20,
      transform: (v) => Math.min(10, (v as number) / 60) },
    { signal: 'insight_depth', weight: 0.20,
      transform: (v) => v as number },
  ],
  transformative_impact: [
    { signal: 'has_before_after', weight: 0.30,
      transform: (v) => (v as boolean) ? 7 : 2 },
    { signal: 'reflection_depth_heuristic', weight: 0.35,
      transform: (v) => v as number },
    { signal: 'insight_depth', weight: 0.35,
      transform: (v) => v as number },
  ],
  narrative_arc_stakes: [
    { signal: 'temporal_markers_count', weight: 0.30,
      transform: (v) => Math.min(10, (v as number) * 2) },
    { signal: 'has_stakes_indicators', weight: 0.35,
      transform: (v) => (v as boolean) ? 7 : 2 },
    { signal: 'word_count', weight: 0.15,
      transform: (v) => Math.min(10, (v as number) / 50) },
    { signal: 'sentence_variety', weight: 0.20,
      transform: (v) => v as number },
  ],
  reflection_meaning: [
    { signal: 'reflection_depth_heuristic', weight: 0.40,
      transform: (v) => v as number },
    { signal: 'insight_depth', weight: 0.35,
      transform: (v) => v as number },
    { signal: 'has_before_after', weight: 0.25,
      transform: (v) => (v as boolean) ? 6 : 3 },
  ],
  craft_language_quality: [
    { signal: 'passive_ratio', weight: 0.25,
      transform: (v) => Math.max(0, 10 - (v as number) * 12) },
    { signal: 'sentence_variety', weight: 0.30,
      transform: (v) => v as number },
    { signal: 'buzzword_count', weight: 0.20,
      transform: (v) => Math.max(0, 10 - (v as number) * 2) },
    { signal: 'readability_score', weight: 0.25,
      transform: (v) => Math.min(10, Math.max(0, ((v as number) || 50) / 10)) },
  ],
  community_collaboration: [
    { signal: 'named_individuals_count', weight: 0.35,
      transform: (v) => Math.min(10, (v as number) * 3) },
    { signal: 'credit_given', weight: 0.35,
      transform: (v) => (v as boolean) ? 7 : 2 },
    { signal: 'word_count', weight: 0.15,
      transform: (v) => Math.min(10, (v as number) / 60) },
    { signal: 'insight_depth', weight: 0.15,
      transform: (v) => v as number },
  ],
  initiative_leadership: [
    { signal: 'concrete_numbers_count', weight: 0.25,
      transform: (v) => Math.min(10, (v as number) * 2) },
    { signal: 'has_stakes_indicators', weight: 0.30,
      transform: (v) => (v as boolean) ? 7 : 3 },
    { signal: 'has_before_after', weight: 0.25,
      transform: (v) => (v as boolean) ? 7 : 3 },
    { signal: 'insight_depth', weight: 0.20,
      transform: (v) => v as number },
  ],
  role_clarity_ownership: [
    { signal: 'concrete_numbers_count', weight: 0.30,
      transform: (v) => Math.min(10, (v as number) * 2.5) },
    { signal: 'passive_ratio', weight: 0.30,
      transform: (v) => Math.max(0, 10 - (v as number) * 15) },
    { signal: 'word_count', weight: 0.20,
      transform: (v) => Math.min(10, (v as number) / 50) },
    { signal: 'insight_depth', weight: 0.20,
      transform: (v) => v as number },
  ],
  fit_trajectory: [
    { signal: 'has_before_after', weight: 0.25,
      transform: (v) => (v as boolean) ? 6 : 3 },
    { signal: 'temporal_markers_count', weight: 0.25,
      transform: (v) => Math.min(10, (v as number) * 2) },
    { signal: 'reflection_depth_heuristic', weight: 0.25,
      transform: (v) => v as number },
    { signal: 'word_count', weight: 0.25,
      transform: (v) => Math.min(10, (v as number) / 60) },
  ],
  time_investment_consistency: [
    { signal: 'temporal_markers_count', weight: 0.35,
      transform: (v) => Math.min(10, (v as number) * 2.5) },
    { signal: 'concrete_numbers_count', weight: 0.30,
      transform: (v) => Math.min(10, (v as number) * 2) },
    { signal: 'word_count', weight: 0.20,
      transform: (v) => Math.min(10, (v as number) / 50) },
    { signal: 'has_before_after', weight: 0.15,
      transform: (v) => (v as boolean) ? 6 : 3 },
  ],
};

// ============================================================================
// PRIOR COMPUTATION
// ============================================================================

/**
 * Compute priors for all dimensions from computational signals.
 *
 * Each prior is a normal distribution N(mu, sigma^2) where:
 * - mu is the weighted average of transformed signal values
 * - sigma reflects how many signals were available and their agreement
 *
 * @param signals - Extracted computational features of the text
 * @param dimensions - Which dimensions to compute priors for
 * @returns Map of dimension name to prior distribution
 */
export function computePriors(
  signals: ComputationalSignals,
  dimensions?: string[]
): Record<string, ScorePrior> {
  const priors: Record<string, ScorePrior> = {};
  const targetDimensions = dimensions || Object.keys(SIGNAL_WEIGHTS);

  for (const dim of targetDimensions) {
    const weights = SIGNAL_WEIGHTS[dim];

    if (!weights || weights.length === 0) {
      // No signal mapping for this dimension — use uninformative prior
      priors[dim] = {
        dimension: dim,
        mu: 5.0,
        sigma: 3.0,
        source: 'uniform',
        signals: [],
      };
      continue;
    }

    // Compute weighted score from signals
    let weightedSum = 0;
    let totalWeight = 0;
    const signalDetails: ScorePrior['signals'] = [];
    const transformedValues: number[] = [];

    for (const entry of weights) {
      const rawValue = signals[entry.signal];
      if (rawValue === undefined || rawValue === null) continue;

      const transformed = entry.transform(rawValue);
      const clamped = Math.max(0, Math.min(10, transformed));

      weightedSum += clamped * entry.weight;
      totalWeight += entry.weight;
      transformedValues.push(clamped);

      signalDetails.push({
        signal_name: entry.signal,
        signal_value: typeof rawValue === 'boolean' ? (rawValue ? 1 : 0) : rawValue,
        weight: entry.weight,
      });
    }

    if (totalWeight === 0) {
      priors[dim] = {
        dimension: dim,
        mu: 5.0,
        sigma: 3.0,
        source: 'uniform',
        signals: [],
      };
      continue;
    }

    const mu = weightedSum / totalWeight;

    // Sigma reflects signal agreement — high variance in transformed
    // values means less confidence
    const variance = transformedValues.length > 1
      ? transformedValues.reduce((s, v) => s + (v - mu) ** 2, 0) / transformedValues.length
      : 4.0; // Default moderate uncertainty
    const sigma = Math.max(1.0, Math.min(3.0, Math.sqrt(variance) + 0.5));

    priors[dim] = {
      dimension: dim,
      mu: Math.max(0, Math.min(10, mu)),
      sigma,
      source: 'computational_signal',
      signals: signalDetails,
    };
  }

  return priors;
}

// ============================================================================
// BAYESIAN UPDATING
// ============================================================================

/**
 * Update a prior with an observed LLM score to produce a posterior.
 *
 * Uses conjugate Normal-Normal updating:
 *   mu_post = (mu_prior * sigma_llm^2 + observed * sigma_prior^2)
 *             / (sigma_prior^2 + sigma_llm^2)
 *   sigma_post^2 = (sigma_prior^2 * sigma_llm^2)
 *                  / (sigma_prior^2 + sigma_llm^2)
 *
 * @param prior - Prior distribution from computational signals
 * @param observed - LLM-assigned score (0-10)
 * @param llmConfidence - Confidence of the LLM score (0-1, higher = more precise)
 * @param divergenceThreshold - Flag if |observed - prior_mu| exceeds this many SDs
 */
export function updateWithObservation(
  prior: ScorePrior,
  observed: number,
  llmConfidence: number = 0.85,
  divergenceThreshold: number = 2.0
): ScorePosterior {
  // LLM sigma: lower confidence → wider variance
  // At confidence 1.0, sigma_llm = 0.5 (very tight)
  // At confidence 0.5, sigma_llm = 2.0 (wide)
  const sigmaLLM = 0.5 + (1.0 - llmConfidence) * 3.0;

  const priorVariance = prior.sigma ** 2;
  const llmVariance = sigmaLLM ** 2;

  // Posterior parameters (conjugate normal update)
  const posteriorVariance = (priorVariance * llmVariance) / (priorVariance + llmVariance);
  const posteriorMu = (prior.mu * llmVariance + observed * priorVariance)
    / (priorVariance + llmVariance);
  const posteriorSigma = Math.sqrt(posteriorVariance);

  // Clamp to valid range
  const clampedMu = Math.max(0, Math.min(10, posteriorMu));

  // Compute divergence in standard deviations of the prior
  const divergence = Math.abs(observed - prior.mu) / prior.sigma;

  // Compute shrinkage factor: how much we pulled toward the prior
  // shrinkage = priorVariance / (priorVariance + llmVariance)
  // = 0 when prior is infinitely precise, = 1 when LLM is infinitely precise
  const shrinkage = llmVariance / (priorVariance + llmVariance);

  // 95% credible interval
  const ciLower = Math.max(0, clampedMu - 1.96 * posteriorSigma);
  const ciUpper = Math.min(10, clampedMu + 1.96 * posteriorSigma);

  return {
    dimension: prior.dimension,
    prior,
    observed,
    posterior_mu: Math.round(clampedMu * 100) / 100,
    posterior_sigma: Math.round(posteriorSigma * 100) / 100,
    credible_interval: [
      Math.round(ciLower * 100) / 100,
      Math.round(ciUpper * 100) / 100,
    ],
    divergence: Math.round(divergence * 100) / 100,
    divergence_flagged: divergence > divergenceThreshold,
    shrinkage: Math.round(shrinkage * 100) / 100,
  };
}

/**
 * Update all dimension priors with observed LLM scores.
 *
 * @param priors - Prior distributions from computePriors()
 * @param observedScores - LLM-assigned scores
 * @param confidences - Optional per-dimension LLM confidence values
 * @returns Map of dimension to posterior distribution
 */
export function updateAllDimensions(
  priors: Record<string, ScorePrior>,
  observedScores: Record<string, number>,
  confidences?: Record<string, number>
): Record<string, ScorePosterior> {
  const posteriors: Record<string, ScorePosterior> = {};

  for (const [dim, prior] of Object.entries(priors)) {
    const observed = observedScores[dim];
    if (observed === undefined) continue;

    const confidence = confidences?.[dim] ?? 0.85;
    posteriors[dim] = updateWithObservation(prior, observed, confidence);
  }

  return posteriors;
}

// ============================================================================
// PRE-SCREENING
// ============================================================================

/**
 * Determine whether LLM scoring can be skipped based on computational
 * priors alone.
 *
 * Decision criteria:
 * - All priors must have sigma < 1.5 (high confidence)
 * - Predicted quality index must be in a clear band (not borderline)
 * - At least 70% of signals must be available
 *
 * @param priors - Computed priors for all dimensions
 * @param weights - Dimension weights for quality index computation
 * @param confidenceThreshold - Minimum average prior confidence to skip LLM
 * @returns Pre-screening decision and predicted scores
 */
export function preScreen(
  priors: Record<string, ScorePrior>,
  weights: Record<string, number>,
  confidenceThreshold: number = 1.2
): PreScreenResult {
  const priorEntries = Object.entries(priors);

  // Check how many priors are from actual signals (not uniform)
  const informedPriors = priorEntries.filter(
    ([, p]) => p.source !== 'uniform'
  );
  const signalCoverage = informedPriors.length / Math.max(priorEntries.length, 1);

  // Check average sigma (lower = more confident)
  const avgSigma = priorEntries.reduce(
    (s, [, p]) => s + p.sigma,
    0
  ) / Math.max(priorEntries.length, 1);

  // Compute predicted quality index from priors
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [dim, prior] of priorEntries) {
    const w = weights[dim] || 0;
    weightedSum += prior.mu * w;
    totalWeight += w;
  }
  const predictedQI = totalWeight > 0
    ? Math.round(weightedSum / totalWeight * 10 * 10) / 10
    : 50;

  // Predicted range from sigma
  const predictedRange: [number, number] = [
    Math.max(0, predictedQI - avgSigma * 15),
    Math.min(100, predictedQI + avgSigma * 15),
  ];

  // Decision: skip LLM only if very confident
  const skipLLM = avgSigma < confidenceThreshold
    && signalCoverage >= 0.7
    && (predictedRange[1] - predictedRange[0]) < 25;

  // Identify top contributing signals
  const allSignals: Array<{ signal_name: string; contribution: number }> = [];
  for (const [, prior] of priorEntries) {
    for (const sig of prior.signals) {
      allSignals.push({
        signal_name: sig.signal_name,
        contribution: sig.weight * sig.signal_value,
      });
    }
  }
  allSignals.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const reason = skipLLM
    ? `High confidence from computational signals (avg sigma=${avgSigma.toFixed(2)}, coverage=${Math.round(signalCoverage * 100)}%)`
    : avgSigma >= confidenceThreshold
      ? `Prior uncertainty too high (avg sigma=${avgSigma.toFixed(2)}, threshold=${confidenceThreshold})`
      : signalCoverage < 0.7
        ? `Insufficient signal coverage (${Math.round(signalCoverage * 100)}% < 70%)`
        : `Predicted range too wide (${Math.round(predictedRange[1] - predictedRange[0])} points)`;

  return {
    skip_llm: skipLLM,
    confidence: Math.max(0, Math.min(1, 1 - avgSigma / 3)),
    predicted_range: predictedRange,
    predicted_quality_index: predictedQI,
    reason,
    top_signals: allSignals.slice(0, 5),
  };
}
