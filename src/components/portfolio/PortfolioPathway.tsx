import { useState, useEffect, useMemo } from 'react';
import { User, GraduationCap, Briefcase, Heart, Target, Users2, BookOpen, Lock, Check, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import PathwayNode from './PathwayNode';
import AnimatedContent from './AnimatedContent';
import PathwayConnection from './PathwayConnection';
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
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header removed for a cleaner, cohesive layout */}

        {/* Centered Pathway */}
        <div className="relative flex flex-col items-center space-y-44">
          {pathwaySections.map((section, index) => (
            <div key={section.id} className="relative">
              {/* Simple Connection Line */}
              {index < pathwaySections.length - 1 && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-44 bg-gradient-to-b from-border to-transparent z-0" />
              )}
              
              {/* Pathway Node */}
              <div className="relative z-10">
                <AnimatedContent
                  distance={220}
                  direction="vertical"
                  reverse={false}
                  duration={1.6}
                  ease="power3.out"
                  initialOpacity={0}
                  animateOpacity
                  scale={1.02}
                  threshold={0.08}
                  delay={0.03 * index}
                >
                  <PathwayNode
                    section={section}
                    onClick={() => handleSectionClick(section.id, section.status)}
                  />
                </AnimatedContent>
              </div>
            </div>
          ))}
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
        <DialogContent className="w-[94vw] max-w-[1400px] h-auto max-h-[92vh] overflow-x-hidden p-4">
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