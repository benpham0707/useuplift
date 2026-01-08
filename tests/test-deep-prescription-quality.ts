/**
 * Deep Prescription Quality Test
 *
 * Tests that prescriptions are:
 * 1. Essay-specific (references actual essay content)
 * 2. Actionable (clear steps, not vague advice)
 * 3. Credible (backed by admissions sources)
 * 4. Educational (teaches transferable principles)
 * 5. Complete (before/after examples, time estimates)
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-deep-prescription-quality.ts
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import { generateClicheIssues } from '../src/services/commonAppWorkshop/services/clicheIssueIntegration';
import { generateDeepPrescription, generateAllDeepPrescriptions } from '../src/services/commonAppWorkshop/services/deepPrescriptionGenerator';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ============================================================================
// TEST ESSAYS
// ============================================================================

const TEST_ESSAYS = {
  debugging_essay: {
    label: "Debugging Essay (has specific moments)",
    text: `The first time I debugged code for 14 hours straight, I forgot to eat.
My mom found me at 3 AM, cursor blinking on line 847 of a sorting algorithm
that refused to sort. "This is unhealthy," she said. She was right.

But I couldn't stop. There's something about the moment when broken code
finally runs that I'm addicted to. This experience taught me the importance
of perseverance and showed me that I am passionate about computer science.`,
    collegeId: "stanford",
    expectedReferences: ["14 hours", "3 AM", "line 847", "mom"],
  },

  stanford_why_essay: {
    label: "Stanford Why Essay (uses website language)",
    text: `Stanford's intellectual vitality has always inspired me. Ever since I was a child,
I've been passionate about learning and innovation. When I visited Silicon Valley,
I realized that Stanford is my dream school because of its entrepreneurial spirit.

I want to study computer science because I'm fascinated by technology. The interdisciplinary
approach at Stanford matches my passion for combining different fields. I believe that
with hard work and determination, I can change the world through innovation.`,
    collegeId: "stanford",
    expectedIssues: ["cliche_topic_framing", "cliche_narrative_arc", "cliche_college_specific"],
  },
};

// ============================================================================
// QUALITY SCORING
// ============================================================================

interface PrescriptionScore {
  essay_specificity: number;     // Does it reference the actual essay? (0-5)
  actionability: number;         // Are the steps clear and doable? (0-5)
  credibility: number;           // Is it backed by sources? (0-5)
  educational_value: number;     // Does it teach a principle? (0-5)
  completeness: number;          // Does it have all components? (0-5)
  total: number;                 // Total out of 25
  grade: string;
}

function scorePrescription(
  prescription: any,
  essayText: string,
  expectedReferences?: string[]
): PrescriptionScore {
  let essay_specificity = 0;
  let actionability = 0;
  let credibility = 0;
  let educational_value = 0;
  let completeness = 0;

  // 1. Essay Specificity (0-5)
  // Does the prescription reference actual essay content?
  const prescriptionJson = JSON.stringify(prescription).toLowerCase();

  if (expectedReferences) {
    const referencesFound = expectedReferences.filter(ref =>
      prescriptionJson.includes(ref.toLowerCase())
    ).length;
    essay_specificity = Math.min(5, Math.round((referencesFound / expectedReferences.length) * 5));
  } else {
    // Check for any essay-specific content
    const hasTimeRef = /\d+\s*(?:AM|PM|hours?|minutes?)/.test(prescriptionJson);
    const hasQuote = prescriptionJson.includes('"') && prescriptionJson.length > 100;
    const hasSpecificNumber = /\d{2,}/.test(prescriptionJson);
    essay_specificity = (hasTimeRef ? 2 : 0) + (hasQuote ? 2 : 0) + (hasSpecificNumber ? 1 : 0);
  }

  // 2. Actionability (0-5)
  // Are there clear steps?
  if (prescription.steps && prescription.steps.length > 0) {
    actionability += 2;
    // Are steps specific?
    const stepsHaveExamples = prescription.steps.filter((s: any) => s.example).length;
    actionability += Math.min(2, stepsHaveExamples);
    // Are there tips?
    const stepsHaveTips = prescription.steps.filter((s: any) => s.tip).length;
    actionability += Math.min(1, stepsHaveTips > 0 ? 1 : 0);
  }

  // 3. Credibility (0-5)
  // Is it backed by sources?
  if (prescription.why_this_matters?.source) {
    credibility += 3;
    if (prescription.why_this_matters.source.author) credibility += 1;
    if (prescription.why_this_matters.source.publication) credibility += 1;
  } else if (prescription.why_this_matters?.admissions_insight) {
    credibility += 2;
  }

  // 4. Educational Value (0-5)
  // Does it teach a principle?
  if (prescription.principle) {
    educational_value += 2;
    if (prescription.principle.explanation && prescription.principle.explanation.length > 50) {
      educational_value += 2;
    }
    if (prescription.principle.applies_to && prescription.principle.applies_to.length > 0) {
      educational_value += 1;
    }
  }

  // 5. Completeness (0-5)
  // Does it have all components?
  if (prescription.action) completeness += 1;
  if (prescription.example?.before && prescription.example?.after) completeness += 2;
  if (prescription.common_mistakes && prescription.common_mistakes.length > 0) completeness += 1;
  if (prescription.time_estimate) completeness += 0.5;
  if (prescription.difficulty) completeness += 0.5;

  const total = essay_specificity + actionability + credibility + educational_value + completeness;
  let grade = 'F';
  if (total >= 23) grade = 'A+';
  else if (total >= 21) grade = 'A';
  else if (total >= 18) grade = 'B';
  else if (total >= 15) grade = 'C';
  else if (total >= 12) grade = 'D';

  return {
    essay_specificity,
    actionability,
    credibility,
    educational_value,
    completeness,
    total,
    grade,
  };
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log(`  ${BOLD}DEEP PRESCRIPTION QUALITY TEST${RESET}`);
  console.log('  Testing prescription depth, specificity, and credibility');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${RED}✗ ANTHROPIC_API_KEY not set${RESET}`);
    process.exit(1);
  }

  let totalScore = 0;
  let totalTests = 0;

  for (const [key, testCase] of Object.entries(TEST_ESSAYS)) {
    console.log('\n' + '═'.repeat(70));
    console.log(`${CYAN}${BOLD}TEST: ${testCase.label}${RESET}`);
    console.log('═'.repeat(70));

    try {
      // Run cliché analysis
      const analysis = await semanticClicheAnalyzer.analyze(
        testCase.text,
        { college_id: testCase.collegeId }
      );

      // Generate issues
      const issues = generateClicheIssues(analysis, {
        collegeId: testCase.collegeId,
        essayText: testCase.text,
        maxIssues: 3,
        minRiskScore: 30,
      });

      console.log(`\n${YELLOW}Found ${issues.length} issues${RESET}`);

      // Generate deep prescriptions for all issues
      const prescriptions = generateAllDeepPrescriptions(
        issues,
        testCase.text,
        { collegeId: testCase.collegeId }
      );

      // Score each prescription
      let issueNum = 1;
      for (const [num, prescription] of prescriptions.entries()) {
        console.log('\n' + '─'.repeat(50));
        console.log(`${BOLD}Issue #${num}: ${issues.find(i => i.issue_number === num)?.symptom_type}${RESET}`);
        console.log('─'.repeat(50));

        const score = scorePrescription(
          prescription,
          testCase.text,
          (testCase as any).expectedReferences
        );

        console.log(`\n${YELLOW}QUALITY SCORE: ${score.total}/25 (${score.grade})${RESET}`);
        console.log(`  Essay Specificity: ${score.essay_specificity}/5`);
        console.log(`  Actionability: ${score.actionability}/5`);
        console.log(`  Credibility: ${score.credibility}/5`);
        console.log(`  Educational Value: ${score.educational_value}/5`);
        console.log(`  Completeness: ${score.completeness}/5`);

        // Show prescription details
        console.log(`\n${CYAN}Prescription Details:${RESET}`);
        console.log(`  Action: "${prescription.action.substring(0, 80)}..."`);

        if (prescription.why_this_matters?.source) {
          console.log(`\n  ${GREEN}✓ Has admissions source:${RESET}`);
          console.log(`    "${prescription.why_this_matters.source.quote.substring(0, 60)}..."`);
          console.log(`    — ${prescription.why_this_matters.source.author}, ${prescription.why_this_matters.source.title}`);
        }

        if (prescription.steps && prescription.steps.length > 0) {
          console.log(`\n  ${GREEN}✓ Has ${prescription.steps.length} actionable steps${RESET}`);
          prescription.steps.slice(0, 2).forEach((step: any) => {
            console.log(`    ${step.number}. ${step.action.substring(0, 60)}...`);
          });
        }

        if (prescription.example?.before && prescription.example?.after) {
          console.log(`\n  ${GREEN}✓ Has before/after example${RESET}`);
          console.log(`    Before: "${prescription.example.before.substring(0, 50)}..."`);
          console.log(`    After: "${prescription.example.after.substring(0, 50)}..."`);
        }

        if (prescription.principle) {
          console.log(`\n  ${GREEN}✓ Has teaching principle: "${prescription.principle.name}"${RESET}`);
        }

        totalScore += score.total;
        totalTests++;
        issueNum++;
      }

    } catch (error) {
      console.log(`${RED}✗ Error: ${error}${RESET}`);
    }
  }

  // Summary
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}SUMMARY${RESET}`);
  console.log('═'.repeat(70));

  const avgScore = totalTests > 0 ? totalScore / totalTests : 0;
  const avgGrade = avgScore >= 23 ? 'A+' : avgScore >= 21 ? 'A' : avgScore >= 18 ? 'B' : avgScore >= 15 ? 'C' : 'D';

  console.log(`\n  Average Score: ${avgScore.toFixed(1)}/25 (${avgGrade})`);
  console.log(`  Tests Run: ${totalTests}`);

  if (avgScore >= 21) {
    console.log(`\n${GREEN}${BOLD}✓ PRESCRIPTIONS ARE PRODUCTION-READY${RESET}`);
    console.log(`\n${DIM}The system now provides:${RESET}`);
    console.log(`  • Essay-specific prescriptions that reference actual content`);
    console.log(`  • Research-backed credibility with admissions officer quotes`);
    console.log(`  • Step-by-step actionable guidance`);
    console.log(`  • Before/after examples showing the transformation`);
    console.log(`  • Teaching principles that transfer to other essays`);
  } else if (avgScore >= 18) {
    console.log(`\n${YELLOW}⚠️ PRESCRIPTIONS ARE GOOD BUT COULD BE IMPROVED${RESET}`);
  } else {
    console.log(`\n${RED}✗ PRESCRIPTIONS NEED MORE WORK${RESET}`);
  }

  // Show example of what a full prescription looks like
  console.log('\n' + '─'.repeat(70));
  console.log(`${CYAN}EXAMPLE: Full Deep Prescription Output${RESET}`);
  console.log('─'.repeat(70));

  const exampleAnalysis = await semanticClicheAnalyzer.analyze(
    TEST_ESSAYS.debugging_essay.text,
    { college_id: 'stanford' }
  );

  const exampleIssues = generateClicheIssues(exampleAnalysis, {
    collegeId: 'stanford',
    essayText: TEST_ESSAYS.debugging_essay.text,
    maxIssues: 1,
    minRiskScore: 30,
  });

  if (exampleIssues.length > 0) {
    const examplePrescription = generateDeepPrescription(
      exampleIssues[0],
      TEST_ESSAYS.debugging_essay.text,
      { collegeId: 'stanford' }
    );

    console.log(JSON.stringify(examplePrescription, null, 2));
  }
}

runTests().catch(console.error);
