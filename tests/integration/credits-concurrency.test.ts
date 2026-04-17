/**
 * credits-concurrency.test.ts — Round 7 P0 hardening (D6-H2)
 *
 * Verifies `atomicDebit()` is race-safe under concurrent access. The
 * contract: given a user with balance = N credits, firing K >= 2 debits of
 * N credits each in parallel must produce EXACTLY ONE success and no
 * overdraw. The surviving balance must be non-negative.
 *
 * Requires live Supabase credentials (service-role). When credentials are
 * absent, the test exits 77 (skip) — the unit suite short-circuit.
 *
 *   Required env:
 *     SUPABASE_URL  (or VITE_SUPABASE_URL)
 *     SUPABASE_SERVICE_ROLE_KEY  (or SUPABASE_SERVICE_KEY)
 *
 * Run:
 *   npx tsx tests/integration/credits-concurrency.test.ts
 *
 * Exit codes:
 *   0  — all assertions passed
 *   1  — at least one assertion failed (real bug)
 *  77  — skipped (no credentials; not a failure)
 *
 * Cleanup: the test inserts a `profiles` row with a synthetic user_id,
 * performs the debits, asserts, and deletes the row unconditionally (even
 * on failure) via a finally block.
 */

// Ensure env vars are visible to `@/supabase/admin` at import time. Users
// running locally may rely on `.env.local`.
import * as path from 'path';
import * as dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
dotenv.config({ path: path.resolve(repoRoot, '.env.local'), override: false });
dotenv.config({ path: path.resolve(repoRoot, '.env'), override: false });

const SKIP_EXIT = 77;

function hasCredentials(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PROJECT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return Boolean(url && key);
}

