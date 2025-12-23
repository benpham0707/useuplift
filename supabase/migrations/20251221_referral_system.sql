-- Referral System Migration
-- Creates tables for referral codes, referral tracking, and purchase bonus tracking
-- Also adds optional columns to profiles for fast referral discount checks

-- ============================================================================
-- REFERRAL CODES TABLE
-- ============================================================================
-- Stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS public.referral_codes (
  user_id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  CONSTRAINT referral_codes_code_format CHECK (
    length(code) >= 6 AND length(code) <= 20
  )
);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================
-- Tracks each referral relationship (one row per referee)
CREATE TABLE IF NOT EXISTS public.referrals (
  referee_user_id text PRIMARY KEY,
  referrer_user_id text NOT NULL,
  referral_code text NOT NULL,
  claimed_at timestamp with time zone DEFAULT now() NOT NULL,
  signup_bonus_granted_at timestamp with time zone,
  purchase_bonus_granted_at timestamp with time zone,
  
  -- Ensure users can't refer themselves
  CONSTRAINT referrals_no_self_referral CHECK (
    referee_user_id != referrer_user_id
  ),
  
  -- Link to referral code (informational, not a strict FK)
  CONSTRAINT referrals_code_fkey 
    FOREIGN KEY (referral_code) 
    REFERENCES public.referral_codes(code)
    ON DELETE CASCADE
);

-- Index for fast lookups by referrer
CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
  ON public.referrals(referrer_user_id);

-- Index for pending purchase bonuses
CREATE INDEX IF NOT EXISTS idx_referrals_pending_purchase_bonus
  ON public.referrals(purchase_bonus_granted_at)
  WHERE purchase_bonus_granted_at IS NULL;

-- ============================================================================
-- PROFILES ENHANCEMENT (optional but recommended)
-- ============================================================================
-- Add columns to profiles for fast referral discount checks
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_discount_active boolean DEFAULT false;

-- Index for fast referral discount lookups during checkout
CREATE INDEX IF NOT EXISTS idx_profiles_referral_discount
  ON public.profiles(user_id, referral_discount_active)
  WHERE referral_discount_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral code
CREATE POLICY "Users can view own referral code" 
  ON public.referral_codes FOR SELECT 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can view their own referral relationships (as referrer or referee)
CREATE POLICY "Users can view own referrals" 
  ON public.referrals FOR SELECT 
  USING (
    referrer_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR referee_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Allow service role (backend) full access for creating codes and referrals
-- Note: This is implicit with service role key, but we document the intent

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate a unique referral code for a user
-- Format: 6 uppercase alphanumeric characters
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude ambiguous chars
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.referral_codes WHERE code = result
    ) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO service_role;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.referral_codes IS 'Stores unique referral codes for each user to share with friends';
COMMENT ON TABLE public.referrals IS 'Tracks referral relationships and bonus grant status';
COMMENT ON COLUMN public.referrals.signup_bonus_granted_at IS 'Timestamp when referrer received +25 credits for signup';
COMMENT ON COLUMN public.referrals.purchase_bonus_granted_at IS 'Timestamp when referrer received +25 credits for first purchase';
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID of the referrer (if this user was referred)';
COMMENT ON COLUMN public.profiles.referral_discount_active IS 'Whether this user gets 10% off credit packs (set when referral is claimed)';
