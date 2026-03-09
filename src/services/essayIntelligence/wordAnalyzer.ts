/**
 * Word Analyzer — Deterministic Word/Phrase Flagging (Layer 1)
 *
 * Sparse flagging of words and phrases with character offsets.
 * All analysis is deterministic (no LLM calls). Target: <50ms for 650-word essay.
 *
 * Imports shared word lists from featureExtractor to avoid duplication.
 */

import type { WordAnnotation, WordFlag, WordFlagCategory } from './types';
import { SENSORY_WORDS, CLICHES, FILLER_PHRASES } from '../../workshop/scoring/featureExtractor';

// ============================================================================
// WORD LISTS (unique to word-level flagging)
// ============================================================================

export const WEAK_VERBS = new Set([
  'made', 'got', 'went', 'said', 'did', 'had', 'was', 'were', 'been',
  'came', 'put', 'took', 'gave', 'told', 'let', 'kept', 'left',
  'seemed', 'looked', 'felt', 'appeared', 'became', 'tried',
]);

const WEAK_VERB_ALTERNATIVES: Record<string, string> = {
  made: 'crafted, forged, built',
  got: 'obtained, earned, received',
  went: 'traveled, ventured, headed',
  said: 'stated, declared, exclaimed',
  did: 'accomplished, executed, performed',
  had: 'possessed, held, carried',
  was: 'existed as, stood as, remained',
  were: 'existed as, stood as, remained',
  came: 'arrived, emerged, appeared',
  put: 'placed, positioned, set',
  took: 'seized, grasped, claimed',
  gave: 'offered, provided, bestowed',
  told: 'informed, revealed, confided',
  seemed: 'appeared, suggested, hinted',
  looked: 'gazed, peered, examined',
  felt: 'sensed, experienced, perceived',
};

export const GENERIC_ADJECTIVES = new Set([
  'good', 'bad', 'nice', 'great', 'big', 'small', 'important',
  'interesting', 'amazing', 'wonderful', 'terrible', 'awesome',
  'beautiful', 'lovely', 'fine', 'cool', 'perfect', 'best', 'worst',
  'huge', 'little', 'pretty', 'special',
]);

const GENERIC_ADJECTIVE_ALTERNATIVES: Record<string, string> = {
  good: 'effective, compelling, skillful',
  bad: 'detrimental, flawed, inadequate',
  nice: 'pleasant, gracious, considerate',
  great: 'remarkable, exceptional, significant',
  big: 'substantial, expansive, monumental',
  small: 'subtle, modest, diminutive',
  important: 'critical, pivotal, essential',
  interesting: 'captivating, provocative, stimulating',
  amazing: 'extraordinary, astonishing, striking',
  wonderful: 'exceptional, magnificent, splendid',
  terrible: 'devastating, appalling, dreadful',
  awesome: 'impressive, formidable, inspiring',
};

export const INTENSIFIERS = new Set([
  'very', 'really', 'extremely', 'absolutely', 'totally', 'completely',
  'incredibly', 'truly', 'utterly', 'quite', 'rather', 'so',
  'definitely', 'certainly', 'basically', 'literally', 'essentially',
]);

export const HEDGES = new Set([
  'kind of', 'sort of', 'somewhat', 'maybe', 'perhaps', 'possibly',
  'might', 'could be', 'in a way', 'to some extent', 'a little',
  'a bit', 'slightly', 'fairly', 'rather', 'more or less',
]);

/** Multi-word phrases that should be checked before single words */
const MULTI_WORD_HEDGES = Array.from(HEDGES).filter(h => h.includes(' '));

// ============================================================================
// SIGNATURE/STRONG WORD DETECTION
// ============================================================================

const VIVID_VERBS = new Set([
  'shattered', 'carved', 'ignited', 'whispered', 'thundered', 'crumbled',
  'bloomed', 'pierced', 'erupted', 'trembled', 'soared', 'plunged',
  'wrestled', 'wove', 'blazed', 'etched', 'kindled', 'unraveled',
  'galvanized', 'fractured', 'cascaded', 'surged', 'anchored', 'crystallized',
  'reverberated', 'simmered', 'flickered', 'jolted', 'grappled', 'fused',
]);

const PRECISE_NOUNS = new Set([
  'fracture', 'threshold', 'catalyst', 'undercurrent', 'cornerstone',
  'ember', 'crossroads', 'mosaic', 'scaffold', 'prism', 'compass',
  'anchor', 'blueprint', 'ripple', 'silhouette', 'labyrinth',
]);

// ============================================================================
// WORD ANALYZER CLASS
// ============================================================================

class WordAnalyzer {
  /**
   * Analyze a sentence and return sparse word/phrase annotations with character offsets.
   */
  analyzeWords(sentence: string): WordAnnotation[] {
    const annotations: WordAnnotation[] = [];
    const lowerSentence = sentence.toLowerCase();

    // Phase 1: Multi-word phrase detection (cliches, filler, hedges)
    this.detectPhrases(sentence, lowerSentence, annotations);

    // Phase 2: Single-word detection
    this.detectSingleWords(sentence, lowerSentence, annotations);

    // Deduplicate: if a word is part of a multi-word annotation, skip standalone
    return this.deduplicateAnnotations(annotations);
  }

  // --------------------------------------------------------------------------
  // PHRASE DETECTION
  // --------------------------------------------------------------------------

  private detectPhrases(
    sentence: string,
    lowerSentence: string,
    annotations: WordAnnotation[],
  ): void {
    // Cliches
    for (const cliche of CLICHES) {
      const idx = lowerSentence.indexOf(cliche);
      if (idx !== -1) {
        annotations.push(this.buildAnnotation(
          sentence.slice(idx, idx + cliche.length),
          idx,
          idx + cliche.length,
          'cliche',
          -1,
          'Replace with original phrasing',
        ));
      }
    }

    // Filler phrases
    for (const filler of FILLER_PHRASES) {
      const idx = lowerSentence.indexOf(filler);
      if (idx !== -1) {
        annotations.push(this.buildAnnotation(
          sentence.slice(idx, idx + filler.length),
          idx,
          idx + filler.length,
          'filler',
          -0.5,
          'Remove or simplify',
        ));
      }
    }

    // Multi-word hedges
    for (const hedge of MULTI_WORD_HEDGES) {
      const idx = lowerSentence.indexOf(hedge);
      if (idx !== -1) {
        annotations.push(this.buildAnnotation(
          sentence.slice(idx, idx + hedge.length),
          idx,
          idx + hedge.length,
          'hedge',
          -0.5,
          'State directly without hedging',
        ));
      }
    }
  }

  // --------------------------------------------------------------------------
  // SINGLE WORD DETECTION
  // --------------------------------------------------------------------------

  private detectSingleWords(
    sentence: string,
    lowerSentence: string,
    annotations: WordAnnotation[],
  ): void {
    // Use regex to find word boundaries for accurate offsets
    const wordPattern = /[a-zA-Z'-]+/g;
    let match: RegExpExecArray | null;

    while ((match = wordPattern.exec(sentence)) !== null) {
      const word = match[0];
      const lowerWord = word.toLowerCase();
      const startOffset = match.index;
      const endOffset = startOffset + word.length;

      // Weak verbs
      if (WEAK_VERBS.has(lowerWord)) {
        const alt = WEAK_VERB_ALTERNATIVES[lowerWord] ?? 'Use a more specific verb';
        annotations.push(this.buildAnnotation(word, startOffset, endOffset, 'weak_verb', -0.5, alt));
        continue;
      }

      // Generic adjectives
      if (GENERIC_ADJECTIVES.has(lowerWord)) {
        const alt = GENERIC_ADJECTIVE_ALTERNATIVES[lowerWord] ?? 'Use a more specific adjective';
        annotations.push(this.buildAnnotation(word, startOffset, endOffset, 'generic_adjective', -0.5, alt));
        continue;
      }

      // Intensifiers
      if (INTENSIFIERS.has(lowerWord)) {
        annotations.push(this.buildAnnotation(word, startOffset, endOffset, 'intensifier', -0.5, 'Remove — let the noun/verb carry the weight'));
        continue;
      }

      // Single-word hedges (not already caught as multi-word)
      if (HEDGES.has(lowerWord)) {
        annotations.push(this.buildAnnotation(word, startOffset, endOffset, 'hedge', -0.5, 'State directly without hedging'));
        continue;
      }

      // Sensory words (positive flag)
      if (SENSORY_WORDS.has(lowerWord)) {
        annotations.push(this.buildAnnotation(word, startOffset, endOffset, 'sensory', 1, null));
        continue;
      }

      // Signature words (vivid verbs, precise nouns)
      if (VIVID_VERBS.has(lowerWord) || PRECISE_NOUNS.has(lowerWord)) {
        annotations.push(this.buildAnnotation(word, startOffset, endOffset, 'signature', 1, null));
      }
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private buildAnnotation(
    word: string,
    startOffset: number,
    endOffset: number,
    category: WordFlagCategory,
    strength: number,
    alternative: string | null,
  ): WordAnnotation {
    const flag: WordFlag = { word, category, strength, alternative };
    return {
      word,
      startOffset,
      endOffset,
      flags: [flag],
      agreedImprovement: null,
    };
  }

  /**
   * Remove single-word annotations that overlap with multi-word phrase annotations.
   * Merge flags when the same word span has multiple flags.
   */
  private deduplicateAnnotations(annotations: WordAnnotation[]): WordAnnotation[] {
    // Sort multi-word first (longer spans first)
    annotations.sort((a, b) => (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset));

    const result: WordAnnotation[] = [];
    const coveredRanges: Array<{ start: number; end: number }> = [];

    for (const ann of annotations) {
      const isOverlapping = coveredRanges.some(
        range => ann.startOffset >= range.start && ann.endOffset <= range.end,
      );

      if (!isOverlapping) {
        // Check if there's an existing annotation at the same offsets to merge flags
        const existing = result.find(
          r => r.startOffset === ann.startOffset && r.endOffset === ann.endOffset,
        );
        if (existing) {
          existing.flags.push(...ann.flags);
        } else {
          result.push(ann);
          coveredRanges.push({ start: ann.startOffset, end: ann.endOffset });
        }
      }
    }

    // Sort by offset for output consistency
    return result.sort((a, b) => a.startOffset - b.startOffset);
  }
}

/** Singleton word analyzer */
export const wordAnalyzer = new WordAnalyzer();
export { WordAnalyzer };
