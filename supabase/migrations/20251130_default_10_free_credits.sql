-- Change default credits from 0 to 10 for new user profiles
-- This ensures all new users receive 10 free credits to test the product,
-- regardless of which code path creates their profile.

ALTER TABLE public.profiles 
  ALTER COLUMN credits SET DEFAULT 10;

COMMENT ON COLUMN public.profiles.credits IS 'User credit balance. New users receive 10 free credits.';

