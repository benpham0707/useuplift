// @ts-nocheck
/**
 * Chat Conversation E2E Test — Peer Tutoring Program
 *
 * Simulates a realistic 4-message conversation with the Activity Profile Chat
 * system for a student who runs a Peer Tutoring Program.
 *
 * Tests:
 * - Full conversational flow (startConversation → 4x processUserResponse)
 * - State management across turns
 * - Extraction quality and profile accumulation
 * - Question progression and non-repetition
 * - Profile completeness growth
 */

import './utils/loadEnv';

import * as fs from 'fs';
import * as path from 'path';

import { activityProfileChatService } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/activityProfileChatService';
import { ConversationState } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/types';
import { activityProfileService } from '../src/services/portfolioStrategy/services/activityWorkshop/profile/activityProfileService';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const ACTIVITY_INPUT = {
  activityId: 'peer-tutoring-001',
  activityTitle: 'Peer Tutoring Program Founder',
  trigger: 'user_initiated' as const,
  basicData: {
    description: 'Founded and run school tutoring program helping struggling students',
    position: 'Founder & Lead Tutor',
    hoursPerWeek: 10,
    weeksPerYear: 36,
    yearsInvolved: 2,
    activityType: 'Community Service',
  },
  studentContext: {
    intendedMajor: 'Education Policy',
    currentGrade: 12,
  },
};

const USER_MESSAGES = [
  // Message 1: Origin story — how it started
  `I noticed a lot of my classmates were struggling in math and science but couldn't afford private tutoring. I started helping a few friends after school and word spread quickly. I went to the principal with a plan to make it official and she helped me get a classroom space. Within the first month we had 15 tutors and 40 students signed up.`,

  // Message 2: Impact and growth
  `Last semester, the students we tutored saw an average grade improvement of 1.5 letter grades. 12 students went from failing to passing. I personally trained all 15 tutors using a curriculum I designed — I created study guides, practice problems, and a tracking spreadsheet. We now serve about 60 students per week across math, science, English, and history.`,

  // Message 3: Challenges and meaning
  `The biggest challenge was when two of my best tutors graduated and I had to rebuild. I created a training manual so knowledge wouldn't be lost again. I also had to deal with students who felt embarrassed about needing help — I renamed it from 'remedial tutoring' to 'Academic Success Partners' to remove the stigma. Education equity is really important to me because my parents are immigrants and they couldn't help me with homework growing up.`,

  // Message 4: Future connections
  `I want to study education policy in college because I've seen firsthand how a simple program can change outcomes. The principal told me our program contributed to the school's 15% improvement in math proficiency scores. I'm also working on getting the program adopted by other schools in our district — I presented to the superintendent last month. Three schools have expressed interest.`,
];

// ============================================================================
// OUTPUT HELPERS
// ============================================================================

const outputLines: string[] = [];

function log(msg: string) {
  console.log(msg);
  outputLines.push(msg);
}

function logSeparator(title?: string) {
  if (title) {
    log(`\n${'='.repeat(80)}`);
    log(`  ${title}`);
    log(`${'='.repeat(80)}`);
  } else {
    log(`${'─'.repeat(80)}`);
  }
}

function logSection(title: string) {
  log(`\n--- ${title} ---`);
}

// ============================================================================
// MAIN TEST
// ============================================================================

