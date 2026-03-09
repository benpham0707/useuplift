/**
 * Dimension: Tonal Sophistication (6%) — NEW
 * Scoring tier: Heuristic + Haiku
 *
 * Detects tone shifts, register control, emotional pacing.
 * This dimension was missing from v1.0.1 (only narrative dimensions existed).
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'tonal_sophistication';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Sentence variety = tonal variation (long/short mixing creates rhythm)
  score += Math.round(f.sentenceVarietyScore * 25);
  if (f.sentenceVarietyScore > 0.7) {
    evidence.push('Strong sentence variety suggests tonal control');
  }
  signals.sentenceVariety = f.sentenceVarietyScore;

  // Formality score extremes are bad (pure formal OR pure casual = monotone)
  // Best: 0.3-0.7 (register mixing)
  const formalityVariance = 1 - Math.abs(f.formalityScore - 0.5) * 2;
  score += Math.round(formalityVariance * 15);
  signals.formalityVariance = formalityVariance;

  // Contraction mixing (some contractions = natural voice; all or none = rigid)
  if (f.contractionRate > 0.1 && f.contractionRate < 0.6) {
    score += 10;
    evidence.push('Natural contraction usage');
  }

  // Emotion words in varied positions suggest emotional pacing
  if (f.emotionWordCount >= 3 && f.paragraphCount >= 3) {
    score += 10;
    evidence.push('Emotional language distributed across essay');
  }

  // Short sentences interspersed with long = deliberate pacing
  if (f.shortSentenceRatio > 0.1 && f.longSentenceRatio > 0.1) {
    score += 10;
    evidence.push('Deliberate short/long sentence mixing');
    signals.mixedLengths = true;
  }

  // Question marks suggest tonal shifts (inquiry mode)
  if (f.questionCount >= 1) {
    score += 5;
  }

  // Penalties for monotone indicators
  if (f.sentenceLengthVariance < 10) {
    score -= 10;
    evidence.push('Low sentence length variance — monotonous tone');
  }
  if (f.passiveVoiceRatio > 0.3) {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  // Tonal sophistication is genuinely hard to assess deterministically
  const confidence = 0.5;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Tonal Sophistication',
  weight: 0.06,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for TONAL SOPHISTICATION.

ESSAY:
"${text}"

Evaluate:
1. TONE SERVES NARRATIVE PURPOSE: Do tonal shifts happen BECAUSE the content demands them — not randomly? A shift from playful to serious should mark a genuine turning point. A shift from intimate to expansive should signal the essay zooming out to meaning. Tonal shifts that don't serve the story are distracting.
2. REGISTER MATCHES CONTENT: Does the formality/informality of the prose match what's being described? Describing a childhood memory in academic prose feels wrong. Discussing an intellectual breakthrough in slang feels wrong. The best writers adjust register instinctively to match their material.
3. EMOTIONAL PACING AS ARCHITECTURE: Does the essay build, release, and rebuild tension intentionally? Does the emotional temperature change across paragraphs in a way that creates a reading EXPERIENCE? Or is it flat — same emotional intensity throughout?
4. SENTENCE RHYTHM AS MEANING: Are short sentences placed where impact matters? Are flowing sentences used where reflection deepens? Does rhythm REINFORCE content — staccato for urgency, longer structures for contemplation? Or is sentence length random?
5. HUMOR, IRONY, OR UNDERSTATEMENT: If present, do these tonal choices reveal personality and serve the essay's purpose? Humor that deflects from vulnerability = weakness. Humor that shows self-awareness while maintaining emotional honesty = sophistication. Understatement that lets the reader feel more than the writer claims = mastery.
6. TONAL CONSISTENCY ACROSS THE ESSAY: Does the essay feel like ONE person wrote ALL of it — or do some paragraphs feel like they belong to a different essay? Tonal inconsistency often signals patchwork editing or AI assistance.

HIGH SCORE (75-100): Tonal shifts are deliberate, serve the narrative arc, and reveal a writer in full control. Register, rhythm, and emotional pacing all reinforce the essay's purpose.
MID SCORE (40-74): Some tonal awareness but inconsistent. Shifts happen but aren't always purposeful. Register is mostly appropriate.
LOW SCORE (0-39): Monotone throughout, or jarring unintentional shifts. No evidence of deliberate tonal control.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
