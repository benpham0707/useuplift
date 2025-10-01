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
    setExpandedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };
  return <div className="space-y-4">
      {Object.entries(academicYearsData).map(([year, data]) => <Collapsible key={year} open={expandedYears.includes(year)} onOpenChange={() => toggleYear(year)}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-primary/60 bg-background">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {expandedYears.includes(year) ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
                      <h3 className="font-semibold text-sm text-white">{data.year}</h3>
                      <Badge variant="secondary" className="text-xs">{data.status}</Badge>
                    </div>
                    <div className="ml-6">
                      <div className="text-base font-bold text-primary">{data.overallGPA}</div>
                      <div className="text-[10px] text-white/70">GPA</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-1">
                        {data.detailedMetrics.gpaImprovement.includes('+') ? <TrendingUp className="w-3 h-3 text-green-400" /> : data.detailedMetrics.gpaImprovement.includes('Maintained') ? <Minus className="w-3 h-3 text-blue-400" /> : <TrendingDown className="w-3 h-3 text-orange-400" />}
                        <span className="text-[11px] font-semibold text-white">
                          {data.detailedMetrics.gpaImprovement.includes('+') ? '+' + (data.detailedMetrics.gpaImprovement.match(/\+([0-9.]+)/)?.[1] || '0.0') : data.detailedMetrics.gpaImprovement.includes('Maintained') ? '0.0' : '-0.1'}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70">Trend</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-gradient-to-br from-amber/10 to-amber/5 border border-amber/20">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-amber-400" />
                        <span className="text-[11px] font-semibold text-white">
                          {data.detailedMetrics.courseDifficulty.includes('Standard') ? '2.5' : data.detailedMetrics.courseDifficulty.includes('15%') ? '3.0' : data.detailedMetrics.courseDifficulty.includes('25%') ? '4.0' : data.detailedMetrics.courseDifficulty.includes('35%') ? '4.5' : '2.0'}/5
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70">Difficulty</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-gradient-to-br from-blue/10 to-blue/5 border border-blue/20">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-blue-400" />
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
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-white text-sm">Subject Performance Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(subjectPerformanceData[year as keyof typeof subjectPerformanceData] || []).map((subject, idx) => <Card key={idx} className="bg-background/50">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-white text-sm">{subject.subject}</h5>
                            <Badge variant={subject.grade.includes('A') ? 'default' : subject.grade.includes('B') ? 'secondary' : 'outline'} className="text-xs">{subject.grade}</Badge>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-white/70">Relevance:</span><span className="font-medium text-white">{subject.relevance}</span></div>
                            <div className="flex justify-between"><span className="text-white/70">Class Avg:</span><span className="font-medium text-white">{subject.avgGPA}</span></div>
                            <div className="flex justify-between"><span className="text-white/70">Class Rank:</span><span className="font-medium text-white">{subject.classRank}</span></div>
                            <div className="flex justify-between"><span className="text-white/70">vs Last Year:</span><span className="font-medium text-white">{subject.improvement}</span></div>
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
            <h2 className="card__title text-xl font-bold text-white mb-2">GPA Analysis</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Track your GPA progression over time</p>
            <GPALineChart />
          </div>
        </div>
      )
    },
    // Card 3: Course Requirements (Medium - 1x2)
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Requirements</div>
          </div>
          <div className="card__content flex-1">
            <h2 className="card__title text-xl font-bold text-white mb-2">Course Checklist</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Academic requirements tracker</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white">
                <Check className="h-3 w-3 text-green-400" />
                <span>4+ AP Courses Completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white">
                <Check className="h-3 w-3 text-green-400" />
                <span>On Track for Graduation</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white">
                <Check className="h-3 w-3 text-green-400" />
                <span>Honors Diploma Track</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <X className="h-3 w-3 text-red-400" />
                <span>8+ AP Courses Planned</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <X className="h-3 w-3 text-red-400" />
                <span>AP Capstone Program</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Card 4: Recent Insights (Large - 4x1)
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-4">
            <div className="card__label text-purple-300">Insights</div>
          </div>
          <div className="card__content flex-1">
            <h2 className="card__title text-xl font-bold text-white mb-2">AI Recommendations</h2>
            <p className="card__description text-white/70 mb-4 text-sm">Strategic academic guidance</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <insight.icon className="h-4 w-4 text-purple-400" />
                    <h3 className="text-white text-sm font-semibold">{insight.title}</h3>
                  </div>
                  <p className="text-white/60 text-xs mb-2">{insight.summary}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{insight.percentage}%</Badge>
                    <Badge variant={insight.status === 'complete' ? 'default' : insight.status === 'warning' ? 'destructive' : 'secondary'} className="text-xs">{insight.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
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
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg p-3 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-white font-bold">Gold Tier</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-white/90">• AP Biology - Perfect Score: 5</div>
                  <div className="text-white/90">• Science Fair Winner</div>
                  <div className="text-white/90">• Honor Roll (All Semesters)</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-300/20 to-gray-400/20 rounded-lg p-3 border border-gray-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-gray-300" />
                  <h3 className="text-white font-bold">Silver Tier</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-white/90">• AP History Score: 4</div>
                  <div className="text-white/90">• Top 15% Class Ranking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
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
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-sm">High Priority</h3>
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/90">Master Chemistry Performance</span>
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleTaskPlanningOpen("Master Chemistry Performance")}>Plan</Button>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-sm">Medium Priority</h3>
                  <Badge variant="secondary" className="text-xs">Soon</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/90">Optimize Senior Year Planning</span>
                    <Button size="sm" variant="outline" className="h-6 text-xs">Plan</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Academic Metrics */}
      <div className="gradient-dashboard text-white">
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
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {currentGPA.weighted}
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Weighted GPA</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {currentGPA.unweighted}
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Unweighted GPA</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round((1 - currentGPA.classRank / currentGPA.totalStudents) * 100)}th
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Percentile</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round((currentGPA.creditsCompleted / currentGPA.totalCredits) * 100)}%
              </div>
              <div className="text-sm text-purple-700 font-medium mt-1">Progress</div>
            </div>
          </div>

          {/* Progress Bar and Requirements Checklist */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-xl">
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

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-primary/20 shadow-xl">
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
      <div className="w-full p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <MagicBento 
            cards={bentoCards}
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
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
