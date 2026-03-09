/**
 * Narrative Analyzers — 7 Deterministic Essay Analysis Functions
 *
 * All analyzers are pure, deterministic code (no LLM calls).
 * Target: < 100ms per essay for all 7 combined.
 *
 * Analyzers:
 *   1. Specificity Gradient — concrete vs abstract per paragraph
 *   2. Scene vs Summary — classify paragraphs as scene/summary/mixed
 *   3. Show vs Tell — detect "I was happy" patterns
 *   4. Narrative Arc — detect Man-in-Hole, Cinderella, etc.
 *   5. Emotional Journey — map emotion trajectory across paragraphs
 *   6. Information Density — find redundant paragraphs
 *   7. Tension Curve — map reader engagement rises/falls
 *
 * Consumed by:
 *   - Dimension wrappers (narrative-structure.dim.ts, narrative-dynamics.dim.ts)
 *   - Annotation pipeline prompt builder
 *   - Future brainstorming system (Swarm A)
 */

import {
  splitParagraphs,
  splitSentences,
  splitWords,
  SENSORY_WORDS,
  EMOTION_WORDS,
  VULNERABILITY_MARKERS,
  ACHIEVEMENT_MARKERS,
  REFLECTION_MARKERS,
  GROWTH_LANGUAGE,
  CURIOSITY_MARKERS,
  CLICHES,
} from './featureExtractor';

import type { ExtractedFeatures } from '../shared/types';

import type {
  SpecificityGradient,
  SpecificityLevel,
  InformationDensityAnalysis,
  DensityLevel,
  SceneVsSummaryAnalysis,
  ParagraphClassification,
  ShowVsTellAnalysis,
  NarrativeArcType,
  NarrativeArcAnalysis,
  EmotionalCategory,
  EmotionalJourneyAnalysis,
  EmotionalTrajectoryPattern,
  TensionCurveAnalysis,
  TensionTrend,
  EngagementLevel,
  NarrativeAnalysisResult,
  NarrativeIssueSeverity,
  NarrativeAnalysisMetadata,
  ParagraphFunctionAnalysis,
  ParagraphFunction,
} from './narrativeAnalyzerTypes';

import { analyzeStructuralPatterns } from './structuralPatternDetector';
import { classifyParagraphFunctions, analyzeNarrativeFlow } from './paragraphFunctionClassifier';
import { selectPrincipleForEmotion } from './teachingPrinciples';


// ============================================================================
// SHARED HELPERS
// ============================================================================

/** Clamps a value to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Counts how many words in the array exist in the given Set. */
function countWordSetMatches(words: string[], set: Set<string>): number {
  return words.filter(w => set.has(w)).length;
}

/** Counts how many phrases from a string array appear in the lowered text. */
function countPhraseArrayMatches(lowerText: string, phrases: string[]): number {
  let count = 0;
  for (const phrase of phrases) {
    if (lowerText.includes(phrase)) count++;
  }
  return count;
}

/** Counts how many multi-word phrases from a Set appear in the lowered text. */
function countPhraseSetMatches(lowerText: string, set: Set<string>): number {
  let count = 0;
  for (const phrase of set) {
    if (phrase.includes(' ') && lowerText.includes(phrase)) count++;
  }
  return count;
}

/** Counts each occurrence of phrases (not just presence). */
function countPhraseOccurrences(lowerText: string, phrases: string[]): number {
  let count = 0;
  for (const phrase of phrases) {
    let startIdx = 0;
    while (true) {
      const found = lowerText.indexOf(phrase, startIdx);
      if (found === -1) break;
      count++;
      startIdx = found + phrase.length;
    }
  }
  return count;
}

/** Extracts all contiguous n-grams of a given size from a word array. */
function extractNgrams(words: string[], n: number): string[] {
  if (words.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Computes Shannon entropy of a word frequency distribution,
 * normalized to [0, 1] by dividing by log2(uniqueWordCount).
 */
function computeNormalizedEntropy(words: string[]): number {
  if (words.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const uniqueCount = freq.size;
  if (uniqueCount <= 1) return 0;
  const totalWords = words.length;
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / totalWords;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(uniqueCount);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Cosine similarity between two equal-length numeric vectors.
 * Returns 0 if either vector has zero magnitude.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Distributes paragraphs into 4 quarters as evenly as possible.
 * Extra paragraphs go to middle quarters (Q2 and Q3 first).
 */
function distributeQuarters(paragraphCount: number): number[][] {
  if (paragraphCount === 0) return [[], [], [], []];
  if (paragraphCount < 4) {
    const quarters: number[][] = [[], [], [], []];
    for (let i = 0; i < paragraphCount; i++) {
      quarters[i].push(i);
    }
    return quarters;
  }
  const baseSize = Math.floor(paragraphCount / 4);
  const remainder = paragraphCount % 4;
  const extraAssignment = [1, 2, 0, 3];
  const sizes = [baseSize, baseSize, baseSize, baseSize];
  for (let i = 0; i < remainder; i++) {
    sizes[extraAssignment[i]]++;
  }
  const quarters: number[][] = [[], [], [], []];
  let offset = 0;
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < sizes[q]; i++) {
      quarters[q].push(offset + i);
    }
    offset += sizes[q];
  }
  return quarters;
}

/**
 * Returns the top N sentences from a text sorted by signal word density.
 */
function getKeyMoments(
  paragraphText: string,
  signalSets: Set<string>[],
  maxMoments: number = 2,
): string[] {
  const sentences = splitSentences(paragraphText);
  if (sentences.length === 0) return [];
  const scored = sentences.map(sentence => {
    const words = splitWords(sentence);
    let signalCount = 0;
    for (const set of signalSets) {
      signalCount += words.filter(w => set.has(w)).length;
    }
    return { sentence, signalCount };
  });
  scored.sort((a, b) => b.signalCount - a.signalCount);
  return scored
    .filter(s => s.signalCount > 0)
    .slice(0, maxMoments)
    .map(s => s.sentence);
}


// ============================================================================
// ANALYZER 1: SPECIFICITY GRADIENT
// ============================================================================

const ENTITY_EXCLUSIONS = new Set([
  'I', 'The', 'A', 'An', 'It', 'This', 'That', 'My', 'We', 'He', 'She',
  'They', 'But', 'And', 'Or', 'So', 'Yet', 'For', 'In', 'On', 'At', 'To',
  'Of', 'By', 'Is', 'Was', 'Are', 'Were', 'Be', 'If', 'As', 'Do', 'Did',
  'Not', 'No', 'Its', 'Our', 'His', 'Her', 'All', 'One', 'Now', 'Then',
  'When', 'Where', 'How', 'What', 'Why', 'Who', 'Which', 'There', 'Here',
  'After', 'Before', 'During', 'While', 'Because', 'Although', 'Since',
  'Until', 'With', 'From', 'Each', 'Every', 'Some', 'Many', 'Most',
]);

const GENERIC_PHRASES: string[] = [
  'the situation', 'what happened', 'things', 'stuff', 'something',
  'everything', 'anything', 'it was', 'there was', 'they were',
  'people', 'the experience', 'the process', 'activities', 'opportunities',
];

function detectSpecificLocations(text: string): string[] {
  const locations: string[] = [];
  const regex = /(?:[A-Z][a-z]+(?:\s+(?:of|the|and|in|at|for|de|la|el)\s+)?)+[A-Z][a-z]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const phrase = match[0];
    const words = phrase.split(/\s+/);
    const significantWords = words.filter(w => !ENTITY_EXCLUSIONS.has(w) && /^[A-Z]/.test(w));
    if (significantWords.length >= 2) {
      locations.push(phrase);
    }
  }
  return locations;
}

function detectNamedEntities(paragraphText: string): string[] {
  const sentences = paragraphText
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const entities = new Set<string>();
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const cleaned = words[i].replace(/[^a-zA-Z'-]/g, '');
      if (cleaned.length === 0) continue;
      if (/^[A-Z]/.test(cleaned) && !ENTITY_EXCLUSIONS.has(cleaned)) {
        entities.add(cleaned);
      }
    }
  }
  return Array.from(entities);
}

function detectGenericPhrases(lowerText: string): string[] {
  const found: string[] = [];
  for (const phrase of GENERIC_PHRASES) {
    if (lowerText.includes(phrase)) found.push(phrase);
  }
  return found;
}

function classifySpecificity(score: number): SpecificityLevel {
  if (score >= 80) return 'highly_concrete';
  if (score >= 60) return 'concrete';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'abstract';
  return 'highly_abstract';
}

/** Specificity expectation per paragraph function (higher = needs more specificity) */
const FUNCTION_SPECIFICITY_EXPECTATION: Record<ParagraphFunction, number> = {
  grounding: 8,
  characterization: 6,
  escalation: 4,
  intimacy: 5,
  contrast: 5,
  release: 3,
  reflection: 2,
  transition: 2,
  exposition: 4,
  ambiguous: 5, // neutral expectation
};

/**
 * Analyzer 1 — Specificity Gradient
 *
 * Measures how concrete vs abstract each paragraph is. Scores specificity
 * RELATIVE to paragraph function: a grounding paragraph needs high specificity,
 * a reflection paragraph doesn't.
 */
export function analyzeSpecificityGradient(
  text: string,
  paragraphFunctions?: ParagraphFunctionAnalysis[],
): SpecificityGradient {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) {
    return { paragraphScores: [], overallScore: 0, weakestParagraph: 0, strongestParagraph: 0 };
  }

  const quantityRegex = /\b\d+[\d,.]*\b/g;

  const paragraphScores = paragraphs.map((para, index) => {
    const words = splitWords(para);
    const totalWords = words.length;
    const lowerPara = para.toLowerCase();

    const namedEntities = detectNamedEntities(para);
    const quantityMatches = para.match(quantityRegex) || [];
    const quantities = quantityMatches.map(q => q);
    const specificLocations = detectSpecificLocations(para);
    const genericPhrases = detectGenericPhrases(lowerPara);

    // Concrete noun density (opposite of abstract noun ratio from structural detector)
    let abstractCount = 0;
    for (const w of words) {
      if (w.length >= 5 && (/tion$/.test(w) || /ment$/.test(w) || /ness$/.test(w) || /ity$/.test(w) || /ism$/.test(w))) {
        abstractCount++;
      }
    }
    const concreteRatio = totalWords > 0 ? 1 - (abstractCount / totalWords) : 0;

    const rawNumerator =
      namedEntities.length * 2 + quantities.length * 1.5 +
      specificLocations.length * 2 + concreteRatio * 3;
    const denominator = Math.max(totalWords / 10, 1);
    let rawScore = (rawNumerator / denominator) * 10;
    rawScore = clamp(rawScore, 0, 100);
    rawScore -= genericPhrases.length * 5;
    rawScore = clamp(rawScore, 0, 100);

    // Function-relative scoring: adjust based on what this paragraph IS DOING
    const func = paragraphFunctions?.[index]?.detectedFunction ?? 'ambiguous';
    const expectation = FUNCTION_SPECIFICITY_EXPECTATION[func];
    // Score = (rawSpecificity / functionExpectation) × base
    // expectation of 8 means this paragraph NEEDS specificity → raw score weighted normally
    // expectation of 2 means specificity is less important → raw score boosted
    const functionMultiplier = 5 / Math.max(expectation, 1); // Higher expectation = less boost
    let score = Math.min(100, rawScore * functionMultiplier);
    score = clamp(score, 0, 100);

    return {
      index,
      score,
      level: classifySpecificity(score),
      signals: { sensoryWords: 0, namedEntities, quantities, specificLocations, genericPhrases },
    };
  });

  const overallScore = paragraphScores.reduce((sum, p) => sum + p.score, 0) / paragraphScores.length;
  let weakestParagraph = 0;
  let strongestParagraph = 0;
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (const p of paragraphScores) {
    if (p.score < minScore) { minScore = p.score; weakestParagraph = p.index; }
    if (p.score > maxScore) { maxScore = p.score; strongestParagraph = p.index; }
  }

  return { paragraphScores, overallScore, weakestParagraph, strongestParagraph };
}


