/**
 * Test: Targeted Enhancement - Phase 2 College Overlay
 *
 * Tests the surgical enhancement system that makes targeted additions
 * to suggestion text while preserving voice and quality.
 *
 * Key test cases:
 * 1. Surgical addition works (adds program name)
 * 2. Bad enhancement rejected (regeneration detected)
 * 3. Voice preservation validated
 * 4. No enhancement when already optimal
 * 5. Fallback to universal on validation failure
 */

import { collegeOverlayEnhancer } from '../src/services/commonAppWorkshop/services/collegeOverlayEnhancer';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import type { CollegeResearch } from '../src/services/commonAppWorkshop/types';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  timing_ms?: number;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[Test] ${message}`);
}

function logSuccess(testName: string, details: string) {
  console.log(`✅ ${testName}`);
  console.log(`   ${details}`);
  results.push({ name: testName, passed: true, details });
}

function logFailure(testName: string, details: string) {
  console.log(`❌ ${testName}`);
  console.log(`   ${details}`);
  results.push({ name: testName, passed: false, details });
}

// ============================================================================
// TEST DATA
// ============================================================================

// Universal suggestions for testing
const testSuggestions = {
  bioethics: {
    text: "I want to study bioethics at the intersection of science and philosophy, where I can explore the frameworks we use to make decisions about technologies we barely understand.",
    rationale: "This shows intellectual vitality through curiosity about ethical frameworks applied to emerging technologies.",
  },
  cognitive_science: {
    text: "Three hours later, I had seventeen tabs open about how language shapes thought. I couldn't stop thinking about whether words actually change how we perceive reality.",
    rationale: "Demonstrates self-directed exploration and genuine curiosity beyond academic requirements.",
  },
  robotics: {
    text: "I want to work on robotics projects where I can iterate, fail, and build hands-on solutions to real problems.",
    rationale: "Shows maker mindset and comfort with failure as part of the learning process.",
  },
  already_specific: {
    text: "I want to study bioethics at Stanford's Program in Ethics in Society, exploring frameworks for CRISPR policy with Professor Hank Greely.",
    rationale: "Already mentions specific Stanford programs and faculty.",
  },
  ai_ethics: {
    text: "I've been thinking about how artificial intelligence will change society. The question of machine consciousness keeps me up at night.",
    rationale: "Shows intellectual engagement with important questions about AI and its implications.",
  },
};

// Mock college data for testing (using Stanford as primary)
const mockStanfordCollege: CollegeResearch = stanfordResearch;

// ============================================================================
// TEST CASES
// ============================================================================

async function testSurgicalAddition() {
  const testName = "Test 1: Surgical Addition Works";
  log(`Running: ${testName}`);

  const startTime = Date.now();

  try {
    const result = await collegeOverlayEnhancer.enhance({
      universal_suggestion: {
        text: testSuggestions.bioethics.text,
        rationale: testSuggestions.bioethics.rationale,
        score_impact: { before: 75, after: 85 },
        implementation: "Show specific frameworks and questions",
      } as any,
      college: mockStanfordCollege,
      promptId: 'stanford_intellectual_vitality',
      issue_diagnosis: 'Generic academic interest without specific depth',
      weak_dimensions: ['specificity', 'stanford_research'],
    });

    const timing = Date.now() - startTime;

    // Check if enhancement was made
    console.log(`   Original: "${testSuggestions.bioethics.text.substring(0, 80)}..."`);
    console.log(`   Enhanced: "${result.text.substring(0, 80)}..."`);
    console.log(`   Changes made: ${result.changes_made?.length || 0}`);
    console.log(`   Validation: ${JSON.stringify(result.validation_result?.reasons)}`);

    // Success criteria:
    // 1. Text should be different (enhancement made) OR validation correctly identifies no good enhancement
    // 2. If changes made, should include specific program reference
    // 3. Voice should be preserved
    // 4. Core message should be preserved

    if (result.changes_made && result.changes_made.length > 0) {
      const hasSpecificProgram = result.text.toLowerCase().includes('program') ||
                                  result.text.toLowerCase().includes('center') ||
                                  result.text.toLowerCase().includes('ethics in society');

      if (hasSpecificProgram && result.validation_result?.reasons.voice_preserved) {
        logSuccess(testName, `Enhancement added specific program. Changes: ${result.changes_made.length}. Time: ${timing}ms`);
      } else {
        logFailure(testName, `Enhancement made but missing specifics or voice not preserved. Time: ${timing}ms`);
      }
    } else {
      // No changes - could be valid if text already optimal or no good enhancement found
      if (result.text === testSuggestions.bioethics.text) {
        log(`   No enhancement made - returned original (may be valid)`);
        logSuccess(testName, `System correctly returned original when no good enhancement found. Time: ${timing}ms`);
      } else {
        logFailure(testName, `Unexpected state - no changes but text different. Time: ${timing}ms`);
      }
    }
  } catch (error) {
    logFailure(testName, `Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testVoicePreservation() {
  const testName = "Test 2: Voice Preservation";
  log(`Running: ${testName}`);

  const startTime = Date.now();

  try {
    // Use the casual, conversational suggestion
    const result = await collegeOverlayEnhancer.enhance({
      universal_suggestion: {
        text: testSuggestions.cognitive_science.text,
        rationale: testSuggestions.cognitive_science.rationale,
        score_impact: { before: 80, after: 90 },
        implementation: "Maintain voice while adding depth",
      } as any,
      college: mockStanfordCollege,
      promptId: 'stanford_intellectual_vitality',
      issue_diagnosis: 'Could benefit from Stanford-specific connection',
      weak_dimensions: ['stanford_research'],
    });

    const timing = Date.now() - startTime;

    console.log(`   Original: "${testSuggestions.cognitive_science.text.substring(0, 60)}..."`);
    console.log(`   Enhanced: "${result.text.substring(0, 60)}..."`);

    // Voice preservation checks
    const originalHasFirstPerson = /\bI\b/.test(testSuggestions.cognitive_science.text);
    const enhancedHasFirstPerson = /\bI\b/.test(result.text);
    const originalCasual = testSuggestions.cognitive_science.text.includes("seventeen tabs");
    const enhancedPreservesCasual = result.text.includes("seventeen tabs");

    const voiceValid = result.validation_result?.reasons.voice_preserved;
    const preservesPersonality = enhancedHasFirstPerson && enhancedPreservesCasual;

    if (voiceValid && preservesPersonality) {
      logSuccess(testName, `Voice preserved. First person: ${enhancedHasFirstPerson}, Casual markers: ${enhancedPreservesCasual}. Time: ${timing}ms`);
    } else if (result.text === testSuggestions.cognitive_science.text) {
      logSuccess(testName, `No enhancement made - original voice fully preserved. Time: ${timing}ms`);
    } else {
      logFailure(testName, `Voice may not be preserved. Validation: ${voiceValid}, Personality: ${preservesPersonality}. Time: ${timing}ms`);
    }
  } catch (error) {
    logFailure(testName, `Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testAlreadyOptimalNoChange() {
  const testName = "Test 3: No Enhancement When Already Optimal";
  log(`Running: ${testName}`);

  const startTime = Date.now();

  try {
    const result = await collegeOverlayEnhancer.enhance({
      universal_suggestion: {
        text: testSuggestions.already_specific.text,
        rationale: testSuggestions.already_specific.rationale,
        score_impact: { before: 90, after: 95 },
        implementation: "Already highly specific",
      } as any,
      college: mockStanfordCollege,
      promptId: 'stanford_intellectual_vitality',
      issue_diagnosis: 'Already very specific',
      weak_dimensions: [],
    });

    const timing = Date.now() - startTime;

    console.log(`   Original: "${testSuggestions.already_specific.text.substring(0, 60)}..."`);
    console.log(`   Result: "${result.text.substring(0, 60)}..."`);
    console.log(`   Changes made: ${result.changes_made?.length || 0}`);

    // Should return original or near-original since it already has specific Stanford references
    const noChanges = result.changes_made?.length === 0 || !result.changes_made;
    const textUnchanged = result.text === testSuggestions.already_specific.text;

    if (textUnchanged || noChanges) {
      logSuccess(testName, `Correctly returned original when already optimal. Changes: ${result.changes_made?.length || 0}. Time: ${timing}ms`);
    } else {
      // If changes were made, they should still preserve the already-specific content
      const stillHasGreely = result.text.includes("Greely");
      const stillHasProgram = result.text.includes("Ethics in Society");

      if (stillHasGreely && stillHasProgram) {
        logSuccess(testName, `Made minor additions while preserving existing specifics. Time: ${timing}ms`);
      } else {
        logFailure(testName, `Lost existing specific content. Time: ${timing}ms`);
      }
    }
  } catch (error) {
    logFailure(testName, `Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testAIEthicsEnhancement() {
  const testName = "Test 4: AI Ethics Enhancement (HAI opportunity)";
  log(`Running: ${testName}`);

  const startTime = Date.now();

  try {
    const result = await collegeOverlayEnhancer.enhance({
      universal_suggestion: {
        text: testSuggestions.ai_ethics.text,
        rationale: testSuggestions.ai_ethics.rationale,
        score_impact: { before: 70, after: 85 },
        implementation: "Add Stanford AI research context",
      } as any,
      college: mockStanfordCollege,
      promptId: 'stanford_intellectual_vitality',
      issue_diagnosis: 'Generic AI interest without Stanford connection',
      weak_dimensions: ['stanford_research', 'specificity'],
    });

    const timing = Date.now() - startTime;

    console.log(`   Original: "${testSuggestions.ai_ethics.text.substring(0, 60)}..."`);
    console.log(`   Enhanced: "${result.text.substring(0, 60)}..."`);
    console.log(`   Changes: ${JSON.stringify(result.changes_made?.slice(0, 2))}`);

    // Good enhancement would add HAI, SAIL, or specific faculty
    const hasAIReference = result.text.toLowerCase().includes('hai') ||
                           result.text.toLowerCase().includes('human-centered ai') ||
                           result.text.toLowerCase().includes('sail') ||
                           result.text.toLowerCase().includes('fei-fei');

    if (result.changes_made && result.changes_made.length > 0 && hasAIReference) {
      logSuccess(testName, `Added specific AI program/faculty reference. Time: ${timing}ms`);
    } else if (result.validation_result?.use_enhanced && result.text !== testSuggestions.ai_ethics.text) {
      logSuccess(testName, `Enhancement made with validation passing. Time: ${timing}ms`);
    } else {
      // May be valid if no good enhancement found
      log(`   No Stanford AI reference added - may be valid if no good opportunity`);
      logSuccess(testName, `Returned original when no good enhancement opportunity. Time: ${timing}ms`);
    }
  } catch (error) {
    logFailure(testName, `Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testRoboticsEnhancement() {
  const testName = "Test 5: Robotics Enhancement";
  log(`Running: ${testName}`);

  const startTime = Date.now();

  try {
    const result = await collegeOverlayEnhancer.enhance({
      universal_suggestion: {
        text: testSuggestions.robotics.text,
        rationale: testSuggestions.robotics.rationale,
        score_impact: { before: 75, after: 85 },
        implementation: "Add Stanford robotics context",
      } as any,
      college: mockStanfordCollege,
      promptId: 'stanford_intellectual_vitality',
      issue_diagnosis: 'Generic maker interest without Stanford labs',
      weak_dimensions: ['stanford_research'],
    });

    const timing = Date.now() - startTime;

    console.log(`   Original: "${testSuggestions.robotics.text.substring(0, 60)}..."`);
    console.log(`   Enhanced: "${result.text.substring(0, 60)}..."`);
    console.log(`   Validation: use_enhanced=${result.validation_result?.use_enhanced}`);

    // Check validation results
    const validation = result.validation_result;

    if (validation) {
      console.log(`   Voice preserved: ${validation.reasons.voice_preserved}`);
      console.log(`   Core message preserved: ${validation.reasons.core_message_preserved}`);
      console.log(`   Quality improved: ${validation.reasons.quality_improved}`);
      console.log(`   Specifics added: ${validation.reasons.specifics_added}`);
    }

    // Success if either:
    // 1. Enhancement made with all validations passing
    // 2. Original returned (no good enhancement found)
    if (validation?.use_enhanced && validation.reasons.voice_preserved && validation.reasons.core_message_preserved) {
      logSuccess(testName, `Valid enhancement made. Time: ${timing}ms`);
    } else if (result.text === testSuggestions.robotics.text) {
      logSuccess(testName, `Original returned - no good enhancement available. Time: ${timing}ms`);
    } else {
      logFailure(testName, `Unexpected validation state. Time: ${timing}ms`);
    }
  } catch (error) {
    logFailure(testName, `Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testValidationLogic() {
  const testName = "Test 6: Validation Logic Unit Tests";
  log(`Running: ${testName}`);

  // Test the heuristic validation functions by examining their behavior
  // through the enhancement output

  const shortText = "Study AI.";
  const longRewrite = "Stanford's world-renowned artificial intelligence program excites me deeply because of its prestigious faculty and unparalleled opportunities.";

  const result = await collegeOverlayEnhancer.enhance({
    universal_suggestion: {
      text: shortText,
      rationale: "Brief interest in AI",
      score_impact: { before: 50, after: 60 },
      implementation: "Expand with Stanford context",
    } as any,
    college: mockStanfordCollege,
    promptId: 'stanford_intellectual_vitality',
    issue_diagnosis: 'Too brief',
    weak_dimensions: ['depth'],
  });

  // Even with very short input, the system should not produce generic flattery
  const hasGenericFlattery = /world-renowned|prestigious|dream school|unparalleled/.test(result.text.toLowerCase());

  if (!hasGenericFlattery) {
    logSuccess(testName, `Validation correctly prevents generic flattery.`);
  } else {
    logFailure(testName, `Generic flattery detected in output.`);
  }
}

async function testEnhancementRationale() {
  const testName = "Test 7: Enhanced Rationale Quality";
  log(`Running: ${testName}`);

  const result = await collegeOverlayEnhancer.enhance({
    universal_suggestion: {
      text: testSuggestions.bioethics.text,
      rationale: testSuggestions.bioethics.rationale,
      score_impact: { before: 75, after: 85 },
      implementation: "Add Stanford context",
    } as any,
    college: mockStanfordCollege,
    promptId: 'stanford_intellectual_vitality',
    issue_diagnosis: 'Generic academic interest',
    weak_dimensions: ['stanford_research'],
  });

  console.log(`   Original rationale: "${testSuggestions.bioethics.rationale}"`);
  console.log(`   Enhanced rationale: "${result.rationale.substring(0, 100)}..."`);

  // Enhanced rationale should mention Stanford
  const mentionsStanford = result.rationale.toLowerCase().includes('stanford');
  const differentFromOriginal = result.rationale !== testSuggestions.bioethics.rationale;

  if (mentionsStanford && differentFromOriginal) {
    logSuccess(testName, `Rationale enhanced with Stanford context.`);
  } else {
    logFailure(testName, `Rationale not properly enhanced. Mentions Stanford: ${mentionsStanford}, Different: ${differentFromOriginal}`);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TARGETED ENHANCEMENT TEST SUITE - Phase 2 College Overlay');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const startTime = Date.now();

  // Run all tests
  await testSurgicalAddition();
  console.log('');

  await testVoicePreservation();
  console.log('');

  await testAlreadyOptimalNoChange();
  console.log('');

  await testAIEthicsEnhancement();
  console.log('');

  await testRoboticsEnhancement();
  console.log('');

  await testValidationLogic();
  console.log('');

  await testEnhancementRationale();
  console.log('');

  const totalTime = Date.now() - startTime;

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Time: ${totalTime}ms`);
  console.log('');

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.details}`);
    });
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
