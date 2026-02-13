// @ts-nocheck
/**
 * Portfolio Strategy System - Type Definitions
 *
 * Central export for all PASS (Portfolio & Application Strategy System) types.
 * These types form the foundation of the entire system, enabling:
 *
 * 1. Academic evaluation with school-specific benchmarking
 * 2. Activity portfolio analysis with tier classification and spike detection
 * 3. Award/honor evaluation with Common App optimization
 * 4. Holistic profile synthesis with archetype detection
 * 5. School fit analysis with admission probability estimation
 * 6. Actionable guidance with progress tracking
 *
 * QUALITY PRINCIPLE: These types are designed for DEPTH, not just breadth.
 * Every assessment includes context, justification, and actionable insights.
 */

// ============================================================================
// ACADEMIC EVALUATION TYPES
// ============================================================================

export {
  // Core types
  AcademicTier,
  GPAType,
  GPAScale,
  GradeTrend,
  TestPolicy,
  RankReportingMethod,
  CourseRigorLevel,

  // Input types
  GPAData,
  ClassRankData,
  StandardizedTestScores,
  CourseEntry,
  APExamResult,
  SchoolContext,
  AcademicInputData,

  // Evaluation output types
  GPAStrengthAssessment,
  CourseRigorAssessment,
  TestingStrengthAssessment,
  GradeTrendAnalysis,
  ClassRankAnalysis,
  SchoolAcademicFit,
  AcademicEvaluation,

  // Benchmark types
  SchoolAcademicBenchmarks,
  AcademicAdmissionContext,
} from './academic';

// ============================================================================
// ACTIVITY PORTFOLIO TYPES
// ============================================================================

export {
  // Core types
  ActivityTier,
  ACTIVITY_TIER_DESCRIPTIONS,
  ActivityCategory,
  LeadershipType,
  RecognitionLevel,
  ImpactType,
  SpikeStrength,
  DepthBreadthProfile,

  // Input types
  TimeCommitment,
  LeadershipPosition,
  ActivityAchievement,
  ActivityInputData,
  ActivitiesInputData,

  // Tier classification types
  ActivityTierAssessment,

  // Spike analysis types
  ThemeCluster,
  SpikeAnalysis,

  // Coherence types
  ThematicCoherenceAnalysis,

  // Commitment and leadership types
  CommitmentAnalysis,
  LeadershipAnalysis,

  // Recommendation types
  ActivityUpgradeRecommendation,
  NewActivitySuggestion,

  // Complete output
  ActivityPortfolioAnalysis,
} from './activities';

// ============================================================================
// AWARD EVALUATION TYPES
// ============================================================================

export {
  // Core types
  AwardRecognitionLevel,
  AwardSelectivity,
  AwardCategory,
  CommonAppHonorLevel,

  // Input types
  AwardInputData,
  AwardsInputData,

  // Assessment types
  AwardAssessment,
  AwardDistributionAnalysis,
  AwardHighlightsAnalysis,
  CommonAppHonorsOptimization,
  AwardCompetitiveContext,
  AwardGapAnalysis,

  // Database types
  KnownAwardProfile,

  // Complete output
  AwardEvaluation,
} from './awards';

// ============================================================================
// HOLISTIC SYNTHESIS TYPES
// ============================================================================

export {
  // Core types
  ProfileTier,
  ApplicationArchetype,
  ComponentWeight,

  // Context types
  PersonalContext,
  GoalsAspirations,

  // Value proposition types
  UniqueValueProposition,
  ApplicationBrand,

  // Coherence types
  CoherenceAnalysis,

  // Essay quality types
  EssayQualitySummary,

  // Complete output
  HolisticProfileSynthesis,

  // Configuration types
  SynthesisWeightingConfig,
  ArchetypeDetectionConfig,
} from './synthesis';

// ============================================================================
// SCHOOL FIT TYPES
// ============================================================================

export {
  // Core types
  SchoolCategory,
  DecisionType,
  ApplicationStatus,
  DemonstratedInterestImportance,
  InterviewImportance,

  // School profile types
  CollegeAdmissionProfile,

  // Fit analysis types
  FitDimensionScore,
  SchoolFitAnalysis,
  SchoolFitAssessment,

  // School list types
  CategorizedSchoolList,
  SchoolSuggestions,
  ApplicationStrategyRecommendations,

  // Complete output
  SchoolFitOutput,

  // Probability types
  ProbabilityFactors,
  ProbabilityEstimationConfig,
} from './schoolFit';

// ============================================================================
// GUIDANCE TYPES
// ============================================================================

export {
  // Core types
  ActionPriority,
  ActionCategory,
  ActionEffort,
  ActionStatus,
  TimeHorizon,

  // Action item types
  ActionItem,
  ActionItemSummary,

  // Category-specific guidance types
  AcademicGuidance,
  ActivitiesGuidance,
  AwardsGuidance,
  EssayGuidance,
  SchoolListGuidance,

  // Progress tracking types
  Milestone,
  ProgressSummary,

  // Complete output
  GuidanceReport,

  // Configuration types
  GuidanceGenerationConfig,
} from './guidance';

// ============================================================================
// RESEARCH CONTEXT TYPES (NEW)
// ============================================================================

export {
  // Module identification
  ResearchSection,
  ResearchModuleId,
  ResearchModuleMetadata,

  // Context loading
  ResearchContextRequest,
  AnalysisStage,
  ResearchContext,
  LoadedModule,
  Citation,

  // Mappings
  STAGE_MODULE_MAPPING,
  ACTIVITY_TO_DATABASE,

  // Configuration
  ResearchContextConfig,
  DEFAULT_RESEARCH_CONFIG,
  IResearchContextService,
} from './research';

// ============================================================================
// HARVARD SCORING TYPES (NEW)
// ============================================================================

export {
  // Core scoring
  HarvardScore,
  HarvardScoreDecimal,
  HARVARD_SCORE_DESCRIPTORS,
  harvardScoreToPercentage,
  percentageToHarvardScore,

  // Component scoring
  ScoringComponent,
  ComponentWeights,
  DEFAULT_COMPONENT_WEIGHTS,
  ComponentScore,

  // Context adjustments
  ContextAdjustment,
  ContextAdjustmentFactor,
  CONTEXT_ADJUSTMENT_LIMITS,
  MAX_TOTAL_CONTEXT_ADJUSTMENT,

  // Red flag deductions
  RedFlagDeduction,
  RED_FLAG_DEDUCTION_RANGES,

  // Universal holistic score
  UniversalHolisticScore,

  // School-specific weights
  SchoolType,
  SCHOOL_TYPE_WEIGHT_ADJUSTMENTS,

  // Utilities
  compareHarvardScores,
  getScoreTierLabel,
  getT10AdmissionProbability,

  // Activity tier mapping
  ActivityTierScore,
  ACTIVITY_TIER_DESCRIPTIONS as ACTIVITY_TIER_SCORE_DESCRIPTIONS,
  activityTierToHarvardContribution,
} from './scoring';

// ============================================================================
// CHARACTER ASSESSMENT TYPES (NEW)
// ============================================================================

export {
  // Core types
  CharacterDimension,
  DimensionAssessment,

  // Dimension-specific assessments
  IntellectualVitalityAssessment,
  LeadershipImpactAssessment,
  CharacterIntegrityAssessment,
  ResilienceGrowthAssessment,
  CommunityContributionAssessment,
  AuthenticityVoiceAssessment,
  FuturePotentialAssessment,

  // Complete assessment
  CharacterAssessment,

  // Constants
  CHARACTER_DIMENSION_WEIGHTS,
  CHARACTER_SCORE_DESCRIPTORS,
} from './character';

// ============================================================================
// RED FLAG DETECTION TYPES (NEW)
// ============================================================================

export {
  // Core types
  RedFlagSeverity,
  RedFlagCategory,
  DetectionConfidence,
  RedFlag,

  // Category-specific flags
  FraudFabricationFlag,
  ActivityInflationFlag,
  EssayAssistanceFlag,
  InternalInconsistencyFlag,
  HourImpossibilityFlag,

  // Complete report
  RedFlagReport,

  // Constants
  RED_FLAG_DEDUCTIONS,
  RED_FLAG_SEVERITY_DESCRIPTORS,
  CATEGORY_DEFAULT_SEVERITY,

  // Detection patterns
  DetectionPattern,
  HOUR_IMPOSSIBILITY_THRESHOLDS,
  ACTIVITY_INFLATION_THRESHOLDS,
} from './redFlags';

// ============================================================================
// CONTEXT CALIBRATION TYPES (NEW)
// ============================================================================

export {
  // Core types
  ContextCategory,
  ContextFactor,

  // Context assessments
  SocioeconomicContext,
  GeographicContext,
  PersonalCircumstances,
  EducationalContext,
  IdentityContext,

  // Adversity/responsibility types
  AdversityType,
  FamilyResponsibilityType,
  LifeDisruptionType,

  // Complete calibration
  ContextCalibration,

  // Configuration
  CalibrationConfig,
  DEFAULT_CALIBRATION_CONFIG,

  // Utilities
  calculateFactorAdjustment,
  CONTEXT_IMPACT_LEVELS,
} from './calibration';

// ============================================================================
// NARRATIVE SYNTHESIS TYPES (NEW)
// ============================================================================

export {
  // Core types
  NarrativeStrength,
  NarrativeCoherence,

  // Two-sentence pitch
  TwoSentencePitch,

  // Narrative components
  NarrativeThread,
  ApplicationStory,
  NarrativeElements,

  // Complete synthesis
  NarrativeSynthesis,

  // Validation
  NarrativeValidation,

  // Constants
  NARRATIVE_STRENGTH_THRESHOLDS,
  NARRATIVE_COHERENCE_THRESHOLDS,
  NARRATIVE_QUALITY_INDICATORS,
} from './narrative';

// ============================================================================
// TIMELINE & GRADE-SPECIFIC GUIDANCE TYPES (NEW)
// ============================================================================

export {
  // Core types
  GradeLevel,
  YearPhase,
  DevelopmentPhase,
  ApplicationTimeline,
  TimelineContext,

  // Priority types
  GradeSpecificPriorities,
  PriorityCategory,

  // Grade-specific guidance
  FreshmanGuidance,
  SophomoreGuidance,
  JuniorGuidance,
  SeniorGuidance,

  // Timeline components
  CriticalDeadlines,
  TimelineAction,
  MonthlyPlan,
  TimelineAssessment,

  // Constants
  GRADE_LEVEL_FOCUS,
  MONTHS_UNTIL_DEADLINE,
} from './timeline';

// ============================================================================
// PROFILE ASSESSMENT TYPES (NEW)
// ============================================================================

export {
  // Core types
  ProfileStrengthTier,
  ComponentStrengthProfile,
  ProfileAssessment,

  // Gap analysis
  Gap,

  // School fit by profile
  SchoolTierFit,

  // Sub-assessments
  AcademicProfileAssessment,
  ActivityProfileAssessment,

  // Comparison and positioning
  ProfileComparison,
  ComparisonPool,
  StrategicPositioning,
  PositioningOption,
  ApplicationArchetype as ProfileArchetype,

  // Improvement tracking
  ImprovementPotential,
  ProfileTrajectory,

  // Constants
  PROFILE_TIER_SCHOOL_RANGES,
  PROFILE_COMPONENT_WEIGHTS,
} from './profileAssessment';

// ============================================================================
// COMPREHENSIVE ESSAY SYSTEM TYPES (NEW)
// ============================================================================

