/**
 * Backend Integration Types
 *
 * Complete type definitions matching the sophisticated backend analysis system:
 * - 11-category rubric with adaptive weights (v1.0.0)
 * - Authenticity detection with manufactured signal analysis
 * - Elite pattern detection (vulnerability, dialogue, transformation, etc.)
 * - Literary sophistication analysis (metaphor, structure, rhythm)
 * - Coaching system with prioritized issues
 * - AI generation with narrative angles and quality validation
 * - Iterative improvement with learning loops
 */

import { ExtracurricularItem } from '../ExtracurricularCard';

// ============================================================================
// RUBRIC CATEGORIES (11 dimensions from v1.0.0)
// ============================================================================

export type RubricCategory =
  | 'voice_integrity'
  | 'specificity_evidence'
  | 'transformative_impact'
  | 'role_clarity_ownership'
  | 'narrative_arc_stakes'
  | 'initiative_leadership'
  | 'community_collaboration'
  | 'reflection_meaning'
  | 'craft_language_quality'
  | 'fit_trajectory'
  | 'time_investment_consistency';

export interface RubricCategoryScore {
  name: string; // Display name or key
  category?: string; // Backwards compatibility
  score_0_to_10: number;
  score?: number; // Backwards compatibility
  maxScore?: number; // Backwards compatibility
  weight: number;
  evaluator_notes: string;
  comments?: string; // Backwards compatibility
  evidence?: string[]; // Backwards compatibility
  strengths: string[];
  weaknesses: string[];
  suggestions?: string[]; // Backwards compatibility
}

// ============================================================================
// ANALYSIS REPORT (Primary output from /api/analyze-entry)
// ============================================================================

export interface AnalysisReport {
  id: string;
  entry_id: string;
  rubric_version: string; // "v1.0.0"
  created_at: string;

  // Core scoring
  categories: RubricCategoryScore[];
  weights: Record<string, number>;
  narrative_quality_index: number; // 0-100 NQI
  reader_impression_label: 'captivating_grounded' | 'strong_distinct_voice' | 'solid_needs_polish' | 'patchy_narrative' | 'generic_unclear';

  // Diagnostics
  flags: string[]; // e.g., "no_metrics", "weak_voice", "no_reflection"
  suggested_fixes_ranked: string[]; // Top 3-5 prioritized improvements
  analysis_depth: 'quick' | 'standard' | 'comprehensive';
}

// ============================================================================
// AUTHENTICITY ANALYSIS (Voice detection)
// ============================================================================

export interface AuthenticityAnalysis {
  authenticity_score: number; // 0-10
  voice_type: 'conversational' | 'essay' | 'robotic' | 'natural';

  // Detailed signals
  red_flags: string[]; // Manufactured phrases
  green_flags: string[]; // Authentic markers
  manufactured_signals: string[]; // Specific problematic phrases
  authenticity_markers: string[]; // Positive indicators

  assessment: string; // Overall evaluation
}

// ============================================================================
// ELITE PATTERN ANALYSIS (Session 18 research)
// ============================================================================

export interface ElitePatternAnalysis {
  overallScore: number; // 0-100
  tier: 1 | 2 | 3; // 1=Harvard/MIT, 2=Top UC, 3=Competitive

  // Pattern 1: Vulnerability (10 points)
  vulnerability: {
    score: number; // 0-10
    hasPhysicalSymptoms: boolean;
    hasNamedEmotions: boolean;
    hasBeforeAfter: boolean;
    examples: string[];
  };

  // Pattern 2: Dialogue (10 points)
  dialogue: {
    score: number; // 0-10
    hasDialogue: boolean;
    isConversational: boolean;
    revealsCharacter: boolean;
    examples: string[];
  };

  // Pattern 3: Community Transformation (20 points)
  communityTransformation: {
    score: number; // 0-20
    hasContrast: boolean;
    hasBefore: boolean;
    hasAfter: boolean;
    beforeState?: string;
    afterState?: string;
  };

  // Pattern 4: Quantified Impact (10 points)
  quantifiedImpact: {
    score: number; // 0-10
    hasMetrics: boolean;
    metrics: string[];
    plausibilityScore: number;
  };

  // Pattern 5: Universal Insight (20 points)
  microToMacro: {
    score: number; // 0-20
    hasUniversalInsight: boolean;
    transcendsActivity: boolean;
    insight?: string;
  };

  strengths: string[];
  gaps: string[];
}

// ============================================================================
// LITERARY SOPHISTICATION (Structural & Stylistic)
// ============================================================================

export interface LiterarySophisticationAnalysis {
  overallScore: number; // 0-100
  tier: 1 | 2 | 3;

  // Extended Metaphor (20 points)
  extendedMetaphor: {
    score: number; // 0-20
    hasMetaphor: boolean;
    consistency: number; // 0-1
    metaphor?: string;
    references: string[]; // All metaphor instances
  };

  // Structural Innovation (15 points)
  structuralInnovation: {
    score: number; // 0-15
    innovations: string[]; // e.g., "dual_scene_parallelism", "nonlinear_time"
    techniques: string[];
  };

  // Sentence Rhythm (15 points)
  sentenceRhythm: {
    score: number; // 0-15
    hasVariety: boolean;
    veryShortCount: number; // 1-4 words
    shortCount: number; // 5-12 words
    longCount: number; // 25+ words
  };

  // Sensory Immersion (15 points)
  sensoryImmersion: {
    score: number; // 0-15
    senseCount: number; // How many senses used
    senses: string[]; // e.g., ["sight", "sound", "touch"]
    examples: string[];
  };

  // Active Voice (10 points)
  activeVoice: {
    score: number; // 0-10
    dominance: number; // 0-1 (ratio of active to passive)
    passiveCount: number;
    activeCount: number;
  };

  strengths: string[];
  improvements: string[];
}

// ============================================================================
// COACHING OUTPUT (Actionable guidance)
// ============================================================================

export interface CoachingIssue {
  id: string;
  category: RubricCategory;
  severity: 'critical' | 'major' | 'minor';
  title: string;
  problem: string; // What's wrong
  why_it_matters: string; // Impact explanation
  from_draft?: string; // Excerpt if applicable

  suggested_fixes: Array<{
    text: string; // Actual suggested text
    rationale: string; // Why this works
    type: 'replace' | 'insert_before' | 'insert_after' | 'rewrite';
    impact_estimate: string; // e.g., "+2 to +5 points"
  }>;

  examples: string[]; // Good examples from elite essays
  priority_rank: number; // 1 = highest priority
}

export interface CoachingOutput {
  overall: {
    current_nqi: number;
    target_nqi: number;
    potential_gain: number;
    total_issues: number;
  };

  prioritized_issues: CoachingIssue[]; // Sorted by impact

  quick_wins: Array<{
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;

  strategic_guidance: {
    strengths_to_maintain: string[];
    critical_gaps: string[];
    next_steps: string[];
  };
}

// ============================================================================
// ANALYSIS RESULT (Complete output from engine)
// ============================================================================

export interface AnalysisResult {
  report: AnalysisReport;
  analysis?: AnalysisReport; // Alias for backwards compatibility
  features: ExtractedFeatures;
  authenticity: AuthenticityAnalysis;
  coaching?: CoachingOutput;
  performance: {
    stage1_ms: number;
    stage2_ms: number;
    stage3_ms: number;
    stage4_ms: number;
    total_ms: number;
  };
}

export interface ExtractedFeatures {
  word_count: number;
  voice: {
    active_verb_count: number;
    passive_verb_count: number;
    first_person_count: number;
    buzzword_count: number;
    passive_ratio: number;
    sentence_variety_score: number;
  };
  evidence: {
    number_count: number;
    has_concrete_numbers: boolean;
    metric_specificity_score: number;
  };
  arc: {
    has_stakes: boolean;
    has_turning_point: boolean;
    temporal_markers: string[];
  };
  collaboration: {
    we_usage_count: number;
    credit_given: boolean;
  };
  reflection: {
    reflection_quality: 'none' | 'superficial' | 'good' | 'deep';
  };
}

// ============================================================================
// NARRATIVE ANGLES (AI Generation System)
// ============================================================================

export interface NarrativeAngle {
  // Core concept
  title: string; // e.g., "Vision Systems and Blind Faith"
  hook: string; // Opening sentence
  throughline: string; // Central unifying idea

  // Unique perspective
  unusualConnection: string; // What unexpected thing are you connecting?
  philosophicalDepth: string; // Universal truth revealed
  freshMetaphor?: string; // Original metaphor if applicable

  // Narrative structure
  openingScene: string; // Where to start
  turningPoint: string; // Moment of realization
  universalInsight: string; // How this applies beyond activity

  // Quality indicators
  originality: number; // 1-10
  riskLevel: 'safe' | 'moderate' | 'bold';
  expectedImpact: 'good' | 'excellent' | 'extraordinary';
}

export interface AngleQualityScore {
  angle: NarrativeAngle;

  // Quality dimensions (Session 18 validation system)
  overallQuality: number; // 0-100
  groundingScore: number; // 0-100 (concrete vs abstract)
  bridgeScore: number; // 0-100 (technical-human connection)
  authenticityPotential: number; // 0-100 (can student tell this genuinely?)
  implementabilityScore: number; // 0-100 (practical to execute?)

  // Evaluation
  recommendation: 'excellent' | 'good' | 'acceptable' | 'risky' | 'avoid';
  confidence: number; // 0-1

  // Feedback
  strengths: string[];
  warnings: string[];
  redFlags: string[];
}

// ============================================================================
// GENERATION PROFILE
// ============================================================================

export interface GenerationProfile {
  // Student context
  studentVoice: 'formal' | 'conversational' | 'quirky' | 'introspective';
  riskTolerance: 'low' | 'medium' | 'high';
  academicStrength: 'strong' | 'moderate' | 'weak';

  // Activity details
  activityType: 'academic' | 'service' | 'arts' | 'athletics' | 'work' | 'advocacy';
  role: string;
  duration: string;
  hoursPerWeek: number;

  // Content to work with
  achievements: string[];
  challenges: string[];
  relationships: string[]; // People involved
  impact: string[];

  // Generation preferences
  targetTier: 1 | 2 | 3; // 1=Harvard, 2=Top UC, 3=UC-competitive
  literaryTechniques: string[];
  avoidClichés: boolean;

  // Narrative angle
  narrativeAngle?: NarrativeAngle;
  generateAngle?: boolean;
}

export interface GenerationResult {
  essay: string;

  // Quality scores (composite system)
  authenticityScore: number; // 0-10
  elitePatternsScore: number; // 0-100
  literarySophisticationScore: number; // 0-100
  combinedScore: number; // 0-100 (20% auth + 40% elite + 40% literary)

  // Analysis details
  strengths: string[];
  gaps: string[];

  // Generation metadata
  iteration: number;
  techniquesUsed: string[];
  warningFlags: string[];
  narrativeAngle?: NarrativeAngle;
}

// ============================================================================
// DRAFT VERSION TRACKING
// ============================================================================

export interface DraftVersion {
  id: string;
  text: string;
  timestamp: number;

  // Analysis for this version
  nqi_score?: number;
  authenticity_score?: number;
  elite_score?: number;
  literary_score?: number;

  // Change tracking
  changes_summary?: string;
  improvements?: string[];
  regressions?: string[];

  // Provenance
  is_generated?: boolean;
  generation_method?: 'manual' | 'ai_assisted' | 'ai_generated';
  applied_issue_id?: string;
}

// ============================================================================
// WORKSHOP STATE & STAGES
// ============================================================================

export type WorkshopStage =
  | 'initial'              // Just opened
  | 'analyzing'            // Running initial analysis
  | 'analysis_complete'    // Can view results and edit
  | 'editing'              // Actively editing
  | 'generating_angles'    // Generating narrative angles
  | 'angle_selected'       // Angle chosen
  | 'generating'           // AI generating essay
  | 'iterating'            // Iterative improvement
  | 'complete';            // Target reached

export interface WorkshopState {
  stage: WorkshopStage;

  // Current draft
  currentDraft: string;
  draftVersions: DraftVersion[];
  currentVersionIndex: number;

  // Analysis results (full backend integration)
  analysisReport?: AnalysisReport;
  authenticityAnalysis?: AuthenticityAnalysis;
  elitePatterns?: ElitePatternAnalysis;
  literarySophistication?: LiterarySophisticationAnalysis;
  coaching?: CoachingOutput;

  // AI generation state
  narrativeAngles?: NarrativeAngle[];
  angleQualityScores?: AngleQualityScore[];
  selectedAngle?: NarrativeAngle;
  generationProfile?: GenerationProfile;
  generationResults?: GenerationResult[];

  // UI state
  expandedCategories: Set<string>;
  expandedIssues: Set<string>;
  activeTab: 'analysis' | 'coach' | 'edit' | 'generate';

  // Flags
  isAnalyzing: boolean;
  isGenerating: boolean;
  hasUnsavedChanges: boolean;
  lastAnalysisTime?: number;
}
