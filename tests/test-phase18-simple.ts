/**
 * Phase 18 Simple Integration Test
 *
 * Tests the lightweight refinement layer on top of Phase 17 output
 */

import { validateSuggestions } from '../supabase/functions/validate-suggestions/simple-validator.ts';

// Test data from successful Phase 17 output
const LEGO_SUGGESTION = {
  suggestion_id: 'test_lego',
  suggestion_text: `By freshman year, my Lego Death Star had been gathering dust on my desk for months—I'd walk past it to get to my laptop, barely noticing the gray plastic that used to consume entire weekends. The day I finally carried those bins to the garage, feeling their familiar weight one last time, I realized what I missed wasn't the building itself but the rush of solving each step, figuring out how pieces clicked together.`,
  suggestion_type: 'voice_amplifier'
};

const GENERIC_SUGGESTION = {
  suggestion_id: 'test_generic',
  suggestion_text: `This experience taught me valuable lessons about leadership and helped me grow as a person. I learned that hard work pays off and that persistence is key to success. Through this journey, I discovered my passion for helping others.`,
  suggestion_type: 'polished_original'
};

async function testSimpleValidation() {
  console.log('🧪 Testing Phase 18 Lightweight Validation');
  console.log('='.repeat(60));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    return;
  }

  const essayContext = 'Student writes about transition from Legos to coding, exploring problem-solving as constant thread.';

  // Test 1: High-quality suggestion (LEGO)
  console.log('\n📝 Test 1: High-Quality Suggestion (LEGO)');
  const legoResults = await validateSuggestions([LEGO_SUGGESTION], essayContext, apiKey);
  const legoResult = legoResults[0];

  console.log(`  Score: ${legoResult.quality_score}/10`);
  console.log(`  Verdict: ${legoResult.verdict}`);
  console.log(`  Issues: ${legoResult.issues.length}`);
  if (legoResult.issues.length > 0) {
    legoResult.issues.forEach(issue => console.log(`    - ${issue}`));
  }

  const legoPass = legoResult.quality_score >= 8 && legoResult.verdict !== 'needs_work';
  console.log(`  ${legoPass ? '✅ PASS' : '❌ FAIL'}: Expected score >= 8, got ${legoResult.quality_score}`);

  // Test 2: Generic suggestion
  console.log('\n📝 Test 2: Generic Suggestion');
  const genericResults = await validateSuggestions([GENERIC_SUGGESTION], essayContext, apiKey);
  const genericResult = genericResults[0];

  console.log(`  Score: ${genericResult.quality_score}/10`);
  console.log(`  Verdict: ${genericResult.verdict}`);
  console.log(`  Issues: ${genericResult.issues.length}`);
  genericResult.issues.forEach(issue => console.log(`    - ${issue}`));
  console.log(`  Improvements:`);
  genericResult.improvements.forEach(imp => console.log(`    - ${imp}`));

  const genericPass = genericResult.quality_score <= 5 && genericResult.issues.length >= 2;
  console.log(`  ${genericPass ? '✅ PASS' : '❌ FAIL'}: Expected score <= 5 with issues, got ${genericResult.quality_score}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`  Test 1 (LEGO Quality): ${legoPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 2 (Generic Detection): ${genericPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`\n  Overall: ${legoPass && genericPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
}

// Run test
if (import.meta.main) {
  testSimpleValidation();
}
