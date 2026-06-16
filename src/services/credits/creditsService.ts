/**
 * Credits Service
 * 
 * Handles credit balance checking and deduction for the PIQ Workshop.
 * Credit costs:
 * - Full essay analysis: 5 credits
 * - Chat message: 1 credit
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/safeClient';

// Resolve Supabase config from the environment. NO cross-project fallback: a
// hardcoded default would silently connect to the WRONG project when env is
// missing (e.g. a misconfigured deploy), masking the misconfig. Fail closed.
const VITE_ENV: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env) ||
  {};
const SUPABASE_URL =
  VITE_ENV.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const SUPABASE_PUBLISHABLE_KEY =
  VITE_ENV.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

/**
 * Create an authenticated Supabase client using Clerk JWT token.
 * Uses the anon key for API access but overrides the Authorization header with
 * the Clerk JWT so Postgres RLS resolves the caller via auth.jwt() ->> 'sub'.
 * Throws (fail closed) if Supabase env config is missing.
 */
function getAuthenticatedClient(token: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      '[creditsService] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — ' +
      'refusing to create a Supabase client with no configuration.'
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CREDIT_COSTS = {
  ESSAY_ANALYSIS: 5,
  CHAT_MESSAGE: 1,
} as const;

export type CreditTransactionType = 'subscription_grant' | 'addon_purchase' | 'usage' | 'bonus';

// ============================================================================
// TYPES
// ============================================================================

export interface CreditBalance {
  credits: number;
  userId: string;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

export interface CreditCheckResult {
  hasEnough: boolean;
  currentBalance: number;
  required: number;
  shortfall: number;
}

// ============================================================================
// GET CREDITS
// ============================================================================

/**
 * Get the current credit balance for a user
 * @param userId - Clerk user ID
 * @param token - Optional Clerk JWT token for authenticated requests
 */
export async function getCredits(userId: string, token?: string): Promise<number> {
  try {
    const client = token ? getAuthenticatedClient(token) : supabase;
    
    const { data, error } = await client
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return 0;
    }

    const credits = Number(data?.credits ?? 0);
    return Number.isFinite(credits) ? credits : 0;
  } catch (err) {
    return 0;
  }
}

// ============================================================================
// CHECK CREDITS
// ============================================================================

/**
 * Check if user has enough credits for an action
 * @param userId - Clerk user ID
 * @param requiredAmount - Number of credits needed
 * @param token - Optional Clerk JWT token for authenticated requests
 */
export async function hasEnoughCredits(
  userId: string,
  requiredAmount: number,
  token?: string
): Promise<CreditCheckResult> {
  const currentBalance = await getCredits(userId, token);
  const hasEnough = currentBalance >= requiredAmount;
  
  return {
    hasEnough,
    currentBalance,
    required: requiredAmount,
    shortfall: hasEnough ? 0 : requiredAmount - currentBalance,
  };
}

/**
 * Check if user has enough credits for essay analysis (5 credits)
 * @param userId - Clerk user ID
 * @param token - Optional Clerk JWT token for authenticated requests
 */
export async function canAnalyzeEssay(userId: string, token?: string): Promise<CreditCheckResult> {
  return hasEnoughCredits(userId, CREDIT_COSTS.ESSAY_ANALYSIS, token);
}

/**
 * Check if user has enough credits for chat message (1 credit)
 * @param userId - Clerk user ID
 * @param token - Optional Clerk JWT token for authenticated requests
 */
export async function canSendChatMessage(userId: string, token?: string): Promise<CreditCheckResult> {
  return hasEnoughCredits(userId, CREDIT_COSTS.CHAT_MESSAGE, token);
}

// ============================================================================
// DEDUCT CREDITS
// ============================================================================

/**
 * Deduct credits from user's balance and log the transaction
 * Uses atomic update to prevent race conditions
 * 
 * @param userId - Clerk user ID
 * @param amount - Number of credits to deduct
 * @param type - Type of transaction
 * @param description - Description for the transaction log
 * @param token - Clerk JWT token (REQUIRED for authenticated update)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  token: string
): Promise<CreditDeductionResult> {
  try {
    // Use authenticated client so the RPC resolves the caller via the Clerk JWT.
    const client = getAuthenticatedClient(token);

    // Friendly early-out: avoid an RPC round-trip for the obvious zero-balance case.
    const currentBalance = await getCredits(userId, token);
    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        error: `Insufficient credits. Current: ${currentBalance}, Required: ${amount}`,
      };
    }

    // Deduct via the SECURITY DEFINER RPC. The caller identity is derived
    // server-side from auth.jwt() ->> 'sub' (NOT the passed userId), the balance
    // is decremented atomically with a `credits >= amount` guard, and the
    // credit_transactions row is logged in the same transaction. Direct UPDATE
    // of profiles.credits is revoked from `authenticated`, so this is the only
    // path — a user cannot inflate their own balance.
    const { data, error } = await client.rpc('deduct_credits', {
      p_amount: amount,
      p_type: type,
      p_description: description,
    });

    if (error) {
      // RPC raises on insufficient balance (race) or any failure.
      const insufficient = /insufficient/i.test(error.message);
      return {
        success: false,
        newBalance: currentBalance,
        error: insufficient
          ? `Insufficient credits. Current: ${currentBalance}, Required: ${amount}`
          : `Failed to deduct credits: ${error.message}`,
      };
    }

    const newBalance = Number(data);

    // Dispatch event to update UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits:updated'));
    }

    return {
      success: true,
      newBalance: Number.isFinite(newBalance) ? newBalance : currentBalance - amount,
    };
  } catch (err) {
    return {
      success: false,
      newBalance: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Deduct credits for essay analysis (5 credits)
 * @param userId - Clerk user ID
 * @param token - Clerk JWT token (REQUIRED)
 * @param promptTitle - Optional prompt title for description
 */
export async function deductForEssayAnalysis(
  userId: string,
  token: string,
  promptTitle?: string
): Promise<CreditDeductionResult> {
  const description = promptTitle 
    ? `Essay analysis: ${promptTitle}`
    : 'Essay analysis';
  
  return deductCredits(
    userId,
    CREDIT_COSTS.ESSAY_ANALYSIS,
    'usage',
    description,
    token
  );
}

/**
 * Deduct credits for chat message (1 credit)
 * @param userId - Clerk user ID
 * @param token - Clerk JWT token (REQUIRED)
 * @param promptTitle - Optional prompt title for description
 */
export async function deductForChatMessage(
  userId: string,
  token: string,
  promptTitle?: string
): Promise<CreditDeductionResult> {
  const description = promptTitle
    ? `AI Coach chat: ${promptTitle}`
    : 'AI Coach chat message';
  
  return deductCredits(
    userId,
    CREDIT_COSTS.CHAT_MESSAGE,
    'usage',
    description,
    token
  );
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Format credit cost for display
 */
export function formatCreditCost(amount: number): string {
  return amount === 1 ? '1 credit' : `${amount} credits`;
}

// ============================================================================
// SERVER-SIDE ATOMIC DEBIT PATH
// ============================================================================
//
// The client-side path above (`deductCredits`, etc.) uses `import.meta.env`
// and a Clerk-JWT-authenticated client. It is not safe to call from Node
// server routes (`import.meta.env` is undefined under tsx/esbuild server
// builds, and there is no Clerk JWT available in a server-internal flow).
//
// These server-side helpers use `supabaseAdmin` (service-role) and perform
// an ATOMIC debit via a single SQL UPDATE with a `credits >= $amount` guard.
// Under concurrent access, at most one caller observes `success: true`;
// all others see `insufficient_balance`. No advisory lock required — the
// row-level UPDATE is atomic by Postgres MVCC semantics.
//
// Usage: HTTP routes that burn LLM tokens (e.g. `/essay-coaching/respond`)
// should: (1) pre-check balance to short-circuit zero-balance users;
// (2) run the expensive call; (3) atomically debit post-call; (4) on
// atomic-debit failure, surface a warning in the response envelope — do
// NOT double-charge, do NOT block a successful response. Audit finding
// D6-H2 (Round 7 P0 hardening).

/** Reason tags returned by `atomicDebit` when `success: false`. */
export type AtomicDebitErrorReason =
  | 'insufficient_balance'
  | 'db_error'
  | 'unexpected_error';

export interface AtomicDebitResult {
  success: boolean;
  newBalance: number;
  /** Balance observed immediately before the debit attempt (if known). */
  priorBalance?: number;
  /** Machine-readable reason. Use for HTTP status mapping. */
  reason?: AtomicDebitErrorReason;
  error?: string;
}

export interface AtomicDebitOptions {
  /**
   * If provided, a row is inserted into `credit_transactions` after the
   * debit succeeds. Failures here are logged but do NOT fail the debit.
   */
  transaction?: {
    type: CreditTransactionType;
    description: string;
  };
}

/**
 * Server-side: read the current credit balance for a user via
 * `supabaseAdmin`. Returns 0 on any error or missing row.
 */
export async function getCreditsServer(userId: string): Promise<number> {
  try {
    const { supabaseAdmin } = await import('@/supabase/admin');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[credits/server] getCreditsServer error:', error.message);
      return 0;
    }
    const credits = Number((data as { credits?: number } | null)?.credits ?? 0);
    return Number.isFinite(credits) ? credits : 0;
  } catch (err) {
    console.warn('[credits/server] getCreditsServer threw:', err);
    return 0;
  }
}

/**
 * Server-side: check whether a user has at least `required` credits,
 * without performing any mutation.
 */
export async function hasEnoughCreditsServer(
  userId: string,
  required: number,
): Promise<CreditCheckResult> {
  const currentBalance = await getCreditsServer(userId);
  const hasEnough = currentBalance >= required;
  return {
    hasEnough,
    currentBalance,
    required,
    shortfall: hasEnough ? 0 : required - currentBalance,
  };
}

/** Max compare-and-swap retries before giving up. Bounded to keep tail
 * latency predictable under heavy contention. */
const ATOMIC_DEBIT_MAX_ATTEMPTS = 8;

/**
 * Server-side ATOMIC debit via compare-and-swap (optimistic concurrency).
 *
 * Algorithm per attempt:
 *   1. Read current balance (`priorBalance`).
 *   2. If `priorBalance < amount` → return insufficient_balance.
 *   3. UPDATE profiles SET credits = priorBalance - amount
 *      WHERE user_id = $u AND credits = priorBalance
 *      RETURNING credits.
 *   4. If 1 row updated → success. If 0 rows updated → another writer
 *      raced us; retry (bounded by ATOMIC_DEBIT_MAX_ATTEMPTS).
 *
 * This is the standard CAS pattern. It is correct without an RPC or
 * advisory lock because the `credits = priorBalance` predicate acts as
 * the version stamp — two concurrent callers cannot both match it, since
 * whichever commits first changes the value.
 *
 * NOTE: `amount` must be a positive integer. Fractional amounts are
 * rejected (`profiles.credits` is `integer NOT NULL`).
 */
export async function atomicDebit(
  userId: string,
  amount: number,
  options: AtomicDebitOptions = {},
): Promise<AtomicDebitResult> {
  if (!userId || typeof userId !== 'string') {
    return { success: false, newBalance: 0, reason: 'unexpected_error', error: 'userId is required' };
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      success: false,
      newBalance: 0,
      reason: 'unexpected_error',
      error: `amount must be a positive integer (got ${amount})`,
    };
  }

  try {
    const { supabaseAdmin } = await import('@/supabase/admin');

    let priorBalance = 0;
    for (let attempt = 1; attempt <= ATOMIC_DEBIT_MAX_ATTEMPTS; attempt++) {
      // (1) Read current balance.
      const { data: priorRow, error: priorErr } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .maybeSingle();
      if (priorErr) {
        return {
          success: false,
          newBalance: 0,
          reason: 'db_error',
          error: `Failed to read balance: ${priorErr.message}`,
        };
      }
      if (!priorRow) {
        return {
          success: false,
          newBalance: 0,
          reason: 'insufficient_balance',
          error: `No profile row for user ${userId}`,
        };
      }
      priorBalance = Number((priorRow as { credits?: number }).credits ?? 0);

      // (2) Insufficient balance — deterministic failure, no retry.
      if (priorBalance < amount) {
        return {
          success: false,
          newBalance: priorBalance,
          priorBalance,
          reason: 'insufficient_balance',
          error: `Insufficient credits. Current: ${priorBalance}, Required: ${amount}`,
        };
      }

      // (3) Compare-and-swap: UPDATE ... WHERE credits = priorBalance.
      const newBalance = priorBalance - amount;
      const { data: updatedRows, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newBalance })
        .eq('user_id', userId)
        .eq('credits', priorBalance) // version-stamp guard
        .select('credits');

      if (updateErr) {
        return {
          success: false,
          newBalance: priorBalance,
          priorBalance,
          reason: 'db_error',
          error: `Failed to debit credits: ${updateErr.message}`,
        };
      }

      const updatedCount = Array.isArray(updatedRows) ? updatedRows.length : 0;
      if (updatedCount === 1) {
        const observedNewBalance = Number(
          (updatedRows![0] as { credits?: number }).credits ?? newBalance,
        );

        // (4a) Best-effort transaction log — failure is non-fatal.
        if (options.transaction) {
          try {
            const { error: txErr } = await supabaseAdmin
              .from('credit_transactions')
              .insert({
                user_id: userId,
                amount: -amount,
                type: options.transaction.type,
                description: options.transaction.description,
              });
            if (txErr) {
              console.warn('[credits/server] Transaction log insert failed (non-fatal):', txErr.message);
            }
          } catch (txCatch) {
            console.warn('[credits/server] Transaction log insert threw (non-fatal):', txCatch);
          }
        }

        return {
          success: true,
          newBalance: observedNewBalance,
          priorBalance,
        };
      }

      // (4b) CAS failed — another writer changed `credits`. Retry.
      // Small exponential backoff to avoid thundering-herd on hot rows.
      if (attempt < ATOMIC_DEBIT_MAX_ATTEMPTS) {
        const delayMs = Math.min(50, 2 ** attempt); // 2, 4, 8, 16, 32, 50, 50 ms
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    // Exhausted retries — treat as a transient DB-contention failure.
    const currentBalance = await getCreditsServer(userId);
    return {
      success: false,
      newBalance: currentBalance,
      priorBalance,
      reason: 'db_error',
      error: `Atomic debit contention: exhausted ${ATOMIC_DEBIT_MAX_ATTEMPTS} CAS attempts`,
    };
  } catch (err) {
    return {
      success: false,
      newBalance: 0,
      reason: 'unexpected_error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Server-side compensating credit. Used when an LLM call succeeds but the
 * downstream `atomicDebit` failed (e.g. the user won a concurrent race).
 * Also available for refund/bonus flows. Always succeeds unless the DB
 * write fails; no atomicity guard is needed (adding credits cannot go
 * negative).
 */
export async function refundCredits(
  userId: string,
  amount: number,
  options: { type?: CreditTransactionType; description?: string } = {},
): Promise<AtomicDebitResult> {
  if (!userId || typeof userId !== 'string') {
    return { success: false, newBalance: 0, reason: 'unexpected_error', error: 'userId is required' };
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      success: false,
      newBalance: 0,
      reason: 'unexpected_error',
      error: `amount must be a positive integer (got ${amount})`,
    };
  }
  try {
    const { supabaseAdmin } = await import('@/supabase/admin');
    const { data: priorRow, error: priorErr } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();
    if (priorErr || !priorRow) {
      return {
        success: false,
        newBalance: 0,
        reason: priorErr ? 'db_error' : 'insufficient_balance',
        error: priorErr ? priorErr.message : `No profile row for user ${userId}`,
      };
    }
    const priorBalance = Number((priorRow as { credits?: number }).credits ?? 0);
    const newBalance = priorBalance + amount;
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ credits: newBalance })
      .eq('user_id', userId);
    if (updateErr) {
      return {
        success: false,
        newBalance: priorBalance,
        priorBalance,
        reason: 'db_error',
        error: updateErr.message,
      };
    }

    try {
      const { error: txErr } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount,
          type: options.type ?? 'bonus',
          description: options.description ?? 'Refund / compensating credit',
        });
      if (txErr) {
        console.warn('[credits/server] Refund log insert failed (non-fatal):', txErr.message);
      }
    } catch (txCatch) {
      console.warn('[credits/server] Refund log insert threw (non-fatal):', txCatch);
    }

    return { success: true, newBalance, priorBalance };
  } catch (err) {
    return {
      success: false,
      newBalance: 0,
      reason: 'unexpected_error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
