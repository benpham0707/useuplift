-- ============================================================================
-- ✅ IMPLEMENTED — DESIGN/RATIONALE record. Shipped as
-- `supabase/migrations/20260616211500_credits_integrity_hardening.sql` (applied to
-- prod 2026-06-16, recorded in schema_migrations) + app refactor in PR #38. The
-- shipped version REVOKEs the *table-level* UPDATE then re-grants UPDATE on
-- non-sensitive columns (a bare column-level REVOKE is a no-op while a table-level
-- grant stands). Kept here for the why.
-- ============================================================================
-- Fixes the CONFIRMED live "credits self-inflation" vulnerability (Exit 7a):
-- an authenticated user can `UPDATE profiles SET credits = credits + 1e6` on
-- their own row via the Data API. Proven by adversarial test (10 -> 1000010).
--
-- DEPLOY ORDERING (critical): the REVOKE in section 3 removes the privilege that
-- the CURRENT client-side `creditsService.deductCredits()` relies on. It MUST ship
-- together with:
--   (a) this SQL applied to the DB, AND
--   (b) the app refactor that routes deduction through the `deduct_credits` RPC
--       (src/services/credits/creditsService.ts — see section 4 note), AND
--   (c) a production deploy of that client (gated on Exit 3 Vercel + Exit 4).
-- Applying section 3 alone, before the refactored client is live, breaks legit
-- credit deduction. (Note: because the RLS lockdown is already applied and the OLD
-- anon client is still deployed, user-scoped writes are ALREADY failing in prod —
-- the P0 — so there is no NEW regression, but do not apply piecemeal.)
--
-- Pre-reqs before applying to prod: fresh backup/PITR checkpoint + staging rehearsal
-- + explicit operator approval (standing project rule).
-- ============================================================================

BEGIN;

-- 0. Drop the LEGACY Supabase-auth-era credit functions. They take p_user_id as a
--    caller-supplied `uuid` PARAMETER (not derived from auth.jwt()->>'sub') and compare
--    it to profiles.user_id which is TEXT (Clerk ids). Deep audit (2026-06-16) proved
--    they error with "operator does not exist: text = uuid" for Clerk users — dead code
--    that also embodies the wrong identity model (caller passes the victim id). Replaced
--    by the JWT-derived version below.
DROP FUNCTION IF EXISTS public.deduct_credits(uuid, integer, text, text);
DROP FUNCTION IF EXISTS public.check_credits(uuid, integer);

-- 1. Atomic, server-authoritative credit deduction. SECURITY DEFINER so it runs
--    with the function owner's rights (which retain UPDATE on profiles.credits)
--    even after section 3 revokes the privilege from `authenticated`.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_amount      integer,
  p_type        text,
  p_description text
)
RETURNS integer            -- new balance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_caller   text := (auth.jwt() ->> 'sub');   -- Clerk user id; NULL if anon
  v_balance  integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'deduct_credits: no authenticated caller';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_credits: amount must be a positive integer (got %)', p_amount;
  END IF;

  -- Atomic decrement guarded by sufficiency; row-locks the caller's profile.
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

-- 2. Allow logged-in users to CALL the RPC (but not to write the column directly).
REVOKE ALL ON FUNCTION public.deduct_credits(integer, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.deduct_credits(integer, text, text) TO authenticated;

-- 3. Remove direct write access to billing-sensitive columns. After this, the only
--    path to change credits for `authenticated` is the audited RPC above; service_role
--    (backend) is unaffected (it bypasses these grants).
REVOKE UPDATE (credits, subscription_status, stripe_customer_id, referral_discount_active)
  ON public.profiles FROM authenticated;
-- anon never had a working write path (no anon UPDATE policy) but the broad table grant
-- is sloppy; revoke its column writes too for defense-in-depth.
REVOKE UPDATE (credits, subscription_status, stripe_customer_id, referral_discount_active)
  ON public.profiles FROM anon;

-- 3b. Hygiene (Exit 7c): trigger-only fn should not be directly executable.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, public;

-- 3c. Optional defense-in-depth (Exit 7d): RAG match RPCs are SECURITY INVOKER and
--     already fail closed for anon (table grant denies). Revoke EXECUTE anyway.
REVOKE EXECUTE ON FUNCTION public.match_rag_fragments(vector, double precision, integer, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_rag_transformations(vector, double precision, integer, text, text, text) FROM anon;

COMMIT;

-- ============================================================================
-- 4. APP CHANGE (must ship with section 3) — src/services/credits/creditsService.ts
--    Replace the client-side balance-compute + direct UPDATE in deductCredits()
--    (currently ~line 188-195) with a single RPC call:
--
--      const { data, error } = await client.rpc('deduct_credits', {
--        p_amount: amount, p_type: type, p_description: description,
--      });
--      if (error) return { success:false, newBalance: currentBalance,
--                          error: `Failed to deduct credits: ${error.message}` };
--      const newBalance = Number(data);
--
--    Remove the separate credit_transactions insert (the RPC logs it atomically).
--    Keep the `getCredits()` read path as-is. `getAuthenticatedClient(token)` still
--    supplies the Clerk JWT so auth.jwt()->>'sub' resolves inside the RPC.
--
-- 5. POST-APPLY VERIFICATION (re-run after deploy):
--    - Adversarial: `SET ROLE authenticated` + jwt sub; `UPDATE profiles SET credits
--      = credits + 1e6` -> must raise "permission denied for column credits".
--    - Functional: call `SELECT deduct_credits(5,'essay_analysis','test')` as the
--      same user -> returns balance-5; a second call below zero -> "insufficient credits".
--    - service_role can still UPDATE credits (backend billing intact).
-- ============================================================================
