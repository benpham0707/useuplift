/**
 * Voice Fingerprint Builder
 *
 * Constructs a VoiceFingerprint from raw text using pure statistical analysis.
 * This is the foundational module — all other analyses derive from or
 * compare fingerprints.
 *
 * Performance target: < 10ms for a 650-word essay.
 * Dependencies: zero external, pure TypeScript.
 */

import type { VoiceFingerprint } from './types';
import {
  FUNCTION_WORDS,
  FUNCTION_WORD_SET,
  CONTRACTION_PAIRS,
  FORMAL_MARKERS,
  CASUAL_MARKERS,
  COLLOQUIALISMS,
  LATINATE_SUFFIXES,
  GERMANIC_CORE_WORDS,
  SUBORDINATE_CLAUSE_MARKERS,
} from './constants';
import {
  tokenize,
  splitSentences,
  splitParagraphs,
  countSyllables,
  mean,
  stdDev,
  skewness,
  median,
  autocorrelation,
  clamp,
} from './textUtils';

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build a complete VoiceFingerprint from raw text.
 *
 * @param text - The input text to analyze
 * @returns A VoiceFingerprint that can be stored and compared
 */
export function buildFingerprint(text: string): VoiceFingerprint {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);

  const wordCount = words.length;
  const sentenceCount = sentences.length;

  return {
    version: 1,
    computedAt: new Date().toISOString(),
    sourceWordCount: wordCount,
    functionWordFrequencies: computeFunctionWordFrequencies(words, wordCount),
    punctuation: computePunctuationMetrics(text, sentences, wordCount),
    sentenceMetrics: computeSentenceMetrics(sentences),
    paragraphMetrics: computeParagraphMetrics(paragraphs, sentences),
    contractions: computeContractionMetrics(text, wordCount),
    vocabulary: computeVocabularyMetrics(words, wordCount),
    rhythm: computeRhythmMetrics(words, sentences),
    register: computeRegisterMetrics(text, words, wordCount),
  };
}

// ============================================================================
// FUNCTION WORD FREQUENCIES
// ============================================================================

