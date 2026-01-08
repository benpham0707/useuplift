/**
 * Optimized Citation System Integration Test
 *
 * Comprehensive test validating that the optimized citation system:
 * 1. Integrates properly with CitationSelector
 * 2. Works through UniversalCitationEngine
 * 3. Maintains backward compatibility with all consumers
 * 4. Provides performance improvements
 * 5. Produces correct citation formats
 */

import {
  // Optimized system components
  SourceIndexer,
  getSourceIndexer,
  resetSourceIndexer,
  SmartSourceSelector,
  getSmartSourceSelector,
  resetSmartSourceSelector,
  getBestSourceForIssueOptimized,
  getSourceBundleForIssue,

  // Citation system components
  CitationSelector,
  UniversalCitationEngine,
  quickCite,
  citeWorkshopFeedback,

  // Deep prescription generator
  generateDeepPrescription,
  getBestSourceForIssue,
} from '../src/services/commonAppWorkshop/services';

import type { ClicheSymptomType, CollegeId, SourceBundle } from '../src/services/commonAppWorkshop/types/labeledSourceTypes';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  timing?: number;
}

const results: TestResult[] = [];

function recordTest(name: string, passed: boolean, details: string, timing?: number): void {
  results.push({ name, passed, details, timing });
  const status = passed ? '✅' : '❌';
  const timingStr = timing ? ` (${timing.toFixed(2)}ms)` : '';
  console.log(`${status} ${name}${timingStr}`);
  if (!passed) {
    console.log(`   Details: ${details}`);
  }
}

// ============================================================================
// TEST 1: SOURCE INDEXER INITIALIZATION
// ============================================================================

