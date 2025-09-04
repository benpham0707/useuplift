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
  TrendingUp
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
        <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Target className="h-6 w-6 text-primary" />
            {task.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[calc(100%-80px)]">
          {/* Left Side - Task Information */}
          <div className="flex-1 border-r overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4 max-w-none">
                {/* Task Overview */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="h-4 w-4" />
                      Task Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {task.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
                        <TrendingUp className="h-3 w-3" />
                        Impact: {task.impact}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3" />
                        {task.timeframe}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Difficulty: {task.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Why It's Important */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-4 w-4" />
                      Why This Matters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {task.importance}
                    </p>
                  </CardContent>
                </Card>

                {/* Key Takeaways */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-4 w-4" />
                      Key Takeaways
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {task.takeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground leading-relaxed">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Detailed Steps */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      Step-by-Step Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {task.detailedSteps.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {step}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
            <div className="p-4 border-t">
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskPlanningInterface;