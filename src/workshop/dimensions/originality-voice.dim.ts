/**
 * Dimension: Originality, Voice & Authenticity (10%)
 * Scoring tier: Heuristic + Sonnet (highest-weight dimension)
 *
 * Uses Sonnet for deep scoring because voice/authenticity assessment
 * requires nuance that keyword heuristics can't capture.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'originality_voice_authenticity';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Vocabulary uniqueness
  if (f.vocabularyRichness > 0.65) {
    score += 15;
    evidence.push('Rich, diverse vocabulary');
  } else if (f.vocabularyRichness > 0.55) {
    score += 8;
  }
  signals.vocabularyRichness = f.vocabularyRichness;

  // Sentence variety = distinctive rhythm
  score += Math.round(f.sentenceVarietyScore * 15);
  signals.sentenceVariety = f.sentenceVarietyScore;

  // Anti-authenticity signals
  if (f.bannedTermCount > 0) {
    score -= f.bannedTermCount * 8;
    evidence.push(`${f.bannedTermCount} AI-sounding terms detected`);
    signals.bannedTerms = f.bannedTermCount;
  }
  if (f.clicheCount > 2) {
    score -= f.clicheCount * 5;
    evidence.push('Cliche-heavy writing undermines voice');
  }

  // Contraction usage = natural voice (if mixed)
  if (f.contractionRate > 0.1 && f.contractionRate < 0.5) {
    score += 5;
  }

  // First-person markers + emotion = personal voice
  if (f.firstPersonRate > 0.03 && f.emotionWordCount >= 2) {
    score += 10;
  }

  // Sensory detail = specificity that only this writer would include
  score += Math.min(10, f.sensoryDetailCount * 2);

  // Dialogue = distinct voices
  if (f.hasDialogue) score += 5;

  // Baseline: move towards 40 if no strong signals either way
  if (score < 20 && f.clicheCount === 0 && f.bannedTermCount === 0) {
    score = 35;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  // Voice authenticity is the hardest thing to assess deterministically
  const confidence = f.bannedTermCount > 2 ? 0.7 : 0.45; // More confident about bad voice than good

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Originality, Voice & Authenticity',
  weight: 0.09,
  scoringTier: 'heuristic+sonnet',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.8, // Higher threshold for Sonnet
  buildLLMPrompt: (text) => `Score this essay 0-100 for ORIGINALITY, VOICE, and AUTHENTICITY.

ESSAY:
"${text}"

You are an experienced admissions reader who has read 10,000+ essays. Evaluate:

1. VOICE AS IDENTITY: Does this sound like a SPECIFIC person with a distinctive way of seeing the world — or could any competent writer have produced it? Look for:
   - Sentence rhythms that feel like THIS person's natural cadence
   - Word choices that reveal background, personality, or perspective
   - Lines that only THIS writer could produce (the "fingerprint test")
   - Consistency of voice across the entire essay (not just in strong moments)

2. VOICE EVOLUTION: Does the voice DEVELOP through the essay — becoming more confident, more vulnerable, more reflective — as the narrative demands? A static voice across a transformation essay is a missed opportunity. The best essays show the writer's voice changing as they change.

3. ORIGINALITY OF ANGLE (not just topic): Common topics (sports, immigration, death of grandparent) can score HIGH if the angle is genuinely fresh. Uncommon topics can score LOW if treated generically. The question is: does this essay show the reader something they haven't seen before — a new way of looking at a familiar experience?

4. AUTHENTICITY AS COHERENCE: Do voice, detail, emotion, and reflection all point toward the SAME person? Inauthenticity often shows up as mismatches — mature vocabulary with shallow reflection, vivid scenes with generic insight, bold vulnerability with cliche resolution. The most authentic essays feel seamlessly integrated.

5. ANTI-PATTERNS:
   - AI-convergence vocabulary (delve, tapestry, myriad, beacon, multifaceted, embark, foster, pivotal) = major red flag
   - College essay tropes ("Since I was young...", "I'm passionate about...", "This experience taught me...") = low originality
   - "Essay voice" (formal, distant, committee-ready prose) that sounds nothing like a 17-year-old = low authenticity

Quote 2-3 specific lines as evidence for your score.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["exact quote 1", "exact quote 2"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
