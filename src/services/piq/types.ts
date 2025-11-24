/**
 * PIQ WORKSHOP TYPES
 *
 * Type definitions for Personal Insight Question (PIQ) workshop system.
 * Unified 13-dimension rubric combining:
 * - PIQ-specific dimensions (Opening Hook, Vulnerability, Identity)
 * - Proven extracurricular dimensions (Initiative, Role Clarity, Context)
 * - Shared dimensions refined from both systems
 */

// ============================================================================
// RUBRIC DIMENSIONS (13 Total)
// ============================================================================

export type PIQRubricDimension =
  // Tier 1: Critical Foundations (45%)
  | 'opening_hook_quality'           // 10% - PIQ-specific
  | 'vulnerability_authenticity'     // 12% - PIQ-specific (highest weight)
  | 'specificity_evidence'           // 10% - Universal
  | 'voice_integrity'                // 8% - Universal
  | 'narrative_arc_stakes'           // 9% - Universal

  // Tier 2: Impact & Growth (30%)
  | 'transformative_impact'          // 10% - From extracurricular
  | 'role_clarity_ownership'         // 7% - From extracurricular
  | 'initiative_leadership'          // 7% - From extracurricular
  | 'context_circumstances'          // 6% - New dimension

  // Tier 3: Depth & Meaning (15%)
  | 'reflection_insight'             // 9% - Universal
  | 'identity_self_discovery'        // 6% - PIQ-specific

  // Tier 4: Polish & Positioning (10%)
  | 'craft_language_quality'         // 6% - Universal
  | 'fit_trajectory';                // 5% - From extracurricular

// PIQ Prompt Types
export type PIQPromptType =
  | 'piq1_leadership'
  | 'piq2_creative'
  | 'piq3_talent'
  | 'piq4_educational'
  | 'piq5_challenge'
  | 'piq6_academic'
  | 'piq7_community'
  | 'piq8_open_ended';

export interface PIQRubricScore {
  dimension: PIQRubricDimension;
  name: string;                    // Display name
  score_0_to_10: number;
  weight: number;                  // Percentage weight (0-1)
  evidence_snippets: string[];     // Quotes showing this score
  evaluator_notes: string;         // Why this score
}

// ============================================================================
// DETECTED ISSUES
// ============================================================================

export interface PIQDetectedIssue {
  id: string;
  dimension: PIQRubricDimension;
  issueType: string;              // Pattern ID (e.g., 'weak-hook-generic')
  severity: 'critical' | 'major' | 'minor';

  // UI Display
  title: string;                  // "Hook Missing Stakes"
  from_draft: string;             // Quote from their essay

  // Explanation
  problem: string;                // What's wrong
  why_matters: string;            // Why this hurts their essay

  // Fix strategies
  suggested_fixes: PIQSuggestedFix[];

  // Enrichment (added later)
  teachingExample?: PIQTeachingExample;
  reflectionPrompts?: PIQReflectionPrompts;
  priority?: number;              // Set during prioritization
}

export interface PIQSuggestedFix {
  fix_text: string;               // The actual fix/rewrite
  why_this_works: string;         // Explanation
  technique: string;              // The craft technique used
  apply_type: 'replace' | 'add' | 'reframe' | 'deepen';
  estimated_impact: string;       // "+1-2 points in Opening Hook"
}

// ============================================================================
// TEACHING EXAMPLES
// ============================================================================

export interface PIQTeachingExample {
  id: string;
  issueType: string;              // Maps to PIQDetectedIssue.issueType
  dimension: PIQRubricDimension;

  // Before/After
  weakExample: string;            // 20-40 words
  strongExample: string;          // 30-60 words

  // Learning
  explanation: string;            // What changed and why
  diffHighlights: string[];       // Bullet points of improvements
  principle: string;              // Transferable lesson

  // Context
  essayContext?: string;          // Which PIQ prompt type
  sourceInfo?: string;            // "Harvard admit, leadership PIQ"
}

// ============================================================================
// REFLECTION PROMPTS
// ============================================================================

export interface PIQReflectionPrompts {
  issueId: string;
  surface_prompts: string[];      // Quick reflection questions
  deep_prompts: string[];         // Deeper exploration questions
  tone: 'mentor' | 'coach' | 'curious_friend';
}

// ============================================================================
// DIMENSION SUMMARY (for accordion UI)
// ============================================================================

export interface PIQDimensionSummary {
  dimension: PIQRubricDimension;
  name: string;
  description: string;

  // Scoring
  score: number;                  // 0-10
  maxScore: number;               // 10
  weight: number;                 // 0-1
  status: 'critical' | 'needs_work' | 'good' | 'excellent';

  // Issues
  issueCount: {
    critical: number;
    major: number;
    minor: number;
    total: number;
  };

  // Issues for this dimension
  issues: PIQDetectedIssue[];

  // Diagnosis
  diagnosis: string;              // One-line summary
  keyPriority: string;            // What to focus on

  // Potential improvement
  potentialGain: {
    min: number;
    max: number;
    display: string;              // "+2 to +4 points"
  };

  // UI state
  isExpanded: boolean;
}

// ============================================================================
// WORKSHOP RESULT (main output)
// ============================================================================

export interface PIQWorkshopResult {
  // Overall scoring
  overallScore: number;           // 0-100 (like NQI)
  scoreTier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
  readerImpression: string;

  // Dimensions
  dimensions: PIQDimensionSummary[];

  // Issues (prioritized)
  topIssues: PIQDetectedIssue[];  // Max 3-5 to focus on
  allIssues: PIQDetectedIssue[];  // Full list

  // Quick summary
  quickSummary: string;           // One-line diagnosis

  // Metadata
  analysisId: string;
  timestamp: string;
  performance: {
    analysisMs: number;
    detectionMs: number;
    enrichmentMs: number;
    totalMs: number;
  };
}

export interface PIQWorkshopOptions {
  depth?: 'quick' | 'standard' | 'comprehensive';
  maxIssues?: number;              // Default: 5
  generateReflectionPrompts?: boolean;
  reflectionTone?: 'mentor' | 'coach' | 'curious_friend';
  promptType?: PIQPromptType;      // Which UC PIQ prompt (determines weight matrix)

  // Legacy support (deprecated - use promptType instead)
  essayType?: 'leadership' | 'challenge' | 'creative' | 'academic' | 'growth' | 'community' | 'passion';
}

// ============================================================================
// ISSUE PATTERNS (configuration for detection)
// ============================================================================

export interface PIQIssuePattern {
  id: string;                     // e.g., 'weak-hook-generic'
  dimension: PIQRubricDimension;
  title: string;                  // Display name
  severity: 'critical' | 'major' | 'minor';

  // Detection
  triggerConditions: {
    scoreThreshold?: number;      // Trigger if dimension score < X
    keywordPatterns?: string[];   // Red flag phrases
    absencePatterns?: string[];   // Missing elements (e.g., no numbers)
    customCheck?: string;         // Custom logic identifier
  };

  // Template content
  problemTemplate: string;        // Description of problem
  whyMattersTemplate: string;     // Why this hurts the essay

  // Fix strategies
  fixStrategies: {
    technique: string;
    description: string;
    estimatedImpact: string;
  }[];
}
