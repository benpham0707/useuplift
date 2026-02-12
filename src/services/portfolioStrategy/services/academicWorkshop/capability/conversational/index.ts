/**
 * Conversational Capability Profile System
 *
 * A comprehensive system for building qualitative academic profiles through
 * natural conversation. Combines with quantitative analysis to provide
 * nuanced, personalized academic guidance.
 *
 * Key Components:
 * - Topic Detector: Identifies what to ask about from quantitative analysis
 * - Insight Extractor: Extracts structured data from conversational responses
 * - Profile Synthesizer: Combines quantitative + qualitative data
 * - Conversation Engine: Orchestrates the entire conversation flow
 *
 * Usage:
 * ```typescript
 * import {
 *   initializeCapabilityConversation,
 *   processCapabilityConversationTurn,
 *   finalizeCapabilityConversation,
 * } from './conversational';
 *
 * // Start conversation
 * const { opener, state, qualitativeInsights } = await initializeCapabilityConversation(
 *   quantitativeAnalysis,
 *   { intendedMajor: 'Computer Science' }
 * );
 *
 * // Show opener.message to user
 * console.log(opener.message);
 *
 * // Process user response
 * const result = await processCapabilityConversationTurn(
 *   "I really struggled in AP Chemistry...",
 *   state,
 *   qualitativeInsights,
 *   quantitativeAnalysis
 * );
 *
 * // Show AI response
 * console.log(result.response.message);
 *
 * // Continue until shouldContinue is false...
 *
 * // Finalize
 * const synthesizedProfile = finalizeCapabilityConversation(
 *   result.state,
 *   result.qualitativeInsights,
 *   quantitativeAnalysis
 * );
 * ```
 */

// ============================================================================
// TYPES (Export all type definitions)
// ============================================================================

export type {
  // Course-level annotations
  CourseAnnotation,
  TeacherQuality,
  ClassEnvironment,
  ExternalCircumstance,
  CircumstanceType,
  ImpactLevel,
  AnnotationFlag,
  FlagType,

  // Subject-level insights
  SubjectInsight,

  // Learning style and motivation
  LearningStyleIndicators,
  LearningPreference,
  SetbackResponse,
  MotivationProfile,
  Motivator,

  // Self-awareness
  StudentSelfAwareness,
  BlindSpot,

  // Global circumstances
  GlobalCircumstance,

  // Conversation data
  ConversationTurn,
  ConversationTopic,
  TopicType,
  TargetInsight,

  // Extracted insights
  ExtractedInsight,
  InsightType,
  ExtractedValues,
  SentimentLevel,

  // Aggregated qualitative insights
  QualitativeInsights,
  ProfileCompleteness,

  // Synthesis types (legacy - now in profileSynthesizer)
  AdjustmentType,

  // Conversation state
  ConversationState,
  ConversationPhase,
  ConversationOpener,
  ConversationResponse,
  ResponseType,
  RoadmapAdjustment,

  // NEW: Engagement and dynamic conversation types
  EngagementAssessment,
  EngagementType,
  EngagementIndicator,
  EngagementIndicatorType,
  ResponseStrategy,
  EmotionalTone,
  ConversationProgress,
  ProgressCategory,
  CategoryProgress,
  InformationQualityMetrics,
  KnowledgeGap,
  ConversationPriority,
  PacingStatus,
  ConversationFlowState,
  AdaptationRecommendation,
  AdaptationType,
  EnhancedConversationState,
  StudentConversationPreferences,
} from './types';

// ============================================================================
// TOPIC DETECTOR
// ============================================================================

export {
  detectTopics,
  reprioritizeTopics,
  getNextTopic,
  completeTopicWithLearnings,
  formatSubject,
  formatLevel,
  getRelevantSubjects,
  // Cross-subject pattern detection
  detectCrossSubjectPatterns,
  detectCrossSubjectPatternsWithLLM,
  crossSubjectPatternsToTopics,
  type CrossSubjectPattern,
  type CrossSubjectPatternType,
  // Report-derived topics
  generateReportTopics,
} from './topicDetector';

// ============================================================================
// INSIGHT EXTRACTOR
// ============================================================================

export {
  extractInsights,
  extractInsightsBatch,
  aggregateInsights,
  calibrateConfidence,
  type ExtractionResult,
  type ExtractionMethod,
} from './insightExtractor';

