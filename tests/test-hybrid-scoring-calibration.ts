/**
 * Hybrid Scoring Pipeline Calibration Tests (Phase 2+3)
 *
 * Validates:
 * 1. Feature extractor produces correct features from sample text
 * 2. All 13 dimensions register and weights sum to 1.00
 * 3. Heuristic-only scoring produces reasonable scores
 * 4. EQI calculation is correct with new dimensions
 * 5. Strategy selector recommends appropriate strategies
 * 6. Command registry has all 10 new commands
 *
 * Run: npx tsx tests/test-hybrid-scoring-calibration.ts
 */

// ============================================================================
// SETUP: Import all dimension files (they self-register on import)
// ============================================================================

import '../src/workshop/dimensions/narrative-craft.dim';
import '../src/workshop/dimensions/structural-coherence.dim';
import '../src/workshop/dimensions/word-economy.dim';
import '../src/workshop/dimensions/opening-hook.dim';
import '../src/workshop/dimensions/closing-impact.dim';
import '../src/workshop/dimensions/emotional-resonance.dim';
import '../src/workshop/dimensions/intellectual-vitality.dim';
import '../src/workshop/dimensions/thematic-depth.dim';
import '../src/workshop/dimensions/growth-transformation.dim';
import '../src/workshop/dimensions/authenticity-specificity.dim';
import '../src/workshop/dimensions/tonal-sophistication.dim';
import '../src/workshop/dimensions/argument-rhetorical.dim';
import '../src/workshop/dimensions/originality-voice.dim';

// Import command files
import '../src/workshop/commands/sharpen-claim.cmd';
import '../src/workshop/commands/add-counterpoint.cmd';
import '../src/workshop/commands/deepen-analysis.cmd';
import '../src/workshop/commands/shift-tone.cmd';
import '../src/workshop/commands/map-emotional-arc.cmd';
import '../src/workshop/commands/sharpen-diction.cmd';
import '../src/workshop/commands/improve-rhythm.cmd';
import '../src/workshop/commands/improve-transition.cmd';
import '../src/workshop/commands/thread-metaphor.cmd';
import '../src/workshop/commands/scan-audience-awareness.cmd';

import { dimensionRegistry } from '../src/workshop/registry/dimensionRegistry';
import { commandRegistry } from '../src/workshop/registry/commandRegistry';
import { featureExtractor } from '../src/workshop/scoring/featureExtractor';
import { eqiCalculator } from '../src/workshop/scoring/eqiCalculator';
import { hybridScoringPipeline } from '../src/workshop/scoring/hybridScoringPipeline';
import { strategySelector } from '../src/workshop/orchestrator/strategySelector';
import { MACRO_STRATEGIES } from '../src/workshop/orchestrator/macroStrategies';

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    const msg = detail ? `${testName}: ${detail}` : testName;
    failures.push(msg);
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

function assertApprox(actual: number, expected: number, tol: number, name: string): void {
  assert(Math.abs(actual - expected) <= tol, name, `expected ~${expected}, got ${actual}`);
}

function assertRange(value: number, min: number, max: number, name: string): void {
  assert(value >= min && value <= max, name, `expected ${min}-${max}, got ${value}`);
}

// ============================================================================
// SAMPLE ESSAYS
// ============================================================================

const STRONG_NARRATIVE = `The worst stench I have ever encountered hit me the moment I opened the lab door. Purple nitrite gloves, a cardboard box of kosher meals, and the faint hum of the centrifuge — this was my world for the summer I turned sixteen.

"You're going to fail at this," Dr. Moran said, not unkindly, handing me my first petri dish. She was right. My first three weeks produced nothing but contaminated cultures and bruised confidence. I stayed late, scrubbing equipment while my friends posted beach selfies.

The breakthrough came at 2 AM on a Tuesday. Under the fluorescent buzz, I watched the bacteria form the exact resistance pattern we'd hypothesized. My hands trembled. Not from excitement — from the terrifying realization that I was genuinely uncertain about what this meant for antibiotic treatment.

That uncertainty never left. It followed me into mock trial, where I learned that the strongest arguments admit what they don't know. It shaped my journalism, where I report the questions I can't yet answer. I used to think intelligence meant having answers. Now I know it means sitting with better questions.

My dreams fell like the Berlin wall that summer — not destroyed, but transformed into something I hadn't imagined. I still don't know where the research leads. I'm still questioning. And I've never been more curious.`;

