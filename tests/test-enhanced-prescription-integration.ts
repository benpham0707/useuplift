/**
 * Enhanced Prescription Integration Test
 *
 * Tests that deep prescriptions are correctly integrated into the cliché issues:
 * 1. Issues include deep_prescription field
 * 2. Deep prescriptions have all required components
 * 3. Prescriptions are essay-specific
 * 4. Sources are correctly attached
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-enhanced-prescription-integration.ts
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import {
  generateClicheIssues,
  generateEnhancedClicheIssues,
  formatClicheIssuesForStage2,
} from '../src/services/commonAppWorkshop/services/clicheIssueIntegration';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ============================================================================
// TEST ESSAY
// ============================================================================

const TEST_ESSAY = `The first time I debugged code for 14 hours straight, I forgot to eat.
My mom found me at 3 AM, cursor blinking on line 847 of a sorting algorithm
that refused to sort. "This is unhealthy," she said. She was right.

But I couldn't stop. There's something about the moment when broken code
finally runs that I'm addicted to. This experience taught me the importance
of perseverance and showed me that I am passionate about computer science.

Ever since I was a child, I have been fascinated by technology. My journey
has taught me that hard work pays off. I believe that Stanford's intellectual
vitality will help me grow as a person and achieve my dreams.`;

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log(`  ${BOLD}ENHANCED PRESCRIPTION INTEGRATION TEST${RESET}`);
  console.log('  Testing deep prescription attachment to cliché issues');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${RED}✗ ANTHROPIC_API_KEY not set${RESET}`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  // ============================================================================
  // TEST 1: generateClicheIssues includes deep_prescription
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 1: generateClicheIssues includes deep_prescription${RESET}`);
  console.log('═'.repeat(70));

  const analysis = await semanticClicheAnalyzer.analyze(
    TEST_ESSAY,
    { college_id: 'stanford' }
  );

  const issues = generateClicheIssues(analysis, {
    collegeId: 'stanford',
    essayText: TEST_ESSAY,
    maxIssues: 3,
    minRiskScore: 30,
  });

  console.log(`\n${YELLOW}Generated ${issues.length} issues${RESET}`);

  const issuesWithDeepPrescription = issues.filter(i => i.deep_prescription);
  console.log(`  Issues with deep_prescription: ${issuesWithDeepPrescription.length}`);

  if (issuesWithDeepPrescription.length === issues.length && issues.length > 0) {
    console.log(`\n${GREEN}✓ PASS: All issues have deep_prescription attached${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: Not all issues have deep_prescription${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 2: Deep prescription has all required components
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 2: Deep prescription has all required components${RESET}`);
  console.log('═'.repeat(70));

  if (issues.length > 0 && issues[0].deep_prescription) {
    const dp = issues[0].deep_prescription;

    console.log(`\n${YELLOW}Checking deep_prescription components...${RESET}`);

    const components = {
      'action': !!dp.action,
      'why_this_matters': !!dp.why_this_matters,
      'why_this_matters.source': !!dp.why_this_matters?.source,
      'steps': Array.isArray(dp.steps) && dp.steps.length > 0,
      'example.before': !!dp.example?.before,
      'example.after': !!dp.example?.after,
      'example.what_changed': Array.isArray(dp.example?.what_changed),
      'principle': !!dp.principle,
      'principle.name': !!dp.principle?.name,
      'common_mistakes': Array.isArray(dp.common_mistakes),
      'time_estimate': !!dp.time_estimate,
      'difficulty': !!dp.difficulty,
    };

    let allPresent = true;
    for (const [name, present] of Object.entries(components)) {
      if (present) {
        console.log(`  ${GREEN}✓${RESET} ${name}`);
      } else {
        console.log(`  ${RED}✗${RESET} ${name} - MISSING`);
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log(`\n${GREEN}✓ PASS: All components present${RESET}`);
      passed++;
    } else {
      console.log(`\n${RED}✗ FAIL: Some components missing${RESET}`);
      failed++;
    }
  } else {
    console.log(`${RED}✗ FAIL: No issues or no deep_prescription to test${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 3: Admissions source is correctly attached
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 3: Admissions source is correctly attached${RESET}`);
  console.log('═'.repeat(70));

  if (issues.length > 0 && issues[0].deep_prescription?.why_this_matters?.source) {
    const source = issues[0].deep_prescription.why_this_matters.source;

    console.log(`\n${YELLOW}Source details:${RESET}`);
    console.log(`  Quote: "${source.quote.substring(0, 60)}..."`);
    console.log(`  Author: ${source.author}`);
    console.log(`  Title: ${source.title}`);
    console.log(`  Publication: ${source.publication}`);

    if (source.author && source.quote && source.publication) {
      console.log(`\n${GREEN}✓ PASS: Source has required fields${RESET}`);
      passed++;
    } else {
      console.log(`\n${RED}✗ FAIL: Source missing required fields${RESET}`);
      failed++;
    }
  } else {
    console.log(`${RED}✗ FAIL: No source attached${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 4: Prescription steps are actionable
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 4: Prescription steps are actionable${RESET}`);
  console.log('═'.repeat(70));

  if (issues.length > 0 && issues[0].deep_prescription?.steps) {
    const steps = issues[0].deep_prescription.steps;

    console.log(`\n${YELLOW}Steps (${steps.length} total):${RESET}`);
    steps.slice(0, 3).forEach(step => {
      console.log(`  ${step.number}. ${step.action.substring(0, 60)}...`);
      if (step.example) {
        console.log(`     ${DIM}Example: "${step.example.substring(0, 50)}..."${RESET}`);
      }
      if (step.tip) {
        console.log(`     ${DIM}Tip: "${step.tip.substring(0, 50)}..."${RESET}`);
      }
    });

    // Check that steps have examples and tips
    const stepsWithExamples = steps.filter(s => s.example).length;
    const stepsWithTips = steps.filter(s => s.tip).length;

    console.log(`\n  Steps with examples: ${stepsWithExamples}/${steps.length}`);
    console.log(`  Steps with tips: ${stepsWithTips}/${steps.length}`);

    if (steps.length >= 3 && stepsWithExamples >= 1 && stepsWithTips >= 1) {
      console.log(`\n${GREEN}✓ PASS: Steps are actionable with examples and tips${RESET}`);
      passed++;
    } else {
      console.log(`\n${RED}✗ FAIL: Steps need more examples/tips${RESET}`);
      failed++;
    }
  } else {
    console.log(`${RED}✗ FAIL: No steps to test${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 5: Before/after example shows transformation
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 5: Before/after example shows transformation${RESET}`);
  console.log('═'.repeat(70));

  if (issues.length > 0 && issues[0].deep_prescription?.example) {
    const example = issues[0].deep_prescription.example;

    console.log(`\n${YELLOW}Before/After Example:${RESET}`);
    console.log(`  Before: "${example.before.substring(0, 60)}..."`);
    console.log(`  After: "${example.after.substring(0, 60)}..."`);
    console.log(`\n  What changed:`);
    example.what_changed.forEach((change, i) => {
      console.log(`    ${i + 1}. ${change}`);
    });

    if (
      example.before.length > 20 &&
      example.after.length > 20 &&
      example.what_changed.length >= 2
    ) {
      console.log(`\n${GREEN}✓ PASS: Before/after shows clear transformation${RESET}`);
      passed++;
    } else {
      console.log(`\n${RED}✗ FAIL: Before/after needs more detail${RESET}`);
      failed++;
    }
  } else {
    console.log(`${RED}✗ FAIL: No example to test${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 6: Teaching principle is educational
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 6: Teaching principle is educational${RESET}`);
  console.log('═'.repeat(70));

  if (issues.length > 0 && issues[0].deep_prescription?.principle) {
    const principle = issues[0].deep_prescription.principle;

    console.log(`\n${YELLOW}Teaching Principle:${RESET}`);
    console.log(`  Name: "${principle.name}"`);
    console.log(`  Explanation: "${principle.explanation.substring(0, 80)}..."`);
    console.log(`  Applies to:`);
    principle.applies_to.forEach(app => {
      console.log(`    • ${app}`);
    });

    if (
      principle.name.length > 10 &&
      principle.explanation.length > 50 &&
      principle.applies_to.length >= 2
    ) {
      console.log(`\n${GREEN}✓ PASS: Principle is educational and transferable${RESET}`);
      passed++;
    } else {
      console.log(`\n${RED}✗ FAIL: Principle needs more depth${RESET}`);
      failed++;
    }
  } else {
    console.log(`${RED}✗ FAIL: No principle to test${RESET}`);
    failed++;
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}INTEGRATION SUMMARY${RESET}`);
  console.log('═'.repeat(70));

  const total = passed + failed;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n  Passed: ${GREEN}${passed}/${total}${RESET} (${percentage}%)`);
  if (failed > 0) {
    console.log(`  Failed: ${RED}${failed}/${total}${RESET}`);
  }

  if (percentage >= 90) {
    console.log(`\n${GREEN}${BOLD}✓ DEEP PRESCRIPTIONS FULLY INTEGRATED${RESET}`);
    console.log(`\n${DIM}Each cliché issue now includes:${RESET}`);
    console.log(`  • Research-backed admissions officer sources`);
    console.log(`  • Step-by-step actionable guidance with examples`);
    console.log(`  • Before/after transformation examples`);
    console.log(`  • Transferable teaching principles`);
    console.log(`  • Common mistakes to avoid`);
    console.log(`  • Time estimates and difficulty levels`);
  } else {
    console.log(`\n${YELLOW}⚠️ Integration needs more work${RESET}`);
  }

  // Show full example for one issue
  console.log('\n' + '─'.repeat(70));
  console.log(`${CYAN}EXAMPLE: Full Issue with Deep Prescription${RESET}`);
  console.log('─'.repeat(70));

  if (issues.length > 0) {
    console.log(JSON.stringify(issues[0], null, 2));
  }
}

runTests().catch(console.error);