export {
  // Essay type classification
  EssayType,
  EssayLengthCategory,
  EssayStatus,

  // Quality dimensions
  EssayQualityDimension,
  DimensionScore,

  // Personal statement types
  PersonalStatementTopicCategory,
  PersonalStatementPitfall,
  PersonalStatementPitfallType,
  PersonalStatementAnalysis,
  ImprovementSuggestion,

  // Why School essays
  WhySchoolEssayAnalysis,
  WhySchoolMistake,

  // Why Major essays
  WhyMajorEssayAnalysis,
  WhyMajorMistake,

  // Additional essay types
  CommunityEssayAnalysis,
  ActivityEssayAnalysis,
  GenericSupplementalAnalysis,

  // Portfolio-level analysis
  EssayPortfolioAnalysis,

  // Grade-specific guidance
  GradeSpecificEssayGuidance,

  // Topic development
  TopicEvaluation,
  TopicBrainstormingGuide,
  WritingStageGuidance,

  // Constants
  ESSAY_QUALITY_RUBRIC,
  GRADE_ESSAY_EXPECTATIONS,
  ESSAY_WRITING_STAGES,
  DEFAULT_ESSAY_DIMENSION_WEIGHTS,
  SUPPLEMENTAL_DIMENSION_WEIGHTS,
  ESSAY_WORD_COUNT_GUIDELINES,
} from './essaySystem';

// ============================================================================
// ACTIVITY OPTIMIZATION TYPES (NEW)
// ============================================================================

export {
  // Common App category type
  CommonAppActivityCategory,

  // Description analysis
  ActivityDescriptionAnalysis,
  DescriptionProblem,
  DescriptionOptimization,
  DescriptionFormula,

  // Spike analysis (extended)
  SpikeAnalysis as ExtendedSpikeAnalysis,
  SpikeStrength as ExtendedSpikeStrength,
  SpikeDevelopmentPath,
  SpikeArea,
  SpikeAreaGuide,

  // Activity upgrade analysis
  ActivityUpgradeAnalysis,

  // Portfolio optimization
  ActivityPortfolioStrategy,
  CommonAppActivitiesOptimization,
  GradeSpecificActivityGuidance,

  // Constants
  DESCRIPTION_FORMULAS,
  ACTIVITY_TIER_BENCHMARKS,
  GRADE_ACTIVITY_EXPECTATIONS,
} from './activityOptimization';

// ============================================================================
// SUMMER STRATEGY TYPES (NEW)
// ============================================================================

export {
  // Summer program types
  SummerProgramType,
  ProgramSelectivityTier,
  ProgramPrestigeImpact,
  ProgramCostCategory,
  SummerProgramProfile,
  ApplicationComponent,

  // Elite programs
  EliteProgramCategory,

  // Summer planning
  SummerPlanningGuide,

  // Research opportunities
  ResearchOpportunity,
  ResearchOpportunityGuide,

  // Internship opportunities
  InternshipOpportunity,
  InternshipFindingGuide,

  // Strategy and evaluation
  SummerStrategyRecommendation,
  SummerActivityEvaluation,

  // Constants
  ELITE_SUMMER_PROGRAMS,
  SUMMER_PLANNING_GUIDES,
} from './summerStrategy';

// ============================================================================
// MAJOR-SPECIFIC GUIDANCE TYPES (NEW)
// ============================================================================

export {
  // Major classification
  MajorCategory,
  MajorCompetitiveness,

  // Major-specific guidance
  MajorSpecificGuidance,
  CourseRecommendation,
  ActivityRecommendation as MajorActivityRecommendation,
  OpportunityProfile,

  // Assessment and exploration
  MajorFitAssessment,
  MajorExplorationGuidance,

  // Pre-built guidance examples
  CS_GUIDANCE,
  PREMED_GUIDANCE,
  ECONOMICS_GUIDANCE,

  // Utility function
  getMajorGuidance,
} from './majorGuidance';

// ============================================================================
// ACTION ITEMS GENERATION TYPES (NEW)
// ============================================================================

