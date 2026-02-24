/**
 * Register & Formality Analyzer
 *
 * Classifies the register of writing on a spectrum:
 *   casual <-> conversational <-> semi-formal <-> academic <-> literary
 *
 * Detects register inconsistencies within a single essay (jarring tone shifts)
 * and provides per-sentence formality tracking.
 *
 * Performance: < 5ms for a 650-word essay.
 * Dependencies: zero external.
 */

import type { RegisterAnalysis } from './types';
import {
  FORMAL_MARKERS,
  CASUAL_MARKERS,
  COLLOQUIALISMS,
  LATINATE_SUFFIXES,
  SUBORDINATE_CLAUSE_MARKERS,
} from './constants';
import {
  tokenize,
  splitSentences,
  countSyllables,
  mean,
  stdDev,
  clamp,
} from './textUtils';

// ============================================================================
// MAIN REGISTER ANALYSIS
// ============================================================================

/**
 * Perform complete register analysis on a text.
 *
 * @param text - Raw text to analyze
 * @returns RegisterAnalysis with classification, consistency, and shifts
 */
export function analyzeRegister(text: string): RegisterAnalysis {
  const sentences = splitSentences(text);
  const words = tokenize(text);
  const wordCount = words.length;

  if (wordCount < 20 || sentences.length < 2) {
    return createMinimalResult();
  }

  // Compute per-sentence formality scores
  const sentenceFormalityScores = sentences.map(s => computeSentenceFormality(s));

  // Overall formality score
  const formalityScore = mean(sentenceFormalityScores);

  // Classify primary register
  const primaryRegister = classifyRegister(formalityScore, text, words);

  // Detect register shifts
  const registerShifts = detectRegisterShifts(sentences, sentenceFormalityScores);

  // Internal consistency (low std dev of per-sentence formality = more consistent)
  const formalityStdDev = stdDev(sentenceFormalityScores);
  const internalConsistency = clamp(1 - formalityStdDev * 2, 0, 1);

  // Compute factor breakdown
  const factors = computeFactors(text, words, wordCount, sentences);

  return {
    primaryRegister,
    formalityScore: Math.round(formalityScore * 100) / 100,
    internalConsistency: Math.round(internalConsistency * 100) / 100,
    registerShifts,
    factors,
  };
}

// ============================================================================
// PER-SENTENCE FORMALITY
// ============================================================================

/**
 * Compute a formality score for a single sentence (0 = casual, 1 = formal).
 */
function computeSentenceFormality(sentence: string): number {
  const lowerSentence = sentence.toLowerCase();
  const words = tokenize(sentence);
  if (words.length === 0) return 0.5;

  let score = 0.5; // Start at neutral

  // Contraction presence (casual)
  const hasContraction = /\w+'\w+/.test(sentence);
  if (hasContraction) score -= 0.08;

  // Formal markers
  for (const marker of FORMAL_MARKERS) {
    if (lowerSentence.includes(marker.toLowerCase())) {
      score += 0.12;
      break; // One is enough signal per sentence
    }
  }

  // Casual markers
  for (const marker of CASUAL_MARKERS) {
    if (lowerSentence.includes(marker.toLowerCase())) {
      score -= 0.1;
      break;
    }
  }

  // Colloquialisms
  for (const c of COLLOQUIALISMS) {
    if (lowerSentence.includes(c.toLowerCase())) {
      score -= 0.12;
      break;
    }
  }

  // Sentence starting with conjunction (casual)
  if (/^(and|but|or|so)\b/i.test(sentence.trim())) {
    score -= 0.06;
  }

  // Exclamation mark (casual/emphatic)
  if (sentence.includes('!')) score -= 0.05;

  // Question mark (can be either, slight casual lean in essays)
  if (sentence.includes('?')) score -= 0.03;

  // Subordinate clause presence (formal/academic)
  for (const marker of SUBORDINATE_CLAUSE_MARKERS) {
    if (lowerSentence.includes(marker)) {
      score += 0.05;
      break;
    }
  }

  // Sentence length: very short (< 5 words) tends casual, very long (> 30) tends formal
  if (words.length <= 4) score -= 0.06;
  else if (words.length >= 30) score += 0.06;

  // Average syllable count per word (higher = more formal/academic)
  const avgSyllables = mean(words.map(w => countSyllables(w)));
  if (avgSyllables > 2.0) score += 0.08;
  else if (avgSyllables < 1.3) score -= 0.05;

  // Latinate words (formal)
  const latinateCount = words.filter(w =>
    LATINATE_SUFFIXES.some(s => w.endsWith(s))
  ).length;
  if (latinateCount / words.length > 0.15) score += 0.08;

  return clamp(score, 0, 1);
}

// ============================================================================
// REGISTER CLASSIFICATION
// ============================================================================

function classifyRegister(
  formalityScore: number,
  text: string,
  words: string[]
): RegisterAnalysis['primaryRegister'] {
  // Check for literary register (metaphors, imagery, unusual structure)
  const literaryMarkers = [
    /\blike\s+(?:a|the|an)\s+\w+/i,  // Simile
    /\bas\s+(?:if|though)\b/i,       // Comparison
    /\bmetaphor/i,
  ];
  const hasLiteraryDevices = literaryMarkers.some(p => p.test(text));

  // Check for very short emphatic sentences (literary technique)
  const sentences = splitSentences(text);
  const shortSentenceRatio = sentences.filter(s =>
    s.trim().split(/\s+/).length <= 3
  ).length / Math.max(sentences.length, 1);

  if (formalityScore > 0.7 && hasLiteraryDevices && shortSentenceRatio > 0.1) {
    return 'literary';
  }

  if (formalityScore >= 0.7) return 'academic';
  if (formalityScore >= 0.5) return 'semi-formal';
  if (formalityScore >= 0.35) return 'conversational';
  return 'casual';
}

// ============================================================================
// REGISTER SHIFT DETECTION
// ============================================================================

function detectRegisterShifts(
  sentences: string[],
  formalityScores: number[]
): RegisterAnalysis['registerShifts'] {
  const shifts: RegisterAnalysis['registerShifts'] = [];

  for (let i = 1; i < formalityScores.length; i++) {
    const prev = formalityScores[i - 1];
    const curr = formalityScores[i];
    const delta = Math.abs(curr - prev);

    if (delta < 0.15) continue; // Not significant

    const severity: 'subtle' | 'noticeable' | 'jarring' =
      delta > 0.35 ? 'jarring' :
      delta > 0.25 ? 'noticeable' :
      'subtle';

    const fromRegister = scoreToLabel(prev);
    const toRegister = scoreToLabel(curr);

    // Only report if labels actually differ
    if (fromRegister !== toRegister) {
      shifts.push({
        sentenceIndex: i,
        text: sentences[i].substring(0, 100) + (sentences[i].length > 100 ? '...' : ''),
        from: fromRegister,
        to: toRegister,
        severity,
      });
    }
  }

  // Return only the top 5 most jarring shifts
  const severityOrder = { jarring: 0, noticeable: 1, subtle: 2 };
  return shifts
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 5);
}

function scoreToLabel(score: number): string {
  if (score >= 0.7) return 'academic/formal';
  if (score >= 0.5) return 'semi-formal';
  if (score >= 0.35) return 'conversational';
  return 'casual';
}

// ============================================================================
// FACTOR BREAKDOWN
// ============================================================================

function computeFactors(
  text: string,
  words: string[],
  wordCount: number,
  sentences: string[]
): RegisterAnalysis['factors'] {
  const lowerText = text.toLowerCase();

  // Pronoun usage
  const firstPersonPronouns = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our'];
  const thirdPersonPronouns = ['he', 'him', 'his', 'she', 'her', 'they', 'them', 'their'];
  const impersonalPronouns = ['one', 'it', 'this', 'that', 'these', 'those'];

  let firstPerson = 0, thirdPerson = 0, impersonal = 0;
  for (const word of words) {
    if (firstPersonPronouns.includes(word)) firstPerson++;
    else if (thirdPersonPronouns.includes(word)) thirdPerson++;
    else if (impersonalPronouns.includes(word)) impersonal++;
  }

  // Contraction frequency
  const contractionPattern = /\w+'\w+/g;
  const contractionCount = (text.match(contractionPattern) ?? []).length;
  const contractionFrequency = wordCount > 0
    ? Math.round((contractionCount / wordCount) * 1000) / 1000
    : 0;

  // Colloquialism density
  let colloquialismCount = 0;
  for (const c of COLLOQUIALISMS) {
    const regex = new RegExp(`\\b${escapeRegex(c)}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) colloquialismCount += matches.length;
  }
  const colloquialismDensity = wordCount > 0
    ? Math.round((colloquialismCount / wordCount) * 1000 * 100) / 100
    : 0;

  // Latinate word ratio
  let latinateCount = 0;
  for (const word of words) {
    if (word.length > 3 && LATINATE_SUFFIXES.some(s => word.endsWith(s))) {
      latinateCount++;
    }
  }
  const latinateWordRatio = wordCount > 0
    ? Math.round((latinateCount / wordCount) * 100) / 100
    : 0;

  // Subordinate clause rate
  let subordinateCount = 0;
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    for (const marker of SUBORDINATE_CLAUSE_MARKERS) {
      if (lowerSentence.includes(marker)) {
        subordinateCount++;
        break;
      }
    }
  }
  const subordinateClauseRate = sentences.length > 0
    ? Math.round((subordinateCount / sentences.length) * 100) / 100
    : 0;

  return {
    pronounUsage: { firstPerson, thirdPerson, impersonal },
    contractionFrequency,
    colloquialismDensity,
    latinateWordRatio,
    subordinateClauseRate,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createMinimalResult(): RegisterAnalysis {
  return {
    primaryRegister: 'conversational',
    formalityScore: 0.5,
    internalConsistency: 1,
    registerShifts: [],
    factors: {
      pronounUsage: { firstPerson: 0, thirdPerson: 0, impersonal: 0 },
      contractionFrequency: 0,
      colloquialismDensity: 0,
      latinateWordRatio: 0,
      subordinateClauseRate: 0,
    },
  };
}
