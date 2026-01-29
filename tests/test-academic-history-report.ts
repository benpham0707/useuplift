/**
 * Academic History Report Tests
 *
 * Tests the comprehensive academic history analysis that provides:
 * - How AOs will evaluate transcripts
 * - GPA and rigor analysis in context
 * - Competitive positioning
 * - Red flags with mitigation strategies
 * - Actionable guidance with draft language
 */

import {
  generateAcademicHistoryReport,
  buildHeuristicFoundation,
  type AcademicHistoryInput,
  type AcademicHistoryReport,
} from '../src/services/portfolioStrategy/services/academicWorkshop';

// ============================================================================
// TEST PROFILES
// ============================================================================

const TEST_PROFILES: {
  name: string;
  description: string;
  input: AcademicHistoryInput;
  targetTier: 'ivy_plus' | 'top_20' | 'top_50' | 'state_flagship';
  expectedHarvardScore: [number, number]; // [min, max]
  keyChecks: string[];
}[] = [
  {
    name: 'Elite STEM Student',
    description: 'Maximum rigor, excellent grades, clear STEM focus',
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
        { name: 'AP Computer Science A', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Spanish Language', level: 'AP', grade: 'A-', year: 'Junior' },
        // Senior
        { name: 'AP English Literature', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'AP Physics C: E&M', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Multivariable Calculus', level: 'College', grade: 'A', year: 'Senior' },
        { name: 'AP Statistics', level: 'AP', grade: 'A', year: 'Senior' },
        { name: 'Linear Algebra', level: 'College', grade: 'A', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public Magnet',
        apCoursesOffered: 25,
        collegeAttendanceRate: 98,
        competitiveRanking: 'Top 50 nationally',
      },
      intendedMajor: 'Computer Science',
    },
    targetTier: 'ivy_plus',
    expectedHarvardScore: [1, 2],
    keyChecks: [
      'Should identify maximum rigor utilization',
      'Should note Physics C (Tier 1) courses',
      'Should assess strong CS preparation',
      'Should show low/no red flags',
      'Should indicate academically qualified for Ivy+',
    ],
  },
  {
    name: 'GPA Protector',
    description: 'High GPA but avoided challenge despite availability',
    input: {
      courses: [
        // All standard courses with A grades
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
    targetTier: 'top_20',
    expectedHarvardScore: [4, 6],
    keyChecks: [
      'Should identify rigor avoidance red flag',
      'Should note GPA protection pattern',
      'Should flag 0 APs despite 18 available',
      'Should indicate NOT academically qualified for top schools',
      'Should provide mitigation advice (explain in Additional Info)',
    ],
  },
  {
    name: 'Rising Star',
    description: 'Weak start, dramatic improvement by senior year',
    input: {
      courses: [
        // Freshman - Rough
        { name: 'English 9', level: 'Standard', grade: 'C+', year: 'Freshman' },
        { name: 'Biology', level: 'Standard', grade: 'B-', year: 'Freshman' },
        { name: 'Algebra 1', level: 'Standard', grade: 'C', year: 'Freshman' },
        { name: 'World History', level: 'Standard', grade: 'B-', year: 'Freshman' },
        // Sophomore - Improving
        { name: 'English 10', level: 'Standard', grade: 'B', year: 'Sophomore' },
        { name: 'Chemistry', level: 'Standard', grade: 'B+', year: 'Sophomore' },
        { name: 'Geometry', level: 'Standard', grade: 'B', year: 'Sophomore' },
        { name: 'US History', level: 'Honors', grade: 'B', year: 'Sophomore' },
        // Junior - Strong
        { name: 'Honors English 11', level: 'Honors', grade: 'A-', year: 'Junior' },
        { name: 'AP Chemistry', level: 'AP', grade: 'B+', year: 'Junior' },
        { name: 'Algebra 2', level: 'Honors', grade: 'A-', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'A-', year: 'Junior' },
        // Senior - Excellent
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
    targetTier: 'top_50',
    expectedHarvardScore: [3, 4],
    keyChecks: [
      'Should identify ascending trajectory (positive)',
      'Should weight junior/senior heavily (63% combined)',
      'Should note C grades but contextualize with improvement',
      'Should provide framing advice for Additional Info',
      'Should indicate competitive for top 50',
    ],
  },
  {
    name: 'Under-Resourced Excellence',
    description: 'Maximized limited opportunities at low-resource school',
    input: {
      courses: [
        // Only 3 APs offered at school - student took all
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
    targetTier: 'top_20',
    expectedHarvardScore: [2, 3],
    keyChecks: [
      'Should contextualize: 3/3 APs taken (100% utilization)',
      'Should NOT penalize for low raw AP count',
      'Should note school context positively',
      'Should recommend counselor letter emphasize context',
      'Should indicate strong for context',
    ],
  },
  {
    name: 'Senior Decline Warning',
    description: 'Strong history but concerning senior year pattern',
    input: {
      courses: [
        // Freshman/Sophomore - Strong
        { name: 'Honors English 9', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors Biology', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors Geometry', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors World History', level: 'Honors', grade: 'A', year: 'Freshman' },
        { name: 'Honors English 10', level: 'Honors', grade: 'A', year: 'Sophomore' },
        { name: 'AP Chemistry', level: 'AP', grade: 'A-', year: 'Sophomore' },
        { name: 'Honors Algebra 2', level: 'Honors', grade: 'A', year: 'Sophomore' },
        { name: 'AP European History', level: 'AP', grade: 'A', year: 'Sophomore' },
        // Junior - Strong
        { name: 'AP English Language', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP Physics 1', level: 'AP', grade: 'A-', year: 'Junior' },
        { name: 'AP Calculus AB', level: 'AP', grade: 'A', year: 'Junior' },
        { name: 'AP US History', level: 'AP', grade: 'A', year: 'Junior' },
        // Senior - Decline in rigor AND performance
        { name: 'English 12', level: 'Standard', grade: 'B+', year: 'Senior' },
        { name: 'Statistics', level: 'Standard', grade: 'B', year: 'Senior' },
        { name: 'Government', level: 'Standard', grade: 'B+', year: 'Senior' },
        { name: 'Art History', level: 'Standard', grade: 'A-', year: 'Senior' },
      ],
      schoolContext: {
        schoolType: 'Public',
        apCoursesOffered: 15,
        collegeAttendanceRate: 75,
      },
      intendedMajor: 'Undeclared',
    },
    targetTier: 'top_20',
    expectedHarvardScore: [3, 4],
    keyChecks: [
      'Should flag senior year rigor decline',
      'Should flag senior year grade decline',
      'Should note 22% rescission rate risk',
      'Should provide explanation strategy',
      'Should warn about mid-year report importance',
    ],
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  harvardScore: number | null;
  error?: string;
  keyFindings: string[];
  cost: number;
  timeMs: number;
}

async function runTest(profile: (typeof TEST_PROFILES)[number]): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    name: profile.name,
    passed: false,
    harvardScore: null,
    keyFindings: [],
    cost: 0,
    timeMs: 0,
  };

  try {
    // Build heuristics first
    const heuristicResult = buildHeuristicFoundation(profile.input);
    if (!heuristicResult.success || !heuristicResult.foundation) {
      result.error = 'Failed to build heuristics';
      result.timeMs = Date.now() - startTime;
      return result;
    }

    // Generate comprehensive report
    const reportResult = await generateAcademicHistoryReport(
      profile.input,
      heuristicResult.foundation,
      profile.targetTier
    );

    if (!reportResult.success || !reportResult.report) {
      result.error = reportResult.error || 'Failed to generate report';
      result.timeMs = Date.now() - startTime;
      return result;
    }

    const report = reportResult.report;
    result.harvardScore = report.executiveSummary.harvardScore;
    result.cost = report.analysisMetadata.totalCost;
    result.timeMs = Date.now() - startTime;

    // Extract key findings for display
    result.keyFindings = [
      `One-sentence: "${report.executiveSummary.oneSentenceRead}"`,
      `First impression: "${report.admissionsOfficerPerspective?.firstImpression || 'N/A'}"`,
      `Risk level: ${report.redFlagsAndConcerns?.overallRiskLevel || 'N/A'}`,
      `Academically qualified: ${report.admissionsOfficerPerspective?.predictedOutcome?.academicallyQualified ? 'Yes' : 'No'}`,
    ];

    // Validate Harvard score range
    const [minScore, maxScore] = profile.expectedHarvardScore;
    result.passed = report.executiveSummary.harvardScore >= minScore &&
                    report.executiveSummary.harvardScore <= maxScore;

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.timeMs = Date.now() - startTime;
    return result;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ACADEMIC HISTORY REPORT TEST SUITE                     ║');
  console.log('║         Testing Comprehensive Admissions Analysis              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  let totalCost = 0;

  for (const profile of TEST_PROFILES) {
    console.log(`\n▶ Testing: ${profile.name}`);
    console.log(`  ${profile.description}`);
    console.log(`  Target: ${profile.targetTier}, Expected Score: ${profile.expectedHarvardScore[0]}-${profile.expectedHarvardScore[1]}`);

    const result = await runTest(profile);
    results.push(result);
    totalCost += result.cost;

    if (result.error) {
      console.log(`  ❌ FAILED: ${result.error}`);
    } else {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} Harvard Score: ${result.harvardScore}`);
      console.log(`     Time: ${result.timeMs}ms, Cost: $${result.cost.toFixed(4)}`);

      console.log('     Key Findings:');
      for (const finding of result.keyFindings) {
        console.log(`       • ${finding}`);
      }
    }

    // Rate limiting between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter((r) => r.passed).length;
  console.log(`\nTests Passed: ${passed}/${results.length}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);

  console.log('\n┌─────────────────────────────────┬────────┬──────────┬────────────┐');
  console.log('│ Profile                         │ Score  │ Expected │ Status     │');
  console.log('├─────────────────────────────────┼────────┼──────────┼────────────┤');

  for (const r of results) {
    const name = r.name.padEnd(31).substring(0, 31);
    const score = r.harvardScore !== null ? String(r.harvardScore).padStart(4) : ' N/A';
    const expected = TEST_PROFILES.find((p) => p.name === r.name)?.expectedHarvardScore;
    const expStr = expected ? `${expected[0]}-${expected[1]}`.padStart(6) : '   N/A';
    const status = r.passed ? '✅ Pass    ' : '❌ Fail    ';
    console.log(`│ ${name} │ ${score}   │ ${expStr}   │ ${status}│`);
  }

  console.log('└─────────────────────────────────┴────────┴──────────┴────────────┘');

  process.exit(passed === results.length ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
