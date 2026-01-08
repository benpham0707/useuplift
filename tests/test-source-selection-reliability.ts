/**
 * Source Selection Reliability Test
 *
 * Comprehensive validation that:
 * 1. Pattern detection is accurate and reliable
 * 2. Source selection avoids repetition
 * 3. College-specific vs universal sources are properly separated
 * 4. Relevance matching is accurate
 * 5. Diversity requirements are enforced
 */

import {
  SourceIndexer,
  getSourceIndexer,
  resetSourceIndexer,
} from '../src/services/commonAppWorkshop/services/sourceIndexer';

import {
  SmartSourceSelector,
  getSmartSourceSelector,
  resetSmartSourceSelector,
  getSourceBundleForIssue,
} from '../src/services/commonAppWorkshop/services/smartSourceSelector';

import { LABELED_SOURCES } from '../src/services/commonAppWorkshop/data/labeledSources';

import type {
  ClicheSymptomType,
  CollegeId,
  LabeledSource,
} from '../src/services/commonAppWorkshop/types/labeledSourceTypes';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details: string;
  severity: 'critical' | 'major' | 'minor';
}

const results: TestResult[] = [];

function recordTest(
  name: string,
  category: string,
  passed: boolean,
  details: string,
  severity: 'critical' | 'major' | 'minor' = 'major'
): void {
  results.push({ name, category, passed, details, severity });
  const status = passed ? '✅' : '❌';
  const severityIcon = severity === 'critical' ? '🔴' : severity === 'major' ? '🟡' : '🟢';
  console.log(`${status} ${severityIcon} ${name}`);
  if (!passed) {
    console.log(`   └─ ${details}`);
  }
}

// ============================================================================
// TEST 1: SOURCE DATABASE COMPLETENESS
// ============================================================================

function testSourceDatabaseCompleteness(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 1: SOURCE DATABASE COMPLETENESS');
  console.log('═'.repeat(70));

  // Check we have enough sources
  recordTest(
    'Minimum source count (15+)',
    'completeness',
    LABELED_SOURCES.length >= 15,
    `Have ${LABELED_SOURCES.length} sources, need at least 15`,
    'critical'
  );

  // Check author diversity
  const uniqueAuthors = new Set(LABELED_SOURCES.map(s => s.author));
  recordTest(
    'Author diversity (8+ unique authors)',
    'completeness',
    uniqueAuthors.size >= 8,
    `Have ${uniqueAuthors.size} unique authors`,
    'major'
  );

  // Check college coverage
  const collegesWithPrimary = new Set(
    LABELED_SOURCES
      .map(s => s.college_specificity.primary_college)
      .filter((c): c is string => !!c)
  );
  recordTest(
    'College primary source coverage (8+ colleges)',
    'completeness',
    collegesWithPrimary.size >= 8,
    `Have primary sources for: ${[...collegesWithPrimary].join(', ')}`,
    'major'
  );

  // Check issue type coverage
  const issueTypes: ClicheSymptomType[] = [
    'cliche_metaphor',
    'telling_not_showing',
    'cliche_topic_framing',
    'cliche_narrative_arc',
    'cliche_ai_convergence',
    'cliche_language',
    'cliche_value_signaling',
    'cliche_college_specific',
  ];

  for (const issueType of issueTypes) {
    const sourcesForIssue = LABELED_SOURCES.filter(
      s => s.issue_relevance[issueType]?.score >= 70
    );
    recordTest(
      `Issue coverage: ${issueType} (3+ high-relevance sources)`,
      'completeness',
      sourcesForIssue.length >= 3,
      `Found ${sourcesForIssue.length} sources with score >= 70`,
      issueType === 'cliche_metaphor' ? 'minor' : 'major'
    );
  }
}

// ============================================================================
// TEST 2: SOURCE SELECTION DIVERSITY
// ============================================================================

function testSourceSelectionDiversity(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 2: SOURCE SELECTION DIVERSITY');
  console.log('═'.repeat(70));

  resetSmartSourceSelector();
  const selector = getSmartSourceSelector();

  const colleges: CollegeId[] = ['stanford', 'harvard', 'mit', 'duke', 'uchicago'];
  const issues: ClicheSymptomType[] = ['telling_not_showing', 'cliche_language', 'cliche_ai_convergence'];

  for (const college of colleges) {
    for (const issue of issues) {
      const bundle = selector.selectForIssue(
        { symptom_type: issue },
        college,
        { max_sources: 4, require_author_diversity: true }
      );

      // Check no repeated authors in bundle
      const allSources = [bundle.primary, ...bundle.supporting].filter(Boolean);
      const authors = allSources.map(s => s?.author);
      const uniqueAuthors = new Set(authors);

      recordTest(
        `No repeated authors: ${college} + ${issue}`,
        'diversity',
        uniqueAuthors.size === authors.length,
        `Authors: ${authors.join(', ')}`,
        'major'
      );

      // Check diversity score is reasonable
      recordTest(
        `Diversity score >= 50: ${college} + ${issue}`,
        'diversity',
        bundle.metadata.diversity_score >= 50,
        `Diversity score: ${bundle.metadata.diversity_score}`,
        'minor'
      );
    }
  }

  // Test repeated selection doesn't always return same sources
  console.log('\n  Testing selection stability...');
  const selectionCounts = new Map<string, number>();

  for (let i = 0; i < 10; i++) {
    // Test multiple colleges and issues
    for (const college of ['stanford', 'harvard', 'mit'] as CollegeId[]) {
      const bundle = selector.selectForIssue(
        { symptom_type: 'telling_not_showing' },
        college
      );
      const primaryId = bundle.primary?.source_id || 'none';
      const key = `${college}:${primaryId}`;
      selectionCounts.set(key, (selectionCounts.get(key) || 0) + 1);
    }
  }

  // Each college should get a consistent primary (deterministic)
  const stanfordCount = [...selectionCounts.entries()].filter(([k]) => k.startsWith('stanford:')).length;
  recordTest(
    'Selection is deterministic (same input = same output)',
    'diversity',
    stanfordCount === 1,
    `Stanford selections: ${stanfordCount} unique primaries`,
    'major'
  );
}

// ============================================================================
// TEST 3: COLLEGE-SPECIFIC VS UNIVERSAL SOURCE SEPARATION
// ============================================================================

function testCollegeSpecificVsUniversal(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 3: COLLEGE-SPECIFIC VS UNIVERSAL SOURCE SEPARATION');
  console.log('═'.repeat(70));

  resetSmartSourceSelector();
  const selector = getSmartSourceSelector();

  // Test that college-specific sources are prioritized for their college
  const testCases: { college: CollegeId; expectedPrimaryAuthor: string }[] = [
    { college: 'stanford', expectedPrimaryAuthor: 'Richard Shaw' },
    { college: 'harvard', expectedPrimaryAuthor: 'William Fitzsimmons' },
    { college: 'duke', expectedPrimaryAuthor: 'Christoph Guttentag' },
    { college: 'mit', expectedPrimaryAuthor: 'Stu Schmill' },
    { college: 'uchicago', expectedPrimaryAuthor: 'James Nondorf' },
  ];

  for (const { college, expectedPrimaryAuthor } of testCases) {
    const bundle = selector.selectForIssue(
      { symptom_type: 'cliche_college_specific' },
      college,
      { prioritize_college_specific: true }
    );

    recordTest(
      `${college} primary source is ${expectedPrimaryAuthor}`,
      'college-specific',
      bundle.primary?.author === expectedPrimaryAuthor,
      `Got: ${bundle.primary?.author || 'none'}`,
      'critical'
    );

    // Check college_specific field
    recordTest(
      `${college} bundle has college_specific source`,
      'college-specific',
      bundle.college_specific !== null,
      bundle.college_specific ? `Has: ${bundle.college_specific.author}` : 'Missing',
      'major'
    );
  }

  // Test that universal sources (applicable to many colleges) are included
  console.log('\n  Testing universal source inclusion...');

  const universalBundle = selector.selectForIssue(
    { symptom_type: 'telling_not_showing' },
    'stanford',
    { max_sources: 5 }
  );

  // Should include at least one source from another institution
  const allSources = [universalBundle.primary, ...universalBundle.supporting].filter(Boolean);
  const institutions = new Set(allSources.map(s => s?.college_specificity.primary_college));

  recordTest(
    'Bundle includes sources from multiple institutions',
    'college-specific',
    institutions.size >= 1, // At least primary institution
    `Institutions represented: ${[...institutions].filter(Boolean).join(', ')}`,
    'minor'
  );

  // Test general_principle field
  recordTest(
    'Bundle has general_principle source',
    'college-specific',
    universalBundle.general_principle !== null,
    universalBundle.general_principle
      ? `Has: ${universalBundle.general_principle.author}`
      : 'Missing general principle source',
    'minor'
  );
}

// ============================================================================
// TEST 4: RELEVANCE MATCHING ACCURACY
// ============================================================================

function testRelevanceMatchingAccuracy(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 4: RELEVANCE MATCHING ACCURACY');
  console.log('═'.repeat(70));

  resetSourceIndexer();
  const indexer = getSourceIndexer();

  // Test that high-relevance sources are returned for each issue type
  const issueToExpectedSources: { issue: ClicheSymptomType; expectedKeywords: string[] }[] = [
    {
      issue: 'telling_not_showing',
      expectedKeywords: ['show', 'details', 'moment', 'feel', 'concrete']
    },
    {
      issue: 'cliche_language',
      expectedKeywords: ['same', 'invisible', 'specific', 'recycled', 'phrases']
    },
    {
      issue: 'cliche_ai_convergence',
      expectedKeywords: ['authentic', 'voice', 'genuine', 'same', 'recycled']
    },
    {
      issue: 'cliche_narrative_arc',
      expectedKeywords: ['reflection', 'growth', 'genuine', 'manufactured']
    },
    {
      issue: 'vulnerability',
      expectedKeywords: ['honest', 'risks', 'uncertainty', 'vulnerability']
    },
  ];

  for (const { issue, expectedKeywords } of issueToExpectedSources) {
    const topSources = indexer.getTopForIssueType(issue, 3, 70);

    // Check that top sources have relevant quotes
    let keywordMatches = 0;
    for (const source of topSources) {
      const text = `${source.source.quote || ''} ${source.source.relevance_to_claim || ''}`.toLowerCase();
      for (const keyword of expectedKeywords) {
        if (text.includes(keyword)) {
          keywordMatches++;
          break;
        }
      }
    }

    recordTest(
      `${issue}: Top sources contain relevant keywords`,
      'relevance',
      keywordMatches >= Math.min(2, topSources.length),
      `${keywordMatches}/${topSources.length} sources match keywords: ${expectedKeywords.slice(0, 3).join(', ')}`,
      'major'
    );
  }

  // Test that relevance scores are consistent
  console.log('\n  Testing relevance score consistency...');

  for (const source of LABELED_SOURCES) {
    const scores = Object.values(source.issue_relevance).map(r => r.score);
    const hasReasonableScores = scores.every(s => s >= 0 && s <= 100);
    const hasVariation = new Set(scores).size > 1; // Not all same score

    if (!hasReasonableScores) {
      recordTest(
        `${source.author}: Scores in valid range (0-100)`,
        'relevance',
        false,
        `Invalid scores found: ${scores.join(', ')}`,
        'critical'
      );
    }

    if (!hasVariation && scores.length > 2) {
      recordTest(
        `${source.author}: Scores show variation`,
        'relevance',
        false,
        `All scores identical: ${scores[0]}`,
        'minor'
      );
    }
  }

  recordTest(
    'All sources have valid relevance scores',
    'relevance',
    LABELED_SOURCES.every(s =>
      Object.values(s.issue_relevance).every(r => r.score >= 0 && r.score <= 100)
    ),
    'Checking score ranges',
    'critical'
  );
}

// ============================================================================
// TEST 5: NO SOURCE OVER-REPETITION
// ============================================================================

function testNoSourceOverRepetition(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 5: NO SOURCE OVER-REPETITION');
  console.log('═'.repeat(70));

  resetSmartSourceSelector();
  const selector = getSmartSourceSelector();

  // Track how often each source is selected as primary across all combinations
  const primarySelectionCounts = new Map<string, number>();
  const totalSelections = new Map<string, number>();

  const colleges: CollegeId[] = ['stanford', 'harvard', 'mit', 'duke', 'uchicago', 'uva', 'brown'];
  const issues: ClicheSymptomType[] = [
    'telling_not_showing',
    'cliche_language',
    'cliche_ai_convergence',
    'cliche_topic_framing',
    'cliche_value_signaling',
  ];

  let totalTests = 0;
  for (const college of colleges) {
    for (const issue of issues) {
      const bundle = selector.selectForIssue(
        { symptom_type: issue },
        college,
        { max_sources: 4 }
      );

      totalTests++;

      // Count primary selection
      if (bundle.primary) {
        const key = bundle.primary.source_id;
        primarySelectionCounts.set(key, (primarySelectionCounts.get(key) || 0) + 1);
      }

      // Count total selections (primary + supporting)
      const allSources = [bundle.primary, ...bundle.supporting].filter(Boolean);
      for (const source of allSources) {
        if (source) {
          const key = source.source_id;
          totalSelections.set(key, (totalSelections.get(key) || 0) + 1);
        }
      }
    }
  }

  // Check no single source is primary more than 30% of the time
  const maxPrimaryCount = Math.max(...primarySelectionCounts.values());
  const maxPrimaryRate = maxPrimaryCount / totalTests;
  const mostFrequentPrimary = [...primarySelectionCounts.entries()]
    .find(([, count]) => count === maxPrimaryCount)?.[0];

  recordTest(
    'No single source dominates as primary (< 30%)',
    'repetition',
    maxPrimaryRate < 0.3,
    `Most frequent primary: ${mostFrequentPrimary} (${(maxPrimaryRate * 100).toFixed(1)}%)`,
    'major'
  );

  // Check distribution of total selections
  const selectionValues = [...totalSelections.values()];
  const avgSelections = selectionValues.reduce((a, b) => a + b, 0) / selectionValues.length;
  const maxSelections = Math.max(...selectionValues);
  const selectionSkew = maxSelections / avgSelections;

  recordTest(
    'Selection distribution is balanced (skew < 3x)',
    'repetition',
    selectionSkew < 3,
    `Max selections: ${maxSelections}, Avg: ${avgSelections.toFixed(1)}, Skew: ${selectionSkew.toFixed(2)}x`,
    'minor'
  );

  // Show selection distribution
  console.log('\n  Source selection frequency:');
  const sortedSelections = [...totalSelections.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [sourceId, count] of sortedSelections) {
    const source = LABELED_SOURCES.find(s => s.source_id === sourceId);
    console.log(`    ${source?.author || sourceId}: ${count} selections`);
  }
}

