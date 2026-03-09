/**
 * Dimension: Argument & Rhetorical Craft (7%) — NEW
 * Scoring tier: Heuristic + Haiku
 *
 * Detects claims, evidence, counterpoints, rhetorical devices.
 * Replaces school_program_fit (absorbed here). Critical for
 * analytical essays, "Why Us", and supplementals.
 */

import { dimensionRegistry } from '../registry/dimensionRegistry';
import { parseStandardLLMResponse, fuseByConfidence } from './_shared';
import type { DimensionManifest, ExtractedFeatures, HeuristicResult } from '../shared/types';

const ID = 'argument_rhetorical_craft';

function heuristicScore(f: ExtractedFeatures): HeuristicResult {
  let score = 0;
  const evidence: string[] = [];
  const signals: Record<string, number | boolean> = {};

  // Claims (thesis assertions)
  score += Math.min(25, f.claimCount * 10);
  if (f.claimCount >= 2) {
    evidence.push('Multiple clear claims/assertions');
  }
  signals.claimCount = f.claimCount;

  // Evidence (supporting details)
  score += Math.min(20, f.evidenceCount * 7);
  if (f.evidenceCount >= 2) {
    evidence.push('Supporting evidence present');
  }
  signals.evidenceCount = f.evidenceCount;

  // Counterpoints (nuance, concessions)
  score += Math.min(20, f.counterpointCount * 10);
  if (f.counterpointCount >= 1) {
    evidence.push('Counterpoint/concession present');
  }
  signals.counterpointCount = f.counterpointCount;

  // Rhetorical devices
  score += Math.min(15, f.rhetoricalDeviceCount * 5);
  if (f.rhetoricalDeviceCount >= 2) {
    evidence.push('Rhetorical devices detected');
  }
  signals.rhetoricalDevices = f.rhetoricalDeviceCount;

  // Logical structure (transitions + claim-evidence pairing)
  if (f.transitionWordCount >= 4 && f.claimCount >= 1 && f.evidenceCount >= 1) {
    score += 10;
    evidence.push('Good logical structure: claims + evidence + transitions');
  }

  // Penalties
  if (f.claimCount === 0 && f.evidenceCount === 0) {
    // Essay may be purely narrative, which is fine — but this dimension scores lower
    score = Math.max(score, 20); // Floor at 20 for any essay
    evidence.push('No argumentative structure detected (may be narrative essay)');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = (f.claimCount + f.evidenceCount + f.counterpointCount) >= 3 ? 0.75 : 0.5;

  return { score, confidence, evidence, signals };
}

const manifest: DimensionManifest = {
  id: ID,
  displayName: 'Argument & Rhetorical Craft',
  weight: 0.06,
  scoringTier: 'heuristic+haiku',
  heuristicScore,
  shouldTriggerLLM: (h) => h.confidence < 0.7,
  buildLLMPrompt: (text) => `Score this essay 0-100 for ARGUMENT and RHETORICAL CRAFT.

ESSAY:
"${text}"

Evaluate:
1. IMPLICIT ARGUMENT FROM EXPERIENCE: Every great personal essay makes an argument — not a thesis statement, but an implicit claim about the world, about identity, or about what matters. What is this essay ARGUING through its story? "I believe curiosity matters more than expertise" can be argued through narrative without ever being stated. If you can't identify what the essay is arguing, that's a problem.
2. EVIDENCE FROM LIVED EXPERIENCE: Is the essay's argument supported by SPECIFIC moments, decisions, and outcomes — not just assertions? "I learned that failure teaches more than success" is assertion. Showing a specific failure and what specifically changed is evidence. Personal narratives use SCENES as evidence.
3. INTELLECTUAL HONESTY & COMPLEXITY: Does the writer acknowledge what complicates their argument? Do they wrestle with counterpoints, contradictions, or limitations of their own perspective? "But I also realized..." or "What I didn't see then was..." signal intellectual maturity.
4. RHETORICAL DEVICES IN SERVICE OF MEANING: If the essay uses metaphor, parallelism, repetition, or other devices — do they reinforce the essay's core argument? Or are they decorative? A recurring metaphor that deepens with each appearance = excellent craft. Random rhetorical flourishes = showing off.
5. LOGICAL PROGRESSION THROUGH NARRATIVE: Does the essay build its case across paragraphs — each section adding a new dimension to the argument? Or could sections be rearranged without the reader noticing? Even narrative essays should have a sense of building toward something.

NOTE: Personal narratives should be scored on their implicit argumentative power. A story that makes the reader think "yes, that's true about the world" through SHOWING is more rhetorically effective than a stated thesis with bullet-point evidence.

HIGH SCORE (75-100): Clear implicit argument emerges from specific experience. Complexity acknowledged. Each section builds the case. Rhetorical choices serve meaning.
MID SCORE (40-74): Argument present but may be stated rather than shown. Some complexity but not fully developed.
LOW SCORE (0-39): No discernible argument or worldview. Essay describes events without making the reader think differently.

Respond in JSON: { "score": 0-100, "confidence": 0-1, "reasoning": "...", "evidence": ["quote1"] }`,
  parseLLMResponse: parseStandardLLMResponse,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};

dimensionRegistry.register(manifest);
