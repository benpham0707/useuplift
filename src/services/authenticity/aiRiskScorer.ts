/**
 * AI Risk Scorer
 *
 * Pure heuristic scorer — NO LLM calls, < 50ms.
 * Evaluates text for AI-generated writing patterns using 7 signal metrics.
 *
 * Signals:
 * 1. vocabularyUniformity - Chunk-level unique word ratio consistency
 * 2. sentenceLengthVariance - Low variance = AI-like
 * 3. genericReflectionDensity - "I learned that..." patterns
 * 4. bannedTermCount - AI-typical vocabulary
 * 5. clicheDensity - Overused essay clichés
 * 6. hedgingDensity - Hedging/weasel words
 * 7. adverbDensity - Excessive -ly adverbs
 * 8. firstPersonDensity - Stored in metrics but not in overallRisk
 */

import type { AIRiskAssessment } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** AI-typical terms that rarely appear in authentic student writing */
const AI_BANNED_TERMS = [
  'delve', 'tapestry', 'beacon', 'furthermore', 'moreover', 'in conclusion',
  'testament to', 'embark', 'foster', 'leverage', 'utilize', 'paradigm',
  'multifaceted', 'holistic', 'synergy', 'nuanced', 'underscore',
  'landscape', 'navigate', 'transformative',
];

/** Generic reflection phrases common in AI output */
const GENERIC_REFLECTIONS = [
  'i learned that', 'this experience taught me', 'i realized',
  'it made me understand', 'this helped me grow', 'i came to see',
  'looking back', 'in hindsight',
];

/** Overused essay clichés */
const CLICHE_PHRASES = [
  'pushed my boundaries', 'stepping out of my comfort zone',
  'opened my eyes', 'changed my perspective', 'broadened my horizons',
  'made me who i am', 'i am passionate about', 'ever since i was young',
  'from a young age', 'my whole life',
];

/** Hedging/weasel words */
const HEDGING_PHRASES = [
  'somewhat', 'perhaps', 'in some ways', 'to some extent',
  'arguably', 'it could be said', 'one might say', 'it seems that',
];

/** Common -ly words that are NOT adverb red flags */
const ADVERB_EXCEPTIONS = new Set([
  'family', 'only', 'early', 'daily', 'really', 'actually',
  'likely', 'lonely', 'friendly', 'lovely', 'ugly', 'holy',
  'rely', 'supply', 'apply', 'july', 'ally', 'belly', 'bully',
  'fly', 'reply', 'rally', 'jelly', 'tally',
]);

// ============================================================================
// HELPERS
// ============================================================================

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function getWords(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/** Count occurrences of a phrase in text (case-insensitive) */
function countPhrase(text: string, phrase: string): number {
  const regex = new RegExp(escapeRegex(phrase), 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Clamp a value to 0-100 */
function clamp100(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

/** Compute variance of a number array */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
}

// ============================================================================
// SERVICE
// ============================================================================

export class AIRiskScorer {

  /**
   * Assess AI risk for a text. Pure heuristic, < 50ms.
   */
  assessRisk(text: string): AIRiskAssessment {
    const lowerText = text.toLowerCase();
    const sentences = splitSentences(text);
    const totalWords = countWords(text);
    const sentenceCount = sentences.length;

    if (totalWords < 10 || sentenceCount < 2) {
      return this.createMinimalAssessment();
    }

    // 1. Vocabulary Uniformity
    const vocabularyUniformity = this.scoreVocabularyUniformity(text);

    // 2. Sentence Length Variance
    const sentenceLengthVariance = this.scoreSentenceLengthVariance(sentences);

    // 3. Generic Reflection Density
    const genericReflectionDensity = this.scoreGenericReflections(lowerText, sentenceCount);

    // 4. Banned Term Count
    const bannedTermCount = this.scoreBannedTerms(lowerText);

    // 5. Cliché Density
    const clicheDensity = this.scoreClicheDensity(lowerText, totalWords);

    // 6. Hedging Density
    const hedgingDensity = this.scoreHedgingDensity(lowerText, sentenceCount);

    // 7. Adverb Density
    const adverbDensity = this.scoreAdverbDensity(text, totalWords);

    // 8. First Person Density (metric only, not in overallRisk)
    const firstPersonDensity = this.scoreFirstPersonDensity(lowerText, totalWords);

    // Overall risk (weighted average, excludes firstPersonDensity)
    const overallRisk = clamp100(
      vocabularyUniformity * 0.15 +
      sentenceLengthVariance * 0.15 +
      genericReflectionDensity * 0.20 +
      bannedTermCount * 0.15 +
      clicheDensity * 0.15 +
      hedgingDensity * 0.10 +
      adverbDensity * 0.10
    );

    const riskLevel: AIRiskAssessment['riskLevel'] =
      overallRisk < 30 ? 'low' :
      overallRisk <= 60 ? 'medium' : 'high';

    // Build flagged passages
    const flaggedPassages = this.buildFlaggedPassages(
      sentences,
      lowerText,
      { vocabularyUniformity, sentenceLengthVariance, genericReflectionDensity, bannedTermCount, clicheDensity, hedgingDensity, adverbDensity }
    );

    return {
      overallRisk,
      riskLevel,
      flaggedPassages,
      metrics: {
        vocabularyUniformity,
        sentenceLengthVariance,
        genericReflectionDensity,
        bannedTermCount,
        clicheDensity,
        hedgingDensity,
        adverbDensity,
        firstPersonDensity,
      },
    };
  }

  // ============================================================================
  // SIGNAL SCORERS (each returns 0-100, higher = more AI-like)
  // ============================================================================

  private scoreVocabularyUniformity(text: string): number {
    const words = getWords(text.toLowerCase().replace(/[^a-z\s]/g, ''));
    if (words.length < 50) return 0; // Not enough text

    // Split into ~50-word chunks
    const chunkSize = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      if (chunk.length >= 20) chunks.push(chunk); // Ignore tiny trailing chunks
    }

    if (chunks.length < 2) return 0;

    // Compute unique word ratio per chunk
    const ratios = chunks.map(chunk => new Set(chunk).size / chunk.length);

    // Very consistent ratios across chunks = AI-like
    const ratioVariance = variance(ratios);

    // Low variance → high score. Typical human variance is 0.01-0.05
    // AI-like variance is < 0.005
    if (ratioVariance < 0.002) return 90;
    if (ratioVariance < 0.005) return 70;
    if (ratioVariance < 0.01) return 50;
    if (ratioVariance < 0.02) return 30;
    if (ratioVariance < 0.04) return 15;
    return 0;
  }

  private scoreSentenceLengthVariance(sentences: string[]): number {
    if (sentences.length < 3) return 0;

    const lengths = sentences.map(s => countWords(s));
    const v = variance(lengths);

    // Very low variance = AI-like (AI tends to produce uniform sentence lengths)
    // Typical human writing has variance 30-100+
    if (v < 5) return 90;
    if (v < 10) return 70;
    if (v < 20) return 50;
    if (v < 35) return 30;
    if (v < 60) return 15;
    return 0;
  }

  private scoreGenericReflections(lowerText: string, sentenceCount: number): number {
    if (sentenceCount === 0) return 0;

    let totalCount = 0;
    for (const phrase of GENERIC_REFLECTIONS) {
      totalCount += countPhrase(lowerText, phrase);
    }

    const density = totalCount / sentenceCount;

    // More than 1 reflection per 3 sentences = very AI-like
    if (density > 0.4) return 95;
    if (density > 0.25) return 75;
    if (density > 0.15) return 55;
    if (density > 0.08) return 35;
    if (density > 0.03) return 15;
    return 0;
  }

  private scoreBannedTerms(lowerText: string): number {
    let totalCount = 0;
    for (const term of AI_BANNED_TERMS) {
      totalCount += countPhrase(lowerText, term);
    }

    // Even 1-2 banned terms is a signal
    if (totalCount >= 5) return 95;
    if (totalCount >= 3) return 75;
    if (totalCount >= 2) return 55;
    if (totalCount >= 1) return 35;
    return 0;
  }

  private scoreClicheDensity(lowerText: string, totalWords: number): number {
    if (totalWords === 0) return 0;

    let totalCount = 0;
    for (const phrase of CLICHE_PHRASES) {
      totalCount += countPhrase(lowerText, phrase);
    }

    // Normalize by word count (per 100 words)
    const per100 = (totalCount / totalWords) * 100;

    if (per100 > 2) return 90;
    if (per100 > 1) return 70;
    if (per100 > 0.5) return 50;
    if (per100 > 0.2) return 25;
    return 0;
  }

  private scoreHedgingDensity(lowerText: string, sentenceCount: number): number {
    if (sentenceCount === 0) return 0;

    let totalCount = 0;
    for (const phrase of HEDGING_PHRASES) {
      totalCount += countPhrase(lowerText, phrase);
    }

    const density = totalCount / sentenceCount;

    if (density > 0.3) return 90;
    if (density > 0.2) return 70;
    if (density > 0.1) return 45;
    if (density > 0.05) return 20;
    return 0;
  }

  private scoreAdverbDensity(text: string, totalWords: number): number {
    if (totalWords === 0) return 0;

    const words = getWords(text.toLowerCase().replace(/[^a-z\s]/g, ''));
    const adverbs = words.filter(w =>
      w.endsWith('ly') &&
      w.length > 3 &&
      !ADVERB_EXCEPTIONS.has(w)
    );

    const ratio = adverbs.length / totalWords;

    // > 5% adverbs = very AI-like
    if (ratio > 0.05) return 90;
    if (ratio > 0.035) return 65;
    if (ratio > 0.02) return 40;
    if (ratio > 0.01) return 15;
    return 0;
  }

  private scoreFirstPersonDensity(lowerText: string, totalWords: number): number {
    if (totalWords === 0) return 0;

    // Count "I" and "my" with word boundaries
    const iCount = (lowerText.match(/\bi\b/g) || []).length;
    const myCount = (lowerText.match(/\bmy\b/g) || []).length;
    const total = iCount + myCount;

    const ratio = total / totalWords;

    // Normal range for personal essays: 3-8%
    // Very low or very high → less natural
    if (ratio < 0.01) return 60; // Suspiciously impersonal
    if (ratio < 0.03) return 30;
    if (ratio > 0.12) return 50; // Overly self-referential
    if (ratio > 0.08) return 20;
    return 0; // Normal range
  }

  // ============================================================================
  // FLAGGED PASSAGES
  // ============================================================================

  private buildFlaggedPassages(
    sentences: string[],
    lowerText: string,
    metrics: Record<string, number>
  ): AIRiskAssessment['flaggedPassages'] {
    const flagged: AIRiskAssessment['flaggedPassages'] = [];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const reasons: string[] = [];
      let maxRisk = 0;

      // Check generic reflections
      for (const phrase of GENERIC_REFLECTIONS) {
        if (lowerSentence.includes(phrase)) {
          reasons.push(`Generic reflection: "${phrase}"`);
          maxRisk = Math.max(maxRisk, 70);
        }
      }

      // Check banned terms
      for (const term of AI_BANNED_TERMS) {
        if (lowerSentence.includes(term)) {
          reasons.push(`AI-typical term: "${term}"`);
          maxRisk = Math.max(maxRisk, 65);
        }
      }

      // Check clichés
      for (const phrase of CLICHE_PHRASES) {
        if (lowerSentence.includes(phrase)) {
          reasons.push(`Cliché: "${phrase}"`);
          maxRisk = Math.max(maxRisk, 55);
        }
      }

      // Check hedging
      for (const phrase of HEDGING_PHRASES) {
        if (lowerSentence.includes(phrase)) {
          reasons.push(`Hedging language: "${phrase}"`);
          maxRisk = Math.max(maxRisk, 45);
        }
      }

      if (reasons.length > 0) {
        flagged.push({
          text: sentence.trim(),
          risk: maxRisk,
          reason: reasons.join('; '),
          suggestion: this.getSuggestionForReasons(reasons),
        });
      }
    }

    // Sort by risk (highest first), limit to top 5
    return flagged
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);
  }

  private getSuggestionForReasons(reasons: string[]): string {
    const combined = reasons.join(' ').toLowerCase();

    if (combined.includes('generic reflection')) {
      return 'Replace with a specific, concrete observation unique to your experience';
    }
    if (combined.includes('ai-typical')) {
      return 'Use simpler, more natural word choices that sound like you';
    }
    if (combined.includes('cliché')) {
      return 'Replace with a specific detail or moment that only you experienced';
    }
    if (combined.includes('hedging')) {
      return 'State your point directly — commit to your perspective';
    }
    return 'Rewrite in your own authentic voice with specific details';
  }

  // ============================================================================
  // MINIMAL ASSESSMENT
  // ============================================================================

  private createMinimalAssessment(): AIRiskAssessment {
    return {
      overallRisk: 0,
      riskLevel: 'low',
      flaggedPassages: [],
      metrics: {
        vocabularyUniformity: 0,
        sentenceLengthVariance: 0,
        genericReflectionDensity: 0,
        bannedTermCount: 0,
        clicheDensity: 0,
        hedgingDensity: 0,
        adverbDensity: 0,
        firstPersonDensity: 0,
      },
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const aiRiskScorer = new AIRiskScorer();
