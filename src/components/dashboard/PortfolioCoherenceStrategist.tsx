import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, 
  GitMerge, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  BookOpen,
  MessageSquare,
  School,
  Target
} from 'lucide-react';

interface PortfolioCoherenceStrategistProps {
  projectData?: any;
  enabledTabs?: Array<'coordination'|'repetition'|'committee'|'customization'>;
}

// Hard-coded mock data - represents comprehensive application orchestration
const mockCoherenceData = {
  multiPlatformStrategy: {
    commonApp: {
      activities: [
        {
          category: "Community Service/Volunteering",
          description: "Founded GrowTogether: bilingual platform connecting 200+ families across 12 gardens, reducing food waste 40% through automated resource sharing.",
          usage: "Primary project showcase with quantified impact",
          projectElements: ["Platform scale", "Bilingual focus", "Waste reduction outcome"]
        },
        {
          category: "Student Government/Politics", 
          description: "Designed peer mentorship framework adopted by 3 schools, training 45 counselors who supported 180+ peers district-wide.",
          usage: "Secondary project showing systematic impact",
          projectElements: ["Framework design", "Scale adoption", "Training leadership"]
        }
      ],
      essays: [
        {
          prompt: "Personal Statement",
          strategy: "Lead narrative with community garden transformation story",
          projectElements: ["Cultural bridge-building", "Technical evolution", "Wisdom preservation theme"]
        },
        {
          prompt: "Additional Information",
          strategy: "Highlight bilingual technical mentorship unique positioning",
          projectElements: ["Language barriers overcome", "Cross-cultural teaching methods"]
        }
      ]
    },
    ucApplication: {
      academicInterest: {
        prompt: "Academic Interest",
        strategy: "Environmental informatics focus using agriculture-tech intersection",
        projectElements: ["CS environmental applications", "Data science for sustainability", "Food security research interest"],
        wordCount: 350
      },
      leadershipExperience: {
        prompt: "Leadership Experience", 
        strategy: "Inclusive leadership model development through diverse team coordination",
        projectElements: ["Bilingual team recruitment", "Cultural competence training", "Conflict resolution examples"],
        wordCount: 350
      }
    },
    supplementalEssays: [
      {
        school: "MIT",
        prompt: "Why This Major?",
        angle: "Agricultural technology research alignment with D-Lab community focus",
        projectConnection: "Direct experience with technology serving underresved communities"
      },
      {
        school: "Stanford",
        prompt: "What Matters to You?", 
        angle: "Technology as cultural bridge-building tool",
        projectConnection: "Generational wisdom preservation through modern platforms"
      }
    ]
  },
  repetitionAvoidance: {
    overallScore: 94,
    strategicUse: [
      {
        element: "200+ families served",
        commonAppUsage: "Activity description for scale demonstration",
        ucUsage: "Leadership essay for management scope",
        supplementalUsage: "Not used - avoid over-quantification"
      },
      {
        element: "Bilingual platform design",
        commonAppUsage: "Activity description for uniqueness",
        ucUsage: "Academic interest for inclusive CS approach", 
        supplementalUsage: "Diversity essay for cultural competence"
      },
      {
        element: "Elderly immigrant mentorship",
        commonAppUsage: "Personal statement for wisdom theme",
        ucUsage: "Not used - reserve for interview stories",
        supplementalUsage: "School-specific cultural values alignment"
      }
    ],
    riskAreas: [
      {
        risk: "Over-emphasizing quantified outcomes",
        mitigation: "Rotate between numbers, stories, and reflections across essays"
      },
      {
        risk: "Repeating community service theme",
        mitigation: "Frame as leadership, academic interest, and cultural identity respectively"
      }
    ]
  },
  admissionsCommitteeView: {
    coherenceScore: 91,
    readerExperience: {
      activities: "Sees consistent community-tech focus with clear progression",
      essays: "Experiences authentic voice with varied but connected perspectives", 
      interviews: "Prepared with fresh examples that reinforce application themes"
    },
    differentiationFactors: [
      "Agricultural technology niche creates memorable positioning",
      "Bilingual technical mentorship offers rare demographic value",
      "Community ownership model demonstrates systems thinking maturity"
    ],
    potentialConcerns: [
      {
        concern: "Too narrow focus on single project",
        response: "Frame project as representative of broader approach to technology and community"
      },
      {
        concern: "Limited academic research connection",
        response: "Strengthen environmental informatics and food security research interest"
      }
    ]
  },
  schoolSpecificCustomization: [
    {
      school: "MIT", 
      values: ["Mens et manus", "Problem-solving", "Innovation with impact"],
      projectAlignment: {
        "Mens et manus": "Hands-on community technology work",
        "Problem-solving": "Systematic approach to food waste and community connection",
        "Innovation with impact": "Measurable outcomes for underserved populations"
      },
      positioningStrategy: "Engineer-activist using technology for social equity"
    },
    {
      school: "Stanford",
      values: ["Human-centered design", "Entrepreneurship", "Global impact"],
      projectAlignment: {
        "Human-centered design": "Community-first app development methodology",
        "Entrepreneurship": "Scalable platform with ownership transfer model", 
        "Global impact": "Bilingual approach addressing immigrant community needs"
      },
      positioningStrategy: "Social entrepreneur bridging technology and cultural preservation"
    },
    {
      school: "UC Berkeley",
      values: ["Public service", "Diversity", "Social justice"],
      projectAlignment: {
        "Public service": "Community resource sharing and food security focus",
        "Diversity": "Bilingual platform serving immigrant populations",
        "Social justice": "Addressing systemic food access barriers"
      },
      positioningStrategy: "Public interest technologist addressing equity through innovation"
    }
  ]
};

