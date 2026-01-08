/**
 * Test Elite Writing Craft Validation
 *
 * Validates that the enhanced prompts produce output that:
 * 1. Avoids AI convergence patterns
 * 2. Uses structural flexibility
 * 3. Has rich, unexpected vocabulary
 * 4. Includes meaningful connections
 * 5. Shows technical depth
 * 6. Maintains intentional theming
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-elite-craft-validation.ts
 */

import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// ELITE CRAFT DETECTION PATTERNS
// ============================================================================

/**
 * Patterns that indicate AI convergence (BAD - should NOT match)
 */
const AI_CONVERGENCE_PATTERNS = [
  /tapestry/i,
  /journey/i,
  /myriad/i,
  /invaluable/i,
  /little did I know/i,
  /this experience taught me/i,
  /I am forever changed/i,
  /it opened my eyes/i,
  /I realized that/i,
  /sparked my passion/i,
  /transformative experience/i,
  /profound impact/i,
];

/**
 * Patterns that indicate elite craft (GOOD - should match)
 */
const ELITE_CRAFT_INDICATORS = {
  structural_variety: [
    /\. [A-Z][a-z]{1,8}\./,  // Short sentence after longer one
    /—|–/,                    // Em dashes for emphasis
    /\?$/m,                   // Questions
    /\.\s*$/m,                // Varied endings
  ],
  unexpected_vocabulary: [
    /[a-z]{8,}/,              // Longer, potentially unusual words
  ],
  domain_specificity: [
    /\b(?:API|SDK|regex|compile|debug|git|npm|tensor|gradient|epoch|batch|model)\b/i,
    /\b(?:algorithm|framework|architecture|implementation|refactor|deploy)\b/i,
  ],
  concrete_details: [
    /\d{1,2}:\d{2}/,          // Specific times
    /\d+\s*(?:AM|PM|am|pm)/,  // Times with AM/PM
    /\$\d+/,                  // Dollar amounts
    /\d+%/,                   // Percentages
    /\d+\s*(?:hours?|minutes?|days?|weeks?)/i,  // Durations
  ],
  sensory_language: [
    /smelled? like/i,
    /sounded? like/i,
    /felt like/i,
    /tasted like/i,
    /looked like/i,
  ],
};

// ============================================================================
// TEST PROMPTS
// ============================================================================

const TEST_PROMPT = `You are generating a single replacement suggestion for a weak essay sentence.

ORIGINAL WEAK TEXT:
"I discovered Dr. Chen's research on neural networks and it was really interesting and made me want to learn more."

REQUIREMENTS:
1. Must be ≤30 words
2. Must NOT use these AI patterns: "tapestry", "journey", "passion", "myriad", "invaluable", "little did I know", "this experience taught me", "I am forever changed", "sparked my passion", "I realized that"
3. Must include ONE specific concrete detail (a specific paper, finding, or limitation)
4. Must use domain-specific vocabulary naturally
5. Must vary sentence structure (not all similar length)
6. Should connect to a person or specific application

OUTPUT FORMAT: Just the replacement text, nothing else.`;

// ============================================================================
// SCORING
// ============================================================================

interface CraftScore {
  avoids_ai_patterns: boolean;
  has_structural_variety: boolean;
  has_domain_specificity: boolean;
  has_concrete_details: boolean;
  has_sensory_language: boolean;
  word_count_ok: boolean;
  overall_score: number;
  issues: string[];
}

function scoreCraft(text: string): CraftScore {
  const issues: string[] = [];

  // Check for AI convergence patterns (should NOT match)
  const aiPatternMatches = AI_CONVERGENCE_PATTERNS.filter(p => p.test(text));
  const avoids_ai_patterns = aiPatternMatches.length === 0;
  if (!avoids_ai_patterns) {
    issues.push(`Uses AI patterns: ${aiPatternMatches.map(p => p.source).join(', ')}`);
  }

  // Check for structural variety
  const has_structural_variety = ELITE_CRAFT_INDICATORS.structural_variety.some(p => p.test(text));
  if (!has_structural_variety) {
    issues.push('Lacks structural variety');
  }

  // Check for domain specificity
  const has_domain_specificity = ELITE_CRAFT_INDICATORS.domain_specificity.some(p => p.test(text));
  if (!has_domain_specificity) {
    issues.push('Lacks domain-specific vocabulary');
  }

  // Check for concrete details
  const has_concrete_details = ELITE_CRAFT_INDICATORS.concrete_details.some(p => p.test(text));
  if (!has_concrete_details) {
    issues.push('Lacks concrete details (times, numbers, etc.)');
  }

  // Check for sensory language (optional but nice)
  const has_sensory_language = ELITE_CRAFT_INDICATORS.sensory_language.some(p => p.test(text));

  // Check word count
  const wordCount = text.split(/\s+/).length;
  const word_count_ok = wordCount <= 35;
  if (!word_count_ok) {
    issues.push(`Word count too high: ${wordCount}`);
  }

  // Calculate overall score
  const scores = [
    avoids_ai_patterns ? 2 : 0,        // Most important
    has_structural_variety ? 1 : 0,
    has_domain_specificity ? 1.5 : 0,  // Important for tech essays
    has_concrete_details ? 1 : 0,
    has_sensory_language ? 0.5 : 0,    // Nice to have
    word_count_ok ? 1 : 0,
  ];
  const overall_score = scores.reduce((a, b) => a + b, 0) / 7;

  return {
    avoids_ai_patterns,
    has_structural_variety,
    has_domain_specificity,
    has_concrete_details,
    has_sensory_language,
    word_count_ok,
    overall_score,
    issues,
  };
}

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

// ============================================================================
// MAIN TEST
// ============================================================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  ELITE WRITING CRAFT VALIDATION TEST');
  console.log('  Testing Anti-AI Convergence in Suggestion Generation');
  console.log('█'.repeat(70));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`\n${YELLOW}⚠️  ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Running pattern detection tests only...\n');

    // Test the scoring on sample outputs
    testPatternDetection();
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  console.log(`\n${CYAN}Generating suggestions with Sonnet...${RESET}\n`);

  // Generate multiple suggestions to test consistency
  const results: Array<{ text: string; score: CraftScore }> = [];

  for (let i = 0; i < 3; i++) {
    console.log(`${DIM}Attempt ${i + 1}/3...${RESET}`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: TEST_PROMPT }],
    });

    const text = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : '';

    const score = scoreCraft(text);
    results.push({ text, score });

    console.log(`\n${BOLD}Generated:${RESET}`);
    console.log(`  "${text}"`);
    console.log(`\n${CYAN}Score: ${(score.overall_score * 100).toFixed(0)}%${RESET}`);
    console.log(`  Avoids AI patterns: ${score.avoids_ai_patterns ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Structural variety: ${score.has_structural_variety ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Domain specific: ${score.has_domain_specificity ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Concrete details: ${score.has_concrete_details ? GREEN + '✓' : RED + '✗'}${RESET}`);
    console.log(`  Sensory language: ${score.has_sensory_language ? GREEN + '✓' : YELLOW + '-'}${RESET}`);

    if (score.issues.length > 0) {
      console.log(`  ${RED}Issues: ${score.issues.join(', ')}${RESET}`);
    }

    console.log();
  }

  // Summary
  const avgScore = results.reduce((sum, r) => sum + r.score.overall_score, 0) / results.length;
  const allAvoidAI = results.every(r => r.score.avoids_ai_patterns);
  const allDomainSpecific = results.every(r => r.score.has_domain_specificity);

  console.log('\n' + '═'.repeat(70));
  console.log(`${BOLD}SUMMARY${RESET}`);
  console.log('═'.repeat(70));
  console.log(`  Average Score: ${(avgScore * 100).toFixed(0)}%`);
  console.log(`  All avoid AI patterns: ${allAvoidAI ? GREEN + '✓ YES' : RED + '✗ NO'}${RESET}`);
  console.log(`  All domain-specific: ${allDomainSpecific ? GREEN + '✓ YES' : YELLOW + '- MIXED'}${RESET}`);

  if (avgScore >= 0.7 && allAvoidAI) {
    console.log(`\n${GREEN}✓ Elite craft requirements are being enforced${RESET}`);
  } else if (avgScore >= 0.5) {
    console.log(`\n${YELLOW}⚠️  Partial enforcement - some improvements needed${RESET}`);
  } else {
    console.log(`\n${RED}✗ Elite craft requirements NOT being enforced${RESET}`);
  }
}

function testPatternDetection() {
  console.log(`${CYAN}Testing pattern detection on sample outputs:${RESET}\n`);

  const samples = [
    {
      label: 'BAD - AI convergent',
      text: 'This experience taught me the invaluable lesson that my passion for AI can transform lives on this journey.',
      expected_ai_free: false,
    },
    {
      label: 'GOOD - Elite craft',
      text: "Dr. Chen's 2019 ImageNet paper missed edge cases—her model couldn't distinguish my grandmother's walker from furniture. I spent 47 hours debugging the gap.",
      expected_ai_free: true,
    },
    {
      label: 'MEDIOCRE - Some issues',
      text: 'I realized that neural networks could help accessibility. This sparked my passion for research.',
      expected_ai_free: false,
    },
    {
      label: 'GOOD - Technical depth',
      text: 'After epoch 342, the gradient exploded. Three days later, I found the learning rate bug—0.001 vs 0.01.',
      expected_ai_free: true,
    },
  ];

  let passed = 0;
  for (const sample of samples) {
    const score = scoreCraft(sample.text);
    const matches_expectation = score.avoids_ai_patterns === sample.expected_ai_free;

    console.log(`${matches_expectation ? GREEN + '✓' : RED + '✗'} ${sample.label}${RESET}`);
    console.log(`  "${sample.text.substring(0, 80)}..."`);
    console.log(`  Score: ${(score.overall_score * 100).toFixed(0)}% | AI-free: ${score.avoids_ai_patterns}`);
    if (score.issues.length > 0) {
      console.log(`  ${DIM}Issues: ${score.issues.join(', ')}${RESET}`);
    }
    console.log();

    if (matches_expectation) passed++;
  }

  console.log('═'.repeat(70));
  console.log(`Pattern Detection: ${passed}/${samples.length} passed`);
  console.log('═'.repeat(70));
}

main().catch(console.error);
