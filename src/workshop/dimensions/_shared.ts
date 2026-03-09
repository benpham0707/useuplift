/**
 * Shared helpers for dimension scorers.
 * Common patterns for LLM prompt building, response parsing, and score fusion.
 */

import type { HeuristicResult, LLMScoreResult, FinalDimensionScore, FusionMetadata } from '../shared/types';

/**
 * Standard LLM response parser. Expects JSON: { score, confidence, reasoning, evidence }
 */
export function parseStandardLLMResponse(raw: string): LLMScoreResult {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
      reasoning: String(parsed.reasoning || ''),
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.map(String) : [],
      tokenUsage: { inputTokens: 0, outputTokens: 0 },
    };
  } catch {
    return {
      score: 50,
      confidence: 0.3,
      reasoning: 'Failed to parse LLM response',
      evidence: [],
      tokenUsage: { inputTokens: 0, outputTokens: 0 },
    };
  }
}

/**
 * Standard confidence-weighted score fusion.
 */
export function fuseByConfidence(
  dimensionId: string,
  heuristic: HeuristicResult,
  llm?: LLMScoreResult,
): FinalDimensionScore {
  if (!llm) {
    return {
      dimensionId,
      score: heuristic.score,
      source: 'heuristic_only',
      heuristicResult: heuristic,
      evidence: heuristic.evidence,
    };
  }

  const hWeight = heuristic.confidence;
  const lWeight = llm.confidence;
  const total = hWeight + lWeight;
  const fusedScore = Math.round((heuristic.score * hWeight + llm.score * lWeight) / total);
  const dominant = hWeight >= lWeight ? 'heuristic_dominant' : 'llm_dominant';

  return {
    dimensionId,
    score: Math.max(0, Math.min(100, fusedScore)),
    source: dominant,
    heuristicResult: heuristic,
    llmResult: llm,
    evidence: [...heuristic.evidence, ...llm.evidence],
  };
}

/** Noop LLM result for heuristic-only dimensions */
export const NOOP_LLM_RESULT: LLMScoreResult = {
  score: 0, confidence: 0, reasoning: '', evidence: [],
  tokenUsage: { inputTokens: 0, outputTokens: 0 },
};

/**
 * Determine the confidence-based LLM/heuristic blend ratio.
 * Graduated tiers instead of a binary threshold.
 */
function getConfidenceBlend(confidence: number): { llmWeight: number; heuristicWeight: number; tier: FusionMetadata['confidenceTier'] } {
  if (confidence >= 0.7) {
    return { llmWeight: 1.0, heuristicWeight: 0.0, tier: 'high' };
  }
  if (confidence >= 0.5) {
    return { llmWeight: 0.8, heuristicWeight: 0.2, tier: 'moderate' };
  }
  if (confidence >= 0.3) {
    return { llmWeight: 0.6, heuristicWeight: 0.4, tier: 'low' };
  }
  return { llmWeight: 0.5, heuristicWeight: 0.5, tier: 'very_low' };
}

/**
 * Determine divergence-based anchoring ratio toward heuristic.
 * Graduated tiers that pull toward heuristic proportionally to disagreement.
 */
function getDivergenceAnchoring(divergence: number): { anchorWeight: number; tier: FusionMetadata['divergenceTier'] } {
  if (divergence <= 20) {
    return { anchorWeight: 0.0, tier: 'none' };
  }
  if (divergence <= 35) {
    return { anchorWeight: 0.10, tier: 'soft' };
  }
  if (divergence <= 50) {
    return { anchorWeight: 0.20, tier: 'medium' };
  }
  return { anchorWeight: 0.30, tier: 'heavy' };
}

/** Safely clamp a score to 0-100, guarding against NaN */
function clampScore(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 50; // safe fallback
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * LLM-primary score fusion for narrative dimensions (haiku+sonnet tier).
 *
 * The LLM IS the scorer. Heuristic patterns cannot handle the nuance of
 * narrative evaluation — they measure what text IS but not what it DOES.
 *
 * When LLM is available: LLM score is the score, period.
 * When LLM fails: heuristic fallback.
 * Divergence is logged for monitoring but does NOT adjust the score.
 */
export function fuseNarrativeScores(
  dimensionId: string,
  heuristic: HeuristicResult,
  llm?: LLMScoreResult,
): FinalDimensionScore {
  // No LLM (API error) -> heuristic fallback
  if (!llm) {
    return {
      dimensionId,
      score: clampScore(heuristic.score),
      source: 'heuristic_only',
      heuristicResult: heuristic,
      evidence: heuristic.evidence,
    };
  }

  // Sanitize inputs
  const llmScore = clampScore(llm.score);
  const heuristicScore = clampScore(heuristic.score);
  const confidence = Math.max(0, Math.min(1, isNaN(llm.confidence) ? 0 : llm.confidence));

  // LLM IS the score — no heuristic blending
  const finalScore = llmScore;

  // Track divergence for monitoring/calibration only (does NOT affect score)
  const divergence = Math.abs(llmScore - heuristicScore);
  const confidenceTier: FusionMetadata['confidenceTier'] =
    confidence >= 0.7 ? 'high' :
    confidence >= 0.5 ? 'moderate' :
    confidence >= 0.3 ? 'low' : 'very_low';
  const divergenceTier: FusionMetadata['divergenceTier'] =
    divergence <= 20 ? 'none' :
    divergence <= 35 ? 'soft' :
    divergence <= 50 ? 'medium' : 'heavy';

  const fusionMetadata: FusionMetadata = {
    divergence,
    confidenceTier,
    divergenceTier,
    preAnchorScore: llmScore, // No anchoring — LLM score IS the pre-anchor score
  };

  // Log heavy divergence for calibration monitoring
  if (divergenceTier === 'heavy') {
    console.warn(
      `[${dimensionId}] Heavy LLM/heuristic divergence (${divergence}pts): LLM=${llmScore} (conf=${confidence.toFixed(2)}), heuristic=${heuristicScore}. ` +
      `Using LLM score directly — heuristic patterns cannot assess narrative nuance.`
    );
  }

  return {
    dimensionId,
    score: finalScore,
    source: 'llm_only',
    heuristicResult: heuristic,
    llmResult: llm,
    evidence: [...llm.evidence, ...heuristic.evidence],
    fusionMetadata,
  };
}
