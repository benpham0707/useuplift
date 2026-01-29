/**
 * Academic Workshop - Nuanced Academic History Analysis
 *
 * A multi-layer analysis pipeline that goes beyond pattern matching
 * to provide nuanced, context-aware academic portfolio assessment.
 *
 * Architecture:
 * - Layer 2: Heuristic Foundation (fast, no LLM)
 * - Layer 3: Deep Understanding (LLM - narrative + positioning)
 * - Layer 4: Multi-Dimensional Scoring (LLM)
 * - Layer 5: Teaching & Guidance (LLM)
 * - Layer 6: Portfolio Synthesis
 *
 * Key Features:
 * - Context-aware scoring (school resources, opportunities)
 * - Narrative extraction (the story behind the numbers)
 * - Research-backed teaching (explains the WHY)
 * - Harvard 1-6 scale mapping
 * - Improvement path generation
 *
 * Usage:
 * ```typescript
 * import { analyzeAcademicsWithDepth } from './academicWorkshop';
 *
 * const result = await analyzeAcademicsWithDepth(academicInput, {
 *   includeTeaching: true,
 *   targetSelectivity: 'top_25',
 * });
 *
 * if (result.success) {
 *   console.log('Harvard Score:', result.result.harvardScore);
 *   console.log('Narrative:', result.result.narrativeAnalysis.narrativeSummary);
 * }
 * ```
 */

// ============================================================================
// MAIN PIPELINE (Primary Entry Point)
// ============================================================================

export {
  NuancedAcademicPipeline,
  nuancedAcademicPipeline,
  analyzeAcademicsWithDepth,
} from './pipeline/nuancedAcademicPipeline';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Input types
  AcademicHistoryInput,
  CourseRecord,

  // Layer 2: Heuristics
  HeuristicFoundation,

  // Layer 3: Understanding
  AcademicNarrativeAnalysis,
  NarrativeType,
  KeyMoment,
  CharacterTrait,
  PassionSignal,
  RedNarrative,
  ContextualPositioning,
  RelativeRigor,
  RelativePerformance,
  Layer3Understanding,

  // Layer 4: Scoring
  AcademicDimensionScores,
  DimensionScore,
  RigorScore,
  PerformanceScore,
  IntellectualCharacterScore,
  TrajectoryScore,

  // Layer 5: Teaching
  TeachingMoment,
  AcademicTeaching,

  // Layer 6: Synthesis
  AcademicPortfolioScore,
  HarvardScore,
  HarvardScoreMapping,
  ImprovementPath,

  // Pipeline
  PipelineOptions,
  PipelineResult,
  CostTracker,
} from './types';

// ============================================================================
// SCORING RUBRICS (Reference Constants)
// ============================================================================

export {
  HARVARD_SCORE_MAPPINGS,
  RIGOR_RUBRIC,
  PERFORMANCE_RUBRIC,
  CHARACTER_RUBRIC,
  TRAJECTORY_RUBRIC,
} from './types';

// ============================================================================
// LAYER 2: HEURISTIC FOUNDATION
// ============================================================================

export {
  HeuristicFoundationBuilder,
  heuristicFoundationBuilder,
  buildHeuristicFoundation,
  type HeuristicFoundationResult,
} from './understanding/heuristicFoundation';

// ============================================================================
// LAYER 3: UNDERSTANDING SERVICES
// ============================================================================

export {
  AcademicNarrativeAnalyzer,
  academicNarrativeAnalyzer,
  analyzeAcademicNarrative,
  type NarrativeAnalyzerOptions,
  type NarrativeAnalyzerResult,
} from './understanding/academicNarrativeAnalyzer';

export {
  ContextualPositioner,
  contextualPositioner,
  analyzeContextualPosition,
  type PositionerOptions,
  type PositionerResult,
} from './understanding/contextualPositioner';

// ============================================================================
// LAYER 4: SCORING SERVICE
// ============================================================================

export {
  MultiDimensionalScorer,
  multiDimensionalScorer,
  scoreAcademicDimensions,
  type ScorerOptions,
  type ScorerResult,
} from './scoring/multiDimensionalScorer';

// ============================================================================
// LAYER 5: TEACHING SERVICE
// ============================================================================

export {
  AcademicTeachingEngine,
  academicTeachingEngine,
  generateAcademicTeaching,
  generateFallbackTeaching,
  type TeachingEngineOptions,
  type TeachingEngineResult,
} from './teaching/academicTeachingEngine';

// ============================================================================
// LAYER 6: SYNTHESIS SERVICE
// ============================================================================

export {
  AcademicPortfolioSynthesizer,
  academicPortfolioSynthesizer,
  synthesizeAcademicPortfolio,
  type SynthesizerInput,
} from './scoring/academicPortfolioSynthesizer';

