/**
 * Annotation Pipeline V2 — Calibration System Type Definitions
 *
 * Types for measuring, comparing, and gating quality across pipeline versions.
 * Supports both the old 13-dimension system (V1) and new 10-dimension system (V2).
 *
 * Used by: qualityScorer, runCalibration, and future CI quality gates.
 */

import type { AnnotationSeverity } from '../../src/pipeline/types';

// ============================================================================
// NEW 10-DIMENSION SYSTEM (V2)
// ============================================================================

/** The 10 V2 dimension IDs with their weights */
export const V2_DIMENSIONS = {
  voice_originality_irreplaceability: 0.14,
  thematic_depth_self_awareness: 0.13,
  emotional_resonance_vulnerability: 0.11,
  intellectual_vitality_curiosity: 0.11,
  memorability_committee_impact: 0.10,
  narrative_craft_scene_construction: 0.10,
  agency_initiative: 0.09,
  structural_coherence_flow: 0.08,
  clarity_of_purpose_throughline: 0.08,
  word_economy_craft: 0.06,
} as const;

export type V2DimensionId = keyof typeof V2_DIMENSIONS;

/** The 13 V1 dimension IDs for backward compat */
export const V1_DIMENSIONS = [
  'narrative_craft_storytelling',
  'structural_coherence_flow',
  'word_economy_craft',
  'opening_hook_engagement',
  'closing_impact_resolution',
  'emotional_resonance_vulnerability',
  'intellectual_vitality_curiosity',
  'thematic_depth_reflection',
  'growth_transformation_arc',
  'authenticity_specificity_detail',
  'tonal_sophistication',
  'argument_rhetorical_craft',
  'originality_voice_authenticity',
] as const;

export type V1DimensionId = (typeof V1_DIMENSIONS)[number];

// ============================================================================
// DIMENSION MAPPING (V1 13-dim → V2 10-dim)
// ============================================================================

/**
 * Maps each V2 dimension to the V1 dimensions it subsumes.
 *
 * Several V2 dimensions merge 2+ V1 dimensions:
 * - voice_originality_irreplaceability ← originality_voice_authenticity + authenticity_specificity_detail
 * - thematic_depth_self_awareness ← thematic_depth_reflection + growth_transformation_arc
 * - narrative_craft_scene_construction ← narrative_craft_storytelling + opening_hook_engagement + closing_impact_resolution
 * - clarity_of_purpose_throughline ← tonal_sophistication + argument_rhetorical_craft
 *
 * New V2 dimensions with no direct V1 source:
 * - memorability_committee_impact (new)
 * - agency_initiative (new)
 */
export const V2_TO_V1_MAPPING: Record<V2DimensionId, V1DimensionId[]> = {
  voice_originality_irreplaceability: [
    'originality_voice_authenticity',
    'authenticity_specificity_detail',
  ],
  thematic_depth_self_awareness: [
    'thematic_depth_reflection',
    'growth_transformation_arc',
  ],
  emotional_resonance_vulnerability: ['emotional_resonance_vulnerability'],
  intellectual_vitality_curiosity: ['intellectual_vitality_curiosity'],
  memorability_committee_impact: [], // new in V2
  narrative_craft_scene_construction: [
    'narrative_craft_storytelling',
    'opening_hook_engagement',
    'closing_impact_resolution',
  ],
  agency_initiative: [], // new in V2
  structural_coherence_flow: ['structural_coherence_flow'],
  clarity_of_purpose_throughline: [
    'tonal_sophistication',
    'argument_rhetorical_craft',
  ],
  word_economy_craft: ['word_economy_craft'],
};

/**
 * Convert V1 dimension scores to approximate V2 scores.
 * For merged dimensions, averages the V1 sources.
 * For new V2 dimensions, returns null (no V1 basis).
 */
export function mapV1ScoresToV2(
  v1Scores: Record<string, number>,
): Record<V2DimensionId, number | null> {
  const result = {} as Record<V2DimensionId, number | null>;

  for (const [v2Id, v1Sources] of Object.entries(V2_TO_V1_MAPPING)) {
    if (v1Sources.length === 0) {
      result[v2Id as V2DimensionId] = null;
    } else {
      const validScores = v1Sources
        .map((v1Id) => v1Scores[v1Id])
        .filter((s): s is number => s !== undefined && s !== null);

      if (validScores.length === 0) {
        result[v2Id as V2DimensionId] = null;
      } else {
        result[v2Id as V2DimensionId] =
          Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
      }
    }
  }

  return result;
}

// ============================================================================
// CALIBRATION ESSAY
// ============================================================================

/** Quality tier for calibration essays — represents expert judgment */
export type QualityTier = 'poor' | 'below_average' | 'average' | 'good' | 'excellent';

/** Narrative arc type */
export type ArcType =
  | 'transformation'
  | 'discovery'
  | 'challenge_overcome'
  | 'identity_formation'
  | 'intellectual_journey'
  | 'community_impact'
  | 'flat'
  | 'unclear';

/** Hook strength assessment */
export type HookStrength = 'arresting' | 'strong' | 'adequate' | 'weak' | 'missing';

/** Expert-rated calibration essay with ground truth scores */
export interface CalibrationEssay {
  /** Unique essay ID (e.g., 'cal_01_excellent_narrative') */
  id: string;

  /** Filename if stored on disk */
  filename: string;

  /** Essay type for profile-aware scoring */
  essayType: string;

  /** The actual essay text */
  text: string;

  /** Word count */
  wordCount: number;

  /** Expert-judged quality tier */
  qualityTier: QualityTier;

  /** Expected EQI score (expert consensus) */
  expectedEQI: number;

  /** Per-dimension expert scores and rationale (V2 dimension IDs) */
  dimensions: Record<string, { score: number; rationale: string }>;

  /** Narrative arc type detected by expert */
  arcType: ArcType;

  /** Expert assessment of opening hook */
  hookStrength: HookStrength;

  /** Top strengths identified by expert */
  keyStrengths: string[];

  /** Top weaknesses identified by expert */
  keyWeaknesses: string[];
}

// ============================================================================
// CALIBRATION RESULT
// ============================================================================

/** Severity distribution counts */
export interface SeverityDistribution {
  critical: number;
  important: number;
  suggestion: number;
  strength: number;
}

/** Result of scoring a single essay against expert ratings */
export interface CalibrationResult {
  /** Essay ID from CalibrationEssay */
  essayId: string;

  /** Pipeline version that produced this result */
  pipelineVersion: string;

  /** ISO timestamp of this run */
  timestamp: string;

  // -- Score accuracy --

  /** Actual EQI produced by the pipeline */
  eqiActual: number;

  /** Expected EQI from expert ratings */
  eqiExpected: number;

  /** Absolute error |actual - expected| */
  eqiError: number;

  /** Per-dimension score comparison */
  dimensionErrors: Record<
    string,
    { actual: number; expected: number; error: number }
  >;

  /** Mean absolute error across all scored dimensions */
  meanAbsoluteError: number;

  // -- Annotation quality --

  /** Total annotation count */
  annotationCount: number;

  /** Unique dimensions covered / total dimensions (0-1) */
  dimensionCoverage: number;

  /** Count of annotations per severity level */
  severityDistribution: SeverityDistribution;

  /** Ratio of strength annotations to total (target: ~0.35) */
  strengthRatio: number;

  // -- Content quality --

  /** Do insights reference specific text? (0-1 heuristic) */
  insightSpecificity: number;

  /** Are suggestions concrete and actionable? (0-1 heuristic) */
  suggestionActionability: number;

  // -- Timing & cost --

  /** Total pipeline latency in ms */
  latencyMs: number;

  /** Estimated API cost in USD */
  costUSD: number;
}

// ============================================================================
// CALIBRATION BASELINE
// ============================================================================

/** Aggregated summary statistics for a calibration run */
export interface CalibrationSummary {
  /** Mean absolute error across all essays */
  overallMAE: number | null;

  /** Per-dimension MAE across all essays */
  perDimensionMAE: Record<string, number>;

  /** Average annotation count per essay */
  avgAnnotationCount: number;

  /** Average dimension coverage (0-1) */
  avgDimensionCoverage: number;

  /** Average strength ratio */
  avgStrengthRatio: number;

  /** Average latency in ms */
  avgLatencyMs: number;

  /** Average cost per essay in USD */
  avgCostUSD: number;

  /** Total cost of all essays in USD */
  totalCostUSD: number;

  /** Optional note (for placeholder baselines) */
  note?: string;
}

/** Stored baseline for comparison */
export interface CalibrationBaseline {
  /** Semantic version of this baseline */
  version: string;

  /** ISO timestamp when baseline was captured */
  timestamp: string;

  /** Pipeline version that produced it */
  pipelineVersion: string;

  /** Per-essay results */
  results: CalibrationResult[];

  /** Aggregated summary */
  summary: CalibrationSummary;
}

// ============================================================================
// CALIBRATION COMPARISON
// ============================================================================

