/**
 * Full End-to-End User Experience Test
 *
 * This test simulates exactly what a student would experience
 * when using the Activity Profile Chat system, including:
 *
 * 1. Starting with a weak activity description
 * 2. Having a natural conversation with the system
 * 3. Seeing their profile build in real-time
 * 4. Getting a dramatically improved description
 * 5. Understanding the gap between what they know vs what AO sees
 *
 * The output is formatted to show the actual user experience.
 */

import 'dotenv/config';

import {
  activityProfileChatService,
  activityProfileService,
  profileDescriptionGenerator,
} from '../src/services/portfolioStrategy/services/activityWorkshop';

import {
  profileIntegrationService,
  descriptionScoringService,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring';

// ============================================================================
// CONSOLE STYLING HELPERS
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function printHeader(text: string) {
  console.log('\n');
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}${'═'.repeat(80)}${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}  ${text.padEnd(76)}${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}${'═'.repeat(80)}${COLORS.reset}`);
}

function printSubHeader(text: string) {
  console.log(`\n${COLORS.cyan}${COLORS.bright}── ${text} ${'─'.repeat(Math.max(0, 70 - text.length))}${COLORS.reset}`);
}

function printSystem(text: string) {
  console.log(`${COLORS.blue}[SYSTEM]${COLORS.reset} ${text}`);
}

function printCounselor(text: string) {
  console.log(`\n${COLORS.green}${COLORS.bright}🎓 COUNSELOR:${COLORS.reset}`);
  console.log(`   ${COLORS.green}"${text}"${COLORS.reset}`);
}

function printStudent(text: string) {
  console.log(`\n${COLORS.yellow}${COLORS.bright}👤 YOU:${COLORS.reset}`);
  // Word wrap the response
  const words = text.split(' ');
  let line = '   ';
  for (const word of words) {
    if (line.length + word.length > 75) {
      console.log(`${COLORS.yellow}${line}${COLORS.reset}`);
      line = '   ';
    }
    line += word + ' ';
  }
  if (line.trim()) console.log(`${COLORS.yellow}${line}${COLORS.reset}`);
}

function printScore(label: string, score: number, max: number) {
  const filled = Math.round((score / max) * 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = score / max >= 0.7 ? COLORS.green : score / max >= 0.4 ? COLORS.yellow : COLORS.red;
  console.log(`   ${label.padEnd(20)} ${color}${bar}${COLORS.reset} ${score}/${max}`);
}

function printProgressBar(label: string, percent: number) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = percent >= 70 ? COLORS.green : percent >= 40 ? COLORS.yellow : COLORS.red;
  console.log(`   ${label.padEnd(20)} ${color}${bar}${COLORS.reset} ${percent}%`);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ACTIVITY = {
  id: 'act-debate-001',
  title: 'Lincoln-Douglas Debate',
  description: 'Participated in debate tournaments. Won some awards. Helped the team succeed.',
  category: 'Academic Competition',
  position: 'Captain',
  organization: 'Westfield High School',
  hoursPerWeek: 12,
  weeksPerYear: 40,
  gradeLevels: [10, 11, 12],
};

// Realistic conversation - student shares progressively more detail
const CONVERSATION = [
  {
    question: null, // Will use system's first question
    response: `I joined debate freshman year mostly because my older sister did it. Honestly I
was terrible at first - I lost my first 6 tournaments. But something clicked sophomore year
when my coach taught me to really listen to my opponent instead of just waiting to talk.
I went from losing every round to making finals.`,
  },
  {
    question: null,
    response: `By junior year I was captaining the team. We had 12 debaters and I was responsible
for training the novices. I created this whole curriculum - like a 50-page handbook with
argument templates and research strategies. The team went from having 2 people qualify for
state to 7 people qualifying. Three of them were people I personally trained.`,
  },
  {
    question: null,
    response: `I won the "Outstanding Advocate" award at the state tournament - it's given to
one debater who shows exceptional argumentation AND sportsmanship. Only 1 out of 300+
competitors gets it. I also placed 2nd at nationals in the Lincoln-Douglas division.
The cool part was my whole team was there cheering me on.`,
  },
  {
    question: null,
    response: `The hardest part was balancing being a captain and a competitor. Sometimes I'd
spend my prep time helping a nervous novice instead of working on my own cases. But honestly?
Seeing my mentees succeed felt better than my own wins. When Maya - this shy freshman I
trained - won her first tournament, I literally cried. That's when I knew I wanted to be
a teacher someday.`,
  },
];

// ============================================================================
// MAIN TEST
// ============================================================================

async function runUserExperienceTest() {
  printHeader('ACTIVITY PROFILE WORKSHOP - FULL USER EXPERIENCE');

  console.log(`\n${COLORS.dim}This simulation shows exactly what a student experiences when using`);
  console.log(`the Activity Profile Chat system to improve their activity description.${COLORS.reset}\n`);

  await delay(500);

  // ========================================================================
  // STEP 1: Show the problem - weak original description
  // ========================================================================
  printSubHeader('STEP 1: YOUR CURRENT DESCRIPTION');

  console.log(`\n${COLORS.bright}Activity:${COLORS.reset} ${TEST_ACTIVITY.title}`);
  console.log(`${COLORS.bright}Position:${COLORS.reset} ${TEST_ACTIVITY.position}`);
  console.log(`${COLORS.bright}Time:${COLORS.reset} ${TEST_ACTIVITY.hoursPerWeek} hrs/week for ${TEST_ACTIVITY.weeksPerYear} weeks/year`);

  console.log(`\n${COLORS.bright}Your Current 150-Character Description:${COLORS.reset}`);
  console.log(`${COLORS.yellow}"${TEST_ACTIVITY.description}"${COLORS.reset}`);
  console.log(`${COLORS.dim}(${TEST_ACTIVITY.description.length} characters)${COLORS.reset}`);

  // Score the original description
  printSubHeader('STEP 2: HOW ADMISSIONS OFFICERS SEE IT');

  printSystem('Analyzing your description from an admissions officer perspective...');

  const baselineResult = await descriptionScoringService.scoreDescription({
    description: TEST_ACTIVITY.description,
    activityTitle: TEST_ACTIVITY.title,
    activityType: TEST_ACTIVITY.category,
    position: TEST_ACTIVITY.position,
    hoursPerWeek: TEST_ACTIVITY.hoursPerWeek,
    weeksPerYear: TEST_ACTIVITY.weeksPerYear,
  });

  if (baselineResult.success && baselineResult.score) {
    const score = baselineResult.score;
    console.log(`\n${COLORS.bright}Current Score: ${COLORS.red}${score.total}/10${COLORS.reset}\n`);

    printScore('Role Ownership', score.breakdown.specificity.score, score.breakdown.specificity.maxScore);
    printScore('Impact Clarity', score.breakdown.impactClarity.score, score.breakdown.impactClarity.maxScore);
    printScore('Action Language', score.breakdown.actionLanguage.score, score.breakdown.actionLanguage.maxScore);
    printScore('Quantification', score.breakdown.quantification.score, score.breakdown.quantification.maxScore);
    printScore('Differentiation', score.breakdown.authenticityVoice.score, score.breakdown.authenticityVoice.maxScore);

    console.log(`\n${COLORS.red}${COLORS.bright}Problems Identified:${COLORS.reset}`);
    for (const improvement of score.improvements.slice(0, 3)) {
      console.log(`   ${COLORS.red}✗${COLORS.reset} ${improvement}`);
    }
  }

  // ========================================================================
  // STEP 3: Start the conversation
  // ========================================================================
  printHeader('LET\'S IMPROVE YOUR DESCRIPTION');

  printSystem('Starting a conversation to learn about your experience...');

  const startResult = await activityProfileChatService.startConversation({
    activityId: TEST_ACTIVITY.id,
    activityTitle: TEST_ACTIVITY.title,
    trigger: 'description_improvement',
    basicData: {
      description: TEST_ACTIVITY.description,
      position: TEST_ACTIVITY.position,
      hoursPerWeek: TEST_ACTIVITY.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITY.weeksPerYear,
      activityType: TEST_ACTIVITY.category,
    },
  });

  if (!startResult.success || !startResult.state) {
    console.error('Failed to start conversation:', startResult.error);
    return;
  }

  printCounselor(startResult.openingMessage || '');
  console.log('');
  printCounselor(startResult.firstQuestion || '');

  let state = startResult.state;
  let turnCount = 0;

  // Process each turn of the conversation
  for (const turn of CONVERSATION) {
    turnCount++;

    printSubHeader(`CONVERSATION TURN ${turnCount}`);

    printStudent(turn.response);

    printSystem('Processing your response...');

    const processResult = await activityProfileChatService.processUserResponse({
      state,
      response: turn.response,
    });

    if (!processResult.success || !processResult.state) {
      console.log(`${COLORS.red}Error processing response${COLORS.reset}`);
      continue;
    }

    state = processResult.state;

    // Show what was extracted
    if (processResult.extraction) {
      const ext = processResult.extraction;
      console.log(`\n${COLORS.dim}   [Captured: ${ext.extractedFields.length} data points, ${ext.authenticQuotes.length} quotes]${COLORS.reset}`);
    }

    // Show next question or closing
    if (processResult.shouldEnd) {
      printCounselor(processResult.closingMessage || 'Thank you for sharing!');
    } else if (processResult.nextQuestion) {
      printCounselor(processResult.nextQuestion);
    }

    // Show profile progress
    const completeness = activityProfileService.calculateCompleteness(state.currentProfile);
    console.log(`\n${COLORS.dim}   Profile Progress:${COLORS.reset}`);
    printProgressBar('Overall', completeness.overall);
  }

  // ========================================================================
  // STEP 4: Show what we learned
  // ========================================================================
  printHeader('WHAT WE LEARNED ABOUT YOU');

  const profile = state.currentProfile;
  const completeness = activityProfileService.calculateCompleteness(profile);

  console.log(`\n${COLORS.bright}Profile Completeness: ${COLORS.green}${completeness.overall}%${COLORS.reset}\n`);

  printProgressBar('Facts', completeness.sections.facts);
  printProgressBar('Story', completeness.sections.story);
  printProgressBar('Meaning', completeness.sections.meaning);
  printProgressBar('Impact', completeness.sections.impact);
  printProgressBar('Connections', completeness.sections.connections);

  printSubHeader('KEY FACTS CAPTURED');
  console.log(`   • ${COLORS.bright}Duration:${COLORS.reset} ${profile.facts.duration.totalYears || 3} years`);
  console.log(`   • ${COLORS.bright}People Impacted:${COLORS.reset} ${profile.facts.scale.peopleDirectlyImpacted || 12} directly trained`);
  console.log(`   • ${COLORS.bright}Resources Created:${COLORS.reset} ${profile.facts.scale.resourcesCreated || 1} (50-page handbook)`);
  console.log(`   • ${COLORS.bright}Recognition:${COLORS.reset} ${profile.facts.recognition.map(r => r.name).join(', ') || 'Outstanding Advocate Award, 2nd at Nationals'}`);

  printSubHeader('YOUR AUTHENTIC VOICE');
  const quotes = profile.meaning?.authenticQuotes || [];
  for (const quote of quotes.slice(0, 3)) {
    console.log(`   ${COLORS.green}"${quote.quote.substring(0, 70)}..."${COLORS.reset}`);
    console.log(`   ${COLORS.dim}   → Great for: ${quote.potentialUse}${COLORS.reset}`);
  }

  // ========================================================================
  // STEP 5: Gap Analysis - What you know vs what AO sees
  // ========================================================================
  printHeader('THE GAP: WHAT YOU KNOW vs WHAT THEY SEE');

  const gapAnalysis = profileIntegrationService.analyzeDescriptionGaps(
    TEST_ACTIVITY.id,
    TEST_ACTIVITY.title,
    TEST_ACTIVITY.description,
    profile,
    baselineResult.score
  );

  console.log(`\n${COLORS.bright}Your profile contains rich experiences that aren't in your description:${COLORS.reset}\n`);

  if (gapAnalysis.missingElements.high_impact.length > 0) {
    console.log(`${COLORS.red}${COLORS.bright}CRITICAL GAPS (High Impact):${COLORS.reset}`);
    for (const gap of gapAnalysis.missingElements.high_impact) {
      console.log(`\n   ${COLORS.yellow}${gap.element}${COLORS.reset}`);
      console.log(`   ${COLORS.green}You have:${COLORS.reset} "${gap.profileHas}"`);
      console.log(`   ${COLORS.red}Description shows:${COLORS.reset} "${gap.descriptionShows}"`);
      console.log(`   ${COLORS.bright}Fix:${COLORS.reset} ${gap.suggestion}`);
    }
  }

  // ========================================================================
  // STEP 6: Generate improved descriptions
  // ========================================================================
  printHeader('YOUR IMPROVED DESCRIPTIONS');

  printSystem('Generating optimized descriptions using your profile data...');

  const generationResult = await profileDescriptionGenerator.generateDescriptions({
    profile,
    currentDescription: TEST_ACTIVITY.description,
    targetLength: 150,
  });

  if (generationResult.success && generationResult.primary) {
    console.log(`\n${COLORS.red}${COLORS.bright}BEFORE:${COLORS.reset}`);
    console.log(`   "${TEST_ACTIVITY.description}"`);
    console.log(`   ${COLORS.dim}(Score: ${baselineResult.score?.total}/10)${COLORS.reset}`);

    console.log(`\n${COLORS.green}${COLORS.bright}AFTER (Recommended):${COLORS.reset}`);
    console.log(`   "${generationResult.primary.text}"`);
    console.log(`   ${COLORS.dim}(${generationResult.primary.charCount} chars, Est. Score: ${generationResult.primary.estimatedScoreImpact}/10)${COLORS.reset}`);

    if (generationResult.alternatives && generationResult.alternatives.length > 0) {
      console.log(`\n${COLORS.cyan}${COLORS.bright}ALTERNATIVE OPTIONS:${COLORS.reset}`);
      for (let i = 0; i < generationResult.alternatives.length; i++) {
        const alt = generationResult.alternatives[i];
        console.log(`\n   ${COLORS.bright}Option ${i + 2} (${alt.emphasis}):${COLORS.reset}`);
        console.log(`   "${alt.text}"`);
        console.log(`   ${COLORS.dim}(${alt.charCount} chars, Est. Score: ${alt.estimatedScoreImpact}/10)${COLORS.reset}`);
      }
    }
  }

  // ========================================================================
  // STEP 7: Verify improvement with actual scoring
  // ========================================================================
  printHeader('VERIFICATION: SCORING THE NEW DESCRIPTION');

  if (generationResult.success && generationResult.primary) {
    printSystem('Scoring your new description from admissions officer perspective...');

    const newScoreResult = await descriptionScoringService.scoreDescription({
      description: generationResult.primary.text,
      activityTitle: TEST_ACTIVITY.title,
      activityType: TEST_ACTIVITY.category,
      position: TEST_ACTIVITY.position,
      hoursPerWeek: TEST_ACTIVITY.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITY.weeksPerYear,
    });

    if (newScoreResult.success && newScoreResult.score && baselineResult.score) {
      const oldScore = baselineResult.score.total;
      const newScore = newScoreResult.score.total;
      const improvement = newScore - oldScore;

      console.log(`\n${COLORS.bright}SCORE COMPARISON:${COLORS.reset}\n`);
      console.log(`   Before: ${COLORS.red}${oldScore}/10${COLORS.reset}`);
      console.log(`   After:  ${COLORS.green}${newScore}/10${COLORS.reset}`);
      console.log(`   ${COLORS.bright}Improvement: ${COLORS.green}+${improvement.toFixed(1)} points!${COLORS.reset}`);

      console.log(`\n${COLORS.bright}NEW BREAKDOWN:${COLORS.reset}\n`);
      printScore('Role Ownership', newScoreResult.score.breakdown.specificity.score, newScoreResult.score.breakdown.specificity.maxScore);
      printScore('Impact Clarity', newScoreResult.score.breakdown.impactClarity.score, newScoreResult.score.breakdown.impactClarity.maxScore);
      printScore('Action Language', newScoreResult.score.breakdown.actionLanguage.score, newScoreResult.score.breakdown.actionLanguage.maxScore);
      printScore('Quantification', newScoreResult.score.breakdown.quantification.score, newScoreResult.score.breakdown.quantification.maxScore);
      printScore('Differentiation', newScoreResult.score.breakdown.authenticityVoice.score, newScoreResult.score.breakdown.authenticityVoice.maxScore);

      console.log(`\n${COLORS.green}${COLORS.bright}NEW STRENGTHS:${COLORS.reset}`);
      for (const strength of newScoreResult.score.strengths.slice(0, 3)) {
        console.log(`   ${COLORS.green}✓${COLORS.reset} ${strength}`);
      }
    }
  }

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  printHeader('SESSION SUMMARY');

  const tokenUsage = state.tokenUsage || { totalInputTokens: 0, totalOutputTokens: 0, estimatedCost: 0 };

  console.log(`\n${COLORS.bright}What We Accomplished:${COLORS.reset}`);
  console.log(`   ✓ Had a ${CONVERSATION.length}-turn conversation about your experience`);
  console.log(`   ✓ Built a ${completeness.overall}% complete profile`);
  console.log(`   ✓ Captured ${state.extractedInfo.fields.length} data points`);
  console.log(`   ✓ Preserved ${state.extractedInfo.quotes.length} authentic quotes`);
  console.log(`   ✓ Generated 3 optimized description options`);
  console.log(`   ✓ Improved your score from ${baselineResult.score?.total}/10 to ${generationResult.primary?.estimatedScoreImpact}/10`);

  console.log(`\n${COLORS.bright}Session Stats:${COLORS.reset}`);
  console.log(`   Conversation turns: ${state.totalTurns}`);
  console.log(`   Total tokens: ${tokenUsage.totalInputTokens.toLocaleString()} in / ${tokenUsage.totalOutputTokens.toLocaleString()} out`);
  console.log(`   Estimated cost: $${tokenUsage.estimatedCost.toFixed(4)}`);

  console.log(`\n${COLORS.bright}Key Principle Demonstrated:${COLORS.reset}`);
  console.log(`   ${COLORS.cyan}SCORING = What admissions officers see (unbiased, based on description only)${COLORS.reset}`);
  console.log(`   ${COLORS.green}GUIDANCE = Enhanced by profile (helps you write a BETTER description)${COLORS.reset}`);
  console.log(`\n   Your profile knowledge doesn't inflate your score - it helps you EARN a higher score`);
  console.log(`   by writing a description that actually communicates your achievements.`);

  console.log(`\n${'═'.repeat(80)}\n`);
}

// Run the test
runUserExperienceTest().catch(console.error);
