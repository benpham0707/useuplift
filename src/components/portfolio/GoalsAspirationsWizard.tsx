import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Target, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
}

const STEPS = [
  { id: 1, title: 'Academic & Career Interests', description: 'Your field of study and career goals' },
  { id: 2, title: 'College Application Plans', description: 'Your college application timeline and preferences' }
];

const GoalsAspirationsWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
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

      const { error } = await supabase
        .from('profiles')
        .update({
          // Store simplified goals data
          goals: {
            primaryGoal: data.intendedMajor || 'exploring_options',
            desiredOutcomes: data.careerInterests.slice(0, 3), // Limit array size
            timelineUrgency: data.startDate || 'flexible'
          },
          completion_score: 70 // Update completion score
        })
        .eq('user_id', user.id);

      if (error) throw error;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Goals & Aspirations</h2>
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
            <Lightbulb className="h-5 w-5" />
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
    <div className="space-y-6">
      <div>
        <Label htmlFor="intended-major">Intended Major or Field of Study</Label>
        <Select value={data.intendedMajor} onValueChange={(value) => setData({ ...data, intendedMajor: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your intended major" />
          </SelectTrigger>
          <SelectContent>
            {commonMajors.map(major => (
              <SelectItem key={major} value={major.toLowerCase().replace(/\s+/g, '_')}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Career Interests (select all that apply)</Label>
        <div className="grid md:grid-cols-3 gap-3 mt-2">
          {careerFields.map(field => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={`career-${field}`}
                checked={data.careerInterests.includes(field)}
                onCheckedChange={() => setData({
                  ...data,
                  careerInterests: toggleArrayItem(data.careerInterests, field)
                })}
              />
              <Label htmlFor={`career-${field}`} className="text-sm">{field}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="highest-degree">Highest Degree You Intend to Earn</Label>
        <Select value={data.highestDegree} onValueChange={(value) => setData({ ...data, highestDegree: value })}>
          <SelectTrigger>
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

      <div>
        <Label>College Environment Preferences (select all that appeal to you)</Label>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          {collegeEnvironments.map(env => (
            <div key={env} className="flex items-center space-x-2">
              <Checkbox
                id={`env-${env}`}
                checked={data.collegeEnvironment.includes(env)}
                onCheckedChange={() => setData({
                  ...data,
                  collegeEnvironment: toggleArrayItem(data.collegeEnvironment, env)
                })}
              />
              <Label htmlFor={`env-${env}`} className="text-sm">{env}</Label>
            </div>
          ))}
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
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="uc-application">Planning to apply to UC system schools?</Label>
          <Select value={data.applyingToUC} onValueChange={(value) => setData({ ...data, applyingToUC: value })}>
            <SelectTrigger>
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
          <Label htmlFor="common-app">Planning to use the Common Application?</Label>
          <Select value={data.usingCommonApp} onValueChange={(value) => setData({ ...data, usingCommonApp: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="maybe">Maybe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="start-date">When do you plan to start college?</Label>
        <Select value={data.startDate} onValueChange={(value) => setData({ ...data, startDate: value })}>
          <SelectTrigger>
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

      <div>
        <Label>Geographic Preferences for College (select all that apply)</Label>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          {geographicOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`geo-${option}`}
                checked={data.geographicPreferences.includes(option)}
                onCheckedChange={() => setData({
                  ...data,
                  geographicPreferences: toggleArrayItem(data.geographicPreferences, option)
                })}
              />
              <Label htmlFor={`geo-${option}`} className="text-sm">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="need-based-aid">Do you expect to apply for need-based financial aid?</Label>
          <Select value={data.needBasedAid} onValueChange={(value) => setData({ ...data, needBasedAid: value })}>
            <SelectTrigger>
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
          <Label htmlFor="merit-scholarships">Are you interested in merit-based scholarships?</Label>
          <Select value={data.meritScholarships} onValueChange={(value) => setData({ ...data, meritScholarships: value })}>
            <SelectTrigger>
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
    </div>
  );
};

export default GoalsAspirationsWizard;