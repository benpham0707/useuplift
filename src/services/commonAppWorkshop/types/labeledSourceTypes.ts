/**
 * Labeled Source Types V2
 *
 * Defines the complete taxonomy for pre-labeled citation sources.
 * This enables efficient O(1) source lookup and intelligent source selection.
 *
 * Key Design Principles:
 * 1. Pre-compute relevance scores at build time, not runtime
 * 2. Enable college-specific prioritization with explicit labeling
 * 3. Support multi-source selection with diversity requirements
 * 4. Integrate seamlessly with existing ProvenanceSource format
 *
 * V2 Enhancements:
 * 5. 4-Layer Scope Hierarchy: Universal → Prompt-Type → College → Prompt-Specific
 * 6. Explicit applicability guards to prevent source misapplication
 * 7. Prompt-type awareness for type-specific advice
 * 8. Context requirements (word count, narrative presence, etc.)
 */

import type { ProvenanceSource } from './provenanceTypes';

// ============================================================================
// SOURCE CATEGORIES
// ============================================================================

/**
 * Primary topic categories for sources
 * Each source must have exactly one primary category
 */
export type SourceCategory =
  | 'authenticity'           // Voice, genuine expression, honest reflection
  | 'specificity'            // Concrete details, unique moments
  | 'cliche_avoidance'       // Avoiding overused phrases/structures
  | 'showing_vs_telling'     // Narrative technique
  | 'intellectual_vitality'  // Curiosity, learning for its own sake
  | 'vulnerability'          // Honest uncertainty, growth mindset
  | 'impact_on_others'       // Effect on community, leadership
  | 'collaboration'          // Teamwork, group problem-solving
  | 'intellectual_community' // Contributing to peer learning
  | 'fresh_perspective'      // Unique angles, original thinking
  | 'narrative_structure'    // Story arc, essay organization
  | 'opening_hooks';         // First impressions, hooks, opening techniques

/**
 * Types of teaching moments this source can support
 */
export type TeachingMomentType =
  | 'why_this_matters'       // Explains importance of a principle
  | 'how_to_fix'             // Provides actionable guidance
  | 'what_to_avoid'          // Warns against common mistakes
  | 'elite_example'          // Shows what success looks like
  | 'principle_explanation'  // Teaches underlying concept
  | 'before_after'           // Transformation demonstration
  | 'technique_explanation'  // How a specific technique works
  | 'why_this_fails'         // Detailed explanation of why something doesn't work
  | 'analysis'               // Deep analysis of specific example
  | 'evaluation_criteria'    // What AOs look for when evaluating
  | 'encouragement'          // Motivational context for students
  | 'data_support'           // Backs up claims with statistics/research
  | 'when_it_works';         // Explains when a technique is appropriate

/**
 * Essay sections where this source is most relevant
 */
export type EssaySectionType =
  | 'opening'      // Essay introduction
  | 'body'         // Middle paragraphs
  | 'conclusion'   // Essay ending
  | 'throughout';  // Applies to entire essay

/**
 * How the source should be used in feedback
 */
export type UsageContext =
  | 'explaining_problem'   // Why something is an issue
  | 'justifying_severity'  // Why this matters enough to fix
  | 'teaching_principle'   // Explaining the underlying concept
  | 'proving_weight'       // Backing up importance claims
  | 'showing_elite_pattern' // Demonstrating what works
  | 'motivating_student';  // Encouraging improvement

// ============================================================================
// COLLEGE MAPPING
// ============================================================================

/**
 * College IDs supported by the system
 */
export type CollegeId =
  | 'stanford'
  | 'harvard'
  | 'mit'
  | 'uchicago'
  | 'duke'
  | 'yale'
  | 'princeton'
  | 'columbia'
  | 'penn'
  | 'brown'
  | 'dartmouth'
  | 'cornell'
  | 'caltech'
  | 'northwestern'
  | 'johns_hopkins'
  | 'uva'
  | 'tulane'
  | 'harvey_mudd'
  | 'gmu';

/**
 * College specificity configuration for a source
 */
export interface CollegeSpecificity {
  /** The college this source is primarily from (null for general sources) */
  primary_college: CollegeId | null;

  /** All colleges where this source is relevant */
  applicable_colleges: CollegeId[];

  /** Colleges where this source should NOT be used */
  exclusions: CollegeId[];
}

/**
 * Peer institution relationships for fallback matching
 */
