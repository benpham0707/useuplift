# College Database Feature Specification

**Feature:** College Discovery and Recommendations System
**Version:** 1.0 MVP
**Owner:** Tue Pham
**Status:** Draft - Awaiting Review
**Created:** 2026-03-23

---

## Executive Summary

The College Database is the core value proposition for high school students: after onboarding and building their profile, "what colleges should I apply to?" is the first question every student asks. This feature bridges the gap between "I have a profile" and "I have a plan."

**What we're building:**
- Comprehensive database of 300 colleges (top nationals, public flagships, HBCUs, HSIs, community colleges)
- Full-screen browse/filter/search gallery at `/dashboard/colleges`
- Detailed college pages with stats, program highlights, and application info
- User college list with Reach/Match/Safety categorization (stats-based, not AI)
- Client-side filtering and search for instant UX
- Free-tier feature (no credit cost) to drive engagement

**What we're NOT building (yet):**
- AI-powered match analysis (Phase 2-3)
- Application tracking (Phase 3)
- Supplemental essay prompt database (Phase 3)
- Admin UI for college management (use Supabase dashboard)

---

## Database Schema

### Core Table: `colleges`

**Indexed columns** (for fast filtering and sorting):

```sql
CREATE TABLE colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identity
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE, -- URL-friendly: 'stanford-university'
  description text, -- 2-3 sentence overview

  -- Location & setting
  city text NOT NULL,
  state text NOT NULL, -- Two-letter code: 'CA', 'NY'
  region text NOT NULL, -- 'West', 'Northeast', 'South', 'Midwest'
  campus_setting text CHECK (campus_setting IN ('urban', 'suburban', 'rural')),

  -- Type & size
  type text NOT NULL CHECK (type IN ('public', 'private', 'community')),
  size text CHECK (size IN ('small', 'medium', 'large')), -- <5k, 5k-15k, >15k undergrads
  enrollment_size integer, -- Exact undergraduate enrollment

  -- Admissions stats
  acceptance_rate numeric CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100), -- Percentage
  avg_gpa_min numeric CHECK (avg_gpa_min >= 0 AND avg_gpa_min <= 4.0),
  avg_gpa_max numeric CHECK (avg_gpa_max >= 0 AND avg_gpa_max <= 4.0),
  avg_sat_min integer CHECK (avg_sat_min >= 400 AND avg_sat_min <= 1600),
  avg_sat_max integer CHECK (avg_sat_max >= 400 AND avg_sat_max <= 1600),
  avg_act_min integer CHECK (avg_act_min >= 1 AND avg_act_min <= 36),
  avg_act_max integer CHECK (avg_act_max >= 1 AND avg_act_max <= 36),

  -- Financial
  tuition_in_state integer, -- Annual in-state tuition (if public)
  tuition_out_of_state integer, -- Annual out-of-state tuition
  financial_aid_percentage numeric, -- % of students receiving aid

  -- Branding & media
  website_url text,
  logo_url text, -- College logo for cards
  image_url text, -- Hero/campus image for detail page
  primary_color text, -- Hex code for brand color
  secondary_color text, -- Hex code for accent

  -- JSONB flexible data
  popular_majors jsonb DEFAULT '[]'::jsonb, -- Array of strings: ['Computer Science', 'Biology']
  program_strengths jsonb DEFAULT '[]'::jsonb, -- Array: ['Engineering', 'Pre-Med', 'Liberal Arts']
  interest_tags jsonb DEFAULT '[]'::jsonb, -- Array: ['research', 'sports', 'greek-life', 'diversity']
  student_demographics jsonb DEFAULT '{}'::jsonb, -- Object with percentage breakdowns
  application_deadlines jsonb DEFAULT '{}'::jsonb, -- {ea: '2025-11-01', ed: null, rd: '2026-01-15', rolling: false}
  required_materials jsonb DEFAULT '[]'::jsonb, -- Array: ['transcript', 'letters', 'sat-act', 'supplemental-essay']

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true -- Soft delete flag
);

CREATE INDEX idx_colleges_name ON colleges(name);
CREATE INDEX idx_colleges_state ON colleges(state);
CREATE INDEX idx_colleges_type ON colleges(type);
CREATE INDEX idx_colleges_acceptance_rate ON colleges(acceptance_rate);
CREATE INDEX idx_colleges_region ON colleges(region);
```

### User College List: `user_college_list`

Tracks which colleges a user has saved, with categorization and application status:

