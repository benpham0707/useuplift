/**
 * DATABASE TYPES
 *
 * Complete TypeScript types for all Supabase tables
 * Generated from: supabase/migrations/schema.sql
 */

import { z } from 'zod';

// ============================================================================
// PROFILE & USER CONTEXT
// ============================================================================

export const UserContextSchema = z.enum([
  'high_school_student',
  'transfer_student',
  'gap_year_student',
  'international_student'
]);

export type UserContext = z.infer<typeof UserContextSchema>;

export const ProfileStatusSchema = z.enum([
  'initial',
  'onboarding',
  'active',
  'completed',
  'archived'
]);

export type ProfileStatus = z.infer<typeof ProfileStatusSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_context: UserContextSchema,
  status: ProfileStatusSchema,
  goals: z.object({
    primaryGoal: z.string(),
    desiredOutcomes: z.array(z.string()),
    timelineUrgency: z.string()
  }),
  constraints: z.object({
    needsFinancialAid: z.boolean()
  }).passthrough(),
  demographics: z.record(z.unknown()),
  completion_score: z.number().min(0).max(1),
  completion_details: z.object({
    overall: z.number(),
    sections: z.record(z.number())
  }).passthrough(),
  extracted_skills: z.record(z.unknown()),
  hidden_strengths: z.array(z.string()),
  narrative_summary: z.string().nullable(),
  last_enrichment_date: z.string().datetime().nullable(),
  enrichment_priorities: z.array(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  archived_at: z.string().datetime().nullable(),
  deleted_at: z.string().datetime().nullable(),
  has_completed_assessment: z.boolean()
});

export type Profile = z.infer<typeof ProfileSchema>;

// ============================================================================
// PERSONAL INFORMATION
// ============================================================================

export const PersonalInformationSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  preferred_name: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  primary_email: z.string().nullable(),
  primary_phone: z.string().nullable(),
  secondary_phone: z.string().nullable(),
  pronouns: z.string().nullable(),
  gender_identity: z.string().nullable(),
  permanent_address: z.record(z.unknown()).nullable(),
  alternate_address: z.record(z.unknown()).nullable(),
  place_of_birth: z.record(z.unknown()).nullable(),
  hispanic_latino: z.string().nullable(),
  hispanic_background: z.string().nullable(),
  race_ethnicity: z.array(z.string()).nullable(),
  citizenship_status: z.string().nullable(),
  primary_language: z.string().nullable(),
  other_languages: z.record(z.unknown()).nullable(),
  years_in_us: z.number().nullable(),
  former_names: z.array(z.string()).nullable(),
  living_situation: z.string().nullable(),
  household_size: z.string().nullable(),
  household_income: z.string().nullable(),
  parent_guardians: z.record(z.unknown()).nullable(),
  siblings: z.record(z.unknown()).nullable(),
  first_gen: z.boolean().nullable()
});

export type PersonalInformation = z.infer<typeof PersonalInformationSchema>;

// ============================================================================
// ACADEMIC JOURNEY
// ============================================================================

export const AcademicJourneySchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  current_school: z.record(z.unknown()),
  current_grade: z.string().nullable(),
  expected_grad_date: z.string().nullable(),
  gpa: z.number().nullable(),
  gpa_scale: z.string().nullable(),
  gpa_type: z.string().nullable(),
  class_rank: z.string().nullable(),
  class_size: z.number().nullable(),
  other_schools: z.record(z.unknown()),
  course_history: z.array(z.unknown()),
  college_courses: z.array(z.unknown()),
  standardized_tests: z.record(z.unknown()),
  ap_exams: z.array(z.unknown()),
  ib_exams: z.array(z.unknown()),
  english_proficiency: z.record(z.unknown()),
  will_graduate_from_school: z.boolean(),
  is_boarding_school: z.boolean(),
  studied_abroad: z.boolean(),
  homeschooled: z.boolean(),
  took_math_early: z.boolean(),
  took_language_early: z.boolean(),
  report_test_scores: z.boolean(),
  taking_ap_exams: z.boolean(),
  in_ib_programme: z.boolean(),
  need_english_proficiency: z.boolean(),
  rank_reporting_method: z.enum(['exact', 'decile', 'quartile', 'quintile', 'none']).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type AcademicJourney = z.infer<typeof AcademicJourneySchema>;

// ============================================================================
// EXPERIENCES & ACTIVITIES
// ============================================================================

export const ActivitySchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  leadership_role: z.boolean().optional(),
  hours_per_week: z.number().optional(),
  weeks_per_year: z.number().optional(),
  grade_levels: z.array(z.string()).optional(),
  description: z.string().optional(),
  impact: z.string().optional(),
  category: z.string().optional()
});

export type Activity = z.infer<typeof ActivitySchema>;

export const ExperiencesActivitiesSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  work_experiences: z.array(z.unknown()),
  volunteer_service: z.array(z.unknown()),
  extracurriculars: z.array(ActivitySchema),
  personal_projects: z.array(z.unknown()),
  academic_honors: z.array(z.unknown()),
  formal_recognition: z.array(z.unknown()),
  leadership_roles: z.array(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type ExperiencesActivities = z.infer<typeof ExperiencesActivitiesSchema>;

// ============================================================================
// FAMILY RESPONSIBILITIES
// ============================================================================

export const FamilyResponsibilitiesSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  responsibilities: z.array(z.string()),
  circumstances: z.array(z.string()),
  hours_per_week: z.number().min(0).max(168),
  other_responsibilities: z.string(),
  challenging_circumstances: z.boolean(),
  other_circumstances: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type FamilyResponsibilities = z.infer<typeof FamilyResponsibilitiesSchema>;

// ============================================================================
// GOALS & ASPIRATIONS
// ============================================================================

export const GoalsAspirationsSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  intended_major: z.string().nullable(),
  career_interests: z.array(z.string()),
  highest_degree: z.enum(['bachelors', 'masters', 'phd', 'md', 'jd', 'other_professional', 'undecided']).nullable(),
  college_environment: z.array(z.string()),
  college_plans: z.record(z.unknown()).nullable(),
  applying_to_uc: z.enum(['yes', 'no', 'maybe']).nullable(),
  using_common_app: z.enum(['yes', 'no', 'maybe']).nullable(),
  start_date: z.enum(['fall_2025', 'spring_2026', 'fall_2026', 'gap_year', 'undecided']).nullable(),
  geographic_preferences: z.array(z.string()),
  need_based_aid: z.enum(['yes', 'no', 'unsure']).nullable(),
  merit_scholarships: z.enum(['yes', 'no', 'unsure']).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type GoalsAspirations = z.infer<typeof GoalsAspirationsSchema>;

// ============================================================================
// PERSONAL GROWTH
// ============================================================================

export const PersonalGrowthSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  meaningful_experiences: z.record(z.unknown()),
  additional_context: z.record(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type PersonalGrowth = z.infer<typeof PersonalGrowthSchema>;

// ============================================================================
// PORTFOLIO ANALYTICS
// ============================================================================

export const PortfolioAnalyticsSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  input_signature: z.string(),
  overall: z.number(),
  dimensions: z.record(z.unknown()),
  detailed: z.record(z.unknown()),
  cached_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type PortfolioAnalytics = z.infer<typeof PortfolioAnalyticsSchema>;

// ============================================================================
// COMPLETE STUDENT CONTEXT (aggregated)
// ============================================================================

export const StudentContextSchema = z.object({
  profile: ProfileSchema,
  personal_info: PersonalInformationSchema.nullable(),
  academic: AcademicJourneySchema.nullable(),
  activities: ExperiencesActivitiesSchema.nullable(),
  family: FamilyResponsibilitiesSchema.nullable(),
  goals: GoalsAspirationsSchema.nullable(),
  personal_growth: PersonalGrowthSchema.nullable(),
  portfolio_analytics: PortfolioAnalyticsSchema.nullable()
});

export type StudentContext = z.infer<typeof StudentContextSchema>;

// ============================================================================
// HELPER TYPES FOR TOOLS
// ============================================================================

export interface ClaimValidationInput {
  claim: string;
  claim_type: 'leadership' | 'activity' | 'achievement' | 'academic';
  user_id: string;
}

export interface ClaimValidationOutput {
  is_valid: boolean;
  evidence_found: string[];
  confidence: number;
  suggestion: string;
}

export interface RepetitionCheckInput {
  current_essay_text: string;
  user_id: string;
}

export interface RepetitionDetail {
  other_essay_type: string;
  similarity_score: number;
  overlapping_content: string[];
  severity: 'critical' | 'major' | 'minor';
}

export interface RepetitionCheckOutput {
  has_repetition: boolean;
  repetition_details: RepetitionDetail[];
  suggestions: string[];
}

export interface PIQRecommendation {
  prompt_number: number;
  prompt_text: string;
  fit_score: number;  // Final score after all adjustments
  base_score?: number;  // Raw score based on activities/achievements alone
  context_adjustment?: number;  // Additional points from circumstances/barriers overcome
  rationale: string;
  score_breakdown?: {  // Transparent scoring for AI/LLM analysis
    base: number;
    adjustments: Array<{ reason: string; points: number }>;
    final: number;
  };
  story_suggestions: string[];
  dimension_alignment: string[];
}

export interface PIQSuggestionInput {
  user_id: string;
  already_written?: number[];
}

export interface PIQSuggestionOutput {
  recommendations: PIQRecommendation[];
  avoid: Array<{
    prompt_number: number;
    reason: string;
  }>;
}

export interface DimensionCoverage {
  essays_showing_it: string[];
  average_score: number;
  strength_level: 'strong' | 'moderate' | 'weak' | 'absent';
}

export interface PortfolioAnalyticsOutput {
  dimension_coverage: Record<string, DimensionCoverage>;
  essay_count: number;
  portfolio_coherence_score: number;
  gaps: string[];
  strengths: string[];
}

export interface AlternativeStory {
  activity_name: string;
  activity_type: string;
  fit_score: number;
  base_score?: number;
  context_adjustment?: number;
  score_breakdown?: {
    base: number;
    adjustments: Array<{ reason: string; points: number }>;
    final: number;
  };
  why_better: string;
  dimension_strengths: string[];
  estimated_score_improvement: number;
}

export interface BetterStoriesInput {
  current_essay_text: string;
  piq_prompt_number: number;
  user_id: string;
}

export interface BetterStoriesOutput {
  alternative_stories: AlternativeStory[];
  current_story_issues: string[];
}

export interface CheckNarrativeConsistencyInput {
  user_id: string;
}

export interface CheckNarrativeConsistencyOutput {
  is_consistent: boolean;
  conflicts: Array<{
    type: string;
    description: string;
    severity: 'critical' | 'major' | 'minor';
  }>;
  suggestions: string[];
}
