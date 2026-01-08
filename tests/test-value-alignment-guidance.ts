/**
 * Test: Value Alignment Guidance Service
 *
 * Tests the primary college-specific guidance layer that focuses on VALUE alignment,
 * not program references. This is the key differentiator from generic essay feedback.
 *
 * Key test scenarios:
 * 1. Essay with strong values → minimal guidance needed
 * 2. Essay with weak values → specific, actionable guidance
 * 3. Essay with NO values → critical guidance with examples
 * 4. Cross-college comparison → explains fit differences
 * 5. Guidance quality → focuses on mindset, not name-dropping
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);

import { ValueAlignmentGuidanceService } from '../src/services/commonAppWorkshop/services/valueAlignmentGuidanceService';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import { mitResearch } from '../src/services/commonAppWorkshop/data/mit';
import { harvardResearch } from '../src/services/commonAppWorkshop/data/harvard';

const guidanceService = new ValueAlignmentGuidanceService();

// ============================================================================
// TEST ESSAYS
// ============================================================================

// Essay with STRONG Stanford values (should need minimal guidance)
const STRONG_VALUES_ESSAY = `The question that won't leave me alone isn't one anyone assigned. Last March, I was supposed to be studying for AP Bio, but instead I spent three weeks trying to understand why I feel guilty when I accidentally step on an ant.

It sounds absurd. But that guilt led me through Peter Singer's "Animal Liberation," then to Buddhist concepts of sentient beings, then to building an Arduino-based infrared sensor that warns insects before I walk. My friends think I've lost it. Maybe I have.

What fascinates me isn't the ethics conclusion I reached (I still eat chicken, so clearly I'm a hypocrite). It's the way one simple observation—guilt about an ant—branched into philosophy, religion, and electrical engineering. I didn't plan this. I just couldn't stop thinking about it.

That's the kind of mind I have. It wanders. It questions. It builds weird things at 2 AM because the question won't let go.`;

// Essay with WEAK Stanford values (needs significant guidance)
const WEAK_VALUES_ESSAY = `I have always been interested in science. In high school, I took AP Biology and AP Chemistry. I also participated in the Science Olympiad team where we competed in various events.

My favorite part of science is doing experiments in the lab. I enjoy following the scientific method and seeing the results. Last year, I did a project on plant growth for the science fair and won second place.

I want to study biology in college because I think it's important. Scientists make discoveries that help people. I hope to become a scientist and contribute to society.

In addition to science, I also play soccer and volunteer at a local food bank.`;

// Essay with ZERO discernible values (needs critical guidance)
const NO_VALUES_ESSAY = `I am applying to Stanford University because it is one of the best universities in the country. The campus is beautiful and the weather is great. I have heard that Stanford has excellent professors and research opportunities.

I believe I would be a great fit for Stanford because I am hardworking and dedicated. I always get good grades and participate in extracurricular activities. My teachers would describe me as responsible and organized.

Stanford would help me achieve my goals. I want to have a successful career and make my family proud. Going to Stanford would be a dream come true.`;

// MIT-specific essay (to test cross-college comparison)
const MIT_FIT_ESSAY = `The water filter started as a failure. My first design clogged within hours. The second leaked. The third was so slow it would've taken days to purify a single liter.

But that third failure taught me something I couldn't have learned from a textbook: the difference between theoretical fluid dynamics and actual water behavior in a $2 PVC pipe.

I rebuilt the filter seventeen times. Not because I was patient—I'm not—but because every failure revealed something unexpected. The membrane porosity that worked in the YouTube video? Useless with our local water's mineral content. I had to figure out why.

Now our filter serves three families in my neighborhood who can't afford bottled water. It's not elegant. It's held together with zip ties and duct tape. But it works. And I understand WHY it works in a way I never could have from reading about it.`;

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: {
    alignment: string;
    score_estimate: number;
    guidance_count: number;
    critical_actions: number;
    strengths_identified: number;
    focuses_on_mindset: boolean;
    avoids_program_names: boolean;
  };
  cost: number;
}

async function runTest(
  name: string,
  essay: string,
  college: any,
  expectations: {
    min_alignment?: string[];
    max_alignment?: string[];
    min_score?: number;
    max_score?: number;
    expect_critical_guidance?: boolean;
    expect_strengths?: boolean;
  }
): Promise<TestResult> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Testing: ${name}`);
  console.log(`${'═'.repeat(70)}`);

  try {
    const result = await guidanceService.generateGuidance({
      essay_text: essay,
      college,
    });

    // Analyze guidance quality
    const criticalActions = result.action_items.filter(a => a.priority === 'critical').length;
    const guidanceCount = result.value_guidance.filter(g => g.guidance !== null).length;

    // Check if guidance focuses on mindset (not program names)
    const allGuidanceText = result.value_guidance
      .filter(g => g.guidance)
      .map(g => g.guidance!.what_to_add + ' ' + g.guidance!.example_phrasing)
      .join(' ');

    const programPatterns = [
      /stanford.*(institute|center|program|lab|hai|sail)/i,
      /professor\s+\w+/i,
      /mit.*(lab|course|program)/i,
      /harvard.*(institute|center|program)/i,
    ];

    const mentionsProgramNames = programPatterns.some(p => p.test(allGuidanceText));
    const focusesOnMindset = allGuidanceText.includes('curiosity') ||
      allGuidanceText.includes('question') ||
      allGuidanceText.includes('process') ||
      allGuidanceText.includes('thinking') ||
      allGuidanceText.includes('discovery') ||
      allGuidanceText.includes('connection');

    // Validation
    let passed = true;
    const reasons: string[] = [];

    if (expectations.min_alignment && !expectations.min_alignment.includes(result.overall_value_alignment)) {
      passed = false;
      reasons.push(`Alignment ${result.overall_value_alignment} below expected ${expectations.min_alignment.join('/')}`);
    }

    if (expectations.max_alignment && !expectations.max_alignment.includes(result.overall_value_alignment)) {
      passed = false;
      reasons.push(`Alignment ${result.overall_value_alignment} above expected ${expectations.max_alignment.join('/')}`);
    }

    if (expectations.min_score && result.overall_score_estimate < expectations.min_score) {
      passed = false;
      reasons.push(`Score ${result.overall_score_estimate} below expected ${expectations.min_score}`);
    }

    if (expectations.max_score && result.overall_score_estimate > expectations.max_score) {
      passed = false;
      reasons.push(`Score ${result.overall_score_estimate} above expected ${expectations.max_score}`);
    }

    if (expectations.expect_critical_guidance && criticalActions === 0) {
      passed = false;
      reasons.push('Expected critical guidance but none provided');
    }

    if (expectations.expect_strengths && result.strengths.length === 0) {
      passed = false;
      reasons.push('Expected strengths to be identified but none found');
    }

    // Quality checks
    if (mentionsProgramNames) {
      console.log('  ⚠️ WARNING: Guidance mentions program names (should focus on mindset)');
    }

    if (!focusesOnMindset && guidanceCount > 0) {
      console.log('  ⚠️ WARNING: Guidance may not focus enough on mindset/approach');
    }

    // Output
    console.log(`\n  Overall Alignment: ${result.overall_value_alignment}`);
    console.log(`  Score Estimate: ${result.overall_score_estimate}/100`);
    console.log(`\n  Strengths Identified: ${result.strengths.length}`);
    result.strengths.slice(0, 2).forEach(s => console.log(`    • ${s.substring(0, 80)}...`));

    console.log(`\n  Values Needing Guidance: ${guidanceCount}`);
    result.value_guidance
      .filter(g => g.guidance !== null)
      .slice(0, 2)
      .forEach(g => {
        console.log(`    • ${g.value_name} (${g.priority}): ${g.guidance!.what_to_add.substring(0, 60)}...`);
      });

    console.log(`\n  Critical Actions: ${criticalActions}`);
    result.action_items
      .filter(a => a.priority === 'critical')
      .forEach(a => {
        console.log(`    • ${a.action.substring(0, 70)}...`);
      });

    console.log(`\n  Quality Checks:`);
    console.log(`    • Focuses on mindset: ${focusesOnMindset ? '✅' : '⚠️'}`);
    console.log(`    • Avoids program names: ${!mentionsProgramNames ? '✅' : '⚠️'}`);

    if (passed) {
      console.log(`\n  ✅ TEST PASSED`);
    } else {
      console.log(`\n  ❌ TEST FAILED: ${reasons.join(', ')}`);
    }

    console.log(`\n  Cost: $${result.cost.toFixed(4)}`);

    return {
      name,
      passed,
      details: {
        alignment: result.overall_value_alignment,
        score_estimate: result.overall_score_estimate,
        guidance_count: guidanceCount,
        critical_actions: criticalActions,
        strengths_identified: result.strengths.length,
        focuses_on_mindset: focusesOnMindset,
        avoids_program_names: !mentionsProgramNames,
      },
      cost: result.cost,
    };
  } catch (error) {
    console.log(`\n  ❌ TEST ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
    return {
      name,
      passed: false,
      details: {
        alignment: 'error',
        score_estimate: 0,
        guidance_count: 0,
        critical_actions: 0,
        strengths_identified: 0,
        focuses_on_mindset: false,
        avoids_program_names: false,
      },
      cost: 0,
    };
  }
}

async function testQuickSummary(): Promise<boolean> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Testing: Quick Summary (Lightweight Analysis)`);
  console.log(`${'═'.repeat(70)}`);

  try {
    const summary = await guidanceService.generateQuickSummary(
      STRONG_VALUES_ESSAY,
      stanfordResearch
    );

    console.log(`\n  Alignment: ${summary.alignment}`);
    console.log(`  Top Strength: ${summary.top_strength}`);
    console.log(`  Top Gap: ${summary.top_gap}`);
    console.log(`  One Action: ${summary.one_action}`);

    const passed = summary.alignment === 'excellent' || summary.alignment === 'good';
    console.log(`\n  ${passed ? '✅' : '❌'} Quick summary ${passed ? 'correctly' : 'incorrectly'} assessed strong essay`);

    return passed;
  } catch (error) {
    console.log(`\n  ❌ Quick summary failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}

async function testCrossCollegeComparison(): Promise<boolean> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Testing: Cross-College Comparison`);
  console.log(`${'═'.repeat(70)}`);

  try {
    const comparison = await guidanceService.generateCrossCollegeComparison(
      MIT_FIT_ESSAY,
      stanfordResearch, // Target: Stanford
      [mitResearch, harvardResearch] // Compare to MIT and Harvard
    );

    console.log(`\n  Comparison: ${comparison.comparison}`);
    if (comparison.adjustment_needed) {
      console.log(`  Adjustment: ${comparison.adjustment_needed}`);
    }

    // The MIT essay should be noted as fitting MIT better
    const recognizesMITFit = comparison.comparison.toLowerCase().includes('mit');
    console.log(`\n  ${recognizesMITFit ? '✅' : '❌'} Comparison ${recognizesMITFit ? 'correctly' : 'incorrectly'} identifies MIT fit`);

    return recognizesMITFit;
  } catch (error) {
    console.log(`\n  ❌ Cross-college comparison failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           VALUE ALIGNMENT GUIDANCE TEST                              ║');
  console.log('║   Testing mindset-focused, value-based college guidance             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTimestamp: ${new Date().toISOString()}`);

  const results: TestResult[] = [];
  let totalCost = 0;

  // Test 1: Strong values essay (should need minimal guidance)
  const test1 = await runTest(
    'Strong Values Essay (Stanford)',
    STRONG_VALUES_ESSAY,
    stanfordResearch,
    {
      min_alignment: ['excellent', 'good'],
      min_score: 70,
      expect_strengths: true,
    }
  );
  results.push(test1);
  totalCost += test1.cost;

  // Test 2: Weak values essay (should need significant guidance)
  const test2 = await runTest(
    'Weak Values Essay (Stanford)',
    WEAK_VALUES_ESSAY,
    stanfordResearch,
    {
      max_alignment: ['moderate', 'weak'],
      max_score: 50,
      expect_critical_guidance: true,
    }
  );
  results.push(test2);
  totalCost += test2.cost;

  // Test 3: No values essay (should need critical guidance)
  const test3 = await runTest(
    'No Values Essay (Stanford)',
    NO_VALUES_ESSAY,
    stanfordResearch,
    {
      max_alignment: ['weak'],
      max_score: 35,
      expect_critical_guidance: true,
    }
  );
  results.push(test3);
  totalCost += test3.cost;

  // Test 4: MIT essay scored against Stanford (should note mismatch)
  const test4 = await runTest(
    'MIT Essay Against Stanford',
    MIT_FIT_ESSAY,
    stanfordResearch,
    {
      // Should be decent but not excellent for Stanford
      min_alignment: ['moderate', 'good'],
      max_alignment: ['moderate', 'good'],
    }
  );
  results.push(test4);
  totalCost += test4.cost;

  // Test 5: Quick summary
  const quickSummaryPassed = await testQuickSummary();

  // Test 6: Cross-college comparison
  const crossCollegePassed = await testCrossCollegeComparison();

  // Summary
  const duration = Date.now() - startTime;
  const passedCount = results.filter(r => r.passed).length + (quickSummaryPassed ? 1 : 0) + (crossCollegePassed ? 1 : 0);
  const totalTests = results.length + 2;

  console.log(`\n${'═'.repeat(70)}`);
  console.log('VALUE ALIGNMENT GUIDANCE SUMMARY');
  console.log(`${'═'.repeat(70)}`);
  console.log(`\nTests Passed: ${passedCount}/${totalTests}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);

  console.log('\n─────────────────────────────────────────────────────────────────────');
  console.log('QUALITY ANALYSIS');
  console.log('─────────────────────────────────────────────────────────────────────');

  const focusOnMindsetRate = results.filter(r => r.details.focuses_on_mindset).length / results.length;
  const avoidsProgramNamesRate = results.filter(r => r.details.avoids_program_names).length / results.length;

  console.log(`\n  Guidance Focuses on Mindset: ${(focusOnMindsetRate * 100).toFixed(0)}%`);
  console.log(`  Guidance Avoids Program Names: ${(avoidsProgramNamesRate * 100).toFixed(0)}%`);

  if (focusOnMindsetRate >= 0.75 && avoidsProgramNamesRate >= 0.75) {
    console.log('\n✅ GUIDANCE QUALITY: EXCELLENT');
    console.log('   Service correctly focuses on mindset over program references');
  } else if (focusOnMindsetRate >= 0.5) {
    console.log('\n⚠️ GUIDANCE QUALITY: ACCEPTABLE');
    console.log('   Some guidance may rely too much on program references');
  } else {
    console.log('\n❌ GUIDANCE QUALITY: NEEDS IMPROVEMENT');
    console.log('   Guidance should focus more on mindset and approach');
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(passedCount >= totalTests - 1 ? '✅ VALUE ALIGNMENT GUIDANCE: WORKING' : '❌ VALUE ALIGNMENT GUIDANCE: NEEDS ATTENTION');
  console.log(`${'═'.repeat(70)}`);

  process.exit(passedCount >= totalTests - 1 ? 0 : 1);
}

main().catch(console.error);
