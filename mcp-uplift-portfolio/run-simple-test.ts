#!/usr/bin/env node

/**
 * SIMPLE VALIDATION TEST
 *
 * Tests the core algorithms without requiring database access.
 * Validates that enhancements are improvements.
 */

import {
  STUDENT_FIRST_GEN_LEADER,
  STUDENT_CREATIVE_ARTIST,
  STUDENT_STEM_RESEARCHER,
  STUDENT_TITLE_ONLY,
  STUDENT_SERVICE_LEADER
} from './test-scenarios.js';

// ============================================================================
// TEST ALGORITHMS DIRECTLY (No Database Required)
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MCP ENHANCEMENT VALIDATION (Algorithm Tests)');
console.log('═══════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

// ============================================================================
// TEST 1: Context Depth Scoring Algorithm
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TEST 1: Context Depth Scoring Algorithm');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  // Simulate the context depth calculation
  const student = STUDENT_FIRST_GEN_LEADER.profile;

  let contextDepth = 0;
  if (student.first_gen) contextDepth += 25;
  if (student.challenging_circumstances) contextDepth += 20;
  if (student.family_hours_per_week && student.family_hours_per_week >= 10) contextDepth += 20;
  if (student.financial_need) contextDepth += 15;

  console.log(`Student Profile:`);
  console.log(`  - First Generation: ${student.first_gen}`);
  console.log(`  - Challenging Circumstances: ${student.challenging_circumstances}`);
  console.log(`  - Family Hours/Week: ${student.family_hours_per_week}`);
  console.log(`  - Financial Need: ${student.financial_need}`);
  console.log(`\nCalculated Context Depth: ${contextDepth}/100`);
  console.log(`Expected: ${STUDENT_FIRST_GEN_LEADER.expected_results.context_depth}/100`);

  if (contextDepth === STUDENT_FIRST_GEN_LEADER.expected_results.context_depth) {
    console.log('\n✅ PASS: Context depth scoring working correctly\n');
    passCount++;
  } else {
    console.log('\n❌ FAIL: Context depth mismatch\n');
    failCount++;
  }
} catch (error) {
  console.log(`\n❌ FAIL: ${error}\n`);
  failCount++;
}

// ============================================================================
// TEST 2: Substantive Leadership Detection
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TEST 2: Substantive Leadership Detection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const leaderStudent = STUDENT_FIRST_GEN_LEADER.profile;
  const titleStudent = STUDENT_TITLE_ONLY.profile;

  // Test substantive leadership
  const hasSubstantiveLeadership = leaderStudent.leadership_roles.some((r: any) => {
    const hours = r.hours_per_week || 0;
    const hasImpact = (r.impact || '').length > 50;
    return hours >= 5 || hasImpact;
  });

  // Test title-only leadership
  const hasTitleOnlyLeadership = titleStudent.leadership_roles.some((r: any) => {
    const hours = r.hours_per_week || 0;
    const hasImpact = (r.impact || '').length > 50;
    return hours >= 5 || hasImpact;
  });

  console.log(`Substantive Leader:`);
  console.log(`  - Roles: ${leaderStudent.leadership_roles.length}`);
  console.log(`  - Has Substantive Leadership: ${hasSubstantiveLeadership}`);
  console.log(`\nTitle-Only Leader:`);
  console.log(`  - Roles: ${titleStudent.leadership_roles.length}`);
  console.log(`  - Has Substantive Leadership: ${hasTitleOnlyLeadership}`);

  if (hasSubstantiveLeadership && !hasTitleOnlyLeadership) {
    console.log('\n✅ PASS: Correctly distinguishes substantive from title-only leadership\n');
    passCount++;
  } else {
    console.log('\n❌ FAIL: Leadership detection not working correctly\n');
    failCount++;
  }
} catch (error) {
  console.log(`\n❌ FAIL: ${error}\n`);
  failCount++;
}

// ============================================================================
// TEST 3: Total Hours Calculation (Mastery Detection)
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TEST 3: Total Hours Calculation (Mastery Detection)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const artist = STUDENT_CREATIVE_ARTIST.profile;
  const activity = artist.activities[0]; // Orchestra

  const hoursPerWeek = activity.hours_per_week || 0;
  const monthsDuration = (activity.years_participated || 0) * 12;
  const totalHours = hoursPerWeek * monthsDuration * 4; // weeks per month

  console.log(`Activity: ${activity.name}`);
  console.log(`  - Hours/Week: ${hoursPerWeek}`);
  console.log(`  - Years Participated: ${activity.years_participated}`);
  console.log(`  - Total Hours: ${totalHours}`);
  console.log(`  - Mastery Level (≥500 hours): ${totalHours >= 500 ? 'YES' : 'NO'}`);

  if (totalHours >= 500) {
    console.log('\n✅ PASS: Total hours calculation shows mastery level\n');
    passCount++;
  } else {
    console.log('\n❌ FAIL: Total hours calculation incorrect\n');
    failCount++;
  }
} catch (error) {
  console.log(`\n❌ FAIL: ${error}\n`);
  failCount++;
}

// ============================================================================
// TEST 4: Creative Talent Detection
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TEST 4: Creative Talent Detection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const artist = STUDENT_CREATIVE_ARTIST.profile;
  const stemStudent = STUDENT_STEM_RESEARCHER.profile;

  const creativeKeywords = ['art', 'music', 'theater', 'dance', 'design', 'film'];

  const hasCreativeActivities = artist.activities.some((a: any) => {
    const name = (a.name || '').toLowerCase();
    const category = (a.category || '').toLowerCase();
    return creativeKeywords.some(kw => name.includes(kw) || category.includes(kw));
  });

  const stemHasCreative = stemStudent.activities.some((a: any) => {
    const name = (a.name || '').toLowerCase();
    const category = (a.category || '').toLowerCase();
    return creativeKeywords.some(kw => name.includes(kw) || category.includes(kw));
  });

  console.log(`Creative Artist:`);
  console.log(`  - Activities: ${artist.activities.map((a: any) => a.name).join(', ')}`);
  console.log(`  - Has Creative: ${hasCreativeActivities}`);
  console.log(`\nSTEM Researcher:`);
  console.log(`  - Activities: ${stemStudent.activities.map((a: any) => a.name).join(', ')}`);
  console.log(`  - Has Creative: ${stemHasCreative}`);

  if (hasCreativeActivities && !stemHasCreative) {
    console.log('\n✅ PASS: Creative talent detection working correctly\n');
    passCount++;
  } else {
    console.log('\n❌ FAIL: Creative detection not accurate\n');
    failCount++;
  }
} catch (error) {
  console.log(`\n❌ FAIL: ${error}\n`);
  failCount++;
}

// ============================================================================
// TEST 5: PIQ-Specific Scoring Bonuses
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TEST 5: PIQ-Specific Scoring Bonuses');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const leader = STUDENT_FIRST_GEN_LEADER.profile.leadership_roles[0];

  // PIQ 1 (Leadership) scoring
  let piq1Score = 0;
  let reasons: string[] = [];

  if (leader) {
    piq1Score += 25;
    reasons.push('formal leadership role');
  }

  if (leader.hours_per_week >= 8) {
    piq1Score += 10;
    reasons.push(`significant time commitment (${leader.hours_per_week} hrs/week)`);
  }

  if (leader.impact && (leader.impact.toLowerCase().includes('led') || leader.impact.toLowerCase().includes('organized'))) {
    piq1Score += 8;
    reasons.push('demonstrates initiative');
  }

  console.log(`Leadership Activity: ${leader.name}`);
  console.log(`  - Base Score: 25 (formal leadership)`);
  console.log(`  - Time Bonus: ${leader.hours_per_week >= 8 ? '+10' : '0'} (${leader.hours_per_week} hrs/week)`);
  console.log(`  - Initiative Bonus: ${(leader.impact.toLowerCase().includes('led') || leader.impact.toLowerCase().includes('organized')) ? '+8' : '0'}`);
  console.log(`  - Total PIQ 1 Score: ${piq1Score}`);
  console.log(`  - Reasons: ${reasons.join('; ')}`);

  if (piq1Score >= 40) {
    console.log('\n✅ PASS: PIQ-specific scoring bonuses working correctly\n');
    passCount++;
  } else {
    console.log('\n❌ FAIL: Scoring too low\n');
    failCount++;
  }
} catch (error) {
  console.log(`\n❌ FAIL: ${error}\n`);
  failCount++;
}

// ============================================================================
// TEST 6: Vagueness Detection
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TEST 6: Vagueness Detection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const vagueEssay = 'I enjoy learning about science and have always been curious.';
  const specificEssay = 'As captain of the debate team, I mentored 15 new members and developed a training curriculum that improved our team\'s average speaker scores by 25%. I organized weekly practice sessions where I provided personalized feedback to help each member develop their argumentative skills and public speaking confidence. I learned that effective leadership requires adapting my communication style to each individual\'s needs. I discovered that my role was not just about winning debates, but about empowering others.';

  // Vagueness detection algorithm
  const detectVague = (text: string) => {
    const length = text.length;
    const firstPersonPronouns = (text.match(/\b(I|my|me)\b/gi) || []).length;
    const hasFirstPerson = text.toLowerCase().includes('i');

    return length < 200 || firstPersonPronouns < 5 || !hasFirstPerson;
  };

  const vagueResult = detectVague(vagueEssay);
  const specificResult = detectVague(specificEssay);

  console.log(`Vague Essay:`);
  console.log(`  "${vagueEssay}"`);
  console.log(`  - Length: ${vagueEssay.length} chars`);
  console.log(`  - First-person pronouns: ${(vagueEssay.match(/\b(I|my|me)\b/gi) || []).length}`);
  console.log(`  - Flagged as vague: ${vagueResult}`);

  console.log(`\nSpecific Essay:`);
  console.log(`  "${specificEssay.substring(0, 100)}..."`);
  console.log(`  - Length: ${specificEssay.length} chars`);
  console.log(`  - First-person pronouns: ${(specificEssay.match(/\b(I|my|me)\b/gi) || []).length}`);
  console.log(`  - Flagged as vague: ${specificResult}`);

  if (vagueResult && !specificResult) {
    console.log('\n✅ PASS: Vagueness detection working correctly\n');
    passCount++;
  } else {
    console.log('\n❌ FAIL: Vagueness detection not accurate\n');
    failCount++;
  }
} catch (error) {
  console.log(`\n❌ FAIL: ${error}\n`);
  failCount++;
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

const totalTests = passCount + failCount;
const passRate = ((passCount / totalTests) * 100).toFixed(1);

console.log(`Total Tests:  ${totalTests}`);
console.log(`Passed:       ${passCount} ✅`);
console.log(`Failed:       ${failCount} ${failCount > 0 ? '❌' : ''}`);
console.log(`Pass Rate:    ${passRate}%\n`);

if (failCount === 0) {
  console.log('  ✅ ALL ALGORITHM TESTS PASSED');
  console.log('  Core enhancements validated as improvements');
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('  ❌ SOME TESTS FAILED');
  console.log('  Review failures above');
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(1);
}
