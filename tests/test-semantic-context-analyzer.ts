/**
 * Test Semantic Context Analyzer
 *
 * Compares AI-powered semantic analysis vs hardcoded regex patterns.
 *
 * Tests:
 * 1. Does AI catch gaps that regex misses?
 * 2. Does AI correctly identify essays that are already specific?
 * 3. Is quality scoring accurate and consistent?
 * 4. Is it cost-effective? (should be ~$0.001-0.002 per analysis)
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-semantic-context-analyzer.ts
 */

import { semanticContextAnalyzer } from '../src/services/commonAppWorkshop/services/semanticContextAnalyzer';
import { strategicContextGapDetector } from '../src/services/commonAppWorkshop/services/contextGapDetector';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Essays that SHOULD trigger context gathering
 * Some use patterns regex won't catch
 */
const ESSAYS_NEEDING_CONTEXT: Array<{
  type: SupplementalType;
  essay: string;
  description: string;
  why_gap_exists: string;
}> = [
  {
    type: 'why_us',
    essay: `Stanford's interdisciplinary approach appeals to me. The research opportunities are exciting and the faculty seems innovative. I believe I would thrive in this environment.`,
    description: 'Generic why_us - no specific research mentioned',
    why_gap_exists: 'Claims excitement without any specific research details'
  },
  {
    type: 'challenge',
    essay: `Moving to a new country was difficult. Navigating the transition required resilience. Through this experience, I developed a stronger sense of self and learned valuable life lessons.`,
    description: 'Vague challenge - regex might miss "navigating the transition"',
    why_gap_exists: 'No concrete struggle moment, no specific difficulty shown'
  },
  {
    type: 'why_major',
    essay: `My interest in biology stems from a genuine curiosity about living systems. The complexity of cellular mechanisms captivates me. I want to contribute to scientific understanding.`,
    description: 'Abstract interest - no specific moment or experience',
    why_gap_exists: 'No concrete experience that sparked interest, just claims fascination'
  },
  {
    type: 'extracurricular',
    essay: `Being part of the debate team has been meaningful. I've developed strong communication skills and learned to see multiple perspectives. This activity helped shape who I am.`,
    description: 'Generic extracurricular - no specific moments',
    why_gap_exists: 'No specific debate, interaction, or moment described'
  },
  {
    type: 'community',
    essay: `I've been actively involved in volunteer work at a local shelter. Helping those less fortunate has given me perspective. I feel grateful for the opportunity to make a difference.`,
    description: 'Abstract community involvement',
    why_gap_exists: 'No specific person, interaction, or moment at the shelter'
  }
];

/**
 * Essays that should NOT trigger context gathering
 * Already have concrete details
 */
const ESSAYS_ALREADY_SPECIFIC: Array<{
  type: SupplementalType;
  essay: string;
  description: string;
  why_specific: string;
}> = [
  {
    type: 'extracurricular',
    essay: `At 6am on Saturdays, I'm the first one at the robotics lab. My teammates trickle in around 8, coffee in hand. Last March, our bot's arm snapped mid-competition—I spent 47 minutes rewiring it while my teammate distracted the judges with questions about scoring. We placed third.`,
    description: 'Specific extracurricular with time, scene, dialogue',
    why_specific: 'Has time (6am), specific incident (arm snapping), duration (47 minutes)'
  },
  {
    type: 'challenge',
    essay: `My hands shook as I pressed send on the email. Three months of work, reduced to a single attachment. The rejection came at 11:47pm—I remember because I was still staring at my inbox. I cried in my car for twenty minutes, then went back inside and started the next draft.`,
    description: 'Vivid challenge with sensory details and emotions',
    why_specific: 'Has physical details (hands shook), specific time (11:47pm), duration (twenty minutes)'
  },
  {
    type: 'why_us',
    essay: `Professor Chen's lab uses contrastive learning on unlabeled medical images, achieving 94% accuracy with just 50 labeled examples. When I read her 2023 paper on few-shot learning, I spent three hours trying to replicate her preprocessing pipeline. That efficiency—doing more with less data—is exactly the problem I want to work on.`,
    description: 'Specific research with technical details',
    why_specific: 'Has specific method, numbers (94%, 50 examples), personal engagement (replicating pipeline)'
  }
];

/**
 * Student responses to score for quality
 */
