/**
 * Enhanced Workshop E2E Test
 *
 * Validates the full writing enhancement pipeline end-to-end with real
 * Claude API calls. Tests each layer independently, then the full orchestrator.
 *
 * Layers tested:
 *   1. preAnalyze()                    — deterministic snapshot (no LLM, ~200ms)
 *   2. planImprovements()              — Haiku LLM planning (~1-2s)
 *   3. checkRegressionStandalone()     — hybrid heuristic + Haiku judge (~1-2s)
 *   4. writingEnhancementOrchestrator  — full loop with re-planning + voice (~10-20s)
 *
 * Expected cost: ~$0.06-0.10 total (Haiku planning + judging + Sonnet edits)
 *
 * Run:
 *   ANTHROPIC_API_KEY="..." npx tsx tests/test-enhanced-workshop-e2e.ts
 */

import './utils/loadEnv';
import { requireApiKey } from './utils/loadEnv';
const _apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { preAnalyze } from '../src/services/enhancedWorkshop/preAnalyzer';
import { planImprovements } from '../src/services/enhancedWorkshop/improvementPlanner';
import { checkRegressionStandalone } from '../src/services/enhancedWorkshop/regressionGuard';
import { writingEnhancementOrchestrator } from '../src/services/enhancedWorkshop/writingEnhancementOrchestrator';
import type { EssaySnapshot, ImprovementPlan, EnhanceResult } from '../src/services/enhancedWorkshop/types';

// ============================================================================
// TEST ESSAY — Deliberately mid-quality with clear improvement potential
// ============================================================================

const TEST_ESSAY = `The summer before junior year, I decided to start a community garden in my neighborhood. I had always been interested in gardening and thought it would be a good way to bring people together. It was harder than I expected.

First, I had to find a vacant lot that the city would let us use. I spent weeks calling different offices and going to meetings. Eventually, the parks department gave us permission to use a small lot on Oak Street. It was covered in trash and weeds, but I was excited.

Getting volunteers was also challenging. I put up flyers and posted on social media, but only a few people showed up at first. I felt discouraged but kept going. My mom told me to be patient, and she was right. Over the next few weeks, more neighbors started coming. Some brought their kids, and others brought tools and seeds from their own gardens.

The garden taught me a lot about leadership and community. I learned that you can't force people to participate — you have to create something they want to be part of. I also learned about patience, because plants don't grow overnight and neither do communities. By the end of the summer, we had tomatoes, peppers, and sunflowers growing in what used to be an empty lot.

This experience made me who I am today. It showed me that one person can make a difference if they're willing to put in the work. I want to continue creating spaces where people can come together and grow, both literally and figuratively, in college and beyond.`;

// A slightly improved version for regression testing
const IMPROVED_ESSAY = `The morning I found Mrs. Chen kneeling in the dirt at 6 AM — her arthritic hands pressing tomato seedlings into soil that three months ago was a crack lot littered with broken glass — I understood what the garden had become. It was bigger than vegetables.

The summer before junior year, I claimed a vacant lot on Oak Street. Not "decided to start a community garden" — claimed it, the way you claim something nobody else wants. The lot was 40 by 60 feet of packed earth, fast-food wrappers, and one rusted shopping cart. I spent three weeks in municipal offices learning that "urban agriculture permits" require liability insurance, soil contamination testing, and a sponsor organization. I was seventeen. I had none of these.

Getting volunteers meant showing up alone, every Saturday, with a wheelbarrow. For three weeks nobody came. I weeded. I hauled. I talked to every person who walked by. Mrs. Chen was first — she missed the garden she'd left behind in Fujian Province. Then Marcus brought his two kids because "they need to see where food comes from." By July, we had fourteen regulars.

The garden taught me that leadership isn't announcement — it's presence. You can't recruit volunteers from behind a screen. You recruit them by being the person with dirt under your fingernails when they walk past. I learned this the hard way, after my carefully designed Instagram campaign attracted exactly zero people.

By August, we harvested 200 pounds of produce. Mrs. Chen grew bok choy varieties I'd never seen. Marcus's daughter won a school science fair project about soil pH. The lot on Oak Street became the place where I stopped trying to "make a difference" and started just making something real.`;

// ============================================================================
// LOGGING
// ============================================================================

let passed = 0;
let failed = 0;
let totalCost = 0;

