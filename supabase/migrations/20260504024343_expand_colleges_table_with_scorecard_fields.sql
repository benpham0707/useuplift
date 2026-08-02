-- Recovered from the production migration ledger on 2026-08-01.
--
-- Production already has public.colleges, but its original CREATE TABLE was
-- never recorded in supabase_migrations.schema_migrations. Git preview branches
-- replay the ledger into an empty database, so this migration must establish the
-- legacy table before applying the historical Scorecard expansion.
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  city text NOT NULL,
  state text NOT NULL,
  region text NOT NULL CHECK (region IN ('West', 'Northeast', 'South', 'Midwest')),
  campus_setting text CHECK (campus_setting IN ('urban', 'suburban', 'rural')),
  type text NOT NULL CHECK (type IN ('public', 'private', 'community', 'private_nonprofit', 'private_for_profit')),
  size text CHECK (size IN ('small', 'medium', 'large')),
  enrollment_size integer,
  acceptance_rate numeric CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
  avg_gpa_min numeric CHECK (avg_gpa_min >= 0 AND avg_gpa_min <= 4.0),
  avg_gpa_max numeric CHECK (avg_gpa_max >= 0 AND avg_gpa_max <= 4.0),
  avg_sat_min integer CHECK (avg_sat_min >= 400 AND avg_sat_min <= 1600),
  avg_sat_max integer CHECK (avg_sat_max >= 400 AND avg_sat_max <= 1600),
  avg_act_min integer CHECK (avg_act_min >= 1 AND avg_act_min <= 36),
  avg_act_max integer CHECK (avg_act_max >= 1 AND avg_act_max <= 36),
  tuition_in_state integer,
  tuition_out_of_state integer,
  financial_aid_percentage numeric,
  website_url text,
  logo_url text,
  image_url text,
  primary_color text,
  secondary_color text,
  popular_majors jsonb DEFAULT '[]'::jsonb,
  program_strengths jsonb DEFAULT '[]'::jsonb,
  interest_tags jsonb DEFAULT '[]'::jsonb,
  student_demographics jsonb DEFAULT '{}'::jsonb,
  application_deadlines jsonb DEFAULT '{}'::jsonb,
  required_materials jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'colleges'
      AND policyname = 'Colleges are publicly viewable'
  ) THEN
    CREATE POLICY "Colleges are publicly viewable"
      ON public.colleges FOR SELECT TO anon
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'colleges'
      AND policyname = 'Colleges are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Colleges are viewable by authenticated users"
      ON public.colleges FOR SELECT TO authenticated
      USING (is_active = true);
  END IF;
END
$$;

-- Expand colleges table with comprehensive College Scorecard fields.
ALTER TABLE public.colleges
  ADD COLUMN IF NOT EXISTS scorecard_id INTEGER UNIQUE,
  ADD COLUMN IF NOT EXISTS unitid INTEGER,
  ADD COLUMN IF NOT EXISTS opeid TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS school_type TEXT CHECK (school_type IN ('four_year', 'two_year', 'less_than_two_year')),
  ADD COLUMN IF NOT EXISTS setting TEXT CHECK (setting IN ('urban', 'suburban', 'town', 'rural')),
  ADD COLUMN IF NOT EXISTS size_category TEXT CHECK (size_category IN ('very_small', 'small', 'medium', 'large', 'very_large')),
  ADD COLUMN IF NOT EXISTS undergrad_enrollment INTEGER,
  ADD COLUMN IF NOT EXISTS total_enrollment INTEGER,
  ADD COLUMN IF NOT EXISTS designations JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sat_reading_25 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_reading_75 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_math_25 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_math_75 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_total_25 INTEGER,
  ADD COLUMN IF NOT EXISTS sat_total_75 INTEGER,
  ADD COLUMN IF NOT EXISTS act_25 INTEGER,
  ADD COLUMN IF NOT EXISTS act_75 INTEGER,
  ADD COLUMN IF NOT EXISTS cost_of_attendance INTEGER,
  ADD COLUMN IF NOT EXISTS net_price_average INTEGER,
  ADD COLUMN IF NOT EXISTS pell_grant_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS graduation_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS retention_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS median_earnings_10yr INTEGER,
  ADD COLUMN IF NOT EXISTS first_gen_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS program_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_year INTEGER,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.colleges DROP CONSTRAINT IF EXISTS colleges_type_check;
ALTER TABLE public.colleges ADD CONSTRAINT colleges_type_check
  CHECK (type IN ('public', 'private', 'community', 'private_nonprofit', 'private_for_profit'));

CREATE INDEX IF NOT EXISTS idx_colleges_scorecard_id ON public.colleges(scorecard_id);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON public.colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_type ON public.colleges(type);
CREATE INDEX IF NOT EXISTS idx_colleges_acceptance_rate ON public.colleges(acceptance_rate);
CREATE INDEX IF NOT EXISTS idx_colleges_undergrad_enrollment ON public.colleges(undergrad_enrollment);
CREATE INDEX IF NOT EXISTS idx_colleges_interest_tags ON public.colleges USING GIN (interest_tags);
CREATE INDEX IF NOT EXISTS idx_colleges_designations ON public.colleges USING GIN (designations);
CREATE INDEX IF NOT EXISTS idx_colleges_program_breakdown ON public.colleges USING GIN (program_breakdown);
