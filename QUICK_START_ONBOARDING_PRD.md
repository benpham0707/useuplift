# PRD: Mandatory Quick-Start Onboarding

## Overview

When a new user creates an account on Uplift, they must complete a short 3-screen onboarding flow (~2-3 minutes) before accessing their dashboard. This quick-start captures the minimum data needed to deliver a partially personalized experience on day one. The full assessment is completed progressively over the following days via the quest system (out of scope for this PRD).

## Goals

- Get new users to a personalized dashboard in under 3 minutes
- Capture enough data to power basic college discovery, deadline awareness, and interest-based recommendations
- Feel fast, modern, and encouraging — not like a boring form
- Store all data in Supabase so downstream features can read from it immediately
- Gate dashboard access until quick-start is complete

## User Flow

### Screen 1: "Who are you?"

**Purpose:** Determine academic path to route all future experiences.

**UI:**
- Headline: "Let's get to know you" (or similar warm copy)
- Subheadline: "This helps us personalize everything for you"
- 4 large, tappable cards in a 2x2 grid:
  - **High School Student** — icon + "I'm preparing for college"
  - **College Student** — icon + "I'm in undergrad or community college"  
  - **Professional / Working** — icon + "I'm early in my career"
  - **Gap Year / Other** — icon + "I'm figuring things out"
- Single select — tapping one highlights it and enables the "Continue" button
- Progress indicator showing step 1 of 3

**Data captured:**
- `academic_path`: enum `'high_school' | 'college' | 'professional' | 'gap_year'`

---

### Screen 2: "Where are you right now?"

**Purpose:** Capture academic context for college fit scoring and deadline awareness.

**UI:**
- Headline: "Tell us a bit about your academics"
- Fields adapt based on Screen 1 selection:

**If High School:**
- School name (text input with autocomplete if possible, or free text)
- Graduation year (dropdown: current year through +4 years)
- GPA range (segmented control / pill selector): "Below 2.5" | "2.5–3.0" | "3.0–3.5" | "3.5–4.0" | "4.0+"
- Optional: "Have you taken the SAT or ACT?" (yes/no toggle — if yes, show a score range selector, not exact scores)

**If College:**
- School name (text input)
- Expected graduation year (dropdown)
- Major (text input, or "Undeclared")
- GPA range (same segmented control as above)

**If Professional:**
- Highest education completed (dropdown: "High school diploma", "Some college", "Associate's", "Bachelor's", "Master's", "Doctorate")
- Years of work experience (dropdown: "0-1", "1-3", "3-5", "5+")
- Current field/industry (text input)

**If Gap Year / Other:**
- Last school attended (text input, optional)
- What are you currently doing? (multi-select pills): "Working", "Volunteering", "Traveling", "Self-studying", "Exploring options"
- Planning to enroll in college? (toggle: "Yes, within a year" | "Maybe eventually" | "Not sure")

**Data captured:**
- `school_name`: text
- `graduation_year`: integer
- `gpa_range`: enum `'below_2.5' | '2.5_3.0' | '3.0_3.5' | '3.5_4.0' | '4.0_plus'`
- `major`: text (nullable)
- `has_test_scores`: boolean
- `test_score_range`: text (nullable)
- Additional path-specific fields as listed above
- Progress indicator showing step 2 of 3

---

### Screen 3: "What excites you?"

**Purpose:** Seed interest data for college matching, opportunity recommendations, and career direction.

**UI:**
- Headline: "Pick what interests you most"
- Subheadline: "Choose 3 to 5 areas — you can always change these later"
- Visual grid of interest cards (3 columns on desktop, 2 on mobile) — each card has:
  - A simple icon or emoji
  - Interest area name
  - One-line description
- Cards toggle on/off on tap, with a visible selected state (border highlight + checkmark)
- Counter: "3 of 5 selected" — enforce minimum 3, maximum 5
- Interest options (these should cover broad career/academic areas):
  - **Engineering & Technology** — "Building, coding, designing systems"
  - **Business & Entrepreneurship** — "Leading, managing, starting things"
  - **Healthcare & Medicine** — "Helping people stay healthy"
  - **Science & Research** — "Discovering how things work"
  - **Arts & Design** — "Creating visual and experiential work"
  - **Media & Communication** — "Writing, film, journalism, content"
  - **Social Impact & Policy** — "Making the world more fair"
  - **Education & Teaching** — "Helping others learn and grow"
  - **Law & Government** — "Justice, policy, public service"
  - **Finance & Economics** — "Markets, money, strategy"
  - **Environment & Sustainability** — "Protecting the planet"
  - **Psychology & Human Behavior** — "Understanding people"

**Data captured:**
- `interest_areas`: text[] (array of 3-5 selected interest keys)

**On completion:**
- Show a brief success moment: "You're all set! Let's build your plan." with a subtle animation
- Redirect to dashboard

---

## Database Schema

### Option A: Extend the existing `profiles` table

