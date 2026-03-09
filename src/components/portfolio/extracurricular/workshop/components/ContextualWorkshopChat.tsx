/**
 * Contextual Workshop Chat
 *
 * Professional AI coaching chat interface with full context of student's
 * portfolio, analysis, teaching issues, version history, and progress.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Send, Loader2, Sparkles, RefreshCw, Zap, ArrowUp, GraduationCap } from 'lucide-react';
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

// PIQ Chat imports
import { buildPIQChatContext, PIQChatContext } from '@/services/piqWorkshop/piqChatContext';
import {
  sendPIQChatMessage,
  createPIQWelcomeMessage,
  getPIQConversationStarters,
  getCachedConversation as getPIQCachedConversation,
  cacheConversation as cachePIQConversation,
} from '@/services/piqWorkshop/piqChatService';

// Credits System
import { canSendChatMessage, deductForChatMessage, CREDIT_COSTS } from '@/services/credits';
import { InsufficientCreditsModal } from '@/components/credits';

// ============================================================================
// PROPS
// ============================================================================

interface ContextualWorkshopChatProps {
  // Mode switching
  mode?: 'extracurricular' | 'piq'; // Default: 'extracurricular'

  // PIQ-specific props (required when mode='piq')
  piqPromptId?: string;
  piqPromptText?: string;
  piqPromptTitle?: string;

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

  // Reflection state (extracurricular only)
  reflectionPromptsMap: Map<string, ReflectionPromptSet>;
  reflectionAnswers: Record<string, Record<string, string>>;

  // Actions (optional - for recommendations)
  onToggleCategory?: (categoryKey: string) => void;
  onLoadReflectionPrompts?: (issueId: string) => void;
  onTriggerReanalysis?: () => void;

  // External message management (optional - for database persistence)
  externalMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;

  // Version history (for chat context)
  versionHistory?: Array<{ timestamp: number; nqi: number; note?: string }>;

  // Credits system (optional - needed for credit checking)
  userId?: string | null;
  getToken?: (options: { template: string }) => Promise<string | null>;
}

// ============================================================================
// HELPER: Simple markdown-like rendering for assistant messages
// ============================================================================

function renderMessageContent(content: string) {
  // Split into paragraphs
  const paragraphs = content.split('\n\n');

  return paragraphs.map((para, pIdx) => {
    // Handle single line breaks within paragraph
    const lines = para.split('\n');

    return (
      <p key={pIdx} className={pIdx > 0 ? 'mt-3' : ''}>
        {lines.map((line, lIdx) => {
          // Bold: **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const rendered = parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIdx}>{part}</span>;
          });

          return (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {rendered}
            </React.Fragment>
          );
        })}
      </p>
    );
  });
}

// ============================================================================
// TYPING DOTS ANIMATION
// ============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
        <GraduationCap className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ContextualWorkshopChat({
  mode = 'extracurricular', // Default to extracurricular
  piqPromptId,
  piqPromptText,
  piqPromptTitle,
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
  externalMessages,
  onMessagesChange,
  versionHistory,
  userId,
  getToken,
}: ContextualWorkshopChatProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const chatMessages = externalMessages ?? internalMessages;

  const updateMessages = (newMessages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (onMessagesChange) {
      onMessagesChange(newMessages);
    } else {
      setInternalMessages(newMessages);
    }
  };

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ChatRecommendation[]>([]);

  // Credits modal state
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (externalMessages !== undefined) return;

    const cacheKey = mode === 'piq' && piqPromptId ? piqPromptId : activity?.id;
    if (!cacheKey) return;

    const cached = mode === 'piq' ? getPIQCachedConversation(cacheKey) : getCachedConversation(cacheKey);

    if (cached && cached.length > 0) {
      updateMessages(cached);
    } else if (analysisResult) {
      if (mode === 'piq' && piqPromptId && piqPromptText && piqPromptTitle) {
        const context = buildPIQContextObject();
        const welcome = createPIQWelcomeMessage(context);
        updateMessages([welcome]);
      } else if (activity) {
        const context = buildContextObject();
        const welcome = createWelcomeMessage(context);
        updateMessages([welcome]);
      }
    }
  }, [activity?.id, analysisResult, mode, piqPromptId, externalMessages]);

  useEffect(() => {
    if (externalMessages !== undefined && externalMessages.length === 0 && analysisResult) {
      if (mode === 'piq' && piqPromptId && piqPromptText && piqPromptTitle) {
        const context = buildPIQContextObject();
        const welcome = createPIQWelcomeMessage(context);
        updateMessages([welcome]);
      } else if (activity) {
        const context = buildContextObject();
        const welcome = createWelcomeMessage(context);
        updateMessages([welcome]);
      }
    }
  }, [externalMessages, analysisResult, mode, piqPromptId]);

  useEffect(() => {
    if (externalMessages !== undefined) return;

    if (chatMessages.length > 0) {
      const cacheKey = mode === 'piq' && piqPromptId ? piqPromptId : activity?.id;
      if (!cacheKey) return;

      if (mode === 'piq') {
        cachePIQConversation(cacheKey, chatMessages);
      } else {
        cacheConversation(cacheKey, chatMessages);
      }
    }
  }, [chatMessages, activity?.id, mode, piqPromptId, externalMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [chatMessages, isLoading]);

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

  const buildPIQContextObject = (): PIQChatContext => {
    if (!piqPromptId || !piqPromptText || !piqPromptTitle) {
      throw new Error('PIQ mode requires promptId, promptText, and promptTitle');
    }

    return buildPIQChatContext(
      piqPromptId,
      piqPromptText,
      piqPromptTitle,
      currentDraft,
      analysisResult,
      {
        currentScore,
        initialScore,
        hasUnsavedChanges,
        needsReanalysis,
        versionHistory: versionHistory || [],
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

    // Credit check and deduction UPFRONT before sending message
    if (userId && getToken) {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        const creditCheck = await canSendChatMessage(userId, token);

        if (!creditCheck.hasEnough) {
          setCurrentCreditBalance(creditCheck.currentBalance);
          setShowInsufficientCreditsModal(true);
          return;
        }

        const promptName = mode === 'piq' ? piqPromptTitle : activity?.name;
        const deductResult = await deductForChatMessage(userId, token, promptName);
        if (!deductResult.success) {
          return;
        }
      }
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now(),
    };

    updateMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      if (mode === 'piq' && piqPromptId && piqPromptText && piqPromptTitle) {
        const context = buildPIQContextObject();
        const response = await sendPIQChatMessage({
          userMessage: userMessage.content,
          context,
          conversationHistory: chatMessages,
        });
        updateMessages((prev) => [...prev, response.message]);
      } else {
        const context = buildContextObject();
        const response = await sendChatMessage({
          userMessage: userMessage.content,
          context,
          conversationHistory: chatMessages,
          options: {
            tone: 'mentor',
            includeRecommendations: true,
          },
        });
        updateMessages((prev) => [...prev, response.message]);

        if (response.recommendations && response.recommendations.length > 0) {
          setRecommendations(response.recommendations);
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content:
          error instanceof Error
            ? `I'm having trouble connecting right now. Please try again. (${error.message})`
            : "I'm having trouble connecting right now. Please try again.",
        timestamp: Date.now(),
      };
      updateMessages((prev) => [...prev, errorMessage]);
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

    setRecommendations((prev) => prev.filter((r) => r !== rec));
  };

  const handleQuickQuestion = (question: string) => {
    setUserInput(question);
    inputRef.current?.focus();
  };

  // ============================================================================
  // TEXTAREA AUTO-RESIZE
  // ============================================================================

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = 'auto';
    const maxHeight = 120; // ~5 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [userInput]);

  // ============================================================================
  // CONVERSATION STARTERS
  // ============================================================================

  const conversationStarters =
    chatMessages.length === 1 && analysisResult
      ? mode === 'piq' && piqPromptId && piqPromptText && piqPromptTitle
        ? getPIQConversationStarters(buildPIQContextObject())
        : getConversationStarters(buildContextObject())
      : [];

  // ============================================================================
  // RENDER
  // ============================================================================

  const isWaitingForAnalysis = !analysisResult;

  return (
    <div className="w-full flex flex-col bg-card relative overflow-hidden h-full min-h-[400px]">

      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">
                Uplift Coach
              </h3>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {isWaitingForAnalysis ? 'Analyzing...' : 'Ready to help'}
              </p>
            </div>
          </div>

          {/* Reanalyze button */}
          {onTriggerReanalysis && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onTriggerReanalysis}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Re-analyze with latest edits</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MESSAGES                                                         */}
      {/* ================================================================ */}
      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="px-4 py-4 space-y-5">

          {/* Empty state when waiting for analysis */}
          {isWaitingForAnalysis && chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-foreground/80 mb-1">
                Preparing your coach
              </p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Analyzing your essay to provide personalized coaching...
              </p>
              <div className="flex gap-1 mt-4">
                <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" />
                <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
                <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            </div>
          )}

          {chatMessages.map((message, index) => {
            const isUser = message.role === 'user';
            const isFirstAssistant = !isUser && (index === 0 || chatMessages[index - 1]?.role === 'user');

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'items-end gap-3'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
              >
                {/* AI Avatar - only for first message in a group */}
                {!isUser && (
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm ${!isFirstAssistant ? 'invisible' : ''}`}>
                    <GraduationCap className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`max-w-[85%] ${
                    isUser
                      ? 'bg-foreground text-background rounded-2xl rounded-br-md px-4 py-2.5'
                      : 'bg-muted/60 text-foreground rounded-2xl rounded-bl-md px-4 py-3'
                  }`}
                >
                  {/* Message content */}
                  <div className={`text-[13px] leading-relaxed ${isUser ? '' : 'text-foreground/90'}`}>
                    {isUser ? message.content : renderMessageContent(message.content)}
                  </div>

                  {/* Timestamp - subtle */}
                  <div
                    className={`text-[10px] mt-1.5 ${
                      isUser ? 'text-background/40' : 'text-muted-foreground/50'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          {/* Conversation starters */}
          {conversationStarters.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-wider pl-10">
                Suggested questions
              </p>
              <div className="flex flex-col gap-1.5 pl-10">
                {conversationStarters.slice(0, 3).map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(starter)}
                    className="group text-left text-[13px] px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/50 hover:border-border text-foreground/80 hover:text-foreground transition-all duration-150"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-purple-500/70 flex-shrink-0" />
                      <span className="line-clamp-2">{starter}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-wider pl-10">
                Recommended actions
              </p>
              <div className="flex flex-col gap-1.5 pl-10">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecommendationClick(rec)}
                    className="group text-left px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-150"
                  >
                    <div className="text-[13px] font-medium text-foreground/90">
                      {rec.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {rec.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ================================================================ */}
      {/* INPUT AREA                                                       */}
      {/* ================================================================ */}
      <div className="flex-shrink-0 p-3 border-t border-border/50">
        <div className="relative flex items-end gap-2 bg-muted/40 rounded-2xl border border-border/60 focus-within:border-purple-400/60 focus-within:bg-muted/20 transition-all duration-200">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              isWaitingForAnalysis
                ? 'Waiting for analysis...'
                : 'Ask about your essay...'
            }
            disabled={isWaitingForAnalysis || isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed py-2.5 pl-4 pr-2 placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 max-h-[120px]"
            rows={1}
          />
          <div className="flex-shrink-0 p-1.5">
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isWaitingForAnalysis || isLoading}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:hover:bg-foreground transition-all duration-150"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[10px] text-muted-foreground/50">
            Enter to send
          </p>
          {userId && (
            <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              {CREDIT_COSTS.CHAT_MESSAGE} credit/msg
            </p>
          )}
        </div>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        currentBalance={currentCreditBalance}
        requiredCredits={CREDIT_COSTS.CHAT_MESSAGE}
        actionType="chat"
      />
    </div>
  );
}
