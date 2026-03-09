/**
 * Insight Depth & Uniqueness Analyzer — Phase 2C
 *
 * Analyzes insight quality signals in essay text: depth of reflection,
 * presence of surprise/contradiction, behavioral change evidence, and
 * uniqueness markers (cliche avoidance, callback structure, specific references).
 *
 * All analysis is heuristic (counting, pattern matching, presence detection).
 * Outputs are CONTEXT for the LLM, not verdicts.
 *
 * Building blocks reused:
 * - featureExtractor: splitParagraphs, splitSentences, splitWords
 * - structuralPatternDetector: isAbstractNoun, getContentWords, jaccardDistance
 */

import type {
  InsightDepthLevel,
  InsightDepthResult,
  InsightUniquenessResult,
  InsightAnalysisResult,
} from './contentAnalysisTypes';

import { CLICHE_INSIGHTS } from './contentAnalysisTypes';

import {
  splitParagraphs,
  splitSentences,
  splitWords,
} from '../workshop/scoring/featureExtractor';

import {
  isAbstractNoun,
  getContentWords,
  jaccardDistance,
} from '../workshop/scoring/structuralPatternDetector';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

const REFLECTION_PHRASES: string[] = [
  'i realized',
  'i now understand',
  'looking back',
  'what surprised me',
  'i never expected',
  "i didn't expect",
  'i came to see',
  'in hindsight',
  "it wasn't until",
  'i began to see',
  'i started to understand',
  "what i didn't know",
  'i now know',
  'for the first time',
  'taught me',
  'showed me',
  'i learned',
  'i discovered',
  'made me realize',
  'i came to understand',
  'i began to understand',
  'i now see',
];

const SURPRISE_CONTRADICTION_RE =
  /(?:I (?:never|didn't|did not) (?:expect|think|imagine|realize))|(?:surprised|unexpected|contrary to|paradox|contradiction|ironic)/i;

const BEHAVIORAL_CHANGE_RE =
  /(?:now I|since then|from that (?:point|day|moment)|I began to|I stopped|I started|I no longer|these days I|every time I now)/i;

// ============================================================================
// QUARTER EXTRACTION HELPERS
// ============================================================================

interface QuarterSlice {
  text: string;
  start: number;
  end: number;
}

function getQuarter(text: string, quarter: 'first' | 'middle' | 'final'): QuarterSlice {
  const len = text.length;
  switch (quarter) {
    case 'first':
      return { text: text.slice(0, Math.floor(len * 0.25)), start: 0, end: Math.floor(len * 0.25) };
    case 'middle':
      return { text: text.slice(Math.floor(len * 0.25), Math.floor(len * 0.75)), start: Math.floor(len * 0.25), end: Math.floor(len * 0.75) };
    case 'final':
      return { text: text.slice(Math.floor(len * 0.75)), start: Math.floor(len * 0.75), end: len };
  }
}

/** Count reflection phrase matches in a text region (case-insensitive) */
function countReflectionPhrases(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of REFLECTION_PHRASES) {
    if (lower.includes(phrase)) count++;
  }
  return count;
}

/** Check if any CLICHE_INSIGHTS phrase appears in text (case-insensitive substring) */
function hasClicheInsight(text: string): boolean {
  const lower = text.toLowerCase();
  return CLICHE_INSIGHTS.some(phrase => lower.includes(phrase));
}

/**
 * Compute insight specificity: ratio of non-abstract content words to total content words.
 * Higher = more concrete/specific language.
 */
function computeInsightSpecificity(text: string): number {
  const words = splitWords(text);
  const contentWords = words.filter(w => w.length > 2);
  if (contentWords.length === 0) return 0;
  const nonAbstractCount = contentWords.filter(w => !isAbstractNoun(w)).length;
  return nonAbstractCount / contentWords.length;
}

/**
 * Find the sentence containing the last reflection phrase in a text region.
 * Returns trimmed to maxLen characters, or undefined if no match.
 */
function findStrongestPassage(text: string, maxLen: number): string | undefined {
  const lower = text.toLowerCase();
  const sentences = splitSentences(text);

  let lastMatchSentence: string | undefined;
  for (const sentence of sentences) {
    const sentLower = sentence.toLowerCase();
    for (const phrase of REFLECTION_PHRASES) {
      if (sentLower.includes(phrase)) {
        lastMatchSentence = sentence;
        break;
      }
    }
  }

  if (!lastMatchSentence) return undefined;
  return lastMatchSentence.length > maxLen
    ? lastMatchSentence.slice(0, maxLen) + '...'
    : lastMatchSentence;
}

// ============================================================================
// INSIGHT DEPTH ANALYSIS
// ============================================================================

/**
 * Analyze insight depth in the essay.
 * Focuses on the final quarter where reflective insights typically appear,
 * while also checking for distributed reflection.
 */
export function analyzeInsightDepth(text: string): InsightDepthResult {
  if (!text || text.trim().length === 0) {
    return {
      level: 'none',
      score: 0,
      insightLocation: 'absent',
      markers: {
        reflectionPhraseCount: 0,
        hasSurpriseOrContradiction: false,
        hasBehavioralChange: false,
        isCliche: false,
        insightSpecificity: 0,
      },
      strongestPassage: undefined,
    };
  }

  const finalQ = getQuarter(text, 'final');
  const firstQ = getQuarter(text, 'first');
  const middleQ = getQuarter(text, 'middle');

  // Count reflection phrases in the final quarter
  const reflectionPhraseCount = countReflectionPhrases(finalQ.text);
  const firstQReflectionCount = countReflectionPhrases(firstQ.text);
  const middleReflectionCount = countReflectionPhrases(middleQ.text);

  // Surprise/contradiction detection in final quarter
  const hasSurprise = SURPRISE_CONTRADICTION_RE.test(finalQ.text);

  // Behavioral change detection in final quarter
  const hasBehavioralChange = BEHAVIORAL_CHANGE_RE.test(finalQ.text);

  // Cliche detection in final quarter
  const isCliche = hasClicheInsight(finalQ.text);

  // Insight specificity in final quarter
  const insightSpecificity = computeInsightSpecificity(finalQ.text);

  // Determine insight location
  let insightLocation: InsightDepthResult['insightLocation'];
  const hasInFinal = reflectionPhraseCount > 0;
  const hasInFirst = firstQReflectionCount > 0;
  const hasInMiddle = middleReflectionCount > 0;

  if (!hasInFinal && !hasInFirst && !hasInMiddle) {
    insightLocation = 'absent';
  } else if (hasInFinal && hasInFirst) {
    insightLocation = 'distributed';
  } else if (hasInFinal) {
    insightLocation = 'final_quarter';
  } else if (hasInFirst) {
    insightLocation = 'first_quarter';
  } else {
    insightLocation = 'middle';
  }

  // Scoring logic
  let level: InsightDepthLevel;
  let score: number;

  if (reflectionPhraseCount === 0) {
    level = 'none';
    score = 0;
  } else if (isCliche) {
    level = 'cliche';
    score = 15;
  } else if (insightSpecificity < 0.3) {
    level = 'observation';
    score = 35;
  } else if (!hasSurprise && !hasBehavioralChange) {
    level = 'understanding';
    score = 55;
  } else if (hasSurprise || hasBehavioralChange) {
    level = 'connection';
    score = 75;
  } else {
    // Logically unreachable given the conditions above, but included for completeness
    level = 'wisdom';
    score = 90;
  }

  // Find strongest passage in final quarter
  const strongestPassage = findStrongestPassage(finalQ.text, 150);

  return {
    level,
    score,
    insightLocation,
    markers: {
      reflectionPhraseCount,
      hasSurpriseOrContradiction: hasSurprise,
      hasBehavioralChange,
      isCliche,
      insightSpecificity,
    },
    strongestPassage,
  };
}

// ============================================================================
// INSIGHT UNIQUENESS ANALYSIS
// ============================================================================

/** Count proper nouns in text (capitalized non-sentence-start words) */
function countProperNouns(text: string): number {
  const STARTS = new Set([
    'I', 'The', 'A', 'An', 'It', 'This', 'That', 'My', 'We', 'He', 'She',
    'They', 'But', 'And', 'Or', 'So', 'Yet', 'For', 'In', 'On', 'At', 'To',
    'Of', 'By', 'Is', 'Was', 'Are', 'Were', 'Be', 'If', 'As', 'Do', 'Did',
    'Not', 'No', 'Its', 'Our', 'His', 'Her', 'All', 'One', 'Now', 'Then',
    'When', 'Where', 'How', 'What', 'Why', 'Who', 'Which', 'There', 'Here',
    'After', 'Before', 'During', 'While', 'Because', 'Although', 'Since',
    'Until', 'With', 'From', 'Each', 'Every', 'Some', 'Many', 'Most',
  ]);
  const sentences = splitSentences(text);
  let count = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const cleaned = words[i].replace(/[^a-zA-Z'-]/g, '');
      if (cleaned.length > 0 && /^[A-Z]/.test(cleaned) && !STARTS.has(cleaned)) {
        count++;
      }
    }
  }
  return count;
}

/** Count numbers in text */
function countNumbers(text: string): number {
  const matches = text.match(/\b\d[\d,]*(?:\.\d+)?\b/g);
  return matches ? matches.length : 0;
}

/**
 * Analyze insight uniqueness signals.
 * Checks for cliche language, specific experience references, and callback structure.
 */
export function analyzeInsightUniqueness(text: string): InsightUniquenessResult {
  if (!text || text.trim().length === 0) {
    return {
      usesClicheLanguage: false,
      referencesSpecificExperience: false,
      hasCallbackStructure: false,
    };
  }

  // Cliche language in full essay
  const usesClicheLanguage = hasClicheInsight(text);

  // Specific experience reference: final quarter has a proper noun or number
  // that also appeared in the first half
  const finalQ = getQuarter(text, 'final');
  const firstHalf = text.slice(0, Math.floor(text.length * 0.5));
  const firstHalfLower = firstHalf.toLowerCase();

  let referencesSpecificExperience = false;

  // Check proper nouns in final quarter that appear in first half
  const finalSentences = splitSentences(finalQ.text);
  for (const sentence of finalSentences) {
    const words = sentence.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const cleaned = words[i].replace(/[^a-zA-Z'-]/g, '');
      if (cleaned.length > 0 && /^[A-Z]/.test(cleaned)) {
        // Check if this proper noun appears in the first half (case-sensitive for proper nouns)
        if (firstHalf.includes(cleaned)) {
          referencesSpecificExperience = true;
          break;
        }
      }
    }
    if (referencesSpecificExperience) break;
  }

  // Also check numbers
  if (!referencesSpecificExperience) {
    const finalNumbers = finalQ.text.match(/\b\d[\d,]*(?:\.\d+)?\b/g) || [];
    for (const num of finalNumbers) {
      if (firstHalf.includes(num)) {
        referencesSpecificExperience = true;
        break;
      }
    }
  }

  // Callback structure: final 2 paragraphs share 2+ content words with first 2 paragraphs
  const paragraphs = splitParagraphs(text);
  let hasCallbackStructure = false;

  if (paragraphs.length >= 4) {
    const first2Words = getContentWords(splitWords(paragraphs.slice(0, 2).join(' ')));
    const last2Words = getContentWords(splitWords(paragraphs.slice(-2).join(' ')));

    // Count shared content words
    let sharedCount = 0;
    for (const w of first2Words) {
      if (last2Words.has(w)) sharedCount++;
    }
    hasCallbackStructure = sharedCount >= 2;
  } else if (paragraphs.length >= 2) {
    // For short essays (2-3 paragraphs), compare first and last paragraph
    const firstWords = getContentWords(splitWords(paragraphs[0]));
    const lastWords = getContentWords(splitWords(paragraphs[paragraphs.length - 1]));

    let sharedCount = 0;
    for (const w of firstWords) {
      if (lastWords.has(w)) sharedCount++;
    }
    hasCallbackStructure = sharedCount >= 2;
  }

  return {
    usesClicheLanguage,
    referencesSpecificExperience,
    hasCallbackStructure,
  };
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

/**
 * Analyze insight depth and uniqueness in an essay.
 *
 * Combines depth analysis (reflection phrases, surprise, behavioral change,
 * cliche detection, specificity) with uniqueness analysis (cliche language,
 * specific experience callbacks, structural echoes).
 */
export function analyzeInsight(text: string): InsightAnalysisResult {
  return {
    depth: analyzeInsightDepth(text),
    uniqueness: analyzeInsightUniqueness(text),
  };
}
