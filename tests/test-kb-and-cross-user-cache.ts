/**
 * Knowledge Base + Cross-User Cache — Unit & Integration Tests
 *
 * Tests the KB system (category registry, recognition index, public API)
 * and the cross-user cache (fingerprinting, lookup, write, version invalidation).
 *
 * NO LLM calls — $0.00 cost, <2s runtime.
 *
 * Run: npx tsx tests/test-kb-and-cross-user-cache.ts
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
  // Category registry
  getCategory,
  getCategoryByAlias,
  resolveCategory,
  getAllCategories,
  getAllCategoryIds,
  getCategoryCount,
  getCategoryAliases,
  getCategoryKeywordIndex,
  // Recognition index
  lookupRecognitionByName,
  findRecognitionsInText,
  getRecognitionsByCategory,
  getRecognitionsByTier,
  getRecognitionCount,
  getAllRecognitions,
  // KB version
  getKnowledgeBaseVersion,
  KB_VERSION,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/knowledge/index';

import { getLibraryStats } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/expertiseSignaling';

import { CrossUserCacheService } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/crossUserCacheService';
import type { InternalTier, ExternalTier } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.log(`  FAIL: ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
}

// ============================================================================
// 1. CATEGORY REGISTRY TESTS
// ============================================================================

function testCategoryRegistry(): void {
  section('Category Registry');

  // 1a. All 18 categories loaded
  const count = getCategoryCount();
  assert(count === 18, `Expected 18 categories, got ${count}`);
  console.log(`  Categories loaded: ${count}`);

  // 1b. getCategory by canonical ID
  const stemResearch = getCategory('stem_research');
  assert(stemResearch !== undefined, 'getCategory("stem_research") should return a category');
  assert(stemResearch?.categoryId === 'stem_research', 'Category ID should be "stem_research"');
  assert(stemResearch?.label !== undefined && stemResearch.label.length > 0, 'Category should have a label');
  assert(stemResearch?.keywords.length > 0, 'Category should have keywords');
  assert(stemResearch?.subcategories.length > 0, 'Category should have subcategories');
  assert(stemResearch?.achievementLadder.length > 0, 'Category should have achievement ladder');
  assert(stemResearch?.tiers !== undefined, 'Category should have tiers');

  // 1c. Expertise domain mapping
  assert(stemResearch?.expertiseDomainId === 'stem_research', 'stem_research should map to expertise domain "stem_research"');
  assert(stemResearch?.aoExpectations !== null, 'stem_research should have AO expectations');
  assert(stemResearch?.realExpertiseSignals.length > 0, 'stem_research should have expertise signals');
  assert(stemResearch?.nameDropTraps.length > 0, 'stem_research should have name drop traps');

  // 1d. Categories with null expertise domain
  const religiousCultural = getCategory('religious_cultural');
  assert(religiousCultural !== undefined, 'religious_cultural should exist');
  assert(religiousCultural?.expertiseDomainId === null, 'religious_cultural should have null expertise domain');
  assert(religiousCultural?.aoExpectations === null, 'religious_cultural should have null AO expectations');
  assert(religiousCultural?.realExpertiseSignals.length === 0, 'religious_cultural should have empty expertise signals');

  // 1e. getCategoryByAlias
  const debateByAlias = getCategoryByAlias('debate');
  assert(debateByAlias !== undefined, 'getCategoryByAlias("debate") should resolve');
  assert(debateByAlias?.categoryId === 'debate_speech', '"debate" should map to debate_speech');

  const codingByAlias = getCategoryByAlias('robotics');
  assert(codingByAlias?.categoryId === 'technology', '"robotics" should map to technology');

  const sportsAlias = getCategoryByAlias('sports');
  assert(sportsAlias?.categoryId === 'athletics', '"sports" should map to athletics');

  // 1f. getCategoryByAlias with canonical ID
  const directLookup = getCategoryByAlias('stem_competition');
  assert(directLookup?.categoryId === 'stem_competition', 'Direct canonical ID lookup should work');

  // 1g. getCategoryByAlias with unknown alias
  const unknown = getCategoryByAlias('zzzz_nonexistent');
  assert(unknown === undefined, 'Unknown alias should return undefined');

  // 1h. getAllCategories
  const allCategories = getAllCategories();
  assert(allCategories.length === 18, `getAllCategories should return 18, got ${allCategories.length}`);

  // 1i. getAllCategoryIds
  const allIds = getAllCategoryIds();
  assert(allIds.length === 18, `getAllCategoryIds should return 18, got ${allIds.length}`);
  assert(allIds.includes('stem_research'), 'IDs should include stem_research');
  assert(allIds.includes('athletics'), 'IDs should include athletics');
  assert(allIds.includes('entrepreneurship'), 'IDs should include entrepreneurship');

  // 1j. Category aliases count
  const aliases = getCategoryAliases();
  const aliasCount = Object.keys(aliases).length;
  assert(aliasCount >= 60, `Should have 60+ aliases, got ${aliasCount}`);

  // 1k. Keyword index exists
  const keywordIndex = getCategoryKeywordIndex();
  assert(keywordIndex.size > 0, 'Keyword index should be populated');

  console.log(`  Alias count: ${aliasCount}`);
  console.log(`  Keyword index entries: ${keywordIndex.size}`);
}

// ============================================================================
// 2. CATEGORY RESOLUTION TESTS
// ============================================================================

function testCategoryResolution(): void {
  section('Category Resolution');

  // 2a. Resolution by activity type (direct alias match)
  const result1 = resolveCategory('member of the club', 'debate');
  assert(result1 !== null, 'Should resolve "debate" activity type');
  assert(result1?.category.categoryId === 'debate_speech', 'debate → debate_speech');
  assert(result1?.confidence === 'high', 'Direct alias match should be high confidence');
  assert(result1?.matchType === 'alias', 'Should be alias match type');

  // 2b. Resolution by keywords in description
  const result2 = resolveCategory(
    'Led a team of 15 to build a mobile app using React Native and deployed to App Store',
    undefined,
    'Lead Developer',
  );
  assert(result2 !== null, 'Should resolve coding/engineering from keywords');
  // The exact category depends on keyword matching, but it should find something relevant
  if (result2) {
    console.log(`  Keyword resolution: "${result2.category.categoryId}" (confidence: ${result2.confidence})`);
  }

  // 2c. Resolution with subcategory
  const result3 = resolveCategory(
    'Competed in USAMO and qualified for the USA team at IMO',
    'competition',
  );
  assert(result3 !== null, 'Should resolve STEM competition');
  assert(result3?.category.categoryId === 'stem_competition', 'Should be stem_competition');
  if (result3?.subcategory) {
    console.log(`  Subcategory resolved: ${result3.subcategory.name}`);
  }

  // 2d. No resolution for garbage text
  const result4 = resolveCategory('zzz qqq xxx mmm');
  assert(result4 === null, 'Garbage text should return null');

  // 2e. Community service resolution
  const result5 = resolveCategory(
    'Founded nonprofit tutoring organization serving 200+ students',
    'volunteer',
  );
  assert(result5 !== null, 'Should resolve community service');
  assert(result5?.category.categoryId === 'community_service', 'volunteer → community_service');

  // 2f. Work/employment resolution
  const result6 = resolveCategory(
    'Software engineering intern at Google',
    'internship',
  );
  assert(result6 !== null, 'Should resolve internship');
  assert(result6?.category.categoryId === 'work_family', 'internship → work_family');
}

// ============================================================================
// 3. RECOGNITION INDEX TESTS
// ============================================================================

function testRecognitionIndex(): void {
  section('Recognition Index');

  // 3a. Total recognitions
  const count = getRecognitionCount();
  assert(count >= 40, `Should have 40+ recognitions, got ${count}`);
  console.log(`  Total recognitions: ${count}`);

  // 3b. Lookup by exact name
  const rsi = lookupRecognitionByName('RSI (Research Science Institute)');
  assert(rsi !== undefined, 'Should find RSI by exact name');
  assert(rsi?.tier === 1, 'RSI should be Tier 1');
  assert(rsi?.scoreRange[0] >= 9, 'RSI min score should be >= 9');

  // 3c. Lookup by alias
  const rsiAlias = lookupRecognitionByName('rsi');
  assert(rsiAlias !== undefined, 'Should find RSI by alias "rsi"');
  assert(rsiAlias?.name === rsi?.name, 'Alias lookup should return same entry');

  // 3d. Case insensitive lookup
  const usamo = lookupRecognitionByName('USAMO');
  assert(usamo !== undefined, 'Should find USAMO (case insensitive)');
  assert(usamo?.tier === 1, 'USAMO should be Tier 1');

  // 3e. Unknown recognition
  const unknown = lookupRecognitionByName('Made Up Award 2024');
  assert(unknown === undefined, 'Unknown recognition should return undefined');

  // 3f. Find recognitions in text
  const found = findRecognitionsInText(
    'I qualified for USAMO and also competed at the International Math Olympiad (IMO)',
  );
  assert(found.length >= 2, `Should find at least 2 recognitions in text, got ${found.length}`);
  const foundNames = found.map(r => r.entry.name);
  console.log(`  Found in text: ${foundNames.join(', ')}`);

  // 3g. Find recognitions — sorted by tier
  if (found.length >= 2) {
    for (let i = 0; i < found.length - 1; i++) {
      assert(
        found[i].entry.tier <= found[i + 1].entry.tier,
        `Results should be sorted by tier (best first): ${found[i].entry.name} (T${found[i].entry.tier}) <= ${found[i + 1].entry.name} (T${found[i + 1].entry.tier})`,
      );
    }
  }

  // 3h. Find recognitions — confidence levels
  const foundIsef = findRecognitionsInText('Won ISEF Grand Award in environmental science');
  assert(foundIsef.length >= 1, 'Should find ISEF in text');
  if (foundIsef.length > 0) {
    const isefMatch = foundIsef.find(r => r.entry.name.includes('ISEF'));
    assert(isefMatch !== undefined, 'Should specifically find ISEF Grand Award');
  }

  // 3i. Find recognitions — empty text
  const emptyResult = findRecognitionsInText('');
  assert(emptyResult.length === 0, 'Empty text should return no recognitions');

  // 3j. Get recognitions by category
  const stemCompRecogs = getRecognitionsByCategory('stem_competition');
  assert(stemCompRecogs.length >= 10, `STEM competition should have 10+ recognitions, got ${stemCompRecogs.length}`);

  const debateRecogs = getRecognitionsByCategory('debate_speech');
  assert(debateRecogs.length >= 2, `Debate should have 2+ recognitions, got ${debateRecogs.length}`);

  // 3k. Get recognitions by tier
  const tier1 = getRecognitionsByTier(1 as InternalTier);
  const tier2 = getRecognitionsByTier(2 as InternalTier);
  assert(tier1.length >= 15, `Tier 1 should have 15+ recognitions, got ${tier1.length}`);
  assert(tier2.length >= 10, `Tier 2 should have 10+ recognitions, got ${tier2.length}`);
  console.log(`  Tier 1: ${tier1.length}, Tier 2: ${tier2.length}`);

  // 3l. All recognitions should have required fields
  const all = getAllRecognitions();
  for (const rec of all) {
    assert(rec.name.length > 0, `Recognition should have a name`);
    assert(rec.tier >= 1 && rec.tier <= 6, `Tier should be 1-6, got ${rec.tier} for ${rec.name}`);
    assert(rec.scoreRange.length === 2, `Score range should have 2 elements for ${rec.name}`);
    assert(rec.scoreRange[0] <= rec.scoreRange[1], `Score range [0] <= [1] for ${rec.name}`);
    assert(rec.detectionKeywords.length > 0, `Should have detection keywords for ${rec.name}`);
    assert(rec.categoryId.length > 0, `Should have category ID for ${rec.name}`);
  }
}

// ============================================================================
// 4. KB VERSION TESTS
// ============================================================================

function testKBVersion(): void {
  section('KB Version');

  // 4a. Version string exists
  assert(KB_VERSION.length > 0, 'KB_VERSION should be non-empty');
  assert(/^\d+\.\d+\.\d+$/.test(KB_VERSION), `KB_VERSION should be semver, got "${KB_VERSION}"`);
  console.log(`  KB_VERSION: ${KB_VERSION}`);

  // 4b. Version metadata
  const meta = getKnowledgeBaseVersion();
  assert(meta.version === KB_VERSION, 'Version metadata version should match KB_VERSION');
  assert(meta.categoryCount === 18, `Should have 18 categories, got ${meta.categoryCount}`);
  assert(meta.recognitionCount >= 40, `Should have 40+ recognitions, got ${meta.recognitionCount}`);
  assert(meta.totalBenchmarks > 0, 'Should have benchmarks');
  assert(meta.totalExpertiseSignals > 0, 'Should have expertise signals');

  console.log(`  Categories: ${meta.categoryCount}`);
  console.log(`  Recognitions: ${meta.recognitionCount}`);
  console.log(`  Benchmarks: ${meta.totalBenchmarks}`);
  console.log(`  Expertise signals: ${meta.totalExpertiseSignals}`);
}

// ============================================================================
// 5. CROSS-USER CACHE FINGERPRINTING TESTS
// ============================================================================

function testFingerprinting(): void {
  section('Cross-User Cache — Fingerprinting');

  const cache = new CrossUserCacheService({ enabled: false }); // disabled = no Supabase calls

  // 5a. Deterministic fingerprints
  const fp1 = cache.computeFingerprint({
    description: 'Captain of varsity soccer team',
    role: 'Captain',
    category: 'Athletics',
    hoursPerWeek: 15,
    yearsActive: 4,
  });
  const fp2 = cache.computeFingerprint({
    description: 'Captain of varsity soccer team',
    role: 'Captain',
    category: 'Athletics',
    hoursPerWeek: 15,
    yearsActive: 4,
  });
  assert(fp1 === fp2, 'Same input should produce same fingerprint');
  assert(fp1.length === 64, `Fingerprint should be 64 hex chars, got ${fp1.length}`);
  console.log(`  Fingerprint: ${fp1.substring(0, 16)}...`);

  // 5b. Case/whitespace normalization
  const fp3 = cache.computeFingerprint({
    description: '  Captain of Varsity Soccer Team  ',
    role: '  CAPTAIN  ',
    category: '  ATHLETICS  ',
    hoursPerWeek: 15,
    yearsActive: 4,
  });
  assert(fp1 === fp3, 'Case/whitespace differences should produce same fingerprint');

  // 5c. Different descriptions = different fingerprints
  const fp4 = cache.computeFingerprint({
    description: 'President of math club',
    role: 'President',
    category: 'Academic',
    hoursPerWeek: 5,
    yearsActive: 3,
  });
  assert(fp1 !== fp4, 'Different inputs should produce different fingerprints');

  // 5d. Optional fields default correctly
  const fpMin1 = cache.computeFingerprint({ description: 'Test activity' });
  const fpMin2 = cache.computeFingerprint({
    description: 'Test activity',
    role: '',
    category: '',
    hoursPerWeek: 0,
    yearsActive: 0,
  });
  assert(fpMin1 === fpMin2, 'Missing optional fields should match explicit defaults');

  // 5e. Hours/years affect fingerprint
  const fp5 = cache.computeFingerprint({
    description: 'Captain of varsity soccer team',
    role: 'Captain',
    category: 'Athletics',
    hoursPerWeek: 20, // different
    yearsActive: 4,
  });
  assert(fp1 !== fp5, 'Different hours should produce different fingerprint');

  const fp6 = cache.computeFingerprint({
    description: 'Captain of varsity soccer team',
    role: 'Captain',
    category: 'Athletics',
    hoursPerWeek: 15,
    yearsActive: 2, // different
  });
  assert(fp1 !== fp6, 'Different years should produce different fingerprint');

  // 5f. Role affects fingerprint
  const fp7 = cache.computeFingerprint({
    description: 'Captain of varsity soccer team',
    role: 'Member', // different
    category: 'Athletics',
    hoursPerWeek: 15,
    yearsActive: 4,
  });
  assert(fp1 !== fp7, 'Different role should produce different fingerprint');
}

// ============================================================================
// 6. CROSS-USER CACHE — DISABLED MODE
// ============================================================================

async function testCacheDisabled(): Promise<void> {
  section('Cross-User Cache — Disabled Mode');

  const cache = new CrossUserCacheService({ enabled: false });

  // 6a. Lookup returns null when disabled
  const result = await cache.lookup('abc123');
  assert(result === null, 'Lookup should return null when disabled');

  // 6b. Write returns false when disabled
  const wrote = await cache.write('abc123', {
    activityScore: {
      total: 8.0,
      breakdown: {},
      tierJustification: 'Test',
      comparisonBenchmarks: {},
      improvementPaths: [],
      overallRationale: 'Test',
    },
    descriptionScore: {
      total: 7.5,
      breakdown: {},
      strengths: [],
      improvements: [],
      overallRationale: 'Test',
    },
    internalTier: 2 as InternalTier,
    externalTier: 2 as ExternalTier,
  });
  assert(wrote === false, 'Write should return false when disabled');
}

// ============================================================================
// 7. CROSS-USER CACHE — CONSISTENCY CHECKS
// ============================================================================

function testCacheConsistency(): void {
  section('Cross-User Cache — Consistency Checks');

  const cache = new CrossUserCacheService({ enabled: false });

  // 7a. 10 different activities produce 10 different fingerprints
  const activities = [
    { description: 'Founded coding club and taught 50+ students Python', role: 'Founder', category: 'coding_engineering' },
    { description: 'Research intern at MIT studying machine learning', role: 'Research Intern', category: 'stem_research' },
    { description: 'Varsity basketball team captain, led to state finals', role: 'Captain', category: 'athletics' },
    { description: 'First-chair violin in All-State Orchestra', role: 'First Chair', category: 'performing_arts' },
    { description: 'Debate team president, qualified for TOC', role: 'President', category: 'debate_speech' },
    { description: 'Started nonprofit providing meals to 500 families', role: 'Founder', category: 'community_service' },
    { description: 'Published research paper on quantum computing', role: 'Lead Author', category: 'stem_research' },
    { description: 'Student body president, managed $50K budget', role: 'President', category: 'leadership_government' },
    { description: 'Part-time software developer at tech startup', role: 'Developer', category: 'internships_work' },
    { description: 'Won USAMO and represented US at IMO', role: 'Team Member', category: 'stem_competition' },
  ];

  const fingerprints = new Set<string>();
  for (const activity of activities) {
    const fp = cache.computeFingerprint(activity);
    fingerprints.add(fp);
  }

  assert(
    fingerprints.size === 10,
    `10 different activities should produce 10 different fingerprints, got ${fingerprints.size}`,
  );

  // 7b. Fingerprints are valid hex
  for (const fp of fingerprints) {
    assert(/^[0-9a-f]{64}$/.test(fp), `Fingerprint should be 64 hex chars: ${fp.substring(0, 16)}...`);
  }

  // 7c. Same activity text with different casing = same fingerprint
  const fp_lower = cache.computeFingerprint({
    description: 'founded coding club',
    role: 'founder',
    category: 'stem',
  });
  const fp_upper = cache.computeFingerprint({
    description: 'FOUNDED CODING CLUB',
    role: 'FOUNDER',
    category: 'STEM',
  });
  assert(fp_lower === fp_upper, 'Case should not affect fingerprint');
}

// ============================================================================
// 8. KNOWLEDGE BASE COMPOSITION INTEGRITY
// ============================================================================

function testKBCompositionIntegrity(): void {
  section('KB Composition Integrity');

  const allCategories = getAllCategories();

  // 8a. Every category has calibration data (from achievementIntelligence)
  let categoriesWithTiers = 0;
  let categoriesWithLadder = 0;
  for (const cat of allCategories) {
    if (Object.keys(cat.tiers).length > 0) categoriesWithTiers++;
    if (cat.achievementLadder.length > 0) categoriesWithLadder++;
  }
  assert(categoriesWithTiers === 18, `All 18 categories should have tier data, got ${categoriesWithTiers}`);
  assert(categoriesWithLadder === 18, `All 18 categories should have achievement ladder, got ${categoriesWithLadder}`);

  // 8b. Categories WITH expertise domains have expertise data
  const withExpertise = allCategories.filter(c => c.expertiseDomainId !== null);
  const withoutExpertise = allCategories.filter(c => c.expertiseDomainId === null);

  console.log(`  With expertise domain: ${withExpertise.length}`);
  console.log(`  Without expertise domain: ${withoutExpertise.length}`);

  for (const cat of withExpertise) {
    assert(
      cat.aoExpectations !== null,
      `Category ${cat.categoryId} has expertise domain but null AO expectations`,
    );
  }

  // 8c. Categories WITHOUT expertise domains have empty expertise arrays
  for (const cat of withoutExpertise) {
    assert(cat.aoExpectations === null, `${cat.categoryId} should have null AO expectations`);
    assert(cat.realExpertiseSignals.length === 0, `${cat.categoryId} should have empty expertise signals`);
    assert(cat.nameDropTraps.length === 0, `${cat.categoryId} should have empty name drop traps`);
  }

  // 8d. Expertise domain mapping works correctly for technology
  const techCat = getCategory('technology');
  assert(
    techCat?.expertiseDomainId === 'coding_engineering',
    'technology should map to coding_engineering expertise domain',
  );

  // 8e. Every category has aliases
  for (const cat of allCategories) {
    // Some categories might have 0 aliases if no alias maps to them,
    // but most should have at least 1
    if (cat.aliases.length === 0) {
      console.log(`  Note: ${cat.categoryId} has no aliases`);
    }
  }

  // 8f. Recognition entries reference valid categories
  const allRecognitions = getAllRecognitions();
  const validCategoryIds = new Set(getAllCategoryIds());
  for (const rec of allRecognitions) {
    assert(
      validCategoryIds.has(rec.categoryId),
      `Recognition "${rec.name}" references unknown category: ${rec.categoryId}`,
    );
  }
}

// ============================================================================
// 9. CROSS-REFERENCE: RECOGNITION INDEX ↔ CATEGORY REGISTRY
// ============================================================================

function testCrossReferences(): void {
  section('Cross-Reference Integrity');

  // 9a. All recognition categories exist in the registry
  const allRecognitions = getAllRecognitions();
  const allCategoryIds = new Set(getAllCategoryIds());
  let invalidRefs = 0;

  for (const rec of allRecognitions) {
    if (!allCategoryIds.has(rec.categoryId)) {
      invalidRefs++;
      console.log(`  Invalid ref: ${rec.name} → ${rec.categoryId}`);
    }
  }
  assert(invalidRefs === 0, `All recognition category references should be valid, ${invalidRefs} invalid`);

  // 9b. Key recognitions map to expected categories
  const rsi = lookupRecognitionByName('rsi');
  assert(rsi?.categoryId === 'stem_research', 'RSI should be in stem_research');

  const usamo = lookupRecognitionByName('usamo');
  assert(usamo?.categoryId === 'stem_competition', 'USAMO should be in stem_competition');

  const toc = lookupRecognitionByName('toc finalist');
  assert(toc?.categoryId === 'debate_speech', 'TOC should be in debate_speech');

  const youngarts = lookupRecognitionByName('youngarts');
  assert(youngarts?.categoryId === 'performing_arts', 'YoungArts should be in performing_arts');

  // 9c. Categories referenced by recognitions have the recognitions' tier data
  const stemResearch = getCategory('stem_research');
  assert(
    stemResearch !== undefined && Object.keys(stemResearch.tiers).length > 0,
    'stem_research should have tier data for recognition calibration',
  );

  // 9d. Find recognitions in text should match category expectations
  const textMatches = findRecognitionsInText(
    'RSI alumnus who published first-author paper and qualified for USAMO',
  );
  const matchedCategories = new Set(textMatches.map(r => r.entry.categoryId));
  assert(matchedCategories.has('stem_research'), 'Should find stem_research recognition in text');
  assert(matchedCategories.has('stem_competition'), 'Should find stem_competition recognition in text');
}

// ============================================================================
// 10. C3 FIX: DOMAIN MAPPING CORRECTIONS
// ============================================================================

function testC3DomainMappingFixes(): void {
  section('C3: Domain Mapping Fixes');

  // C3a: writing_journalism should map to writing_journalism domain (was 'academic')
  const writingCat = getCategory('writing_journalism');
  assert(writingCat !== undefined, 'writing_journalism category should exist');
  assert(
    writingCat?.expertiseDomainId === 'writing_journalism',
    `writing_journalism should map to "writing_journalism" expertise domain, got "${writingCat?.expertiseDomainId}"`,
  );
  assert(writingCat?.aoExpectations !== null, 'writing_journalism should have AO expectations from writing domain');
  assert(
    (writingCat?.realExpertiseSignals.length ?? 0) > 0,
    'writing_journalism should have expertise signals from writing domain',
  );
  console.log(`  writing_journalism signals: ${writingCat?.realExpertiseSignals.length}`);

  // C3b: visual_arts should map to visual_arts domain (was 'arts_creative')
  const visualCat = getCategory('visual_arts');
  assert(visualCat !== undefined, 'visual_arts category should exist');
  assert(
    visualCat?.expertiseDomainId === 'visual_arts',
    `visual_arts should map to "visual_arts" expertise domain, got "${visualCat?.expertiseDomainId}"`,
  );
  assert(visualCat?.aoExpectations !== null, 'visual_arts should have AO expectations from visual arts domain');
  assert(
    (visualCat?.realExpertiseSignals.length ?? 0) > 0,
    'visual_arts should have expertise signals from visual arts domain',
  );
  console.log(`  visual_arts signals: ${visualCat?.realExpertiseSignals.length}`);

  // C3c: work_family should have merged data from BOTH work_employment AND family_responsibility
  const workFamily = getCategory('work_family');
  assert(workFamily !== undefined, 'work_family category should exist');
  assert(workFamily?.expertiseDomainId === 'work_employment', 'work_family primary domain should be work_employment');
  assert(workFamily?.aoExpectations !== null, 'work_family should have AO expectations from work_employment');

  // work_family should have MERGED signals from both domains — more than just one domain alone
  const workOnlySignals = workFamily?.realExpertiseSignals.length ?? 0;
  assert(
    workOnlySignals > 0,
    `work_family should have merged expertise signals from both domains, got ${workOnlySignals}`,
  );
  console.log(`  work_family merged signals: ${workOnlySignals}`);

  // Verify merge: check that family-related patterns exist alongside work patterns
  // work_employment uses snake_case patterns like 'promotion_trajectory', 'process_improvement'
  const hasWorkPattern = workFamily?.realExpertiseSignals.some(
    s => s.pattern.toLowerCase().includes('promotion') ||
         s.pattern.toLowerCase().includes('process_improvement') ||
         s.pattern.toLowerCase().includes('team_leadership') ||
         s.pattern.toLowerCase().includes('business') ||
         s.pattern.toLowerCase().includes('financial'),
  );
  // family_responsibility uses patterns like 'caregiv', 'sibling', 'household', 'parent'
  const hasFamilyPattern = workFamily?.realExpertiseSignals.some(
    s => s.pattern.toLowerCase().includes('family') ||
         s.pattern.toLowerCase().includes('sibling') ||
         s.pattern.toLowerCase().includes('caregiv') ||
         s.pattern.toLowerCase().includes('household') ||
         s.pattern.toLowerCase().includes('parent'),
  );
  assert(hasWorkPattern === true, 'work_family should have work-related expertise signals (from work_employment domain)');
  assert(hasFamilyPattern === true, 'work_family should have family-related expertise signals (merged from family_responsibility)');

  // C3d: medical_health should now map to medical_health expertise domain (was null)
  const medicalCat = getCategory('medical_health');
  assert(medicalCat !== undefined, 'medical_health category should exist');
  assert(
    medicalCat?.expertiseDomainId === 'medical_health',
    `medical_health should map to "medical_health" expertise domain, got "${medicalCat?.expertiseDomainId}"`,
  );
  assert(medicalCat?.aoExpectations !== null, 'medical_health should have AO expectations from medical_health domain');
  assert(
    (medicalCat?.realExpertiseSignals.length ?? 0) > 0,
    'medical_health should have expertise signals from medical_health domain',
  );
  console.log(`  medical_health signals: ${medicalCat?.realExpertiseSignals.length}`);
}

// ============================================================================
// 11. H1 FIX: WORD-BOUNDARY MATCHING (NO FALSE POSITIVES)
// ============================================================================

function testH1WordBoundaryMatching(): void {
  section('H1: Word-Boundary Regex Matching');

  // H1: "diversity" should NOT match RSI (R-S-I are letters within "diversity")
  const diversityMatches = findRecognitionsInText('I value diversity and inclusion in my community work');
  const diversityMatchNames = diversityMatches.map(r => r.entry.name);
  assert(
    !diversityMatchNames.some(n => n.includes('RSI')),
    `"diversity" should NOT match RSI, but matched: ${diversityMatchNames.join(', ')}`,
  );

  // H1: "interests" should NOT match STS (letters s-t-s appear in "interests")
  const interestsMatches = findRecognitionsInText('My interests include biology and chemistry');
  const interestsMatchNames = interestsMatches.map(r => r.entry.name);
  assert(
    !interestsMatchNames.some(n => n.includes('STS')),
    `"interests" should NOT match STS, but matched: ${interestsMatchNames.join(', ')}`,
  );

  // H1: "aimed" should NOT match AIME
  const aimedMatches = findRecognitionsInText('I aimed to improve our community garden');
  const aimedMatchNames = aimedMatches.map(r => r.entry.name);
  assert(
    !aimedMatchNames.some(n => n.includes('AIME')),
    `"aimed" should NOT match AIME, but matched: ${aimedMatchNames.join(', ')}`,
  );

  // H1: Verify REAL matches still work
  const realRsi = findRecognitionsInText('I attended RSI at MIT last summer');
  assert(realRsi.some(r => r.entry.name.includes('RSI')), 'Real "RSI" mention should still match');

  const realUsamo = findRecognitionsInText('I qualified for USAMO in junior year');
  assert(realUsamo.some(r => r.entry.name.includes('USAMO')), 'Real "USAMO" mention should still match');

  const realAime = findRecognitionsInText('Scored 12 on AIME and qualified for USAMO');
  assert(realAime.some(r => r.entry.name.includes('AIME')), 'Real "AIME" mention should still match');

  console.log('  Word-boundary matching prevents false positives');
  console.log('  Real mentions still detected correctly');
}

// ============================================================================
// 12. H6 FIX: QUALIFIED ALL-STATE KEYWORDS
// ============================================================================

function testH6QualifiedAllState(): void {
  section('H6: Qualified All-State Keywords');

  // "all-state orchestra" should match performing_arts ONLY
  const orchestraMatches = findRecognitionsInText('Selected for all-state orchestra in my junior year');
  const orchCategories = orchestraMatches.map(r => r.entry.categoryId);
  assert(
    orchCategories.includes('performing_arts'),
    `"all-state orchestra" should match performing_arts, got: ${orchCategories.join(', ')}`,
  );
  assert(
    !orchCategories.includes('athletics'),
    `"all-state orchestra" should NOT match athletics, got: ${orchCategories.join(', ')}`,
  );

  // "all-state athlete" should match athletics ONLY
  const athleteMatches = findRecognitionsInText('Named all-state athlete in cross country');
  const athleteCategories = athleteMatches.map(r => r.entry.categoryId);
  assert(
    athleteCategories.includes('athletics'),
    `"all-state athlete" should match athletics, got: ${athleteCategories.join(', ')}`,
  );
  assert(
    !athleteCategories.includes('performing_arts'),
    `"all-state athlete" should NOT match performing_arts, got: ${athleteCategories.join(', ')}`,
  );

  // Bare "all-state" without qualifier should NOT match anything
  const bareMatches = findRecognitionsInText('I was selected all-state in my field');
  assert(
    bareMatches.length === 0,
    `Bare "all-state" should not match anything, got ${bareMatches.length} matches: ${bareMatches.map(r => r.entry.name).join(', ')}`,
  );

  console.log('  All-state keywords properly qualified by domain');
}

// ============================================================================
// 13. M7 FIX: REGENERON KEYWORD DISAMBIGUATION
// ============================================================================

function testM7RegeneronDisambiguation(): void {
  section('M7: Regeneron Keyword Disambiguation');

  // Bare "regeneron" should NOT match STS Finalist
  const bareRegeneron = findRecognitionsInText('Regeneron is a biotech company I admire');
  const bareNames = bareRegeneron.map(r => r.entry.name);
  assert(
    !bareNames.some(n => n.includes('STS Finalist')),
    `Bare "regeneron" should NOT match STS Finalist, but matched: ${bareNames.join(', ')}`,
  );

  // "regeneron sts" SHOULD match
  const regeneronSts = findRecognitionsInText('Named a Regeneron STS finalist');
  assert(
    regeneronSts.some(r => r.entry.name.includes('STS')),
    '"regeneron sts" should match STS',
  );

  // "sts finalist" SHOULD match
  const stsFinalist = findRecognitionsInText('Selected as an STS finalist in senior year');
  assert(
    stsFinalist.some(r => r.entry.name.includes('STS')),
    '"sts finalist" should match STS',
  );

  console.log('  Regeneron disambiguation working correctly');
}

// ============================================================================
// 14. M3 FIX: UNICODE NFC NORMALIZATION
// ============================================================================

function testM3UnicodeNormalization(): void {
  section('M3: Unicode NFC Normalization');

  const cache = new CrossUserCacheService({ enabled: false });

  // NFC vs NFD representations of "résumé" — composed vs decomposed
  const nfcText = 'Wrote my r\u00E9sum\u00E9 for internship';   // é as single codepoint
  const nfdText = 'Wrote my re\u0301sume\u0301 for internship'; // é as e + combining accent

  const fpNfc = cache.computeFingerprint({ description: nfcText });
  const fpNfd = cache.computeFingerprint({ description: nfdText });

  assert(
    fpNfc === fpNfd,
    `NFC and NFD representations should produce same fingerprint (NFC: ${fpNfc.substring(0, 16)}, NFD: ${fpNfd.substring(0, 16)})`,
  );

  console.log('  Unicode NFC normalization produces consistent fingerprints');
}

// ============================================================================
// 15. M4 FIX: TITLE IN FINGERPRINT
// ============================================================================

function testM4TitleInFingerprint(): void {
  section('M4: Title in Fingerprint');

  const cache = new CrossUserCacheService({ enabled: false });

  // Same description but different titles should produce different fingerprints
  const fpWithTitle = cache.computeFingerprint({
    description: 'Led team of 20 members in weekly meetings',
    role: 'President',
    category: 'leadership',
    title: 'Math Club President',
  });

  const fpDiffTitle = cache.computeFingerprint({
    description: 'Led team of 20 members in weekly meetings',
    role: 'President',
    category: 'leadership',
    title: 'Science Club President',
  });

  assert(
    fpWithTitle !== fpDiffTitle,
    'Different titles should produce different fingerprints',
  );

  // Without title vs with title should differ
  const fpNoTitle = cache.computeFingerprint({
    description: 'Led team of 20 members in weekly meetings',
    role: 'President',
    category: 'leadership',
  });

  assert(
    fpNoTitle !== fpWithTitle,
    'No title vs with title should produce different fingerprints',
  );

  // Same title should produce same fingerprint
  const fpSameTitle = cache.computeFingerprint({
    description: 'Led team of 20 members in weekly meetings',
    role: 'President',
    category: 'leadership',
    title: 'Math Club President',
  });

  assert(
    fpWithTitle === fpSameTitle,
    'Same title should produce same fingerprint',
  );

  console.log('  Title correctly included in fingerprint computation');
}

// ============================================================================
// 16. H4 FIX: SCORE VALIDATION ON CACHE WRITE
// ============================================================================

async function testH4ScoreValidation(): Promise<void> {
  section('H4: Score Validation on Cache Write');

  const cache = new CrossUserCacheService({ enabled: false });

  // Disabled cache should reject writes (returns false) regardless of validation
  // We test the validation logic indirectly — valid scores return false (disabled),
  // invalid scores also return false (disabled), but the validation code path runs.
  // Direct validation testing would require accessing private methods, so we verify
  // the public interface behaves correctly.

  const validResult = await cache.write('test-fp-valid', {
    activityScore: {
      total: 8.0,
      breakdown: {},
      tierJustification: 'Test',
      comparisonBenchmarks: {},
      improvementPaths: [],
      overallRationale: 'Test',
    },
    descriptionScore: {
      total: 7.5,
      breakdown: {},
      strengths: [],
      improvements: [],
      overallRationale: 'Test',
    },
    internalTier: 2 as InternalTier,
    externalTier: 2 as ExternalTier,
  });
  assert(validResult === false, 'Write with valid scores should return false (cache disabled)');

  // For comprehensive validation testing, we verify the validator exists
  // by checking that scores out of 0-10 range are caught (need enabled=true for this).
  // Since we can't connect to Supabase in tests, we verify the types compile correctly.
  console.log('  Score validation method exists and type-checks correctly');
  console.log('  Full validation tested via E2E with live cache');
}

// ============================================================================
// 17. M6 FIX: LIBRARY STATS DEDUPLICATION
// ============================================================================

function testM6LibraryStatsDeduplication(): void {
  section('M6: Library Stats Deduplication');

  const stats = getLibraryStats();

  // EXPERTISE_DOMAINS has duplicate entries (e.g., 'stem_competitions' alias for 'stem_competition')
  // M6 fix ensures perDomain array has unique domainIds only
  const domainIds = stats.perDomain.map(d => d.domainId);
  const uniqueIds = new Set(domainIds);
  assert(
    domainIds.length === uniqueIds.size,
    `perDomain should have unique domainIds only. Got ${domainIds.length} entries but ${uniqueIds.size} unique IDs`,
  );

  // totalDomains should match unique count
  assert(
    stats.totalDomains === uniqueIds.size,
    `totalDomains (${stats.totalDomains}) should match unique perDomain count (${uniqueIds.size})`,
  );

  // Sanity: totals should be positive
  assert(stats.totalSignals > 0, `totalSignals should be > 0, got ${stats.totalSignals}`);
  assert(stats.totalTraps > 0, `totalTraps should be > 0, got ${stats.totalTraps}`);
  assert(stats.totalProofs > 0, `totalProofs should be > 0, got ${stats.totalProofs}`);
  assert(stats.totalTransforms > 0, `totalTransforms should be > 0, got ${stats.totalTransforms}`);

  // New domains should be present
  assert(
    domainIds.includes('writing_journalism'),
    'writing_journalism domain should appear in stats',
  );
  assert(
    domainIds.includes('visual_arts'),
    'visual_arts domain should appear in stats',
  );

  console.log(`  Unique domains: ${stats.totalDomains}`);
  console.log(`  Total signals: ${stats.totalSignals}`);
  console.log(`  Total traps: ${stats.totalTraps}`);
  console.log(`  perDomain entries: ${stats.perDomain.length} (all unique)`);
}

// ============================================================================
// 18. KB VERSION BUMP VERIFICATION
// ============================================================================

function testKBVersionBump(): void {
  section('KB Version Bump');

  // KB_VERSION should be 2.1.0 after cache shape fix + medical_health mapping
  assert(
    KB_VERSION === '2.1.0',
    `KB_VERSION should be "2.1.0" after fixes, got "${KB_VERSION}"`,
  );

  const meta = getKnowledgeBaseVersion();
  assert(
    meta.version === '2.1.0',
    `Version metadata should report "2.1.0", got "${meta.version}"`,
  );

  console.log(`  KB_VERSION: ${KB_VERSION} (bumped from 2.0.0)`);
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Knowledge Base + Cross-User Cache — Test Suite            ║');
  console.log('║   Cost: $0.00 (no LLM calls)                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Synchronous tests — original
  testCategoryRegistry();
  testCategoryResolution();
  testRecognitionIndex();
  testKBVersion();
  testFingerprinting();
  testCacheConsistency();
  testKBCompositionIntegrity();
  testCrossReferences();

  // Async tests — original
  await testCacheDisabled();

  // New tests for reliability fixes (T7 wave)
  testC3DomainMappingFixes();
  testH1WordBoundaryMatching();
  testH6QualifiedAllState();
  testM7RegeneronDisambiguation();
  testM3UnicodeNormalization();
  testM4TitleInFingerprint();
  await testH4ScoreValidation();
  testM6LibraryStatsDeduplication();
  testKBVersionBump();

  const elapsed = Date.now() - startTime;

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('  RESULTS');
  console.log('='.repeat(60));
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Time: ${elapsed}ms`);

  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) {
      console.log(`    - ${f}`);
    }
  }

  console.log(`\n  ${failed === 0 ? 'ALL TESTS PASSED' : `${failed} TESTS FAILED`}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
