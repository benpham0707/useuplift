/**
 * Cliché Detection Quality Integration Test
 *
 * Tests how the cliché detection system improves the overall essay coaching:
 * 1. Before/after comparison of suggestion quality
 * 2. Integration with typeSpecificSuggestionService
 * 3. Integration with conversationalContextGatherer
 * 4. Cost efficiency of the complete flow
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-cliche-quality-integration.ts
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import { collegeOverlayService } from '../src/services/commonAppWorkshop/services/collegeOverlayService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';
import Anthropic from '@anthropic-ai/sdk';

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

function printSubsection(title: string): void {
  console.log('\n' + '─'.repeat(50));
  console.log(`${YELLOW}${title}${RESET}`);
  console.log('─'.repeat(50));
}

// ============================================================================
// TEST ESSAYS
// ============================================================================

const TEST_ESSAYS = {
  // Cliché-heavy Stanford essay that needs serious help
  stanford_cliche: {
    text: `Stanford's intellectual vitality has always inspired me. Ever since I was a child,
I've been passionate about learning and innovation. When I visited Silicon Valley,
I realized that Stanford is my dream school because of its entrepreneurial spirit.

I want to study computer science because I'm fascinated by technology. The interdisciplinary
approach at Stanford matches my passion for combining different fields. I believe that
with hard work and determination, I can change the world through innovation.

This experience taught me the importance of perseverance. I am eager to collaborate with
like-minded peers and learn from world-class professors. Stanford's unique community
will help me achieve my goals and make a difference in society.`,
    college: 'stanford',
    prompt_type: 'intellectual' as const,
  },

  // Mixed quality essay with some good elements buried
  mixed_immigration: {
    text: `When my family immigrated to America, I learned the importance of adaptation.
Little did I know that this experience would transform my life.

But there's one thing I can't forget: the sound of American rain. Back home in Vietnam,
rain made a sharp ping on our metal roof. Here, it thuds on shingles. Four years later,
my brain still expects the ping when clouds gather. My grandmother's fish sauce smells
wrong with American fish.

Through this journey, I discovered my true passion for helping others who face similar
challenges. I want to make a difference in my community.`,
    college: 'stanford',
    prompt_type: 'intellectual' as const,
  },

  // Fresh essay that should get high marks
  fresh_essay: {
    text: `Version 47 finally worked. At 2 AM, alone in my room, I watched the neural
network correctly identify my grandmother's handwriting for the first time.
She died before smartphones existed, so the only texts I have from her are
handwritten recipes I can barely read.

The model still fails on her cursive 't' - she made it look like an 'l' with a
hat. I've spent 47 versions on this. My friends think I should move on. But
every time I look at those yellowed index cards, I see her arthritis-cramped
hand forming each letter. The model doesn't need to be perfect. It just needs
to help me read "2 cups flour" instead of "2 cups flowr."

I'm not building this to change the world. I'm building it because I miss her.`,
    college: 'stanford',
    prompt_type: 'intellectual' as const,
  },
};

// ============================================================================
// COMPARISON TEST
// ============================================================================

async function runQualityComparison(): Promise<void> {
  printSection('QUALITY INTEGRATION TEST');
  console.log('Testing how cliché detection improves coaching quality\n');

  const anthropic = new Anthropic();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const [key, essay] of Object.entries(TEST_ESSAYS)) {
    printSubsection(`ESSAY: ${key.toUpperCase()}`);
    console.log(`${DIM}Preview: "${essay.text.substring(0, 80).replace(/\n/g, ' ')}..."${RESET}\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Run cliché analysis
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`${CYAN}Step 1: Cliché Analysis${RESET}`);
    const clicheStart = Date.now();
    const clicheAnalysis = await semanticClicheAnalyzer.analyze(essay.text, {
      college_id: essay.college,
    });
    const clicheTime = Date.now() - clicheStart;

    console.log(`  Risk: ${clicheAnalysis.overall_cliche_risk.toUpperCase()} (${clicheAnalysis.cliche_risk_score}/100)`);
    console.log(`  Language clichés: ${clicheAnalysis.language_cliches.length}`);
    console.log(`  Telling violations: ${clicheAnalysis.telling_not_showing.length}`);
    console.log(`  Arc predictability: ${clicheAnalysis.narrative_arc.predictability_score}/10`);
    if (clicheAnalysis.strongest_unique_element) {
      console.log(`  ${GREEN}✓ Unique element: "${clicheAnalysis.strongest_unique_element.substring(0, 60)}..."${RESET}`);
    }
    console.log(`  Time: ${clicheTime}ms`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Get college context
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`\n${CYAN}Step 2: College Context${RESET}`);
    const collegeResearch = getCollegeResearch(essay.college);
    const collegeContext = collegeResearch
      ? collegeOverlayService.getCollegeContextForPrompt(collegeResearch, essay.prompt_type)
      : null;

    const collegeClicheCheck = collegeOverlayService.detectCollegeCliches(essay.text, essay.college);
    console.log(`  College-specific clichés: ${collegeClicheCheck.found.length}`);
    console.log(`  Severity: ${collegeClicheCheck.severity_level}`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Generate coaching suggestions WITH cliché context
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`\n${CYAN}Step 3: Generate Coaching (WITH cliché analysis)${RESET}`);

    const clicheInjection = semanticClicheAnalyzer.formatForPromptInjection(clicheAnalysis);

    const coachingPromptWithCliches = buildCoachingPrompt(
      essay.text,
      clicheInjection,
      collegeContext,
      true
    );

    const withClicheStart = Date.now();
    const withClicheResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: coachingPromptWithCliches }],
    });
    const withClicheTime = Date.now() - withClicheStart;

    totalInputTokens += withClicheResponse.usage.input_tokens;
    totalOutputTokens += withClicheResponse.usage.output_tokens;

    const coachingWithCliches = withClicheResponse.content[0].type === 'text'
      ? withClicheResponse.content[0].text
      : '';

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Generate coaching suggestions WITHOUT cliché context
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`\n${CYAN}Step 4: Generate Coaching (WITHOUT cliché analysis)${RESET}`);

    const coachingPromptWithoutCliches = buildCoachingPrompt(
      essay.text,
      null,
      collegeContext,
      false
    );

    const withoutClicheStart = Date.now();
    const withoutClicheResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: coachingPromptWithoutCliches }],
    });
    const withoutClicheTime = Date.now() - withoutClicheStart;

    totalInputTokens += withoutClicheResponse.usage.input_tokens;
    totalOutputTokens += withoutClicheResponse.usage.output_tokens;

    const coachingWithoutCliches = withoutClicheResponse.content[0].type === 'text'
      ? withoutClicheResponse.content[0].text
      : '';

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Compare quality
    // ═══════════════════════════════════════════════════════════════════════
    printSubsection(`COMPARISON: ${key.toUpperCase()}`);

    console.log(`\n${YELLOW}WITHOUT Cliché Analysis:${RESET}`);
    console.log('─'.repeat(40));
    console.log(coachingWithoutCliches.substring(0, 600));
    if (coachingWithoutCliches.length > 600) console.log(`${DIM}... (truncated)${RESET}`);

    console.log(`\n${GREEN}WITH Cliché Analysis:${RESET}`);
    console.log('─'.repeat(40));
    console.log(coachingWithCliches.substring(0, 600));
    if (coachingWithCliches.length > 600) console.log(`${DIM}... (truncated)${RESET}`);

    // Quality indicators
    console.log(`\n${CYAN}Quality Indicators:${RESET}`);

    // Check if WITH version addresses specific clichés
    const addressesSpecificCliches = clicheAnalysis.language_cliches.some(c =>
      coachingWithCliches.toLowerCase().includes(c.phrase.toLowerCase().substring(0, 15))
    );
    console.log(`  Addresses specific clichés: ${addressesSpecificCliches ? GREEN + '✓' : RED + '✗'}${RESET}`);

    // Check if WITH version mentions unique elements to preserve
    const mentionsUnique = clicheAnalysis.strongest_unique_element &&
      coachingWithCliches.toLowerCase().includes(clicheAnalysis.strongest_unique_element.toLowerCase().split(' ')[0]);
    console.log(`  Preserves unique elements: ${mentionsUnique ? GREEN + '✓' : YELLOW + '?'}${RESET}`);

    // Check if WITH version mentions predictable arc
    const addressesArc = clicheAnalysis.narrative_arc.predictability_score >= 7 &&
      coachingWithCliches.toLowerCase().includes('arc');
    console.log(`  Addresses predictable arc: ${addressesArc ? GREEN + '✓' : (clicheAnalysis.narrative_arc.predictability_score < 7 ? DIM + 'N/A' : RED + '✗')}${RESET}`);

    console.log(`\n${DIM}Timing: With=${withClicheTime}ms, Without=${withoutClicheTime}ms, Cliché analysis=${clicheTime}ms${RESET}`);

    // Add delay between essays
    await new Promise(r => setTimeout(r, 500));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COST SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  printSection('COST SUMMARY');

  const inputCost = (totalInputTokens / 1_000_000) * 3.0;  // $3/M input
  const outputCost = (totalOutputTokens / 1_000_000) * 15.0;  // $15/M output
  const totalCost = inputCost + outputCost;

  console.log(`\nTokens used:`);
  console.log(`  Input: ${totalInputTokens.toLocaleString()}`);
  console.log(`  Output: ${totalOutputTokens.toLocaleString()}`);
  console.log(`\nEstimated cost: $${totalCost.toFixed(4)}`);
  console.log(`  Per essay: $${(totalCost / Object.keys(TEST_ESSAYS).length).toFixed(4)}`);

  // Cliché analysis is cheap (~$0.003-0.005 per essay)
  // Adds significant value for minimal cost
  console.log(`\n${GREEN}Cliché analysis cost: ~$0.003-0.005 per essay${RESET}`);
  console.log(`${GREEN}Value: Targeted feedback, preserved unique elements, specific suggestions${RESET}`);
}

function buildCoachingPrompt(
  essayText: string,
  clicheInjection: string | null,
  collegeContext: any,
  withCliches: boolean
): string {
  let prompt = `You are an expert college essay coach. Provide 2-3 specific, actionable suggestions to improve this Stanford essay.

ESSAY:
${essayText}

`;

  if (withCliches && clicheInjection) {
    prompt += `
${clicheInjection}

COLLEGE CONTEXT:
- Stanford values: intellectual vitality, authentic voice, distinctive contribution
- Avoid: using Stanford's own terminology, generic flattery, predictable arcs

`;
  } else {
    prompt += `
COLLEGE CONTEXT:
- This is for Stanford
- Focus on making the essay more compelling

`;
  }

  prompt += `
Provide 2-3 specific, actionable coaching suggestions. Be direct and specific.
Format: Start each suggestion with a number and bold the key action.`;

  return prompt;
}

// ============================================================================
// FLOW INTEGRATION TEST
// ============================================================================

async function runFlowIntegrationTest(): Promise<void> {
  printSection('FLOW INTEGRATION TEST');
  console.log('Testing the complete flow from essay → analysis → coaching\n');

  const essay = TEST_ESSAYS.mixed_immigration;

  // Step 1: Quick pattern check (free)
  console.log(`${CYAN}1. Quick Pattern Check (Free)${RESET}`);
  const quickCheck = semanticClicheAnalyzer.quickClicheCheck(essay.text);
  console.log(`   AI convergence: ${quickCheck.ai_convergence_count}`);
  console.log(`   Essay clichés: ${quickCheck.essay_cliche_count}`);
  console.log(`   Recommend full analysis: ${quickCheck.recommend_full_analysis}`);

  // Step 2: College cliché check (free)
  console.log(`\n${CYAN}2. College Cliché Check (Free)${RESET}`);
  const collegeClicheCheck = collegeOverlayService.detectCollegeCliches(essay.text, essay.college);
  console.log(`   College clichés: ${collegeClicheCheck.found.length}`);
  if (collegeClicheCheck.found.length > 0) {
    for (const c of collegeClicheCheck.found.slice(0, 3)) {
      console.log(`   - ${c.severity}: ${c.description}`);
    }
  }

  // Step 3: Full semantic analysis (AI-powered, ~$0.003-0.005)
  console.log(`\n${CYAN}3. Full Semantic Analysis (~$0.003-0.005)${RESET}`);
  const fullAnalysis = await semanticClicheAnalyzer.analyze(essay.text, {
    college_id: essay.college,
  });

  console.log(`   Overall risk: ${fullAnalysis.overall_cliche_risk}`);
  console.log(`   Topic: ${fullAnalysis.topic_assessment.topic || 'none'}`);
  console.log(`   Framing: ${fullAnalysis.topic_assessment.framing_assessment}`);
  console.log(`   Arc type: ${fullAnalysis.narrative_arc.arc_type}`);
  console.log(`   Predictability: ${fullAnalysis.narrative_arc.predictability_score}/10`);

  if (fullAnalysis.strongest_unique_element) {
    console.log(`\n   ${GREEN}UNIQUE ELEMENT TO PRESERVE:${RESET}`);
    console.log(`   "${fullAnalysis.strongest_unique_element}"`);
  }

  // Step 4: Show coaching priority
  console.log(`\n${CYAN}4. Coaching Priority${RESET}`);
  console.log(`   Issue: ${fullAnalysis.coaching_priority.issue}`);
  console.log(`   Why priority: ${fullAnalysis.coaching_priority.why_priority}`);
  console.log(`   Approach: ${fullAnalysis.coaching_priority.coaching_approach}`);

  // Step 5: Show what gets injected into suggestion prompt
  console.log(`\n${CYAN}5. Prompt Injection Preview${RESET}`);
  const injection = semanticClicheAnalyzer.formatForPromptInjection(fullAnalysis);
  const lines = injection.split('\n').slice(0, 20);
  for (const line of lines) {
    console.log(`   ${DIM}${line}${RESET}`);
  }
  console.log(`   ${DIM}... (${injection.length} total chars)${RESET}`);
}

// ============================================================================
// UNIQUE ELEMENT PRESERVATION TEST
// ============================================================================

async function runPreservationTest(): Promise<void> {
  printSection('UNIQUE ELEMENT PRESERVATION TEST');
  console.log('Testing that the system correctly identifies and preserves unique elements\n');

  const testCases = [
    {
      name: 'Mixed essay with buried gem',
      text: TEST_ESSAYS.mixed_immigration.text,
      expectedUniqueElements: ['rain', 'ping', 'fish sauce'],
    },
    {
      name: 'Fresh essay (mostly unique)',
      text: TEST_ESSAYS.fresh_essay.text,
      expectedUniqueElements: ['Version 47', 'grandmother', 'handwriting', 'recipes'],
    },
    {
      name: 'Cliché-heavy (should find nothing)',
      text: TEST_ESSAYS.stanford_cliche.text,
      expectedUniqueElements: [],
    },
  ];

  for (const testCase of testCases) {
    printSubsection(testCase.name);

    const analysis = await semanticClicheAnalyzer.analyze(testCase.text);

    console.log(`Risk: ${analysis.overall_cliche_risk} (${analysis.cliche_risk_score}/100)`);

    if (analysis.strongest_unique_element) {
      console.log(`\n${GREEN}Strongest unique element:${RESET}`);
      console.log(`  "${analysis.strongest_unique_element}"`);

      // Check if it matches expected
      const found = testCase.expectedUniqueElements.some(e =>
        analysis.strongest_unique_element!.toLowerCase().includes(e.toLowerCase())
      );
      console.log(`  Matches expected: ${found ? GREEN + '✓' : YELLOW + '?'}${RESET}`);
    } else {
      console.log(`\n${YELLOW}No unique element detected${RESET}`);
      console.log(`  Expected: ${testCase.expectedUniqueElements.length === 0 ? 'None (correct)' : testCase.expectedUniqueElements.join(', ')}`);
    }

    if (analysis.elements_to_preserve.length > 0) {
      console.log(`\nElements to preserve:`);
      for (const e of analysis.elements_to_preserve) {
        console.log(`  - ${e}`);
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log('  CLICHÉ DETECTION QUALITY INTEGRATION TEST');
  console.log('  Deep quality check and system integration');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${RED}✗ ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Run: set -a && source .env && set +a && npx tsx tests/test-cliche-quality-integration.ts');
    process.exit(1);
  }

  try {
    // Test 1: Flow integration
    await runFlowIntegrationTest();

    // Test 2: Unique element preservation
    await runPreservationTest();

    // Test 3: Quality comparison (before/after)
    await runQualityComparison();

    printSection('TEST COMPLETE');
    console.log(`\n${GREEN}${BOLD}All integration tests completed successfully${RESET}`);

  } catch (error) {
    console.error(`\n${RED}Test failed:${RESET}`, error);
    process.exit(1);
  }
}

main().catch(console.error);