export {
  // Core action types (re-exported with prefix to avoid collision)
  ActionCategory as ActionItemCategory,
  ActionPriority as ActionItemPriority,
  ActionTimeHorizon,
  ActionEffort as ActionItemEffort,
  ActionStatus as ActionItemStatus,

  // Action item types
  ActionItem as DetailedActionItem,
  ActionItemSummary as ActionSummary,
  ActionGenerationContext,

  // Action planning
  ActionPlan,
  PriorityScoring,

  // Category-specific actions
  CourseSelectionAction,
  CompetitionAction,
  SummerProgramAction,
  EssayAction,
  RecommenderAction,

  // Progress tracking
  ActionProgress,
  ActionCompletionReport,

  // Customization
  ActionPlanCustomization,
  AdjustedActionPlan,
  ActionSequence,

  // Grade-specific templates
  GradeActionTemplates,
  ActionImpactEstimation,

  // Constants
  PRIORITY_WEIGHTS,
  COMMON_ACTION_SEQUENCES,
  GRADE_ACTION_TEMPLATES,
} from './actionItems';

// ============================================================================
// IMPACT METRICS TYPES (NEW)
// ============================================================================

export {
  // Impact types
  ImpactType as ImpactMetricType,
  ImpactScope,
  ImpactDuration,

  // Impact metric details
  ImpactMetric,
  ActivityImpactProfile,
  ImpactBenchmarks,

  // Quantification guidance
  QuantificationGuide,

  // Verification
  ImpactVerification,

  // Improvement planning
  ImpactImprovementPlan,

  // Narrative generation
  ImpactNarrative,
  generateImpactNarrative,

  // Constants
  COMMUNITY_SERVICE_BENCHMARKS,
  RESEARCH_BENCHMARKS,
  LEADERSHIP_BENCHMARKS,
  COMMUNITY_SERVICE_QUANTIFICATION,
  RESEARCH_QUANTIFICATION,
  IMPACT_RED_FLAGS,
  IMPACT_IMPROVEMENT_STRATEGIES,
} from './impactMetrics';

// ============================================================================
// INTERVIEW PREPARATION TYPES (NEW)
// ============================================================================

export {
  // Interview types
  InterviewType,
  InterviewRequirement,
  InterviewFormat,
  InterviewImpact,

  // School interview profiles
  SchoolInterviewProfile,

  // Question preparation
  QuestionCategory,
  PreparedAnswer,
  AnswerFramework,

  // Readiness and evaluation
  InterviewReadinessAssessment,
  MockInterviewEvaluation,

  // Constants
  SCHOOL_INTERVIEW_PROFILES,
  QUESTION_FRAMEWORKS,
  INTERVIEW_BEST_PRACTICES,
  INTERVIEWER_RED_FLAGS,
} from './interviewPrep';

// ============================================================================
// RECOMMENDATION STRATEGY TYPES (NEW)
// ============================================================================

export {
  // Recommender types
  RecommenderType,
  AcademicSubject,
  RelationshipStrength,
  RecommendationQuality,

  // Recommender profile
  RecommenderProfile,
  RecommenderComparison,
  StrongRecommendationProfile,

  // Selection criteria
  RecommenderSelectionCriteria,

  // Relationship cultivation
  RelationshipCultivationStrategy,

  // Asking strategy
  AskingStrategy,

  // Counselor-specific
  CounselorRecommendationStrategy,

  // Tracking
  RecommendationTracking,
  RecommendationStatusOverview,

  // Constants
  RECOMMENDATION_QUALITY_MARKERS,
  DEFAULT_SELECTION_CRITERIA,
  RELATIONSHIP_BUILDING_TIMELINE,
  DEFAULT_ASKING_STRATEGY,
} from './recommendationStrategy';

// ============================================================================
// CROSS-CUTTING TYPES
// ============================================================================

/**
 * Complete student profile input (aggregated from all sources)
 */
export interface StudentProfileInput {
  userId: string;
  academic: import('./academic').AcademicInputData;
  activities: import('./activities').ActivitiesInputData;
  awards: import('./awards').AwardsInputData;
  personalContext: import('./synthesis').PersonalContext;
  goals: import('./synthesis').GoalsAspirations;
  essayQuality?: import('./synthesis').EssayQualitySummary;
}

/**
 * Complete PASS analysis output
 */
export interface PortfolioStrategyAnalysis {
  // Metadata
  analyzedAt: string;
  version: string;
  userId: string;

  // Component evaluations
  academic: import('./academic').AcademicEvaluation;
  activities: import('./activities').ActivityPortfolioAnalysis;
  awards: import('./awards').AwardEvaluation;

  // Synthesis
  holistic: import('./synthesis').HolisticProfileSynthesis;

  // Strategy
  schoolFit: import('./schoolFit').SchoolFitOutput;

  // Guidance
  guidance: import('./guidance').GuidanceReport;

  // Hash for cache invalidation
  inputDataHash: string;

  // Cost tracking
  analysisMetadata: {
    totalCostCents: number;
    modelUsed: string;
    tokensUsed: number;
    analysisTimeMs: number;
  };
}

/**
 * Analysis request configuration
 */
export interface AnalysisRequestConfig {
  userId: string;
  targetSchools?: string[];
  forceRefresh?: boolean;
  analysisDepth?: 'quick' | 'standard' | 'comprehensive';
  skipComponents?: ('academic' | 'activities' | 'awards' | 'synthesis' | 'schoolFit' | 'guidance')[];
}

/**
 * Analysis cache entry
 */
export interface AnalysisCacheEntry {
  userId: string;
  inputDataHash: string;
  analysis: PortfolioStrategyAnalysis;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

// ============================================================================
// ENHANCED ANALYSIS OUTPUT (NEW - Research-Backed)
// ============================================================================

/**
 * Enhanced Portfolio Strategy Analysis with research-backed components
 * This extends the base analysis with:
 * - Character assessment (7 dimensions)
 * - Red flag detection (4 severity tiers)
 * - Context calibration (socioeconomic, geographic, personal, educational, identity)
 * - Narrative synthesis (two-sentence pitch test)
 * - Universal Holistic Score (Harvard 1-6 scale)
 */
export interface EnhancedPortfolioAnalysis extends PortfolioStrategyAnalysis {
  // Research context used
  researchContext: {
    modulesLoaded: import('./research').ResearchModuleId[];
    totalTokensUsed: number;
    citationsReferenced: number;
  };

  // Character assessment (7 dimensions)
  character: import('./character').CharacterAssessment;

  // Red flag detection
  redFlags: import('./redFlags').RedFlagReport;

  // Context calibration
  contextCalibration: import('./calibration').ContextCalibration;

  // Narrative synthesis
  narrative: import('./narrative').NarrativeSynthesis;

  // Universal Holistic Score (Harvard 1-6 scale)
  universalScore: import('./scoring').UniversalHolisticScore;

  // Enhanced metadata
  enhancedMetadata: {
    pipelineStagesCompleted: import('./research').AnalysisStage[];
    researchModulesUsed: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
    dataCompleteness: number; // 0-100
    recommendedFollowUp: string[];
  };
}

/**
 * Enhanced analysis request configuration
 */
export interface EnhancedAnalysisConfig extends AnalysisRequestConfig {
  // Research context options
  includeResearchContext?: boolean;
  maxResearchTokens?: number;
  priorityModules?: import('./research').ResearchModuleId[];

  // Analysis options
  includeCharacterAssessment?: boolean;
  includeRedFlagDetection?: boolean;
  includeContextCalibration?: boolean;
  includeNarrativeSynthesis?: boolean;

  // School-specific options
  schoolSpecificWeighting?: boolean;
  targetSchoolTypes?: import('./scoring').SchoolType[];
}

/**
 * Stage summary for inter-stage communication
 */
export interface StageSummary {
  stage: import('./research').AnalysisStage;
  completedAt: string;
  keyFindings: string[];
  score?: import('./scoring').HarvardScoreDecimal;
  confidence: number;
  forNextStage: {
    criticalContext: string[];
    recommendedEmphasis: string[];
    warningsToConsider: string[];
  };
}

/**
 * Complete pipeline state for tracking analysis progress
 */
export interface PipelineState {
  userId: string;
  startedAt: string;
  currentStage: import('./research').AnalysisStage;
  completedStages: StageSummary[];
  errors: { stage: string; error: string; recoverable: boolean }[];
  intermediateResults: {
    academic?: import('./academic').AcademicEvaluation;
    activities?: import('./activities').ActivityPortfolioAnalysis;
    awards?: import('./awards').AwardEvaluation;
    character?: import('./character').CharacterAssessment;
    redFlags?: import('./redFlags').RedFlagReport;
    contextCalibration?: import('./calibration').ContextCalibration;
    narrative?: import('./narrative').NarrativeSynthesis;
    universalScore?: import('./scoring').UniversalHolisticScore;
  };
}

// ============================================================================
// COMPREHENSIVE STRATEGY ANALYSIS (NEW - Full System Integration)
// ============================================================================

/**
 * Complete Portfolio & Application Strategy System (PASS) Analysis
 *
 * This is the ultimate output type that integrates ALL analysis modules
 * for comprehensive, actionable college application guidance.
 *
 * Coverage:
 * - Core evaluation (academic, activities, awards)
 * - Character & narrative assessment
 * - Grade-specific timeline guidance
 * - Essay portfolio analysis
 * - Activity optimization with spike development
 * - Summer strategy planning
 * - Major-specific guidance
 * - Impact quantification
 * - Interview preparation
 * - Recommendation strategy
 * - Prioritized action items
 */
export interface ComprehensiveStrategyAnalysis extends EnhancedPortfolioAnalysis {
  // Timeline and grade-specific context
  timeline: import('./timeline').TimelineAssessment;

  // Current profile strength assessment
  profileAssessment: import('./profileAssessment').ProfileAssessment;

  // Comprehensive essay analysis
  essayAnalysis: import('./essaySystem').EssayPortfolioAnalysis;

  // Activity optimization guidance
  activityOptimization: import('./activityOptimization').ActivityPortfolioStrategy;

  // Summer strategy by grade
  summerStrategy: import('./summerStrategy').SummerStrategyRecommendation;

  // Major-specific guidance
  majorGuidance: import('./majorGuidance').MajorFitAssessment;

  // Impact quantification
  impactAnalysis: import('./impactMetrics').ImpactImprovementPlan;

  // Interview preparation
  interviewPrep: import('./interviewPrep').InterviewReadinessAssessment;

  // Recommendation strategy
  recommendationStrategy: import('./recommendationStrategy').RecommendationStatusOverview;

  // Prioritized action plan
  actionPlan: import('./actionItems').ActionPlan;

  // Strategic summary
  strategicSummary: {
    // One-line positioning statement
    positioningStatement: string;

    // Top 3 competitive advantages
    topAdvantages: string[];

    // Top 3 areas needing development
    topDevelopmentAreas: string[];

    // School tier fit summary
    schoolTierFit: {
      reach: { probability: number; keyFactors: string[] };
      target: { probability: number; keyFactors: string[] };
      likely: { probability: number; keyFactors: string[] };
    };

    // Timeline urgency assessment
    urgencyLevel: 'critical' | 'high' | 'moderate' | 'comfortable';
    urgencyRationale: string;

    // Recommended immediate focus (next 30 days)
    immediateFocus: string[];

    // Recommended medium-term focus (next 90 days)
    mediumTermFocus: string[];
  };
}

/**
 * Comprehensive analysis request configuration
 */
export interface ComprehensiveAnalysisConfig extends EnhancedAnalysisConfig {
  // Grade context
  gradeLevel: import('./timeline').GradeLevel;
  currentMonth?: number; // 1-12

  // Target major(s)
  intendedMajors?: import('./majorGuidance').MajorCategory[];

