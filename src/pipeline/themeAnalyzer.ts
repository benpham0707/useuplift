/**
 * Theme Analyzer — Wave 2B Theme & Meaning Analysis
 *
 * Pre-LLM heuristic analysis that provides thematic context to the Sonnet
 * annotation model. All heuristics count exact matches, compute ratios,
 * or detect presence/absence of literal patterns. NO judgment heuristics.
 *
 * Sub-analyses:
 *   1. Show-Don't-Tell — counting telling/showing markers
 *   2. Cliché Theme Detection — keyword hit counting per theme
 *   3. Thematic Coherence — word overlap across paragraphs (Jaccard)
 */

import {
  splitParagraphs,
  splitSentences,
  splitWords,
  SENSORY_WORDS,
} from '../workshop/scoring/featureExtractor';

import {
  getContentWords,
  jaccardDistance,
  isPastTense,
} from '../workshop/scoring/structuralPatternDetector';

import type {
  ShowDontTellResult,
  ClicheThemeDefinition,
  ClicheDetectionResult,
  ThematicCoherenceResult,
  ThemeAnalysisResult,
} from './contentAnalysisTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const TELLING_PHRASES = [
  'i learned', 'i realized', 'i discovered', 'taught me', 'showed me',
  'i understood', 'important to', 'value of', 'i knew that', 'i felt that',
  'made me realize', 'i became aware', 'i came to understand',
  'i was happy', 'i was sad', 'i was angry', 'i was scared', 'i was nervous',
  'i was excited', 'i was grateful', 'i was proud', 'i was devastated',
];

const SELF_AWARENESS_PHRASES = [
  'i know this sounds', 'it might seem cliché', 'it might seem cliche',
  'everyone writes about', 'typical', 'you might expect',
];

const SUBVERSION_WORDS = ['but', 'however', 'yet', 'instead', 'contrary', 'unexpected', 'surprised'];

const CLICHE_THEMES: ClicheThemeDefinition[] = [
  { id: 'sports_injury', label: 'Sports Injury Comeback', keywords: ['injury', 'torn', 'acl', 'bench', 'comeback', 'perseverance', 'recovery', 'physical therapy'], threshold: 3 },
  { id: 'volunteer_trip', label: 'Volunteer/Service Trip', keywords: ['volunteer', 'service trip', 'developing country', 'grateful', 'privileged', 'less fortunate', 'giving back', 'community service'], threshold: 3 },
  { id: 'immigrant_identity', label: 'Immigrant Identity', keywords: ['immigrant', 'moved to america', 'two cultures', 'identity', 'language barrier', 'translation', 'between two worlds', 'motherland'], threshold: 3 },
  { id: 'dead_relative', label: 'Loss of Loved One', keywords: ['passed away', 'grandmother', 'grandfather', 'funeral', 'legacy', 'cancer', 'hospital', 'last words'], threshold: 3 },
  { id: 'competition_win', label: 'Big Game/Competition Win', keywords: ['first place', 'championship', 'trophy', 'hard work pays', 'final round', 'tournament', 'victory', 'winning'], threshold: 3 },
  { id: 'divorce_hardship', label: 'Divorce/Family Hardship', keywords: ['divorce', 'custody', 'two houses', 'separated', 'broken family', 'fighting parents', 'parents split', 'father left', 'mother left', 'moved out'], threshold: 2 },
  { id: 'pandemic_growth', label: 'Pandemic Growth', keywords: ['covid', 'pandemic', 'quarantine', 'lockdown', 'zoom', 'new normal', 'unprecedented'], threshold: 3 },
  { id: 'overcoming_shyness', label: 'Overcoming Shyness', keywords: ['shy', 'introvert', 'public speaking', 'afraid to speak', 'found my voice', 'came out of my shell'], threshold: 3 },
  { id: 'travel_perspective', label: 'Travel Eye-Opening', keywords: ['trip abroad', 'different culture', 'opened my eyes', 'perspective', 'poverty', 'third world', 'eye-opening'], threshold: 3 },
  { id: 'leadership_lesson', label: 'Leadership Lesson', keywords: ['captain', 'president', 'led the team', 'learned to lead', 'delegation', 'responsibility', 'stepped up'], threshold: 3 },
  { id: 'musical_instrument', label: 'Musical Journey', keywords: ['piano', 'violin', 'practice hours', 'recital', 'concert', 'stage fright', 'perfect pitch', 'metronome'], threshold: 4 },
  { id: 'identity_crisis', label: 'Finding Identity', keywords: ['who am i', "didn't fit in", 'between two worlds', 'not enough', 'too much', 'belonging', 'outsider'], threshold: 3 },
];