const STUDENT_RESPONSES: Array<{
  response: string;
  gap_type: string;
  expected_acceptable: boolean;
  description: string;
}> = [
  {
    response: 'It was a meaningful experience that taught me a lot about life.',
    gap_type: 'missing_specific_insight',
    expected_acceptable: false,
    description: 'Vague response - should need follow-up'
  },
  {
    response: 'I was in my room at 11pm when it finally clicked. I\'d been debugging for hours, and suddenly realized the error wasn\'t in my code—it was in my assumptions about the data format.',
    gap_type: 'missing_specific_insight',
    expected_acceptable: true,
    description: 'Specific response with time, location, and actual insight'
  },
  {
    response: 'My grandmother. She can\'t use her smartphone because the buttons are too small and the menus are too deep. She gave up after a week.',
    gap_type: 'missing_personal_stake',
    expected_acceptable: true,
    description: 'Specific person with concrete detail'
  },
  {
    response: 'I care about accessibility because it\'s important.',
    gap_type: 'missing_personal_stake',
    expected_acceptable: false,
    description: 'Generic - no personal connection shown'
  }
];

// ============================================================================
// FORMATTING
// ============================================================================

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}${title}${RESET}`);
  console.log('═'.repeat(70));
}

// ============================================================================
// TESTS
// ============================================================================

async function testGapDetection(): Promise<{ ai_correct: number; regex_correct: number; total: number }> {
  printSection('TEST 1: GAP DETECTION - ESSAYS NEEDING CONTEXT');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return { ai_correct: 0, regex_correct: 0, total: 0 };
  }

  let aiCorrect = 0;
  let regexCorrect = 0;
  let totalCost = 0;

  for (const testCase of ESSAYS_NEEDING_CONTEXT) {
    console.log(`\n${BOLD}${testCase.type.toUpperCase()}: ${testCase.description}${RESET}`);
    console.log(`${DIM}${testCase.essay.substring(0, 100)}...${RESET}`);

    // AI analysis
    const aiResult = await semanticContextAnalyzer.analyzeContextGaps(
      testCase.essay,
      testCase.type
    );
    totalCost += aiResult.cost;

    // Regex analysis
    const regexDecision = strategicContextGapDetector.makeStrategicDecision(
      testCase.essay,
      testCase.type,
      [],
      250
    );

    // Expected: should_gather = true
    const aiCorrectHere = aiResult.should_gather_context;
    const regexCorrectHere = regexDecision.should_gather;

    if (aiCorrectHere) aiCorrect++;
    if (regexCorrectHere) regexCorrect++;

    console.log(`\n  ${CYAN}AI Analysis:${RESET}`);
    console.log(`    Should Gather: ${aiResult.should_gather_context ? GREEN + 'YES ✓' : RED + 'NO ✗'}${RESET}`);
    console.log(`    Gaps Found: ${aiResult.gaps.length}`);
    if (aiResult.gaps.length > 0) {
      console.log(`    Top Gap: ${aiResult.gaps[0].gap_type}`);
      console.log(`    ${DIM}${aiResult.gaps[0].diagnosis}${RESET}`);
    }

    console.log(`\n  ${CYAN}Regex Analysis:${RESET}`);
    console.log(`    Should Gather: ${regexDecision.should_gather ? GREEN + 'YES ✓' : RED + 'NO ✗'}${RESET}`);
    console.log(`    High Impact Zones: ${regexDecision.high_impact_zones.length}`);
  }

  console.log(`\n${BOLD}SUMMARY:${RESET}`);
  console.log(`  AI Correct: ${aiCorrect}/${ESSAYS_NEEDING_CONTEXT.length}`);
  console.log(`  Regex Correct: ${regexCorrect}/${ESSAYS_NEEDING_CONTEXT.length}`);
  console.log(`  Total Cost: $${totalCost.toFixed(4)}`);

  return { ai_correct: aiCorrect, regex_correct: regexCorrect, total: ESSAYS_NEEDING_CONTEXT.length };
}

async function testSpecificEssayDetection(): Promise<{ ai_correct: number; regex_correct: number; total: number }> {
  printSection('TEST 2: SPECIFIC ESSAY DETECTION - SHOULD NOT TRIGGER');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return { ai_correct: 0, regex_correct: 0, total: 0 };
  }

  let aiCorrect = 0;
  let regexCorrect = 0;
  let totalCost = 0;

  for (const testCase of ESSAYS_ALREADY_SPECIFIC) {
    console.log(`\n${BOLD}${testCase.type.toUpperCase()}: ${testCase.description}${RESET}`);
    console.log(`${DIM}${testCase.essay.substring(0, 100)}...${RESET}`);

    // AI analysis
    const aiResult = await semanticContextAnalyzer.analyzeContextGaps(
      testCase.essay,
      testCase.type
    );
    totalCost += aiResult.cost;

    // Regex analysis
    const regexDecision = strategicContextGapDetector.makeStrategicDecision(
      testCase.essay,
      testCase.type,
      [],
      250
    );

    // Expected: should_gather = false (already specific)
    const aiCorrectHere = !aiResult.should_gather_context;
    const regexCorrectHere = !regexDecision.should_gather;

    if (aiCorrectHere) aiCorrect++;
    if (regexCorrectHere) regexCorrect++;

    console.log(`\n  ${CYAN}AI Analysis:${RESET}`);
    console.log(`    Should Gather: ${!aiResult.should_gather_context ? GREEN + 'NO ✓' : RED + 'YES ✗'}${RESET}`);
    console.log(`    Gaps Found: ${aiResult.gaps.length}`);
    console.log(`    Reason: ${aiResult.reason}`);

    console.log(`\n  ${CYAN}Regex Analysis:${RESET}`);
    console.log(`    Should Gather: ${!regexDecision.should_gather ? GREEN + 'NO ✓' : RED + 'YES ✗'}${RESET}`);
  }

  console.log(`\n${BOLD}SUMMARY:${RESET}`);
  console.log(`  AI Correct: ${aiCorrect}/${ESSAYS_ALREADY_SPECIFIC.length}`);
  console.log(`  Regex Correct: ${regexCorrect}/${ESSAYS_ALREADY_SPECIFIC.length}`);
  console.log(`  Total Cost: $${totalCost.toFixed(4)}`);

  return { ai_correct: aiCorrect, regex_correct: regexCorrect, total: ESSAYS_ALREADY_SPECIFIC.length };
}

async function testQualityScoring(): Promise<number> {
  printSection('TEST 3: CONTEXT QUALITY SCORING');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return 0;
  }

  let correct = 0;

  for (const testCase of STUDENT_RESPONSES) {
    console.log(`\n${BOLD}${testCase.description}${RESET}`);
    console.log(`${DIM}"${testCase.response}"${RESET}`);

    const mockGap = {
      gap_type: testCase.gap_type as any,
      quote: 'test quote',
      diagnosis: 'test diagnosis',
      what_would_fix_it: 'test fix',
      impact: 'high' as const,
      question_to_ask: 'test question'
    };

    const score = await semanticContextAnalyzer.scoreContextQuality(
      testCase.response,
      mockGap,
      'why_major'
    );

    const isCorrect = score.is_acceptable === testCase.expected_acceptable;
    if (isCorrect) correct++;

    const acceptColor = score.is_acceptable ? GREEN : RED;
    const expectedColor = testCase.expected_acceptable ? GREEN : RED;

    console.log(`\n  Score: ${score.overall}/5`);
    console.log(`  Acceptable: ${acceptColor}${score.is_acceptable ? 'YES' : 'NO'}${RESET}`);
    console.log(`  Expected: ${expectedColor}${testCase.expected_acceptable ? 'YES' : 'NO'}${RESET}`);
    console.log(`  ${isCorrect ? GREEN + '✓ Correct' : RED + '✗ Incorrect'}${RESET}`);
    console.log(`  ${DIM}Assessment: ${score.assessment}${RESET}`);

    if (score.follow_up_needed) {
      console.log(`  ${YELLOW}Follow-up: ${score.follow_up_needed}${RESET}`);
    }
  }

  console.log(`\n${BOLD}QUALITY SCORING ACCURACY: ${correct}/${STUDENT_RESPONSES.length}${RESET}`);
  return correct;
}

async function testQuickCheck(): Promise<void> {
  printSection('TEST 4: QUICK CHECK (NO API CALLS)');

  const allEssays = [...ESSAYS_NEEDING_CONTEXT, ...ESSAYS_ALREADY_SPECIFIC];

  console.log('\nTesting quick heuristic check (no API cost):\n');

  let highConfidence = 0;
  let lowConfidence = 0;

  for (const essay of allEssays) {
    const result = semanticContextAnalyzer.quickCheck(essay.essay, essay.type);

    if (result.confidence === 'high') highConfidence++;
    else lowConfidence++;

    const confColor = result.confidence === 'high' ? GREEN : YELLOW;
    console.log(`${BOLD}${essay.type}${RESET}: ${confColor}${result.confidence}${RESET} confidence`);
    console.log(`  Likely needs context: ${result.likely_needs_context ? 'Yes' : 'No'}`);
    console.log(`  ${DIM}${result.reason}${RESET}\n`);
  }

  console.log(`${BOLD}QUICK CHECK SUMMARY:${RESET}`);
  console.log(`  High confidence decisions: ${highConfidence}/${allEssays.length}`);
  console.log(`  Need AI analysis: ${lowConfidence}/${allEssays.length}`);
  console.log(`  ${DIM}High confidence = no API call needed${RESET}`);
}

async function testCostEfficiency(): Promise<void> {
  printSection('TEST 5: COST EFFICIENCY');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return;
  }

  // Run 5 analyses and measure cost
  const testEssay = ESSAYS_NEEDING_CONTEXT[0];
  let totalCost = 0;
  let totalTime = 0;

  console.log('\nRunning 5 analyses to measure cost and time...\n');

  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const result = await semanticContextAnalyzer.analyzeContextGaps(
      testEssay.essay,
      testEssay.type
    );
    const elapsed = Date.now() - start;

    totalCost += result.cost;
    totalTime += elapsed;

    console.log(`  Run ${i + 1}: $${result.cost.toFixed(4)} | ${elapsed}ms`);
  }

  const avgCost = totalCost / 5;
  const avgTime = totalTime / 5;

  console.log(`\n${BOLD}COST EFFICIENCY:${RESET}`);
  console.log(`  Average cost per analysis: $${avgCost.toFixed(4)}`);
  console.log(`  Average time: ${avgTime.toFixed(0)}ms`);
  console.log(`  Estimated cost for 1000 essays: $${(avgCost * 1000).toFixed(2)}`);

  if (avgCost < 0.003) {
    console.log(`  ${GREEN}✓ Cost-effective (< $0.003 per analysis)${RESET}`);
  } else {
    console.log(`  ${YELLOW}⚠ Higher than expected cost${RESET}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log('  SEMANTIC CONTEXT ANALYZER TEST');
  console.log('  AI-Powered vs Hardcoded Pattern Detection');
  console.log('█'.repeat(70));

  try {
    // Test quick check first (no API)
    await testQuickCheck();

    // API tests
    const gapResults = await testGapDetection();
    const specificResults = await testSpecificEssayDetection();
    const qualityCorrect = await testQualityScoring();
    await testCostEfficiency();

    // Final summary
    console.log('\n' + '█'.repeat(70));
    console.log(`  ${GREEN}ALL TESTS COMPLETED${RESET}`);
    console.log('█'.repeat(70));

    if (process.env.ANTHROPIC_API_KEY) {
      const totalAiCorrect = gapResults.ai_correct + specificResults.ai_correct;
      const totalRegexCorrect = gapResults.regex_correct + specificResults.regex_correct;
      const totalTests = gapResults.total + specificResults.total;

      console.log(`
${CYAN}${BOLD}FINAL COMPARISON:${RESET}

${BOLD}Gap Detection Accuracy:${RESET}
  AI-Powered:  ${totalAiCorrect}/${totalTests} (${((totalAiCorrect / totalTests) * 100).toFixed(0)}%)
  Regex-Based: ${totalRegexCorrect}/${totalTests} (${((totalRegexCorrect / totalTests) * 100).toFixed(0)}%)

${BOLD}Quality Scoring Accuracy:${RESET}
  ${qualityCorrect}/${STUDENT_RESPONSES.length} responses correctly classified

${BOLD}Key Advantages of AI Approach:${RESET}
1. Understands semantic meaning, not just patterns
2. Adapts to different phrasings automatically
3. Type-aware analysis (knows what matters for each essay type)
4. Quality scoring with follow-up questions
5. Cost-effective (~$0.001-0.002 per analysis)

${BOLD}When to Use Each:${RESET}
- Quick Check (free): First pass to filter obvious cases
- AI Analysis: When quick check has low confidence
- Regex Fallback: If API unavailable
`);
    }

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    console.error(error);
    process.exit(1);
  }
}

main();
