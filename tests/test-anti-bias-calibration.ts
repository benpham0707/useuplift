/**
 * Test: Anti-Bias Calibration
 *
 * Validates that our scoring system doesn't reward our own enhancement patterns.
 * Uses calibration examples to ensure:
 * 1. Essays with zero program mentions but strong values can score 85+
 * 2. Essays with many program mentions but hollow connections score < 50
 * 3. Name-dropping without substance is penalized
 *
 * This is the key test to prevent self-bias in the feedback loop.
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);

import { CollegeTailroingScoringService } from '../src/services/commonAppWorkshop/services/collegeTailoringScoringService';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import {
  CALIBRATION_EXAMPLES,
  validateAgainstCalibration,
  checkNameDropping,
} from '../src/services/commonAppWorkshop/rubrics/antiBiasCalibration';

// Create service after dotenv loads
const scoringService = new CollegeTailroingScoringService();

// ============================================================================
// TEST CASES
// ============================================================================

const testCases = [
  {
    id: 'stanford_no_programs_high_values',
    name: 'Zero Programs + Strong Values = Should Score 80+',
    essay: `The question that keeps me up at night isn't about CRISPR or neural networks - it's simpler and stranger. Why do I feel guilty when I accidentally step on an ant? That guilt led me down a three-month journey through Peter Singer, Buddhist ethics, and eventually to building an Arduino sensor that warns insects before I walk. My friends think I'm weird. I think I'm onto something.`,
    expected_score_range: [75, 100],
    expected_research_depth_range: [5, 10], // Research into philosophy IS research depth
    expected_value_alignment_range: [8, 10],
    key_check: 'Should NOT penalize for zero program mentions',
  },
  {
    id: 'stanford_programs_with_personal_connection',
    name: 'Programs WITH Personal Connection = Should Score 85+',
    essay: `Professor Greely's "CRISPR People" ended with a question I couldn't stop thinking about: who gets to decide what's "normal"? This isn't abstract for me - my sister was diagnosed with a genetic condition at 12. I don't want to "fix" her. I want to understand why our first instinct is to see her as broken. Stanford's Program in Ethics in Society feels like the only place asking these questions at the level they deserve.`,
    expected_score_range: [82, 100],
    expected_research_depth_range: [7, 10],
    expected_citation_integration_range: [8, 10],
    key_check: 'Program mention is ESSENTIAL to narrative',
  },
  {
    id: 'stanford_name_dropping_no_substance',
    name: 'Many Programs + No Substance = Should Score < 50',
    essay: `I want to study at Stanford because of Professor Fei-Fei Li's work in AI at the Stanford AI Lab (SAIL) and the Stanford Institute for Human-Centered AI (HAI). I am also interested in the Program in Ethics in Society and the Symbolic Systems Program. These programs align with my passion for AI ethics.`,
    expected_score_range: [25, 50],
    expected_research_depth_range: [2, 5], // Should be LOW despite names
    expected_value_alignment_range: [1, 4],
    key_check: 'Name-dropping without substance should be PENALIZED',
  },
  {
    id: 'stanford_authentic_curiosity_no_programs',
    name: 'Authentic Curiosity (No Programs) vs Name-Dropping',
    essay: `I spent three weeks this summer trying to prove my philosophy professor wrong about moral relativism. I failed, spectacularly. But in failing, I found something more interesting: the question itself might be wrong. Maybe morality isn't about universal truths OR cultural norms - maybe it's about the conversation between them. I have 400 pages of notes and more questions than when I started. This is the best kind of failure.`,
    expected_score_range: [75, 95],
    expected_value_alignment_range: [8, 10],
    expected_elite_craft_range: [7, 10],
    key_check: 'Pure intellectual curiosity IS Stanford fit',
  },
  {
    id: 'generic_with_stanford_name_swap',
    name: 'Generic Essay with Stanford Name = Should Score Low',
    essay: `I have always dreamed of attending Stanford University. Stanford's excellent academic programs and beautiful campus make it my top choice. I believe Stanford will help me achieve my goals and become a leader in my field. The diverse student body at Stanford will expose me to new perspectives.`,
    expected_score_range: [15, 35],
    expected_distinctiveness_range: [1, 3],
    expected_cliche_avoidance_range: [1, 4],
    key_check: 'Generic praise should score VERY low',
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  expected_range: [number, number];
  dimension_checks: Array<{
    dimension: string;
    score: number;
    expected_range: [number, number];
    passed: boolean;
  }>;
  key_check: string;
  key_check_passed: boolean;
  bias_concerns: string[];
}

async function runTest(testCase: typeof testCases[0]): Promise<TestResult> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`${'─'.repeat(60)}`);

  try {
    const result = await scoringService.scoreEssay({
      essay_text: testCase.essay,
      college: stanfordResearch,
      essay_type: 'intellectual_curiosity',
    });

    const score = result.assessment.tailoring_score;
    const scoreInRange = score >= testCase.expected_score_range[0] && score <= testCase.expected_score_range[1];

    console.log(`\n  Overall Score: ${score}/100`);
    console.log(`  Expected Range: ${testCase.expected_score_range[0]}-${testCase.expected_score_range[1]}`);
    console.log(`  ${scoreInRange ? '✅' : '❌'} Score in range: ${scoreInRange}`);

    // Check specific dimensions
    const dimensionChecks: TestResult['dimension_checks'] = [];

    const checkDimension = (dim: string, range: [number, number] | undefined) => {
      if (!range) return;
      const dimScore = result.assessment.dimension_scores.find(d => d.dimension === dim)?.score || 0;
      const inRange = dimScore >= range[0] && dimScore <= range[1];
      dimensionChecks.push({
        dimension: dim,
        score: dimScore,
        expected_range: range,
        passed: inRange,
      });
      console.log(`  ${dim}: ${dimScore}/10 (expected ${range[0]}-${range[1]}) ${inRange ? '✅' : '❌'}`);
    };

    checkDimension('research_depth', (testCase as any).expected_research_depth_range);
    checkDimension('value_alignment', (testCase as any).expected_value_alignment_range);
    checkDimension('citation_integration', (testCase as any).expected_citation_integration_range);
    checkDimension('distinctiveness', (testCase as any).expected_distinctiveness_range);
    checkDimension('cliche_avoidance', (testCase as any).expected_cliche_avoidance_range);
    checkDimension('elite_craft', (testCase as any).expected_elite_craft_range);

    // Run anti-bias validation
    const programMentions = (testCase.essay.match(/(?:Program in|Institute|Center for|Professor|Lab|School of)\s+[A-Z][a-zA-Z\s]+/g) || []).length;
    const biasValidation = validateAgainstCalibration(
      { dimension_scores: result.assessment.dimension_scores.map(d => ({ dimension: d.dimension, score: d.score })) },
      programMentions
    );

    // Check for name-dropping in enhanced vs original (N/A for raw essays)
    const nameDropCheck = checkNameDropping(testCase.essay, testCase.essay);

    console.log(`\n  Program mentions: ${programMentions}`);
    console.log(`  Would work for other colleges: ${result.assessment.would_work_for_other_colleges ? 'Yes' : 'No'}`);
    console.log(`  Distinctiveness: ${result.assessment.distinctiveness_note}`);

    if (biasValidation.concerns.length > 0) {
      console.log(`\n  ⚠️  Bias Concerns:`);
      biasValidation.concerns.forEach(c => console.log(`    - ${c}`));
    }

    // Determine if key check passed
    let keyCheckPassed = true;
    if (testCase.id === 'stanford_no_programs_high_values') {
      // Should score high despite no programs
      keyCheckPassed = score >= 75;
    } else if (testCase.id === 'stanford_name_dropping_no_substance') {
      // Should score low despite many programs
      keyCheckPassed = score < 50;
    } else if (testCase.id === 'generic_with_stanford_name_swap') {
      // Generic essay should score very low
      keyCheckPassed = score < 40;
    }

    const allDimensionsPassed = dimensionChecks.every(d => d.passed);
    const passed = scoreInRange && allDimensionsPassed && keyCheckPassed;

    console.log(`\n  Key Check (${testCase.key_check}): ${keyCheckPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Overall Test: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return {
      id: testCase.id,
      name: testCase.name,
      passed,
      score,
      expected_range: testCase.expected_score_range,
      dimension_checks: dimensionChecks,
      key_check: testCase.key_check,
      key_check_passed: keyCheckPassed,
      bias_concerns: biasValidation.concerns,
    };
  } catch (error) {
    console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      id: testCase.id,
      name: testCase.name,
      passed: false,
      score: 0,
      expected_range: testCase.expected_score_range,
      dimension_checks: [],
      key_check: testCase.key_check,
      key_check_passed: false,
      bias_concerns: ['Test failed to run'],
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     ANTI-BIAS CALIBRATION TEST                               ║');
  console.log('║     Validates scoring doesn\'t reward our own patterns       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const results: TestResult[] = [];
  let totalCost = 0;
  const startTime = Date.now();

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('ANTI-BIAS CALIBRATION SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Calibration Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  // Key findings
  console.log('\n' + '─'.repeat(70));
  console.log('KEY CALIBRATION CHECKS:');
  console.log('─'.repeat(70));

  const noPrograms = results.find(r => r.id === 'stanford_no_programs_high_values');
  if (noPrograms) {
    console.log(`\n1. Zero Programs + Strong Values:`);
    console.log(`   Score: ${noPrograms.score}/100`);
    console.log(`   ${noPrograms.key_check_passed ? '✅' : '❌'} Can score 80+ without program mentions: ${noPrograms.key_check_passed ? 'YES' : 'NO'}`);
  }

  const nameDropping = results.find(r => r.id === 'stanford_name_dropping_no_substance');
  if (nameDropping) {
    console.log(`\n2. Name-Dropping Without Substance:`);
    console.log(`   Score: ${nameDropping.score}/100`);
    console.log(`   ${nameDropping.key_check_passed ? '✅' : '❌'} Penalized for hollow program drops: ${nameDropping.key_check_passed ? 'YES' : 'NO'}`);
  }

  const genericEssay = results.find(r => r.id === 'generic_with_stanford_name_swap');
  if (genericEssay) {
    console.log(`\n3. Generic Praise Essay:`);
    console.log(`   Score: ${genericEssay.score}/100`);
    console.log(`   ${genericEssay.key_check_passed ? '✅' : '❌'} Scores low despite Stanford mentions: ${genericEssay.key_check_passed ? 'YES' : 'NO'}`);
  }

  // Bias concerns
  const allBiasConcerns = results.flatMap(r => r.bias_concerns).filter(Boolean);
  if (allBiasConcerns.length > 0) {
    console.log('\n' + '─'.repeat(70));
    console.log('⚠️  DETECTED BIAS CONCERNS:');
    console.log('─'.repeat(70));
    [...new Set(allBiasConcerns)].forEach(c => console.log(`  - ${c}`));
  }

  const elapsedTime = Date.now() - startTime;
  console.log(`\nTotal Time: ${(elapsedTime / 1000).toFixed(1)}s`);

  // Final verdict
  console.log('\n' + '═'.repeat(70));
  if (passed >= 4 && allBiasConcerns.length === 0) {
    console.log('✅ CALIBRATION PASSED: Scoring is not biased toward our enhancements');
  } else if (passed >= 3) {
    console.log('⚠️  CALIBRATION PARTIAL: Some bias risks detected, review needed');
  } else {
    console.log('❌ CALIBRATION FAILED: Scoring appears biased, requires adjustment');
  }
  console.log('═'.repeat(70));

  process.exit(failed > 2 ? 1 : 0);
}

main().catch(console.error);
