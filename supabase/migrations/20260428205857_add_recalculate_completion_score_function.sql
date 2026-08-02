-- Recovered from the production migration ledger on 2026-08-01.
-- These idempotent tables make legacy Git preview branches reproducible when
-- their original profile-schema migrations predate the production ledger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  user_context text NOT NULL DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'initial',
  first_name text,
  major text,
  interest_areas text[] NOT NULL DEFAULT '{}'::text[],
  gpa_range text,
  college_plans text,
  terms_accepted_at timestamptz,
  onboarding_completed boolean NOT NULL DEFAULT false,
  completion_score numeric NOT NULL DEFAULT 0,
  completion_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  credits integer NOT NULL DEFAULT 0,
  stripe_customer_id text,
  subscription_status text DEFAULT 'none'::text,
  referral_discount_active boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experiences_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  work_experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  volunteer_service jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracurriculars jsonb NOT NULL DEFAULT '[]'::jsonb,
  personal_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  leadership_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  academic_honors jsonb NOT NULL DEFAULT '[]'::jsonb,
  formal_recognition jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_journey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  gpa numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals_aspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  intended_major text,
  career_interests text[] NOT NULL DEFAULT '{}'::text[],
  college_environment text[] NOT NULL DEFAULT '{}'::text[],
  geographic_preferences text[] NOT NULL DEFAULT '{}'::text[],
  college_plans jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  first_name text,
  last_name text,
  preferred_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_responsibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_network (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_growth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  meaningful_experiences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Production has these billing columns, and the later credits-hardening
-- migration requires them even when this table pre-existed the baseline.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none'::text,
  ADD COLUMN IF NOT EXISTS referral_discount_active boolean DEFAULT false;
