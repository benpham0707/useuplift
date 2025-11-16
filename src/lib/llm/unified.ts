/**
 * Unified LLM Interface
 *
 * Supports both Claude (Anthropic) and GPT-5 (OpenAI) with identical interface.
 * Enables A/B testing and model comparison for narrative workshop.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// ============================================================================
// TYPES
// ============================================================================

export type LLMProvider = 'claude' | 'gpt5';

export interface UnifiedLLMOptions {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useJsonMode?: boolean;
}

export interface UnifiedLLMResponse<T = any> {
  content: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  provider: LLMProvider;
  model: string;
  stopReason?: string;
}

// ============================================================================
// API CLIENTS
// ============================================================================

// Check if we're in browser (Vite) or Node.js environment
const isBrowser = typeof import.meta !== 'undefined' && !!import.meta.env;

// Get API keys
const ANTHROPIC_KEY = isBrowser
  ? import.meta.env.VITE_ANTHROPIC_API_KEY
  : process.env.ANTHROPIC_API_KEY;

const OPENAI_KEY = isBrowser
  ? import.meta.env.VITE_UPLIFT_OPENAI_KEY
  : process.env.UPLIFT_OPENAI_KEY;

if (!ANTHROPIC_KEY && !OPENAI_KEY) {
  throw new Error('No LLM API keys found. Need ANTHROPIC_API_KEY or UPLIFT_OPENAI_KEY');
}

// Initialize clients
const anthropicClient = ANTHROPIC_KEY ? new Anthropic({
  apiKey: ANTHROPIC_KEY,
  dangerouslyAllowBrowser: isBrowser
}) : null;

const openaiClient = OPENAI_KEY ? new OpenAI({
  apiKey: OPENAI_KEY,
  dangerouslyAllowBrowser: isBrowser
}) : null;

// ============================================================================
// DEFAULT MODELS
// ============================================================================

const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-20250514',
  gpt5: 'gpt-4o'  // Using GPT-4o as the best available model
};

// ============================================================================
// UNIFIED LLM CALL
// ============================================================================

/**
 * Call either Claude or GPT-5 with unified interface
 */
export async function callUnifiedLLM<T = any>(
  userPrompt: string,
  options: UnifiedLLMOptions = {}
): Promise<UnifiedLLMResponse<T>> {
  const {
    provider = 'claude',
    model,
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
    useJsonMode = false,
  } = options;

  const selectedModel = model || DEFAULT_MODELS[provider];

  if (provider === 'claude') {
    return callClaude<T>(userPrompt, {
      model: selectedModel,
      temperature,
      maxTokens,
      systemPrompt,
      useJsonMode,
    });
  } else {
    return callGPT5<T>(userPrompt, {
      model: selectedModel,
      temperature,
      maxTokens,
      systemPrompt,
      useJsonMode,
    });
  }
}

// ============================================================================
// CLAUDE IMPLEMENTATION
// ============================================================================

async function callClaude<T = any>(
  userPrompt: string,
  options: Omit<UnifiedLLMOptions, 'provider'>
): Promise<UnifiedLLMResponse<T>> {
  if (!anthropicClient) {
    throw new Error('Claude API key not configured');
  }

  const {
    model = DEFAULT_MODELS.claude,
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
    useJsonMode = false,
  } = options;

  console.log(`[Claude] Calling ${model} (temp: ${temperature}, json: ${useJsonMode})`);

  try {
    const response = await anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract content
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    // Parse JSON if requested
    let content: T;
    if (useJsonMode) {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Claude response');
      }
      content = JSON.parse(jsonMatch[0]);
    } else {
      content = textContent as T;
    }

    return {
      content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      provider: 'claude',
      model,
      stopReason: response.stop_reason || undefined,
    };
  } catch (error) {
    console.error('[Claude] API call failed:', error);
    throw error;
  }
}

// ============================================================================
// GPT-5 (OpenAI) IMPLEMENTATION
// ============================================================================

async function callGPT5<T = any>(
  userPrompt: string,
  options: Omit<UnifiedLLMOptions, 'provider'>
): Promise<UnifiedLLMResponse<T>> {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    model = DEFAULT_MODELS.gpt5,
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
    useJsonMode = false,
  } = options;

  console.log(`[GPT-5] Calling ${model} (temp: ${temperature}, json: ${useJsonMode})`);

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    const response = await openaiClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
    });

    const textContent = response.choices[0]?.message?.content || '';

    // Parse JSON if requested
    let content: T;
    if (useJsonMode) {
      content = JSON.parse(textContent);
    } else {
      content = textContent as T;
    }

    return {
      content,
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
      provider: 'gpt5',
      model,
      stopReason: response.choices[0]?.finish_reason || undefined,
    };
  } catch (error) {
    console.error('[GPT-5] API call failed:', error);
    throw error;
  }
}

// ============================================================================
// BATCH COMPARISON
// ============================================================================

/**
 * Call both models in parallel and compare results
 */
export async function compareModels<T = any>(
  userPrompt: string,
  options: Omit<UnifiedLLMOptions, 'provider'> = {}
): Promise<{
  claude: UnifiedLLMResponse<T>;
  gpt5: UnifiedLLMResponse<T>;
  comparison: {
    timeDiff: number;
    tokenDiff: number;
    costDiffEstimate: string;
  };
}> {
  const startClaude = Date.now();
  const claudePromise = callUnifiedLLM<T>(userPrompt, { ...options, provider: 'claude' });

  const startGPT = Date.now();
  const gptPromise = callUnifiedLLM<T>(userPrompt, { ...options, provider: 'gpt5' });

  const [claude, gpt5] = await Promise.all([claudePromise, gptPromise]);

  const claudeTime = Date.now() - startClaude;
  const gptTime = Date.now() - startGPT;

  // Rough cost estimates (Claude Sonnet 4: $3/$15 per MTok, GPT-4o: $2.50/$10 per MTok)
  const claudeCost = (claude.usage.input_tokens / 1_000_000) * 3 +
                     (claude.usage.output_tokens / 1_000_000) * 15;
  const gptCost = (gpt5.usage.input_tokens / 1_000_000) * 2.5 +
                  (gpt5.usage.output_tokens / 1_000_000) * 10;

  return {
    claude,
    gpt5,
    comparison: {
      timeDiff: claudeTime - gptTime,
      tokenDiff: claude.usage.total_tokens - gpt5.usage.total_tokens,
      costDiffEstimate: `Claude: $${claudeCost.toFixed(4)}, GPT: $${gptCost.toFixed(4)}, Diff: $${(claudeCost - gptCost).toFixed(4)}`,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already declared above with the function/type definitions
