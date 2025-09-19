import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  PenTool, 
  Zap, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Lightbulb,
  ArrowUp,
  Star,
  Award,
  Sparkles
} from 'lucide-react';

interface StrategicWritingEnhancementProps {
  projectData?: any;
  enabledTabs?: Array<'analysis'|'evidence'|'advantage'|'techniques'>;
}

// Hard-coded mock data - represents essay analysis and improvement suggestions
const mockWritingData = {
  essayAnalysis: [
    {
      title: "Personal Statement Draft",
      currentStrength: 73,
      targetStrength: 92,
      wordCount: 487,
      maxWords: 650,
      currentText: "I've always been interested in technology and helping people. When I started working on my community garden app, I learned a lot about programming and working with different people. The project was challenging but rewarding.",
      improvements: [
        {
          category: "Opening Impact",
          current: "Weak generic opening",
          suggested: "Start with specific moment: 'Mrs. Rodriguez's 2 AM text changed everything...'",
          impact: "+15 points"
        },
        {
          category: "Evidence Integration", 
          current: "Vague descriptions",
          suggested: "Include specific project outcomes: '200+ families, 40% waste reduction'",
          impact: "+12 points"
        },
        {
          category: "Voice & Authenticity",
          current: "Generic language",
          suggested: "Use personal reflection: 'I realized technology must serve, not replace wisdom'",
          impact: "+8 points"
        }
      ]
    },
    {
      title: "Leadership Essay",
      currentStrength: 81,
      targetStrength: 95,
      wordCount: 320,
      maxWords: 500,
      currentText: "I led a team to create an app for community gardens. We had some challenges with communication and different skill levels, but we worked through them and created a successful product.",
      improvements: [
        {
          category: "Leadership Specificity",
          current: "Generic leadership claims",
          suggested: "Detail inclusive recruitment: 'Recruited bilingual volunteers to ensure cultural competence'",
          impact: "+9 points"
        },
        {
          category: "Conflict Resolution",
          current: "Mentions challenges vaguely", 
          suggested: "Specific example: 'When technical and community members disagreed on UI...'",
          impact: "+7 points"
        }
      ]
    }
  ],
  evidenceUpgrades: [
    {
      weakExample: "I helped people in my community",
      strongExample: "Coordinated bilingual training sessions for 50+ immigrant families",
      improvementType: "Specificity + Scale",
      impact: "Transforms vague help into concrete leadership"
    },
    {
      weakExample: "My app was successful", 
      strongExample: "Platform achieved 200+ active users across 12 gardens, reducing food waste 40%",
      improvementType: "Quantified Outcomes",
      impact: "Provides measurable evidence of success"
    },
    {
      weakExample: "I learned about teamwork",
      strongExample: "Navigating cultural and technical perspectives taught me inclusive leadership requires deliberate bridge-building",
      improvementType: "Deep Reflection",
      impact: "Shows sophisticated self-awareness"
    }
  ],
  competitiveAdvantages: [
    {
      advantage: "Agricultural Technology Intersection",
      rarity: "Top 5% of applicants",
      howToEmphasize: "Lead with unique tech+agriculture combination, avoid generic CS language",
      essayApplication: "Perfect for 'Why This Major?' essays"
    },
    {
      advantage: "Bilingual Technical Mentorship",
      rarity: "Top 10% of applicants", 
      howToEmphasize: "Highlight cultural bridge-building and inclusive design principles",
      essayApplication: "Diversity essays and leadership examples"
    },
    {
      advantage: "Community Ownership Transfer",
      rarity: "Unprecedented in applications",
      howToEmphasize: "Emphasize systems thinking and sustainable impact design",
      essayApplication: "Demonstrates long-term thinking and genuine community commitment"
    }
  ],
  writingTechniques: [
    {
      technique: "Sensory Opening",
      description: "Start with vivid, specific moment rather than general statement",
      before: "I've always been interested in helping my community.",
      after: "The notification at 2:17 AM changed everything: 'Mrs. Rodriguez's tomatoes are ready, and she's teaching traditional canning tomorrow.'"
    },
    {
      technique: "Evidence Sandwiching",
      description: "Wrap quantified outcomes in personal meaning",
      before: "My app helped 200 families.",
      after: "Watching Mrs. Rodriguez teach her granddaughter through my app—200 families connected—showed me technology's true power lies in preserving wisdom, not replacing it."
    },
    {
      technique: "Growth Specificity",
      description: "Show precise before/after change with evidence",
      before: "I became a better leader.",
      after: "I evolved from directing technical solutions to facilitating community conversations—a shift measured not in code commits, but in the 15 elderly immigrants who now confidently train newcomers."
    }
  ]
};

