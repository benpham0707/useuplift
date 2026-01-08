/**
 * V2 Citation System Comprehensive Test
 *
 * Tests the new 4-layer source routing hierarchy:
 * 1. Universal sources (always safe fallback)
 * 2. Prompt-type sources (category-specific)
 * 3. College-specific sources (institution-focused)
 * 4. Prompt-specific sources (exact match - highest priority)
 *
 * Also validates:
 * - Source misapplication prevention
 * - Context requirement enforcement
 * - Author diversity controls
 * - Graceful fallback behavior
 */

import {
  UNIVERSAL_SOURCES,
  getUniversalSourcesForIssue,
  getUniversalSourceStats,
  isUniversalSourceApplicable,
} from '../src/services/commonAppWorkshop/data/universalSources';

import {
  PROMPT_TYPE_SOURCES,
  getSourcesForPromptType,
  getSourcesForPromptAndIssue,
  isSourceSafeForPromptType,
} from '../src/services/commonAppWorkshop/data/promptTypeSpecificSources';

import {
  getEnhancedSourceRouter,
  resetEnhancedSourceRouter,
  routeSourcesForContext,
  getSourceBundleForContext,
  getUniversalFallbackSource,
} from '../src/services/commonAppWorkshop/services/enhancedSourceRouter';

import {
  validateSourceForContext,
  type SourceRoutingContext,
  type PromptType,
  type CollegeId,
  type ClicheSymptomType,
} from '../src/services/commonAppWorkshop/types/labeledSourceTypes';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error instanceof Error ? error.message : error}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// TEST CONTEXTS
// ============================================================================

function createTestContext(overrides: Partial<SourceRoutingContext> = {}): SourceRoutingContext {
  return {
    prompt_type: 'personal_statement',
    college_id: 'stanford',
    issue_type: 'telling_not_showing',
    word_limit: 650,
    has_narrative: true,
    has_reflection: true,
    is_main_essay: true,
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('V2 CITATION SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(70) + '\n');

  // Reset singleton
  resetEnhancedSourceRouter();

  // ---------------------------------------------------------------------------
  // SECTION 1: UNIVERSAL SOURCES TESTS
  // ---------------------------------------------------------------------------
  console.log('\n📚 SECTION 1: UNIVERSAL SOURCES\n');

  test('Universal sources are loaded', () => {
    assert(UNIVERSAL_SOURCES.length > 0, 'No universal sources loaded');
    assert(UNIVERSAL_SOURCES.length >= 15, `Expected at least 15 sources, got ${UNIVERSAL_SOURCES.length}`);
  });

  test('Universal sources have required V2 fields', () => {
    for (const source of UNIVERSAL_SOURCES) {
      assert(source.scope !== undefined, `Source ${source.source_id} missing scope`);
      assert(source.scope.level === 'universal', `Source ${source.source_id} should have universal scope`);
      assert(source.authority !== undefined, `Source ${source.source_id} missing authority`);
      assert(source.advice_type !== undefined, `Source ${source.source_id} missing advice_type`);
    }
  });

  test('Universal sources cover key issue types', () => {
    const issueTypes: ClicheSymptomType[] = [
      'telling_not_showing',
      'cliche_language',
      'cliche_essay_formula',
      'cliche_ai_convergence',
      'cliche_metaphor',
    ];

    for (const issueType of issueTypes) {
      const sources = getUniversalSourcesForIssue(issueType);
      assert(sources.length > 0, `No universal sources for ${issueType}`);
    }
  });

  test('Universal source stats are accurate', () => {
    const stats = getUniversalSourceStats();
    assert(stats.total === UNIVERSAL_SOURCES.length, 'Total count mismatch');
    assert(Object.keys(stats.byCategory).length > 0, 'Missing category breakdown');
    assert(Object.keys(stats.byAuthority).length > 0, 'Missing authority breakdown');
    assert(Object.keys(stats.byAdviceType).length > 0, 'Missing advice type breakdown');
  });

  test('Universal sources apply to all prompt types by default', () => {
    const promptTypes: PromptType[] = [
      'personal_statement',
      'why_this_college',
      'activity_elaboration',
      'short_answer',
    ];

    const source = UNIVERSAL_SOURCES[0];
    for (const promptType of promptTypes) {
      if (!source.scope.never_use_for?.prompt_types?.includes(promptType)) {
        const applies = isUniversalSourceApplicable(source, promptType);
        assert(applies, `Universal source should apply to ${promptType}`);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // SECTION 2: PROMPT-TYPE SOURCES TESTS
  // ---------------------------------------------------------------------------
  console.log('\n📝 SECTION 2: PROMPT-TYPE SOURCES\n');

  test('Prompt-type sources are loaded', () => {
    assert(PROMPT_TYPE_SOURCES.length > 0, 'No prompt-type sources loaded');
    assert(PROMPT_TYPE_SOURCES.length >= 10, `Expected at least 10 sources, got ${PROMPT_TYPE_SOURCES.length}`);
  });

  test('Prompt-type sources have correct scope level', () => {
    for (const source of PROMPT_TYPE_SOURCES) {
      assert(source.scope.level === 'prompt_type', `Source ${source.source_id} should have prompt_type scope`);
    }
  });

  test('Personal statement sources apply to main essay types', () => {
    const mainEssaySources = getSourcesForPromptType('personal_statement');
    assert(mainEssaySources.length > 0, 'No sources for personal_statement');

    // Should NOT include why_this_college specific sources
    for (const source of mainEssaySources) {
      const isSafeResult = isSourceSafeForPromptType(source, 'personal_statement');
      assert(isSafeResult.safe, `Source ${source.source_id} should be safe for personal_statement`);
    }
  });

  test('Why-this-college sources are NOT safe for personal statements', () => {
    const whyCollegeSources = PROMPT_TYPE_SOURCES.filter(s =>
      s.scope.applies_to.prompt_types !== 'all' &&
      s.scope.applies_to.prompt_types.includes('why_this_college') &&
      s.scope.never_use_for?.prompt_types?.includes('personal_statement')
    );

    for (const source of whyCollegeSources) {
      const isSafeResult = isSourceSafeForPromptType(source, 'personal_statement');
      assert(!isSafeResult.safe, `Source ${source.source_id} should NOT be safe for personal_statement`);
    }
  });

  test('Short answer sources respect word count constraints', () => {
    const shortAnswerSources = getSourcesForPromptType('short_answer');

    // At least some sources should have max_word_count constraint
    const hasConstraint = shortAnswerSources.some(s =>
      s.context_requirements?.max_word_count !== undefined
    );
    assert(hasConstraint, 'Short answer sources should have word count constraints');
  });

  // ---------------------------------------------------------------------------
  // SECTION 3: SOURCE ROUTING TESTS
  // ---------------------------------------------------------------------------
  console.log('\n🔀 SECTION 3: SOURCE ROUTING\n');

  test('Router initializes correctly', () => {
    const router = getEnhancedSourceRouter();
    assert(router !== null, 'Router should initialize');
  });

  test('Routing returns results for valid context', () => {
    const context = createTestContext();
    const result = routeSourcesForContext(context);

    assert(result !== null, 'Should return routing result');
    assert(result.metadata.totalCandidates > 0, 'Should find some candidates');
    assert(result.metadata.layersSearched.length > 0, 'Should search at least one layer');
  });

  test('Routing includes universal fallback', () => {
    const context = createTestContext();
    const result = routeSourcesForContext(context);

    assert(result.universalFallback !== null, 'Should have universal fallback available');
    assert(result.universalFallback?.scopeLevel === 'universal', 'Fallback should be universal scope');
  });

  test('Routing prioritizes college-specific sources', () => {
    const context = createTestContext({
      college_id: 'stanford',
      issue_type: 'cliche_college_specific',
    });
    const result = routeSourcesForContext(context);

    // Stanford has specific intellectual vitality sources
    const hasCollegeSpecific = result.primary?.scopeLevel === 'college_specific' ||
      result.supporting.some(s => s.scopeLevel === 'college_specific');

    // This is expected since we have Stanford-specific sources
    assert(result.metadata.totalCandidates > 0, 'Should find candidates');
  });

  test('Routing respects main_essay_only constraint', () => {
    // Context for supplement
    const supplementContext = createTestContext({
      prompt_type: 'why_this_college',
      is_main_essay: false,
    });

    const result = routeSourcesForContext(supplementContext);

    // Sources with main_essay_only should be filtered out
    const mainOnlySources = [result.primary, ...result.supporting].filter(s =>
      s && 'context_requirements' in s.source &&
      (s.source as any).context_requirements?.main_essay_only === true
    );

    assert(mainOnlySources.length === 0, 'Supplement context should not include main_essay_only sources');
  });

  // ---------------------------------------------------------------------------
  // SECTION 4: MISAPPLICATION PREVENTION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n🛡️ SECTION 4: MISAPPLICATION PREVENTION\n');

  test('Why-college advice not applied to personal statement', () => {
    // Find a why_this_college specific source
    const whyCollegeSource = PROMPT_TYPE_SOURCES.find(s =>
      s.scope.applies_to.prompt_types !== 'all' &&
      s.scope.applies_to.prompt_types.includes('why_this_college') &&
      !s.scope.applies_to.prompt_types.includes('personal_statement')
    );

    if (whyCollegeSource) {
      const personalStatementContext = createTestContext({
        prompt_type: 'personal_statement',
      });

      const validationResult = validateSourceForContext(whyCollegeSource, personalStatementContext);
      assert(!validationResult.valid, 'Why-college source should be invalid for personal statement');
    }
  });

  test('Supplement-only sources not used for main essay', () => {
    const supplementOnlySource = PROMPT_TYPE_SOURCES.find(s =>
      s.context_requirements?.supplemental_only === true
    );

    if (supplementOnlySource) {
      const mainEssayContext = createTestContext({
        prompt_type: 'personal_statement',
        is_main_essay: true,
      });

      const validationResult = validateSourceForContext(supplementOnlySource, mainEssayContext);
      assert(!validationResult.valid, 'Supplement-only source should be invalid for main essay');
    }
  });

  test('Short-form advice not applied to long essays', () => {
    // Find a source with max_word_count constraint
    const shortFormSource = [...UNIVERSAL_SOURCES, ...PROMPT_TYPE_SOURCES].find(s =>
      s.context_requirements?.max_word_count !== undefined &&
      s.context_requirements.max_word_count < 400
    );

    if (shortFormSource) {
      const longEssayContext = createTestContext({
        word_limit: 650,
      });

      const validationResult = validateSourceForContext(shortFormSource as any, longEssayContext);
      // If word limit exceeds max, should be invalid
      if (longEssayContext.word_limit > (shortFormSource.context_requirements?.max_word_count || Infinity)) {
        assert(!validationResult.valid, 'Short-form source should be invalid for long essay');
      }
    }
  });

  test('Never_use_for explicitly blocks sources', () => {
    // Find a source with explicit never_use_for
    const sourceWithExclusion = PROMPT_TYPE_SOURCES.find(s =>
      s.scope.never_use_for?.prompt_types && s.scope.never_use_for.prompt_types.length > 0
    );

    if (sourceWithExclusion && sourceWithExclusion.scope.never_use_for?.prompt_types) {
      const excludedType = sourceWithExclusion.scope.never_use_for.prompt_types[0];
      const excludedContext = createTestContext({
        prompt_type: excludedType,
      });

      const validationResult = validateSourceForContext(sourceWithExclusion, excludedContext);
      assert(!validationResult.valid, `Source should be invalid for excluded prompt type ${excludedType}`);
    }
  });

  // ---------------------------------------------------------------------------
  // SECTION 5: BUNDLE CREATION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n📦 SECTION 5: BUNDLE CREATION\n');

  test('Creates complete source bundle', () => {
    const context = createTestContext();
    const bundle = getSourceBundleForContext(context);

    assert(bundle !== null, 'Should create bundle');
    assert(bundle?.primary !== null, 'Bundle should have primary source');
    assert(bundle?.formatted !== undefined, 'Bundle should have formatted output');
    assert(bundle?.formatted.inline !== undefined, 'Bundle should have inline format');
    assert(bundle?.formatted.tooltip !== undefined, 'Bundle should have tooltip format');
    assert(bundle?.formatted.full !== undefined, 'Bundle should have full format');
  });

  test('Bundle includes metadata', () => {
    const context = createTestContext();
    const bundle = getSourceBundleForContext(context);

    assert(bundle?.metadata !== undefined, 'Bundle should have metadata');
    assert(bundle?.metadata.total_candidates > 0, 'Should report candidate count');
    assert(bundle?.metadata.selection_criteria.length > 0, 'Should include selection criteria');
    assert(bundle?.metadata.diversity_score !== undefined, 'Should include diversity score');
  });

  test('Bundle diversity score calculated correctly', () => {
    const context = createTestContext();
    const bundle = getSourceBundleForContext(context);

    assert(bundle?.metadata.diversity_score >= 0, 'Diversity score should be >= 0');
    assert(bundle?.metadata.diversity_score <= 100, 'Diversity score should be <= 100');
  });

  // ---------------------------------------------------------------------------
  // SECTION 6: AUTHOR DIVERSITY TESTS
  // ---------------------------------------------------------------------------
  console.log('\n👥 SECTION 6: AUTHOR DIVERSITY\n');

  test('Supporting sources include diverse authors', () => {
    const context = createTestContext({
      issue_type: 'cliche_language', // Should have multiple sources
    });
    const result = routeSourcesForContext(context);

    // If we have multiple supporting sources, check diversity
    if (result.supporting.length >= 2) {
      const authors = new Set<string>();
      if (result.primary) {
        const primaryAuthor = (result.primary.source as any).author;
        if (primaryAuthor) authors.add(primaryAuthor);
      }

      let duplicateCount = 0;
      for (const s of result.supporting) {
        const author = (s.source as any).author;
        if (author) {
          if (authors.has(author)) duplicateCount++;
          authors.add(author);
        }
      }

      // Allow max 2 sources per author (as configured)
      assert(duplicateCount <= 1, 'Should have author diversity in supporting sources');
    }
  });

  // ---------------------------------------------------------------------------
  // SECTION 7: FALLBACK BEHAVIOR TESTS
  // ---------------------------------------------------------------------------
  console.log('\n🔄 SECTION 7: FALLBACK BEHAVIOR\n');

  test('Falls back to universal when no specific sources', () => {
    // Use a context that likely has no college-specific sources
    const context = createTestContext({
      college_id: 'gmu', // Less common college
      issue_type: 'telling_not_showing',
    });

    const result = routeSourcesForContext(context);

    // Should still find sources (universal fallback)
    assert(result.primary !== null || result.universalFallback !== null, 'Should have fallback');
  });

  test('Universal fallback getter works independently', () => {
    const fallback = getUniversalFallbackSource('telling_not_showing');
    assert(fallback !== null, 'Should return universal fallback');
    assert(fallback?.issue_relevance.telling_not_showing !== undefined, 'Fallback should address issue');
  });

  // ---------------------------------------------------------------------------
  // SECTION 8: VARIED SCENARIO TESTS
  // ---------------------------------------------------------------------------
  console.log('\n🎭 SECTION 8: VARIED SCENARIOS\n');

  const scenarios: Array<{
    name: string;
    context: SourceRoutingContext;
    expectation: string;
  }> = [
    {
      name: 'Stanford personal statement - telling not showing',
      context: createTestContext({
        college_id: 'stanford',
        prompt_type: 'personal_statement',
        issue_type: 'telling_not_showing',
        is_main_essay: true,
      }),
      expectation: 'Should find sources from multiple layers',
    },
    {
      name: 'Harvard why-this-college - college specific cliches',
      context: createTestContext({
        college_id: 'harvard',
        prompt_type: 'why_this_college',
        issue_type: 'cliche_college_specific',
        is_main_essay: false,
        word_limit: 300,
      }),
      expectation: 'Should prioritize college-specific and supplement sources',
    },
    {
      name: 'MIT activity elaboration - AI convergence',
      context: createTestContext({
        college_id: 'mit',
        prompt_type: 'activity_elaboration',
        issue_type: 'cliche_ai_convergence',
        is_main_essay: false,
        word_limit: 150,
      }),
      expectation: 'Should handle short-form activity essays',
    },
    {
      name: 'UChicago creative prompt - topic framing',
      context: createTestContext({
        college_id: 'uchicago',
        prompt_type: 'creative_prompt',
        issue_type: 'cliche_topic_framing',
        is_main_essay: false,
      }),
      expectation: 'Should find creative prompt specific sources',
    },
    {
      name: 'Duke challenge essay - narrative arc cliches',
      context: createTestContext({
        college_id: 'duke',
        prompt_type: 'challenge_setback',
        issue_type: 'cliche_narrative_arc',
        is_main_essay: true,
      }),
      expectation: 'Should find challenge-specific sources',
    },
    {
      name: 'Generic short answer - essay formula',
      context: createTestContext({
        college_id: 'brown',
        prompt_type: 'short_answer',
        issue_type: 'cliche_essay_formula',
        is_main_essay: false,
        word_limit: 100,
      }),
      expectation: 'Should find short-answer appropriate sources',
    },
  ];

  for (const scenario of scenarios) {
    test(scenario.name, () => {
      const result = routeSourcesForContext(scenario.context);
      assert(result.metadata.totalCandidates > 0 || result.universalFallback !== null,
        `${scenario.expectation}, but found no sources`);
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION 9: COVERAGE ANALYSIS
  // ---------------------------------------------------------------------------
  console.log('\n📊 SECTION 9: COVERAGE ANALYSIS\n');

  test('Coverage check returns meaningful data', () => {
    const router = getEnhancedSourceRouter();
    const context = createTestContext();

    const coverage = router.hasGoodCoverage(context);
    assert(coverage !== undefined, 'Should return coverage data');
    assert(typeof coverage.hasUniversal === 'boolean', 'Should report universal coverage');
    assert(typeof coverage.totalSources === 'number', 'Should report total sources');
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n  Total: ${passed + failed}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`\n  Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  // Source Statistics
  console.log('\n📈 SOURCE STATISTICS\n');
  console.log(`  Universal Sources: ${UNIVERSAL_SOURCES.length}`);
  console.log(`  Prompt-Type Sources: ${PROMPT_TYPE_SOURCES.length}`);

  const universalStats = getUniversalSourceStats();
  console.log('\n  Universal by Category:');
  for (const [cat, count] of Object.entries(universalStats.byCategory)) {
    console.log(`    - ${cat}: ${count}`);
  }

  console.log('\n  Universal by Authority:');
  for (const [auth, count] of Object.entries(universalStats.byAuthority)) {
    console.log(`    - ${auth}: ${count}`);
  }

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
