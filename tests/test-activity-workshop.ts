/**
 * Activity Workshop Validation Tests - BATCH OPTIMIZED
 *
 * Tests the complete BATCH-OPTIMIZED activity workshop system:
 *
 * COST COMPARISON:
 * - OLD: $0.08-0.12 per activity × 10 = $0.80-1.20 per stage = $1.60-2.40 total
 * - NEW: ~$0.15-0.25 + ~$0.20-0.30 = ~$0.35-0.55 total (75-80% REDUCTION)
 *
 * STAGE 1: BATCH Analysis (Single Sonnet call)
 * - Research-Backed Profiler pre-computes grade weighting, authenticity, spike detection
 * - Single API call analyzes ALL activities with full context
 * - Output: PortfolioAnalysis (data only)
 *
 * STAGE 2: BATCH Teaching (Single Sonnet call)
 * - Consumes full analysis for coherent guidance
 * - Single API call provides teaching for ALL activities
 * - Output: PortfolioTeaching (actionable guidance)
 *
 * Run with: ANTHROPIC_API_KEY="..." npx tsx tests/test-activity-workshop.ts
 */

import {
  activityWorkshopService,
  batchActivityAnalysisService,
  batchActivityTeachingService,
  activityCitationService,
} from '../src/services/portfolioStrategy/services/activityWorkshop';
import type {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
} from '../src/services/portfolioStrategy/services/activityWorkshop';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ACTIVITIES: ActivityWorkshopInput[] = [
  {
    id: 'act_1',
    title: 'USACO Gold Division Competitor',
    organization: 'USA Computing Olympiad',
    role: 'Competitor',
    category: 'school_activity',
    description:
      'Achieved Gold division in USACO competitive programming contest. Solved algorithmic problems in C++ involving dynamic programming, graph theory, and data structures. Practice 10+ hours weekly during competition season.',
    hoursPerWeek: 12,
    weeksPerYear: 40,
    yearsInvolved: 3,
    gradeLevels: [10, 11, 12],
    achievements: [
      { title: 'USACO Gold Division', level: 'national' },
      { title: 'School Programming Club President', level: 'school' },
    ],
  },
  {
    id: 'act_2',
    title: 'Founder, Code4Impact Tutoring',
    organization: 'Code4Impact',
    role: 'Founder & Lead Instructor',
    category: 'volunteer',
    description:
      'Founded free coding tutoring program for underserved middle schoolers. Built curriculum, recruited 15 volunteer tutors, taught 200+ students Python and web development. Program adopted by 3 schools.',
    hoursPerWeek: 8,
    weeksPerYear: 45,
    yearsInvolved: 2,
    gradeLevels: [11, 12],
    achievements: [
      { title: 'Served 200+ students', level: 'local' },
      { title: 'Program adopted by 3 schools', level: 'regional' },
    ],
  },
  {
    id: 'act_3',
    title: 'Research Assistant',
    organization: 'Stanford Computer Science',
    role: 'Research Intern',
    category: 'project',
    description:
      'Conducted ML research on natural language processing with Stanford professor. Developed novel text classification model achieving state-of-the-art results. First author on paper submitted to ACL conference.',
    hoursPerWeek: 15,
    weeksPerYear: 12,
    yearsInvolved: 1,
    gradeLevels: [11],
    achievements: [
      { title: 'First-author research paper', level: 'national' },
      { title: 'ACL conference submission', level: 'international' },
    ],
  },
  {
    id: 'act_4',
    title: 'Varsity Tennis Team Captain',
    organization: 'School Athletics',
    role: 'Captain',
    category: 'school_activity',
    description:
      'Led varsity tennis team as captain. Organized practices, mentored underclassmen, coordinated team strategy. Achieved All-District Second Team honors.',
    hoursPerWeek: 15,
    weeksPerYear: 30,
    yearsInvolved: 4,
    gradeLevels: [9, 10, 11, 12],
    achievements: [
      { title: 'Team Captain', level: 'school' },
      { title: 'All-District Second Team', level: 'district' },
    ],
  },
  {
    id: 'act_5',
    title: 'Generic Club Member',
    organization: 'School Volunteer Club',
    role: 'Member',
    category: 'volunteer',
    description: 'Member of volunteer club. Participated in events. Helped with activities.',
    hoursPerWeek: 2,
    weeksPerYear: 30,
    yearsInvolved: 2,
    gradeLevels: [9, 10],
    achievements: [],
  },
];

const TEST_INPUT: ActivityWorkshopSessionInput = {
  activities: TEST_ACTIVITIES,
  studentContext: {
    intendedMajor: 'Computer Science',
    targetSchools: ['MIT', 'Stanford', 'Carnegie Mellon'],
    gradeLevel: 12,
    firstGen: false,
    lowIncome: false,
  },
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  console.log(`\n🧪 Running: ${name}`);

  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ name, passed: true, duration });
    console.log(`✅ PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({ name, passed: false, duration, error: errorMessage });
    console.log(`❌ FAILED (${duration}ms): ${errorMessage}`);
  }
}

function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

  for (const result of testResults) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${passed}/${passed + failed} passed`);
  console.log(`Duration: ${totalDuration}ms`);
  console.log('='.repeat(60));
}

// ============================================================================
// TESTS
// ============================================================================

async function testCitationService(): Promise<void> {
  console.log('  Testing citation service...');

  // Test tier citations
  const tierCitations = activityCitationService.getCitationsForTier(TEST_ACTIVITIES[0], 2);
  if (tierCitations.length === 0) {
    throw new Error('No tier citations generated');
  }
  console.log(`  - Generated ${tierCitations.length} tier citations`);

  // Test red flag citations
  const redFlagCitations = activityCitationService.getCitationsForRedFlag('fake_ceo', TEST_ACTIVITIES[1]);
  if (redFlagCitations.length === 0) {
    throw new Error('No red flag citations generated');
  }
  console.log(`  - Generated ${redFlagCitations.length} red flag citations`);

  // Test upgrade citations
  const upgradeCitations = activityCitationService.getCitationsForUpgrade(TEST_ACTIVITIES[0], 2, 1);
  if (upgradeCitations.length === 0) {
    throw new Error('No upgrade citations generated');
  }
  console.log(`  - Generated ${upgradeCitations.length} upgrade citations`);

  // Test spike citations
  const spikeCitations = activityCitationService.getCitationsForSpike('tech_innovator', 'strong');
  if (spikeCitations.length === 0) {
    throw new Error('No spike citations generated');
  }
  console.log(`  - Generated ${spikeCitations.length} spike citations`);

  // Test coherence citations
  const coherenceCitations = activityCitationService.getCitationsForCoherence(75, 'moderate');
  if (coherenceCitations.length === 0) {
    throw new Error('No coherence citations generated');
  }
  console.log(`  - Generated ${coherenceCitations.length} coherence citations`);

  // Test citation attachment
  const citedText = activityCitationService.attachCitations(
    'This activity is strong. It shows commitment.',
    tierCitations
  );
  if (!citedText.text || citedText.citations.length === 0) {
    throw new Error('Citation attachment failed');
  }
  console.log(`  - Citation attachment working`);
}

async function testSingleActivityAnalysis(): Promise<void> {
  console.log('  Analyzing USACO Gold activity (Batch Analysis Service)...');

  const analysis = await batchActivityAnalysisService.analyzeActivity(TEST_ACTIVITIES[0], TEST_INPUT.studentContext);

  // Check required fields
  if (!analysis.activityId) {
    throw new Error('Missing activity ID');
  }
  if (!analysis.classification) {
    throw new Error('Missing classification');
  }
  if (
    typeof analysis.classification.tier !== 'number' ||
    analysis.classification.tier < 1 ||
    analysis.classification.tier > 4
  ) {
    throw new Error(`Invalid tier: ${analysis.classification.tier}`);
  }
  if (!['high', 'medium', 'low'].includes(analysis.classification.tierConfidence)) {
    throw new Error(`Invalid tier confidence: ${analysis.classification.tierConfidence}`);
  }

  console.log(`  - Activity ID: ${analysis.activityId}`);
  console.log(
    `  - Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence} confidence)`
  );
  console.log(`  - Category: ${analysis.classification.category}`);
  console.log(`  - Recognition: ${analysis.recognition?.level || 'N/A'}`);
  console.log(`  - Leadership: ${analysis.leadership?.type || 'N/A'}`);
  console.log(`  - Red Flags: ${analysis.redFlags?.length || 0}`);
  console.log(`  - Green Flags: ${analysis.greenFlags?.length || 0}`);

  // USACO Gold should be Tier 1 or 2
  if (analysis.classification.tier > 2) {
    console.log(`  ⚠️ Warning: USACO Gold classified as Tier ${analysis.classification.tier}, expected Tier 1-2`);
  }
}

async function testWeakActivityAnalysis(): Promise<void> {
  console.log('  Analyzing generic club membership (Batch Analysis Service)...');

  const analysis = await batchActivityAnalysisService.analyzeActivity(TEST_ACTIVITIES[4], TEST_INPUT.studentContext);

  console.log(`  - Activity ID: ${analysis.activityId}`);
  console.log(`  - Tier: ${analysis.classification?.tier || 'N/A'}`);
  console.log(`  - Description Quality: Specificity=${analysis.descriptionQuality?.specificity || 'N/A'}/10`);
  console.log(`  - Red Flags: ${analysis.redFlags?.map((f) => f.flag).join(', ') || 'None'}`);

  // Generic club should be Tier 3-4
  if (analysis.classification && analysis.classification.tier < 3) {
    console.log(
      `  ⚠️ Warning: Generic club classified as Tier ${analysis.classification.tier}, expected Tier 3-4`
    );
  }

  // Should have low specificity
  if (analysis.descriptionQuality && analysis.descriptionQuality.specificity > 5) {
    console.log(
      `  ⚠️ Warning: Specificity ${analysis.descriptionQuality.specificity}/10 seems high for vague description`
    );
  }
}

async function testPortfolioAnalysis(): Promise<void> {
  console.log('  Running BATCH Portfolio Analysis (single API call)...');

  const analysis = await batchActivityAnalysisService.analyzePortfolio(TEST_INPUT);

  // Check activities
  const totalActivities = Object.keys(analysis.activities).length;
  if (totalActivities !== TEST_ACTIVITIES.length) {
    throw new Error(`Expected ${TEST_ACTIVITIES.length} activity analyses, got ${totalActivities}`);
  }

  console.log(`  - Activities analyzed: ${totalActivities}`);
  console.log(
    `  - Tier distribution: T1=${analysis.tierDistribution?.tier1 || 0}, T2=${analysis.tierDistribution?.tier2 || 0}, T3=${analysis.tierDistribution?.tier3 || 0}, T4=${analysis.tierDistribution?.tier4 || 0}`
  );
  console.log(
    `  - Spike detected: ${analysis.spikeAnalysis?.hasSpike || false} (${analysis.spikeAnalysis?.spikeType || 'none'}, ${analysis.spikeAnalysis?.spikeStrength || 'none'})`
  );
  console.log(
    `  - Coherence: ${analysis.coherenceAnalysis?.score || 'N/A'}/100 (${analysis.coherenceAnalysis?.assessment || 'N/A'})`
  );
  console.log(`  - Primary theme: ${analysis.coherenceAnalysis?.primaryTheme || 'N/A'}`);
  console.log(`  - Depth/Breadth: ${analysis.depthBreadthProfile?.profile || 'N/A'}`);
  console.log(`  - Gaps: ${analysis.gapsIdentified?.length || 0} identified`);

  // Verify coherence score is reasonable
  if (
    analysis.coherenceAnalysis?.score !== undefined &&
    (analysis.coherenceAnalysis.score < 0 || analysis.coherenceAnalysis.score > 100)
  ) {
    throw new Error(`Invalid coherence score: ${analysis.coherenceAnalysis.score}`);
  }

  // CS-focused student with USACO + research should have spike
  if (!analysis.spikeAnalysis?.hasSpike) {
    console.log(`  ⚠️ Warning: Expected spike detection for CS-focused portfolio`);
  }
}

async function testAnalysisOnly(): Promise<void> {
  console.log('  Testing analysisOnly() method...');

  const analysis = await activityWorkshopService.analysisOnly(TEST_INPUT);

  // Should return PortfolioAnalysis without teaching
  if (!analysis.activities) {
    throw new Error('Missing activities in analysis');
  }
  if (!analysis.tierDistribution) {
    throw new Error('Missing tier distribution');
  }
  if (!analysis.spikeAnalysis) {
    throw new Error('Missing spike analysis');
  }
  if (!analysis.coherenceAnalysis) {
    throw new Error('Missing coherence analysis');
  }

  console.log(`  - Analysis returned ${Object.keys(analysis.activities).length} activities`);
  console.log(`  - Has spike analysis: ${!!analysis.spikeAnalysis}`);
  console.log(`  - Has coherence analysis: ${!!analysis.coherenceAnalysis}`);
  console.log(`  - Has tier distribution: ${!!analysis.tierDistribution}`);
}

async function testFullWorkshopAnalysis(): Promise<void> {
  console.log('  Running full BATCH workshop analysis (2 API calls total)...');
  console.log('  Expected cost: ~$0.35-0.55 (vs $1.60-2.40 legacy)');

  const result = await activityWorkshopService.analyzePortfolio(TEST_INPUT);

  // Check metadata
  if (!result.sessionId) {
    throw new Error('Missing session ID');
  }
  if (result.version !== '3.0.0') {
    throw new Error(`Unexpected version: ${result.version}, expected 3.0.0 (batch optimized)`);
  }

  // Check Stage 1: Analysis
  if (!result.analysis) {
    throw new Error('Missing analysis (Stage 1)');
  }
  if (Object.keys(result.analysis.activities).length !== TEST_ACTIVITIES.length) {
    throw new Error('Analysis missing activities');
  }

  // Check Stage 2: Teaching
  if (!result.teaching) {
    throw new Error('Missing teaching (Stage 2)');
  }
  if (Object.keys(result.teaching.activities || {}).length !== TEST_ACTIVITIES.length) {
    throw new Error('Teaching missing activities');
  }

  console.log(`  - Session ID: ${result.sessionId}`);
  console.log(`  - Version: ${result.version}`);
  console.log(`  - Overall confidence: ${result.overallConfidence}%`);
  console.log(`  - Cost tracking: $${result.costTracking.totalCost.toFixed(4)} total`);
  console.log(`    - Analysis: $${result.costTracking.analysisCost.toFixed(4)}`);
  console.log(`    - Teaching: $${result.costTracking.teachingCost.toFixed(4)}`);

  // Check Stage 1 outputs
  console.log('\n  Stage 1 (Analysis) outputs:');
  console.log(`  - Spike: ${result.analysis.spikeAnalysis?.hasSpike ? 'Yes' : 'No'}`);
  console.log(`  - Coherence: ${result.analysis.coherenceAnalysis?.score || 'N/A'}/100`);
  console.log(`  - Portfolio tier: ${result.analysis.tierDistribution?.portfolioTier || 'N/A'}`);

  // Check Stage 2 outputs
  console.log('\n  Stage 2 (Teaching) outputs:');
  if (result.teaching.narrativeTeaching?.twoSentencePitch) {
    console.log(`  - Two-sentence pitch: "${result.teaching.narrativeTeaching.twoSentencePitch.slice(0, 100)}..."`);
  }
  if (result.teaching.narrativeTeaching?.archetype) {
    console.log(`  - Archetype: ${result.teaching.narrativeTeaching.archetype}`);
  }

  // Check Common App strategy
  if (result.teaching.commonAppStrategy?.recommendedOrder) {
    console.log(`  - Recommended order: ${result.teaching.commonAppStrategy.recommendedOrder.join(', ')}`);
  }

  // Check individual activity teaching
  const firstActivityTeaching = result.teaching.activities?.[TEST_ACTIVITIES[0].id];
  if (firstActivityTeaching) {
    console.log(`\n  First activity teaching:`);
    console.log(`  - Tier: ${firstActivityTeaching.tierExplanation?.assignedTier || 'N/A'}`);
    if (firstActivityTeaching.descriptionOptimization?.optimizedDescription) {
      console.log(
        `  - Optimized description: ${firstActivityTeaching.descriptionOptimization.optimizedDescription.slice(0, 80)}...`
      );
    }
  }

  // Verify confidence factors
  if (result.confidenceFactors.length === 0) {
    throw new Error('Missing confidence factors');
  }
  console.log(`\n  Confidence factors: ${result.confidenceFactors.length}`);
  for (const factor of result.confidenceFactors) {
    console.log(`    - ${factor.impact === 'positive' ? '+' : '-'}${factor.score}: ${factor.factor}`);
  }
}

