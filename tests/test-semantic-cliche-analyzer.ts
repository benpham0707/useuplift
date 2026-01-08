/**
 * Semantic Cliché Analyzer Test
 *
 * Tests the AI-powered cliché detection system for:
 * 1. Topic-level cliché assessment (framing vs topic)
 * 2. Narrative arc detection (predictable redemption arcs)
 * 3. Language-level clichés (AI convergence + essay platitudes)
 * 4. Tell-don't-show violations
 * 5. Unique element preservation
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-semantic-cliche-analyzer.ts
 */

import {
  SemanticClicheAnalyzer,
  semanticClicheAnalyzer,
  type SemanticClicheAnalysis
} from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';

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
  console.log('\n' + '─'.repeat(60));
  console.log(`${YELLOW}${title}${RESET}`);
  console.log('─'.repeat(60));
}

function riskColor(risk: string): string {
  switch (risk) {
    case 'low': return GREEN;
    case 'medium': return YELLOW;
    case 'high': return RED;
    case 'critical': return RED + BOLD;
    default: return RESET;
  }
}

// ============================================================================
// TEST ESSAYS
// ============================================================================

const TEST_ESSAYS = {
  cliche_heavy: {
    label: 'CLICHÉ-HEAVY - Immigration story with all the clichés',
    text: `Ever since I was a child, I've been passionate about learning. When my family immigrated to America,
I realized that this experience taught me the importance of perseverance. Little did I know that the
challenges of adapting to a new culture would transform my life. Through this journey, I learned that
hard work pays off and discovered my true passion for helping others. This transformative experience
sparked my interest in medicine and made me forever changed.`,
    expected: {
      overall_risk: 'critical' as const,
      has_topic: true,
      has_arc_warning: true,
      min_language_cliches: 4,
      min_telling: 2,
    }
  },

  fresh_immigration: {
    label: 'FRESH - Immigration story with unique angle',
    text: `The sound of American rain is wrong. Back home, rain made a metallic ping on corrugated roofs,
a rhythm I used to fall asleep to. Here, it thuds on shingles. Four years later, my brain still
expects the ping. I've stopped expecting my grandmother's dal to taste right - American lentils
are different - but the rain thing persists. I've started recording weather sounds from
different countries, 47 samples so far. I'm not sure what I'm looking for.`,
    expected: {
      overall_risk: 'low' as const,
      has_topic: true,
      framing: 'fresh' as const,
      has_unique_angle: true,
      min_language_cliches: 0,
    }
  },

  ai_convergent: {
    label: 'AI-CONVERGENT - Sounds like ChatGPT wrote it',
    text: `My journey through high school has been a tapestry of experiences that have shaped my
multifaceted identity. The myriad challenges I've navigated have instilled in me an invaluable
sense of resilience. This transformative period has fostered my passion for interdisciplinary
learning and cultivated my ability to thrive in diverse environments.`,
    expected: {
      overall_risk: 'critical' as const,
      min_ai_convergence: 5,
    }
  },

  telling_heavy: {
    label: 'TELLING-HEAVY - Claims everything, shows nothing',
    text: `I learned the importance of teamwork through my robotics club experience. I became more
confident and grew as a leader. I am passionate about engineering and I have always loved
building things. This experience was important because it taught me about collaboration.
I felt proud of what we accomplished and it made me realize I want to be an engineer.`,
    expected: {
      overall_risk: 'high' as const,
      min_telling: 4,
    }
  },

  mixed_quality: {
    label: 'MIXED - Has clichés but also some unique elements',
    text: `When I joined the debate team, I never expected it to change my life. But there's one
moment I can't forget: I was mid-argument about immigration policy when I realized I was
arguing against my own family's story. My hands started shaking. I kept going, but something
shifted. Now I keep a journal of every argument I find myself believing - and the ones I
want to believe but can't. There's a difference.`,
    expected: {
      overall_risk: 'medium' as const,
      has_unique_angle: true,
      has_some_cliches: true,
    }
  },

  sports_injury_cliche: {
    label: 'SPORTS INJURY - Classic cliché arc',
    text: `When I tore my ACL during the championship game, I was devastated. The months of
rehabilitation taught me perseverance and grit. I learned that setbacks are opportunities
for growth. Through hard work and determination, I came back stronger than ever. This
experience taught me that with enough effort, anything is possible.`,
    expected: {
      overall_risk: 'critical' as const,
      arc_type: 'overcoming' as const,
      high_predictability: true,
    }
  },

  stanford_cliche: {
    label: 'STANFORD CLICHÉS - Uses their own terms',
    text: `Stanford's intellectual vitality matches my passion for interdisciplinary learning.
Ever since I was young, I've wanted to change the world through innovation. The Silicon Valley
startup culture excites me, and Stanford is my dream school because of its entrepreneurial spirit.`,
    expected: {
      overall_risk: 'critical' as const,
      college_specific_cliches: true,
    }
  },
};

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log('  SEMANTIC CLICHÉ ANALYZER TEST SUITE');
  console.log('  AI-Powered Multi-Level Cliché Detection');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${YELLOW}⚠️  ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Running pattern-only tests...\n');
    await runPatternTests();
    return;
  }

  // Run AI tests
  let passed = 0;
  let total = 0;

  for (const [key, testCase] of Object.entries(TEST_ESSAYS)) {
    total++;
    printSubsection(`TEST: ${testCase.label}`);

    console.log(`${DIM}Essay preview: "${testCase.text.substring(0, 100).replace(/\n/g, ' ')}..."${RESET}\n`);

    try {
      const analysis = await semanticClicheAnalyzer.analyze(testCase.text, {
        college_id: key.includes('stanford') ? 'stanford' : undefined,
      });

      // Display results
      displayAnalysis(analysis);

      // Validate expectations
      const validation = validateExpectations(analysis, testCase.expected);

      if (validation.passed) {
        console.log(`\n${GREEN}✓ Test passed${RESET}`);
        passed++;
      } else {
        console.log(`\n${RED}✗ Test failed: ${validation.issues.join(', ')}${RESET}`);
      }

    } catch (error) {
      console.log(`${RED}✗ Error: ${error}${RESET}`);
    }

    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  printSection('TEST SUMMARY');
  console.log(`\nPassed: ${passed}/${total}`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(0)}%`);

  if (passed === total) {
    console.log(`\n${GREEN}${BOLD}✓ ALL TESTS PASSED${RESET}`);
  } else {
    console.log(`\n${YELLOW}⚠️  Some tests need attention${RESET}`);
  }

  // Test prompt injection format
  printSection('PROMPT INJECTION FORMAT TEST');
  const sampleAnalysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.cliche_heavy.text);
  const formatted = semanticClicheAnalyzer.formatForPromptInjection(sampleAnalysis);
  console.log('\n' + formatted.substring(0, 2000));
  console.log(`\n${DIM}... (truncated, total ${formatted.length} chars)${RESET}`);
}

function displayAnalysis(analysis: SemanticClicheAnalysis): void {
  // Overall risk
  console.log(`${BOLD}OVERALL RISK:${RESET} ${riskColor(analysis.overall_cliche_risk)}${analysis.overall_cliche_risk.toUpperCase()} (${analysis.cliche_risk_score}/100)${RESET}`);

  // Topic assessment
  console.log(`\n${CYAN}Topic Assessment:${RESET}`);
  if (analysis.topic_assessment.topic) {
    console.log(`  Topic: ${analysis.topic_assessment.topic}`);
    console.log(`  Framing: ${analysis.topic_assessment.framing_assessment}`);
    if (analysis.topic_assessment.unique_angle_detected) {
      console.log(`  ${GREEN}✓ Unique angle: ${analysis.topic_assessment.unique_angle_detected}${RESET}`);
    } else {
      console.log(`  ${YELLOW}✗ No unique angle${RESET}`);
      console.log(`  ${DIM}Opportunity: ${analysis.topic_assessment.freshness_opportunity}${RESET}`);
    }
  } else {
    console.log(`  ${DIM}No common topic detected${RESET}`);
  }

  // Narrative arc
  console.log(`\n${CYAN}Narrative Arc:${RESET}`);
  console.log(`  Arc: ${analysis.narrative_arc.detected_arc}`);
  console.log(`  Type: ${analysis.narrative_arc.arc_type}`);
  const predColor = analysis.narrative_arc.predictability_score >= 7 ? RED :
                   analysis.narrative_arc.predictability_score >= 5 ? YELLOW : GREEN;
  console.log(`  Predictability: ${predColor}${analysis.narrative_arc.predictability_score}/10${RESET}`);
  if (analysis.narrative_arc.predictability_score >= 6) {
    console.log(`  ${DIM}Consider: ${analysis.narrative_arc.suggested_subversion}${RESET}`);
  }

  // Language clichés
  console.log(`\n${CYAN}Language Clichés (${analysis.language_cliches.length}):${RESET}`);
  for (const c of analysis.language_cliches.slice(0, 5)) {
    console.log(`  ${RED}✗${RESET} "${c.phrase}" [${c.type}]`);
  }
  if (analysis.language_cliches.length > 5) {
    console.log(`  ${DIM}... and ${analysis.language_cliches.length - 5} more${RESET}`);
  }

  // Telling not showing
  console.log(`\n${CYAN}Telling-Not-Showing (${analysis.telling_not_showing.length}):${RESET}`);
  for (const t of analysis.telling_not_showing.slice(0, 3)) {
    console.log(`  ${YELLOW}✗${RESET} "${t.phrase}"`);
    console.log(`    ${DIM}Claiming: ${t.claimed_quality}${RESET}`);
  }

  // Unique elements
  if (analysis.strongest_unique_element) {
    console.log(`\n${GREEN}✓ Strongest unique element:${RESET}`);
    console.log(`  "${analysis.strongest_unique_element}"`);
  }

  // Coaching priority
  console.log(`\n${CYAN}Coaching Priority:${RESET}`);
  console.log(`  ${analysis.coaching_priority.issue}`);
  console.log(`  ${DIM}Approach: ${analysis.coaching_priority.coaching_approach}${RESET}`);
}

function validateExpectations(
  analysis: SemanticClicheAnalysis,
  expected: any
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check overall risk if specified
  if (expected.overall_risk) {
    const riskLevels = ['low', 'medium', 'high', 'critical'];
    const actualLevel = riskLevels.indexOf(analysis.overall_cliche_risk);
    const expectedLevel = riskLevels.indexOf(expected.overall_risk);

    // Allow one level of variance
    if (Math.abs(actualLevel - expectedLevel) > 1) {
      issues.push(`Risk ${analysis.overall_cliche_risk} vs expected ${expected.overall_risk}`);
    }
  }

  // Check minimum language clichés
  if (expected.min_language_cliches !== undefined) {
    if (analysis.language_cliches.length < expected.min_language_cliches) {
      issues.push(`Only ${analysis.language_cliches.length} clichés, expected ${expected.min_language_cliches}+`);
    }
  }

  // Check minimum telling violations
  if (expected.min_telling !== undefined) {
    if (analysis.telling_not_showing.length < expected.min_telling) {
      issues.push(`Only ${analysis.telling_not_showing.length} telling violations, expected ${expected.min_telling}+`);
    }
  }

  // Check unique angle
  if (expected.has_unique_angle) {
    if (!analysis.topic_assessment.unique_angle_detected && !analysis.strongest_unique_element) {
      issues.push('Expected unique angle not detected');
    }
  }

  // Check high predictability
  if (expected.high_predictability) {
    if (analysis.narrative_arc.predictability_score < 7) {
      issues.push(`Predictability ${analysis.narrative_arc.predictability_score}, expected 7+`);
    }
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

async function runPatternTests(): Promise<void> {
  printSection('PATTERN-ONLY TESTS (No API Key)');

  // Test quick check
  console.log('\n' + CYAN + 'Testing quickClicheCheck:' + RESET);

  const testTexts = [
    { label: 'AI-heavy', text: 'This tapestry of experiences has fostered my invaluable journey through a myriad of transformative challenges.' },
    { label: 'Clean', text: 'At 2 AM, I was still debugging the neural network nobody asked me to build.' },
    { label: 'Essay cliché', text: 'Little did I know that this experience would teach me the importance of perseverance.' },
  ];

  for (const t of testTexts) {
    const result = semanticClicheAnalyzer.quickClicheCheck(t.text);
    console.log(`\n${BOLD}${t.label}:${RESET}`);
    console.log(`  AI convergence: ${result.ai_convergence_count}`);
    console.log(`  Essay clichés: ${result.essay_cliche_count}`);
    console.log(`  Has critical: ${result.has_critical_cliches ? RED + 'YES' : GREEN + 'NO'}${RESET}`);
  }

  // Test pattern-based analysis
  console.log('\n' + CYAN + 'Testing pattern-based analysis:' + RESET);
  const patternAnalysis = await semanticClicheAnalyzer.analyze(
    TEST_ESSAYS.cliche_heavy.text,
    { pattern_only: true }
  );

  console.log(`\nPattern analysis found:`);
  console.log(`  ${patternAnalysis.language_cliches.length} language clichés`);
  console.log(`  ${patternAnalysis.telling_not_showing.length} telling violations`);
  console.log(`  Risk score: ${patternAnalysis.cliche_risk_score}`);
}

// ============================================================================
// MAIN
// ============================================================================

runTests().catch(console.error);
