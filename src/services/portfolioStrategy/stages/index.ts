// @ts-nocheck
/**
 * PASS Pipeline Stages Index
 *
 * Exports all stage services for the Portfolio & Application Strategy System.
 * Each stage uses Sonnet for workshop-level depth and nuanced analysis.
 */

// Stage 0: Profile Classification
export {
  STUDENT_ARCHETYPES,
  HIDDEN_STRENGTH_CATEGORIES,
  CONTEXT_CALIBRATION_FACTORS,
  classifyStudentProfile,
  stage0ProfileClassification,
} from './stage0ProfileClassification';
export type {
  Stage0Input,
  Stage0Output,
} from './stage0ProfileClassification';

// Stage 1A: Activity Portfolio Analysis
export {
  ACTIVITY_TIER_DEFINITIONS,
  SPIKE_DETECTION_FRAMEWORK,
  HIDDEN_GEM_CATEGORIES,
  analyzeActivityPortfolio,
  stage1AActivityAnalysis,
} from './stage1AActivityAnalysis';
export type {
  Stage1AInput,
  Stage1AOutput,
} from './stage1AActivityAnalysis';

// Stage 1B: Academic Profile Analysis
export {
  RIGOR_CALIBRATION_FRAMEWORK,
  TRAJECTORY_PATTERNS,
  TESTING_FRAMEWORK,
  ACADEMIC_SPIKE_INDICATORS,
  analyzeAcademicProfile,
  stage1BAcademicAnalysis,
} from './stage1BAcademicAnalysis';
export type {
  Stage1BInput,
  Stage1BOutput,
} from './stage1BAcademicAnalysis';

// Stage 2: Character & Narrative Analysis
export {
  CHARACTER_DIMENSIONS,
  NARRATIVE_COHERENCE_FRAMEWORK,
  RED_FLAG_PATTERNS,
  analyzeCharacterAndNarrative,
  stage2CharacterAnalysis,
} from './stage2CharacterAnalysis';
export type {
  Stage2Input,
  Stage2Output,
} from './stage2CharacterAnalysis';

// Stage 3: School Fit Analysis
export {
  ELITE_SCHOOL_PROFILES,
  SCHOOL_TIERS,
  LIST_BUILDING_FRAMEWORK,
  analyzeSchoolFit,
  stage3SchoolFit,
} from './stage3SchoolFit';
export type {
  Stage3Input,
  Stage3Output,
  SchoolFitAnalysis,
} from './stage3SchoolFit';

// Stage 4: Strategic Guidance
export {
  GRADE_LEVEL_PRIORITIES,
  ACTIVITY_OPTIMIZATION_FRAMEWORK,
  ESSAY_STRATEGY_FRAMEWORK,
  SUMMER_STRATEGY_FRAMEWORK,
  INTERVIEW_PREP_FRAMEWORK,
  RECOMMENDATION_STRATEGY_FRAMEWORK,
  generateStrategicGuidance,
  stage4StrategicGuidance,
} from './stage4StrategicGuidance';
export type {
  Stage4Input,
  Stage4Output,
} from './stage4StrategicGuidance';

// Stage 5: Verification
export {
  CONSISTENCY_CHECKS,
  REALISM_CHECKS,
  SCORE_VALIDATION,
  verifyAnalysis,
  stage5Verification,
} from './stage5Verification';
export type {
  Stage5Input,
  Stage5Output,
} from './stage5Verification';
