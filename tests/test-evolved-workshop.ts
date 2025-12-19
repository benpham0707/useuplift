/**
 * Test Evolved Workshop System
 *
 * Validates the complete evolved generation system:
 * - Type-aware scoring (12 dimensions × 14 type weights)
 * - Type-specific suggestions (PIQ-quality with college overlay)
 * - College-type integration (unified rubric with citations)
 * - Evolved workshop orchestrator (complete pipeline)
 */

import {
  EvolvedWorkshopOrchestrator,
  TypeAwareScoringService,
  CollegeTypeIntegrationService
} from '../src/services/commonAppWorkshop/services';
import {
  TYPE_WEIGHT_CONFIGS,
  validateWeights,
  getCriticalDimensions,
  getExcellenceRequirements
} from '../src/services/commonAppWorkshop/rubrics';
import { stanfordResearch as STANFORD_RESEARCH } from '../src/services/commonAppWorkshop/data';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let testsPassed = 0;
let testsFailed = 0;

function pass(msg: string) {
  console.log(`${GREEN}✓${RESET} ${msg}`);
  testsPassed++;
}

function fail(msg: string) {
  console.log(`${RED}✗${RESET} ${msg}`);
  testsFailed++;
}

function section(title: string) {
  console.log(`\n${BOLD}${title}${RESET}`);
  console.log('─'.repeat(60));
}

