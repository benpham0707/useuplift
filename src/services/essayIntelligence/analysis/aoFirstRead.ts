/**
 * AO First Read — Simulates an admissions officer's naive gut reaction.
 *
 * Runs parallel with L1 (zero added latency). Single Haiku call (~$0.003).
 *
 * The value is the NAIVE reaction BEFORE deep understanding. L3.75's
 * admissionsPositioning cannot replicate this because it knows too much
 * by the time it runs. The AO first read captures the "4pm, 29th essay"
 * experience — attention fatigue, gut reaction, the 3-second hook test.
 *
 * The output feeds into:
 * - L3.75 (as input context — "the naive AO reaction was...")
 * - L3.5 (as scoring calibration — anchor paragraph selection)
 * - L6 coaching (the coach can reference "an AO reading this would...")
 */

import { callClaudeWithRetry } from '../../../lib/llm/claude';

const HAIKU = 'claude-haiku-4-5-20251001';

// ============================================================================
// TYPES
// ============================================================================

export interface AOFirstRead {
  /** Where in the first paragraph (if anywhere) the AO's attention locks in */
  hookMoment: string | null;
  /** One sentence the AO would say to a colleague: "This is the essay about..." */
  committeeOneLiner: string;
  /** What makes this essay NOT just another [topic] essay — or null if it IS generic */
  distinctivenessSignal: string | null;
  /** Risk of being put down after paragraph 1 */
  putDownRisk: 'high' | 'moderate' | 'low';
  /** Gut reaction: 2-3 sentences of honest AO internal monologue */
  gutReaction: string;
}

export interface AOFirstReadResult {
  firstRead: AOFirstRead;
  cost: number;
  tokenUsage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };
  timingMs: number;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an admissions officer at a selective university. It's 4:15pm. You've read 29 essays today. You have a stack of 14 more. You're experienced, fair, but TIRED.

You are about to read essay #30. Give your HONEST gut reaction.

You are NOT analyzing this essay deeply. You are reading it ONCE, the way a real AO reads — scanning for a hook, forming a quick impression, deciding whether to lean forward or start skimming.

Do NOT evaluate craft, structure, or technique. Do NOT give writing advice. Just react as a human reader who has read too many essays today.

Output JSON:
{
  "hookMoment": "<quote the specific phrase or image in the first 2-3 sentences that made you keep reading, or null if nothing grabbed you>",
  "committeeOneLiner": "<one sentence you'd say to your colleague: 'This is the essay about...' — what sticks?>",
  "distinctivenessSignal": "<what makes this NOT just another [topic] essay — something specific to THIS student's execution, or null if you've read this essay 50 times before>",
  "putDownRisk": "<high|moderate|low> — how likely are you to start skimming by paragraph 2?",
  "gutReaction": "<2-3 sentences of honest internal monologue as you read. Be real. Examples: 'Another music-to-coding bridge... I've read 200 of these. The seven notes thing is nice but I've seen it. Waiting for something specific...' or 'Bleach and citrus — okay, I'm in a real place. This kid actually DID something. The numbers are good.'>"
}`;

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Run the AO First Read simulation.
 *
 * Designed to run PARALLEL with L1 — adds zero latency to the pipeline.
 * On failure, returns a degraded result (never crashes the pipeline).
 */
export async function runAOFirstRead(essayText: string): Promise<AOFirstReadResult> {
  // [F-2 spillover closure 2026-04-29] No internal try/catch. Pre-fix
  // this function had a `try { ... } catch (error) { return placeholder }`
  // wrapper that silently degraded any failure (LLM throw, JSON parse
  // throw, schema mismatch) into a fake-success result containing
  // `committeeOneLiner: '(AO first read unavailable)'` and
  // `putDownRisk: 'moderate'` — a charter violation by a different name
  // (silent fallback returning hardcoded results). The orchestrator's
  // Promise.allSettled rejection branch is the single failure handler:
  // it emits structured iteration telemetry, pushes to layersFailed[],
  // and leaves profile.aoFirstRead null (every downstream consumer is
  // null-guarded — see analysisOrchestrator.ts:438 block comment for
  // the verified consumer list). Throws here propagate cleanly to that
  // handler.
  const callStart = Date.now();
  const response = await callClaudeWithRetry<string>(
    {
      model: HAIKU,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Read this essay:\n\n${essayText}`,
      maxTokens: 400,
      temperature: 0.5, // Slightly higher for authentic, varied voice
      useJsonMode: true,
      cacheSystemPrompt: true,
    },
  );

  const timingMs = Date.now() - callStart;
  const usage = response.usage ?? { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

  // Parse — callClaude with useJsonMode returns pre-parsed object.
  // Throws on malformed JSON (caught by orchestrator's allSettled branch).
  const raw = (typeof response.content === 'string'
    ? JSON.parse(response.content)
    : response.content) as Record<string, unknown>;

  // Validate and coerce. NOTE: the soft-fallback coercion here (`??`
  // defaults for missing fields, putDownRisk falls back to 'moderate'
  // when not in the enum) is a SECONDARY charter concern — the LLM
  // judgment is pre-determined when a missing/malformed field gets
  // silently filled with a default. Tracked as a separate follow-up;
  // the F-2 spillover scope was the outer try/catch only. Hard schema
  // validation here is a follow-up that needs Tue's call on whether
  // Haiku's known-rare malformed outputs should fail the call or
  // silently coerce as today.
  const validPutDown = ['high', 'moderate', 'low'] as const;
  const rawPutDown = String(raw.putDownRisk ?? 'moderate');
  const putDownRisk = validPutDown.includes(rawPutDown as typeof validPutDown[number])
    ? (rawPutDown as typeof validPutDown[number])
    : 'moderate';

  const firstRead: AOFirstRead = {
    hookMoment: raw.hookMoment ? String(raw.hookMoment) : null,
    committeeOneLiner: String(raw.committeeOneLiner ?? 'Unable to summarize'),
    distinctivenessSignal: raw.distinctivenessSignal ? String(raw.distinctivenessSignal) : null,
    putDownRisk,
    gutReaction: String(raw.gutReaction ?? ''),
  };

  // Calculate cost (Haiku pricing)
  const inputCost = (usage.input_tokens / 1_000_000) * 0.80;
  const outputCost = (usage.output_tokens / 1_000_000) * 4.00;
  const cacheReadCost = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * 0.08;
  const cost = inputCost + outputCost + cacheReadCost;

  return {
    firstRead,
    cost,
    tokenUsage: {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
    },
    timingMs,
  };
}