function log(msg: string) {
  console.log(msg);
}

function divider(title: string) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(70)}\n`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${message}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n--- ${title} ---\n`);
}

// ============================================================================
// TEST 1: PRE-ANALYZE (deterministic, no LLM)
// ============================================================================

async function testPreAnalyze(): Promise<EssaySnapshot> {
  divider('TEST 1: preAnalyze() — Deterministic Essay Snapshot');
  const start = Date.now();

  const snapshot = await preAnalyze(TEST_ESSAY, 'common_app');
  const duration = Date.now() - start;

  log(`Duration: ${duration}ms`);
  log(`Word count: ${snapshot.wordCount}`);
  log(`EQI: ${snapshot.eqi.toFixed(1)}/100`);
  log(`Impression: ${snapshot.impressionLabel}`);
  log(`Weakest dimensions: ${snapshot.weakestDimensions.join(', ')}`);
  log(`Flags: ${snapshot.flags.length > 0 ? snapshot.flags.join(', ') : '(none)'}`);

  section('Dimension Scores');
  const sorted = Object.entries(snapshot.dimensionScores)
    .sort(([, a], [, b]) => a - b);
  for (const [dim, score] of sorted) {
    const bar = '█'.repeat(Math.round(score));
    log(`  ${dim.padEnd(40)} ${score.toFixed(1).padStart(5)} ${bar}`);
  }

  // Assertions
  section('Assertions');
  assert(snapshot.wordCount > 100, `Word count > 100 (got ${snapshot.wordCount})`);
  assert(snapshot.eqi > 0 && snapshot.eqi <= 100, `EQI in valid range 0-100 (got ${snapshot.eqi.toFixed(1)})`);
  assert(Object.keys(snapshot.dimensionScores).length >= 10, `Has 10+ dimension scores (got ${Object.keys(snapshot.dimensionScores).length})`);
  assert(snapshot.weakestDimensions.length > 0, 'Has at least 1 weak dimension');
  assert(snapshot.text === TEST_ESSAY, 'Snapshot preserves original text');
  assert(duration < 5000, `Completes under 5s (got ${duration}ms)`);
  assert(typeof snapshot.impressionLabel === 'string' && snapshot.impressionLabel.length > 0, 'Has impression label');

  return snapshot;
}

// ============================================================================
// TEST 2: PLAN IMPROVEMENTS (Haiku LLM)
// ============================================================================

async function testPlanImprovements(snapshot: EssaySnapshot): Promise<ImprovementPlan> {
  divider('TEST 2: planImprovements() — LLM-Powered Planning (Haiku)');
  const start = Date.now();

  const plan = await planImprovements(snapshot, {
    essayType: 'common_app',
    maxActions: 3,
  });
  const duration = Date.now() - start;

  log(`Duration: ${duration}ms`);
  log(`Actions planned: ${plan.actions.length}`);
  log(`Summary: ${plan.summary}`);

  section('Planned Actions');
  for (const action of plan.actions) {
    log(`  [${action.rank}] ${action.dimension}`);
    log(`      Command: ${action.command}`);
    log(`      Target: "${action.targetPassage.substring(0, 80)}${action.targetPassage.length > 80 ? '...' : ''}"`);
    log(`      Rationale: ${action.rationale}`);
    log(`      Expected gain: +${action.expectedGain.toFixed(1)} | Difficulty: ${action.difficulty}`);
    log('');
  }

  // Track cost from summary (parsed from "LLM cost: $X.XXXX")
  const costMatch = plan.summary.match(/LLM cost: \$([0-9.]+)/);
  if (costMatch) {
    const planCost = parseFloat(costMatch[1]);
    totalCost += planCost;
    log(`LLM Cost: $${planCost.toFixed(4)}`);
  }

  // Assertions
  section('Assertions');
  assert(plan.actions.length > 0, `At least 1 action planned (got ${plan.actions.length})`);
  assert(plan.actions.length <= 3, `At most 3 actions (maxActions=3, got ${plan.actions.length})`);

  for (const action of plan.actions) {
    const passageFound = TEST_ESSAY.includes(action.targetPassage);
    // Also check with whitespace normalization
    const normalizedFound = TEST_ESSAY.replace(/\s+/g, ' ').includes(
      action.targetPassage.replace(/\s+/g, ' ')
    );
    assert(
      passageFound || normalizedFound,
      `Action "${action.command}" targets passage found in essay`
    );
    assert(action.rationale.length > 10, `Action "${action.command}" has substantive rationale (${action.rationale.length} chars)`);
    assert(action.rank > 0, `Action has valid rank (${action.rank})`);
    assert(action.expectedGain > 0, `Action has positive expected gain (${action.expectedGain.toFixed(2)})`);
  }

  assert(plan.summary.length > 20, 'Plan has meaningful summary');
  assert(duration < 15000, `Completes under 15s (got ${duration}ms)`);

  return plan;
}

