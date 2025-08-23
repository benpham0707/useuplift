-- Expand profiles schema to persist wizard data and add helpful policies

-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_status') THEN
    CREATE TYPE profile_status AS ENUM ('initial','active','archived');
  END IF;
END $$;

-- 2) Profiles columns (id is assumed to already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS user_context text DEFAULT 'unknown_student',
  ADD COLUMN IF NOT EXISTS status profile_status NOT NULL DEFAULT 'initial',
  ADD COLUMN IF NOT EXISTS goals jsonb NOT NULL DEFAULT '{"primaryGoal":"exploring_options","desiredOutcomes":[],"timelineUrgency":"flexible"}'::jsonb,
  ADD COLUMN IF NOT EXISTS constraints jsonb NOT NULL DEFAULT '{"needsFinancialAid":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS demographics jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS completion_score numeric NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS completion_details jsonb NOT NULL DEFAULT '{"overall":0,"sections":{"basic":0,"goals":0,"academic":0,"enrichment":0,"experience":0}}'::jsonb,
  ADD COLUMN IF NOT EXISTS extracted_skills jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hidden_strengths text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS narrative_summary text,
  ADD COLUMN IF NOT EXISTS last_enrichment_date timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_priorities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2a) FK for user_id → auth.users(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- 3) academic_records minimal fields used by wizards
ALTER TABLE public.academic_records
  ADD COLUMN IF NOT EXISTS school jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS current_grade text,
  ADD COLUMN IF NOT EXISTS gpa numeric;

-- 3a) FK to profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'academic_records_profile_id_fkey'
  ) THEN
    ALTER TABLE public.academic_records
      ADD CONSTRAINT academic_records_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 4) Helper trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER profiles_set_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 5) Optional RLS policies to allow authenticated users to manage their own profile and academic record (client fallback)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'academic_records_select_own' AND schemaname = 'public' AND tablename = 'academic_records'
  ) THEN
    CREATE POLICY academic_records_select_own ON public.academic_records
      FOR SELECT TO authenticated USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'academic_records_upsert_own' AND schemaname = 'public' AND tablename = 'academic_records'
  ) THEN
    CREATE POLICY academic_records_upsert_own ON public.academic_records
      FOR INSERT TO authenticated WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'academic_records_update_own' AND schemaname = 'public' AND tablename = 'academic_records'
  ) THEN
    CREATE POLICY academic_records_update_own ON public.academic_records
      FOR UPDATE TO authenticated USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
  END IF;
END $$;


