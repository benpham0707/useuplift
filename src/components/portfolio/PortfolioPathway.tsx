import { useState, useEffect, useMemo } from 'react';
import { User, GraduationCap, Briefcase, Heart, Target, Users2, BookOpen, Lock, Check, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import PathwayNode from './PathwayNode';
import PathwayConnection from './PathwayConnection';
import PathwayTip from './PathwayTip';
import BasicInformationWizard from './BasicInformationWizard';
import AcademicJourneyWizard from './AcademicJourneyWizard';
import ExperiencesWizard from './ExperiencesWizard';
import GoalsAspirationsWizard from './GoalsAspirationsWizard';
import SupportNetworkWizard from './SupportNetworkWizard';
import PersonalGrowthWizard from './PersonalGrowthWizard';
import FamilyResponsibilitiesWizard from './FamilyResponsibilitiesWizard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PortfolioPathwayProps {
  onProgressUpdate: (progress: number) => void;
  currentProgress: number;
}

interface PathwaySection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  status: 'completed' | 'in-progress' | 'available' | 'locked';
  unlockThreshold?: string;
}

const PortfolioPathway = ({ onProgressUpdate, currentProgress }: PortfolioPathwayProps) => {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [sectionProgress, setSectionProgress] = useState({
    'personal-info': 0,
    'academic-journey': 0,
    'experiences': 0,
    'family': 0,
    'goals': 0,
    'support': 0,
    'growth': 0
  });

  // Fetch progress data from database
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      try {
        // Get profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        const profileId = profile.id;

        // Fetch all section data in parallel
        const [
          personalResult,
          academicResult,
          experiencesResult,
          familyResult,
          goalsResult,
          supportResult,
          growthResult
        ] = await Promise.all([
          // Personal Information Progress
          supabase.from('personal_information').select('*').eq('profile_id', profileId).single(),
          // Academic Journey Progress  
          supabase.from('academic_journey').select('*').eq('profile_id', profileId).single(),
          // Experiences Progress
          supabase.from('experiences_activities').select('*').eq('profile_id', profileId),
          // Family Progress
          supabase.from('family_responsibilities').select('*').eq('profile_id', profileId).single(),
          // Goals Progress
          supabase.from('goals_aspirations').select('*').eq('profile_id', profileId).single(),
          // Support Progress
          supabase.from('support_network').select('*').eq('profile_id', profileId).single(),
          // Personal Growth Progress
          supabase.from('personal_growth').select('*').eq('profile_id', profileId).single()
        ]);

        // Calculate progress for each section
        const calculatePersonalProgress = (data: any) => {
          if (!data?.data) return 0;
          const required = ['first_name', 'last_name', 'date_of_birth', 'primary_email'];
          const filled = required.filter(field => data.data[field]).length;
          return Math.round((filled / required.length) * 100);
        };

        const calculateAcademicProgress = (data: any) => {
          if (!data?.data) return 0;
          const required = ['current_school', 'graduation_date', 'current_gpa'];
          const filled = required.filter(field => data.data[field]).length;
          return Math.round((filled / required.length) * 100);
        };

        const calculateExperiencesProgress = (data: any) => {
          if (!data?.data || data.data.length === 0) return 0;
          return data.data.length >= 3 ? 100 : Math.round((data.data.length / 3) * 100);
        };

        const calculateFamilyProgress = (data: any) => {
          if (!data?.data) return 0;
          return data.data.hours_per_week !== null ? 100 : 0;
        };

        const calculateGoalsProgress = (data: any) => {
          if (!data?.data) return 0;
          const required = ['career_interests', 'academic_interests'];
          const filled = required.filter(field => data.data[field]).length;
          return Math.round((filled / required.length) * 100);
        };

        const calculateSupportProgress = (data: any) => {
          if (!data?.data) return 0;
          const required = ['counselors', 'teachers'];
          const filled = required.filter(field => data.data[field]?.length > 0).length;
          return Math.round((filled / required.length) * 100);
        };

        const calculateGrowthProgress = (data: any) => {
          if (!data?.data) return 0;
          const meaningfulFields = Object.values(data.data.meaningful_experiences || {}).filter(v => v).length;
          return meaningfulFields > 0 ? 100 : 0;
        };

        // Update section progress
        setSectionProgress({
          'personal-info': calculatePersonalProgress(personalResult),
          'academic-journey': calculateAcademicProgress(academicResult),
          'experiences': calculateExperiencesProgress(experiencesResult),
          'family': calculateFamilyProgress(familyResult),
          'goals': calculateGoalsProgress(goalsResult),
          'support': calculateSupportProgress(supportResult),
          'growth': calculateGrowthProgress(growthResult)
        });

      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
  }, [user]);

  // Calculate section status - ALL UNLOCKED FOR TESTING
  const pathwaySections: PathwaySection[] = useMemo(() => [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Basic profile and demographics',
      icon: User,
      progress: sectionProgress['personal-info'],
      status: sectionProgress['personal-info'] === 100 ? 'completed' : 
               sectionProgress['personal-info'] > 0 ? 'in-progress' : 'available',
    },
    {
      id: 'academic-journey',
      title: 'Academic Journey', 
      description: 'Courses, grades, and achievements',
      icon: GraduationCap,
      progress: sectionProgress['academic-journey'],
      status: sectionProgress['academic-journey'] === 100 ? 'completed' : 
               sectionProgress['academic-journey'] > 0 ? 'in-progress' : 'available',
    },
    {
      id: 'experiences',
      title: 'Experiences & Activities',
      description: 'Extracurriculars and leadership',
      icon: Briefcase,
      progress: sectionProgress['experiences'],
      status: sectionProgress['experiences'] === 100 ? 'completed' : 
               sectionProgress['experiences'] > 0 ? 'in-progress' : 'available',
    },
    {
      id: 'family',
      title: 'Family Responsibilities',
      description: 'Background and circumstances',
      icon: Heart,
      progress: sectionProgress['family'],
      status: sectionProgress['family'] === 100 ? 'completed' : 
               sectionProgress['family'] > 0 ? 'in-progress' : 'available',
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      description: 'Future plans and motivations',
      icon: Target,
      progress: sectionProgress['goals'],
      status: sectionProgress['goals'] === 100 ? 'completed' : 
               sectionProgress['goals'] > 0 ? 'in-progress' : 'available',
    },
    {
      id: 'support',
      title: 'Support Network',
      description: 'Mentors and connections',
      icon: Users2,
      progress: sectionProgress['support'],
      status: sectionProgress['support'] === 100 ? 'completed' : 
               sectionProgress['support'] > 0 ? 'in-progress' : 'available',
    },
    {
      id: 'growth',
      title: 'Personal Growth',
      description: 'Stories and reflections',
      icon: BookOpen,
      progress: sectionProgress['growth'],
      status: sectionProgress['growth'] === 100 ? 'completed' : 
               sectionProgress['growth'] > 0 ? 'in-progress' : 'available',
    }
  ], [sectionProgress]);

  // Calculate overall progress
  useEffect(() => {
    const totalProgress = Object.values(sectionProgress).reduce((sum, progress) => sum + progress, 0) / 7;
    onProgressUpdate(Math.round(totalProgress));
  }, [sectionProgress, onProgressUpdate]);

  const handleSectionClick = (sectionId: string, status: string) => {
    if (status === 'available' || status === 'in-progress' || status === 'completed') {
      setOpenSection(sectionId);
    }
  };

  const handleProgressRefresh = async () => {
    // Refetch progress data after wizard completion
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Trigger a refresh by re-running the useEffect logic
        window.dispatchEvent(new CustomEvent('refreshProgress'));
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
    
    setOpenSection(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Pathway Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Your Portfolio Journey
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Complete each step to build your comprehensive profile that showcases your unique story.
          </p>
          
          {/* Progress Summary */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {currentProgress}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
            
            <div className="h-8 w-px bg-border"></div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">
                {pathwaySections.filter(s => s.status === 'completed').length}/7
              </div>
              <div className="text-sm text-muted-foreground">Sections</div>
            </div>
          </div>
        </div>

        {/* Alternating Pathway Layout */}
        <div className="relative max-w-5xl mx-auto">
          {pathwaySections.map((section, index) => {
            const isLeft = index % 2 === 0;
            const hasNext = index < pathwaySections.length - 1;
            
            // Hard coded contextual tips for each section - These provide guidance specific to portfolio building
            const tips = [
              { title: "Start Strong", description: "Complete your basic profile to unlock advanced features and personalized recommendations.", actionText: "Begin your journey" },
              { title: "Academic Foundation", description: "Strong grades in core subjects demonstrate college readiness and academic potential.", actionText: "Track your progress" },
              { title: "Quality over Quantity", description: "Focus on meaningful activities that show leadership, commitment, and personal growth.", actionText: "Build your story" },
              { title: "Your Unique Context", description: "Share your family circumstances and responsibilities - they're part of your strength.", actionText: "Tell your story" },
              { title: "Vision and Purpose", description: "Clear goals show direction, motivation, and your commitment to growth and impact.", actionText: "Define your path" },
              { title: "Strong Relationships", description: "Meaningful connections with mentors indicate your ability to grow and collaborate.", actionText: "Build your network" },
              { title: "Reflection and Growth", description: "Self-awareness and learning from experiences demonstrate maturity and readiness.", actionText: "Share your insights" }
            ];
            
            return (
              <div key={section.id} className="relative mb-32">
                {/* Grid Layout for Alternating Positions */}
                <div className="grid grid-cols-3 gap-8 items-center min-h-[200px]">
                  {/* Left Content */}
                  <div className="flex justify-end">
                    {isLeft ? (
                      <PathwayNode
                        section={section}
                        onClick={() => handleSectionClick(section.id, section.status)}
                      />
                    ) : null}
                  </div>
                  
                  {/* Center Content - Tips */}
                  <div className="flex justify-center">
                    {hasNext && (
                      <PathwayTip
                        title={tips[index]?.title || "Keep Going"}
                        description={tips[index]?.description || "Continue building your comprehensive portfolio."}
                        actionText={tips[index]?.actionText || "Next step"}
                      />
                    )}
                  </div>
                  
                  {/* Right Content */}
                  <div className="flex justify-start">
                    {!isLeft ? (
                      <PathwayNode
                        section={section}
                        onClick={() => handleSectionClick(section.id, section.status)}
                      />
                    ) : null}
                  </div>
                </div>
                
                {/* Curved Connection Line */}
                {hasNext && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-20 z-0">
                    <div className="w-full h-full bg-gradient-to-b from-primary/30 to-transparent"></div>
                    
                    {/* Curved path indicator */}
                    <svg 
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-20" 
                      viewBox="0 0 128 80" 
                      fill="none"
                    >
                      <path
                        d={isLeft ? "M64 0 Q32 40 96 80" : "M64 0 Q96 40 32 80"}
                        stroke="hsl(var(--primary))"
                        strokeWidth="1"
                        strokeOpacity="0.2"
                        fill="none"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Celebration */}
        {currentProgress === 100 && (
          <Card className="mt-12 border-success bg-gradient-to-r from-success/5 to-secondary/5 shadow-medium">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Check className="h-8 w-8 text-success" />
                <h3 className="text-2xl font-bold text-foreground">Portfolio Complete!</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Congratulations! You've completed your comprehensive portfolio. Your profile is now ready for college applications.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wizard Dialogs - Using Proper Dialog Components */}
      <Dialog open={openSection === 'personal-info'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <BasicInformationWizard 
            onComplete={handleProgressRefresh}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={handleProgressRefresh}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'academic-journey'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <AcademicJourneyWizard 
            onComplete={handleProgressRefresh}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={handleProgressRefresh}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'experiences'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <ExperiencesWizard 
            onAdded={() => handleProgressRefresh()}
            onClose={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'family'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <FamilyResponsibilitiesWizard 
            onComplete={handleProgressRefresh}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={handleProgressRefresh}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'goals'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <GoalsAspirationsWizard 
            onComplete={handleProgressRefresh}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={handleProgressRefresh}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'support'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <SupportNetworkWizard 
            onComplete={handleProgressRefresh}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={handleProgressRefresh}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'growth'} onOpenChange={() => setOpenSection(null)}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <PersonalGrowthWizard 
            onComplete={handleProgressRefresh}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={handleProgressRefresh}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioPathway;