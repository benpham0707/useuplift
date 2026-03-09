/**
 * Dimension: Growth & Transformation Arc (8%)
 * Scoring tier: Heuristic + Haiku
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'growth_transformation_arc';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Growth/change language
  score += Math.min(30, f.growthLanguageCount * 8);
  if (f.growthLanguageCount >= 3) {
    evidence.push('Strong growth language throughout');
  }
  signals.growthLanguage = f.growthLanguageCount;

  // Vulnerability supports authentic transformation
  score += Math.min(20, f.vulnerabilityMarkerCount * 7);
  if (f.vulnerabilityMarkerCount >= 2) {
    evidence.push('Vulnerability anchors the growth arc');
  }

  // Reflection markers = processing the change
  score += Math.min(15, f.reflectionMarkerCount * 6);

  // Temporal markers suggest arc over time
  const rawLower = f.rawText.toLowerCase();
  const temporalMarkers = ['before', 'after', 'used to', 'now i', 'once', 'eventually', 'finally', 'at first', 'over time'];
  const temporalCount = temporalMarkers.filter(m => rawLower.includes(m)).length;
  score += Math.min(15, temporalCount * 5);
  if (temporalCount >= 3) {
    evidence.push('Temporal arc markers present');
  }
  signals.temporalMarkers = temporalCount;

  // Counterpoints show genuine struggle
  score += Math.min(10, f.counterpointCount * 5);

  // Penalty: no growth language at all
  if (f.growthLanguageCount === 0) {
    score -= 10;
    evidence.push('No growth or change language detected');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = f.growthLanguageCount >= 2 ? 0.7 : 0.5;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Growth & Transformation Arc',
  weight: 0.07,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for GROWTH and TRANSFORMATION ARC.

ESSAY:
"${text}"

Evaluate:
1. SHOWN vs STATED TRANSFORMATION: Is growth DEMONSTRATED through changed behavior, decisions, or perspective — or merely STATED? "I learned to be more empathetic" is stated. Showing the writer doing something differently because they now see the world differently is demonstrated. The best essays never need to SAY "I grew."
2. EARNED THROUGH STRUGGLE: Does transformation emerge from genuine difficulty, conflict, or tension — or is it handed to the writer? "I volunteered and learned the world is unfair" feels unearned. "I kept showing up even when [specific setback] made me question everything" feels earned.
3. SPECIFICITY TO THIS PERSON: Could this transformation story belong to ANYONE, or is it uniquely this writer's? "I became more confident" could be anyone. Growth that's specific to this person's particular situation, values, and context is powerful.
4. OPENING-TO-CLOSING ARC: Does the essay's structure embody the transformation? The opening should establish the "before" state, and the closing should show (not just tell) the "after." Does rereading the opening after the closing reveal how far the writer has traveled?
5. ONGOING vs COMPLETE: The most authentic growth is still IN PROGRESS — the writer is still wrestling, still evolving. Neat resolutions ("and now I'm a better person") feel false. Comfort with incompleteness signals maturity.
6. WHAT GROWTH REVEALS: What does this transformation tell an AO about the kind of person, student, and community member this writer would be? Growth should point FORWARD — not just backward at what happened.

HIGH SCORE (75-100): Growth is shown through specific changed behavior, earned through real struggle, unique to this writer, and still evolving. The essay's structure mirrors the transformation.
MID SCORE (40-74): Clear before/after exists but may be stated rather than shown. Transformation present but somewhat generic.
LOW SCORE (0-39): Growth is asserted ("I learned...") without evidence. Generic life lessons. No visible struggle or specificity.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