async function testCostEstimation(): Promise<void> {
  console.log('  Testing cost estimation...');

  const costs5 = activityWorkshopService.getEstimatedCost(5);
  const costs10 = activityWorkshopService.getEstimatedCost(10);

  console.log(
    `  - 5 activities: $${costs5.totalCost.toFixed(4)} (analysis: $${costs5.analysisCost.toFixed(4)}, teaching: $${costs5.teachingCost.toFixed(4)})`
  );
  console.log(
    `  - 10 activities: $${costs10.totalCost.toFixed(4)} (analysis: $${costs10.analysisCost.toFixed(4)}, teaching: $${costs10.teachingCost.toFixed(4)})`
  );

  // Verify costs are reasonable
  if (costs10.totalCost < costs5.totalCost) {
    throw new Error('10 activities should cost more than 5');
  }
  if (costs10.totalCost > 2) {
    throw new Error(`Cost seems too high: $${costs10.totalCost.toFixed(2)}`);
  }

  // Both stages use Sonnet, so costs should be similar
  const analysisPct = (costs10.analysisCost / costs10.totalCost) * 100;
  console.log(`  - Analysis is ${analysisPct.toFixed(1)}% of total cost`);
}

async function testInputValidation(): Promise<void> {
  console.log('  Testing input validation...');

  // Test empty activities
  try {
    await activityWorkshopService.analyzePortfolio({ activities: [] });
    throw new Error('Should have rejected empty activities');
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('At least one activity')) {
      throw error;
    }
    console.log('  - Correctly rejected empty activities');
  }

  // Test missing description
  try {
    await activityWorkshopService.analyzePortfolio({
      activities: [
        {
          id: 'test',
          title: 'Test Activity',
          category: 'project',
          description: '',
          hoursPerWeek: 5,
          weeksPerYear: 40,
        },
      ],
    });
    throw new Error('Should have rejected missing description');
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Description is required')) {
      throw error;
    }
    console.log('  - Correctly rejected missing description');
  }
}

async function testTeachingFromAnalysis(): Promise<void> {
  console.log('  Testing teachingFromAnalysis() method...');

  // First get analysis
  const analysis = await activityWorkshopService.analysisOnly(TEST_INPUT);
  console.log(`  - Got analysis with ${Object.keys(analysis.activities).length} activities`);

  // Then generate teaching from it
  const teaching = await activityWorkshopService.teachingFromAnalysis(TEST_INPUT, analysis);

  // Verify teaching output
  if (!teaching.activities) {
    throw new Error('Missing activities in teaching');
  }
  if (Object.keys(teaching.activities).length !== TEST_ACTIVITIES.length) {
    throw new Error('Teaching missing some activities');
  }

  console.log(`  - Teaching generated for ${Object.keys(teaching.activities).length} activities`);
  console.log(`  - Has narrative teaching: ${!!teaching.narrativeTeaching}`);
  console.log(`  - Has spike teaching: ${!!teaching.spikeTeaching}`);
  console.log(`  - Has coherence teaching: ${!!teaching.coherenceTeaching}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('ACTIVITY WORKSHOP VALIDATION TESTS - BATCH OPTIMIZED (v3.0)');
  console.log('='.repeat(70));
  console.log('');
  console.log('COST COMPARISON:');
  console.log('- OLD: $0.08-0.12 per activity × 10 × 2 stages = $1.60-2.40');
  console.log('- NEW: ~$0.15-0.25 (analysis) + ~$0.20-0.30 (teaching) = ~$0.35-0.55');
  console.log('- SAVINGS: 75-80% cost reduction!');
  console.log('');
  console.log('BATCH Architecture: Research-Backed Profiler → Single API calls');
  console.log('='.repeat(70));

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  // Run tests in order (some depend on others)
  await runTest('Citation Service', testCitationService);
  await runTest('Cost Estimation', testCostEstimation);
  await runTest('Input Validation', testInputValidation);

  // Stage 1 tests
  await runTest('Single Activity Analysis (USACO)', testSingleActivityAnalysis);
  await runTest('Weak Activity Analysis (Generic Club)', testWeakActivityAnalysis);
  await runTest('Portfolio Analysis (Stage 1)', testPortfolioAnalysis);
  await runTest('Analysis Only Mode', testAnalysisOnly);

  // Stage 2 tests
  await runTest('Teaching From Analysis', testTeachingFromAnalysis);

  // Full pipeline test
  await runTest('Full Workshop Analysis (Stage 1 → Stage 2)', testFullWorkshopAnalysis);

  // Print summary
  printSummary();

  // Exit with appropriate code
  const failed = testResults.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