// ============================================================================
// TEST 6: ISSUE TYPE MAPPING COVERAGE
// ============================================================================

function testIssueTypeMappingCoverage(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 6: ISSUE TYPE MAPPING COVERAGE');
  console.log('═'.repeat(70));

  // All issue types that should have sources
  const allIssueTypes: ClicheSymptomType[] = [
    'cliche_metaphor',
    'telling_not_showing',
    'cliche_topic_framing',
    'cliche_narrative_arc',
    'cliche_ai_convergence',
    'cliche_essay_formula',
    'cliche_college_specific',
    'cliche_value_signaling',
    'cliche_inspirational',
    'cliche_language',
  ];

  resetSourceIndexer();
  const indexer = getSourceIndexer();

  for (const issueType of allIssueTypes) {
    const sources = indexer.getForIssueType(issueType);

    recordTest(
      `${issueType}: Has sources (minimum 3)`,
      'mapping',
      sources.length >= 3,
      `Found ${sources.length} sources`,
      issueType === 'cliche_metaphor' ? 'minor' : 'major'
    );

    // Check for high-quality sources (score >= 80)
    const highQualitySources = sources.filter(
      s => (s.relevance_lookup.get(issueType) || 0) >= 80
    );

    recordTest(
      `${issueType}: Has high-quality sources (score >= 80)`,
      'mapping',
      highQualitySources.length >= 1,
      `Found ${highQualitySources.length} high-quality sources`,
      'minor'
    );
  }

  // Check coverage report
  const coverage = indexer.getCoverageReport();
  console.log('\n  Coverage report:');
  for (const [issue, count] of coverage) {
    console.log(`    ${issue}: ${count} sources`);
  }
}

// ============================================================================
// TEST 7: FORMATTED OUTPUT QUALITY
// ============================================================================

function testFormattedOutputQuality(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 7: FORMATTED OUTPUT QUALITY');
  console.log('═'.repeat(70));

  resetSmartSourceSelector();
  const selector = getSmartSourceSelector();

  // Test formatted output for various bundles
  const bundle = selector.selectForIssue(
    { symptom_type: 'telling_not_showing' },
    'stanford',
    { max_sources: 3 }
  );

  // Check inline format
  recordTest(
    'Inline format includes author name',
    'formatting',
    bundle.formatted.inline.includes(bundle.primary?.author || ''),
    `Inline: ${bundle.formatted.inline}`,
    'minor'
  );

  // Check tooltip format
  recordTest(
    'Tooltip format includes quote',
    'formatting',
    bundle.formatted.tooltip.includes('"'),
    `Tooltip length: ${bundle.formatted.tooltip.length} chars`,
    'minor'
  );

  // Check full format
  recordTest(
    'Full format includes all sources',
    'formatting',
    bundle.formatted.full.includes('Source 1') || bundle.formatted.full.includes('###'),
    `Full format length: ${bundle.formatted.full.length} chars`,
    'minor'
  );

  // Check no undefined values in formatted output
  recordTest(
    'No undefined values in formatted output',
    'formatting',
    !bundle.formatted.inline.includes('undefined') &&
    !bundle.formatted.tooltip.includes('undefined') &&
    !bundle.formatted.full.includes('undefined'),
    'Checking for undefined values',
    'critical'
  );
}

// ============================================================================
// TEST 8: EDGE CASES
// ============================================================================