(async () => {
  const startTime = Date.now();
  log(`Activity Profile Chat E2E Test — Peer Tutoring Program`);
  log(`Started: ${new Date().toISOString()}`);
  logSeparator();

  // Track completeness progression per turn
  const completenessProgression: { turn: number; completeness: number; fieldsExtracted: number }[] = [];
  const allQuestionsAsked: { turn: number; question: string }[] = [];

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1: Start Conversation
  // ──────────────────────────────────────────────────────────────────────────
  logSeparator('STEP 1: START CONVERSATION');

  log(`\nActivity: ${ACTIVITY_INPUT.activityTitle}`);
  log(`Category: ${ACTIVITY_INPUT.basicData.activityType}`);
  log(`Role: ${ACTIVITY_INPUT.basicData.position}`);
  log(`Hours/Week: ${ACTIVITY_INPUT.basicData.hoursPerWeek}`);
  log(`Years: ${ACTIVITY_INPUT.basicData.yearsInvolved}`);
  log(`Description: ${ACTIVITY_INPUT.basicData.description}`);
  log(`Trigger: ${ACTIVITY_INPUT.trigger}`);

  const startResult = await activityProfileChatService.startConversation(ACTIVITY_INPUT);

  if (!startResult.success || !startResult.state) {
    log(`\nFATAL: Failed to start conversation: ${startResult.error}`);
    process.exit(1);
  }

  let currentState: ConversationState = startResult.state;

  log(`\n[System Opening Message]:`);
  log(startResult.openingMessage || '(none)');
  log(`\n[First Question]:`);
  log(startResult.firstQuestion || '(none)');

  // Track the first question
  if (startResult.firstQuestion) {
    allQuestionsAsked.push({ turn: 0, question: startResult.firstQuestion });
  }

  // Initial state
  const initialCompleteness = activityProfileService.calculateCompleteness(currentState.currentProfile);
  log(`\n[Initial State]`);
  log(`  Phase: ${currentState.phase}`);
  log(`  Turn: ${currentState.totalTurns}`);
  log(`  Profile Completeness: ${initialCompleteness.overall}%`);
  log(`  Extracted Fields: ${currentState.extractedInfo.fields.length}`);

  completenessProgression.push({
    turn: 0,
    completeness: initialCompleteness.overall,
    fieldsExtracted: currentState.extractedInfo.fields.length,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2-5: Process 4 User Messages
  // ──────────────────────────────────────────────────────────────────────────
  for (let i = 0; i < USER_MESSAGES.length; i++) {
    const turnNum = i + 1;
    logSeparator(`TURN ${turnNum}: USER RESPONSE`);

    const userMessage = USER_MESSAGES[i];
    log(`\n[User Message] (${userMessage.split(' ').length} words):`);
    log(userMessage);

    const turnStart = Date.now();
    const result = await activityProfileChatService.processUserResponse({
      state: currentState,
      response: userMessage,
      metadata: {
        wordCount: userMessage.split(' ').length,
      },
    });
    const turnDuration = Date.now() - turnStart;

    if (!result.success || !result.state) {
      log(`\nERROR on turn ${turnNum}: ${result.error}`);
      log(`Continuing with previous state...`);
      continue;
    }

    currentState = result.state;

    // Compute completeness
    const completeness = activityProfileService.calculateCompleteness(currentState.currentProfile);

    logSection(`Turn ${turnNum} Results`);

    // System response / next question
    if (result.shouldEnd) {
      log(`\n[Conversation Ended]`);
      log(`  Reason: ${result.endReason}`);
      if (result.closingMessage) {
        log(`  Closing Message: ${result.closingMessage}`);
      }
    } else if (result.nextQuestion) {
      log(`\n[Next Question]:`);
      log(result.nextQuestion);
      allQuestionsAsked.push({ turn: turnNum, question: result.nextQuestion });
    }

    // State
    log(`\n[State After Turn ${turnNum}]`);
    log(`  Phase: ${currentState.phase}`);
    log(`  Turn Number: ${currentState.totalTurns}`);
    log(`  Turns in Phase: ${currentState.turnsInCurrentPhase}`);

    // Extraction details
    if (result.extraction) {
      log(`\n[Extraction Details]`);
      log(`  Quality: ${result.extraction.extractionQuality}`);
      log(`  Fields Extracted This Turn: ${result.extraction.extractedFields?.length || 0}`);
      if (result.extraction.extractedFields?.length > 0) {
        for (const field of result.extraction.extractedFields) {
          const valueStr = typeof field.value === 'object'
            ? JSON.stringify(field.value).substring(0, 100)
            : String(field.value).substring(0, 100);
          log(`    - ${field.path} = ${valueStr} [${field.confidence}]`);
        }
      }
      log(`  Quotes Captured: ${result.extraction.authenticQuotes?.length || 0}`);
      if (result.extraction.authenticQuotes?.length > 0) {
        for (const q of result.extraction.authenticQuotes) {
          log(`    - "${q.quote.substring(0, 80)}..." (${q.potentialUse})`);
        }
      }
      log(`  Implicit Findings: ${result.extraction.implicitFindings?.length || 0}`);
      log(`  Needs Clarification: ${result.extraction.needsClarification?.length || 0}`);
      log(`  Suggested Follow-ups: ${result.extraction.suggestedFollowUps?.length || 0}`);
    }

    // Completeness
    log(`\n[Profile Completeness]`);
    log(`  Overall: ${completeness.overall}%`);
    log(`  Facts: ${completeness.sections.facts}%`);
    log(`  Story: ${completeness.sections.story}%`);
    log(`  Meaning: ${completeness.sections.meaning}%`);
    log(`  Impact: ${completeness.sections.impact}%`);
    log(`  Connections: ${completeness.sections.connections}%`);
    log(`  Cumulative Extracted Fields: ${currentState.extractedInfo.fields.length}`);
    log(`  Cumulative Quotes: ${currentState.extractedInfo.quotes.length}`);

    // Token usage
    if (result.tokensUsed) {
      log(`\n[Token Usage This Turn]`);
      log(`  Input: ${result.tokensUsed.inputTokens}`);
      log(`  Output: ${result.tokensUsed.outputTokens}`);
    }
    log(`  Turn Duration: ${(turnDuration / 1000).toFixed(1)}s`);

    completenessProgression.push({
      turn: turnNum,
      completeness: completeness.overall,
      fieldsExtracted: currentState.extractedInfo.fields.length,
    });

    // If conversation ended early, break
    if (result.shouldEnd) {
      log(`\nConversation ended after turn ${turnNum}.`);
      break;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FINAL ANALYSIS
  // ──────────────────────────────────────────────────────────────────────────
  logSeparator('FINAL ANALYSIS');

  // Conversation Summary
  logSection('Conversation Summary');
  const summary = activityProfileChatService.getConversationSummary(currentState);
  log(`What We Learned:`);
  for (const item of summary.whatWeLearned) {
    log(`  - ${item}`);
  }
  log(`Completeness Before: ${summary.completenessBefore}%`);
  log(`Completeness After: ${summary.completenessAfter}%`);
  log(`Key Quotes Captured:`);
  for (const q of summary.keyQuotes) {
    log(`  - "${q}"`);
  }
  log(`Remaining Gaps:`);
  for (const gap of summary.remainingGaps) {
    log(`  - ${gap}`);
  }
  log(`Estimated Score Impact:`);
  log(`  Description: +${summary.estimatedScoreImpact.description}`);
  log(`  Activity: +${summary.estimatedScoreImpact.activity}`);
  log(`  Portfolio: +${summary.estimatedScoreImpact.portfolio}`);
  log(`Suggested Next Steps:`);
  for (const step of summary.suggestedNextSteps) {
    log(`  - ${step}`);
  }

  // Completeness Progression
  logSection('Completeness Progression (Turn by Turn)');
  for (const entry of completenessProgression) {
    const bar = '#'.repeat(Math.round(entry.completeness / 2));
    log(`  Turn ${entry.turn}: ${entry.completeness}% [${bar}] (${entry.fieldsExtracted} fields)`);
  }

  // All Questions Asked
  logSection('All Questions Asked');
  for (const q of allQuestionsAsked) {
    log(`  Turn ${q.turn}: ${q.question}`);
  }

  // Question Repetition Detection
  logSection('Question Repetition Analysis');
  const questionTexts = allQuestionsAsked.map(q => q.question.toLowerCase());
  let repetitionsFound = 0;
  for (let i = 0; i < questionTexts.length; i++) {
    for (let j = i + 1; j < questionTexts.length; j++) {
      // Simple word overlap check
      const wordsA = new Set(questionTexts[i].split(/\s+/).filter(w => w.length > 3));
      const wordsB = new Set(questionTexts[j].split(/\s+/).filter(w => w.length > 3));
      let overlap = 0;
      for (const word of wordsA) {
        if (wordsB.has(word)) overlap++;
      }
      const smaller = Math.min(wordsA.size, wordsB.size);
      if (smaller > 0 && overlap / smaller > 0.7) {
        log(`  WARNING: Possible repetition between Turn ${allQuestionsAsked[i].turn} and Turn ${allQuestionsAsked[j].turn}`);
        log(`    Q${allQuestionsAsked[i].turn}: ${allQuestionsAsked[i].question.substring(0, 80)}...`);
        log(`    Q${allQuestionsAsked[j].turn}: ${allQuestionsAsked[j].question.substring(0, 80)}...`);
        repetitionsFound++;
      }
    }
  }
  if (repetitionsFound === 0) {
    log(`  No question repetitions detected. PASS`);
  } else {
    log(`  ${repetitionsFound} potential repetition(s) found. REVIEW NEEDED`);
  }

  // Token Usage Summary
  logSection('Token Usage Summary');
  const tokenUsage = currentState.tokenUsage;
  if (tokenUsage) {
    log(`  Total Input Tokens: ${tokenUsage.totalInputTokens}`);
    log(`  Total Output Tokens: ${tokenUsage.totalOutputTokens}`);
    log(`  Estimated Cost: $${tokenUsage.estimatedCost.toFixed(4)}`);
  } else {
    log(`  No token usage tracked.`);
  }

  // Conversation Analytics
  logSection('Conversation Analytics');
  const analytics = activityProfileChatService.getConversationAnalytics(currentState);
  log(`  Total Turns: ${analytics.totalTurns}`);
  log(`  Avg Response Length: ${analytics.avgResponseLength} words`);
  log(`  Extraction Quality Trend: ${analytics.extractionQualityTrend.join(' -> ')}`);
  log(`  Phases Visited: ${analytics.phasesVisited.join(', ')}`);
  log(`  Fields Populated: ${analytics.fieldsPopulated}`);
  log(`  Quotes Captured: ${analytics.quotesCapture}`);
  log(`  Engagement Level: ${analytics.engagementLevel}`);

  // Full Final Profile
  logSeparator('FULL FINAL PROFILE (JSON)');
  log(JSON.stringify(currentState.currentProfile, null, 2));

  // ──────────────────────────────────────────────────────────────────────────
  // WRITE OUTPUT FILE
  // ──────────────────────────────────────────────────────────────────────────
  const totalDuration = Date.now() - startTime;
  log(`\n${'='.repeat(80)}`);
  log(`Test completed in ${(totalDuration / 1000).toFixed(1)}s`);
  log(`${'='.repeat(80)}`);

  const outputDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'output');
  const outputPath = path.join(outputDir, 'chat-conversation-tutoring-output.txt');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  console.log(`\nOutput written to: ${outputPath}`);
})();