const StrategicWritingEnhancement: React.FC<StrategicWritingEnhancementProps> = ({ 
  projectData, 
  enabledTabs = ['analysis', 'evidence', 'advantage', 'techniques'] 
}) => {
  const [selectedEssay, setSelectedEssay] = useState(0);
  const [activeTab, setActiveTab] = useState<string>(enabledTabs[0] || 'analysis');
  const [userEssayText, setUserEssayText] = useState("");

  const tabConfig = {
    analysis: { value: 'analysis', icon: PenTool, label: 'Essay Analysis' },
    evidence: { value: 'evidence', icon: Zap, label: 'Evidence Upgrades' },
    advantage: { value: 'advantage', icon: Star, label: 'Competitive Edge' },
    techniques: { value: 'techniques', icon: Sparkles, label: 'Writing Mastery' }
  };

  const shouldShowTabsList = enabledTabs.length > 1;

  const getStrengthColor = (strength: number) => {
    if (strength >= 90) return "text-success";
    if (strength >= 80) return "text-primary";
    if (strength >= 70) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

        {enabledTabs.includes('analysis') && (
          <TabsContent value="analysis" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <PenTool className="h-5 w-5" />
                </div>
                Essay Strength Analyzer
              </CardTitle>
              <CardDescription>
                Detailed assessment and improvement roadmap for existing essays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockWritingData.essayAnalysis.map((essay, index) => (
                  <Button
                    key={index}
                    variant={selectedEssay === index ? "default" : "outline"}
                    onClick={() => setSelectedEssay(index)}
                    className={`p-4 h-auto flex flex-col items-start gap-2 ${
                      selectedEssay === index ? 'bg-gradient-primary text-white' : ''
                    }`}
                  >
                    <span className="font-semibold">{essay.title}</span>
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-sm">Strength:</span>
                      <Progress value={essay.currentStrength} className="flex-1 h-1" />
                      <span className="text-sm font-medium">{essay.currentStrength}%</span>
                    </div>
                  </Button>
                ))}
              </div>

              {mockWritingData.essayAnalysis[selectedEssay] && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <div className={`text-2xl font-bold ${getStrengthColor(mockWritingData.essayAnalysis[selectedEssay].currentStrength)}`}>
                        {mockWritingData.essayAnalysis[selectedEssay].currentStrength}%
                      </div>
                      <div className="text-sm text-muted-foreground">Current Strength</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-success/10 border border-success/30">
                      <div className="text-2xl font-bold text-success">
                        {mockWritingData.essayAnalysis[selectedEssay].targetStrength}%
                      </div>
                      <div className="text-sm text-muted-foreground">Target Strength</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="text-2xl font-bold text-primary">
                        {mockWritingData.essayAnalysis[selectedEssay].wordCount}/{mockWritingData.essayAnalysis[selectedEssay].maxWords}
                      </div>
                      <div className="text-sm text-muted-foreground">Word Count</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <h4 className="font-medium mb-2">Current Draft Sample</h4>
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      {mockWritingData.essayAnalysis[selectedEssay].currentText}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Improvement Roadmap
                    </h4>
                    {mockWritingData.essayAnalysis[selectedEssay].improvements.map((improvement, index) => (
                      <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-accent">{improvement.category}</h5>
                          <Badge className="bg-gradient-primary text-white">
                            {improvement.impact}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">Current:</span>
                            <p className="text-sm text-foreground/80 flex-1">{improvement.current}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">Upgrade:</span>
                            <p className="text-sm text-foreground/90 font-medium flex-1">{improvement.suggested}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {enabledTabs.includes('evidence') && (
          <TabsContent value="evidence" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Zap className="h-5 w-5" />
                </div>
                Evidence Upgrade Suggestions
              </CardTitle>
              <CardDescription>
                Transform weak examples into powerful project evidence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockWritingData.evidenceUpgrades.map((upgrade, index) => (
                <div key={index} className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-gradient-primary text-white">
                      {upgrade.improvementType}
                    </Badge>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-destructive">Weak Example:</span>
                      </div>
                      <p className="text-sm text-foreground/80 italic">"{upgrade.weakExample}"</p>
                    </div>

                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-success">Project-Enhanced:</span>
                        <CheckCircle className="h-3 w-3 text-success" />
                      </div>
                      <p className="text-sm text-foreground/90 font-medium">"{upgrade.strongExample}"</p>
                    </div>

                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="h-3 w-3 text-primary" />
                        <span className="text-sm font-medium text-primary">Why This Works:</span>
                      </div>
                      <p className="text-xs text-foreground/80">{upgrade.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {enabledTabs.includes('advantage') && (
          <TabsContent value="advantage" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Star className="h-5 w-5" />
                </div>
                Competitive Advantage Highlighter
              </CardTitle>
              <CardDescription>
                Strategic positioning of unique project differentiators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockWritingData.competitiveAdvantages.map((advantage, index) => (
                <div key={index} className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-success/10 border border-primary/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-primary text-lg">{advantage.advantage}</h4>
                    <Badge className="bg-gradient-primary text-white">
                      {advantage.rarity}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-accent" />
                        <span className="font-medium text-accent">How to Emphasize</span>
                      </div>
                      <p className="text-sm text-foreground/80">{advantage.howToEmphasize}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-success" />
                        <span className="font-medium text-success">Best Essay Application</span>
                      </div>
                      <p className="text-sm text-foreground/80">{advantage.essayApplication}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {enabledTabs.includes('techniques') && (
          <TabsContent value="techniques" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                Advanced Writing Techniques
              </CardTitle>
              <CardDescription>
                Sophisticated storytelling methods using project elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockWritingData.writingTechniques.map((technique, index) => (
                <div key={index} className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-primary text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-accent">{technique.technique}</h4>
                  </div>

                  <p className="text-sm text-foreground/80 mb-4">{technique.description}</p>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="text-sm font-medium text-destructive mb-1">Generic Approach:</div>
                      <p className="text-sm text-foreground/80 italic">"{technique.before}"</p>
                    </div>

                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <div className="text-sm font-medium text-success mb-1">Project-Enhanced:</div>
                      <p className="text-sm text-foreground/90 font-medium leading-relaxed">"{technique.after}"</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                <h4 className="font-semibold text-primary mb-3">Practice Space - Apply These Techniques</h4>
                <Textarea
                  placeholder="Try rewriting a paragraph from your essay using the techniques above..."
                  value={userEssayText}
                  onChange={(e) => setUserEssayText(e.target.value)}
                  className="min-h-[120px] mb-3"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Word count: {userEssayText.split(' ').filter(word => word.length > 0).length}</span>
                  <span>Character count: {userEssayText.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default StrategicWritingEnhancement;