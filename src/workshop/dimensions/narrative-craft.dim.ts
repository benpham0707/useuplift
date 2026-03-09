/**
 * Dimension: Narrative Craft & Storytelling (7%)
 * Scoring tier: Heuristic + Haiku
 *
 * Measures scene construction, dialogue use, sensory detail,
 * and show-don't-tell craft. Heuristics detect structural signals;
 * LLM judges quality, immersion, and whether techniques are effective.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const DIMENSION_ID = 'narrative_craft_storytelling';

function heuristicScore(features: ExtractedFeatures): HeuristicResult {
  const signals: Record<string, number | boolean> = {};
  let score = 0;
  const evidence: string[] = [];

  // Scene presence (0-25 points)
  if (features.hasOpeningScene) {
    score += 15;
    evidence.push('Opening scene detected');
    signals.hasOpeningScene = true;
  }
  const sensoryDensity = features.sensoryDetailCount / Math.max(features.wordCount / 100, 1);
  const sensoryScore = Math.min(10, sensoryDensity * 5);
  score += sensoryScore;
  signals.sensoryDensity = sensoryDensity;

  // Dialogue (0-20 points)
  if (features.hasDialogue) {
    score += Math.min(20, features.dialogueCount * 7);
    evidence.push(`${features.dialogueCount} dialogue instance(s)`);
    signals.dialogueCount = features.dialogueCount;
  }

  // Show-don't-tell indicators (0-25 points)
  // High sensory + low filler = showing not telling
  const showScore = Math.min(15, features.sensoryDetailCount * 3) +
                    Math.min(10, Math.max(0, 10 - features.fillerPhraseCount * 2));
  score += showScore;
  signals.showScore = showScore;

  // Sentence variety adds to craft (0-15 points)
  score += features.sentenceVarietyScore * 15;
  signals.sentenceVariety = features.sentenceVarietyScore;

  // Penalties
  if (features.clicheCount > 3) {
    score -= 10;
    evidence.push(`High cliche count: ${features.clicheCount}`);
  }
  if (features.passiveVoiceRatio > 0.3) {
    score -= 5;
    evidence.push('Heavy passive voice use');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Confidence: heuristics can count craft signals but can't judge if they're effective
  // A scene exists ≠ an immersive scene. Dialogue exists ≠ authentic dialogue.
  const signalStrength = (features.hasOpeningScene ? 1 : 0) +
                         (features.hasDialogue ? 1 : 0) +
                         (features.sensoryDetailCount > 3 ? 1 : 0);
  const confidence = Math.min(0.65, 0.45 + signalStrength * 0.07);

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Narrative Craft & Storytelling',
  weight: 0.07,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for NARRATIVE CRAFT & STORYTELLING.

ESSAY:
"${text}"

Evaluate:
1. PURPOSEFUL SCENE-BUILDING: Do scenes exist to reveal WHO the writer is — their values, personality, way of seeing the world? A vivid scene that doesn't reveal character is decoration, not craft. Does the writer spend scene-time proportional to importance?
2. DIALOGUE AS CHARACTER REVELATION: If dialogue exists, does it reveal something about the speaker that narration alone couldn't? Does it show relationships, power dynamics, personality — or just deliver information?
3. STRATEGIC SENSORY DETAIL: Are sensory details chosen for THIS story — the specific details that only this writer would notice? "The fluorescent lights hummed" tells us about a person who notices institutional settings differently. Generic sensory detail ("the sun was warm") adds nothing.
4. SHOW-DON'T-TELL AS TRUST: Does the writer trust the reader to interpret actions, details, and moments — or do they explain what to feel? ("I was devastated" vs showing devastation through what the writer DID next)
5. NARRATIVE INTENTIONALITY: Do craft choices serve the essay's central purpose? Is the story told THIS way for a reason — or is it just chronological by default? Does pacing match meaning (key moments get the most space)?
6. INTERCONNECTION: Do narrative elements reinforce each other? Does a scene in paragraph 2 connect to reflection in paragraph 4? Does the story build toward something, or just sequence events?

HIGH SCORE (75-100): Every scene earns its place by revealing character. Details are specific and strategic. Reader understands WHO this person is through what they notice, say, and do — not what they claim.
MID SCORE (40-74): Some craft elements present but not all purposeful. Scenes exist but don't always reveal character. Some telling alongside showing.
LOW SCORE (0-39): Events summarized, not rendered. Details generic. Reader is informed about what happened but doesn't understand who the writer IS.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1", "quote2"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(DIMENSION_ID, h, l),
};

dimensionRegistry.register(manifest);
