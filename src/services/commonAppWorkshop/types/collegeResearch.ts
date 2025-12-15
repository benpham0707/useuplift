/**
 * College Research Database Types
 *
 * Comprehensive type definitions for the college-specific research data
 * extracted from comprehensive overlays. This system enables:
 *
 * 1. FULL college research context for Sonnet (no compression)
 * 2. Citation mapping by Haiku (which quotes apply to which essay issues)
 * 3. College-specific rubrics with dimension weights
 * 4. Red/Green flags with evidence-based detection
 * 5. Socratic questions tailored to college values
 * 6. Elite examples with annotations
 *
 * **QUALITY PRINCIPLE**: We never compress or omit research data.
 * All sources, quotes, and evidence are preserved for maximum teaching quality.
 */

// ============================================================================
// CORE COLLEGE RESEARCH TYPES
// ============================================================================

/**
 * Comprehensive college research data
 * Contains all research for a single college, fully structured
 */
export interface CollegeResearch {
  // College Identification
  collegeId: string;                    // e.g., 'stanford', 'mit', 'harvard'
  collegeName: string;                  // e.g., 'Stanford University'

  // Research Quality Metadata
  researchQuality: {
    score: number;                      // 0-100, from overlay header
    totalSources: number;               // e.g., 43+ for Stanford
    lastUpdated: string;                // ISO date
    keyInstitutionalSources: string[];  // CDS, Dean quotes, etc.
  };

  // Core Values (the heart of college-specific feedback)
  coreValues: CollegeCoreValue[];

  // Essay Prompts with Rubrics
  essayPrompts: CollegeEssayPrompt[];

  // Red Flags (college-specific problems to detect)
  redFlags: CollegeRedFlag[];

  // Green Flags (college-specific strengths to recognize)
  greenFlags: CollegeGreenFlag[];

  // Socratic Questions (college-specific teaching questions)
  socraticQuestions: CollegeSocraticQuestionBank;

  // Elite Examples (annotated successful essays)
  eliteExamples: CollegeEliteExample[];

  // Key Quotes (from deans, admissions, etc.)
  keyQuotes: CollegeKeyQuote[];

  // Dimension Weight Adjustments (how this college weights 12 dimensions)
  dimensionWeights: CollegeDimensionWeights;
}

// ============================================================================
// CORE VALUES
// ============================================================================

/**
 * A core value that a college prioritizes
 * Each value has evidence from official sources
 */
export interface CollegeCoreValue {
  valueId: string;                      // e.g., 'intellectual_vitality'
  valueName: string;                    // e.g., 'Intellectual Vitality'

  // Weight relative to other values (sum should = 100 for all values)
  weight: number;                       // e.g., 40 for Stanford IV

  // Definition from official sources
  definition: string;

  // How this value should appear in essays
  essayImplication: string;

  // Evidence supporting this value's importance
  evidence: {
    source: string;                     // e.g., 'Dean Richard Shaw'
    quote: string;                      // Exact quote
    context: string;                    // Where this was said
  }[];

  // How many sources mention this value (for confidence)
  sourceMentionCount: number;           // e.g., '5/5 sources mention this'

  // What this value is NOT (common misconceptions)
  isNot: string[];

  // What this value IS (positive examples)
  is: string[];
}

// ============================================================================
// ESSAY PROMPTS & RUBRICS
// ============================================================================

/**
 * A college's specific essay prompt with full rubric
 */
export interface CollegeEssayPrompt {
  promptId: string;                     // e.g., 'stanford_intellectual_vitality'
  promptNumber: number;                 // 1, 2, 3, etc.
  promptTitle: string;                  // e.g., 'Intellectual Vitality'
  promptText: string;                   // Full prompt text

  wordCount: {
    min: number;
    max: number;
  };

  // Primary purpose of this essay
  primaryAssessment: string;            // e.g., 'Pure Intellectual Vitality'

  // How important is this essay?
  importance: 'critical' | 'high' | 'medium';
  importanceContext: string;            // Why it's important

  // Full scoring rubric
  rubric: CollegeEssayRubric;

  // Dimensional evaluation criteria specific to this prompt
  dimensionalCriteria: PromptDimensionalCriteria[];
}

/**
 * Scoring rubric for a specific essay prompt
 */
export interface CollegeEssayRubric {
  // Score bands with criteria
  excellent: RubricBand;    // 90-100
  good: RubricBand;         // 70-89
  average: RubricBand;      // 50-69
  weak: RubricBand;         // below 50

  // Critical warnings specific to this essay
  criticalWarnings?: {
    source: string;
    warning: string;
  }[];
}

/**
 * A band in the scoring rubric
 */
export interface RubricBand {
  scoreRange: string;                   // e.g., '90-100'
  description: string;                  // Overall description
  criteria?: string[];                  // What essays in this band have (optional for weak band)
  typicalElements?: string[];           // Common features
  whatPreventsHigherScore?: string;     // How to improve (for non-excellent)
  criticalFailures?: string[];          // What causes this score (for weak)
  dimensionalPattern?: Record<string, string>; // e.g., { intellectual_vitality: 'STRONG' }
}

/**
 * Dimensional evaluation criteria for a specific prompt
 */
export interface PromptDimensionalCriteria {
  dimensionId: string;                  // e.g., 'intellectual_vitality_energy'
  dimensionName: string;
  weight: number;                       // 0-100, relative to other dimensions for this prompt
  context: string;                      // Why this dimension matters for this prompt

  evaluationQuestions: string[];        // Questions to evaluate this dimension

  scoringLogic: {
    strong: string[];                   // What STRONG looks like
    adequate: string[];                 // What ADEQUATE looks like
    weak: string[];                     // What WEAK looks like
  };

  impactOnScore: {
    strong: string;                     // e.g., 'Essential for 85+'
    adequate: string;                   // e.g., 'Supports 70-84'
    weak: string;                       // e.g., 'Caps at 69'
  };

  howToImprove: string[];               // Specific improvement suggestions
}

// ============================================================================
// RED FLAGS & GREEN FLAGS
// ============================================================================

/**
 * College-specific red flag to detect
 * These are problems that this college particularly dislikes
 */
export interface CollegeRedFlag {
  flagId: string;                       // e.g., 'CLASS_BASED_ONLY'
  flagName: string;                     // Human-readable name

  // Which essays this applies to (empty = all)
  applicablePrompts: string[];

  // Severity of this flag
  severity: 'critical' | 'major' | 'minor';

  // Detection criteria
  detection: {
    description: string;                // What to look for
    signalPhrases: string[];            // Phrases that might indicate this flag
    patterns: string[];                 // Regex patterns (optional)
  };

  // Evidence from college sources
  evidence: {
    source: string;
    quote: string;
    explanation: string;
  };

  // Teaching when this flag is detected
  teaching: {
    problem: string;                    // What's wrong
    whyItMatters: string;               // Why college cares
    howToFix: string;                   // How to address
    exampleFix?: string;                // Before/after example
  };

  // Impact on score
  scoreImpact: {
    dimension: string;                  // Which dimension is affected
    penalty: string;                    // e.g., 'Caps at 69'
  };
}

/**
 * College-specific green flag to recognize
 * These are strengths that this college particularly values
 */
export interface CollegeGreenFlag {
  flagId: string;                       // e.g., 'SELF_DIRECTED_EXPLORATION'
  flagName: string;

  // Which essays this applies to
  applicablePrompts: string[];

  // How strong this signal is
  strength: 'exceptional' | 'strong' | 'positive';

  // Detection criteria
  detection: {
    description: string;
    signalPhrases: string[];
    patterns: string[];
  };

  // Evidence from college sources
  evidence: {
    source: string;
    quote: string;
    explanation: string;
  };

  // Teaching when this flag is detected
  teaching: {
    whatWorks: string;                  // What they did well
    whyItMatters: string;               // Why college values this
    howToEnhance: string;               // How to make it even stronger
  };

  // Impact on score
  scoreImpact: {
    dimension: string;
    bonus: string;                      // e.g., 'Supports 85+'
  };
}

