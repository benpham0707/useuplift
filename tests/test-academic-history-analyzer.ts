/**
 * Academic History Analyzer Test
 *
 * Tests the new academic analysis system with Section 6 research integration.
 * Verifies:
 *   - Academic history analysis with research context
 *   - Red flag detection
 *   - Teaching feedback generation
 *
 * Run with: ANTHROPIC_API_KEY="..." npx tsx tests/test-academic-history-analyzer.ts
 */

import { analyzeAcademicHistory, type AcademicHistoryInput } from '../src/services/portfolioStrategy/services/academicHistoryAnalyzer';
import { detectAcademicRedFlags } from '../src/services/portfolioStrategy/services/academicRedFlagDetector';
import { getAcademicTeaching, formatAcademicTeaching } from '../src/services/portfolioStrategy/services/academicTeachingService';

// ============================================================================
// TEST DATA
// ============================================================================

const STRONG_STUDENT: AcademicHistoryInput = {
  gpa: {
    unweighted: 3.95,
    weighted: 4.45,
    scale: 4.0,
    class_rank: {
      rank: 5,
      total: 450,
    },
    percentile: 99,
  },
  courses: [
    { name: 'AP Calculus BC', subject: 'math', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Physics C: Mechanics', subject: 'science', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Physics C: E&M', subject: 'science', level: 'ap', grade: 'A-', year: 12 },
    { name: 'AP Chemistry', subject: 'science', level: 'ap', grade: 'A', year: 10 },
    { name: 'AP Biology', subject: 'science', level: 'ap', grade: 'A', year: 10 },
    { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP English Literature', subject: 'english', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Computer Science A', subject: 'science', level: 'ap', grade: 'A', year: 10 },
    { name: 'AP Spanish Language', subject: 'foreign_language', level: 'ap', grade: 'A', year: 11 },
    { name: 'Linear Algebra (Stanford)', subject: 'math', level: 'dual_enrollment', grade: 'A', year: 12, de_institution: 'Stanford University', de_type: 'research_university' },
    { name: 'Differential Equations (Stanford)', subject: 'math', level: 'dual_enrollment', grade: 'A', year: 12, de_institution: 'Stanford University', de_type: 'research_university' },
  ],
  test_scores: {
    sat: { total: 1570, math: 800, ebrw: 770 },
    ap_exams: [
      { subject: 'Calculus BC', score: 5, year: 2025 },
      { subject: 'Physics C: Mechanics', score: 5, year: 2025 },
      { subject: 'Chemistry', score: 5, year: 2024 },
      { subject: 'Biology', score: 5, year: 2024 },
      { subject: 'US History', score: 5, year: 2025 },
      { subject: 'English Language', score: 5, year: 2025 },
      { subject: 'Computer Science A', score: 5, year: 2024 },
      { subject: 'Spanish Language', score: 5, year: 2025 },
    ],
  },
  school_context: {
    type: 'public',
    name: 'Thomas Jefferson High School',
    tier: 'tier2_competitive_magnet',
    ap_courses_offered: 25,
    ib_program: false,
    curriculum: 'us',
    state: 'VA',
    country: 'US',
  },
  grade_history: {
    freshman: { gpa: 3.85, courses: 6 },
    sophomore: { gpa: 3.92, courses: 7 },
    junior: { gpa: 3.98, courses: 8 },
    senior: { gpa: 4.0, courses: 7 },
  },
  intended_major: 'Computer Science',
  target_schools: ['MIT', 'Stanford', 'Carnegie Mellon'],
};

const RIGOR_AVOIDANCE_STUDENT: AcademicHistoryInput = {
  gpa: {
    unweighted: 4.0,
    weighted: 4.1,
    scale: 4.0,
  },
  courses: [
    { name: 'Honors Algebra 2', subject: 'math', level: 'honors', grade: 'A', year: 10 },
    { name: 'Honors Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 11 },
    { name: 'AP Calculus AB', subject: 'math', level: 'ap', grade: 'A', year: 12 },
    { name: 'Honors Biology', subject: 'science', level: 'honors', grade: 'A', year: 9 },
    { name: 'Honors Chemistry', subject: 'science', level: 'honors', grade: 'A', year: 10 },
    { name: 'Regular Physics', subject: 'science', level: 'regular', grade: 'A', year: 11 },
    { name: 'AP Environmental Science', subject: 'science', level: 'ap', grade: 'A', year: 12 },
    { name: 'Honors English 11', subject: 'english', level: 'honors', grade: 'A', year: 11 },
    { name: 'AP Human Geography', subject: 'social_studies', level: 'ap', grade: 'A', year: 9 },
    { name: 'Spanish 3', subject: 'foreign_language', level: 'regular', grade: 'A', year: 11 },
  ],
  test_scores: {
    sat: { total: 1320, math: 680, ebrw: 640 },
    ap_exams: [
      { subject: 'Human Geography', score: 4, year: 2023 },
    ],
  },
  school_context: {
    type: 'public',
    name: 'Suburban High School',
    tier: 'tier3_well_resourced',
    ap_courses_offered: 18,
    ib_program: false,
    curriculum: 'us',
    state: 'CA',
    country: 'US',
  },
  grade_history: {
    freshman: { gpa: 4.0, courses: 6 },
    sophomore: { gpa: 4.0, courses: 6 },
    junior: { gpa: 4.0, courses: 6 },
    senior: { gpa: 4.0, courses: 6 },
  },
  intended_major: 'Computer Science',
  target_schools: ['Stanford', 'Berkeley', 'UCLA'],
};

const HOMESCHOOL_STUDENT: AcademicHistoryInput = {
  gpa: {
    unweighted: 4.0,
    scale: 4.0,
  },
  courses: [
    { name: 'Calculus', subject: 'math', level: 'regular', grade: 'A', year: 11 },
    { name: 'Physics', subject: 'science', level: 'regular', grade: 'A', year: 11 },
    { name: 'Chemistry', subject: 'science', level: 'regular', grade: 'A', year: 10 },
    { name: 'Biology', subject: 'science', level: 'regular', grade: 'A', year: 9 },
    { name: 'American Literature', subject: 'english', level: 'regular', grade: 'A', year: 11 },
    { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'A', year: 10 },
    { name: 'General Chemistry (CC)', subject: 'science', level: 'dual_enrollment', grade: 'B+', year: 11, de_institution: 'Local CC', de_type: 'community_college' },
  ],
  test_scores: {
    sat: { total: 1480, math: 760, ebrw: 720 },
    ap_exams: [
      { subject: 'Calculus BC', score: 5, year: 2025 },
      { subject: 'Physics C: Mechanics', score: 4, year: 2025 },
    ],
  },
  school_context: {
    type: 'homeschool',
    name: 'Homeschool',
    tier: 'tier6_rural_homeschool',
    ap_courses_offered: 0,
    curriculum: 'us',
    state: 'TX',
    country: 'US',
  },
  intended_major: 'Physics',
  target_schools: ['MIT', 'Caltech', 'Princeton'],
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testRedFlagDetection() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: Red Flag Detection');
  console.log('='.repeat(70) + '\n');

  // Test 1: Strong student (should have minimal/no red flags)
  console.log('--- Strong Student (TJ Magnet) ---');
  const strongFlags = detectAcademicRedFlags(STRONG_STUDENT);
  console.log(`Overall Risk Level: ${strongFlags.overall_risk_level}`);
  console.log(`Flags Detected: ${strongFlags.flags_detected.length}`);
  if (strongFlags.flags_detected.length > 0) {
    strongFlags.flags_detected.forEach(flag => {
      console.log(`  - [${flag.severity}] ${flag.flag_name}: ${flag.evidence}`);
    });
  }
  console.log(`Teaching Insight: ${strongFlags.teaching_insight}\n`);

  // Test 2: Rigor avoidance student (should have rigor-related flags)
  console.log('--- Rigor Avoidance Student (4.0, few APs) ---');
  const rigorFlags = detectAcademicRedFlags(RIGOR_AVOIDANCE_STUDENT);
  console.log(`Overall Risk Level: ${rigorFlags.overall_risk_level}`);
  console.log(`Flags Detected: ${rigorFlags.flags_detected.length}`);
  rigorFlags.flags_detected.forEach(flag => {
    console.log(`  - [${flag.severity}] ${flag.flag_name}: ${flag.evidence}`);
    console.log(`    Mitigation: ${flag.mitigation_guidance}`);
  });
  console.log(`Summary: ${rigorFlags.summary}\n`);

  // Test 3: Homeschool student
  console.log('--- Homeschool Student ---');
  const homeschoolFlags = detectAcademicRedFlags(HOMESCHOOL_STUDENT);
  console.log(`Overall Risk Level: ${homeschoolFlags.overall_risk_level}`);
  console.log(`Flags Detected: ${homeschoolFlags.flags_detected.length}`);
  homeschoolFlags.flags_detected.forEach(flag => {
    console.log(`  - [${flag.severity}] ${flag.flag_name}: ${flag.evidence}`);
  });
  console.log(`Recommendations:`);
  homeschoolFlags.recommended_actions.forEach(action => {
    console.log(`  • ${action}`);
  });
}

function testTeachingService() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: Academic Teaching Service');
  console.log('='.repeat(70) + '\n');

  const testIssues = [
    'gpa_context_interpretation',
    'rigor_avoidance',
    'senior_year_decline',
    'gpa_test_mismatch',
    'homeschool_validation',
  ] as const;

  testIssues.forEach(issueType => {
    console.log(`\n--- Teaching for: ${issueType} ---`);
    const teaching = getAcademicTeaching(issueType);
    if (teaching) {
      console.log(`Headline: ${teaching.why_section.headline}`);
      console.log(`AO Perspective: "${teaching.why_section.admissions_perspective}"`);
      console.log(`Citation: ${teaching.research_support.primary_citation.source}`);
      console.log(`What to do: ${teaching.guidance.what_to_do[0]}`);
    } else {
      console.log('No teaching available for this issue type');
    }
  });
}