export const COLLEGE_PEER_INSTITUTIONS: Record<CollegeId, CollegeId[]> = {
  stanford: ['mit', 'harvard', 'caltech'],
  harvard: ['yale', 'princeton', 'stanford'],
  mit: ['caltech', 'stanford', 'cornell'],
  uchicago: ['columbia', 'yale', 'northwestern'],
  duke: ['northwestern', 'penn', 'brown'],
  yale: ['harvard', 'princeton', 'columbia'],
  princeton: ['harvard', 'yale', 'stanford'],
  columbia: ['uchicago', 'yale', 'penn'],
  penn: ['duke', 'northwestern', 'cornell'],
  brown: ['dartmouth', 'duke', 'penn'],
  dartmouth: ['brown', 'cornell', 'penn'],
  cornell: ['penn', 'dartmouth', 'mit'],
  caltech: ['mit', 'stanford', 'cornell'],
  northwestern: ['duke', 'uchicago', 'penn'],
  johns_hopkins: ['cornell', 'northwestern', 'duke'],
  uva: ['duke', 'northwestern', 'penn'],
  tulane: ['uva', 'gmu', 'duke'],
  harvey_mudd: ['caltech', 'mit', 'stanford'],
  gmu: ['uva', 'tulane', 'johns_hopkins'],
};

/**
 * Values that each college emphasizes (for matching general sources)
 */
export const COLLEGE_VALUES: Record<CollegeId, SourceCategory[]> = {
  stanford: ['intellectual_vitality', 'authenticity', 'fresh_perspective'],
  harvard: ['impact_on_others', 'vulnerability', 'authenticity'],
  mit: ['collaboration', 'intellectual_vitality', 'specificity'],
  uchicago: ['intellectual_community', 'fresh_perspective', 'vulnerability'],
  duke: ['authenticity', 'specificity', 'impact_on_others'],
  yale: ['authenticity', 'intellectual_community', 'vulnerability'],
  princeton: ['intellectual_vitality', 'authenticity', 'specificity'],
  columbia: ['intellectual_community', 'fresh_perspective', 'specificity'],
  penn: ['collaboration', 'impact_on_others', 'specificity'],
  brown: ['authenticity', 'fresh_perspective', 'vulnerability'],
  dartmouth: ['collaboration', 'authenticity', 'impact_on_others'],
  cornell: ['specificity', 'intellectual_vitality', 'collaboration'],
  caltech: ['intellectual_vitality', 'collaboration', 'specificity'],
  northwestern: ['collaboration', 'impact_on_others', 'specificity'],
  johns_hopkins: ['intellectual_vitality', 'specificity', 'collaboration'],
  uva: ['authenticity', 'specificity', 'showing_vs_telling'],
  tulane: ['cliche_avoidance', 'specificity', 'authenticity'],
  harvey_mudd: ['fresh_perspective', 'vulnerability', 'collaboration'],
  gmu: ['showing_vs_telling', 'authenticity', 'specificity'],
};

// ============================================================================
// ISSUE TYPE RELEVANCE
// ============================================================================

/**
 * Symptom/issue types that sources can address
 */
export type ClicheSymptomType =
  | 'cliche_metaphor'
  | 'telling_not_showing'
  | 'cliche_topic_framing'
  | 'cliche_narrative_arc'
  | 'cliche_ai_convergence'
  | 'cliche_essay_formula'
  | 'cliche_college_specific'
  | 'cliche_value_signaling'
  | 'cliche_inspirational'
  | 'cliche_language';

/**
 * Pre-computed relevance score for an issue type
 */
export interface IssueRelevanceScore {
  /** Relevance score 0-100 */
  score: number;

  /** What aspect of the issue this source addresses */
  aspect: 'problem' | 'solution' | 'principle' | 'example';

  /** Keywords that triggered this match (for debugging) */
  keywords_matched: string[];
}

/**
 * Complete issue relevance mapping for a source
 */
export type IssueRelevanceMap = Partial<Record<ClicheSymptomType, IssueRelevanceScore>>;

// ============================================================================
// LABELED SOURCE TYPE
// ============================================================================

/**
 * Source taxonomy for categorization
 */
export interface SourceTaxonomy {
  /** Primary topic category */
  primary_category: SourceCategory;

  /** Additional relevant categories */
  secondary_categories: SourceCategory[];