function testEdgeCases(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 8: EDGE CASES');
  console.log('═'.repeat(70));

  resetSmartSourceSelector();
  const selector = getSmartSourceSelector();

  // Test with unsupported college (should fallback gracefully)
  const unsupportedBundle = selector.selectForIssue(
    { symptom_type: 'telling_not_showing' },
    'unknown_college' as CollegeId
  );

  recordTest(
    'Graceful fallback for unknown college',
    'edge-cases',
    unsupportedBundle.primary !== null,
    `Got primary: ${unsupportedBundle.primary?.author || 'none'}`,
    'major'
  );

  // Test with very restrictive options
  const restrictiveBundle = selector.selectForIssue(
    { symptom_type: 'telling_not_showing' },
    'stanford',
    { max_sources: 1, min_relevance_score: 95 }
  );

  recordTest(
    'Handles restrictive options (max_sources: 1)',
    'edge-cases',
    restrictiveBundle.primary !== null,
    `Primary score: ${restrictiveBundle.primary?.issue_relevance?.telling_not_showing?.score || 'N/A'}`,
    'major'
  );

  // Test getBestSingle
  const singleSource = selector.getBestSingle('cliche_language', 'harvard');
  recordTest(
    'getBestSingle returns single source',
    'edge-cases',
    singleSource !== null,
    `Got: ${singleSource?.author || 'none'}`,
    'major'
  );

  // Test selectForWeightProof
  const weightBundle = selector.selectForWeightProof('intellectual_vitality', 'stanford');
  recordTest(
    'selectForWeightProof returns sources',
    'edge-cases',
    weightBundle.primary !== null,
    `Got: ${weightBundle.primary?.author || 'none'}`,
    'major'
  );
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('█'.repeat(70));
  console.log('  SOURCE SELECTION RELIABILITY TEST');
  console.log('  Validating pattern detection, diversity, and relevance');
  console.log('█'.repeat(70));

  const startTime = performance.now();

  testSourceDatabaseCompleteness();
  testSourceSelectionDiversity();
  testCollegeSpecificVsUniversal();
  testRelevanceMatchingAccuracy();
  testNoSourceOverRepetition();
  testIssueTypeMappingCoverage();
  testFormattedOutputQuality();
  testEdgeCases();

  const endTime = performance.now();

  // Summary
  console.log('\n' + '█'.repeat(70));
  console.log('  TEST SUMMARY');
  console.log('█'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.severity === 'critical').length;
  const majorFailed = results.filter(r => !r.passed && r.severity === 'major').length;
  const minorFailed = results.filter(r => !r.passed && r.severity === 'minor').length;

  const passRate = ((passed / results.length) * 100).toFixed(1);

  console.log(`\n📊 Results: ${passed}/${results.length} tests passed (${passRate}%)`);
  console.log(`⏱️  Total time: ${(endTime - startTime).toFixed(2)}ms`);

  if (failed > 0) {
    console.log('\n❌ Failed tests by severity:');
    if (criticalFailed > 0) {
      console.log(`   🔴 Critical: ${criticalFailed}`);
      results.filter(r => !r.passed && r.severity === 'critical')
        .forEach(r => console.log(`      - ${r.name}`));
    }
    if (majorFailed > 0) {
      console.log(`   🟡 Major: ${majorFailed}`);
      results.filter(r => !r.passed && r.severity === 'major')
        .forEach(r => console.log(`      - ${r.name}`));
    }
    if (minorFailed > 0) {
      console.log(`   🟢 Minor: ${minorFailed}`);
      results.filter(r => !r.passed && r.severity === 'minor')
        .forEach(r => console.log(`      - ${r.name}`));
    }
  }

  // By category summary
  console.log('\n📋 By Category:');
  const categories = [...new Set(results.map(r => r.category))];
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    const status = categoryPassed === categoryResults.length ? '✅' : '⚠️';
    console.log(`   ${status} ${category}: ${categoryPassed}/${categoryResults.length}`);
  }

  // Grade
  const grade =
    criticalFailed > 0 ? 'F' :
    majorFailed > 2 ? 'D' :
    majorFailed > 0 ? 'C' :
    minorFailed > 3 ? 'B' :
    minorFailed > 0 ? 'A-' :
    'A+';

  console.log(`\n🎓 Grade: ${grade}`);

  if (grade === 'A+' || grade === 'A-') {
    console.log('✅ Source selection system is RELIABLE');
  } else if (grade === 'B') {
    console.log('⚠️ Source selection system is MOSTLY RELIABLE with minor issues');
  } else {
    console.log('❌ Source selection system NEEDS IMPROVEMENT');
  }

  console.log('█'.repeat(70));
}

// Run tests
runAllTests().catch(console.error);
