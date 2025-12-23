/**
 * Test to view ACTUAL suggestion outputs from the Workshop Pipeline
 *
 * This test runs a single essay through the pipeline and outputs
 * the full suggestion content to verify quality and detect bias.
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-suggestion-outputs.ts
 */

import { EvolvedWorkshopOrchestrator } from '../src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST ESSAYS - Same ones from pipeline test
// ============================================================================

const TEST_ESSAYS = {
  why_us_weak: {
    type: 'why_us' as SupplementalType,
    essay: `Stanford is one of the best universities in the world. I have always dreamed of attending a prestigious school like Stanford. The campus is beautiful and the professors are world-renowned. I believe Stanford will help me achieve my dreams and become successful. The opportunities at Stanford are amazing and I know I will thrive there. Stanford's reputation speaks for itself. I want to go to Stanford because it will look great on my resume.`,
    description: 'Performative, generic, swap-test fail',
    expectedTier: 'weak'
  },
  why_us_strong: {
    type: 'why_us' as SupplementalType,
    essay: `Stanford's approach to interdisciplinary learning excites me. When I discovered Dr. Fei-Fei Li's work on ImageNet and her focus on democratizing AI, I realized Stanford bridges technical innovation with ethical consideration. My experience building a computer vision app to help my visually impaired grandmother navigate our home showed me AI's power lies in human applications.

I want to join the Human-Centered AI Institute and take CS229 to deepen my understanding of the mathematical foundations I've been teaching myself. Beyond academics, I'd contribute to Stanford Women in Machine Learning, sharing resources I wish I'd had access to earlier. The d.school's approach to design thinking could help me prototype more accessible AI interfaces.

Stanford isn't just where I want to learn—it's where I want to contribute to making AI more human.`,
    description: 'Specific, mutual fit, clear contribution',
    expectedTier: 'strong'
  }
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function formatSuggestion(suggestion: any, type: 'polished' | 'voice'): string {
  const header = type === 'polished'
    ? `${GREEN}POLISHED ORIGINAL${RESET}`
    : `${YELLOW}VOICE AMPLIFIER${RESET}`;

  return `
${header}
${'─'.repeat(60)}
TEXT:
"${suggestion.text}"

RATIONALE:
${suggestion.rationale}

WHAT CHANGED:
${(suggestion.what_changed || []).map((c: string) => `  • ${c}`).join('\n')}

VOICE PRESERVATION: ${suggestion.voice_preservation}
EXCELLENCE ALIGNMENT: ${suggestion.excellence_alignment}
COLLEGE ALIGNMENT: ${suggestion.college_alignment}

SCORE IMPACT:
  Dimension: ${suggestion.score_impact?.dimension}
  Before: ${suggestion.score_impact?.before}/10 → After: ${suggestion.score_impact?.after}/10 (+${suggestion.score_impact?.increase})

WHEN TO USE: ${suggestion.when_to_use}
${type === 'polished' ? `SAFETY LEVEL: ${suggestion.safety_level}` : `RISK LEVEL: ${suggestion.risk_level}`}
${type === 'voice' ? `\nWHY AUTHENTIC: ${suggestion.why_authentic}` : ''}
${type === 'voice' && suggestion.spark_moments ? `SPARK MOMENTS: ${suggestion.spark_moments.join(', ')}` : ''}
`;
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function runDetailedTest(essayId: string) {
  const testEssay = TEST_ESSAYS[essayId as keyof typeof TEST_ESSAYS];
  if (!testEssay) {
    console.error(`Unknown essay: ${essayId}`);
    process.exit(1);
  }

  console.log('\n' + '█'.repeat(70));
  console.log('  DETAILED SUGGESTION OUTPUT TEST');
  console.log('  Examining actual generated suggestions for bias/quality');
  console.log('█'.repeat(70));

  console.log(`\n${CYAN}ESSAY: ${essayId}${RESET}`);
  console.log(`Type: ${testEssay.type}`);
  console.log(`Description: ${testEssay.description}`);
  console.log(`Expected Tier: ${testEssay.expectedTier}`);

  console.log('\n' + '═'.repeat(70));
  console.log('ORIGINAL ESSAY:');
  console.log('═'.repeat(70));
  console.log(testEssay.essay);
  console.log('═'.repeat(70));

  const orchestrator = new EvolvedWorkshopOrchestrator();
  const startTime = Date.now();

  console.log('\n⏳ Running full workshop pipeline...\n');

  try {
    const result = await orchestrator.runWorkshop({
      essayDraft: testEssay.essay,
      essayType: testEssay.type,
      college: stanfordResearch,
      useDeepAnalysis: false,
      maxIssues: 3
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1 DETAILS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '█'.repeat(70));
    console.log('  STAGE 1: SCORING DETAILS');
    console.log('█'.repeat(70));

    console.log(`\nSCORE: ${result.summary.initial_score}/100 (${result.summary.initial_tier})`);

    console.log('\n📊 SEMANTIC ANALYSIS:');
    const semantic = result.stage1.scoring.semantic_analysis;
    console.log(`  Core Strength: ${semantic.core_strength}`);
    console.log(`  Core Weakness: ${semantic.core_weakness}`);
    console.log(`  Authenticity Score: ${semantic.authenticity_score}/10`);
    console.log(`  Reader Question Answered: ${semantic.type_assessment.reader_question_answered ? 'Yes' : 'No'}`);

    if (semantic.type_assessment.pitfalls_present?.length) {
      console.log(`\n  ⚠️ Pitfalls Detected:`);
      semantic.type_assessment.pitfalls_present.forEach((p: string) => {
        console.log(`    • ${p}`);
      });
    }

    console.log('\n🔍 ISSUES DETECTED:');
    for (const issue of result.stage1.priority_issues) {
      console.log(`\n  ${RED}● ${issue.pattern_name}${RESET}`);
      console.log(`    Problem: ${issue.problem_description}`);
      console.log(`    Severity: ${issue.severity}`);
      console.log(`    Score Impact: ${issue.score_impact}`);
      console.log(`    Affected Dimensions: ${issue.affected_dimensions.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2 DETAILS - THE ACTUAL SUGGESTIONS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '█'.repeat(70));
    console.log('  STAGE 2: ACTUAL GENERATED SUGGESTIONS');
    console.log('█'.repeat(70));

    const suggestions = result.stage2.suggestions;

    console.log(`\n${CYAN}OVERALL STRATEGY:${RESET}`);
    console.log(`  Cohesive Approach: ${suggestions.overall_strategy.cohesive_approach}`);
    console.log(`  Voice Consistency: ${suggestions.overall_strategy.voice_consistency}`);
    console.log(`  Priority Order: ${suggestions.overall_strategy.priority_order}`);
    console.log(`\n  Implementation Tips:`);
    for (const tip of suggestions.overall_strategy.implementation_tips || []) {
      console.log(`    • ${tip}`);
    }

    // Output each issue and its suggestions
    for (let i = 0; i < suggestions.issues.length; i++) {
      const issue = suggestions.issues[i];

      console.log('\n' + '═'.repeat(70));
      console.log(`${CYAN}ISSUE ${i + 1}: ${issue.diagnosis_summary}${RESET}`);
      console.log('═'.repeat(70));

      console.log(`\nORIGINAL QUOTE: "${issue.issue_quote.substring(0, 200)}${issue.issue_quote.length > 200 ? '...' : ''}"`);

      // Polished Original
      if (issue.suggestions.polished_original) {
        console.log(formatSuggestion(issue.suggestions.polished_original, 'polished'));
      }

      // Voice Amplifier
      if (issue.suggestions.voice_amplifier) {
        console.log(formatSuggestion(issue.suggestions.voice_amplifier, 'voice'));
      }

      // Teaching
      if (issue.teaching) {
        console.log(`\n${DIM}TEACHING:${RESET}`);
        console.log(`  Type-Specific Principle: ${issue.teaching.type_specific_principle}`);
        console.log(`  College-Specific Context: ${issue.teaching.college_specific_context}`);
        console.log(`  Excellence Requirement Addressed: ${issue.teaching.excellence_requirement_addressed}`);
        console.log(`\n  How to Choose:`);
        console.log(`    Polished when: ${issue.teaching.how_to_choose?.polished_when}`);
        console.log(`    Voice when: ${issue.teaching.how_to_choose?.voice_when}`);
        console.log(`    Can combine: ${issue.teaching.how_to_choose?.can_combine}`);
        console.log(`\n  Socratic Prompts:`);
        for (const prompt of issue.teaching.socratic_prompts || []) {
          console.log(`    • ${prompt}`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3 DETAILS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '█'.repeat(70));
    console.log('  STAGE 3: EXCELLENCE CHECK');
    console.log('█'.repeat(70));

    console.log(`\nExcellence Bar Met: ${result.stage3.meets_excellence_bar ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
    console.log(`Requirements: ${result.stage3.requirements_met}/${result.stage3.requirements_total}`);

    if (result.stage3.missing_requirements.length > 0) {
      console.log('\n⚠️ Missing Requirements:');
      for (const req of result.stage3.missing_requirements) {
        console.log(`  • ${req}`);
      }
    }

    console.log('\n📋 Final Polish Priorities:');
    for (const priority of result.stage3.final_polish_priorities) {
      console.log(`  • ${priority}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BIAS ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '█'.repeat(70));
    console.log('  BIAS ANALYSIS');
    console.log('█'.repeat(70));

    console.log(`\n${YELLOW}SCORE PROJECTION ANALYSIS:${RESET}`);
    console.log(`  Initial Score: ${result.summary.initial_score}/100`);
    console.log(`  Projected Score: ${result.summary.projected_score}/100`);
    console.log(`  Claimed Improvement: +${result.summary.improvement_potential} points`);

    // Analyze the projection
    const issueCount = result.stage1.priority_issues.length;
    const avgImpactPerIssue = issueCount > 0
      ? result.summary.improvement_potential / issueCount
      : 0;

    console.log(`\n  Issues Found: ${issueCount}`);
    console.log(`  Average Impact per Issue: +${avgImpactPerIssue.toFixed(1)} points`);

    // Check if projection is realistic
    const isProjectionRealistic = avgImpactPerIssue <= 20; // More than 20 points per issue seems unrealistic
    console.log(`\n  Projection Realistic: ${isProjectionRealistic ? GREEN + 'YES' : RED + 'NO - may be biased'}${RESET}`);

    if (!isProjectionRealistic) {
      console.log(`${RED}  ⚠️ WARNING: Average improvement of +${avgImpactPerIssue.toFixed(1)} points per issue is high.${RESET}`);
      console.log(`${RED}     The system may be over-estimating the impact of suggestions.${RESET}`);
    }

    // Check if projected score of 100 is realistic
    if (result.summary.projected_score === 100) {
      console.log(`\n${RED}  ⚠️ CONCERN: Projected score is 100/100${RESET}`);
      console.log(`${RED}     Very few essays achieve a perfect score. This may indicate bias.${RESET}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COST SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(70));
    console.log('COST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`  Stage 0: $${result.cost.stage0.toFixed(4)}`);
    console.log(`  Stage 1: $${result.cost.stage1.toFixed(4)}`);
    console.log(`  Stage 2: $${result.cost.stage2.toFixed(4)}`);
    console.log(`  Stage 3: $${result.cost.stage3.toFixed(4)}`);
    console.log(`  Total: $${result.cost.total.toFixed(4)}`);
    console.log(`  Time: ${elapsed}s`);

    console.log('\n' + '█'.repeat(70) + '\n');

  } catch (error) {
    console.error(`\n${RED}ERROR: ${error}${RESET}`);
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n${RED}ERROR: ANTHROPIC_API_KEY not set${RESET}`);
    console.log('Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-suggestion-outputs.ts\n');
    process.exit(1);
  }

  // Get essay to test from command line or default to both
  const essayArg = process.argv[2];

  if (essayArg) {
    await runDetailedTest(essayArg);
  } else {
    // Run both essays
    console.log('\nRunning both test essays to compare suggestion quality...\n');
    await runDetailedTest('why_us_weak');
    console.log('\n\n' + '═'.repeat(70));
    console.log('═'.repeat(70));
    console.log('═'.repeat(70) + '\n');
    await runDetailedTest('why_us_strong');
  }
}

main();
