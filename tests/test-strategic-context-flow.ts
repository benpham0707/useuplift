/**
 * Test Strategic Context Gathering Flow
 *
 * Tests the complete synergistic flow:
 * 1. Suggestion engine detects context gaps
 * 2. Strategic specificity determines WHERE to invest words
 * 3. Context quality is validated before acceptance
 * 4. Enriched context is used for better suggestions
 *
 * Run: npx tsx tests/test-strategic-context-flow.ts
 */

import { strategicContextGapDetector } from '../src/services/commonAppWorkshop/services/contextGapDetector';
import { strategicSpecificityService } from '../src/services/commonAppWorkshop/services/strategicSpecificityService';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';
import type { IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Performative essay that needs context gathering
 */
const PERFORMATIVE_WHY_US = {
  type: 'why_us' as SupplementalType,
  essay: `When I discovered Dr. Fei-Fei Li's work on ImageNet and her focus on democratizing AI, I realized Stanford bridges technical innovation with ethical consideration. Her methodology blew my mind—not for a class, just because I wanted to understand vision systems better.

My experience building a computer vision app taught me that AI's power lies in human applications. I learned so much from this project and it changed my perspective on technology.

I want to join the Human-Centered AI Institute because I'm passionate about accessible technology. Stanford is where I want to contribute to making AI more human.`,
  wordLimit: 250
};

/**
 * Already-specific essay that should NOT trigger context gathering
 */
const SPECIFIC_EXTRACURRICULAR = {
  type: 'extracurricular' as SupplementalType,
  essay: `At 6am on Saturdays, I'm the first one at the robotics lab. My teammates trickle in around 8, coffee in hand. Last March, our bot's arm snapped mid-competition—I spent 47 minutes rewiring it while my teammate distracted the judges with questions about scoring.

We placed third. Not because of the arm fix, but because we'd practiced that exact failure six times in January when I kept breaking the servo.`,
  wordLimit: 350
};

/**
 * Mock issue from scoring
 */
const PERFORMATIVE_ISSUE: IssueContext = {
  issue_id: 'PERFORMATIVE_PASSION',
  quote: 'Her methodology blew my mind—not for a class, just because I wanted to understand vision systems better.',
  location: 'Paragraph 1',
  diagnosis: {
    problem: 'Claims discovery/passion without demonstrating specific insight or understanding',
    symptom_type: 'performative_authenticity',
    affected_dimensions: ['research_depth', 'authenticity_voice'],
    score_impact: -3
  },
  surrounding_context: PERFORMATIVE_WHY_US.essay.substring(0, 500),
  relevant_college_values: [],
  relevant_quotes: []
};

/**
 * Sample student responses for quality scoring
 */
const STUDENT_RESPONSES = {
  weak: 'I was really interested in her work because it seemed important.',
  medium: 'I was at my desk when I read about ImageNet. It was interesting how she gathered so much data.',
  strong: 'At 2am in my dorm, I was debugging my image classifier when I realized my model kept confusing cats with dogs. Googling the error led me to the ImageNet paper—and I read until the sun came up.',
  excellent: 'I was sitting on my bedroom floor at 11pm, laptop on a textbook, when my classifier finally stopped confusing my grandmother\'s walker with a dining chair. That\'s when I understood why Dr. Li cares about edge cases—accuracy means nothing if it fails the people who need it most.'
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

function testStrategicDecisionMaking(): void {
  printSection('TEST 1: STRATEGIC DECISION MAKING');

  console.log(`\n${BOLD}Testing Performative Why_Us Essay:${RESET}`);
  console.log(`${DIM}(Should trigger context gathering for research depth)${RESET}\n`);

  const decision = strategicContextGapDetector.makeStrategicDecision(
    PERFORMATIVE_WHY_US.essay,
    PERFORMATIVE_WHY_US.type,
    [PERFORMATIVE_ISSUE],
    PERFORMATIVE_WHY_US.wordLimit
  );

  console.log(`${CYAN}DECISION:${RESET}`);
  console.log(`  Should Gather: ${decision.should_gather ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
  console.log(`  Priority: ${decision.priority}`);
  console.log(`  Word Budget: +${decision.word_budget} words`);
  console.log(`  Max Questions: ${decision.max_questions}`);
  console.log(`  Reason: ${decision.reason}`);

  console.log(`\n${CYAN}HIGH IMPACT ZONES (where to invest):${RESET}`);
  for (const zone of decision.high_impact_zones) {
    console.log(`  • ${zone.zone} → ${zone.specificity_type}`);
    console.log(`    ${DIM}Focus: ${zone.question_focus}${RESET}`);
  }

  console.log(`\n${CYAN}SPECIFICITY ASSESSMENT:${RESET}`);
  const assess = decision.specificity_analysis.assessment;
  console.log(`  Has Anchor Moment: ${assess.has_anchor_moment ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
  console.log(`  Has Unique Insight: ${assess.has_unique_insight ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
  console.log(`  Has Proof of Depth: ${assess.has_proof_of_depth ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
  console.log(`  Primary Gap: ${assess.primary_gap}`);

  // Now test the already-specific essay
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`\n${BOLD}Testing Already-Specific Extracurricular Essay:${RESET}`);
  console.log(`${DIM}(Should NOT trigger context gathering)${RESET}\n`);

  const specificDecision = strategicContextGapDetector.makeStrategicDecision(
    SPECIFIC_EXTRACURRICULAR.essay,
    SPECIFIC_EXTRACURRICULAR.type,
    [],
    SPECIFIC_EXTRACURRICULAR.wordLimit
  );

  console.log(`${CYAN}DECISION:${RESET}`);
  console.log(`  Should Gather: ${specificDecision.should_gather ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
  console.log(`  Priority: ${specificDecision.priority}`);
  console.log(`  Reason: ${specificDecision.reason}`);

  // Verify already_specific detected the good parts
  console.log(`\n${GREEN}ALREADY SPECIFIC (${specificDecision.specificity_analysis.already_specific.length} passages):${RESET}`);
  for (const specific of specificDecision.specificity_analysis.already_specific.slice(0, 3)) {
    console.log(`  ✓ "${specific.substring(0, 60)}..."`);
  }
}

function testContextQualityValidation(): void {
  printSection('TEST 2: CONTEXT QUALITY VALIDATION');

  console.log(`\nValidating student responses for anchor_moment / concrete_scene:\n`);

  for (const [quality, response] of Object.entries(STUDENT_RESPONSES)) {
    const validation = strategicContextGapDetector.validateGatheredContext(
      response,
      'concrete_scene',
      'anchor_moment'
    );

    const actionColor = {
      use: GREEN,
      follow_up: YELLOW,
      skip: RED
    }[validation.action];

    console.log(`${BOLD}${quality.toUpperCase()}:${RESET}`);
    console.log(`  "${response.substring(0, 80)}${response.length > 80 ? '...' : ''}"`);
    console.log(`\n  Score: ${validation.quality.overall.toFixed(2)} (${validation.quality.quality_tier})`);
    console.log(`  Action: ${actionColor}${validation.action.toUpperCase()}${RESET}`);

    if (validation.action === 'follow_up' && validation.follow_up_question) {
      console.log(`  Follow-up: "${validation.follow_up_question}"`);
    }

    if (validation.quality.feedback.improvements_needed.length > 0) {
      console.log(`  ${DIM}Needs: ${validation.quality.feedback.improvements_needed.join(', ')}${RESET}`);
    }

    console.log();
  }
}

function testStrategicGatheringRequest(): void {
  printSection('TEST 3: STRATEGIC GATHERING REQUEST');

  console.log(`\nCreating a strategic gathering request for performative why_us essay:\n`);

  const request = strategicContextGapDetector.createStrategicGatheringRequest(
    PERFORMATIVE_ISSUE,
    PERFORMATIVE_WHY_US.essay,
    PERFORMATIVE_WHY_US.type,
    PERFORMATIVE_WHY_US.wordLimit
  );

  console.log(`${GREEN}GATHERING REQUEST:${RESET}`);
  console.log(`  Questions: ${request.questions.length}`);
  console.log(`  Estimated Time: ${request.estimated_time_to_gather}`);
  console.log(`  Opening: "${request.conversation_guidance.opening_frame}"`);

  console.log(`\n${CYAN}QUESTIONS (prioritized by strategic impact):${RESET}`);
  for (const q of request.questions) {
    console.log(`\n  ${BOLD}[${q.gap_type}]${RESET}`);
    console.log(`  Q: ${q.question}`);
    console.log(`  ${DIM}If shallow: ${q.follow_up_if_shallow}${RESET}`);
    console.log(`  ${RED}Weak: "${q.example_weak_answer}"${RESET}`);
    console.log(`  ${GREEN}Strong: "${q.example_strong_answer}"${RESET}`);
  }
}

function testTypeSpecificBehavior(): void {
  printSection('TEST 4: TYPE-SPECIFIC BEHAVIOR');

  const testCases: Array<{
    type: SupplementalType;
    description: string;
    essay: string;
    wordLimit: number;
  }> = [
    {
      type: 'why_us',
      description: 'Research depth matters most',
      essay: 'I want to attend Stanford because Professor Chen\'s research is interesting.',
      wordLimit: 250
    },
    {
      type: 'challenge',
      description: 'Anchor moment + struggle details matter most',
      essay: 'I faced a challenge and learned a lot from overcoming it.',
      wordLimit: 250
    },
    {
      type: 'short_answer',
      description: 'Efficiency over specificity',
      essay: 'I love hiking with my dog on weekends.',
      wordLimit: 50
    },
    {
      type: 'intellectual',
      description: 'Unique insight matters most',
      essay: 'I find quantum physics fascinating because it challenges my assumptions.',
      wordLimit: 200
    }
  ];

  for (const testCase of testCases) {
    printSubsection(`${testCase.type.toUpperCase()}: ${testCase.description}`);

    const decision = strategicContextGapDetector.makeStrategicDecision(
      testCase.essay,
      testCase.type,
      [],
      testCase.wordLimit
    );

    console.log(`  Should Gather: ${decision.should_gather ? YELLOW + 'YES' : GREEN + 'NO'}${RESET}`);
    console.log(`  Priority: ${decision.priority}`);
    console.log(`  Primary Gap: ${decision.specificity_analysis.assessment.primary_gap}`);
    console.log(`  Word Budget: +${decision.word_budget}`);

    if (decision.high_impact_zones.length > 0) {
      console.log(`  Focus on: ${decision.high_impact_zones.map(z => z.specificity_type).join(', ')}`);
    }
  }
}

function testContextAcceptanceThresholds(): void {
  printSection('TEST 5: CONTEXT ACCEPTANCE THRESHOLDS');

  const moderateResponse = 'I stayed up late working on the project and eventually figured it out.';

  console.log(`\nTesting same response against different impact zones:\n`);
  console.log(`Response: "${moderateResponse}"\n`);

  const zones: Array<{
    zone: 'anchor_moment' | 'unique_insight' | 'proof_of_depth' | 'supporting_detail';
    threshold: string;
  }> = [
    { zone: 'anchor_moment', threshold: '4.0 (highest bar)' },
    { zone: 'unique_insight', threshold: '3.5' },
    { zone: 'proof_of_depth', threshold: '3.0' },
    { zone: 'supporting_detail', threshold: '2.5 (lowest bar)' }
  ];

  for (const { zone, threshold } of zones) {
    const validation = strategicContextGapDetector.validateGatheredContext(
      moderateResponse,
      'concrete_scene',
      zone
    );

    const actionColor = {
      use: GREEN,
      follow_up: YELLOW,
      skip: RED
    }[validation.action];

    console.log(`${BOLD}${zone}${RESET} (threshold: ${threshold})`);
    console.log(`  Score: ${validation.quality.overall.toFixed(2)} → ${actionColor}${validation.action}${RESET}`);
  }

  console.log(`\n${DIM}Note: Same response passes for supporting_detail but requires follow-up for anchor_moment${RESET}`);
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log('\n' + '█'.repeat(70));
  console.log('  STRATEGIC CONTEXT GATHERING FLOW TEST');
  console.log('  Testing: Decision Making → Quality Validation → Strategic Requests');
  console.log('█'.repeat(70));

  try {
    testStrategicDecisionMaking();
    testContextQualityValidation();
    testStrategicGatheringRequest();
    testTypeSpecificBehavior();
    testContextAcceptanceThresholds();

    console.log('\n' + '█'.repeat(70));
    console.log(`  ${GREEN}ALL TESTS COMPLETED${RESET}`);
    console.log('█'.repeat(70));

    console.log(`
${CYAN}STRATEGIC CONTEXT SYSTEM SUMMARY:${RESET}

${BOLD}1. Strategic Decision Making:${RESET}
   - Analyzes WHERE specificity has highest impact for THIS essay type
   - Combines pattern detection with strategic priorities
   - Returns word budget and max questions

${BOLD}2. Context Quality Validation:${RESET}
   - Scores student responses on 5 dimensions
   - Different thresholds for different impact zones
   - Returns use/follow_up/skip action with follow-up question

${BOLD}3. Strategic Gathering Requests:${RESET}
   - Prioritizes questions by impact zone
   - Limits questions based on word budget
   - Provides example weak/strong answers

${BOLD}4. Type-Specific Behavior:${RESET}
   - why_us: Research depth > anchor moments
   - challenge: Anchor moment + struggle details
   - short_answer: Skip gathering (efficiency over specificity)
   - intellectual: Unique insight + depth

${BOLD}5. Acceptance Thresholds:${RESET}
   - anchor_moment: 4.0 (highest bar)
   - unique_insight: 3.5
   - proof_of_depth: 3.0
   - supporting_detail: 2.5 (lowest bar)
`);

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    process.exit(1);
  }
}

main();
