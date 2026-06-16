-- ============================================================================
-- Credits integrity hardening — closes the credits self-inflation vulnerability.
-- ============================================================================
-- Deep audit (2026-06-16) proved an authenticated user could
--   UPDATE profiles SET credits = credits + 1e6 WHERE user_id = <self>
-- and it SUCCEEDED (10 -> 1000010), because `authenticated` holds column-level
-- UPDATE on profiles.credits and the own-row RLS policy permits it. Same exposure
-- on subscription_status / stripe_customer_id / referral_discount_active.
--
-- This migration:
--   0. Drops the legacy Supabase-auth-era credit fns (caller-supplied uuid id;
--      type-broken vs Clerk TEXT user_id — dead code, wrong identity model).
--   1. Adds a JWT-derived SECURITY DEFINER `deduct_credits(int,text,text)` that
--      decrements atomically and logs the transaction, deriving the caller from
--      auth.jwt()->>'sub' (cannot be spoofed by a parameter).
--   2. Revokes direct UPDATE on billing-sensitive columns from authenticated+anon.
-- After this, the ONLY way for a logged-in user to change credits is the audited
-- RPC (which only ever DECREMENTS the caller's own balance). service_role (backend
-- billing.ts / referrals.ts / creditsService server helpers) is unaffected.
--
-- App change shipped with this migration: src/services/credits/creditsService.ts
-- deductCredits() now calls rpc('deduct_credits', …) instead of a direct UPDATE.
-- ============================================================================

-- 0. Drop legacy uuid-param credit functions.
DROP FUNCTION IF EXISTS public.deduct_credits(uuid, integer, text, text);
DROP FUNCTION IF EXISTS public.check_credits(uuid, integer);

-- 1. JWT-derived atomic deduction. SECURITY DEFINER (owner=postgres) so it can
--    still write credits after the REVOKE in section 2.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_amount      integer,
  p_type        text,
  p_description text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_caller  text := (auth.jwt() ->> 'sub');
  v_balance integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'deduct_credits: no authenticated caller';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_credits: amount must be a positive integer (got %)', p_amount;
  END IF;

  UPDATE public.profiles
     SET credits = credits - p_amount
   WHERE user_id = v_caller
     AND credits >= p_amount
  RETURNING credits INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deduct_credits: insufficient credits' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (v_caller, -p_amount, p_type, p_description);

  RETURN v_balance;
END;
$$;

REVOKE ALL    ON FUNCTION public.deduct_credits(integer, text, text) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.deduct_credits(integer, text, text) TO authenticated;

-- 2. Remove direct write access to billing-sensitive columns.
--    NOTE: a table-level UPDATE grant covers every column, so a bare
--    `REVOKE UPDATE (credits) …` is a no-op while the table-level grant stands.
--    Correct approach: revoke the table-level UPDATE, drop any column-level grant
--    on the sensitive columns, then re-grant UPDATE on all NON-sensitive columns
--    (the app legitimately updates completion_score, onboarding fields, etc.).
--    `anon` gets no re-grant — it has no business updating profiles (RLS denies it
--    anyway). The 4 sensitive columns are writable only by service_role + the
--    SECURITY DEFINER deduct_credits RPC above.
DO $$
DECLARE
  v_cols text;
BEGIN
  REVOKE UPDATE ON public.profiles FROM authenticated, anon;
  REVOKE UPDATE (credits, subscription_status, stripe_customer_id, referral_discount_active)
    ON public.profiles FROM authenticated, anon;

  SELECT string_agg(format('%I', column_name), ', ')
    INTO v_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name NOT IN ('credits', 'subscription_status', 'stripe_customer_id', 'referral_discount_active');

  EXECUTE format('GRANT UPDATE (%s) ON public.profiles TO authenticated', v_cols);
END $$;

-- 3. Hygiene: trigger-only fn should not be directly executable; lock RAG RPCs from anon.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.match_rag_fragments(vector, double precision, integer, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_rag_transformations(vector, double precision, integer, text, text, text) FROM anon;
