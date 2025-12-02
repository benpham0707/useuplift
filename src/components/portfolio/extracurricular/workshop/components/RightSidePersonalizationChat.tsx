// RightSidePersonalizationChat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [stackHeight, setStackHeight] = useState<number>(44);

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

  // Auto-resize the textarea from 1 → up to 4 lines, then scroll
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const MIN_ROWS = 1;
    const MAX_ROWS = 4;
    // Reset to min rows to correctly measure scrollHeight
    el.rows = MIN_ROWS;
    el.style.height = 'auto';
    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight || '20');
    const paddingTop = parseFloat(computed.paddingTop || '0');
    const paddingBottom = parseFloat(computed.paddingBottom || '0');
    const borderTop = parseFloat(computed.borderTopWidth || '0');
    const borderBottom = parseFloat(computed.borderBottomWidth || '0');
    const maxHeight = lineHeight * MAX_ROWS + paddingTop + paddingBottom + borderTop + borderBottom;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    setStackHeight(el.getBoundingClientRect().height);
  }, [userInput]);

  // Recalculate on window resize
  useEffect(() => {
    const handler = () => {
      const el = inputRef.current;
      if (!el) return;
      setStackHeight(el.getBoundingClientRect().height);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const gapPx = 8; // gap-2
  const buttonSize = Math.max(28, Math.floor((stackHeight - gapPx) / 2));

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
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask me anything about your essay..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 resize-none text-sm leading-5 overflow-y-hidden"
            rows={1}
          />
          <div className="flex flex-col gap-2" style={{ height: stackHeight }}>
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 p-0"
              aria-label="Send message"
              style={{ height: buttonSize, width: buttonSize }}
            >
              <Send className="h-4 w-4" />
            </Button>
            <TooltipProvider delayDuration={120}>
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="p-0"
                    onClick={() => {}}
                    aria-label="Regenerate based on chat"
                    style={{ height: buttonSize, width: buttonSize }}
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
        <p className="text-[11px] text-muted-foreground mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
