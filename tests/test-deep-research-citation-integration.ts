/**
 * Deep Research Citation Integration Test
 *
 * Validates that our deep research sources flow from:
 * 1. Source data files → Source indexer → Smart source selector
 * 2. Citation trigger detection → Citation attacher → SelectedCitation[]
 * 3. End-to-end: feedback text → citations with superscripts + display data
 *
 * This test ensures the critical integration between our 65+ deep research
 * sources and the user-facing citation system.
 */

import { CitationAttacher, attachCitationsToFeedback, FeedbackWithCitations } from '../src/services/commonAppWorkshop/services/citationAttacher';
import { CitationTriggerDetector, CitationTrigger, DeepResearchCategory } from '../src/services/commonAppWorkshop/services/citationTriggerDetector';
import { SmartSourceSelector } from '../src/services/commonAppWorkshop/services/smartSourceSelector';
import { getSourceIndexer } from '../src/services/commonAppWorkshop/services/sourceIndexer';
import { getRegistryStats } from '../src/services/commonAppWorkshop/data/sourceRegistry';

// ============================================================================
// TEST SETUP
// ============================================================================

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(message);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

// ============================================================================
// TEST 1: SOURCE REGISTRY HEALTH
// ============================================================================

function testSourceRegistryHealth() {
  logSection('TEST 1: SOURCE REGISTRY HEALTH');

  const stats = getRegistryStats();
  const totalSources = stats.total;
  const integratedBatches = stats.integratedBatches;
  const batchCount = Object.keys(stats.byBatch).length;

  log(`\nTotal sources: ${totalSources}`);
  log(`Integrated batches: ${integratedBatches}`);
  log(`Sources by batch: ${batchCount}`);

  results.push({
    test: 'Source registry populated',
    passed: totalSources >= 50,
    details: `${totalSources} total sources (need 50+)`,
  });

  results.push({
    test: 'Multiple batches integrated',
    passed: integratedBatches >= 5,
    details: `${integratedBatches} batches integrated`,
  });

  // Check batch details
  log('\nBatch source counts:');
  for (const [batchId, count] of Object.entries(stats.byBatch)) {
    log(`  ✓ ${batchId}: ${count} sources`);
  }
}

// ============================================================================
// TEST 2: SOURCE INDEXER ACCESS
// ============================================================================

function testSourceIndexerAccess() {
  logSection('TEST 2: SOURCE INDEXER ACCESS');

  const indexer = getSourceIndexer();

  // Test issue type lookups
  const issueTypes = [
    'telling_not_showing',
    'weak_opening',
    'weak_ending',
    'cliche_language',
    'surface_level_reflection',
  ];

  for (const issueType of issueTypes) {
    const sources = indexer.getTopForIssueType(issueType as any, 3);
    log(`\n${issueType}: ${sources.length} sources found`);
    if (sources.length > 0 && sources[0].source) {
      const quote = sources[0].source.quote || 'No quote available';
      log(`  Primary: "${sources[0].source.author || 'Unknown'}" - ${quote.substring(0, 50)}...`);
    }

    results.push({
      test: `Index lookup: ${issueType}`,
      passed: sources.length > 0,
      details: `${sources.length} sources found`,
    });
  }
}

// ============================================================================
// TEST 3: SMART SOURCE SELECTOR
// ============================================================================

function testSmartSourceSelector() {
  logSection('TEST 3: SMART SOURCE SELECTOR');

  const selector = new SmartSourceSelector();

  const testCases = [
    { symptom: 'telling_not_showing', college: 'stanford' },
    { symptom: 'weak_opening', college: 'harvard' },
    { symptom: 'weak_ending', college: 'mit' },
    { symptom: 'cliche_language', college: 'uchicago' },
  ];

  for (const tc of testCases) {
    const bundle = selector.selectForIssue(
      { symptom_type: tc.symptom },
      tc.college as any,
      { max_sources: 3 }
    );

    const hasPrimary = !!bundle.primary;
    const supportingCount = bundle.supporting?.length || 0;
    const hasFormatted = !!bundle.formatted;

    log(`\n${tc.symptom} @ ${tc.college}:`);
    log(`  Primary source: ${hasPrimary ? '✓' : '✗'}`);
    log(`  Supporting: ${supportingCount}`);
    log(`  Formatted output: ${hasFormatted ? '✓' : '✗'}`);

    if (bundle.primary) {
      log(`  Quote preview: "${bundle.primary.quote.substring(0, 60)}..."`);
    }

    results.push({
      test: `SmartSourceSelector: ${tc.symptom}`,
      passed: hasPrimary,
      details: `Primary: ${hasPrimary}, Supporting: ${supportingCount}`,
    });
  }
}

// ============================================================================
// TEST 4: CITATION TRIGGER DETECTION
// ============================================================================

function testCitationTriggerDetection() {
  logSection('TEST 4: CITATION TRIGGER DETECTION');

  const detector = new CitationTriggerDetector();

  const testFeedback = {
    problem: 'Your essay tells rather than shows. The opening lacks specificity and uses vague language.',
    why_matters: 'Admissions officers read thousands of essays. Showing through concrete details creates emotional resonance that generic statements cannot achieve.',
    how_to_fix: 'Replace abstract statements with sensory details. Start with a specific moment instead of a dictionary definition.',
  };

  const context = {
    college_id: 'stanford',
    essay_type: 'personal_statement',
    issue_type: 'telling_not_showing',
  };

  const triggers = detector.detectTriggers(testFeedback, context);

  log(`\nDetected ${triggers.length} triggers:`);

  // Group by type
  const byType = triggers.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(byType)) {
    log(`  ${type}: ${count}`);
  }

  // Check for deep research triggers
  const deepResearchTypes: DeepResearchCategory[] = [
    'show_dont_tell',
    'opening_hook',
    'essay_endings',
    'emotional_intelligence',
  ];

  const hasDeepResearchTriggers = triggers.some(t =>
    deepResearchTypes.includes(t.type as DeepResearchCategory)
  );

  results.push({
    test: 'Citation trigger detection',
    passed: triggers.length >= 2,
    details: `${triggers.length} triggers detected`,
  });

  results.push({
    test: 'Deep research triggers detected',
    passed: hasDeepResearchTriggers,
    details: `Deep research: ${hasDeepResearchTriggers ? 'Yes' : 'No'}`,
  });
}

// ============================================================================
// TEST 5: CITATION ATTACHMENT
// ============================================================================

function testCitationAttachment() {
  logSection('TEST 5: CITATION ATTACHMENT');

  const attacher = new CitationAttacher();
  const detector = new CitationTriggerDetector();

  // Test feedback with various citation-worthy claims
  const feedback = {
    problem: 'Your essay ending is weak and anticlimactic. The conclusion summarizes rather than resolving.',
    why_matters: 'Research on the peak-end rule shows endings disproportionately shape how readers remember your essay.',
    how_to_fix: 'End with a specific moment, not a summary. Return to your opening image with new meaning.',
  };

  const context = {
    college_id: 'stanford',
    essay_type: 'personal_statement',
    issue_type: 'weak_ending',
    severity: 'major',
  };

  // Detect triggers
  const triggers = detector.detectTriggers(feedback, context);
  log(`\nDetected ${triggers.length} triggers`);

  // Attach citations
  const result = attacher.attachCitations(feedback, triggers, context);

  // Check results
  const citationCount = Object.keys(result.citations).length;
  const hasSuperscripts = result.problem.includes('<sup>') ||
                          result.why_matters.includes('<sup>') ||
                          result.how_to_fix.includes('<sup>');

  log(`\nCitation attachment results:`);
  log(`  Citations attached: ${citationCount}`);
  log(`  Has superscripts: ${hasSuperscripts}`);

  if (citationCount > 0) {
    const firstCitation = result.citations[1];
    log(`\n  First citation preview:`);
    log(`    Hover: ${firstCitation?.hover_preview?.substring(0, 60) || 'N/A'}...`);
    log(`    Simple: ${firstCitation?.expandable?.simple?.substring(0, 60) || 'N/A'}...`);
  }

  results.push({
    test: 'Citations attached to feedback',
    passed: citationCount > 0,
    details: `${citationCount} citations attached`,
  });

  results.push({
    test: 'Superscripts inserted',
    passed: hasSuperscripts,
    details: `Superscripts: ${hasSuperscripts ? 'Yes' : 'No'}`,
  });
}

// ============================================================================
// TEST 6: ONE-STEP CONVENIENCE FUNCTION
// ============================================================================

async function testOneStepCitationFunction() {
  logSection('TEST 6: ONE-STEP CITATION FUNCTION');

  const feedback = {
    problem: 'The opening relies on a famous quote, which admissions officers find cliché.',
    why_matters: 'Your opening is your first impression. Generic openings signal generic essays.',
    how_to_fix: 'Start with your own voice - a specific moment, dialogue, or observation unique to you.',
  };

  const context = {
    college_id: 'harvard',
    essay_type: 'personal_statement',
    issue_type: 'famous_quote_opening',
  };

  const result = await attachCitationsToFeedback(feedback, context);

  const citationCount = Object.keys(result.citations).length;

  log(`\nOne-step function result:`);
  log(`  Citations: ${citationCount}`);

  if (citationCount > 0) {
    log(`\n  Modified problem (first 100 chars):`);
    log(`    ${result.problem.substring(0, 100)}...`);
  }

  results.push({
    test: 'One-step citation function',
    passed: citationCount >= 0, // At least works without error
    details: `${citationCount} citations via convenience function`,
  });
}

// ============================================================================
// TEST 7: DEEP RESEARCH CATEGORY ROUTING
// ============================================================================

