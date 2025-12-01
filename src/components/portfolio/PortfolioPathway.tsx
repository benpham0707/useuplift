import { useState, useEffect, useMemo, useRef } from 'react';
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
import FlowingBanner from './FlowingBanner';

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
      }
    };

    fetchProgress();
  }, [user]);

  // Demo toggle: force one section to appear completed for styling preview
  const DEMO_FORCE_COMPLETE = true;
  const DEMO_SECTION_ID = 'academic-journey';

  // Calculate section status - ALL UNLOCKED FOR TESTING
  const pathwaySections: PathwaySection[] = useMemo(() => {
    const sections: PathwaySection[] = [
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
  ];

    // Demo override
    if (DEMO_FORCE_COMPLETE) {
      return sections.map((s) => s.id === DEMO_SECTION_ID ? { ...s, status: 'completed', progress: 100 } : s);
    }
    return sections;
  }, [sectionProgress]);

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
    }
    
    setOpenSection(null);
  };

  // Track node positions to create a split banner that "teleports" across the box
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [gapMap, setGapMap] = useState<Record<string, { left: number; right: number; width: number }>>({});
  const [bannerVisibility, setBannerVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const updateGaps = () => {
      const next: Record<string, { left: number; right: number; width: number }> = {};
      pathwaySections.forEach((s) => {
        const el = nodeRefs.current[s.id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        next[s.id] = { left: rect.left, right: rect.right, width: rect.width };
      });
      setGapMap(next);
    };

    updateGaps();
    window.addEventListener('resize', updateGaps);
    window.addEventListener('scroll', updateGaps, { passive: true });
    return () => {
      window.removeEventListener('resize', updateGaps);
      window.removeEventListener('scroll', updateGaps);
    };
  }, [pathwaySections]);

  // Banner visibility will now be driven by node animation active state via AnimatedContent

  return (
    <div className="min-h-screen bg-background relative">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header removed for a cleaner, cohesive layout */}

        {/* Centered Pathway with snap points */}
        <div className="relative flex flex-col items-center">
          {pathwaySections.map((section, index) => (
            <div id={section.id} key={section.id} className="relative snap-center snap-always min-h-[85vh] md:min-h-screen flex items-center justify-center">
              <div className="relative z-10" ref={(el) => (nodeRefs.current[section.id] = el)}>
                {/* Simple full-width banner behind the node */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-screen z-0 pointer-events-none">
                  <FlowingBanner
                    tone={section.status === 'completed' ? 'completed' : section.status === 'in-progress' ? 'in-progress' : 'uncompleted'}
                    items={buildBannerItems(section)}
                    visible={Boolean(bannerVisibility[section.id])}
                    durationSec={section.status === 'completed' ? 18 : section.status === 'in-progress' ? 34 : 58}
                    appearDelayMs={80 + Math.floor(20 * index)}
                    direction="ltr"
                  />
                </div>
                <AnimatedContent
                  distance={90}
                  direction="vertical"
                  reverse={false}
                  duration={0.65}
                  ease="power3.out"
                  initialOpacity={0}
                  animateOpacity
                  snapOpacityAtCenter
                  scale={1.01}
                  threshold={0.06}
                  enterThreshold={(section.id === 'academic-journey') ? 0.09 : ((section.id === 'support' || section.id === 'growth') ? 0.11 : 0.09)}
                  leaveThreshold={(section.id === 'personal-info') ? 0.22 : ((section.id === 'support' || section.id === 'growth') ? 0.20 : 0.18)}
                  delay={0}
                  reversible
                  leaveOpacity={0}
                  leaveScale={0.99}
                  enterBackDelay={0}
                  enterBackDurationMultiplier={1.0}
                  initialReveal={index === 0}
                  endExtendPct={(section.id === 'growth' ? 16 : (section.id === 'support' ? 14 : 12))}
                  hideDuration={0.6}
                  onActiveChange={(active) => {
                    if (active) {
                      window.setTimeout(() => {
                        setBannerVisibility((prev) => ({ ...prev, [section.id]: true }));
                      }, 80);
                    } else {
                      setBannerVisibility((prev) => ({ ...prev, [section.id]: false }));
                    }
                  }}
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
        {/* Bottom spacer to allow last node to fully enter viewport */}
        <div aria-hidden="true" className="h-72 md:h-96"></div>

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

function getBannerMessage(section: any): string {
  const status = section.status;
  const base = {
    'personal-info': {
      done: 'Great start! Personal Profile Complete',
      todo: 'Uncompleted — Tell us about you',
    },
    'academic-journey': {
      done: 'Academics on Track — Awesome Work',
      todo: 'Uncompleted — Add your courses and GPA',
    },
    'experiences': {
      done: 'Experiences Captured — Leader in the making',
      todo: 'Uncompleted — Add activities and roles',
    },
    'family': {
      done: 'Context Matters — Thanks for sharing',
      todo: 'Uncompleted — Family responsibilities',
    },
    'goals': {
      done: 'Aiming High — Goals set',
      todo: 'Uncompleted — Define your goals',
    },
    'support': {
      done: 'Backed by a Village — Support listed',
      todo: 'Uncompleted — Who supports you?',
    },
    'growth': {
      done: 'Reflection Complete — Growth documented',
      todo: 'Uncompleted — Share your growth',
    },
  } as const;

  const conf = (base as any)[section.id];
  if (!conf) return status === 'completed' ? 'Section Complete' : 'Uncompleted';
  return status === 'completed' ? conf.done : conf.todo;
}

function getBannerImage(section: any): string | undefined {
  const images: Record<string, string> = {
    'personal-info': 'https://picsum.photos/600/400?random=11',
    'academic-journey': 'https://picsum.photos/600/400?random=12',
    'experiences': 'https://picsum.photos/600/400?random=13',
    'family': 'https://picsum.photos/600/400?random=14',
    'goals': 'https://picsum.photos/600/400?random=15',
    'support': 'https://picsum.photos/600/400?random=16',
    'growth': 'https://picsum.photos/600/400?random=17',
  };
  return images[section.id];
}

function buildBannerItems(section: any) {
  const img = getBannerImage(section);
  const status = section.status as string;
  if (status === 'completed') {
    return [
      { text: getBannerMessage(section).split(' — ')[0], image: img },
      { text: getBannerMessage(section).split(' — ')[1] || '', image: img },
    ];
  }
  // For uncompleted/in-progress, separate the UNCOMPLETED tag from the message
  const full = getBannerMessage(section);
  const parts = full.split(' — ');
  const first = parts[0] || full;
  const rest = parts.slice(1).join(' — ');
  return [
    { text: first, image: img },
    { text: rest, image: img },
  ];
}