import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Brain, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Flag, 
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  ChevronRight,
  Play
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const ExtracurricularOptimizer = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Hard coded mock data for recommended actions - represents AI-generated personalized optimization recommendations
  const mockRecommendations = [
    {
      id: 1,
      title: "Document Academic Achievements with Impact Metrics",
      category: "Academic Planning",
      priority: "HIGH",
      scoreIncrease: "+0.8 Academic Score",
      timeRequired: "2-3 hours",
      difficulty: "Medium",
      deadline: "1 week",
      focusArea: "Academic",
      description: "Create detailed records of your academic performance including specific projects, research, and quantifiable outcomes. Focus on achievements while managing work responsibilities.",
      actionSteps: [
        "Gather all academic records and project documentation",
        "Calculate GPA trends and improvements over time",
        "Document specific achievements and their measurable impact",
        "Create compelling narratives around academic challenges overcome"
      ],
      resources: ["Transcripts", "Project files", "Teacher feedback"],
      relatedGoals: ["College Applications", "Scholarship Essays"],
      potentialImpact: "Demonstrates academic resilience and achievement despite challenging circumstances"
    },
    {
      id: 2,
      title: "Optimize Leadership Pipeline in Student Government",
      category: "Extracurricular Strategy",
      priority: "MEDIUM",
      scoreIncrease: "+1.2 Leadership Score",
      timeRequired: "5-6 hours weekly",
      difficulty: "High",
      deadline: "3 weeks",
      focusArea: "Leadership",
      description: "Strategic positioning for student government leadership roles with focus on community impact initiatives that align with your background.",
      actionSteps: [
        "Research current student government priorities and gaps",
        "Develop proposal for new community outreach initiative",
        "Build coalition with other student leaders",
        "Present comprehensive leadership plan to advisors"
      ],
      resources: ["Student handbook", "Previous meeting minutes", "Community data"],
      relatedGoals: ["Leadership Development", "Community Impact"],
      potentialImpact: "Establishes leadership trajectory and community connection"
    }
  ];

  const coreFeatures = [
    {
      icon: BookOpen,
      title: "Academic Planning Intelligence",
      description: "Strategic course selection and grade optimization based on your goals, capacity, and market demands",
      features: [
        "Course Recommendation Engine with multi-horizon planning",
        "Strategic sequencing and workload balancing",
        "Professor intelligence and hidden opportunities",
        "Grade optimization and effort allocation strategies"
      ]
    },
    {
      icon: Target,
      title: "Project Incubation System", 
      description: "AI-collaborative project development that ensures uniqueness and maximum impact",
      features: [
        "Socratic discovery process for authentic projects",
        "Uniqueness preservation and saturation tracking",
        "Technical and social impact project guidance",
        "Launch planning and audience building"
      ]
    },
    {
      icon: TrendingUp,
      title: "Extracurricular Strategy Engine",
      description: "Strategic involvement optimization for maximum impact and personal growth",
      features: [
        "Leadership ladder mapping and time ROI calculation",
        "Depth vs breadth optimization strategies",
        "Competition selection and team formation",
        "Club founding and initiative creation guidance"
      ]
    },
    {
      icon: Brain,
      title: "Skill Development Accelerator",
      description: "Strategic skill building aligned with your goals and market demands",
      features: [
        "Personalized skill gap analysis and prioritization",
        "Learning style matching and pace optimization",
        "Technical stack development sequencing",
        "Soft skills and domain knowledge building"
      ]
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "10x Faster Results",
      description: "AI-powered optimization cuts months of trial and error into focused action plans"
    },
    {
      icon: Target,
      title: "Guaranteed Uniqueness",
      description: "Stand out with projects and experiences no one else has through AI collaboration"
    },
    {
      icon: Star,
      title: "Maximum Impact",
      description: "Every hour invested strategically positioned for college admissions and career success"
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "AI Assessment",
      description: "Complete comprehensive analysis of your current situation, goals, and constraints"
    },
    {
      step: 2,
      title: "Strategic Planning",
      description: "Receive personalized roadmap with prioritized actions and timeline optimization"
    },
    {
      step: 3,
      title: "Smart Execution",
      description: "Follow AI-guided implementation with real-time adjustments and progress tracking"
    },
    {
      step: 4,
      title: "Continuous Optimization",
      description: "Ongoing strategy refinement based on results and changing circumstances"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 text-sm">
              🚀 AI-Powered Academic Strategy
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
              Extracurricular Optimizer
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Transform your academic journey with AI-powered strategic planning. 
              Optimize every aspect from course selection to project development for maximum impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="px-8 py-6 text-lg">
                Start Free Optimization
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Key Stats */}
            <div className="grid md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">89%</div>
                <div className="text-sm text-muted-foreground">Success Rate Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">3.2x</div>
                <div className="text-sm text-muted-foreground">Faster Goal Achievement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">156hrs</div>
                <div className="text-sm text-muted-foreground">Average Time Saved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Four Pillars of Academic Excellence
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI analyzes every aspect of your academic journey to create a comprehensive optimization strategy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How Optimization Works
            </h2>
            <p className="text-xl text-muted-foreground">
              From assessment to achievement in four strategic steps
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {index < processSteps.length - 1 && (
                    <ChevronRight className="h-6 w-6 text-muted-foreground mx-auto mt-4 hidden lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Students Choose Our Optimizer
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/20 transition-colors">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Recommendations Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See AI Recommendations in Action
            </h2>
            <p className="text-xl text-muted-foreground">
              Real examples of personalized optimization strategies
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto space-y-6">
            {mockRecommendations.map((rec) => (
              <Card key={rec.id} className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{rec.title}</CardTitle>
                        <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {rec.scoreIncrease}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {rec.timeRequired}
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {rec.difficulty}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {rec.deadline}
                        </div>
                        <div className="flex items-center gap-1">
                          <Flag className="h-4 w-4" />
                          {rec.focusArea}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">{rec.description}</p>
                    </div>
                    <Button size="sm" className="ml-4">
                      Start Action
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Action Steps:
                      </h4>
                      <ol className="text-sm space-y-1 pl-6">
                        {rec.actionSteps.map((step, idx) => (
                          <li key={idx} className="list-decimal">{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Required Resources:</h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.resources.map((resource, idx) => (
                            <Badge key={idx} variant="outline">{resource}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Related Goals:</h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.relatedGoals.map((goal, idx) => (
                            <Badge key={idx} variant="secondary">{goal}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Potential Impact:</h4>
                    <p className="text-sm text-blue-800">{rec.potentialImpact}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Optimize Your Academic Journey?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students who have transformed their academic outcomes with AI-powered optimization
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg bg-white/10 border-white text-white hover:bg-white/20">
                Schedule Demo Call
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ExtracurricularOptimizer;