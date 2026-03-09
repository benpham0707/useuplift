/**
 * Dimension: Intellectual Vitality & Curiosity (9%)
 * Scoring tier: Heuristic + Haiku
 *
 * FIXED: Previously mismapped to scoreDialogueAction() in analysisEngine.ts.
 * Now properly measures curiosity, research references, idea-life connections.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'intellectual_vitality_curiosity';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Curiosity markers (questions, wonder language)
  score += Math.min(25, f.curiosityMarkerCount * 8);
  if (f.curiosityMarkerCount >= 3) {
    evidence.push('Strong curiosity language detected');
  }
  signals.curiosityMarkers = f.curiosityMarkerCount;

  // Research references (evidence of intellectual engagement)
  score += Math.min(20, f.researchReferenceCount * 7);
  if (f.researchReferenceCount >= 2) {
    evidence.push('Research/intellectual references found');
  }
  signals.researchRefs = f.researchReferenceCount;

  // Questions in essay (genuine inquiry, not rhetorical)
  score += Math.min(15, f.questionCount * 5);
  signals.questionCount = f.questionCount;

  // Growth/learning language
  score += Math.min(15, f.growthLanguageCount * 4);
  signals.growthLanguage = f.growthLanguageCount;

  // Vocabulary richness as proxy for intellectual range
  if (f.vocabularyRichness > 0.6) {
    score += 10;
    evidence.push('Rich vocabulary suggests intellectual breadth');
  }

  // Clause depth as proxy for complex thinking
  if (f.clauseDepthAvg > 1.5) {
    score += 5;
    signals.complexSyntax = true;
  }

  // Penalties
  if (f.curiosityMarkerCount === 0 && f.researchReferenceCount === 0 && f.questionCount === 0) {
    score -= 10;
    evidence.push('No curiosity or intellectual engagement signals');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  // Low confidence if no clear signals — let LLM decide
  const confidence = (f.curiosityMarkerCount + f.researchReferenceCount) >= 3 ? 0.75 : 0.5;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Intellectual Vitality & Curiosity',
  weight: 0.08,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for INTELLECTUAL VITALITY and CURIOSITY.

ESSAY:
"${text}"

Evaluate:
1. CURIOSITY AS NARRATIVE ENGINE: Does intellectual curiosity DRIVE the essay's story — motivating actions, decisions, and growth? Or is it mentioned but disconnected from the narrative? The best essays show curiosity as inseparable from who the writer IS, not something they do on the side.
2. IDEAS IN ACTION (not just mentioned): Are ideas USED — applied, tested, challenged, abandoned, revised? Name-dropping books, theories, or courses WITHOUT showing what the writer DID with those ideas = low score. Connecting an idea to a real choice, experiment, or changed behavior = high score.
3. UNEXPECTED CONNECTIONS: Does the writer connect ideas across domains in ways that reveal how their mind works? A student who connects jazz improvisation to their approach to chemistry reveals intellectual personality. Straightforward "I studied X and found it interesting" reveals nothing.
4. INTELLECTUAL PERSONALITY: Does the essay reveal a DISTINCTIVE way of thinking? AOs want to know: how does this person's mind work? What makes them light up? What questions keep them up at night? Generic intellectual enthusiasm ("I'm fascinated by...") ≠ intellectual personality.
5. INTEGRATION WITH PERSONAL CORE: Does intellectual engagement connect to the essay's emotional/personal story — or is it a separate track? The most compelling essays show how thinking and feeling are intertwined for this writer.

IMPORTANT: This dimension isn't just for "academic" essays. A personal narrative can show tremendous intellectual vitality through HOW the writer processes experience — questioning assumptions, seeking understanding, making surprising connections.

HIGH SCORE (75-100): Curiosity drives the narrative. Ideas are applied, not just mentioned. The reader sees a distinctive intellectual personality that's inseparable from the writer's identity.
MID SCORE (40-74): Some intellectual engagement but not central to the narrative. Ideas mentioned but not fully explored or connected.
LOW SCORE (0-39): No intellectual curiosity visible, or purely performative name-dropping disconnected from the story.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
