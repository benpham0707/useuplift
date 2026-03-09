/**
 * Dimension: Word Economy & Craft (7%)
 * Scoring tier: Heuristic + Haiku
 *
 * Measures sentence tightness, verb strength, filler/bloat detection,
 * sentence variety, and memorable phrasing potential. Heuristics catch
 * mechanical issues (filler, passive, cliches); LLM judges whether the
 * prose is precise, evocative, and earns every word.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const DIMENSION_ID = 'word_economy_craft';

function heuristicScore(features: ExtractedFeatures): HeuristicResult {
  const signals: Record<string, number | boolean> = {};
  let score = 50; // Start at midpoint
  const evidence: string[] = [];

  // Filler reduction bonus (0-20 points above baseline)
  if (features.fillerPhraseCount === 0) {
    score += 20;
    evidence.push('No filler phrases detected');
  } else if (features.fillerPhraseCount <= 2) {
    score += 10;
  } else {
    score -= features.fillerPhraseCount * 3;
    evidence.push(`${features.fillerPhraseCount} filler phrases detected`);
  }
  signals.fillerCount = features.fillerPhraseCount;

  // Passive voice penalty
  if (features.passiveVoiceRatio > 0.25) {
    score -= 10;
    evidence.push('High passive voice ratio');
  } else if (features.passiveVoiceRatio < 0.1) {
    score += 5;
    evidence.push('Strong active voice');
  }
  signals.passiveVoiceRatio = features.passiveVoiceRatio;

  // Sentence variety (cadence)
  score += Math.round(features.sentenceVarietyScore * 15);
  if (features.sentenceVarietyScore > 0.7) {
    evidence.push('Excellent sentence variety');
  }

  // Vocabulary richness
  if (features.vocabularyRichness > 0.65) {
    score += 10;
    evidence.push('Rich vocabulary');
  } else if (features.vocabularyRichness < 0.4) {
    score -= 10;
    evidence.push('Repetitive vocabulary');
  }
  signals.vocabularyRichness = features.vocabularyRichness;

  // Conciseness (avg sentence length)
  if (features.avgSentenceLength >= 12 && features.avgSentenceLength <= 20) {
    score += 5; // sweet spot
  } else if (features.avgSentenceLength > 25) {
    score -= 5;
    evidence.push('Sentences tend to run long');
  }

  // Cliche and banned term penalties
  score -= features.clicheCount * 4;
  score -= features.bannedTermCount * 5;
  if (features.clicheCount > 0) {
    evidence.push(`${features.clicheCount} cliches detected`);
  }
  if (features.bannedTermCount > 0) {
    evidence.push(`${features.bannedTermCount} banned/AI-sounding terms`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  // Heuristics reliably detect mechanical issues (filler, passive, cliches)
  // but can't judge whether concise prose is also vivid and memorable
  const confidence = 0.65;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: DIMENSION_ID,
  displayName: 'Word Economy & Craft',
  weight: 0.07,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for WORD ECONOMY & CRAFT.

ESSAY:
"${text}"

Evaluate:
1. WORDS AS IDENTITY SIGNALS: Do word choices reveal WHO this person is — their background, how they think, what they notice? A science student might describe emotions through systems metaphors. A musician might hear rhythm in ordinary moments. Generic word choices ("amazing experience," "passionate about") erase the writer's identity.
2. SENTENCE PURPOSE & INTERCONNECTION: Does every sentence earn its place by advancing the essay's argument, emotion, or narrative? Do sentences BUILD on each other — or could you shuffle paragraphs 2-4 without the reader noticing? Cut any sentence mentally: does the essay lose something specific?
3. VERB STRENGTH IN SERVICE OF MEANING: Are verbs chosen to convey the RIGHT action with the RIGHT emotional register? "She crept" vs "She walked" vs "She strode" aren't just precision — they reveal the character's internal state. Do verbs serve the essay's emotional arc?
4. MEMORABLE PHRASING THAT EARNS ITS PLACE: Are there lines an AO might remember an hour later — and do those lines serve the essay's purpose? A memorable line that's disconnected from the essay's core is a distraction. The best lines crystallize the essay's central insight.
5. DICTION-VOICE CONSISTENCY: Is the vocabulary register consistent with the writer's established voice? Sudden shifts to SAT words or academic prose in a conversational essay break authenticity. The prose should sound like THIS person, not "a college applicant."
6. ECONOMY AS RESPECT FOR THE READER: With 650 words and an AO's 8-minute read, every word must justify its existence. Is the prose tight WITHOUT being sterile — economical AND evocative? Does the writer trust the reader to infer, or over-explain?

HIGH SCORE (75-100): Word choices reveal character. Every sentence advances the essay. Verbs carry emotional weight. 1-2 phrases crystallize the essay's insight. Voice is consistent and distinctive.
MID SCORE (40-74): Competent prose but unremarkable. Some filler. Words are correct but not chosen. Functional but doesn't reveal the writer.
LOW SCORE (0-39): Generic, bloated, or cliche-heavy. Words could belong to anyone. Passive voice and filler dominate. No memorable phrasing.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1", "quote2"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(DIMENSION_ID, h, l),
};

dimensionRegistry.register(manifest);
