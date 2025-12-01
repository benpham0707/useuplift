/**
 * PIQ Chat API Client
 *
 * Frontend client for calling the PIQ chat edge function
 * Handles API communication with Supabase backend
 */

import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { ChatMessage } from './piqChatService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PIQChatRequest {
  userMessage: string;
  essayText: string;
  promptId: string;
  promptText: string;
  promptTitle: string;
  analysisResult: AnalysisResult | null;
  conversationHistory?: ChatMessage[];
  options?: {
    currentScore: number;
    initialScore: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
    versionHistory?: Array<{ timestamp: number; nqi: number; note?: string }>;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface PIQChatResponse {
  message: ChatMessage;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cost: number;
  };
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Call the PIQ chat edge function
 */
export async function callPIQChatAPI(request: PIQChatRequest): Promise<PIQChatResponse> {

  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('piq-chat', {
      body: request,
    });

    const duration = Date.now() - startTime;

    if (error) {
      throw new Error(`PIQ Chat API Error: ${error.message}`);
    }

    return data as PIQChatResponse;
  } catch (error) {
    throw error;
  }
}