```sql
CREATE TABLE user_college_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,

  -- Categorization
  category text CHECK (category IN ('reach', 'match', 'safety') OR category IS NULL),
  -- NULL = uncategorized (user hasn't entered GPA/test scores yet)

  -- Application status (Phase 3 prep)
  status text NOT NULL DEFAULT 'interested' CHECK (status IN (
    'interested',
    'researching',
    'applying',
    'applied',
    'accepted',
    'denied',
    'waitlisted',
    'enrolled'
  )),

  -- User notes & ordering
  notes text, -- Personal notes about the school
  position integer, -- Manual reordering within category (future: drag-and-drop)

  -- Metadata
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, college_id) -- A user can save a college only once
);

CREATE INDEX idx_user_college_list_user ON user_college_list(user_id);
CREATE INDEX idx_user_college_list_category ON user_college_list(category);
CREATE INDEX idx_user_college_list_status ON user_college_list(status);
```

### College Reports: `college_reports`

User-submitted corrections for data quality feedback:

```sql
CREATE TABLE college_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES profiles(user_id) ON DELETE SET NULL, -- Allow anonymous/deleted users
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,

  -- Report details
  report_type text NOT NULL CHECK (report_type IN ('incorrect_stat', 'outdated_info', 'missing_program', 'other')),
  description text NOT NULL,

  -- Admin workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'fixed', 'dismissed')),
  admin_notes text,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_college_reports_status ON college_reports(status);
CREATE INDEX idx_college_reports_college ON college_reports(college_id);
```

### RLS Policies

```sql
-- Colleges: Public read for all authenticated users
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Colleges are viewable by authenticated users"
  ON colleges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User college list: Users can only manage their own list
ALTER TABLE user_college_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own college list"
  ON user_college_list FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert to their own college list"
  ON user_college_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own college list"
  ON user_college_list FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete from their own college list"
  ON user_college_list FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- College reports: Users can submit and view their own reports
ALTER TABLE college_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports"
  ON college_reports FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can submit reports"
  ON college_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);
```

---

## Data Seeding Strategy

### Source: College Scorecard API

**API:** https://collegescorecard.ed.gov/data/documentation/
**License:** Public domain (US Department of Education)
**Coverage:** Every accredited US institution

**Approach:** Hybrid (automated API pull + manual curation)

1. **Automated data (from API):**
   - Name, location (city, state)
   - Enrollment size
   - Acceptance rate
   - GPA ranges (25th-75th percentile)
   - SAT/ACT score ranges (25th-75th percentile)
   - Tuition (in-state, out-of-state)
   - Financial aid percentage
   - Type (public/private)
   - Website URL

2. **Manual curation (not in API or low quality):**
   - Program strengths (Engineering, Pre-Med, Liberal Arts, etc.)
   - Interest tags (research, sports, greek-life, diversity)
   - Campus setting (urban/suburban/rural) - API data is often wrong
   - Logo URL, image URL
   - Primary/secondary brand colors
   - Description (2-3 sentence overview)
   - Application deadlines (EA/ED/RD)
   - Required materials

### Priority List for ~300 Colleges

1. **Top nationals (~80):** Ivies, Stanford, MIT, CalTech, Duke, etc.
2. **Public flagships (~80):** UC system, UVA, UMich, UT Austin, UW Madison, etc.
3. **HBCUs/HSIs/MSIs (~60):** Howard, Spelman, Morehouse, UT El Paso, etc.
4. **Geographic coverage (~40):** At least 1-2 colleges per state
5. **Community colleges (~40):** Strong transfer programs to top universities

### Seed Script Implementation

**Location:** `scripts/seed-colleges.ts`

**Strategy:**
- Standalone Node.js script (can be rerun for bulk refresh)
- Uses College Scorecard API to fetch raw data
- Maps API fields to our schema
- Inserts to Supabase via client library
- Manually curated fields left as `NULL` to be filled via Supabase table editor
- Stores API response in `logs/college-scorecard-raw.json` for debugging

**Run frequency:**
- Once during initial development
- Re-run annually when new admissions data is published (~October each year)
- Individual college updates via Supabase dashboard

---

## Component Architecture

### Page Structure

```
/dashboard/colleges              → College gallery (browse/filter/search)
/dashboard/colleges/:slug        → College detail page (full page route)
/dashboard/colleges/my-list      → User's saved college list
```

### Component Tree

