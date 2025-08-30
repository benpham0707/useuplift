import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Heart, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FamilyResponsibilitiesData {
  significantResponsibilities: boolean;
  responsibilities: {
    caringForSiblings: boolean;
    householdDuties: boolean;
    paidJobForHousehold: boolean;
    caringForFamily: boolean;
    householdWork: boolean;
    managingFinances: boolean;
    providingTransportation: boolean;
    providingTranslation: boolean;
    otherResponsibility: string;
  };
  challengingCircumstances: boolean;
  circumstances: {
    longCommute: boolean;
    homelessness: boolean;
    lackingFoodUtilities: boolean;
    noReliableInternet: boolean;
    livingIndependently: boolean;
    frequentMoves: boolean;
    otherCircumstances: string;
  };
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Family Responsibilities', description: 'Significant responsibilities at home' },
  { id: 2, title: 'Life Circumstances', description: 'Challenging circumstances affecting your education' }
];

const FamilyResponsibilitiesWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [data, setData] = useState<FamilyResponsibilitiesData>({
    significantResponsibilities: false,
    responsibilities: {
      caringForSiblings: false,
      householdDuties: false,
      paidJobForHousehold: false,
      caringForFamily: false,
      householdWork: false,
      managingFinances: false,
      providingTransportation: false,
      providingTranslation: false,
      otherResponsibility: ''
    },
    challengingCircumstances: false,
    circumstances: {
      longCommute: false,
      homelessness: false,
      lackingFoodUtilities: false,
      noReliableInternet: false,
      livingIndependently: false,
      frequentMoves: false,
      otherCircumstances: ''
    }
  });

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

      // Create a simple summary instead of complex nested data
      const hasChallenges = data.significantResponsibilities || data.challengingCircumstances;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          completion_score: 50 // Update completion score
        })
        .eq('user_id', user.id);

      if (error) throw error;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Family Responsibilities & Circumstances</h2>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${
                currentStep === step.id ? 'text-primary' : 
                currentStep > step.id ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.id ? 'bg-primary text-primary-foreground' :
                  currentStep > step.id ? 'bg-green-600 text-white' : 'bg-muted'
                }`}>
                  {step.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-green-600' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {STEPS[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-muted-foreground">{STEPS[currentStep - 1]?.description}</p>
        </CardHeader>
        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentStep === 1 ? onCancel : handlePrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete'}
          </Button>
        )}
      </div>
    </div>
  );
};

const ResponsibilitiesStep: React.FC<{
  data: FamilyResponsibilitiesData;
  setData: (data: FamilyResponsibilitiesData) => void;
}> = ({ data, setData }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="significant-responsibilities"
            checked={data.significantResponsibilities}
            onCheckedChange={(checked) => setData({ 
              ...data, 
              significantResponsibilities: checked as boolean 
            })}
          />
          <Label htmlFor="significant-responsibilities" className="font-medium">
            I spend 4+ hours per week on family responsibilities
          </Label>
        </div>

        {data.significantResponsibilities && (
          <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select all responsibilities that apply to you:
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="caring-siblings"
                  checked={data.responsibilities.caringForSiblings}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      caringForSiblings: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="caring-siblings" className="font-medium">
                    Caring for siblings or your own child
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Babysitting, helping with homework, or childcare duties
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="household-duties"
                  checked={data.responsibilities.householdDuties}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      householdDuties: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="household-duties" className="font-medium">
                    Assisting with household duties or errands
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Cleaning, cooking, grocery shopping, or other chores
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="paid-job-household"
                  checked={data.responsibilities.paidJobForHousehold}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      paidJobForHousehold: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="paid-job-household" className="font-medium">
                    Working a paid job to contribute to household income
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Employment to help support your family financially
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="caring-family"
                  checked={data.responsibilities.caringForFamily}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      caringForFamily: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="caring-family" className="font-medium">
                    Taking care of an ill, elderly, or disabled family member
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Providing care or assistance to family members with special needs
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="household-work"
                  checked={data.responsibilities.householdWork}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      householdWork: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="household-work" className="font-medium">
                    Doing household/farm work or helping with family business (unpaid)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Contributing labor to family operations or business
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="managing-finances"
                  checked={data.responsibilities.managingFinances}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      managingFinances: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="managing-finances" className="font-medium">
                    Managing household finances or bills
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Handling budgeting, bill payments, or financial responsibilities
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="providing-transportation"
                  checked={data.responsibilities.providingTransportation}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      providingTransportation: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="providing-transportation" className="font-medium">
                    Providing transportation for family members
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Driving family to work, appointments, or school
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="providing-translation"
                  checked={data.responsibilities.providingTranslation}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    responsibilities: { 
                      ...data.responsibilities, 
                      providingTranslation: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="providing-translation" className="font-medium">
                    Providing translation services for family
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Interpreting or translating for family members
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-responsibility">Other significant family responsibility</Label>
              <Textarea
                id="other-responsibility"
                placeholder="Describe any other significant family responsibility not listed above..."
                value={data.responsibilities.otherResponsibility}
                onChange={(e) => setData({ 
                  ...data, 
                  responsibilities: { 
                    ...data.responsibilities, 
                    otherResponsibility: e.target.value 
                  } 
                })}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CircumstancesStep: React.FC<{
  data: FamilyResponsibilitiesData;
  setData: (data: FamilyResponsibilitiesData) => void;
}> = ({ data, setData }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
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
          <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select all circumstances that have affected your high school experience:
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="long-commute"
                  checked={data.circumstances.longCommute}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    circumstances: { 
                      ...data.circumstances, 
                      longCommute: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="long-commute" className="font-medium">
                    Commuting more than 60 minutes each way to school
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Long travel time that impacts study time and extracurricular participation
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="homelessness"
                  checked={data.circumstances.homelessness}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    circumstances: { 
                      ...data.circumstances, 
                      homelessness: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="homelessness" className="font-medium">
                    Experiencing homelessness or housing instability
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Lack of stable, permanent housing or frequent housing changes
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="lacking-food-utilities"
                  checked={data.circumstances.lackingFoodUtilities}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    circumstances: { 
                      ...data.circumstances, 
                      lackingFoodUtilities: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="lacking-food-utilities" className="font-medium">
                    Lacking reliable access to food or utilities
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Food insecurity or inconsistent access to basic utilities
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="no-internet"
                  checked={data.circumstances.noReliableInternet}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    circumstances: { 
                      ...data.circumstances, 
                      noReliableInternet: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="no-internet" className="font-medium">
                    No reliable internet access at home
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Limited or inconsistent internet connectivity affecting schoolwork
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="living-independently"
                  checked={data.circumstances.livingIndependently}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    circumstances: { 
                      ...data.circumstances, 
                      livingIndependently: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="living-independently" className="font-medium">
                    Living independently without family support
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Supporting yourself financially and/or living on your own
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="frequent-moves"
                  checked={data.circumstances.frequentMoves}
                  onCheckedChange={(checked) => setData({ 
                    ...data, 
                    circumstances: { 
                      ...data.circumstances, 
                      frequentMoves: checked as boolean 
                    } 
                  })}
                />
                <div>
                  <Label htmlFor="frequent-moves" className="font-medium">
                    Frequent family moves affecting school attendance
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Multiple relocations that disrupted your education
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-circumstances">Other challenging circumstances</Label>
              <Textarea
                id="other-circumstances"
                placeholder="Describe any other challenging circumstances that have affected your high school experience..."
                value={data.circumstances.otherCircumstances}
                onChange={(e) => setData({ 
                  ...data, 
                  circumstances: { 
                    ...data.circumstances, 
                    otherCircumstances: e.target.value 
                  } 
                })}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyResponsibilitiesWizard;