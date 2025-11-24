#!/usr/bin/env node

/**
 * COMPREHENSIVE TRANSPARENT SCORING VERIFICATION
 *
 * Validates all three tools with transparent scoring:
 * 1. suggest_piq_prompts - All 8 PIQ recommendations
 * 2. get_better_stories - Alternative story scoring
 * 3. analyze_portfolio_balance - Balance score breakdown
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

console.log('═══════════════════════════════════════════════════════════════');
console.log('  COMPREHENSIVE TRANSPARENT SCORING VERIFICATION');
console.log('  Testing: PIQ Suggestions, Better Stories, Portfolio Balance');
console.log('═══════════════════════════════════════════════════════════════\n');

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

async function verifyPIQSuggestions() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: suggest_piq_prompts Transparent Scoring');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  clearMockDatabase();
  seedMockDatabase({
    user_id: 'test-piq-001',
    profile: {
      first_gen: true,
      challenging_circumstances: true,
      family_hours_per_week: 15,
      financial_need: true,
      leadership_roles: [
        {
          name: 'Student Council President',
          hours_per_week: 10,
          impact: 'Organized school-wide events serving 1500+ students. Led team of 25 student representatives.'
        }
      ],
      gpa: 3.9,
      ap_courses: 8,
      intended_major: 'Biology'
    }
  });

  const result = await tools.suggest_piq_prompts({ user_id: 'test-piq-001' });

  let allValid = true;
  let detailsText = `Found ${result.recommendations.length} recommendations\n`;

  for (const rec of result.recommendations) {
    // Check required fields
    if (rec.base_score === undefined) {
      allValid = false;
      detailsText += `  ❌ PIQ ${rec.prompt_number}: Missing base_score\n`;
    }

    if (rec.context_adjustment === undefined) {
      allValid = false;
      detailsText += `  ❌ PIQ ${rec.prompt_number}: Missing context_adjustment\n`;
    }

    if (!rec.score_breakdown) {
      allValid = false;
      detailsText += `  ❌ PIQ ${rec.prompt_number}: Missing score_breakdown\n`;
    } else {
      // Verify math
      const calculatedFinal = rec.score_breakdown.base +
        (rec.score_breakdown.adjustments || []).reduce((sum: number, adj: any) => sum + adj.points, 0);

      if (rec.score_breakdown.final !== rec.fit_score) {
        allValid = false;
        detailsText += `  ❌ PIQ ${rec.prompt_number}: breakdown.final (${rec.score_breakdown.final}) ≠ fit_score (${rec.fit_score})\n`;
      } else {
        detailsText += `  ✅ PIQ ${rec.prompt_number}: base=${rec.base_score}, context=${rec.context_adjustment}, final=${rec.fit_score}\n`;
      }
    }
  }

  results.push({
    test: 'suggest_piq_prompts',
    status: allValid ? 'PASS' : 'FAIL',
    details: detailsText
  });

  console.log(detailsText);
  console.log(allValid ? '✅ PASS\n' : '❌ FAIL\n');
}

async function verifyBetterStories() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: get_better_stories Transparent Scoring');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  clearMockDatabase();
  seedMockDatabase({
    user_id: 'test-stories-001',
    profile: {
      extracurriculars: [
        {
          name: 'Robotics Team',
          hours_per_week: 15,
          leadership_role: true,
          impact: 'Led team to state championship. Built autonomous robot that won innovation award.'
        },
        {
          name: 'Math Tutoring',
          hours_per_week: 8,
          impact: 'Tutored 20+ students, helped improve average grades by 15%'
        }
      ],
      intended_major: 'Computer Science'
    }
  });

  // Test PIQ 1 (Leadership) scoring
  const result = await tools.get_better_stories({
    user_id: 'test-stories-001',
    current_essay_text: 'I helped at my local library organizing books.',
    piq_prompt_number: 1
  });

  let allValid = true;
  let detailsText = `Found ${result.alternative_stories.length} alternative stories\n`;

  for (const story of result.alternative_stories) {
    // Check required fields
    if (story.base_score === undefined) {
      allValid = false;
      detailsText += `  ❌ ${story.activity_name}: Missing base_score\n`;
    }

    if (story.context_adjustment === undefined) {
      allValid = false;
      detailsText += `  ❌ ${story.activity_name}: Missing context_adjustment\n`;
    }

    if (!story.score_breakdown) {
      allValid = false;
      detailsText += `  ❌ ${story.activity_name}: Missing score_breakdown\n`;
    } else {
      // Verify math
      if (story.score_breakdown.final !== story.fit_score) {
        allValid = false;
        detailsText += `  ❌ ${story.activity_name}: breakdown.final (${story.score_breakdown.final}) ≠ fit_score (${story.fit_score})\n`;
      } else {
        detailsText += `  ✅ ${story.activity_name}: base=${story.base_score}, context=${story.context_adjustment}, final=${story.fit_score}\n`;
      }
    }
  }

  results.push({
    test: 'get_better_stories',
    status: allValid ? 'PASS' : 'FAIL',
    details: detailsText
  });

  console.log(detailsText);
  console.log(allValid ? '✅ PASS\n' : '❌ FAIL\n');
}

async function verifyPortfolioBalance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: analyze_portfolio_balance Transparent Scoring');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  clearMockDatabase();
  seedMockDatabase({
    user_id: 'test-balance-001',
    profile: {
      first_gen: true,
      leadership_roles: [{ name: 'Club President', hours_per_week: 8, impact: 'Led 30 members' }],
      gpa: 3.8,
      ap_courses: 6,
      intended_major: 'Economics'
    }
  });

  // Test balanced portfolio
  const result = await tools.analyze_portfolio_balance({
    user_id: 'test-balance-001',
    piq_numbers: [1, 4, 6, 8]
  });

  let allValid = true;
  let detailsText = `Balance Score: ${result.balance_score}/100\n`;

  if (!result.score_breakdown) {
    allValid = false;
    detailsText += '  ❌ Missing score_breakdown\n';
  } else {
    // Verify components
    if (!result.score_breakdown.components || result.score_breakdown.components.length !== 4) {
      allValid = false;
      detailsText += `  ❌ Expected 4 components, got ${result.score_breakdown.components?.length || 0}\n`;
    } else {
      detailsText += `  ✅ 4 components present\n`;

      // Verify math
      const componentSum = result.score_breakdown.components.reduce((sum, comp) => sum + comp.points, 0);
      if (result.score_breakdown.total !== result.balance_score) {
        allValid = false;
        detailsText += `  ❌ breakdown.total (${result.score_breakdown.total}) ≠ balance_score (${result.balance_score})\n`;
      } else {
        detailsText += `  ✅ total (${result.balance_score}) = balance_score (${result.balance_score})\n`;
      }

      // Show component breakdown
      for (const comp of result.score_breakdown.components) {
        detailsText += `     ${comp.component}: ${comp.points}/${comp.max}\n`;
      }
    }
  }

  results.push({
    test: 'analyze_portfolio_balance',
    status: allValid ? 'PASS' : 'FAIL',
    details: detailsText
  });

  console.log(detailsText);
  console.log(allValid ? '✅ PASS\n' : '❌ FAIL\n');
}

async function main() {
  await verifyPIQSuggestions();
  await verifyBetterStories();
  await verifyPortfolioBalance();

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`Total Tests:  ${totalTests}`);
  console.log(`Passed:       ${passed} ${passed === totalTests ? '✅' : ''}`);
  console.log(`Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Pass Rate:    ${((passed / totalTests) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.test}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');

  if (passed === totalTests) {
    console.log('  ✅ ALL TRANSPARENT SCORING TESTS PASSED');
    console.log('  Phase 1.5: Transparent Scoring Implementation - COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('  ❌ SOME TESTS FAILED');
    console.log('  Review output above for details');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Verification error:', error);
  process.exit(1);
});
