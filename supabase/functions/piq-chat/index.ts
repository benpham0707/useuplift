/**
 * PIQ Chat Edge Function
 *
 * World-class AI essay coaching for UC PIQ essays with:
 * - Voice preservation (authentic > flowery)
 * - Quality anchors (sentences to keep)
 * - Anti-convergence coaching (avoid generic patterns)
 * - Deep context awareness (12 dimensions, workshop items, fingerprints)
 * - Cohesive, compelling, powerful, memorable essays
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPT } from './systemPrompt.ts';
import { buildPIQContext, formatContextForLLM } from './contextBuilder.ts';
import { buildConversationContext, calculateCost } from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface PIQChatRequest {
  userMessage: string;
  essayText: string;
  promptId: string;
  promptText: string;
  promptTitle: string;
  analysisResult: any; // Full AnalysisResult from workshop
  userId?: string; // For loading voice profile from DB
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

interface PIQChatResponse {
  message: ChatMessage;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cost: number;
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const requestBody: PIQChatRequest = await req.json();

    // Validate required fields
    if (!requestBody.userMessage || !requestBody.essayText || !requestBody.promptId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userMessage, essayText, promptId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Initialize Supabase client for DB lookups (voice profile + RAG)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const hasSupabase = !!(supabaseUrl && supabaseServiceKey);
    const supabase = hasSupabase ? createClient(supabaseUrl, supabaseServiceKey) : null;

    // Load voice profile from Supabase if userId provided
    let studentVoiceProfile = null;
    if (requestBody.userId && supabase) {
      try {
        const { data: voiceData } = await supabase
          .from('voice_profiles')
          .select('profile')
          .eq('user_id', requestBody.userId)
          .single();
        if (voiceData?.profile) {
          studentVoiceProfile = voiceData.profile;
        }
      } catch (e) {
        console.log('[PIQ Chat] No voice profile found, proceeding without');
      }
    }

    // Try RAG retrieval for writing pattern examples (non-blocking)
    let ragContext = '';
    if (supabase) {
      ragContext = await tryFetchRAGExamples(
        supabase,
        requestBody.essayText,
        requestBody.promptId
      );
    }

    // Build PIQ context
    const context = buildPIQContext(
      requestBody.promptId,
      requestBody.promptText,
      requestBody.promptTitle,
      requestBody.essayText,
      requestBody.analysisResult,
      requestBody.options || {},
      studentVoiceProfile
    );

    // Format context for LLM
    const contextBlock = formatContextForLLM(context);

    // Build conversation context
    const conversationContext = buildConversationContext(
      requestBody.conversationHistory || []
    );

    // Build full user prompt (inject RAG examples if available)
    const fullContextBlock = ragContext
      ? `${contextBlock}\n${ragContext}`
      : contextBlock;

    const fullUserPrompt = buildUserPrompt(
      requestBody.userMessage,
      fullContextBlock,
      conversationContext
    );

    // Call Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: requestBody.options?.maxTokens || 500,
        temperature: requestBody.options?.temperature || 0.7,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: fullUserPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    if (result.usage.cache_read_input_tokens) {
    }

    // Build response
    const chatResponse: PIQChatResponse = {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: result.content[0].text,
        timestamp: Date.now(),
      },
      usage: {
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        cacheReadTokens: result.usage.cache_read_input_tokens || 0,
        cost: calculateCost(result.usage),
      },
    };

    return new Response(JSON.stringify(chatResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// RAG RETRIEVAL (text-based, non-blocking)
// ============================================================================

interface RAGFragmentRow {
  technique: string | null;
  dimension: string | null;
  transferable_principle: string;
  why_it_works: string;
  similarity: number;
}

/**
 * Try to fetch RAG examples via text-based trigram search.
 * Returns formatted context string, or empty string on any failure.
 * This is non-blocking — the chat proceeds normally without RAG if unavailable.
 *
 * Requires the `search_rag_fragments_by_text` RPC function in Supabase.
 * If the function doesn't exist yet, this will silently return empty.
 */
async function tryFetchRAGExamples(
  supabaseClient: ReturnType<typeof createClient>,
  essayText: string,
  promptId: string
): Promise<string> {
  try {
    // Use first ~200 chars of essay as the search query
    const queryText = essayText.substring(0, 200).trim();
    if (!queryText) return '';

    const { data, error } = await supabaseClient.rpc('search_rag_fragments_by_text', {
      query_text: queryText,
      filter_essay_type: 'piq',
      match_count: 3,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) return '';

    const rows = data as RAGFragmentRow[];
    const examples = rows.map((r) => {
      const technique = r.technique || r.dimension || 'Writing technique';
      return [
        `**Pattern: ${technique}**`,
        `Principle: ${r.transferable_principle}`,
        `Why it works: ${r.why_it_works}`,
      ].join('\n');
    }).join('\n\n');

    return [
      '# RAG EXAMPLES (Writing patterns from high-scoring essays)',
      examples,
      '',
      'Use these as INSPIRATION for teaching principles. Never copy specific phrases.',
      '',
    ].join('\n');
  } catch (e) {
    console.log(
      '[PIQ Chat] RAG retrieval failed, proceeding without:',
      e instanceof Error ? e.message : 'Unknown'
    );
    return '';
  }
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildUserPrompt(
  userMessage: string,
  contextBlock: string,
  conversationContext: string
): string {
  const parts: string[] = [];

  // Add context
  parts.push(contextBlock);
  parts.push('');

  // Add conversation history (if any)
  if (conversationContext) {
    parts.push('# PREVIOUS CONVERSATION');
    parts.push(conversationContext);
    parts.push('');
  }

  // Add current question
  parts.push('# STUDENT QUESTION');
  parts.push(userMessage);
  parts.push('');

  // Add coaching instructions
  parts.push('# YOUR TASK');
  parts.push('Provide context-aware coaching for this UC PIQ essay. Your response must:');
  parts.push("1. Quote their actual draft text (show you're reading their specific words)");
  parts.push('2. Reference their voice fingerprint or quality anchors (if relevant)');
  parts.push("3. Give ONE focused insight or suggestion (don't overwhelm)");
  parts.push('4. Preserve their authentic voice (no flowery embellishment)');
  parts.push('5. Provide a concrete next step');
  parts.push('6. Stay within 150-250 words');
  parts.push('');
  parts.push('Remember: Cohesive, compelling, powerful, memorable > flowery, impressive-sounding');

  return parts.join('\n');
}
