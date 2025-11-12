/**
 * Workshop Chat V3 - Analysis-Powered Coaching Interface
 *
 * Full-featured chat UI that leverages:
 * - Deep context aggregation (11 dimensions + teaching + history)
 * - World-class coaching (quotes actual draft, specific insights)
 * - Conversation history (persisted in localStorage)
 * - Action integration (expand categories, load reflections, trigger analysis)
 */

import React, { useState, useEffect, useRef } from 'react';
import type { ExtracurricularItem } from '@/components/portfolio/extracurricular/ExtracurricularCard';
import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import type { TeachingCoachingOutput } from '@/components/portfolio/extracurricular/workshop/teachingTypes';
import type { ReflectionPromptSet } from '@/services/workshop/reflectionPrompts';
import { buildWorkshopChatContext, type WorkshopChatContext } from '@/services/workshop/chatContextV2';
import {
  sendChatMessage,
  getWelcomeMessage,
  loadConversationHistory,
  saveConversationHistory,
  clearConversationHistory,
  type ChatMessage,
} from '@/services/workshop/chatServiceV3';

// ============================================================================
// TYPES
// ============================================================================

interface WorkshopChatV3Props {
  // Core context
  activity: ExtracurricularItem;
  currentDraft: string;
  analysisResult: AnalysisResult | null;
  teachingCoaching: TeachingCoachingOutput | null;

  // State
  currentScore: number;
  initialScore: number;
  hasUnsavedChanges?: boolean;
  needsReanalysis?: boolean;

  // Reflection state
  reflectionPromptsMap?: Map<string, ReflectionPromptSet>;
  reflectionAnswers?: Record<string, Record<string, string>>;

  // Actions
  onToggleCategory?: (categoryKey: string) => void;
  onLoadReflectionPrompts?: (issueId: string) => void;
  onTriggerReanalysis?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WorkshopChatV3({
  activity,
  currentDraft,
  analysisResult,
  teachingCoaching,
  currentScore,
  initialScore,
  hasUnsavedChanges = false,
  needsReanalysis = false,
  reflectionPromptsMap = new Map(),
  reflectionAnswers = {},
  onToggleCategory,
  onLoadReflectionPrompts,
  onTriggerReanalysis,
}: WorkshopChatV3Props) {
  // Build context
  const context: WorkshopChatContext = buildWorkshopChatContext(
    activity,
    currentDraft,
    analysisResult,
    teachingCoaching,
    {
      reflectionPromptsMap,
      reflectionAnswers,
      hasUnsavedChanges,
      needsReanalysis,
    }
  );

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    const history = loadConversationHistory(activity.id);
    if (history.length > 0) {
      setMessages(history);
    } else {
      // Show welcome message
      const welcome = getWelcomeMessage(context);
      setMessages([welcome]);
    }
  }, [activity.id]);

  // Save conversation history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory(activity.id, messages);
    }
  }, [messages, activity.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea (1-4 lines)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 96; // 4 lines * 24px
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  // Handle send message
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Get conversation history (exclude welcome if it's the only message)
      const conversationHistory = messages.filter(m => m.role === 'user' || messages.length > 1);

      // Send to chat service
      const response = await sendChatMessage({
        userMessage: userMessage.content,
        context,
        conversationHistory,
      });

      // Add assistant response
      setMessages(prev => [...prev, response.message]);

    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to get response');

      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `I'm having trouble responding right now. Please try again. (Error: ${err.message})`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear conversation
  const handleClear = () => {
    if (confirm('Clear conversation history?')) {
      clearConversationHistory(activity.id);
      const welcome = getWelcomeMessage(context);
      setMessages([welcome]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">Essay Coach</span>
          <span className="text-xs text-gray-500">
            (NQI: {context.analysis.nqi}/100)
          </span>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          title="Clear conversation"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your essay..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>

        {/* Context indicators */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Unsaved changes
            </span>
          )}
          {needsReanalysis && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Needs re-analysis
            </span>
          )}
          {context.history.totalVersions > 1 && (
            <span>
              {context.history.totalVersions} versions
              {context.history.improvementTrend === 'improving' && ' ↗'}
              {context.history.improvementTrend === 'declining' && ' ↘'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
