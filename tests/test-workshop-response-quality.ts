/**
 * Test Workshop Response Quality
 *
 * This test actually calls Claude to see the REAL response quality
 * in both Technique Mode and Suggestion Mode.
 *
 * Goal: Verify that Workshop modes provide:
 * - Fun, engaging conversational guidance
 * - Clear, in-depth teaching
 * - Helpful implementation support
 * - Better quality than generic universal chat
 */

import {
  workshopChatModeService,
  type WorkshopModeContext,
  type SuggestionModeContext,
  type CriticalIssue,
} from '../src/services/commonAppWorkshop/services';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ISSUE: CriticalIssue = {
  issue_number: 1,
  quote: 'I have always been passionate about learning and pushing myself to achieve my goals.',
  location: 'Opening paragraph, lines 1-2',
  problem: 'Generic claim of passion without concrete evidence or specific moment',
  symptom_type: 'telling_not_showing',
  diagnosis: 'The student TELLS about passion without SHOWING a moment where that passion was visible through behavior. Admissions officers see claims like this thousands of times - what makes YOUR passion unique? Where did it become visible?',
  prescription: 'Replace with a specific scene showing curiosity in action - what did you actually DO that shows passion?',
  missing_elements: {
    sensory_details: ['What did your learning environment look like?', 'What sounds surrounded you?'],
    concrete_objects: ['Specific book titles', 'Names of teachers or mentors', 'Numbers: how many hours, how many attempts'],
    micro_moment: 'The exact moment when your passion became visible - staying up late, forgetting to eat, losing track of time',
    emotional_truth: 'Show frustration or exhilaration through action, not by naming the emotion',
  },
  relevant_concept: 'IV must be visible through behavior',
  relevant_evidence: [],
  socratic_questions: ['When did you lose track of time learning?', 'What did you forget to do because you were so absorbed?'],
  college_value_impacted: 'Intellectual Vitality',
};

const TEST_SUGGESTIONS = {
  polished_original: {
    text: 'In third grade, I spent my recess rereading the same library book about space while everyone else played kickball.',
    rationale: 'Replaces abstract claim with specific scene showing passion through behavior. The contrast (reading vs kickball) demonstrates choice, not circumstance.',
    what_changed: [
      'Replaced "passionate about learning" with specific action (rereading space book)',
      'Added specific time/place (third grade, recess, library)',
      'Added contrast with peers (kickball) to show this was YOUR choice',
      'Removed generic "pushing myself" - the scene SHOWS effort',
    ],
    safety_level: 'safe',
    when_to_use: 'When you want a reliable improvement that clearly shows rather than tells',
  },
  voice_amplifier: {
    text: 'Third grade recess: everyone sprinting toward the kickball diamond, me sprinting toward the library. Same book about Jupiter\'s moons. Fifth time that week.',
    rationale: 'Uses sentence fragments and parallel structure to create energy and momentum. The "fifth time" detail adds authenticity and obsession.',
    what_changed: [
      'Used fragmentary style for energy and personality',
      'Added parallel structure (everyone sprinting / me sprinting) for contrast',
      'Added hyper-specific detail (Jupiter\'s moons, fifth time that week)',
      'Let the rhythm carry the enthusiasm rather than stating it',
    ],
    why_authentic: 'The fragmentary style mirrors how excited people actually talk about things they love. The "fifth time" is the kind of detail only you would know.',
    risk_level: 'medium',
    when_to_use: 'When you want to establish your distinctive voice and show personality early in the essay',
  },
  how_to_choose: {
    polished_when: 'Your essay already has voice-forward moments elsewhere, and you want this opening to be reliable',
    voice_when: 'This is your opening and you want to grab attention with your unique rhythm',
    can_combine: 'Take the specific detail (Jupiter\'s moons, fifth time) and put it in a more traditional sentence structure if fragments feel too risky',
  },
};

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function displaySeparator(char = '=', length = 80): void {
  console.log(char.repeat(length));
}

function displayHeader(title: string): void {
  console.log('');
  displaySeparator();
  console.log(`  ${title}`);
  displaySeparator();
}

function displayResponse(label: string, content: string): void {
  console.log('');
  console.log(`  ${label}:`);
  console.log('  ' + '─'.repeat(70));

  // Word wrap for readability
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.length <= 76) {
      console.log(`  ${line}`);
    } else {
      // Word wrap long lines
      const words = line.split(' ');
      let currentLine = '  ';
      for (const word of words) {
        if (currentLine.length + word.length > 76) {
          console.log(currentLine);
          currentLine = '  ' + word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      if (currentLine.trim()) console.log(currentLine);
    }
  }
  console.log('  ' + '─'.repeat(70));
}

// ============================================================================
// TESTS
// ============================================================================

async function testTechniqueMode(): Promise<void> {
  displayHeader('TECHNIQUE MODE - Universal Learning');

  console.log('');
  console.log('  Building technique mode context...');

  const context = workshopChatModeService.buildWorkshopContext(TEST_ISSUE, 'Stanford');

  if (!context) {
    console.log('  ERROR: Could not build context');
    return;
  }

  console.log(`  Technique: ${context.technique.technique_name}`);
  console.log(`  Steps: ${context.universal_teaching.steps.length}`);
  console.log(`  Examples: ${context.universal_teaching.examples.length}`);
  console.log('');

  // Get welcome message
  const welcome = workshopChatModeService.getWelcomeMessage(context);
  displayResponse('WELCOME MESSAGE', welcome.content);

  // Test a user question
  console.log('');
  console.log('  Sending user message: "I\'m not sure how to start. Can you explain step 1?"');

  try {
    const response = await workshopChatModeService.sendWorkshopMessage({
      userMessage: "I'm not sure how to start. Can you explain step 1?",
      context,
      conversationHistory: [welcome],
    });

    displayResponse('COACH RESPONSE', response.message.content);
    console.log('');
    console.log(`  Tokens: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`);
    console.log(`  Cost: $${response.usage.cost.toFixed(4)}`);
    console.log(`  Progress: Step ${response.progress.current_step}/${response.progress.total_steps}`);
    console.log(`  Suggested next: ${response.suggested_next_step}`);
  } catch (error: any) {
    console.log(`  ERROR: ${error.message}`);
  }
}

async function testSuggestionMode(): Promise<void> {
  displayHeader('SUGGESTION MODE - Implementing Stage 2 Suggestions');

  console.log('');
  console.log('  Building suggestion mode context...');

  const context = workshopChatModeService.buildSuggestionContext(
    TEST_ISSUE,
    TEST_SUGGESTIONS,
    { collegeName: 'Stanford' }
  );

  console.log(`  Mode: ${context.mode}`);
  console.log(`  Has polished: ${!!context.suggestions.polished_original}`);
  console.log(`  Has voice amp: ${!!context.suggestions.voice_amplifier}`);
  console.log('');

  // Get welcome message
  const welcome = workshopChatModeService.getSuggestionWelcomeMessage(context);
  displayResponse('WELCOME MESSAGE', welcome.content);

  // Test user questions
  const testQuestions = [
    "What's the difference between these two options?",
    "I like the voice amplifier but the fragments feel risky. Can I modify it?",
  ];

  const history = [welcome];

  for (const question of testQuestions) {
    console.log('');
    console.log(`  User: "${question}"`);

    try {
      const response = await workshopChatModeService.sendSuggestionMessage(
        question,
        context,
        history
      );

      displayResponse('COACH RESPONSE', response.message.content);
      console.log('');
      console.log(`  Tokens: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`);
      console.log(`  Cost: $${response.usage.cost.toFixed(4)}`);
      console.log(`  Progress: Step ${response.progress.current_step}/${response.progress.total_steps}`);

      history.push(
        { role: 'user', content: question, timestamp: Date.now() },
        response.message
      );

    } catch (error: any) {
      console.log(`  ERROR: ${error.message}`);
    }
  }
}

