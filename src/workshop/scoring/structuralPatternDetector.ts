/**
 * Structural Pattern Detector — Essay-level mathematical text property analysis
 *
 * Every metric is a measurable ratio, count, or statistical value.
 * NO phrase matching — only structural mathematics.
 *
 * Used by paragraph function classifier and rebuilt analyzers (1, 3, 5, 7).
 */

import { splitParagraphs, splitSentences, splitWords } from './featureExtractor';

// ============================================================================
// PER-PARAGRAPH METRICS
// ============================================================================

export interface ParagraphMetrics {
  index: number;
  wordCount: number;
  sentenceCount: number;

  // Tense distribution
  pastTenseRatio: number;    // -ed suffix + irregular forms / total verbs
  presentTenseRatio: number;

  // Person distribution
  firstPersonDensity: number;  // I/me/my/myself per word
  thirdPersonDensity: number;  // he/she/they/him/her/them per word

  // Abstraction
  abstractNounRatio: number;   // suffix heuristic: -tion, -ment, -ness, -ity, -ism

  // Sentence-length statistics
  sentenceLengthMean: number;
  sentenceLengthVariance: number;
  sentenceLengthCV: number;    // coefficient of variation
  sentenceLengthMin: number;
  sentenceLengthMax: number;

  // Density metrics
  negationDensity: number;     // not/never/no/nothing/nobody + n't per word
  questionDensity: number;     // sentences ending in ? / total sentences
  dialoguePresent: boolean;
  dialogueCount: number;
  properNounDensity: number;   // capitalized non-start words / total words
}

export interface CrossParagraphShifts {
  fromIndex: number;
  toIndex: number;
  vocabularyShift: number;     // Jaccard distance between content-word sets
  tenseShift: number;          // absolute change in past-tense ratio
  personShift: number;         // change in first-person density
  pacingShift: number;         // change in mean sentence length
  abstractionShift: number;    // change in abstract-noun ratio
}

export interface StructuralAnalysis {
  paragraphs: ParagraphMetrics[];
  shifts: CrossParagraphShifts[];
}

// ============================================================================
// WORD CLASSIFICATION HELPERS
// ============================================================================

const FIRST_PERSON = new Set(['i', 'me', 'my', 'myself', 'mine']);
const THIRD_PERSON = new Set(['he', 'she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their', 'theirs']);

const NEGATION_WORDS = new Set(['not', 'never', 'no', 'nothing', 'nobody', 'nowhere', 'neither', 'nor']);

const IRREGULAR_PAST_TENSE = new Set([
  'was', 'were', 'had', 'did', 'went', 'came', 'saw', 'knew', 'took',
  'made', 'said', 'got', 'gave', 'found', 'thought', 'told', 'felt',
  'became', 'left', 'kept', 'let', 'began', 'seemed', 'stood', 'sat',
  'ran', 'heard', 'brought', 'held', 'wrote', 'read', 'spent', 'grew',
  'led', 'understood', 'put', 'lost', 'caught', 'broke', 'fell', 'drove',
  'bought', 'met', 'paid', 'built', 'taught', 'spoke', 'lay', 'hung',
  'bit', 'woke', 'chose', 'dug', 'drew', 'hid', 'hit', 'hurt', 'shut',
]);

const PRESENT_TENSE_MARKERS = new Set([
  'is', 'are', 'am', 'do', 'does', 'have', 'has',
]);

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'was', 'to', 'of', 'and', 'in', 'that', 'it',
  'for', 'with', 'on', 'at', 'i', 'my', 'me', 'we', 'our', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'did', 'this', 'but', 'not', 'or',
  'so', 'if', 'no', 'are', 'were', 'they', 'them', 'their', 'he', 'she',
  'his', 'her', 'its', 'you', 'your', 'as', 'by', 'from',
]);

