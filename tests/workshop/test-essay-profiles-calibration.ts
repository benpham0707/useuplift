/**
 * Phase 4 Calibration Tests — Essay Profiles & Strategy Intelligence
 *
 * Validates:
 * - All 7 essay profiles register correctly
 * - Weight overrides normalize to 1.00
 * - Different essay types produce different scoring priorities
 * - Strategy selector integrates with profiles
 * - Anti-patterns and teaching tones defined
 * - EQI with profile overrides vs without
 */

// Import essay profiles (triggers registration)
import '../../src/workshop/essay-profiles';
// Import dimensions (triggers registration)
import '../../src/workshop/dimensions/narrative-craft.dim';
import '../../src/workshop/dimensions/emotional-resonance.dim';
import '../../src/workshop/dimensions/intellectual-vitality.dim';
import '../../src/workshop/dimensions/originality-voice.dim';
import '../../src/workshop/dimensions/structural-coherence.dim';
import '../../src/workshop/dimensions/word-economy.dim';
import '../../src/workshop/dimensions/thematic-depth.dim';
import '../../src/workshop/dimensions/opening-hook.dim';
import '../../src/workshop/dimensions/closing-impact.dim';
import '../../src/workshop/dimensions/growth-transformation.dim';
import '../../src/workshop/dimensions/authenticity-specificity.dim';
import '../../src/workshop/dimensions/tonal-sophistication.dim';
import '../../src/workshop/dimensions/argument-rhetorical.dim';
// Import commands (triggers registration)
import '../../src/workshop/commands/sharpen-claim.cmd';
import '../../src/workshop/commands/add-counterpoint.cmd';
import '../../src/workshop/commands/deepen-analysis.cmd';
import '../../src/workshop/commands/shift-tone.cmd';
import '../../src/workshop/commands/map-emotional-arc.cmd';
import '../../src/workshop/commands/sharpen-diction.cmd';
import '../../src/workshop/commands/improve-rhythm.cmd';
import '../../src/workshop/commands/improve-transition.cmd';
import '../../src/workshop/commands/thread-metaphor.cmd';
import '../../src/workshop/commands/scan-audience-awareness.cmd';

import { essayProfileRegistry } from '../../src/workshop/registry/essayProfileRegistry';
import { dimensionRegistry } from '../../src/workshop/registry/dimensionRegistry';
import { commandRegistry } from '../../src/workshop/registry/commandRegistry';
import { eqiCalculator } from '../../src/workshop/scoring/eqiCalculator';
import { strategySelector } from '../../src/workshop/orchestrator/strategySelector';
import type { WorkshopEssayType, EQIInput, EssayProfileManifest } from '../../src/workshop/shared/types';

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string): void {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message} (expected ~${expected}, got ${actual})`);
  }
}

function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

// ============================================================================
// HELPER: Build standard EQI inputs from dimension registry
// ============================================================================

function buildStandardInputs(baseScore: number): EQIInput[] {
  return dimensionRegistry.getAll().map(dim => ({
    dimensionId: dim.id,
    score: baseScore,
    weight: dim.weight,
  }));
}

function buildVariedInputs(scoreMap: Partial<Record<string, number>>, defaultScore: number = 50): EQIInput[] {
  return dimensionRegistry.getAll().map(dim => ({
    dimensionId: dim.id,
    score: scoreMap[dim.id] ?? defaultScore,
    weight: dim.weight,
  }));
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('Phase 4 Calibration Tests — Essay Profiles & Strategy Intelligence');
  console.log('='.repeat(70));

  // ------------------------------------------------------------------
  section('1. Profile Registration');
  // ------------------------------------------------------------------

  const expectedProfiles: WorkshopEssayType[] = [
    'personal_statement',
    'uc_piq',
    'why_us',
    'community',
    'activity_to_essay',
    'identity_background',
    'analytical',
  ];

  assert(essayProfileRegistry.size === 7, `Expected 7 profiles, got ${essayProfileRegistry.size}`);

  for (const id of expectedProfiles) {
    assert(essayProfileRegistry.hasProfile(id), `Profile '${id}' should be registered`);
  }

  const allProfiles = essayProfileRegistry.getAll();
  assert(allProfiles.length === 7, `getAll() should return 7 profiles, got ${allProfiles.length}`);

  // Each profile has a displayName
  for (const profile of allProfiles) {
    assert(profile.displayName.length > 0, `Profile '${profile.id}' should have a displayName`);
  }

  // ------------------------------------------------------------------
  section('2. Weight Override Validity');
  // ------------------------------------------------------------------

  const dimensionIds = dimensionRegistry.getAll().map(d => d.id);

  for (const profile of allProfiles) {
    const overrideKeys = Object.keys(profile.dimensionWeightOverrides);

    // All override keys must reference valid dimension IDs
    for (const key of overrideKeys) {
      assert(
        dimensionIds.includes(key),
        `Profile '${profile.id}' has override for unknown dimension '${key}'`
      );
    }

    // Overrides must have values between 0 and 1
    for (const [key, value] of Object.entries(profile.dimensionWeightOverrides)) {
      if (value !== undefined) {
        assert(value >= 0 && value <= 1, `Profile '${profile.id}' override '${key}' = ${value} should be 0-1`);
      }
    }

    // At least 3 overrides per profile (meaningful customization)
    assert(
      overrideKeys.length >= 3,
      `Profile '${profile.id}' should have at least 3 weight overrides, got ${overrideKeys.length}`
    );
  }

  // ------------------------------------------------------------------
  section('3. Weight Normalization');
  // ------------------------------------------------------------------

  // For each profile, applying overrides and normalizing should sum to 1.00
  const standardInputs = buildStandardInputs(70);

  for (const profile of allProfiles) {
    // The EQI calculator normalizes internally, so just verify it doesn't throw
    try {
      const result = eqiCalculator.calculate(standardInputs, profile.id);
      assert(result.overridesApplied === true, `Profile '${profile.id}' overrides should be applied`);
      // EQI should be reasonable (70 base score → ~70 EQI)
      assertApprox(result.eqi, 70, 1, `Profile '${profile.id}' EQI with uniform 70 scores`);
      passed++; // no-throw counts
    } catch (err) {
      failed++;
      console.error(`  FAIL: Profile '${profile.id}' threw during EQI calculation: ${err}`);
    }
  }

  // Also verify that without a profile, EQI with uniform scores is ~70
  const baseResult = eqiCalculator.calculate(standardInputs);
  assert(baseResult.overridesApplied === false, 'No overrides without essay type');
  assertApprox(baseResult.eqi, 70, 0.5, 'Base EQI with uniform 70 scores');

  // ------------------------------------------------------------------
  section('4. Profile Differentiation — Weight Shifts');
  // ------------------------------------------------------------------

  // Different essay types should prioritize different dimensions
  // Test: an essay strong in narrative but weak in argument should score
  // differently under personal_statement vs analytical profiles

  const narrativeStrongEssay = buildVariedInputs({
    narrative_craft_storytelling: 85,
    emotional_resonance_vulnerability: 80,
    growth_transformation_arc: 80,
    argument_rhetorical_craft: 30,
    intellectual_vitality_curiosity: 35,
    structural_coherence_flow: 50,
  });

  const psResult = eqiCalculator.calculate(narrativeStrongEssay, 'personal_statement');
  const analyticalResult = eqiCalculator.calculate(narrativeStrongEssay, 'analytical');

  assert(
    psResult.eqi > analyticalResult.eqi,
    `Narrative-strong essay: personal_statement EQI (${psResult.eqi}) should > analytical EQI (${analyticalResult.eqi})`
  );
  assert(
    psResult.eqi - analyticalResult.eqi >= 2,
    `Difference should be meaningful (${(psResult.eqi - analyticalResult.eqi).toFixed(1)} points)`
  );

  // Test: an essay strong in argument but weak in narrative
  const argumentStrongEssay = buildVariedInputs({
    argument_rhetorical_craft: 85,
    intellectual_vitality_curiosity: 80,
    structural_coherence_flow: 80,
    narrative_craft_storytelling: 25,
    emotional_resonance_vulnerability: 30,
    growth_transformation_arc: 35,
  });

  const psResult2 = eqiCalculator.calculate(argumentStrongEssay, 'personal_statement');
  const analyticalResult2 = eqiCalculator.calculate(argumentStrongEssay, 'analytical');

  assert(
    analyticalResult2.eqi > psResult2.eqi,
    `Argument-strong essay: analytical EQI (${analyticalResult2.eqi}) should > personal_statement EQI (${psResult2.eqi})`
  );

  // Test: word-economy-focused essay under PIQ vs personal_statement
  const conciseEssay = buildVariedInputs({
    word_economy_craft: 90,
    originality_voice_authenticity: 70,
    narrative_craft_storytelling: 40,
    emotional_resonance_vulnerability: 45,
  });

  const piqResult = eqiCalculator.calculate(conciseEssay, 'uc_piq');
  const psResult3 = eqiCalculator.calculate(conciseEssay, 'personal_statement');

  assert(
    piqResult.eqi > psResult3.eqi,
    `Concise essay: PIQ EQI (${piqResult.eqi}) should > personal_statement EQI (${psResult3.eqi})`
  );

  // Test: specificity-focused essay under activity vs personal_statement
  const impactEssay = buildVariedInputs({
    authenticity_specificity_detail: 90,
    argument_rhetorical_craft: 80,
    word_economy_craft: 85,
    narrative_craft_storytelling: 30,
    emotional_resonance_vulnerability: 25,
  });

  const activityResult = eqiCalculator.calculate(impactEssay, 'activity_to_essay');
  const psResult4 = eqiCalculator.calculate(impactEssay, 'personal_statement');

  assert(
    activityResult.eqi > psResult4.eqi,
    `Impact essay: activity EQI (${activityResult.eqi}) should > personal_statement EQI (${psResult4.eqi})`
  );

  // ------------------------------------------------------------------
  section('5. Preferred Commands');
  // ------------------------------------------------------------------

  const registeredCommandIds = commandRegistry.getAll().map(c => c.id);

  for (const profile of allProfiles) {
    assert(
      profile.preferredCommands.length >= 5,
      `Profile '${profile.id}' should have at least 5 preferred commands, got ${profile.preferredCommands.length}`
    );

    // At least some preferred commands should be registered (the new ones)
    const matchingNew = profile.preferredCommands.filter(c => registeredCommandIds.includes(c));
    assert(
      matchingNew.length >= 2,
      `Profile '${profile.id}' should have at least 2 registered preferred commands, got ${matchingNew.length}: [${matchingNew.join(', ')}]`
    );
  }

  // Analytical profile should prefer analytical commands first
  const analyticalProfile = essayProfileRegistry.getProfile('analytical')!;
  assert(
    analyticalProfile.preferredCommands[0] === 'sharpen_claim',
    `Analytical profile's top command should be 'sharpen_claim', got '${analyticalProfile.preferredCommands[0]}'`
  );

  // Personal statement should prefer narrative commands first
  const psProfile = essayProfileRegistry.getProfile('personal_statement')!;
  assert(
    psProfile.preferredCommands[0] === 'show_dont_tell',
    `Personal statement's top command should be 'show_dont_tell', got '${psProfile.preferredCommands[0]}'`
  );

  // PIQ should prefer economy commands first
  const piqProfile = essayProfileRegistry.getProfile('uc_piq')!;
  assert(
    piqProfile.preferredCommands[0] === 'cut_filler',
    `PIQ's top command should be 'cut_filler', got '${piqProfile.preferredCommands[0]}'`
  );

  // Activity should prefer evidence first
  const activityProfile = essayProfileRegistry.getProfile('activity_to_essay')!;
  assert(
    activityProfile.preferredCommands[0] === 'add_evidence',
    `Activity's top command should be 'add_evidence', got '${activityProfile.preferredCommands[0]}'`
  );

  // ------------------------------------------------------------------
  section('6. Macro Strategies per Profile');
  // ------------------------------------------------------------------

  for (const profile of allProfiles) {
    assert(
      profile.macroStrategies.length >= 2,
      `Profile '${profile.id}' should have at least 2 macro strategies, got ${profile.macroStrategies.length}`
    );

    for (const strategy of profile.macroStrategies) {
      assert(strategy.id.length > 0, `Strategy in '${profile.id}' should have an id`);
      assert(strategy.commands.length >= 3, `Strategy '${strategy.id}' in '${profile.id}' should have at least 3 commands`);
      assert(strategy.description.length > 20, `Strategy '${strategy.id}' in '${profile.id}' should have a meaningful description`);
    }
  }

  // Why Us profile should have 'why_us_overhaul' strategy
  const whyUsProfile = essayProfileRegistry.getProfile('why_us')!;
  assert(
    whyUsProfile.macroStrategies.some(s => s.id === 'why_us_overhaul'),
    "Why Us profile should include 'why_us_overhaul' strategy"
  );

  // Personal statement should have 'deepen_scene' strategy
  assert(
    psProfile.macroStrategies.some(s => s.id === 'deepen_scene'),
    "Personal statement profile should include 'deepen_scene' strategy"
  );

  // ------------------------------------------------------------------
  section('7. Anti-Patterns');
  // ------------------------------------------------------------------

  for (const profile of allProfiles) {
    assert(
      profile.antiPatterns.length >= 5,
      `Profile '${profile.id}' should have at least 5 anti-patterns, got ${profile.antiPatterns.length}`
    );

    // Each anti-pattern should be a meaningful string
    for (const ap of profile.antiPatterns) {
      assert(ap.length > 15, `Anti-pattern in '${profile.id}' should be descriptive: "${ap.substring(0, 30)}..."`);
    }
  }

  // Activity profile should warn about tech name-dropping
  assert(
    activityProfile.antiPatterns.some(ap => ap.toLowerCase().includes('name-drop') || ap.toLowerCase().includes('tech')),
    'Activity profile should warn about tech name-dropping'
  );

  // Why Us profile should warn about generic praise
  assert(
    whyUsProfile.antiPatterns.some(ap => ap.toLowerCase().includes('generic')),
    'Why Us profile should warn about generic content'
  );

  // Personal statement should warn about listing achievements
  assert(
    psProfile.antiPatterns.some(ap => ap.toLowerCase().includes('listing') || ap.toLowerCase().includes('achievements')),
    'Personal statement should warn about listing achievements'
  );

  // ------------------------------------------------------------------
  section('8. Teaching Tone');
  // ------------------------------------------------------------------

  for (const profile of allProfiles) {
    assert(
      profile.teachingTone !== undefined,
      `Profile '${profile.id}' should have a teaching tone`
    );

    if (profile.teachingTone) {
      assert(
        ['casual', 'balanced', 'formal'].includes(profile.teachingTone.formality),
        `Profile '${profile.id}' formality should be valid`
      );
      assert(
        ['high', 'moderate', 'low'].includes(profile.teachingTone.encouragement),
        `Profile '${profile.id}' encouragement should be valid`
      );
      assert(
        ['direct', 'gentle', 'socratic'].includes(profile.teachingTone.directness),
        `Profile '${profile.id}' directness should be valid`
      );
    }
  }

  // Analytical should be formal and direct
  assert(
    analyticalProfile.teachingTone?.formality === 'formal',
    'Analytical profile should have formal tone'
  );
  assert(
    analyticalProfile.teachingTone?.directness === 'direct',
    'Analytical profile should be direct'
  );

  // Identity/background should be gentle and encouraging
  const identityProfile = essayProfileRegistry.getProfile('identity_background')!;
  assert(
    identityProfile.teachingTone?.directness === 'gentle',
    'Identity/background profile should be gentle'
  );
  assert(
    identityProfile.teachingTone?.encouragement === 'high',
    'Identity/background profile should have high encouragement'
  );

  // ------------------------------------------------------------------
  section('9. Strategy Selector + Profile Integration');
  // ------------------------------------------------------------------

  // Strategy selector should factor in essay profiles when recommending strategies
  const recs1 = strategySelector.selectStrategies('personal_statement');
  assert(recs1.length > 0, 'Should return strategy recommendations for personal_statement');

  // The top recommendation for personal_statement should be narrative-oriented
  const topPS = recs1[0];
  assert(
    ['deepen_scene', 'emotional_arc_repair', 'polish_prose'].includes(topPS.strategy.id),
    `Top strategy for personal_statement should be narrative-oriented, got '${topPS.strategy.id}'`
  );

  // For analytical, top should be argument-oriented
  const recs2 = strategySelector.selectStrategies('analytical');
  assert(recs2.length > 0, 'Should return strategy recommendations for analytical');

  const topAnalytical = recs2[0];
  assert(
    ['strengthen_argument', 'ao_ready_polish'].includes(topAnalytical.strategy.id),
    `Top strategy for analytical should be argument-oriented, got '${topAnalytical.strategy.id}'`
  );

  // For why_us, top should be why_us_overhaul or strengthen_argument
  const recs3 = strategySelector.selectStrategies('why_us');
  assert(recs3.length > 0, 'Should return strategy recommendations for why_us');

  const topWhyUs = recs3[0];
  assert(
    ['why_us_overhaul', 'strengthen_argument', 'ao_ready_polish'].includes(topWhyUs.strategy.id),
    `Top strategy for why_us should be fit-oriented, got '${topWhyUs.strategy.id}'`
  );

  // ------------------------------------------------------------------
  section('10. Strategy Selector with Scoring Results');
  // ------------------------------------------------------------------

  // With weak argument dimensions, analytical essays should strongly prefer strengthen_argument
  const weakArgumentScores = {
    dimensionScores: [
      { dimensionId: 'argument_rhetorical_craft', score: 20, source: 'heuristic_only' as const, heuristicResult: { score: 20, confidence: 0.8, evidence: [], signals: {} }, evidence: [] },
      { dimensionId: 'intellectual_vitality_curiosity', score: 25, source: 'heuristic_only' as const, heuristicResult: { score: 25, confidence: 0.8, evidence: [], signals: {} }, evidence: [] },
      { dimensionId: 'thematic_depth_reflection', score: 30, source: 'heuristic_only' as const, heuristicResult: { score: 30, confidence: 0.8, evidence: [], signals: {} }, evidence: [] },
      { dimensionId: 'narrative_craft_storytelling', score: 70, source: 'heuristic_only' as const, heuristicResult: { score: 70, confidence: 0.8, evidence: [], signals: {} }, evidence: [] },
      { dimensionId: 'emotional_resonance_vulnerability', score: 65, source: 'heuristic_only' as const, heuristicResult: { score: 65, confidence: 0.8, evidence: [], signals: {} }, evidence: [] },
    ],
    eqi: 38,
    impressionLabel: 'template_like_rebuild' as const,
    weightedScores: {},
    cost: { llmCallCount: 0, totalInputTokens: 0, totalOutputTokens: 0, estimatedCostUSD: 0 },
    timingMs: { featureExtraction: 0, heuristicScoring: 0, llmScoring: 0, fusion: 0, total: 0 },
  };

  const recsWithScores = strategySelector.selectStrategies('analytical', weakArgumentScores);
  assert(recsWithScores.length > 0, 'Should return recommendations with scoring input');

  // strengthen_argument should be top because it targets the weak dimensions
  const topWithScores = recsWithScores[0];
  assert(
    topWithScores.strategy.id === 'strengthen_argument',
    `With weak argument scores, top strategy should be 'strengthen_argument', got '${topWithScores.strategy.id}'`
  );
  assert(
    topWithScores.rationale.includes('weak dimensions') || topWithScores.rationale.includes('essay profile') || topWithScores.score > 50,
    `Top recommendation should have meaningful rationale: "${topWithScores.rationale}"`
  );

  // ------------------------------------------------------------------
  section('11. Cross-Profile Comparison');
  // ------------------------------------------------------------------

  // Same essay under all profiles should produce different EQIs
  const genericEssay = buildVariedInputs({
    narrative_craft_storytelling: 60,
    emotional_resonance_vulnerability: 55,
    intellectual_vitality_curiosity: 65,
    originality_voice_authenticity: 70,
    structural_coherence_flow: 60,
    word_economy_craft: 75,
    thematic_depth_reflection: 60,
    opening_hook_engagement: 55,
    closing_impact_resolution: 55,
    growth_transformation_arc: 60,
    authenticity_specificity_detail: 70,
    tonal_sophistication: 55,
    argument_rhetorical_craft: 65,
  });

  const eqiByProfile: Record<string, number> = {};
  for (const profile of allProfiles) {
    const result = eqiCalculator.calculate(genericEssay, profile.id);
    eqiByProfile[profile.id] = result.eqi;
  }

  // Not all EQIs should be identical (profiles differentiate)
  const eqiValues = Object.values(eqiByProfile);
  const minEQI = Math.min(...eqiValues);
  const maxEQI = Math.max(...eqiValues);
  assert(
    maxEQI - minEQI >= 1,
    `EQIs across profiles should vary by at least 1 point (range: ${minEQI.toFixed(1)} - ${maxEQI.toFixed(1)})`
  );

  console.log('\n  Cross-profile EQIs for varied essay:');
  for (const [id, eqi] of Object.entries(eqiByProfile)) {
    console.log(`    ${id.padEnd(25)} → EQI ${eqi.toFixed(1)}`);
  }

  // ------------------------------------------------------------------
  section('12. Edge Cases');
  // ------------------------------------------------------------------

  // Requesting a profile for an unregistered type should return undefined
  assert(
    essayProfileRegistry.getProfile('other') === undefined,
    "getProfile('other') should return undefined (no profile for 'other')"
  );
  assert(
    essayProfileRegistry.hasProfile('other') === false,
    "hasProfile('other') should return false"
  );

  // EQI calculation without profile should still work
  try {
    const result = eqiCalculator.calculate(standardInputs, 'other');
    assert(result.overridesApplied === false, "'other' type should not apply overrides");
    passed++;
  } catch {
    failed++;
    console.error("  FAIL: EQI calculation for 'other' type should not throw");
  }

  // EQI calculation with no essay type at all
  try {
    const result = eqiCalculator.calculate(standardInputs);
    assert(result.overridesApplied === false, 'No essay type → no overrides');
    passed++;
  } catch {
    failed++;
    console.error('  FAIL: EQI calculation with no essay type should not throw');
  }

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------

  console.log('\n' + '='.repeat(70));
  console.log(`Phase 4 Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);

  if (failed > 0) {
    console.log('\nFAILED TESTS DETECTED');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
