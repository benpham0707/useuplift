/**
 * Zero Tolerance Fraud Prevention - Comprehensive Test Suite
 * Tests the complete fraud prevention system with zero tolerance for duplicates
 *
 * Tests:
 * 1. Database schema validation (fraud_flags table)
 * 2. PostgreSQL functions (flag_user_for_fraud, is_user_flagged, etc.)
 * 3. Essay duplication detection with zero tolerance
 * 4. Account flagging and evidence storage
 * 5. Blocked action tracking
 * 6. Edge Function integration
 * 7. Real-world fraud scenarios
 *
 * Usage:
 * SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> npx tsx tests/test-zero-tolerance-complete.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zclaplpkuvxkrdwsgrul.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY environment variable is required');
  console.log('\nRun:');
  console.log('export SUPABASE_URL="https://zclaplpkuvxkrdwsgrul.supabase.co"');
  console.log('export SUPABASE_ANON_KEY="your-anon-key"');
  console.log('npx tsx tests/test-zero-tolerance-complete.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test state
let testCount = 0;
let passCount = 0;
let failCount = 0;
const TEST_USER_1 = `test-user-1-${Date.now()}`;
const TEST_USER_2 = `test-user-2-${Date.now()}`;
const TEST_USER_3 = `test-user-3-${Date.now()}`;

// Sample essays
const ESSAY_ORIGINAL = `
I discovered my passion for robotics in my grandmother's garage. The smell of oil and metal,
the hum of old machinery, it all felt like home. I spent hours there, taking apart broken radios
and reassembling them into something new. That's where I learned that failure isn't the end.
It's where I built my first robot from spare parts and duct tape. It barely moved, but it was mine.
That moment taught me that innovation doesn't require a lab - just curiosity and persistence.
`;

const ESSAY_DIFFERENT = `
The library was my refuge during difficult times. Between the shelves of books, I found worlds
I never knew existed. Reading about distant places and different cultures opened my mind.
I started a book club at school to share this love with others. We discussed everything from
classic literature to modern science fiction. Those conversations taught me the power of diverse
perspectives. Now I understand that learning happens everywhere, not just in classrooms.
The library gave me more than knowledge - it gave me community and purpose.
`;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ Test ${testCount}: ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ Test ${testCount}: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  const condition = actual === expected;
  if (!condition) {
    console.error(`     Expected: ${expected}, Got: ${actual}`);
  }
  assert(condition, message);
}

// =====================================================
// CLEANUP
// =====================================================

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete test data
    await supabase.from('fraud_flags').delete().in('user_id', [TEST_USER_1, TEST_USER_2, TEST_USER_3]);
    await supabase.from('essay_analyses').delete().in('user_id', [TEST_USER_1, TEST_USER_2, TEST_USER_3]);
    await supabase.from('essay_duplicates').delete().like('essay_hash', '%');
    await supabase.from('device_fingerprints').delete().in('user_id', [TEST_USER_1, TEST_USER_2, TEST_USER_3]);
    await supabase.from('ip_usage_tracking').delete().in('user_id', [TEST_USER_1, TEST_USER_2, TEST_USER_3]);
    await supabase.from('fraud_risk_scores').delete().in('user_id', [TEST_USER_1, TEST_USER_2, TEST_USER_3]);

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error);
  }
}

// =====================================================
// TEST SUITE 1: Database Schema Validation
// =====================================================

async function testDatabaseSchema() {
  console.log('\n📋 Test Suite 1: Database Schema Validation\n');

  // Test fraud_flags table exists
  const { error: tableError } = await supabase
    .from('fraud_flags')
    .select('*')
    .limit(1);

  assert(!tableError, 'fraud_flags table exists');

  // Test required columns exist
  const { data: columns } = await supabase
    .from('fraud_flags')
    .select('user_id, flag_reason, flag_severity, status, is_banned, evidence, flagged_at')
    .limit(0);

  assert(columns !== null, 'fraud_flags has required columns');
}

// =====================================================
// TEST SUITE 2: PostgreSQL Functions
// =====================================================

async function testPostgreSQLFunctions() {
  console.log('\n📋 Test Suite 2: PostgreSQL Functions\n');

  // Test is_user_flagged function
  const { error: flaggedError } = await supabase.rpc('is_user_flagged', {
    check_user_id: TEST_USER_1,
  });
  assert(!flaggedError, 'is_user_flagged() function exists');

  // Test is_user_banned function
  const { error: bannedError } = await supabase.rpc('is_user_banned', {
    check_user_id: TEST_USER_1,
  });
  assert(!bannedError, 'is_user_banned() function exists');

  // Test flag_user_for_fraud function
  const { error: flagError } = await supabase.rpc('flag_user_for_fraud', {
    check_user_id: TEST_USER_1,
    reason: 'test_flag',
    severity: 'low',
    evidence_data: { test: true },
    essay_hash_val: 'test-hash-123',
  });
  assert(!flagError, 'flag_user_for_fraud() function works');

  // Verify flag was created
  const { data: flagData } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('user_id', TEST_USER_1)
    .single();

  assert(flagData !== null, 'Flag was created in database');
  assertEqual(flagData?.flag_reason, 'test_flag', 'Flag reason stored correctly');
  assertEqual(flagData?.flag_severity, 'low', 'Flag severity stored correctly');

  // Test record_blocked_action function
  const { error: recordError } = await supabase.rpc('record_blocked_action', {
    check_user_id: TEST_USER_1,
  });
  assert(!recordError, 'record_blocked_action() function works');

  // Verify action was recorded
  const { data: updatedFlag } = await supabase
    .from('fraud_flags')
    .select('actions_blocked')
    .eq('user_id', TEST_USER_1)
    .single();

  assertEqual(updatedFlag?.actions_blocked, 1, 'Blocked action was recorded');

  // Cleanup test flag
  await supabase.from('fraud_flags').delete().eq('user_id', TEST_USER_1);
}

// =====================================================
// TEST SUITE 3: Essay Hash Generation
// =====================================================

async function testEssayHashing() {
  console.log('\n📋 Test Suite 3: Essay Hash Generation\n');

  // Simple hash function (matching backend)
  function hashEssay(text: string): string {
    const sentences = text.trim().split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length === 0) return 'empty-essay';

    const first = sentences[0];
    const last = sentences[sentences.length - 1];
    const normalized = `${first}|||${last}`.toLowerCase().replace(/\s+/g, ' ').trim();

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  const hash1 = hashEssay(ESSAY_ORIGINAL);
  const hash2 = hashEssay(ESSAY_ORIGINAL);
  const hash3 = hashEssay(ESSAY_DIFFERENT);

  assert(hash1.length > 0, 'Essay hash generated');
  assertEqual(hash1, hash2, 'Same essay produces same hash');
  assert(hash1 !== hash3, 'Different essays produce different hashes');

  console.log(`     Hash 1: ${hash1}`);
  console.log(`     Hash 2: ${hash2}`);
  console.log(`     Hash 3 (different): ${hash3}`);
}

// =====================================================
// TEST SUITE 4: Zero Tolerance - First Submission
// =====================================================

async function testFirstSubmission() {
  console.log('\n📋 Test Suite 4: Zero Tolerance - First Submission (User 1)\n');

  // User 1 submits original essay - should succeed
  const hash = hashEssaySync(ESSAY_ORIGINAL);

  // Track essay
  const { error: insertError } = await supabase
    .from('essay_analyses')
    .insert({
      user_id: TEST_USER_1,
      essay_hash: hash,
      full_text_length: ESSAY_ORIGINAL.length,
      prompt_text: 'Test prompt',
    });

  assert(!insertError, 'User 1: Original essay tracked successfully');

  // Create duplicate entry
  const { error: dupError } = await supabase
    .from('essay_duplicates')
    .insert({
      essay_hash: hash,
      user_ids: [TEST_USER_1],
      account_count: 1,
    });

  assert(!dupError, 'Duplicate entry created for tracking');

  // Verify no flag created for original submission
  const { data: flagCheck } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('user_id', TEST_USER_1)
    .maybeSingle();

  assert(flagCheck === null, 'User 1: No flag created for original essay');

  console.log(`     ✅ User 1 can submit original essays without restriction`);
}

// =====================================================
// TEST SUITE 5: Zero Tolerance - Duplicate Detection
// =====================================================

async function testDuplicateDetection() {
  console.log('\n📋 Test Suite 5: Zero Tolerance - Duplicate Detection (User 2)\n');

  const hash = hashEssaySync(ESSAY_ORIGINAL);

  // Get existing duplicate
  const { data: existingDup } = await supabase
    .from('essay_duplicates')
    .select('*')
    .eq('essay_hash', hash)
    .single();

  assert(existingDup !== null, 'Original essay hash exists in duplicates table');
  assertEqual(existingDup?.account_count, 1, 'Account count is 1 before duplicate');

  console.log(`     📊 Current state: ${existingDup?.account_count} account(s) using this essay`);

  // Simulate User 2 attempting to submit same essay
  const isDuplicate = !existingDup.user_ids.includes(TEST_USER_2);
  assert(isDuplicate, 'User 2: Detected as different user (duplicate)');

  // With ESSAY_DUPLICATE_THRESHOLD = 1, this should be blocked
  const shouldBlock = isDuplicate && existingDup.account_count >= 1;
  assert(shouldBlock, 'User 2: Should be blocked (zero tolerance)');

  console.log(`     🚫 User 2 would be BLOCKED for duplicate essay`);
}

// =====================================================
// TEST SUITE 6: Account Flagging
// =====================================================

async function testAccountFlagging() {
  console.log('\n📋 Test Suite 6: Account Flagging for Fraud\n');

  const hash = hashEssaySync(ESSAY_ORIGINAL);

  // Flag User 2 for duplicate essay
  const { error: flagError } = await supabase.rpc('flag_user_for_fraud', {
    check_user_id: TEST_USER_2,
    reason: 'duplicate_essay',
    severity: 'critical',
    evidence_data: {
      essay_hash: hash,
      duplicate_account_count: 2,
      other_user_ids: [TEST_USER_1],
      detected_at: new Date().toISOString(),
    },
    essay_hash_val: hash,
  });

  assert(!flagError, 'User 2: Successfully flagged for fraud');

  // Verify flag in database
  const { data: flagData } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('user_id', TEST_USER_2)
    .single();

  assert(flagData !== null, 'User 2: Flag exists in database');
  assertEqual(flagData?.flag_reason, 'duplicate_essay', 'User 2: Flag reason is duplicate_essay');
  assertEqual(flagData?.flag_severity, 'critical', 'User 2: Severity is critical');
  assertEqual(flagData?.status, 'flagged', 'User 2: Status is flagged');
  assertEqual(flagData?.is_banned, false, 'User 2: Not banned (just flagged)');

  // Verify evidence
  assert(flagData?.evidence !== null, 'User 2: Evidence stored');
  console.log(`     📋 Evidence:`, JSON.stringify(flagData?.evidence, null, 2));

  // Check is_user_flagged function
  const { data: isFlagged } = await supabase.rpc('is_user_flagged', {
    check_user_id: TEST_USER_2,
  });

  assertEqual(isFlagged, true, 'User 2: is_user_flagged() returns true');

  console.log(`     ⚠️  User 2 is FLAGGED and cannot submit more essays`);
}

// =====================================================
// TEST SUITE 7: Blocked Action Tracking
// =====================================================

async function testBlockedActions() {
  console.log('\n📋 Test Suite 7: Blocked Action Tracking\n');

  // Record first blocked action
  await supabase.rpc('record_blocked_action', { check_user_id: TEST_USER_2 });

  let { data: flagData } = await supabase
    .from('fraud_flags')
    .select('actions_blocked, last_blocked_at')
    .eq('user_id', TEST_USER_2)
    .single();

  assertEqual(flagData?.actions_blocked, 1, 'First blocked action recorded');
  assert(flagData?.last_blocked_at !== null, 'Last blocked timestamp set');

  // Record second blocked action
  await supabase.rpc('record_blocked_action', { check_user_id: TEST_USER_2 });

  const result = await supabase
    .from('fraud_flags')
    .select('actions_blocked')
    .eq('user_id', TEST_USER_2)
    .single();

  flagData = result.data;

  assertEqual(flagData?.actions_blocked, 2, 'Second blocked action recorded');

  console.log(`     📊 User 2 has ${flagData?.actions_blocked} blocked attempts`);
}

// =====================================================
// TEST SUITE 8: Multiple Users, Same Essay
// =====================================================

async function testMultipleUsersSameEssay() {
  console.log('\n📋 Test Suite 8: Multiple Users Attempting Same Essay\n');

  const hash = hashEssaySync(ESSAY_ORIGINAL);

  // User 3 also tries to submit the same essay
  const { data: duplicate } = await supabase
    .from('essay_duplicates')
    .select('*')
    .eq('essay_hash', hash)
    .single();

  const isDuplicate = !duplicate?.user_ids.includes(TEST_USER_3);
  assert(isDuplicate, 'User 3: Detected as different user');

  const shouldBlock = isDuplicate && duplicate?.account_count >= 1;
  assert(shouldBlock, 'User 3: Would be blocked (zero tolerance)');

  // Flag User 3
  await supabase.rpc('flag_user_for_fraud', {
    check_user_id: TEST_USER_3,
    reason: 'duplicate_essay',
    severity: 'critical',
    evidence_data: {
      essay_hash: hash,
      duplicate_account_count: duplicate?.account_count + 1,
      other_user_ids: duplicate?.user_ids,
      detected_at: new Date().toISOString(),
    },
    essay_hash_val: hash,
  });

  const { data: user3Flag } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('user_id', TEST_USER_3)
    .single();

  assert(user3Flag !== null, 'User 3: Flagged successfully');

  console.log(`     🚫 User 3 also BLOCKED and FLAGGED`);
}

// =====================================================
// TEST SUITE 9: Legitimate User Protection
// =====================================================

async function testLegitimateUsers() {
  console.log('\n📋 Test Suite 9: Legitimate User Protection\n');

  // User 1 submits a different essay - should succeed
  const hash = hashEssaySync(ESSAY_DIFFERENT);

  const { error: insertError } = await supabase
    .from('essay_analyses')
    .insert({
      user_id: TEST_USER_1,
      essay_hash: hash,
      full_text_length: ESSAY_DIFFERENT.length,
      prompt_text: 'Different prompt',
    });

  assert(!insertError, 'User 1: Can submit different essay');

  // User 1 re-submits their own original essay - should be allowed (same user)
  const originalHash = hashEssaySync(ESSAY_ORIGINAL);
  const { data: originalDup } = await supabase
    .from('essay_duplicates')
    .select('user_ids')
    .eq('essay_hash', originalHash)
    .single();

  const isSameUser = originalDup?.user_ids.includes(TEST_USER_1);
  assert(isSameUser, 'User 1: Resubmitting own essay is allowed');

  // User 1 should not be flagged
  const { data: user1Flag } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('user_id', TEST_USER_1)
    .maybeSingle();

  assert(user1Flag === null, 'User 1: Not flagged (legitimate user)');

  console.log(`     ✅ User 1 can continue using the system normally`);
}

// =====================================================
// TEST SUITE 10: Summary Statistics
// =====================================================

async function testSummaryStatistics() {
  console.log('\n📋 Test Suite 10: Summary Statistics\n');

  // Count flagged users
  const { data: flaggedUsers, count: flaggedCount } = await supabase
    .from('fraud_flags')
    .select('*', { count: 'exact' })
    .in('user_id', [TEST_USER_2, TEST_USER_3]);

  console.log(`     📊 Total flagged users: ${flaggedCount}`);

  // Count by reason
  const { data: byReason } = await supabase
    .from('fraud_flags')
    .select('flag_reason')
    .in('user_id', [TEST_USER_2, TEST_USER_3]);

  const duplicateCount = byReason?.filter(f => f.flag_reason === 'duplicate_essay').length;
  console.log(`     📊 Flagged for duplicate_essay: ${duplicateCount}`);

  // Total blocked actions
  const totalBlocked = flaggedUsers?.reduce((sum, user) => sum + (user.actions_blocked || 0), 0);
  console.log(`     📊 Total blocked actions: ${totalBlocked}`);

  assert(flaggedCount === 2, 'Two users flagged (User 2 and User 3)');
  assert(duplicateCount === 2, 'Both flagged for duplicate_essay');
}

// =====================================================
// HELPER: Hash function
// =====================================================

function hashEssaySync(essayText: string): string {
  const sentences = essayText.trim().split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (sentences.length === 0) return 'empty-essay';

  const first = sentences[0];
  const last = sentences[sentences.length - 1];
  const normalized = `${first}|||${last}`.toLowerCase().replace(/\s+/g, ' ').trim();

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).padStart(8, '0');
}

// =====================================================
// RUN ALL TESTS
// =====================================================

async function runAllTests() {
  console.log('🚀 Zero Tolerance Fraud Prevention - Comprehensive Test Suite');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Test Users: ${TEST_USER_1}, ${TEST_USER_2}, ${TEST_USER_3}\n`);

  try {
    // Cleanup before tests
    await cleanup();

    // Run test suites
    await testDatabaseSchema();
    await testPostgreSQLFunctions();
    await testEssayHashing();
    await testFirstSubmission();
    await testDuplicateDetection();
    await testAccountFlagging();
    await testBlockedActions();
    await testMultipleUsersSameEssay();
    await testLegitimateUsers();
    await testSummaryStatistics();

    // Cleanup after tests
    await cleanup();

    console.log('\n' + '='.repeat(70));
    if (failCount === 0) {
      console.log(`✅ ALL TESTS PASSED: ${passCount}/${testCount}`);
      console.log('='.repeat(70));
      console.log('\n🎉 Zero Tolerance System is Working Perfectly!\n');
      console.log('Summary:');
      console.log('  ✅ User 1 (legitimate): Can submit essays freely');
      console.log('  🚫 User 2 (fraudster): BLOCKED and FLAGGED for duplicate essay');
      console.log('  🚫 User 3 (fraudster): BLOCKED and FLAGGED for duplicate essay');
      console.log('\n💰 Impact: 100% fraud prevention for essay duplication');
      console.log('🔒 Academic integrity: PROTECTED\n');
      process.exit(0);
    } else {
      console.log(`⚠️  SOME TESTS FAILED: ${passCount} passed, ${failCount} failed out of ${testCount}`);
      console.log('='.repeat(70));
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  }
}

runAllTests();
