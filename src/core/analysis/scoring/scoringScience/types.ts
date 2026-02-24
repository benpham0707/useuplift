/**
 * Scoring Science Module — Type Definitions
 *
 * Comprehensive type system for psychometric scoring techniques applied to
 * rubric-based essay evaluation. These types span IRT calibration, Bayesian
 * updating, constraint satisfaction, reliability analysis, and more.
 *
 * Design principles:
 * - All scores carry uncertainty information (no bare numbers)
 * - All calibrations are versioned and auditable
 * - Types are generic enough to work with both the 11-category experience
 *   rubric and the 12-dimension essay rubric
 */

// ============================================================================
// FOUNDATIONAL TYPES
// ============================================================================

/**
 * A score with associated uncertainty and metadata.
 * The atomic unit of the scoring science module — every score must carry
 * its confidence interval rather than being a bare number.
 */
export interface CalibratedScore {
  /** Point estimate (0-10 scale) */
  value: number;

  /** Lower bound of 95% confidence interval */
  ci_lower: number;

  /** Upper bound of 95% confidence interval */
  ci_upper: number;

  /** Standard error of measurement for this score */
  sem: number;

  /** Confidence in this specific score (0-1), distinct from CI width */
  confidence: number;

  /** Which calibration techniques were applied */
  calibration_methods: CalibrationType[];

  /** Whether this score was flagged for review */
  flagged: boolean;

  /** Reason for flagging, if any */
  flag_reason?: string;
}

export type CalibrationType =
  | 'irt_calibration'
  | 'bayesian_posterior'
  | 'constraint_adjustment'
  | 'distribution_normalization'
  | 'multi_rater_consensus'
  | 'reliability_check'
  | 'raw_unmodified';

/**
 * A dimension (rubric category) with its psychometric properties.
 * These parameters are pre-computed from historical scoring patterns
 * and updated periodically.
 */
export interface DimensionPsychometrics {
  /** Dimension key name */
  dimension: string;

  /** Display name */
  display_name: string;

  /** Rubric weight (0-1) */
  weight: number;

  /** IRT difficulty parameter (higher = harder to score well on) */
  difficulty: number;

  /** IRT discrimination parameter (higher = better at differentiating ability levels) */
  discrimination: number;

  /** Expected score distribution parameters */
  distribution: {
    mean: number;
    std_dev: number;
    skewness: number;
    kurtosis: number;
  };

  /** Information function peak: the ability level (theta) at which
   *  this dimension is most informative */
  peak_information_theta: number;

  /** Correlation with overall quality (0-1) */
  quality_correlation: number;

  /** Correlation matrix entries with other dimensions */
  inter_dimension_correlations: Record<string, number>;
}

// ============================================================================
// IRT (ITEM RESPONSE THEORY) TYPES
// ============================================================================

/**
 * IRT model parameters for a single dimension.
 * Uses the 2-Parameter Logistic (2PL) model.
 */
export interface IRTParameters {
  /** Difficulty parameter b: the ability level at which P(correct) = 0.5 */
  b: number;

  /** Discrimination parameter a: steepness of the ICC curve */
  a: number;

  /** Guessing parameter c (for 3PL, usually 0 for rubric scoring) */
  c: number;
}

/**
 * Result of IRT-based ability estimation.
 * Theta is the latent "essay quality" trait estimated from observed scores.
 */
export interface IRTAbilityEstimate {
  /** Estimated ability (theta) on standardized scale */
  theta: number;

  /** Standard error of theta estimate */
  se_theta: number;

  /** 95% CI for theta */
  theta_ci: [number, number];

  /** Theta mapped back to 0-100 quality index */
  quality_index: number;

  /** Quality index CI */
  quality_ci: [number, number];

  /** Per-dimension expected scores at this theta level */
  expected_scores: Record<string, number>;

  /** Per-dimension residuals (observed - expected) */
  residuals: Record<string, number>;

  /** Dimensions with anomalous residuals (|residual| > 2*SE) */
  anomalous_dimensions: string[];

  /** Total test information at estimated theta */
  information_at_theta: number;
}

/**
 * Information function output — how much measurement precision
 * each dimension contributes at various ability levels.
 */
export interface InformationProfile {
  /** Theta values sampled along the ability continuum */
  theta_points: number[];

  /** Per-dimension information at each theta point */
  dimension_information: Record<string, number[]>;

  /** Total information curve (sum of all dimensions) */
  total_information: number[];

  /** Theta at which total information peaks */
  peak_theta: number;

  /** Dimensions ranked by informativeness at a given theta */
  ranked_at_theta: (theta: number) => Array<{
    dimension: string;
    information: number;
    proportion_of_total: number;
  }>;
}

// ============================================================================
// BAYESIAN SCORE UPDATING TYPES
// ============================================================================

/**
 * Prior distribution for a dimension score, derived from essay metadata
 * and computational signals before LLM scoring.
 */
export interface ScorePrior {
  dimension: string;

  /** Prior mean */
  mu: number;

  /** Prior standard deviation (higher = less certain) */
  sigma: number;

  /** Source of the prior */
  source: 'category_baseline' | 'computational_signal' | 'historical_pattern' | 'uniform';

  /** Computational signals that informed this prior */
  signals: Array<{
    signal_name: string;
    signal_value: number;
    weight: number;
  }>;
}

/**
 * Posterior distribution after Bayesian updating with LLM scores.
 */
export interface ScorePosterior {
  dimension: string;

  /** Prior that was updated */
  prior: ScorePrior;

  /** Observed LLM score */
  observed: number;

  /** Posterior mean (calibrated score) */
  posterior_mu: number;

  /** Posterior standard deviation */
  posterior_sigma: number;

  /** 95% credible interval */
  credible_interval: [number, number];

  /** How much the LLM score diverged from the prior */
  divergence: number;

  /** Whether divergence exceeds threshold (flags for review) */
  divergence_flagged: boolean;

  /** Shrinkage factor: how much we pulled the LLM score toward the prior
   *  (0 = fully trusted LLM, 1 = fully trusted prior) */
  shrinkage: number;
}

/**
 * Pre-screening result: can we skip expensive LLM scoring?
 */
export interface PreScreenResult {
  /** Whether LLM scoring can be skipped */
  skip_llm: boolean;

  /** Confidence in the pre-screen decision */
  confidence: number;

  /** Predicted score range from computational signals alone */
  predicted_range: [number, number];

  /** Predicted quality index */
  predicted_quality_index: number;

  /** Reason for the decision */
  reason: string;

  /** Which signals contributed most */
  top_signals: Array<{
    signal_name: string;
    contribution: number;
  }>;
}

// ============================================================================
// RELIABILITY & CONSISTENCY TYPES
// ============================================================================

/**
 * Internal consistency analysis for a single essay's dimension scores.
 */
export interface InternalConsistency {
  /** Cronbach's alpha across all dimensions */
  cronbachs_alpha: number;

  /** Whether alpha indicates acceptable reliability (>= 0.7) */
  acceptable: boolean;

  /** Alpha-if-deleted for each dimension (identifies problematic scores) */
  alpha_if_deleted: Record<string, number>;

  /** Dimensions whose removal would substantially improve alpha */
  inconsistent_dimensions: string[];

  /** Corrected item-total correlations */
  item_total_correlations: Record<string, number>;

  /** Dimensions with suspiciously low item-total correlation */
  low_correlation_dimensions: string[];
}

/**
 * Split-half reliability from two independent scoring passes.
 */
export interface SplitHalfReliability {
  /** Spearman-Brown corrected reliability */
  spearman_brown: number;

  /** Raw half-test correlation */
  half_correlation: number;

  /** Per-dimension agreement between the two halves */
  dimension_agreement: Record<string, {
    score_1: number;
    score_2: number;
    difference: number;
    within_tolerance: boolean;
  }>;

  /** Dimensions with significant disagreement */
  disagreement_flags: string[];
}

/**
 * Standard Error of Measurement for each dimension.
 */
export interface SEMAnalysis {
  /** Global reliability estimate used */
  reliability_estimate: number;

  /** Per-dimension SEM */
  dimension_sem: Record<string, number>;

  /** Per-dimension 95% confidence band width */
  confidence_band_width: Record<string, number>;

  /** Dimensions with unacceptably wide bands (> 2 points) */
  low_precision_dimensions: string[];
}

// ============================================================================
// MULTI-RATER AGREEMENT TYPES
// ============================================================================

/**
 * Result from simulating multiple virtual raters.
 */
export interface MultiRaterResult {
  /** Number of raters simulated */
  rater_count: number;

  /** Per-dimension scores from each rater */
  rater_scores: Array<{
    rater_id: string;
    rater_type: 'llm_variant' | 'computational' | 'heuristic';
    scores: Record<string, number>;
  }>;

  /** Consensus scores (mean of agreeing raters) */
  consensus_scores: Record<string, number>;

  /** Intraclass correlation coefficient (absolute agreement) */
  icc_absolute: number;

  /** Intraclass correlation coefficient (consistency) */
  icc_consistency: number;

  /** Cohen's kappa for each dimension (pairwise, averaged) */
  cohens_kappa: Record<string, number>;

  /** Dimensions where raters disagree significantly */
  disagreement_flags: Array<{
    dimension: string;
    score_range: [number, number];
    std_dev: number;
    requires_adjudication: boolean;
  }>;

  /** Overall inter-rater reliability assessment */
  reliability_assessment: 'excellent' | 'good' | 'moderate' | 'poor';
}

// ============================================================================
// CONSTRAINT SATISFACTION TYPES
// ============================================================================

/**
 * A logical constraint between dimensions.
 */
export interface DimensionConstraint {
  /** Unique constraint identifier */
  id: string;

  /** Human-readable description */
  description: string;

  /** The dimension whose score is the antecedent */
  antecedent_dimension: string;

  /** Condition on the antecedent */
  antecedent_condition: '<' | '<=' | '>' | '>=' | '==';

  /** Threshold for the antecedent */
  antecedent_threshold: number;

  /** The dimension whose score is constrained */
  consequent_dimension: string;

  /** Maximum allowed score for the consequent when condition holds */
  consequent_max: number;

  /** Severity if violated */
  severity: 'hard' | 'soft';

  /** Rationale for the constraint */
  rationale: string;
}

/**
 * Result of running constraint satisfaction on a set of scores.
 */
export interface ConstraintCheckResult {
  /** Total constraints evaluated */
  total_constraints: number;

  /** Number of violations found */
  violations_found: number;

  /** Detailed violation report */
  violations: Array<{
    constraint: DimensionConstraint;
    antecedent_score: number;
    consequent_score: number;
    consequent_max_allowed: number;
    excess: number;
    suggested_adjustment: number;
  }>;

  /** Scores after constraint adjustments (if auto-fix enabled) */
  adjusted_scores?: Record<string, number>;

  /** Total adjustment magnitude */
  total_adjustment: number;

  /** Whether any hard constraints were violated */
  has_hard_violations: boolean;
}

// ============================================================================
// WEIGHT OPTIMIZATION TYPES
// ============================================================================

/**
 * Result of rubric weight optimization via gradient descent or PCA.
 */
export interface WeightOptimizationResult {
  /** Original weights */
  original_weights: Record<string, number>;

  /** Optimized weights */
  optimized_weights: Record<string, number>;

  /** Delta from original for each dimension */
  weight_deltas: Record<string, number>;

  /** R-squared of optimized model */
  r_squared: number;

  /** Principal components analysis */
  pca_analysis: {
    /** Number of components explaining 90% of variance */
    components_for_90_pct: number;

    /** Component loadings */
    components: Array<{
      component_number: number;
      variance_explained: number;
      cumulative_variance: number;
      loadings: Record<string, number>;
      interpretation: string;
    }>;

    /** Pairs of highly correlated dimensions (candidates for merging) */
    redundant_pairs: Array<{
      dimension_a: string;
      dimension_b: string;
      correlation: number;
    }>;
  };

  /** Optimization metadata */
  metadata: {
    method: 'gradient_descent' | 'pca_informed' | 'bayesian_optimization';
    iterations: number;
    convergence: boolean;
    sample_size: number;
  };
}

// ============================================================================
// SCORE DISTRIBUTION NORMALIZATION TYPES
// ============================================================================

/**
 * Normalization result for a single dimension.
 */
