/**
 * Test: Cross-College Comparison Integration
 *
 * Tests the integration of cross-college comparison into the main workshop pipeline.
 *
 * Key test scenarios:
 * 1. Workshop with cross-college comparison enabled
 * 2. Cross-college comparison correctly identifies best fit
 * 3. MIT-oriented essay recognized as better fit for MIT than Stanford
 * 4. Stanford-oriented essay recognized as better fit for Stanford than MIT
 * 5. Cost tracking for comparison feature
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);

import { EvolvedWorkshopOrchestrator } from '../src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import { mitResearch } from '../src/services/commonAppWorkshop/data/mit';
import { harvardResearch } from '../src/services/commonAppWorkshop/data/harvard';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

const orchestrator = new EvolvedWorkshopOrchestrator();

// ============================================================================
// TEST ESSAYS
// ============================================================================

// Essay with STRONG Stanford values (intellectual curiosity, rabbit holes)
const STANFORD_FIT_ESSAY = `The question that won't leave me alone isn't one anyone assigned. Last March, I was supposed to be studying for AP Bio, but instead I spent three weeks trying to understand why I feel guilty when I accidentally step on an ant.

It sounds absurd. But that guilt led me through Peter Singer's "Animal Liberation," then to Buddhist concepts of sentient beings, then to building an Arduino-based infrared sensor that warns insects before I walk. My friends think I've lost it. Maybe I have.

What fascinates me isn't the ethics conclusion I reached (I still eat chicken, so clearly I'm a hypocrite). It's the way one simple observation—guilt about an ant—branched into philosophy, religion, and electrical engineering. I didn't plan this. I just couldn't stop thinking about it.

That's the kind of mind I have. It wanders. It questions. It builds weird things at 2 AM because the question won't let go.`;

// Essay with STRONG MIT values (hands-on problem solving, making things work)
const MIT_FIT_ESSAY = `The water filter started as a failure. My first design clogged within hours. The second leaked. The third was so slow it would've taken days to purify a single liter.

But that third failure taught me something I couldn't have learned from a textbook: the difference between theoretical fluid dynamics and actual water behavior in a $2 PVC pipe.

I rebuilt the filter seventeen times. Not because I was patient—I'm not—but because every failure revealed something unexpected. The membrane porosity that worked in the YouTube video? Useless with our local water's mineral content. I had to figure out why.

Now our filter serves three families in my neighborhood who can't afford bottled water. It's not elegant. It's held together with zip ties and duct tape. But it works. And I understand WHY it works in a way I never could have from reading about it.`;

// Essay with STRONG Harvard values (leadership, making people better)
const HARVARD_FIT_ESSAY = `When I became president of the debate team, I inherited a club that hadn't won a tournament in three years. But what bothered me wasn't the losing—it was watching talented sophomores quit after one bad round.

So I changed my definition of success. Instead of tracking tournament wins, I started tracking "comeback stories"—members who lost badly, almost quit, but stayed and eventually found their voice.

The transformation wasn't in our trophy case. It was in watching Marcus, who couldn't make eye contact during his first speech, eventually argue before a panel of judges with such conviction that three of them approached him afterward about law school.

I'm not sure what I "led" exactly. I mostly just stayed after practice an extra hour, listened to frustrated teammates vent, and reminded them that the goal wasn't to win debates—it was to become the kind of person who isn't afraid to argue for what they believe.`;

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: {
    target_college: string;
    comparison_colleges: string[];
    best_fit_detected: string;
    expected_best_fit: string;
    target_alignment: string;
    cost: number;
  };
}

async function runCrossCollegeTest(
  name: string,
  essay: string,
  targetCollege: any,
  comparisonColleges: any[],
  expectedBestFit: string
): Promise<TestResult> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Testing: ${name}`);
  console.log(`${'═'.repeat(70)}`);

  try {
    const result = await orchestrator.runWorkshop({
      essayDraft: essay,
      essayType: 'intellectual_curiosity' as SupplementalType,
      college: targetCollege,
      comparisonColleges: comparisonColleges,
      enableCrossCollegeComparison: true,
      maxIssues: 1, // Minimize other processing
    });

    const comparison = result.stage1.cross_college_comparison;

    if (!comparison) {
      console.log('  ❌ No cross-college comparison generated');
      return {
        name,
        passed: false,
        details: {
          target_college: targetCollege.collegeName,
          comparison_colleges: comparisonColleges.map(c => c.collegeName),
          best_fit_detected: 'N/A',
          expected_best_fit: expectedBestFit,
          target_alignment: 'N/A',
          cost: 0,
        },
      };
    }

    const bestFitDetected = comparison.best_fit.college_name;
    const passed = bestFitDetected.toLowerCase().includes(expectedBestFit.toLowerCase());

    console.log(`\n  Target College: ${comparison.target_college}`);
    console.log(`  Comparison Colleges: ${comparison.comparison_colleges.join(', ')}`);
    console.log(`\n  Best Fit Detected: ${bestFitDetected}`);
    console.log(`  Best Fit Reason: ${comparison.best_fit.fit_reason}`);
    console.log(`\n  Target Fit:`);
    console.log(`    Alignment: ${comparison.target_fit.alignment_level}`);
    console.log(`    Strength: ${comparison.target_fit.key_strength}`);
    console.log(`    Gap: ${comparison.target_fit.key_gap}`);
    console.log(`    Guidance: ${comparison.target_fit.adjustment_guidance}`);

    console.log(`\n  Value Alignment Scores:`);
    comparison.value_alignment_scores.forEach(score => {
      console.log(`    ${score.college_name}: ${score.alignment_score}/100`);
      console.log(`      ✓ ${score.top_aligned_value}`);
      console.log(`      ✗ ${score.missing_value}`);
    });

    console.log(`\n  Expected Best Fit: ${expectedBestFit}`);
    console.log(`  ${passed ? '✅ CORRECT' : '❌ INCORRECT'} Best Fit Detection`);

    console.log(`\n  Comparison Cost: $${comparison.cost.toFixed(4)}`);
    console.log(`  Total Workshop Cost: $${result.cost.total.toFixed(4)}`);

    return {
      name,
      passed,
      details: {
        target_college: comparison.target_college,
        comparison_colleges: comparison.comparison_colleges,
        best_fit_detected: bestFitDetected,
        expected_best_fit: expectedBestFit,
        target_alignment: comparison.target_fit.alignment_level,
        cost: comparison.cost,
      },
    };
  } catch (error) {
    console.log(`  ❌ TEST ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
    return {
      name,
      passed: false,
      details: {
        target_college: targetCollege.collegeName,
        comparison_colleges: comparisonColleges.map(c => c.collegeName),
        best_fit_detected: 'ERROR',
        expected_best_fit: expectedBestFit,
        target_alignment: 'ERROR',
        cost: 0,
      },
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           CROSS-COLLEGE COMPARISON INTEGRATION TEST                  ║');
  console.log('║   Tests cross-college comparison in main workshop pipeline           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTimestamp: ${new Date().toISOString()}`);

  const results: TestResult[] = [];

  // Test 1: Stanford-fit essay should identify Stanford as best fit
  const test1 = await runCrossCollegeTest(
    'Stanford Essay → Best Fit Detection',
    STANFORD_FIT_ESSAY,
    stanfordResearch,
    [mitResearch, harvardResearch],
    'Stanford'
  );
  results.push(test1);

  // Test 2: MIT-fit essay should identify MIT as best fit
  const test2 = await runCrossCollegeTest(
    'MIT Essay → Best Fit Detection',
    MIT_FIT_ESSAY,
    stanfordResearch, // Target is Stanford
    [mitResearch, harvardResearch], // But should detect MIT as better fit
    'MIT'
  );
  results.push(test2);

  // Test 3: Harvard-fit essay should identify Harvard as best fit
  const test3 = await runCrossCollegeTest(
    'Harvard Essay → Best Fit Detection',
    HARVARD_FIT_ESSAY,
    mitResearch, // Target is MIT
    [stanfordResearch, harvardResearch], // But should detect Harvard as better fit
    'Harvard'
  );
  results.push(test3);

  // Summary
  const duration = Date.now() - startTime;
  const passedCount = results.filter(r => r.passed).length;
  const totalCost = results.reduce((sum, r) => sum + r.details.cost, 0);

  console.log(`\n${'═'.repeat(70)}`);
  console.log('CROSS-COLLEGE COMPARISON INTEGRATION SUMMARY');
  console.log(`${'═'.repeat(70)}`);
  console.log(`\nTests Passed: ${passedCount}/${results.length}`);
  console.log(`Total Comparison Cost: $${totalCost.toFixed(4)}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);

  console.log('\n─────────────────────────────────────────────────────────────────────');
  console.log('RESULTS BY TEST');
  console.log('─────────────────────────────────────────────────────────────────────');

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`\n${icon} ${r.name}`);
    console.log(`   Best Fit: ${r.details.best_fit_detected} (expected: ${r.details.expected_best_fit})`);
    console.log(`   Target Alignment: ${r.details.target_alignment}`);
  });

  console.log(`\n${'═'.repeat(70)}`);
  console.log(passedCount >= 2 ? '✅ CROSS-COLLEGE INTEGRATION: WORKING' : '❌ CROSS-COLLEGE INTEGRATION: NEEDS ATTENTION');
  console.log(`${'═'.repeat(70)}`);

  // Exit with appropriate code
  process.exit(passedCount >= 2 ? 0 : 1);
}

main().catch(console.error);
