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
  // ONE_SIDED_FIT (improved detection)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'one_sided_fit_detected',
    text: `I want to learn from Stanford's amazing professors. The program will help me achieve my dreams. I want to study computer science.`,
    expectedPatterns: ['ONE_SIDED_FIT'],
    notExpectedPatterns: []
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
// MAIN
// ============================================================================

const success = runTests();
process.exit(success ? 0 : 1);
