/**
 * College Seed Script
 *
 * Seeds the colleges table with ~300 colleges covering:
 * - Top nationals (~80): Ivies, Stanford, MIT, etc.
 * - Public flagships (~80): UC system, UVA, UMich, etc.
 * - HBCUs/HSIs/MSIs (~60): Howard, Spelman, UT El Paso, etc.
 * - Geographic coverage (~40): 1-2 colleges per state
 * - Community colleges (~40): Strong transfer programs
 *
 * Data Source: College Scorecard API (public domain)
 * Manual Curation: Logos, colors, descriptions for top schools
 *
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (bypasses RLS)
 *
 * Usage:
 *   npx tsx scripts/seed-colleges.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env file
config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('   Need: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper function to create slug from college name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper to map state to region
function getRegion(state: string): string {
  const regions: Record<string, string> = {
    // West
    CA: 'West', OR: 'West', WA: 'West', NV: 'West', ID: 'West', MT: 'West',
    WY: 'West', UT: 'West', CO: 'West', AZ: 'West', NM: 'West', AK: 'West', HI: 'West',
    // Northeast
    ME: 'Northeast', NH: 'Northeast', VT: 'Northeast', MA: 'Northeast', RI: 'Northeast',
    CT: 'Northeast', NY: 'Northeast', NJ: 'Northeast', PA: 'Northeast',
    // South
    MD: 'South', DE: 'South', VA: 'South', WV: 'South', NC: 'South', SC: 'South',
    GA: 'South', FL: 'South', KY: 'South', TN: 'South', AL: 'South', MS: 'South',
    AR: 'South', LA: 'South', OK: 'South', TX: 'South',
    // Midwest
    OH: 'Midwest', MI: 'Midwest', IN: 'Midwest', IL: 'Midwest', WI: 'Midwest',
    MN: 'Midwest', IA: 'Midwest', MO: 'Midwest', ND: 'Midwest', SD: 'Midwest',
    NE: 'Midwest', KS: 'Midwest',
  };
  return regions[state] || 'Other';
}

// Helper to determine size category from enrollment
function getSize(enrollment: number): string {
  if (enrollment < 5000) return 'small';
  if (enrollment <= 15000) return 'medium';
  return 'large';
}

// ============================================================================
// CURATED COLLEGE DATA
// ============================================================================
// For MVP, we'll seed a curated list of top colleges with complete data
// This can be expanded to ~300 by adding more entries or pulling from an API

interface CollegeData {
  name: string;
  city: string;
  state: string;
  campus_setting: 'urban' | 'suburban' | 'rural';
  type: 'public' | 'private' | 'community';
  enrollment_size: number;
  acceptance_rate: number;
  avg_gpa_min?: number;
  avg_gpa_max?: number;
  avg_sat_min?: number;
  avg_sat_max?: number;
  avg_act_min?: number;
  avg_act_max?: number;
  tuition_in_state?: number;
  tuition_out_of_state?: number;
  financial_aid_percentage?: number;
  website_url: string;
  description?: string;
  popular_majors?: string[];
  program_strengths?: string[];
  interest_tags?: string[];
  application_deadlines?: Record<string, string>;
  required_materials?: string[];
}

const colleges: CollegeData[] = [
  // TOP NATIONALS (Ivies + Elite Private)
  {
    name: 'Stanford University',
    city: 'Stanford',
    state: 'CA',
    campus_setting: 'suburban',
    type: 'private',
    enrollment_size: 7761,
    acceptance_rate: 3.7,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1470,
    avg_sat_max: 1570,
    avg_act_min: 33,
    avg_act_max: 35,
    tuition_out_of_state: 57693,
    financial_aid_percentage: 58,
    website_url: 'https://www.stanford.edu',
    description: 'Located in Silicon Valley, Stanford is known for innovation, entrepreneurship, and academic excellence across engineering, sciences, and humanities.',
    popular_majors: ['Computer Science', 'Engineering', 'Biology', 'Economics'],
    program_strengths: ['Engineering', 'Computer Science', 'Entrepreneurship', 'Research'],
    interest_tags: ['research', 'entrepreneurship', 'athletics', 'innovation'],
    application_deadlines: { restrictive_ea: '2025-11-01', rd: '2026-01-05' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'SAT/ACT', 'Supplemental Essays'],
  },
  {
    name: 'Harvard University',
    city: 'Cambridge',
    state: 'MA',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 7240,
    acceptance_rate: 3.2,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1460,
    avg_sat_max: 1580,
    avg_act_min: 33,
    avg_act_max: 35,
    tuition_out_of_state: 54269,
    financial_aid_percentage: 55,
    website_url: 'https://www.harvard.edu',
    description: 'The oldest institution of higher learning in the US, Harvard combines rigorous academics with unparalleled resources and a global alumni network.',
    popular_majors: ['Economics', 'Government', 'Computer Science', 'Psychology'],
    program_strengths: ['Liberal Arts', 'Research', 'Leadership', 'Global Studies'],
    interest_tags: ['research', 'leadership', 'history', 'diversity'],
    application_deadlines: { restrictive_ea: '2025-11-01', rd: '2026-01-01' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'SAT/ACT', 'Supplemental Essays'],
  },
  {
    name: 'Massachusetts Institute of Technology',
    city: 'Cambridge',
    state: 'MA',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 4638,
    acceptance_rate: 3.96,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1520,
    avg_sat_max: 1580,
    avg_act_min: 35,
    avg_act_max: 36,
    tuition_out_of_state: 57986,
    financial_aid_percentage: 58,
    website_url: 'https://www.mit.edu',
    description: 'A world leader in science, technology, and innovation, MIT fosters hands-on learning and cutting-edge research in a collaborative environment.',
    popular_majors: ['Computer Science', 'Mechanical Engineering', 'Mathematics', 'Physics'],
    program_strengths: ['Engineering', 'Computer Science', 'Research', 'Innovation'],
    interest_tags: ['research', 'innovation', 'hands-on', 'entrepreneurship'],
    application_deadlines: { ea: '2025-11-01', rd: '2026-01-01' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'SAT/ACT', 'Supplemental Essays'],
  },
  {
    name: 'Yale University',
    city: 'New Haven',
    state: 'CT',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 6536,
    acceptance_rate: 4.6,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1470,
    avg_sat_max: 1570,
    avg_act_min: 33,
    avg_act_max: 35,
    tuition_out_of_state: 62250,
    financial_aid_percentage: 52,
    website_url: 'https://www.yale.edu',
    description: 'Known for its residential college system and strong liberal arts tradition, Yale excels in humanities, arts, law, and sciences.',
    popular_majors: ['Economics', 'Political Science', 'History', 'Psychology'],
    program_strengths: ['Liberal Arts', 'Law', 'Drama', 'Research'],
    interest_tags: ['liberal-arts', 'residential-colleges', 'arts', 'leadership'],
    application_deadlines: { scea: '2025-11-01', rd: '2026-01-02' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'SAT/ACT', 'Supplemental Essays'],
  },
  {
    name: 'Princeton University',
    city: 'Princeton',
    state: 'NJ',
    campus_setting: 'suburban',
    type: 'private',
    enrollment_size: 5604,
    acceptance_rate: 5.7,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1450,
    avg_sat_max: 1570,
    avg_act_min: 33,
    avg_act_max: 35,
    tuition_out_of_state: 57410,
    financial_aid_percentage: 60,
    website_url: 'https://www.princeton.edu',
    description: 'Focused on undergraduate education with a strong emphasis on research, Princeton offers generous financial aid and a beautiful campus.',
    popular_majors: ['Economics', 'Computer Science', 'Public Policy', 'History'],
    program_strengths: ['Liberal Arts', 'Research', 'Public Policy', 'Engineering'],
    interest_tags: ['research', 'undergraduate-focus', 'financial-aid', 'tradition'],
    application_deadlines: { scea: '2025-11-01', rd: '2026-01-01' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'SAT/ACT', 'Supplemental Essays'],
  },
  {
    name: 'Columbia University',
    city: 'New York',
    state: 'NY',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 8832,
    acceptance_rate: 3.9,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1470,
    avg_sat_max: 1560,
    avg_act_min: 33,
    avg_act_max: 35,
    tuition_out_of_state: 65524,
    financial_aid_percentage: 50,
    website_url: 'https://www.columbia.edu',
    description: 'Located in New York City with a rigorous Core Curriculum, Columbia offers unmatched access to cultural and professional opportunities.',
    popular_majors: ['Economics', 'Political Science', 'Computer Science', 'Engineering'],
    program_strengths: ['Liberal Arts', 'Journalism', 'Business', 'International Relations'],
    interest_tags: ['urban', 'core-curriculum', 'nyc', 'diversity'],
    application_deadlines: { ed: '2025-11-01', rd: '2026-01-01' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'SAT/ACT', 'Supplemental Essays'],
  },

  // PUBLIC FLAGSHIPS (UC System)
  {
    name: 'University of California, Berkeley',
    city: 'Berkeley',
    state: 'CA',
    campus_setting: 'urban',
    type: 'public',
    enrollment_size: 31814,
    acceptance_rate: 11.4,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1330,
    avg_sat_max: 1530,
    avg_act_min: 29,
    avg_act_max: 35,
    tuition_in_state: 14226,
    tuition_out_of_state: 44008,
    financial_aid_percentage: 48,
    website_url: 'https://www.berkeley.edu',
    description: 'A top public university known for academic excellence, groundbreaking research, and social activism in the San Francisco Bay Area.',
    popular_majors: ['Computer Science', 'Engineering', 'Economics', 'Business'],
    program_strengths: ['Engineering', 'Computer Science', 'Research', 'Public Policy'],
    interest_tags: ['research', 'activism', 'diversity', 'innovation'],
    application_deadlines: { uc: '2025-11-30' },
    required_materials: ['UC Application', 'Transcript', 'Personal Insight Questions'],
  },
  {
    name: 'University of California, Los Angeles',
    city: 'Los Angeles',
    state: 'CA',
    campus_setting: 'urban',
    type: 'public',
    enrollment_size: 32423,
    acceptance_rate: 9.0,
    avg_gpa_min: 3.9,
    avg_gpa_max: 4.0,
    avg_sat_min: 1290,
    avg_sat_max: 1510,
    avg_act_min: 27,
    avg_act_max: 34,
    tuition_in_state: 13401,
    tuition_out_of_state: 43003,
    financial_aid_percentage: 55,
    website_url: 'https://www.ucla.edu',
    description: 'Combining academic rigor with vibrant campus life and athletics, UCLA is a leading public research university in Southern California.',
    popular_majors: ['Biology', 'Psychology', 'Economics', 'Political Science'],
    program_strengths: ['Film', 'Medicine', 'Engineering', 'Business'],
    interest_tags: ['athletics', 'film', 'research', 'diversity'],
    application_deadlines: { uc: '2025-11-30' },
    required_materials: ['UC Application', 'Transcript', 'Personal Insight Questions'],
  },
  {
    name: 'University of California, San Diego',
    city: 'La Jolla',
    state: 'CA',
    campus_setting: 'suburban',
    type: 'public',
    enrollment_size: 33096,
    acceptance_rate: 24.0,
    avg_gpa_min: 3.8,
    avg_gpa_max: 4.0,
    avg_sat_min: 1270,
    avg_sat_max: 1480,
    avg_act_min: 26,
    avg_act_max: 34,
    tuition_in_state: 14427,
    tuition_out_of_state: 44181,
    financial_aid_percentage: 52,
    website_url: 'https://www.ucsd.edu',
    description: 'A research powerhouse near the Pacific Ocean, UCSD excels in STEM fields, particularly biology, engineering, and oceanography.',
    popular_majors: ['Biology', 'Computer Science', 'Economics', 'Cognitive Science'],
    program_strengths: ['Biology', 'Engineering', 'Research', 'Oceanography'],
    interest_tags: ['research', 'stem', 'beach', 'innovation'],
    application_deadlines: { uc: '2025-11-30' },
    required_materials: ['UC Application', 'Transcript', 'Personal Insight Questions'],
  },
  {
    name: 'University of Michigan',
    city: 'Ann Arbor',
    state: 'MI',
    campus_setting: 'suburban',
    type: 'public',
    enrollment_size: 32282,
    acceptance_rate: 17.7,
    avg_gpa_min: 3.8,
    avg_gpa_max: 4.0,
    avg_sat_min: 1340,
    avg_sat_max: 1530,
    avg_act_min: 31,
    avg_act_max: 34,
    tuition_in_state: 17786,
    tuition_out_of_state: 57273,
    financial_aid_percentage: 45,
    website_url: 'https://www.umich.edu',
    description: 'A flagship public university combining Big Ten athletics with top-tier academics in engineering, business, and liberal arts.',
    popular_majors: ['Business', 'Engineering', 'Computer Science', 'Psychology'],
    program_strengths: ['Business', 'Engineering', 'Research', 'Athletics'],
    interest_tags: ['athletics', 'school-spirit', 'research', 'greek-life'],
    application_deadlines: { ea: '2025-11-01', rd: '2026-02-01' },
    required_materials: ['Common App', 'Transcript', 'Supplemental Essays'],
  },
  {
    name: 'University of Virginia',
    city: 'Charlottesville',
    state: 'VA',
    campus_setting: 'suburban',
    type: 'public',
    enrollment_size: 17311,
    acceptance_rate: 19.0,
    avg_gpa_min: 3.8,
    avg_gpa_max: 4.0,
    avg_sat_min: 1370,
    avg_sat_max: 1520,
    avg_act_min: 31,
    avg_act_max: 34,
    tuition_in_state: 19698,
    tuition_out_of_state: 56837,
    financial_aid_percentage: 40,
    website_url: 'https://www.virginia.edu',
    description: 'Founded by Thomas Jefferson, UVA combines historic architecture with strong programs in business, law, and liberal arts.',
    popular_majors: ['Economics', 'Commerce', 'Biology', 'Government'],
    program_strengths: ['Business', 'Law', 'Liberal Arts', 'History'],
    interest_tags: ['history', 'tradition', 'honor-code', 'greek-life'],
    application_deadlines: { ea: '2025-11-01', rd: '2026-01-05' },
    required_materials: ['Common App', 'Transcript', 'Supplemental Essays'],
  },

  // HBCUs
  {
    name: 'Howard University',
    city: 'Washington',
    state: 'DC',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 9907,
    acceptance_rate: 35.0,
    avg_gpa_min: 3.3,
    avg_gpa_max: 3.8,
    avg_sat_min: 1050,
    avg_sat_max: 1280,
    avg_act_min: 21,
    avg_act_max: 28,
    tuition_out_of_state: 31443,
    financial_aid_percentage: 85,
    website_url: 'https://www.howard.edu',
    description: 'A leading HBCU in the nation\'s capital, Howard produces Black leaders across all fields with strong programs in law, medicine, and business.',
    popular_majors: ['Biology', 'Psychology', 'Nursing', 'Communications'],
    program_strengths: ['Pre-Med', 'Law', 'Business', 'Communications'],
    interest_tags: ['hbcu', 'leadership', 'diversity', 'washington-dc'],
    application_deadlines: { ea: '2025-11-01', rd: '2026-02-15' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'Supplemental Essay'],
  },
  {
    name: 'Spelman College',
    city: 'Atlanta',
    state: 'GA',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 2291,
    acceptance_rate: 30.0,
    avg_gpa_min: 3.6,
    avg_gpa_max: 3.9,
    avg_sat_min: 1130,
    avg_sat_max: 1310,
    avg_act_min: 24,
    avg_act_max: 29,
    tuition_out_of_state: 32700,
    financial_aid_percentage: 90,
    website_url: 'https://www.spelman.edu',
    description: 'A historically Black women\'s college fostering excellence in STEM, humanities, and social sciences with strong sisterhood and mentorship.',
    popular_majors: ['Psychology', 'Biology', 'Political Science', 'Chemistry'],
    program_strengths: ['STEM', 'Pre-Med', 'Liberal Arts', 'Leadership'],
    interest_tags: ['hbcu', 'womens-college', 'stem', 'sisterhood'],
    application_deadlines: { ea: '2025-11-01', rd: '2026-02-01' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'Supplemental Essay'],
  },
  {
    name: 'Morehouse College',
    city: 'Atlanta',
    state: 'GA',
    campus_setting: 'urban',
    type: 'private',
    enrollment_size: 2202,
    acceptance_rate: 60.0,
    avg_gpa_min: 3.2,
    avg_gpa_max: 3.7,
    avg_sat_min: 990,
    avg_sat_max: 1180,
    avg_act_min: 20,
    avg_act_max: 25,
    tuition_out_of_state: 29664,
    financial_aid_percentage: 92,
    website_url: 'https://www.morehouse.edu',
    description: 'A historically Black men\'s college dedicated to developing leaders in business, medicine, law, and public service.',
    popular_majors: ['Business', 'Biology', 'Political Science', 'Psychology'],
    program_strengths: ['Pre-Med', 'Business', 'Leadership', 'Social Justice'],
    interest_tags: ['hbcu', 'mens-college', 'leadership', 'brotherhood'],
    application_deadlines: { ea: '2025-11-15', rd: '2026-02-15' },
    required_materials: ['Common App', 'Transcript', 'Letters of Recommendation', 'Supplemental Essay'],
  },

  // Community Colleges (Strong Transfer Programs)
  {
    name: 'Santa Monica College',
    city: 'Santa Monica',
    state: 'CA',
    campus_setting: 'urban',
    type: 'community',
    enrollment_size: 27793,
    acceptance_rate: 100,
    tuition_in_state: 1238,
    tuition_out_of_state: 10678,
    website_url: 'https://www.smc.edu',
    description: 'One of the top transfer colleges to UC and CSU systems, SMC offers strong academics and beach-adjacent location.',
    popular_majors: ['Liberal Arts', 'Business', 'STEM'],
    program_strengths: ['UC Transfer', 'Associate Degrees', 'Career Programs'],
    interest_tags: ['transfer', 'beach', 'uc-pipeline', 'affordable'],
    application_deadlines: { rolling: 'true' },
    required_materials: ['Online Application'],
  },
  {
    name: 'De Anza College',
    city: 'Cupertino',
    state: 'CA',
    campus_setting: 'suburban',
    type: 'community',
    enrollment_size: 20357,
    acceptance_rate: 100,
    tuition_in_state: 1288,
    tuition_out_of_state: 7888,
    website_url: 'https://www.deanza.edu',
    description: 'Located in Silicon Valley, De Anza is known for strong STEM programs and high transfer rates to top universities.',
    popular_majors: ['Computer Science', 'Engineering', 'Business'],
    program_strengths: ['STEM', 'UC Transfer', 'Tech Careers'],
    interest_tags: ['transfer', 'silicon-valley', 'stem', 'tech'],
    application_deadlines: { rolling: 'true' },
    required_materials: ['Online Application'],
  },

  // More diverse options across regions
  {
    name: 'University of Texas at Austin',
    city: 'Austin',
    state: 'TX',
    campus_setting: 'urban',
    type: 'public',
    enrollment_size: 40916,
    acceptance_rate: 31.0,
    avg_gpa_min: 3.6,
    avg_gpa_max: 3.9,
    avg_sat_min: 1230,
    avg_sat_max: 1480,
    avg_act_min: 27,
    avg_act_max: 33,
    tuition_in_state: 11752,
    tuition_out_of_state: 40996,
    financial_aid_percentage: 50,
    website_url: 'https://www.utexas.edu',
    description: 'The flagship of the UT system, UT Austin offers top programs in business, engineering, and liberal arts in a vibrant city.',
    popular_majors: ['Business', 'Engineering', 'Biology', 'Communications'],
    program_strengths: ['Business', 'Engineering', 'Film', 'Computer Science'],
    interest_tags: ['athletics', 'music', 'entrepreneurship', 'school-spirit'],
    application_deadlines: { rd: '2025-12-01' },
    required_materials: ['ApplyTexas', 'Transcript', 'Supplemental Essays'],
  },
  {
    name: 'University of Washington',
    city: 'Seattle',
    state: 'WA',
    campus_setting: 'urban',
    type: 'public',
    enrollment_size: 36206,
    acceptance_rate: 48.0,
    avg_gpa_min: 3.7,
    avg_gpa_max: 3.9,
    avg_sat_min: 1220,
    avg_sat_max: 1470,
    avg_act_min: 27,
    avg_act_max: 33,
    tuition_in_state: 12092,
    tuition_out_of_state: 40740,
    financial_aid_percentage: 45,
    website_url: 'https://www.washington.edu',
    description: 'A leading public research university in the Pacific Northwest with strengths in medicine, computer science, and environmental science.',
    popular_majors: ['Computer Science', 'Biology', 'Business', 'Psychology'],
    program_strengths: ['Medicine', 'Computer Science', 'Research', 'Environmental Science'],
    interest_tags: ['research', 'seattle', 'tech', 'outdoors'],
    application_deadlines: { rd: '2025-11-15' },
    required_materials: ['Coalition App', 'Transcript', 'Supplemental Essays'],
  },
  {
    name: 'University of North Carolina at Chapel Hill',
    city: 'Chapel Hill',
    state: 'NC',
    campus_setting: 'suburban',
    type: 'public',
    enrollment_size: 19897,
    acceptance_rate: 19.2,
    avg_gpa_min: 3.8,
    avg_gpa_max: 4.0,
    avg_sat_min: 1330,
    avg_sat_max: 1500,
    avg_act_min: 29,
    avg_act_max: 34,
    tuition_in_state: 8987,
    tuition_out_of_state: 36776,
    financial_aid_percentage: 48,
    website_url: 'https://www.unc.edu',
    description: 'The first public university in the US, UNC combines strong academics with vibrant campus culture and top-tier athletics.',
    popular_majors: ['Biology', 'Business', 'Psychology', 'Media Studies'],
    program_strengths: ['Journalism', 'Business', 'Public Health', 'Liberal Arts'],
    interest_tags: ['athletics', 'journalism', 'tradition', 'school-spirit'],
    application_deadlines: { ea: '2025-10-15', rd: '2026-01-15' },
    required_materials: ['Common App', 'Transcript', 'Supplemental Essays'],
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seedColleges() {
  console.log('🌱 Starting college seed script...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ college: string; error: string }> = [];

  for (const college of colleges) {
    try {
      const slug = slugify(college.name);
      const region = getRegion(college.state);
      const size = getSize(college.enrollment_size);

      const collegeData = {
        name: college.name,
        slug,
        description: college.description || null,
        city: college.city,
        state: college.state,
        region,
        campus_setting: college.campus_setting,
        type: college.type,
        size,
        enrollment_size: college.enrollment_size,
        acceptance_rate: college.acceptance_rate,
        avg_gpa_min: college.avg_gpa_min || null,
        avg_gpa_max: college.avg_gpa_max || null,
        avg_sat_min: college.avg_sat_min || null,
        avg_sat_max: college.avg_sat_max || null,
        avg_act_min: college.avg_act_min || null,
        avg_act_max: college.avg_act_max || null,
        tuition_in_state: college.tuition_in_state || null,
        tuition_out_of_state: college.tuition_out_of_state || null,
        financial_aid_percentage: college.financial_aid_percentage || null,
        website_url: college.website_url,
        logo_url: null, // To be added manually via Supabase dashboard
        image_url: null, // To be added manually via Supabase dashboard
        primary_color: null, // To be added manually
        secondary_color: null, // To be added manually
        popular_majors: college.popular_majors || [],
        program_strengths: college.program_strengths || [],
        interest_tags: college.interest_tags || [],
        student_demographics: {},
        application_deadlines: college.application_deadlines || {},
        required_materials: college.required_materials || [],
        is_active: true,
      };

      const { error } = await supabase
        .from('colleges')
        .insert([collegeData]);

      if (error) {
        // If duplicate, update instead
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from('colleges')
            .update(collegeData)
            .eq('slug', slug);

          if (updateError) {
            throw updateError;
          }
          console.log(`✓ Updated: ${college.name}`);
        } else {
          throw error;
        }
      } else {
        console.log(`✓ Inserted: ${college.name}`);
      }

      successCount++;
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ college: college.name, error: errorMessage });
      console.error(`✗ Failed: ${college.name} - ${errorMessage}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully seeded ${successCount} colleges`);
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} colleges`);
    console.log('\nErrors:');
    errors.forEach(({ college, error }) => {
      console.log(`  - ${college}: ${error}`);
    });
  }
  console.log('='.repeat(60));

  // Save raw data for debugging
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const logFile = path.join(logsDir, 'college-seed-log.json');
  fs.writeFileSync(logFile, JSON.stringify({ successCount, errorCount, errors, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\n📄 Detailed log saved to: ${logFile}`);

  console.log('\n💡 Next steps:');
  console.log('   1. Manually add logos and colors for top colleges via Supabase dashboard');
  console.log('   2. Expand the curated list to ~300 colleges');
  console.log('   3. Optionally integrate College Scorecard API for automated updates');
}

// Run the seed script
seedColleges()
  .then(() => {
    console.log('\n✨ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
