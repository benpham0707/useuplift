// ==================================================================================
// COMPREHENSIVE CAREER ASSESSMENT TYPE SYSTEM
// Enterprise-grade TypeScript definitions for adaptive career assessment flow
// ==================================================================================

import { z } from 'zod';

// ==================================================================================
// CORE ENUMS AND CONSTANTS
// ==================================================================================

export const AcademicStatus = {
  HIGH_SCHOOL: 'high_school',
  COLLEGE: 'college_university', 
  GRADUATE_SCHOOL: 'graduate_school',
  GAP_YEAR: 'gap_year',
  WORKING_PROFESSIONAL: 'working_professional',
  OTHER: 'other'
} as const;

export const HighSchoolGrade = {
  GRADE_9: 'grade_9',
  GRADE_10: 'grade_10', 
  GRADE_11: 'grade_11',
  GRADE_12: 'grade_12'
} as const;

export const CollegeYear = {
  FRESHMAN: 'freshman',
  SOPHOMORE: 'sophomore',
  JUNIOR: 'junior',
  SENIOR: 'senior',
  GRADUATE: 'graduate'
} as const;

export const TestType = {
  SAT: 'sat',
  ACT: 'act',
  AP: 'ap',
  IB: 'ib',
  PSAT: 'psat'
} as const;

export const ActivityType = {
  ACADEMIC: 'academic',
  ATHLETICS: 'athletics',
  ARTS: 'arts',
  COMMUNITY_SERVICE: 'community_service',
  EMPLOYMENT: 'employment',
  FAMILY_RESPONSIBILITIES: 'family_responsibilities',
  INTERNSHIP: 'internship',
  LEADERSHIP: 'leadership',
  RESEARCH: 'research',
  VOLUNTEER: 'volunteer',
  OTHER: 'other'
} as const;

export const InterestCategory = {
  BUILDING_CREATING: 'building_creating',
  HELPING_PEOPLE: 'helping_people',
  SOLVING_PROBLEMS: 'solving_problems',
  LEADING_TEAMS: 'leading_teams',
  ANALYZING_DATA: 'analyzing_data',
  ARTISTIC_EXPRESSION: 'artistic_expression',
  PHYSICAL_ACTIVITY: 'physical_activity',
  WORKING_WITH_NATURE: 'working_with_nature',
  TECHNOLOGY: 'technology',
  BUSINESS_ENTREPRENEURSHIP: 'business_entrepreneurship'
} as const;

export const PersonalityTrait = {
  EXTRAVERSION: 'extraversion',
  AGREEABLENESS: 'agreeableness', 
  CONSCIENTIOUSNESS: 'conscientiousness',
  NEUROTICISM: 'neuroticism',
  OPENNESS: 'openness'
} as const;

export const JobFactor = {
  SALARY: 'salary',
  WORK_LIFE_BALANCE: 'work_life_balance',
  GROWTH_POTENTIAL: 'growth_potential',
  COMPANY_CULTURE: 'company_culture',
  LOCATION: 'location',
  IMPACT: 'impact',
  LEARNING_OPPORTUNITIES: 'learning_opportunities'
} as const;

// ==================================================================================
// ZOD VALIDATION SCHEMAS
// ==================================================================================

// Location Schema
export const LocationSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  state_province: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional()
});

// Initial Routing Questions
export const InitialRoutingSchema = z.object({
  date_of_birth: z.date({
    required_error: 'Date of birth is required',
    invalid_type_error: 'Please enter a valid date'
  }),
  academic_status: z.nativeEnum(AcademicStatus, {
    required_error: 'Please select your current academic status'
  }),
  grade_level: z.union([
    z.nativeEnum(HighSchoolGrade),
    z.nativeEnum(CollegeYear),
    z.string()
  ]).optional(),
  location: LocationSchema
});

// Test Scores
export const TestScoreSchema = z.object({
  test_type: z.nativeEnum(TestType),
  score: z.number().min(0),
  max_score: z.number().min(0),
  date_taken: z.date().optional(),
  retaking: z.boolean().default(false)
});

