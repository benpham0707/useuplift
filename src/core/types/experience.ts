/**
 * Core type definitions for Extracurricular Experience Analysis System
 * Aligned with existing frontend types but extended for backend analysis
 */

import { z } from "zod";

// ============================================================================
// EXPERIENCE ENTRY SCHEMAS
// ============================================================================

export const ExperienceEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),

  // Core content
  title: z.string().min(1, "Title is required").max(100),
  organization: z.string().optional(),
  role: z.string().optional(),
  description_original: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(700, "Description must be at most 700 characters"),

  // Time commitment
  time_span: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  hours_per_week: z.number().min(0).max(168).optional(),
  weeks_per_year: z.number().min(0).max(52).optional(),

  // Categorization
  category: z.enum([
    'leadership',
    'service',
    'research',
    'athletics',
    'arts',
    'academic',
    'work'
  ]),
  tags: z.array(z.string()).default([]),

  // Context (privacy-sensitive)
  constraints_context: z.string().optional(),

  // Versioning
  version: z.number().int().default(1),
});

export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;

// ============================================================================
// RUBRIC CATEGORY SCHEMAS
// ============================================================================

export const RubricCategoryScoreSchema = z.object({
  name: z.string(),
  score_0_to_10: z.number().min(0).max(10),
  evidence_snippets: z.array(z.string()),
  evaluator_notes: z.string(),
  confidence: z.number().min(0).max(1).optional(), // 0-1 confidence score
});

export type RubricCategoryScore = z.infer<typeof RubricCategoryScoreSchema>;

// All 11 rubric categories
export const RUBRIC_CATEGORIES = [
  'voice_integrity',
  'specificity_evidence',
  'transformative_impact',
  'role_clarity_ownership',
  'narrative_arc_stakes',
  'initiative_leadership',
  'community_collaboration',
  'reflection_meaning',
  'craft_language_quality',
  'fit_trajectory',
  'time_investment_consistency'
] as const;

export type RubricCategory = typeof RUBRIC_CATEGORIES[number];

// ============================================================================
// ANALYSIS REPORT SCHEMAS
// ============================================================================

export const ReaderImpressionLabel = z.enum([
  'captivating_grounded',      // 90-100
  'strong_distinct_voice',     // 80-89
  'solid_needs_polish',        // 70-79
  'patchy_narrative',          // 60-69
  'generic_unclear',           // <60
]);

export const AnalysisReportSchema = z.object({
  id: z.string().uuid().optional(),
  entry_id: z.string().uuid(),
  rubric_version: z.string(),
  created_at: z.string().datetime().optional(),

  // Category scores
  categories: z.array(RubricCategoryScoreSchema),
  weights: z.record(z.string(), z.number()),

  // Overall metrics
  narrative_quality_index: z.number().min(0).max(100),
  reader_impression_label: ReaderImpressionLabel,

  // Diagnostics
  flags: z.array(z.string()),
  suggested_fixes_ranked: z.array(z.string()),

  // Metadata
  analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional(),
  token_usage: z.object({
    input: z.number(),
    output: z.number(),
    cached: z.number().optional(),
  }).optional(),
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

// ============================================================================
// COACHING PLAN SCHEMAS
// ============================================================================

export const MicroEditSchema = z.object({
  original: z.string(),
  replacement: z.string(),
  rationale: z.string(),
  category_impact: z.array(z.string()).optional(), // which categories this improves
});

export const RewriteOptionSchema = z.object({
  style: z.enum(['concise_operator', 'warm_reflective', 'action_arc']),
  text: z.string().max(700),
  explanation: z.string(),
  estimated_nqi_gain: z.number().optional(),
});

export const CoachingPlanSchema = z.object({
  id: z.string().uuid().optional(),
  entry_id: z.string().uuid(),
  analysis_report_id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),

  goal_statement: z.string(),

  // Edits & rewrites
  micro_edits: z.array(MicroEditSchema),
  rewrite_options: z.array(RewriteOptionSchema),

  // Elicitation prompts
  specificity_prompts: z.array(z.string()),
  reflection_prompts: z.array(z.string()),
  arc_prompts: z.array(z.string()),
  fit_prompts: z.array(z.string()),

  // Guardrails
  style_warnings: z.array(z.string()),
  word_budget_guidance: z.string(),

  // Metadata
  coaching_depth: z.enum(['quick', 'standard', 'comprehensive']).optional(),
  token_usage: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
});

export type CoachingPlan = z.infer<typeof CoachingPlanSchema>;
export type MicroEdit = z.infer<typeof MicroEditSchema>;
export type RewriteOption = z.infer<typeof RewriteOptionSchema>;

// ============================================================================
// FEATURE EXTRACTION SCHEMAS
// ============================================================================

export const ExtractedFeaturesSchema = z.object({
  entry_id: z.string().uuid(),

  // Voice markers
  voice: z.object({
    passive_verb_count: z.number(),
    active_verb_count: z.number(),
    passive_ratio: z.number(),
    buzzword_count: z.number(),
    buzzwords_found: z.array(z.string()),
    sentence_variety_score: z.number().min(0).max(10),
    first_person_count: z.number(),
    avg_sentence_length: z.number(),
  }),

  // Evidence markers
  evidence: z.object({
    has_concrete_numbers: z.boolean(),
    number_count: z.number(),
    numbers_found: z.array(z.string()),
    outcome_statements: z.array(z.string()),
    before_after_comparison: z.boolean(),
    metric_specificity_score: z.number().min(0).max(10),
  }),

  // Arc markers
  arc: z.object({
    has_stakes: z.boolean(),
    stakes_indicators: z.array(z.string()),
    has_turning_point: z.boolean(),
    turning_point_phrases: z.array(z.string()),
    temporal_markers: z.array(z.string()),
    narrative_structure_score: z.number().min(0).max(10),
  }),

  // Collaboration markers
  collaboration: z.object({
    we_usage_count: z.number(),
    credit_given: z.boolean(),
    named_partners: z.array(z.string()),
    collaboration_verbs: z.array(z.string()),
    team_orientation_score: z.number().min(0).max(10),
  }),

  // Reflection markers
  reflection: z.object({
    insight_depth_score: z.number().min(0).max(10),
    learning_statements: z.array(z.string()),
    belief_shift_indicators: z.array(z.string()),
    transferable_learning: z.boolean(),
    reflection_quality: z.enum(['none', 'superficial', 'moderate', 'deep']),
  }),

  // Overall
  word_count: z.number(),
  character_count: z.number(),
  extraction_timestamp: z.string().datetime().optional(),
});

export type ExtractedFeatures = z.infer<typeof ExtractedFeaturesSchema>;

// ============================================================================
// NQI SIMULATION SCHEMAS
// ============================================================================

export const NQISimulationSchema = z.object({
  current_nqi: z.number().min(0).max(100),
  simulations: z.array(z.object({
    lever: z.string(), // category name
    improvement: z.string(), // e.g., "+2 points"
    projected_nqi: z.number().min(0).max(100),
    gain: z.number(),
    effort_estimate: z.enum(['low', 'medium', 'high']).optional(),
  })),
});

export type NQISimulation = z.infer<typeof NQISimulationSchema>;

// ============================================================================
// ANALYSIS OPTIONS
// ============================================================================

export const AnalysisOptionsSchema = z.object({
  depth: z.enum(['quick', 'standard', 'comprehensive']).default('standard'),
  focus_areas: z.array(z.enum(RUBRIC_CATEGORIES)).optional(),
  skip_coaching: z.boolean().default(false),
  coaching_style_preference: z.enum(['concise_operator', 'warm_reflective', 'action_arc']).optional(),
});

export type AnalysisOptions = z.infer<typeof AnalysisOptionsSchema>;
