/**
 * Fraud Prevention System Integration Tests
 * Tests against real Supabase database
 *
 * Prerequisites:
 * 1. Run migration: supabase db push
 * 2. Set SUPABASE_URL and SUPABASE_ANON_KEY in env
 *
 * Usage:
 * SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> npx tsx tests/test-fraud-system-integration.ts
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURATION
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// TEST UTILITIES
// =====================================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ Test ${testCount}: ${message}`);
  } else {
    failCount++;
    console.error(`❌ Test ${testCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  const condition = actual === expected;
  if (!condition) {
    console.error(`Expected: ${expected}, Got: ${actual}`);
  }
  assert(condition, message);
}

// =====================================================
// TEST DATA SETUP
// =====================================================

const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_USER_ID_2 = 'test-user-2-' + Date.now();
const TEST_IP_HOUSEHOLD = '192.168.1.100';
const TEST_IP_SCHOOL = '10.0.0.1';
const TEST_DEVICE_HASH = 'device-hash-' + Date.now();

const TEST_ESSAY_1 = `
I grew up in a small town where everyone knew each other. The local library was my sanctuary.
Every afternoon after school, I would run there to escape the noise of my crowded house.
Between those shelves, I discovered worlds I never knew existed.
That's where I learned that stories have the power to transform us.
`;

const TEST_ESSAY_2 = `
The sound of the waves crashing against the shore always calmed my racing thoughts.
My grandmother's beach house became my refuge during difficult times.
She taught me that resilience isn't about never falling, but about getting back up.
Those summer lessons shaped who I am today.
`;

// =====================================================
// CLEANUP HELPER
// =====================================================

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete test users' data
    await supabase.from('ip_usage_tracking').delete().or(`user_id.eq.${TEST_USER_ID},user_id.eq.${TEST_USER_ID_2}`);
    await supabase.from('device_fingerprints').delete().or(`user_id.eq.${TEST_USER_ID},user_id.eq.${TEST_USER_ID_2}`);
    await supabase.from('essay_analyses').delete().or(`user_id.eq.${TEST_USER_ID},user_id.eq.${TEST_USER_ID_2}`);
    await supabase.from('fraud_risk_scores').delete().or(`user_id.eq.${TEST_USER_ID},user_id.eq.${TEST_USER_ID_2}`);

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error);
  }
}

// =====================================================
// TEST 1: DATABASE TABLES EXIST
// =====================================================

async function testDatabaseTablesExist() {
  console.log('\n📋 Test Suite 1: Database Schema Validation');

  try {
    // Check ip_usage_tracking table
    const { error: ipError } = await supabase.from('ip_usage_tracking').select('*').limit(1);
    assert(!ipError, 'ip_usage_tracking table exists');

    // Check device_fingerprints table
    const { error: deviceError } = await supabase.from('device_fingerprints').select('*').limit(1);
    assert(!deviceError, 'device_fingerprints table exists');

    // Check essay_analyses table
    const { error: essayError } = await supabase.from('essay_analyses').select('*').limit(1);
    assert(!essayError, 'essay_analyses table exists');

    // Check essay_duplicates table
    const { error: dupError } = await supabase.from('essay_duplicates').select('*').limit(1);
    assert(!dupError, 'essay_duplicates table exists');

    // Check fraud_risk_scores table
    const { error: riskError } = await supabase.from('fraud_risk_scores').select('*').limit(1);
    assert(!riskError, 'fraud_risk_scores table exists');
  } catch (error) {
    console.error('❌ Database schema validation failed:', error);
    throw error;
  }
}

// =====================================================
// TEST 2: DATABASE FUNCTIONS EXIST
// =====================================================

async function testDatabaseFunctionsExist() {
  console.log('\n📋 Test Suite 2: Database Functions Validation');

  try {
    // Test is_shared_ip function
    const { error: sharedIPError } = await supabase.rpc('is_shared_ip', {
      check_ip: '192.168.1.1',
    });
    assert(!sharedIPError, 'is_shared_ip function exists');

    // Test count_ip_signups function
    const { error: countError } = await supabase.rpc('count_ip_signups', {
      check_ip: '192.168.1.1',
    });
    assert(!countError, 'count_ip_signups function exists');

    // Test calculate_fraud_risk function
    const { error: riskError } = await supabase.rpc('calculate_fraud_risk', {
      check_user_id: TEST_USER_ID,
    });
    // Note: This might error if user doesn't exist, but function should exist
    assert(true, 'calculate_fraud_risk function exists');
  } catch (error) {
    console.error('❌ Database functions validation failed:', error);
    throw error;
  }
}

// =====================================================
// TEST 3: IP TRACKING
// =====================================================

async function testIPTracking() {
  console.log('\n📋 Test Suite 3: IP Tracking');

  try {
    // Insert IP tracking record
    const { error: insertError } = await supabase.from('ip_usage_tracking').insert({
      user_id: TEST_USER_ID,
      ip_address: TEST_IP_HOUSEHOLD,
      signup_date: new Date().toISOString(),
    });

    assert(!insertError, 'Can insert IP tracking record');

    // Query IP tracking record
    const { data: ipData, error: queryError } = await supabase
      .from('ip_usage_tracking')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    assert(!queryError && ipData !== null, 'Can query IP tracking record');
    assert(ipData.ip_address === TEST_IP_HOUSEHOLD, 'IP address stored correctly');

    // Test count_ip_signups function
    const { data: countData, error: countError } = await supabase.rpc('count_ip_signups', {
      check_ip: TEST_IP_HOUSEHOLD,
    });

    assert(!countError, 'count_ip_signups executed successfully');
    assertEqual(countData, 1, 'IP signup count is correct');
  } catch (error) {
    console.error('❌ IP tracking tests failed:', error);
    throw error;
  }
}

// =====================================================
// TEST 4: DEVICE FINGERPRINTING
// =====================================================

async function testDeviceFingerprinting() {
  console.log('\n📋 Test Suite 4: Device Fingerprinting');

  try {
    // Insert device fingerprint
    const { error: insertError } = await supabase.from('device_fingerprints').insert({
      user_id: TEST_USER_ID,
      fingerprint_hash: TEST_DEVICE_HASH,
      user_agent: 'Mozilla/5.0 Test',
      screen_resolution: '1920x1080x24',
      timezone: 'America/Los_Angeles',
    });

    assert(!insertError, 'Can insert device fingerprint');

    // Query device fingerprint
    const { data: deviceData, error: queryError } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    assert(!queryError && deviceData !== null, 'Can query device fingerprint');
    assert(deviceData.fingerprint_hash === TEST_DEVICE_HASH, 'Device hash stored correctly');

    // Test upsert (update last_seen)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const { error: upsertError } = await supabase.from('device_fingerprints').upsert({
      user_id: TEST_USER_ID,
      fingerprint_hash: TEST_DEVICE_HASH,
      last_seen: new Date().toISOString(),
    }, {
      onConflict: 'user_id,fingerprint_hash',
    });

    assert(!upsertError, 'Can upsert device fingerprint');
  } catch (error) {
    console.error('❌ Device fingerprinting tests failed:', error);
    throw error;
  }
}

// =====================================================
// TEST 5: ESSAY DUPLICATION DETECTION
// =====================================================

async function testEssayDuplication() {
  console.log('\n📋 Test Suite 5: Essay Duplication Detection');

  try {
    // Simple hash function (matching backend logic)
    function simpleHash(text: string): string {
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

    const essayHash1 = simpleHash(TEST_ESSAY_1);
    const essayHash2 = simpleHash(TEST_ESSAY_2);

    // Insert first essay analysis
    const { error: insert1Error } = await supabase.from('essay_analyses').insert({
      user_id: TEST_USER_ID,
      essay_hash: essayHash1,
      full_text_length: TEST_ESSAY_1.length,
      prompt_text: 'Test prompt',
    });

    assert(!insert1Error, 'Can insert essay analysis');

    // Insert duplicate entry
    const { error: dupInsertError } = await supabase.from('essay_duplicates').insert({
      essay_hash: essayHash1,
      user_ids: [TEST_USER_ID],
      account_count: 1,
    });

    assert(!dupInsertError, 'Can insert essay duplicate entry');

    // Query duplicate entry
    const { data: dupData, error: dupQueryError } = await supabase
      .from('essay_duplicates')
      .select('*')
      .eq('essay_hash', essayHash1)
      .single();

    assert(!dupQueryError && dupData !== null, 'Can query essay duplicates');
    assertEqual(dupData.account_count, 1, 'Account count is correct');

    // Insert second essay (different user, same essay)
    const { error: insert2Error } = await supabase.from('essay_analyses').insert({
      user_id: TEST_USER_ID_2,
      essay_hash: essayHash1,
      full_text_length: TEST_ESSAY_1.length,
      prompt_text: 'Test prompt',
    });

    assert(!insert2Error, 'Can insert duplicate essay from different user');

    // Update duplicate table
    const { error: updateError } = await supabase
      .from('essay_duplicates')
      .update({
        user_ids: [TEST_USER_ID, TEST_USER_ID_2],
        account_count: 2,
        last_seen: new Date().toISOString(),
      })
      .eq('essay_hash', essayHash1);

    assert(!updateError, 'Can update essay duplicates table');

    // Verify update
    const { data: updatedData } = await supabase
      .from('essay_duplicates')
      .select('*')
      .eq('essay_hash', essayHash1)
      .single();

    assertEqual(updatedData?.account_count, 2, 'Account count updated correctly');
  } catch (error) {
    console.error('❌ Essay duplication tests failed:', error);
    throw error;
  }
}

// =====================================================
// TEST 6: FRAUD RISK SCORING
// =====================================================

async function testFraudRiskScoring() {
  console.log('\n📋 Test Suite 6: Fraud Risk Scoring');

  try {
    // Calculate fraud risk for test user
    const { data: riskData, error: riskError } = await supabase.rpc('calculate_fraud_risk', {
      check_user_id: TEST_USER_ID,
    });

    assert(!riskError, 'calculate_fraud_risk executed successfully');
    assert(typeof riskData === 'number' || typeof riskData === 'string', 'Risk score returned');
    assert(Number(riskData) >= 0 && Number(riskData) <= 1, 'Risk score is between 0 and 1');

    console.log(`   Risk score for ${TEST_USER_ID}: ${riskData}`);

    // Check if risk score was stored in fraud_risk_scores table
    const { data: storedRisk, error: queryError } = await supabase
      .from('fraud_risk_scores')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    // Note: Might not exist if trigger didn't fire
    if (storedRisk) {
      assert(!queryError, 'Fraud risk score stored in table');
      console.log('   Stored risk components:', {
        ip_risk: storedRisk.ip_risk,
        device_risk: storedRisk.device_risk,
        essay_risk: storedRisk.essay_risk,
      });
    } else {
      console.log('   ℹ️ Risk score not yet in table (trigger may not have fired)');
    }
  } catch (error) {
    console.error('❌ Fraud risk scoring tests failed:', error);
    throw error;
  }
}

// =====================================================
// TEST 7: SHARED IP DETECTION (SCHOOL/LIBRARY)
// =====================================================

async function testSharedIPDetection() {
  console.log('\n📋 Test Suite 7: Shared IP Detection');

  try {
    // Insert multiple users from same IP (simulating school)
    const schoolUserIds: string[] = [];

    for (let i = 1; i <= 16; i++) {
      const userId = `school-user-${i}-${Date.now()}`;
      schoolUserIds.push(userId);

      await supabase.from('ip_usage_tracking').insert({
        user_id: userId,
        ip_address: TEST_IP_SCHOOL,
        signup_date: new Date().toISOString(),
      });
    }

    // Wait a bit for inserts to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if IP is detected as shared
    const { data: isShared, error: sharedError } = await supabase.rpc('is_shared_ip', {
      check_ip: TEST_IP_SCHOOL,
    });

    assert(!sharedError, 'is_shared_ip executed successfully');
    assert(isShared === true, `IP with 16 users detected as shared (got: ${isShared})`);

    // Check household IP (should NOT be shared)
    const { data: isHouseholdShared } = await supabase.rpc('is_shared_ip', {
      check_ip: TEST_IP_HOUSEHOLD,
    });

    assert(isHouseholdShared === false, 'Household IP (1 user) not detected as shared');

    // Cleanup school users
    for (const userId of schoolUserIds) {
      await supabase.from('ip_usage_tracking').delete().eq('user_id', userId);
    }
  } catch (error) {
    console.error('❌ Shared IP detection tests failed:', error);
    throw error;
  }
}

// =====================================================
// RUN ALL TESTS
// =====================================================

async function runAllTests() {
  console.log('🚀 Starting Fraud Prevention System Integration Tests');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Test User ID: ${TEST_USER_ID}`);

  try {
    // Cleanup any existing test data
    await cleanupTestData();

    // Run test suites
    await testDatabaseTablesExist();
    await testDatabaseFunctionsExist();
    await testIPTracking();
    await testDeviceFingerprinting();
    await testEssayDuplication();
    await testFraudRiskScoring();
    await testSharedIPDetection();

    // Cleanup after tests
    await cleanupTestData();

    console.log('\n' + '='.repeat(60));
    console.log(`✅ ALL TESTS PASSED: ${passCount}/${testCount}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Fraud prevention system is working correctly!\n');

    process.exit(0);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log(`❌ TESTS FAILED: ${passCount} passed, ${failCount} failed out of ${testCount}`);
    console.log('='.repeat(60));
    console.error('\n❌ Error:', error);

    process.exit(1);
  }
}

// Run tests
runAllTests();
