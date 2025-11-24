/**
 * Claude API Integration Layer
 *
 * Handles all interactions with Anthropic's Claude API including:
 * - Structured JSON output for analysis
 * - Prompt caching for efficiency
 * - Rate limiting and retries
 * - Token usage tracking
 */
export interface ClaudeCallOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    useJsonMode?: boolean;
    cacheSystemPrompt?: boolean;
}
export interface ClaudeResponse<T = any> {
    content: T;
    usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
    };
    stopReason: string;
}
/**
 * Make a call to Claude API with retry logic
 */
export declare function callClaude<T = any>(userPrompt: string, options?: ClaudeCallOptions): Promise<ClaudeResponse<T>>;
/**
 * Make a call to Claude with automatic retries for rate limits
 */
export declare function callClaudeWithRetry<T = any>(userPrompt: string, options?: ClaudeCallOptions, maxRetries?: number): Promise<ClaudeResponse<T>>;
/**
 * Batch multiple Claude calls in parallel with concurrency limit
 */
export declare function batchCallClaude<T = any>(prompts: {
    prompt: string;
    options?: ClaudeCallOptions;
}[], concurrencyLimit?: number): Promise<ClaudeResponse<T>[]>;
/**
 * Estimate token count (rough approximation)
 * ~4 characters per token for English text
 */
export declare function estimateTokens(text: string): number;
/**
 * Calculate cost for API call
 * Prices as of 2025 for Claude Sonnet 3.5
 */
export declare function calculateCost(usage: ClaudeResponse['usage']): number;
//# sourceMappingURL=claude.d.ts.map