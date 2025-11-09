// RightSidePersonalizationChat.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Send, RefreshCw } from 'lucide-react';

export default function RightSidePersonalizationChat() {
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your Task Planning Assistant. I'll help you customize this action plan to fit your specific needs and circumstances. What aspects would you like to personalize?"
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
          content:
            'Great question! Let me analyze your specific situation and provide personalized recommendations for this task.'
        }
      ]);
      setUserInput('');
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-card">
      {/* Chat Header */}
      <div className="p-4 border-b flex-shrink-0">
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
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask me anything about your essay..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full min-h-[80px] max-h-[120px] p-3 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
            <TooltipProvider delayDuration={120}>
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-10 p-0"
                    onClick={() =>
                      console.log('Regenerating task based on chat discussion...')
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="text-sm">
                    Regenerate analysis based on our conversation. This will consolidate everything we've discussed into updated feedback.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
