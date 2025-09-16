import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Mountain
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

// Mock data for comprehensive portfolio analytics - This represents deep insights from student project narratives
const portfolioData = [
  {
    id: 1,
    title: "Community Garden Network App",
    type: "Technical Leadership",
    category: "Social Impact Tech",
    completedDate: "2024-06-15",
    verified: true,
    projectPhase: "Launched & Scaling",
    
    // Enhanced Overview Data
    overview: {
      description: "A comprehensive platform connecting urban gardeners, featuring real-time crop tracking, community knowledge sharing, and sustainability impact measurement",
      impactStory: {
        genesis: "Started after witnessing food deserts in my neighborhood during pandemic",
        evolution: [
          { phase: "Discovery", milestone: "Interviewed 50+ community members", impact: "Identified core need for connection" },
          { phase: "Prototype", milestone: "Built MVP with React/Node.js", impact: "Validated concept with 20 beta users" },
          { phase: "Launch", milestone: "Deployed to 3 neighborhoods", impact: "200+ active users in first month" },
          { phase: "Scale", milestone: "Partnership with city government", impact: "Expanded to 8 neighborhoods, 500+ users" }
        ],
        breakthrough: "Realized that success wasn't just about tech - it was about building genuine community trust"
      },
      stakeholderEcosystem: [
        { role: "Community Members", count: 500, relationship: "Primary Users", influence: "High" },
        { role: "Local Government", count: 3, relationship: "Strategic Partner", influence: "High" },
        { role: "Environmental NGOs", count: 5, relationship: "Content Partners", influence: "Medium" },
        { role: "Tech Mentors", count: 2, relationship: "Technical Advisors", influence: "Medium" },
        { role: "Local Businesses", count: 8, relationship: "Sponsors", influence: "Low" }
      ],
      metricsEvolution: {
        userGrowth: [
          { month: "Jan", users: 0, retention: 0, engagement: 0 },
          { month: "Feb", users: 20, retention: 95, engagement: 78 },
          { month: "Mar", users: 85, retention: 87, engagement: 82 },
          { month: "Apr", users: 200, retention: 81, engagement: 75 },
          { month: "May", users: 350, retention: 79, engagement: 79 },
          { month: "Jun", users: 500, retention: 83, engagement: 84 }
        ]
      },
      verification: {
        demoLink: "https://communitygarden.demo",
        mediaFeatures: ["Local News Interview", "City Council Presentation", "University Tech Showcase"],
        testimonials: [
          { name: "Maria Santos", role: "Community Leader", quote: "This app transformed how our neighborhood connects around food sustainability" },
          { name: "Dr. James Liu", role: "Urban Planning Professor", quote: "Remarkable integration of technology with grassroots community organizing" }
        ],
        certificates: ["Winner - Civic Tech Challenge 2024", "Featured - Social Impact Showcase"]
      },
      applicationReadiness: {
        essayPotential: 95,
        interviewStories: 8,
        uniquenessScore: 92,
        leadershipEvidence: "Strong",
        impactDocumentation: "Comprehensive"
      }
    },

    // Deep Skills Analytics
    skills: {
      developmentJourney: [
        {
          skill: "Full-Stack Development",
          phases: [
            { phase: "Beginner", duration: "Month 1", evidence: "Built first React component", proficiency: 20 },
            { phase: "Intermediate", duration: "Month 2-3", evidence: "Created REST API with authentication", proficiency: 60 },
            { phase: "Advanced", duration: "Month 4-6", evidence: "Implemented real-time features, deployed to production", proficiency: 85 }
          ],
          marketValue: "High",
          transferability: ["Web Development", "Mobile Apps", "Data Visualization"],
          uniqueApplication: "Applied to social impact context with community-centered design"
        },
        {
          skill: "Community Engagement",
          phases: [
            { phase: "Novice", duration: "Month 1", evidence: "Conducted initial interviews", proficiency: 30 },
            { phase: "Developing", duration: "Month 2-4", evidence: "Facilitated community meetings", proficiency: 70 },
            { phase: "Proficient", duration: "Month 5-6", evidence: "Led partnership negotiations with city", proficiency: 90 }
          ],
          marketValue: "Very High",
          transferability: ["Public Relations", "Non-profit Management", "Policy Advocacy"],
          uniqueApplication: "Bridged technical and community perspectives in urban planning"
        }
      ],
      competencyNetwork: [
        { skill: "React.js", level: 85, connections: ["Node.js", "UI/UX Design", "Data Visualization"] },
        { skill: "Node.js", level: 80, connections: ["Database Design", "API Development", "Security"] },
        { skill: "Community Organizing", level: 90, connections: ["Public Speaking", "Project Management", "Empathy"] },
        { skill: "Data Analysis", level: 75, connections: ["Research Methods", "Storytelling", "Policy Understanding"] },
        { skill: "UI/UX Design", level: 70, connections: ["User Research", "Accessibility", "Visual Communication"] }
      ],
      learningStyle: {
        primary: "Hands-on Builder",
        indicators: [
          "Built prototype immediately after learning concept",
          "Learned through real user feedback cycles",
          "Preference for pair programming with mentors"
        ],
        recommendations: ["Continue project-based learning", "Seek technical mentorship", "Join maker communities"]
      },
      softSkillsEvidence: {
        leadership: [
          { moment: "Convinced skeptical community leader to join advisory board", skill: "Persuasion & Vision" },
          { moment: "Mediated disagreement between technical team and community stakeholders", skill: "Conflict Resolution" },
          { moment: "Motivated team during technical setbacks in month 3", skill: "Resilience & Motivation" }
        ],
        communication: [
          { context: "City Council Presentation", skill: "Public Speaking", outcome: "Secured $5K funding" },
          { context: "Technical Documentation", skill: "Written Communication", outcome: "Enabled 2 new developers to contribute" },
          { context: "Community Workshops", skill: "Teaching", outcome: "Trained 30+ users on platform" }
        ]
      }
    },

    // Story Intelligence
    narrative: {
      personalBrandArchitecture: {
        coreIdentity: "Tech-enabled Community Builder",
        valueProposition: "Bridges digital innovation with grassroots social impact",
        differentiators: ["Technical depth + Community trust", "Environmental passion + Pragmatic execution", "Individual contributor + Systems thinker"],
        brandConsistency: 94
      },
      storyArcAnalysis: {
        characterDevelopment: [
          { stage: "Call to Adventure", story: "Witnessing food insecurity during pandemic sparked desire to act" },
          { stage: "Initial Struggle", story: "First attempts at community organizing failed due to lack of trust" },
          { stage: "Mentor Guidance", story: "Local community leader taught me to listen before building" },
          { stage: "Skills Development", story: "Learned full-stack development to build the solution I envisioned" },
          { stage: "Community Building", story: "Realized technology alone wasn't enough - had to build relationships first" },
          { stage: "Impact & Growth", story: "Project now supports 500+ families and influenced city policy" }
        ],
        thematicConsistency: 91,
        growthEvidence: "Clear progression from individual contributor to community leader"
      },
      authenticityIndicators: {
        passionConsistency: 95,
        valueAlignment: [
          { stated: "Environmental Sustainability", demonstrated: "Measured and reduced food waste by 30%" },
          { stated: "Community Empowerment", demonstrated: "Trained community members to become platform leaders" },
          { stated: "Inclusive Technology", demonstrated: "Designed for low-bandwidth, multilingual access" }
        ],
        authenticityConcerns: []
      },
      collegeEssayGoldmine: {
        powerfulMoments: [
          { moment: "The day Mrs. Rodriguez asked me why a 17-year-old cared about her vegetable garden", 
            essayPotential: "Personal statement opener", emotionalResonance: "High" },
          { moment: "Realizing my first app prototype completely missed what the community actually needed", 
            essayPotential: "Failure/growth essay", lessonLearned: "Humility and user-centered design" },
          { moment: "Standing before city council as the youngest person to present a policy proposal", 
            essayPotential: "Leadership/impact essay", uniqueness: "Very High" }
        ],
        readyQuotes: [
          "I learned that code without community is just fancy digital art",
          "The most important debugging happened in my assumptions, not my code",
          "Success wasn't measured in user signups, but in the conversations happening in gardens"
        ]
      },
      interviewStoryBank: [
        {
          situation: "Community was skeptical of teen with tech solution",
          task: "Build trust and prove value of digital platform",
          action: "Spent 2 months attending community meetings, learning before building",
          result: "Gained advisory board support and 95% user retention rate",
          interviewFit: ["Leadership", "Overcoming Challenges", "Community Impact"]
        },
        {
          situation: "Technical architecture couldn't handle unexpected growth",
          task: "Scale system while maintaining user experience",
          action: "Learned advanced backend concepts, migrated to cloud architecture",
          result: "Platform now supports 10x original capacity with 99.9% uptime",
          interviewFit: ["Problem Solving", "Technical Skills", "Growth Mindset"]
        }
      ]
    },

    // AI-Powered Deep Insights
    insights: {
      predictiveAnalytics: {
        careerTrajectory: [
          { path: "Social Impact Tech Entrepreneur", probability: 85, reasoning: "Strong blend of technical skills and community focus" },
          { path: "Urban Planning Technology Specialist", probability: 78, reasoning: "Demonstrated interest in civic technology and policy" },
          { path: "Product Manager at Mission-Driven Company", probability: 72, reasoning: "Proven ability to bridge technical and user needs" }
        ],
        skillDevelopmentPredictions: [
          { skill: "Policy & Advocacy", growth: 65, timeline: "Next 12 months", trigger: "Continued government partnership" },
          { skill: "Team Leadership", growth: 80, timeline: "Next 6 months", trigger: "Project scaling requires delegation" },
          { skill: "Data Science", growth: 55, timeline: "Next 18 months", trigger: "Need for impact measurement analytics" }
        ]
      },
      admissionsAdvantage: {
        competitivePositioning: "Top 5% for social impact + technical depth combination",
        schoolFitAnalysis: [
          { school: "Stanford", fit: 92, reasoning: "Perfect match for d.school and CS+Social Good programs" },
          { school: "MIT", fit: 88, reasoning: "Strong technical foundation, growing social impact focus" },
          { school: "UC Berkeley", fit: 95, reasoning: "Excellent public service mission alignment and technical rigor" }
        ],
        differentiationFactors: [
          "Rare combination of technical depth and authentic community leadership",
          "Measurable social impact at young age with scaling evidence",
          "Bridge-builder between technology and traditionally underserved communities"
        ]
      },
      innovationQuotient: {
        score: 87,
        evidence: [
          "Novel application of real-time data to community organizing",
          "Creative solution to trust-building through gradual engagement",
          "Integration of environmental impact measurement with social platform"
        ],
        patterns: ["Systems thinking", "User-centered innovation", "Community-first technology design"],
        nextLevelPotential: "High - shows signs of breakthrough thinking in civic technology"
      },
      riskAssessment: {
        potentialConcerns: [
          { concern: "Over-commitment", severity: "Low", mitigation: "Shows good time management and delegation skills" },
          { concern: "Technical depth vs breadth", severity: "Medium", mitigation: "Recommend focused skill development in next phase" }
        ],
        strengthAreas: ["Leadership authenticity", "Impact measurement", "Community relationships", "Technical execution"]
      },
      developmentRecommendations: [
        { category: "Academic", action: "Take courses in urban planning or public policy", priority: "High", reasoning: "Complement technical skills with policy understanding" },
        { category: "Leadership", action: "Seek mentorship with social enterprise leaders", priority: "High", reasoning: "Scale leadership skills to match project growth" },
        { category: "Technical", action: "Learn data science for impact measurement", priority: "Medium", reasoning: "Enhance ability to demonstrate and optimize impact" },
        { category: "Network", action: "Join civic technology communities", priority: "Medium", reasoning: "Connect with like-minded innovators and potential collaborators" }
      ]
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
    
    overview: {
      description: "Comprehensive peer support program addressing youth mental health crisis through trained peer counselors and community-based intervention",
      impactStory: {
        genesis: "Personal experience with anxiety and witnessing friends struggle without adequate support",
        evolution: [
          { phase: "Research", milestone: "Studied 200+ hours of mental health literature", impact: "Understood evidence-based peer support models" },
          { phase: "Training", milestone: "Completed crisis intervention certification", impact: "Gained credible skills for peer support" },
          { phase: "Pilot", milestone: "Launched with 15 peer counselors", impact: "Supported 60 students in first semester" },
          { phase: "Validation", milestone: "Documented 85% improvement in reported wellbeing", impact: "Proved program effectiveness" },
          { phase: "Expansion", milestone: "Adopted by 3 additional schools", impact: "Now serves 300+ students across district" }
        ],
        breakthrough: "Discovered that peer support was more effective than adult counseling for many teens"
      },
      stakeholderEcosystem: [
        { role: "Student Participants", count: 300, relationship: "Primary Beneficiaries", influence: "High" },
        { role: "Peer Counselors", count: 45, relationship: "Program Leaders", influence: "High" },
        { role: "School Administrators", count: 12, relationship: "Institutional Partners", influence: "High" },
        { role: "Mental Health Professionals", count: 8, relationship: "Clinical Supervisors", influence: "High" },
        { role: "Parent/Guardian Network", count: 200, relationship: "Support System", influence: "Medium" }
      ],
      metricsEvolution: {
        programGrowth: [
          { month: "Jan", participants: 15, counselors: 5, wellbeingScore: 0 },
          { month: "Feb", participants: 35, counselors: 8, wellbeingScore: 72 },
          { month: "Mar", participants: 60, counselors: 12, wellbeingScore: 78 },
          { month: "Apr", participants: 95, counselors: 18, wellbeingScore: 81 },
          { month: "May", participants: 150, counselors: 25, wellbeingScore: 84 },
          { month: "Jun", participants: 220, counselors: 35, wellbeingScore: 87 },
          { month: "Jul", participants: 280, counselors: 42, wellbeingScore: 89 },
          { month: "Aug", participants: 300, counselors: 45, wellbeingScore: 91 }
        ]
      },
      verification: {
        demoLink: "https://peermentalhealth.org",
        mediaFeatures: ["State Education Department Case Study", "National Peer Support Conference Presentation", "Local Mental Health Awareness Campaign"],
        testimonials: [
          { name: "Dr. Sarah Chen", role: "School Psychologist", quote: "This program reaches students who wouldn't normally seek help through traditional channels" },
          { name: "Alex Rivera", role: "Program Participant", quote: "Having someone my age who understood what I was going through made all the difference" }
        ],
        certificates: ["Crisis Intervention Specialist", "Peer Support Facilitator Certification", "Youth Mental Health First Aid"]
      },
      applicationReadiness: {
        essayPotential: 98,
        interviewStories: 12,
        uniquenessScore: 89,
        leadershipEvidence: "Exceptional",
        impactDocumentation: "Comprehensive with clinical backing"
      }
    },

    skills: {
      developmentJourney: [
        {
          skill: "Crisis Intervention",
          phases: [
            { phase: "Training", duration: "Month 1-2", evidence: "40-hour certification program", proficiency: 45 },
            { phase: "Supervised Practice", duration: "Month 3-4", evidence: "20 supervised peer sessions", proficiency: 70 },
            { phase: "Independent Practice", duration: "Month 5-8", evidence: "Led 100+ peer support sessions", proficiency: 90 }
          ],
          marketValue: "Very High",
          transferability: ["Social Work", "Counseling", "Human Resources", "Conflict Resolution"],
          uniqueApplication: "Developed age-appropriate intervention techniques for teens"
        },
        {
          skill: "Program Development & Scaling",
          phases: [
            { phase: "Planning", duration: "Month 1", evidence: "Created comprehensive program framework", proficiency: 30 },
            { phase: "Implementation", duration: "Month 2-4", evidence: "Launched pilot with measurable outcomes", proficiency: 65 },
            { phase: "Optimization", duration: "Month 5-8", evidence: "Scaled to 3 schools with maintained quality", proficiency: 85 }
          ],
          marketValue: "High",
          transferability: ["Non-profit Management", "Public Health", "Educational Administration"],
          uniqueApplication: "Adapted evidence-based models for high school environment"
        }
      ],
      competencyNetwork: [
        { skill: "Active Listening", level: 95, connections: ["Empathy", "Communication", "Trust Building"] },
        { skill: "Program Management", level: 85, connections: ["Leadership", "Strategic Planning", "Quality Assurance"] },
        { skill: "Data Analysis", level: 78, connections: ["Research Methods", "Outcome Measurement", "Evidence-Based Practice"] },
        { skill: "Public Speaking", level: 88, connections: ["Advocacy", "Training", "Community Engagement"] },
        { skill: "Mental Health Literacy", level: 92, connections: ["Crisis Intervention", "Peer Support", "Trauma-Informed Care"] }
      ],
      learningStyle: {
        primary: "Reflective Practitioner",
        indicators: [
          "Processed difficult sessions through structured reflection",
          "Continuously improved approach based on participant feedback",
          "Integrated research literature with practical experience"
        ],
        recommendations: ["Continue case study analysis", "Seek advanced training opportunities", "Document lessons learned"]
      },
      softSkillsEvidence: {
        leadership: [
          { moment: "Convinced school administration to approve controversial peer support program", skill: "Advocacy & Persistence" },
          { moment: "Trained 40+ peer counselors while maintaining program quality", skill: "Training & Development" },
          { moment: "Navigated ethical dilemmas while maintaining participant trust", skill: "Ethical Reasoning" }
        ],
        communication: [
          { context: "Crisis Intervention", skill: "Active Listening", outcome: "De-escalated 15+ crisis situations" },
          { context: "Program Training", skill: "Teaching", outcome: "95% of trainees met competency standards" },
          { context: "Administrative Meetings", skill: "Professional Communication", outcome: "Secured program expansion funding" }
        ]
      }
    },

    narrative: {
      personalBrandArchitecture: {
        coreIdentity: "Empathetic Systems Builder",
        valueProposition: "Transforms personal struggles into community healing through evidence-based peer support",
        differentiators: ["Clinical knowledge + Peer authenticity", "Individual healing + System change", "Research-minded + Emotionally intelligent"],
        brandConsistency: 96
      },
      storyArcAnalysis: {
        characterDevelopment: [
          { stage: "Personal Crisis", story: "Own struggle with anxiety revealed gaps in school mental health support" },
          { stage: "Learning & Growth", story: "Committed to understanding mental health through research and training" },
          { stage: "Service to Others", story: "Used lived experience to help peers in similar situations" },
          { stage: "System Building", story: "Recognized need to create sustainable support structures" },
          { stage: "Evidence & Impact", story: "Documented program effectiveness to ensure replication" },
          { stage: "Scaling Vision", story: "Now working to implement model across entire school district" }
        ],
        thematicConsistency: 97,
        growthEvidence: "Transformed personal vulnerability into powerful community leadership"
      },
      authenticityIndicators: {
        passionConsistency: 98,
        valueAlignment: [
          { stated: "Mental Health Destigmatization", demonstrated: "Publicly shared own mental health journey" },
          { stated: "Peer Empowerment", demonstrated: "Trained 45 students as peer counselors rather than doing all support personally" },
          { stated: "Evidence-Based Practice", demonstrated: "Required program evaluation and outcome measurement" }
        ],
        authenticityConcerns: []
      },
      collegeEssayGoldmine: {
        powerfulMoments: [
          { moment: "The night I realized my own therapist couldn't understand my experience the way a peer could", 
            essayPotential: "Personal statement centerpiece", emotionalResonance: "Very High" },
          { moment: "First time a participant told me our session saved their life", 
            essayPotential: "Impact/purpose essay", uniqueness: "High" },
          { moment: "Presenting program data to skeptical school board members", 
            essayPotential: "Overcoming obstacles essay", leadership: "Strong" }
        ],
        readyQuotes: [
          "I learned that healing happens not in isolation, but in the space between people who understand",
          "The most powerful interventions come from those who have walked the same path",
          "Data without heart is just numbers; empathy without evidence is just good intentions"
        ]
      },
      interviewStoryBank: [
        {
          situation: "School administration resistant to peer mental health program due to liability concerns",
          task: "Demonstrate program safety and effectiveness to gain approval",
          action: "Developed comprehensive training program, safety protocols, and outcome measurement system",
          result: "Program approved and now serves as model for district-wide implementation",
          interviewFit: ["Leadership", "Problem Solving", "Advocacy", "Innovation"]
        },
        {
          situation: "Participant in acute mental health crisis during peer session",
          task: "Provide immediate support while ensuring professional intervention",
          action: "Applied crisis intervention training, connected to professional resources, followed up for continuity",
          result: "Participant received appropriate care and continued in program with improved coping skills",
          interviewFit: ["Crisis Management", "Ethical Decision Making", "Professional Judgment"]
        }
      ]
    },

    insights: {
      predictiveAnalytics: {
        careerTrajectory: [
          { path: "Clinical Psychology/Therapy", probability: 88, reasoning: "Strong clinical interest with peer support foundation" },
          { path: "Public Health Policy", probability: 82, reasoning: "Systems-level thinking and program development skills" },
          { path: "Social Work Administration", probability: 75, reasoning: "Program management experience with vulnerable populations" }
        ],
        skillDevelopmentPredictions: [
          { skill: "Research & Evaluation", growth: 70, timeline: "Next 12 months", trigger: "Need to document program outcomes for replication" },
          { skill: "Grant Writing", growth: 85, timeline: "Next 6 months", trigger: "Program expansion requires funding" },
          { skill: "Policy Advocacy", growth: 60, timeline: "Next 18 months", trigger: "Opportunity to influence state mental health policy" }
        ]
      },
      admissionsAdvantage: {
        competitivePositioning: "Top 3% for authentic mental health leadership with clinical foundation",
        schoolFitAnalysis: [
          { school: "Yale", fit: 94, reasoning: "Exceptional psychology program and social impact focus" },
          { school: "Harvard", fit: 89, reasoning: "Strong public health opportunities and clinical research" },
          { school: "Northwestern", fit: 91, reasoning: "Excellent psychology and social policy programs" }
        ],
        differentiationFactors: [
          "Rare combination of lived experience, clinical training, and program development",
          "Documented measurable impact on peer mental health outcomes",
          "Bridge between clinical expertise and peer authenticity"
        ]
      },
      innovationQuotient: {
        score: 91,
        evidence: [
          "Adapted adult peer support models for teen development stages",
          "Created hybrid clinical/peer support model with safety protocols",
          "Developed outcome measurement system appropriate for peer programs"
        ],
        patterns: ["Evidence-based innovation", "Trauma-informed system design", "Peer empowerment methodology"],
        nextLevelPotential: "Very High - positioned to influence broader mental health policy and practice"
      },
      riskAssessment: {
        potentialConcerns: [
          { concern: "Emotional burnout", severity: "Medium", mitigation: "Strong self-care practices and clinical supervision evident" },
          { concern: "Over-identification with participant struggles", severity: "Low", mitigation: "Demonstrates professional boundaries and referral skills" }
        ],
        strengthAreas: ["Clinical judgment", "Program sustainability", "Ethical reasoning", "Impact measurement"]
      },
      developmentRecommendations: [
        { category: "Academic", action: "Take advanced psychology and research methods courses", priority: "High", reasoning: "Build foundation for graduate study in clinical psychology" },
        { category: "Professional", action: "Seek internship with mental health policy organization", priority: "High", reasoning: "Connect direct service experience with policy impact" },
        { category: "Leadership", action: "Present at national peer support conferences", priority: "Medium", reasoning: "Share innovations with broader field" },
        { category: "Personal", action: "Maintain own therapy and self-care practices", priority: "High", reasoning: "Model healthy boundaries and continued growth" }
      ]
    }
  }
];

export const PortfolioMetricsDashboard = () => {
  const ProjectCard = ({ project }: { project: typeof portfolioData[0] }) => {
    const [activeTab, setActiveTab] = useState("overview");

    return (
      <Card className="w-full hover:shadow-strong transition-all duration-500 border-0 gradient-card-primary text-white overflow-hidden">
        <CardHeader className="pb-4 relative">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-project-accent opacity-20 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">{project.title}</CardTitle>
              <CardDescription className="flex items-center gap-3 text-white/80">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {project.type}
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white/90">
                  {project.category}
                </Badge>
                <span className="text-sm">{project.projectPhase}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={project.verified ? "default" : "secondary"} 
                     className={project.verified ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                {project.verified ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                {project.verified ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="text-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                <Brain className="h-4 w-4 mr-2" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="narrative" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                <BookOpen className="h-4 w-4 mr-2" />
                Narrative
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                <Sparkles className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* ENHANCED OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="space-y-6">
                <p className="text-white/90 text-lg leading-relaxed">{project.overview.description}</p>
                
                {/* Project Impact Story Canvas */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Compass className="h-5 w-5" />
                      Impact Story Canvas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="mb-4">
                      <p className="text-white/80 font-medium mb-2">Genesis Moment</p>
                      <p className="text-white/90 italic">&ldquo;{project.overview.impactStory.genesis}&rdquo;</p>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-white/80 font-medium">Evolution Timeline</p>
                      <div className="relative">
                        {project.overview.impactStory.evolution.map((phase, i) => (
                          <div key={i} className="flex items-start gap-4 mb-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-secondary flex items-center justify-center text-white font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="border-white/30 text-white/90">{phase.phase}</Badge>
                                <span className="text-white/80 text-sm font-medium">{phase.milestone}</span>
                              </div>
                              <p className="text-white/90 text-sm">{phase.impact}</p>
                            </div>
                            {i < project.overview.impactStory.evolution.length - 1 && (
                              <div className="absolute left-4 top-8 w-0.5 h-6 bg-white/20"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-accent/20 border border-accent/30">
                      <p className="text-white/80 font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Key Breakthrough
                      </p>
                      <p className="text-white/90 italic">&ldquo;{project.overview.impactStory.breakthrough}&rdquo;</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stakeholder Ecosystem Map */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Stakeholder Ecosystem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.overview.stakeholderEcosystem.map((stakeholder, i) => (
                        <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{stakeholder.role}</h4>
                            <Badge variant="outline" className={`border-white/30 text-xs ${
                              stakeholder.influence === 'High' ? 'text-success bg-success/20' :
                              stakeholder.influence === 'Medium' ? 'text-warning bg-warning/20' :
                              'text-white/70 bg-white/10'
                            }`}>
                              {stakeholder.influence}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/80">{stakeholder.relationship}</span>
                            <span className="text-white font-medium">{stakeholder.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics Evolution */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Impact Metrics Evolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={project.overview.metricsEvolution.userGrowth || project.overview.metricsEvolution.programGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.8)" />
                        <YAxis stroke="rgba(255,255,255,0.8)" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white'
                          }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ fill: "hsl(var(--secondary))" }} />
                        <Line type="monotone" dataKey="participants" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ fill: "hsl(var(--secondary))" }} />
                        <Line type="monotone" dataKey="retention" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
                        <Line type="monotone" dataKey="engagement" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
                        <Line type="monotone" dataKey="wellbeingScore" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Verification & Evidence Hub */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Verification & Evidence Hub
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Media Features
                        </h4>
                        <div className="space-y-2">
                          {project.overview.verification.mediaFeatures.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                              <CheckCircle className="h-3 w-3 text-success" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Certificates & Awards
                        </h4>
                        <div className="space-y-2">
                          {project.overview.verification.certificates.map((cert, i) => (
                            <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                              <Award className="h-3 w-3 text-warning" />
                              {cert}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Testimonials
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.overview.verification.testimonials.map((testimonial, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-white/90 italic text-sm mb-2">&ldquo;{testimonial.quote}&rdquo;</p>
                            <div className="text-white/70 text-xs">
                              <span className="font-medium">{testimonial.name}</span> - {testimonial.role}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* College Application Readiness */}
                <Card className="bg-gradient-score-excellent backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      College Application Readiness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">
                          {project.overview.applicationReadiness.essayPotential}%
                        </div>
                        <div className="text-white/80 text-sm">Essay Potential</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">
                          {project.overview.applicationReadiness.interviewStories}
                        </div>
                        <div className="text-white/80 text-sm">Interview Stories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">
                          {project.overview.applicationReadiness.uniquenessScore}%
                        </div>
                        <div className="text-white/80 text-sm">Uniqueness Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ENHANCED SKILLS TAB */}
            <TabsContent value="skills" className="space-y-6">
              {/* Skill Development Journeys */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Skill Development Journeys
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {project.skills.developmentJourney.map((skill, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold text-lg">{skill.skill}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-secondary/50 text-secondary">
                            {skill.marketValue} Market Value
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {skill.phases.map((phase, j) => (
                          <div key={j} className="relative flex items-start gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-secondary"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                                  {phase.phase}
                                </Badge>
                                <span className="text-white/70 text-sm">{phase.duration}</span>
                                <div className="ml-auto text-white font-semibold">
                                  {phase.proficiency}%
                                </div>
                              </div>
                              <p className="text-white/90 text-sm">{phase.evidence}</p>
                              <Progress value={phase.proficiency} className="mt-2 h-1" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-white/5">
                        <p className="text-white/80 text-sm mb-1">Unique Application:</p>
                        <p className="text-white/90 text-sm italic">{skill.uniqueApplication}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Competency Network */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Skill Interconnection Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={project.skills.competencyNetwork}>
                          <PolarGrid stroke="rgba(255,255,255,0.2)" />
                          <PolarAngleAxis dataKey="skill" tick={{ fill: 'white', fontSize: 11 }} />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]} 
                            tick={{ fill: 'white', fontSize: 10 }}
                          />
                          <Radar 
                            name="Proficiency" 
                            dataKey="level" 
                            stroke="hsl(var(--secondary))" 
                            fill="hsl(var(--secondary))" 
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-3">
                      {project.skills.competencyNetwork.map((skill, i) => (
                        <div key={i} className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{skill.skill}</span>
                            <span className="text-secondary font-bold">{skill.level}%</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {skill.connections.map((connection, j) => (
                              <Badge key={j} variant="outline" className="text-xs border-white/20 text-white/70">
                                {connection}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Style Analysis */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Learning Style Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Primary Learning Style</h4>
                      <div className="p-4 rounded-lg gradient-secondary">
                        <div className="text-xl font-bold text-white mb-2">
                          {project.skills.learningStyle.primary}
                        </div>
                        <div className="space-y-2">
                          {project.skills.learningStyle.indicators.map((indicator, i) => (
                            <div key={i} className="flex items-start gap-2 text-white/90 text-sm">
                              <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {indicator}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-3">Development Recommendations</h4>
                      <div className="space-y-2">
                        {project.skills.learningStyle.recommendations.map((rec, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5 flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            <span className="text-white/90 text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Soft Skills Evidence */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Soft Skills Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Leadership Moments
                      </h4>
                      <div className="space-y-3">
                        {project.skills.softSkillsEvidence.leadership.map((moment, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/5">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-white/90 text-sm flex-1">{moment.moment}</p>
                              <Badge variant="outline" className="border-accent/50 text-accent ml-2">
                                {moment.skill}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Communication Excellence
                      </h4>
                      <div className="space-y-3">
                        {project.skills.softSkillsEvidence.communication.map((comm, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{comm.context}</span>
                              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                                {comm.skill}
                              </Badge>
                            </div>
                            <p className="text-white/90 text-sm">{comm.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ENHANCED NARRATIVE TAB */}
            <TabsContent value="narrative" className="space-y-6">
              {/* Personal Brand Architecture */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Personal Brand Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white/80 text-sm font-medium mb-2">Core Identity</h4>
                        <div className="text-2xl font-bold text-white gradient-secondary p-4 rounded-lg text-center">
                          {project.narrative.personalBrandArchitecture.coreIdentity}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white/80 text-sm font-medium mb-3">Brand Consistency Score</h4>
                        <div className="flex items-center gap-3">
                          <Progress value={project.narrative.personalBrandArchitecture.brandConsistency} className="flex-1" />
                          <span className="text-white font-bold">
                            {project.narrative.personalBrandArchitecture.brandConsistency}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white/80 text-sm font-medium mb-3">Value Proposition</h4>
                      <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
                        <p className="text-white/90 italic text-center">
                          &ldquo;{project.narrative.personalBrandArchitecture.valueProposition}&rdquo;
                        </p>
                      </div>
                      
                      <h4 className="text-white/80 text-sm font-medium mb-3 mt-4">Key Differentiators</h4>
                      <div className="space-y-2">
                        {project.narrative.personalBrandArchitecture.differentiators.map((diff, i) => (
                          <div key={i} className="p-2 rounded bg-white/5 text-white/90 text-sm">
                            {diff}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Story Arc Analysis */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Personal Growth Story Arc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80">Story Coherence</span>
                        <span className="text-white font-bold">
                          {project.narrative.storyArcAnalysis.thematicConsistency}%
                        </span>
                      </div>
                      <Progress value={project.narrative.storyArcAnalysis.thematicConsistency} />
                    </div>

                    <ScrollArea className="h-80">
                      <div className="space-y-4 pr-4">
                        {project.narrative.storyArcAnalysis.characterDevelopment.map((stage, i) => (
                          <div key={i} className="relative">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-medium mb-2">{stage.stage}</h4>
                                <p className="text-white/90 text-sm">{stage.story}</p>
                              </div>
                            </div>
                            {i < project.narrative.storyArcAnalysis.characterDevelopment.length - 1 && (
                              <div className="absolute left-4 top-8 w-0.5 h-8 bg-white/20"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="mt-4 p-4 rounded-lg bg-success/20 border border-success/30">
                      <p className="text-white/80 text-sm font-medium mb-1">Growth Evidence</p>
                      <p className="text-white/90 text-sm italic">{project.narrative.storyArcAnalysis.growthEvidence}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authenticity Indicators */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authenticity Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-center mb-4">
                        <div className="text-4xl font-bold text-success mb-2">
                          {project.narrative.authenticityIndicators.passionConsistency}%
                        </div>
                        <div className="text-white/80">Passion Consistency</div>
                      </div>
                      
                      <div className="space-y-3">
                        {project.narrative.authenticityIndicators.valueAlignment.map((alignment, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium text-sm">Stated:</span>
                              <span className="text-white/90 text-sm">{alignment.stated}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-success font-medium text-sm">Demonstrated:</span>
                              <span className="text-success text-sm">{alignment.demonstrated}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-3">Authenticity Verification</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/20">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="text-white">No authenticity concerns detected</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/20">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="text-white">Values align with demonstrated actions</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/20">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="text-white">Consistent passion narrative across timeline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* College Essay Goldmine */}
              <Card className="bg-gradient-score-excellent backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    College Essay Goldmine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Powerful Story Moments</h4>
                      <div className="space-y-4">
                        {project.narrative.collegeEssayGoldmine.powerfulMoments.map((moment, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/10">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-white/90 text-sm flex-1 italic">
                                &ldquo;{moment.moment}&rdquo;
                              </p>
                              <Badge variant="outline" className="border-warning/50 text-warning ml-2">
                                {moment.essayPotential}
                              </Badge>
                            </div>
                            <div className="text-white/70 text-xs">
                              {moment.emotionalResonance && `Emotional Resonance: ${moment.emotionalResonance}`}
                              {moment.lessonLearned && `Lesson: ${moment.lessonLearned}`}
                              {moment.uniqueness && `Uniqueness: ${moment.uniqueness}`}
                              {moment.leadership && `Leadership: ${moment.leadership}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Ready-to-Use Quotes</h4>
                      <div className="space-y-3">
                        {project.narrative.collegeEssayGoldmine.readyQuotes.map((quote, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5 border-l-4 border-accent">
                            <p className="text-white/90 italic">&ldquo;{quote}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interview Story Bank */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Interview Story Bank (STAR Method)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.narrative.interviewStoryBank.map((story, i) => (
                      <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-warning font-semibold text-sm">Situation: </span>
                            <span className="text-white/90 text-sm">{story.situation}</span>
                          </div>
                          <div>
                            <span className="text-secondary font-semibold text-sm">Task: </span>
                            <span className="text-white/90 text-sm">{story.task}</span>
                          </div>
                          <div>
                            <span className="text-accent font-semibold text-sm">Action: </span>
                            <span className="text-white/90 text-sm">{story.action}</span>
                          </div>
                          <div>
                            <span className="text-success font-semibold text-sm">Result: </span>
                            <span className="text-white/90 text-sm">{story.result}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {story.interviewFit.map((fit, j) => (
                            <Badge key={j} variant="secondary" className="bg-primary/20 text-primary-foreground text-xs">
                              {fit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ENHANCED INSIGHTS TAB */}
            <TabsContent value="insights" className="space-y-6">
              {/* Predictive Career Analytics */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Predictive Career Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Career Trajectory Predictions</h4>
                      <div className="space-y-3">
                        {project.insights.predictiveAnalytics.careerTrajectory.map((path, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{path.path}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={path.probability} className="w-24 h-2" />
                                <span className="text-white font-bold text-sm">{path.probability}%</span>
                              </div>
                            </div>
                            <p className="text-white/80 text-sm">{path.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Skill Development Predictions</h4>
                      <div className="space-y-3">
                        {project.insights.predictiveAnalytics.skillDevelopmentPredictions.map((skill, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium">{skill.skill}</span>
                              <Badge variant="outline" className="border-secondary/50 text-secondary">
                                {skill.timeline}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Progress value={skill.growth} className="flex-1 h-1" />
                              <span className="text-white text-sm">{skill.growth}% growth</span>
                            </div>
                            <p className="text-white/70 text-xs">{skill.trigger}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admissions Competitive Advantage */}
              <Card className="bg-gradient-score-excellent backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Admissions Competitive Advantage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-lg text-white/80 mb-2">Competitive Positioning</div>
                      <div className="text-2xl font-bold text-white">
                        {project.insights.admissionsAdvantage.competitivePositioning}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">School Fit Analysis</h4>
                      <div className="space-y-3">
                        {project.insights.admissionsAdvantage.schoolFitAnalysis.map((school, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-semibold">{school.school}</span>
                              <div className="flex items-center gap-2">
                                <div className="text-white font-bold">{school.fit}%</div>
                                <div className={`w-3 h-3 rounded-full ${
                                  school.fit >= 90 ? 'bg-success' : 
                                  school.fit >= 80 ? 'bg-warning' : 'bg-destructive'
                                }`}></div>
                              </div>
                            </div>
                            <p className="text-white/80 text-sm">{school.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-3">Key Differentiation Factors</h4>
                      <div className="space-y-2">
                        {project.insights.admissionsAdvantage.differentiationFactors.map((factor, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
                            <Star className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            <span className="text-white/90 text-sm">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Innovation Quotient */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Innovation Quotient Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white mb-2 gradient-primary p-6 rounded-full w-32 h-32 flex items-center justify-center mx-auto">
                        {project.insights.innovationQuotient.score}
                      </div>
                      <div className="text-white/80 text-lg">Innovation Score</div>
                      <div className="text-white/70 text-sm mt-2">
                        {project.insights.innovationQuotient.nextLevelPotential}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-3">Innovation Evidence</h4>
                        <div className="space-y-2">
                          {project.insights.innovationQuotient.evidence.map((evidence, i) => (
                            <div key={i} className="flex items-start gap-2 text-white/90 text-sm">
                              <Lightbulb className="h-3 w-3 text-warning mt-1 flex-shrink-0" />
                              {evidence}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-3">Innovation Patterns</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.insights.innovationQuotient.patterns.map((pattern, i) => (
                            <Badge key={i} variant="secondary" className="bg-accent/20 text-accent-foreground">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Portfolio Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Areas for Attention</h4>
                      <div className="space-y-3">
                        {project.insights.riskAssessment.potentialConcerns.map((concern, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{concern.concern}</span>
                              <Badge variant={
                                concern.severity === 'High' ? 'destructive' :
                                concern.severity === 'Medium' ? 'secondary' : 'outline'
                              } className="text-xs">
                                {concern.severity}
                              </Badge>
                            </div>
                            <p className="text-white/80 text-sm">{concern.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Portfolio Strengths</h4>
                      <div className="space-y-2">
                        {project.insights.riskAssessment.strengthAreas.map((strength, i) => (
                          <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-success/20">
                            <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                            <span className="text-white/90 text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Development Recommendations */}
              <Card className="bg-gradient-primary backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Strategic Development Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.insights.developmentRecommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg bg-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="border-white/30 text-white">
                            {rec.category}
                          </Badge>
                          <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                            {rec.priority} Priority
                          </Badge>
                        </div>
                        <h4 className="text-white font-medium mb-2">{rec.action}</h4>
                        <p className="text-white/80 text-sm">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  // Calculate overall portfolio summary statistics
  const portfolioSummary = {
    totalProjects: portfolioData.length,
    averageImpactScore: Math.round(
      portfolioData.reduce((sum, project) => 
        sum + (project.overview.applicationReadiness.essayPotential || 0), 0
      ) / portfolioData.length
    ),
    totalVerified: portfolioData.filter(p => p.verified).length,
    uniquenessScore: Math.round(
      portfolioData.reduce((sum, project) => 
        sum + (project.overview.applicationReadiness.uniquenessScore || 0), 0
      ) / portfolioData.length
    )
  };

  return (
    <div className="min-h-screen gradient-dashboard text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Portfolio Overview */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-secondary to-accent bg-clip-text text-transparent">
            Portfolio Intelligence Dashboard
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Deep insights and analytics from your project narratives, optimized for college applications and personal growth
          </p>
          
          {/* Portfolio Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{portfolioSummary.totalProjects}</div>
                <div className="text-white/70 text-sm">Projects Analyzed</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-success mb-1">{portfolioSummary.averageImpactScore}%</div>
                <div className="text-white/70 text-sm">Avg Impact Score</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary mb-1">{portfolioSummary.totalVerified}</div>
                <div className="text-white/70 text-sm">Verified Projects</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-accent mb-1">{portfolioSummary.uniquenessScore}%</div>
                <div className="text-white/70 text-sm">Uniqueness Score</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Project Cards */}
        <div className="space-y-8">
          {portfolioData.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Export and Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <Button size="lg" className="gradient-secondary">
            <Download className="h-5 w-5 mr-2" />
            Export Portfolio Summary
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <FileText className="h-5 w-5 mr-2" />
            Generate Essay Drafts
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <MessageCircle className="h-5 w-5 mr-2" />
            Create Interview Prep
          </Button>
        </div>
      </div>
    </div>
  );
};