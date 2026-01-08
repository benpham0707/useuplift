/**
 * HONEST Cliché UX Audit
 *
 * This test brutally evaluates:
 * 1. Is the cliché detection actually helpful or just noise?
 * 2. What does the user SEE when a cliché is detected?
 * 3. Can they actually FIX the issue with the guidance provided?
 * 4. Is the "missing_elements" actionable or vague?
 * 5. Are the Socratic questions actually thought-provoking?
 *
 * NO FLUFF. Honest assessment.
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-cliche-ux-honest-audit.ts
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import {
  generateClicheIssues,
  createTopicFramingIssue,
  createLanguageClicheIssue,
  createTellingIssue,
} from '../src/services/commonAppWorkshop/services/clicheIssueIntegration';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ============================================================================
// QUALITY RUBRIC - What makes cliché feedback GOOD?
// ============================================================================

interface QualityScore {
  specificity: number;       // 1-5: Is the feedback specific to THIS essay?
  actionability: number;     // 1-5: Can the student actually DO something with this?
  insightfulness: number;    // 1-5: Does it reveal something non-obvious?
  distinctiveness: number;   // 1-5: Is this different from generic writing advice?
  examples_quality: number;  // 1-5: Are the missing_elements actually helpful?
  total: number;
  max: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

function scoreIssueQuality(issue: CriticalIssue, essayText: string): QualityScore {
  let specificity = 0;
  let actionability = 0;
  let insightfulness = 0;
  let distinctiveness = 0;
  let examples_quality = 0;

  // SPECIFICITY: Does it reference actual content from the essay?
  const quoteInEssay = essayText.toLowerCase().includes(issue.quote?.toLowerCase().slice(0, 20) || '');
  const diagnosisHasSpecifics = /\d|specific|exactly|precise|moment/i.test(issue.diagnosis);
  specificity = quoteInEssay ? 3 : 1;
  specificity += diagnosisHasSpecifics ? 1 : 0;
  specificity = Math.min(5, specificity + (issue.prescription.length > 50 ? 1 : 0));

  // ACTIONABILITY: Is the prescription something they can actually do?
  const prescriptionHasVerb = /show|describe|write|add|replace|remove|include|specify/i.test(issue.prescription);
  const hasMissingElements = issue.missing_elements &&
    (issue.missing_elements.sensory_details?.length || issue.missing_elements.concrete_objects?.length);
  actionability = prescriptionHasVerb ? 3 : 1;
  actionability += hasMissingElements ? 2 : 0;

  // INSIGHTFULNESS: Does it reveal something non-obvious?
  const isGenericAdvice = /be more specific|show don't tell|be concrete/i.test(issue.problem + issue.diagnosis);
  const hasWhyExplanation = issue.diagnosis.length > 80;
  insightfulness = isGenericAdvice ? 2 : 4;
  insightfulness += hasWhyExplanation ? 1 : 0;

  // DISTINCTIVENESS: Is this different from what any writing guide would say?
  const referencesCollegeValue = issue.college_value_impacted && issue.college_value_impacted.length > 5;
  const hasCollegeContext = /admissions|readers|colleges|stanford/i.test(issue.problem + issue.diagnosis);
  distinctiveness = referencesCollegeValue ? 3 : 1;
  distinctiveness += hasCollegeContext ? 2 : 0;

  // EXAMPLES QUALITY: Are the missing_elements actually helpful?
  const sensoryDetails = issue.missing_elements?.sensory_details || [];
  const concreteObjects = issue.missing_elements?.concrete_objects || [];
  const sensorySpecific = sensoryDetails.some(s => /smell|sound|feel|taste|see|touch/i.test(s));
  const objectsSpecific = concreteObjects.some(o => /number|\d|name|specific/i.test(o));
  examples_quality = sensorySpecific ? 3 : 1;
  examples_quality += objectsSpecific ? 2 : 0;

  const total = specificity + actionability + insightfulness + distinctiveness + examples_quality;
  const max = 25;
  const percentage = (total / max) * 100;
  const grade = percentage >= 85 ? 'A' : percentage >= 70 ? 'B' : percentage >= 55 ? 'C' : percentage >= 40 ? 'D' : 'F';

  return { specificity, actionability, insightfulness, distinctiveness, examples_quality, total, max, grade };
}

// ============================================================================
// TEST ESSAYS
// ============================================================================

const CLICHE_ESSAY = `Stanford's intellectual vitality has always inspired me. Ever since I was a child,
I've been passionate about learning and innovation. When I visited Silicon Valley,
I realized that Stanford is my dream school because of its entrepreneurial spirit.

I want to study computer science because I'm fascinated by technology. The interdisciplinary
approach at Stanford matches my passion for combining different fields. I believe that
with hard work and determination, I can change the world through innovation.

This experience taught me the importance of perseverance. I am eager to collaborate with
like-minded peers and learn from world-class professors. Stanford's unique community
will help me achieve my goals and make a difference in society.`;

const MIXED_ESSAY = `When my family immigrated to America, I learned the importance of adaptation.
Little did I know that this experience would transform my life.

But there's one thing I can't forget: the sound of American rain. Back home in Vietnam,
rain made a sharp ping on our metal roof. Here, it thuds on shingles. Four years later,
my brain still expects the ping when clouds gather.

Through this journey, I discovered my true passion for helping others who face similar
challenges. I want to make a difference in my community.`;

// ============================================================================
// MAIN TEST
// ============================================================================

async function runHonestAudit(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log(`  ${BOLD}HONEST CLICHÉ UX AUDIT${RESET}`);
  console.log('  No fluff. Real assessment of user value.');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${RED}✗ ANTHROPIC_API_KEY not set${RESET}`);
    process.exit(1);
  }

  // ============================================================================
  // TEST 1: Cliché-heavy essay
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 1: CLICHÉ-HEAVY STANFORD ESSAY${RESET}`);
  console.log('═'.repeat(70));

  const analysis1 = await semanticClicheAnalyzer.analyze(CLICHE_ESSAY, { college_id: 'stanford' });
  const issues1 = generateClicheIssues(analysis1, {
    collegeId: 'stanford',
    essayText: CLICHE_ESSAY,
    maxIssues: 3,
    minRiskScore: 30,
  });

  console.log(`\n${YELLOW}RAW ANALYSIS:${RESET}`);
  console.log(`  Risk Score: ${analysis1.cliche_risk_score}/100`);
  console.log(`  Overall Risk: ${analysis1.overall_cliche_risk}`);
  console.log(`  Language Clichés Found: ${analysis1.language_cliches.length}`);
  console.log(`  Telling Violations: ${analysis1.telling_not_showing.length}`);
  console.log(`  Issues Generated: ${issues1.length}`);

  // Show what the USER would see
  console.log(`\n${YELLOW}═══════════════════════════════════════════════════════════${RESET}`);
  console.log(`${YELLOW}WHAT THE USER SEES (simulated frontend):${RESET}`);
  console.log(`${YELLOW}═══════════════════════════════════════════════════════════${RESET}`);

  let totalScore1 = 0;
  for (const issue of issues1) {
    console.log(`\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}ISSUE ${issue.issue_number}: ${issue.symptom_type}${RESET}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n${DIM}Quote:${RESET} "${issue.quote}"`);
    console.log(`\n${BOLD}Problem:${RESET}\n  ${issue.problem}`);
    console.log(`\n${BOLD}Diagnosis:${RESET}\n  ${issue.diagnosis}`);
    console.log(`\n${BOLD}How to Fix:${RESET}\n  ${issue.prescription}`);

    if (issue.missing_elements) {
      console.log(`\n${BOLD}What's Missing:${RESET}`);
      if (issue.missing_elements.sensory_details?.length) {
        console.log(`  ${CYAN}Sensory Details:${RESET}`);
        issue.missing_elements.sensory_details.forEach(s => console.log(`    • ${s}`));
      }
      if (issue.missing_elements.concrete_objects?.length) {
        console.log(`  ${CYAN}Concrete Objects:${RESET}`);
        issue.missing_elements.concrete_objects.forEach(o => console.log(`    • ${o}`));
      }
      if (issue.missing_elements.micro_moment) {
        console.log(`  ${CYAN}Micro-Moment:${RESET} ${issue.missing_elements.micro_moment}`);
      }
      if (issue.missing_elements.emotional_truth) {
        console.log(`  ${CYAN}Emotional Truth:${RESET} ${issue.missing_elements.emotional_truth}`);
      }
    }

    if (issue.socratic_questions?.length) {
      console.log(`\n${BOLD}Questions to Consider:${RESET}`);
      issue.socratic_questions.forEach(q => console.log(`  • ${q}`));
    }

    // Score this issue
    const score = scoreIssueQuality(issue, CLICHE_ESSAY);
    totalScore1 += score.total;
    console.log(`\n${DIM}────────────────────────────────────────────────────${RESET}`);
    console.log(`${BOLD}QUALITY SCORE: ${score.total}/${score.max} (Grade: ${score.grade})${RESET}`);
    console.log(`  Specificity: ${score.specificity}/5`);
    console.log(`  Actionability: ${score.actionability}/5`);
    console.log(`  Insightfulness: ${score.insightfulness}/5`);
    console.log(`  Distinctiveness: ${score.distinctiveness}/5`);
    console.log(`  Examples Quality: ${score.examples_quality}/5`);
  }

  // ============================================================================
  // TEST 2: Mixed quality essay
  // ============================================================================
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 2: MIXED QUALITY ESSAY${RESET}`);
  console.log('═'.repeat(70));

  const analysis2 = await semanticClicheAnalyzer.analyze(MIXED_ESSAY, { college_id: 'stanford' });
  const issues2 = generateClicheIssues(analysis2, {
    collegeId: 'stanford',
    essayText: MIXED_ESSAY,
    maxIssues: 3,
    minRiskScore: 30,
  });

  console.log(`\n${YELLOW}RAW ANALYSIS:${RESET}`);
  console.log(`  Risk Score: ${analysis2.cliche_risk_score}/100`);
  console.log(`  Unique Element: ${analysis2.strongest_unique_element || 'None'}`);
  console.log(`  Issues Generated: ${issues2.length}`);

  // Critical check: Does it PRESERVE the good parts?
  console.log(`\n${BOLD}CRITICAL CHECK: Does it preserve the good parts?${RESET}`);
  const rainDetailMentioned = JSON.stringify(analysis2).toLowerCase().includes('rain') ||
    JSON.stringify(issues2).toLowerCase().includes('rain');
  if (rainDetailMentioned) {
    console.log(`  ${GREEN}✓ Rain detail (unique element) is recognized${RESET}`);
  } else {
    console.log(`  ${RED}✗ Rain detail NOT recognized - system is missing the point${RESET}`);
  }

  // ============================================================================
  // HONEST ASSESSMENT
  // ============================================================================
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${RED}${BOLD}HONEST ASSESSMENT${RESET}`);
  console.log('═'.repeat(70));

  console.log(`
${BOLD}WHAT'S WORKING:${RESET}
`);

  const avgScore = issues1.length > 0 ? totalScore1 / issues1.length : 0;
  if (avgScore >= 15) {
    console.log(`  ${GREEN}✓ Issues are reasonably specific to the essay${RESET}`);
  }
  if (analysis2.strongest_unique_element) {
    console.log(`  ${GREEN}✓ System identifies unique elements to preserve${RESET}`);
  }
  if (issues1.some(i => i.missing_elements?.sensory_details?.length)) {
    console.log(`  ${GREEN}✓ Provides missing_elements for guidance${RESET}`);
  }

  console.log(`
${BOLD}PROBLEMS TO FIX:${RESET}
`);

  // Check for generic advice
  const genericAdviceCount = issues1.filter(i =>
    /be more specific|show don't tell|be concrete/i.test(i.problem + i.diagnosis)
  ).length;
  if (genericAdviceCount > 0) {
    console.log(`  ${RED}✗ ${genericAdviceCount} issue(s) give generic "show don't tell" advice${RESET}`);
    console.log(`    → This is not helpful. Student already knows this.`);
  }

  // Check for missing_elements quality
  const vagueElements = issues1.filter(i => {
    const sensory = i.missing_elements?.sensory_details || [];
    return sensory.some(s => s.length < 20 || /generic|specific/i.test(s));
  });
  if (vagueElements.length > 0) {
    console.log(`  ${RED}✗ ${vagueElements.length} issue(s) have vague missing_elements${RESET}`);
    console.log(`    → "Add sensory details" is not actionable. Give EXAMPLES.`);
  }

  // Check for Socratic question quality
  const genericQuestions = issues1.filter(i =>
    i.socratic_questions?.some(q => /what did you learn|how did you feel/i.test(q))
  );
  if (genericQuestions.length > 0) {
    console.log(`  ${YELLOW}⚠ Some Socratic questions are too generic${RESET}`);
    console.log(`    → "What did you learn?" doesn't help. Be essay-specific.`);
  }

  // Check if student could actually revise with this
  console.log(`
${BOLD}REVISION TEST: Can a student actually FIX their essay with this?${RESET}
`);

  let canRevise = true;
  for (const issue of issues1) {
    const hasConcreteExample = issue.missing_elements?.sensory_details?.some(s => s.length > 30) ||
      issue.missing_elements?.micro_moment?.length > 30;
    const hasClearAction = /replace|add|describe|write about|include/i.test(issue.prescription);

    if (!hasConcreteExample) {
      console.log(`  ${RED}✗ Issue ${issue.issue_number}: No concrete example of what to ADD${RESET}`);
      canRevise = false;
    }
    if (!hasClearAction) {
      console.log(`  ${YELLOW}⚠ Issue ${issue.issue_number}: Prescription is not a clear action${RESET}`);
    }
  }

  if (canRevise) {
    console.log(`  ${GREEN}✓ Student could reasonably revise with this guidance${RESET}`);
  } else {
    console.log(`  ${RED}→ Student would need more guidance to actually revise${RESET}`);
  }

  // ============================================================================
  // FINAL VERDICT
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${BOLD}FINAL VERDICT${RESET}`);
  console.log('═'.repeat(70));

  const avgGrade = avgScore >= 20 ? 'A' : avgScore >= 16 ? 'B' : avgScore >= 12 ? 'C' : avgScore >= 8 ? 'D' : 'F';
  console.log(`
  Average Issue Quality: ${avgScore.toFixed(1)}/25 (Grade: ${avgGrade})

  ${avgGrade === 'A' || avgGrade === 'B' ? GREEN : avgGrade === 'C' ? YELLOW : RED}
  ${avgGrade === 'A' ? '✓ READY FOR PRODUCTION' :
    avgGrade === 'B' ? '✓ GOOD, minor improvements needed' :
    avgGrade === 'C' ? '⚠ NEEDS IMPROVEMENT before production' :
    avgGrade === 'D' ? '✗ SIGNIFICANT REWORK needed' :
    '✗ NOT USABLE - major redesign needed'}
  ${RESET}
`);

  // Recommendations
  console.log(`${BOLD}RECOMMENDATIONS:${RESET}`);
  if (avgScore < 20) {
    console.log(`
  1. Make missing_elements more concrete:
     BAD:  "Add sensory details"
     GOOD: "What did your keyboard sound like at 2AM? What was on your desk?"

  2. Make prescriptions action-oriented:
     BAD:  "Show rather than tell"
     GOOD: "Replace 'I learned perseverance' with a scene showing you failing
           and trying again. What time was it? What did the failure look like?"

  3. Tie Socratic questions to the specific essay:
     BAD:  "What did you learn from this?"
     GOOD: "You mention 'intellectual vitality' - what's ONE weird question
           you've actually asked that kept you up at night?"
`);
  }
}

runHonestAudit().catch(console.error);
