/**
 * Academic Analysis Pipeline E2E Tests
 *
 * Tests the multi-stage academic analysis pipeline with:
 * - Heuristic-only mode (no LLM cost)
 * - Full pipeline with LLM stages
 * - Various student profiles
 *
 * Usage:
 *   ANTHROPIC_API_KEY="..." npx tsx tests/test-academic-pipeline-e2e.ts
 *
 * @version 1.0
 * @date January 2026
 */

import {
  AcademicAnalysisPipeline,
  analyzeAcademicHistoryFull,
  analyzeTrajectory,
  detectAcademicRedFlags,
  analyzeCommitment,
  analyzeMajorAlignment,
  type AcademicHistoryInput,
  type FullAcademicAnalysis,
} from '../src/services/portfolioStrategy/services';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  cost?: number;
  details?: string;
  error?: string;
}

class CostTracker {
  private costs: { model: string; inputTokens: number; outputTokens: number }[] = [];

  addCost(model: string, inputTokens: number, outputTokens: number): void {
    this.costs.push({ model, inputTokens, outputTokens });
  }

  getTotalCost(): number {
    return this.costs.reduce((total, c) => {
      // Pricing per 1K tokens
      const inputRate = c.model.includes('haiku') ? 0.001 : 0.003;
      const outputRate = c.model.includes('haiku') ? 0.005 : 0.015;
      return total + (c.inputTokens / 1000 * inputRate) + (c.outputTokens / 1000 * outputRate);
    }, 0);
  }

  reset(): void {
    this.costs = [];
  }
}

function log(message: string, indent = 0): void {
  console.log(' '.repeat(indent * 2) + message);
}

function logSection(title: string): void {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

// ============================================================================
// TEST PROFILES
// ============================================================================

const PROFILE_ELITE_STUDENT: AcademicHistoryInput = {
  gpa: {
    unweighted: 3.95,
    weighted: 4.45,
    scale: 4.0,
  },
  courses: [
    // Freshman
    { name: 'Honors English 9', subject: 'english', level: 'honors', grade: 'A', year: 9 },
    { name: 'Honors Biology', subject: 'science', level: 'honors', grade: 'A', year: 9 },
    { name: 'Algebra 2', subject: 'math', level: 'accelerated', grade: 'A', year: 9 },
    { name: 'World History', subject: 'social_studies', level: 'honors', grade: 'A-', year: 9 },
    { name: 'Spanish 2', subject: 'foreign_language', level: 'honors', grade: 'A', year: 9 },
    // Sophomore
    { name: 'Honors English 10', subject: 'english', level: 'honors', grade: 'A', year: 10 },
    { name: 'Honors Chemistry', subject: 'science', level: 'honors', grade: 'A', year: 10 },
    { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 10 },
    { name: 'AP World History', subject: 'social_studies', level: 'ap', grade: 'A', year: 10 },
    { name: 'Spanish 3', subject: 'foreign_language', level: 'honors', grade: 'A', year: 10 },
    // Junior
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Physics 1', subject: 'science', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Calculus BC', subject: 'math', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Spanish', subject: 'foreign_language', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Computer Science A', subject: 'other', level: 'ap', grade: 'A', year: 11 },
    // Senior
    { name: 'AP English Literature', subject: 'english', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Physics C', subject: 'science', level: 'ap', grade: 'A', year: 12 },
    { name: 'Multivariable Calculus', subject: 'math', level: 'dual_enrollment', grade: 'A', year: 12, de_type: 'research_university' },
    { name: 'AP Government', subject: 'social_studies', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Research', subject: 'other', level: 'ap', grade: 'A', year: 12 },
  ],
  test_scores: {
    sat: { total: 1560, math: 800, ebrw: 760 },
    ap_exams: [
      { subject: 'World History', score: 5, year: 2023 },
      { subject: 'English Language', score: 5, year: 2024 },
      { subject: 'Physics 1', score: 5, year: 2024 },
      { subject: 'Calculus BC', score: 5, year: 2024 },
      { subject: 'US History', score: 5, year: 2024 },
      { subject: 'Spanish', score: 5, year: 2024 },
      { subject: 'Computer Science A', score: 5, year: 2024 },
    ],
  },
  school_context: {
    type: 'public',
    name: 'Competitive Public High School',
    tier: 'tier3_well_resourced',
    ap_courses_offered: 22,
    curriculum: 'us',
    state: 'California',
    country: 'USA',
  },
  grade_history: {
    freshman: { gpa: 3.85, courses: 6 },
    sophomore: { gpa: 3.92, courses: 6 },
    junior: { gpa: 3.98, courses: 7 },
    senior: { gpa: 4.0, courses: 6 },
  },
  intended_major: 'Computer Science',
};

const PROFILE_GPA_PROTECTOR: AcademicHistoryInput = {
  gpa: {
    unweighted: 3.98,
    weighted: 4.1,
    scale: 4.0,
  },
  courses: [
    // Freshman - started strong
    { name: 'Honors English 9', subject: 'english', level: 'honors', grade: 'A', year: 9 },
    { name: 'Honors Biology', subject: 'science', level: 'honors', grade: 'A', year: 9 },
    { name: 'Algebra 2', subject: 'math', level: 'accelerated', grade: 'A', year: 9 },
    { name: 'World History', subject: 'social_studies', level: 'honors', grade: 'A', year: 9 },
    { name: 'Spanish 2', subject: 'foreign_language', level: 'honors', grade: 'A', year: 9 },
    // Sophomore - maintained but dropped rigor
    { name: 'English 10', subject: 'english', level: 'regular', grade: 'A', year: 10 },
    { name: 'Chemistry', subject: 'science', level: 'regular', grade: 'A', year: 10 },
    { name: 'Pre-Calculus', subject: 'math', level: 'regular', grade: 'A', year: 10 },
    { name: 'US History', subject: 'social_studies', level: 'regular', grade: 'A', year: 10 },
    { name: 'Spanish 3', subject: 'foreign_language', level: 'regular', grade: 'A', year: 10 },
    // Junior - even less rigor
    { name: 'English 11', subject: 'english', level: 'regular', grade: 'A', year: 11 },
    { name: 'Environmental Science', subject: 'science', level: 'regular', grade: 'A', year: 11 },
    { name: 'Statistics', subject: 'math', level: 'regular', grade: 'A', year: 11 },
    { name: 'Government', subject: 'social_studies', level: 'regular', grade: 'A', year: 11 },
    // Senior - minimum rigor
    { name: 'English 12', subject: 'english', level: 'regular', grade: 'A', year: 12 },
    { name: 'Psychology', subject: 'social_studies', level: 'regular', grade: 'A', year: 12 },
  ],
  school_context: {
    type: 'public',
    tier: 'tier3_well_resourced',
    ap_courses_offered: 18,
    curriculum: 'us',
    state: 'Texas',
  },
  grade_history: {
    freshman: { gpa: 3.95, courses: 5 },
    sophomore: { gpa: 3.98, courses: 5 },
    junior: { gpa: 4.0, courses: 4 },
    senior: { gpa: 4.0, courses: 3 },
  },
  intended_major: 'Engineering',
};

const PROFILE_ASCENDING_TRAJECTORY: AcademicHistoryInput = {
  gpa: {
    unweighted: 3.75,
    weighted: 4.1,
    scale: 4.0,
  },
  courses: [
    // Freshman - rough start
    { name: 'English 9', subject: 'english', level: 'regular', grade: 'B', year: 9 },
    { name: 'Biology', subject: 'science', level: 'regular', grade: 'B+', year: 9 },
    { name: 'Algebra 1', subject: 'math', level: 'regular', grade: 'B', year: 9 },
    { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'B+', year: 9 },
    { name: 'Spanish 1', subject: 'foreign_language', level: 'regular', grade: 'B', year: 9 },
    // Sophomore - improving
    { name: 'Honors English 10', subject: 'english', level: 'honors', grade: 'B+', year: 10 },
    { name: 'Honors Chemistry', subject: 'science', level: 'honors', grade: 'A-', year: 10 },
    { name: 'Geometry', subject: 'math', level: 'regular', grade: 'A-', year: 10 },
    { name: 'Honors US History', subject: 'social_studies', level: 'honors', grade: 'A-', year: 10 },
    { name: 'Spanish 2', subject: 'foreign_language', level: 'regular', grade: 'A-', year: 10 },
    // Junior - strong
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Chemistry', subject: 'science', level: 'ap', grade: 'A-', year: 11 },
    { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 11 },
    { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A', year: 11 },
    { name: 'Spanish 3', subject: 'foreign_language', level: 'honors', grade: 'A', year: 11 },
    // Senior - excellent
    { name: 'AP English Literature', subject: 'english', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Physics 1', subject: 'science', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Calculus AB', subject: 'math', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Government', subject: 'social_studies', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Spanish', subject: 'foreign_language', level: 'ap', grade: 'A', year: 12 },
  ],
  school_context: {
    type: 'public',
    tier: 'tier4_average_public',
    ap_courses_offered: 8,
    curriculum: 'us',
  },
  grade_history: {
    freshman: { gpa: 3.0, courses: 5 },
    sophomore: { gpa: 3.5, courses: 5 },
    junior: { gpa: 3.85, courses: 5 },
    senior: { gpa: 4.0, courses: 5 },
  },
  intended_major: 'Chemistry',
};

const PROFILE_SENIOR_DECLINE: AcademicHistoryInput = {
  gpa: {
    unweighted: 3.65,
    weighted: 4.0,
    scale: 4.0,
  },
  courses: [
    // Freshman - solid
    { name: 'Honors English 9', subject: 'english', level: 'honors', grade: 'A', year: 9 },
    { name: 'Honors Biology', subject: 'science', level: 'honors', grade: 'A-', year: 9 },
    { name: 'Geometry', subject: 'math', level: 'honors', grade: 'A', year: 9 },
    { name: 'World History', subject: 'social_studies', level: 'honors', grade: 'A', year: 9 },
    // Sophomore - strong
    { name: 'Honors English 10', subject: 'english', level: 'honors', grade: 'A', year: 10 },
    { name: 'AP Biology', subject: 'science', level: 'ap', grade: 'A', year: 10 },
    { name: 'Algebra 2', subject: 'math', level: 'honors', grade: 'A', year: 10 },
    { name: 'AP World History', subject: 'social_studies', level: 'ap', grade: 'A', year: 10 },
    // Junior - peak
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP Chemistry', subject: 'science', level: 'ap', grade: 'A-', year: 11 },
    { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 11 },
    { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A', year: 11 },
    // Senior - significant decline (senioritis)
    { name: 'AP English Literature', subject: 'english', level: 'ap', grade: 'C+', year: 12 },
    { name: 'AP Physics 1', subject: 'science', level: 'ap', grade: 'C', year: 12 },
    { name: 'Calculus AB', subject: 'math', level: 'ap', grade: 'C+', year: 12 },
    { name: 'AP Government', subject: 'social_studies', level: 'ap', grade: 'B-', year: 12 },
  ],
  school_context: {
    type: 'public',
    tier: 'tier3_well_resourced',
    ap_courses_offered: 15,
    curriculum: 'us',
  },
  grade_history: {
    freshman: { gpa: 3.9, courses: 4 },
    sophomore: { gpa: 3.95, courses: 4 },
    junior: { gpa: 3.92, courses: 4 },
    senior: { gpa: 2.5, courses: 4 }, // Significant drop!
  },
  intended_major: 'Biology',
};

const PROFILE_MAJOR_MISMATCH: AcademicHistoryInput = {
  gpa: {
    unweighted: 3.85,
    weighted: 4.2,
    scale: 4.0,
  },
  courses: [
    // Freshman
    { name: 'Honors English 9', subject: 'english', level: 'honors', grade: 'A', year: 9 },
    { name: 'Biology', subject: 'science', level: 'regular', grade: 'A', year: 9 },
    { name: 'Algebra 1', subject: 'math', level: 'regular', grade: 'A', year: 9 },
    { name: 'World History', subject: 'social_studies', level: 'honors', grade: 'A', year: 9 },
    // Sophomore
    { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'A', year: 10 },
    { name: 'Earth Science', subject: 'science', level: 'regular', grade: 'A', year: 10 },
    { name: 'Geometry', subject: 'math', level: 'regular', grade: 'A', year: 10 },
    { name: 'AP World History', subject: 'social_studies', level: 'ap', grade: 'A', year: 10 },
    // Junior - heavy humanities, no STEM
    { name: 'AP English Literature', subject: 'english', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A', year: 11 },
    { name: 'AP European History', subject: 'social_studies', level: 'ap', grade: 'A', year: 11 },
    { name: 'Algebra 2', subject: 'math', level: 'regular', grade: 'A', year: 11 },
    // Senior - still humanities focused
    { name: 'AP Government', subject: 'social_studies', level: 'ap', grade: 'A', year: 12 },
    { name: 'AP Art History', subject: 'arts', level: 'ap', grade: 'A', year: 12 },
    { name: 'Creative Writing', subject: 'english', level: 'honors', grade: 'A', year: 12 },
  ],
  school_context: {
    type: 'public',
    tier: 'tier3_well_resourced',
    ap_courses_offered: 18,
    curriculum: 'us',
  },
  grade_history: {
    freshman: { gpa: 3.9, courses: 4 },
    sophomore: { gpa: 3.85, courses: 4 },
    junior: { gpa: 3.88, courses: 4 },
    senior: { gpa: 3.9, courses: 3 },
  },
  intended_major: 'Computer Science', // But no CS, physics, or calc!
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testHeuristicAnalyzers(): Promise<TestResult[]> {
  logSection('STAGE 1: HEURISTIC ANALYZERS (No LLM)');
  const results: TestResult[] = [];

  // Test 1: Trajectory Analyzer
  {
    const startTime = Date.now();
    const name = 'TrajectoryAnalyzer - Elite Student';
    try {
      const trajectory = analyzeTrajectory(PROFILE_ELITE_STUDENT);

      const checks = [
        trajectory.gpa.trajectory_type === 'strong_ascending' || trajectory.gpa.trajectory_type === 'moderate_ascending',
        trajectory.gpa.weighted_gpa >= 3.9,
        trajectory.rigor.trajectory_type === 'increasing' || trajectory.rigor.trajectory_type === 'maintaining_high',
        trajectory.gpa_rigor_interaction === 'ideal' || trajectory.gpa_rigor_interaction === 'good_growth',
      ];
      const passed = checks.every(c => c);

      log(`  Trajectory: ${trajectory.gpa.trajectory_type}`);
      log(`  GPA-Rigor: ${trajectory.gpa_rigor_interaction}`);
      log(`  Effective GPA: ${trajectory.gpa.effective_gpa}`);

      results.push({
        name,
        passed,
        duration: Date.now() - startTime,
        details: passed ? 'All checks passed' : 'Some checks failed',
      });
    } catch (error) {
      results.push({
        name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Test 2: Red Flag Detector - GPA Protector
  {
    const startTime = Date.now();
    const name = 'RedFlagDetector - GPA Protector';
    try {
      const redFlags = detectAcademicRedFlags(PROFILE_GPA_PROTECTOR);

      const hasRigorAvoidance = redFlags.flags_detected.some(f =>
        f.flag_name.toLowerCase().includes('rigor') ||
        f.flag_name.toLowerCase().includes('protection')
      );
      const hasMajorMismatch = redFlags.flags_detected.some(f =>
        f.flag_name.toLowerCase().includes('mismatch') ||
        f.flag_name.toLowerCase().includes('major')
      );

      const passed = hasRigorAvoidance || hasMajorMismatch;

      log(`  Flags: ${redFlags.flags_detected.map(f => f.flag_name).join(', ') || 'None'}`);
      log(`  Risk Level: ${redFlags.overall_risk_level}`);

      results.push({
        name,
        passed,
        duration: Date.now() - startTime,
        details: passed ? 'Detected rigor/protection issue' : 'Failed to detect issue',
      });
    } catch (error) {
      results.push({
        name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Test 3: Commitment Analyzer
  {
    const startTime = Date.now();
    const name = 'CommitmentAnalyzer - Elite Student';
    try {
      const commitment = analyzeCommitment(PROFILE_ELITE_STUDENT);

      const hasLanguageCommitment = commitment.sustainedSequences.some(s =>
        s.subjectArea === 'foreign_language' && s.years.length >= 4
      );
      const hasPositiveSignals = commitment.signals.positive.length >= 3;
      const passed = commitment.overallCommitmentScore >= 70;

      log(`  Sustained sequences: ${commitment.sustainedSequences.length}`);
      log(`  Positive signals: ${commitment.signals.positive.length}`);
      log(`  Overall score: ${commitment.overallCommitmentScore}`);

      results.push({
        name,
        passed,
        duration: Date.now() - startTime,
        details: passed ? 'Strong commitment detected' : 'Commitment score too low',
      });
    } catch (error) {
      results.push({
        name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Test 4: Major Alignment - Mismatch
  {
    const startTime = Date.now();
    const name = 'MajorAlignmentAnalyzer - Major Mismatch';
    try {
      const alignment = analyzeMajorAlignment(PROFILE_MAJOR_MISMATCH);

      const hasGaps = alignment.gapAreas.length > 0;
      const hasRedFlags = alignment.redFlagsTriggered.length > 0;
      const alignmentIsLow = alignment.alignmentScore < 60;
      const passed = hasGaps || hasRedFlags || alignmentIsLow;

      log(`  Alignment score: ${alignment.alignmentScore}`);
      log(`  Gaps: ${alignment.gapAreas.join(', ') || 'None'}`);
      log(`  Red flags: ${alignment.redFlagsTriggered.map(f => f.flag).join(', ') || 'None'}`);

      results.push({
        name,
        passed,
        duration: Date.now() - startTime,
        details: passed ? 'Mismatch correctly detected' : 'Failed to detect mismatch',
      });
    } catch (error) {
      results.push({
        name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

async function testHeuristicOnlyPipeline(): Promise<TestResult[]> {
  logSection('PIPELINE: HEURISTICS ONLY (skipLLM: true)');
  const results: TestResult[] = [];

  const profiles = [
    { name: 'Elite Student', profile: PROFILE_ELITE_STUDENT, expectedScore: [1, 2.5] },
    { name: 'GPA Protector', profile: PROFILE_GPA_PROTECTOR, expectedScore: [3, 4.5] },
    { name: 'Ascending Trajectory', profile: PROFILE_ASCENDING_TRAJECTORY, expectedScore: [1.5, 3.5] }, // Strong ascending trajectory gets boost
    { name: 'Senior Decline', profile: PROFILE_SENIOR_DECLINE, expectedScore: [4, 6] },
    { name: 'Major Mismatch', profile: PROFILE_MAJOR_MISMATCH, expectedScore: [2.5, 4] },
  ];

  for (const { name, profile, expectedScore } of profiles) {
    const startTime = Date.now();
    const testName = `Pipeline (Heuristics) - ${name}`;

    try {
      const result = await analyzeAcademicHistoryFull(profile, { skipLLM: true });

      const scoreInRange = result.harvardScore >= expectedScore[0] && result.harvardScore <= expectedScore[1];
      const hasHeuristics = result.heuristics !== undefined;
      const hasConfidence = result.confidence !== undefined;
      const noLLMRun = !result.pipeline.llmStagesRun;

      const passed = scoreInRange && hasHeuristics && hasConfidence && noLLMRun;

      log(`  Harvard Score: ${result.harvardScore} (expected: ${expectedScore[0]}-${expectedScore[1]})`);
      log(`  Confidence: ${result.confidence.overall.level} (${result.confidence.overall.score}%)`);
      log(`  Teaching: ${result.teachingSummary.keyStrength.substring(0, 50)}...`);

      results.push({
        name: testName,
        passed,
        duration: Date.now() - startTime,
        details: passed
          ? `Score ${result.harvardScore} in expected range`
          : `Score ${result.harvardScore} outside expected range ${expectedScore[0]}-${expectedScore[1]}`,
      });
    } catch (error) {
      results.push({
        name: testName,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

async function testFullPipeline(): Promise<TestResult[]> {
  logSection('PIPELINE: FULL LLM STAGES');
  const results: TestResult[] = [];
  const costTracker = new CostTracker();

  // Only test one profile to save costs
  const profile = PROFILE_ASCENDING_TRAJECTORY;
  const testName = 'Full Pipeline - Ascending Trajectory';
  const startTime = Date.now();

  try {
    log('  Running full pipeline with LLM stages...');
    const result = await analyzeAcademicHistoryFull(profile, {
      costTracker,
      debug: true,
    });

    const hasContext = result.context !== undefined;
    const hasDeepAnalysis = result.deepAnalysis !== undefined;
    const hasSynthesis = result.synthesis !== undefined;
    const llmRan = result.pipeline.llmStagesRun;
    const hasTeaching = result.teachingSummary.whatAdmissionsSees.length > 0;

    const passed = hasContext && hasDeepAnalysis && hasSynthesis && llmRan && hasTeaching;

    log(`  Stages completed: ${result.pipeline.stagesCompleted.join(' → ')}`);
    log(`  Harvard Score: ${result.harvardScore}`);
    log(`  Confidence: ${result.confidence.overall.level}`);
    log(`  Context tier: ${result.context?.school_tier || 'N/A'}`);
    if (result.synthesis) {
      log(`  LLM Teaching: "${result.synthesis.teaching_summary.what_admissions_sees.substring(0, 60)}..."`);
    }
    log(`  Total Cost: $${costTracker.getTotalCost().toFixed(4)}`);

    results.push({
      name: testName,
      passed,
      duration: Date.now() - startTime,
      cost: costTracker.getTotalCost(),
      details: passed
        ? `All stages completed, score ${result.harvardScore}`
        : `Missing stages: ${!hasContext ? 'context ' : ''}${!hasDeepAnalysis ? 'deepAnalysis ' : ''}${!hasSynthesis ? 'synthesis' : ''}`,
    });
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      duration: Date.now() - startTime,
      cost: costTracker.getTotalCost(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log('  ACADEMIC ANALYSIS PIPELINE E2E TESTS');
  console.log('█'.repeat(70));

  const allResults: TestResult[] = [];
  let totalCost = 0;

  // Run heuristic tests (no API key needed)
  const heuristicResults = await testHeuristicAnalyzers();
  allResults.push(...heuristicResults);

  // Run heuristic-only pipeline tests
  const heuristicPipelineResults = await testHeuristicOnlyPipeline();
  allResults.push(...heuristicPipelineResults);

  // Run full pipeline test (needs API key)
  if (process.env.ANTHROPIC_API_KEY) {
    const fullPipelineResults = await testFullPipeline();
    allResults.push(...fullPipelineResults);
    totalCost = fullPipelineResults.reduce((sum, r) => sum + (r.cost || 0), 0);
  } else {
    log('\n⚠️  ANTHROPIC_API_KEY not set - skipping LLM pipeline tests');
  }

  // Summary
  logSection('TEST SUMMARY');
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const passRate = ((passed / allResults.length) * 100).toFixed(1);

  for (const result of allResults) {
    const status = result.passed ? '✅' : '❌';
    const costStr = result.cost ? ` ($${result.cost.toFixed(4)})` : '';
    log(`${status} ${result.name} (${result.duration}ms)${costStr}`);
    if (!result.passed && result.error) {
      log(`   Error: ${result.error}`, 1);
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`RESULTS: ${passed}/${allResults.length} passed (${passRate}%)`);
  if (totalCost > 0) {
    console.log(`TOTAL COST: $${totalCost.toFixed(4)}`);
  }
  console.log('-'.repeat(70));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
