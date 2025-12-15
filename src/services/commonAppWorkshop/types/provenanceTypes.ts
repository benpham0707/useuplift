/**
 * Provenance Types - How We Know What We Know
 *
 * For every weight, claim, or recommendation, we track:
 * 1. WHERE it came from (sources)
 * 2. HOW we derived it (methodology)
 * 3. HOW CONFIDENT we are (credibility score)
 * 4. WHEN we last checked (verification)
 *
 * **Design Principle**: Student-friendly explanations at every level.
 * High schoolers should understand our reasoning without needing a PhD.
 */

// ============================================================================
// CORE PROVENANCE TYPES
// ============================================================================

/**
 * How we derived a college value weight
 *
 * Example: "Stanford weighs Intellectual Vitality at 40%"
 * This documents WHERE that 40% came from and HOW confident we are.
 */
export interface ValueWeightProvenance {
  // The claim
  value_id: string; // e.g., 'intellectual_vitality'
  value_name: string; // e.g., 'Intellectual Vitality'
  weight: number; // e.g., 40

  // Where it came from
  derivation_method: DerivationMethod;

  // The evidence
  primary_sources: ProvenanceSource[];
  supporting_sources: ProvenanceSource[];

  // How we calculated it
  calculation: {
    // For students (normal English)
    student_friendly_explanation: string;

    // For detail-oriented students/parents
    detailed_methodology: string;

    // Step-by-step breakdown
    calculation_steps: string[];
  };

  // How confident we are
  credibility: {
    level: CredibilityLevel;
    reasoning: string;
    last_verified: string; // ISO date YYYY-MM-DD
  };

  // When to review this
  review_schedule: {
    next_review: string; // ISO date YYYY-MM-DD
    review_frequency: 'quarterly' | 'semi-annual' | 'annual';
  };
}

/**
 * How we know something (derivation method)
 */
export type DerivationMethod =
  | 'explicit_statement' // Dean said "This is our #1 priority"
  | 'frequency_analysis' // Counted mentions across sources
  | 'rubric_analysis' // Analyzed official rubrics
  | 'composite'; // Combination of above

/**
 * Credibility levels (how sure we are)
 */
export type CredibilityLevel =
  | 'very_high' // Direct quote from dean/official source (90-100%)
  | 'high' // Strong evidence from multiple sources (70-89%)
  | 'medium'; // Reasonable inference from available data (50-69%)

/**
 * A single source of evidence
 */
export interface ProvenanceSource {
  // What it is
  source_id: string;
  type: SourceType;

  // The details
  title: string;
  author?: string; // e.g., "Dean Richard Shaw"
  author_title?: string; // e.g., "Dean of Admission and Financial Aid"
  publication?: string; // e.g., "Stanford Magazine"
  date?: string; // YYYY-MM format
  url?: string;

  // The evidence
  quote?: string; // Exact quote if applicable
  finding?: string; // For research/analysis

  // How we use it
  relevance_to_claim: string; // Why this source matters
  weight_in_calculation: number; // 0-100, how much this influenced the weight

  // Verification
  last_verified: string; // ISO date YYYY-MM-DD
  verification_status: 'current' | 'outdated' | 'needs_review';
  archived_url?: string; // Backup if URL dies
}

/**
 * Types of sources (ordered by authority)
 */
export type SourceType =
  | 'dean_quote' // Quote from dean/admission director (highest authority)
  | 'cds' // Common Data Set (official data)
  | 'admission_website' // Official admission website
  | 'essay_prompt' // Official essay prompts
  | 'mission_statement' // College mission/values
  | 'interview' // Published interview with admission staff
  | 'internal_analysis'; // Our research (frequency counts, pattern analysis)

// ============================================================================
// CITATION SELECTION TYPES
// ============================================================================

/**
 * When a student has an issue, which citations should we show?
 */
export interface CitationContext {
  // What happened
  issue_detected: string; // e.g., 'CLASS_BASED_ONLY'
  severity: 'critical' | 'major' | 'minor';

  // Where it happened
  college_id: string;
  essay_type: string;
  student_draft_excerpt?: string;

  // What we're telling the student
  our_feedback: {
    problem: string;
    why_matters: string;
    how_to_fix: string;
  };
}

/**
 * Selected citations with relevance scores
 */
export interface SelectedCitation {
  citation: ProvenanceSource;

  // Why we selected this citation for THIS student
  relevance: {
    score: number; // 0-100
    reason: string; // "Dean Shaw explicitly warns against classroom-only learning"
    use_for: CitationUse;
  };

  // How to present it to student
  presentation: {
    // Simple version (for quick understanding)
    simplified_version: string;

    // Full version (if they click "show more")
    full_version: string;

    // Priority (1 = show first)
    display_priority: number;
  };
}

/**
 * Where/why to use a citation
 */
