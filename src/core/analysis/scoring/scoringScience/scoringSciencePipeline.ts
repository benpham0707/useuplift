/**
 * Scoring Science Pipeline — Unified Orchestrator
 *
 * This is the main entry point for the Scoring Science module. It chains
 * all psychometric techniques into a coherent pipeline:
 *
 *   Raw LLM Scores
 *     → IRT Calibration (detect anomalous patterns)
 *     → Bayesian Updating (calibrate with computational priors)
 *     → Constraint Satisfaction (enforce logical coherence)
 *     → Distribution Normalization (correct LLM score compression)
 *     → Reliability Analysis (assess score quality)
 *     → Diminishing Returns (guide revision priorities)
 *     → Final Calibrated Scores
 *
 * The pipeline can be run in full or in stages, depending on what
 * information is available and how much precision is needed.
 *
 * PIPELINE MODES:
 * - 'full': All techniques applied (most accurate, ~2-3ms)
 * - 'quick': IRT + constraints only (fast, ~1ms)
 * - 'pre_screen': Bayesian priors only, no LLM required (< 1ms)
 *
 * INTEGRATION POINTS:
 * - Post categoryScorer.ts (experience rubric)
 * - Post rubricScorer.ts (essay rubric)
 * - Pre coaching/report generation
 */

import {
  CalibratedScore,
  CalibrationType,
  ScoringCalibratedResult,
  ScorePosterior,
} from './types';

import { calibrateWithIRT } from './irtCalibration';
import {
  computePriors,
  updateAllDimensions,
  preScreen,
  ComputationalSignals,
} from './bayesianUpdating';
import { computeInternalConsistency, computeSEM } from './reliabilityAnalysis';
import { checkConstraints, summarizeViolations } from './constraintSatisfaction';
import { normalizeScores, applyNormalization } from './distributionNormalization';
import { generateRevisionPriorities } from './diminishingReturns';

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

export interface ScoringPipelineConfig {
  /** Which rubric type to calibrate for */
  rubricType: 'experience' | 'essay';

  /** Pipeline mode */
  mode: 'full' | 'quick' | 'pre_screen';

  /** Dimension weights (used for QI calculation) */
  weights: Record<string, number>;

  /** Whether to auto-fix constraint violations */
  autoFixConstraints: boolean;

  /** How aggressively to normalize scores (0=none, 1=full) */
  normalizationAggressiveness: number;

  /** Rubric version string */
  rubricVersion: string;

  /** Optional: word count for context-aware ceiling estimation */
  wordCount?: number;

  /** Optional: activity category for experience rubric */
  activityCategory?: string;

  /** Optional: computational signals for Bayesian priors */
  computationalSignals?: ComputationalSignals;

  /** Optional: confidence values from LLM (per-dimension) */
  llmConfidences?: Record<string, number>;
}

/** Default configuration for the experience rubric */
export const DEFAULT_EXPERIENCE_CONFIG: ScoringPipelineConfig = {
  rubricType: 'experience',
  mode: 'full',
  weights: {
    voice_integrity: 0.10,
    specificity_evidence: 0.09,
    transformative_impact: 0.12,
    role_clarity_ownership: 0.08,
    narrative_arc_stakes: 0.10,
    initiative_leadership: 0.10,
    community_collaboration: 0.08,
    reflection_meaning: 0.12,
    craft_language_quality: 0.07,
    fit_trajectory: 0.07,
    time_investment_consistency: 0.07,
  },
  autoFixConstraints: true,
  normalizationAggressiveness: 0.3,
  rubricVersion: 'v1.0.0',
};

/** Default configuration for the essay rubric */
export const DEFAULT_ESSAY_CONFIG: ScoringPipelineConfig = {
  rubricType: 'essay',
  mode: 'full',
  weights: {
    opening_power_scene_entry: 0.10,
    narrative_arc_stakes_turn: 0.12,
    character_interiority_vulnerability: 0.12,
    show_dont_tell_craft: 0.10,
    reflection_meaning_making: 0.12,
    intellectual_vitality_curiosity: 0.08,
    originality_specificity_voice: 0.08,
    structure_pacing_coherence: 0.06,
    word_economy_craft: 0.06,
    context_constraints_disclosure: 0.08,
    school_program_fit: 0.06,
    ethical_awareness_humility: 0.06,
  },
  autoFixConstraints: true,
  normalizationAggressiveness: 0.3,
  rubricVersion: 'v1.0.1',
};

// ============================================================================
// HELPER: Compute Calibrated Score Object
// ============================================================================

function buildCalibratedScore(
  rawScore: number,
  posterior: ScorePosterior | undefined,
  constraintAdjusted: number | undefined,
  normalizedScore: number | undefined,
  sem: number,
  methods: CalibrationType[],
  flagged: boolean,
  flagReason?: string
): CalibratedScore {
  // Choose the best available calibrated value
  let value = rawScore;
  if (posterior) {
    value = posterior.posterior_mu;
  }
  if (constraintAdjusted !== undefined) {
    value = Math.min(value, constraintAdjusted);
  }
  // Blend with normalization if available
  if (normalizedScore !== undefined) {
    // Gentle blend: 70% calibrated, 30% normalized
    value = value * 0.7 + normalizedScore * 0.3;
  }

  value = Math.max(0, Math.min(10, Math.round(value * 100) / 100));

  return {
    value,
    ci_lower: Math.max(0, Math.round((value - 1.96 * sem) * 100) / 100),
    ci_upper: Math.min(10, Math.round((value + 1.96 * sem) * 100) / 100),
    sem: Math.round(sem * 100) / 100,
    confidence: Math.max(0, Math.min(1, 1 - sem / 3)),
    calibration_methods: methods,
    flagged,
    flag_reason: flagReason,
  };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the full Scoring Science calibration pipeline.
 *
 * @param rawScores - Raw dimension scores from LLM or heuristic (0-10)
 * @param config - Pipeline configuration
 * @returns Complete calibrated scoring result
 */
export function runScoringPipeline(
  rawScores: Record<string, number>,
  config: ScoringPipelineConfig
): ScoringCalibratedResult {
  const startTime = Date.now();
  const techniquesApplied: CalibrationType[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 1: IRT CALIBRATION
  // ═══════════════════════════════════════════════════════════════════
  const irtEstimate = calibrateWithIRT(rawScores, config.rubricType);
  techniquesApplied.push('irt_calibration');

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 2: BAYESIAN UPDATING (if signals available)
  // ═══════════════════════════════════════════════════════════════════
  let posteriors: Record<string, ScorePosterior> = {};

  if (config.computationalSignals && config.mode === 'full') {
    const priors = computePriors(config.computationalSignals);
    posteriors = updateAllDimensions(
      priors,
      rawScores,
      config.llmConfidences
    );
    techniquesApplied.push('bayesian_posterior');
  }

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 3: CONSTRAINT SATISFACTION
  // ═══════════════════════════════════════════════════════════════════
  // Use posterior scores if available, otherwise raw scores
  const scoresForConstraints: Record<string, number> = {};
  for (const [dim, raw] of Object.entries(rawScores)) {
    scoresForConstraints[dim] = posteriors[dim]?.posterior_mu ?? raw;
  }

  const constraintResult = checkConstraints(
    scoresForConstraints,
    config.rubricType,
    config.autoFixConstraints
  );
  techniquesApplied.push('constraint_adjustment');

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 4: DISTRIBUTION NORMALIZATION (full mode only)
  // ═══════════════════════════════════════════════════════════════════
  let normalizationReport = normalizeScores(rawScores);
  let normalizedScores: Record<string, number> | undefined;

  if (config.mode === 'full' && config.normalizationAggressiveness > 0) {
    normalizedScores = applyNormalization(rawScores, config.normalizationAggressiveness);
    techniquesApplied.push('distribution_normalization');
  }

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 5: RELIABILITY ANALYSIS
  // ═══════════════════════════════════════════════════════════════════
  const internalConsistency = computeInternalConsistency(rawScores);
  techniquesApplied.push('reliability_check');

  const semAnalysis = computeSEM(
    rawScores,
    Math.max(0, internalConsistency.cronbachs_alpha)
  );

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 6: BUILD CALIBRATED SCORES
  // ═══════════════════════════════════════════════════════════════════
  const calibratedScores: Record<string, CalibratedScore> = {};

  for (const [dim, rawScore] of Object.entries(rawScores)) {
    const posterior = posteriors[dim];
    const adjustedScore = constraintResult.adjusted_scores?.[dim];
    const normalized = normalizedScores?.[dim];
    const sem = semAnalysis.dimension_sem[dim] ?? 1.0;

    // Determine flags
    let flagged = false;
    let flagReason: string | undefined;

    // Flag if IRT detects anomaly
    if (irtEstimate.anomalous_dimensions.includes(dim)) {
      flagged = true;
      flagReason = `IRT anomaly: observed=${rawScore.toFixed(1)}, expected=${(irtEstimate.expected_scores[dim] ?? 0).toFixed(1)} at theta=${irtEstimate.theta.toFixed(2)}`;
    }

    // Flag if Bayesian divergence
    if (posterior?.divergence_flagged) {
      flagged = true;
      flagReason = (flagReason ? flagReason + '; ' : '') +
        `Bayesian divergence: ${posterior.divergence.toFixed(1)} SDs from prior`;
    }

    // Flag if constraint violated
    const violation = constraintResult.violations.find(
      v => v.constraint.consequent_dimension === dim
    );
    if (violation) {
      flagged = true;
      flagReason = (flagReason ? flagReason + '; ' : '') +
        `Constraint: ${violation.constraint.description} (excess: ${violation.excess.toFixed(1)})`;
    }

    calibratedScores[dim] = buildCalibratedScore(
      rawScore,
      posterior,
      adjustedScore,
      normalized,
      sem,
      techniquesApplied,
      flagged,
      flagReason
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 7: COMPUTE QUALITY INDEX FROM CALIBRATED SCORES
  // ═══════════════════════════════════════════════════════════════════
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dim, calibrated] of Object.entries(calibratedScores)) {
    const w = config.weights[dim] ?? 0;
    weightedSum += calibrated.value * w;
    totalWeight += w;
  }

  const qualityIndex = totalWeight > 0
    ? Math.round(weightedSum / totalWeight * 10 * 10) / 10
    : 0;

  // QI confidence interval (propagate individual CIs)
  let qiLowerSum = 0;
  let qiUpperSum = 0;
  for (const [dim, calibrated] of Object.entries(calibratedScores)) {
    const w = config.weights[dim] ?? 0;
    qiLowerSum += calibrated.ci_lower * w;
    qiUpperSum += calibrated.ci_upper * w;
  }
  const qiLower = totalWeight > 0
    ? Math.round(qiLowerSum / totalWeight * 10 * 10) / 10
    : 0;
  const qiUpper = totalWeight > 0
    ? Math.round(qiUpperSum / totalWeight * 10 * 10) / 10
    : 100;

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 8: DIMINISHING RETURNS & REVISION PRIORITIES
  // ═══════════════════════════════════════════════════════════════════
  const calibratedValues: Record<string, number> = {};
  for (const [dim, cs] of Object.entries(calibratedScores)) {
    calibratedValues[dim] = cs.value;
  }

  const revisionPriorities = generateRevisionPriorities(
    calibratedValues,
    config.weights,
    config.wordCount,
    config.activityCategory
  );

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 9: OVERALL RELIABILITY ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════
  const reliabilityIssues: string[] = [];

  if (!internalConsistency.acceptable) {
    reliabilityIssues.push(
      `Low internal consistency (alpha=${internalConsistency.cronbachs_alpha.toFixed(3)}). Scores may be unreliable.`
    );
  }
  if (internalConsistency.inconsistent_dimensions.length > 0) {
    reliabilityIssues.push(
      `Inconsistent dimensions: ${internalConsistency.inconsistent_dimensions.join(', ')}`
    );
  }
  if (constraintResult.has_hard_violations) {
    reliabilityIssues.push(
      `Hard constraint violations detected (${constraintResult.violations_found} total)`
    );
  }
  if (irtEstimate.anomalous_dimensions.length > 2) {
    reliabilityIssues.push(
      `Multiple IRT anomalies (${irtEstimate.anomalous_dimensions.length} dimensions)`
    );
  }
  if (normalizationReport.distribution_health.score_compression_detected) {
    reliabilityIssues.push('Score compression detected');
  }

  const reliabilityScore = Math.max(0, Math.min(1,
    (internalConsistency.acceptable ? 0.3 : 0) +
    (constraintResult.violations_found === 0 ? 0.3 : 0.1) +
    (irtEstimate.anomalous_dimensions.length === 0 ? 0.2 : 0.1) +
    (!normalizationReport.distribution_health.score_compression_detected ? 0.2 : 0.1)
  ));

  const reliabilityAssessment: 'high' | 'moderate' | 'low' =
    reliabilityScore >= 0.8 ? 'high'
      : reliabilityScore >= 0.5 ? 'moderate'
        : 'low';

  // ═══════════════════════════════════════════════════════════════════
  // ASSEMBLE FINAL RESULT
  // ═══════════════════════════════════════════════════════════════════
  const processingTime = Date.now() - startTime;

  return {
    raw_scores: rawScores,
    calibrated_scores: calibratedScores,
    quality_index: Math.max(0, Math.min(100, qualityIndex)),
    quality_index_ci: [
      Math.max(0, qiLower),
      Math.min(100, qiUpper),
    ],
    irt_estimate: irtEstimate,
    bayesian_posteriors: posteriors,
    internal_consistency: internalConsistency,
    constraint_check: constraintResult,
    normalization: normalizationReport,
    revision_priorities: revisionPriorities,
    reliability: {
      score: Math.round(reliabilityScore * 100) / 100,
      assessment: reliabilityAssessment,
      issues: reliabilityIssues,
    },
    metadata: {
      pipeline_version: '1.0.0',
      calibration_timestamp: new Date().toISOString(),
      rubric_type: config.rubricType,
      rubric_version: config.rubricVersion,
      techniques_applied: techniquesApplied,
      processing_time_ms: processingTime,
    },
  };
}

/**
 * Quick calibration — IRT + constraints only.
 * Faster but less precise than full pipeline.
 */
export function quickCalibrate(
  rawScores: Record<string, number>,
  rubricType: 'experience' | 'essay' = 'experience'
): ScoringCalibratedResult {
  const config = rubricType === 'essay'
    ? { ...DEFAULT_ESSAY_CONFIG, mode: 'quick' as const }
    : { ...DEFAULT_EXPERIENCE_CONFIG, mode: 'quick' as const };

  return runScoringPipeline(rawScores, config);
}

/**
 * Get a human-readable summary of the calibration result.
 */
export function summarizeCalibration(result: ScoringCalibratedResult): string {
  const lines: string[] = [];

  lines.push('=== SCORING SCIENCE CALIBRATION REPORT ===');
  lines.push(`Quality Index: ${result.quality_index}/100 [${result.quality_index_ci[0]}-${result.quality_index_ci[1]}]`);
  lines.push(`Reliability: ${result.reliability.assessment} (${result.reliability.score})`);
  lines.push(`Techniques: ${result.metadata.techniques_applied.join(', ')}`);
  lines.push(`Processing: ${result.metadata.processing_time_ms}ms`);
  lines.push('');

  // Calibrated scores
  lines.push('--- CALIBRATED SCORES ---');
  for (const [dim, cs] of Object.entries(result.calibrated_scores)) {
    const raw = result.raw_scores[dim];
    const delta = cs.value - raw;
    const deltaStr = delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)})` : '';
    const flag = cs.flagged ? ` [FLAGGED: ${cs.flag_reason}]` : '';
    lines.push(`  ${dim}: ${cs.value.toFixed(1)} [${cs.ci_lower.toFixed(1)}-${cs.ci_upper.toFixed(1)}]${deltaStr}${flag}`);
  }
  lines.push('');

  // IRT summary
  lines.push('--- IRT ANALYSIS ---');
  lines.push(`  Theta: ${result.irt_estimate.theta.toFixed(2)} (SE: ${result.irt_estimate.se_theta.toFixed(2)})`);
  if (result.irt_estimate.anomalous_dimensions.length > 0) {
    lines.push(`  Anomalous: ${result.irt_estimate.anomalous_dimensions.join(', ')}`);
  }
  lines.push('');

  // Constraint summary
  if (result.constraint_check.violations_found > 0) {
    lines.push('--- CONSTRAINT VIOLATIONS ---');
    lines.push(summarizeViolations(result.constraint_check));
    lines.push('');
  }

  // Reliability issues
  if (result.reliability.issues.length > 0) {
    lines.push('--- RELIABILITY ISSUES ---');
    for (const issue of result.reliability.issues) {
      lines.push(`  - ${issue}`);
    }
    lines.push('');
  }

  // Revision priorities
  lines.push('--- TOP REVISION PRIORITIES ---');
  for (const rec of result.revision_priorities.top_recommendations) {
    lines.push(`  ${rec.dimension}: ${rec.current} -> ${rec.target} (${rec.effort}, +${rec.expected_quality_gain} QI)`);
    lines.push(`    ${rec.rationale}`);
  }

  return lines.join('\n');
}
