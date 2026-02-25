/**
 * Idiolect Detector
 *
 * Identifies distinctive personal language patterns:
 * - Signature phrases or constructions (appear 2+ times, not common cliches)
 * - Preferred sentence structures (subject-first, intro clauses, fragments, etc.)
 * - Characteristic word choices (frequent + not universally common)
 * - Unique punctuation habits (em-dash lover, semicolon user, etc.)
 *
 * Builds an "idiolect profile" that helps maintain authentic voice during editing.
 *
 * Performance: < 5ms for a 650-word essay.
 * Dependencies: zero external.
 */

import type { IdiolectProfile } from './types';
import {
  FUNCTION_WORD_SET,
  COMMON_BIGRAMS,
} from './constants';
import {
  tokenize,
  splitSentences,
  ngramFrequencies,
  mean,
  clamp,
} from './textUtils';

// ============================================================================
// COMMON PHRASES (to exclude from "signature phrase" detection)
// ============================================================================

const COMMON_ESSAY_PHRASES = new Set([
  'i was', 'i am', 'i had', 'i have', 'it was', 'it is',
  'there was', 'there were', 'there is', 'i was able',
  'i wanted to', 'i decided to', 'i started to', 'i began to',
  'i learned that', 'i realized that', 'i knew that',
  'i think that', 'i believe that', 'i feel that',
  'in order to', 'i was not', 'i did not',
  'as well as', 'due to the', 'in the end',
  'at the same', 'at the same time', 'on the other',
  'on the other hand', 'for the first', 'for the first time',
  'at the end', 'at the beginning',
]);

// ============================================================================
// MAIN DETECTION
// ============================================================================

/**
 * Build an idiolect profile from text.
 *
 * @param text - Raw text to analyze
 * @returns IdiolectProfile with distinctive language patterns
 */
export function detectIdiolect(text: string): IdiolectProfile {
  const words = tokenize(text);
  const sentences = splitSentences(text);

  if (words.length < 30 || sentences.length < 3) {
    return createMinimalProfile();
  }

  const signaturePhrases = findSignaturePhrases(words);
  const preferredStructures = analyzePreferredStructures(sentences);
  const characteristicWords = findCharacteristicWords(words);
  const punctuationHabits = analyzePunctuationHabits(text, sentences);

  // Distinctiveness score: how unique is this voice?
  const distinctiveness = computeDistinctiveness(
    signaturePhrases,
    preferredStructures,
    characteristicWords,
    punctuationHabits
  );

  return {
    signaturePhrases,
    preferredStructures,
    characteristicWords,
    punctuationHabits,
    distinctiveness: Math.round(distinctiveness * 1000) / 1000,
  };
}

// ============================================================================
// SIGNATURE PHRASES
// ============================================================================

/**
 * Find phrases that appear 2+ times and are NOT common essay phrases.
 * These are likely the writer's personal constructions.
 */
function findSignaturePhrases(words: string[]): string[] {
  const signatures: string[] = [];

  // Check bigrams and trigrams
  for (const n of [2, 3]) {
    const freqs = ngramFrequencies(words, n);

    for (const [ngram, count] of freqs) {
      if (count < 2) continue;

      // Skip if it's a common phrase
      if (n === 2 && COMMON_BIGRAMS.has(ngram)) continue;
      if (COMMON_ESSAY_PHRASES.has(ngram)) continue;

      // Skip if all words are function words
      const ngramWords = ngram.split(' ');
      if (ngramWords.every(w => FUNCTION_WORD_SET.has(w))) continue;

      // Skip very short or very common patterns
      if (ngram.length < 5) continue;

      signatures.push(ngram);
    }
  }

  // Sort by distinctiveness (longer phrases first, then by length)
  signatures.sort((a, b) => b.split(' ').length - a.split(' ').length || b.length - a.length);

  // Remove redundant shorter phrases that are subsets of longer ones
  const deduped: string[] = [];
  for (const sig of signatures) {
    if (!deduped.some(existing => existing.includes(sig))) {
      deduped.push(sig);
    }
  }

  return deduped.slice(0, 10);
}

// ============================================================================
// PREFERRED SENTENCE STRUCTURES
// ============================================================================

