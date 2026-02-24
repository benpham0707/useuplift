/**
 * Information-Theoretic & Compression-Based Writing Quality Analyzer
 *
 * Pure computational analysis -- zero LLM calls, < 20ms total execution.
 * Complements the existing feature extractor, authenticity detector, and
 * literary sophistication detector with information-theory signals.
 *
 * Techniques implemented:
 *   1. Shannon Entropy of Word Choice
 *   2. Surprisal-Based Quality Detection (unigram/bigram)
 *   3. Compression Ratio as Quality Metric (LZ77/deflate)
 *   4. Information Density Variation (sliding-window entropy)
 *   5. Mutual Information Between Sections
 *   6. Kolmogorov Complexity Approximation (NCD)
 *   7. Zipf's Law Deviation
 *
 * Performance budget: < 5ms per technique, < 20ms total.
 * Dependencies: Node.js built-in `zlib` only.
 */

import { deflateSync } from 'zlib';

// ============================================================================
// OUTPUT INTERFACES
// ============================================================================

/** Per-sentence entropy measurement */
export interface SentenceEntropy {
  /** 0-based sentence index */
  index: number;
  /** The sentence text (truncated to 120 chars for reporting) */
  text: string;
  /** Shannon entropy in bits */
  entropy: number;
  /** Number of unique words / total words */
  uniqueRatio: number;
}

/** Shannon entropy analysis across the essay */
export interface ShannonEntropyAnalysis {
  /** Overall essay-level word entropy in bits */
  overallEntropy: number;
  /** Per-sentence entropy values */
  perSentence: SentenceEntropy[];
  /** Per-paragraph average entropy */
  perParagraph: { index: number; avgEntropy: number; wordCount: number }[];
  /** Sentences flagged as monotonous (bottom 20% entropy among sentences with 5+ words) */
  monotonousSections: SentenceEntropy[];
  /** Score 0-10: higher = more diverse word choice */
  diversityScore: number;
}

/** Surprisal analysis for cliche/novelty detection */
export interface SurprisalAnalysis {
  /** Average per-word surprisal across entire essay (bits) */
  averageSurprisal: number;
  /** Standard deviation of per-word surprisal */
  surprisalStdDev: number;
  /** Passages with very low surprisal (predictable / cliche) */
  predictablePassages: { text: string; avgSurprisal: number; startIndex: number }[];
  /** Passages with optimal surprisal (engaging) */
  engagingPassages: { text: string; avgSurprisal: number; startIndex: number }[];
  /** Passages with very high surprisal (potentially incoherent) */
  incoherentPassages: { text: string; avgSurprisal: number; startIndex: number }[];
  /** Score 0-10: higher = more engaging surprisal profile */
  engagementScore: number;
}

/** Compression-based quality metrics */
export interface CompressionAnalysis {
  /** Overall compression ratio (compressed / original). Lower = less repetitive */
  overallRatio: number;
  /** Per-paragraph compression ratios */
  perParagraph: { index: number; ratio: number; originalBytes: number }[];
  /** Cross-paragraph redundancy: how much adding paragraph N reduces novelty */
  crossParagraphRedundancy: { fromIndex: number; toIndex: number; redundancyScore: number }[];
  /** Score 0-10: higher = less repetitive / more unique information */
  uniquenessScore: number;
}

/** Information density variation analysis */
export interface DensityVariationAnalysis {
  /** Sliding-window entropy curve (window = ~30 words, step = 10 words) */
  densityCurve: { position: number; entropy: number }[];
  /** Standard deviation of the density curve */
  densityStdDev: number;
  /** Mean density */
  densityMean: number;
  /** Coefficient of variation (stddev/mean) -- higher = more intentional variation */
  coefficientOfVariation: number;
  /** Shape classification */
  shapeProfile: 'flat' | 'gradual_build' | 'mountain' | 'valley' | 'oscillating' | 'front_loaded' | 'back_loaded';
  /** Score 0-10: higher = more intentional density variation */
  variationScore: number;
}

/** Mutual information between essay sections */
export interface MutualInformationAnalysis {
  /** MI between intro and conclusion (bits). Higher = better circular structure */
  introConclusion: number;
  /** MI between each pair of body paragraphs (bits). Lower = more diverse content */
  bodyParagraphPairs: { p1: number; p2: number; mi: number }[];
  /** Average body-paragraph MI */
  avgBodyMI: number;
  /** Score 0-10: rewards high intro-conclusion MI and low body MI */
  coherenceScore: number;
}

/** Normalized Compression Distance analysis */
export interface NCDAnalysis {
  /** NCD between each pair of paragraphs (0 = identical, 1 = completely unrelated) */
  paragraphPairs: { p1: number; p2: number; ncd: number }[];
  /** Paragraphs that are too similar (NCD < 0.3) */
  redundantPairs: { p1: number; p2: number; ncd: number }[];
  /** Paragraphs that feel disconnected (NCD > 0.95) */
  disconnectedPairs: { p1: number; p2: number; ncd: number }[];
  /** Average NCD across all pairs */
  averageNCD: number;
  /** Score 0-10: rewards moderate NCD (connected but not redundant) */
  balanceScore: number;
}

/** Zipf's law deviation analysis */
export interface ZipfAnalysis {
  /** Estimated Zipf exponent (alpha). Natural text ~ 1.0 */
  alpha: number;
  /** R-squared of log-log linear fit. Closer to 1.0 = better Zipf fit */
  rSquared: number;
  /** Deviation from ideal alpha=1.0 */
  deviation: number;
  /** Interpretation */
  interpretation: 'natural_fluid' | 'over_reliant' | 'forced_vocabulary' | 'insufficient_data';
  /** Top 10 most frequent words with their actual vs. expected Zipf frequencies */
  topWords: { word: string; rank: number; actualFreq: number; expectedFreq: number }[];
  /** Score 0-10: higher = closer to natural Zipf distribution */
  naturalityScore: number;
}

/** Composite scores mapped to rubric dimensions */
export interface InformationTheoreticRubricScores {
  /** Maps to: voice_integrity */
  wordChoiceDiversity: number;
  /** Maps to: craft_language_quality */
  writingNaturalness: number;
  /** Maps to: structural_cohesion */
  structuralBalance: number;
  /** Maps to: narrative_arc_stakes */
  densityArcQuality: number;
  /** Maps to: reflection_meaning */
  introConclCoherence: number;
  /** Maps to: specificity_evidence */
  informationUniqueness: number;
  /** Maps to: opening_hook */
  openingSurprisal: number;
  /** Maps to: emotional_resonance */
  emotionalDensityVariation: number;
  /** Maps to: vulnerability_risk */
  vulnerabilitySurprisal: number;
  /** Maps to: audience_awareness */
  engagementSurprisal: number;
  /** Maps to: transformative_impact */
  contentProgression: number;
}

/** Top-level analysis result */
export interface InformationTheoreticAnalysis {
  entropy: ShannonEntropyAnalysis;
  surprisal: SurprisalAnalysis;
  compression: CompressionAnalysis;
  densityVariation: DensityVariationAnalysis;
  mutualInformation: MutualInformationAnalysis;
  ncd: NCDAnalysis;
  zipf: ZipfAnalysis;
  /** Rubric-mapped composite scores (0-10 each) */
  rubricScores: InformationTheoreticRubricScores;
  /** Human-readable diagnostic flags */
  diagnostics: string[];
  /** Execution performance */
  performance: {
    totalMs: number;
    perTechnique: Record<string, number>;
  };
}

// ============================================================================
// PRE-COMPUTED LANGUAGE MODELS (compact, in-memory)
// ============================================================================

/**
 * Top ~300 most common English words with approximate unigram log-probabilities.
 * Source: Brown Corpus / BNC frequency lists, simplified.
 * P(word) values are -log2(P) for direct surprisal computation.
 *
 * Lower value = more common = less surprising.
 */
const UNIGRAM_SURPRISAL: Record<string, number> = {
  // Function words (extremely common, low surprisal)
  'the': 3.0, 'be': 4.0, 'to': 3.5, 'of': 3.5, 'and': 3.3, 'a': 3.2,
  'in': 3.8, 'that': 4.2, 'have': 4.5, 'i': 3.7, 'it': 4.0, 'for': 4.2,
  'not': 4.5, 'on': 4.3, 'with': 4.5, 'he': 4.8, 'as': 4.5, 'you': 4.5,
  'do': 4.8, 'at': 4.8, 'this': 4.8, 'but': 4.7, 'his': 5.0, 'by': 5.0,
  'from': 5.0, 'they': 5.0, 'we': 5.2, 'say': 5.5, 'her': 5.3, 'she': 5.3,
  'or': 4.8, 'an': 5.0, 'will': 5.2, 'my': 5.0, 'one': 5.2, 'all': 5.0,
  'would': 5.3, 'there': 5.2, 'their': 5.3, 'what': 5.2, 'so': 5.0,
  'up': 5.3, 'out': 5.3, 'if': 5.0, 'about': 5.5, 'who': 5.5, 'get': 5.5,
  'which': 5.5, 'go': 5.5, 'me': 5.3, 'when': 5.2, 'make': 5.5, 'can': 5.2,
  'like': 5.3, 'time': 5.5, 'no': 5.0, 'just': 5.3, 'him': 5.5, 'know': 5.5,
  'take': 5.8, 'people': 6.0, 'into': 5.8, 'year': 6.0, 'your': 5.5,
  'good': 6.0, 'some': 5.5, 'could': 5.5, 'them': 5.5, 'see': 5.8,
  'other': 5.8, 'than': 5.5, 'then': 5.5, 'now': 5.8, 'look': 6.0,
  'only': 5.8, 'come': 6.0, 'its': 5.8, 'over': 5.8, 'think': 6.0,
  'also': 6.0, 'back': 6.0, 'after': 5.8, 'use': 6.0, 'two': 6.0,
  'how': 5.8, 'our': 5.5, 'work': 6.0, 'first': 6.0, 'well': 6.0,
  'way': 6.0, 'even': 6.0, 'new': 6.0, 'want': 6.2, 'because': 5.8,
  'any': 6.0, 'these': 6.0, 'give': 6.2, 'day': 6.2, 'most': 6.0,
  'us': 5.8, 'was': 4.0, 'is': 3.8, 'are': 4.5, 'were': 5.0, 'been': 5.2,
  'had': 5.0, 'has': 5.0, 'did': 5.5, 'more': 5.5, 'very': 6.0,

  // Content words (common in essays)
  'life': 6.5, 'experience': 7.0, 'learn': 6.8, 'learned': 6.8,
  'community': 7.5, 'help': 6.5, 'school': 7.0, 'student': 7.5,
  'team': 7.0, 'project': 7.5, 'change': 7.0, 'world': 7.0,
  'challenge': 7.5, 'understand': 7.0, 'realize': 7.5, 'passion': 8.0,
  'impact': 7.5, 'grow': 7.5, 'growth': 7.5, 'leader': 8.0,
  'leadership': 8.0, 'opportunity': 8.0, 'develop': 7.5,
  'research': 8.0, 'program': 7.5, 'volunteer': 8.5,
  'perspective': 8.0, 'culture': 8.0, 'skill': 7.5, 'value': 7.5,

  // Admissions essay cliches (very predictable in context)
  'passionate': 8.0, 'journey': 8.0, 'transformative': 9.0,
  'meaningful': 8.5, 'fulfilling': 9.0, 'rewarding': 8.5,
  'inspired': 8.0, 'motivated': 8.5, 'dedicated': 8.5,
  'perseverance': 9.5, 'resilience': 9.0, 'determination': 9.0,

  // Interesting/specific words (higher surprisal = less predictable)
  'bleach': 12.0, 'citrus': 12.5, 'santur': 14.0, 'tarps': 13.0,
  'gymnasium': 11.0, 'cafeteria': 11.0, 'perishables': 13.0,
  'fridge': 11.5, 'midnight': 10.0, 'wednesday': 10.5,
  'surgeon': 11.0, 'autopsy': 13.0, 'hemorrhaging': 14.0,
};

/** Default surprisal for unknown words (moderately surprising) */
const DEFAULT_SURPRISAL = 10.0;

/** Maximum surprisal cap for any word */
const MAX_SURPRISAL = 16.0;

// ============================================================================
// TEXT PROCESSING UTILITIES
// ============================================================================

/** Tokenize text into lowercase words, stripping punctuation */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && w !== '-' && w !== "'");
}