/** Per-essay comparison detail */
export interface EssayComparison {
  essayId: string;
  eqiImproved: boolean;
  maeImproved: boolean;
  baselineEQIError: number;
  currentEQIError: number;
  baselineMAE: number;
  currentMAE: number;
  details: string;
}

/** Overall comparison verdict */
export type ComparisonVerdict = 'improved' | 'regressed' | 'mixed' | 'unchanged';

/** Result of comparing current run to baseline */
export interface CalibrationComparison {
  /** Baseline version compared against */
  baselineVersion: string;

  /** Current pipeline version */
  currentVersion: string;

  /** List of improvements */
  improvements: string[];

  /** List of regressions */
  regressions: string[];

  /** Per-essay breakdown */
  perEssay: EssayComparison[];

  /** Overall verdict */
  verdict: ComparisonVerdict;
}

// ============================================================================
// QUALITY GATES
// ============================================================================

/** Quality gate check result */
export interface QualityGateResult {
  /** Did all gates pass? */
  passed: boolean;

  /** List of gate check descriptions that failed */
  failures: string[];

  /** List of gate check descriptions that passed */
  passes: string[];

  /** Which layer's gates were checked (0-5) */
  layer: number;
}

/** Layer-specific quality gate thresholds */
export interface QualityGateThresholds {
  /** Maximum allowed MAE regression vs baseline (fraction, e.g., 0.10 = 10%) */
  maxMaeRegressionFraction: number;

  /** Maximum allowed per-dimension MAE */
  maxPerDimensionMAE: number;

  /** Minimum required dimension coverage (0-1) */
  minDimensionCoverage: number;

  /** Minimum annotation count per essay */
  minAnnotationCount: number;

  /** Maximum allowed latency per essay (ms) */
  maxLatencyMs: number;

  /** Minimum strength ratio */
  minStrengthRatio: number;

  /** Maximum strength ratio (too many strengths = not critical enough) */
  maxStrengthRatio: number;
}

/**
 * Quality gate thresholds per cathedral layer.
 *
 * Layer 0: Calibration suite runs without errors. Baseline committed.
 * Layer 1: Overall quality >=15% above baseline. Per-dimension <=8pt of expert.
 * Layer 2: Overall quality >=10% above L1. Structure arc correct 8/10.
 * Layer 3: Overall quality >=8% above L2. Deep dive teaching >=4.0/5.0.
 * Layer 4: First annotation <3s. Heuristic scores <500ms. Re-analysis <50%.
 * Layer 5: After 1 month, EQI error >=10% below L4.
 */
export const QUALITY_GATE_THRESHOLDS: Record<number, QualityGateThresholds> = {
  0: {
    maxMaeRegressionFraction: 1.0, // no regression check for Layer 0
    maxPerDimensionMAE: 100, // no per-dim check for Layer 0
    minDimensionCoverage: 0,
    minAnnotationCount: 0,
    maxLatencyMs: 60_000,
    minStrengthRatio: 0,
    maxStrengthRatio: 1.0,
  },
  1: {
    maxMaeRegressionFraction: 0.15, // must be 15% better than baseline
    maxPerDimensionMAE: 8,
    minDimensionCoverage: 0.7,
    minAnnotationCount: 6,
    maxLatencyMs: 30_000,
    minStrengthRatio: 0.2,
    maxStrengthRatio: 0.5,
  },
  2: {
    maxMaeRegressionFraction: 0.10,
    maxPerDimensionMAE: 7,
    minDimensionCoverage: 0.8,
    minAnnotationCount: 8,
    maxLatencyMs: 20_000,
    minStrengthRatio: 0.25,
    maxStrengthRatio: 0.45,
  },
  3: {
    maxMaeRegressionFraction: 0.08,
    maxPerDimensionMAE: 6,
    minDimensionCoverage: 0.9,
    minAnnotationCount: 10,
    maxLatencyMs: 15_000,
    minStrengthRatio: 0.28,
    maxStrengthRatio: 0.42,
  },
  4: {
    maxMaeRegressionFraction: 0.05,
    maxPerDimensionMAE: 5,
    minDimensionCoverage: 0.9,
    minAnnotationCount: 10,
    maxLatencyMs: 3_000, // first annotation <3s
    minStrengthRatio: 0.30,
    maxStrengthRatio: 0.40,
  },
  5: {
    maxMaeRegressionFraction: 0.03,
    maxPerDimensionMAE: 4,
    minDimensionCoverage: 0.95,
    minAnnotationCount: 10,
    maxLatencyMs: 3_000,
    minStrengthRatio: 0.30,
    maxStrengthRatio: 0.40,
  },
};
