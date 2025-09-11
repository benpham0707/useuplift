import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskPlanningInterface from '@/components/TaskPlanningInterface';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  GraduationCap, 
  TrendingUp, 
  MessageCircle, 
  Send, 
  BookOpen, 
  Target, 
  Calendar, 
  BarChart3,
  AlertCircle,
  Filter,
  CheckCircle,
  Award,
  Users,
  MapPin,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Clock,
  Star,
  Calculator,
  X,
  Check,
  Zap,
  Brain,
  Scale,
  Link,
  CheckCircle2
} from 'lucide-react';

const AcademicPlanner = () => {
  // Hard coded data values for current academic standing and progress
  const currentGPA = {
    weighted: 4.2,
    unweighted: 3.8,
    classRank: 15,
    totalStudents: 300,
    creditsCompleted: 85,
    totalCredits: 120
  };

  // Hard coded data values for GPA analysis and targets
  const gpaData = {
    current: 3.8,
    schoolAverage: 3.2,
    majorRecommended: 3.6,
    target: 3.9
  };

  // Hard coded data for GPA over time line chart
  const gpaTimeData = [
    { semester: 'Fall 2022', yourGPA: 3.5, majorAverage: 3.1 },
    { semester: 'Spring 2023', yourGPA: 3.6, majorAverage: 3.2 },
    { semester: 'Fall 2023', yourGPA: 3.7, majorAverage: 3.2 },
    { semester: 'Spring 2024', yourGPA: 3.8, majorAverage: 3.3 },
    { semester: 'Fall 2024', yourGPA: 3.8, majorAverage: 3.2 },
  ];

  // Hard coded data for expandable insights
  const insights = [
    {
      id: 'course-requirements',
      title: 'Course Requirements Analysis',
      status: 'complete',
      percentage: 85,
      icon: CheckCircle,
      color: 'green',
      summary: 'On track with core requirements',
      details: 'You have completed 85% of your major requirements. Remaining courses include Advanced Statistics, Research Methods, and Senior Capstone. Current trajectory shows completion by graduation.',
      recommendations: ['Enroll in Advanced Statistics next semester', 'Consider Research Methods over summer']
    },
    {
      id: 'gpa-trajectory',
      title: 'GPA Trajectory Analysis',
      status: 'warning',
      percentage: 78,
      icon: TrendingUp,
      color: 'orange',
      summary: 'Slight decline trend detected',
      details: 'Your GPA has decreased by 0.1 points over the last semester. This trend, if continued, may impact your target GPA goals and competitive graduate school applications.',
      recommendations: ['Focus on improving study habits', 'Consider tutoring for challenging subjects', 'Meet with academic advisor']
    },
    {
      id: 'graduation-timeline',
      title: 'Graduation Timeline',
      status: 'complete',
      percentage: 92,
      icon: Clock,
      color: 'green',
      summary: 'On schedule for timely graduation',
      details: 'Based on current credit completion rate, you are projected to graduate on time in Spring 2025. All prerequisite chains are being followed correctly.',
      recommendations: ['Maintain current course load', 'Consider adding electives of interest']
    },
    {
      id: 'competitive-standing',
      title: 'Competitive Standing',
      status: 'excellent',
      percentage: 95,
      icon: Star,
      color: 'blue',
      summary: 'Top 5% of class performance',
      details: 'Your academic performance places you in the top 5% of your graduating class. This strong standing positions you well for competitive opportunities.',
      recommendations: ['Apply for honors programs', 'Consider research opportunities', 'Explore leadership positions']
    }
  ];

  const [expandedInsights, setExpandedInsights] = useState<string[]>(['course-requirements']);
  const [expandedAG, setExpandedAG] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm here to help with your academic planning. Ask me about course selection, GPA goals, or any academic concerns."
    }
  ]);
  const [userInput, setUserInput] = useState('');
  
  // Draggable chatbot state
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  
  // Task planning interface state
  const [taskPlanningOpen, setTaskPlanningOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Filter state for insights
  const [insightFilter, setInsightFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'improvement' | 'strength' | 'concern'>('all');

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setChatMessages([...chatMessages, 
        { role: 'user', content: userInput },
        { role: 'assistant', content: "I'll help you with that! Let me analyze your academic situation and provide recommendations." }
      ]);
      setUserInput('');
    }
  };

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  // Hard coded data for quick action scenarios
  const quickActions = [
    "Plan next semester",
    "Check graduation requirements", 
    "GPA calculation help",
    "Course difficulty analysis",
    "Study abroad planning"
  ];

  // Hard coded data values for task planning - defines bundled academic planning objectives
  const taskDatabase = {
    "Master Chemistry Performance": {
      title: "Master Chemistry Performance",
      impact: "High",
      difficulty: "Medium", 
      timeframe: "6-8 weeks",
      category: "Academic Excellence",
      description: "Comprehensive strategy to dramatically improve chemistry performance through structured support systems, optimized study methods, and collaborative learning. This multi-phase approach addresses all aspects of chemistry mastery from conceptual understanding to practical application.",
      importance: "Chemistry is a foundational subject for pre-med tracks and STEM majors that requires both theoretical knowledge and practical laboratory skills. Mastering chemistry demonstrates academic rigor, scientific aptitude, and problem-solving abilities that are crucial for competitive college applications and future academic success.",
      takeaways: [
        "Develop comprehensive understanding of chemistry concepts and applications",
        "Build confidence in laboratory techniques and scientific communication", 
        "Create sustainable study systems and support networks",
        "Establish foundation for advanced STEM coursework"
      ],
      phases: [
        {
          title: "Phase 1: Establish Support Structure",
          description: "Set up professional tutoring and peer learning systems",
          steps: [
            "Research and contact 2-3 qualified chemistry tutors through school resources",
            "Schedule initial consultation sessions to assess compatibility and teaching style", 
            "Establish weekly recurring tutoring sessions (1-2 hours each)",
            "Identify 3-4 high-performing classmates for study group formation",
            "Approach potential study group members with structured proposal"
          ]
        },
        {
          title: "Phase 2: Optimize Study Systems", 
          description: "Create efficient templates and organizational tools",
          steps: [
            "Review past lab reports and instructor feedback for common requirements",
            "Research standard scientific lab report formats and style guides",
            "Create comprehensive lab report template with all required sections",
            "Develop shared study materials and practice problem collections",
            "Establish group guidelines for preparation and participation"
          ]
        },
        {
          title: "Phase 3: Implement and Refine",
          description: "Execute the support systems and continuously improve",
          steps: [
            "Begin regular tutoring sessions with prepared topics and questions",
            "Launch weekly study group meetings (2-3 hours each session)",
            "Test lab report template and refine based on instructor feedback", 
            "Track progress through shared documentation and grade monitoring",
            "Evaluate and adjust strategies monthly based on performance improvements"
          ]
        }
      ]
    },
    "Optimize Senior Year Academic Planning": {
      title: "Optimize Senior Year Academic Planning",
      impact: "High",
      difficulty: "Medium",
      timeframe: "4-6 weeks", 
      category: "Strategic Planning",
      description: "Comprehensive approach to designing the ideal senior year academic experience that maximizes college admissions potential, aligns with career goals, and ensures graduation requirements are exceeded rather than just met.",
      importance: "Senior year course selection is the final opportunity to demonstrate academic excellence and intellectual curiosity to college admissions committees. Strategic planning ensures optimal balance between academic rigor, graduation requirements, and personal interests while positioning for college success.",
      takeaways: [
        "Create strategic academic narrative aligned with college and career goals",
        "Maximize opportunities for college credit and advanced standing",
        "Ensure graduation requirements are exceeded with distinction", 
        "Build foundation for competitive college applications"
      ],
      phases: [
        {
          title: "Phase 1: Requirements Analysis",
          description: "Comprehensive review of graduation and college admission requirements",
          steps: [
            "Schedule appointment with assigned academic counselor",
            "Prepare detailed questions about graduation requirements and course options",
            "Bring unofficial transcript and review current academic standing",
            "Research admission requirements at target colleges and universities",
            "Identify gaps between current progress and desired outcomes"
          ]
        },
        {
          title: "Phase 2: Advanced Opportunities Research", 
          description: "Explore AP courses, dual enrollment, and other advanced options",
          steps: [
            "Review available AP courses and their prerequisites at your school",
            "Research AP credit policies at target colleges for strategic selection",
            "Meet with current AP teachers to understand expectations and workload",
            "Investigate dual enrollment partnerships with local colleges",
            "Evaluate eligibility requirements for advanced learning opportunities"
          ]
        },
        {
          title: "Phase 3: Strategic Course Selection",
          description: "Design optimal senior year schedule balancing rigor and interests",
          steps: [
            "Assess strengths and interests to select courses for maximum success",
            "Consider alignment between courses and intended major/career path",
            "Evaluate overall course load for balance with extracurricular commitments",
            "Create preliminary schedule and get counselor approval for feasibility",
            "Complete applications and registration for dual enrollment or special programs"
          ]
        }
      ]
    },
    "Strengthen Academic Foundation": {
      title: "Strengthen Academic Foundation", 
      impact: "Medium",
      difficulty: "Low",
      timeframe: "3-4 weeks",
      category: "Academic Improvement",
      description: "Systematic approach to reinforcing core academic skills, addressing any gaps in foundational knowledge, and building study habits that support sustained academic excellence across all subjects.",
      importance: "Strong foundational skills are essential for success in advanced coursework and college-level academics. Addressing gaps now prevents future struggles and builds confidence for taking on more challenging academic opportunities.",
      takeaways: [
        "Identify and address gaps in foundational knowledge across subjects",
        "Develop effective study strategies applicable to all academic areas", 
        "Build confidence and momentum for tackling advanced coursework",
        "Create sustainable systems for academic success"
      ],
      phases: [
        {
          title: "Phase 1: Academic Assessment",
          description: "Evaluate current strengths and identify improvement areas",
          steps: [
            "Review grades and performance across all current subjects",
            "Identify patterns in strengths and areas needing improvement",
            "Gather feedback from teachers on academic performance and potential",
            "Assess study habits and time management effectiveness",
            "Create baseline metrics for tracking improvement"
          ]
        },
        {
          title: "Phase 2: Targeted Skill Development",
          description: "Focus improvement efforts on highest-impact areas",
          steps: [
            "Prioritize improvement areas based on impact and graduation requirements",
            "Develop specific action plans for each identified weakness",
            "Utilize school resources like tutoring centers, teacher office hours",
            "Create study schedules that allocate appropriate time to each subject",
            "Implement new study techniques and organizational systems"
          ]
        },
        {
          title: "Phase 3: Monitoring and Adjustment",
          description: "Track progress and refine strategies for continuous improvement",
          steps: [
            "Monitor grade improvements and academic performance weekly",
            "Adjust study strategies based on what's working most effectively",
            "Celebrate improvements and maintain motivation for continued growth",
            "Plan for applying strengthened skills to future advanced coursework",
            "Document successful strategies for use in college preparation"
          ]
        }
      ]
    }
  };

  // Function to handle opening task planning interface
  const handleTaskPlanningOpen = (actionText: string) => {
    const task = taskDatabase[actionText as keyof typeof taskDatabase];
    if (task) {
      setSelectedTask(task);
      setTaskPlanningOpen(true);
    }
  };

  // GPA Line Chart Component
  const GPALineChart = () => {
    return (
      <div className="space-y-2">
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={gpaTimeData}
              margin={{
                top: 40,
                right: 50,
                left: 40,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" strokeWidth={1} />
              <XAxis 
                dataKey="semester" 
                tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                height={60}
              />
              <YAxis 
                domain={[2.8, 4.0]}
                ticks={[2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0]}
                tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                label={{ 
                  value: 'GPA', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#475569' }
                }}
                width={70}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                labelStyle={{ color: '#334155', fontWeight: '600' }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
              
              {/* Reference line for target GPA only */}
              <ReferenceLine 
                y={gpaData.target} 
                stroke="#dc2626" 
                strokeDasharray="6 3" 
                strokeWidth={2}
                label={{ 
                  value: "Target GPA", 
                  position: "top", 
                  fill: "#dc2626", 
                  fontSize: "13px",
                  fontWeight: "600",
                  offset: 10
                }}
              />
              
              {/* GPA lines with professional styling */}
              <Line 
                type="monotone" 
                dataKey="yourGPA" 
                stroke="#1e40af" 
                strokeWidth={4}
                dot={{ fill: '#1e40af', strokeWidth: 3, r: 6, stroke: '#ffffff' }}
                activeDot={{ r: 8, stroke: '#1e40af', strokeWidth: 3, fill: '#ffffff' }}
                name="Your GPA"
              />
              <Line 
                type="monotone" 
                dataKey="majorAverage" 
                stroke="#84A59D" 
                strokeWidth={4}
                dot={{ fill: '#84A59D', strokeWidth: 3, r: 6, stroke: '#ffffff' }}
                activeDot={{ r: 8, stroke: '#84A59D', strokeWidth: 3, fill: '#ffffff' }}
                name="Major Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Compact summary stats */}
        <div className="flex justify-center gap-8 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Your GPA:</span>
              <span className="ml-1 font-bold text-blue-700">{gpaData.current}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#84A59D' }}></div>
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Major Average:</span>
              <span className="ml-1 font-bold" style={{ color: '#84A59D' }}>{gpaData.majorRecommended}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Target:</span>
              <span className="ml-1 font-bold text-red-600">{gpaData.target}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Full Width Main Content */}
      <div className="w-full p-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">Academic Planning</h1>
            <p className="text-muted-foreground">Track your progress and plan your academic journey strategically</p>
          </div>

          {/* Expanded Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Academic Standing - Expanded */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5" />
                  Current Academic Standing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <div className="text-3xl font-bold text-blue-900">{currentGPA.weighted}</div>
                      <div className="text-sm text-blue-950">Weighted GPA</div>
                    </div>
                    <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <div className="text-3xl font-bold text-blue-900">{currentGPA.unweighted}</div>
                      <div className="text-sm text-blue-950">Unweighted GPA</div>
                    </div>
                    <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <div className="text-3xl font-bold text-blue-900">{Math.round(((currentGPA.totalStudents - currentGPA.classRank + 1) / currentGPA.totalStudents) * 100)}th</div>
                      <div className="text-sm text-blue-950">Percentile</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Degree Progress</span>
                      <span className="text-sm text-muted-foreground">{currentGPA.creditsCompleted}/{currentGPA.totalCredits}</span>
                    </div>
                    <Progress value={(currentGPA.creditsCompleted / currentGPA.totalCredits) * 100} className="h-3" />
                  </div>
                  
                  {/* Academic Requirements Checklist */}
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Academic Course Requirements Checklist</h3>
                    
                    {/* A-G Subject Requirements - Smaller emphasis */}
                    <div className="mb-4">
                      <button 
                        onClick={() => setExpandedAG(!expandedAG)}
                        className="flex items-center gap-2 text-xs w-full hover:bg-muted p-2 rounded-md transition-colors"
                      >
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">A-G Subject Requirements (UC/CSU Foundation)</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${expandedAG ? 'rotate-180' : ''}`} />
                      </button>
                        
                      {expandedAG && (
                        <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400">
                              <X className="h-2 w-2 text-white" />
                            </div>
                            <span>Missing: 4th year of math and advanced science courses</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Academic Achievement Requirements in 2 columns */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {/* AP & Course Rigor */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">4+ AP Courses Completed</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">8+ AP Courses Planned</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">AP Capstone Program</span>
                      </div>
                      
                      {/* Graduation Requirements */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">On Track for Graduation</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Early Graduation Possible</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Honors Diploma Track</span>
                      </div>
                      
                      {/* Schedule Rigor */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Most Rigorous Available</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">No Study Halls/Fillers</span>
                      </div>
                      
                      {/* Senior Year Requirements */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">4+ Academic Cores Senior Year</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Capstone/Research Course</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">College Credit Courses</span>
                      </div>
                      
                      {/* Course Planning */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">All Prerequisites Met</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Grade Trend Management</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Course Load Balance</span>
                      </div>
                      
                      {/* Major-Specific Requirements */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Intended Major Prerequisites</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">2+ Specialized Coursework</span>
                      </div>
                      
                      {/* College Application Standards */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400 flex-shrink-0">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Reach School Standards</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Safety School Assured</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600 flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Scholarship Positioning</span>
                      </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* GPA Analysis - Equal Width */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  GPA Analysis & Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GPALineChart />
              </CardContent>
            </Card>
          </div>

          {/* Academic Planning Insights & Recommendations */}
          <Card className="shadow-medium">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Academic Planning Insights & Recommendations
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing 3 of 6 insights • Scroll to see more
                </p>
                
                {/* Filter dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={insightFilter} onValueChange={(value) => setInsightFilter(value as any)}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue placeholder="Filter insights" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Insights</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <div className="border-t border-border/30 mx-6 rounded-t-lg"></div>
            <CardContent>
              <div 
                className="insights-scroll h-[600px] overflow-y-auto space-y-6 pr-2 scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'hsl(var(--border)) transparent'
                }}
              >
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .insights-scroll::-webkit-scrollbar {
                      width: 6px;
                    }
                    .insights-scroll::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .insights-scroll::-webkit-scrollbar-thumb {
                      background: hsl(var(--border));
                      border-radius: 3px;
                    }
                    .insights-scroll::-webkit-scrollbar-thumb:hover {
                      background: hsl(var(--foreground) / 0.3);
                    }
                  `
                }} />

                {/* Academic Excellence Insight */}
                <AcademicInsightItem
                  title="GPA Trajectory Optimization Opportunity"
                  description="Your 3.8 GPA while managing work responsibilities demonstrates strong time management, but targeted improvement in AP Chemistry could boost your STEM profile significantly. Strategic focus on lab reports and practice problems could raise your semester GPA to 3.9+, positioning you for competitive pre-med programs."
                  time="1 hour ago"
                  type="improvement"
                  impact="high"
                  estimatedGains={{
                    gpaIncrease: 0.15,
                    competitiveStanding: 0.23,
                    stemProfile: 0.31
                  }}
                  actionItems={[
                    { 
                      action: "Master Chemistry Performance", 
                      buttonText: "Comprehensive Chemistry Plan",
                      components: [
                        "Weekly lab report review sessions",
                        "Practice problem sets (2 hours/week)",
                        "Chemistry tutor consultation",
                        "AP Chemistry exam preparation"
                      ]
                    }
                  ]}
                  onActionClick={handleTaskPlanningOpen}
                  connections="Consistent academic performance + work ethic narrative + strategic improvement = compelling resilience story for competitive programs."
                />

                {/* Course Planning Insight */}
                <AcademicInsightItem
                  title="Advanced Coursework Sequence Optimization"
                  description="Your current AP course load (4 completed) positions you well, but strategic selection of 2-3 additional APs could significantly strengthen your academic profile. Focus on courses that align with your career interests and demonstrate intellectual curiosity beyond graduation requirements."
                  time="6 hours ago"
                  type="opportunity"
                  impact="high"
                  estimatedGains={{
                    courseRigor: 0.28,
                    collegePrepScore: 0.19,
                    scholarshipEligibility: 0.22
                  }}
                  actionItems={[
                    { 
                      action: "Optimize Senior Year Academic Planning", 
                      buttonText: "Strategic Course Planning",
                      components: [
                        "AP course selection consultation",
                        "Schedule optimization for GPA goals",
                        "College admission course requirements review",
                        "Academic workload balance planning"
                      ]
                    }
                  ]}
                  onActionClick={handleTaskPlanningOpen}
                  connections="Strategic course selection + demonstrated academic ability + career alignment = strong foundation for competitive college admissions."
                />

                {/* Achievement Recognition */}
                <AcademicInsightItem
                  title="Academic Consistency Achievement Pattern"
                  description="Maintaining 3.8+ GPA for three consecutive semesters while working part-time showcases exceptional time management and academic dedication. This consistency pattern, combined with your upward trajectory in challenging courses, creates a powerful narrative of academic resilience and growth mindset."
                  time="2 days ago"
                  type="strength"
                  impact="medium"
                  estimatedGains={{
                    narrativeStrength: 0.25,
                    workEthicProfile: 0.18,
                    collegeReadiness: 0.15
                  }}
                  actionItems={[
                    { 
                      action: "Strengthen Academic Foundation", 
                      buttonText: "Build Strong Foundation",
                      components: [
                        "Study habit optimization assessment",
                        "Time management skill development",
                        "Academic support network building",
                        "Progress tracking system setup"
                      ]
                    }
                  ]}
                  onActionClick={handleTaskPlanningOpen}
                  connections="Consistent performance + time management skills + work experience = demonstrated college readiness and maturity."
                />

                {/* Graduation Timeline */}
                <AcademicInsightItem
                  title="Graduation Requirements Progress Check"
                  description="You've completed 85% of graduation requirements with excellent pacing. Current trajectory shows on-time graduation with opportunities to exceed minimum requirements. Consider using remaining elective slots strategically to strengthen areas of interest or career preparation."
                  time="1 week ago"
                  type="strength"
                  impact="low"
                  estimatedGains={{
                    graduationReadiness: 0.12,
                    eleciveFocus: 0.08
                  }}
                  actionItems={[
                    { 
                      action: "Optimize Senior Year Academic Planning", 
                      buttonText: "Plan Final Year",
                      components: [
                        "Elective course selection strategy",
                        "Graduation timeline verification",
                        "Career-aligned course prioritization",
                        "Academic transcript optimization"
                      ]
                    }
                  ]}
                  onActionClick={handleTaskPlanningOpen}
                  connections="On-track graduation + strategic elective use = maximum preparation for post-secondary success."
                />

              </div>
            </CardContent>
          </Card>

          {/* Section Separator */}
          <div className="my-12">
            <div className="flex items-center justify-center">
              <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
              <div className="mx-6">
                <h2 className="text-3xl font-bold text-foreground">Academic Portfolio</h2>
              </div>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Trophy Case Section */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="relative">
                    <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg border-4 border-amber-200">
                      <Award className="h-5 w-5 text-white" />
                      <div className="absolute inset-0 rounded-full border-2 border-amber-300 opacity-50"></div>
                    </div>
                  </div>
                  Academic Trophy Case
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-medium px-3 py-1">
                  {/* Hard coded data for achievement count */}
                  12 Achievements Unlocked
                </Badge>
              </div>
              <CardDescription className="text-base text-amber-900 font-medium">
                Your hall of academic excellence and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Gold Tier Trophies */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-xl hover:from-yellow-200 hover:to-amber-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Award className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2">
                          Gold Tier Achievements
                        </h3>
                        <p className="text-sm text-amber-700 font-medium">Elite academic accomplishments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-amber-200 text-amber-900 text-xs font-bold px-2 py-1">
                        {/* Hard coded data for gold tier count */}
                        3/5
                      </Badge>
                      <div className="w-16 bg-amber-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-amber-700 group-hover:scale-110 transition-transform" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white rounded-xl border-2 border-yellow-200 shadow-inner p-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Star className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-amber-900">AP Biology - Perfect Score: 5</span>
                                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-sm text-amber-800 font-medium mb-1">College credit + pre-med track eligibility</p>
                              <p className="text-xs text-amber-600">Unlocks: Advanced biology courses, research opportunities</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Target className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-amber-900">Biology Major Prerequisites Complete</span>
                                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-sm text-amber-800 font-medium mb-1">Direct admission eligibility secured</p>
                              <p className="text-xs text-amber-600">Unlocks: Priority enrollment, scholarship eligibility</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-amber-900">Credit Requirements Complete</span>
                                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-sm text-amber-800 font-medium mb-1">Early college enrollment possible</p>
                              <p className="text-xs text-amber-600">Unlocks: Dual enrollment, accelerated programs</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Silver Tier Trophies */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-slate-100 to-gray-100 border-2 border-slate-300 rounded-xl hover:from-slate-200 hover:to-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Award className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          Silver Tier Achievements
                        </h3>
                        <p className="text-sm text-slate-700 font-medium">Strong foundational accomplishments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-slate-200 text-slate-900 text-xs font-bold px-2 py-1">
                        {/* Hard coded data for silver tier count */}
                        5/7
                      </Badge>
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-slate-400 to-gray-500 h-2 rounded-full" style={{width: '71%'}}></div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-slate-700 group-hover:scale-110 transition-transform" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-inner p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Calculator className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-900 text-sm">AP Calculus AB - Score: 4</span>
                                <Button size="sm" className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-xs text-slate-700 mb-1">Advanced math placement secured</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <BookOpen className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-900 text-sm">4 Years English</span>
                                <Button size="sm" className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-xs text-slate-700 mb-1">Advanced composition eligibility</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <GraduationCap className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-900 text-sm">Honors Diploma Eligibility</span>
                                <Button size="sm" className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-xs text-slate-700 mb-1">Scholarship opportunities unlocked</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-900 text-sm">Research Experience (Summer 2024)</span>
                                <Button size="sm" className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-xs text-slate-700 mb-1">Graduate school recommendations available</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Bronze Tier Trophies */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-xl hover:from-orange-200 hover:to-amber-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Award className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-orange-900 text-lg flex items-center gap-2">
                          Bronze Tier Achievements
                        </h3>
                        <p className="text-sm text-orange-700 font-medium">Important supporting accomplishments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-200 text-orange-900 text-xs font-bold px-2 py-1">
                        {/* Hard coded data for bronze tier count */}
                        4/4
                      </Badge>
                      <div className="w-16 bg-orange-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-400 to-amber-600 h-2 rounded-full" style={{width: '100%'}}></div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-orange-700 group-hover:scale-110 transition-transform" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white rounded-xl border-2 border-orange-200 shadow-inner p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-orange-900 text-sm">Honors Chemistry - Grade: A</span>
                                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Leverage This
                                </Button>
                              </div>
                              <p className="text-xs text-orange-700 mb-1">AP Chemistry eligibility secured</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>

          {/* Academic Task Dashboard */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b-2 border-red-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="relative">
                    <div className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg border-3 border-red-200">
                      <Zap className="h-5 w-5 text-white" />
                      <div className="absolute inset-0 rounded-full border-2 border-red-300 opacity-50"></div>
                    </div>
                  </div>
                  Academic Action Dashboard
                </CardTitle>
                <Badge className="bg-red-100 text-red-800 border-red-300 font-medium px-3 py-1">
                  {/* Hard coded data for task count */}
                  8 Priority Tasks
                </Badge>
              </div>
              <CardDescription className="text-base text-red-900 font-medium">
                Key requirements and achievements you're working toward
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* High Priority Tasks */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-300 rounded-xl hover:from-red-200 hover:to-rose-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <AlertCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform animate-pulse" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
                          High Priority Tasks
                        </h3>
                        <p className="text-sm text-red-700 font-medium">Critical requirements for success</p>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-red-700 group-hover:scale-110 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white rounded-xl border-2 border-red-200 shadow-inner p-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-red-900">Complete AP Physics C</span>
                                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Plan This
                                </Button>
                              </div>
                              <p className="text-sm text-red-800 font-medium mb-1">Missing for engineering program prerequisites</p>
                              <p className="text-xs text-red-600">Deadline: Register by February 1st</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Target className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-red-900">Raise GPA to 3.9+</span>
                                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Plan This
                                </Button>
                              </div>
                              <p className="text-sm text-red-800 font-medium mb-1">Currently 0.1 points below target</p>
                              <p className="text-xs text-red-600">Impact: Top-tier college admissions</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Medium Priority Tasks */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-xl hover:from-orange-200 hover:to-amber-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Clock className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-orange-900 text-lg flex items-center gap-2">
                          Medium Priority Tasks
                        </h3>
                        <p className="text-sm text-orange-700 font-medium">Important for strengthening profile</p>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-orange-700 group-hover:scale-110 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white rounded-xl border-2 border-orange-200 shadow-inner p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <BookOpen className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-orange-900 text-sm">Complete AP Statistics</span>
                                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Plan This
                                </Button>
                              </div>
                              <p className="text-xs text-orange-700 mb-1">Supports data science track</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-orange-900 text-sm">Join Research Program</span>
                                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Plan This
                                </Button>
                              </div>
                              <p className="text-xs text-orange-700 mb-1">Enhance graduate school applications</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Future Opportunities */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-slate-100 to-gray-100 border-2 border-slate-300 rounded-xl hover:from-slate-200 hover:to-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Calendar className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          Future Opportunities
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        </h3>
                        <p className="text-sm text-slate-700 font-medium">Nice-to-have enhancements</p>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-700 group-hover:scale-110 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-inner p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-md flex-shrink-0 mt-1 animate-fade-in">
                              <MapPin className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-900 text-sm">Study Abroad Program</span>
                                <Button size="sm" className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Explore
                                </Button>
                              </div>
                              <p className="text-xs text-slate-700 mb-1">Cultural enrichment opportunity</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

      {/* Floating Chat Toggle Button */}
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Draggable Chatbot */}
      {isChatOpen && (
        <div 
          className="fixed w-96 h-[28rem] z-50 animate-in slide-in-from-bottom-4"
          style={{ 
            left: chatPosition.x, 
            top: chatPosition.y,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <Card className="h-full shadow-2xl border-2">
            <CardHeader 
              className="border-b p-4 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg pointer-events-none">
                    <MessageCircle className="h-5 w-5" />
                    Academic Advisor
                  </CardTitle>
                  <CardDescription className="text-xs pointer-events-none">
                    Get personalized guidance on your academic journey
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                  className="h-8 w-8 p-0 pointer-events-auto"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 h-full">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-t bg-background">
                <button
                  onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
                  className="flex items-center justify-between w-full text-sm font-medium mb-3 hover:text-primary transition-colors"
                >
                  <span>Quick Actions</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${quickActionsExpanded ? 'rotate-180' : ''}`} />
                </button>
                {quickActionsExpanded && (
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-2 text-xs"
                        onClick={() => setUserInput(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about your academics..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 text-sm"
                  />
                  <Button onClick={handleSendMessage} size="icon" className="flex-shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Planning Interface */}
      <TaskPlanningInterface 
        isOpen={taskPlanningOpen}
        onClose={() => setTaskPlanningOpen(false)}
        task={selectedTask}
      />
    </div>
  );
};

// Academic Insight Item Component for Academic Planning specific insights
interface AcademicInsightItemProps {
  title: string;
  description: string;
  time: string;
  type: 'strength' | 'opportunity' | 'improvement' | 'warning' | 'concern';
  impact: 'high' | 'medium' | 'low';
  estimatedGains: Record<string, number>;
  actionItems: Array<{
    action: string;
    buttonText: string;
    components?: string[];
  }>;
  connections: string;
  onActionClick?: (action: string) => void;
}

const AcademicInsightItem = ({ title, description, time, type, impact, estimatedGains, actionItems, connections, onActionClick }: AcademicInsightItemProps) => {
  const typeColors = {
    strength: 'text-green-600',
    opportunity: 'text-blue-600',
    improvement: 'text-purple-600',
    warning: 'text-orange-600',
    concern: 'text-red-600'
  };

  const getCheckmarkColor = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'text-muted-foreground';
    }
    if (type === 'concern') {
      return 'text-red-500';
    }
    
    switch (impact) {
      case 'high':
        return 'text-blue-500';
      case 'medium':
        return 'text-green-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBorderClass = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'border-2 border-muted-foreground/30';
    }
    if (type === 'concern') {
      return 'border-2 border-red-500';
    }
    if (impact === 'high') {
      return 'border-2 border-blue-500 shadow-[0_0_15px_5px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_8px_rgba(59,130,246,0.3)]';
    }
    if (impact === 'medium') {
      return 'border-2 border-green-500';
    }
    return 'border-2 border-yellow-500';
  };

  const getImpactBadgeColors = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'bg-muted text-muted-foreground border-muted';
    }
    if (type === 'concern') {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    
    switch (impact) {
      case 'high':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'medium':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getImpactText = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'missed opportunity';
    }
    if (type === 'concern') {
      return 'negative impact';
    }
    return `${impact} impact`;
  };

  return (
    <div className={`p-5 rounded-lg shadow-soft hover:shadow-medium transition-all duration-200 ${getBorderClass(type, impact)}`}>
      <div className="flex items-start gap-3">
        <CheckCircle2 className={`h-6 w-6 mt-0.5 ${getCheckmarkColor(type, impact)} flex-shrink-0`} />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-foreground text-lg">{title}</h4>
                <Badge className={`text-xs px-2 py-1 ${getImpactBadgeColors(type, impact)}`}>
                  {getImpactText(type, impact)}
                </Badge>
              </div>
              <p className="text-sm text-foreground/85 mt-2 leading-relaxed">{description}</p>
            </div>
            <div className="text-right ml-4 min-w-[140px]">
              <div className="text-xs text-muted-foreground mb-2 flex items-center justify-end gap-1 font-medium">
                <Scale className="h-3 w-3" />
                Estimated Impact
              </div>
              <div className="space-y-1 opacity-50">
                {Object.entries(estimatedGains).map(([key, value]) => (
                  <div key={key} className="text-xs font-medium text-muted-foreground">
                    {value >= 0 ? '+' : ''}
                    {value.toFixed(2)} {key}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-md p-3 border border-primary/20">
            <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Academic Focus Areas
            </h5>
            <p className="text-xs text-foreground/80 italic">{connections}</p>
          </div>

          <div className="bg-secondary/10 rounded-md p-3 border border-secondary/30">
            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h6 className="text-foreground font-semibold text-sm flex-1">{item.action}</h6>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-3 text-xs font-semibold bg-background hover:bg-blue-50 border-2 border-border hover:border-blue-300 shadow-md hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-200 hover:scale-105 hover:text-blue-600"
                      onClick={() => onActionClick?.(item.action)}
                    >
                      {item.buttonText}
                    </Button>
                  </div>
                  {item.components && (
                    <div className="ml-4 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.components.map((component, compIndex) => (
                          <div key={compIndex} className="group relative bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/30 rounded-md p-2 hover:from-secondary/30 hover:to-secondary/20 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm">
                            <span className="text-xs text-foreground/90 leading-snug font-normal group-hover:text-foreground transition-colors block">
                              {component}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {time}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Record in Journal
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                View Full Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanner;
