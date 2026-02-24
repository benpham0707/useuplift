/**
 * Stylometric Analysis Types
 *
 * Defines the complete type system for statistical voice modeling,
 * authorship attribution, AI detection, and voice evolution tracking.
 *
 * All analyses are pure computation — zero LLM calls, zero external deps,
 * target < 20ms per analysis on a 650-word essay.
 */

// ============================================================================
// VOICE FINGERPRINT (persistable, comparable across sessions)
// ============================================================================

/**
 * A statistical fingerprint of a writer's style.
 *
 * Built from pure text analysis — no LLM required.
 * Can be stored in Supabase and compared across documents/sessions.
 * Designed to complement (not replace) the LLM-derived StudentVoiceProfile.
 */
export interface VoiceFingerprint {
  /** Schema version for forward compatibility */
  version: 1;

  /** ISO timestamp of when this fingerprint was computed */
  computedAt: string;

  /** Word count of the source text */
  sourceWordCount: number;

  // --------------------------------------------------------------------------
  // FUNCTION WORD FREQUENCIES (the core of stylometric fingerprinting)
  // --------------------------------------------------------------------------

  /**
   * Relative frequencies of the top 100 function words.
   * Key = function word, value = frequency (0-1) relative to total words.
   * Function words are style-diagnostic because writers use them unconsciously.
   */
  functionWordFrequencies: Record<string, number>;

  // --------------------------------------------------------------------------
  // PUNCTUATION PATTERNS
  // --------------------------------------------------------------------------

  punctuation: {
    /** Commas per sentence */
    commaRate: number;
    /** Semicolons per 1000 words */
    semicolonRate: number;
    /** Em-dashes (— or --) per 1000 words */
    emDashRate: number;
    /** Exclamation marks per 1000 words */
    exclamationRate: number;
    /** Question marks per 1000 words */
    questionRate: number;
    /** Ellipses (...) per 1000 words */
    ellipsisRate: number;
    /** Parenthetical usage per 1000 words */
    parentheticalRate: number;
    /** Colon usage per 1000 words */
    colonRate: number;
  };

  // --------------------------------------------------------------------------
  // SENTENCE METRICS
  // --------------------------------------------------------------------------

  sentenceMetrics: {
    /** Average words per sentence */
    meanLength: number;
    /** Standard deviation of sentence length */
    stdDevLength: number;
    /** Skewness: positive = right-skewed (more short sentences) */
    skewnessLength: number;
    /** Median sentence length */
    medianLength: number;
    /** Percentage of sentences <= 5 words */
    shortSentenceRatio: number;
    /** Percentage of sentences >= 25 words */
    longSentenceRatio: number;
    /** Total sentence count */
    sentenceCount: number;
  };

  // --------------------------------------------------------------------------
  // PARAGRAPH METRICS
  // --------------------------------------------------------------------------

  paragraphMetrics: {
    /** Average sentences per paragraph */
    meanLength: number;
    /** Standard deviation */
    stdDevLength: number;
    /** Total paragraph count */
    paragraphCount: number;
  };

  // --------------------------------------------------------------------------
  // CONTRACTION & FORMALITY
  // --------------------------------------------------------------------------

  contractions: {
    /** Total contraction count */
    count: number;
    /** Contractions per 1000 words */
    rate: number;
    /** Ratio of contracted vs expanded forms found (e.g., don't vs do not) */
    contractionPreference: number;  // 0 = always expanded, 1 = always contracted
  };

  // --------------------------------------------------------------------------
  // VOCABULARY METRICS
  // --------------------------------------------------------------------------

  vocabulary: {
    /** Type-Token Ratio (unique words / total words) */
    typeTokenRatio: number;
    /** Hapax legomena ratio (words appearing once / total unique words) */
    hapaxRatio: number;
    /** Average word length in characters */
    meanWordLength: number;
    /** Std dev of word length */
    stdDevWordLength: number;
    /** Ratio of words > 3 syllables */
    polysyllabicRatio: number;
  };

  // --------------------------------------------------------------------------
  // RHYTHMIC SIGNATURE
  // --------------------------------------------------------------------------

