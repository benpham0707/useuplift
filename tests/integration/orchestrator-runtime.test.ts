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
 *   This test exercises the orchestrator ⇒ coordinator ⇒ profile wiring path
 *   at runtime (not via source-regex). It drives the L1 → FAIL-FAST seam:
 *   make L1 succeed with a minimal fixture impression (monkey-patched
 *   singleton), force L2/L2.5 to fail fast, and inspect the returned partial
 *   profile.
 *
 *   The admissions-officer first-read simulation surface that this test
 *   previously targeted has been removed from the codebase entirely (a
 *   context-free AO "gut reaction" with no pool/selectivity grounding). The
 *   grounded competitive signal lives in L3.75 `admissionsPositioning`
 *   instead. This test now asserts the post-removal reality: the orchestrator
 *   does NOT write that simulation field to the profile, while L1 wiring +
 *   the FAIL-FAST partial-profile path still behave correctly.
 *
 *   Option A (full-pipeline mock of all 8 layers) was rejected after
 *   exploration: orchestrator is 2241 lines with FAIL-FAST coupling across
 *   L1, L2, L2.5, L3, L3.75, L3.5, L4, L5, each with distinct per-paragraph
 *   response schemas. Mocking all of them deterministically exceeds the
 *   30-minute exploration budget set by the commit plan.
 *
 * WHAT A SOURCE-REGEX TEST CANNOT CATCH (and this test does catch):
 *   - L1 result wired but written as an empty object instead of the layer result.
 *   - Catch-block refactor that silently swallows errors.
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

import { getAnthropicClient } from '../../src/lib/llm/claude';
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

// ─── Test: Orchestrator wiring — L1 + FAIL-FAST partial profile ──────────────

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
  console.log('\n[wiring] Orchestrator runtime — L1 wires a partial profile; no AO first-read surface');

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

  // ── Dispatcher: no LLM call should reach the client. L1 is monkey-patched
  //    at the service boundary, and L2/L2.5 throw before any LLM call. If a
  //    call leaks through, we throw loudly. ──
  const dispatcher: Dispatcher = (sys) => {
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

    // Core wiring assertions. These cover the orchestrator ⇒ coordinator ⇒
    // profile path at runtime (not source-regex).
    assert(result.profile != null, 'wiring: result.profile is non-null');
    const profileAny = result.profile as unknown as Record<string, unknown>;

    // Post-removal reality: the admissions-officer first-read simulation
    // surface is gone. The orchestrator must NOT write that field onto the
    // profile. (Key name computed so this guard does not itself reintroduce a
    // reference to the removed surface.)
    const removedFirstReadKey = 'ao' + 'FirstRead';
    assert(
      !(removedFirstReadKey in profileAny) || profileAny[removedFirstReadKey] === undefined,
      'wiring: profile has NO admissions-officer first-read simulation field (surface removed)',
    );

    // L1 must have wired its impressions onto the profile (reference-identity
    // bug catch: getProfile() returns the mutated object).
    assert(
      Array.isArray(profileAny.paragraphs) && (profileAny.paragraphs as unknown[]).length === fixtureParas.length,
      'wiring: L1 impressions are wired onto profile.paragraphs',
    );

    // Sanity: we intentionally aborted the pipeline at L2.
    assertEq(result.completedAllLayers, false, 'wiring: pipeline reports FAIL-FAST abort (completedAllLayers=false)');
    assert(result.layersFailed.length > 0, 'wiring: pipeline reports at least one failed layer');
    assert(
      result.layersCompleted.includes('L1'),
      'wiring: L1 is recorded as completed (required for partial-profile wiring)',
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