/** Split text into sentences */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/** Split text into paragraphs */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/** Calculate Shannon entropy of a word frequency distribution (bits) */
function shannonEntropy(words: string[]): number {
  if (words.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  const n = words.length;
  let entropy = 0;

  const counts = Array.from(freq.values());
  for (let i = 0; i < counts.length; i++) {
    const p = counts[i] / n;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/** Compress a UTF-8 string with deflate and return compressed byte count */
function compressedSize(text: string): number {
  if (text.length === 0) return 0;
  try {
    const compressed = deflateSync(Buffer.from(text, 'utf-8'), { level: 6 });
    return compressed.length;
  } catch {
    // Fallback: estimate compression
    return Math.ceil(text.length * 0.5);
  }
}

/** Simple linear regression: returns { slope, intercept, rSquared } */
function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) {
    return { slope: 0, intercept: sumY / n, rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssRes += (ys[i] - predicted) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared: Math.max(0, rSquared) };
}

/** Standard deviation of a number array */
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/** Mean of a number array */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to N decimal places */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Get word surprisal from the unigram model */
function getWordSurprisal(word: string): number {
  const lower = word.toLowerCase();
  return UNIGRAM_SURPRISAL[lower] ?? DEFAULT_SURPRISAL;
}

// ============================================================================
// TECHNIQUE 1: SHANNON ENTROPY OF WORD CHOICE
// ============================================================================

function analyzeShannonEntropy(text: string): ShannonEntropyAnalysis {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);

  // Overall entropy
  const overallEntropy = round(shannonEntropy(words), 3);

  // Per-sentence entropy
  const perSentence: SentenceEntropy[] = sentences.map((sentence, index) => {
    const sentWords = tokenize(sentence);
    const entropy = round(shannonEntropy(sentWords), 3);
    const uniqueRatio = sentWords.length > 0
      ? round(new Set(sentWords).size / sentWords.length, 3)
      : 0;

    return {
      index,
      text: sentence.length > 120 ? sentence.substring(0, 117) + '...' : sentence,
      entropy,
      uniqueRatio,
    };
  });

  // Per-paragraph average entropy
  const perParagraph = paragraphs.map((para, index) => {
    const paraWords = tokenize(para);
    return {
      index,
      avgEntropy: round(shannonEntropy(paraWords), 3),
      wordCount: paraWords.length,
    };
  });

  // Flag monotonous sections (bottom 20% among sentences with 5+ words)
  const substantialSentences = perSentence.filter(s => {
    const wordCount = tokenize(sentences[s.index] || '').length;
    return wordCount >= 5;
  });

  const sortedByEntropy = [...substantialSentences].sort((a, b) => a.entropy - b.entropy);
  const threshold = Math.ceil(sortedByEntropy.length * 0.2);
  const monotonousSections = sortedByEntropy.slice(0, threshold);

  // Diversity score (0-10)
  // Baseline: college essays typically have entropy 5.5-8.5 bits
  // Map 4.0 -> 0, 6.0 -> 5, 8.5+ -> 10
  let diversityScore: number;
  if (words.length < 20) {
    diversityScore = 5; // Not enough data
  } else {
    diversityScore = clamp((overallEntropy - 4.0) / 4.5 * 10, 0, 10);
  }

  return {
    overallEntropy,
    perSentence,
    perParagraph,
    monotonousSections,
    diversityScore: round(diversityScore, 1),
  };
}

// ============================================================================
// TECHNIQUE 2: SURPRISAL-BASED QUALITY DETECTION
// ============================================================================

function analyzeSurprisal(text: string): SurprisalAnalysis {
  const sentences = splitSentences(text);

  // Calculate per-sentence average surprisal
  const sentenceSurprisals: { text: string; avgSurprisal: number; startIndex: number }[] = [];
  const allWordSurprisals: number[] = [];

  let charOffset = 0;
  for (const sentence of sentences) {
    const words = tokenize(sentence);
    if (words.length === 0) {
      charOffset += sentence.length + 1;
      continue;
    }

    const wordSurprisals = words.map(w => Math.min(getWordSurprisal(w), MAX_SURPRISAL));
    const avg = mean(wordSurprisals);

    allWordSurprisals.push(...wordSurprisals);
    sentenceSurprisals.push({
      text: sentence.length > 120 ? sentence.substring(0, 117) + '...' : sentence,
      avgSurprisal: round(avg, 2),
      startIndex: charOffset,
    });

    charOffset += sentence.length + 1;
  }

  const averageSurprisal = round(mean(allWordSurprisals), 2);
  const surprisalStdDev = round(stdDev(allWordSurprisals), 2);

  // Classify passages by surprisal level
  // Predictable (cliche): avg surprisal < 5.5 (very common words)
  // Engaging (sweet spot): avg surprisal 6.5-9.5
  // Incoherent: avg surprisal > 12.0

  const predictablePassages = sentenceSurprisals
    .filter(s => s.avgSurprisal < 5.5)
    .slice(0, 5);

  const engagingPassages = sentenceSurprisals
    .filter(s => s.avgSurprisal >= 6.5 && s.avgSurprisal <= 9.5)
    .sort((a, b) => b.avgSurprisal - a.avgSurprisal)
    .slice(0, 5);

  const incoherentPassages = sentenceSurprisals
    .filter(s => s.avgSurprisal > 12.0)
    .slice(0, 3);

  // Engagement score (0-10)
  // Rewards: moderate average surprisal (7-9), high proportion of engaging passages
  const engagingRatio = sentenceSurprisals.length > 0
    ? sentenceSurprisals.filter(s => s.avgSurprisal >= 6.5 && s.avgSurprisal <= 9.5).length / sentenceSurprisals.length
    : 0;

  // Optimal average surprisal is ~7.5-8.5
  const avgOptimality = 1 - Math.abs(averageSurprisal - 8.0) / 6.0;

  const engagementScore = clamp(
    (engagingRatio * 6 + avgOptimality * 4),
    0, 10
  );

  return {
    averageSurprisal,
    surprisalStdDev,
    predictablePassages,
    engagingPassages,
    incoherentPassages,
    engagementScore: round(engagementScore, 1),
  };
}

// ============================================================================
// TECHNIQUE 3: COMPRESSION RATIO AS QUALITY METRIC
// ============================================================================

function analyzeCompression(text: string): CompressionAnalysis {
  const paragraphs = splitParagraphs(text);
  const originalBytes = Buffer.byteLength(text, 'utf-8');

  // Overall compression ratio
  const compressed = compressedSize(text);
  const overallRatio = originalBytes > 0 ? round(compressed / originalBytes, 4) : 1;

  // Per-paragraph compression ratios
  const perParagraph = paragraphs.map((para, index) => {
    const paraOriginal = Buffer.byteLength(para, 'utf-8');
    const paraCompressed = compressedSize(para);
    return {
      index,
      ratio: paraOriginal > 0 ? round(paraCompressed / paraOriginal, 4) : 1,
      originalBytes: paraOriginal,
    };
  });

  // Cross-paragraph redundancy:
  // If compressing (A + B) is not much larger than compressing A alone,
  // then B adds little new information beyond A.
  const crossParagraphRedundancy: CompressionAnalysis['crossParagraphRedundancy'] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      const sizeA = compressedSize(paragraphs[i]);
      const sizeB = compressedSize(paragraphs[j]);
      const sizeAB = compressedSize(paragraphs[i] + '\n\n' + paragraphs[j]);

      // If AB compressed is much smaller than A+B separately,
      // the paragraphs share significant information.
      const expectedSize = sizeA + sizeB;
      const redundancyScore = expectedSize > 0
        ? round(1 - sizeAB / expectedSize, 4)
        : 0;

      crossParagraphRedundancy.push({
        fromIndex: i,
        toIndex: j,
        redundancyScore: Math.max(0, redundancyScore),
      });
    }
  }

  // Uniqueness score (0-10)
  // Lower overall ratio = more unique content
  // Typical essay compression ratio: 0.40-0.65
  // Very repetitive: 0.30-0.40
  // Very unique: 0.65-0.80
  let uniquenessScore: number;
  if (originalBytes < 50) {
    uniquenessScore = 5; // Not enough data
  } else {
    // Higher compression ratio = harder to compress = more unique
    // But also consider: too high might mean random/incoherent
    uniquenessScore = clamp((overallRatio - 0.30) / 0.40 * 10, 0, 10);
  }

  return {
    overallRatio,
    perParagraph,
    crossParagraphRedundancy,
    uniquenessScore: round(uniquenessScore, 1),
  };
}

