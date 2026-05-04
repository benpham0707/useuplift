# College Scorecard Data Ingestion - Implementation Spec

**Status:** Ready for implementation
**Owner:** Claude Code (via Supabase MCP)
**Estimated effort:** 1 focused session
**Prerequisites:** API key already added to `.env` and `.env.local` as `COLLEGE_SCORECARD_API`

---

## 1. Overview

Seed Uplift's `colleges` table with comprehensive, authoritative data on ~3,000+ U.S. colleges, sourced from the U.S. Department of Education's College Scorecard API.

This unblocks Phase 2 (College Discovery & Matching) of the implementation roadmap by replacing the current ~18-college dataset with the full landscape of institutions a student might realistically apply to.

### Why College Scorecard

- **Authoritative** — official U.S. Department of Education dataset, sourced from federal reporting and IPEDS
- **Comprehensive** — covers all Title IV-participating institutions (4-year publics/privates, community colleges, HBCUs, HSIs, women's colleges, tribal colleges)
- **Free, no scraping** — public REST API at `api.data.gov/ed/collegescorecard/v1/schools`
- **Equity-relevant fields** — Pell %, first-generation %, demographic breakdowns, MSI flags
- **Annual updates** — federal reporting cadence is yearly

### Why this spec is narrowly scoped

We're doing one thing: getting the data into the database. Nothing more. UI, matching, deadlines, and images are deliberately deferred to keep this session focused.

---

## 2. Scope

### In scope

- Database migration to expand the `colleges` table with comprehensive Scorecard fields
- A new `cip_interest_mapping` lookup table for translating CIP codes to Uplift interest tags
- A one-time seeding script (`scripts/seed-colleges.ts`) that pulls from the Scorecard API, transforms data, and upserts into Supabase
- CIP-to-interest-tag derivation logic
- Filtering logic (exclude graduate-only, non-operating, sub-100-student institutions)
- Idempotent upsert (re-runs are safe and update existing records)
- Console logging with progress and final stats
- Basic validation queries to confirm data quality

### Out of scope (deferred to future specs)

- College discovery UI / browse page
- College detail pages
- Matching algorithm
- Application deadlines and required materials per school (separate sourcing strategy)
- Logos and images (use placeholder for now)
- Scheduled refresh automation (manual re-runs for now)
- Field-of-study-level data (institution-level only for v1)

---

## 3. Database Schema Changes

Apply all migrations via Supabase MCP.

### 3.1 Expand the `colleges` table

The current schema (`name, location_city, location_state, acceptance_rate_min, acceptance_rate_max, avg_gpa_min, avg_gpa_max, interest_tags, description, website_url, image_url`) is too sparse for the matching algorithm and detail views we'll build in Phase 2. Expand it as follows.

**Keep existing columns.** Add the following new columns:

```sql
ALTER TABLE public.colleges
  -- Identity & location
  ADD COLUMN IF NOT EXISTS scorecard_id INTEGER UNIQUE,
  ADD COLUMN IF NOT EXISTS unitid INTEGER,
  ADD COLUMN IF NOT EXISTS opeid TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS region TEXT,

  -- Classification
  ADD COLUMN IF NOT EXISTS ownership TEXT CHECK (ownership IN ('public', 'private_nonprofit', 'private_for_profit')),
  ADD COLUMN IF NOT EXISTS school_type TEXT CHECK (school_type IN ('four_year', 'two_year', 'less_than_two_year')),
  ADD COLUMN IF NOT EXISTS setting TEXT CHECK (setting IN ('urban', 'suburban', 'town', 'rural')),
  ADD COLUMN IF NOT EXISTS size_category TEXT CHECK (size_category IN ('very_small', 'small', 'medium', 'large', 'very_large')),
  ADD COLUMN IF NOT EXISTS undergrad_enrollment INTEGER,
  ADD COLUMN IF NOT EXISTS total_enrollment INTEGER,

  -- Special designations (multi-flag, JSONB)
  ADD COLUMN IF NOT EXISTS designations JSONB DEFAULT '{}'::jsonb,
  -- Example: { "hbcu": true, "hsi": false, "tribal": false, "women_only": false, "men_only": false, "religious_affiliation": null }

  -- Admissions
  ADD COLUMN IF NOT EXISTS acceptance_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS sat_reading_25 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_reading_75 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_math_25 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_math_75 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_total_25 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_total_75 INTEGER,
  ADD COLUMN IF NOT EXISTS act_25 INTEGER,
  ADD COLUMN IF NOT EXISTS act_75 INTEGER,

  -- Cost
  ADD COLUMN IF NOT EXISTS tuition_in_state INTEGER,
  ADD COLUMN IF NOT EXISTS tuition_out_of_state INTEGER,
  ADD COLUMN IF NOT EXISTS cost_of_attendance INTEGER,
  ADD COLUMN IF NOT EXISTS net_price_average INTEGER,
  ADD COLUMN IF NOT EXISTS pell_grant_rate NUMERIC,

  -- Outcomes
  ADD COLUMN IF NOT EXISTS graduation_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS retention_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS median_earnings_10yr INTEGER,

  -- Demographics & equity
  ADD COLUMN IF NOT EXISTS first_gen_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}'::jsonb,
  -- Example: { "white": 0.42, "black": 0.18, "hispanic": 0.20, "asian": 0.12, "native": 0.01, "two_or_more": 0.05, "international": 0.02 }

  -- Programs (CIP-based)
  ADD COLUMN IF NOT EXISTS program_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: { "11": 0.15, "14": 0.22, "26": 0.08, ... }  (CIP 2-digit code -> % of degrees awarded)

  -- Metadata
  ADD COLUMN IF NOT EXISTS data_year INTEGER,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_colleges_scorecard_id ON public.colleges(scorecard_id);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON public.colleges(location_state);
CREATE INDEX IF NOT EXISTS idx_colleges_ownership ON public.colleges(ownership);
CREATE INDEX IF NOT EXISTS idx_colleges_acceptance_rate ON public.colleges(acceptance_rate);
CREATE INDEX IF NOT EXISTS idx_colleges_undergrad_enrollment ON public.colleges(undergrad_enrollment);
CREATE INDEX IF NOT EXISTS idx_colleges_interest_tags ON public.colleges USING GIN (interest_tags);
CREATE INDEX IF NOT EXISTS idx_colleges_designations ON public.colleges USING GIN (designations);
CREATE INDEX IF NOT EXISTS idx_colleges_program_breakdown ON public.colleges USING GIN (program_breakdown);
```

### 3.2 Create `cip_interest_mapping` table

A lookup table that maps 2-digit CIP codes to Uplift interest tags. Stored in the database (not hardcoded) so it can be tuned without code changes.

```sql
CREATE TABLE IF NOT EXISTS public.cip_interest_mapping (
  cip_code TEXT PRIMARY KEY,
  cip_title TEXT NOT NULL,
  interest_tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Seed data** (insert as part of migration). Tags should align with Uplift's existing interest taxonomy from quick-start onboarding. Adjust the right column to match exactly what Uplift uses today:

| CIP 2-digit | CIP Title | Suggested Interest Tags |
|---|---|---|
| 01 | Agriculture | `["Agriculture", "Sustainability"]` |
| 03 | Natural Resources & Conservation | `["Environment", "Sustainability"]` |
| 04 | Architecture | `["Architecture", "Design"]` |
| 05 | Area & Ethnic Studies | `["Social Sciences", "Humanities"]` |
| 09 | Communication & Journalism | `["Communications", "Journalism", "Media"]` |
| 10 | Communications Technologies | `["Media", "Tech"]` |
| 11 | Computer & Information Sciences | `["Computer Science", "Tech"]` |
| 12 | Personal & Culinary Services | `["Culinary", "Hospitality"]` |
| 13 | Education | `["Education"]` |
| 14 | Engineering | `["Engineering"]` |
| 15 | Engineering Technologies | `["Engineering", "Tech"]` |
| 16 | Foreign Languages | `["Languages", "Humanities"]` |
| 19 | Family & Consumer Sciences | `["Social Sciences"]` |
| 22 | Legal Studies | `["Pre-Law", "Public Policy"]` |
| 23 | English Language & Literature | `["English", "Humanities"]` |
| 24 | Liberal Arts | `["Liberal Arts"]` |
| 25 | Library Science | `["Humanities"]` |
| 26 | Biological & Biomedical Sciences | `["Biology", "Pre-Med"]` |
| 27 | Mathematics & Statistics | `["Mathematics", "STEM"]` |
| 29 | Military Technologies | `["Military"]` |
| 30 | Multi/Interdisciplinary Studies | `["Liberal Arts"]` |
| 31 | Parks, Recreation, Fitness | `["Health", "Sports"]` |
| 38 | Philosophy & Religious Studies | `["Humanities"]` |
| 39 | Theology & Religious Vocations | `["Humanities", "Religious"]` |
| 40 | Physical Sciences | `["Physics", "Chemistry", "STEM"]` |
| 41 | Science Technologies | `["STEM"]` |
| 42 | Psychology | `["Psychology", "Social Sciences"]` |
| 43 | Homeland Security & Law Enforcement | `["Public Safety", "Public Policy"]` |
| 44 | Public Administration & Social Services | `["Public Policy", "Social Work"]` |
| 45 | Social Sciences | `["Social Sciences"]` |
| 46 | Construction Trades | `["Trades"]` |
| 47 | Mechanic & Repair Technologies | `["Trades"]` |
| 48 | Precision Production | `["Trades"]` |
| 49 | Transportation | `["Trades"]` |
| 50 | Visual & Performing Arts | `["Arts", "Performing Arts"]` |
| 51 | Health Professions | `["Pre-Med", "Health"]` |
| 52 | Business, Management, Marketing | `["Business", "Marketing"]` |
| 54 | History | `["History", "Humanities"]` |

Generate the INSERT statements from this table during migration.

---

## 4. College Scorecard API Reference

### Endpoint

```
https://api.data.gov/ed/collegescorecard/v1/schools
```

### Authentication

Pass API key as query param: `api_key=<COLLEGE_SCORECARD_API>`

### Pagination

- `per_page=100` (max)
- `page=0` (zero-indexed)
- Response includes `metadata.total` (total matching records) and `metadata.page` (current page)

### Rate limit

1,000 requests per IP per hour. With 100 records per page and ~3,500 expected schools (after filters), we need ~35 calls — well within limits.

### Field selection

The API supports `fields=` query param to limit response payload. **Use it.** Without it, responses are huge and slow. Fields list is enumerated in section 5.

### Filtering at the API level

Apply these filters in the API call to reduce payload before processing:

- `school.operating=1` (currently operating)
- `school.degrees_awarded.predominant__range=2..3` (predominantly Associate's or Bachelor's)
- `latest.student.size__range=100..` (at least 100 students)

---

## 5. Field Mapping: Scorecard → Uplift

The seeding script must request these specific fields and transform them as described.

| Scorecard Field | Uplift Column | Transformation |
|---|---|---|
| `id` | `scorecard_id` | direct |
| `school.name` | `name` | trim whitespace |
| `school.city` | `location_city` | direct |
| `school.state` | `location_state` | direct (2-letter) |
| `school.zip` | `zip_code` | first 5 digits only |
| `school.school_url` | `website_url` | prepend `https://` if missing |
| `location.lat` | `latitude` | direct |
| `location.lon` | `longitude` | direct |
| `school.region_id` | `region` | map ID → name (see below) |
| `school.ownership` | `ownership` | `1`→`public`, `2`→`private_nonprofit`, `3`→`private_for_profit` |
| `school.degrees_awarded.predominant` | `school_type` | `1`→`less_than_two_year`, `2`→`two_year`, `3`→`four_year` |
| `school.locale` | `setting` | locale code → `urban`/`suburban`/`town`/`rural` (see below) |
| `school.carnegie_size_setting` | `size_category` | Carnegie code → category (see below) |
| `latest.student.size` | `undergrad_enrollment` | direct |
| `latest.student.enrollment.all` | `total_enrollment` | direct (fallback to size if missing) |
| `school.minority_serving.historically_black` | `designations.hbcu` | boolean |
| `school.minority_serving.hispanic` | `designations.hsi` | boolean |
| `school.minority_serving.tribal` | `designations.tribal` | boolean |
| `school.women_only` | `designations.women_only` | boolean |
| `school.men_only` | `designations.men_only` | boolean |
| `school.religious_affiliation` | `designations.religious_affiliation` | code → name string or null |
| `latest.admissions.admission_rate.overall` | `acceptance_rate` | direct (0-1 decimal) |
| `latest.admissions.sat_scores.25th_percentile.critical_reading` | `sat_reading_25` | direct |
| `latest.admissions.sat_scores.75th_percentile.critical_reading` | `sat_reading_75` | direct |
| `latest.admissions.sat_scores.25th_percentile.math` | `sat_math_25` | direct |
| `latest.admissions.sat_scores.75th_percentile.math` | `sat_math_75` | direct |
| `latest.admissions.sat_scores.midpoint.critical_reading` + `latest.admissions.sat_scores.midpoint.math` | `sat_total_25` / `sat_total_75` | sum of 25th / 75th from each section |
| `latest.admissions.act_scores.25th_percentile.cumulative` | `act_25` | direct |
| `latest.admissions.act_scores.75th_percentile.cumulative` | `act_75` | direct |
| `latest.cost.tuition.in_state` | `tuition_in_state` | direct (USD) |
| `latest.cost.tuition.out_of_state` | `tuition_out_of_state` | direct (USD) |
| `latest.cost.attendance.academic_year` | `cost_of_attendance` | direct |
| `latest.cost.avg_net_price.overall` | `net_price_average` | direct |
| `latest.aid.pell_grant_rate` | `pell_grant_rate` | direct (0-1 decimal) |
| `latest.completion.rate_suppressed.overall` | `graduation_rate` | direct (0-1 decimal) |
| `latest.student.retention_rate.four_year.full_time` (or two-year equivalent) | `retention_rate` | direct |
| `latest.earnings.10_yrs_after_entry.median` | `median_earnings_10yr` | direct |
| `latest.student.share_firstgeneration` | `first_gen_pct` | direct |
| `latest.student.demographics.race_ethnicity.*` | `demographics` | build JSONB object |
| `latest.academics.program_percentage.*` | `program_breakdown` | build JSONB object keyed by 2-digit CIP |

### Locale code → setting mapping

```
11, 12, 13 → urban
21, 22, 23 → suburban
31, 32, 33 → town
41, 42, 43 → rural
```

### Carnegie size setting → size_category mapping

```
1, 6, 11        → very_small  (under 1,000)
2, 7, 12        → small       (1,000-2,999)
3, 8, 13        → medium      (3,000-9,999)
4, 9, 14        → large       (10,000-19,999)
5, 10, 15, 16+  → very_large  (20,000+)
```

### Region ID → region name mapping

```
0 → "U.S. Service Schools"
1 → "New England"
2 → "Mid East"
3 → "Great Lakes"
4 → "Plains"
5 → "Southeast"
6 → "Southwest"
7 → "Rocky Mountains"
8 → "Far West"
9 → "Outlying Areas"
```

### Backfilling existing fields

The legacy `acceptance_rate_min`, `acceptance_rate_max`, `avg_gpa_min`, `avg_gpa_max` columns should be populated as follows for backward compatibility:

- `acceptance_rate_min` = `acceptance_rate_max` = `acceptance_rate`
- `avg_gpa_min` / `avg_gpa_max`: Scorecard does not have GPA. Set both to `NULL`. (We'll backfill these from Common Data Set in a future spec.)

The `description` field should be left null for now or populated with a simple template like `"{name} is a {ownership} {school_type} institution in {city}, {state}."` for fallback display.

The `image_url` field should be left null. (Logos/imagery in a separate spec.)

### Deriving `interest_tags`

For each college, after ingestion:

1. Read `program_breakdown` (CIP code → percentage)
2. For each CIP code where percentage ≥ 5%, look up the corresponding interest tags from `cip_interest_mapping`
3. Union all returned tags, deduplicate
4. Store as `interest_tags` array

This means a college's tags reflect what students actually study there, not just what's offered.

---

## 6. Filtering Logic

Apply these filters during ingestion to keep the database focused on relevant institutions:

### API-level filters (in the request)

- Currently operating: `school.operating=1`
- Predominantly Associate's or Bachelor's: `school.degrees_awarded.predominant__range=2..3`
- Minimum enrollment: `latest.student.size__range=100..`

### Script-level filters (after fetch)

Skip records where:

- `school.name` is null or empty
- `school.state` is missing or not a valid 2-letter U.S. state/territory code
- `latest.student.size` is null
- `school.ownership` is `3` (private for-profit) AND `latest.completion.rate_suppressed.overall` < 0.20 — these are predatory low-completion for-profits we're excluding for equity reasons. Log how many are excluded.

### What stays in

- All public 4-year and 2-year colleges
- All private nonprofit 4-year and 2-year colleges
- Quality private for-profits (graduation rate ≥ 20%) — flagged via `ownership` so users can filter
- HBCUs, HSIs, tribal colleges, women's colleges — explicitly preserved with `designations` flags

Expected final count: **~3,000-3,500 institutions**.

---

## 7. Implementation: Seeding Script

### File location

```
scripts/seed-colleges.ts
```

### Dependencies to add

```bash
npm install --save-dev tsx dotenv
npm install @supabase/supabase-js  # likely already installed
```

If `@supabase/supabase-js` is already installed (it is per project structure), only `tsx` and `dotenv` need to be added as dev dependencies.

### Script structure

```typescript
// scripts/seed-colleges.ts
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
  'latest.academics.program_percentage', // returns nested object of all CIP percentages
].join(',');

// ===== API filters =====

const API_FILTERS = [
  'school.operating=1',
  'school.degrees_awarded.predominant__range=2..3',
  'latest.student.size__range=100..',
].join('&');

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
      .map((raw) => transformRecord(raw, cipMap))
      .filter((rec): rec is CollegeRecord => rec !== null);

    totalSkipped += response.results.length - transformed.length;

    if (transformed.length > 0) {
      const { error } = await supabase
        .from('colleges')
        .upsert(transformed, { onConflict: 'scorecard_id' });

      if (error) {
        console.error(`❌ Upsert failed on page ${page}:`, error);
        throw error;
      }

      totalUpserted += transformed.length;
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
  // ... all the columns from section 5
  [key: string]: unknown;
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
  const programKey = 'latest.academics.program_percentage';
  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith(programKey + '.') && typeof val === 'number' && val > 0) {
      // key looks like "latest.academics.program_percentage.engineering"
      // Need to map program name → 2-digit CIP code (see API docs for exact mapping)
      // For simplicity, see implementation note below.
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

  return {
    scorecard_id: raw.id,
    name: raw['school.name'].trim(),
    location_city: raw['school.city'] ?? null,
    location_state: raw['school.state'],
    zip_code: raw['school.zip']?.toString().slice(0, 5) ?? null,
    website_url: normalizeUrl(raw['school.school_url']),
    latitude: raw['location.lat'] ?? null,
    longitude: raw['location.lon'] ?? null,
    region: mapRegion(raw['school.region_id']),
    ownership: mapOwnership(ownership),
    school_type: mapSchoolType(raw['school.degrees_awarded.predominant']),
    setting: mapLocale(raw['school.locale']),
    size_category: mapSize(raw['school.carnegie_size_setting']),
    undergrad_enrollment: raw['latest.student.size'],
    total_enrollment: raw['latest.student.enrollment.all'] ?? raw['latest.student.size'],
    designations,
    acceptance_rate: acceptanceRate,
    acceptance_rate_min: acceptanceRate, // legacy compat
    acceptance_rate_max: acceptanceRate, // legacy compat
    sat_reading_25: satReading25 ?? null,
    sat_reading_75: satReading75 ?? null,
    sat_math_25: satMath25 ?? null,
    sat_math_75: satMath75 ?? null,
    sat_total_25: satReading25 && satMath25 ? satReading25 + satMath25 : null,
    sat_total_75: satReading75 && satMath75 ? satReading75 + satMath75 : null,
    act_25: raw['latest.admissions.act_scores.25th_percentile.cumulative'] ?? null,
    act_75: raw['latest.admissions.act_scores.75th_percentile.cumulative'] ?? null,
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
  };
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
    case 2: return 'private_nonprofit';
    case 3: return 'private_for_profit';
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
  if (code >= 31 && code <= 33) return 'town';
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

function mapRegion(code: number | null): string | null {
  const regions: Record<number, string> = {
    0: 'U.S. Service Schools',
    1: 'New England',
    2: 'Mid East',
    3: 'Great Lakes',
    4: 'Plains',
    5: 'Southeast',
    6: 'Southwest',
    7: 'Rocky Mountains',
    8: 'Far West',
    9: 'Outlying Areas',
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

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
```

### Note on `program_percentage` parsing

The Scorecard API returns program percentages as named keys, not CIP codes:
```
"latest.academics.program_percentage.engineering": 0.22,
"latest.academics.program_percentage.computer": 0.15,
...
```

The implementation needs a mapping from these program names to 2-digit CIP codes. This mapping is documented in the [Scorecard data dictionary](https://collegescorecard.ed.gov/data/data-documentation/). Build it as a constant in the script:

```typescript
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
```

Iterate `raw` keys, match against `latest.academics.program_percentage.<programName>`, look up CIP code, store in `programBreakdown`.

### Service role key requirement

This script writes to `colleges`, which has RLS. The script needs to use the **Supabase service role key**, not the anon key. Add to `.env`:

```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Project Settings → API → service_role>
```

⚠️ **Never commit this key.** It's already covered by `.gitignore` for `.env`, but verify before any commit.

---

## 8. Step-by-Step Implementation Order

Claude Code should execute in this exact order:

1. **Apply schema migration** via Supabase MCP — add new columns to `colleges` table per section 3.1
2. **Create `cip_interest_mapping` table** via Supabase MCP per section 3.2
3. **Seed `cip_interest_mapping`** with the rows from section 3.2 table (37 rows)
4. **Verify schema** — query both tables to confirm structure
5. **Add dependencies** — `npm install --save-dev tsx dotenv`
6. **Add script entry to `package.json`**:
   ```json
   "scripts": {
     "seed:colleges": "tsx scripts/seed-colleges.ts"
   }
   ```
7. **Confirm `SUPABASE_SERVICE_ROLE_KEY` exists in `.env`** — if not, prompt user to add it
8. **Create `scripts/seed-colleges.ts`** per section 7 (full script, not stub)
9. **Test with a single page first** — temporarily hard-code `totalRecords = 100` and run `npm run seed:colleges`. Verify ~80-100 records land in `colleges` table with all fields populated correctly. Spot-check 3-5 known schools (e.g., Harvard, UCLA, Diablo Valley College) for sanity.
10. **Remove the test cap and run the full script** — should take ~2-5 minutes
11. **Run validation queries** per section 9

---

## 9. Validation Queries

After seeding, run these queries via Supabase MCP and report results:

```sql
-- Total count (expect 3,000-3,500)
SELECT COUNT(*) FROM colleges;

-- Distribution by ownership
SELECT ownership, COUNT(*) FROM colleges GROUP BY ownership;

-- Distribution by school_type
SELECT school_type, COUNT(*) FROM colleges GROUP BY school_type;

-- Distribution by state (top 10)
SELECT location_state, COUNT(*)
FROM colleges
GROUP BY location_state
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Special designation counts
SELECT
  COUNT(*) FILTER (WHERE designations->>'hbcu' = 'true') AS hbcus,
  COUNT(*) FILTER (WHERE designations->>'hsi' = 'true') AS hsis,
  COUNT(*) FILTER (WHERE designations->>'tribal' = 'true') AS tribal,
  COUNT(*) FILTER (WHERE designations->>'women_only' = 'true') AS women_only
FROM colleges;

-- Data quality: how many have full admissions data?
SELECT
  COUNT(*) AS total,
  COUNT(acceptance_rate) AS has_acceptance_rate,
  COUNT(sat_total_75) AS has_sat,
  COUNT(act_75) AS has_act,
  COUNT(graduation_rate) AS has_grad_rate,
  COUNT(median_earnings_10yr) AS has_earnings
FROM colleges;

-- Spot check a few well-known schools
SELECT name, location_state, ownership, acceptance_rate, sat_total_75, undergrad_enrollment
FROM colleges
WHERE name IN ('Harvard University', 'Stanford University', 'University of California-Berkeley', 'Diablo Valley College', 'Spelman College', 'Howard University')
ORDER BY name;

-- Interest tag coverage
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE array_length(interest_tags, 1) > 0) AS has_tags,
  AVG(array_length(interest_tags, 1)) AS avg_tags
FROM colleges;
```

**Expected results:**
- Total count: 3,000-3,500
- Public + private_nonprofit should account for >85% of records
- Most populous states (CA, NY, TX, PA, FL) should each have 100+ schools
- HBCU count: ~100, HSI count: ~500+, women's colleges: ~30
- Spot-check schools should all be present with sensible data
- ≥80% of colleges should have ≥1 interest tag

---

## 10. Acceptance Criteria

This work is complete when:

- [ ] `colleges` table has all new columns from section 3.1
- [ ] `cip_interest_mapping` table exists and has all rows from section 3.2
- [ ] `scripts/seed-colleges.ts` exists and runs without errors
- [ ] `npm run seed:colleges` script is registered in `package.json`
- [ ] After running, `colleges` table contains 3,000+ records
- [ ] All validation queries from section 9 return expected results
- [ ] Spot-check schools (Harvard, Stanford, UC Berkeley, Diablo Valley, Spelman, Howard) all present with non-null core data
- [ ] No service role key, API key, or `.env` content committed to git

---

## 11. What's Next (NOT in this spec)

Once this is done and validated, the next specs will cover:

1. College detail page UI (read these enriched records)
2. College discovery page with filters (search, filter, sort the database)
3. Matching algorithm (score colleges against user profile)
4. Application deadlines sourcing (separate strategy: manual curation of top ~150 schools)
5. Logos/imagery sourcing
6. Scheduled refresh (convert script to Edge Function + cron)

Each will get its own spec. Don't bundle them together — keep PRDs focused.

---

## 12. Notes & Open Questions

- The `interest_tags` mapping in section 3.2 should be reconciled with whatever taxonomy Uplift's quick-start onboarding currently uses. If there's a mismatch, update the mapping seed values before running (this is much easier than refactoring afterwards).
- Religious affiliation is captured as a raw code for now. A future spec can build out the full code → name mapping (60+ denominations).
- Average GPA is intentionally null. Common Data Set ingestion will fill this gap later.
- For-profit filter (graduation rate < 20%) is conservative — adjust threshold if too many legitimate institutions are dropped. Log the exclusions during ingestion.