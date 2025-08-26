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
  Plus,
  ArrowRight,
  Lock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Calendar,
  Flag
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
      unlocked: currentProgress >= 20
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      description: 'Academic interests and college plans',
      icon: Target,
      progress: 0,
      status: 'not-started',
      items: ['Academic interests', 'Career goals', 'College application plans'],
      unlocked: currentProgress >= 40
    },
    {
      id: 'support',
      title: 'Support Network & Resources',
      description: 'Educational support and documentation',
      icon: Users2,
      progress: 0,
      status: 'not-started',
      items: ['Educational support', 'Community organizations', 'Portfolio items'],
      unlocked: currentProgress >= 60
    }
  ]);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [personalItemStatuses, setPersonalItemStatuses] = useState<boolean[] | undefined>(undefined);

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
  }, []);

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
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {currentProgress >= 80 ? 'Ready to Start' : 'Locked'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentProgress >= 80 ? (
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
          ) : (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium text-lg mb-2">Complete More Sections to Unlock</h4>
              <p className="text-muted-foreground mb-4">
                Complete at least 80% of other sections to unlock Personal Growth & Stories
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(currentProgress, 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {currentProgress}% complete • {80 - currentProgress}% remaining
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <ActionRecommendationsSection />

      {/* Recent Insights & Cross-Feature Analysis */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Recent Insights & Cross-Feature Analysis</h2>
            <p className="text-sm text-muted-foreground">Showing 2 of 4 insights</p>
          </div>
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            View All Insights
          </Button>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {/* Hard coded data values - placeholder insights for academic performance analysis */}
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
              <Card className="h-full hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground leading-tight">Academic Performance Trend Analysis</h3>
                      <p className="text-xs text-muted-foreground">Academic Insight</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Academic
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your GPA has shown consistent improvement over the past two semesters, particularly in STEM subjects. This upward trend demonstrates academic resilience.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Impact:</span>
                    </div>
                    <p className="text-sm text-primary">Strong academic narrative</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>2 hours ago</span>
                    <Badge variant="outline" className="text-xs">
                      Actionable
                    </Badge>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>

            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
              <Card className="h-full hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground leading-tight">Leadership Experience Gap Analysis</h3>
                      <p className="text-xs text-muted-foreground">Cross-Feature Analysis</p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Leadership
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Analysis shows opportunities to better highlight informal leadership roles within family responsibilities and part-time work experiences.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Impact:</span>
                    </div>
                    <p className="text-sm text-primary">Enhanced leadership profile</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>1 day ago</span>
                    <Badge variant="outline" className="text-xs">
                      Actionable
                    </Badge>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>

            {/* Additional hidden insights for carousel */}
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
              <Card className="h-full hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground leading-tight">Work-Life Balance Achievement</h3>
                      <p className="text-xs text-muted-foreground">Personal Insight</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Character
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Successfully managing 20+ hours of work while maintaining academic performance demonstrates exceptional time management and maturity.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Impact:</span>
                    </div>
                    <p className="text-sm text-primary">Compelling personal narrative</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>3 days ago</span>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>

            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
              <Card className="h-full hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground leading-tight">Extracurricular Engagement Opportunities</h3>
                      <p className="text-xs text-muted-foreground">Recommendation Engine</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Activities
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on your interests and schedule, consider virtual volunteer opportunities that align with your career goals in healthcare.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Impact:</span>
                    </div>
                    <p className="text-sm text-primary">Strengthen extracurricular profile</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>1 week ago</span>
                    <Badge variant="outline" className="text-xs">
                      Actionable
                    </Badge>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </section>

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
              }}
              onCancel={() => setOpenSection(null)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'experiences'} onOpenChange={(v) => setOpenSection(v ? 'experiences' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <ExperiencesWizard
            onAdded={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'experiences' ? { ...s, status: 'in-progress' } : s));
              if (typeof onProgressUpdate === 'function') {
                onProgressUpdate(currentProgress);
              }
            }}
            onClose={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'family'} onOpenChange={(v) => setOpenSection(v ? 'family' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <FamilyResponsibilitiesWizard
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'family' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
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
            }}
            onCancel={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'support'} onOpenChange={(v) => setOpenSection(v ? 'support' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <SupportNetworkWizard
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'support' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
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

interface RecommendationItemProps {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string;
}

const RecommendationItem = ({ title, description, priority, timeEstimate }: RecommendationItemProps) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800', 
    low: 'bg-green-100 text-green-800'
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          <Badge variant="secondary" className={priorityColors[priority]}>
            {priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">Est. {timeEstimate}</span>
        </div>
      </div>
      <Button size="sm" variant="outline">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
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
      return 'Ready';
    default:
      return 'Locked';
  }
};

// Action Recommendations Section Component
const ActionRecommendationsSection = () => {
  /* Hard coded data values - these are placeholder detailed action recommendation items for the assessment dashboard */
  const actionRecommendations = [
    {
      id: 1,
      title: "Document Academic Achievements with Impact Metrics",
      description: "Create detailed records of your academic performance including specific projects, research, and quantifiable outcomes. Focus on achievements while managing work responsibilities.",
      priority: "HIGH" as const,
      potentialImpact: "+0.8 Academic Score",
      timeRequired: "2-3 hours",
      difficulty: "Medium",
      deadline: "1 week",
      focusArea: "Academic",
      actionSteps: [
        "Gather all academic records and project documentation",
        "Calculate GPA trends and improvements over time",
        "Document specific achievements and their measurable impact",
        "Create compelling narratives around academic challenges overcome"
      ],
      requiredResources: ["Transcripts", "Project files", "Teacher feedback"],
      relatedGoals: ["College Applications", "Scholarship Essays"]
    },
    {
      id: 2,
      title: "Strengthen Leadership Experience Documentation",
      description: "Develop comprehensive documentation of leadership roles, including measurable outcomes and personal growth experiences that demonstrate maturity and responsibility.",
      priority: "HIGH" as const,
      potentialImpact: "+1.2 Leadership Score",
      timeRequired: "3-4 hours",
      difficulty: "Medium",
      deadline: "2 weeks",
      focusArea: "Leadership",
      actionSteps: [
        "Identify all leadership experiences, formal and informal",
        "Document specific initiatives and their outcomes",
        "Quantify impact on teams, organizations, or communities",
        "Reflect on personal growth and lessons learned"
      ],
      requiredResources: ["Activity records", "Reference contacts", "Project outcomes"],
      relatedGoals: ["College Applications", "Leadership Development"]
    },
    {
      id: 3,
      title: "Create Family Responsibility Impact Narrative",
      description: "Transform family care responsibilities into compelling stories that highlight maturity, time management, and character development for college applications.",
      priority: "MEDIUM" as const,
      potentialImpact: "+0.6 Character Score",
      timeRequired: "1-2 hours",
      difficulty: "Low",
      deadline: "1 week",
      focusArea: "Character",
      actionSteps: [
        "Document specific family responsibilities and commitments",
        "Identify skills developed through family care",
        "Create narrative connecting family duties to personal growth",
        "Prepare examples for essays and interviews"
      ],
      requiredResources: ["Time logs", "Family schedule", "Reflection notes"],
      relatedGoals: ["Personal Essays", "Character Development"]
    }
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Recommended Actions</h2>
          <p className="text-sm text-muted-foreground">Showing 2 of {actionRecommendations.length} recommended actions</p>
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Export Action Plan
        </Button>
      </div>

      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {actionRecommendations.map((action) => (
            <CarouselItem key={action.id} className="pl-2 md:pl-4 basis-full">
              <DetailedActionCard action={action} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </section>
  );
};


// Detailed Action Card Component
interface DetailedActionCardProps {
  action: {
    id: number;
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    potentialImpact: string;
    timeRequired: string;
    difficulty: string;
    deadline: string;
    focusArea: string;
    actionSteps: string[];
    requiredResources: string[];
    relatedGoals: string[];
  };
}

const DetailedActionCard = ({ action }: DetailedActionCardProps) => {
  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Card className="h-full border-2 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground leading-tight">{action.title}</h3>
          <Badge variant="outline" className={priorityColors[action.priority]}>
            {action.priority}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary font-medium">{action.potentialImpact}</span>
          <span className="text-muted-foreground">Potential Impact</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Time Required</span>
            </div>
            <p className="font-medium">{action.timeRequired}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Difficulty</span>
            </div>
            <p className="font-medium">{action.difficulty}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Deadline</span>
            </div>
            <p className="font-medium">{action.deadline}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flag className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Focus Area</span>
            </div>
            <p className="font-medium">{action.focusArea}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Action Steps:</span>
          </div>
          <ol className="space-y-1 text-sm text-muted-foreground">
            {action.actionSteps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-primary font-medium">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-medium">Required Resources:</span>
            <div className="flex flex-wrap gap-1">
              {action.requiredResources.map((resource, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {resource}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Related Goals:</span>
            <div className="flex flex-wrap gap-1">
              {action.relatedGoals.map((goal, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1">
            Start This Action
          </Button>
          <Button size="sm" variant="outline">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Insight Card Component
interface InsightCardProps {
  insight: {
    id: number;
    title: string;
    type: string;
    description: string;
    impact: string;
    actionable: boolean;
    timestamp: string;
    category: string;
  };
}

const InsightCard = ({ insight }: InsightCardProps) => {
  const categoryColors = {
    Academic: 'bg-blue-100 text-blue-800',
    Leadership: 'bg-purple-100 text-purple-800',
    Character: 'bg-green-100 text-green-800',
    Activities: 'bg-orange-100 text-orange-800'
  };

  return (
    <Card className="h-full hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground leading-tight">{insight.title}</h3>
            <p className="text-xs text-muted-foreground">{insight.type}</p>
          </div>
          <Badge 
            variant="secondary" 
            className={categoryColors[insight.category as keyof typeof categoryColors]}
          >
            {insight.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Impact:</span>
          </div>
          <p className="text-sm text-primary">{insight.impact}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <span>{insight.timestamp}</span>
          {insight.actionable && (
            <Badge variant="outline" className="text-xs">
              Actionable
            </Badge>
          )}
        </div>

        {insight.actionable && (
          <Button size="sm" variant="outline" className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Take Action
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AssessmentDashboard;