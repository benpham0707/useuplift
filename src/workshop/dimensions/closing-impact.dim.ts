/**
 * Dimension: Closing Impact & Resolution (6%)
 * Scoring tier: Heuristic + Haiku
 *
 * Measures final paragraph strength, resolution quality,
 * callback to opening, and lasting impression.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const DIMENSION_ID = 'closing_impact_resolution';

const WEAK_CLOSINGS = [
  /in conclusion/i,
  /to sum up/i,
  /all in all/i,
  /at the end of the day/i,
  /i learned that/i,
  /this experience taught me/i,
  /i am excited to/i,
  /i can'?t wait to/i,
  /i look forward to/i,
  /i hope to continue/i,
];

function heuristicScore(features: ExtractedFeatures): HeuristicResult {
  const signals: Record<string, number | boolean> = {};
  let score = 0;
  const evidence: string[] = [];
  const rawText = features.rawText;
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim());
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const lastSentences = lastParagraph.split(/[.!?]/).filter(s => s.trim());
  const lastSentence = lastSentences[lastSentences.length - 1] || '';

  // Check for weak closings
  const hasWeakClosing = WEAK_CLOSINGS.some(pattern => pattern.test(lastParagraph));
  if (hasWeakClosing) {
    score = 20;
    evidence.push('Closing matches a weak/cliche pattern');
    signals.weakClosing = true;
  } else {
    score = 45;
  }

  // Reflection in closing
  if (features.reflectionMarkerCount > 0) {
    const lastParagraphLower = lastParagraph.toLowerCase();
    const hasReflection = ['realized', 'understood', 'now i see', 'looking back', 'shifted'].some(
      m => lastParagraphLower.includes(m)
    );
    if (hasReflection) {
      score += 15;
      evidence.push('Reflection present in closing');
    }
  }

  // Sensory/concrete detail in closing (not just abstract)
  const closingWords = lastParagraph.toLowerCase().split(/\s+/);
  const closingSensory = closingWords.filter(w =>
    ['see', 'hear', 'feel', 'touch', 'smell', 'taste', 'warm', 'cold', 'bright', 'dark', 'quiet', 'loud'].includes(w)
  ).length;
  if (closingSensory > 0) {
    score += 10;
    evidence.push('Sensory grounding in closing');
  }

  // Forward-looking (growth projection, but not cliche)
  if (!hasWeakClosing && /\b(will|future|next|ahead|continue|begin|start|ready)\b/i.test(lastParagraph)) {
    score += 5;
    signals.forwardLooking = true;
  }

  // Short, punchy final sentence bonus
  const lastSentenceWords = lastSentence.trim().split(/\s+/).length;
  if (lastSentenceWords <= 12 && lastSentenceWords >= 3) {
    score += 5;
    evidence.push('Concise closing sentence');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = hasWeakClosing ? 0.85 : 0.6; // Weak closings easy to detect; strong closings need LLM

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Closing Impact & Resolution',
  weight: 0.06,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (heuristic: HeuristicResult) => heuristic.confidence < 0.7,
  buildLLMPrompt: (text: string, features: ExtractedFeatures) => {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const lastParagraph = paragraphs[paragraphs.length - 1] || text.slice(-500);
    return `Score the CLOSING of this essay on a 0-100 scale for impact and resolution quality.

CLOSING PARAGRAPH:
"${lastParagraph}"

FULL ESSAY CONTEXT (for opening callback detection):
"${text.slice(0, 300)}..."

Evaluate:
1. REFRAMING THE OPENING: Does the closing TRANSFORM the opening — so that if you reread the first paragraph after the last, you see it differently? This is the hallmark of a great essay. A simple echo ("I started with X, I end with X") is weaker than a genuine reframe where the opening's meaning shifts.
2. EARNED RESOLUTION: Is the closing EARNED by everything that came before — or does it arrive prematurely? A closing that claims growth the essay didn't demonstrate, or resolution the essay didn't build toward, feels hollow. The best closings feel inevitable in hindsight.
3. WHAT THE AO TAKES AWAY: After reading the last sentence, what specific understanding does the AO have about WHO this person is? The closing should crystallize the essay's central revelation. If the AO can't articulate what they learned about this person, the closing failed.
4. FORWARD PROJECTION WITHOUT CLICHE: Does the closing point toward the future in a way that feels specific to THIS person — not generic aspiration? "I can't wait to continue my journey" is cliche. A closing that implies future direction through the lens the essay established is powerful.
5. MEMORABLE FINAL LINE: Is the last sentence one an AO might remember after reading 50 essays? Does it land with impact — through image, insight, or voice — rather than trailing off?
6. AVOIDS SUMMARIZING: Does the closing ADD something — a new layer, a shift, a final image — rather than restating what was already said? Closings that recap the essay's argument waste precious words.

HIGH SCORE (75-100): Closing transforms the opening's meaning, earns its resolution, crystallizes who the writer is, and lands with a memorable final line.
MID SCORE (40-74): Closing works but doesn't elevate. May echo rather than reframe. Resolution present but not surprising.
LOW SCORE (0-39): Cliche closing, premature resolution, or summary. Reader doesn't take away a clear picture of the writer.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["..."] }`;
  },
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(DIMENSION_ID, h, l),
};

dimensionRegistry.register(manifest);
