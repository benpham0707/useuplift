// @ts-nocheck - Legacy type file with declaration conflicts
/**
 * Core Type Definitions for Asteria-E Essay Analysis & Coaching System
 *
 * These types integrate with the Supabase database schema defined in:
 * supabase/migrations/2025-11-05_create_essay_system.sql
 *
 * Design Principles:
 * - Zod schemas for runtime validation
 * - TypeScript types derived from Zod for compile-time safety
 * - Full integration with Supabase Database types
 * - Explainability: every score linked to evidence
 */

import { z } from "zod";

// ============================================================================
// ESSAY TYPES & ENUMS
// ============================================================================

export const EssayTypeSchema = z.enum([
  'personal_statement',
  'uc_piq',
  'why_us',
  'community',
  'challenge_adversity',
  'intellectual_vitality',
  'activity_to_essay',
  'identity_background',
  'other'
]);

export type EssayType = z.infer<typeof EssayTypeSchema>;

export const ImpressionLabelSchema = z.enum([
  'arresting_deeply_human',     // 90-100
  'compelling_clear_voice',     // 80-89
  'competent_needs_texture',    // 70-79
  'readable_but_generic',       // 60-69
  'template_like_rebuild'       // <60
]);

export type ImpressionLabel = z.infer<typeof ImpressionLabelSchema>;

export const VoiceStyleSchema = z.enum([
  'concise_operator',
  'warm_reflective',
  'understated'
]);

export type VoiceStyle = z.infer<typeof VoiceStyleSchema>;

export const AnalysisDepthSchema = z.enum([
  'quick',
  'standard',
  'comprehensive'
]);

export type AnalysisDepth = z.infer<typeof AnalysisDepthSchema>;

// ============================================================================
// ESSAY SCHEMA
// ============================================================================

export const EssaySchema = z.object({
  // Primary keys
  id: z.string().uuid(),
  user_id: z.string(),
  profile_id: z.string().uuid().nullable().optional(),

  // Essay metadata
  essay_type: EssayTypeSchema,
  prompt_text: z.string().nullable().optional(),
  max_words: z.number().int().positive().default(650),
  target_school: z.string().nullable().optional(),

  // Essay content
  draft_original: z.string().min(1, "Essay draft cannot be empty"),
  draft_current: z.string().nullable().optional(),
  version: z.number().int().positive().default(1),

  // Context information
  context_constraints: z.string().nullable().optional(),
  intended_major: z.string().nullable().optional(),

  // Status tracking
  submitted_at: z.string().datetime().nullable().optional(),
  locked: z.boolean().default(false),

  // Timestamps
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Essay = z.infer<typeof EssaySchema>;

// Insert type (for creating new essays)
export const EssayInsertSchema = EssaySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  version: true,
}).partial({
  profile_id: true,
  prompt_text: true,
  target_school: true,
  draft_current: true,
  context_constraints: true,
  intended_major: true,
  submitted_at: true,
  locked: true,
});

export type EssayInsert = z.infer<typeof EssayInsertSchema>;

// Update type (for updating existing essays)
export const EssayUpdateSchema = EssaySchema.omit({
  id: true,
  user_id: true,
  created_at: true,
}).partial();

export type EssayUpdate = z.infer<typeof EssayUpdateSchema>;

// ============================================================================
// RUBRIC DIMENSION SCORE
// ============================================================================

export const RubricDimensionNames = [
  'opening_power_scene_entry',
  'narrative_arc_stakes_turn',
  'character_interiority_vulnerability',
  'show_dont_tell_craft',
  'reflection_meaning_making',
  'intellectual_vitality_curiosity',
  'originality_specificity_voice',
  'structure_pacing_coherence',
  'word_economy_craft',
  'context_constraints_disclosure',
  'school_program_fit',
  'ethical_awareness_humility'
] as const;

export type RubricDimensionName = typeof RubricDimensionNames[number];

export const RubricDimScoreSchema = z.object({
  name: z.enum(RubricDimensionNames),
  score_0_to_10: z.number().min(0).max(10),
  anchors_hit: z.array(z.string()).default([]),
  evidence_quotes: z.array(z.string()).default([]),
  evaluator_notes: z.string(),
  confidence: z.number().min(0).max(1).optional(), // 0-1 confidence
});

export type RubricDimScore = z.infer<typeof RubricDimScoreSchema>;

// ============================================================================
// ELITE PATTERN PROFILE
// ============================================================================

export const ElitePatternProfileSchema = z.object({
  // Pattern scores (0-10 for each)
  micro_to_macro: z.number().min(0).max(10),
  confrontation_dialogue: z.number().min(0).max(10),
  vulnerability_cues: z.number().min(0).max(10),
  philosophical_insight: z.number().min(0).max(10),
  community_transformation: z.number().min(0).max(10),
  quantified_with_human: z.number().min(0).max(10),
  counter_narrative: z.number().min(0).max(10),

  // Overall tier
  tier: z.enum(['1', '2', '3', '4']),

  // Evidence for each pattern
  evidence: z.record(z.string(), z.array(z.string())),

  // Calibration tips
  calibration_tips: z.array(z.string()).default([]),
});

export type ElitePatternProfile = z.infer<typeof ElitePatternProfileSchema>;

// ============================================================================
// ANALYSIS REPORT SCHEMA
// ============================================================================

export const AnalysisReportSchema = z.object({
  // Primary keys
  id: z.string().uuid(),
  essay_id: z.string().uuid(),

  // Metadata
  rubric_version: z.string().default('v1.0.0'),
  analysis_depth: AnalysisDepthSchema.default('standard'),

  // Overall scores
  essay_quality_index: z.number().min(0).max(100),
  impression_label: ImpressionLabelSchema,

  // Detailed scores
  dimension_scores: z.array(RubricDimScoreSchema),
  weights: z.record(z.string(), z.number()),

  // Diagnostics
  flags: z.array(z.string()).default([]),
  prioritized_levers: z.array(z.string()).default([]),

  // Elite pattern analysis
  elite_pattern_profile: ElitePatternProfileSchema.nullable().optional(),

  // Token usage tracking
  token_usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    cache_creation_input_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
  }).optional(),

  // Timestamps
  created_at: z.string().datetime().optional(),
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

// Insert type
export const AnalysisReportInsertSchema = AnalysisReportSchema.omit({
  id: true,
  created_at: true,
});

export type AnalysisReportInsert = z.infer<typeof AnalysisReportInsertSchema>;

// ============================================================================
// MICRO EDIT
// ============================================================================

export const MicroEditSchema = z.object({
  original: z.string(),
  replacement: z.string(),
  rationale: z.string(),
  category_impact: z.array(z.string()).default([]), // which rubric dims this improves
  estimated_eqi_gain: z.number().optional(),
});

export type MicroEdit = z.infer<typeof MicroEditSchema>;

// ============================================================================
// REWRITE OPTION
// ============================================================================

export const RewriteOptionSchema = z.object({
  style: VoiceStyleSchema,
  text: z.string(),
  explanation: z.string(),
  estimated_eqi_gain: z.number().optional(),
  word_count: z.number().optional(),
});

export type RewriteOption = z.infer<typeof RewriteOptionSchema>;

// ============================================================================
// OUTLINE VARIANT
// ============================================================================

export const OutlineVariantSchema = z.object({
  type: z.enum(['chronological', 'hinge_moment', 'braid_dual_motif']),
  title: z.string(),
  description: z.string(),
  beats: z.array(z.string()), // Story beats/sections
  estimated_eqi_gain: z.number().optional(),
});

export type OutlineVariant = z.infer<typeof OutlineVariantSchema>;

// ============================================================================
// COACHING PLAN SCHEMA
// ============================================================================

export const CoachingPlanSchema = z.object({
  // Primary keys
  id: z.string().uuid(),
  essay_id: z.string().uuid(),
  analysis_report_id: z.string().uuid().nullable().optional(),

  // Goal and context
  goal_statement: z.string(),
  coaching_depth: AnalysisDepthSchema.default('standard'),

  // Coaching content
  outline_variants: z.array(OutlineVariantSchema).default([]),
  micro_edits: z.array(MicroEditSchema).default([]),
  rewrites_by_style: z.record(VoiceStyleSchema, z.string()).default({}),

  // Elicitation prompts (grouped by type)
  elicitation_prompts: z.object({
    scene_detail: z.array(z.string()).default([]),
    reflection: z.array(z.string()).default([]),
    stakes: z.array(z.string()).default([]),
    fit: z.array(z.string()).default([]),
    context: z.array(z.string()).default([]),
  }).default({}),

  // Guardrails and guidance
  guardrails: z.array(z.string()).default([]),
  word_budget_guidance: z.string().nullable().optional(),
  school_alignment_todo: z.array(z.string()).default([]),

  // Token usage tracking
  token_usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }).optional(),

  // Acceptance tracking
  accepted: z.boolean().default(false),
  student_feedback: z.string().nullable().optional(),

  // Timestamps
  created_at: z.string().datetime().optional(),
});

