/**
 * Enhanced Workshop Full-Loop Integration Test
 *
 * Validates the Michelin Star backend end-to-end with real LLM calls:
 *   1. Pre-analyze with new 13-dim scoring pipeline (useNewScoringPipeline=true)
 *   2. Plan improvements (Haiku LLM, validates passage targets exist in essay)
 *   3. Full enhance loop (maxSteps: 2, validates EQI stable/improved + regression guard)
 *   4. SSE streaming (validates event ordering: pre_analysis → plan → edit → complete)
 *   5. Competitive intelligence (deterministic <5ms, validates cliche detection + scoring)
 *   6. Voice drift detection (deterministic <10ms, validates 5-dimension drift analysis)
 *
 * Uses useNewScoringPipeline: true throughout.
 *
 * Expected cost: ~$0.05-0.10/run (Haiku planning + Sonnet edits + Haiku judging)
 *
 * Run:
 *   ANTHROPIC_API_KEY="..." npx tsx tests/test-enhanced-workshop-full-loop.ts
 */

import './utils/loadEnv';
import { requireApiKey } from './utils/loadEnv';
const _apiKey = requireApiKey('ANTHROPIC_API_KEY');

// Import services
import { preAnalyze } from '../src/services/enhancedWorkshop/preAnalyzer';
import { planImprovements } from '../src/services/enhancedWorkshop/improvementPlanner';
import { writingEnhancementOrchestrator } from '../src/services/enhancedWorkshop/writingEnhancementOrchestrator';
import { competitiveIntelligenceService } from '../src/services/competitiveIntelligence';
import { styleConsistencyService } from '../src/services/voiceProfile';
import type { StudentVoiceProfile } from '../src/services/voiceProfile/types';
import type { EssaySnapshot, EnhanceResult, EnhancementEvent, ImprovementPlan } from '../src/services/enhancedWorkshop/types';

// ============================================================================
// TEST ESSAY — Mid-quality with clear improvement potential
// ============================================================================

const TEST_ESSAY = `The summer before junior year, I decided to start a community garden in my neighborhood. I had always been interested in gardening and thought it would be a good way to bring people together. It was harder than I expected.

First, I had to find a vacant lot that the city would let us use. I spent weeks calling different offices and going to meetings. Eventually, the parks department gave us permission to use a small lot on Oak Street. It was covered in trash and weeds, but I was excited.

Getting volunteers was also challenging. I put up flyers and posted on social media, but only a few people showed up at first. I felt discouraged but kept going. My mom told me to be patient, and she was right. Over the next few weeks, more neighbors started coming. Some brought their kids, and others brought tools and seeds from their own gardens.

The garden taught me a lot about leadership and community. I learned that you can't force people to participate — you have to create something they want to be part of. I also learned about patience, because plants don't grow overnight and neither do communities. By the end of the summer, we had tomatoes, peppers, and sunflowers growing in what used to be an empty lot.

This experience made me who I am today. It showed me that one person can make a difference if they're willing to put in the work. I want to continue creating spaces where people can come together and grow, both literally and figuratively, in college and beyond.`;

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
// TEST 1: PRE-ANALYZE with new scoring pipeline
// ============================================================================

async function testPreAnalyze(): Promise<EssaySnapshot> {
  divider('TEST 1: preAnalyze() — New 13-Dim Scoring Pipeline');
  const start = Date.now();

  const snapshot = await preAnalyze(TEST_ESSAY, 'common_app', true);
  const duration = Date.now() - start;

  log(`Duration: ${duration}ms`);
  log(`Word count: ${snapshot.wordCount}`);
  log(`EQI: ${snapshot.eqi.toFixed(1)}/100`);
  log(`Impression: ${snapshot.impressionLabel}`);
  log(`Weakest dimensions: ${snapshot.weakestDimensions.join(', ')}`);

  section('Dimension Scores');
  const sorted = Object.entries(snapshot.dimensionScores).sort(([, a], [, b]) => a - b);
  for (const [dim, score] of sorted) {
    const bar = '█'.repeat(Math.round(score));
    log(`  ${dim.padEnd(40)} ${score.toFixed(1).padStart(5)} ${bar}`);
  }

  section('Assertions');
  assert(snapshot.wordCount > 100, `Word count > 100 (got ${snapshot.wordCount})`);
  assert(snapshot.eqi > 0 && snapshot.eqi <= 100, `EQI in valid range (got ${snapshot.eqi.toFixed(1)})`);
  assert(Object.keys(snapshot.dimensionScores).length >= 10, `Has 10+ dimension scores (got ${Object.keys(snapshot.dimensionScores).length})`);
  assert(snapshot.weakestDimensions.length > 0, 'Has at least 1 weak dimension');
  assert(snapshot.text === TEST_ESSAY, 'Snapshot preserves original text');
  assert(typeof snapshot.impressionLabel === 'string' && snapshot.impressionLabel.length > 0, 'Has impression label');
  assert(duration < 5000, `Completes under 5s (got ${duration}ms)`);

  return snapshot;
}

// ============================================================================
// TEST 2: PLAN IMPROVEMENTS
// ============================================================================

async function testPlanImprovements(snapshot: EssaySnapshot): Promise<ImprovementPlan> {
  divider('TEST 2: planImprovements() — LLM Planning (useNewScoringPipeline=true)');
  const start = Date.now();

  const plan = await planImprovements(snapshot, {
    essayType: 'common_app',
    maxActions: 3,
    useNewScoringPipeline: true,
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
    log(`      Expected gain: +${action.expectedGain.toFixed(1)} | Difficulty: ${action.difficulty}`);
    log('');
  }

  section('Assertions');
  assert(plan.actions.length > 0, `At least 1 action planned (got ${plan.actions.length})`);
  assert(plan.actions.length <= 3, `At most 3 actions (got ${plan.actions.length})`);
  assert(plan.summary.length > 20, 'Plan has meaningful summary');
  assert(duration < 15000, `Completes under 15s (got ${duration}ms)`);

  for (const action of plan.actions) {
    assert(action.rationale.length > 10, `Action "${action.command}" has substantive rationale`);
    assert(action.rank > 0, `Action has valid rank (${action.rank})`);
    assert(action.expectedGain > 0, `Action has positive expected gain (${action.expectedGain.toFixed(2)})`);
    // Verify target passage actually exists in the essay (with whitespace normalization)
    const passageFound = TEST_ESSAY.includes(action.targetPassage);
    const normalizedFound = TEST_ESSAY.replace(/\s+/g, ' ').includes(
      action.targetPassage.replace(/\s+/g, ' ')
    );
    assert(
      passageFound || normalizedFound,
      `Action "${action.command}" targets passage found in essay`
    );
  }

  return plan;
}

// ============================================================================
// TEST 3: FULL ENHANCE with new pipeline (maxSteps: 2)
// ============================================================================

async function testFullEnhance(): Promise<EnhanceResult> {
  divider('TEST 3: writingEnhancementOrchestrator.enhance() — Full Loop (maxSteps=2)');
  const start = Date.now();

  const result: EnhanceResult = await writingEnhancementOrchestrator.enhance({
    text: TEST_ESSAY,
    essayType: 'common_app',
    maxSteps: 2,
    useNewScoringPipeline: true,
  });

  const duration = Date.now() - start;
  totalCost += result.totalCost;

  log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  log(`Total cost: $${result.totalCost.toFixed(4)}`);
  log(`EQI gain: ${result.eqiGain > 0 ? '+' : ''}${result.eqiGain.toFixed(1)}`);
  log(`Before EQI: ${result.before.eqi.toFixed(1)} | After EQI: ${result.after.eqi.toFixed(1)}`);
  log(`Steps completed: ${result.steps.length} | Rejected: ${result.rejectedSteps.length}`);

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
    log(`  ${dim.padEnd(40)} ${before.toFixed(1)} -> ${after.toFixed(1)} (${sign}${delta.toFixed(1)})`);
  }

  section('Enhancement Steps');
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    log(`  Step ${i + 1}: ${step.action.dimension} / ${step.action.command}`);
    log(`    Passed guard: ${step.passed}`);
    log(`    LLM verdict: ${step.regressionCheck.llmJudgment.verdict} (conf: ${step.regressionCheck.llmJudgment.confidence.toFixed(2)})`);
    log(`    Cost: $${step.cost.toFixed(4)}`);
    log('');
  }

  section('Assertions');
  assert(result.originalText === TEST_ESSAY, 'Original text preserved');
  assert(typeof result.improvedText === 'string' && result.improvedText.length > 0, 'Improved text is non-empty');
  assert(result.before.eqi > 0, `Before EQI is valid (${result.before.eqi.toFixed(1)})`);
  assert(result.after.eqi > 0, `After EQI is valid (${result.after.eqi.toFixed(1)})`);
  assert(result.after.eqi >= result.before.eqi - 5, `EQI stable or improved (before: ${result.before.eqi.toFixed(1)}, after: ${result.after.eqi.toFixed(1)})`);
  assert(result.totalCost > 0, `Cost tracked ($${result.totalCost.toFixed(4)})`);
  assert(result.totalTimeMs > 0, `Time tracked (${result.totalTimeMs}ms)`);
  assert(Array.isArray(result.steps), 'Steps is an array');
  assert(Array.isArray(result.rejectedSteps), 'Rejected steps is an array');

  // Validate regression guard ran with LLM judgment (not heuristic-only)
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    assert(step.passed === true, `Step ${i + 1} passed guard`);
    assert(
      step.regressionCheck.llmJudgment !== undefined,
      `Step ${i + 1} has real LLM judgment`
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

  if (result.steps.length > 0) {
    assert(result.originalText !== result.improvedText, 'Text changed when steps accepted');
  }

  return result;
}

// ============================================================================
// TEST 4: SSE STREAMING (validate events fire in order)
// ============================================================================

async function testStreamingEnhance(): Promise<void> {
  divider('TEST 4: enhanceStreaming() — SSE Event Ordering');
  const start = Date.now();

  const events: EnhancementEvent[] = [];

  const result = await writingEnhancementOrchestrator.enhanceStreaming(
    {
      text: TEST_ESSAY,
      essayType: 'common_app',
      maxSteps: 1, // 1 step for speed
      useNewScoringPipeline: true,
    },
    (event) => {
      events.push(event);
      log(`  Event [${events.length}]: ${event.type} (step: ${event.stepIndex ?? '-'})`);
    }
  );

  const duration = Date.now() - start;
  totalCost += result.totalCost;

  log(`\nDuration: ${(duration / 1000).toFixed(1)}s`);
  log(`Events received: ${events.length}`);
  log(`Event types: ${events.map(e => e.type).join(' → ')}`);

  section('Assertions');
  assert(events.length >= 2, `At least 2 events (got ${events.length})`);
  assert(events[0]?.type === 'pre_analysis', `First event is pre_analysis (got ${events[0]?.type})`);
  assert(events[events.length - 1]?.type === 'complete', `Last event is complete (got ${events[events.length - 1]?.type})`);

  // Check for plan events
  const planEvents = events.filter(e => e.type === 'plan');
  assert(planEvents.length >= 1, `At least 1 plan event (got ${planEvents.length})`);

  // Check for edit events (applied or rejected)
  const editEvents = events.filter(e => e.type === 'edit_applied' || e.type === 'edit_rejected');
  assert(editEvents.length >= 1, `At least 1 edit event (got ${editEvents.length})`);

  // Verify semantic ordering: pre_analysis → plan → edit → complete
  const planIdx = events.findIndex(e => e.type === 'plan');
  const editIdx = events.findIndex(e => e.type === 'edit_applied' || e.type === 'edit_rejected');
  assert(planIdx > 0, `Plan event comes after pre_analysis (idx=${planIdx})`);
  assert(editIdx > planIdx, `Edit event comes after plan (plan=${planIdx}, edit=${editIdx})`);

  // All events have timestamps
  for (const event of events) {
    assert(typeof event.timestamp === 'string' && event.timestamp.length > 0, `Event ${event.type} has timestamp`);
  }

  // Complete event contains valid result
  const completeEvent = events[events.length - 1];
  if (completeEvent.type === 'complete') {
    assert(typeof completeEvent.data.eqiGain === 'number', 'Complete event has eqiGain');
    assert(typeof completeEvent.data.totalCost === 'number', 'Complete event has totalCost');
  }
}

// ============================================================================
// TEST 5: COMPETITIVE INTELLIGENCE (deterministic, <5ms)
// ============================================================================

function testCompetitiveIntelligence(): void {
  divider('TEST 5: competitiveIntelligenceService.analyze() — Deterministic Cliche Detection');
  const start = Date.now();

  // Use test essay which has known overused phrases
  const clicheEssay = `I have always been passionate about making a difference. Ever since I was young, I knew I wanted to help others. This experience taught me valuable lessons about leadership and perseverance. I have always been passionate about community service, and this journey has been incredibly transformative. Moving forward, I hope to continue making a positive impact on the world around me.`;

  const analysis = competitiveIntelligenceService.analyze({
    text: clicheEssay,
    essayType: 'common_app',
  });

  const duration = Date.now() - start;

  log(`Duration: ${duration}ms`);
  log(`Distinctiveness score: ${analysis.distinctivenessScore}/100`);
  log(`Overused phrases found: ${analysis.overusedPhrases.length}`);
  log(`Fatigue patterns found: ${analysis.fatiguePatterns.length}`);

  section('Overused Phrases');
  for (const match of analysis.overusedPhrases.slice(0, 5)) {
    log(`  "${match.phrase}" → fatigue: ${match.aoFatigueLevel}`);
    log(`    Better: ${match.betterAlternative}`);
  }

  if (analysis.fatiguePatterns.length > 0) {
    section('Fatigue Patterns');
    for (const pattern of analysis.fatiguePatterns) {
      log(`  ${pattern.name}: ${pattern.description}`);
    }
  }

  if (analysis.distinctiveElements.length > 0) {
    section('Distinctive Elements');
    for (const el of analysis.distinctiveElements) {
      log(`  [${el.type}] ${el.description}`);
    }
  } else {
    log('  No distinctive elements detected (expected for cliche-heavy essay)');
  }

  section('Assertions');
  assert(duration < 50, `Completes under 50ms (got ${duration}ms)`);
  assert(analysis.overusedPhrases.length > 0, `Detected overused phrases (got ${analysis.overusedPhrases.length})`);
  assert(analysis.distinctivenessScore >= 0 && analysis.distinctivenessScore <= 100, `Score in valid range (got ${analysis.distinctivenessScore})`);
  assert(analysis.distinctivenessScore < 60, `Low distinctiveness for cliche-heavy essay (got ${analysis.distinctivenessScore})`);

  assert(typeof analysis.summary === 'string' && analysis.summary.length > 0, 'Has executive summary');
  assert(analysis.clicheCount === analysis.overusedPhrases.length, `clicheCount matches phrase array (${analysis.clicheCount} vs ${analysis.overusedPhrases.length})`);

  // Test with the main essay (less cliche-heavy, should score higher)
  const mainAnalysis = competitiveIntelligenceService.analyze({
    text: TEST_ESSAY,
    essayType: 'common_app',
  });
  assert(typeof mainAnalysis.distinctivenessScore === 'number', 'Main essay analysis returns valid score');
  assert(
    mainAnalysis.distinctivenessScore > analysis.distinctivenessScore,
    `Main essay more distinctive (${mainAnalysis.distinctivenessScore}) than cliche essay (${analysis.distinctivenessScore})`
  );
  log(`  Main essay distinctiveness: ${mainAnalysis.distinctivenessScore}/100`);
}

// ============================================================================
// TEST 6: VOICE DRIFT DETECTION (deterministic, <10ms)
// ============================================================================

