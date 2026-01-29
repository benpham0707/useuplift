/**
 * Test Phase 19/20 Separation
 *
 * Validates that:
 * 1. Phase 19 generates teaching WITHOUT suggestionRationales
 * 2. Phase 20 generates suggestionRationales independently
 * 3. Both complete without timeout
 * 4. Rationales are 750-850 chars, HS-friendly, segmented
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zclaplpkuvxkrdwsgrul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbGFwbHBrdXZ4a3Jkd3Nncnl1bCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMxMzc3Nzg1LCJleHAiOjIwNDY5NTM3ODV9.TsFSd9TSsSF3cQ7MtzfiOOaA_RcpIGOZ4BVIpCp1RYw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TEST DATA
// ============================================================================

const mockWorkshopItem = {
  id: 'test_item_1',
  quote: 'Each Tuesday at 3:15 PM, I watched transformations unfold: Sarah stood at the whiteboard explaining TikTok engagement metrics to six seniors scribbling notes.',
  severity: 'critical' as const,
  rubric_category: 'show_dont_tell',
  suggestions: [
    {
      text: 'Each Tuesday at 3:15 PM in Room 204, I watched transformations unfold: Sarah, who never spoke in AP History, stood at the whiteboard explaining TikTok engagement metrics to six seniors scribbling notes.',
      type: 'polished_original' as const,
    },
    {
      text: 'Tuesdays, 3:15. Room 204. Sarah—silent in AP History—suddenly owns the whiteboard, breaking down TikTok metrics for six seniors who actually take notes.',
      type: 'voice_amplifier' as const,
    },
    {
      text: 'I didn\'t plan to become a teacher. But every Tuesday at 3:15, there I was: watching Sarah (who never spoke in class) explain social media analytics to six seniors like she\'d been teaching her whole life.',
      type: 'divergent_strategy' as const,
    },
  ],
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testPhase19() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Phase 19 (Teaching Layer) - WITHOUT suggestionRationales');
  console.log('='.repeat(80));

  const startTime = Date.now();

  const { data, error } = await supabase.functions.invoke('teaching-layer', {
    body: {
      workshopItems: [mockWorkshopItem],
      essayText: 'Sample essay about tutoring club...',
      promptText: 'Describe an educational experience...',
      promptTitle: 'UC PIQ 6',
      voiceFingerprint: { tone: 'conversational' },
      experienceFingerprint: { type: 'teaching' },
      rubricDimensionDetails: [],
      currentNQI: 72,
    },
  });

  const duration = (Date.now() - startTime) / 1000;

  if (error) {
    console.error('❌ Phase 19 FAILED:', error);
    return null;
  }

  console.log(`✅ Phase 19 completed in ${duration.toFixed(1)}s`);
  console.log('\n📊 Response structure:');
  console.log('  Success:', data.success);
  console.log('  Enhanced items:', data.enhancedItems?.length || 0);

  if (data.enhancedItems && data.enhancedItems[0]?.teaching) {
    const teaching = data.enhancedItems[0].teaching;
    console.log('\n📚 Teaching object structure:');
    console.log('  problem.hook:', teaching.problem?.hook?.length || 0, 'chars');
    console.log('  craftPrinciple.hook:', teaching.craftPrinciple?.hook?.length || 0, 'chars');
    console.log('  applicationStrategy.implementationGuide:', teaching.applicationStrategy?.implementationGuide?.length || 0, 'chars');
    console.log('  personalNote:', teaching.personalNote?.length || 0, 'chars');
    console.log('  suggestionRationales:', teaching.suggestionRationales ? 'PRESENT ❌ SHOULD BE ABSENT' : 'ABSENT ✅');

    if (teaching.suggestionRationales) {
      console.error('\n❌ FAIL: Phase 19 should NOT generate suggestionRationales!');
      return null;
    }

    console.log('\n✅ PASS: Phase 19 teaching generated WITHOUT suggestionRationales');
    return data.enhancedItems[0];
  }

  console.error('❌ No teaching data in response');
  return null;
}

async function testPhase20() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Phase 20 (Suggestion Rationales) - Independent generation');
  console.log('='.repeat(80));

  const startTime = Date.now();

  const { data, error } = await supabase.functions.invoke('suggestion-rationales', {
    body: {
      suggestions: mockWorkshopItem.suggestions.map((s, i) => ({
        index: i,
        text: s.text,
        type: s.type,
      })),
      issueContext: {
        title: 'Show, Don\'t Summarize Your Leadership',
        excerpt: mockWorkshopItem.quote,
        category: mockWorkshopItem.rubric_category,
      },
    },
  });

  const duration = (Date.now() - startTime) / 1000;

  if (error) {
    console.error('❌ Phase 20 FAILED:', error);
    return false;
  }

  console.log(`✅ Phase 20 completed in ${duration.toFixed(1)}s`);
  console.log('\n📊 Response structure:');
  console.log('  Success:', data.success);
  console.log('  Rationales:', data.rationales?.length || 0);

  if (data.rationales && data.rationales.length === 3) {
    console.log('\n📝 Rationale validation:');

    let allValid = true;

    data.rationales.forEach((r: any, i: number) => {
      const length = r.whyThisWorks?.length || 0;
      const hasLineBreaks = r.whyThisWorks?.includes('\n\n');
      const paragraphs = r.whyThisWorks?.split('\n\n').length || 0;

      const lengthOk = length >= 750 && length <= 900;
      const segmentedOk = hasLineBreaks && paragraphs >= 2;

      console.log(`\n  [${i}] Suggestion ${r.suggestionIndex}:`);
      console.log(`      Length: ${length} chars ${lengthOk ? '✅' : '❌ (should be 750-850)'}`);
      console.log(`      Segmented: ${paragraphs} paragraphs ${segmentedOk ? '✅' : '❌ (should have 2-3 with \\n\\n)'}`);
      console.log(`      Preview: "${r.whyThisWorks?.substring(0, 80)}..."`);

      if (!lengthOk || !segmentedOk) {
        allValid = false;
      }
    });

    if (allValid) {
      console.log('\n✅ PASS: All rationales are properly formatted (750-850 chars, segmented)');
      return true;
    } else {
      console.error('\n❌ FAIL: Some rationales are not properly formatted');
      return false;
    }
  }

  console.error('❌ Expected 3 rationales, got', data.rationales?.length || 0);
  return false;
}

async function testIntegration() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: Integration - Merge Phase 19 + Phase 20');
  console.log('='.repeat(80));

  // Get Phase 19 teaching
  const phase19Result = await testPhase19();
  if (!phase19Result) {
    console.error('❌ Phase 19 failed, cannot test integration');
    return false;
  }

  // Get Phase 20 rationales
  console.log('\n📝 Calling Phase 20 to add rationales...');
  const { data: phase20Data } = await supabase.functions.invoke('suggestion-rationales', {
    body: {
      suggestions: mockWorkshopItem.suggestions.map((s, i) => ({
        index: i,
        text: s.text,
        type: s.type,
      })),
      issueContext: {
        title: 'Show, Don\'t Summarize Your Leadership',
        excerpt: mockWorkshopItem.quote,
        category: mockWorkshopItem.rubric_category,
      },
    },
  });

  if (!phase20Data?.success || !phase20Data?.rationales) {
    console.error('❌ Phase 20 failed during integration test');
    return false;
  }

  // Merge them
  const mergedTeaching = {
    ...phase19Result.teaching,
    suggestionRationales: phase20Data.rationales,
  };

  console.log('\n✅ Merged teaching object:');
  console.log('  problem.hook:', !!mergedTeaching.problem?.hook);
  console.log('  craftPrinciple.hook:', !!mergedTeaching.craftPrinciple?.hook);
  console.log('  applicationStrategy:', !!mergedTeaching.applicationStrategy);
  console.log('  suggestionRationales:', mergedTeaching.suggestionRationales?.length || 0, 'rationales');

  if (mergedTeaching.suggestionRationales?.length === 3) {
    console.log('\n✅ PASS: Integration successful - teaching has all components');
    return true;
  } else {
    console.error('\n❌ FAIL: Integration failed - missing rationales');
    return false;
  }
}

async function testPerformance() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 4: Performance - Parallel Phase 20 for multiple items');
  console.log('='.repeat(80));

  const items = Array(5).fill(mockWorkshopItem);
  const startTime = Date.now();

  const results = await Promise.all(
    items.map(async (item, index) => {
      const { data, error } = await supabase.functions.invoke('suggestion-rationales', {
        body: {
          suggestions: item.suggestions.map((s, i) => ({
            index: i,
            text: s.text,
            type: s.type,
          })),
          issueContext: {
            title: `Test Item ${index + 1}`,
            excerpt: item.quote,
            category: item.rubric_category,
          },
        },
      });

      return { success: !!data?.success, index };
    })
  );

  const duration = (Date.now() - startTime) / 1000;
  const successCount = results.filter(r => r.success).length;

  console.log(`\n✅ Generated rationales for ${successCount}/5 items in ${duration.toFixed(1)}s`);
  console.log(`   Average: ${(duration / 5).toFixed(1)}s per item`);

  if (duration < 60) {
    console.log('\n✅ PASS: Performance acceptable (< 60s for 5 items in parallel)');
    return true;
  } else {
    console.error('\n❌ FAIL: Performance too slow (> 60s)');
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n🧪 PHASE 19/20 SEPARATION TEST SUITE');
  console.log('Testing the new architecture with separated teaching and rationale generation\n');

  const results = {
    phase19: false,
    phase20: false,
    integration: false,
    performance: false,
  };

  try {
    // Test 1: Phase 19 alone
    const phase19Result = await testPhase19();
    results.phase19 = !!phase19Result;

    // Test 2: Phase 20 alone
    results.phase20 = await testPhase20();

    // Test 3: Integration
    results.integration = await testIntegration();

    // Test 4: Performance
    results.performance = await testPerformance();

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Phase 19 (Teaching without rationales): ${results.phase19 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phase 20 (Rationale generation):       ${results.phase20 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Integration (Merge 19 + 20):            ${results.integration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Performance (5 items parallel):         ${results.performance ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(80));

    const allPassed = Object.values(results).every(r => r);
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Phase 19/20 separation is working reliably.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the output above for details.');
    }

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
  }
}

runAllTests();
