-- Comprehensive migration to switch from Supabase Auth to Clerk Auth
-- This script drops conflicting policies, updates column types, and recreates policies using Clerk JWTs.

-- 1. DROP EXISTING POLICIES
-- We must drop policies that reference auth.uid() against the user_id column before changing its type.

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "own_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "own_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "own_profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_modify_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Subscriptions & Billing
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;

-- Devices
DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can delete own devices" ON public.devices;
DROP POLICY IF EXISTS "own_devices_select" ON public.devices;
DROP POLICY IF EXISTS "own_devices_insert" ON public.devices;
DROP POLICY IF EXISTS "own_devices_update" ON public.devices;
DROP POLICY IF EXISTS "own_devices_delete" ON public.devices;


-- Child tables (referencing profiles.user_id)
-- These often use: ... WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- We should drop and recreate these to use the new logic.

-- Academic Journey
DROP POLICY IF EXISTS "Users can view their own academic journey" ON public.academic_journey;
DROP POLICY IF EXISTS "Users can create their own academic journey" ON public.academic_journey;
DROP POLICY IF EXISTS "Users can update their own academic journey" ON public.academic_journey;

-- Personal Info
DROP POLICY IF EXISTS "Users can view their own personal information" ON public.personal_information;
DROP POLICY IF EXISTS "Users can create their own personal information" ON public.personal_information;
DROP POLICY IF EXISTS "Users can update their own personal information" ON public.personal_information;

-- Experiences
DROP POLICY IF EXISTS "Users can view their own experiences activities" ON public.experiences_activities;
DROP POLICY IF EXISTS "Users can create their own experiences activities" ON public.experiences_activities;
DROP POLICY IF EXISTS "Users can update their own experiences activities" ON public.experiences_activities;

-- Family
DROP POLICY IF EXISTS "Users can view their own family responsibilities" ON public.family_responsibilities;
DROP POLICY IF EXISTS "Users can create their own family responsibilities" ON public.family_responsibilities;
DROP POLICY IF EXISTS "Users can update their own family responsibilities" ON public.family_responsibilities;

-- Goals
DROP POLICY IF EXISTS "Users can view their own goals aspirations" ON public.goals_aspirations;
DROP POLICY IF EXISTS "Users can create their own goals aspirations" ON public.goals_aspirations;
DROP POLICY IF EXISTS "Users can update their own goals aspirations" ON public.goals_aspirations;

-- Personal Growth
DROP POLICY IF EXISTS "Users can view their own personal growth" ON public.personal_growth;
DROP POLICY IF EXISTS "Users can create their own personal growth" ON public.personal_growth;
DROP POLICY IF EXISTS "Users can update their own personal growth" ON public.personal_growth;

-- Support Network
DROP POLICY IF EXISTS "Users can view their own support network" ON public.support_network;
DROP POLICY IF EXISTS "Users can create their own support network" ON public.support_network;
DROP POLICY IF EXISTS "Users can update their own support network" ON public.support_network;


-- 2. ALTER COLUMNS TO TEXT
-- This allows storing Clerk IDs (e.g., 'user_2q...')

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE text;

ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
ALTER TABLE public.credit_transactions ALTER COLUMN user_id TYPE text;

ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_user_id_fkey;
ALTER TABLE public.devices ALTER COLUMN user_id TYPE text;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE text;


-- 3. RE-CREATE INDEXES

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);


-- 4. RE-CREATE POLICIES FOR CLERK
-- Logic: Compare user_id text column with the 'sub' claim in the JWT.

-- Profiles
CREATE POLICY "Clerk: Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub'));

CREATE POLICY "Clerk: Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub'));

CREATE POLICY "Clerk: Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));

-- Subscriptions
CREATE POLICY "Clerk: Users can view own subscriptions" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub'));

-- Transactions
CREATE POLICY "Clerk: Users can view own transactions" ON public.credit_transactions
    FOR SELECT TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub'));

-- Helper for child tables
-- We can use a join or a subquery. Subquery is standard.

-- Academic Journey
CREATE POLICY "Clerk: Users can view own academic journey" ON public.academic_journey
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own academic journey" ON public.academic_journey
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- Personal Info
CREATE POLICY "Clerk: Users can view own personal info" ON public.personal_information
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own personal info" ON public.personal_information
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- Experiences
CREATE POLICY "Clerk: Users can view own experiences" ON public.experiences_activities
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own experiences" ON public.experiences_activities
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- Family
CREATE POLICY "Clerk: Users can view own family" ON public.family_responsibilities
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own family" ON public.family_responsibilities
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- Goals
CREATE POLICY "Clerk: Users can view own goals" ON public.goals_aspirations
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own goals" ON public.goals_aspirations
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- Personal Growth
CREATE POLICY "Clerk: Users can view own growth" ON public.personal_growth
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own growth" ON public.personal_growth
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- Support Network
CREATE POLICY "Clerk: Users can view own support" ON public.support_network
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can modify own support" ON public.support_network
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));


