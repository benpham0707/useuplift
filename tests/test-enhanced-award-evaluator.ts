/**
 * Enhanced Award Evaluator Test Suite
 *
 * Comprehensive tests for the research-backed award analysis system.
 * Tests tier classification, authenticity detection, school-specific
 * evaluation, and portfolio pattern analysis.
 *
 * @module test-enhanced-award-evaluator
 */

import { AwardCategory } from '../src/services/portfolioStrategy/types/awards';
import {
  EnhancedAwardInput,
  EnhancedAwardsInput,
} from '../src/services/portfolioStrategy/types/awardsEnhanced';
import { awardKnowledgeBase } from '../src/services/portfolioStrategy/knowledge/awardKnowledgeBase';
import { awardTierEngine } from '../src/services/portfolioStrategy/engines/awardTierEngine';
import { awardAuthenticityEngine } from '../src/services/portfolioStrategy/engines/awardAuthenticityEngine';
import { enhancedAwardEvaluator } from '../src/services/portfolioStrategy/engines/enhancedAwardEvaluator';
import {
  awardAnalysisOrchestrator,
  analyzeAwards,
  lookupAward,
} from '../src/services/portfolioStrategy/orchestrators/awardAnalysisOrchestrator';

// ============================================================================
// TEST DATA
// ============================================================================

const SAMPLE_AWARDS: EnhancedAwardInput[] = [
  {
    id: 'award-1',
    name: 'USAMO Qualifier',
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    dateReceived: '2024-03-15',
    gradeLevel: 11,
    description: 'Qualified for USA Mathematical Olympiad',
    organization: 'Mathematical Association of America',
    selectivityInfo: 'Top 260 nationally',
    isAcademic: true,
    verifiable: true,
  },
  {
    id: 'award-2',
    name: 'National Merit Semifinalist',
    category: 'standardized_test',
    recognitionLevel: 'national',
    dateReceived: '2024-09-01',
    gradeLevel: 12,
    description: 'Top 1% of PSAT scores in state',
    organization: 'National Merit Scholarship Corporation',
    selectivityInfo: 'Top 1% (~16,000 nationally)',
    isAcademic: true,
    verifiable: true,
  },
  {
    id: 'award-3',
    name: 'NSHSS Member',
    category: 'academic_honor',
    recognitionLevel: 'national',
    dateReceived: '2024-01-01',
    gradeLevel: 11,
    description: 'Selected for National Society of High School Scholars',
    organization: 'NSHSS',
    isAcademic: true,
    verifiable: true,
  },
  {
    id: 'award-4',
    name: 'Scholastic Art & Writing Gold Key',
    category: 'arts_competition',
    recognitionLevel: 'regional',
    dateReceived: '2024-02-15',
    gradeLevel: 11,
    description: 'Regional gold key for short story',
    organization: 'Alliance for Young Artists & Writers',
    selectivityInfo: 'Top 7% regionally',
    isAcademic: false,
    verifiable: true,
  },
  {
    id: 'award-5',
    name: 'Eagle Scout',
    category: 'leadership',
    recognitionLevel: 'national',
    dateReceived: '2023-06-01',
    gradeLevel: 10,
    description: 'Highest rank in Boy Scouts of America',
    organization: 'Boy Scouts of America',
    selectivityInfo: '~6% of scouts',
    isAcademic: false,
    verifiable: true,
  },
];

const SAMPLE_STUDENT_CONTEXT: EnhancedAwardsInput['studentContext'] = {
  state: 'CA',
  schoolType: 'public',
  isFirstGen: false,
  isLowIncome: false,
  isRural: false,
  intendedMajor: 'Mathematics',
  spikeArea: 'STEM',
};

const SAMPLE_INPUT: EnhancedAwardsInput = {
  awards: SAMPLE_AWARDS,
  studentContext: SAMPLE_STUDENT_CONTEXT,
  targetSchools: ['mit', 'stanford', 'harvard'],
  relatedActivities: [
    { activityId: 'act-1', activityName: 'Math Club President', category: 'academic' },
    { activityId: 'act-2', activityName: 'Math Team Captain', category: 'competition' },
  ],
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

class TestRunner {
  private passed = 0;
  private failed = 0;
  private startTime = Date.now();

  async test(name: string, fn: () => Promise<void> | void): Promise<void> {
    try {
      await fn();
      this.passed++;
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertInRange(value: number, min: number, max: number, message: string): void {
    if (value < min || value > max) {
      throw new Error(`${message}: ${value} not in range [${min}, ${max}]`);
    }
  }

  printSummary(): void {
    const duration = Date.now() - this.startTime;
    console.log('\n' + '='.repeat(60));
    console.log(`Tests complete: ${this.passed} passed, ${this.failed} failed`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60));
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testKnowledgeBase(runner: TestRunner): Promise<void> {
  console.log('\n📚 Knowledge Base Tests');

  await runner.test('should have awards in database', () => {
    const stats = awardKnowledgeBase.getStatistics();
    runner.assert(stats.totalAwards > 0, 'Database should have awards');
    console.log(`     Loaded ${stats.totalAwards} awards across ${Object.keys(stats.byCategory).length} categories`);
  });

  await runner.test('should look up known award by name', () => {
    const result = awardKnowledgeBase.lookupAward('USAMO Qualifier');
    runner.assert(result !== null, 'Should find USAMO Qualifier');
    runner.assertEqual(result!.tier, 1, 'USAMO should be Tier 1');
  });

  await runner.test('should look up award by alias', () => {
    const result = awardKnowledgeBase.lookupAward('Made USAMO');
    runner.assert(result !== null, 'Should find by alias');
    runner.assertEqual(result!.id, 'usamo_qualifier', 'Should match correct award');
  });

  await runner.test('should return null for unknown award', () => {
    const result = awardKnowledgeBase.lookupAward('Totally Made Up Award 12345');
    runner.assert(result === null, 'Should return null for unknown');
  });

  await runner.test('should get awards by tier', () => {
    const tier1 = awardKnowledgeBase.getAwardsByTier(1);
    runner.assert(tier1.length > 0, 'Should have Tier 1 awards');
    runner.assert(tier1.every((a) => a.tier === 1), 'All should be Tier 1');
  });

  await runner.test('should get awards by category', () => {
    const olympiadAwards = awardKnowledgeBase.getAwardsByCategory('academic_olympiad');
    runner.assert(olympiadAwards.length > 0, 'Should have olympiad awards');
  });

  await runner.test('should search research modules', () => {
    const modules = awardKnowledgeBase.searchModules('olympiad');
    runner.assert(modules.length > 0, 'Should find olympiad-related modules');
  });

  await runner.test('should generate citations', () => {
    const citation = awardKnowledgeBase.generateCitation('2.1', 'Tier Classification');
    runner.assert(citation.sourceId !== '', 'Should have source ID');
    runner.assert(citation.module !== '', 'Should have module');
    runner.assert(citation.section !== '', 'Should have section');
  });
}

async function testTierEngine(runner: TestRunner): Promise<void> {
  console.log('\n🏆 Tier Classification Engine Tests');

  await runner.test('should classify Tier 1 award correctly', () => {
    const award: EnhancedAwardInput = {
      id: 'test-1',
      name: 'USAMO Qualifier',
      category: 'academic_olympiad',
      recognitionLevel: 'national',
      dateReceived: '2024-03-15',
      gradeLevel: 11,
      isAcademic: true,
      verifiable: true,
    };

    const result = awardTierEngine.classifyAward(award, { state: 'CA' });
    runner.assertEqual(result.effectiveTier, 1, 'USAMO should be Tier 1');
  });

  await runner.test('should classify unknown award heuristically', () => {
    const award: EnhancedAwardInput = {
      id: 'test-2',
      name: 'Unknown Regional Award',
      category: 'academic_competition',
      recognitionLevel: 'regional',
      dateReceived: '2024-03-15',
      gradeLevel: 11,
      selectivityInfo: 'Top 10%',
      isAcademic: true,
      verifiable: true,
    };

    const result = awardTierEngine.classifyAward(award, { state: 'CA' });
    runner.assertInRange(result.effectiveTier, 2, 3, 'Regional award should be Tier 2-3');
  });

  await runner.test('should apply geographic modifier for competitive state', () => {
    const award: EnhancedAwardInput = {
      id: 'test-3',
      name: 'State Math Competition',
      category: 'academic_competition',
      recognitionLevel: 'state',
      dateReceived: '2024-03-15',
      gradeLevel: 11,
      isAcademic: true,
      verifiable: true,
    };

    const caResult = awardTierEngine.classifyAward(award, { state: 'CA' });
    const defaultResult = awardTierEngine.classifyAward(award, { state: 'WY' });

    // California should get better tier due to competitive modifier
    runner.assert(
      caResult.adjustedTier <= defaultResult.adjustedTier,
      'CA should have equal or better tier than less competitive state'
    );
  });

  await runner.test('should apply demographic modifiers', () => {
    const award: EnhancedAwardInput = {
      id: 'test-4',
      name: 'Regional Award',
      category: 'leadership',
      recognitionLevel: 'regional',
      dateReceived: '2024-03-15',
      gradeLevel: 11,
      isAcademic: false,
      verifiable: true,
    };

    const standardResult = awardTierEngine.classifyAward(award, {});
    const firstGenResult = awardTierEngine.classifyAward(award, {
      isFirstGen: true,
      isLowIncome: true,
    });

    runner.assert(
      firstGenResult.adjustedTier <= standardResult.adjustedTier,
      'First-gen/low-income should get equal or better adjusted tier'
    );
  });

  await runner.test('should calculate tier summary', () => {
    const classifications = awardTierEngine.classifyAwards(SAMPLE_AWARDS, SAMPLE_STUDENT_CONTEXT);
    const summary = awardTierEngine.calculateTierSummary(classifications);

    runner.assert(summary.totalPoints > 0, 'Should have total points');
    runner.assertEqual(
      summary.tier1Count + summary.tier2Count + summary.tier3Count + summary.tier4Count,
      SAMPLE_AWARDS.length,
      'Sum should equal total awards'
    );
  });
}

async function testAuthenticityEngine(runner: TestRunner): Promise<void> {
  console.log('\n🔍 Authenticity Detection Engine Tests');

  await runner.test('should detect pay-to-play organization', () => {
    const award: EnhancedAwardInput = {
      id: 'test-p2p',
      name: 'NSHSS Member',
      category: 'academic_honor',
      recognitionLevel: 'national',
      dateReceived: '2024-01-01',
      gradeLevel: 11,
      organization: 'National Society of High School Scholars',
      isAcademic: true,
      verifiable: true,
    };

    const result = awardAuthenticityEngine.assessAuthenticity(award, [], []);
    runner.assertEqual(result.payToPlayCheck.likelihood, 'confirmed', 'NSHSS should be confirmed pay-to-play');
    runner.assertEqual(result.riskLevel, 'severe', 'Should have severe risk level');
    runner.assertEqual(result.recommendation, 'exclude', 'Should recommend exclusion');
  });

  await runner.test('should verify legitimate organization', () => {
    const award: EnhancedAwardInput = {
      id: 'test-legit',
      name: 'National Merit Semifinalist',
      category: 'standardized_test',
      recognitionLevel: 'national',
      dateReceived: '2024-09-01',
      gradeLevel: 12,
      organization: 'National Merit Scholarship Corporation',
      isAcademic: true,
      verifiable: true,
    };

    const result = awardAuthenticityEngine.assessAuthenticity(award, [], []);
    runner.assertEqual(result.payToPlayCheck.likelihood, 'unlikely', 'National Merit should be unlikely pay-to-play');
    runner.assertEqual(result.recommendation, 'include', 'Should recommend inclusion');
  });

  await runner.test('should detect timing red flags', () => {
    // Use current year to match the timing detection logic
    const currentYear = new Date().getFullYear();
    const seniorYearBurst: EnhancedAwardInput[] = [
      {
        id: 'burst-1',
        name: 'Award 1',
        category: 'academic_honor',
        recognitionLevel: 'school',
        dateReceived: `${currentYear}-09-01`,
        gradeLevel: 12,
        isAcademic: true,
        verifiable: true,
      },
      {
        id: 'burst-2',
        name: 'Award 2',
        category: 'leadership',
        recognitionLevel: 'school',
        dateReceived: `${currentYear}-09-15`,
        gradeLevel: 12,
        isAcademic: false,
        verifiable: true,
      },
      {
        id: 'burst-3',
        name: 'Award 3',
        category: 'community_service',
        recognitionLevel: 'school',
        dateReceived: `${currentYear}-10-01`,
        gradeLevel: 12,
        isAcademic: false,
        verifiable: true,
      },
      {
        id: 'burst-4',
        name: 'Award 4',
        category: 'academic_honor',
        recognitionLevel: 'school',
        dateReceived: `${currentYear}-10-15`,
        gradeLevel: 12,
        isAcademic: true,
        verifiable: true,
      },
      {
        id: 'burst-5',
        name: 'Award 5',
        category: 'leadership',
        recognitionLevel: 'school',
        dateReceived: `${currentYear}-11-01`,
        gradeLevel: 12,
        isAcademic: false,
        verifiable: true,
      },
    ];

    const result = awardAuthenticityEngine.assessAuthenticity(
      seniorYearBurst[0],
      [],
      seniorYearBurst
    );

    runner.assertEqual(
      result.timingCheck.patterns.seniorYearExplosion,
      true,
      'Should detect senior year explosion'
    );
  });

  await runner.test('should check cross-validation with activities', () => {
    const award: EnhancedAwardInput = {
      id: 'test-cv',
      name: 'Math Competition Award',
      category: 'academic_olympiad',
      recognitionLevel: 'state',
      dateReceived: '2024-03-15',
      gradeLevel: 11,
      isAcademic: true,
      verifiable: true,
    };

    const withActivities = awardAuthenticityEngine.assessAuthenticity(
      award,
      [{ activityId: 'act-1', activityName: 'Math Club', category: 'academic' }],
      [award]
    );

    const withoutActivities = awardAuthenticityEngine.assessAuthenticity(award, [], [award]);

    runner.assert(
      withActivities.crossValidation.activityAlignment.aligned,
      'Should align with math activity'
    );
    runner.assert(
      !withoutActivities.crossValidation.activityAlignment.aligned || withoutActivities.crossValidation.activityAlignment.gaps.length > 0,
      'Should have gaps without activities'
    );
  });
}

async function testEnhancedEvaluator(runner: TestRunner): Promise<void> {
  console.log('\n📊 Enhanced Award Evaluator Tests');

  await runner.test('should perform full evaluation', async () => {
    const result = await enhancedAwardEvaluator.evaluate(SAMPLE_INPUT);

    runner.assert(result.evaluatedAt !== '', 'Should have timestamp');
    runner.assertInRange(result.overallScore, 0, 100, 'Score should be 0-100');
    runner.assert(result.awardAssessments !== undefined, 'Should have assessments');
    runner.assertEqual(
      Object.keys(result.awardAssessments).length,
      SAMPLE_AWARDS.length,
      'Should assess all awards'
    );
  });

  await runner.test('should calculate tier distribution', async () => {
    const result = await enhancedAwardEvaluator.evaluate(SAMPLE_INPUT);

    const { tier1Count, tier2Count, tier3Count, tier4Count } = result.tierDistribution.summary;
    const total = tier1Count + tier2Count + tier3Count + tier4Count;

    runner.assertEqual(total, SAMPLE_AWARDS.length, 'Tier counts should sum to total');
    runner.assert(result.tierDistribution.summary.totalPoints > 0, 'Should have total points');
  });

  await runner.test('should flag NSHSS as problematic', async () => {
    const result = await enhancedAwardEvaluator.evaluate(SAMPLE_INPUT);

    runner.assert(
      result.authenticitySummary.flaggedAwards.includes('award-3'),
      'NSHSS award should be flagged'
    );
    runner.assert(
      result.authenticitySummary.recommendations.some((r) => r.includes('NSHSS')),
      'Should have NSHSS recommendation'
    );
  });

  await runner.test('should generate school-specific evaluations', async () => {
    const result = await enhancedAwardEvaluator.evaluate(SAMPLE_INPUT);

    runner.assert(result.schoolSpecificEvaluation['mit'] !== undefined, 'Should have MIT evaluation');
    runner.assert(result.schoolSpecificEvaluation['stanford'] !== undefined, 'Should have Stanford evaluation');
    runner.assert(result.schoolSpecificEvaluation['harvard'] !== undefined, 'Should have Harvard evaluation');
  });

  await runner.test('should analyze portfolio patterns', async () => {
    const result = await enhancedAwardEvaluator.evaluate(SAMPLE_INPUT);

    runner.assert(result.portfolioPatterns.thematicCoherence.primaryTheme !== '', 'Should have primary theme');
    runner.assert(
      ['none', 'low', 'medium', 'high'].includes(result.portfolioPatterns.paddingRisk),
      'Should have valid padding risk'
    );
  });

  await runner.test('should generate Common App recommendations', async () => {
    const result = await enhancedAwardEvaluator.evaluate(SAMPLE_INPUT);

    runner.assert(result.recommendations.commonAppStrategy.top5.length > 0, 'Should have top 5 recommendations');
    runner.assert(
      result.recommendations.commonAppStrategy.ordering !== '',
      'Should have ordering advice'
    );
  });
}

async function testOrchestrator(runner: TestRunner): Promise<void> {
  console.log('\n🎯 Award Analysis Orchestrator Tests');

  await runner.test('should run full analysis with phase tracking', async () => {
    let progressUpdates = 0;
    const result = await awardAnalysisOrchestrator.analyze(SAMPLE_INPUT, (phase, progress, message) => {
      progressUpdates++;
    });

    runner.assert(result.evaluation !== undefined, 'Should have evaluation');
    runner.assert(result.phases.length > 0, 'Should have phase info');
    runner.assert(result.totalDurationMs > 0, 'Should have duration');
    runner.assert(progressUpdates > 0, 'Should have received progress updates');

    console.log(`     Analyzed ${result.awardsAnalyzed} awards in ${result.totalDurationMs}ms`);
    console.log(`     Phases: ${result.phases.map((p) => p.phase).join(' → ')}`);
  });

  await runner.test('should perform quick tier analysis', async () => {
    const result = await awardAnalysisOrchestrator.quickTierAnalysis(
      SAMPLE_AWARDS,
      SAMPLE_STUDENT_CONTEXT
    );

    runner.assert(result.classifications.size === SAMPLE_AWARDS.length, 'Should classify all awards');
    runner.assert(result.summary.totalPoints > 0, 'Should have tier summary');
  });

  await runner.test('should perform quick authenticity check', async () => {
    const result = await awardAnalysisOrchestrator.quickAuthenticityCheck(SAMPLE_AWARDS);

    runner.assert(result.assessments.size === SAMPLE_AWARDS.length, 'Should assess all awards');
    runner.assert(result.flaggedAwards.length >= 1, 'Should flag at least NSHSS');
  });

  await runner.test('should look up single award', () => {
    const result = lookupAward('USAMO Qualifier');

    runner.assert(result.found, 'Should find USAMO');
    runner.assertEqual(result.tier, 1, 'Should be Tier 1');
    runner.assert(result.profile !== null, 'Should have profile');
  });

  await runner.test('should get knowledge base stats', () => {
    const stats = awardAnalysisOrchestrator.getKnowledgeBaseStats();

    runner.assert(stats.totalAwards > 0, 'Should have awards');
    runner.assert(stats.modulesAvailable > 0, 'Should have modules');
  });
}

async function testEdgeCases(runner: TestRunner): Promise<void> {
  console.log('\n⚠️ Edge Case Tests');

  await runner.test('should handle empty awards array gracefully', async () => {
    try {
      await awardAnalysisOrchestrator.analyze({
        awards: [],
        studentContext: SAMPLE_STUDENT_CONTEXT,
      });
      runner.assert(false, 'Should throw error for empty awards');
    } catch (error) {
      runner.assert(error instanceof Error, 'Should throw error');
    }
  });

  await runner.test('should handle award with minimal data', async () => {
    const minimalAward: EnhancedAwardInput = {
      id: 'minimal',
      name: 'Some Award',
      category: 'other',
      recognitionLevel: 'school',
      dateReceived: '2024-01-01',
      gradeLevel: 11,
      isAcademic: false,
      verifiable: false,
    };

    const result = awardTierEngine.classifyAward(minimalAward, {});
    runner.assertInRange(result.effectiveTier, 1, 4, 'Should have valid tier');
  });

  await runner.test('should handle all Tier 4 awards (padding scenario)', async () => {
    // Use 'other' category to ensure awards stay at Tier 4 (school-level)
    // Note: 'academic_honor' has a category adjustment that can change tier
    const paddingAwards: EnhancedAwardInput[] = Array(8)
      .fill(null)
      .map((_, i) => ({
        id: `pad-${i}`,
        name: `Local Club Award ${i}`,
        category: 'other' as AwardCategory,
        recognitionLevel: 'school' as const,
        dateReceived: '2024-01-01',
        gradeLevel: 12,
        isAcademic: false,
        verifiable: true,
      }));

    const result = await enhancedAwardEvaluator.evaluate({
      awards: paddingAwards,
      studentContext: SAMPLE_STUDENT_CONTEXT,
    });

    runner.assertEqual(result.portfolioPatterns.paddingRisk, 'high', 'Should detect high padding risk');
  });

  await runner.test('should handle fuzzy award name matching', () => {
    const variations = [
      'IMO Gold Medal',
      'International Mathematical Olympiad Gold',
      'Gold Medal IMO',
    ];

    for (const name of variations) {
      const result = awardKnowledgeBase.lookupAward(name);
      runner.assert(result !== null, `Should find: ${name}`);
    }
  });
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Enhanced Award Evaluator Test Suite');
  console.log('='.repeat(60));

  const runner = new TestRunner();

  await testKnowledgeBase(runner);
  await testTierEngine(runner);
  await testAuthenticityEngine(runner);
  await testEnhancedEvaluator(runner);
  await testOrchestrator(runner);
  await testEdgeCases(runner);

  runner.printSummary();
}

// Run tests
runAllTests().catch(console.error);
