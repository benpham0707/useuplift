/**
 * Sentence Analyzer — Deterministic Per-Sentence Analysis (Layer 1)
 *
 * Computes structural, syntactic, and quality metrics for individual sentences.
 * All analysis is deterministic (no LLM calls). Target: <50ms for 650-word essay.
 *
 * Imports shared utilities from featureExtractor to avoid duplication.
 */

import type { SentenceMetrics, SentenceUnderstanding, SentenceRhythm, SentenceType } from './types';
import {
  splitSentences,
  splitWords,
  SENSORY_WORDS,
  CLICHES,
  FILLER_PHRASES,
  PASSIVE_PATTERN,
} from '../../workshop/scoring/featureExtractor';
import { wordAnalyzer } from './wordAnalyzer';
import { createHash } from 'crypto';

// ============================================================================
// CLAUSE DEPTH DETECTION
// ============================================================================

const SUBORDINATE_CONJUNCTIONS = new Set([
  'who', 'which', 'that', 'where', 'when', 'while', 'although', 'because',
  'since', 'if', 'unless', 'before', 'after', 'until', 'whereas', 'though',
  'whenever', 'wherever', 'whether', 'whom', 'whose',
]);

// ============================================================================
// CONCRETE DETAIL DETECTION
// ============================================================================

/** Matches numbers: "42", "3.5", "$500", "1,200" */
const NUMBER_PATTERN = /\b\d[\d,.]*\b/;

/** Matches words starting with uppercase that aren't sentence starters */
const PROPER_NOUN_PATTERN = /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;

/** Specific place/location indicators */
const LOCATION_WORDS = new Set([
  'street', 'avenue', 'road', 'highway', 'park', 'building', 'room',
  'school', 'university', 'hospital', 'church', 'library', 'museum',
  'restaurant', 'store', 'city', 'town', 'village', 'country',
  'neighborhood', 'campus', 'lab', 'laboratory', 'office', 'studio',
]);

// ============================================================================
// IMPERATIVE VERB DETECTION
// ============================================================================

const IMPERATIVE_STARTERS = new Set([
  'look', 'listen', 'consider', 'imagine', 'think', 'remember', 'note',
  'let', 'try', 'stop', 'start', 'go', 'come', 'take', 'give', 'keep',
  'make', 'do', 'be', 'see', 'find', 'get', 'put', 'run', 'tell',
  'ask', 'help', 'show', 'read', 'write', 'learn', 'open', 'close',
  'bring', 'send', 'call', 'wait', 'hold', 'watch', 'follow', 'turn',
  'leave', 'sit', 'stand', 'set', 'move', 'play', 'pay', 'meet',
  'never', 'always', 'don\'t', 'please',
]);

// ============================================================================
// SENTENCE ANALYZER CLASS
// ============================================================================

class SentenceAnalyzer {
  /**
   * Compute deterministic metrics for a single sentence.
   */
  analyzeSentence(sentence: string): SentenceMetrics {
    const words = splitWords(sentence);
    const wordCount = words.length;
    const avgWordLength = wordCount > 0
      ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
      : 0;

    const clauseDepth = this.computeClauseDepth(sentence);
    const isPassiveVoice = this.detectPassiveVoice(sentence);
    const sentenceType = this.classifySentenceType(sentence, words);
    const rhythm = this.classifyRhythm(wordCount);

    const hasConcreteDetail = this.detectConcreteDetail(sentence, words);
    const hasSensoryLanguage = words.some(w => SENSORY_WORDS.has(w));
    const hasCliche = this.detectCliche(sentence);
    const hasFiller = this.detectFiller(sentence);

    const specificityScore = this.computeSpecificityScore(
      words, sentence, hasConcreteDetail, hasSensoryLanguage,
    );
    const voiceStrengthScore = this.computeVoiceStrengthScore(
      words, isPassiveVoice, sentenceType, avgWordLength,
    );

    return {
      wordCount,
      avgWordLength,
      clauseDepth,
      isPassiveVoice,
      sentenceType,
      rhythm,
      hasConcreteDetail,
      hasSensoryLanguage,
      hasCliche,
      hasFiller,
      specificityScore,
      voiceStrengthScore,
    };
  }

  /**
   * Split paragraph into sentences, analyze each, and produce SentenceUnderstanding[].
   */
  analyzeParagraphSentences(paragraphText: string): SentenceUnderstanding[] {
    const sentences = splitSentences(paragraphText);

    return sentences.map((text, index) => {
      const metrics = this.analyzeSentence(text);
      const flaggedWords = wordAnalyzer.analyzeWords(text);
      const textHash = createHash('md5').update(text).digest('hex');

      return {
        index,
        text,
        textHash,
        stale: false,
        metrics,
        flaggedWords,
        deepAnalysis: null,
        conversationInsights: [],
        studentExplanation: null,
      };
    });
  }

  /**
   * Cross-sentence rhythm diversity score (0-100).
   * Higher = more rhythmic variety = better writing.
   */
  analyzeRhythmVariety(sentences: SentenceMetrics[]): number {
    if (sentences.length < 3) return 50; // Not enough data to judge

    // Count rhythm type distribution
    const rhythmCounts: Record<SentenceRhythm, number> = {
      short_punch: 0,
      medium_flow: 0,
      long_build: 0,
    };

    for (const s of sentences) {
      rhythmCounts[s.rhythm]++;
    }

    const total = sentences.length;

    // Perfect distribution would be 1/3 each. Measure deviation from ideal.
    const idealRatio = 1 / 3;
    const ratios = Object.values(rhythmCounts).map(c => c / total);
    const deviation = ratios.reduce((sum, r) => sum + Math.abs(r - idealRatio), 0);
    // Max deviation is ~1.33 (all one type). Normalize to 0-1 inversely.
    const distributionScore = Math.max(0, 1 - deviation / 1.33);

    // Check for rhythm alternation (consecutive sentences have different rhythms)
    let alternations = 0;
    for (let i = 1; i < sentences.length; i++) {
      if (sentences[i].rhythm !== sentences[i - 1].rhythm) {
        alternations++;
      }
    }
    const alternationScore = alternations / Math.max(sentences.length - 1, 1);

    // Check word count variance (high variance = diverse sentence lengths)
    const wordCounts = sentences.map(s => s.wordCount);
    const mean = wordCounts.reduce((a, b) => a + b, 0) / total;
    const variance = wordCounts.reduce((sum, wc) => sum + (wc - mean) ** 2, 0) / total;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; // coefficient of variation
    const varianceScore = Math.min(cv / 0.6, 1); // CV of 0.6+ = perfect variety

    // Weighted combination
    const raw = (distributionScore * 0.3) + (alternationScore * 0.35) + (varianceScore * 0.35);
    return Math.round(raw * 100);
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private computeClauseDepth(sentence: string): number {
    const words = sentence.toLowerCase().split(/\s+/);
    let depth = 1;
    for (const word of words) {
      // Strip punctuation for matching
      const clean = word.replace(/[^a-z']/g, '');
      if (SUBORDINATE_CONJUNCTIONS.has(clean)) {
        depth++;
      }
    }
    return depth;
  }

  private detectPassiveVoice(sentence: string): boolean {
    // Reset lastIndex since PASSIVE_PATTERN has global flag
    PASSIVE_PATTERN.lastIndex = 0;
    return PASSIVE_PATTERN.test(sentence);
  }

  private classifySentenceType(sentence: string, words: string[]): SentenceType {
    const trimmed = sentence.trim();
    if (trimmed.length === 0) return 'fragment';

    const lastChar = trimmed[trimmed.length - 1];

    if (lastChar === '?') return 'interrogative';
    if (lastChar === '!') return 'exclamatory';

    // Fragment detection: very short, no verb indicator
    if (words.length <= 3) return 'fragment';

    // Imperative: starts with a base-form verb or "don't"
    const firstWord = words[0] || '';
    if (IMPERATIVE_STARTERS.has(firstWord)) return 'imperative';

    return 'declarative';
  }

  private classifyRhythm(wordCount: number): SentenceRhythm {
    if (wordCount < 8) return 'short_punch';
    if (wordCount <= 20) return 'medium_flow';
    return 'long_build';
  }

  private detectConcreteDetail(sentence: string, words: string[]): boolean {
    // Numbers in the sentence
    if (NUMBER_PATTERN.test(sentence)) return true;

    // Proper nouns (words starting with uppercase that aren't at sentence start)
    const properNouns = sentence.slice(1).match(PROPER_NOUN_PATTERN);
    if (properNouns && properNouns.length > 0) return true;

    // Location words
    if (words.some(w => LOCATION_WORDS.has(w))) return true;

    return false;
  }

  private detectCliche(sentence: string): boolean {
    const lower = sentence.toLowerCase();
    for (const cliche of CLICHES) {
      if (lower.includes(cliche)) return true;
    }
    return false;
  }

  private detectFiller(sentence: string): boolean {
    const lower = sentence.toLowerCase();
    for (const filler of FILLER_PHRASES) {
      if (lower.includes(filler)) return true;
    }
    return false;
  }

  private computeSpecificityScore(
    words: string[],
    sentence: string,
    hasConcreteDetail: boolean,
    hasSensoryLanguage: boolean,
  ): number {
    if (words.length === 0) return 0;

    let score = 30; // baseline

    // Concrete detail adds 20
    if (hasConcreteDetail) score += 20;

    // Sensory language adds 15
    if (hasSensoryLanguage) score += 15;

    // Named entities (proper nouns not at start) add 15
    const properNouns = sentence.slice(1).match(PROPER_NOUN_PATTERN);
    if (properNouns && properNouns.length > 0) {
      score += Math.min(properNouns.length * 8, 15);
    }

    // Numbers add 10
    if (NUMBER_PATTERN.test(sentence)) score += 10;

    // Longer average word length suggests more precise vocabulary
    const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
    if (avgLen > 5) score += 5;
    if (avgLen > 6) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  private computeVoiceStrengthScore(
    words: string[],
    isPassive: boolean,
    sentenceType: SentenceType,
    avgWordLength: number,
  ): number {
    if (words.length === 0) return 0;

    let score = 50; // baseline

    // Active voice is stronger
    if (!isPassive) score += 15;
    else score -= 10;

    // Variety in sentence types is good (non-declarative = more dynamic)
    if (sentenceType === 'interrogative' || sentenceType === 'exclamatory') score += 5;
    if (sentenceType === 'imperative') score += 10;
    if (sentenceType === 'fragment') score += 3; // deliberate fragments can be powerful

    // Precise word choices (longer words suggest more specific vocabulary)
    if (avgWordLength > 5) score += 5;
    if (avgWordLength > 6) score += 5;

    // Short, punchy sentences with active voice = strong voice
    if (words.length < 8 && !isPassive) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }
}

/** Singleton sentence analyzer */
export const sentenceAnalyzer = new SentenceAnalyzer();
export { SentenceAnalyzer };
