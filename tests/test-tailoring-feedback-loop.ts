/**
 * Test: Tailoring Feedback Loop
 *
 * Tests the complete feedback loop:
 * 1. Score a universal suggestion with the tailoring rubric
 * 2. Enhance it with college overlay
 * 3. Score the enhanced version
 * 4. Verify improvement
 *
 * This test validates that our enhancement system actually IMPROVES tailoring scores.
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config(); // Load from project root

// Debug: Check if API key loaded
console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes (length: ' + process.env.ANTHROPIC_API_KEY.length + ')' : 'No'}`);

// Import CLASSES not singletons - we need to instantiate AFTER dotenv loads
import { CollegeOverlayEnhancer } from '../src/services/commonAppWorkshop/services/collegeOverlayEnhancer';
import { CollegeTailroingScoringService } from '../src/services/commonAppWorkshop/services/collegeTailoringScoringService';

// Create service instances AFTER env is loaded
const collegeTailroingScoringService = new CollegeTailroingScoringService();
const collegeOverlayEnhancer = new CollegeOverlayEnhancer();
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import type { TailoringAssessment } from '../src/services/commonAppWorkshop/rubrics/collegeTailoringRubric';

// ============================================================================
// TEST DATA
// ============================================================================

const testCases = [
  {
    name: 'Bioethics Interest - Generic to Stanford-Specific',
    universal: {
      text: 'I want to study bioethics at the intersection of science and philosophy, where I can explore the frameworks we use to make decisions about technologies we barely understand. That CRISPR article led me down a rabbit hole of bioethics papers, from principlism to newer frameworks.',
      rationale: 'Shows intellectual curiosity about ethical frameworks.',
    },
    essay_type: 'intellectual_curiosity',
    expected_improvement: {
      min_score_delta: 5,
      dimensions_should_improve: ['research_depth', 'value_alignment', 'distinctiveness'],
    },
  },
  {
    name: 'AI Interest - Generic Curiosity',
    universal: {
      text: 'I\'ve been thinking about how artificial intelligence will change society. The question of machine consciousness keeps me up at night. I spent three hours reading papers about neural networks and came away with more questions than answers.',
      rationale: 'Shows genuine curiosity about AI implications.',
    },
    essay_type: 'intellectual_curiosity',
    expected_improvement: {
      min_score_delta: 3,
      dimensions_should_improve: ['research_depth', 'citation_integration'],
    },
  },
  {
    name: 'Robotics Maker - Hands-on Interest',
    universal: {
      text: 'I want to work on robotics projects where I can iterate, fail, and build hands-on solutions to real problems. My first robot caught fire. The second worked for 12 seconds. By version 5, it could navigate my room.',
      rationale: 'Shows maker mindset and comfort with failure.',
    },
    essay_type: 'why_major',
    expected_improvement: {
      min_score_delta: 3,
      dimensions_should_improve: ['research_depth', 'distinctiveness'],
    },
  },
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  before_score: number;
  after_score: number;
  score_delta: number;
  dimensions_improved: string[];
  dimensions_degraded: string[];
  cost: number;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[Test] ${message}`);
}

function formatAssessment(assessment: TailoringAssessment): string {
  const lines = [
    `  Tailoring Score: ${assessment.tailoring_score}/100`,
    `  Quality Tier: ${assessment.tailoring_score >= 85 ? 'Excellent' : assessment.tailoring_score >= 70 ? 'Strong' : assessment.tailoring_score >= 55 ? 'Adequate' : 'Needs Work'}`,
    '',
    '  Dimension Scores:',
  ];

  for (const dim of assessment.dimension_scores) {
    const status = dim.score >= 7 ? '✅' : dim.score >= 5 ? '⚠️' : '❌';
    lines.push(`    ${status} ${dim.dimension}: ${dim.score}/10 (weight: ${dim.weight}%)`);
  }

  if (assessment.values_demonstrated.length > 0) {
    lines.push('');
    lines.push('  Values Demonstrated:');
    for (const val of assessment.values_demonstrated) {
      lines.push(`    - ${val.value_name}: ${val.strength}`);
    }
  }

  if (assessment.cliches_detected.length > 0) {
    lines.push('');
    lines.push('  Clichés Detected:');
    for (const cliche of assessment.cliches_detected) {
      lines.push(`    - "${cliche.pattern}" (${cliche.severity})`);
    }
  }

  if (assessment.elite_markers_present.length > 0) {
    lines.push('');
    lines.push(`  Elite Markers Present: ${assessment.elite_markers_present.join(', ')}`);
  }

  if (assessment.elite_markers_missing.length > 0) {
    lines.push(`  Elite Markers Missing: ${assessment.elite_markers_missing.join(', ')}`);
  }

  lines.push('');
  lines.push(`  Distinctiveness: ${assessment.distinctiveness_note}`);
  lines.push(`  Would work for other colleges: ${assessment.would_work_for_other_colleges ? 'Yes' : 'No'}`);

  return lines.join('\n');
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runFeedbackLoopTest(testCase: typeof testCases[0]): Promise<TestResult> {
  log(`\n${'='.repeat(60)}`);
  log(`Test: ${testCase.name}`);
  log(`${'='.repeat(60)}`);

  const startTime = Date.now();
  let totalCost = 0;

  try {
    // Step 1: Score the universal suggestion
    log('\nStep 1: Scoring UNIVERSAL suggestion...');
    const beforeResult = await collegeTailroingScoringService.scoreEssay({
      essay_text: testCase.universal.text,
      college: stanfordResearch,
      essay_type: testCase.essay_type,
    });
    totalCost += beforeResult.cost;

    log('\nUNIVERSAL Assessment:');
    console.log(formatAssessment(beforeResult.assessment));

    // Step 2: Enhance with college overlay
    log('\nStep 2: Enhancing with STANFORD overlay...');
    const enhancement = await collegeOverlayEnhancer.enhance({
      universal_suggestion: {
        text: testCase.universal.text,
        rationale: testCase.universal.rationale,
        score_impact: { before: 70, after: 85 },
        implementation: 'Show specific Stanford programs',
      } as any,
      college: stanfordResearch,
      issue_diagnosis: 'Could benefit from Stanford-specific context',
      weak_dimensions: ['research_depth', 'distinctiveness'],
    });

    log(`\nEnhancement Result:`);
    log(`  Text changed: ${enhancement.text !== testCase.universal.text}`);
    log(`  Changes made: ${enhancement.changes_made?.length || 0}`);
    if (enhancement.changes_made && enhancement.changes_made.length > 0) {
      for (const change of enhancement.changes_made) {
        log(`    - ${change.location}: "${change.original}" → "${change.enhanced}"`);
      }
    }
    log(`  Validation: use_enhanced=${enhancement.validation_result?.use_enhanced}`);

    // Log full enhanced text for debugging
    if (enhancement.text !== testCase.universal.text) {
      log(`\n  FULL ENHANCED TEXT:`);
      log(`  "${enhancement.text}"`);
    }

    // Step 3: Score the enhanced suggestion
    log('\nStep 3: Scoring ENHANCED suggestion...');
    const afterResult = await collegeTailroingScoringService.scoreEssay({
      essay_text: enhancement.text,
      college: stanfordResearch,
      essay_type: testCase.essay_type,
    });
    totalCost += afterResult.cost;

    log('\nENHANCED Assessment:');
    console.log(formatAssessment(afterResult.assessment));

    // Step 4: Compare results
    const scoreDelta = afterResult.assessment.tailoring_score - beforeResult.assessment.tailoring_score;

    const dimensionsImproved: string[] = [];
    const dimensionsDegraded: string[] = [];

    for (const afterDim of afterResult.assessment.dimension_scores) {
      const beforeDim = beforeResult.assessment.dimension_scores.find(
        d => d.dimension === afterDim.dimension
      );
      if (beforeDim) {
        if (afterDim.score > beforeDim.score) {
          dimensionsImproved.push(`${afterDim.dimension} (+${afterDim.score - beforeDim.score})`);
        } else if (afterDim.score < beforeDim.score) {
          dimensionsDegraded.push(`${afterDim.dimension} (${afterDim.score - beforeDim.score})`);
        }
      }
    }

    log('\n' + '─'.repeat(60));
    log('COMPARISON SUMMARY');
    log('─'.repeat(60));
    log(`Before Score: ${beforeResult.assessment.tailoring_score}/100`);
    log(`After Score:  ${afterResult.assessment.tailoring_score}/100`);
    log(`Delta:        ${scoreDelta > 0 ? '+' : ''}${scoreDelta}`);
    log('');
    log(`Dimensions Improved: ${dimensionsImproved.join(', ') || 'None'}`);
    log(`Dimensions Degraded: ${dimensionsDegraded.join(', ') || 'None'}`);
    log('');
    log(`Total Cost: $${totalCost.toFixed(4)}`);
    log(`Time: ${Date.now() - startTime}ms`);

    // Determine pass/fail
    const passed = scoreDelta >= testCase.expected_improvement.min_score_delta &&
                   dimensionsDegraded.length === 0;

    if (passed) {
      log(`\n✅ TEST PASSED: Score improved by ${scoreDelta} (expected >= ${testCase.expected_improvement.min_score_delta})`);
    } else {
      log(`\n❌ TEST FAILED:`);
      if (scoreDelta < testCase.expected_improvement.min_score_delta) {
        log(`   Score delta ${scoreDelta} < expected ${testCase.expected_improvement.min_score_delta}`);
      }
      if (dimensionsDegraded.length > 0) {
        log(`   Dimensions degraded: ${dimensionsDegraded.join(', ')}`);
      }
    }

    return {
      name: testCase.name,
      passed,
      details: passed
        ? `Improved by ${scoreDelta} points`
        : `Failed: delta=${scoreDelta}, degraded=${dimensionsDegraded.join(',')}`,
      before_score: beforeResult.assessment.tailoring_score,
      after_score: afterResult.assessment.tailoring_score,
      score_delta: scoreDelta,
      dimensions_improved: dimensionsImproved,
      dimensions_degraded: dimensionsDegraded,
      cost: totalCost,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`\n❌ TEST ERROR: ${message}`);

    return {
      name: testCase.name,
      passed: false,
      details: `Error: ${message}`,
      before_score: 0,
      after_score: 0,
      score_delta: 0,
      dimensions_improved: [],
      dimensions_degraded: [],
      cost: totalCost,
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     TAILORING FEEDBACK LOOP TEST                             ║');
  console.log('║     Testing: Universal → Enhancement → Score Improvement     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();
  let totalCost = 0;

  // Run all test cases
  for (const testCase of testCases) {
    const result = await runFeedbackLoopTest(testCase);
    results.push(result);
    totalCost += result.cost;
  }

  // Summary
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`Total Time: ${Date.now() - startTime}ms`);

  console.log('\nDetailed Results:');
  console.log('─'.repeat(70));

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   Before: ${result.before_score} → After: ${result.after_score} (Δ ${result.score_delta > 0 ? '+' : ''}${result.score_delta})`);
    if (result.dimensions_improved.length > 0) {
      console.log(`   Improved: ${result.dimensions_improved.join(', ')}`);
    }
    if (result.dimensions_degraded.length > 0) {
      console.log(`   Degraded: ${result.dimensions_degraded.join(', ')}`);
    }
    console.log('');
  }

  // Feedback loop quality metrics
  const avgScoreDelta = results.reduce((sum, r) => sum + r.score_delta, 0) / results.length;
  const avgBeforeScore = results.reduce((sum, r) => sum + r.before_score, 0) / results.length;
  const avgAfterScore = results.reduce((sum, r) => sum + r.after_score, 0) / results.length;

  console.log('═'.repeat(70));
  console.log('FEEDBACK LOOP QUALITY METRICS');
  console.log('═'.repeat(70));
  console.log(`Average Before Score: ${avgBeforeScore.toFixed(1)}/100`);
  console.log(`Average After Score:  ${avgAfterScore.toFixed(1)}/100`);
  console.log(`Average Improvement:  ${avgScoreDelta > 0 ? '+' : ''}${avgScoreDelta.toFixed(1)} points`);
  console.log(`Improvement Rate:     ${(results.filter(r => r.score_delta > 0).length / results.length * 100).toFixed(0)}%`);
  console.log(`Zero Degradation:     ${(results.filter(r => r.dimensions_degraded.length === 0).length / results.length * 100).toFixed(0)}%`);

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
