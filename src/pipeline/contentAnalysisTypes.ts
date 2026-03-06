/**
 * Content Analysis Types — Wave 2 Deep Content Analysis
 *
 * Type contracts for structure, theme, character, and insight analyzers.
 * These analyzers produce heuristic signals (counting, ratios, presence detection)
 * that get injected into the Sonnet annotation prompt as context.
 *
 * Consumed by: promptBuilder (prompt injection), scoreDeriver (signal fusion),
 * improvementRoadmap (issue routing), deepDiveService (teaching context).
 */

// ============================================================================
// 2A. ESSAY STRUCTURE ANALYSIS
// ============================================================================

/**
 * Narrative arc types detected by heuristic pre-classification.
 * Extends existing NarrativeArcType with essay-specific structures.
 */
export type ArcType =
  | 'linear'          // Chronological A → B → C
  | 'in_medias_res'   // Opens mid-action, then context
  | 'circular'        // Ends where it began (with new meaning)
  | 'montage'         // Parallel vignettes, thematic thread
  | 'zoom_lens'       // Macro → micro or micro → macro
  | 'braided'         // Two+ timelines interwoven
  | 'ambiguous';      // Heuristic can't determine — defer to LLM

/** Narrative beats — structural roles paragraphs play */
export type EssayBeat =
  | 'hook'        // Opening that demands attention
  | 'setup'       // Establishes context, stakes, world
  | 'inciting'    // The event that starts the story
  | 'rising'      // Tension/complexity builds
  | 'pivot'       // The turning point — everything shifts
  | 'reflection'  // Steps back to interpret meaning
  | 'resolution'  // How things resolved
  | 'connection'  // Bridges experience to broader meaning
  | 'callback'    // Echoes earlier imagery/moment
  | 'coda';       // Final resonant note

/** Per-beat annotation with paragraph mapping and quality signal */
export interface BeatAnnotation {
  beatType: EssayBeat;
  paragraphIndices: number[];
  /** Evidence text (first ~100 chars of the paragraph) for prompt context */
  evidence: string;
  /**
   * Heuristic confidence that this paragraph serves this beat role.
   * Low confidence → LLM should evaluate.
   */
  confidence: number;
}

/** Pacing analysis — how the essay distributes its structural weight */
export interface PacingAnalysis {
  /** Where the essay's weight sits */
  balance: 'front_loaded' | 'balanced' | 'back_loaded';
  /** Ratio of setup paragraphs to total */
  setupRatio: number;
  /** Ratio of reflection/connection/resolution to total */
  payoffRatio: number;
  /** Whether the essay has more than minimal reflection */
  reflectionPresent: boolean;
}

/** Complete structure analysis result */
export interface EssayStructureAnalysis {
  /** Detected arc type (heuristic pre-classification) */
  detectedArc: ArcType;
  /** Confidence in arc detection (0-1) */
  arcConfidence: number;
  /** Per-paragraph beat annotations */
  beats: BeatAnnotation[];
  /** Pacing analysis */
  pacing: PacingAnalysis;
  /** Structural diagnostics for the LLM prompt */
  diagnostics: {
    /** Beat types not detected in the essay */
    missingBeats: EssayBeat[];
    /** Structural observations for LLM context */
    observations: string[];
  };
}

// ============================================================================
// 2B. THEME & MEANING ANALYSIS
// ============================================================================

/** Show-don't-tell analysis — counting markers, not judging quality */
export interface ShowDontTellResult {
  /** Raw counts */
  tellingMarkerCount: number;
  showingMarkerCount: number;
  /** Weighted ratio: showing / (showing + telling * 3) */
  showRatio: number;
  /** Specific telling phrases found (for annotation targeting) */
  tellingPhrases: Array<{
    text: string;
    paragraphIndex: number;
    /** Approximate character offset in essay */
    offset: number;
  }>;
  /** Count of showing indicators by type */
  showingBreakdown: {
    sensoryWords: number;
    dialogueInstances: number;
    specificDetails: number;
    actionSequences: number;
  };
}

/** Cliché theme definition */
export interface ClicheThemeDefinition {
  id: string;
  label: string;
  keywords: string[];
  /** Minimum keyword hits to flag */
  threshold: number;
}

/** Cliché detection result */
export interface ClicheDetectionResult {
  /** Whether any cliché theme was detected */
  clicheDetected: boolean;
  /** Which cliché themes matched (may be empty) */
  matchedThemes: Array<{
    themeId: string;
    label: string;
    matchedKeywords: string[];
    hitCount: number;
  }>;
  /** Freshness signals — does the essay treat the topic freshly? */
  freshnessSignals: {
    /** High sensory detail count suggests grounded treatment */
    hasSpecificSensoryDetail: boolean;
    /** Self-aware acknowledgment of the topic */
    hasSelfAwareness: boolean;
    /** Essay subverts expected narrative */
    hasNarrativeSubversion: boolean;
    /** Count of freshness signals present */
    freshnessCount: number;
  };
  /**
   * Verdict: even if cliché detected, fresh treatment should NOT be penalized.
   * 'not_cliche' | 'cliche_but_fresh' | 'cliche_and_stale'
   */
  verdict: 'not_cliche' | 'cliche_but_fresh' | 'cliche_and_stale';
}

/** Thematic coherence — word overlap across paragraphs (no embeddings) */
export interface ThematicCoherenceResult {
  /** Per-paragraph content word sets (top content words) */
  paragraphKeywords: Array<{
    index: number;
    keywords: string[];
  }>;
  /** Adjacent paragraph overlap ratios */
  localCoherence: number[];
  /** Each paragraph's overlap with the essay-wide keyword set */
  globalCoherence: number[];
  /** Average coherence score (0-1) */
  overallCoherence: number;
  /** Paragraphs with < 0.15 global coherence (potentially tangential) */
  tangentialParagraphs: number[];
}

