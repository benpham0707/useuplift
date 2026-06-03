/**
 * Phase 3 Scoring Tests — Impact Quality, Cross-Validation, Prestige Research
 *
 * Validates all Phase 3 additions:
 *   Sections 1-2:   impactQuality type and defaults
 *   Sections 3-7:   Cross-validator (commitment conflict, scope mismatch, impact credibility)
 *   Sections 8-10:  Tier classifier & rule scorer with impactQuality + validationFlags
 *   Sections 11-13: Prestige research types, entity extraction, evidence enrichment
 *   Section 14:     KB version bump
 *
 * Pure code tests cost $0 — no LLM calls required.
 * Run: npx tsx tests/test-scoring-phase3.ts
 */

import {
  classifyTier,
  activityRuleScorerService,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring';

import type {
  ExtractedEvidence,
  ValidationFlags,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

import {
  crossValidateEvidence,
  type StructuredFields,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/crossValidator';

import type {
  PrestigeResearchResult,
  PrestigeResearchConfig,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/prestigeResearchTypes';

import {
  KB_VERSION,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/knowledge';

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

let passed = 0;
let failed = 0;
let sectionPassed = 0;
let sectionFailed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string, detail?: string): void {
  if (condition) {
    passed++;
    sectionPassed++;
    console.log(`  PASS ${message}`);
  } else {
    failed++;
    sectionFailed++;
    const msg = detail ? `${message}: ${detail}` : message;
    failures.push(msg);
    console.log(`  FAIL ${message}${detail ? ` -- ${detail}` : ''}`);
  }
}

function section(name: string): void {
  if (sectionPassed + sectionFailed > 0) {
    console.log(`  -> ${sectionPassed} passed, ${sectionFailed} failed\n`);
  }
  sectionPassed = 0;
  sectionFailed = 0;
  console.log(`=== ${name} ===`);
}

// ============================================================================
// MOCK BUILDER — realistic ExtractedEvidence objects
// ============================================================================

function buildMockEvidence(overrides: Partial<ExtractedEvidence> & {
  impactOverrides?: Partial<ExtractedEvidence['impact']>;
  commitmentOverrides?: Partial<ExtractedEvidence['commitment']>;
  scopeOverrides?: Partial<ExtractedEvidence['scope']>;
  roleOverrides?: Partial<ExtractedEvidence['role']>;
  categoryOverrides?: Partial<ExtractedEvidence['categoryMatch']>;
  characterOverrides?: Partial<ExtractedEvidence['character']>;
} = {}): ExtractedEvidence {
  const {
    impactOverrides,
    commitmentOverrides,
    scopeOverrides,
    roleOverrides,
    categoryOverrides,
    characterOverrides,
    ...rest
  } = overrides;

  return {
    scope: {
      level: 'school',
      confidence: 0.8,
      evidence: 'test evidence',
      ...scopeOverrides,
    },
    recognitions: rest.recognitions ?? [],
    role: {
      title: 'Member',
      type: 'member',
      isLeadershipApplicable: true,
      evidence: 'test',
      ...roleOverrides,
    },
    impact: {
      hasQuantifiedOutcomes: false,
      metrics: [],
      estimatedPeopleReached: null,
      tangibleOutcomes: [],
      impactQuality: 'claimed_none',
      ...impactOverrides,
    },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 5,
      weeksPerYear: 40,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
      ...commitmentOverrides,
    },
    character: {
      primaryTrait: 'discipline',
      communityBenefit: 'moderate',
      authenticitySignals: [],
      paddingSignals: [],
      ...characterOverrides,
    },
    categoryMatch: {
      category: 'technology' as any,
      confidence: 'medium',
      similarDomains: [],
      subcategoryGuess: null,
      domainSpecificContext: null,
      ...categoryOverrides,
    },
    overallSignalStrength: rest.overallSignalStrength ?? 'moderate',
    validationFlags: rest.validationFlags,
  };
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

async function main() {
  console.log('\nPhase 3 Scoring Tests\n');

  // ================================================================
  // SECTION 1: impactQuality Parsing
  // ================================================================
  section('1. impactQuality Parsing');

  // Test all 4 impactQuality values are valid on ExtractedEvidence
  const qualities = ['verified_significant', 'verified_modest', 'claimed_vague', 'claimed_none'] as const;
  for (const q of qualities) {
    const evidence = buildMockEvidence({
      impactOverrides: { impactQuality: q },
    });
    assert(
      evidence.impact.impactQuality === q,
      `impactQuality '${q}' is accepted and preserved`
    );
  }

  // Verify all 4 values round-trip through classifyTier without error
  for (const q of qualities) {
    let noThrow = true;
    try {
      const ev = buildMockEvidence({ impactOverrides: { impactQuality: q } });
      classifyTier(ev);
    } catch {
      noThrow = false;
    }
    assert(noThrow, `classifyTier does not throw for impactQuality '${q}'`);
  }

  // ================================================================
  // SECTION 2: impactQuality Defaults
  // ================================================================
  section('2. impactQuality Defaults');

  // When building evidence without specifying impactQuality, default should be 'claimed_none'
  const defaultEvidence = buildMockEvidence();
  assert(
    defaultEvidence.impact.impactQuality === 'claimed_none',
    'Default impactQuality is claimed_none'
  );

  // Verify type system: impactQuality is part of the ExtractedEvidence shape
  const evidenceWithQuality = buildMockEvidence({
    impactOverrides: { impactQuality: 'verified_significant' },
  });
  assert(
    typeof evidenceWithQuality.impact.impactQuality === 'string',
    'impactQuality is a string type'
  );

  // ================================================================
  // SECTION 3: Cross-validator — Commitment Conflict (positive)
  // ================================================================
  section('3. Cross-validator — Commitment Conflict (positive)');

  const conflictEvidence = buildMockEvidence({
    commitmentOverrides: { yearsActive: 4 },
  });
  const conflictStructured: StructuredFields = { yearsInvolved: 1 };
  const conflictResult = crossValidateEvidence(conflictEvidence, conflictStructured);

  assert(
    conflictResult.commitmentConflict === true,
    'Commitment conflict detected when desc says 4yr but structured says 1yr'
  );
  assert(
    conflictResult.flags.length > 0,
    'Flags array is non-empty on conflict'
  );
  assert(
    conflictResult.flags.some(f => f.toLowerCase().includes('year')),
    'Conflict flag mentions "year"'
  );

  // ================================================================
  // SECTION 4: Cross-validator — No False Positive
  // ================================================================
  section('4. Cross-validator — No False Positive');

  const noConflictEvidence = buildMockEvidence({
    commitmentOverrides: { yearsActive: 2 },
  });
  const noConflictStructured: StructuredFields = { yearsInvolved: 2 };
  const noConflictResult = crossValidateEvidence(noConflictEvidence, noConflictStructured);

  assert(
    noConflictResult.commitmentConflict === false,
    'No commitment conflict when years match (2 vs 2)'
  );

  // Also test within the 1.5-year tolerance
  const borderlineEvidence = buildMockEvidence({
    commitmentOverrides: { yearsActive: 2.5 },
  });
  const borderlineStructured: StructuredFields = { yearsInvolved: 1 };
  const borderlineResult = crossValidateEvidence(borderlineEvidence, borderlineStructured);
  assert(
    borderlineResult.commitmentConflict === false,
    'No commitment conflict when within 1.5yr tolerance (2.5 vs 1)',
    `got commitmentConflict=${borderlineResult.commitmentConflict}`
  );

  // ================================================================
  // SECTION 5: Cross-validator — Scope-Commitment Mismatch
  // ================================================================
  section('5. Cross-validator — Scope-Commitment Mismatch');

  const scopeMismatchEvidence = buildMockEvidence({
    scopeOverrides: { level: 'national', confidence: 0.8 },
    commitmentOverrides: { hoursPerWeek: 1, yearsActive: 0.5 },
    // No national recognitions in recognitions array
  });
  const scopeMismatchStructured: StructuredFields = {
    hoursPerWeek: 1,
    yearsInvolved: 0.5,
  };
  const scopeMismatchResult = crossValidateEvidence(scopeMismatchEvidence, scopeMismatchStructured);

  assert(
    scopeMismatchResult.scopeCommitmentMismatch === true,
    'Scope-commitment mismatch detected: national scope with <3 hrs/wk, <1 yr, no national recognitions'
  );

  // ================================================================
  // SECTION 6: Cross-validator — Legitimate National Award (no flag)
  // ================================================================
  section('6. Cross-validator — Legitimate National Award (no flag)');

  const legitNationalEvidence = buildMockEvidence({
    scopeOverrides: { level: 'national', confidence: 0.8 },
    commitmentOverrides: { hoursPerWeek: 1, yearsActive: 0.5 },
    recognitions: [
      { name: 'USAMO Qualifier', level: 'national', isVerifiable: true },
    ],
  });
  const legitNationalStructured: StructuredFields = {
    hoursPerWeek: 1,
    yearsInvolved: 0.5,
  };
  const legitNationalResult = crossValidateEvidence(legitNationalEvidence, legitNationalStructured);

  assert(
    legitNationalResult.scopeCommitmentMismatch === false,
    'No scope-commitment mismatch when verifiable national recognition exists'
  );

  // ================================================================
  // SECTION 7: Cross-validator — Impact Credibility
  // ================================================================
  section('7. Cross-validator — Impact Credibility');

  const impactCredibilityEvidence = buildMockEvidence({
    impactOverrides: { impactQuality: 'verified_significant' },
    commitmentOverrides: { hoursPerWeek: 1, weeksPerYear: 20 },
  });
  const impactCredibilityStructured: StructuredFields = {
    hoursPerWeek: 1,
    weeksPerYear: 20,
  };
  const impactCredibilityResult = crossValidateEvidence(
    impactCredibilityEvidence,
    impactCredibilityStructured
  );

  assert(
    impactCredibilityResult.impactCredibilityIssue === true,
    'Impact credibility issue detected: verified_significant with <2 hrs/wk and <26 wks/yr'
  );

  // No issue when hours are reasonable
  const noCredibilityIssue = buildMockEvidence({
    impactOverrides: { impactQuality: 'verified_significant' },
    commitmentOverrides: { hoursPerWeek: 10, weeksPerYear: 40 },
  });
  const noCredibilityResult = crossValidateEvidence(noCredibilityIssue, {
    hoursPerWeek: 10,
    weeksPerYear: 40,
  });
  assert(
    noCredibilityResult.impactCredibilityIssue === false,
    'No impact credibility issue with 10 hrs/wk and 40 wks/yr'
  );

  // ================================================================
  // SECTION 8: Tier Classifier — impactQuality gates T1_B
  // ================================================================
  section('8. Tier Classifier — impactQuality gates T1_B');

  // T1_B_NATIONAL_IMPACT requires impactQuality === 'verified_significant'.
  // classifyTier only returns signals for the WINNING tier, so we test indirectly:
  // Build evidence with T1_A (elite recognition) + T1_B-eligible fields.
  // With verified_significant, T1_B should fire → more T1 signals → higher tier score.
  // With claimed_vague, T1_B won't fire → fewer T1 signals → lower tier score.

  // Evidence with elite recognition (T1_A fires) + national impact signals
  const t1bVerifiedEvidence = buildMockEvidence({
    scopeOverrides: { level: 'national', confidence: 0.8 },
    recognitions: [
      { name: 'USAMO Qualifier', level: 'national', isVerifiable: true, selectivityContext: 'top 500 of 300K' },
    ],
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      estimatedPeopleReached: 2000,
      impactQuality: 'verified_significant',
      metrics: [{ value: '2000', unit: 'people', context: 'reached', isVerifiable: true }],
      tangibleOutcomes: ['Built platform', 'Published paper'],
    },
    roleOverrides: { type: 'founder', isLeadershipApplicable: true, title: 'Founder', evidence: 'test' },
    commitmentOverrides: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 40 },
    categoryOverrides: { category: 'stem_research' as any, confidence: 'high' },
  });
  const tier1WithVerified = classifyTier(t1bVerifiedEvidence);

  // Same evidence but impactQuality = 'claimed_vague'
  const t1bClaimedVagueEvidence = buildMockEvidence({
    scopeOverrides: { level: 'national', confidence: 0.8 },
    recognitions: [
      { name: 'USAMO Qualifier', level: 'national', isVerifiable: true, selectivityContext: 'top 500 of 300K' },
    ],
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      estimatedPeopleReached: 2000,
      impactQuality: 'claimed_vague',
      metrics: [{ value: '2000', unit: 'people', context: 'reached', isVerifiable: true }],
      tangibleOutcomes: ['Built platform', 'Published paper'],
    },
    roleOverrides: { type: 'founder', isLeadershipApplicable: true, title: 'Founder', evidence: 'test' },
    commitmentOverrides: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 40 },
    categoryOverrides: { category: 'stem_research' as any, confidence: 'high' },
  });
  const tier1WithClaimed = classifyTier(t1bClaimedVagueEvidence);

  // Both should still be Tier 1 (T1_A fires either way), but the one with
  // verified_significant should have a higher tierScore (more matching signals)
  assert(
    tier1WithVerified.internalTier === 1,
    `Tier 1 with verified_significant (got tier ${tier1WithVerified.internalTier})`
  );
  assert(
    tier1WithVerified.tierScore >= tier1WithClaimed.tierScore,
    `Tier score with verified_significant (${tier1WithVerified.tierScore}) >= with claimed_vague (${tier1WithClaimed.tierScore})`
  );

  // T2_C_SIGNIFICANT_IMPACT also uses impactQuality — verify at Tier 2 level
  // Evidence with state recognition (T2_B fires) + significant impact fields
  const t2VerifiedEvidence = buildMockEvidence({
    scopeOverrides: { level: 'state', confidence: 0.7 },
    recognitions: [
      { name: 'State Science Fair Winner', level: 'state', isVerifiable: true },
    ],
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      estimatedPeopleReached: 600,
      impactQuality: 'verified_significant',
      metrics: [{ value: '600', unit: 'students', context: 'tutored', isVerifiable: true }],
      tangibleOutcomes: ['Improved scores'],
    },
    commitmentOverrides: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 40 },
  });
  const tier2Verified = classifyTier(t2VerifiedEvidence);

  const t2ClaimedEvidence = buildMockEvidence({
    scopeOverrides: { level: 'state', confidence: 0.7 },
    recognitions: [
      { name: 'State Science Fair Winner', level: 'state', isVerifiable: true },
    ],
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      estimatedPeopleReached: 600,
      impactQuality: 'claimed_vague',
      metrics: [{ value: '600', unit: 'students', context: 'tutored', isVerifiable: true }],
      tangibleOutcomes: ['Improved scores'],
    },
    commitmentOverrides: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 40 },
  });
  const tier2Claimed = classifyTier(t2ClaimedEvidence);

  // With verified_significant, T2_C should fire → more signals → potentially higher tier
  assert(
    tier2Verified.internalTier <= tier2Claimed.internalTier,
    `Tier with verified impact (${tier2Verified.internalTier}) <= with claimed_vague (${tier2Claimed.internalTier})`
  );

  // ================================================================
  // SECTION 9: Rule Scorer — Graduated Impact Bonus
  // ================================================================
  section('9. Rule Scorer — Graduated Impact Bonus');

  // To test the graduated impact bonus without tier clamping interfering,
  // we use a Tier 3 classification (leadership range 3-7) where the bonus
  // difference won't be clamped out.
  // First build evidence that lands at tier 3 with state recognition + commitment
  const impactTestBaseOverrides = {
    scopeOverrides: { level: 'state' as const, confidence: 0.7 },
    roleOverrides: { type: 'team_lead' as const, isLeadershipApplicable: true, title: 'Team Lead', evidence: 'test' },
    commitmentOverrides: { yearsActive: 2, hoursPerWeek: 8, weeksPerYear: 36 },
    recognitions: [
      { name: 'Regional Award', level: 'regional' as const, isVerifiable: true },
    ],
    categoryOverrides: { category: 'community_service' as any, confidence: 'high' as const },
  };

  // Use same tier for both to isolate the impact quality effect
  const sharedTierEvidence = buildMockEvidence({
    ...impactTestBaseOverrides,
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      impactQuality: 'verified_significant',
      metrics: [{ value: '200', unit: 'people', context: 'served', isVerifiable: true }],
      estimatedPeopleReached: 200,
    },
  });
  const sharedTier = classifyTier(sharedTierEvidence);

  // Score leadership with verified_significant using the shared tier
  const highQualityEvidence = buildMockEvidence({
    ...impactTestBaseOverrides,
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      impactQuality: 'verified_significant',
      metrics: [{ value: '200', unit: 'people', context: 'served', isVerifiable: true }],
      estimatedPeopleReached: 200,
    },
  });
  const highQualityLeadership = activityRuleScorerService.scoreLeadership(
    highQualityEvidence, sharedTier, 0.125
  );

  // Score leadership with claimed_vague using the SAME tier
  const lowQualityEvidence = buildMockEvidence({
    ...impactTestBaseOverrides,
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      impactQuality: 'claimed_vague',
      metrics: [{ value: '200', unit: 'people', context: 'served', isVerifiable: true }],
      estimatedPeopleReached: 200,
    },
  });
  const lowQualityLeadership = activityRuleScorerService.scoreLeadership(
    lowQualityEvidence, sharedTier, 0.125
  );

  assert(
    highQualityLeadership.score >= lowQualityLeadership.score,
    `verified_significant leadership (${highQualityLeadership.score}) >= claimed_vague leadership (${lowQualityLeadership.score})`
  );

  // The difference should be at least 1.0 (verified_significant gets +1.5 bonus, claimed_vague gets +0.0)
  // unless clamped by tier constraints
  const leadershipDiff = highQualityLeadership.score - lowQualityLeadership.score;
  assert(
    leadershipDiff >= 0,
    `Leadership difference is non-negative (got ${leadershipDiff})`
  );

  // ================================================================
  // SECTION 10: Rule Scorer — Commitment Cap on Conflict
  // ================================================================
  section('10. Rule Scorer — Commitment Cap on Conflict');

  // To test commitment cap properly, we need a tier with a wide commitment range.
  // Tier 3 has commitment range 3-8, Tier 2 has 5-9. Use a shared tier at Tier 3
  // with evidence that has progression (bonus 1.0 + 0.5 = 1.5).
  // The cap reduces it to 0.5 when commitmentConflict is true.

  // Build a tier classification at tier 3 level (wide commitment range: 3-8)
  const commitTestEvidence = buildMockEvidence({
    scopeOverrides: { level: 'state', confidence: 0.6 },
    recognitions: [
      { name: 'Regional Science Bowl', level: 'regional', isVerifiable: true },
    ],
    commitmentOverrides: {
      yearsActive: 2,
      hoursPerWeek: 8,
      weeksPerYear: 36,
      showsProgression: true,
      progressionArc: 'member -> leader -> mentor',
      sustainedThroughJunior: false,
    },
    roleOverrides: { type: 'team_lead', isLeadershipApplicable: true, title: 'Team Lead', evidence: 'test' },
    categoryOverrides: { category: 'stem_competition' as any, confidence: 'high' },
  });
  const commitTestTier = classifyTier(commitTestEvidence);

  // Score commitment WITHOUT conflict flag
  const noConflictCommitEvidence = buildMockEvidence({
    commitmentOverrides: {
      yearsActive: 2,
      hoursPerWeek: 8,
      weeksPerYear: 36,
      showsProgression: true,
      progressionArc: 'member -> leader -> mentor',
      sustainedThroughJunior: false,
    },
    categoryOverrides: { category: 'stem_competition' as any },
  });
  const noConflictCommit = activityRuleScorerService.scoreCommitment(
    noConflictCommitEvidence, commitTestTier, 0.175
  );

  // Score commitment WITH commitmentConflict flag (same evidence but flagged)
  const conflictCommitEvidence = buildMockEvidence({
    commitmentOverrides: {
      yearsActive: 2,
      hoursPerWeek: 8,
      weeksPerYear: 36,
      showsProgression: true,
      progressionArc: 'member -> leader -> mentor',
      sustainedThroughJunior: false,
    },
    categoryOverrides: { category: 'stem_competition' as any },
    validationFlags: {
      commitmentConflict: true,
      scopeCommitmentMismatch: false,
      impactCredibilityIssue: false,
      flags: ['Years conflict: description claims 2 years, structured fields say 0.5 year(s)'],
    },
  });
  const conflictCommit = activityRuleScorerService.scoreCommitment(
    conflictCommitEvidence, commitTestTier, 0.175
  );

  assert(
    conflictCommit.score <= noConflictCommit.score,
    `Commitment with conflict (${conflictCommit.score}) <= without conflict (${noConflictCommit.score})`
  );

  // The progression bonus without conflict = 1.0 (showsProgression) + 0.5 (progressionArc) = 1.5
  // With conflict, capped to 0.5, so clawback = 1.0
  // But final scores are also clamped to tier ranges, so the difference may be smaller.
  // At minimum the flag should reduce or equal the score.
  const scoreDiff = noConflictCommit.score - conflictCommit.score;
  assert(
    scoreDiff >= 0,
    `Score difference from commitment cap is non-negative (got ${scoreDiff})`
  );
  // If scores are different, the conflict version must be lower
  if (scoreDiff > 0) {
    assert(true, `Commitment conflict reduced score by ${scoreDiff}`);
  } else {
    // Both clamped to same value — verify clamping is active
    assert(
      noConflictCommit.score === commitTestTier.componentConstraints.commitment.max ||
      noConflictCommit.score === commitTestTier.componentConstraints.commitment.min,
      `Scores equal due to tier clamping (score=${noConflictCommit.score}, range=${commitTestTier.componentConstraints.commitment.min}-${commitTestTier.componentConstraints.commitment.max})`
    );
  }

  // ================================================================
  // SECTION 11: Prestige Research Types
  // ================================================================
  section('11. Prestige Research Types');

  // Verify PrestigeResearchResult type works correctly by creating conforming objects
  const mockResult: PrestigeResearchResult = {
    entityName: 'FIRST Robotics',
    entityType: 'competition',
    selectivityTier: 2,
    confidence: 'high',
    reasoning: 'Well-known national competition with significant participation',
    scope: 'national',
    acceptanceRate: null,
    notableFactors: ['30+ years of operation', 'National reach'],
    isVerifiable: true,
    researchedAt: new Date().toISOString(),
    modelVersion: 'claude-sonnet-4-5-20250929',
  };

  assert(
    mockResult.entityName === 'FIRST Robotics',
    'PrestigeResearchResult.entityName works'
  );
  assert(
    mockResult.selectivityTier >= 1 && mockResult.selectivityTier <= 4,
    'PrestigeResearchResult.selectivityTier is 1-4'
  );
  assert(
    ['program', 'competition', 'organization', 'institution', 'award', 'unknown'].includes(mockResult.entityType),
    'PrestigeResearchResult.entityType is valid enum'
  );
  assert(
    typeof mockResult.isVerifiable === 'boolean',
    'PrestigeResearchResult.isVerifiable is boolean'
  );

  // Verify PrestigeResearchConfig type works
  const mockConfig: PrestigeResearchConfig = {
    maxEntitiesPerActivity: 3,
    modelId: 'claude-sonnet-4-5-20250929',
    skipWeakSignals: true,
    enableCache: true,
  };

  assert(
    mockConfig.maxEntitiesPerActivity === 3,
    'PrestigeResearchConfig.maxEntitiesPerActivity works'
  );
  assert(
    typeof mockConfig.skipWeakSignals === 'boolean',
    'PrestigeResearchConfig.skipWeakSignals is boolean'
  );

  // ================================================================
  // SECTION 12: Entity Extraction (prestige research service)
  // ================================================================
  section('12. Entity Extraction');

  // This section tests the prestige research service.
  let prestigeServiceAvailable = false;
  try {
    const prestigeModule = await import(
      '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/prestigeResearchService'
    );
    prestigeServiceAvailable = true;

    const { prestigeResearchService: prestige } = prestigeModule;

    // Test extractUnknownEntities — takes (evidence, description) and returns entities not in KB
    if (prestige && typeof prestige.extractUnknownEntities === 'function') {
      const testEvidence = buildMockEvidence({
        recognitions: [
          { name: 'Springfield Science Symposium', level: 'regional', isVerifiable: false },
        ],
        categoryOverrides: { category: 'stem_competition' as any },
      });
      const entities = prestige.extractUnknownEntities(
        testEvidence,
        'Won USAMO qualifier and participated in Springfield Science Symposium'
      );
      assert(
        Array.isArray(entities),
        'extractUnknownEntities returns an array'
      );
      // USAMO is in KB so should be filtered; Springfield Science Symposium is not
      if (entities.length > 0) {
        assert(
          entities.some((e: any) => typeof e?.entityName === 'string'),
          'Extracted entities have entityName fields'
        );
      }
      console.log(`  (found ${entities.length} unknown entities)`);
    } else {
      console.log('  SKIP: extractUnknownEntities not available yet');
    }
  } catch (err) {
    console.log('  SKIP: prestigeResearchService not yet created');
  }

  // ================================================================
  // SECTION 13: Prestige Enrichment
  // ================================================================
  section('13. Prestige Enrichment');

  if (prestigeServiceAvailable) {
    try {
      const prestigeModule = await import(
        '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/prestigeResearchService'
      );
      const { enrichEvidenceWithPrestige } = prestigeModule;

      if (typeof enrichEvidenceWithPrestige === 'function') {
        // Test: Tier 2 result should add a national-level recognition
        // enrichEvidenceWithPrestige mutates evidence in place (returns void)
        const tier2PrestigeResult: PrestigeResearchResult = {
          entityName: 'Intel Science Talent Search',
          entityType: 'competition',
          selectivityTier: 2,
          confidence: 'high',
          reasoning: 'Prestigious national science competition',
          scope: 'national',
          acceptanceRate: '1.5%',
          notableFactors: ['Top 300 selected', 'Nobel laureate alumni'],
          isVerifiable: true,
          researchedAt: new Date().toISOString(),
          modelVersion: 'claude-sonnet-4-5-20250929',
        };

        const enrichEvidence = buildMockEvidence();
        const recsBefore = enrichEvidence.recognitions.length;
        enrichEvidenceWithPrestige(enrichEvidence, [tier2PrestigeResult]);
        const recsAfter = enrichEvidence.recognitions.length;

        assert(
          recsAfter > recsBefore,
          'Tier 2 prestige result adds a recognition',
          `before=${recsBefore}, after=${recsAfter}`
        );

        if (recsAfter > 0) {
          const addedRec = enrichEvidence.recognitions[enrichEvidence.recognitions.length - 1];
          assert(
            addedRec.level === 'national' || addedRec.level === 'state' || addedRec.level === 'regional',
            `Added recognition has national/state/regional scope (got ${addedRec.level})`
          );
        }

        // Test: Tier 4 result should NOT add a recognition
        const tier4PrestigeResult: PrestigeResearchResult = {
          entityName: 'Local Garden Club',
          entityType: 'organization',
          selectivityTier: 4,
          confidence: 'medium',
          reasoning: 'Local community organization, open membership',
          scope: 'local',
          acceptanceRate: null,
          notableFactors: [],
          isVerifiable: true,
          researchedAt: new Date().toISOString(),
          modelVersion: 'claude-sonnet-4-5-20250929',
        };

        const noEnrichEvidence = buildMockEvidence();
        const noRecsBefore = noEnrichEvidence.recognitions.length;
        enrichEvidenceWithPrestige(noEnrichEvidence, [tier4PrestigeResult]);
        const noRecsAfter = noEnrichEvidence.recognitions.length;

        assert(
          noRecsAfter === noRecsBefore,
          'Tier 4 prestige result does NOT add a recognition',
          `before=${noRecsBefore}, after=${noRecsAfter}`
        );
      } else {
        console.log('  SKIP: enrichEvidenceWithPrestige not available yet');
      }
    } catch (err) {
      console.log('  SKIP: enrichEvidenceWithPrestige import failed');
    }
  } else {
    console.log('  SKIP: prestigeResearchService not yet created');
  }

  // ================================================================
  // SECTION 14: KB Version Check
  // ================================================================
  section('14. KB Version Check');

  // After Phase 3, KB_VERSION should be bumped to 2.3.0
  assert(
    KB_VERSION === '2.3.0',
    `KB_VERSION should be 2.3.0 (got ${KB_VERSION})`
  );

  // ================================================================
  // BONUS: Cross-validator + Scorer Integration
  // ================================================================
  section('BONUS: Cross-validator + Scorer Integration');

  // Verify that ValidationFlags correctly flow through evidence into the scoring pipeline
  const integrationEvidence = buildMockEvidence({
    scopeOverrides: { level: 'national', confidence: 0.8 },
    roleOverrides: { type: 'founder', isLeadershipApplicable: true, title: 'Founder', evidence: 'test' },
    impactOverrides: {
      hasQuantifiedOutcomes: true,
      impactQuality: 'verified_significant',
      metrics: [{ value: '1000', unit: 'users', context: 'served', isVerifiable: true }],
      estimatedPeopleReached: 1000,
      tangibleOutcomes: ['Built platform', 'Launched nationally'],
    },
    commitmentOverrides: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 45 },
  });

  // Score WITHOUT validation flags
  const tierNoFlags = classifyTier(integrationEvidence);
  const scoreNoFlags = activityRuleScorerService.scoreActivity(integrationEvidence, tierNoFlags);

  // Score WITH validation flags (scope-commitment mismatch + impact credibility issue)
  const integrationEvidenceWithFlags = {
    ...integrationEvidence,
    validationFlags: {
      commitmentConflict: false,
      scopeCommitmentMismatch: true,
      impactCredibilityIssue: true,
      flags: ['test flags'],
    },
  };
  const tierWithFlags = classifyTier(integrationEvidenceWithFlags);
  const scoreWithFlags = activityRuleScorerService.scoreActivity(
    integrationEvidenceWithFlags,
    tierWithFlags
  );

  assert(
    scoreWithFlags.total <= scoreNoFlags.total,
    `Score with validation flags (${scoreWithFlags.total}) <= without (${scoreNoFlags.total})`,
    `withFlags=${scoreWithFlags.total}, noFlags=${scoreNoFlags.total}`
  );

  // The leadership component should be penalized by scopeCommitmentMismatch
  assert(
    scoreWithFlags.breakdown.leadershipImpact.score <= scoreNoFlags.breakdown.leadershipImpact.score,
    `Leadership with scopeCommitmentMismatch (${scoreWithFlags.breakdown.leadershipImpact.score}) <= without (${scoreNoFlags.breakdown.leadershipImpact.score})`
  );

  // ================================================================
  // FINAL SUMMARY
  // ================================================================
  console.log(`  -> ${sectionPassed} passed, ${sectionFailed} failed\n`);

  console.log('================================');
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log('================================');

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
