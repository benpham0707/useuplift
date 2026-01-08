/**
 * Industry Insights Integration Test
 *
 * Tests that the counseling industry research is properly integrated
 * and accessible through the feedback system.
 */

import {
  INDUSTRY_STATISTICS,
  ENGAGEMENT_LEVELS,
  ESSAY_PHASE_ALLOCATION,
  getAllIndustryStatistics,
  getStatisticsByCategory,
  getEssayFocusedStatistics,
  getEngagementLevels,
  getEssayPhaseAllocation,
  getRandomWhyMattersInsight,
  getHelpfulnessThresholdContext,
  getEssayEditingImportance,
  getSatisfactionComparison,
  getOutcomeMultiplierContext,
  getDeepFeedbackJustification,
  getQuickStats,
} from '../src/services/commonAppWorkshop/data/counselingIndustryInsights';

import {
  getIndustryContextForFeedback,
  enhanceWhyMattersWithContext,
} from '../src/services/commonAppWorkshop/services/researchBackedTeachingService';

// ============================================================================
// TEST SETUP
// ============================================================================

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(message);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

// ============================================================================
// TEST 1: DATA INTEGRITY
// ============================================================================

function testDataIntegrity() {
  logSection('TEST 1: DATA INTEGRITY');

  // Test statistics count
  const stats = getAllIndustryStatistics();
  log(`\nTotal statistics: ${stats.length}`);
  results.push({
    test: 'Statistics count',
    passed: stats.length >= 8,
    details: `${stats.length} statistics (need 8+)`,
  });

  // Test engagement levels
  const levels = getEngagementLevels();
  log(`Engagement levels: ${levels.length}`);
  results.push({
    test: 'Engagement levels',
    passed: levels.length === 3,
    details: `${levels.length} levels (transactional, essay_support, comprehensive)`,
  });

  // Test essay phases
  const phases = getEssayPhaseAllocation();
  log(`Essay phases: ${phases.length}`);
  results.push({
    test: 'Essay phase allocation',
    passed: phases.length >= 4,
    details: `${phases.length} phases defined`,
  });

  // Test category coverage
  const categories = ['satisfaction', 'time_investment', 'outcomes', 'essay_focus'];
  for (const cat of categories) {
    const catStats = getStatisticsByCategory(cat as any);
    log(`${cat}: ${catStats.length} statistics`);
    results.push({
      test: `Category: ${cat}`,
      passed: catStats.length >= 1,
      details: `${catStats.length} statistics in category`,
    });
  }
}

// ============================================================================
// TEST 2: KEY INSIGHTS AVAILABLE
// ============================================================================

function testKeyInsights() {
  logSection('TEST 2: KEY INSIGHTS AVAILABLE');

  // Test helpfulness threshold
  const threshold = getHelpfulnessThresholdContext();
  log(`\nHelpfulness threshold: ${threshold.substring(0, 80)}...`);
  results.push({
    test: 'Helpfulness threshold context',
    passed: threshold.includes('10') && threshold.includes('essay'),
    details: 'Contains 10-hour and essay work context',
  });

  // Test essay editing importance
  const editing = getEssayEditingImportance();
  log(`Essay editing hours: ${editing.hours}`);
  log(`Essay editing proportion: ${editing.proportion}`);
  results.push({
    test: 'Essay editing importance',
    passed: editing.hours.includes('10') && editing.proportion.includes('%'),
    details: `${editing.hours} hours, ${editing.proportion} of engagement`,
  });

  // Test outcome multiplier
  const outcome = getOutcomeMultiplierContext();
  log(`Outcome multiplier: ${outcome.multiplier}`);
  results.push({
    test: 'Outcome multiplier',
    passed: outcome.multiplier.includes('3.5'),
    details: `${outcome.multiplier} - ${outcome.context.substring(0, 50)}...`,
  });

  // Test satisfaction comparison
  const satisfaction = getSatisfactionComparison();
  log(`Satisfaction comparison: ${satisfaction.substring(0, 80)}...`);
  results.push({
    test: 'Satisfaction comparison',
    passed: satisfaction.toLowerCase().includes('transactional') && satisfaction.toLowerCase().includes('comprehensive'),
    details: 'Compares engagement levels',
  });
}