// ============================================================================
// TECHNIQUE 4: INFORMATION DENSITY VARIATION
// ============================================================================

function analyzeDensityVariation(text: string): DensityVariationAnalysis {
  const words = tokenize(text);

  // Sliding window entropy (window = 30 words, step = 10)
  const windowSize = 30;
  const step = 10;
  const densityCurve: DensityVariationAnalysis['densityCurve'] = [];

  if (words.length < windowSize) {
    // Essay too short for sliding window -- return single point
    const entropy = shannonEntropy(words);
    densityCurve.push({ position: 0, entropy: round(entropy, 3) });
  } else {
    for (let i = 0; i <= words.length - windowSize; i += step) {
      const window = words.slice(i, i + windowSize);
      const entropy = shannonEntropy(window);
      densityCurve.push({
        position: round(i / words.length, 3),
        entropy: round(entropy, 3),
      });
    }
  }

  const entropies = densityCurve.map(d => d.entropy);
  const densityStdDev = round(stdDev(entropies), 3);
  const densityMean = round(mean(entropies), 3);
  const coefficientOfVariation = densityMean > 0
    ? round(densityStdDev / densityMean, 3)
    : 0;

  // Determine shape profile
  const shapeProfile = classifyDensityCurve(entropies);

  // Variation score (0-10)
  // Good writing has intentional variation (CV of 0.05-0.15)
  // Flat writing: CV < 0.03
  // Too erratic: CV > 0.25
  let variationScore: number;
  if (entropies.length < 3) {
    variationScore = 5; // Not enough data points
  } else if (coefficientOfVariation < 0.02) {
    variationScore = 2; // Monotonously flat
  } else if (coefficientOfVariation < 0.05) {
    variationScore = 5; // Slightly flat
  } else if (coefficientOfVariation <= 0.15) {
    variationScore = 8 + (coefficientOfVariation - 0.05) * 20; // Sweet spot
  } else if (coefficientOfVariation <= 0.25) {
    variationScore = 7; // Somewhat erratic but still controlled
  } else {
    variationScore = 4; // Too erratic
  }

  // Bonus for good shape profiles
  if (shapeProfile === 'mountain' || shapeProfile === 'oscillating') {
    variationScore = Math.min(10, variationScore + 1);
  }

  return {
    densityCurve,
    densityStdDev,
    densityMean,
    coefficientOfVariation,
    shapeProfile,
    variationScore: round(clamp(variationScore, 0, 10), 1),
  };
}

/** Classify the density curve shape */
function classifyDensityCurve(entropies: number[]): DensityVariationAnalysis['shapeProfile'] {
  if (entropies.length < 3) return 'flat';

  const n = entropies.length;
  const firstThird = mean(entropies.slice(0, Math.ceil(n / 3)));
  const middleThird = mean(entropies.slice(Math.ceil(n / 3), Math.ceil(2 * n / 3)));
  const lastThird = mean(entropies.slice(Math.ceil(2 * n / 3)));

  const overallMean = mean(entropies);
  const variation = stdDev(entropies);

  // Check for flatness
  if (variation < 0.1) return 'flat';

  // Check for mountain (high in middle)
  if (middleThird > firstThird * 1.05 && middleThird > lastThird * 1.05) return 'mountain';

  // Check for valley (low in middle)
  if (middleThird < firstThird * 0.95 && middleThird < lastThird * 0.95) return 'valley';

  // Check for gradual build (increasing)
  if (lastThird > firstThird * 1.08) return 'gradual_build';

  // Check for front-loaded
  if (firstThird > lastThird * 1.08) return 'front_loaded';

  // Check for back-loaded
  if (lastThird > middleThird * 1.05 && lastThird > firstThird * 1.05) return 'back_loaded';

  // Count direction changes for oscillating
  let directionChanges = 0;
  for (let i = 2; i < entropies.length; i++) {
    const prevDelta = entropies[i - 1] - entropies[i - 2];
    const currDelta = entropies[i] - entropies[i - 1];
    if (prevDelta * currDelta < 0) directionChanges++;
  }

  if (directionChanges >= Math.ceil(n / 3)) return 'oscillating';

  return 'flat';
}

// ============================================================================
// TECHNIQUE 5: MUTUAL INFORMATION BETWEEN SECTIONS
// ============================================================================

function analyzeMutualInformation(text: string): MutualInformationAnalysis {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length < 2) {
    return {
      introConclusion: 0,
      bodyParagraphPairs: [],
      avgBodyMI: 0,
      coherenceScore: 5, // Neutral for insufficient data
    };
  }

  // Build word distributions per paragraph
  const paraDistributions = paragraphs.map(p => {
    const words = tokenize(p);
    const freq = new Map<string, number>();
    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    return { words, freq, total: words.length };
  });

  /**
   * Calculate mutual information between two word distributions.
   * MI(X;Y) = sum_w P(w in X and Y) * log2(P(w in X and Y) / (P(w in X) * P(w in Y)))
   *
   * We approximate by computing word co-occurrence across the two sections.
   */
  function computeMI(dist1: typeof paraDistributions[0], dist2: typeof paraDistributions[0]): number {
    if (dist1.total === 0 || dist2.total === 0) return 0;

    // Vocabulary of both sections
    const vocab = new Set<string>();
    Array.from(dist1.freq.keys()).forEach(w => vocab.add(w));
    Array.from(dist2.freq.keys()).forEach(w => vocab.add(w));

    const totalWords = dist1.total + dist2.total;
    let mi = 0;

    const vocabArr = Array.from(vocab);
    for (let idx = 0; idx < vocabArr.length; idx++) {
      const w = vocabArr[idx];
      const count1 = dist1.freq.get(w) ?? 0;
      const count2 = dist2.freq.get(w) ?? 0;

      if (count1 === 0 || count2 === 0) continue; // No mutual information for words in only one section

      const pJoint = (count1 + count2) / totalWords;
      const pX = count1 / dist1.total;
      const pY = count2 / dist2.total;

      if (pJoint > 0 && pX > 0 && pY > 0) {
        mi += pJoint * Math.log2(pJoint / (pX * pY));
      }
    }

    return Math.max(0, mi);
  }

  // MI between intro and conclusion
  const introDist = paraDistributions[0];
  const conclusionDist = paraDistributions[paraDistributions.length - 1];
  const introConclusion = round(computeMI(introDist, conclusionDist), 3);

  // MI between body paragraph pairs
  const bodyParagraphPairs: MutualInformationAnalysis['bodyParagraphPairs'] = [];
  const bodyStart = 1;
  const bodyEnd = paragraphs.length - 1;

  for (let i = bodyStart; i < bodyEnd; i++) {
    for (let j = i + 1; j < bodyEnd; j++) {
      const mi = round(computeMI(paraDistributions[i], paraDistributions[j]), 3);
      bodyParagraphPairs.push({ p1: i, p2: j, mi });
    }
  }

  const avgBodyMI = bodyParagraphPairs.length > 0
    ? round(mean(bodyParagraphPairs.map(p => p.mi)), 3)
    : 0;

  // Coherence score (0-10)
  // Rewards: high intro-conclusion MI (circular structure) + low body MI (diverse content)
  const introScore = clamp(introConclusion * 5, 0, 5); // Up to 5 points for intro-conclusion coherence
  const bodyDiversityScore = bodyParagraphPairs.length > 0
    ? clamp((1 - avgBodyMI) * 5, 0, 5) // Up to 5 points for body diversity
    : 2.5; // Neutral if no body pairs

  const coherenceScore = round(introScore + bodyDiversityScore, 1);

  return {
    introConclusion,
    bodyParagraphPairs,
    avgBodyMI,
    coherenceScore: clamp(coherenceScore, 0, 10),
  };
}

// ============================================================================
// TECHNIQUE 6: KOLMOGOROV COMPLEXITY APPROXIMATION (NCD)
// ============================================================================

function analyzeNCD(text: string): NCDAnalysis {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length < 2) {
    return {
      paragraphPairs: [],
      redundantPairs: [],
      disconnectedPairs: [],
      averageNCD: 0.5,
      balanceScore: 5,
    };
  }

  // Pre-compute compressed sizes for each paragraph
  const paraCompressed = paragraphs.map(p => compressedSize(p));

  /**
   * Normalized Compression Distance:
   * NCD(x,y) = (C(xy) - min(C(x), C(y))) / max(C(x), C(y))
   *
   * 0 = identical, 1 = completely unrelated
   */
  const paragraphPairs: NCDAnalysis['paragraphPairs'] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      const cX = paraCompressed[i];
      const cY = paraCompressed[j];
      const cXY = compressedSize(paragraphs[i] + '\n' + paragraphs[j]);

      const maxC = Math.max(cX, cY);
      const minC = Math.min(cX, cY);

      const ncd = maxC > 0 ? round((cXY - minC) / maxC, 4) : 0;

      paragraphPairs.push({ p1: i, p2: j, ncd: clamp(ncd, 0, 1.1) });
    }
  }

  // Flag redundant pairs (NCD < 0.3 -- very similar)
  const redundantPairs = paragraphPairs.filter(p => p.ncd < 0.3);

  // Flag disconnected pairs (NCD > 0.95 -- very dissimilar)
  const disconnectedPairs = paragraphPairs.filter(p => p.ncd > 0.95);

  const averageNCD = paragraphPairs.length > 0
    ? round(mean(paragraphPairs.map(p => p.ncd)), 3)
    : 0.5;

  // Balance score (0-10)
  // Optimal NCD: 0.5-0.8 (connected but not redundant)
  // Too low: redundant paragraphs
  // Too high: disconnected paragraphs
  let balanceScore: number;
  if (paragraphPairs.length === 0) {
    balanceScore = 5;
  } else {
    const optimalDeviation = Math.abs(averageNCD - 0.65);
    balanceScore = clamp(10 - optimalDeviation * 15, 0, 10);

    // Penalty for any redundant or disconnected pairs
    balanceScore -= redundantPairs.length * 1.5;
    balanceScore -= disconnectedPairs.length * 1.0;
    balanceScore = clamp(balanceScore, 0, 10);
  }

  return {
    paragraphPairs,
    redundantPairs,
    disconnectedPairs,
    averageNCD,
    balanceScore: round(balanceScore, 1),
  };
}

// ============================================================================
// TECHNIQUE 7: ZIPF'S LAW DEVIATION
// ============================================================================

function analyzeZipf(text: string): ZipfAnalysis {
  const words = tokenize(text);

  if (words.length < 30) {
    return {
      alpha: 0,
      rSquared: 0,
      deviation: 1,
      interpretation: 'insufficient_data',
      topWords: [],
      naturalityScore: 5,
    };
  }

  // Build frequency distribution
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  // Sort by frequency (descending)
  const sorted = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1]);

  // Log-log values for regression: log(rank) vs log(frequency)
  const logRanks: number[] = [];
  const logFreqs: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const rank = i + 1;
    const frequency = sorted[i][1];
    logRanks.push(Math.log10(rank));
    logFreqs.push(Math.log10(frequency));
  }

  // Linear regression on log-log scale
  const regression = linearRegression(logRanks, logFreqs);
  const alpha = Math.abs(regression.slope); // Zipf exponent (should be ~1.0)
  const rSquared = round(regression.rSquared, 3);
  const deviation = round(Math.abs(alpha - 1.0), 3);

  // Top 10 words with actual vs expected Zipf frequencies
  const maxFreq = sorted[0]?.[1] ?? 1;
  const topWords = sorted.slice(0, 10).map(([word, count], i) => ({
    word,
    rank: i + 1,
    actualFreq: count,
    expectedFreq: round(maxFreq / (i + 1), 1), // Ideal Zipf: f(r) = f(1)/r
  }));

  // Interpretation
  // College essays (150-650 words) are too short for classic Zipf's law (alpha=1.0).
  // Short texts naturally produce lower alpha values because the long tail of rare words
  // is truncated. Expected alpha for essay-length text: 0.4-0.8 for diverse writing,
  // 0.8-1.2 for natural writing, >1.2 for over-reliant vocabulary.
  //
  // We use an adaptive expected alpha based on unique word count.
  const uniqueWordCount = sorted.length;
  // College essays (150-650 words) are too short for classic Zipf's law (alpha=1.0).
  // Short texts with diverse vocabulary naturally produce lower alpha because the
  // "long tail" of rare words is truncated. We use adaptive expectations.
  const expectedAlpha = uniqueWordCount < 60 ? 0.35 :
    uniqueWordCount < 100 ? 0.45 :
    uniqueWordCount < 200 ? 0.55 :
    uniqueWordCount < 400 ? 0.70 : 0.85;
  const adaptiveDeviation = round(Math.abs(alpha - expectedAlpha), 3);

  let interpretation: ZipfAnalysis['interpretation'];
  if (adaptiveDeviation < 0.25 && rSquared > 0.60) {
    interpretation = 'natural_fluid';
  } else if (alpha > expectedAlpha + 0.40) {
    interpretation = 'over_reliant'; // Steeper slope = too-frequent top words
  } else if (alpha < expectedAlpha * 0.4 && rSquared > 0.60) {
    interpretation = 'forced_vocabulary'; // Flatter slope = artificially uniform word usage
  } else {
    interpretation = 'natural_fluid'; // Close enough for essay-length text
  }

  // Naturality score (0-10)
  // For essay-length text, we're more forgiving of deviation from ideal Zipf
  // because short-text Zipf is inherently noisy.
  let naturalityScore: number;
  if (adaptiveDeviation < 0.10 && rSquared > 0.70) {
    naturalityScore = 10;
  } else if (adaptiveDeviation < 0.20 && rSquared > 0.60) {
    naturalityScore = 8;
  } else if (adaptiveDeviation < 0.30) {
    naturalityScore = 6;
  } else if (adaptiveDeviation < 0.45) {
    naturalityScore = 4;
  } else {
    naturalityScore = 2;
  }

  // Factor in R-squared (goodness of fit), but weight it less for short texts
  // because short texts have inherently noisier fits
  const rSquaredWeight = uniqueWordCount < 100 ? 0.3 : 0.5;
  naturalityScore *= ((1 - rSquaredWeight) + rSquared * rSquaredWeight);

  return {
    alpha: round(alpha, 3),
    rSquared,
    deviation,
    interpretation,
    topWords,
    naturalityScore: round(clamp(naturalityScore, 0, 10), 1),
  };
}

// ============================================================================
// COMPOSITE RUBRIC SCORING
// ============================================================================

function computeRubricScores(
  entropy: ShannonEntropyAnalysis,
  surprisal: SurprisalAnalysis,
  compression: CompressionAnalysis,
  densityVariation: DensityVariationAnalysis,
  mi: MutualInformationAnalysis,
  ncd: NCDAnalysis,
  zipf: ZipfAnalysis,
  text: string
): InformationTheoreticRubricScores {
  const sentences = splitSentences(text);

  // voice_integrity: Word choice diversity + natural Zipf distribution
  const wordChoiceDiversity = round(
    entropy.diversityScore * 0.6 + zipf.naturalityScore * 0.4,
    1
  );

  // craft_language_quality: Surprisal engagement + Zipf naturality + compression uniqueness
  const writingNaturalness = round(
    surprisal.engagementScore * 0.4 + zipf.naturalityScore * 0.35 + compression.uniquenessScore * 0.25,
    1
  );

  // structural_cohesion: NCD balance + MI coherence + density variation
  const structuralBalance = round(
    ncd.balanceScore * 0.4 + mi.coherenceScore * 0.35 + densityVariation.variationScore * 0.25,
    1
  );

  // narrative_arc_stakes: Density curve shape quality
  // Good arcs have intentional variation with a build
  let densityArcQuality: number;
  const goodShapes: DensityVariationAnalysis['shapeProfile'][] =
    ['mountain', 'gradual_build', 'oscillating', 'back_loaded'];
  if (goodShapes.includes(densityVariation.shapeProfile)) {
    densityArcQuality = round(densityVariation.variationScore * 1.1, 1);
  } else {
    densityArcQuality = round(densityVariation.variationScore * 0.8, 1);
  }
  densityArcQuality = clamp(densityArcQuality, 0, 10);

  // reflection_meaning: Intro-conclusion coherence (shows return to themes)
  const introConclCoherence = round(clamp(mi.introConclusion * 8, 0, 10), 1);

  // specificity_evidence: Information uniqueness via compression
  const informationUniqueness = round(compression.uniquenessScore, 1);

  // opening_hook: Surprisal of first 1-2 sentences
  const firstSentenceSurprisals = surprisal.engagingPassages
    .filter(p => p.startIndex < 200);
  const openingSurprisal = firstSentenceSurprisals.length > 0
    ? round(clamp(mean(firstSentenceSurprisals.map(p => p.avgSurprisal)) * 1.1, 0, 10), 1)
    : round(clamp(surprisal.averageSurprisal - 3, 0, 10), 1);

  // emotional_resonance: Variation in density (emotional writing has highs and lows)
  const emotionalDensityVariation = round(
    clamp(densityVariation.coefficientOfVariation * 80, 0, 10),
    1
  );

  // vulnerability_risk: Surprisal of passages about difficulty/failure
  // Higher surprisal in vulnerable passages = genuine (not cliched) vulnerability
  const vulnerabilitySurprisal = round(
    clamp(surprisal.engagementScore * 0.7 + (10 - surprisal.predictablePassages.length * 1.5), 0, 10),
    1
  );

  // audience_awareness: Engagement surprisal + appropriate density variation
  const engagementSurprisal = round(
    surprisal.engagementScore * 0.6 + densityVariation.variationScore * 0.4,
    1
  );

  // transformative_impact: Content progression (NCD shows progressive development)
  // Adjacent paragraphs should be moderately different (showing progression)
  const adjacentNCDs = ncd.paragraphPairs.filter(p => p.p2 === p.p1 + 1);
  const avgAdjacentNCD = adjacentNCDs.length > 0
    ? mean(adjacentNCDs.map(p => p.ncd))
    : 0.5;
  const contentProgression = round(
    clamp((avgAdjacentNCD - 0.3) / 0.5 * 10, 0, 10),
    1
  );

  return {
    wordChoiceDiversity,
    writingNaturalness,
    structuralBalance,
    densityArcQuality,
    introConclCoherence,
    informationUniqueness,
    openingSurprisal,
    emotionalDensityVariation,
    vulnerabilitySurprisal,
    engagementSurprisal,
    contentProgression,
  };
}

// ============================================================================
// DIAGNOSTIC FLAG GENERATION
// ============================================================================

function generateDiagnostics(
  entropy: ShannonEntropyAnalysis,
  surprisal: SurprisalAnalysis,
  compression: CompressionAnalysis,
  densityVariation: DensityVariationAnalysis,
  mi: MutualInformationAnalysis,
  ncd: NCDAnalysis,
  zipf: ZipfAnalysis,
): string[] {
  const flags: string[] = [];

  // Entropy flags
  if (entropy.diversityScore < 4) {
    flags.push('LOW_WORD_DIVERSITY: Essay uses a limited vocabulary. Consider replacing repeated words with more precise alternatives.');
  }
  if (entropy.monotonousSections.length > 3) {
    flags.push(`MONOTONOUS_SECTIONS: ${entropy.monotonousSections.length} sentences have unusually low word diversity. These may feel flat or repetitive.`);
  }

  // Surprisal flags
  if (surprisal.predictablePassages.length >= 3) {
    flags.push(`PREDICTABLE_PASSAGES: ${surprisal.predictablePassages.length} sentences use highly predictable/cliched language. A reader could guess the next word. Rewrite with specific, unexpected details.`);
  }
  if (surprisal.incoherentPassages.length >= 1) {
    flags.push(`INCOHERENT_PASSAGES: ${surprisal.incoherentPassages.length} sentence(s) may be confusing or use unusual word combinations. Review for clarity.`);
  }
  if (surprisal.engagementScore < 4) {
    flags.push('LOW_ENGAGEMENT_SURPRISAL: Writing is too predictable overall. Add unexpected details, vivid specifics, or surprising word choices.');
  }

  // Compression flags
  if (compression.overallRatio < 0.35) {
    flags.push('HIGH_REPETITION: Essay compresses unusually well, indicating repeated phrases or ideas. Each paragraph should introduce new information.');
  }
  const highRedundancy = compression.crossParagraphRedundancy.filter(r => r.redundancyScore > 0.15);
  if (highRedundancy.length > 0) {
    const pairs = highRedundancy.map(r => `P${r.fromIndex + 1}-P${r.toIndex + 1}`).join(', ');
    flags.push(`CROSS_PARAGRAPH_REDUNDANCY: Paragraphs ${pairs} share significant overlapping content. Consider consolidating or differentiating them.`);
  }

  // Density variation flags
  if (densityVariation.shapeProfile === 'flat') {
    flags.push('FLAT_DENSITY: Information density is uniform throughout the essay. Good writing varies density -- dense insight, then lighter narrative, then dense conclusion.');
  }
  if (densityVariation.coefficientOfVariation > 0.25) {
    flags.push('ERRATIC_DENSITY: Information density varies wildly. This may feel disjointed. Smooth transitions between dense and light sections.');
  }

  // Mutual information flags
  if (mi.introConclusion < 0.1 && mi.bodyParagraphPairs.length > 0) {
    flags.push('WEAK_CIRCULAR_STRUCTURE: Introduction and conclusion share almost no vocabulary/themes. Strong essays return to opening themes with new insight.');
  }
  if (mi.avgBodyMI > 0.5) {
    flags.push('BODY_PARAGRAPHS_TOO_SIMILAR: Body paragraphs share too much vocabulary. Each paragraph should explore a distinct aspect.');
  }

  // NCD flags
  if (ncd.redundantPairs.length > 0) {
    const pairs = ncd.redundantPairs.map(p => `P${p.p1 + 1}-P${p.p2 + 1}`).join(', ');
    flags.push(`REDUNDANT_PARAGRAPHS: Paragraphs ${pairs} are structurally very similar (NCD < 0.3). Consider merging or differentiating.`);
  }
  if (ncd.disconnectedPairs.length > 0) {
    const pairs = ncd.disconnectedPairs.map(p => `P${p.p1 + 1}-P${p.p2 + 1}`).join(', ');
    flags.push(`DISCONNECTED_PARAGRAPHS: Paragraphs ${pairs} seem unrelated (NCD > 0.95). Add transitional connections or thematic bridges.`);
  }

  // Zipf flags
  if (zipf.interpretation === 'over_reliant') {
    const topWord = zipf.topWords[0]?.word || '(unknown)';
    flags.push(`OVER_RELIANT_VOCABULARY: The word "${topWord}" and a few others dominate. Redistribute word usage for more natural flow.`);
  }
  if (zipf.interpretation === 'forced_vocabulary') {
    flags.push('FORCED_VOCABULARY: Word frequency distribution is unusually flat, suggesting vocabulary was artificially diversified. Use words naturally, even if some repeat.');
  }

  return flags;
}

// ============================================================================
// MAIN ANALYZER CLASS
// ============================================================================

/**
 * InformationTheoreticAnalyzer
 *
 * Unified class for all 7 information-theoretic writing quality techniques.
 * Pure computation, no LLM calls, < 20ms total execution.
 *
 * Usage:
 *   const analyzer = new InformationTheoreticAnalyzer();
 *   const result = analyzer.analyze(essayText);
 *
 * Use cases:
 *   - Pre-screening before LLM calls (identify obvious quality issues)
 *   - LLM prompt enrichment (pass diagnostics to improve Claude's analysis)
 *   - Score calibration (adjust LLM scores based on objective measures)
 *   - Instant feedback (show real-time metrics as user types)
 */
export class InformationTheoreticAnalyzer {

  /**
   * Run all 7 information-theoretic analyses on the input text.
   *
   * @param text - The essay/description text to analyze
   * @returns Complete InformationTheoreticAnalysis with all metrics, rubric scores, and diagnostics
   *
   * Performance: Typically < 15ms for essays up to 650 words.
   */
  analyze(text: string): InformationTheoreticAnalysis {
    const overallStart = performance.now();
    const timing: Record<string, number> = {};

    // Technique 1: Shannon Entropy
    let t0 = performance.now();
    const entropy = analyzeShannonEntropy(text);
    timing.shannonEntropy = round(performance.now() - t0, 2);

    // Technique 2: Surprisal
    t0 = performance.now();
    const surprisal = analyzeSurprisal(text);
    timing.surprisal = round(performance.now() - t0, 2);

    // Technique 3: Compression
    t0 = performance.now();
    const compression = analyzeCompression(text);
    timing.compression = round(performance.now() - t0, 2);

    // Technique 4: Density Variation
    t0 = performance.now();
    const densityVariation = analyzeDensityVariation(text);
    timing.densityVariation = round(performance.now() - t0, 2);

    // Technique 5: Mutual Information
    t0 = performance.now();
    const mutualInformation = analyzeMutualInformation(text);
    timing.mutualInformation = round(performance.now() - t0, 2);

    // Technique 6: NCD
    t0 = performance.now();
    const ncd = analyzeNCD(text);
    timing.ncd = round(performance.now() - t0, 2);

    // Technique 7: Zipf's Law
    t0 = performance.now();
    const zipf = analyzeZipf(text);
    timing.zipf = round(performance.now() - t0, 2);

    // Composite rubric scores
    t0 = performance.now();
    const rubricScores = computeRubricScores(
      entropy, surprisal, compression, densityVariation,
      mutualInformation, ncd, zipf, text
    );
    timing.rubricScoring = round(performance.now() - t0, 2);

    // Diagnostic flags
    t0 = performance.now();
    const diagnostics = generateDiagnostics(
      entropy, surprisal, compression, densityVariation,
      mutualInformation, ncd, zipf
    );
    timing.diagnostics = round(performance.now() - t0, 2);

    const totalMs = round(performance.now() - overallStart, 2);

    return {
      entropy,
      surprisal,
      compression,
      densityVariation,
      mutualInformation,
      ncd,
      zipf,
      rubricScores,
      diagnostics,
      performance: {
        totalMs,
        perTechnique: timing,
      },
    };
  }

