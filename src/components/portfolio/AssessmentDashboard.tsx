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
  Trophy,
  BookOpen,
  Plus,
  ArrowRight,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExperiencesWizard from '@/components/portfolio/ExperiencesWizard';
import PersonalInfoWizard from '@/components/portfolio/PersonalInfoWizard';

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
      items: ['Basic info', 'Academic record', 'Goals & aspirations'],
      unlocked: true
    },
    {
      id: 'experiences',
      title: 'Experiences & Activities',
      description: 'Work, volunteer, and extracurricular activities',
      icon: Briefcase,
      progress: 40,
      status: 'in-progress', 
      items: ['Work experience', 'Volunteer work', 'School activities', 'Personal projects'],
      unlocked: true
    },
    {
      id: 'academic',
      title: 'Academic Journey',
      description: 'Courses, achievements, and learning experiences',
      icon: GraduationCap,
      progress: 60,
      status: 'in-progress',
      items: ['Course history', 'Test scores', 'Academic awards', 'Learning challenges'],
      unlocked: true
    },
    {
      id: 'community',
      title: 'Community & Family',
      description: 'Service, leadership, and personal responsibilities',
      icon: Heart,
      progress: 20,
      status: 'not-started',
      items: ['Community service', 'Family responsibilities', 'Cultural contributions'],
      unlocked: currentProgress >= 30
    },
    {
      id: 'achievements',
      title: 'Awards & Recognition',
      description: 'Formal and informal acknowledgments',
      icon: Trophy,
      progress: 10,
      status: 'not-started',
      items: ['Awards & honors', 'Recognition', 'Competition results'],
      unlocked: currentProgress >= 50
    },
    {
      id: 'reflection',
      title: 'Personal Growth & Stories',
      description: 'Challenges, growth moments, and narratives',
      icon: BookOpen,
      progress: 0,
      status: 'locked',
      items: ['Growth stories', 'Challenge reflections', 'Future vision'],
      unlocked: currentProgress >= 70
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
      <Dialog open={openSection === 'experiences'} onOpenChange={(v) => setOpenSection(v ? 'experiences' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <ExperiencesWizard
            onAdded={() => {
              // Optional: update section status to in-progress if previously not-started
              setAssessmentSections((prev) => prev.map((s) => s.id === 'experiences' ? { ...s, status: 'in-progress' } : s));
              if (typeof onProgressUpdate === 'function') {
                // leave as-is; full dynamic progress can be wired later
                onProgressUpdate(currentProgress);
              }
            }}
            onClose={() => setOpenSection(null)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={openSection === 'personal'} onOpenChange={(v) => setOpenSection(v ? 'personal' : null)}>
        <DialogContent className="max-w-3xl w-full">
          <PersonalInfoWizard onComplete={() => setOpenSection(null)} />
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