// ============================================================================
// ANALYZER 2: SCENE VS SUMMARY RATIO
// ============================================================================

const PAST_TENSE_ACTION_VERBS = new Set([
  'grabbed', 'ran', 'walked', 'pushed', 'pulled', 'turned', 'jumped',
  'opened', 'closed', 'threw', 'caught', 'reached', 'touched', 'pressed',
  'stood', 'sat', 'whispered', 'shouted', 'cried', 'laughed', 'looked',
  'saw', 'heard', 'felt', 'smelled', 'tasted',
]);

const TEMPORAL_ANCHOR_PHRASES = [
  'at that moment', 'suddenly', 'just then', 'right then', 'in that instant', 'as soon as',
];

const SPATIAL_ANCHOR_PHRASES = [
  'in the', 'on the', 'at the', 'behind the', 'beside',
  'across', 'through the', 'inside', 'outside', 'corner of',
];

const DIALOGUE_MARKER_RE = /["\u201C\u201D\u201E\u201F\u2018\u2019]/;

const COPULA_VERBS = new Set([
  'was', 'is', 'were', 'are', 'became', 'seemed', 'appeared', 'remained',
]);

const ABSTRACT_REFLECTION_PHRASES = [
  'i learned', 'i realized', 'i understood', 'it was important',
  'i discovered', 'this taught me', 'i began to see',
];

const GENERIC_TEMPORAL_PHRASES = [
  'for years', 'eventually', 'over time', 'throughout',
  'during the', 'after a while', 'gradually',
];

function countSceneSignals(
  sentence: string,
  words: string[],
  lowerSentence: string,
): number {
  let count = 0;
  count += countWordSetMatches(words, PAST_TENSE_ACTION_VERBS);
  count += countPhraseArrayMatches(lowerSentence, TEMPORAL_ANCHOR_PHRASES);
  count += countPhraseOccurrences(lowerSentence, SPATIAL_ANCHOR_PHRASES);
  if (DIALOGUE_MARKER_RE.test(sentence)) count += 1;
  count += countWordSetMatches(words, SENSORY_WORDS);
  return count;
}

function countSummarySignals(
  words: string[],
  lowerSentence: string,
): number {
  let count = 0;
  count += countWordSetMatches(words, COPULA_VERBS);
  count += countPhraseArrayMatches(lowerSentence, ABSTRACT_REFLECTION_PHRASES);
  for (const marker of REFLECTION_MARKERS) {
    if (lowerSentence.includes(marker)) count++;
  }
  count += countPhraseArrayMatches(lowerSentence, GENERIC_TEMPORAL_PHRASES);
  return count;
}

/**
 * Analyzer 2 — Scene vs Summary Ratio
 *
 * Classifies each paragraph as 'scene' (in-the-moment narration),
 * 'summary' (compressed telling), or 'mixed'. Target: 50-75% scene.
 */
export function analyzeSceneVsSummary(text: string): SceneVsSummaryAnalysis {
  const paragraphs = splitParagraphs(text);
  const totalParagraphs = paragraphs.length;

  if (totalParagraphs === 0) {
    return {
      sceneRatio: 0, summaryRatio: 0, idealRange: { min: 0.5, max: 0.75 },
      isInRange: false, paragraphs: [], longestSummaryStretch: 0,
    };
  }

  const classifiedParagraphs: SceneVsSummaryAnalysis['paragraphs'] = [];

  for (let pIdx = 0; pIdx < totalParagraphs; pIdx++) {
    const paragraph = paragraphs[pIdx];
    const sentences = splitSentences(paragraph);
    let paragraphSceneTotal = 0;
    let paragraphSummaryTotal = 0;

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const words = splitWords(sentence);
      paragraphSceneTotal += countSceneSignals(sentence, words, lowerSentence);
      paragraphSummaryTotal += countSummarySignals(words, lowerSentence);
    }

    let classification: ParagraphClassification;
    if (paragraphSceneTotal > paragraphSummaryTotal * 1.5) {
      classification = 'scene';
    } else if (paragraphSummaryTotal > paragraphSceneTotal * 1.5) {
      classification = 'summary';
    } else {
      classification = 'mixed';
    }

    const signalSum = paragraphSceneTotal + paragraphSummaryTotal;
    const confidence = Math.abs(paragraphSceneTotal - paragraphSummaryTotal) / Math.max(signalSum, 1);

    classifiedParagraphs.push({
      index: pIdx,
      classification,
      confidence: Math.round(confidence * 100) / 100,
      sceneSignalCount: paragraphSceneTotal,
      summarySignalCount: paragraphSummaryTotal,
    });
  }

  const sceneCount = classifiedParagraphs.filter(p => p.classification === 'scene').length;
  const summaryCount = classifiedParagraphs.filter(p => p.classification === 'summary').length;
  const sceneRatio = sceneCount / totalParagraphs;
  const summaryRatio = summaryCount / totalParagraphs;
  const idealRange = { min: 0.5, max: 0.75 };
  const isInRange = sceneRatio >= idealRange.min && sceneRatio <= idealRange.max;

  let longestSummaryStretch = 0;
  let currentStretch = 0;
  for (const p of classifiedParagraphs) {
    if (p.classification === 'summary') {
      currentStretch++;
      if (currentStretch > longestSummaryStretch) longestSummaryStretch = currentStretch;
    } else {
      currentStretch = 0;
    }
  }

  let recommendation: string | undefined;
  if (sceneRatio < idealRange.min) {
    const firstSummary = classifiedParagraphs.find(p => p.classification === 'summary');
    if (firstSummary) {
      recommendation =
        `Your essay leans too heavily on summary (${Math.round(summaryRatio * 100)}% summary). ` +
        `Consider converting paragraph ${firstSummary.index + 1} into a vivid scene.`;
    } else {
      recommendation =
        `Your scene ratio (${Math.round(sceneRatio * 100)}%) is below ideal. ` +
        `Try adding concrete, in-the-moment details to create more clearly defined scenes.`;
    }
  } else if (sceneRatio > idealRange.max) {
    recommendation =
      `Your essay is heavily scene-driven (${Math.round(sceneRatio * 100)}% scene). ` +
      `Add reflective passages that connect events to personal growth.`;
  }

  return {
    sceneRatio: Math.round(sceneRatio * 100) / 100,
    summaryRatio: Math.round(summaryRatio * 100) / 100,
    idealRange, isInRange, paragraphs: classifiedParagraphs,
    longestSummaryStretch, recommendation,
  };
}


// ============================================================================
// ANALYZER 3: SHOW VS TELL DETECTION
// ============================================================================

const COMMON_EMOTION_ADJECTIVES = new Set([
  'happy', 'sad', 'nervous', 'excited', 'angry', 'scared', 'anxious',
  'proud', 'grateful', 'lonely', 'frustrated', 'overwhelmed', 'confused',
  'embarrassed', 'ashamed',
]);

interface TellPatternDef {
  pattern: RegExp;
  label: string;
  fallbackEmotion?: string;
}

const TELL_PATTERNS: TellPatternDef[] = [
  { pattern: /\bI\s+(?:was|felt|am|became|grew)\s+(\w+)/i, label: 'I was/felt [emotion]' },
  {
    pattern: /\bIt\s+was\s+(amazing|incredible|terrible|wonderful|awful|great|horrible|beautiful|devastating|overwhelming)/i,
    label: 'It was [adjective]',
  },
  { pattern: /\bI\s+(?:knew|realized|understood)\s+that\b/i, label: 'I knew/realized that', fallbackEmotion: 'realized' },
  { pattern: /\b(?:\w+)\s+made\s+me\s+feel\s+(\w+)/i, label: '[X] made me feel [emotion]' },
  { pattern: /\bI\s+(?:was|am)\s+so\s+(\w+)/i, label: 'I was so [emotion]' },
  { pattern: /\bI\s+felt\s+(?:like|as\s+if)\b/i, label: 'I felt like/as if', fallbackEmotion: 'detached' },
];

const IT_WAS_ADJECTIVES = new Set([
  'amazing', 'incredible', 'terrible', 'wonderful', 'awful',
  'great', 'horrible', 'beautiful', 'devastating', 'overwhelming',
]);

function isEmotionWord(word: string): boolean {
  const lower = word.toLowerCase();
  return EMOTION_WORDS.has(lower) || COMMON_EMOTION_ADJECTIVES.has(lower) || IT_WAS_ADJECTIVES.has(lower);
}

interface TellMatch {
  emotionWord: string;
  tellPattern: string;
}

function findTellMatch(sentence: string): TellMatch | null {
  for (const def of TELL_PATTERNS) {
    const match = def.pattern.exec(sentence);
    if (!match) continue;
    const capturedWord = match[1] || def.fallbackEmotion;
    if (!capturedWord) continue;
    if (def.fallbackEmotion || isEmotionWord(capturedWord)) {
      return { emotionWord: capturedWord.toLowerCase(), tellPattern: def.label };
    }
  }
  return null;
}

/**
 * Possessive + noun + verb syntactic pattern — structural "showing" indicator.
 * Matches "my throat tightened", "her back rigid", "his eyes widened" —
 * the PATTERN, not specific words.
 */
const POSSESSIVE_NOUN_VERB_PATTERN = /\b(?:my|his|her|their|its|our|your)\s+\w+\s+\w+(?:ed|s|ing)\b/gi;

/**
 * Mathematical "showing" indicators — NO word lists.
 * Returns a show indicator count based on structural text properties.
 */
function countStructuralShowIndicators(
  sentence: string,
  words: string[],
  lowerSentence: string,
): { count: number; signals: string[] } {
  let count = 0;
  const signals: string[] = [];

  // Concrete noun density: low abstract-noun ratio = more grounded/shown
  let abstractCount = 0;
  for (const w of words) {
    if (w.length >= 5 && (/tion$/.test(w) || /ment$/.test(w) || /ness$/.test(w) || /ity$/.test(w))) {
      abstractCount++;
    }
  }
  const abstractRatio = words.length > 0 ? abstractCount / words.length : 0;
  if (abstractRatio < 0.05 && words.length >= 5) {
    count += 1;
    signals.push('concrete language (low abstraction)');
  }

  // Sensory attribution pattern: possessive + noun + verb (syntactic, not content)
  const possessiveMatches = sentence.match(POSSESSIVE_NOUN_VERB_PATTERN) || [];
  if (possessiveMatches.length > 0) {
    count += possessiveMatches.length;
    signals.push(`sensory attribution pattern (${possessiveMatches.length})`);
  }

  // Dialogue proximity — dialogue = scene = showing
  if (DIALOGUE_MARKER_RE.test(sentence)) {
    count += 1;
    signals.push('dialogue');
  }

  // Proper nouns (specific people/places = grounded)
  const properNouns = words.filter((w, i) => i > 0 && /^[A-Z]/.test(w) && !ENTITY_EXCLUSIONS.has(w));
  if (properNouns.length > 0) {
    count += 1;
    signals.push('proper nouns (specificity)');
  }

  // Numbers = concrete detail
  if (/\d/.test(sentence)) {
    count += 1;
    signals.push('concrete detail (number)');
  }

  // Short sentence with low abstraction = immediate, grounded moment
  if (words.length <= 8 && abstractRatio === 0 && words.length >= 3) {
    count += 1;
    signals.push('short grounded sentence');
  }

  return { count, signals };
}

/**
 * Analyzer 3 — Show vs Tell Detection
 *
 * Identifies sentences that "tell" emotions directly (e.g. "I was nervous")
 * vs sentences that "show" through structural text properties.
 * Output uses teaching principles instead of prescriptive suggestions.
 */
export function analyzeShowVsTell(text: string): ShowVsTellAnalysis {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) {
    return { overallShowRatio: 0, paragraphs: [], tellOpportunities: [], showExemplars: [] };
  }

  const paragraphResults: ShowVsTellAnalysis['paragraphs'] = [];
  let totalShows = 0;
  let totalTells = 0;

  interface TellCandidate {
    sentenceText: string;
    paragraphIndex: number;
    emotionWord: string;
    tellPattern: string;
    length: number;
    hasNearbyShowing: boolean; // Contextual: is there showing in the same paragraph?
  }
  interface ShowCandidate {
    sentenceText: string;
    paragraphIndex: number;
    showSignals: string[];
    showCount: number;
  }
  const allTellCandidates: TellCandidate[] = [];
  const allShowCandidates: ShowCandidate[] = [];

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx];
    const sentences = splitSentences(paragraph);
    let paragraphShowCount = 0;
    let paragraphTellCount = 0;
    const paragraphHasDialogue = DIALOGUE_MARKER_RE.test(paragraph);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const words = splitWords(sentence);
      const tellMatch = findTellMatch(sentence);
      const showResult = countStructuralShowIndicators(sentence, words, lowerSentence);

      if (showResult.count >= 2) {
        paragraphShowCount++;
        allShowCandidates.push({
          sentenceText: sentence, paragraphIndex: pIdx,
          showSignals: showResult.signals, showCount: showResult.count,
        });
      } else if (tellMatch) {
        paragraphTellCount++;
        allTellCandidates.push({
          sentenceText: sentence, paragraphIndex: pIdx,
          emotionWord: tellMatch.emotionWord, tellPattern: tellMatch.tellPattern,
          length: sentence.length,
          hasNearbyShowing: paragraphHasDialogue || paragraphShowCount > 0,
        });
      }
    }

    totalShows += paragraphShowCount;
    totalTells += paragraphTellCount;
    const showRatio = paragraphShowCount / Math.max(paragraphShowCount + paragraphTellCount, 1);
    paragraphResults.push({
      index: pIdx, showCount: paragraphShowCount,
      tellCount: paragraphTellCount, showRatio: Math.round(showRatio * 100) / 100,
    });
  }

  // Build principle-based tell opportunities (not prescriptive suggestions)
  const tellOpportunities = allTellCandidates
    .sort((a, b) => b.length - a.length)
    .slice(0, 5)
    .map(t => {
      const principle = selectPrincipleForEmotion(t.emotionWord);
      return {
        sentenceText: t.sentenceText,
        paragraphIndex: t.paragraphIndex,
        toldEmotion: t.emotionWord,
        tellPattern: t.tellPattern,
        principle: principle.name,
        llmQuestion: t.hasNearbyShowing
          ? `This tell appears near showing — is it intentional summary between shown moments, or a missed opportunity?`
          : principle.questionToWriter,
      };
    });

  const showExemplars = allShowCandidates
    .sort((a, b) => b.showCount - a.showCount)
    .slice(0, 3)
    .map(s => ({
      sentenceText: s.sentenceText, paragraphIndex: s.paragraphIndex,
      showSignals: s.showSignals,
    }));

  const overallShowRatio = totalShows / Math.max(totalShows + totalTells, 1);

  return {
    overallShowRatio: Math.round(overallShowRatio * 100) / 100,
    paragraphs: paragraphResults, tellOpportunities, showExemplars,
  };
}


// ============================================================================
// ANALYZER 4: NARRATIVE ARC HEURISTIC
// ============================================================================

const POSITIVE_EMOTION_SUBSET = new Set([
  'happy', 'joyful', 'proud', 'excited', 'thrilled',
  'grateful', 'hopeful', 'peaceful', 'relieved', 'elated',
]);

const NEGATIVE_EMOTION_SUBSET = new Set([
  'afraid', 'angry', 'anxious', 'ashamed', 'bitter', 'confused',
  'desperate', 'disappointed', 'embarrassed', 'frustrated', 'guilty',
  'heartbroken', 'helpless', 'humiliated', 'jealous', 'lonely',
  'nervous', 'overwhelmed', 'panicked', 'regretful', 'resentful',
  'sad', 'scared', 'shocked', 'terrified', 'torn', 'uncertain',
  'worried', 'devastated', 'furious', 'grief', 'horror', 'rage',
]);

const ARC_TEMPLATES: Record<Exclude<NarrativeArcType, 'ambiguous'>, [number, number, number, number]> = {
  man_in_hole:    [ 0.3, -0.5, -0.3,  0.5],
  cinderella:     [-0.5, -0.3,  0.3,  0.6],
  icarus:         [ 0.5,  0.4, -0.4, -0.2],
  quest:          [ 0.0,  0.2, -0.3,  0.5],
  rags_to_riches: [-0.6, -0.2,  0.3,  0.6],
};

/**
 * Analyzer 4 — Narrative Arc Heuristic
 *
 * Splits the essay into 4 quarters, computes emotional valence per quarter,
 * then matches against 5 classic narrative arc templates via cosine similarity.
 */
export function analyzeNarrativeArc(text: string): NarrativeArcAnalysis {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return {
      detectedArc: 'ambiguous', confidence: 0, quarterValences: [0, 0, 0, 0],
      acts: [], alternativeArcs: [],
      structuralNotes: {
        hasSetup: false, hasConflict: false, hasClimaxOrTurningPoint: false,
        hasResolution: false, hasDenouement: false,
      },
    };
  }

  const quarterIndices = distributeQuarters(paragraphs.length);
  const quarterValences: [number, number, number, number] = [0, 0, 0, 0];
  const acts: NarrativeArcAnalysis['acts'] = [];

  for (let q = 0; q < 4; q++) {
    const indices = quarterIndices[q];
    if (indices.length === 0) {
      acts.push({
        quarterIndex: q, paragraphRange: [0, 0] as [number, number],
        emotionalValence: 0, dominantSignals: [], keyMoments: [],
      });
      continue;
    }

    const quarterText = indices.map(i => paragraphs[i]).join('\n');
    const quarterWords = splitWords(quarterText);
    const quarterLower = quarterText.toLowerCase();

    const achievementCount = countWordSetMatches(quarterWords, ACHIEVEMENT_MARKERS);
    const growthCount = countWordSetMatches(quarterWords, GROWTH_LANGUAGE);
    const positiveEmotionCount = countWordSetMatches(quarterWords, POSITIVE_EMOTION_SUBSET);
    const growthPhraseCount = countPhraseSetMatches(quarterLower, GROWTH_LANGUAGE);
    const positiveTotal = achievementCount + growthCount + growthPhraseCount + positiveEmotionCount;

    const vulnerabilityCount = countWordSetMatches(quarterWords, VULNERABILITY_MARKERS);
    const negativeEmotionCount = countWordSetMatches(quarterWords, NEGATIVE_EMOTION_SUBSET);
    const negativeTotal = vulnerabilityCount + negativeEmotionCount;

    const curiosityCount = countWordSetMatches(quarterWords, CURIOSITY_MARKERS);
    const reflectionCount = countWordSetMatches(quarterWords, REFLECTION_MARKERS);
    const reflectionPhraseCount = countPhraseSetMatches(quarterLower, REFLECTION_MARKERS);
    const neutralTotal = curiosityCount + reflectionCount + reflectionPhraseCount;

    const totalSignals = positiveTotal + negativeTotal + neutralTotal;
    const rawValence = (positiveTotal - negativeTotal) / Math.max(totalSignals, 1);
    const valence = clamp(rawValence, -1, 1);
    quarterValences[q] = valence;

    const signalBreakdown = [
      { label: 'achievement', count: achievementCount },
      { label: 'growth', count: growthCount + growthPhraseCount },
      { label: 'positive_emotion', count: positiveEmotionCount },
      { label: 'vulnerability', count: vulnerabilityCount },
      { label: 'negative_emotion', count: negativeEmotionCount },
      { label: 'curiosity', count: curiosityCount },
      { label: 'reflection', count: reflectionCount + reflectionPhraseCount },
    ];
    signalBreakdown.sort((a, b) => b.count - a.count);
    const dominantSignals = signalBreakdown.filter(s => s.count > 0).slice(0, 3).map(s => s.label);

    const keyMoments = getKeyMoments(quarterText, [
      ACHIEVEMENT_MARKERS, GROWTH_LANGUAGE, VULNERABILITY_MARKERS,
      EMOTION_WORDS, CURIOSITY_MARKERS, REFLECTION_MARKERS,
    ]);

    acts.push({
      quarterIndex: q,
      paragraphRange: [indices[0], indices[indices.length - 1]] as [number, number],
      emotionalValence: valence, dominantSignals, keyMoments,
    });
  }

  // Match against arc templates
  const arcScores: Array<{ arc: Exclude<NarrativeArcType, 'ambiguous'>; confidence: number }> = [];
  for (const [arcName, template] of Object.entries(ARC_TEMPLATES) as Array<
    [Exclude<NarrativeArcType, 'ambiguous'>, [number, number, number, number]]
  >) {
    const rawSimilarity = cosineSimilarity(quarterValences, template);
    arcScores.push({ arc: arcName, confidence: Math.max(0, rawSimilarity) });
  }
  arcScores.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = arcScores[0];
  const detectedArc: NarrativeArcType = bestMatch.confidence > 0.5 ? bestMatch.arc : 'ambiguous';
  const alternativeArcs = arcScores.slice(1)
    .filter(a => a.confidence > 0.2)
    .map(a => ({ arc: a.arc as NarrativeArcType, confidence: a.confidence }));

  // Structural notes
  const hasSetup = quarterIndices[0].length > 0;
  const hasConflict = quarterValences.some(v => v < 0);
  let hasClimaxOrTurningPoint = false;
  for (let i = 0; i < 3; i++) {
    if ((quarterValences[i] < 0 && quarterValences[i + 1] > 0) ||
        (quarterValences[i] > 0 && quarterValences[i + 1] < 0)) {
      hasClimaxOrTurningPoint = true;
      break;
    }
  }
  const hasResolution = quarterValences[3] > quarterValences[2];
  const q4Indices = quarterIndices[3];
  let hasDenouement = false;
  if (q4Indices.length > 0) {
    const q4Text = q4Indices.map(i => paragraphs[i]).join('\n');
    const q4Words = splitWords(q4Text);
    const q4Lower = q4Text.toLowerCase();
    const reflectionHits = countWordSetMatches(q4Words, REFLECTION_MARKERS) + countPhraseSetMatches(q4Lower, REFLECTION_MARKERS);
    const growthHits = countWordSetMatches(q4Words, GROWTH_LANGUAGE) + countPhraseSetMatches(q4Lower, GROWTH_LANGUAGE);
    hasDenouement = reflectionHits > 0 || growthHits > 0;
  }

  return {
    detectedArc, confidence: bestMatch.confidence, quarterValences, acts, alternativeArcs,
    structuralNotes: { hasSetup, hasConflict, hasClimaxOrTurningPoint, hasResolution, hasDenouement },
  };
}


// ============================================================================
// ANALYZER 5: EMOTIONAL JOURNEY TYPING
// ============================================================================

const EMOTION_CATEGORY_MAP: Array<{ category: EmotionalCategory; words: Set<string> }> = [
  { category: 'vulnerability', words: new Set([
    'vulnerable', 'ashamed', 'embarrassed', 'humiliated', 'helpless', 'powerless', 'exposed',
    'failed', 'failure', 'flaw', 'weakness', 'insecure', 'broke', 'confession', 'admit',
    'honest', 'truth', 'painful',
  ]) },
  { category: 'shame', words: new Set([
    'ashamed', 'guilty', 'regretful', 'humiliated', 'embarrassed', 'shameful',
    'shame', 'guilt', 'regret', 'mistake', 'wrong',
  ]) },
  { category: 'fear', words: new Set([
    'afraid', 'scared', 'terrified', 'anxious', 'nervous', 'panicked', 'worried',
    'fear', 'horror', 'desperate',
  ]) },
  { category: 'sadness', words: new Set([
    'sad', 'heartbroken', 'grief', 'lonely', 'disappointed', 'devastated',
    'crying', 'tears', 'hurt',
  ]) },
  { category: 'anger', words: new Set(['angry', 'furious', 'frustrated', 'resentful', 'rage', 'bitter']) },
  { category: 'confusion', words: new Set(['confused', 'uncertain', 'torn', 'puzzled', 'lost', 'bewildered', 'doubt']) },
  { category: 'surprise', words: new Set(['shocked', 'overwhelmed', 'stunned']) },
  { category: 'anticipation', words: new Set(['excited', 'thrilled', 'curious', 'fascinated', 'intrigued', 'wondered', 'hopeful']) },
  { category: 'pride', words: new Set(['proud', 'accomplished', 'earned', 'recognition', 'honor']) },
  { category: 'joy', words: new Set(['happy', 'joyful', 'elated', 'thrilled', 'excited', 'peaceful', 'relieved', 'grateful', 'love']) },
  { category: 'trust', words: new Set(['grateful', 'hopeful', 'peaceful', 'relieved']) },
  { category: 'determination', words: new Set(['overcame', 'persisted', 'fought', 'dedicated', 'committed', 'resolved', 'struggle']) },
];

const TOTAL_EMOTION_CATEGORIES = 12;

function resolveEmotionCategory(word: string): EmotionalCategory | undefined {
  for (const entry of EMOTION_CATEGORY_MAP) {
    if (entry.words.has(word)) return entry.category;
  }
  return undefined;
}

/**
 * Analyzer 5 — Emotional Journey Typing
 *
 * Maps the evolution of emotions across paragraphs using BOTH:
 * 1. Word-based emotion detection (demoted to ~20% weight)
 * 2. Mathematical shift detection (primary: vocabulary shift, pacing shift,
 *    negation density shift, person shift, abstraction shift)
 */
export function analyzeEmotionalJourney(text: string): EmotionalJourneyAnalysis {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return {
      paragraphs: [],
      trajectory: { pattern: 'monotone', uniqueEmotionCount: 0, transitions: [], monotoneStretches: [], varietyScore: 0 },
      evaluation: {
        isEngaging: false, isAuthentic: false,
        strongestMoment: { paragraph: 0, emotion: 'joy', intensity: 0 },
        weakestMoment: { paragraph: 0, reason: 'No content to analyze' },
      },
    };
  }

  // Get structural analysis for mathematical shift detection
  const structural = analyzeStructuralPatterns(text);

  const allDetectedCategories = new Set<EmotionalCategory>();

  const paragraphResults = paragraphs.map((para, index) => {
    const words = splitWords(para);
    const totalWordCount = words.length;
    const emotionWords: Array<{ word: string; category: EmotionalCategory }> = [];
    const categoryCounts = new Map<EmotionalCategory, number>();

    for (const word of words) {
      if (!EMOTION_WORDS.has(word) && !VULNERABILITY_MARKERS.has(word)) continue;
      const category = resolveEmotionCategory(word);
      if (category === undefined) continue;
      emotionWords.push({ word, category });
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      allDetectedCategories.add(category);
    }

    const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
    const dominantEmotions: EmotionalCategory[] = [];
    if (sortedCategories.length >= 1) dominantEmotions.push(sortedCategories[0][0]);
    if (sortedCategories.length >= 2 && sortedCategories[1][1] > 0) dominantEmotions.push(sortedCategories[1][0]);

    return {
      index, dominantEmotions, emotionWordCount: emotionWords.length,
      intensity: emotionWords.length / Math.max(totalWordCount, 1), emotionWords,
    };
  });

  // Word-based transitions (kept as secondary signal)
  const transitions: Array<{ from: EmotionalCategory; to: EmotionalCategory; atParagraph: number }> = [];
  for (let i = 1; i < paragraphResults.length; i++) {
    const prevDominant = paragraphResults[i - 1].dominantEmotions[0];
    const currDominant = paragraphResults[i].dominantEmotions[0];
    if (prevDominant && currDominant && prevDominant !== currDominant) {
      transitions.push({ from: prevDominant, to: currDominant, atParagraph: i });
    }
  }

  // Monotone stretches — now detected BOTH by word match AND mathematical shift
  const monotoneStretches: Array<{ emotion: EmotionalCategory; startParagraph: number; length: number }> = [];
  let stretchStart = 0;
  let stretchEmotion: EmotionalCategory | undefined = paragraphResults[0]?.dominantEmotions[0];
  for (let i = 1; i < paragraphResults.length; i++) {
    const currDominant = paragraphResults[i].dominantEmotions[0];
    // Check mathematical shift — large vocab/pacing shift breaks monotone even with same emotion words
    const shift = structural.shifts[i - 1];
    const hasSignificantShift = shift && (shift.vocabularyShift > 0.6 || shift.pacingShift > 5);

    if ((currDominant !== stretchEmotion || hasSignificantShift) || stretchEmotion === undefined) {
      const stretchLen = i - stretchStart;
      if (stretchLen >= 3 && stretchEmotion !== undefined) {
        monotoneStretches.push({ emotion: stretchEmotion, startParagraph: stretchStart, length: stretchLen });
      }
      stretchStart = i;
      stretchEmotion = currDominant;
    }
  }
  const finalStretchLen = paragraphResults.length - stretchStart;
  if (finalStretchLen >= 3 && stretchEmotion !== undefined) {
    monotoneStretches.push({ emotion: stretchEmotion, startParagraph: stretchStart, length: finalStretchLen });
  }

  // Variety score: 80% mathematical shift variance + 20% word-based emotion count
  const uniqueEmotionCount = allDetectedCategories.size;
  const wordVarietyScore = uniqueEmotionCount / TOTAL_EMOTION_CATEGORIES;

  // Mathematical variety: variance of shift magnitudes across paragraphs
  let shiftVarietyScore = 0;
  if (structural.shifts.length > 0) {
    const shiftMagnitudes = structural.shifts.map(s =>
      s.vocabularyShift + s.pacingShift / 20 + s.abstractionShift * 5 + s.personShift * 10
    );
    const meanShift = shiftMagnitudes.reduce((a, b) => a + b, 0) / shiftMagnitudes.length;
    const shiftVariance = shiftMagnitudes.reduce((sum, m) => sum + (m - meanShift) ** 2, 0) / shiftMagnitudes.length;
    // High variance = essay moves through different emotional territories
    shiftVarietyScore = Math.min(1, Math.sqrt(shiftVariance) * 2);
  }
  const varietyScore = shiftVarietyScore * 0.8 + wordVarietyScore * 0.2;

  // Trajectory pattern — primarily from mathematical shifts
  let pattern: EmotionalTrajectoryPattern = 'monotone';

  if (structural.shifts.length > 0) {
    const vocabShifts = structural.shifts.map(s => s.vocabularyShift);
    const avgVocabShift = vocabShifts.reduce((a, b) => a + b, 0) / vocabShifts.length;

    // Monotone: uniformly low shift values
    if (avgVocabShift < 0.4 && varietyScore < 0.3) {
      pattern = 'monotone';
    } else {
      // Valley-peak: shifts start low, spike mid-essay, settle
      const halfIdx = Math.floor(vocabShifts.length / 2);
      const firstHalfShift = vocabShifts.slice(0, halfIdx).reduce((a, b) => a + b, 0) / Math.max(halfIdx, 1);
      const secondHalfShift = vocabShifts.slice(halfIdx).reduce((a, b) => a + b, 0) / Math.max(vocabShifts.length - halfIdx, 1);

      // Check for building: consistent increasing shifts
      let increasingShifts = 0;
      for (let i = 1; i < vocabShifts.length; i++) {
        if (vocabShifts[i] > vocabShifts[i - 1]) increasingShifts++;
      }
      const buildingFraction = increasingShifts / Math.max(vocabShifts.length - 1, 1);

      // Check for oscillating: alternating large and small shifts
      let alternations = 0;
      for (let i = 1; i < vocabShifts.length; i++) {
        const prevLarge = vocabShifts[i - 1] > avgVocabShift;
        const currLarge = vocabShifts[i] > avgVocabShift;
        if (prevLarge !== currLarge) alternations++;
      }
      const alternationFraction = alternations / Math.max(vocabShifts.length - 1, 1);

      if (buildingFraction > 0.6) {
        pattern = 'building';
      } else if (alternationFraction > 0.6) {
        pattern = 'oscillating';
      } else if (secondHalfShift > firstHalfShift * 1.5) {
        pattern = 'ascending_variety';
      } else if (firstHalfShift > secondHalfShift * 1.3) {
        pattern = 'valley_peak';
      }
    }
  }

  // Evaluation
  const isEngaging = varietyScore >= 0.25 || transitions.length >= 2;
  const hasVulnerability = allDetectedCategories.has('vulnerability') || allDetectedCategories.has('shame');
  const lastParaDominant = paragraphResults[paragraphResults.length - 1]?.dominantEmotions || [];
  const endsExclusivelyOnPrideJoy = lastParaDominant.length > 0 && lastParaDominant.every(e => e === 'pride' || e === 'joy');
  const isAuthentic = hasVulnerability && !endsExclusivelyOnPrideJoy;

  let strongestIdx = 0;
  let maxIntensity = 0;
  for (const p of paragraphResults) {
    if (p.intensity > maxIntensity) { maxIntensity = p.intensity; strongestIdx = p.index; }
  }
  const strongestDominant = paragraphResults[strongestIdx]?.dominantEmotions[0] || 'joy';

  let weakestIdx = 0;
  let minIntensity = Infinity;
  for (const p of paragraphResults) {
    if (p.intensity < minIntensity) { minIntensity = p.intensity; weakestIdx = p.index; }
  }
  const weakestResult = paragraphResults[weakestIdx];
  const weakestReason = weakestResult.emotionWordCount === 0 ? 'No emotional signals' : 'Low emotional intensity';

  return {
    paragraphs: paragraphResults,
    trajectory: { pattern, uniqueEmotionCount, transitions, monotoneStretches, varietyScore: Math.round(varietyScore * 100) / 100 },
    evaluation: {
      isEngaging, isAuthentic,
      strongestMoment: { paragraph: strongestIdx, emotion: strongestDominant, intensity: maxIntensity },
      weakestMoment: { paragraph: weakestIdx, reason: weakestReason },
    },
  };
}


