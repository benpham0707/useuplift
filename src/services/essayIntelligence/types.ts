/**
 * Essay Intelligence System — Core Type Definitions
 *
 * 5-level hierarchical understanding model:
 *   EssayUnderstanding → ParagraphUnderstanding → SentenceUnderstanding → WordAnnotation
 *
 * Also defines:
 *   - RunningUnderstanding (Layer 3 accumulator)
 *   - StructuralCartography (Layer 2 output)
 *   - ParagraphDeepAnalysis (Layer 3 per-paragraph output)
 *   - EssayDNA + ParagraphScoreMatrix (Layer 4 crystallization)
 *   - ConversationInsight (Layer 6 enrichment)
 *   - AnalysisPass (tracking metadata)
 *
 * Consumed by: all essayIntelligence/* modules, enhancedWorkshop, inlineEditor, coaching
 */

import type { NarrativeArcType, NarrativeAnalysisResult, ParagraphFunctionAnalysis, ParagraphFunction } from '../../workshop/scoring/narrativeAnalyzerTypes';
import type { ExtractedFeatures, ImpressionLabel, WorkshopEssayType } from '../../workshop/shared/types';
import type { EssayAnnotation, TextSpan } from '../../pipeline/types';
import type { StudentVoiceProfile } from '../voiceProfile/types';

// ============================================================================
// RE-EXPORTS (convenience for consumers)
// ============================================================================

export type { NarrativeArcType, ImpressionLabel, WorkshopEssayType, EssayAnnotation, TextSpan };

// ============================================================================
// ENUMS & UNIONS
// ============================================================================

/** Readiness level of the essay */
export type ReadinessLevel =
  | 'needs_major_revision'
  | 'developing'
  | 'solid_draft'
  | 'near_final'
  | 'polished';

/** Paragraph verdict from Layer 4 scoring */
export type ParagraphVerdict = 'anchor' | 'strong' | 'developing' | 'weak' | 'restructure';

/** Improvement impact level */
export type ImpactLevel = 'transformative' | 'significant' | 'moderate' | 'minor';

/** Severity of weakness */
export type WeaknessSeverity = 'critical' | 'significant' | 'minor';

/** Word verdict in craft analysis */
export type WordVerdict = 'excellent' | 'adequate' | 'weak' | 'wrong';

/** Transition quality between paragraphs */
export type TransitionQuality = 'seamless' | 'functional' | 'abrupt' | 'missing';

/** Thematic thread strength */
export type ThreadStrength = 'dominant' | 'supporting' | 'hinted' | 'dropped';

/** Arc momentum state */
export type ArcMomentum = 'building' | 'sustaining' | 'releasing' | 'stalling';

/** Cross-paragraph connection types */
export type ConnectionType = 'callback' | 'contrast' | 'escalation' | 'parallel' | 'contradiction';

/** Annotation granularity levels */
export type AnnotationGranularity = 'paragraph' | 'sentence' | 'word';

/** Word flag categories */
export type WordFlagCategory =
  | 'cliche'
  | 'weak_verb'
  | 'generic_adjective'
  | 'intensifier'
  | 'hedge'
  | 'filler'
  | 'sensory'
  | 'signature';

/** Sentence rhythm classification */
export type SentenceRhythm = 'short_punch' | 'medium_flow' | 'long_build';

/** Sentence type classification */
export type SentenceType = 'declarative' | 'interrogative' | 'exclamatory' | 'imperative' | 'fragment';

/** Which analysis layer produced data */
export type AnalysisLayer = 'deterministic' | 'structural' | 'deep_walk' | 'crystallization' | 'annotation' | 'conversation';

// ============================================================================
// LAYER 1: DETERMINISTIC SENTENCE & WORD ANALYSIS
// ============================================================================

/** Deterministic per-sentence metrics (Layer 1) */
export interface SentenceMetrics {
  wordCount: number;
  avgWordLength: number;
  clauseDepth: number;
  isPassiveVoice: boolean;
  sentenceType: SentenceType;
  rhythm: SentenceRhythm;

  /** Concrete detail detection */
  hasConcreteDetail: boolean;
  hasSensoryLanguage: boolean;
  hasCliche: boolean;
  hasFiller: boolean;

  /** Quality scores (0-100) */
  specificityScore: number;
  voiceStrengthScore: number;
}

/** A flagged word/phrase in Layer 1 */
export interface WordFlag {
  word: string;
  category: WordFlagCategory;
  /** Positive = strength (e.g., sensory), negative = issue */
  strength: number;
  /** Suggested alternative (null for strengths) */
  alternative: string | null;
}

// ============================================================================
// LAYER 2: STRUCTURAL CARTOGRAPHY
// ============================================================================

/** Haiku-produced structural map of the essay */
export interface StructuralCartography {
  /** What each paragraph does in the essay's architecture */
  paragraphRoles: Array<{
    index: number;
    role: string;
    narrativeFunction: string;
    strengthContribution: string;
    weaknessFlag: string | null;
  }>;

  /** Structural pattern */
  arcType: NarrativeArcType;
  arcConfidence: number;
  /** Agreement/disagreement with Layer 1 heuristic */
  arcVerification: string;

  /** Transitions between paragraphs */
  transitions: Array<{
    fromParagraph: number;
    toParagraph: number;
    quality: TransitionQuality;
    mechanism: string;
  }>;

  /** Thematic through-line */
  centralTheme: string;
  themeProgression: string;
  thematicGaps: string[];

  /** Pacing assessment */
  pacingNotes: string;
  flatSpots: number[];
}

// ============================================================================
// LAYER 3: RUNNING UNDERSTANDING (ACCUMULATOR)
// ============================================================================

/** The compounding accumulator that grows with each paragraph analysis */
export interface RunningUnderstanding {
  // ── THESIS & THEME ──
  emergingThesis: string;
  thesisConfidence: number;
  thematicThreads: Array<{
    thread: string;
    introducedAt: number;
    lastSeenAt: number;
    strength: ThreadStrength;
  }>;

  // ── NARRATIVE ARC ──
  arcSoFar: string;
  arcType: NarrativeArcType | null;
  currentMomentum: ArcMomentum;
  turningPointDetected: number | null;

  // ── VOICE SIGNATURE ──
  voiceFingerprint: {
    dominantRegister: string;
    authenticMoments: string[];
    voiceDrifts: Array<{
      paragraph: number;
      from: string;
      to: string;
    }>;
    consistencyScore: number;
  };

  // ── EMOTIONAL JOURNEY ──
  emotionalArc: Array<{
    paragraph: number;
    register: string;
    depth: number;
    isEarned: boolean;
  }>;
  emotionalPeak: { paragraph: number; moment: string } | null;

  // ── STRENGTH / WEAKNESS MAP ──
  strengthsFound: Array<{
    quality: string;
    paragraph: number;
    evidence: string;
  }>;
  weaknessesFound: Array<{
    quality: string;
    paragraph: number;
    description: string;
    severity: WeaknessSeverity;
  }>;

  // ── CROSS-PARAGRAPH CONNECTIONS ──
  connections: Array<{
    type: ConnectionType;
    paragraphs: [number, number];
    description: string;
  }>;
  redundancies: Array<{
    paragraphs: number[];
    overlappingContent: string;
  }>;

  // ── ADMISSIONS LENS ──
  aoTakeaway: string;
  memorabilityFactor: string | null;
  revealedQualities: string[];
}

// ============================================================================
// LAYER 3: PER-PARAGRAPH DEEP ANALYSIS
// ============================================================================

/** 5-angle deep analysis of a single paragraph (Layer 3 output) */
export interface ParagraphDeepAnalysis {
  paragraphIndex: number;

  // ═══ ANGLE 1: STRUCTURAL ROLE ═══
  structural: {
    actualRole: string;
    intendedRole: string;
    roleEffectiveness: number;
    placementVerdict: string;
    essentialContent: string;
    currentGaps: string[];
    connectionToPrior: string | null;
    connectionToNext: string | null;
  };

  // ═══ ANGLE 2: RHETORICAL EFFECTIVENESS ═══
  rhetoric: {
    primaryClaim: string | null;
    evidenceQuality: number;
    evidenceTypes: string[];
    persuasiveness: number;
    redundancyWithOtherParagraphs: string | null;
    uniqueContribution: string;
  };

  // ═══ ANGLE 3: EMOTIONAL & VOICE QUALITY ═══
  emotional: {
    emotionalRegister: string;
    voiceAuthenticity: number;
    emotionalDepth: number;
    showVsTellVerdict: string;
    strongestEmotionalMoment: string | null;
    emotionalGap: string | null;
  };

  // ═══ ANGLE 4: CRAFT & LANGUAGE ═══
  craft: {
    sentenceRhythmAssessment: string;
    wordChoiceHighlights: Array<{
      word: string;
      verdict: WordVerdict;
      reason: string;
      alternative: string | null;
    }>;
    imageQuality: number;
    voiceConsistency: number;
    craftStandout: string | null;
    craftWeakness: string | null;
  };

  // ═══ ANGLE 5: SENTENCE-BY-SENTENCE BREAKDOWN ═══
  sentences: Array<{
    index: number;
    text: string;
    role: string;
    effectiveness: number;
    isStrength: boolean;
    issue: string | null;
    suggestion: string | null;
    rewriteExample: string | null;
    wordFlags: Array<{
      word: string;
      issue: string;
      alternative: string;
    }>;
  }>;

  // ═══ SYNTHESIS ═══
  overallScore: number;
  topStrength: string;
  topImprovement: string;
  admissionsImpact: string;
}

// ============================================================================
// LAYER 4: ESSAY DNA (CRYSTALLIZATION)
// ============================================================================

/** Compressed high-signal summary of the essay's identity (~500 tokens) */
export interface EssayDNA {
  // ── Identity ──
  thesis: string;
  emotionalCore: string;
  studentIntent: string;
  committeePitch: string;
  memorabilityFactor: string;

  // ── Architecture ──
  structuralStrategy: string;
  arcType: NarrativeArcType;
  bestBeat: string;
  missingBeat: string | null;

  // ── Voice ──
  voiceSignature: string;
  authenticPhrases: string[];
  voiceRisks: string[];

  // ── Strength profile ──
  topStrengths: Array<{
    quality: string;
    evidence: string;
    paragraphs: number[];
  }>;

  // ── Growth profile ──
  topImprovements: Array<{
    quality: string;
    currentState: string;
    targetState: string;
    suggestedPath: string;
    paragraphs: number[];
    expectedImpact: ImpactLevel;
  }>;

  // ── Admissions positioning ──
  applicationFit: string;
  uniqueReveals: string[];
  redundancyRisks: string[];

  // ── Overall ──
  overallEQI: number;
  impressionLabel: ImpressionLabel;
  readinessLevel: ReadinessLevel;
}

// ============================================================================
// LAYER 4: PARAGRAPH SCORE MATRIX
// ============================================================================

/** Deterministic extraction + Sonnet-calibrated paragraph scoring */
export interface ParagraphScoreMatrix {
  paragraphs: Array<{
    index: number;
    scores: {
      structure: number;
      rhetoric: number;
      emotion: number;
      craft: number;
      voice: number;
    };
    compositeScore: number;
    verdict: ParagraphVerdict;
  }>;

  /** Cross-paragraph patterns */
  strengthClusters: Array<{
    quality: string;
    paragraphs: number[];
    description: string;
  }>;
  weaknessClusters: Array<{
    quality: string;
    paragraphs: number[];
    description: string;
  }>;

  /** Prioritized improvements ranked by expected impact */
  improvementPriorities: Array<{
    rank: number;
    target: string;
    issue: string;
    expectedImpact: ImpactLevel;
    suggestedApproach: string;
  }>;
}

// ============================================================================
// CONVERSATION INSIGHT
// ============================================================================

/** An insight extracted from conversation stored at the correct EUP level */
export interface ConversationInsight {
  id: string;
  /** When this insight was captured */
  timestamp: string;
  /** The student's words that produced this insight */
  studentStatement: string;
  /** What the system learned */
  insight: string;
  /** What aspect this relates to */
  aspect: string;
  /** If this supersedes a prior insight, reference its ID */
  supersedes: string | null;
  /** The coaching turn that produced this */
  turnId: string;
}

// ============================================================================
// 5-LEVEL HIERARCHY: ESSAY UNDERSTANDING PORTFOLIO (EUP)
// ============================================================================

/** Level 5 (leaf): Word-level annotation */
export interface WordAnnotation {
  word: string;
  startOffset: number;
  endOffset: number;
  flags: WordFlag[];
  /** Set by conversation: student agreed to change this word */
  agreedImprovement: string | null;
}

/** Level 4: Sentence-level understanding */
export interface SentenceUnderstanding {
  index: number;
  /** Populated at load time from essay text, NOT stored in JSONB */
  text: string;
  textHash: string;
  stale: boolean;

  /** Layer 1: Deterministic metrics */
  metrics: SentenceMetrics;

  /** Layer 1: Flagged words */
  flaggedWords: WordAnnotation[];

  /** Layer 3: Deep analysis (from ParagraphDeepAnalysis.sentences) */
  deepAnalysis: {
    role: string;
    effectiveness: number;
    isStrength: boolean;
    issue: string | null;
    suggestion: string | null;
    rewriteExample: string | null;
  } | null;

  /** Layer 6: Conversation insights at sentence level */
  conversationInsights: ConversationInsight[];

  /** Student's explanation of intent (from coaching) */
  studentExplanation: string | null;
}

/** Level 3: Paragraph-level understanding */
export interface ParagraphUnderstanding {
  index: number;
  /** Populated at load time from essay text, NOT stored in JSONB */
  text: string;
  textHash: string;
  stale: boolean;

  /** Layer 1: Paragraph function classification */
  functionAnalysis: ParagraphFunctionAnalysis | null;

  /** Layer 1: Deterministic specificity score (0-100) */
  specificityScore: number;

  /** Layer 1: Scene vs summary classification */
  sceneOrSummary: 'scene' | 'summary' | 'mixed';

  /** Layer 2: Structural role (from StructuralCartography) */
  structuralRole: {
    role: string;
    narrativeFunction: string;
    strengthContribution: string;
    weaknessFlag: string | null;
  } | null;

  /** Layer 3: Deep 5-angle analysis */
  deepAnalysis: ParagraphDeepAnalysis | null;

  /** Layer 3: RunningUnderstanding snapshot AFTER this paragraph */
  runningUnderstandingSnapshot: RunningUnderstanding | null;

  /** Layer 5: Annotations targeting this paragraph */
  annotations: EssayAnnotation[];

  /** Sentence-level understanding */
  sentences: SentenceUnderstanding[];

  /** Layer 6: Conversation insights at paragraph level */
  conversationInsights: ConversationInsight[];

  /** Student's stated intent for this paragraph (from coaching) */
  studentIntent: string | null;
}

/** Level 1 (root): Complete essay understanding */
export interface EssayUnderstanding {
  /** Unique understanding ID */
  id: string;
  /** Essay ID (FK to essays table) */
  essayId: string;
  /** User ID */
  userId: string;
  /** Version number (increments on each full re-analysis) */
  version: number;
  /** Essay type */
  essayType: WorkshopEssayType;
  /** Hash of the full essay text this understanding is based on */
  textHash: string;
  /** Timestamps */
  createdAt: string;
  updatedAt: string;

  /** Layer 1: Extracted features (full deterministic analysis) */
  features: ExtractedFeatures | null;

  /** Layer 1: Narrative analysis results */
  narrativeAnalysis: NarrativeAnalysisResult | null;

  /** Layer 2: Structural cartography */
  structuralCartography: StructuralCartography | null;

  /** Layer 3: Final RunningUnderstanding (after last paragraph) */
  finalUnderstanding: RunningUnderstanding | null;

  /** Layer 4: Essay DNA */
  essayDNA: EssayDNA | null;

  /** Layer 4: Paragraph Score Matrix */
  paragraphScoreMatrix: ParagraphScoreMatrix | null;

  /** Layer 5: All annotations (also cross-referenced on paragraphs) */
  annotations: EssayAnnotation[];

  /** Paragraph-level understanding (ordered by index) */
  paragraphs: ParagraphUnderstanding[];

  /** Layer 6: Conversation insights at essay level */
  conversationInsights: ConversationInsight[];

  /** Voice profile snapshot used during analysis */
  voiceProfileSnapshot: StudentVoiceProfile | null;

  /** Analysis pass history */
  analysisPasses: AnalysisPass[];

  /** Cumulative cost tracking */
  totalCostUSD: number;
}

// ============================================================================
// ANALYSIS PASS METADATA
// ============================================================================

/** Record of a single analysis pass (full or incremental) */
export interface AnalysisPass {
  id: string;
  timestamp: string;
  /** Which layer(s) ran */
  layers: AnalysisLayer[];
  /** What triggered this pass */
  trigger: 'initial' | 'text_edit' | 'structural_change' | 'conversation' | 'manual';
  /** If text_edit: which paragraph was edited */
  editedParagraphIndex: number | null;
  /** If incremental: how many paragraphs were re-walked */
  paragraphsRewalked: number;
  /** Cost of this pass */
  costUSD: number;
  /** Timing breakdown */
  timingMs: Record<string, number>;
  /** Token usage */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
}

// ============================================================================
// DIFF ENGINE TYPES
// ============================================================================

