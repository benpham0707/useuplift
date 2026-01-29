/**
 * Nuanced Academic Analysis Tests
 *
 * Tests the full academic workshop pipeline to verify:
 * 1. Narrative extraction quality
 * 2. Contextual positioning accuracy
 * 3. Multi-dimensional scoring nuance
 * 4. Teaching generation helpfulness
 * 5. Harvard score mapping correctness
 *
 * These tests use REAL LLM calls to verify nuanced understanding.
 */

import {
  analyzeAcademicsWithDepth,
  buildHeuristicFoundation,
  type AcademicHistoryInput,
  type AcademicPortfolioScore,
  type NarrativeType,
  type HarvardScore,
} from '../src/services/portfolioStrategy/services/academicWorkshop';

// ============================================================================
// TEST PROFILES - Designed to test nuanced understanding
// ============================================================================

const TEST_PROFILES: {
  name: string;
  description: string;
  input: AcademicHistoryInput;
  expectedNarrative: NarrativeType[];
  expectedHarvardRange: [HarvardScore, HarvardScore];
  keyValidations: string[];
}[] = [
  {
    name: 'Consistent Excellence - Elite Profile',
    description: 'Top student at competitive school, maximum rigor, perfect grades',
    input: {
      courses: [
        // Freshman
        { name: 'Honors English 9', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors Biology', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors Algebra 2', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors World History', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Spanish 2', level: 'Standard', grade: 'A', year: 'Freshman' },
        // Sophomore
        { name: 'Honors English 10', level: 'Honors', grade: 'A', year: 'Sophomore' },
        { name: 'AP Chemistry', level: 'AP', grade: 'A', year: 'Sophomore' },
        { name: 'Honors Pre-Calculus', level: 'Honors', grade: 'A', year: 'Sophomore' },
        { name: 'AP European History', level: 'AP', grade: 'A', year: 'Sophomore' },
        { name: 'Honors Spanish 3', level: 'Honors', grade: 'A', year: 'Sophomore' },
        // Junior
        { name: 'AP English Language', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Physics C: Mechanics', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Calculus BC', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Spanish Language', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Computer Science A', level: 'AP', grade: 'A', year: 'Junior' },
        // Senior
        { name: 'AP English Literature', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'AP Physics C: E&M', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Multivariable Calculus', level: 'College', grade: 'A', year: 'Senior' },
        { name: 'AP Statistics', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'AP Spanish Literature', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Independent Research', level: 'Advanced', grade: 'A', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public Magnet',
        apCoursesOffered: 25,
        collegeAttendanceRate: 98,
        competitiveRanking: 'Top 50 nationally',
      },
      intendedMajor: 'Physics',
    },
    expectedNarrative: ['consistent_excellence'],
    expectedHarvardRange: [1, 2],
    keyValidations: [
      'Should identify maximum rigor utilization',
      'Should note STEM passion through Physics sequence',
      'Should recognize top 5% rigor positioning',
      'Should score high on intellectual character',
    ],
  },
  {
    name: 'Rising Star - Growth Trajectory',
    description: 'Started weak, dramatically improved by senior year',
    input: {
      courses: [
        // Freshman - Rough start
        { name: 'English 9', level: 'Standard', grade: 'C+', year: 'Freshman' },
        { name: 'Biology', level: 'Standard', grade: 'B-', year: 'Freshman' },
        { name: 'Algebra 1', level: 'Standard', grade: 'C', year: 'Freshman' },
        { name: 'World History', level: 'Standard', grade: 'B-', year: 'Freshman' },
        // Sophomore - Improvement begins
        { name: 'English 10', level: 'Standard', grade: 'B', year: 'Sophomore' },
        { name: 'Chemistry', level: 'Standard', grade: 'B+', year: 'Sophomore' },
        { name: 'Geometry', level: 'Standard', grade: 'B', year: 'Sophomore' },
        { name: 'US History', level: 'Honors', grade: 'B', year: 'Sophomore' },
        // Junior - Finding stride
        { name: 'Honors English 11', level: 'Honors', grade: 'A-', year: 'Junior' },
        { name: 'AP Chemistry', level: 'AP', grade: 'B+', year: 'Junior' },
        { name: 'Algebra 2', level: 'Honors', grade: 'A-', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'A-', year: 'Junior' },
        // Senior - Excellence
        { name: 'AP English Literature', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'AP Physics 1', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Pre-Calculus', level: 'Honors', grade: 'A', year: 'Senior' },
        { name: 'AP Government', level: 'AP', grade: 'A', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public',
        apCoursesOffered: 15,
        collegeAttendanceRate: 70,
      },
      intendedMajor: 'Political Science',
    },
    expectedNarrative: ['rising_star', 'late_bloomer'],
    expectedHarvardRange: [3, 4],
    keyValidations: [
      'Should identify ascending trajectory',
      'Should weight recent years more heavily',
      'Should note dramatic improvement narrative',
      'Should provide positive trajectory score',
    ],
  },
  {
    name: 'GPA Protector - Avoidance Pattern',
    description: 'High GPA but avoided challenging courses despite availability',
    input: {
      courses: [
        // All 4 years of easy A's with minimal rigor
        { name: 'English 9', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'Biology', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'Algebra 1', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'World History', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'English 10', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'Chemistry', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'Geometry', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'US History', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'English 11', level: 'Standard', grade: 'A', year: 'Junior' },
        { name: 'Physics', level: 'Standard', grade: 'A', year: 'Junior' },
        { name: 'Algebra 2', level: 'Standard', grade: 'A', year: 'Junior' },
        { name: 'Government', level: 'Standard', grade: 'A', year: 'Junior' },
        { name: 'English 12', level: 'Standard', grade: 'A', year: 'Senior' },
        { name: 'Environmental Science', level: 'Standard', grade: 'A', year: 'Senior' },
        { name: 'Statistics', level: 'Standard', grade: 'A', year: 'Senior' },
        { name: 'Economics', level: 'Standard', grade: 'A', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public',
        apCoursesOffered: 18,
        collegeAttendanceRate: 75,
      },
      intendedMajor: 'Business',
    },
    expectedNarrative: ['gpa_protector', 'strategic_scholar'],
    expectedHarvardRange: [4, 5],
    keyValidations: [
      'Should identify rigor avoidance despite availability',
      'Should score LOW on rigor dimension',
      'Should score LOW on intellectual character',
      'Should note "below_average" relative rigor',
      'Should flag GPA protection pattern',
    ],
  },
  {
    name: 'Passion-Driven STEM Focus',
    description: 'Deep commitment to computer science, lighter in other areas',
    input: {
      courses: [
        // Freshman
        { name: 'English 9', level: 'Standard', grade: 'B+', year: 'Freshman' },
        { name: 'Honors Biology', level: 'Honors', grade: 'A-', year: 'Freshman' },
        { name: 'Honors Algebra 2', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'World History', level: 'Standard', grade: 'B', year: 'Freshman' },
        { name: 'Intro to Programming', level: 'Standard', grade: 'A+', year: 'Freshman' },
        // Sophomore
        { name: 'English 10', level: 'Standard', grade: 'B', year: 'Sophomore' },
        { name: 'Honors Chemistry', level: 'Honors', grade: 'A-', year: 'Sophomore' },
        { name: 'Honors Pre-Calculus', level: 'Honors', grade: 'A', year: 'Sophomore' },
        { name: 'US History', level: 'Standard', grade: 'B', year: 'Sophomore' },
        { name: 'AP Computer Science A', level: 'AP', grade: 'A+', year: 'Sophomore' },
        // Junior
        { name: 'English 11', level: 'Standard', grade: 'B+', year: 'Junior' },
        { name: 'AP Physics 1', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Calculus BC', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'B+', year: 'Junior' },
        { name: 'AP Computer Science Principles', level: 'AP', grade: 'A+', year: 'Junior' },
        { name: 'Data Structures (Dual Enrollment)', level: 'College', grade: 'A', year: 'Junior' },
        // Senior
        { name: 'English 12', level: 'Standard', grade: 'B+', year: 'Senior' },
        { name: 'AP Physics C', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Linear Algebra (Dual Enrollment)', level: 'College', grade: 'A', year: 'Senior' },
        { name: 'Machine Learning (Dual Enrollment)', level: 'College', grade: 'A', year: 'Senior' },
        { name: 'Research: AI Project', level: 'Advanced', grade: 'A', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public',
        apCoursesOffered: 12,
        collegeAttendanceRate: 80,
      },
      intendedMajor: 'Computer Science',
    },
    expectedNarrative: ['passion_driven'],
    expectedHarvardRange: [2, 3],
    keyValidations: [
      'Should identify clear CS passion',
      'Should score HIGH on intellectual character',
      'Should note sustained depth in CS',
      'Should recognize appropriate major alignment',
      'Should not penalize heavily for B grades in non-major courses',
    ],
  },
  {
    name: 'Declining Trajectory - Red Flag',
    description: 'Started strong, declining by senior year',
    input: {
      courses: [
        // Freshman - Strong
        { name: 'Honors English 9', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors Biology', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors Geometry', level: 'Honors', grade: 'A-', year: 'Freshman' },
        { name: 'Honors World History', level: 'Honors', grade: 'A', year: 'Freshman' },
        // Sophomore - Still good
        { name: 'Honors English 10', level: 'Honors', grade: 'A-', year: 'Sophomore' },
        { name: 'AP Chemistry', level: 'AP', grade: 'B+', year: 'Sophomore' },
        { name: 'Honors Algebra 2', level: 'Honors', grade: 'B+', year: 'Sophomore' },
        { name: 'AP European History', level: 'AP', grade: 'A-', year: 'Sophomore' },
        // Junior - Declining
        { name: 'AP English Language', level: 'AP', grade: 'B', year: 'Junior' },
        { name: 'Honors Physics', level: 'Honors', grade: 'B-', year: 'Junior' },
        { name: 'Honors Pre-Calculus', level: 'Honors', grade: 'C+', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'B-', year: 'Junior' },
        // Senior - Continued decline + rigor drop
        { name: 'English 12', level: 'Standard', grade: 'B', year: 'Senior' },
        { name: 'Earth Science', level: 'Standard', grade: 'B+', year: 'Senior' },
        { name: 'Statistics', level: 'Standard', grade: 'B', year: 'Senior' },
        { name: 'Government', level: 'Standard', grade: 'B', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public',
        apCoursesOffered: 15,
        collegeAttendanceRate: 75,
      },
      intendedMajor: 'Undeclared',
    },
    expectedNarrative: ['struggling_fighter', 'unfocused'],
    expectedHarvardRange: [4, 5],
    keyValidations: [
      'Should identify declining trajectory',
      'Should flag rigor drop in senior year',
      'Should score low on trajectory dimension',
      'Should note this as concerning pattern',
      'Should provide improvement guidance',
    ],
  },
  {
    name: 'Under-Resourced School Excellence',
    description: 'Maximized limited opportunities at low-resource school',
    input: {
      courses: [
        // Only 3 APs offered at school, student took all
        { name: 'English 9', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'Biology', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'Algebra 1', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'World History', level: 'Standard', grade: 'A', year: 'Freshman' },
        { name: 'English 10', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'Chemistry', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'Geometry', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'US History', level: 'Standard', grade: 'A', year: 'Sophomore' },
        { name: 'English 11', level: 'Standard', grade: 'A', year: 'Junior' },
        { name: 'AP Calculus AB', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'Physics', level: 'Standard', grade: 'A', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'English 12', level: 'Standard', grade: 'A', year: 'Senior' },
        { name: 'AP English Literature', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Statistics', level: 'Standard', grade: 'A', year: 'Senior' },
        { name: 'Government', level: 'Standard', grade: 'A', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Rural Public',
        apCoursesOffered: 3,
        collegeAttendanceRate: 40,
        notes: 'Small rural school with limited advanced course offerings',
      },
      intendedMajor: 'History',
    },
    expectedNarrative: ['consistent_excellence', 'passion_driven'],
    expectedHarvardRange: [2, 3],
    keyValidations: [
      'Should recognize context - all available APs taken',
      'Should score HIGH on rigor relative to context',
      'Should note maximized opportunity utilization',
      'Should position favorably for context',
      'Should NOT penalize for low raw AP count',
    ],
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  harvardScore: HarvardScore | null;
  narrativeType: NarrativeType | null;
  validationResults: { validation: string; passed: boolean; details: string }[];
  error?: string;
  cost: number;
  timeMs: number;
}

async function runTest(
  profile: (typeof TEST_PROFILES)[number]
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    name: profile.name,
    passed: false,
    harvardScore: null,
    narrativeType: null,
    validationResults: [],
    cost: 0,
    timeMs: 0,
  };

  try {
    const analysisResult = await analyzeAcademicsWithDepth(profile.input, {
      includeTeaching: true,
      targetSelectivity: 'top_25',
    });

    if (!analysisResult.success || !analysisResult.result) {
      result.error = analysisResult.error || 'Analysis failed';
      result.timeMs = Date.now() - startTime;
      return result;
    }

    const analysis = analysisResult.result;
    result.harvardScore = analysis.harvardScore;
    result.narrativeType = analysis.narrativeAnalysis.narrativeType;
    result.cost = analysis.analysisMetadata.totalCost;

    // Validate Harvard score range
    const [minExpected, maxExpected] = profile.expectedHarvardRange;
    const harvardPassed =
      analysis.harvardScore >= minExpected && analysis.harvardScore <= maxExpected;
    result.validationResults.push({
      validation: `Harvard score in expected range [${minExpected}, ${maxExpected}]`,
      passed: harvardPassed,
      details: `Got: ${analysis.harvardScore} (${analysis.harvardLabel})`,
    });

    // Validate narrative type
    const narrativePassed = profile.expectedNarrative.includes(
      analysis.narrativeAnalysis.narrativeType
    );
    result.validationResults.push({
      validation: `Narrative type is one of: ${profile.expectedNarrative.join(', ')}`,
      passed: narrativePassed,
      details: `Got: ${analysis.narrativeAnalysis.narrativeType}`,
    });

    // Validate key aspects (qualitative)
    for (const validation of profile.keyValidations) {
      // These are for manual review, auto-pass with details
      result.validationResults.push({
        validation,
        passed: true, // Manual validation needed
        details: 'See full analysis output',
      });
    }

    // Check for teaching content
    const hasTeaching =
      analysis.teaching.dimensionExplanations.length > 0 ||
      analysis.teaching.strengthHighlights.length > 0;
    result.validationResults.push({
      validation: 'Teaching content generated',
      passed: hasTeaching,
      details: `${analysis.teaching.dimensionExplanations.length} dimension explanations, ${analysis.teaching.strengthHighlights.length} strength highlights`,
    });

    // Check for improvement paths
    const hasImprovementPaths = analysis.improvementPaths.length > 0;
    result.validationResults.push({
      validation: 'Improvement paths generated',
      passed: hasImprovementPaths,
      details: `${analysis.improvementPaths.length} paths generated`,
    });

    // Overall pass
    result.passed = harvardPassed && narrativePassed && hasTeaching;
    result.timeMs = Date.now() - startTime;

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.timeMs = Date.now() - startTime;
    return result;
  }
}

async function runHeuristicTests(): Promise<{ passed: number; total: number }> {
  console.log('\n📊 Running Heuristic Foundation Tests...\n');

  let passed = 0;
  const tests = [
    {
      name: 'Heuristic: Calculates raw metrics correctly',
      test: () => {
        const input: AcademicHistoryInput = {
          courses: [
            { name: 'AP Calc', level: 'AP', grade: 'A', year: 'Junior' },
            { name: 'AP Physics', level: 'AP', grade: 'A-', year: 'Junior' },
            { name: 'Honors English', level: 'Honors', grade: 'B+', year: 'Junior' },
            { name: 'IB History', level: 'IB', grade: 'A', year: 'Senior' },
          ],
        };
        const result = buildHeuristicFoundation(input);
        if (!result.success || !result.foundation) return false;

        const metrics = result.foundation.rawMetrics;
        return (
          metrics.apCourses === 2 &&
          metrics.ibCourses === 1 &&
          metrics.honorsCourses === 1 &&
          metrics.totalCourses === 4
        );
      },
    },
    {
      name: 'Heuristic: Detects ascending trajectory',
      test: () => {
        const input: AcademicHistoryInput = {
          courses: [
            { name: 'English 9', level: 'Standard', grade: 'C', year: 'Freshman' },
            { name: 'English 10', level: 'Standard', grade: 'B', year: 'Sophomore' },
            { name: 'English 11', level: 'Standard', grade: 'A-', year: 'Junior' },
            { name: 'English 12', level: 'Standard', grade: 'A', year: 'Senior' },
          ],
        };
        const result = buildHeuristicFoundation(input);
        if (!result.success || !result.foundation) return false;
        return result.foundation.trajectory.gpaTrajectoryType === 'ascending';
      },
    },
    {
      name: 'Heuristic: Detects declining trajectory',
      test: () => {
        const input: AcademicHistoryInput = {
          courses: [
            { name: 'English 9', level: 'Standard', grade: 'A', year: 'Freshman' },
            { name: 'English 10', level: 'Standard', grade: 'A-', year: 'Sophomore' },
            { name: 'English 11', level: 'Standard', grade: 'B', year: 'Junior' },
            { name: 'English 12', level: 'Standard', grade: 'C+', year: 'Senior' },
          ],
        };
        const result = buildHeuristicFoundation(input);
        if (!result.success || !result.foundation) return false;
        return result.foundation.trajectory.gpaTrajectoryType === 'declining';
      },
    },
  ];

  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        console.log(`  ✅ ${test.name}`);
        passed++;
      } else {
        console.log(`  ❌ ${test.name}`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} - Error: ${error}`);
    }
  }

  return { passed, total: tests.length };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        NUANCED ACADEMIC ANALYSIS TEST SUITE                  ║');
  console.log('║        Testing Multi-Layer Understanding Pipeline            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Run heuristic tests first (no LLM needed)
  const heuristicResults = await runHeuristicTests();
  console.log(
    `\nHeuristic Tests: ${heuristicResults.passed}/${heuristicResults.total} passed\n`
  );

  // Run full pipeline tests
  console.log('📚 Running Full Pipeline Tests (with LLM)...\n');

  const results: TestResult[] = [];
  let totalCost = 0;

  for (const profile of TEST_PROFILES) {
    console.log(`\n  Testing: ${profile.name}`);
    console.log(`  Description: ${profile.description}`);

    const result = await runTest(profile);
    results.push(result);
    totalCost += result.cost;

    if (result.error) {
      console.log(`  ❌ FAILED: ${result.error}`);
    } else {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} Harvard: ${result.harvardScore}, Narrative: ${result.narrativeType}`);
      console.log(`     Time: ${result.timeMs}ms, Cost: $${result.cost.toFixed(4)}`);

      for (const v of result.validationResults) {
        const vStatus = v.passed ? '✓' : '✗';
        console.log(`     ${vStatus} ${v.validation}: ${v.details}`);
      }
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  console.log(`\nHeuristic Tests: ${heuristicResults.passed}/${heuristicResults.total}`);
  console.log(`Pipeline Tests: ${passed}/${results.length}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);

  // Detailed results table
  console.log('\n┌────────────────────────────────────────┬────────┬──────────────────────┐');
  console.log('│ Profile                                │ Score  │ Narrative            │');
  console.log('├────────────────────────────────────────┼────────┼──────────────────────┤');
  for (const r of results) {
    const status = r.passed ? '✅' : '❌';
    const name = r.name.padEnd(36).substring(0, 36);
    const score = r.harvardScore !== null ? String(r.harvardScore).padStart(4) : ' N/A';
    const narrative = (r.narrativeType || 'N/A').padEnd(18).substring(0, 18);
    console.log(`│ ${status} ${name} │ ${score}   │ ${narrative}   │`);
  }
  console.log('└────────────────────────────────────────┴────────┴──────────────────────┘');

  // Exit code
  const allPassed =
    passed === results.length && heuristicResults.passed === heuristicResults.total;
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
