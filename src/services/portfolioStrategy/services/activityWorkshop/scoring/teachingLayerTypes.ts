/**
 * Teaching Layer Types
 *
 * Types for the deep teaching content that transforms analysis into actionable guidance.
 * The teaching layer takes scoring results and generates:
 * - Concrete rewrite suggestions with explanations
 * - Research-backed transformation principles
 * - Strategic portfolio improvement guidance
 *
 * Philosophy: Analysis tells you WHAT is wrong. Teaching tells you HOW to fix it.
 */

// ============================================================================
// ACTIVITY TRANSFORMATION TYPES
// ============================================================================

/**
 * Research citation backing a teaching recommendation
 */
export interface TeachingCitation {
  /** Source category */
  source: 'admissions_officer' | 'counselor_consensus' | 'research_study' | 'elite_school_guidance' | 'internal_database';
  /** Specific source name */
  sourceName: string;
  /** The insight being cited */
  insight: string;
  /** How this applies to the student's situation */
  application: string;
}

/**
 * A specific change made in a rewrite with explanation
 */
export interface RewriteChange {
  /** What was changed (e.g., "Verb choice") */
  element: 'verb_choice' | 'quantification' | 'impact_clarity' | 'specificity' | 'voice' | 'structure' | 'narrative_connection' | 'character_efficiency';
  /** Original text/approach */
  original: string;
  /** Transformed text/approach */
  transformed: string;
  /** Why this change improves the description */
  rationale: string;
}

/**
 * Complete transformation guidance for a single activity
 */
export interface ActivityTransformation {
  /** Activity identifier */
  activityId: string;
  /** Activity name */
  activityName: string;

  // === CONTEXT FROM SCORING ===
  /** Current combined score */
  currentScore: number;
  /** Primary issues identified in scoring */
  primaryIssues: string[];
  /** Severity of needed changes */
  revisionLevel: 'minor_polish' | 'moderate_revision' | 'major_overhaul' | 'strategic_rethink';

  // === TRANSFORMATION PRINCIPLE ===
  /** The core principle being applied */
  principle: {
    /** Name of the principle (e.g., "Show, Don't Tell") */
    name: string;
    /** Why this principle matters for admissions */
    whyItMatters: string;
    /** How it specifically applies to this activity */
    applicationToActivity: string;
  };

  // === CONCRETE REWRITE ===
  /** The actual transformation */
  rewrite: {
    /** Original description (150 chars) */
    original: string;
    /** Suggested improved version (150 chars) */
    suggested: string;
    /** Character count verification */
    characterCount: number;
    /** Detailed breakdown of changes made */
    changesApplied: RewriteChange[];
  };

  // === ALTERNATIVE ANGLES ===
  /** Optional alternative approaches if applicable */
  alternatives?: {
    /** Description of this angle */
    angle: string;
    /** Alternative rewrite */
    rewrite: string;
    /** When to use this version instead */
    whenToUse: string;
  }[];

  // === RESEARCH BACKING ===
  /** Citations supporting this transformation */
  citations: TeachingCitation[];

  // === EXPECTED IMPACT ===
  /** Projected score improvement */
  expectedScoreImprovement: {
    /** Estimated new score with this rewrite */
    projectedScore: number;
    /** Components that would improve */
    improvingComponents: string[];
    /** Why this score improvement is realistic */
    rationale: string;
  };
}

// ============================================================================
// PORTFOLIO STRATEGY TYPES
// ============================================================================

/**
 * Strategy for connecting a disconnected activity to the spike
 */
export interface ConnectionStrategy {
  /** Activity to connect */
  activityId: string;
  activityName: string;

  /** Current narrative fit status */
  currentFit: 'strong' | 'partial' | 'disconnected' | 'diluting';

  /** The connection being created */
  connection: {
    /** How to frame this activity in terms of the spike */
    narrativeFrame: string;
    /** Specific language to use */
    keyPhrases: string[];
    /** What aspect of the spike this supports */
    spikeAspect: string;
  };

  /** Implementation steps */
  implementationSteps: {
    /** Step number */
    step: number;
    /** Action to take */
    action: string;
    /** How to do it */
    howTo: string;
  }[];

  /** If the activity itself needs changing (not just the description) */
  activityChanges?: {
    /** Suggested changes to the activity itself */
    suggestions: string[];
    /** Why these changes would help */
    rationale: string;
    /** Timeline to implement */
    timeline: string;
  };
}

/**
 * Strategic priority with actionable guidance
 */
export interface StrategicPriority {
  /** Priority rank (1 = most important) */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Activity or area to address */
  target: string;
  /** Category of action */
  category: 'description_rewrite' | 'activity_enhancement' | 'new_credential' | 'narrative_connection' | 'activity_elevation';
  /** What to do */
  action: string;
  /** Why this is a priority */
  rationale: string;
  /** Specific steps to implement */
  steps: string[];
  /** Timeline if applicable */
  deadline?: string;
  /** Expected impact on profile */
  expectedImpact: string;
}

/**
 * Spike reinforcement guidance
 */
export interface SpikeReinforcement {
  /** Detected spike type */
  detectedSpike: string;
  /** Spike strength from scoring */
  spikeStrength: 'strong' | 'moderate' | 'emerging' | 'unclear';

  /** Current spike narrative */
  currentNarrative: {
    /** One-sentence summary */
    summary: string;
    /** What's working */
    strengths: string[];
    /** What's weakening it */
    weaknesses: string[];
  };

  /** Strengthened narrative */
  strengthenedNarrative: {
    /** Improved one-sentence summary */
    summary: string;
    /** Key phrases to use across descriptions */
    keyPhrases: string[];
    /** Consistent themes to emphasize */
    themes: string[];
  };

  /** How each activity should reference the spike */
  perActivityFraming: {
    activityId: string;
    activityName: string;
    /** How this activity supports the spike */
    spikeConnection: string;
    /** Suggested language for description */
    suggestedLanguage: string;
  }[];
}

// ============================================================================
// DESCRIPTION CRAFT TEACHING
// ============================================================================

/**
 * Teaching about a specific craft element (verbs, quantification, etc.)
 */
export interface CraftTeaching {
  /** Element being taught */
  element: 'verb_choice' | 'quantification' | 'impact_clarity' | 'voice_consistency' | 'specificity' | 'character_efficiency';
  /** The principle */
  principle: string;
  /** Why it matters */
  whyItMatters: string;

  /** Before/after examples from the student's portfolio */
  examples: {
    context: string;
    weak: string;
    strong: string;
    explanation: string;
  }[];

  /** Specific fixes for this student */
  studentSpecificFixes: {
    activity: string;
    current: string;
    improved: string;
  }[];

  /** General tips to apply */
  generalTips: string[];
}

// ============================================================================
// COMPLETE TEACHING OUTPUT
// ============================================================================

/**
 * Complete teaching layer output
 */
export interface TeachingLayerOutput {
  // === HEADER ===
  /** Teaching focus summary */
  teachingFocus: {
    /** Primary area needing attention */
    primaryFocus: string;
    /** Number of activities needing transformation */
    activitiesNeedingWork: number;
    /** Overall teaching approach */
    approach: string;
  };

  // === ACTIVITY TRANSFORMATIONS ===
  /** Deep transformation guidance for weak activities */
  activityTransformations: ActivityTransformation[];

  // === PORTFOLIO STRATEGY ===
  /** Strategic priorities */
  strategicPriorities: StrategicPriority[];
  /** Connection strategies for disconnected activities */
  connectionStrategies: ConnectionStrategy[];
  /** Spike reinforcement guidance */
  spikeReinforcement: SpikeReinforcement;

  // === CRAFT TEACHING ===
  /** Teaching on specific craft elements */
  craftTeaching: CraftTeaching[];

  // === QUICK REFERENCE ===
  /** All suggested rewrites in one place */
  rewriteQuickReference: {
    activityId: string;
    activityName: string;
    original: string;
    suggested: string;
    priority: 'high' | 'medium' | 'low';
  }[];

  // === METADATA ===
  metadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
    /** Activities that were analyzed for teaching */
    activitiesAnalyzed: number;
    /** Activities that received transformation guidance */
    activitiesTransformed: number;
  };
}

// ============================================================================
// SERVICE INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Input to the teaching layer service
 */
export interface TeachingLayerInput {
  /** Complete scoring rubric from scoring orchestrator */
  scoringRubric: import('./types').PortfolioScoreRubric;
  /** Original activities for reference */
  activities: import('../types').ActivityWorkshopInput[];
  /** Target application platform — determines character limits for rewrites */
  targetPlatform?: import('../types').ApplicationPlatform;
  /** Student context for personalization */
  studentContext?: {
    intendedMajor?: string;
    targetSchools?: string[];
    applicationTimeline?: string;
    /**
     * Current grade level (9 = freshman, 10 = sophomore, 11 = junior, 12 = senior)
     * Used to provide grade-appropriate timeline guidance
     */
    currentGrade?: number;
  };
  /** Options for teaching generation */
  options?: {
    /** Maximum activities to generate transformations for (default: 3) */
    maxTransformations?: number;
    /** Include alternative rewrites (default: true) */
    includeAlternatives?: boolean;
    /** Include craft teaching sections (default: true) */
    includeCraftTeaching?: boolean;
    /** Focus on specific activities by ID */
    focusActivities?: string[];
  };
  /**
   * Per-activity expertise data for field-specific teaching guidance.
   * Keyed by activity ID. Provides domain-specific AO expectations,
   * name-drop trap warnings, power verbs, exemplars, and transforms.
   * Cost: $0.00 (all pre-computed from static data)
   */
  expertiseData?: Map<string, {
    teachingContext: import('./expertiseSignaling/types').ExpertiseTeachingContext;
    exemplars: import('./expertiseSignaling/types').Exemplar[];
    transforms: import('./expertiseSignaling/types').DescriptionTransform[];
  }>;
  /**
   * Expert knowledge context for portfolio-level insights.
   * Provides school archetypes, constraint intelligence, narrative arcs,
   * character traits, advanced issue detection, and authenticity assessment.
   * Built by assembleExpertContext() in the orchestrator, cost: $0 (heuristic).
   */
  expertContext?: import('../expertCounselorKnowledgeBase').ExpertKnowledgeContext;
}

/**
 * Result from teaching layer service
 */
export interface TeachingLayerResult {
  success: boolean;
  teaching?: TeachingLayerOutput;
  error?: string;
  /** Timing information */
  timing?: {
    totalMs: number;
  };
}
