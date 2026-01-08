/**
 * Common App Workshop Types
 *
 * Comprehensive type definitions for the college-specific essay coaching system.
 *
 * This system provides:
 * - Full college research context (never compressed)
 * - Citation mapping for evidence-based teaching
 * - Session-level caching for 74% cost reduction
 * - Progressive teaching across 3 stages
 * - Adaptive feedback based on student patterns
 */

// College Research Types
export {
  // Core types
  CollegeResearch,
  CollegeResearchDatabase,

  // Core values
  CollegeCoreValue,

  // Essay prompts & rubrics
  CollegeEssayPrompt,
  CollegeEssayRubric,
  RubricBand,
  PromptDimensionalCriteria,

  // Flags
  CollegeRedFlag,
  CollegeGreenFlag,

  // Socratic questions
  CollegeSocraticQuestionBank,
  CollegeSocraticQuestion,

  // Elite examples
  CollegeEliteExample,
  ExampleAnnotation,

  // Key quotes
  CollegeKeyQuote,

  // Dimension weights
  CollegeDimensionWeights,

  // Pattern types
  EssayPattern,

  // Citation mapping
  CitationMapping,

  // Utility types
  Severity,
  ScoreImpact,
  DimensionStrength,
  TeachingStage,
} from './collegeResearch';

// Workshop Session Types
export {
  // Session
  WorkshopSession,
  WorkshopConversationCache,

  // Session context
  SessionContext,
  ActivityContext,
  CollegeResearchContext,
  PatternRubricContext,

  // Version history
  VersionHistory,
  EssayVersion,
  EssayAnalysis,
  TeachingIssue,

  // Teaching history
  TeachingHistory,

  // Adaptive context
  AdaptiveContext,

  // Teaching feedback
  TeachingFeedback,

  // Session management
  CreateSessionOptions,
  UpdateSessionOptions,
  SessionLookupResult,
} from './workshopSession';

// Stage 0: Voice Excavation Types
export {
  // Emotional Register Types
  EmotionalRegister,
  REGISTER_NAMES,
  RegisterDetection,
  RegisterVoiceProfile,

  // Input Types
  VoiceExcavationInput,
  InterviewResponse,

  // Spark Gap Analysis Types
  SparkLevel,
  EssayModeIndicator,
  MissingSparkElement,
  BuriedSpark,
  SectionAnalysis,
  RegisterIssues,
  SparkGapAnalysis,

  // Excavation Question Types
  ExcavationPurpose,
  ExcavationQuestion,

  // Voice-First Draft Types
  VoiceSource,
  VoiceSourceMarker,
  RegisterMarker,
  PreservedImperfection,
  RiskyChoice,
  VoiceFirstDraftMetrics,
  VoiceFirstDraft,

  // Stage 0 Output Types
  VoiceContext,
  Stage1Handoff,
  ExcavationData,
  Stage0CostTracking,
  Stage0Output,

  // Mapping Types
  PromptRegisterMapping,
  PROMPT_REGISTER_MAPPINGS,

  // Register Profiles & Question Banks
  REGISTER_PROFILES,
  REGISTER_QUESTION_BANKS,

  // Multi-Stage Pipeline Types
  CoreStoryIdentification,
  EssayScene,
  SceneConstruction,
  SparkMoment,
  VocabularyChoice,
  VoiceIntegrationResult,
  QualityIssue,
  QualityVerification,
  Stage0PipelineCache,
  Stage0MultiStageCostTracking,
  Stage0MultiStageOutput,

  // Haiku Diagnosis Service Types (Cost-Optimized Analysis)
  InitialAnalysis,
  VoiceFingerprint,
  IssueSymptomDiagnosis,
} from './stage0Types';

// Citation Exposure Types (Evidence-Based Teaching)
export {
  // Core citation types
  Citation,
  CitationType,
  CitationSeverity,
  BaseCitation,
  CitationSource,

  // Specific citation types
  QuoteCitation,
  RedFlagCitation,
  GreenFlagCitation,
  ValueCitation,
  ExampleCitation,

  // Citation database
  CitationDatabase,

  // Text with citations
  TextWithCitations,
  ParsedTextSpan,
  ParsedText,

  // Enriched citations
  EnrichedCitation,

  // Validation
  CitationValidationResult,
  CitationValidationError,
  CitationValidationWarning,

  // UI-ready formatting
  UIReadyCitation,
  UIReadyText,

  // Teaching output with citations
  SuggestionWithCitations,
  TeachingLayerWithCitations,
  IssueSurgicalTeachingWithCitations,
  OverallStrategyWithCitations,
  BatchGenerationOutputWithCitations,

  // Utility types
  CreateCitationOptions,
  EnrichmentOptions,
  ParseOptions,
} from './citationTypes';

// Context Gathering Types (Suggestion Engine ↔ Chat Interface)
export {
  // Gap types
  ContextGapType,
  ContextGap,

  // Request types
  ContextQuestion,
  ContextGatheringRequest,

  // Gathered context types
  GatheredContextItem,
  GatheredContext,
  EnrichedStudentContext,

  // Integration types
  ContextAwareIssueContext,
  SuggestionWithContextNeeds,

  // Session state
  ContextGatheringState,

  // Helper functions
  createContextGap,
  createContextQuestion,
} from './contextGathering';

// ===========================================================================
// ESSAY CONTEXT CACHING TYPES (Stage 1 → Stage 2 Handoff)
// ===========================================================================

/**
 * Holistic essay context from Stage 1 analysis
 *
 * Tracks themes, arc, and thread to maintain coherence in suggestions.
 * Prevents Stage 2 from introducing disconnected content.
 */
export interface HolisticContext {
  /** Themes that appear throughout essay (preserve these in suggestions) */
  recurring_motifs: string[];

  /** How emotion evolves (or doesn't) throughout essay */
  emotional_arc: string;

  /** Central throughline that ties essay together (maintain this) */
  narrative_thread: string;

  /** Arc predictability score 0-10 (from cliché analyzer) */
  arc_predictability?: number;

  /** Suggestion for making arc less predictable */
  arc_suggested_subversion?: string;
}

/**
 * Dimensional assessment from Stage 1 scoring
 *
 * Shows current state + what's working/missing per dimension.
 * Enables suggestions to preserve strengths while fixing weaknesses.
 */
export interface DimensionalContext {
  /** Dimension name (e.g., "intellectual_vitality", "authenticity") */
  dimension: string;

  /** Current score 1-10 */
  current_score: number;

  /** Target score for excellence (usually 8) */
  target_score: number;

  /** How much improvement needed */
  gap: number;

  /** Overall strength assessment */
  strength_level: 'STRONG' | 'ADEQUATE' | 'WEAK';

  /** Evidence-based assessment */
  evidence: {
    /** What's working (PRESERVE in suggestions) */
    strengths: string[];

    /** What's missing (FIX in suggestions) */
    weaknesses: string[];
  };
}

/**
 * Score reasoning - explains WHY essay got its score
 *
 * Mirrors PIQ workshop dimensional explanations.
 * Helps suggestions target the right issues and preserve what works.
 */
export interface ScoreReasoning {
  /** Total score 0-100 */
  total_score: number;

  /** Quality tier (weak, needs_work, strong, excellent) */
  quality_tier: string;

  /** What makes essay work (PRESERVE this in suggestions) */
  core_strength: string;

  /** What holds essay back (ADDRESS this in suggestions) */
  core_weakness: string;

  /** How reader feels after reading (suggestions must improve this) */
  reader_experience: string;

  /** Principle-level breakdown (from semantic scoring) */
  principle_scores: Array<{
    principle_id: string;
    principle_name: string;
    score: number;           // 0-10
    how_achieved: string;    // How essay achieves (or fails) this
    reader_effect: string;   // What effect this has on reader
  }>;

  /** Type-specific assessment (does essay answer the prompt?) */
  type_assessment?: {
    reader_question_answered: boolean;
    answer_quality: number;
    success_principles_met: string[];
    pitfalls_present: string[];
  };
}

/**
 * Complete essay context package for Stage 2
 *
 * Everything Stage 1 learned that Stage 2 should build on.
 * Prevents re-analysis and enables context-aware suggestions.
 */
export interface EssayContextPackage {
  /** Holistic context (motifs, arc, thread) */
  holistic_context?: HolisticContext;

  /** Dimensional assessment (what's working/missing per dimension) */
  dimensional_context?: DimensionalContext[];

  /** Score reasoning (why this score) */
  score_reasoning?: ScoreReasoning;

  /** Word count context (already exists but bundled for completeness) */
  word_count_status?: {
    status: 'under' | 'optimal' | 'over';
    word_count: number;
    limit: number;
    delta: number;
    severity: 'none' | 'minor' | 'moderate' | 'severe';
    guidance: string;
  };
}
