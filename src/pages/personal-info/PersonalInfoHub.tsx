import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, User, Users, FileText, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SectionStatus {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  route: string;
  icon: any;
  estimatedTime: string;
}

export default function PersonalInfoHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sections, setSections] = useState<SectionStatus[]>([
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Core required information including legal names, contact details, and identity',
      required: true,
      completed: false,
      route: '/personal-info/basic',
      icon: User,
      estimatedTime: '5-7 min'
    },
    {
      id: 'demographics', 
      title: 'Demographics & Background',
      description: 'Optional demographic information to help personalize recommendations',
      required: false,
      completed: false,
      route: '/personal-info/demographics',
      icon: FileText,
      estimatedTime: '3-5 min'
    },
    {
      id: 'family',
      title: 'Family Context',
      description: 'Information about your family background and living situation',
      required: true,
      completed: false,
      route: '/personal-info/family',
      icon: Users,
      estimatedTime: '4-6 min'
    },
    {
      id: 'communications',
      title: 'Communications & Consent',
      description: 'Contact preferences and required privacy acknowledgments',
      required: true,
      completed: false,
      route: '/personal-info/communications',
      icon: MessageSquare,
      estimatedTime: '2-3 min'
    }
  ]);

  // Load completion status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('personalInfoProgress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSections(prev => prev.map(section => ({
          ...section,
          completed: data[`${section.id}Completed`] || false
        })));
      } catch (e) {
      }
    }
  }, []);

  const completedCount = sections.filter(s => s.completed).length;
  const requiredCount = sections.filter(s => s.required).length;
  const completedRequiredCount = sections.filter(s => s.required && s.completed).length;
  const overallProgress = (completedCount / sections.length) * 100;
  const requiredProgress = (completedRequiredCount / requiredCount) * 100;

  const canContinue = completedRequiredCount === requiredCount;

  const handleComplete = () => {
    // Clear progress data
    localStorage.removeItem('personalInfoProgress');
    // Navigate to portfolio scanner
    navigate('/portfolio-scanner');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Personal Information</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Complete your profile to unlock personalized college guidance
          </p>
          
          {/* Progress Overview */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary mb-1">
                  {completedCount} / {sections.length}
                </div>
                <div className="text-sm text-muted-foreground">Sections Completed</div>
                <Progress value={overallProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary mb-1">
                  {completedRequiredCount} / {requiredCount}
                </div>
                <div className="text-sm text-muted-foreground">Required Sections</div>
                <Progress value={requiredProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="space-y-4 mb-8">
          {sections.map((section) => {
            const Icon = section.icon;
            
            return (
              <Card 
                key={section.id} 
                className={`transition-all hover:shadow-md ${
                  section.completed ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        section.completed 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{section.title}</h3>
                          {section.required ? (
                            <Badge variant="destructive">Required</Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                          {section.completed && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-2">
                          {section.description}
                        </p>
                        
                        <div className="text-sm text-muted-foreground">
                          Estimated time: {section.estimatedTime}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => navigate(section.route)}
                      variant={section.completed ? "outline" : "default"}
                      className="ml-4"
                    >
                      {section.completed ? 'Review' : 'Start'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/portfolio-scanner')}
          >
            Return to Portfolio Scanner
          </Button>
          
          {canContinue && (
            <Button onClick={handleComplete}>
              Complete Personal Information
            </Button>
          )}
        </div>

        {!canContinue && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Complete all required sections to proceed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}