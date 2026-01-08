/**
 * Test Strategic Specificity System
 *
 * Tests the intelligent specificity placement and context quality scoring.
 *
 * Key concepts tested:
 * 1. Not all essays need the same level of specificity
 * 2. Some areas are HIGH IMPACT (worth investing words)
 * 3. Some areas are LOW IMPACT (keep lean)
 * 4. Context quality must be scored before acceptance
 * 5. Word count is precious - specifics should earn their place
 *
 * Run: npx tsx tests/test-strategic-specificity.ts
 */

import {
  StrategicSpecificityService,
  strategicSpecificityService
} from '../src/services/commonAppWorkshop/services/strategicSpecificityService';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';
import type { IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Essay with varying specificity needs
 * Some parts need more, some are already good, some should stay lean
 */
const TEST_ESSAYS: Record<string, { essay: string; type: SupplementalType; description: string }> = {
  why_us_needs_research: {
    type: 'why_us',
    essay: `When I discovered Professor Chen's work on neural networks, I realized Stanford was the place for me. Her research on AI ethics is really interesting and I want to learn more.

I look forward to joining the Human-Centered AI Institute and contributing to its mission. Beyond academics, I'm excited about Stanford's collaborative culture.

Stanford is where I can grow both intellectually and personally.`,
    description: 'Why_us essay needing research depth proof, not anchor moments'
  },

  challenge_needs_anchor: {
    type: 'challenge',
    essay: `I faced a really difficult challenge when my family moved to a new city. The experience taught me so much about resilience and adaptability.

At first, it was hard to adjust. But eventually, I overcame the challenges and became stronger. I learned that I can handle anything.

This experience profoundly impacted who I am today.`,
    description: 'Challenge essay desperately needing anchor moment and struggle details'
  },

  short_answer_keep_lean: {
    type: 'short_answer',
    essay: `I spend my Sundays hiking local trails with my dog. It's my way of disconnecting and finding clarity.`,
    description: 'Short answer - should recommend keeping lean, not adding specifics'
  },

  already_specific: {
    type: 'extracurricular',
    essay: `At 6am on Saturdays, I'm the first one at the robotics lab. My teammates trickle in around 8, coffee in hand. Last March, our bot's arm snapped mid-competition - I spent 47 minutes rewiring it while my teammate distracted the judges with questions about scoring.

We placed third. Not because of the arm fix, but because we'd practiced that exact failure six times in January when I kept breaking the servo.`,
    description: 'Already has great specificity - should not ask for more'
  }
};

/**
 * Sample context responses to score
 */
const CONTEXT_RESPONSES = {
  weak_generic: 'It was a really meaningful experience that taught me a lot about life.',
  weak_abstract: 'I learned the importance of perseverance and never giving up on your dreams.',
  moderate_some_detail: 'I stayed up late many nights working on the project. It was challenging but I got through it.',
  good_concrete: 'I was in my room at 11pm, laptop on my bed, when the error finally resolved. I texted my friend "IT WORKS" in all caps.',
  excellent_vivid: 'At 11:47pm, the compile finally succeeded. My roommate was snoring. I ate cold pizza to celebrate, crumbs on my keyboard.',
};

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
  console.log('\n' + '─'.repeat(60));
  console.log(`${YELLOW}${title}${RESET}`);
  console.log('─'.repeat(60));
}

// ============================================================================
// TESTS
// ============================================================================

function testSpecificityAnalysis(): void {
  printSection('TEST 1: SPECIFICITY ANALYSIS BY ESSAY TYPE');

  for (const [key, testCase] of Object.entries(TEST_ESSAYS)) {
    printSubsection(`${testCase.type.toUpperCase()}: ${testCase.description}`);

    console.log(`\n${DIM}Essay preview:${RESET}`);
    console.log(`"${testCase.essay.substring(0, 150)}..."`);

    const analysis = strategicSpecificityService.analyzeSpecificityNeeds(
      testCase.essay,
      testCase.type,
      []  // No issues for this test
    );

    console.log(`\n${GREEN}ASSESSMENT:${RESET}`);
    console.log(`  Has Anchor Moment: ${analysis.assessment.has_anchor_moment ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Has Unique Insight: ${analysis.assessment.has_unique_insight ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Has Proof of Depth: ${analysis.assessment.has_proof_of_depth ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Primary Gap: ${analysis.assessment.primary_gap === 'none' ?
      GREEN + 'None' : RED + analysis.assessment.primary_gap}${RESET}`);
    console.log(`  Words to Invest: ${analysis.assessment.words_to_invest}`);

    console.log(`\n${CYAN}HIGH IMPACT NEEDS (${analysis.high_impact_needs.length}):${RESET}`);
    for (const need of analysis.high_impact_needs.slice(0, 3)) {
      console.log(`  • ${need.impact_zone} (${need.reasoning.word_budget})`);
      console.log(`    ${DIM}${need.reasoning.why_high_impact}${RESET}`);
    }

    console.log(`\n${DIM}ALREADY SPECIFIC (${analysis.already_specific.length}):${RESET}`);
    for (const specific of analysis.already_specific.slice(0, 2)) {
      console.log(`  ✓ "${specific.substring(0, 60)}..."`);
    }

    console.log(`\n${DIM}KEEP LEAN (${analysis.keep_lean.length}):${RESET}`);
    for (const lean of analysis.keep_lean.slice(0, 2)) {
      console.log(`  → "${lean.substring(0, 60)}..."`);
    }
  }
}

function testContextQualityScoring(): void {
  printSection('TEST 2: CONTEXT QUALITY SCORING');

  console.log('\nScoring various response qualities for a concrete_scene request:\n');

  for (const [quality, response] of Object.entries(CONTEXT_RESPONSES)) {
    const score = strategicSpecificityService.scoreContextQuality(
      response,
      'concrete_scene',
      'anchor_moment'
    );

    const tierColor = {
      excellent: GREEN,
      good: CYAN,
      usable: YELLOW,
      weak: RED,
      unusable: RED
    }[score.quality_tier];

    console.log(`${BOLD}${quality.toUpperCase()}:${RESET}`);
    console.log(`  "${response.substring(0, 80)}${response.length > 80 ? '...' : ''}"`);
    console.log(`\n  ${tierColor}Overall: ${score.overall.toFixed(2)} (${score.quality_tier})${RESET}`);
    console.log(`  Concreteness: ${score.concreteness}/5 | Uniqueness: ${score.uniqueness}/5`);
    console.log(`  Efficiency: ${score.efficiency}/5 | Memorability: ${score.memorability}/5`);
    console.log(`  ${score.feedback.should_accept ? GREEN + '✓ Accept' : RED + '✗ Ask for more'}${RESET}`);

    if (!score.feedback.should_accept && score.feedback.follow_up_question) {
      console.log(`  ${YELLOW}Follow-up: "${score.feedback.follow_up_question}"${RESET}`);
    }

    if (score.feedback.improvements_needed.length > 0) {
      console.log(`  ${DIM}Improvements: ${score.feedback.improvements_needed.join(', ')}${RESET}`);
    }

    console.log();
  }
}

function testShouldGatherDecision(): void {
  printSection('TEST 3: SHOULD WE GATHER CONTEXT?');

  const testCases = [
    { key: 'why_us_needs_research', wordLimit: 250 },
    { key: 'challenge_needs_anchor', wordLimit: 250 },
    { key: 'short_answer_keep_lean', wordLimit: 50 },
    { key: 'already_specific', wordLimit: 350 },
  ];

  for (const testCase of testCases) {
    const essay = TEST_ESSAYS[testCase.key];
    const wordCount = essay.essay.split(/\s+/).length;

    const analysis = strategicSpecificityService.analyzeSpecificityNeeds(
      essay.essay,
      essay.type,
      []
    );

    const decision = strategicSpecificityService.shouldGatherContext(
      analysis,
      wordCount,
      testCase.wordLimit
    );

    const priorityColor = {
      high: RED,
      medium: YELLOW,
      low: CYAN,
      none: GREEN
    }[decision.priority];

    printSubsection(`${essay.type}: ${essay.description}`);
    console.log(`  Word Count: ${wordCount} / ${testCase.wordLimit}`);
    console.log(`  ${decision.should_gather ? RED + 'SHOULD GATHER' : GREEN + 'PROCEED'}${RESET}`);
    console.log(`  Priority: ${priorityColor}${decision.priority}${RESET}`);
    console.log(`  Max Questions: ${decision.max_questions}`);
    console.log(`  Reason: ${decision.reason}`);
  }
}

function testTypeSpecificPriorities(): void {
  printSection('TEST 4: TYPE-SPECIFIC PRIORITIES');

  const typesToTest: SupplementalType[] = ['why_us', 'challenge', 'intellectual', 'short_answer'];

  console.log('\nWhat matters most for each essay type:\n');

  for (const type of typesToTest) {
    // Create a minimal essay to trigger the analysis
    const minimalEssay = 'I realized something important when I discovered this. It taught me a lot.';

    const analysis = strategicSpecificityService.analyzeSpecificityNeeds(
      minimalEssay,
      type,
      []
    );

    console.log(`${BOLD}${type.toUpperCase()}:${RESET}`);

    // Show what we detected as needs for this type
    const needTypes = analysis.high_impact_needs.map(n => n.specificity_type);
    const uniqueTypes = [...new Set(needTypes)];

    if (uniqueTypes.length > 0) {
      console.log(`  Needs: ${uniqueTypes.join(', ')}`);
    } else {
      console.log(`  ${GREEN}Needs: None significant${RESET}`);
    }

    console.log(`  Primary Gap: ${analysis.assessment.primary_gap}`);
    console.log(`  Word Budget: +${analysis.assessment.words_to_invest} words`);
    console.log();
  }
}

function testQualityThresholdsByZone(): void {
  printSection('TEST 5: QUALITY THRESHOLDS BY IMPACT ZONE');

  const zones: Array<{ zone: 'anchor_moment' | 'unique_insight' | 'proof_of_depth' | 'supporting_detail'; description: string }> = [
    { zone: 'anchor_moment', description: 'THE vivid scene - highest bar' },
    { zone: 'unique_insight', description: 'Personal learning - high bar' },
    { zone: 'proof_of_depth', description: 'Research evidence - moderate bar' },
    { zone: 'supporting_detail', description: 'Texture - lower bar' },
  ];

  const moderateResponse = 'I worked on it for a while and figured it out. It was in the evening.';

  console.log(`\nTesting response: "${moderateResponse}"\n`);

  for (const { zone, description } of zones) {
    const score = strategicSpecificityService.scoreContextQuality(
      moderateResponse,
      'concrete_scene',
      zone
    );

    const emoji = score.feedback.should_accept ? '✓' : '✗';
    const color = score.feedback.should_accept ? GREEN : RED;

    console.log(`${BOLD}${zone}${RESET} - ${description}`);
    console.log(`  Score: ${score.overall.toFixed(2)} | ${color}${emoji} ${score.feedback.should_accept ? 'Accepted' : 'Need better'}${RESET}`);
  }

  console.log(`\n${DIM}Note: Same response accepted for lower-impact zones but rejected for anchor_moment${RESET}`);
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log('\n' + '█'.repeat(70));
  console.log('  STRATEGIC SPECIFICITY SYSTEM TEST');
  console.log('  Testing: Impact Zones, Quality Scoring, Smart Decisions');
  console.log('█'.repeat(70));

  try {
    testSpecificityAnalysis();
    testContextQualityScoring();
    testShouldGatherDecision();
    testTypeSpecificPriorities();
    testQualityThresholdsByZone();

    console.log('\n' + '█'.repeat(70));
    console.log(`  ${GREEN}ALL TESTS COMPLETED${RESET}`);
    console.log('█'.repeat(70));

    console.log(`
${CYAN}KEY TAKEAWAYS:${RESET}

1. ${BOLD}Not all specifics are equal${RESET}
   - anchor_moment: THE vivid scene (highest impact)
   - unique_insight: What YOU learned (high impact)
   - proof_of_depth: Research evidence (moderate)
   - supporting_detail: Nice texture (low impact)

2. ${BOLD}Essay types have different needs${RESET}
   - why_us: Research depth > anchor moments
   - challenge: Anchor moment + struggle detail
   - short_answer: Keep lean, efficiency over specificity

3. ${BOLD}Quality scoring before acceptance${RESET}
   - Concreteness: Does it have specifics?
   - Uniqueness: Is it personal to THIS student?
   - Usability: Can we weave it in?
   - Memorability: Will it stick?

4. ${BOLD}Word count is precious${RESET}
   - Invest heavily in high-impact zones
   - Keep transitional areas lean
   - Don't add specifics just for brownie points
`);

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    process.exit(1);
  }
}

main();
