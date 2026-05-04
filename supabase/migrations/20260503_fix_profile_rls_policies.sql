-- Fix RLS policies for profile tables to allow inserts
-- The current policies use FOR ALL which blocks inserts when no row exists yet
-- We need separate INSERT and UPDATE policies

-- Helper function to get current user's profile_id from Clerk JWT
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = (SELECT auth.jwt() ->> 'sub')
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================
-- experiences_activities
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own experiences" ON public.experiences_activities;
DROP POLICY IF EXISTS "Clerk: Users can modify own experiences" ON public.experiences_activities;

CREATE POLICY "Users can view own experiences_activities"
  ON public.experiences_activities FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own experiences_activities"
  ON public.experiences_activities FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own experiences_activities"
  ON public.experiences_activities FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

-- =============================================
-- academic_journey
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own academic" ON public.academic_journey;
DROP POLICY IF EXISTS "Clerk: Users can modify own academic" ON public.academic_journey;

CREATE POLICY "Users can view own academic_journey"
  ON public.academic_journey FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own academic_journey"
  ON public.academic_journey FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own academic_journey"
  ON public.academic_journey FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

-- =============================================
-- goals_aspirations
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own goals" ON public.goals_aspirations;
DROP POLICY IF EXISTS "Clerk: Users can modify own goals" ON public.goals_aspirations;

CREATE POLICY "Users can view own goals_aspirations"
  ON public.goals_aspirations FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own goals_aspirations"
  ON public.goals_aspirations FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own goals_aspirations"
  ON public.goals_aspirations FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

-- =============================================
-- personal_information
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own personal info" ON public.personal_information;
DROP POLICY IF EXISTS "Clerk: Users can modify own personal info" ON public.personal_information;

CREATE POLICY "Users can view own personal_information"
  ON public.personal_information FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own personal_information"
  ON public.personal_information FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own personal_information"
  ON public.personal_information FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

-- =============================================
-- family_responsibilities
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own family" ON public.family_responsibilities;
DROP POLICY IF EXISTS "Clerk: Users can modify own family" ON public.family_responsibilities;

CREATE POLICY "Users can view own family_responsibilities"
  ON public.family_responsibilities FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own family_responsibilities"
  ON public.family_responsibilities FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own family_responsibilities"
  ON public.family_responsibilities FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

-- =============================================
-- support_network
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own support" ON public.support_network;
DROP POLICY IF EXISTS "Clerk: Users can modify own support" ON public.support_network;

CREATE POLICY "Users can view own support_network"
  ON public.support_network FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own support_network"
  ON public.support_network FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own support_network"
  ON public.support_network FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

-- =============================================
-- personal_growth
-- =============================================
DROP POLICY IF EXISTS "Clerk: Users can view own growth" ON public.personal_growth;
DROP POLICY IF EXISTS "Clerk: Users can modify own growth" ON public.personal_growth;

CREATE POLICY "Users can view own personal_growth"
  ON public.personal_growth FOR SELECT
  TO authenticated
  USING (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can insert own personal_growth"
  ON public.personal_growth FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_user_profile_id());

CREATE POLICY "Users can update own personal_growth"
  ON public.personal_growth FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_user_profile_id());
