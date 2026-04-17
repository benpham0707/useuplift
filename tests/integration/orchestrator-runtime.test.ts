/**
 * orchestrator-runtime.test.ts — Round 7 P0 hardening (D8-H1).
 *
 * Runtime integration test for orchestrator-to-profile signal wiring.
 *
 * BACKGROUND (audit finding D8-H1):
 *   Prior "orchestrator-wiring integration tests" were source-regex greps —
 *   they never instantiated the orchestrator, never awaited a promise, never
 *   asserted on runtime behavior. A rename of the `enrichment` field to
 *   `enr` with empty fields would pass. This test is the runtime counterpart
 *   that catches that entire class of bug.
 *
 * SCOPE CHOICE (Option B per commit plan):
 *   The audit mentions four signals: aoFirstRead, claimEarnednessMap,
 *   rhetoricalInventory, archetypeDistanceProfile. Of those, only
 *   `aoFirstRead` is live in the current EssayProfile (the other three are
 *   documented in round 7b/7c plans but not yet wired — see the scope note
 *   in tests/integration/profile-persistence.test.ts:37-44). This test
 *   therefore targets `aoFirstRead` — the one Round-7 signal that actually
 *   reaches the profile today.
 *
 *   Option A (full-pipeline mock of all 8 layers) was rejected after
 *   exploration: orchestrator is 2241 lines with FAIL-FAST coupling across
 *   L1, L2, L2.5, L3, L3.75, L3.5, L4, L5, each with distinct per-paragraph
 *   response schemas. Mocking all of them deterministically exceeds the
 *   30-minute exploration budget set by the commit plan.
 *
 *   Option C (pure-code only) was rejected because it would not touch the
 *   orchestrator ⇒ coordinator ⇒ profile wiring path — which is exactly
 *   what D8-H1 asks us to cover.
 *
 *   Option B targets the runtime wiring path in three cuts:
 *     [1] Direct service runtime — `runAOFirstRead()` with a scripted
 *         Anthropic client stub. Asserts all five AOFirstRead fields are
 *         populated from the LLM response (catches: rename of
 *         `committeeOneLiner` → `cmt` with empty result).
 *     [2] Degraded-fallback runtime — client throws. Asserts the graceful
 *         fallback path produces the documented shape and does NOT throw
 *         to the caller (catches: "a refactor breaks the catch block").
 *     [3] Orchestrator wiring runtime — instantiate AnalysisOrchestrator,
 *         make L1 succeed with a minimal fixture impression (monkey-patched
 *         singleton), make the AO LLM call succeed (scripted client), force
 *         L2/L2.5 to fail fast, inspect the returned partial profile and
 *         assert `profile.aoFirstRead` is populated with the exact
 *         committee one-liner from the scripted AO response. Catches:
 *         (a) orchestrator runs AO but forgets to assign to profile;
 *         (b) rename of `profile.aoFirstRead` → `profile.aoRead`;
 *         (c) orchestrator passes stale / empty value to profile.
 *
 * WHAT A SOURCE-REGEX TEST CANNOT CATCH (and this test does catch):
 *   - `enrichment` renamed to `enr` with empty fields at runtime.
 *   - Orchestrator writes the field but writes an empty object instead of
 *     the layer result.
 *   - Catch-block refactor that silently swallows errors AND overwrites
 *     successful values with `null`.
 *   - Coordinator.getProfile() returns a different object than the one the
 *     orchestrator mutated (reference identity bug).
 *
 * Run: npm run test:integration  (or directly via `npx tsx`)
 * Exit 0 = pass, 1 = fail, 77 = skip. Target runtime: <5s, cost: $0.
 */

// ─── Harness setup (must run before importing the module under test) ────────

// The Anthropic SDK lazily validates the API key only on first use; we set
// a fake key so `getAnthropicClient()` returns a client we can monkey-patch.
// Mirror the pattern from tests/unit/llm-retry.test.ts.
process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-for-orchestrator-runtime-test';

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../src/lib/llm/claude';
import { runAOFirstRead } from '../../src/services/essayIntelligence/analysis/aoFirstRead';
import { AnalysisOrchestrator } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { firstImpressionsService } from '../../src/services/essayIntelligence/analysis/firstImpressions';
import { structuralCartographerService } from '../../src/services/essayIntelligence/analysis/structuralCartographer';
import { scoutPassService } from '../../src/services/essayIntelligence/analysis/scoutPass';
import type { FirstImpressionsResult } from '../../src/services/essayIntelligence/analysis/firstImpressions';
import type { ParagraphFirstImpression, ProfileIndex } from '../../src/services/essayIntelligence/profileTypes';

// ─── Assertion helpers ───────────────────────────────────────────────────────

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
    console.error(
      `  FAIL  ${label}\n        expected: ${String(expected)}\n        actual:   ${String(actual)}`,
    );
  }
}

// ─── Scripted Anthropic-client stub ──────────────────────────────────────────

/**
 * A scripted response with populated AO fields.
 * NOTE: callClaudeWithRetry with `useJsonMode: true` returns `response.content`
 * as a PARSED OBJECT (not a string). We therefore put the object directly in
 * the `text` slot and also in a parallel shape that the runtime will JSON.parse
 * — runAOFirstRead tolerates both (see aoFirstRead.ts:95-98).
 */
const AO_SCRIPTED_RESPONSE = {
  hookMoment: 'Paragraph 1, sentence 2: the smell of bleach and citrus.',
  committeeOneLiner: 'This is the essay about a kid who actually ran a small business.',
  distinctivenessSignal: 'Concrete numbers (14 hours, $847/week) ground an otherwise-common genre.',
  putDownRisk: 'low' as const,
  gutReaction:
    'Opens with smells, not thoughts. I can see the scene. Not another "I love STEM" — this one did something specific.',
};

/**
 * Install a dispatcher on the singleton client's `messages.create`. Chooses
 * the response based on the systemPrompt content so L1 / AO / L2 / L2.5 can
 * coexist in a single test without call-order coupling.
 */
interface DispatchOutcome {
  kind: 'success' | 'throw';
  body?: unknown;
  err?: Error;
}

interface Dispatcher {
  (systemPrompt: string): DispatchOutcome;
}

function installClientDispatcher(dispatch: Dispatcher): { callCount: () => number } {
  const client = getAnthropicClient();
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.messages as any).create = async (params: {
    system?: string | Array<{ type: string; text: string }>;
  }): Promise<unknown> => {
    count++;
    // `system` may be a string or a content-block array (when caching is on).
    let sys = '';
    if (typeof params.system === 'string') {
      sys = params.system;
    } else if (Array.isArray(params.system)) {
      sys = params.system.map((b) => (typeof b.text === 'string' ? b.text : '')).join(' ');
    }
    const out = dispatch(sys);
    if (out.kind === 'throw') {
      throw out.err ?? new Error('[test dispatcher] scripted throw');
    }
    // Shape mirrors what callClaudeWithRetry expects: .content array + .usage + .stop_reason
    return {
      content: [{ type: 'text', text: JSON.stringify(out.body) }],
      usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      stop_reason: 'end_turn',
    };
  };
  return { callCount: () => count };
}

function restoreClient(): void {
  // Drop the stub so subsequent tests don't leak state. The SDK caches the
  // singleton instance; re-importing won't help, but overwriting `create` back
  // to `undefined` will force clear failures if anything tries to use it
  // after a test's teardown.
  const client = getAnthropicClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.messages as any).create = async () => {
    throw new Error('[test] client.messages.create called after teardown');
  };
}

// ─── Test [1]: runAOFirstRead happy path ─────────────────────────────────────

async function testAOHappyPath(): Promise<void> {
  console.log('\n[1] runAOFirstRead — happy path: populated fields round-trip');

  const dispatcher: Dispatcher = (_sys) => ({ kind: 'success', body: AO_SCRIPTED_RESPONSE });
  const stub = installClientDispatcher(dispatcher);

  try {
    const result = await runAOFirstRead('A short two-paragraph fixture.\n\nSecond paragraph here.');

    assertEq(stub.callCount(), 1, 'AO happy: exactly one Anthropic call');
    assertEq(
      result.firstRead.hookMoment,
      AO_SCRIPTED_RESPONSE.hookMoment,
      'AO happy: hookMoment populated from LLM response',
    );
    assertEq(
      result.firstRead.committeeOneLiner,
      AO_SCRIPTED_RESPONSE.committeeOneLiner,
      'AO happy: committeeOneLiner populated',
    );
    assertEq(
      result.firstRead.distinctivenessSignal,
      AO_SCRIPTED_RESPONSE.distinctivenessSignal,
      'AO happy: distinctivenessSignal populated',
    );
    assertEq(result.firstRead.putDownRisk, 'low', 'AO happy: putDownRisk populated and valid');
    assertEq(
      result.firstRead.gutReaction,
      AO_SCRIPTED_RESPONSE.gutReaction,
      'AO happy: gutReaction populated',
    );

    // The degraded-fallback shape uses "(AO first read unavailable)" — confirm
    // we are NOT in that state. This is the "field renamed to empty" catch.
    assert(
      result.firstRead.committeeOneLiner !== '(AO first read unavailable)',
      'AO happy: not in degraded-fallback state',
    );
    assert(result.firstRead.gutReaction.length > 0, 'AO happy: gutReaction is non-empty');
  } finally {
    restoreClient();
  }
}

// ─── Test [2]: runAOFirstRead degraded fallback ──────────────────────────────

async function testAODegradedFallback(): Promise<void> {
  console.log('\n[2] runAOFirstRead — degraded fallback: client throws, never crashes caller');

  // Force an exhaust-retries failure. Use a 400 to short-circuit retry logic.
  const thrower: Dispatcher = (_sys) => ({
    kind: 'throw',
    err: (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (Anthropic as any).APIError(400, undefined, 'bad request', new Headers());
    })(),
  });
  installClientDispatcher(thrower);

  // Silence the warn log in the degraded path so the test output stays clean.
  const origWarn = console.warn;
  console.warn = () => {
    /* noop */
  };

  try {
    const result = await runAOFirstRead('A short fixture essay.');

    assertEq(
      result.firstRead.committeeOneLiner,
      '(AO first read unavailable)',
      'AO degraded: falls back to sentinel committeeOneLiner',
    );
    assertEq(result.firstRead.putDownRisk, 'moderate', 'AO degraded: defaults to moderate');
    assertEq(result.firstRead.hookMoment, null, 'AO degraded: hookMoment null');
    assertEq(result.firstRead.distinctivenessSignal, null, 'AO degraded: distinctivenessSignal null');
    assertEq(result.cost, 0, 'AO degraded: zero cost recorded');
  } finally {
    console.warn = origWarn;
    restoreClient();
  }
}

// ─── Test [3]: Orchestrator wiring — profile.aoFirstRead populated ───────────

/**
 * Build a minimal but valid FirstImpressionsResult for a 2-paragraph fixture.
 * applyFirstImpressions only reads `impressions[].paragraphIndex`,
 * `sentences[]`, `apparentPurpose`, and `tags` (see essayProfileManager.ts:1256).
 */
function buildFixtureFirstImpressions(paragraphTexts: string[]): FirstImpressionsResult {
  const impressions: ParagraphFirstImpression[] = paragraphTexts.map((text, pIdx) => {
    // Split on `.` for a trivial sentence splitter — the fixture is tightly
    // controlled so we don't need production-grade splitting.
    const sentences = text
      .split(/(?<=\.)\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      paragraphIndex: pIdx,
      apparentPurpose: 'opening_scene',
      emotionalRegister: 'reflective',
      voiceObservation: 'plain declarative sentences',
      craftNotices: [],
      tags: ['fixture'],
      sentences: sentences.map((sText, sIdx) => ({
        index: sIdx,
        text: sText,
        apparentPurpose: 'scene-setting',
        rhetoricalFunction: 'concrete-detail',
        toneShift: false,
        notableElements: [],
        tags: ['fixture'],
      })),
      notablePhrases: [],
    };
  });

  const initialProfileIndex: ProfileIndex = {
    essayLength: {
      paragraphs: impressions.length,
      sentences: impressions.reduce((a, i) => a + i.sentences.length, 0),
      words: paragraphTexts.join(' ').split(/\s+/).filter(Boolean).length,
    },
    confidenceLevel: 'initial',
    topicTags: ['fixture'],
    paragraphDigest: impressions.map((i) => ({
      index: i.paragraphIndex,
      roleSummary: i.apparentPurpose,
      tags: i.tags,
      themes: [],
      sentenceCount: i.sentences.length,
      hasStrengths: false,
      hasWeaknesses: false,
      connectionCount: 0,
      improvementPriority: 0,
    })),
    sectionTokenCounts: {
      voiceIdentity: 0,
      voiceMap: 0,
      emotionalTopography: 0,
      momentEarnednessMap: 0,
      thematicArchitecture: 0,
      narrativeStrategy: 0,
      characterRevelation: 0,
      craftAssessment: 0,
      entanglements: 0,
      admissionsPositioning: 0,
      northStar: 0,
      connections: 0,
      paragraphs: impressions.map(() => 0),
    },
    connectionGraph: [],
  } as unknown as ProfileIndex;

  return {
    impressions,
    initialProfileIndex,
    cost: 0,
    tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
    timingMs: 1,
    paragraphTimings: impressions.map((i) => ({ index: i.paragraphIndex, timingMs: 1, success: true })),
  };
}