const SENTENCE_START_EXCLUSIONS = new Set([
  'I', 'The', 'A', 'An', 'It', 'This', 'That', 'My', 'We', 'He', 'She',
  'They', 'But', 'And', 'Or', 'So', 'Yet', 'For', 'In', 'On', 'At', 'To',
  'Of', 'By', 'Is', 'Was', 'Are', 'Were', 'Be', 'If', 'As', 'Do', 'Did',
  'Not', 'No', 'Its', 'Our', 'His', 'Her', 'All', 'One', 'Now', 'Then',
  'When', 'Where', 'How', 'What', 'Why', 'Who', 'Which', 'There', 'Here',
  'After', 'Before', 'During', 'While', 'Because', 'Although', 'Since',
  'Until', 'With', 'From', 'Each', 'Every', 'Some', 'Many', 'Most',
]);

const ABSTRACT_SUFFIXES = ['-tion', '-ment', '-ness', '-ity', '-ism', '-ance', '-ence'];

const DIALOGUE_RE = /["\u201C\u201D\u201E\u201F\u2018\u2019]/g;

// ============================================================================
// MEASUREMENT FUNCTIONS
// ============================================================================

function isPastTense(word: string): boolean {
  if (IRREGULAR_PAST_TENSE.has(word)) return true;
  // Regular -ed suffix (but not words like "bed", "red", "shed")
  return word.length > 3 && word.endsWith('ed') && !word.endsWith('eed');
}

function isPresentTense(word: string): boolean {
  if (PRESENT_TENSE_MARKERS.has(word)) return true;
  // Third-person -s verbs (rough heuristic)
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us');
}

function isAbstractNoun(word: string): boolean {
  if (word.length < 5) return false;
  for (const suffix of ABSTRACT_SUFFIXES) {
    const bare = suffix.slice(1); // remove leading '-'
    if (word.endsWith(bare)) return true;
  }
  return false;
}

function isContentWord(word: string): boolean {
  return word.length > 2 && !STOP_WORDS.has(word);
}

function getContentWords(words: string[]): Set<string> {
  const set = new Set<string>();
  for (const w of words) {
    if (isContentWord(w)) set.add(w);
  }
  return set;
}

function jaccardDistance(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) {
    if (b.has(w)) intersection++;
  }
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return 1 - intersection / union;
}

function countDialogueMarkers(text: string): number {
  const matches = text.match(DIALOGUE_RE);
  return matches ? Math.floor(matches.length / 2) : 0;
}

function countProperNouns(text: string): number {
  // Count capitalized words that don't start a sentence
  const sentences = text.replace(/([.!?])\s+/g, '$1\n').split('\n').map(s => s.trim()).filter(s => s.length > 0);
  let count = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const cleaned = words[i].replace(/[^a-zA-Z'-]/g, '');
      if (cleaned.length > 0 && /^[A-Z]/.test(cleaned) && !SENTENCE_START_EXCLUSIONS.has(cleaned)) {
        count++;
      }
    }
  }
  return count;
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

function analyzeParagraphMetrics(paragraphText: string, index: number): ParagraphMetrics {
  const words = splitWords(paragraphText);
  const sentences = splitSentences(paragraphText);
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  // Tense distribution
  let pastCount = 0;
  let presentCount = 0;
  for (const w of words) {
    if (isPastTense(w)) pastCount++;
    else if (isPresentTense(w)) presentCount++;
  }
  const verbTotal = Math.max(pastCount + presentCount, 1);
  const pastTenseRatio = pastCount / verbTotal;
  const presentTenseRatio = presentCount / verbTotal;

  // Person distribution
  let firstPersonCount = 0;
  let thirdPersonCount = 0;
  for (const w of words) {
    if (FIRST_PERSON.has(w)) firstPersonCount++;
    if (THIRD_PERSON.has(w)) thirdPersonCount++;
  }
  const firstPersonDensity = wordCount > 0 ? firstPersonCount / wordCount : 0;
  const thirdPersonDensity = wordCount > 0 ? thirdPersonCount / wordCount : 0;

  // Abstraction ratio
  let abstractCount = 0;
  for (const w of words) {
    if (isAbstractNoun(w)) abstractCount++;
  }
  const abstractNounRatio = wordCount > 0 ? abstractCount / wordCount : 0;

  // Sentence-length statistics
  const sentenceLengths = sentences.map(s => splitWords(s).length);
  const sentenceLengthMean = sentenceLengths.length > 0
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    : 0;
  const sentenceLengthVariance = sentenceLengths.length > 1
    ? sentenceLengths.reduce((sum, l) => sum + (l - sentenceLengthMean) ** 2, 0) / sentenceLengths.length
    : 0;
  const sentenceLengthCV = sentenceLengthMean > 0
    ? Math.sqrt(sentenceLengthVariance) / sentenceLengthMean
    : 0;

  // Negation density
  let negationCount = 0;
  for (const w of words) {
    if (NEGATION_WORDS.has(w)) negationCount++;
  }
  // Also count n't contractions
  const nContractCount = (paragraphText.match(/n't/gi) || []).length;
  negationCount += nContractCount;
  const negationDensity = wordCount > 0 ? negationCount / wordCount : 0;

  // Question density
  const questionCount = sentences.filter(s => s.trim().endsWith('?')).length;
  const questionDensity = sentenceCount > 0 ? questionCount / sentenceCount : 0;

  // Dialogue
  const dialogueCount = countDialogueMarkers(paragraphText);
  const dialoguePresent = dialogueCount > 0;

  // Proper noun density
  const properNounCount = countProperNouns(paragraphText);
  const properNounDensity = wordCount > 0 ? properNounCount / wordCount : 0;

  return {
    index,
    wordCount,
    sentenceCount,
    pastTenseRatio,
    presentTenseRatio,
    firstPersonDensity,
    thirdPersonDensity,
    abstractNounRatio,
    sentenceLengthMean,
    sentenceLengthVariance,
    sentenceLengthCV,
    sentenceLengthMin: sentenceLengths.length > 0 ? Math.min(...sentenceLengths) : 0,
    sentenceLengthMax: sentenceLengths.length > 0 ? Math.max(...sentenceLengths) : 0,
    negationDensity,
    questionDensity,
    dialoguePresent,
    dialogueCount,
    properNounDensity,
  };
}

function computeShifts(
  prev: ParagraphMetrics,
  curr: ParagraphMetrics,
  prevWords: string[],
  currWords: string[],
): CrossParagraphShifts {
  const prevContent = getContentWords(prevWords);
  const currContent = getContentWords(currWords);

  return {
    fromIndex: prev.index,
    toIndex: curr.index,
    vocabularyShift: jaccardDistance(prevContent, currContent),
    tenseShift: Math.abs(curr.pastTenseRatio - prev.pastTenseRatio),
    personShift: Math.abs(curr.firstPersonDensity - prev.firstPersonDensity),
    pacingShift: Math.abs(curr.sentenceLengthMean - prev.sentenceLengthMean),
    abstractionShift: Math.abs(curr.abstractNounRatio - prev.abstractNounRatio),
  };
}

/**
 * Analyze structural patterns across an entire essay.
 * Returns per-paragraph metrics and cross-paragraph shifts.
 */
export function analyzeStructuralPatterns(text: string): StructuralAnalysis {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return { paragraphs: [], shifts: [] };
  }

  const paragraphWordArrays = paragraphs.map(p => splitWords(p));
  const metrics = paragraphs.map((p, i) => analyzeParagraphMetrics(p, i));

  const shifts: CrossParagraphShifts[] = [];
  for (let i = 1; i < metrics.length; i++) {
    shifts.push(computeShifts(
      metrics[i - 1],
      metrics[i],
      paragraphWordArrays[i - 1],
      paragraphWordArrays[i],
    ));
  }

  return { paragraphs: metrics, shifts };
}

// Re-export helpers for use by other modules
export { isAbstractNoun, getContentWords, jaccardDistance, isPastTense };
