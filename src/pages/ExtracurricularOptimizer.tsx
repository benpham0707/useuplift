import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, signOut, loading } = useAuth();
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
      impact: 'High',
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
      impact: 'Very High',
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
      impact: 'High',
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
      impact: 'Very High',
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
            </div>

            <div className="hidden md:flex items-center space-x-4">
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
              
              <Button variant="ghost" size="sm" onClick={() => navigate('/portfolio-scanner')}>
                Portfolio Scanner
              </Button>
            </div>

            {/* Right Side - Auth/Profile */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                    Sign Up
                  </Button>
                </>
              )}
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
            
            {/* Strategic Domain Navigation */}
            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
              {strategicDomains.map((domain) => {
                const Icon = domain.icon;
                // Generate opportunity score based on domain (hardcoded for demo)
                const opportunityScore = domain.id === 'projects' ? 10 : 
                                       domain.id === 'skills' ? 8 : 
                                       domain.id === 'academic' ? 6 : 
                                       domain.id === 'extracurricular' ? 4 : 5;

                // Get color based on portfolio scanner rubric logic
                const getIndicatorColor = (score: number) => {
                  if (score >= 9.0) {
                    return 'hsl(220, 95%, 65%)'; // Blue
                  } else if (score >= 7.0) {
                    const progress = (score - 7) / 2;
                    const hue = 120 - (progress * 100);
                    return `hsl(${hue}, 85%, 60%)`;
                  } else if (score >= 5.0) {
                    const progress = (score - 5) / 2;
                    const hue = 35 + (progress * 25);
                    return `hsl(${hue}, 90%, 55%)`;
                  } else if (score >= 3.0) {
                    const progress = (score - 3) / 2;
                    const hue = 0 + (progress * 35);
                    return `hsl(${hue}, 90%, 55%)`;
                  } else {
                    return 'hsl(0, 90%, 55%)'; // Red
                  }
                };

                const shouldGlow = opportunityScore === 10;
                
                return (
                  <div 
                    key={domain.id} 
                    className={`relative group cursor-pointer transition-all duration-500 hover:scale-105 animate-fade-in`}
                    onClick={() => {
                      const element = document.getElementById(domain.id);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {/* Subtle blue fire effect - only glow at score 10 */}
                    {shouldGlow && (
                      <div className="absolute inset-0 rounded-2xl transition-all duration-500 group-hover:scale-105 shadow-[0_0_20px_#3b82f6,0_0_40px_#3b82f6,inset_0_0_15px_#3b82f6] bg-gradient-to-r from-primary/10 via-blue-500/20 to-primary/10"></div>
                    )}
                    
                    {/* Main Card */}
                    <div className={`relative px-8 py-6 rounded-2xl border transition-all duration-300 group-hover:border-blue-400/50 ${
                      shouldGlow 
                        ? 'bg-gradient-to-br from-primary/90 to-blue-600/90 border-blue-400 text-primary-foreground' 
                        : 'bg-gradient-to-br from-primary/70 to-blue-500/70 border-blue-600/30 text-primary-foreground'
                    }`}>
                      {/* Top Right Corner Indicators */}
                      {domain.id === 'projects' && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-blue-500/90 text-white border-blue-400 text-xs px-3 py-1 shadow-lg shadow-blue-500/50">
                            Recommended
                          </Badge>
                        </div>
                      )}
                      {domain.id === 'skills' && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-purple-500/90 text-white border-purple-400 text-xs px-3 py-1 shadow-lg animate-pulse">
                            New Insights
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                            shouldGlow ? 'bg-white/20 shadow-lg' : 'bg-white/15'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">
                              {domain.title.split(' ')[0]}
                            </h3>
                          </div>
                        </div>
                        
                        {/* Arrow Indicator */}
                        <div className={`transition-all duration-300 group-hover:translate-x-2 ${
                          shouldGlow ? 'text-blue-200' : 'text-white/70'
                        }`}>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground animate-fade-in">
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

      {/* Academic Planning Intelligence Section */}
      <div id="academic" className="section-divider gradient-section">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-foreground">Academic Planning Intelligence</h2>
                <p className="text-xl text-muted-foreground mt-2">Strategic course selection and grade optimization</p>
              </div>
            </div>
            
            <Card className="group relative bg-card border border-border hover:shadow-strong transition-all duration-500 overflow-hidden flowing-gradient">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="relative p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-0 mb-4">
                        Ready to Launch
                      </Badge>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Take the right classes at the right time to maximize your goals
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Never wonder if you're making the right academic choices. Our AI analyzes your goals, 
                        tracks professor quality, and maps optimal sequences to keep you ahead of the curve.
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary mb-2">Strategic Insight Example</h4>
                          <p className="text-foreground leading-relaxed">
                            "Take Statistics next semester with Professor Chen (4.8 rating, manageable workload) 
                            to free up time for your internship application season in spring."
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="lg" className="w-full group-hover:scale-105 transition-transform duration-300">
                      <Play className="h-5 w-5 mr-2" />
                      Start Academic Planning
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Capabilities Overview</h4>
                    {strategicDomains[0].items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-background/50 border border-border/50">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <h5 className="font-medium text-foreground">{item.name}</h5>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Setup Progress</span>
                        <span className="text-sm font-semibold text-primary">65%</span>
                      </div>
                      <div className="w-full bg-secondary/30 rounded-full h-2">
                        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Smooth transition divider */}
      <div className="h-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>

      {/* Project Incubation System Section */}
      <div id="projects" className="gradient-accent">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-foreground">Project Incubation System</h2>
                <p className="text-xl text-muted-foreground mt-2">AI-collaborative project development that ensures uniqueness</p>
              </div>
            </div>
            
            <Card className="group relative bg-card border border-border hover:shadow-strong transition-all duration-500 overflow-hidden flowing-gradient">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="relative p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-0 mb-4">
                        Ready to Launch
                      </Badge>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Build projects that actually matter and stand out
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Stop building the same projects as everyone else. Our AI partners with you to develop 
                        unique, impactful projects that solve real problems and showcase your skills authentically.
                      </p>
                    </div>
                    
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                          <Star className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-secondary mb-2">Unique Project Idea</h4>
                          <p className="text-foreground leading-relaxed">
                            "Create a community food waste app that connects local restaurants with food banks, 
                            incorporating your interest in sustainability and mobile development."
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="lg" className="w-full group-hover:scale-105 transition-transform duration-300">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Start Project Discovery
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Development Process</h4>
                    {strategicDomains[1].items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-background/50 border border-border/50">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <h5 className="font-medium text-foreground">{item.name}</h5>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Setup Progress</span>
                        <span className="text-sm font-semibold text-primary">40%</span>
                      </div>
                      <div className="w-full bg-secondary/30 rounded-full h-2">
                        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Smooth transition divider */}
      <div className="h-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>

      {/* Extracurricular Strategy Engine Section */}
      <div id="extracurricular" className="section-divider gradient-section">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-foreground">Extracurricular Strategy Engine</h2>
                <p className="text-xl text-muted-foreground mt-2">Strategic involvement optimization for maximum impact</p>
              </div>
            </div>
            
            <Card className="group relative bg-card border border-border hover:shadow-strong transition-all duration-500 overflow-hidden flowing-gradient">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="relative p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-0 mb-4">
                        Ready to Launch
                      </Badge>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Join the right activities and pursue leadership strategically
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Transform scattered activities into a coherent leadership story. We help you choose 
                        high-impact opportunities and build authentic leadership experiences that matter.
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary mb-2">Strategic Recommendation</h4>
                          <p className="text-foreground leading-relaxed">
                            "Focus on depth over breadth - aim for leadership positions in 2-3 meaningful clubs 
                            rather than passive membership in 8 different organizations."
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="lg" className="w-full group-hover:scale-105 transition-transform duration-300">
                      <Users className="h-5 w-5 mr-2" />
                      Optimize My Activities
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Strategic Areas</h4>
                    {strategicDomains[2].items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-background/50 border border-border/50">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <h5 className="font-medium text-foreground">{item.name}</h5>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Setup Progress</span>
                        <span className="text-sm font-semibold text-primary">55%</span>
                      </div>
                      <div className="w-full bg-secondary/30 rounded-full h-2">
                        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: '55%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Smooth transition divider */}
      <div className="h-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>

      {/* Skill Development Accelerator Section */}
      <div id="skills" className="gradient-accent">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-foreground">Skill Development Accelerator</h2>
                <p className="text-xl text-muted-foreground mt-2">Strategic skill building aligned with your goals and market demands</p>
              </div>
            </div>
            
            <Card className="group relative bg-card border border-border hover:shadow-strong transition-all duration-500 overflow-hidden flowing-gradient">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="relative p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-0 mb-4">
                        Ready to Launch
                      </Badge>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Learn skills that actually move you toward your career goals
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Stop wasting time on random tutorials. Get a personalized learning roadmap that 
                        prioritizes high-impact skills based on your specific career path and market trends.
                      </p>
                    </div>
                    
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                          <Code className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-secondary mb-2">Skill Priority Insight</h4>
                          <p className="text-foreground leading-relaxed">
                            "Python is more valuable than Java for your data science goals. Here's the optimal 
                            3-month learning path with projects that build your portfolio."
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="lg" className="w-full group-hover:scale-105 transition-transform duration-300">
                      <Brain className="h-5 w-5 mr-2" />
                      Accelerate My Skills
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Development Framework</h4>
                    {strategicDomains[3].items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-background/50 border border-border/50">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <h5 className="font-medium text-foreground">{item.name}</h5>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Setup Progress</span>
                        <span className="text-sm font-semibold text-primary">30%</span>
                      </div>
                      <div className="w-full bg-secondary/30 rounded-full h-2">
                        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: '30%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Final transition */}
      <div className="h-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>

      {/* Continuous Progress Loop */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Continuous Strategic Evolution
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your development follows a continuous cycle of assessment, planning, and optimization
            </p>
          </div>

          {/* Arrow Loop Infographic */}
          <div className="relative">
            <svg viewBox="0 0 800 400" className="w-full h-80 mx-auto">
              {/* Background circle path */}
              <defs>
                <path id="circle-path" d="M 400,200 m -150,0 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0" />
                <linearGradient id="arrow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary)/0.6)" />
                </linearGradient>
              </defs>
              
              {/* Curved arrow path */}
              <path 
                d="M 400,200 m -150,0 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0" 
                fill="none" 
                stroke="url(#arrow-gradient)" 
                strokeWidth="3"
                strokeDasharray="8,4"
                className="animate-pulse"
              />
              
              {/* Arrow heads at key points */}
              <polygon points="550,200 540,195 540,205" fill="hsl(var(--primary))" />
              <polygon points="400,50 395,60 405,60" fill="hsl(var(--primary))" />
              <polygon points="250,200 260,195 260,205" fill="hsl(var(--primary))" />
              <polygon points="400,350 405,340 395,340" fill="hsl(var(--primary))" />
            </svg>

            {/* Loop stages positioned around the circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-80 h-80">
                {/* Center - You */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                
                {/* Stage 1 - Top */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Analyze</h4>
                  <p className="text-xs text-muted-foreground">Current state</p>
                </div>
                
                {/* Stage 2 - Right */}
                <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Strategize</h4>
                  <p className="text-xs text-muted-foreground">Plan moves</p>
                </div>
                
                {/* Stage 3 - Bottom */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Execute</h4>
                  <p className="text-xs text-muted-foreground">Take action</p>
                </div>
                
                {/* Stage 4 - Left */}
                <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Optimize</h4>
                  <p className="text-xs text-muted-foreground">Improve & adapt</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Each cycle builds on previous insights, creating compound growth in your strategic development
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about strategic planning with Next Moves Engine
          </p>
        </div>

        <div className="space-y-6">
          {/* Hard coded FAQ data representing common strategic planning questions */}
          {[
            {
              question: "How is this different from general college advice?",
              answer: "Instead of one-size-fits-all advice, we analyze your specific situation, goals, and timeline to provide personalized recommendations. Our AI considers your current GPA, interests, career goals, and even factors like course difficulty and professor ratings."
            },
            {
              question: "What makes the project recommendations unique?",
              answer: "Our AI doesn't just suggest popular projects. It analyzes trending problems in your field, your skill level, and available time to propose projects that solve real problems while building your portfolio strategically."
            },
            {
              question: "How does the extracurricular strategy actually work?",
              answer: "We map your current involvement, calculate leadership ROI, and identify strategic gaps. Rather than joining everything, we help you choose 2-3 activities where you can achieve meaningful leadership and impact."
            },
            {
              question: "Can this help with specific scenarios like transferring or study abroad?",
              answer: "Yes, our academic planning intelligence includes specialized modules for transfers, double majors, study abroad planning, and graduate school preparation with timeline-specific recommendations."
            },
            {
              question: "How often should I use the strategic planning tools?",
              answer: "We recommend quarterly strategic reviews with monthly check-ins. The system adapts as your goals evolve and new opportunities arise, ensuring your strategy stays current and effective."
            },
            {
              question: "What if I'm already a senior - is it too late?",
              answer: "Not at all. We have specific strategies for seniors focused on maximizing final semester opportunities, graduate school applications, job search optimization, and strategic networking."
            }
          ].map((faq, index) => (
            <Card key={index} className="border border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Target className="h-5 w-5 mr-2" />
            Start Your Strategic Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanningIntelligence;