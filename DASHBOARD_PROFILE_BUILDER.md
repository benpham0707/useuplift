# PRD: Dashboard Profile Builder — Unified Intake & Widget Refactor

## Overview

Refactor the Welcome + Profile Progress widget and build an integrated profile completion system that lets users fill out their entire profile directly from the dashboard — no navigating to separate pages. Each profile section opens as a slide-out drawer (sheet) with a guided wizard. When a section is saved, the dashboard immediately reflects the progress and unlocks features.

This PRD also fixes visual issues with the current welcome widget (duplicate greeting, formatting, display name) and establishes the canonical data intake pipeline for all user data.

---

## CRITICAL: Discovery First

**You have Supabase MCP connected. Use it.**

Before writing ANY code:

1. **Explore the full project structure** — read `src/`, `src/components/`, `src/pages/`, `src/hooks/`, `src/lib/` to understand current file organization.
2. **Use Supabase MCP to inspect the full database schema** — specifically these tables: `profiles`, `personal_information`, `academic_journey`, `experiences_activities`, `family_responsibilities`, `goals_aspirations`, `support_network`, `personal_growth`. Understand every column, type, and constraint before building forms.
3. **Read the current dashboard page** — find DashboardHome or equivalent. Understand how widgets are laid out and styled.
4. **Read the current Welcome/Profile Progress widget** — understand its current implementation, the `useProfileCompletion` hook, and how it determines section completion.
5. **Read the existing portfolio pathway components** — look in `src/components/portfolio/` for existing section wizards (PortfolioPathway.tsx, any section-specific components). These contain form logic and field definitions that should be reused or referenced, NOT duplicated from scratch.
6. **Read the auth setup** — understand how to get `user.id` and `profile.id` for database operations.
7. **Check for existing form patterns** — see how other forms in the app handle validation, saving, loading states, and error handling.

**Do not assume any file names, paths, or schema details. Discover them.**

---

## Part 1: Fix the Welcome Widget

### Current Problems (visible in screenshot)

1. **Duplicate greeting** — There's a "Good afternoon, benpham0707" in the top bar AND "Good afternoon, benpham0707!" inside the widget card. The widget should NOT repeat the greeting that's already in the page header. If there's a page-level greeting bar, the widget should not have its own greeting. Pick one location — the widget card is the right place. Remove or suppress the page-level duplicate.

2. **Display name fallback** — Showing "benpham0707" (likely an email prefix or user_id) is not welcoming. The greeting should use `profiles.first_name` if available. If `first_name` is null, use a warm generic: "Good afternoon!" with no name. Never show raw usernames or email prefixes.

3. **Inconsistent counts** — The ring shows "20%" but the checklist shows "0 of 5 done." If quick-start is complete (which it must be since they're on the dashboard), the count should say "1 of 6 done" or the percentage and count must be consistent. Audit the `useProfileCompletion` hook to ensure the ring percentage and the section count agree.

4. **The widget feels disconnected from action** — The checklist shows sections but they're not clickable. The only action is the "Complete Now" button at the bottom. Each section in the checklist should be tappable to open that section's intake wizard directly.

### Widget Redesign

The widget should have this structure:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Good afternoon, Ben!                              ┌──────────┐    │
│  Tue, Apr 28, 2026                                 │          │    │
│                                                    │   20%    │    │
│  Your profile sections:                            │          │    │
│                                                    └──────────┘    │
│  ✓ Quick Start                    (completed)      Profile Complete │
│  ○ Activities & Experience  ←     (click to start) 1 of 7 done     │
│  ○ Academic Details               (click to start)                 │
│  ○ Goals & Aspirations            (click to start)                 │
│  ○ Identity & Demographics        (click to start)                 │
│  ○ Family Context                 (click to start)                 │
│  ○ Support Network                (click to start)                 │
│  ○ Personal Growth                (click to start)                 │
│                                                                     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                     │
│  Recommended next: Activities & Experience                          │
│  Add your activities to unlock portfolio analysis                   │
│                                          Complete Now · ~10 min →   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Each section row in the checklist is a **clickable button** that opens a drawer/sheet for that section
- The recommended next section (first incomplete by priority) has a subtle highlight or arrow indicator
- Completed sections show a green checkmark and slightly muted text
- The "Complete Now" button in the CTA area opens the same drawer as clicking the recommended section
- The progress ring and "X of 7 done" count are always in sync

---

## Part 2: Profile Section Drawers

### UX Pattern: Sheet/Drawer

When a user clicks a section (either from the checklist or the CTA button), a **slide-out drawer** opens from the right side of the screen. This keeps the user on the dashboard — they never navigate away.

**Use the shadcn/ui `Sheet` component** (check if it's already in the project's ui components). The sheet should:
- Slide in from the right
- Be wide enough for comfortable form filling (~480px on desktop, full-width on mobile)
- Have a clear title showing which section they're completing
- Have a close button (X) in the top-right
- Have a "Save & Close" button at the bottom
- Show a loading state while data is being fetched/saved
- Auto-save is NOT needed for these — explicit save on button click
- If the user has existing data in this section, pre-fill the form

**When the drawer closes after saving:**
1. The `useProfileCompletion` hook refetches / recalculates
2. The welcome widget updates the ring and checklist immediately
3. A toast notification confirms: "Activities saved! Portfolio scanner is now unlocked."
4. If this was the recommended section, the next recommendation updates

### Alternative if Sheet doesn't work well:
If the Sheet component creates issues with the dashboard layout, use a full-screen modal (`Dialog`) instead. The key requirement is that the user stays on the dashboard URL and returns to their dashboard view after completing a section.

---

## Part 3: The Seven Section Wizards

Each section is a form inside the drawer. The forms should be well-organized with clear field groupings and labels. Use existing shadcn/ui form components (Input, Select, Textarea, Checkbox, RadioGroup, etc.).

**Before building each section form, use Supabase MCP to read the exact schema of the target table.** The field names, types, constraints, and defaults below are directional — the actual database schema is the source of truth.

### Section 1: Activities & Experience
**Target table:** `experiences_activities`
**Estimated time:** 10-15 min
**Priority:** 1 (highest — unlocks scanner)

**Form design:** This is the most complex section. Use a tabbed or accordion layout with categories:

- **Work Experience** — repeatable entry: title, organization, role, start/end dates, hours/week, description
- **Extracurriculars** — repeatable entry: activity name, role/position, years involved, hours/week, description, achievements
- **Volunteering** — repeatable entry: organization, role, hours, description
- **Projects** — repeatable entry: project name, description, technologies/skills used, outcome/impact
- **Leadership Roles** — repeatable entry: position, organization, responsibilities, impact
- **Academic Honors** — repeatable entry: honor/award name, level (school/regional/national), year
- **Recognition** — repeatable entry: type, description, year

**UX guidance:**
- Start with a simple prompt: "Tell us about your activities, work, and achievements. Start with whatever comes to mind — you can always add more later."
- Each category starts collapsed with an "Add [category]" button
- When adding an entry, show a mini-form with the relevant fields
- Allow reordering entries within each category
- Show a running count: "3 activities added"
- Minimum to mark section complete: 2 entries total across all categories

**Data storage:** Each category maps to a JSONB array column on `experiences_activities`. Check the actual column names via Supabase MCP (likely `work_experiences`, `extracurriculars`, `volunteer_service`, `personal_projects`, `leadership_roles`, `academic_honors`, `formal_recognition`).

---

### Section 2: Academic Details
**Target table:** `academic_journey`
**Estimated time:** 5-8 min
**Priority:** 2 (refines college matching)

**Pre-fill from gate:** The quick-start already captured school name, graduation year, and GPA range. Pre-fill what's available and let them refine.

**Form fields (grouped):**

**School Info:**
- Current school name (pre-filled from profiles.school_name)
- Current grade / year
- Expected graduation date (pre-filled from profiles.graduation_year)
- School context flags: boarding school, homeschooled, studied abroad

**GPA & Class Standing:**
- Exact GPA (numeric input — this upgrades from the range captured at gate)
- GPA scale (4.0, 5.0, 100-point, etc.)
- GPA type (weighted, unweighted)
- Class rank (exact, decile, quartile, quintile, or "school doesn't rank")
- Class size

**Coursework:**
- Course history (add courses with name, level, grade — or skip for now)
- College courses taken (dual enrollment)

**Testing:**
- "Do you want to report test scores?" toggle
- If yes: SAT composite + section scores, or ACT composite + section scores
- AP exams (add with subject + score)
- IB exams if applicable
- English proficiency if applicable

**UX guidance:**
- GPA is the key field here — emphasize it. "Your GPA range from signup was [3.5-4.0]. Want to enter your exact GPA for more accurate college matching?"
- Testing section should default to collapsed unless they indicated test scores in quick-start
- Course history is the lowest priority — let them skip it easily

---

### Section 3: Goals & Aspirations
**Target table:** `goals_aspirations`
**Estimated time:** 5 min
**Priority:** 3 (enables opportunity matching)

**Pre-fill from gate:** Interest areas from quick-start can pre-populate career interests.

**Form fields:**

**Academic Direction:**
- Intended major (text input with suggestions)
- Highest degree planned (dropdown: bachelor's, master's, PhD, MD, JD, other, undecided)

**Career:**
- Career interests (multi-select tags, seeded from interest_areas)

**College Preferences:**
- College environment preferences (multi-select: small classes, research opportunities, urban campus, strong athletics, diverse student body, etc.)
- Applying to UC system? (yes/no/maybe)
- Using Common App? (yes/no/maybe)
- Intended start date (fall 2025, spring 2026, etc.)

**Location & Financial:**
- Geographic preferences (multi-select regions or states)
- Need-based financial aid? (yes/no/unsure)
- Merit scholarship interest? (yes/no/unsure)

**UX guidance:**
- This should feel like a casual conversation, not a form. Use friendly labels: "Where do you see yourself?" instead of "Geographic Preferences."
- "Undecided" should always be a valid and non-judgmental option for major and career.

---

### Section 4: Identity & Demographics
**Target table:** `personal_information`
**Estimated time:** 3-5 min
**Priority:** 4

**Pre-fill:** first_name from profiles

**Form fields:**

**Basic:**
- First name (pre-filled), last name, preferred name
- Date of birth
- Pronouns (dropdown + custom option)

**Contact:**
- Primary email (auto-filled from auth, read-only)
- Phone number

**Background (all optional, clearly labeled as such):**
- Gender identity
- Hispanic/Latino? → if yes, background detail
- Race/ethnicity (multi-select)
- Citizenship status
- Primary language, other languages

**Family Context (brief):**
- Living situation
- Household size
- Household income range (for financial aid estimation)
- First-generation college student? (yes/no)
- Parent/guardian education level

**UX guidance:**
- Lead with: "This helps us find scholarships and programs designed for students like you. Everything is optional."
- Group optional demographic fields in a clearly labeled "Optional" section
- Never require demographic information
- Income question should note: "Used only for financial aid program matching. We never share this."

---

### Section 5: Family & Life Context
**Target table:** `family_responsibilities`
**Estimated time:** 3-5 min
**Priority:** 5

**Form fields:**
- Family responsibilities (multi-select: childcare, elder care, cooking/cleaning, transportation, translation, financial contribution, etc.)
- Hours per week spent on family responsibilities
- Other responsibilities (free text)
- Challenging circumstances? (toggle)
- If yes: circumstance types (multi-select: illness, financial hardship, housing instability, etc.) + free text
- Other circumstances (free text)

**UX guidance:**
- Frame positively: "Many students juggle responsibilities beyond school. Telling us about yours helps us give you credit for everything you manage and adjust our recommendations to your real schedule."
- This section should feel safe and supportive, not clinical
- Make it clear that having no family responsibilities is completely fine — "Nothing to add? No problem. Hit Save & Close."

---

### Section 6: Support Network
**Target table:** `support_network`
**Estimated time:** 3-5 min
**Priority:** 6

**Form fields:**
- School counselor: name, email, relationship quality
- Teachers who know you well (repeatable: name, subject, relationship)
- Community organizations that support you (repeatable: name, role, how they help)
- Do you have portfolio items to showcase? (toggle + add items)
- Do you have documents to upload? (toggle — upload functionality can be a placeholder for now)

**UX guidance:**
- "Who's in your corner? These are people who can write recommendations, connect you to opportunities, or vouch for your character."
- Keep it lightweight — names and brief details, not full profiles of each person

---

### Section 7: Personal Growth & Narrative
**Target table:** `personal_growth`
**Estimated time:** 10-15 min
**Priority:** 7 (lowest — most reflective, least urgent)

**Form fields:**
- Meaningful experiences (structured prompts):
  - "Describe a challenge you've overcome and what you learned from it"
  - "What's an experience that changed how you see the world?"
  - "What are you most proud of that isn't on your transcript?"
- Additional context:
  - "Is there anything else colleges should know about you?"
  - "Are there circumstances that affected your academic performance?"

**UX guidance:**
- This is the most reflective section. Position it as: "These responses become the raw material for your personal statements and essays. Think of it as brainstorming — nothing here needs to be polished."
- Provide word count guidance: "A paragraph or two is perfect. You can always come back and add more."
- Make it clear this section can also be built up over time through journal entries

---

## Part 4: Completion Score System

### Update `useProfileCompletion` Hook

The hook must be refactored to:

1. **Check each canonical table** for the existence and quality of data (not just boolean flags)
2. **Calculate a weighted score** using these weights:

| Section | Weight | Completion Criteria |
|---------|--------|-------------------|
| Quick Start (gate) | 0.10 | `profiles.onboarding_completed = true` |
| Activities & Experience | 0.25 | `experiences_activities` row with 2+ total entries across all arrays |
| Academic Details | 0.20 | `academic_journey` row with `gpa` populated |
| Goals & Aspirations | 0.15 | `goals_aspirations` row with `intended_major` or `career_interests` populated |
| Identity & Demographics | 0.10 | `personal_information` row with `first_name` and `last_name` |
| Family Context | 0.05 | `family_responsibilities` row exists |
| Support Network | 0.05 | `support_network` row exists |
| Personal Growth | 0.10 | `personal_growth` row with non-empty `meaningful_experiences` |

3. **Return section-level status** so the widget can render each section's completion state
4. **Return the recommended next section** (first incomplete section in priority order: activities → academics → goals → identity → family → support → growth)
5. **Persist the score** — after calculating, update `profiles.completion_score` so other features can read it without recalculating

### Create Database Function (via Supabase MCP)

Create a Postgres function `recalculate_completion_score(p_profile_id uuid)` that:
- Queries each canonical table
- Applies the weights above
- Updates `profiles.completion_score`
- Returns the new score

This function should be callable from the application after any section save. Alternatively, create triggers on each canonical table that auto-recalculate on insert/update.

---

## Part 5: Database Changes

### Use Supabase MCP for all schema changes.

**Check and ensure these tables exist with proper structure:**
- `personal_information` — must have `profile_id` FK to `profiles.id`
- `academic_journey` — must have `profile_id` FK to `profiles.id`
- `experiences_activities` — must have `profile_id` FK to `profiles.id`
- `family_responsibilities` — must have `profile_id` FK to `profiles.id`
- `goals_aspirations` — must have `profile_id` FK to `profiles.id`
- `support_network` — must have `profile_id` FK to `profiles.id`
- `personal_growth` — must have `profile_id` FK to `profiles.id`

**Ensure RLS policies exist** on all canonical tables so users can only read/write their own data (match `profile_id` to the authenticated user's profile).

**Check for unique constraints** on `profile_id` for tables that should be 1:1 (all of them except potentially `academic_journey` which may allow multiple rows — check current schema).

**If `profiles.has_completed_assessment` exists,** leave it for now but stop writing to it from any new code. Add a comment in code: `// DEPRECATED: use completion_score instead`

---

## Part 6: Component Architecture

```
src/
  components/
    dashboard/
      WelcomeProfileWidget.tsx          — Refactored widget (or whatever it's currently named)
      ProfileSectionDrawer.tsx          — Reusable drawer wrapper (uses Sheet component)
      sections/
        ActivitiesSection.tsx           — Activities form
        AcademicsSection.tsx            — Academic details form  
        GoalsSection.tsx                — Goals & aspirations form
        IdentitySection.tsx             — Personal information form
        FamilySection.tsx               — Family context form
        SupportSection.tsx              — Support network form
        GrowthSection.tsx               — Personal growth form
  hooks/
    useProfileCompletion.ts             — Refactored completion hook
    useProfileSection.ts                — Generic hook for loading/saving a section
```

### `useProfileSection` Generic Hook

```typescript
// Handles the load → edit → save cycle for any profile section
function useProfileSection<T>(tableName: string) {
  // Returns:
  // - data: T | null (existing data from table, null if no row)
  // - isLoading: boolean
  // - save: (values: Partial<T>) => Promise<void>  (upserts to table)
  // - isSaving: boolean
  // - error: string | null
  
  // On save:
  // 1. Upsert to the target table (insert if no row, update if exists)
  // 2. Call recalculate_completion_score or manually update profiles.completion_score
  // 3. Invalidate/refetch the useProfileCompletion hook data
}
```

### `ProfileSectionDrawer` Wrapper

```typescript
// Wraps each section form in a consistent Sheet/Drawer shell
interface ProfileSectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;           // e.g., "Activities & Experience"
  description: string;     // e.g., "Tell us about your activities..."
  estimatedTime: string;   // e.g., "~10 min"
  children: React.ReactNode;
}
```

---

## Part 7: Data Flow

```
User clicks section in widget
        │
        ▼
ProfileSectionDrawer opens
        │
        ▼
useProfileSection(tableName) loads existing data
        │
        ▼
Form renders (pre-filled if data exists)
        │
        ▼
User fills out fields
        │
        ▼
User clicks "Save & Close"
        │
        ▼
useProfileSection.save() upserts to canonical table
        │
        ▼
recalculate_completion_score() updates profiles.completion_score
        │
        ▼
Drawer closes → useProfileCompletion refetches
        │
        ▼
Widget updates: ring fills, section shows ✓, next section highlighted
        │
        ▼
Toast: "Activities saved! Portfolio scanner is now unlocked."
```

---

## Part 8: Edge Cases

1. **User opens a section they already completed** — Form pre-fills with existing data. They can edit and re-save.
2. **User closes drawer without saving** — No data is lost (nothing was written). No confirmation dialog needed unless they've typed something (track dirty state).
3. **User has data in the table from the old portfolio pathway** — Great, it pre-fills. The drawer becomes an edit interface.
4. **Database errors on save** — Show an error toast. Don't close the drawer. Let them retry.
5. **Slow network** — Show a loading spinner on the Save button. Disable double-clicks.
6. **Mobile viewport** — Sheet should be full-width on mobile. Forms should stack fields vertically.
7. **Activities section with many entries** — Add a scrollable area within the drawer. Don't let the drawer become taller than the viewport.

---

## Part 9: Visual Polish Requirements

- **No duplicate greetings.** The greeting should appear in exactly one place.
- **Ring and count must be in sync.** If the ring says 20%, the count must reflect the same completion.
- **Display name must use first_name**, never raw usernames or email addresses.
- **Section checklist items must be visually interactive** — hover state, cursor pointer, subtle highlight on the recommended section.
- **Completed sections** — green checkmark, section name in normal weight.
- **Incomplete sections** — empty circle, section name clickable with hover effect.
- **Recommended section** — highlighted row (subtle background color or left border accent), with "← Start here" or arrow indicator.
- **The widget card should have consistent padding, borders, and shadows** matching other dashboard cards.
- **Drawer transitions should be smooth** — 300ms slide-in from right.

---

## Part 10: Acceptance Criteria

1. Welcome widget shows correct greeting with `first_name` (no raw usernames)
2. No duplicate greeting between page header and widget
3. Progress ring percentage matches section completion count
4. All 7 profile sections appear in the checklist and are clickable
5. Clicking a section opens a drawer with the appropriate form
6. Forms load existing data if the user has previously saved that section
7. Saving a section updates the database, recalculates completion score, and updates the widget
8. The recommended next section is visually highlighted and matches priority order
9. At 100% completion, the CTA area shows a success state
10. All forms save to the correct canonical Supabase tables
11. RLS policies are in place on all canonical tables
12. The experience works on both desktop and mobile viewports
13. Toast notifications confirm saves and announce feature unlocks
14. Activities section requires at least 2 entries to count as complete
15. All TypeScript — no `any` types, proper interfaces for all form data

---

## Out of Scope

- Quest system and XP rewards (separate feature)
- Portfolio scanner functionality (reads from the data this collects, but is built separately)
- College matching algorithm (separate feature, reads from this data)
- Deleting or migrating legacy onboarding components (do that separately after this is verified working)
- Application wizard refactor (separate effort)
- Journal system (separate feature)