/**
 * AI vs Human Writing Detector (Non-LLM)
 *
 * Statistical signals that distinguish AI-generated from human-written text.
 * Provides a probability score with contributing factors — NOT a binary classifier.
 *
 * Key signals:
 * 1. Burstiness — humans write in bursts of varying quality; AI is smooth
 * 2. Sentence length variance — AI tends toward medium-length; humans vary more
 * 3. Vocabulary uniformity — AI has consistent richness across chunks
 * 4. Function word distribution — AI overuses certain connectives
 * 5. Repetition regularity — AI reuses phrases at regular intervals
 * 6. Perplexity flatness — human writing has natural spikes; AI is flat
 *
 * Performance: < 5ms for a 650-word essay.
 * Dependencies: zero external.
 */

import type { AIDetectionResult, SignalScore } from './types';
import type { VoiceFingerprint } from './types';
import { AI_DETECTION_THRESHOLDS, COMMON_BIGRAMS, FUNCTION_WORD_SET } from './constants';
import {
  tokenize,
  splitSentences,
  mean,
  stdDev,
  variance,
  coefficientOfVariation,
  clamp,
  normalize,
  extractNgrams,
  ngramFrequencies,
} from './textUtils';

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect AI-generated writing using statistical signals.
 *
 * @param text - Raw text to analyze
 * @param fingerprint - Pre-computed fingerprint (optional, avoids recomputation)
 * @returns AI detection result with probability and signal breakdown
 */
export function detectAIWriting(
  text: string,
  fingerprint?: VoiceFingerprint
): AIDetectionResult {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const wordCount = words.length;

  // Short texts can't be reliably assessed
  if (wordCount < 50 || sentences.length < 5) {
    return createLowConfidenceResult();
  }

  // Compute individual signals
  const burstiness = measureBurstiness(words, sentences);
  const sentLenVar = measureSentenceLengthVariance(sentences);
  const vocabUniform = measureVocabularyUniformity(words);
  const funcWordAnomaly = measureFunctionWordAnomaly(words, wordCount);
  const repRegularity = measureRepetitionRegularity(words);
  const perplexityFlat = measurePerplexityFlatness(words, sentences);

  // Build signal scores
  const signals: AIDetectionResult['signals'] = {
    burstiness: {
      score: burstiness,
      weight: 0.20,
      label: burstiness > 0.5
        ? 'Unnaturally smooth quality (AI-like)'
        : 'Natural quality variation (human-like)',
    },
    sentenceLengthVariance: {
      score: sentLenVar,
      weight: 0.18,
      label: sentLenVar > 0.5
        ? 'Low sentence length variation (AI-like)'
        : 'High sentence length variation (human-like)',
    },
    vocabularyUniformity: {
      score: vocabUniform,
      weight: 0.18,
      label: vocabUniform > 0.5
        ? 'Uniform vocabulary across chunks (AI-like)'
        : 'Variable vocabulary richness (human-like)',
    },
    functionWordAnomaly: {
      score: funcWordAnomaly,
      weight: 0.15,
      label: funcWordAnomaly > 0.5
        ? 'Unusual function word distribution (AI-like)'
        : 'Natural function word usage (human-like)',
    },
    repetitionRegularity: {
      score: repRegularity,
      weight: 0.15,
      label: repRegularity > 0.5
        ? 'Regular phrase repetition patterns (AI-like)'
        : 'Irregular repetition patterns (human-like)',
    },
    perplexityFlatness: {
      score: perplexityFlat,
      weight: 0.14,
      label: perplexityFlat > 0.5
        ? 'Flat complexity distribution (AI-like)'
        : 'Natural complexity variation (human-like)',
    },
  };

  // Calculate weighted probability
  let weightedSum = 0;
  let totalWeight = 0;
  for (const signal of Object.values(signals)) {
    weightedSum += signal.score * signal.weight;
    totalWeight += signal.weight;
  }
  const aiProbability = clamp(weightedSum / totalWeight, 0, 1);

  // Confidence scales with text length
  const confidence = clamp(
    Math.min(1, wordCount / 300) * Math.min(1, sentences.length / 10),
    0.3,
    1
  );

  // Identify dominant signals (top 3 with score > 0.4)
  const dominantSignals = Object.entries(signals)
    .filter(([_, s]) => s.score > 0.4)
    .sort(([_, a], [__, b]) => b.score - a.score)
    .slice(0, 3)
    .map(([_, s]) => s.label);

  return {
    aiProbability: Math.round(aiProbability * 1000) / 1000,
    confidence: Math.round(confidence * 100) / 100,
    signals,
    dominantSignals,
  };
}

// ============================================================================
// SIGNAL 1: BURSTINESS
// ============================================================================

/**
 * Measure burstiness — the variation in writing quality across sentences.
 * Humans write in bursts (some sentences brilliant, others mediocre).
 * AI maintains consistent quality throughout.
 *
 * Measurement: coefficient of variation of per-sentence vocabulary richness.
 * Returns 0-1 where higher = more AI-like (less bursty).
 */
function measureBurstiness(words: string[], sentences: string[]): number {
  if (sentences.length < 5) return 0.5;

  // Compute per-sentence vocabulary richness (type-token ratio)
  const sentenceRichness: number[] = [];
  for (const sentence of sentences) {
    const sentWords = tokenize(sentence);
    if (sentWords.length < 3) continue; // Skip very short sentences

    const uniqueWords = new Set(sentWords);
    sentenceRichness.push(uniqueWords.size / sentWords.length);
  }

  if (sentenceRichness.length < 4) return 0.5;

  const cv = coefficientOfVariation(sentenceRichness);
  const thresholds = AI_DETECTION_THRESHOLDS.burstiness;

  // Low CV = consistent quality = AI-like
  // High CV = bursty quality = human-like
  if (cv <= thresholds.aiMean) return 0.9;
  if (cv >= thresholds.humanMean) return 0.1;

  // Linear interpolation between AI and human means
  return clamp(
    1 - normalize(cv, thresholds.aiMean, thresholds.humanMean),
    0, 1
  );
}

// ============================================================================
// SIGNAL 2: SENTENCE LENGTH VARIANCE
// ============================================================================

/**
 * Measure sentence length variance.
 * AI tends toward medium-length sentences; humans vary much more.
 *
 * Returns 0-1 where higher = more AI-like (less variance).
 */
function measureSentenceLengthVariance(sentences: string[]): number {
  if (sentences.length < 5) return 0.5;

  const lengths = sentences.map(s =>
    s.trim().split(/\s+/).filter(w => w.length > 0).length
  );

  const cv = coefficientOfVariation(lengths);
  const thresholds = AI_DETECTION_THRESHOLDS.sentenceLengthCV;

  if (cv <= thresholds.aiMean) return 0.9;
  if (cv >= thresholds.humanMean) return 0.1;

  return clamp(
    1 - normalize(cv, thresholds.aiMean, thresholds.humanMean),
    0, 1
  );
}

// ============================================================================
// SIGNAL 3: VOCABULARY UNIFORMITY
// ============================================================================

/**
 * Measure vocabulary uniformity across equal-sized chunks.
 * AI has consistent lexical richness; humans vary by section.
 *
 * Returns 0-1 where higher = more AI-like (more uniform).
 */
function measureVocabularyUniformity(words: string[]): number {
  if (words.length < 80) return 0.5;

  const chunkSize = 40;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    if (chunk.length >= 20) chunks.push(chunk);
  }

  if (chunks.length < 3) return 0.5;

  // Compute TTR per chunk
  const chunkTTRs = chunks.map(chunk => new Set(chunk).size / chunk.length);
  const chunkVariance = variance(chunkTTRs);
  const thresholds = AI_DETECTION_THRESHOLDS.vocabularyChunkVariance;

  if (chunkVariance <= thresholds.aiMean) return 0.9;
  if (chunkVariance >= thresholds.humanMean) return 0.1;

  return clamp(
    1 - normalize(chunkVariance, thresholds.aiMean, thresholds.humanMean),
    0, 1
  );
}

// ============================================================================
// SIGNAL 4: FUNCTION WORD DISTRIBUTION ANOMALY
// ============================================================================

/**
 * Measure function word distribution anomaly.
 * AI overuses certain connectives and has a slightly different distribution
 * of function words compared to human writing.
 *
 * Specifically checks for:
 * - Over-representation of "furthermore", "moreover", "however"
 * - Under-representation of "I", "my", "me" in personal essays
 * - Unusually high entropy in function word usage
 *
 * Returns 0-1 where higher = more AI-like.
 */
function measureFunctionWordAnomaly(words: string[], wordCount: number): number {
  if (wordCount < 50) return 0.5;

  // AI-overused connectives
  const aiConnectives = [
    'furthermore', 'moreover', 'however', 'consequently', 'therefore',
    'additionally', 'nevertheless', 'subsequently', 'accordingly',
  ];

  let connectiveCount = 0;
  for (const word of words) {
    if (aiConnectives.includes(word)) connectiveCount++;
  }

  // In personal essays, AI tends to underuse first person
  let firstPersonCount = 0;
  const firstPersonWords = new Set(['i', 'me', 'my', 'mine', 'myself']);
  for (const word of words) {
    if (firstPersonWords.has(word)) firstPersonCount++;
  }
  const firstPersonRate = firstPersonCount / wordCount;

  // Score components
  let score = 0;

  // Connective overuse (more than ~1 per 200 words in a personal essay is suspicious)
  const connectiveRate = connectiveCount / wordCount;
  if (connectiveRate > 0.008) score += 0.4;
  else if (connectiveRate > 0.005) score += 0.2;

  // First person underuse (personal essays typically have > 3% first-person)
  if (firstPersonRate < 0.01) score += 0.3;
  else if (firstPersonRate < 0.02) score += 0.15;

  // Function word entropy check
  const fwCounts: number[] = [];
  for (const word of words) {
    if (FUNCTION_WORD_SET.has(word)) {
      fwCounts.push(1);
    }
  }

  // Calculate function word ratio diversity
  const fwMap = new Map<string, number>();
  for (const word of words) {
    if (FUNCTION_WORD_SET.has(word)) {
      fwMap.set(word, (fwMap.get(word) ?? 0) + 1);
    }
  }
  const fwFreqs = Array.from(fwMap.values());
  if (fwFreqs.length > 5) {
    const fwCV = coefficientOfVariation(fwFreqs);
    // Very uniform function word usage = AI-like
    if (fwCV < 0.5) score += 0.2;
    // Very variable = human-like
    if (fwCV > 1.2) score -= 0.1;
  }

  return clamp(score, 0, 1);
}

// ============================================================================
// SIGNAL 5: REPETITION REGULARITY
// ============================================================================

/**
 * Measure regularity of phrase repetition.
 * AI tends to reuse phrases (especially transitional phrases) at
 * surprisingly regular intervals. Humans repeat more randomly.
 *
 * Returns 0-1 where higher = more AI-like (regular repetition).
 */
function measureRepetitionRegularity(words: string[]): number {
  if (words.length < 80) return 0.5;

  // Extract bigrams
  const bigrams = extractNgrams(words, 2);
  const bigramCounts = new Map<string, number>();
  const bigramPositions = new Map<string, number[]>();

  for (let i = 0; i < bigrams.length; i++) {
    const bg = bigrams[i];
    bigramCounts.set(bg, (bigramCounts.get(bg) ?? 0) + 1);

    if (!bigramPositions.has(bg)) {
      bigramPositions.set(bg, []);
    }
    bigramPositions.get(bg)!.push(i);
  }

  // Find repeated bigrams (excluding very common ones)
  const repeatedBigrams: { bigram: string; positions: number[] }[] = [];
  for (const [bigram, count] of bigramCounts) {
    if (count >= 2 && !COMMON_BIGRAMS.has(bigram)) {
      repeatedBigrams.push({
        bigram,
        positions: bigramPositions.get(bigram)!,
      });
    }
  }

  if (repeatedBigrams.length < 2) return 0.3; // Not enough data

  // Measure regularity of inter-repetition distances
  const allDistances: number[] = [];
  for (const { positions } of repeatedBigrams) {
    for (let i = 1; i < positions.length; i++) {
      allDistances.push(positions[i] - positions[i - 1]);
    }
  }

  if (allDistances.length < 3) return 0.3;

  // High regularity (low CV of distances) = AI-like
  const distanceCV = coefficientOfVariation(allDistances);
  const threshold = AI_DETECTION_THRESHOLDS.repetitionRegularity;

  if (distanceCV <= threshold.aiMean) return 0.85;
  if (distanceCV >= threshold.humanMean * 2) return 0.1;

  return clamp(
    1 - normalize(distanceCV, threshold.aiMean, threshold.humanMean * 2),
    0, 1
  );
}

// ============================================================================
// SIGNAL 6: PERPLEXITY FLATNESS
// ============================================================================

/**
 * Approximate perplexity variation without a language model.
 *
 * We proxy "perplexity" using word rarity within the document:
 * - Compute per-sentence average word frequency rank
 * - Measure variance across sentences
 * - Flat variance = AI-like (consistently "medium" complexity)
 * - Spikey variance = human-like (mix of simple and complex sentences)
 *
 * Returns 0-1 where higher = more AI-like (flatter).
 */
function measurePerplexityFlatness(words: string[], sentences: string[]): number {
  if (sentences.length < 5 || words.length < 50) return 0.5;

  // Build document-level word frequency map
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
  }

  // For each sentence, compute average "rarity" (1/frequency)
  const sentenceRarities: number[] = [];
  for (const sentence of sentences) {
    const sentWords = tokenize(sentence);
    if (sentWords.length < 3) continue;

    let raritySum = 0;
    for (const word of sentWords) {
      const freq = wordFreq.get(word) ?? 1;
      raritySum += 1 / freq;
    }

    sentenceRarities.push(raritySum / sentWords.length);
  }

  if (sentenceRarities.length < 4) return 0.5;

  // Measure coefficient of variation
  const cv = coefficientOfVariation(sentenceRarities);

  // Low CV = flat perplexity = AI-like
  if (cv < 0.15) return 0.85;
  if (cv < 0.25) return 0.65;
  if (cv < 0.40) return 0.45;
  if (cv < 0.55) return 0.25;
  return 0.1;
}

// ============================================================================
// HELPERS
// ============================================================================

function createLowConfidenceResult(): AIDetectionResult {
  const defaultSignal: SignalScore = {
    score: 0.5,
    weight: 1 / 6,
    label: 'Insufficient text for reliable assessment',
  };

  return {
    aiProbability: 0.5,
    confidence: 0.2,
    signals: {
      burstiness: { ...defaultSignal },
      sentenceLengthVariance: { ...defaultSignal },
      vocabularyUniformity: { ...defaultSignal },
      functionWordAnomaly: { ...defaultSignal },
      repetitionRegularity: { ...defaultSignal },
      perplexityFlatness: { ...defaultSignal },
    },
    dominantSignals: ['Text too short for reliable AI detection'],
  };
}
