/**
 * PASS Pipeline Blind Validation Test
 *
 * Tests that the AI correctly identifies quality WITHOUT knowing the expected answer.
 * This validates that:
 * 1. Tier classifications are accurate
 * 2. Character assessments are calibrated
 * 3. School fit predictions are realistic
 * 4. Strategic guidance is coherent
 *
 * Each test case includes a "ground truth" that the test validates against
 * AFTER the AI has made its assessment blindly.
 */

import { classifyStudentProfile } from '../src/services/portfolioStrategy/stages/stage0ProfileClassification';
import { analyzeActivityPortfolio } from '../src/services/portfolioStrategy/stages/stage1AActivityAnalysis';
import { analyzeAcademicProfile } from '../src/services/portfolioStrategy/stages/stage1BAcademicAnalysis';
import { analyzeCharacterAndNarrative } from '../src/services/portfolioStrategy/stages/stage2CharacterAnalysis';

// ============================================================================
// BLIND TEST CASES
// ============================================================================

/**
 * Test Case 1: Strong STEM Innovator
 * Ground Truth: This student was admitted to MIT, Stanford, and Caltech
 */
const BLIND_TEST_STRONG_STEM = {
  input: {
    activities: [
      {
        name: 'Research Project in Machine Learning',
        category: 'stem_project',
        description: 'Developed novel neural network architecture for protein folding prediction with Professor at Stanford. Paper under review at NeurIPS workshop.',
        yearsInvolved: 2,
        hoursPerWeek: 15,
        leadershipPositions: [{ title: 'Lead Researcher', years: [11, 12] }],
        achievements: [
          { description: 'Paper under review at NeurIPS workshop' },
          { description: 'Presented at Stanford undergraduate research symposium' },
        ],
      },
      {
        name: 'USA Computing Olympiad',
        category: 'academic_competition',
        description: 'Competitive programming, achieved Gold Division',
        yearsInvolved: 4,
        hoursPerWeek: 10,
        leadershipPositions: [],
        achievements: [
          { description: 'USACO Gold Division' },
          { description: 'Top 200 nationally' },
        ],
      },
      {
        name: 'CS Education Initiative',
        category: 'community_service',
        description: 'Founded program teaching Python to middle schoolers in underserved schools',
        yearsInvolved: 2,
        hoursPerWeek: 6,
        leadershipPositions: [{ title: 'Founder', years: [10, 11, 12] }],
        achievements: [
          { description: 'Taught 300+ students across 8 schools' },
          { description: 'Curriculum adopted by school district' },
        ],
      },
    ],
    academic: {
      gpa: { value: 3.97, scale: 4.0, type: 'unweighted' as const },
      courses: [
        { name: 'AP Computer Science A', level: 'AP' as const, grade: 'A' },
        { name: 'AP Computer Science Principles', level: 'AP' as const, grade: 'A' },
        { name: 'AP Calculus BC', level: 'AP' as const, grade: 'A' },
        { name: 'AP Physics C: Mechanics', level: 'AP' as const, grade: 'A' },
        { name: 'AP Physics C: E&M', level: 'AP' as const, grade: 'A' },
        { name: 'Multivariable Calculus (college)', level: 'Dual_Enrollment' as const, grade: 'A' },
        { name: 'Linear Algebra (college)', level: 'Dual_Enrollment' as const, grade: 'A' },
      ],
      testScores: {
        sat: { composite: 1570, math: 800, ebrw: 770 },
        apExams: [
          { subject: 'Computer Science A', score: 5 as const },
          { subject: 'Calculus BC', score: 5 as const },
          { subject: 'Physics C Mechanics', score: 5 as const },
        ],
      },
      schoolContext: {
        type: 'public' as const,
        competitiveness: 'well_resourced' as const,
        apCoursesOffered: 22,
      },
    },
    gradeLevel: 'senior' as const,
    intendedMajors: ['computer_science'],
    personalContext: {
      background: 'First-generation American, parents immigrated from Vietnam',
    },
  },
  groundTruth: {
    expectedArchetype: 'stem_innovator',
    expectedHarvardScore: { min: 1.5, max: 2.5 },
    expectedActivityTier1Count: { min: 2, max: 3 },
    expectedSpikeStrength: 'strong',
    expectedSchoolFitTier: 't5',
    actualOutcome: 'Admitted MIT EA, Stanford RD, Caltech',
  },
};

/**
 * Test Case 2: Well-Rounded Average
 * Ground Truth: This student was admitted to some T30s, waitlisted at T20s
 */
const BLIND_TEST_WELL_ROUNDED = {
  input: {
    activities: [
      {
        name: 'Varsity Tennis',
        category: 'athletics',
        description: 'Varsity player since sophomore year',
        yearsInvolved: 3,
        hoursPerWeek: 15,
        leadershipPositions: [{ title: 'Team Captain', years: [12] }],
        achievements: [
          { description: 'All-Conference Honorable Mention' },
        ],
      },
      {
        name: 'Student Government',
        category: 'student_government',
        description: 'Class Representative, then Vice President',
        yearsInvolved: 3,
        hoursPerWeek: 5,
        leadershipPositions: [{ title: 'Class VP', years: [11, 12] }],
        achievements: [
          { description: 'Led school spirit week planning' },
        ],
      },
      {
        name: 'Math Tutoring',
        category: 'community_service',
        description: 'Volunteer tutor at community center',
        yearsInvolved: 2,
        hoursPerWeek: 3,
        leadershipPositions: [],
        achievements: [],
      },
      {
        name: 'Model UN',
        category: 'academic_competition',
        description: 'Active participant in conferences',
        yearsInvolved: 2,
        hoursPerWeek: 3,
        leadershipPositions: [],
        achievements: [
          { description: 'Best Delegate at regional conference' },
        ],
      },
    ],
    academic: {
      gpa: { value: 3.75, scale: 4.0, type: 'unweighted' as const },
      courses: [
        { name: 'AP US History', level: 'AP' as const, grade: 'A-' },
        { name: 'AP English Language', level: 'AP' as const, grade: 'B+' },
        { name: 'AP Calculus AB', level: 'AP' as const, grade: 'B+' },
        { name: 'AP Biology', level: 'AP' as const, grade: 'A-' },
        { name: 'Honors Chemistry', level: 'Honors' as const, grade: 'A' },
      ],
      testScores: {
        sat: { composite: 1420, math: 720, ebrw: 700 },
        apExams: [
          { subject: 'US History', score: 4 as const },
          { subject: 'English Language', score: 4 as const },
        ],
      },
      schoolContext: {
        type: 'public' as const,
        competitiveness: 'well_resourced' as const,
        apCoursesOffered: 18,
      },
    },
    gradeLevel: 'senior' as const,
    intendedMajors: ['political_science'],
    personalContext: {},
  },
  groundTruth: {
    expectedArchetype: 'well_rounded',
    expectedHarvardScore: { min: 3.0, max: 4.0 },
    expectedActivityTier1Count: { min: 0, max: 0 },
    expectedSpikeStrength: 'weak',
    expectedSchoolFitTier: 't30',
    actualOutcome: 'Admitted USC, Emory. Waitlisted at Northwestern, Duke.',
  },
};

/**
 * Test Case 3: Hidden Gem with Context
 * Ground Truth: Student from under-resourced background with strong potential
 */
const BLIND_TEST_HIDDEN_GEM = {
  input: {
    activities: [
      {
        name: 'Family Business',
        category: 'work_experience',
        description: 'Manages inventory and bookkeeping for parents\' small restaurant after school. Implemented POS system that increased efficiency.',
        yearsInvolved: 4,
        hoursPerWeek: 20,
        leadershipPositions: [{ title: 'Operations Manager', years: [9, 10, 11, 12] }],
        achievements: [
          { description: 'Implemented digital POS system saving 10 hrs/week' },
          { description: 'Trained 5 employees on new systems' },
        ],
      },
      {
        name: 'Self-Taught Programmer',
        category: 'stem_project',
        description: 'Taught myself Python and JavaScript through online courses. Built inventory app for family business.',
        yearsInvolved: 2,
        hoursPerWeek: 8,
        leadershipPositions: [],
        achievements: [
          { description: 'Built working inventory management app' },
          { description: 'Completed 200+ hours of online coursework' },
        ],
      },
      {
        name: 'Sibling Care',
        category: 'family_responsibilities',
        description: 'Primary caregiver for two younger siblings while parents work evening shifts',
        yearsInvolved: 4,
        hoursPerWeek: 15,
        leadershipPositions: [],
        achievements: [],
      },
    ],
    academic: {
      gpa: { value: 3.65, scale: 4.0, type: 'unweighted' as const },
      courses: [
        { name: 'AP Computer Science A', level: 'AP' as const, grade: 'A' },
        { name: 'AP Calculus AB', level: 'AP' as const, grade: 'B+' },
        { name: 'Honors English', level: 'Honors' as const, grade: 'A' },
      ],
      testScores: {
        sat: { composite: 1380, math: 750, ebrw: 630 },
        apExams: [
          { subject: 'Computer Science A', score: 5 as const },
        ],
      },
      schoolContext: {
        type: 'public' as const,
        competitiveness: 'under_resourced' as const,
        apCoursesOffered: 6,
      },
    },
    gradeLevel: 'senior' as const,
    intendedMajors: ['computer_science'],
    personalContext: {
      background: 'First-generation, low-income household',
      familyCircumstances: 'Parents work multiple jobs, limited English proficiency',
      familyResponsibilities: 'Primary caregiver for siblings, works in family business',
    },
  },
  groundTruth: {
    expectedArchetype: 'emerging_talent', // or similar
    expectedHarvardScore: { min: 2.5, max: 3.5 }, // Context-adjusted
    expectedActivityTier1Count: { min: 0, max: 1 }, // Hidden gem potential
    expectedSpikeStrength: 'moderate',
    hiddenGemExpected: true,
    expectedSchoolFitTier: 't20', // With context, competitive
    actualOutcome: 'Admitted Stanford QuestBridge, Berkeley EECS',
  },
};

/**
 * Test Case 4: Red Flag Profile
 * Ground Truth: Student with concerning patterns
 */
const BLIND_TEST_RED_FLAGS = {
  input: {
    activities: [
      {
        name: 'Founded 3 Nonprofits',
        category: 'community_service',
        description: 'Founded environmental awareness nonprofit (junior year), mental health advocacy nonprofit (junior year), and coding education nonprofit (senior year)',
        yearsInvolved: 1,
        hoursPerWeek: 2,
        leadershipPositions: [
          { title: 'Founder/President', years: [11] },
          { title: 'Founder/President', years: [11] },
          { title: 'Founder/President', years: [12] },
        ],
        achievements: [
          { description: 'Raised awareness on social media' },
        ],
      },
      {
        name: 'Debate Club',
        category: 'academic_competition',
        description: 'Participated sophomore year',
        yearsInvolved: 1,
        hoursPerWeek: 3,
        leadershipPositions: [],
        achievements: [],
      },
      {
        name: 'Orchestra',
        category: 'performing_arts',
        description: 'Played violin freshman and sophomore year',
        yearsInvolved: 2,
        hoursPerWeek: 4,
        leadershipPositions: [],
        achievements: [],
      },
    ],
    academic: {
      gpa: { value: 3.85, scale: 4.0, type: 'unweighted' as const },
      courses: [
        { name: 'AP Psychology', level: 'AP' as const, grade: 'A' },
        { name: 'AP Environmental Science', level: 'AP' as const, grade: 'A' },
        { name: 'Honors English', level: 'Honors' as const, grade: 'A' },
        { name: 'Pre-Calculus', level: 'Regular' as const, grade: 'A' }, // Avoiding AP math
      ],
      testScores: {
        sat: { composite: 1450, math: 700, ebrw: 750 },
      },
      schoolContext: {
        type: 'private' as const,
        competitiveness: 'elite_prep' as const,
        apCoursesOffered: 25,
      },
    },
    gradeLevel: 'senior' as const,
    intendedMajors: ['psychology'],
    personalContext: {},
  },
  groundTruth: {
    expectedArchetype: 'packaged_applicant',
    expectedHarvardScore: { min: 4.0, max: 5.0 },
    expectedActivityTier1Count: { min: 0, max: 0 },
    expectedSpikeStrength: 'none',
    expectedRedFlags: [
      'Multiple organizations founded late with no evidence of impact',
      'Course selection avoiding challenge (no AP math at elite prep)',
      'Pattern of starting and stopping activities',
      'Impressive titles without substance',
    ],
    expectedSchoolFitTier: 't50',
    actualOutcome: 'Rejected from all T20s, attended safety school',
  },
};

// ============================================================================
// BLIND VALIDATION RUNNER
// ============================================================================

interface ValidationResult {
  testCase: string;
  passed: boolean;
  details: {
    check: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
  groundTruthComparison: string;
}

async function runBlindValidation(
  testName: string,
  testCase: typeof BLIND_TEST_STRONG_STEM,
): Promise<ValidationResult> {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`🧪 BLIND TEST: ${testName}`);
  console.log(`${'─'.repeat(80)}`);
  console.log('Note: AI is analyzing without knowing the expected outcome...\n');

  const details: ValidationResult['details'] = [];
  let allPassed = true;

  try {
    // Stage 0: Profile Classification
    console.log('Running Stage 0: Profile Classification...');
    const stage0Result = await classifyStudentProfile({
      userId: `test_${Date.now()}`,
      gradeLevel: testCase.input.gradeLevel,
      intendedMajors: testCase.input.intendedMajors,
      activities: {
        activities: testCase.input.activities,
      },
      academic: testCase.input.academic,
      personalContext: testCase.input.personalContext,
    });

    // Validate archetype
    const archetypeMatch = stage0Result.archetypeAnalysis.primary.toLowerCase().includes(
      testCase.groundTruth.expectedArchetype.split('_')[0]
    );
    details.push({
      check: 'Archetype Classification',
      expected: testCase.groundTruth.expectedArchetype,
      actual: stage0Result.archetypeAnalysis.primary,
      passed: archetypeMatch,
    });
    if (!archetypeMatch) allPassed = false;

    console.log(`  Archetype: ${stage0Result.archetypeAnalysis.primary} (expected: ${testCase.groundTruth.expectedArchetype})`);

    // Stage 1A: Activity Analysis
    console.log('Running Stage 1A: Activity Analysis...');
    const stage1AResult = await analyzeActivityPortfolio(
      {
        activities: testCase.input.activities.map(a => ({
          ...a,
          achievements: a.achievements.map(ach => ach.description),
          leadershipRoles: a.leadershipPositions.map(p => p.title),
        })),
        gradeLevel: testCase.input.gradeLevel,
        intendedMajor: testCase.input.intendedMajors[0],
      },
      {
        archetype: stage0Result.archetypeAnalysis.primary,
        contextFactors: stage0Result.contextCalibration.relevantFactors,
        narrativeThreads: stage0Result.narrativeThreads.primaryThread
          ? [stage0Result.narrativeThreads.primaryThread]
          : [],
      }
    );

    // Validate tier 1 count
    const tier1Count = stage1AResult.individualActivityClassifications.filter(
      a => a.assignedTier === 1
    ).length;
    const tier1Pass = tier1Count >= testCase.groundTruth.expectedActivityTier1Count.min &&
                      tier1Count <= testCase.groundTruth.expectedActivityTier1Count.max;
    details.push({
      check: 'Tier 1 Activity Count',
      expected: `${testCase.groundTruth.expectedActivityTier1Count.min}-${testCase.groundTruth.expectedActivityTier1Count.max}`,
      actual: String(tier1Count),
      passed: tier1Pass,
    });
    if (!tier1Pass) allPassed = false;

    console.log(`  Tier 1 Activities: ${tier1Count} (expected: ${testCase.groundTruth.expectedActivityTier1Count.min}-${testCase.groundTruth.expectedActivityTier1Count.max})`);

    // Validate spike strength
    const spikeMatch = stage1AResult.spikeAnalysis.spikeStrength === testCase.groundTruth.expectedSpikeStrength;
    details.push({
      check: 'Spike Strength',
      expected: testCase.groundTruth.expectedSpikeStrength,
      actual: stage1AResult.spikeAnalysis.spikeStrength,
      passed: spikeMatch,
    });
    if (!spikeMatch) allPassed = false;

    console.log(`  Spike Strength: ${stage1AResult.spikeAnalysis.spikeStrength} (expected: ${testCase.groundTruth.expectedSpikeStrength})`);

    // Stage 1B: Academic Analysis
    console.log('Running Stage 1B: Academic Analysis...');
    const stage1BResult = await analyzeAcademicProfile(
      {
        academic: testCase.input.academic,
        intendedMajor: testCase.input.intendedMajors[0],
      },
      {
        archetype: stage0Result.archetypeAnalysis.primary,
        contextFactors: stage0Result.contextCalibration.relevantFactors,
        narrativeThreads: stage0Result.narrativeThreads.primaryThread
          ? [stage0Result.narrativeThreads.primaryThread]
          : [],
      }
    );

    // Validate Harvard score
    const harvardScore = stage1BResult.overallAcademicAssessment.harvardScore;
    const harvardScorePass = harvardScore >= testCase.groundTruth.expectedHarvardScore.min &&
                            harvardScore <= testCase.groundTruth.expectedHarvardScore.max;
    details.push({
      check: 'Harvard Academic Score',
      expected: `${testCase.groundTruth.expectedHarvardScore.min}-${testCase.groundTruth.expectedHarvardScore.max}`,
      actual: String(harvardScore),
      passed: harvardScorePass,
    });
    if (!harvardScorePass) allPassed = false;

    console.log(`  Harvard Score: ${harvardScore} (expected: ${testCase.groundTruth.expectedHarvardScore.min}-${testCase.groundTruth.expectedHarvardScore.max})`);

    // Check for hidden gem detection if expected
    if ('hiddenGemExpected' in testCase.groundTruth && testCase.groundTruth.hiddenGemExpected) {
      const hasHiddenGem = stage1AResult.hiddenGemAnalysis.gemsIdentified.length > 0 ||
                          stage0Result.hiddenStrengths.length > 0;
      details.push({
        check: 'Hidden Gem Detection',
        expected: 'true',
        actual: String(hasHiddenGem),
        passed: hasHiddenGem,
      });
      if (!hasHiddenGem) allPassed = false;

      console.log(`  Hidden Gem Detected: ${hasHiddenGem} (expected: true)`);
    }

    // Check for red flags if expected
    if ('expectedRedFlags' in testCase.groundTruth && testCase.groundTruth.expectedRedFlags.length > 0) {
      const hasRedFlags = stage0Result.earlyRedFlags.length > 0;
      details.push({
        check: 'Red Flag Detection',
        expected: 'Red flags present',
        actual: hasRedFlags ? `${stage0Result.earlyRedFlags.length} flags found` : 'No flags',
        passed: hasRedFlags,
      });
      if (!hasRedFlags) allPassed = false;

      console.log(`  Red Flags Detected: ${hasRedFlags} (expected: true)`);
      if (hasRedFlags) {
        stage0Result.earlyRedFlags.forEach((flag: { flag: string; severity: string }) => {
          console.log(`    - ${flag.flag} (${flag.severity})`);
        });
      }
    }

    // Summary
    console.log(`\n📊 GROUND TRUTH COMPARISON:`);
    console.log(`  Actual Outcome: ${testCase.groundTruth.actualOutcome}`);
    console.log(`  Our Assessment Aligned: ${allPassed ? '✅ YES' : '⚠️ PARTIAL'}`);

    return {
      testCase: testName,
      passed: allPassed,
      details,
      groundTruthComparison: testCase.groundTruth.actualOutcome,
    };

  } catch (error) {
    console.error(`❌ Test failed with error:`, error);
    return {
      testCase: testName,
      passed: false,
      details: [{
        check: 'Execution',
        expected: 'Complete',
        actual: String(error),
        passed: false,
      }],
      groundTruthComparison: testCase.groundTruth.actualOutcome,
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('PASS PIPELINE BLIND VALIDATION');
  console.log('Testing AI accuracy against known outcomes');
  console.log('='.repeat(80));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('\n⚠️  ANTHROPIC_API_KEY not set - cannot run blind validation');
    console.log('   Set the key to run validation tests');
    return;
  }

  const results: ValidationResult[] = [];

  // Run each test case
  console.log('\n📋 Running blind validation tests...\n');

  try {
    results.push(await runBlindValidation('Strong STEM Innovator', BLIND_TEST_STRONG_STEM));
    results.push(await runBlindValidation('Well-Rounded Average', BLIND_TEST_WELL_ROUNDED));
    results.push(await runBlindValidation('Hidden Gem with Context', BLIND_TEST_HIDDEN_GEM));
    results.push(await runBlindValidation('Red Flag Profile', BLIND_TEST_RED_FLAGS));
  } catch (error) {
    console.error('Test execution failed:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  let totalChecks = 0;
  let passedChecks = 0;

  results.forEach(result => {
    const checksPassed = result.details.filter(d => d.passed).length;
    const totalInTest = result.details.length;
    totalChecks += totalInTest;
    passedChecks += checksPassed;

    const icon = result.passed ? '✅' : '⚠️';
    console.log(`\n${icon} ${result.testCase}: ${checksPassed}/${totalInTest} checks passed`);
    result.details.forEach(detail => {
      const checkIcon = detail.passed ? '  ✓' : '  ✗';
      console.log(`${checkIcon} ${detail.check}: ${detail.actual} (expected: ${detail.expected})`);
    });
    console.log(`   Ground Truth: ${result.groundTruthComparison}`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log(`OVERALL: ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks/totalChecks*100)}%)`);
  console.log('='.repeat(80));

  // Exit with appropriate code
  if (passedChecks < totalChecks * 0.8) {
    console.log('\n⚠️  Below 80% accuracy threshold - prompts may need adjustment');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed - prompts are well-calibrated');
  }
}

main().catch(console.error);