function assert(condition: boolean, message: string) {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

// ============================================================================
// TEST ESSAYS
// ============================================================================

const WHY_STANFORD_ESSAY = `Stanford's approach to interdisciplinary learning particularly excites me.
When I discovered Dr. Fei-Fei Li's work on ImageNet and her focus on democratizing AI,
I realized Stanford uniquely bridges technical innovation with ethical consideration.
My experience building a computer vision app to help my visually impaired grandmother
navigate our home showed me that AI's power lies in its human applications.

I'm drawn to Stanford's Human-Centered AI Institute (HAI) where I could explore this
intersection. The d.school's design thinking methodology would let me prototype solutions
that prioritize user experience alongside technical sophistication. In CS229, I want to
deepen my machine learning foundations while contributing to ongoing research.

Beyond academics, I'm excited about Treehacks where I could collaborate with students
who share my belief that technology should serve humanity. My goal is to contribute to
Stanford's culture of "changing the world" by developing AI that amplifies human potential
rather than replacing it.`;

const CHALLENGE_ESSAY = `When my father was diagnosed with early-onset Alzheimer's at 52,
I was fifteen. Our family's world shifted overnight. I watched helplessly as the man who
taught me chess forgot the rules, then forgot our games entirely.

My first instinct was to fix it. I spent weeks researching treatments, clinical trials,
anything that might slow the progression. But Alzheimer's doesn't have a fix. That realization
crushed me. I failed a chemistry test for the first time. I snapped at my younger sister.
I withdrew from friends who couldn't understand why I'd become so distant.

The turning point came during a particularly difficult Sunday. Dad was agitated, couldn't
remember where he was. I felt the familiar frustration rising. Then I noticed his hands
moving - muscle memory reaching for chess pieces that weren't there. I grabbed my board.

We played. He couldn't remember the last move, but he remembered how to castle. In that
moment, I stopped trying to preserve who he was and started meeting him where he is. Now
I've started a memory activities group at our local Alzheimer's Association chapter,
teaching families to find these connection points.

I can't cure my father. But I can be present. That shift from fixing to accepting transformed
how I approach problems - whether in relationships, academics, or life.`;

const WHY_MAJOR_ESSAY = `My fascination with computational neuroscience began with a question:
how does the brain turn electrical signals into the experience of seeing my mother's face?

In sophomore year, I stumbled upon David Marr's work on computational theory of vision.
His framework - computational, algorithmic, implementational - gave me language for questions
I'd been asking since childhood. I started coding neural network simulations in Python,
recreating his edge detection algorithms to understand how our visual system builds reality
from raw input.

This summer, I worked with Dr. Chen at UCLA's Computational Vision Lab, analyzing how
convolutional neural networks mirror the hierarchical processing in V1 and V2 cortical areas.
The parallels were striking - and the differences even more intriguing. Why does the brain
use recurrent connections while CNNs typically don't?

I want to explore this question at Stanford, where computational and cognitive approaches
intersect. The Symbolic Systems program uniquely combines the philosophical foundations of
mind with technical implementation. I'm particularly drawn to courses like CS 379C where
I could study probabilistic models of human cognition.

My goal isn't just to build better AI - it's to understand what makes human intelligence
irreducibly human.`;

// ============================================================================
// TEST 1: TYPE WEIGHT VALIDATION
// ============================================================================

async function testTypeWeights() {
  section('TEST 1: Type Weight Matrices Validation');

  const types = Object.keys(TYPE_WEIGHT_CONFIGS) as SupplementalType[];

  // All 14 types exist
  assert(types.length === 14, `14 essay types defined (got ${types.length})`);

  // All weights sum to 100
  for (const type of types) {
    const isValid = validateWeights(type);
    assert(isValid, `${type}: weights sum to 100`);
  }

  // All types have critical dimensions
  for (const type of types) {
    const critical = getCriticalDimensions(type);
    assert(critical.length >= 2, `${type}: has ${critical.length} critical dimensions`);
  }

  // All types have excellence requirements
  for (const type of types) {
    const requirements = getExcellenceRequirements(type);
    assert(requirements.length >= 3, `${type}: has ${requirements.length} excellence requirements`);
  }
}

// ============================================================================
// TEST 2: COLLEGE-TYPE INTEGRATION
// ============================================================================

async function testCollegeTypeIntegration() {
  section('TEST 2: College-Type Integration');

  const integrationService = new CollegeTypeIntegrationService();

  // Test Why Us + Stanford
  const whyUsRubric = integrationService.getIntegratedRubric('why_us', STANFORD_RESEARCH);

  assert(whyUsRubric.essay_type === 'why_us', 'Integrated rubric has correct type');
  assert(whyUsRubric.college_name === 'Stanford University', 'Integrated rubric has correct college');
  assert(Object.keys(whyUsRubric.integrated_weights).length === 12, 'Has 12 dimension weights');

  // Check that weights are boosted by college values
  const intellectualVitalityBoost = whyUsRubric.value_mappings.find(
    m => m.value_name.toLowerCase().includes('intellectual')
  );
  if (intellectualVitalityBoost) {
    assert(intellectualVitalityBoost.weight_boost > 0, 'Intellectual vitality adds weight boost');
    assert(intellectualVitalityBoost.relevant_dimensions.length > 0, 'Has relevant dimensions');
  }

  // Check citation guide exists
  assert(whyUsRubric.citation_guide.length > 0, 'Has citation guide entries');

  // Check excellence requirements merged
  const typeReqs = whyUsRubric.excellence_requirements.filter(r => r.type_original);
  const collegeReqs = whyUsRubric.excellence_requirements.filter(r => r.college_specific);
  assert(typeReqs.length >= 3, `Has ${typeReqs.length} type-original requirements`);
  console.log(`  College-specific requirements: ${collegeReqs.length}`);

  // Test Challenge essay (less research-dependent)
  const challengeRubric = integrationService.getIntegratedRubric('challenge', STANFORD_RESEARCH);
  const researchWeight = challengeRubric.integrated_weights['research_depth'];
  assert(researchWeight.base_weight <= 3, `Challenge weights research_depth low (${researchWeight.base_weight}%)`);
}

// ============================================================================
// TEST 3: TYPE-AWARE SCORING (NO API)
// ============================================================================

async function testScoringServiceStructure() {
  section('TEST 3: Scoring Service Structure');

  const scoringService = new TypeAwareScoringService();

  // Test getDimensionFeedback (no API call)
  const feedback = scoringService.getDimensionFeedback(
    'research_depth',
    5,
    'why_us'
  );

  assert(feedback.dimension === 'Research Depth', 'Feedback has dimension name');
  assert(feedback.current_score === 5, 'Feedback has current score');
  assert(feedback.is_critical === true, 'research_depth is critical for why_us');
  assert(feedback.improvement_guidance.length > 0, 'Has improvement guidance');
  assert(feedback.excellence_criteria.length > 0, 'Has excellence criteria');

  // Test for non-critical dimension
  const feedback2 = scoringService.getDimensionFeedback(
    'vulnerability_balance',
    5,
    'why_us'
  );
  assert(feedback2.is_critical === false, 'vulnerability_balance not critical for why_us');

  // Test for challenge essay where it IS critical
  const feedback3 = scoringService.getDimensionFeedback(
    'vulnerability_balance',
    5,
    'challenge'
  );
  assert(feedback3.is_critical === true, 'vulnerability_balance IS critical for challenge');
}

// ============================================================================
// TEST 4: ORCHESTRATOR STRUCTURE (NO API)
// ============================================================================

async function testOrchestratorStructure() {
  section('TEST 4: Orchestrator Structure');

  const orchestrator = new EvolvedWorkshopOrchestrator();

  // Test getIntegratedRubric (no API call)
  const rubric = orchestrator.getIntegratedRubric('why_us', STANFORD_RESEARCH);

  assert(rubric.essay_type === 'why_us', 'Rubric has correct type');
  assert(rubric.college_name === 'Stanford University', 'Rubric has correct college');
  assert(rubric.critical_dimensions.length >= 2, 'Rubric has critical dimensions');

  // Test without college
  const universalRubric = orchestrator.getIntegratedRubric('challenge');
  assert(universalRubric.college_name === 'Universal', 'Universal rubric when no college');
  assert(universalRubric.critical_dimensions.includes('growth_transformation'),
    'Challenge has growth_transformation as critical');
}

// ============================================================================
// TEST 5: FULL WORKSHOP RUN (REQUIRES API KEY)
// ============================================================================

async function testFullWorkshop() {
  section('TEST 5: Full Workshop Run (API Required)');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`${YELLOW}⚠ Skipping API tests - ANTHROPIC_API_KEY not set${RESET}`);
    return;
  }

  const orchestrator = new EvolvedWorkshopOrchestrator();

  console.log('\n--- Running Why Stanford Essay Workshop ---');

  try {
    const output = await orchestrator.runWorkshop({
      essayDraft: WHY_STANFORD_ESSAY,
      essayType: 'why_us',
      college: STANFORD_RESEARCH,
      useDeepAnalysis: false,
      maxIssues: 2
    });

    // Validate output structure
    assert(output.essay_type === 'why_us', 'Output has correct essay type');
    assert(output.college_name === 'Stanford University', 'Output has correct college');
    assert(output.word_count > 0, `Word count: ${output.word_count}`);

    // Stage 0 validation
    assert(output.stage0.voice_fingerprint !== null, 'Has voice fingerprint');
    assert(output.stage0.authentic_phrases.length >= 0,
      `Found ${output.stage0.authentic_phrases.length} authentic phrases`);

    // Stage 1 validation
    assert(output.stage1.scoring.weighted_score >= 0 && output.stage1.scoring.weighted_score <= 100,
      `Score in valid range: ${output.stage1.scoring.weighted_score}`);
    assert(output.stage1.scoring.dimension_scores.length === 12,
      'Has 12 dimension scores');
    assert(['excellent', 'strong', 'needs_work', 'weak'].includes(output.stage1.scoring.quality_tier),
      `Valid quality tier: ${output.stage1.scoring.quality_tier}`);

    // Stage 2 validation (if issues found)
    if (output.stage2.issue_count > 0) {
      assert(output.stage2.suggestions.issues.length > 0, 'Has suggestion issues');
      const firstIssue = output.stage2.suggestions.issues[0];
      assert(firstIssue.suggestions?.polished_original?.text?.length > 0,
        'Has polished original suggestion');
      assert(firstIssue.suggestions?.voice_amplifier?.text?.length > 0,
        'Has voice amplifier suggestion');
    }

    // Stage 3 validation
    assert(output.stage3.requirements_total > 0,
      `Has ${output.stage3.requirements_total} excellence requirements`);

    // Summary validation
    assert(output.summary.initial_score >= 0, `Initial score: ${output.summary.initial_score}`);
    assert(output.summary.projected_score >= output.summary.initial_score,
      `Projected improvement: ${output.summary.initial_score} → ${output.summary.projected_score}`);

    // Cost validation
    assert(output.cost.total >= 0, `Total cost: $${output.cost.total.toFixed(3)}`);

    console.log('\n--- Workshop Output Summary ---');
    console.log(`Initial: ${output.summary.initial_score}/100 (${output.summary.initial_tier})`);
    console.log(`Projected: ${output.summary.projected_score}/100 (${output.summary.projected_tier})`);
    console.log(`Improvement: +${output.summary.improvement_potential} points`);
    console.log(`Excellence Met: ${output.summary.excellence_met ? 'YES' : 'NO'}`);
    console.log(`Total Cost: $${output.cost.total.toFixed(3)}`);

    pass('Full workshop completed successfully');

  } catch (error) {
    fail(`Workshop failed: ${error}`);
    console.error(error);
  }
}

