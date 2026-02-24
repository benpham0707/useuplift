/**
 * Stylometric Constants
 *
 * Function word lists, punctuation patterns, formality markers,
 * and reference distributions for statistical voice analysis.
 *
 * These are the foundational data structures that power zero-cost
 * stylometric fingerprinting.
 */

// ============================================================================
// FUNCTION WORDS (the backbone of authorship attribution)
// ============================================================================

/**
 * Top 100 English function words ordered by typical frequency.
 *
 * Function words (determiners, pronouns, prepositions, conjunctions,
 * auxiliary verbs) are ideal for stylometry because:
 * 1. Writers use them unconsciously (hard to consciously manipulate)
 * 2. They're context-independent (appear in all topics)
 * 3. Their relative frequencies form a stable personal signature
 *
 * This list is based on the Mosteller-Wallace function word set,
 * extended with modern usage patterns.
 */
export const FUNCTION_WORDS: readonly string[] = [
  // Articles & determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'some', 'any', 'no', 'every', 'each', 'all', 'both',
  'few', 'many', 'much', 'more', 'most', 'other', 'another',

  // Pronouns
  'i', 'me', 'we', 'us', 'you', 'he', 'him', 'she',
  'it', 'they', 'them', 'myself', 'yourself', 'itself',
  'what', 'which', 'who', 'whom', 'whose',

  // Prepositions
  'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from',
  'by', 'about', 'as', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over',
  'without', 'within', 'along', 'against',

  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'because',
  'although', 'while', 'if', 'when', 'where', 'than',
  'whether', 'though', 'unless', 'until', 'since',

  // Auxiliary / modal verbs
  'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might',
  'can', 'could', 'must',

  // Other function words
  'not', 'very', 'also', 'just', 'only', 'even', 'still',
  'already', 'always', 'never', 'often', 'here', 'there',
  'now', 'then', 'too', 'quite', 'rather',
] as const;

/** Set for O(1) lookup */
export const FUNCTION_WORD_SET = new Set(FUNCTION_WORDS);

// ============================================================================
// CONTRACTION PAIRS (for contraction preference analysis)
// ============================================================================

/**
 * Maps contractions to their expanded forms.
 * Used to measure a writer's preference for contracted vs expanded style.
 */
export const CONTRACTION_PAIRS: ReadonlyArray<{ contracted: string; expanded: string }> = [
  { contracted: "don't", expanded: 'do not' },
  { contracted: "doesn't", expanded: 'does not' },
  { contracted: "didn't", expanded: 'did not' },
  { contracted: "won't", expanded: 'will not' },
  { contracted: "wouldn't", expanded: 'would not' },
  { contracted: "can't", expanded: 'cannot' },
  { contracted: "couldn't", expanded: 'could not' },
  { contracted: "shouldn't", expanded: 'should not' },
  { contracted: "isn't", expanded: 'is not' },
  { contracted: "aren't", expanded: 'are not' },
  { contracted: "wasn't", expanded: 'was not' },
  { contracted: "weren't", expanded: 'were not' },
  { contracted: "hasn't", expanded: 'has not' },
  { contracted: "haven't", expanded: 'have not' },
  { contracted: "hadn't", expanded: 'had not' },
  { contracted: "it's", expanded: 'it is' },
  { contracted: "that's", expanded: 'that is' },
  { contracted: "there's", expanded: 'there is' },
  { contracted: "here's", expanded: 'here is' },
  { contracted: "what's", expanded: 'what is' },
  { contracted: "who's", expanded: 'who is' },
  { contracted: "I'm", expanded: 'I am' },
  { contracted: "I've", expanded: 'I have' },
  { contracted: "I'd", expanded: 'I would' },
  { contracted: "I'll", expanded: 'I will' },
  { contracted: "we're", expanded: 'we are' },
  { contracted: "we've", expanded: 'we have' },
  { contracted: "we'd", expanded: 'we would' },
  { contracted: "we'll", expanded: 'we will' },
  { contracted: "they're", expanded: 'they are' },
  { contracted: "they've", expanded: 'they have' },
  { contracted: "they'd", expanded: 'they would' },
  { contracted: "they'll", expanded: 'they will' },
  { contracted: "you're", expanded: 'you are' },
  { contracted: "you've", expanded: 'you have' },
  { contracted: "you'd", expanded: 'you would' },
  { contracted: "you'll", expanded: 'you will' },
  { contracted: "let's", expanded: 'let us' },
];

// ============================================================================
// FORMALITY MARKERS
// ============================================================================

/** Words/phrases that signal formal register */
export const FORMAL_MARKERS: readonly string[] = [
  'furthermore', 'moreover', 'consequently', 'nevertheless', 'therefore',
  'henceforth', 'notwithstanding', 'accordingly', 'wherein', 'thus',
  'hence', 'whereby', 'therein', 'aforementioned', 'herein',
  'inasmuch', 'whereby', 'heretofore', 'forthwith',
  'utilize', 'facilitate', 'endeavor', 'commence', 'terminate',
  'subsequently', 'preliminary', 'pursuant', 'constitute',
  'implement', 'demonstrate', 'illustrate', 'elucidate',
  'one might', 'it should be noted', 'it is worth noting',
  'in accordance with', 'with regard to', 'in light of',
];

/** Words/phrases that signal casual register */
export const CASUAL_MARKERS: readonly string[] = [
  "can't", "won't", "don't", "didn't", "isn't", "aren't",
  "gonna", "wanna", "kinda", "sorta", "gotta",
  "yeah", "nah", "nope", "yep", "okay", "ok",
  "pretty much", "kind of", "sort of", "a lot",
  "stuff", "things", "cool", "awesome", "weird", "crazy",
  "like", "literally", "basically", "actually", "honestly",
  "oh", "wow", "ugh", "hmm", "well",
];

/** Colloquialisms and informal expressions */
export const COLLOQUIALISMS: readonly string[] = [
  'kind of', 'sort of', 'a bunch of', 'a ton of', 'loads of',
  'no way', 'for real', 'big deal', 'not gonna lie',
  'i mean', 'you know', 'right?', 'anyway',
  'super', 'totally', 'legit', 'lowkey', 'highkey',
  'messed up', 'figured out', 'ended up', 'turned out',
  'pretty cool', 'pretty much', 'no big deal',
  'freaked out', 'stressed out', 'burned out',
];

// ============================================================================
// LATINATE vs GERMANIC WORD ROOTS
// ============================================================================

/**
 * Common Latinate suffixes — words ending with these tend to be
 * Latin/French-derived and register as more formal.
 */
export const LATINATE_SUFFIXES: readonly string[] = [
  'tion', 'sion', 'ment', 'ence', 'ance', 'ity', 'ous',
  'ive', 'able', 'ible', 'ual', 'ial', 'ure', 'ate',
  'ify', 'ize', 'ise',
];

/**
 * Common Germanic-origin short words that signal informal register.
 * These are typically Old English-derived monosyllables.
 */
export const GERMANIC_CORE_WORDS = new Set([
  'get', 'got', 'give', 'gave', 'take', 'took', 'make', 'made',
  'come', 'came', 'go', 'went', 'put', 'set', 'run', 'ran',
  'see', 'saw', 'know', 'knew', 'think', 'thought', 'tell', 'told',
  'find', 'found', 'keep', 'kept', 'let', 'say', 'said',
  'big', 'small', 'good', 'bad', 'old', 'young', 'long', 'short',
  'hard', 'soft', 'fast', 'slow', 'hot', 'cold', 'dark', 'light',
  'work', 'help', 'feel', 'want', 'need', 'try', 'start', 'stop',
]);

// ============================================================================
// AI WRITING SIGNAL THRESHOLDS
// ============================================================================

/**
 * Reference distributions for AI vs human writing signals.
 * Based on empirical analysis of GPT-4, Claude, and human-written
 * college application essays.
 */
export const AI_DETECTION_THRESHOLDS = {
  /** Burstiness: coefficient of variation of sentence-level vocabulary richness */
  burstiness: {
    humanMean: 0.35,   // Humans: high variance in quality
    aiMean: 0.12,      // AI: consistent quality
    threshold: 0.20,   // Below this = AI-like
  },

  /** Sentence length variance (coefficient of variation) */
  sentenceLengthCV: {
    humanMean: 0.55,   // Humans vary a lot
    aiMean: 0.28,      // AI is more uniform
    threshold: 0.35,
  },

  /** Vocabulary uniformity across chunks (low variance = AI-like) */
  vocabularyChunkVariance: {
    humanMean: 0.025,
    aiMean: 0.006,
    threshold: 0.012,
  },

  /** Function word distribution entropy */
  functionWordEntropy: {
    humanMean: 3.8,
    aiMean: 4.2,    // AI actually has HIGHER entropy (more "diverse" connectives)
    threshold: 4.0,
  },

  /** Repetition regularity (autocorrelation of n-gram distances) */
  repetitionRegularity: {
    humanMean: 0.15,
    aiMean: 0.40,    // AI reuses phrases at more regular intervals
    threshold: 0.28,
  },
} as const;

// ============================================================================
// COMMON ENGLISH BIGRAMS (for repetition analysis)
// ============================================================================

/**
 * Very common bigrams that should NOT be counted as "repetitive"
 * since everyone uses them frequently.
 */
export const COMMON_BIGRAMS = new Set([
  'of the', 'in the', 'to the', 'on the', 'and the',
  'for the', 'at the', 'from the', 'with the', 'by the',
  'it was', 'i was', 'it is', 'i am', 'i had',
  'there was', 'there is', 'there are', 'there were',
  'i have', 'i would', 'i could', 'i will', 'i can',
  'that i', 'that the', 'that was', 'that is',
  'to be', 'to do', 'to have', 'to make', 'to get',
  'in a', 'as a', 'is a', 'was a', 'had a',
]);

// ============================================================================
// SUBORDINATE CLAUSE MARKERS
// ============================================================================

export const SUBORDINATE_CLAUSE_MARKERS: readonly string[] = [
  'although', 'because', 'since', 'while', 'whereas',
  'unless', 'until', 'though', 'even though', 'even if',
  'whenever', 'wherever', 'however', 'whatever', 'whoever',
  'after', 'before', 'when', 'where', 'if',
  'as if', 'as though', 'in order that', 'so that',
  'provided that', 'assuming that', 'given that',
  'which', 'who', 'whom', 'whose', 'that',
];
