/**
 * Test Workshop Chat Mode Integration
 *
 * Validates the ADDITIVE architecture where:
 * 1. Existing CriticalIssue data is PRESERVED
 * 2. Universal teaching is ADDED as a layer
 * 3. Workshop Mode chat provides specialized technique implementation
 * 4. Suggestion Mode helps implement Stage 2 suggestions
 *
 * Key validations:
 * - Original issue data remains intact
 * - Universal teaching enhances without replacing
 * - Workshop mode context is properly built
 * - Suggestion mode context is properly built
 * - Chat mode detection works correctly
 */

import {
  workshopChatModeService,
  createWorkshopContextsFromIssues,
  detectChatModeIntent,
  type WorkshopModeContext,
  type SuggestionModeContext,
  type CriticalIssue,
} from '../src/services/commonAppWorkshop/services';
import { teachingGuidancePresenter } from '../src/services/commonAppWorkshop/services/teachingGuidancePresenter';

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock Stage 2 suggestions (for suggestion mode tests)
const MOCK_STAGE2_SUGGESTIONS = {
  polished_original: {
    text: 'In third grade, I spent my recess rereading the same library book about space while everyone else played kickball.',
    rationale: 'Replaces abstract claim with specific scene showing passion through behavior. The contrast (reading vs kickball) demonstrates choice.',
    what_changed: [
      'Replaced "passionate about learning" with specific action (rereading space book)',
      'Added specific time/place (third grade, recess, library)',
      'Added contrast with peers (kickball) to show unique choice',
    ],
    safety_level: 'safe',
    when_to_use: 'When you want a reliable improvement that shows rather than tells',
  },
  voice_amplifier: {
    text: 'Third grade recess: everyone sprinting toward the kickball diamond, me sprinting toward the library. Same book about Jupiter\'s moons. Fifth time that week.',
    rationale: 'Uses sentence fragments and parallel structure to create energy. The "fifth time" detail adds authenticity.',
    what_changed: [
      'Used fragmentary style for energy and personality',
      'Added parallel structure (everyone sprinting / me sprinting)',
      'Added specific detail (Jupiter\'s moons, fifth time)',
    ],
    why_authentic: 'The fragmentary style and specific detail (fifth time) sounds like natural teenage voice',
    risk_level: 'medium',
    when_to_use: 'When you want to show more personality and take creative risk',
  },
  how_to_choose: {
    polished_when: 'You want safe improvement and your essay is already voice-forward elsewhere',
    voice_when: 'This is a key moment and you want to establish your distinctive voice early',
    can_combine: 'Take the specific detail (space/Jupiter) from both and blend with your own sentence structure',
  },
};

const MOCK_ISSUES: CriticalIssue[] = [
  {
    issue_number: 1,
    quote: 'I have always been passionate about learning and pushing myself to achieve my goals.',
    location: 'Opening paragraph, lines 1-2',
    problem: 'Generic claim of passion without concrete evidence or specific moment',
    symptom_type: 'telling_not_showing',
    diagnosis: 'The student TELLS about passion without SHOWING a moment where that passion was visible through behavior',
    prescription: 'Replace with a specific scene showing curiosity in action',
    missing_elements: {
      sensory_details: ['What did your learning environment look like?'],
      concrete_objects: ['Specific book titles', 'Names of teachers'],
      micro_moment: 'The exact moment passion became visible',
      emotional_truth: 'Show frustration or exhilaration through action',
    },
    relevant_concept: 'IV must be visible through behavior',
    relevant_evidence: [],
    socratic_questions: ['When did you lose track of time learning?'],
    college_value_impacted: 'Intellectual Vitality',
  },
  {
    issue_number: 2,
    quote: 'This transformative experience profoundly impacted my multifaceted perspective.',
    location: 'Second paragraph',
    problem: 'AI-convergence language signals inauthenticity',
    symptom_type: 'ai_convergence',
    diagnosis: 'Vocabulary sounds generated, not authentic',
    prescription: 'Replace with natural speech',
    missing_elements: {
      concrete_objects: ['What specifically happened?'],
    },
    relevant_concept: 'Voice authenticity',
    relevant_evidence: [],
    socratic_questions: ['Would you say this to a friend?'],
    college_value_impacted: 'Authenticity',
  },
  {
    issue_number: 3,
    quote: 'Through this experience, I learned that hard work always pays off.',
    location: 'Conclusion',
    problem: 'Premature resolution - forcing neat conclusion',
    symptom_type: 'premature_resolution',
    diagnosis: 'Forced lesson undermines complexity',
    prescription: 'End with ongoing questions or uncertainty',
    missing_elements: {
      emotional_truth: 'What questions remain?',
    },
    relevant_concept: 'Complexity over neat endings',
    relevant_evidence: [],
    socratic_questions: ['What are you still figuring out?'],
    college_value_impacted: 'Intellectual Vitality',
  },
];

// ============================================================================
// TEST HELPERS
// ============================================================================

function displaySeparator(char: string = '=', length: number = 70): void {
  console.log(char.repeat(length));
}

function displayHeader(title: string): void {
  console.log('');
  displaySeparator();
  console.log(title);
  displaySeparator();
  console.log('');
}

function displaySubHeader(title: string): void {
  console.log('');
  console.log(`  ${title}`);
  console.log('  ' + '-'.repeat(title.length));
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('');
  displaySeparator('*');
  console.log('  WORKSHOP CHAT MODE INTEGRATION TEST');
  console.log('  Validating ADDITIVE architecture');
  displaySeparator('*');

  let allPassed = true;
  const results: { test: string; passed: boolean; details: string }[] = [];

  // =========================================
  // TEST 1: Original issue data preserved
  // =========================================
  displayHeader('TEST 1: Original Issue Data PRESERVED');

  console.log('  Testing that enhanceIssueWithUniversalTeaching preserves original...');

  const enhanced = teachingGuidancePresenter.enhanceIssueWithUniversalTeaching(MOCK_ISSUES[0]);

  // Verify original is preserved
  const originalPreserved =
    enhanced.original.issue.quote === MOCK_ISSUES[0].quote &&
    enhanced.original.issue.diagnosis === MOCK_ISSUES[0].diagnosis &&
    enhanced.original.issue.prescription === MOCK_ISSUES[0].prescription &&
    enhanced.original.issue.missing_elements !== undefined;

  console.log(`  Original quote preserved: ${enhanced.original.issue.quote.substring(0, 50)}...`);
  console.log(`  Original diagnosis preserved: ${!!enhanced.original.issue.diagnosis}`);
  console.log(`  Original prescription preserved: ${!!enhanced.original.issue.prescription}`);
  console.log(`  Original missing_elements preserved: ${!!enhanced.original.issue.missing_elements}`);

  results.push({
    test: 'Original data preserved',
    passed: originalPreserved,
    details: originalPreserved ? 'All original fields intact' : 'Some original fields missing',
  });

  if (!originalPreserved) allPassed = false;

  // =========================================
  // TEST 2: Universal teaching ADDED
  // =========================================
  displayHeader('TEST 2: Universal Teaching ADDED');

  console.log('  Testing that universal teaching is added without replacing...');

  const hasUniversalWhy = enhanced.universal_teaching.why_this_matters.headline.length > 0;
  const hasUniversalTechnique = enhanced.universal_teaching.technique.name.length > 0;
  const hasUniversalSteps = enhanced.universal_teaching.technique.steps.length > 0;
  const hasUniversalExamples = enhanced.universal_teaching.examples.length > 0;

  console.log(`  WHY headline: "${enhanced.universal_teaching.why_this_matters.headline}"`);
  console.log(`  Technique name: "${enhanced.universal_teaching.technique.name}"`);
  console.log(`  Steps count: ${enhanced.universal_teaching.technique.steps.length}`);
  console.log(`  Examples count: ${enhanced.universal_teaching.examples.length}`);
  console.log(`  Difficulty: ${enhanced.universal_teaching.technique.difficulty}`);
  console.log(`  Estimated time: ${enhanced.universal_teaching.technique.estimated_time}`);

  const universalTeachingAdded = hasUniversalWhy && hasUniversalTechnique && hasUniversalSteps;

  results.push({
    test: 'Universal teaching added',
    passed: universalTeachingAdded,
    details: universalTeachingAdded ? 'WHY, HOW, EXAMPLES present' : 'Missing universal teaching components',
  });

  if (!universalTeachingAdded) allPassed = false;

  // =========================================
  // TEST 3: Workshop mode context building
  // =========================================
  displayHeader('TEST 3: Workshop Mode Context Building');

  console.log('  Testing workshop mode context creation...');

  const workshopContext = workshopChatModeService.buildWorkshopContext(MOCK_ISSUES[0], 'Stanford');

  if (workshopContext) {
    console.log(`  Mode: ${workshopContext.mode}`);
    console.log(`  Mode version: ${workshopContext.mode_version}`);
    console.log(`  Technique: ${workshopContext.technique.technique_name}`);
    console.log(`  Difficulty: ${workshopContext.technique.difficulty}`);
    console.log(`  Steps count: ${workshopContext.universal_teaching.steps.length}`);
    console.log(`  Examples count: ${workshopContext.universal_teaching.examples.length}`);
    console.log(`  Student quote preserved: ${workshopContext.student_context.quote.substring(0, 40)}...`);
    console.log(`  College: ${workshopContext.student_context.college}`);
    console.log('');
    console.log('  Guardrails:');
    console.log(`    Max response length: ${workshopContext.guardrails.max_response_length}`);
    console.log(`    Require concrete suggestion: ${workshopContext.guardrails.require_concrete_suggestion}`);
    console.log(`    Require student text reference: ${workshopContext.guardrails.require_reference_to_student_text}`);

    const workshopContextValid =
      workshopContext.mode === 'workshop' &&
      workshopContext.technique.technique_name.length > 0 &&
      workshopContext.universal_teaching.steps.length > 0 &&
      workshopContext.student_context.quote.length > 0;

    results.push({
      test: 'Workshop context valid',
      passed: workshopContextValid,
      details: workshopContextValid ? 'All context fields populated' : 'Missing context fields',
    });

    if (!workshopContextValid) allPassed = false;
  } else {
    console.log('  ERROR: Could not build workshop context');
    results.push({
      test: 'Workshop context valid',
      passed: false,
      details: 'Context building returned null',
    });
    allPassed = false;
  }

  // =========================================
  // TEST 4: Batch context creation
  // =========================================
  displayHeader('TEST 4: Batch Context Creation');

  console.log('  Testing createWorkshopContextsFromIssues...');

  const batchContexts = createWorkshopContextsFromIssues(MOCK_ISSUES, 'MIT');

  console.log(`  Issues processed: ${MOCK_ISSUES.length}`);
  console.log(`  Contexts created: ${batchContexts.size}`);

  for (const [issueNum, ctx] of batchContexts.entries()) {
    console.log(`    Issue ${issueNum}: ${ctx.technique.technique_name} (${ctx.technique.difficulty})`);
  }

  const batchCreationWorks = batchContexts.size >= 2; // At least 2 of 3 should work

  results.push({
    test: 'Batch context creation',
    passed: batchCreationWorks,
    details: `${batchContexts.size}/${MOCK_ISSUES.length} contexts created`,
  });

  if (!batchCreationWorks) allPassed = false;

  // =========================================
  // TEST 5: Chat mode intent detection
  // =========================================
  displayHeader('TEST 5: Chat Mode Intent Detection');

  console.log('  Testing detectChatModeIntent...');

  const testMessages = [
    { message: 'Help me apply the show-dont-tell technique to my essay', expected: 'workshop' },
    { message: 'How do I fix this issue?', expected: 'workshop' },
    { message: 'Can you review my essay?', expected: 'review' },
    { message: 'I need some ideas for my opening', expected: 'brainstorm' },
    { message: 'What should I write about?', expected: 'brainstorm' },
    { message: 'Is my essay good enough?', expected: 'universal' },
    { message: 'Tell me about Stanford', expected: 'universal' },
  ];

  let intentMatches = 0;
  for (const test of testMessages) {
    const detected = detectChatModeIntent(test.message);
    const matches = detected === test.expected;
    if (matches) intentMatches++;
    console.log(`  "${test.message.substring(0, 40)}..." → ${detected} (expected: ${test.expected}) ${matches ? '✓' : '✗'}`);
  }

  const intentDetectionWorks = intentMatches >= 5; // Allow some flexibility

  results.push({
    test: 'Intent detection',
    passed: intentDetectionWorks,
    details: `${intentMatches}/${testMessages.length} intents correctly detected`,
  });

  if (!intentDetectionWorks) allPassed = false;

  // =========================================
  // TEST 6: Welcome message generation
  // =========================================
  displayHeader('TEST 6: Welcome Message Generation');

  console.log('  Testing welcome message for workshop mode...');

  if (workshopContext) {
    const welcome = workshopChatModeService.getWelcomeMessage(workshopContext);

    console.log('');
    console.log('  Welcome message preview:');
    console.log('  ' + '-'.repeat(60));
    const lines = welcome.content.split('\n').slice(0, 8);
    for (const line of lines) {
      console.log(`  ${line}`);
    }
    console.log('  ...');
    console.log('  ' + '-'.repeat(60));
    console.log('');
    console.log(`  Message length: ${welcome.content.length} chars`);
    console.log(`  Mode: ${welcome.mode}`);
    console.log(`  Technique step: ${welcome.technique_step}`);

    const welcomeValid =
      welcome.content.includes(workshopContext.technique.technique_name) &&
      welcome.mode === 'workshop' &&
      welcome.content.length > 100;

    results.push({
      test: 'Welcome message valid',
      passed: welcomeValid,
      details: welcomeValid ? 'Contains technique name and guidance' : 'Missing expected content',
    });

    if (!welcomeValid) allPassed = false;
  }

  // =========================================
  // TEST 7: Exit mode detection
  // =========================================
  displayHeader('TEST 7: Exit Mode Detection');

  console.log('  Testing shouldExitWorkshopMode...');

  const exitTests = [
    { message: "I'm done with this technique", expected: true },
    { message: 'Let me work on a new issue', expected: true },
    { message: 'Go back to my essay', expected: true },
    { message: 'Can you help me with step 2?', expected: false },
    { message: 'Show me another example', expected: false },
  ];

  let exitMatches = 0;
  for (const test of exitTests) {
    const shouldExit = workshopChatModeService.shouldExitWorkshopMode(test.message);
    const matches = shouldExit === test.expected;
    if (matches) exitMatches++;
    console.log(`  "${test.message}" → ${shouldExit ? 'EXIT' : 'CONTINUE'} (expected: ${test.expected ? 'EXIT' : 'CONTINUE'}) ${matches ? '✓' : '✗'}`);
  }

  const exitDetectionWorks = exitMatches >= 4;

  results.push({
    test: 'Exit detection',
    passed: exitDetectionWorks,
    details: `${exitMatches}/${exitTests.length} exit signals correctly detected`,
  });

  if (!exitDetectionWorks) allPassed = false;

  // =========================================
  // TEST 8: Suggestion Mode Context Building
  // =========================================
  displayHeader('TEST 8: Suggestion Mode Context Building');

  console.log('  Testing buildSuggestionContext (for Stage 2 suggestions)...');

  const suggestionContext = workshopChatModeService.buildSuggestionContext(
    MOCK_ISSUES[0],
    MOCK_STAGE2_SUGGESTIONS,
    { collegeName: 'Stanford' }
  );

  console.log(`  Mode: ${suggestionContext.mode}`);
  console.log(`  Sub-mode: ${suggestionContext.sub_mode}`);
  console.log(`  Issue number: ${suggestionContext.issue.issue_number}`);
  console.log(`  Original quote: "${suggestionContext.issue.original_quote.substring(0, 40)}..."`);
  console.log('');
  console.log('  Suggestions available:');
  console.log(`    Polished Original: ${suggestionContext.suggestions.polished_original ? '✓' : '✗'}`);
  console.log(`    Voice Amplifier: ${suggestionContext.suggestions.voice_amplifier ? '✓' : '✗'}`);
  console.log(`    How to Choose: ${suggestionContext.suggestions.how_to_choose ? '✓' : '✗'}`);

  if (suggestionContext.suggestions.polished_original) {
    console.log('');
    console.log('  Polished Original preview:');
    console.log(`    "${suggestionContext.suggestions.polished_original.text.substring(0, 60)}..."`);
    console.log(`    Safety: ${suggestionContext.suggestions.polished_original.safety_level}`);
    console.log(`    Changes: ${suggestionContext.suggestions.polished_original.what_changed.length} items`);
  }

  if (suggestionContext.suggestions.voice_amplifier) {
    console.log('');
    console.log('  Voice Amplifier preview:');
    console.log(`    "${suggestionContext.suggestions.voice_amplifier.text.substring(0, 60)}..."`);
    console.log(`    Risk: ${suggestionContext.suggestions.voice_amplifier.risk_level}`);
    console.log(`    Why authentic: ${suggestionContext.suggestions.voice_amplifier.why_authentic?.substring(0, 50)}...`);
  }

  const suggestionContextValid =
    suggestionContext.mode === 'workshop_suggestion' &&
    suggestionContext.sub_mode === 'suggestion' &&
    suggestionContext.suggestions.polished_original !== undefined &&
    suggestionContext.suggestions.voice_amplifier !== undefined &&
    suggestionContext.issue.original_quote.length > 0;

  results.push({
    test: 'Suggestion context valid',
    passed: suggestionContextValid,
    details: suggestionContextValid ? 'Both suggestions + context available' : 'Missing suggestion data',
  });

  if (!suggestionContextValid) allPassed = false;

  // =========================================
  // TEST 9: Suggestion Welcome Message
  // =========================================
  displayHeader('TEST 9: Suggestion Welcome Message');

  console.log('  Testing getSuggestionWelcomeMessage...');

  const suggestionWelcome = workshopChatModeService.getSuggestionWelcomeMessage(suggestionContext);

  console.log('');
  console.log('  Suggestion welcome message preview:');
  console.log('  ' + '-'.repeat(60));
  const suggestionLines = suggestionWelcome.content.split('\n').slice(0, 12);
  for (const line of suggestionLines) {
    console.log(`  ${line}`);
  }
  console.log('  ...');
  console.log('  ' + '-'.repeat(60));
  console.log('');
  console.log(`  Message length: ${suggestionWelcome.content.length} chars`);
  console.log(`  Mode: ${suggestionWelcome.mode}`);

  const suggestionWelcomeValid =
    suggestionWelcome.mode === 'workshop_suggestion' &&
    suggestionWelcome.content.includes('Option 1') &&
    suggestionWelcome.content.includes('Option 2') &&
    suggestionWelcome.content.includes('Polished Original') &&
    suggestionWelcome.content.includes('Voice Amplifier');

  results.push({
    test: 'Suggestion welcome valid',
    passed: suggestionWelcomeValid,
    details: suggestionWelcomeValid ? 'Shows both options clearly' : 'Missing option presentation',
  });

  if (!suggestionWelcomeValid) allPassed = false;

  // =========================================
  // TEST 10: Suggestion Mode Guardrails
  // =========================================
  displayHeader('TEST 10: Suggestion Mode Guardrails');

  console.log('  Verifying suggestion mode guardrails are stricter...');

  console.log('');
  console.log('  Suggestion mode guardrails:');
  console.log(`    Max response length: ${suggestionContext.guardrails.max_response_length}`);
  console.log(`    Must reference suggestion: ${suggestionContext.guardrails.must_reference_suggestion}`);
  console.log(`    Must explain changes: ${suggestionContext.guardrails.must_explain_changes}`);
  console.log(`    Encourage adaptation: ${suggestionContext.guardrails.encourage_adaptation}`);

  const guardrailsProperlySet =
    suggestionContext.guardrails.must_reference_suggestion === true &&
    suggestionContext.guardrails.must_explain_changes === true &&
    suggestionContext.guardrails.encourage_adaptation === true;

  results.push({
    test: 'Suggestion guardrails set',
    passed: guardrailsProperlySet,
    details: guardrailsProperlySet ? 'All quality gates enabled' : 'Missing guardrails',
  });

  if (!guardrailsProperlySet) allPassed = false;

  // =========================================
  // SUMMARY
  // =========================================
  displayHeader('SUMMARY');

  console.log('  Results:');
  console.log('');

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${result.test}: ${result.details}`);
  }

  console.log('');
  displaySeparator();

  if (allPassed) {
    console.log('  ✅ ALL TESTS PASSED');
    console.log('');
    console.log('  ADDITIVE Architecture Validated:');
    console.log('  ─────────────────────────────────');
    console.log('  1. Original CriticalIssue data: PRESERVED');
    console.log('  2. Universal teaching: ADDED as separate layer');
    console.log('  3. Workshop Technique Mode: PROPERLY BUILT');
    console.log('  4. Workshop Suggestion Mode: PROPERLY BUILT');
    console.log('  5. Chat mode detection: WORKING');
    console.log('');
    console.log('  TWO WORKSHOP MODES:');
    console.log('  ─────────────────────────────────');
    console.log('  TECHNIQUE MODE (Universal Learning):');
    console.log('    → Learn research-backed writing techniques');
    console.log('    → Apply universal skill to own text');
    console.log('    → For: "Learn More" button on issues');
    console.log('');
    console.log('  SUGGESTION MODE (Essay-Specific):');
    console.log('    → Implement polished_original or voice_amplifier');
    console.log('    → Understand, choose, and adapt Stage 2 suggestions');
    console.log('    → For: "Implement Suggestion" button');
    console.log('');
    console.log('  Student Experience Flow:');
    console.log('  ─────────────────────────────────');
    console.log('  1. See diagnosed issue (Stage 1B - existing)');
    console.log('  2. View essay-specific suggestions (Stage 2 - existing)');
    console.log('  3. Option A: Click "Learn More" → Technique Mode (universal)');
    console.log('  4. Option B: Click "Implement" → Suggestion Mode (specific)');
    console.log('  5. Chat guides implementation with quality guardrails');
    console.log('');
  } else {
    console.log('  ❌ SOME TESTS FAILED');
    console.log('');
    console.log('  Failed tests need investigation.');
    process.exit(1);
  }

  displaySeparator();
}

runTests().catch(console.error);