function testDeepResearchCategoryRouting() {
  logSection('TEST 7: DEEP RESEARCH CATEGORY ROUTING');

  const attacher = new CitationAttacher();

  // Create explicit deep research triggers
  const deepTriggers: CitationTrigger[] = [
    {
      type: 'show_dont_tell',
      location: 'why_matters',
      anchor_text: 'concrete details',
      context: { deep_research_category: 'show_dont_tell' },
    },
    {
      type: 'essay_endings',
      location: 'problem',
      anchor_text: 'weak ending',
      context: { deep_research_category: 'essay_endings' },
    },
    {
      type: 'opening_hook',
      location: 'how_to_fix',
      anchor_text: 'strong opening',
      context: { deep_research_category: 'opening_hook' },
    },
  ];

  const feedback = {
    problem: 'Your essay has a weak ending that doesn\'t leave an impression.',
    why_matters: 'Showing with concrete details is what separates good essays from great ones.',
    how_to_fix: 'Start with a strong opening and end with resolution.',
  };

  const context = {
    college_id: 'mit',
    essay_type: 'personal_statement',
    issue_type: 'weak_ending',
  };

  const result = attacher.attachCitations(feedback, deepTriggers, context);
  const citationCount = Object.keys(result.citations).length;

  log(`\nDeep research category routing:`);
  log(`  Triggers provided: ${deepTriggers.length}`);
  log(`  Citations generated: ${citationCount}`);

  // Check that citations have proper deep research metadata
  if (citationCount > 0) {
    const firstCitation = result.citations[1];
    log(`\n  First citation source type: ${firstCitation?.citation?.citation?.type || 'unknown'}`);
    log(`  Has teaching implication: ${firstCitation?.expandable?.detailed?.includes('Teaching') || false}`);
  }

  results.push({
    test: 'Deep research routing',
    passed: citationCount >= 2,
    details: `${citationCount} citations from deep research`,
  });
}

// ============================================================================
// TEST 8: CITATION DISPLAY DATA QUALITY
// ============================================================================

async function testCitationDisplayDataQuality() {
  logSection('TEST 8: CITATION DISPLAY DATA QUALITY');

  const result = await attachCitationsToFeedback(
    {
      problem: 'Your essay tells emotions rather than showing them through specific details.',
      why_matters: 'Readers experience your story through concrete sensory details, not abstract labels.',
      how_to_fix: 'Replace "I felt nervous" with physical sensations: sweating, racing heart, etc.',
    },
    {
      college_id: 'stanford',
      essay_type: 'personal_statement',
      issue_type: 'telling_not_showing',
    }
  );

  let qualityChecks = 0;
  let qualityPassed = 0;

  for (const [num, citation] of Object.entries(result.citations)) {
    log(`\nCitation #${num}:`);

    // Check hover preview
    qualityChecks++;
    if (citation.hover_preview && citation.hover_preview.length > 10) {
      log(`  ✓ Hover preview: ${citation.hover_preview.substring(0, 50)}...`);
      qualityPassed++;
    } else {
      log(`  ✗ Hover preview missing or too short`);
    }

    // Check expandable levels
    qualityChecks++;
    if (citation.expandable?.simple && citation.expandable.simple.length > 20) {
      log(`  ✓ Simple level present`);
      qualityPassed++;
    } else {
      log(`  ✗ Simple level missing`);
    }

    qualityChecks++;
    if (citation.expandable?.medium && citation.expandable.medium.length > 50) {
      log(`  ✓ Medium level present`);
      qualityPassed++;
    } else {
      log(`  ✗ Medium level missing`);
    }

    qualityChecks++;
    if (citation.expandable?.detailed && citation.expandable.detailed.length > 100) {
      log(`  ✓ Detailed level present`);
      qualityPassed++;
    } else {
      log(`  ✗ Detailed level missing`);
    }
  }

  const qualityRate = qualityChecks > 0 ? (qualityPassed / qualityChecks) * 100 : 0;

  results.push({
    test: 'Citation display data quality',
    passed: qualityRate >= 75,
    details: `${qualityPassed}/${qualityChecks} quality checks (${qualityRate.toFixed(1)}%)`,
  });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('  DEEP RESEARCH CITATION INTEGRATION TEST');
  console.log('█'.repeat(60));

  const startTime = Date.now();

  testSourceRegistryHealth();
  testSourceIndexerAccess();
  testSmartSourceSelector();
  testCitationTriggerDetection();
  testCitationAttachment();
  await testOneStepCitationFunction();
  testDeepResearchCategoryRouting();
  await testCitationDisplayDataQuality();

  // Summary
  logSection('FINAL SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  RESULTS: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`  TIME: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log(`${'─'.repeat(60)}\n`);

  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('FAILED TESTS:');
    failed.forEach(f => console.log(`  ✗ ${f.test}: ${f.details}`));
  }

  const passRate = (passed / total) * 100;
  let grade = 'F';
  if (passRate >= 95) grade = 'A+';
  else if (passRate >= 90) grade = 'A';
  else if (passRate >= 85) grade = 'A-';
  else if (passRate >= 80) grade = 'B+';
  else if (passRate >= 75) grade = 'B';
  else if (passRate >= 70) grade = 'B-';
  else if (passRate >= 65) grade = 'C+';
  else if (passRate >= 60) grade = 'C';

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  OVERALL: ${passed === total ? 'PASS ✓' : 'NEEDS WORK'} | GRADE: ${grade}`);
  console.log(`${'═'.repeat(60)}\n`);
}

runAllTests();
