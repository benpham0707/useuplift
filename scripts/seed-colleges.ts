// scripts/seed-colleges.ts
//
// LEGACY ONLY: superseded by `npm run ingest:college`. Do not use this script
// for the college database rebuild; it does not preserve release provenance or
// use the validated staging-and-promotion workflow.
//
// One-time seed script. Pulls institutional data from the College Scorecard API,
// transforms it, and upserts into the colleges table.
//
// Run with: npx tsx scripts/seed-colleges.ts
// Re-runs are safe (idempotent upsert on scorecard_id).

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ===== Configuration =====

const SCORECARD_API_KEY = process.env.COLLEGE_SCORECARD_API;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// IMPORTANT: This script needs the SERVICE ROLE key (not anon) to write to colleges.
// If service role isn't set, fall back to anon key but warn — RLS may block writes.

if (!SCORECARD_API_KEY) {
  throw new Error('COLLEGE_SCORECARD_API is not set in .env');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase URL or service role key not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ===== Field list (must match section 5) =====

const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.zip',
  'school.school_url',
  'location.lat',
  'location.lon',
  'school.region_id',
  'school.ownership',
  'school.degrees_awarded.predominant',
  'school.locale',
  'school.carnegie_size_setting',
  'school.minority_serving.historically_black',
  'school.minority_serving.hispanic',
  'school.minority_serving.tribal',
  'school.women_only',
  'school.men_only',
  'school.religious_affiliation',
  'latest.student.size',
  'latest.student.enrollment.all',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.admissions.act_scores.25th_percentile.cumulative',
  'latest.admissions.act_scores.75th_percentile.cumulative',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.attendance.academic_year',
  'latest.cost.avg_net_price.overall',
  'latest.aid.pell_grant_rate',
  'latest.completion.rate_suppressed.overall',
  'latest.student.retention_rate.four_year.full_time',
  'latest.earnings.10_yrs_after_entry.median',
  'latest.student.share_firstgeneration',
  'latest.student.demographics.race_ethnicity.white',
  'latest.student.demographics.race_ethnicity.black',
  'latest.student.demographics.race_ethnicity.hispanic',
  'latest.student.demographics.race_ethnicity.asian',
  'latest.student.demographics.race_ethnicity.aian',
  'latest.student.demographics.race_ethnicity.nhpi',
  'latest.student.demographics.race_ethnicity.two_or_more',
  'latest.student.demographics.race_ethnicity.non_resident_alien',
  'latest.academics.program_percentage.agriculture',
  'latest.academics.program_percentage.resources',
  'latest.academics.program_percentage.architecture',
  'latest.academics.program_percentage.ethnic_cultural_gender',
  'latest.academics.program_percentage.communication',
  'latest.academics.program_percentage.communications_technology',
  'latest.academics.program_percentage.computer',
  'latest.academics.program_percentage.personal_culinary',
  'latest.academics.program_percentage.education',
  'latest.academics.program_percentage.engineering',
  'latest.academics.program_percentage.engineering_technology',
  'latest.academics.program_percentage.language',
  'latest.academics.program_percentage.family_consumer_science',
  'latest.academics.program_percentage.legal',
  'latest.academics.program_percentage.english',
  'latest.academics.program_percentage.humanities',
  'latest.academics.program_percentage.library',
  'latest.academics.program_percentage.biological',
  'latest.academics.program_percentage.mathematics',
  'latest.academics.program_percentage.military',
  'latest.academics.program_percentage.multidiscipline',
  'latest.academics.program_percentage.parks_recreation_fitness',
  'latest.academics.program_percentage.philosophy_religious',
  'latest.academics.program_percentage.theology_religious_vocation',
  'latest.academics.program_percentage.physical_science',
  'latest.academics.program_percentage.science_technology',
  'latest.academics.program_percentage.psychology',
  'latest.academics.program_percentage.security_law_enforcement',
  'latest.academics.program_percentage.public_administration_social_service',
  'latest.academics.program_percentage.social_science',
  'latest.academics.program_percentage.construction',
  'latest.academics.program_percentage.mechanic_repair_technology',
  'latest.academics.program_percentage.precision_production',
  'latest.academics.program_percentage.transportation',
  'latest.academics.program_percentage.visual_performing',
  'latest.academics.program_percentage.health',
  'latest.academics.program_percentage.business_marketing',
  'latest.academics.program_percentage.history',
].join(',');

// ===== API filters =====

const API_FILTERS = [
  'school.operating=1',
  'school.degrees_awarded.predominant__range=2..3',
  'latest.student.size__range=100..',
].join('&');

// ===== Program name to CIP code mapping =====

const PROGRAM_NAME_TO_CIP: Record<string, string> = {
  'agriculture': '01',
  'resources': '03',
  'architecture': '04',
  'ethnic_cultural_gender': '05',
  'communication': '09',
  'communications_technology': '10',
  'computer': '11',
  'personal_culinary': '12',
  'education': '13',
  'engineering': '14',
  'engineering_technology': '15',
  'language': '16',
  'family_consumer_science': '19',
  'legal': '22',
  'english': '23',
  'humanities': '24',
  'library': '25',
  'biological': '26',
  'mathematics': '27',
  'military': '29',
  'multidiscipline': '30',
  'parks_recreation_fitness': '31',
  'philosophy_religious': '38',
  'theology_religious_vocation': '39',
  'physical_science': '40',
  'science_technology': '41',
  'psychology': '42',
  'security_law_enforcement': '43',
  'public_administration_social_service': '44',
  'social_science': '45',
  'construction': '46',
  'mechanic_repair_technology': '47',
  'precision_production': '48',
  'transportation': '49',
  'visual_performing': '50',
  'health': '51',
  'business_marketing': '52',
  'history': '54',
};

// ===== Main flow =====

async function main() {
  console.log('🎓 Starting College Scorecard ingestion...');

  // 1. Load CIP → interest tag mapping into memory
  const cipMap = await loadCipMapping();
  console.log(`✓ Loaded ${Object.keys(cipMap).length} CIP mappings`);

  // 2. Fetch all pages
  let page = 0;
  let totalFetched = 0;
  let totalUpserted = 0;
  let totalSkipped = 0;
  let totalRecords = Infinity;

  while (totalFetched < totalRecords) {
    const response = await fetchPage(page);

    if (page === 0) {
      totalRecords = response.metadata.total;
      console.log(`📊 Total matching records: ${totalRecords}`);
    }

    const transformed = response.results
      .map((raw: any) => transformRecord(raw, cipMap))
      .filter((rec): rec is CollegeRecord => rec !== null);

    totalSkipped += response.results.length - transformed.length;

    if (transformed.length > 0) {
      // Process records one by one to handle conflicts gracefully
      for (const record of transformed) {
        const { error } = await supabase
          .from('colleges')
          .upsert([record], { onConflict: 'scorecard_id', ignoreDuplicates: false });

        if (error) {
          // If slug conflict, try updating by scorecard_id or inserting with modified slug
          if (error.code === '23505' && error.message.includes('slug')) {
            // Try to update existing record by scorecard_id
            const { error: updateError } = await supabase
              .from('colleges')
              .update(record)
              .eq('scorecard_id', record.scorecard_id);

            if (updateError) {
              // If no existing scorecard_id, update by slug
              const { error: slugUpdateError } = await supabase
                .from('colleges')
                .update(record)
                .eq('slug', record.slug);

              if (slugUpdateError) {
                console.error(`❌ Failed to upsert ${record.name}:`, error);
                continue;
              }
            }
          } else {
            console.error(`❌ Upsert failed for ${record.name}:`, error);
            continue;
          }
        }
        totalUpserted++;
      }
    }

    totalFetched += response.results.length;
    console.log(
      `  Page ${page}: ${response.results.length} fetched, ${transformed.length} upserted (running total: ${totalUpserted})`
    );

    page++;

    // Gentle pacing to avoid rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log('');
  console.log('✅ Ingestion complete');
  console.log(`   Total fetched:  ${totalFetched}`);
  console.log(`   Total upserted: ${totalUpserted}`);
  console.log(`   Total skipped:  ${totalSkipped}`);
}

// ===== Helpers =====

async function fetchPage(page: number) {
  const url =
    `https://api.data.gov/ed/collegescorecard/v1/schools` +
    `?api_key=${SCORECARD_API_KEY}` +
    `&${API_FILTERS}` +
    `&fields=${FIELDS}` +
    `&per_page=100` +
    `&page=${page}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Scorecard API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function loadCipMapping(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('cip_interest_mapping')
    .select('cip_code, interest_tags');

  if (error) throw error;

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    map[row.cip_code] = row.interest_tags;
  }
  return map;
}

interface CollegeRecord {
  scorecard_id: number;
  name: string;
  city: string | null;
  state: string;
  zip_code: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  type: string | null;
  school_type: string | null;
  setting: string | null;
  size_category: string | null;
  size: string | null;
  undergrad_enrollment: number;
  total_enrollment: number;
  designations: Record<string, any>;
  acceptance_rate: number | null;
  sat_reading_25: number | null;
  sat_reading_75: number | null;
  sat_math_25: number | null;
  sat_math_75: number | null;
  sat_total_25: number | null;
  sat_total_75: number | null;
  act_25: number | null;
  act_75: number | null;
  avg_sat_min: number | null;
  avg_sat_max: number | null;
  avg_act_min: number | null;
  avg_act_max: number | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  cost_of_attendance: number | null;
  net_price_average: number | null;
  pell_grant_rate: number | null;
  graduation_rate: number | null;
  retention_rate: number | null;
  median_earnings_10yr: number | null;
  first_gen_pct: number | null;
  demographics: Record<string, any>;
  program_breakdown: Record<string, number>;
  interest_tags: string[];
  data_year: number;
  last_synced_at: string;
  is_active: boolean;
  slug: string;
  campus_setting: string | null;
  enrollment_size: number;
  description: string | null;
}

function transformRecord(
  raw: Record<string, any>,
  cipMap: Record<string, string[]>
): CollegeRecord | null {
  // Apply script-level filters first
  if (!raw['school.name']?.trim()) return null;
  if (!raw['school.state']) return null;
  if (!raw['latest.student.size']) return null;

  // Predatory for-profit filter
  const ownership = raw['school.ownership'];
  const gradRate = raw['latest.completion.rate_suppressed.overall'];
  if (ownership === 3 && (gradRate === null || gradRate < 0.2)) return null;

  // Build program_breakdown JSONB from program_percentage
  const programBreakdown: Record<string, number> = {};
  const programPrefix = 'latest.academics.program_percentage.';

  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith(programPrefix) && typeof val === 'number' && val > 0) {
      const programName = key.substring(programPrefix.length);
      const cipCode = PROGRAM_NAME_TO_CIP[programName];
      if (cipCode) {
        programBreakdown[cipCode] = val;
      }
    }
  }

  // Derive interest tags from program_breakdown
  const tagSet = new Set<string>();
  for (const [cip, pct] of Object.entries(programBreakdown)) {
    if (pct >= 0.05 && cipMap[cip]) {
      cipMap[cip].forEach((tag) => tagSet.add(tag));
    }
  }

  // Build demographics JSONB
  const demographics = {
    white: raw['latest.student.demographics.race_ethnicity.white'],
    black: raw['latest.student.demographics.race_ethnicity.black'],
    hispanic: raw['latest.student.demographics.race_ethnicity.hispanic'],
    asian: raw['latest.student.demographics.race_ethnicity.asian'],
    native_american: raw['latest.student.demographics.race_ethnicity.aian'],
    pacific_islander: raw['latest.student.demographics.race_ethnicity.nhpi'],
    two_or_more: raw['latest.student.demographics.race_ethnicity.two_or_more'],
    international: raw['latest.student.demographics.race_ethnicity.non_resident_alien'],
  };

  // Build designations JSONB
  const designations = {
    hbcu: raw['school.minority_serving.historically_black'] === 1,
    hsi: raw['school.minority_serving.hispanic'] === 1,
    tribal: raw['school.minority_serving.tribal'] === 1,
    women_only: raw['school.women_only'] === 1,
    men_only: raw['school.men_only'] === 1,
    religious_affiliation: mapReligiousAffiliation(raw['school.religious_affiliation']),
  };

  const acceptanceRate = raw['latest.admissions.admission_rate.overall'] ?? null;
  const satReading25 = raw['latest.admissions.sat_scores.25th_percentile.critical_reading'];
  const satReading75 = raw['latest.admissions.sat_scores.75th_percentile.critical_reading'];
  const satMath25 = raw['latest.admissions.sat_scores.25th_percentile.math'];
  const satMath75 = raw['latest.admissions.sat_scores.75th_percentile.math'];

  const collegeName = raw['school.name'].trim();
  const enrollmentSize = raw['latest.student.size'];

  return {
    scorecard_id: raw.id,
    name: collegeName,
    slug: slugify(collegeName),
    city: raw['school.city'] ?? null,
    state: raw['school.state'],
    zip_code: raw['school.zip']?.toString().slice(0, 5) ?? null,
    website_url: normalizeUrl(raw['school.school_url']),
    latitude: raw['location.lat'] ?? null,
    longitude: raw['location.lon'] ?? null,
    region: mapRegion(raw['school.region_id']),
    type: mapOwnership(ownership),
    school_type: mapSchoolType(raw['school.degrees_awarded.predominant']),
    setting: mapLocale(raw['school.locale']),
    campus_setting: mapLocale(raw['school.locale']),
    size_category: mapSize(raw['school.carnegie_size_setting']),
    size: mapSizeToLegacy(enrollmentSize),
    undergrad_enrollment: enrollmentSize,
    total_enrollment: raw['latest.student.enrollment.all'] ?? enrollmentSize,
    enrollment_size: enrollmentSize,
    designations,
    acceptance_rate: acceptanceRate ? acceptanceRate * 100 : null,
    sat_reading_25: satReading25 ?? null,
    sat_reading_75: satReading75 ?? null,
    sat_math_25: satMath25 ?? null,
    sat_math_75: satMath75 ?? null,
    sat_total_25: satReading25 && satMath25 ? satReading25 + satMath25 : null,
    sat_total_75: satReading75 && satMath75 ? satReading75 + satMath75 : null,
    avg_sat_min: satReading25 && satMath25 ? satReading25 + satMath25 : null,
    avg_sat_max: satReading75 && satMath75 ? satReading75 + satMath75 : null,
    act_25: raw['latest.admissions.act_scores.25th_percentile.cumulative'] ?? null,
    act_75: raw['latest.admissions.act_scores.75th_percentile.cumulative'] ?? null,
    avg_act_min: raw['latest.admissions.act_scores.25th_percentile.cumulative'] ?? null,
    avg_act_max: raw['latest.admissions.act_scores.75th_percentile.cumulative'] ?? null,
    tuition_in_state: raw['latest.cost.tuition.in_state'] ?? null,
    tuition_out_of_state: raw['latest.cost.tuition.out_of_state'] ?? null,
    cost_of_attendance: raw['latest.cost.attendance.academic_year'] ?? null,
    net_price_average: raw['latest.cost.avg_net_price.overall'] ?? null,
    pell_grant_rate: raw['latest.aid.pell_grant_rate'] ?? null,
    graduation_rate: gradRate ?? null,
    retention_rate: raw['latest.student.retention_rate.four_year.full_time'] ?? null,
    median_earnings_10yr: raw['latest.earnings.10_yrs_after_entry.median'] ?? null,
    first_gen_pct: raw['latest.student.share_firstgeneration'] ?? null,
    demographics,
    program_breakdown: programBreakdown,
    interest_tags: Array.from(tagSet),
    data_year: new Date().getFullYear(),
    last_synced_at: new Date().toISOString(),
    is_active: true,
    description: generateDescription(collegeName, mapOwnership(ownership), mapSchoolType(raw['school.degrees_awarded.predominant']), raw['school.city'], raw['school.state']),
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function mapOwnership(code: number | null): string | null {
  switch (code) {
    case 1: return 'public';
    case 2: return 'private';
    case 3: return 'private';
    default: return null;
  }
}

function mapSchoolType(code: number | null): string | null {
  switch (code) {
    case 1: return 'less_than_two_year';
    case 2: return 'two_year';
    case 3: return 'four_year';
    default: return null;
  }
}

function mapLocale(code: number | null): string | null {
  if (code === null || code === undefined) return null;
  if (code >= 11 && code <= 13) return 'urban';
  if (code >= 21 && code <= 23) return 'suburban';
  if (code >= 31 && code <= 33) return 'rural';
  if (code >= 41 && code <= 43) return 'rural';
  return null;
}

function mapSize(code: number | null): string | null {
  if (code === null || code === undefined) return null;
  if ([1, 6, 11].includes(code)) return 'very_small';
  if ([2, 7, 12].includes(code)) return 'small';
  if ([3, 8, 13].includes(code)) return 'medium';
  if ([4, 9, 14].includes(code)) return 'large';
  return 'very_large';
}

function mapSizeToLegacy(enrollment: number): string {
  if (enrollment < 5000) return 'small';
  if (enrollment <= 15000) return 'medium';
  return 'large';
}

function mapRegion(code: number | null): string | null {
  const regions: Record<number, string> = {
    0: 'U.S. Service Schools',
    1: 'Northeast',
    2: 'Northeast',
    3: 'Midwest',
    4: 'Midwest',
    5: 'South',
    6: 'South',
    7: 'West',
    8: 'West',
    9: 'West',
  };
  return code !== null && code !== undefined ? regions[code] ?? null : null;
}

function mapReligiousAffiliation(code: number | null): string | null {
  // Scorecard's religious_affiliation is a coded field with 60+ values.
  // For v1, just return null if -2 (not applicable) or the raw code as string otherwise.
  // A future spec can map all codes to readable names.
  if (code === null || code === undefined || code === -2) return null;
  return String(code);
}

function generateDescription(name: string, ownership: string | null, schoolType: string | null, city: string | null, state: string | null): string | null {
  if (!ownership || !schoolType) return null;

  const typeLabel = schoolType === 'four_year' ? 'four-year' :
                    schoolType === 'two_year' ? 'two-year' :
                    'institution';

  const ownershipLabel = ownership === 'public' ? 'public' : 'private';

  if (city && state) {
    return `${name} is a ${ownershipLabel} ${typeLabel} institution in ${city}, ${state}.`;
  }
  return `${name} is a ${ownershipLabel} ${typeLabel} institution.`;
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