export type CoachingPlan = z.infer<typeof CoachingPlanSchema>;

// Insert type
export const CoachingPlanInsertSchema = CoachingPlanSchema.omit({
  id: true,
  created_at: true,
});

export type CoachingPlanInsert = z.infer<typeof CoachingPlanInsertSchema>;

// Update type (for student feedback)
export const CoachingPlanUpdateSchema = CoachingPlanSchema.pick({
  accepted: true,
  student_feedback: true,
}).partial();

export type CoachingPlanUpdate = z.infer<typeof CoachingPlanUpdateSchema>;

// ============================================================================
// VOICE FINGERPRINT
// ============================================================================

export const VoiceFingerprintSchema = z.object({
  // Sentence-level patterns
  avg_sentence_length: z.number(),
  sentence_length_variance: z.number(),
  sentence_rhythm_pattern: z.array(z.number()), // lengths of first 10 sentences

  // Function word usage (style markers)
  function_word_ratios: z.record(z.string(), z.number()),

  // Idioms and unique phrases
  idioms: z.array(z.string()),
  signature_phrases: z.array(z.string()),

  // Punctuation style
  dash_usage: z.number(),
  semicolon_usage: z.number(),
  fragment_count: z.number(),

  // Overall voice metrics
  formality_score: z.number().min(0).max(10),
  energy_score: z.number().min(0).max(10),
  warmth_score: z.number().min(0).max(10),
});

export type VoiceFingerprint = z.infer<typeof VoiceFingerprintSchema>;

// ============================================================================
// FACT GRAPH
// ============================================================================

export const FactNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['person', 'organization', 'place', 'event', 'role', 'achievement']),
  name: z.string(),
  essays_mentioned: z.array(z.string()), // essay IDs
  contexts: z.array(z.string()), // surrounding text
  dates: z.array(z.string()).optional(),
  numbers: z.array(z.string()).optional(),
});

export type FactNode = z.infer<typeof FactNodeSchema>;

export const FactGraphSchema = z.object({
  nodes: z.array(FactNodeSchema),
  conflicts: z.array(z.object({
    node_id: z.string(),
    conflict_type: z.enum(['date_mismatch', 'name_variant', 'role_contradiction', 'number_discrepancy']),
    description: z.string(),
    affected_essays: z.array(z.string()),
  })),
});

export type FactGraph = z.infer<typeof FactGraphSchema>;

// ============================================================================
// MOTIF MAP
// ============================================================================

export const MotifMapSchema = z.object({
  motifs: z.record(z.string(), z.object({
    motif_name: z.string(),
    motif_type: z.enum(['image', 'metaphor', 'theme', 'value']),
    essays: z.array(z.string()), // essay IDs
    quotes: z.array(z.string()),
    strength: z.number().min(0).max(10),
  })),
  coherence_score: z.number().min(0).max(10),
  suggestions: z.array(z.string()),
});

export type MotifMap = z.infer<typeof MotifMapSchema>;

// ============================================================================
// APPLICATION SET
// ============================================================================

export const ApplicationSetSchema = z.object({
  // Primary keys
  id: z.string().uuid(),
  user_id: z.string(),
  profile_id: z.string().uuid().nullable().optional(),

  // Set metadata
  name: z.string(),
  target_schools: z.array(z.string()).default([]),

  // Coherence analysis results
  voice_fingerprint: VoiceFingerprintSchema.nullable().optional(),
  fact_graph: FactGraphSchema.nullable().optional(),
  motif_map: MotifMapSchema.nullable().optional(),

  // Anti-ghostwriting signals
  coherence_score: z.number().min(0).max(100).nullable().optional(),
  voice_drift_alerts: z.array(z.string()).default([]),
  fact_conflicts: z.array(z.string()).default([]),

  // Timestamps
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  last_coherence_check: z.string().datetime().nullable().optional(),
});

export type ApplicationSet = z.infer<typeof ApplicationSetSchema>;

// Insert type
export const ApplicationSetInsertSchema = ApplicationSetSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  profile_id: true,
  voice_fingerprint: true,
  fact_graph: true,
  motif_map: true,
  coherence_score: true,
  last_coherence_check: true,
});

export type ApplicationSetInsert = z.infer<typeof ApplicationSetInsertSchema>;

// ============================================================================
// ESSAY SET MEMBERSHIP
// ============================================================================

export const EssaySetMembershipSchema = z.object({
  id: z.string().uuid(),
  essay_id: z.string().uuid(),
  application_set_id: z.string().uuid(),
  display_order: z.number().int().default(0),
  created_at: z.string().datetime().optional(),
});

export type EssaySetMembership = z.infer<typeof EssaySetMembershipSchema>;

// ============================================================================
// REVISION HISTORY
// ============================================================================

export const RevisionHistorySchema = z.object({
  id: z.string().uuid(),
  essay_id: z.string().uuid(),
  version: z.number().int().positive(),
  draft_content: z.string(),
  change_summary: z.string().nullable().optional(),
  source: z.enum(['student', 'coach_suggestion', 'system_auto']),
  coaching_plan_id: z.string().uuid().nullable().optional(),
  word_count: z.number().int().nullable().optional(),
  created_at: z.string().datetime().optional(),
});

export type RevisionHistory = z.infer<typeof RevisionHistorySchema>;

// ============================================================================
// ANALYSIS OPTIONS (input for analysis engine)
// ============================================================================

export const AnalysisOptionsSchema = z.object({
  depth: AnalysisDepthSchema.default('standard'),
  focus_dimensions: z.array(z.enum(RubricDimensionNames)).optional(),
  skip_coaching: z.boolean().default(false),
  preferred_voice_style: VoiceStyleSchema.optional(),
  include_elite_patterns: z.boolean().default(true),
  temperature: z.number().min(0).max(1).optional(), // override default
});

export type AnalysisOptions = z.infer<typeof AnalysisOptionsSchema>;

// ============================================================================
// COACHING OPTIONS (input for coaching engine)
// ============================================================================

export const CoachingOptionsSchema = z.object({
  depth: AnalysisDepthSchema.default('standard'),
  num_outlines: z.number().int().min(1).max(5).default(3),
  num_rewrites: z.number().int().min(1).max(3).default(2),
  voice_styles: z.array(VoiceStyleSchema).default(['warm_reflective', 'concise_operator']),
  max_micro_edits: z.number().int().default(10),
  include_elicitation: z.boolean().default(true),
  respect_word_budget: z.boolean().default(true),
  temperature: z.number().min(0).max(1).optional(), // override default
});

export type CoachingOptions = z.infer<typeof CoachingOptionsSchema>;

// ============================================================================
// ΔEQI SIMULATION
// ============================================================================

export const EQISimulationSchema = z.object({
  current_eqi: z.number().min(0).max(100),
  simulations: z.array(z.object({
    lever: z.enum(RubricDimensionNames),
    improvement_points: z.number(), // e.g., +2
    projected_eqi: z.number().min(0).max(100),
    gain: z.number(),
    dependency_caps_applied: z.boolean(),
    cap_reason: z.string().optional(),
  })),
  top_3_levers: z.array(z.string()),
});

export type EQISimulation = z.infer<typeof EQISimulationSchema>;

// ============================================================================
// COMBINED ESSAY WITH REPORTS (for UI display)
// ============================================================================

export const EssayWithReportsSchema = EssaySchema.extend({
  latest_analysis: AnalysisReportSchema.nullable().optional(),
  latest_coaching: CoachingPlanSchema.nullable().optional(),
  application_sets: z.array(ApplicationSetSchema).default([]),
  revision_count: z.number().int().default(1),
});

export type EssayWithReports = z.infer<typeof EssayWithReportsSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Main entities
  EssaySchema,
  AnalysisReportSchema,
  CoachingPlanSchema,
  ApplicationSetSchema,

  // Supporting types
  RubricDimScoreSchema,
  ElitePatternProfileSchema,
  MicroEditSchema,
  RewriteOptionSchema,
  OutlineVariantSchema,
  VoiceFingerprintSchema,
  FactGraphSchema,
  MotifMapSchema,

  // Options
  AnalysisOptionsSchema,
  CoachingOptionsSchema,

  // Simulation
  EQISimulationSchema,
};
