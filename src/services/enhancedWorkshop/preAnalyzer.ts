/**
 * Pre-Analyzer — Fast Essay Quality Snapshot
 *
 * Wraps the existing analyzeEssay() engine to produce a lightweight
 * EssaySnapshot suitable for improvement planning and regression guarding.
 *
 * Supports two modes:
 *   1. Legacy (default): 12-dimension analyzeEssay() engine (~50-200ms)
 *   2. New pipeline: 13-dimension hybrid scoring system (~2ms heuristic-only)
 *
 * The new pipeline is activated via useNewScoringPipeline=true flag.
 *
 * PERFORMANCE: ~50-200ms legacy, ~2ms new pipeline (both deterministic, no LLM)
 *
 * Dependencies: analyzeEssay (core analysis engine), workshopBridge (new pipeline)
 */

import type { EssaySnapshot } from './types';

/**
 * Pre-analyze essay text and return a quality snapshot.
 *
 * @param text - Full essay text
 * @param essayType - Optional essay type for context
 * @param useNewPipeline - Use the new 13-dimension hybrid scoring pipeline
 */
export async function preAnalyze(
  text: string,
  essayType?: string,
  useNewPipeline?: boolean
): Promise<EssaySnapshot> {
  // New 13-dimension hybrid pipeline (heuristic-only mode)
  if (useNewPipeline) {
    const { preAnalyzeWithNewPipeline } = await import('./workshopBridge');
    return preAnalyzeWithNewPipeline(text, essayType);
  }

  // Legacy 12-dimension analyzeEssay() engine
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
