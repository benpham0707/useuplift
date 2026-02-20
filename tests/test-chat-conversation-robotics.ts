// @ts-nocheck
/**
 * Chat Conversation E2E Test — Robotics Club President
 *
 * Simulates a realistic 4-message conversation with the Activity Profile Chat
 * system for a student who leads a Robotics Club. Tests the full conversational
 * flow including state management, extraction, question progression, and profile
 * accumulation.
 *
 * Run:
 *   ANTHROPIC_API_KEY="..." npx tsx tests/test-chat-conversation-robotics.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

import { activityProfileChatService } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/activityProfileChatService';
import { activityProfileService } from '../src/services/portfolioStrategy/services/activityWorkshop/profile/activityProfileService';
import { createEmptyProfile } from '../src/services/portfolioStrategy/services/activityWorkshop/profile/types';
import type { ConversationState } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/types';

// ============================================================================
// TEST DATA
// ============================================================================

const ACTIVITY_ID = 'robotics-club-001';
const ACTIVITY_TITLE = 'Robotics Club President';

const BASIC_DATA = {
  description: 'Led team in designing and building robots for competitions',
  position: 'President',
  hoursPerWeek: 15,
  weeksPerYear: 40,
  yearsInvolved: 3,
  activityType: 'Academic/STEM',
};

const USER_MESSAGES = [
  // Message 1: How they got started
  `I joined robotics club freshman year because I was always taking apart electronics at home. My older sister was in the club and she got me interested. By sophomore year I was helping design our competition robot and the advisor asked me to step up as team lead.`,

  // Message 2: Scale and impact
  `We grew the club from 8 members to 32 in two years. I created a mentorship program pairing experienced members with newcomers. Our team won 2nd place at the state championship last year and qualified for nationals for the first time in school history. We also started a community outreach program teaching robotics to middle schoolers.`,

  // Message 3: Personal meaning and challenges
  `The hardest part was when we almost lost funding. I wrote a proposal to the school board and presented it myself — I was terrified but it worked. We got $5,000 in new funding. That experience taught me that leadership isn't just about the technical stuff, it's about advocating for your team. I want to study mechanical engineering in college.`,

  // Message 4: Deeper reflection
  `What I'm most proud of is seeing members who joined knowing nothing about robotics now mentoring others. One of my mentees won the individual innovation award at regionals. The club changed who I am — I used to be really shy and now I present to the school board regularly.`,
];

// ============================================================================
// HELPERS
// ============================================================================

interface TurnResult {
  turnNumber: number;
  phase: string;
  systemResponse: string;
  extractedFieldCount: number;
  totalFieldsSoFar: number;
  completenessPercent: number;
  questionsAskedCount: number;
  extractionQuality: string;
  tokensUsed?: { inputTokens: number; outputTokens: number };
}

function countProfileFields(profile: any): number {
  // Count non-empty fields recursively to gauge profile richness
  let count = 0;
  function walk(obj: any) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string' && obj.length > 0) { count++; return; }
    if (typeof obj === 'number' && obj > 0) { count++; return; }
    if (typeof obj === 'boolean' && obj) { count++; return; }
    if (Array.isArray(obj)) {
      if (obj.length > 0) count++;
      obj.forEach(walk);
      return;
    }
    if (typeof obj === 'object') {
      Object.values(obj).forEach(walk);
    }
  }
  walk(profile);
  return count;
}

function detectQuestionRepetition(questions: string[]): { hasRepetition: boolean; repeats: string[] } {
  const normalized = questions.map(q => q.toLowerCase().trim());
  const seen = new Set<string>();
  const repeats: string[] = [];
  for (const q of normalized) {
    // Check for near-exact repeats (same first 40 chars)
    const key = q.slice(0, 40);
    if (seen.has(key)) {
      repeats.push(q);
    }
    seen.add(key);
  }
  return { hasRepetition: repeats.length > 0, repeats };
}

// ============================================================================
// MAIN TEST
// ============================================================================

(async () => {
  const startTime = Date.now();
  const output: string[] = [];

  function log(msg: string) {
    console.log(msg);
    output.push(msg);
  }

  log('='.repeat(80));
  log('ACTIVITY PROFILE CHAT E2E TEST — ROBOTICS CLUB PRESIDENT');
  log('='.repeat(80));
  log(`Started at: ${new Date().toISOString()}`);
  log('');

  // ------------------------------------------------------------------
  // STEP 1: Start Conversation
  // ------------------------------------------------------------------
  log('-'.repeat(60));
  log('STEP 1: Starting Conversation');
  log('-'.repeat(60));

  const startResult = await activityProfileChatService.startConversation({
    activityId: ACTIVITY_ID,
    activityTitle: ACTIVITY_TITLE,
    trigger: 'user_initiated',
    basicData: BASIC_DATA,
    studentContext: {
      intendedMajor: 'Mechanical Engineering',
      currentGrade: 12,
    },
  });

  if (!startResult.success || !startResult.state) {
    log(`FATAL: Failed to start conversation: ${startResult.error}`);
    process.exit(1);
  }

  log(`Opening Message:\n  ${startResult.openingMessage}`);
  log(`First Question:\n  ${startResult.firstQuestion}`);
  log(`Initial Phase: ${startResult.state.phase}`);
  log('');

  let currentState: ConversationState = startResult.state;

  const turnResults: TurnResult[] = [];
  const allQuestionsAsked: string[] = [];

  // Record the first question
  if (startResult.firstQuestion) {
    allQuestionsAsked.push(startResult.firstQuestion);
  }

  // Completeness tracking
  const completenessProgression: { turn: number; completeness: number }[] = [];
  const initialCompleteness = activityProfileService.calculateCompleteness(currentState.currentProfile);
  completenessProgression.push({ turn: 0, completeness: initialCompleteness.overall });

  // ------------------------------------------------------------------
  // STEP 2: Process 4 User Messages
  // ------------------------------------------------------------------
  for (let i = 0; i < USER_MESSAGES.length; i++) {
    const turnNum = i + 1;
    log('-'.repeat(60));
    log(`TURN ${turnNum}: User Response`);
    log('-'.repeat(60));
    log(`User says:\n  "${USER_MESSAGES[i].slice(0, 120)}..."`);
    log('');

    const processResult = await activityProfileChatService.processUserResponse({
      state: currentState,
      response: USER_MESSAGES[i],
      metadata: {
        wordCount: USER_MESSAGES[i].split(' ').length,
      },
    });

    if (!processResult.success || !processResult.state) {
      log(`ERROR on turn ${turnNum}: ${processResult.error}`);
      log(`Full processResult: ${JSON.stringify(processResult, null, 2).slice(0, 500)}`);
      log('Continuing with previous state...');
      continue;
    }
    log(`  [OK] processUserResponse succeeded for turn ${turnNum}`);

    currentState = processResult.state;

    const completeness = activityProfileService.calculateCompleteness(currentState.currentProfile);
    const totalFieldsSoFar = currentState.extractedInfo.fields.length;

    const turnResult: TurnResult = {
      turnNumber: turnNum,
      phase: currentState.phase,
      systemResponse: processResult.nextQuestion || processResult.closingMessage || '(no response)',
      extractedFieldCount: processResult.extraction?.extractedFields?.length || 0,
      totalFieldsSoFar,
      completenessPercent: Math.round(completeness.overall),
      questionsAskedCount: currentState.questionsAsked.length,
      extractionQuality: processResult.extraction?.extractionQuality || 'unknown',
      tokensUsed: processResult.tokensUsed,
    };

    turnResults.push(turnResult);
    completenessProgression.push({ turn: turnNum, completeness: Math.round(completeness.overall) });

    if (processResult.nextQuestion) {
      allQuestionsAsked.push(processResult.nextQuestion);
    }

    log(`System Response (next question):`);
    log(`  ${turnResult.systemResponse.slice(0, 300)}${turnResult.systemResponse.length > 300 ? '...' : ''}`);
    log('');
    log(`  Phase: ${turnResult.phase}`);
    log(`  Turn Number: ${turnResult.turnNumber}`);
    log(`  Fields Extracted This Turn: ${turnResult.extractedFieldCount}`);
    log(`  Total Extracted Fields So Far: ${turnResult.totalFieldsSoFar}`);
    log(`  Profile Completeness: ${turnResult.completenessPercent}%`);
    log(`  Questions Asked So Far: ${turnResult.questionsAskedCount}`);
    log(`  Extraction Quality: ${turnResult.extractionQuality}`);
    if (turnResult.tokensUsed) {
      log(`  Tokens Used: ${turnResult.tokensUsed.inputTokens} input, ${turnResult.tokensUsed.outputTokens} output`);
    }
    log(`  Should End: ${processResult.shouldEnd}`);
    if (processResult.shouldEnd) {
      log(`  End Reason: ${processResult.endReason}`);
    }
    log('');
  }

  // ------------------------------------------------------------------
  // STEP 3: Final Summary
  // ------------------------------------------------------------------
  log('='.repeat(80));
  log('FINAL RESULTS');
  log('='.repeat(80));
  log('');

  // Conversation Summary
  const summary = activityProfileChatService.getConversationSummary(currentState);
  log('--- CONVERSATION SUMMARY ---');
  log(`What We Learned (${summary.whatWeLearned.length} items):`);
  summary.whatWeLearned.forEach((item, i) => log(`  ${i + 1}. ${item}`));
  log('');
  log(`Completeness Before: ${summary.completenessBefore}%`);
  log(`Completeness After: ${summary.completenessAfter}%`);
  log('');
  log(`Key Quotes Captured (${summary.keyQuotes.length}):`);
  summary.keyQuotes.forEach((q, i) => log(`  ${i + 1}. "${q}"`));
  log('');
  log(`Remaining Gaps (${summary.remainingGaps.length}):`);
  summary.remainingGaps.forEach((g, i) => log(`  ${i + 1}. ${g}`));
  log('');
  log(`Estimated Score Impact:`);
  log(`  Description: +${summary.estimatedScoreImpact.description.toFixed(2)}`);
  log(`  Activity: +${summary.estimatedScoreImpact.activity.toFixed(2)}`);
  log(`  Portfolio: +${summary.estimatedScoreImpact.portfolio.toFixed(2)}`);
  log('');
  log(`Suggested Next Steps (${summary.suggestedNextSteps.length}):`);
  summary.suggestedNextSteps.forEach((s, i) => log(`  ${i + 1}. ${s}`));
  log('');

  // Token Usage
  log('--- TOKEN USAGE ---');
  const tokenUsage = currentState.tokenUsage;
  if (tokenUsage) {
    log(`Total Input Tokens: ${tokenUsage.totalInputTokens.toLocaleString()}`);
    log(`Total Output Tokens: ${tokenUsage.totalOutputTokens.toLocaleString()}`);
    log(`Estimated Cost: $${tokenUsage.estimatedCost.toFixed(4)}`);
  } else {
    log('No token usage tracked.');
  }
  log('');

  // All Questions Asked
  log('--- ALL QUESTIONS ASKED ---');
  allQuestionsAsked.forEach((q, i) => {
    log(`  Q${i + 1}: ${q}`);
  });
  log('');

  // Question Repetition Check
  const repetitionCheck = detectQuestionRepetition(allQuestionsAsked);
  log('--- QUESTION REPETITION CHECK ---');
  log(`Has Repetition: ${repetitionCheck.hasRepetition ? 'YES (ISSUE)' : 'NO (GOOD)'}`);
  if (repetitionCheck.hasRepetition) {
    log(`Repeated Questions:`);
    repetitionCheck.repeats.forEach(r => log(`  - ${r}`));
  }
  log('');

  // Completeness Progression
  log('--- PROFILE COMPLETENESS PROGRESSION ---');
  completenessProgression.forEach(p => {
    const bar = '#'.repeat(Math.round(p.completeness / 2));
    log(`  Turn ${p.turn}: ${p.completeness}% ${bar}`);
  });
  log('');

  // Analytics
  const analytics = activityProfileChatService.getConversationAnalytics(currentState);
  log('--- CONVERSATION ANALYTICS ---');
  log(`Total Turns: ${analytics.totalTurns}`);
  log(`Avg Response Length (words): ${analytics.avgResponseLength}`);
  log(`Extraction Quality Trend: ${analytics.extractionQualityTrend.join(' -> ')}`);
  log(`Phases Visited: ${analytics.phasesVisited.join(', ')}`);
  log(`Fields Populated: ${analytics.fieldsPopulated}`);
  log(`Quotes Captured: ${analytics.quotesCapture}`);
  log(`Engagement Level: ${analytics.engagementLevel}`);
  log('');

  // Full Final Profile (JSON)
  log('--- FULL FINAL PROFILE (JSON) ---');
  log(JSON.stringify(currentState.currentProfile, null, 2));
  log('');

  // Timing
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`--- TIMING ---`);
  log(`Total elapsed: ${elapsed}s`);
  log('');
  log('='.repeat(80));
  log('TEST COMPLETE');
  log('='.repeat(80));

  // ------------------------------------------------------------------
  // Write output to file
  // ------------------------------------------------------------------
  const outputDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'output');
  const outputPath = path.join(outputDir, 'chat-conversation-robotics-output.txt');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');
  console.log(`\nOutput written to: ${outputPath}`);
})();
