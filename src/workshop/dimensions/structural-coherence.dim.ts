/**
 * Dimension: Structural Coherence & Flow (8%)
 * Scoring tier: Heuristic only
 *
 * Measures paragraph architecture, transitions, logical flow, and pacing.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult, FinalDimensionScore } from '../shared/types';

const DIMENSION_ID = 'structural_coherence_flow';

function heuristicScore(features: ExtractedFeatures): HeuristicResult {
  const signals: Record<string, number | boolean> = {};
  let score = 0;
  const evidence: string[] = [];

  // Paragraph structure (0-25 points)
  if (features.paragraphCount >= 3 && features.paragraphCount <= 8) {
    score += 15;
    signals.goodParagraphCount = true;
  } else if (features.paragraphCount >= 2) {
    score += 8;
  }
  // Consistent paragraph lengths (not wildly varying)
  if (features.avgParagraphLength >= 2 && features.avgParagraphLength <= 6) {
    score += 10;
    evidence.push('Well-sized paragraphs');
  }

  // Transitions (0-25 points)
  const transitionDensity = features.transitionWordCount / Math.max(features.paragraphCount, 1);
  score += Math.min(15, transitionDensity * 8);
  score += features.paragraphTransitionQuality * 10;
  signals.transitionDensity = transitionDensity;
  signals.paragraphTransitionQuality = features.paragraphTransitionQuality;

  // Sentence variety = good pacing (0-20 points)
  score += features.sentenceVarietyScore * 20;
  if (features.sentenceVarietyScore > 0.6) {
    evidence.push('Good sentence variety for pacing');
  }

  // Logical flow proxies (0-15 points)
  // Low filler + good transitions = logical flow
  const fillerPenalty = Math.min(10, features.fillerPhraseCount * 2);
  score += 15 - fillerPenalty;

  // Coherence bonus for balanced paragraph lengths
  if (features.paragraphCount >= 3) {
    score += 5;
  }

  // Penalties
  if (features.paragraphCount === 1) {
    score -= 15;
    evidence.push('Single paragraph — no structural breaks');
  }
  if (features.sentenceLengthVariance < 5) {
    score -= 5;
    evidence.push('Low sentence length variance — monotonous pacing');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const confidence = Math.min(0.9, 0.65 + (features.paragraphCount > 2 ? 0.1 : 0) + (features.transitionWordCount > 3 ? 0.1 : 0));

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Structural Coherence & Flow',
  weight: 0.07,
  scoringTier: 'heuristic',
  heuristicScore,
  shouldTriggerLLM: () => false,
  buildLLMPrompt: () => '',
  parseLLMResponse: () => ({ score: 0, confidence: 0, reasoning: '', evidence: [], tokenUsage: { inputTokens: 0, outputTokens: 0 } }),
  fuseScores: (heuristic: HeuristicResult): FinalDimensionScore => ({
    dimensionId: DIMENSION_ID,
    score: heuristic.score,
    source: 'heuristic_only',
    heuristicResult: heuristic,
    evidence: heuristic.evidence,
  }),
};

dimensionRegistry.register(manifest);
