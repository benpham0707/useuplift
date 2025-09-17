import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle,
  Globe,
  Zap,
  Brain,
  Heart,
  Users,
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Eye,
  Ear,
  Puzzle,
  Compass,
  Award,
  Clock,
  Star,
  BookOpen,
  Handshake
} from 'lucide-react';

interface CommunicationExample {
  id: string;
  scenario: string;
  context: string;
  challenge: string;
  approach: string;
  techniques: string[];
  outcome: string;
  evidence: string;
  skillsDemonstrated: string[];
}

interface CulturalIntelligenceDisplay {
  id: string;
  situation: string;
  culturalFactors: string[];
  adaptations: string[];
  bridgingStrategies: string[];
  outcomes: string[];
  lessonsLearned: string;
}

interface AdaptabilityStory {
  id: string;
  originalPlan: string;
  disruption: string;
  signals: string[];
  pivotStrategy: string;
  newApproach: string;
  results: string[];
  metacognition: string;
}

interface LearningAgilityIndicator {
  id: string;
  learningContext: string;
  knowledgeSource: string;
  acquisitionMethod: string;
  transferExample: string;
  teachingEvidence: string;
  improvement: string;
  timeframe: string;
}

interface SoftSkillsEvidenceProps {
  className?: string;
}

export const SoftSkillsEvidence: React.FC<SoftSkillsEvidenceProps> = ({ className }) => {
  const [selectedCommunication, setSelectedCommunication] = useState<string>('tech-community');
  const [selectedCultural, setSelectedCultural] = useState<string>('generational');
  const [selectedAdaptability, setSelectedAdaptability] = useState<string>('project-pivot');
  const [selectedLearning, setSelectedLearning] = useState<string>('machine-learning');

  // Hard coded communication showcase examples with concrete evidence
  const communicationExamples: CommunicationExample[] = [
    {
      id: 'tech-community',
      scenario: 'Technical Concept Translation to Community Stakeholders',
      context: 'Needed to explain complex database architecture and offline synchronization to community members with varying technical backgrounds during project planning meetings.',
      challenge: 'Community stakeholders were confused by technical jargon and concerned about data privacy and system complexity, leading to resistance to the proposed solution.',
      approach: 'Developed a multi-layered communication strategy using analogies, visual demonstrations, and progressive disclosure of technical details.',
      techniques: [
        'Used gardening analogies: "Database tables are like garden plots, each storing different types of plants (data)"',
        'Created visual flowcharts showing data movement as "seeds traveling between gardens"',
        'Built interactive prototypes for hands-on exploration',
        'Established "technical translation" check-ins during presentations',
        'Created glossary documents with community-relevant examples'
      ],
      outcome: 'Achieved 100% stakeholder understanding and buy-in for the technical architecture, with community members actively contributing technical requirements.',
      evidence: 'Post-meeting surveys showed 95% clarity on technical concepts, and stakeholders began using technical terminology correctly in follow-up discussions.',
      skillsDemonstrated: ['Audience Analysis', 'Analogical Reasoning', 'Visual Communication', 'Active Listening', 'Iterative Explanation']
    },
    {
      id: 'conflict-mediation',
      scenario: 'Mediating Design Philosophy Conflicts',
      context: 'Disagreement between younger developers who wanted a modern, app-like interface and older community members who preferred familiar, simple designs.',
      challenge: 'Both groups felt their needs were being dismissed, leading to heated discussions and potential project derailment.',
      approach: 'Facilitated structured dialogue sessions focusing on underlying needs rather than surface preferences.',
      techniques: [
        'Used "Yes, and..." framework to build on all ideas',
        'Created empathy mapping exercises for each user group',
        'Established shared success criteria before discussing solutions',
        'Implemented "perspective taking" role reversals',
        'Developed solution synthesis workshops'
      ],
      outcome: 'Created hybrid design approach that satisfied both groups and became model for future decisions.',
      evidence: 'Final design received 94% approval from all stakeholder groups, and the mediation process was adopted for other community projects.',
      skillsDemonstrated: ['Conflict Resolution', 'Empathy Building', 'Structured Facilitation', 'Solution Synthesis', 'Relationship Management']
    },
    {
      id: 'presentation-skills',
      scenario: 'Technical Conference Presentation to 200+ Audience',
      context: 'Invited to present community technology project at regional tech conference with mixed audience of developers, community organizers, and academics.',
      challenge: 'Needed to engage three distinct audiences simultaneously while maintaining technical credibility and community authenticity.',
      approach: 'Designed multi-threaded presentation with something valuable for each audience segment.',
      techniques: [
        'Used storytelling arc with technical deep-dives embedded naturally',
        'Incorporated live community member testimonials via video',
        'Provided technical architecture diagrams for developers',
        'Shared community impact metrics for organizers',
        'Included research implications for academics'
      ],
      outcome: 'Received highest session rating at conference and generated follow-up collaboration requests from all three audience types.',
      evidence: 'Session evaluation: 4.8/5.0 average rating, 15+ collaboration requests, featured in conference highlight reel.',
      skillsDemonstrated: ['Public Speaking', 'Multi-Audience Engagement', 'Storytelling', 'Content Curation', 'Professional Networking']
    }
  ];

  // Hard coded cultural intelligence examples with specific outcomes
  const culturalIntelligenceDisplays: CulturalIntelligenceDisplay[] = [
    {
      id: 'generational',
      situation: 'Bridging Generational Technology Perspectives',
      culturalFactors: [
        'Digital natives vs. digital immigrants',
        'Different privacy expectations and concerns',
        'Varying comfort levels with technology adoption',
        'Distinct communication preferences (text vs. voice vs. in-person)'
      ],
      adaptations: [
        'Created age-diverse working groups for all major decisions',
        'Established multiple communication channels for different preferences',
        'Implemented gradual technology introduction with extensive support',
        'Respected traditional knowledge while introducing digital enhancement'
      ],
      bridgingStrategies: [
        'Paired digital natives with elders as mutual mentors',
        'Translated technology benefits into traditional community values',
        'Created "technology sabbath" periods to balance digital and analog approaches',
        'Developed intergenerational skill-sharing workshops'
      ],
      outcomes: [
        'Achieved 89% cross-generational satisfaction with technology integration',
        'Created lasting mentorship relationships beyond the project',
        'Established model used by other community technology initiatives',
        'Generated unexpected innovations from combining traditional and digital approaches'
      ],
      lessonsLearned: 'Cultural differences are sources of innovation when properly bridged rather than problems to be solved.'
    },
    {
      id: 'socioeconomic',
      situation: 'Navigating Socioeconomic Diversity in Team Formation',
      culturalFactors: [
        'Varying levels of technology access and internet connectivity',
        'Different work schedule constraints (multiple jobs, family responsibilities)',
        'Diverse educational backgrounds and learning preferences',
        'Distinct motivations for participation (resume building vs. community service)'
      ],
      adaptations: [
        'Provided technology lending library for team members without resources',
        'Created flexible meeting schedules accommodating work constraints',
        'Developed multiple learning pathways for different educational backgrounds',
        'Aligned project contributions with individual goals and motivations'
      ],
      bridgingStrategies: [
        'Implemented resource-sharing systems among team members',
        'Created skill exchanges where everyone could contribute and learn',
        'Established equity-focused decision-making processes',
        'Built in recognition systems that valued all types of contributions'
      ],
      outcomes: [
        'Achieved 100% team retention across socioeconomic backgrounds',
        'Created peer support network that extended beyond project scope',
        'Developed inclusive practices adopted by other community organizations',
        'Generated measurable improvement in participant life outcomes'
      ],
      lessonsLearned: 'Equity requires intentional design of systems and processes, not just good intentions.'
    }
  ];

  // Hard coded adaptability stories showing before/after transformation
  const adaptabilityStories: AdaptabilityStory[] = [
    {
      id: 'project-pivot',
      originalPlan: 'Build a traditional web-based garden management system with standard CRUD functionality for plot tracking and harvest logging.',
      disruption: 'Community feedback revealed that the target users had unreliable internet access and preferred collaborative rather than individual plot management.',
      signals: [
        'Low engagement with initial prototypes during user testing',
        'Repeated requests for offline functionality during stakeholder meetings',
        'Observation that community gardening was inherently social, not individual',
        'Discovery that existing paper-based systems were actually working well for core functions'
      ],
      pivotStrategy: 'Shifted from replacing existing systems to augmenting them with technology that amplified community connection and worked in low-connectivity environments.',
      newApproach: 'Developed offline-first progressive web app focused on community storytelling, knowledge sharing, and collective decision-making rather than individual task management.',
      results: [
        'User engagement increased from 23% to 89% after pivot',
        'Community reported stronger social connections through the platform',
        'System successfully handled 6 months of intermittent connectivity issues',
        'Project became model for rural technology development'
      ],
      metacognition: 'I learned to distinguish between user needs (community connection) and user requests (feature specifications), and to recognize when my assumptions about the problem space were incorrect.'
    },
    {
      id: 'pandemic-adaptation',
      originalPlan: 'Conduct all community engagement through in-person workshops and face-to-face user interviews to build trust and gather authentic feedback.',
      disruption: 'COVID-19 lockdowns eliminated possibility of in-person gatherings while simultaneously increasing community need for connection tools.',
      signals: [
        'Sudden cancellation of all scheduled in-person activities',
        'Community members expressing increased isolation and disconnection',
        'Existing digital divide becoming more pronounced and problematic',
        'Urgent need for community coordination tools for mutual aid'
      ],
      pivotStrategy: 'Transformed community engagement from in-person to hybrid model while addressing digital equity issues head-on.',
      newApproach: 'Created multi-channel engagement system: phone trees for less digital-comfortable members, video calls for tech-comfortable participants, and outdoor distanced meetings when possible.',
      results: [
        'Maintained 100% community participation throughout lockdown period',
        'Actually increased participation from previously mobility-limited members',
        'Developed digital skills training program adopted by local library',
        'Created more inclusive engagement model than original in-person only approach'
      ],
      metacognition: 'Constraints often reveal better solutions than unlimited options. The forced pivot created a more inclusive system than I would have designed without the disruption.'
    }
  ];

  // Hard coded learning agility indicators with meta-learning examples
  const learningAgilityIndicators: LearningAgilityIndicator[] = [
    {
      id: 'machine-learning',
      learningContext: 'Needed to implement matching algorithm for study group project but had no formal ML background',
      knowledgeSource: 'Combination of online courses, academic papers, open-source code repositories, and mentorship from CS graduate students',
      acquisitionMethod: 'Built progressively complex prototypes while learning theory, starting with simple rule-based matching and evolving to ML-powered recommendations',
      transferExample: 'Applied learned clustering techniques to community garden plot optimization and resource allocation challenges',
      teachingEvidence: 'Created workshop series teaching basic ML concepts to community members interested in data-driven decision making',
      improvement: 'Algorithm accuracy improved from 52% to 89% over 4 months of iteration and learning',
      timeframe: '4 months from zero knowledge to production implementation'
    },
    {
      id: 'conflict-resolution',
      learningContext: 'Encountered repeated team conflicts that my natural problem-solving approach was not resolving effectively',
      knowledgeSource: 'Mediation training workshops, psychology literature on group dynamics, observation of skilled facilitators, and practice with mentor feedback',
      acquisitionMethod: 'Systematic study of conflict resolution frameworks combined with deliberate practice in low-stakes situations before applying to high-stakes team conflicts',
      transferExample: 'Applied learned techniques to family discussions, roommate negotiations, and volunteer organization leadership challenges',
      teachingEvidence: 'Became go-to mediator for other student project teams and created conflict resolution workshop for campus organizations',
      improvement: 'Team conflict resolution success rate improved from 30% to 85% using learned frameworks',
      timeframe: '6 months from recognizing knowledge gap to competent application'
    },
    {
      id: 'cultural-competency',
      learningContext: 'Realized my communication style was ineffective with community members from different cultural backgrounds',
      knowledgeSource: 'Cultural anthropology readings, community elder mentorship, cross-cultural communication workshops, and reflective practice with feedback',
      acquisitionMethod: 'Immersive learning through community participation combined with formal study of cultural dimensions and communication patterns',
      transferExample: 'Applied cultural intelligence principles to international student orientation programs and multicultural team projects',
      teachingEvidence: 'Developed cultural competency training module for student organization leaders and tech volunteer programs',
      improvement: 'Cross-cultural collaboration effectiveness increased from 45% to 92% based on stakeholder feedback',
      timeframe: '8 months of continuous learning and practice'
    }
  ];

  const selectedCommunicationData = communicationExamples.find(c => c.id === selectedCommunication)!;
  const selectedCulturalData = culturalIntelligenceDisplays.find(c => c.id === selectedCultural)!;
  const selectedAdaptabilityData = adaptabilityStories.find(a => a.id === selectedAdaptability)!;
  const selectedLearningData = learningAgilityIndicators.find(l => l.id === selectedLearning)!;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Soft Skills Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">94%</div>
            <div className="text-xs text-muted-foreground">Communication Effectiveness</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Globe className="h-8 w-8 mx-auto text-success mb-2" />
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-muted-foreground">Cultural Intelligence</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">95%</div>
            <div className="text-xs text-muted-foreground">Adaptability Score</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 mx-auto text-warning mb-2" />
            <div className="text-2xl font-bold">89%</div>
            <div className="text-xs text-muted-foreground">Learning Agility</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="communication" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-xl border border-border/50">
          <TabsTrigger value="communication" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <MessageCircle className="h-4 w-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="cultural" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Globe className="h-4 w-4" />
            Cultural Intelligence
          </TabsTrigger>
          <TabsTrigger value="adaptability" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Zap className="h-4 w-4" />
            Adaptability
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4" />
            Learning Agility
          </TabsTrigger>
        </TabsList>

        {/* Communication Showcase */}
        <TabsContent value="communication" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Example Selector */}
            <div className="space-y-4">
              {communicationExamples.map((example) => (
                <Card 
                  key={example.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-large ${
                    selectedCommunication === example.id ? 'ring-2 ring-primary shadow-large' : ''
                  }`}
                  onClick={() => setSelectedCommunication(example.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{example.scenario}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{example.context}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">{example.skillsDemonstrated.length} skills</Badge>
                      <Badge variant="outline" className="text-xs">Evidence Available</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Example Details */}
            <div className="lg:col-span-2">
              <Card className="glass-card shadow-large">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    {selectedCommunicationData.scenario}
                  </CardTitle>
                  <CardDescription>{selectedCommunicationData.context}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Challenge */}
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Challenge
                    </h4>
                    <p className="text-sm">{selectedCommunicationData.challenge}</p>
                  </div>

                  {/* Approach */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Strategic Approach
                    </h4>
                    <p className="text-sm mb-3">{selectedCommunicationData.approach}</p>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Specific Techniques:</h5>
                      {selectedCommunicationData.techniques.map((technique, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{technique}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcome & Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                      <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Outcome
                      </h4>
                      <p className="text-sm">{selectedCommunicationData.outcome}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Evidence
                      </h4>
                      <p className="text-sm">{selectedCommunicationData.evidence}</p>
                    </div>
                  </div>

                  {/* Skills Demonstrated */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-warning" />
                      Skills Demonstrated
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCommunicationData.skillsDemonstrated.map((skill) => (
                        <Badge key={skill} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Cultural Intelligence Display */}
        <TabsContent value="cultural" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {culturalIntelligenceDisplays.map((display) => (
              <Card 
                key={display.id}
                className={`glass-card cursor-pointer transition-all duration-300 hover:shadow-large ${
                  selectedCultural === display.id ? 'ring-2 ring-success shadow-large' : ''
                }`}
                onClick={() => setSelectedCultural(display.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                      <Globe className="h-5 w-5" />
                    </div>
                    {display.situation}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cultural Factors */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Compass className="h-4 w-4 text-primary" />
                      Cultural Factors
                    </h4>
                    <div className="space-y-1">
                      {display.culturalFactors.map((factor, index) => (
                        <div key={index} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adaptations */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      Adaptations Made
                    </h4>
                    <div className="space-y-1">
                      {display.adaptations.map((adaptation, index) => (
                        <div key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                          {adaptation}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bridging Strategies */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-warning" />
                      Bridging Strategies
                    </h4>
                    <div className="space-y-1">
                      {display.bridgingStrategies.map((strategy, index) => (
                        <div key={index} className="text-sm flex items-start gap-2">
                          <Star className="h-3 w-3 text-warning mt-1 flex-shrink-0" />
                          {strategy}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcomes */}
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Outcomes
                    </h4>
                    <div className="space-y-1">
                      {display.outcomes.map((outcome, index) => (
                        <div key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                          {outcome}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lessons Learned */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Key Insight
                    </h4>
                    <p className="text-sm italic">"{display.lessonsLearned}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Adaptability Stories */}
        <TabsContent value="adaptability" className="space-y-6">
          <div className="space-y-6">
            {adaptabilityStories.map((story) => (
              <Card 
                key={story.id}
                className={`glass-card cursor-pointer transition-all duration-300 hover:shadow-large ${
                  selectedAdaptability === story.id ? 'ring-2 ring-accent shadow-large' : ''
                }`}
                onClick={() => setSelectedAdaptability(story.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-white shadow-soft">
                      <Zap className="h-5 w-5" />
                    </div>
                    Adaptability Case Study
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Before & After Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Original Plan
                      </h4>
                      <p className="text-sm text-muted-foreground">{story.originalPlan}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        New Approach
                      </h4>
                      <p className="text-sm">{story.newApproach}</p>
                    </div>
                  </div>

                  {/* Disruption */}
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Disruption
                    </h4>
                    <p className="text-sm">{story.disruption}</p>
                  </div>

                  {/* Early Warning Signals */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Early Warning Signals Recognized
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {story.signals.map((signal, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Ear className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pivot Strategy */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Compass className="h-4 w-4" />
                      Pivot Strategy
                    </h4>
                    <p className="text-sm">{story.pivotStrategy}</p>
                  </div>

                  {/* Results */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Results Achieved
                    </h4>
                    <div className="space-y-2">
                      {story.results.map((result, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meta-Cognition */}
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Meta-Cognitive Reflection
                    </h4>
                    <p className="text-sm italic">"{story.metacognition}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Learning Agility Indicators */}
        <TabsContent value="learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Learning Example Selector */}
            <div className="space-y-4">
              {learningAgilityIndicators.map((indicator) => (
                <Card 
                  key={indicator.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-large ${
                    selectedLearning === indicator.id ? 'ring-2 ring-warning shadow-large' : ''
                  }`}
                  onClick={() => setSelectedLearning(indicator.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{indicator.learningContext}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">{indicator.timeframe}</Badge>
                      <Badge variant="outline" className="text-xs">Teaching Evidence</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Learning Details */}
            <div className="lg:col-span-2">
              <Card className="glass-card shadow-large">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-warning to-warning/80 text-white shadow-soft">
                      <Brain className="h-5 w-5" />
                    </div>
                    Learning Agility Example
                  </CardTitle>
                  <CardDescription>{selectedLearningData.learningContext}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Learning Approach */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Knowledge Source
                      </h4>
                      <p className="text-sm">{selectedLearningData.knowledgeSource}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                      <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                        <Puzzle className="h-4 w-4" />
                        Acquisition Method
                      </h4>
                      <p className="text-sm">{selectedLearningData.acquisitionMethod}</p>
                    </div>
                  </div>

                  {/* Transfer & Teaching */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Knowledge Transfer
                      </h4>
                      <p className="text-sm">{selectedLearningData.transferExample}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                      <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Teaching Evidence
                      </h4>
                      <p className="text-sm">{selectedLearningData.teachingEvidence}</p>
                    </div>
                  </div>

                  {/* Improvement & Timeline */}
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                    <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Measurable Improvement
                    </h4>
                    <p className="text-sm mb-2">{selectedLearningData.improvement}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Timeline: {selectedLearningData.timeframe}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};