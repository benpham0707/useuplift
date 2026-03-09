/**
 * Dimension: Authenticity & Specificity of Detail (8%)
 * Scoring tier: Heuristic + Haiku
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'authenticity_specificity_detail';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Sensory details = specificity
  const sensoryDensity = f.sensoryDetailCount / Math.max(f.wordCount / 100, 1);
  score += Math.min(20, sensoryDensity * 10);
  signals.sensoryDensity = sensoryDensity;

  // Dialogue = specific voices
  if (f.hasDialogue) {
    score += Math.min(15, f.dialogueCount * 5);
    evidence.push('Dialogue adds specificity');
  }

  // Low cliche/banned terms = authenticity
  if (f.clicheCount === 0 && f.bannedTermCount === 0) {
    score += 20;
    evidence.push('No cliches or AI-sounding terms');
  } else {
    score -= (f.clicheCount * 3 + f.bannedTermCount * 4);
    if (f.bannedTermCount > 0) evidence.push('AI-sounding terms detected');
  }

  // Vocabulary richness = unique voice
  if (f.vocabularyRichness > 0.6) {
    score += 10;
  }

  // First person + emotion = personal authenticity
  if (f.firstPersonRate > 0.03 && f.emotionWordCount >= 3) {
    score += 10;
    evidence.push('Personal voice with emotional specificity');
  }

  // Numbers in essay (quantified outcomes add credibility)
  const numberMatches = f.rawText.match(/\b\d+\b/g) || [];
  if (numberMatches.length >= 2) {
    score += 10;
    evidence.push('Quantified details present');
    signals.hasNumbers = true;
  }

  // Low filler = clean, authentic writing
  if (f.fillerPhraseCount === 0) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = (f.sensoryDetailCount >= 3 || f.hasDialogue) ? 0.7 : 0.5;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Authenticity & Specificity of Detail',
  weight: 0.07,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for AUTHENTICITY and SPECIFICITY of detail.

ESSAY:
"${text}"

Evaluate:
1. STRATEGICALLY CHOSEN DETAILS: Are details chosen because they're the RIGHT details for THIS story — revealing character, advancing the narrative, or grounding emotion? Specific details that don't serve the essay's purpose are clutter. "Purple nitrile gloves" tells us about a specific medical context. "The room was big" tells us nothing.
2. ONLY-I-COULD-WRITE-THIS TEST: Could these details only come from someone who actually LIVED this experience? Are there insider details — jargon, sensory memories, specific names/places — that prove firsthand knowledge? Or could someone research and imagine all of this?
3. DETAILS AS CHARACTER REVELATION: Do specific details reveal WHO the writer is — what they notice, what they care about, how they see the world? A writer who notices "the way my mother's hands moved faster when she was worried" reveals emotional attunement. Details should function as self-portrait.
4. CONCRETE-TO-ABSTRACT RATIO: Does the essay balance concrete moments with abstract reflection — spending most time in the CONCRETE? Essays that live in abstraction ("I believe in the power of community") lack authenticity. The best essays stay grounded and let the reader draw meaning.
5. CONSISTENCY OF VOICE: Does the level of specificity remain consistent throughout — or does the essay oscillate between vivid scenes and generic summary? Inconsistency suggests the writer has good material but hasn't fully rendered the whole essay.
6. WHAT DETAILS TELL THE AO: After reading, can an AO picture a SPECIFIC person in a SPECIFIC context — or just a vague "good student who overcame something"? The accumulation of authentic detail should build a portrait.

HIGH SCORE (75-100): Details are specific, strategically chosen, and reveal character. Every concrete moment serves the essay's purpose. The writer is clearly someone who lived this.
MID SCORE (40-74): Some specific details but inconsistent. Parts feel generic while others are grounded. Details exist but don't always serve the narrative.
LOW SCORE (0-39): Generic language dominates. "Made a difference," "worked hard," "learned a lot." Details could belong to anyone. No specificity that proves lived experience.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
