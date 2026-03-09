/**
 * Dimension: Opening Hook & Engagement (6%)
 * Scoring tier: Heuristic + Haiku
 *
 * Measures first-sentence hook quality, scene entry, reader engagement.
 * Heuristics detect weak patterns and structural signals; LLM judges
 * whether the opening creates genuine curiosity and compels reading.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const DIMENSION_ID = 'opening_hook_engagement';

const WEAK_OPENINGS = [
  /^(ever )?since i was (young|a child|little|small)/i,
  /^i have always been passionate about/i,
  /^growing up/i,
  /^in today'?s society/i,
  /^throughout (my|human) history/i,
  /^webster'?s dictionary defines/i,
  /^"[^"]{0,20}" [-—] [A-Z]/i, // Starts with a quote from someone famous
  /^i always knew/i,
  /^from a young age/i,
  /^the importance of/i,
];

function heuristicScore(features: ExtractedFeatures): HeuristicResult {
  const signals: Record<string, number | boolean> = {};
  let score = 0;
  const evidence: string[] = [];
  const rawText = features.rawText;
  const firstParagraph = rawText.split(/\n\s*\n/)[0] || '';
  const firstSentence = firstParagraph.split(/[.!?]/)[0] || '';

  // Check for weak openings (penalty)
  const hasWeakOpening = WEAK_OPENINGS.some(pattern => pattern.test(firstSentence.trim()));
  if (hasWeakOpening) {
    score = 15;
    evidence.push('Opening matches a weak/cliche pattern');
    signals.weakOpening = true;
  } else {
    score = 40; // baseline for non-weak opening
  }

  // Scene opening bonus
  if (features.hasOpeningScene) {
    score += 25;
    evidence.push('Scene detected in opening');
    signals.hasOpeningScene = true;
  }

  // Dialogue opening bonus
  if (/^[""\u201C]/.test(firstSentence.trim())) {
    score += 15;
    evidence.push('Opens with dialogue');
    signals.dialogueOpening = true;
  }

  // Specificity in opening (numbers, names, concrete nouns)
  const specificityMarkers = firstSentence.match(/\b\d+\b|\b[A-Z][a-z]+\b/g) || [];
  if (specificityMarkers.length >= 2) {
    score += 10;
    evidence.push('Specific details in opening');
  }

  // Short, punchy opening bonus
  const firstSentenceWords = firstSentence.trim().split(/\s+/).length;
  if (firstSentenceWords <= 10 && firstSentenceWords >= 3) {
    score += 5;
    evidence.push('Concise opening hook');
  }

  // Question opening (moderate)
  if (firstSentence.trim().endsWith('?')) {
    score += 5;
    signals.questionOpening = true;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  // High confidence for detected weak patterns (regex is reliable for cliches);
  // lower for non-weak openings — avoiding a cliche ≠ having a great hook
  const confidence = hasWeakOpening ? 0.8 : 0.55;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Opening Hook & Engagement',
  weight: 0.06,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay's OPENING HOOK 0-100 for engagement and reader pull-through.

ESSAY:
"${text}"

Focus on the first 1-3 sentences, but evaluate them IN CONTEXT of the full essay:
1. CURIOSITY GAP: Does the opening create a question the reader NEEDS answered? Not just "what happens next?" but "who IS this person?" — the kind of curiosity that makes an AO lean in.
2. PROMISE & DELIVERY: Does the opening make an implicit PROMISE about what this essay will be about — and does the essay actually deliver? An opening that hooks but disconnects from the rest is worse than a plain one that sets up the real story.
3. THEMATIC SETUP: Does the opening plant the seed of the essay's central tension, theme, or transformation? The best openings don't just grab attention — they establish what's at STAKE.
4. WORLD-BUILDING: Does it drop you into a specific world — a context, setting, or situation that ONLY this writer would be in? "The fluorescent lights hummed in B-wing" establishes a world. "I have always loved science" establishes nothing.
5. STYLE-STORY FIT: Does the opening technique (scene, dialogue, statement, question, action) serve THIS essay's specific story? A scene opening that drops you into the WRONG moment is worse than a direct statement that sets up the real story.
6. EARNED DISTINCTION: Could this opening belong to any of 10,000 personal statements, or does it feel uniquely THIS writer's? Does it signal something about their personality, perspective, or way of seeing?

HIGH SCORE (75-100): AO stops mid-read. Opening is specific, sets up the essay's central tension, and makes a promise the essay delivers. Reader immediately understands they're in a particular person's world.
MID SCORE (40-74): Competent opening that doesn't repel but doesn't magnetize. May grab attention but disconnect from essay's core, or be solid but unremarkable.
LOW SCORE (0-39): Cliche, generic, abstract, or disconnected from the essay's actual story. Could be swapped into any personal statement.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote from opening"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(DIMENSION_ID, h, l),
};

dimensionRegistry.register(manifest);
