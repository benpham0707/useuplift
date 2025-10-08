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
import MagicBento, { BentoCard } from '@/components/ui/MagicBento';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GraduationCap, TrendingUp, MessageCircle, Send, BookOpen, Target, Calendar, BarChart3, AlertCircle, AlertTriangle, Filter, CheckCircle, Award, Users, MapPin, ChevronDown, ChevronRight, ChevronUp, TrendingDown, Clock, Star, Calculator, X, Check, Zap, Brain, Scale, Link, CheckCircle2, Lightbulb, Minus, ArrowRight } from 'lucide-react';

// SubjectPerformanceAnalytics subcomponent for year-based expandable analytics
const SubjectPerformanceAnalytics: React.FC = () => {
  // Hard coded data values for 4 academic years and their subjects with key metrics (GPA, progress, strongest subjects, course difficulty, achievements)
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const academicYearsData = {
    "2020-2021": {
      year: "Freshman Year",
      overallGPA: "3.4",
      performance: "Foundation Building",
      status: "complete",
      keyInsights: ["Adjusted to high school rigor", "Strongest in English and History", "Math and science foundational courses", "GPA: 3.4 (Above average start)"],
      detailedMetrics: {
        gpaImprovement: "+0.2 from first to second semester",
        strongestSubjects: ["English", "History", "Art"],
        courseDifficulty: "Standard level courses - appropriate for transition",
        notableAchievements: "Made honor roll both semesters"
      }
    },
    "2021-2022": {
      year: "Sophomore Year",
      overallGPA: "3.6",
      performance: "Steady Growth",
      status: "complete",
      keyInsights: ["Consistent GPA improvement (+0.2)", "First AP course success (AP History)", "Strong foundation in core subjects", "Developed better study habits"],
      detailedMetrics: {
        gpaImprovement: "+0.2 from previous year",
        strongestSubjects: ["AP History", "English", "Chemistry"],
        courseDifficulty: "Mixed standard and honors - 15% harder than average",
        notableAchievements: "AP History score of 4, consistently on honor roll"
      }
    },
    "2022-2023": {
      year: "Junior Year",
      overallGPA: "3.8",
      performance: "Peak Performance",
      status: "complete",
      keyInsights: ["Significant GPA jump (+0.2)", "Multiple AP course success", "Strong in STEM subjects", "Top 15% class ranking achieved"],
      detailedMetrics: {
        gpaImprovement: "+0.2 from previous year - largest improvement",
        strongestSubjects: ["AP Biology", "AP Literature", "Pre-Calculus"],
        courseDifficulty: "Rigorous schedule - 25% harder than average",
        notableAchievements: "3 AP courses, all honor roll, science fair winner"
      }
    },
    "2023-2024": {
      year: "Senior Year",
      overallGPA: "3.8",
      performance: "Maintaining Excellence",
      status: "in-progress",
      keyInsights: ["Sustained high performance", "Most challenging course load", "College-level coursework success", "Leadership role development"],
      detailedMetrics: {
        gpaImprovement: "Maintained 3.8 - consistent excellence",
        strongestSubjects: ["AP Chemistry", "AP Calculus BC", "AP Physics"],
        courseDifficulty: "Maximum rigor - 35% harder than average",
        notableAchievements: "5 AP courses, dual enrollment, student government"
      }
    }
  } as const;
  const subjectPerformanceData = {
    "2020-2021": [{
      subject: "English 9",
      grade: "A-",
      relevance: "Core",
      avgGPA: "3.2",
      classRank: "Top 25%",
      trend: "stable",
      improvement: "Baseline year"
    }, {
      subject: "Algebra I",
      grade: "B+",
      relevance: "High",
      avgGPA: "3.0",
      classRank: "Top 30%",
      trend: "up",
      improvement: "Baseline year"
    }, {
      subject: "Biology",
      grade: "A",
      relevance: "High",
      avgGPA: "3.1",
      classRank: "Top 20%",
      trend: "stable",
      improvement: "Baseline year"
    }],
    "2021-2022": [{
      subject: "English 10",
      grade: "A",
      relevance: "Core",
      avgGPA: "3.3",
      classRank: "Top 20%",
      trend: "up",
      improvement: "+0.3 grade improvement"
    }, {
      subject: "Geometry",
      grade: "A-",
      relevance: "High",
      avgGPA: "3.1",
      classRank: "Top 25%",
      trend: "up",
      improvement: "+0.3 grade improvement"
    }, {
      subject: "Chemistry",
      grade: "B+",
      relevance: "High",
      avgGPA: "2.9",
      classRank: "Top 35%",
      trend: "stable",
      improvement: "Maintained performance"
    }, {
      subject: "AP History",
      grade: "A-",
      relevance: "Medium",
      avgGPA: "3.4",
      classRank: "Top 20%",
      trend: "up",
      improvement: "First AP success"
    }],
    "2022-2023": [{
      subject: "AP Literature",
      grade: "A",
      relevance: "Core",
      avgGPA: "3.5",
      classRank: "Top 15%",
      trend: "up",
      improvement: "+0.3 from previous English"
    }, {
      subject: "Pre-Calculus",
      grade: "A-",
      relevance: "Critical",
      avgGPA: "3.2",
      classRank: "Top 20%",
      trend: "up",
      improvement: "+0.3 continued math growth"
    }, {
      subject: "AP Biology",
      grade: "A",
      relevance: "Critical",
      avgGPA: "3.1",
      classRank: "Top 15%",
      trend: "up",
      improvement: "Significant STEM improvement"
    }, {
      subject: "Physics",
      grade: "B+",
      relevance: "High",
      avgGPA: "3.0",
      classRank: "Top 30%",
      trend: "stable",
      improvement: "New subject - solid performance"
    }],
    "2023-2024": [{
      subject: "AP Chemistry",
      grade: "A-",
      relevance: "Critical",
      avgGPA: "2.8",
      classRank: "Top 20%",
      trend: "up",
      improvement: "+0.5 major improvement from Chemistry"
    }, {
      subject: "AP Calculus BC",
      grade: "A",
      relevance: "Critical",
      avgGPA: "3.1",
      classRank: "Top 15%",
      trend: "up",
      improvement: "+0.3 continued excellence in math"
    }, {
      subject: "AP Physics C",
      grade: "B+",
      relevance: "High",
      avgGPA: "2.9",
      classRank: "Top 25%",
      trend: "up",
      improvement: "+0.3 significant physics improvement"
    }, {
      subject: "AP English Language",
      grade: "A",
      relevance: "Core",
      avgGPA: "3.4",
      classRank: "Top 10%",
      trend: "stable",
      improvement: "Maintained excellence"
    }, {
      subject: "AP Government",
      grade: "A-",
      relevance: "Medium",
      avgGPA: "3.3",
      classRank: "Top 20%",
      trend: "stable",
      improvement: "Consistent social studies performance"
    }]
  } as const;
  const toggleYear = (year: string) => {
    setExpandedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };
  return <div className="space-y-4">
      {Object.entries(academicYearsData).map(([year, data]) => <Collapsible key={year} open={expandedYears.includes(year)} onOpenChange={() => toggleYear(year)}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer transition-all duration-200 border-l-4 border-l-primary border border-purple-500/50 hover:border-primary/30 hover:shadow-lg backdrop-blur-sm rounded-xl shadow-sm relative overflow-hidden group" style={{background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(99, 102, 241, 0.35), rgba(59, 130, 246, 0.4))'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {expandedYears.includes(year) ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
                      <h3 className="font-semibold text-sm text-white">{data.year}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          data.status === 'complete' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {data.status}
                      </Badge>
                    </div>
                    <div className="ml-6">
                      <div className="text-base font-bold text-white">{data.overallGPA}</div>
                      <div className="text-[10px] text-white/70">GPA</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 shadow-sm">
                      <div className="flex items-center gap-1">
                        {data.detailedMetrics.gpaImprovement.includes('+') ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : data.detailedMetrics.gpaImprovement.includes('Maintained') ? <Minus className="w-3 h-3 text-blue-600" /> : <TrendingDown className="w-3 h-3 text-amber-600" />}
                        <span className="text-[11px] font-semibold text-white">
                          {data.detailedMetrics.gpaImprovement.includes('+') ? '+' + (data.detailedMetrics.gpaImprovement.match(/\+([0-9.]+)/)?.[1] || '0.0') : data.detailedMetrics.gpaImprovement.includes('Maintained') ? '0.0' : '-0.1'}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70">Trend</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 shadow-sm">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-amber-600" />
                        <span className="text-[11px] font-semibold text-white">
                          {data.detailedMetrics.courseDifficulty.includes('Standard') ? '2.5' : data.detailedMetrics.courseDifficulty.includes('15%') ? '3.0' : data.detailedMetrics.courseDifficulty.includes('25%') ? '4.0' : data.detailedMetrics.courseDifficulty.includes('35%') ? '4.5' : '2.0'}/5
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70">Difficulty</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 shadow-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-blue-600" />
                        <span className="text-[11px] font-semibold text-white">
                          {data.detailedMetrics.notableAchievements.includes('AP') ? data.detailedMetrics.notableAchievements.match(/(\d+)\s*AP/)?.[1] || '0' : '0'}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70">AP</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Card className="border border-purple-500/50 backdrop-blur-sm rounded-xl shadow-sm relative overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(99, 102, 241, 0.35), rgba(59, 130, 246, 0.4))'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
              <CardContent className="p-4 relative z-10">
                <h4 className="font-medium mb-3 text-white text-sm">Subject Performance Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(subjectPerformanceData[year as keyof typeof subjectPerformanceData] || []).map((subject, idx) => <Card key={idx} className="border border-purple-500/50 hover:border-primary/40 transition-all duration-200 hover:shadow-md backdrop-blur-sm rounded-lg shadow-sm relative overflow-hidden group" style={{background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(99, 102, 241, 0.35), rgba(59, 130, 246, 0.4))'}}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardContent className="p-3 relative z-10">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-white text-sm">{subject.subject}</h5>
                            <Badge 
                              variant={subject.grade.includes('A') ? 'default' : subject.grade.includes('B') ? 'secondary' : 'outline'} 
                              className={`text-xs ${
                                subject.grade.includes('A') 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                  : subject.grade.includes('B') 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              {subject.grade}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/70">Relevance:</span>
                              <span className="font-medium text-white">{subject.relevance}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">Class Avg:</span>
                              <span className="font-medium text-white">{subject.avgGPA}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">Class Rank:</span>
                              <span className="font-medium text-white">{subject.classRank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">vs Last Year:</span>
                              <span className="font-medium text-white">{subject.improvement}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>)}
    </div>;
};

const AcademicPlanner = () => {
  // State for chart toggle
  const [chartView, setChartView] = useState<'line' | 'hexagon'>('line');
  const [isExpanded, setIsExpanded] = useState(false);

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
  const gpaTimeData = [{
    semester: 'Fall 2022',
    yourGPA: 3.5,
    majorAverage: 3.1
  }, {
    semester: 'Spring 2023',
    yourGPA: 3.6,
    majorAverage: 3.2
  }, {
    semester: 'Fall 2023',
    yourGPA: 3.7,
    majorAverage: 3.2
  }, {
    semester: 'Spring 2024',
    yourGPA: 3.8,
    majorAverage: 3.3
  }, {
    semester: 'Fall 2024',
    yourGPA: 3.8,
    majorAverage: 3.2
  }];

  // Hard coded data for expandable insights
  const insights = [{
    id: 'course-requirements',
    title: 'Course Requirements Analysis',
    status: 'complete',
    percentage: 85,
    icon: CheckCircle,
    color: 'green',
    summary: 'On track with core requirements',
    details: 'You have completed 85% of your major requirements. Remaining courses include Advanced Statistics, Research Methods, and Senior Capstone. Current trajectory shows completion by graduation.',
    recommendations: ['Enroll in Advanced Statistics next semester', 'Consider Research Methods over summer']
  }, {
    id: 'gpa-trajectory',
    title: 'GPA Trajectory Analysis',
    status: 'warning',
    percentage: 78,
    icon: TrendingUp,
    color: 'orange',
    summary: 'Slight decline trend detected',
    details: 'Your GPA has decreased by 0.1 points over the last semester. This trend, if continued, may impact your target GPA goals and competitive graduate school applications.',
    recommendations: ['Focus on improving study habits', 'Consider tutoring for challenging subjects', 'Meet with academic advisor']
  }, {
    id: 'graduation-timeline',
    title: 'Graduation Timeline',
    status: 'complete',
    percentage: 92,
    icon: Clock,
    color: 'green',
    summary: 'On schedule for timely graduation',
    details: 'Based on current credit completion rate, you are projected to graduate on time in Spring 2025. All prerequisite chains are being followed correctly.',
    recommendations: ['Maintain current course load', 'Consider adding electives of interest']
  }, {
    id: 'competitive-standing',
    title: 'Competitive Standing',
    status: 'excellent',
    percentage: 95,
    icon: Star,
    color: 'purple',
    summary: 'Top 5% of class performance',
    details: 'Your academic performance places you in the top 5% of your graduating class. This strong standing positions you well for competitive opportunities.',
    recommendations: ['Apply for honors programs', 'Consider research opportunities', 'Explore leadership positions']
  }];
  
  const [expandedAG, setExpandedAG] = useState(false);
  const [taskPlanningOpen, setTaskPlanningOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
  const [expandedTrophyTier, setExpandedTrophyTier] = useState<string | null>(null);
  const [expandedTaskPriority, setExpandedTaskPriority] = useState<string | null>(null);

  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const toggleTrophyTier = (tier: string) => {
    setExpandedTrophyTier(prev => prev === tier ? null : tier);
  };

  const toggleTaskPriority = (priority: string) => {
    setExpandedTaskPriority(prev => prev === priority ? null : priority);
  };

  // Hard coded data values for task planning - defines bundled academic planning objectives
  const taskDatabase = {
    "Master Chemistry Performance": {
      title: "Master Chemistry Performance",
      impact: "High",
      difficulty: "Medium",
      timeframe: "6-8 weeks",
      category: "Academic Excellence",
      description: "Comprehensive strategy to dramatically improve chemistry performance through structured support systems, optimized study methods, and collaborative learning.",
      importance: "Chemistry is a foundational subject for pre-med tracks and STEM majors.",
      takeaways: ["Develop comprehensive understanding", "Build confidence in laboratory techniques", "Create sustainable study systems"],
      phases: []
    }
  };

  // Open the task planning interface
  const handleTaskPlanningOpen = (actionText: string) => {
    const task = taskDatabase[actionText as keyof typeof taskDatabase] ?? taskDatabase["Master Chemistry Performance"];
    setSelectedTask(task);
    setTaskPlanningOpen(true);
  };

  // Academic Subject Performance Data
  const subjectPerformanceData = [
    { subject: 'Math', score: 85, color: '#9333ea' },
    { subject: 'Science', score: 78, color: '#3b82f6' },
    { subject: 'English/ELA', score: 92, color: '#10b981' },
    { subject: 'History', score: 88, color: '#f59e0b' },
    { subject: 'World Language', score: 75, color: '#ef4444' },
    { subject: 'Arts', score: 90, color: '#8b5cf6' }
  ];

  // Hexagonal Chart Component - Holographic Tech Style
  const HexagonalChart = () => {
    const centerX = 200; // Centered in new viewBox
    const centerY = 200; // Centered in new viewBox
    const radius = 140; // Increased radius to fill more space
    const maxScore = 100;

    // Calculate hexagon points
    const hexPoints = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180); // Start from top (-90 degrees)
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y };
    });

    // Calculate performance points
    const performancePoints = subjectPerformanceData.map((subject, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const scoreRadius = (subject.score / maxScore) * radius;
      const x = centerX + scoreRadius * Math.cos(angle);
      const y = centerY + scoreRadius * Math.sin(angle);
      return { x, y, subject: subject.subject, score: subject.score, color: subject.color };
    });

    // Create path for performance area
    const performancePath = performancePoints.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <div className="h-[450px] w-full flex items-center justify-center relative">
        {/* Subtle static background glow (performance-friendly) */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-blue-500/10 rounded-full blur-2xl" />
        
        <svg width="450" height="450" viewBox="-50 -50 500 500" className="relative z-10">
          <defs>
            {/* Simple glow filter */}
            <filter id="simpleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Holographic gradient for performance area */}
            <linearGradient id="holographicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.4" />
              <stop offset="25%" stopColor="#9333ea" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="75%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0.4" />
            </linearGradient>
            
            {/* Glowing effect for grid lines */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Neon glow for points */}
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* 3D effect gradient */}
            <linearGradient id="pointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00ffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.9" />
            </linearGradient>
            
            {/* Holographic text effect */}
            <filter id="textGlow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Hologram diagonal stripe pattern */}
            <pattern id="holoStripes" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(30)">
              <rect width="12" height="12" fill="transparent" />
              <rect x="0" y="0" width="6" height="12" fill="#7dd3fc" opacity="0.08" />
            </pattern>

            {/* Soft radial highlight for hologram look */}
            <radialGradient id="holoRadial" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#a78bfa" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* White background hexagon (render first so markers show on top) */}
          <polygon
            points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="#ffffff"
            fillOpacity="1"
          />
          
          {/* Milestone demarkers - concentric hexagons */}
          {[0.2, 0.4, 0.6, 0.8].map((scale, i) => (
            <polygon
              key={i}
              points={hexPoints.map(p => `${centerX + (p.x - centerX) * scale},${centerY + (p.y - centerY) * scale}`).join(' ')}
              fill="none"
              stroke="#2d3748"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          ))}
          
          {/* Milestone labels with subtle pills */}
          {[20, 40, 60, 80].map((value, i) => {
            const scale = [0.2, 0.4, 0.6, 0.8][i];
            const labelX = centerX + (hexPoints[0].x - centerX) * scale;
            const labelY = centerY + (hexPoints[0].y - centerY) * scale - 2;
            
            return (
              <g key={i}>
                <rect
                  x={labelX - 14}
                  y={labelY - 9}
                  width={28}
                  height={18}
                  rx={9}
                  fill="#ffffff"
                  opacity="0.35"
                  stroke="url(#holographicGradient)"
                  strokeOpacity="0.5"
                  strokeWidth="0.5"
                />
                <text
                  x={labelX}
                  y={labelY + 4}
                  textAnchor="middle"
                  fill="#374151"
                  style={{ fontSize: '10px', fontWeight: '600' }}
                >
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* Clean hexagonal border */}
          <polygon
            points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="url(#holographicGradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Aesthetic points at hexagon corners */}
          {hexPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="url(#holographicGradient)"
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
          
          {/* Performance area with layered holographic fills */}
          <g>
            {/* Base holographic gradient */}
            <path
              d={performancePath}
              fill="url(#holographicGradient)"
              fillOpacity="0.35"
              stroke="url(#holographicGradient)"
              strokeWidth="2"
              filter="url(#glow)"
            />
            {/* Diagonal stripe shimmer */}
            <path d={performancePath} fill="url(#holoStripes)" opacity="0.12" />
            {/* Radial highlight */}
            <path d={performancePath} fill="url(#holoRadial)" opacity="0.12" />
          </g>
          
          {/* No per-point inner numbers; milestone values are on the ring vertices */}
          
          {/* Subject labels with holographic aesthetic */}
          {hexPoints.map((point, i) => {
            const subject = subjectPerformanceData[i];
            const labelAngle = (i * 60 - 90) * (Math.PI / 180);
            const corner = hexPoints[i];
            // Offset tuning: provide adequate spacing for labels with larger hexagon
            const labelOffset = subject.subject === 'History' ? 35 : subject.subject === 'Math' ? 35 : 45;
            const labelX = corner.x + labelOffset * Math.cos(labelAngle);
            const labelY = corner.y + labelOffset * Math.sin(labelAngle);
            
            // Calculate dynamic width based on text length with better sizing
            const textLength = subject.subject.length;
            const baseWidth = Math.max(80, textLength * 10); // Increased minimum and per-character width
            const width = Math.min(baseWidth, 120); // Increased cap for very long text
            
            return (
              <g key={i}>
                {/* Holographic label background */}
                <rect
                  x={labelX - width/2}
                  y={labelY - 14}
                  width={width}
                  height="36"
                  rx="16"
                  fill="url(#holographicGradient)"
                  fillOpacity="0.3"
                  stroke="url(#holographicGradient)"
                  strokeWidth="1"
                  filter="url(#glow)"
                />
                
                {/* Holographic label text with reduced glow */}
                <text
                  x={labelX}
                  y={labelY + 0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-sm font-semibold"
                  style={{ 
                    textShadow: '0 0 3px #00ffff, 0 0 1px #ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}
                >
                  {subject.subject}
                </text>
                {/* Subtle underline under subject title */}
                <line
                  x1={labelX - width/2 + 8}
                  x2={labelX + width/2 - 8}
                  y1={labelY + 6}
                  y2={labelY + 6}
                  stroke="url(#holographicGradient)"
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />
                {/* Score below subject label with more spacing */}
                <text
                  x={labelX}
                  y={labelY + 18}
                  textAnchor="middle"
                  className="fill-white"
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textShadow: '0 0 4px rgba(0,255,255,0.7), 0 0 2px #ffffff'
                  }}
                >
                  {subject.score}
                </text>
                {/* Underline under the score number */}
                <line
                  x1={labelX - Math.min(24, width/2 - 10)}
                  x2={labelX + Math.min(24, width/2 - 10)}
                  y1={labelY + 22}
                  y2={labelY + 22}
                  stroke="url(#holographicGradient)"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />
              </g>
            );
          })}
          
          </svg>
      </div>
    );
  };

  // GPA Line Chart Component
  const GPALineChart = () => {
    return <div className="space-y-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gpaTimeData} margin={{ top: 20, right: 10, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#444" strokeWidth={1} />
              <XAxis dataKey="semester" tick={{ fontSize: 11, fill: '#fff', fontWeight: 500 }} axisLine={{ stroke: '#555', strokeWidth: 1 }} tickLine={{ stroke: '#555', strokeWidth: 1 }} height={40} />
              <YAxis domain={[2.8, 4.0]} ticks={[2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0]} tick={{ fontSize: 11, fill: '#fff', fontWeight: 500 }} axisLine={{ stroke: '#555', strokeWidth: 1 }} tickLine={{ stroke: '#555', strokeWidth: 1 }} width={40} />
              <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #555', borderRadius: '8px', fontSize: '12px', fontWeight: '500' }} labelStyle={{ color: '#fff', fontWeight: '600' }} />
              <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px', fontWeight: '500' }} />
              
              <ReferenceLine y={gpaData.target} stroke="#dc2626" strokeDasharray="6 3" strokeWidth={2} label={{ value: "Target", position: "top", fill: "#dc2626", fontSize: "11px", fontWeight: "600", offset: 5 }} />
              
              <Line type="monotone" dataKey="yourGPA" stroke="#9333ea" strokeWidth={3} dot={{ fill: '#9333ea', strokeWidth: 2, r: 4, stroke: '#ffffff' }} name="Your GPA" />
              <Line type="monotone" dataKey="majorAverage" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#ffffff' }} name="Major Avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>;
  };

  // Define the bento cards
  const bentoCards: BentoCard[] = [
    // Card 1: Subject Performance Analytics (Large - 2x2)
    {
      content: (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Performance</div>
          </div>
          <div className="card__content flex-1 overflow-auto">
            <h2 className="card__title text-xl font-bold text-white mb-2">Subject Analytics</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Year-by-year academic performance breakdown</p>
            <SubjectPerformanceAnalytics />
          </div>
        </div>
      )
    },
    // Card 2: GPA Trends (Medium - 1x2)
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Trends</div>
          </div>
          <div className="card__content flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="card__title text-xl font-bold text-white">GPA Analysis</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartView('line')}
                  className={`p-1.5 rounded-md transition-colors ${
                    chartView === 'line' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title="Line Chart View"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartView('hexagon')}
                  className={`p-1.5 rounded-md transition-colors ${
                    chartView === 'hexagon' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title="Hexagon Chart View"
                >
                  <Target className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-md bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="card__description text-white/70 mb-4 text-sm">
              {chartView === 'line' ? 'Track your GPA progression over time' : 'View performance across academic subjects'}
            </p>
            
            {!isExpanded ? (
              // Single chart view
              chartView === 'line' ? <GPALineChart /> : <HexagonalChart />
            ) : (
              // Expanded view with both charts
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">GPA Trends Over Time</h3>
                  <GPALineChart />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Subject Performance Analysis</h3>
                  <HexagonalChart />
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      className: "gpa-card"
    },
    // Card 4: Recent Insights (Large - 4x1)
    {
      content: (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Insights</div>
          </div>
          <div className="card__content flex-1 overflow-auto">
            <h2 className="card__title text-xl font-bold text-white mb-2">AI Recommendations</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Strategic academic guidance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {insights.map((insight) => (
                <Collapsible key={insight.id} open={expandedInsights.includes(insight.id)} onOpenChange={() => toggleInsight(insight.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/20 cursor-pointer hover:bg-white/90 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <insight.icon className="h-4 w-4 text-purple-600" />
                        <h3 className="text-gray-800 text-xs font-semibold">{insight.title}</h3>
                        <ChevronDown className="h-3 w-3 text-gray-600 ml-auto" />
                      </div>
                      <p className="text-gray-600 text-[10px] mb-2">{insight.summary}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-4">{insight.percentage}%</Badge>
                        <Badge variant={insight.status === 'complete' || insight.status === 'excellent' ? 'default' : insight.status === 'warning' ? 'destructive' : 'secondary'} className="text-[10px] h-4">{insight.status}</Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/20 shadow-sm">
                      <p className="text-gray-700 text-[10px] mb-2">{insight.details}</p>
                      <div className="space-y-1">
                        <p className="text-gray-800 text-[10px] font-semibold">Recommendations:</p>
                        {insight.recommendations.map((rec, idx) => (
                          <p key={idx} className="text-gray-600 text-[10px] pl-2">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                ))}
            </div>
          </div>
        </div>
      ),
      className: "insights-full"
    },
    // Card 5: Trophy Case (Large - 2x2)
    {
      content: (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Achievements</div>
          </div>
          <div className="card__content flex-1 overflow-auto">
            <h2 className="card__title text-xl font-bold text-white mb-2">Trophy Case</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Your academic accomplishments</p>
            <div className="space-y-3">
              {/* Gold Tier - Expandable */}
              <Collapsible open={expandedTrophyTier === 'gold'} onOpenChange={() => toggleTrophyTier('gold')}>
                <CollapsibleTrigger asChild>
                  <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-3 border border-yellow-300/30 cursor-pointer hover:bg-yellow-100/90 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-gray-800 font-bold text-sm">Gold Tier</h3>
                      <Badge className="ml-auto bg-yellow-200 text-yellow-800 text-xs border-yellow-300">3 Achievements</Badge>
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-2 border border-yellow-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">AP Biology - Perfect Score: 5</div>
                      <p className="text-gray-600 text-xs mb-2">Exceptional mastery of advanced biological concepts</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-2 border border-yellow-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">Science Fair Winner</div>
                      <p className="text-gray-600 text-xs mb-2">First place in regional science competition</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-2 border border-yellow-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">Honor Roll (All Semesters)</div>
                      <p className="text-gray-600 text-xs mb-2">Consistent academic excellence throughout high school</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Silver Tier - Expandable */}
              <Collapsible open={expandedTrophyTier === 'silver'} onOpenChange={() => toggleTrophyTier('silver')}>
                <CollapsibleTrigger asChild>
                  <div className="bg-gray-100/80 backdrop-blur-sm rounded-lg p-3 border border-gray-300/30 cursor-pointer hover:bg-gray-100/90 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-gray-600" />
                      <h3 className="text-gray-800 font-bold text-sm">Silver Tier</h3>
                      <Badge className="ml-auto bg-gray-200 text-gray-800 text-xs border-gray-300">2 Achievements</Badge>
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    <div className="bg-gray-100/80 backdrop-blur-sm rounded-lg p-2 border border-gray-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">AP History Score: 4</div>
                      <p className="text-gray-600 text-xs mb-2">Strong performance in AP coursework</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-gray-400/30 text-gray-600 hover:bg-gray-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <div className="bg-gray-100/80 backdrop-blur-sm rounded-lg p-2 border border-gray-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">Top 15% Class Ranking</div>
                      <p className="text-gray-600 text-xs mb-2">Competitive academic standing</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-gray-400/30 text-gray-600 hover:bg-gray-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Bronze Tier - Expandable */}
              <Collapsible open={expandedTrophyTier === 'bronze'} onOpenChange={() => toggleTrophyTier('bronze')}>
                <CollapsibleTrigger asChild>
                  <div className="bg-orange-100/80 backdrop-blur-sm rounded-lg p-3 border border-orange-300/30 cursor-pointer hover:bg-orange-100/90 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-orange-600" />
                      <h3 className="text-gray-800 font-bold text-sm">Bronze Tier</h3>
                      <Badge className="ml-auto bg-orange-200 text-orange-800 text-xs border-orange-300">2 Achievements</Badge>
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    <div className="bg-orange-100/80 backdrop-blur-sm rounded-lg p-2 border border-orange-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">Academic Improvement</div>
                      <p className="text-gray-600 text-xs mb-2">+0.6 GPA improvement over 4 years</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <div className="bg-orange-100/80 backdrop-blur-sm rounded-lg p-2 border border-orange-300/20 shadow-sm">
                      <div className="text-gray-800 text-sm font-semibold mb-1">Leadership Participation</div>
                      <p className="text-gray-600 text-xs mb-2">Student government involvement</p>
                      <Button size="sm" variant="outline" className="h-6 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-200">
                        Leverage This <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
             </div>
          </div>
        </div>
      ),
      className: "trophy-card"
    },
    // Card 6: Academic Tasks (Large - 2x2)
    {
      content: (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Action Items</div>
          </div>
          <div className="card__content flex-1 overflow-auto">
            <h2 className="card__title text-xl font-bold text-white mb-2">Academic Tasks</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Prioritized action dashboard</p>
            <div className="space-y-3">
              {/* High Priority - Expandable */}
              <Collapsible open={expandedTaskPriority === 'high'} onOpenChange={() => toggleTaskPriority('high')}>
                <CollapsibleTrigger asChild>
                  <div className="bg-red-100/80 backdrop-blur-sm rounded-lg p-3 border border-red-300/30 cursor-pointer hover:bg-red-100/90 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <h3 className="text-gray-800 font-bold text-sm">High Priority</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    <div className="bg-red-100/80 backdrop-blur-sm rounded-lg p-2 border border-red-300/20 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-800 text-sm font-semibold">Master Chemistry Performance</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs border-red-500/30 text-red-600 hover:bg-red-200" onClick={() => handleTaskPlanningOpen("Master Chemistry Performance")}>
                          Plan This <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">6-8 week improvement strategy</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px] h-4">High Impact</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">Medium Difficulty</Badge>
                      </div>
                    </div>
                    <div className="bg-red-100/80 backdrop-blur-sm rounded-lg p-2 border border-red-300/20 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-800 text-sm font-semibold">Secure Strong Recommendation Letters</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs border-red-500/30 text-red-600 hover:bg-red-200">
                          Plan This <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">Build relationships with 3-4 potential recommenders</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px] h-4">Critical</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">4-6 weeks</Badge>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Medium Priority - Expandable */}
              <Collapsible open={expandedTaskPriority === 'medium'} onOpenChange={() => toggleTaskPriority('medium')}>
                <CollapsibleTrigger asChild>
                  <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-3 border border-yellow-300/30 cursor-pointer hover:bg-yellow-100/90 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <h3 className="text-gray-800 font-bold text-sm">Medium Priority</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Soon</Badge>
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-2 border border-yellow-300/20 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-800 text-sm font-semibold">Optimize Senior Year Planning</span>
                          <Button size="sm" variant="outline" className="h-6 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-200">
                          Plan This <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">Strategic course selection and scheduling</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px] h-4">Planning</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">3-4 weeks</Badge>
                      </div>
                    </div>
                    <div className="bg-yellow-100/80 backdrop-blur-sm rounded-lg p-2 border border-yellow-300/20 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-800 text-sm font-semibold">Explore Summer Research Opportunities</span>
                          <Button size="sm" variant="outline" className="h-6 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-200">
                          Plan This <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">Identify and apply to relevant programs</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px] h-4">Enrichment</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">8-12 weeks</Badge>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Future Planning - Expandable */}
              <Collapsible open={expandedTaskPriority === 'future'} onOpenChange={() => toggleTaskPriority('future')}>
                <CollapsibleTrigger asChild>
                  <div className="bg-blue-100/80 backdrop-blur-sm rounded-lg p-3 border border-blue-300/30 cursor-pointer hover:bg-blue-100/90 transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <h3 className="text-gray-800 font-bold text-sm">Future Planning</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Long-term</Badge>
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    <div className="bg-blue-100/80 backdrop-blur-sm rounded-lg p-2 border border-blue-300/20 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-800 text-sm font-semibold">Prepare for AP Exams</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs border-blue-500/30 text-blue-600 hover:bg-blue-200">
                          Plan This <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">Comprehensive review schedule for spring exams</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px] h-4">Test Prep</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">12+ weeks</Badge>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
             </div>
          </div>
        </div>
      ),
      className: "tasks-card"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Academic Metrics */}
      <div className="hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Academic Planner
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Track your progress and plan your academic journey strategically
            </p>
          </div>

          {/* Academic Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-purple-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {currentGPA.weighted}
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Weighted GPA</div>
            </div>
            <div className="text-center p-4 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-purple-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {currentGPA.unweighted}
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Unweighted GPA</div>
            </div>
            <div className="text-center p-4 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-purple-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round((1 - currentGPA.classRank / currentGPA.totalStudents) * 100)}th
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Percentile</div>
            </div>
            <div className="text-center p-4 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-purple-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round((currentGPA.creditsCompleted / currentGPA.totalCredits) * 100)}%
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Progress</div>
            </div>
          </div>

          {/* Progress Bar and Requirements Checklist */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-background/70 backdrop-blur-md rounded-xl p-6 border border-primary/20 shadow-glow">
              <h3 className="text-xl font-semibold mb-4 flex items-center bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Academic Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-foreground/90 mb-2">
                    <span>Credits Completed</span>
                    <span className="font-semibold">{currentGPA.creditsCompleted}/{currentGPA.totalCredits}</span>
                  </div>
                  <Progress value={(currentGPA.creditsCompleted / currentGPA.totalCredits) * 100} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-foreground/90 mb-2">
                    <span>Class Rank</span>
                    <span className="font-semibold">{currentGPA.classRank}/{currentGPA.totalStudents}</span>
                  </div>
                  <Progress value={(1 - currentGPA.classRank / currentGPA.totalStudents) * 100} className="h-3" />
                </div>
              </div>
            </div>

            <div className="bg-background/70 backdrop-blur-md rounded-xl p-4 border border-primary/20 shadow-glow">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Requirements Checklist</span>
                <Badge variant="secondary" className="ml-auto text-xs">15/18</Badge>
              </div>
              <ScrollArea className="h-[100px]">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2"><Check className="h-3 w-3 text-green-600" /><span>4+ AP Courses</span></div>
                  <div className="flex items-center gap-2"><Check className="h-3 w-3 text-green-600" /><span>Honors Track</span></div>
                  <div className="flex items-center gap-2"><X className="h-3 w-3 text-slate-400" /><span>8+ AP Planned</span></div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* MagicBento Grid Section */}
      <div className="w-full p-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <MagicBento 
            cards={bentoCards}
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={false}
            clickEffect={false}
            particleCount={6}
            glowColor="147, 51, 234"
            spotlightRadius={200}
          />
        </div>
      </div>

      {/* Task Planning Interface Modal */}
      {taskPlanningOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setTaskPlanningOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <TaskPlanningInterface isOpen={taskPlanningOpen} task={selectedTask} onClose={() => setTaskPlanningOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicPlanner;
