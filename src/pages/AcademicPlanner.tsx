import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, BookOpen, Target, MessageCircle, Send, GraduationCap, Calculator, BarChart3, AlertCircle } from 'lucide-react';

const AcademicPlanner = () => {
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m here to help with your academic planning. Ask me about course selection, GPA goals, or any academic concerns.' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Hard coded academic data representing current student stats
  const academicStats = {
    weightedGPA: 4.2,
    unweightedGPA: 3.8,
    classRank: 15,
    classSize: 300,
    creditsCompleted: 85,
    creditsRequired: 120,
    currentSemester: 'Spring 2024'
  };

  // Hard coded GPA comparison data for visualization
  const gpaComparison = {
    current: 3.8,
    schoolAverage: 3.2,
    majorRecommended: 3.6,
    targetSchoolAverage: 3.9
  };

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      setChatMessages([...chatMessages, 
        { role: 'user', content: currentMessage },
        { role: 'assistant', content: 'Thanks for your question! I\'ll help you create a strategic plan for that academic goal.' }
      ]);
      setCurrentMessage('');
    }
  };

  const GPAVisualization = () => (
    <div className="space-y-4">
      <div className="relative h-20 bg-gradient-to-r from-red-100 via-yellow-100 via-green-100 to-green-200 rounded-lg p-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>2.0</span>
          <span>3.0</span>
          <span>4.0</span>
        </div>
        <div className="relative h-8">
          {/* GPA markers */}
          <div 
            className="absolute w-3 h-3 bg-blue-600 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2"
            style={{ left: `${((gpaComparison.current - 2) / 2) * 100}%` }}
          />
          <div 
            className="absolute w-2 h-2 bg-gray-400 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2"
            style={{ left: `${((gpaComparison.schoolAverage - 2) / 2) * 100}%` }}
          />
          <div 
            className="absolute w-2 h-2 bg-orange-500 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2"
            style={{ left: `${((gpaComparison.majorRecommended - 2) / 2) * 100}%` }}
          />
          <div 
            className="absolute w-2 h-2 bg-green-600 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2"
            style={{ left: `${((gpaComparison.targetSchoolAverage - 2) / 2) * 100}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <span>Your GPA: {gpaComparison.current}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span>School Avg: {gpaComparison.schoolAverage}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full" />
          <span>Major Rec: {gpaComparison.majorRecommended}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full" />
          <span>Target: {gpaComparison.targetSchoolAverage}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Academic Planning</h1>
            <p className="text-lg text-muted-foreground">
              Track your progress and plan your academic journey strategically
            </p>
          </div>

          {/* Current Stats Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Current Academic Standing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{academicStats.weightedGPA}</div>
                  <div className="text-sm text-muted-foreground">Weighted GPA</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{academicStats.unweightedGPA}</div>
                  <div className="text-sm text-muted-foreground">Unweighted GPA</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">#{academicStats.classRank}</div>
                  <div className="text-sm text-muted-foreground">Class Rank of {academicStats.classSize}</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Degree Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {academicStats.creditsCompleted}/{academicStats.creditsRequired} Credits
                  </span>
                </div>
                <Progress value={(academicStats.creditsCompleted / academicStats.creditsRequired) * 100} />
              </div>
            </CardContent>
          </Card>

          {/* GPA Comparison */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                GPA Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GPAVisualization />
            </CardContent>
          </Card>

          {/* Expandable Insights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Academic Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {/* Hard coded insight data representing academic analysis */}
                {[
                  {
                    title: "Course Requirements Analysis",
                    icon: <BookOpen className="h-4 w-4" />,
                    content: "You've completed 85% of your major requirements. Missing: Advanced Statistics, Research Methods. Consider taking these next semester to stay on track for graduation."
                  },
                  {
                    title: "Major-Specific Recommendations",
                    icon: <TrendingUp className="h-4 w-4" />,
                    content: "For Computer Science majors, consider adding Data Structures II and Machine Learning to strengthen your profile. Your current coursework aligns well with industry expectations."
                  },
                  {
                    title: "GPA Improvement Strategy",
                    icon: <Calculator className="h-4 w-4" />,
                    content: "To reach your target GPA of 3.9, you need to maintain a 4.0 in your remaining 35 credits. Focus on courses where you excel and consider tutoring for challenging subjects."
                  },
                  {
                    title: "Graduate School Preparation",
                    icon: <GraduationCap className="h-4 w-4" />,
                    content: "Your current GPA is competitive for most graduate programs. Consider adding research experience and building relationships with faculty for strong recommendation letters."
                  }
                ].map((insight, index) => (
                  <AccordionItem key={index} value={`insight-${index}`} className="border border-border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        {insight.icon}
                        <span className="font-medium">{insight.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <p className="text-muted-foreground">{insight.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Special Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Open Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hard coded scenario options representing common academic decisions */}
                {[
                  { title: "Transfer Planning", description: "Evaluate transfer options and credit transfers" },
                  { title: "Double Major Strategy", description: "Plan coursework for multiple majors" },
                  { title: "Major Switch Analysis", description: "Assess requirements for changing majors" },
                  { title: "Study Abroad Planning", description: "Course planning for international study" },
                  { title: "Summer Course Strategy", description: "Accelerate graduation with summer courses" },
                  { title: "Graduate School Timeline", description: "Prepare for graduate school applications" }
                ].map((scenario, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{scenario.title}</h3>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chatbot Sidebar */}
        <div className="w-96 border-l border-border bg-muted/20 p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Academic Advisor</h2>
          </div>
          
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {chatMessages.map((message, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-4' 
                    : 'bg-background border mr-4'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="Ask about course planning, GPA goals, or academic strategy..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="min-h-20"
            />
            <Button onClick={handleSendMessage} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>

          <div className="mt-6 p-4 bg-background rounded-lg border">
            <h3 className="font-medium mb-2">Quick Actions</h3>
            <div className="space-y-2">
              {["Plan next semester", "Check graduation requirements", "GPA calculation help"].map((action, index) => (
                <Button 
                  key={index} 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => setCurrentMessage(action)}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanner;