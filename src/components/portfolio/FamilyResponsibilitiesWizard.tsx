import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface FamilyResponsibilitiesData {
  hoursPerWeek: number;
  responsibilities: string[];
  otherResponsibilities: string;
  challengingCircumstances: boolean;
  circumstances: string[];
  otherCircumstances: string;
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
  onProgressRefresh?: () => void;
}

const STEPS = [
  { id: 1, title: 'Family Responsibilities', description: 'Significant responsibilities at home' },
  { id: 2, title: 'Life Circumstances', description: 'Challenging circumstances affecting your education' }
];

const FamilyResponsibilitiesWizard: React.FC<Props> = ({ onComplete, onCancel, onProgressRefresh }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [data, setData] = useState<FamilyResponsibilitiesData>({
    hoursPerWeek: 0,
    responsibilities: [],
    otherResponsibilities: '',
    challengingCircumstances: false,
    circumstances: [],
    otherCircumstances: ''
  });

  // Prefill from latest saved family_responsibilities
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

        const { data: fr } = await supabase
          .from('family_responsibilities')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!fr) return;

        setData((prev) => ({
          ...prev,
          hoursPerWeek: 0,
          responsibilities: [],
          otherResponsibilities: '',
          challengingCircumstances: false,
          circumstances: [],
          otherCircumstances: ''
        }));
      } catch (_) {
        // ignore prefill errors
      }
    })();
  }, []);

  // Progress calculation across steps
  const progress = useMemo(() => {
    const responsibilitiesComplete =
      (data.hoursPerWeek ?? 0) > 0 ||
      (Array.isArray(data.responsibilities) && data.responsibilities.length > 0) ||
      (data.otherResponsibilities?.trim().length ?? 0) > 0;

    const circumstancesComplete =
      !data.challengingCircumstances ||
      (Array.isArray(data.circumstances) && data.circumstances.length > 0);

    const completed = [responsibilitiesComplete, circumstancesComplete].filter(Boolean).length;
    const percent = Math.round((completed / 2) * 100);

    return {
      percent,
      sectionComplete: {
        responsibilities: responsibilitiesComplete,
        circumstances: circumstancesComplete,
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

      const frPayload = {
        profile_id: profile.id,
        hours_per_week: data.hoursPerWeek ?? 0,
        responsibilities: data.responsibilities ?? [],
        other_responsibilities: data.otherResponsibilities || '',
        challenging_circumstances: Boolean(data.challengingCircumstances),
        circumstances: data.circumstances ?? [],
        other_circumstances: data.otherCircumstances || '',
      } as any;

      // Upsert pattern: select existing by profile_id, then update/insert
      const { data: existingFR, error: frFetchErr } = await supabase
        .from('family_responsibilities')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (frFetchErr) throw frFetchErr;

      if (existingFR?.id) {
        const { error: frUpdateErr } = await supabase
          .from('family_responsibilities')
          .update(frPayload)
          .eq('id', existingFR.id as string);
        if (frUpdateErr) throw frUpdateErr;
      } else {
        const { error: frInsertErr } = await supabase
          .from('family_responsibilities')
          .insert(frPayload);
        if (frInsertErr) throw frInsertErr;
      }

      // Update profile completion score (mirror Basic wizard behavior)
      const newScore = Math.max(Number(profile.completion_score ?? 0), 0.6);
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ completion_score: newScore })
        .eq('id', profile.id);
      if (profileErr) throw profileErr;

      toast({
        title: "Family information saved!",
        description: "Your family responsibilities and circumstances have been recorded.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving family responsibilities:', error);
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
        return <ResponsibilitiesStep data={data} setData={setData} />;
      case 2:
        return <CircumstancesStep data={data} setData={setData} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Compact Header */}
      <div className="text-center space-y-2 flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Family Responsibilities & Circumstances</h2>
        </div>
        
        {/* Compact Progress Steps */}
        <div className="flex items-center justify-center space-x-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-1 ${
                currentStep === step.id ? 'text-primary' : 
                ((step.id === 1 && progress.sectionComplete.responsibilities) || (step.id === 2 && progress.sectionComplete.circumstances)) ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === step.id ? 'bg-primary text-primary-foreground' :
                  ((step.id === 1 && progress.sectionComplete.responsibilities) || (step.id === 2 && progress.sectionComplete.circumstances)) ? 'bg-green-600 text-white' : 'bg-muted'
                }`}>
                  {step.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${
                  ((step.id === 1 && progress.sectionComplete.responsibilities) || (step.id === 2 && progress.sectionComplete.circumstances)) ? 'bg-green-600' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <Progress value={progress.percent} className="h-2 max-w-md mx-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="max-h-full">
              {renderCurrentStep()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Navigation */}
      <div className="flex justify-between pt-2 flex-shrink-0">
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

                const frPayload = {
                  profile_id: profile.id,
                  hours_per_week: data.hoursPerWeek ?? 0,
                  responsibilities: data.responsibilities ?? [],
                  other_responsibilities: data.otherResponsibilities || '',
                  challenging_circumstances: Boolean(data.challengingCircumstances),
                  circumstances: data.circumstances ?? [],
                  other_circumstances: data.otherCircumstances || '',
                } as any;

                const { data: existingFR } = await supabase
                  .from('family_responsibilities')
                  .select('id')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                if (existingFR?.id) {
                  await supabase.from('family_responsibilities').update(frPayload).eq('id', existingFR.id);
                } else {
                  await supabase.from('family_responsibilities').insert(frPayload);
                }

                await supabase
                  .from('profiles')
                  .update({ completion_score: Math.max(Number(profile.completion_score ?? 0), 0.3) })
                  .eq('id', profile.id);

                toast({ title: 'Progress saved', description: 'You can come back anytime.' });
                onProgressRefresh?.();
              } catch (e) {
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

const ResponsibilitiesStep: React.FC<{
  data: FamilyResponsibilitiesData;
  setData: (data: FamilyResponsibilitiesData) => void;
}> = ({ data, setData }) => {
  // Hard coded data values: Predefined list of family responsibility options for user selection
  const responsibilityOptions = [
    {
      id: 'childcare',
      label: 'Caring for younger siblings or family members',
      description: 'Babysitting, helping with homework, or childcare duties'
    },
    {
      id: 'household',
      label: 'Assisting with household duties or errands',
      description: 'Cleaning, cooking, grocery shopping, or other chores'
    },
    {
      id: 'employment',
      label: 'Working a paid job to contribute to household income',
      description: 'Employment to help support your family financially'
    },
    {
      id: 'caregiving',
      label: 'Taking care of an ill, elderly, or disabled family member',
      description: 'Providing care or assistance to family members with special needs'
    },
    {
      id: 'farm_work',
      label: 'Doing household/farm work or helping with family business (unpaid)',
      description: 'Contributing labor to family operations or business'
    },
    {
      id: 'finances',
      label: 'Managing household finances or bills',
      description: 'Handling budgeting, bill payments, or financial responsibilities'
    },
    {
      id: 'transportation',
      label: 'Providing transportation for family members',
      description: 'Driving siblings to school, appointments, or activities'
    },
    {
      id: 'other',
      label: 'Other significant family responsibility',
      description: 'Any other family responsibilities not listed above'
    }
  ];

  const toggleResponsibility = (id: string) => {
    const newResponsibilities = data.responsibilities.includes(id)
      ? data.responsibilities.filter(r => r !== id)
      : [...data.responsibilities, id];
    setData({ ...data, responsibilities: newResponsibilities });
  };

  return (
    <div className="space-y-4 h-full">
      <div>
        <Label htmlFor="hours-per-week" className="text-base font-medium">How many hours per week do you spend on family responsibilities?</Label>
        <Input
          id="hours-per-week"
          type="number"
          min="0"
          max="168"
          value={data.hoursPerWeek === 0 ? '' : data.hoursPerWeek}
          onChange={(e) => setData({ ...data, hoursPerWeek: parseInt(e.target.value) || 0 })}
          placeholder="Enter hours per week"
          className="mt-2"
        />
      </div>

      <div className="flex-1">
        <Label className="text-base font-medium">Select all responsibilities that apply to you:</Label>
        <div className="mt-2 h-80 overflow-y-auto border rounded-lg p-3">
          <div className="space-y-2">
            {responsibilityOptions.map((option) => (
              <div key={option.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                <Checkbox
                  id={option.id}
                  checked={data.responsibilities.includes(option.id)}
                  onCheckedChange={() => toggleResponsibility(option.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.responsibilities.includes('other') && (
        <div>
          <Label htmlFor="other-responsibilities">Describe your other family responsibilities</Label>
          <Textarea
            id="other-responsibilities"
            value={data.otherResponsibilities}
            onChange={(e) => setData({ ...data, otherResponsibilities: e.target.value })}
            placeholder="Describe any other significant family responsibilities not listed above..."
            className="mt-2 min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
};

const CircumstancesStep: React.FC<{
  data: FamilyResponsibilitiesData;
  setData: (data: FamilyResponsibilitiesData) => void;
}> = ({ data, setData }) => {
  // Hard coded data values: Predefined list of challenging circumstances for user selection
  const circumstanceOptions = [
    {
      id: 'long_commute',
      label: 'Commuting more than 60 minutes each way to school',
      description: 'Long travel time that impacts study time and extracurricular participation'
    },
    {
      id: 'homelessness',
      label: 'Experiencing homelessness or housing instability',
      description: 'Lack of stable, permanent housing or frequent housing changes'
    },
    {
      id: 'lacking_food_utilities',
      label: 'Lacking reliable access to food or utilities',
      description: 'Food insecurity or inconsistent access to basic utilities'
    },
    {
      id: 'no_internet',
      label: 'No reliable internet access at home',
      description: 'Limited or inconsistent internet connectivity affecting schoolwork'
    },
    {
      id: 'living_independently',
      label: 'Living independently without family support',
      description: 'Supporting yourself financially and/or living on your own'
    },
    {
      id: 'frequent_moves',
      label: 'Frequent family moves affecting school attendance',
      description: 'Multiple relocations that disrupted your education'
    },
    {
      id: 'other',
      label: 'Other challenging circumstances',
      description: 'Any other circumstances not listed above'
    }
  ];

  const toggleCircumstance = (id: string) => {
    const newCircumstances = data.circumstances.includes(id)
      ? data.circumstances.filter(c => c !== id)
      : [...data.circumstances, id];
    setData({ ...data, circumstances: newCircumstances });
  };

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="challenging-circumstances"
          checked={data.challengingCircumstances}
          onCheckedChange={(checked) => setData({ 
            ...data, 
            challengingCircumstances: checked as boolean 
          })}
        />
        <Label htmlFor="challenging-circumstances" className="font-medium">
          I have experienced challenging circumstances that affected my high school experience
        </Label>
      </div>

      {data.challengingCircumstances && (
        <div className="flex-1">
          <Label className="text-base font-medium">Select all circumstances that have affected your high school experience:</Label>
          <div className="mt-2 h-80 overflow-y-auto border rounded-lg p-3">
            <div className="space-y-2">
              {circumstanceOptions.map((option) => (
                <div key={option.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    id={option.id}
                    checked={data.circumstances.includes(option.id)}
                    onCheckedChange={() => toggleCircumstance(option.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data.circumstances.includes('other') && (
        <div>
          <Label htmlFor="other-circumstances">Describe your other challenging circumstances</Label>
          <Textarea
            id="other-circumstances"
            value={data.otherCircumstances}
            onChange={(e) => setData({ ...data, otherCircumstances: e.target.value })}
            placeholder="Describe any other challenging circumstances that have affected your high school experience..."
            className="mt-2 min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
};

export default FamilyResponsibilitiesWizard;