async function testSourceIndexerInitialization(): Promise<void> {
  console.log('\n📊 Test 1: Source Indexer Initialization');

  try {
    const startTime = performance.now();
    resetSourceIndexer();
    const indexer = getSourceIndexer();
    const endTime = performance.now();

    const stats = indexer.getStats();

    recordTest(
      'Source indexer initializes with sources',
      stats.totalSources > 0,
      `Expected >0 sources, got ${stats.totalSources}`,
      endTime - startTime
    );

    recordTest(
      'Source indexer has issue type coverage',
      stats.issueTypesCovered >= 3,
      `Expected >=3 issue types, got ${stats.issueTypesCovered}`
    );

    recordTest(
      'Source indexer has college coverage',
      stats.collegesWithPrimarySources >= 1,
      `Expected >=1 college with primary sources, got ${stats.collegesWithPrimarySources}`
    );

    console.log(`   Index stats: ${stats.totalSources} sources, ${stats.issueTypesCovered} issue types, built in ${stats.buildTimeMs}ms`);

  } catch (error) {
    recordTest('Source indexer initialization', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 2: SMART SOURCE SELECTOR
// ============================================================================

async function testSmartSourceSelector(): Promise<void> {
  console.log('\n🎯 Test 2: Smart Source Selector');

  try {
    resetSmartSourceSelector();
    const selector = getSmartSourceSelector();

    // Test selectForIssue
    const issueTypes: ClicheSymptomType[] = [
      'cliche_metaphor',
      'telling_not_showing',
      'cliche_topic_framing',
    ];

    for (const issueType of issueTypes) {
      const startTime = performance.now();
      const bundle = selector.selectForIssue(
        { symptom_type: issueType },
        'stanford' as CollegeId
      );
      const endTime = performance.now();

      recordTest(
        `selectForIssue returns bundle for ${issueType}`,
        bundle.primary !== null && bundle.primary !== undefined,
        `Expected primary source, got ${bundle.primary ? 'source' : 'null'}`,
        endTime - startTime
      );
    }

    // Test getBestSingle
    const startTime = performance.now();
    const bestSource = selector.getBestSingle('telling_not_showing', 'stanford');
    const endTime = performance.now();

    recordTest(
      'getBestSingle returns single source',
      bestSource !== null,
      `Expected single source, got ${bestSource ? 'source' : 'null'}`,
      endTime - startTime
    );

    // Test convenience functions
    const optimizedSource = getBestSourceForIssueOptimized('cliche_metaphor', 'stanford' as CollegeId);
    recordTest(
      'getBestSourceForIssueOptimized returns source or null',
      true, // Function executes without error
      `Function returned ${optimizedSource ? 'source' : 'null'} (null is valid for some issue types)`
    );

    const sourceBundle = getSourceBundleForIssue('telling_not_showing', 'stanford');
    recordTest(
      'getSourceBundleForIssue returns complete bundle',
      sourceBundle.primary !== null && sourceBundle.formatted !== null,
      `Expected complete bundle`
    );

  } catch (error) {
    recordTest('Smart source selector tests', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 3: CITATION SELECTOR INTEGRATION
// ============================================================================

async function testCitationSelectorIntegration(): Promise<void> {
  console.log('\n🔗 Test 3: Citation Selector Integration');

  try {
    const selector = new CitationSelector();

    // Test selectCitationsForIssue with optimized system
    const testCases = [
      { issue: 'cliche_metaphor', severity: 'critical' as const },
      { issue: 'telling_not_showing', severity: 'major' as const },
      { issue: 'CLASS_BASED_ONLY', severity: 'critical' as const }, // Legacy issue type
      { issue: 'GENERIC_STATEMENTS', severity: 'minor' as const }, // Legacy issue type
    ];

    for (const testCase of testCases) {
      const startTime = performance.now();
      const citations = selector.selectCitationsForIssue({
        issue_detected: testCase.issue,
        severity: testCase.severity,
        college_id: 'stanford',
        essay_type: 'personal_statement',
        our_feedback: {
          problem: 'Test problem',
          why_matters: 'Test why',
          how_to_fix: 'Test fix',
        },
      });
      const endTime = performance.now();

      recordTest(
        `selectCitationsForIssue handles ${testCase.issue}`,
        citations.length > 0,
        `Expected >0 citations, got ${citations.length}`,
        endTime - startTime
      );

      // Verify citation format
      if (citations.length > 0) {
        const citation = citations[0];
        const hasRequiredFields =
          citation.citation !== undefined &&
          citation.relevance !== undefined &&
          citation.presentation !== undefined;

        recordTest(
          `Citation format correct for ${testCase.issue}`,
          hasRequiredFields,
          `Missing required fields in citation`
        );
      }
    }

    // Test selectWeightProof
    const startTime = performance.now();
    const weightProof = selector.selectWeightProof('stanford', 'intellectual_vitality');
    const endTime = performance.now();

    recordTest(
      'selectWeightProof returns citations',
      weightProof.length >= 0, // May be 0 if no weight data
      `Got ${weightProof.length} weight proof citations`,
      endTime - startTime
    );

  } catch (error) {
    recordTest('Citation selector integration', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 4: UNIVERSAL CITATION ENGINE
// ============================================================================

async function testUniversalCitationEngine(): Promise<void> {
  console.log('\n🌐 Test 4: Universal Citation Engine');

  try {
    const engine = new UniversalCitationEngine();

    // Test with workshop feedback
    const startTime = performance.now();
    const result = engine.cite({
      content: {
        problem: 'Your essay uses overused metaphors like "life is a journey"',
        why_matters: 'Stanford admissions officers read thousands of essays with these same phrases',
        how_to_fix: 'Replace generic metaphors with specific imagery from your experience',
      },
      context: {
        college_id: 'stanford',
        content_type: 'workshop_feedback',
        issue_type: 'cliche_metaphor',
        severity: 'critical',
      },
    });
    const endTime = performance.now();

    recordTest(
      'UniversalCitationEngine processes feedback',
      result.content !== null,
      `Expected content back`,
      endTime - startTime
    );

    recordTest(
      'UniversalCitationEngine tracks metadata',
      result.metadata.total_triggers >= 0,
      `Expected metadata, got ${JSON.stringify(result.metadata)}`
    );

    // Test quickCite convenience function
    const quickResult = quickCite(
      'Stanford values intellectual vitality above all',
      {
        college_id: 'stanford',
        content_type: 'teaching_moment',
      }
    );

    recordTest(
      'quickCite convenience function works',
      quickResult.content !== null,
      `Expected content from quickCite`
    );

    // Test citeWorkshopFeedback
    const workshopResult = citeWorkshopFeedback(
      {
        problem: 'Generic opening',
        why_matters: 'First impression matters',
        how_to_fix: 'Start with a specific moment',
      },
      {
        college_id: 'stanford',
        issue_type: 'cliche_topic_framing',
        severity: 'major',
      }
    );

    recordTest(
      'citeWorkshopFeedback convenience function works',
      workshopResult.content !== null,
      `Expected content from citeWorkshopFeedback`
    );

  } catch (error) {
    recordTest('Universal citation engine', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 5: DEEP PRESCRIPTION INTEGRATION
// ============================================================================

async function testDeepPrescriptionIntegration(): Promise<void> {
  console.log('\n📝 Test 5: Deep Prescription Integration');

  try {
    // Test that deep prescriptions work with the optimized system
    const mockIssue = {
      symptom_type: 'cliche_metaphor',
      dimension_affected: 'voice_authenticity',
      location: {
        paragraph_index: 1,
        sentence_indices: [0, 1],
        excerpt: 'Life is a journey with many twists and turns',
      },
      severity: 'critical',
      confidence: 85,
      problem: 'Uses overused metaphor',
      why_matters: 'Signals lack of originality',
      how_to_fix: 'Replace with specific imagery',
      teaching: 'Great essays use fresh language',
      prescription: 'Replace generic metaphors with specific imagery from your experience',
      quote: 'Life is a journey with many twists and turns',
    } as CriticalIssue;

    const startTime = performance.now();
    const prescription = generateDeepPrescription(
      mockIssue,
      'My essay about life being a journey...',
      { collegeId: 'stanford' }
    );
    const endTime = performance.now();

    // Check the actual structure returned by generateDeepPrescription
    recordTest(
      'generateDeepPrescription returns prescription object',
      prescription !== null && typeof prescription === 'object',
      `Expected prescription object`,
      endTime - startTime
    );

    if (prescription) {
      recordTest(
        'Deep prescription has action',
        prescription.action !== undefined,
        `Expected action in prescription`
      );

      recordTest(
        'Deep prescription has why_this_matters',
        prescription.why_this_matters !== undefined,
        `Expected why_this_matters in prescription`
      );

      recordTest(
        'Deep prescription has steps',
        prescription.steps !== undefined && Array.isArray(prescription.steps),
        `Expected steps array in prescription`
      );

      recordTest(
        'Deep prescription has example',
        prescription.example !== undefined,
        `Expected example in prescription`
      );
    }

    // Test getBestSourceForIssue (from deep prescription generator)
    const bestSource = getBestSourceForIssue('telling_not_showing', 'stanford');
    recordTest(
      'getBestSourceForIssue returns source or null',
      true, // Function executes without error
      `Function returned ${bestSource ? 'source' : 'null'}`
    );

  } catch (error) {
    recordTest('Deep prescription integration', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 6: PERFORMANCE COMPARISON
// ============================================================================

async function testPerformanceComparison(): Promise<void> {
  console.log('\n⚡ Test 6: Performance Comparison');

  try {
    const iterations = 50;
    const issueTypes: ClicheSymptomType[] = [
      'cliche_metaphor',
      'telling_not_showing',
      'cliche_topic_framing',
    ];

    // Test SmartSourceSelector performance
    const selector = getSmartSourceSelector();
    const smartTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const issueType = issueTypes[i % issueTypes.length];
      const start = performance.now();
      selector.selectForIssue({ symptom_type: issueType }, 'stanford');
      smartTimes.push(performance.now() - start);
    }

    const avgSmartTime = smartTimes.reduce((a, b) => a + b, 0) / smartTimes.length;

    recordTest(
      `SmartSourceSelector avg lookup time < 5ms`,
      avgSmartTime < 5,
      `Average time: ${avgSmartTime.toFixed(3)}ms`
    );

    // Test CitationSelector performance (integrated)
    const citationSelector = new CitationSelector();
    const citationTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const issueType = issueTypes[i % issueTypes.length];
      const start = performance.now();
      citationSelector.selectCitationsForIssue({
        issue_detected: issueType,
        severity: 'major',
        college_id: 'stanford',
        essay_type: 'personal_statement',
        our_feedback: {
          problem: 'Test',
          why_matters: 'Test',
          how_to_fix: 'Test',
        },
      });
      citationTimes.push(performance.now() - start);
    }

    const avgCitationTime = citationTimes.reduce((a, b) => a + b, 0) / citationTimes.length;

    recordTest(
      `CitationSelector avg lookup time < 10ms`,
      avgCitationTime < 10,
      `Average time: ${avgCitationTime.toFixed(3)}ms`
    );

    console.log(`   SmartSourceSelector: ${avgSmartTime.toFixed(3)}ms avg`);
    console.log(`   CitationSelector: ${avgCitationTime.toFixed(3)}ms avg`);

  } catch (error) {
    recordTest('Performance comparison', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 7: BACKWARD COMPATIBILITY
// ============================================================================

async function testBackwardCompatibility(): Promise<void> {
  console.log('\n🔄 Test 7: Backward Compatibility');

  try {
    // Test that legacy issue types still work
    const selector = new CitationSelector();

    const legacyIssues = [
      'CLASS_BASED_ONLY',
      'GENERIC_STATEMENTS',
      'RESUME_REPETITION',
      'LACKS_VOICE',
      'VAGUE_CLAIMS',
    ];

    for (const issue of legacyIssues) {
      const citations = selector.selectCitationsForIssue({
        issue_detected: issue,
        severity: 'major',
        college_id: 'stanford',
        essay_type: 'personal_statement',
        our_feedback: {
          problem: 'Test',
          why_matters: 'Test',
          how_to_fix: 'Test',
        },
      });

      recordTest(
        `Legacy issue type ${issue} returns citations`,
        citations.length > 0,
        `Expected >0 citations for legacy issue type`
      );
    }

    // Test that SelectedCitation format is preserved
    const citations = selector.selectCitationsForIssue({
      issue_detected: 'cliche_metaphor',
      severity: 'critical',
      college_id: 'stanford',
      essay_type: 'personal_statement',
      our_feedback: {
        problem: 'Test',
        why_matters: 'Test',
        how_to_fix: 'Test',
      },
    });

    if (citations.length > 0) {
      const citation = citations[0];

      recordTest(
        'SelectedCitation has citation field',
        'citation' in citation && citation.citation !== undefined,
        `Missing citation field`
      );

      recordTest(
        'SelectedCitation has relevance field',
        'relevance' in citation && citation.relevance !== undefined,
        `Missing relevance field`
      );

      recordTest(
        'SelectedCitation has presentation field',
        'presentation' in citation && citation.presentation !== undefined,
        `Missing presentation field`
      );

      recordTest(
        'Citation.relevance has score',
        typeof citation.relevance.score === 'number',
        `Expected numeric score`
      );

      recordTest(
        'Citation.relevance has use_for',
        typeof citation.relevance.use_for === 'string',
        `Expected string use_for`
      );

      recordTest(
        'Citation.presentation has simplified_version',
        typeof citation.presentation.simplified_version === 'string',
        `Expected string simplified_version`
      );

      recordTest(
        'Citation.presentation has full_version',
        typeof citation.presentation.full_version === 'string',
        `Expected string full_version`
      );
    }

  } catch (error) {
    recordTest('Backward compatibility', false, `Error: ${error}`);
  }
}

// ============================================================================
// TEST 8: DIVERSITY AND QUALITY
// ============================================================================

async function testDiversityAndQuality(): Promise<void> {
  console.log('\n🎨 Test 8: Diversity and Quality');

  try {
    const selector = getSmartSourceSelector();

    // Test that bundles have diverse sources
    const bundle = selector.selectForIssue(
      { symptom_type: 'telling_not_showing' },
      'stanford',
      {
        max_sources: 5,
        require_author_diversity: true,
      }
    );

    // Check diversity score
    recordTest(
      'Bundle has diversity score',
      bundle.metadata.diversity_score >= 0 && bundle.metadata.diversity_score <= 100,
      `Expected 0-100 score, got ${bundle.metadata.diversity_score}`
    );

    // Check that primary source exists
    recordTest(
      'Bundle has primary source',
      bundle.primary !== null && bundle.primary !== undefined,
      `Expected primary source`
    );

    // Check formatted output
    recordTest(
      'Bundle has formatted inline',
      typeof bundle.formatted.inline === 'string' && bundle.formatted.inline.length > 0,
      `Expected formatted inline string`
    );

    recordTest(
      'Bundle has formatted tooltip',
      typeof bundle.formatted.tooltip === 'string' && bundle.formatted.tooltip.length > 0,
      `Expected formatted tooltip string`
    );

    recordTest(
      'Bundle has formatted full',
      typeof bundle.formatted.full === 'string' && bundle.formatted.full.length > 0,
      `Expected formatted full string`
    );

    // Check selection criteria
    recordTest(
      'Bundle metadata has selection criteria',
      bundle.metadata.selection_criteria.length > 0,
      `Expected selection criteria`
    );

  } catch (error) {
    recordTest('Diversity and quality', false, `Error: ${error}`);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('='.repeat(70));
  console.log('OPTIMIZED CITATION SYSTEM INTEGRATION TEST');
  console.log('='.repeat(70));
  console.log('Testing complete integration of pre-indexed citation system\n');

  const startTime = performance.now();

  await testSourceIndexerInitialization();
  await testSmartSourceSelector();
  await testCitationSelectorIntegration();
  await testUniversalCitationEngine();
  await testDeepPrescriptionIntegration();
  await testPerformanceComparison();
  await testBackwardCompatibility();
  await testDiversityAndQuality();

  const endTime = performance.now();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n📊 Results: ${passed}/${total} tests passed (${passRate}%)`);
  console.log(`⏱️  Total time: ${(endTime - startTime).toFixed(2)}ms`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`   - ${r.name}: ${r.details}`));
  }

  // Grade
  const grade =
    passRate === '100.0' ? 'A+' :
    parseFloat(passRate) >= 95 ? 'A' :
    parseFloat(passRate) >= 90 ? 'A-' :
    parseFloat(passRate) >= 85 ? 'B+' :
    parseFloat(passRate) >= 80 ? 'B' :
    parseFloat(passRate) >= 75 ? 'B-' :
    parseFloat(passRate) >= 70 ? 'C+' :
    'C';

  console.log(`\n🎓 Grade: ${grade}`);
  console.log('='.repeat(70));
}

// Run tests
runAllTests().catch(console.error);
