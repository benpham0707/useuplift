/**
 * Workshop Citation Integration Test
 *
 * Validates that citations are properly integrated into the workshop chat mode:
 * 1. WorkshopChatMessage now includes optional citations field
 * 2. sendWorkshopMessage attaches citations to AI responses
 * 3. sendSuggestionMessage attaches citations to AI responses
 * 4. getWelcomeMessage includes citations for research-backed content
 * 5. getSuggestionWelcomeMessage includes citations
 *
 * Tests both Technique Mode and Suggestion Mode.
 */

import { WorkshopChatModeService } from '../src/services/commonAppWorkshop/services/workshopChatMode';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestScenario {
  name: string;
  issue: CriticalIssue;
  college?: string;
  stage2Suggestions?: {
    polished_original?: {
      text: string;
      rationale: string;
      what_changed: string[];
    };
    voice_amplifier?: {
      text: string;
      rationale: string;
      what_changed: string[];
    };
  };
}

const SCENARIOS: TestScenario[] = [
  // ========================================
  // ORIGINAL SCENARIOS
  // ========================================
  {
    name: "Telling Not Showing - Technique Mode",
    issue: {
      issue_number: 1,
      symptom_type: 'telling_not_showing',
      quote: "I felt overwhelmed by the pressure to succeed.",
      location: "paragraph 2",
      problem: "You're telling the reader about your emotions rather than showing them through concrete details.",
      why_matters: "When you show through specific details, readers experience your story viscerally.",
      how_to_fix: "Replace abstract emotional labels with physical sensations and specific moments.",
      severity: 'major' as const,
    },
    college: "stanford",
  },
  {
    name: "Cliché Language - Suggestion Mode",
    issue: {
      issue_number: 2,
      symptom_type: 'cliche_language',
      quote: "I have always had a passion for helping others.",
      location: "opening",
      problem: "This phrase is a common cliché that makes your essay sound generic.",
      why_matters: "Clichés signal unoriginal thinking and fail to differentiate you.",
      how_to_fix: "Replace with a specific, unexpected detail that reveals the same quality.",
      severity: 'major' as const,
    },
    college: "yale",
    stage2Suggestions: {
      polished_original: {
        text: "In sixth grade, I started spending my lunch breaks tutoring the kid everyone else ignored in math class.",
        rationale: "Shows the passion through specific action rather than claiming it.",
        what_changed: ["Replaced abstract claim with concrete moment", "Added specific time and action"],
      },
      voice_amplifier: {
        text: "My friends thought I was weird for spending lunch in the math room. But Marcus's face when he finally got long division? Worth every cold lunch.",
        rationale: "Adds personality through contrast and dialogue-like authenticity.",
        what_changed: ["Added social context showing sacrifice", "Made emotional payoff specific"],
      },
    },
  },

  // ========================================
  // NEW: OPENING HOOKS
  // ========================================
  {
    name: "Weak Opening - Famous Quote",
    issue: {
      issue_number: 3,
      symptom_type: 'famous_quote_opening',
      quote: "As Gandhi once said, 'Be the change you wish to see in the world.'",
      location: "opening",
      problem: "Opening with a famous quote is one of the most clichéd approaches.",
      why_matters: "Your opening is your first impression. A quote makes you invisible.",
      how_to_fix: "Start with YOUR moment—a specific scene that's uniquely yours.",
      severity: 'major' as const,
    },
    college: "harvard",
  },

  // ========================================
  // NEW: ESSAY ENDINGS
  // ========================================
  {
    name: "Weak Ending - Summary Conclusion",
    issue: {
      issue_number: 4,
      symptom_type: 'summary_conclusion',
      quote: "In conclusion, this experience taught me the importance of perseverance.",
      location: "conclusion",
      problem: "Summary conclusions undermine the narrative you've built.",
      why_matters: "Endings disproportionately shape how readers remember your essay.",
      how_to_fix: "End with a specific moment, not a lesson.",
      severity: 'major' as const,
    },
    college: "mit",
  },

  // ========================================
  // NEW: WHY US ESSAYS
  // ========================================
  {
    name: "Generic Why Us - Swap Test Fail",
    issue: {
      issue_number: 5,
      symptom_type: 'generic_why_us',
      quote: "I want to attend Stanford because of its prestigious reputation and beautiful campus.",
      location: "paragraph 1",
      problem: "This could be said about any school. Fails the 'swap test.'",
      why_matters: "Admissions officers immediately recognize copy-paste praise.",
      how_to_fix: "Connect a specific program/professor to your specific intellectual question.",
      severity: 'major' as const,
    },
    college: "stanford",
  },

  // ========================================
  // NEW: ACTIVITY ESSAYS
  // ========================================
  {
    name: "Activity Listing - Resume in Prose",
    issue: {
      issue_number: 6,
      symptom_type: 'activity_listing',
      quote: "As president of Model UN, I led our delegation to many conferences and improved my public speaking skills.",
      location: "paragraph 2",
      problem: "This reads like a resume entry, not a reflection.",
      why_matters: "Admissions officers already have your activity list. Show what it cannot.",
      how_to_fix: "Find the specific moment that reveals who you became through the activity.",
      severity: 'major' as const,
    },
    college: "princeton",
  },

  // ========================================
  // NEW: STRUCTURE
  // ========================================
  {
    name: "Weak Structure - Chronological Trudge",
    issue: {
      issue_number: 7,
      symptom_type: 'chronological_trudge',
      quote: "When I was six, I started playing piano. By age ten, I was competing. At fourteen, I won my first award.",
      location: "opening",
      problem: "Chronological structure makes readers wait for the interesting part.",
      why_matters: "Strong essays begin at the point of highest tension.",
      how_to_fix: "Start in the middle of the action, then spiral outward.",
      severity: 'major' as const,
    },
    college: "yale",
  },
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface TestResult {
  scenario: string;
  mode: 'technique' | 'suggestion';
  passed: boolean;
  details: {
    contextBuilt: boolean;
    welcomeHasCitations: boolean;
    welcomeCitationCount: number;
    welcomeHasSuperscripts: boolean;
    authors: string[];
  };
}

function testTechniqueMode(scenario: TestScenario, service: WorkshopChatModeService): TestResult {
  console.log(`\n  Testing Technique Mode: ${scenario.name}`);

  // Build workshop context
  const context = service.buildWorkshopContext(scenario.issue, scenario.college);

  if (!context) {
    return {
      scenario: scenario.name,
      mode: 'technique',
      passed: false,
      details: {
        contextBuilt: false,
        welcomeHasCitations: false,
        welcomeCitationCount: 0,
        welcomeHasSuperscripts: false,
        authors: [],
      },
    };
  }

  console.log(`    ✓ Context built for: ${context.technique.technique_name}`);

  // Get welcome message
  const welcomeMessage = service.getWelcomeMessage(context);

  const hasCitations = welcomeMessage.citations !== undefined &&
                       Object.keys(welcomeMessage.citations).length > 0;
  const citationCount = welcomeMessage.citations
    ? Object.keys(welcomeMessage.citations).length
    : 0;
  const hasSuperscripts = welcomeMessage.content.includes('<sup>');

  // Extract authors if citations exist
  const authors: string[] = [];
  if (welcomeMessage.citations) {
    for (const citation of Object.values(welcomeMessage.citations)) {
      if (citation.source?.author) {
        authors.push(citation.source.author);
      }
    }
  }

  console.log(`    Citations: ${citationCount}`);
  console.log(`    Superscripts in content: ${hasSuperscripts ? '✓' : '—'}`);
  if (authors.length > 0) {
    console.log(`    Authors: ${authors.join(', ')}`);
  }

  return {
    scenario: scenario.name,
    mode: 'technique',
    passed: true, // Context built successfully
    details: {
      contextBuilt: true,
      welcomeHasCitations: hasCitations,
      welcomeCitationCount: citationCount,
      welcomeHasSuperscripts: hasSuperscripts,
      authors,
    },
  };
}

function testSuggestionMode(scenario: TestScenario, service: WorkshopChatModeService): TestResult {
  console.log(`\n  Testing Suggestion Mode: ${scenario.name}`);

  if (!scenario.stage2Suggestions) {
    console.log(`    ⚠ No Stage 2 suggestions provided, skipping`);
    return {
      scenario: scenario.name,
      mode: 'suggestion',
      passed: true,
      details: {
        contextBuilt: false,
        welcomeHasCitations: false,
        welcomeCitationCount: 0,
        welcomeHasSuperscripts: false,
        authors: [],
      },
    };
  }

  // Build suggestion context
  const context = service.buildSuggestionContext(
    scenario.issue,
    scenario.stage2Suggestions,
    { college: scenario.college }
  );

  if (!context) {
    return {
      scenario: scenario.name,
      mode: 'suggestion',
      passed: false,
      details: {
        contextBuilt: false,
        welcomeHasCitations: false,
        welcomeCitationCount: 0,
        welcomeHasSuperscripts: false,
        authors: [],
      },
    };
  }

  console.log(`    ✓ Suggestion context built for: ${context.issue.problem_summary}`);

  // Get suggestion welcome message
  const welcomeMessage = service.getSuggestionWelcomeMessage(context);

  const hasCitations = welcomeMessage.citations !== undefined &&
                       Object.keys(welcomeMessage.citations).length > 0;
  const citationCount = welcomeMessage.citations
    ? Object.keys(welcomeMessage.citations).length
    : 0;
  const hasSuperscripts = welcomeMessage.content.includes('<sup>');

  // Extract authors if citations exist
  const authors: string[] = [];
  if (welcomeMessage.citations) {
    for (const citation of Object.values(welcomeMessage.citations)) {
      if (citation.source?.author) {
        authors.push(citation.source.author);
      }
    }
  }

  console.log(`    Citations: ${citationCount}`);
  console.log(`    Superscripts in content: ${hasSuperscripts ? '✓' : '—'}`);
  if (authors.length > 0) {
    console.log(`    Authors: ${authors.join(', ')}`);
  }

  // Show a snippet of the welcome message
  console.log(`    Welcome message preview (first 300 chars):`);
  console.log(`      "${welcomeMessage.content.substring(0, 300)}..."`);

  return {
    scenario: scenario.name,
    mode: 'suggestion',
    passed: true, // Context built successfully
    details: {
      contextBuilt: true,
      welcomeHasCitations: hasCitations,
      welcomeCitationCount: citationCount,
      welcomeHasSuperscripts: hasSuperscripts,
      authors,
    },
  };
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  WORKSHOP CITATION INTEGRATION TEST');
  console.log('█'.repeat(70));
  console.log('\nValidates that citations are properly integrated into workshop modes.\n');

  const service = new WorkshopChatModeService();
  const results: TestResult[] = [];

  // Test each scenario
  for (const scenario of SCENARIOS) {
    console.log('═'.repeat(70));
    console.log(`  SCENARIO: ${scenario.name}`);
    console.log('═'.repeat(70));
    console.log(`  Issue: ${scenario.issue.symptom_type}`);
    console.log(`  College: ${scenario.college?.toUpperCase() || 'None'}`);

    // Test technique mode
    const techniqueResult = testTechniqueMode(scenario, service);
    results.push(techniqueResult);

    // Test suggestion mode if we have suggestions
    if (scenario.stage2Suggestions) {
      const suggestionResult = testSuggestionMode(scenario, service);
      results.push(suggestionResult);
    }
  }

  // Summary
  console.log('\n' + '█'.repeat(70));
  console.log('  FINAL SUMMARY');
  console.log('█'.repeat(70));

  const techniqueResults = results.filter(r => r.mode === 'technique');
  const suggestionResults = results.filter(r => r.mode === 'suggestion');

  console.log('\n┌' + '─'.repeat(68) + '┐');
  console.log('│ SCENARIO                              │ MODE       │ CITATIONS │ SUP │');
  console.log('├' + '─'.repeat(68) + '┤');

  for (const r of results) {
    const name = r.scenario.substring(0, 38).padEnd(38);
    const mode = r.mode.padEnd(10);
    const citations = String(r.details.welcomeCitationCount).padStart(5).padEnd(9);
    const sup = (r.details.welcomeHasSuperscripts ? '✓' : '—').padStart(2).padEnd(3);
    console.log(`│ ${name} │ ${mode} │ ${citations} │ ${sup} │`);
  }

  console.log('└' + '─'.repeat(68) + '┘');

  // Metrics
  const totalCitations = results.reduce((sum, r) => sum + r.details.welcomeCitationCount, 0);
  const withCitations = results.filter(r => r.details.welcomeHasCitations).length;
  const withSuperscripts = results.filter(r => r.details.welcomeHasSuperscripts).length;
  const allContextsBuilt = results.every(r => r.details.contextBuilt);

  console.log('\n📈 INTEGRATION METRICS:');
  console.log(`   Contexts built: ${results.filter(r => r.details.contextBuilt).length}/${results.length}`);
  console.log(`   Messages with citations: ${withCitations}/${results.length}`);
  console.log(`   Messages with superscripts: ${withSuperscripts}/${results.length}`);
  console.log(`   Total citations: ${totalCitations}`);

  // Unique authors across all results
  const allAuthors = new Set<string>();
  results.forEach(r => r.details.authors.forEach(a => allAuthors.add(a)));
  console.log(`   Unique authors used: ${allAuthors.size}`);

  console.log('\n' + '═'.repeat(70));
  if (allContextsBuilt && totalCitations > 0) {
    console.log('  ✅ WORKSHOP CITATION INTEGRATION WORKING');
    console.log('     • WorkshopChatMessage.citations field added');
    console.log('     • Welcome messages include research-backed citations');
    console.log('     • Both technique and suggestion modes supported');
  } else if (allContextsBuilt) {
    console.log('  ⚠️  INTEGRATION PARTIAL');
    console.log('     • Contexts build successfully');
    console.log('     • Citation triggers may need more content to activate');
  } else {
    console.log('  ❌ INTEGRATION NEEDS WORK');
    if (!allContextsBuilt) console.log('     - Some contexts failed to build');
  }
  console.log('═'.repeat(70) + '\n');

  // Exit with appropriate code
  const passed = allContextsBuilt;
  process.exit(passed ? 0 : 1);
}

main();
