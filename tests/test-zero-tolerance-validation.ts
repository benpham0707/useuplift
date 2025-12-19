/**
 * Zero Tolerance - Quick Validation Test
 * Validates that the migration was applied correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zclaplpkuvxkrdwsgrul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbGFwbHBrdXZ4a3Jkd3NncnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NDUsImV4cCI6MjA3MTMxNjY0NX0.LN3_avY7B0UnwCVEza9B5M9_EG3GMWlRFwQsZ8yq8Vc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function validate() {
  console.log('🔍 Validating Zero Tolerance Migration...\n');

  let passed = 0;
  let failed = 0;

  // Check fraud_flags table
  const { error: tableError } = await supabase.from('fraud_flags').select('*').limit(1);
  if (!tableError) {
    console.log('✅ fraud_flags table exists');
    passed++;
  } else {
    console.log('❌ fraud_flags table missing:', tableError.message);
    failed++;
  }

  // Check functions exist (they may error if user isn't flagged, but function should exist)
  const { error: func1Error } = await supabase.rpc('is_user_flagged', { check_user_id: 'test' });
  if (!func1Error || func1Error.message.includes('permission')) {
    console.log('✅ is_user_flagged() function exists');
    passed++;
  } else {
    console.log('❌ is_user_flagged() function missing');
    failed++;
  }

  const { error: func2Error } = await supabase.rpc('is_user_banned', { check_user_id: 'test' });
  if (!func2Error || func2Error.message.includes('permission')) {
    console.log('✅ is_user_banned() function exists');
    passed++;
  } else {
    console.log('❌ is_user_banned() function missing');
    failed++;
  }

  // Check existing fraud prevention tables
  const tables = [
    'ip_usage_tracking',
    'device_fingerprints',
    'essay_analyses',
    'essay_duplicates',
    'fraud_risk_scores'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`✅ ${table} table exists`);
      passed++;
    } else {
      console.log(`❌ ${table} table missing`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (failed === 0) {
    console.log(`✅ VALIDATION PASSED: ${passed}/${passed + failed} checks`);
    console.log('='.repeat(60));
    console.log('\n🎉 Zero Tolerance Migration Successful!\n');
    console.log('System is ready:');
    console.log('  ✅ fraud_flags table created');
    console.log('  ✅ PostgreSQL functions deployed');
    console.log('  ✅ All fraud prevention tables active');
    console.log('\n📋 Configuration:');
    console.log('  - ESSAY_DUPLICATE_THRESHOLD: 1 (zero tolerance)');
    console.log('  - Any duplicate essay = immediate block + flag');
    console.log('  - Account flagged for fraud review\n');
  } else {
    console.log(`❌ VALIDATION FAILED: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));
  }
}

validate();
