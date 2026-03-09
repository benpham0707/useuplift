/**
 * Dimension: Thematic Depth & Reflection (9%)
 * Scoring tier: Heuristic + Haiku
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'thematic_depth_reflection';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Reflection markers
  score += Math.min(30, f.reflectionMarkerCount * 10);
  if (f.reflectionMarkerCount >= 3) {
    evidence.push('Rich reflection language');
  } else if (f.reflectionMarkerCount === 0) {
    evidence.push('No reflection markers detected');
  }
  signals.reflectionMarkers = f.reflectionMarkerCount;

  // Growth language supports thematic depth
  score += Math.min(15, f.growthLanguageCount * 5);
  signals.growthLanguage = f.growthLanguageCount;

  // Complex syntax = deeper thinking
  if (f.clauseDepthAvg > 1.5) {
    score += 10;
    signals.complexThinking = true;
  }

  // Counterpoint signals = nuanced reflection
  score += Math.min(15, f.counterpointCount * 8);
  if (f.counterpointCount >= 2) {
    evidence.push('Nuanced counterpoints present');
  }

  // Cliche penalty (especially reflection cliches)
  if (f.clicheCount > 2) {
    score -= 15;
    evidence.push('Reflection undermined by cliches');
  }

  // Paragraph count: enough space for development
  if (f.paragraphCount >= 4) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = f.reflectionMarkerCount >= 2 ? 0.7 : 0.5;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Thematic Depth & Reflection',
  weight: 0.08,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for THEMATIC DEPTH and REFLECTION quality.

ESSAY:
"${text}"

Evaluate:
1. THEME AS CONNECTIVE TISSUE: Does a clear theme CONNECT all parts of the essay — opening, middle, closing? Do different sections explore different facets of the same core idea? Or are sections disconnected, each making a separate point?
2. REFLECTION EMERGING FROM NARRATIVE: Does insight grow ORGANICALLY from the story — or is it bolted on as a concluding paragraph? The best reflection is woven throughout, with the writer processing in real time. A final paragraph that starts "This experience taught me..." is a red flag.
3. LAYERS OF MEANING: Is there a surface story AND a deeper significance? Does the essay operate on multiple levels — a specific event that illuminates a broader truth about the writer's identity, values, or worldview?
4. PORTABLE INSIGHT: Does the reflection reveal a way of THINKING that extends beyond this one experience? An AO should read the insight and think "this person would bring this perspective to our campus." Generic lessons ("I learned perseverance") don't transfer.
5. COMFORT WITH COMPLEXITY: Does the writer sit with ambiguity, paradox, or unresolved tension — or do they rush to tidy conclusions? The most intellectually mature essays acknowledge what HASN'T been figured out yet.
6. RECURRING MOTIFS: Are there images, phrases, or ideas that recur and DEEPEN with each appearance? A metaphor introduced in paragraph 1 that transforms by paragraph 5 creates thematic coherence.

HIGH SCORE (75-100): Theme connects every section. Reflection is woven throughout, not bolted on. Multiple layers of meaning. Insight is portable and reveals the writer's worldview. Comfort with complexity.
MID SCORE (40-74): Theme present but not tracked consistently. Reflection exists but clustered at the end. Some depth but surface reading is sufficient.
LOW SCORE (0-39): No clear theme, or theme is a cliche ("hard work pays off"). Reflection is stated, not demonstrated. Sections feel disconnected.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