// ============================================================================
// TEST 3: INTEGRATION WITH FEEDBACK SYSTEM
// ============================================================================

function testFeedbackIntegration() {
  logSection('TEST 3: INTEGRATION WITH FEEDBACK SYSTEM');

  // Test getIndustryContextForFeedback
  const context = getIndustryContextForFeedback();
  log(`\nJustification: ${context.justification.substring(0, 100)}...`);
  log(`Essay importance hours: ${context.essayImportance.hours}`);
  log(`Quick stats available: ${Object.keys(context.quickStats).length}`);

  results.push({
    test: 'Industry context for feedback',
    passed: context.justification.length > 100 && Object.keys(context.quickStats).length === 4,
    details: 'Full context object available',
  });

  // Test enhanceWhyMattersWithContext
  const baseMessage = 'This essay needs more specific details.';
  const enhanced = enhanceWhyMattersWithContext(baseMessage, true);
  log(`\nEnhanced message preview: ${enhanced.substring(0, 150)}...`);

  results.push({
    test: 'Enhance why matters',
    passed: enhanced.includes(baseMessage) && enhanced.includes('Industry Research Context'),
    details: 'Adds industry context to base message',
  });

  // Test random insight
  const insight = getRandomWhyMattersInsight();
  log(`\nRandom insight: ${insight.substring(0, 80)}...`);
  results.push({
    test: 'Random why matters insight',
    passed: insight.length > 20,
    details: 'Returns meaningful insight string',
  });

  // Test quick stats
  const quickStats = getQuickStats();
  log(`\nQuick stats:`);
  log(`  - Essay phase: ${quickStats.essayPhaseHours}`);
  log(`  - Helpfulness: ${quickStats.helpfulnessThreshold}`);
  log(`  - Satisfaction: ${quickStats.satisfactionDifference}`);
  log(`  - Outcome: ${quickStats.outcomeMultiplier}`);

  results.push({
    test: 'Quick stats',
    passed: Object.values(quickStats).every(v => v.length > 10),
    details: 'All 4 quick stats have content',
  });
}

// ============================================================================
// TEST 4: ESSAY-SPECIFIC INSIGHTS
// ============================================================================

function testEssayFocus() {
  logSection('TEST 4: ESSAY-SPECIFIC INSIGHTS');

  const essayStats = getEssayFocusedStatistics();
  log(`\nEssay-focused statistics: ${essayStats.length}`);

  for (const stat of essayStats) {
    log(`\n- ${stat.statistic}: ${stat.value}`);
    log(`  Implication: ${stat.implication_for_feedback.substring(0, 60)}...`);
  }

  results.push({
    test: 'Essay-focused statistics',
    passed: essayStats.length >= 2,
    details: `${essayStats.length} statistics specifically about essay work`,
  });

  // Test deep feedback justification
  const justification = getDeepFeedbackJustification();
  log(`\nDeep feedback justification:`);
  log(justification);

  results.push({
    test: 'Deep feedback justification',
    passed: justification.includes('essay') && justification.includes('comprehensive'),
    details: 'Explains why deep feedback matters',
  });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('  INDUSTRY INSIGHTS INTEGRATION TEST');
  console.log('█'.repeat(60));

  const startTime = Date.now();

  testDataIntegrity();
  testKeyInsights();
  testFeedbackIntegration();
  testEssayFocus();

  // Summary
  logSection('FINAL SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  RESULTS: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`  TIME: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log(`${'─'.repeat(60)}\n`);

  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('FAILED TESTS:');
    failed.forEach(f => console.log(`  ✗ ${f.test}: ${f.details}`));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  OVERALL: ${passed === total ? 'PASS ✓' : 'NEEDS WORK'}`);
  console.log(`${'═'.repeat(60)}\n`);
}

runAllTests();
