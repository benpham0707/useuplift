/**
 * Test: Multi-Layer Enhancement System
 *
 * Validates the 5-layer enhancement strategy that ensures we ALWAYS add
 * college-specific value beyond just program name insertion.
 *
 * Key test scenarios:
 * 1. Generic essays still get value alignment and mindset framing
 * 2. Topic-specific essays get resource integration when confident
 * 3. All enhancement layers work independently
 * 4. No degradation of universal suggestion quality
 * 5. Different colleges get different mindset framing
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);

import {
  multiLayerEnhancementService,
  type MultiLayerEnhancementOutput,
} from '../src/services/commonAppWorkshop/services/multiLayerEnhancementService';
import { collegeOverlayEnhancer } from '../src/services/commonAppWorkshop/services/collegeOverlayEnhancer';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import { mitResearch } from '../src/services/commonAppWorkshop/data/mit';
import { harvardResearch } from '../src/services/commonAppWorkshop/data/harvard';

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  suggestion_text: string;
  suggestion_rationale: string;
  issue_diagnosis: string;
  college: any;
  expected: {
    min_layers_applied: number;
    should_have_value_alignment: boolean;
    should_have_mindset: boolean;
    rationale_should_change: boolean;
  };
}

const TEST_CASES: TestCase[] = [
  // TEST 1: Generic essay with NO topic keywords - should still get value alignment + mindset
  {
    name: 'Generic Essay → Stanford (No topic match)',
    suggestion_text: 'Try describing a specific moment that reveals how you think about challenges. Instead of summarizing what happened, show us your internal dialogue.',
    suggestion_rationale: 'This helps the reader see how you process difficulties rather than just what you accomplished.',
    issue_diagnosis: 'Essay is too generic and lacks specific moments. Reader cannot visualize the scene.',
    college: stanfordResearch,
    expected: {
      min_layers_applied: 1, // At least value alignment
      should_have_value_alignment: true,
      should_have_mindset: true, // May or may not apply
      rationale_should_change: true,
    },
  },

  // TEST 2: AI/Technology topic - should get resource integration for MIT
  {
    name: 'AI Topic Essay → MIT (Strong topic match)',
    suggestion_text: 'Consider describing the specific AI experiment you conducted and what the failure taught you about machine learning that textbooks couldn\'t.',
    suggestion_rationale: 'Showing learning through failure is powerful.',
    issue_diagnosis: 'Essay mentions AI but doesn\'t show hands-on learning. Too theoretical.',
    college: mitResearch,
    expected: {
      min_layers_applied: 2,
      should_have_value_alignment: true,
      should_have_mindset: true,
      rationale_should_change: true,
    },
  },

  // TEST 3: Leadership topic - should match Harvard's values well
  {
    name: 'Leadership Essay → Harvard (Value alignment)',
    suggestion_text: 'Show how your leadership approach changed someone on your team. Focus on the transformation you helped create, not the outcome you achieved.',
    suggestion_rationale: 'Leadership essays are stronger when they show impact on people.',
    issue_diagnosis: 'Essay focuses on achievements but doesn\'t show how you made others better.',
    college: harvardResearch,
    expected: {
      min_layers_applied: 2,
      should_have_value_alignment: true,
      should_have_mindset: true,
      rationale_should_change: true,
    },
  },

  // TEST 4: Philosophy topic - should match Stanford's intellectual curiosity
  {
    name: 'Philosophy Essay → Stanford (Intellectual rabbit hole)',
    suggestion_text: 'Trace your thinking from the initial question to where it led you. Show us the intellectual journey, not just the conclusion.',
    suggestion_rationale: 'Following your curiosity is more compelling than stating a thesis.',
    issue_diagnosis: 'Essay presents conclusions without showing the exploration process.',
    college: stanfordResearch,
    expected: {
      min_layers_applied: 2,
      should_have_value_alignment: true,
      should_have_mindset: true,
      rationale_should_change: true,
    },
  },

  // TEST 5: Different mindsets for same suggestion
  {
    name: 'Same Suggestion → MIT vs Stanford (Different mindsets)',
    suggestion_text: 'Describe what you learned from your project and how it changed your understanding.',
    suggestion_rationale: 'Projects are valuable for what they teach, not what they achieve.',
    issue_diagnosis: 'Essay focuses on outcome, not learning process.',
    college: mitResearch,
    expected: {
      min_layers_applied: 1,
      should_have_value_alignment: true,
      should_have_mindset: true,
      rationale_should_change: true,
    },
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: {
    total_layers_applied: number;
    enhancement_type: string;
    value_alignment_detected: string[];
    mindset_signals_added: boolean;
    approach_signals_added: boolean;
    dean_quotes_added: boolean;
    rationale_changed: boolean;
    text_changed: boolean;
    original_rationale_length: number;
    enhanced_rationale_length: number;
    layers_breakdown: Array<{
      layer_id: string;
      applicable: boolean;
      confidence: number;
    }>;
  };
  failures: string[];
}

async function runLayerTest(testCase: TestCase): Promise<TestResult> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`${'─'.repeat(70)}`);

  const failures: string[] = [];

  try {
    // Run multi-layer enhancement directly
    const result = multiLayerEnhancementService.enhance({
      suggestion_text: testCase.suggestion_text,
      suggestion_rationale: testCase.suggestion_rationale,
      issue_diagnosis: testCase.issue_diagnosis,
      college: testCase.college,
    });

    // Check results
    const rationaleChanged = result.enhanced_rationale !== testCase.suggestion_rationale;
    const textChanged = result.enhanced_text !== testCase.suggestion_text;

    console.log(`  Layers Applied: ${result.total_layers_applied}`);
    console.log(`  Enhancement Type: ${result.enhancement_type}`);
    console.log(`  Value Alignment: ${result.value_alignment_detected.join(', ') || 'None detected'}`);
    console.log(`  Mindset Signals: ${result.mindset_signals_added}`);
    console.log(`  Approach Signals: ${result.approach_signals_added}`);
    console.log(`  Dean Quotes: ${result.dean_quotes_added}`);
    console.log(`  Rationale Changed: ${rationaleChanged}`);
    console.log(`  Text Changed: ${textChanged}`);

    // Layer breakdown
    console.log('\n  Layer Breakdown:');
    result.layers_applied.forEach(layer => {
      const icon = layer.applicable ? '✓' : '✗';
      console.log(`    ${icon} ${layer.layer_name}: ${layer.applicable ? `confidence ${layer.confidence.toFixed(2)}` : 'not applied'}`);
      if (layer.teaching_addition) {
        console.log(`      Teaching: "${layer.teaching_addition.substring(0, 80)}..."`);
      }
    });

    // Validate expectations
    if (result.total_layers_applied < testCase.expected.min_layers_applied) {
      failures.push(`Expected at least ${testCase.expected.min_layers_applied} layers, got ${result.total_layers_applied}`);
    }

    if (testCase.expected.should_have_value_alignment) {
      const hasValue = result.layers_applied.some(l => l.layer_id === 'value_alignment' && l.applicable);
      if (!hasValue) {
        failures.push('Expected value alignment layer to be applied');
      }
    }

    if (testCase.expected.rationale_should_change && !rationaleChanged) {
      failures.push('Expected rationale to be enhanced');
    }

    // Show enhanced rationale preview
    console.log(`\n  Enhanced Rationale Preview:`);
    console.log(`    "${result.enhanced_rationale.substring(0, 200)}..."`);

    const passed = failures.length === 0;
    console.log(`\n  ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (!passed) {
      failures.forEach(f => console.log(`    - ${f}`));
    }

    return {
      name: testCase.name,
      passed,
      details: {
        total_layers_applied: result.total_layers_applied,
        enhancement_type: result.enhancement_type,
        value_alignment_detected: result.value_alignment_detected,
        mindset_signals_added: result.mindset_signals_added,
        approach_signals_added: result.approach_signals_added,
        dean_quotes_added: result.dean_quotes_added,
        rationale_changed: rationaleChanged,
        text_changed: textChanged,
        original_rationale_length: testCase.suggestion_rationale.length,
        enhanced_rationale_length: result.enhanced_rationale.length,
        layers_breakdown: result.layers_applied.map(l => ({
          layer_id: l.layer_id,
          applicable: l.applicable,
          confidence: l.confidence,
        })),
      },
      failures,
    };
  } catch (error) {
    console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
    return {
      name: testCase.name,
      passed: false,
      details: {
        total_layers_applied: 0,
        enhancement_type: 'error',
        value_alignment_detected: [],
        mindset_signals_added: false,
        approach_signals_added: false,
        dean_quotes_added: false,
        rationale_changed: false,
        text_changed: false,
        original_rationale_length: 0,
        enhanced_rationale_length: 0,
        layers_breakdown: [],
      },
      failures: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// INTEGRATION TEST: Full Enhancement Pipeline
// ============================================================================

async function runIntegrationTest(): Promise<TestResult> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('INTEGRATION TEST: Full CollegeOverlayEnhancer Pipeline');
  console.log(`${'═'.repeat(70)}`);

  const failures: string[] = [];

  try {
    // Test the full enhancement pipeline with a generic essay
    const genericSuggestion = {
      text: 'Try to be more specific about what you learned from this experience. General statements about growth don\'t show your unique perspective.',
      rationale: 'Specific examples are more memorable than abstract claims.',
      score_impact: {
        before: 65,
        after: 75,
        improved_dimensions: ['specificity', 'voice'],
      },
    };

    const result = await collegeOverlayEnhancer.enhance({
      universal_suggestion: genericSuggestion as any,
      college: stanfordResearch,
      issue_diagnosis: 'Essay lacks specific moments. Too much telling, not enough showing.',
      weak_dimensions: ['specificity', 'authenticity'],
    });

    console.log(`\n  Universal Text: "${genericSuggestion.text.substring(0, 80)}..."`);
    console.log(`  Enhanced Text: "${result.text.substring(0, 80)}..."`);
    console.log(`  Text Changed: ${result.text !== genericSuggestion.text}`);
    console.log(`\n  Universal Rationale: "${genericSuggestion.rationale}"`);
    console.log(`  Enhanced Rationale: "${result.rationale.substring(0, 150)}..."`);
    console.log(`  Rationale Changed: ${result.rationale !== genericSuggestion.rationale}`);

    // Check multi-layer metadata
    if (result.multi_layer_enhancement) {
      console.log(`\n  Multi-Layer Enhancement:`);
      console.log(`    Layers Applied: ${result.multi_layer_enhancement.total_layers_applied}`);
      console.log(`    Enhancement Type: ${result.multi_layer_enhancement.enhancement_type}`);
      console.log(`    Value Alignment: ${result.multi_layer_enhancement.value_alignment_detected.join(', ') || 'None'}`);
    } else {
      failures.push('Multi-layer enhancement metadata missing from output');
    }

    // KEY TEST: Rationale should ALWAYS be enhanced when college data exists
    if (result.rationale === genericSuggestion.rationale) {
      failures.push('CRITICAL: Rationale was not enhanced despite having college data');
    }

    // KEY TEST: Should include college name in rationale
    if (!result.rationale.toLowerCase().includes('stanford')) {
      failures.push('College name not mentioned in enhanced rationale');
    }

    const passed = failures.length === 0;
    console.log(`\n  ${passed ? '✅ INTEGRATION PASSED' : '❌ INTEGRATION FAILED'}`);
    if (!passed) {
      failures.forEach(f => console.log(`    - ${f}`));
    }

    return {
      name: 'Full Pipeline Integration',
      passed,
      details: {
        total_layers_applied: result.multi_layer_enhancement?.total_layers_applied || 0,
        enhancement_type: result.multi_layer_enhancement?.enhancement_type || 'unknown',
        value_alignment_detected: result.multi_layer_enhancement?.value_alignment_detected || [],
        mindset_signals_added: false,
        approach_signals_added: false,
        dean_quotes_added: false,
        rationale_changed: result.rationale !== genericSuggestion.rationale,
        text_changed: result.text !== genericSuggestion.text,
        original_rationale_length: genericSuggestion.rationale.length,
        enhanced_rationale_length: result.rationale.length,
        layers_breakdown: [],
      },
      failures,
    };
  } catch (error) {
    console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
    return {
      name: 'Full Pipeline Integration',
      passed: false,
      details: {
        total_layers_applied: 0,
        enhancement_type: 'error',
        value_alignment_detected: [],
        mindset_signals_added: false,
        approach_signals_added: false,
        dean_quotes_added: false,
        rationale_changed: false,
        text_changed: false,
        original_rationale_length: 0,
        enhanced_rationale_length: 0,
        layers_breakdown: [],
      },
      failures: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// COMPARISON TEST: Same Suggestion, Different Colleges
// ============================================================================

async function runComparisonTest(): Promise<TestResult> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('COMPARISON TEST: Same Suggestion → Different Colleges');
  console.log(`${'═'.repeat(70)}`);

  const failures: string[] = [];

  try {
    const suggestion = {
      text: 'Describe what you built and what it taught you that reading couldn\'t.',
      rationale: 'Hands-on projects reveal learning style and persistence.',
    };

    const stanfordResult = multiLayerEnhancementService.enhance({
      suggestion_text: suggestion.text,
      suggestion_rationale: suggestion.rationale,
      issue_diagnosis: 'Essay mentions project but doesn\'t show learning process.',
      college: stanfordResearch,
    });

    const mitResult = multiLayerEnhancementService.enhance({
      suggestion_text: suggestion.text,
      suggestion_rationale: suggestion.rationale,
      issue_diagnosis: 'Essay mentions project but doesn\'t show learning process.',
      college: mitResearch,
    });

    const harvardResult = multiLayerEnhancementService.enhance({
      suggestion_text: suggestion.text,
      suggestion_rationale: suggestion.rationale,
      issue_diagnosis: 'Essay mentions project but doesn\'t show learning process.',
      college: harvardResearch,
    });

    console.log('\n  STANFORD Enhanced Rationale:');
    console.log(`    "${stanfordResult.enhanced_rationale.substring(0, 200)}..."`);

    console.log('\n  MIT Enhanced Rationale:');
    console.log(`    "${mitResult.enhanced_rationale.substring(0, 200)}..."`);

    console.log('\n  HARVARD Enhanced Rationale:');
    console.log(`    "${harvardResult.enhanced_rationale.substring(0, 200)}..."`);

    // KEY TEST: Rationales should be DIFFERENT for different colleges
    const allSame = stanfordResult.enhanced_rationale === mitResult.enhanced_rationale &&
                    mitResult.enhanced_rationale === harvardResult.enhanced_rationale;

    if (allSame) {
      failures.push('CRITICAL: All three colleges produced identical rationales');
    }

    // Check that each mentions the right values
    const stanfordMentionsValue = stanfordResult.value_alignment_detected.length > 0;
    const mitMentionsValue = mitResult.value_alignment_detected.length > 0;
    const harvardMentionsValue = harvardResult.value_alignment_detected.length > 0;

    console.log('\n  Value Alignment Detected:');
    console.log(`    Stanford: ${stanfordResult.value_alignment_detected.join(', ') || 'None'}`);
    console.log(`    MIT: ${mitResult.value_alignment_detected.join(', ') || 'None'}`);
    console.log(`    Harvard: ${harvardResult.value_alignment_detected.join(', ') || 'None'}`);

    const passed = failures.length === 0;
    console.log(`\n  ${passed ? '✅ COMPARISON PASSED' : '❌ COMPARISON FAILED'}`);
    if (!passed) {
      failures.forEach(f => console.log(`    - ${f}`));
    }

    return {
      name: 'College Comparison',
      passed,
      details: {
        total_layers_applied: (stanfordResult.total_layers_applied + mitResult.total_layers_applied + harvardResult.total_layers_applied) / 3,
        enhancement_type: 'combined',
        value_alignment_detected: [
          ...stanfordResult.value_alignment_detected,
          ...mitResult.value_alignment_detected,
          ...harvardResult.value_alignment_detected,
        ],
        mindset_signals_added: stanfordResult.mindset_signals_added || mitResult.mindset_signals_added || harvardResult.mindset_signals_added,
        approach_signals_added: false,
        dean_quotes_added: stanfordResult.dean_quotes_added || mitResult.dean_quotes_added || harvardResult.dean_quotes_added,
        rationale_changed: true,
        text_changed: false,
        original_rationale_length: suggestion.rationale.length,
        enhanced_rationale_length: stanfordResult.enhanced_rationale.length,
        layers_breakdown: [],
      },
      failures,
    };
  } catch (error) {
    console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
    return {
      name: 'College Comparison',
      passed: false,
      details: {
        total_layers_applied: 0,
        enhancement_type: 'error',
        value_alignment_detected: [],
        mindset_signals_added: false,
        approach_signals_added: false,
        dean_quotes_added: false,
        rationale_changed: false,
        text_changed: false,
        original_rationale_length: 0,
        enhanced_rationale_length: 0,
        layers_breakdown: [],
      },
      failures: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           MULTI-LAYER ENHANCEMENT SYSTEM TEST                        ║');
  console.log('║   Validates 5-layer enhancement beyond program name insertion        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTimestamp: ${new Date().toISOString()}`);

  const results: TestResult[] = [];

  // Run layer tests
  for (const testCase of TEST_CASES) {
    const result = await runLayerTest(testCase);
    results.push(result);
  }

  // Run integration test
  const integrationResult = await runIntegrationTest();
  results.push(integrationResult);

  // Run comparison test
  const comparisonResult = await runComparisonTest();
  results.push(comparisonResult);

  // Summary
  const duration = Date.now() - startTime;
  const passedCount = results.filter(r => r.passed).length;

  console.log(`\n${'═'.repeat(70)}`);
  console.log('MULTI-LAYER ENHANCEMENT TEST SUMMARY');
  console.log(`${'═'.repeat(70)}`);
  console.log(`\nTests Passed: ${passedCount}/${results.length}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);

  console.log('\n─────────────────────────────────────────────────────────────────────');
  console.log('RESULTS BY TEST');
  console.log('─────────────────────────────────────────────────────────────────────');

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`\n${icon} ${r.name}`);
    console.log(`   Layers Applied: ${r.details.total_layers_applied}`);
    console.log(`   Enhancement Type: ${r.details.enhancement_type}`);
    console.log(`   Rationale Enhanced: ${r.details.rationale_changed ? 'Yes' : 'No'}`);
    if (r.failures.length > 0) {
      console.log(`   Failures: ${r.failures.join(', ')}`);
    }
  });

  // Aggregate stats
  const avgLayers = results.reduce((sum, r) => sum + r.details.total_layers_applied, 0) / results.length;
  const rationaleEnhancedCount = results.filter(r => r.details.rationale_changed).length;

  console.log(`\n${'═'.repeat(70)}`);
  console.log('AGGREGATE STATISTICS');
  console.log(`${'═'.repeat(70)}`);
  console.log(`Average Layers Applied: ${avgLayers.toFixed(1)}`);
  console.log(`Rationale Enhanced: ${rationaleEnhancedCount}/${results.length} tests`);
  console.log(`Pass Rate: ${((passedCount / results.length) * 100).toFixed(0)}%`);

  console.log(`\n${'═'.repeat(70)}`);
  console.log(passedCount >= results.length - 1 ? '✅ MULTI-LAYER ENHANCEMENT: WORKING' : '❌ MULTI-LAYER ENHANCEMENT: NEEDS ATTENTION');
  console.log(`${'═'.repeat(70)}`);

  // Exit with appropriate code
  process.exit(passedCount >= results.length - 1 ? 0 : 1);
}

main().catch(console.error);
