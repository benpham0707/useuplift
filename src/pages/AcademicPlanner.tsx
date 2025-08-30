import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Calculator
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

  // Enhanced GPA Visualization Component
  const GPAVisualization = () => {
    const maxGPA = 4.0;
    const minGPA = 2.0;
    const range = maxGPA - minGPA;
    
    const getPosition = (gpa: number) => ((gpa - minGPA) / range) * 100;
    
    const positions = {
      current: getPosition(gpaData.current),
      schoolAvg: getPosition(gpaData.schoolAverage),
      majorRec: getPosition(gpaData.majorRecommended),
      target: getPosition(gpaData.target)
    };

    return (
      <div className="space-y-6">
        {/* Enhanced Chart */}
        <div className="relative">
          <div className="h-12 bg-gradient-to-r from-red-200 via-yellow-200 via-orange-200 to-green-200 rounded-lg relative overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {[0, 25, 50, 75, 100].map((pos, i) => (
                <div key={i} className="flex-1 border-r border-white/30 last:border-r-0" />
              ))}
            </div>
            
            {/* Scale labels */}
            <div className="absolute -bottom-6 inset-x-0 flex justify-between text-xs text-muted-foreground">
              <span>2.0</span>
              <span>2.5</span>
              <span>3.0</span>
              <span>3.5</span>
              <span>4.0</span>
            </div>
            
            {/* Markers with enhanced styling */}
            <div 
              className="absolute top-1 w-4 h-4 bg-gray-500 border-2 border-white rounded-full shadow-md transition-all hover:scale-110"
              style={{ left: `${positions.schoolAvg}%`, transform: 'translateX(-50%)' }}
            />
            <div 
              className="absolute top-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full shadow-md transition-all hover:scale-110"
              style={{ left: `${positions.majorRec}%`, transform: 'translateX(-50%)' }}
            />
            <div 
              className="absolute top-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
              style={{ left: `${positions.current}%`, transform: 'translateX(-50%)' }}
            />
            <div 
              className="absolute top-1 w-4 h-4 bg-green-600 border-2 border-white rounded-full shadow-md transition-all hover:scale-110"
              style={{ left: `${positions.target}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>
        
        {/* Legend with enhanced styling */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
            <div>
              <span className="font-medium text-blue-900">Your GPA</span>
              <div className="text-sm text-blue-700">{gpaData.current}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-3 h-3 bg-gray-500 rounded-full border border-white shadow-sm"></div>
            <div>
              <span className="font-medium text-gray-900">School Avg</span>
              <div className="text-sm text-gray-700">{gpaData.schoolAverage}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 border border-orange-200">
            <div className="w-3 h-3 bg-orange-500 rounded-full border border-white shadow-sm"></div>
            <div>
              <span className="font-medium text-orange-900">Major Rec</span>
              <div className="text-sm text-orange-700">{gpaData.majorRecommended}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200">
            <div className="w-3 h-3 bg-green-600 rounded-full border border-white shadow-sm"></div>
            <div>
              <span className="font-medium text-green-900">Target</span>
              <div className="text-sm text-green-700">{gpaData.target}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Full Width Main Content */}
      <div className="w-full p-6">
        <div className="max-w-6xl mx-auto">
          {/* Compact Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">Academic Planning</h1>
            <p className="text-muted-foreground">Track your progress and plan your academic journey strategically</p>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Academic Standing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5" />
                  Current Academic Standing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{currentGPA.weighted}</div>
                    <div className="text-xs text-blue-700">Weighted GPA</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{currentGPA.unweighted}</div>
                    <div className="text-xs text-blue-700">Unweighted GPA</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">#{currentGPA.classRank}</div>
                    <div className="text-xs text-blue-700">of {currentGPA.totalStudents}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Degree Progress</span>
                    <span className="text-sm text-muted-foreground">{currentGPA.creditsCompleted}/{currentGPA.totalCredits}</span>
                  </div>
                  <Progress value={(currentGPA.creditsCompleted / currentGPA.totalCredits) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* GPA Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  GPA Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GPAVisualization />
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