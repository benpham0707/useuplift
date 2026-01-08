/**
 * Cliché System Gap Analysis
 *
 * Brutally honest assessment of what's STILL WEAK and needs improvement.
 * Goal: Identify specific gaps that prevent 25/25 quality.
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-cliche-gap-analysis.ts
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import {
  generateClicheIssues,
  convertClicheAnalysisToCriticalIssues,
} from '../src/services/commonAppWorkshop/services/clicheIssueIntegration';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ============================================================================
// GAP CATEGORIES
// ============================================================================

interface Gap {
  category: string;
  issue: string;
  currentBehavior: string;
  idealBehavior: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  fixComplexity: 'easy' | 'medium' | 'hard';
}

const gaps: Gap[] = [];

// ============================================================================
// TEST ESSAYS TO PROBE WEAKNESSES
// ============================================================================

const PROBE_ESSAYS = {
  // Essay that should get essay-SPECIFIC feedback, not template feedback
  needs_specificity: {
    text: `My grandmother's kitchen smelled like fish sauce and regret. Every Sunday,
she'd make phở, and I'd pretend to help while actually watching TikTok under
the table. "You'll miss this when I'm gone," she'd say. I didn't believe her.

Then she was gone. The recipe cards are in my drawer now, her handwriting
getting harder to read as her arthritis worsened. I've made the phở six times.
It never tastes right. Last week I realized I forgot to ask her about the
secret ingredient she always mentioned but never revealed.

I am passionate about preserving family traditions now.`,
    probe: 'Does the system recognize that 99% of this is GOOD and only the last sentence is cliché?',
  },

  // Essay where the FIX should reference specific content from the essay
  needs_essay_reference: {
    text: `I've always been fascinated by artificial intelligence. When I was young,
I would watch robots in movies and dream of building my own. Now I spend hours
coding neural networks and reading papers on transformer architectures.

Stanford's AI program is exactly what I need. The interdisciplinary approach
matches my passion for combining computer science with philosophy. I believe
that with Stanford's resources, I can change the world.`,
    probe: 'Does the fix reference "transformer architectures" or "philosophy" specifically?',
  },

  // Essay where suggestions should BUILD on what's already good
  has_good_elements: {
    text: `The first time I debugged code for 14 hours straight, I forgot to eat.
My mom found me at 3 AM, cursor blinking on line 847 of a sorting algorithm
that refused to sort. "This is unhealthy," she said. She was right.

But I couldn't stop. There's something about the moment when broken code
finally runs that I'm addicted to. This experience taught me the importance
of perseverance and showed me that I am passionate about computer science.`,
    probe: 'Does it preserve "14 hours", "3 AM", "line 847" while fixing the cliché ending?',
  },
};

// ============================================================================
// RUN GAP ANALYSIS
// ============================================================================

async function runGapAnalysis(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log(`  ${BOLD}CLICHÉ SYSTEM GAP ANALYSIS${RESET}`);
  console.log('  Finding what\'s still broken');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${RED}✗ ANTHROPIC_API_KEY not set${RESET}`);
    process.exit(1);
  }

  // ============================================================================
  // GAP 1: Does feedback reference SPECIFIC essay content?
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}GAP 1: Essay-Specific Feedback${RESET}`);
  console.log('═'.repeat(70));

  const analysis1 = await semanticClicheAnalyzer.analyze(
    PROBE_ESSAYS.needs_essay_reference.text,
    { college_id: 'stanford' }
  );
  const issues1 = generateClicheIssues(analysis1, {
    collegeId: 'stanford',
    essayText: PROBE_ESSAYS.needs_essay_reference.text,
    maxIssues: 3,
    minRiskScore: 30,
  });

  console.log(`\n${YELLOW}Probe:${RESET} ${PROBE_ESSAYS.needs_essay_reference.probe}`);
  console.log(`\n${YELLOW}Essay mentions:${RESET} "transformer architectures", "philosophy", "neural networks"`);

  let essayContentReferenced = false;
  for (const issue of issues1) {
    const fullIssueText = JSON.stringify(issue).toLowerCase();
    const referencesEssay = fullIssueText.includes('transformer') ||
      fullIssueText.includes('philosophy') ||
      fullIssueText.includes('neural');

    if (referencesEssay) {
      essayContentReferenced = true;
      console.log(`${GREEN}✓ Issue references essay content${RESET}`);
    }

    // Show what it actually says
    console.log(`\n${DIM}Issue ${issue.issue_number} prescription:${RESET}`);
    console.log(`  "${issue.prescription.substring(0, 150)}..."`);
  }

  if (!essayContentReferenced) {
    console.log(`\n${RED}✗ GAP FOUND: Feedback is TEMPLATE-based, not essay-specific${RESET}`);
    gaps.push({
      category: 'Specificity',
      issue: 'Feedback doesn\'t reference actual essay content',
      currentBehavior: 'Generic prompts like "Name ONE professor"',
      idealBehavior: 'Should say: "You mention transformer architectures—which specific paper on transformers confused you?"',
      impact: 'critical',
      fixComplexity: 'medium',
    });
  }

  // ============================================================================
  // GAP 2: Does it preserve what's ALREADY GOOD?
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}GAP 2: Preserving Good Elements${RESET}`);
  console.log('═'.repeat(70));

  const analysis2 = await semanticClicheAnalyzer.analyze(
    PROBE_ESSAYS.has_good_elements.text,
    { college_id: 'stanford' }
  );

  console.log(`\n${YELLOW}Probe:${RESET} ${PROBE_ESSAYS.has_good_elements.probe}`);
  console.log(`\n${YELLOW}Good elements:${RESET} "14 hours", "3 AM", "line 847", "cursor blinking"`);
  console.log(`\n${YELLOW}Strongest unique element detected:${RESET}`);
  console.log(`  "${analysis2.strongest_unique_element || 'None'}"`);
  console.log(`\n${YELLOW}Elements to preserve:${RESET}`);
  analysis2.elements_to_preserve.forEach(e => console.log(`  • ${e}`));

  const preservesSpecifics = analysis2.strongest_unique_element?.includes('14 hours') ||
    analysis2.strongest_unique_element?.includes('3 AM') ||
    analysis2.strongest_unique_element?.includes('line 847') ||
    analysis2.elements_to_preserve.some(e => /\d/.test(e));

  if (!preservesSpecifics) {
    console.log(`\n${RED}✗ GAP FOUND: Not preserving specific numbers/details${RESET}`);
    gaps.push({
      category: 'Preservation',
      issue: 'Doesn\'t explicitly call out specific details to preserve',
      currentBehavior: 'Generic "preserve unique elements"',
      idealBehavior: 'Should say: "KEEP the \'14 hours\', \'3 AM\', \'line 847\' details—these are gold"',
      impact: 'high',
      fixComplexity: 'medium',
    });
  } else {
    console.log(`\n${GREEN}✓ Preserves specific elements${RESET}`);
  }

  // ============================================================================
  // GAP 3: Does the micro_moment connect to the essay's actual content?
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}GAP 3: Micro-Moment Relevance${RESET}`);
  console.log('═'.repeat(70));

  const issues2 = generateClicheIssues(analysis2, {
    collegeId: 'stanford',
    essayText: PROBE_ESSAYS.has_good_elements.text,
    maxIssues: 3,
    minRiskScore: 30,
  });

  console.log(`\n${YELLOW}Probe:${RESET} Does micro_moment build on the debugging story?`);

  for (const issue of issues2) {
    console.log(`\n${DIM}Issue ${issue.issue_number} micro_moment:${RESET}`);
    console.log(`  "${issue.missing_elements?.micro_moment || 'None'}"`);

    const microMomentRelevant = issue.missing_elements?.micro_moment?.toLowerCase().includes('debug') ||
      issue.missing_elements?.micro_moment?.toLowerCase().includes('code') ||
      issue.missing_elements?.micro_moment?.toLowerCase().includes('3 am');

    if (!microMomentRelevant && issue.symptom_type.includes('cliche')) {
      console.log(`  ${RED}✗ Micro-moment is generic, not essay-specific${RESET}`);
    }
  }

  gaps.push({
    category: 'Micro-Moment',
    issue: 'Micro-moment prompts are template-based',
    currentBehavior: 'Generic: "Write the scene where you almost quit"',
    idealBehavior: 'Essay-specific: "Expand the 3 AM debugging scene—what was on line 847? What did your mom\'s face look like?"',
    impact: 'high',
    fixComplexity: 'hard',
  });

  // ============================================================================
  // GAP 4: Are Socratic questions actually Socratic?
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}GAP 4: Socratic Question Quality${RESET}`);
  console.log('═'.repeat(70));

  console.log(`\n${YELLOW}Probe:${RESET} Do questions make students THINK differently, or just ask for more details?`);

  for (const issue of issues2) {
    console.log(`\n${DIM}Issue ${issue.issue_number} Socratic questions:${RESET}`);
    issue.socratic_questions?.forEach(q => {
      const isReallyDialectical = /why|what if|suppose|imagine|contrast|paradox|tension/i.test(q);
      const isSurprising = /embarrass|ugly|hate|afraid|doubt|wrong|fail/i.test(q);
      const isJustInfoGathering = /what did|when did|where did|how many/i.test(q);

      if (isReallyDialectical || isSurprising) {
        console.log(`  ${GREEN}✓${RESET} "${q.substring(0, 60)}..."`);
      } else if (isJustInfoGathering) {
        console.log(`  ${YELLOW}⚠${RESET} "${q.substring(0, 60)}..." (info-gathering, not Socratic)`);
      } else {
        console.log(`  ${DIM}○${RESET} "${q.substring(0, 60)}..."`);
      }
    });
  }

  // ============================================================================
  // GAP 5: Does Stage 2 get enough context to generate good suggestions?
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}GAP 5: Stage 2 Handoff Quality${RESET}`);
  console.log('═'.repeat(70));

  console.log(`\n${YELLOW}Probe:${RESET} When cliché issues go to Stage 2, does Sonnet have enough context?`);
  console.log(`\n${YELLOW}Current handoff includes:${RESET}`);
  console.log(`  • cliche_context.overall_risk: "${analysis2.overall_cliche_risk}"`);
  console.log(`  • cliche_context.risk_score: ${analysis2.cliche_risk_score}`);
  console.log(`  • unique_elements_to_preserve: ${analysis2.elements_to_preserve.length} items`);
  console.log(`  • coaching_priority: "${analysis2.coaching_priority?.coaching_approach || 'None'}"`);

  const handoffHasEssayQuotes = analysis2.elements_to_preserve.some(e => e.length > 30);
  if (!handoffHasEssayQuotes) {
    console.log(`\n${RED}✗ GAP FOUND: Stage 2 doesn't get actual essay quotes${RESET}`);
    gaps.push({
      category: 'Stage 2 Handoff',
      issue: 'Stage 2 doesn\'t receive specific essay quotes to preserve',
      currentBehavior: 'Just says "preserve unique elements" generically',
      idealBehavior: 'Should pass actual quotes: "PRESERVE: \'14 hours straight\', \'line 847\', \'cursor blinking\'"',
      impact: 'critical',
      fixComplexity: 'easy',
    });
  }

  // ============================================================================
  // GAP 6: Does the system handle PARTIAL cliché correctly?
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}GAP 6: Partial Cliché Detection${RESET}`);
  console.log('═'.repeat(70));

  const analysis3 = await semanticClicheAnalyzer.analyze(
    PROBE_ESSAYS.needs_specificity.text,
    { college_id: 'stanford' }
  );

  console.log(`\n${YELLOW}Probe:${RESET} ${PROBE_ESSAYS.needs_specificity.probe}`);
  console.log(`\n${YELLOW}Essay is 95% excellent, only last sentence is cliché${RESET}`);
  console.log(`\n${YELLOW}Risk score:${RESET} ${analysis3.cliche_risk_score}/100`);
  console.log(`${YELLOW}Overall risk:${RESET} ${analysis3.overall_cliche_risk}`);

  if (analysis3.cliche_risk_score > 50) {
    console.log(`\n${RED}✗ GAP FOUND: Over-penalizing an otherwise excellent essay${RESET}`);
    gaps.push({
      category: 'Calibration',
      issue: 'Risk score is too high for essays with isolated clichés',
      currentBehavior: 'Essay with one cliché sentence gets high risk score',
      idealBehavior: 'Should recognize: "99% excellent, only fix this one sentence"',
      impact: 'high',
      fixComplexity: 'medium',
    });
  } else {
    console.log(`\n${GREEN}✓ Correctly identified as low/moderate risk${RESET}`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${RED}${BOLD}GAP SUMMARY: What's Preventing 25/25${RESET}`);
  console.log('═'.repeat(70));

  const criticalGaps = gaps.filter(g => g.impact === 'critical');
  const highGaps = gaps.filter(g => g.impact === 'high');
  const mediumGaps = gaps.filter(g => g.impact === 'medium');

  console.log(`\n${RED}CRITICAL (${criticalGaps.length}):${RESET}`);
  criticalGaps.forEach(g => {
    console.log(`\n  ${BOLD}${g.category}: ${g.issue}${RESET}`);
    console.log(`  ${DIM}Current:${RESET} ${g.currentBehavior}`);
    console.log(`  ${GREEN}Ideal:${RESET} ${g.idealBehavior}`);
    console.log(`  ${DIM}Fix complexity:${RESET} ${g.fixComplexity}`);
  });

  console.log(`\n${YELLOW}HIGH (${highGaps.length}):${RESET}`);
  highGaps.forEach(g => {
    console.log(`\n  ${BOLD}${g.category}: ${g.issue}${RESET}`);
    console.log(`  ${DIM}Current:${RESET} ${g.currentBehavior}`);
    console.log(`  ${GREEN}Ideal:${RESET} ${g.idealBehavior}`);
  });

  // ============================================================================
  // PRIORITIZED FIX LIST
  // ============================================================================
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}PRIORITIZED FIXES FOR 25/25${RESET}`);
  console.log('═'.repeat(70));

  console.log(`
${BOLD}1. [CRITICAL] Make feedback essay-specific, not template-based${RESET}
   Current: "Name ONE professor whose work you've read"
   Fix: Extract essay mentions and inject into prompts
   How: Pass essay text to issue creation functions, extract key terms

${BOLD}2. [CRITICAL] Pass actual essay quotes to Stage 2${RESET}
   Current: Generic "preserve unique elements"
   Fix: Include specific quotes in cliche_context
   How: Add "quotes_to_preserve: string[]" to handoff

${BOLD}3. [HIGH] Make micro_moment prompts essay-specific${RESET}
   Current: Generic "Write the scene where you almost quit"
   Fix: Reference actual scenes from the essay
   How: Detect narrative moments in essay, reference them in prompt

${BOLD}4. [HIGH] Calibrate risk score for partial clichés${RESET}
   Current: High score for essays with isolated cliché
   Fix: Weight by cliché density (clichés / total sentences)
   How: Calculate ratio in semanticClicheAnalyzer

${BOLD}5. [MEDIUM] Upgrade Socratic questions to be truly dialectical${RESET}
   Current: "What specific moment made you write X?"
   Fix: Add tension/paradox questions
   How: Add questions like "What's the tension between what you said and what you did?"
`);

  console.log(`\n${BOLD}Estimated effort for 25/25:${RESET}`);
  console.log(`  • Fix #1: 30-45 minutes (extract essay content, inject into templates)`);
  console.log(`  • Fix #2: 15 minutes (add quotes_to_preserve field)`);
  console.log(`  • Fix #3: 45-60 minutes (essay parsing + dynamic prompt generation)`);
  console.log(`  • Fix #4: 20 minutes (risk score calibration)`);
  console.log(`  • Fix #5: 30 minutes (upgrade Socratic templates)`);
}

runGapAnalysis().catch(console.error);
