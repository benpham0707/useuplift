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
                      <div className="text-3xl font-bold text-blue-600">{currentGPA.weighted}</div>
                      <div className="text-sm text-blue-700">Weighted GPA</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">{currentGPA.unweighted}</div>
                      <div className="text-sm text-blue-700">Unweighted GPA</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">{Math.round(((currentGPA.totalStudents - currentGPA.classRank + 1) / currentGPA.totalStudents) * 100)}th</div>
                      <div className="text-sm text-blue-700">Percentile</div>
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
                    <h3 className="text-sm font-semibold text-foreground mb-3">Academic Course Requirements Checklist</h3>
                    <div className="space-y-1">
                      {/* A-G Subject Requirements - Collapsible */}
                      <div className="flex items-center gap-2 text-xs">
                        <button 
                          onClick={() => setExpandedAG(!expandedAG)}
                          className="flex items-center gap-2 text-xs w-full text-left hover:bg-slate-50 p-1 rounded-md transition-colors"
                        >
                          <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                          <span className="font-medium">A-G Subject Requirements (UC/CSU Foundation)</span>
                          <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${expandedAG ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                        
                      {expandedAG && (
                        <div className="ml-5 space-y-1 p-2 bg-slate-50 rounded-md text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400">
                              <X className="h-2 w-2 text-white" />
                            </div>
                            <span>Missing: 4th year of math and advanced science courses</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Other requirements at same level */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Minimum GPA Requirement (3.0+)</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">SAT/ACT Test Scores</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">High School Diploma/Graduation</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">English Language Proficiency</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Application Submission</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Personal Insight Questions</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Letters of Recommendation</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center justify-center h-3 w-3 rounded-full border-2 border-green-600 bg-green-600">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                        <span className="font-medium">Extracurricular Activities</span>
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

          {/* Enhanced Expandable Insights */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Academic Insights
              </CardTitle>
              <CardDescription>Detailed analysis of your academic progress and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight) => {
                const isExpanded = expandedInsights.includes(insight.id);
                const IconComponent = insight.icon;
                
                return (
                  <Collapsible key={insight.id} open={isExpanded} onOpenChange={() => toggleInsight(insight.id)}>
                    <CollapsibleTrigger asChild>
                      <div className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        insight.color === 'green' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                        insight.color === 'orange' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                        insight.color === 'blue' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                        'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className={`h-5 w-5 ${
                              insight.color === 'green' ? 'text-green-600' :
                              insight.color === 'orange' ? 'text-yellow-600' :
                              insight.color === 'blue' ? 'text-blue-600' :
                              'text-gray-600'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{insight.title}</span>
                                <Badge variant="secondary" className={`${
                                  insight.color === 'green' ? 'bg-green-100 text-green-800' :
                                  insight.color === 'orange' ? 'bg-yellow-100 text-yellow-800' :
                                  insight.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {insight.percentage}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.summary}</p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="font-medium mb-2">Detailed Analysis</h4>
                          <p className="text-sm text-muted-foreground mb-4">{insight.details}</p>
                          
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {insight.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>

          {/* Compact Open Inquiries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5" />
                Open Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Transfer planning",
                  "Double major", 
                  "Switch major",
                  "Graduate prep",
                  "Summer courses",
                  "Study abroad"
                ].map((inquiry, index) => (
                  <Button key={index} variant="outline" className="h-16 text-left justify-start p-3">
                    <div>
                      <div className="font-medium text-sm">{inquiry}</div>
                      <div className="text-xs text-muted-foreground">Click to explore</div>
                    </div>
                  </Button>
                ))}
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