async function testFullAnalysis() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: Full Academic Analysis (requires API key)');
  console.log('='.repeat(70) + '\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY not set. Skipping full analysis test.');
    console.log('   Run with: ANTHROPIC_API_KEY="..." npx tsx tests/test-academic-history-analyzer.ts');
    return;
  }

  console.log('Running full analysis on strong student profile...');
  console.log('This will use the LLM for comprehensive analysis.\n');

  try {
    const startTime = Date.now();
    const analysis = await analyzeAcademicHistory(STRONG_STUDENT);
    const duration = Date.now() - startTime;

    console.log(`\n--- Analysis Complete (${duration}ms) ---\n`);

    // Overall assessment
    console.log('OVERALL ASSESSMENT:');
    console.log(`  Harvard Score: ${analysis.overall.harvard_score}/6`);
    console.log(`  Confidence: ${analysis.overall.confidence}%`);
    console.log(`  Summary: ${analysis.overall.summary}`);
    console.log(`  Standout Factors:`);
    analysis.overall.standout_factors.forEach(f => console.log(`    • ${f}`));

    // Rigor analysis
    console.log('\nRIGOR ANALYSIS:');
    console.log(`  Rigor Score: ${analysis.rigor_analysis.rigor_score}/100`);
    console.log(`  Level: ${analysis.rigor_analysis.rigor_level}`);
    console.log(`  Utilization: ${analysis.rigor_analysis.rigor_maximization.utilization_rate}%`);
    console.log(`  Teaching Insight: ${analysis.rigor_analysis.teaching_insight}`);

    // Competitive positioning
    console.log('\nCOMPETITIVE POSITIONING:');
    console.log(`  T10 Readiness: ${analysis.competitive_positioning.t10_readiness}`);
    console.log(`  T20 Readiness: ${analysis.competitive_positioning.t20_readiness}`);
    console.log(`  Differentiators:`);
    analysis.competitive_positioning.differentiators.forEach(d => console.log(`    • ${d}`));

    // Recommendations
    console.log('\nRECOMMENDATIONS:');
    console.log('  Immediate Actions:');
    analysis.recommendations.immediate_actions.forEach(a => console.log(`    • ${a}`));

  } catch (error: any) {
    console.error('Analysis failed:', error.message);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🎓 ACADEMIC HISTORY ANALYZER TEST SUITE');
  console.log('Testing Section 6 research integration\n');

  // Test 1: Red flag detection (no API needed)
  await testRedFlagDetection();

  // Test 2: Teaching service (no API needed)
  testTeachingService();

  // Test 3: Full analysis (requires API)
  await testFullAnalysis();

  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