export type CitationUse =
  | 'prove_weight' // "How do you know it's 40%?"
  | 'explain_problem' // "Why is this an issue?"
  | 'justify_severity' // "Why is this critical?"
  | 'show_elite_pattern' // "What do great essays do?"
  | 'teach_technique'; // "How to improve"

// ============================================================================
// STUDENT-FRIENDLY EXPLANATION TYPES
// ============================================================================

/**
 * Explanation at different complexity levels
 *
 * Level 1: Tweet-length (for quick understanding)
 * Level 2: Paragraph (for most students)
 * Level 3: Full detail (for curious/skeptical students)
 */
export interface LayeredExplanation {
  // Level 1: One sentence
  one_sentence: string;

  // Level 2: Paragraph (normal English)
  student_friendly: string;

  // Level 3: Full detail (optional expand)
  detailed: {
    methodology: string;
    evidence: string;
    confidence: string;
  };

  // Optional: Visual summary
  visual_summary?: {
    type: 'bar_chart' | 'pie_chart' | 'ratio';
    data: any;
  };
}

/**
 * How to explain a weight derivation to students
 */
export interface WeightExplanation {
  // The claim
  claim: string; // "Stanford weighs Intellectual Vitality at 40%"

  // Level 1: Simple explanation (one sentence)
  simple: string; // "Stanford's dean said this is their #1 priority"

  // Level 2: Medium explanation (because...)
  because: string; // "In a 2023 interview, Dean Shaw said..."

  // Level 3: Full explanation (if they click "why?")
  full_story: {
    who_said_it: string;
    what_they_said: string;
    how_we_calculated: string;
    how_confident: string;
  };

  // The actual sources (for transparency)
  sources: ProvenanceSource[];

  // Visual representation
  visual?: {
    type: 'weight_bar' | 'pie_slice';
    data: {
      this_value: number;
      other_values: number;
    };
  };
}

// ============================================================================
// CREDIBILITY ASSESSMENT TYPES
// ============================================================================

/**
 * How we assess credibility of a claim
 */
export interface CredibilityAssessment {
  // Overall credibility
  level: CredibilityLevel;
  score: number; // 0-100

  // Why we're this confident
  reasoning: string;

  // Breakdown by factor
  factors: {
    source_authority: CredibilityFactor;
    recency: CredibilityFactor;
    multiple_sources: CredibilityFactor;
    specificity: CredibilityFactor;
  };

  // Overall assessment
  summary: string; // Student-friendly summary
}

/**
 * A single credibility factor
 */
export interface CredibilityFactor {
  score: number; // 0-100
  reason: string; // Why this score
  weight: number; // How much this factor matters (0-1)
}

// ============================================================================
// DYNAMIC CITATION MAPPING TYPES
// ============================================================================

/**
 * Maps student issues to relevant citations
 */
export interface IssueCitationMap {
  issue_id: string; // e.g., 'CLASS_BASED_ONLY'
  issue_name: string; // e.g., 'Classroom-Bounded Learning'

  // Which colleges this applies to
  applicable_colleges: string[]; // ['stanford', 'mit', ...]

  // Citations to use for this issue
  recommended_citations: {
    // For explaining the problem
    problem_citations: string[]; // source_ids

    // For showing why it matters
    severity_citations: string[]; // source_ids

    // For teaching how to fix
    teaching_citations: string[]; // source_ids

    // For showing what works
    elite_pattern_citations: string[]; // source_ids
  };

  // Keywords to match
  detection_keywords: string[];
}

// ============================================================================
// VERIFICATION TRACKING TYPES
// ============================================================================

/**
 * Track verification status of sources
 */
export interface SourceVerification {
  source_id: string;

  // Current status
  status: 'verified' | 'needs_verification' | 'url_broken' | 'content_changed';

  // Verification history
  verifications: VerificationEvent[];

  // Next review
  next_review_date: string; // ISO date YYYY-MM-DD
  review_frequency_days: number;

  // Archived copy
  archived_copy?: {
    url: string;
    date_archived: string;
    archive_service: 'internal' | 'wayback_machine';
  };
}

/**
 * A single verification event
 */
export interface VerificationEvent {
  date: string; // ISO date YYYY-MM-DD
  verified_by: string; // 'research_team' | 'automated'
  status_found: 'current' | 'outdated' | 'url_broken' | 'content_changed';
  notes?: string;
  action_taken?: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  ValueWeightProvenance,
  DerivationMethod,
  CredibilityLevel,
  ProvenanceSource,
  SourceType,
  CitationContext,
  SelectedCitation,
  CitationUse,
  LayeredExplanation,
  WeightExplanation,
  CredibilityAssessment,
  CredibilityFactor,
  IssueCitationMap,
  SourceVerification,
  VerificationEvent,
};
