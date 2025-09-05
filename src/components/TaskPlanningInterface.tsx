import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  MessageCircle, 
  Send, 
  Brain,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface TaskPlanningInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    title: string;
    impact: string;
    difficulty: string;
    timeframe: string;
    category: string;
    description: string;
    importance: string;
    takeaways: string[];
    detailedSteps: string[];
  } | null;
}

const TaskPlanningInterface: React.FC<TaskPlanningInterfaceProps> = ({ isOpen, onClose, task }) => {
  // Hard coded data values for chat messages between user and task planning chatbot
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Task Planning Assistant. I'll help you customize this action plan to fit your specific needs and circumstances. What aspects would you like to personalize?"
    }
  ]);
  const [userInput, setUserInput] = useState('');

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setChatMessages(prev => [
        ...prev,
        { role: 'user', content: userInput },
        { 
          role: 'assistant', 
          content: "Great question! Let me analyze your specific situation and provide personalized recommendations for this task." 
        }
      ]);
      setUserInput('');
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 rounded-t-lg">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Next Actions Planning
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 min-h-0">
          {/* Left Side - Task Information */}
          <div className="flex-1 border-r overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 pb-32 space-y-6 max-w-none">
                {/* Task Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold tracking-tight">{task.title}</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      {task.impact} Impact
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {task.timeframe}
                    </Badge>
                    <Badge variant="outline">
                      {task.difficulty} Difficulty
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Task Phases */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Implementation Phases
                  </h3>
                  
                  {/* Hard coded data values for task implementation phases specific to academic tutoring sessions */}
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 space-y-3 ${task.impact === 'High' ? 'shadow-[0_0_15px_5px_rgba(59,130,246,0.2)] border-blue-500/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                        <h4 className="font-medium">Planning & Setup</h4>
                        <Badge variant="outline" className="text-xs">Week 1</Badge>
                      </div>
                      <div className="pl-8 space-y-2">
                        <p className="text-sm text-muted-foreground">Research and identify qualified tutors, establish schedule, set learning objectives</p>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>• Find certified chemistry tutors with proven track record</li>
                          <li>• Schedule initial assessment session</li>
                          <li>• Define specific areas of focus and improvement goals</li>
                        </ul>
                        <div className="mt-3 space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Detailed Action Steps:</h5>
                          {task.detailedSteps.slice(0, Math.ceil(task.detailedSteps.length / 3)).map((step, index) => (
                            <div key={index} className="flex gap-3 p-2 rounded bg-muted/30">
                              <div className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Est. time: 2-3 hours</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 space-y-3 ${task.impact === 'High' ? 'shadow-[0_0_15px_5px_rgba(59,130,246,0.2)] border-blue-500/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                        <h4 className="font-medium">Regular Sessions</h4>
                        <Badge variant="outline" className="text-xs">Weeks 2-12</Badge>
                      </div>
                      <div className="pl-8 space-y-2">
                        <p className="text-sm text-muted-foreground">Consistent weekly sessions focusing on problem-solving and concept reinforcement</p>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>• 90-minute sessions covering current coursework</li>
                          <li>• Practice problems and lab technique improvement</li>
                          <li>• Regular progress assessments and adjustments</li>
                        </ul>
                        <div className="mt-3 space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Detailed Action Steps:</h5>
                          {task.detailedSteps.slice(Math.ceil(task.detailedSteps.length / 3), Math.ceil(task.detailedSteps.length * 2 / 3)).map((step, index) => (
                            <div key={index} className="flex gap-3 p-2 rounded bg-muted/30">
                              <div className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                                {Math.ceil(task.detailedSteps.length / 3) + index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Est. time: 1-2 hours</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 space-y-3 ${task.impact === 'High' ? 'shadow-[0_0_15px_5px_rgba(59,130,246,0.2)] border-blue-500/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                        <h4 className="font-medium">Assessment & Optimization</h4>
                        <Badge variant="outline" className="text-xs">Ongoing</Badge>
                      </div>
                      <div className="pl-8 space-y-2">
                        <p className="text-sm text-muted-foreground">Monitor progress and adapt tutoring approach based on performance data</p>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>• Monthly progress reviews with grades and comprehension metrics</li>
                          <li>• Adjust tutoring focus areas based on performance</li>
                          <li>• Prepare for major exams and lab practicals</li>
                        </ul>
                        <div className="mt-3 space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Detailed Action Steps:</h5>
                          {task.detailedSteps.slice(Math.ceil(task.detailedSteps.length * 2 / 3)).map((step, index) => (
                            <div key={index} className="flex gap-3 p-2 rounded bg-muted/30">
                              <div className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                                {Math.ceil(task.detailedSteps.length * 2 / 3) + index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Est. time: 30-60 minutes</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Strategic Value */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Strategic Value & Impact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-none shadow-none bg-muted/30">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm mb-2">Academic Benefits</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {task.importance}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-none bg-muted/30">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm mb-2">Long-term Advantages</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Strong chemistry foundation supports advanced STEM coursework, pre-med requirements, and demonstrates commitment to academic excellence for college applications.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Success Metrics */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Success Metrics & Outcomes
                  </h3>
                  
                  {/* Strategic Visual Hierarchy for Outcomes */}
                  <div className="space-y-4">
                    {task.takeaways.map((takeaway, index) => {
                      // Hard coded data values - Strategic hierarchy: most impressive first, supporting metrics after
                      const getOutcomeHierarchy = (index: number) => {
                        if (index === 0) {
                          // Hero Outcome - Most impressive and impactful
                          return {
                            size: "large",
                            bg: "bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30",
                            icon: <Award className="h-8 w-8 text-primary" />,
                            title: "Achievement Milestone",
                            titleClass: "text-xl font-bold text-primary mb-3",
                            contentClass: "text-base leading-relaxed",
                            padding: "p-6",
                            shadow: "shadow-lg hover:shadow-xl"
                          };
                        } else if (index === 1) {
                          // Primary Outcome - Key supporting result
                          return {
                            size: "medium", 
                            bg: "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60",
                            icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
                            title: "Progress Indicator",
                            titleClass: "text-lg font-semibold text-emerald-800 mb-2",
                            contentClass: "text-sm leading-relaxed text-emerald-700",
                            padding: "p-5",
                            shadow: "shadow-md hover:shadow-lg"
                          };
                        } else {
                          // Supporting Outcomes - Trust builders and additional benefits
                          return {
                            size: "small",
                            bg: "bg-muted/40 border border-muted-foreground/20",
                            icon: <CheckCircle2 className="h-5 w-5 text-muted-foreground" />,
                            title: "Success Milestone",
                            titleClass: "text-sm font-medium text-muted-foreground mb-1",
                            contentClass: "text-xs leading-relaxed text-muted-foreground/80",
                            padding: "p-4",
                            shadow: "hover:shadow-sm"
                          };
                        }
                      };
                      
                      const hierarchy = getOutcomeHierarchy(index);
                      
                      return (
                        <div key={index} className={`flex items-start gap-4 rounded-xl transition-all duration-300 ${hierarchy.bg} ${hierarchy.padding} ${hierarchy.shadow}`}>
                          <div className="flex-shrink-0 mt-1">
                            {hierarchy.icon}
                          </div>
                          <div className="flex-1">
                            <div className={hierarchy.titleClass}>
                              {hierarchy.title}
                            </div>
                            <p className={hierarchy.contentClass}>{takeaway}</p>
                            {index === 0 && (
                              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                                Primary Goal
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </ScrollArea>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="w-96 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Personalize Your Plan
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Chat with our AI to customize this task to your specific needs
              </p>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t space-y-3">
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about customizing this task..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 text-sm"
                onClick={() => {
                  // Regenerate task logic would go here
                  console.log('Regenerating task based on chat discussion...');
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate Task Plan
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskPlanningInterface;