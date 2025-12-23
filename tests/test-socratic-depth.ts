/**
 * Test Socratic Depth Mode
 *
 * Tests the new generateSocraticDepth() method which produces
 * probing questions instead of polished prose.
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-socratic-depth.ts
 */

import { TypeSpecificSuggestionService, IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST ESSAY - The "strong" essay that still has performative authenticity
// ============================================================================

const TEST_ESSAY = {
  type: 'why_us' as SupplementalType,
  essay: `Stanford's approach to interdisciplinary learning excites me. When I discovered Dr. Fei-Fei Li's work on ImageNet and her focus on democratizing AI, I realized Stanford bridges technical innovation with ethical consideration. My experience building a computer vision app to help my visually impaired grandmother navigate our home showed me AI's power lies in human applications.

I want to join the Human-Centered AI Institute and take CS229 to deepen my understanding of the mathematical foundations I've been teaching myself. Beyond academics, I'd contribute to Stanford Women in Machine Learning, sharing resources I wish I'd had access to earlier. The d.school's approach to design thinking could help me prototype more accessible AI interfaces.

Stanford isn't just where I want to learn—it's where I want to contribute to making AI more human.`,
  description: 'Good specifics but lacks genuine depth - uses performative authenticity'
};

// Simulated issue that would benefit from depth probing
const DEPTH_ISSUE: IssueContext = {
  issue_id: 'LACKS_GENUINE_INSIGHT',
  quote: 'When I discovered Dr. Fei-Fei Li\'s work on ImageNet and her focus on democratizing AI, I realized Stanford bridges technical innovation with ethical consideration.',
  location: 'Paragraph 1',
  diagnosis: {
    problem: 'Claims discovery/realization without showing unique understanding',
    symptom_type: 'performative_authenticity',
    affected_dimensions: ['research_depth', 'authenticity_voice'],
    score_impact: -2
  },
  surrounding_context: TEST_ESSAY.essay.substring(0, 500),
  relevant_college_values: [],
  relevant_quotes: []
};

// ============================================================================
// FORMATTING
// ============================================================================

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ============================================================================
// MAIN TEST
// ============================================================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  SOCRATIC DEPTH MODE TEST');
  console.log('  Testing depth probes for genuine insight extraction');
  console.log('█'.repeat(70));

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}ERROR: ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-socratic-depth.ts\n');
    process.exit(1);
  }

  console.log(`\n${CYAN}ESSAY:${RESET}`);
  console.log(TEST_ESSAY.essay);

  console.log(`\n${CYAN}ISSUE TO PROBE:${RESET}`);
  console.log(`Quote: "${DEPTH_ISSUE.quote}"`);
  console.log(`Problem: ${DEPTH_ISSUE.diagnosis.problem}`);

  console.log('\n⏳ Generating Socratic depth probes...\n');

  const service = new TypeSpecificSuggestionService();
  const startTime = Date.now();

  try {
    const result = await service.generateSocraticDepth(
      TEST_ESSAY.essay,
      TEST_ESSAY.type,
      [DEPTH_ISSUE],
      { college: stanfordResearch }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // ═══════════════════════════════════════════════════════════════════════
    // OUTPUT RESULTS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('█'.repeat(70));
    console.log('  SOCRATIC DEPTH RESULTS');
    console.log('█'.repeat(70));

    // Meta guidance
    console.log(`\n${CYAN}META GUIDANCE:${RESET}`);
    console.log(`  Overall Depth Gap: ${result.meta_guidance.overall_depth_gap}`);
    console.log(`  Common Thread: ${result.meta_guidance.common_thread}`);
    console.log(`  How Issues Connect: ${result.meta_guidance.how_issues_connect}`);

    // Each issue
    for (const issue of result.issues) {
      console.log('\n' + '═'.repeat(70));
      console.log(`${CYAN}ISSUE: ${issue.issue_id}${RESET}`);
      console.log('═'.repeat(70));

      console.log(`\n${YELLOW}DIAGNOSIS:${RESET}`);
      console.log(`  What's Missing: ${issue.diagnosis.what_is_missing}`);
      console.log(`  Why It Feels Performative: ${issue.diagnosis.why_current_version_feels_performative}`);
      console.log(`  What Genuine Depth Looks Like: ${issue.diagnosis.what_genuine_depth_would_look_like}`);

      console.log(`\n${GREEN}DEPTH PROBES:${RESET}`);
      for (let i = 0; i < issue.depth_probes.length; i++) {
        const probe = issue.depth_probes[i];
        console.log('\n' + '─'.repeat(60));
        console.log(`${CYAN}PROBE ${i + 1}: ${probe.probe_type.toUpperCase()}${RESET}`);
        console.log('─'.repeat(60));

        console.log(`\n${GREEN}Question:${RESET}`);
        console.log(`  "${probe.question}"`);

        console.log(`\n${DIM}Why This Matters:${RESET}`);
        console.log(`  ${probe.why_this_matters}`);

        console.log(`\n${DIM}What Genuine Answer Looks Like:${RESET}`);
        console.log(`  ${probe.what_genuine_answer_looks_like}`);

        console.log(`\n${RED}Red Flags in Answer:${RESET}`);
        for (const flag of probe.red_flags_in_answer || []) {
          console.log(`  • ${flag}`);
        }

        console.log(`\n${RED}Example WEAK Answer:${RESET}`);
        console.log(`  "${probe.example_weak_answer}"`);

        console.log(`\n${GREEN}Example STRONG Answer:${RESET}`);
        console.log(`  "${probe.example_strong_answer}"`);
      }

      console.log(`\n${YELLOW}SYNTHESIS GUIDANCE:${RESET}`);
      console.log(`  How to Combine: ${issue.synthesis_guidance.how_to_combine_answers}`);
      console.log(`\n  What to Avoid:`);
      for (const avoid of issue.synthesis_guidance.what_to_avoid || []) {
        console.log(`    • ${avoid}`);
      }
      console.log(`\n  Signs of Genuine Insight:`);
      for (const sign of issue.synthesis_guidance.signs_you_have_genuine_insight || []) {
        console.log(`    ✓ ${sign}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COST SUMMARY
    // ═══════════════════════════════════════════════════════════════════════

    console.log('\n' + '═'.repeat(70));
    console.log('COST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`  Total Cost: $${result.cost.toFixed(4)}`);
    console.log(`  Input Tokens: ${result.tokens_used.input}`);
    console.log(`  Output Tokens: ${result.tokens_used.output}`);
    console.log(`  Time: ${elapsed}s`);

    console.log('\n' + '█'.repeat(70) + '\n');

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    process.exit(1);
  }
}

main();
