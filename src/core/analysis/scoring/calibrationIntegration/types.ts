/**
 * Score Calibration Integration — Type Definitions
 *
 * Complete type system for Phase 3 (Score Calibration) of the Writing
 * Quality Engine. Controls how Bayesian calibration is gradually
 * introduced, how safety guardrails prevent catastrophic changes,
 * and how rollback/monitoring work.
 *
 * DESIGN PRINCIPLE: Every score change is bounded, auditable, and reversible.
 * No calibration action can permanently alter scores — raw scores are always
 * preserved and reports are regeneratable.
 */

import { ScoringCalibratedResult, CalibratedScore } from '../scoringScience/types';

// ============================================================================
// CALIBRATION LEVEL (GRADUAL RAMP)
// ============================================================================

/**
 * Calibration level controls how aggressively the system adjusts scores.
 * Each level has stricter requirements to advance and broader adjustment limits.
 *
 * Progression: 0 → 1 → 2 → 3 → 4
 * Regression: Any level can revert to 0 instantly (emergency)
 */
export enum CalibrationLevel {
  /** Shadow only — log calibrated scores, use raw for all reports */
  SHADOW = 0,
  /** Light calibration — max ±0.5 point per-dimension adjustment */
  LIGHT = 1,
  /** Moderate calibration — max ±1.0 point per-dimension adjustment */
  MODERATE = 2,
  /** Full calibration — Bayesian posterior used directly (still bounded) */
  FULL = 3,
  /** Full + auto-fix — constraint violations automatically resolved */
  FULL_WITH_AUTOFIX = 4,
}

/**
 * Requirements that must be met to advance to a calibration level.
 */
export interface LevelAdvancementCriteria {
  /** Minimum essays processed at the CURRENT level */
  minEssaysAtCurrentLevel: number;
  /** Correlation between calibrated and raw QI must exceed this */
  minQICorrelation: number;
  /** Maximum allowed mean absolute adjustment (prevents drift) */
  maxMeanAbsAdjustment: number;
  /** Zero hard constraint violations that seem wrong */
  maxSpuriousConstraintViolations: number;
  /** Minimum days at current level before advancing */
  minDaysAtCurrentLevel: number;
}

/**
 * Per-level advancement criteria.
 */
export const LEVEL_ADVANCEMENT_CRITERIA: Record<CalibrationLevel, LevelAdvancementCriteria> = {
  [CalibrationLevel.SHADOW]: {
    // Entry level — no requirements
    minEssaysAtCurrentLevel: 0,
    minQICorrelation: 0,
    maxMeanAbsAdjustment: Infinity,
    maxSpuriousConstraintViolations: Infinity,
    minDaysAtCurrentLevel: 0,
  },
  [CalibrationLevel.LIGHT]: {
    minEssaysAtCurrentLevel: 50,
    minQICorrelation: 0.95,
    maxMeanAbsAdjustment: 0.3,
    maxSpuriousConstraintViolations: 2,
    minDaysAtCurrentLevel: 3,
  },
  [CalibrationLevel.MODERATE]: {
    minEssaysAtCurrentLevel: 100,
    minQICorrelation: 0.92,
    maxMeanAbsAdjustment: 0.5,
    maxSpuriousConstraintViolations: 1,
    minDaysAtCurrentLevel: 7,
  },
  [CalibrationLevel.FULL]: {
    minEssaysAtCurrentLevel: 200,
    minQICorrelation: 0.88,
    maxMeanAbsAdjustment: 0.8,
    maxSpuriousConstraintViolations: 0,
    minDaysAtCurrentLevel: 14,
  },
  [CalibrationLevel.FULL_WITH_AUTOFIX]: {
    minEssaysAtCurrentLevel: 500,
    minQICorrelation: 0.85,
    maxMeanAbsAdjustment: 1.0,
    maxSpuriousConstraintViolations: 0,
    minDaysAtCurrentLevel: 30,
  },
};

// ============================================================================
// WORKSHOP TYPE & SAFETY LIMITS
// ============================================================================

/**
 * Workshop types with different content characteristics.
 * Each type needs different calibration limits because the
 * input text varies dramatically in length and richness.
 */
export type WorkshopType =
  | 'experience_rubric'      // 11-dimension essay analysis (engine.ts)
  | 'activity_description'   // 150-char activity descriptions
  | 'activity_portfolio'     // Portfolio-level scoring (1-10)
  | 'common_app_essay'       // 650-word Common App essays
  | 'piq_essay'              // 350-word UC PIQ essays
  | 'narrative_workshop';    // Narrative analysis

/**
 * Safety limits for a specific workshop type.
 * These are HARD LIMITS that cannot be exceeded regardless of calibration level.
 */
export interface WorkshopSafetyLimits {
  /** Maximum per-dimension score adjustment (absolute value) */
  maxPerDimensionAdjustment: number;
  /** Maximum quality index change (absolute value, 0-100 scale) */
  maxQIChange: number;
  /** Maximum total adjustment magnitude across all dimensions */
  maxTotalAdjustment: number;
  /** Whether constraint auto-fix is allowed for this workshop */
  allowConstraintAutoFix: boolean;
  /** Whether normalization is applied */
  allowNormalization: boolean;
  /** Normalization aggressiveness cap (0-1) */
  maxNormalizationAggressiveness: number;
}

/**
 * Per-workshop safety limits.
 * Activity descriptions get tighter limits because 150 chars
 * don't provide enough signal for confident calibration.
 */
export const WORKSHOP_SAFETY_LIMITS: Record<WorkshopType, WorkshopSafetyLimits> = {
  experience_rubric: {
    maxPerDimensionAdjustment: 2.0,
    maxQIChange: 10,
    maxTotalAdjustment: 8.0,
    allowConstraintAutoFix: true,
    allowNormalization: true,
    maxNormalizationAggressiveness: 0.4,
  },
  activity_description: {
    // Tighter limits — 150 chars is thin signal
    maxPerDimensionAdjustment: 1.0,
    maxQIChange: 5,
    maxTotalAdjustment: 4.0,
    allowConstraintAutoFix: false,
    allowNormalization: true,
    maxNormalizationAggressiveness: 0.2,
  },
  activity_portfolio: {
    maxPerDimensionAdjustment: 1.5,
    maxQIChange: 8,
    maxTotalAdjustment: 6.0,
    allowConstraintAutoFix: true,
    allowNormalization: true,
    maxNormalizationAggressiveness: 0.3,
  },
  common_app_essay: {
    maxPerDimensionAdjustment: 2.0,
    maxQIChange: 12,
    maxTotalAdjustment: 10.0,
    allowConstraintAutoFix: true,
    allowNormalization: true,
    maxNormalizationAggressiveness: 0.4,
  },
  piq_essay: {
    maxPerDimensionAdjustment: 1.5,
    maxQIChange: 8,
    maxTotalAdjustment: 6.0,
    allowConstraintAutoFix: true,
    allowNormalization: true,
    maxNormalizationAggressiveness: 0.3,
  },
  narrative_workshop: {
    maxPerDimensionAdjustment: 2.0,
    maxQIChange: 10,
    maxTotalAdjustment: 8.0,
    allowConstraintAutoFix: true,
    allowNormalization: true,
    maxNormalizationAggressiveness: 0.4,
  },
};

// ============================================================================
// CALIBRATION RESULT TYPES
// ============================================================================

/**
 * The result of applying calibration to a set of scores.
 * Always preserves raw scores alongside calibrated.
 */
export interface CalibrationApplicationResult {
  /** Whether calibration was applied (false = shadow mode or disabled) */
  calibrationApplied: boolean;

  /** The level at which calibration was applied */
  calibrationLevel: CalibrationLevel;

  /** Raw scores as originally produced by the LLM */
  rawScores: Record<string, number>;

  /** Calibrated scores (may equal raw if shadow/disabled) */
  calibratedScores: Record<string, number>;

  /** Per-dimension adjustment applied (calibrated - raw) */
  adjustments: Record<string, number>;

  /** Raw quality index */
  rawQI: number;

  /** Calibrated quality index */
  calibratedQI: number;

  /** QI adjustment (calibrated - raw) */
  qiAdjustment: number;

  /** Full scoring science result (for auditing) */
  scienceResult: ScoringCalibratedResult;

  /** Safety check results */
  safetyCheck: SafetyCheckResult;

  /** Whether any adjustments were clamped by safety limits */
  adjustmentsClamped: boolean;

  /** Dimensions whose adjustments were clamped */
  clampedDimensions: string[];

  /** Timestamp */
  timestamp: string;

  /** Workshop type */
  workshopType: WorkshopType;
}

/**
 * Result of safety guardrail checks.
 */
export interface SafetyCheckResult {
  /** Whether all safety checks passed */
  passed: boolean;

  /** Whether calibration was blocked by safety checks */
  blocked: boolean;

  /** Reason for blocking (if blocked) */
  blockReason?: string;

  /** Per-dimension clamping applied */
  dimensionClamping: Array<{
    dimension: string;
    originalAdjustment: number;
    clampedAdjustment: number;
    reason: string;
  }>;

  /** Whether QI change was clamped */
  qiClamped: boolean;

  /** Original QI change before clamping */
  originalQIChange?: number;

  /** QI change after clamping */
  clampedQIChange?: number;

  /** Whether total adjustment was clamped */
  totalAdjustmentClamped: boolean;
}

// ============================================================================
// MONITORING & ALERTING TYPES
// ============================================================================

/**
 * A single calibration observation for monitoring purposes.
 */
export interface CalibrationObservation {
  /** When this calibration was applied */
  timestamp: string;

  /** Workshop type */
  workshopType: WorkshopType;

  /** Calibration level at time of application */
  level: CalibrationLevel;

  /** Per-dimension adjustments */
  adjustments: Record<string, number>;

  /** QI adjustment */
  qiAdjustment: number;

  /** Whether any safety limits were triggered */
  safetyTriggered: boolean;

  /** Number of constraint violations */
  constraintViolations: number;

  /** Overall reliability assessment */
  reliability: 'high' | 'moderate' | 'low';
}

/**
 * Monitoring metrics computed from a window of observations.
 */
export interface CalibrationMonitoringMetrics {
  /** Number of observations in this window */
  observationCount: number;

  /** Window start/end */
  windowStart: string;
  windowEnd: string;

  /** Mean absolute adjustment per dimension */
  meanAbsAdjustmentByDimension: Record<string, number>;

  /** Overall mean absolute adjustment */
  meanAbsAdjustment: number;

  /** Standard deviation of adjustments (stability measure) */
  adjustmentStdDev: number;

  /** Mean QI adjustment */
  meanQIAdjustment: number;

  /** QI adjustment standard deviation */
  qiAdjustmentStdDev: number;

  /** Percentage of observations where safety was triggered */
  safetyTriggerRate: number;

  /** Mean constraint violation count */
  meanConstraintViolations: number;

  /** Distribution of calibration levels used */
  levelDistribution: Record<CalibrationLevel, number>;

  /** Trend detection: is mean adjustment magnitude increasing? */
  adjustmentMagnitudeTrend: 'increasing' | 'stable' | 'decreasing';

  /** Trend detection: is QI adjustment drifting in one direction? */
  qiDriftDirection: 'positive' | 'neutral' | 'negative';
}

/**
 * Alert generated by the monitoring system.
 */
export interface CalibrationAlert {
  /** Unique alert ID */
  id: string;

  /** Alert severity */
  severity: 'info' | 'warning' | 'critical';

  /** Alert type */
  type:
    | 'adjustment_magnitude_creep'  // Adjustments getting larger over time
    | 'qi_drift'                     // QI adjustments consistently positive or negative
    | 'high_safety_trigger_rate'     // Too many safety limit hits
    | 'constraint_violation_spike'   // Sudden increase in constraint violations
    | 'low_reliability_rate'         // Too many low-reliability assessments
    | 'distribution_shift'           // Score distribution shifting overall
    | 'level_regression_recommended'; // Metrics suggest we should go back a level

  /** Human-readable description */
  message: string;

  /** Relevant metrics */
  metrics: Partial<CalibrationMonitoringMetrics>;

  /** Suggested action */
  suggestedAction: string;

  /** When the alert was generated */
  timestamp: string;
}

// ============================================================================
// PRE-SCREENING TYPES (PHASE 4 PREVIEW)
// ============================================================================

/**
 * Decision about whether to skip LLM scoring entirely.
 */
export interface PreScreenDecision {
  /** Whether to skip LLM scoring */
  skipLLM: boolean;

  /** Confidence in the decision (0-1) */
  confidence: number;

  /** Predicted scores from computational signals alone */
  predictedScores: Record<string, number>;

  /** Predicted quality index */
  predictedQI: number;

  /** Predicted QI confidence interval */
  predictedQICI: [number, number];

  /** Reason for the decision */
  reason: string;

  /** Estimated cost savings if LLM is skipped */
  estimatedCostSavings: number;

  /** Which computational signals drove the decision */
  topSignals: Array<{
    signalName: string;
    contribution: number;
  }>;
}

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

/**
 * Feature flags for controlling calibration at various granularities.
 */
export interface CalibrationFeatureFlags {
  /** Global kill switch — disables ALL calibration */
  globalEnabled: boolean;

  /** Per-workshop-type enable/disable */
  workshopEnabled: Record<WorkshopType, boolean>;

  /** Per-user disable list (user IDs) */
  disabledUsers: Set<string>;

  /** Current calibration level */
  calibrationLevel: CalibrationLevel;

  /** Whether to log shadow scores (even when calibration is disabled) */
  shadowLoggingEnabled: boolean;

  /** Whether pre-screening (Phase 4) is enabled */
  preScreeningEnabled: boolean;

  /** Pre-screening confidence threshold (skip LLM if confidence > this) */
  preScreeningConfidenceThreshold: number;

  /** Whether monitoring alerts are active */
  monitoringEnabled: boolean;
}

/**
 * Default feature flags — conservative starting point.
 */
export const DEFAULT_FEATURE_FLAGS: CalibrationFeatureFlags = {
  globalEnabled: false, // Start disabled, opt-in
  workshopEnabled: {
    experience_rubric: true,
    activity_description: false, // Too thin signal initially
    activity_portfolio: false,
    common_app_essay: true,
    piq_essay: false,
    narrative_workshop: false,
  },
  disabledUsers: new Set(),
  calibrationLevel: CalibrationLevel.SHADOW,
  shadowLoggingEnabled: true,
  preScreeningEnabled: false,
  preScreeningConfidenceThreshold: 0.9,
  monitoringEnabled: true,
};

// ============================================================================
// MASTER CONFIGURATION
// ============================================================================

/**
 * Complete configuration for the Writing Quality Engine's calibration system.
 * This is the single source of truth for all calibration behavior.
 */
export interface WritingQualityEngineConfig {
  // ── Phase Control ──────────────────────────────────────────────
  /** Feature flags */
  featureFlags: CalibrationFeatureFlags;

  // ── Per-Workshop Settings ──────────────────────────────────────
  /** Safety limits by workshop type */
  safetyLimits: Record<WorkshopType, WorkshopSafetyLimits>;

  // ── Calibration Ramp ───────────────────────────────────────────
  /** Requirements to advance between levels */
  advancementCriteria: Record<CalibrationLevel, LevelAdvancementCriteria>;

  // ── Scoring Science Pipeline ───────────────────────────────────
  /** Normalization aggressiveness (0-1) */
  normalizationAggressiveness: number;

  /** Whether to use IRT calibration */
  useIRT: boolean;

  /** Whether to use Bayesian updating */
  useBayesian: boolean;

  /** Whether to use constraint satisfaction */
  useConstraints: boolean;

  /** Whether to use distribution normalization */
  useNormalization: boolean;

  // ── Monitoring ─────────────────────────────────────────────────
  /** Monitoring window size (number of observations) */
  monitoringWindowSize: number;

  /** Alert thresholds */
  alertThresholds: {
    /** Alert if mean abs adjustment exceeds this */
    maxMeanAbsAdjustment: number;
    /** Alert if safety trigger rate exceeds this (0-1) */
    maxSafetyTriggerRate: number;
    /** Alert if mean constraint violations exceed this */
    maxMeanConstraintViolations: number;
    /** Alert if QI drift magnitude exceeds this */
    maxQIDriftMagnitude: number;
  };

  // ── Pre-Screening (Phase 4) ────────────────────────────────────
  /** Pre-screening configuration */
  preScreening: {
    enabled: boolean;
    /** Maximum prior sigma to consider skipping LLM */
    maxPriorSigma: number;
    /** Minimum signal coverage to consider skipping */
    minSignalCoverage: number;
    /** Maximum predicted QI range width to skip */
    maxPredictedQIRange: number;
    /** Estimated LLM cost per essay (for savings calculation) */
    estimatedLLMCostPerEssay: number;
  };
}

/**
 * Default master configuration — safe, conservative starting point.
 */
export const DEFAULT_ENGINE_CONFIG: WritingQualityEngineConfig = {
  featureFlags: DEFAULT_FEATURE_FLAGS,
  safetyLimits: WORKSHOP_SAFETY_LIMITS,
  advancementCriteria: LEVEL_ADVANCEMENT_CRITERIA,
  normalizationAggressiveness: 0.3,
  useIRT: true,
  useBayesian: true,
  useConstraints: true,
  useNormalization: true,
  monitoringWindowSize: 100,
  alertThresholds: {
    maxMeanAbsAdjustment: 1.0,
    maxSafetyTriggerRate: 0.15,
    maxMeanConstraintViolations: 2.0,
    maxQIDriftMagnitude: 3.0,
  },
  preScreening: {
    enabled: false,
    maxPriorSigma: 1.2,
    minSignalCoverage: 0.7,
    maxPredictedQIRange: 25,
    estimatedLLMCostPerEssay: 0.015,
  },
};