// ============================================================================
// COMPREHENSIVE EXPERIENCE ANALYSIS (EC-style depth for academics)
// ============================================================================

/**
 * Experience Analysis - Comprehensive academic evaluation
 *
 * This provides deep, actionable analysis of academic records:
 * - How admissions officers will evaluate the transcript
 * - What the GPA and course selections mean in context
 * - Where the student stands competitively
 * - Red flags and how to address them
 * - Specific guidance for Additional Info, counselor letters, interviews
 *
 * Usage:
 * ```typescript
 * import { generateAcademicHistoryReport, buildHeuristicFoundation } from './academicWorkshop';
 *
 * const heuristics = buildHeuristicFoundation(input);
 * const result = await generateAcademicHistoryReport(input, heuristics.foundation, 'ivy_plus');
 *
 * if (result.success) {
 *   console.log(result.report.executiveSummary.oneSentenceRead);
 *   console.log(result.report.admissionsOfficerPerspective.firstImpression);
 * }
 * ```
 */
export {
  // Main comprehensive report
  AcademicHistoryReportGenerator,
  academicHistoryReportGenerator,
  generateAcademicHistoryReport,
  type AnalysisReportResult,
  type AcademicHistoryReport,
  // Report section types
  type GPAAnalysis,
  type GradeDistribution,
  type RigorEvaluation,
  type APAnalysis,
  type MajorPreparation,
  type SubjectDepth,
  type RedFlagsAndConcerns,
  type DetectedIssue,
  type AdmissionsOfficerPerspective,
  type AOQuestion,
  type ActionableGuidance,
  type ResearchContext,
  type ResearchDataPoint,
} from './experience';

// ============================================================================
// CAPABILITY PROFILE SYSTEM (Reusable Student Understanding)
// ============================================================================

/**
 * Capability Profile - Reusable understanding of student academic abilities
 *
 * Builds a cached profile of the student's demonstrated capabilities based on
 * their complete academic history. Used to provide personalized course
 * difficulty recommendations that maximize GPA while appropriately challenging.
 *
 * Philosophy: Students should take the difficulty level that allows them to
 * achieve their best grades, calibrated to their proven abilities.
 *
 * Usage:
 * ```typescript
 * import { buildCapabilityProfile } from './academicWorkshop';
 *
 * const result = buildCapabilityProfile({
 *   courses: studentCourses,
 *   gradeHistory: { freshman: { gpa: 3.7 }, sophomore: { gpa: 3.8 } },
 *   schoolContext: { apCoursesOffered: 20 },
 *   intendedMajor: 'Computer Science',
 * });
 *
 * if (result.success) {
 *   // Overall capability tier: elite, high_achiever, solid_performer, etc.
 *   console.log('Capability:', result.profile.overallCapability.capabilityTier);
 *
 *   // Subject-specific recommendations
 *   console.log('Math level:', result.profile.subjectCapabilities.math?.recommendedNextLevel);
 *
 *   // Recommended AP count
 *   console.log('AP Count:', result.profile.optimalDifficultyLevel.recommendedAPCount);
 *
 *   // Full progression advice
 *   console.log('Guidance:', result.progressionAdvice.overallGuidance);
 * }
 * ```
 */
export {
  // Main profiler (tier-based, for backwards compatibility)
  CapabilityProfiler,
  capabilityProfiler,
  buildCapabilityProfile,
  // Grade utilities
  GRADE_TO_GPA,
  GPA_TO_GRADE,
  // Nuanced analyzer (continuous, no tiers)
  NuancedCapabilityAnalyzer,
  nuancedCapabilityAnalyzer,
  analyzeCapabilityNuanced,
  // Teaching engine (actionable guidance layer)
  ProgressionTeachingEngine,
  progressionTeachingEngine,
  generateProgressionTeaching,
} from './capability';

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
  // Nuanced Analysis Types
  NuancedCapabilityAnalysis,
  PerformanceFingerprint,
  ExpectedPerformance,
  SubjectPatternMap,
  SubjectPattern,
  CoursePerformance,
  ChallengeResponseAnalysis,
  DifficultyTransition,
  ProgressionTrajectory,
  InflectionPoint,
  TrajectoryLever,
  PerformanceEnvelope,
  CapabilitySynthesis,
  SynthesisInsight,
  // Teaching Types
  ProgressionTeaching,
  StrategicOverview,
  SemesterPlan,
  CourseTypeRecommendation,
  FutureYearOutlook,
  YearGuidance,
  Milestone,
  SubjectGuidance,
  DecisionFramework,
  CourseCorrectionGuidance,
  CorrectionResponse,
  MotivationalFraming,
} from './capability';
