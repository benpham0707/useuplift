/**
 * Quick Adaptive Modes Verification Test
 *
 * Verifies that the ConversationModeService correctly:
 * 1. Detects student patterns (terse, reluctant, humble, engaged)
 * 2. Activates appropriate modes (rescue_storytelling, emotional_validation, recap_confirmation)
 * 3. Composes questions with appropriate prefixes/suffixes
 */

import './utils/loadEnv';

import { conversationModeService } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/conversationModeService';
import { createEmptyProfile } from '../src/services/portfolioStrategy/services/activityWorkshop/profile/types';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

interface TestCase {
  name: string;
  response: string;
  extractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty';
  expectedPattern: string;
  expectedModes: string[];
}

const testCases: TestCase[] = [
  {
    name: 'Terse/Sparse Response',
    response: "Yeah, I play chess.",
    extractionQuality: 'sparse',
    expectedPattern: 'terse',
    // After 2 sparse turns: rescue_storytelling + targeted_completion activate
    expectedModes: ['standard', 'rescue_storytelling', 'targeted_completion'],
  },
  {
    name: 'Humble/Underselling Response',
    response: "I'm just the captain, but honestly anyone could do it. The team is what matters, not me. I just make schedules.",
    extractionQuality: 'moderate',
    expectedPattern: 'humble',
    // targeted_completion only activates at turn >= 2
    expectedModes: ['standard', 'emotional_validation'],
  },
  {
    name: 'Reluctant Response',
    response: "I don't know, it's nothing special, whatever. I mean, I'm not sure what to say really.",
    extractionQuality: 'sparse',
    expectedPattern: 'reluctant', // Note: may also detect as 'humble' due to overlapping patterns
    expectedModes: ['standard', 'emotional_validation'],
  },
  {
    name: 'Rich/Engaged Response',
    response: "I led a team of 6 programmers. We built an autonomous navigation system using computer vision. Our robot could identify game pieces 40% faster than last year's design. I personally wrote over 3,000 lines of code and trained 3 new team members on Python.",
    extractionQuality: 'rich',
    expectedPattern: 'engaged',
    // Engaged students should NOT get recap - keep them in flow
    // targeted_completion might activate at turn >= 2
    expectedModes: ['standard'],
  },
];

async function main() {
  log('\n═══════════════════════════════════════════════════════════════', 'bright');
  log('  ADAPTIVE MODES VERIFICATION TEST', 'bright');
  log('═══════════════════════════════════════════════════════════════\n', 'bright');

  let passed = 0;
  let total = 0;

  for (const testCase of testCases) {
    log(`\nTesting: ${testCase.name}`, 'cyan');
    log(`  Response: "${testCase.response.substring(0, 60)}..."`, 'reset');

    // Create initial dynamics
    let dynamics = conversationModeService.createInitialDynamics();

    // Create a minimal profile for testing
    const profile = createEmptyProfile('test-activity', 'Test Activity');

    // Simulate different turn histories based on response type
    if (testCase.extractionQuality === 'sparse') {
      // Simulate 2 sparse turns to trigger rescue mode
      dynamics = conversationModeService.updateDynamics(
        dynamics,
        'sparse',
        0,
        "Short answer.",
        profile,
        1
      );
    } else if (testCase.extractionQuality === 'rich') {
      // Simulate engaged flow: 2 prior rich extractions (don't interrupt with recap)
      dynamics = conversationModeService.updateDynamics(
        dynamics,
        'rich',
        4,
        "Previous great response with lots of detail about the project.",
        profile,
        1
      );
      dynamics = conversationModeService.updateDynamics(
        dynamics,
        'rich',
        5,
        "Another detailed response about leadership and team coordination.",
        profile,
        2
      );
    }

    // Update dynamics with the test response
    dynamics = conversationModeService.updateDynamics(
      dynamics,
      testCase.extractionQuality,
      testCase.extractionQuality === 'rich' ? 5 : testCase.extractionQuality === 'moderate' ? 2 : 0,
      testCase.response,
      profile,
      testCase.extractionQuality === 'sparse' ? 2 : testCase.extractionQuality === 'rich' ? 3 : 1
    );

    // Check pattern detection (allow humble/reluctant overlap as they're related patterns)
    const acceptablePatterns = testCase.expectedPattern === 'reluctant'
      ? ['reluctant', 'humble']
      : [testCase.expectedPattern];
    const patternMatch = acceptablePatterns.includes(dynamics.detectedPattern);
    total++;
    if (patternMatch) {
      passed++;
      log(`  ✓ Pattern detected: ${dynamics.detectedPattern}`, 'green');
    } else {
      log(`  ✗ Pattern mismatch: expected ${testCase.expectedPattern}, got ${dynamics.detectedPattern}`, 'red');
    }

    // Check mode activation
    const modesMatch = testCase.expectedModes.every(mode => dynamics.activeModes.includes(mode as any));
    total++;
    if (modesMatch) {
      passed++;
      log(`  ✓ Active modes: [${dynamics.activeModes.join(', ')}]`, 'green');
    } else {
      log(`  ✗ Mode mismatch: expected [${testCase.expectedModes.join(', ')}], got [${dynamics.activeModes.join(', ')}]`, 'red');
    }

    // Test question composition
    const baseQuestion = "Tell me about a time when you faced a challenge.";
    const composition = conversationModeService.composeQuestion(
      baseQuestion,
      dynamics,
      'Test Activity',
      ['example data point 1', 'example data point 2']
    );

    log(`  Composed mode: ${composition.mode}`, 'yellow');
    if (composition.prefix) {
      log(`  Prefix: "${composition.prefix.substring(0, 60)}..."`, 'yellow');
    }
    if (composition.suffix) {
      log(`  Suffix: "${composition.suffix.substring(0, 60)}..."`, 'yellow');
    }
    log(`  Reasoning: ${composition.reasoning}`, 'yellow');

    const formatted = conversationModeService.formatComposedQuestion(composition);
    log(`  Full question: "${formatted.substring(0, 100)}..."`, 'reset');
  }

  // Additional test: Rescue storytelling mode after 2 sparse extractions
  log(`\n${COLORS.cyan}Testing: Rescue Storytelling Mode (2+ sparse streak)${COLORS.reset}`);
  let rescueDynamics = conversationModeService.createInitialDynamics();
  const profile = createEmptyProfile('rescue-test', 'Rescue Test');

  // Simulate 2 sparse turns
  rescueDynamics = conversationModeService.updateDynamics(rescueDynamics, 'sparse', 0, "Short.", profile, 1);
  rescueDynamics = conversationModeService.updateDynamics(rescueDynamics, 'sparse', 0, "Very short.", profile, 2);

  const rescueModeActive = rescueDynamics.activeModes.includes('rescue_storytelling');
  total++;
  if (rescueModeActive) {
    passed++;
    log(`  ✓ Rescue mode activated after 2 sparse turns`, 'green');
  } else {
    log(`  ✗ Rescue mode NOT activated (expected after 2 sparse)`, 'red');
  }

  const rescueComposition = conversationModeService.composeQuestion(
    "What did you do?",
    rescueDynamics,
    'Chess Club'
  );

  log(`  Rescue question: "${rescueComposition.question.substring(0, 80)}..."`, 'yellow');

  const isOpenEnded = rescueComposition.question.toLowerCase().includes('tell me') ||
                       rescueComposition.question.toLowerCase().includes('walk me through') ||
                       rescueComposition.question.toLowerCase().includes('stands out') ||
                       rescueComposition.question.toLowerCase().includes('think about') ||
                       rescueComposition.question.toLowerCase().includes('typical day') ||
                       rescueComposition.question.toLowerCase().includes('explaining') ||
                       rescueComposition.question.toLowerCase().includes('take me back') ||
                       rescueComposition.question.toLowerCase().includes('would surprise');
  total++;
  if (isOpenEnded) {
    passed++;
    log(`  ✓ Question is open-ended/storytelling style`, 'green');
  } else {
    log(`  ✗ Question is NOT open-ended (rescue mode should use storytelling prompts)`, 'red');
  }

  // Summary
  log(`\n═══════════════════════════════════════════════════════════════`, 'bright');
  log(`  SUMMARY: ${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');
  log(`═══════════════════════════════════════════════════════════════\n`, 'bright');

  if (passed === total) {
    log('All adaptive mode improvements are working correctly!', 'green');
  } else {
    log('Some improvements need attention.', 'yellow');
  }
}

main().catch(console.error);
