import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PersonalBasicsStep from './steps/PersonalBasicsStep';
import ExperiencesActivitiesStep from './steps/ExperiencesActivitiesStep';
import AcademicJourneyStep from './steps/AcademicJourneyStep';
import CommunityFamilyStep from './steps/CommunityFamilyStep';
import AwardsRecognitionStep from './steps/AwardsRecognitionStep';
import PersonalGrowthStep from './steps/PersonalGrowthStep';
import ApplicationReview from './ApplicationReview';
import type { 
  PersonalBasicsData, 
  ExperiencesActivitiesData, 
  AcademicJourneyData,
  CommunityFamilyData,
  AwardsRecognitionData,
  PersonalGrowthData 
} from './types';

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Basic information and contact details' },
  { id: 2, title: 'Experiences & Activities', description: 'Extracurricular activities, work, and volunteer experience' },
  { id: 3, title: 'Academic Journey', description: 'Academic history, courses, and achievements' },
  { id: 4, title: 'Community & Family', description: 'Family background and community involvement' },
  { id: 5, title: 'Awards & Recognition', description: 'Honors, awards, and recognition received' },
  { id: 6, title: 'Personal Growth & Stories', description: 'Essays and personal reflection questions' }
];

export default function ApplicationWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  // Data state for each step
  const [personalBasics, setPersonalBasics] = useState<PersonalBasicsData>({
    firstName: '',
    lastName: '',
    preferredName: '',
    pronouns: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    demographics: {
      ethnicity: [],
      gender: '',
      lgbtq: false,
      firstGen: 'unsure',
      languages: []
    }
  });

  const [experiencesActivities, setExperiencesActivities] = useState<ExperiencesActivitiesData>({
    activities: [],
    workExperience: [],
    volunteerService: [],
    leadership: []
  });

  const [academicJourney, setAcademicJourney] = useState<AcademicJourneyData>({
    currentSchool: {
      name: '',
      type: '',
      city: '',
      state: '',
      country: 'USA',
      ceebCode: ''
    },
    gpa: {
      value: '',
      scale: '4.0',
      weighted: false
    },
    classRank: {
      rank: '',
      classSize: ''
    },
    coursework: {
      apCourses: [],
      ibCourses: [],
      dualEnrollment: [],
      honors: []
    },
    testScores: {
      sat: { score: '', date: '' },
      act: { score: '', date: '' },
      subjectTests: []
    }
  });

  const [communityFamily, setCommunityFamily] = useState<CommunityFamilyData>({
    family: {
      parentEducation: {
        parent1: { degree: '', college: '' },
        parent2: { degree: '', college: '' }
      },
      householdSize: '',
      dependents: '',
      income: ''
    },
    circumstances: {
      fosterCare: false,
      homeless: false,
      ward: false,
      refugee: false,
      military: false,
      additionalInfo: ''
    }
  });

  const [awardsRecognition, setAwardsRecognition] = useState<AwardsRecognitionData>({
    awards: []
  });

  const [personalGrowth, setPersonalGrowth] = useState<PersonalGrowthData>({
    essays: {
      personalStatement: '',
      whyMajor: '',
      whySchool: '',
      diversity: '',
      challenge: '',
      achievement: '',
      additional: ''
    },
    shortAnswers: []
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('college-application-progress');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setPersonalBasics(parsed.personalBasics || personalBasics);
        setExperiencesActivities(parsed.experiencesActivities || experiencesActivities);
        setAcademicJourney(parsed.academicJourney || academicJourney);
        setCommunityFamily(parsed.communityFamily || communityFamily);
        setAwardsRecognition(parsed.awardsRecognition || awardsRecognition);
        setPersonalGrowth(parsed.personalGrowth || personalGrowth);
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (error) {
      }
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      setPersonalBasics(prev => ({ ...prev, email: user.email! }));
    }
  }, [user?.email]);

  // Auto-save progress
  useEffect(() => {
    const saveProgress = () => {
      const progressData = {
        currentStep,
        personalBasics,
        experiencesActivities,
        academicJourney,
        communityFamily,
        awardsRecognition,
        personalGrowth
      };
      localStorage.setItem('college-application-progress', JSON.stringify(progressData));
    };

    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentStep, personalBasics, experiencesActivities, academicJourney, communityFamily, awardsRecognition, personalGrowth]);

  const getCurrentStepData = () => {
    switch (currentStep) {
      case 1: return personalBasics;
      case 2: return experiencesActivities;
      case 3: return academicJourney;
      case 4: return communityFamily;
      case 5: return awardsRecognition;
      case 6: return personalGrowth;
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return personalBasics.firstName && personalBasics.lastName && personalBasics.email;
      case 2:
        return true; // Activities are optional
      case 3:
        return academicJourney.currentSchool.name;
      case 4:
        return true; // Family info is optional
      case 5:
        return true; // Awards are optional
      case 6:
        return personalGrowth.essays.personalStatement.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const applicationData = {
        personalBasics,
        experiencesActivities,
        academicJourney,
        communityFamily,
        awardsRecognition,
        personalGrowth
      };

      // Save to localStorage
      localStorage.setItem('college-application-saved', JSON.stringify(applicationData));
      
      toast({
        title: "Application Saved",
        description: "Your progress has been saved successfully.",
      });
      
      // Show review dialog
      setShowReview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const applicationData = {
        personalBasics,
        experiencesActivities,
        academicJourney,
        communityFamily,
        awardsRecognition,
        personalGrowth
      };

      // TODO: Submit to API
      
      // Clear saved progress
      localStorage.removeItem('college-application-progress');
      localStorage.removeItem('college-application-saved');
      
      toast({
        title: "Application Submitted",
        description: "Your college application has been submitted successfully!",
      });
      
      // Navigate to portfolio scanner
      navigate('/portfolio-scanner');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalBasicsStep 
            data={personalBasics} 
            onChange={setPersonalBasics} 
          />
        );
      case 2:
        return (
          <ExperiencesActivitiesStep 
            data={experiencesActivities} 
            onChange={setExperiencesActivities} 
          />
        );
      case 3:
        return (
          <AcademicJourneyStep 
            data={academicJourney} 
            onChange={setAcademicJourney} 
          />
        );
      case 4:
        return (
          <CommunityFamilyStep 
            data={communityFamily} 
            onChange={setCommunityFamily} 
          />
        );
      case 5:
        return (
          <AwardsRecognitionStep 
            data={awardsRecognition} 
            onChange={setAwardsRecognition} 
          />
        );
      case 6:
        return (
          <PersonalGrowthStep 
            data={personalGrowth} 
            onChange={setPersonalGrowth} 
          />
        );
      default:
        return null;
    }
  };

  const currentStepInfo = STEPS.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/10 dark:bg-black/10 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/5 border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">College Application</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}: {currentStepInfo?.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{Math.round(progress)}% Complete</p>
              <Progress value={progress} className="w-48 h-2 mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center space-x-6 overflow-x-auto">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 whitespace-nowrap ${
                  step.id === currentStep
                    ? 'text-primary font-medium'
                    : step.id < currentStep
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'bg-muted-foreground text-background'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id}
                </div>
                <span className="text-sm">{step.title}</span>
                {index < STEPS.length - 1 && (
                  <div className="w-8 h-px bg-border ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {currentStepInfo && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {currentStepInfo.title}
              </h2>
              <p className="text-muted-foreground">
                {currentStepInfo.description}
              </p>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              {renderCurrentStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || submitting}
            >
              Previous
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Progress'}
              </Button>
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || submitting}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={!canProceed() || submitting}
                >
                  {submitting ? 'Saving...' : 'Save & Review'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Your Application</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <ApplicationReview
              personalBasics={personalBasics}
              experiencesActivities={experiencesActivities}
              academicJourney={academicJourney}
              communityFamily={communityFamily}
              awardsRecognition={awardsRecognition}
              personalGrowth={personalGrowth}
            />
          </ScrollArea>
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowReview(false)}
            >
              Continue Editing
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}