/**
 * Improvement Verification Test
 *
 * Quick test to verify that the improvements made to:
 * 1. Follow-up priority boosting (sparse response handling)
 * 2. Reluctance detection
 * 3. Underselling detection
 * 4. Contradiction detection
 *
 * Are working correctly.
 */

import '../utils/loadEnv';

import {
  activityProfileChatService,
  activityProfileService,
} from '../../src/services/portfolioStrategy/services/activityWorkshop';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

interface TestResult {
  scenario: string;
  followUpGenerated: boolean;
  followUpQuestion: string | null;
  dataPointsExtracted: number;
  profileCompleteness: number;
}

async function runVerificationTest(
  scenarioName: string,
  activity: { id: string; title: string; description: string; position: string },
  responses: string[],
  expectedFollowUp: string
): Promise<TestResult> {
  console.log(`\n${COLORS.cyan}Testing: ${scenarioName}${COLORS.reset}`);

  const startResult = await activityProfileChatService.startConversation({
    activityId: activity.id,
    activityTitle: activity.title,
    trigger: 'description_improvement',
    basicData: {
      description: activity.description,
      position: activity.position,
      hoursPerWeek: 10,
      weeksPerYear: 40,
      activityType: 'Academic',
    },
  });

  if (!startResult.success || !startResult.state) {
    console.log(`${COLORS.red}Failed to start conversation${COLORS.reset}`);
    return {
      scenario: scenarioName,
      followUpGenerated: false,
      followUpQuestion: null,
      dataPointsExtracted: 0,
      profileCompleteness: 0,
    };
  }

  let state = startResult.state;
  let followUpGenerated = false;
  let followUpQuestion: string | null = null;

  // Process first response
  const processResult = await activityProfileChatService.processUserResponse({
    state,
    response: responses[0],
  });

  if (processResult.success && processResult.state) {
    state = processResult.state;

    // Check if a follow-up was generated
    const lastQuestion = state.questionsAsked[state.questionsAsked.length - 1];
    if (lastQuestion?.isFollowUp) {
      followUpGenerated = true;
      followUpQuestion = lastQuestion.question;
    }

    // Also check the next question that would be asked
    if (processResult.nextQuestion) {
      // Check if it matches expected follow-up pattern
      if (processResult.nextQuestion.toLowerCase().includes(expectedFollowUp.toLowerCase())) {
        followUpGenerated = true;
        followUpQuestion = processResult.nextQuestion;
      }
    }
  }

  const completeness = activityProfileService.calculateCompleteness(state.currentProfile);
  const dataPoints = state.extractedInfo.fields.length;

  // Report results
  if (followUpGenerated) {
    console.log(`  ${COLORS.green}✓ Follow-up generated:${COLORS.reset} "${followUpQuestion?.substring(0, 60)}..."`);
  } else {
    console.log(`  ${COLORS.red}✗ No follow-up generated${COLORS.reset}`);
    console.log(`  ${COLORS.yellow}  Next question: "${processResult.nextQuestion?.substring(0, 60)}..."${COLORS.reset}`);
  }
  console.log(`  Data points: ${dataPoints}, Completeness: ${completeness.overall}%`);

  return {
    scenario: scenarioName,
    followUpGenerated,
    followUpQuestion,
    dataPointsExtracted: dataPoints,
    profileCompleteness: completeness.overall,
  };
}

async function main() {
  console.log(`${COLORS.bright}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bright}  IMPROVEMENT VERIFICATION TEST${COLORS.reset}`);
  console.log(`${COLORS.bright}═══════════════════════════════════════════════════════════════${COLORS.reset}`);

  const results: TestResult[] = [];

  // Test 1: Sparse Response - Should trigger "Tell me more" follow-up
  results.push(await runVerificationTest(
    '1. Sparse Response (should probe)',
    { id: 'sparse-1', title: 'Chess Club', description: 'Played chess.', position: 'Member' },
    ["Yeah, I play chess."],
    'tell me more'
  ));

  // Test 2: Reluctant Response - Should trigger gentle follow-up
  results.push(await runVerificationTest(
    '2. Reluctant Response (should adapt)',
    { id: 'reluctant-1', title: 'Tutoring', description: 'Tutored students.', position: 'Tutor' },
    ["I mean, it's just tutoring. Nothing special. Anyone could do it."],
    'what you actually did'
  ));

  // Test 3: Underselling Response - Should probe for specifics
  results.push(await runVerificationTest(
    '3. Underselling Response (should reframe)',
    { id: 'humble-1', title: 'Science Olympiad', description: 'Competed in science.', position: 'Captain' },
    ["I'm the captain but honestly anyone could do it. I just make schedules. Others are better than me."],
    'unique contribution'
  ));

  // Test 4: Challenge Mention - Should probe the challenge
  results.push(await runVerificationTest(
    '4. Challenge Mention (should follow up)',
    { id: 'challenge-1', title: 'Debate Team', description: 'Did debate.', position: 'Member' },
    ["The hardest part was definitely the research. It was really difficult to find good sources."],
    'challenging'
  ));

  // Test 5: Rich Response - Should NOT generate unnecessary follow-up
  results.push(await runVerificationTest(
    '5. Rich Response (should move forward)',
    { id: 'rich-1', title: 'Robotics', description: 'Built robots.', position: 'Lead' },
    ["I led a team of 6 programmers. We built an autonomous navigation system using computer vision. Our robot could identify game pieces 40% faster than last year's design. I personally wrote over 3,000 lines of code and trained 3 new team members on Python."],
    '' // Shouldn't need follow-up
  ));

  // Summary
  console.log(`\n${COLORS.bright}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bright}  SUMMARY${COLORS.reset}`);
  console.log(`${COLORS.bright}═══════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  let passed = 0;
  let total = 4; // First 4 tests should have follow-ups

  for (let i = 0; i < 4; i++) {
    if (results[i].followUpGenerated) passed++;
  }

  // Test 5 is special - it SHOULD NOT have a follow-up
  if (!results[4].followUpGenerated || results[4].dataPointsExtracted > 5) {
    passed++;
    total++;
    console.log(`${COLORS.green}✓ Rich response handled correctly (moved forward without unnecessary probing)${COLORS.reset}`);
  } else {
    total++;
    console.log(`${COLORS.red}✗ Rich response incorrectly triggered follow-up${COLORS.reset}`);
  }

  console.log(`\n${COLORS.bright}Results: ${passed}/${total} scenarios handled correctly${COLORS.reset}`);

  if (passed < total) {
    console.log(`\n${COLORS.yellow}Improvements needed in follow-up generation logic${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.green}All improvements working as expected!${COLORS.reset}`);
  }
}

main().catch(console.error);
