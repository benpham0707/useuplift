import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  RefreshCw,
  Info,
  CalendarPlus
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
    phases: Array<{
      title: string;
      description: string;
      steps: string[];
    }>;
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
  const [showTutorial, setShowTutorial] = useState(false);

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
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Calendar className="h-6 w-6 text-primary" />
              Next Actions Planning
            </DialogTitle>
            <div className="flex items-center gap-4">
              <TooltipProvider delayDuration={120}>
                <Tooltip disableHoverableContent>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 p-0 border border-border/50 hover:border-border"
                      onClick={() => setShowTutorial(true)}
                    >
                      <Info className="h-5 w-5 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm">
                    <p className="text-sm">Click to open the task planning tutorial</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                <CalendarPlus className="h-4 w-4" />
                Add to Calendar
              </Button>
            </div>
          </div>
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
                  
                  <div className="space-y-4">
                    {task.phases.map((phase, phaseIndex) => (
                      <div key={phaseIndex} className={`border rounded-lg p-4 space-y-3 ${task.impact === 'High' ? 'shadow-[0_0_15px_5px_rgba(59,130,246,0.2)] border-blue-500/50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">{phaseIndex + 1}</div>
                          <h4 className="font-medium">{phase.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {phaseIndex === 0 ? 'Weeks 1-2' : phaseIndex === 1 ? 'Weeks 2-4' : 'Weeks 4-6'}
                          </Badge>
                        </div>
                        <div className="pl-8 space-y-2">
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-medium text-muted-foreground">Action Steps:</h5>
                            {phase.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex gap-3 p-2 rounded bg-muted/30">
                                <div className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                                  {stepIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Est. time: {phaseIndex === 0 ? '2-3 hours' : phaseIndex === 1 ? '1-2 hours' : '30-60 minutes'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    Success Metrics & Progress Tracking
                  </h3>
                  
                  {/* Hard coded data values for progress tracking metrics for academic tutoring success measurement */}
                  <div className="grid gap-4 grid-cols-3">
                    <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Grade Improvement
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Track test scores and assignment grades weekly to measure academic progress</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Session Completion
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Monitor attendance rate and on-time session completions</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Concept Mastery
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Assess understanding through practice problems and concept checks</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Goal Achievement
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Track progress toward specific learning objectives set at the start</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Confidence Level
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Self-assess confidence in chemistry topics on a 1-10 scale monthly</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <RefreshCw className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Study Habits
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Monitor independent study time and homework completion rates</p>
                        </div>
                      </div>
                    </div>
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
                <TooltipProvider delayDuration={120}>
                  <Tooltip disableHoverableContent>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => {
                          // Regenerate task logic would go here
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-sm">
                      <p className="text-sm">Regenerate task plan based on our conversation. This will consolidate everything we've discussed into an updated action plan.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Tutorial Dialog */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="h-5 w-5 text-primary" />
              Task Planning Interface Tutorial
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              
              {/* Overview */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary">Welcome to Task Planning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This interface helps you transform AI-generated task recommendations into personalized, actionable plans. 
                  Here's how to get the most out of each section:
                </p>
              </div>

              <Separator />

              {/* Left Panel Explanation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Task Overview & Planning (Left Panel)
                </h3>
                
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">📋 Task Information</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Review the task title, description, and key attributes (impact level, difficulty, timeframe). 
                      These give you context for planning your approach.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">🎯 Implementation Phases</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      See your task broken down into manageable phases with specific action steps. 
                      Each phase includes estimated time commitments and detailed sub-tasks.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">💡 Strategic Value</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Understand why this task matters for your goals and what long-term benefits you'll gain.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">📊 Success Metrics</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Track your progress with specific, measurable indicators. Use these to stay motivated and assess your success.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Chat Interface Explanation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  AI Personalization Chat (Right Panel)
                </h3>
                
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">💬 Smart Customization</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Chat with the AI to customize the task plan for your specific situation. Ask about:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Adjusting timelines based on your schedule</li>
                      <li>• Modifying difficulty based on your experience level</li>
                      <li>• Adding specific resources or tools you have access to</li>
                      <li>• Accounting for constraints or challenges you face</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">🔄 Regenerate Plan</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use the regenerate button (↻) to update the entire task plan based on your conversation. 
                      The AI will incorporate all your feedback and preferences into a new, personalized plan.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Final Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-primary" />
                  Finalizing Your Task
                </h3>
                
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">✅ Ready to Commit?</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Once you're satisfied with your personalized plan, click "Add to Calendar" to:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Save the task to your personal dashboard</li>
                      <li>• Add milestones and deadlines to your calendar</li>
                      <li>• Begin tracking your progress</li>
                      <li>• Access the plan anytime from your task list</li>
                    </ul>
                  </div>
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-primary font-medium">
                      💡 Pro Tip: Don't rush! Take time to chat with the AI and customize the plan. 
                      The more specific you are about your situation, the better your personalized action plan will be.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </ScrollArea>
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowTutorial(false)}>
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default TaskPlanningInterface;