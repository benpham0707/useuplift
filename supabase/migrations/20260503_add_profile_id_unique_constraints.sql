-- Add UNIQUE constraints to profile_id columns to enable proper upsert behavior
-- This ensures each profile can only have one row per table (1:1 relationship)
-- Safe migration: only creates constraints if they don't already exist

-- Add unique constraint to experiences_activities.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiences_activities_profile_id_key'
  ) THEN
    ALTER TABLE public.experiences_activities
    ADD CONSTRAINT experiences_activities_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Add unique constraint to academic_journey.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'academic_journey_profile_id_key'
  ) THEN
    ALTER TABLE public.academic_journey
    ADD CONSTRAINT academic_journey_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Add unique constraint to goals_aspirations.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_aspirations_profile_id_key'
  ) THEN
    ALTER TABLE public.goals_aspirations
    ADD CONSTRAINT goals_aspirations_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Add unique constraint to personal_information.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'personal_information_profile_id_key'
  ) THEN
    ALTER TABLE public.personal_information
    ADD CONSTRAINT personal_information_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Add unique constraint to family_responsibilities.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_responsibilities_profile_id_key'
  ) THEN
    ALTER TABLE public.family_responsibilities
    ADD CONSTRAINT family_responsibilities_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Add unique constraint to support_network.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_network_profile_id_key'
  ) THEN
    ALTER TABLE public.support_network
    ADD CONSTRAINT support_network_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Add unique constraint to personal_growth.profile_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'personal_growth_profile_id_key'
  ) THEN
    ALTER TABLE public.personal_growth
    ADD CONSTRAINT personal_growth_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;
