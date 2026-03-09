/**
 * Craft Features — Deterministic Text Metrics
 *
 * ONLY extracts features that are genuinely mechanical/countable.
 * Anything requiring judgment (opening type, emotional arc, metaphor detection,
 * voice consistency, transition "quality", verb "strength") is NOT here —
 * those belong in LLM-scored dimensions.
 *
 * Philosophy: heuristics for counting, LLM for judgment.
 * If a human would disagree with the heuristic >20% of the time, it doesn't belong here.
 *
 * Used by: annotation pipeline (enriched features), dimension scorers
 */

// ============================================================================
// WORD LISTS (only lists used for exact-match counting, not judgment)
// ============================================================================

/** Filler phrases — exact string matches, no judgment needed */
export const FILLER_PHRASES = [
  'in order to',
  'the fact that',
  'it is important to note',
  'it is important to note that',
  'at this point in time',
  'due to the fact that',
  'in the process of',
  'on a daily basis',
  'for all intents and purposes',
  'needless to say',
  'it goes without saying',
  'as a matter of fact',
  'at the end of the day',
  'by and large',
  'first and foremost',
  'last but not least',
  'it should be noted that',
  'it is worth mentioning',
  'in light of the fact that',
  'for the purpose of',
  'in the event that',
  'on the basis of',
  'as far as i am concerned',
  'to be perfectly honest',
  'in the final analysis',
  'when all is said and done',
  'at the present time',
  'each and every',
  'one and the same',
  'point in time',
  'whether or not',
] as const;

/** Weak adverbs — exact word matches for density counting */
export const WEAK_ADVERBS = new Set([
  'very', 'really', 'quite', 'somewhat', 'rather', 'pretty', 'basically',
  'actually', 'literally', 'totally', 'completely', 'absolutely', 'definitely',
  'certainly', 'obviously', 'clearly', 'simply', 'just', 'honestly',
  'truly', 'extremely', 'incredibly', 'amazingly', 'remarkably', 'particularly',
  'especially', 'essentially', 'fundamentally', 'generally', 'typically',
  'usually', 'normally', 'probably', 'possibly', 'perhaps', 'maybe',
  'slightly', 'hardly', 'barely', 'merely', 'almost', 'nearly',
  'seemingly', 'apparently', 'supposedly', 'allegedly', 'presumably',
  'practically', 'virtually', 'effectively', 'arguably', 'admittedly',
]);

/** To-be verbs — exact match for passive voice / weak verb density */
const TO_BE_VERBS = new Set([
  'am', 'is', 'are', 'was', 'were', 'been', 'being',
]);

/** Common bigrams excluded from redundancy detection (module-level for perf) */
const COMMON_BIGRAMS = new Set([
  'i was', 'i had', 'i am', 'i have', 'i would', 'i could', 'i did', 'i will',
  'it was', 'it is', 'it had', 'there was', 'there were', 'there is',
  'to the', 'in the', 'on the', 'at the', 'of the', 'for the', 'with the',
  'and the', 'and i', 'but i', 'that i', 'to be', 'of my', 'in my',
  'i felt', 'i knew', 'i thought', 'i realized', 'i wanted',
]);

// ============================================================================
// CRAFT FEATURES INTERFACE
// ============================================================================

/**
 * Features that can be reliably extracted via deterministic analysis.
 *
 * Design principle: every field here is either:
 * - A raw count or ratio (no judgment)
 * - A statistical measure (variance, coefficient of variation)
 * - An exact-match detection (filler phrases, to-be verbs)
 *
 * Anything requiring interpretation (opening type, emotional arc,
 * metaphor detection, voice quality, transition quality) is left
 * to LLM-scored dimensions.
 */
export interface CraftFeatures {
  // --- Sentence-level (pure math) ---
  /** Word count per sentence */
  sentenceLengths: number[];
  /** Variance of sentence lengths */
  sentenceLengthVariance: number;
  /** Coefficient of variation of sentence lengths (normalized variance) */
  sentenceLengthCV: number;
  /** % of sentences with unique first words (0-100) */
  sentenceOpeningVariety: number;
  /** Number of very short sentences (<=5 words) */
  shortSentenceCount: number;
  /** Number of very long sentences (>=30 words) */
  longSentenceCount: number;

  // --- Paragraph-level (pure math) ---
  /** Word count per paragraph */
  paragraphLengths: number[];
  /** Coefficient of variation of paragraph lengths */
  paragraphLengthCV: number;

  // --- Exact-match counts ---
  /** Weak adverbs per 100 words */
  weakAdverbDensity: number;
  /** To-be verbs per 100 words */
  toBeVerbDensity: number;
  /** Total filler phrases found */
  fillerPhraseCount: number;
  /** Which filler phrases were found (for feedback) */
  fillerPhrasesFound: string[];

  // --- Pronoun distribution (pure counting) ---
  pronounRatio: {
    firstPerson: number;  // fraction of all pronouns
    secondPerson: number;
    thirdPerson: number;
    totalCount: number;   // raw count
  };

  // --- Dialogue detection (presence, not quality) ---
  /** Number of quoted speech segments found */
  dialogueSegmentCount: number;
  /** Whether any dialogue exists */
  hasDialogue: boolean;

  // --- Repetition detection (statistical, not judgmental) ---
  /** Content bigrams appearing in 3+ different sentences */
  repeatedBigramCount: number;
  /** Content trigrams appearing in 2+ different sentences */
  repeatedTrigramCount: number;
  /** Content words (4+ chars) appearing 4+ times */
  overusedWordCount: number;
  /** The actual overused words (for feedback) */
  overusedWords: string[];

  // --- Raw signals for LLM consumption ---
  /** First sentence of the essay (for LLM to classify opening type) */
  firstSentence: string;
  /** Last sentence of the essay (for LLM to classify closing type) */
  lastSentence: string;
  /** First paragraph text */
  firstParagraph: string;
  /** Last paragraph text */
  lastParagraph: string;
  /** Number count — digits/numbers found in text */
  numberCount: number;
  /** Capitalized non-sentence-starter words (proxy signal, NOT named entity detection) */
  capitalizedWordCount: number;
  /** Question marks found */
  questionCount: number;
  /** Exclamation marks found */
  exclamationCount: number;
}

// ============================================================================
// TEXT SPLITTING (shared utilities)
// ============================================================================

function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end-of-string
  // This is intentionally simple — sentence boundary detection is a hard NLP problem
  // and we'd rather under-split than mis-split on "Dr." or "3.14"
  return text
    .replace(/([.!?]+)\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function splitWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z'\s-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

function computeCV(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

function countSentenceOpeningVariety(sentences: string[]): number {
  if (sentences.length === 0) return 0;
  const firstWords = sentences
    .map(s => splitWords(s)[0] || '')
    .filter(w => w.length > 0);
  if (firstWords.length === 0) return 0;
  return Math.round((new Set(firstWords).size / firstWords.length) * 100);
}

function countWeakAdverbs(words: string[]): number {
  let count = 0;
  for (const w of words) {
    if (WEAK_ADVERBS.has(w)) count++;
  }
  return count;
}

function countToBeVerbs(words: string[]): number {
  let count = 0;
  for (const w of words) {
    if (TO_BE_VERBS.has(w)) count++;
  }
  return count;
}

function countFillerPhrases(lowerText: string): { count: number; found: string[] } {
  const found: string[] = [];
  let count = 0;
  for (const phrase of FILLER_PHRASES) {
    let idx = 0;
    while ((idx = lowerText.indexOf(phrase, idx)) !== -1) {
      count++;
      if (!found.includes(phrase)) found.push(phrase);
      idx += phrase.length;
    }
  }
  return { count, found };
}

function countPronouns(words: string[]): CraftFeatures['pronounRatio'] {
  const first = new Set(['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']);
  const second = new Set(['you', 'your', 'yours', 'yourself', 'yourselves']);
  const third = new Set(['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'they', 'them', 'their', 'theirs', 'themselves', 'it', 'its', 'itself']);

  let firstCount = 0, secondCount = 0, thirdCount = 0;
  for (const w of words) {
    if (first.has(w)) firstCount++;
    else if (second.has(w)) secondCount++;
    else if (third.has(w)) thirdCount++;
  }

  const total = firstCount + secondCount + thirdCount;
  if (total === 0) return { firstPerson: 0, secondPerson: 0, thirdPerson: 0, totalCount: 0 };

  return {
    firstPerson: Math.round((firstCount / total) * 100) / 100,
    secondPerson: Math.round((secondCount / total) * 100) / 100,
    thirdPerson: Math.round((thirdCount / total) * 100) / 100,
    totalCount: total,
  };
}

function countDialogueSegments(text: string): number {
  const matches = text.match(/[""\u201C]([^""\u201C\u201D]+)[""\u201D]/g);
  return matches ? matches.length : 0;
}

function detectRepetition(sentences: string[]): {
  repeatedBigrams: number;
  repeatedTrigrams: number;
  overusedCount: number;
  overusedWords: string[];
} {
  if (sentences.length <= 2) {
    return { repeatedBigrams: 0, repeatedTrigrams: 0, overusedCount: 0, overusedWords: [] };
  }

  const bigramCounts = new Map<string, number>();
  const trigramCounts = new Map<string, number>();

  for (const sentence of sentences) {
    const words = splitWords(sentence);
    const seenBigrams = new Set<string>();
    const seenTrigrams = new Set<string>();

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!COMMON_BIGRAMS.has(bigram) && !seenBigrams.has(bigram)) {
        seenBigrams.add(bigram);
        bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
      }
      if (i < words.length - 2) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (!seenTrigrams.has(trigram)) {
          seenTrigrams.add(trigram);
          trigramCounts.set(trigram, (trigramCounts.get(trigram) || 0) + 1);
        }
      }
    }
  }

  let repeatedBigrams = 0;
  for (const count of bigramCounts.values()) {
    if (count >= 3) repeatedBigrams++;
  }
  let repeatedTrigrams = 0;
  for (const count of trigramCounts.values()) {
    if (count >= 2) repeatedTrigrams++;
  }

  // Overused content words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'it', 'is', 'was', 'were', 'are', 'been', 'be', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'shall', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
    'we', 'you', 'he', 'she', 'they', 'not', 'what', 'which', 'who', 'when',
    'where', 'how', 'than', 'then', 'just', 'about', 'into', 'over', 'after',
    'before', 'been', 'being', 'more', 'some', 'such', 'also', 'back', 'even',
    'still', 'well', 'like', 'know', 'said', 'time', 'very', 'much',
  ]);

  const wordFreq = new Map<string, number>();
  for (const sentence of sentences) {
    for (const w of splitWords(sentence)) {
      if (w.length > 3 && !stopWords.has(w)) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      }
    }
  }

  const overusedWords: string[] = [];
  for (const [word, count] of wordFreq.entries()) {
    if (count >= 4) overusedWords.push(word);
  }

  return { repeatedBigrams, repeatedTrigrams, overusedCount: overusedWords.length, overusedWords };
}

function countNumbers(text: string): number {
  return (text.match(/\b\d[\d,.]*\b/g) || []).length;
}

function countCapitalizedNonStarters(sentences: string[]): number {
  let count = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).slice(1); // skip first word
    for (const w of words) {
      if (/^[A-Z][a-z]/.test(w) && w.length > 1) count++;
    }
  }
  return count;
}

// ============================================================================
// MAIN EXTRACTOR
// ============================================================================

/**
 * Extract mechanical text metrics from essay text.
 * Deterministic, no LLM calls, no judgment. ~20ms for 650 words.
 *
 * Returns raw counts, ratios, and statistical measures that are
 * unambiguously correct. Anything requiring interpretation is
 * provided as raw text (firstSentence, lastParagraph) for LLM consumption.
 */
export function extractCraftFeatures(text: string): CraftFeatures {
  if (!text || text.trim().length === 0) return emptyFeatures();

  const paragraphs = splitParagraphs(text);
  const sentences = splitSentences(text);
  const words = splitWords(text);
  const lowerText = text.toLowerCase();

  // Sentence lengths
  const sentenceLengths = sentences.map(s => splitWords(s).length);
  const sentenceLengthVariance = sentenceLengths.length > 0
    ? sentenceLengths.reduce((sum, l) => {
        const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        return sum + (l - mean) ** 2;
      }, 0) / sentenceLengths.length
    : 0;

  // Paragraph lengths
  const paragraphLengths = paragraphs.map(p => splitWords(p).length);

  // Filler phrases
  const fillerResult = countFillerPhrases(lowerText);

  // Repetition
  const repetition = detectRepetition(sentences);

  // Dialogue
  const dialogueCount = countDialogueSegments(text);

  const wordCount = words.length;

  return {
    // Sentence-level
    sentenceLengths,
    sentenceLengthVariance,
    sentenceLengthCV: computeCV(sentenceLengths),
    sentenceOpeningVariety: countSentenceOpeningVariety(sentences),
    shortSentenceCount: sentenceLengths.filter(l => l <= 5).length,
    longSentenceCount: sentenceLengths.filter(l => l >= 30).length,

    // Paragraph-level
    paragraphLengths,
    paragraphLengthCV: computeCV(paragraphLengths),

    // Exact-match counts
    weakAdverbDensity: wordCount > 0 ? (countWeakAdverbs(words) / wordCount) * 100 : 0,
    toBeVerbDensity: wordCount > 0 ? (countToBeVerbs(words) / wordCount) * 100 : 0,
    fillerPhraseCount: fillerResult.count,
    fillerPhrasesFound: fillerResult.found,

    // Pronouns
    pronounRatio: countPronouns(words),

    // Dialogue
    dialogueSegmentCount: dialogueCount,
    hasDialogue: dialogueCount > 0,

    // Repetition
    repeatedBigramCount: repetition.repeatedBigrams,
    repeatedTrigramCount: repetition.repeatedTrigrams,
    overusedWordCount: repetition.overusedCount,
    overusedWords: repetition.overusedWords,

    // Raw signals for LLM
    firstSentence: sentences[0] || '',
    lastSentence: sentences[sentences.length - 1] || '',
    firstParagraph: paragraphs[0] || '',
    lastParagraph: paragraphs[paragraphs.length - 1] || '',
    numberCount: countNumbers(text),
    capitalizedWordCount: countCapitalizedNonStarters(sentences),
    questionCount: (text.match(/\?/g) || []).length,
    exclamationCount: (text.match(/!/g) || []).length,
  };
}

/** Zeroed-out CraftFeatures for empty input */
function emptyFeatures(): CraftFeatures {
  return {
    sentenceLengths: [],
    sentenceLengthVariance: 0,
    sentenceLengthCV: 0,
    sentenceOpeningVariety: 0,
    shortSentenceCount: 0,
    longSentenceCount: 0,
    paragraphLengths: [],
    paragraphLengthCV: 0,
    weakAdverbDensity: 0,
    toBeVerbDensity: 0,
    fillerPhraseCount: 0,
    fillerPhrasesFound: [],
    pronounRatio: { firstPerson: 0, secondPerson: 0, thirdPerson: 0, totalCount: 0 },
    dialogueSegmentCount: 0,
    hasDialogue: false,
    repeatedBigramCount: 0,
    repeatedTrigramCount: 0,
    overusedWordCount: 0,
    overusedWords: [],
    firstSentence: '',
    lastSentence: '',
    firstParagraph: '',
    lastParagraph: '',
    numberCount: 0,
    capitalizedWordCount: 0,
    questionCount: 0,
    exclamationCount: 0,
  };
}