async function testComparisonWithUniversalChat(): Promise<void> {
  displayHeader('COMPARISON: What makes Workshop Mode better?');

  console.log('');
  console.log('  The same question answered by Workshop Suggestion Mode vs generic chat:');
  console.log('');

  const question = "I like the second option but I'm worried it's too risky. Help me decide.";

  console.log(`  Question: "${question}"`);
  console.log('');

  // Build suggestion context
  const context = workshopChatModeService.buildSuggestionContext(
    TEST_ISSUE,
    TEST_SUGGESTIONS,
    { collegeName: 'Stanford' }
  );

  // Get Workshop Mode response
  console.log('  Getting WORKSHOP MODE response...');

  try {
    const workshopResponse = await workshopChatModeService.sendSuggestionMessage(
      question,
      context,
      [workshopChatModeService.getSuggestionWelcomeMessage(context)]
    );

    displayResponse('WORKSHOP SUGGESTION MODE', workshopResponse.message.content);
    console.log(`  Cost: $${workshopResponse.usage.cost.toFixed(4)}`);
  } catch (error: any) {
    console.log(`  ERROR: ${error.message}`);
  }

  // Note about universal chat
  console.log('');
  console.log('  COMPARISON NOTES:');
  console.log('  ─────────────────');
  console.log('  Workshop Mode advantages:');
  console.log('    • References the ACTUAL suggestions (text, rationale, changes)');
  console.log('    • Knows the specific context (Stanford, opening paragraph)');
  console.log('    • Has guardrails for quality (must explain changes, reference text)');
  console.log('    • Tracks progress through implementation');
  console.log('    • Encourages adaptation, not just copy-paste');
  console.log('');
  console.log('  Universal chat would:');
  console.log('    • Give generic advice about "taking risks"');
  console.log('    • Not know the specific suggestions');
  console.log('    • Not have context about what changes were made');
  console.log('    • Not guide toward implementation');
}

// ============================================================================
// MAIN
// ============================================================================

async function runQualityTest(): Promise<void> {
  console.log('');
  displaySeparator('*');
  console.log('  WORKSHOP RESPONSE QUALITY TEST');
  console.log('  Testing actual Claude responses for quality and helpfulness');
  displaySeparator('*');

  let totalCost = 0;

  // Test Technique Mode
  try {
    await testTechniqueMode();
  } catch (error: any) {
    console.log(`Technique Mode Error: ${error.message}`);
  }

  // Test Suggestion Mode
  try {
    await testSuggestionMode();
  } catch (error: any) {
    console.log(`Suggestion Mode Error: ${error.message}`);
  }

  // Comparison
  try {
    await testComparisonWithUniversalChat();
  } catch (error: any) {
    console.log(`Comparison Error: ${error.message}`);
  }

  displayHeader('QUALITY ASSESSMENT CRITERIA');

  console.log('');
  console.log('  The Workshop Mode responses should be:');
  console.log('');
  console.log('  1. FUN & ENGAGING');
  console.log('     ✓ Conversational tone, not lecture-y');
  console.log('     ✓ Celebrates their effort and progress');
  console.log('     ✓ Uses examples and analogies');
  console.log('');
  console.log('  2. CLEAR & IN-DEPTH');
  console.log('     ✓ Explains WHY changes work, not just WHAT changed');
  console.log('     ✓ References their specific text');
  console.log('     ✓ Breaks down complex concepts');
  console.log('');
  console.log('  3. ACTIONABLE');
  console.log('     ✓ Gives concrete next steps');
  console.log('     ✓ Helps them adapt, not just copy');
  console.log('     ✓ Tracks progress through implementation');
  console.log('');
  console.log('  4. QUALITY-ASSURED');
  console.log('     ✓ Stays focused on the specific technique/suggestion');
  console.log('     ✓ Doesn\'t drift to unrelated topics');
  console.log('     ✓ Maintains consistent quality');
  console.log('');

  displaySeparator();
  console.log('  TEST COMPLETE - Review responses above for quality');
  displaySeparator();
}

runQualityTest().catch(console.error);