function analyzePreferredStructures(
  sentences: string[]
): IdiolectProfile['preferredStructures'] {
  const count = sentences.length;
  if (count === 0) {
    return {
      subjectFirstRatio: 0, introClauseRatio: 0,
      compoundComplexRatio: 0, fragmentRatio: 0, questionRatio: 0,
    };
  }

  let subjectFirst = 0;
  let introClause = 0;
  let compoundComplex = 0;
  let fragments = 0;
  let questions = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const words = trimmed.split(/\s+/);

    // Questions
    if (trimmed.endsWith('?')) {
      questions++;
      continue;
    }

    // Fragments (very short, no main verb)
    if (words.length <= 3) {
      fragments++;
      continue;
    }

    // Subject-first: starts with pronoun or determiner + noun
    const firstWord = words[0].toLowerCase().replace(/[^a-z']/g, '');
    const subjectStarters = [
      'i', 'he', 'she', 'we', 'they', 'it', 'the', 'my', 'his', 'her',
      'our', 'their', 'this', 'that', 'these', 'those',
    ];
    if (subjectStarters.includes(firstWord)) {
      subjectFirst++;
    }

    // Introductory clause: starts with subordinator, adverb, or prepositional phrase
    const introStarters = [
      'when', 'while', 'although', 'because', 'since', 'if', 'after',
      'before', 'as', 'until', 'however', 'meanwhile', 'suddenly',
      'eventually', 'finally', 'fortunately', 'unfortunately',
      'in', 'on', 'at', 'from', 'with', 'during', 'through',
      'despite', 'without', 'between', 'among',
    ];
    if (introStarters.includes(firstWord)) {
      introClause++;
    }

    // Compound-complex: has both a coordinating conjunction AND a subordinator
    const hasCoordinator = /\b(and|but|or|yet|so)\b/.test(sentence);
    const hasSubordinator = /\b(when|while|although|because|since|if|after|before|unless|until|though)\b/i.test(sentence);
    const hasComma = sentence.includes(',');
    if (hasCoordinator && hasSubordinator && hasComma) {
      compoundComplex++;
    }
  }

  return {
    subjectFirstRatio: Math.round((subjectFirst / count) * 100) / 100,
    introClauseRatio: Math.round((introClause / count) * 100) / 100,
    compoundComplexRatio: Math.round((compoundComplex / count) * 100) / 100,
    fragmentRatio: Math.round((fragments / count) * 100) / 100,
    questionRatio: Math.round((questions / count) * 100) / 100,
  };
}

// ============================================================================
// CHARACTERISTIC WORDS
// ============================================================================

/**
 * Find words that the writer uses more often than the typical writer.
 *
 * Strategy: find words that are frequent in this text but not function words,
 * not extremely common content words, and not topic-specific jargon.
 */
function findCharacteristicWords(words: string[]): string[] {
  const wordCount = words.length;
  if (wordCount < 50) return [];

  // Count all word frequencies
  const freqs = new Map<string, number>();
  for (const word of words) {
    freqs.set(word, (freqs.get(word) ?? 0) + 1);
  }

  // Very common English words that every writer uses (not distinctive)
  const veryCommonWords = new Set([
    'the', 'a', 'an', 'and', 'but', 'or', 'is', 'was', 'were', 'are',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'from', 'by', 'about',
    'as', 'it', 'that', 'this', 'not', 'they', 'them', 'their', 'we',
    'he', 'she', 'his', 'her', 'i', 'me', 'my', 'you', 'your',
    'so', 'if', 'when', 'then', 'than', 'all', 'some', 'more',
    'very', 'just', 'also', 'only', 'even', 'still', 'now',
    'what', 'which', 'who', 'how', 'where', 'why',
    'no', 'yes', 'up', 'out', 'there', 'here', 'one', 'two',
    'get', 'got', 'make', 'made', 'go', 'went', 'come', 'came',
    'take', 'took', 'know', 'knew', 'think', 'thought', 'see', 'saw',
    'said', 'tell', 'told', 'find', 'found', 'give', 'gave',
    'like', 'want', 'need', 'feel', 'felt',
    'first', 'new', 'time', 'way', 'day', 'people', 'because',
    'into', 'through', 'after', 'before', 'over', 'under',
  ]);

  // Find words that appear 2+ times, are not very common, and are not function words
  const candidates: { word: string; frequency: number; score: number }[] = [];

  for (const [word, count] of freqs) {
    if (count < 2) continue;
    if (word.length < 4) continue;
    if (veryCommonWords.has(word)) continue;
    if (FUNCTION_WORD_SET.has(word)) continue;

    const frequency = count / wordCount;

    // Score: higher frequency + moderate word length = more characteristic
    const score = frequency * (word.length > 8 ? 1.3 : 1.0);
    candidates.push({ word, frequency, score });
  }

  // Sort by score and return top words
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 8).map(c => c.word);
}

// ============================================================================
// PUNCTUATION HABITS
// ============================================================================

function analyzePunctuationHabits(text: string, sentences: string[]): string[] {
  const habits: string[] = [];
  const wordCount = text.split(/\s+/).length;
  const per1000 = wordCount > 0 ? 1000 / wordCount : 0;

  // Em-dash usage
  const emDashCount = (text.match(/[—–]|--/g) ?? []).length;
  const emDashRate = emDashCount * per1000;
  if (emDashRate > 5) habits.push('Heavy em-dash user');
  else if (emDashRate > 2) habits.push('Moderate em-dash user');

  // Semicolon usage
  const semicolonCount = (text.match(/;/g) ?? []).length;
  const semicolonRate = semicolonCount * per1000;
  if (semicolonRate > 3) habits.push('Frequent semicolon user');
  else if (semicolonRate > 1) habits.push('Occasional semicolon user');

  // Parenthetical asides
  const parentheticalCount = (text.match(/\([^)]+\)/g) ?? []).length;
  if (parentheticalCount >= 2) habits.push('Uses parenthetical asides');

  // Ellipsis usage
  const ellipsisCount = (text.match(/\.{3}|…/g) ?? []).length;
  if (ellipsisCount >= 2) habits.push('Ellipsis user');

  // Exclamation marks
  const exclamationCount = (text.match(/!/g) ?? []).length;
  if (exclamationCount >= 3) habits.push('Frequent exclamation marks');
  else if (exclamationCount === 0 && sentences.length > 5) habits.push('Never uses exclamation marks');

  // Question marks (in non-question contexts = rhetorical questions)
  const questionCount = (text.match(/\?/g) ?? []).length;
  if (questionCount >= 3) habits.push('Rhetorical question user');

  // Comma density
  const commaCount = (text.match(/,/g) ?? []).length;
  const commaRate = sentences.length > 0 ? commaCount / sentences.length : 0;
  if (commaRate > 3) habits.push('Heavy comma usage (complex sentences)');
  else if (commaRate < 0.5 && sentences.length > 5) habits.push('Minimal comma usage (simple sentences)');

  // Colon usage
  const colonCount = (text.match(/(?<!\d):\s/g) ?? []).length;
  if (colonCount >= 2) habits.push('Colon user (list/explanation style)');

  return habits;
}

// ============================================================================
// DISTINCTIVENESS SCORING
// ============================================================================

function computeDistinctiveness(
  signaturePhrases: string[],
  structures: IdiolectProfile['preferredStructures'],
  characteristicWords: string[],
  punctuationHabits: string[]
): number {
  let score = 0;

  // Signature phrases (0-0.3)
  score += Math.min(0.3, signaturePhrases.length * 0.06);

  // Non-default sentence structures (0-0.25)
  // Deviation from "default" structure (50% subject-first, 10% intro, 5% fragment)
  const structuralDeviation =
    Math.abs(structures.subjectFirstRatio - 0.5) +
    Math.abs(structures.introClauseRatio - 0.1) +
    Math.abs(structures.fragmentRatio - 0.05) * 2 +
    Math.abs(structures.questionRatio - 0.05) * 2;
  score += Math.min(0.25, structuralDeviation * 0.3);

  // Characteristic words (0-0.2)
  score += Math.min(0.2, characteristicWords.length * 0.03);

  // Distinctive punctuation (0-0.25)
  score += Math.min(0.25, punctuationHabits.length * 0.05);

  return clamp(score, 0, 1);
}

// ============================================================================
// HELPERS
// ============================================================================

function createMinimalProfile(): IdiolectProfile {
  return {
    signaturePhrases: [],
    preferredStructures: {
      subjectFirstRatio: 0,
      introClauseRatio: 0,
      compoundComplexRatio: 0,
      fragmentRatio: 0,
      questionRatio: 0,
    },
    characteristicWords: [],
    punctuationHabits: [],
    distinctiveness: 0,
  };
}
