/**
 * Portfolio Strategy Services Index
 *
 * Exports all academic analysis services with Section 6 research integration.
 *
 * Architecture:
 * - Stage 0: Data Validation (sync)
 * - Stage 1: Heuristic Foundation (TrajectoryAnalyzer, RedFlagDetector, CommitmentAnalyzer, MajorAlignmentAnalyzer)
 * - Stage 2: Context Calibration (Haiku - fast)
 * - Stage 3: Deep Pattern Analysis (Sonnet - quality)
 * - Stage 4: Harvard Score Synthesis (Sonnet - quality)
 */

// ============================================================================
// CORE ANALYSIS PIPELINE (Main Entry Point)
// ============================================================================

export {
  AcademicAnalysisPipeline,
  academicAnalysisPipeline,
  analyzeAcademicHistoryFull,
  type FullAcademicAnalysis,
  type PipelineOptions,
  type CostTracker,
  type ValidationResult,
} from './academicAnalysisPipeline';

// ============================================================================
// STAGE 1: HEURISTIC ANALYZERS (No LLM Required)
// ============================================================================

// Trajectory Analyzer - Year-weighted GPA and GPA-Rigor interaction
export {
  TrajectoryAnalyzer,
  trajectoryAnalyzer,
  analyzeTrajectory,
  type TrajectoryType,
  type RigorTrajectoryType,
  type GPARigorInteraction,
  type TransitionQuality,
  type YearData,
  type TrajectoryAnalysis as DetailedTrajectoryAnalysis,
} from './trajectoryAnalyzer';

// Red Flag Detector - Section 6.9 patterns
export {
  AcademicRedFlagDetector,
  academicRedFlagDetector,
  detectAcademicRedFlags,
  getRedFlagDefinitions,
  type RedFlagSeverity,
  type DetectedRedFlag,
  type RedFlagReport,
} from './academicRedFlagDetector';

// Course Commitment Analyzer - Multi-year sequences and depth
export {
  CourseCommitmentAnalyzer,
  courseCommitmentAnalyzer,
  analyzeCommitment,
  type CourseSequence,
  type SubjectDrop,
  type CommitmentSignal,
  type CommitmentAnalysis,
} from './courseCommitmentAnalyzer';

// Major Alignment Analyzer - Intended major vs. coursework
export {
  MajorAlignmentAnalyzer,
  majorAlignmentAnalyzer,
  analyzeMajorAlignment,
  type MajorRequirements,
  type MajorAlignmentResult,
} from './majorAlignmentAnalyzer';

// Confidence Scorer - Data completeness and cross-validation
export {
  ConfidenceScorer,
  confidenceScorer,
  calculateConfidence,
  type ConfidenceBreakdown,
} from './confidenceScorer';

// ============================================================================
// PROMPT BUILDER (For LLM Stages)
// ============================================================================

export {
  AcademicPromptBuilder,
  academicPromptBuilder,
  buildStage2Prompt,
  buildStage3Prompt,
  buildStage4Prompt,
  type Stage2ContextPrompt,
  type Stage3DeepAnalysisPrompt,
  type Stage4SynthesisPrompt,
  type ContextCalibration,
  type DeepPatternAnalysis,
  type HarvardScoreSynthesis,
} from './academicPromptBuilder';

// ============================================================================
// LEGACY EXPORTS (For Backward Compatibility)
// ============================================================================

// Academic History Analyzer - Original service
export {
  AcademicHistoryAnalyzer,
  academicHistoryAnalyzer,
  analyzeAcademicHistory,
  // Research knowledge bases
  COURSE_LEVEL_HIERARCHY,
  AP_DIFFICULTY_TIERS,
  SCHOOL_CONTEXT_TIERS,
  GPA_EXPECTATIONS,
  ACADEMIC_RED_FLAGS,
  INTERNATIONAL_CURRICULA,
  HOMESCHOOL_VALIDATION,
  // Types
  type AcademicHistoryInput,
  type AcademicHistoryAnalysis,
  type CourseRecord,
  type GPAAnalysis,
  type RigorAnalysis,
  type TrajectoryAnalysis,
  type TestingAnalysis,
  type RedFlagAssessment,
  type CompetitivePositioning,
  type AcademicRecommendations,
  type CitationRecord,
} from './academicHistoryAnalyzer';

// Academic Teaching Service - Research-backed explanations
export {
  AcademicTeachingService,
  academicTeachingService,
  getAcademicTeaching,
  formatAcademicTeaching,
  type AcademicIssueType,
  type AcademicTeachingMoment,
  type Citation,
} from './academicTeachingService';