  /** Teaching moments this source supports */
  teaching_moment_types: TeachingMomentType[];

  /** Essay sections where this applies */
  essay_section_relevance: EssaySectionType[];
}

/**
 * Usage configuration for a source
 */
export interface SourceUsage {
  /** Best contexts for using this source */
  best_for: UsageContext[];

  /** Tone of the quote */
  tone: 'supportive' | 'challenging' | 'instructive' | 'inspiring';

  /** Complexity level for student understanding */
  complexity: 'simple' | 'moderate' | 'advanced';

  /** Whether this is appropriate to show directly to students */
  student_facing: boolean;
}

/**
 * Complete labeled source with all taxonomy data
 * Extends ProvenanceSource with pre-computed relevance
 */
export interface LabeledSource extends ProvenanceSource {
  // ---- College Specificity ----
  college_specificity: CollegeSpecificity;

  // ---- Issue Relevance (pre-computed) ----
  issue_relevance: IssueRelevanceMap;

  // ---- Content Taxonomy ----
  taxonomy: SourceTaxonomy;

  // ---- Usage Context ----
  usage: SourceUsage;
}

// ============================================================================
// SOURCE BUNDLE (Multi-Source Output)
// ============================================================================

/**
 * A bundle of sources for a single issue/context
 */
export interface SourceBundle {
  /** The most relevant source */
  primary: LabeledSource;

  /** 1-3 additional relevant sources */
  supporting: LabeledSource[];

  /** College-specific source (if available) */
  college_specific: LabeledSource | null;

  /** General principle source (if needed) */
  general_principle: LabeledSource | null;

  /** Formatted versions for different display contexts */
  formatted: {
    /** For embedding inline in feedback text */
    inline: string;

    /** For hover/tooltip display */
    tooltip: string;

    /** For expanded detail view */
    full: string;
  };

  /** Metadata about selection */
  metadata: {
    total_candidates: number;
    selection_criteria: string[];
    diversity_score: number; // 0-100, higher = more diverse authors/institutions
  };
}

// ============================================================================
// SELECTION OPTIONS
// ============================================================================

/**
 * Options for source selection
 */
export interface SourceSelectionOptions {
  /** Maximum total sources to return */
  max_sources?: number;

  /** Minimum relevance score threshold */
  min_relevance_score?: number;

  /** Require diversity in authors */
  require_author_diversity?: boolean;

  /** Require diversity in institutions */
  require_institution_diversity?: boolean;

  /** Maximum sources from same author */
  max_same_author?: number;

  /** Prefer college-specific sources */
  prioritize_college_specific?: boolean;

  /** Teaching moment context */
  teaching_moment?: TeachingMomentType;

  /** Tone preference */
  preferred_tone?: SourceUsage['tone'];
}

/**
 * Default selection options
 */
export const DEFAULT_SELECTION_OPTIONS: Required<SourceSelectionOptions> = {
  max_sources: 5,
  min_relevance_score: 40,
  require_author_diversity: true,
  require_institution_diversity: true,
  max_same_author: 2,
  prioritize_college_specific: true,
  teaching_moment: 'why_this_matters',
  preferred_tone: 'supportive',
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that a LabeledSource is complete
 */
export function validateLabeledSource(source: LabeledSource): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required ProvenanceSource fields
  if (!source.source_id) errors.push('Missing source_id');
  if (!source.type) errors.push('Missing type');
  if (!source.quote && !source.finding) errors.push('Missing quote or finding');

  // Check college specificity
  if (!source.college_specificity) {
    errors.push('Missing college_specificity');
  } else {
    if (!Array.isArray(source.college_specificity.applicable_colleges)) {
      errors.push('college_specificity.applicable_colleges must be an array');
    }
  }

  // Check issue relevance
  if (!source.issue_relevance || Object.keys(source.issue_relevance).length === 0) {
    errors.push('Missing or empty issue_relevance');
  }

  // Check taxonomy
  if (!source.taxonomy) {
    errors.push('Missing taxonomy');
  } else {
    if (!source.taxonomy.primary_category) errors.push('Missing taxonomy.primary_category');
    if (!Array.isArray(source.taxonomy.secondary_categories)) {
      errors.push('taxonomy.secondary_categories must be an array');
    }
    if (!Array.isArray(source.taxonomy.teaching_moment_types)) {
      errors.push('taxonomy.teaching_moment_types must be an array');
    }
  }

  // Check usage
  if (!source.usage) {
    errors.push('Missing usage');
  } else {
    if (!Array.isArray(source.usage.best_for)) errors.push('usage.best_for must be an array');
    if (!source.usage.tone) errors.push('Missing usage.tone');
    if (!source.usage.complexity) errors.push('Missing usage.complexity');
    if (typeof source.usage.student_facing !== 'boolean') {
      errors.push('usage.student_facing must be a boolean');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all sources in a collection
 */
export function validateSourceCollection(sources: LabeledSource[]): {
  valid: boolean;
  total: number;
  passed: number;
  failed: { source_id: string; errors: string[] }[];
} {
  const results = sources.map(s => ({
    source_id: s.source_id,
    ...validateLabeledSource(s),
  }));

  const failed = results.filter(r => !r.valid);

  return {
    valid: failed.length === 0,
    total: sources.length,
    passed: sources.length - failed.length,
    failed: failed.map(f => ({ source_id: f.source_id, errors: f.errors })),
  };
}

// ============================================================================
// V2: PROMPT TYPE SYSTEM
// ============================================================================

/**
 * Essay prompt types for type-specific source matching
 * These distinguish different kinds of essays that need different advice
 */
export type PromptType =
  // Common App Main Essay Types (650 words)
  | 'personal_statement'      // General identity/values essay
  | 'background_identity'     // Background, identity, interest, talent
  | 'challenge_setback'       // Obstacle, failure, setback overcome
  | 'belief_challenged'       // Belief or idea questioned
  | 'problem_solved'          // Problem solved, accomplishment
  | 'personal_growth'         // Transition, realization, maturity, gratitude
  | 'topic_of_choice'         // Open topic chosen by applicant

  // Supplemental Essay Types
  | 'why_this_college'        // "Why X" essays (150-650 words)
  | 'why_this_major'          // Major/academic interest explanation
  | 'community_contribution'  // What you'll bring/contribute
  | 'activity_elaboration'    // Expand on an activity (150-350 words)
  | 'short_answer'            // Brief responses (50-150 words)
  | 'creative_prompt'         // Quirky/unusual prompts (UChicago, etc.)
  | 'additional_info'         // Optional context section
  | 'letter_to_roommate'      // Personality/casual tone essays
  | 'intellectual_curiosity'  // Academic passion essays
  | 'diversity_perspective'   // Identity/perspective essays
  | 'extracurricular_impact'; // Leadership/impact in activities

// ============================================================================
// V2: SOURCE SCOPE SYSTEM
// ============================================================================

/**
 * The scope level of a source determines where it can be applied
 *
 * HIERARCHY (most general to most specific):
 * 1. universal - Applies to ALL essays (foundational writing principles)
 * 2. prompt_type - Applies to a category of essays (e.g., all "Why X" essays)
 * 3. college_specific - Applies to a specific college (e.g., Stanford advice)
 * 4. prompt_specific - Applies to ONE specific prompt (e.g., Stanford's roommate letter)
 *
 * CRITICAL RULE: More specific sources take precedence, but universal
 * sources are ALWAYS safe to use as fallback
 */
export type SourceScope =
  | 'universal'        // Safe for ALL essays
  | 'prompt_type'      // Safe for essays of this TYPE
  | 'college_specific' // Safe for essays to this COLLEGE
  | 'prompt_specific'; // ONLY for this exact prompt

/**
 * Source authority level (affects weighting)
 */
export type SourceAuthority =
  | 'primary'      // Dean quote, official admissions (weight: 1.0)
  | 'research'     // Published study, data analysis (weight: 0.9)
  | 'expert'       // Admissions consultant, former AO (weight: 0.85)
  | 'pattern'      // Internal analysis of successful essays (weight: 0.8)
  | 'principle';   // Established writing/narrative principle (weight: 0.75)

/**
 * What type of advice this source provides
 */
export type AdviceType =
  | 'technique'     // HOW to do something
  | 'principle'     // WHY something matters
  | 'warning'       // What to AVOID
  | 'example'       // What success looks like
  | 'data'          // Statistical finding
  | 'structure';    // Organization/format advice

// ============================================================================
// V2: ENHANCED SCOPE METADATA
// ============================================================================

/**
 * Complete scope configuration for a source
 * This determines EXACTLY where a source can and cannot be used
 */
export interface SourceScopeConfig {
  /** The scope level (universal, prompt_type, college_specific, prompt_specific) */
  level: SourceScope;

  /**
   * EXPLICIT APPLICABILITY
   * What this source CAN be used for
   */
  applies_to: {
    /** Which prompt types (or 'all' for universal) */
    prompt_types: PromptType[] | 'all';

    /** Which colleges (or 'all' for universal) */
    colleges: CollegeId[] | 'all';

    /** Which issue types this addresses */
    issue_types: ClicheSymptomType[] | 'all';
  };

  /**
   * SAFETY GUARDS
   * What this source should NEVER be used for
   * This prevents misapplication of specific advice
   */
  never_use_for?: {
    /** Prompt types where this advice is inappropriate */
    prompt_types?: PromptType[];

    /** Colleges where this advice doesn't apply */
    colleges?: CollegeId[];

    /** Issue types this doesn't address */
    issue_types?: ClicheSymptomType[];

    /** Other contexts to avoid (freeform for flexibility) */
    contexts?: string[];
  };

  /**
   * PEER APPLICABILITY
   * Whether this source can be used for similar colleges
   */
  peer_applicable?: boolean;

  /**
   * Weight reduction when used for peer colleges (0-50%)
   * e.g., Stanford advice used for MIT gets 10% weight reduction
   */
  peer_weight_reduction?: number;
}

/**
 * Context requirements for source applicability
 * Source won't be selected if context doesn't match
 */
export interface SourceContextRequirements {
  /** Only use for essays >= this word count */
  min_word_count?: number;

  /** Only use for essays <= this word count */
  max_word_count?: number;

  /** Only use if essay has narrative structure */
  requires_narrative?: boolean;

  /** Only use if essay has reflection component */
  requires_reflection?: boolean;

  /** Only use for main essay (not supplements) */
  main_essay_only?: boolean;

  /** Only use for supplemental essays */
  supplemental_only?: boolean;
}

// ============================================================================
// V2: ENHANCED LABELED SOURCE
// ============================================================================

/**
 * V2 Enhanced Labeled Source with scope awareness
 * Extends base LabeledSource with applicability metadata
 */
export interface EnhancedLabeledSource extends LabeledSource {
  /**
   * V2: Scope configuration
   * Determines exactly where this source can be used
   */
  scope: SourceScopeConfig;

  /**
   * V2: Context requirements
   * Additional constraints on when to use this source
   */
  context_requirements?: SourceContextRequirements;

  /**
   * V2: Authority level
   * Affects weighting in selection
   */
  authority: SourceAuthority;

  /**
   * V2: Advice type classification
   * What kind of guidance this provides
   */
  advice_type: AdviceType;
}

// ============================================================================
// V2: SOURCE ROUTING CONTEXT
// ============================================================================

/**
 * Complete context for source routing
 * This is what we know when selecting sources
 */
export interface SourceRoutingContext {
  /** What type of essay */
  prompt_type: PromptType;

  /** Which college */
  college_id: CollegeId;

  /** Specific prompt identifier (if known) */
  prompt_id?: string;

  /** What issue we're addressing */
  issue_type: ClicheSymptomType;

  /** Essay word limit */
  word_limit: number;

  /** Does essay have narrative structure? */
  has_narrative: boolean;

  /** Does essay have reflection? */
  has_reflection: boolean;

  /** Is this the main essay or supplement? */
  is_main_essay: boolean;

  /** Teaching moment type needed */
  teaching_moment?: TeachingMomentType;

  /** Preferred tone */
  preferred_tone?: SourceUsage['tone'];
}

// ============================================================================
// V2: SOURCE VALIDATION RESULT
// ============================================================================

/**
 * Result of validating a source for a specific context
 */
export interface SourceValidationResult {
  /** Whether source is valid for this context */
  valid: boolean;

  /** If invalid, why */
  reason?: string;

  /** Warning (valid but not ideal) */
  warning?: string;

  /** Weight adjustment (1.0 = full weight, 0.5 = half weight) */
  weight_adjustment: number;
}

/**
 * Validate an enhanced source for a routing context
 */
export function validateSourceForContext(
  source: EnhancedLabeledSource,
  context: SourceRoutingContext
): SourceValidationResult {
  // Check explicit exclusions (CRITICAL - these are hard blocks)
  if (source.scope.never_use_for) {
    if (source.scope.never_use_for.prompt_types?.includes(context.prompt_type)) {
      return {
        valid: false,
        reason: `Source explicitly excluded for ${context.prompt_type} essays`,
        weight_adjustment: 0,
      };
    }

    if (source.scope.never_use_for.colleges?.includes(context.college_id)) {
      return {
        valid: false,
        reason: `Source explicitly excluded for ${context.college_id}`,
        weight_adjustment: 0,
      };
    }

    if (source.scope.never_use_for.issue_types?.includes(context.issue_type)) {
      return {
        valid: false,
        reason: `Source does not address ${context.issue_type}`,
        weight_adjustment: 0,
      };
    }
  }

  // Check positive applicability
  const appliesToPromptType = source.scope.applies_to.prompt_types === 'all' ||
    source.scope.applies_to.prompt_types.includes(context.prompt_type);

  const appliesToCollege = source.scope.applies_to.colleges === 'all' ||
    source.scope.applies_to.colleges.includes(context.college_id);

  const appliesToIssue = source.scope.applies_to.issue_types === 'all' ||
    source.scope.applies_to.issue_types.includes(context.issue_type);

  if (!appliesToPromptType) {
    return {
      valid: false,
      reason: `Source not applicable to ${context.prompt_type} essays`,
      weight_adjustment: 0,
    };
  }

  if (!appliesToCollege) {
    // Check if peer applicable
    if (source.scope.peer_applicable) {
      const peers = COLLEGE_PEER_INSTITUTIONS[context.college_id] || [];
      const sourceColleges = source.scope.applies_to.colleges;
      const isPeerMatch = sourceColleges !== 'all' &&
        sourceColleges.some(c => peers.includes(c));

      if (isPeerMatch) {
        return {
          valid: true,
          warning: `Using peer institution source (weight reduced)`,
          weight_adjustment: 1 - (source.scope.peer_weight_reduction || 0.1),
        };
      }
    }

    return {
      valid: false,
      reason: `Source not applicable to ${context.college_id}`,
      weight_adjustment: 0,
    };
  }

  if (!appliesToIssue) {
    return {
      valid: false,
      reason: `Source does not address ${context.issue_type}`,
      weight_adjustment: 0,
    };
  }

  // Check context requirements
  if (source.context_requirements) {
    const reqs = source.context_requirements;

    if (reqs.min_word_count && context.word_limit < reqs.min_word_count) {
      return {
        valid: false,
        reason: `Source requires essay >= ${reqs.min_word_count} words`,
        weight_adjustment: 0,
      };
    }

    if (reqs.max_word_count && context.word_limit > reqs.max_word_count) {
      return {
        valid: false,
        reason: `Source only for essays <= ${reqs.max_word_count} words`,
        weight_adjustment: 0,
      };
    }

    if (reqs.requires_narrative && !context.has_narrative) {
      return {
        valid: false,
        reason: 'Source requires narrative essay structure',
        weight_adjustment: 0,
      };
    }

    if (reqs.requires_reflection && !context.has_reflection) {
      return {
        valid: false,
        reason: 'Source requires reflective essay component',
        weight_adjustment: 0,
      };
    }

    if (reqs.main_essay_only && !context.is_main_essay) {
      return {
        valid: false,
        reason: 'Source only for main essay, not supplements',
        weight_adjustment: 0,
      };
    }

    if (reqs.supplemental_only && context.is_main_essay) {
      return {
        valid: false,
        reason: 'Source only for supplemental essays',
        weight_adjustment: 0,
      };
    }
  }

  // All checks passed
  return {
    valid: true,
    weight_adjustment: 1.0,
  };
}

// ============================================================================
// V2: SCOPE LEVEL WEIGHTS
// ============================================================================

/**
 * Base weights for different scope levels
 * More specific = higher weight when applicable
 */
export const SCOPE_LEVEL_WEIGHTS: Record<SourceScope, number> = {
  prompt_specific: 1.0,    // Most specific - full weight
  college_specific: 0.95,  // Very relevant
  prompt_type: 0.85,       // Type-relevant
  universal: 0.75,         // Foundation, always valid
};

/**
 * Authority level weights (multiplied with scope weight)
 */
export const AUTHORITY_WEIGHTS: Record<SourceAuthority, number> = {
  primary: 1.0,     // Dean quote
  research: 0.95,   // Published study
  expert: 0.9,      // Admissions consultant
  pattern: 0.85,    // Internal analysis
  principle: 0.8,   // Writing principle
};