/** Result of comparing old vs new essay text */
export interface DiffResult {
  /** Whether any meaningful change was detected */
  hasChanges: boolean;
  /** Paragraphs whose text hash changed */
  changedParagraphs: number[];
  /** First changed paragraph index (re-walk starts here) */
  firstChangedIndex: number | null;
  /** Whether paragraph count or structure changed (triggers full re-walk) */
  structuralChange: boolean;
  /** New paragraphs added */
  addedParagraphs: number[];
  /** Paragraphs removed */
  removedParagraphs: number[];
}

/** Whether a RunningUnderstanding change is "meaningful" */
export interface MeaningfulDiffResult {
  /** True if thesis, arc, connections, or emotional journey changed */
  isMeaningful: boolean;
  /** What specifically changed */
  changedAspects: string[];
}

// ============================================================================
// CONTEXT BUILDER TYPES (for LLM prompt construction)
// ============================================================================

/** What the coach/LLM is currently focused on */
export type ConversationFocus =
  | { type: 'essay_overview' }
  | { type: 'paragraph'; index: number }
  | { type: 'sentence'; paragraphIndex: number; sentenceIndex: number }
  | { type: 'word'; paragraphIndex: number; sentenceIndex: number; word: string }
  | { type: 'dimension'; dimensionId: string }
  | { type: 'comparison'; paragraphIndices: number[] }
  | { type: 'structural' }
  | { type: 'brainstorming' };

/** A slice of EUP data to load for a prompt */
export type ContextSlice =
  | { type: 'essayDNA' }
  | { type: 'paragraphAnalysis'; index: number }
  | { type: 'sentenceBreakdown'; paragraphIndex: number }
  | { type: 'structuralMap' }
  | { type: 'voiceProfile' }
  | { type: 'conversationInsights'; level: 'essay' | 'paragraph' | 'sentence'; index?: number }
  | { type: 'improvementPriorities'; paragraphIndex?: number }
  | { type: 'crossReferences'; paragraphIndex: number };

/** Routing decision: what context to load for this focus */
export interface ContextRoute {
  focus: ConversationFocus;
  contextSlices: ContextSlice[];
  estimatedTokens: number;
}

/** Assembled context for an LLM prompt */
export interface AssembledContext {
  /** The rendered context string to inject into the prompt */
  contextText: string;
  /** Actual token count (estimated) */
  estimatedTokens: number;
  /** Which slices were included */
  includedSlices: ContextSlice[];
}

// ============================================================================
// LAYER 5: DEEP ANNOTATION TYPES
// ============================================================================

/** Enhanced annotation with granularity info (extends base EssayAnnotation) */
export interface DeepAnnotation extends EssayAnnotation {
  /** How granular this annotation is */
  granularityLevel: AnnotationGranularity;
  /** Reference to Layer 3 finding that informed this annotation */
  sourceAnalysis: string | null;
  /** Which improvement priority this addresses (from ParagraphScoreMatrix) */
  priorityRank: number | null;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

/** Input to the full analysis pipeline */
export interface AnalysisInput {
  essayId: string;
  userId: string;
  text: string;
  essayType: WorkshopEssayType;
  voiceProfile?: StudentVoiceProfile;
  /** If provided, existing EUP for incremental update */
  existingUnderstanding?: EssayUnderstanding;
}

/** Result from the analysis orchestrator */
export interface AnalysisResult {
  understanding: EssayUnderstanding;
  pass: AnalysisPass;
  /** Whether this was a full or incremental analysis */
  isIncremental: boolean;
}

/** Configuration for analysis orchestration */
export interface AnalysisConfig {
  /** Maximum cost ceiling for a single analysis pass */
  maxCostUSD: number;
  /** Whether to run Layer 5 annotations */
  includeAnnotations: boolean;
  /** Whether to allow parallel deepening of critical paragraphs */
  allowParallelDeepening: boolean;
  /** Enable prompt caching */
  usePromptCaching: boolean;
  /** Model overrides */
  models: {
    structural: string;
    deepWalk: string;
    crystallization: string;
    annotation: string;
  };
}

/** Default analysis configuration */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  maxCostUSD: 2.00,
  includeAnnotations: true,
  allowParallelDeepening: false,
  usePromptCaching: true,
  models: {
    structural: 'claude-haiku-4-5-20251001',
    deepWalk: 'claude-sonnet-4-5-20250929',
    crystallization: 'claude-sonnet-4-5-20250929',
    annotation: 'claude-sonnet-4-5-20250929',
  },
};