  // Module inclusion flags
  includeTimeline?: boolean;
  includeProfileAssessment?: boolean;
  includeEssayAnalysis?: boolean;
  includeActivityOptimization?: boolean;
  includeSummerStrategy?: boolean;
  includeMajorGuidance?: boolean;
  includeImpactAnalysis?: boolean;
  includeInterviewPrep?: boolean;
  includeRecommendationStrategy?: boolean;
  includeActionPlan?: boolean;

  // Customization
  focusAreas?: ('essays' | 'activities' | 'academics' | 'testing' | 'recommendations' | 'interviews')[];
  prioritizeFor?: 'reach_schools' | 'target_schools' | 'balanced';
}

/**
 * Student input for comprehensive analysis
 */
export interface ComprehensiveStudentInput extends StudentProfileInput {
  // Timeline context
  gradeLevel: import('./timeline').GradeLevel;
  yearPhase?: import('./timeline').YearPhase;

  // Major interests
  intendedMajors?: import('./majorGuidance').MajorCategory[];
  majorCertainty?: 'certain' | 'likely' | 'exploring' | 'undecided';

  // Essay portfolio
  essays?: {
    personalStatement?: import('./essaySystem').PersonalStatementAnalysis;
    supplementalEssays?: import('./essaySystem').GenericSupplementalAnalysis[];
  };

  // Recommender information
  potentialRecommenders?: import('./recommendationStrategy').RecommenderProfile[];

  // Interview history
  interviewExperience?: {
    hasInterviewed: boolean;
    schoolsInterviewedWith?: string[];
    selfAssessedReadiness?: 1 | 2 | 3 | 4 | 5;
  };

  // Summer history and plans
  summerHistory?: {
    grade9?: string[];
    grade10?: string[];
    grade11?: string[];
  };
  summerPlans?: string[];
}

/**
 * Quick assessment for initial consultation
 * Lighter-weight analysis for first-pass evaluation
 */
export interface QuickAssessment {
  userId: string;
  assessedAt: string;

  // Overall profile tier
  profileTier: import('./profileAssessment').ProfileStrengthTier;

  // Quick scores (Harvard 1-6)
  quickScores: {
    academic: import('./scoring').HarvardScoreDecimal;
    activities: import('./scoring').HarvardScoreDecimal;
    overall: import('./scoring').HarvardScoreDecimal;
  };

  // Top 3 strengths
  topStrengths: string[];

  // Top 3 gaps
  topGaps: string[];

  // School tier recommendation
  recommendedTiers: {
    aggressive: string[]; // T10, T20
    realistic: string[]; // T30, T50
    safe: string[]; // T100+
  };

  // Urgency flag
  needsImmediateAttention: boolean;
  urgentItems?: string[];

  // Recommendation for full analysis
  recommendFullAnalysis: boolean;
  fullAnalysisRationale?: string;
}

/**
 * Progress tracking for multi-session engagement
 */
export interface StudentProgressTracker {
  userId: string;
  firstAssessmentAt: string;
  lastAssessmentAt: string;

  // Score history
  scoreHistory: {
    date: string;
    universalScore: import('./scoring').HarvardScoreDecimal;
    componentScores: Record<string, import('./scoring').HarvardScoreDecimal>;
  }[];

  // Action completion tracking
  actionsCompleted: {
    actionId: string;
    completedAt: string;
    outcome?: string;
    impactObserved?: string;
  }[];

  // Milestone achievements
  milestonesAchieved: {
    milestone: string;
    achievedAt: string;
    significance: string;
  }[];

  // Improvement trajectory
  trajectory: {
    direction: 'improving' | 'stable' | 'declining';
    rate: 'rapid' | 'steady' | 'slow';
    projectedFinalScore?: import('./scoring').HarvardScoreDecimal;
  };

  // Engagement metrics
  engagement: {
    totalSessions: number;
    actionsAssigned: number;
    actionsCompleted: number;
    completionRate: number;
    averageResponseTime: number; // days
  };
}