// Sentence-start words to exclude from proper noun detection
const SENTENCE_START_EXCLUSIONS = new Set([
  'I', 'The', 'A', 'An', 'It', 'This', 'That', 'My', 'We', 'He', 'She',
  'They', 'But', 'And', 'Or', 'So', 'Yet', 'For', 'In', 'On', 'At', 'To',
  'Of', 'By', 'Is', 'Was', 'Are', 'Were', 'Be', 'If', 'As', 'Do', 'Did',
  'Not', 'No', 'Its', 'Our', 'His', 'Her', 'All', 'One', 'Now', 'Then',
  'When', 'Where', 'How', 'What', 'Why', 'Who', 'Which', 'There', 'Here',
  'After', 'Before', 'During', 'While', 'Because', 'Although', 'Since',
  'Until', 'With', 'From', 'Each', 'Every', 'Some', 'Many', 'Most',
]);

// ============================================================================
// HELPERS
// ============================================================================

/** Count proper nouns not at sentence start (mirrors structuralPatternDetector logic). */
function countProperNouns(text: string): number {
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

/** Count dialogue instances (quote pairs). */
function countDialogueInstances(text: string): number {
  // Count pairs of standard or curly quotes
  const standardPairs = (text.match(/".+?"/g) || []).length;
  const curlyPairs = (text.match(/\u201C.+?\u201D/g) || []).length;
  return standardPairs + curlyPairs;
}

/** Count action sequence pairs: consecutive sentences where both have pastTenseRatio > 0.4. */
function countActionSequences(paragraphs: string[]): number {
  let actionPairs = 0;
  for (const paragraph of paragraphs) {
    const sentences = splitSentences(paragraph);
    for (let i = 1; i < sentences.length; i++) {
      const prevRatio = pastTenseRatio(sentences[i - 1]);
      const currRatio = pastTenseRatio(sentences[i]);
      if (prevRatio > 0.4 && currRatio > 0.4) {
        actionPairs++;
      }
    }
  }
  return actionPairs;
}

/** Compute the ratio of past-tense words to total words in a sentence. */
function pastTenseRatio(sentence: string): number {
  const words = splitWords(sentence);
  if (words.length === 0) return 0;
  let pastCount = 0;
  for (const w of words) {
    if (isPastTense(w)) pastCount++;
  }
  return pastCount / words.length;
}

/** Get the top N most frequent content words from a word list. */
function topContentWords(words: string[], n: number): string[] {
  const contentWords = getContentWords(words);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (contentWords.has(w)) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word);
}

