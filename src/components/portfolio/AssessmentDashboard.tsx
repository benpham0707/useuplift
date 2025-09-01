import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Briefcase, 
  GraduationCap,
  Heart,
  Target,
  Users2,
  BookOpen,
  ArrowRight,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExperiencesWizard from '@/components/portfolio/ExperiencesWizard';
import BasicInformationWizard from '@/components/portfolio/BasicInformationWizard';
import AcademicJourneyWizard from '@/components/portfolio/AcademicJourneyWizard';
import FamilyResponsibilitiesWizard from '@/components/portfolio/FamilyResponsibilitiesWizard';
import GoalsAspirationsWizard from '@/components/portfolio/GoalsAspirationsWizard';
import SupportNetworkWizard from '@/components/portfolio/SupportNetworkWizard';
import PersonalGrowthWizard from '@/components/portfolio/PersonalGrowthWizard';
import { supabase } from '@/integrations/supabase/client';

interface AssessmentDashboardProps {
  onProgressUpdate: (progress: number) => void;
  currentProgress: number;
}

const AssessmentDashboard = ({ onProgressUpdate, currentProgress }: AssessmentDashboardProps) => {
  const [assessmentSections, setAssessmentSections] = useState([
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic profile and background',
      icon: User,
      progress: 0,
      status: 'not-started',
      items: ['Basic info', 'Background & demographics', 'Family context'],
      unlocked: true
    },
    {
      id: 'academic',
      title: 'Academic Journey',
      description: 'School, courses, and academic performance',
      icon: GraduationCap,
      progress: 30,
      status: 'not-started',
      items: ['Current school', 'Academic performance', 'Course history', 'Standardized testing'],
      unlocked: true
    },
    {
      id: 'experiences',
      title: 'Experiences & Activities',
      description: 'Work, volunteer, and extracurricular activities',
      icon: Briefcase,
      progress: 20,
      status: 'not-started', 
      items: ['Work experience', 'Volunteer service', 'Extracurriculars', 'Personal projects'],
      unlocked: true
    },
    {
      id: 'family',
      title: 'Family Responsibilities & Circumstances',
      description: 'Family duties and challenging circumstances',
      icon: Heart,
      progress: 0,
      status: 'not-started',
      items: ['Family responsibilities', 'Life circumstances'],
      unlocked: true // TODO: Restore to: currentProgress >= 20
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      description: 'Academic interests and college plans',
      icon: Target,
      progress: 0,
      status: 'not-started',
      items: ['Academic interests', 'Career goals', 'College application plans'],
      unlocked: true // TODO: Restore to: currentProgress >= 40
    },
    {
      id: 'support',
      title: 'Support Network & Resources',
      description: 'Educational support and documentation',
      icon: Users2,
      progress: 0,
      status: 'not-started',
      items: ['Educational support', 'Community organizations', 'Portfolio items'],
      unlocked: true // TODO: Restore to: currentProgress >= 60
    }
  ]);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [personalItemStatuses, setPersonalItemStatuses] = useState<boolean[] | undefined>(undefined);
  const [growthStatus, setGrowthStatus] = useState<'not-started' | 'in-progress' | 'completed'>('not-started');

  // Load personal info progress from DB
  const refreshPersonalProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;
      const { data: pi } = await supabase
        .from('personal_information')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();

      const isFilled = (v: any) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return !Number.isNaN(v);
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.values(v).some((x) => isFilled(x));
        return Boolean(v);
      };

      const addr = (pi?.permanent_address as any) || {};
      const basicRequired = [
        pi?.first_name,
        pi?.last_name,
        pi?.date_of_birth,
        pi?.primary_email,
        pi?.primary_phone,
        pi?.pronouns,
        pi?.gender_identity,
        addr?.street,
        addr?.city,
        addr?.state,
        addr?.zip,
        addr?.country,
      ];
      const backgroundRequired = [
        pi?.hispanic_latino,
        pi?.citizenship_status,
        pi?.primary_language,
      ];
      const parent1 = Array.isArray(pi?.parent_guardians as any) ? (pi?.parent_guardians as any)?.[0] : undefined;
      const familyRequired = [
        pi?.living_situation,
        parent1?.relationship,
        parent1?.education_level,
        parent1?.occupation_category,
        pi?.first_gen !== undefined ? (pi?.first_gen === true || pi?.first_gen === false ? 'set' : '') : '',
      ];

      const all = [...basicRequired, ...backgroundRequired, ...familyRequired];
      const completed = all.filter(isFilled).length;
      const total = all.length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

      const basicDone = basicRequired.every(isFilled);
      const backDone = backgroundRequired.every(isFilled);
      const famDone = familyRequired.every(isFilled);
      setPersonalItemStatuses([basicDone, backDone, famDone]);

      setAssessmentSections(prev => prev.map(s => s.id === 'personal' ? {
        ...s,
        progress: percent,
        status: percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'
      } : s));

      if (typeof onProgressUpdate === 'function') {
        onProgressUpdate(percent);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load personal progress');
    }
  };

  useEffect(() => {
    refreshPersonalProgress();
    refreshExperiencesProgress();
    refreshGrowthProgress();
    refreshAcademicProgress();
    refreshFamilyProgress();
    refreshGoalsProgress();
    refreshSupportProgress();
  }, []);

  // Load experiences progress from DB
  const refreshExperiencesProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;
      const { data: ea } = await supabase
        .from('experiences_activities')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();

      const flatten = (arr: any) => (Array.isArray(arr) ? arr : []);
      const allItems = [
        ...flatten(ea?.work_experiences),
        ...flatten(ea?.volunteer_service),
        ...flatten(ea?.extracurriculars),
        ...flatten(ea?.personal_projects),
      ];

      const isValid = (item: any) => {
        const title = (item?.title || '').toString().trim();
        const desc = (item?.description || '').toString().trim();
        return title.length >= 2 && desc.length >= 10;
      };

      const validCount = allItems.filter(isValid).length;
      const percent = Math.min(100, Math.round((validCount / 3) * 100));

      setAssessmentSections(prev => prev.map(s => s.id === 'experiences' ? {
        ...s,
        progress: percent,
        status: percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'
      } : s));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load experiences progress');
    }
  };

  // Load Personal Growth status from DB
  const refreshGrowthProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;

      const { data: pg } = await supabase
        .from('personal_growth')
        .select('meaningful_experiences, additional_context')
        .eq('profile_id', prof.id)
        .maybeSingle();

      const getFilled = (obj: any) => {
        if (!obj || typeof obj !== 'object') return false;
        return Object.values(obj).some((v: any) => (v || '').toString().trim().length > 0);
      };

      const essays = getFilled(pg?.meaningful_experiences);
      const context = getFilled(pg?.additional_context);
      const percent = Math.round(([essays, context].filter(Boolean).length / 2) * 100);
      const status: 'not-started' | 'in-progress' | 'completed' = percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress';
      setGrowthStatus(status);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load personal growth status');
    }
  };

  // Academic Journey progress (4 items)
  const refreshAcademicProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;
      const { data: aj } = await supabase
        .from('academic_journey')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();
      const has = (v: any) => {
        if (!v && v !== 0) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return true;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v || {}).length > 0;
        return Boolean(v);
      };
      const currentSchool = has(aj?.current_school) || has(aj?.current_grade) || has(aj?.expected_grad_date);
      const academicPerf = has(aj?.gpa) || has(aj?.class_rank) || has(aj?.class_size) || has(aj?.english_proficiency);
      const courseHistory = has(aj?.course_history) || has(aj?.college_courses) || has(aj?.ap_exams) || has(aj?.ib_exams);
      const testing = has(aj?.standardized_tests);
      const completed = [currentSchool, academicPerf, courseHistory, testing].filter(Boolean).length;
      const percent = Math.round((completed / 4) * 100);
      setAssessmentSections(prev => prev.map(s => s.id === 'academic' ? {
        ...s,
        progress: percent,
        status: percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'
      } : s));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load academic progress');
    }
  };

  // Family Responsibilities & Circumstances (2 items)
  const refreshFamilyProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;
      const { data: fr } = await supabase
        .from('family_responsibilities')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();
      const has = (v: any) => {
        if (!v && v !== 0) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return true;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v || {}).length > 0;
        return Boolean(v);
      };
      const responsibilitiesComplete = has(fr?.responsibilities);
      const circumstancesComplete = has(fr?.life_circumstances);
      const completed = [responsibilitiesComplete, circumstancesComplete].filter(Boolean).length;
      const percent = Math.round((completed / 2) * 100);
      setAssessmentSections(prev => prev.map(s => s.id === 'family' ? {
        ...s,
        progress: percent,
        status: percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'
      } : s));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load family progress');
    }
  };

  // Goals & Aspirations (3 items)
  const refreshGoalsProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;
      const { data: ga } = await supabase
        .from('goals_aspirations')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();
      const has = (v: any) => {
        if (!v && v !== 0) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return true;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v || {}).length > 0;
        return Boolean(v);
      };
      const hasArr = (a: any) => Array.isArray(a) && a.length > 0;
      const academicInterests = (ga?.intended_major || '').toString().trim().length > 0 || hasArr(ga?.preferred_environment);
      const careerGoals = hasArr(ga?.career_interests) || (ga?.highest_degree || '').toString().trim().length > 0;
      const appPlans = has(ga?.college_plans);
      const completed = [academicInterests, careerGoals, appPlans].filter(Boolean).length;
      const percent = Math.round((completed / 3) * 100);
      setAssessmentSections(prev => prev.map(s => s.id === 'goals' ? {
        ...s,
        progress: percent,
        status: percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'
      } : s));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load goals progress');
    }
  };

  // Support Network & Resources (3 items)
  const refreshSupportProgress = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!prof?.id) return;
      const { data: sn } = await supabase
        .from('support_network')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();
      const has = (v: any) => {
        if (!v && v !== 0) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return true;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v || {}).length > 0;
        return Boolean(v);
      };
      const counselorOrTeachers = has(sn?.counselor) || (Array.isArray(sn?.teachers) && sn?.teachers.length > 0);
      const community = has(sn?.community_support);
      const portfolio = has(sn?.portfolio_items);
      const completed = [counselorOrTeachers, community, portfolio].filter(Boolean).length;
      const percent = Math.round((completed / 3) * 100);
      setAssessmentSections(prev => prev.map(s => s.id === 'support' ? {
        ...s,
        progress: percent,
        status: percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'
      } : s));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not load support progress');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      case 'not-started':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complete';
      case 'in-progress':
        return 'In Progress';
      case 'not-started':
        return 'Ready to Start';
      default:
        return 'Locked';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{assessmentSections.filter(s => s.status === 'completed').length}</div>
              <div className="text-sm text-muted-foreground">Sections Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{assessmentSections.filter(s => s.status === 'in-progress').length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{assessmentSections.filter(s => !s.unlocked).length}</div>
              <div className="text-sm text-muted-foreground">Coming Up</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Sections Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessmentSections.map((section) => (
          <AssessmentSectionCard
            key={section.id}
            section={section}
            itemStatuses={section.id === 'personal' ? personalItemStatuses : undefined}
            onOpen={() => {
              if (section.unlocked) setOpenSection(section.id);
            }}
          />
        ))}
      </div>

      {/* Personal Growth & Stories - Full Width Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Personal Growth & Stories</CardTitle>
                <p className="text-muted-foreground">Share your unique experiences, challenges, and personal narrative</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={
                growthStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : growthStatus === 'in-progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }
            >
              {growthStatus === 'completed' ? 'Completed' : growthStatus === 'in-progress' ? 'In Progress' : 'Ready to Start'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* TODO: Restore conditional wrapper when re-implementing progress gates */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Meaningful experiences</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Personal challenges</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Additional context</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This is the most important section of your portfolio. Share the stories that make you unique and help colleges understand who you are beyond grades and test scores.
            </p>
            <Button 
              size="lg" 
              className="w-full md:w-auto"
              onClick={() => setOpenSection('growth')}
            >
              Start Personal Growth Section
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Moved Action Recommendations to dedicated Extracurricular Optimizer page */}


      {/* Wizards */}
      <Dialog open={openSection === 'personal'} onOpenChange={(v) => {
        setOpenSection(v ? 'personal' : null);
        if (!v) {
          // After closing, refresh progress
          refreshPersonalProgress();
        }
      }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <BasicInformationWizard 
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'personal' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
              refreshPersonalProgress();
            }}
            onCancel={() => setOpenSection(null)}
            onProgressRefresh={refreshPersonalProgress}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'academic'} onOpenChange={(v) => setOpenSection(v ? 'academic' : null)}>
        <DialogContent className="max-w-[98vw] w-full max-h-[95vh] overflow-hidden">
          <div className="max-h-[85vh] overflow-y-auto pr-2">
            <AcademicJourneyWizard
              onComplete={() => {
                setAssessmentSections((prev) => prev.map((s) => s.id === 'academic' ? { ...s, status: 'completed', progress: 100 } : s));
                setOpenSection(null);
                refreshAcademicProgress();
              }}
              onCancel={() => setOpenSection(null)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'experiences'} onOpenChange={(v) => setOpenSection(v ? 'experiences' : null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden">
          <ExperiencesWizard
            onAdded={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'experiences' ? { ...s, status: 'in-progress' } : s));
              if (typeof onProgressUpdate === 'function') {
                onProgressUpdate(currentProgress);
              }
            }}
            onClose={() => {
              setOpenSection(null);
              // Refresh progress from DB after closing
              refreshExperiencesProgress();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'family'} onOpenChange={(v) => setOpenSection(v ? 'family' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <FamilyResponsibilitiesWizard
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'family' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
              refreshFamilyProgress();
            }}
            onCancel={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'goals'} onOpenChange={(v) => setOpenSection(v ? 'goals' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <GoalsAspirationsWizard
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'goals' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
              refreshGoalsProgress();
            }}
            onCancel={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'support'} onOpenChange={(v) => setOpenSection(v ? 'support' : null)}>
        <DialogContent className="max-w-3xl w-full max-h-[95vh] overflow-hidden p-0">
          <SupportNetworkWizard
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'support' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
              refreshSupportProgress();
            }}
            onCancel={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'growth'} onOpenChange={(v) => setOpenSection(v ? 'growth' : null)}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <PersonalGrowthWizard
            onComplete={() => {
              setOpenSection(null);
              // Refresh status after completion
              refreshGrowthProgress();
            }}
            onCancel={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  status: string;
  items: string[];
  unlocked: boolean;
}

interface AssessmentSectionCardProps {
  section: AssessmentSection;
  onOpen: () => void;
  itemStatuses?: boolean[];
}

const AssessmentSectionCard = ({ section, onOpen, itemStatuses }: AssessmentSectionCardProps) => {
  const Icon = section.icon;
  
  return (
    <Card className={`hover-lift transition-all duration-200 ${section.unlocked ? 'cursor-pointer' : 'opacity-50'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${section.unlocked ? 'bg-primary' : 'bg-muted'}`}>
              {section.unlocked ? (
                <Icon className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className={getStatusColor(section.status)}>
            {section.unlocked ? getStatusText(section.status) : 'Locked'}
          </Badge>
        </div>

        {section.unlocked && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{section.progress}%</span>
              </div>
              <Progress value={section.progress} className="h-1" />
            </div>

            <div className="space-y-2 mb-4">
              {section.items.map((item, index) => {
                const done = itemStatuses ? Boolean(itemStatuses[index]) : true;
                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-3 w-3 ${done ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{item}</span>
                  </div>
                );
              })}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onOpen}
            >
              {section.status === 'completed' ? 'Review & Edit' : 
               section.status === 'in-progress' ? 'Continue' : 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {!section.unlocked && (
          <div className="text-center py-4">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Complete more sections to unlock
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Removed unused RecommendationItem component - moved to ExtracurricularOptimizer page

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'in-progress':
      return 'text-blue-600 bg-blue-50';
    case 'not-started':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Complete';
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Ready';
    default:
      return 'Locked';
  }
};

// Removed ActionRecommendationsSection and related components - moved to dedicated ExtracurricularOptimizer page

export default AssessmentDashboard;