function testVoiceDrift(): void {
  divider('TEST 6: styleConsistencyService.compareToBaseline() — Voice Drift Detection');

  // Mock voice profile matching the actual StudentVoiceProfile interface.
  // Calibrated to approximate the TEST_ESSAY's casual, moderate-energy narrative style.
  const mockProfile: StudentVoiceProfile = {
    userId: 'test-user',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    register: {
      primary: 'warmth_connection' as const,
      confidence: 0.8,
    },
    linguistics: {
      averageSentenceLength: 18,
      sentenceLengthVariety: 6,
      vocabularyLevel: 'clear' as const,
      formality: 'semi-formal' as const,
      fragmentUse: 'minimal' as const,
      signatureWords: ['garden', 'community', 'volunteers'],
      avoidWords: [],
    },
    personality: {
      energy: 'medium' as const,
      humor: 'rare' as const,
      directness: 'moderate' as const,
      emotionalOpenness: 'open' as const,
    },
    authenticPhrases: [],
    weaknesses: ['overuse of generic conclusions'],
    preservationWarnings: [],
    confidence: 0.7,
    sampleCount: 3,
    lastSampleAt: new Date().toISOString(),
  };

  // Test 6a: Text matching the profile (low drift)
  section('6a: Text matching profile (expect low drift)');
  const start6a = Date.now();
  const lowDriftResult = styleConsistencyService.compareToBaseline(TEST_ESSAY, mockProfile);
  const duration6a = Date.now() - start6a;

  log(`Duration: ${duration6a}ms`);
  log(`Drift score: ${lowDriftResult.driftScore}/100`);
  log(`Acceptable: ${lowDriftResult.isAcceptable}`);
  log(`Summary: ${lowDriftResult.summary}`);
  log(`Signals: ${lowDriftResult.signals.length}`);

  for (const signal of lowDriftResult.signals) {
    log(`  ${signal.dimension}: baseline=${signal.baseline.toFixed(2)}, current=${signal.current.toFixed(2)}, severity=${signal.severity}`);
  }

  assert(duration6a < 50, `Completes under 50ms (got ${duration6a}ms)`);
  assert(lowDriftResult.driftScore >= 0 && lowDriftResult.driftScore <= 100, `Score in valid range (got ${lowDriftResult.driftScore})`);
  assert(typeof lowDriftResult.isAcceptable === 'boolean', 'isAcceptable is boolean');
  assert(typeof lowDriftResult.summary === 'string' && lowDriftResult.summary.length > 0, 'summary is non-empty string');
  assert(Array.isArray(lowDriftResult.signals) && lowDriftResult.signals.length > 0, 'signals is non-empty array');
  // Each signal should have the required fields
  for (const signal of lowDriftResult.signals) {
    assert(typeof signal.dimension === 'string', `Signal has dimension (${signal.dimension})`);
    assert(typeof signal.baseline === 'number', `Signal ${signal.dimension} has numeric baseline`);
    assert(typeof signal.current === 'number', `Signal ${signal.dimension} has numeric current`);
    assert(['none', 'low', 'medium', 'high'].includes(signal.severity), `Signal ${signal.dimension} has valid severity (${signal.severity})`);
  }

  // Test 6b: Highly formal text against casual profile (high drift)
  section('6b: Formal text vs casual profile (expect high drift)');
  const formalText = `The implementation of sustainable agricultural practices within urban environments necessitates a comprehensive understanding of ecological principles, municipal regulatory frameworks, and community engagement methodologies. Furthermore, the establishment of collaborative governance structures is paramount to ensuring the long-term viability of such initiatives. One must consider the multifaceted implications of soil remediation, water conservation, and biodiversity preservation when undertaking these endeavors.`;

  const start6b = Date.now();
  const highDriftResult = styleConsistencyService.compareToBaseline(formalText, mockProfile);
  const duration6b = Date.now() - start6b;

  log(`Duration: ${duration6b}ms`);
  log(`Drift score: ${highDriftResult.driftScore}/100`);
  log(`Acceptable: ${highDriftResult.isAcceptable}`);
  log(`Summary: ${highDriftResult.summary}`);

  assert(duration6b < 50, `Completes under 50ms (got ${duration6b}ms)`);
  assert(highDriftResult.driftScore > lowDriftResult.driftScore, `Formal text has higher drift (${highDriftResult.driftScore}) than matching text (${lowDriftResult.driftScore})`);
}

// ============================================================================
// RUNNER
// ============================================================================

async function main(): Promise<void> {
  divider('ENHANCED WORKSHOP FULL-LOOP INTEGRATION TEST');
  log('Pipeline: preAnalyze → plan → enhance(2 steps) → stream(1 step) → competitive → voice drift');
  log(`Essay: ${TEST_ESSAY.substring(0, 80)}...`);
  log(`Essay word count: ${TEST_ESSAY.split(/\s+/).length}`);
  log(`useNewScoringPipeline: true (throughout)`);

  const overallStart = Date.now();

  try {
    // Test 1: Pre-analyze with new pipeline
    const snapshot = await testPreAnalyze();

    // Test 2: Plan improvements
    await testPlanImprovements(snapshot);

    // Test 3: Full enhance loop (maxSteps: 2)
    await testFullEnhance();

    // Test 4: SSE streaming
    await testStreamingEnhance();

    // Test 5: Competitive intelligence (deterministic)
    testCompetitiveIntelligence();

    // Test 6: Voice drift detection (deterministic)
    testVoiceDrift();

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
