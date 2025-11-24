/**
 * TESTABLE SUPABASE CLIENT
 *
 * Allows swapping between real and mock Supabase client for testing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getMockSupabase } from './supabaseClientMock.js';
import type {
  Profile,
  PersonalInformation,
  AcademicJourney,
  ExperiencesActivities,
  FamilyResponsibilities,
  GoalsAspirations,
  PersonalGrowth,
  PortfolioAnalytics,
  StudentContext
} from './types.js';

// Database schema type for Supabase client
interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      personal_information: { Row: PersonalInformation };
      academic_journey: { Row: AcademicJourney };
      experiences_activities: { Row: ExperiencesActivities };
      family_responsibilities: { Row: FamilyResponsibilities };
      goals_aspirations: { Row: GoalsAspirations };
      personal_growth: { Row: PersonalGrowth };
      portfolio_analytics: { Row: PortfolioAnalytics };
    };
  };
}

let supabaseClient: any | null = null;
let useMockClient = false;

/**
 * Enable mock mode for testing
 */
export function enableMockMode() {
  useMockClient = true;
}

/**
 * Disable mock mode (use real Supabase)
 */
export function disableMockMode() {
  useMockClient = false;
}

/**
 * Initialize Supabase client
 */
export function initializeSupabase(): any {
  if (useMockClient) {
    supabaseClient = getMockSupabase();
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseClient;
}

/**
 * Get Supabase client instance
 */
export function getSupabase(): any {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
}

/**
 * Get profile by user_id
 */
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Get complete student context (all tables joined)
 */
export async function getCompleteStudentContext(userId: string): Promise<StudentContext | null> {
  const supabase = getSupabase();

  // First get profile
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    return null;
  }

  const profileId = profile.id;

  // Fetch all related tables in parallel
  const [
    personalInfoResult,
    academicResult,
    activitiesResult,
    familyResult,
    goalsResult,
    personalGrowthResult,
    analyticsResult
  ] = await Promise.allSettled([
    supabase.from('personal_information').select('*').eq('profile_id', profileId).single(),
    supabase.from('academic_journey').select('*').eq('profile_id', profileId).single(),
    supabase.from('experiences_activities').select('*').eq('profile_id', profileId).single(),
    supabase.from('family_responsibilities').select('*').eq('profile_id', profileId).single(),
    supabase.from('goals_aspirations').select('*').eq('profile_id', profileId).single(),
    supabase.from('personal_growth').select('*').eq('profile_id', profileId).single(),
    supabase.from('portfolio_analytics').select('*').eq('profile_id', profileId).single()
  ]);

  return {
    profile,
    personal_info: personalInfoResult.status === 'fulfilled' && (personalInfoResult.value as any).data ? (personalInfoResult.value as any).data as PersonalInformation : null,
    academic: academicResult.status === 'fulfilled' && (academicResult.value as any).data ? (academicResult.value as any).data as AcademicJourney : null,
    activities: activitiesResult.status === 'fulfilled' && (activitiesResult.value as any).data ? (activitiesResult.value as any).data as ExperiencesActivities : null,
    family: familyResult.status === 'fulfilled' && (familyResult.value as any).data ? (familyResult.value as any).data as FamilyResponsibilities : null,
    goals: goalsResult.status === 'fulfilled' && (goalsResult.value as any).data ? (goalsResult.value as any).data as GoalsAspirations : null,
    personal_growth: personalGrowthResult.status === 'fulfilled' && (personalGrowthResult.value as any).data ? (personalGrowthResult.value as any).data as PersonalGrowth : null,
    portfolio_analytics: analyticsResult.status === 'fulfilled' && (analyticsResult.value as any).data ? (analyticsResult.value as any).data as PortfolioAnalytics : null
  };
}

/**
 * Get all extracurriculars and activities
 */
export async function getActivities(userId: string): Promise<ExperiencesActivities | null> {
  const supabase = getSupabase();
  const profile = await getProfileByUserId(userId);
  if (!profile) return null;

  const { data, error } = await supabase
    .from('experiences_activities')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  return data as ExperiencesActivities;
}

/**
 * Get academic journey data
 */
export async function getAcademicData(userId: string): Promise<AcademicJourney | null> {
  const supabase = getSupabase();
  const profile = await getProfileByUserId(userId);
  if (!profile) return null;

  const { data, error } = await supabase
    .from('academic_journey')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch academic data: ${error.message}`);
  }

  return data as AcademicJourney;
}

/**
 * Get family responsibilities and context
 */
export async function getFamilyContext(userId: string): Promise<FamilyResponsibilities | null> {
  const supabase = getSupabase();
  const profile = await getProfileByUserId(userId);
  if (!profile) return null;

  const { data, error } = await supabase
    .from('family_responsibilities')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch family context: ${error.message}`);
  }

  return data as FamilyResponsibilities;
}

/**
 * Get goals and aspirations
 */
export async function getGoals(userId: string): Promise<GoalsAspirations | null> {
  const supabase = getSupabase();
  const profile = await getProfileByUserId(userId);
  if (!profile) return null;

  const { data, error} = await supabase
    .from('goals_aspirations')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return data as GoalsAspirations;
}

/**
 * Validate user exists
 */
export async function validateUser(userId: string): Promise<boolean> {
  const profile = await getProfileByUserId(userId);
  return profile !== null;
}
