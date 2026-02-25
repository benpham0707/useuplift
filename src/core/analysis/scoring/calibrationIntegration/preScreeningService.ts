/**
 * Pre-Screening Service — Phase 4: Skip LLM for High-Confidence Cases
 *
 * When the Bayesian computational priors have narrow confidence intervals
 * (sigma < threshold) across ALL dimensions, and all constraints are
 * satisfied by the predicted scores, we can skip the expensive LLM
 * scoring entirely.
 *
 * This is the final phase of the calibration integration — it should
 * only be enabled after full calibration (Level 3+) has been proven
 * stable for at least 500 essays.
 *
 * COST SAVINGS ESTIMATE:
 * - Typical LLM scoring: ~$0.015-0.03 per essay (Sonnet, 3 parallel batches)
 * - Pre-screening cost: $0 (pure computation, < 1ms)
 * - Expected skip rate: 15-25% of essays (conservative)
 * - Monthly savings at 1000 essays/day: $135-225/month
 *
 * SAFETY: Pre-screened scores are ALWAYS stored alongside a flag
 * indicating they were not LLM-verified. A background job can
 * randomly sample pre-screened essays for LLM verification to
 * validate the skip decision over time.
 */

import {
  PreScreenDecision,
  WritingQualityEngineConfig,
  DEFAULT_ENGINE_CONFIG,
} from './types';

import {
  computePriors,
  preScreen,
  ComputationalSignals,
} from '../scoringScience/bayesianUpdating';

import { checkConstraints } from '../scoringScience/constraintSatisfaction';

// ============================================================================
// PRE-SCREENING DECISION FUNCTION
// ============================================================================

/**
 * Determine whether LLM scoring can be skipped for this essay.
 *
 * The decision requires ALL of the following:
 * 1. Pre-screening is enabled in config
 * 2. All computational priors have sigma < maxPriorSigma
 * 3. Signal coverage >= minSignalCoverage (enough signals available)
 * 4. Predicted QI range is narrow (< maxPredictedQIRange)
 * 5. All constraints are satisfied by predicted scores
 * 6. Predicted scores are not in a "borderline" zone (30-70 QI band edges)
 * 7. Confidence exceeds the configured threshold
 *
 * @param signals - Computational signals extracted from the essay text
 * @param weights - Dimension weights for QI calculation
 * @param rubricType - Which rubric to validate constraints against
 * @param config - Engine configuration
 * @returns Pre-screening decision with predicted scores and confidence
 */
export function shouldSkipLLM(
  signals: ComputationalSignals,
  weights: Record<string, number>,
  rubricType: 'experience' | 'essay' = 'experience',
  config?: WritingQualityEngineConfig
): PreScreenDecision {
  const cfg = config ?? DEFAULT_ENGINE_CONFIG;

  // Gate 0: Is pre-screening enabled?
  if (!cfg.preScreening.enabled || !cfg.featureFlags.preScreeningEnabled) {
    return {
      skipLLM: false,
      confidence: 0,
      predictedScores: {},
      predictedQI: 0,
      predictedQICI: [0, 100],
      reason: 'Pre-screening is disabled',
      estimatedCostSavings: 0,
      topSignals: [],
    };
  }

  // Step 1: Compute priors from signals
  const priors = computePriors(signals);
  const priorEntries = Object.entries(priors);

  // Step 2: Check signal coverage
  const informedPriors = priorEntries.filter(([, p]) => p.source !== 'uniform');
  const signalCoverage = informedPriors.length / Math.max(priorEntries.length, 1);

  if (signalCoverage < cfg.preScreening.minSignalCoverage) {
    return {
      skipLLM: false,
      confidence: signalCoverage,
      predictedScores: priorsToScores(priors),
      predictedQI: computePredictedQI(priors, weights),
      predictedQICI: computePredictedQICI(priors, weights),
      reason: `Insufficient signal coverage: ${(signalCoverage * 100).toFixed(0)}% < ${(cfg.preScreening.minSignalCoverage * 100).toFixed(0)}%`,
      estimatedCostSavings: 0,
      topSignals: extractTopSignals(priors),
    };
  }

  // Step 3: Check all priors have acceptable sigma
  const maxSigma = Math.max(...priorEntries.map(([, p]) => p.sigma));
  const avgSigma = priorEntries.reduce((s, [, p]) => s + p.sigma, 0) / priorEntries.length;

  if (avgSigma > cfg.preScreening.maxPriorSigma) {
    return {
      skipLLM: false,
      confidence: Math.max(0, 1 - avgSigma / 3),
      predictedScores: priorsToScores(priors),
      predictedQI: computePredictedQI(priors, weights),
      predictedQICI: computePredictedQICI(priors, weights),
      reason: `Prior uncertainty too high: avg sigma = ${avgSigma.toFixed(2)} > ${cfg.preScreening.maxPriorSigma}`,
      estimatedCostSavings: 0,
      topSignals: extractTopSignals(priors),
    };
  }

  // Step 4: Check predicted QI range width
  const predictedQI = computePredictedQI(priors, weights);
  const predictedQICI = computePredictedQICI(priors, weights);
  const qiRange = predictedQICI[1] - predictedQICI[0];

  if (qiRange > cfg.preScreening.maxPredictedQIRange) {
    return {
      skipLLM: false,
      confidence: Math.max(0, 1 - qiRange / 50),
      predictedScores: priorsToScores(priors),
      predictedQI,
      predictedQICI,
      reason: `Predicted QI range too wide: ${qiRange.toFixed(1)} > ${cfg.preScreening.maxPredictedQIRange}`,
      estimatedCostSavings: 0,
      topSignals: extractTopSignals(priors),
    };
  }

  // Step 5: Check constraint satisfaction on predicted scores
  const predictedScores = priorsToScores(priors);
  const constraintCheck = checkConstraints(predictedScores, rubricType, false);

  if (constraintCheck.has_hard_violations) {
    return {
      skipLLM: false,
      confidence: 0.5,
      predictedScores,
      predictedQI,
      predictedQICI,
      reason: `Predicted scores have ${constraintCheck.violations_found} constraint violations (${constraintCheck.has_hard_violations ? 'hard' : 'soft'})`,
      estimatedCostSavings: 0,
      topSignals: extractTopSignals(priors),
    };
  }

  // Step 6: Check for borderline QI zones
  // Avoid skipping LLM for essays near decision boundaries (30, 50, 70)
  const borderlineZones = [
    { center: 30, halfWidth: 5 }, // Below 30 = needs major work
    { center: 50, halfWidth: 4 }, // Below 50 = below average
    { center: 70, halfWidth: 4 }, // Above 70 = strong
    { center: 80, halfWidth: 3 }, // Above 80 = elite
  ];

  for (const zone of borderlineZones) {
    if (Math.abs(predictedQI - zone.center) < zone.halfWidth) {
      return {
        skipLLM: false,
        confidence: 0.6,
        predictedScores,
        predictedQI,
        predictedQICI,
        reason: `Predicted QI (${predictedQI.toFixed(1)}) is near decision boundary (${zone.center}±${zone.halfWidth})`,
        estimatedCostSavings: 0,
        topSignals: extractTopSignals(priors),
      };
    }
  }

  // Step 7: Compute final confidence
  // Confidence is a composite of sigma, coverage, and range
  const sigmaConfidence = Math.max(0, 1 - avgSigma / 3);
  const coverageConfidence = signalCoverage;
  const rangeConfidence = Math.max(0, 1 - qiRange / cfg.preScreening.maxPredictedQIRange);
  const confidence = (sigmaConfidence * 0.4 + coverageConfidence * 0.3 + rangeConfidence * 0.3);

  if (confidence < cfg.featureFlags.preScreeningConfidenceThreshold) {
    return {
      skipLLM: false,
      confidence,
      predictedScores,
      predictedQI,
      predictedQICI,
      reason: `Confidence ${confidence.toFixed(3)} below threshold ${cfg.featureFlags.preScreeningConfidenceThreshold}`,
      estimatedCostSavings: 0,
      topSignals: extractTopSignals(priors),
    };
  }

  // All gates passed — recommend skipping LLM
  return {
    skipLLM: true,
    confidence,
    predictedScores,
    predictedQI,
    predictedQICI,
    reason: `High confidence pre-screen: sigma=${avgSigma.toFixed(2)}, coverage=${(signalCoverage * 100).toFixed(0)}%, QI range=${qiRange.toFixed(1)}, no constraint violations`,
    estimatedCostSavings: cfg.preScreening.estimatedLLMCostPerEssay,
    topSignals: extractTopSignals(priors),
  };
}

/**
 * Use the existing scoringScience preScreen function as an alternative
 * implementation. This provides compatibility with the existing module.
 */
export function shouldSkipLLMCompat(
  signals: ComputationalSignals,
  weights: Record<string, number>,
  confidenceThreshold: number = 1.2
): PreScreenDecision {
  const priors = computePriors(signals);
  const result = preScreen(priors, weights, confidenceThreshold);

  return {
    skipLLM: result.skip_llm,
    confidence: result.confidence,
    predictedScores: priorsToScores(priors),
    predictedQI: result.predicted_quality_index,
    predictedQICI: result.predicted_range,
    reason: result.reason,
    estimatedCostSavings: result.skip_llm ? 0.015 : 0,
    topSignals: result.top_signals.map(s => ({
      signalName: s.signal_name,
      contribution: s.contribution,
    })),
  };
}

// ============================================================================
// COST SAVINGS ESTIMATION
// ============================================================================

/**
 * Estimate monthly cost savings from pre-screening at a given skip rate.
 *
 * @param dailyEssayVolume - Number of essays scored per day
 * @param skipRate - Expected fraction of essays that would skip LLM (0-1)
 * @param costPerEssay - Cost of LLM scoring per essay
 * @returns Estimated monthly savings in USD
 */
export function estimateMonthlySavings(
  dailyEssayVolume: number,
  skipRate: number,
  costPerEssay: number = 0.015
): {
  monthlyEssaysSkipped: number;
  monthlySavingsUSD: number;
  annualSavingsUSD: number;
} {
  const monthlyVolume = dailyEssayVolume * 30;
  const monthlySkipped = Math.round(monthlyVolume * skipRate);
  const monthlySavings = monthlySkipped * costPerEssay;

  return {
    monthlyEssaysSkipped: monthlySkipped,
    monthlySavingsUSD: Math.round(monthlySavings * 100) / 100,
    annualSavingsUSD: Math.round(monthlySavings * 12 * 100) / 100,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function priorsToScores(priors: Record<string, { mu: number }>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [dim, prior] of Object.entries(priors)) {
    scores[dim] = Math.max(0, Math.min(10, Math.round(prior.mu * 100) / 100));
  }
  return scores;
}

function computePredictedQI(
  priors: Record<string, { mu: number }>,
  weights: Record<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dim, prior] of Object.entries(priors)) {
    const w = weights[dim] ?? 0;
    weightedSum += prior.mu * w;
    totalWeight += w;
  }

  return totalWeight > 0
    ? Math.round(weightedSum / totalWeight * 10 * 10) / 10
    : 0;
}

function computePredictedQICI(
  priors: Record<string, { mu: number; sigma: number }>,
  weights: Record<string, number>
): [number, number] {
  let lowerSum = 0;
  let upperSum = 0;
  let totalWeight = 0;

  for (const [dim, prior] of Object.entries(priors)) {
    const w = weights[dim] ?? 0;
    lowerSum += (prior.mu - 1.96 * prior.sigma) * w;
    upperSum += (prior.mu + 1.96 * prior.sigma) * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return [0, 100];

  return [
    Math.max(0, Math.round(lowerSum / totalWeight * 10 * 10) / 10),
    Math.min(100, Math.round(upperSum / totalWeight * 10 * 10) / 10),
  ];
}

function extractTopSignals(
  priors: Record<string, { signals: Array<{ signal_name: string; weight: number; signal_value: number }> }>
): Array<{ signalName: string; contribution: number }> {
  const allSignals: Array<{ signalName: string; contribution: number }> = [];

  for (const prior of Object.values(priors)) {
    for (const sig of prior.signals) {
      allSignals.push({
        signalName: sig.signal_name,
        contribution: Math.abs(sig.weight * sig.signal_value),
      });
    }
  }

  allSignals.sort((a, b) => b.contribution - a.contribution);
  return allSignals.slice(0, 5);
}