Add these columns to the existing `profiles` table (preferred if the table already exists and has `user_id`):

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS academic_path text CHECK (academic_path IN ('high_school', 'college', 'professional', 'gap_year')),
ADD COLUMN IF NOT EXISTS gpa_range text CHECK (gpa_range IN ('below_2.5', '2.5_3.0', '3.0_3.5', '3.5_4.0', '4.0_plus')),
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS has_test_scores boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS test_score_range text,
ADD COLUMN IF NOT EXISTS interest_areas text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS highest_education text,
ADD COLUMN IF NOT EXISTS years_experience text,
ADD COLUMN IF NOT EXISTS current_field text,
ADD COLUMN IF NOT EXISTS current_activities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS college_plans text;
```

### Option B: New `quick_start_profiles` table

Only use this if it makes more sense to keep quick-start data separate:

```sql
CREATE TABLE public.quick_start_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  academic_path text NOT NULL CHECK (academic_path IN ('high_school', 'college', 'professional', 'gap_year')),
  school_name text,
  graduation_year integer,
  gpa_range text CHECK (gpa_range IN ('below_2.5', '2.5_3.0', '3.0_3.5', '3.5_4.0', '4.0_plus')),
  major text,
  has_test_scores boolean DEFAULT false,
  test_score_range text,
  highest_education text,
  years_experience text,
  current_field text,
  current_activities text[] DEFAULT '{}',
  college_plans text,
  interest_areas text[] NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.quick_start_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quick start" ON public.quick_start_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick start" ON public.quick_start_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick start" ON public.quick_start_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

**Use your judgment on which option fits better with the existing schema. Option A is simpler. Option B is cleaner separation.**

---

## Route Gating Logic

The dashboard and all authenticated routes must check whether onboarding is complete:

1. After login/signup, query whether the user has completed the quick-start (check `onboarding_completed = true` on profiles, or check `completed = true` on `quick_start_profiles`)
2. If NOT completed → redirect to `/onboarding`
3. If completed → allow access to `/dashboard` and all other routes
4. The onboarding route itself should NOT be accessible if already completed (redirect to dashboard)

Implementation approach:
- Create a React context or hook (e.g., `useOnboardingStatus`) that checks completion status
- Wrap the existing `ProtectedRoute` component to also check onboarding status
- Or create a new `OnboardingGate` wrapper component

---

## Component Architecture

```
src/
  pages/
    Onboarding.tsx              — Page component, renders the step flow
  components/
    onboarding/
      OnboardingFlow.tsx        — Step orchestrator (manages current step, transitions)
      steps/
        AcademicPathStep.tsx    — Screen 1: Who are you?
        AcademicDetailsStep.tsx — Screen 2: Where are you? (adapts by path)
        InterestsStep.tsx       — Screen 3: What excites you?
      OnboardingComplete.tsx    — Brief success animation before redirect
  hooks/
    useOnboardingStatus.ts     — Checks if quick-start is done, used for gating
    useOnboardingForm.ts       — Manages form state across all 3 steps
```

---

## UX Requirements

### Visual Design
- Clean, modern, full-screen layout — no sidebar, no navigation chrome during onboarding
- Centered content with generous whitespace
- Large tap targets (minimum 48px) for mobile-first design
- Smooth transitions between steps (slide or fade, not instant swaps)
- Progress bar or step indicator (dots or numbered pills) at the top
- "Back" button on steps 2 and 3 to go to previous step
- "Continue" button is disabled until required fields are filled

### Animations & Polish
- Cards should have a satisfying hover/tap state (slight scale + border color change)
- Selected state should be visually obvious (filled background, checkmark, or border)
- Step transitions should animate (300-400ms ease)
- The completion screen should have a brief celebratory moment (confetti, checkmark animation, or a simple "You're in!" with a fade)

### Responsive Design
- Mobile-first: all screens must work perfectly on 375px width
- Interest grid: 2 columns on mobile, 3 on tablet+
- Path selection cards: stack vertically on very small screens, 2x2 on everything else
- Form fields: full width on mobile

### Accessibility
- All interactive elements must be keyboard navigable
- Cards must work as radio buttons (screen 1) or checkboxes (screen 3) for screen readers
- Progress indicator must have aria labels
- Color contrast must meet WCAG AA

### Data Persistence
- Auto-save each step's data to Supabase as the user progresses (not just on final submit)
- If the user closes and comes back, they should resume at the step they were on
- Store `current_onboarding_step` (1, 2, or 3) so we know where to resume

---

## Edge Cases

1. **User refreshes mid-flow** — Resume at current step with saved data
2. **User goes back and changes academic path** — Clear path-specific fields from step 2 since they're no longer relevant
3. **User tries to navigate to /dashboard directly** — Redirect to /onboarding if not completed
4. **User already completed onboarding, visits /onboarding** — Redirect to /dashboard
5. **Network error during save** — Show a toast error, allow retry, don't lose form state
6. **User selects fewer than 3 interests** — "Continue" button stays disabled with helper text "Pick at least 3"
7. **User selects more than 5 interests** — Cards beyond 5 don't toggle on, show helper text "Maximum 5 selected"

---

## Success Metrics (for future tracking)

- Completion rate: % of signups that finish all 3 screens
- Time to complete: median time from step 1 start to completion
- Drop-off by step: which screen loses the most users
- Interest distribution: which interests are most/least selected (helps prioritize content)

---

## Out of Scope

- The full deep-dive assessment (activities, goals, personality) — this is handled by the progressive quest system later
- College recommendation engine — this uses quick-start data but is a separate feature
- Dashboard widgets and their locked/unlocked states — separate PRD
- The quest system that prompts further assessment completion — separate PRD

---

## Technical Notes

- Use Supabase client SDK for all database operations (already configured in the project)
- Use Supabase Auth for user identification (already configured)
- Use shadcn/ui components where appropriate (already installed) — but the onboarding should feel special and elevated, not like a standard form
- Use Tailwind CSS for styling (already configured)
- Use React Router for navigation (already configured)
- The project uses TypeScript — all components and hooks should be fully typed
- Use Framer Motion or CSS transitions for step animations