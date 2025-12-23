/**
 * Quick test for pattern detection improvements
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-pattern-detection.ts
 */

import {
  detectPhrasePatterns,
  getPatternById,
  ALL_ISSUE_PATTERNS
} from '../src/services/commonAppWorkshop/rubrics/issueDetectionPatterns';

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  id: string;
  text: string;
  expectedPatterns: string[];
  notExpectedPatterns?: string[];
}

const TEST_CASES: TestCase[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // NO_NUMBERS (should detect ABSENCE of numbers)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'no_numbers_absent',
    text: `Stanford is a great university. I want to attend because of the amazing opportunities and excellent professors.`,
    expectedPatterns: ['NO_NUMBERS', 'SWAP_TEST_FAIL'],
    notExpectedPatterns: []
  },
  {
    id: 'no_numbers_present',
    text: `I tutored 47 students over 18 months, with 85% improving their grades by at least one letter.`,
    expectedPatterns: [],
    notExpectedPatterns: ['NO_NUMBERS']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NO_DIALOGUE (should detect ABSENCE of quoted speech)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'no_dialogue_absent',
    text: `My father's diagnosis changed everything. I felt lost and confused. Eventually I learned to cope.`,
    expectedPatterns: ['NO_DIALOGUE', 'NO_NUMBERS'],  // No essay-speak in this text
    notExpectedPatterns: []
  },
  {
    id: 'no_dialogue_present',
    text: `"You're going to be okay," my mom said. Those words changed everything for me.`,
    expectedPatterns: [],
    notExpectedPatterns: ['NO_DIALOGUE']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VAGUE_DIVERSITY (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'vague_diversity_detected',
    text: `Being Asian-American, I have a diverse background that will help me contribute to campus diversity. I can bring a unique perspective.`,
    expectedPatterns: ['VAGUE_DIVERSITY'],
    notExpectedPatterns: []
  },
  {
    id: 'vague_diversity_not_detected',
    text: `When my grandmother called me "banana" for speaking English with an American accent, I felt caught between worlds.`,
    expectedPatterns: [],
    notExpectedPatterns: ['VAGUE_DIVERSITY']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ONE_SIDED_FIT (improved detection - balanced check)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'one_sided_fit_detected',
    text: `I want to learn from Stanford's amazing professors. The program will help me achieve my dreams. I want to study computer science.`,
    expectedPatterns: ['ONE_SIDED_FIT'],
    notExpectedPatterns: []
  },
  {
    id: 'one_sided_fit_not_detected_with_contribution',
    text: `I want to join the Human-Centered AI Institute and take CS229. I'd contribute to Stanford Women in Machine Learning, sharing resources I wish I'd had.`,
    expectedPatterns: [],
    notExpectedPatterns: ['ONE_SIDED_FIT']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SWAP_TEST_FAIL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'swap_test_fail_detected',
    text: `Stanford is one of the best universities in the world. It has a prestigious reputation and world-renowned faculty.`,
    expectedPatterns: ['SWAP_TEST_FAIL'],
    notExpectedPatterns: []
  },
  {
    id: 'swap_test_not_detected',
    text: `Professor Fei-Fei Li's work on ImageNet inspired me. I want to take CS229 and explore the Human-Centered AI Institute.`,
    expectedPatterns: [],
    notExpectedPatterns: ['SWAP_TEST_FAIL']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC_LESSONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'generic_lessons_detected',
    text: `This experience taught me that hard work pays off. I learned to never give up and believe in myself.`,
    expectedPatterns: ['GENERIC_LESSONS', 'ESSAY_SPEAK_HEAVY'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ESSAY_SPEAK_HEAVY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'essay_speak_heavy_detected',
    text: `Through this experience, I learned valuable lessons. This opportunity allowed me to develop new skills. I came to appreciate the importance of teamwork.`,
    expectedPatterns: ['ESSAY_SPEAK_HEAVY'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC_ORIGIN_STORY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'generic_origin_story_detected',
    text: `I have always been interested in computer science. Ever since I was young, I loved technology. For as long as I can remember, I have been fascinated by how things work.`,
    expectedPatterns: ['GENERIC_ORIGIN_STORY'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI_PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ai_patterns_detected',
    text: `In today's ever-changing landscape, it's important to note that education plays a crucial role. Let me delve into why Stanford serves as a powerful testament to excellence.`,
    expectedPatterns: ['AI_PATTERNS'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFENSIVE_OR_APOLOGETIC (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'defensive_apologetic_detected',
    text: `I'm sorry that my family couldn't afford extracurriculars. Unfortunately I had to work instead of joining clubs. I know it's not much, but I tried my best.`,
    expectedPatterns: ['DEFENSIVE_OR_APOLOGETIC'],
    notExpectedPatterns: []
  },
  {
    id: 'defensive_apologetic_not_detected',
    text: `Working 20 hours weekly at my uncle's restaurant taught me customer service, inventory management, and how to calm angry customers.`,
    expectedPatterns: [],
    notExpectedPatterns: ['DEFENSIVE_OR_APOLOGETIC']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAGGING_WITHOUT_VULNERABILITY (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bragging_detected',
    text: `As captain, I excelled at leading our team. I was the best debater in our league and everyone looked to me for guidance. I never failed to inspire.`,
    expectedPatterns: ['BRAGGING_WITHOUT_VULNERABILITY'],
    notExpectedPatterns: []
  },
  {
    id: 'bragging_not_detected',
    text: `The first debate I ever lost, I cried in the bathroom. My partner said "Good, now you'll work harder." Two years later we made it to state finals.`,
    expectedPatterns: [],
    notExpectedPatterns: ['BRAGGING_WITHOUT_VULNERABILITY']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNREALISTIC_GOALS (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'unrealistic_goals_detected',
    text: `I want to study medicine so I can cure cancer and change the world. By saving lives, I will make the world a better place.`,
    expectedPatterns: ['UNREALISTIC_GOALS'],
    notExpectedPatterns: []
  },
  {
    id: 'unrealistic_goals_not_detected',
    text: `After shadowing Dr. Kim for 40 hours, I became interested in targeted immunotherapy research for pediatric leukemia.`,
    expectedPatterns: [],
    notExpectedPatterns: ['UNREALISTIC_GOALS']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JUST_DESCRIBING (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'just_describing_detected',
    text: `First we met at the school. Then we planned our project. After that we presented to the judges. Finally we won first place.`,
    expectedPatterns: ['JUST_DESCRIBING'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAKING_EXCUSES (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'making_excuses_detected',
    text: `My grades suffered because the teacher was unfair. It wasn't my fault - they didn't let me retake the test.`,
    expectedPatterns: ['MAKING_EXCUSES'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSIVE_PARTICIPATION (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'passive_participation_detected',
    text: `I was part of our school's debate team. We accomplished so much together. Our team achieved state recognition.`,
    expectedPatterns: ['PASSIVE_PARTICIPATION'],
    notExpectedPatterns: []
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUME_LISTING (new pattern)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'resume_listing_detected',
    text: `I am President of NHS. I also serve as debate captain. Additionally, I founded the coding club. Furthermore, I volunteer weekly.`,
    expectedPatterns: ['RESUME_LISTING'],
    notExpectedPatterns: []
  }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function runTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('PATTERN DETECTION TEST SUITE');
  console.log('═'.repeat(70) + '\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const detected = detectPhrasePatterns(testCase.text);

    // Check expected patterns are detected
    const missingExpected = testCase.expectedPatterns.filter(p => !detected.includes(p));

    // Check not-expected patterns are NOT detected
    const unexpectedDetected = (testCase.notExpectedPatterns || []).filter(p => detected.includes(p));

    const isPass = missingExpected.length === 0 && unexpectedDetected.length === 0;

    if (isPass) {
      console.log(`${GREEN}✓${RESET} ${testCase.id}`);
      console.log(`  Detected: [${detected.join(', ')}]`);
      passed++;
    } else {
      console.log(`${RED}✗${RESET} ${testCase.id}`);
      console.log(`  Expected: [${testCase.expectedPatterns.join(', ')}]`);
      console.log(`  Detected: [${detected.join(', ')}]`);
      if (missingExpected.length > 0) {
        console.log(`  ${RED}Missing: [${missingExpected.join(', ')}]${RESET}`);
      }
      if (unexpectedDetected.length > 0) {
        console.log(`  ${YELLOW}Unexpected: [${unexpectedDetected.join(', ')}]${RESET}`);
      }
      failed++;
    }
    console.log();
  }

  // Summary
  console.log('═'.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70));

  // List all patterns
  console.log('\n' + 'All Issue Patterns:');
  ALL_ISSUE_PATTERNS.forEach(p => {
    console.log(`  ${p.id}: ${p.name} (${p.severity})`);
  });

  return failed === 0;
}

// ============================================================================
// TYPE-AWARE DETECTION TESTS
// ============================================================================

interface TypeAwareTestCase {
  id: string;
  text: string;
  essayType: 'intellectual' | 'values' | 'diversity' | 'why_us' | 'challenge' | 'leadership' | 'extracurricular';
  shouldDetect: string[];
  shouldNotDetect: string[];
}

const TYPE_AWARE_TEST_CASES: TypeAwareTestCase[] = [
  // NO_NUMBERS should NOT flag intellectual essays (numbers not expected)
  {
    id: 'no_numbers_intellectual_skip',
    text: `I spent months pondering the nature of consciousness. What makes awareness possible? These questions drive my intellectual exploration.`,
    essayType: 'intellectual',
    shouldDetect: [],
    shouldNotDetect: ['NO_NUMBERS']
  },
  // NO_NUMBERS SHOULD flag why_us essays (numbers expected)
  {
    id: 'no_numbers_whyus_flag',
    text: `Stanford has great programs and excellent professors. I want to attend because of the collaborative environment.`,
    essayType: 'why_us',
    shouldDetect: ['NO_NUMBERS', 'SWAP_TEST_FAIL'],
    shouldNotDetect: []
  },
  // NO_DIALOGUE should NOT flag why_us essays (dialogue not expected)
  {
    id: 'no_dialogue_whyus_skip',
    text: `Stanford's interdisciplinary approach appeals to me. The HAI Institute combines technical innovation with ethical consideration.`,
    essayType: 'why_us',
    shouldDetect: [],
    shouldNotDetect: ['NO_DIALOGUE']
  },
  // NO_DIALOGUE SHOULD flag challenge essays (narrative needs dialogue)
  {
    id: 'no_dialogue_challenge_flag',
    text: `My father's stroke changed everything. I felt lost. Eventually I learned to cope and became stronger.`,
    essayType: 'challenge',
    shouldDetect: ['NO_DIALOGUE'],
    shouldNotDetect: []
  },
  // NO_NUMBERS should NOT flag diversity essays
  {
    id: 'no_numbers_diversity_skip',
    text: `Growing up between two cultures taught me the art of translation. I bridge my grandmother's traditions with my American identity.`,
    essayType: 'diversity',
    shouldDetect: [],
    shouldNotDetect: ['NO_NUMBERS']
  },
  // NO_NUMBERS SHOULD flag leadership essays (metrics expected)
  {
    id: 'no_numbers_leadership_flag',
    text: `As team captain, I learned to inspire others. My leadership style focuses on collaboration and trust-building.`,
    essayType: 'leadership',
    shouldDetect: ['NO_NUMBERS'],
    shouldNotDetect: []
  }
];

function runTypeAwareTests(): boolean {
  console.log('\n' + '═'.repeat(70));
  console.log('TYPE-AWARE DETECTION TESTS');
  console.log('═'.repeat(70) + '\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of TYPE_AWARE_TEST_CASES) {
    const detected = detectPhrasePatterns(testCase.text, testCase.essayType);

    // Check should-detect patterns are present
    const missingShouldDetect = testCase.shouldDetect.filter(p => !detected.includes(p));

    // Check should-not-detect patterns are absent
    const unexpectedDetected = testCase.shouldNotDetect.filter(p => detected.includes(p));

    const isPass = missingShouldDetect.length === 0 && unexpectedDetected.length === 0;

    if (isPass) {
      console.log(`${GREEN}✓${RESET} ${testCase.id} (${testCase.essayType})`);
      console.log(`  Detected: [${detected.join(', ')}]`);
      passed++;
    } else {
      console.log(`${RED}✗${RESET} ${testCase.id} (${testCase.essayType})`);
      console.log(`  Detected: [${detected.join(', ')}]`);
      if (missingShouldDetect.length > 0) {
        console.log(`  ${RED}Missing (should detect): [${missingShouldDetect.join(', ')}]${RESET}`);
      }
      if (unexpectedDetected.length > 0) {
        console.log(`  ${YELLOW}Unexpected (should skip): [${unexpectedDetected.join(', ')}]${RESET}`);
      }
      failed++;
    }
    console.log();
  }

  console.log('═'.repeat(70));
  console.log(`TYPE-AWARE RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70));

  return failed === 0;
}

// ============================================================================
// MAIN
// ============================================================================

const basicSuccess = runTests();
const typeAwareSuccess = runTypeAwareTests();

console.log('\n' + '█'.repeat(70));
console.log(`OVERALL: ${basicSuccess && typeAwareSuccess ? GREEN + 'ALL TESTS PASSED' : RED + 'SOME TESTS FAILED'}${RESET}`);
console.log('█'.repeat(70) + '\n');

process.exit(basicSuccess && typeAwareSuccess ? 0 : 1);
