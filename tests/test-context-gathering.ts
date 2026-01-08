/**
 * Test Context Gathering System
 *
 * Tests the synergistic relationship between the suggestion engine
 * and chat interface for gathering real student context.
 *
 * This test demonstrates:
 * 1. Detecting context gaps in performative essays
 * 2. Creating gathering requests for the chat interface
 * 3. Using enriched context to generate better suggestions
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-context-gathering.ts
 */

import { TypeSpecificSuggestionService, IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { ContextGapDetector, contextGapDetector } from '../src/services/commonAppWorkshop/services/contextGapDetector';
import { EnrichedStudentContext } from '../src/services/commonAppWorkshop/types/contextGathering';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * A performative essay with many context gaps
 * This essay CLAIMS things without SHOWING them
 */
const PERFORMATIVE_ESSAY = {
  type: 'why_us' as SupplementalType,
  essay: `When I discovered Dr. Fei-Fei Li's work on ImageNet and her focus on democratizing AI, I realized Stanford bridges technical innovation with ethical consideration. Her methodology blew my mind—not for a class, just because I wanted to understand vision systems better.

My experience building a computer vision app taught me that AI's power lies in human applications. I learned so much from this project and it changed my perspective on technology. The challenges I faced along the way were really difficult but I overcame them.

I want to join the Human-Centered AI Institute because I'm passionate about accessible technology. Stanford is where I want to contribute to making AI more human. The resources and opportunities here would be incredible for my growth.`,
  description: 'Full of performative authenticity - claims without evidence'
};

/**
 * Simulated issue from scoring
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
  surrounding_context: PERFORMATIVE_ESSAY.essay.substring(0, 500),
  relevant_college_values: [],
  relevant_quotes: []
};

/**
 * Simulated enriched context gathered from student conversation
 * This is what the chat interface would produce after asking questions
 */
const SIMULATED_GATHERED_CONTEXT: EnrichedStudentContext = {
  specific_moments: [
    {
      description: 'I was watching a YouTube video about self-driving cars at 11pm when I first saw ImageNet mentioned. I paused the video and spent the next 3 hours reading the original paper.',
      sensory_details: ['laptop glowing in dark room', 'cold coffee on desk', 'sound of my roommate snoring'],
      emotional_context: 'I felt this weird mix of confusion and excitement—I didn\'t understand half the math but I could see why it mattered',
      source_question_id: 'q_001'
    }
  ],
  authentic_insights: [
    {
      insight: 'I used to think AI was about making computers smarter. The paper made me realize it\'s really about making computers see the way humans do—with all our biases and shortcuts.',
      what_prompted_it: 'Reading about how ImageNet categories were chosen by human labelers, and how that affects what the AI learns',
      source_question_id: 'q_002'
    }
  ],
  struggles_and_failures: [
    {
      what_happened: 'My first attempt at building a classifier kept confusing cats with dogs. I spent two weeks tweaking parameters before I realized my dataset was too small—only 50 images per class.',
      what_they_learned: 'You can\'t just throw more epochs at bad data. I learned to check my dataset quality before anything else.',
      source_question_id: 'q_003'
    }
  ],
  unique_perspectives: [
    {
      angle: 'Most AI papers talk about accuracy percentages. But my grandmother can\'t use percentages—she needs to know if the app will definitely recognize her walker vs her dining chair.',
      why_they_see_it_this_way: 'I built the app specifically for her, so I had to think about real use cases, not benchmarks.',
      source_question_id: 'q_004'
    }
  ],
  key_people: [],
  quotable_phrases: [
    {
      phrase: 'accuracy is useless if my grandmother still trips',
      context: 'Explaining why they care about edge cases over aggregate metrics',
      source_question_id: 'q_005'
    }
  ]
};

// ============================================================================
// FORMATTING
// ============================================================================

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${title}${RESET}`);
  console.log('═'.repeat(70));
}

// ============================================================================
// TESTS
// ============================================================================

async function testContextGapDetection(): Promise<void> {
  printSection('TEST 1: CONTEXT GAP DETECTION');

  console.log(`\n${YELLOW}INPUT ESSAY:${RESET}`);
  console.log(PERFORMATIVE_ESSAY.essay.substring(0, 300) + '...');

  // Detect gaps
  const gaps = contextGapDetector.detectGaps(
    PERFORMATIVE_ESSAY.essay,
    PERFORMATIVE_ESSAY.type,
    [PERFORMATIVE_ISSUE]
  );

  console.log(`\n${GREEN}DETECTED ${gaps.length} CONTEXT GAPS:${RESET}`);

  for (const gap of gaps.slice(0, 5)) {
    console.log('\n─'.repeat(60));
    console.log(`${CYAN}Gap Type:${RESET} ${gap.gap_type}`);
    console.log(`${CYAN}Priority:${RESET} ${gap.priority}`);
    console.log(`${CYAN}Quote:${RESET} "${gap.location.quote}"`);
    console.log(`${CYAN}What's Missing:${RESET} ${gap.diagnosis.what_is_missing}`);
    console.log(`${CYAN}Would Fix:${RESET} ${gap.diagnosis.what_would_fix_it}`);
  }

  // Check if we should gather context
  const decision = contextGapDetector.shouldGatherContext(gaps, PERFORMATIVE_ESSAY.type);
  console.log(`\n${YELLOW}CONTEXT DECISION:${RESET}`);
  console.log(`  Should Gather: ${decision.should_gather ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
  console.log(`  Severity: ${decision.severity}`);
  console.log(`  Reason: ${decision.reason}`);
}

async function testGatheringRequestCreation(): Promise<void> {
  printSection('TEST 2: GATHERING REQUEST CREATION');

  const gaps = contextGapDetector.detectGaps(
    PERFORMATIVE_ESSAY.essay,
    PERFORMATIVE_ESSAY.type,
    [PERFORMATIVE_ISSUE]
  );

  const request = contextGapDetector.createGatheringRequest(
    PERFORMATIVE_ISSUE,
    gaps,
    3 // max 3 questions
  );

  console.log(`\n${GREEN}GATHERING REQUEST:${RESET}`);
  console.log(`  Request ID: ${request.request_id}`);
  console.log(`  Estimated Time: ${request.estimated_time_to_gather}`);
  console.log(`  Min Questions: ${request.minimum_questions_needed}`);
  console.log(`  Ideal Questions: ${request.ideal_questions_answered}`);

  console.log(`\n${YELLOW}TRIGGER:${RESET}`);
  console.log(`  Issue: ${request.trigger.issue_id}`);
  console.log(`  Quote: "${request.trigger.issue_quote.substring(0, 80)}..."`);

  console.log(`\n${CYAN}CONVERSATION GUIDANCE:${RESET}`);
  console.log(`  Opening: ${request.conversation_guidance.opening_frame}`);
  console.log(`  Tone: ${request.conversation_guidance.tone}`);
  console.log(`  If Struggles: ${request.conversation_guidance.if_student_struggles}`);

  console.log(`\n${GREEN}QUESTIONS TO ASK:${RESET}`);
  for (const q of request.questions) {
    console.log('\n─'.repeat(60));
    console.log(`${CYAN}Question:${RESET} ${q.question}`);
    console.log(`${DIM}Gap Type:${RESET} ${q.gap_type}`);
    console.log(`${DIM}If Shallow:${RESET} ${q.follow_up_if_shallow}`);
    console.log(`${DIM}Ideal Length:${RESET} ${q.ideal_length}`);
    console.log(`${RED}Weak Answer Example:${RESET} "${q.example_weak_answer}"`);
    console.log(`${GREEN}Strong Answer Example:${RESET} "${q.example_strong_answer}"`);
  }
}

async function testAnalyzeContextNeeds(): Promise<void> {
  printSection('TEST 3: ANALYZE CONTEXT NEEDS (with API call)');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return;
  }

  const service = new TypeSpecificSuggestionService();

  console.log('\n⏳ Analyzing context needs...\n');
  const startTime = Date.now();

  const result = await service.analyzeContextNeeds(
    PERFORMATIVE_ESSAY.essay,
    PERFORMATIVE_ESSAY.type,
    [PERFORMATIVE_ISSUE],
    { college: stanfordResearch }
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`${GREEN}RESULT:${RESET}`);
  console.log(`  Can Proceed: ${result.can_proceed ? GREEN + 'YES' : RED + 'NO'}${RESET}`);

  if (result.context_needs) {
    console.log(`\n${YELLOW}CONTEXT NEEDS:${RESET}`);
    console.log(`  Severity: ${result.context_needs.severity}`);
    console.log(`  Message to User: ${result.context_needs.message_to_user}`);
    console.log(`  Questions to Ask: ${result.context_needs.gathering_request.questions.length}`);
  }

  if (result.suggestions) {
    console.log(`\n${GREEN}SUGGESTIONS GENERATED (despite gaps):${RESET}`);
    console.log(`  Polished: ${result.suggestions.polished_original ? 'Yes' : 'No'}`);
    console.log(`  Voice: ${result.suggestions.voice_amplifier ? 'Yes' : 'No'}`);
  }

  if (result.invented_elements && result.invented_elements.length > 0) {
    console.log(`\n${YELLOW}ELEMENTS WE HAD TO INVENT:${RESET}`);
    for (const elem of result.invented_elements) {
      console.log(`  - ${elem.element}`);
      console.log(`    ${DIM}Would be better if: ${elem.would_be_better_if}${RESET}`);
    }
  }

  console.log(`\n${DIM}Time: ${elapsed}s${RESET}`);
}

async function testContextAwareSuggestions(): Promise<void> {
  printSection('TEST 4: CONTEXT-AWARE SUGGESTIONS (with enriched context)');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return;
  }

  const service = new TypeSpecificSuggestionService();

  console.log(`\n${CYAN}ENRICHED CONTEXT (simulated from student conversation):${RESET}`);
  console.log(`  Specific Moments: ${SIMULATED_GATHERED_CONTEXT.specific_moments.length}`);
  console.log(`  Authentic Insights: ${SIMULATED_GATHERED_CONTEXT.authentic_insights.length}`);
  console.log(`  Struggles/Failures: ${SIMULATED_GATHERED_CONTEXT.struggles_and_failures.length}`);
  console.log(`  Unique Perspectives: ${SIMULATED_GATHERED_CONTEXT.unique_perspectives.length}`);
  console.log(`  Quotable Phrases: ${SIMULATED_GATHERED_CONTEXT.quotable_phrases.length}`);

  console.log('\n⏳ Generating context-aware suggestions...\n');
  const startTime = Date.now();

  const result = await service.generateContextAwareSuggestions(
    PERFORMATIVE_ESSAY.essay,
    PERFORMATIVE_ESSAY.type,
    [PERFORMATIVE_ISSUE],
    SIMULATED_GATHERED_CONTEXT,
    { college: stanfordResearch }
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`${GREEN}CONTEXT-AWARE SUGGESTIONS:${RESET}`);

  for (const issue of result.issues) {
    console.log('\n' + '─'.repeat(60));
    console.log(`${CYAN}ISSUE:${RESET} ${issue.diagnosis_summary}`);

    if (issue.suggestions.polished_original) {
      console.log(`\n${GREEN}POLISHED ORIGINAL:${RESET}`);
      console.log(`  "${issue.suggestions.polished_original.text}"`);
      console.log(`\n  ${DIM}Rationale: ${issue.suggestions.polished_original.rationale}${RESET}`);
      console.log(`  ${DIM}Used Student Context: ${(issue.suggestions.polished_original as any).used_student_context ? 'Yes' : 'No'}${RESET}`);
    }

    if (issue.suggestions.voice_amplifier) {
      console.log(`\n${YELLOW}VOICE AMPLIFIER:${RESET}`);
      console.log(`  "${issue.suggestions.voice_amplifier.text}"`);
      console.log(`\n  ${DIM}Rationale: ${issue.suggestions.voice_amplifier.rationale}${RESET}`);
      console.log(`  ${DIM}Used Student Context: ${(issue.suggestions.voice_amplifier as any).used_student_context ? 'Yes' : 'No'}${RESET}`);
    }
  }

  console.log(`\n${GREEN}OVERALL STRATEGY:${RESET}`);
  console.log(`  ${result.overall_strategy.cohesive_approach}`);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${DIM}Time: ${elapsed}s | Cost: $${result.cost.toFixed(4)}${RESET}`);
}

