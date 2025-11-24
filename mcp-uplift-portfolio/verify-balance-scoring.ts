#!/usr/bin/env node

/**
 * PORTFOLIO BALANCE TRANSPARENT SCORING VERIFICATION
 *
 * Verifies that analyze_portfolio_balance returns:
 * - score_breakdown with 4 components
 * - components sum correctly to balance_score
 * - all math is accurate
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

// Enable mock mode
enableMockMode();
initializeSupabase();

// Seed test student with diverse profile
clearMockDatabase();
seedMockDatabase({
  user_id: 'balance-001',
  profile: {
    first_gen: true,
    challenging_circumstances: true,
    family_hours_per_week: 12,
    leadership_roles: [
      {
        name: 'Debate Captain',
        hours_per_week: 10,
        impact: 'Led team to state championship'
      }
    ],
    gpa: 3.9,
    ap_courses: 7,
    intended_major: 'Computer Science'
  }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PORTFOLIO BALANCE TRANSPARENT SCORING VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

async function verify() {
  // Test with a strong, balanced portfolio: PIQs 1, 4, 6, 8
  const result = await tools.analyze_portfolio_balance({
    user_id: 'balance-001',
    piq_numbers: [1, 4, 6, 8]
  });

  console.log(`Balance Score: ${result.balance_score}/100\n`);

  // Verify score_breakdown exists
  if (!result.score_breakdown) {
    console.log('❌ FAIL: score_breakdown is missing');
    process.exit(1);
  }

  console.log('✅ score_breakdown exists');
  console.log(`\nBreakdown Explanation:`);
  console.log(`  ${result.score_breakdown.explanation}\n`);

  // Verify components array
  if (!result.score_breakdown.components || result.score_breakdown.components.length !== 4) {
    console.log(`❌ FAIL: Expected 4 components, got ${result.score_breakdown.components?.length || 0}`);
    process.exit(1);
  }

  console.log('✅ 4 components present\n');
  console.log('Component Breakdown:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let calculatedSum = 0;
  for (const comp of result.score_breakdown.components) {
    console.log(`\n${comp.component}`);
    console.log(`  Points: ${comp.points}/${comp.max}`);
    calculatedSum += comp.points;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nCalculated Sum: ${calculatedSum}`);
  console.log(`Balance Score:  ${result.balance_score}`);

  // Verify math
  if (result.score_breakdown.total !== result.balance_score) {
    console.log(`\n❌ FAIL: score_breakdown.total (${result.score_breakdown.total}) ≠ balance_score (${result.balance_score})`);
    process.exit(1);
  }

  console.log(`\n✅ Math verified: total (${result.score_breakdown.total}) = balance_score (${result.balance_score})`);

  // The sum might differ from balance_score if capped at 100
  if (calculatedSum !== result.balance_score && result.balance_score !== 100) {
    console.log(`\n❌ FAIL: Components sum (${calculatedSum}) ≠ balance_score (${result.balance_score})`);
    process.exit(1);
  }

  if (result.balance_score === 100 && calculatedSum >= 100) {
    console.log(`✅ Score capped correctly at 100 (raw sum: ${calculatedSum})`);
  } else {
    console.log(`✅ Components sum correctly to balance_score`);
  }

  // Display strategic insights
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Strategic Insights:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const insight of result.strategic_insights) {
    console.log(`  • ${insight}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ PORTFOLIO BALANCE TRANSPARENT SCORING VERIFIED');
  console.log('  All components present, math correct, insights generated');
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

verify().catch(error => {
  console.error('Verification error:', error);
  process.exit(1);
});
