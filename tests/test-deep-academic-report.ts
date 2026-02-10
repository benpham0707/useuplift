/**
 * Deep Academic Report Service — E2E Test
 *
 * Tests the full pipeline: context assembly → LLM generation → report structure.
 * Uses a realistic CS student profile (Sarah Chen from the E2E docs).
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-deep-academic-report.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { generateDeepAcademicReport } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportService';
import type {
  DeepAcademicReportInput,
  DeepAcademicReport,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportTypes';
import type { NuancedCapabilityAnalysis } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

// ============================================================================
// MOCK STUDENT PROFILE (Sarah Chen — CS major)
// ============================================================================

function makeSubjectPattern(
  avgGPA: number,
  trend: 'improving' | 'stable' | 'declining',
  strength: number,
  courses: Array<{ name: string; grade: number; level: string; year: number }>
) {
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
        year: c.year,
      })),
    },
    byDifficulty: {
      ap_ib: { avgGPA, courses: courses.filter(c => c.level === 'ap').map(c => c.name) },
      honors: { avgGPA: avgGPA + 0.2, courses: courses.filter(c => c.level === 'honors').map(c => c.name) },
      regular: { avgGPA: avgGPA + 0.4, courses: [] },
    },
    relativeStrength: strength,
    strengthAssessment: strength > 0.1 ? 'relative strength' : strength < -0.1 ? 'relative challenge' : 'average',
    recommendedLevel: 'ap_ib' as const,
    levelReasoning: 'Based on demonstrated performance at this level',
    projectedOutcome: {
      expectedGrade: avgGPA >= 3.7 ? 'A-' : avgGPA >= 3.3 ? 'B+' : 'B',
      confidence: 0.75,
      reasoning: 'Consistent with historical performance',
    },
  };
}

const mockAnalysis: NuancedCapabilityAnalysis = {
  performanceFingerprint: {
    expectedGPAByLevel: {
      ap_ib: { expectedGPA: 3.52, range: { low: 3.0, high: 4.0 }, confidence: 0.82, sampleSize: 6, trend: 'stable' as const },
      honors: { expectedGPA: 3.77, range: { low: 3.5, high: 4.0 }, confidence: 0.88, sampleSize: 4, trend: 'stable' as const },
      regular: null,
    },
    sweetSpot: { level: 'ap_ib' as const, expectedGPA: 3.52, confidence: 0.82, reasoning: 'Demonstrated B+/A- at AP level' },
    consistencyScore: 73,
    difficultySensitivity: 'moderate' as const,
    difficultySensitivityDetail: 'Grades drop ~0.25 points when moving up a level',
    performancePercentile: 78,
  },
  subjectPatterns: {
    math: makeSubjectPattern(3.77, 'stable', 0.35, [
      { name: 'AP Calculus BC', grade: 3.7, level: 'ap', year: 2024 },
      { name: 'AP Statistics', grade: 3.3, level: 'ap', year: 2024 },
      { name: 'Precalculus Honors', grade: 3.9, level: 'honors', year: 2023 },
    ]),
    science: makeSubjectPattern(3.43, 'stable', 0.05, [
      { name: 'AP Physics C: Mechanics', grade: 3.3, level: 'ap', year: 2024 },
      { name: 'AP Chemistry', grade: 3.0, level: 'ap', year: 2023 },
      { name: 'Chemistry Honors', grade: 3.7, level: 'honors', year: 2023 },
    ]),
    english: makeSubjectPattern(3.70, 'stable', 0.15, [
      { name: 'AP English Language', grade: 3.7, level: 'ap', year: 2024 },
      { name: 'English 10 Honors', grade: 3.9, level: 'honors', year: 2023 },
    ]),
    social_studies: makeSubjectPattern(3.50, 'stable', -0.10, [
      { name: 'AP US History', grade: 3.3, level: 'ap', year: 2024 },
      { name: 'World History Honors', grade: 3.7, level: 'honors', year: 2023 },
    ]),
    computer_science: makeSubjectPattern(3.90, 'stable', 0.40, [
      { name: 'AP Computer Science A', grade: 4.0, level: 'ap', year: 2024 },
    ]),
  },
  challengeResponse: {
    transitionAnalysis: {
      observedTransitions: [
        { subject: 'Math', from: 'Honors', to: 'AP', gradeBefore: 3.9, gradeAfter: 3.5, year: '2024', outcome: 'adapted' as const },
        { subject: 'Science', from: 'Honors', to: 'AP', gradeBefore: 3.7, gradeAfter: 3.15, year: '2024', outcome: 'adapted' as const },
        { subject: 'English', from: 'Honors', to: 'AP', gradeBefore: 3.9, gradeAfter: 3.7, year: '2024', outcome: 'thrived' as const },
      ],
      typicalImpact: -0.37,
      adaptationSpeed: 'gradual' as const,
      recoveryPattern: 'partial_recovery' as const,
    },
    challengeRiskProfile: {
      riskLevel: 38,
      riskFactors: ['Moderate grade drops when moving up difficulty'],
      protectiveFactors: ['Strong math/CS foundation', 'Improving trajectory', 'Thrives in English at AP level'],
      recommendation: 'Can take on additional challenge in strength areas',
    },
    successConditions: ['Increase difficulty in Math, CS, English', 'Monitor weekly in new APs'],
    warningIndicators: ['Grade dropping below B in any AP', 'Science grades declining further'],
  },
  progressionTrajectory: {
    historical: {
      gpaByYear: [
        { year: 'Sophomore', gpa: 3.60, rigorLevel: 1.8 },
        { year: 'Junior', gpa: 3.58, rigorLevel: 2.6 },
      ],
      overallTrend: 'stable' as const,
      trendStrength: 65,
      inflectionPoints: [{
        year: 'Junior',
        event: 'Rigor jumped from 1.8 to 2.6 with minimal GPA drop',
        impact: 'positive' as const,
        description: 'Maintained GPA while nearly doubling course rigor',
      }],
    },
    projected: {
      nextYearGPA: { expected: 3.65, range: { low: 3.45, high: 3.80 } },
      ceilingEstimate: 3.90,
      trajectory: 'upward' as const,
      confidence: 0.75,
    },
    trajectoryLevers: [
      { lever: 'Add AP in strength area', impact: 'positive' as const, magnitude: 'moderate' as const, description: 'CS or Math AP would likely boost GPA' },
    ],
  },
  performanceEnvelope: {
    ceiling: { gpa: 3.90, conditions: 'AP course in strongest subject (CS)', isRepeatable: true, howToReach: 'Take courses aligned with strengths and interests' },
    floor: { gpa: 3.00, conditions: 'Challenging AP in non-strength subject', warningSignsThatPrecedeIt: ['Low interest', 'Content not building on strengths'], howToAvoid: 'Pair challenging APs with study groups; avoid stacking weak subjects' },
    comfortableRange: { low: 3.30, high: 3.70, typicalGPA: 3.55, description: 'Typically performs between B+ and A-' },
    optimalTarget: { gpa: 3.65, reasoning: 'Based on sweet spot and demonstrated range', tradeoffs: 'Maintaining AP rigor may mean B+ in some courses' },
  },
  synthesis: {
    profileSummary: 'Your optimal difficulty level is AP/IB courses, where you can expect B+/A- grades. Your performance has been improving over time. Your grades are moderately sensitive to difficulty level.',
    strengths: [
      { insight: 'Strong in Computer Science', evidence: 'A in AP CSA, your highest AP grade', implication: 'Push yourself here — consider advanced CS courses' },
      { insight: 'Strong in Mathematics', evidence: '3.77 average, 35% above your overall performance', implication: 'Continue at AP level' },
      { insight: 'Consistent performance', evidence: '73% consistency score across varied difficulty levels', implication: 'You can confidently predict your outcomes' },
      { insight: 'Thrives under increased challenge in English', evidence: 'AP English Language with only 0.2 GPA drop from Honors', implication: 'AP English Literature is a strong candidate' },
    ],
    challenges: [
      { insight: 'Moderate difficulty sensitivity in Science', evidence: '0.55 GPA drop from Chemistry Honors to AP Chemistry', implication: 'Be strategic about AP Science choices' },
      { insight: 'Past difficulty with Science level transitions', evidence: 'Struggled when increasing difficulty in Chemistry', implication: 'Don\'t add AP Biology on top of existing AP science load' },
    ],
    coreInsight: 'Balance challenge with success — your sweet spot is AP/IB courses (B+/A-).',
    uniquePattern: 'Your ability to maintain GPA while dramatically increasing rigor, particular strength in CS and Mathematics.',
  },
} as unknown as NuancedCapabilityAnalysis;

// ============================================================================
// TEST RUNNER
// ============================================================================

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

async function runTests() {
  console.log('=================================================================');
  console.log('  DEEP ACADEMIC REPORT SERVICE — E2E TEST');
  console.log('=================================================================');

  const input: DeepAcademicReportInput = {
    quantitativeAnalysis: mockAnalysis,
    intendedMajor: 'Computer Science',
    currentGrade: 11,
    schoolContext: { type: 'well_resourced_suburban', apCoursesAvailable: 15 },
  };

  // ===== Generate Report =====
  section('Generating Deep Academic Report');
  console.log('  (This makes 3 LLM calls — may take 15-30 seconds...)');

  const startTime = Date.now();
  let report: DeepAcademicReport;

  try {
    report = await generateDeepAcademicReport(input);
  } catch (error) {
    console.log(`\n  FATAL: Report generation failed: ${error}`);
    process.exit(1);
  }

  const duration = Date.now() - startTime;
  console.log(`  Generated in ${(duration / 1000).toFixed(1)}s`);
  console.log(`  Cost: $${report.metadata.estimatedCost.toFixed(4)}`);
  console.log(`  Tokens: ${report.metadata.tokenUsage.input} input, ${report.metadata.tokenUsage.output} output`);
  console.log(`  Fallback used: ${report.metadata.usedFallback}`);

  // ===== Section 1: Academic Identity =====
  section('Section 1: Academic Identity');
  const id = report.academicIdentity;
  assert(id.narrativeIdentity.length > 200, `Narrative identity should be substantial (got ${id.narrativeIdentity.length} chars)`);
  assert(id.notableStrengths.length >= 2, `Should have at least 2 notable strengths (got ${id.notableStrengths.length})`);
  for (const ns of id.notableStrengths) {
    assert(ns.subject.length > 0, `Notable strength subject should not be empty`);
    assert(ns.insight.length > 20, `Notable strength insight should be non-trivial (got ${ns.insight.length} chars)`);
    assert(ns.majorRelevance.length > 10, `Major relevance should exist (got ${ns.majorRelevance.length} chars)`);
    console.log(`  Strength: "${ns.subject}" — insight: ${ns.insight.length}c, relevance: ${ns.majorRelevance.length}c`);
  }
  // Weakness highlights
  assert(id.notableWeaknesses.length >= 1, `Should have at least 1 notable weakness (got ${id.notableWeaknesses.length})`);
  for (const nw of id.notableWeaknesses) {
    assert(nw.area.length > 0, `Weakness area should not be empty`);
    assert(nw.gap.length > 15, `Weakness gap description should be meaningful (got ${nw.gap.length} chars)`);
    assert(nw.consequence.length > 10, `Weakness consequence should exist (got ${nw.consequence.length} chars)`);
    console.log(`  Weakness: "${nw.area}" — gap: ${nw.gap.length}c, consequence: ${nw.consequence.length}c`);
  }

  // Tier Position
  assert(id.tierPosition.currentTier.length > 5, `Tier should be specified (got "${id.tierPosition.currentTier}")`);
  assert(id.tierPosition.tierExamples.length >= 2, `Should have tier examples (got ${id.tierPosition.tierExamples.length})`);
  assert(id.tierPosition.gpaPosition.length > 10, `GPA position should be specified`);
  assert(id.tierPosition.tierGap.length > 10, `Tier gap should be specified`);
  console.log(`  Tier: ${id.tierPosition.currentTier}`);
  console.log(`  Examples: ${id.tierPosition.tierExamples.join(', ')}`);
  if (id.tierPosition.strengthTier) console.log(`  Strength tier: ${id.tierPosition.strengthTier}`);
  if (id.tierPosition.weaknessTier) console.log(`  Weakness tier: ${id.tierPosition.weaknessTier}`);

  // Uplift Scale Rating
  const validGrades = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'];
  assert(validGrades.includes(id.upliftRating.grade), `Uplift grade should be valid letter grade (got "${id.upliftRating.grade}")`);
  assert(id.upliftRating.explanation.length > 50, `Uplift explanation should be detailed (got ${id.upliftRating.explanation.length} chars)`);

  assert(id.trajectoryMeaning.length > 50, `Trajectory meaning should be detailed (got ${id.trajectoryMeaning.length} chars)`);
  assert(id.definingPattern.length > 30, `Defining pattern should be specific (got ${id.definingPattern.length} chars)`);
  console.log(`  Narrative: ${id.narrativeIdentity.length} chars`);
  console.log(`  Notable strengths: ${id.notableStrengths.length}`);
  console.log(`  Notable weaknesses: ${id.notableWeaknesses.length}`);
  console.log(`  Uplift Rating: ${id.upliftRating.grade}`);
  console.log(`  Source: ${report.metadata.sectionSources.academicIdentity}`);

  // ===== Section 2: Challenges & Admissions Reality =====
  section('Section 2: Challenges & Admissions Reality');
  const car = report.challengesAndReality;
  assert(car.firstGlance.length > 50, `First glance should be candid (got ${car.firstGlance.length} chars)`);
  assert(car.challenges.length >= 1, `Should have at least 1 challenge (got ${car.challenges.length})`);
  assert(car.unintendedNarrative.length > 30, `Unintended narrative should be specific (got ${car.unintendedNarrative.length} chars)`);
  assert(car.narrativeControlStrategy.length > 30, `Control strategy should be actionable (got ${car.narrativeControlStrategy.length} chars)`);

  for (const c of car.challenges) {
    assert(c.title.length > 0, `Challenge title should not be empty`);
    assert(c.issue.length > 20, `Issue should be meaningful (got ${c.issue.length} chars)`);
    assert(c.aoImpact.length > 20, `AO impact should be specific (got ${c.aoImpact.length} chars)`);
    assert(c.tierImpact.length > 10, `Tier impact should be specified (got ${c.tierImpact.length} chars)`);
    assert(c.roadmapConnection.length > 10, `Roadmap connection should exist (got ${c.roadmapConnection.length} chars)`);
    console.log(`  "${c.title}": issue ${c.issue.length}c, aoImpact ${c.aoImpact.length}c, tierImpact ${c.tierImpact.length}c, ${c.researchBacking.length} citations`);
  }
  console.log(`  First glance: ${car.firstGlance.length} chars`);
  console.log(`  Challenges: ${car.challenges.length}`);
  console.log(`  Source: ${report.metadata.sectionSources.challengesAndReality}`);

  // ===== Section 3: Strategic Roadmap =====
  section('Section 3: Strategic Roadmap');
  const road = report.strategicRoadmap;
  assert(road.priorities.length >= 2, `Should have at least 2 priorities (got ${road.priorities.length})`);
  assert(road.courseStrategy.recommended.length >= 2, `Should have at least 2 recommended courses (got ${road.courseStrategy.recommended.length})`);
  assert(road.majorAlignment.score >= 0 && road.majorAlignment.score <= 100, `Alignment score should be 0-100 (got ${road.majorAlignment.score})`);
  assert(road.trajectoryOptimization.length > 30, `Trajectory optimization should be specific`);

  for (const p of road.priorities) {
    assert(p.title.length > 0, `Priority title should not be empty`);
    assert(p.description.length > 30, `Priority description should be specific`);
    assert(p.actionItems.length >= 1, `Priority should have action items`);
  }
  console.log(`  Priorities: ${road.priorities.map(p => `[${p.impact}] ${p.title}`).join(', ')}`);
  console.log(`  Courses: ${road.courseStrategy.recommended.length} recommended, ${road.courseStrategy.avoid.length} to avoid`);
  console.log(`  Major alignment: ${road.majorAlignment.score}/100`);
  console.log(`  Source: ${report.metadata.sectionSources.strategicRoadmap}`);

  // ===== Section 4: Research Context =====
  section('Section 4: Research Context (Template)');
  const rc = report.researchContext;
  assert(rc.apStatistics.length >= 1, `Should have AP statistics (got ${rc.apStatistics.length})`);
  assert(rc.collegeTierExpectations.length === 4, `Should have 4 tier expectations (got ${rc.collegeTierExpectations.length})`);
  assert(rc.majorRequirements !== undefined, `CS student should have major requirements`);
  assert(rc.admissionsFactors.length >= 3, `Should have admissions factors (got ${rc.admissionsFactors.length})`);

  if (rc.majorRequirements) {
    assert(rc.majorRequirements.major === 'Computer Science', `Major should resolve to CS (got ${rc.majorRequirements.major})`);
    assert(rc.majorRequirements.minimumCourses.length > 0, `Should have minimum courses`);
    assert(rc.majorRequirements.competitiveCourses.length > 0, `Should have competitive courses`);
    console.log(`  Major: ${rc.majorRequirements.major}`);
    console.log(`  Minimum courses: ${rc.majorRequirements.minimumCourses.join(', ')}`);
  }
  console.log(`  AP stats: ${rc.apStatistics.length} courses`);
  console.log(`  Source: ${report.metadata.sectionSources.researchContext}`);

  // ===== Metadata Checks =====
  section('Metadata');
  assert(report.metadata.generationTimeMs > 0, 'Generation time should be positive');
  assert(report.metadata.estimatedCost > 0, `Cost should be positive (got $${report.metadata.estimatedCost.toFixed(4)})`);
  assert(report.metadata.estimatedCost < 0.25, `Cost should be under $0.25 (got $${report.metadata.estimatedCost.toFixed(4)})`);
  assert(!report.metadata.usedFallback, 'Should not have used fallback');
  console.log(`  Time: ${(report.metadata.generationTimeMs / 1000).toFixed(1)}s`);
  console.log(`  Cost: $${report.metadata.estimatedCost.toFixed(4)}`);
  console.log(`  Tokens: ${report.metadata.tokenUsage.input} in, ${report.metadata.tokenUsage.output} out`);

  // ===== Depth Check =====
  section('Depth Verification');
  const totalChars = [
    report.academicIdentity.narrativeIdentity,
    ...report.academicIdentity.notableStrengths.map(ns => ns.insight + ns.majorRelevance),
    ...report.challengesAndReality.challenges.map(c => c.issue + c.aoImpact + c.tierImpact),
    report.challengesAndReality.firstGlance + report.challengesAndReality.unintendedNarrative,
    report.strategicRoadmap.trajectoryOptimization,
  ].reduce((sum, text) => sum + text.length, 0);

  assert(totalChars > 3000, `Total teaching content should be >3000 chars (got ${totalChars})`);
  console.log(`  Total teaching content: ${totalChars} characters`);
  console.log(`  Identity section: ${JSON.stringify(report.academicIdentity).length} chars`);
  console.log(`  Challenges section: ${JSON.stringify(report.challengesAndReality).length} chars`);

  // ===== SUMMARY =====
  console.log('\n=================================================================');
  console.log(`  RESULTS: ${passed}/${totalTests} passed, ${failed} failed`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
