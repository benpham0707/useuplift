/**
 * Paragraph Function Classifier — Structural mathematics, not phrase matching
 *
 * Classifies each paragraph's narrative role using measurable text properties:
 * ratios, densities, variances, and shifts. The classifier detects what the
 * text IS DOING structurally, not what specific words it uses.
 *
 * Low-margin classifications get 'ambiguous' → deferred to LLM.
 * We EXPECT many paragraphs to be ambiguous — that's correct behavior.
 */

import { splitParagraphs, splitSentences, splitWords } from './featureExtractor';
import {
  analyzeStructuralPatterns,
  isAbstractNoun,
  type ParagraphMetrics,
  type CrossParagraphShifts,
} from './structuralPatternDetector';

import type {
  ParagraphFunction,
  ParagraphFunctionAnalysis,
  FunctionSignals,
  NarrativeFlowAnalysis,
} from './narrativeAnalyzerTypes';

// ============================================================================
// FUNCTION-SPECIFIC SIGNAL DETECTION
// ============================================================================

/**
 * Spatial preposition pattern: preposition + "the" (structural, not content).
 * Detects "in the", "at the", "on the", "behind the" — grounding indicators.
 */
const SPATIAL_PREP_RE = /\b(?:in|at|on|behind|beside|beneath|above|under|between|near|inside|outside|across|around)\s+the\b/gi;

/**
 * Possessive + noun + verb pattern (syntactic, not content).
 * Matches "my throat tightened", "her back rigid", "his eyes widened".
 */
const POSSESSIVE_NOUN_VERB_RE = /\b(?:my|his|her|their|its|your)\s+\w+\s+\w+(?:ed|ing|s)\b/gi;

/**
 * Conjunction-contrast words — structural markers, not content.
 */
const CONTRAST_CONJUNCTIONS = new Set(['but', 'yet', 'however', 'although', 'though', 'instead', 'whereas', 'unlike']);

function countSpatialPrepositions(text: string): number {
  return (text.match(SPATIAL_PREP_RE) || []).length;
}

function countPossessiveNounVerb(text: string): number {
  return (text.match(POSSESSIVE_NOUN_VERB_RE) || []).length;
}

function countContrastConjunctions(words: string[]): number {
  return words.filter(w => CONTRAST_CONJUNCTIONS.has(w)).length;
}

// ============================================================================
// SIGNAL SCORING PER FUNCTION TYPE
// ============================================================================

function computeSignals(
  metrics: ParagraphMetrics,
  paragraphText: string,
  words: string[],
  prevMetrics: ParagraphMetrics | null,
): FunctionSignals {
  // Grounding: proper nouns + past-tense + spatial prepositions
  const spatialCount = countSpatialPrepositions(paragraphText);
  const groundingSignals =
    (metrics.properNounDensity > 0.03 ? 2 : metrics.properNounDensity > 0.01 ? 1 : 0) +
    (metrics.pastTenseRatio > 0.4 ? 2 : metrics.pastTenseRatio > 0.25 ? 1 : 0) +
    Math.min(spatialCount, 3);

  // Characterization: named entities + high action-verb density + low abstraction
  const actionVerbIndicator = metrics.pastTenseRatio > 0.3 && metrics.abstractNounRatio < 0.05;
  const characterizationSignals =
    (metrics.properNounDensity > 0.02 ? 2 : 0) +
    (actionVerbIndicator ? 2 : 0) +
    (metrics.dialoguePresent ? 1 : 0) +
    (metrics.abstractNounRatio < 0.03 ? 1 : 0);

  // Escalation: questions + negation + sentence-length variation
  const escalationSignals =
    (metrics.questionDensity > 0.2 ? 2 : metrics.questionDensity > 0 ? 1 : 0) +
    (metrics.negationDensity > 0.04 ? 2 : metrics.negationDensity > 0.02 ? 1 : 0) +
    (metrics.sentenceLengthCV > 0.5 ? 2 : metrics.sentenceLengthCV > 0.3 ? 1 : 0);

  // Intimacy: first-person + body-noun presence + short sentences
  const possessivePatterns = countPossessiveNounVerb(paragraphText);
  const intimacySignals =
    (metrics.firstPersonDensity > 0.06 ? 2 : metrics.firstPersonDensity > 0.04 ? 1 : 0) +
    (possessivePatterns > 0 ? Math.min(possessivePatterns, 2) : 0) +
    (metrics.sentenceLengthMean < 12 && metrics.sentenceLengthMean > 0 ? 1 : 0);

  // Contrast: tense shift + conjunction density + vocabulary shift from prev
  const contrastConjCount = countContrastConjunctions(words);
  let vocabShiftSignal = 0;
  let tenseShiftSignal = 0;
  if (prevMetrics) {
    const tenseChange = Math.abs(metrics.pastTenseRatio - prevMetrics.pastTenseRatio);
    tenseShiftSignal = tenseChange > 0.3 ? 2 : tenseChange > 0.15 ? 1 : 0;
    // Person shift as contrast indicator
    const personChange = Math.abs(metrics.firstPersonDensity - prevMetrics.firstPersonDensity);
    vocabShiftSignal = personChange > 0.03 ? 1 : 0;
  }
  const contrastSignals =
    tenseShiftSignal +
    (contrastConjCount >= 2 ? 2 : contrastConjCount >= 1 ? 1 : 0) +
    vocabShiftSignal;

  // Release: final sentence longer than mean + lower negation than prev + temporal markers
  let releaseSignals = 0;
  if (metrics.sentenceCount > 1) {
    const sentences = splitSentences(paragraphText);
    const lastLen = splitWords(sentences[sentences.length - 1]).length;
    if (lastLen > metrics.sentenceLengthMean * 1.3) releaseSignals += 2;
  }
  if (prevMetrics && metrics.negationDensity < prevMetrics.negationDensity) {
    releaseSignals += 1;
  }
  if (metrics.abstractNounRatio > 0.04 && metrics.pastTenseRatio > 0.3) {
    releaseSignals += 1; // Temporal progression + reflection
  }

  // Reflection: abstract > concrete + low proper nouns
  const reflectionSignals =
    (metrics.abstractNounRatio > 0.06 ? 2 : metrics.abstractNounRatio > 0.03 ? 1 : 0) +
    (metrics.properNounDensity < 0.01 ? 1 : 0) +
    (metrics.firstPersonDensity > 0.04 ? 1 : 0) +
    (metrics.pastTenseRatio < 0.3 ? 1 : 0);

  return {
    groundingSignals,
    characterizationSignals,
    escalationSignals,
    intimacySignals,
    contrastSignals,
    releaseSignals,
    reflectionSignals,
  };
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

const FUNCTION_KEYS: (keyof FunctionSignals)[] = [
  'groundingSignals',
  'characterizationSignals',
  'escalationSignals',
  'intimacySignals',
  'contrastSignals',
  'releaseSignals',
  'reflectionSignals',
];

const SIGNAL_TO_FUNCTION: Record<keyof FunctionSignals, ParagraphFunction> = {
  groundingSignals: 'grounding',
  characterizationSignals: 'characterization',
  escalationSignals: 'escalation',
  intimacySignals: 'intimacy',
  contrastSignals: 'contrast',
  releaseSignals: 'release',
  reflectionSignals: 'reflection',
};

function classifyFromSignals(signals: FunctionSignals): {
  detectedFunction: ParagraphFunction;
  confidence: number;
  uncertainties: string[];
} {
  // Find top two scoring functions
  const sorted = FUNCTION_KEYS
    .map(key => ({ key, score: signals[key] }))
    .sort((a, b) => b.score - a.score);

  const topScore = sorted[0].score;
  const secondScore = sorted[1]?.score ?? 0;
  const margin = topScore - secondScore;

  // If top score is 0, everything is ambiguous
  if (topScore === 0) {
    return {
      detectedFunction: 'ambiguous',
      confidence: 0,
      uncertainties: ['No structural signals detected'],
    };
  }

  // If margin is too small, it's ambiguous
  if (margin < 1 && topScore < 3) {
    const competing = sorted
      .filter(s => s.score >= topScore - 1 && s.score > 0)
      .map(s => SIGNAL_TO_FUNCTION[s.key]);
    return {
      detectedFunction: 'ambiguous',
      confidence: margin / Math.max(topScore, 1),
      uncertainties: competing.map(f => `Could be ${f}`),
    };
  }

  // Confidence based on signal separation
  const confidence = Math.min(0.95, margin / Math.max(topScore, 1) * 0.5 + topScore / 10);

  // Collect uncertainties for close seconds
  const uncertainties: string[] = [];
  for (const s of sorted.slice(1)) {
    if (s.score > 0 && topScore - s.score <= 1) {
      uncertainties.push(`Also shows ${SIGNAL_TO_FUNCTION[s.key]} signals`);
    }
  }

  return {
    detectedFunction: SIGNAL_TO_FUNCTION[sorted[0].key],
    confidence,
    uncertainties,
  };
}

// ============================================================================
// SHORT PARAGRAPH HEURISTICS
// ============================================================================

/**
 * For very short paragraphs (< 15 words), use simplified classification:
 * - Has question mark → escalation
 * - High first-person → intimacy
 * - Otherwise → transition
 */
function classifyShortParagraph(metrics: ParagraphMetrics): ParagraphFunction {
  if (metrics.questionDensity > 0) return 'escalation';
  if (metrics.firstPersonDensity > 0.1) return 'intimacy';
  if (metrics.dialoguePresent) return 'characterization';
  return 'transition';
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Classify each paragraph's narrative function using structural mathematics.
 * Returns per-paragraph classifications with confidence and signal counts.
 */
export function classifyParagraphFunctions(text: string): ParagraphFunctionAnalysis[] {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return [];

  const structural = analyzeStructuralPatterns(text);
  const results: ParagraphFunctionAnalysis[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const metrics = structural.paragraphs[i];
    const words = splitWords(paragraphs[i]);
    const prevMetrics = i > 0 ? structural.paragraphs[i - 1] : null;

    // Very short paragraphs get simplified classification
    if (metrics.wordCount < 15) {
      const func = classifyShortParagraph(metrics);
      const signals: FunctionSignals = {
        groundingSignals: 0, characterizationSignals: 0, escalationSignals: 0,
        intimacySignals: 0, contrastSignals: 0, releaseSignals: 0, reflectionSignals: 0,
      };
      results.push({
        index: i,
        detectedFunction: func,
        confidence: 0.3, // Low confidence for short paragraphs
        signals,
        uncertainties: ['Short paragraph — simplified classification'],
      });
      continue;
    }

    const signals = computeSignals(metrics, paragraphs[i], words, prevMetrics);
    const classification = classifyFromSignals(signals);

    results.push({
      index: i,
      detectedFunction: classification.detectedFunction,
      confidence: classification.confidence,
      signals,
      uncertainties: classification.uncertainties,
    });
  }

  return results;
}

/**
 * Analyze narrative flow — how paragraph functions interact across the essay.
 */
export function analyzeNarrativeFlow(
  paragraphFunctions: ParagraphFunctionAnalysis[],
): NarrativeFlowAnalysis {
  if (paragraphFunctions.length === 0) {
    return {
      functionSequence: [],
      narrativeCycles: 0,
      missingFunctions: ['grounding', 'characterization', 'escalation', 'intimacy', 'contrast', 'release', 'reflection'],
      functionRepetition: 0,
      functionDiversity: 0,
    };
  }

  const functionSequence = paragraphFunctions.map(p => p.detectedFunction);

  // Narrative cycles: count escalation→release or escalation→intimacy patterns
  let narrativeCycles = 0;
  for (let i = 1; i < functionSequence.length; i++) {
    if (
      (functionSequence[i - 1] === 'escalation' && (functionSequence[i] === 'release' || functionSequence[i] === 'intimacy')) ||
      (functionSequence[i - 1] === 'intimacy' && functionSequence[i] === 'release')
    ) {
      narrativeCycles++;
    }
  }

  // Missing functions (exclude transition, exposition, ambiguous)
  const coreFunction: ParagraphFunction[] = ['grounding', 'characterization', 'escalation', 'intimacy', 'contrast', 'release', 'reflection'];
  const presentFunctions = new Set(functionSequence);
  const missingFunctions = coreFunction.filter(f => !presentFunctions.has(f));

  // Consecutive same-function repetition
  let maxRepetition = 1;
  let currentRepetition = 1;
  for (let i = 1; i < functionSequence.length; i++) {
    if (functionSequence[i] === functionSequence[i - 1] && functionSequence[i] !== 'ambiguous') {
      currentRepetition++;
      maxRepetition = Math.max(maxRepetition, currentRepetition);
    } else {
      currentRepetition = 1;
    }
  }

  // Function diversity: unique non-ambiguous functions / 7 core functions
  const uniqueFunctions = new Set(functionSequence.filter(f => f !== 'ambiguous' && f !== 'transition' && f !== 'exposition'));
  const functionDiversity = uniqueFunctions.size / coreFunction.length;

  return {
    functionSequence,
    narrativeCycles,
    missingFunctions,
    functionRepetition: maxRepetition,
    functionDiversity: Math.round(functionDiversity * 100) / 100,
  };
}
