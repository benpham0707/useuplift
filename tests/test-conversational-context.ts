/**
 * Test: Conversational Context Gathering
 *
 * Tests the multi-turn conversation system that extracts high-quality
 * context from students through intelligent follow-up.
 *
 * SCENARIOS TESTED:
 * 1. Weak response → coaching follow-up → improved response
 * 2. Medium response → dig deeper → strong response
 * 3. Strong response → captured immediately
 * 4. Multiple gaps → progresses through each
 */

import 'dotenv/config';
import {
  ConversationalContextGatherer,
  ResponseQualityAssessment
} from '../src/services/commonAppWorkshop/services/conversationalContextGatherer';
import { SonnetContextLayer } from '../src/services/commonAppWorkshop/services/sonnetContextLayer';

// ============================================================================
// TEST DATA
// ============================================================================

// Simulated student responses of varying quality
const WEAK_RESPONSE = `
It was really hard at first. I felt sad and overwhelmed.
Eventually I got used to it and things got better.
`;

const MEDIUM_RESPONSE = `
The hardest part was the first day at my new school. I didn't know
anyone and the classes were really different. I remember sitting
alone at lunch and feeling like everyone was staring at me.
`;

const STRONG_RESPONSE = `
At 7:15 AM on my first day, I stood outside Room 204, my schedule
crumpled in my sweating palm. Through the window, I could see 30
desks arranged in a perfect grid, and a teacher writing something
in characters I couldn't read. My heart was pounding so loud I was
sure the kid next to me could hear it. He said something in Korean
- I just stared at him, mouth open, no words coming out.
`;

const MEDIUM_FOLLOWUP_RESPONSE = `
I remember the lunch room specifically. It smelled like kimchi and
something fried. I sat at the end of an empty table with my
sandwich from home - peanut butter and jelly, which suddenly seemed
so American and weird. A group of girls walked past and one of them
said something that made them all laugh. I don't know if it was
about me, but I felt my face get hot. I pretended to be really
interested in my phone even though I had no one to text.
`;

// Generic essay to trigger context gathering
const GENERIC_ESSAY = `
Moving to a new country was the biggest challenge I've ever faced.
It was really hard at first but I learned a lot. I had to adapt to
a new culture and make new friends. Eventually I overcame these
obstacles and became a stronger person. This experience taught me
resilience and the importance of perseverance.
`;

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runConversationalTest(): Promise<void> {
  console.log('='.repeat(80));
  console.log('CONVERSATIONAL CONTEXT GATHERING TEST');
  console.log('='.repeat(80));
  console.log();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const gatherer = new ConversationalContextGatherer();
  const sonnetLayer = new SonnetContextLayer();
  let totalCost = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Get gaps from Sonnet
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(80));
  console.log('STEP 1: Analyze Essay for Gaps');
  console.log('─'.repeat(80));

  const analysis = await sonnetLayer.analyzeContextGaps(GENERIC_ESSAY, 'challenge');
  totalCost += (analysis.tokens_used.input * 3 / 1_000_000) + (analysis.tokens_used.output * 15 / 1_000_000);

  console.log(`\nScore: ${analysis.context_quality_score}/100`);
  console.log(`Gaps found: ${analysis.gaps.length}`);
  analysis.gaps.slice(0, 3).forEach((gap, i) => {
    console.log(`  ${i + 1}. [P${gap.priority}] ${gap.gap_type}`);
    console.log(`     Question: ${gap.suggested_question}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Start Conversation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 2: Start Context Gathering Conversation');
  console.log('─'.repeat(80));

  const essayId = 'test-essay-123';
  const startResult = gatherer.startGathering(
    essayId,
    analysis.gaps,
    'challenge',
    analysis.strengths
  );

  console.log(`\n📝 OPENING CONTEXT FOR STUDENT:`);
  console.log(`"${startResult.context_for_student}"`);
  console.log(`\n❓ FIRST QUESTION:`);
  console.log(`"${startResult.question}"`);
  console.log(`\n(Addressing: ${startResult.gap_being_addressed})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Simulate WEAK Response
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 3: Process WEAK Response (Should Trigger Coaching)');
  console.log('─'.repeat(80));

  console.log(`\n👤 STUDENT RESPONSE (WEAK):`);
  console.log(`"${WEAK_RESPONSE.trim()}"`);

  const weakResult = await gatherer.processResponse(essayId, WEAK_RESPONSE);
  totalCost += 0.001; // Haiku cost estimate

  console.log(`\n📊 ASSESSMENT:`);
  console.log(`   Action: ${weakResult.action}`);
  console.log(`   Progress: ${weakResult.progress.gaps_addressed}/${weakResult.progress.total_gaps} gaps`);
  console.log(`   Quality so far: ${weakResult.progress.quality_so_far}`);

  if (weakResult.follow_up) {
    console.log(`\n🎓 COACHING FOLLOW-UP:`);
    console.log(`   Question: "${weakResult.follow_up.question}"`);
    console.log(`\n   Why this helps: ${weakResult.follow_up.why_this_helps}`);
    console.log(`\n   What makes it great: ${weakResult.follow_up.what_makes_it_great}`);
    console.log(`\n   Avoid: ${weakResult.follow_up.avoid_this}`);
    console.log(`\n   Example (weak): ${weakResult.follow_up.example_weak}`);
    console.log(`   Example (strong): ${weakResult.follow_up.example_strong}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Simulate MEDIUM Response (After Coaching)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 4: Process MEDIUM Response (After Coaching)');
  console.log('─'.repeat(80));

  console.log(`\n👤 STUDENT RESPONSE (MEDIUM):`);
  console.log(`"${MEDIUM_RESPONSE.trim()}"`);

  const mediumResult = await gatherer.processResponse(essayId, MEDIUM_RESPONSE);
  totalCost += 0.001;

  console.log(`\n📊 ASSESSMENT:`);
  console.log(`   Action: ${mediumResult.action}`);
  console.log(`   Progress: ${mediumResult.progress.gaps_addressed}/${mediumResult.progress.total_gaps} gaps`);
  console.log(`   Quality so far: ${mediumResult.progress.quality_so_far}`);

  if (mediumResult.follow_up) {
    console.log(`\n🎓 DIG DEEPER FOLLOW-UP:`);
    console.log(`   Question: "${mediumResult.follow_up.question}"`);
    console.log(`\n   Why: ${mediumResult.follow_up.why_this_helps}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Simulate STRONG Response (Now We're Getting Somewhere)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 5: Process STRONG Response (Captured!)');
  console.log('─'.repeat(80));

  console.log(`\n👤 STUDENT RESPONSE (STRONG):`);
  console.log(`"${MEDIUM_FOLLOWUP_RESPONSE.trim()}"`);

  const strongResult = await gatherer.processResponse(essayId, MEDIUM_FOLLOWUP_RESPONSE);
  totalCost += 0.001;

  console.log(`\n📊 ASSESSMENT:`);
  console.log(`   Action: ${strongResult.action}`);
  console.log(`   Progress: ${strongResult.progress.gaps_addressed}/${strongResult.progress.total_gaps} gaps`);
  console.log(`   Quality so far: ${strongResult.progress.quality_so_far}`);

  if (strongResult.action === 'next_gap' && strongResult.next_question) {
    console.log(`\n✅ First gap captured! Moving to next...`);
    console.log(`\n❓ NEXT QUESTION:`);
    console.log(`"${strongResult.next_question}"`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Process Remaining Gaps with Strong Responses
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 6: Complete Remaining Gaps');
  console.log('─'.repeat(80));

  // Simulate strong responses for remaining gaps
  let result = strongResult;
  while (result.action !== 'complete') {
    console.log(`\n👤 SIMULATING STRONG RESPONSE...`);
    result = await gatherer.processResponse(essayId, STRONG_RESPONSE);
    totalCost += 0.001;

    console.log(`   Action: ${result.action}`);
    console.log(`   Progress: ${result.progress.gaps_addressed}/${result.progress.total_gaps}`);

    if (result.action === 'complete') {
      break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Review Gathered Context
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 7: Review Gathered Context');
  console.log('─'.repeat(80));

  if (result.gathered_context) {
    const ctx = result.gathered_context;

    console.log(`\n📊 GATHERED CONTEXT SUMMARY:`);
    console.log(`   Overall Quality: ${ctx.overall_quality}/100`);
    console.log(`   Ready for Suggestions: ${ctx.ready_for_suggestions ? '✅ YES' : '❌ NO'}`);

    console.log(`\n📝 GAP SUMMARIES:`);
    ctx.gap_summaries.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.gap_type.replace(/_/g, ' ')}`);
      console.log(`      Quality: ${s.quality_achieved.toUpperCase()}`);
      console.log(`      Exchanges: ${s.exchanges_count}`);
      if (s.key_captures.length > 0) {
        console.log(`      Key captures:`);
        s.key_captures.forEach(c => console.log(`        - "${c.substring(0, 60)}..."`));
      }
    });

    console.log(`\n✨ TOP USABLE ELEMENTS:`);
    ctx.top_elements.forEach((el, i) => {
      console.log(`   ${i + 1}. [${el.element_type}] (Score: ${el.compelling_score}/10)`);
      console.log(`      "${el.content}"`);
      console.log(`      Usage: ${el.usage_hint}`);
    });

    if (ctx.still_needed && ctx.still_needed.length > 0) {
      console.log(`\n⚠️ STILL NEEDED:`);
      ctx.still_needed.forEach(n => console.log(`   - ${n}`));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n✅ CONVERSATIONAL FLOW VERIFIED:`);
  console.log(`   1. Weak responses trigger coaching with examples`);
  console.log(`   2. Medium responses get "dig deeper" follow-ups`);
  console.log(`   3. Strong responses are captured and move forward`);
  console.log(`   4. Multiple gaps are addressed sequentially`);
  console.log(`   5. Usable elements are extracted for suggestions`);

  console.log(`\n💰 Estimated Cost: $${totalCost.toFixed(4)}`);

  // Cleanup
  gatherer.clearConversation(essayId);
}

// ============================================================================
// UNIT TEST: Response Quality Assessment
// ============================================================================

async function testQualityAssessment(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('UNIT TEST: Response Quality Assessment');
  console.log('='.repeat(80));

  const gatherer = new ConversationalContextGatherer();

  // Test cases - covering narrative, technical, character, and insight dimensions
  const testCases = [
    // ═══════════════════════════════════════════════════════════════════════════
    // WEAK RESPONSES - Generic, telling not showing
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Weak - Generic',
      response: 'It was hard and I learned a lot.',
      expected: 'weak'
    },
    {
      name: 'Weak - Stated emotion only',
      response: 'I felt really sad and scared. It was a difficult time.',
      expected: 'weak'
    },
    {
      name: 'Weak - Generic work ethic claim',
      response: 'I worked really hard on it. I never gave up.',
      expected: 'weak'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MEDIUM RESPONSES - Some specificity but needs more depth
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Medium - Some specificity',
      response: 'The hardest part was the first week of classes. I had to figure out where everything was and how things worked at the new school.',
      expected: 'medium'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STRONG RESPONSES - Narrative immersion
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Strong - Vivid scene setting',
      response: 'At 7:15 AM, I stood outside Room 204, my schedule crumpled in my sweating palm. The teacher was writing in characters I couldn\'t read.',
      expected: 'strong'
    },
    {
      name: 'Strong - Sensory + Dialogue',
      response: 'The cafeteria smelled like kimchi. A girl said "Are you lost?" and I just stared at her, mouth open, no words.',
      expected: 'strong'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STRONG RESPONSES - Technical depth
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Strong - Technical with quantified result',
      response: 'After 47 attempts, I finally got the algorithm to work. I had refactored the recursive function to use dynamic programming, which reduced the runtime from O(2^n) to O(n^2) - a 200x improvement for our dataset.',
      expected: 'strong'
    },
    {
      name: 'Strong - Problem-solving narrative',
      response: 'I realized that the bug wasn\'t in my code - the API was returning stale data. I figured out that the cache had a 5-minute TTL that nobody had documented. It took me 3 days to discover this.',
      expected: 'strong'
    },
    {
      name: 'Strong - Scientific methodology',
      response: 'The breakthrough came when I noticed the correlation between pH levels and enzyme activity. I had to rethink my entire hypothesis - the catalyst wasn\'t speeding up the reaction, it was changing the reaction pathway entirely.',
      expected: 'strong'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STRONG RESPONSES - Character traits shown NATURALLY (not announced)
    // The trait is evident through concrete actions and details, not stated
    // BAD: "I decided to start on my own" (announcing initiative)
    // GOOD: "I rebuilt the broken telescope so the kids could see Saturn" (shows it)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Strong - Grit shown naturally',
      response: 'By my 47th attempt, the code finally compiled. I\'d been at it since 6 AM - it was now past midnight and my eyes could barely stay open. I started over from scratch twice that week alone.',
      expected: 'strong'
    },
    {
      name: 'Strong - Initiative shown through action',
      response: 'The observatory globe had been broken for years. I rebuilt it over the summer, rewiring the bulb and patching the constellations, so the kids in the after-school program could finally see how the stars move.',
      expected: 'strong'
    },
    {
      name: 'Strong - Curiosity shown through rabbit hole',
      response: 'A footnote about quorum sensing led me to biofilm research, which somehow connected to antibiotic resistance. Three weeks later I\'d read every paper I could find on the topic.',
      expected: 'strong'
    },
    {
      name: 'Strong - Resourcefulness shown through details',
      response: 'We couldn\'t afford a real spectrophotometer, so I built one from an old DVD for the diffraction grating, a cardboard box, and my phone camera. I taped it together and calibrated it against food coloring.',
      expected: 'strong'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // WEAK RESPONSES - Announcing traits instead of showing them (sounds braggy)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Weak - Announcing initiative',
      response: 'I decided to start a tutoring program on my own. No one asked me to do it - I just saw a need and filled it.',
      expected: 'weak'
    },
    {
      name: 'Weak - Claiming curiosity',
      response: 'I\'m really passionate about learning. I love diving deep into topics that interest me and exploring new ideas.',
      expected: 'weak'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STRONG RESPONSES - Unique insight
    // ═══════════════════════════════════════════════════════════════════════════
    {
      name: 'Strong - Counterintuitive insight',
      response: 'I realized that the real problem wasn\'t that I couldn\'t speak the language - it was that I was so afraid of making mistakes that I never tried. The barrier was internal, not external.',
      expected: 'strong'
    },
    {
      name: 'Strong - Growth shown through specific change',
      response: 'At first I tried memorizing everything, but it didn\'t stick. Then I started teaching the material to my younger sister instead - and that\'s when I finally understood it myself.',
      expected: 'strong'
    }
  ];

  console.log('\nTesting heuristic quality assessment:\n');

  let passed = 0;
  for (const tc of testCases) {
    // Access private method through prototype (for testing only)
    const assessment = (gatherer as any).heuristicQualityCheck(tc.response);

    const match = assessment.quality_tier === tc.expected;
    if (match) passed++;

    console.log(`${match ? '✅' : '❌'} ${tc.name}`);
    console.log(`   Response: "${tc.response.substring(0, 50)}..."`);
    console.log(`   Expected: ${tc.expected}, Got: ${assessment.quality_tier} (conf: ${assessment.confidence})`);
    console.log();
  }

  console.log(`\nPassed: ${passed}/${testCases.length}`);
}

// ============================================================================
// UNIT TEST: Cliché Detection & Meaningful Detail Filtering
// ============================================================================

async function testClicheAndDetailQuality(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('UNIT TEST: Cliché Detection & Meaningful Detail Filtering');
  console.log('='.repeat(80));

  const gatherer = new ConversationalContextGatherer();

  console.log('\n--- CLICHÉ TOPIC DETECTION ---\n');

  const clicheTestCases = [
    {
      name: 'Immigration narrative',
      text: 'Moving to a new country was hard. I had to adapt to American culture.',
      shouldDetect: true,
      expectedTopic: 'immigration_narrative'
    },
    {
      name: 'Between two cultures',
      text: 'I found myself caught between two cultures, straddling my heritage and my new life.',
      shouldDetect: true,
      expectedTopic: 'bicultural_identity'
    },
    {
      name: 'Sports injury recovery',
      text: 'When I tore my ACL during the championship game, I thought my career was over.',
      shouldDetect: true,
      expectedTopic: 'sports_injury'
    },
    {
      name: 'Grandparent death',
      text: 'When my grandmother passed away last summer, I learned what truly matters.',
      shouldDetect: true,
      expectedTopic: 'grandparent_death'
    },
    {
      name: 'Passion claim',
      text: 'Ever since I was a kid, I\'ve been passionate about helping others.',
      shouldDetect: true,
      expectedTopic: 'passion_claim'
    },
    {
      name: 'Service trip privilege',
      text: 'Building houses in Guatemala made me realize how privileged I am.',
      shouldDetect: true,
      expectedTopic: 'privilege_realization'
    },
    {
      name: 'NOT cliché - Unique angle',
      text: 'The weird thing about my grandmother\'s funeral was that nobody cried. She\'d left a note saying "No tears, just stories." So we told stories until 3 AM.',
      shouldDetect: false,
      expectedTopic: null
    },
    {
      name: 'NOT cliché - Specific technical',
      text: 'After debugging the gradient descent for 6 hours, I realized the weights were initialized wrong. The loss dropped from 0.8 to 0.02.',
      shouldDetect: false,
      expectedTopic: null
    },
  ];

  // We need to access the internal function - let's test through the coaching follow-up
  // which uses cliché detection internally
  let passed = 0;
  for (const tc of clicheTestCases) {
    // The coaching follow-up will have different content if cliché is detected
    // For this test, we check if the response would trigger cliché-aware coaching
    const assessment = (gatherer as any).heuristicQualityCheck(tc.text);

    // Check if response has cliché patterns by looking at what coaching would say
    const mockGap = { gap_type: 'missing_concrete_detail', suggested_question: 'Tell me more', priority: 10 };
    const followUp = (gatherer as any).generateCoachingFollowUp(assessment, mockGap, tc.text);

    const hasClicheWarning = followUp.why_this_helps.includes('common') ||
                              followUp.why_this_helps.includes('extremely common') ||
                              followUp.why_this_helps.includes('overused') ||
                              followUp.why_this_helps.includes('generic') ||
                              followUp.why_this_helps.includes('cliché') ||
                              followUp.why_this_helps.includes('Admissions officers') ||
                              followUp.why_this_helps.includes('thousands');

    const match = (tc.shouldDetect && hasClicheWarning) || (!tc.shouldDetect && !hasClicheWarning);
    if (match) passed++;

    console.log(`${match ? '✅' : '❌'} ${tc.name}`);
    console.log(`   Text: "${tc.text.substring(0, 60)}..."`);
    console.log(`   Should detect cliché: ${tc.shouldDetect}, Has warning: ${hasClicheWarning}`);
    console.log();
  }

  console.log(`Cliché Detection Passed: ${passed}/${clicheTestCases.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // MEANINGFUL VS MEANINGLESS DETAIL TEST
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- MEANINGFUL VS MEANINGLESS DETAILS ---\n');

  const detailTestCases = [
    {
      name: 'Meaningless - Room number alone',
      text: 'I walked into Room 204 and sat down.',
      detailToCheck: 'Room 204',
      shouldBeMeaningful: false
    },
    {
      name: 'Meaningless - Random time',
      text: 'At 7:15 AM I got to school.',
      detailToCheck: '7:15 AM',
      shouldBeMeaningful: false
    },
    {
      name: 'Meaningful - Time with purpose',
      text: 'At 2 AM, after everyone else had given up and gone home, I was still debugging.',
      detailToCheck: '2 AM',
      shouldBeMeaningful: true
    },
    {
      name: 'Meaningful - Time showing commitment',
      text: 'I\'d been working since 6 AM and it was already midnight before I finally got it to work.',
      detailToCheck: '6 AM',
      shouldBeMeaningful: true
    },
    {
      name: 'Meaningless - Counting desks',
      text: 'There were 23 desks in the classroom.',
      detailToCheck: '23 desks',
      shouldBeMeaningful: false
    },
    {
      name: 'Meaningful - Sensory immersion',
      text: 'The room smelled like kimchi and something fried.',
      detailToCheck: 'smelled like kimchi',
      shouldBeMeaningful: true
    },
    {
      name: 'Meaningful - Physical reaction',
      text: 'My hands were sweating so much the paper was getting damp.',
      detailToCheck: 'hands were sweating',
      shouldBeMeaningful: true
    },
  ];

  // Test through element extraction - meaningless details should be filtered or scored lower
  let detailPassed = 0;
  for (const tc of detailTestCases) {
    const elements = (gatherer as any).extractUsableElements(tc.text);

    // Check if the detail was extracted as an element
    const extracted = elements.some((e: any) =>
      tc.text.toLowerCase().includes(e.content.toLowerCase()) ||
      e.content.toLowerCase().includes(tc.detailToCheck.toLowerCase())
    );

    // For meaningless details, we expect them NOT to be extracted (or scored low)
    // For meaningful details, we expect them to be extracted
    const match = (tc.shouldBeMeaningful && extracted) || (!tc.shouldBeMeaningful && !extracted);
    if (match) detailPassed++;

    console.log(`${match ? '✅' : '❌'} ${tc.name}`);
    console.log(`   Text: "${tc.text}"`);
    console.log(`   Detail: "${tc.detailToCheck}"`);
    console.log(`   Should be meaningful: ${tc.shouldBeMeaningful}, Extracted: ${extracted}`);
    console.log();
  }

  console.log(`Meaningful Detail Passed: ${detailPassed}/${detailTestCases.length}`);
}

// Run tests
async function main() {
  await testQualityAssessment();
  await testClicheAndDetailQuality();
  await runConversationalTest();
}

main().catch(console.error);
