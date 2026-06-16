-- =============================================================================
-- SECURITY MIGRATION: Resolve CRITICAL rls_disabled_in_public advisory + class
-- Project: zclaplpkuvxkrdwsgrul (Uplift production)
-- Date:    2026-06-16
--
-- WHY: A Supabase CRITICAL advisory (rls_disabled_in_public) reported public
-- tables with Row-Level Security disabled — anyone with the project URL + the
-- public anon key (which ships in the frontend bundle) could read/edit/delete
-- every row. Live verification found the problem was BROADER than the advisor
-- reported:
--   (a) RLS fully DISABLED on 4 tables: cip_interest_mapping, essay_duplicates,
--       portfolio_analytics, portfolio_analytics_history.
--   (b) RLS ENABLED but with wide-open `USING (true)` / role=anon|public policies
--       that leaked data the rls_disabled advisor does NOT flag:
--         - profiles            (134 PII rows readable + ANY row updatable: credits!)
--         - rag_essay_fragments (112 essay-content rows readable by anon)
--         - rag_transformations (27 rows readable by anon)
--         - bug_reports         (all rows readable by anon)
--   (c) Many tables carried fail-closed-but-wrong `auth.uid()` policies. This app
--       uses CLERK auth, so the correct ownership predicate is
--       `user_id = (select auth.jwt() ->> 'sub')`, NOT auth.uid() (which is NULL
--       under Clerk). Those policies denied everyone; we convert them to the
--       correct Clerk pattern so the features work AND stay private.
--   (d) SECURITY DEFINER functions (deduct_credits, check_credits, ...) had
--       EXECUTE granted to anon — an anonymous caller could manipulate/probe any
--       user's credits via PostgREST RPC. We revoke anon/public EXECUTE and pin
--       search_path.
--
-- ACCESS MODEL (derived from app code, not assumed):
--   * Per-user tables key on `user_id` (TEXT = Clerk user id) OR `profile_id`
--     (FK -> profiles.id, itself keyed by Clerk user id).
--   * Client reads/writes go through the anon key + a Clerk-issued 'supabase'
--     JWT whose `sub` claim is the Clerk user id (auth.jwt() ->> 'sub').
--   * Backend (Express webhooks, billing, referrals, rag seeding) uses the
--     service_role key, which BYPASSES RLS. service_role policies below are
--     explicit belt-and-suspenders; they are not required for service_role to
--     work but document intent.
--
-- SAFETY: Fully transactional (atomic). Idempotent — every table's policies are
-- dropped and recreated, so re-applying is safe. Uses (select auth.jwt()...) so
-- the claim is evaluated once per query (Supabase performance guidance).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: drop every existing policy on a table (session-local, auto-dropped).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.drop_all_policies(p_table text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE r record;
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN
    RAISE NOTICE 'skip (missing): %', p_table;
    RETURN;
  END IF;
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, p_table);
  END LOOP;
END;
$fn$;

-- =============================================================================
-- STEP 1 — Enable RLS on EVERY table in public (covers the 4 disabled tables and
-- any table not explicitly handled below, now or in the future). This is what
-- clears the rls_disabled_in_public advisory.
-- =============================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- =============================================================================
-- STEP 2 — Rebuild policies on the LEAKING / BROKEN tables.
-- Tables already carrying correct Clerk policies (academic_journey,
-- personal_information, experiences_activities, family_responsibilities,
-- goals_aspirations, personal_growth, support_network, activity_profiles,
-- activity_chat_conversations, essays, devices, credit_transactions,
-- subscriptions, referral_codes, referrals, essay_analysis_reports,
-- essay_chat_messages, essay_coaching_plans, essay_revision_history, colleges)
-- are intentionally left untouched — they are not leaking and rewriting working
-- policies would add risk without benefit.
-- =============================================================================

-- ---- profiles : CRITICAL. Had only wide-open policies (public read/insert/update).
--      Lock to the authenticated owner. (NOTE: a logged-in user can still update
--      their OWN credits column — pre-existing app design where creditsService
--      writes credits client-side. Tracked as a residual; see migration report.)
SELECT pg_temp.drop_all_policies('profiles');
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "profiles_service_all" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- rag_essay_fragments / rag_transformations : essay-content corpus, seeded
--      and read by the backend via the service_role (ragService uses supabaseAdmin).
--      Remove the "Anyone can read" leak -> service-role-only.
SELECT pg_temp.drop_all_policies('rag_essay_fragments');
CREATE POLICY "rag_fragments_service_all" ON public.rag_essay_fragments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT pg_temp.drop_all_policies('rag_transformations');
CREATE POLICY "rag_transformations_service_all" ON public.rag_transformations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- bug_reports : was world-readable. Owner-scoped read + insert; service full.
SELECT pg_temp.drop_all_policies('bug_reports');
CREATE POLICY "bug_reports_select_own" ON public.bug_reports
  FOR SELECT TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "bug_reports_insert_own" ON public.bug_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "bug_reports_service_all" ON public.bug_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- cip_interest_mapping : RLS was OFF. Non-sensitive reference taxonomy
--      (CIP code -> interest area), analogous to `colleges`. Public read, no writes.
SELECT pg_temp.drop_all_policies('cip_interest_mapping');
CREATE POLICY "cip_interest_mapping_read" ON public.cip_interest_mapping
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cip_interest_mapping_service_all" ON public.cip_interest_mapping
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- essay_duplicates : RLS was OFF. Fraud/dedup data written by the backend.
--      Service-role-only (no anon/authenticated policies).
SELECT pg_temp.drop_all_policies('essay_duplicates');
CREATE POLICY "essay_duplicates_service_all" ON public.essay_duplicates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- portfolio_analytics / portfolio_analytics_history : RLS was OFF (leaking).
--      Live schema keys on profile_id (FK -> profiles), NOT user_id, so ownership
--      resolves through profiles. Backend-written; user may read their own.
SELECT pg_temp.drop_all_policies('portfolio_analytics');
CREATE POLICY "portfolio_analytics_select_own" ON public.portfolio_analytics
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));
CREATE POLICY "portfolio_analytics_service_all" ON public.portfolio_analytics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT pg_temp.drop_all_policies('portfolio_analytics_history');
CREATE POLICY "portfolio_analytics_history_select_own" ON public.portfolio_analytics_history
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));
CREATE POLICY "portfolio_analytics_history_service_all" ON public.portfolio_analytics_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- ip_usage_tracking : fraud telemetry. Service-role-only.
SELECT pg_temp.drop_all_policies('ip_usage_tracking');
CREATE POLICY "ip_usage_tracking_service_all" ON public.ip_usage_tracking
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- device_fingerprints / fraud_flags / fraud_risk_scores : fraud data.
--      Service full + owner may read their own (had broken auth.uid() before).
SELECT pg_temp.drop_all_policies('device_fingerprints');
CREATE POLICY "device_fingerprints_select_own" ON public.device_fingerprints
  FOR SELECT TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "device_fingerprints_service_all" ON public.device_fingerprints
  FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT pg_temp.drop_all_policies('fraud_flags');
CREATE POLICY "fraud_flags_select_own" ON public.fraud_flags
  FOR SELECT TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "fraud_flags_service_all" ON public.fraud_flags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT pg_temp.drop_all_policies('fraud_risk_scores');
CREATE POLICY "fraud_risk_scores_select_own" ON public.fraud_risk_scores
  FOR SELECT TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "fraud_risk_scores_service_all" ON public.fraud_risk_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- essay_analyses : user-owned (user_id). Had broken auth.uid() ALL policy.
SELECT pg_temp.drop_all_policies('essay_analyses');
CREATE POLICY "essay_analyses_select_own" ON public.essay_analyses
  FOR SELECT TO authenticated USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "essay_analyses_insert_own" ON public.essay_analyses
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "essay_analyses_update_own" ON public.essay_analyses
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "essay_analyses_delete_own" ON public.essay_analyses
  FOR DELETE TO authenticated USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "essay_analyses_service_all" ON public.essay_analyses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- Gamification / user-owned lists that shipped with broken auth.uid() (role
--      public). Convert to correct Clerk authenticated CRUD-own.
--      Tables: character_stats, daily_quests, dashboard_events,
--      portfolio_suggestions, user_streaks, user_college_list.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'character_stats','daily_quests','dashboard_events',
    'portfolio_suggestions','user_streaks','user_college_list'
  ];
  sub text := '(select auth.jwt() ->> ''sub'')';
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    PERFORM pg_temp.drop_all_policies(t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = %s)', t||'_select_own', t, sub);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = %s)', t||'_insert_own', t, sub);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (user_id = %s) WITH CHECK (user_id = %s)', t||'_update_own', t, sub, sub);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (user_id = %s)', t||'_delete_own', t, sub);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t||'_service_all', t);
  END LOOP;
END $$;

-- ---- college_reports : user-submitted reports. Owner read + insert (had broken
--      auth.uid()). No update/delete by users.
SELECT pg_temp.drop_all_policies('college_reports');
CREATE POLICY "college_reports_select_own" ON public.college_reports
  FOR SELECT TO authenticated USING (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "college_reports_insert_own" ON public.college_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
CREATE POLICY "college_reports_service_all" ON public.college_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- STEP 3 — Defense-in-depth: revoke anon/authenticated table privileges on
-- service-role-only tables. RLS already denies them (no permissive policy), but
-- removing the grants closes the door at the privilege layer too.
-- =============================================================================
DO $$
DECLARE
  t text;
  service_only text[] := ARRAY[
    'rag_essay_fragments','rag_transformations','essay_duplicates','ip_usage_tracking'
  ];
BEGIN
  FOREACH t IN ARRAY service_only LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- =============================================================================
-- STEP 4 — Harden SECURITY DEFINER functions in public.
--   * deduct_credits / check_credits / recalculate_completion_score: must NOT be
--     callable by anon (anonymous credit manipulation/probing). Keep authenticated
--     (current app intent) but revoke anon + PUBLIC.
--   * handle_new_user: trigger function; not meant to be called directly.
--   * current_clerk_user_id: benign (returns the caller's own sub); keep for
--     authenticated, revoke anon.
--   * Pin search_path on all to prevent search_path hijacking (also clears the
--     function_search_path_mutable advisory).
-- =============================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN ('deduct_credits','check_credits',
                        'recalculate_completion_score','handle_new_user',
                        'current_clerk_user_id')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon, PUBLIC', r.sig);
    EXECUTE format('ALTER FUNCTION public.%s SET search_path = public, pg_temp', r.sig);
  END LOOP;
END $$;

-- Re-grant EXECUTE to authenticated for the functions the app legitimately calls
-- as a logged-in user (revoked above via PUBLIC). handle_new_user is intentionally
-- NOT re-granted (it only ever runs as a trigger, owned by the table owner).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('current_clerk_user_id','deduct_credits','check_credits',
                        'recalculate_completion_score')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', r.sig);
  END LOOP;
END $$;
