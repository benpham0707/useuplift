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
