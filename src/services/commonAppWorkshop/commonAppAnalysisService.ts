/**
 * Common App Analysis Service
 *
 * Analyzes Common App supplemental essays with college-specific intelligence
 * Uses existing PIQ/extracurricular infrastructure with college research overlay
 */

import { getCollege, getSupplemental, getCollegeCoreValues } from '@/data/commonAppColleges';
import { getSupplementalTypeInfo } from '@/data/commonAppSupplementalTypes';
import type { SupplementalType } from '@/data/commonAppSupplementalTypes';

/**
 * Analyze Common App Supplemental Essay
 *
 * This is a MOCK implementation showing the API contract.
 * The actual implementation will call the backend API endpoint.
 */
export async function analyzeCommonAppEssay(params: {
  essay_text: string;
  college_id: string;
  supplemental_id: string;
  user_id: string;
  options?: {
    depth?: 'quick' | 'comprehensive';
    skip_coaching?: boolean;
    include_citations?: boolean;
  };
}) {
  const { essay_text, college_id, supplemental_id, user_id, options = {} } = params;

  // Get college and supplemental data
  const college = getCollege(college_id);
  const supplemental = getSupplemental(college_id, supplemental_id);
  const typeInfo = getSupplementalTypeInfo(supplemental?.type || 'why_us');

  if (!college || !supplemental) {
    throw new Error('Invalid college or supplemental ID');
  }

  // In production, this would call the backend API
  // For now, return type-safe mock structure
  const response = {
    success: true,

    // Standard NQI analysis (same as PIQ)
    analysis: {
      narrative_quality_index: 0, // Will be calculated by backend
      categories: [],              // Rubric dimensions
      weights: {},                 // Dimension weights
    },

    // Workshop items (problems + suggestions)
    workshopItems: [],

    // Voice/experience fingerprints
    voiceFingerprint: undefined,
    experienceFingerprint: undefined,

    // College-specific analysis (NEW)
    collegeSpecific: {
      college_id: college.id,
      college_name: college.name,

      // Core value alignment
      core_values_alignment: college.coreValues.map(value => ({
        value_id: value.id,
        value_name: value.name,
        weight: value.weight,
        current_score: 0,      // Calculated by backend
        target_score: 85,      // Target for this value
        gap: 0,                // Points needed
        how_to_improve: [],    // Specific actions
        evidence_present: [],  // What essay shows
        evidence_missing: [],  // What's lacking
        source_url: value.source_url,
      })),

      // Overall value alignment
      overall_value_alignment: 0,

      // Preference violations
      preference_violations: [],

      // Elite patterns
      elite_patterns_present: [],
      elite_patterns_missing: [],

      // Type-specific analysis
      type_specific: {
        type: supplemental.type,
        type_name: typeInfo.name,
        criteria_met: [],
        criteria_missing: [],
        pitfalls_present: [],
        pitfalls_avoided: [],
        type_alignment_score: 0,
      },
    },

    // Enhanced suggestions with college context
    enhancedSuggestions: [],

    // Citations (if enabled)
    citations: options.include_citations ? {} : undefined,
  };

  return response;
}

/**
 * Get essay status for all supplementals
 * Used for navigation status indicators
 */
export async function getEssayStatusMap(params: {
  user_id: string;
  college_ids: string[];
}): Promise<Record<string, 'empty' | 'draft' | 'complete'>> {
  // In production, this would query the database
  // For now, return empty map
  return {};
}

/**
 * Save essay to database
 */
export async function saveCommonAppEssay(params: {
  user_id: string;
  college_id: string;
  supplemental_id: string;
  essay_content: string;
  word_count: number;
  analysis_report_id?: string;
}) {
  // In production, this would save to Supabase
  // For now, return success
  return { success: true, essay_id: 'mock-id' };
}

/**
 * Load essay from database
 */
export async function loadCommonAppEssay(params: {
  user_id: string;
  college_id: string;
  supplemental_id: string;
}) {
  // In production, this would load from Supabase
  // For now, return null (no saved essay)
  return null;
}

/**
 * Mock data for development/testing
 */
export const MOCK_ANALYSIS_RESULT = {
  success: true,
  analysis: {
    narrative_quality_index: 75,
    categories: [
      {
        category: 'intellectual_depth',
        score: 18,
        maxScore: 25,
        comments: ['Shows some depth but could go deeper'],
      },
      // ... more categories
    ],
    weights: {
      intellectual_depth: 15,
      specificity: 12,
      authentic_voice: 10,
      // ... more weights
    },
  },
  workshopItems: [
    {
      id: 'item_1',
      quote: 'I learned Python in my computer science class.',
      problem: 'Classroom-bounded learning',
      why_it_matters: 'Stanford values self-directed exploration',
      suggestions: [
        {
          text: 'I built a web scraper analyzing Reddit discussions on mental health.',
          rationale: 'Shows self-directed project extending classroom learning.',
          type: 'polished_original' as const,
        },
      ],
      rubric_category: 'intellectual_depth',
    },
  ],
  collegeSpecific: {
    college_id: 'stanford',
    college_name: 'Stanford University',
    core_values_alignment: [
      {
        value_id: 'stanford_intellectual_vitality',
        value_name: 'Intellectual Vitality',
        weight: 40,
        current_score: 72,
        target_score: 85,
        gap: -13,
        how_to_improve: [
          'Show self-directed learning beyond classroom',
          'Include independent project or research',
          'Demonstrate genuine intellectual curiosity',
        ],
        evidence_present: ['Mentions learning Python'],
        evidence_missing: ['No independent exploration', 'No self-directed project'],
      },
      {
        value_id: 'stanford_impact',
        value_name: 'Impact & Leadership',
        weight: 25,
        current_score: 85,
        target_score: 85,
        gap: 0,
        how_to_improve: [],
        evidence_present: ['Shows community contribution'],
        evidence_missing: [],
      },
    ],
    overall_value_alignment: 76,
    preference_violations: [
      {
        violation_id: 'v1',
        category: 'red_flag' as const,
        severity: 'major' as const,
        what_violated: 'Classroom-bounded learning',
        where_in_essay: 'I learned Python in my computer science class',
        why_matters: 'Stanford values self-directed exploration beyond classroom',
        how_to_fix: 'Add independent project or self-directed learning example',
        source: 'Stanford Admission - What We Look For',
      },
    ],
    elite_patterns_present: [],
    elite_patterns_missing: [
      {
        pattern_id: 'p1',
        pattern_name: 'Self-Directed Project',
        description: 'Extending classroom learning into independent exploration',
        example_quote: 'After learning NLP in CS224N, I built a sentiment analyzer...',
        example_essay_id: 'STAN_IV_007',
        example_score: 92,
        how_to_apply: 'Take a classroom skill and apply it to a personal project',
        why_works: 'Demonstrates intellectual vitality (Stanford\'s top value at 40%)',
      },
    ],
    type_specific: {
      type: 'intellectual' as SupplementalType,
      type_name: 'Intellectual Curiosity',
      criteria_met: ['Mentions academic interest'],
      criteria_missing: [
        'Self-directed learning beyond classroom',
        'Genuine intellectual curiosity',
        'Connection to Stanford resources',
      ],
      pitfalls_present: ['Classroom learning only'],
      pitfalls_avoided: ['Generic love of learning'],
      type_alignment_score: 65,
    },
  },
};
