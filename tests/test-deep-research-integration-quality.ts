/**
 * Deep Research Integration Quality Test
 *
 * Validates how the 3 integrated deep research batches enhance system capabilities:
 * 1. Show Don't Tell (19 sources) - Narrative showing techniques
 * 2. Emotional Intelligence (35 sources) - Vulnerability and authenticity
 * 3. Prose Quality & Voice (20 sources) - Sentence-level craft
 *
 * Tests the complete flow from essay input → diagnosis → citation attachment
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';
import { getSourceIndexer, resetSourceIndexer } from '../src/services/commonAppWorkshop/services/sourceIndexer';
import { LABELED_SOURCES, getLabeledSourceStats, getSourceById } from '../src/services/commonAppWorkshop/data/labeledSources';
import { getRegistryStats, getIntegratedBatches } from '../src/services/commonAppWorkshop/data/sourceRegistry';

// ============================================================================
// TEST ESSAYS - Each designed to trigger specific detection patterns
// ============================================================================

const TEST_ESSAYS = {
  // Essay with Show Don't Tell issues
  telling_heavy: `
    I learned so much from my grandmother before she passed away. She taught me
    the importance of family and hard work. I realized that life is precious and
    we should never take our loved ones for granted. This experience made me who
    I am today. I became more compassionate and caring as a result. I now understand
    the value of spending time with family.
  `,

  // Essay with Emotional Intelligence issues
  vulnerability_issues: `
    I went to Guatemala on a service trip and it opened my eyes to poverty.
    I realized how privileged I am and it was truly humbling. The children
    were so grateful for our help - I changed their lives. My heart was
    pounding as I said goodbye, tears streaming down my face. That's when
    it hit me - I had found my purpose. I was completely transformed overnight.
  `,

  // Essay with Prose Quality issues
  prose_quality_issues: `
    In today's society, it is important to note that education plays a quintessential
    role. Furthermore, my tapestry of experiences has shaped who I am. I harness
    salient people skills to connect deeply with others. This unprecedented journey
    forever changed my life. There was a moment when everything crystallized into
    clarity. I am a natural leader who embodies the epitome of dedication.
  `,

  // Essay with mixed issues across all categories
  mixed_issues: `
    Ever since I was young, I have always been passionate about helping others.
    My heart was racing as I stood before the sea of faces. I learned that hard
    work pays off and I grew as a person. The experience was life-altering and
    mind-blowing. I went there to help them but they ended up helping me.
    In that moment, I realized I was destined for greatness. My tapestry of
    experiences has made me a beacon of hope for others.
  `,

  // A better essay (should have fewer issues)
  improved_example: `
    The rice cooker clicks off at 6:47 AM. My grandmother doesn't use a timer -
    she just knows. I watch her hands, spotted and sure, as she portions out
    congee into three bowls. Mine gets extra scallions because she caught me
    sneaking them as a kid.

    "Your mother called," she says, not looking up. "Again."

    I stir my congee. The steam fogs my glasses. In the window's reflection,
    I can see the plane ticket on the counter - LAX to Taipei, one-way.
  `,
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => { passed: boolean; details: string } | Promise<{ passed: boolean; details: string }>): Promise<void> {
  try {
    const result = await fn();
    results.push({ name, ...result });
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!result.passed || result.details) {
      console.log(`   ${result.details}`);
    }
  } catch (error) {
    results.push({ name, passed: false, details: `Error: ${error}` });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error}`);
  }
}

async function runTests(): Promise<void> {
  console.log('═'.repeat(70));
  console.log('DEEP RESEARCH INTEGRATION QUALITY TEST');
  console.log('═'.repeat(70));
  console.log('');

  // ============================================================================
  // SECTION 1: Source Registry Health Check
  // ============================================================================
  console.log('─'.repeat(70));
  console.log('SECTION 1: Source Registry Health');
  console.log('─'.repeat(70));

  const stats = getLabeledSourceStats();
  const registryStats = getRegistryStats();

  console.log(`\nTotal Sources: ${stats.total}`);
  console.log(`  • Core Dean Quotes: ${stats.core}`);
  console.log(`  • Deep Research: ${stats.deepResearch}`);
  console.log(`    └─ Show Don't Tell: ${stats.byBatch.show_dont_tell || 0}`);
  console.log(`    └─ Emotional Intelligence: ${stats.byBatch.emotional_intelligence || 0}`);
  console.log(`    └─ Intellectual Depth: ${stats.byBatch.intellectual_depth || 0}`);
  console.log(`    └─ Prose Quality: ${stats.byBatch.prose_quality || 0}`);
  console.log(`\nIntegrated Batches: ${registryStats.integratedBatches}`);
  console.log('');

  await test('Has 4 integrated research batches', () => {
    const count = getIntegratedBatches().length;
    return {
      passed: count === 4,
      details: `Found ${count} integrated batches (SDT, EI, ID, PQ)`,
    };
  });

  await test('Has at least 100 deep research sources', () => {
    return {
      passed: stats.deepResearch >= 100,
      details: `Found ${stats.deepResearch} deep research sources`,
    };
  });

  await test('Show Don\'t Tell batch has ~19 sources', () => {
    const count = stats.byBatch.show_dont_tell || 0;
    return {
      passed: count >= 15 && count <= 25,
      details: `Found ${count} Show Don't Tell sources`,
    };
  });

  await test('Emotional Intelligence batch has ~45 sources', () => {
    const count = stats.byBatch.emotional_intelligence || 0;
    return {
      passed: count >= 40 && count <= 55,  // Updated: includes supplemental EI sources
      details: `Found ${count} EI sources (35 original + 10 supplemental)`,
    };
  });

  await test('Intellectual Depth batch has ~25 sources', () => {
    const count = stats.byBatch.intellectual_depth || 0;
    return {
      passed: count >= 20 && count <= 30,
      details: `Found ${count} Intellectual Depth sources`,
    };
  });

  await test('Prose Quality batch has ~20 sources', () => {
    const count = stats.byBatch.prose_quality || 0;
    return {
      passed: count >= 15 && count <= 25,
      details: `Found ${count} Prose Quality sources`,
    };
  });

  // ============================================================================
  // SECTION 2: SourceIndexer Coverage
  // ============================================================================
  console.log('');
  console.log('─'.repeat(70));
  console.log('SECTION 2: SourceIndexer Coverage');
  console.log('─'.repeat(70));

  resetSourceIndexer();
  const indexer = getSourceIndexer();
  const indexerStats = indexer.getStats();

  console.log(`\nIndexer Statistics:`);
  console.log(`  • Total Indexed: ${indexerStats.totalSources}`);
  console.log(`  • Issue Types Covered: ${indexerStats.issueTypesCovered}`);
  console.log(`  • Categories Covered: ${indexerStats.categoriesCovered}`);
  console.log('');

  await test('Indexer covers all labeled sources', () => {
    return {
      passed: indexerStats.totalSources === stats.total,
      details: `Indexed ${indexerStats.totalSources}/${stats.total}`,
    };
  });

  // Test coverage for key issue types
  const keyIssueTypes = [
    'telling_not_showing',
    'cliche_language',
    'cliche_inspirational',
    'cliche_ai_convergence',
    'cliche_narrative_arc',
    'cliche_value_signaling',
  ];

  for (const issueType of keyIssueTypes) {
    await test(`Has sources for ${issueType}`, () => {
      const sources = indexer.getForIssueType(issueType as any);
      return {
        passed: sources.length > 0,
        details: `Found ${sources.length} sources`,
      };
    });
  }

  // ============================================================================
  // SECTION 3: Cliché Detection Quality (Pattern-Based)
  // ============================================================================
  console.log('');
  console.log('─'.repeat(70));
  console.log('SECTION 3: Cliché Detection Quality');
  console.log('─'.repeat(70));
  console.log('');

  // Test each essay type
  for (const [essayType, essayText] of Object.entries(TEST_ESSAYS)) {
    console.log(`\n  Testing: ${essayType}`);
    const analysis = await semanticClicheAnalyzer.analyze(essayText, { pattern_only: true });

    console.log(`    Risk: ${analysis.overall_cliche_risk} (${analysis.cliche_risk_score}/100)`);
    console.log(`    Language clichés: ${analysis.language_cliches.length}`);
    console.log(`    Telling violations: ${analysis.telling_not_showing.length}`);
  }

  // Specific detection tests
  console.log('');

  await test('Detects telling-not-showing in telling_heavy essay', async () => {
    const analysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.telling_heavy, { pattern_only: true });
    const hasTeachingPatterns = analysis.telling_not_showing.some(t =>
      t.phrase.toLowerCase().includes('taught') ||
      t.phrase.toLowerCase().includes('learned') ||
      t.phrase.toLowerCase().includes('realized')
    );
    return {
      passed: hasTeachingPatterns && analysis.telling_not_showing.length >= 1,
      details: `Found ${analysis.telling_not_showing.length} telling violations`,
    };
  });

  await test('Detects EI issues in vulnerability essay', async () => {
    const analysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.vulnerability_issues, { pattern_only: true });
    const hasServiceCliche = analysis.language_cliches.some(c =>
      c.why_cliche.toLowerCase().includes('service') ||
      c.why_cliche.toLowerCase().includes('savior') ||
      c.phrase.toLowerCase().includes('opened my eyes')
    );
    return {
      passed: hasServiceCliche,
      details: `Found service/savior patterns: ${hasServiceCliche}`,
    };
  });

  await test('Detects prose quality issues', async () => {
    const analysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.prose_quality_issues, { pattern_only: true });
    const hasEssaySpeak = analysis.language_cliches.some(c =>
      c.phrase.toLowerCase().includes('in today\'s society') ||
      c.phrase.toLowerCase().includes('furthermore') ||
      c.phrase.toLowerCase().includes('quintessential')
    );
    return {
      passed: hasEssaySpeak,
      details: `Found essay-speak patterns: ${hasEssaySpeak}`,
    };
  });

  await test('Detects AI convergence markers', async () => {
    const analysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.prose_quality_issues, { pattern_only: true });
    const aiMarkers = analysis.language_cliches.filter(c => c.type === 'ai_convergence');
    return {
      passed: aiMarkers.length >= 2,
      details: `Found ${aiMarkers.length} AI convergence markers`,
    };
  });

  await test('Better essay has lower cliché score', async () => {
    const badAnalysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.mixed_issues, { pattern_only: true });
    const goodAnalysis = await semanticClicheAnalyzer.analyze(TEST_ESSAYS.improved_example, { pattern_only: true });
    return {
      passed: goodAnalysis.cliche_risk_score < badAnalysis.cliche_risk_score,
      details: `Good: ${goodAnalysis.cliche_risk_score}, Bad: ${badAnalysis.cliche_risk_score}`,
    };
  });

  // ============================================================================
  // SECTION 4: Source Diversity & Authority
  // ============================================================================
  console.log('');
  console.log('─'.repeat(70));
  console.log('SECTION 4: Source Diversity & Authority');
  console.log('─'.repeat(70));
  console.log('');

  // Check for key authoritative sources from each batch
  const keySourceChecks = [
    // Show Don't Tell
    { id: 'sdt_ao_mit_peterson', batch: 'Show Don\'t Tell', desc: 'MIT AO on specificity' },
    { id: 'sdt_framework_five_craft_moves', batch: 'Show Don\'t Tell', desc: 'Five craft moves framework' },

    // Emotional Intelligence
    { id: 'ei_dartmouth_ao_tmi', batch: 'EI', desc: 'Dartmouth AO on TMI vs Personal' },
    { id: 'ei_earned_vulnerability_test', batch: 'EI', desc: 'Four-part vulnerability test' },

    // Prose Quality
    { id: 'pq_ivy_rough_edges', batch: 'Prose Quality', desc: 'Authenticity over polish' },
    { id: 'pq_provost_variation', batch: 'Prose Quality', desc: 'Gary Provost sentence variation' },
    { id: 'pq_twain_lightning', batch: 'Prose Quality', desc: 'Mark Twain word choice' },
  ];

  for (const check of keySourceChecks) {
    await test(`Key source: ${check.desc} (${check.batch})`, () => {
      const source = getSourceById(check.id);
      return {
        passed: source !== undefined,
        details: source ? `Found: "${source.quote?.substring(0, 50)}..."` : 'NOT FOUND',
      };
    });
  }

  // Check category distribution
  await test('Sources cover multiple categories', () => {
    const categories = new Set(LABELED_SOURCES.map(s => s.taxonomy.primary_category));
    const categoryList = [...categories].join(', ');
    return {
      passed: categories.size >= 5,
      details: `${categories.size} categories: ${categoryList}`,
    };
  });

  // ============================================================================
  // SECTION 5: Citation Retrieval Quality
  // ============================================================================
  console.log('');
  console.log('─'.repeat(70));
  console.log('SECTION 5: Citation Retrieval Quality');
  console.log('─'.repeat(70));
  console.log('');

  await test('Can retrieve diverse sources for telling_not_showing', () => {
    const sources = indexer.getDiverseForIssue('telling_not_showing', 5);
    const uniqueAuthors = new Set(sources.map(s => s.source.author));
    return {
      passed: sources.length >= 3 && uniqueAuthors.size >= 2,
      details: `${sources.length} sources from ${uniqueAuthors.size} authors`,
    };
  });

  await test('Can retrieve top sources by relevance', () => {
    const sources = indexer.getTopForIssueType('cliche_ai_convergence', 5, 50);
    return {
      passed: sources.length >= 2,
      details: `${sources.length} high-relevance sources for AI convergence`,
    };
  });

  await test('Sources include actionable guidance', () => {
    const sources = indexer.getForIssueType('telling_not_showing');
    const withGuidance = sources.filter(s =>
      s.source.taxonomy.teaching_moment_types.includes('how_to_fix') ||
      s.source.taxonomy.teaching_moment_types.includes('before_after')
    );
    return {
      passed: withGuidance.length >= 3,
      details: `${withGuidance.length}/${sources.length} have how_to_fix guidance`,
    };
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('');
  console.log('═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('');

  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED');
    console.log('');
    console.log('Deep Research Integration Summary:');
    console.log(`  • ${stats.total} total sources available for citation`);
    console.log('  • 3 research batches fully integrated');
    console.log(`  • ${keyIssueTypes.length} key issue types covered`);
    console.log('  • Pattern detection for ~200+ cliché phrases');
    console.log('');
    console.log('System Improvements from Deep Research:');
    console.log('  1. Show Don\'t Tell: Specific techniques for narrative showing');
    console.log('  2. Emotional Intelligence: Vulnerability calibration guidance');
    console.log('  3. Prose Quality: Voice authenticity & over-editing detection');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('Failed tests:');
    for (const result of results.filter(r => !r.passed)) {
      console.log(`  • ${result.name}: ${result.details}`);
    }
    process.exit(1);
  }
}

// Run
runTests().catch(console.error);