```
DashboardLayout (existing)
├── AppSidebar (existing) - Add "Colleges" nav item
└── Page Routes:
    ├── CollegesGallery
    │   ├── CollegeSearchBar
    │   ├── CollegeFilterBar
    │   │   ├── FilterDropdown (State)
    │   │   ├── FilterDropdown (Type)
    │   │   ├── FilterDropdown (Setting)
    │   │   ├── FilterDropdown (Major)
    │   │   └── SortDropdown
    │   ├── ActiveFiltersChips
    │   └── CollegeCardGrid
    │       └── CollegeCard[] (with lazy-loaded images)
    │
    ├── CollegeDetail
    │   ├── CollegeHeader (name, logo, location)
    │   ├── CollegeStats (acceptance rate, GPA/test ranges, tuition)
    │   ├── CollegeProgramHighlights (majors, strengths)
    │   ├── CollegeApplicationInfo (deadlines, materials)
    │   ├── CollegeActions (Add to List, Visit Website, Report Issue)
    │   └── ReportIssueModal
    │
    └── MyCollegeList
        ├── ListSummaryBar (count by category)
        ├── CategorySection (Uncategorized) - if any
        ├── CategorySection (Reach)
        ├── CategorySection (Match)
        └── CategorySection (Safety)
            └── CollegeListItem[] (compact cards)
```

### State Management

**Data fetching:** React Query for Supabase queries
- Cache colleges data globally (single fetch on mount)
- Invalidate/refetch on user profile updates (GPA/test score changes)

**Client-side filtering:**
```typescript
// All filtering happens in-memory on the ~300 college array
const filteredColleges = useMemo(() => {
  return colleges
    .filter(c => matchesSearchQuery(c, searchTerm))
    .filter(c => matchesStateFilter(c, selectedStates))
    .filter(c => matchesTypeFilter(c, selectedTypes))
    .filter(c => matchesSettingFilter(c, selectedSettings))
    .filter(c => matchesMajorFilter(c, selectedMajors))
    .sort(getSortComparator(sortBy));
}, [colleges, searchTerm, selectedStates, selectedTypes, selectedSettings, selectedMajors, sortBy]);
```

**Scroll position:** Store in React Router state or session storage to restore gallery scroll on back navigation from detail page

---

## UX Flow

### 1. Gallery Page (`/dashboard/colleges`)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ Search: [Stanford, MIT, Boston...        ] [Sort: A-Z ▼]  │
├────────────────────────────────────────────────────────────┤
│ Filters: [State ▼] [Type ▼] [Setting ▼] [Major ▼]        │
│ Active: [California ×] [Public ×]                          │
├────────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │      │  │      │  │      │  │      │  │      │        │
│  │ MIT  │  │ Stan │  │ Cal  │  │ UCLA │  │ USC  │        │
│  │      │  │ ford │  │      │  │      │  │      │        │
│  │      │  │      │  │      │  │      │  │      │        │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │      │  │      │  │      │  │      │  │      │        │
└────────────────────────────────────────────────────────────┘
```

**CollegeCard design** (priority hierarchy):
1. **Logo + Name** (visual brand identity)
2. **Location + Setting** (City, CA • Suburban)
3. **Key Stats** (23% acceptance • 3.7-4.0 GPA • 1400-1560 SAT)
4. **Match Indicator** (Badge: "Match" if on user's list and categorized)

**Card actions:**
- Click anywhere → Navigate to `/dashboard/colleges/:slug`
- "Add to List" button → Opens quick-save modal with category suggestion

**Search behavior:**
- Debounced typeahead (200ms)
- Search across: name, city, state
- Case-insensitive `.includes()` match
- Show instant dropdown with top 10 matches as user types

**Filter behavior:**
- All dropdowns are multi-select (can pick multiple states, multiple types, etc.)
- Active filters show as dismissible chips below the filter bar
- Clear all filters button
- Filters persist in URL query params (shareable links)

**Sort options:**
- Alphabetical (A-Z)
- Acceptance rate (most to least selective)
- Tuition (lowest to highest out-of-state)

**Performance:**
- Lazy-load images (only load when card enters viewport)
- Render first 50 results, "Load More" button if filtered count > 50

### 2. Detail Page (`/dashboard/colleges/:slug`)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Colleges                          [Prev] [Next] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│    ┌────┐  Stanford University                            │
│    │Logo│  Stanford, CA • Suburban • Private              │
│    └────┘                                                  │
│                                                            │
│    [Add to My List]  [Visit Website]  [Report Issue]      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Key Statistics                                            │
│  • Acceptance Rate: 4.3%                                   │
│  • GPA Range: 3.9-4.0 (unweighted)                         │
│  • SAT Range: 1470-1570                                    │
│  • Tuition: $57,693/year                                   │
│  • Financial Aid: 58% of students receive aid              │
│  • Enrollment: 7,761 undergraduates                        │
├────────────────────────────────────────────────────────────┤
│  Program Highlights                                        │
│  • Top Programs: Computer Science, Engineering, Biology    │
│  • Strengths: Research, Entrepreneurship, Athletics        │
│  • Popular Majors: CS, Engineering, Economics, Bio         │
├────────────────────────────────────────────────────────────┤
│  Application Information                                   │
│  • Deadlines:                                              │
│    - Restrictive Early Action: November 1, 2025            │
│    - Regular Decision: January 5, 2026                     │
│  • Required Materials:                                     │
│    - Common App, Transcript, 2 Teacher Recs, SAT/ACT       │
│    - Supplemental Essays (3-5 prompts)                     │
└────────────────────────────────────────────────────────────┘
```

