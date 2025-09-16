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
  Map
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
  Cell
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
          emotionalResonance: "High - bridges technology and humanity",
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
          emotionalResonance: "Very High - immediate stakes, personal growth",
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
                    <CardTitle className="text-lg text-foreground">{title}</CardTitle>
                    <CardDescription className="text-foreground/80 text-sm mt-1">
                      {summary}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {score && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      {score}/100
                    </Badge>
                  )}
                  {badge && (
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      {badge}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-foreground/60" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-foreground/60" />
                  )}
                </div>
              </div>
            </CardHeader>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t border-border/50 pt-4">
              {children}
            </div>
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
  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
    <div className="flex items-start justify-between mb-3">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <Badge className="bg-primary/20 text-primary border-primary/30">
        {uniqueness}% unique
      </Badge>
    </div>
    <p className="text-foreground/90 text-sm mb-3 leading-relaxed">"{content}"</p>
    <div className="flex flex-wrap gap-2 mb-2">
      {tags.map((tag, i) => (
        <Badge key={i} variant="outline" className="text-xs border-primary/30 text-foreground/80">
          {tag}
        </Badge>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      <span className="font-medium">Essay fit:</span> {essayPotential}
    </p>
  </div>
);

// Enhanced Project Card with Deep Analysis
const ProjectCard: React.FC<{ project: any; onBack: () => void }> = ({ project, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-accent/3">
    {/* Header with Navigation */}
    <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-foreground hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <p className="text-foreground/70">{project.category} • {project.projectPhase}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Export Analysis
            </Button>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
              <FileEdit className="h-4 w-4 mr-2" />
              Generate Essays
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-6 py-8">
      <Tabs defaultValue="impact" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full bg-card/70 backdrop-blur-sm">
          <TabsTrigger value="impact" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Impact Analysis
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Skills Deep Dive
          </TabsTrigger>
          <TabsTrigger value="essays" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Essay Goldmine
          </TabsTrigger>
          <TabsTrigger value="future" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Future Trajectory
          </TabsTrigger>
        </TabsList>

        {/* Impact Analysis Tab */}
        <TabsContent value="impact" className="space-y-6">
          <InsightCard
            title="Project Genesis & Evolution"
            summary={project.impactAnalysis.summary}
            icon={<Rocket />}
            score={project.quickMetrics.impactScore}
            variant="premium"
          >
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Origin Story
                </h4>
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-foreground/90 leading-relaxed mb-3">
                    <strong>Trigger:</strong> {project.impactAnalysis.deepDive.genesis.trigger}
                  </p>
                  <p className="text-foreground/90 leading-relaxed mb-3">
                    <strong>Personal Connection:</strong> {project.impactAnalysis.deepDive.genesis.personalConnection}
                  </p>
                  <p className="text-foreground/90 leading-relaxed">
                    <strong>Initial Struggles:</strong> {project.impactAnalysis.deepDive.genesis.initialFailures}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Breakthrough Moments
                </h4>
                <div className="space-y-4">
                  {project.impactAnalysis.deepDive.breakthroughMoments.map((moment: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg bg-card/50 border border-primary/20">
                      <h5 className="font-medium text-foreground mb-2">{moment.moment}</h5>
                      <div className="space-y-2 text-sm">
                        <p className="text-foreground/80"><strong>Significance:</strong> {moment.significance}</p>
                        <p className="text-foreground/80"><strong>Character Growth:</strong> {moment.characterGrowth}</p>
                        <div className="p-3 bg-gradient-to-r from-accent/20 to-primary/20 rounded-md border border-primary/20">
                          <p className="font-medium text-primary">Essay Gold:</p>
                          <p className="italic text-foreground/90">"{moment.essayGold}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </InsightCard>
        </TabsContent>

        {/* Skills Deep Dive Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="space-y-6">
            {project.skillsAnalysis.technicalSkills.map((skill: any, i: number) => (
              <InsightCard
                key={i}
                title={skill.skill}
                summary="Detailed progression and transferable value analysis"
                icon={<Code />}
                variant="default"
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Development Journey</h4>
                    <div className="space-y-3">
                      {Object.entries(skill.progressionStory).map(([phase, description]: [string, any]) => (
                        <div key={phase} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground capitalize">{phase}:</p>
                            <p className="text-foreground/80 text-sm">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Transferable Value</h4>
                    <div className="grid gap-3">
                      {Object.entries(skill.transferableValue).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-3 bg-card/30 rounded-lg border border-border/30">
                          <p className="font-medium text-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </p>
                          <p className="text-foreground/80 text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {skill.evidenceOfExcellence && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Evidence of Excellence</h4>
                      <ul className="space-y-2">
                        {skill.evidenceOfExcellence.map((evidence: string, j: number) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-foreground/80 text-sm">{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </InsightCard>
            ))}
          </div>
        </TabsContent>

        {/* Essay Goldmine Tab */}
        <TabsContent value="essays" className="space-y-6">
          <InsightCard
            title="Powerful Opening Hooks"
            summary="Attention-grabbing essay openers with high uniqueness ratings"
            icon={<Gem />}
            variant="premium"
            badge="Essay Ready"
          >
            <div className="space-y-4">
              {project.essayGoldmine.powerfulOpeningHooks.map((hook: any, i: number) => (
                <StoryFragment
                  key={i}
                  title={`Hook ${i + 1}: ${hook.essayPrompt}`}
                  content={hook.hook}
                  tags={[hook.emotionalResonance + " Resonance", `${hook.uniquenessScore}% Unique`]}
                  essayPotential={hook.essayPrompt}
                  uniqueness={hook.uniquenessScore}
                />
              ))}
            </div>
          </InsightCard>

          <InsightCard
            title="Character Development Arcs"
            summary="Complete narrative progressions showing personal growth"
            icon={<Map />}
            variant="premium"
          >
            <div className="space-y-6">
              {project.essayGoldmine.characterDevelopmentArcs.map((arc: any, i: number) => (
                <div key={i} className="p-4 rounded-lg bg-card/30 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    {arc.theme}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Progression:</h5>
                      <ol className="space-y-2">
                        {arc.progression.map((step: string, j: number) => (
                          <li key={j} className="text-sm text-foreground/80 flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {j + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="font-medium text-foreground text-sm">Character Strengths:</span>
                      {arc.characterStrengths.map((strength: string, j: number) => (
                        <Badge key={j} variant="outline" className="text-xs border-success/50 text-success">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="font-medium text-foreground text-sm">Essay Applications:</span>
                      {arc.essayApplications.map((app: string, j: number) => (
                        <Badge key={j} className="text-xs bg-primary/20 text-primary border-primary/30">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InsightCard>

          <InsightCard
            title="Specific Story Moments"
            summary="Detailed narratives ready for essay development"
            icon={<Quote />}
            variant="critical"
          >
            <div className="space-y-4">
              {project.essayGoldmine.specificStoryMoments.map((story: any, i: number) => (
                <div key={i} className="p-4 rounded-lg bg-gradient-to-br from-destructive/5 to-warning/5 border border-destructive/20">
                  <h4 className="font-semibold text-foreground mb-3">{story.storyTitle}</h4>
                  <div className="grid gap-3 text-sm">
                    <p className="text-foreground/80"><strong>Setup:</strong> {story.setup}</p>
                    <p className="text-foreground/80"><strong>Conflict:</strong> {story.conflict}</p>
                    <p className="text-foreground/80"><strong>My Role:</strong> {story.myRole}</p>
                    <p className="text-foreground/80"><strong>Resolution:</strong> {story.resolution}</p>
                    <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                      <p className="font-medium text-primary">Deeper Meaning:</p>
                      <p className="italic text-foreground/90">{story.deeperMeaning}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-success/20 text-success text-xs border-success/30">
                        {story.essayPotential}
                      </Badge>
                      {story.characterQualities.map((quality: string, j: number) => (
                        <Badge key={j} variant="outline" className="text-xs border-primary/50 text-foreground/80">
                          {quality}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InsightCard>
        </TabsContent>

        {/* Future Trajectory Tab */}
        <TabsContent value="future" className="space-y-6">
          <InsightCard
            title="Career Trajectory Predictions"
            summary="AI-powered analysis of most likely career paths based on demonstrated interests and skills"
            icon={<Compass />}
            score={87}
            variant="premium"
          >
            <div className="space-y-4">
              {project.futureAnalysis.careerTrajectoryPredictions.map((path: any, i: number) => (
                <div key={i} className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{path.path}</h4>
                    <Badge className="bg-success/20 text-success border-success/30">
                      {path.probability}% probability
                    </Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground mb-1">Evidence:</p>
                      <ul className="space-y-1">
                        {path.evidence.map((evidence: string, j: number) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                            <span className="text-foreground/80">{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Recommended Next Steps:</p>
                      <ul className="space-y-1">
                        {path.recommendedSteps.map((step: string, j: number) => (
                          <li key={j} className="flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                            <span className="text-foreground/80">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InsightCard>

          <InsightCard
            title="Admissions Competitive Positioning"
            summary="Analysis of how this project positions you in the admissions landscape"
            icon={<Trophy />}
            variant="critical"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Competitive Advantages</h4>
                <div className="space-y-3">
                  {project.futureAnalysis.admissionsPositioning.competitiveAdvantages.map((advantage: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <h5 className="font-medium text-success mb-1">{advantage.advantage}</h5>
                      <p className="text-sm text-foreground/80 mb-2">
                        <strong>Rarity:</strong> {advantage.rarity}
                      </p>
                      <p className="text-sm text-foreground/80 mb-2">
                        <strong>Strength:</strong> {advantage.strength}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs font-medium text-foreground">Best School Fits:</span>
                        {advantage.schoolFit.map((school: string, j: number) => (
                          <Badge key={j} variant="outline" className="text-xs border-success/50 text-success">
                            {school}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {project.futureAnalysis.admissionsPositioning.potentialConcerns && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Potential Concerns & Mitigations</h4>
                  <div className="space-y-3">
                    {project.futureAnalysis.admissionsPositioning.potentialConcerns.map((concern: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                        <h5 className="font-medium text-warning mb-1">{concern.concern}</h5>
                        <p className="text-sm text-foreground/80 mb-2">{concern.explanation}</p>
                        <p className="text-sm text-foreground/80 mb-1">
                          <strong>Mitigation:</strong> {concern.mitigation}
                        </p>
                        <p className="text-sm text-foreground/80">
                          <strong>Recommendation:</strong> {concern.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InsightCard>
        </TabsContent>
      </Tabs>
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
                <div className="p-2 rounded-lg bg-secondary/20">
                  <GraduationCap className="h-5 w-5 text-secondary" />
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
                <div className="p-2 rounded-lg bg-warning/20">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{portfolioSummary.verifiedProjects}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Skills Progression Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Skills Development Timeline
              </CardTitle>
              <CardDescription>
                Progression across all technical and leadership skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: "Jan", technical: 65, leadership: 70, impact: 60 },
                    { month: "Feb", technical: 72, leadership: 75, impact: 68 },
                    { month: "Mar", technical: 78, leadership: 80, impact: 75 },
                    { month: "Apr", technical: 85, leadership: 85, impact: 82 },
                    { month: "May", technical: 90, leadership: 88, impact: 88 },
                    { month: "Jun", technical: 95, leadership: 92, impact: 94 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="technical" stroke="hsl(var(--primary))" strokeWidth={3} name="Technical Skills" />
                    <Line type="monotone" dataKey="leadership" stroke="hsl(var(--accent))" strokeWidth={3} name="Leadership" />
                    <Line type="monotone" dataKey="impact" stroke="hsl(var(--success))" strokeWidth={3} name="Impact Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Strength Radar */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Portfolio Strength Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive evaluation across all dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { subject: 'Technical Skills', A: 90, B: 85 },
                    { subject: 'Leadership', A: 88, B: 82 },
                    { subject: 'Impact', A: 95, B: 78 },
                    { subject: 'Innovation', A: 92, B: 80 },
                    { subject: 'Communication', A: 85, B: 75 },
                    { subject: 'Uniqueness', A: 89, B: 70 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" className="text-muted-foreground text-sm" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-muted-foreground" />
                    <Radar name="Your Portfolio" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Avg Applicant" dataKey="B" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Essay Potential & Competitive Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Essay Topic Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Essay Topic Strength
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { topic: "Personal Growth", score: 96, essays: 12 },
                  { topic: "Leadership", score: 88, essays: 8 },
                  { topic: "Innovation", score: 92, essays: 6 },
                  { topic: "Community Impact", score: 94, essays: 10 },
                  { topic: "Overcoming Challenges", score: 85, essays: 5 }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{item.topic}</span>
                      <span className="text-muted-foreground">{item.score}/100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.score} className="flex-1" />
                      <Badge variant="outline" className="text-xs">{item.essays} stories</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitive Positioning */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Competitive Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-success/20 to-primary/20 rounded-lg border border-success/30">
                  <p className="text-2xl font-bold text-foreground">Top 5%</p>
                  <p className="text-sm text-muted-foreground">Among similar applicants</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Technical Depth</span>
                    <Badge className="bg-success/20 text-success">Exceptional</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Social Impact</span>
                    <Badge className="bg-success/20 text-success">Outstanding</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Leadership Style</span>
                    <Badge className="bg-primary/20 text-primary">Unique</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Story Authenticity</span>
                    <Badge className="bg-success/20 text-success">Verified</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "Quantify community garden impact metrics", priority: "High", color: "destructive" },
                  { action: "Document peer support program outcomes", priority: "High", color: "destructive" },
                  { action: "Create technical portfolio showcase", priority: "Medium", color: "warning" },
                  { action: "Draft leadership philosophy essay", priority: "Medium", color: "warning" },
                  { action: "Prepare interview stories", priority: "Low", color: "muted" }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card/50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground flex-1">{item.action}</p>
                      <Badge variant={item.color === "destructive" ? "destructive" : item.color === "warning" ? "secondary" : "outline"} className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {portfolioData.map((project) => (
            <Card 
              key={project.id} 
              className="bg-card/70 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
              onClick={() => handleProjectSelect(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-foreground mb-2">{project.title}</CardTitle>
                    <CardDescription className="text-foreground/70">
                      {project.category} • {project.type}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.verified && (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      {project.projectPhase}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5">
                    <p className="text-lg font-bold text-foreground">{project.quickMetrics.impactScore}</p>
                    <p className="text-xs text-foreground/70">Impact</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-success/5 to-primary/5">
                    <p className="text-lg font-bold text-foreground">{project.quickMetrics.skillDevelopment}</p>
                    <p className="text-xs text-foreground/70">Skills</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-accent/5 to-secondary/5">
                    <p className="text-lg font-bold text-foreground">{project.quickMetrics.storyPotential}</p>
                    <p className="text-xs text-foreground/70">Story</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-secondary/5 to-accent/5">
                    <p className="text-lg font-bold text-foreground">{project.quickMetrics.admissionsValue}</p>
                    <p className="text-xs text-foreground/70">Admissions</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-warning/5 to-success/5">
                    <p className="text-lg font-bold text-foreground">{project.quickMetrics.uniqueness}</p>
                    <p className="text-xs text-foreground/70">Unique</p>
                  </div>
                  <div className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                </div>

                {/* Quick Preview */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {project.impactAnalysis.summary}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={(e) => { e.stopPropagation(); handleProjectSelect(project); }}
                  >
                    <Microscope className="h-4 w-4 mr-2" />
                    Deep Analysis
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    Essays
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-foreground/70 hover:text-primary hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Panel */}
        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Take Action?</h3>
              <p className="text-foreground/70">
                Transform your portfolio insights into compelling application materials
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <FileText className="h-4 w-4 mr-2" />
                Generate Essay Drafts
              </Button>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <MessageCircle className="h-4 w-4 mr-2" />
                Interview Prep
              </Button>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Export Portfolio Summary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioMetricsDashboard;