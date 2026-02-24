/**
 * Test: Style Consistency Service — Voice Check & Constraint Block
 * Run: npx tsx tests/test-style-consistency.ts
 * No API key required — tests pure heuristic functions
 *
 * Tests quickVoiceCheck() for detecting voice violations and
 * buildVoiceConstraintBlock() for generating LLM constraint text.
 */

import { styleConsistencyService } from '../src/services/voiceProfile/styleConsistencyService';
import type { StudentVoiceProfile } from '../src/services/voiceProfile/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

// ============================================================================
// MOCK PROFILE: Formal, 20-word avg sentences, specific avoid words
// ============================================================================

function createMockProfile(): StudentVoiceProfile {
  return {
    userId: 'test-style',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    register: {
      primary: 'quiet_intensity' as any,
      confidence: 0.85,
    },
    linguistics: {
      averageSentenceLength: 20,
      sentenceLengthVariety: 6,
      vocabularyLevel: 'sophisticated',
      formality: 'formal',
      fragmentUse: 'minimal',
      signatureWords: ['resilience', 'deliberate', 'nuance'],
      avoidWords: ['delve', 'tapestry', 'journey'],
    },
    personality: {
      energy: 'low',
      humor: 'rare',
      directness: 'circumspect',
      emotionalOpenness: 'reserved',
    },
    authenticPhrases: [],
    weaknesses: [],
    preservationWarnings: [],
    confidence: 0.85,
    sampleCount: 5,
    lastSampleAt: '2026-01-01T00:00:00Z',
  };
}

async function main() {
  console.log('\n=== Style Consistency Tests ===\n');

  const profile = createMockProfile();
  let violationsDetected = 0;
  let totalViolationsPlanted = 0;
  let falsePositives = 0;
  let totalCleanChecks = 0;

  // --- Test 1: Text with banned word "delve" ---
  console.log('--- Test 1: Banned Word Detection ---\n');
  totalViolationsPlanted++;

  const result1 = styleConsistencyService.quickVoiceCheck(
    'I wanted to delve deeper into the research methodology and understand its implications for the broader scientific community.',
    profile
  );
  console.log('  Result:', JSON.stringify(result1, null, 2));
  if (result1.bannedTermsFound && result1.bannedTermsFound.length > 0) {
    violationsDetected++;
  }
  assert(
    result1.bannedTermsFound && result1.bannedTermsFound.length > 0,
    'Detected banned word "delve"'
  );

  // --- Test 2: Short sentences (avg ~8 words vs profile's 20) ---
  console.log('\n--- Test 2: Sentence Length Deviation ---\n');
  totalViolationsPlanted++;

  const result2 = styleConsistencyService.quickVoiceCheck(
    'I went there. It was nice. I liked it. The food was good. We left early. It was fun.',
    profile
  );
  console.log('  Result:', JSON.stringify(result2, null, 2));
  if (result2.sentenceLengthDeviation && result2.sentenceLengthDeviation > 10) {
    violationsDetected++;
  }
  assert(
    result2.sentenceLengthDeviation !== undefined && result2.sentenceLengthDeviation > 10,
    `Sentence length deviation > 10 (got: ${result2.sentenceLengthDeviation})`
  );

  // --- Test 3: Very casual text vs formal profile ---
  console.log('\n--- Test 3: Formality Mismatch ---\n');
  totalViolationsPlanted++;

  // Need 3+ casual markers (contractions) with 0 formal markers to trigger mismatch
  const result3 = styleConsistencyService.quickVoiceCheck(
    "I can't believe it's already over, I'm so done with this, I've been trying but I don't even know what's happening anymore, we're just going to wing it, they're not gonna help us, that's just how it's going to be now",
    profile
  );
  console.log('  Result:', JSON.stringify(result3, null, 2));
  if (result3.formalityMismatch) {
    violationsDetected++;
  }
  assert(result3.formalityMismatch === true, 'Detected formality mismatch');

  // --- Test 4: Clean text matching profile ---
  console.log('\n--- Test 4: Clean Text (Should Pass) ---\n');
  totalCleanChecks++;

  const result4 = styleConsistencyService.quickVoiceCheck(
    'The methodological framework employed in this investigation reveals a nuanced understanding of the underlying principles governing cellular biology. Through careful examination of the experimental data, one can discern patterns that illuminate broader truths.',
    profile
  );
  console.log('  Result:', JSON.stringify(result4, null, 2));
  const isClean4 = result4.overallConsistent === true;
  if (!isClean4) falsePositives++;
  assert(isClean4, 'Clean matching text passes (overallConsistent = true)');

  // --- Test 5: Multiple violations ---
  console.log('\n--- Test 5: Multiple Violations ---\n');
  totalViolationsPlanted += 3; // tapestry + journey + short sentences

  const result5 = styleConsistencyService.quickVoiceCheck(
    "yo so like this tapestry of experiences was wild. my journey started at the mall lol. it was cool. I can't even.",
    profile
  );
  console.log('  Result:', JSON.stringify(result5, null, 2));

  // Count detected violations
  let violations5 = 0;
  if (result5.bannedTermsFound && result5.bannedTermsFound.length > 0) {
    violations5 += result5.bannedTermsFound.length;
    violationsDetected += result5.bannedTermsFound.length;
  }
  if (result5.formalityMismatch) {
    violations5++;
    violationsDetected++;
  }
  if (result5.sentenceLengthDeviation && result5.sentenceLengthDeviation > 10) {
    violations5++;
    violationsDetected++;
  }

  assert(violations5 >= 2, `Multiple violations detected (${violations5} found)`);
  assert(
    result5.bannedTermsFound && result5.bannedTermsFound.length >= 2,
    `Both "tapestry" and "journey" detected (found: ${result5.bannedTermsFound?.join(', ')})`
  );

  // --- Test 6: Another clean text (matching 20-word avg sentence, formal, no banned words) ---
  console.log('\n--- Test 6: Another Clean Text ---\n');
  totalCleanChecks++;

  // Target: ~20 words per sentence to match profile's averageSentenceLength of 20
  const result6 = styleConsistencyService.quickVoiceCheck(
    'The experimental methodology offered clear and convincing evidence of systematic analysis across multiple controlled trials in our laboratory. Each independent variable was carefully documented and controlled to ensure that our findings would remain reproducible within established standard parameters.',
    profile
  );
  console.log('  Result:', JSON.stringify(result6, null, 2));
  const isClean6 = result6.overallConsistent === true;
  if (!isClean6) falsePositives++;
  assert(isClean6, 'Another clean matching text passes');

  // --- Aggregate checks ---
  console.log('\n--- Aggregate Detection Rates ---\n');

  const detectionRate = totalViolationsPlanted > 0 ? violationsDetected / totalViolationsPlanted : 0;
  const falsePositiveRate = totalCleanChecks > 0 ? falsePositives / totalCleanChecks : 0;

  console.log(`  Violations detected: ${violationsDetected}/${totalViolationsPlanted} (${(detectionRate * 100).toFixed(0)}%)`);
  console.log(`  False positives: ${falsePositives}/${totalCleanChecks} (${(falsePositiveRate * 100).toFixed(0)}%)`);

  assert(detectionRate >= 0.8, `Detection rate >= 80% (got: ${(detectionRate * 100).toFixed(0)}%)`);
  assert(falsePositiveRate < 0.1, `False positive rate < 10% (got: ${(falsePositiveRate * 100).toFixed(0)}%)`);

  // ============================================================================
  // buildVoiceConstraintBlock tests
  // ============================================================================
  console.log('\n--- buildVoiceConstraintBlock() ---\n');

  const block = styleConsistencyService.buildVoiceConstraintBlock(profile);

  assert(typeof block === 'string', 'Returns a string');
  assert(block.length > 0, 'Block is non-empty');
  assert(block.includes('formal'), 'Contains formality level');
  assert(
    block.includes('delve') || block.includes('tapestry') || block.includes('journey'),
    'Contains at least one banned word'
  );
  assert(
    block.includes('20') || block.includes('sentence'),
    'Contains sentence length guidance'
  );
  assert(block.length < 1200, `Block is compact (${block.length} chars < 1200)`);

  // ===== RESULTS =====
  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
  if (failed > 0) {
    console.log(`❌ ${failed} tests FAILED`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
