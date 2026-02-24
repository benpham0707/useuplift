# WritingQualityEngine: Unified Computational Analysis Architecture

> **Status:** Architecture Design (Pre-Implementation)
> **Author:** Architecture Synthesis Agent
> **Date:** 2026-02-23
> **Scope:** Composing 5 research domains into a unified zero-cost, <50ms computational engine

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Pipeline Architecture](#2-pipeline-architecture)
3. [Unified Interface Design](#3-unified-interface-design)
4. [Workshop Integration Points](#4-workshop-integration-points)
5. [Performance Budget](#5-performance-budget)
6. [Data Flow Architecture](#6-data-flow-architecture)
7. [Caching & Persistence Strategy](#7-caching--persistence-strategy)
8. [Configuration & Feature Flags](#8-configuration--feature-flags)
9. [Migration Strategy](#9-migration-strategy)
10. [Cost Impact Analysis](#10-cost-impact-analysis)
11. [File Structure](#11-file-structure)
12. [Complete TypeScript Interfaces](#12-complete-typescript-interfaces)
13. [Existing Code Integration Map](#13-existing-code-integration-map)

---

## 1. Executive Summary

The WritingQualityEngine is a computational analysis layer that runs **before**, **after**, and **independently of** LLM calls across all three Uplift workshops (Common App, PIQ, Activity). It provides:

- **Zero API cost** -- purely computational, no LLM calls
- **<50ms total latency** for all analyses combined
- **Deterministic results** -- same input always produces same output
- **Prompt enrichment** -- feeds specific, grounded observations into LLM prompts
- **Score calibration** -- Bayesian updating of LLM scores with computational priors
- **Pre-screening** -- confident computational assessments can skip LLM entirely

The engine composes techniques from 5 research domains:

| Domain | Techniques | Budget |
|--------|-----------|--------|
| Computational Linguistics | Readability, POS, vocabulary, sentence features, discourse, specificity, emotion, cliches | 15ms |
| Narrative Structure | Paragraph roles, tension arc, transformation, temporal flow, coherence, show-vs-tell, stakes | 12ms |
| Information Theory | Shannon entropy, surprisal, compression ratio, density variation, mutual information, Zipf | 10ms |
| Stylometrics & Voice | Fingerprinting, consistency, AI detection, register, rhythm, idiolect | 8ms |
| Scoring Science | IRT, Bayesian updating, constraint satisfaction, confidence intervals | 5ms (post-LLM) |

---

## 2. Pipeline Architecture

### 2.1 Three-Phase Execution Model

```
                    PHASE 1: PRE-LLM              PHASE 2: LLM           PHASE 3: POST-LLM
                   (computational, <50ms)        (existing pipeline)      (calibration, <5ms)

Essay Input ──┬── textPreparer.prepare() ──┐
              │         ~2ms               │
              │                            │
              ├── linguisticAnalyzer ───────┤
              │         ~15ms              │
              │                            │
              ├── narrativeAnalyzer ────────┤
              │         ~12ms              ├──► ComputationalAnalysis
              │                            │          │
              ├── infoTheoreticAnalyzer ───┤          │
              │         ~10ms              │          ├──► promptEnricher ──► [LLM CALL] ──► llmScores
              │                            │          │                         3-10s           │
              └── stylometricAnalyzer ─────┘          │                                        │
                        ~8ms                          │                                        │
                                                      └──► scoringCalibrator.calibrate(        │
                                                              computationalPriors,             │
                                                              llmScores                        │
                                                           ) ──► CalibratedOutput ──► Final Result
```

### 2.2 What Runs BEFORE the LLM Call

All four primary analyzers run in **parallel** (Promise.all or synchronous -- all are CPU-bound, no I/O):

1. **Text Preparation** (shared, ~2ms): Tokenization, sentence splitting, paragraph extraction, word frequency calculation. Result is reused by all analyzers.

2. **Linguistic Analysis** (~15ms): Readability metrics, POS distribution, vocabulary sophistication, sentence-level features, discourse markers, specificity detection, emotional language, cliche detection.

3. **Narrative Analysis** (~12ms): Paragraph function classification, tension arc detection, before/after transformation, temporal flow, argument coherence, show-vs-tell, stakes detection, resolution quality.

4. **Information-Theoretic Analysis** (~10ms): Word-level entropy, surprisal-based quality, compression ratio, information density curves, mutual information between sections, Zipf deviation.

5. **Stylometric Analysis** (~8ms): Voice fingerprinting, authorship consistency, AI detection signals (extends existing `aiRiskScorer`), register/formality, rhythmic patterns, idiolect markers.

**Output:** A complete `ComputationalAnalysis` object with all metrics.

### 2.3 What Runs AFTER the LLM Call

The **Scoring Calibrator** (~5ms) receives both computational analysis and LLM scores:

1. **Bayesian Score Updating**: Uses computational metrics as informed priors, LLM scores as likelihoods. Produces posterior score distributions with confidence intervals.

2. **Constraint Satisfaction**: Checks for score coherence -- e.g., high narrative_arc score is inconsistent with no detected temporal markers or stakes.

3. **Disagreement Flagging**: When computational analysis strongly disagrees with LLM score (>2 points), flags for potential LLM hallucination or edge case.

4. **Confidence Banding**: Attaches confidence intervals to each dimension score based on agreement between computational and LLM assessments.

### 2.4 What Runs INDEPENDENTLY of LLM Calls

These provide **instant feedback** without waiting for LLM:

- Readability scores (Flesch-Kincaid, grade level)
- Word count and character count validation
- Cliche and dead phrase detection with locations
- AI-generated content risk assessment
- Sentence variety and monotony detection
- Passive voice ratio
- Specificity score (concrete vs. abstract language)
- Voice consistency check (against stored profile)

### 2.5 Execution Order and Dependencies

```
INDEPENDENT (can run anytime, no LLM needed):
  readability, wordCount, clicheDetection, aiRisk, sentenceVariety, passiveVoice, specificity, voiceCheck

PRE-LLM (must complete before LLM call):
  textPreparation → [linguisticAnalysis, narrativeAnalysis, infoTheoreticAnalysis, stylometricAnalysis] → promptEnrichment

POST-LLM (must wait for LLM scores):
  [llmScores, computationalAnalysis] → bayesianUpdating → constraintSatisfaction → calibratedOutput
```

### 2.6 Inter-Analyzer Data Flow

```
textPreparer.prepare()
  ├── tokens, sentences, paragraphs, wordFrequencies (shared by ALL)
  │
  ├── linguisticAnalyzer
  │     ├── readability metrics
  │     ├── posDistribution ──────────────────┐
  │     ├── vocabularySophistication          │
  │     ├── sentenceFeatures                  │
  │     ├── discourseMarkers                  │
  │     ├── specificityScore ─────────────────┤─── narrativeAnalyzer needs
  │     ├── emotionalLanguage ────────────────┤    these for context
  │     └── clicheDetection                   │
  │                                           │
  ├── narrativeAnalyzer                       │
  │     ├── paragraphRoles ◄──────────────────┘
  │     ├── tensionArc
  │     ├── transformationDetection
  │     ├── temporalFlow
  │     ├── coherenceScore
  │     ├── showVsTell
  │     ├── stakesDetection
  │     └── resolutionQuality
  │
  ├── infoTheoreticAnalyzer
  │     ├── shannonEntropy
  │     ├── surprisalProfile
  │     ├── compressionRatio
  │     ├── densityVariation
  │     ├── mutualInformation
  │     └── zipfDeviation
  │
  └── stylometricAnalyzer
        ├── voiceFingerprint
        ├── authorshipConsistency
        ├── aiDetectionSignals (extends aiRiskScorer)
        ├── registerAnalysis
        ├── rhythmicPatterns
        └── idiolectMarkers
```

Note: The narrativeAnalyzer optionally accepts specificityScore and emotionalLanguage from the linguisticAnalyzer to improve paragraph role classification. If running in strict parallel mode, it uses its own lighter-weight detection. The quality difference is minimal (<2% accuracy).

---

## 3. Unified Interface Design

### 3.1 Core Analysis Output

```typescript
/**
 * The complete output of all computational analysis.
 * This is the master type that flows through the entire system.
 * Produced in <50ms with zero API cost.
 */
interface ComputationalAnalysis {
  /** Unique analysis ID for caching and tracking */
  id: string;

  /** Input metadata */
  input: {
    textHash: string;           // SHA-256 of input text for cache key
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
    sentenceCount: number;
    workshopType: WorkshopType;
    timestamp: string;
  };

  /** Agent 1: Computational Linguistics */
  linguistic: LinguisticAnalysis;

  /** Agent 2: Narrative Structure */
  narrative: NarrativeAnalysis;

  /** Agent 3: Information Theory */
  informationTheoretic: InformationTheoreticAnalysis;

  /** Agent 4: Stylometrics & Voice */
  stylometric: StylometricAnalysis;

  /** Composite scores derived from all analyzers */
  compositeScores: CompositeScores;

  /** Performance tracking */
  performance: {
    totalMs: number;
    linguisticMs: number;
    narrativeMs: number;
    informationTheoreticMs: number;
    stylometricMs: number;
    preparationMs: number;
  };

  /** Which analyzers actually ran (based on workshop profile) */
  analyzersRun: AnalyzerName[];

  /** Configuration used for this analysis */
  configProfile: string;
}
```

### 3.2 Sub-Analyzer Output Types

```typescript
// ============================================================================
// LINGUISTIC ANALYSIS (Agent 1)
// ============================================================================

interface LinguisticAnalysis {
  readability: {
    fleschKincaid: number;       // Grade level
    colemanLiau: number;         // Grade level
    automatedReadabilityIndex: number;
    gradeLevel: number;          // Composite grade level
    readabilityLabel: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'graduate';
  };

  vocabulary: {
    /** Moving Average Type-Token Ratio (vocabulary diversity) */
    mattr: number;               // 0-1, window size 50
    /** Word frequency band distribution */
    frequencyBands: {
      band1_common: number;      // % of words in top 1000
      band2_familiar: number;    // % in top 1000-3000
      band3_academic: number;    // % in top 3000-5000
      band4_advanced: number;    // % in top 5000-10000
      band5_rare: number;        // % beyond top 10000
    };
    /** Academic Word List coverage */
    awlCoverage: number;         // % of AWL words used
    /** Hapax legomena ratio (words used exactly once) */
    hapaxRatio: number;          // 0-1
    /** Sophistication score */
    sophisticationScore: number; // 0-10
  };

  posDistribution: {
    verbRatio: number;
    nounRatio: number;
    adjectiveRatio: number;
    adverbRatio: number;
    passiveVoiceRatio: number;
    activeVerbDensity: number;   // Action verbs per sentence
    nominalizationCount: number; // "tion" words that could be verbs
  };

  sentenceFeatures: {
    /** Entropy of sentence opener types (higher = more variety) */
    openerEntropy: number;       // bits
    /** Longest run of same-structure sentences */
    monotonyRuns: number;
    /** Fragment count (intentional or not) */
    fragmentCount: number;
    /** Run-on sentence count */
    runOnCount: number;
    /** Average sentence length (words) */
    avgLength: number;
    /** Sentence length standard deviation */
    lengthStdDev: number;
    /** Length variety score */
    varietyScore: number;        // 0-10
  };

  discourse: {
    /** Transition words per paragraph */
    transitionDensity: number;
    /** Distribution of transitions across text */
    transitionDistribution: number; // 0-1 (1 = perfectly even)
    /** Adversative transition ratio ("but", "however", "yet") */
    adversativeRatio: number;
    /** Connective diversity score */
    connectiveDiversity: number; // 0-10
  };

  specificity: {
    /** Ratio of concrete to abstract nouns */
    concreteAbstractRatio: number;
    /** Count of vague quantifiers ("some", "many", "several") */
    vagueQuantifierCount: number;
    /** Named entity count (specific names, places, dates) */
    namedEntityCount: number;
    /** Numeric evidence count */
    numericEvidenceCount: number;
    /** Overall specificity score */
    specificityScore: number;    // 0-10
  };

  emotion: {
    /** Dominant emotion detected */
    dominantEmotion: string | null;
    /** Emotion distribution */
    emotionDistribution: Record<string, number>; // emotion -> intensity
    /** Cognitive process word density ("think", "know", "understand") */
    cognitiveProcessDensity: number;
    /** Emotional arc (sentiment across text sections) */
    emotionalArc: number[];     // Array of sentiment scores per section
  };

  cliches: {
    /** Dead phrases found with positions */
    detected: { phrase: string; position: number; }[];
    /** Cliche density (per 100 words) */
    density: number;
    /** Cliche-free score */
    freshness: number;          // 0-10
  };
}

// ============================================================================
// NARRATIVE ANALYSIS (Agent 2)
// ============================================================================

interface NarrativeAnalysis {
  paragraphRoles: {
    /** Role assigned to each paragraph */
    roles: ParagraphRole[];
    /** Whether a complete narrative arc is present */
    hasCompleteArc: boolean;
    /** Missing arc elements */
    missingElements: ('setup' | 'conflict' | 'escalation' | 'turning_point' | 'resolution' | 'reflection')[];
  };

  tensionArc: {
    /** Tension level at each paragraph (0-10) */
    tensionCurve: number[];
    /** Detected story shape */
    shape: 'rags_to_riches' | 'riches_to_rags' | 'man_in_hole' | 'icarus' |
           'cinderella' | 'oedipus' | 'flat' | 'unknown';
    /** Peak tension position (0-1, where in the essay) */
    peakPosition: number;
    /** Tension range (max - min) */
    tensionRange: number;
    /** Overall arc quality score */
    arcQuality: number;         // 0-10
  };

  transformation: {
    /** Whether a before/after transformation is detected */
    detected: boolean;
    /** Feature comparison between first and second half */
    featureShift: {
      vocabularyShift: number;  // Positive = more sophisticated in second half
      toneShift: number;        // Positive = more positive in second half
      agencyShift: number;      // Positive = more active voice in second half
    };
    /** Transformation strength score */
    strength: number;           // 0-10
  };

  temporalFlow: {
    /** Temporal markers found */
    markers: { text: string; position: number; type: 'past' | 'present' | 'future'; }[];
    /** Temporal pattern */
    pattern: 'chronological' | 'reverse_chronological' | 'in_medias_res' |
             'bookend' | 'thematic' | 'fragmented' | 'none';
    /** Temporal coherence score */
    coherence: number;          // 0-10
  };

  coherence: {
    /** Average Jaccard similarity between adjacent paragraphs */
    adjacentSimilarity: number;
    /** Topic drift detection (sharp drops in similarity) */
    driftPoints: number[];      // Positions where coherence drops
    /** Overall coherence score */
    coherenceScore: number;     // 0-10
  };

  showVsTell: {
    /** Showing passages count */
    showCount: number;
    /** Telling passages count */
    tellCount: number;
    /** Show-to-tell ratio */
    ratio: number;
    /** Detected telling passages that could be showing */
    improvablePassages: { text: string; position: number; suggestion: string; }[];
    /** Show-vs-tell quality score */
    quality: number;            // 0-10
  };

  stakes: {
    /** Stakes detected */
    detected: { type: StakeType; text: string; position: number; }[];
    /** Stakes type distribution */
    typeDistribution: Record<StakeType, number>;
    /** Conditional/counterfactual pattern count */
    conditionalPatterns: number;
    /** Stakes presence score */
    presenceScore: number;      // 0-10
  };

  resolution: {
    /** Ending type detected */
    endingType: 'circular_return' | 'forward_looking' | 'reflective' |
                'action_oriented' | 'question' | 'image' | 'abrupt' | 'none';
    /** Whether the ending echoes the opening (circular structure) */
    circularReturn: boolean;
    /** Resolution satisfaction score */
    satisfactionScore: number;  // 0-10
  };
}

type ParagraphRole = 'setup' | 'conflict' | 'escalation' | 'turning_point' | 'resolution' | 'reflection';
type StakeType = 'personal' | 'interpersonal' | 'community' | 'existential' | 'intellectual';

// ============================================================================
// INFORMATION-THEORETIC ANALYSIS (Agent 3)
// ============================================================================

interface InformationTheoreticAnalysis {
  entropy: {
    /** Shannon entropy of word distribution (bits) */
    wordEntropy: number;
    /** Character-level entropy (bits) */
    characterEntropy: number;
    /** Normalized entropy (0-1, relative to maximum) */
    normalizedEntropy: number;
  };

  surprisal: {
    /** Average surprisal per word (bits, based on n-gram model) */
    averageSurprisal: number;
    /** Surprisal variance (higher = more unpredictable writing) */
    surprisalVariance: number;
    /** High-surprisal words (unexpected, potentially creative) */
    highSurprisalWords: { word: string; surprisal: number; position: number; }[];
    /** Predictability score (lower = more creative, higher = more formulaic) */
    predictability: number;     // 0-100
  };

  compression: {
    /** Compression ratio (compressed size / original size) */
    ratio: number;
    /** Redundancy measure (1 - compression ratio) */
    redundancy: number;
    /** Interpretation */
    interpretation: 'highly_compressed' | 'well_balanced' | 'somewhat_redundant' | 'highly_redundant';
  };

  densityVariation: {
    /** Information density per sliding window */
    densityCurve: number[];
    /** Density variance (higher = more dynamic pacing) */
    densityVariance: number;
    /** Low-density regions (potential padding/filler) */
    lowDensityRegions: { start: number; end: number; density: number; }[];
    /** Pacing quality score */
    pacingScore: number;        // 0-10
  };

  mutualInformation: {
    /** MI between first/second half */
    halveMI: number;
    /** MI between introduction and conclusion */
    introConclMI: number;
    /** Thematic coherence based on MI */
    thematicCoherence: number;  // 0-10
  };

  zipf: {
    /** Zipf coefficient (slope of log-log word frequency plot) */
    coefficient: number;
    /** Deviation from ideal Zipf (-1) */
    deviation: number;
    /** Interpretation */
    interpretation: 'natural_varied' | 'slightly_uniform' | 'highly_uniform' | 'erratic';
  };
}

// ============================================================================
// STYLOMETRIC ANALYSIS (Agent 4)
// ============================================================================

interface StylometricAnalysis {
  fingerprint: {
    /** Function word frequency vector (50 most common function words) */
    functionWordFrequencies: Record<string, number>;
    /** Punctuation pattern (frequency of . , ; : ! ? -- ... () "") */
    punctuationPattern: Record<string, number>;
    /** Sentence length distribution (buckets: 1-5, 6-10, 11-15, 16-20, 21-30, 31+) */
    sentenceLengthBuckets: number[];
    /** Paragraph length distribution */
    paragraphLengthBuckets: number[];
    /** Fingerprint hash for quick comparison */
    hash: string;
  };

  consistency: {
    /** Burrows' Delta across text sections (lower = more consistent) */
    burrowsDelta: number;
    /** Whether voice is consistent throughout */
    isConsistent: boolean;
    /** Sections where voice shifts detected */
    shiftPoints: { position: number; magnitude: number; description: string; }[];
    /** Consistency score */
    consistencyScore: number;   // 0-10
  };

  aiDetection: {
    /** Overall AI-generation risk (0-100, extends existing aiRiskScorer) */
    overallRisk: number;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high';
    /** Individual signal scores */
    signals: {
      vocabularyUniformity: number;
      sentenceLengthVariance: number;
      genericReflectionDensity: number;
      bannedTermCount: number;
      clicheDensity: number;
      hedgingDensity: number;
      adverbDensity: number;
      /** NEW: Burstiness score (humans write in bursts, AI is uniform) */
      burstiness: number;
      /** NEW: Perplexity estimate (low = AI-like) */
      estimatedPerplexity: number;
    };
    /** Flagged passages with reasons */
    flaggedPassages: { text: string; risk: number; reason: string; }[];
  };

  register: {
    /** Formality level */
    formality: 'formal' | 'semi_formal' | 'casual' | 'mixed';
    /** Register consistency across text */
    registerConsistency: number; // 0-10
    /** Detected register shifts */
    shifts: { position: number; from: string; to: string; }[];
  };

  rhythm: {
    /** Syllable pattern variance (proxy for prosodic rhythm) */
    syllableVariance: number;
    /** Clause length alternation pattern */
    clauseAlternation: number;  // 0-10 (10 = highly varied)
    /** Parallelism detection */
    parallelismCount: number;
    /** Rhythmic quality score */
    rhythmScore: number;        // 0-10
  };

  idiolect: {
    /** Distinctive word choices (statistically unusual for this context) */
    distinctiveWords: string[];
    /** Signature constructions (recurring syntactic patterns) */
    signatureConstructions: string[];
    /** Idiolect strength (how distinctive is this voice?) */
    distinctivenessScore: number; // 0-10
  };
}

// ============================================================================
// COMPOSITE SCORES (derived from all analyzers)
// ============================================================================

interface CompositeScores {
  /** Overall writing quality estimate (0-100) */
  writingQualityEstimate: number;

  /** Per-rubric-dimension computational priors */
  rubricPriors: Record<string, {
    /** Computational prior score (0-10) */
    prior: number;
    /** Confidence in this prior (0-1) */
    confidence: number;
    /** Which signals contributed to this score */
    signals: string[];
  }>;

  /** Quick assessment labels */
  labels: {
    readabilityLevel: string;
    narrativeStrength: 'strong' | 'moderate' | 'weak' | 'absent';
    voiceAuthenticity: 'authentic' | 'mixed' | 'generic' | 'ai_suspected';
    writingMaturity: 'advanced' | 'proficient' | 'developing' | 'basic';
  };

  /** Pre-screening recommendation */
  preScreening: {
    /** Can we confidently assess without LLM? */
    canPreScreen: boolean;
    /** Confidence in pre-screening (0-1) */
    confidence: number;
    /** Reason for pre-screening decision */
    reason: string;
    /** If pre-screening, what would the approximate score be? */
    approximateScore?: number;
  };
}
```

### 3.3 Calibration Output Types

```typescript
// ============================================================================
// SCORING CALIBRATION (Agent 5, post-LLM)
// ============================================================================

interface CalibrationResult {
  /** Calibrated scores per dimension */
  calibratedScores: Record<string, CalibratedScore>;

  /** Overall calibrated score */
  overallScore: {
    raw: number;           // Original LLM score
    calibrated: number;    // After Bayesian updating
    delta: number;         // calibrated - raw
    confidence: number;    // 0-1
  };

  /** Score reliability metrics */
  reliability: {
    /** Cronbach's alpha across dimensions */
    cronbachAlpha: number;
    /** Internal consistency assessment */
    internalConsistency: 'excellent' | 'good' | 'acceptable' | 'questionable' | 'poor';
    /** Dimensions that reduce reliability */
    problematicDimensions: string[];
  };

  /** Disagreement flags */
  disagreements: {
    dimension: string;
    computationalScore: number;
    llmScore: number;
    delta: number;
    direction: 'computational_higher' | 'llm_higher';
    severity: 'minor' | 'moderate' | 'major';
    explanation: string;
  }[];

  /** Constraint violations */
  constraintViolations: {
    constraint: string;
    violated: boolean;
    severity: 'warning' | 'error';
    adjustment: string;
  }[];

  /** Diminishing returns analysis */
  diminishingReturns: {
    dimension: string;
    currentScore: number;
    marginalGain: number;
    effort: 'low' | 'medium' | 'high';
    recommendation: string;
  }[];
}

interface CalibratedScore {
  /** Original LLM score */
  llmScore: number;
  /** Computational prior */
  computationalPrior: number;
  /** Calibrated posterior */
  calibrated: number;
  /** 95% confidence interval */
  confidenceInterval: [number, number];
  /** Agreement level between computational and LLM */
  agreement: 'strong' | 'moderate' | 'weak' | 'contradictory';
}
```

---

## 4. Workshop Integration Points

### 4.1 Common App Workshop (5 Stages, 650 words)

**Full computational profile applies.** All 5 domains run at full capacity.

```
Stage 0 (Context Gathering):
  - Computational: Run FULL analysis, store ComputationalAnalysis in session
  - Integration: computationalAnalysis.stylometric.fingerprint → initial voice profile
  - Integration: computationalAnalysis.narrative.paragraphRoles → detected essay structure

Stage 1 (Foundation Teaching):
  PRE-LLM:
  - Inject into Sonnet prompt: "Computational pre-analysis found:
      Readability: Grade {X} (Flesch-Kincaid: {Y})
      Narrative arc: {shape} with peak at {position}%
      Voice: {authentic|mixed|generic}, AI risk: {low|medium|high}
      Key issues: {clicheCount} cliches, {passiveRatio}% passive voice
      Specificity: {score}/10 ({namedEntityCount} named entities, {numericCount} numbers)
      Missing: {missingElements}"
  - This FOCUSES the LLM on confirmed issues rather than guessing
  POST-LLM:
  - Calibrate dimension scores using Bayesian updater
  - Flag any major disagreements for human review

Stage 2 (Deep Dive):
  PRE-LLM:
  - Feed narrativeAnalysis.showVsTell.improvablePassages into prompt
  - Feed narrativeAnalysis.tensionArc to guide where teaching should focus
  - Feed linguisticAnalysis.cliches.detected for precise cliche identification
  POST-LLM:
  - Validate that LLM-suggested rewrites maintain voice consistency
    (quickVoiceCheck against stored fingerprint)

Stage 3 (Grammar & Craft):
  PRE-LLM:
  - linguisticAnalysis.sentenceFeatures (fragments, run-ons, monotony)
  - linguisticAnalysis.posDistribution (passive voice locations)
  - stylometricAnalysis.rhythm (parallelism, clause variety)
  INDEPENDENT (instant feedback):
  - Return sentence-level metrics immediately while LLM processes

Stage 4 (Synthesis):
  PRE-LLM:
  - Full ComputationalAnalysis feeds into synthesis prompt
  - informationTheoreticAnalysis.mutualInformation validates thematic coherence
  POST-LLM:
  - Final calibration of all scores
  - Generate confidence intervals for each dimension

Stage 5 (Sentence-Level):
  PRE-LLM:
  - linguisticAnalysis.specificity for concrete vs. abstract detection
  - stylometricAnalysis.idiolect for voice-preserving suggestions
  - linguisticAnalysis.emotion for emotional resonance mapping
  INDEPENDENT:
  - Immediate specificity scoring per sentence
  - Immediate cliche flagging per sentence
```

### 4.2 PIQ Workshop (350 words)

**Reduced narrative analysis** due to shorter text, but other domains still valuable.

```
Workshop Profile: PIQ_350

Adjustments:
  - Narrative: REDUCED
    - paragraphRoles: Max 3-4 paragraphs, roles still detectable
    - tensionArc: Fewer data points, use sentence-level instead of paragraph-level
    - transformation: Still works (first half vs. second half)
    - temporalFlow: SIMPLIFIED (fewer markers expected)
    - showVsTell: Still works, crucial for short-form
  - InfoTheory: REDUCED
    - Sliding window size reduced from 50 to 25 words
    - Mutual information: halve only (intro/concl too small)
    - Compression ratio: Still meaningful
  - Linguistic: FULL (even more critical in short form -- every word matters)
  - Stylometric: FULL (voice matters enormously in PIQ)

Key PIQ-Specific Metrics:
  - Words per insight: totalWords / reflectionCount (target: <40)
  - Specificity density: namedEntities / totalWords (should be HIGHER than 650-word essays)
  - Cliche impact: Each cliche costs more in 350 words (weight 2x)

Integration Points:
  Stage 1 (Conceptual Foundation):
    - computationalAnalysis.linguistic.vocabulary.sophisticationScore
    - computationalAnalysis.narrative.showVsTell (critical in short form)
    - "In 350 words, the student uses {X}% concrete language vs {Y}% abstract"

  Stage 2 (Deep Teaching):
    - computationalAnalysis.linguistic.specificity (every vague word matters more)
    - computationalAnalysis.informationTheoretic.densityVariation
      (identify low-density regions that waste precious word count)

  Stage 3+ (Grammar, Synthesis):
    - Same as Common App but with tighter thresholds
    - Flag any sentence >25 words as potential compression target
```

### 4.3 Activity Workshop (150 characters)

**Minimal text -- only specific techniques work.** Most narrative and info-theoretic analyses are meaningless at this scale.

```
Workshop Profile: ACTIVITY_150

Active Analyzers:
  Linguistic: MINIMAL
    - vocabulary.sophisticationScore (every word choice matters)
    - posDistribution.activeVerbDensity (action verbs per word -- critical)
    - specificity.numericEvidenceCount (numbers in 150 chars = high impact)
    - specificity.vagueQuantifierCount (any vague word is a waste)
    - cliches.detected (any cliche in 150 chars is devastating)
    - readability: SKIP (too short to be meaningful)
    - discourse: SKIP (no multi-paragraph structure)
    - emotion: SKIP (too short)

  Narrative: SKIP entirely

  InfoTheory: SKIP entirely

  Stylometric: MINIMAL
    - formality check (should be semi-formal, not casual or academic)
    - cliche check (extends linguistic cliche detection)
    - AI detection: REDUCED (sentence-level checks only)

  Calibration: ADAPTED
    - Different Bayesian priors for short text
    - Higher weight on word choice density
    - Lower weight on narrative structure

Integration Points:
  Stage 0 (Story Detection) [Haiku]:
    - computationalAnalysis.linguistic.posDistribution.activeVerbDensity
    - computationalAnalysis.linguistic.specificity.numericEvidenceCount

  Stage 1 (Analysis + Scoring) [Sonnet]:
    PRE-LLM: "Description pre-analysis:
      Active verb density: {X} per word (target: >0.15)
      Numeric evidence: {count} (target: >=1)
      Vague quantifiers: {count} (target: 0)
      Cliches detected: {list}
      Characters used: {count}/150 ({utilization}% utilization)
      Specificity score: {score}/10"
    POST-LLM: Calibrate description quality scores

  Scoring Orchestrator:
    - Feed computationalAnalysis into descriptionScoringService prompt
    - Use computational specificity score as prior for description score
    - Flag descriptions with <100 characters as potentially underdeveloped
```

---

## 5. Performance Budget

### 5.1 Time Allocation

| Component | Budget | Notes |
|-----------|--------|-------|
| Text Preparation | 2ms | Tokenize, split sentences, extract paragraphs, word frequency map |
| Linguistic Analyzer | 15ms | Most feature-rich; dictionary lookups are O(1) with Sets/Maps |
| Narrative Analyzer | 12ms | Paragraph role classification uses word-list heuristics |
| Information-Theoretic Analyzer | 10ms | Entropy calculation is O(n), compression uses DEFLATE |
| Stylometric Analyzer | 8ms | Extends existing aiRiskScorer (~50ms) but optimized |
| Merge & Composite | 3ms | Combine results, calculate composite scores |
| **Total** | **50ms** | |
| Scoring Calibrator (post-LLM) | 5ms | Bayesian math, constraint checking |

### 5.2 Parallelization Strategy

```
Time:  0ms ──── 2ms ──── 15ms ──── 17ms ──── 50ms
       │         │         │          │          │
       └─ prep ──┼── ling ─┤          │          │
                  ├── narr ─┤          │          │
                  ├── info ─┤          │          │
                  └── styl ─┘          │          │
                             └─ merge ─┘          │
                                        └─ done ──┘
```

All four analyzers start immediately after preparation completes. Since they are all CPU-bound (no I/O), they run in the same event loop tick. In practice, JavaScript's single-threaded execution means they run sequentially, but we minimize overhead by:

1. **Shared tokenization** -- no re-splitting text
2. **Pre-built dictionaries** -- loaded at startup as `Set` and `Map`
3. **Early termination** -- skip analyses irrelevant to workshop profile
4. **Lazy sub-analyzers** -- within each analyzer, skip expensive sub-analyses when simpler metrics already provide clear signal

### 5.3 Lazy Evaluation Rules

```typescript
const LAZY_RULES: LazyEvaluationRules = {
  // If word count < 30, skip everything except basic specificity
  ultraShortText: {
    condition: (prep) => prep.wordCount < 30,
    skip: ['narrative', 'informationTheoretic', 'stylometric.rhythm', 'stylometric.consistency'],
  },

  // If clearly AI-generated (risk > 80 from quick check), skip narrative quality
  clearlyAI: {
    condition: (prep, partial) => partial.stylometric?.aiDetection?.overallRisk > 80,
    skip: ['narrative.tensionArc', 'narrative.resolution', 'narrative.showVsTell'],
  },

  // If no paragraphs detected, skip paragraph-level analysis
  noParagraphs: {
    condition: (prep) => prep.paragraphCount <= 1,
    skip: ['narrative.paragraphRoles', 'narrative.coherence', 'informationTheoretic.mutualInformation'],
  },

  // Activity descriptions: run minimal profile
  activityProfile: {
    condition: (prep) => prep.workshopType === 'activity',
    skip: ['narrative', 'informationTheoretic', 'stylometric.rhythm', 'stylometric.consistency'],
  },
};
```

---

## 6. Data Flow Architecture

### 6.1 Service Composition

```
WritingQualityEngine (singleton)
├── TextPreparer
│     └── tokenize(), splitSentences(), extractParagraphs(), buildWordFrequencyMap()
│
├── LinguisticAnalyzer
│     ├── ReadabilityCalculator        (Flesch-Kincaid, Coleman-Liau, ARI)
│     ├── POSAnalyzer                  (verb/noun/adj ratios, passive voice)
│     ├── VocabularyAnalyzer           (MATTR, frequency bands, AWL, hapax)
│     │     ├── data/academicWordList.ts
│     │     └── data/wordFrequencyBands.ts
│     ├── SentenceFeatureExtractor     (opener entropy, monotony, fragments)
│     ├── DiscourseAnalyzer            (transitions, adversatives)
│     │     └── data/transitionDictionary.ts
│     ├── SpecificityDetector          (concrete/abstract, named entities)
│     ├── EmotionAnalyzer              (NRC lexicon, cognitive process)
│     │     └── data/emotionLexicon.ts
│     └── ClicheDetector              (dead phrases, extends existing)
│           └── data/clicheDictionary.ts
│
├── NarrativeAnalyzer
│     ├── ParagraphClassifier          (6 roles via word-list heuristics)
│     ├── TensionArcDetector           (Vonnegut shapes, valence curves)
│     ├── TransformationDetector       (first-half vs second-half features)
│     ├── TemporalFlowAnalyzer         (marker extraction, pattern classification)
│     ├── CoherenceScorer              (Jaccard between paragraphs)
│     ├── ShowTellDetector             (signal dictionaries)
│     │     └── data/showTellSignals.ts
│     ├── StakesDetector               (5 types, conditional patterns)
│     │     └── data/stakesDictionary.ts
│     └── ResolutionAnalyzer           (ending types, circular return)
│
├── InformationTheoreticAnalyzer
│     ├── EntropyCalculator            (word + character level Shannon entropy)
│     ├── SurprisalEstimator           (n-gram based, pre-built bigram table)
│     ├── CompressionAnalyzer          (DEFLATE-based compression ratio)
│     ├── DensityVariationTracker      (sliding window entropy)
│     ├── MutualInformationCalculator  (section-to-section MI)
│     └── ZipfAnalyzer                 (word frequency distribution analysis)
│
├── StylometricAnalyzer
│     ├── FingerprintGenerator         (function words + punctuation + lengths)
│     ├── ConsistencyChecker           (Burrows' Delta across sections)
│     ├── AIDetectionService           (EXTENDS existing AIRiskScorer)
│     ├── RegisterAnalyzer             (formality detection)
│     ├── RhythmAnalyzer               (syllable variance, clause alternation)
│     └── IdiolectDetector             (distinctive word choices, constructions)
│
├── ScoringCalibrator
│     ├── BayesianUpdater              (prior + likelihood → posterior)
│     ├── ConstraintSolver             (score coherence rules)
│     ├── ReliabilityChecker           (Cronbach's alpha)
│     └── DiminishingReturnsAnalyzer   (marginal NQI gain per dimension)
│
├── PromptEnricher
│     ├── CommonAppAdapter             (650-word full enrichment)
│     ├── PIQAdapter                   (350-word adapted enrichment)
│     └── ActivityAdapter              (150-char minimal enrichment)
│
└── AnalysisCacheService
      ├── InMemoryLRU                  (1000-entry essay cache, keyed by text hash)
      └── VoiceFingerprintStore        (persistent cross-session fingerprints)
```

### 6.2 Engine Entry Points

```typescript
class WritingQualityEngine {
  /**
   * Full analysis -- runs all applicable analyzers for the workshop type.
   * Returns ComputationalAnalysis in <50ms.
   */
  analyze(text: string, options: AnalysisOptions): ComputationalAnalysis;

  /**
   * Generate prompt enrichment section for LLM injection.
   * Call this BEFORE making an LLM call.
   */
  enrichPrompt(analysis: ComputationalAnalysis, workshopType: WorkshopType): string;

  /**
   * Calibrate LLM scores using computational priors.
   * Call this AFTER receiving LLM scores.
   */
  calibrate(
    llmScores: Record<string, number>,
    analysis: ComputationalAnalysis,
    options?: CalibrationOptions
  ): CalibrationResult;

  /**
   * Instant feedback -- subset of analysis for immediate UI display.
   * No LLM needed. Returns in <10ms.
   */
  instantFeedback(text: string, workshopType: WorkshopType): InstantFeedback;

  /**
   * Compare voice fingerprint against stored profile.
   * Used to validate LLM suggestions preserve voice.
   */
  checkVoiceConsistency(
    text: string,
    profile: StudentVoiceProfile
  ): VoiceConsistencyResult;

  /**
   * Track voice evolution across revisions.
   * Returns how the voice has changed.
   */
  trackVoiceEvolution(
    versions: { text: string; timestamp: string }[]
  ): VoiceEvolutionReport;
}
```

---

## 7. Caching & Persistence Strategy

### 7.1 Cache Architecture

```
                 HOT CACHE                    WARM CACHE                COLD STORAGE
              (In-Memory LRU)              (Supabase RPC)             (Supabase Tables)
             ┌─────────────────┐       ┌──────────────────┐      ┌──────────────────┐
Per-Essay    │ text_hash →     │       │                  │      │ writing_analytics│
Analysis     │ ComputationalA. │       │ (not needed;     │      │ table: store     │
             │ TTL: 1 hour     │       │  recompute is    │      │ analysis results │
             │ Max: 1000       │       │  cheap at <50ms) │      │ for historical   │
             └─────────────────┘       └──────────────────┘      │ comparison       │
                                                                  └──────────────────┘

Voice        ┌─────────────────┐                                  ┌──────────────────┐
Fingerprint  │ userId →        │                                  │ voice_profiles   │
             │ VoiceFingerprint│                                  │ table: persistent│
             │ TTL: session    │                                  │ fingerprint      │
             └─────────────────┘                                  │ storage          │
                                                                  └──────────────────┘

Cross-Essay  │ (not cached;                                       ┌──────────────────┐
Comparison   │  compared on                                       │ writing_analytics│
             │  demand)                                            │ + essay versions │
                                                                  └──────────────────┘
```

### 7.2 What Gets Cached Where

| Data | In-Memory | Supabase | Rationale |
|------|-----------|----------|-----------|
| ComputationalAnalysis per essay | LRU cache, 1hr TTL | Optional (for analytics) | Recomputation is cheap (<50ms), but caching avoids redundant work during same session |
| Voice Fingerprint | Session cache | `voice_profiles` table | Must persist across sessions for voice tracking |
| Historical Analysis Scores | No | `writing_analytics` table | Needed for version comparison and progress tracking |
| Data Dictionaries (AWL, emotion lexicon, etc.) | Module-level constants | No | Loaded once at startup, never changes at runtime |
| Bigram Frequency Table | Module-level Map | No | ~2MB pre-built table, loaded once |

### 7.3 Cache Key Design

```typescript
// Per-essay cache key: SHA-256 hash of normalized text + workshop type
function getCacheKey(text: string, workshopType: WorkshopType): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${workshopType}:${sha256(normalized)}`;
}
```

---

## 8. Configuration & Feature Flags

### 8.1 Configuration System

```typescript
interface WritingQualityConfig {
  /** Global enable/disable for the entire engine */
  enabled: boolean;

  /** Current operating mode */
  mode: 'shadow' | 'enrichment' | 'calibration' | 'full';

  /** Workshop-specific configurations */
  workshops: {
    commonApp: WorkshopAnalysisProfile;
    piq: WorkshopAnalysisProfile;
    activity: WorkshopAnalysisProfile;
  };

  /** A/B testing configuration */
  abTesting: {
    enabled: boolean;
    /** Percentage of requests that get computational enrichment (0-100) */
    enrichmentPercentage: number;
    /** Percentage of requests that get score calibration (0-100) */
    calibrationPercentage: number;
    /** Percentage of requests eligible for pre-screening (0-100) */
    preScreenPercentage: number;
  };

  /** Performance thresholds */
  performance: {
    /** Maximum total computation time before aborting (ms) */
    maxComputationMs: number;
    /** Whether to log timing data */
    logTiming: boolean;
    /** Whether to log analysis results (verbose, for shadow mode) */
    logResults: boolean;
  };

  /** Pre-screening configuration */
  preScreening: {
    enabled: boolean;
    /** Minimum confidence to pre-screen (0-1) */
    confidenceThreshold: number;
    /** Maximum word count for pre-screening */
    maxWordCount: number;
    /** Pre-screening only for these workshop types */
    eligibleWorkshops: WorkshopType[];
  };

  /** Calibration tuning */
  calibration: {
    /** Weight given to computational prior vs LLM score (0-1) */
    priorWeight: number;
    /** Disagreement threshold for flagging (score delta) */
    disagreementThreshold: number;
  };
}

interface WorkshopAnalysisProfile {
  /** Which analyzers to run */
  analyzers: {
    linguistic: boolean | 'full' | 'minimal';
    narrative: boolean | 'full' | 'reduced';
    informationTheoretic: boolean | 'full' | 'reduced';
    stylometric: boolean | 'full' | 'minimal';
  };
  /** Custom thresholds */
  thresholds?: Record<string, number>;
}

type WorkshopType = 'common_app' | 'piq' | 'activity';
type AnalyzerName = 'linguistic' | 'narrative' | 'informationTheoretic' | 'stylometric';
```

### 8.2 Default Configuration

```typescript
const DEFAULT_CONFIG: WritingQualityConfig = {
  enabled: true,
  mode: 'shadow', // Start in shadow mode (Phase 1)

  workshops: {
    commonApp: {
      analyzers: {
        linguistic: 'full',
        narrative: 'full',
        informationTheoretic: 'full',
        stylometric: 'full',
      },
    },
    piq: {
      analyzers: {
        linguistic: 'full',
        narrative: 'reduced',
        informationTheoretic: 'reduced',
        stylometric: 'full',
      },
    },
    activity: {
      analyzers: {
        linguistic: 'minimal',
        narrative: false,
        informationTheoretic: false,
        stylometric: 'minimal',
      },
    },
  },

  abTesting: {
    enabled: false,
    enrichmentPercentage: 0,
    calibrationPercentage: 0,
    preScreenPercentage: 0,
  },

  performance: {
    maxComputationMs: 50,
    logTiming: true,
    logResults: false,
  },

  preScreening: {
    enabled: false,
    confidenceThreshold: 0.85,
    maxWordCount: 100,
    eligibleWorkshops: ['activity'],
  },

  calibration: {
    priorWeight: 0.3,
    disagreementThreshold: 2.0,
  },
};
```

### 8.3 Runtime Override via Environment

```bash
# Enable shadow mode logging
WRITING_QUALITY_LOG_RESULTS=true

# Enable prompt enrichment for A/B test
WRITING_QUALITY_MODE=enrichment
WRITING_QUALITY_AB_ENRICHMENT=50  # 50% of requests

# Enable pre-screening for activity descriptions
WRITING_QUALITY_PRESCREEN=true
WRITING_QUALITY_PRESCREEN_CONFIDENCE=0.9
```

---

## 9. Migration Strategy

### Phase 1: Shadow Mode (Week 1-2)

**Goal:** Run computational analysis alongside existing pipeline. Log results but do not use them. Collect calibration data.

```
Existing Pipeline (unchanged):
  Essay → [LLM Analysis] → Scores → Output

Shadow Pipeline (NEW, runs in parallel):
  Essay → [WritingQualityEngine.analyze()] → ComputationalAnalysis → LOG
```

**Implementation:**
1. Add `WritingQualityEngine` service with all analyzers
2. In `src/core/analysis/engine.ts`, after feature extraction, add:
   ```typescript
   // Shadow mode: run computational analysis alongside (non-blocking)
   if (writingQualityConfig.enabled && writingQualityConfig.mode === 'shadow') {
     const compAnalysis = writingQualityEngine.analyze(entry.description_original, {
       workshopType: 'activity',
     });
     console.log('[WritingQuality:Shadow]', JSON.stringify({
       textHash: compAnalysis.input.textHash,
       compositeScores: compAnalysis.compositeScores,
       performance: compAnalysis.performance,
     }));
   }
   ```
3. In `src/services/orchestrator/essayOrchestrator.ts`, add shadow logging
4. In `src/services/commonAppWorkshop/services/stage1Service.ts`, add shadow logging

**Success Criteria:**
- Engine runs without errors for 1000+ essays
- All analyses complete within 50ms budget
- Computational predictions correlate with LLM scores (r > 0.5)
- No impact on existing pipeline latency

### Phase 2: Prompt Enrichment (Week 3-4)

**Goal:** Feed computational findings into LLM prompts for more focused analysis.

```
Enhanced Pipeline:
  Essay → [WritingQualityEngine.analyze()] → ComputationalAnalysis
    → [promptEnricher.enrich()] → enriched system prompt
    → [LLM Analysis with enriched prompt] → Scores → Output
```

**Implementation:**
1. Create `PromptEnricher` with workshop-specific adapters
2. Modify LLM call sites to inject computational pre-analysis:
   - `src/core/analysis/scoring/categoryScorer.ts` -- inject into scoring prompts
   - `src/services/commonAppWorkshop/services/stage1Service.ts` -- inject into teaching prompt
   - `src/services/orchestrator/essayOrchestrator.ts` -- inject into analysis prompts
   - `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts`
3. A/B test: 50% of requests get enriched prompts

**Success Criteria:**
- LLM scores are more consistent (lower variance across retries)
- LLM output tokens decrease by 15-20% (more focused responses)
- Qualitative review shows improved issue detection accuracy
- No score inflation or deflation vs. control group

### Phase 3: Score Calibration (Week 5-6)

**Goal:** Use Bayesian updating to combine computational priors with LLM posteriors.

```
Calibrated Pipeline:
  Essay → [WritingQualityEngine.analyze()] → ComputationalAnalysis
    → [promptEnricher.enrich()] → enriched prompt
    → [LLM Analysis] → llmScores
    → [scoringCalibrator.calibrate(llmScores, compAnalysis)] → CalibratedOutput
```

**Implementation:**
1. Build `ScoringCalibrator` with Bayesian updater and constraint solver
2. Modify score assembly in:
   - `src/core/analysis/engine.ts` (Stage 4: NQI Calculation)
   - `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts`
3. Start with low prior weight (0.2) and increase based on validation
4. Add constraint satisfaction rules based on computational signals

**Success Criteria:**
- Calibrated scores show higher reliability (Cronbach's alpha > 0.8)
- Score disagreement flags catch genuine LLM hallucinations
- Confidence intervals are well-calibrated (95% CI covers true score 95% of time)

### Phase 4: Pre-Screening (Week 7-8)

**Goal:** Skip LLM for high-confidence computational assessments.

```
Pre-Screened Pipeline:
  Essay → [WritingQualityEngine.analyze()] → ComputationalAnalysis
    → IF compositeScores.preScreening.canPreScreen AND confidence > 0.85:
        → Return computational scores directly (no LLM, ~50ms)
    → ELSE:
        → Normal enriched + calibrated pipeline
```

**Implementation:**
1. Build pre-screening decision logic in `CompositeScores`
2. Integrate into the existing heuristic fallback paths in `src/http/routes.ts`
   (the three fallback paths already return heuristic scores -- replace with better ones)
3. Start with activity descriptions only (150 chars, highest pre-screening potential)
4. Expand to very short essays and clearly weak drafts

**Success Criteria:**
- Pre-screened results within 1 point of full LLM analysis (validated on holdout set)
- 15-20% of activity analyses pre-screened successfully
- Cost reduction of 20-30% on activity workshop LLM calls

---

## 10. Cost Impact Analysis

### 10.1 Current Cost Structure

| Workshop | LLM Calls per Analysis | Estimated Cost per Analysis |
|----------|----------------------|---------------------------|
| Activity Workshop (10 activities) | 4-6 Sonnet calls (scoring) + 2-4 Haiku/Sonnet (stages) | $0.10-0.25 |
| Common App Workshop (per stage) | 1-3 Sonnet calls | $0.03-0.08 |
| PIQ Workshop | 7+ parallel Sonnet calls | $0.15-0.30 |
| Experience Analysis (11 categories) | 11 parallel Sonnet calls | $0.15-0.25 |

### 10.2 Projected Savings by Phase

| Phase | Mechanism | Estimated Savings |
|-------|-----------|-------------------|
| Phase 1 (Shadow) | None (logging only) | $0 |
| Phase 2 (Enrichment) | More focused prompts = fewer output tokens (20-30% reduction) | 10-15% cost reduction |
| Phase 3 (Calibration) | Fewer retries needed (calibrated scores are more reliable) | 5-10% additional |
| Phase 4 (Pre-Screening) | Skip LLM for confident cases (15-20% of activity, 5-10% of essays) | 10-20% additional |
| **Combined (Phase 4)** | **All mechanisms** | **25-40% total reduction** |

### 10.3 Detailed Savings Calculation

**Activity Workshop (highest volume):**
- Current: 10 activities x $0.015/activity (scoring) = $0.15 per portfolio
- Phase 2: More focused prompts save ~20% output tokens = $0.12 per portfolio
- Phase 3: ~10% fewer retries = $0.11 per portfolio
- Phase 4: Pre-screen 2/10 activities computationally = $0.09 per portfolio
- **Total savings: ~40% ($0.06 per portfolio)**

**Common App Workshop:**
- Current: ~$0.05 per stage, 5 stages = $0.25 total
- Phase 2: Enriched prompts → more focused feedback = $0.20 total
- Phase 3: Calibrated scores → skip conditional deep dives = $0.17 total
- **Total savings: ~30% ($0.08 per workshop)**

**At 1000 analyses/month:**
- Activity: 1000 x $0.06 savings = $60/month
- Common App: 500 x $0.08 savings = $40/month
- PIQ: 300 x $0.05 savings = $15/month
- **Total: ~$115/month** in API cost reduction

### 10.4 Non-Cost Benefits

1. **Instant feedback** -- users see readability, cliche, and specificity scores immediately while LLM processes (better UX)
2. **Deterministic baseline** -- same essay always gets same computational scores (reproducibility)
3. **Offline capability** -- computational analysis works without API key (supports the existing fallback paths)
4. **Quality monitoring** -- computational/LLM disagreements flag potential issues
5. **Voice preservation** -- computational voice checks validate LLM suggestions in real-time

---

## 11. File Structure

```
src/services/writingQuality/
├── index.ts                              # Public API exports
├── types.ts                              # All TypeScript interfaces (from Section 3)
├── engine.ts                             # WritingQualityEngine class (singleton)
├── config.ts                             # Configuration system + defaults
│
├── prepared/
│   ├── textPreparer.ts                   # Shared tokenization, sentence/paragraph splitting
│   └── types.ts                          # PreparedText interface
│
├── analyzers/
│   ├── linguisticAnalyzer.ts             # Agent 1: All linguistic analyses
│   ├── narrativeAnalyzer.ts              # Agent 2: All narrative structure analyses
│   ├── informationTheoreticAnalyzer.ts   # Agent 3: All info-theory analyses
│   ├── stylometricAnalyzer.ts            # Agent 4: All stylometric analyses (extends aiRiskScorer)
│   └── index.ts                          # Re-exports
│
├── calibration/
│   ├── scoringCalibrator.ts              # Agent 5: Main calibration orchestrator
│   ├── bayesianUpdater.ts                # Computational prior + LLM posterior
│   ├── constraintSolver.ts              # Score coherence rules
│   ├── reliabilityChecker.ts            # Cronbach's alpha, internal consistency
│   ├── diminishingReturns.ts            # Marginal gain analysis
│   └── index.ts
│
├── integration/
│   ├── promptEnricher.ts                 # ComputationalAnalysis → LLM prompt text
│   ├── commonAppAdapter.ts               # Common App workshop adapter
│   ├── piqAdapter.ts                     # PIQ workshop adapter
│   ├── activityAdapter.ts                # Activity workshop adapter
│   └── index.ts
│
├── persistence/
│   ├── analysisCacheService.ts           # In-memory LRU cache
│   ├── voiceFingerprintStore.ts          # Cross-session voice persistence
│   └── index.ts
│
└── data/
    ├── academicWordList.ts               # Academic Word List (570 word families)
    ├── wordFrequencyBands.ts             # Word frequency bands (top 10K words)
    ├── emotionLexicon.ts                 # NRC emotion lexicon (simplified)
    ├── transitionDictionary.ts           # Discourse markers and transitions
    ├── clicheDictionary.ts               # Dead phrases and cliches (extends existing)
    ├── showTellSignals.ts                # Show-vs-tell detection signals
    ├── stakesDictionary.ts               # Stakes pattern dictionary
    ├── functionWords.ts                  # Top 50 function words for fingerprinting
    └── bigramTable.ts                    # Pre-computed bigram frequencies for surprisal
```

**File count:** ~30 files
**Estimated total code:** ~4000-5000 lines (excluding data dictionaries)
**Data dictionaries:** ~2000-3000 lines (word lists, lexicons)

---

## 12. Complete TypeScript Interfaces

The full interface definitions are provided in Section 3 above. Here is the engine class signature:

```typescript
// src/services/writingQuality/engine.ts

import type {
  ComputationalAnalysis,
  CalibrationResult,
  InstantFeedback,
  VoiceConsistencyResult,
  VoiceEvolutionReport,
  WritingQualityConfig,
  WorkshopType,
  CalibrationOptions,
} from './types';
import type { StudentVoiceProfile } from '../voiceProfile/types';

export class WritingQualityEngine {
  private config: WritingQualityConfig;
  private textPreparer: TextPreparer;
  private linguisticAnalyzer: LinguisticAnalyzer;
  private narrativeAnalyzer: NarrativeAnalyzer;
  private infoTheoreticAnalyzer: InformationTheoreticAnalyzer;
  private stylometricAnalyzer: StylometricAnalyzer;
  private scoringCalibrator: ScoringCalibrator;
  private promptEnricher: PromptEnricher;
  private cache: AnalysisCacheService;

  constructor(config?: Partial<WritingQualityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Initialize all sub-services...
  }

  /**
   * Full computational analysis. <50ms, zero API cost.
   * Results are cached by text hash + workshop type.
   */
  analyze(text: string, options: {
    workshopType: WorkshopType;
    forceRefresh?: boolean;
  }): ComputationalAnalysis {
    // 1. Check cache
    // 2. Prepare text (shared tokenization)
    // 3. Run applicable analyzers in parallel
    // 4. Compute composite scores
    // 5. Cache and return
  }

  /**
   * Generate prompt enrichment text for LLM injection.
   * Produces a ~200-400 token text block.
   */
  enrichPrompt(
    analysis: ComputationalAnalysis,
    workshopType: WorkshopType,
    targetDimensions?: string[]
  ): string {
    // Delegates to appropriate workshop adapter
  }

  /**
   * Calibrate LLM scores using computational priors.
   * Call AFTER receiving LLM response.
   */
  calibrate(
    llmScores: Record<string, number>,
    analysis: ComputationalAnalysis,
    options?: CalibrationOptions
  ): CalibrationResult {
    // 1. Bayesian update: prior (computational) + likelihood (LLM) → posterior
    // 2. Check constraint satisfaction
    // 3. Calculate reliability metrics
    // 4. Identify disagreements
    // 5. Analyze diminishing returns
  }

  /**
   * Instant feedback -- returns in <10ms.
   * Subset of analysis for immediate UI display.
   */
  instantFeedback(text: string, workshopType: WorkshopType): InstantFeedback {
    // Quick-return metrics that don't need full analysis:
    // - readability score
    // - word count / character count
    // - cliche detection
    // - AI risk score
    // - passive voice ratio
    // - specificity score (basic)
  }

  /**
   * Check voice consistency against stored profile.
   */
  checkVoiceConsistency(
    text: string,
    profile: StudentVoiceProfile
  ): VoiceConsistencyResult {
    // Extends existing StyleConsistencyService.quickVoiceCheck
  }

  /**
   * Track voice evolution across essay versions.
   */
  trackVoiceEvolution(
    versions: { text: string; timestamp: string }[]
  ): VoiceEvolutionReport {
    // Generate fingerprints for each version
    // Calculate Burrows' Delta between consecutive versions
    // Detect voice drift or improvement
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(updates: Partial<WritingQualityConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Singleton export (follows Uplift service pattern)
export const writingQualityEngine = new WritingQualityEngine();
```

---

## 13. Existing Code Integration Map

### 13.1 Code We EXTEND (Not Replace)

| Existing File | What It Does Now | How We Extend It |
|---------------|-----------------|------------------|
| `src/core/analysis/features/extractor.ts` | Basic feature extraction (voice, evidence, arc, collaboration, reflection) | WritingQualityEngine incorporates these as a subset; extractor.ts continues to work independently for the existing pipeline |
| `src/core/analysis/features/authenticityDetector.ts` | Manufactured phrase detection, forced arc patterns | StylometricAnalyzer extends with burstiness, perplexity, Burrows' Delta |
| `src/services/authenticity/aiRiskScorer.ts` | 7-signal AI risk scoring, <50ms | StylometricAnalyzer.aiDetection wraps and extends with 2 new signals |
| `src/services/voiceProfile/styleConsistencyService.ts` | Quick voice check against profile | WritingQualityEngine.checkVoiceConsistency delegates to this + adds fingerprint comparison |
| `src/services/analytics/versionComparisonService.ts` | Score delta comparison | ScoringCalibrator.diminishingReturns extends with marginal gain analysis |
| `src/core/rubrics/v1.0.0.ts` | 11-category rubric weights | CompositeScores.rubricPriors produces computational priors for all 11 categories |

### 13.2 Code We INJECT INTO (Modification Points)

| File | Integration Point | Phase |
|------|------------------|-------|
| `src/core/analysis/engine.ts` | After `extractFeatures()`, before `scoreAllCategories()` -- inject computational analysis as prompt enrichment for category scoring prompts | Phase 2 |
| `src/core/analysis/engine.ts` | After `calculateNQI()` -- calibrate final NQI with computational priors | Phase 3 |
| `src/http/routes.ts` `/analyze-entry` | In the heuristic fallback paths (lines 107-303, 312-449, 524-657) -- replace crude heuristics with WritingQualityEngine.analyze() for much better computational-only scoring | Phase 4 |
| `src/services/orchestrator/essayOrchestrator.ts` | Before `Promise.all([...universalPromises])` -- inject computational pre-analysis into each analyzer's prompt | Phase 2 |
| `src/services/commonAppWorkshop/services/stage1Service.ts` | Before Sonnet teaching call -- inject computational findings | Phase 2 |
| `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts` | Before description scoring LLM call -- inject specificity/cliche/action-verb analysis | Phase 2 |
| `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts` | After portfolio scoring -- calibrate scores | Phase 3 |

### 13.3 Existing Heuristic Scoring We REPLACE

The three fallback paths in `src/http/routes.ts` (lines 107-657) currently use crude regex-based heuristics to score 11 rubric dimensions when the LLM is unavailable. These heuristics produce scores like:

```typescript
// Current (crude):
let base = 1.5;
if (hasStory) base += 1;
if (hasEmotion) base += 1.5;
```

The WritingQualityEngine replaces these with dramatically better computational analysis:

```typescript
// Replacement (Phase 4):
const analysis = writingQualityEngine.analyze(text, { workshopType: 'activity' });
const scores = analysis.compositeScores.rubricPriors;
// Each dimension now has a grounded computational prior with confidence interval
```

This is the single highest-impact change: upgrading the heuristic fallback from ~20 regex patterns to ~200 computational signals.

---

## Appendix A: InstantFeedback Interface

```typescript
/**
 * Subset of computational analysis returned in <10ms.
 * Used for immediate UI feedback while LLM processes.
 */
interface InstantFeedback {
  wordCount: number;
  characterCount: number;
  readabilityGrade: number;
  passiveVoiceRatio: number;
  cliches: { phrase: string; position: number; }[];
  aiRisk: { level: 'low' | 'medium' | 'high'; score: number; };
  specificityScore: number;     // 0-10
  sentenceVariety: number;      // 0-10
  actionVerbDensity: number;    // Per sentence
  vagueQuantifiers: string[];
  /** Quick labels for UI display */
  labels: {
    readability: string;        // "Grade 10"
    voice: string;              // "Authentic" | "Mixed" | "Generic"
    specificity: string;        // "Concrete" | "Moderate" | "Vague"
  };
}
```

## Appendix B: Constraint Rules for Scoring Calibrator

```typescript
/**
 * Score coherence rules.
 * These catch cases where LLM scores are internally inconsistent
 * or contradict computational evidence.
 */
const CONSTRAINT_RULES: ConstraintRule[] = [
  {
    name: 'high_narrative_requires_temporal_markers',
    check: (llm, comp) =>
      llm.narrative_arc_stakes >= 8 && comp.narrative.temporalFlow.markers.length < 2,
    message: 'High narrative arc score but few temporal markers detected',
    adjustment: 'reduce narrative_arc_stakes by 1-2 points',
  },
  {
    name: 'high_voice_consistent_with_authenticity',
    check: (llm, comp) =>
      llm.voice_integrity >= 8 && comp.stylometric.aiDetection.overallRisk > 60,
    message: 'High voice score but AI detection signals are elevated',
    adjustment: 'cap voice_integrity at 6',
  },
  {
    name: 'high_specificity_requires_evidence',
    check: (llm, comp) =>
      llm.specificity_evidence >= 8 && comp.linguistic.specificity.numericEvidenceCount === 0,
    message: 'High specificity score but no numeric evidence found',
    adjustment: 'reduce specificity_evidence by 1-2 points',
  },
  {
    name: 'reflection_requires_learning_language',
    check: (llm, comp) =>
      llm.reflection_meaning >= 8 && comp.linguistic.emotion.cognitiveProcessDensity < 0.01,
    message: 'High reflection score but no cognitive process language detected',
    adjustment: 'reduce reflection_meaning by 1 point',
  },
  {
    name: 'craft_consistent_with_readability',
    check: (llm, comp) =>
      llm.craft_language_quality >= 8 && comp.linguistic.sentenceFeatures.runOnCount > 3,
    message: 'High craft score but multiple run-on sentences detected',
    adjustment: 'reduce craft_language_quality by 1-2 points',
  },
  {
    name: 'short_text_score_ceiling',
    check: (llm, comp) =>
      comp.input.wordCount < 80 && Object.values(llm).some(s => s > 7),
    message: 'Short text cannot score above 7 on any dimension',
    adjustment: 'cap all dimensions at 7 for texts under 80 words',
  },
];
```

---

*This document is the architectural blueprint for the WritingQualityEngine. Implementation should follow the phased migration strategy in Section 9, starting with shadow mode (Phase 1) to validate computational predictions before any production integration.*
