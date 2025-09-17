import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  ArrowRight, 
  Lightbulb, 
  User, 
  TrendingUp, 
  Heart,
  Zap,
  Star,
  BookOpen,
  Target
} from 'lucide-react';

interface NarrativeArchitectureBuilderProps {
  projectData?: any;
}

// Hard-coded mock data - represents narrative thread mapping and story architecture
const mockNarrativeData = {
  storyThreads: [
    {
      id: "leadership",
      name: "Leadership Evolution",
      color: "primary", 
      strength: 92,
      moments: [
        { essay: "Personal Statement", moment: "Leading failed first prototype team", impact: "Shows vulnerability and learning" },
        { essay: "Leadership Essay", moment: "Recruiting bilingual volunteers", impact: "Demonstrates inclusive leadership" },
        { essay: "Community Service", moment: "Training elderly immigrants on app", impact: "Shows patience and cultural sensitivity" },
        { essay: "Why This Major", moment: "Mentoring other student developers", impact: "Proves teaching and technical skills" }
      ]
    },
    {
      id: "growth",
      name: "Personal Growth Arc", 
      color: "success",
      strength: 89,
      moments: [
        { essay: "Challenges Essay", moment: "Overcoming language barriers in requirements gathering", impact: "Shows adaptability" },
        { essay: "Personal Statement", moment: "Realizing tech must serve community needs", impact: "Demonstrates maturity" },
        { essay: "Academic Interest", moment: "Switching from pure CS to environmental focus", impact: "Shows intellectual evolution" }
      ]
    },
    {
      id: "impact",
      name: "Community Impact Thread",
      color: "accent", 
      strength: 95,
      moments: [
        { essay: "Community Service", moment: "200+ families using platform", impact: "Quantifiable outcomes" },
        { essay: "Diversity Essay", moment: "Bridging generational and cultural gaps", impact: "Shows cultural competence" },
        { essay: "Supplemental", moment: "40% reduction in food waste", impact: "Environmental impact" }
      ]
    }
  ],
  characterDevelopment: {
    beginning: {
      traits: ["Tech-focused", "Individual contributor", "English-dominant communication"],
      mindset: "Technology can solve problems"
    },
    middle: {
      traits: ["Community-aware", "Collaborative leader", "Bilingual communicator"], 
      mindset: "Technology should serve community needs"
    },
    end: {
      traits: ["Systems thinker", "Cultural bridge-builder", "Environmental advocate"],
      mindset: "Technology must address systemic inequities"
    },
    growthMarkers: [
      { stage: "Initial", event: "First app prototype fails", lesson: "Technical skills alone insufficient" },
      { stage: "Development", event: "Community feedback session", lesson: "User-centered design essential" },
      { stage: "Transformation", event: "Elderly immigrant teaches traditional method", lesson: "Technology should enhance, not replace wisdom" },
      { stage: "Mastery", event: "Platform adopted by multiple communities", lesson: "Scalable impact requires systematic thinking" }
    ]
  },
  essayIntegrationMap: [
    {
      essay: "Personal Statement (650 words)",
      primaryThread: "Growth + Impact",
      keyMoments: ["Failed prototype", "Community listening", "Cross-generational learning", "Platform success"],
      tone: "Reflective and authentic",
      unique_angle: "Technology as cultural bridge"
    },
    {
      essay: "Leadership Essay",
      primaryThread: "Leadership Evolution", 
      keyMoments: ["Recruiting bilingual team", "Training sessions", "Conflict resolution"],
      tone: "Confident and collaborative",
      unique_angle: "Inclusive leadership in tech"
    },
    {
      essay: "Academic Interest",
      primaryThread: "Growth + Environmental Focus",
      keyMoments: ["CS to environmental shift", "Agriculture-tech intersection"], 
      tone: "Intellectual and passionate",
      unique_angle: "Environmental informatics"
    }
  ],
  narrativeCoherence: {
    consistencyScore: 91,
    voiceAlignment: 94, 
    themeIntegration: 88,
    avoidedRepetition: 92,
    strengths: [
      "Strong central theme of community-centered technology",
      "Consistent growth narrative across all essays", 
      "Authentic voice maintained throughout",
      "Strategic differentiation by essay type"
    ],
    improvements: [
      "Could strengthen academic interest connection",
      "Opportunity to weave in more quantified outcomes"
    ]
  }
};

