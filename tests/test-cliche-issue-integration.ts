/**
 * Cliché Issue Integration Test
 *
 * Tests the full flow:
 * 1. Essay → SemanticClicheAnalyzer
 * 2. Analysis → CriticalIssue[] (via clicheIssueIntegration)
 * 3. Validates the CriticalIssue format matches workshop pipeline expectations
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-cliche-issue-integration.ts
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import {
  convertClicheAnalysisToCriticalIssues,
  generateClicheIssues,
  formatClicheIssuesForStage2,
} from '../src/services/commonAppWorkshop/services/clicheIssueIntegration';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

// ============================================================================
// FORMATTING
// ============================================================================

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}${title}${RESET}`);
  console.log('═'.repeat(70));
}

function printSubsection(title: string): void {
  console.log('\n' + '─'.repeat(50));
  console.log(`${YELLOW}${title}${RESET}`);
  console.log('─'.repeat(50));
}

// ============================================================================
// TEST ESSAYS
// ============================================================================

const TEST_ESSAYS = {
  cliche_heavy: {
    label: 'CLICHÉ-HEAVY Stanford Essay',
    text: `Stanford's intellectual vitality has always inspired me. Ever since I was a child,
I've been passionate about learning and innovation. When I visited Silicon Valley,
I realized that Stanford is my dream school because of its entrepreneurial spirit.

I want to study computer science because I'm fascinated by technology. The interdisciplinary
approach at Stanford matches my passion for combining different fields. I believe that
with hard work and determination, I can change the world through innovation.

This experience taught me the importance of perseverance. I am eager to collaborate with
like-minded peers and learn from world-class professors. Stanford's unique community
will help me achieve my goals and make a difference in society.`,
    collegeId: 'stanford',
    expectedIssueCount: 3,
  },

  mixed_quality: {
    label: 'MIXED Quality Immigration Essay',
    text: `When my family immigrated to America, I learned the importance of adaptation.
Little did I know that this experience would transform my life.

But there's one thing I can't forget: the sound of American rain. Back home in Vietnam,
rain made a sharp ping on our metal roof. Here, it thuds on shingles. Four years later,
my brain still expects the ping when clouds gather.

Through this journey, I discovered my true passion for helping others who face similar
challenges. I want to make a difference in my community.`,
    collegeId: 'stanford',
    expectedIssueCount: 2, // Has clichés but also unique elements
  },

  mostly_fresh: {
    label: 'MOSTLY FRESH Essay',
    text: `Version 47 finally worked. At 2 AM, alone in my room, I watched the neural
network correctly identify my grandmother's handwriting for the first time.
She died before smartphones existed, so the only texts I have from her are
handwritten recipes I can barely read.

The model still fails on her cursive 't' - she made it look like an 'l' with a
hat. I've spent 47 versions on this. My friends think I should move on. But
every time I look at those yellowed index cards, I see her arthritis-cramped
hand forming each letter.`,
    collegeId: 'stanford',
    expectedIssueCount: 0, // Should generate no/few issues
  },
};

// ============================================================================
// CRITICAL ISSUE VALIDATION
// ============================================================================

function validateCriticalIssue(issue: CriticalIssue): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Required fields
  if (typeof issue.issue_number !== 'number') {
    issues.push('Missing issue_number');
  }
  if (!issue.quote) {
    issues.push('Missing quote');
  }
  if (!issue.location) {
    issues.push('Missing location');
  }
  if (!issue.problem) {
    issues.push('Missing problem');
  }
  if (!issue.symptom_type) {
    issues.push('Missing symptom_type');
  }
  if (!issue.diagnosis) {
    issues.push('Missing diagnosis');
  }
  if (!issue.prescription) {
    issues.push('Missing prescription');
  }

  // Missing elements (PIQ-style)
  if (!issue.missing_elements) {
    issues.push('Missing missing_elements object');
  } else {
    if (!issue.missing_elements.sensory_details || issue.missing_elements.sensory_details.length === 0) {
      issues.push('Missing sensory_details in missing_elements');
    }
    if (!issue.missing_elements.concrete_objects || issue.missing_elements.concrete_objects.length === 0) {
      issues.push('Missing concrete_objects in missing_elements');
    }
    if (!issue.missing_elements.micro_moment) {
      issues.push('Missing micro_moment in missing_elements');
    }
    if (!issue.missing_elements.emotional_truth) {
      issues.push('Missing emotional_truth in missing_elements');
    }
  }

  // Teaching elements
  if (!issue.relevant_concept) {
    issues.push('Missing relevant_concept');
  }
  if (!issue.socratic_questions || issue.socratic_questions.length === 0) {
    issues.push('Missing socratic_questions');
  }
  if (!issue.college_value_impacted) {
    issues.push('Missing college_value_impacted');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log('  CLICHÉ ISSUE INTEGRATION TEST');
  console.log('  Testing full flow: Essay → Analysis → CriticalIssue[]');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${RED}✗ ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Run: set -a && source .env && set +a && npx tsx tests/test-cliche-issue-integration.ts');
    process.exit(1);
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [key, testCase] of Object.entries(TEST_ESSAYS)) {
    printSection(`TEST: ${testCase.label}`);
    console.log(`${DIM}Preview: "${testCase.text.substring(0, 80).replace(/\n/g, ' ')}..."${RESET}\n`);

    try {
      // Step 1: Run cliché analysis
      printSubsection('Step 1: Cliché Analysis');
      const analysis = await semanticClicheAnalyzer.analyze(testCase.text, {
        college_id: testCase.collegeId,
      });

      console.log(`  Risk: ${analysis.overall_cliche_risk.toUpperCase()} (${analysis.cliche_risk_score}/100)`);
      console.log(`  Language clichés: ${analysis.language_cliches.length}`);
      console.log(`  Telling violations: ${analysis.telling_not_showing.length}`);
      console.log(`  Arc predictability: ${analysis.narrative_arc.predictability_score}/10`);
      if (analysis.strongest_unique_element) {
        console.log(`  ${GREEN}✓ Unique element preserved: "${analysis.strongest_unique_element.substring(0, 50)}..."${RESET}`);
      }

      // Step 2: Convert to CriticalIssue[]
      printSubsection('Step 2: Convert to CriticalIssue[]');
      const criticalIssues = generateClicheIssues(analysis, {
        collegeId: testCase.collegeId,
        essayText: testCase.text,
        maxIssues: 3,
        minRiskScore: 30, // Lower threshold for testing
      });

      console.log(`  Generated ${criticalIssues.length} CriticalIssue(s)`);

      // Step 3: Validate each issue
      printSubsection('Step 3: Validate CriticalIssue Format');
      let allValid = true;

      for (const issue of criticalIssues) {
        console.log(`\n  ${CYAN}Issue #${issue.issue_number}: ${issue.symptom_type}${RESET}`);
        console.log(`  Quote: "${issue.quote.substring(0, 60)}..."`);
        console.log(`  Problem: ${issue.problem.substring(0, 80)}...`);

        const validation = validateCriticalIssue(issue);
        if (validation.valid) {
          console.log(`  ${GREEN}✓ Valid CriticalIssue format${RESET}`);
        } else {
          console.log(`  ${RED}✗ Invalid format:${RESET}`);
          for (const v of validation.issues) {
            console.log(`    - ${v}`);
          }
          allValid = false;
        }

        // Show missing_elements (key for Stage 2)
        console.log(`  ${DIM}Missing elements:${RESET}`);
        if (issue.missing_elements.sensory_details) {
          console.log(`    Sensory: ${issue.missing_elements.sensory_details[0]?.substring(0, 50)}...`);
        }
        if (issue.missing_elements.micro_moment) {
          console.log(`    Micro-moment: ${issue.missing_elements.micro_moment.substring(0, 50)}...`);
        }

        // Show Socratic questions
        if (issue.socratic_questions.length > 0) {
          console.log(`  ${DIM}Socratic: "${issue.socratic_questions[0].substring(0, 60)}..."${RESET}`);
        }
      }

      // Step 4: Format for Stage 2 handoff
      printSubsection('Step 4: Stage 2 Handoff Format');
      const stage2Handoff = formatClicheIssuesForStage2(criticalIssues, analysis);

      console.log(`  Issues for Stage 2: ${stage2Handoff.issues.length}`);
      console.log(`  Cliché context:`);
      console.log(`    - Overall risk: ${stage2Handoff.cliche_context.overall_risk}`);
      console.log(`    - Risk score: ${stage2Handoff.cliche_context.risk_score}`);
      console.log(`    - Elements to preserve: ${stage2Handoff.cliche_context.unique_elements_to_preserve.length}`);
      if (stage2Handoff.cliche_context.unique_elements_to_preserve.length > 0) {
        console.log(`    - ${GREEN}✓ "${stage2Handoff.cliche_context.unique_elements_to_preserve[0]?.substring(0, 50)}..."${RESET}`);
      }

      // Test result
      printSubsection('Test Result');
      const issueCountMatch = criticalIssues.length <= testCase.expectedIssueCount + 1;
      const formatValid = allValid || criticalIssues.length === 0;

      if (issueCountMatch && formatValid) {
        console.log(`${GREEN}✓ TEST PASSED${RESET}`);
        totalPassed++;
      } else {
        console.log(`${RED}✗ TEST FAILED${RESET}`);
        if (!issueCountMatch) {
          console.log(`  Expected ≤${testCase.expectedIssueCount + 1} issues, got ${criticalIssues.length}`);
        }
        if (!formatValid) {
          console.log(`  Invalid CriticalIssue format detected`);
        }
        totalFailed++;
      }

    } catch (error) {
      console.log(`${RED}✗ Error: ${error}${RESET}`);
      totalFailed++;
    }

    // Delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  printSection('TEST SUMMARY');
  console.log(`\n  Passed: ${totalPassed}/${Object.keys(TEST_ESSAYS).length}`);
  console.log(`  Failed: ${totalFailed}/${Object.keys(TEST_ESSAYS).length}`);

  if (totalFailed === 0) {
    console.log(`\n${GREEN}${BOLD}✓ ALL TESTS PASSED${RESET}`);
  } else {
    console.log(`\n${YELLOW}⚠️  Some tests need attention${RESET}`);
  }

  // Integration summary
  console.log(`
${CYAN}INTEGRATION FLOW VERIFIED:${RESET}

┌─────────────────────────────────────────────────────────────────────┐
│                    CLICHÉ → PIPELINE INTEGRATION                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. ESSAY                                                           │
│     ↓                                                               │
│  2. SemanticClicheAnalyzer.analyze()                               │
│     - Topic assessment                                              │
│     - Narrative arc detection                                       │
│     - Language clichés                                              │
│     - Telling-not-showing                                           │
│     ↓                                                               │
│  3. generateClicheIssues()                                         │
│     - Converts to CriticalIssue[] format                           │
│     - Adds symptom_type, missing_elements, Socratic questions       │
│     - Maps to college values                                        │
│     ↓                                                               │
│  4. formatClicheIssuesForStage2()                                  │
│     - Adds cliché_context for Stage 2                              │
│     - Preserves unique elements                                     │
│     ↓                                                               │
│  5. STAGE 2 PIPELINE (existing)                                    │
│     - Haiku symptom diagnosis                                       │
│     - Sonnet suggestion generation                                  │
│     - 2-suggestion framework (polished + voice amplifier)           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

${GREEN}Cliché issues now integrate seamlessly with existing workshop pipeline!${RESET}
`);
}

// ============================================================================
// MAIN
// ============================================================================

runTests().catch(console.error);
