/**
 * WritingQualityEngine Integration Testing — Shared Types
 *
 * Type definitions used across all WQE integration tests:
 * baseline capture, regression detection, A/B comparison, and phase gates.
 *
 * Run: imported by other wqe-* test files (not run directly)
 */

// ============================================================================
// INTEGRATION PHASE DEFINITIONS
// ============================================================================

/**
 * The four phases of WritingQualityEngine integration.
 * Each phase has progressively more computational influence on output.
 */
export type IntegrationPhase =
  | 'baseline'        // Current pipeline, no computational integration
  | 'shadow'          // Log computational alongside LLM, don't change outputs
  | 'enrichment'      // Inject computational insights into LLM prompts
  | 'calibration'     // Bayesian updating of LLM scores with computational priors
  | 'pre_screening';  // Skip LLM for confident computational assessments

/**
 * Configuration for phase-specific regression thresholds.
 * These define how much drift is acceptable at each integration step.
 */
export interface PhaseThresholds {
  /** Maximum allowed change in overall Narrative Quality Index (0-100 scale) */
  maxQIDriftPercent: number;

  /** Maximum allowed change in any single dimension score (0-10 scale) */
  maxDimensionDriftPoints: number;

  /** Maximum allowed increase in pipeline time (milliseconds) */
  maxTimingOverheadMs: number;

  /** Expected cost change range (negative = savings) */
  expectedCostChangePercent: [number, number];

  /** Minimum number of runs needed for statistical confidence */
  minRunsForConfidence: number;

  /** Whether pre-screening can skip LLM in this phase */
  allowsLLMSkip: boolean;
}

/**
 * Phase-specific thresholds.
 * Shadow = zero tolerance; each successive phase allows more drift.
 */
export const PHASE_THRESHOLDS: Record<IntegrationPhase, PhaseThresholds> = {
  baseline: {
    maxQIDriftPercent: 0,
    maxDimensionDriftPoints: 0,
    maxTimingOverheadMs: 0,
    expectedCostChangePercent: [0, 0],
    minRunsForConfidence: 1,
    allowsLLMSkip: false,
  },
  shadow: {
    maxQIDriftPercent: 0,        // Shadow mode must NOT change outputs
    maxDimensionDriftPoints: 0,
    maxTimingOverheadMs: 50,     // 50ms overhead for computational analysis
    expectedCostChangePercent: [0, 0],
    minRunsForConfidence: 3,
    allowsLLMSkip: false,
  },
  enrichment: {
    maxQIDriftPercent: 5,        // Prompt changes may shift LLM behavior
    maxDimensionDriftPoints: 1.5,
    maxTimingOverheadMs: 100,    // Slightly longer prompts
    expectedCostChangePercent: [0, 10], // Longer prompts = more tokens
    minRunsForConfidence: 3,
    allowsLLMSkip: false,
  },
  calibration: {
    maxQIDriftPercent: 8,        // Bayesian updating actively adjusts scores
    maxDimensionDriftPoints: 2.0,
    maxTimingOverheadMs: 10,     // Bayesian update is algebraic (<1ms)
    expectedCostChangePercent: [0, 0], // No additional LLM calls
    minRunsForConfidence: 3,
    allowsLLMSkip: false,
  },
  pre_screening: {
    maxQIDriftPercent: 12,       // Pre-screened essays can diverge more
    maxDimensionDriftPoints: 2.5,
    maxTimingOverheadMs: -1000,  // Should be FASTER (negative = savings)
    expectedCostChangePercent: [-40, -15], // Significant token savings
    minRunsForConfidence: 5,     // More runs needed for skip confidence
    allowsLLMSkip: true,
  },
};

// ============================================================================
// ESSAY FIXTURE TYPES
// ============================================================================

/**
 * Archetype label for reference essays.
 * Each archetype tests a specific quality dimension.
 */
export type EssayArchetype =
  | 'excellent'            // Strong narrative, vivid, specific — expected high scores
  | 'mediocre'             // Competent but flat — expected middle scores
  | 'weak'                 // Vague, templated — expected low scores
  | 'ai_generated'         // Polished but inauthentic — should be flagged
  | 'very_short'           // Under 80 words — edge case
  | 'register_inconsistent'// Mixed formal/informal register — tests voice detection
  | 'strong_narrative_arc' // Clear tension-resolution-insight arc
  | 'pure_reflection';     // No narrative events, pure introspection

/**
 * Expected score ranges for a reference essay.
 * Each dimension has a [min, max] that the golden baseline should fall within.
 */
export interface ExpectedScoreRanges {
  nqi: [number, number];
  dimensions: Partial<Record<string, [number, number]>>;
  /** Flags that MUST appear in the output */
  requiredFlags?: string[];
  /** Flags that must NOT appear in the output */
  forbiddenFlags?: string[];
}

// ============================================================================
// BASELINE SNAPSHOT TYPES
// ============================================================================

/**
 * A single dimension score captured from the pipeline.
 */
export interface CapturedDimensionScore {
  name: string;
  score: number;
  evidence_snippets: string[];
  evaluator_notes: string;
  confidence?: number;
}

/**
 * Token usage captured from a pipeline run.
 */
export interface CapturedTokenUsage {
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  /** Estimated cost in USD */
  estimated_cost_usd: number;
}

/**
 * Performance timing captured from a pipeline run.
 */
export interface CapturedTiming {
  stage1_feature_extraction_ms: number;
  stage2_category_scoring_ms: number;
  stage3_deep_reflection_ms: number;
  stage4_nqi_calculation_ms: number;
  total_ms: number;
  /** Additional: computational analysis time (shadow+ modes) */
  computational_analysis_ms?: number;
  /** Additional: Bayesian update time (calibration+ modes) */
  bayesian_update_ms?: number;
}

/**
 * Complete snapshot of a single essay's pipeline run.
 */
export interface PipelineSnapshot {
  /** Which essay fixture this came from */
  essay_archetype: EssayArchetype;

  /** Which integration phase was active */
  phase: IntegrationPhase;

  /** ISO timestamp of the run */
  timestamp: string;

  /** Git commit hash for reproducibility */
  git_commit: string;

  /** Overall Narrative Quality Index */
  nqi: number;

  /** Reader impression label */
  reader_impression_label: string;

  /** All 11 dimension scores */
  dimension_scores: CapturedDimensionScore[];

  /** Diagnostic flags generated */
  flags: string[];

  /** Ranked fix suggestions */
  suggested_fixes: string[];

  /** Authenticity analysis summary */
  authenticity: {
    score: number;
    voice_type: string;
    red_flags: string[];
    manufactured_signals: string[];
  };

  /** Token usage and cost */
  token_usage: CapturedTokenUsage;

  /** Pipeline timing */
  timing: CapturedTiming;

  /** Coaching output (if generated) */
  coaching_summary?: string;

  /** Computational analysis results (shadow+ modes only) */
  computational_analysis?: {
    entropy_diversity_score: number;
    engagement_score: number;
    uniqueness_score: number;
    density_variation_score: number;
    coherence_score: number;
    naturality_score: number;
    rubric_scores: Record<string, number>;
    diagnostics: string[];
    total_ms: number;
  };

  /** Scoring science results (calibration+ modes only) */
  scoring_science?: {
    quality_index: number;
    quality_index_ci: [number, number];
    reliability_assessment: string;
    flagged_dimensions: string[];
    total_adjustment_magnitude: number;
    processing_time_ms: number;
  };

  /** Pre-screening results (pre_screening mode only) */
  pre_screen?: {
    skip_llm: boolean;
    confidence: number;
    predicted_qi: number;
    predicted_range: [number, number];
    reason: string;
  };
}

/**
 * A golden baseline: the complete set of snapshots for all reference essays.
 */
export interface GoldenBaseline {
  /** Version identifier for the baseline */
  version: string;

  /** Git commit hash when baseline was captured */
  git_commit: string;

  /** ISO timestamp */
  captured_at: string;

  /** Which phase this baseline represents */
  phase: IntegrationPhase;

  /** Snapshots keyed by essay archetype */
  snapshots: Record<EssayArchetype, PipelineSnapshot[]>;

  /** Aggregate statistics */
  aggregate: {
    mean_nqi: number;
    std_nqi: number;
    mean_timing_ms: number;
    total_cost_usd: number;
    total_tokens: number;
  };
}

// ============================================================================
// REGRESSION DETECTION TYPES
// ============================================================================

/**
 * A single regression detected between baseline and current.
 */
export interface RegressionFinding {
  /** Which essay triggered this */
  essay_archetype: EssayArchetype;

  /** Severity of the regression */
  severity: 'critical' | 'warning' | 'info';

  /** What kind of regression */
  category: 'score_drift' | 'dimension_drift' | 'timing_regression' |
            'cost_increase' | 'flag_change' | 'output_quality' | 'edge_case_failure';

  /** Human-readable description */
  description: string;

  /** Baseline value */
  baseline_value: number | string;

  /** Current value */
  current_value: number | string;

  /** Magnitude of change */
  delta: number;

  /** Whether this exceeds phase thresholds */
  exceeds_threshold: boolean;
}

/**
 * Complete regression report for a phase transition.
 */
export interface RegressionReport {
  /** Which phase transition this covers */
  from_phase: IntegrationPhase;
  to_phase: IntegrationPhase;

  /** Overall go/no-go signal */
  verdict: 'go' | 'no_go' | 'conditional';

  /** All findings */
  findings: RegressionFinding[];

  /** Critical findings that block progression */
  blockers: RegressionFinding[];

  /** Warning findings that need monitoring */
  warnings: RegressionFinding[];

  /** Statistical summary */
  statistics: {
    essays_tested: number;
    runs_per_essay: number;
    total_runs: number;
    mean_nqi_delta: number;
    max_nqi_delta: number;
    mean_timing_delta_ms: number;
    cost_change_percent: number;
    dimensions_exceeding_threshold: string[];
  };

  /** Human-readable summary */
  summary: string;
}

// ============================================================================
// A/B COMPARISON TYPES
// ============================================================================

/**
 * Side-by-side comparison of a single essay through two pipelines.
 */
export interface ABComparison {
  essay_archetype: EssayArchetype;

  pipeline_a: {
    label: string;
    phase: IntegrationPhase;
    snapshot: PipelineSnapshot;
  };

  pipeline_b: {
    label: string;
    phase: IntegrationPhase;
    snapshot: PipelineSnapshot;
  };

  /** Score deltas (B - A) */
  deltas: {
    nqi: number;
    dimensions: Record<string, number>;
    timing_ms: number;
    cost_usd: number;
  };

  /** Qualitative differences */
  qualitative: {
    flags_added: string[];
    flags_removed: string[];
    fixes_reordered: boolean;
    coaching_meaningfully_different: boolean;
  };

  /** Whether the comparison result is acceptable */
  acceptable: boolean;
  rejection_reasons: string[];
}

/**
 * Complete A/B comparison report across all essays.
 */
export interface ABComparisonReport {
  pipeline_a_label: string;
  pipeline_b_label: string;
  timestamp: string;

  comparisons: ABComparison[];

  aggregate: {
    mean_nqi_delta: number;
    max_nqi_delta: number;
    essays_improved: number;
    essays_regressed: number;
    essays_stable: number;
    overall_acceptable: boolean;
  };

  /** Rendered report text */
  rendered_report: string;
}

// ============================================================================
// COST TRACKING TYPES
// ============================================================================

/**
 * Token pricing for cost estimation.
 * Based on Anthropic's published pricing (Feb 2026).
 */
export const TOKEN_PRICING = {
  'claude-sonnet-4-5-20250929': {
    input_per_1k: 0.003,
    output_per_1k: 0.015,
    cached_input_per_1k: 0.0003,
  },
  'claude-haiku-4-5-20251001': {
    input_per_1k: 0.001,
    output_per_1k: 0.005,
    cached_input_per_1k: 0.0001,
  },
} as const;

/**
 * Calculate estimated cost from token counts.
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  model: keyof typeof TOKEN_PRICING = 'claude-sonnet-4-5-20250929'
): number {
  const pricing = TOKEN_PRICING[model];
  return (
    ((inputTokens - cachedTokens) * pricing.input_per_1k / 1000) +
    (cachedTokens * pricing.cached_input_per_1k / 1000) +
    (outputTokens * pricing.output_per_1k / 1000)
  );
}

// ============================================================================
// FEATURE FLAG CONFIGURATION
// ============================================================================

/**
 * Feature flags controlling which WritingQualityEngine components are active.
 * Used for phased rollout and instant rollback.
 */
export interface WQEFeatureFlags {
  /** Shadow mode: log computational analysis alongside pipeline (no output change) */
  shadow_logging: boolean;

  /** Prompt enrichment: inject computational insights into LLM prompts */
  prompt_enrichment: boolean;

  /** Score calibration: apply Bayesian updating to LLM scores */
  score_calibration: boolean;

  /** Pre-screening: skip LLM for high-confidence computational assessments */
  pre_screening: boolean;

  /** Confidence threshold for pre-screening (lower = more aggressive skipping) */
  pre_screen_confidence_threshold: number;

  /** Bayesian shrinkage weight (0 = trust LLM fully, 1 = trust computational fully) */
  bayesian_shrinkage_cap: number;
}

/**
 * Default feature flags for each integration phase.
 */
export const DEFAULT_FLAGS_BY_PHASE: Record<IntegrationPhase, WQEFeatureFlags> = {
  baseline: {
    shadow_logging: false,
    prompt_enrichment: false,
    score_calibration: false,
    pre_screening: false,
    pre_screen_confidence_threshold: 1.2,
    bayesian_shrinkage_cap: 0.3,
  },
  shadow: {
    shadow_logging: true,
    prompt_enrichment: false,
    score_calibration: false,
    pre_screening: false,
    pre_screen_confidence_threshold: 1.2,
    bayesian_shrinkage_cap: 0.3,
  },
  enrichment: {
    shadow_logging: true,
    prompt_enrichment: true,
    score_calibration: false,
    pre_screening: false,
    pre_screen_confidence_threshold: 1.2,
    bayesian_shrinkage_cap: 0.3,
  },
  calibration: {
    shadow_logging: true,
    prompt_enrichment: true,
    score_calibration: true,
    pre_screening: false,
    pre_screen_confidence_threshold: 1.2,
    bayesian_shrinkage_cap: 0.3,
  },
  pre_screening: {
    shadow_logging: true,
    prompt_enrichment: true,
    score_calibration: true,
    pre_screening: true,
    pre_screen_confidence_threshold: 1.2,
    bayesian_shrinkage_cap: 0.3,
  },
};
