-- Canonical onboarding foundation. This migration is intentionally additive:
-- shadow fields remain readable until the separate contract migration proves no
-- application readers remain.

DO $$ BEGIN
  CREATE TYPE public.application_stage AS ENUM ('exploring', 'mid_application', 'almost_done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS application_stage public.application_stage;

COMMENT ON COLUMN public.profiles.user_context IS
  'Grade/life context only. Application progress belongs in application_stage; profile facts belong in canonical child tables.';
COMMENT ON COLUMN public.profiles.application_stage IS
  'Application-process progress only: exploring, mid_application, or almost_done.';

ALTER TABLE public.academic_journey
  ADD COLUMN IF NOT EXISTS gpa_range text;

ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_idempotency_key_unique
  ON public.credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Lossless, non-destructive backfill. Canonical values always win. A bucketed
-- GPA is intentionally retained as text; numeric gpa is never inferred.
INSERT INTO public.personal_information (profile_id, first_name)
SELECT p.id, p.first_name
FROM public.profiles p
LEFT JOIN public.personal_information pi ON pi.profile_id = p.id
WHERE NULLIF(BTRIM(p.first_name), '') IS NOT NULL
  AND pi.profile_id IS NULL
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO public.goals_aspirations (profile_id, intended_major, career_interests, college_plans)
SELECT p.id,
       NULLIF(BTRIM(p.major), ''),
       COALESCE(p.interest_areas, '{}'::text[]),
       CASE WHEN NULLIF(BTRIM(p.college_plans), '') IS NULL THEN NULL
            ELSE jsonb_build_object('legacy_text', p.college_plans, 'needs_review', true)
       END
FROM public.profiles p
LEFT JOIN public.goals_aspirations ga ON ga.profile_id = p.id
WHERE ga.profile_id IS NULL
  AND (NULLIF(BTRIM(p.major), '') IS NOT NULL
       OR cardinality(p.interest_areas) > 0
       OR NULLIF(BTRIM(p.college_plans), '') IS NOT NULL)
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO public.academic_journey (profile_id, gpa, gpa_range)
SELECT p.id, NULL, p.gpa_range
FROM public.profiles p
LEFT JOIN public.academic_journey aj ON aj.profile_id = p.id
WHERE aj.profile_id IS NULL
  AND NULLIF(BTRIM(p.gpa_range), '') IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;
