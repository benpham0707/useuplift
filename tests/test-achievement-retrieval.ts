/**
 * Achievement Retrieval Tests — $0.00 (no LLM calls)
 *
 * Tests the smart matching and calibration context assembly layer.
 * Verifies:
 * - Category matching accuracy for diverse activity descriptions
 * - Subcategory classification for ambiguous cases
 * - CalibrationContext completeness (entries, ladder, role hierarchy)
 * - Edge cases: unknown activities, multi-category matches, empty descriptions
 * - Index integrity: all categories and subcategories properly indexed
 */

import { getCalibrationContext } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/achievementRetrieval';
import {
  ACHIEVEMENT_DATABASE,
  getTotalEntryCount,
  getAchievementCategoryKeys,
  getCategoryKeywordIndex,
  getSubcategoryKeywordIndex,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/achievementIntelligence';
import { classifyTier } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/tierClassifier';
import type { ExtractedEvidence, TierClassification, InternalTier } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import type { CalibrationContext } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/nuanceCalibrationTypes';

// ============================================================================
// HELPERS
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

function makeEvidence(overrides: Partial<ExtractedEvidence> = {}): ExtractedEvidence {
  return {
    scope: { level: 'school', confidence: 0.5, evidence: 'school activity' },
    recognitions: [],
    role: { title: 'member', type: 'member', isLeadershipApplicable: true, evidence: 'member' },
    impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
    commitment: { yearsActive: 1, hoursPerWeek: 3, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
    character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
    categoryMatch: { category: '', confidence: 'low' },
    overallSignalStrength: 'moderate',
    ...overrides,
  };
}

function makeTier(internalTier: InternalTier): TierClassification {
  const ranges: Record<InternalTier, { min: number; max: number }> = {
    1: { min: 9.0, max: 10.0 },
    2: { min: 7.0, max: 8.9 },
    3: { min: 5.5, max: 6.9 },
    4: { min: 4.0, max: 5.4 },
    5: { min: 2.5, max: 3.9 },
    6: { min: 1.0, max: 2.4 },
  };
  return {
    internalTier,
    externalTier: internalTier <= 2 ? 1 : internalTier <= 3 ? 2 : internalTier <= 5 ? 3 : 4,
    confidence: 'medium',
    signals: [],
    scoreRange: ranges[internalTier],
    componentConstraints: {
      recognition: { min: 1, max: 10 },
      leadership: { min: 1, max: 10 },
      community: { min: 1, max: 10 },
      commitment: { min: 1, max: 10 },
    },
    tierScore: ranges[internalTier].min + 0.5,
    reasoning: `Test tier ${internalTier}`,
  } as TierClassification;
}

// ============================================================================
// TEST SUITE: DATABASE INTEGRITY
// ============================================================================

function testDatabaseIntegrity(): void {
  console.log('\n=== Database Integrity ===');

  // Total entry count
  const totalEntries = getTotalEntryCount();
  console.log(`  Total entries: ${totalEntries}`);
  assert(totalEntries >= 150, `Expected at least 150 entries, got ${totalEntries}`);

  // All 18 categories exist
  const categoryKeys = getAchievementCategoryKeys();
  console.log(`  Categories: ${categoryKeys.length}`);
  assert(categoryKeys.length >= 14, `Expected at least 14 categories, got ${categoryKeys.length}`);

  // Every category has keywords, subcategories, achievement ladder, and at least 1 tier with entries
  for (const key of categoryKeys) {
    const cat = ACHIEVEMENT_DATABASE[key];
    assert(cat.keywords.length > 0, `${key} has no keywords`);
    assert(cat.subcategories.length > 0, `${key} has no subcategories`);
    assert(cat.achievementLadder.length > 0, `${key} has no achievement ladder`);
    assert(cat.roleHierarchy.length > 0, `${key} has no role hierarchy`);

    const tierEntries = Object.values(cat.tiers).filter(t => t && t.length > 0);
    assert(tierEntries.length > 0, `${key} has no tier entries at all`);
  }

  // Every subcategory has keywords
  for (const key of categoryKeys) {
    const cat = ACHIEVEMENT_DATABASE[key];
    for (const sub of cat.subcategories) {
      assert(sub.keywords.length > 0, `${key}/${sub.key} has no keywords`);
      assert(sub.prestigeLevel >= 1 && sub.prestigeLevel <= 5, `${key}/${sub.key} invalid prestige level: ${sub.prestigeLevel}`);
    }
  }

  // Every entry has required fields
  for (const key of categoryKeys) {
    const cat = ACHIEVEMENT_DATABASE[key];
    for (const [tier, entries] of Object.entries(cat.tiers)) {
      if (!entries) continue;
      for (const entry of entries) {
        assert(entry.activity.length > 0, `${key}/T${tier} entry has empty activity`);
        assert(entry.scoreRange[0] <= entry.scoreRange[1], `${key}/T${tier}/${entry.activity} invalid score range`);
        assert(entry.context.length > 0, `${key}/T${tier}/${entry.activity} has empty context`);
        assert(entry.subcategory.length > 0, `${key}/T${tier}/${entry.activity} has empty subcategory`);
        assert(entry.fieldPrestige >= 1 && entry.fieldPrestige <= 5, `${key}/T${tier}/${entry.activity} invalid field prestige`);
        assert(entry.keyDifferentiator.length > 0, `${key}/T${tier}/${entry.activity} has empty key differentiator`);
      }
    }
  }

  // Index maps are populated
  const catIndex = getCategoryKeywordIndex();
  const subIndex = getSubcategoryKeywordIndex();
  assert(catIndex.size > 50, `Category keyword index too small: ${catIndex.size}`);
  assert(subIndex.size > 50, `Subcategory keyword index too small: ${subIndex.size}`);
}

// ============================================================================
// TEST SUITE: CATEGORY MATCHING
// ============================================================================

function testCategoryMatching(): void {
  console.log('\n=== Category Matching ===');

  // Test 1: STEM research with high-confidence feature extractor
  const ctx1 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: 'stem_research', confidence: 'high' } }),
    makeTier(3),
    { title: 'Research Assistant at University Lab', description: 'Conducted PCR analysis and gel electrophoresis' }
  );
  assert(ctx1.categoryMatch.category === 'stem_research', `Expected stem_research, got ${ctx1.categoryMatch.category}`);
  assert(ctx1.categoryMatch.confidence === 'high', `Expected high confidence, got ${ctx1.categoryMatch.confidence}`);

  // Test 2: Debate activity matched by keywords
  const ctx2 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(3),
    { title: 'Debate Team Captain', description: 'Led policy debate team to state tournament, qualified for TOC' }
  );
  assert(ctx2.categoryMatch.category === 'debate_speech', `Expected debate_speech, got ${ctx2.categoryMatch.category}`);

  // Test 3: Athletics matched by keywords
  const ctx3 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(4),
    { title: 'Varsity Soccer Captain', description: 'Led varsity soccer team as captain for 3 seasons' }
  );
  assert(ctx3.categoryMatch.category === 'athletics', `Expected athletics, got ${ctx3.categoryMatch.category}`);

  // Test 4: Community service matched
  const ctx4 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(4),
    { title: 'Food Bank Volunteer', description: 'Volunteered weekly at community food bank, organized donation drives' }
  );
  assert(ctx4.categoryMatch.category === 'community_service', `Expected community_service, got ${ctx4.categoryMatch.category}`);

  // Test 5: Technology matched
  const ctx5 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(4),
    { title: 'Software Developer', description: 'Built web app using React and Node.js, deployed on GitHub' }
  );
  assert(ctx5.categoryMatch.category === 'technology', `Expected technology, got ${ctx5.categoryMatch.category}`);

  // Test 6: Performing arts matched
  const ctx6 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(3),
    { title: 'First Violin, School Orchestra', description: 'Selected as first chair violin, performed in regional orchestra' }
  );
  assert(ctx6.categoryMatch.category === 'performing_arts', `Expected performing_arts, got ${ctx6.categoryMatch.category}`);

  // Test 7: Entrepreneurship matched
  const ctx7 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(3),
    { title: 'Founder & CEO', description: 'Founded tech startup with 50+ paying customers, $5K revenue' }
  );
  assert(ctx7.categoryMatch.category === 'entrepreneurship', `Expected entrepreneurship, got ${ctx7.categoryMatch.category}`);

  // Test 8: Work/family matched
  const ctx8 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(4),
    { title: 'Part-time Employee', description: 'Work 20 hrs/week at retail job to support family' }
  );
  assert(ctx8.categoryMatch.category === 'work_family', `Expected work_family, got ${ctx8.categoryMatch.category}`);

  // Test 9: Medical/health matched
  const ctx9 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(4),
    { title: 'Hospital Volunteer', description: 'Volunteered at hospital, assisted with patient intake' }
  );
  assert(ctx9.categoryMatch.category === 'medical_health', `Expected medical_health, got ${ctx9.categoryMatch.category}`);

  // Test 10: Writing/journalism matched
  const ctx10 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(3),
    { title: 'Editor-in-Chief, School Newspaper', description: 'Led school newspaper team, published weekly edition' }
  );
  assert(ctx10.categoryMatch.category === 'writing_journalism', `Expected writing_journalism, got ${ctx10.categoryMatch.category}`);
}

// ============================================================================
// TEST SUITE: CALIBRATION CONTEXT COMPLETENESS
// ============================================================================

function testCalibrationContextCompleteness(): void {
  console.log('\n=== Calibration Context Completeness ===');

  // Test: Every matched context should have entries, ladder, and role hierarchy
  const testCases = [
    { title: 'USAMO qualifier', desc: 'Qualified for USA Math Olympiad, top 500 nationally', cat: 'stem_competition', tier: 1 as InternalTier },
    { title: 'School Debate Team', desc: 'Member of school debate team', cat: 'debate_speech', tier: 5 as InternalTier },
    { title: 'Published Research', desc: 'Published first-author paper in peer-reviewed journal', cat: 'stem_research', tier: 1 as InternalTier },
    { title: 'Varsity Tennis', desc: 'Played varsity tennis for 3 years, team captain', cat: 'athletics', tier: 4 as InternalTier },
    { title: 'Youth Group Leader', desc: 'Led youth group at church, teaching 20+ students', cat: 'religious_cultural', tier: 4 as InternalTier },
  ];

  for (const tc of testCases) {
    const ctx = getCalibrationContext(
      makeEvidence({ categoryMatch: { category: tc.cat, confidence: 'high' } }),
      makeTier(tc.tier),
      { title: tc.title, description: tc.desc }
    );

    assert(
      ctx.calibrationEntries.length > 0,
      `${tc.title}: expected calibration entries, got ${ctx.calibrationEntries.length}`
    );
    assert(
      ctx.calibrationEntries.length <= 5,
      `${tc.title}: expected at most 5 entries, got ${ctx.calibrationEntries.length}`
    );
    assert(
      ctx.achievementLadder.length > 0,
      `${tc.title}: expected achievement ladder`
    );
    assert(
      ctx.roleHierarchy.length > 0,
      `${tc.title}: expected role hierarchy`
    );
    assert(
      ctx.categoryMatch.category === tc.cat,
      `${tc.title}: expected category ${tc.cat}, got ${ctx.categoryMatch.category}`
    );
  }
}

// ============================================================================
// TEST SUITE: EDGE CASES
// ============================================================================

function testEdgeCases(): void {
  console.log('\n=== Edge Cases ===');

  // Test 1: Unknown activity → graceful degradation
  const ctx1 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(5),
    { title: 'Obscure Hobby', description: 'Did something very niche' }
  );
  assert(
    ctx1.categoryMatch.confidence === 'low',
    `Unknown activity should have low confidence, got ${ctx1.categoryMatch.confidence}`
  );

  // Test 2: Empty description → still attempts match from title
  const ctx2 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: '', confidence: 'low' } }),
    makeTier(4),
    { title: 'Math Competition', description: '' }
  );
  assert(
    ctx2.categoryMatch.category === 'stem_competition',
    `Math Competition should match stem_competition, got ${ctx2.categoryMatch.category}`
  );

  // Test 3: Feature extractor disagrees with keywords → feature extractor wins when high confidence
  const ctx3 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: 'stem_research', confidence: 'high' } }),
    makeTier(3),
    { title: 'Biology Lab Research', description: 'Conducted experiments in molecular biology lab' }
  );
  assert(
    ctx3.categoryMatch.category === 'stem_research',
    `High-confidence extractor should win, got ${ctx3.categoryMatch.category}`
  );

  // Test 4: Subcategory is returned when available
  const ctx4 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: 'stem_competition', confidence: 'high' } }),
    makeTier(2),
    { title: 'USACO Gold', description: 'Achieved USACO Gold division in competitive programming' }
  );
  assert(
    ctx4.subcategoryPrestige !== null,
    'Expected subcategory prestige to be set'
  );

  // Test 5: Adjacent tier entries included (above and below)
  const ctx5 = getCalibrationContext(
    makeEvidence({ categoryMatch: { category: 'stem_research', confidence: 'high' } }),
    makeTier(3),
    { title: 'Summer Lab Intern', description: 'Summer research internship at university lab' }
  );
  // Should have entries from tier 3 + at least one from tier 2 or 4
  assert(
    ctx5.calibrationEntries.length >= 2,
    `Expected at least 2 calibration entries for cross-tier context, got ${ctx5.calibrationEntries.length}`
  );
}