const WEAK_GENERIC = `I have always been passionate about helping others. Ever since I was young, I knew that making a difference in my community was important to me. Throughout my life, I have participated in many activities that have shaped who I am today.

In high school, I joined the community service club and organized several events. I also volunteered at the local food bank on weekends. These experiences taught me the importance of giving back and working as a team.

I believe that my diverse experiences have made me a well-rounded individual. I am excited to bring my leadership skills and passion for service to your university. I look forward to continuing to make a positive impact and grow as a person.`;

// ============================================================================
// TEST 1: DIMENSION REGISTRY
// ============================================================================

function testDimensionRegistry(): void {
  console.log('\n--- Dimension Registry Tests ---');

  assert(dimensionRegistry.size === 13, `13 dimensions registered (got ${dimensionRegistry.size})`);

  // Check all expected dimensions exist
  const expectedDims = [
    'narrative_craft_storytelling', 'structural_coherence_flow', 'word_economy_craft',
    'opening_hook_engagement', 'closing_impact_resolution',
    'emotional_resonance_vulnerability', 'intellectual_vitality_curiosity',
    'thematic_depth_reflection', 'growth_transformation_arc',
    'authenticity_specificity_detail', 'tonal_sophistication',
    'argument_rhetorical_craft', 'originality_voice_authenticity',
  ];

  for (const id of expectedDims) {
    assert(dimensionRegistry.getDimension(id) !== undefined, `Dimension '${id}' registered`);
  }

  // Validate weights sum
  const totalWeight = dimensionRegistry.getTotalWeight();
  assertApprox(totalWeight, 1.0, 0.001, `Dimension weights sum to 1.00 (got ${totalWeight.toFixed(4)})`);

  // Validate weight assertion doesn't throw
  try {
    dimensionRegistry.validateWeights();
    passed++;
    console.log('  ✅ validateWeights() passes');
  } catch (e) {
    failed++;
    failures.push(`validateWeights threw: ${e}`);
    console.log(`  ❌ validateWeights() threw: ${e}`);
  }

  // Check scoring tiers
  const heuristicOnly = dimensionRegistry.getByTier('heuristic');
  assert(heuristicOnly.length === 4, `4 heuristic-only dimensions (got ${heuristicOnly.length})`);

  const haikuDims = dimensionRegistry.getByTier('heuristic+haiku');
  assert(haikuDims.length === 8, `8 heuristic+haiku dimensions (got ${haikuDims.length})`);

  const sonnetDims = dimensionRegistry.getByTier('heuristic+sonnet');
  assert(sonnetDims.length === 1, `1 heuristic+sonnet dimension (got ${sonnetDims.length})`);
}

// ============================================================================
// TEST 2: COMMAND REGISTRY
// ============================================================================

function testCommandRegistry(): void {
  console.log('\n--- Command Registry Tests ---');

  assert(commandRegistry.size === 10, `10 commands registered (got ${commandRegistry.size})`);

  const expectedCmds = [
    'sharpen_claim', 'add_counterpoint', 'deepen_analysis',
    'shift_tone', 'map_emotional_arc',
    'sharpen_diction', 'improve_rhythm',
    'improve_transition', 'thread_metaphor', 'scan_audience_awareness',
  ];

  for (const id of expectedCmds) {
    const cmd = commandRegistry.getCommand(id);
    assert(cmd !== undefined, `Command '${id}' registered`);
    if (cmd) {
      assert(cmd.detailedPrompt.length > 100, `  ${id}: prompt is substantive (${cmd.detailedPrompt.length} chars)`);
      assert(cmd.tier === 1, `  ${id}: tier 1`);
    }
  }

  // Check family distribution
  assert(commandRegistry.listByFamily('analytical').length === 3, '3 analytical commands');
  assert(commandRegistry.listByFamily('tonal').length === 1, '1 tonal command');
  assert(commandRegistry.listByFamily('precision').length === 2, '2 precision commands');
  assert(commandRegistry.listByFamily('structural').length === 1, '1 structural command');
  assert(commandRegistry.listByFamily('rhetorical').length === 1, '1 rhetorical command');
  assert(commandRegistry.listByFamily('meta').length === 2, '2 meta commands');
}

// ============================================================================
// TEST 3: FEATURE EXTRACTOR
// ============================================================================

