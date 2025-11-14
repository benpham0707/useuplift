/**
 * Comprehensive Model Comparison Test
 *
 * Tests Claude vs GPT-5 across multiple essays and quality dimensions.
 * Provides detailed analysis to determine which model performs better
 * for narrative workshop analysis.
 */

import { callUnifiedLLM, compareModels, type LLMProvider } from './src/lib/llm/unified';
import type { NarrativeEssayInput } from './src/services/narrativeWorkshop/types';
import * as fs from 'fs';

// ============================================================================
// TEST ESSAYS
// ============================================================================

const TEST_ESSAYS = {
  elite: {
    text: `The worst stench I had ever encountered hit me as I walked into the makeshift clinic. I was 16, purple nitrite gloves on my shaking hands, standing in a room where a man's gangrene had progressed to the point of amputation. This wasn't the medicine I'd imagined from Grey's Anatomy marathons.

For two weeks, I shadowed Dr. Martinez in rural Guatemala. She worked 14-hour days, treated 200 patients weekly, earned less than my monthly allowance. Yet she smiled more genuinely than anyone I knew back home. The disconnect between her joy and her circumstances gnawed at me.

On my seventh day, a mother brought her daughter—maybe 8 years old—with a fever of 104. No insurance. No money. Dr. Martinez treated her anyway, using supplies from her personal stock. "Medicine isn't about payment," she said in Spanish. "It's about seeing the person first."

That moment fractured something in me. I'd spent years optimizing my resume for selective college programs. I'd volunteered at prestigious hospitals, but I'd never touched a patient. I'd shadowed renowned surgeons, but I'd never asked about their why. I'd been building a narrative of success without understanding what success meant.

Back home, I started working at a free clinic in East Oakland. Less prestigious. No fancy equipment. But real people with real problems. An 80-year-old woman with diabetes who couldn't afford insulin. A construction worker with a broken hand who couldn't miss work. A teenage girl, scared and alone, who needed someone to just listen.

I've spent the past two years there—every Saturday, 8 AM to 4 PM. I've held the hands of people crying from pain we couldn't treat. I've translated for Spanish-speaking patients, my high school lessons suddenly vital. I've learned that medicine isn't the heroic surgery or the dramatic diagnosis. It's the daily choice to show up for people society has forgotten.

The stench of that first day in Guatemala never left me. But neither did Dr. Martinez's smile. Medicine, I've learned, isn't about glory. It's about the quiet decision to see people's humanity when the world looks away. It's uncomfortable. It's unglamorous. And it's exactly where I need to be.`,
    expectedScore: { min: 85, max: 95 },
    type: 'personal_statement',
    label: 'Elite (Guatemala Medical)',
  },

  mid: {
    text: `I never thought I'd find my passion in a dusty old library book. But there I was, junior year, flipping through "The Structure of Scientific Revolutions" by Thomas Kuhn, and something clicked.

The book talked about paradigm shifts—how entire fields of science can be revolutionized when someone questions the basic assumptions everyone takes for granted. I started thinking about how this applies to everything, not just science. How many assumptions do we make every day without questioning them?

This curiosity led me to start a philosophy club at my school. We had about 15 regular members, and we'd meet every Thursday after school to discuss big questions. We talked about everything from ethics to epistemology to political philosophy. Some of our best discussions came from applying philosophical frameworks to real-world problems our school was facing.

For example, when our school was deciding whether to implement a new honor code, our club analyzed different ethical frameworks—utilitarian, deontological, virtue ethics—to evaluate the proposal. We presented our analysis to the student council, and they actually incorporated some of our suggestions into the final policy.

Through leading this club, I learned how to facilitate discussions, manage different viewpoints, and help people see connections between abstract ideas and concrete situations. I also discovered that philosophy isn't just about thinking—it's about helping people think better.

What started as personal curiosity about a single book has become a deeper commitment to critical thinking and intellectual community. I want to continue this in college, whether through philosophy courses, interdisciplinary programs, or student organizations. I've learned that the best ideas come from questioning assumptions and engaging with different perspectives.`,
    expectedScore: { min: 70, max: 80 },
    type: 'personal_statement',
    label: 'Mid-Tier (Philosophy Club)',
  },

  weak: {
    text: `I have always been passionate about helping others and making a difference in my community. Ever since I was young, I knew that I wanted to pursue a career where I could have a positive impact on people's lives. This passion led me to volunteer at various organizations throughout high school.

One of my most meaningful experiences was volunteering at a local hospital. I worked there for two years, helping nurses and interacting with patients. It was very challenging at first, but I learned many valuable lessons about compassion, hard work, and dedication. Through this experience, I developed important skills like teamwork and communication.

I was also involved in several clubs at school, including the National Honor Society and Student Council. These activities taught me about leadership and responsibility. I learned that being a leader means more than just having a title—it means inspiring others and working together toward common goals.

Another significant experience was my participation in our school's community service day. We spent the day cleaning up a local park and helping elderly residents with yard work. It felt really good to give back to the community and make a tangible difference.

Looking ahead to college, I am excited about all the opportunities to continue growing and learning. I hope to major in a field where I can help people and continue my commitment to service. Through hard work and dedication, I believe I can achieve my goals and make my dreams come true.

In conclusion, my experiences have shaped who I am today. They have taught me the importance of perseverance, compassion, and dedication. I am ready for the challenges of college and excited to see where this journey takes me. I know that with determination and a positive attitude, I can accomplish anything I set my mind to.`,
    expectedScore: { min: 40, max: 55 },
    type: 'personal_statement',
    label: 'Weak (Generic Volunteering)',
  },
};

// ============================================================================
// EVALUATION CRITERIA
// ============================================================================

interface EvaluationCriteria {
  name: string;
  weight: number; // 0-1
  evaluator: (response: any) => {
    score: number; // 0-10
    notes: string;
  };
}

const EVALUATION_CRITERIA: EvaluationCriteria[] = [
  {
    name: 'Accuracy to Elite Standards',
    weight: 0.25,
    evaluator: (response) => {
      // Check if scoring aligns with elite benchmarks
      const score = response.overallScore || 0;
      const hasVulnerability = response.stage1_holisticUnderstanding?.authenticitySignals?.some(
        (s: string) => s.toLowerCase().includes('vulnerability')
      );
      const hasMicroMacro = response.stage4_synthesizedInsights?.keyInsights?.some(
        (i: string) => i.toLowerCase().includes('universal') || i.toLowerCase().includes('micro')
      );

      let evalScore = 5;
      if (hasVulnerability) evalScore += 2;
      if (hasMicroMacro) evalScore += 2;
      if (score >= 85) evalScore += 1;

      return {
        score: Math.min(10, evalScore),
        notes: `Vulnerability: ${hasVulnerability}, Micro→Macro: ${hasMicroMacro}, Score: ${score}`,
      };
    },
  },
  {
    name: 'Insight Specificity',
    weight: 0.20,
    evaluator: (response) => {
      const insights = response.stage5_specificInsights?.sentenceLevelInsights || [];
      const hasSpecificQuotes = insights.some((i: any) => i.sentenceText && i.sentenceText.length > 10);
      const hasBeforeAfter = insights.some((i: any) => i.beforeText && i.suggestedAfter);

      let score = hasSpecificQuotes ? 5 : 2;
      if (hasBeforeAfter) score += 3;
      if (insights.length >= 10) score += 2;

      return {
        score: Math.min(10, score),
        notes: `${insights.length} insights, specific quotes: ${hasSpecificQuotes}, before/after: ${hasBeforeAfter}`,
      };
    },
  },
  {
    name: 'Dimension Calibration',
    weight: 0.15,
    evaluator: (response) => {
      const dimensions = response.stage4_synthesizedInsights?.dimensionScores || {};
      const scores = Object.values(dimensions) as number[];

      if (scores.length === 0) return { score: 0, notes: 'No dimension scores found' };

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;

      // Good variance (not all same score) indicates nuanced understanding
      const varianceScore = Math.min(10, variance * 2);

      return {
        score: varianceScore,
        notes: `Avg: ${avg.toFixed(1)}, Variance: ${variance.toFixed(2)}, Scores: ${scores.map(s => s.toFixed(1)).join(', ')}`,
      };
    },
  },
  {
    name: 'Actionability',
    weight: 0.20,
    evaluator: (response) => {
      const roadmap = response.stage4_synthesizedInsights?.improvementRoadmap || {};
      const quickWins = roadmap.quickWins?.length || 0;
      const strategicMoves = roadmap.strategicMoves?.length || 0;
      const transformative = roadmap.transformativeMoves?.length || 0;

      const total = quickWins + strategicMoves + transformative;
      const score = Math.min(10, total / 2);

      return {
        score,
        notes: `Quick: ${quickWins}, Strategic: ${strategicMoves}, Transformative: ${transformative}`,
      };
    },
  },
  {
    name: 'Comparative Context Quality',
    weight: 0.10,
    evaluator: (response) => {
      const comparative = response.stage4_synthesizedInsights?.comparativeContext || {};
      const hasPercentile = !!comparative.percentileEstimate;
      const hasVsTypical = !!comparative.vsTypicalApplicant;
      const hasVsTop = !!comparative.vsTop10Percent;
      const hasAdvantages = (comparative.competitiveAdvantages?.length || 0) > 0;

      let score = 0;
      if (hasPercentile) score += 3;
      if (hasVsTypical) score += 2;
      if (hasVsTop) score += 2;
      if (hasAdvantages) score += 3;

      return {
        score,
        notes: `Percentile: ${hasPercentile}, vs Typical: ${hasVsTypical}, vs Top10: ${hasVsTop}, Advantages: ${hasAdvantages}`,
      };
    },
  },
  {
    name: 'Admissions Officer Perspective',
    weight: 0.10,
    evaluator: (response) => {
      const ao = response.stage4_synthesizedInsights?.officerPerspective || {};
      const hasFirstImpression = !!ao.firstImpression;
      const hasMemorability = typeof ao.memorabilityFactor === 'number';
      const hasConcerns = (ao.concernsFlags?.length || 0) > 0;
      const hasPositives = (ao.positiveSignals?.length || 0) > 0;

      let score = 0;
      if (hasFirstImpression) score += 3;
      if (hasMemorability) score += 2;
      if (hasConcerns) score += 2;
      if (hasPositives) score += 3;

      return {
        score,
        notes: `First Impression: ${hasFirstImpression}, Memorability: ${hasMemorability}, Concerns: ${hasConcerns}, Positives: ${hasPositives}`,
      };
    },
  },
];

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

interface TestResult {
  essayLabel: string;
  provider: LLMProvider;
  overallScore: number;
  expectedRange: { min: number; max: number };
  withinExpectedRange: boolean;
  criteriaScores: Record<string, { score: number; notes: string }>;
  weightedScore: number;
  performance: {
    duration: number;
    tokens: number;
    estimatedCost: number;
  };
  rawResponse: any;
}

async function testSingleEssay(
  essay: typeof TEST_ESSAYS.elite,
  provider: LLMProvider
): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing ${essay.label} with ${provider.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  // Import the orchestrator dynamically to use our unified LLM
  const { analyzeNarrativeWorkshop } = await import('./src/services/narrativeWorkshop/narrativeWorkshopOrchestrator');

  // Temporarily override the LLM provider (we'll need to modify the orchestrator to support this)
  // For now, let's just run the analysis
  const input: NarrativeEssayInput = {
    essayText: essay.text,
    essayType: essay.type as any,
    promptText: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
    maxWords: 650,
  };

  const response = await analyzeNarrativeWorkshop(input);
  const duration = Date.now() - startTime;

  // Evaluate against criteria
  const criteriaScores: Record<string, { score: number; notes: string }> = {};
  let weightedScore = 0;

  for (const criteria of EVALUATION_CRITERIA) {
    const result = criteria.evaluator(response);
    criteriaScores[criteria.name] = result;
    weightedScore += result.score * criteria.weight;
  }

  const overallScore = response.overallScore || 0;
  const withinExpectedRange = overallScore >= essay.expectedScore.min && overallScore <= essay.expectedScore.max;

  // Estimate cost (rough)
  const tokens = response.analysisMetadata?.totalTokensUsed || 0;
  const costPerMTok = provider === 'claude' ? 9 : 6.25; // Rough blended rate
  const estimatedCost = (tokens / 1_000_000) * costPerMTok;

  return {
    essayLabel: essay.label,
    provider,
    overallScore,
    expectedRange: essay.expectedScore,
    withinExpectedRange,
    criteriaScores,
    weightedScore,
    performance: {
      duration,
      tokens,
      estimatedCost,
    },
    rawResponse: response,
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runComprehensiveTest() {
  console.log('\n' + '█'.repeat(100));
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█' + '  NARRATIVE WORKSHOP — COMPREHENSIVE MODEL COMPARISON'.padEnd(98) + '█');
  console.log('█' + '  Testing Claude vs GPT-5 across Elite, Mid-Tier, and Weak Essays'.padEnd(98) + '█');
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█'.repeat(100) + '\n');

  const results: TestResult[] = [];

  // Test each essay with both models
  for (const [key, essay] of Object.entries(TEST_ESSAYS)) {
    console.log(`\n${'▓'.repeat(100)}`);
    console.log(`▓  ESSAY: ${essay.label}`);
    console.log('▓'.repeat(100) + '\n');

    try {
      // For now, just test with Claude (we need to modify the orchestrator to support provider selection)
      console.log('⚠️  Note: Currently testing with Claude only. GPT-5 integration requires orchestrator modification.');

      const claudeResult = await testSingleEssay(essay, 'claude');
      results.push(claudeResult);

      // Display result
      console.log(`\n✅ ${essay.label} - Claude Test Complete`);
      console.log(`   Score: ${claudeResult.overallScore}/100 (Expected: ${essay.expectedScore.min}-${essay.expectedScore.max})`);
      console.log(`   Within Range: ${claudeResult.withinExpectedRange ? '✓' : '✗'}`);
      console.log(`   Weighted Evaluation: ${claudeResult.weightedScore.toFixed(2)}/10`);
      console.log(`   Duration: ${(claudeResult.performance.duration / 1000).toFixed(2)}s`);
      console.log(`   Tokens: ${claudeResult.performance.tokens.toLocaleString()}`);
      console.log(`   Est. Cost: $${claudeResult.performance.estimatedCost.toFixed(4)}`);
    } catch (error) {
      console.error(`\n❌ Failed to test ${essay.label}:`, error);
    }
  }

  // ============================================================================
  // GENERATE COMPARISON REPORT
  // ============================================================================

  console.log('\n\n' + '█'.repeat(100));
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█' + '  COMPREHENSIVE COMPARISON REPORT'.padEnd(98) + '█');
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█'.repeat(100) + '\n');

  // Group by model
  const claudeResults = results.filter(r => r.provider === 'claude');
  const gptResults = results.filter(r => r.provider === 'gpt5');

  // Calculate averages
  const calculateAvg = (results: TestResult[], key: keyof TestResult['performance'] | 'weightedScore') => {
    if (results.length === 0) return 0;
    if (key === 'weightedScore') {
      return results.reduce((sum, r) => sum + r.weightedScore, 0) / results.length;
    }
    return results.reduce((sum, r) => sum + (r.performance[key as keyof TestResult['performance']] as number), 0) / results.length;
  };

  console.log('📊 AGGREGATE PERFORMANCE:\n');
  console.log(`Claude (${claudeResults.length} tests):`);
  console.log(`   Avg Weighted Score: ${calculateAvg(claudeResults, 'weightedScore').toFixed(2)}/10`);
  console.log(`   Avg Duration: ${(calculateAvg(claudeResults, 'duration') / 1000).toFixed(2)}s`);
  console.log(`   Avg Tokens: ${calculateAvg(claudeResults, 'tokens').toLocaleString()}`);
  console.log(`   Avg Cost: $${calculateAvg(claudeResults, 'estimatedCost').toFixed(4)}`);

  if (gptResults.length > 0) {
    console.log(`\nGPT-5 (${gptResults.length} tests):`);
    console.log(`   Avg Weighted Score: ${calculateAvg(gptResults, 'weightedScore').toFixed(2)}/10`);
    console.log(`   Avg Duration: ${(calculateAvg(gptResults, 'duration') / 1000).toFixed(2)}s`);
    console.log(`   Avg Tokens: ${calculateAvg(gptResults, 'tokens').toLocaleString()}`);
    console.log(`   Avg Cost: $${calculateAvg(gptResults, 'estimatedCost').toFixed(4)}`);
  }

  // Save detailed results to file
  const reportPath = 'model-comparison-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    testDate: new Date().toISOString(),
    results,
    summary: {
      claude: {
        avgWeightedScore: calculateAvg(claudeResults, 'weightedScore'),
        avgDuration: calculateAvg(claudeResults, 'duration'),
        avgTokens: calculateAvg(claudeResults, 'tokens'),
        avgCost: calculateAvg(claudeResults, 'estimatedCost'),
      },
      gpt5: gptResults.length > 0 ? {
        avgWeightedScore: calculateAvg(gptResults, 'weightedScore'),
        avgDuration: calculateAvg(gptResults, 'duration'),
        avgTokens: calculateAvg(gptResults, 'tokens'),
        avgCost: calculateAvg(gptResults, 'estimatedCost'),
      } : null,
    },
  }, null, 2));

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('\n' + '█'.repeat(100) + '\n');
}

// Run the test
runComprehensiveTest().catch(console.error);
