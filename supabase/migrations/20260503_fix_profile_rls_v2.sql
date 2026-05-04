-- Fix RLS policies with better approach - check JWT directly in policies
-- The issue is that get_user_profile_id() might not work reliably with Clerk
-- We'll use a more direct approach that checks profile ownership via user_id

-- Drop the old helper function
DROP FUNCTION IF EXISTS public.get_user_profile_id();

-- =============================================
-- experiences_activities
-- =============================================
DROP POLICY IF EXISTS "Users can view own experiences_activities" ON public.experiences_activities;
DROP POLICY IF EXISTS "Users can insert own experiences_activities" ON public.experiences_activities;
DROP POLICY IF EXISTS "Users can update own experiences_activities" ON public.experiences_activities;

CREATE POLICY "Users can view own experiences_activities"
  ON public.experiences_activities FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own experiences_activities"
  ON public.experiences_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own experiences_activities"
  ON public.experiences_activities FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =============================================
-- academic_journey
-- =============================================
DROP POLICY IF EXISTS "Users can view own academic_journey" ON public.academic_journey;
DROP POLICY IF EXISTS "Users can insert own academic_journey" ON public.academic_journey;
DROP POLICY IF EXISTS "Users can update own academic_journey" ON public.academic_journey;

CREATE POLICY "Users can view own academic_journey"
  ON public.academic_journey FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own academic_journey"
  ON public.academic_journey FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own academic_journey"
  ON public.academic_journey FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =============================================
-- goals_aspirations
-- =============================================
DROP POLICY IF EXISTS "Users can view own goals_aspirations" ON public.goals_aspirations;
DROP POLICY IF EXISTS "Users can insert own goals_aspirations" ON public.goals_aspirations;
DROP POLICY IF EXISTS "Users can update own goals_aspirations" ON public.goals_aspirations;

CREATE POLICY "Users can view own goals_aspirations"
  ON public.goals_aspirations FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own goals_aspirations"
  ON public.goals_aspirations FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own goals_aspirations"
  ON public.goals_aspirations FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =============================================
-- personal_information
-- =============================================
DROP POLICY IF EXISTS "Users can view own personal_information" ON public.personal_information;
DROP POLICY IF EXISTS "Users can insert own personal_information" ON public.personal_information;
DROP POLICY IF EXISTS "Users can update own personal_information" ON public.personal_information;

CREATE POLICY "Users can view own personal_information"
  ON public.personal_information FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own personal_information"
  ON public.personal_information FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own personal_information"
  ON public.personal_information FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =============================================
-- family_responsibilities
-- =============================================
DROP POLICY IF EXISTS "Users can view own family_responsibilities" ON public.family_responsibilities;
DROP POLICY IF EXISTS "Users can insert own family_responsibilities" ON public.family_responsibilities;
DROP POLICY IF EXISTS "Users can update own family_responsibilities" ON public.family_responsibilities;

CREATE POLICY "Users can view own family_responsibilities"
  ON public.family_responsibilities FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own family_responsibilities"
  ON public.family_responsibilities FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own family_responsibilities"
  ON public.family_responsibilities FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =============================================
-- support_network
-- =============================================
DROP POLICY IF EXISTS "Users can view own support_network" ON public.support_network;
DROP POLICY IF EXISTS "Users can insert own support_network" ON public.support_network;
DROP POLICY IF EXISTS "Users can update own support_network" ON public.support_network;

CREATE POLICY "Users can view own support_network"
  ON public.support_network FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own support_network"
  ON public.support_network FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own support_network"
  ON public.support_network FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =============================================
-- personal_growth
-- =============================================
DROP POLICY IF EXISTS "Users can view own personal_growth" ON public.personal_growth;
DROP POLICY IF EXISTS "Users can insert own personal_growth" ON public.personal_growth;
DROP POLICY IF EXISTS "Users can update own personal_growth" ON public.personal_growth;

CREATE POLICY "Users can view own personal_growth"
  ON public.personal_growth FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert own personal_growth"
  ON public.personal_growth FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can update own personal_growth"
  ON public.personal_growth FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );
