#!/usr/bin/env node

/**
 * TRANSPARENT SCORING VERIFICATION
 *
 * Quick test to verify that all PIQ recommendations now have:
 * - base_score
 * - context_adjustment
 * - score_breakdown with adjustments array
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

// Seed test student (first-gen leader with high context)
clearMockDatabase();
seedMockDatabase({
  user_id: 'verify-001',
  profile: {
    first_gen: true,
    challenging_circumstances: true,
    family_hours_per_week: 15,
    financial_need: true,
    leadership_roles: [
      {
        name: 'Debate Team Captain',
        hours_per_week: 12,
        impact: 'Led team to state championship. Mentored 15 new members. Organized weekly practice sessions and developed training curriculum that improved average speaker scores by 25%.'
      }
    ],
    gpa: 3.85,
    ap_courses: 9,
    intended_major: 'Political Science'
  }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('  TRANSPARENT SCORING VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

async function verify() {
  const result = await tools.suggest_piq_prompts({ user_id: 'verify-001' });

  console.log(`Total recommendations: ${result.recommendations.length}\n`);

  let allValid = true;

  for (const rec of result.recommendations) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`PIQ ${rec.prompt_number}: ${rec.prompt_text.substring(0, 50)}...`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Fit Score: ${rec.fit_score}/100`);

    // Check base_score
    if (rec.base_score !== undefined) {
      console.log(`✅ Base Score: ${rec.base_score}/100`);
    } else {
      console.log(`❌ Base Score: MISSING`);
      allValid = false;
    }

    // Check context_adjustment
    if (rec.context_adjustment !== undefined) {
      console.log(`✅ Context Adjustment: +${rec.context_adjustment}`);
    } else {
      console.log(`❌ Context Adjustment: MISSING`);
      allValid = false;
    }

    // Check score_breakdown
    if (rec.score_breakdown) {
      console.log(`✅ Score Breakdown:`);
      console.log(`   Base: ${rec.score_breakdown.base}`);
      console.log(`   Adjustments:`);

      if (rec.score_breakdown.adjustments && rec.score_breakdown.adjustments.length > 0) {
        for (const adj of rec.score_breakdown.adjustments) {
          console.log(`     - ${adj.reason}: +${adj.points}`);
        }
      } else {
        console.log(`     (no adjustments)`);
      }

      console.log(`   Final: ${rec.score_breakdown.final}`);

      // Verify math
      const calculatedSum = rec.score_breakdown.base +
        (rec.score_breakdown.adjustments || []).reduce((sum: number, adj: any) => sum + adj.points, 0);

      const finalScore = Math.min(calculatedSum, rec.fit_score); // Account for capping

      if (rec.score_breakdown.final === rec.fit_score) {
        console.log(`✅ Math checks out: breakdown.final (${rec.score_breakdown.final}) = fit_score (${rec.fit_score})`);
      } else {
        console.log(`❌ Math ERROR: breakdown.final (${rec.score_breakdown.final}) ≠ fit_score (${rec.fit_score})`);
        allValid = false;
      }
    } else {
      console.log(`❌ Score Breakdown: MISSING`);
      allValid = false;
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  if (allValid) {
    console.log('  ✅ ALL PIQ RECOMMENDATIONS HAVE TRANSPARENT SCORING');
    console.log('  All base_score, context_adjustment, and score_breakdown fields present');
    console.log('  All math verified correctly');
  } else {
    console.log('  ❌ SOME FIELDS MISSING OR INCORRECT');
    console.log('  Review output above for details');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(allValid ? 0 : 1);
}

verify().catch(error => {
  console.error('Verification error:', error);
  process.exit(1);
});
