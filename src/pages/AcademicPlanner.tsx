import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Check
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

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setChatMessages([...chatMessages, 
        { role: 'user', content: userInput },
        { role: 'assistant', content: "I'll help you with that! Let me analyze your academic situation and provide recommendations." }
      ]);
      setUserInput('');
    }
  };

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
                stroke="#d97706" 
                strokeWidth={4}
                dot={{ fill: '#d97706', strokeWidth: 3, r: 6, stroke: '#ffffff' }}
                activeDot={{ r: 8, stroke: '#d97706', strokeWidth: 3, fill: '#ffffff' }}
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
            <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Major Average:</span>
              <span className="ml-1 font-bold text-amber-600">{gpaData.majorRecommended}</span>
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
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-800">{currentGPA.weighted}</div>
                      <div className="text-sm text-blue-900">Weighted GPA</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-800">{currentGPA.unweighted}</div>
                      <div className="text-sm text-blue-900">Unweighted GPA</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-800">{Math.round(((currentGPA.totalStudents - currentGPA.classRank + 1) / currentGPA.totalStudents) * 100)}th</div>
                      <div className="text-sm text-blue-900">Percentile</div>
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

          {/* Academic Insights - News/Announcements Style */}
          <Card className="mb-6">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Academic Insights & Updates</CardTitle>
                  <CardDescription>Latest analysis and recommendations for your academic journey</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {insights.map((insight, index) => {
                  const isExpanded = expandedInsights.includes(insight.id);
                  const IconComponent = insight.icon;
                  
                  return (
                    <div key={insight.id} className="border-b last:border-b-0">
                      <Collapsible open={isExpanded} onOpenChange={() => toggleInsight(insight.id)}>
                        <CollapsibleTrigger asChild>
                          <div className="w-full p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                            <div className="flex items-start gap-4">
                              {/* News-style timestamp/badge */}
                              <div className="flex flex-col items-center gap-1 mt-1">
                                <div className={`w-3 h-3 rounded-full ${
                                  insight.color === 'green' ? 'bg-green-500' :
                                  insight.color === 'orange' ? 'bg-orange-500' :
                                  insight.color === 'blue' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`}></div>
                                <div className="text-xs text-muted-foreground">NEW</div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <IconComponent className={`h-4 w-4 ${
                                    insight.color === 'green' ? 'text-green-600' :
                                    insight.color === 'orange' ? 'text-orange-600' :
                                    insight.color === 'blue' ? 'text-blue-600' :
                                    'text-gray-600'
                                  }`} />
                                  <h3 className="font-semibold text-base">{insight.title}</h3>
                                  <Badge variant="outline" className={`ml-auto ${
                                    insight.color === 'green' ? 'border-green-300 text-green-700' :
                                    insight.color === 'orange' ? 'border-orange-300 text-orange-700' :
                                    insight.color === 'blue' ? 'border-blue-300 text-blue-700' :
                                    'border-gray-300 text-gray-700'
                                  }`}>
                                    {insight.percentage}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{insight.summary}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-blue-600 hover:text-blue-800">Read more</span>
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 ml-7">
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <h4 className="font-medium mb-2 text-slate-900">Detailed Analysis</h4>
                              <p className="text-sm text-slate-700 mb-4 leading-relaxed">{insight.details}</p>
                              
                              <h4 className="font-medium mb-2 text-slate-900">Action Items</h4>
                              <ul className="space-y-2">
                                {insight.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                                      insight.color === 'green' ? 'bg-green-500' :
                                      insight.color === 'orange' ? 'bg-orange-500' :
                                      insight.color === 'blue' ? 'bg-blue-500' :
                                      'bg-gray-500'
                                    }`}></div>
                                    <span className="text-slate-700">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Trophy Case Section */}
          <Card className="mb-6 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="relative">
                    <Award className="h-8 w-8 text-amber-600 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center animate-ping">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
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
          <Card className="mb-6 bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-100 to-rose-100 border-b-2 border-red-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="relative">
                    <Target className="h-8 w-8 text-red-600" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-2 w-2 text-white" />
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
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-300 rounded-xl hover:from-red-200 hover:to-rose-200 transition-all duration-300 shadow-lg hover:shadow-xl border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-lg border-4 border-white border-dashed">
                        <AlertCircle className="h-7 w-7 text-white animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-300 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-xs font-bold text-red-800">!</span>
                        </div>
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
                    <div className="bg-white rounded-xl border-2 border-red-200 shadow-inner p-4 border-dashed">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 border-dashed">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-md flex-shrink-0 mt-1 border-2 border-white border-dashed">
                              <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-red-900">Complete AP Physics C</span>
                                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Plan This
                                </Button>
                              </div>
                              <p className="text-sm text-red-800 font-medium mb-1">Missing for engineering program prerequisites</p>
                              <p className="text-xs text-red-600">Deadline: Register by February 1st</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 border-dashed">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-md flex-shrink-0 mt-1 border-2 border-white border-dashed">
                              <Target className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-red-900">Raise GPA to 3.9+</span>
                                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xs px-3 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
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
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-xl hover:from-orange-200 hover:to-yellow-200 transition-all duration-300 shadow-lg hover:shadow-xl border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 shadow-lg border-4 border-white border-dashed">
                        <Clock className="h-7 w-7 text-white" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-300 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-xs font-bold text-orange-800">~</span>
                        </div>
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
                    <div className="bg-white rounded-xl border-2 border-orange-200 shadow-inner p-4 border-dashed">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 border-dashed">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 shadow-md flex-shrink-0 mt-1 border-2 border-white border-dashed">
                              <BookOpen className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-orange-900 text-sm">Complete AP Statistics</span>
                                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
                                  Plan This
                                </Button>
                              </div>
                              <p className="text-xs text-orange-700 mb-1">Supports data science track</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 border-dashed">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 shadow-md flex-shrink-0 mt-1 border-2 border-white border-dashed">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-orange-900 text-sm">Join Research Program</span>
                                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-xs px-2 py-1 shadow-md hover:shadow-lg transition-all hover:scale-105">
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

                {/* Low Priority Tasks */}
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center justify-between w-full p-5 bg-gradient-to-r from-slate-100 to-gray-100 border-2 border-slate-300 rounded-xl hover:from-slate-200 hover:to-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-lg border-4 border-white border-dashed">
                        <Calendar className="h-7 w-7 text-white" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-xs font-bold text-slate-800">+</span>
                        </div>
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
                    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-inner p-4 border-dashed">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 border-dashed">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 shadow-md flex-shrink-0 mt-1 border-2 border-white border-dashed">
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

      {/* Floating Chat Toggle Button */}
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Pop-up Chatbot */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 z-50 animate-in slide-in-from-bottom-4">
          <Card className="h-full shadow-2xl border-2">
            <CardHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5" />
                    Academic Advisor
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Get personalized guidance on your academic journey
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                  className="h-8 w-8 p-0"
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
                <p className="text-sm font-medium mb-3">Quick Actions</p>
                <div className="space-y-2">
                  {quickActions.slice(0, 3).map((action, index) => (
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
    </div>
  );
};

export default AcademicPlanner;