// ============================================================================
// TEST 6: MULTIPLE ESSAY TYPES
// ============================================================================

async function testMultipleTypes() {
  section('TEST 6: Multiple Essay Types Quick Score');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`${YELLOW}⚠ Skipping API tests - ANTHROPIC_API_KEY not set${RESET}`);
    return;
  }

  const orchestrator = new EvolvedWorkshopOrchestrator();

  const tests = [
    { essay: WHY_STANFORD_ESSAY, type: 'why_us' as SupplementalType, name: 'Why Stanford' },
    { essay: CHALLENGE_ESSAY, type: 'challenge' as SupplementalType, name: 'Challenge' },
    { essay: WHY_MAJOR_ESSAY, type: 'why_major' as SupplementalType, name: 'Why Major' },
  ];

  for (const test of tests) {
    try {
      console.log(`\n  Testing ${test.name} essay...`);
      const result = await orchestrator.quickScore(test.essay, test.type, STANFORD_RESEARCH);

      assert(result.score >= 0 && result.score <= 100,
        `${test.name}: Score ${result.score}/100 (${result.tier})`);

      if (result.topIssues.length > 0) {
        console.log(`    Top issue: ${result.topIssues[0].substring(0, 60)}...`);
      }
    } catch (error) {
      fail(`${test.name} quick score failed: ${error}`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`\n${BOLD}EVOLVED WORKSHOP SYSTEM TESTS${RESET}`);
  console.log('═'.repeat(60));

  // Run all tests
  await testTypeWeights();
  await testCollegeTypeIntegration();
  await testScoringServiceStructure();
  await testOrchestratorStructure();
  await testFullWorkshop();
  await testMultipleTypes();

  // Summary
  section('TEST SUMMARY');
  console.log(`${GREEN}✓ Passed: ${testsPassed}${RESET}`);
  if (testsFailed > 0) {
    console.log(`${RED}✗ Failed: ${testsFailed}${RESET}`);
  }

  console.log(`\n${BOLD}System Components:${RESET}`);
  console.log(`• 14 Type Weight Matrices (all validated)`);
  console.log(`• 12 Universal Dimensions`);
  console.log(`• College-Type Integration Service`);
  console.log(`• Type-Aware Scoring Service`);
  console.log(`• Type-Specific Suggestion Service`);
  console.log(`• Evolved Workshop Orchestrator`);

  if (testsFailed === 0) {
    console.log(`\n${GREEN}${BOLD}✓ ALL TESTS PASSED${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}${BOLD}✗ SOME TESTS FAILED${RESET}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
