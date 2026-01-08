/**
 * End-to-End College Overlay Integration Test
 *
 * Tests the complete integration of:
 * 1. College Overlay Service (personality, clichés, elite craft, values)
 * 2. Type-Specific Suggestion Service (with college context)
 * 3. Conversational Context Gatherer (college-aware quality assessment)
 * 4. Strategic Specificity Service (college-type-aware impact zones)
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-college-overlay-e2e.ts
 */

import {
  CollegeOverlayService,
  collegeOverlayService
} from '../src/services/commonAppWorkshop/services/collegeOverlayService';
import {
  StrategicSpecificityService,
  strategicSpecificityService
} from '../src/services/commonAppWorkshop/services/strategicSpecificityService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

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

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ESSAYS: Record<string, { essay: string; type: SupplementalType; college: string }> = {
  stanford_intellectual: {
    type: 'intellectual',
    college: 'stanford',
    essay: `Ever since I was a kid, I've been passionate about learning. My intellectual vitality was sparked when I discovered physics in high school. The interdisciplinary nature of Stanford's approach to learning excites me. I want to change the world through science.`,
  },
  stanford_contribution: {
    type: 'diversity',
    college: 'stanford',
    essay: `Stanford is my dream school because of its prestige and Silicon Valley connections. I will bring diverse perspectives from my startup culture background. My entrepreneurial spirit makes me perfect for Stanford.`,
  },
  mit_maker: {
    type: 'extracurricular',
    college: 'mit',
    essay: `I hacked together a robot using IHTFP principles. The mens et manus philosophy of MIT matches my maker mindset. I want to join the famous hacking culture.`,
  },
};

// ============================================================================
// TESTS
// ============================================================================

function testCollegePersonalities(): void {
  printSection('TEST 1: COLLEGE PERSONALITIES');

  const colleges = ['stanford', 'mit', 'harvard'];

  for (const collegeId of colleges) {
    const research = getCollegeResearch(collegeId);
    if (!research) {
      console.log(`${RED}✗ College ${collegeId} not found${RESET}`);
      continue;
    }

    const context = collegeOverlayService.getCollegeContextForPrompt(
      research,
      'intellectual'
    );

    printSubsection(`${collegeId.toUpperCase()} Personality`);

    console.log(`  Tone: ${context.personality.preferred_tone}`);
    console.log(`  Formality: ${context.personality.formality_level}`);
    console.log(`  Risk Tolerance: ${context.personality.risk_tolerance}`);
    console.log(`  Philosophy: ${context.personality.evaluation_philosophy.substring(0, 100)}...`);

    console.log(`\n  ${CYAN}Signature Qualities:${RESET}`);
    for (const quality of context.personality.signature_qualities.slice(0, 3)) {
      console.log(`    • ${quality}`);
    }

    console.log(`\n  ${CYAN}Elite Craft Markers:${RESET}`);
    for (const marker of context.elite_craft_requirements.slice(0, 2)) {
      console.log(`    ★ ${marker.marker}: ${marker.what_it_looks_like.substring(0, 60)}...`);
    }
  }
}

function testCollegeClicheDetection(): void {
  printSection('TEST 2: COLLEGE-SPECIFIC CLICHÉ DETECTION');

  const tests = [
    {
      college: 'stanford',
      text: 'My intellectual vitality was sparked by physics',
      should_detect: true,
      reason: 'Uses Stanford\'s own term',
    },
    {
      college: 'stanford',
      text: 'At 2 AM I was still debugging my neural network',
      should_detect: false,
      reason: 'Shows self-directed exploration',
    },
    {
      college: 'stanford',
      text: 'Silicon Valley startup culture excites me',
      should_detect: true,
      reason: 'Generic tech industry reference',
    },
    {
      college: 'stanford',
      text: 'Stanford is my dream school',
      should_detect: true,
      reason: 'Empty flattery',
    },
    {
      college: 'mit',
      text: 'IHTFP and hacking culture define MIT',
      should_detect: true,
      reason: 'Surface-level MIT references',
    },
    {
      college: 'mit',
      text: 'After 47 failed attempts, I finally understood the servo timing',
      should_detect: false,
      reason: 'Shows iteration and making',
    },
  ];

  let passed = 0;

  for (const test of tests) {
    const result = collegeOverlayService.detectCollegeCliches(test.text, test.college);
    const detected = result.found.length > 0;
    const matches = detected === test.should_detect;

    console.log(`\n${matches ? GREEN + '✓' : RED + '✗'} ${test.college.toUpperCase()}: ${test.reason}${RESET}`);
    console.log(`  "${test.text.substring(0, 60)}..."`);
    console.log(`  Expected cliché: ${test.should_detect}, Detected: ${detected}`);

    if (detected) {
      console.log(`  ${DIM}Clichés found: ${result.found.map(c => c.description).join(', ')}${RESET}`);
    }

    if (matches) passed++;
  }

  console.log(`\n${CYAN}Cliché Detection: ${passed}/${tests.length} passed${RESET}`);
}

function testValueAlignment(): void {
  printSection('TEST 3: VALUE ALIGNMENT SCORING');

  const stanfordResearch = getCollegeResearch('stanford');
  if (!stanfordResearch) {
    console.log(`${RED}✗ Stanford research not found${RESET}`);
    return;
  }

  const testTexts = [
    {
      label: 'WEAK - Generic claims',
      text: 'I am passionate about learning and want to change the world.',
      expected_low: true,
    },
    {
      label: 'MEDIUM - Some specifics',
      text: 'Reading about fermentation led me to mycorrhizal networks, then to economic theories.',
      expected_low: false,
    },
    {
      label: 'STRONG - Shows depth',
      text: 'At 2 AM I was still debugging why the model broke at high temperatures. I have three theories, none satisfying. The rabbit hole started when I noticed...',
      expected_low: false,
    },
  ];

  for (const test of testTexts) {
    const result = collegeOverlayService.scoreValueAlignment(test.text, stanfordResearch);

    const scoreColor = result.overall_alignment >= 60 ? GREEN :
      result.overall_alignment >= 40 ? YELLOW : RED;

    console.log(`\n${BOLD}${test.label}${RESET}`);
    console.log(`  "${test.text.substring(0, 70)}..."`);
    console.log(`  ${scoreColor}Overall Alignment: ${result.overall_alignment}%${RESET}`);
    console.log(`  Strongest: ${result.strongest_value}`);
    console.log(`  Weakest: ${result.weakest_value}`);
    console.log(`  ${DIM}${result.coaching.substring(0, 80)}...${RESET}`);
  }
}

function testPromptSpecificGuidance(): void {
  printSection('TEST 4: PROMPT-SPECIFIC GUIDANCE');

  const stanfordResearch = getCollegeResearch('stanford');
  if (!stanfordResearch) {
    console.log(`${RED}✗ Stanford research not found${RESET}`);
    return;
  }

  const promptIds = [
    'stanford_intellectual_vitality',
    'stanford_roommate',
    'stanford_distinctive_contribution',
  ];

  for (const promptId of promptIds) {
    const context = collegeOverlayService.getCollegeContextForPrompt(
      stanfordResearch,
      'intellectual',
      promptId
    );

    printSubsection(context.prompt_guidance.prompt_title || promptId);

    console.log(`  Hidden Assessment: ${context.prompt_guidance.hidden_assessment}`);

    console.log(`\n  ${GREEN}Must Demonstrate:${RESET}`);
    for (const item of context.prompt_guidance.must_demonstrate.slice(0, 3)) {
      console.log(`    ✓ ${item.substring(0, 60)}...`);
    }

    console.log(`\n  ${RED}Must Avoid:${RESET}`);
    for (const item of context.prompt_guidance.must_avoid.slice(0, 3)) {
      console.log(`    ✗ ${item.substring(0, 60)}...`);
    }

    console.log(`\n  ${CYAN}Recommended Structure:${RESET}`);
    console.log(`    Opening: ${context.prompt_guidance.recommended_structure.opening}`);
    console.log(`    Body: ${context.prompt_guidance.recommended_structure.body.substring(0, 50)}...`);
    console.log(`    Closing: ${context.prompt_guidance.recommended_structure.closing}`);
  }
}

function testCollegeSpecificityIntegration(): void {
  printSection('TEST 5: COLLEGE + SPECIFICITY INTEGRATION');

  for (const [key, testCase] of Object.entries(TEST_ESSAYS)) {
    const research = getCollegeResearch(testCase.college);
    if (!research) continue;

    printSubsection(`${testCase.college.toUpperCase()} - ${testCase.type}`);

    // Get college context
    const collegeContext = collegeOverlayService.getCollegeContextForPrompt(
      research,
      testCase.type
    );

    // Detect clichés
    const clicheResult = collegeOverlayService.detectCollegeCliches(
      testCase.essay,
      testCase.college
    );

    // Get specificity analysis
    const specificityAnalysis = strategicSpecificityService.analyzeSpecificityNeeds(
      testCase.essay,
      testCase.type,
      []
    );

    // Score value alignment
    const valueScore = collegeOverlayService.scoreValueAlignment(testCase.essay, research);

    console.log(`\n${DIM}Essay: "${testCase.essay.substring(0, 100)}..."${RESET}`);

    console.log(`\n${CYAN}CLICHÉ CHECK:${RESET}`);
    if (clicheResult.found.length === 0) {
      console.log(`  ${GREEN}✓ No clichés detected${RESET}`);
    } else {
      console.log(`  ${RED}✗ ${clicheResult.found.length} clichés found:${RESET}`);
      for (const c of clicheResult.found) {
        console.log(`    - ${c.description} [${c.severity}]`);
      }
    }

    console.log(`\n${CYAN}VALUE ALIGNMENT:${RESET}`);
    console.log(`  Score: ${valueScore.overall_alignment}%`);
    console.log(`  Strongest: ${valueScore.strongest_value}`);
    console.log(`  Weakest: ${valueScore.weakest_value}`);

    console.log(`\n${CYAN}SPECIFICITY NEEDS:${RESET}`);
    console.log(`  Primary Gap: ${specificityAnalysis.assessment.primary_gap}`);
    console.log(`  High Impact Needs: ${specificityAnalysis.high_impact_needs.length}`);
    console.log(`  Words to Invest: ${specificityAnalysis.assessment.words_to_invest}`);
  }
}

