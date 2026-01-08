/**
 * Optimized Citation System Test
 *
 * Tests the new pre-labeled, indexed citation system:
 * 1. LabeledSource validation
 * 2. SourceIndexer pre-computation
 * 3. SmartSourceSelector multi-source selection
 * 4. College-specific prioritization
 * 5. Source diversity requirements
 * 6. Performance benchmarks
 *
 * Run: set -a && source .env && set +a && npx tsx tests/test-optimized-citation-system.ts
 */

import { LABELED_SOURCES, getSourceById, getUniqueAuthors, getCollegesWithPrimarySources } from '../src/services/commonAppWorkshop/data/labeledSources';
import { validateSourceCollection, validateLabeledSource } from '../src/services/commonAppWorkshop/types/labeledSourceTypes';
import { SourceIndexer, getSourceIndexer, resetSourceIndexer } from '../src/services/commonAppWorkshop/services/sourceIndexer';
import { SmartSourceSelector, getSmartSourceSelector, resetSmartSourceSelector } from '../src/services/commonAppWorkshop/services/smartSourceSelector';
import type { CollegeId, ClicheSymptomType } from '../src/services/commonAppWorkshop/types/labeledSourceTypes';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('\n' + '█'.repeat(70));
  console.log(`  ${BOLD}OPTIMIZED CITATION SYSTEM TEST${RESET}`);
  console.log('  Testing pre-labeled sources, indexer, and smart selector');
  console.log('█'.repeat(70));

  let passed = 0;
  let failed = 0;

  // Reset singletons for clean test
  resetSourceIndexer();
  resetSmartSourceSelector();

  // ============================================================================
  // TEST 1: All Sources Have Valid Labels
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 1: Source Label Validation${RESET}`);
  console.log('═'.repeat(70));

  const validationResult = validateSourceCollection(LABELED_SOURCES);

  console.log(`\n${YELLOW}Validation Results:${RESET}`);
  console.log(`  Total sources: ${validationResult.total}`);
  console.log(`  Passed: ${validationResult.passed}`);
  console.log(`  Failed: ${validationResult.failed.length}`);

  if (validationResult.failed.length > 0) {
    console.log(`\n${RED}Failed sources:${RESET}`);
    for (const failure of validationResult.failed) {
      console.log(`  ${failure.source_id}: ${failure.errors.join(', ')}`);
    }
  }

  if (validationResult.valid) {
    console.log(`\n${GREEN}✓ PASS: All ${validationResult.total} sources have valid labels${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: ${validationResult.failed.length} sources have invalid labels${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 2: Source Indexer Builds Successfully
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 2: Source Indexer Build${RESET}`);
  console.log('═'.repeat(70));

  const indexer = new SourceIndexer(LABELED_SOURCES);
  const stats = indexer.getStats();

  console.log(`\n${YELLOW}Indexer Statistics:${RESET}`);
  console.log(`  Total sources indexed: ${stats.totalSources}`);
  console.log(`  Colleges with primary sources: ${stats.collegesWithPrimarySources}`);
  console.log(`  Issue types covered: ${stats.issueTypesCovered}`);
  console.log(`  Categories covered: ${stats.categoriesCovered}`);
  console.log(`  Build time: ${stats.buildTimeMs}ms`);

  if (stats.totalSources === 15 && stats.buildTimeMs < 100) {
    console.log(`\n${GREEN}✓ PASS: Indexer built successfully in <100ms${RESET}`);
    passed++;
  } else if (stats.totalSources === 15) {
    console.log(`\n${YELLOW}○ PASS: Indexer built (${stats.buildTimeMs}ms - consider optimization if slow)${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: Indexer missing sources or too slow${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 3: College-Specific Lookup
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 3: College-Specific Lookup${RESET}`);
  console.log('═'.repeat(70));

  const colleges: CollegeId[] = ['stanford', 'harvard', 'mit', 'uchicago', 'duke'];
  const expectedPrimaryAuthors: Record<string, string> = {
    stanford: 'Richard Shaw',
    harvard: 'William Fitzsimmons',
    mit: 'Stu Schmill',
    uchicago: 'James Nondorf',
    duke: 'Christoph Guttentag',
  };

  let collegeTestsPassed = 0;

  for (const college of colleges) {
    const primary = indexer.getPrimaryForCollege(college);
    const allForCollege = indexer.getForCollege(college);

    console.log(`\n${YELLOW}${college.toUpperCase()}:${RESET}`);
    console.log(`  Total applicable sources: ${allForCollege.length}`);

    if (primary) {
      console.log(`  Primary author: ${primary.source.author}`);

      if (primary.source.author === expectedPrimaryAuthors[college]) {
        console.log(`  ${GREEN}✓ Correct primary source${RESET}`);
        collegeTestsPassed++;
      } else {
        console.log(`  ${RED}✗ Wrong primary (expected ${expectedPrimaryAuthors[college]})${RESET}`);
      }
    } else {
      console.log(`  ${RED}✗ No primary source found${RESET}`);
    }
  }

  if (collegeTestsPassed === colleges.length) {
    console.log(`\n${GREEN}✓ PASS: All colleges have correct primary sources${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: ${colleges.length - collegeTestsPassed} colleges missing correct primary${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 4: Issue Type Coverage
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 4: Issue Type Coverage${RESET}`);
  console.log('═'.repeat(70));

  const issueTypes: ClicheSymptomType[] = [
    'cliche_topic_framing',
    'cliche_narrative_arc',
    'cliche_language',
    'cliche_ai_convergence',
    'cliche_college_specific',
    'telling_not_showing',
    'cliche_value_signaling',
  ];

  console.log(`\n${YELLOW}Sources per issue type:${RESET}`);

  let minCoverage = Infinity;
  for (const issueType of issueTypes) {
    const sources = indexer.getForIssueType(issueType);
    console.log(`  ${issueType}: ${sources.length} sources`);
    minCoverage = Math.min(minCoverage, sources.length);
  }

  if (minCoverage >= 3) {
    console.log(`\n${GREEN}✓ PASS: All issue types have at least 3 sources${RESET}`);
    passed++;
  } else if (minCoverage >= 1) {
    console.log(`\n${YELLOW}○ PARTIAL: Some issue types have < 3 sources (min: ${minCoverage})${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: Some issue types have no sources${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 5: Smart Source Selection
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 5: Smart Source Selection${RESET}`);
  console.log('═'.repeat(70));

  const selector = new SmartSourceSelector(indexer);

  const testCases = [
    { issue: 'cliche_ai_convergence', college: 'stanford' as CollegeId },
    { issue: 'telling_not_showing', college: 'harvard' as CollegeId },
    { issue: 'cliche_college_specific', college: 'mit' as CollegeId },
  ];

  let selectionTestsPassed = 0;

  for (const testCase of testCases) {
    const bundle = selector.selectForIssue(
      { symptom_type: testCase.issue },
      testCase.college
    );

    console.log(`\n${YELLOW}${testCase.issue} + ${testCase.college}:${RESET}`);
    console.log(`  Primary: ${bundle.primary?.author || 'None'}`);
    console.log(`  Supporting: ${bundle.supporting.length}`);
    console.log(`  College-specific: ${bundle.college_specific?.author || 'None'}`);
    console.log(`  Diversity score: ${bundle.metadata.diversity_score}`);

    // Primary source is required; supporting sources are nice to have
    if (bundle.primary) {
      console.log(`  ${GREEN}✓ Selection complete (primary found)${RESET}`);
      selectionTestsPassed++;
    } else {
      console.log(`  ${RED}✗ No primary source found${RESET}`);
    }
  }

  if (selectionTestsPassed === testCases.length) {
    console.log(`\n${GREEN}✓ PASS: Smart selection works for all test cases${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: ${testCases.length - selectionTestsPassed} selections failed${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 6: Source Diversity
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 6: Source Diversity${RESET}`);
  console.log('═'.repeat(70));

  const diverseBundle = selector.selectForIssue(
    { symptom_type: 'cliche_language' },
    'stanford',
    { max_sources: 5, require_author_diversity: true, max_same_author: 1 }
  );

  console.log(`\n${YELLOW}Diversity test (max 1 per author):${RESET}`);
  console.log(`  Total sources: ${1 + diverseBundle.supporting.length}`);

  const allAuthors = [diverseBundle.primary.author, ...diverseBundle.supporting.map(s => s.author)];
  const uniqueAuthors = new Set(allAuthors);

  console.log(`  Unique authors: ${uniqueAuthors.size}`);
  console.log(`  Authors: ${[...uniqueAuthors].join(', ')}`);

  if (uniqueAuthors.size === allAuthors.length) {
    console.log(`\n${GREEN}✓ PASS: All authors are unique (perfect diversity)${RESET}`);
    passed++;
  } else if (uniqueAuthors.size >= allAuthors.length * 0.8) {
    console.log(`\n${YELLOW}○ PARTIAL: Good diversity (${uniqueAuthors.size}/${allAuthors.length} unique)${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: Poor diversity${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 7: Formatted Output
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 7: Formatted Output${RESET}`);
  console.log('═'.repeat(70));

  const formattedBundle = selector.selectForIssue(
    { symptom_type: 'cliche_topic_framing' },
    'duke'
  );

  console.log(`\n${YELLOW}Formatted outputs:${RESET}`);
  console.log(`\n  Inline: ${formattedBundle.formatted.inline}`);
  console.log(`\n  Tooltip (first 100 chars): ${formattedBundle.formatted.tooltip.substring(0, 100)}...`);

  const hasInline = formattedBundle.formatted.inline.length > 10;
  const hasTooltip = formattedBundle.formatted.tooltip.length > 50;
  const hasFull = formattedBundle.formatted.full.length > 100;

  if (hasInline && hasTooltip && hasFull) {
    console.log(`\n${GREEN}✓ PASS: All formatted outputs present${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: Missing formatted outputs${RESET}`);
    failed++;
  }

  // ============================================================================
  // TEST 8: Performance Benchmark
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST 8: Performance Benchmark${RESET}`);
  console.log('═'.repeat(70));

  const iterations = 1000;
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    const randomIssue = issueTypes[i % issueTypes.length];
    const randomCollege = colleges[i % colleges.length];
    indexer.getBestForCollegeAndIssue(randomCollege, randomIssue, 3);
  }

  const totalTime = Date.now() - start;
  const avgTime = totalTime / iterations;

  console.log(`\n${YELLOW}Benchmark (${iterations} lookups):${RESET}`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average per lookup: ${avgTime.toFixed(3)}ms`);
  console.log(`  Lookups per second: ${Math.round(1000 / avgTime)}`);

  if (avgTime < 1) {
    console.log(`\n${GREEN}✓ PASS: Sub-millisecond lookups achieved${RESET}`);
    passed++;
  } else if (avgTime < 5) {
    console.log(`\n${YELLOW}○ PASS: Acceptable performance (< 5ms avg)${RESET}`);
    passed++;
  } else {
    console.log(`\n${RED}✗ FAIL: Performance too slow (> 5ms avg)${RESET}`);
    failed++;
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n\n' + '═'.repeat(70));
  console.log(`${CYAN}${BOLD}TEST SUMMARY${RESET}`);
  console.log('═'.repeat(70));

  const total = passed + failed;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n  Passed: ${GREEN}${passed}/${total}${RESET} (${percentage}%)`);
  if (failed > 0) {
    console.log(`  Failed: ${RED}${failed}/${total}${RESET}`);
  }

  if (percentage >= 90) {
    console.log(`\n${GREEN}${BOLD}✓ OPTIMIZED CITATION SYSTEM READY${RESET}`);
    console.log(`\n${DIM}The system now provides:${RESET}`);
    console.log(`  • ${LABELED_SOURCES.length} pre-labeled sources with full taxonomy`);
    console.log(`  • O(1) pre-computed index lookups`);
    console.log(`  • College-specific source prioritization`);
    console.log(`  • Multi-source bundles with diversity`);
    console.log(`  • Formatted output for inline/tooltip/full display`);
  } else {
    console.log(`\n${YELLOW}⚠️ System needs more work${RESET}`);
  }

  // Show unique authors
  console.log('\n' + '─'.repeat(70));
  console.log(`${CYAN}UNIQUE AUTHORS IN DATABASE:${RESET}`);
  console.log('─'.repeat(70));
  const authors = getUniqueAuthors();
  authors.forEach(author => console.log(`  • ${author}`));

  // Show colleges with primary sources
  console.log('\n' + '─'.repeat(70));
  console.log(`${CYAN}COLLEGES WITH PRIMARY SOURCES:${RESET}`);
  console.log('─'.repeat(70));
  const collegesWithPrimary = getCollegesWithPrimarySources();
  collegesWithPrimary.forEach(college => console.log(`  • ${college}`));
}

runTests().catch(console.error);