  rhythm: {
    /** Mean syllables per word */
    meanSyllablesPerWord: number;
    /** Std dev of syllables per word */
    stdDevSyllablesPerWord: number;
    /** Distribution of syllable counts [1-syl%, 2-syl%, 3-syl%, 4+syl%] */
    syllableDistribution: [number, number, number, number];
    /** Sentence-length sequence autocorrelation (rhythmic regularity) */
    lengthAutocorrelation: number;
  };

  // --------------------------------------------------------------------------
  // REGISTER & FORMALITY
  // --------------------------------------------------------------------------

  register: {
    /** 0 = very casual, 1 = very formal */
    formalityScore: number;
    /** First person pronoun rate (I, me, my, mine, myself) per 1000 words */
    firstPersonRate: number;
    /** Third person / impersonal rate (one, the, this) per 1000 words */
    impersonalRate: number;
    /** Latinate vs Germanic preference (0 = all Germanic, 1 = all Latinate) */
    latinateRatio: number;
    /** Colloquialism density per 1000 words */
    colloquialismRate: number;
  };
}

// ============================================================================
// STYLOMETRIC ANALYSIS RESULT
// ============================================================================

/**
 * Complete stylometric analysis of a single text.
 */
export interface StylometricAnalysis {
  /** The voice fingerprint (persistable) */
  fingerprint: VoiceFingerprint;

  /** AI vs human writing probability */
  aiDetection: AIDetectionResult;

  /** Register and formality analysis */
  registerAnalysis: RegisterAnalysis;

  /** Rhythmic pattern analysis */
  rhythmAnalysis: RhythmAnalysis;

  /** Idiolect features (distinctive personal patterns) */
  idiolect: IdiolectProfile;

  /** Performance timing */
  computeTimeMs: number;
}

// ============================================================================
// AI DETECTION
// ============================================================================

/**
 * Non-LLM AI detection result.
 * NOT a binary classifier — provides probability with contributing factors.
 */
export interface AIDetectionResult {
  /** Probability that text is AI-generated (0-1) */
  aiProbability: number;

  /** Confidence in the assessment (0-1), lower for short texts */
  confidence: number;

  /** Individual signal contributions */
  signals: {
    /** Burstiness: humans write in bursts; AI is smooth. Low = AI-like. */
    burstiness: SignalScore;

    /** Sentence length variance: AI tends toward medium; humans vary more. */
    sentenceLengthVariance: SignalScore;

    /** Vocabulary uniformity: AI has consistent lexical richness per chunk. */
    vocabularyUniformity: SignalScore;

    /** Function word distribution: AI overuses certain connectives. */
    functionWordAnomaly: SignalScore;

    /** Repetition regularity: AI reuses phrases at regular intervals. */
    repetitionRegularity: SignalScore;

    /** Perplexity flatness: human writing has natural spikes; AI is flat. */
    perplexityFlatness: SignalScore;
  };

  /** Human-readable summary of the dominant signals */
  dominantSignals: string[];
}

export interface SignalScore {
  /** Raw score (0-1, higher = more AI-like) */
  score: number;
  /** Weight in the overall calculation */
  weight: number;
  /** Human-readable label */
  label: string;
}

// ============================================================================
// AUTHORSHIP / CONSISTENCY
// ============================================================================

/**
 * Result of comparing two or more texts for voice consistency.
 */
export interface VoiceConsistencyScore {
  /** Overall consistency score (0-1, higher = more consistent) */
  overallConsistency: number;

  /** Burrows' Delta (z-score distance in function-word space) */
  burrowsDelta: number;

  /** Per-dimension consistency breakdown */
  dimensions: {
    functionWords: number;     // 0-1
    punctuation: number;       // 0-1
    sentenceStructure: number; // 0-1
    vocabulary: number;        // 0-1
    rhythm: number;            // 0-1
    formality: number;         // 0-1
  };

  /** Specific inconsistencies detected */
  inconsistencies: VoiceInconsistency[];

  /** Whether this suggests different authors */
  differentAuthorLikely: boolean;
}

export interface VoiceInconsistency {
  dimension: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  /** Distance metric for this dimension */
  distance: number;
}

// ============================================================================
// VOICE EVOLUTION
// ============================================================================

/**
 * Tracks how voice changes across revisions.
 */
export interface VoiceEvolutionResult {
  /** Direction of voice change */
  direction: 'more_authentic' | 'less_authentic' | 'stable' | 'mixed';

  /** Voice drift magnitude (0-1, higher = more change) */
  driftMagnitude: number;

