
-- =============================================
-- profiles: core user profile table
-- user_id is TEXT (Clerk user ID, not Supabase auth UUID)
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  user_context TEXT DEFAULT 'high_school_11th',
  credits INTEGER NOT NULL DEFAULT 10,
  referral_discount_active BOOLEAN NOT NULL DEFAULT false,
  completion_score NUMERIC DEFAULT 0,
  has_completed_assessment BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile; insert allowed for new users
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

-- =============================================
-- credit_transactions
-- =============================================
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (true);

-- =============================================
-- personal_information
-- =============================================
CREATE TABLE public.personal_information (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  pronouns TEXT,
  gender_identity TEXT,
  permanent_address JSONB DEFAULT '{}',
  hispanic_latino TEXT,
  citizenship_status TEXT,
  primary_language TEXT,
  parent_guardians JSONB DEFAULT '[]',
  living_situation TEXT,
  first_gen BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_information ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own personal_information" ON public.personal_information FOR SELECT USING (true);
CREATE POLICY "Users can insert own personal_information" ON public.personal_information FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own personal_information" ON public.personal_information FOR UPDATE USING (true);

-- =============================================
-- academic_journey
-- =============================================
CREATE TABLE public.academic_journey (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_school JSONB DEFAULT '{}',
  current_grade TEXT,
  expected_grad_date DATE,
  gpa NUMERIC,
  gpa_scale TEXT,
  gpa_type TEXT,
  class_rank TEXT,
  class_size INTEGER,
  rank_reporting_method TEXT,
  will_graduate_from_school BOOLEAN DEFAULT true,
  is_boarding_school BOOLEAN DEFAULT false,
  other_schools JSONB DEFAULT '{}',
  studied_abroad BOOLEAN DEFAULT false,
  homeschooled BOOLEAN DEFAULT false,
  course_history JSONB DEFAULT '[]',
  took_math_early BOOLEAN DEFAULT false,
  took_language_early BOOLEAN DEFAULT false,
  college_courses JSONB DEFAULT '[]',
  report_test_scores BOOLEAN DEFAULT false,
  standardized_tests JSONB DEFAULT '{}',
  taking_ap_exams BOOLEAN DEFAULT false,
  ap_exams JSONB DEFAULT '[]',
  in_ib_programme BOOLEAN DEFAULT false,
  ib_exams JSONB DEFAULT '[]',
  need_english_proficiency BOOLEAN DEFAULT false,
  english_proficiency JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academic_journey ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own academic_journey" ON public.academic_journey FOR SELECT USING (true);
CREATE POLICY "Users can insert own academic_journey" ON public.academic_journey FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own academic_journey" ON public.academic_journey FOR UPDATE USING (true);

-- =============================================
-- experiences_activities
-- =============================================
CREATE TABLE public.experiences_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_experiences JSONB DEFAULT '[]',
  volunteer_service JSONB DEFAULT '[]',
  extracurriculars JSONB DEFAULT '[]',
  personal_projects JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own experiences" ON public.experiences_activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own experiences" ON public.experiences_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own experiences" ON public.experiences_activities FOR UPDATE USING (true);

-- =============================================
-- personal_growth
-- =============================================
CREATE TABLE public.personal_growth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meaningful_experiences JSONB DEFAULT '{}',
  additional_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_growth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own personal_growth" ON public.personal_growth FOR SELECT USING (true);
CREATE POLICY "Users can insert own personal_growth" ON public.personal_growth FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own personal_growth" ON public.personal_growth FOR UPDATE USING (true);

-- =============================================
-- family_responsibilities
-- =============================================
CREATE TABLE public.family_responsibilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responsibilities JSONB DEFAULT '{}',
  life_circumstances JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.family_responsibilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own family_responsibilities" ON public.family_responsibilities FOR SELECT USING (true);
CREATE POLICY "Users can insert own family_responsibilities" ON public.family_responsibilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own family_responsibilities" ON public.family_responsibilities FOR UPDATE USING (true);

-- =============================================
-- goals_aspirations
-- =============================================
CREATE TABLE public.goals_aspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intended_major TEXT,
  preferred_environment JSONB DEFAULT '[]',
  career_interests JSONB DEFAULT '[]',
  highest_degree TEXT,
  college_plans JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals_aspirations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals_aspirations" ON public.goals_aspirations FOR SELECT USING (true);
CREATE POLICY "Users can insert own goals_aspirations" ON public.goals_aspirations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own goals_aspirations" ON public.goals_aspirations FOR UPDATE USING (true);

-- =============================================
-- support_network
-- =============================================
CREATE TABLE public.support_network (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  counselor JSONB DEFAULT '{}',
  teachers JSONB DEFAULT '[]',
  community_support JSONB DEFAULT '{}',
  portfolio_items JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_network ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own support_network" ON public.support_network FOR SELECT USING (true);
CREATE POLICY "Users can insert own support_network" ON public.support_network FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own support_network" ON public.support_network FOR UPDATE USING (true);

-- =============================================
-- essays
-- =============================================
CREATE TABLE public.essays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  essay_type TEXT NOT NULL,
  prompt_text TEXT,
  draft_original TEXT,
  draft_current TEXT,
  max_words INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own essays" ON public.essays FOR SELECT USING (true);
CREATE POLICY "Users can insert own essays" ON public.essays FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own essays" ON public.essays FOR UPDATE USING (true);

-- =============================================
-- essay_analysis_reports
-- =============================================
CREATE TABLE public.essay_analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  overall_score NUMERIC,
  dimension_scores JSONB DEFAULT '{}',
  summary TEXT,
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  teaching_feedback JSONB DEFAULT '{}',
  raw_result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.essay_analysis_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.essay_analysis_reports FOR SELECT USING (true);
CREATE POLICY "Users can insert own reports" ON public.essay_analysis_reports FOR INSERT WITH CHECK (true);

-- =============================================
-- essay_revision_history
-- =============================================
CREATE TABLE public.essay_revision_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  draft_content TEXT,
  word_count INTEGER,
  change_summary TEXT,
  created_by TEXT,
  label TEXT,
  parent_version_id UUID,
  score NUMERIC,
  dimension_scores JSONB DEFAULT '{}',
  analysis_report_id UUID REFERENCES public.essay_analysis_reports(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.essay_revision_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own revisions" ON public.essay_revision_history FOR SELECT USING (true);
CREATE POLICY "Users can insert own revisions" ON public.essay_revision_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own revisions" ON public.essay_revision_history FOR UPDATE USING (true);

-- =============================================
-- updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_information_updated_at BEFORE UPDATE ON public.personal_information FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academic_journey_updated_at BEFORE UPDATE ON public.academic_journey FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_experiences_activities_updated_at BEFORE UPDATE ON public.experiences_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_growth_updated_at BEFORE UPDATE ON public.personal_growth FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_responsibilities_updated_at BEFORE UPDATE ON public.family_responsibilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_aspirations_updated_at BEFORE UPDATE ON public.goals_aspirations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_network_updated_at BEFORE UPDATE ON public.support_network FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_essays_updated_at BEFORE UPDATE ON public.essays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