// ============================================================================
// ANALYZER 6: INFORMATION DENSITY
// ============================================================================

function classifyDensityLevel(score: number): DensityLevel {
  if (score >= 70) return 'high_density';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low_density';
  return 'redundant';
}

/**
 * Analyzer 6 — Information Density
 *
 * Measures how much new information each paragraph contributes via
 * type-token ratio, novel concept tracking, Shannon entropy, and
 * 3-gram repetition detection.
 */
export function analyzeInformationDensity(text: string): InformationDensityAnalysis {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) {
    return {
      paragraphs: [], mostRedundantParagraph: 0, mostInformativeParagraph: 0,
      overallDensityScore: 0, redundancyFlags: [],
    };
  }

  const allPreviousWords = new Set<string>();
  const previousTrigrams = new Map<string, number>();
  const redundancyFlags: InformationDensityAnalysis['redundancyFlags'] = [];

  const paragraphResults = paragraphs.map((para, index) => {
    const words = splitWords(para);
    const totalWords = words.length;
    const uniqueWords = new Set(words);
    const typeTokenRatio = totalWords > 0 ? uniqueWords.size / totalWords : 0;

    let novelConceptCount = 0;
    for (const word of uniqueWords) {
      if (!allPreviousWords.has(word)) novelConceptCount++;
    }

    const trigrams = extractNgrams(words, 3);
    const repeatedPhrases: string[] = [];
    const seenRepeats = new Set<string>();
    for (const trigram of trigrams) {
      if (previousTrigrams.has(trigram) && !seenRepeats.has(trigram)) {
        seenRepeats.add(trigram);
        repeatedPhrases.push(trigram);
        redundancyFlags.push({
          paragraphIndex: index,
          repeatedFrom: previousTrigrams.get(trigram)!,
          repeatedPhrase: trigram,
        });
      }
    }

    const entropy = computeNormalizedEntropy(words);
    let densityScore = totalWords > 0 ? (novelConceptCount / totalWords) * entropy * 100 : 0;
    densityScore = clamp(densityScore, 0, 100);

    for (const word of words) allPreviousWords.add(word);
    for (const trigram of trigrams) {
      if (!previousTrigrams.has(trigram)) previousTrigrams.set(trigram, index);
    }

    return {
      index, densityScore, typeTokenRatio, novelConceptCount,
      repeatedPhrases, entropy, level: classifyDensityLevel(densityScore),
    };
  });

  const overallDensityScore = paragraphResults.reduce((sum, p) => sum + p.densityScore, 0) / paragraphResults.length;
  let mostRedundantParagraph = 0;
  let mostInformativeParagraph = 0;
  let minDensity = Infinity;
  let maxDensity = -Infinity;
  for (const p of paragraphResults) {
    if (p.densityScore < minDensity) { minDensity = p.densityScore; mostRedundantParagraph = p.index; }
    if (p.densityScore > maxDensity) { maxDensity = p.densityScore; mostInformativeParagraph = p.index; }
  }

  return { paragraphs: paragraphResults, mostRedundantParagraph, mostInformativeParagraph, overallDensityScore, redundancyFlags };
}


// ============================================================================
// ANALYZER 7: TENSION CURVE MAPPING
// ============================================================================

const CONFLICT_WORDS = new Set([
  'but', 'however', 'despite', 'struggle', 'fight', 'challenge',
  'difficult', 'problem', 'obstacle', 'against', 'clash', 'tension',
  'disagree', 'confront',
]);

const STAKES_PATTERNS: RegExp[] = [
  /\bif I (?:didn't|hadn't|couldn't|failed)\b/i,
  /\beverything (?:depended|hinged|rode) on\b/i,
  /\bwhat if\b/i,
  /\bat stake\b/i,
  /\blast chance\b/i,
  /\bno turning back\b/i,
  /\bdo or die\b/i,
  /\bnow or never\b/i,
];

const REPETITION_STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'was', 'to', 'of', 'and', 'in',
  'that', 'it', 'for', 'with', 'on', 'at', 'i', 'my', 'me',
  'we', 'our', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'did', 'this', 'but', 'not', 'or', 'so', 'if',
  'no', 'are', 'were', 'they', 'them', 'their', 'he', 'she',
  'his', 'her', 'its', 'you', 'your',
]);

function hasDialogueInParagraph(text: string): boolean {
  return /["\u201C\u201D].+?["\u201C\u201D]/.test(text);
}

