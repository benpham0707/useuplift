/**
 * Diverse Editing Progressions Test
 *
 * Tests 3 distinct editing scenarios with different natural progressions:
 *
 * 1. STORYTELLING PROGRESSION (Telling Not Showing)
 *    - Student needs to find and develop a specific moment
 *    - Natural arc: vague → memory surfaced → scene developed → polished
 *
 * 2. RESEARCH-BASED PROGRESSION (Why Us Essay)
 *    - Student needs to connect interests to specific school resources
 *    - Natural arc: generic praise → surface research → deep connection → integrated
 *
 * 3. STRUCTURAL PROGRESSION (Weak Opening)
 *    - Student needs to restructure, not add more story
 *    - Natural arc: chronological → identify key moment → reorder → refined hook
 *
 * Each progression is 4-5 turns showing realistic student responses
 * and how the AI coach adapts its guidance accordingly.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { WorkshopChatModeService, WorkshopModeContext, WorkshopChatMessage } from '../src/services/commonAppWorkshop/services/workshopChatMode';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

// ============================================================================
// SCENARIO DEFINITIONS
// ============================================================================

interface EditingScenario {
  name: string;
  progressionType: 'storytelling' | 'research' | 'structural';
  description: string;
  issue: CriticalIssue;
  college: string;
  // Each turn: what the student says and what we expect from the AI
  turns: Array<{
    studentMessage: string;
    expectedCoachingFocus: string[];  // What the AI should emphasize
    shouldNotMention: string[];       // What would be inappropriate
  }>;
}

const SCENARIOS: EditingScenario[] = [
  // ========================================
  // SCENARIO 1: STORYTELLING PROGRESSION
  // ========================================
  {
    name: "Maya's Environmental Science Essay",
    progressionType: 'storytelling',
    description: "Student with 'telling not showing' issue. Needs to surface a specific memory and develop it into a vivid scene.",
    issue: {
      issue_number: 1,
      symptom_type: 'telling_not_showing',
      quote: "I am passionate about environmental science and want to make a difference in the world.",
      location: "opening paragraph",
      problem: "You're telling the reader about your passion rather than showing it through a specific moment.",
      why_matters: "Admissions officers read thousands of essays claiming passion. Showing makes yours memorable.",
      how_to_fix: "Find a specific moment when you felt that passion and describe what happened.",
      severity: 'major' as const,
    },
    college: "stanford",
    turns: [
      {
        studentMessage: "I guess I've always cared about the environment. I recycle and try to be sustainable.",
        expectedCoachingFocus: [
          "specific moment", "when", "where", "what happened",
          "dig deeper", "memory", "time"
        ],
        shouldNotMention: [
          "sensory details", "five senses", "imagery",  // Too early - no scene yet
          "polish", "word choice"  // Way too early
        ]
      },
      {
        studentMessage: "Oh, there was this one time in 10th grade. We did a water testing project for bio class and I found out the creek behind school had really high nitrate levels. I was pretty upset about it.",
        expectedCoachingFocus: [
          "that moment", "creek", "nitrate", "testing",
          "what did you see", "how did you feel", "what happened next",
          "specific", "scene"
        ],
        shouldNotMention: [
          "structure", "thesis", "conclusion",  // Wrong focus
          "other moments"  // Don't change direction - this is gold
        ]
      },
      {
        studentMessage: "I remember I was kneeling by the creek with the test kit. The water looked totally normal, clear and everything. But when the strip changed color... it was way darker than it should have been. I just sat there staring at it.",
        expectedCoachingFocus: [
          "perfect", "exactly", "this is it",
          "kneeling", "test kit", "color changed",
          "what were you thinking", "what did this mean to you",
          "expand", "build on this"
        ],
        shouldNotMention: [
          "find another moment",  // No! This is the moment
          "more examples"  // Don't dilute it
        ]
      },
      {
        studentMessage: "Here's my revised opening: 'The water looked clear enough to drink. Sunlight caught the ripples as I knelt on the muddy bank, test strip in hand. When the color darkened past the safe zone, I felt my stomach drop. This creek had been my shortcut home since middle school.'",
        expectedCoachingFocus: [
          "strong", "vivid", "specific",
          "sunlight", "muddy bank", "stomach drop",
          "polish", "tighten", "word choice",
          "next sentence", "transition"
        ],
        shouldNotMention: [
          "find a moment",  // Already found
          "what happened",  // Already showing
          "be more specific"  // It IS specific now
        ]
      }
    ]
  },

  // ========================================
  // SCENARIO 2: RESEARCH-BASED PROGRESSION
  // ========================================
  {
    name: "Priya's Duke Why Us Essay",
    progressionType: 'research',
    description: "Student with generic 'Why Us' essay. Needs to connect specific interests to specific school resources.",
    issue: {
      issue_number: 2,
      symptom_type: 'generic_why_us',
      quote: "I want to attend Duke because of its prestigious reputation and strong academics.",
      location: "opening",
      problem: "This could describe any top school. It fails the 'swap test' - you could replace 'Duke' with any university name.",
      why_matters: "Admissions officers want to see you've done real research and have genuine fit.",
      how_to_fix: "Connect YOUR specific intellectual question to Duke's specific resources.",
      severity: 'major' as const,
    },
    college: "duke",
    turns: [
      {
        studentMessage: "I mean, Duke has a great biology program and I want to be pre-med. The campus is also really beautiful.",
        expectedCoachingFocus: [
          "specific", "which part of biology", "what question",
          "professor", "lab", "research", "program",
          "your interest", "intellectual curiosity"
        ],
        shouldNotMention: [
          "scene", "moment", "show don't tell",  // Wrong technique for this issue
          "sensory details"  // Not a storytelling problem
        ]
      },
      {
        studentMessage: "I've been really interested in how the microbiome affects mental health. I read about the gut-brain axis. I think Duke has some labs working on this?",
        expectedCoachingFocus: [
          "gut-brain axis", "microbiome", "mental health",
          "which labs", "specific professor", "research",
          "dig deeper", "Duke specifically"
        ],
        shouldNotMention: [
          "tell a story",  // Not the right approach
          "childhood memory"  // Wrong direction
        ]
      },
      {
        studentMessage: "I looked it up - Professor Lawrence David's lab does microbiome research! And there's this DukeEngage program in global health. Plus I could take classes at the medical school.",
        expectedCoachingFocus: [
          "Lawrence David", "DukeEngage", "connection",
          "your question", "how this connects", "what you'd do",
          "specific", "only at Duke"
        ],
        shouldNotMention: [
          "more research",  // They've done enough
          "find another program"  // Don't overwhelm
        ]
      },
      {
        studentMessage: "Here's my revised version: 'The question that keeps me up at night: can changing gut bacteria change how we think? Professor Lawrence David's microbiome research at Duke is exactly where I want to explore this. Through DukeEngage, I could study how diet and mental health intersect in communities without access to diverse nutrition.'",
        expectedCoachingFocus: [
          "strong", "specific", "connection",
          "unique to Duke", "your voice",
          "polish", "tighten", "flow"
        ],
        shouldNotMention: [
          "add more programs",  // Don't list-stuff
          "mention rankings"  // Stay specific
        ]
      }
    ]
  },

  // ========================================
  // SCENARIO 3: STRUCTURAL PROGRESSION
  // ========================================
  {
    name: "Jake's Piano Essay Restructure",
    progressionType: 'structural',
    description: "Student with chronological structure. Needs to reorder, not add more content.",
    issue: {
      issue_number: 3,
      symptom_type: 'weak_opening',
      quote: "When I was six, I started playing piano. By age ten, I was competing. At fourteen, I won my first regional award.",
      location: "opening",
      problem: "Chronological structure makes readers wait for the interesting part. This reads like a timeline, not a story.",
      why_matters: "Admissions officers stop reading if the first sentences don't hook them.",
      how_to_fix: "Start at the moment of highest tension, then spiral out to context.",
      severity: 'major' as const,
    },
    college: "juilliard",
    turns: [
      {
        studentMessage: "But this is how it happened? I started young, then got better, then won. That's the natural order.",
        expectedCoachingFocus: [
          "natural order", "reader experience", "hook",
          "most interesting moment", "tension", "stakes",
          "start in the middle", "in medias res"
        ],
        shouldNotMention: [
          "add more detail",  // Not about adding, about reordering
          "sensory details",  // Not yet - structure first
          "more memories"  // Not the issue
        ]
      },
      {
        studentMessage: "I guess the most intense moment was right before I went on stage at regionals. I was 14 and my hands were shaking. I could see my parents in the front row.",
        expectedCoachingFocus: [
          "that's it", "before going on stage", "hands shaking",
          "start here", "open with this", "tension",
          "parents in front row", "14", "regionals"
        ],
        shouldNotMention: [
          "another moment",  // This is the right one
          "more context first"  // Context comes after hook
        ]
      },
      {
        studentMessage: "So instead of starting at age 6, I should start at age 14 backstage? But then how do I explain how I got there?",
        expectedCoachingFocus: [
          "exactly", "backstage", "open there",
          "weave in", "context later", "flashback",
          "earn the backstory", "after the hook"
        ],
        shouldNotMention: [
          "chronological is fine",  // It's not
          "add more history"  // Less history, better placement
        ]
      },
      {
        studentMessage: "Okay, here's my new opening: 'My hands wouldn't stop shaking. In three minutes, I'd walk onto the Kimmel Center stage in front of four hundred people, including my parents in the front row. Eight years of six AM practice sessions, of skipped birthday parties, of my grandmother's voice saying 'again, from the top' - all of it came down to the next seven minutes.'",
        expectedCoachingFocus: [
          "excellent", "strong hook", "tension",
          "Kimmel Center", "four hundred people", "eight years",
          "grandmother", "specific details",
          "polish", "rhythm", "next paragraph"
        ],
        shouldNotMention: [
          "restructure",  // Already restructured well
          "start earlier",  // No - this is right
          "add context"  // Has enough now
        ]
      }
    ]
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface TurnResult {
  turn: number;
  studentMessage: string;
  aiResponse: string;
  analysis: {
    expectedFound: string[];
    expectedMissing: string[];
    inappropriateFound: string[];
    responseLength: number;
    asksQuestion: boolean;
    hasCitations: boolean;
  };
  passed: boolean;
}

interface ScenarioResult {
  scenario: string;
  progressionType: string;
  description: string;
  welcomeMessage: string;
  turns: TurnResult[];
  overallPassed: boolean;
  summary: {
    turnsWithExpectedFocus: number;
    turnsWithInappropriate: number;
    totalExpectedFound: number;
    totalExpectedMissing: number;
  };
}

async function runScenario(scenario: EditingScenario): Promise<ScenarioResult> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${scenario.name}`);
  console.log(`  Type: ${scenario.progressionType.toUpperCase()}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  ${scenario.description}\n`);

  const service = new WorkshopChatModeService();

  // Build context using the service's helper
  const context = service.buildWorkshopContext(scenario.issue, scenario.college);
  if (!context) {
    console.log('     ❌ Error: Failed to build workshop context');
    return {
      scenario: scenario.name,
      progressionType: scenario.progressionType,
      description: scenario.description,
      welcomeMessage: '',
      turns: [],
      overallPassed: false,
      summary: { turnsWithExpectedFocus: 0, turnsWithInappropriate: 0, totalExpectedFound: 0, totalExpectedMissing: 0 }
    };
  }

  const history: WorkshopChatMessage[] = [];
  const turnResults: TurnResult[] = [];

  // Initial AI message (Turn 0) - use getWelcomeMessage
  console.log('  🤖 TURN 0 (Initial Welcome):');
  const welcomeMessage = service.getWelcomeMessage(context);
  const initialMessage = welcomeMessage.content;
  console.log(`     "${initialMessage.substring(0, 100)}..."`);

  // Add welcome message to history
  history.push(welcomeMessage);

  // Process each turn
  for (let i = 0; i < scenario.turns.length; i++) {
    const turn = scenario.turns[i];
    const turnNum = i + 1;

    console.log(`\n  👤 TURN ${turnNum} (Student):`);
    console.log(`     "${turn.studentMessage.substring(0, 80)}${turn.studentMessage.length > 80 ? '...' : ''}"`);

    // Add student message to history
    history.push({ role: 'user', content: turn.studentMessage, timestamp: Date.now() });

    // Get AI response using the correct request format
    const response = await service.sendWorkshopMessage({
      userMessage: turn.studentMessage,
      context,
      conversationHistory: history.slice(0, -1), // Pass history without the current message
    });

    if (!response.message) {
      console.log(`     ❌ Error: No response from AI`);
      turnResults.push({
        turn: turnNum,
        studentMessage: turn.studentMessage,
        aiResponse: 'Error: No response',
        analysis: {
          expectedFound: [],
          expectedMissing: turn.expectedCoachingFocus,
          inappropriateFound: [],
          responseLength: 0,
          asksQuestion: false,
          hasCitations: false,
        },
        passed: false
      });
      continue;
    }

    const aiMessage = response.message.content;
    history.push(response.message);

    // Analyze response
    const responseLower = aiMessage.toLowerCase();
    const expectedFound = turn.expectedCoachingFocus.filter(term =>
      responseLower.includes(term.toLowerCase())
    );
    const expectedMissing = turn.expectedCoachingFocus.filter(term =>
      !responseLower.includes(term.toLowerCase())
    );
    const inappropriateFound = turn.shouldNotMention.filter(term =>
      responseLower.includes(term.toLowerCase())
    );

    const asksQuestion = aiMessage.includes('?');
    const hasCitations = aiMessage.includes('<sup>') || aiMessage.includes('[1]');

    // Determine if turn passed
    // Pass if: found at least 2 expected terms AND no inappropriate terms
    const passed = expectedFound.length >= 2 && inappropriateFound.length === 0;

    console.log(`\n  🤖 TURN ${turnNum} (AI):`);
    console.log(`     "${aiMessage.substring(0, 120)}..."`);
    console.log(`\n     Analysis:`);
    console.log(`     ✓ Expected found (${expectedFound.length}/${turn.expectedCoachingFocus.length}): ${expectedFound.slice(0, 4).join(', ')}${expectedFound.length > 4 ? '...' : ''}`);
    if (expectedMissing.length > 0) {
      console.log(`     ○ Not found: ${expectedMissing.slice(0, 3).join(', ')}${expectedMissing.length > 3 ? '...' : ''}`);
    }
    if (inappropriateFound.length > 0) {
      console.log(`     ✗ Inappropriate: ${inappropriateFound.join(', ')}`);
    }
    console.log(`     ${asksQuestion ? '❓ Asks follow-up question' : '○ No question'}`);
    console.log(`     ${hasCitations ? '📚 Has citations' : '○ No citations'}`);
    console.log(`     ${passed ? '✅ PASS' : '⚠️  NEEDS ATTENTION'}`);

    turnResults.push({
      turn: turnNum,
      studentMessage: turn.studentMessage,
      aiResponse: aiMessage,
      analysis: {
        expectedFound,
        expectedMissing,
        inappropriateFound,
        responseLength: aiMessage.length,
        asksQuestion,
        hasCitations,
      },
      passed
    });
  }

  // Calculate summary
  const turnsWithExpectedFocus = turnResults.filter(t => t.analysis.expectedFound.length >= 2).length;
  const turnsWithInappropriate = turnResults.filter(t => t.analysis.inappropriateFound.length > 0).length;
  const totalExpectedFound = turnResults.reduce((sum, t) => sum + t.analysis.expectedFound.length, 0);
  const totalExpectedMissing = turnResults.reduce((sum, t) => sum + t.analysis.expectedMissing.length, 0);

  const overallPassed = turnsWithExpectedFocus >= Math.ceil(turnResults.length * 0.75) && turnsWithInappropriate === 0;

  console.log(`\n  ${'─'.repeat(60)}`);
  console.log(`  SCENARIO RESULT: ${overallPassed ? '✅ PASSED' : '❌ NEEDS WORK'}`);
  console.log(`  - Turns with good focus: ${turnsWithExpectedFocus}/${turnResults.length}`);
  console.log(`  - Turns with inappropriate content: ${turnsWithInappropriate}`);
  console.log(`  ${'─'.repeat(60)}`);

  return {
    scenario: scenario.name,
    progressionType: scenario.progressionType,
    description: scenario.description,
    welcomeMessage: initialMessage,
    turns: turnResults,
    overallPassed,
    summary: {
      turnsWithExpectedFocus,
      turnsWithInappropriate,
      totalExpectedFound,
      totalExpectedMissing,
    }
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  DIVERSE EDITING PROGRESSIONS TEST');
  console.log('█'.repeat(70));
  console.log('\nTesting 3 distinct editing scenarios with different natural progressions.\n');

  const results: ScenarioResult[] = [];
  const fullReport: string[] = [];

  fullReport.push('# Full Conversation Outputs - Diverse Editing Progressions');
  fullReport.push('');
  fullReport.push('> Generated: ' + new Date().toISOString());
  fullReport.push('');
  fullReport.push('---');
  fullReport.push('');

  for (const scenario of SCENARIOS) {
    try {
      const result = await runScenario(scenario);
      results.push(result);
    } catch (error) {
      console.error(`\n❌ Error in scenario ${scenario.name}:`, error);
      results.push({
        scenario: scenario.name,
        progressionType: scenario.progressionType,
        description: scenario.description,
        welcomeMessage: '',
        turns: [],
        overallPassed: false,
        summary: { turnsWithExpectedFocus: 0, turnsWithInappropriate: 0, totalExpectedFound: 0, totalExpectedMissing: 0 }
      });
    }
  }

  // Generate full report markdown
  for (const result of results) {
    fullReport.push(`## ${result.scenario}`);
    fullReport.push('');
    fullReport.push(`**Progression Type:** ${result.progressionType.toUpperCase()}`);
    fullReport.push('');
    fullReport.push(`**Description:** ${result.description}`);
    fullReport.push('');
    fullReport.push('---');
    fullReport.push('');

    // Welcome message
    fullReport.push('### 🤖 WELCOME MESSAGE (Turn 0)');
    fullReport.push('');
    fullReport.push(result.welcomeMessage || '*No welcome message*');
    fullReport.push('');
    fullReport.push('---');
    fullReport.push('');

    // Each turn
    for (const turn of result.turns) {
      fullReport.push(`### 👤 STUDENT (Turn ${turn.turn})`);
      fullReport.push('');
      fullReport.push(`> ${turn.studentMessage}`);
      fullReport.push('');
      fullReport.push(`### 🤖 AI COACH RESPONSE (Turn ${turn.turn})`);
      fullReport.push('');
      fullReport.push(turn.aiResponse);
      fullReport.push('');
      fullReport.push('**Analysis:**');
      fullReport.push(`- Expected terms found: ${turn.analysis.expectedFound.join(', ') || 'none'}`);
      fullReport.push(`- Asks question: ${turn.analysis.asksQuestion ? 'Yes' : 'No'}`);
      fullReport.push(`- Has citations: ${turn.analysis.hasCitations ? 'Yes' : 'No'}`);
      if (turn.analysis.inappropriateFound.length > 0) {
        fullReport.push(`- ⚠️ Inappropriate terms: ${turn.analysis.inappropriateFound.join(', ')}`);
      }
      fullReport.push('');
      fullReport.push('---');
      fullReport.push('');
    }

    fullReport.push('');
  }

  // Write the full report
  const fs = await import('fs');
  const reportPath = '/Users/tuepham/uplift-final-final-18698-62030/DIVERSE_EDITING_PROGRESSIONS_RESULTS.md';
  fs.writeFileSync(reportPath, fullReport.join('\n'));
  console.log(`\n📄 Full conversation report saved to: ${reportPath}`);

  // Final Summary
  console.log('\n\n' + '█'.repeat(70));
  console.log('  FINAL SUMMARY');
  console.log('█'.repeat(70));

  const passed = results.filter(r => r.overallPassed).length;
  const total = results.length;

  console.log('\n┌' + '─'.repeat(58) + '┐');
  console.log('│ PROGRESSION TYPE          │ SCENARIO                │ RESULT │');
  console.log('├' + '─'.repeat(58) + '┤');

  for (const result of results) {
    const type = result.progressionType.padEnd(24);
    const name = result.scenario.substring(0, 22).padEnd(22);
    const status = result.overallPassed ? '  ✅  ' : '  ❌  ';
    console.log(`│ ${type} │ ${name} │${status}│`);
  }

  console.log('└' + '─'.repeat(58) + '┘');

  console.log(`\n📊 Overall: ${passed}/${total} scenarios passed`);

  // Key Insights
  console.log('\n' + '═'.repeat(70));
  console.log('  KEY INSIGHTS BY PROGRESSION TYPE');
  console.log('═'.repeat(70));

  for (const result of results) {
    console.log(`\n📝 ${result.progressionType.toUpperCase()}: ${result.scenario}`);
    if (result.turns.length > 0) {
      const avgExpected = (result.summary.totalExpectedFound / result.turns.length).toFixed(1);
      const inappropriate = result.summary.turnsWithInappropriate;
      console.log(`   - Average expected terms found per turn: ${avgExpected}`);
      console.log(`   - Turns with inappropriate content: ${inappropriate}`);

      // Show progression of focus across turns
      console.log('   - Focus progression:');
      for (const turn of result.turns) {
        const focusTerms = turn.analysis.expectedFound.slice(0, 3).join(', ');
        console.log(`     Turn ${turn.turn}: ${focusTerms || '(none matched)'}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(70));
  if (passed === total) {
    console.log('  ✅ ALL PROGRESSIONS VALIDATED');
    console.log('     AI adapts coaching focus appropriately for each edit type');
  } else {
    console.log('  ⚠️  SOME PROGRESSIONS NEED ATTENTION');
    console.log('     Review the scenarios above for specific issues');
  }
  console.log('═'.repeat(70) + '\n');

  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);