  /** Per-dimension drift */
  dimensionDrift: {
    dimension: string;
    before: number;
    after: number;
    drift: number;
    interpretation: string;
  }[];

  /** Whether edits are homogenizing toward generic patterns */
  homogenizationRisk: number; // 0-1

  /** Specific warnings */
  warnings: string[];
}

// ============================================================================
// REGISTER ANALYSIS
// ============================================================================

/**
 * Detailed register and formality analysis.
 */
export interface RegisterAnalysis {
  /** Primary register classification */
  primaryRegister: 'casual' | 'conversational' | 'semi-formal' | 'academic' | 'literary';

  /** Formality score (0-1) */
  formalityScore: number;

  /** Register consistency within the text (0-1, higher = more consistent) */
  internalConsistency: number;

  /** Detected register shifts (jarring tone changes) */
  registerShifts: {
    /** Sentence index where shift occurs */
    sentenceIndex: number;
    /** The sentence text */
    text: string;
    /** Register before the shift */
    from: string;
    /** Register after the shift */
    to: string;
    /** Severity of the shift */
    severity: 'subtle' | 'noticeable' | 'jarring';
  }[];

  /** Contributing factors */
  factors: {
    pronounUsage: { firstPerson: number; thirdPerson: number; impersonal: number };
    contractionFrequency: number;
    colloquialismDensity: number;
    latinateWordRatio: number;
    subordinateClauseRate: number;
  };
}

// ============================================================================
// RHYTHM ANALYSIS
// ============================================================================

/**
 * Prosodic rhythm analysis.
 */
export interface RhythmAnalysis {
  /** Overall rhythmic quality score (0-10) */
  qualityScore: number;

  /** Whether writing has sufficient rhythmic variation */
  hasVariation: boolean;

  /** Detected rhetorical devices */
  devices: {
    /** Repetition of beginning words/phrases */
    anaphora: { detected: boolean; examples: string[] };
    /** Repetition of ending words/phrases */
    epistrophe: { detected: boolean; examples: string[] };
    /** Parallel grammatical structures */
    parallelStructure: { detected: boolean; examples: string[] };
    /** Very short emphatic sentences after longer ones */
    staccato: { detected: boolean; count: number };
    /** Lists of three */
    tricolon: { detected: boolean; examples: string[] };
  };

  /** Sentence length pattern description */
  lengthPattern: 'monotonous' | 'varied' | 'wave' | 'building' | 'decaying' | 'random';

  /** Syllabic density variation */
  syllabicVariation: number; // 0-1
}

// ============================================================================
// IDIOLECT PROFILE
// ============================================================================

/**
 * Distinctive personal language patterns.
 */
export interface IdiolectProfile {
  /** Signature phrases or constructions (appear 2+ times, not common cliches) */
  signaturePhrases: string[];

  /** Preferred sentence structures */
  preferredStructures: {
    /** Ratio of sentences starting with subject (I, The, He...) */
    subjectFirstRatio: number;
    /** Ratio of sentences with introductory clauses */
    introClauseRatio: number;
    /** Ratio of compound-complex sentences */
    compoundComplexRatio: number;
    /** Ratio of fragment/minor sentences */
    fragmentRatio: number;
    /** Ratio of questions */
    questionRatio: number;
  };

  /** Characteristic word choices (frequent + not common across all writers) */
  characteristicWords: string[];

  /** Unique punctuation habits */
  punctuationHabits: string[];

  /** Overall distinctiveness score (0-1, higher = more unique voice) */
  distinctiveness: number;
}

// ============================================================================
// RUBRIC DIMENSION MAPPING
// ============================================================================

/**
 * Maps stylometric signals to Uplift's rubric dimensions.
 */
export interface RubricMapping {
  /** voice_integrity: authenticity, personal voice strength */
  voice_integrity: {
    score: number;
    signals: string[];
  };

  /** vulnerability_risk: emotional exposure, authentic struggle */
  vulnerability_risk: {
    score: number;
    signals: string[];
  };

  /** craft_language_quality: writing sophistication, rhythm, word choice */
  craft_language_quality: {
    score: number;
    signals: string[];
  };

  /** audience_awareness: register appropriateness, formality matching */
  audience_awareness: {
    score: number;
    signals: string[];
  };
}
