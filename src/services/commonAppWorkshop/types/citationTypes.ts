// @ts-nocheck
/**
 * Citation Types for Evidence-Based Teaching
 *
 * This module defines types for the citation exposure system, which embeds
 * evidence citations directly in teaching text for UI hover tooltips.
 *
 * **Core Concept**: Every claim in teaching must be backed by evidence.
 * Citations are embedded inline using [cited text]{{citation_id}} format.
 *
 * **Citation Flow**:
 * 1. Claude generates suggestions with inline citation markers
 * 2. Claude builds citation database with full source details
 * 3. Backend validates all citations resolve correctly
 * 4. Backend enriches citations with research database context
 * 5. Frontend parses markers and renders hover tooltips
 *
 * **Example**:
 * ```
 * text_with_citations: "Stanford values [self-directed exploration]{{cite_1}}"
 * citations: {
 *   "cite_1": {
 *     type: "value",
 *     source: { name: "Stanford Core Values" },
 *     evidence: { value_name: "Self-Directed Exploration", ... },
 *     why_relevant: "Primary value being demonstrated"
 *   }
 * }
 * ```
 */

// ============================================================================
// CORE CITATION TYPES
// ============================================================================

/**
 * Citation type discriminator - HOLISTIC 3-TYPE SYSTEM
 *
 * Simplified from 5 types to 3 for better UX:
 * - problem: Red highlight (what's wrong)
 * - strength: Green underline (what's working + core values)
 * - teaching: Purple box only (how to improve via elite techniques)
 */
export type CitationType = 'problem' | 'strength' | 'teaching';

/**
 * Severity levels for problem citations
 */
export type CitationSeverity = 'critical' | 'major' | 'minor' | 'optimization';

/**
 * Strength type - distinguishes core values from patterns
 */
export type StrengthType = 'core_value' | 'pattern';

/**
 * Base citation interface
 * All citation types extend this with type-specific evidence
 */
export interface BaseCitation {
  /** Unique ID for this citation (cite_1, cite_2, etc.) */
  id: string;

  /** Citation type (determines evidence structure) */
  type: CitationType;

  /** Source information (who said it, where) */
  source: CitationSource;

  /** Why this citation is relevant to the claim being made */
  why_relevant: string;

  /** Link back to research database (for enrichment) */
  research_id: string;
}

/**
 * Source information for a citation
 * Contains metadata about who/where this evidence comes from
 */
export interface CitationSource {
  /** Name of person/system (e.g., "Dean Richard Shaw", "Stanford Red Flag System") */
  name: string;

  /** Title/role (e.g., "Dean of Admission and Financial Aid") */
  title: string;

  /** Publication where found (optional, for quotes) */
  publication?: string;

  /** Date of quote/source (optional, ISO format YYYY-MM) */
  date?: string;

  /** URL to source (optional, for web sources) */
  url?: string;
}

// ============================================================================
// TYPE-SPECIFIC CITATION INTERFACES - HOLISTIC 3-TYPE SYSTEM
// ============================================================================

/**
 * Problem citation - shows what's wrong (RED HIGHLIGHT)
 *
 * Visual: Red background highlight in essay text
 * Use: Original draft showing issues, problems detected
 *
 * Consolidates: red_flag type from old system
 */
export interface ProblemCitation extends BaseCitation {
  type: 'problem';

  evidence: {
    /** Problem identifier (e.g., "CLASS_BASED_ONLY") */
    problem_id: string;

    /** Human-readable problem name */
    problem_name: string;

    /** Severity level */
    severity: CitationSeverity;

    /** What triggered this problem (quote from essay) */
    what_triggered_it: string;

    /** Why this matters to the college */
    why_matters: string;

    /** Score impact (e.g., "Caps Intellectual Vitality at 69") */
    score_impact: string;

    /** How to fix it (brief guidance) */
    how_to_fix?: string;
  };
}

/**
 * Strength citation - shows what's working (GREEN UNDERLINE)
 *
 * Visual: Green underline in essay text (no background)
 * Use: Revised essay showing strengths, core values demonstrated
 *
 * Consolidates: green_flag + value types from old system
 *
 * **Key insight**: Values and strengths unified because both answer
 * "What's working?" - strength is demonstrated value
 */
export interface StrengthCitation extends BaseCitation {
  type: 'strength';

  evidence: {
    /** Strength identifier */
    strength_id: string;

    /** Human-readable strength name (e.g., "Intellectual Vitality: Self-Directed Project") */
    strength_name: string;

    /** Is this a core value or a pattern? */
    strength_type: StrengthType;

    /** What the student did that demonstrates this */
    what_demonstrates_it: string;

    /** Why the college values this */
    why_valued: string;

    /** Score impact (e.g., "Supports 85+ scoring") */
    score_impact: string;

    // --- For core_value strength_type ---
    /** College value weight (e.g., 40 for Stanford IV) */
    value_weight?: number;

    /** Value definition */
    value_definition?: string;

    // --- For pattern strength_type ---
    /** Pattern strength level */
    pattern_strength?: 'exceptional' | 'strong' | 'positive';
  };
}

/**
 * Teaching citation - shows how to improve (PURPLE BOX ONLY)
 *
 * Visual: NO inline styling in text. Purple indicator in citation box only.
 * Use: Rationale/teaching sections explaining techniques
 *
 * Consolidates: quote + example types from old system
 *
 * **Key insight**: Teaching citations appear in RATIONALE, not in essay text.
 * They explain techniques, show elite examples, cite dean quotes.
 */
export interface TeachingCitation extends BaseCitation {
  type: 'teaching';

  evidence: {
    /** What type of teaching is this? */
    teaching_type: 'elite_technique' | 'dean_quote' | 'principle';

    // --- For elite_technique ---
    /** Elite example identifier (e.g., "STAN_IV_007") */
    example_id?: string;

    /** Example score (0-100) */
    example_score?: number;

    /** Quote from elite example */
    example_quote?: string;

    /** The technique to learn */
    technique: string;

    // --- For dean_quote ---
    /** Dean/AO name */
    dean_name?: string;

    /** Dean title */
    dean_title?: string;

    /** Publication */
    dean_publication?: string;

    /** Date */
    dean_date?: string;

    /** Full quote */
    dean_quote?: string;

    /** Quote context (when/why said) */
    dean_context?: string;

    // --- For principle ---
    /** Teaching principle being explained */
    principle?: string;

    /** How this principle applies */
    application?: string;
  };
}

/**
 * Union type of all citation types (3 instead of 5)
 */
export type Citation = ProblemCitation | StrengthCitation | TeachingCitation;

// ============================================================================
// BACKWARDS COMPATIBILITY ALIASES (for migration)
// ============================================================================

/**
 * @deprecated Use ProblemCitation instead
 * Kept for backwards compatibility during migration
 */
export type RedFlagCitation = ProblemCitation;

/**
 * @deprecated Use StrengthCitation instead (with strength_type: 'pattern')
 * Kept for backwards compatibility during migration
 */
export type GreenFlagCitation = StrengthCitation;

/**
 * @deprecated Use StrengthCitation instead (with strength_type: 'core_value')
 * Kept for backwards compatibility during migration
 */
export type ValueCitation = StrengthCitation;

/**
 * @deprecated Use TeachingCitation instead (with teaching_type: 'elite_technique')
 * Kept for backwards compatibility during migration
 */
export type ExampleCitation = TeachingCitation;

/**
 * @deprecated Use TeachingCitation instead (with teaching_type: 'dean_quote')
 * Kept for backwards compatibility during migration
 */
export type QuoteCitation = TeachingCitation;

// ============================================================================
// CITATION DATABASE
// ============================================================================

/**
 * Citation database for a piece of teaching
 * Maps citation IDs to full citation objects
 */
export interface CitationDatabase {
  /** Map of citation_id → Citation */
  citations: Record<string, Citation>;

  /** Metadata about this citation database */
  metadata?: {
    /** Total number of citations */
    total_count: number;

    /** Citations by type */
    by_type: Record<CitationType, number>;

    /** When this was generated */
    generated_at: string;
  };
}

// ============================================================================
// TEXT WITH CITATIONS
// ============================================================================

/**
 * Text with embedded citation markers
 * Format: [cited text]{{citation_id}}
 *
 * Example: "Stanford values [self-directed exploration]{{cite_1}}"
 */
export type TextWithCitations = string;

/**
 * Parsed text span (result of parsing TextWithCitations)
 * Array of text segments, some with citations, some without
 */
export interface ParsedTextSpan {
  /** The text content of this span */
  text: string;

  /** Citation ID if this span is cited (null if not cited) */
  citation_id: string | null;

  /** Start position in original text */
  start_pos: number;

  /** End position in original text */
  end_pos: number;
}

/**
 * Complete parsed text with citations
 */