/** Unified theme analysis result */
export interface ThemeAnalysisResult {
  showDontTell: ShowDontTellResult;
  clicheDetection: ClicheDetectionResult;
  thematicCoherence: ThematicCoherenceResult;
}

// ============================================================================
// 2C. CHARACTER & INSIGHT ANALYSIS
// ============================================================================

/**
 * Character revelation hierarchy — 7 levels from weakest to strongest.
 * Heuristics detect PRESENCE of patterns (counting), not quality.
 */
export type RevelationLevel =
  | 'none'                // No character signal detected
  | 'direct_statement'    // "I am hardworking" — telling the reader
  | 'others_testimony'    // "My teacher said I was..." — secondhand
  | 'action_description'  // Shows what they did (verbs, events)
  | 'specific_detail'     // Concrete, idiosyncratic details
  | 'internal_process'    // Thought process revealed ("I wondered...")
  | 'moment_of_choice'    // "I could have... but instead..."
  | 'embodied_experience'; // Physical sensation + emotion

/** Per-paragraph character revelation data */
export interface ParagraphRevelation {
  paragraphIndex: number;
  /** Highest revelation level detected in this paragraph */
  highestLevel: RevelationLevel;
  /** All levels detected (a paragraph can have multiple) */
  levelsPresent: RevelationLevel[];
  /** Count of revelation markers found */
  markerCount: number;
  /** Evidence snippets (for prompt context) */
  evidence: string[];
}

/** Vulnerability assessment — earned vs performed */
export interface VulnerabilityAssessment {
  /** Count of vulnerability markers (from featureExtractor) */
  vulnerabilityMarkerCount: number;
  /** Markers accompanied by specific detail (earned) */
  earnedVulnerabilityCount: number;
  /** Markers without grounding detail (performed/dramatic) */
  performedVulnerabilityCount: number;
  /** Whether vulnerability appears grounded in specifics */
  isEarned: boolean;
}

/** Complete character analysis result */
export interface CharacterAnalysisResult {
  /** Per-paragraph revelation data */
  paragraphs: ParagraphRevelation[];
  /** Distribution of revelation levels across the essay */
  levelDistribution: Partial<Record<RevelationLevel, number>>;
  /** Highest revelation level found anywhere in the essay */
  peakLevel: RevelationLevel;
  /** Paragraph index where peak revelation occurs */
  peakParagraphIndex: number;
  /** Vulnerability assessment */
  vulnerability: VulnerabilityAssessment;
  /** Observations for LLM context */
  observations: string[];
}

// ============================================================================
// INSIGHT ANALYSIS
// ============================================================================

/** Insight depth levels — from absent to rare wisdom */
export type InsightDepthLevel =
  | 'none'          // No reflection or insight
  | 'cliche'        // Generic lesson ("I learned perseverance")
  | 'observation'   // Specific but surface-level
  | 'understanding' // Demonstrates comprehension of why
  | 'connection'    // Links experience to broader meaning
  | 'wisdom';       // Genuine, unpredictable insight

/** Known cliché insights that signal shallow reflection */
export const CLICHE_INSIGHTS: string[] = [
  'importance of hard work',
  'learned perseverance',
  'taught me to never give up',
  'value of teamwork',
  'importance of communication',
  'believe in myself',
  'anything is possible',
  'made me who i am today',
  'changed my life forever',
  'opened my eyes',
  'stepped out of my comfort zone',
  'learned the true meaning',
  'everything happens for a reason',
  'realized that life is short',
  'grew as a person',
  'stronger than i thought',
  'learned to be grateful',
  'appreciate what i have',
  'one person can make a difference',
  'world is bigger than i thought',
];

/** Insight depth scoring result */
export interface InsightDepthResult {
  /** Depth level classification */
  level: InsightDepthLevel;
  /** Numeric score 0-100 */
  score: number;
  /** Which quarter of the essay the insight was found in */
  insightLocation: 'first_quarter' | 'middle' | 'final_quarter' | 'distributed' | 'absent';
  /** Evidence: presence/absence of key markers */
  markers: {
    reflectionPhraseCount: number;
    hasSurpriseOrContradiction: boolean;
    hasBehavioralChange: boolean;
    isCliche: boolean;
    /** Specificity of the insight passage (ratio of concrete to abstract words) */
    insightSpecificity: number;
  };
  /** The strongest insight passage found (for prompt context) */
  strongestPassage?: string;
}

/** Insight uniqueness — does this insight feel original? */
export interface InsightUniquenessResult {
  /** Whether the final insight uses language found in cliché lists */
  usesClicheLanguage: boolean;
  /** Whether the insight references specific details from the essay (not generic) */
  referencesSpecificExperience: boolean;
  /** Whether the essay's callback/echo structure connects insight to opening */
  hasCallbackStructure: boolean;
}

/** Combined insight analysis */
export interface InsightAnalysisResult {
  depth: InsightDepthResult;
  uniqueness: InsightUniquenessResult;
}

// ============================================================================
// UNIFIED DEEP CONTENT ANALYSIS
// ============================================================================

/** Combined result from all Wave 2 analyzers */
export interface DeepContentAnalysis {
  structure: EssayStructureAnalysis;
  theme: ThemeAnalysisResult;
  character: CharacterAnalysisResult;
  insight: InsightAnalysisResult;
}
