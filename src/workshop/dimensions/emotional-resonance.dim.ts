/**
 * Dimension: Emotional Resonance & Vulnerability (8%)
 * Scoring tier: Heuristic + Haiku
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'emotional_resonance_vulnerability';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Emotion word density
  const emotionDensity = f.emotionWordCount / Math.max(f.wordCount / 100, 1);
  score += Math.min(25, emotionDensity * 12);
  signals.emotionDensity = emotionDensity;

  // Vulnerability markers
  score += Math.min(30, f.vulnerabilityMarkerCount * 8);
  if (f.vulnerabilityMarkerCount >= 3) {
    evidence.push('Multiple vulnerability markers detected');
    signals.multipleVulnerability = true;
  } else if (f.vulnerabilityMarkerCount === 0) {
    evidence.push('No vulnerability markers detected');
  }
  signals.vulnerabilityCount = f.vulnerabilityMarkerCount;

  // First-person rate (high = more personal/emotional)
  if (f.firstPersonRate > 0.04) {
    score += 10;
    signals.highFirstPerson = true;
  }

  // Sensory detail supports emotional showing
  score += Math.min(15, f.sensoryDetailCount * 3);

  // Question marks suggest inner debate
  if (f.questionCount >= 2) {
    score += 10;
    evidence.push('Inner questioning detected');
  }

  // Penalties
  if (f.clicheCount > 2) score -= 10;
  if (f.emotionWordCount === 0) score -= 15;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = f.vulnerabilityMarkerCount >= 2 ? 0.75 : 0.55;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Emotional Resonance & Vulnerability',
  weight: 0.08,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for EMOTIONAL RESONANCE and VULNERABILITY.

ESSAY:
"${text}"

Evaluate:
1. EMOTIONAL ARC (not just presence): Do emotions ESCALATE and EVOLVE through the essay — building, shifting, deepening — or are they static? "I was scared, then I was proud" is a list. An emotional arc shows the reader HOW fear transformed into something else through specific moments.
2. STRATEGIC VULNERABILITY: Is vulnerability deployed with PURPOSE — serving the essay's transformation arc? Admitting a fear that connects to the essay's central growth is powerful. Random vulnerability ("I also struggle with anxiety") that doesn't connect to the story is performative.
3. EMOTIONAL COMPLEXITY: Does the writer hold CONTRADICTORY emotions simultaneously? The most resonant essays capture mixed feelings — pride and guilt, love and resentment, confidence and doubt — not simple before/after emotional states.
4. SHOWN vs LABELED EMOTIONS: Are emotions RENDERED through specific actions, physical sensations, and moments — or just named? "My hands shook as I pressed send" vs "I was nervous." Does the reader FEEL what the writer felt?
5. WHAT EMOTIONS REVEAL: Do the emotional moments reveal something specific about WHO this person is — their values, fears, what they care about deeply? An AO should finish reading and understand what drives this person emotionally.
6. EARNED EMOTIONAL WEIGHT: Are the emotional stakes proportional to the essay's scope? Does the reader understand WHY this mattered so much to this specific person?

HIGH SCORE (75-100): Emotions build through the essay, are shown through concrete detail, reveal the writer's core identity, and feel genuinely complex.
MID SCORE (40-74): Emotions present but sometimes labeled rather than shown. Some vulnerability but not fully integrated with the essay's arc.
LOW SCORE (0-39): Emotions are named but not felt. Vulnerability absent or performative. Reader is told how to feel rather than moved.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1", "quote2"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
