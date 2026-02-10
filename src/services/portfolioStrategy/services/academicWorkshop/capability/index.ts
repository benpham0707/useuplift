/**
 * Capability Profile Module
 *
 * A system for building reusable, cached understanding of a student's
 * demonstrated academic capabilities based on their complete course history.
 *
 * Philosophy: Students should take the difficulty level that allows them to
 * achieve their best grades, calibrated to their proven abilities.
 *
 * Key Features:
 * - Analyzes complete academic history to understand demonstrated capabilities
 * - Builds subject-specific capability profiles
 * - Assesses challenge tolerance (how well student handles difficulty increases)
 * - Generates optimal difficulty recommendations
 * - Provides personalized progression advice
 *
 * Usage:
 * ```typescript
 * import { buildCapabilityProfile } from './capability';
 *
 * const result = buildCapabilityProfile({
 *   courses: studentCourses,
 *   gradeHistory: { freshman: { gpa: 3.7 }, sophomore: { gpa: 3.8 } },
 *   schoolContext: { apCoursesOffered: 20 },
 *   intendedMajor: 'Computer Science',
 * });
 *
 * if (result.success) {
 *   console.log('Capability Tier:', result.profile.overallCapability.capabilityTier);
 *   console.log('Recommended AP Count:', result.profile.optimalDifficultyLevel.recommendedAPCount);
 *   console.log('Guidance:', result.progressionAdvice.overallGuidance);
 * }
 * ```
 */

// ============================================================================
// MAIN PROFILER
// ============================================================================

export {
  CapabilityProfiler,
  capabilityProfiler,
  buildCapabilityProfile,
} from './capabilityProfiler';

export { GRADE_TO_GPA, GPA_TO_GRADE } from './types';

// ============================================================================
// NUANCED CAPABILITY ANALYZER (Continuous, not tiered)
// ============================================================================

export {
  NuancedCapabilityAnalyzer,
  nuancedCapabilityAnalyzer,
  analyzeCapabilityNuanced,
} from './nuancedCapabilityAnalyzer';

export type {
  // Core Nuanced Profile
  NuancedCapabilityAnalysis,

  // Performance Fingerprint
  PerformanceFingerprint,
  ExpectedPerformance,

  // Subject Patterns
  SubjectPatternMap,
  SubjectPattern,
  CoursePerformance,

  // Challenge Response
  ChallengeResponseAnalysis,
  DifficultyTransition,

  // Progression Trajectory
  ProgressionTrajectory,
  InflectionPoint,
  TrajectoryLever,

  // Performance Envelope
  PerformanceEnvelope,

  // Synthesis
  CapabilitySynthesis,
  SynthesisInsight,
} from './nuancedCapabilityAnalyzer';

// ============================================================================
// PROGRESSION TEACHING ENGINE (Actionable Guidance Layer)
// ============================================================================

export {
  ProgressionTeachingEngine,
  progressionTeachingEngine,
  generateProgressionTeaching,
} from './progressionTeachingEngine';

export type {
  // Main Teaching Output
  ProgressionTeaching,

  // Strategic Overview
  StrategicOverview,

  // Semester Planning
  SemesterPlan,
  CourseTypeRecommendation,

  // Future Outlook
  FutureYearOutlook,
  YearGuidance,
  Milestone,

  // Subject Guidance
  SubjectGuidance,

  // Decision Frameworks
  DecisionFramework,

  // Course Corrections
  CourseCorrectionGuidance,
  CorrectionResponse,

  // Motivation
  MotivationalFraming,
} from './progressionTeachingEngine';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core Profile
  AcademicCapabilityProfile,
  CapabilityProfileInput,
  CapabilityProfileResult,

  // Data Quality
  DataCompleteness,

  // Overall Capability
  OverallCapabilityAssessment,
  CapabilityTier,
  PerformanceByDifficulty,
  OptimalStretchPoint,
  PerformanceConsistency,
  CourseOutlier,

  // Subject Capabilities
  SubjectCapabilityMap,
  SubjectArea,
  SubjectCapability,
  SubjectCapabilityLevel,

  // Challenge Tolerance
  ChallengeTolerance,
  ToleranceLevel,
  ChallengeEvent,
  LevelTransitionPattern,

  // Learning Patterns
  LearningPatterns,
  GrowthPattern,

  // Optimal Difficulty
  OptimalDifficultyLevel,
  DifficultyRecommendation,

  // Progression Advice
  ProgressionAdvice,
  CourseRecommendation,
} from './types';

