/**
 * PASS Knowledge Base Index
 *
 * Comprehensive databases for calibrated assessment of:
 * - Extracurricular activities and achievements
 * - Academic performance and trajectory
 * - School-specific values and fit
 * - Context adjustment factors
 */

// Extracurricular Database
export {
  MATH_COMPETITION_HIERARCHY,
  SCIENCE_OLYMPIAD_HIERARCHY,
  CS_COMPETITION_HIERARCHY,
  RESEARCH_COMPETITION_HIERARCHY,
  DEBATE_SPEECH_HIERARCHY,
  ARTS_COMPETITION_HIERARCHY,
  ATHLETICS_HIERARCHY,
  LEADERSHIP_SERVICE_HIERARCHY,
  ENTREPRENEURSHIP_HIERARCHY,
  ROBOTICS_HIERARCHY,
  SUMMER_PROGRAMS_HIERARCHY,
  CYBERSECURITY_HIERARCHY,
  ADDITIONAL_CS_HIERARCHY,
  JSHS_HIERARCHY,
  MODEL_UN_HIERARCHY,
  ECONOMICS_BUSINESS_HIERARCHY,
  ADMISSION_IMPACT_MULTIPLIERS,
  HOOKS_AND_SPECIAL_FACTORS,
  CONTEXT_MULTIPLIERS,
  RED_FLAG_PATTERNS,
  classifyActivityWithDatabase,
  extracurricularDatabase,
} from './extracurricularDatabase';

export type {
  ActivityInput,
  TierResult,
} from './extracurricularDatabase';

// Academic Database
export {
  GPA_CALIBRATION,
  COURSE_RIGOR_BENCHMARKS,
  TEST_SCORE_CALIBRATION,
  GRADE_TRAJECTORY_ANALYSIS,
  RESEARCH_CALIBRATION,
  analyzeAcademicProfileWithDatabase,
  academicDatabase,
} from './academicDatabase';

export type {
  AcademicInput,
  AcademicResult,
} from './academicDatabase';

// Character Database
export {
  INTELLECTUAL_VITALITY_CALIBRATION,
  LEADERSHIP_QUALITY_CALIBRATION,
  COMMUNITY_IMPACT_CALIBRATION,
  PERSONAL_GROWTH_CALIBRATION,
  RESILIENCE_GRIT_CALIBRATION,
  CREATIVITY_INNOVATION_CALIBRATION,
  AUTHENTICITY_VOICE_CALIBRATION,
  CHARACTER_DIMENSION_WEIGHTS,
  calculateCompositeCharacterScore,
  characterDatabase,
} from './characterDatabase';

export type {
  CharacterEvidence,
  CompositeCharacterResult,
} from './characterDatabase';

// School Value Matrices
export {
  ELITE_SCHOOL_VALUE_MATRICES,
  SCHOOL_VALUE_WEIGHTS,
  ADMISSION_STATISTICS,
  DEMONSTRATED_INTEREST_IMPACT,
  LEGACY_DEVELOPMENT_IMPACT,
  ED_EA_STRATEGIES,
  SCHOOL_FIT_ASSESSMENT_CRITERIA,
  calculateSchoolFitScore,
  getSchoolSpecificStrategy,
  schoolValueDatabase,
} from './schoolValueDatabase';

export type {
  SchoolValueMatrix,
  SchoolFitInput,
  SchoolFitResult,
} from './schoolValueDatabase';

// Context Adjustment Factors
export {
  SOCIOECONOMIC_CONTEXT_FACTORS,
  GEOGRAPHIC_CONTEXT_FACTORS,
  FAMILY_CONTEXT_FACTORS,
  SCHOOL_RESOURCE_CONTEXT,
  FIRST_GEN_IMPACT,
  UNDERREPRESENTED_MINORITY_IMPACT,
  RECRUITED_ATHLETE_IMPACT,
  LEGACY_CONTEXT,
  DISABILITY_ACCOMMODATION_CONTEXT,
  calculateContextMultiplier,
  getContextAdjustedScore,
  contextAdjustmentDatabase,
} from './contextAdjustmentDatabase';

export type {
  StudentContext,
  ContextAdjustmentResult,
} from './contextAdjustmentDatabase';

// Extended Extracurricular Database (Comprehensive Coverage)
export {
  ENTREPRENEURSHIP_STARTUP_HIERARCHY,
  NONPROFIT_SERVICE_HIERARCHY,
  INTERNSHIP_WORK_HIERARCHY,
  SCHOOL_CLUBS_HIERARCHY,
  PERFORMING_ARTS_HIERARCHY,
  VISUAL_ARTS_HIERARCHY,
  WRITING_JOURNALISM_HIERARCHY,
  UNIQUE_ACTIVITIES_HIERARCHY,
  extracurricularDatabaseExtended,
} from './extracurricularDatabaseExtended';

// Major-Activity Alignment Matrix
export {
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT,
  SPIKE_DOMAINS,
  COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS,
  UNIVERSAL_POSITIVE_SIGNALS,
  MAJOR_COMPETITIVE_BENCHMARKS,
  majorActivityAlignment,
} from './majorActivityAlignment';

export type {
  MajorCategory,
  ActivityCategory,
  SpikeProfile,
  CoherenceAnalysis,
} from './majorActivityAlignment';

// Impact Metrics Framework
export {
  IMPACT_TIER_DESCRIPTIONS,
  BENEFICIARY_METRICS,
  FINANCIAL_METRICS,
  DIGITAL_METRICS,
  RESEARCH_METRICS,
  LEADERSHIP_METRICS,
  COMPETITION_METRICS,
  TIME_METRICS,
  RECOGNITION_METRICS,
  METRIC_RED_FLAGS,
  VERIFICATION_STANDARDS,
  CROSS_DOMAIN_COMPARISON,
  impactMetricsFramework,
} from './impactMetricsFramework';

export type {
  ImpactTier,
  MetricThresholds,
  ImpactScore,
  ActivityImpactAnalysis,
} from './impactMetricsFramework';

// Spike Detection & Profile Coherence System
export {
  SPIKE_DEFINITIONS,
  COHERENCE_SCORE_INTERPRETATION,
  SPIKE_STRENGTH_WEIGHTS,
  SPIKE_SCORING_RULES,
  NARRATIVE_CLARITY_RULES,
  COHERENCE_RED_FLAGS as SPIKE_COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS as SPIKE_COHERENCE_GREEN_FLAGS,
  PITCH_TEMPLATES,
  ARCHETYPE_DETECTION_RULES,
  RECOMMENDATION_TEMPLATES,
  spikeDetectionSystem,
} from './spikeDetectionSystem';

export type {
  SpikeType,
  SpikeDefinition,
  CoherenceScore,
  ProfileArchetype,
  SpikeRecommendations,
  ActivityInput as SpikeActivityInput,
  StudentProfileInput,
} from './spikeDetectionSystem';

// Award Knowledge Base
export {
  AwardKnowledgeBaseService,
  awardKnowledgeBase,
} from './awardKnowledgeBase';