/** Compute Jaccard similarity (1 - distance) between two string sets. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  return 1 - jaccardDistance(a, b);
}

// ============================================================================
// SUB-ANALYSIS 1: SHOW-DON'T-TELL
// ============================================================================

/** Count telling/showing markers in essay text. No quality judgments. */
export function analyzeShowDontTell(text: string): ShowDontTellResult {
  if (!text.trim()) {
    return {
      tellingMarkerCount: 0,
      showingMarkerCount: 0,
      showRatio: 0,
      tellingPhrases: [],
      showingBreakdown: { sensoryWords: 0, dialogueInstances: 0, specificDetails: 0, actionSequences: 0 },
    };
  }

  const lowerText = text.toLowerCase();
  const paragraphs = splitParagraphs(text);
  const words = splitWords(text);

  // --- Telling markers ---
  const tellingPhrases: ShowDontTellResult['tellingPhrases'] = [];
  let tellingMarkerCount = 0;

  for (const phrase of TELLING_PHRASES) {
    let searchFrom = 0;
    while (true) {
      const idx = lowerText.indexOf(phrase, searchFrom);
      if (idx === -1) break;
      tellingMarkerCount++;

      // Determine paragraph index for this offset
      let charCount = 0;
      let paragraphIndex = 0;
      for (let pi = 0; pi < paragraphs.length; pi++) {
        const pStart = text.indexOf(paragraphs[pi], charCount);
        const pEnd = pStart + paragraphs[pi].length;
        if (idx >= pStart && idx < pEnd) {
          paragraphIndex = pi;
          break;
        }
        charCount = pEnd;
      }

      tellingPhrases.push({ text: phrase, paragraphIndex, offset: idx });
      searchFrom = idx + phrase.length;
    }
  }

  // --- Showing markers ---
  const sensoryWords = words.filter(w => SENSORY_WORDS.has(w)).length;
  const dialogueInstances = countDialogueInstances(text);
  const specificDetails = countProperNouns(text);
  const actionSequences = countActionSequences(paragraphs);

  const showingMarkerCount = sensoryWords + dialogueInstances + specificDetails + actionSequences;

  // Formula: showRatio = showingMarkerCount / (showingMarkerCount + tellingMarkerCount * 3)
  const denominator = showingMarkerCount + tellingMarkerCount * 3;
  const showRatio = denominator > 0 ? showingMarkerCount / denominator : 0;

  return {
    tellingMarkerCount,
    showingMarkerCount,
    showRatio: Math.round(showRatio * 1000) / 1000,
    tellingPhrases,
    showingBreakdown: { sensoryWords, dialogueInstances, specificDetails, actionSequences },
  };
}

// ============================================================================
// SUB-ANALYSIS 2: CLICHE THEME DETECTION
// ============================================================================

/** Detect cliché themes by keyword hit counting. No judgment on quality. */
export function detectClicheThemes(text: string): ClicheDetectionResult {
  if (!text.trim()) {
    return {
      clicheDetected: false,
      matchedThemes: [],
      freshnessSignals: {
        hasSpecificSensoryDetail: false,
        hasSelfAwareness: false,
        hasNarrativeSubversion: false,
        freshnessCount: 0,
      },
      verdict: 'not_cliche',
    };
  }

  const lowerText = text.toLowerCase();
  const words = splitWords(text);

  // --- Match cliché themes ---
  const matchedThemes: ClicheDetectionResult['matchedThemes'] = [];

  for (const theme of CLICHE_THEMES) {
    const matchedKeywords: string[] = [];
    let hitCount = 0;
    for (const keyword of theme.keywords) {
      if (lowerText.includes(keyword)) {
        matchedKeywords.push(keyword);
        hitCount++;
      }
    }
    if (hitCount >= theme.threshold) {
      matchedThemes.push({ themeId: theme.id, label: theme.label, matchedKeywords, hitCount });
    }
  }

  const clicheDetected = matchedThemes.length > 0;

  // --- Freshness signals ---
  const sensoryCount = words.filter(w => SENSORY_WORDS.has(w)).length;
  const hasSpecificSensoryDetail = sensoryCount > 5;

  const hasSelfAwareness = SELF_AWARENESS_PHRASES.some(phrase => lowerText.includes(phrase));

  // Narrative subversion: a subversion word appears within 2 sentences of a cliché keyword
  let hasNarrativeSubversion = false;
  if (clicheDetected) {
    const sentences = splitSentences(text);
    const lowerSentences = sentences.map(s => s.toLowerCase());

    // Find sentence indices containing any matched cliché keyword
    const clicheKeywords = matchedThemes.flatMap(t => t.matchedKeywords);
    const clicheSentenceIndices = new Set<number>();
    for (let si = 0; si < lowerSentences.length; si++) {
      for (const keyword of clicheKeywords) {
        if (lowerSentences[si].includes(keyword)) {
          clicheSentenceIndices.add(si);
          break;
        }
      }
    }

    // Check if any subversion word appears within 2 sentences of a cliché sentence
    for (const cIdx of clicheSentenceIndices) {
      const rangeStart = Math.max(0, cIdx - 2);
      const rangeEnd = Math.min(lowerSentences.length - 1, cIdx + 2);
      for (let si = rangeStart; si <= rangeEnd; si++) {
        for (const word of SUBVERSION_WORDS) {
          // Match as whole word (word boundary approximation)
          const re = new RegExp(`\\b${word}\\b`, 'i');
          if (re.test(lowerSentences[si])) {
            hasNarrativeSubversion = true;
            break;
          }
        }
        if (hasNarrativeSubversion) break;
      }
      if (hasNarrativeSubversion) break;
    }
  }

  const freshnessCount = [hasSpecificSensoryDetail, hasSelfAwareness, hasNarrativeSubversion]
    .filter(Boolean).length;

  // Verdict logic
  let verdict: ClicheDetectionResult['verdict'];
  if (!clicheDetected) {
    verdict = 'not_cliche';
  } else if (freshnessCount >= 2) {
    verdict = 'cliche_but_fresh';
  } else {
    verdict = 'cliche_and_stale';
  }

  return {
    clicheDetected,
    matchedThemes,
    freshnessSignals: { hasSpecificSensoryDetail, hasSelfAwareness, hasNarrativeSubversion, freshnessCount },
    verdict,
  };
}

