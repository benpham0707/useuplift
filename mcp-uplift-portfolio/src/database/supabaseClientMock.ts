/**
 * SUPABASE CLIENT MOCK
 *
 * Full mock implementation for testing with realistic student data
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Profile,
  PersonalInformation,
  AcademicJourney,
  ExperiencesActivities,
  FamilyResponsibilities,
  GoalsAspirations,
  PersonalGrowth,
  PortfolioAnalytics
} from './types.js';

// Mock database storage
const mockDatabase = {
  profiles: new Map<string, Profile>(),
  personal_information: new Map<string, PersonalInformation>(),
  academic_journey: new Map<string, AcademicJourney>(),
  experiences_activities: new Map<string, ExperiencesActivities>(),
  family_responsibilities: new Map<string, FamilyResponsibilities>(),
  goals_aspirations: new Map<string, GoalsAspirations>(),
  personal_growth: new Map<string, PersonalGrowth>(),
  portfolio_analytics: new Map<string, PortfolioAnalytics>()
};

/**
 * Seed mock database with test student data
 */
export function seedMockDatabase(studentData: any) {
  const userId = studentData.user_id;
  const profileId = `profile_${userId}`;

  // Create minimal valid profile matching ProfileSchema
  const profile: Profile = {
    id: profileId,
    user_id: userId,
    user_context: 'high_school_student',
    status: 'active',
    goals: {
      primaryGoal: 'Get into top UC',
      desiredOutcomes: ['admission'],
      timelineUrgency: 'medium'
    },
    constraints: {
      needsFinancialAid: studentData.profile?.financial_need || false
    },
    demographics: {},
    completion_score: 0.85,
    completion_details: {
      overall: 0.85,
      sections: {}
    },
    extracted_skills: {},
    hidden_strengths: [],
    narrative_summary: null,
    last_enrichment_date: null,
    enrichment_priorities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    deleted_at: null,
    has_completed_assessment: true
  };
  mockDatabase.profiles.set(userId, profile);

  // Create personal_information
  if (studentData.profile) {
    const personalInfo: PersonalInformation = {
      id: `pi_${profileId}`,
      profile_id: profileId,
      first_name: null,
      last_name: null,
      preferred_name: null,
      date_of_birth: null,
      primary_email: null,
      primary_phone: null,
      secondary_phone: null,
      pronouns: null,
      gender_identity: null,
      permanent_address: null,
      alternate_address: null,
      place_of_birth: null,
      hispanic_latino: null,
      hispanic_background: null,
      race_ethnicity: null,
      citizenship_status: null,
      primary_language: null,
      other_languages: null,
      years_in_us: studentData.profile.years_in_us || null,
      former_names: null,
      living_situation: null,
      household_size: null,
      household_income: studentData.profile.household_income || null,
      parent_guardians: null,
      siblings: null,
      first_gen: studentData.profile.first_gen || false
    };
    mockDatabase.personal_information.set(profileId, personalInfo);

    // Create academic_journey
    // Handle ap_courses count - convert to ap_exams array if needed
    let apExams = studentData.profile.ap_exams || [];
    if (apExams.length === 0 && studentData.profile.ap_courses) {
      // Create placeholder AP exams from ap_courses count
      const apCourseCount = studentData.profile.ap_courses;
      const apScores = studentData.profile.ap_scores || [];
      apExams = Array.from({ length: apCourseCount }, (_, i) => ({
        subject: `AP Course ${i + 1}`,
        score: apScores[i] || 4, // Default to score of 4 if not specified
        year: '2023'
      }));
    }

    let ibExams = studentData.profile.ib_exams || [];
    if (ibExams.length === 0 && studentData.profile.ib_courses) {
      // Create placeholder IB exams from ib_courses count
      const ibCourseCount = studentData.profile.ib_courses;
      ibExams = Array.from({ length: ibCourseCount }, (_, i) => ({
        subject: `IB Course ${i + 1}`,
        level: 'HL',
        predicted_score: 6,
        year: '2024'
      }));
    }

    const academic: AcademicJourney = {
      id: `ac_${profileId}`,
      profile_id: profileId,
      current_school: {},
      current_grade: null,
      expected_grad_date: null,
      gpa: studentData.profile.gpa || null,
      gpa_scale: '4.0',
      gpa_type: null,
      class_rank: studentData.profile.class_rank?.toString() || null,
      class_size: studentData.profile.class_size || null,
      other_schools: {},
      course_history: [],
      college_courses: [],
      standardized_tests: {},
      ap_exams: apExams,
      ib_exams: ibExams,
      english_proficiency: {},
      will_graduate_from_school: true,
      is_boarding_school: false,
      studied_abroad: false,
      homeschooled: false,
      took_math_early: false,
      took_language_early: false,
      report_test_scores: false,
      taking_ap_exams: apExams.length > 0,
      in_ib_programme: ibExams.length > 0,
      need_english_proficiency: false,
      rank_reporting_method: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDatabase.academic_journey.set(profileId, academic);

    // Create experiences_activities
    const activities: ExperiencesActivities = {
      id: `ea_${profileId}`,
      profile_id: profileId,
      work_experiences: studentData.profile.work_experiences || [],
      volunteer_service: studentData.profile.volunteer_service || [],
      extracurriculars: studentData.profile.activities || studentData.profile.extracurriculars || [],
      personal_projects: studentData.profile.personal_projects || [],
      academic_honors: studentData.profile.academic_honors || [],
      formal_recognition: [],
      leadership_roles: studentData.profile.leadership_roles || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDatabase.experiences_activities.set(profileId, activities);

    // Create family_responsibilities
    const family: FamilyResponsibilities = {
      id: `fr_${profileId}`,
      profile_id: profileId,
      responsibilities: studentData.profile.family_responsibility_types || [],
      circumstances: studentData.profile.family_circumstances || [],
      hours_per_week: studentData.profile.family_hours_per_week || 0,
      other_responsibilities: '',
      challenging_circumstances: studentData.profile.challenging_circumstances || false,
      other_circumstances: studentData.profile.other_context || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDatabase.family_responsibilities.set(profileId, family);

    // Create goals_aspirations
    const goals: GoalsAspirations = {
      id: `ga_${profileId}`,
      profile_id: profileId,
      intended_major: studentData.profile.intended_major || null,
      career_interests: studentData.profile.career_interests || [],
      highest_degree: null,
      college_environment: [],
      college_plans: null,
      applying_to_uc: null,
      using_common_app: null,
      start_date: null,
      geographic_preferences: [],
      need_based_aid: studentData.profile.financial_need ? 'yes' : null,
      merit_scholarships: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDatabase.goals_aspirations.set(profileId, goals);

    // Create personal_growth
    const personalGrowth: PersonalGrowth = {
      id: `pg_${profileId}`,
      profile_id: profileId,
      meaningful_experiences: studentData.profile.meaningful_experiences || {},
      additional_context: studentData.profile.additional_context || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDatabase.personal_growth.set(profileId, personalGrowth);
  }
}

/**
 * Clear all mock data
 */
export function clearMockDatabase() {
  mockDatabase.profiles.clear();
  mockDatabase.personal_information.clear();
  mockDatabase.academic_journey.clear();
  mockDatabase.experiences_activities.clear();
  mockDatabase.family_responsibilities.clear();
  mockDatabase.goals_aspirations.clear();
  mockDatabase.personal_growth.clear();
  mockDatabase.portfolio_analytics.clear();
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient(): any {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const tableMap = (mockDatabase as any)[table];
            if (!tableMap) {
              return { data: null, error: { code: 'PGRST116', message: 'Table not found' } };
            }

            // For profiles table, search by user_id
            if (table === 'profiles' && column === 'user_id') {
              const data = tableMap.get(value);
              if (!data) {
                return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
              }
              return { data, error: null };
            }

            // For other tables, search by profile_id
            if (column === 'profile_id') {
              const data = tableMap.get(value);
              if (!data) {
                return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
              }
              return { data, error: null };
            }

            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
          }
        })
      })
    })
  };
}

/**
 * Mock Supabase client instance
 */
let mockClient: any | null = null;

/**
 * Initialize mock Supabase client
 */
export function initializeMockSupabase(): any {
  mockClient = createMockSupabaseClient();
  return mockClient;
}

/**
 * Get mock Supabase client
 */
export function getMockSupabase(): any {
  if (!mockClient) {
    return initializeMockSupabase();
  }
  return mockClient;
}
