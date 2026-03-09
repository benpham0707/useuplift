/**
 * Summary Generator — Derives high-level essay summary from annotations + scores
 *
 * Phase 1C of the annotation pipeline V2. Produces post-analysis summary
 * from the annotations and dimension scores produced by Phases 1-4.
 *
 * Produces:
 * - Top 3 strengths (dimension-weighted, not just confidence-sorted)
 * - Top 3 improvements (severity * dimension_weight ranked)
 * - Overall insight using EQI band + strongest/weakest dimensions
 *
 * Replaces the simpler buildSummary() in annotationPipeline.ts with
 * dimension-aware ranking and EQI-band-specific natural language templates.
 *
 * Pure function — no LLM calls, no side effects.
 */

import type {
  EssayAnnotation,
  DerivedDimensionScore,
  AnnotationSeverity,
} from './types';

// ============================================================================
// PUBLIC INTERFACE
// ============================================================================

/** Input for the summary generator */
export interface SummaryGeneratorInput {
  /** All annotations produced by Phase 3 */
  annotations: EssayAnnotation[];
  /** Per-dimension scores derived in Phase 4 */
  dimensionScores: DerivedDimensionScore[];
  /** Essay Quality Index (0-100) */
  eqi: number;
  /** Human-readable impression label */
  impressionLabel: string;
}

/** Summary output matching AnnotatedAnalysisResult.summary */
interface SummaryOutput {
  strengths: string[];
  improvements: string[];
  overallInsight: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Severity rank mapping — higher rank means more urgent.
 * Used to weight issue annotations by severity when ranking improvements.
 */
const SEVERITY_RANK: Record<AnnotationSeverity, number> = {
  critical: 3,
  important: 2,
  suggestion: 1,
  strength: 0,
};

/** Maximum number of strengths/improvements to include in summary */
const TOP_N = 3;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a lookup map from dimensionId to effectiveWeight.
 * Defaults to 0 for unknown dimensions (defensive).
 */
function buildWeightMap(dimensionScores: DerivedDimensionScore[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const ds of dimensionScores) {
    map.set(ds.dimensionId, ds.effectiveWeight);
  }
  return map;
}

/**
 * Find the strongest dimension (highest score) and weakest dimension (lowest score).
 * Returns displayName for natural language use.
 */
function findStrongestAndWeakest(
  dimensionScores: DerivedDimensionScore[],
): { strongest: string; weakest: string } {
  if (dimensionScores.length === 0) {
    return { strongest: 'overall writing quality', weakest: 'overall writing quality' };
  }

  let strongest = dimensionScores[0];
  let weakest = dimensionScores[0];

  for (const ds of dimensionScores) {
    if (ds.score > strongest.score) {
      strongest = ds;
    }
    if (ds.score < weakest.score) {
      weakest = ds;
    }
  }

  return {
    strongest: strongest.displayName,
    weakest: weakest.displayName,
  };
}

/**
 * Rank strength annotations by confidence * dimensionWeight (DESC).
 * Returns the top N insight strings.
 */
function rankStrengths(
  annotations: EssayAnnotation[],
  weightMap: Map<string, number>,
): string[] {
  return annotations
    .filter((a) => a.isStrength)
    .map((a) => ({
      insight: a.insight,
      rank: a.confidence * (weightMap.get(a.dimensionId) ?? 0),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, TOP_N)
    .map((item) => item.insight);
}

/**
 * Rank issue annotations by severityRank * dimensionWeight (DESC).
 * Returns the top N suggestion strings.
 */
function rankImprovements(
  annotations: EssayAnnotation[],
  weightMap: Map<string, number>,
): string[] {
  return annotations
    .filter((a) => !a.isStrength)
    .map((a) => ({
      suggestion: a.suggestion,
      rank: SEVERITY_RANK[a.severity] * (weightMap.get(a.dimensionId) ?? 0),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, TOP_N)
    .map((item) => item.suggestion);
}

/**
 * Count annotations matching a severity level.
 */
function countBySeverity(annotations: EssayAnnotation[], severity: AnnotationSeverity): number {
  return annotations.filter((a) => a.severity === severity).length;
}

/**
 * Generate a natural 2-3 sentence overall insight using EQI band,
 * strongest dimension, weakest dimension, and annotation counts.
 *
 * EQI Bands:
 *   85+  : Exceptional quality
 *   70-84: Strong essay
 *   55-69: Solid foundations
 *   40-54: Shows potential
 *   <40  : Needs substantial revision
 */
function generateOverallInsight(
  eqi: number,
  annotations: EssayAnnotation[],
  dimensionScores: DerivedDimensionScore[],
): string {
  // Edge case: no annotations (heuristic-only fallback)
  if (annotations.length === 0) {
    return 'Analysis completed using heuristic scoring only. No LLM annotations were generated for this essay.';
  }

  const { strongest, weakest } = findStrongestAndWeakest(dimensionScores);
  const strengthCount = annotations.filter((a) => a.isStrength).length;
  const criticalCount = countBySeverity(annotations, 'critical');

  if (eqi >= 85) {
    const refinement =
      strongest === weakest
        ? 'Minor polish across dimensions could push it even further.'
        : `To reach its full potential, consider refining ${weakest}.`;
    return `This essay demonstrates exceptional quality, particularly in ${strongest}. ${refinement}`;
  }

  if (eqi >= 70) {
    const guidance =
      strongest === weakest
        ? 'Targeted revision of your weaker passages would make a meaningful difference.'
        : `Focused revision on ${weakest} would make the biggest difference.`;
    return `This is a strong essay with clear strengths in ${strongest}. ${guidance}`;
  }

  if (eqi >= 55) {
    return (
      `This essay has solid foundations with ${strengthCount} notable ` +
      `strength${strengthCount !== 1 ? 's' : ''}. The primary opportunity ` +
      `for growth is in ${weakest}, which would have the highest impact ` +
      `on overall quality.`
    );
  }

  if (eqi >= 40) {
    return (
      `This essay shows potential but needs significant development, ` +
      `particularly in ${weakest}. Build on your strength in ${strongest} ` +
      `while addressing ${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''}.`
    );
  }

  // EQI < 40
  return (
    `This essay needs substantial revision. Start by addressing the ` +
    `${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''}, ` +
    `then focus on ${weakest}. Your use of ${strongest} shows promise to build on.`
  );
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate a high-level essay summary from annotations and dimension scores.
 *
 * Unlike the simpler buildSummary() in annotationPipeline.ts, this version:
 * - Weights strengths by `confidence * dimensionWeight` (not just confidence)
 * - Weights improvements by `severityRank * dimensionWeight` (not just severity order)
 * - Uses EQI-band-specific templates with strongest/weakest dimension names
 *
 * @param input - Annotations, dimension scores, EQI, and impression label
 * @returns Summary with top 3 strengths, top 3 improvements, and overall insight
 */
export function generateSummary(input: SummaryGeneratorInput): SummaryOutput {
  const { annotations, dimensionScores, eqi } = input;

  const weightMap = buildWeightMap(dimensionScores);

  const strengths = rankStrengths(annotations, weightMap);
  const improvements = rankImprovements(annotations, weightMap);
  const overallInsight = generateOverallInsight(eqi, annotations, dimensionScores);

  return {
    strengths,
    improvements,
    overallInsight,
  };
}
