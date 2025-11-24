/**
 * Narrative Workshop Type System
 *
 * World-class type definitions for the most sophisticated narrative analysis
 * and generation system ever built. This system performs multi-layered deep
 * analysis through multiple LLM calls and deterministic pattern matching to
 * understand essays at their very essence.
 *
 * Architecture:
 * Stage 1: Holistic Understanding (overview)
 * Stage 2: Deep Dive Analysis (6 parallel focused analyses)
 * Stage 3: Grammar & Writing Style (deterministic + LLM)
 * Stage 4: Contextualization & Synthesis (aggregate everything)
 * Stage 5: Specific Insights (sentence-level precision)
 */

// ============================================================================
// ESSAY INPUT
// ============================================================================

export interface NarrativeEssayInput {
  essayText: string;
  essayType?: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplemental' | 'activity_essay';
  promptText?: string;
  maxWords?: number;
  targetSchools?: string[];
  studentContext?: {
    intendedMajor?: string;
    culturalBackground?: string;
    academicStrength?: 'strong' | 'moderate' | 'developing';
    voicePreference?: 'concise' | 'warm' | 'understated';
  };
}

// ============================================================================
// STAGE 1: HOLISTIC UNDERSTANDING
// ============================================================================

export interface HolisticUnderstanding {
  // Core narrative elements
  centralTheme: string;                    // Main idea/message
  narrativeThread: string;                 // Story arc summary
  primaryVoice: 'conversational' | 'reflective' | 'analytical' | 'poetic' | 'matter-of-fact';
  voiceConsistency: number;                // 0-10, how consistent is voice?

  // Structural overview
  essayStructure: 'chronological' | 'thematic' | 'moment-focused' | 'montage' | 'circular' | 'unclear';
  numberOfDistinctSections: number;
  transitionQuality: number;               // 0-10

  // Key moments identified
  keyMoments: Array<{
    type: 'opening' | 'conflict' | 'turning_point' | 'reflection' | 'conclusion';
    sentenceRange: [number, number];       // [start, end] sentence indices
    description: string;
    effectiveness: number;                 // 0-10
  }>;

  // Thematic elements
  identifiedThemes: string[];              // e.g., ["resilience", "intellectual curiosity", "community impact"]
  emotionalArc: string;                    // Description of emotional journey
  universalInsight: string | null;         // Big takeaway (if present)

  // Initial impressions
  overallCoherence: number;                // 0-10
  authenticitySignals: string[];           // What feels genuine
  redFlags: string[];                      // What feels inauthentic or problematic
  firstImpression: string;                 // Raw first read impression

  // Comparative positioning
  estimatedStrengthTier: 'exceptional' | 'strong' | 'competent' | 'developing' | 'weak';
  comparisonToTypicalEssay: string;        // How this compares

  // Analysis metadata
  analyzedAt: string;
  tokensUsed: number;
}

// ============================================================================
// STAGE 2: DEEP DIVE ANALYSIS (6 Focused Analyses)
// ============================================================================

export interface OpeningAnalysis {
  // Hook effectiveness
  hookType: 'scene' | 'dialogue' | 'provocative_claim' | 'question' | 'generic' | 'none';
  hookStrength: number;                    // 0-10
  hookQuote: string;
  hookAnalysis: string;

  // Opening scene quality
  hasOpeningScene: boolean;
  sceneVividness: number;                  // 0-10
  sensoryDetails: string[];                // Identified sensory elements
  temporalAnchor: string | null;           // "junior year", "3am", etc.
  spatialAnchor: string | null;            // "lab", "kitchen table", etc.

  // Context establishment
  contextClarity: number;                  // 0-10, how clear is what's happening?
  missingContext: string[];                // What's unclear

  // Engagement prediction
  readerEngagement: number;                // 0-10, will AO keep reading?
  improvementSuggestions: string[];

  // Comparative examples
  weakExample: string | null;
  strongExample: string | null;

  tokensUsed: number;
}

export interface BodyDevelopmentAnalysis {
  // Content development
  narrativeProgression: number;            // 0-10, does story move forward?
  specificityLevel: number;                // 0-10, how specific are details?
  quantificationPresence: number;          // 0-10, numbers/metrics

  // Character development
  characterGrowth: number;                 // 0-10
  agencyDemonstration: number;             // 0-10, do they make decisions?
  relationshipDevelopment: number;         // 0-10

  // Evidence strength
  concreteExamples: string[];
  vagueStatements: string[];
  showVsTell: {
    showing: number;                       // 0-10
    telling: number;                       // 0-10
    balance: string;
  };

  // Pacing analysis
  pacingRating: number;                    // 0-10
  rushedSections: string[];
  belaboredSections: string[];

  // Issue detection
  detectedIssues: Array<{
    type: string;
    severity: 'critical' | 'major' | 'minor';
    quote: string;
    explanation: string;
    suggestion: string;
  }>;

  tokensUsed: number;
}

export interface ClimaxTurningPointAnalysis {
  // Climax identification
  hasIdentifiableClimax: boolean;
  climaxLocation: number | null;           // Sentence index
  climaxDescription: string;
  climaxStrength: number;                  // 0-10

  // Turning point
  hasTurningPoint: boolean;
  turningPointType: 'realization' | 'decision' | 'event' | 'conversation' | 'none';
  turningPointQuote: string | null;
  turningPointDepth: number;               // 0-10, how profound?

  // Stakes analysis
  stakesPresent: boolean;
  stakesClarity: number;                   // 0-10
  stakesDescription: string;
  emotionalInvestment: number;             // 0-10

  // Conflict quality
  conflictPresent: boolean;
  conflictType: 'internal' | 'external' | 'both' | 'none';
  conflictComplexity: number;              // 0-10

  // Vulnerability
  vulnerabilityPresent: boolean;
  vulnerabilityMoments: Array<{
    quote: string;
    type: 'emotional' | 'intellectual' | 'limitation_admission';
    depth: number;                         // 0-10
  }>;

  improvementSuggestions: string[];
  tokensUsed: number;
}

export interface ConclusionReflectionAnalysis {
  // Conclusion structure
  conclusionType: 'forward_looking' | 'circular' | 'reflective' | 'summary' | 'weak';
  conclusionStrength: number;              // 0-10
  conclusionQuote: string;

  // Reflection quality
  reflectionPresent: boolean;
  reflectionDepth: number;                 // 0-10
  reflectionType: 'surface' | 'moderate' | 'deep' | 'profound';

  // Meaning-making
  meaningMakingPresent: boolean;
  universalInsight: string | null;
  microToMacro: {
    present: boolean;
    specificExperience: string | null;
    universalLesson: string | null;
    connectionQuality: number;             // 0-10
  };

  // Intellectual maturity
  intellectualMaturity: number;            // 0-10
  philosophicalDepth: number;              // 0-10
  nuancedThinking: string[];               // Examples of nuance

  // Clichés and pitfalls
  clichesDetected: string[];
  genericStatements: string[];

  // Forward trajectory
  futureConnectionPresent: boolean;
  futureConnectionDescription: string | null;

  improvementSuggestions: string[];
  tokensUsed: number;
}

export interface CharacterDevelopmentAnalysis {
  // Protagonist clarity
  protagonistClarity: number;              // 0-10
  agencyLevel: number;                     // 0-10, active vs passive

  // Interiority
  interiorityPresent: boolean;
  interiorityDepth: number;                // 0-10
  emotionsExpressed: Array<{
    emotion: string;
    specificity: 'specific' | 'generic';
    quote: string;
  }>;

  // Voice authenticity
  voiceAuthenticity: number;               // 0-10
  authenticMarkers: string[];              // "honestly", "turns out", etc.
  inauthenticMarkers: string[];            // "passion", "journey", etc.

  // Dialogue usage
  dialoguePresent: boolean;
  dialogueCount: number;
  dialogueQuality: number;                 // 0-10
  dialogueExamples: string[];

  // Relationships
  relationshipsPortrayed: Array<{
    person: string;
    relationship: string;
    depth: number;                         // 0-10
    impact: string;
  }>;

  // Growth demonstration
  beforeState: string | null;
  afterState: string | null;
  growthClarity: number;                   // 0-10

  improvementSuggestions: string[];
  tokensUsed: number;
}

export interface StakesTensionAnalysis {
  // Tension presence
  tensionPresent: boolean;
  tensionLevel: number;                    // 0-10
  tensionSources: string[];

  // Stakes clarity
  stakesEstablished: boolean;
  stakesType: 'personal' | 'relational' | 'academic' | 'community' | 'unclear';
  stakesHeight: number;                    // 0-10, how high are stakes?

  // Conflict markers
  conflictMarkers: string[];               // "but", "however", "failed", etc.
  conflictDensity: number;                 // Markers per 100 words

  // Suspense & engagement
  suspenseBuilding: number;                // 0-10
  readerInvestment: number;                // 0-10

  // Resolution quality
  resolutionPresent: boolean;
  resolutionSatisfying: boolean;
  resolutionDescription: string | null;

  improvementSuggestions: string[];
  tokensUsed: number;
}

export interface DeepDiveAnalyses {
  opening: OpeningAnalysis;
  bodyDevelopment: BodyDevelopmentAnalysis;
  climaxTurningPoint: ClimaxTurningPointAnalysis;
  conclusionReflection: ConclusionReflectionAnalysis;
  characterDevelopment: CharacterDevelopmentAnalysis;
  stakesTension: StakesTensionAnalysis;

  // Aggregate metadata
  totalTokensUsed: number;
  analysesCompletedAt: string;
}

// ============================================================================
// STAGE 3: GRAMMAR & WRITING STYLE
// ============================================================================

export interface GrammarAnalysis {
  // Sentence-level metrics (deterministic)
  sentenceCount: number;
  averageSentenceLength: number;
  sentenceLengthVariance: number;
  shortSentences: number;                  // <= 8 words
  longSentences: number;                   // >= 20 words
  sentenceVarietyScore: number;            // 0-10

  // Verb analysis
  activeVoiceCount: number;
  passiveVoiceCount: number;
  passiveVoiceRatio: number;
  weakVerbs: string[];                     // "was", "had", "got", etc.
  strongVerbs: string[];                   // Action verbs

  // Word choice
  totalWords: number;
  uniqueWords: number;
  lexicalDiversity: number;                // 0-1
  clichePhrases: string[];
  overusedWords: Array<{
    word: string;
    count: number;
  }>;

  // Punctuation
  dashUsage: number;
  semicolonUsage: number;
  colonUsage: number;
  fragmentCount: number;
  punctuationEffectiveness: number;        // 0-10 (LLM-determined)

  // Common issues
  grammaticalErrors: Array<{
    type: string;
    quote: string;
    correction: string;
  }>;

  // Deterministic flags
  redFlags: string[];
  greenFlags: string[];
}

export interface WritingStyleAnalysis {
  // Style metrics (LLM-determined)
  formalityLevel: number;                  // 0-10 (0=very casual, 10=very formal)
  energyLevel: number;                     // 0-10
  warmth: number;                          // 0-10
  confidence: number;                      // 0-10

  // Rhythm & flow
  rhythmQuality: number;                   // 0-10
  flowAnalysis: string;
  jarringTransitions: string[];
  smoothTransitions: string[];

  // Imagery & sensory detail
  imageryPresent: boolean;
  imageryStrength: number;                 // 0-10
  sensoryDetailCount: number;
  sensoryExamples: string[];

  // Metaphor & figurative language
  metaphorsPresent: boolean;
  metaphorQuality: number;                 // 0-10
  metaphorExamples: string[];
  clichedMetaphors: string[];

  // Originality markers
  originalPhrases: string[];               // Fresh, unique expressions
  genericPhrases: string[];                // Overused college essay language

  // Comparative positioning
  styleComparison: string;                 // How style compares to strong essays
  styleStrengths: string[];
  styleWeaknesses: string[];

  tokensUsed: number;
}

export interface GrammarStyleAnalysis {
  grammar: GrammarAnalysis;
  style: WritingStyleAnalysis;

  // Combined assessment
  overallCraftScore: number;               // 0-10
  topStrengths: string[];
  topWeaknesses: string[];
  improvementPriorities: string[];
}

// ============================================================================
// STAGE 4: CONTEXTUALIZATION & SYNTHESIS
// ============================================================================

export interface SynthesizedInsights {
  // Overall assessment
  overallQualityScore: number;             // 0-100 (EQI equivalent)
  impressionLabel: 'exceptional' | 'compelling' | 'competent' | 'developing' | 'weak';
  oneLineSummary: string;

  // Dimension scores (aligned with 12-dimension rubric)
  dimensionScores: {
    openingPower: number;                  // 0-10
    narrativeArc: number;
    characterInteriority: number;
    showDontTell: number;
    reflectionMeaningMaking: number;
    dialogueAction: number;
    originalityVoice: number;
    structurePacing: number;
    sentenceCraft: number;
    contextConstraints: number;
    schoolFit: number;
    ethicalHumility: number;
  };

  // Holistic strengths
  topStrengths: Array<{
    strength: string;
    evidence: string[];
    rarityFactor: string;                  // "Top 10% of essays show this"
    whyItMatters: string;
  }>;

  // Critical gaps
  criticalGaps: Array<{
    gap: string;
    impact: string;                        // How it hurts the essay
    evidence: string[];
    fixComplexity: 'easy' | 'moderate' | 'challenging';
  }>;

  // Opportunities for elevation
  opportunities: Array<{
    opportunity: string;
    currentState: string;
    potentialState: string;
    captureStrategy: string;
    estimatedImpact: number;               // +X points
  }>;

  // Admissions officer perspective
  officerPerspective: {
    firstImpression: string;
    credibilityAssessment: string;
    memorabilityFactor: number;            // 0-10
    emotionalImpact: number;               // 0-10
    intellectualImpact: number;            // 0-10
    concernsFlags: string[];
    positiveSignals: string[];
  };

  // Comparative context
  comparativeContext: {
    vsTypicalApplicant: string;
    vsTop10Percent: string;
    competitiveAdvantages: string[];
    competitiveWeaknesses: string[];
    percentileEstimate: string;            // "Top 15-25%"
  };

  // Improvement roadmap
  improvementRoadmap: {
    quickWins: Array<{
      action: string;
      timeEstimate: string;               // "5 min"
      impactEstimate: string;             // "+1-2 points"
      difficulty: 'easy';
    }>;
    strategicMoves: Array<{
      action: string;
      timeEstimate: string;               // "20-30 min"
      impactEstimate: string;             // "+3-5 points"
      difficulty: 'moderate';
    }>;
    transformativeMoves: Array<{
      action: string;
      timeEstimate: string;               // "45-60 min"
      impactEstimate: string;             // "+5-8 points"
      difficulty: 'challenging';
    }>;
    aspirationalTarget: string;            // What this could become
  };

  // Key insights synthesized from all stages
  keyInsights: string[];                   // Top 5-7 insights

  tokensUsed: number;
  synthesizedAt: string;
}

// ============================================================================
// STAGE 5: SPECIFIC INSIGHTS (Sentence-Level)
// ============================================================================

export interface SentenceLevelInsight {
  insightId: string;

  // Location
  sentenceIndex: number;
  sentenceText: string;
  paragraphIndex: number;
  essaySection: 'opening' | 'body' | 'climax' | 'conclusion';

  // Issue identification
  issueType: string;                       // "weak_verb", "vague_language", "telling_not_showing"
  issueCategory: string;                   // Maps to rubric dimension
  severity: 'critical' | 'major' | 'minor';

  // Explanation
  whatWeDetected: string;
  whyItMatters: string;
  impactOnScore: string;                   // "-1 to -2 points from [dimension]"

  // Context
  surroundingContext: {
    beforeSentence: string | null;
    afterSentence: string | null;
  };

  // Comparative examples
  weakExample: string | null;
  strongExample: string | null;
  whatToNotice: string;

  // Solution approaches
  solutions: Array<{
    approach: string;
    difficulty: 'easy' | 'moderate' | 'challenging';
    timeEstimate: string;
    impactEstimate: string;
    steps?: string[];
    transferablePrinciple: string;
  }>;

  // Before/after suggestion
  beforeText: string;
  suggestedAfter: string;
  rationale: string;

  // Chat routing
  preFillledChatPrompt: string;
  suggestedFollowUps: string[];
}

export interface GeneralInsight {
  insightId: string;
  insightType: 'strength' | 'gap' | 'opportunity';

  // Content
  title: string;
  description: string;
  evidence: string[];                      // Quotes from essay

  // Impact
  impactAssessment: string;
  rarityFactor?: string;                   // For strengths
  fixComplexity?: 'easy' | 'moderate' | 'challenging'; // For gaps

  // Suggestions
  actionableSteps: string[];
  estimatedImpact: string;
}

export interface SpecificInsights {
  sentenceLevelInsights: SentenceLevelInsight[];
  generalInsights: GeneralInsight[];

  // Organization by type
  bySection: {
    opening: SentenceLevelInsight[];
    body: SentenceLevelInsight[];
    climax: SentenceLevelInsight[];
    conclusion: SentenceLevelInsight[];
  };

  bySeverity: {
    critical: SentenceLevelInsight[];
    major: SentenceLevelInsight[];
    minor: SentenceLevelInsight[];
  };

  byDimension: Record<string, SentenceLevelInsight[]>;

  // Prioritized list (top 10 most important)
  prioritizedInsights: SentenceLevelInsight[];
}

// ============================================================================
// PHASE 8: VOICE FINGERPRINT & WORKSHOP ITEMS
// ============================================================================