function computeFunctionWordFrequencies(
  words: string[],
  wordCount: number
): Record<string, number> {
  if (wordCount === 0) return {};

  const counts = new Map<string, number>();

  // Count function word occurrences
  for (const word of words) {
    if (FUNCTION_WORD_SET.has(word)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  // Convert to relative frequencies
  const frequencies: Record<string, number> = {};
  for (const fw of FUNCTION_WORDS) {
    const count = counts.get(fw) ?? 0;
    // Only include non-zero frequencies to save storage
    if (count > 0) {
      frequencies[fw] = Math.round((count / wordCount) * 10000) / 10000;
    }
  }

  return frequencies;
}

// ============================================================================
// PUNCTUATION METRICS
// ============================================================================

function computePunctuationMetrics(
  text: string,
  sentences: string[],
  wordCount: number
): VoiceFingerprint['punctuation'] {
  const sentenceCount = Math.max(sentences.length, 1);
  const per1000 = wordCount > 0 ? 1000 / wordCount : 0;

  // Count occurrences of each punctuation mark
  const commaCount = (text.match(/,/g) ?? []).length;
  const semicolonCount = (text.match(/;/g) ?? []).length;
  // Em-dash: — or -- (but not single -)
  const emDashCount = (text.match(/[—–]|--/g) ?? []).length;
  const exclamationCount = (text.match(/!/g) ?? []).length;
  const questionCount = (text.match(/\?/g) ?? []).length;
  const ellipsisCount = (text.match(/\.{3}|…/g) ?? []).length;
  const parentheticalCount = (text.match(/\(/g) ?? []).length;
  const colonCount = (text.match(/(?<!\d):\s/g) ?? []).length; // Avoid matching times like 3:00

  return {
    commaRate: Math.round((commaCount / sentenceCount) * 100) / 100,
    semicolonRate: Math.round(semicolonCount * per1000 * 100) / 100,
    emDashRate: Math.round(emDashCount * per1000 * 100) / 100,
    exclamationRate: Math.round(exclamationCount * per1000 * 100) / 100,
    questionRate: Math.round(questionCount * per1000 * 100) / 100,
    ellipsisRate: Math.round(ellipsisCount * per1000 * 100) / 100,
    parentheticalRate: Math.round(parentheticalCount * per1000 * 100) / 100,
    colonRate: Math.round(colonCount * per1000 * 100) / 100,
  };
}

// ============================================================================
// SENTENCE METRICS
// ============================================================================

function computeSentenceMetrics(
  sentences: string[]
): VoiceFingerprint['sentenceMetrics'] {
  if (sentences.length === 0) {
    return {
      meanLength: 0, stdDevLength: 0, skewnessLength: 0,
      medianLength: 0, shortSentenceRatio: 0, longSentenceRatio: 0,
      sentenceCount: 0,
    };
  }

  const lengths = sentences.map(s => s.trim().split(/\s+/).filter(w => w.length > 0).length);

  const shortCount = lengths.filter(l => l <= 5).length;
  const longCount = lengths.filter(l => l >= 25).length;

  return {
    meanLength: Math.round(mean(lengths) * 100) / 100,
    stdDevLength: Math.round(stdDev(lengths) * 100) / 100,
    skewnessLength: Math.round(skewness(lengths) * 100) / 100,
    medianLength: median(lengths),
    shortSentenceRatio: Math.round((shortCount / lengths.length) * 100) / 100,
    longSentenceRatio: Math.round((longCount / lengths.length) * 100) / 100,
    sentenceCount: sentences.length,
  };
}

// ============================================================================
// PARAGRAPH METRICS
// ============================================================================

function computeParagraphMetrics(
  paragraphs: string[],
  _sentences: string[]
): VoiceFingerprint['paragraphMetrics'] {
  if (paragraphs.length === 0) {
    return { meanLength: 0, stdDevLength: 0, paragraphCount: 0 };
  }

  // Count sentences per paragraph
  const sentencesPerParagraph = paragraphs.map(p =>
    splitSentences(p).length
  );

  return {
    meanLength: Math.round(mean(sentencesPerParagraph) * 100) / 100,
    stdDevLength: Math.round(stdDev(sentencesPerParagraph) * 100) / 100,
    paragraphCount: paragraphs.length,
  };
}

// ============================================================================
// CONTRACTION METRICS
// ============================================================================

function computeContractionMetrics(
  text: string,
  wordCount: number
): VoiceFingerprint['contractions'] {
  const lowerText = text.toLowerCase();
  let contractedCount = 0;
  let expandedCount = 0;

  for (const { contracted, expanded } of CONTRACTION_PAIRS) {
    // Count contracted form occurrences
    const contractedRegex = new RegExp(
      `\\b${escapeRegex(contracted)}\\b`,
      'gi'
    );
    const contractedMatches = text.match(contractedRegex);
    if (contractedMatches) contractedCount += contractedMatches.length;

    // Count expanded form occurrences
    const expandedRegex = new RegExp(
      `\\b${escapeRegex(expanded)}\\b`,
      'gi'
    );
    const expandedMatches = text.match(expandedRegex);
    if (expandedMatches) expandedCount += expandedMatches.length;
  }

  const totalForms = contractedCount + expandedCount;

  return {
    count: contractedCount,
    rate: wordCount > 0
      ? Math.round((contractedCount / wordCount) * 1000 * 100) / 100
      : 0,
    contractionPreference: totalForms > 0
      ? Math.round((contractedCount / totalForms) * 100) / 100
      : 0.5,  // Default to neutral if no data
  };
}

// ============================================================================
// VOCABULARY METRICS
// ============================================================================

function computeVocabularyMetrics(
  words: string[],
  wordCount: number
): VoiceFingerprint['vocabulary'] {
  if (wordCount === 0) {
    return {
      typeTokenRatio: 0, hapaxRatio: 0,
      meanWordLength: 0, stdDevWordLength: 0, polysyllabicRatio: 0,
    };
  }

  // Type-Token Ratio
  const uniqueWords = new Set(words);
  const typeTokenRatio = uniqueWords.size / wordCount;

  // Hapax legomena (words appearing exactly once)
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }
  const hapaxCount = Array.from(wordCounts.values()).filter(c => c === 1).length;
  const hapaxRatio = uniqueWords.size > 0 ? hapaxCount / uniqueWords.size : 0;

  // Word length metrics
  const wordLengths = words.map(w => w.replace(/'/g, '').length);
  const meanWordLen = mean(wordLengths);
  const stdDevWordLen = stdDev(wordLengths);

  // Polysyllabic ratio (words with 3+ syllables)
  const polysyllabicCount = words.filter(w => countSyllables(w) >= 3).length;

  return {
    typeTokenRatio: Math.round(typeTokenRatio * 1000) / 1000,
    hapaxRatio: Math.round(hapaxRatio * 1000) / 1000,
    meanWordLength: Math.round(meanWordLen * 100) / 100,
    stdDevWordLength: Math.round(stdDevWordLen * 100) / 100,
    polysyllabicRatio: Math.round((polysyllabicCount / wordCount) * 1000) / 1000,
  };
}

// ============================================================================
// RHYTHM METRICS
// ============================================================================

function computeRhythmMetrics(
  words: string[],
  sentences: string[]
): VoiceFingerprint['rhythm'] {
  if (words.length === 0) {
    return {
      meanSyllablesPerWord: 0, stdDevSyllablesPerWord: 0,
      syllableDistribution: [0, 0, 0, 0],
      lengthAutocorrelation: 0,
    };
  }

  // Syllable counts per word
  const syllableCounts = words.map(w => countSyllables(w));
  const meanSyl = mean(syllableCounts);
  const stdDevSyl = stdDev(syllableCounts);

  // Syllable distribution [1-syl, 2-syl, 3-syl, 4+syl]
  const totalWords = words.length;
  const dist: [number, number, number, number] = [0, 0, 0, 0];
  for (const sc of syllableCounts) {
    if (sc === 1) dist[0]++;
    else if (sc === 2) dist[1]++;
    else if (sc === 3) dist[2]++;
    else dist[3]++;
  }
  const syllableDistribution: [number, number, number, number] = [
    Math.round((dist[0] / totalWords) * 100) / 100,
    Math.round((dist[1] / totalWords) * 100) / 100,
    Math.round((dist[2] / totalWords) * 100) / 100,
    Math.round((dist[3] / totalWords) * 100) / 100,
  ];

  // Sentence-length autocorrelation (rhythmic regularity)
  const sentenceLengths = sentences.map(s =>
    s.trim().split(/\s+/).filter(w => w.length > 0).length
  );
  const lengthAutocorrelation = autocorrelation(sentenceLengths, 1);

  return {
    meanSyllablesPerWord: Math.round(meanSyl * 100) / 100,
    stdDevSyllablesPerWord: Math.round(stdDevSyl * 100) / 100,
    syllableDistribution,
    lengthAutocorrelation: Math.round(lengthAutocorrelation * 1000) / 1000,
  };
}

// ============================================================================
// REGISTER METRICS
// ============================================================================

function computeRegisterMetrics(
  text: string,
  words: string[],
  wordCount: number
): VoiceFingerprint['register'] {
  if (wordCount === 0) {
    return {
      formalityScore: 0.5, firstPersonRate: 0, impersonalRate: 0,
      latinateRatio: 0, colloquialismRate: 0,
    };
  }

  const lowerText = text.toLowerCase();
  const per1000 = 1000 / wordCount;

  // First person pronoun rate
  const firstPersonPronouns = ['i', 'me', 'my', 'mine', 'myself'];
  let firstPersonCount = 0;
  for (const word of words) {
    if (firstPersonPronouns.includes(word)) firstPersonCount++;
  }
  const firstPersonRate = Math.round(firstPersonCount * per1000 * 100) / 100;

  // Impersonal/third-person rate
  const impersonalWords = ['one', 'the', 'this', 'these', 'those', 'such'];
  let impersonalCount = 0;
  for (const word of words) {
    if (impersonalWords.includes(word)) impersonalCount++;
  }
  const impersonalRate = Math.round(impersonalCount * per1000 * 100) / 100;

  // Latinate vs Germanic ratio
  let latinateCount = 0;
  let germanicCount = 0;
  for (const word of words) {
    const clean = word.replace(/'/g, '');
    if (clean.length <= 3) continue; // Skip very short words

    if (GERMANIC_CORE_WORDS.has(clean)) {
      germanicCount++;
    } else if (LATINATE_SUFFIXES.some(s => clean.endsWith(s))) {
      latinateCount++;
    }
  }
  const totalClassified = latinateCount + germanicCount;
  const latinateRatio = totalClassified > 0
    ? Math.round((latinateCount / totalClassified) * 100) / 100
    : 0.5;

  // Colloquialism density
  let colloquialismCount = 0;
  for (const c of COLLOQUIALISMS) {
    const regex = new RegExp(`\\b${escapeRegex(c)}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) colloquialismCount += matches.length;
  }
  const colloquialismRate = Math.round(colloquialismCount * per1000 * 100) / 100;

  // Formal marker count
  let formalCount = 0;
  for (const marker of FORMAL_MARKERS) {
    if (lowerText.includes(marker.toLowerCase())) formalCount++;
  }

  // Casual marker count
  let casualCount = 0;
  for (const marker of CASUAL_MARKERS) {
    if (lowerText.includes(marker.toLowerCase())) casualCount++;
  }

  // Compute formality score (0 = very casual, 1 = very formal)
  // Factors: formal/casual markers, latinate ratio, contraction rate, colloquialisms
  const markerBalance = (formalCount - casualCount) / Math.max(formalCount + casualCount, 1);
  const formalityScore = clamp(
    0.5 +
    markerBalance * 0.15 +
    (latinateRatio - 0.5) * 0.25 +
    (colloquialismCount > 3 ? -0.15 : 0) +
    (impersonalRate > firstPersonRate ? 0.1 : -0.05),
    0,
    1
  );

  return {
    formalityScore: Math.round(formalityScore * 100) / 100,
    firstPersonRate,
    impersonalRate,
    latinateRatio,
    colloquialismRate,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
