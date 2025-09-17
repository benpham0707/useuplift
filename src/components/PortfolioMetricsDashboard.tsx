import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  Brain, 
  Users, 
  BookOpen, 
  Lightbulb,
  BarChart3,
  PieChart,
  Calendar,
  Star,
  CheckCircle,
  ArrowUp,
  Download,
  Eye,
  Zap,
  Briefcase,
  Heart,
  MessageCircle,
  Link,
  Trophy,
  Shield,
  Compass,
  Rocket,
  Network,
  GraduationCap,
  FileText,
  ChevronRight,
  MapPin,
  Globe,
  Sparkles,
  TrendingDown,
  AlertCircle,
  ThumbsUp,
  Coffee,
  Code,
  Palette,
  Music,
  Camera,
  Mountain,
  ArrowLeft,
  ExternalLink,
  Activity,
  Layers,
  Filter,
  ChevronDown,
  ChevronUp,
  Expand,
  Search,
  Bookmark,
  FileEdit,
  Quote,
  Flame,
  Gem,
  Microscope,
  Crown,
  Map,
  Play,
  User
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ScatterChart,
  Scatter,
  Cell,
  PieChart as PieChartRecharts,
  Pie
} from "recharts";

// Enhanced Portfolio Data with Deep Insights - Hard coded mock data values representing comprehensive student project analytics
const portfolioData = [
  {
    id: 1,
    title: "Community Garden Network App",
    type: "Technical Leadership",
    category: "Social Impact Tech",
    completedDate: "2024-06-15",
    verified: true,
    projectPhase: "Launched & Scaling",
    
    quickMetrics: {
      impactScore: 94,
      skillDevelopment: 88,
      storyPotential: 96,
      admissionsValue: 92,
      uniqueness: 89
    },

    // Chart Data - Hard coded mock data for comprehensive project analytics visualization
    chartData: {
      monthlyImpact: [
        { month: 'Jan', users: 45, gardens: 8, satisfaction: 78 },
        { month: 'Feb', users: 89, gardens: 12, satisfaction: 82 },
        { month: 'Mar', users: 156, gardens: 18, satisfaction: 87 },
        { month: 'Apr', users: 234, gardens: 25, satisfaction: 91 },
        { month: 'May', users: 312, gardens: 31, satisfaction: 94 },
        { month: 'Jun', users: 478, gardens: 42, satisfaction: 96 }
      ],
      skillProgression: [
        { skill: 'Frontend', month1: 20, month3: 45, month6: 88 },
        { skill: 'Backend', month1: 15, month3: 38, month6: 82 },
        { skill: 'Database', month1: 10, month3: 35, month6: 79 },
        { skill: 'DevOps', month1: 5, month3: 25, month6: 71 },
        { skill: 'UI/UX', month1: 25, month3: 52, month6: 85 }
      ],
      storyThemes: [
        { theme: 'Technical Innovation', score: 92, essays: 8 },
        { theme: 'Community Impact', score: 96, essays: 12 },
        { theme: 'Leadership Growth', score: 87, essays: 6 },
        { theme: 'Problem Solving', score: 94, essays: 9 },
        { theme: 'Cultural Bridge', score: 89, essays: 7 }
      ],
      careerAlignment: [
        { career: 'Software Engineer', probability: 85, growth: 12 },
        { career: 'Product Manager', probability: 78, growth: 15 },
        { career: 'Social Entrepreneur', probability: 92, growth: 18 },
        { career: 'UX Designer', probability: 71, growth: 10 },
        { career: 'Non-profit Tech', probability: 88, growth: 14 }
      ]
    },

    impactAnalysis: {
      summary: "Revolutionary community-tech bridge serving 500+ families with measurable sustainability impact",
      deepDive: {
        genesis: {
          trigger: "Witnessed food insecurity during pandemic lockdowns in historically underserved neighborhoods",
          personalConnection: "My grandmother's stories of community gardens during WWII inspired me to see technology as a tool for resilience",
          initialFailures: "First three attempts at community outreach failed because I led with technology instead of relationships"
        },
        breakthroughMoments: [
          {
            moment: "The day Mrs. Rodriguez invited me to her kitchen to show me her grandmother's seed collection",
            significance: "Realized that technology needed to honor existing community wisdom, not replace it",
            characterGrowth: "Shifted from 'tech will solve everything' to 'tech can amplify what already works'",
            essayGold: "This moment transformed my understanding of innovation - true breakthrough comes from humility, not disruption"
          }
        ]
      }
    },

    skillsAnalysis: {
      technicalSkills: [
        {
          skill: "Full-Stack Development (React/Node.js)",
          progressionStory: {
            month1: "Could barely center a div - spent 40 hours on CSS flexbox tutorial",
            month3: "Built first database-connected app - simple garden tracking for my own plants", 
            month6: "Architected real-time collaborative platform handling 500+ concurrent users",
            breakthrough: "Realized code quality matters when community members depend on your uptime"
          },
          transferableValue: {
            academicApplication: "Perfect for computer science programs emphasizing practical impact",
            careerRelevance: "High demand skill set with proven ability to scale under pressure",
            uniqueContext: "Most developers learn on toy projects - I learned on infrastructure serving real communities"
          },
          evidenceOfExcellence: [
            "99.8% uptime over 6 months in production",
            "Implemented offline-first architecture for low-connectivity areas", 
            "Code reviewed by senior developers at local tech companies - praised for architecture"
          ]
        }
      ],
      softSkillEvidence: {
        adaptability: {
          situation: "Initial app design completely missed community needs",
          response: "Completely rebuilt user interface based on community feedback sessions",
          outcome: "Final design had 95% user satisfaction vs. 40% for original",
          growthEvidence: "Learned to validate assumptions with users before building solutions"
        }
      }
    },

    essayGoldmine: {
      powerfulOpeningHooks: [
        {
          hook: "The day I learned that my code could grow tomatoes was the day I understood that technology isn't about the future—it's about remembering who we've always been.",
          essayPrompt: "Personal statement / Why Major",
          emotionalResonance: "High",
          uniquenessScore: 95,
          developmentPath: "Could explore journey from tech-focused to community-centered mindset"
        }
      ],
      characterDevelopmentArcs: [
        {
          theme: "From Disruption to Amplification",
          progression: [
            "Started believing technology should replace inefficient human systems",
            "Failed attempts taught me that existing systems have wisdom I didn't understand",
            "Learned to ask 'How can technology amplify what already works?'",
            "Now design solutions that honor existing community knowledge while expanding possibilities"
          ],
          essayApplications: ["Personal growth essays", "Why engineering/CS essays", "Leadership philosophy essays"],
          characterStrengths: ["Humility", "Systems thinking", "Cultural sensitivity", "Adaptive leadership"]
        }
      ],
      specificStoryMoments: [
        {
          storyTitle: "The Great Tomato Debate of 2024",
          setup: "Two community gardens got into heated argument about heirloom vs hybrid tomatoes",
          conflict: "Older gardeners preferred traditional varieties, younger ones wanted higher-yield hybrids", 
          myRole: "Used app data to show that both approaches worked in different soil conditions",
          resolution: "Created neighborhood seed swap feature that let both groups share knowledge",
          deeperMeaning: "Technology became the neutral ground for bridging generational differences",
          essayPotential: "Perfect for 'bring people together' or 'solve conflict' prompts",
          characterQualities: ["Diplomatic problem-solving", "Data-driven mediation", "Community building"]
        }
      ],
      readyToUseInsights: [
        {
          insight: "Real innovation happens when technology serves community needs, not when community adapts to technology",
          applicationContext: "Engineering/CS program applications",
          supportingEvidence: "Redesigned entire user interface 3 times based on community feedback; final version had 95% satisfaction",
          essayIntegration: "Shows thoughtful approach to user-centered design and cultural humility"
        }
      ]
    },

    futureAnalysis: {
      careerTrajectoryPredictions: [
        {
          path: "Social Impact Technology Entrepreneur",
          probability: 87,
          evidence: [
            "Demonstrated ability to identify real community problems and build scalable technical solutions",
            "Strong track record of community engagement and stakeholder management"
          ],
          recommendedSteps: [
            "Study business/entrepreneurship alongside CS to develop commercial viability skills",
            "Seek internships at B-Corps or social enterprise companies"
          ]
        }
      ],
      admissionsPositioning: {
        competitiveAdvantages: [
          {
            advantage: "Authentic Technical + Social Impact Combination",
            rarity: "Only ~3% of CS applicants have genuine, documented community impact",
            strength: "Not just coding for social good - actually embedded in community organizing",
            schoolFit: ["Stanford (d.school)", "MIT (public service center)", "UC Berkeley (social impact focus)"]
          }
        ],
        potentialConcerns: [
          {
            concern: "Depth vs. Breadth Question",
            explanation: "Very deep in one project - admissions may wonder about ability to explore new areas",
            mitigation: "Emphasize transferable skills and show how this project opened up multiple new interests",
            recommendation: "Consider starting a related but different project to show adaptability"
          }
        ]
      }
    }
  },
  
  {
    id: 2,
    title: "Youth Mental Health Peer Support Network",
    type: "Social Leadership", 
    category: "Mental Health Advocacy",
    completedDate: "2024-08-10",
    verified: true,
    projectPhase: "Expanding Model",

    quickMetrics: {
      impactScore: 96,
      skillDevelopment: 85,
      storyPotential: 98,
      admissionsValue: 94,
      uniqueness: 91
    },

    // Chart Data - Hard coded mock data for mental health project analytics visualization
    chartData: {
      monthlyImpact: [
        { month: 'Mar', participants: 12, sessions: 24, wellbeing: 72 },
        { month: 'Apr', participants: 28, sessions: 45, wellbeing: 78 },
        { month: 'May', participants: 52, sessions: 78, wellbeing: 85 },
        { month: 'Jun', participants: 89, sessions: 134, wellbeing: 89 },
        { month: 'Jul', participants: 156, sessions: 201, wellbeing: 92 },
        { month: 'Aug', participants: 234, sessions: 298, wellbeing: 94 }
      ],
      skillProgression: [
        { skill: 'Crisis Intervention', month1: 35, month3: 68, month6: 92 },
        { skill: 'Group Facilitation', month1: 20, month3: 55, month6: 87 },
        { skill: 'Peer Counseling', month1: 40, month3: 72, month6: 95 },
        { skill: 'Program Development', month1: 15, month3: 48, month6: 84 },
        { skill: 'Training Others', month1: 10, month3: 38, month6: 78 }
      ],
      storyThemes: [
        { theme: 'Personal Growth', score: 98, essays: 15 },
        { theme: 'Community Healing', score: 95, essays: 12 },
        { theme: 'Peer Leadership', score: 91, essays: 8 },
        { theme: 'System Change', score: 87, essays: 6 },
        { theme: 'Vulnerability as Strength', score: 94, essays: 10 }
      ],
      careerAlignment: [
        { career: 'Clinical Psychology', probability: 94, growth: 22 },
        { career: 'Social Work', probability: 88, growth: 18 },
        { career: 'Counseling', probability: 91, growth: 19 },
        { career: 'Public Health', probability: 76, growth: 14 },
        { career: 'Youth Programs', probability: 85, growth: 16 }
      ]
    },

    impactAnalysis: {
      summary: "Peer support program reaching 300+ students across 4 schools with documented mental health improvements",
      deepDive: {
        genesis: {
          trigger: "Personal experience with anxiety disorder junior year, witnessed friends struggling in silence",
          personalConnection: "Realized that traditional counseling resources weren't reaching students who needed them most",
          initialFailures: "First attempt at starting support group failed because I tried to replicate adult therapy models"
        },
        breakthroughMoments: [
          {
            moment: "The night a classmate texted me at 2 AM saying our peer session was the only thing that helped during a panic attack",
            significance: "Realized peer support could be more effective than professional counseling for many teens",
            characterGrowth: "Learned that lived experience can be as valuable as professional training",
            essayGold: "Sometimes the most powerful help comes not from expertise, but from shared understanding"
          }
        ]
      }
    },

    skillsAnalysis: {
      technicalSkills: [
        {
          skill: "Crisis Intervention & Mental Health First Aid",
          progressionStory: {
            month1: "Completed 40-hour Youth Mental Health First Aid certification",
            month3: "Led first peer support group with supervision from school counselor",
            month6: "Training other students in crisis intervention techniques",
            breakthrough: "Realized that technical training needed to be balanced with emotional intelligence"
          },
          transferableValue: {
            academicApplication: "Valuable for psychology, social work, or pre-med programs",
            careerRelevance: "Growing field with high demand for youth-focused mental health professionals",
            uniqueContext: "Rare for high school students to have formal crisis intervention training"
          },
          evidenceOfExcellence: [
            "Certified in Youth Mental Health First Aid at age 17",
            "Successfully de-escalated 12+ crisis situations",
            "Training curriculum adopted by 3 other schools"
          ]
        }
      ],
      softSkillEvidence: {
        empathy: {
          situation: "Student was hesitant to share struggles due to stigma fears",
          response: "Created safe space by sharing my own vulnerability first",
          outcome: "Student became one of our most active peer counselors",
          growthEvidence: "Learned that leadership sometimes means going first in vulnerability"
        }
      }
    },

    essayGoldmine: {
      powerfulOpeningHooks: [
        {
          hook: "The text came at 2:17 AM: 'I can't do this anymore.' Three months earlier, I wouldn't have known what to say. Now, I had fifteen trained peer counselors I could connect her with in minutes.",
          essayPrompt: "Community impact / Leadership",
          emotionalResonance: "Very High",
          uniquenessScore: 94,
          developmentPath: "Story of building systems that save lives through peer support"
        }
      ],
      characterDevelopmentArcs: [
        {
          theme: "From Personal Struggle to Community Healing",
          progression: [
            "Started with personal anxiety and feeling isolated in mental health struggles",
            "Realized many peers faced similar challenges without adequate support",
            "Learned that sharing vulnerability could create connection and healing", 
            "Built systems that transformed individual pain into collective strength"
          ],
          essayApplications: ["Overcoming challenges essays", "Community service essays", "Personal growth essays"],
          characterStrengths: ["Emotional intelligence", "Systematic thinking", "Vulnerability as strength", "Peer leadership"]
        }
      ],
      specificStoryMoments: [
        {
          storyTitle: "The Moment I Realized Helping Others Healed Me",
          setup: "Started peer support to help others, expecting to give but not receive",
          conflict: "Realized I was still struggling with own mental health while helping others",
          myRole: "Had to model vulnerability and seek help from my own peer support network",
          resolution: "Discovered that healing is circular - helping others helped me heal",
          deeperMeaning: "True leadership means being willing to receive help while giving it",
          essayPotential: "Powerful for essays about personal growth, community, or overcoming challenges",
          characterQualities: ["Authentic leadership", "Emotional maturity", "Systems thinking"]
        }
      ],
      readyToUseInsights: [
        {
          insight: "Mental health support works best when it's peer-to-peer because shared experience creates trust that professional credentials alone cannot",
          applicationContext: "Psychology, pre-med, social work program applications",
          supportingEvidence: "85% improvement in participant wellbeing scores vs. 60% for traditional counseling in our pilot study",
          essayIntegration: "Demonstrates understanding of psychology principles through practical application"
        }
      ]
    },

    futureAnalysis: {
      careerTrajectoryPredictions: [
        {
          path: "Clinical Psychology with Youth Specialization",
          probability: 89,
          evidence: [
            "Demonstrated passion for youth mental health through direct service",
            "Understanding of peer support models and their effectiveness",
            "Experience with crisis intervention and program development"
          ],
          recommendedSteps: [
            "Major in psychology with research focus on peer support effectiveness",
            "Seek research opportunities in adolescent mental health",
            "Continue developing and scaling peer support programs"
          ]
        }
      ],
      admissionsPositioning: {
        competitiveAdvantages: [
          {
            advantage: "Authentic Mental Health Leadership with Measurable Impact",
            rarity: "Very few students have formal crisis intervention training and documented program outcomes",
            strength: "Combines personal experience with systematic approach and professional training",
            schoolFit: ["Stanford (psychology)", "Yale (psychology/social work)", "Northwestern (psychology)"]
          }
        ],
        potentialConcerns: [
          {
            concern: "Mental Health Disclosure in Applications",
            explanation: "Need to frame personal mental health experience positively without oversharing",
            mitigation: "Focus on growth, learning, and service rather than detailed personal struggles",
            recommendation: "Emphasize leadership development and systematic problem-solving skills gained"
          }
        ]
      }
    }
  }
];

// Enhanced Project Detail View with Advanced Visual Design and Multiple Insights
const ProjectCard: React.FC<{ project: any; onBack: () => void }> = ({ project, onBack }) => {
  const [activeChartTypes, setActiveChartTypes] = useState({
    impact: 'line',
    skills: 'bar', 
    essays: 'scatter',
    future: 'bar'
  });
  const [insightDepth, setInsightDepth] = useState('surface'); // surface, expert

  const chartOptions = {
    impact: ['line', 'area', 'radar'],
    skills: ['bar', 'radar', 'progress'],
    essays: ['scatter', 'pie', 'treemap'],
    future: ['bar', 'bubble', 'timeline']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      {/* Enhanced Project Header with Glass Morphism */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="p-3 rounded-xl hover:bg-primary/10 hover:scale-105 transition-all duration-300 hover-glow-subtle group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
              </Button>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-primary text-white border-0 shadow-soft px-3 py-1">
                    {project.type}
                  </Badge>
                  <Badge className="bg-gradient-secondary text-white border-0 shadow-soft px-3 py-1">
                    {project.category}
                  </Badge>
                  {project.verified && (
                    <Badge className="bg-gradient-to-r from-success to-success/80 text-white border-0 shadow-soft px-3 py-1 animate-pulse">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified Impact
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="hover-lift glass-card">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live Project
              </Button>
              <Button variant="outline" size="sm" className="hover-lift glass-card">
                <FileEdit className="h-4 w-4 mr-2" />
                Edit & Enhance
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Content with Enhanced Visual Design */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Quick Metrics with Animated Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          {Object.entries(project.quickMetrics).map(([key, value]: [string, any], index: number) => (
            <Card key={key} className="glass-card hover-lift group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <CardContent className="p-6 text-center relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  {value}
                </div>
                <div className="text-sm font-medium text-foreground/70 capitalize mb-3">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${value}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Insight Depth Selector */}
        <div className="mb-8">
          <Card className="glass-card shadow-medium">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Analysis Depth Level</h3>
                  <p className="text-sm text-muted-foreground">Choose how deep you want to dive into the insights</p>
                </div>
                <div className="flex gap-2">
                  {['surface', 'expert'].map((level) => (
                    <Button
                      key={level}
                      variant={insightDepth === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInsightDepth(level)}
                      className={`capitalize ${insightDepth === level ? 'bg-gradient-primary text-white shadow-soft' : 'hover-lift'}`}
                    >
                      {level === 'surface' ? 'Surface' : 'Expert'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analysis Tabs with Visual Polish */}
        <Tabs defaultValue="impact" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-xl border border-border/50 sticky top-24 z-10 shadow-medium rounded-xl p-2">
            <TabsTrigger value="impact" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">
              <TrendingUp className="h-4 w-4" />
              Impact Analysis
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">
              <Brain className="h-4 w-4" />
              Skills Deep Dive
            </TabsTrigger>
            <TabsTrigger value="essays" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">
              <Gem className="h-4 w-4" />
              Essay Goldmine
            </TabsTrigger>
            <TabsTrigger value="future" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">
              <Compass className="h-4 w-4" />
              Future Trajectory
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Impact Analysis Tab with Multiple Chart Types */}
          <TabsContent value="impact" className="space-y-8">
            {/* Chart Selection and Interactive Visualization */}
            <Card className="glass-card shadow-large overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-gradient">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Project Impact Growth Analysis</CardTitle>
                      <CardDescription>Dynamic visualization of measurable outcomes over time</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {chartOptions.impact.map((chartType) => (
                      <Button
                        key={chartType}
                        variant={activeChartTypes.impact === chartType ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveChartTypes({...activeChartTypes, impact: chartType})}
                        className={`capitalize ${activeChartTypes.impact === chartType ? 'bg-gradient-primary text-white' : 'hover-lift'}`}
                      >
                        {chartType}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={project.chartData.monthlyImpact}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }} 
                      />
                      <Legend />
                      {Object.keys(project.chartData.monthlyImpact[0]).filter(key => key !== 'month').map((key, index) => (
                        <Line 
                          key={key}
                          type="monotone" 
                          dataKey={key} 
                          stroke={index === 0 ? "hsl(var(--primary))" : index === 1 ? "hsl(var(--success))" : "hsl(var(--accent))"} 
                          strokeWidth={3}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Multi-Level Impact Insights Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Impact Genesis with Enhanced Design */}
              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    Impact Genesis & Evolution
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    {project.impactAnalysis.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  {/* Surface Level */}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-primary" />
                      The Catalyst Moment
                    </h4>
                    <p className="text-foreground/85 italic leading-relaxed">"{project.impactAnalysis.deepDive.genesis.trigger}"</p>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-card/60 border border-border/50 shadow-soft">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-accent" />
                      Deep Personal Connection
                    </h4>
                    <p className="text-foreground/80 leading-relaxed">{project.impactAnalysis.deepDive.genesis.personalConnection}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30 shadow-soft">
                    <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Learning Through Failure
                    </h4>
                    <p className="text-foreground/80 leading-relaxed">{project.impactAnalysis.deepDive.genesis.initialFailures}</p>
                    <div className="mt-4 p-3 rounded-lg bg-card/80 border border-border/30">
                      <p className="text-sm text-foreground/70 font-medium">
                        Key Learning: Initial setbacks provided crucial insights that shaped the project's eventual success. This demonstrates resilience and adaptability - core traits admissions committees value highly.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-gradient-to-r from-success/15 to-accent/15 border border-success/30 shadow-soft">
                      <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Implementation Journey Highlights
                      </h4>
                      <div className="space-y-3">
                        <p className="text-foreground/85 leading-relaxed">
                          The development process involved three critical phases: initial community research and needs assessment, 
                          iterative prototype development with continuous user feedback, and finally the scaled implementation 
                          with measurable impact tracking.
                        </p>
                        <p className="text-foreground/85 leading-relaxed">
                          What started as a simple gardening app evolved into a comprehensive community network platform 
                          when user feedback revealed the deeper need for social connection and knowledge sharing among gardeners.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/30 shadow-soft">
                      <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Measurable Impact Achievements
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 rounded-lg bg-card/60 border border-border/30">
                          <div className="text-2xl font-bold text-primary">500+</div>
                          <div className="text-sm text-foreground/70">Active Users</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-card/60 border border-border/30">
                          <div className="text-2xl font-bold text-success">42</div>
                          <div className="text-sm text-foreground/70">Community Gardens</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-card/60 border border-border/30">
                          <div className="text-2xl font-bold text-accent">96%</div>
                          <div className="text-sm text-foreground/70">User Satisfaction</div>
                        </div>
                      </div>
                      <p className="text-foreground/85 leading-relaxed">
                        Beyond metrics, the project facilitated intergenerational knowledge transfer between experienced gardeners 
                        and newcomers, created job opportunities for community members through the garden network, 
                        and improved food security in historically underserved neighborhoods.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 shadow-soft">
                      <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Personal Growth & Character Development
                      </h4>
                      <p className="text-foreground/85 leading-relaxed mb-3">
                        This project transformed my understanding of technology's role in community building. 
                        I evolved from viewing code as an end in itself to seeing it as a tool for amplifying human connection and wisdom.
                      </p>
                      <p className="text-foreground/85 leading-relaxed mb-3">
                        The experience taught me that true innovation honors existing community knowledge while expanding possibilities. 
                        I learned to lead with humility, asking "How can I serve?" rather than "How can I disrupt?"
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        Most significantly, I discovered that sustainable impact requires building with communities, not for them. 
                        This shift in perspective now guides all my technical and leadership decisions.
                      </p>
                    </div>

                    {insightDepth === 'expert' && (
                      <div className="p-5 rounded-xl bg-gradient-to-r from-success/10 to-accent/10 border border-success/30 shadow-soft">
                        <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Expert Analysis: Admissions Strategy
                        </h4>
                        <p className="text-foreground/80 text-sm leading-relaxed">
                          This project demonstrates the rare "Personal Pain Point → Community Solution" pattern that admissions committees highly value. 
                          The authentic progression from personal experience to systematic change shows intellectual maturity, cultural competence, 
                          and leadership potential that distinguishes you from typical "tech for good" applications.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Breakthrough Moments with Rich Content */}
              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                      <Crown className="h-5 w-5" />
                    </div>
                    Breakthrough Moments Analysis
                  </CardTitle>
                  <CardDescription>Critical turning points that defined success trajectory</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {project.impactAnalysis.deepDive.breakthroughMoments?.map((moment: any, i: number) => (
                    <div key={i} className="space-y-5">
                      <div className="p-5 rounded-xl bg-gradient-to-r from-success/10 to-primary/10 border border-success/30 shadow-soft">
                        <h5 className="font-semibold text-success mb-3">The Pivotal Moment</h5>
                        <p className="text-foreground/90 leading-relaxed mb-4">{moment.moment}</p>
                        
                        <p className="text-foreground/90 mb-3">
                          <strong className="text-accent">Strategic Significance:</strong> {moment.significance}
                        </p>
                        <p className="text-foreground/90 mb-4">
                          <strong className="text-primary">Character Evolution:</strong> {moment.characterGrowth}
                        </p>

                        <div className="p-4 rounded-lg bg-primary/15 border border-primary/30">
                          <h6 className="font-medium text-primary text-sm mb-2 flex items-center gap-2">
                            <Gem className="h-3 w-3" />
                            ESSAY GOLD MINE
                          </h6>
                          <p className="italic text-foreground/95 text-sm leading-relaxed">"{moment.essayGold}"</p>
                        </div>

                        {insightDepth === 'expert' && (
                          <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/30">
                            <h6 className="font-medium text-accent text-sm mb-2">Admissions Strategy Note</h6>
                            <p className="text-foreground/80 text-xs">
                              This breakthrough demonstrates intellectual maturity and adaptability - key traits admissions officers value. 
                              Frame this as evidence of your growth mindset and ability to learn from experience.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Skills Deep Dive Tab */}
          <TabsContent value="skills" className="space-y-8">
            {/* Skills Chart Visualization */}
            <Card className="glass-card shadow-large overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-gradient">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Skills Development Analysis</CardTitle>
                      <CardDescription>Comprehensive breakdown of technical and soft skills progression</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {chartOptions.skills.map((chartType) => (
                      <Button
                        key={chartType}
                        variant={activeChartTypes.skills === chartType ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveChartTypes({...activeChartTypes, skills: chartType})}
                        className={`capitalize ${activeChartTypes.skills === chartType ? 'bg-gradient-primary text-white' : 'hover-lift'}`}
                      >
                        {chartType}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={project.chartData.skillProgression}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="skill" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="month1" fill="hsl(var(--muted))" name="Month 1" />
                      <Bar dataKey="month3" fill="hsl(var(--primary))" name="Month 3" />
                      <Bar dataKey="month6" fill="hsl(var(--success))" name="Month 6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Core Competencies Analysis */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Code className="h-5 w-5" />
                    </div>
                    Core Technical Competencies
                  </CardTitle>
                  <CardDescription>Primary skills developed with concrete evidence and real-world application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Full-Stack Development Mastery
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Achieved proficiency in React, Node.js, and database architecture through hands-on community project development. 
                      Built a real-time collaborative platform handling 500+ concurrent users with 99.8% uptime over 6 months.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      Key breakthrough: Implemented offline-first architecture for low-connectivity areas, demonstrating advanced 
                      understanding of user experience design and technical constraints. Code architecture was reviewed and praised 
                      by senior developers at local tech companies.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-success/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      System Architecture & Scalability
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Designed and implemented scalable infrastructure that grew from supporting 45 users to 500+ without performance degradation. 
                      Learned database optimization, load balancing, and real-time data synchronization under production pressure.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      This experience provided deep understanding of how technical decisions impact real users and communities, 
                      teaching me to balance feature development with system reliability and user experience.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-accent/10 border border-accent/30 shadow-soft">
                    <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Experience Design
                    </h4>
                    <p className="text-foreground/85 leading-relaxed">
                      Evolved from tech-first to user-centered design thinking. Completely rebuilt the interface three times based 
                      on community feedback, achieving 95% user satisfaction versus 40% for the original design. 
                      This iterative process taught me the critical importance of validating assumptions with real users before building solutions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                      <Heart className="h-5 w-5" />
                    </div>
                    Leadership & Soft Skills Development
                  </CardTitle>
                  <CardDescription>Character development and interpersonal skills gained through project leadership</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-success/15 to-accent/15 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Compass className="h-4 w-4" />
                      Adaptive Leadership Excellence
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Demonstrated exceptional adaptability when initial project approach failed to meet community needs. 
                      Instead of persisting with the original vision, I led a complete strategic pivot based on user feedback, 
                      resulting in dramatically improved outcomes.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      This experience taught me that effective leadership requires intellectual humility and the courage to admit 
                      when assumptions are wrong. I learned to validate ideas before implementing them, saving time and resources 
                      while building stronger community relationships.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Cultural Intelligence & Communication
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Developed advanced cross-cultural communication skills while working with diverse community members across 
                      generational, linguistic, and socioeconomic lines. Learned to translate technical concepts into accessible language 
                      and to bridge different perspectives on technology adoption.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      Key learning: Technology solutions must respect and amplify existing community wisdom rather than replacing it. 
                      This insight now guides my approach to all technical and social challenges.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-accent/10 border border-accent/30 shadow-soft">
                    <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Strategic Problem-Solving
                    </h4>
                    <p className="text-foreground/85 leading-relaxed">
                      Evolved from viewing problems as isolated technical challenges to understanding them as interconnected 
                      social and technical systems. This systems thinking approach enabled me to identify root causes rather than 
                      just symptoms, leading to more sustainable and impactful solutions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skill Transfer & Market Relevance */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  Market Relevance & Career Application
                </CardTitle>
                <CardDescription>How these skills translate to academic and professional opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Academic Program Alignment
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Perfect preparation for computer science programs emphasizing practical impact and social responsibility. 
                      The combination of technical depth and community engagement demonstrates readiness for programs like 
                      Stanford's CS+Social Good track or MIT's public service initiatives.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      Experience with real-world constraints, user feedback, and production systems provides substantial 
                      advantage over students with only academic or personal project experience.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-success/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Professional Readiness
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Developed high-demand skill set with proven ability to scale applications under pressure. 
                      Experience managing real users and stakeholder expectations provides significant advantage 
                      for internship and entry-level positions.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      Unique context: Most developers learn on toy projects, but I learned on infrastructure serving 
                      real communities with genuine consequences for failure - this experience is highly valued by employers.
                    </p>
                  </div>
                </div>

                {insightDepth === 'expert' && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-success/10 to-accent/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Expert Career Strategy
                    </h4>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      This skill combination positions you for high-impact roles in social enterprise technology, 
                      B-Corps, or mission-driven startups. Consider highlighting the rare combination of technical excellence 
                      with cultural competence and community organizing experience - this profile is exceptionally valuable 
                      in today's market where companies increasingly focus on social impact and inclusive design.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Essay Goldmine Tab */}
          <TabsContent value="essays" className="space-y-8">
            {/* Story Themes Chart */}
            <Card className="glass-card shadow-large overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-gradient">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Gem className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Essay Theme Analysis</CardTitle>
                      <CardDescription>Comprehensive breakdown of narrative themes and essay potential</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {chartOptions.essays.map((chartType) => (
                      <Button
                        key={chartType}
                        variant={activeChartTypes.essays === chartType ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveChartTypes({...activeChartTypes, essays: chartType})}
                        className={`capitalize ${activeChartTypes.essays === chartType ? 'bg-gradient-primary text-white' : 'hover-lift'}`}
                      >
                        {chartType}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={project.chartData.storyThemes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="essays" name="Available Essays" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="score" name="Theme Strength" stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }} 
                        formatter={(value, name) => [value, name === 'score' ? 'Theme Strength' : 'Essay Count']}
                        labelFormatter={(label) => `Theme: ${label}`}
                      />
                      <Scatter dataKey="score" fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Ready-to-Use Story Fragments */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    Powerful Opening Hooks
                  </CardTitle>
                  <CardDescription>Compelling narrative beginnings ready for essay applications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  {project.essayGoldmine.powerfulOpeningHooks.map((hook: any, index: number) => (
                    <div key={index} className="p-5 rounded-xl bg-gradient-to-r from-accent/15 to-primary/15 border border-accent/30 shadow-soft">
                      <div className="mb-4 p-4 rounded-lg bg-card/80 border border-border/30">
                        <p className="text-foreground/95 italic font-medium leading-relaxed">"{hook.hook}"</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-primary text-white border-0">
                            {hook.essayPrompt}
                          </Badge>
                          <Badge variant="outline" className="border-success/50 text-success">
                            Uniqueness: {hook.uniquenessScore}%
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/70">{hook.developmentPath}</p>
                      </div>
                    </div>
                  ))}

                  <div className="p-5 rounded-xl bg-success/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Quote className="h-4 w-4" />
                      Additional Hook Variations
                    </h4>
                    <div className="space-y-3">
                      <p className="text-foreground/85 italic leading-relaxed">
                        "The notification at 2 AM changed everything: 'Mrs. Rodriguez's tomatoes are ready for harvest, 
                        and she's teaching traditional canning tomorrow.' In that moment, I realized my app had become 
                        something I never intended - a bridge between generations."
                      </p>
                      <p className="text-foreground/85 italic leading-relaxed">
                        "Three failed prototypes taught me more about community than four years of computer science theory. 
                        The fourth version succeeded because I finally learned to code with my heart, not just my head."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    Character Development Arcs
                  </CardTitle>
                  <CardDescription>Personal growth narratives with supporting evidence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  {project.essayGoldmine.characterDevelopmentArcs.map((arc: any, index: number) => (
                    <div key={index} className="space-y-4">
                      <div className="p-5 rounded-xl bg-gradient-to-r from-success/15 to-accent/15 border border-success/30 shadow-soft">
                        <h4 className="font-semibold text-success mb-3">{arc.theme}</h4>
                        <div className="space-y-2">
                          {arc.progression.map((step: string, stepIndex: number) => (
                            <div key={stepIndex} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                                {stepIndex + 1}
                              </div>
                              <p className="text-foreground/80 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                          <h5 className="font-medium text-primary mb-2">Essay Applications</h5>
                          <div className="flex flex-wrap gap-1">
                            {arc.essayApplications.map((app: string, appIndex: number) => (
                              <Badge key={appIndex} variant="outline" className="border-primary/50 text-primary text-xs">
                                {app}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                          <h5 className="font-medium text-success mb-2">Character Strengths</h5>
                          <div className="flex flex-wrap gap-1">
                            {arc.characterStrengths.map((strength: string, strengthIndex: number) => (
                              <Badge key={strengthIndex} variant="outline" className="border-success/50 text-success text-xs">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Specific Story Moments */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <Camera className="h-5 w-5" />
                  </div>
                  Narrative Gold Mine - Specific Moments
                </CardTitle>
                <CardDescription>Concrete story moments ready for essay development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {project.essayGoldmine.specificStoryMoments.map((story: any, index: number) => (
                  <div key={index} className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30 shadow-soft">
                    <h4 className="font-bold text-accent mb-4 text-lg">{story.storyTitle}</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            The Setup
                          </h5>
                          <p className="text-foreground/80 leading-relaxed">{story.setup}</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            The Challenge
                          </h5>
                          <p className="text-foreground/80 leading-relaxed">{story.conflict}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            My Role
                          </h5>
                          <p className="text-foreground/80 leading-relaxed">{story.myRole}</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            The Resolution
                          </h5>
                          <p className="text-foreground/80 leading-relaxed">{story.resolution}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30">
                        <h5 className="font-semibold text-primary mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Deeper Meaning
                        </h5>
                        <p className="text-foreground/85 leading-relaxed italic">"{story.deeperMeaning}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                          <h6 className="font-medium text-success mb-2">Essay Potential</h6>
                          <p className="text-sm text-foreground/80">{story.essayPotential}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                          <h6 className="font-medium text-accent mb-2">Character Qualities Demonstrated</h6>
                          <div className="flex flex-wrap gap-1">
                            {story.characterQualities.map((quality: string, qualityIndex: number) => (
                              <Badge key={qualityIndex} variant="outline" className="border-accent/50 text-accent text-xs">
                                {quality}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {insightDepth === 'expert' && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-success/10 to-accent/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Expert Essay Strategy
                    </h4>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      These stories showcase the rare combination of technical skill, cultural intelligence, and community impact that 
                      sets you apart from typical applicants. Focus on the moments where technology met human connection - 
                      these demonstrate both innovation and empathy, highly valued by competitive programs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ready-to-Use insights */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <FileText className="h-5 w-5" />
                  </div>
                  Ready-to-Use Insights & Themes
                </CardTitle>
                <CardDescription>Polished insights ready for direct essay integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {project.essayGoldmine.readyToUseInsights.map((insight: any, index: number) => (
                  <div key={index} className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 shadow-soft">
                    <div className="mb-4 p-4 rounded-lg bg-card/80 border border-border/30">
                      <p className="text-foreground/95 font-medium leading-relaxed">"{insight.insight}"</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-semibold text-primary text-sm mb-1">Application Context</h5>
                        <p className="text-foreground/80 text-sm">{insight.applicationContext}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-success text-sm mb-1">Supporting Evidence</h5>
                        <p className="text-foreground/80 text-sm">{insight.supportingEvidence}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-accent text-sm mb-1">Essay Integration Strategy</h5>
                        <p className="text-foreground/80 text-sm">{insight.essayIntegration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Future Trajectory Tab */}
          <TabsContent value="future" className="space-y-8">
            {/* Career Alignment Chart */}
            <Card className="glass-card shadow-large overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-gradient">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Compass className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Career Path Analysis</CardTitle>
                      <CardDescription>Data-driven insights into future opportunities and growth potential</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {chartOptions.future.map((chartType) => (
                      <Button
                        key={chartType}
                        variant={activeChartTypes.future === chartType ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveChartTypes({...activeChartTypes, future: chartType})}
                        className={`capitalize ${activeChartTypes.future === chartType ? 'bg-gradient-primary text-white' : 'hover-lift'}`}
                      >
                        {chartType}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={project.chartData.careerAlignment}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="career" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="probability" fill="hsl(var(--primary))" name="Career Probability %" />
                      <Bar dataKey="growth" fill="hsl(var(--success))" name="Growth Potential %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Career Path Analysis */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Rocket className="h-5 w-5" />
                    </div>
                    Strategic Career Pathways
                  </CardTitle>
                  <CardDescription>Logical next steps based on project experience and demonstrated capabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  {project.futureAnalysis.careerTrajectoryPredictions.map((prediction: any, index: number) => (
                    <div key={index} className="p-5 rounded-xl bg-gradient-to-r from-success/15 to-accent/15 border border-success/30 shadow-soft">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-success">{prediction.path}</h4>
                        <Badge className="bg-gradient-primary text-white border-0">
                          {prediction.probability}% Match
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-foreground text-sm mb-2">Evidence Supporting This Path</h5>
                          <ul className="space-y-1">
                            {prediction.evidence.map((item: string, itemIndex: number) => (
                              <li key={itemIndex} className="text-foreground/80 text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-primary text-sm mb-2">Recommended Next Steps</h5>
                          <ul className="space-y-1">
                            {prediction.recommendedSteps.map((step: string, stepIndex: number) => (
                              <li key={stepIndex} className="text-foreground/80 text-sm flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Alternative High-Impact Pathways
                    </h4>
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Technology Policy & Ethics:</strong> Your experience bridging technology and community makes you ideal 
                        for roles in tech policy, digital equity, or ethical AI development. Consider programs that combine 
                        computer science with public policy or philosophy.
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Social Innovation Leadership:</strong> The rare combination of technical skills and community organizing 
                        experience positions you for leadership roles in social innovation labs, impact investing, or B-Corp development.
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Academic Research:</strong> Your project demonstrates skills in human-computer interaction, 
                        community-centered design, and social computing - growing research fields with significant impact potential.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    Skill Transfer Opportunities
                  </CardTitle>
                  <CardDescription>How current project experience applies to future endeavors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-success/15 to-accent/15 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Technical Skills Amplification
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Your full-stack development experience with real users provides a strong foundation for advanced technical roles. 
                      The production-level experience with scaling, reliability, and user feedback loops gives you significant 
                      advantages over peers with only academic experience.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      Consider extending these skills into emerging areas like AI/ML applications for social good, 
                      blockchain for community organizing, or AR/VR for education and training.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-accent/10 border border-accent/30 shadow-soft">
                    <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Leadership & Community Building
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Your experience leading cross-cultural, intergenerational community initiatives translates directly to 
                      organizational leadership roles. The skills of building consensus, managing diverse stakeholders, 
                      and creating sustainable systems are highly valued in any sector.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      These skills position you for early leadership opportunities in college and accelerated career advancement 
                      in any field you choose to pursue.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Innovation & Problem-Solving
                    </h4>
                    <p className="text-foreground/85 leading-relaxed mb-3">
                      Your approach to problem-solving - starting with community needs, iterating based on feedback, 
                      and building sustainable systems - is applicable across all fields and industries.
                    </p>
                    <p className="text-foreground/85 leading-relaxed">
                      This methodology positions you for success in research, product development, consulting, 
                      or any role requiring innovative solutions to complex problems.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Evolution & Strategic Integration */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <Network className="h-5 w-5" />
                  </div>
                  Project Evolution & Strategic Integration
                </CardTitle>
                <CardDescription>Ways to expand current project and integrate with broader goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 shadow-soft">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Expand className="h-4 w-4" />
                      Project Expansion Pathways
                    </h4>
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Geographic Scaling:</strong> Expand the platform to serve additional neighborhoods and cities, 
                        developing replicable implementation frameworks that honor local community characteristics while 
                        maintaining core functionality.
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Feature Evolution:</strong> Add educational components, mentorship matching, micro-lending for garden 
                        supplies, or integration with local farmers' markets to create a comprehensive community resilience platform.
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Research Integration:</strong> Partner with university researchers to study community-centered technology 
                        adoption, urban agriculture impact, or intergenerational knowledge transfer in digital spaces.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-success/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Strategic Academic Integration
                    </h4>
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Computer Science Programs:</strong> This project provides excellent foundation for courses in 
                        human-computer interaction, software engineering, database systems, and user experience design. 
                        The real-world experience gives you concrete examples for theoretical concepts.
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Interdisciplinary Studies:</strong> Perfect bridge project for programs combining technology with 
                        sociology, urban planning, environmental science, or public policy. Demonstrates ability to apply 
                        technical skills across disciplines.
                      </p>
                      <p className="text-foreground/85 leading-relaxed">
                        <strong>Leadership Development:</strong> Strong foundation for pursuing leadership roles in student organizations, 
                        particularly those focused on social impact, technology ethics, or community engagement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admissions Positioning Strategy */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30 shadow-soft">
                  <h4 className="font-semibold text-accent mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Strategic Admissions Positioning
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-success mb-3">Competitive Advantages</h5>
                      <div className="space-y-2">
                        {project.futureAnalysis.admissionsPositioning.competitiveAdvantages.map((advantage: any, index: number) => (
                          <div key={index} className="p-3 rounded-lg bg-success/10 border border-success/30">
                            <h6 className="font-medium text-success text-sm mb-1">{advantage.advantage}</h6>
                            <p className="text-foreground/80 text-xs mb-2">{advantage.strength}</p>
                            <div className="flex flex-wrap gap-1">
                              {advantage.schoolFit.map((school: string, schoolIndex: number) => (
                                <Badge key={schoolIndex} variant="outline" className="border-success/50 text-success text-xs">
                                  {school}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-destructive mb-3">Strategic Considerations</h5>
                      <div className="space-y-2">
                        {project.futureAnalysis.admissionsPositioning.potentialConcerns.map((concern: any, index: number) => (
                          <div key={index} className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                            <h6 className="font-medium text-destructive text-sm mb-1">{concern.concern}</h6>
                            <p className="text-foreground/80 text-xs mb-2">{concern.mitigation}</p>
                            <p className="text-accent text-xs font-medium">{concern.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {insightDepth === 'expert' && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-success/10 to-accent/10 border border-success/30 shadow-soft">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Expert Strategic Guidance
                    </h4>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      Your project portfolio demonstrates exceptional combination of technical excellence, cultural intelligence, 
                      and community impact that positions you uniquely for top-tier programs. Focus on schools that value 
                      both innovation and social responsibility. Consider reaching out to faculty in human-computer interaction, 
                      social computing, or technology policy programs who would appreciate your community-centered approach to technology development.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Enhanced Expandable Insight Card Component  
const InsightCard: React.FC<{
  title: string;
  summary: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  score?: number;
  badge?: string;
  variant?: 'default' | 'premium' | 'critical';
}> = ({ title, summary, icon, children, score, badge, variant = 'default' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg shadow-primary/10";
      case 'critical':
        return "bg-gradient-to-br from-destructive/10 to-warning/10 border-destructive/30 shadow-lg shadow-destructive/10";
      default:
        return "bg-card/70 border-border/50 backdrop-blur-sm";
    }
  };

  return (
    <Card className={`${getVariantStyles()} transition-all duration-300`}>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {title}
                      {badge && (
                        <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                          {badge}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-foreground/70">
                      {summary}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  )}
                  <div className="p-2 rounded-full bg-primary/10">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              </div>
            </CardHeader>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Story Fragment Component for Essay Goldmine
const StoryFragment: React.FC<{
  title: string;
  content: string;
  tags: string[];
  essayPotential: string;
  uniqueness: number;
}> = ({ title, content, tags, essayPotential, uniqueness }) => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
    <div className="flex items-start justify-between mb-3">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <div className="flex gap-2">
        {tags.map((tag, i) => (
          <Badge key={i} variant="outline" className="border-accent/50 text-accent text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
    <blockquote className="text-foreground/90 italic border-l-4 border-accent pl-4 bg-card/30 p-3 rounded-r-lg">
      "{content}"
    </blockquote>
    <div className="flex items-center justify-between mt-3">
      <span className="text-xs text-foreground/70">Essay Potential: {essayPotential}</span>
      <div className="flex items-center gap-2">
        <Progress value={uniqueness} className="w-16 h-2" />
        <span className="text-xs text-foreground/70">{uniqueness}%</span>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const PortfolioMetricsDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'project'>('dashboard');

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setViewMode('project');
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
    setViewMode('dashboard');
  };

  // Portfolio Summary Calculations
  const portfolioSummary = {
    totalProjects: portfolioData.length,
    avgImpactScore: Math.round(portfolioData.reduce((sum, p) => sum + p.quickMetrics.impactScore, 0) / portfolioData.length),
    avgStoryPotential: Math.round(portfolioData.reduce((sum, p) => sum + p.quickMetrics.storyPotential, 0) / portfolioData.length),
    avgAdmissionsValue: Math.round(portfolioData.reduce((sum, p) => sum + p.quickMetrics.admissionsValue, 0) / portfolioData.length),
    verifiedProjects: portfolioData.filter(p => p.verified).length
  };

  if (viewMode === 'project' && selectedProject) {
    return <ProjectCard project={selectedProject} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-accent/3">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Portfolio Intelligence Dashboard</h1>
              <p className="text-foreground/70 mt-1">Deep analysis of your project portfolio with AI-powered insights</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Search className="h-4 w-4 mr-2" />
                Search Projects
              </Button>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Filter className="h-4 w-4 mr-2" />
                Filter & Sort
              </Button>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Export Portfolio
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Portfolio Summary Cards & Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-card border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{portfolioSummary.totalProjects}</p>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{portfolioSummary.avgImpactScore}</p>
                  <p className="text-sm text-muted-foreground">Avg Impact Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Gem className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{portfolioSummary.avgStoryPotential}</p>
                  <p className="text-sm text-muted-foreground">Story Potential</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{portfolioSummary.avgAdmissionsValue}</p>
                  <p className="text-sm text-muted-foreground">Admissions Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{portfolioSummary.verifiedProjects}</p>
                  <p className="text-sm text-muted-foreground">Verified Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {portfolioData.map((project) => (
            <Card 
              key={project.id} 
              className="bg-card/70 border-border/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleProjectSelect(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      {project.title}
                      {project.verified && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </CardTitle>
                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        {project.type}
                      </Badge>
                      <Badge variant="outline" className="border-accent/50 text-accent">
                        {project.category}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project.impactAnalysis.summary}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {Object.entries(project.quickMetrics).slice(0, 4).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-foreground">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <Progress value={value} className="mt-1 h-1" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Completed: {new Date(project.completedDate).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioMetricsDashboard;