**"Add to List" flow:**
1. User clicks "Add to My List"
2. If user has GPA/test scores on file:
   - Calculate suggested category (Reach/Match/Safety) using threshold logic
   - Show modal: "Save to your list as: [Reach ▼] [Save] [Cancel]"
   - User can override the suggestion via dropdown
3. If user does NOT have GPA/test scores:
   - Save with `category = null`
   - Show modal: "Saved! Add your GPA to get a Reach/Match/Safety suggestion."
4. Insert row to `user_college_list` with `status = 'interested'`

**"Report Issue" flow:**
1. User clicks "Report Issue" link (small text link at bottom of page)
2. Modal opens with:
   - Dropdown: Issue type (Incorrect stat, Outdated info, Missing program, Other)
   - Textarea: Description
   - [Submit] button
3. On submit → Insert to `college_reports`, show success toast, close modal

**Prev/Next navigation:**
- Arrow buttons to browse through colleges without returning to gallery
- Respects current filter context (if user filtered to "CA only", prev/next cycles through CA colleges)

### 3. My List Page (`/dashboard/colleges/my-list`)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ My College List                                            │
│ Summary: 3 Reach • 4 Match • 2 Safety                      │
│ [View: By Category ▼]                                      │
├────────────────────────────────────────────────────────────┤
│ Uncategorized • 1 school                                   │
│ ⚠ Add your GPA to categorize                               │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [Logo] Howard University                            │    │
│ │        Washington, DC • Urban • Private             │    │
│ │        [Override Category ▼] [Remove]               │    │
│ └────────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────┤
│ Reach • 3 schools                                          │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [Logo] Stanford University                          │    │
│ │        4.3% acceptance • $57k tuition               │    │
│ │        Status: Interested ▼   [View] [Remove]       │    │
│ └────────────────────────────────────────────────────┘    │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [Logo] MIT ...                                      │    │
│ └────────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────┤
│ Match • 4 schools                                          │
│ ...                                                        │
├────────────────────────────────────────────────────────────┤
│ Safety • 2 schools                                         │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

**List features:**
- Grouped by category (Uncategorized, Reach, Match, Safety)
- Each section shows count
- Compact card design (list row style, not full gallery card)
- Inline category override dropdown
- Inline status dropdown (Interested, Researching, Applying, etc.)
- Remove button (soft delete from user_college_list)
- Click card → Navigate to detail page
- Toggle view: "By Category" (default) vs "All" (flat list sorted by date added)

**Balance check tip:**
- If user has 5+ reaches and 0 safeties → Show tip: "💡 Most counselors recommend at least 2 safety schools."

---

## Reach/Match/Safety Classification Logic

**When to classify:**
- When user saves a college (if GPA/test scores exist)
- When user updates their GPA or test scores (recalculate all saved colleges)

**Where to run:**
- Client-side (instant, zero API calls)
- Simple stats comparison

**Algorithm:**

```typescript
type Category = 'reach' | 'match' | 'safety' | null;

function classifyCollege(
  college: College,
  userGPA: number | null,
  userSAT: number | null,
  userACT: number | null
): Category {
  // No user data → cannot classify
  if (!userGPA && !userSAT && !userACT) {
    return null;
  }

  const acceptanceRate = college.acceptance_rate;

  // Highly selective (< 20%): Always Reach or Match, never Safety
  if (acceptanceRate < 20) {
    // If user stats are SIGNIFICANTLY above college avg, it's a Match
    // Otherwise, it's a Reach
    const isAboveAverage = (
      (userGPA && college.avg_gpa_max && userGPA > college.avg_gpa_max + 0.2) ||
      (userSAT && college.avg_sat_max && userSAT > college.avg_sat_max + 100)
    );
    return isAboveAverage ? 'match' : 'reach';
  }

  // Moderate selectivity (20-50%): Use standard thresholds
  if (acceptanceRate >= 20 && acceptanceRate <= 50) {
    // Match = within 0.3 GPA OR 100 SAT points
    const isMatchByGPA = userGPA && college.avg_gpa_min && college.avg_gpa_max &&
      userGPA >= college.avg_gpa_min - 0.3 && userGPA <= college.avg_gpa_max + 0.3;

    const isMatchBySAT = userSAT && college.avg_sat_min && college.avg_sat_max &&
      userSAT >= college.avg_sat_min - 100 && userSAT <= college.avg_sat_max + 100;

    const isMatchByACT = userACT && college.avg_act_min && college.avg_act_max &&
      userACT >= college.avg_act_min - 2 && userACT <= college.avg_act_max + 2;

    if (isMatchByGPA || isMatchBySAT || isMatchByACT) {
      return 'match';
    }

    // Safety = 0.5+ GPA above OR 150+ SAT above
    const isSafetyByGPA = userGPA && college.avg_gpa_max &&
      userGPA >= college.avg_gpa_max + 0.5;

    const isSafetyBySAT = userSAT && college.avg_sat_max &&
      userSAT >= college.avg_sat_max + 150;

    const isSafetyByACT = userACT && college.avg_act_max &&
      userACT >= college.avg_act_max + 4;

    if (isSafetyByGPA || isSafetyBySAT || isSafetyByACT) {
      return 'safety';
    }

    // Below match thresholds = Reach
    return 'reach';
  }

  // High acceptance (> 50%): More generous thresholds
  if (acceptanceRate > 50) {
    // Match = within 0.4 GPA OR 150 SAT points
    const isMatchByGPA = userGPA && college.avg_gpa_min && college.avg_gpa_max &&
      userGPA >= college.avg_gpa_min - 0.4;

    const isMatchBySAT = userSAT && college.avg_sat_min &&
      userSAT >= college.avg_sat_min - 150;

    const isMatchByACT = userACT && college.avg_act_min &&
      userACT >= college.avg_act_min - 3;

    if (isMatchByGPA || isMatchBySAT || isMatchByACT) {
      return 'match'; // High-acceptance schools are usually Match or Safety, rarely Reach
    }

    return 'safety'; // If stats are close to college avg, it's a Safety
  }

  return null; // Fallback
}
```

**Constants (tunable):**
Store thresholds in a config object for easy adjustment based on user feedback:

```typescript
const CLASSIFICATION_THRESHOLDS = {
  highly_selective: {
    acceptance_rate: 20,
    match_gpa_buffer: 0.2,
    match_sat_buffer: 100,
  },
  moderate_selective: {
    acceptance_rate_min: 20,
    acceptance_rate_max: 50,
    match_gpa_buffer: 0.3,
    match_sat_buffer: 100,
    match_act_buffer: 2,
    safety_gpa_buffer: 0.5,
    safety_sat_buffer: 150,
    safety_act_buffer: 4,
  },
  high_acceptance: {
    acceptance_rate: 50,
    match_gpa_buffer: 0.4,
    match_sat_buffer: 150,
    match_act_buffer: 3,
  },
};
```

**Recalculation trigger:**
When user updates GPA/test scores in their profile:
1. Update `profiles` table
2. Client-side: Re-run `classifyCollege()` for all colleges in `user_college_list`
3. Batch update `user_college_list` rows with new categories
4. Show toast: "Your college list categories have been updated based on your new stats"

---

## API Routes & Edge Functions

### 1. GET `/api/colleges` (Client-side data fetch)

**Purpose:** Load all colleges for gallery page
**Implementation:** Direct Supabase query from client

```typescript
const { data: colleges, error } = await supabase
  .from('colleges')
  .select('*')
  .eq('is_active', true)
  .order('name', { ascending: true });
```

**Caching:** React Query with 10-minute stale time

### 2. GET `/api/colleges/:slug` (College detail)

**Purpose:** Load single college by slug
**Implementation:** Direct Supabase query from client

```typescript
const { data: college, error } = await supabase
  .from('colleges')
  .select('*')
  .eq('slug', slug)
  .eq('is_active', true)
  .single();
```

### 3. POST `/api/user-college-list` (Save college)

**Purpose:** Add college to user's list
**Implementation:** Direct Supabase insert from client (RLS enforces user_id match)

```typescript
const { data, error } = await supabase
  .from('user_college_list')
  .insert({
    user_id: user.id,
    college_id: collegeId,
    category: suggestedCategory, // 'reach' | 'match' | 'safety' | null
    status: 'interested',
    position: 0, // Future: calculate max position + 1 for ordering
  })
  .select()
  .single();
```

### 4. PATCH `/api/user-college-list/:id` (Update category/status)

**Purpose:** User overrides category or updates status
**Implementation:** Direct Supabase update from client

```typescript
const { data, error } = await supabase
  .from('user_college_list')
  .update({ category: 'match', status: 'applying' })
  .eq('id', listItemId)
  .select()
  .single();
```

### 5. DELETE `/api/user-college-list/:id` (Remove from list)

**Purpose:** Remove college from user's list
**Implementation:** Direct Supabase delete from client

```typescript
const { error } = await supabase
  .from('user_college_list')
  .delete()
  .eq('id', listItemId);
```

### 6. POST `/api/college-reports` (Submit correction)

**Purpose:** User reports data issue
**Implementation:** Direct Supabase insert from client

