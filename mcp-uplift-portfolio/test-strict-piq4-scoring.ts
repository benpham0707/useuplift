#!/usr/bin/env node

/**
 * TEST STRICT PIQ 4 SCORING
 *
 * Verify that the new strict scoring produces realistic results:
 * - First-gen + family + 9 APs should score ~64, not 98
 * - Homeless + 13 APs + research should score ~95-97
 * - First-gen alone + 8 APs should score ~54
 */

import {
  enableMockMode,
  initializeSupabase
} from './src/database/supabaseClientTestable.js';

import {
  seedMockDatabase,
  clearMockDatabase
} from './src/database/supabaseClientMock.js';

import { tools } from './src/tools/index.js';

enableMockMode();
initializeSupabase();

console.log('═══════════════════════════════════════════════════════════════');
console.log('  STRICT PIQ 4 SCORING VERIFICATION');
console.log('  Testing HYPSM-level expectations');
console.log('═══════════════════════════════════════════════════════════════\n');

async function testScenario(name: string, profile: any, expectedRange: [number, number]) {
  console.log(`\n━━━ ${name} ━━━`);

  clearMockDatabase();
  seedMockDatabase({
    user_id: 'test-strict-001',
    profile
  });

  const result = await tools.suggest_piq_prompts({ user_id: 'test-strict-001' });
  const piq4 = result.recommendations.find((r: any) => r.prompt_number === 4);

  if (!piq4) {
    console.log(`❌ PIQ 4 not recommended`);
    return;
  }

  const [min, max] = expectedRange;
  const score = piq4.fit_score;
  const inRange = score >= min && score <= max;

  console.log(`\nScore: ${score}/100 (expected: ${min}-${max}) ${inRange ? '✅' : '❌'}`);
  console.log(`\nRationale: ${piq4.rationale}`);

  if (piq4.score_breakdown) {
    console.log(`\nScore Breakdown:`);
    for (const adj of piq4.score_breakdown.adjustments) {
      console.log(`  ${adj.reason}: +${adj.points}`);
    }
  }

  return { score, inRange };
}

async function runTests() {
  // Scenario 1: Original "inflated" profile - should now score ~64, not 98
  const result1 = await testScenario(
    'Scenario 1: First-gen + Family 15hrs + 9 APs + 3.85 GPA',
    {
      first_gen: true,
      challenging_circumstances: true,
      family_hours_per_week: 15,
      financial_need: true,
      gpa: 3.85,
      ap_courses: 9
    },
    [60, 68] // Should be Tier 3 (48) + Strong (16) = 64
  );

  // Scenario 2: Truly exceptional - homeless + research + high achievement
  const result2 = await testScenario(
    'Scenario 2: Homeless + Working 25hrs + 13 APs (4.0) + Research',
    {
      first_gen: true,
      other_circumstances: 'Experienced homelessness for 2 years',
      family_hours_per_week: 25,
      financial_need: true,
      gpa: 4.0,
      ap_courses: 13,
      personal_projects: [{
        name: 'Research on Educational Equity',
        category: 'research',
        description: 'Multi-year research project'
      }]
    },
    [95, 97] // Should be Tier 1 (70) + Transcendent (32) + maybe bonus = 102 → capped at 97
  );

  // Scenario 3: First-gen alone with moderate achievement
  const result3 = await testScenario(
    'Scenario 3: First-gen only + 8 APs + 3.7 GPA',
    {
      first_gen: true,
      gpa: 3.7,
      ap_courses: 8
    },
    [52, 56] // Should be Tier 4 (38) + Strong (16) = 54
  );

  // Scenario 4: Major barriers + exceptional achievement (10 APs + 3.9)
  const result4 = await testScenario(
    'Scenario 4: First-gen + Family 15hrs + 10 APs + 3.9 GPA',
    {
      first_gen: true,
      family_hours_per_week: 15,
      gpa: 3.9,
      ap_courses: 10
    },
    [68, 72] // Should be Tier 3 (48) + Exceptional (22) = 70
  );

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const scenarios = [result1, result2, result3, result4];
  const allPassed = scenarios.every(s => s?.inRange);

  console.log(`Scenario 1: ${result1?.score}/100 ${result1?.inRange ? '✅' : '❌'}`);
  console.log(`Scenario 2: ${result2?.score}/100 ${result2?.inRange ? '✅' : '❌'}`);
  console.log(`Scenario 3: ${result3?.score}/100 ${result3?.inRange ? '✅' : '❌'}`);
  console.log(`Scenario 4: ${result4?.score}/100 ${result4?.inRange ? '✅' : '❌'}`);

  console.log(`\n${allPassed ? '✅ ALL SCENARIOS PASSED' : '❌ SOME SCENARIOS FAILED'}`);
  console.log('Strict HYPSM-level scoring is now active.\n');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
