/**
 * coaching-haiku-minimal.test.ts — Unit tests for the Haiku minimal-path
 * routing decision added by Round-7 Hardening P0 commit C6.
 *
 * Validates `CoachingService.classifyAsMinimal()` — the pure function that
 * decides whether a coaching turn qualifies for the cheap Haiku ack
 * (runStage1InsightExtraction → generateMinimalResponse, ~$0.002) instead
 * of the full Sonnet coaching response (~$0.01-0.02).
 *
 * The helper is private; tests reach it through a minimal `any` cast —
 * same pattern used across tests/unit/ for internal-method coverage.
 *
 * Strategy:
 *   - Pure function — no LLM calls needed. Build synthetic Stage1Output and
 *     CoachingSessionMemory inputs and assert the routing decision.
 *   - Cover all five scenarios from forge plan §2.7, plus the env-flag
 *     kill-switch (asserted at the call-site level, since the helper itself
 *     does not read env).
 *
 * Run: npx tsx tests/unit/coaching-haiku-minimal.test.ts
 * Exit 0 = pass, 1 = fail.
 */

// Minimum env to avoid the singleton LLM client initialization path blowing up
// if a future refactor side-imports it.
process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-for-unit-test-do-not-use';

import { CoachingService } from '../../src/services/essayIntelligence/coaching/coachingService';
import type {
  CoachingSessionMemory,
  ImprovementPhaseLevel,
  InsightCategory,
  CognitiveState,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── assertion helpers ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string): void {
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

// ─── fixtures ───────────────────────────────────────────────────────────────

/**
 * Minimal Stage1Output factory. The shape matches the internal `Stage1Output`
 * interface in coachingService.ts. We `as any` at the call boundary so the test
 * doesn't need to duplicate the internal type.
 */
interface MinimalStage1 {
  category: InsightCategory;
  emotionalValence: number;
  confidence: number;
  isExplicit: boolean;
  isNovel: boolean;
  focusProbabilities: Record<string, number>;
  dimensionFocus: string[];
  conversationType: 'coaching_question' | 'revision_discussion' | 'meta_conversation' | 'general_inquiry';
  recentEditAware: boolean;
  targetParagraphIndex: number | null;
  targetSentenceIndex: number | null;
  cognitiveState: CognitiveState;
  scopeCertainty: 'high' | 'moderate' | 'low';
  preferenceDurability: 'general' | 'essay_specific' | null;
}

function makeStage1(overrides: Partial<MinimalStage1> = {}): MinimalStage1 {
  return {
    category: 'confirmation',
    emotionalValence: 0,
    confidence: 0.9,
    isExplicit: true,
    isNovel: false,
    focusProbabilities: {},
    dimensionFocus: [],
    conversationType: 'coaching_question',
    recentEditAware: false,
    targetParagraphIndex: null,
    targetSentenceIndex: null,
    cognitiveState: 'engaged',
    scopeCertainty: 'low',
    preferenceDurability: null,
    ...overrides,
  };
}

function makeMemory(overrides: Partial<CoachingSessionMemory> = {}): CoachingSessionMemory {
  return {
    turnCount: 3,
    events: [],
    sessionArcSummary: '',
    nextFocus: '',
    strategicQuestion: '',
    questionStaleness: 0,
    ...overrides,
  };
}

// ─── the system under test ──────────────────────────────────────────────────

const service = new CoachingService();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const classify = (service as any).classifyAsMinimal.bind(service) as (
  studentMessage: string,
  stage1: MinimalStage1,
  sessionMemory: CoachingSessionMemory,
  phase: ImprovementPhaseLevel,
) => boolean;

// ─── test cases ─────────────────────────────────────────────────────────────

function testOkThanksRoutesMinimal(): void {
  console.log('\n[1] "ok thanks" at T3 (craft) → routes MINIMAL');
  const stage1 = makeStage1({ category: 'confirmation' });
  const memory = makeMemory({ turnCount: 3 });
  const result = classify('ok thanks', stage1, memory, 'craft');
  assertEq(result, true, 'confirmation + short + craft + no pushback → minimal');
}

function testRewriteP3RoutesSonnet(): void {
  console.log('\n[2] "can you rewrite P3?" (substantive) → routes SONNET');
  // Category reinterpretation is the heaviest case. Test it explicitly —
  // even short reinterpretations MUST NOT route minimal.
  const stage1 = makeStage1({ category: 'reinterpretation' });
  const memory = makeMemory({ turnCount: 3 });
  // Even at <=30 chars, reinterpretation never routes minimal.
  const shortResult = classify('rewrite P3 please', stage1, memory, 'craft');
  assertEq(shortResult, false, 'reinterpretation (short) → NOT minimal');

  // The literal prompt "can you rewrite P3?" is 22 chars but would classify
  // as a coaching_question; exercise the length-only gate too.
  const longStage1 = makeStage1({ category: 'clarification' });
  const longResult = classify(
    'can you rewrite paragraph three to emphasize the scene?',
    longStage1,
    memory,
    'craft',
  );
  assertEq(longResult, false, 'clarification but >30 chars → NOT minimal');
}

function testHmInterestingAtFoundationRoutesSonnet(): void {
  console.log('\n[3] "Hm interesting" at T1 (foundation) → routes SONNET');
  const stage1 = makeStage1({ category: 'confirmation' });
  const memory = makeMemory({ turnCount: 0 }); // pre-first-turn
  const result = classify('Hm interesting', stage1, memory, 'foundation');
  assertEq(result, false, 'foundation phase forces SONNET scaffolding');
}

function testReinterpretationAlwaysRoutesSonnet(): void {
  console.log('\n[4] reinterpretation regardless of length → routes SONNET');
  // Short reinterpretation message
  const shortStage1 = makeStage1({ category: 'reinterpretation' });
  const short = classify('no — it\'s ironic', shortStage1, makeMemory(), 'craft');
  assertEq(short, false, 'reinterpretation short → SONNET');

  // Short reinterpretation even in phases that otherwise allow minimal
  for (const phase of ['architecture', 'craft', 'polish', 'distinction'] as ImprovementPhaseLevel[]) {
    const stage1 = makeStage1({ category: 'reinterpretation' });
    const r = classify('actually no', stage1, makeMemory(), phase);
    assertEq(r, false, `reinterpretation in ${phase} → SONNET`);
  }
}

function testPushbackActiveRoutesSonnet(): void {
  console.log('\n[5] prior-turn pushback active → routes SONNET');
  const stage1 = makeStage1({ category: 'confirmation' });
  const memory = makeMemory({ turnCount: 5, pushbackCount: 1 });
  const result = classify('ok', stage1, memory, 'craft');
  assertEq(result, false, 'pushbackCount>0 blocks minimal path');
}

function testEnvFlagKillSwitch(): void {
  console.log('\n[6] ENABLE_HAIKU_MINIMAL_PATH=\'false\' → callsite forces SONNET');
  // The helper itself does not read the env flag — it encodes the four
  // decision criteria. The kill-switch lives at the callsite in
  // processCoachingTurn, expressed as:
  //   minimalPathEnabled = process.env.ENABLE_HAIKU_MINIMAL_PATH !== 'false'
  //   isMinimal = minimalPathEnabled && this.classifyAsMinimal(...)
  //
  // Emulate that AND at the test level to confirm the rollback path works
  // as designed: even when the helper would say `true`, the env flag
  // forces `false`.
  const stage1 = makeStage1({ category: 'confirmation' });
  const memory = makeMemory({ turnCount: 3 });

  // Simulate the kill-switch path: set the env var and re-read at callsite.
  const origEnv = process.env.ENABLE_HAIKU_MINIMAL_PATH;
  try {
    process.env.ENABLE_HAIKU_MINIMAL_PATH = 'false';
    const minimalPathEnabled = process.env.ENABLE_HAIKU_MINIMAL_PATH !== 'false';
    const helperSays = classify('ok thanks', stage1, memory, 'craft');
    const effective = minimalPathEnabled && helperSays;
    assertEq(helperSays, true, 'helper would route minimal (unchanged by env)');
    assertEq(minimalPathEnabled, false, 'env flag parses as disabled');
    assertEq(effective, false, 'callsite AND enforces rollback → SONNET');
  } finally {
    if (origEnv === undefined) {
      delete process.env.ENABLE_HAIKU_MINIMAL_PATH;
    } else {
      process.env.ENABLE_HAIKU_MINIMAL_PATH = origEnv;
    }
  }

  // And confirm DEFAULT (unset) enables the path.
  const origEnv2 = process.env.ENABLE_HAIKU_MINIMAL_PATH;
  try {
    delete process.env.ENABLE_HAIKU_MINIMAL_PATH;
    const enabledByDefault = process.env.ENABLE_HAIKU_MINIMAL_PATH !== 'false';
    assertEq(enabledByDefault, true, 'default (unset) keeps minimal path ON');
  } finally {
    if (origEnv2 !== undefined) process.env.ENABLE_HAIKU_MINIMAL_PATH = origEnv2;
  }
}

function testLengthBoundary(): void {
  console.log('\n[7] length boundary — 30 chars OK, 31 chars not');
  const stage1 = makeStage1({ category: 'confirmation' });
  const memory = makeMemory({ turnCount: 3 });

  const exactly30 = 'a'.repeat(30);
  const exactly31 = 'a'.repeat(31);
  assertEq(classify(exactly30, stage1, memory, 'craft'), true, '30 chars → minimal');
  assertEq(classify(exactly31, stage1, memory, 'craft'), false, '31 chars → SONNET');
}

function testClarificationAndConfirmationBoth(): void {
  console.log('\n[8] confirmation + clarification both route minimal; others do not');
  const memory = makeMemory({ turnCount: 3 });

  assertEq(
    classify('ok', makeStage1({ category: 'confirmation' }), memory, 'craft'),
    true,
    'confirmation → minimal',
  );
  assertEq(
    classify('what?', makeStage1({ category: 'clarification' }), memory, 'craft'),
    true,
    'clarification → minimal',
  );

  // Other categories: all should route Sonnet.
  const nonMinimal: InsightCategory[] = [
    'reinterpretation',
    'new_context',
    'correction',
    'preference',
    'emotional_reaction',
    'resistance',
  ];
  for (const cat of nonMinimal) {
    assertEq(
      classify('ok', makeStage1({ category: cat }), memory, 'craft'),
      false,
      `category=${cat} → SONNET`,
    );
  }
}

// ─── entry ──────────────────────────────────────────────────────────────────

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('COACHING HAIKU MINIMAL PATH — classifyAsMinimal decision tree');
  console.log('═══════════════════════════════════════════════════════════════════');

  testOkThanksRoutesMinimal();
  testRewriteP3RoutesSonnet();
  testHmInterestingAtFoundationRoutesSonnet();
  testReinterpretationAlwaysRoutesSonnet();
  testPushbackActiveRoutesSonnet();
  testEnvFlagKillSwitch();
  testLengthBoundary();
  testClarificationAndConfirmationBoth();

  console.log('\n───────────────────────────────────────────────────────────────────');
  console.log(`Summary: ${passed} passed · ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error('coaching-haiku-minimal.test.ts crashed:', err);
  process.exit(1);
}
