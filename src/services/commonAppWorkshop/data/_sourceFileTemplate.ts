/**
 * [BATCH NAME] Deep Research Sources
 *
 * TEMPLATE FILE - Copy this file when creating new research source batches
 *
 * EXTRACTED FROM: Perplexity Deep Research on "[TOPIC]" (DATE)
 *
 * KEY CATEGORIES:
 * 1. [Category 1]
 * 2. [Category 2]
 * 3. [Category 3]
 *
 * INTEGRATION STEPS:
 * 1. Copy this template to a new file (e.g., intellectualDepthSources.ts)
 * 2. Replace [PLACEHOLDERS] with actual content
 * 3. Add sources following the EnhancedLabeledSource structure
 * 4. Export the combined array as ALL_[BATCH_NAME]_SOURCES
 * 5. Import and register in sourceRegistry.ts
 * 6. Update RESEARCH_BATCHES metadata in sourceRegistry.ts
 * 7. Run validation: npx tsx tests/test-source-integration-validation.ts
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// SECTION 1: [CATEGORY NAME] (e.g., ADMISSIONS OFFICER QUOTES)
// ============================================================================

export const [CATEGORY_1]_SOURCES: EnhancedLabeledSource[] = [
  // EXAMPLE SOURCE - Copy and modify this structure for each source
  {
    // === IDENTIFICATION ===
    source_id: '[batch_prefix]_[unique_id]',  // e.g., 'id_stanford_dean_2024'
    type: 'admissions_quote',  // or 'expert_guidance', 'research_study', 'literary_principle'
    title: '[Source Title]',
    author: '[Author Name]',
    author_title: '[Author Title/Role]',
    publication: '[Publication/Source Name]',
    date: '2024-01',  // YYYY-MM format

    // === CONTENT ===
    // Use EITHER quote OR finding, not both
    quote: "[Direct quote from the source]",
    // OR for research studies:
    // finding: "[Research finding or data point]",

    relevance_to_claim: '[Why this source matters for our guidance]',
    weight_in_calculation: 90,  // 0-100, higher = more authoritative
    last_verified: '2025-01-06',  // Date you verified the source
    verification_status: 'current',  // 'current', 'needs_update', 'archived'

    // === COLLEGE SPECIFICITY ===
    college_specificity: {
      primary_college: null,  // CollegeId or null for universal
      applicable_colleges: [],  // CollegeId[] - leave empty for universal
      exclusions: [],  // Colleges where this should NOT be used
    },

    // === ISSUE RELEVANCE (Pre-computed scores) ===
    issue_relevance: {
      // Map each relevant issue type to a score object
      // Score: 0-100, higher = more relevant
      // Aspect: 'problem' | 'solution' | 'principle' | 'example' | 'warning'
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['keyword1', 'keyword2'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['keyword3'] },
      // Add more issue types as relevant
    },

    // === TAXONOMY ===
    taxonomy: {
      primary_category: 'specificity',  // SourceCategory
      secondary_categories: ['showing_vs_telling', 'authenticity'],  // SourceCategory[]
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],  // TeachingMomentType[]
      essay_section_relevance: ['throughout'],  // EssaySectionType[]
    },

    // === USAGE GUIDANCE ===
    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],  // UsageContext[]
      tone: 'instructive',  // 'supportive' | 'challenging' | 'instructive' | 'inspiring'
      complexity: 'moderate',  // 'simple' | 'moderate' | 'advanced'
      student_facing: true,  // Safe to show directly to students?
    },

    // === V2: SCOPE CONFIGURATION ===
    scope: {
      level: 'universal',  // 'universal' | 'prompt_type' | 'college_specific' | 'prompt_specific'
      applies_to: {
        prompt_types: 'all',  // PromptType[] or 'all'
        colleges: 'all',  // CollegeId[] or 'all'
        issue_types: ['telling_not_showing', 'cliche_language'],  // ClicheSymptomType[] or 'all'
      },
      never_use_for: {
        // Optional: explicit exclusions
        // prompt_types: ['short_answer'],  // Don't use for very short essays
      },
      peer_applicable: true,  // Can be used for similar colleges?
      peer_weight_reduction: 0,  // 0-0.5, weight reduction for peer college use
    },

    // === V2: CONTEXT REQUIREMENTS (Optional) ===
    // context_requirements: {
    //   min_word_count: 250,  // Only use for essays >= 250 words
    //   max_word_count: 650,  // Only use for essays <= 650 words
    //   requires_narrative: true,  // Needs narrative structure
    //   requires_reflection: false,
    //   main_essay_only: false,
    //   supplemental_only: false,
    // },

    // === V2: AUTHORITY & ADVICE TYPE ===
    authority: 'primary',  // 'primary' | 'research' | 'expert' | 'pattern' | 'principle'
    advice_type: 'principle',  // 'technique' | 'principle' | 'warning' | 'example' | 'data' | 'structure'
  },
  // Add more sources...
];

// ============================================================================
// SECTION 2: [CATEGORY NAME]
// ============================================================================

export const [CATEGORY_2]_SOURCES: EnhancedLabeledSource[] = [
  // Add sources for this category...
];

// ============================================================================
// SECTION 3: [CATEGORY NAME]
// ============================================================================

export const [CATEGORY_3]_SOURCES: EnhancedLabeledSource[] = [
  // Add sources for this category...
];

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * All [Batch Name] sources combined
 * This is the primary export used by sourceRegistry.ts
 */
export const ALL_[BATCH_NAME]_SOURCES: EnhancedLabeledSource[] = [
  ...[CATEGORY_1]_SOURCES,
  ...[CATEGORY_2]_SOURCES,
  ...[CATEGORY_3]_SOURCES,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all [Batch Name] sources
 */
export function get[BatchName]Sources(): EnhancedLabeledSource[] {
  return ALL_[BATCH_NAME]_SOURCES;
}

/**
 * Get source statistics for this batch
 */
export function get[BatchName]Stats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {
    [category_1]: [CATEGORY_1]_SOURCES.length,
    [category_2]: [CATEGORY_2]_SOURCES.length,
    [category_3]: [CATEGORY_3]_SOURCES.length,
  };

  return {
    total: ALL_[BATCH_NAME]_SOURCES.length,
    byCategory,
  };
}

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================
/*
 * After creating your source file, complete these steps:
 *
 * [ ] 1. Replace all [PLACEHOLDERS] with actual content
 * [ ] 2. Add all sources following the structure above
 * [ ] 3. Verify source_id uniqueness (use batch prefix, e.g., 'id_' for intellectual depth)
 * [ ] 4. Update sourceRegistry.ts:
 *        - Add import statement
 *        - Add to ALL_ENHANCED_DEEP_RESEARCH_SOURCES array
 *        - Add case in getSourcesByBatch()
 *        - Update RESEARCH_BATCHES metadata
 * [ ] 5. Run type check: npx tsc --noEmit
 * [ ] 6. Run validation: npx tsx tests/test-source-integration-validation.ts
 * [ ] 7. Update documentation (DEEP_RESEARCH_INTEGRATION_MASTER_PLAN.md)
 */