```typescript
const { error } = await supabase
  .from('college_reports')
  .insert({
    user_id: user.id,
    college_id: collegeId,
    report_type: 'incorrect_stat',
    description: 'Acceptance rate is wrong, should be 32%',
  });
```

**No backend routes needed** — all data access is via Supabase client with RLS policies.

---

## Integration Points

### 1. Dashboard Home Widget

**Location:** `src/pages/DashboardHome.tsx`

**Widget:** "Starter College List" (preview of 5-8 matched colleges)

**Logic:**
- If user has saved colleges → Show 5 from their list (mix of reach/match/safety)
- If user has NO saved colleges → Show 5 recommended based on GPA/location/major
- "View All Colleges" button → Links to `/dashboard/colleges`

**Implementation:**
```typescript
// Fetch user's saved colleges
const { data: savedColleges } = await supabase
  .from('user_college_list')
  .select('*, college:colleges(*)')
  .eq('user_id', user.id)
  .limit(5);

// If empty, recommend based on profile
if (!savedColleges.length) {
  const { data: recommended } = await supabase
    .from('colleges')
    .select('*')
    .eq('state', userState) // Filter by user's home state
    .limit(5);
}
```

### 2. AppSidebar Navigation

**Location:** `src/components/dashboard/AppSidebar.tsx`

**Add nav item:**
```typescript
const navItems = [
  { title: 'Home', href: '/dashboard', icon: Home },
  { title: 'Scanner', href: '/dashboard/scanner', icon: BarChart3 },
  { title: 'Insights', href: '/dashboard/insights', icon: Target },
  { title: 'Colleges', href: '/dashboard/colleges', icon: GraduationCap }, // NEW
  { title: 'Workshop', href: '/dashboard/workshop', icon: PenTool },
  { title: 'Pricing', href: '/dashboard/pricing', icon: Zap },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];
```

### 3. Profile Schema Extension

**Location:** `supabase/migrations/schema.sql` (profiles table)

**Ensure GPA/test score fields exist:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gpa numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gpa_scale text; -- '4.0', '5.0', '100'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sat_score integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS act_score integer;
```

**If these fields are already in `academic_journey` table:**
- Join `profiles` with `academic_journey` to get GPA/test scores for classification
- OR denormalize into `profiles` for faster access (recommended)

### 4. Router Updates

**Location:** `src/App.tsx`

**Add routes:**
```typescript
<Route path="/dashboard/colleges" element={<CollegesGallery />} />
<Route path="/dashboard/colleges/:slug" element={<CollegeDetail />} />
<Route path="/dashboard/colleges/my-list" element={<MyCollegeList />} />
```

---

## Edge Cases & Error Handling

### 1. Missing User Profile Data

**Scenario:** User hasn't entered GPA or test scores

**Behavior:**
- Gallery page: Full access to browse/filter/search
- Save college: Allowed, but `category = null`
- My List page: Show "Uncategorized" section with nudge to add GPA
- Detail page: "Add to List" button shows modal: "Saved! Add your GPA to see if this is a Reach, Match, or Safety."

### 2. Missing College Data

**Scenario:** College in database has `NULL` acceptance rate or GPA ranges

**Behavior:**
- Card shows "N/A" for missing stats
- Classification: Cannot calculate category → Save with `category = null`
- Filter: Exclude from acceptance rate filter if `NULL`

### 3. College Not Found (404)

**Scenario:** User navigates to `/dashboard/colleges/invalid-slug`

**Behavior:**
- Show 404 message: "We couldn't find that college. It may have been removed or the URL is incorrect."
- "Back to Colleges" button → Return to gallery

### 4. Duplicate Save Attempt

**Scenario:** User tries to save a college already on their list

**Behavior:**
- Database unique constraint prevents duplicate insert
- Show toast: "This college is already on your list"
- Optionally: Highlight the "View My List" button

### 5. Search Returns No Results

**Scenario:** User search query matches no colleges

**Behavior:**
- Show empty state: "No colleges found matching 'XYZ'. Try a different search term."
- Suggest clearing filters if any are active

### 6. Filter Combination Returns Empty

**Scenario:** User applies filters that exclude all colleges (e.g., "Urban + Community Colleges")

**Behavior:**
- Show empty state: "No colleges match your filters. Try broadening your search."
- Show active filters as dismissible chips

### 7. Slow Network / Loading States

**Scenario:** Colleges data takes >1s to load

**Behavior:**
- Show skeleton cards in grid (8-12 skeleton placeholders)
- Search/filter inputs disabled until data loads
- On error: Show error message with "Retry" button

---

## Security & Performance

### Security

1. **RLS Policies:** All tables have row-level security enabled
2. **User isolation:** Users can only read/write their own `user_college_list` rows
3. **No SQL injection:** All queries via Supabase client (parameterized)
4. **XSS protection:** Sanitize user-generated content (notes, report descriptions) on render
5. **Rate limiting:** Defer to Supabase's built-in rate limits (no custom backend needed)

### Performance

1. **Client-side filtering:** All 300 colleges loaded once, filtered in memory
   - Avg dataset size: ~300KB (compressed), loads in <1s
   - `useMemo` for filter/sort operations
   - Debounced search (200ms)

2. **Image optimization:**
   - Lazy-load college logos and images (IntersectionObserver)
   - Use placeholder images while loading
   - Serve images from CDN (if we host them) or use college official URLs

3. **React Query caching:**
   - Cache colleges data for 10 minutes
   - Cache user's saved colleges for 5 minutes
   - Invalidate on mutations (add/remove/update college in list)

4. **Render optimization:**
   - Virtual scrolling if grid > 50 cards (react-window or react-virtuoso)
   - OR simple pagination: Show first 50, "Load More" button

5. **Database indexes:**
   - Indexed on: `name`, `state`, `type`, `acceptance_rate`, `region`
   - Fast filtering and sorting via SQL if we ever move to server-side pagination

---

## Testing Strategy

### Unit Tests

1. **Classification logic:**
   - Test `classifyCollege()` with various GPA/SAT/ACT combinations
   - Test edge cases: `null` values, extreme stats, highly selective schools
   - Verify threshold constants are applied correctly

2. **Filter/search logic:**
   - Test search matches college name, city, state
   - Test multi-select filters (state, type, setting, major)
   - Test sort comparators (A-Z, acceptance rate, tuition)

### Integration Tests

1. **Save college flow:**
   - User clicks "Add to List" → Row inserted to `user_college_list`
   - Verify category suggestion is correct
   - Verify status defaults to 'interested'

2. **My List page:**
   - Verify colleges grouped by category
   - Verify category override updates database
   - Verify remove action deletes row

3. **Search & filter:**
   - Apply filters → Verify correct colleges shown
   - Search query → Verify typeahead works
   - Clear filters → Verify all colleges return

### E2E Tests

1. **Full browsing flow:**
   - Load gallery → Apply filters → Search → Click college → View detail → Save to list → Navigate to My List

2. **Profile update flow:**
   - Update GPA in profile → Verify all saved colleges recategorized

3. **Report issue flow:**
   - Click "Report Issue" → Fill form → Submit → Verify row in `college_reports`

---

## Metrics & Success Criteria

### Launch Metrics (first 30 days)

1. **Engagement:**
   - % of users who visit `/dashboard/colleges` after onboarding
   - Avg colleges browsed per session
   - Avg colleges saved per user

2. **List building:**
   - % of users who save at least 1 college
   - Avg colleges saved per user (target: 8-12)
   - Distribution of Reach/Match/Safety (target: balanced)

3. **Search & filter usage:**
   - % of sessions using search
   - % of sessions using filters
   - Most popular filters (state, type, major)

4. **Detail page:**
   - Avg time on college detail page
   - % of detail page views that result in "Add to List"

### Data Quality

1. **Report submission rate:**
   - Track `college_reports` volume
   - Identify colleges with most reports (data quality issues)

2. **Missing data:**
   - Track % of colleges with `NULL` acceptance rate, GPA ranges, etc.
   - Prioritize manual curation for top 80 nationals

---

## Future Enhancements (Post-MVP)

### Phase 2: AI-Powered Matching

- Analyze user's full profile (essays, activities, character) vs college culture
- Generate "Why this school fits you" personalized insights
- Surface "hidden gem" colleges user might not know about

### Phase 3: Application Tracking

- Track application status for each college (not just interested/applying)
- Checklist for required materials (transcript, LORs, essays)
- Deadline reminders and notifications
- Link to essay prompts for supplemental essays

### Phase 4: Financial Aid Planning

- Net price calculator integration
- Scholarship database per college
- Financial fit analysis based on family income

### Phase 5: Comparison Tool

- Side-by-side comparison of 2-3 colleges
- Visual charts for stats comparison
- Pros/cons list generator

---

## Dependencies & Prerequisites

### Before Development Starts

1. **Database migration:**
   - Create `colleges`, `user_college_list`, `college_reports` tables
   - Add GPA/test score fields to `profiles` (or join with `academic_journey`)

2. **Seed data:**
   - Run seed script to populate 300 colleges
   - Manually curate top 80 nationals (logos, colors, descriptions)

3. **UI components:**
   - College card component (reusable)
   - Filter dropdown component (multi-select)
   - Search bar with typeahead

### External Dependencies

- **College Scorecard API:** For seed data (free, no API key required)
- **React Query:** For data fetching and caching
- **React Router:** For navigation and scroll restoration
- **Supabase:** For database and RLS policies

---

## Migration Plan

### Step 1: Database Schema

**File:** `supabase/migrations/20260323_college_database.sql`

```sql
-- Create colleges table
CREATE TABLE colleges (...);
CREATE INDEX idx_colleges_name ON colleges(name);
-- ... (see Database Schema section)

