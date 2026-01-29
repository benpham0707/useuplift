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
