/**
 * Phase 1 Tests — Workshop Registry Infrastructure + Scoring Bug Fixes
 *
 * Tests:
 * 1. Command Registry: register, get, list, duplicate detection
 * 2. Dimension Registry: register, get, weight validation
 * 3. Essay Profile Registry: register, get, duplicate detection
 * 4. EQI Calculator: pure weighted sum, weight validation, impression labels
 * 5. Rubric v1.0.1 weight sum validation (regression test for bug fix)
 * 6. Rubric scorer EQI has no hidden bump (regression test for bug fix)
 *
 * Run: npx tsx tests/test-workshop-registry.ts
 */

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

function assertThrows(fn: () => void, testName: string): void {
  try {
    fn();
    failed++;
    failures.push(`${testName}: expected to throw but did not`);
    console.log(`  ❌ ${testName} — expected to throw but did not`);
  } catch {
    passed++;
    console.log(`  ✅ ${testName}`);
  }
}

function assertApproxEqual(actual: number, expected: number, tolerance: number, testName: string): void {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    passed++;
    console.log(`  ✅ ${testName} (${actual})`);
  } else {
    failed++;
    const msg = `${testName}: expected ~${expected}, got ${actual} (diff: ${diff})`;
    failures.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

// ============================================================================
// TEST 1: COMMAND REGISTRY
// ============================================================================

async function testCommandRegistry(): Promise<void> {
  console.log('\n--- Command Registry Tests ---');

  const { commandRegistry } = await import('../../src/workshop/registry/commandRegistry');
  commandRegistry._reset();

  const mockCommand = {
    id: 'test_cmd_1',
    family: 'analytical' as const,
    displayName: 'Test Command 1',
    description: 'A test command',
    applicableEssayTypes: ['personal_statement' as const, 'why_us' as const],
    detailedPrompt: 'Test prompt',
    outputFormat: 'json',
    tier: 1 as const,
  };

  // Register
  commandRegistry.register(mockCommand);
  assert(commandRegistry.size === 1, 'Register increases size to 1');

  // Get by ID
  const retrieved = commandRegistry.getCommand('test_cmd_1');
  assert(retrieved !== undefined, 'getCommand returns registered command');
  assert(retrieved?.id === 'test_cmd_1', 'getCommand returns correct command');

  // Get non-existent
  assert(commandRegistry.getCommand('nonexistent') === undefined, 'getCommand returns undefined for unknown ID');

  // Register second command
  commandRegistry.register({
    ...mockCommand,
    id: 'test_cmd_2',
    family: 'narrative',
    applicableEssayTypes: ['personal_statement'],
  });
  assert(commandRegistry.size === 2, 'Register second command increases size to 2');

  // List by family
  const analytical = commandRegistry.listByFamily('analytical');
  assert(analytical.length === 1, 'listByFamily returns correct count');
  assert(analytical[0].id === 'test_cmd_1', 'listByFamily returns correct command');

  // List by essay type
  const personalStatement = commandRegistry.listByEssayType('personal_statement');
  assert(personalStatement.length === 2, 'listByEssayType returns all matching commands');

  const whyUs = commandRegistry.listByEssayType('why_us');
  assert(whyUs.length === 1, 'listByEssayType filters correctly');

  // List by tier
  const tier1 = commandRegistry.listByTier(1);
  assert(tier1.length === 2, 'listByTier returns correct count');

  // Duplicate registration throws
  assertThrows(() => commandRegistry.register(mockCommand), 'Duplicate ID registration throws');

  // getAll
  assert(commandRegistry.getAll().length === 2, 'getAll returns all registered commands');

  commandRegistry._reset();
  assert(commandRegistry.size === 0, 'Reset clears all registrations');
}

// ============================================================================
// TEST 2: DIMENSION REGISTRY
// ============================================================================

async function testDimensionRegistry(): Promise<void> {
  console.log('\n--- Dimension Registry Tests ---');

  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  dimensionRegistry._reset();

  const noopHeuristic = () => ({ score: 50, confidence: 0.8, evidence: [], signals: {} });
  const noopLLM = () => false;
  const noopBuild = () => '';
  const noopParse = () => ({ score: 50, confidence: 0.8, reasoning: '', evidence: [], tokenUsage: { inputTokens: 0, outputTokens: 0 } });
  const noopFuse = (h: any) => ({ dimensionId: '', score: h.score, source: 'heuristic_only' as const, heuristicResult: h, evidence: [] });

  const mockDim1 = {
    id: 'dim_1',
    displayName: 'Dimension 1',
    weight: 0.6,
    scoringTier: 'heuristic' as const,
    heuristicScore: noopHeuristic,
    shouldTriggerLLM: noopLLM,
    buildLLMPrompt: noopBuild,
    parseLLMResponse: noopParse,
    fuseScores: noopFuse,
  };

  const mockDim2 = {
    ...mockDim1,
    id: 'dim_2',
    displayName: 'Dimension 2',
    weight: 0.4,
  };

  // Register
  dimensionRegistry.register(mockDim1);
  dimensionRegistry.register(mockDim2);
  assert(dimensionRegistry.size === 2, 'Register two dimensions');

  // Get by ID
  const retrieved = dimensionRegistry.getDimension('dim_1');
  assert(retrieved !== undefined, 'getDimension returns registered dimension');
  assert(retrieved?.weight === 0.6, 'getDimension returns correct weight');

  // Get all
  assert(dimensionRegistry.getAll().length === 2, 'getAll returns all dimensions');

  // Get by tier
  assert(dimensionRegistry.getByTier('heuristic').length === 2, 'getByTier returns correct count');

  // Weight validation — should pass (0.6 + 0.4 = 1.0)
  try {
    dimensionRegistry.validateWeights();
    passed++;
    console.log('  ✅ validateWeights passes for sum = 1.0');
  } catch {
    failed++;
    failures.push('validateWeights should pass for sum = 1.0');
    console.log('  ❌ validateWeights should pass for sum = 1.0');
  }

  // Total weight
  assertApproxEqual(dimensionRegistry.getTotalWeight(), 1.0, 0.001, 'getTotalWeight returns 1.0');

  // Duplicate throws
  assertThrows(() => dimensionRegistry.register(mockDim1), 'Duplicate dimension ID throws');

  // Weight validation — should fail with bad weights
  dimensionRegistry._reset();
  dimensionRegistry.register({ ...mockDim1, weight: 0.5 });
  dimensionRegistry.register({ ...mockDim2, weight: 0.6 }); // sum = 1.1
  assertThrows(() => dimensionRegistry.validateWeights(), 'validateWeights throws for sum = 1.1');

  dimensionRegistry._reset();
}

// ============================================================================
// TEST 3: ESSAY PROFILE REGISTRY
// ============================================================================

async function testEssayProfileRegistry(): Promise<void> {
  console.log('\n--- Essay Profile Registry Tests ---');

  const { essayProfileRegistry } = await import('../../src/workshop/registry/essayProfileRegistry');
  essayProfileRegistry._reset();

  const mockProfile = {
    id: 'personal_statement' as const,
    displayName: 'Common App Personal Statement',
    dimensionWeightOverrides: { narrative_craft_storytelling: 0.12 },
    preferredCommands: ['show_dont_tell', 'deepen_vulnerability'],
    macroStrategies: [],
    antiPatterns: ['Starting with a quote'],
  };

  // Register
  essayProfileRegistry.register(mockProfile);
  assert(essayProfileRegistry.size === 1, 'Register increases size to 1');

  // Get by type
  const retrieved = essayProfileRegistry.getProfile('personal_statement');
  assert(retrieved !== undefined, 'getProfile returns registered profile');
  assert(retrieved?.displayName === 'Common App Personal Statement', 'getProfile returns correct profile');

  // Has profile
  assert(essayProfileRegistry.hasProfile('personal_statement'), 'hasProfile returns true for registered type');
  assert(!essayProfileRegistry.hasProfile('uc_piq'), 'hasProfile returns false for unregistered type');

  // Get non-existent
  assert(essayProfileRegistry.getProfile('uc_piq') === undefined, 'getProfile returns undefined for unknown type');

  // Duplicate throws
  assertThrows(() => essayProfileRegistry.register(mockProfile), 'Duplicate essay type throws');

  // Get all
  assert(essayProfileRegistry.getAll().length === 1, 'getAll returns all profiles');

  essayProfileRegistry._reset();
  assert(essayProfileRegistry.size === 0, 'Reset clears all profiles');
}

// ============================================================================
// TEST 4: EQI CALCULATOR
// ============================================================================

async function testEQICalculator(): Promise<void> {
  console.log('\n--- EQI Calculator Tests ---');

  const { eqiCalculator } = await import('../../src/workshop/scoring/eqiCalculator');

  // Pure weighted sum — no hidden bumps
  const inputs = [
    { dimensionId: 'dim_a', score: 80, weight: 0.5 },
    { dimensionId: 'dim_b', score: 60, weight: 0.5 },
  ];
  const result = eqiCalculator.calculate(inputs);
  assertApproxEqual(result.eqi, 70, 0.1, 'Pure weighted sum: (80*0.5 + 60*0.5) = 70');

  // All zeros
  const zeros = [
    { dimensionId: 'dim_a', score: 0, weight: 0.5 },
    { dimensionId: 'dim_b', score: 0, weight: 0.5 },
  ];
  assertApproxEqual(eqiCalculator.calculate(zeros).eqi, 0, 0.1, 'All zeros → EQI = 0');

  // All 100s
  const hundreds = [
    { dimensionId: 'dim_a', score: 100, weight: 0.5 },
    { dimensionId: 'dim_b', score: 100, weight: 0.5 },
  ];
  assertApproxEqual(eqiCalculator.calculate(hundreds).eqi, 100, 0.1, 'All 100s → EQI = 100');

  // No hidden bump for 30-60 range
  const midRange = [
    { dimensionId: 'dim_a', score: 45, weight: 1.0 },
  ];
  const midResult = eqiCalculator.calculate(midRange);
  assertApproxEqual(midResult.eqi, 45, 0.1, 'No hidden bump: score 45 stays 45 (not 50)');

  // Another mid-range check
  const midRange2 = [
    { dimensionId: 'dim_a', score: 55, weight: 1.0 },
  ];
  assertApproxEqual(eqiCalculator.calculate(midRange2).eqi, 55, 0.1, 'No hidden bump: score 55 stays 55 (not 60)');

  // Weight validation — rejects bad weights
  const badWeights = [
    { dimensionId: 'dim_a', score: 80, weight: 0.5 },
    { dimensionId: 'dim_b', score: 60, weight: 0.6 }, // sum = 1.1
  ];
  assertThrows(() => eqiCalculator.calculate(badWeights), 'Rejects weights summing to 1.1');

  // Weight validation — rejects weights < 1.0
  const lowWeights = [
    { dimensionId: 'dim_a', score: 80, weight: 0.3 },
    { dimensionId: 'dim_b', score: 60, weight: 0.3 }, // sum = 0.6
  ];
  assertThrows(() => eqiCalculator.calculate(lowWeights), 'Rejects weights summing to 0.6');

  // Impression label mapping — boundary tests
  assert(eqiCalculator.getImpressionLabel(100) === 'arresting_deeply_human', 'Label: 100 → arresting');
  assert(eqiCalculator.getImpressionLabel(90) === 'arresting_deeply_human', 'Label: 90 → arresting');
  assert(eqiCalculator.getImpressionLabel(89.9) === 'compelling_clear_voice', 'Label: 89.9 → compelling');
  assert(eqiCalculator.getImpressionLabel(80) === 'compelling_clear_voice', 'Label: 80 → compelling');
  assert(eqiCalculator.getImpressionLabel(79.9) === 'competent_needs_texture', 'Label: 79.9 → competent');
  assert(eqiCalculator.getImpressionLabel(70) === 'competent_needs_texture', 'Label: 70 → competent');
  assert(eqiCalculator.getImpressionLabel(69.9) === 'readable_but_generic', 'Label: 69.9 → readable');
  assert(eqiCalculator.getImpressionLabel(60) === 'readable_but_generic', 'Label: 60 → readable');
  assert(eqiCalculator.getImpressionLabel(59.9) === 'template_like_rebuild', 'Label: 59.9 → template');
  assert(eqiCalculator.getImpressionLabel(0) === 'template_like_rebuild', 'Label: 0 → template');

  // 0-10 scale convenience method
  const scaled = eqiCalculator.calculateFrom10Scale([
    { dimensionId: 'dim_a', score: 8, weight: 0.5 },
    { dimensionId: 'dim_b', score: 6, weight: 0.5 },
  ]);
  assertApproxEqual(scaled.eqi, 70, 0.1, 'calculateFrom10Scale: (8*10*0.5 + 6*10*0.5) = 70');
}

// ============================================================================
// TEST 5: RUBRIC v1.0.1 WEIGHT SUM VALIDATION
// ============================================================================

async function testRubricWeightSum(): Promise<void> {
  console.log('\n--- Rubric v1.0.1 Weight Sum Tests ---');

  const { ESSAY_RUBRIC_V1_0_1 } = await import('../../src/core/essay/rubrics/v1.0.1');

  const totalWeight = ESSAY_RUBRIC_V1_0_1.dimensions.reduce(
    (sum, dim) => sum + dim.weight, 0
  );

  assertApproxEqual(totalWeight, 1.0, 0.001, `Rubric v1.0.1 weights sum to 1.00 (actual: ${totalWeight.toFixed(4)})`);

  // Verify specific fixed weights
  const getWeight = (name: string) =>
    ESSAY_RUBRIC_V1_0_1.dimensions.find(d => d.name === name)?.weight ?? -1;

  assertApproxEqual(getWeight('narrative_arc_stakes_turn'), 0.11, 0.001, 'narrative_arc weight = 0.11 (was 0.12)');
  assertApproxEqual(getWeight('character_interiority_vulnerability'), 0.11, 0.001, 'interiority weight = 0.11 (was 0.12)');
  assertApproxEqual(getWeight('reflection_meaning_making'), 0.11, 0.001, 'reflection weight = 0.11 (was 0.12)');
  assertApproxEqual(getWeight('show_dont_tell_craft'), 0.09, 0.001, 'show_dont_tell weight = 0.09 (was 0.10)');

  // Verify 12 dimensions present
  assert(ESSAY_RUBRIC_V1_0_1.dimensions.length === 12, '12 dimensions present');
}

// ============================================================================
// TEST 6: RUBRIC SCORER — NO HIDDEN EQI BUMP
// ============================================================================

async function testNoHiddenEQIBump(): Promise<void> {
  console.log('\n--- Rubric Scorer — No Hidden EQI Bump Tests ---');

  const { scoreWithRubric, createEvidence } = await import('../../src/core/essay/analysis/features/rubricScorer');
  const { ESSAY_RUBRIC_V1_0_1 } = await import('../../src/core/essay/rubrics/v1.0.1');

  // Create dimension scores that should produce an EQI in the 30-60 range
  // (the old bump range). Using score=4 across the board:
  // EQI = sum(4 * weight_i) * 10 = 4 * 1.0 * 10 = 40
  const evidence = createEvidence(['test'], 'test evidence');
  const rawScores = ESSAY_RUBRIC_V1_0_1.dimensions.map(dim => ({
    dimension_name: dim.name,
    score: 4,
    evidence,
  }));

  const result = scoreWithRubric(rawScores, 'This is a test essay.');

  // With uniform score=4 and corrected weights summing to 1.0:
  // EQI should be approximately 4 * 10 = 40 (might vary slightly due to interaction rules)
  // The OLD bug would have added +5, making it ~45.
  // We verify it's NOT bumped.
  const expectedBase = ESSAY_RUBRIC_V1_0_1.dimensions.reduce(
    (sum, dim) => sum + 4 * dim.weight, 0
  ) * 10;

  // Allow for interaction rules to modify slightly
  const tolerance = 5; // interaction rules can adjust scores by a few points
  assert(
    Math.abs(result.essay_quality_index - expectedBase) < tolerance,
    `EQI in 30-60 range has no +5 bump (expected ~${expectedBase.toFixed(1)}, got ${result.essay_quality_index})`,
    result.essay_quality_index > expectedBase + 5 ? 'BUMP DETECTED — old bug still present!' : undefined
  );

  // Verify score of exactly 45 is NOT bumped to 50
  // Using carefully chosen scores to hit ~45
  const scores45 = ESSAY_RUBRIC_V1_0_1.dimensions.map(dim => ({
    dimension_name: dim.name,
    score: 4.5,
    evidence,
  }));
  const result45 = scoreWithRubric(scores45, 'Test essay for 45 EQI.');
  assert(
    result45.essay_quality_index <= 50,
    `Score ~45 is not bumped to 50 (got ${result45.essay_quality_index})`
  );
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  Workshop Registry & Scoring Bug Fix Tests (Phase 1)');
  console.log('================================================================');

  await testCommandRegistry();
  await testDimensionRegistry();
  await testEssayProfileRegistry();
  await testEQICalculator();
  await testRubricWeightSum();
  await testNoHiddenEQIBump();

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

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