// ============================================================================
// SOCRATIC QUESTIONS
// ============================================================================

/**
 * Bank of college-specific Socratic questions
 */
export interface CollegeSocraticQuestionBank {
  // Questions organized by purpose
  byPurpose: {
    deepening: CollegeSocraticQuestion[];     // To deepen reflection
    specificity: CollegeSocraticQuestion[];   // To add specifics
    connection: CollegeSocraticQuestion[];    // To connect to college
    voice: CollegeSocraticQuestion[];         // To strengthen voice
    vulnerability: CollegeSocraticQuestion[]; // To add vulnerability
  };

  // Questions organized by essay prompt
  byPrompt: Record<string, CollegeSocraticQuestion[]>;

  // Questions organized by issue type
  byIssue: Record<string, CollegeSocraticQuestion[]>;
}

/**
 * A single Socratic question
 */
export interface CollegeSocraticQuestion {
  questionId: string;
  question: string;

  // When to use this question
  trigger: {
    issue?: string;                     // e.g., 'lacks_depth'
    dimension?: string;                 // e.g., 'intellectual_vitality'
    flagDetected?: string;              // e.g., 'CLASS_BASED_ONLY'
  };

  // Purpose of this question
  purpose: string;

  // Expected outcome from asking this
  expectedOutcome: string;

  // Example of good response to this question
  exampleGoodResponse?: string;

  // Follow-up question if needed
  followUp?: string;
}

// ============================================================================
// ELITE EXAMPLES
// ============================================================================

/**
 * An annotated elite example for this college
 */
export interface CollegeEliteExample {
  exampleId: string;                    // e.g., 'STAN_IV_001'

  // Which prompt this is for
  promptId: string;
  promptTitle: string;

  // The example content
  content: {
    fullText: string;                   // Complete essay text
    wordCount: number;
  };

  // Quality assessment
  quality: {
    score: number;                      // 0-100
    tier: 'exceptional' | 'excellent' | 'strong';
  };

  // What this example demonstrates
  demonstrates: string[];               // e.g., ['self-directed exploration', 'authentic voice']

  // Detailed annotations
  annotations: ExampleAnnotation[];

  // Techniques used that can be taught
  teachableTechniques: {
    technique: string;
    howItWorks: string;
    whereInExample: string;             // Quote from example
  }[];

  // Tags for matching to student issues
  tags: string[];
}

/**
 * Annotation on a specific part of an example
 */
export interface ExampleAnnotation {
  annotationId: string;
  quote: string;                        // The annotated text
  location: 'opening' | 'body' | 'conclusion';

  annotation: {
    whatWorks: string;
    technique: string;
    whyEffective: string;
    collegeValueServed: string;         // Which college value this serves
  };
}

// ============================================================================
// KEY QUOTES
// ============================================================================

/**
 * Important quote from college sources
 */
export interface CollegeKeyQuote {
  quoteId: string;

  source: {
    name: string;                       // e.g., 'Dean Richard Shaw'
    title: string;                      // e.g., 'Dean of Admission and Financial Aid'
    publication?: string;               // e.g., 'Stanford Magazine'
    date?: string;
  };

  quote: string;                        // Exact quote
  context: string;                      // What they were discussing

  // What this quote teaches us
  insight: string;

  // When to cite this quote
  useCases: {
    issue?: string;                     // When student has this issue
    dimension?: string;                 // When teaching this dimension
    flag?: string;                      // When this flag is detected
  }[];

  // How to use in teaching
  teachingApplication: string;
}

// ============================================================================
// DIMENSION WEIGHTS
// ============================================================================

/**
 * How this college weights the 12 standard dimensions
 */
export interface CollegeDimensionWeights {
  // Each dimension with college-specific weight and context
  dimensions: {
    dimensionId: string;                // Standard dimension ID
    dimensionName: string;

    // College-specific weight (default is 8.33 for even distribution)
    weight: number;                     // 0-100, all should sum to 100

    // Why this college weights this dimension this way
    context: string;

    // College-specific evidence for this weight
    evidence?: string;
  }[];

  // Top 3 dimensions for this college
  primaryDimensions: string[];

  // Which dimensions are de-emphasized
  secondaryDimensions: string[];
}

// ============================================================================
// PATTERN TYPES (for essay classification)
// ============================================================================

/**
 * Essay pattern types from the Pattern Recognition Engine
 */
export type EssayPattern =
  | 'why_this_school'           // Pattern 1
  | 'community_contribution'     // Pattern 2
  | 'intellectual_curiosity'     // Pattern 3
  | 'diversity_perspective'      // Pattern 4
  | 'meaningful_activity'        // Pattern 5
  | 'career_goals'              // Pattern 6
  | 'challenge_overcome'         // Pattern 7
  | 'creative_work'             // Pattern 8
  | 'ethical_dilemma'           // Pattern 9
  | 'quirky_creative'           // Pattern 10
  | 'letter_format'             // Pattern 11
  | 'short_answer'              // Pattern 12
  | 'personal_statement'        // Pattern 13
  | 'hybrid'                    // Pattern 14
  | 'unknown';

// ============================================================================
// COLLEGE DATABASE
// ============================================================================

/**
 * The complete college research database
 * Maps college IDs to their comprehensive research data
 */
export interface CollegeResearchDatabase {
  version: string;                      // e.g., '1.0.0'
  lastUpdated: string;                  // ISO date

  // All colleges
  colleges: Record<string, CollegeResearch>;

  // Supported patterns (which patterns have overlays)
  supportedPatterns: EssayPattern[];

  // College-pattern matrix (which colleges have which patterns)
  collegePatternMatrix: Record<string, EssayPattern[]>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Severity levels for issues
 */
export type Severity = 'critical' | 'major' | 'minor' | 'optimization';

/**
 * Score impact levels
 */
export type ScoreImpact = 'caps_below_50' | 'caps_at_69' | 'caps_at_79' | 'supports_80_plus' | 'enables_90_plus';

/**
 * Dimension strength levels
 */
export type DimensionStrength = 'exceptional' | 'strong' | 'adequate' | 'weak' | 'missing';

/**
 * Teaching stage
 */
export type TeachingStage = 1 | 2 | 3;

// ============================================================================
// CITATION MAPPING TYPES (for Haiku pre-analysis)
// ============================================================================

/**
 * Citation mapping result from Haiku
 * Maps which college research citations apply to which parts of the essay
 */
export interface CitationMapping {
  // Which essay this mapping is for
  essayHash: string;

  // Essay structural analysis
  structural: {
    wordCount: number;
    paragraphCount: number;
    hasOpeningHook: boolean;
    hasConclusion: boolean;
    avgSentenceLength: number;
  };

  // Pattern confirmation
  patternAnalysis: {
    primaryPattern: EssayPattern;
    confidence: number;
    secondaryPattern?: EssayPattern;
  };

  // Which college values are relevant
  relevantValues: {
    valueId: string;
    relevance: 'high' | 'medium' | 'low';
    applicableToLocation: string;       // e.g., 'paragraph_1'
  }[];

  // Which quotes apply where
  applicableQuotes: {
    quoteId: string;
    quote: string;
    source: string;
    appliesTo: string;                  // What part of essay
    relevance: string;                  // Why it's relevant
    suggestedUse: string;               // How to use in teaching
  }[];

  // Red flags detected with locations
  triggeredRedFlags: {
    flagId: string;
    flagName: string;
    evidence: string;                   // Quote from essay
    location: string;                   // e.g., 'paragraph_1'
    citationToUse: string;              // Which quote to cite
  }[];

  // Green flag opportunities
  greenFlagOpportunities: {
    flagId: string;
    flagName: string;
    opportunity: string;                // What could be enhanced
    location: string;
    citationToSupport: string;
  }[];

  // Example relevance ranking
  exampleRelevance: {
    exampleId: string;
    relevance: 'high' | 'medium' | 'low';
    specificTechnique: string;          // What technique to learn from this example
  }[];
}
