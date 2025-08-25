-- Enable Row Level Security on personal information related tables
ALTER TABLE public.personal_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals_aspirations ENABLE ROW_LEVEL_SECURITY;
ALTER TABLE public.personal_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_network ENABLE ROW LEVEL_SECURITY;

-- Create RLS policies for personal_information table
CREATE POLICY "Users can view their own personal information" 
ON public.personal_information 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own personal information" 
ON public.personal_information 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own personal information" 
ON public.personal_information 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for academic_journey table
CREATE POLICY "Users can view their own academic journey" 
ON public.academic_journey 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own academic journey" 
ON public.academic_journey 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own academic journey" 
ON public.academic_journey 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for experiences_activities table
CREATE POLICY "Users can view their own experiences activities" 
ON public.experiences_activities 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own experiences activities" 
ON public.experiences_activities 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own experiences activities" 
ON public.experiences_activities 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for family_responsibilities table
CREATE POLICY "Users can view their own family responsibilities" 
ON public.family_responsibilities 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own family responsibilities" 
ON public.family_responsibilities 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own family responsibilities" 
ON public.family_responsibilities 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for goals_aspirations table
CREATE POLICY "Users can view their own goals aspirations" 
ON public.goals_aspirations 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own goals aspirations" 
ON public.goals_aspirations 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own goals aspirations" 
ON public.goals_aspirations 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for personal_growth table
CREATE POLICY "Users can view their own personal growth" 
ON public.personal_growth 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own personal growth" 
ON public.personal_growth 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own personal growth" 
ON public.personal_growth 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for support_network table
CREATE POLICY "Users can view their own support network" 
ON public.support_network 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own support network" 
ON public.support_network 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own support network" 
ON public.support_network 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);