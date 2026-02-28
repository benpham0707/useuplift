/**
 * Pre-Analyzer — Fast Essay Quality Snapshot
 *
 * Wraps the existing analyzeEssay() engine to produce a lightweight
 * EssaySnapshot suitable for improvement planning and regression guarding.
 *
 * PERFORMANCE: ~50-200ms (deterministic feature detection + rubric scoring,
 * no LLM calls). Designed to run ~100x per LLM call in the enhancement loop.
 *
 * Dependencies: analyzeEssay (core analysis engine)
 */

import type { EssaySnapshot } from './types';

/**
 * Pre-analyze essay text and return a quality snapshot.
 *
 * Uses the full 12-dimension rubric scorer (deterministic, no LLM)
 * to produce dimension scores, EQI, and identify weakest areas.
 */
export async function preAnalyze(
  text: string,
  essayType?: string
): Promise<EssaySnapshot> {
  // Lazy import to avoid circular dependencies
  const { analyzeEssay } = await import('@/core/essay/analysis/analysisEngine');

  const report = await analyzeEssay({
    essay_text: text,
    essay_type: essayType,
  });

  // Extract dimension scores as a flat record
  const dimensionScores: Record<string, number> = {};
  for (const dim of report.dimension_scores) {
    dimensionScores[dim.dimension_name] = dim.final_score;
  }

  // Find the 3 weakest dimensions (lowest scores, weighted by importance)
  const sortedDims = [...report.dimension_scores].sort(
    (a, b) => a.final_score - b.final_score
  );
  const weakestDimensions = sortedDims.slice(0, 3).map(d => d.dimension_name);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    text,
    wordCount,
    eqi: report.essay_quality_index,
    dimensionScores,
    impressionLabel: report.impression_label,
    weakestDimensions,
    flags: report.flags,
  };
}

export const preAnalyzer = { preAnalyze };
