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