function testFeatureExtractor(): void {
  console.log('\n--- Feature Extractor Tests ---');

  const startTime = Date.now();
  const features = featureExtractor.extract(STRONG_NARRATIVE);
  const extractTime = Date.now() - startTime;

  assert(extractTime < 200, `Extraction time < 200ms (got ${extractTime}ms)`);
  assertRange(features.wordCount, 200, 400, `Word count reasonable (${features.wordCount})`);
  assert(features.sentenceCount > 10, `Multiple sentences (${features.sentenceCount})`);
  assert(features.paragraphCount >= 4, `Multiple paragraphs (${features.paragraphCount})`);
  assert(features.hasOpeningScene, 'Opening scene detected in strong narrative');
  assert(features.hasDialogue, 'Dialogue detected');
  assert(features.dialogueCount >= 1, `Dialogue instances >= 1 (${features.dialogueCount})`);
  assert(features.sensoryDetailCount > 0, `Sensory details found (${features.sensoryDetailCount})`);
  assert(features.emotionWordCount > 0, `Emotion words found (${features.emotionWordCount})`);
  assert(features.vulnerabilityMarkerCount > 0, `Vulnerability markers found (${features.vulnerabilityMarkerCount})`);
  assert(features.reflectionMarkerCount > 0, `Reflection markers found (${features.reflectionMarkerCount})`);
  assert(features.curiosityMarkerCount > 0, `Curiosity markers found (${features.curiosityMarkerCount})`);

  // Weak essay should have different features
  const weakFeatures = featureExtractor.extract(WEAK_GENERIC);
  assert(weakFeatures.clicheCount > 0, `Cliches detected in weak essay (${weakFeatures.clicheCount})`);
  assert(weakFeatures.sensoryDetailCount < features.sensoryDetailCount, 'Weak essay has fewer sensory details');
  assert(!weakFeatures.hasDialogue, 'Weak essay has no dialogue');
}

// ============================================================================
// TEST 4: HEURISTIC SCORING (no LLM)
// ============================================================================

function testHeuristicScoring(): void {
  console.log('\n--- Heuristic Scoring Tests ---');

  const strongFeatures = featureExtractor.extract(STRONG_NARRATIVE);
  const weakFeatures = featureExtractor.extract(WEAK_GENERIC);

  const allDims = dimensionRegistry.getAll();

  // Score both essays heuristically
  let strongTotal = 0;
  let weakTotal = 0;

  for (const dim of allDims) {
    const strongScore = dim.heuristicScore(strongFeatures);
    const weakScore = dim.heuristicScore(weakFeatures);

    assertRange(strongScore.score, 0, 100, `${dim.id}: strong score in range (${strongScore.score})`);
    assertRange(weakScore.score, 0, 100, `${dim.id}: weak score in range (${weakScore.score})`);
    assertRange(strongScore.confidence, 0, 1, `${dim.id}: confidence in range`);

    strongTotal += strongScore.score;
    weakTotal += weakScore.score;
  }

  // Strong essay should score higher overall
  assert(strongTotal > weakTotal, `Strong essay total (${strongTotal}) > weak essay total (${weakTotal})`);
}

// ============================================================================
// TEST 5: EQI CALCULATION WITH 13 DIMENSIONS
// ============================================================================

function testEQIWith13Dimensions(): void {
  console.log('\n--- EQI with 13 Dimensions Tests ---');

  const allDims = dimensionRegistry.getAll();
  const strongFeatures = featureExtractor.extract(STRONG_NARRATIVE);
  const weakFeatures = featureExtractor.extract(WEAK_GENERIC);

  // Calculate EQI for strong essay
  const strongInputs = allDims.map(dim => ({
    dimensionId: dim.id,
    score: dim.heuristicScore(strongFeatures).score,
    weight: dim.weight,
  }));
  const strongEQI = eqiCalculator.calculate(strongInputs);

  assertRange(strongEQI.eqi, 30, 90, `Strong essay EQI reasonable (${strongEQI.eqi})`);
  assert(strongEQI.impressionLabel !== undefined, 'Impression label assigned');

  // Calculate EQI for weak essay
  const weakInputs = allDims.map(dim => ({
    dimensionId: dim.id,
    score: dim.heuristicScore(weakFeatures).score,
    weight: dim.weight,
  }));
  const weakEQI = eqiCalculator.calculate(weakInputs);

  assertRange(weakEQI.eqi, 0, 60, `Weak essay EQI reasonable (${weakEQI.eqi})`);
  assert(strongEQI.eqi > weakEQI.eqi, `Strong EQI (${strongEQI.eqi}) > Weak EQI (${weakEQI.eqi})`);

  console.log(`\n  📊 Strong essay: EQI=${strongEQI.eqi}, Label=${strongEQI.impressionLabel}`);
  console.log(`  📊 Weak essay:   EQI=${weakEQI.eqi}, Label=${weakEQI.impressionLabel}`);
}

// ============================================================================
// TEST 6: STRATEGY SELECTOR
// ============================================================================

function testStrategySelector(): void {
  console.log('\n--- Strategy Selector Tests ---');

  assert(MACRO_STRATEGIES.length === 6, `6 macro strategies defined (got ${MACRO_STRATEGIES.length})`);

  // Personal statement should get scene-focused strategies
  const psStrategies = strategySelector.selectStrategies('personal_statement');
  assert(psStrategies.length > 0, 'Personal statement gets strategy recommendations');
  assert(
    psStrategies.some(s => s.strategy.id === 'deepen_scene' || s.strategy.id === 'emotional_arc_repair'),
    'Personal statement gets narrative-focused strategies'
  );

  // Why Us should get argument-focused strategies
  const whyUsStrategies = strategySelector.selectStrategies('why_us');
  assert(whyUsStrategies.length > 0, 'Why Us gets strategy recommendations');
  assert(
    whyUsStrategies.some(s => s.strategy.id === 'why_us_overhaul' || s.strategy.id === 'strengthen_argument'),
    'Why Us gets argument-focused strategies'
  );

  // All essay types should get at least polish_prose
  const analyticalStrategies = strategySelector.selectStrategies('analytical');
  assert(
    analyticalStrategies.some(s => s.strategy.id === 'polish_prose'),
    'All types get polish_prose strategy'
  );
}

// ============================================================================
// TEST 7: FULL PIPELINE INTEGRATION (heuristic-only mode)
// ============================================================================

function testFullPipelineIntegration(): void {
  console.log('\n--- Full Pipeline Integration Test ---');

  // Test heuristic-only scoring (no LLM needed)
  const result = hybridScoringPipeline.scoreHeuristicOnly(STRONG_NARRATIVE);

  assert(result.dimensionScores.length === 13, `13 dimension scores (got ${result.dimensionScores.length})`);
  assertRange(result.eqi, 0, 100, `EQI in range (${result.eqi})`);
  assert(result.impressionLabel !== undefined, `Impression label: ${result.impressionLabel}`);
  assert(result.cost.llmCallCount === 0, 'No LLM calls in heuristic-only mode');
  assert(result.cost.estimatedCostUSD === 0, 'Zero cost in heuristic-only mode');
  assert(result.timingMs.total < 500, `Total time < 500ms (got ${result.timingMs.total}ms)`);

  // Weak essay comparison
  const weakResult = hybridScoringPipeline.scoreHeuristicOnly(WEAK_GENERIC);
  assert(result.eqi > weakResult.eqi, `Strong (${result.eqi}) > Weak (${weakResult.eqi})`);

  console.log(`\n  📊 Full Pipeline - Strong: EQI=${result.eqi}, Label=${result.impressionLabel}, ${result.timingMs.total}ms`);
  console.log(`  📊 Full Pipeline - Weak:   EQI=${weakResult.eqi}, Label=${weakResult.impressionLabel}, ${weakResult.timingMs.total}ms`);

  // Print per-dimension breakdown for strong essay
  console.log('\n  --- Strong Essay Dimension Breakdown ---');
  result.dimensionScores
    .sort((a: any, b: any) => b.score - a.score)
    .forEach((d: any) => {
      const dim = dimensionRegistry.getDimension(d.dimensionId);
      const bar = '█'.repeat(Math.round(d.score / 5));
      console.log(`  ${d.score.toString().padStart(3)} ${bar.padEnd(20)} ${dim?.displayName || d.dimensionId}`);
    });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function main(): void {
  console.log('================================================================');
  console.log('  Hybrid Scoring Pipeline Calibration Tests (Phase 2+3)');
  console.log('================================================================');

  testDimensionRegistry();
  testCommandRegistry();
  testFeatureExtractor();
  testHeuristicScoring();
  testEQIWith13Dimensions();
  testStrategySelector();
  testFullPipelineIntegration();

  console.log('\n================================================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
}

main();