export interface ParsedText {
  /** Original text with citation markers */
  original: TextWithCitations;

  /** Array of parsed spans */
  spans: ParsedTextSpan[];

  /** All citation IDs found in text (for validation) */
  citation_ids: string[];

  /** Plain text with citation markers removed */
  plain_text: string;
}

// ============================================================================
// ENRICHED CITATIONS (with full research context)
// ============================================================================

/**
 * Enriched citation - basic citation + full research database context
 * Created by CitationProcessor.enrichCitation()
 */
export interface EnrichedCitation extends Citation {
  /** Full research context from database */
  research_context?: {
    /** All evidence from research for this quote/flag/value */
    all_evidence?: string[];

    /** Related citations that might also be relevant */
    related_citations?: string[];

    /** Full college research object ID */
    college_id?: string;

    /** Prompt ID if citation is prompt-specific */
    prompt_id?: string;
  };

  /** Enrichment metadata */
  enrichment?: {
    /** When this was enriched */
    enriched_at: string;

    /** Whether enrichment was successful */
    success: boolean;

    /** Any warnings during enrichment */
    warnings?: string[];
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Citation validation result
 */
export interface CitationValidationResult {
  /** Whether all citations are valid */
  valid: boolean;

  /** Total citations in database */
  total_citations: number;

  /** Total citation IDs found in text */
  total_cited: number;

  /** Errors found during validation */
  errors: CitationValidationError[];

  /** Warnings (non-blocking issues) */
  warnings: CitationValidationWarning[];
}

/**
 * Citation validation error (blocks publishing)
 */
export interface CitationValidationError {
  /** Error type */
  type:
    | 'missing_citation' // Citation ID in text but not in database
    | 'invalid_format' // Citation marker malformed
    | 'missing_required_field' // Citation missing required field
    | 'invalid_research_id'; // research_id doesn't resolve

  /** Error message */
  message: string;

  /** Location in text (if applicable) */
  location?: {
    text: string;
    position: number;
  };

  /** Citation ID involved */
  citation_id?: string;
}

/**
 * Citation validation warning (non-blocking)
 */
export interface CitationValidationWarning {
  /** Warning type */
  type:
    | 'unused_citation' // Citation in database but not used in text
    | 'duplicate_citation' // Same citation used multiple times (OK but notable)
    | 'missing_metadata'; // Optional field missing (e.g., publication date)

  /** Warning message */
  message: string;

  /** Citation ID involved */
  citation_id?: string;
}

// ============================================================================
// UI-READY FORMATTING
// ============================================================================

/**
 * UI-ready citation for tooltip rendering
 * Frontend-optimized format with all content ready to display
 */
export interface UIReadyCitation {
  /** Citation ID */
  id: string;

  /** Tooltip content structure */
  tooltip: {
    /** Main title (e.g., "Dean Richard Shaw") */
    title: string;

    /** Subtitle (e.g., "Dean of Admission, Stanford") */
    subtitle: string;

    /** Main content (quote, flag description, value definition) */
    content: string;

    /** Context/explanation */
    context: string;

    /** Why this matters (relevance to claim) */
    relevance: string;

    /** Optional footer (e.g., "Score impact: Caps at 69") */
    footer?: string;
  };

  /** Visual styling hints - HOLISTIC 3-TYPE SYSTEM */
  styling: {
    /** Citation type (determines styling treatment) */
    type: CitationType;

    /** Inline styling approach */
    inline_style: 'red_highlight' | 'green_underline' | 'none';

    /** Background color (for red_highlight) */
    background_color?: string;

    /** Underline color (for green_underline) */
    underline_color?: string;

    /** Box indicator color (always shown in citation box) */
    box_indicator_color: string;

    /** Icon hint (emoji or icon name) */
    icon_hint: string;

    // Type-specific styling data
    /** Severity (for problem type) */
    severity?: CitationSeverity;

    /** Strength type (for strength type) */
    strength_type?: StrengthType;

    /** Pattern strength (for strength type with pattern) */
    pattern_strength?: 'exceptional' | 'strong' | 'positive';
  };

  /** Accessibility */
  accessibility: {
    /** ARIA label for screen readers */
    aria_label: string;

    /** Full text description (for screen readers) */
    description: string;
  };
}

/**
 * UI-ready text with parsed spans and citations
 * Complete structure ready for frontend rendering
 */
export interface UIReadyText {
  /** Original text with citation markers */
  original: TextWithCitations;

  /** Plain text (markers removed) */
  plain_text: string;

  /** Parsed spans with UI-ready citations */
  spans: Array<{
    /** Text content */
    text: string;

    /** Citation ID (if cited) */
    citation_id: string | null;

    /** Full UI-ready citation (if cited) */
    citation?: UIReadyCitation;

    /** Position information */
    start_pos: number;
    end_pos: number;
  }>;
}

// ============================================================================
// TEACHING OUTPUT WITH CITATIONS
// ============================================================================

/**
 * Enhanced suggestion with citation support
 * Extends the base Suggestion interface from batchGenerationService
 */
export interface SuggestionWithCitations {
  // ---- Original Suggestion fields ----
  text: string; // Plain text (no citations)
  rationale: string; // Plain rationale (no citations)
  what_changed: string[];
  voice_preservation: string;
  score_impact: {
    dimension: string;
    before: number;
    after: number;
    increase: number;
  };

  // ---- NEW: Citation fields ----

  /** Text with embedded citation markers */
  text_with_citations: TextWithCitations;

  /** Rationale with embedded citation markers */
  rationale_with_citations: TextWithCitations;

  /** Citation database for this suggestion */
  citations: CitationDatabase;

  // ---- Type-specific fields ----
  type: 'polished_original' | 'voice_amplifier';

  // Polished-specific
  safety_level?: 'very_safe' | 'safe' | 'moderate_risk';

  // Voice amplifier-specific
  risk_level?: 'low' | 'medium' | 'high';
  why_authentic?: string;
  spark_moments?: string[];

  /** When to use this suggestion */
  when_to_use: string;
}

/**
 * Teaching layer with citations
 */
export interface TeachingLayerWithCitations {
  /** Concept review text */
  concept_review: string;
  concept_review_with_citations?: TextWithCitations;

  /** Why this matters */
  why_this_matters: string;
  why_this_matters_with_citations?: TextWithCitations;

  /** How to choose between suggestions */
  how_to_choose: {
    polished_when: string;
    voice_when: string;
    can_combine: string;
  };

  /** Socratic prompts */
  socratic_prompts: string[];

  /** Citations for teaching layer */
  citations?: CitationDatabase;
}

/**
 * Complete issue teaching with citations
 */
export interface IssueSurgicalTeachingWithCitations {
  issue_number: number;
  issue_quote: string;
  diagnosis_summary: string;

  /** Both suggestions with citations */
  suggestions: {
    polished_original: SuggestionWithCitations;
    voice_amplifier: SuggestionWithCitations;
  };

  /** Teaching layer with citations */
  teaching: TeachingLayerWithCitations;
}

/**
 * Overall strategy with citations
 */
export interface OverallStrategyWithCitations {
  cohesive_approach: string;
  cohesive_approach_with_citations?: TextWithCitations;

  voice_consistency: string;
  voice_consistency_with_citations?: TextWithCitations;

  priority_order: string;
  priority_order_with_citations?: TextWithCitations;

  implementation_tips: string[];

  /** Citations for overall strategy */
  citations?: CitationDatabase;
}

/**
 * Complete batch generation output with citations
 */
export interface BatchGenerationOutputWithCitations {
  /** All issues with citations */
  issues: IssueSurgicalTeachingWithCitations[];

  /** Overall strategy with citations */
  overall_strategy: OverallStrategyWithCitations;

  /** Citation quality metrics */
  citation_metrics: {
    total_citations: number;
    by_type: Record<CitationType, number>;
    coverage_percentage: number; // % of teaching text that's cited
    validation: CitationValidationResult;
  };

  /** Cost information */
  total_cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Citation creation options
 * Used when manually creating citations (testing, fallbacks)
 */
export interface CreateCitationOptions {
  type: CitationType;
  source: Partial<CitationSource>;
  evidence: any; // Type-specific evidence
  why_relevant: string;
  research_id: string;
}

/**
 * Citation enrichment options
 */
export interface EnrichmentOptions {
  /** College ID for research lookup */
  college_id: string;

  /** Prompt ID (if citation is prompt-specific) */
  prompt_id?: string;

  /** Whether to include related citations */
  include_related?: boolean;

  /** Whether to validate research_id exists */
  validate_research_id?: boolean;
}

/**
 * Citation parsing options
 */
export interface ParseOptions {
  /** Whether to validate citation IDs exist in database */
  validate?: boolean;

  /** Whether to throw on validation errors (vs. return errors) */
  throw_on_error?: boolean;

  /** Whether to include position information */
  include_positions?: boolean;
}
