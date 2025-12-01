-- Add terms_accepted_at column to profiles table
-- This tracks when users accept the Terms of Service

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone;

-- Add index for querying users who haven't accepted terms
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at ON public.profiles(terms_accepted_at);

COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when user accepted Terms of Service. NULL means not yet accepted.';

