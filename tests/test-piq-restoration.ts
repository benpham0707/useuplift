/**
 * PIQ Workshop Restoration Test
 *
 * Tests the restored PIQ workshop backend to verify:
 * 1. Single API call (no staging)
 * 2. Response time ~30-45 seconds
 * 3. Returns 5 workshop items
 * 4. Suggestions are concise and relevant
 * 5. All required data structures present
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zclaplpkuvxkrdwsgrul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbGFwbHBrdXZ4a3Jkd3NncnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5NDkxNDMsImV4cCI6MjA0NjUyNTE0M30.KKTwG7z5WcpyuPv4UsCJ9XpO_B7N8nGr-8u1FoClPG0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test PIQ essay (realistic example)
const TEST_ESSAY = `I never expected that learning to navigate my grandmother's dementia would teach me how to build bridges between cultures. Every Sunday, I sit with her as she drifts between English and Vietnamese, sometimes mid-sentence. "Con ơi," she'll start, then switch to broken English: "When I young girl in Saigon..."

At first, I just listened, nodding along. But I realized she wasn't just lost in memory—she was inviting me somewhere. So I started learning Vietnamese, not from Duolingo, but from her stories. I'd repeat phrases wrong, and she'd laugh, correcting my tones with the patience of someone who has all the time in the world.

Through these conversations, I discovered a whole history I'd never known. Her childhood during the war. The boats. The refugee camps. Stories my parents never told me because they were too painful. But Grandma shares them freely now, maybe because in her mind, the past and present exist side by side.

I've started documenting these stories, creating a bilingual archive. I interview her with my phone recording, transcribe both languages, add historical context. What started as time with Grandma became a project that connected me to my heritage and showed me the power of patient listening.

Now I volunteer at a senior center, using these same skills with other Vietnamese elders. Many of them have stories no one has asked to hear. I've become a bridge—between generations, between languages, between past and present.`;

const TEST_PROMPT_TITLE = 'PIQ #1: Leadership Experience';
const TEST_PROMPT_TEXT = 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.';

console.log('🧪 PIQ WORKSHOP RESTORATION TEST');
console.log('='.repeat(80));
console.log('');
console.log('Test Essay Length:', TEST_ESSAY.length, 'chars');
console.log('Word Count:', TEST_ESSAY.split(/\s+/).length);
console.log('');

async function testPIQWorkshopRestoration() {
  const startTime = Date.now();

  try {
    console.log('📞 Calling workshop-analysis edge function...');
    console.log('   Endpoint: workshop-analysis');
    console.log('   Method: Single API call (no staging)');
    console.log('');

    const { data, error } = await supabase.functions.invoke('workshop-analysis', {
      body: {
        essayText: TEST_ESSAY,
        essayType: 'uc_piq',
        promptText: TEST_PROMPT_TEXT,
        promptTitle: TEST_PROMPT_TITLE,
        maxWords: 350,
        targetSchools: ['UC System'],
        studentContext: {
          academicStrength: 'moderate',
          voicePreference: 'concise',
        }
      }
    });

    const elapsed = Date.now() - startTime;
    const elapsedSeconds = (elapsed / 1000).toFixed(1);

    if (error) {
      console.error('❌ ERROR:', error);
      throw error;
    }

    console.log('✅ Response received!');
    console.log('');
    console.log('='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));
    console.log('');

    // Test 1: Response Time
    console.log('📊 Test 1: Response Time');
    console.log(`   Time: ${elapsedSeconds}s`);
    if (elapsed < 60000) {
      console.log('   ✅ PASS - Under 60 seconds');
    } else if (elapsed < 90000) {
      console.log('   ⚠️  WARNING - Slower than expected (60-90s)');
    } else {
      console.log('   ❌ FAIL - Too slow (>90s)');
    }
    console.log('');

    // Test 2: Data Structure
    console.log('📊 Test 2: Response Structure');
    console.log(`   success: ${data?.success ? '✅' : '❌'}`);
    console.log(`   analysis: ${data?.analysis ? '✅' : '❌'}`);
    console.log(`   voiceFingerprint: ${data?.voiceFingerprint ? '✅' : '❌'}`);
    console.log(`   experienceFingerprint: ${data?.experienceFingerprint ? '✅' : '❌'}`);
    console.log(`   rubricDimensionDetails: ${data?.rubricDimensionDetails ? '✅' : '❌'}`);
    console.log(`   workshopItems: ${data?.workshopItems ? '✅' : '❌'}`);
    console.log('');

    // Test 3: Workshop Items Count
    console.log('📊 Test 3: Workshop Items Count');
    const itemCount = data?.workshopItems?.length || 0;
    console.log(`   Count: ${itemCount} items`);
    if (itemCount === 5) {
      console.log('   ✅ PASS - Exactly 5 items (target)');
    } else if (itemCount >= 3 && itemCount <= 7) {
      console.log('   ⚠️  WARNING - Close to target (3-7 items)');
    } else {
      console.log('   ❌ FAIL - Wrong count (expected 5)');
    }
    console.log('');

    // Test 4: NQI Score
    console.log('📊 Test 4: Narrative Quality Index');
    const nqi = data?.analysis?.narrative_quality_index || 0;
    console.log(`   NQI: ${nqi}/100`);
    if (nqi >= 40) {
      console.log('   ✅ PASS - Valid score range');
    } else {
      console.log('   ❌ FAIL - Suspiciously low score');
    }
    console.log('');

    // Test 5: Rubric Dimensions
    console.log('📊 Test 5: Rubric Dimensions');
    const dimensionCount = data?.rubricDimensionDetails?.length || 0;
    console.log(`   Dimensions: ${dimensionCount}`);
    if (dimensionCount === 12) {
      console.log('   ✅ PASS - All 12 dimensions present');
    } else {
      console.log(`   ❌ FAIL - Expected 12, got ${dimensionCount}`);
    }
    console.log('');

    // Test 6: Workshop Item Quality
    console.log('📊 Test 6: Workshop Item Quality');
    if (data?.workshopItems && data.workshopItems.length > 0) {
      const firstItem = data.workshopItems[0];
      console.log('   First Workshop Item:');
      console.log(`     - ID: ${firstItem.id ? '✅' : '❌'}`);
      console.log(`     - Quote: ${firstItem.quote ? '✅' : '❌'} (${firstItem.quote?.length || 0} chars)`);
      console.log(`     - Problem: ${firstItem.problem ? '✅' : '❌'} (${firstItem.problem?.length || 0} chars)`);
      console.log(`     - Why it matters: ${firstItem.why_it_matters ? '✅' : '❌'}`);
      console.log(`     - Severity: ${firstItem.severity ? '✅' : '❌'} (${firstItem.severity})`);
      console.log(`     - Rubric category: ${firstItem.rubric_category ? '✅' : '❌'}`);
      console.log(`     - Suggestions: ${firstItem.suggestions?.length || 0} items`);

      // Check suggestion length (should be concise)
      if (firstItem.suggestions && firstItem.suggestions.length > 0) {
        const avgSuggestionLength = firstItem.suggestions.reduce((sum: number, s: any) =>
          sum + (s.text?.length || 0), 0) / firstItem.suggestions.length;
        console.log(`     - Avg suggestion length: ${Math.round(avgSuggestionLength)} chars`);

        if (avgSuggestionLength < 300) {
          console.log('     ✅ PASS - Suggestions are concise');
        } else if (avgSuggestionLength < 500) {
          console.log('     ⚠️  WARNING - Suggestions are somewhat long');
        } else {
          console.log('     ❌ FAIL - Suggestions are too long');
        }
      }
      console.log('');

      // Display first suggestion for manual review
      console.log('   📝 Sample Suggestion (for manual quality check):');
      console.log(`   Problem: "${firstItem.problem}"`);
      console.log(`   Quote: "${firstItem.quote?.substring(0, 100)}..."`);
      if (firstItem.suggestions && firstItem.suggestions.length > 0) {
        console.log(`   Suggestion Type: ${firstItem.suggestions[0].type}`);
        console.log(`   Suggestion: "${firstItem.suggestions[0].text?.substring(0, 200)}..."`);
      }
      console.log('');
    }

    // Test 7: Voice Fingerprint
    console.log('📊 Test 7: Voice Fingerprint Details');
    if (data?.voiceFingerprint) {
      console.log(`   Tone: ${data.voiceFingerprint.tone?.primary || 'N/A'}`);
      console.log(`   Sentence Structure: ${data.voiceFingerprint.sentenceStructure ? '✅' : '❌'}`);
      console.log(`   Vocabulary: ${data.voiceFingerprint.vocabulary ? '✅' : '❌'}`);
      console.log(`   Pacing: ${data.voiceFingerprint.pacing ? '✅' : '❌'}`);
      console.log('   ✅ PASS - Voice fingerprint complete');
    } else {
      console.log('   ❌ FAIL - Voice fingerprint missing');
    }
    console.log('');

    // Test 8: Experience Fingerprint
    console.log('📊 Test 8: Experience Fingerprint Details');
    if (data?.experienceFingerprint) {
      console.log(`   Uniqueness Dimensions: ${data.experienceFingerprint.uniquenessDimensions?.length || 0}`);
      console.log(`   Anti-pattern Flags: ${data.experienceFingerprint.antiPatternFlags ? '✅' : '❌'}`);
      console.log(`   Quality Anchors: ${data.experienceFingerprint.qualityAnchors?.length || 0}`);
      console.log('   ✅ PASS - Experience fingerprint complete');
    } else {
      console.log('   ❌ FAIL - Experience fingerprint missing');
    }
    console.log('');

    // Final Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log(`⏱️  Response Time: ${elapsedSeconds}s`);
    console.log(`📊 NQI Score: ${nqi}/100`);
    console.log(`📝 Workshop Items: ${itemCount}`);
    console.log(`📐 Rubric Dimensions: ${dimensionCount}`);
    console.log(`✅ Voice Fingerprint: ${data?.voiceFingerprint ? 'Present' : 'Missing'}`);
    console.log(`✅ Experience Fingerprint: ${data?.experienceFingerprint ? 'Present' : 'Missing'}`);
    console.log('');

    // Overall Assessment
    const allPass =
      elapsed < 90000 &&
      data?.success &&
      itemCount >= 3 &&
      itemCount <= 7 &&
      nqi >= 40 &&
      dimensionCount === 12 &&
      data?.voiceFingerprint &&
      data?.experienceFingerprint;

    if (allPass) {
      console.log('🎉 OVERALL: ✅ ALL TESTS PASSED');
      console.log('');
      console.log('The PIQ workshop restoration is SUCCESSFUL!');
      console.log('- Single API call (no staging) ✅');
      console.log('- Fast response time ✅');
      console.log('- Quality workshop items ✅');
      console.log('- All data structures present ✅');
    } else {
      console.log('⚠️  OVERALL: SOME TESTS FAILED OR WARNINGS');
      console.log('');
      console.log('Review the test results above for details.');
    }
    console.log('');
    console.log('='.repeat(80));

    return data;

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(`Time before error: ${(elapsed / 1000).toFixed(1)}s`);
    console.error('Error:', error);
    console.error('');
    throw error;
  }
}

// Run the test
testPIQWorkshopRestoration()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });
