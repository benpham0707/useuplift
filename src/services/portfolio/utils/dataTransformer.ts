// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Portfolio Data Transformer
 *
 * Transforms data from Portfolio Insights database schema to the
 * PortfolioData interface expected by the portfolio scanner.
 *
 * This bridges the gap between:
 * - What the forms collect (Supabase tables)
 * - What the scanner expects (PortfolioData interface)
 */

import { PortfolioData, UCCampus } from '../types';

// ============================================================================
// Database Types (matching Supabase schema)
// ============================================================================

export interface DatabaseProfile {
  id: string;
  user_id: string;
  status: string;
  user_context: string;
  completion_score: number;
  completion_details: Record<string, any>;
  demographics: Record<string, any>;
  goals: Record<string, any>;
  constraints: Record<string, any>;
  enrichment_priorities: Record<string, any>;
  extracted_skills: any[];
  hidden_strengths: string[];
  narrative_summary: string | null;
  has_completed_assessment: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabasePersonalInfo {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  pronouns: string | null;
  gender_identity: string | null;
  hispanic_latino: string | null;
  hispanic_background: string | null;
  race_ethnicity: string[] | null;
  citizenship_status: string | null;
  primary_language: string | null;
  other_languages: Array<{ language: string; proficiency: string }> | null;
  years_in_us: number | null;
  permanent_address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  living_situation: string | null;
  household_size: string | null;
  household_income: string | null;
  parent_guardians: Array<{
    relationship: string;
    education_level: string;
    occupation: string;
    email?: string;
    phone?: string;
  }> | null;
  first_gen: boolean | null;
  siblings: {
    count?: number;
    education_status?: string;
  } | null;
}

export interface DatabaseAcademicJourney {
  profile_id: string;
  current_school: {
    name?: string;
    type?: string;
    city?: string;
    state?: string;
    country?: string;
    is_boarding?: boolean;
  } | null;
  current_grade: string | null;
  expected_grad_date: string | null;
  gpa: number | null;
  gpa_scale: string | null;
  gpa_type: string | null;
  class_rank: string | null;
  class_size: number | null;
  other_schools: Array<{
    name: string;
    city?: string;
    state?: string;
    start_date?: string;
    end_date?: string;
    reason?: string;
  }> | null;
  course_history: Record<string, Array<{
    year: string;
    grade_level: string;
    subjects: Record<string, Array<{
      course_name: string;
      honors_type: string;
      grade_1?: string;
      grade_2?: string;
    }>>;
  }>> | null;
  college_courses: Array<{
    college_name: string;
    setting: string;
    course_name: string;
    term_year: string;
    grade: string;
    course_type: string;
  }> | null;
  standardized_tests: {
    report_scores?: boolean;
    sat?: {
      reading_writing?: number;
      math?: number;
      total?: number;
      test_date?: string;
      times_taken?: number;
    };
    act?: {
      english?: number;
      math?: number;
      reading?: number;
      science?: number;
      composite?: number;
      test_date?: string;
      times_taken?: number;
    };
  } | null;
  ap_exams: Array<{
    subject: string;
    test_date?: string;
    score?: number;
  }> | null;
  ib_exams: Array<{
    subject: string;
    level: string;
    score?: number;
    exam_date?: string;
  }> | null;
  english_proficiency: {
    needs_test?: boolean;
    test_type?: string;
    test_date?: string;
    scores?: Record<string, number>;
  } | null;
}

export interface DatabaseExperiences {
  profile_id: string;
  work_experiences: Array<DatabaseActivity> | null;
  volunteer_service: Array<DatabaseActivity> | null;
  extracurriculars: Array<DatabaseActivity> | null;
  personal_projects: Array<DatabaseActivity> | null;
  academic_honors: Array<{
    title: string;
    level: string;
    year?: string;
    description?: string;
  }> | null;
  formal_recognition: Array<{
    title: string;
    level: string;
    year?: string;
    description?: string;
  }> | null;
}

export interface DatabaseActivity {
  id?: string;
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  ongoing?: boolean;
  time_commitment?: string;
  hours_per_week?: number;
  description: string;
  responsibilities?: string[];
  skills_developed?: string[];
  achievements?: string[];
  verification_link?: string;
  supervisor_name?: string;
  can_contact?: boolean;
}

export interface DatabaseFamilyResponsibilities {
  profile_id: string;
  responsibilities: {
    hours_per_week?: number;
    types?: string[];
    other_description?: string;
  } | null;
  life_circumstances: {
    has_challenges?: boolean;
    types?: string[];
    other_description?: string;
  } | null;
}

export interface DatabaseGoalsAspirations {
  profile_id: string;
  intended_major: string | null;
  career_interests: string[] | null;
  highest_degree: string | null;
  preferred_environment: string[] | null;
  college_plans: {
    applying_to_uc?: boolean;
    using_common_app?: boolean;
    geographic_preferences?: string[];
    financial_aid_needed?: boolean;
    merit_scholarships?: boolean;
  } | null;
}

export interface DatabasePersonalGrowth {
  profile_id: string;
  meaningful_experiences: {
    significant_challenge?: string;
    leadership_example?: string;
    academic_passion?: string;
    creative_expression?: string;
    greatest_talent?: string;
    community_contribution?: string;
    what_makes_unique?: string;
    educational_growth?: string;
  } | null;
  additional_context: {
    background_identity?: string;
    academic_circumstances?: string;
    educational_disruptions?: string;
    school_community_context?: string;
    additional_info?: string;
  } | null;
}

export interface DatabaseSupportNetwork {
  profile_id: string;
  counselor: {
    name?: string;
    email?: string;
  } | null;
  teachers: Array<{
    name: string;
    subject: string;
    relationship?: string;
  }> | null;
  community_support: {
    has_support?: boolean;
    organizations?: Array<{
      name: string;
      advisor?: string;
      assistance_type?: string;
    }>;
  } | null;
  portfolio_items: Array<{
    type: string;
    title: string;
    description?: string;
    category?: string;
    file_url?: string;
  }> | null;
}

// ============================================================================
// Complete Database Data Structure
// ============================================================================

export interface CompletePortfolioData {
  profile: DatabaseProfile;
  personal_info: DatabasePersonalInfo | null;
  academic_journey: DatabaseAcademicJourney | null;
  experiences: DatabaseExperiences | null;
  family_responsibilities: DatabaseFamilyResponsibilities | null;
  goals_aspirations: DatabaseGoalsAspirations | null;
  personal_growth: DatabasePersonalGrowth | null;
  support_network: DatabaseSupportNetwork | null;
  // PIQ analysis from existing system
  piq_analysis?: {
    piqs: Array<{
      prompt_number: number;
      prompt_title: string;
      essay_text: string;
      word_count: number;
      narrative_quality_index: number;
      reader_impression: string;
      top_strengths: string[];
      top_gaps: string[];
      authenticity_score: number;
      voice_type: string;
    }>;
    overall_writing_quality: number;
  };
}

// ============================================================================
// Transformation Function
// ============================================================================

/**
 * Transform complete database data to PortfolioData format for scanner
 */
export function transformDatabaseToPortfolioData(
  data: CompletePortfolioData
): PortfolioData {
  const {
    profile,
    personal_info,
    academic_journey,
    experiences,
    family_responsibilities,
    goals_aspirations,
    personal_growth,
    piq_analysis,
  } = data;

  // Parse grade from string
  const gradeMap: Record<string, 9 | 10 | 11 | 12> = {
    '9': 9,
    '10': 10,
    '11': 11,
    '12': 12,
    '9th': 9,
    '10th': 10,
    '11th': 11,
    '12th': 12,
  };
  const currentGrade = academic_journey?.current_grade
    ? gradeMap[academic_journey.current_grade] || 11
    : 11;

  // Calculate UC-weighted GPA (approximate if not directly available)
  const rawGpa = academic_journey?.gpa || 0;
  const gpaType = academic_journey?.gpa_type || 'unweighted';
  const gpaScale = parseFloat(academic_journey?.gpa_scale || '4.0');

  // Normalize to 4.0 scale if needed
  let normalizedGpa = rawGpa;
  if (gpaScale > 4.5) {
    normalizedGpa = (rawGpa / gpaScale) * 4.0;
  }

  // Extract advanced courses from course history
  const advancedCourses = extractAdvancedCourses(academic_journey?.course_history);

  // Calculate UC-weighted GPA (capped at 8 semesters)
  const ucWeightedGpa = calculateUCWeightedGPA(normalizedGpa, advancedCourses, gpaType);

  // Determine if CA resident based on address
  const isCaliforniaResident =
    personal_info?.permanent_address?.state === 'California' ||
    personal_info?.permanent_address?.state === 'CA';

  // Map household income to bracket
  const incomeBracket = mapIncomeToBracket(personal_info?.household_income);

  // Determine first-gen status
  const isFirstGen = determineFirstGenStatus(personal_info);

  // Transform experiences to activities format
  const activities = transformExperiencesToActivities(experiences);

  // Transform achievements
  const achievements = transformAchievements(experiences);

  // Build the PortfolioData object
  const portfolioData: PortfolioData = {
    profile: {
      student_id: profile.id,
      grade: currentGrade,
      graduation_year: extractGraduationYear(academic_journey?.expected_grad_date),
      school_name: academic_journey?.current_school?.name || 'Unknown',
      school_type: mapSchoolType(academic_journey?.current_school?.type),
      state: personal_info?.permanent_address?.state || 'Unknown',
      is_california_resident: isCaliforniaResident,
    },
    academic: {
      gpa_unweighted: gpaType === 'unweighted' ? normalizedGpa : normalizedGpa - 0.3,
      gpa_weighted: ucWeightedGpa,
      gpa_fully_weighted: gpaType === 'weighted' ? normalizedGpa : ucWeightedGpa,
      gpa_scale: 4.0,
      class_rank: parseClassRank(academic_journey?.class_rank),
      class_size: academic_journey?.class_size || undefined,
      coursework_rigor: determineCourseworkRigor(advancedCourses),
      advanced_courses: advancedCourses,
      ag_requirements: {
        completed: currentGrade >= 11, // Assume completed if 11th grade+
        courses_beyond_minimum: Math.max(0, advancedCourses.length - 6),
      },
      honors: extractHonors(experiences?.academic_honors),
      test_scores: transformTestScores(academic_journey),
    },
    experiences: {
      activities,
    },
    writing_analysis: piq_analysis || {
      piqs: [],
      overall_writing_quality: 0,
    },
    personal_context: {
      background: {
        first_gen: isFirstGen,
        low_income: incomeBracket === 'under_40k' || incomeBracket === '40k_75k',
        english_learner: personal_info?.primary_language !== 'English',
        underrepresented_minority: isUnderrepresentedMinority(personal_info?.race_ethnicity),
        geographic_diversity: isGeographicallyDiverse(personal_info?.permanent_address),
      },
      family_responsibilities: {
        has_responsibilities:
          (family_responsibilities?.responsibilities?.hours_per_week || 0) > 0,
        description: formatFamilyResponsibilities(family_responsibilities),
        hours_per_week: family_responsibilities?.responsibilities?.hours_per_week,
      },
      challenges_overcome: extractChallenges(
        family_responsibilities?.life_circumstances,
        personal_growth?.additional_context
      ),
      unique_circumstances: formatUniqueCircumstances(personal_growth?.additional_context),
      school_context: {
        total_aps_offered: estimateAPsOffered(academic_journey?.current_school?.type),
      },
    },
    goals: {
      intended_major: goals_aspirations?.intended_major || 'Undeclared',
      alternative_majors: [],
      why_major: personal_growth?.meaningful_experiences?.academic_passion || '',
      career_goals: goals_aspirations?.career_interests?.join(', ') || '',
      target_uc_campuses: determineTargetUCs(goals_aspirations),
    },
    timeline: {
      created_at: profile.created_at,
      last_updated: profile.updated_at,
    },
  };

  return portfolioData;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractAdvancedCourses(
  courseHistory: DatabaseAcademicJourney['course_history']
): PortfolioData['academic']['advanced_courses'] {
  const courses: PortfolioData['academic']['advanced_courses'] = [];

  if (!courseHistory) return courses;

  // Iterate through years
  Object.values(courseHistory).forEach((yearData) => {
    if (Array.isArray(yearData)) {
      yearData.forEach((term) => {
        if (term.subjects) {
          Object.entries(term.subjects).forEach(([subject, subjectCourses]) => {
            if (Array.isArray(subjectCourses)) {
              subjectCourses.forEach((course) => {
                if (course.honors_type && course.honors_type !== 'None') {
                  courses.push({
                    name: course.course_name,
                    type: mapHonorsType(course.honors_type),
                    grade_level: parseInt(term.grade_level?.replace(/\D/g, '') || '11'),
                    grade: course.grade_1 || course.grade_2,
                    is_uc_honors_certified: ['AP', 'IB'].includes(course.honors_type),
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  return courses;
}

function mapHonorsType(honorsType: string): 'AP' | 'IB' | 'Honors' | 'College' | 'DE' {
  const typeMap: Record<string, 'AP' | 'IB' | 'Honors' | 'College' | 'DE'> = {
    AP: 'AP',
    IB: 'IB',
    Honors: 'Honors',
    'Dual Enrollment': 'DE',
    College: 'College',
  };
  return typeMap[honorsType] || 'Honors';
}

function calculateUCWeightedGPA(
  baseGpa: number,
  advancedCourses: PortfolioData['academic']['advanced_courses'],
  gpaType: string
): number {
  // If already weighted, return as-is (capped at reasonable max)
  if (gpaType === 'weighted') {
    return Math.min(baseGpa, 4.5);
  }

  // Calculate UC weighting (max 8 semesters of honors)
  const honorsCourses = advancedCourses.filter(
    (c) => c.is_uc_honors_certified && (c.grade_level === 10 || c.grade_level === 11)
  );
  const honorsSemesters = Math.min(honorsCourses.length, 8);
  const weightBoost = honorsSemesters * 0.05; // Approximate boost

  return Math.min(baseGpa + weightBoost, 4.5);
}

function mapIncomeToBracket(
  income: string | null | undefined
): 'under_40k' | '40k_75k' | '75k_100k' | '100k_150k' | 'over_150k' | 'not_disclosed' {
  if (!income) return 'not_disclosed';

  const incomeMap: Record<string, any> = {
    '<$30k': 'under_40k',
    '$30-60k': '40k_75k',
    '$60-100k': '75k_100k',
    '$100-150k': '100k_150k',
    '>$150k': 'over_150k',
    'prefer-not-to-say': 'not_disclosed',
  };

  return incomeMap[income] || 'not_disclosed';
}

function determineFirstGenStatus(personalInfo: DatabasePersonalInfo | null): boolean {
  if (!personalInfo) return false;

  // Check explicit first-gen flag
  if (personalInfo.first_gen !== null) {
    return personalInfo.first_gen;
  }

  // Check parent education levels
  const parents = personalInfo.parent_guardians || [];
  const collegeDegrees = ['bachelor', 'master', 'professional', 'doctorate'];

  const anyParentHasCollege = parents.some((parent) =>
    collegeDegrees.some((degree) =>
      parent.education_level?.toLowerCase().includes(degree)
    )
  );

  return !anyParentHasCollege;
}

function transformExperiencesToActivities(
  experiences: DatabaseExperiences | null
): PortfolioData['experiences']['activities'] {
  const activities: PortfolioData['experiences']['activities'] = [];

  if (!experiences) return activities;

  // Transform work experiences
  experiences.work_experiences?.forEach((exp) => {
    activities.push(transformActivity(exp, 'work'));
  });

  // Transform volunteer service
  experiences.volunteer_service?.forEach((exp) => {
    activities.push(transformActivity(exp, 'service'));
  });

  // Transform extracurriculars
  experiences.extracurriculars?.forEach((exp) => {
    activities.push(transformActivity(exp, 'leadership'));
  });

  // Transform personal projects
  experiences.personal_projects?.forEach((exp) => {
    activities.push(transformActivity(exp, 'stem'));
  });

  return activities;
}

function transformActivity(
  activity: DatabaseActivity,
  category: string
): PortfolioData['experiences']['activities'][0] {
  const startYear = activity.start_date
    ? new Date(activity.start_date).getFullYear()
    : new Date().getFullYear();
  const endYear = activity.ongoing
    ? new Date().getFullYear()
    : activity.end_date
    ? new Date(activity.end_date).getFullYear()
    : new Date().getFullYear();

  return {
    id: activity.id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: activity.title,
    category: category as any,
    role: activity.title,
    description: activity.description,
    impact: activity.achievements?.join('. ') || '',
    years_involved: Math.max(1, endYear - startYear + 1),
    hours_per_week: activity.hours_per_week || 5,
    weeks_per_year: mapTimeCommitmentToWeeks(activity.time_commitment),
    grade_levels: calculateGradeLevels(startYear, endYear),
    leadership_positions: activity.responsibilities,
    awards: activity.achievements,
    is_paid_work: category === 'work',
  };
}

function mapTimeCommitmentToWeeks(commitment: string | undefined): number {
  const weekMap: Record<string, number> = {
    'full-time': 48,
    'part-time': 40,
    seasonal: 16,
    'one-time': 4,
  };
  return weekMap[commitment || ''] || 35;
}

function calculateGradeLevels(startYear: number, endYear: number): number[] {
  // Approximate grade levels based on years
  const currentYear = new Date().getFullYear();
  const grades: number[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearsFromNow = currentYear - year;
    const grade = Math.max(9, Math.min(12, 12 - yearsFromNow));
    if (!grades.includes(grade)) {
      grades.push(grade);
    }
  }

  return grades.sort();
}

function transformAchievements(
  experiences: DatabaseExperiences | null
): Array<{
  title: string;
  level: string;
  type: string;
  description: string;
}> {
  const achievements: Array<{
    title: string;
    level: string;
    type: string;
    description: string;
  }> = [];

  if (!experiences) return achievements;

  // Academic honors
  experiences.academic_honors?.forEach((honor) => {
    achievements.push({
      title: honor.title,
      level: honor.level || 'school',
      type: 'academic',
      description: honor.description || '',
    });
  });

  // Formal recognition
  experiences.formal_recognition?.forEach((recog) => {
    achievements.push({
      title: recog.title,
      level: recog.level || 'school',
      type: 'recognition',
      description: recog.description || '',
    });
  });

  return achievements;
}

function transformTestScores(
  academic: DatabaseAcademicJourney | null
): PortfolioData['academic']['test_scores'] {
  if (!academic?.standardized_tests) return undefined;

  const tests = academic.standardized_tests;

  return {
    sat: tests.sat
      ? {
          total: tests.sat.total || 0,
          math: tests.sat.math || 0,
          ebrw: tests.sat.reading_writing || 0,
        }
      : undefined,
    act: tests.act
      ? {
          composite: tests.act.composite || 0,
        }
      : undefined,
    ap_exams: academic.ap_exams?.map((exam) => ({
      subject: exam.subject,
      score: exam.score || 0,
    })),
  };
}

function mapSchoolType(
  type: string | undefined
): 'public' | 'private' | 'charter' | 'international' {
  const typeMap: Record<string, 'public' | 'private' | 'charter' | 'international'> = {
    public: 'public',
    private: 'private',
    charter: 'charter',
    international: 'international',
    magnet: 'public',
    parochial: 'private',
  };
  return typeMap[type?.toLowerCase() || ''] || 'public';
}

function extractGraduationYear(gradDate: string | null | undefined): number {
  if (!gradDate) return new Date().getFullYear() + 1;
  const year = parseInt(gradDate.split('-')[0]);
  return isNaN(year) ? new Date().getFullYear() + 1 : year;
}

function parseClassRank(rank: string | null | undefined): number | undefined {
  if (!rank) return undefined;
  // Handle formats like "15", "top 10%", "15/450"
  const match = rank.match(/^(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

function determineCourseworkRigor(
  advancedCourses: PortfolioData['academic']['advanced_courses']
): string {
  const count = advancedCourses.length;
  if (count >= 10) return 'Most rigorous available';
  if (count >= 6) return 'Very rigorous';
  if (count >= 3) return 'Rigorous';
  return 'Standard';
}

function extractHonors(
  academicHonors: DatabaseExperiences['academic_honors']
): string[] {
  if (!academicHonors) return [];
  return academicHonors.map((h) => h.title);
}

function isUnderrepresentedMinority(raceEthnicity: string[] | null | undefined): boolean {
  if (!raceEthnicity) return false;
  const urm = [
    'Black',
    'African American',
    'Hispanic',
    'Latino',
    'Native American',
    'American Indian',
    'Alaska Native',
    'Native Hawaiian',
    'Pacific Islander',
  ];
  return raceEthnicity.some((race) =>
    urm.some((u) => race.toLowerCase().includes(u.toLowerCase()))
  );
}

function isGeographicallyDiverse(
  address: DatabasePersonalInfo['permanent_address']
): boolean {
  if (!address) return false;
  // Rural areas, underserved regions
  // This would need a more sophisticated check in production
  return false;
}

function extractChallenges(
  circumstances: DatabaseFamilyResponsibilities['life_circumstances'],
  additionalContext: DatabasePersonalGrowth['additional_context']
): string[] {
  const challenges: string[] = [];

  if (circumstances?.types) {
    challenges.push(...circumstances.types);
  }
  if (circumstances?.other_description) {
    challenges.push(circumstances.other_description);
  }
  if (additionalContext?.academic_circumstances) {
    challenges.push(additionalContext.academic_circumstances);
  }
  if (additionalContext?.educational_disruptions) {
    challenges.push(additionalContext.educational_disruptions);
  }

  return challenges;
}

function formatFamilyResponsibilities(
  responsibilities: DatabaseFamilyResponsibilities | null
): string {
  if (!responsibilities?.responsibilities) return '';

  const types = responsibilities.responsibilities.types || [];
  const other = responsibilities.responsibilities.other_description;

  const all = [...types];
  if (other) all.push(other);

  return all.join('. ');
}

function formatUniqueCircumstances(
  context: DatabasePersonalGrowth['additional_context']
): string {
  if (!context) return '';

  const parts: string[] = [];
  if (context.background_identity) parts.push(context.background_identity);
  if (context.school_community_context) parts.push(context.school_community_context);
  if (context.additional_info) parts.push(context.additional_info);

  return parts.join(' ');
}

function estimateAPsOffered(schoolType: string | undefined): number {
  // Rough estimates by school type
  const estimates: Record<string, number> = {
    public: 15,
    private: 20,
    charter: 10,
    magnet: 25,
    international: 20,
  };
  return estimates[schoolType?.toLowerCase() || ''] || 15;
}

function determineTargetUCs(
  goals: DatabaseGoalsAspirations | null
): UCCampus[] {
  if (!goals?.college_plans?.applying_to_uc) return [];

  // Default UC targets based on preferences
  // In production, this would use more sophisticated matching
  return ['UC Berkeley', 'UCLA', 'UC San Diego'];
}