// ============================================================================
// CONVERSATIONAL CAPABILITY PROFILE SYSTEM
// ============================================================================

/**
 * Conversational Capability Profiling
 *
 * A system for building qualitative academic profiles through natural conversation.
 * Enhances the quantitative analysis with context, feelings, and student perspective.
 *
 * Usage:
 * ```typescript
 * import {
 *   initializeCapabilityConversation,
 *   processCapabilityConversationTurn,
 *   finalizeCapabilityConversation,
 * } from './capability/conversational';
 *
 * // Initialize conversation from quantitative analysis
 * const { opener, state, qualitativeInsights } = await initializeCapabilityConversation(
 *   nuancedAnalysis,
 *   { intendedMajor: 'Computer Science' }
 * );
 *
 * // Show opener to user
 * console.log(opener.message);
 *
 * // Process user responses
 * const result = await processCapabilityConversationTurn(
 *   userMessage,
 *   state,
 *   qualitativeInsights,
 *   nuancedAnalysis
 * );
 *
 * // Continue until result.response.shouldContinue is false
 *
 * // Finalize and synthesize
 * const synthesizedProfile = finalizeCapabilityConversation(
 *   result.state,
 *   result.qualitativeInsights,
 *   nuancedAnalysis
 * );
 * ```
 */
export {
  // Main conversation engine
  CapabilityConversationEngine,
  capabilityConversationEngine,
  initializeCapabilityConversation,
  processCapabilityConversationTurn,
  finalizeCapabilityConversation,

  // Topic detection
  detectTopics,
  reprioritizeTopics,
  getNextTopic,

  // Insight extraction
  extractInsights,
  aggregateInsights,
  calibrateConfidence,

  // Profile synthesis
  ProfileSynthesizer,
  profileSynthesizer,
  synthesizeProfile,
  adjustTeachingRecommendations,
} from './conversational';

export type {
  // Conversation engine types
  ConversationEngineOptions,
  InitializeResult,
  ProcessTurnResult,

  // Conversation state
  ConversationState,
  ConversationPhase,
  ConversationOpener,
  ConversationResponse,
  ResponseType,

  // Topic types
  ConversationTopic,
  TopicType,
  TargetInsight,

  // Insight types
  ExtractedInsight,
  InsightType,
  ExtractedValues,
  SentimentLevel,
  ExtractionResult,

  // Course-level annotations
  CourseAnnotation,
  TeacherQuality,
  ClassEnvironment,
  ExternalCircumstance,
  CircumstanceType,
  ImpactLevel,
  AnnotationFlag,

  // Subject-level insights
  SubjectInsight,

  // Learning and motivation
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

  // Qualitative profile
  QualitativeInsights,
  ProfileCompleteness,

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: AO Perception vs Internal Understanding (Separation of Concerns)
  // ═══════════════════════════════════════════════════════════════════════════
  // Core types for the separation:
  // - AOPerception: What admissions officers see (NEVER adjusted)
  // - InternalUnderstanding: What we know (for guidance only)
  // - ApplicationStrategy: Actionable recommendations
  // - PerceptionRealityGap: Where paper record differs from true capability
  AOPerception,
  InternalUnderstanding,
  ApplicationStrategy,
  SubjectAnalysisWithContext,
  PerceptionRealityGap,
  GlobalApplicationStrategy,
  // Supporting types
  ExternalFactorSummary,
  TeacherIssue,
  HiddenPotential,
  AdditionalInfoItem,

  // Synthesized profile (refactored with new architecture)
  SynthesizedCapabilityProfile,
  SourceMismatch,

  // Legacy synthesis types (deprecated but maintained for backwards compatibility)
  QualitativeAdjustment,
  AdjustmentType,
  SynthesizedInsight,
  AdjustedSubjectStrength,
} from './conversational';

// ============================================================================
// DEEP ACADEMIC REPORT (Teaching-depth analysis)
// ============================================================================

export {
  DeepAcademicReportService,
  deepAcademicReportService,
  generateDeepAcademicReport,
} from './deepAcademicReportService';

export type {
  // Input/Output
  DeepAcademicReportInput,
  DeepAcademicReport,

  // Sections
  AcademicIdentitySection,
  StrengthDeepDive,
  ChallengeDeepDive,
  AdmissionsOfficerLensSection,
  StrategicRoadmapSection,
  ResearchContextSection,

  // Supporting types
  BlindSpot,
  StrategicPriority,
  CourseStrategyItem,
  CourseAvoidItem,
  ResearchCitation,
  ReportMetadata,
  AssembledReportContext,
} from './deepAcademicReportTypes';