export interface NormalizationResult {
  dimension: string;

  /** Original raw score */
  raw_score: number;

  /** Z-score relative to historical distribution */
  z_score: number;

  /** Percentile rank (0-100) */
  percentile: number;

  /** Stanine (1-9) */
  stanine: number;

  /** Normalized score (0-10 scale, using full range) */
  normalized_score: number;

  /** Which normalization technique was applied */
  technique: 'z_score' | 'percentile_rank' | 'stanine' | 'elo_relative';
}

/**
 * Full normalization report for all dimensions.
 */
export interface NormalizationReport {
  /** Per-dimension normalization */
  dimensions: Record<string, NormalizationResult>;

  /** Distribution health metrics */
  distribution_health: {
    /** Are scores compressed into a narrow range? */
    score_compression_detected: boolean;

    /** Effective range being used (min-max of actual scores) */
    effective_range: [number, number];

    /** Theoretical range */
    theoretical_range: [number, number];

    /** Range utilization (effective / theoretical) */
    range_utilization: number;

    /** Recommendations */
    recommendations: string[];
  };
}

// ============================================================================
// DIMINISHING RETURNS TYPES
// ============================================================================

/**
 * Marginal improvement analysis for a dimension.
 */
export interface MarginalImprovementAnalysis {
  dimension: string;

  /** Current score */
  current_score: number;

  /** Marginal utility of improving by 1 point */
  marginal_utility_next_point: number;

  /** Projected marginal utilities for +1 through +5 */
  utility_curve: Array<{
    improvement: number;
    projected_score: number;
    marginal_utility: number;
    cumulative_utility: number;
    quality_index_delta: number;
  }>;

  /** Distance to "ceiling" (practical maximum for this essay type) */
  ceiling_distance: number;

  /** Is this dimension near ceiling? (< 1 point from practical max) */
  near_ceiling: boolean;

  /** Improvement difficulty estimate */
  difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';

  /** Effort-adjusted priority rank */
  effort_adjusted_rank: number;
}

/**
 * Revision priority report.
 */
export interface RevisionPriorityReport {
  /** All dimensions ranked by effort-adjusted improvement value */
  ranked_dimensions: MarginalImprovementAnalysis[];

  /** Top 3 "best bang for your buck" improvements */
  top_recommendations: Array<{
    dimension: string;
    current: number;
    target: number;
    expected_quality_gain: number;
    effort: string;
    rationale: string;
  }>;

  /** Dimensions to deprioritize (near ceiling or low weight) */
  deprioritized: Array<{
    dimension: string;
    reason: string;
  }>;
}

// ============================================================================
// UNIFIED SCORING SCIENCE RESULT
// ============================================================================

/**
 * The complete output of the Scoring Science pipeline.
 * Wraps all sub-analyses into a single coherent result.
 */
export interface ScoringCalibratedResult {
  /** Original raw scores from the LLM or heuristic scorer */
  raw_scores: Record<string, number>;

  /** Calibrated scores (the final, best-estimate scores) */
  calibrated_scores: Record<string, CalibratedScore>;

  /** Quality index (0-100) computed from calibrated scores */
  quality_index: number;

  /** Quality index confidence interval */
  quality_index_ci: [number, number];

  /** IRT ability estimate */
  irt_estimate: IRTAbilityEstimate;

  /** Bayesian posteriors for each dimension */
  bayesian_posteriors: Record<string, ScorePosterior>;

  /** Internal consistency analysis */
  internal_consistency: InternalConsistency;

  /** Constraint satisfaction check */
  constraint_check: ConstraintCheckResult;

  /** Score normalization report */
  normalization: NormalizationReport;

  /** Revision priority analysis */
  revision_priorities: RevisionPriorityReport;

  /** Overall reliability assessment */
  reliability: {
    score: number;
    assessment: 'high' | 'moderate' | 'low';
    issues: string[];
  };

  /** Pipeline metadata */
  metadata: {
    pipeline_version: string;
    calibration_timestamp: string;
    rubric_type: 'experience' | 'essay';
    rubric_version: string;
    techniques_applied: CalibrationType[];
    processing_time_ms: number;
  };
}
