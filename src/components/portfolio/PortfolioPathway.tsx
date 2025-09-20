import { useState, useEffect, useMemo } from 'react';
import { User, GraduationCap, Briefcase, Heart, Target, Users2, BookOpen, Lock, Check, ArrowRight } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import PathwayNode from './PathwayNode';
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

  // Calculate section status based on progress and dependencies
  const pathwaySections: PathwaySection[] = useMemo(() => [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Basic profile and demographics',
      icon: User,
      progress: sectionProgress['personal-info'],
      status: 'available', // Always available as starting point
    },
    {
      id: 'academic-journey',
      title: 'Academic Journey', 
      description: 'Courses, grades, and achievements',
      icon: GraduationCap,
      progress: sectionProgress['academic-journey'],
      status: sectionProgress['personal-info'] >= 25 ? 
        (sectionProgress['academic-journey'] === 100 ? 'completed' : 
         sectionProgress['academic-journey'] > 0 ? 'in-progress' : 'available') : 'locked',
      unlockThreshold: 'Complete 25% of Personal Information'
    },
    {
      id: 'experiences',
      title: 'Experiences & Activities',
      description: 'Extracurriculars and leadership',
      icon: Briefcase,
      progress: sectionProgress['experiences'],
      status: sectionProgress['academic-journey'] >= 25 ? 
        (sectionProgress['experiences'] === 100 ? 'completed' : 
         sectionProgress['experiences'] > 0 ? 'in-progress' : 'available') : 'locked',
      unlockThreshold: 'Complete 25% of Academic Journey'
    },
    {
      id: 'family',
      title: 'Family Responsibilities',
      description: 'Background and circumstances',
      icon: Heart,
      progress: sectionProgress['family'],
      status: sectionProgress['experiences'] >= 25 ? 
        (sectionProgress['family'] === 100 ? 'completed' : 
         sectionProgress['family'] > 0 ? 'in-progress' : 'available') : 'locked',
      unlockThreshold: 'Complete 25% of Experiences'
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      description: 'Future plans and motivations',
      icon: Target,
      progress: sectionProgress['goals'],
      status: sectionProgress['family'] >= 25 ? 
        (sectionProgress['goals'] === 100 ? 'completed' : 
         sectionProgress['goals'] > 0 ? 'in-progress' : 'available') : 'locked',
      unlockThreshold: 'Complete 25% of Family Responsibilities'
    },
    {
      id: 'support',
      title: 'Support Network',
      description: 'Mentors and connections',
      icon: Users2,
      progress: sectionProgress['support'],
      status: sectionProgress['goals'] >= 25 ? 
        (sectionProgress['support'] === 100 ? 'completed' : 
         sectionProgress['support'] > 0 ? 'in-progress' : 'available') : 'locked',
      unlockThreshold: 'Complete 25% of Goals & Aspirations'
    },
    {
      id: 'growth',
      title: 'Personal Growth',
      description: 'Stories and reflections',
      icon: BookOpen,
      progress: sectionProgress['growth'],
      status: sectionProgress['support'] >= 25 ? 
        (sectionProgress['growth'] === 100 ? 'completed' : 
         sectionProgress['growth'] > 0 ? 'in-progress' : 'available') : 'locked',
      unlockThreshold: 'Complete 25% of Support Network'
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

  // Helper function to get node position for zigzag layout
  const getNodePosition = (index: number) => {
    const positions = [
      'justify-center',      // 0: center
      'justify-end pr-12',   // 1: right
      'justify-start pl-12', // 2: left  
      'justify-end pr-12',   // 3: right
      'justify-center',      // 4: center
      'justify-start pl-12', // 5: left
      'justify-end pr-12'    // 6: right
    ];
    return positions[index] || 'justify-center';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-secondary/10 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-32 w-40 h-40 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Pathway Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-6 shadow-strong">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            Your Portfolio Journey
          </h1>
          
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
            Complete each step to unlock your next milestone. Your progress creates a comprehensive profile that showcases your unique story.
          </p>
          
          {/* Progress Summary */}
          <div className="mt-8 flex items-center justify-center space-x-12">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                {currentProgress}%
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Complete</div>
            </div>
            
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
            
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2">
                {pathwaySections.filter(s => s.status === 'completed').length}<span className="text-2xl text-muted-foreground">/7</span>
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sections</div>
            </div>
          </div>
        </div>

        {/* Zigzag Pathway Visualization */}
        <div className="relative w-full">
          {pathwaySections.map((section, index) => (
            <div key={section.id} className="relative w-full">
              {/* Connection Line */}
              {index < pathwaySections.length - 1 && (
                <PathwayConnection 
                  fromStatus={section.status}
                  toStatus={pathwaySections[index + 1].status}
                  fromPosition={getNodePosition(index)}
                  toPosition={getNodePosition(index + 1)}
                  isZigzag={true}
                />
              )}
              
              {/* Pathway Node Container */}
              <div className={`flex w-full mb-20 ${getNodePosition(index)} animate-fade-in`} 
                   style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="relative z-10 max-w-md">
                  <PathwayNode
                    section={section}
                    onClick={() => handleSectionClick(section.id, section.status)}
                    isFirst={index === 0}
                    isLast={index === pathwaySections.length - 1}
                    position={getNodePosition(index)}
                  />
                </div>
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

      {/* Wizard Dialogs */}
      <Dialog open={openSection === 'personal-info'} onOpenChange={() => setOpenSection(null)}>
        <BasicInformationWizard 
          onComplete={handleProgressRefresh}
          onCancel={() => setOpenSection(null)}
          onProgressRefresh={handleProgressRefresh}
        />
      </Dialog>

      <Dialog open={openSection === 'academic-journey'} onOpenChange={() => setOpenSection(null)}>
        <AcademicJourneyWizard 
          onComplete={handleProgressRefresh}
          onCancel={() => setOpenSection(null)}
          onProgressRefresh={handleProgressRefresh}
        />
      </Dialog>

      <Dialog open={openSection === 'experiences'} onOpenChange={() => setOpenSection(null)}>
        <ExperiencesWizard 
          onAdded={() => handleProgressRefresh()}
          onClose={() => setOpenSection(null)}
        />
      </Dialog>

      <Dialog open={openSection === 'family'} onOpenChange={() => setOpenSection(null)}>
        <FamilyResponsibilitiesWizard 
          onComplete={handleProgressRefresh}
          onCancel={() => setOpenSection(null)}
          onProgressRefresh={handleProgressRefresh}
        />
      </Dialog>

      <Dialog open={openSection === 'goals'} onOpenChange={() => setOpenSection(null)}>
        <GoalsAspirationsWizard 
          onComplete={handleProgressRefresh}
          onCancel={() => setOpenSection(null)}
          onProgressRefresh={handleProgressRefresh}
        />
      </Dialog>

      <Dialog open={openSection === 'support'} onOpenChange={() => setOpenSection(null)}>
        <SupportNetworkWizard 
          onComplete={handleProgressRefresh}
          onCancel={() => setOpenSection(null)}
          onProgressRefresh={handleProgressRefresh}
        />
      </Dialog>

      <Dialog open={openSection === 'growth'} onOpenChange={() => setOpenSection(null)}>
        <PersonalGrowthWizard 
          onComplete={handleProgressRefresh}
          onCancel={() => setOpenSection(null)}
          onProgressRefresh={handleProgressRefresh}
        />
      </Dialog>
    </div>
  );
};

export default PortfolioPathway;