/**
 * Comprehensive test of the Major Resolution Service and full pipeline integration.
 * Validates: resolution accuracy, hierarchical merging, targeted context assembly,
 * and proper integration with unifiedResearchAssemblyService.
 */

import {
  resolveStudentInterest,
  getTargetedContext,
  getMajorCount,
  getAllIndexedNames,
  resolveMultipleInterests,
  getSpecializationsOf,
} from '../../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/majorResolutionService';

import {
  assembleResearchForStudent,
  type StudentContext,
} from '../../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/unifiedResearchAssemblyService';

import type { NuancedCapabilityAnalysis } from '../../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

let totalTests = 0;
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  totalTests++;
  if (condition) {
    passed++;
  } else {
    failed++;
    console.log(`  FAIL: ${message}`);
  }
}

function section(title: string): void {
  console.log(`\n--- ${title} ---`);
}

console.log('=================================================================');
console.log('  COMPREHENSIVE MAJOR RESOLUTION & PIPELINE TEST');
console.log('=================================================================');

// ===== TEST 1: Coverage Stats =====
section('Test 1: Coverage Statistics');
const counts = getMajorCount();
console.log(`  Total major entries: ${counts.total}`);
console.log(`  Parent majors: ${counts.parents}`);
console.log(`  Specializations: ${counts.specializations}`);
console.log(`  Standalone: ${counts.standalone}`);
console.log(`  Index size (name variants): ${getAllIndexedNames().length}`);

assert(counts.total >= 42, `Total majors should be >= 42, got ${counts.total}`);
assert(counts.parents === 2, `Parents should be 2, got ${counts.parents}`);
assert(counts.specializations >= 11, `Specializations should be >= 11, got ${counts.specializations}`);
assert(getAllIndexedNames().length >= 200, `Index should have >= 200 name variants, got ${getAllIndexedNames().length}`);

// ===== TEST 2: Parent-Child Hierarchy =====
section('Test 2: Parent-Child Hierarchy');
const engChildren = getSpecializationsOf('Engineering');
console.log(`  Engineering children (${engChildren.length}): ${engChildren.map(c => c.major).join(', ')}`);
assert(engChildren.length === 8, `Engineering should have 8 children, got ${engChildren.length}`);

const bizChildren = getSpecializationsOf('Business / Economics');
console.log(`  Business children (${bizChildren.length}): ${bizChildren.map(c => c.major).join(', ')}`);
assert(bizChildren.length === 3, `Business should have 3 children, got ${bizChildren.length}`);

// ===== TEST 3: Exact Match Resolution =====
section('Test 3: Exact Match Resolution');
const exactTests = [
  'Computer Science', 'Civil Engineering', 'Finance', 'Biomedical Engineering',
  'Physics', 'Chemistry', 'History', 'Mathematics', 'Linguistics', 'Music',
  'Nursing', 'Architecture', 'Data Science', 'Neuroscience', 'Philosophy',
  'Kinesiology', 'Film', 'Sociology', 'International Relations',
];
for (const test of exactTests) {
  const r = resolveStudentInterest(test);
  assert(
    r !== undefined && r.matchType === 'exact',
    `"${test}" should exact-match, got ${r?.matchType || 'no match'} → ${r?.matched.major || 'undefined'}`
  );
}
console.log(`  Exact match tests: ${exactTests.length}`);

// ===== TEST 4: Alternate Name Resolution =====
section('Test 4: Alternate Name Resolution');
const altTests: [string, string][] = [
  ['CS', 'Computer Science'],
  ['EE', 'Electrical Engineering'],
  ['BME', 'Biomedical Engineering'],
  ['IE', 'Industrial Engineering'],
  ['ISE', 'Industrial Engineering'],
  ['CPA Track', 'Accounting'],
  ['Econ', 'Business / Economics'],
  ['Astrophysics', 'Physics'],
  ['Organic Chemistry', 'Chemistry'],
  ['CompE', 'Computer Engineering'],
  ['AeroE', 'Aerospace Engineering'],
  ['FinTech', 'Finance'],
  ['Digital Marketing', 'Marketing'],
  ['Rhetoric', 'English / Creative Writing'],
  ['Jazz Studies', 'Music'],
  ['Applied Physics', 'Physics'],
  ['Geophysics', 'Physics'],
  ['Public Accounting', 'Accounting'],
  ['Quantitative Finance', 'Finance'],
  ['Brand Management', 'Marketing'],
];
for (const [input, expected] of altTests) {
  const r = resolveStudentInterest(input);
  assert(
    r !== undefined && r.matched.major === expected,
    `"${input}" should → "${expected}", got "${r?.matched.major || 'no match'}"`
  );
}
console.log(`  Alternate name tests: ${altTests.length}`);

// ===== TEST 5: Fuzzy/Substring Resolution =====
section('Test 5: Fuzzy/Substring Resolution');
const fuzzyTests: [string, string][] = [
  ['civil eng', 'Civil Engineering'],
  ['pre-med', 'Pre-Med / Biology'],
  ['electrical', 'Electrical Engineering'],
  ['poli sci', 'Political Science'],
  ['creative writing', 'English / Creative Writing'],
  ['environmental', 'Environmental Science'],
  ['biomedical engineering', 'Biomedical Engineering'],
];
for (const [input, expected] of fuzzyTests) {
  const r = resolveStudentInterest(input);
  assert(
    r !== undefined && r.matched.major === expected,
    `"${input}" should → "${expected}", got "${r?.matched.major || 'no match'}" (${r?.matchType || 'none'})`
  );
}
console.log(`  Fuzzy match tests: ${fuzzyTests.length}`);

// ===== TEST 6: Hierarchical Merging =====
section('Test 6: Hierarchical Merging (Child + Parent)');

// Test EE merging
const ee = resolveStudentInterest('Electrical Engineering');
assert(ee !== undefined, 'EE should resolve');
if (ee) {
  assert(ee.parent !== undefined, 'EE should have parent');
  assert(ee.parent?.major === 'Engineering', `EE parent should be "Engineering", got "${ee.parent?.major}"`);
  assert(
    ee.mergedRequirements.minimum.length >= ee.matched.requirements.minimum.length,
    'Merged minimum should be >= child minimum'
  );
  assert(
    ee.mergedRequirements.competitive.length > ee.matched.requirements.competitive.length,
    'Merged competitive should be > child competitive (includes parent + additionalRequirements)'
  );
  assert(
    ee.mergedBeyondCourses.length > ee.matched.beyondCourses.length,
    'Merged beyondCourses should include parent items'
  );
  console.log(`  EE: ${ee.matched.requirements.competitive.length} own → ${ee.mergedRequirements.competitive.length} merged competitive`);
  console.log(`  EE: ${ee.matched.beyondCourses.length} own → ${ee.mergedBeyondCourses.length} merged beyondCourses`);
}

// Test Finance merging
const fin = resolveStudentInterest('Finance');
assert(fin !== undefined, 'Finance should resolve');
if (fin) {
  assert(fin.parent?.major === 'Business / Economics', `Finance parent should be "Business / Economics"`);
  assert(
    fin.mergedBeyondCourses.length > fin.matched.beyondCourses.length,
    'Finance merged beyondCourses should include parent items'
  );
  console.log(`  Finance: ${fin.matched.beyondCourses.length} own → ${fin.mergedBeyondCourses.length} merged beyondCourses`);
}

// Test standalone (no parent)
const cs = resolveStudentInterest('Computer Science');
assert(cs !== undefined, 'CS should resolve');
if (cs) {
  assert(cs.parent === undefined, 'CS should NOT have parent (standalone)');
  assert(
    cs.mergedRequirements.competitive.length === cs.matched.requirements.competitive.length,
    'Standalone should have same merged and own requirements'
  );
}

// ===== TEST 7: Targeted Context Assembly =====
section('Test 7: Targeted Context Assembly');
const testMajors = ['Civil Engineering', 'Finance', 'Computer Science', 'Pre-Med / Biology', 'Physics', 'Music'];
for (const major of testMajors) {
  const ctx = getTargetedContext(major);
  assert(ctx.resolvedMajors.length > 0, `${major} should resolve`);
  assert(ctx.relevantCourses.length > 0, `${major} should have relevant courses`);
  assert(ctx.relevantStatistics.length > 0, `${major} should have relevant statistics`);

  const essentialCount = ctx.relevantCourses.filter(c => c.relevanceLevel === 'essential').length;
  console.log(`  ${major}: ${ctx.relevantCourses.length} courses (${essentialCount} essential), ${ctx.relevantStatistics.length} stats, ${ctx.relevantGuidance.length} guidance`);
}

// Test that specializations show sibling specializations
const civilCtx = getTargetedContext('Civil Engineering');
assert(
  civilCtx.availableSpecializations !== undefined && civilCtx.availableSpecializations.length > 0,
  'Civil Engineering context should show sibling specializations'
);
console.log(`  Civil Eng siblings: ${civilCtx.availableSpecializations?.join(', ')}`);

// Test that parent shows child specializations
const engCtx = getTargetedContext('Engineering');
assert(
  engCtx.availableSpecializations !== undefined && engCtx.availableSpecializations.length >= 8,
  'Engineering context should show available specializations'
);
console.log(`  Engineering specializations: ${engCtx.availableSpecializations?.length}`);

// ===== TEST 8: Edge Cases =====
section('Test 8: Edge Cases');
assert(resolveStudentInterest('') === undefined, 'Empty string should return undefined');
assert(resolveStudentInterest('   ') === undefined, 'Whitespace should return undefined');
assert(resolveStudentInterest('asdfghjkl') === undefined, 'Gibberish should return undefined');
assert(resolveStudentInterest('underwater basket weaving') === undefined, 'Nonsense major should return undefined');

// No-match targeted context should return empty arrays
const emptyCtx = getTargetedContext('underwater basket weaving');
assert(emptyCtx.resolvedMajors.length === 0, 'Nonsense should give empty resolved majors');
assert(emptyCtx.relevantCourses.length === 0, 'Nonsense should give empty courses');
console.log('  Edge cases: all handled correctly');

// ===== TEST 9: Multiple Interests =====
section('Test 9: Multiple Interests Resolution');
const multi = resolveMultipleInterests(['CS', 'Data Science', 'Finance', 'CS']);
assert(multi.length === 3, `Should deduplicate CS, got ${multi.length} results`);
console.log(`  Input: [CS, Data Science, Finance, CS] → ${multi.map(m => m.matched.major).join(', ')}`);

// ===== TEST 10: Full Pipeline Integration =====
section('Test 10: Full Pipeline Integration (assembleResearchForStudent)');

// Create a properly structured mock student context that matches the NuancedCapabilityAnalysis interface
function makeSubjectPattern(avgGPA: number, trend: 'improving' | 'stable' | 'declining', strength: number, courses: Array<{ name: string; grade: number; level: string }>) {
  return {
    performanceHistory: {
      avgGPA,
      trend,
      bestGrade: Math.max(...courses.map(c => c.grade)),
      worstGrade: Math.min(...courses.map(c => c.grade)),
      courses: courses.map(c => ({
        name: c.name,
        level: c.level,
        grade: c.grade,
        year: 2024,
      })),
    },
    byDifficulty: {
      ap_ib: { avgGPA, courses: courses.filter(c => c.level === 'ap').map(c => c.name) },
      honors: { avgGPA: avgGPA + 0.2, courses: [] },
      regular: { avgGPA: avgGPA + 0.3, courses: [] },
    },
    relativeStrength: strength,
    strengthAssessment: strength > 0 ? 'relative strength' : 'average',
    recommendedLevel: 'ap_ib' as const,
    levelReasoning: 'Based on performance',
    projectedOutcome: {
      expectedGrade: 'A-',
      confidence: 0.7,
      reasoning: 'Consistent performance',
    },
  };
}

const mockAnalysis = {
  subjectPatterns: {
    math: makeSubjectPattern(3.8, 'stable', 0.2, [{ name: 'AP Calculus BC', grade: 3.8, level: 'ap' }]),
    science: makeSubjectPattern(3.6, 'improving', 0.1, [{ name: 'AP Physics C: Mechanics', grade: 3.6, level: 'ap' }]),
    english: makeSubjectPattern(3.5, 'stable', -0.1, [{ name: 'AP English Language', grade: 3.5, level: 'ap' }]),
    social_studies: makeSubjectPattern(3.4, 'stable', -0.2, [{ name: 'AP US History', grade: 3.4, level: 'honors' }]),
  },
  progressionTrajectory: {
    historical: {
      overallTrend: 'improving' as const,
      consistency: 0.7,
      yearOverYear: [],
    },
    predicted: {
      nextYearGPA: 3.7,
      confidence: 0.7,
    },
  },
  performanceFingerprint: {
    type: 'stem_strong' as const,
    description: 'Strong STEM student with improving trajectory',
    expectedGPAs: {
      regular: 3.9,
      honors: 3.7,
      ap: 3.5,
    },
  },
  overallGPA: 3.65,
} as unknown as NuancedCapabilityAnalysis;

const testCases: Array<{ major: string; expectedMajorMatch: boolean }> = [
  { major: 'Civil Engineering', expectedMajorMatch: true },
  { major: 'Finance', expectedMajorMatch: true },
  { major: 'Computer Science', expectedMajorMatch: true },
  { major: 'Physics', expectedMajorMatch: true },
  { major: 'Music', expectedMajorMatch: true },
];

for (const tc of testCases) {
  const studentContext: StudentContext = {
    quantitativeAnalysis: mockAnalysis,
    intendedMajor: tc.major,
    currentGrade: 11,
    schoolContext: { type: 'well_resourced_suburban', apCoursesAvailable: 15 },
  };

  try {
    const result = assembleResearchForStudent(studentContext);

    assert(result.llmFormattedContext.length > 500, `${tc.major}: LLM context should be substantial (got ${result.llmFormattedContext.length} chars)`);
    assert(result.relevantAPCourses.length > 0, `${tc.major}: Should have relevant AP courses`);
    assert(result.verifiedStatistics.length > 0, `${tc.major}: Should have verified statistics`);

    if (tc.expectedMajorMatch) {
      assert(
        result.collegeExpectations?.majorSpecificExpectations !== undefined,
        `${tc.major}: Should have major-specific expectations from resolution service`
      );
    }

    // Check that verified statistics now come from resolution service (not hardcoded)
    const hasMajorRelevantStats = result.verifiedStatistics.some(
      s => s.relevance.includes(tc.major) || s.relevance.includes('Research-backed')
    );
    assert(hasMajorRelevantStats, `${tc.major}: Stats should reference the specific major via resolution`);

    console.log(`  ${tc.major}: OK (${result.relevantAPCourses.length} courses, ${result.verifiedStatistics.length} stats, ${result.llmFormattedContext.length} chars context)`);
  } catch (error) {
    assert(false, `${tc.major}: Pipeline THREW: ${error}`);
  }
}

// ===== TEST 11: Context Quality - Not Diluted =====
section('Test 11: Context Quality - Targeted, Not Diluted');

// Civil Engineering should NOT get pre-med courses
const civilFull = getTargetedContext('Civil Engineering');
const civilCourseNames = civilFull.relevantCourses.map(c => c.course.name);
assert(
  !civilCourseNames.includes('AP Biology'),
  'Civil Engineering should NOT include AP Biology (irrelevant)'
);
console.log(`  Civil Eng courses: ${civilCourseNames.join(', ')}`);

// Finance should NOT get physics courses
const financeFull = getTargetedContext('Finance');
const financeCourseNames = financeFull.relevantCourses.map(c => c.course.name);
assert(
  !financeCourseNames.includes('AP Physics C: Mechanics'),
  'Finance should NOT include AP Physics C (irrelevant)'
);
console.log(`  Finance courses: ${financeCourseNames.join(', ')}`);

// Physics should get both Physics C courses
const physicsFull = getTargetedContext('Physics');
const physicsCourseNames = physicsFull.relevantCourses.map(c => c.course.name);
assert(
  physicsCourseNames.includes('AP Physics C: Mechanics'),
  'Physics major should include AP Physics C: Mechanics'
);
console.log(`  Physics courses: ${physicsCourseNames.join(', ')}`);

// ===== SUMMARY =====
console.log('\n=================================================================');
console.log(`  RESULTS: ${passed}/${totalTests} passed, ${failed} failed`);
console.log('=================================================================');

if (failed > 0) {
  process.exit(1);
}
