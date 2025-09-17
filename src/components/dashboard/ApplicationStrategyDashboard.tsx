import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  Lightbulb, 
  School, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Zap,
  Crown
} from 'lucide-react';

interface ApplicationStrategyDashboardProps {
  projectData?: any;
}

// Hard-coded mock data - represents project analysis data for application strategy
const mockStrategyData = {
  projectToApplicationMapping: [
    {
      projectElement: "Community Garden Tech Platform",
      applicationTargets: [
        { type: "Common App Activity", impact: 95, description: "Leadership/Community Service" },
        { type: "UC Description", impact: 88, description: "Academic Interest Area" }, 
        { type: "Personal Statement", impact: 92, description: "Main narrative thread" }
      ],
      competitiveAdvantage: "Tech + Agriculture intersection - rare combination"
    },
    {
      projectElement: "Peer Mentorship System Design", 
      applicationTargets: [
        { type: "Common App Activity", impact: 85, description: "Student Government/Advocacy" },
        { type: "Supplemental Essay", impact: 90, description: "Why This Major?" },
        { type: "Interview Talking Points", impact: 87, description: "Leadership examples" }
      ],
      competitiveAdvantage: "Systems thinking applied to social problems"
    }
  ],
  portfolioCoherence: {
    overallScore: 89,
    strengths: [
      "Consistent community-first approach across all projects",
      "Clear technical skill progression with real-world application",
      "Authentic growth narrative with measurable outcomes"
    ],
    improvementAreas: [
      "Could strengthen connection between academic interests and project work",
      "Opportunity to highlight international/multicultural perspectives"
    ]
  },
  competitivePositioning: {
    uniquenessScore: 92,
    differentiators: [
      "Agricultural technology focus (top 5% of applicants)",
      "Community ownership transfer model (unprecedented)",
      "Bilingual technical mentorship (valuable demographic)"
    ],
    comparisonToTypicalApplicant: {
      technicalSkills: 15, // +15% above average
      communityImpact: 28, // +28% above average  
      leadership: 22, // +22% above average
      authenticity: 35 // +35% above average
    }
  },
  schoolSpecificAlignment: [
    {
      school: "MIT",
      alignmentScore: 94,
      keyConnections: ["Mens et Manus philosophy", "D-Lab community focus", "Agricultural technology research"],
      recommendedPositioning: "Emphasize hands-on engineering with social impact"
    },
    {
      school: "Stanford", 
      alignmentScore: 91,
      keyConnections: ["Human-centered design", "d.school methodology", "Social innovation"],
      recommendedPositioning: "Highlight design thinking applied to community challenges"
    },
    {
      school: "UC Berkeley",
      alignmentScore: 88,
      keyConnections: ["Public service mission", "Diversity commitment", "Agricultural research"],
      recommendedPositioning: "Focus on public impact and cultural bridge-building"
    }
  ]
};

const ApplicationStrategyDashboard: React.FC<ApplicationStrategyDashboardProps> = ({ projectData }) => {
  const [selectedMapping, setSelectedMapping] = useState(0);
  const [selectedSchool, setSelectedSchool] = useState(0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mapping" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Project Mapping
          </TabsTrigger>
          <TabsTrigger value="coherence" className="flex items-center gap-2">  
            <CheckCircle className="h-4 w-4" />
            Portfolio Coherence
          </TabsTrigger>
          <TabsTrigger value="positioning" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />  
            Competitive Edge
          </TabsTrigger>
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School Alignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapping" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Target className="h-5 w-5" />
                </div>
                Project-to-Application Mapper
              </CardTitle>
              <CardDescription>
                Strategic connections between project elements and application components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockStrategyData.projectToApplicationMapping.map((mapping, index) => (
                <div key={index} className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  selectedMapping === index 
                    ? 'bg-primary/10 border-primary/30 shadow-soft' 
                    : 'bg-accent/5 border-accent/20 hover:border-accent/40'
                }`} onClick={() => setSelectedMapping(index)}>
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold text-primary">{mapping.projectElement}</h4>
                    <Badge className="bg-gradient-primary text-white">
                      Core Asset
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {mapping.applicationTargets.map((target, targetIndex) => (
                      <div key={targetIndex} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{target.type}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{target.description}</span>
                          </div>
                          <Progress value={target.impact} className="h-2" />
                        </div>
                        <span className="ml-3 font-medium text-primary">{target.impact}%</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">Competitive Advantage</span>
                    </div>
                    <p className="text-sm text-foreground/80">{mapping.competitiveAdvantage}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coherence" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                Portfolio Coherence Analysis
              </CardTitle>
              <CardDescription>
                How well your application components work together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="text-3xl font-bold text-success">
                    {mockStrategyData.portfolioCoherence.overallScore}%
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-success">Portfolio Coherence</div>
                    <div className="text-sm text-muted-foreground">Excellent alignment</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Portfolio Strengths
                  </h4>
                  {mockStrategyData.portfolioCoherence.strengths.map((strength, index) => (
                    <div key={index} className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-sm text-foreground/90">{strength}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-accent flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Enhancement Opportunities
                  </h4>
                  {mockStrategyData.portfolioCoherence.improvementAreas.map((area, index) => (
                    <div key={index} className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <p className="text-sm text-foreground/90">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positioning" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Competitive Positioning Assessment
              </CardTitle>
              <CardDescription>
                How you differentiate from typical applicants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="text-3xl font-bold text-primary">
                    {mockStrategyData.competitivePositioning.uniquenessScore}%
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-primary">Uniqueness Score</div>
                    <div className="text-sm text-muted-foreground">Exceptional differentiation</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Key Differentiators</h4>
                {mockStrategyData.competitivePositioning.differentiators.map((diff, index) => (
                  <div key={index} className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3">
                    <Crown className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-foreground/90">{diff}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Performance vs. Typical Applicant</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(mockStrategyData.competitivePositioning.comparisonToTypicalApplicant).map(([skill, advantage]) => (
                    <div key={skill} className="p-3 rounded-lg bg-card/50 border border-border/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="capitalize font-medium">{skill.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-success font-semibold">+{advantage}%</span>
                      </div>
                      <Progress value={50 + advantage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <School className="h-5 w-5" />
                </div>
                School-Specific Alignment
              </CardTitle>
              <CardDescription>
                Customized positioning for target schools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {mockStrategyData.schoolSpecificAlignment.map((school, index) => (
                  <Button
                    key={index}
                    variant={selectedSchool === index ? "default" : "outline"}
                    onClick={() => setSelectedSchool(index)}
                    className={`p-4 h-auto flex flex-col items-center gap-2 ${
                      selectedSchool === index ? 'bg-gradient-primary text-white' : ''
                    }`}
                  >
                    <span className="font-semibold">{school.school}</span>
                    <span className="text-sm">{school.alignmentScore}% Match</span>
                  </Button>
                ))}
              </div>

              {mockStrategyData.schoolSpecificAlignment[selectedSchool] && (
                <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-primary text-lg">
                      {mockStrategyData.schoolSpecificAlignment[selectedSchool].school} Strategy
                    </h4>
                    <Badge className="bg-gradient-primary text-white">
                      {mockStrategyData.schoolSpecificAlignment[selectedSchool].alignmentScore}% Alignment
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Key Connection Points</h5>
                      <div className="flex flex-wrap gap-2">
                        {mockStrategyData.schoolSpecificAlignment[selectedSchool].keyConnections.map((connection, index) => (
                          <Badge key={index} variant="outline" className="border-primary/50 text-primary">
                            {connection}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                      <h5 className="font-medium text-success mb-2">Recommended Positioning</h5>
                      <p className="text-foreground/90">
                        {mockStrategyData.schoolSpecificAlignment[selectedSchool].recommendedPositioning}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationStrategyDashboard;