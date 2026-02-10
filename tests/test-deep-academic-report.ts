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
  console.log('  (This makes 5 LLM calls — may take 15-30 seconds...)');

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
  assert(id.harvardScaleRating.rating >= 1 && id.harvardScaleRating.rating <= 6, `Harvard scale rating should be 1-6 (got ${id.harvardScaleRating.rating})`);
  assert(id.harvardScaleRating.explanation.length > 50, `Harvard explanation should be detailed (got ${id.harvardScaleRating.explanation.length} chars)`);
  assert(id.aoFirstImpression.length > 50, `AO first impression should be detailed (got ${id.aoFirstImpression.length} chars)`);
  assert(id.trajectoryMeaning.length > 50, `Trajectory meaning should be detailed (got ${id.trajectoryMeaning.length} chars)`);
  assert(id.definingPattern.length > 30, `Defining pattern should be specific (got ${id.definingPattern.length} chars)`);
  console.log(`  Narrative: ${id.narrativeIdentity.length} chars`);
  console.log(`  Harvard scale: ${id.harvardScaleRating.rating} — ${id.harvardScaleRating.label}`);
  console.log(`  Source: ${report.metadata.sectionSources.academicIdentity}`);

  // ===== Section 2: Strength Deep Dives =====
  section('Section 2: Strength Deep Dives');
  const strengths = report.strengthDeepDives;
  assert(strengths.length >= 2, `Should have at least 2 strength dives (got ${strengths.length})`);

  for (const s of strengths) {
    assert(s.title.length > 0, `Strength title should not be empty`);
    assert(s.hook.length > 30, `Hook should be attention-grabbing (got ${s.hook.length} chars)`);
    assert(s.whyItMatters.forAdmissionsOfficers.length > 50, `AO perspective should be detailed`);
    assert(s.whyItMatters.forYourMajor.length > 30, `Major perspective should exist`);
    assert(s.whyItMatters.forYourNarrative.length > 30, `Narrative perspective should exist`);
    assert(s.blindSpotInsight.length > 50, `Blind spot should be substantial (got ${s.blindSpotInsight.length} chars)`);
    assert(s.actionableGuidance.leverageStrategy.length > 30, `Leverage strategy should be specific`);
    assert(s.actionableGuidance.courseRecommendation.length > 20, `Course recommendation should exist`);
    console.log(`  "${s.title}": hook ${s.hook.length}c, blind spot ${s.blindSpotInsight.length}c, ${s.researchBacking.length} citations`);
  }
  console.log(`  Source: ${report.metadata.sectionSources.strengthDeepDives}`);

  // ===== Section 3: Challenge Deep Dives =====
  section('Section 3: Challenge Deep Dives');
  const challenges = report.challengeDeepDives;
  assert(challenges.length >= 1, `Should have at least 1 challenge dive (got ${challenges.length})`);

  for (const c of challenges) {
    assert(c.title.length > 0, `Challenge title should not be empty`);
    assert(c.hook.length > 20, `Hook should reframe (got ${c.hook.length} chars)`);
    assert(c.whyItMatters.whatAOsSee.length > 30, `AO view should be specific`);
    assert(c.whyItMatters.whatItActuallyMeans.length > 30, `Reality should be specific`);
    assert(c.teaching.rootCauseDiagnosis.length > 30, `Root cause should be diagnostic`);
    assert(c.teaching.stepByStepFix.length >= 1, `Should have at least 1 fix step`);
    assert(c.teaching.timeframe.length > 10, `Timeframe should be specified`);
    assert(c.teaching.beforeAfterExample.length > 30, `Before/after should be concrete`);
    console.log(`  "${c.title}": ${c.teaching.stepByStepFix.length} fix steps, ${c.researchBacking.length} citations`);
  }
  console.log(`  Source: ${report.metadata.sectionSources.challengeDeepDives}`);

  // ===== Section 4: Admissions Officer Lens =====
  section('Section 4: Admissions Officer Lens');
  const ao = report.admissionsOfficerLens;
  assert(ao.firstGlance.length > 100, `First glance should be candid and detailed (got ${ao.firstGlance.length} chars)`);
  assert(ao.blindSpots.length >= 2, `Should have at least 2 blind spots (got ${ao.blindSpots.length})`);
  assert(ao.unintendedNarrative.length > 50, `Unintended narrative should be specific (got ${ao.unintendedNarrative.length} chars)`);
  assert(ao.narrativeControlStrategy.length > 50, `Control strategy should be actionable (got ${ao.narrativeControlStrategy.length} chars)`);

  for (const bs of ao.blindSpots) {
    assert(bs.studentPerception.length > 20, `Student perception should be specific`);
    assert(bs.aoReality.length > 20, `AO reality should be specific`);
    assert(bs.howToFix.length > 20, `Fix should be actionable`);
  }
  console.log(`  First glance: ${ao.firstGlance.length} chars`);
  console.log(`  Blind spots: ${ao.blindSpots.length}`);
  console.log(`  Source: ${report.metadata.sectionSources.admissionsOfficerLens}`);

  // ===== Section 5: Strategic Roadmap =====
  section('Section 5: Strategic Roadmap');
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

  // ===== Section 6: Research Context =====
  section('Section 6: Research Context (Template)');
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
    ...report.strengthDeepDives.map(s => s.hook + s.blindSpotInsight + s.whyItMatters.forAdmissionsOfficers),
    ...report.challengeDeepDives.map(c => c.hook + c.teaching.rootCauseDiagnosis + c.whyItMatters.whatAOsSee),
    report.admissionsOfficerLens.firstGlance + report.admissionsOfficerLens.unintendedNarrative,
    report.strategicRoadmap.trajectoryOptimization,
  ].reduce((sum, text) => sum + text.length, 0);

  assert(totalChars > 5000, `Total teaching content should be >5000 chars (got ${totalChars})`);
  console.log(`  Total teaching content: ${totalChars} characters`);
  console.log(`  Average per strength dive: ${Math.round(report.strengthDeepDives.reduce((s, d) => s + JSON.stringify(d).length, 0) / Math.max(1, report.strengthDeepDives.length))} chars`);
  console.log(`  Average per challenge dive: ${Math.round(report.challengeDeepDives.reduce((s, d) => s + JSON.stringify(d).length, 0) / Math.max(1, report.challengeDeepDives.length))} chars`);

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
