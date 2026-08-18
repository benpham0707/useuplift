/**
 * College Database Types
 *
 * Type definitions for the college discovery and recommendation system
 */

export interface College {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  state: string;
  region: 'West' | 'Northeast' | 'South' | 'Midwest';
  campus_setting: 'urban' | 'suburban' | 'rural' | null;
  type: 'public' | 'private' | 'community';
  size: 'small' | 'medium' | 'large' | null;
  enrollment_size: number | null;
  acceptance_rate: number | null;
  avg_gpa_min: number | null;
  avg_gpa_max: number | null;
  avg_sat_min: number | null;
  avg_sat_max: number | null;
  avg_act_min: number | null;
  avg_act_max: number | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  financial_aid_percentage: number | null;
  website_url: string | null;
  logo_url: string | null;
  image_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  popular_majors: string[];
  program_strengths: string[];
  interest_tags: string[];
  student_demographics: Record<string, unknown>;
  application_deadlines: Record<string, string>;
  required_materials: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type CollegeCategory = 'reach' | 'match' | 'safety' | null;

export type ApplicationStatus =
  | 'interested'
  | 'researching'
  | 'applying'
  | 'applied'
  | 'accepted'
  | 'denied'
  | 'waitlisted'
  | 'enrolled';

export interface UserCollegeListItem {
  id: string;
  user_id: string;
  college_id: string;
  category: CollegeCategory;
  status: ApplicationStatus;
  notes: string | null;
  position: number | null;
  added_at: string;
  updated_at: string;
  college?: College;
}

export type ReportType = 'incorrect_stat' | 'outdated_info' | 'missing_program' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'fixed' | 'dismissed';

export interface CollegeReport {
  id: string;
  user_id: string | null;
  college_id: string;
  report_type: ReportType;
  description: string;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface CollegeFilters {
  search?: string;
  states?: string[];
  types?: Array<'public' | 'private' | 'community'>;
  settings?: Array<'urban' | 'suburban' | 'rural'>;
  majors?: string[];
  acceptanceRateMax?: number;
  acceptanceRateMin?: number;
}

export type SortOption = 'name-asc' | 'acceptance-asc' | 'tuition-asc';

export interface ClassificationThresholds {
  highly_selective: {
    acceptance_rate: number;
    match_gpa_buffer: number;
    match_sat_buffer: number;
  };
  moderate_selective: {
    acceptance_rate_min: number;
    acceptance_rate_max: number;
    match_gpa_buffer: number;
    match_sat_buffer: number;
    match_act_buffer: number;
    safety_gpa_buffer: number;
    safety_sat_buffer: number;
    safety_act_buffer: number;
  };
  high_acceptance: {
    acceptance_rate: number;
    match_gpa_buffer: number;
    match_sat_buffer: number;
    match_act_buffer: number;
  };
}

export type FoundationOwnership = 'public' | 'private_nonprofit' | 'private_for_profit' | 'other';

export interface FoundationCollegeSummary {
  institution_id: string;
  unitid: number;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  ownership: FoundationOwnership;
  institution_level: 'two_year' | 'four_year' | 'less_than_two_year' | 'other';
  undergraduate_enrollment: number | null;
  admission_rate: number | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  net_price: number | null;
  coverage_score: number;
  program_area_codes: string[];
  program_area_labels: string[];
}

export interface FoundationCollegeFact {
  field_key: string;
  display_value: string | null;
  source_name: string | null;
  source_release: string | null;
  period_start: string | null;
  period_end: string | null;
  academic_year: number | null;
  cohort_key: string | null;
  cohort_label: string | null;
  quality_status: string;
  is_estimate: boolean;
  is_suppressed: boolean;
  retrieved_at: string | null;
}

export interface FoundationCollegeDetail extends FoundationCollegeSummary {
  aliases: string[];
  zip: string | null;
  setting: string | null;
  generated_at: string;
  facts: FoundationCollegeFact[];
}

export interface CollegeCatalogSource {
  producer: string;
  release: string;
  publishedAt: string | null;
}

export interface CollegeMajorFacet {
  code: string;
  label: string;
}

export interface FoundationCollegeListItem {
  id: string;
  institution_id: string;
  category: CollegeCategory;
  status: ApplicationStatus;
  notes: string | null;
  position: number | null;
  added_at: string;
  updated_at: string;
  college: FoundationCollegeSummary;
}
