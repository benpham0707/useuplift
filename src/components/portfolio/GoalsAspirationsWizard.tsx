import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Target, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { apiFetch } from '@/lib/utils';

interface GoalsAspirationsData {
  // Academic & Career Interests
  intendedMajor: string;
  careerInterests: string[];
  highestDegree: string;
  collegeEnvironment: string[];
  
  // College Application Plans
  applyingToUC: string;
  usingCommonApp: string;
  startDate: string;
  geographicPreferences: string[];
  needBasedAid: string;
  meritScholarships: string;
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
  onProgressRefresh?: () => void;
}

const STEPS = [
  { id: 1, title: 'Academic & Career Interests', description: 'Your field of study and career goals' },
  { id: 2, title: 'College Application Plans', description: 'Your college application timeline and preferences' }
];

const GoalsAspirationsWizard: React.FC<Props> = ({ onComplete, onCancel, onProgressRefresh }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [data, setData] = useState<GoalsAspirationsData>({
    intendedMajor: '',
    careerInterests: [],
    highestDegree: '',
    collegeEnvironment: [],
    applyingToUC: '',
    usingCommonApp: '',
    startDate: '',
    geographicPreferences: [],
    needBasedAid: '',
    meritScholarships: ''
  });

  // Prefill from latest saved goals_aspirations
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;

        const { data: ga } = await supabase
          .from('goals_aspirations')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!ga) return;

        setData((prev) => ({
          ...prev,
          intendedMajor: ga.intended_major || '',
          careerInterests: Array.isArray(ga.career_interests) ? ga.career_interests : [],
          highestDegree: ga.highest_degree || '',
          collegeEnvironment: Array.isArray(ga.preferred_environment) ? ga.preferred_environment : [],
          applyingToUC: '',
          usingCommonApp: '',
          startDate: '',
          geographicPreferences: [],
          needBasedAid: '',
          meritScholarships: ''
        }));
      } catch (_) {
        // ignore prefill errors
      }
    })();
  }, []);

  // Progress calculation across steps (2 sections)
  const progress = useMemo(() => {
    const academicComplete =
      (data.intendedMajor?.trim().length ?? 0) > 0 ||
      (data.highestDegree?.trim().length ?? 0) > 0 ||
      (Array.isArray(data.careerInterests) && data.careerInterests.length > 0) ||
      (Array.isArray(data.collegeEnvironment) && data.collegeEnvironment.length > 0);

    const plansComplete =
      (data.applyingToUC?.trim().length ?? 0) > 0 ||
      (data.usingCommonApp?.trim().length ?? 0) > 0 ||
      (data.startDate?.trim().length ?? 0) > 0 ||
      (Array.isArray(data.geographicPreferences) && data.geographicPreferences.length > 0) ||
      (data.needBasedAid?.trim().length ?? 0) > 0 ||
      (data.meritScholarships?.trim().length ?? 0) > 0;

    const completed = [academicComplete, plansComplete].filter(Boolean).length;
    const percent = Math.round((completed / 2) * 100);

    return {
      percent,
      sectionComplete: {
        academic: academicComplete,
        plans: plansComplete,
      },
    } as const;
  }, [data]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, completion_score')
        .eq('user_id', user.id)
        .single();
      if (!profile) throw new Error('Profile not found');

      const gaPayload = {
        profile_id: profile.id,
        intended_major: data.intendedMajor || null,
        career_interests: data.careerInterests || [],
        highest_degree: data.highestDegree || null,
        college_environment: data.collegeEnvironment || [],
        applying_to_uc: data.applyingToUC || null,
        using_common_app: data.usingCommonApp || null,
        start_date: data.startDate || null,
        geographic_preferences: data.geographicPreferences || [],
        need_based_aid: data.needBasedAid || null,
        merit_scholarships: data.meritScholarships || null,
      } as any;

      // Upsert pattern: select existing by profile_id, then update/insert
      const { data: existingGA, error: gaFetchErr } = await supabase
        .from('goals_aspirations')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (gaFetchErr) throw gaFetchErr;

      if (existingGA?.id) {
        const { error: gaUpdateErr } = await supabase
          .from('goals_aspirations')
          .update(gaPayload)
          .eq('id', existingGA.id as string);
        if (gaUpdateErr) throw gaUpdateErr;
      } else {
        const { error: gaInsertErr } = await supabase
          .from('goals_aspirations')
          .insert(gaPayload);
        if (gaInsertErr) throw gaInsertErr;
      }

      // Update profile completion score (aligned with other wizards)
      const newScore = Math.max(Number(profile.completion_score ?? 0), 0.6);
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ completion_score: newScore })
        .eq('id', profile.id);
      if (profileErr) throw profileErr;

      // Reconcile analytics automatically
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (token) {
          await apiFetch('/api/v1/analytics/reconcile', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
          window.dispatchEvent(new CustomEvent('analytics:reconciled'));
        }
      } catch { /* non-blocking */ }

      toast({
        title: "Goals & aspirations saved!",
        description: "Your academic and career goals have been recorded.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving goals and aspirations:', error);
      toast({
        title: "Error saving information",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <AcademicInterestsStep data={data} setData={setData} />;
      case 2:
        return <ApplicationPlansStep data={data} setData={setData} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col">
      {/* Compact Header (match other sections) */}
      <div className="flex-shrink-0 border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Goals & Aspirations</h1>
            <p className="text-sm text-muted-foreground">Define your interests and application plans</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{progress.percent}% complete</span>
            </div>
            <div className="mt-1">
              <Progress value={progress.percent} className="h-2 w-48 ml-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full height scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {renderCurrentStep()}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between p-3 border-t flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary"
            size="sm"
            onClick={async () => {
              setIsLoading(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id, completion_score')
                  .eq('user_id', user.id)
                  .single();
                if (!profile) throw new Error('Profile not found');

                const gaPayload = {
                  profile_id: profile.id,
                  intended_major: data.intendedMajor || null,
                  career_interests: data.careerInterests || [],
                  highest_degree: data.highestDegree || null,
                  college_environment: data.collegeEnvironment || [],
                  applying_to_uc: data.applyingToUC || null,
                  using_common_app: data.usingCommonApp || null,
                  start_date: data.startDate || null,
                  geographic_preferences: data.geographicPreferences || [],
                  need_based_aid: data.needBasedAid || null,
                  merit_scholarships: data.meritScholarships || null,
                } as any;

                const { data: existingGA } = await supabase
                  .from('goals_aspirations')
                  .select('id')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                if (existingGA?.id) {
                  await supabase.from('goals_aspirations').update(gaPayload).eq('id', existingGA.id);
                } else {
                  await supabase.from('goals_aspirations').insert(gaPayload);
                }

                await supabase
                  .from('profiles')
                  .update({ completion_score: Math.max(Number(profile.completion_score ?? 0), 0.3) })
                  .eq('id', profile.id);

                toast({ title: 'Progress saved', description: 'You can come back anytime.' });
                onProgressRefresh?.();
              } catch (_) {
                toast({ title: 'Save failed', description: 'Try again later.', variant: 'destructive' });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            Save & Quit
          </Button>

          {currentStep < STEPS.length ? (
            <Button size="sm" onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Complete'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const AcademicInterestsStep: React.FC<{
  data: GoalsAspirationsData;
  setData: (data: GoalsAspirationsData) => void;
}> = ({ data, setData }) => {
  const commonMajors = [
    'Undecided',
    'Business Administration',
    'Computer Science',
    'Engineering',
    'Biology/Pre-Med',
    'Psychology',
    'Political Science',
    'Economics',
    'English/Literature',
    'History',
    'Art/Fine Arts',
    'Mathematics',
    'Chemistry',
    'Physics',
    'Nursing',
    'Education',
    'Communications',
    'Criminal Justice',
    'Social Work',
    'Environmental Science',
    'Other'
  ];

  const careerFields = [
    'Technology/Software',
    'Healthcare/Medicine',
    'Business/Finance',
    'Education',
    'Engineering',
    'Arts/Entertainment',
    'Law/Legal',
    'Science/Research',
    'Public Service/Government',
    'Social Services',
    'Marketing/Communications',
    'Architecture/Design',
    'Journalism/Media',
    'Environmental/Sustainability',
    'Exploring/Undecided'
  ];

  const collegeEnvironments = [
    'Large university (15,000+ students)',
    'Medium university (5,000-15,000 students)',
    'Small college (under 5,000 students)',
    'Urban setting',
    'Suburban setting',
    'Rural setting',
    'Liberal arts focus',
    'Research-focused institution',
    'Strong athletics program',
    'Diverse student body',
    'Close-knit community'
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      <h3 className="text-lg font-medium mb-6">Academic & Career Interests</h3>
      
      {/* Top Row - Dropdowns Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label htmlFor="intended-major" className="text-sm font-medium">Intended Major or Field of Study</Label>
          <Select value={data.intendedMajor} onValueChange={(value) => setData({ ...data, intendedMajor: value })}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your intended major" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {commonMajors.map(major => (
                <SelectItem key={major} value={major.toLowerCase().replace(/\s+/g, '_')}>
                  {major}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="highest-degree" className="text-sm font-medium">Highest Degree You Intend to Earn</Label>
          <Select value={data.highestDegree} onValueChange={(value) => setData({ ...data, highestDegree: value })}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select highest degree goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
              <SelectItem value="masters">Master's Degree</SelectItem>
              <SelectItem value="phd">PhD/Doctorate</SelectItem>
              <SelectItem value="md">Medical Degree (MD)</SelectItem>
              <SelectItem value="jd">Law Degree (JD)</SelectItem>
              <SelectItem value="other_professional">Other Professional Degree</SelectItem>
              <SelectItem value="undecided">Undecided</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Career Interests - Single Column List */}
      <div className="mb-8">
        <Label className="text-sm font-medium mb-3 block">Career Interests (select all that apply)</Label>
        <div className="border rounded-lg p-4 h-60 overflow-y-auto bg-background">
          <div className="space-y-2">
            {careerFields.map(field => (
              <div key={field} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                <Checkbox
                  id={`career-${field}`}
                  checked={data.careerInterests.includes(field)}
                  onCheckedChange={() => setData({
                    ...data,
                    careerInterests: toggleArrayItem(data.careerInterests, field)
                  })}
                />
                <Label htmlFor={`career-${field}`} className="text-sm cursor-pointer flex-1">{field}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* College Environment Preferences - Single Column List */}
      <div>
        <Label className="text-sm font-medium mb-3 block">College Environment Preferences (select all that appeal to you)</Label>
        <div className="border rounded-lg p-4 h-60 overflow-y-auto bg-background">
          <div className="space-y-2">
            {collegeEnvironments.map(env => (
              <div key={env} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                <Checkbox
                  id={`env-${env}`}
                  checked={data.collegeEnvironment.includes(env)}
                  onCheckedChange={() => setData({
                    ...data,
                    collegeEnvironment: toggleArrayItem(data.collegeEnvironment, env)
                  })}
                />
                <Label htmlFor={`env-${env}`} className="text-sm cursor-pointer flex-1">{env}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationPlansStep: React.FC<{
  data: GoalsAspirationsData;
  setData: (data: GoalsAspirationsData) => void;
}> = ({ data, setData }) => {
  const geographicOptions = [
    'Stay in state',
    'West Coast',
    'East Coast',
    'Midwest',
    'South',
    'Southwest',
    'No geographic preference',
    'International'
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">College Application Plans</h3>
        
        {/* Application Questions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <Label htmlFor="uc-application" className="text-sm font-medium">Planning to apply to UC system schools?</Label>
            <Select value={data.applyingToUC} onValueChange={(value) => setData({ ...data, applyingToUC: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="common-app" className="text-sm font-medium">Planning to use the Common Application?</Label>
            <Select value={data.usingCommonApp} onValueChange={(value) => setData({ ...data, usingCommonApp: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-date" className="text-sm font-medium">When do you plan to start college?</Label>
            <Select value={data.startDate} onValueChange={(value) => setData({ ...data, startDate: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select start date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fall_2025">Fall 2025</SelectItem>
                <SelectItem value="spring_2026">Spring 2026</SelectItem>
                <SelectItem value="fall_2026">Fall 2026</SelectItem>
                <SelectItem value="gap_year">Taking a gap year</SelectItem>
                <SelectItem value="undecided">Undecided</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Financial Aid Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="need-based-aid" className="text-sm font-medium">Do you expect to apply for need-based financial aid?</Label>
            <Select value={data.needBasedAid} onValueChange={(value) => setData({ ...data, needBasedAid: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="merit-scholarships" className="text-sm font-medium">Are you interested in merit-based scholarships?</Label>
            <Select value={data.meritScholarships} onValueChange={(value) => setData({ ...data, meritScholarships: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Geographic Preferences */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Geographic Preferences for College (select all that apply)</Label>
          <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-background">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {geographicOptions.map(option => (
                <div key={option} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Checkbox
                    id={`geo-${option}`}
                    checked={data.geographicPreferences.includes(option)}
                    onCheckedChange={() => setData({
                      ...data,
                      geographicPreferences: toggleArrayItem(data.geographicPreferences, option)
                    })}
                  />
                  <Label htmlFor={`geo-${option}`} className="text-sm cursor-pointer flex-1">{option}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsAspirationsWizard;