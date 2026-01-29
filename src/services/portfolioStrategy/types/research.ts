/**
 * Research Context Types
 *
 * Types for dynamic loading and utilization of the research database.
 * The system uses 33 research modules organized across 5 sections,
 * totaling 660+ citations that inform every evaluation.
 *
 * Key Design Principle: Load only relevant modules per stage to minimize
 * token usage (3-8K per module vs 100K+ for full database).
 */

// ============================================================================
// RESEARCH MODULE IDENTIFICATION
// ============================================================================

/**
 * Research database sections
 */
export type ResearchSection =
  | 'section1_foundations'      // Evaluation philosophy & frameworks
  | 'section3_essay_craft'      // Writing excellence standards
  | 'section4_applicant_quality' // Qualities that impress AOs
  | 'section5_school_profiles'  // School-specific preferences
  | 'extracurricular_databases'; // Activity tier classification

/**
 * Specific research modules within each section
 */
export type ResearchModuleId =
  // Section 1: Foundations
  | 'admissions_philosophy'
  | 'holistic_review_process'
  | 'selection_criteria'
  | 'reader_psychology'

  // Section 3: Essay Craft
  | 'narrative_excellence'
  | 'voice_authenticity'
  | 'structure_pacing'
  | 'topic_selection'
  | 'common_pitfalls'

  // Section 4: Applicant Qualities
  | 'intellectual_vitality'
  | 'leadership_impact'
  | 'character_integrity'
  | 'resilience_growth'
  | 'community_contribution'
  | 'passion_depth'

  // Section 5: School Profiles
  | 'ivy_league_preferences'
  | 'top_liberal_arts'
  | 'stem_focused_schools'
  | 'public_flagships'
  | 'fit_matching'

  // Extracurricular Databases
  | 'robotics'
  | 'debate_speech'
  | 'model_un'
  | 'stem_research'
  | 'theater_drama'
  | 'creative_writing'
  | 'entrepreneurship'
  | 'hackathons_cs'
  | 'community_service';

/**
 * Research module metadata
 */
export interface ResearchModuleMetadata {
  id: ResearchModuleId;
  section: ResearchSection;
  path: string;
  title: string;
  description: string;
  estimatedTokens: number;
  lastUpdated: string;
  citationCount: number;
  primaryUseCase: string[];
}

// ============================================================================
// RESEARCH CONTEXT LOADING
// ============================================================================

/**
 * Research context request
 */
export interface ResearchContextRequest {
  stage: AnalysisStage;
  studentProfile: {
    intendedMajor?: string;
    activityTypes?: string[];
    targetSchools?: string[];
    personalContext?: {
      isFirstGen?: boolean;
      isLowIncome?: boolean;
      hasAdversity?: boolean;
    };
  };
  maxTokens?: number;
  priorityModules?: ResearchModuleId[];
}

/**
 * Analysis stages that consume research context
 */
export type AnalysisStage =
  | 'academic_evaluation'
  | 'activity_analysis'
  | 'character_assessment'
  | 'red_flag_detection'
  | 'context_calibration'
  | 'holistic_synthesis'
  | 'school_fit'
  | 'narrative_generation'
  | 'guidance_creation';

/**
 * Loaded research context
 */
export interface ResearchContext {
  stage: AnalysisStage;
  loadedModules: LoadedModule[];
  totalTokens: number;
  loadTimeMs: number;
  relevanceScores: Record<ResearchModuleId, number>;
}

/**
 * Individual loaded module
 */
export interface LoadedModule {
  id: ResearchModuleId;
  section: ResearchSection;
  content: string;
  tokenCount: number;
  relevanceScore: number;
  keyCitations: Citation[];
  summaryForPrompt: string;
}

/**
 * Citation reference
 */
export interface Citation {
  id: string;
  source: string;
  quote?: string;
  relevance: string;
}

// ============================================================================
// STAGE-TO-MODULE MAPPING
// ============================================================================

/**
 * Default module mapping per analysis stage
 */