// Course Information
export const CourseSchema = z.object({
  subject: z.string().min(1),
  level: z.enum(['regular', 'honors', 'ap', 'ib', 'college_level']),
  grade: z.string().optional(),
  credit_hours: z.number().optional(),
  semester_year: z.string().optional()
});

// Activity/Experience
export const ActivitySchema = z.object({
  name: z.string().min(1, 'Activity name is required'),
  type: z.nativeEnum(ActivityType),
  position_role: z.string().optional(),
  description: z.string().max(500).optional(),
  hours_per_week: z.number().min(0).max(168),
  weeks_per_year: z.number().min(0).max(52),
  start_date: z.date(),
  end_date: z.date().optional(),
  achievements: z.array(z.string()).default([]),
  skills_developed: z.array(z.string()).default([])
});

// High School Academic Profile
export const HighSchoolAcademicSchema = z.object({
  current_gpa: z.number().min(0).max(5).optional(),
  gpa_scale: z.enum(['4.0', '5.0', '100']).default('4.0'),
  class_rank: z.number().min(1).optional(),
  class_size: z.number().min(1).optional(),
  test_scores: z.array(TestScoreSchema).default([]),
  current_courses: z.array(CourseSchema).default([]),
  planned_courses: z.array(CourseSchema).default([]),
  favorite_subjects: z.array(z.string()).min(1, 'Select at least one favorite subject'),
  least_favorite_subjects: z.array(z.string()).default([]),
  academic_challenges: z.string().max(500).optional(),
  academic_strengths: z.string().max(500).optional()
});

// College Academic Profile  
export const CollegeAcademicSchema = z.object({
  university_name: z.string().min(1, 'University name is required'),
  majors: z.array(z.string()).min(1, 'At least one major is required'),
  minors: z.array(z.string()).default([]),
  expected_graduation: z.date(),
  current_gpa: z.number().min(0).max(4).optional(),
  major_gpa: z.number().min(0).max(4).optional(),
  relevant_coursework: z.array(z.string()).default([]),
  thesis_research: z.string().max(500).optional(),
  academic_honors: z.array(z.string()).default([])
});

// Professional Experience
export const ProfessionalExperienceSchema = z.object({
  resume_uploaded: z.boolean().default(false),
  resume_url: z.string().url().optional(),
  experiences: z.array(ActivitySchema).default([]),
  technical_skills: z.array(z.string()).default([]),
  soft_skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  linkedin_url: z.string().url().optional(),
  portfolio_url: z.string().url().optional(),
  github_url: z.string().url().optional()
});

// Interest Discovery
export const InterestDiscoverySchema = z.object({
  excitement_categories: z.array(z.nativeEnum(InterestCategory))
    .min(1, 'Select at least one category that excites you'),
  ideal_day_description: z.string().min(50, 'Please provide more detail about your ideal day')
    .max(1000, 'Description is too long'),
  career_interests_ranked: z.array(z.string()).max(5),
  considered_careers: z.array(z.string()).default([]),
  career_exploration_status: z.enum(['exploring', 'focused', 'undecided']),
  mini_quiz_responses: z.array(z.object({
    question_id: z.string(),
    choice: z.string(),
    reasoning: z.string().optional()
  })).default([])
});

// Goals and Constraints
export const GoalsConstraintsSchema = z.object({
  college_preferences: z.object({
    size_preference: z.enum(['small', 'medium', 'large', 'no_preference']).optional(),
    location_preference: z.enum(['local', 'regional', 'national', 'international']).optional(),
    type_preference: z.enum(['public', 'private', 'liberal_arts', 'research', 'technical']).optional(),
    setting_preference: z.enum(['urban', 'suburban', 'rural', 'no_preference']).optional()
  }).optional(),
  financial_considerations: z.object({
    comfortable_discussing: z.boolean(),
    expected_family_contribution: z.number().min(0).optional(),
    scholarship_needs: z.boolean().optional(),
    work_study_interest: z.boolean().optional()
  }),
  family_expectations: z.string().max(500).optional(),
  timeline_goals: z.object({
    college_application_timeline: z.string().optional(),
    career_timeline: z.string().optional(),
    gap_year_plans: z.string().optional()
  }).optional()
});

// Career Direction (College/Professional)
export const CareerDirectionSchema = z.object({
  target_industries: z.array(z.string()).min(1, 'Select at least one target industry'),
  ideal_first_job: z.string().min(10, 'Please describe your ideal first job'),
  five_year_goal: z.string().min(10, 'Please describe your 5-year career goal'),
  job_factor_rankings: z.array(z.nativeEnum(JobFactor))
    .length(7, 'Please rank all job factors'),
  current_job_search_status: z.enum(['not_started', 'exploring', 'actively_searching', 'interviewing']),
  biggest_challenges: z.string().max(500).optional(),
  preferred_work_environment: z.enum(['remote', 'hybrid', 'in_person', 'flexible']),
  salary_expectations: z.object({
    min_salary: z.number().min(0).optional(),
    max_salary: z.number().min(0).optional(),
    currency: z.string().default('USD')
  }).optional()
});

// Personality and Work Style
export const PersonalityWorkStyleSchema = z.object({
  big_five_responses: z.array(z.object({
    trait: z.nativeEnum(PersonalityTrait),
    score: z.number().min(1).max(7),
    question_id: z.string()
  })),
  learning_style: z.enum(['visual', 'auditory', 'kinesthetic', 'reading_writing', 'multimodal']),
  work_preference: z.enum(['team_oriented', 'independent', 'mixed']),
  leadership_style: z.enum(['directive', 'participative', 'delegative', 'situational', 'not_interested']),
  risk_tolerance: z.number().min(1).max(10),
  change_adaptability: z.number().min(1).max(10),
  stress_management: z.enum(['excellent', 'good', 'fair', 'needs_improvement'])
});

// Network and Resources  
export const NetworkResourcesSchema = z.object({
  first_generation_college: z.boolean(),
  family_college_background: z.enum(['none', 'some', 'many', 'prefer_not_to_say']),
  mentor_access: z.object({
    has_career_mentor: z.boolean(),
    has_academic_mentor: z.boolean(),
    industry_connections: z.boolean(),
    alumni_network_access: z.boolean()
  }),
  support_systems: z.array(z.enum([
    'family', 'friends', 'teachers', 'counselors', 'mentors', 'online_communities', 'none'
  ])),
  resource_awareness: z.object({
    career_services: z.boolean(),
    internship_programs: z.boolean(),
    networking_events: z.boolean(),
    professional_organizations: z.boolean()
  })
});

// Final Questions
export const FinalQuestionsSchema = z.object({
  biggest_career_concern: z.string().min(10, 'Please share your biggest career concern')
    .max(500, 'Response is too long'),
  success_definition: z.string().min(10, 'Please describe what success means to you')
    .max(500, 'Response is too long'),
  additional_information: z.string().max(1000).optional(),
  data_usage_consent: z.boolean().refine(val => val === true, {
    message: 'Consent is required to continue'
  }),
  communication_preferences: z.object({
    email_updates: z.boolean(),
    career_tips: z.boolean(),
    opportunity_alerts: z.boolean(),
    survey_participation: z.boolean()
  })
});

// ==================================================================================
// COMPLETE ASSESSMENT DATA STRUCTURE
// ==================================================================================

export const CompleteAssessmentSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
  completed_at: z.date().optional(),
  version: z.string().default('1.0'),
  
  // Progress tracking
  current_section: z.string(),
  sections_completed: z.array(z.string()).default([]),
  completion_percentage: z.number().min(0).max(100).default(0),
  estimated_time_remaining: z.number().min(0).optional(),
  
  // Core assessment data
  initial_routing: InitialRoutingSchema,
  high_school_academic: HighSchoolAcademicSchema.optional(),
  college_academic: CollegeAcademicSchema.optional(),
  professional_experience: ProfessionalExperienceSchema.optional(),
  activities_achievements: z.array(ActivitySchema).default([]),
  interest_discovery: InterestDiscoverySchema,
  goals_constraints: GoalsConstraintsSchema.optional(),
  career_direction: CareerDirectionSchema.optional(),
  personality_work_style: PersonalityWorkStyleSchema,
  network_resources: NetworkResourcesSchema,
  final_questions: FinalQuestionsSchema,
  
  // Assessment results (populated after completion)
  results: z.object({
    career_matches: z.array(z.object({
      career_title: z.string(),
      compatibility_score: z.number().min(0).max(100),
      reasons: z.array(z.string()),
      growth_outlook: z.string(),
      salary_range: z.object({
        min: z.number(),
        max: z.number(),
        currency: z.string()
      }),
      education_requirements: z.string(),
      key_skills: z.array(z.string())
    })).default([]),
    
    personality_insights: z.object({
      big_five_scores: z.record(z.nativeEnum(PersonalityTrait), z.number()),
      work_style_summary: z.string(),
      ideal_environment: z.string(),
      potential_challenges: z.array(z.string())
    }).optional(),
    
    next_steps: z.array(z.object({
      category: z.string(),
      action: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      timeline: z.string(),
      resources: z.array(z.string())
    })).default([]),
    
    skill_gaps: z.array(z.object({
      skill: z.string(),
      importance: z.number().min(1).max(10),
      current_level: z.number().min(1).max(10),
      improvement_suggestions: z.array(z.string())
    })).default([])
  }).optional()
});

// ==================================================================================
// TYPE EXPORTS
// ==================================================================================

export type AcademicStatusType = keyof typeof AcademicStatus;
export type HighSchoolGradeType = keyof typeof HighSchoolGrade;
export type CollegeYearType = keyof typeof CollegeYear;
export type TestTypeType = keyof typeof TestType;
export type ActivityTypeType = keyof typeof ActivityType;
export type InterestCategoryType = keyof typeof InterestCategory;
export type PersonalityTraitType = keyof typeof PersonalityTrait;
export type JobFactorType = keyof typeof JobFactor;

export type Location = z.infer<typeof LocationSchema>;
export type InitialRouting = z.infer<typeof InitialRoutingSchema>;
export type TestScore = z.infer<typeof TestScoreSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type HighSchoolAcademic = z.infer<typeof HighSchoolAcademicSchema>;
export type CollegeAcademic = z.infer<typeof CollegeAcademicSchema>;
export type ProfessionalExperience = z.infer<typeof ProfessionalExperienceSchema>;
export type InterestDiscovery = z.infer<typeof InterestDiscoverySchema>;
export type GoalsConstraints = z.infer<typeof GoalsConstraintsSchema>;
export type CareerDirection = z.infer<typeof CareerDirectionSchema>;
export type PersonalityWorkStyle = z.infer<typeof PersonalityWorkStyleSchema>;
export type NetworkResources = z.infer<typeof NetworkResourcesSchema>;
export type FinalQuestions = z.infer<typeof FinalQuestionsSchema>;
export type CompleteAssessment = z.infer<typeof CompleteAssessmentSchema>;

// ==================================================================================
// ADAPTIVE LOGIC TYPES
// ==================================================================================

export type AssessmentPath = 'high_school' | 'college' | 'professional' | 'gap_year';

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  condition?: (assessment: Partial<CompleteAssessment>) => boolean;
  estimatedMinutes: number;
  subsections?: AssessmentSubsection[];
}

export interface AssessmentSubsection {
  id: string;
  title: string;
  component: string;
  validation: z.ZodSchema;
  required: boolean;
  condition?: (assessment: Partial<CompleteAssessment>) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  section: string;
}

export interface ProgressState {
  currentSection: string;
  completedSections: string[];
  completionPercentage: number;
  estimatedTimeRemaining: number;
  canProceed: boolean;
  hasUnsavedChanges: boolean;
}