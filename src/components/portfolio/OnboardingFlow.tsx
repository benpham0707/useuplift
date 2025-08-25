import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface OnboardingData {
  gradeLevel: string;
  gpa: string;
  primaryGoals: string[];
  mainChallenges: string[];
  financialNeed: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    gradeLevel: '',
    gpa: '',
    primaryGoals: [],
    mainChallenges: [],
    financialNeed: ''
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit single payload to backend API
      const payload = {
        academicLevel: formData.gradeLevel,
        gpa: formData.gpa || undefined,
        goals: formData.primaryGoals,
        challenges: formData.mainChallenges,
        financialBand: (formData.financialNeed || 'unknown') as 'high' | 'moderate' | 'low' | 'unknown'
      };
      try {
        // Attach Supabase JWT if available for API auth
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        const resp = await fetch('/api/v1/assessment/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error('server_unavailable');
        onComplete();
      } catch (e) {
        // Fallback: write directly from the client using the user's Supabase session
        try {
          await completeAssessmentClientSide(payload);
          onComplete();
        } catch (err) {
          // eslint-disable-next-line no-alert
          alert('Could not complete assessment. Please try again.');
        }
      }
    }
  };

  async function completeAssessmentClientSide(payload: {
    academicLevel: string;
    gpa?: string;
    goals: string[];
    challenges: string[];
    financialBand: 'high' | 'moderate' | 'low' | 'unknown';
  }) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) throw new Error('not_authenticated');

    // Ensure profile
    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (pErr) throw pErr;
    let profileId = prof?.id as string | undefined;
    if (!profileId) {
      const { data: created, error: cErr } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          user_context: 'high_school_11th',
          status: 'initial'
        })
        .select('id')
        .single();
      if (cErr) throw cErr;
      profileId = created.id;
    }

    const gpaNum = parseGPA(payload.gpa);
    const { error: aErr } = await supabase
      .from('academic_journey')
      .upsert({
        profile_id: profileId,
        current_grade: payload.academicLevel,
        gpa: gpaNum ?? null
      }, { onConflict: 'profile_id' });
    if (aErr) throw aErr;

    const goals = {
      primaryGoal: 'exploring_options',
      desiredOutcomes: payload.goals,
      timelineUrgency: 'flexible'
    } as any;

    const constraints = {
      needsFinancialAid: ['high', 'moderate'].includes(payload.financialBand),
      financialBand: payload.financialBand,
      challenges: payload.challenges
    } as any;

    const completion_details = {
      overall: 0.35,
      sections: { basic: 1, goals: 1, academic: 1, enrichment: 0, experience: 0 }
    } as any;

    const { error: uErr } = await supabase
      .from('profiles')
      .update({
        goals,
        constraints,
        completion_score: 0.35,
        completion_details,
        has_completed_assessment: true
      })
      .eq('id', profileId);
    if (uErr) throw uErr;

    // Assessment sessions removed for current schema
    // const { error: sErr } = await supabase
    //   .from('assessment_sessions')
    //   .insert({
    //     profile_id: profileId,
    //     session_type: 'initial',
    //     total_questions: 5,
    //     questions_answered: 5,
    //     completion_rate: 1,
    //     completed_at: new Date().toISOString(),
    //     responses: {
    //       academicLevel: payload.academicLevel,
    //       gpa: payload.gpa ?? null,
    //       goals: payload.goals,
    //       challenges: payload.challenges,
    //       financialBand: payload.financialBand
    //     },
    //     insights: {}
    //   });
    // if (sErr) throw sErr;
  }

  function parseGPA(s?: string) {
    if (!s) return null as number | null;
    const cleaned = String(s).trim().toLowerCase();
    if (cleaned.includes('not')) return null;
    const pct = cleaned.endsWith('%');
    const num = Number(cleaned.replace(/[,%]/g, ''));
    if (Number.isNaN(num)) return null;
    if (pct) return +(Math.min(Math.max(num, 0), 100) / 25).toFixed(2);
    return +num.toFixed(2);
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayValue = (field: 'primaryGoals' | 'mainChallenges', value: string) => {
    const currentArray = formData[field];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFormData(field, newArray);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Smart Assessment</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Let's Build Your Profile
        </h1>
        <p className="text-muted-foreground">
          Just 5 essential questions to get started. We'll personalize everything based on your unique situation.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {currentStep}
            </span>
            {getStepTitle(currentStep)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent(currentStep, formData, updateFormData, toggleArrayValue)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!isStepValid(currentStep, formData)}
          className="flex items-center gap-2"
        >
          {currentStep === totalSteps ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Complete Setup
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const getStepTitle = (step: number): string => {
  const titles = [
    "What's your current academic level?",
    "How are you performing academically?", 
    "What are your main goals?",
    "What challenges are you facing?",
    "What's your financial situation?"
  ];
  return titles[step - 1];
};

const renderStepContent = (
  step: number,
  formData: OnboardingData,
  updateFormData: (field: keyof OnboardingData, value: any) => void,
  toggleArrayValue: (field: 'primaryGoals' | 'mainChallenges', value: string) => void
) => {
  switch (step) {
    case 1:
      return (
        <RadioGroup 
          value={formData.gradeLevel} 
          onValueChange={(value) => updateFormData('gradeLevel', value)}
          className="space-y-3"
        >
          {[
            { value: 'freshman', label: 'High School Freshman (9th Grade)' },
            { value: 'sophomore', label: 'High School Sophomore (10th Grade)' },
            { value: 'junior', label: 'High School Junior (11th Grade)' },
            { value: 'senior', label: 'High School Senior (12th Grade)' },
            { value: 'gap-year', label: 'Gap Year / Recent Graduate' },
            { value: 'college', label: 'College Student' }
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 2:
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="gpa">Current GPA (if known)</Label>
            <Input
              id="gpa"
              type="text"
              placeholder="e.g., 3.5, 85%, or 'Not sure'"
              value={formData.gpa}
              onChange={(e) => updateFormData('gpa', e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Don't worry if you're not sure - we can work with any information you have
            </p>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select all that apply:</p>
          <div className="grid gap-3">
            {[
              'Get into college',
              'Find scholarships',
              'Explore career options',
              'Build job skills',
              'Start a business',
              'Learn a trade',
              'Gap year planning',
              'Improve academic performance'
            ].map((goal) => (
              <div 
                key={goal}
                onClick={() => toggleArrayValue('primaryGoals', goal)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.primaryGoals.includes(goal)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{goal}</span>
                  {formData.primaryGoals.includes(goal) && (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">What obstacles are you facing? (Select all that apply)</p>
          <div className="grid gap-3">
            {[
              'Financial constraints',
              'Don\'t know what I want to do',
              'Low grades/test scores',
              'Family obligations',
              'Work responsibilities', 
              'Lack of guidance',
              'Application process feels overwhelming',
              'No clear path after high school'
            ].map((challenge) => (
              <div 
                key={challenge}
                onClick={() => toggleArrayValue('mainChallenges', challenge)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.mainChallenges.includes(challenge)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{challenge}</span>
                  {formData.mainChallenges.includes(challenge) && (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 5:
      return (
        <RadioGroup 
          value={formData.financialNeed} 
          onValueChange={(value) => updateFormData('financialNeed', value)}
          className="space-y-3"
        >
          {[
            { value: 'high', label: 'High - Need significant financial aid/scholarships' },
            { value: 'moderate', label: 'Moderate - Some financial assistance needed' },
            { value: 'low', label: 'Low - Can mostly afford college/training costs' },
            { value: 'unsure', label: 'Not sure - Haven\'t looked into costs yet' }
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    default:
      return null;
  }
};

const isStepValid = (step: number, formData: OnboardingData): boolean => {
  switch (step) {
    case 1:
      return formData.gradeLevel !== '';
    case 2:
      return formData.gpa !== '';
    case 3:
      return formData.primaryGoals.length > 0;
    case 4:
      return formData.mainChallenges.length > 0;
    case 5:
      return formData.financialNeed !== '';
    default:
      return false;
  }
};

export default OnboardingFlow;