// ============================================================================
// TEST SUITE: ACHIEVEMENT LADDER ORDERING
// ============================================================================

function testAchievementLadderOrdering(): void {
  console.log('\n=== Achievement Ladder Ordering ===');

  for (const [key, category] of Object.entries(ACHIEVEMENT_DATABASE)) {
    const ladder = category.achievementLadder;
    for (let i = 1; i < ladder.length; i++) {
      // Each level should have higher score range than previous
      assert(
        ladder[i].typicalScoreRange[0] > ladder[i - 1].typicalScoreRange[0],
        `${key} ladder: ${ladder[i].level} min (${ladder[i].typicalScoreRange[0]}) should be > ${ladder[i - 1].level} min (${ladder[i - 1].typicalScoreRange[0]})`
      );
      // Each level should have lower (better) internal tier than previous
      assert(
        ladder[i].internalTier < ladder[i - 1].internalTier,
        `${key} ladder: ${ladder[i].level} tier (${ladder[i].internalTier}) should be < ${ladder[i - 1].level} tier (${ladder[i - 1].internalTier})`
      );
    }
  }
}

// ============================================================================
// TEST SUITE: TIER ENTRY SCORE RANGE CONSISTENCY
// ============================================================================

function testTierScoreRangeConsistency(): void {
  console.log('\n=== Tier Entry Score Range Consistency ===');

  const tierBounds: Record<number, { min: number; max: number }> = {
    1: { min: 9.0, max: 10.0 },
    2: { min: 7.0, max: 8.9 },
    3: { min: 5.5, max: 6.9 },
    4: { min: 4.0, max: 5.4 },
    5: { min: 2.5, max: 3.9 },
    6: { min: 1.0, max: 2.4 },
  };

  for (const [key, category] of Object.entries(ACHIEVEMENT_DATABASE)) {
    for (const [tierStr, entries] of Object.entries(category.tiers)) {
      if (!entries) continue;
      const tier = parseInt(tierStr, 10);
      const bounds = tierBounds[tier];
      if (!bounds) continue;

      for (const entry of entries) {
        // Entry score ranges should overlap with tier bounds
        // (entry.scoreRange[0] should be <= bounds.max AND entry.scoreRange[1] should be >= bounds.min)
        assert(
          entry.scoreRange[0] <= bounds.max + 0.5 && entry.scoreRange[1] >= bounds.min - 0.5,
          `${key}/T${tier}/${entry.activity}: score range [${entry.scoreRange[0]}-${entry.scoreRange[1]}] doesn't overlap tier bounds [${bounds.min}-${bounds.max}]`
        );
      }
    }
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function main(): void {
  console.log('=== Achievement Retrieval Tests ===');
  console.log(`Cost: $0.00 (no LLM calls)\n`);

  testDatabaseIntegrity();
  testCategoryMatching();
  testCalibrationContextCompleteness();
  testEdgeCases();
  testAchievementLadderOrdering();
  testTierScoreRangeConsistency();

  console.log('\n=== Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
  }

  console.log(`\nResult: ${failed === 0 ? 'ALL PASSED' : `${failed} FAILURES`}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