const NarrativeArchitectureBuilder: React.FC<NarrativeArchitectureBuilderProps> = ({ projectData }) => {
  const [selectedThread, setSelectedThread] = useState(0);
  const [selectedEssay, setSelectedEssay] = useState(0);

  const getColorClasses = (color: string) => {
    const colors = {
      primary: "bg-primary/10 border-primary/30 text-primary",
      success: "bg-success/10 border-success/30 text-success", 
      accent: "bg-accent/10 border-accent/30 text-accent"
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="threads" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="threads" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Story Threads
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Character Arc
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Essay Integration
          </TabsTrigger>
          <TabsTrigger value="coherence" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Coherence Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <GitBranch className="h-5 w-5" />
                </div>
                Story Thread Mapper
              </CardTitle>
              <CardDescription>
                Visual connections between project moments and essay applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {mockNarrativeData.storyThreads.map((thread, index) => (
                  <Button
                    key={index}
                    variant={selectedThread === index ? "default" : "outline"}
                    onClick={() => setSelectedThread(index)}
                    className={`p-4 h-auto flex flex-col items-center gap-2 ${
                      selectedThread === index ? 'bg-gradient-primary text-white' : ''
                    }`}
                  >
                    <span className="font-semibold">{thread.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">Strength:</span>
                      <span className="font-medium">{thread.strength}%</span>
                    </div>
                  </Button>
                ))}
              </div>

              {mockNarrativeData.storyThreads[selectedThread] && (
                <div className={`p-5 rounded-xl border ${getColorClasses(mockNarrativeData.storyThreads[selectedThread].color)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">
                      {mockNarrativeData.storyThreads[selectedThread].name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={mockNarrativeData.storyThreads[selectedThread].strength} 
                        className="w-20 h-2" 
                      />
                      <span className="font-medium">{mockNarrativeData.storyThreads[selectedThread].strength}%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {mockNarrativeData.storyThreads[selectedThread].moments.map((moment, momentIndex) => (
                      <div key={momentIndex} className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {moment.essay}
                          </Badge>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-1">{moment.moment}</p>
                          <p className="text-sm text-muted-foreground">{moment.impact}</p>
                        </div>
                        <Zap className="h-4 w-4 text-success flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Character Development Visualizer
              </CardTitle>
              <CardDescription>
                Timeline of personal growth with supporting evidence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                  <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Beginning
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Traits:</span>
                      <div className="mt-1 space-y-1">
                        {mockNarrativeData.characterDevelopment.beginning.traits.map((trait, index) => (
                          <Badge key={index} variant="outline" className="mr-1 text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50">
                      <span className="text-sm font-medium text-muted-foreground">Mindset:</span>
                      <p className="text-sm italic mt-1">"{mockNarrativeData.characterDevelopment.beginning.mindset}"</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Development
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Traits:</span>
                      <div className="mt-1 space-y-1">
                        {mockNarrativeData.characterDevelopment.middle.traits.map((trait, index) => (
                          <Badge key={index} variant="outline" className="mr-1 text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50">
                      <span className="text-sm font-medium text-muted-foreground">Mindset:</span>
                      <p className="text-sm italic mt-1">"{mockNarrativeData.characterDevelopment.middle.mindset}"</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                  <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Transformation
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Traits:</span>
                      <div className="mt-1 space-y-1">
                        {mockNarrativeData.characterDevelopment.end.traits.map((trait, index) => (
                          <Badge key={index} variant="outline" className="mr-1 text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50">
                      <span className="text-sm font-medium text-muted-foreground">Mindset:</span>
                      <p className="text-sm italic mt-1">"{mockNarrativeData.characterDevelopment.end.mindset}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Growth Markers & Key Lessons
                </h4>
                {mockNarrativeData.characterDevelopment.growthMarkers.map((marker, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-gradient-primary text-white text-xs">
                          {marker.stage}
                        </Badge>
                        <span className="font-medium text-foreground">{marker.event}</span>
                      </div>
                      <p className="text-sm text-muted-foreground italic">Lesson: {marker.lesson}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                Essay Integration Planner
              </CardTitle>
              <CardDescription>
                Strategic coordination of story elements across different essays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {mockNarrativeData.essayIntegrationMap.map((essay, index) => (
                  <Button
                    key={index}
                    variant={selectedEssay === index ? "default" : "outline"}
                    onClick={() => setSelectedEssay(index)}
                    className={`p-3 h-auto flex flex-col items-center gap-1 text-xs ${
                      selectedEssay === index ? 'bg-gradient-primary text-white' : ''
                    }`}
                  >
                    <span className="font-semibold">{essay.essay.split(' (')[0]}</span>
                    <span className="opacity-80">{essay.primaryThread}</span>
                  </Button>
                ))}
              </div>

              {mockNarrativeData.essayIntegrationMap[selectedEssay] && (
                <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="mb-4">
                    <h4 className="font-semibold text-primary text-lg mb-1">
                      {mockNarrativeData.essayIntegrationMap[selectedEssay].essay}
                    </h4>
                    <Badge className="bg-gradient-primary text-white">
                      {mockNarrativeData.essayIntegrationMap[selectedEssay].primaryThread}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2 text-foreground">Key Story Moments</h5>
                        <div className="space-y-2">
                          {mockNarrativeData.essayIntegrationMap[selectedEssay].keyMoments.map((moment, index) => (
                            <div key={index} className="p-3 rounded-lg bg-card/50 border border-border/30 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </div>
                              <span className="text-sm text-foreground/80">{moment}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                        <h5 className="font-medium text-accent mb-1">Tone & Voice</h5>
                        <p className="text-sm text-foreground/80">{mockNarrativeData.essayIntegrationMap[selectedEssay].tone}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                        <h5 className="font-medium text-success mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Unique Angle
                        </h5>
                        <p className="text-sm text-foreground/90 font-medium">
                          {mockNarrativeData.essayIntegrationMap[selectedEssay].unique_angle}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                        <h5 className="font-medium mb-2">Strategic Positioning</h5>
                        <p className="text-xs text-muted-foreground">
                          This essay demonstrates your unique perspective while avoiding overlap with other application components.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coherence" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white">
                  <Target className="h-5 w-5" />
                </div>
                Narrative Coherence Analysis
              </CardTitle>
              <CardDescription>
                Assessment of story consistency and strategic coordination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="text-2xl font-bold text-success">
                    {mockNarrativeData.narrativeCoherence.consistencyScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Consistency</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="text-2xl font-bold text-primary">
                    {mockNarrativeData.narrativeCoherence.voiceAlignment}%
                  </div>
                  <div className="text-sm text-muted-foreground">Voice</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/30">
                  <div className="text-2xl font-bold text-accent">
                    {mockNarrativeData.narrativeCoherence.themeIntegration}%
                  </div>
                  <div className="text-sm text-muted-foreground">Integration</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="text-2xl font-bold text-success">
                    {mockNarrativeData.narrativeCoherence.avoidedRepetition}%
                  </div>
                  <div className="text-sm text-muted-foreground">No Repetition</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-success flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Narrative Strengths
                  </h4>
                  {mockNarrativeData.narrativeCoherence.strengths.map((strength, index) => (
                    <div key={index} className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-start gap-2">
                      <Star className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90">{strength}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-accent flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Enhancement Opportunities
                  </h4>
                  {mockNarrativeData.narrativeCoherence.improvements.map((improvement, index) => (
                    <div key={index} className="p-3 rounded-lg bg-accent/10 border border-accent/30 flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NarrativeArchitectureBuilder;