async function testComparisonWithAndWithoutContext(): Promise<void> {
  printSection('TEST 5: COMPARISON - WITH vs WITHOUT CONTEXT');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}Skipping - ANTHROPIC_API_KEY not set${RESET}`);
    return;
  }

  const service = new TypeSpecificSuggestionService();

  // Generate WITHOUT context
  console.log('\n⏳ Generating suggestions WITHOUT gathered context...\n');
  const withoutStart = Date.now();
  const withoutContext = await service.generateSuggestions(
    PERFORMATIVE_ESSAY.essay,
    PERFORMATIVE_ESSAY.type,
    [PERFORMATIVE_ISSUE],
    { college: stanfordResearch }
  );
  const withoutTime = ((Date.now() - withoutStart) / 1000).toFixed(1);

  // Generate WITH context
  console.log('⏳ Generating suggestions WITH gathered context...\n');
  const withStart = Date.now();
  const withContext = await service.generateContextAwareSuggestions(
    PERFORMATIVE_ESSAY.essay,
    PERFORMATIVE_ESSAY.type,
    [PERFORMATIVE_ISSUE],
    SIMULATED_GATHERED_CONTEXT,
    { college: stanfordResearch }
  );
  const withTime = ((Date.now() - withStart) / 1000).toFixed(1);

  // Compare
  console.log(`${GREEN}COMPARISON:${RESET}`);
  console.log('\n' + '─'.repeat(70));
  console.log(`${RED}WITHOUT GATHERED CONTEXT:${RESET}`);
  console.log('─'.repeat(70));

  const withoutVoice = withoutContext.issues[0]?.suggestions.voice_amplifier?.text || 'N/A';
  console.log(`Voice Amplifier:\n  "${withoutVoice}"`);
  console.log(`\n${DIM}Time: ${withoutTime}s | Cost: $${withoutContext.cost.toFixed(4)}${RESET}`);

  console.log('\n' + '─'.repeat(70));
  console.log(`${GREEN}WITH GATHERED CONTEXT:${RESET}`);
  console.log('─'.repeat(70));

  const withVoice = withContext.issues[0]?.suggestions.voice_amplifier?.text || 'N/A';
  console.log(`Voice Amplifier:\n  "${withVoice}"`);
  console.log(`\n${DIM}Time: ${withTime}s | Cost: $${withContext.cost.toFixed(4)}${RESET}`);

  // Analyze the difference
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}ANALYSIS:${RESET}`);
  console.log('═'.repeat(70));

  // Check for student-specific details in WITH context
  const contextDetails = [
    'YouTube', '11pm', '3 hours', 'roommate',
    'grandmother', 'walker', 'dining chair',
    'cats with dogs', '50 images',
    'accuracy is useless'
  ];

  const foundInWith = contextDetails.filter(d =>
    withVoice.toLowerCase().includes(d.toLowerCase())
  );

  const foundInWithout = contextDetails.filter(d =>
    withoutVoice.toLowerCase().includes(d.toLowerCase())
  );

  console.log(`\nStudent-specific details used:`);
  console.log(`  Without Context: ${foundInWithout.length} / ${contextDetails.length}`);
  console.log(`  With Context: ${foundInWith.length} / ${contextDetails.length}`);

  if (foundInWith.length > 0) {
    console.log(`\n${GREEN}Details incorporated from student context:${RESET}`);
    for (const d of foundInWith) {
      console.log(`  ✓ "${d}"`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log('  CONTEXT GATHERING SYSTEM TEST');
  console.log('  Testing Suggestion Engine ↔ Chat Interface Synergy');
  console.log('█'.repeat(70));

  try {
    // Always run these (no API needed)
    await testContextGapDetection();
    await testGatheringRequestCreation();

    // These need API
    if (process.env.ANTHROPIC_API_KEY) {
      await testAnalyzeContextNeeds();
      await testContextAwareSuggestions();
      await testComparisonWithAndWithoutContext();
    } else {
      console.log(`\n${YELLOW}API tests skipped - set ANTHROPIC_API_KEY to run full tests${RESET}`);
    }

    console.log('\n' + '█'.repeat(70));
    console.log(`  ${GREEN}ALL TESTS COMPLETED${RESET}`);
    console.log('█'.repeat(70) + '\n');

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    process.exit(1);
  }
}

main();
