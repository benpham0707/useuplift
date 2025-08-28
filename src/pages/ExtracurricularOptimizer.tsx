import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Brain, 
  GraduationCap,
  Lightbulb,
  Users,
  BarChart3,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  Settings,
  Search,
  PlusCircle,
  MapPin,
  Award,
  Code,
  MessageSquare,
  Briefcase,
  Globe,
  Building,
  Play,
  Home,
  User,
  Clock,
  ChevronDown
} from 'lucide-react';

const AcademicPlanningIntelligence = () => {
  const navigate = useNavigate();
  const [isPlanningDropdownOpen, setIsPlanningDropdownOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Hard coded strategic domain data representing the Next Moves Engine's five core areas
  const strategicDomains = [
    {
      id: 'academic',
      title: 'Academic Planning Intelligence',
      subtitle: 'Strategic course selection and grade optimization',
      icon: BookOpen,
      keyBenefit: 'Take the right classes at the right time to maximize your goals',
      exampleInsight: 'Take Statistics next semester (easier professor) to free up time for your internship application season',
      progress: 65,
      status: 'Ready',
      color: 'from-blue-500/20 to-indigo-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      items: [
        { name: 'Course recommendations', completed: true, description: 'AI-powered course selection' },
        { name: 'Grade optimization', completed: true, description: 'Strategic targeting & effort allocation' },
        { name: 'Professor intelligence', completed: false, description: 'Teaching styles & networking value' },
        { name: 'Special scenarios', completed: false, description: 'Transfer, double major, study abroad' }
      ]
    },
    {
      id: 'projects',
      title: 'Project Incubation System',
      subtitle: 'AI-collaborative project development that ensures uniqueness',
      icon: Lightbulb,
      keyBenefit: 'Build projects that actually matter and stand out',
      exampleInsight: 'Based on your interests, here\'s a unique project idea that solves a real problem in your community',
      progress: 40,
      status: 'Ready',
      color: 'from-yellow-500/20 to-orange-500/20',
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-600',
      items: [
        { name: 'Project discovery', completed: true, description: 'Interest mining & problem identification' },
        { name: 'AI collaboration', completed: true, description: 'Socratic mode & development partner' },
        { name: 'Technical projects', completed: false, description: 'Open source, hackathons, apps' },
        { name: 'Entrepreneurial projects', completed: false, description: 'MVP development & validation' }
      ]
    },
    {
      id: 'extracurricular',
      title: 'Extracurricular Strategy Engine',
      subtitle: 'Strategic involvement optimization for maximum impact',
      icon: Users,
      keyBenefit: 'Join the right activities and pursue leadership strategically',
      exampleInsight: 'Focus on depth over breadth - aim for leadership in 2-3 clubs rather than joining 8',
      progress: 55,
      status: 'Ready',
      color: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      items: [
        { name: 'Portfolio analysis', completed: true, description: 'Leadership mapping & ROI calculation' },
        { name: 'Strategic recommendations', completed: true, description: 'Depth vs breadth optimization' },
        { name: 'Competition strategy', completed: false, description: 'Selection & preparation planning' },
        { name: 'Creation opportunities', completed: false, description: 'Club founding & event organization' }
      ]
    },
    {
      id: 'skills',
      title: 'Skill Development Accelerator',
      subtitle: 'Strategic skill building aligned with your goals and market demands',
      icon: Brain,
      keyBenefit: 'Learn skills that actually move you toward your career goals',
      exampleInsight: 'Python is more valuable than Java for your data science goals - here\'s the fastest way to learn it',
      progress: 30,
      status: 'Ready',
      color: 'from-purple-500/20 to-violet-500/20',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      items: [
        { name: 'Skill gap analysis', completed: true, description: 'Current vs target state assessment' },
        { name: 'Technical skills', completed: false, description: 'Stack development & certifications' },
        { name: 'Soft skills', completed: false, description: 'Communication & leadership development' },
        { name: 'Domain knowledge', completed: false, description: 'Industry learning & business acumen' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-xl font-bold text-primary hover:text-primary/80"
              >
                <Home className="h-5 w-5" />
                <span>Uplift</span>
              </Button>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Platform
              </Button>
              
              <Button variant="ghost" size="sm">
                Features
              </Button>
              
              {/* Academic Planning Dropdown */}
              <div className="relative">
                <Button 
                  variant="secondary"
                  size="sm"
                  onMouseEnter={() => setIsPlanningDropdownOpen(true)}
                  onMouseLeave={() => setIsPlanningDropdownOpen(false)}
                  className="flex items-center space-x-1"
                >
                  <span>Academic Planning</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {isPlanningDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-[60]"
                    onMouseEnter={() => setIsPlanningDropdownOpen(true)}
                    onMouseLeave={() => setIsPlanningDropdownOpen(false)}
                  >
                    <div className="py-2">
                      {strategicDomains.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => {
                            setIsPlanningDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center space-x-2 text-foreground"
                        >
                          <area.icon className="h-4 w-4" />
                          <span>{area.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button variant="ghost" size="sm">
                Portfolio Scanner
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="hidden sm:flex">
                <Brain className="h-3 w-3 mr-1" />
                Strategic Planning
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Core Value Proposition */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Next Moves Engine</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Stop guessing what to do next
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Get strategic guidance that actually fits your goals, timeline, and current situation. 
              Your AI-powered strategic advisor for academic, professional, and personal development.
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground mb-12">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Personalized recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Timing-aware strategy</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Goal-aligned guidance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Domains Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Four Strategic Domains
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navigate your development across key areas with AI-powered insights and recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {strategicDomains.map((domain) => (
            <Card 
              key={domain.id} 
              className="group relative bg-card border border-border hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => setSelectedDomain(domain.id)}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${domain.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <CardContent className="relative p-6">
                {/* Domain Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 ${domain.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <domain.icon className={`h-6 w-6 ${domain.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {domain.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{domain.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
                    {domain.status}
                  </Badge>
                </div>

                {/* Key Benefit */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-2">Key Benefit</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {domain.keyBenefit}
                  </p>
                </div>

                {/* Example Insight */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                      <Lightbulb className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-foreground mb-1">Example Insight</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        "{domain.exampleInsight}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-foreground">Setup Progress</span>
                    <span className="text-xs font-semibold text-foreground">{domain.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${domain.iconColor.replace('text-', 'bg-')}`}
                      style={{ width: `${domain.progress}%` }}
                    />
                  </div>
                </div>

                {/* Explore Button */}
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                >
                  <span className="mr-2">Explore Domain</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Progressive Journey Timeline */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your Strategic Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A progressive approach to maximizing your potential across all domains
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Timeline Steps */}
            {[
              { step: '01', title: 'Assess', desc: 'Current state analysis', icon: Search },
              { step: '02', title: 'Plan', desc: 'Strategic roadmap creation', icon: Target },
              { step: '03', title: 'Execute', desc: 'Guided implementation', icon: Play },
              { step: '04', title: 'Optimize', desc: 'Continuous improvement', icon: TrendingUp }
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <phase.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                    {phase.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{phase.title}</h3>
                <p className="text-sm text-muted-foreground">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Promise CTA */}
      <div className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <Star className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Your Success, Strategically Planned
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Join students who've transformed their academic and professional trajectory with data-driven, 
              personalized strategic planning. No more guesswork—just clear, actionable steps to your goals.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 font-semibold"
            >
              <Target className="h-5 w-5 mr-2" />
              Start Your Strategic Plan
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book a Strategy Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanningIntelligence;