/**
 * Common App Workshop Services
 *
 * Central export for all workshop services
 */

export { WorkshopCacheService, workshopCacheService } from './cacheService';
export { HaikuCitationService, haikuCitationService } from './citationService';
export {
  Stage1TeachingService,
  stage1TeachingService,
  type Stage1TeachingOutput,
  type ConceptualFoundation,
  type CollegeValuesTeaching,
  type RubricUnderstanding,
  type KeyConceptTeaching,
  type PitfallTeaching,
  type GreatEssayTeaching,
  type SocraticQuestion,
  type StrengthToPreserve,
  type NextStep,
} from './stage1Service';

export {
  Stage2TeachingService,
  stage2TeachingService,
  type Stage2TeachingOutput,
  type ProgressAssessment,
  type DimensionImprovement,
  type DimensionalFeedback,
  type IssueTeachingBlock,
  type IssueSuggestion,
  type Stage2SocraticQuestion,
  type Stage2Strength,
  type RevisionStep,
} from './stage2Service';

export {
  Stage3TeachingService,
  stage3TeachingService,
  type Stage3TeachingOutput,
  type FinalEssayAnalysis,
  type FinalDimensionalScore,
  type JourneyProgress,
  type DimensionJourney,
  type CelebrationOfStrengths,
  type CelebratedStrength,
  type ValueAlignmentReport,
  type ValueAlignment,
  type MicroRefinement,
  type AuthenticityReport,
  type ReflectionQuestion,
  type SubmissionChecklistItem,
  type ConfidenceAssessment,
} from './stage3Service';

// Stage 0: Voice Excavation Service
export { Stage0Service } from './stage0Service';

// Stage 0: Multi-Stage Voice Excavation Service (higher quality, layered generation)
export { Stage0MultiStageService } from './stage0MultiStageService';

// Haiku Diagnosis Service (Cost-Optimized Multi-Layer Analysis)
export { HaikuDiagnosisService } from './haikuDiagnosisService';

// Batch Generation Service (2 Suggestions, Cost-Optimized)
export { BatchGenerationService } from './batchGenerationService';
export type {
  IssueContextBundle,
  HolisticContext,
  IssueSurgicalTeaching,
  PolishedOriginalSuggestion,
  VoiceAmplifierSuggestion,
  BatchGenerationOutput,
} from './batchGenerationService';

// Stage 0 Conditional Service (Smart Triage)
export { Stage0ConditionalService } from './stage0ConditionalService';
export type {
  SparkTriageResult,
  ConditionalStage0Output,
} from './stage0ConditionalService';

// Stage 1 Split Architecture (NEW - Preferred)
export { Stage1ATeachingService } from './stage1ATeachingService';
export { Stage1BDiagnosisService } from './stage1BDiagnosisService';
export type {
  ConceptualFoundation,
  CollegeValuesTeaching,
  RubricDimensionTeaching,
  PromptDeepDive,
  Stage1AOutput,
} from './stage1ATeachingService';
export type {
  CriticalIssue,
  DimensionalAssessment,
  Stage1BOutput,
} from './stage1BDiagnosisService';

// Stage 1 Consolidated Service (LEGACY - kept for backward compatibility)
export { Stage1ConsolidatedService } from './stage1ConsolidatedService';
export type {
  CollegeValuesTeaching as Stage1CollegeValuesTeaching,
  Stage1ConsolidatedOutput,
} from './stage1ConsolidatedService';

// Stage 2 Batch Service (Surgical Teaching)
export { Stage2BatchService } from './stage2BatchService';
export type {
  IssuePrepContext,
  DiagnosedIssue,
  Stage2BatchOutput,
  DimensionalFeedbackSummary,
} from './stage2BatchService';