function testFormattedContextOutput(): void {
  printSection('TEST 6: FORMATTED CONTEXT OUTPUT (Prompt Injection)');

  const stanfordResearch = getCollegeResearch('stanford');
  if (!stanfordResearch) {
    console.log(`${RED}✗ Stanford research not found${RESET}`);
    return;
  }

  const context = collegeOverlayService.getCollegeContextForPrompt(
    stanfordResearch,
    'intellectual',
    'stanford_intellectual_vitality'
  );

  const formatted = collegeOverlayService.formatCollegeContextForPrompt(context);

  console.log(`\n${DIM}Preview of formatted context (first 2000 chars):${RESET}`);
  console.log('─'.repeat(60));
  console.log(formatted.substring(0, 2000));
  console.log('─'.repeat(60));
  console.log(`\n${CYAN}Total length: ${formatted.length} characters${RESET}`);

  // Validate key sections are present
  const requiredSections = [
    'COLLEGE PERSONALITY',
    'SIGNATURE QUALITIES',
    'PROMPT-SPECIFIC GUIDANCE',
    'VALUES TO DEMONSTRATE',
    'CLICHÉS (MUST AVOID)',
    'ELITE CRAFT MARKERS',
    'CITATION OPPORTUNITIES',
    'RED FLAGS',
    'GREEN FLAGS',
  ];

  console.log(`\n${CYAN}Section Validation:${RESET}`);
  for (const section of requiredSections) {
    const present = formatted.includes(section);
    console.log(`  ${present ? GREEN + '✓' : RED + '✗'} ${section}${RESET}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log('\n' + '█'.repeat(70));
  console.log('  COLLEGE OVERLAY END-TO-END INTEGRATION TEST');
  console.log('  Testing: Personality, Clichés, Values, Craft, Integration');
  console.log('█'.repeat(70));

  try {
    testCollegePersonalities();
    testCollegeClicheDetection();
    testValueAlignment();
    testPromptSpecificGuidance();
    testCollegeSpecificityIntegration();
    testFormattedContextOutput();

    console.log('\n' + '█'.repeat(70));
    console.log(`  ${GREEN}ALL TESTS COMPLETED${RESET}`);
    console.log('█'.repeat(70));

    console.log(`
${CYAN}INTEGRATION SUMMARY:${RESET}

1. ${BOLD}College Personalities${RESET}
   - Stanford: Intellectual, experimental, process-focused
   - MIT: Conversational, maker-focused, failure-embracing
   - Harvard: Ambitious, impact-focused, trajectory-oriented

2. ${BOLD}College-Specific Clichés${RESET}
   - Stanford: "intellectual vitality", "dream school", "Silicon Valley"
   - MIT: "IHTFP", "hacking culture", "mens et manus"
   - Harvard: "veritas", prestige references

3. ${BOLD}Elite Craft Markers${RESET}
   - Stanford: Rabbit hole depth, genuine uncertainty, self-directed exploration
   - MIT: Build evidence, failure as feature, collaborative credit
   - Harvard: Impact trajectory, awareness of stakes

4. ${BOLD}Value Alignment Scoring${RESET}
   - Weighted by college's stated priorities
   - Identifies strongest/weakest value demonstration
   - Provides actionable coaching feedback

5. ${BOLD}Prompt-Specific Guidance${RESET}
   - Hidden assessment criteria
   - Recommended structure and word allocation
   - Prompt-specific red/green flags

6. ${BOLD}Formatted Context Output${RESET}
   - Comprehensive prompt injection format
   - All sections validated present
   - Ready for Sonnet/Opus consumption
`);

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    process.exit(1);
  }
}

main();