async function testOrchestratorWiring(): Promise<void> {
  console.log('\n[3] Orchestrator runtime — profile.aoFirstRead is populated after L1 + AO');

  const fixtureEssay = 'The smell of bleach and citrus hit me first.\n\nShe asked if I could start Monday.';
  const fixtureParas = fixtureEssay.split(/\n\s*\n/);
  const fixtureImpressions = buildFixtureFirstImpressions(fixtureParas);

  // ── Monkey-patch L1 service to return our fixture synchronously. ──
  // We keep the original so we can restore at teardown.
  const origL1Analyze = firstImpressionsService.analyze.bind(firstImpressionsService);
  firstImpressionsService.analyze = async (
    _essayText: string,
    _promptText?: string,
    _phase?: unknown,
  ) => fixtureImpressions;

  // ── Force L2 + L2.5 to abort (FAIL-FAST path at analysisOrchestrator.ts:401) ──
  // This is the cleanest way to get a partial result with the profile intact.
  const origL2Analyze = structuralCartographerService.analyze.bind(structuralCartographerService);
  const origL25Analyze = scoutPassService.analyze.bind(scoutPassService);
  structuralCartographerService.analyze = async () => {
    throw new Error('[test] forced L2 failure to capture partial profile after AO wiring');
  };
  scoutPassService.analyze = async () => {
    throw new Error('[test] forced L2.5 failure');
  };

  // ── Dispatcher: AO must succeed. Everything else should never be called,
  //    but if L1 leaks a call, we throw loudly. ──
  const dispatcher: Dispatcher = (sys) => {
    if (sys.includes('admissions officer')) {
      return { kind: 'success', body: AO_SCRIPTED_RESPONSE };
    }
    // L1 monkey-patched at service boundary, so should not reach this dispatcher
    throw new Error(`[test] unexpected LLM call. systemPrompt starts: "${sys.slice(0, 60)}"`);
  };
  installClientDispatcher(dispatcher);

  // Silence orchestrator's loud abort log so test output stays scannable.
  const origError = console.error;
  const errorLines: string[] = [];
  console.error = (...args: unknown[]) => {
    errorLines.push(args.join(' '));
  };

  try {
    const orchestrator = new AnalysisOrchestrator();
    const result = await orchestrator.analyzeEssay({
      essayId: '00000000-0000-4000-8000-000000000001',
      essayText: fixtureEssay,
      essayType: 'common_app',
      includeAnnotations: false,
    });

    // Core wiring assertions. Each of these would fail against the
    // "rename to `enr` + empty fields" attack described in D8-H1.
    assert(result.profile != null, 'wiring: result.profile is non-null');
    const profileAny = result.profile as unknown as Record<string, unknown>;
    assert('aoFirstRead' in profileAny, 'wiring: profile has `aoFirstRead` field (not renamed to `aoRead` / `enr`)');
    assert(profileAny.aoFirstRead !== null, 'wiring: profile.aoFirstRead is not null');
    assert(profileAny.aoFirstRead !== undefined, 'wiring: profile.aoFirstRead is not undefined');

    const ao = profileAny.aoFirstRead as Record<string, unknown> | null;
    if (ao) {
      // THE key assertion — catches "field exists but empty" renames.
      assertEq(
        ao.committeeOneLiner,
        AO_SCRIPTED_RESPONSE.committeeOneLiner,
        'wiring: profile.aoFirstRead.committeeOneLiner equals the scripted response',
      );
      assertEq(
        ao.hookMoment,
        AO_SCRIPTED_RESPONSE.hookMoment,
        'wiring: profile.aoFirstRead.hookMoment equals the scripted response',
      );
      assertEq(
        ao.putDownRisk,
        'low',
        'wiring: profile.aoFirstRead.putDownRisk equals the scripted response',
      );
      assert(
        typeof ao.gutReaction === 'string' && (ao.gutReaction as string).length > 20,
        'wiring: profile.aoFirstRead.gutReaction is populated (not an empty-string rename)',
      );
    }

    // Sanity: we intentionally aborted the pipeline at L2.
    assertEq(result.completedAllLayers, false, 'wiring: pipeline reports FAIL-FAST abort (completedAllLayers=false)');
    assert(result.layersFailed.length > 0, 'wiring: pipeline reports at least one failed layer');
    assert(
      result.layersCompleted.includes('L1'),
      'wiring: L1 is recorded as completed (required for AO wiring to happen)',
    );
  } finally {
    // Restore singletons before any other test touches them.
    firstImpressionsService.analyze = origL1Analyze;
    structuralCartographerService.analyze = origL2Analyze;
    scoutPassService.analyze = origL25Analyze;
    console.error = origError;
    restoreClient();

    // Surface orchestrator abort log only if a test failed — helpful debugging.
    if (failed > 0 && errorLines.length > 0) {
      console.log('\n  [debug] orchestrator abort log:\n' + errorLines.join('\n').slice(0, 800));
    }
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startAll = Date.now();
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('ORCHESTRATOR RUNTIME — Integration Tests (D8-H1)');
  console.log('═══════════════════════════════════════════════════════════════════');

  try {
    await testAOHappyPath();
    await testAODegradedFallback();
    await testOrchestratorWiring();
  } catch (err) {
    console.error('\n[FATAL] Test harness crashed:', err instanceof Error ? err.stack : err);
    // Exit 77 only when we genuinely can't run — a harness crash qualifies.
    process.exit(77);
  }

  const totalMs = Date.now() - startAll;
  console.log('\n───────────────────────────────────────────────────────────────────');
  console.log(`Summary: ${passed} passed · ${failed} failed  (${totalMs}ms)`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('orchestrator-runtime.test.ts unhandled rejection:', err);
  process.exit(1);
});