const PortfolioCoherenceStrategist: React.FC<PortfolioCoherenceStrategistProps> = ({ 
  projectData, 
  enabledTabs = ['coordination', 'repetition', 'committee', 'customization'] 
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState("commonapp");
  const [selectedSchool, setSelectedSchool] = useState(0);

  const tabConfig = {
    coordination: { value: 'coordination', icon: Layers, label: 'Multi-Platform' },
    repetition: { value: 'repetition', icon: GitMerge, label: 'Avoid Repetition' },
    committee: { value: 'committee', icon: Eye, label: 'Reader View' },
    customization: { value: 'customization', icon: School, label: 'School-Specific' }
  };

  const defaultValue = enabledTabs[0] || 'coordination';
  const shouldShowTabsList = enabledTabs.length > 1;

  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultValue} className="w-full">
        {shouldShowTabsList && (
          <TabsList className={`grid w-full grid-cols-${enabledTabs.length}`}>
            {enabledTabs.map(tab => {
              const config = tabConfig[tab];
              const IconComponent = config.icon;
              return (
                <TabsTrigger key={tab} value={config.value} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        {enabledTabs.includes('coordination') && (
          <TabsContent value="coordination" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Layers className="h-5 w-5" />
                </div>
                Multi-Platform Coordination
              </CardTitle>
              <CardDescription>
                Strategic use of project elements across different application components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3 mb-6">
                <Button
                  variant={selectedPlatform === "commonapp" ? "default" : "outline"}
                  onClick={() => setSelectedPlatform("commonapp")}
                  className={selectedPlatform === "commonapp" ? "bg-gradient-primary text-white" : ""}
                >
                  Common Application
                </Button>
                <Button
                  variant={selectedPlatform === "uc" ? "default" : "outline"}
                  onClick={() => setSelectedPlatform("uc")}
                  className={selectedPlatform === "uc" ? "bg-gradient-primary text-white" : ""}
                >
                  UC Application
                </Button>
                <Button
                  variant={selectedPlatform === "supplemental" ? "default" : "outline"}
                  onClick={() => setSelectedPlatform("supplemental")}
                  className={selectedPlatform === "supplemental" ? "bg-gradient-primary text-white" : ""}
                >
                  Supplemental Essays
                </Button>
              </div>

              {selectedPlatform === "commonapp" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-primary mb-4">Activity Descriptions</h4>
                    <div className="space-y-4">
                      {mockCoherenceData.multiPlatformStrategy.commonApp.activities.map((activity, index) => (
                        <div key={index} className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                          <div className="flex justify-between items-start mb-3">
                            <Badge className="bg-gradient-primary text-white">
                              {activity.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">150 char limit</span>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-2">"{activity.description}"</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs font-medium text-accent">Strategic Usage:</span>
                              <p className="text-xs text-foreground/80">{activity.usage}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-success">Project Elements:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {activity.projectElements.map((element, elemIndex) => (
                                  <Badge key={elemIndex} variant="outline" className="text-xs border-success/50 text-success">
                                    {element}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary mb-4">Essay Strategy</h4>
                    <div className="space-y-4">
                      {mockCoherenceData.multiPlatformStrategy.commonApp.essays.map((essay, index) => (
                        <div key={index} className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                          <h5 className="font-medium text-accent mb-2">{essay.prompt}</h5>
                          <p className="text-sm text-foreground/80 mb-3">{essay.strategy}</p>
                          <div className="flex flex-wrap gap-1">
                            {essay.projectElements.map((element, elemIndex) => (
                              <Badge key={elemIndex} variant="outline" className="text-xs border-accent/50 text-accent">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedPlatform === "uc" && (
                <div className="space-y-4">
                  {Object.entries(mockCoherenceData.multiPlatformStrategy.ucApplication).map(([key, essay]) => (
                    <div key={key} className="p-4 rounded-lg bg-success/10 border border-success/30">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-success">{(essay as any).prompt}</h5>
                        <span className="text-xs text-muted-foreground">{(essay as any).wordCount} words</span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-3">{(essay as any).strategy}</p>
                      <div className="flex flex-wrap gap-1">
                        {(essay as any).projectElements.map((element: string, elemIndex: number) => (
                          <Badge key={elemIndex} variant="outline" className="text-xs border-success/50 text-success">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPlatform === "supplemental" && (
                <div className="space-y-4">
                  {mockCoherenceData.multiPlatformStrategy.supplementalEssays.map((essay, index) => (
                    <div key={index} className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-gradient-primary text-white">
                          {essay.school}
                        </Badge>
                        <span className="font-medium text-primary">{essay.prompt}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-accent">Unique Angle:</span>
                          <p className="text-sm text-foreground/80">{essay.angle}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-success">Project Connection:</span>
                          <p className="text-sm text-foreground/80">{essay.projectConnection}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {enabledTabs.includes('repetition') && (
          <TabsContent value="repetition" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <GitMerge className="h-5 w-5" />
                </div>
                Repetition Avoidance System
              </CardTitle>
              <CardDescription>
                Strategic deployment of project elements to maximize impact without redundancy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="text-3xl font-bold text-success">
                    {mockCoherenceData.repetitionAvoidance.overallScore}%
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-success">Repetition Avoidance</div>
                    <div className="text-sm text-muted-foreground">Excellent strategic variety</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Strategic Element Deployment</h4>
                {mockCoherenceData.repetitionAvoidance.strategicUse.map((usage, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30">
                    <h5 className="font-medium text-accent mb-3">"{usage.element}"</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                        <span className="text-xs font-medium text-primary">Common App:</span>
                        <p className="text-xs text-foreground/80 mt-1">{usage.commonAppUsage}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                        <span className="text-xs font-medium text-success">UC Application:</span>
                        <p className="text-xs text-foreground/80 mt-1">{usage.ucUsage}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                        <span className="text-xs font-medium text-accent">Supplemental:</span>
                        <p className="text-xs text-foreground/80 mt-1">{usage.supplementalUsage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  Risk Mitigation
                </h4>
                {mockCoherenceData.repetitionAvoidance.riskAreas.map((risk, index) => (
                  <div key={index} className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <span className="font-medium text-accent">Risk: </span>
                        <span className="text-foreground/80">{risk.risk}</span>
                        <div className="mt-2">
                          <span className="font-medium text-success">Mitigation: </span>
                          <span className="text-foreground/80">{risk.mitigation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {enabledTabs.includes('committee') && (
          <TabsContent value="committee" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Eye className="h-5 w-5" />
                </div>
                Admissions Committee Perspective
              </CardTitle>
              <CardDescription>
                How your application reads from the admissions officer viewpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="text-3xl font-bold text-primary">
                    {mockCoherenceData.admissionsCommitteeView.coherenceScore}%
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-primary">Coherence Score</div>
                    <div className="text-sm text-muted-foreground">Exceptional consistency</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Reader Experience Journey
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-accent" />
                      <span className="font-medium text-accent">Activities Section</span>
                    </div>
                    <p className="text-sm text-foreground/80">{mockCoherenceData.admissionsCommitteeView.readerExperience.activities}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">Essays</span>
                    </div>
                    <p className="text-sm text-foreground/80">{mockCoherenceData.admissionsCommitteeView.readerExperience.essays}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">Interviews</span>
                    </div>
                    <p className="text-sm text-foreground/80">{mockCoherenceData.admissionsCommitteeView.readerExperience.interviews}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-success flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Differentiation Factors
                </h4>
                {mockCoherenceData.admissionsCommitteeView.differentiationFactors.map((factor, index) => (
                  <div key={index} className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    <p className="text-sm text-foreground/90">{factor}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-accent flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Potential Concerns & Responses
                </h4>
                {mockCoherenceData.admissionsCommitteeView.potentialConcerns.map((concern, index) => (
                  <div key={index} className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="mb-2">
                      <span className="font-medium text-accent">Concern: </span>
                      <span className="text-foreground/80">{concern.concern}</span>
                    </div>
                    <div>
                      <span className="font-medium text-success">Response Strategy: </span>
                      <span className="text-foreground/80">{concern.response}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {enabledTabs.includes('customization') && (
          <TabsContent value="customization" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <School className="h-5 w-5" />
                </div>
                School-Specific Customization
              </CardTitle>
              <CardDescription>
                Tailor project presentation for different college cultures and values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {mockCoherenceData.schoolSpecificCustomization.map((school, index) => (
                  <Button
                    key={index}
                    variant={selectedSchool === index ? "default" : "outline"}
                    onClick={() => setSelectedSchool(index)}
                    className={`p-3 h-auto flex flex-col items-center gap-1 ${
                      selectedSchool === index ? 'bg-gradient-primary text-white' : ''
                    }`}
                  >
                    <span className="font-semibold">{school.school}</span>
                    <span className="text-xs opacity-80">Positioning Strategy</span>
                  </Button>
                ))}
              </div>

              {mockCoherenceData.schoolSpecificCustomization[selectedSchool] && (
                <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                  <h4 className="font-semibold text-primary text-lg mb-4">
                    {mockCoherenceData.schoolSpecificCustomization[selectedSchool].school} Strategy
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-3">Core Values Alignment</h5>
                      <div className="space-y-3">
                        {Object.entries(mockCoherenceData.schoolSpecificCustomization[selectedSchool].projectAlignment).map(([value, alignment]) => (
                          <div key={value} className="p-3 rounded-lg bg-card/50 border border-border/30">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="border-primary/50 text-primary flex-shrink-0">
                                {value}
                              </Badge>
                              <p className="text-sm text-foreground/80">{alignment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                      <h5 className="font-medium text-success mb-2">Positioning Strategy</h5>
                      <p className="text-foreground/90 font-medium">
                        {mockCoherenceData.schoolSpecificCustomization[selectedSchool].positioningStrategy}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PortfolioCoherenceStrategist;