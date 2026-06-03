/**
 * Live test of the Dynamic Conversation Engine with actual LLM calls
 *
 * Tests the workshopping flow with real API responses to verify:
 * 1. Questions reference the student's current description
 * 2. Questions probe for specific details (numbers, roles, outcomes)
 * 3. Description suggestions are generated based on gathered data
 * 4. Teaching moments are concise (one sentence max)
 */

import '../utils/loadEnv';
import Anthropic from '@anthropic-ai/sdk';
import { dynamicConversationEngine } from '../../src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine';
import { conversationModeService } from '../../src/services/portfolioStrategy/services/activityWorkshop/chat/conversationModeService';
import { createEmptyProfile } from '../../src/services/portfolioStrategy/services/activityWorkshop/profile/types';
import { ExtractionResult } from '../../src/services/portfolioStrategy/services/activityWorkshop/chat/types';

// ============================================================================
// VERIFY API KEY FIRST
// ============================================================================

async function verifyApiKey(): Promise<boolean> {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log('\n=== API KEY VERIFICATION ===');
  console.log('Key length:', key?.length);
  console.log('Key starts with:', key?.substring(0, 15));

  if (!key || key.length < 50) {
    console.error('❌ API key not properly loaded');
    return false;
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say OK' }]
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('✅ API verification:', text);
    return true;
  } catch (error: any) {
    console.error('❌ API verification failed:', error.message);
    return false;
  }
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestScenario {
  name: string;
  activityType: string;
  currentDescription?: string;
  targetPlatform?: 'common_app' | 'uc' | 'coalition';
  studentPattern: 'engaged' | 'humble' | 'reluctant' | 'terse' | 'tangential';
  conversationHistory: Array<{
    question: string;
    response: string;
    extractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty';
  }>;
  nextBaseQuestion: string;
  targetField: string;
}

const scenarios: TestScenario[] = [
  // Scenario 1: Workshopping a vague description
  {
    name: 'Workshopping Vague Description',
    activityType: 'Science Research Club',
    currentDescription: 'Helped with many science projects and contributed to team success.',
    targetPlatform: 'common_app',
    studentPattern: 'engaged',
    conversationHistory: [
      {
        question: "Your description says 'helped with many science projects' — can you give me a specific example?",
        response: "Oh yeah! I led our water quality testing project where we analyzed samples from 12 local streams. We presented our findings to the city council and they actually used our data to improve the water filtration system.",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "How many students were on your team for that project?",
    targetField: 'facts.scale.teamSize',
  },

  // Scenario 2: Humble student with existing description
  {
    name: 'Humble Student Workshopping',
    activityType: 'Peer Tutoring',
    currentDescription: 'Helped some students with math homework.',
    targetPlatform: 'common_app',
    studentPattern: 'humble',
    conversationHistory: [
      {
        question: "Your description says 'helped some students' — roughly how many students was that?",
        response: "I don't know, maybe like 15 kids? It was really nothing special, they just needed help with algebra and I'm okay at math I guess.",
        extractionQuality: 'moderate',
      },
    ],
    nextBaseQuestion: "How often did you meet with them?",
    targetField: 'facts.timeInvestment.hoursPerWeek',
  },

  // Scenario 3: Building description from scratch
  {
    name: 'Building from Scratch',
    activityType: 'Robotics Team',
    studentPattern: 'engaged',
    conversationHistory: [
      {
        question: "Tell me about your role on the robotics team.",
        response: "I'm the programming lead. I built our autonomous navigation system using computer vision - we can now identify game pieces 40% faster than last year. I also trained 6 new team members on Python.",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "What was your biggest technical achievement?",
    targetField: 'impact.achievements',
  },
];

// ============================================================================
// RUN TEST
// ============================================================================

async function runScenario(scenario: TestScenario): Promise<void> {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${scenario.name.toUpperCase()}`);
  console.log(`${'═'.repeat(80)}`);

  if (scenario.currentDescription) {
    console.log(`\n📋 Current Description (${scenario.targetPlatform || 'common_app'}):`);
    console.log(`   "${scenario.currentDescription}"`);
    console.log(`   [${scenario.currentDescription.length} chars]`);
  } else {
    console.log(`\n📋 No existing description - building from scratch`);
  }

  console.log(`\n💬 Student Pattern: ${scenario.studentPattern}`);
  console.log(`📝 Last Student Response:`);
  const lastResponse = scenario.conversationHistory[scenario.conversationHistory.length - 1];
  console.log(`   "${lastResponse.response.substring(0, 100)}${lastResponse.response.length > 100 ? '...' : ''}"`);

  // Build dynamics
  let dynamics = conversationModeService.createInitialDynamics();
  const profile = createEmptyProfile('test', scenario.activityType);

  for (let i = 0; i < scenario.conversationHistory.length; i++) {
    const turn = scenario.conversationHistory[i];
    dynamics = conversationModeService.updateDynamics(
      dynamics,
      turn.extractionQuality,
      turn.extractionQuality === 'rich' ? 5 : turn.extractionQuality === 'moderate' ? 2 : 0,
      turn.response,
      profile,
      i + 1
    );
  }

  // Override pattern for test
  dynamics = { ...dynamics, detectedPattern: scenario.studentPattern };

  // Build conversation history
  const conversationHistory = scenario.conversationHistory.map(turn => ({
    question: turn.question,
    response: turn.response,
    extraction: {
      extractedFields: [],
      authenticQuotes: [],
      needsClarification: [],
      implicitFindings: [],
      extractionQuality: turn.extractionQuality,
      suggestedFollowUps: [],
    } as ExtractionResult,
  }));

  console.log(`\n🎯 Base Question: "${scenario.nextBaseQuestion}"`);

  try {
    const result = await dynamicConversationEngine.generateDynamicQuestion({
      baseQuestion: scenario.nextBaseQuestion,
      targetField: scenario.targetField,
      activityTitle: scenario.activityType,
      dynamics,
      conversationHistory,
      profile,
      extractedHighlights: [],
      turnNumber: scenario.conversationHistory.length + 1,
      currentDescription: scenario.currentDescription,
      targetPlatform: scenario.targetPlatform,
    });

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`  GENERATED OUTPUT`);
    console.log(`${'─'.repeat(80)}`);

    console.log(`\n📣 Question:`);
    console.log(`   "${result.question}"`);

    if (result.teachingMoment) {
      console.log(`\n💡 Teaching Moment:`);
      console.log(`   "${result.teachingMoment}" [${result.teachingMoment.length} chars]`);
    }

    if (result.qualityAnchor) {
      console.log(`\n⭐ Quality Anchor:`);
      console.log(`   "${result.qualityAnchor}"`);
    }

    if (result.quotedPhrases && result.quotedPhrases.length > 0) {
      console.log(`\n📝 Quoted Phrases:`);
      result.quotedPhrases.forEach(p => console.log(`   • "${p}"`));
    }

    if (result.descriptionFocus) {
      console.log(`\n🎯 Description Part Being Worked On:`);
      console.log(`   "${result.descriptionFocus}"`);
    }

    if (result.descriptionSuggestion) {
      console.log(`\n✨ Suggested Description (${result.descriptionSuggestion.charCount} chars):`);
      console.log(`   "${result.descriptionSuggestion.improvedText}"`);
      console.log(`   Changes: ${result.descriptionSuggestion.changes}`);
    }

    console.log(`\n📊 Metadata:`);
    console.log(`   Tone: ${result.tone}`);
    console.log(`   Reasoning: ${result.reasoning}`);
    if (result.tokensUsed) {
      console.log(`   Tokens: ${result.tokensUsed.input} in / ${result.tokensUsed.output} out`);
    }

    // Quality checks
    console.log(`\n✓ Quality Checks:`);
    const hasQuestion = result.question.includes('?');
    const quotesStudent = result.quotedPhrases && result.quotedPhrases.length > 0;
    const teachingIsConcise = !result.teachingMoment || result.teachingMoment.length < 100;
    const noGenericFiller = !result.question.toLowerCase().includes('appreciate you sharing');

    console.log(`   ${hasQuestion ? '✅' : '❌'} Contains question mark`);
    console.log(`   ${quotesStudent ? '✅' : '❌'} Quotes student's words`);
    console.log(`   ${teachingIsConcise ? '✅' : '❌'} Teaching is concise (<100 chars)`);
    console.log(`   ${noGenericFiller ? '✅' : '❌'} No generic filler phrases`);

  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
    if (error.stack) {
      console.error(error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
}

async function main() {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  DYNAMIC CONVERSATION ENGINE - LIVE TEST`);
  console.log(`${'═'.repeat(80)}`);

  // First verify the API key works
  const apiWorks = await verifyApiKey();

  if (!apiWorks) {
    console.error('\n❌ Cannot proceed without working API key');
    process.exit(1);
  }

  // Run all scenarios
  for (const scenario of scenarios) {
    await runScenario(scenario);
  }

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  TEST COMPLETE`);
  console.log(`${'═'.repeat(80)}\n`);
}

main().catch(console.error);