// Stage 3 Consolidated Service (Final Polish + Celebration)
export { Stage3ConsolidatedService } from './stage3ConsolidatedService';
export type {
  DimensionJourney,
  JourneyProgress,
  CelebratedStrength,
  CelebrationOfStrengths,
  MicroRefinement,
  ValueAlignmentReport,
  AuthenticityReport,
  ReflectionQuestion,
  SubmissionChecklistItem,
  ConfidenceAssessment,
  Stage3ConsolidatedOutput,
} from './stage3ConsolidatedService';

// Workshop Handoff Service (Complete Flow Orchestration)
export { HandoffService } from './handoffService';
export type { WorkshopInput, CompleteWorkshopOutput } from './handoffService';

// Cache Optimization Service (Prompt Caching for 74% Cost Reduction)
export { CacheOptimizationService } from './cacheOptimizationService';
export type {
  CacheConfig,
  CacheStats,
  CachedMessageParams,
} from './cacheOptimizationService';

// Citation Processor Service (Parse, Validate, Enrich Citations)
export { CitationProcessor, citationProcessor } from './citationProcessor';

// Type-Specific Teaching Service (14 Essay Types)
export { TYPE_TEACHING_FOCUS, buildTypeTeachingGuidance } from './typeSpecificTeaching';
export type { TypeTeachingFocus } from './typeSpecificTeaching';

// ============================================================================
// EVOLVED WORKSHOP SYSTEM (14 Universal Types + College Overlay)
// ============================================================================

// Type-Aware Scoring Service (12 Dimensions × 14 Type Weights)
export { TypeAwareScoringService } from './typeAwareScoringService';
export type {
  DimensionScore,
  DetectedIssue,
  RedFlagDetection,
  CriticalDimensionAssessment,
  TypeAwareScoringOutput,
} from './typeAwareScoringService';

// Type-Specific Suggestion Service (PIQ-Quality + College Context + Word Count Aware)
export { TypeSpecificSuggestionService, TYPE_SUGGESTION_CONSTRAINTS } from './typeSpecificSuggestionService';
export type {
  WordCountConstraints,
  TypeSpecificConstraints,
  IssueContext,
  PolishedOriginalSuggestion as TypePolishedSuggestion,
  VoiceAmplifierSuggestion as TypeVoiceSuggestion,
  SuggestionTeaching,
  IssueSuggestion as TypeIssueSuggestion,
  TypeSpecificSuggestionOutput,
} from './typeSpecificSuggestionService';

// College Overlay Enhancer (Enhancement-only layer - preserves universal quality)
export { CollegeOverlayEnhancer, collegeOverlayEnhancer } from './collegeOverlayEnhancer';

// College-Type Integration Service (Bridge Universal + College-Specific)
export { CollegeTypeIntegrationService } from './collegeTypeIntegrationService';
export type {
  ValueDimensionMapping,
  CollegeExcellenceRequirement,
  IntegratedTypeRubric,
  CitationRecommendation,
} from './collegeTypeIntegrationService';

// Evolved Workshop Orchestrator (Complete Pipeline)
export { EvolvedWorkshopOrchestrator } from './evolvedWorkshopOrchestrator';
export type {
  Stage0Output,
  Stage1Output,
  Stage2Output,
  Stage3Output,
  EvolvedWorkshopOutput,
  WorkshopOptions,
  CrossCollegeComparisonResult,
} from './evolvedWorkshopOrchestrator';

// ============================================================================
// SEMANTIC SCORING SYSTEM (Principles-Based Assessment)
// ============================================================================

// Semantic Scoring Service (Principles-Based, Not Pattern-Based)
export {
  SemanticScoringService,
  identifyApproachDiscrepancy,
  DEFAULT_WORD_LIMITS,
  TYPE_WORD_EFFICIENCY
} from './semanticScoringService';
export type {
  SemanticDimensionScore,
  PerformativeAssessment,
  SemanticScoringOutput,
  WordCountConfig,
  WordCountAssessment,
  WordEfficiencyMode,
} from './semanticScoringService';