/**
 * Analyzer 7 — Tension Curve Mapping
 *
 * Computes per-paragraph tension (1-10) from MATHEMATICAL indicators —
 * measurable properties, not vocabulary. Flat spot detection uses deviation
 * from average on every metric.
 */
export function analyzeTensionCurve(text: string): TensionCurveAnalysis {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return {
      paragraphs: [],
      curve: { peakParagraph: 0, peakTension: 0, flatSpots: [], hookStrength: 0, closingStrength: 0 },
      evaluation: {
        overallEngagement: 'low', hasStrongHook: false, hasClimacticPeak: false,
        hasSatisfyingClose: false, flatSpotCount: 0, suggestions: ['Add content to analyze'],
      },
    };
  }

  // Get structural metrics for mathematical tension detection
  const structural = analyzeStructuralPatterns(text);

  const rawScores: number[] = [];
  const paragraphSources: TensionCurveAnalysis['paragraphs'][0]['sources'][] = [];
  const paragraphPenalties: TensionCurveAnalysis['paragraphs'][0]['penalties'][] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const words = splitWords(para);
    const sentences = splitSentences(para);
    const lowerPara = para.toLowerCase();
    const metrics = structural.paragraphs[i];

    // Vulnerability: kept as word-based signal (these ARE structural markers of personal risk)
    const vulnerabilityScore = words.filter(w => VULNERABILITY_MARKERS.has(w)).length * 2;

    // Conflict: mathematical — negation density + question density
    const conflictScore =
      (metrics.negationDensity > 0.04 ? 3 : metrics.negationDensity > 0.02 ? 1 : 0) +
      (metrics.questionDensity > 0.3 ? 2 : metrics.questionDensity > 0 ? 1 : 0);

    // Stakes: kept — these detect grammatical patterns, not content words
    let stakesCount = 0;
    for (const pattern of STAKES_PATTERNS) {
      if (pattern.test(lowerPara)) stakesCount++;
    }
    const stakesScore = stakesCount * 2;

    // Questions: mathematical — sentence ending in ?
    const questionsScore = sentences.filter(s => s.trim().endsWith('?')).length;

    // Pacing: sentence-length CV (high CV = varied pacing = engagement)
    const pacingScore =
      (metrics.sentenceLengthCV > 0.5 ? 2 : metrics.sentenceLengthCV > 0.3 ? 1 : 0) +
      (metrics.dialoguePresent ? 1 : 0);

    // Immersion: short-sentence clustering + fragment density + dialogue
    const shortSentences = sentences.filter(s => splitWords(s).length < 8);
    const fragmentCount = sentences.filter(s => splitWords(s).length < 4).length;
    const immersionScore =
      (shortSentences.length >= 3 ? 2 : shortSentences.length >= 2 ? 1 : 0) +
      (fragmentCount > 0 ? 1 : 0) +
      metrics.dialogueCount;

    // Pacing delta from previous paragraph
    const shift = structural.shifts[i - 1];
    const pacingDelta = shift ? (shift.pacingShift > 5 ? 1 : 0) : 0;

    // Proper noun introduction: new names = narrative movement
    const properNounBonus = metrics.properNounDensity > 0.03 ? 1 : 0;

    // Penalties
    const hasReflection = countWordSetMatches(words, REFLECTION_MARKERS) > 0 || countPhraseSetMatches(lowerPara, REFLECTION_MARKERS) > 0;
    const abstractSummaryPenalty = (hasReflection && metrics.abstractNounRatio > 0.05) ? 1 : 0;

    let clicheCount = 0;
    for (const cliche of CLICHES) { if (lowerPara.includes(cliche)) clicheCount++; }
    const clichePenalty = clicheCount;

    // Repetition: vocabulary shift < 0.3 from previous paragraph = not enough new content
    const repetitionPenalty = (shift && shift.vocabularyShift < 0.3) ? 1 : 0;

    const sourceTotal = vulnerabilityScore + conflictScore + stakesScore + questionsScore +
      pacingScore + immersionScore + pacingDelta + properNounBonus;
    const penaltyTotal = abstractSummaryPenalty + clichePenalty + repetitionPenalty;
    rawScores.push(sourceTotal - penaltyTotal);

    paragraphSources.push({
      vulnerability: vulnerabilityScore, conflict: conflictScore, stakes: stakesScore,
      questions: questionsScore, pacing: pacingScore + pacingDelta, immersion: immersionScore + properNounBonus,
    });
    paragraphPenalties.push({
      abstractSummary: abstractSummaryPenalty, cliche: clichePenalty, repetition: repetitionPenalty,
    });
  }

  // Normalize to 1-10
  const minRaw = Math.min(...rawScores);
  const maxRaw = Math.max(...rawScores);
  const rawRange = Math.max(maxRaw - minRaw, 1);
  const normalizedScores = rawScores.map(raw => clamp(Math.round(1 + ((raw - minRaw) / rawRange) * 9), 1, 10));

  // Trends
  const trends: TensionTrend[] = normalizedScores.map((score, i) => {
    if (i === 0) return 'flat';
    const diff = score - normalizedScores[i - 1];
    if (diff > 0.5) return 'rising';
    if (diff < -0.5) return 'falling';
    return 'flat';
  });

  const paragraphAnalysis: TensionCurveAnalysis['paragraphs'] = normalizedScores.map((tension, i) => ({
    index: i, tensionLevel: tension, trend: trends[i],
    sources: paragraphSources[i], penalties: paragraphPenalties[i],
  }));

  // Curve analysis
  let peakParagraph = 0;
  let peakTension = 0;
  for (let i = 0; i < normalizedScores.length; i++) {
    if (normalizedScores[i] > peakTension) { peakTension = normalizedScores[i]; peakParagraph = i; }
  }

  // Flat spot detection: paragraph is "flat" when ALL indicators are near the essay mean
  const flatSpots: TensionCurveAnalysis['curve']['flatSpots'] = [];
  let flatStart: number | null = null;
  for (let i = 0; i < normalizedScores.length; i++) {
    if (normalizedScores[i] <= 4) {
      if (flatStart === null) flatStart = i;
    } else {
      if (flatStart !== null) {
        const flatEnd = i - 1;
        if (flatEnd - flatStart + 1 >= 2) {
          const avgTension = normalizedScores.slice(flatStart, flatEnd + 1).reduce((a, b) => a + b, 0) / (flatEnd - flatStart + 1);
          flatSpots.push({ startParagraph: flatStart, endParagraph: flatEnd, avgTension: Math.round(avgTension * 10) / 10 });
        }
        flatStart = null;
      }
    }
  }
  if (flatStart !== null) {
    const flatEnd = normalizedScores.length - 1;
    if (flatEnd - flatStart + 1 >= 2) {
      const avgTension = normalizedScores.slice(flatStart, flatEnd + 1).reduce((a, b) => a + b, 0) / (flatEnd - flatStart + 1);
      flatSpots.push({ startParagraph: flatStart, endParagraph: flatEnd, avgTension: Math.round(avgTension * 10) / 10 });
    }
  }

  const hookStrength = normalizedScores[0];
  const closingStrength = normalizedScores[normalizedScores.length - 1];

  // Evaluation
  const avgTension = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
  let overallEngagement: EngagementLevel;
  if (avgTension >= 7) overallEngagement = 'high';
  else if (avgTension >= 5) overallEngagement = 'good';
  else if (avgTension >= 3) overallEngagement = 'moderate';
  else overallEngagement = 'low';

  const hasStrongHook = hookStrength >= 5;
  const totalParas = normalizedScores.length;
  const lowerBound = Math.floor(totalParas * 0.2);
  const upperBound = Math.ceil(totalParas * 0.8) - 1;
  const hasClimacticPeak = peakTension >= 7 && peakParagraph >= lowerBound && peakParagraph <= upperBound;
  const hasSatisfyingClose = closingStrength >= 4;

  const suggestions: string[] = [];
  if (!hasStrongHook) suggestions.push('Open with more tension \u2014 add stakes, a question, or varied pacing in paragraph 0');
  if (flatSpots.length > 0) {
    for (const spot of flatSpots) {
      const range = spot.startParagraph === spot.endParagraph
        ? `Paragraph ${spot.startParagraph}` : `Paragraphs ${spot.startParagraph}-${spot.endParagraph}`;
      suggestions.push(`${range} are flat \u2014 nothing is happening structurally`);
    }
  }
  if (!hasSatisfyingClose) suggestions.push('The closing lacks tension \u2014 end with reflection that echoes the opening stakes');
  if (!hasClimacticPeak) suggestions.push('The essay lacks a clear peak \u2014 build toward a moment of maximum tension in the middle');

  return {
    paragraphs: paragraphAnalysis,
    curve: { peakParagraph, peakTension, flatSpots, hookStrength, closingStrength },
    evaluation: {
      overallEngagement, hasStrongHook, hasClimacticPeak, hasSatisfyingClose,
      flatSpotCount: flatSpots.length, suggestions: suggestions.slice(0, 3),
    },
  };
}


// ============================================================================
// UNIFIED ENTRY POINT
// ============================================================================

/**
 * Run all 7 narrative analyzers on an essay text.
 *
 * Flow:
 * 1. classifyParagraphFunctions → ParagraphFunctionAnalysis[]
 * 2. analyzeNarrativeFlow → NarrativeFlowAnalysis
 * 3. Run all 7 analyzers (some receive paragraph functions as context)
 * 4. Collect llmEvaluationNeeded from all analyzers
 * 5. Compute overall score + top issues
 *
 * @param text - The raw essay text
 * @param _features - Extracted features (reserved for future use)
 * @param _metadata - Analysis metadata (reserved for future use)
 */
export function runNarrativeAnalysis(
  text: string,
  _features?: ExtractedFeatures,
  _metadata?: NarrativeAnalysisMetadata,
): NarrativeAnalysisResult {
  // Early return for empty/whitespace-only text
  if (!text || text.trim().length === 0) {
    return {
      specificity: analyzeSpecificityGradient(''),
      sceneVsSummary: analyzeSceneVsSummary(''),
      showVsTell: analyzeShowVsTell(''),
      narrativeArc: analyzeNarrativeArc(''),
      emotionalJourney: analyzeEmotionalJourney(''),
      informationDensity: analyzeInformationDensity(''),
      tensionCurve: analyzeTensionCurve(''),
      paragraphFunctions: [],
      narrativeFlow: {
        functionSequence: [], narrativeCycles: 0,
        missingFunctions: ['grounding', 'characterization', 'escalation', 'intimacy', 'contrast', 'release', 'reflection'],
        functionRepetition: 0, functionDiversity: 0,
      },
      llmEvaluationNeeded: [],
      overallNarrativeScore: 0, topIssues: [],
    };
  }

  // Step 1: Classify paragraph functions (runs first — context for other analyzers)
  const paragraphFunctions = classifyParagraphFunctions(text);

  // Step 2: Analyze narrative flow
  const narrativeFlow = analyzeNarrativeFlow(paragraphFunctions);

  // Step 3: Run all 7 analyzers (specificity now receives function context)
  const specificity = analyzeSpecificityGradient(text, paragraphFunctions);
  const sceneVsSummary = analyzeSceneVsSummary(text);
  const showVsTell = analyzeShowVsTell(text);
  const narrativeArc = analyzeNarrativeArc(text);
  const emotionalJourney = analyzeEmotionalJourney(text);
  const informationDensity = analyzeInformationDensity(text);
  const tensionCurve = analyzeTensionCurve(text);

  // Step 4: Collect llmEvaluationNeeded
  const llmEvaluationNeeded: string[] = [];
  const ambiguousParagraphs = paragraphFunctions.filter(p => p.detectedFunction === 'ambiguous');
  for (const p of ambiguousParagraphs) {
    llmEvaluationNeeded.push(`Paragraph ${p.index} function unclear — ${p.uncertainties.join(', ') || 'multiple competing signals'}`);
  }
  for (const opp of showVsTell.tellOpportunities) {
    llmEvaluationNeeded.push(`P${opp.paragraphIndex}: ${opp.llmQuestion}`);
  }
  if (narrativeArc.detectedArc === 'ambiguous') {
    llmEvaluationNeeded.push('Narrative arc ambiguous — evaluate overall story structure');
  }

  // Step 5: Compute overall narrative score
  const weights = {
    specificity: 0.15,
    sceneVsSummary: 0.15,
    showVsTell: 0.15,
    narrativeArc: 0.10,
    emotionalJourney: 0.15,
    informationDensity: 0.10,
    tensionCurve: 0.20,
  };

  const sceneScore = sceneVsSummary.isInRange ? 80 : Math.max(20, 100 - Math.abs(sceneVsSummary.sceneRatio - 0.625) * 200);
  const showScore = showVsTell.overallShowRatio * 100;
  const arcScore = narrativeArc.confidence * 100;
  const journeyScore = emotionalJourney.trajectory.varietyScore * 100;
  const tensionScore = (tensionCurve.curve.peakTension / 10) * 100;

  const overallNarrativeScore = Math.round(
    specificity.overallScore * weights.specificity +
    sceneScore * weights.sceneVsSummary +
    showScore * weights.showVsTell +
    arcScore * weights.narrativeArc +
    journeyScore * weights.emotionalJourney +
    informationDensity.overallDensityScore * weights.informationDensity +
    tensionScore * weights.tensionCurve
  );

  // Collect top issues
  const topIssues: Array<{ analyzer: string; issue: string; severity: NarrativeIssueSeverity }> = [];

  if (specificity.overallScore < 30) {
    topIssues.push({ analyzer: 'specificity', issue: 'Essay is highly abstract — add concrete details, names, and numbers', severity: 'critical' });
  } else if (specificity.overallScore < 50) {
    topIssues.push({ analyzer: 'specificity', issue: 'Several paragraphs lack concrete details', severity: 'important' });
  }

  if (!sceneVsSummary.isInRange && sceneVsSummary.sceneRatio < 0.5) {
    topIssues.push({ analyzer: 'sceneVsSummary', issue: 'Too much summary — convert key moments to vivid scenes', severity: 'critical' });
  }
  if (sceneVsSummary.longestSummaryStretch >= 3) {
    topIssues.push({ analyzer: 'sceneVsSummary', issue: `${sceneVsSummary.longestSummaryStretch} consecutive summary paragraphs — break up with a scene`, severity: 'important' });
  }

  if (showVsTell.tellOpportunities.length >= 3) {
    topIssues.push({ analyzer: 'showVsTell', issue: 'Multiple "telling" sentences — show emotions through physical details', severity: 'important' });
  }

  if (narrativeArc.detectedArc === 'ambiguous') {
    topIssues.push({ analyzer: 'narrativeArc', issue: 'No clear narrative arc detected — strengthen the emotional trajectory', severity: 'important' });
  }
  if (!narrativeArc.structuralNotes.hasConflict) {
    topIssues.push({ analyzer: 'narrativeArc', issue: 'No conflict or challenge detected — add vulnerability or struggle', severity: 'critical' });
  }

  if (!emotionalJourney.evaluation.isEngaging) {
    topIssues.push({ analyzer: 'emotionalJourney', issue: 'Emotional journey lacks variety — explore more emotional range', severity: 'important' });
  }
  if (!emotionalJourney.evaluation.isAuthentic) {
    topIssues.push({ analyzer: 'emotionalJourney', issue: 'Essay lacks authentic vulnerability', severity: 'minor' });
  }

  for (const suggestion of tensionCurve.evaluation.suggestions) {
    topIssues.push({ analyzer: 'tensionCurve', issue: suggestion, severity: 'important' });
  }

  if (informationDensity.redundancyFlags.length >= 3) {
    topIssues.push({ analyzer: 'informationDensity', issue: 'Multiple paragraphs repeat earlier content — tighten or remove redundancy', severity: 'minor' });
  }

  // Narrative flow issues
  if (narrativeFlow.functionDiversity < 0.3) {
    topIssues.push({ analyzer: 'narrativeFlow', issue: 'Low function diversity — essay uses few narrative modes', severity: 'important' });
  }
  if (narrativeFlow.functionRepetition >= 3) {
    topIssues.push({ analyzer: 'narrativeFlow', issue: `${narrativeFlow.functionRepetition} consecutive paragraphs serve the same function`, severity: 'minor' });
  }

  const severityOrder: Record<NarrativeIssueSeverity, number> = { critical: 0, important: 1, minor: 2 };
  topIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    specificity, sceneVsSummary, showVsTell, narrativeArc,
    emotionalJourney, informationDensity, tensionCurve,
    paragraphFunctions, narrativeFlow, llmEvaluationNeeded,
    overallNarrativeScore: clamp(overallNarrativeScore, 0, 100),
    topIssues: topIssues.slice(0, 8),
  };
}
