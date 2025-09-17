import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  School,
  Award,
  Lightbulb,
  Star,
  Zap,
  Eye
} from 'lucide-react';
import { ExpertAnalysisCard } from './ExpertAnalysisCard';

interface ExpertApplicationIntelligenceProps {
  projectData?: any;
}

// Hard-coded mock data - represents expert strategic guidance and intelligence
const mockExpertData = {
  narrativeFrameworks: [
    {
      framework: "Hero's Journey Applied",
      description: "Classic narrative structure adapted for college applications",
      projectApplication: {
        callToAdventure: "Community need recognition - elderly immigrants struggling with resource access",
        crossingThreshold: "Decision to build bilingual platform despite technical challenges", 
        tests: "Failed prototypes, cultural misunderstandings, team coordination difficulties",
        revelation: "Technology must enhance rather than replace traditional wisdom",
        transformation: "From individual coder to community systems facilitator",
        return: "Sustainable platform with community ownership and measurable impact"
      },
      essayMapping: {
        "Personal Statement": "Full journey arc with emphasis on transformation",
        "Challenge Essay": "Focus on tests and revelation phases",
        "Growth Essay": "Emphasize crossing threshold and transformation"
      }
    },
    {
      framework: "Systems Thinking Narrative",
      description: "Demonstrating advanced problem-solving methodology",
      projectApplication: {
        systemsIdentification: "Food waste as symptom of broader community disconnection",
        rootCauseAnalysis: "Language barriers preventing resource sharing knowledge transfer",
        holistic_solution: "Platform connecting technical functionality with cultural practices",
        scalabilityDesign: "Framework enabling community ownership and self-sustenance",
        impactMeasurement: "Quantified outcomes plus qualitative community transformation"
      },
      essayMapping: {
        "Academic Interest": "Perfect for engineering and CS programs emphasizing problem-solving",
        "Why This Major": "Demonstrates sophisticated approach to technology applications"
      }
    }
  ],
  competitiveAnalysis: {
    applicantComparisons: [
      {
        category: "Typical CS Applicant",
        commonProfile: "Individual coding projects, hackathons, internships at tech companies",
        yourAdvantage: "Community-centered technology with real-world social impact and cultural competence",
        differentiationScore: 87
      },
      {
        category: "Community Service Leader", 
        commonProfile: "Volunteer work, nonprofit involvement, service hours accumulation",
        yourAdvantage: "Technical skills creating scalable systems rather than just direct service",
        differentiationScore: 92
      },
      {
        category: "Agricultural Interest Student",
        commonProfile: "FFA involvement, farming background, environmental club participation", 
        yourAdvantage: "Technology-agriculture intersection with urban community focus and bilingual capability",
        differentiationScore: 96
      }
    ],
    admissionsInsights: {
      currentTrends: [
        "Increased emphasis on authentic community engagement over resume padding",
        "Strong preference for students who demonstrate systems thinking and scalability",
        "Growing appreciation for cultural bridge-building and inclusive technology"
      ],
      yourPositioning: "Perfectly aligned with current admissions values while offering unique agricultural-tech intersection"
    }
  },
  schoolFitOptimization: [
    {
      school: "MIT",
      cultureMatch: 94,
      specificPrograms: ["D-Lab", "AgTech initiatives", "community-centered research"],
      facultyConnections: [
        "Prof. Amy Smith (D-Lab) - appropriate technology for developing communities",
        "Agricultural Technology Group - sustainable food systems research"
      ],
      applicationStrategy: {
        emphasize: ["Hands-on engineering", "Community partnership model", "Systematic problem-solving"],
        deemphasize: ["Individual achievement", "Corporate internships", "Traditional CS focus"],
        keyPhrase: "Technology for social equity"
      }
    },
    {
      school: "Stanford",
      cultureMatch: 91,
      specificPrograms: ["d.school", "Social Innovation", "Human-Computer Interaction"],
      facultyConnections: [
        "Design thinking faculty - human-centered design methodology",
        "Social entrepreneurship programs - scalable community impact"
      ],
      applicationStrategy: {
        emphasize: ["Design thinking process", "Entrepreneurial scalability", "Cultural empathy"],
        deemphasize: ["Technical complexity", "Individual coding skills", "Academic theory"],
        keyPhrase: "Human-centered technology innovation"
      }
    },
    {
      school: "UC Berkeley",
      cultureMatch: 89,
      specificPrograms: ["Public service mission", "Agricultural research", "Diversity initiatives"],
      facultyConnections: [
        "Agricultural technology research - sustainable food systems",
        "Public policy programs - technology for social justice"
      ],
      applicationStrategy: {
        emphasize: ["Public service orientation", "Cultural diversity", "Environmental sustainability"],
        deemphasize: ["Private sector goals", "Individual achievement", "Elite tech focus"],
        keyPhrase: "Technology for social justice"
      }
    }
  ],
  applicationImpactPredictor: {
    overallStrength: 91,
    strengthFactors: [
      { factor: "Unique positioning", weight: 25, score: 96, impact: "Rare agricultural-tech intersection" },
      { factor: "Authentic narrative", weight: 20, score: 93, impact: "Genuine community commitment with measurable outcomes" },
      { factor: "Cultural competence", weight: 15, score: 89, impact: "Bilingual capability and cross-cultural facilitation" },
      { factor: "Technical depth", weight: 15, score: 87, impact: "Sophisticated platform development and systems thinking" },
      { factor: "Leadership model", weight: 15, score: 91, impact: "Inclusive leadership with community ownership transfer" },
      { factor: "Academic fit", weight: 10, score: 88, impact: "Clear connection to environmental informatics and CS applications" }
    ],
    riskFactors: [
      { risk: "Single project focus", mitigation: "Frame as representative methodology, not isolated experience" },
      { risk: "Limited research experience", mitigation: "Emphasize community-based research and data collection skills" }
    ],
    probabilityEstimates: {
      "Top-tier (MIT, Stanford, etc.)": 78,
      "Excellent programs (UC Berkeley, etc.)": 91,
      "Strong programs with merit aid": 96
    }
  },
  advancedStrategies: [
    {
      strategy: "Narrative Layering",
      description: "Multiple story levels operating simultaneously",
      implementation: {
        surface: "Community garden app development project",
        deeper: "Cultural bridge-building and wisdom preservation",
        deepest: "Systematic approach to technology equity and inclusive innovation"
      },
      essayApplication: "Different essays can operate at different narrative levels while maintaining coherence"
    },
    {
      strategy: "Authenticity Amplification", 
      description: "Leveraging genuine passion markers for credibility",
      implementation: {
        detailSpecificity: "Mrs. Rodriguez's 2 AM texts, specific plant varieties, exact user numbers",
        emotionalResonance: "Moments of genuine surprise, frustration, and breakthrough",
        continuityIndicators: "Ongoing commitment, future plans, skill development trajectory"
      },
      essayApplication: "Authentic details create memorable, believable narrative that stands out from manufactured experiences"
    }
  ]
};

const ExpertApplicationIntelligence: React.FC<ExpertApplicationIntelligenceProps> = ({ projectData }) => {
  const [selectedFramework, setSelectedFramework] = useState(0);
  const [selectedSchool, setSelectedSchool] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState(0);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-primary";
    if (score >= 70) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="frameworks" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="frameworks" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="competitive" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Competitive Edge
          </TabsTrigger>
          <TabsTrigger value="schoolfit" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School Fit
          </TabsTrigger>
          <TabsTrigger value="predictor" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Impact Predictor
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Advanced Strategies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-4">
          <ExpertAnalysisCard
            title="Advanced Narrative Frameworks"
            category="Strategic Foundation"
            content={
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockExpertData.narrativeFrameworks.map((framework, index) => (
                    <Button
                      key={index}
                      variant={selectedFramework === index ? "default" : "outline"}
                      onClick={() => setSelectedFramework(index)}
                      className={`p-4 h-auto flex flex-col items-start gap-2 ${
                        selectedFramework === index ? 'bg-gradient-primary text-white' : ''
                      }`}
                    >
                      <span className="font-semibold">{framework.framework}</span>
                      <span className="text-xs opacity-80">{framework.description}</span>
                    </Button>
                  ))}
                </div>

                {mockExpertData.narrativeFrameworks[selectedFramework] && (
                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary text-lg mb-4">
                      {mockExpertData.narrativeFrameworks[selectedFramework].framework}
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-3">Project Application</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(mockExpertData.narrativeFrameworks[selectedFramework].projectApplication).map(([phase, description]) => (
                            <div key={phase} className="p-3 rounded-lg bg-card/50 border border-border/30">
                              <div className="font-medium text-accent mb-1 capitalize">
                                {phase.replace(/([A-Z])/g, ' $1')}
                              </div>
                              <p className="text-sm text-foreground/80">{description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3">Essay Mapping Strategy</h5>
                        <div className="space-y-2">
                          {Object.entries(mockExpertData.narrativeFrameworks[selectedFramework].essayMapping).map(([essay, strategy]) => (
                            <div key={essay} className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3">
                              <Badge variant="outline" className="border-success/50 text-success flex-shrink-0">
                                {essay}
                              </Badge>
                              <p className="text-sm text-foreground/80">{strategy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <ExpertAnalysisCard
            title="Competitive Analysis Intelligence"
            category="Market Positioning"
            content={
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Applicant Category Analysis</h4>
                  {mockExpertData.competitiveAnalysis.applicantComparisons.map((comparison, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-accent">{comparison.category}</h5>
                        <Badge className="bg-gradient-primary text-white">
                          +{comparison.differentiationScore}% advantage
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Typical Profile:</span>
                          <p className="text-sm text-foreground/80">{comparison.commonProfile}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-success">Your Strategic Advantage:</span>
                          <p className="text-sm text-foreground/90 font-medium">{comparison.yourAdvantage}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-xl bg-success/10 border border-success/30">
                  <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Current Admissions Trends
                  </h4>
                  <div className="space-y-3">
                    {mockExpertData.competitiveAnalysis.admissionsInsights.currentTrends.map((trend, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/90">{trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-card/50 border border-border/30">
                    <span className="font-medium text-primary">Your Strategic Positioning: </span>
                    <span className="text-foreground/90">{mockExpertData.competitiveAnalysis.admissionsInsights.yourPositioning}</span>
                  </div>
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="schoolfit" className="space-y-4">
          <ExpertAnalysisCard
            title="School-Specific Fit Optimization"
            category="Targeted Strategy"
            content={
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {mockExpertData.schoolFitOptimization.map((school, index) => (
                    <Button
                      key={index}
                      variant={selectedSchool === index ? "default" : "outline"}
                      onClick={() => setSelectedSchool(index)}
                      className={`p-4 h-auto flex flex-col items-center gap-2 ${
                        selectedSchool === index ? 'bg-gradient-primary text-white' : ''
                      }`}
                    >
                      <span className="font-semibold">{school.school}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">Match:</span>
                        <span className="font-medium">{school.cultureMatch}%</span>
                      </div>
                    </Button>
                  ))}
                </div>

                {mockExpertData.schoolFitOptimization[selectedSchool] && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-primary text-lg">
                          {mockExpertData.schoolFitOptimization[selectedSchool].school} Strategy
                        </h4>
                        <Badge className="bg-gradient-primary text-white">
                          {mockExpertData.schoolFitOptimization[selectedSchool].cultureMatch}% Culture Match
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2">Specific Programs</h5>
                          <div className="space-y-1">
                            {mockExpertData.schoolFitOptimization[selectedSchool].specificPrograms.map((program, index) => (
                              <Badge key={index} variant="outline" className="border-primary/50 text-primary mr-1 mb-1">
                                {program}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">Faculty Connections</h5>
                          <div className="space-y-2">
                            {mockExpertData.schoolFitOptimization[selectedSchool].facultyConnections.map((faculty, index) => (
                              <div key={index} className="p-2 rounded-lg bg-card/50 border border-border/30">
                                <p className="text-xs text-foreground/80">{faculty}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                        <h5 className="font-medium text-success mb-2">Emphasize</h5>
                        <div className="space-y-1">
                          {mockExpertData.schoolFitOptimization[selectedSchool].applicationStrategy.emphasize.map((item, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-success" />
                              <span className="text-xs text-foreground/80">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                        <h5 className="font-medium text-accent mb-2">De-emphasize</h5>
                        <div className="space-y-1">
                          {mockExpertData.schoolFitOptimization[selectedSchool].applicationStrategy.deemphasize.map((item, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-accent" />
                              <span className="text-xs text-foreground/80">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <div className="text-center">
                          <div className="font-medium text-primary mb-1">Key Phrase</div>
                          <div className="text-sm text-foreground/90 font-medium italic">
                            "{mockExpertData.schoolFitOptimization[selectedSchool].applicationStrategy.keyPhrase}"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="predictor" className="space-y-4">
          <ExpertAnalysisCard
            title="Application Impact Predictor"
            category="Success Analysis"
            content={
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 p-6 rounded-xl bg-primary/10 border border-primary/30">
                    <div className="text-4xl font-bold text-primary">
                      {mockExpertData.applicationImpactPredictor.overallStrength}%
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-primary text-lg">Overall Application Strength</div>
                      <div className="text-sm text-muted-foreground">Exceptional competitive position</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Strength Factor Analysis</h4>
                  {mockExpertData.applicationImpactPredictor.strengthFactors.map((factor, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-success/10 to-primary/10 border border-success/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-success">{factor.factor}</span>
                          <Badge variant="outline" className="border-primary/50 text-primary">
                            Weight: {factor.weight}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={factor.score} className="w-16 h-2" />
                          <span className={`font-medium ${getScoreColor(factor.score)}`}>{factor.score}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80">{factor.impact}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(mockExpertData.applicationImpactPredictor.probabilityEstimates).map(([tier, probability]) => (
                    <div key={tier} className="text-center p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <div className={`text-2xl font-bold ${getScoreColor(probability)}`}>
                        {probability}%
                      </div>
                      <div className="text-sm text-muted-foreground">{tier}</div>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <ExpertAnalysisCard
            title="Advanced Strategic Techniques"
            category="Master Level"
            content={
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {mockExpertData.advancedStrategies.map((strategy, index) => (
                    <Button
                      key={index}
                      variant={selectedStrategy === index ? "default" : "outline"}
                      onClick={() => setSelectedStrategy(index)}
                      className={`p-4 h-auto flex flex-col items-start gap-2 ${
                        selectedStrategy === index ? 'bg-gradient-primary text-white' : ''
                      }`}
                    >
                      <span className="font-semibold">{strategy.strategy}</span>
                      <span className="text-xs opacity-80">{strategy.description}</span>
                    </Button>
                  ))}
                </div>

                {mockExpertData.advancedStrategies[selectedStrategy] && (
                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary text-lg mb-4">
                      {mockExpertData.advancedStrategies[selectedStrategy].strategy}
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-3">Implementation Framework</h5>
                        <div className="space-y-3">
                          {Object.entries(mockExpertData.advancedStrategies[selectedStrategy].implementation).map(([level, description]) => (
                            <div key={level} className="p-3 rounded-lg bg-card/50 border border-border/30">
                              <div className="font-medium text-accent mb-1 capitalize">
                                {level.replace(/([A-Z])/g, ' $1')}
                              </div>
                              <p className="text-sm text-foreground/80">{description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-success" />
                          <h5 className="font-medium text-success">Essay Application</h5>
                        </div>
                        <p className="text-sm text-foreground/90">
                          {mockExpertData.advancedStrategies[selectedStrategy].essayApplication}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertApplicationIntelligence;