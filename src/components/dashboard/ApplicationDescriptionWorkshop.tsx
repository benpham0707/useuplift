import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Edit3, 
  Sparkles, 
  Target, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Award,
  Users,
  Clock
} from 'lucide-react';

interface ApplicationDescriptionWorkshopProps {
  projectData?: any;
}

// Hard-coded mock data - represents optimized application descriptions
const mockDescriptionData = {
  commonAppDescriptions: [
    {
      original: "I created a mobile app for community gardens to help people share resources and connect.",
      optimized: "Founded GrowTogether: bilingual mobile platform connecting 200+ families across 12 community gardens, reducing food waste 40% through automated resource sharing.",
      characterCount: 149,
      improvements: ["Added quantified impact", "Specified scale", "Highlighted bilingual aspect", "Used action verb 'founded'"],
      score: 94
    },
    {
      original: "I started a peer mentoring program at school to help struggling students with academics and personal issues.",
      optimized: "Designed peer mentorship framework adopted by 3 schools, training 45 student counselors who supported 180+ peers, reducing dropout risk 25% district-wide.",
      characterCount: 147,
      improvements: ["Showed systematic approach", "Demonstrated scalability", "Quantified outcomes", "Emphasized leadership"],
      score: 91
    }
  ],
  ucDescriptions: [
    {
      category: "Academic Interest",
      original: "My community garden app taught me about the intersection of technology and agriculture, which made me interested in studying computer science with a focus on environmental applications.",
      optimized: "Developing GrowTogether revealed agriculture's untapped tech potential: my bilingual platform now serves 200+ families, inspiring my CS focus on environmental sustainability. Witnessing elderly immigrants teach traditional farming through my app showed me technology's power to bridge generations while solving climate challenges. This experience crystallized my commitment to environmental informatics—using data science and mobile development to address food security, particularly in underserved communities where language barriers often limit access to agricultural resources.",
      characterCount: 347,
      improvements: ["Personal narrative", "Specific examples", "Clear academic connection", "Demonstrated growth"],
      score: 96
    }
  ],
  beforeAfterShowcase: [
    {
      type: "Weak Description",
      text: "I volunteered at a community center and helped people.",
      issues: ["Too vague", "No measurable impact", "Passive language", "No specific role"]
    },
    {
      type: "Strong Description", 
      text: "Coordinated bilingual workshops for 50+ immigrant families, translating complex housing documents and connecting residents with legal resources, resulting in 15 successful lease negotiations.",
      strengths: ["Specific role defined", "Clear demographics served", "Quantified outcomes", "Demonstrated skills"]
    }
  ],
  writingTechniques: [
    {
      technique: "Lead with Impact",
      description: "Start with the most impressive outcome or scale",
      example: "'Reduced food waste 40%...' vs 'I created an app that...'"
    },
    {
      technique: "Quantify Everything",
      description: "Include specific numbers, percentages, timeframes",
      example: "'200+ families across 12 gardens' vs 'many people in gardens'"
    },
    {
      technique: "Active Voice Power",
      description: "Use strong action verbs that show leadership",
      example: "'Founded', 'Designed', 'Coordinated' vs 'Helped', 'Assisted'"
    },
    {
      technique: "Specificity Wins",
      description: "Replace general terms with precise details",
      example: "'Bilingual mobile platform' vs 'app for people'"
    }
  ]
};

const ApplicationDescriptionWorkshop: React.FC<ApplicationDescriptionWorkshopProps> = ({ projectData }) => {
  const [activeDescription, setActiveDescription] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<"commonapp" | "uc">("commonapp");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-primary"; 
    if (score >= 70) return "text-accent";
    return "text-destructive";
  };

  const getCharacterLimitColor = (count: number, limit: number) => {
    const percentage = (count / limit) * 100;
    if (percentage > 95) return "text-destructive";
    if (percentage > 85) return "text-accent";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="optimizer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimizer" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Description Builder
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Before & After
          </TabsTrigger>
          <TabsTrigger value="techniques" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Writing Techniques
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Live Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimizer" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Edit3 className="h-5 w-5" />
                </div>
                Character-Limited Description Optimizer
              </CardTitle>
              <CardDescription>
                Transform basic descriptions into compelling 150-350 character application entries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3 mb-4">
                <Button
                  variant={selectedPlatform === "commonapp" ? "default" : "outline"}
                  onClick={() => setSelectedPlatform("commonapp")}
                  className={selectedPlatform === "commonapp" ? "bg-gradient-primary text-white" : ""}
                >
                  Common App (150 chars)
                </Button>
                <Button
                  variant={selectedPlatform === "uc" ? "default" : "outline"}  
                  onClick={() => setSelectedPlatform("uc")}
                  className={selectedPlatform === "uc" ? "bg-gradient-primary text-white" : ""}
                >
                  UC Application (350 chars)
                </Button>
              </div>

              {selectedPlatform === "commonapp" && (
                <div className="space-y-4">
                  {mockDescriptionData.commonAppDescriptions.map((desc, index) => (
                    <div key={index} className={`p-5 rounded-xl border transition-all cursor-pointer ${
                      activeDescription === index 
                        ? 'bg-primary/10 border-primary/30 shadow-soft'
                        : 'bg-accent/5 border-accent/20 hover:border-accent/40'
                    }`} onClick={() => setActiveDescription(index)}>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="border-destructive/50 text-destructive">
                          Before: Weak
                        </Badge>
                        <Badge className="bg-gradient-primary text-white">
                          After: Score {desc.score}%
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                          <div className="text-sm text-destructive font-medium mb-1">Original (Needs Work)</div>
                          <p className="text-foreground/80 italic">{desc.original}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-success font-medium">Optimized Version</span>
                            <span className={`text-xs ${getCharacterLimitColor(desc.characterCount, 150)}`}>
                              {desc.characterCount}/150
                            </span>
                          </div>
                          <p className="text-foreground/90 font-medium">{desc.optimized}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {desc.improvements.map((improvement, improvementIndex) => (
                            <div key={improvementIndex} className="p-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="text-xs text-foreground/80">{improvement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPlatform === "uc" && (
                <div className="space-y-4">
                  {mockDescriptionData.ucDescriptions.map((desc, index) => (
                    <div key={index} className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-gradient-primary text-white">
                          {desc.category}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-success/50 text-success">
                            Score: {desc.score}%
                          </Badge>
                          <span className={`text-xs ${getCharacterLimitColor(desc.characterCount, 350)}`}>
                            {desc.characterCount}/350
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                          <div className="text-sm text-destructive font-medium mb-1">Original (Basic)</div>
                          <p className="text-foreground/80 italic text-sm">{desc.original}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                          <div className="text-sm text-success font-medium mb-1">UC-Optimized Version</div>
                          <p className="text-foreground/90 leading-relaxed text-sm">{desc.optimized}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {desc.improvements.map((improvement, improvementIndex) => (
                            <div key={improvementIndex} className="p-2 rounded-lg bg-accent/10 border border-accent/30 flex items-center gap-2">
                              <Award className="h-3 w-3 text-accent flex-shrink-0" />
                              <span className="text-xs text-foreground/80">{improvement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                Transformation Showcase
              </CardTitle>
              <CardDescription>
                Clear examples of weak vs. compelling descriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockDescriptionData.beforeAfterShowcase.map((example, index) => (
                <div key={index} className={`p-5 rounded-xl border ${
                  example.type === "Weak Description" 
                    ? 'bg-destructive/10 border-destructive/30' 
                    : 'bg-success/10 border-success/30'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {example.type === "Weak Description" ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    <span className={`font-semibold ${
                      example.type === "Weak Description" ? 'text-destructive' : 'text-success'
                    }`}>
                      {example.type}
                    </span>
                  </div>
                  
                  <p className="text-foreground/90 mb-4 italic">{example.text}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(example.issues || example.strengths)?.map((point, pointIndex) => (
                      <div key={pointIndex} className={`p-3 rounded-lg border flex items-center gap-2 ${
                        example.type === "Weak Description"
                          ? 'bg-card/50 border-border/30'  
                          : 'bg-card/50 border-border/30'
                      }`}>
                        {example.type === "Weak Description" ? (
                          <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                        ) : (
                          <Zap className="h-3 w-3 text-success flex-shrink-0" />
                        )}
                        <span className="text-sm text-foreground/80">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="techniques" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Target className="h-5 w-5" />
                </div>
                Strategic Writing Techniques
              </CardTitle>
              <CardDescription>
                Proven methods for maximizing impact within character limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockDescriptionData.writingTechniques.map((technique, index) => (
                <div key={index} className="p-5 rounded-xl bg-accent/10 border border-accent/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-primary text-white">
                      <Target className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-accent">{technique.technique}</h4>
                  </div>
                  
                  <p className="text-foreground/80 mb-4">{technique.description}</p>
                  
                  <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                    <div className="text-sm font-medium text-primary mb-1">Example:</div>
                    <p className="text-sm text-foreground/90 italic">{technique.example}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Live Description Feedback
              </CardTitle>
              <CardDescription>
                Real-time analysis and suggestions as you write
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Write your description:</span>
                  <span className={`text-sm ${getCharacterLimitColor(userInput.length, 150)}`}>
                    {userInput.length}/150
                  </span>
                </div>
                <Textarea
                  placeholder="Type your activity description here..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[100px]"
                />
                <Progress value={(userInput.length / 150) * 100} className="h-2" />
              </div>

              {userInput && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary mb-2">Real-time Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">85%</div>
                        <div className="text-sm text-muted-foreground">Impact Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">92%</div>
                        <div className="text-sm text-muted-foreground">Clarity</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <h4 className="font-semibold text-accent mb-2">Suggestions</h4>
                    <ul className="space-y-2 text-sm text-foreground/80">
                      <li className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-accent" />
                        Add specific numbers or percentages
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-accent" />
                        Use stronger action verbs
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-accent" />
                        Specify your unique role
                      </li>
                    </ul>
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

export default ApplicationDescriptionWorkshop;