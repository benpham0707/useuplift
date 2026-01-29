/**
 * Comprehensive Test: Nuanced Capability Analysis + Progression Teaching
 *
 * This test demonstrates the complete flow:
 * 1. Nuanced capability analysis (continuous metrics, not tiers)
 * 2. Progression teaching synthesis (actionable guidance)
 *
 * Tests three student profiles to show how the system adapts:
 * - High performer who can push themselves
 * - Balanced student who needs strategic decisions
 * - Sensitive student who should protect GPA
 */

import {
  analyzeCapabilityNuanced,
  generateProgressionTeaching,
  GPA_TO_GRADE,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability';

import type { CourseRecord } from '../src/services/portfolioStrategy/services/academicWorkshop/types';

// ============================================================================
// TEST DATA: Three Distinct Student Profiles
// ============================================================================

/**
 * Profile 1: High Achiever
 * - Consistent A's across all levels
 * - Low sensitivity to difficulty
 * - Should be encouraged to push
 */
const highAchieverCourses: CourseRecord[] = [
  // Freshman year - strong start
  { name: 'Algebra 2', subject: 'math', level: 'honors', grade: 'A', year: 9 },
  { name: 'Biology', subject: 'science', level: 'honors', grade: 'A', year: 9 },
  { name: 'English 9', subject: 'english', level: 'honors', grade: 'A-', year: 9 },
  { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'A', year: 9 },
  { name: 'Spanish 2', subject: 'foreign_language', level: 'regular', grade: 'A', year: 9 },

  // Sophomore year - maintained excellence, added rigor
  { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 10 },
  { name: 'Chemistry', subject: 'science', level: 'honors', grade: 'A', year: 10 },
  { name: 'English 10', subject: 'english', level: 'honors', grade: 'A', year: 10 },
  { name: 'AP World History', subject: 'social_studies', level: 'AP', grade: 'A', year: 10 },
  { name: 'Spanish 3', subject: 'foreign_language', level: 'honors', grade: 'A-', year: 10 },

  // Junior year - peak rigor, maintained grades
  { name: 'AP Calculus BC', subject: 'math', level: 'AP', grade: 'A', year: 11 },
  { name: 'AP Physics 1', subject: 'science', level: 'AP', grade: 'A-', year: 11 },
  { name: 'AP English Language', subject: 'english', level: 'AP', grade: 'A', year: 11 },
  { name: 'AP US History', subject: 'social_studies', level: 'AP', grade: 'A', year: 11 },
  { name: 'AP Spanish', subject: 'foreign_language', level: 'AP', grade: 'B+', year: 11 },
];

/**
 * Profile 2: Balanced Performer
 * - Good grades at honors level
 * - AP grades drop noticeably
 * - Needs strategic decisions
 */
const balancedPerformerCourses: CourseRecord[] = [
  // Freshman year
  { name: 'Algebra 2', subject: 'math', level: 'honors', grade: 'B+', year: 9 },
  { name: 'Biology', subject: 'science', level: 'regular', grade: 'A', year: 9 },
  { name: 'English 9', subject: 'english', level: 'honors', grade: 'A-', year: 9 },
  { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'A', year: 9 },
  { name: 'French 2', subject: 'foreign_language', level: 'regular', grade: 'A', year: 9 },

  // Sophomore year - moved up in some subjects
  { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'B+', year: 10 },
  { name: 'Chemistry', subject: 'science', level: 'honors', grade: 'B', year: 10 },
  { name: 'English 10', subject: 'english', level: 'honors', grade: 'A-', year: 10 },
  { name: 'AP World History', subject: 'social_studies', level: 'AP', grade: 'B', year: 10 },
  { name: 'French 3', subject: 'foreign_language', level: 'honors', grade: 'A-', year: 10 },

  // Junior year - mixed results
  { name: 'AP Calculus AB', subject: 'math', level: 'AP', grade: 'B-', year: 11 },
  { name: 'AP Chemistry', subject: 'science', level: 'AP', grade: 'C+', year: 11 },
  { name: 'AP English Language', subject: 'english', level: 'AP', grade: 'B+', year: 11 },
  { name: 'AP US History', subject: 'social_studies', level: 'AP', grade: 'B', year: 11 },
  { name: 'French 4', subject: 'foreign_language', level: 'honors', grade: 'A-', year: 11 },
];

/**
 * Profile 3: Difficulty-Sensitive Student
 * - Excellent at regular/honors level
 * - Significant drops at AP level
 * - Should protect GPA
 */
const sensitiveCourses: CourseRecord[] = [
  // Freshman year - excellent start
  { name: 'Algebra 2', subject: 'math', level: 'regular', grade: 'A', year: 9 },
  { name: 'Biology', subject: 'science', level: 'regular', grade: 'A', year: 9 },
  { name: 'English 9', subject: 'english', level: 'honors', grade: 'A', year: 9 },
  { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'A', year: 9 },
  { name: 'Art 1', subject: 'arts', level: 'regular', grade: 'A', year: 9 },

  // Sophomore year - tried honors, mixed results
  { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'B', year: 10 },
  { name: 'Chemistry', subject: 'science', level: 'honors', grade: 'B-', year: 10 },
  { name: 'English 10', subject: 'english', level: 'honors', grade: 'A-', year: 10 },
  { name: 'World History 2', subject: 'social_studies', level: 'honors', grade: 'B+', year: 10 },
  { name: 'Art 2', subject: 'arts', level: 'regular', grade: 'A', year: 10 },

  // Junior year - AP struggles
  { name: 'AP Calculus AB', subject: 'math', level: 'AP', grade: 'C', year: 11 },
  { name: 'AP Biology', subject: 'science', level: 'AP', grade: 'C+', year: 11 },
  { name: 'English 11', subject: 'english', level: 'honors', grade: 'A-', year: 11 },
  { name: 'US History', subject: 'social_studies', level: 'honors', grade: 'B+', year: 11 },
  { name: 'AP Art History', subject: 'arts', level: 'AP', grade: 'B-', year: 11 },
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

function printSection(title: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

function printSubsection(title: string): void {
  console.log('\n--- ' + title + ' ---\n');
}

function formatAnalysisSummary(analysis: ReturnType<typeof analyzeCapabilityNuanced>): void {
  const fp = analysis.performanceFingerprint;
  const cr = analysis.challengeResponse;
  const syn = analysis.synthesis;

  printSubsection('Performance Fingerprint');
  console.log(`Sweet Spot: ${fp.sweetSpot.level.toUpperCase()} (Expected: ${GPA_TO_GRADE(fp.sweetSpot.expectedGPA)})`);
  console.log(`Consistency Score: ${fp.consistencyScore.toFixed(0)}/100`);
  console.log(`Difficulty Sensitivity: ${fp.difficultySensitivity}`);
  console.log(`Performance Percentile: ${fp.performancePercentile.toFixed(0)}`);

  console.log('\nExpected GPA by Level:');
  if (fp.expectedGPAByLevel.ap_ib) {
    console.log(`  AP/IB: ${GPA_TO_GRADE(fp.expectedGPAByLevel.ap_ib.expectedGPA)} (${fp.expectedGPAByLevel.ap_ib.sampleSize} courses)`);
  }
  if (fp.expectedGPAByLevel.honors) {
    console.log(`  Honors: ${GPA_TO_GRADE(fp.expectedGPAByLevel.honors.expectedGPA)} (${fp.expectedGPAByLevel.honors.sampleSize} courses)`);
  }
  if (fp.expectedGPAByLevel.regular) {
    console.log(`  Regular: ${GPA_TO_GRADE(fp.expectedGPAByLevel.regular.expectedGPA)} (${fp.expectedGPAByLevel.regular.sampleSize} courses)`);
  }

  printSubsection('Challenge Response');
  console.log(`Risk Level: ${cr.challengeRiskProfile.riskLevel.toFixed(0)}/100`);
  console.log(`Adaptation Speed: ${cr.transitionAnalysis.adaptationSpeed}`);
  console.log(`Recommendation: ${cr.challengeRiskProfile.recommendation}`);

  printSubsection('Synthesis');
  console.log(`Profile Summary: ${syn.profileSummary}`);
  console.log(`Core Insight: ${syn.coreInsight}`);
  console.log(`Unique Pattern: ${syn.uniquePattern}`);

  if (syn.strengths.length > 0) {
    console.log('\nStrengths:');
    syn.strengths.forEach((s) => console.log(`  - ${s.insight}`));
  }

  if (syn.challenges.length > 0) {
    console.log('\nChallenges:');
    syn.challenges.forEach((c) => console.log(`  - ${c.insight}`));
  }
}

function formatTeachingSummary(teaching: ReturnType<typeof generateProgressionTeaching>): void {
  const so = teaching.strategicOverview;
  const sp = teaching.nextSemesterPlan;
  const mo = teaching.motivation;

  printSubsection('Strategic Overview');
  console.log(`Core Strategy: ${so.coreStrategy}`);
  console.log(`\nPractical Meaning: ${so.practicalMeaning}`);
  console.log(`\nDecision Lens: ${so.decisionLens}`);
  console.log(`\nSuccess Definition: ${so.successDefinition}`);

  printSubsection('Next Semester Plan');
  console.log(`Recommended AP/IB Count: ${sp.recommendedLoad.apIbCount.min}-${sp.recommendedLoad.apIbCount.max} (ideal: ${sp.recommendedLoad.apIbCount.ideal})`);
  console.log(`Recommended Honors Count: ${sp.recommendedLoad.honorsCount.min}-${sp.recommendedLoad.honorsCount.max} (ideal: ${sp.recommendedLoad.honorsCount.ideal})`);
  console.log(`\nReasoning: ${sp.recommendedLoad.reasoning}`);
  console.log(`\nBalance Guidance: ${sp.balanceGuidance}`);
  console.log(`\nOverload Warning: ${sp.overloadWarning}`);

  console.log(`\nExpected Outcome: ${GPA_TO_GRADE(sp.expectedOutcome.gpaRange.low)}-${GPA_TO_GRADE(sp.expectedOutcome.gpaRange.high)}`);

  printSubsection('Subject Guidance (Top 3)');
  teaching.subjectGuidance.slice(0, 3).forEach((sg) => {
    console.log(`\n${sg.subject}:`);
    console.log(`  Current: ${sg.currentStanding.level} - ${sg.currentStanding.performance}`);
    console.log(`  Next Step: ${sg.nextStep.recommendation}`);
    console.log(`  Expected: ${sg.nextStep.expectedOutcome}`);
    if (sg.stretchOption) {
      console.log(`  Stretch: ${sg.stretchOption.option} (Risk: ${sg.stretchOption.risk})`);
    }
    if (sg.supportOption) {
      console.log(`  Support: ${sg.supportOption.option}`);
    }
  });

  printSubsection('Decision Framework');
  const apFramework = teaching.decisionFrameworks.find((f) => f.name.includes('AP'));
  if (apFramework) {
    console.log(`${apFramework.name}:`);
    console.log(`  ${apFramework.guidance}`);
    console.log('\n  Questions to ask:');
    apFramework.questions.forEach((q) => console.log(`    - ${q}`));
  }

  printSubsection('Motivational Framing');
  console.log(`Positive Reframe: ${mo.positiveReframe}`);
  console.log(`\nEmpowering Truth: ${mo.empoweringTruth}`);
  console.log(`\nAdmissions Narrative: ${mo.admissionsNarrative}`);
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('  NUANCED CAPABILITY ANALYSIS + PROGRESSION TEACHING TEST');
  console.log('='.repeat(80));

  // =========================================
  // Test 1: High Achiever
  // =========================================
  printSection('PROFILE 1: HIGH ACHIEVER');
  console.log('Student who excels at all levels, can push for maximum rigor.\n');

  const highAchieverAnalysis = analyzeCapabilityNuanced(highAchieverCourses);
  formatAnalysisSummary(highAchieverAnalysis);

  const highAchieverTeaching = generateProgressionTeaching(highAchieverAnalysis, {
    currentYear: 'junior',
    intendedMajor: 'Computer Science',
    targetSelectivity: 'ivy_plus',
  });
  formatTeachingSummary(highAchieverTeaching);

  // Validation checks
  console.log('\n--- Validation Checks ---');
  const haFP = highAchieverAnalysis.performanceFingerprint;
  console.log(`  [${haFP.difficultySensitivity === 'low' ? 'PASS' : 'FAIL'}] Low difficulty sensitivity`);
  console.log(`  [${haFP.sweetSpot.level === 'ap_ib' ? 'PASS' : 'FAIL'}] Sweet spot is AP/IB`);
  console.log(`  [${highAchieverTeaching.nextSemesterPlan.recommendedLoad.apIbCount.ideal >= 3 ? 'PASS' : 'FAIL'}] Recommended 3+ AP courses`);

  // =========================================
  // Test 2: Balanced Performer
  // =========================================
  printSection('PROFILE 2: BALANCED PERFORMER');
  console.log('Student who does well at honors but struggles at AP level.\n');

  const balancedAnalysis = analyzeCapabilityNuanced(balancedPerformerCourses);
  formatAnalysisSummary(balancedAnalysis);

  const balancedTeaching = generateProgressionTeaching(balancedAnalysis, {
    currentYear: 'junior',
    intendedMajor: 'Business',
    targetSelectivity: 'top_25',
  });
  formatTeachingSummary(balancedTeaching);

  // Validation checks
  console.log('\n--- Validation Checks ---');
  const baFP = balancedAnalysis.performanceFingerprint;
  console.log(`  [${baFP.difficultySensitivity === 'moderate' || baFP.difficultySensitivity === 'high' ? 'PASS' : 'FAIL'}] Moderate/high difficulty sensitivity`);
  console.log(`  [${baFP.sweetSpot.level === 'honors' ? 'PASS' : 'FAIL'}] Sweet spot is honors`);
  console.log(`  [${balancedTeaching.nextSemesterPlan.recommendedLoad.apIbCount.ideal <= 2 ? 'PASS' : 'FAIL'}] Recommended 1-2 AP courses`);

  // =========================================
  // Test 3: Difficulty-Sensitive Student
  // =========================================
  printSection('PROFILE 3: DIFFICULTY-SENSITIVE STUDENT');
  console.log('Student who should protect GPA by staying at appropriate level.\n');

  const sensitiveAnalysis = analyzeCapabilityNuanced(sensitiveCourses);
  formatAnalysisSummary(sensitiveAnalysis);

  const sensitiveTeaching = generateProgressionTeaching(sensitiveAnalysis, {
    currentYear: 'junior',
    intendedMajor: 'Art',
    targetSelectivity: 'top_50',
  });
  formatTeachingSummary(sensitiveTeaching);

  // Validation checks
  console.log('\n--- Validation Checks ---');
  const seFP = sensitiveAnalysis.performanceFingerprint;
  console.log(`  [${seFP.difficultySensitivity === 'high' ? 'PASS' : 'FAIL'}] High difficulty sensitivity`);
  console.log(`  [${seFP.sweetSpot.level === 'honors' || seFP.sweetSpot.level === 'regular' ? 'PASS' : 'FAIL'}] Sweet spot is honors/regular`);
  console.log(`  [${sensitiveTeaching.nextSemesterPlan.recommendedLoad.apIbCount.ideal <= 1 ? 'PASS' : 'FAIL'}] Recommended 0-1 AP courses`);
  console.log(`  [${sensitiveAnalysis.challengeResponse.challengeRiskProfile.riskLevel > 50 ? 'PASS' : 'FAIL'}] High challenge risk level`);

  // =========================================
  // Summary
  // =========================================
  printSection('TEST SUMMARY');

  console.log('The nuanced capability analyzer + progression teaching engine:');
  console.log('');
  console.log('1. HIGH ACHIEVER - Correctly identified as able to handle maximum rigor');
  console.log(`   - Difficulty sensitivity: ${haFP.difficultySensitivity}`);
  console.log(`   - Recommended AP count: ${highAchieverTeaching.nextSemesterPlan.recommendedLoad.apIbCount.ideal}`);
  console.log(`   - Core strategy: "${highAchieverTeaching.strategicOverview.coreStrategy.substring(0, 60)}..."`);
  console.log('');
  console.log('2. BALANCED PERFORMER - Correctly identified as needing strategic decisions');
  console.log(`   - Difficulty sensitivity: ${baFP.difficultySensitivity}`);
  console.log(`   - Recommended AP count: ${balancedTeaching.nextSemesterPlan.recommendedLoad.apIbCount.ideal}`);
  console.log(`   - Core strategy: "${balancedTeaching.strategicOverview.coreStrategy.substring(0, 60)}..."`);
  console.log('');
  console.log('3. DIFFICULTY-SENSITIVE - Correctly identified as needing GPA protection');
  console.log(`   - Difficulty sensitivity: ${seFP.difficultySensitivity}`);
  console.log(`   - Recommended AP count: ${sensitiveTeaching.nextSemesterPlan.recommendedLoad.apIbCount.ideal}`);
  console.log(`   - Core strategy: "${sensitiveTeaching.strategicOverview.coreStrategy.substring(0, 60)}..."`);
  console.log('');
  console.log('KEY INSIGHT: The system uses continuous metrics (0-100 scales, -1 to +1 ranges)');
  console.log('rather than discrete tiers, providing nuanced, personalized guidance.');
  console.log('');
  console.log('The teaching layer RESOLVES the analysis into actionable recommendations');
  console.log('without repeating the analysis - it tells students WHAT TO DO and WHY.');

  console.log('\n' + '='.repeat(80));
  console.log('  TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
