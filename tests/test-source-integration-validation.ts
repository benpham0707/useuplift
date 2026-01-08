/**
 * Source Integration Validation Test
 *
 * Validates that deep research sources are properly integrated and accessible
 * through the citation system via the centralized sourceRegistry.
 *
 * This test verifies:
 * 1. The source registry properly aggregates all batches
 * 2. LABELED_SOURCES includes all registered sources
 * 3. SourceIndexer can find and query all sources
 * 4. The citation flow works end-to-end
 */

import {
  LABELED_SOURCES,
  getSourceById,
  getSourcesByAuthor,
  getSourceCountByCategory,
  getUniqueAuthors,
  getLabeledSourceStats,
  validateLabeledSources,
} from '../src/services/commonAppWorkshop/data/labeledSources';

import {
  getSourceIndexer,
  resetSourceIndexer,
} from '../src/services/commonAppWorkshop/services/sourceIndexer';

import {
  ALL_DEEP_RESEARCH_SOURCES,
  getRegistryStats,
  validateRegistry,
  getIntegratedBatches,
  getPendingBatches,
  RESEARCH_BATCHES,
} from '../src/services/commonAppWorkshop/data/sourceRegistry';

import { ALL_SHOW_DONT_TELL_SOURCES } from '../src/services/commonAppWorkshop/data/showDontTellSources';
import { ALL_EMOTIONAL_INTELLIGENCE_SOURCES } from '../src/services/commonAppWorkshop/data/emotionalIntelligenceSources';

