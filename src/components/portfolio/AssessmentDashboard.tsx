import { useState } from 'react';
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
      progress: 85,
      status: 'completed',
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

      {/* Next Steps Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <RecommendationItem
              title="Add Your Work Experience"
              description="Transform your part-time jobs into valuable experience stories"
              priority="high"
              timeEstimate="10 minutes"
            />
            <RecommendationItem
              title="Document Family Responsibilities"
              description="Caring for family members shows leadership and maturity"
              priority="medium"
              timeEstimate="5 minutes"
            />
            <RecommendationItem
              title="List Academic Achievements"
              description="Include honors classes, good grades, and improvement trends"
              priority="medium"
              timeEstimate="15 minutes"
            />
          </div>
        </CardContent>
      </Card>
      {/* Wizards */}
      <Dialog open={openSection === 'personal'} onOpenChange={(v) => setOpenSection(v ? 'personal' : null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <BasicInformationWizard 
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'personal' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
            }}
            onCancel={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'academic'} onOpenChange={(v) => setOpenSection(v ? 'academic' : null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <AcademicJourneyWizard
            onComplete={() => {
              setAssessmentSections((prev) => prev.map((s) => s.id === 'academic' ? { ...s, status: 'completed', progress: 100 } : s));
              setOpenSection(null);
            }}
            onCancel={() => setOpenSection(null)}
          />
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
}

const AssessmentSectionCard = ({ section, onOpen }: AssessmentSectionCardProps) => {
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
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
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

export default AssessmentDashboard;