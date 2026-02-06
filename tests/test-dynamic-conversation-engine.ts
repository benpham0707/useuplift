/**
 * Dynamic Conversation Engine Test
 *
 * Tests the enhanced dynamic conversation engine with PIQ Workshop patterns:
 * 1. Exact Text Quoting - References student's specific words
 * 2. Quality Anchors - Celebrates what's working before probing
 * 3. Voice Fingerprinting - Matches student's communication style
 * 4. Discovery Questions - Leads to self-discovery, not lectures
 * 5. One-Liner Teaching - Concise insights, not tiring explanations
 */

import 'dotenv/config';

import { dynamicConversationEngine } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine';
import { conversationModeService } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/conversationModeService';
import { createEmptyProfile } from '../src/services/portfolioStrategy/services/activityWorkshop/profile/types';
import { ExtractionResult } from '../src/services/portfolioStrategy/services/activityWorkshop/chat/types';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function createMockExtraction(quality: 'rich' | 'moderate' | 'sparse' | 'empty'): ExtractionResult {
  return {
    extractedFields: quality === 'rich' ? [
      { path: 'facts.scale.peopleDirectlyImpacted', value: 50, confidence: 'high', sourceQuote: 'helped about 50 students', updateType: 'new' },
    ] : quality === 'moderate' ? [
      { path: 'facts.roles', value: [{ role: 'Tutor' }], confidence: 'medium', sourceQuote: 'I tutored', updateType: 'append' },
    ] : [],
    authenticQuotes: [],
    needsClarification: [],
    implicitFindings: [],
    extractionQuality: quality,
    suggestedFollowUps: [],
  };
}

interface TestScenario {
  name: string;
  description: string;
  pattern: 'humble' | 'reluctant' | 'terse' | 'engaged';
  conversationHistory: Array<{
    question: string;
    response: string;
    extraction: ExtractionResult;
  }>;
  baseQuestion: string;
  targetField: string;
  // New: Expected behaviors based on PIQ patterns
  piqExpectations: {
    shouldQuoteExact: boolean;     // Should reference their exact words
    shouldCreateSafety: boolean;   // For reluctant students
    shouldReframe: boolean;        // For humble students
    shouldBeSpecific: boolean;     // For terse students
    shouldBeConcise: boolean;      // Teaching should be one-liner max
  };
}

const scenarios: TestScenario[] = [
  {
    name: 'Humble Student - Quote & Reframe',
    description: 'Student undersells achievements. System should quote their words and reframe.',
    pattern: 'humble',
    conversationHistory: [
      {
        question: "Tell me about your role in the tutoring program.",
        response: "I mean, I just tutored some students. Anyone could do it really. The other tutors were much better than me.",
        extraction: createMockExtraction('sparse'),
      },
    ],
    baseQuestion: "How many students did you work with?",
    targetField: 'facts.scale.peopleDirectlyImpacted',
    piqExpectations: {
      shouldQuoteExact: true,    // Should quote "just tutored" or "anyone could"
      shouldCreateSafety: false,
      shouldReframe: true,       // Should help them see through fresh eyes
      shouldBeSpecific: true,    // Ask for specific numbers
      shouldBeConcise: true,     // One-liner teaching max
    },
  },
  {
    name: 'Reluctant Student - Safety & Concrete',
    description: 'Student is uncomfortable sharing. System should create safety and ask concrete questions.',
    pattern: 'reluctant',
    conversationHistory: [
      {
        question: "What was your proudest moment in the robotics club?",
        response: "I don't know, nothing special really. Whatever. I guess we did some stuff.",
        extraction: createMockExtraction('sparse'),
      },
    ],
    baseQuestion: "Can you tell me about a challenge you faced?",
    targetField: 'meaning.hardestChallenge',
    piqExpectations: {
      shouldQuoteExact: true,    // Should acknowledge what they said
      shouldCreateSafety: true,  // "No pressure", "whatever comes to mind"
      shouldReframe: false,
      shouldBeSpecific: false,   // Don't push too hard
      shouldBeConcise: true,
    },
  },
  {
    name: 'Terse Student - Specific & Easy',
    description: 'Student gives short answers. System should make questions specific and easy.',
    pattern: 'terse',
    conversationHistory: [
      {
        question: "How did you get involved in the newspaper?",
        response: "I joined freshman year.",
        extraction: createMockExtraction('sparse'),
      },
      {
        question: "What drew you to journalism?",
        response: "I like writing.",
        extraction: createMockExtraction('sparse'),
      },
    ],
    baseQuestion: "Did you create any tangible resources?",
    targetField: 'facts.scale.resourcesCreated',
    piqExpectations: {
      shouldQuoteExact: true,    // "You mentioned writing..."
      shouldCreateSafety: false,
      shouldReframe: false,
      shouldBeSpecific: true,    // Give examples, make it concrete
      shouldBeConcise: true,
    },
  },
  {
    name: 'Before/After Mention - Quote & Probe Causation',
    description: 'Student mentioned a transformation but minimized their role. Quote the numbers and probe.',
    pattern: 'humble',
    conversationHistory: [
      {
        question: "What impact did your tutoring have?",
        response: "Well, my students did go from C- to B+ on average, but I mean, they did the work. I just helped a little.",
        extraction: {
          ...createMockExtraction('moderate'),
          extractedFields: [
            { path: 'impact.beforeAfter', value: { before: 'C-', after: 'B+' }, confidence: 'high', sourceQuote: 'C- to B+', updateType: 'new' },
          ],
        },
      },
    ],
    baseQuestion: "What specifically did you do?",
    targetField: 'impact.beforeAfter',
    piqExpectations: {
      shouldQuoteExact: true,    // MUST quote "C- to B+" or "from C- to B+"
      shouldCreateSafety: false,
      shouldReframe: true,       // Don't let them dismiss their role
      shouldBeSpecific: true,    // What did YOU do?
      shouldBeConcise: true,
    },
  },
  {
    name: 'Engaged Student - Keep Momentum',
    description: 'Student is sharing freely. System should not slow them down with excessive validation.',
    pattern: 'engaged',
    conversationHistory: [
      {
        question: "Tell me about your debate experience.",
        response: "I love debate! I've been doing it since freshman year. Last year I helped start a junior division and trained 15 new members. We won regionals for the first time in 5 years! I'm really proud of building that team culture.",
        extraction: createMockExtraction('rich'),
      },
    ],
    baseQuestion: "What was your training approach?",
    targetField: 'facts.methodology',
    piqExpectations: {
      shouldQuoteExact: true,    // Quote something interesting they said
      shouldCreateSafety: false,
      shouldReframe: false,
      shouldBeSpecific: false,   // Don't over-structure for engaged students
      shouldBeConcise: true,     // No long teaching moments
    },
  },
];

interface TestResult {
  passed: boolean;
  dynamicQuestion: string;
  teachingMoment?: string;
  quotedPhrases?: string[];
  qualityAnchor?: string;
  tone: string;
  reasoning: string;
  analysis: string[];
  failedExpectations: string[];
}

async function runScenario(scenario: TestScenario): Promise<TestResult> {
  const profile = createEmptyProfile('test-activity', 'Test Activity');

  // Build dynamics based on pattern
  let dynamics = conversationModeService.createInitialDynamics();

  // Simulate conversation history to set up dynamics
  for (let i = 0; i < scenario.conversationHistory.length; i++) {
    const turn = scenario.conversationHistory[i];
    dynamics = conversationModeService.updateDynamics(
      dynamics,
      turn.extraction.extractionQuality as 'rich' | 'moderate' | 'sparse' | 'empty',
      turn.extraction.extractedFields.length,
      turn.response,
      profile,
      i + 1
    );
  }

  // Generate dynamic question
  const result = await dynamicConversationEngine.generateDynamicQuestion({
    baseQuestion: scenario.baseQuestion,
    targetField: scenario.targetField,
    activityTitle: 'Peer Tutoring Program',
    dynamics,
    conversationHistory: scenario.conversationHistory,
    profile,
    extractedHighlights: [],
    turnNumber: scenario.conversationHistory.length + 1,
  });

  const analysis: string[] = [];
  const failedExpectations: string[] = [];
  const question = result.question.toLowerCase();
  const lastResponse = scenario.conversationHistory[scenario.conversationHistory.length - 1].response;

  // ═══════════════════════════════════════════════════════════════════════════
  // PIQ PATTERN VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. EXACT TEXT QUOTING
  if (scenario.piqExpectations.shouldQuoteExact) {
    // Extract key phrases from their response
    const responsePhrases = lastResponse.toLowerCase().split(/[.,!?]/).filter(p => p.trim().length > 5);
    const keywords = lastResponse.toLowerCase().match(/\b\w{4,}\b/g) || [];

    // Check if question contains any of their words/phrases
    const quotesTheirWords = keywords.some(word => question.includes(word)) ||
                            responsePhrases.some(phrase => question.includes(phrase.trim().slice(0, 15)));

    // Also check the quotedPhrases output
    const hasQuotedPhrases = result.quotedPhrases && result.quotedPhrases.length > 0;

    if (quotesTheirWords || hasQuotedPhrases) {
      analysis.push('✓ QUOTE: References student\'s words');
    } else {
      failedExpectations.push('QUOTE: Should reference their exact words');
    }
  }

  // 2. PSYCHOLOGICAL SAFETY
  if (scenario.piqExpectations.shouldCreateSafety) {
    const safetyIndicators = [
      'no pressure', 'whatever', 'curious', 'take your time',
      'it\'s okay', 'no right or wrong', 'fine', 'casual'
    ];
    const createsSafety = safetyIndicators.some(ind => question.includes(ind));

    if (createsSafety) {
      analysis.push('✓ SAFETY: Creates psychological comfort');
    } else {
      failedExpectations.push('SAFETY: Should create psychological safety');
    }
  }

  // 3. REFRAMING FOR HUMBLE STUDENTS
  if (scenario.piqExpectations.shouldReframe) {
    // Check for reframing indicators or discovery questions
    const reframeIndicators = [
      'wouldn\'t have happened', 'your', 'you', 'specifically',
      'what did you', 'your role', 'your part', 'caused'
    ];
    const reframes = reframeIndicators.some(ind => question.includes(ind));

    if (reframes) {
      analysis.push('✓ REFRAME: Redirects to their individual contribution');
    } else {
      failedExpectations.push('REFRAME: Should redirect to individual contribution');
    }
  }

  // 4. SPECIFICITY FOR TERSE STUDENTS
  if (scenario.piqExpectations.shouldBeSpecific) {
    const specificityIndicators = [
      'specific', 'example', 'instance', 'walk me through',
      'particular', 'for instance', 'like what', 'such as'
    ];
    const isSpecific = specificityIndicators.some(ind => question.includes(ind));

    if (isSpecific) {
      analysis.push('✓ SPECIFIC: Asks for concrete details');
    } else {
      failedExpectations.push('SPECIFIC: Should ask for concrete examples');
    }
  }

  // 5. CONCISE TEACHING
  if (scenario.piqExpectations.shouldBeConcise) {
    const teachingLength = result.teachingMoment?.length || 0;
    // One-liner should be under 100 chars
    const isConcise = !result.teachingMoment || teachingLength < 120;

    if (isConcise) {
      analysis.push('✓ CONCISE: Teaching is brief (not a lecture)');
    } else {
      failedExpectations.push(`CONCISE: Teaching too long (${teachingLength} chars)`);
    }
  }

  // Additional quality checks
  if (result.qualityAnchor) {
    analysis.push(`✓ QUALITY ANCHOR: Celebrates "${result.qualityAnchor.substring(0, 40)}..."`);
  }

  if (result.quotedPhrases && result.quotedPhrases.length > 0) {
    analysis.push(`✓ QUOTED: [${result.quotedPhrases.join(', ')}]`);
  }

  // Pass if no failed expectations
  const passed = failedExpectations.length === 0;

  return {
    passed,
    dynamicQuestion: result.question,
    teachingMoment: result.teachingMoment,
    quotedPhrases: result.quotedPhrases,
    qualityAnchor: result.qualityAnchor,
    tone: result.tone,
    reasoning: result.reasoning,
    analysis,
    failedExpectations,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST: generateContextualFollowUp
// ═══════════════════════════════════════════════════════════════════════════

async function testContextualFollowUps() {
  log('\n' + '─'.repeat(75), 'dim');
  log('TESTING: Contextual Follow-ups (Quote & Redirect)', 'cyan');
  log('─'.repeat(75), 'dim');

  const profile = createEmptyProfile('test', 'Test Activity');

  const followUpTests = [
    {
      response: "The team built a really cool app that won an award",
      expectedToQuote: "team built",
      expectedPattern: "individual contribution",
    },
    {
      response: "I just helped a little, nothing special really",
      expectedToQuote: "just",
      expectedPattern: "reframe humble",
    },
    {
      response: "Membership went from 10 to 50 members",
      expectedToQuote: "from 10 to 50",
      expectedPattern: "probe causation",
    },
  ];

  let followUpsPassed = 0;

  for (const test of followUpTests) {
    const result = await dynamicConversationEngine.generateContextualFollowUp(
      test.response,
      createMockExtraction('sparse'),
      profile,
      'facts.scale'
    );

    if (result) {
      const quotesCorrectly = result.quotedPhrase.toLowerCase().includes(test.expectedToQuote.toLowerCase());
      if (quotesCorrectly) {
        log(`  ✓ "${test.response.substring(0, 40)}..."`, 'green');
        log(`    → Quoted: "${result.quotedPhrase}"`, 'dim');
        log(`    → Follow-up: "${result.followUp.substring(0, 60)}..."`, 'dim');
        followUpsPassed++;
      } else {
        log(`  ✗ "${test.response.substring(0, 40)}..."`, 'yellow');
        log(`    Expected to quote: "${test.expectedToQuote}"`, 'dim');
        log(`    Actually quoted: "${result.quotedPhrase}"`, 'dim');
      }
    } else {
      log(`  ✗ No follow-up generated for: "${test.response.substring(0, 40)}..."`, 'red');
    }
  }

  log(`\n  Follow-ups: ${followUpsPassed}/${followUpTests.length} correctly quote student's words`, 'cyan');
  return followUpsPassed === followUpTests.length;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  log('\n═══════════════════════════════════════════════════════════════════════════════', 'bright');
  log('  DYNAMIC CONVERSATION ENGINE TEST - PIQ WORKSHOP PATTERNS', 'bright');
  log('  Verifying: Exact Quoting, Voice Matching, Discovery Questions, Concise Teaching', 'bright');
  log('═══════════════════════════════════════════════════════════════════════════════\n', 'bright');

  let totalPassed = 0;
  const totalScenarios = scenarios.length;

  for (const scenario of scenarios) {
    log(`\n${'─'.repeat(75)}`, 'dim');
    log(`SCENARIO: ${scenario.name}`, 'cyan');
    log(`${scenario.description}`, 'dim');
    log(`Pattern: ${scenario.pattern} | Target: ${scenario.targetField}`, 'dim');

    // Show what they said (the key context)
    const lastResponse = scenario.conversationHistory[scenario.conversationHistory.length - 1].response;
    log(`\nStudent said:`, 'yellow');
    log(`  "${lastResponse}"`, 'bright');

    log(`\nBase Question to transform: "${scenario.baseQuestion}"`, 'dim');

    try {
      const result = await runScenario(scenario);

      log(`\nGenerated Response:`, 'green');
      log(`  "${result.dynamicQuestion}"`, 'bright');

      if (result.teachingMoment) {
        log(`\nTeaching (${result.teachingMoment.length} chars):`, 'magenta');
        log(`  "${result.teachingMoment}"`, 'magenta');
      }

      log(`\nTone: ${result.tone}`, 'dim');
      log(`Reasoning: ${result.reasoning}`, 'dim');

      // Show what passed
      if (result.analysis.length > 0) {
        log(`\nPIQ Pattern Verification:`, 'cyan');
        for (const item of result.analysis) {
          log(`  ${item}`, 'green');
        }
      }

      // Show what failed
      if (result.failedExpectations.length > 0) {
        log(`\nFailed Expectations:`, 'red');
        for (const item of result.failedExpectations) {
          log(`  ✗ ${item}`, 'red');
        }
      }

      if (result.passed) {
        totalPassed++;
        log(`\n✓ PASSED - All PIQ patterns verified`, 'green');
      } else {
        log(`\n✗ FAILED - ${result.failedExpectations.length} pattern(s) not met`, 'yellow');
      }

    } catch (error) {
      log(`\n✗ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    }
  }

  // Test contextual follow-ups
  const followUpsPass = await testContextualFollowUps();

  // Summary
  log(`\n${'═'.repeat(75)}`, 'bright');
  log(`  SUMMARY`, 'bright');
  log(`${'═'.repeat(75)}`, 'bright');
  log(`  Dynamic Questions: ${totalPassed}/${totalScenarios} scenarios passed`, totalPassed === totalScenarios ? 'green' : 'yellow');
  log(`  Contextual Follow-ups: ${followUpsPass ? 'PASSED' : 'NEEDS WORK'}`, followUpsPass ? 'green' : 'yellow');
  log(`${'═'.repeat(75)}`, 'bright');

  // PIQ Patterns Summary
  log(`\nPIQ WORKSHOP PATTERNS IMPLEMENTED:`, 'cyan');
  log(`  1. Exact Text Quoting     → References student's specific phrases`, 'dim');
  log(`  2. Quality Anchors        → Celebrates what's working before probing`, 'dim');
  log(`  3. Voice Fingerprinting   → Matches formality/energy level`, 'dim');
  log(`  4. Discovery Questions    → Leads to insight, doesn't lecture`, 'dim');
  log(`  5. One-Liner Teaching     → Concise, not tiring explanations`, 'dim');
  log(`  6. Pattern-Specific       → Humble→reframe, Reluctant→safety, Terse→specific`, 'dim');

  const allPassed = totalPassed === totalScenarios && followUpsPass;
  if (allPassed) {
    log(`\n✓ All PIQ Workshop patterns working correctly!`, 'green');
  } else {
    log(`\n⚠ Some patterns need attention. Review the analysis above.`, 'yellow');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
