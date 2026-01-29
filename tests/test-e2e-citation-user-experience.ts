/**
 * End-to-End Citation User Experience Test
 *
 * Validates the ACTUAL user experience when receiving feedback with citations:
 * 1. Student submits an essay with issues
 * 2. System generates feedback with research-backed citations
 * 3. User sees superscripts in feedback text
 * 4. Clicking a citation shows: the quote + source info
 *
 * SIMPLIFIED: No 3-level expansion nonsense. Just quote + source.
 */

import { CitationAttacher, FeedbackWithCitations, CitationDisplayData } from '../src/services/commonAppWorkshop/services/citationAttacher';
import { CitationTriggerDetector } from '../src/services/commonAppWorkshop/services/citationTriggerDetector';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface UserScenario {
  name: string;
  issueType: string;
  college: string;
  feedback: {
    problem: string;
    why_matters: string;
    how_to_fix: string;
  };
}

const SCENARIOS: UserScenario[] = [
  {
    name: "Telling Not Showing",
    issueType: "telling_not_showing",
    college: "stanford",
    feedback: {
      problem: "Your essay tells the reader about your emotions rather than showing them through concrete details. Phrases like 'I felt overwhelmed' and 'It was a transformative experience' are abstract statements that don't let the reader experience the moment with you.",
      why_matters: "Admissions officers read thousands of essays. When you show through specific sensory details, readers experience your story viscerally. When you tell, they remain distant observers. Research shows concrete details activate mirror neurons, making readers feel what you felt.",
      how_to_fix: "Replace abstract emotional labels with physical sensations and specific moments. Instead of 'I felt nervous,' try 'My hands trembled as I gripped the podium, my voice catching on the first word.' Ground every emotion in a specific, observable moment.",
    },
  },
  {
    name: "Weak Essay Opening",
    issueType: "famous_quote_opening",
    college: "harvard",
    feedback: {
      problem: "Your essay opens with a famous quote from Gandhi. This is one of the most cliched openings that admissions officers see. It signals that you're relying on someone else's words rather than your own voice.",
      why_matters: "Your opening is your first impression. Admissions officers often decide within seconds whether an essay will be compelling. A quote opening makes you invisible - the reader remembers Gandhi, not you.",
      how_to_fix: "Start with YOUR moment - a specific scene, a line of dialogue, a sensory detail that's uniquely yours. Drop the reader into the middle of the action.",
    },
  },
  {
    name: "Weak Essay Ending",
    issueType: "summary_conclusion",
    college: "mit",
    feedback: {
      problem: "Your essay ends with a summary conclusion: 'In conclusion, this experience taught me the importance of perseverance.' This academic-style ending undermines the personal narrative you've built.",
      why_matters: "Research on the peak-end rule shows that endings disproportionately shape how readers remember your entire essay. A summary conclusion tells readers you don't trust them to understand your point.",
      how_to_fix: "End with a specific moment, not a lesson. Return to an image or detail from your opening with new meaning. Let the reader feel the resolution rather than being told about it.",
    },
  },
  {
    name: "Surface-Level Reflection",
    issueType: "surface_level_reflection",
    college: "yale",
    feedback: {
      problem: "Your reflection stays at the surface level with statements like 'This experience changed me' without showing HOW or in what specific ways. The insight feels generic.",
      why_matters: "Admissions officers look for intellectual vitality and self-awareness. Surface reflections suggest you haven't deeply processed your experiences. They want to see nuanced thinking that shows emotional intelligence.",
      how_to_fix: "Push past the first layer of reflection. Ask yourself 'What specifically changed?' then 'Why did that matter?' The most authentic insights often feel uncomfortable to share.",
    },
  },
];

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function formatSuperscripts(text: string): string {
  return text.replace(/<sup>(\d+)<\/sup>/g, '[$1]');
}

function printDivider(char = '─', length = 70) {
  console.log(char.repeat(length));
}

function printHeader(title: string) {
  console.log('\n' + '█'.repeat(70));
  console.log(`  ${title}`);
  console.log('█'.repeat(70));
}

function printSubHeader(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface ScenarioResult {
  success: boolean;
  citationCount: number;
  hasSuperscripts: boolean;
  hasValidQuotes: boolean;
  hasSourceInfo: boolean;
}

async function runScenario(scenario: UserScenario): Promise<ScenarioResult> {
  printSubHeader(`SCENARIO: ${scenario.name}`);
  console.log(`College: ${scenario.college.toUpperCase()}`);
  console.log(`Issue Type: ${scenario.issueType}`);

  // Step 1: Detect triggers
  const detector = new CitationTriggerDetector();
  const triggers = detector.detectTriggers(scenario.feedback, {
    college_id: scenario.college,
    essay_type: 'personal_statement',
    issue_type: scenario.issueType,
  });

  console.log(`\n📍 Triggers detected: ${triggers.length}`);
  const triggerTypes = [...new Set(triggers.map(t => t.type))];
  console.log(`   Types: ${triggerTypes.join(', ')}`);

  // Step 2: Attach citations
  const attacher = new CitationAttacher();
  const result = attacher.attachCitations(
    scenario.feedback,
    triggers,
    {
      college_id: scenario.college,
      essay_type: 'personal_statement',
      issue_type: scenario.issueType,
      severity: 'major',
    }
  );

  const citationCount = Object.keys(result.citations).length;
  const hasSuperscripts = result.problem.includes('<sup>') ||
                          result.why_matters.includes('<sup>') ||
                          result.how_to_fix.includes('<sup>');

  console.log(`📎 Citations attached: ${citationCount}`);
  console.log(`   Superscripts in text: ${hasSuperscripts ? '✓' : '✗'}`);

  // Step 3: Show what user sees
  printDivider();
  console.log('  📱 WHAT THE USER SEES:');
  printDivider();

  console.log('\n🔴 PROBLEM:');
  console.log(formatSuperscripts(result.problem));

  console.log('\n🟡 WHY IT MATTERS:');
  console.log(formatSuperscripts(result.why_matters));

  console.log('\n🟢 HOW TO FIX:');
  console.log(formatSuperscripts(result.how_to_fix));

  // Step 4: Show citation details (simplified)
  let hasValidQuotes = true;
  let hasSourceInfo = true;

  if (citationCount > 0) {
    printDivider();
    console.log('  📚 WHEN USER CLICKS A CITATION:');
    printDivider();

    for (const [num, citation] of Object.entries(result.citations)) {
      console.log(`\n  [${num}] ─────────────────────────────────────────────────`);

      // The quote (what we're citing)
      const quote = citation.quote || '';
      if (quote && quote.length > 10) {
        console.log(`\n  💬 QUOTE:`);
        console.log(`     "${quote.length > 200 ? quote.substring(0, 197) + '...' : quote}"`);
      } else {
        hasValidQuotes = false;
        console.log(`\n  💬 QUOTE: [MISSING]`);
      }

      // Source info
      const source = citation.source;
      if (source && source.author) {
        console.log(`\n  📖 SOURCE:`);
        console.log(`     ${source.author}`);
        if (source.title) console.log(`     ${source.title}`);
        if (source.publication) console.log(`     ${source.publication}${source.year ? ` (${source.year})` : ''}`);
        if (source.url) console.log(`     🔗 ${source.url}`);
      } else {
        hasSourceInfo = false;
        console.log(`\n  📖 SOURCE: [MISSING]`);
      }

      // Why relevant (brief)
      if (citation.relevance) {
        console.log(`\n  💡 WHY RELEVANT:`);
        console.log(`     ${citation.relevance}`);
      }
    }
  }

  // Summary
  printDivider();
  console.log('  📊 RESULT:');
  printDivider();
  console.log(`   Citations: ${citationCount}`);
  console.log(`   Superscripts: ${hasSuperscripts ? '✓' : '✗'}`);
  console.log(`   Valid quotes: ${hasValidQuotes ? '✓' : '✗'}`);
  console.log(`   Source info: ${hasSourceInfo ? '✓' : '✗'}`);

  const success = citationCount > 0 && hasSuperscripts && hasValidQuotes && hasSourceInfo;
  console.log(`\n   ${success ? '✅ PASSED' : '❌ NEEDS WORK'}`);

  return {
    success,
    citationCount,
    hasSuperscripts,
    hasValidQuotes,
    hasSourceInfo,
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  printHeader('CITATION USER EXPERIENCE TEST');
  console.log('\nValidates: superscripts in feedback + quote/source on click\n');

  const results: Array<{ name: string } & ScenarioResult> = [];

  for (const scenario of SCENARIOS) {
    const result = await runScenario(scenario);
    results.push({ name: scenario.name, ...result });
  }

  // Final summary
  printHeader('FINAL RESULTS');

  console.log('\n┌' + '─'.repeat(66) + '┐');
  console.log('│ SCENARIO                    │ CITATIONS │ QUOTES │ SOURCES │ PASS │');
  console.log('├' + '─'.repeat(66) + '┤');

  for (const r of results) {
    const name = r.name.padEnd(27);
    const citations = String(r.citationCount).padStart(5).padEnd(9);
    const quotes = (r.hasValidQuotes ? '✓' : '✗').padStart(3).padEnd(6);
    const sources = (r.hasSourceInfo ? '✓' : '✗').padStart(4).padEnd(7);
    const pass = (r.success ? '✓' : '✗').padStart(2).padEnd(4);
    console.log(`│ ${name} │ ${citations} │ ${quotes} │ ${sources} │ ${pass} │`);
  }

  console.log('└' + '─'.repeat(66) + '┘');

  const totalCitations = results.reduce((sum, r) => sum + r.citationCount, 0);
  const allPassed = results.every(r => r.success);

  console.log('\n📈 SUMMARY:');
  console.log(`   Total citations: ${totalCitations}`);
  console.log(`   All scenarios passed: ${allPassed ? '✓ YES' : '✗ NO'}`);

  console.log('\n' + '═'.repeat(70));
  if (allPassed) {
    console.log('  ✅ CITATION UX WORKING: Quote + Source on every citation');
  } else {
    console.log('  ⚠️  SOME CITATIONS MISSING QUOTE OR SOURCE INFO');
  }
  console.log('═'.repeat(70) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
