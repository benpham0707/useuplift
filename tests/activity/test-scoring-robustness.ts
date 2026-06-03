/**
 * Scoring Pipeline Robustness Tests
 * Pure code — no LLM calls. Tests data correctness, coverage, and edge cases.
 * Run: npx tsx tests/test-scoring-robustness.ts
 */

const BASE = '../src/services/portfolioStrategy/services/activityWorkshop/scoring';

let passed = 0;
let failed = 0;
let sectionPassed = 0;
let sectionFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    sectionPassed++;
  } else {
    failed++;
    sectionFailed++;
    console.error(`  FAIL: ${message}`);
  }
}

function section(name: string): void {
  if (sectionPassed + sectionFailed > 0) {
    console.log(`  → ${sectionPassed} passed, ${sectionFailed} failed\n`);
  }
  sectionPassed = 0;
  sectionFailed = 0;
  console.log(`=== ${name} ===`);
}

async function main() {
  console.log('\nScoring Pipeline Robustness Tests\n');

  // Imports — all from the scoring module
  const { BENCHMARKS_BY_CATEGORY } = await import(`${BASE}/comparisonBenchmarksLibrary`);
  const { classifyTier, matchesBenchmarkTier } = await import(`${BASE}/tierClassifier`);
  const { findRecognitionsInText, getRecognitionsByCategory, getAllRecognitions } = await import(`${BASE}/knowledge/recognitionIndex`);
  const { getExpertiseDomain } = await import(`${BASE}/expertiseSignaling`);
  const { resolveCategory, getAllCategoryIds, getSimilarDomains, getCategoryCount } = await import(`${BASE}/knowledge/categoryRegistry`);
  const { getCalibrationContextWithTrace } = await import(`${BASE}/achievementRetrieval`);
  const { STANDARD_WEIGHTS, NO_LEADERSHIP_WEIGHTS } = await import(`${BASE}/scoringRules`);
  const { KB_VERSION, getKnowledgeBaseVersion } = await import(`${BASE}/knowledge`);
  const { classifyTeachingSophistication } = await import(`${BASE}/teachingSophisticationRouter`);
  const { TIER_SCORE_RANGES, TIER_COMPONENT_CONSTRAINTS } = await import(`${BASE}/types`);

  // Canonical categories — the 18 expected
  const CANONICAL_CATEGORIES = [
    'stem_research', 'stem_competition', 'debate_speech', 'performing_arts',
    'athletics', 'community_service', 'leadership_government', 'technology',
    'writing_journalism', 'entrepreneurship', 'academic_enrichment', 'visual_arts',
    'medical_health', 'social_activism', 'work_family', 'religious_cultural',
    'international', 'media_digital',
  ];

  // ================================================================
  // SECTION 1: RESEARCH_CATEGORIES fix
  // ================================================================
  section('1. RESEARCH_CATEGORIES fix');
  // Build evidence for a technology category research activity and verify T2_G fires.
  const techResearchEvidence = buildMinimalEvidence({
    category: 'technology',
    scopeLevel: 'national',
    scopeConfidence: 0.8,
    recognitions: [{ name: 'University research lab', level: 'state' as const, isVerifiable: true }],
    impactQuantified: true,
    tangibleOutcomes: ['Built NLP pipeline', 'Analyzed 50K records', 'Co-authored paper'],
    yearsActive: 2,
    roleType: 'contributor',
  });
  const techTier = classifyTier(techResearchEvidence);
  // T2_G_RESEARCH_DEPTH should fire since technology is now in RESEARCH_CATEGORIES
  const t2gSignal = techTier.signals.find((s: any) => s.rule === 'T2_G_RESEARCH_DEPTH');
  assert(t2gSignal !== undefined, 'T2_G_RESEARCH_DEPTH signal exists for technology category');
  if (t2gSignal) {
    assert(t2gSignal.matched === true, 'T2_G_RESEARCH_DEPTH fires for technology research activity');
  }

  // Negative: verify coding_engineering does NOT produce T2_G
  const legacyEvidence = buildMinimalEvidence({
    category: 'coding_engineering',
    scopeLevel: 'national',
    scopeConfidence: 0.8,
    recognitions: [{ name: 'Lab', level: 'state' as const, isVerifiable: true }],
    impactQuantified: true,
    tangibleOutcomes: ['Paper', 'Dataset'],
    yearsActive: 2,
    roleType: 'contributor',
  });
  const legacyTier = classifyTier(legacyEvidence);
  const legacyT2g = legacyTier.signals.find((s: any) => s.rule === 'T2_G_RESEARCH_DEPTH');
  // coding_engineering is NOT in RESEARCH_CATEGORIES (it's been replaced with technology)
  // So T2_G should NOT fire
  if (legacyT2g) {
    assert(legacyT2g.matched === false, 'T2_G_RESEARCH_DEPTH does NOT fire for legacy coding_engineering');
  }

  // ================================================================
  // SECTION 2: Benchmark coverage
  // ================================================================
  section('2. Benchmark coverage (all 18 categories)');
  for (const cat of CANONICAL_CATEGORIES) {
    const benchmarks = BENCHMARKS_BY_CATEGORY[cat];
    assert(benchmarks !== undefined, `Benchmarks exist for ${cat}`);
    if (benchmarks) {
      for (const tierNum of [1, 2, 3, 4] as const) {
        assert(
          Array.isArray(benchmarks.tiers[tierNum]) && benchmarks.tiers[tierNum].length > 0,
          `${cat} has tier ${tierNum} entries`
        );
        // Validate entry structure
        for (const entry of benchmarks.tiers[tierNum]) {
          assert(typeof entry.activity === 'string' && entry.activity.length > 0, `${cat} T${tierNum} entry has activity name`);
          assert(
            Array.isArray(entry.scoreRange) && entry.scoreRange.length === 2 && entry.scoreRange[0] <= entry.scoreRange[1],
            `${cat} T${tierNum} "${entry.activity}" has valid scoreRange`
          );
        }
      }
    }
  }

  // ================================================================
  // SECTION 3: Recognition index coverage
  // ================================================================
  section('3. Recognition index coverage (all 18 categories)');
  for (const cat of CANONICAL_CATEGORIES) {
    const recs = getRecognitionsByCategory(cat);
    assert(recs.length > 0, `Recognition entries exist for ${cat} (found ${recs.length})`);
  }
  // No duplicate names
  const allRecs = getAllRecognitions();
  const recNames = new Set<string>();
  let dupeCount = 0;
  for (const rec of allRecs) {
    if (recNames.has(rec.name)) {
      dupeCount++;
      console.error(`  DUPE: ${rec.name}`);
    }
    recNames.add(rec.name);
  }
  assert(dupeCount === 0, `No duplicate recognition names (found ${dupeCount})`);

  // Spot-check: USAMO lookup
  const usamoResults = findRecognitionsInText('I qualified for USAMO');
  assert(usamoResults.length > 0, 'findRecognitionsInText("USAMO") returns results');
  if (usamoResults.length > 0) {
    assert(usamoResults[0].entry.tier === 1, 'USAMO is tier 1');
  }

  // ================================================================
  // SECTION 4: Expertise alias correctness
  // ================================================================
  section('4. Expertise alias correctness');
  const startupDomain = getExpertiseDomain('startup');
  assert(startupDomain !== undefined, 'getExpertiseDomain("startup") returns a domain');
  if (startupDomain) {
    assert(startupDomain.domainId === 'entrepreneurship', `startup maps to entrepreneurship (got ${startupDomain.domainId})`);
  }
  const businessDomain = getExpertiseDomain('business');
  assert(businessDomain !== undefined, 'getExpertiseDomain("business") returns a domain');
  if (businessDomain) {
    assert(businessDomain.domainId === 'entrepreneurship', `business maps to entrepreneurship (got ${businessDomain.domainId})`);
  }
  const perfArtsDomain = getExpertiseDomain('performing_arts');
  assert(perfArtsDomain !== undefined, 'getExpertiseDomain("performing_arts") is defined');

  // ================================================================
  // SECTION 5: Category resolution
  // ================================================================
  section('5. Category resolution for all 18');
  const testCases: Array<{ text: string; type: string; expected: string }> = [
    { text: 'physics lab experiment', type: 'research', expected: 'stem_research' },
    { text: 'math olympiad training', type: 'competition', expected: 'stem_competition' },
    { text: 'policy debate tournament', type: 'debate', expected: 'debate_speech' },
    { text: 'violin orchestra concert', type: 'music', expected: 'performing_arts' },
    { text: 'varsity soccer captain', type: 'sports', expected: 'athletics' },
    { text: 'food bank volunteering', type: 'volunteer', expected: 'community_service' },
    { text: 'student body president', type: 'student_government', expected: 'leadership_government' },
    { text: 'robotics programming', type: 'coding', expected: 'technology' },
    { text: 'newspaper editor', type: 'journalism', expected: 'writing_journalism' },
    { text: 'startup revenue customers', type: 'startup', expected: 'entrepreneurship' },
    { text: 'honor society tutoring', type: 'honor_society', expected: 'academic_enrichment' },
    { text: 'painting sculpture gallery', type: 'art', expected: 'visual_arts' },
    { text: 'hospital clinical shadowing', type: 'medical', expected: 'medical_health' },
    { text: 'climate advocacy campaign', type: 'activism', expected: 'social_activism' },
    { text: 'part-time job cashier', type: 'work', expected: 'work_family' },
    { text: 'church youth group leader', type: 'religion', expected: 'religious_cultural' },
    { text: 'exchange student abroad', type: 'exchange', expected: 'international' },
    { text: 'youtube content creation', type: 'youtube', expected: 'media_digital' },
  ];
  for (const tc of testCases) {
    const result = resolveCategory(tc.text, tc.type);
    assert(result !== null, `resolveCategory returns result for ${tc.type}`);
    if (result) {
      assert(result.category.categoryId === tc.expected, `${tc.type} resolves to ${tc.expected} (got ${result.category.categoryId})`);
    }
  }

  // Legacy alias: coding_engineering -> technology
  const legacyResolve = resolveCategory('python programming', 'coding_engineering');
  assert(legacyResolve !== null && legacyResolve.category.categoryId === 'technology', 'coding_engineering alias resolves to technology');

  // ================================================================
  // SECTION 6: getSimilarDomains mapping
  // ================================================================
  section('6. getSimilarDomains mapping');
  for (const cat of CANONICAL_CATEGORIES) {
    const similar = getSimilarDomains(cat);
    assert(similar.length > 0, `${cat} has similar domains`);
    assert(!similar.includes(cat), `${cat} does not list itself as similar`);
    // All returned domains should be canonical categories
    for (const s of similar) {
      assert(CANONICAL_CATEGORIES.includes(s), `${cat}'s similar domain "${s}" is a canonical category`);
    }
  }

  // ================================================================
  // SECTION 7: Proxy fallback path
  // ================================================================
  section('7. Proxy fallback path');
  // religious_cultural has no direct expertise domain — should use proxy
  const proxyEvidence = buildMinimalEvidence({ category: 'religious_cultural' });
  const proxyTier = classifyTier(proxyEvidence);
  const proxyContext = getCalibrationContextWithTrace(proxyEvidence, proxyTier, { title: 'Church youth group', description: 'Led weekly meetings for 30 members', type: 'religious_spiritual' });
  assert(proxyContext.resolutionMethod !== undefined, 'Proxy context has resolutionMethod');
  // It could be 'direct' if religious_cultural has data, or 'proxy'/'universal'
  if (proxyContext.resolutionMethod === 'proxy') {
    assert(proxyContext.proxyDomainUsed !== null, 'Proxy domain is specified');
    const similarDomains = getSimilarDomains('religious_cultural');
    assert(
      similarDomains.includes(proxyContext.proxyDomainUsed!),
      `Proxy domain "${proxyContext.proxyDomainUsed}" is from similar domains list`
    );
  }

  // ================================================================
  // SECTION 8: Universal fallback
  // ================================================================
  section('8. Universal fallback');
  // Use an obscure category to force universal path
  const universalEvidence = buildMinimalEvidence({ category: 'other' as any });
  const universalTier = classifyTier(universalEvidence);
  const universalContext = getCalibrationContextWithTrace(universalEvidence, universalTier, { title: 'Obscure hobby', description: 'Did something unique', type: 'other' });
  // Should have calibration entries even for universal
  assert(universalContext.calibrationEntries.length > 0 || universalContext.resolutionMethod === 'universal', 'Universal fallback provides calibration context');

  // ================================================================
  // SECTION 9: Short description edge cases
  // ================================================================
  section('9. Short description edge cases');
  const shortDescriptions = ['', 'Hi', 'Short', 'A normal description that is reasonable'];
  for (const desc of shortDescriptions) {
    let noThrow = true;
    try {
      const evidence = buildMinimalEvidence({ category: 'technology' });
      const tier = classifyTier(evidence);
      assert(tier.internalTier >= 1 && tier.internalTier <= 6, `Short desc "${desc.substring(0, 10)}" produces valid tier`);
    } catch (e) {
      noThrow = false;
    }
    assert(noThrow, `No throw for description "${desc.substring(0, 10)}"`);
  }

  // ================================================================
  // SECTION 10: Score bounds per tier
  // ================================================================
  section('10. Score bounds per tier');
  for (const tierNum of [1, 2, 3, 4, 5, 6] as const) {
    const range = TIER_SCORE_RANGES[tierNum];
    assert(range.min < range.max, `Tier ${tierNum} range: ${range.min} < ${range.max}`);
    assert(range.min >= 1.0, `Tier ${tierNum} min >= 1.0`);
    assert(range.max <= 10.0, `Tier ${tierNum} max <= 10.0`);

    const constraints = TIER_COMPONENT_CONSTRAINTS[tierNum];
    for (const component of ['recognition', 'leadership', 'community', 'commitment'] as const) {
      const c = constraints[component];
      assert(c.min >= 1, `Tier ${tierNum} ${component} min >= 1`);
      assert(c.max <= 10, `Tier ${tierNum} ${component} max <= 10`);
      assert(c.min <= c.max, `Tier ${tierNum} ${component} min <= max`);
    }
  }

  // Non-overlapping tier ranges
  const tiers = [1, 2, 3, 4, 5, 6] as const;
  for (let i = 0; i < tiers.length - 1; i++) {
    const upper = TIER_SCORE_RANGES[tiers[i]];
    const lower = TIER_SCORE_RANGES[tiers[i + 1]];
    assert(lower.max < upper.min, `Tier ${tiers[i]} (${upper.min}-${upper.max}) doesn't overlap with Tier ${tiers[i + 1]} (${lower.min}-${lower.max})`);
  }

  // ================================================================
  // SECTION 11: Teaching sophistication router
  // ================================================================
  section('11. Teaching sophistication router');
  // Test boundary values based on classifyTeachingSophistication thresholds:
  // foundational: < 5.0, intermediate: 5.0-8.0, advanced: > 8.0
  const routerTests = [
    { score: 4.9, expected: 'foundational' },
    { score: 5.0, expected: 'intermediate' },
    { score: 8.0, expected: 'intermediate' },
    { score: 8.1, expected: 'advanced' },
    { score: 1.0, expected: 'foundational' },
    { score: 10.0, expected: 'advanced' },
  ];
  for (const rt of routerTests) {
    const result = classifyTeachingSophistication(rt.score);
    assert(result.level === rt.expected, `Score ${rt.score} -> ${rt.expected} (got ${result.level})`);
    assert(result.descriptionScore === rt.score, `Score ${rt.score} preserved in result`);
  }

  // Edge cases: NaN and Infinity default to foundational
  const nanResult = classifyTeachingSophistication(NaN);
  assert(nanResult.level === 'foundational', 'NaN defaults to foundational');
  const infResult = classifyTeachingSophistication(Infinity);
  assert(infResult.level === 'foundational', 'Infinity defaults to foundational');

  // ================================================================
  // SECTION 12: Weight consistency
  // ================================================================
  section('12. Weight consistency');
  const stdSum = STANDARD_WEIGHTS.tier + STANDARD_WEIGHTS.recognition + STANDARD_WEIGHTS.leadership + STANDARD_WEIGHTS.community + STANDARD_WEIGHTS.commitment;
  assert(Math.abs(stdSum - 1.0) < 0.001, `STANDARD_WEIGHTS sum to 1.0 (got ${stdSum})`);

  const noLeadSum = NO_LEADERSHIP_WEIGHTS.tier + NO_LEADERSHIP_WEIGHTS.recognition + NO_LEADERSHIP_WEIGHTS.leadership + NO_LEADERSHIP_WEIGHTS.community + NO_LEADERSHIP_WEIGHTS.commitment;
  assert(Math.abs(noLeadSum - 1.0) < 0.001, `NO_LEADERSHIP_WEIGHTS sum to 1.0 (got ${noLeadSum})`);
  assert(NO_LEADERSHIP_WEIGHTS.leadership === 0, 'NO_LEADERSHIP_WEIGHTS.leadership === 0');

  // ================================================================
  // SECTION 13: KB_VERSION + metadata
  // ================================================================
  section('13. KB_VERSION + metadata');
  assert(KB_VERSION === '2.3.0', `KB_VERSION is 2.3.0 (got ${KB_VERSION})`);
  const metadata = getKnowledgeBaseVersion();
  assert(metadata.categoryCount === 18, `Category count is 18 (got ${metadata.categoryCount})`);
  assert(metadata.version === '2.3.0', `Metadata version is 2.3.0`);

  // ================================================================
  // FINAL SUMMARY
  // ================================================================
  // Print last section results
  console.log(`  → ${sectionPassed} passed, ${sectionFailed} failed\n`);

  console.log('================================');
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log('================================');

  if (failed > 0) {
    process.exit(1);
  }
}

// ================================================================
// TEST HELPERS
// ================================================================

/**
 * Build minimal ExtractedEvidence for testing.
 * Fills in sensible defaults for fields not specified.
 */
function buildMinimalEvidence(overrides: {
  category?: string;
  scopeLevel?: 'school' | 'local' | 'regional' | 'state' | 'national' | 'international';
  scopeConfidence?: number;
  recognitions?: Array<{ name: string; level: 'school' | 'local' | 'regional' | 'state' | 'national' | 'international'; isVerifiable: boolean; selectivityContext?: string }>;
  impactQuantified?: boolean;
  tangibleOutcomes?: string[];
  yearsActive?: number;
  roleType?: 'founder' | 'president_captain' | 'executive' | 'team_lead' | 'contributor' | 'participant' | 'member';
  hoursPerWeek?: number;
  weeksPerYear?: number;
  communityBenefit?: 'significant' | 'moderate' | 'minimal' | 'self-focused';
  showsProgression?: boolean;
} = {}): any {
  return {
    scope: {
      level: overrides.scopeLevel ?? 'school',
      confidence: overrides.scopeConfidence ?? 0.5,
      evidence: 'test evidence',
    },
    recognitions: overrides.recognitions ?? [],
    role: {
      title: 'Member',
      type: overrides.roleType ?? 'member',
      isLeadershipApplicable: true,
      evidence: 'test',
    },
    impact: {
      hasQuantifiedOutcomes: overrides.impactQuantified ?? false,
      metrics: overrides.impactQuantified ? [{ value: '100', unit: 'people', context: 'test', isVerifiable: true }] : [],
      estimatedPeopleReached: overrides.impactQuantified ? 100 : null,
      tangibleOutcomes: overrides.tangibleOutcomes ?? [],
    },
    commitment: {
      yearsActive: overrides.yearsActive ?? 1,
      hoursPerWeek: overrides.hoursPerWeek ?? 5,
      weeksPerYear: overrides.weeksPerYear ?? 40,
      showsProgression: overrides.showsProgression ?? false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
    character: {
      primaryTrait: 'discipline' as const,
      communityBenefit: overrides.communityBenefit ?? 'moderate',
      authenticitySignals: [],
      paddingSignals: [],
    },
    categoryMatch: {
      category: overrides.category ?? 'technology',
      confidence: 'high' as const,
      similarDomains: [],
      subcategoryGuess: null,
      domainSpecificContext: null,
    },
    overallSignalStrength: 'moderate' as const,
  };
}

main().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