-- Create user_college_list table
CREATE TABLE user_college_list (...);
CREATE INDEX idx_user_college_list_user ON user_college_list(user_id);
-- ... (see Database Schema section)

-- Create college_reports table
CREATE TABLE college_reports (...);
CREATE INDEX idx_college_reports_status ON college_reports(status);
-- ... (see Database Schema section)

-- Enable RLS and create policies
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Colleges are viewable by authenticated users" ...;
-- ... (see Database Schema section)
```

**Run migration:**
```bash
supabase db push
```

### Step 2: Seed Script

**File:** `scripts/seed-colleges.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const COLLEGE_SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools';

async function seedColleges() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Fetch 300 colleges from API
  const response = await axios.get(COLLEGE_SCORECARD_API, {
    params: {
      'fields': 'school.name,school.city,school.state,school.school_url,admissions.acceptance_rate,...',
      'per_page': 300,
      // Add filters for top nationals, flagships, HBCUs, etc.
    },
  });

  // Map API response to our schema
  const colleges = response.data.results.map((college: any) => ({
    name: college['school.name'],
    slug: slugify(college['school.name']),
    city: college['school.city'],
    state: college['school.state'],
    // ... map other fields
  }));

  // Insert to database
  const { error } = await supabase.from('colleges').insert(colleges);
  if (error) console.error('Seed error:', error);
  else console.log(`Seeded ${colleges.length} colleges`);
}

seedColleges();
```

**Run seed:**
```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-colleges.ts
```

### Step 3: Manual Curation

After seed script runs:
1. Open Supabase table editor
2. For top 80 nationals:
   - Add `logo_url` (find official college logo URLs)
   - Add `image_url` (campus hero image)
   - Add `primary_color` and `secondary_color` (school brand colors)
   - Add `description` (2-3 sentence overview)
   - Verify `campus_setting` (API data often wrong)
   - Add `program_strengths`, `interest_tags`, `popular_majors`

### Step 4: Component Development

**Order:**
1. Build `CollegeCard` component (reusable)
2. Build `CollegesGallery` page (grid + filters + search)
3. Build `CollegeDetail` page (stats + programs + application info)
4. Build `MyCollegeList` page (grouped by category)
5. Add nav item to `AppSidebar`
6. Add routes to `App.tsx`
7. Add "Starter College List" widget to `DashboardHome`

### Step 5: Testing

1. Unit test classification logic
2. Integration test save/remove flows
3. E2E test full browsing → save → list flow
4. Test with various user profiles (no GPA, only SAT, both, neither)

### Step 6: Deploy

1. Run migration on production Supabase
2. Run seed script against production database
3. Deploy frontend code
4. Monitor metrics dashboard for engagement

---

## Open Questions / Decisions Needed

1. **Logo/image hosting:** Should we host college logos/images on our own CDN, or hotlink to official URLs?
   - **Recommendation:** Hotlink to official URLs for MVP (saves storage costs), migrate to CDN if we experience broken links

2. **GPA normalization:** How to handle weighted vs unweighted GPA?
   - **Recommendation:** Store `gpa_scale` field in profiles ('4.0', '5.0', '100'), normalize to 4.0 scale for comparison

3. **Test-optional colleges:** How to classify colleges that don't require SAT/ACT?
   - **Recommendation:** If college has `NULL` test score ranges, classification uses GPA only

4. **International colleges:** Out of scope for MVP?
   - **Recommendation:** Yes, defer to Phase 2+. Focus on US colleges only for now.

5. **Community college transfers:** Track intended transfer destination?
   - **Recommendation:** Not MVP. Phase 3 feature: "Transfer Pathways" for community colleges.

---

## Conclusion

This spec covers the full College Database feature from database design to UX flows to integration points. The MVP focuses on:

1. **Core value:** Browse 300 colleges, filter/search/sort, save to a personalized list
2. **Engagement driver:** Free-tier feature to get students invested in the platform
3. **Stats-based categorization:** Simple Reach/Match/Safety logic (no AI, instant UX)
4. **Future-ready schema:** Application deadlines and requirements already in database for Phase 3

**Next steps:**
1. Review this spec
2. Approve/request changes
3. Proceed with implementation (database migration → seed script → components)

**Estimated implementation time:** 3-5 days for full MVP (1 day DB + seed, 2-3 days components, 1 day testing/polish)