// Unified Scoring Service (Quality-First with Cost Optimization)
export { UnifiedScoringService } from './unifiedScoringService';
export type {
  PatternIssue,
  QuickTriageResult,
  UnifiedScoringOutput,
  UnifiedScoringOptions,
} from './unifiedScoringService';

// ============================================================================
// CONTEXT GATHERING SYSTEM (Suggestion Engine ↔ Chat Interface)
// ============================================================================

// Context Gap Detector (Detects when we'd need to invent details)
export {
  ContextGapDetector,
  contextGapDetector,
  StrategicContextGapDetector,
  strategicContextGapDetector
} from './contextGapDetector';
export type { StrategicContextDecision } from './contextGapDetector';

// Strategic Specificity Service (WHERE to invest words, WHAT quality is needed)
export {
  StrategicSpecificityService,
  strategicSpecificityService
} from './strategicSpecificityService';
export type {
  SpecificityImpactZone,
  SpecificityType,
  SpecificityNeed,
  SpecificityAnalysis,
  ContextQualityScore,
} from './strategicSpecificityService';

// Semantic Context Analyzer (AI-powered gap detection, replaces hardcoded patterns)
export {
  SemanticContextAnalyzer,
  semanticContextAnalyzer
} from './semanticContextAnalyzer';
export type {
  SemanticGapType,
  SemanticContextGap,
  SemanticQualityScore,
  SemanticAnalysisResult
} from './semanticContextAnalyzer';

// ============================================================================
// SONNET CONTEXT LAYER (Optional, Separate Quality Enhancement)
// ============================================================================

// Sonnet Context Layer (SEPARATE optional layer - does NOT affect existing system)
// Uses Sonnet for accuracy, with smart caching. ~$0.015 per essay.
export {
  SonnetContextLayer,
  sonnetContextLayer,
  TYPE_CONTEXT_PRIORITIES
} from './sonnetContextLayer';
export type {
  ContextGap,
  SonnetContextAnalysis,
  SonnetLayerOptions,
  ExistingStrength
} from './sonnetContextLayer';

// ============================================================================
// CONVERSATIONAL CONTEXT GATHERING (Multi-turn quality extraction)
// ============================================================================

// Conversational Context Gatherer (extracts high-quality details through follow-up)
export {
  ConversationalContextGatherer,
  conversationalContextGatherer
} from './conversationalContextGatherer';
export type {
  ResponseQualityAssessment,
  UsableElement,
  CoachingFollowUp,
  GapConversationState,
  ConversationExchange,
  GatheredContext
} from './conversationalContextGatherer';

// ============================================================================
// COLLEGE OVERLAY SERVICE (Sophisticated College-Specific Layer)
// ============================================================================

// College Overlay Service (College personality, clichés, elite craft, values alignment)
export {
  CollegeOverlayService,
  collegeOverlayService
} from './collegeOverlayService';
export type {
  CollegePersonality,
  CollegeCliche,
  CollegeEliteCraftMarker,
  PromptSpecificGuidance,
  CollegeContextForPrompt
} from './collegeOverlayService';

// ============================================================================
// OVERLAY INTEGRATION SERVICES (Red Flag, Green Flag, Rubric, Socratic)
// ============================================================================

// Red Flag Matcher (Pattern-match red flags against essay text with teaching)
export {
  RedFlagMatcher,
  redFlagMatcher,
  detectRedFlags
} from './redFlagMatcher';
export type {
  RedFlagMatcherInput,
  RedFlagMatch,
  RedFlagMatcherOutput
} from './redFlagMatcher';

// Green Flag Amplifier (Detect and preserve college-valued strengths)
export {
  GreenFlagAmplifier,
  greenFlagAmplifier,
  detectGreenFlags
} from './greenFlagAmplifier';
export type {
  GreenFlagAmplifierInput,
  GreenFlagMatch,
  GreenFlagAmplifierOutput
} from './greenFlagAmplifier';

