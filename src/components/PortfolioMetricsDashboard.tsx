import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InsightCard as BeautifulInsightCard } from "@/components/dashboard/InsightCard";
import { MetricCard as BeautifulMetricCard } from "@/components/dashboard/MetricCard";
import { QuoteCard } from "@/components/dashboard/QuoteCard";
import { ExpertAnalysisCard } from "@/components/dashboard/ExpertAnalysisCard";
import { ExpandableSection } from "@/components/dashboard/ExpandableSection";
import { TimelineCard } from "@/components/dashboard/TimelineCard";
import { TransformationCard } from "@/components/dashboard/TransformationCard";
import { StakeholderCard } from "@/components/dashboard/StakeholderCard";
import { SystemsThinkingCard } from "@/components/dashboard/SystemsThinkingCard";
import { TechnicalSkillsCard } from "@/components/dashboard/TechnicalSkillsCard";
import { LeadershipCard } from "@/components/dashboard/LeadershipCard";
import { SkillsDashboard } from "@/components/dashboard/SkillsDashboard";
import { TechnicalSkillsShowcase } from "@/components/dashboard/TechnicalSkillsShowcase";
import { LeadershipSkillsJourney } from "@/components/dashboard/LeadershipSkillsJourney";
import { SoftSkillsEvidence } from "@/components/dashboard/SoftSkillsEvidence";
import { SkillsExpertAnalysis } from "@/components/dashboard/SkillsExpertAnalysis";
import ApplicationStrategyDashboard from "@/components/dashboard/ApplicationStrategyDashboard";
import ApplicationDescriptionWorkshop from "@/components/dashboard/ApplicationDescriptionWorkshop";
import NarrativeArchitectureBuilder from "@/components/dashboard/NarrativeArchitectureBuilder";
import StrategicWritingEnhancement from "@/components/dashboard/StrategicWritingEnhancement";
import PortfolioCoherenceStrategist from "@/components/dashboard/PortfolioCoherenceStrategist";
import ExpertApplicationIntelligence from "@/components/dashboard/ExpertApplicationIntelligence";
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
            {/* Enhanced Hero Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <BeautifulMetricCard
                title="Active Users"
                value="500+"
                subtitle="Community Members"
                trend="up"
                trendValue="+234% growth"
                variant="primary"
              />
              <BeautifulMetricCard
                title="Gardens Connected"
                value="42"
                subtitle="Neighborhood Networks"
                trend="up"
                trendValue="+300% expansion"
                variant="secondary"
              />
              <BeautifulMetricCard
                title="User Satisfaction"
                value="96%"
                subtitle="Community Approval"
                trend="up"
                trendValue="+24 points"
                variant="success"
              />
              <BeautifulMetricCard
                title="Impact Score"
                value={project.quickMetrics.impactScore}
                subtitle="Overall Rating"
                trend="up"
                trendValue="Excellent"
                variant="warning"
              />
            </div>

            {/* Project Genesis Story */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <BeautifulInsightCard
                title="The Spark: Food Insecurity Crisis"
                icon={Heart}
                variant="primary"
                content={
                  <div className="space-y-4">
                    <p>During pandemic lockdowns, I witnessed food insecurity firsthand in historically underserved neighborhoods. Families struggled not just with access to fresh produce, but with the knowledge and community connections needed for sustainable food security.</p>
                    <p>The trigger moment came when I realized that individual solutions couldn't address systemic community disconnection. This project emerged from understanding that food security is fundamentally about community resilience, not individual resources.</p>
                  </div>
                }
              />

              <QuoteCard
                quote={project.impactAnalysis.deepDive.genesis.personalConnection}
                author="Personal Reflection"
                context="Project Genesis"
                variant="secondary"
              />
            </div>

            {/* Breakthrough Moment */}
            <div className="mb-8">
              <TimelineCard
                variant="primary"
                events={[
                  {
                    title: "Initial Community Research",
                    description: "Conducted interviews with 40+ families to understand barriers to food security. Discovered that isolation, not resources, was the primary challenge.",
                    date: "January 2024",
                    location: "East Oakland",
                    participants: "40+ families",
                    impact: "Identified root cause: social disconnection, not resource scarcity"
                  },
                  {
                    title: "The Grandmother's Kitchen Moment",
                    description: project.impactAnalysis.deepDive.breakthroughMoments[0].moment,
                    date: "March 2024", 
                    location: "Mrs. Rodriguez's Home",
                    impact: project.impactAnalysis.deepDive.breakthroughMoments[0].significance
                  },
                  {
                    title: "Community Ownership Transfer",
                    description: "Transitioned platform governance to community leaders, ensuring sustainable local ownership and continued growth without external dependency.",
                    date: "June 2024",
                    participants: "Community Leadership Council",
                    impact: "100% community-owned platform with 96% user satisfaction"
                  }
                ]}
              />
            </div>

            {/* Personal Transformation Journey */}
            <TransformationCard
              title="Personal Transformation: From Disruption to Amplification"
              progression={[
                {
                  title: "Tech-First Mindset",
                  description: "Initially believed technology could replace inefficient human systems. Led with features instead of relationships.",
                  keyLearning: "Technology without community trust creates barriers, not solutions.",
                  milestone: "3 failed outreach attempts"
                },
                {
                  title: "Community Listening Phase",
                  description: "Realized existing systems contained wisdom I didn't understand. Started attending community meetings as learner, not teacher.",
                  keyLearning: "Every 'inefficiency' serves a purpose - I needed to understand before optimizing.",
                  milestone: "First meaningful conversations"
                },
                {
                  title: "Collaborative Design Approach",
                  description: "Shifted from 'How can tech solve this?' to 'How can tech amplify what already works?' Co-created solutions with community members.",
                  keyLearning: "The best technology makes people more human, not less.",
                  milestone: "Community co-design sessions"
                },
                {
                  title: "Amplification Leadership",
                  description: "Now design solutions that honor existing community knowledge while expanding possibilities. Technology bridges generations instead of replacing wisdom.",
                  keyLearning: "True innovation happens when technology serves community needs, not when community adapts to technology.",
                  milestone: "Community ownership transfer"
                }
              ]}
              characterStrengths={["Humility", "Systems Thinking", "Cultural Sensitivity", "Adaptive Leadership"]}
            />

            {/* Stakeholder Ecosystem Analysis */}
            <StakeholderCard
              stakeholderGroups={[
                {
                  type: 'beneficiaries',
                  title: 'Community Gardeners',
                  members: ['Mrs. Rodriguez (seed collection keeper)', 'Young families', 'Elder wisdom keepers', 'New residents'],
                  relationship: 'Primary users who shaped every feature through feedback and testing',
                  impact: '500+ active users with 96% satisfaction and sustained engagement',
                  keyInsight: 'Success depends on making everyone feel like an expert contributor, not just a user'
                },
                {
                  type: 'mentors',
                  title: 'Community Leaders & Advisors',
                  members: ['Neighborhood Association President', 'Community College Urban Planning Dept', 'Local Tech Mentors', 'Elder Council'],
                  relationship: 'Provided guidance on community dynamics and technical architecture',
                  impact: 'Secured institutional support and legitimacy for long-term sustainability',
                  keyInsight: 'Bridging traditional power structures with innovation requires patience and respect'
                },
                {
                  type: 'partners',
                  title: 'Implementation Partners',
                  members: ['Local Government Officials', 'School Districts', 'Community Organizations', 'Environmental Groups'],
                  relationship: 'Formal partnerships that enabled resource sharing and program expansion',
                  impact: 'Scaled model to 4 additional neighborhoods with sustained funding',
                  keyInsight: 'Sustainable community tech requires institutional backing, not just grassroots enthusiasm'
                },
                {
                  type: 'challengers',
                  title: 'Skeptics & Critical Voices',
                  members: ['Tech-wary residents', 'Traditional gardening purists', 'Privacy advocates', 'Resource competition concerns'],
                  relationship: 'Initially resistant but became valuable critics who improved the solution',
                  impact: 'Their challenges led to better privacy protections and more inclusive design',
                  keyInsight: 'Skeptics often identify real problems that enthusiasts overlook'
                }
              ]}
              conflictResolution={{
                situation: 'Heated debate between older gardeners preferring heirloom varieties and younger ones wanting higher-yield hybrids',
                approach: 'Used app data to show both approaches worked in different soil conditions, created neighborhood seed swap feature',
                outcome: 'Technology became neutral ground for bridging generational differences, both groups now share knowledge actively'
              }}
            />

            {/* Systems Thinking Deep Dive */}
            <SystemsThinkingCard
              problemStatement="Community food insecurity appeared to be resource scarcity but root cause analysis revealed social isolation as core issue"
              rootCauses={[
                'Social isolation preventing knowledge sharing between experienced and new gardeners',
                'Language barriers limiting access to gardening resources and community connections',
                'Generational divides between traditional methods and modern approaches',
                'Lack of coordination leading to resource waste and duplicated efforts',
                'Absence of year-round engagement causing seasonal knowledge loss'
              ]}
              systemsMap={[
                {
                  id: 'root-1',
                  label: 'Social Isolation',
                  type: 'root-cause',
                  description: 'Neighbors with gardening knowledge not connected to those who need help'
                },
                {
                  id: 'symptom-1',
                  label: 'Failed Gardens',
                  type: 'symptom',
                  description: 'High failure rate among new gardeners due to lack of guidance'
                },
                {
                  id: 'intervention-1',
                  label: 'Community Platform',
                  type: 'intervention',
                  description: 'Digital space for knowledge sharing and relationship building'
                },
                {
                  id: 'outcome-1',
                  label: 'Sustainable Food Network',
                  type: 'outcome',
                  description: '96% user satisfaction with sustained community ownership'
                }
              ]}
              feedbackLoops={[
                {
                  title: 'Knowledge Sharing Reinforcement',
                  description: 'Successful gardens → increased social connection → more knowledge sharing → better gardens → stronger relationships',
                  type: 'reinforcing',
                  impact: 'positive'
                },
                {
                  title: 'Trust Building Cycle',
                  description: 'Platform use → successful interactions → increased trust → more platform engagement → deeper community bonds',
                  type: 'reinforcing',
                  impact: 'positive'
                },
                {
                  title: 'Gentrification Mitigation',
                  description: 'Community ownership → local control → resistance to displacement → sustained neighborhood character',
                  type: 'balancing',
                  impact: 'positive'
                }
              ]}
              beforeAfter={{
                before: 'Fragmented community with individuals struggling in isolation, high garden failure rates, knowledge hoarding by experienced gardeners',
                after: 'Connected network where success is collective, knowledge flows freely between generations, 67% increase in neighborhood social connections',
                keyChanges: ['Centralized knowledge sharing', 'Intergenerational connection', 'Community ownership model', 'Sustainable engagement patterns']
              }}
            />

            {/* Technical Skills Mastery */}
            <TechnicalSkillsCard
              skillProgression={[
                {
                  skill: 'Full-Stack Development',
                  category: 'programming',
                  before: 35,
                  current: 92,
                  evidence: ['React/Node.js architecture', '500+ concurrent users', '99.8% uptime', 'Senior developer code review praise'],
                  keyProject: 'Community gardening platform with real-time collaboration features'
                },
                {
                  skill: 'Database Architecture',
                  category: 'systems',
                  before: 20,
                  current: 85,
                  evidence: ['Offline-first design', 'Real-time sync', 'Data conflict resolution', 'Performance optimization'],
                  keyProject: 'Scalable community data management system'
                },
                {
                  skill: 'User Experience Design',
                  category: 'tools',
                  before: 25,
                  current: 95,
                  evidence: ['3 complete UI rebuilds', '95% user satisfaction', 'Community-driven design process', 'Accessibility compliance'],
                  keyProject: 'Community-centered interface design with elder-friendly features'
                },
                {
                  skill: 'System Administration',
                  category: 'systems',
                  before: 15,
                  current: 78,
                  evidence: ['AWS deployment', 'Load balancing', 'Monitoring setup', 'Security implementation'],
                  keyProject: 'Production infrastructure serving 500+ users reliably'
                }
              ]}
              majorAchievements={[
                {
                  title: 'Offline-First Community Platform',
                  description: 'Built resilient platform working without internet connectivity, crucial for low-resource areas',
                  technicalComplexity: 5,
                  innovation: 'Implemented conflict-free data synchronization for community knowledge sharing',
                  metrics: [
                    { label: 'Uptime', value: '99.8%' },
                    { label: 'Users', value: '500+' },
                    { label: 'Satisfaction', value: '96%' },
                    { label: 'Response Time', value: '<200ms' }
                  ]
                },
                {
                  title: 'Community Ownership Transfer System',
                  description: 'Created sustainable model for community-controlled technology with knowledge transfer protocols',
                  technicalComplexity: 4,
                  innovation: 'Developed training systems enabling non-technical community ownership',
                  metrics: [
                    { label: 'Communities', value: '4' },
                    { label: 'Retention', value: '94%' },
                    { label: 'Local Control', value: '100%' },
                    { label: 'Sustainability', value: '2+ years' }
                  ]
                }
              ]}
              technologyStack={{
                languages: ['JavaScript', 'TypeScript', 'Python', 'SQL'],
                frameworks: ['React', 'Node.js', 'Express', 'PostgreSQL'],
                tools: ['Git', 'Docker', 'AWS', 'Figma'],
                systems: ['Linux', 'nginx', 'Redis', 'CI/CD']
              }}
            />

            {/* Leadership Evolution Journey */}
            <LeadershipCard
              evolution={[
                {
                  phase: 'Individual Contributor',
                  timeframe: 'Months 1-2',
                  leadershipStyle: 'Technical expert trying to lead through expertise',
                  situationHandled: 'First community meetings where I presented technical solutions',
                  keyDecision: 'Realized I needed to listen more than I spoke',
                  outcome: 'Failed to gain community buy-in but learned valuable lessons about communication',
                  skillsDeveloped: ['Active listening', 'Cultural humility', 'Assumption questioning']
                },
                {
                  phase: 'Collaborative Facilitator',
                  timeframe: 'Months 3-4',
                  leadershipStyle: 'Servant leadership focused on enabling others',
                  situationHandled: 'Mediating conflicts between different gardening approaches',
                  keyDecision: 'Positioned technology as neutral ground for bridging differences',
                  outcome: 'Successfully unified competing factions around shared goals',
                  skillsDeveloped: ['Conflict mediation', 'Stakeholder management', 'Diplomatic communication']
                },
                {
                  phase: 'Community Organizer',
                  timeframe: 'Months 5-8',
                  leadershipStyle: 'Distributed leadership empowering community ownership',
                  situationHandled: 'Scaling platform to multiple neighborhoods while maintaining local control',
                  keyDecision: 'Created training systems for community leaders rather than centralizing control',
                  outcome: '4 communities successfully running independent programs with 94% retention',
                  skillsDeveloped: ['Systems thinking', 'Sustainable scaling', 'Knowledge transfer']
                },
                {
                  phase: 'Strategic Advisor',
                  timeframe: 'Months 9-12',
                  leadershipStyle: 'Behind-the-scenes guidance supporting community-led initiatives',
                  situationHandled: 'Transitioning from active leadership to supportive advisory role',
                  keyDecision: 'Stepped back to let community leaders take ownership while remaining available for support',
                  outcome: 'Communities continue thriving with 96% satisfaction and expanding to new areas',
                  skillsDeveloped: ['Leadership transition', 'Legacy building', 'Sustainable impact creation']
                }
              ]}
              teamFormation={{
                challenge: 'Building diverse coalition including tech-skeptical elders, enthusiastic young families, and institutional partners',
                teamBuilding: 'Created structured dialogue sessions where every voice was heard and valued, established rotating leadership roles',
                conflictResolution: 'Developed framework for addressing disagreements through data-driven discussion and consensus building',
                results: '15-member community leadership council with 94% retention rate and expanding influence',
                teamGrowth: ['Increased technical literacy', 'Enhanced communication skills', 'Stronger neighborhood bonds', 'Leadership capacity building']
              }}
              decisionFramework={[
                {
                  principle: 'Community Ownership First',
                  application: 'All major decisions must enhance community control rather than centralize power',
                  example: 'Chose open-source technology and trained local leaders rather than maintaining proprietary control'
                },
                {
                  principle: 'Wisdom Before Innovation',
                  application: 'Understand existing community knowledge before introducing new solutions',
                  example: 'Spent 3 months learning traditional gardening methods before suggesting any technological improvements'
                },
                {
                  principle: 'Amplification Over Replacement',
                  application: 'Technology should enhance human connections, not substitute for them',
                  example: 'Platform encourages face-to-face meetings and in-person skill sharing rather than purely digital interaction'
                }
              ]}
              impactMetrics={{
                teamsLed: 4,
                peopleInfluenced: 500,
                initiativesLaunched: 12,
                conflictsResolved: 8
              }}
            />

            {/* Expert Analysis Section */}
            {insightDepth === 'expert' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ExpertAnalysisCard
                    title="Deep Psychology Analysis"
                    category="Behavioral Insights"
                    content={
                      <div className="space-y-4">
                        <p>Your behavioral psychology understanding reveals sophisticated grasp of intrinsic vs. extrinsic motivation. By gamifying community connection rather than individual achievement, you tapped into powerful social cohesion drives that sustain long-term engagement.</p>
                        <p>The decision to prioritize elder community members as "wisdom keepers" demonstrates advanced emotional intelligence - recognizing that technology adoption requires honoring existing social structures rather than disrupting them.</p>
                        <p>The 94% user satisfaction score indicates mastery of user psychology principles: progressive disclosure of complexity, social validation loops, and authentic relationship building through digital interfaces.</p>
                      </div>
                    }
                  />

                  <ExpertAnalysisCard
                    title="Advanced Stakeholder Mapping"
                    category="Political Strategy"
                    content={
                      <div className="space-y-4">
                        <p>Your stakeholder ecosystem reveals sophisticated political awareness. Successfully navigating relationships between community elders, tech-skeptical residents, local government officials, and enthusiastic early adopters required advanced diplomacy skills.</p>
                        <p>Securing support from both the neighborhood association president (traditional power structure) and the community college urban planning department (academic legitimacy) shows strategic relationship building across generational and institutional lines.</p>
                        <p>Your approach to power dynamics - positioning yourself as facilitator rather than leader - demonstrates understanding that sustainable community change requires distributed ownership rather than centralized control.</p>
                      </div>
                    }
                  />
                </div>

                <ExpertAnalysisCard
                  title="Systems Thinking Deep Dive"
                  category="Advanced Analysis"
                  content={
                    <div className="space-y-4">
                      <p>Your root cause analysis went beyond surface-level food access issues to identify underlying social isolation as the core problem. This systems thinking approach - recognizing that food insecurity is often a symptom of community disconnection - shows sophisticated analytical capabilities.</p>
                      <p>The feedback loops you created are particularly elegant: successful gardens → increased social connection → more community knowledge sharing → better gardens → stronger relationships. This positive reinforcement cycle demonstrates understanding of sustainable system design.</p>
                      <p>Your anticipation of unintended consequences was remarkable - proactively addressing potential gentrification effects by ensuring community ownership of the platform and data, showing awareness of how tech can inadvertently displace communities it aims to help.</p>
                      <p>Most sophisticated was your optimization of information flow patterns: creating multi-directional knowledge exchange rather than top-down expert guidance, allowing community wisdom to emerge organically while maintaining quality standards.</p>
                    </div>
                  }
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ExpertAnalysisCard
                    title="Failure Analysis & Recovery"
                    category="Learning Agility"
                    content={
                      <div className="space-y-4">
                        <p>Your initial failures were sophisticated experiments in disguise. The three failed community outreach attempts systematically tested different approaches to technology adoption, yielding valuable data about community priorities and trust-building processes.</p>
                        <p>The pivot from "tech-first" to "relationship-first" approach demonstrates advanced learning agility. Most developers would have doubled down on technical features; instead, you recognized that adoption barriers were social, not technological.</p>
                        <p>This pattern of "failing forward" demonstrates anti-fragility: becoming stronger through adversity rather than just resilient to it.</p>
                      </div>
                    }
                  />

                  <ExpertAnalysisCard
                    title="Competitive Landscape Analysis"
                    category="Strategic Positioning"
                    content={
                      <div className="space-y-4">
                        <p>Unlike existing gardening apps focused on individual plant tracking, your community-centered approach addresses the gap between individual knowledge and collective wisdom. This positioning differentiates you from both commercial gardening platforms and traditional community organizing tools.</p>
                        <p>Your unique value proposition combines technical sophistication with cultural humility - rare in the "tech for social good" space, where products typically prioritize scalability over community ownership.</p>
                        <p>The defensibility of your approach lies not in proprietary technology but in community relationships and trust - creating network effects that competitors cannot easily replicate without years of authentic community engagement.</p>
                      </div>
                    }
                  />
                </div>

                <ExpertAnalysisCard
                  title="Cultural Impact Assessment"
                  category="Anthropological Analysis"
                  content={
                    <div className="space-y-4">
                      <p>Your project achieved remarkable cultural preservation while enabling innovation. By positioning technology as amplification rather than replacement, you created space for traditional knowledge to flourish alongside modern tools.</p>
                      <p>The intergenerational knowledge transfer your platform facilitated represents a sophisticated solution to cultural continuity challenges facing many communities. Elder gardeners report feeling valued and heard, while younger participants gain access to traditional wisdom they might otherwise never encounter.</p>
                      <p>The behavioral changes in your community extend beyond gardening: participating families report 67% increase in neighborhood social connections, suggesting your app catalyzed broader community cohesion beyond its direct functionality.</p>
                      <p>Most significantly, you've demonstrated that technology can be a tool for cultural healing rather than disruption - a model that could transform how we approach community-centered innovation across diverse cultural contexts.</p>
                    </div>
                  }
                />
              </div>
            )}
          </TabsContent>

          {/* Enhanced Skills Deep Dive Tab */}
          <TabsContent value="skills" className="space-y-8">
            <SkillsDashboard />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <TechnicalSkillsShowcase />
              <LeadershipSkillsJourney />
            </div>
            
            <SoftSkillsEvidence />
            
            <SkillsExpertAnalysis />
          </TabsContent>

          {/* Enhanced Essay Goldmine Tab */}
          <TabsContent value="essays" className="space-y-8">
            <ApplicationStrategyDashboard />
            <ApplicationDescriptionWorkshop />
            <NarrativeArchitectureBuilder />
            <StrategicWritingEnhancement />
            <PortfolioCoherenceStrategist />
            <ExpertApplicationIntelligence />
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
                  <>
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Crown className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-600">Advanced Career Scenario Planning</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Multiple pathway analysis reveals sophisticated career strategic thinking: your community technology experience creates unique positioning for emerging roles in civic technology, social entrepreneurship, and human-computer interaction research.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Contingency planning advantages: if traditional tech careers become oversaturated, your community organizing experience positions you for policy roles, nonprofit leadership, or social enterprise development - creating career resilience through skill diversification.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Pivot strategy development: your bridge-building skills between technical and social domains create opportunities in emerging fields like digital equity policy, participatory design research, or community-centered AI development.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Risk mitigation through portfolio approach: combining technical depth with community credibility creates multiple career entry points rather than single-track dependency on one industry or role type.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Long-term adaptability positioning: as technology increasingly requires social and ethical considerations, your integrated skillset becomes more valuable over time rather than less relevant.
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-600">Market Trend Analysis</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Industry evolution predictions: the growing emphasis on ESG (Environmental, Social, Governance) metrics in tech companies creates increasing demand for professionals who can navigate both technical excellence and social impact measurement.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Emerging field identification: civic technology, community-centered AI, digital equity policy, and participatory design research are rapidly growing fields where your unique combination of skills provides competitive advantage.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Skill demand forecasting: as AI automates routine coding tasks, the premium on skills like community engagement, cultural translation, and ethical technology development increases - areas where you have documented expertise.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Market positioning advantages: few professionals combine deep technical skills with authentic community organizing experience - this rarity creates premium value in mission-driven organizations and socially conscious enterprises.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Technology trend integration: as platforms become more community-focused and user ownership increases (Web3, cooperative platforms), your experience building community-owned technology systems provides relevant expertise for emerging business models.
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Network className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-600">Network Effects & Relationship Capital</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Strategic relationship building foundation: your authentic community relationships create unusual professional network spanning grassroots organizers, local government officials, urban planners, and technology professionals.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Mentorship pathway development: your experience as both technology learner and community teacher positions you uniquely to connect diverse mentor types - technical experts, social entrepreneurs, policy makers, and community leaders.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Professional network evolution: as your community partners advance in their careers (local government, nonprofit leadership, academic positions), your relationship capital compounds across multiple sectors simultaneously.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Cross-sector bridge value: your ability to translate between technical and community contexts makes you valuable connector for others, creating reciprocal relationship building opportunities.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Network sustainability through value creation: rather than transactional networking, your approach of building systems that serve others creates lasting relationship foundation based on mutual benefit and shared values.
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-orange-600">Expert-Level Synergistic Connections</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Project compounding effects: your community garden platform creates foundation for related initiatives - digital literacy programs, civic engagement apps, neighborhood economic development tools - each building on established trust and technical infrastructure.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Cross-pollination opportunity identification: techniques developed for garden community engagement transfer to other domains - elderly care coordination, youth development programs, small business networks - multiplying impact potential.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Portfolio effect maximization: rather than pursuing separate projects, build connected ecosystem where each initiative strengthens others through shared community relationships, technical infrastructure, and trust capital.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Innovation pipeline development: your community relationships create natural feedback mechanism for identifying next-generation opportunities before they become obvious to outsiders or competitors.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Systematic impact scaling: by creating replicable models rather than one-off solutions, your work generates compounding returns as other communities adapt and improve upon your frameworks.
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="h-5 w-5 text-cyan-600" />
                        <h4 className="font-semibold text-cyan-600">Advanced Academic Strategy</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Graduate school positioning advantages: your community technology experience provides unique research opportunities in human-computer interaction, digital equity, participatory design, or technology policy programs.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Research opportunity identification: existing community relationships create natural laboratory for continuing research in community technology adoption, digital divide issues, or civic engagement platforms.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Academic network building strategy: your work connects to multiple academic disciplines - computer science, urban planning, public policy, sociology - creating interdisciplinary collaboration opportunities.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Research sustainability through community partnerships: unlike theoretical academic projects, your community-grounded work provides ongoing research opportunities with built-in implementation pathways and impact measurement.
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Rocket className="h-5 w-5 text-pink-600" />
                        <h4 className="font-semibold text-pink-600">Innovation Pipeline Development</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Next-generation project identification: your community relationships create early-warning system for emerging needs - digital literacy gaps, civic engagement challenges, economic development opportunities.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Technology trend integration opportunities: as new technologies emerge (AI, blockchain, IoT), your community context provides grounding for practical applications rather than theoretical implementations.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Market gap identification through community insight: your grassroots perspective reveals unserved needs that typical market research misses, creating innovation opportunities with built-in validation and implementation pathways.
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-600">Legacy & Long-term Impact Planning</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Ten-year vision development: your community ownership transfer model creates template for sustainable technology initiatives that continue growing impact even after your direct involvement ends.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Sustainable impact creation framework: by teaching others to replicate your model, you create exponential rather than linear impact growth - each community becomes training ground for the next.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Knowledge transfer planning excellence: your documentation and training systems enable community ownership transition while preserving institutional knowledge, creating model for sustainable technology transfer in underserved communities.
                      </p>
                    </div>
                  </>
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