// ============================================================================
// SUB-ANALYSIS 3: THEMATIC COHERENCE
// ============================================================================

/** Compute keyword overlap across paragraphs using Jaccard similarity. */
export function analyzeThematicCoherence(text: string): ThematicCoherenceResult {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return {
      paragraphKeywords: [],
      localCoherence: [],
      globalCoherence: [],
      overallCoherence: 0,
      tangentialParagraphs: [],
    };
  }

  // Per-paragraph: extract content words, pick top 10 by frequency
  const paragraphWordArrays = paragraphs.map(p => splitWords(p));
  const paragraphTopKeywords = paragraphWordArrays.map(words => topContentWords(words, 10));
  const paragraphKeywordSets = paragraphTopKeywords.map(kw => new Set(kw));

  // Essay theme core: top-20 most frequent content words across the entire essay.
  // Using top-20 (not all content words) keeps the set comparable in size to
  // per-paragraph keyword sets, giving meaningful Jaccard similarity.
  const allWords = splitWords(text);
  const essayThemeCore = new Set(topContentWords(allWords, 20));

  // Build paragraph keyword output
  const paragraphKeywords = paragraphTopKeywords.map((keywords, index) => ({ index, keywords }));

  // Local coherence: Jaccard similarity between adjacent paragraph keyword sets
  const localCoherence: number[] = [];
  for (let i = 1; i < paragraphKeywordSets.length; i++) {
    localCoherence.push(
      Math.round(jaccardSimilarity(paragraphKeywordSets[i - 1], paragraphKeywordSets[i]) * 1000) / 1000,
    );
  }

  // Global coherence: each paragraph's keyword overlap with the essay theme core
  const globalCoherence = paragraphKeywordSets.map(kwSet => {
    const sim = jaccardSimilarity(kwSet, essayThemeCore);
    return Math.round(sim * 1000) / 1000;
  });

  // Overall coherence: weighted average
  const meanLocal = localCoherence.length > 0
    ? localCoherence.reduce((a, b) => a + b, 0) / localCoherence.length
    : 0;
  const meanGlobal = globalCoherence.length > 0
    ? globalCoherence.reduce((a, b) => a + b, 0) / globalCoherence.length
    : 0;
  const overallCoherence = Math.round((0.6 * meanGlobal + 0.4 * meanLocal) * 1000) / 1000;

  // Tangential paragraphs: global coherence < 0.15
  const tangentialParagraphs = globalCoherence
    .map((score, index) => ({ score, index }))
    .filter(({ score }) => score < 0.15)
    .map(({ index }) => index);

  return {
    paragraphKeywords,
    localCoherence,
    globalCoherence,
    overallCoherence,
    tangentialParagraphs,
  };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/** Run all three theme sub-analyses on essay text. */
export function analyzeThemes(text: string): ThemeAnalysisResult {
  return {
    showDontTell: analyzeShowDontTell(text),
    clicheDetection: detectClicheThemes(text),
    thematicCoherence: analyzeThematicCoherence(text),
  };
}