// ============================================================================
// TEST 3: REGRESSION GUARD — STANDALONE (hybrid heuristic + Haiku judge)
// ============================================================================

async function testRegressionGuard(): Promise<void> {
  divider('TEST 3: checkRegressionStandalone() — Hybrid Regression Guard');

  // 3a. Test with improved essay (should pass)
  section('3a: Improved essay (expect PASS)');
  const start3a = Date.now();

  const resultImproved = await checkRegressionStandalone(TEST_ESSAY, IMPROVED_ESSAY, 'common_app');
  const duration3a = Date.now() - start3a;

  log(`Duration: ${duration3a}ms`);
  log(`Verdict: ${resultImproved.passed ? 'PASSED' : 'REJECTED'}`);
  log(`EQI delta: ${resultImproved.eqiDelta > 0 ? '+' : ''}${resultImproved.eqiDelta.toFixed(1)}`);
  log(`Before EQI: ${resultImproved.before.eqi.toFixed(1)} | After EQI: ${resultImproved.after.eqi.toFixed(1)}`);
  log(`Improvements: ${resultImproved.improvements.length} | Regressions: ${resultImproved.regressions.length}`);

  section('LLM Judge Verdict');
  const j1 = resultImproved.llmJudgment;
  log(`  Verdict: ${j1.verdict} (confidence: ${j1.confidence.toFixed(2)})`);
  log(`  Explanation: ${j1.explanation}`);
  log(`  Voice consistent: ${j1.voiceConsistent}`);
  log(`  Specificity: ${j1.specificityChange}`);
  log(`  Authenticity: ${j1.authenticityChange}`);

  if (resultImproved.rejectionReason) {
    log(`  Rejection reason: ${resultImproved.rejectionReason}`);
  }

  section('Dimension Deltas');
  for (const [dim, delta] of Object.entries(resultImproved.dimensionDeltas).sort(([, a], [, b]) => b - a)) {
    const sign = delta > 0 ? '+' : '';
    const indicator = delta > 0.3 ? ' [UP]' : delta < -0.3 ? ' [DOWN]' : '';
    log(`  ${dim.padEnd(40)} ${sign}${delta.toFixed(1)}${indicator}`);
  }

  // Assertions for improved essay
  section('Assertions (improved essay)');
  assert(resultImproved.llmJudgment !== undefined, 'LLM judgment is present (not heuristic-only)');
  assert(
    ['improved', 'neutral', 'degraded'].includes(resultImproved.llmJudgment.verdict),
    `LLM verdict is valid (got "${resultImproved.llmJudgment.verdict}")`
  );
  assert(
    resultImproved.llmJudgment.confidence >= 0 && resultImproved.llmJudgment.confidence <= 1,
    `LLM confidence in range 0-1 (got ${resultImproved.llmJudgment.confidence})`
  );
  assert(resultImproved.llmJudgment.explanation.length > 10, 'LLM explanation is substantive');
  assert(typeof resultImproved.llmJudgment.voiceConsistent === 'boolean', 'Voice consistency is boolean');
  assert(
    ['increased', 'maintained', 'decreased'].includes(resultImproved.llmJudgment.specificityChange),
    `Specificity change is valid (got "${resultImproved.llmJudgment.specificityChange}")`
  );
  assert(resultImproved.eqiDelta !== undefined, 'EQI delta is present');
  assert(duration3a < 30000, `Completes under 30s (got ${duration3a}ms)`);

  // The improved essay has dramatically different voice from original (literary rewrite),
  // so the guard may correctly flag voice inconsistency. The key assertion is that
  // the LLM recognizes the content quality improved even if voice changed.
  assert(
    resultImproved.llmJudgment.specificityChange === 'increased',
    `LLM recognizes specificity increased (got "${resultImproved.llmJudgment.specificityChange}")`
  );

  // 3b. Test with degraded essay (should reject or flag)
  section('3b: Degraded essay (expect FAIL or neutral)');

  const DEGRADED_ESSAY = `I started a garden. It was good. I learned things about life and growing. The experience taught me valuable lessons about perseverance and community building. Through this transformative journey, I discovered my passion for bringing people together. This experience fundamentally changed who I am as a person and showed me the true meaning of leadership. I am now passionate about making a difference in my community and beyond.`;

  const start3b = Date.now();
  const resultDegraded = await checkRegressionStandalone(TEST_ESSAY, DEGRADED_ESSAY, 'common_app');
  const duration3b = Date.now() - start3b;

  log(`Duration: ${duration3b}ms`);
  log(`Verdict: ${resultDegraded.passed ? 'PASSED' : 'REJECTED'}`);
  log(`EQI delta: ${resultDegraded.eqiDelta > 0 ? '+' : ''}${resultDegraded.eqiDelta.toFixed(1)}`);
  log(`LLM verdict: ${resultDegraded.llmJudgment.verdict} (confidence: ${resultDegraded.llmJudgment.confidence.toFixed(2)})`);
  log(`Explanation: ${resultDegraded.llmJudgment.explanation}`);
  if (resultDegraded.rejectionReason) {
    log(`Rejection: ${resultDegraded.rejectionReason}`);
  }

  section('Assertions (degraded essay)');
  assert(resultDegraded.llmJudgment !== undefined, 'LLM judgment present for degraded check');
  assert(
    resultDegraded.llmJudgment.verdict === 'degraded',
    `LLM detects degradation (got "${resultDegraded.llmJudgment.verdict}")`
  );
  assert(!resultDegraded.passed, 'Guard rejects the degraded edit');
}

// ============================================================================
// TEST 4: FULL ORCHESTRATOR (end-to-end enhancement loop)
// ============================================================================

async function testFullOrchestrator(): Promise<void> {
  divider('TEST 4: writingEnhancementOrchestrator.enhance() — Full E2E Loop');

  const start = Date.now();

  const result: EnhanceResult = await writingEnhancementOrchestrator.enhance({
    text: TEST_ESSAY,
    essayType: 'common_app',
    maxSteps: 2, // Keep cost reasonable for testing
  });

  const duration = Date.now() - start;
  totalCost += result.totalCost;

  log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  log(`Total cost: $${result.totalCost.toFixed(4)}`);
  log(`EQI gain: ${result.eqiGain > 0 ? '+' : ''}${result.eqiGain.toFixed(1)}`);
  log(`Before EQI: ${result.before.eqi.toFixed(1)} | After EQI: ${result.after.eqi.toFixed(1)}`);
  log(`Steps completed: ${result.steps.length} | Rejected: ${result.rejectedSteps.length}`);

  // Show before/after dimension comparison
  section('Dimension Score Changes');
  const allDims = new Set([
    ...Object.keys(result.before.dimensionScores),
    ...Object.keys(result.after.dimensionScores),
  ]);
  for (const dim of [...allDims].sort()) {
    const before = result.before.dimensionScores[dim] ?? 0;
    const after = result.after.dimensionScores[dim] ?? 0;
    const delta = after - before;
    const sign = delta > 0 ? '+' : '';
    const indicator = delta > 0.3 ? ' [UP]' : delta < -0.3 ? ' [DOWN]' : '';
    log(`  ${dim.padEnd(40)} ${before.toFixed(1)} -> ${after.toFixed(1)} (${sign}${delta.toFixed(1)})${indicator}`);
  }

  // Show each completed step
  section('Completed Enhancement Steps');
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    log(`  Step ${i + 1}: ${step.action.dimension} / ${step.action.command}`);
    log(`    Target: "${step.action.targetPassage.substring(0, 60)}..."`);
    log(`    Passed guard: ${step.passed}`);
    log(`    LLM verdict: ${step.regressionCheck.llmJudgment.verdict} (conf: ${step.regressionCheck.llmJudgment.confidence.toFixed(2)})`);
    log(`    Cost: $${step.cost.toFixed(4)}`);
    if (step.teachingNote) {
      log(`    Teaching: ${step.teachingNote.substring(0, 100)}${step.teachingNote.length > 100 ? '...' : ''}`);
    }
    log('');
  }

  // Show rejected steps
  if (result.rejectedSteps.length > 0) {
    section('Rejected Steps');
    for (let i = 0; i < result.rejectedSteps.length; i++) {
      const step = result.rejectedSteps[i];
      log(`  Rejected ${i + 1}: ${step.action.dimension} / ${step.action.command}`);
      log(`    Reason: ${step.regressionCheck.rejectionReason ?? 'unknown'}`);
      log('');
    }
  }

  // Show text diff summary
  section('Text Changes');
  const originalWords = result.originalText.split(/\s+/).length;
  const improvedWords = result.improvedText.split(/\s+/).length;
  log(`  Original: ${originalWords} words`);
  log(`  Improved: ${improvedWords} words (${improvedWords > originalWords ? '+' : ''}${improvedWords - originalWords})`);
  const textChanged = result.originalText !== result.improvedText;
  log(`  Text changed: ${textChanged}`);

  if (textChanged) {
    log('\n  [First 300 chars of improved text]');
    log(`  ${result.improvedText.substring(0, 300)}...`);
  }

  // Assertions
  section('Assertions');
  assert(result.originalText === TEST_ESSAY, 'Original text preserved');
  assert(typeof result.improvedText === 'string' && result.improvedText.length > 0, 'Improved text is non-empty');
  assert(result.before.eqi > 0, `Before EQI is valid (${result.before.eqi.toFixed(1)})`);
  assert(result.after.eqi > 0, `After EQI is valid (${result.after.eqi.toFixed(1)})`);
  assert(typeof result.eqiGain === 'number', 'EQI gain is a number');
  assert(result.totalCost > 0, `Total cost tracked (${result.totalCost.toFixed(4)})`);
  assert(result.totalTimeMs > 0, `Total time tracked (${result.totalTimeMs}ms)`);
  assert(Array.isArray(result.steps), 'Steps is an array');
  assert(Array.isArray(result.rejectedSteps), 'Rejected steps is an array');

  // Each completed step should have LLM judgment (no fake/synthetic judgments)
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    assert(step.passed === true, `Step ${i + 1} passed guard`);
    assert(
      step.regressionCheck.llmJudgment !== undefined,
      `Step ${i + 1} has real LLM judgment (not heuristic-only)`
    );
    assert(
      ['improved', 'neutral', 'degraded'].includes(step.regressionCheck.llmJudgment.verdict),
      `Step ${i + 1} LLM verdict is valid`
    );
    assert(
      step.regressionCheck.llmJudgment.explanation.length > 5,
      `Step ${i + 1} has substantive LLM explanation`
    );
    assert(step.action.targetPassage.length > 0, `Step ${i + 1} has target passage`);
    assert(step.action.rationale.length > 0, `Step ${i + 1} has rationale`);
  }

  // If any steps completed, text should have changed
  if (result.steps.length > 0) {
    assert(textChanged, 'Text changed when steps were accepted');
  }
}

// ============================================================================
// RUNNER
// ============================================================================

async function main(): Promise<void> {
  divider('ENHANCED WORKSHOP E2E TEST');
  log(`Testing: preAnalyze → planImprovements → regressionGuard → full orchestrator`);
  log(`Essay: ${TEST_ESSAY.substring(0, 80)}...`);
  log(`Essay word count: ${TEST_ESSAY.split(/\s+/).length}`);

  const overallStart = Date.now();

  try {
    // Test 1: Pre-analyze (deterministic, fast)
    const snapshot = await testPreAnalyze();

    // Test 2: Plan improvements (Haiku LLM)
    await testPlanImprovements(snapshot);

    // Test 3: Regression guard (Haiku LLM + heuristic hybrid)
    await testRegressionGuard();

    // Test 4: Full orchestrator (the real E2E)
    await testFullOrchestrator();

  } catch (error) {
    console.error('\n[FATAL ERROR]', error);
    failed++;
  }

  const totalDuration = Date.now() - overallStart;

  divider('RESULTS');
  log(`Passed: ${passed}`);
  log(`Failed: ${failed}`);
  log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  log(`Total LLM cost: $${totalCost.toFixed(4)}`);

  if (failed > 0) {
    log(`\n[${failed} FAILURE(S)] — see above for details`);
    process.exit(1);
  } else {
    log(`\n[ALL ${passed} TESTS PASSED]`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