  /**
   * Quick analysis returning only rubric scores and diagnostics.
   * Slightly faster than full analysis for cases where per-sentence detail isn't needed.
   */
  quickAnalyze(text: string): {
    rubricScores: InformationTheoreticRubricScores;
    diagnostics: string[];
    totalMs: number;
  } {
    const result = this.analyze(text);
    return {
      rubricScores: result.rubricScores,
      diagnostics: result.diagnostics,
      totalMs: result.performance.totalMs,
    };
  }

  /**
   * Generate a compact summary suitable for injecting into an LLM prompt.
   * This enriches the LLM's analysis with objective computational metrics.
   *
   * @returns A structured string to prepend to LLM analysis prompts.
   */
  generatePromptEnrichment(text: string): string {
    const result = this.analyze(text);

    const lines: string[] = [
      '=== COMPUTATIONAL TEXT ANALYSIS (Information-Theoretic) ===',
      '',
      `Word Choice Diversity: ${result.entropy.diversityScore}/10 (Shannon entropy: ${result.entropy.overallEntropy} bits)`,
      `Engagement Profile: ${result.surprisal.engagementScore}/10 (avg surprisal: ${result.surprisal.averageSurprisal} bits)`,
      `Content Uniqueness: ${result.compression.uniquenessScore}/10 (compression ratio: ${result.compression.overallRatio})`,
      `Density Variation: ${result.densityVariation.variationScore}/10 (shape: ${result.densityVariation.shapeProfile}, CV: ${result.densityVariation.coefficientOfVariation})`,
      `Structural Coherence: ${result.mutualInformation.coherenceScore}/10 (intro-conclusion MI: ${result.mutualInformation.introConclusion})`,
      `Paragraph Balance: ${result.ncd.balanceScore}/10 (avg NCD: ${result.ncd.averageNCD})`,
      `Writing Naturalness: ${result.zipf.naturalityScore}/10 (Zipf alpha: ${result.zipf.alpha}, ${result.zipf.interpretation})`,
      '',
    ];

    if (result.diagnostics.length > 0) {
      lines.push('Flags:');
      for (const flag of result.diagnostics) {
        lines.push(`  - ${flag}`);
      }
      lines.push('');
    }

    if (result.surprisal.predictablePassages.length > 0) {
      lines.push('Cliched/Predictable passages:');
      for (const p of result.surprisal.predictablePassages.slice(0, 3)) {
        lines.push(`  - "${p.text}" (surprisal: ${p.avgSurprisal})`)  ;
      }
      lines.push('');
    }

    if (result.entropy.monotonousSections.length > 0) {
      lines.push('Monotonous sections (low word diversity):');
      for (const s of result.entropy.monotonousSections.slice(0, 3)) {
        lines.push(`  - "${s.text}" (entropy: ${s.entropy})`)  ;
      }
    }

    lines.push('=== END COMPUTATIONAL ANALYSIS ===');

    return lines.join('\n');
  }

  /**
   * Compare two versions of an essay and return improvement metrics.
   * Useful for tracking writing quality improvements across drafts.
   */
  compareVersions(oldText: string, newText: string): {
    rubricDelta: Record<string, number>;
    diagnosticsAdded: string[];
    diagnosticsResolved: string[];
    overallImprovement: number;
  } {
    const oldResult = this.analyze(oldText);
    const newResult = this.analyze(newText);

    const rubricDelta: Record<string, number> = {};
    for (const key of Object.keys(newResult.rubricScores) as (keyof InformationTheoreticRubricScores)[]) {
      rubricDelta[key] = round(newResult.rubricScores[key] - oldResult.rubricScores[key], 1);
    }

    // Diagnostics comparison
    const oldDiagSet = new Set(oldResult.diagnostics.map(d => d.split(':')[0]));
    const newDiagSet = new Set(newResult.diagnostics.map(d => d.split(':')[0]));

    const diagnosticsAdded = newResult.diagnostics.filter(d => !oldDiagSet.has(d.split(':')[0]));
    const diagnosticsResolved = oldResult.diagnostics.filter(d => !newDiagSet.has(d.split(':')[0]));

    // Overall improvement: average rubric delta
    const deltas = Object.values(rubricDelta);
    const overallImprovement = round(mean(deltas), 1);

    return {
      rubricDelta,
      diagnosticsAdded,
      diagnosticsResolved,
      overallImprovement,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const informationTheoreticAnalyzer = new InformationTheoreticAnalyzer();

// ============================================================================
// RUBRIC DIMENSION MAPPING REFERENCE
// ============================================================================

/**
 * How each technique maps to the Uplift 11-dimension rubric:
 *
 * | Technique                      | Primary Rubric Dimension(s)           | Use Case                        |
 * |-------------------------------|---------------------------------------|---------------------------------|
 * | Shannon Entropy               | voice_integrity, craft_language       | Pre-screening, instant feedback |
 * | Surprisal Detection           | craft_language, voice_integrity,      | Cliche detection, enrichment    |
 * |                               | opening_hook, emotional_resonance     |                                 |
 * | Compression Ratio             | structural_cohesion, specificity      | Pre-screening, calibration      |
 * | Density Variation             | narrative_arc, structural_cohesion,   | Score calibration, feedback     |
 * |                               | audience_awareness                    |                                 |
 * | Mutual Information            | structural_cohesion, reflection       | Score calibration, enrichment   |
 * | NCD (Kolmogorov)              | structural_cohesion, transformative   | Pre-screening, feedback         |
 * | Zipf's Law                    | voice_integrity, craft_language       | Authenticity detection, calib   |
 *
 * Integration points with existing system:
 *
 * 1. BEFORE LLM calls (pre-screening):
 *    - If compression ratio < 0.35 → flag as repetitive, lower expected NQI
 *    - If Zipf interpretation = "forced_vocabulary" → flag for authenticity review
 *    - If surprisal engagement < 4 → essay likely needs major revision
 *
 * 2. DURING LLM calls (prompt enrichment):
 *    - Pass generatePromptEnrichment() output to Claude for more calibrated scoring
 *    - Monotonous sections help Claude identify specific weak spots
 *    - Predictable passages help Claude give targeted cliche feedback
 *
 * 3. AFTER LLM calls (score calibration):
 *    - Adjust LLM voice_integrity score based on entropy diversity score
 *    - Adjust LLM craft_language score based on Zipf naturality
 *    - Adjust LLM structural_cohesion based on MI coherence + NCD balance
 *
 * 4. INSTANT FEEDBACK (no LLM needed):
 *    - Show real-time density curve as user types
 *    - Flag monotonous sections immediately
 *    - Show compression-based repetition warning
 *    - Display Zipf deviation as "writing naturalness" meter
 */