// Prompt Rubric Injector (Extract rubric band guidance for score improvement)
export {
  PromptRubricInjector,
  promptRubricInjector,
  getRubricGuidance
} from './promptRubricInjector';
export type {
  RubricBandInfo,
  RubricBandGuidance,
  PromptRubricInjectorInput
} from './promptRubricInjector';

// Socratic Question Matcher (Match issues to Socratic questions for teaching)
export {
  SocraticQuestionMatcher,
  socraticQuestionMatcher,
  getSocraticQuestions,
  getSingleProbe
} from './socraticQuestionMatcher';
export type {
  SocraticQuestion as MatchedSocraticQuestion,
  SocraticQuestionSet,
  SocraticMatcherInput,
  SocraticMatcherOutput
} from './socraticQuestionMatcher';

// ============================================================================
// SEMANTIC CLICHÉ ANALYZER (AI-Powered Deep Cliché Detection)
// ============================================================================

// Semantic Cliché Analyzer (Topic, Arc, Language, Tell-vs-Show detection)
export {
  SemanticClicheAnalyzer,
  semanticClicheAnalyzer
} from './semanticClicheAnalyzer';
export type {
  TopicClicheAssessment,
  NarrativeArcClicheAssessment,
  LanguageCliche,
  TellingNotShowing,
  SemanticClicheAnalysis,
  ClicheAnalyzerOptions
} from './semanticClicheAnalyzer';

// ============================================================================
// CLICHÉ ISSUE INTEGRATION (Bridges Cliché Analysis → Workshop Pipeline)
// ============================================================================

// Cliché Issue Integration (Converts cliché analysis to CriticalIssue format)
export {
  convertClicheAnalysisToCriticalIssues,
  generateClicheIssues,
  formatClicheIssuesForStage2,
  createTopicFramingIssue,
  createNarrativeArcIssue,
  createLanguageClicheIssue,
  createTellingIssue,
} from './clicheIssueIntegration';
export type {
  ClicheSymptomType,
  ClicheSeverity,
  ClicheIssueOptions,
} from './clicheIssueIntegration';

// ============================================================================
// OPTIMIZED CITATION SYSTEM (Pre-Indexed O(1) Lookups)
// ============================================================================

// Source Indexer (Pre-computed indices for instant source lookup)
export {
  SourceIndexer,
  getSourceIndexer,
  resetSourceIndexer,
} from './sourceIndexer';
export type { IndexedSource } from './sourceIndexer';

// Smart Source Selector (Intelligent multi-source selection with diversity)
export {
  SmartSourceSelector,
  getSmartSourceSelector,
  resetSmartSourceSelector,
  getBestSourceForIssueOptimized,
  getSourceBundleForIssue,
} from './smartSourceSelector';

// Citation Selector (Now integrated with optimized system)
export { CitationSelector } from './provenanceCitationSelector';

// Deep Prescription Generator (Rich contextual prescriptions with citations)
export {
  generateDeepPrescription,
  generateAllDeepPrescriptions,
  getBestSourceForIssue,
  getSourcesForCollege,
  getSourceBundleForIssueType,
  generatePrescriptionWithCitations,
  formatCitationForDisplay,
} from './deepPrescriptionGenerator';
export type {
  DeepPrescription,
} from './deepPrescriptionGenerator';

// Universal Citation Engine (Apply citations to ANY content)
export {
  UniversalCitationEngine,
  quickCite,
  citeWorkshopFeedback,
  citeTeachingMoment,
  citePortfolioInsight,
} from './universalCitationEngine';
export type {
  CitableContent,
  ContentType,
  CitationConfig,
  CitedContent,
  CitationDisplayData,
} from './universalCitationEngine';

// Citation Trigger Detector (Detect claims needing citations)
export {
  CitationTriggerDetector,
} from './citationTriggerDetector';
export type {
  CitationTrigger,
  TriggerType,
  CitationTriggerContext,
} from './citationTriggerDetector';

// Citation Attacher (Attach citations to feedback)
export {
  CitationAttacher,
} from './citationAttacher';

// ============================================================================
// COLLEGE TAILORING SCORING SYSTEM (Phase 2)
// ============================================================================

// College Tailoring Scoring Service (Measures college-specific fit)
export {
  CollegeTailroingScoringService,
  collegeTailroingScoringService,
} from './collegeTailoringScoringService';
export type {
  TailoringScoringInput,
  TailoringScoringOutput,
} from './collegeTailoringScoringService';

// Quality Improvement Tracker (Tracks generation quality over time)
export {
  QualityImprovementTracker,
  qualityImprovementTracker,
} from './qualityImprovementTracker';
export type {
  EnhancementLogEntry,
  QualityMetrics,
  ImprovementRecommendation,
} from './qualityImprovementTracker';

// Value Alignment Guidance Service (Mindset-focused college-specific guidance)
export {
  ValueAlignmentGuidanceService,
  valueAlignmentGuidanceService,
} from './valueAlignmentGuidanceService';
export type {
  ValueAlignmentInput,
  ValueGuidance,
  CrossCollegeInsight,
  ValueAlignmentOutput,
} from './valueAlignmentGuidanceService';

// ============================================================================
// V2: ENHANCED SOURCE ROUTING (4-Layer Hierarchy)
// ============================================================================

// Enhanced Source Router (Universal → Prompt-Type → College → Prompt-Specific)
export {
  EnhancedSourceRouter,
  getEnhancedSourceRouter,
  resetEnhancedSourceRouter,
  routeSourcesForContext,
  getSourceBundleForContext,
  getUniversalFallbackSource,
} from './enhancedSourceRouter';

// ============================================================================
// MULTI-LAYER ENHANCEMENT SYSTEM (Beyond Program Names)
// ============================================================================

// Multi-Layer Enhancement Service (5 layers: value, mindset, approach, resource, dean quotes)
export {
  MultiLayerEnhancementService,
  multiLayerEnhancementService,
} from './multiLayerEnhancementService';
export type {
  EnhancementLayer,
  MultiLayerEnhancementInput,
  MultiLayerEnhancementOutput,
} from './multiLayerEnhancementService';

// ============================================================================
// RESEARCH-BACKED TEACHING SYSTEM (Knowledge Bridge)
// ============================================================================

// Research-Backed Teaching Service (Transforms detection into teaching)
export {
  ResearchBackedTeachingService,
  researchBackedTeachingService,
} from './researchBackedTeachingService';
export type {
  IssueType,
  TeachingMomentType,
  ResearchBackedTeaching,
  SourceCitation,
  TechniqueBundle,
  TransformationExample,
} from './researchBackedTeachingService';

// Teaching Guidance Presenter (ADDITIVE - Formats universal teaching for display + chat handoff)
export {
  TeachingGuidancePresenter,
  teachingGuidancePresenter,
} from './teachingGuidancePresenter';
export type {
  FormattedTeachingGuidance,
  StepByStepGuidance,
  FormattedExample,
  ChatHandoffContext,
  CollegeSpecificNote,
  TeachingPackage,
  // ADDITIVE enhancement type
  EnhancedIssueWithTeaching,
} from './teachingGuidancePresenter';

// ============================================================================
// WORKSHOP CHAT MODE (Specialized Technique Implementation Chat)
// ============================================================================

// Workshop Chat Mode Service (ADDITIVE - specialized chat for technique & suggestion implementation)
export {
  WorkshopChatModeService,
  workshopChatModeService,
  createWorkshopContextsFromIssues,
  detectChatModeIntent,
} from './workshopChatMode';
export type {
  ChatMode,
  WorkshopSubMode,
  WorkshopModeContext,
  SuggestionModeContext,   // NEW: For Stage 2 suggestion implementation
  WorkshopChatMessage,
  WorkshopChatRequest,
  WorkshopChatResponse,
} from './workshopChatMode';