// ============================================================================
// PROFILE SYNTHESIZER
// ============================================================================

export {
  ProfileSynthesizer,
  profileSynthesizer,
  synthesizeProfile,
  adjustTeachingRecommendations,
  // LLM-enhanced synthesis functions
  synthesizeCapabilityWithLLM,
  generateHolisticCapabilitySynthesis,
  // Core new types (AO Perception vs Internal Understanding)
  type AOPerception,
  type InternalUnderstanding,
  type ApplicationStrategy,
  type SubjectAnalysisWithContext,
  type PerceptionRealityGap,
  type GlobalApplicationStrategy,
  // Supporting types
  type ExternalFactorSummary,
  type TeacherIssue,
  type HiddenPotential,
  type AdditionalInfoItem,
  // Synthesized profile (refactored)
  type SynthesizedCapabilityProfile,
  type SourceMismatch,
  // Legacy types (deprecated but maintained for backwards compatibility)
  type AdjustedSubjectStrength,
  type QualitativeAdjustment,
  type SynthesizedInsight,
} from './profileSynthesizer';

// ============================================================================
// CONVERSATION ENGINE (Main Entry Point)
// ============================================================================

export {
  CapabilityConversationEngine,
  capabilityConversationEngine,
  initializeCapabilityConversation,
  processCapabilityConversationTurn,
  finalizeCapabilityConversation,
  type ConversationEngineOptions,
  type InitializeResult,
  type ProcessTurnResult,
} from './capabilityConversationEngine';

// ============================================================================
// ENGAGEMENT DETECTION (NEW)
// ============================================================================

export {
  assessEngagementHeuristic,
  assessEngagementWithLLM,
  analyzeEngagementTrend,
  getLowEngagementStreak,
  needsAdaptation,
  ENGAGEMENT_PATTERNS,
} from './engagementDetector';

// ============================================================================
// DYNAMIC RESPONSE GENERATION (NEW)
// ============================================================================

export {
  generateDynamicResponse,
  generateRephrasedQuestion,
  generateAcknowledgment,
  type GenerateResponseInput,
  type GeneratedResponse,
} from './dynamicResponseGenerator';

// ============================================================================
// PROGRESS TRACKING (NEW)
// ============================================================================

export {
  initializeProgress,
  updateProgress,
  getCategoryDescription,
  getCategoryImportance,
  summarizeUnderstanding,
} from './progressTracker';

// ============================================================================
// RESEARCH-BACKED GUIDANCE LAYER
// ============================================================================

export {
  ResearchBackedGuidanceLayer,
  researchBackedGuidanceLayer,
  generateResearchBackedGuidance,
  // Quick access functions
  getCalibratedGPAInterpretation,
  getMajorCourseRequirements,
  getSchoolValueMatrix,
  getContextAdjustment,
  // Types
  type ResearchBackedGuidance,
  type CalibratedAcademicAssessment,
  type SubjectCalibratedAssessment,
  type ContextAwareRecommendation,
  type SchoolSpecificStrategy,
  type ConversationGuidancePoint,
  type ResearchBackedApplicationStrategy,
  type ResearchGuidanceInput,
} from './researchBackedGuidanceLayer';

// ============================================================================
// ACADEMIC PLANNING ADVISOR (Course Selection, Workload, Major Alignment)
// ============================================================================

export {
  AcademicPlanningAdvisor,
  academicPlanningAdvisor,
  generateAcademicPlanningAdvice,
  // Types
  type AcademicPlanningInput,
  type AcademicPlanningAdvice,
  type TrajectoryAssessment,
  type CourseRecommendation,
  type WorkloadAdvice,
  type MajorAlignmentAdvice,
  type AcademicRedFlag,
  type AcademicOpportunity,
  type ProbingQuestion,
} from './academicPlanningAdvisor';

// ============================================================================
// MAJOR RESOLUTION SERVICE (Smart hierarchical major matching)
// ============================================================================

export {
  resolveStudentInterest,
  resolveMultipleInterests,
  getTargetedContext,
  getSpecializationsOf,
  getAllIndexedNames,
  getMajorCount,
  type ResolvedMajor,
  type TargetedMajorContext,
} from './majorResolutionService';