export const STAGE_MODULE_MAPPING: Record<AnalysisStage, ResearchModuleId[]> = {
  academic_evaluation: [
    'admissions_philosophy',
    'selection_criteria',
    'intellectual_vitality',
  ],
  activity_analysis: [
    'leadership_impact',
    'passion_depth',
    'community_contribution',
    // Plus dynamically selected extracurricular databases
  ],
  character_assessment: [
    'character_integrity',
    'resilience_growth',
    'reader_psychology',
  ],
  red_flag_detection: [
    'common_pitfalls',
    'reader_psychology',
    'admissions_philosophy',
  ],
  context_calibration: [
    'holistic_review_process',
    'resilience_growth',
    'selection_criteria',
  ],
  holistic_synthesis: [
    'holistic_review_process',
    'selection_criteria',
    'fit_matching',
  ],
  school_fit: [
    'ivy_league_preferences',
    'top_liberal_arts',
    'stem_focused_schools',
    'public_flagships',
    'fit_matching',
  ],
  narrative_generation: [
    'narrative_excellence',
    'voice_authenticity',
    'structure_pacing',
    'topic_selection',
  ],
  guidance_creation: [
    'common_pitfalls',
    'selection_criteria',
    'passion_depth',
  ],
};

// ============================================================================
// EXTRACURRICULAR DATABASE SELECTION
// ============================================================================

/**
 * Activity type to database mapping
 */
export const ACTIVITY_TO_DATABASE: Record<string, ResearchModuleId> = {
  // STEM & Technical
  'robotics': 'robotics',
  'frc': 'robotics',
  'vex': 'robotics',
  'ftc': 'robotics',
  'research': 'stem_research',
  'science_olympiad': 'stem_research',
  'science_fair': 'stem_research',
  'isef': 'stem_research',
  'regeneron': 'stem_research',
  'hackathon': 'hackathons_cs',
  'programming': 'hackathons_cs',
  'coding': 'hackathons_cs',
  'usaco': 'hackathons_cs',
  'app_development': 'hackathons_cs',

  // Communication
  'debate': 'debate_speech',
  'speech': 'debate_speech',
  'forensics': 'debate_speech',
  'model_un': 'model_un',
  'mun': 'model_un',

  // Arts
  'theater': 'theater_drama',
  'drama': 'theater_drama',
  'acting': 'theater_drama',
  'thespians': 'theater_drama',
  'writing': 'creative_writing',
  'poetry': 'creative_writing',
  'journalism': 'creative_writing',
  'literary_magazine': 'creative_writing',

  // Business & Leadership
  'deca': 'entrepreneurship',
  'fbla': 'entrepreneurship',
  'business': 'entrepreneurship',
  'startup': 'entrepreneurship',
  'entrepreneurship': 'entrepreneurship',

  // Service
  'volunteering': 'community_service',
  'nonprofit': 'community_service',
  'community_service': 'community_service',
  'service_learning': 'community_service',
};

// ============================================================================
// RESEARCH CONTEXT SERVICE INTERFACE
// ============================================================================

/**
 * Research context service configuration
 */
export interface ResearchContextConfig {
  maxTokensPerStage: number;
  cacheEnabled: boolean;
  cacheTTLMs: number;
  prioritizeRecent: boolean;
  includeFullCitations: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_RESEARCH_CONFIG: ResearchContextConfig = {
  maxTokensPerStage: 8000,
  cacheEnabled: true,
  cacheTTLMs: 24 * 60 * 60 * 1000, // 24 hours
  prioritizeRecent: true,
  includeFullCitations: false,
};

/**
 * Research context service interface
 */
export interface IResearchContextService {
  /**
   * Load relevant research context for a specific analysis stage
   */
  loadContextForStage(request: ResearchContextRequest): Promise<ResearchContext>;

  /**
   * Get specific extracurricular database for activity type
   */
  getActivityDatabase(activityType: string): Promise<LoadedModule | null>;

  /**
   * Get school-specific preferences for target schools
   */
  getSchoolPreferences(schoolIds: string[]): Promise<LoadedModule[]>;

  /**
   * Preload commonly used modules for performance
   */
  preloadCommonModules(): Promise<void>;

  /**
   * Get module metadata without loading content
   */
  getModuleMetadata(moduleId: ResearchModuleId): ResearchModuleMetadata | null;

  /**
   * Clear cache
   */
  clearCache(): void;
}