// Test tracking
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => boolean): void {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passCount++;
    } else {
      console.log(`❌ ${name}`);
      failCount++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error}`);
    failCount++;
  }
}

async function runTests(): Promise<void> {
  console.log('='.repeat(70));
  console.log('SOURCE INTEGRATION VALIDATION TEST');
  console.log('='.repeat(70));
  console.log('');

  // ============================================================================
  // SECTION 1: Basic Integration Checks
  // ============================================================================
  console.log('--- Section 1: Basic Integration ---');

  test('LABELED_SOURCES contains more than original 15 dean quotes', () => {
    return LABELED_SOURCES.length > 15;
  });

  test('LABELED_SOURCES includes Show Don\'t Tell sources', () => {
    const sdtSourceId = 'sdt_ao_yale_landesman';
    return LABELED_SOURCES.some(s => s.source_id === sdtSourceId);
  });

  test('LABELED_SOURCES includes Emotional Intelligence sources', () => {
    const eiSourceId = 'ei_ivyboost_navigation';
    return LABELED_SOURCES.some(s => s.source_id === eiSourceId);
  });

  test('All Show Don\'t Tell sources are included', () => {
    const sdtIds = ALL_SHOW_DONT_TELL_SOURCES.map(s => s.source_id);
    const includedCount = sdtIds.filter(id =>
      LABELED_SOURCES.some(s => s.source_id === id)
    ).length;
    return includedCount === ALL_SHOW_DONT_TELL_SOURCES.length;
  });

  test('All Emotional Intelligence sources are included', () => {
    const eiIds = ALL_EMOTIONAL_INTELLIGENCE_SOURCES.map(s => s.source_id);
    const includedCount = eiIds.filter(id =>
      LABELED_SOURCES.some(s => s.source_id === id)
    ).length;
    return includedCount === ALL_EMOTIONAL_INTELLIGENCE_SOURCES.length;
  });

  // ============================================================================
  // SECTION 2: Registry & Stats Verification
  // ============================================================================
  console.log('');
  console.log('--- Section 2: Registry & Stats Verification ---');

  const stats = getLabeledSourceStats();
  const registryStats = getRegistryStats();
  console.log(`\nSource Statistics:`);
  console.log(`  Total sources: ${stats.total}`);
  console.log(`  Core dean quotes: ${stats.core}`);
  console.log(`  Deep research sources: ${stats.deepResearch}`);
  console.log(`  By batch: ${JSON.stringify(stats.byBatch)}`);
  console.log(`\nRegistry Statistics:`);
  console.log(`  Integrated batches: ${registryStats.integratedBatches}`);
  console.log(`  Pending batches: ${registryStats.pendingBatches}`);
  console.log('');

  test('Stats total matches array length', () => {
    return stats.total === LABELED_SOURCES.length;
  });

  test('Stats components sum to total', () => {
    return (stats.core + stats.deepResearch) === stats.total;
  });

  test('Has at least 65 total sources', () => {
    return stats.total >= 65;
  });

  test('Registry deep research sources match LABELED_SOURCES count', () => {
    return ALL_DEEP_RESEARCH_SOURCES.length === stats.deepResearch;
  });

  test('All integrated batches have sources', () => {
    return getIntegratedBatches().every(batch => batch.sourceCount > 0);
  });

  // ============================================================================
  // SECTION 3: SourceIndexer Integration
  // ============================================================================
  console.log('');
  console.log('--- Section 3: SourceIndexer Integration ---');

  // Reset indexer to ensure fresh build with new sources
  resetSourceIndexer();
  const indexer = getSourceIndexer();
  const indexerStats = indexer.getStats();

  console.log(`\nSourceIndexer Statistics:`);
  console.log(`  Total indexed: ${indexerStats.totalSources}`);
  console.log(`  Colleges with primary sources: ${indexerStats.collegesWithPrimarySources}`);
  console.log(`  Issue types covered: ${indexerStats.issueTypesCovered}`);
  console.log(`  Categories covered: ${indexerStats.categoriesCovered}`);
  console.log(`  Build time: ${indexerStats.buildTimeMs}ms`);
  console.log('');

  test('SourceIndexer indexes all sources', () => {
    return indexerStats.totalSources === LABELED_SOURCES.length;
  });

  test('SourceIndexer covers telling_not_showing issue', () => {
    const sources = indexer.getForIssueType('telling_not_showing');
    return sources.length > 0;
  });

  test('SourceIndexer has Show Don\'t Tell sources for telling_not_showing', () => {
    const sources = indexer.getForIssueType('telling_not_showing');
    const hasSDT = sources.some(s => s.source.source_id.startsWith('sdt_'));
    return hasSDT;
  });

  test('SourceIndexer has EI sources for cliche_inspirational', () => {
    const sources = indexer.getForIssueType('cliche_inspirational');
    const hasEI = sources.some(s => s.source.source_id.startsWith('ei_'));
    return hasEI;
  });

  // ============================================================================
  // SECTION 4: Source Quality Checks
  // ============================================================================
  console.log('');
  console.log('--- Section 4: Source Quality Checks ---');

  test('All sources have valid source_id', () => {
    return LABELED_SOURCES.every(s => s.source_id && s.source_id.length > 0);
  });

  test('All sources have quote or finding', () => {
    return LABELED_SOURCES.every(s => s.quote || s.finding);
  });

  test('All sources have taxonomy', () => {
    return LABELED_SOURCES.every(s => s.taxonomy && s.taxonomy.primary_category);
  });

  test('All sources have issue_relevance', () => {
    return LABELED_SOURCES.every(s => s.issue_relevance && Object.keys(s.issue_relevance).length > 0);
  });

  test('No duplicate source_ids', () => {
    const ids = LABELED_SOURCES.map(s => s.source_id);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  });

  // ============================================================================
  // SECTION 5: Query Verification (Simulating Citation Flow)
  // ============================================================================
  console.log('');
  console.log('--- Section 5: Citation Flow Simulation ---');

  // Simulate what happens when the system needs citations for an issue

  test('Can get top sources for telling_not_showing', () => {
    const topSources = indexer.getTopForIssueType('telling_not_showing', 5, 40);
    return topSources.length >= 3;
  });

  test('Can get diverse sources for cliche_language', () => {
    const diverseSources = indexer.getDiverseForIssue('cliche_language', 3);
    const authors = new Set(diverseSources.map(s => s.source.author));
    return authors.size >= 2; // At least 2 different authors
  });

  test('Can find sources by category (showing_vs_telling)', () => {
    const categorySources = indexer.getForCategory('showing_vs_telling');
    return categorySources.length > 0;
  });

  test('Can find sources by category (vulnerability)', () => {
    const categorySources = indexer.getForCategory('vulnerability');
    return categorySources.length > 0;
  });

  test('Coverage report includes all expected issue types', () => {
    const coverage = indexer.getCoverageReport();
    const expectedTypes = [
      'telling_not_showing',
      'cliche_language',
      'cliche_inspirational',
      'cliche_narrative_arc',
      'cliche_ai_convergence',
    ];
    return expectedTypes.every(type => coverage.has(type as any));
  });

  // ============================================================================
  // SECTION 6: Deep Research Source Accessibility
  // ============================================================================
  console.log('');
  console.log('--- Section 6: Deep Research Source Accessibility ---');

  // Verify specific high-value sources are accessible
  const keySourceIds = [
    'sdt_ao_mit_peterson',        // MIT's Mr. Vu example
    'sdt_framework_five_craft_moves', // 5 craft moves framework
    'sdt_neuro_mirror_neurons',    // Neuroscience of showing
    'ei_dartmouth_ao_tmi',         // TMI vs Personal
    'ei_earned_vulnerability_test', // 4-part vulnerability test
    'ei_neuro_oxytocin',           // Oxytocin research
  ];

  for (const sourceId of keySourceIds) {
    test(`Key source accessible: ${sourceId}`, () => {
      const source = getSourceById(sourceId);
      return source !== undefined;
    });
  }

  // ============================================================================
  // SECTION 7: Registry Validation
  // ============================================================================
  console.log('');
  console.log('--- Section 7: Registry Validation ---');

  const registryValidation = validateRegistry();
  const labeledValidation = validateLabeledSources();

  test('Registry validation passes', () => {
    return registryValidation.valid;
  });

  test('No duplicate source IDs in registry', () => {
    return registryValidation.duplicateIds.length === 0;
  });

  test('LABELED_SOURCES validation passes', () => {
    return labeledValidation.valid;
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nTotal Tests: ${passCount + failCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('');

  if (failCount === 0) {
    console.log('✅ ALL TESTS PASSED - Source registry is properly integrated!');
    console.log('');
    console.log('Sources available through SourceIndexer:');
    console.log(`  - ${stats.core} core dean quotes`);
    console.log(`  - ${stats.deepResearch} deep research sources`);
    for (const [batchId, count] of Object.entries(stats.byBatch)) {
      console.log(`    └─ ${batchId}: ${count} sources`);
    }
    console.log('');
    console.log(`Total: ${stats.total} sources`);
    console.log('');
    console.log('Research Batches Status:');
    console.log(`  Integrated: ${registryStats.integratedBatches}`);
    console.log(`  Pending: ${registryStats.pendingBatches}`);
    console.log('');
    console.log('Pending batches to implement:');
    for (const batch of getPendingBatches()) {
      console.log(`  - Prompt ${batch.perplexityPromptNumber}: ${batch.name}`);
    }
  } else {
    console.log('❌ SOME TESTS FAILED - Review integration');
    process.exit(1);
  }
}

// Run
runTests().catch(console.error);
