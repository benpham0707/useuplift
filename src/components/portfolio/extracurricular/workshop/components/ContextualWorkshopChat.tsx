/**
 * Contextual Workshop Chat
 *
 * AI chat assistant with full context of student's portfolio, analysis,
 * teaching issues, version history, and progress.
 *
 * Connects to the chat service backend for intelligent, context-aware
 * coaching conversations.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageCircle, Send, RefreshCw, Loader2, Sparkles, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExtracurricularItem } from '@/components/portfolio/extracurricular/ExtracurricularCard';
import { AnalysisResult } from '../backendTypes';
import { TeachingCoachingOutput } from '../teachingTypes';
import { ReflectionPromptSet } from '@/services/workshop/reflectionPrompts';
import {
  buildWorkshopChatContext,
  WorkshopChatContext,
} from '@/services/workshop/chatContext';
import {
  sendChatMessage,
  createWelcomeMessage,
  getConversationStarters,
  getCachedConversation,
  cacheConversation,
  type ChatMessage,
  type ChatRecommendation,
} from '@/services/workshop/chatService';

// ============================================================================
// PROPS
// ============================================================================

interface ContextualWorkshopChatProps {
  // Core context
  activity: ExtracurricularItem;
  currentDraft: string;
  analysisResult: AnalysisResult | null;
  teachingCoaching: TeachingCoachingOutput | null;

  // State
  currentScore: number;
  initialScore: number;
  hasUnsavedChanges: boolean;
  needsReanalysis: boolean;

  // Reflection state
  reflectionPromptsMap: Map<string, ReflectionPromptSet>;
  reflectionAnswers: Record<string, Record<string, string>>;

  // Actions (optional - for recommendations)
  onToggleCategory?: (categoryKey: string) => void;
  onLoadReflectionPrompts?: (issueId: string) => void;
  onTriggerReanalysis?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ContextualWorkshopChat({
  activity,
  currentDraft,
  analysisResult,
  teachingCoaching,
  currentScore,
  initialScore,
  hasUnsavedChanges,
  needsReanalysis,
  reflectionPromptsMap,
  reflectionAnswers,
  onToggleCategory,
  onLoadReflectionPrompts,
  onTriggerReanalysis,
}: ContextualWorkshopChatProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ChatRecommendation[]>([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [currentStarterIndex, setCurrentStarterIndex] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [stackHeight, setStackHeight] = useState<number>(44);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Load cached conversation or create welcome message
  useEffect(() => {
    const cached = getCachedConversation(activity.id);

    if (cached && cached.length > 0) {
      setChatMessages(cached);
    } else if (analysisResult) {
      // Create welcome message once analysis is ready
      const context = buildContextObject();
      const welcome = createWelcomeMessage(context);
      setChatMessages([welcome]);
    }
  }, [activity.id, analysisResult]);

  // Cache conversation on changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      cacheConversation(activity.id, chatMessages);
    }
  }, [chatMessages, activity.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [chatMessages]);

  // ============================================================================
  // CONTEXT BUILDING
  // ============================================================================

  const buildContextObject = (): WorkshopChatContext => {
    return buildWorkshopChatContext(
      activity,
      currentDraft,
      analysisResult,
      teachingCoaching,
      {
        currentScore,
        initialScore,
        hasUnsavedChanges,
        needsReanalysis,
        reflectionPromptsMap,
        reflectionAnswers,
      }
    );
  };

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const handleSendMessage = async () => {
    if (!userInput.trim() || !analysisResult) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Build context
      const context = buildContextObject();

      // Send to backend
      const response = await sendChatMessage({
        userMessage: userMessage.content,
        context,
        conversationHistory: chatMessages,
        options: {
          tone: 'mentor',
          includeRecommendations: true,
        },
      });

      // Add assistant message
      setChatMessages((prev) => [...prev, response.message]);

      // Update recommendations
      if (response.recommendations && response.recommendations.length > 0) {
        setRecommendations(response.recommendations);
        setCurrentRecommendationIndex(0); // Reset to first recommendation
      }
    } catch (error) {
      console.error('Chat error:', error);

      // Add error message with details
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content:
          error instanceof Error
            ? `Error: ${error.message}. Please check the console for details.`
            : "I'm having trouble connecting right now. Please make sure the backend server is running (npm run dev:full) and try again.",
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationClick = (rec: ChatRecommendation) => {
    switch (rec.type) {
      case 'expand_category':
        if (onToggleCategory && rec.actionData?.categoryKey) {
          onToggleCategory(rec.actionData.categoryKey as string);
        }
        break;

      case 'start_reflection':
        if (onLoadReflectionPrompts && rec.actionData?.issueId) {
          onLoadReflectionPrompts(rec.actionData.issueId as string);
        }
        break;

      case 'regenerate_draft':
        if (onTriggerReanalysis) {
          onTriggerReanalysis();
        }
        break;
    }

    // Clear recommendation after clicking
    setRecommendations((prev) => {
      const filtered = prev.filter((r) => r !== rec);
      // Reset index if we removed current item
      if (filtered.length > 0 && currentRecommendationIndex >= filtered.length) {
        setCurrentRecommendationIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

  const handleNextRecommendation = () => {
    if (currentRecommendationIndex < recommendations.length - 1) {
      setCurrentRecommendationIndex(currentRecommendationIndex + 1);
    }
  };

  const handlePrevRecommendation = () => {
    if (currentRecommendationIndex > 0) {
      setCurrentRecommendationIndex(currentRecommendationIndex - 1);
    }
  };

  const handleNextStarter = () => {
    if (currentStarterIndex < conversationStarters.length - 1) {
      setCurrentStarterIndex(currentStarterIndex + 1);
    }
  };

  const handlePrevStarter = () => {
    if (currentStarterIndex > 0) {
      setCurrentStarterIndex(currentStarterIndex - 1);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setUserInput(question);
    // Focus input so user can send or edit
    inputRef.current?.focus();
  };

  // ============================================================================
  // TEXTAREA AUTO-RESIZE
  // ============================================================================

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const MIN_ROWS = 1;
    const MAX_ROWS = 4;

    el.rows = MIN_ROWS;
    el.style.height = 'auto';

    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight || '20');
    const paddingTop = parseFloat(computed.paddingTop || '0');
    const paddingBottom = parseFloat(computed.paddingBottom || '0');
    const borderTop = parseFloat(computed.borderTopWidth || '0');
    const borderBottom = parseFloat(computed.borderBottomWidth || '0');

    const maxHeight =
      lineHeight * MAX_ROWS + paddingTop + paddingBottom + borderTop + borderBottom;
    const newHeight = Math.min(el.scrollHeight, maxHeight);

    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    setStackHeight(el.getBoundingClientRect().height);
  }, [userInput]);

  useEffect(() => {
    const handler = () => {
      const el = inputRef.current;
      if (!el) return;
      setStackHeight(el.getBoundingClientRect().height);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const gapPx = 8;
  const buttonSize = Math.max(28, Math.floor((stackHeight - gapPx) / 2));

  // ============================================================================
  // CONVERSATION STARTERS
  // ============================================================================

  const conversationStarters =
    chatMessages.length === 1 && analysisResult
      ? getConversationStarters(buildContextObject())
      : [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="w-full flex flex-col border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-card" style={{ height: '600px' }}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          AI Essay Coach
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ask me anything about your {activity.name} narrative
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 mb-1 text-purple-600">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-xs font-medium">Coach</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-lg bg-muted flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          {/* Conversation starters - Single with Navigation */}
          {conversationStarters.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-purple-500" />
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    Suggested question {currentStarterIndex + 1} of {conversationStarters.length}
                  </span>
                </p>
                {conversationStarters.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevStarter}
                      disabled={currentStarterIndex === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextStarter}
                      disabled={currentStarterIndex === conversationStarters.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleQuickQuestion(conversationStarters[currentStarterIndex])}
                className="block w-full text-left text-sm px-3.5 py-2.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all"
              >
                <span className="text-purple-900 dark:text-purple-100">{conversationStarters[currentStarterIndex]}</span>
              </button>
            </div>
          )}

          {/* Recommendations - Single with Navigation */}
          {recommendations.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    Recommended action {currentRecommendationIndex + 1} of {recommendations.length}
                  </span>
                </p>
                {recommendations.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevRecommendation}
                      disabled={currentRecommendationIndex === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextRecommendation}
                      disabled={currentRecommendationIndex === recommendations.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRecommendationClick(recommendations[currentRecommendationIndex])}
                className="block w-full text-left px-3.5 py-2.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all"
              >
                <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  {recommendations[currentRecommendationIndex].title}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  {recommendations[currentRecommendationIndex].description}
                </div>
              </button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              analysisResult
                ? 'Ask me about your score, issues, or how to improve...'
                : 'Analyzing your essay...'
            }
            disabled={!analysisResult || isLoading}
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
              disabled={!userInput.trim() || !analysisResult || isLoading}
              className="bg-purple-600 hover:bg-purple-700 p-0"
              aria-label="Send message"
              style={{ height: buttonSize, width: buttonSize }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <TooltipProvider delayDuration={120}>
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="p-0"
                    onClick={() => {
                      if (onTriggerReanalysis) {
                        onTriggerReanalysis();
                      }
                    }}
                    disabled={!onTriggerReanalysis}
                    aria-label="Regenerate analysis"
                    style={{ height: buttonSize, width: buttonSize }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="text-sm">
                    Regenerate analysis based on our conversation and your latest edits
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
