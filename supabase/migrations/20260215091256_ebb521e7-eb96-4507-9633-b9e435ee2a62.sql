
-- Add missing columns to personal_information
ALTER TABLE public.personal_information
  ADD COLUMN IF NOT EXISTS preferred_name TEXT,
  ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS place_of_birth JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hispanic_background TEXT,
  ADD COLUMN IF NOT EXISTS race_ethnicity JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS other_languages JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS years_in_us INTEGER,
  ADD COLUMN IF NOT EXISTS former_names JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS household_size TEXT,
  ADD COLUMN IF NOT EXISTS household_income TEXT,
  ADD COLUMN IF NOT EXISTS siblings JSONB DEFAULT '{}';

-- Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_details JSONB DEFAULT '{}';