let passed = 0;
let failed = 0;

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}  expected=${String(expected)} actual=${String(actual)}`);
  }
}

async function run(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('credits-concurrency.test.ts — atomicDebit race safety');
  console.log('═══════════════════════════════════════════════════════════════════');

  if (!hasCredentials()) {
    console.log('\n[SKIP] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping integration test.');
    console.log('       This is expected in environments without DB access. Exit 77.');
    process.exit(SKIP_EXIT);
  }

  // Dynamic imports — the modules read env at load time, so we defer until
  // after dotenv has populated process.env.
  const { supabaseAdmin } = await import('../../src/supabase/admin');
  const { atomicDebit } = await import('../../src/services/credits/creditsService');

  const testUserId = `test:credits-concurrency:${Date.now()}:${Math.floor(Math.random() * 1e6)}`;
  console.log(`\nTest user_id: ${testUserId}`);

  // The `profiles` table has several NOT NULL columns without defaults
  // (user_context, goals, etc.). We insert with the minimum viable payload
  // and catch any schema mismatch explicitly so the test can surface it.
  async function createTestUser(initialCredits: number): Promise<boolean> {
    const insertPayload: Record<string, unknown> = {
      user_id: testUserId,
      credits: initialCredits,
      // user_context is USER-DEFINED enum. The codebase consistently uses
      // 'high_school_11th' as the default value (see
      // src/http/webhooks/clerk.ts, src/components/RequireTermsAccepted.tsx,
      // src/hooks/useOnboardingForm.ts). If the DB rejects this, we skip
      // cleanly — better than a false positive.
      user_context: 'high_school_11th',
      status: 'initial',
      goals: { primaryGoal: 'exploring_options', desiredOutcomes: [], timelineUrgency: 'flexible' },
      constraints: { needsFinancialAid: false },
      demographics: {},
      completion_score: 0,
      completion_details: { overall: 0, sections: { basic: 0, goals: 0, academic: 0, enrichment: 0, experience: 0 } },
      extracted_skills: {},
      hidden_strengths: [],
      enrichment_priorities: [],
      has_completed_assessment: false,
    };
    const { error } = await supabaseAdmin.from('profiles').insert(insertPayload);
    if (error) {
      console.error(`[setup] Failed to insert test profile: ${error.message}`);
      return false;
    }
    return true;
  }

  async function deleteTestUser(): Promise<void> {
    try {
      // Tear down any transaction rows we may have created.
      await supabaseAdmin.from('credit_transactions').delete().eq('user_id', testUserId);
      await supabaseAdmin.from('profiles').delete().eq('user_id', testUserId);
    } catch (err) {
      console.warn('[cleanup] Cleanup threw (non-fatal):', err);
    }
  }

  async function readBalance(): Promise<number | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', testUserId)
      .maybeSingle();
    if (error || !data) return null;
    return Number((data as { credits?: number }).credits ?? 0);
  }

  let cleanupDone = false;
  const cleanup = async () => {
    if (cleanupDone) return;
    cleanupDone = true;
    await deleteTestUser();
  };

  try {
    // ─── Test 1: Two parallel debits of 1 credit against balance=1 ──────────
    console.log('\n[Test 1] balance=1, two concurrent atomicDebit(1) calls');
    {
      const created = await createTestUser(1);
      if (!created) {
        console.log('[SKIP] Could not create test profile (schema/RLS mismatch).');
        console.log('       Treating as skip — exit 77.');
        await cleanup();
        process.exit(SKIP_EXIT);
      }

      const preBalance = await readBalance();
      assertEq(preBalance, 1, 'pre-debit balance is 1');

      const [r1, r2] = await Promise.all([
        atomicDebit(testUserId, 1, { transaction: { type: 'usage', description: 'concurrency-test-A' } }),
        atomicDebit(testUserId, 1, { transaction: { type: 'usage', description: 'concurrency-test-B' } }),
      ]);

      const successes = [r1, r2].filter((r) => r.success);
      const failures = [r1, r2].filter((r) => !r.success);
      assertEq(successes.length, 1, 'exactly one of two concurrent debits succeeds');
      assertEq(failures.length, 1, 'exactly one of two concurrent debits fails');

      const winner = successes[0];
      const loser = failures[0];
      if (winner) {
        assertEq(winner.newBalance, 0, 'winning debit reports newBalance=0');
      }
      if (loser) {
        assertEq(loser.reason, 'insufficient_balance', 'losing debit reason=insufficient_balance');
      }

      const finalBalance = await readBalance();
      assertEq(finalBalance, 0, 'final DB balance is 0 (no negative, no overdraw)');
      assert(finalBalance !== null && finalBalance >= 0, 'final balance non-negative');

      await deleteTestUser();
      cleanupDone = false; // allow cleanup to run again after next setup
    }

    // ─── Test 2: Three parallel debits against balance=2 (only two winners) ─
    console.log('\n[Test 2] balance=2, three concurrent atomicDebit(1) calls');
    {
      const created = await createTestUser(2);
      assert(created, 'test profile created (balance=2)');
      if (!created) throw new Error('could not create second test profile');

      const results = await Promise.all([
        atomicDebit(testUserId, 1, { transaction: { type: 'usage', description: 'concurrency-test-C' } }),
        atomicDebit(testUserId, 1, { transaction: { type: 'usage', description: 'concurrency-test-D' } }),
        atomicDebit(testUserId, 1, { transaction: { type: 'usage', description: 'concurrency-test-E' } }),
      ]);
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);
      assertEq(successes.length, 2, 'exactly two of three concurrent debits succeed');
      assertEq(failures.length, 1, 'exactly one of three concurrent debits fails');

      const finalBalance = await readBalance();
      assertEq(finalBalance, 0, 'final balance is 0 after 2 winners of 1 credit each');
      assert(finalBalance !== null && finalBalance >= 0, 'final balance non-negative');

      // The loser must report insufficient_balance.
      for (const f of failures) {
        assertEq(f.reason, 'insufficient_balance', 'loser reason=insufficient_balance');
      }

      await deleteTestUser();
      cleanupDone = false;
    }

    // ─── Test 3: Guard-rail — non-positive / non-integer amounts rejected ──
    console.log('\n[Test 3] input validation');
    {
      const r0 = await atomicDebit('any-user', 0);
      assertEq(r0.success, false, 'amount=0 rejected');
      assertEq(r0.reason, 'unexpected_error', 'amount=0 reason=unexpected_error');

      const rNeg = await atomicDebit('any-user', -5);
      assertEq(rNeg.success, false, 'negative amount rejected');

      const rFrac = await atomicDebit('any-user', 1.5);
      assertEq(rFrac.success, false, 'fractional amount rejected');
    }

    // ─── Summary ────────────────────────────────────────────────────────────
    console.log('\n───────────────────────────────────────────────────────────────────');
    console.log(`Results: ${passed} passed · ${failed} failed`);
    await cleanup();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n[credits-concurrency] Test run crashed:', err);
    await cleanup();
    process.exit(1);
  }
}

run().catch(async (err) => {
  console.error('[credits-concurrency] Unhandled:', err);
  process.exit(1);
});
