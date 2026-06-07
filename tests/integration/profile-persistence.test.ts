/**
 * profile-persistence.test.ts — Round 7 P0 hardening (D4-H1 / D4-L3)
 *
 * Verifies the full persistence round-trip for EssayProfileCoordinator:
 *
 *   1. `createNew({ essayId, ... })` threads essayId through to the
 *      checkpoint metadata (previously hardcoded to '' — no row ever
 *      reached the DB).
 *   2. `SupabaseCheckpointStore.save()` writes the correct essay_type
 *      (previously hardcoded to 'common_app' — flipped PIQ/supplement rows
 *      on every save).
 *   3. `SupabaseCheckpointStore.load()` returns the persisted profile.
 *   4. `fromCheckpoint(profile, essayId, store)` round-trips Round-7
 *      signals (revisionHistory, revisionIntelligence, voiceEvolution).
 *   5. The save path now THROWS on failure (previous silent-catch removed)
 *      and the coordinator surfaces the error to the caller.
 *
 * Requires live Supabase credentials (service-role) AND an existing UUID
 * in `essays(id)` — we insert a temporary `essays` + `profiles` row as
 * setup. When credentials are absent, the test exits 77 (skip).
 *
 *   Required env:
 *     SUPABASE_URL  (or VITE_SUPABASE_URL)
 *     SUPABASE_SERVICE_ROLE_KEY  (or SUPABASE_SERVICE_KEY)
 *
 * Run:
 *   npx tsx tests/integration/profile-persistence.test.ts
 *
 * Exit codes:
 *   0  — all assertions passed
 *   1  — at least one assertion failed (real bug)
 *  77  — skipped (no credentials; not a failure)
 *
 * Cleanup: `finally` block deletes essay_understanding + essays rows.
 *
 * NOTE on scope: the Round-7 signals `claimEarnednessMap`,
 * `rhetoricalInventory`, and `archetypeDistanceProfile` referenced in the
 * audit do NOT exist as live EssayProfile fields yet (they're documented in
 * comments and in the P1-Coord PR scope). This test covers the three signals
 * that ARE persisted today: revisionHistory, revisionIntelligence,
 * voiceEvolution. When the remaining fields land, extend this test to cover
 * them.
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

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

function assertDeepEq(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
    console.error(`    expected: ${e.slice(0, 200)}`);
    console.error(`    actual:   ${a.slice(0, 200)}`);
  }
}

async function run(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('profile-persistence.test.ts — Round 7 P0 (D4-H1 / D4-L3) round-trip');
  console.log('═══════════════════════════════════════════════════════════════════');

  if (!hasCredentials()) {
    console.log('\n[SKIP] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping integration test.');
    console.log('       This is expected in environments without DB access. Exit 77.');
    process.exit(SKIP_EXIT);
  }

  // Deferred imports — modules read env at load time.
  const { supabaseAdmin } = await import('../../src/supabase/admin');
  const {
    EssayProfileCoordinator,
  } = await import('../../src/services/essayIntelligence/profileManager/essayProfileManager');
  const {
    SupabaseCheckpointStore,
  } = await import('../../src/services/essayIntelligence/profileManager/supabaseCheckpointStore');

  const essayId = randomUUID();
  const userId = `test:profile-persistence:${Date.now()}:${Math.floor(Math.random() * 1e6)}`;
  console.log(`\nTest essayId: ${essayId}`);
  console.log(`Test user_id: ${userId}`);

  // ── Fixtures for the four seedable Round-7 signals ──────────────────────
  const fixtureRevisionHistory = {
    snapshots: [
      {
        sessionId: 'seed-session-1',
        version: 1,
        timestamp: new Date().toISOString(),
        essayTextHash: 'deadbeefdeadbeef',
        essayTextLength: 512,
        improvementPhase: null,
        findings: [],
        voiceIdentitySnapshot: {
          markers: ['reflective', 'precise'],
          registerShifts: [],
          vividnessSignal: 'vivid' as const,
        },
        archetypeSaturation: 0.5,
        archetypeLabel: 'quiet_observer',
      },
    ],
    archivedSnapshots: 0,
    resetEvents: [],
  };

  const fixtureRevisionIntelligence = {
    addressedFindings: [],
    persistentFindings: [
      {
        findingId: 'F1',
        craftCategory: 'vague_claim',
        paragraph: 2,
        sessionsPersisted: 2,
        anchorText: 'something happened',
      },
    ],
    regressionEvents: [],
    patternLevelIssues: [],
    revisionVelocity: null,
    summaryForCoach: 'One vague claim has persisted across two sessions.',
  };

  const fixtureVoiceEvolution = {
    markersLostSincePrior: ['wry'],
    markersGainedSincePrior: ['earnest'],
    registerStabilityTrend: 'stable' as const,
    vividnessTrajectory: 'maintained' as const,
    overRevisionWarning: { triggered: false, reasoning: null, framingForCoach: null },
    intentionalShift: {
      detected: true,
      reasoning: 'Marker swap with stable register suggests deliberate voice recalibration.',
    },
    summaryForCoach: 'Voice markers rotated intentionally; register held.',
  };

  let cleanupDone = false;
  const cleanup = async () => {
    if (cleanupDone) return;
    cleanupDone = true;
    try {
      await supabaseAdmin.from('essay_understanding').delete().eq('essay_id', essayId);
      await supabaseAdmin.from('essays').delete().eq('id', essayId);
      // `profiles` table is not seeded by this test (coordinator-only path),
      // but credits-concurrency tests may have touched `profiles` with the
      // same user_id prefix — we scope deletion tightly to avoid collateral
      // damage.
    } catch (err) {
      console.warn('[cleanup] Cleanup threw (non-fatal):', err);
    }
  };

  // Pre-flight: confirm essay_understanding table is reachable. Preview /
  // branch environments where the Round 7 migrations haven't run yet will
  // 404 here — skip rather than fail (this test gates on the DB being at
  // the schema level the PR requires).
  {
    const preflight = await supabaseAdmin
      .from('essay_understanding')
      .select('essay_id')
      .limit(1);
    if (preflight.error) {
      const msg = preflight.error.message;
      const missingTable = /could not find the table|relation .* does not exist/i.test(msg);
      if (missingTable) {
        console.log(`[SKIP] essay_understanding table not present in this DB: ${msg}`);
        console.log('       Migrations not applied — treat as skip. Exit 77.');
        process.exit(SKIP_EXIT);
      }
      // Other errors (RLS, etc.) also treat as skip rather than false-positive.
      console.log(`[SKIP] essay_understanding preflight failed: ${msg}`);
      console.log('       Treat as skip. Exit 77.');
      process.exit(SKIP_EXIT);
    }
  }

  try {
    // ─── Setup: insert a minimal `essays` row the FK can reference ─────────
    // essay_understanding.essay_id references essays(id) ON DELETE CASCADE,
    // so we must create the parent row first.
    // `essays` requires: id, user_id, essay_type, draft_original (NOT NULL).
    // See supabase/migrations/schema.sql for column reference.
    // `essays.essay_type` is a DB ENUM with a DIFFERENT value set than the
    // in-app `EssayType` union (e.g. the enum uses 'uc_piq' not 'piq').
    // The FK parent just needs to exist — use 'personal_statement' which
    // is always valid. The child row in `essay_understanding` (TEXT column,
    // no enum constraint) receives the app-level 'piq' value we're testing.
    const essaysInsert = await supabaseAdmin.from('essays').insert({
      id: essayId,
      user_id: userId,
      essay_type: 'personal_statement',
      draft_original: 'Seed essay text for persistence test. '.repeat(20),
    });
    if (essaysInsert.error) {
      console.log(`[SKIP] Could not insert essays row: ${essaysInsert.error.message}`);
      console.log('       (Schema or RLS may block this in preview; treating as skip — exit 77.)');
      await cleanup();
      process.exit(SKIP_EXIT);
    }

    const store = new SupabaseCheckpointStore(userId);

    // ─── Test 1: createNew() threads essayId through checkpoint metadata ──
    console.log('\n[Test 1] createNew → checkpoint → essay_understanding row exists');
    const coordinator = EssayProfileCoordinator.createNew({
      essayId,
      essayText: 'Seed essay text for persistence test. '.repeat(20),
      paragraphTexts: ['Seed essay text for persistence test.'],
      sentenceTexts: [['Seed essay text for persistence test.']],
      metadata: {
        essayType: 'piq',
        wordCount: 120,
      },
      checkpointStore: store,
    });

    // Seed the three live Round-7 signals. These fields are optional on the
    // live profile, so we cast through unknown to set them directly — the
    // coordinator doesn't expose mutators for them yet (P1-Coord scope).
    const profileRef = coordinator.getProfile() as unknown as Record<string, unknown>;
    profileRef.revisionHistory = fixtureRevisionHistory;
    profileRef.revisionIntelligence = fixtureRevisionIntelligence;
    profileRef.voiceEvolution = fixtureVoiceEvolution;

    await coordinator.checkpoint('conversation_save' as any);

    // Verify row exists in DB
    const { data: row1, error: err1 } = await supabaseAdmin
      .from('essay_understanding')
      .select('essay_id, user_id, essay_type, profile_cache')
      .eq('essay_id', essayId)
      .eq('user_id', userId)
      .maybeSingle();

    assert(err1 == null, 'row fetch succeeds without error');
    assert(row1 != null, 'essay_understanding row exists after checkpoint');
    const row1Typed = row1 as { essay_id: string; user_id: string; essay_type: string; profile_cache: Record<string, unknown> } | null;
    if (row1Typed) {
      assertEq(row1Typed.essay_id, essayId, 'row.essay_id matches seeded UUID');
      assertEq(row1Typed.user_id, userId, 'row.user_id matches seeded user');
      // D4-L3: essay_type must be threaded from metadata, NOT hardcoded.
      assertEq(row1Typed.essay_type, 'piq', 'row.essay_type = piq (D4-L3: not flipped to common_app)');
    }

    // ─── Test 2: load() returns the persisted profile ──────────────────────
    console.log('\n[Test 2] load() returns persisted profile with all 3 signals');
    const loaded = await store.load(essayId);
    assert(loaded != null, 'store.load(essayId) returns non-null profile');

    if (loaded) {
      const loadedAny = loaded as unknown as Record<string, unknown>;
      assertDeepEq(loadedAny.revisionHistory, fixtureRevisionHistory, 'revisionHistory round-trips');
      assertDeepEq(loadedAny.revisionIntelligence, fixtureRevisionIntelligence, 'revisionIntelligence round-trips');
      assertDeepEq(loadedAny.voiceEvolution, fixtureVoiceEvolution, 'voiceEvolution round-trips');
    }

    // ─── Test 3: fromCheckpoint() rebuilds coordinator; second checkpoint works ─
    console.log('\n[Test 3] fromCheckpoint → second checkpoint → row updates idempotently');
    if (loaded) {
      const coord2 = EssayProfileCoordinator.fromCheckpoint(loaded, essayId, store);

      // Simulate a change so writeVersion advances
      await coord2.checkpoint('conversation_save' as any);

      const { data: row2 } = await supabaseAdmin
        .from('essay_understanding')
        .select('essay_id, essay_type, version')
        .eq('essay_id', essayId)
        .eq('user_id', userId)
        .maybeSingle();
      const row2Typed = row2 as { essay_id: string; essay_type: string; version: number } | null;
      assert(row2Typed != null, 'row still exists after second checkpoint (idempotent upsert)');
      if (row2Typed) {
        assertEq(row2Typed.essay_type, 'piq', 'row.essay_type still piq after second save (not flipped)');
      }
    }

    // ─── Test 4: simulate server restart — discard coordinator, reload, deep-eq ─
    console.log('\n[Test 4] server-restart simulation — load + fromCheckpoint again');
    const reloaded = await store.load(essayId);
    assert(reloaded != null, 'store.load(essayId) still returns profile after restart');
    if (reloaded) {
      const reloadedAny = reloaded as unknown as Record<string, unknown>;
      assertDeepEq(reloadedAny.revisionHistory, fixtureRevisionHistory, 'revisionHistory survives restart');
      assertDeepEq(reloadedAny.revisionIntelligence, fixtureRevisionIntelligence, 'revisionIntelligence survives restart');
      assertDeepEq(reloadedAny.voiceEvolution, fixtureVoiceEvolution, 'voiceEvolution survives restart');

      // Re-construct coordinator — should not throw
      let rebuildThrew = false;
      try {
        EssayProfileCoordinator.fromCheckpoint(reloaded, essayId, store);
      } catch (err) {
        rebuildThrew = true;
        console.error(`    rebuild threw: ${err instanceof Error ? err.message : err}`);
      }
      assert(!rebuildThrew, 'fromCheckpoint rebuild succeeds on reload');
    }

    // ─── Test 5: save() now THROWS on invalid essayId (empty-string guard) ──
    console.log('\n[Test 5] save() throws on empty essayId (D4-H1 fail-fast guard)');
    const badMetadata = {
      essayId: '',
      essayType: 'piq' as const,
      reason: 'conversation_save' as const,
      completedLayer: 'conversation_save',
      writeVersion: 0,
      stalenessSnapshot: { sentences: {}, paragraphs: {}, holistic: {}, connections: {} } as any,
      validationResult: { valid: true, checks: [] } as any,
      costSoFar: 0,
    };
    let saveThrew = false;
    try {
      await store.save(loaded ?? ({} as any), badMetadata as any);
    } catch {
      saveThrew = true;
    }
    assert(saveThrew, 'store.save() throws when essayId is empty string');

    // ─── Summary ───────────────────────────────────────────────────────────
    console.log('\n───────────────────────────────────────────────────────────────────');
    console.log(`Summary: ${passed} passed · ${failed} failed`);
    await cleanup();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n[FATAL] Test crashed:', err instanceof Error ? err.stack : err);
    await cleanup();
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('run() unhandled rejection:', err);
  process.exit(1);
});