export interface VoiceFingerprint {
  tone: string; // "Earnest, self-deprecating"
  cadence: string; // "Short, punchy sentences"
  vocabulary: string; // "Simple, conversational"
  markers: string[]; // ["Uses dashes often", "Starts sentences with And"]
  sampleSentences?: string[]; // NEW: Authentic samples from the essay for style transfer
}

export interface WorkshopItem {
  id: string;
  rubric_category: string; // "Selectivity"
  severity: 'critical' | 'warning' | 'optimization';
  quote: string; // "I worked hard"
  
  // Contextual Education
  problem: string; // "Lacks metrics."
  why_it_matters: string; // "Credibility signal."
  
  // The Fixes
  suggestions: Array<{
    text: string; // "I sent 500 emails."
    rationale: string; // "Adds quantification."
    type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy' | 'metric' | 'sensory' | 'clarity'; // Expanded for 2+1 Strategy
  }>;
}

// ============================================================================
// COMPLETE NARRATIVE WORKSHOP ANALYSIS
// ============================================================================

export interface NarrativeWorkshopAnalysis {
  // Input
  input: NarrativeEssayInput;

  // Analysis stages
  stage1_holisticUnderstanding: HolisticUnderstanding;
  stage2_deepDiveAnalyses: DeepDiveAnalyses;
  stage3_grammarStyleAnalysis: GrammarStyleAnalysis;
  stage4_synthesizedInsights: SynthesizedInsights;
  stage5_specificInsights: SpecificInsights;

  // Phase 8 additions
  voiceFingerprint?: VoiceFingerprint;
  workshopItems?: WorkshopItem[];

  // Overall metadata
  analysisId: string;
  analyzedAt: string;
  totalTokensUsed: number;
  performanceMetrics: {
    stage1Ms: number;
    stage2Ms: number;
    stage3Ms: number;
    stage4Ms: number;
    stage5Ms: number;
    totalMs: number;
  };

  // Quick access
  overallScore: number;                    // 0-100
  topPriorities: string[];                 // Top 3-5 things to fix
  quickSummary: string;                    // One-sentence diagnosis
}

// ============================================================================
// ANALYSIS OPTIONS
// ============================================================================

export interface NarrativeWorkshopOptions {
  depth?: 'quick' | 'standard' | 'comprehensive';
  includeStage1?: boolean;                 // Default true
  includeStage2?: boolean;                 // Default true
  includeStage3?: boolean;                 // Default true
  includeStage4?: boolean;                 // Default true
  includeStage5?: boolean;                 // Default true
  includeVoiceFingerprint?: boolean;       // Default false (Phase 8)
  includeWorkshopItems?: boolean;          // Default false (Phase 8)

  // LLM configuration
  temperature?: number;                    // Default varies by stage
  maxTokensPerCall?: number;

  // Focus areas (if only analyzing certain aspects)
  focusAreas?: Array<'opening' | 'body' | 'climax' | 'conclusion' | 'style' | 'grammar'>;

  // Prioritization
  maxInsightsPerSeverity?: {
    critical: number;
    major: number;
    minor: number;
  };
}

// ============================================================================
// PATTERN DETECTION (For Stage 3 & 5)
// ============================================================================

export interface NarrativePattern {
  patternId: string;
  patternName: string;
  category: string;                        // Maps to rubric dimension
  severity: 'critical' | 'major' | 'minor';

  // Detection
  detectionRegex?: RegExp;
  detectionFunction?: (text: string) => boolean;

  // Explanation
  technicalExplanation: string;
  whyItMatters: string;
  commonIn: string;                        // "Weak essays" or "Strong essays"

  // Examples
  weakExample: string;
  strongExample: string;

  // Fix strategy
  quickFix?: string;
  deepFix?: string;
}

// ============================================================================
// EXPORT
// ============================================================================

export type {
  // Main types
  NarrativeEssayInput,
  NarrativeWorkshopAnalysis,
  NarrativeWorkshopOptions,

  // Stage outputs
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights,
  SpecificInsights,

  // Component types
  OpeningAnalysis,
  BodyDevelopmentAnalysis,
  ClimaxTurningPointAnalysis,
  ConclusionReflectionAnalysis,
  CharacterDevelopmentAnalysis,
  StakesTensionAnalysis,
  GrammarAnalysis,
  WritingStyleAnalysis,
  SentenceLevelInsight,
  GeneralInsight,
  NarrativePattern,
};
