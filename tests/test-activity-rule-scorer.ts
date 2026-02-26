/**
 * Activity Rule Scorer Unit Tests
 *
 * Tests the deterministic activity scoring (Layer 3b of decomposed scoring architecture).
 * All tests are pure code — no API calls, $0.00 cost.
 *
 * Expected: ALL tests pass. Any failure indicates a scoring rule issue.
 */

import {
  activityRuleScorerService,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/activityRuleScorer';
import {
  classifyTier,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/tierClassifier';
import type {
  ExtractedEvidence,
  TierClassification,
  ActivityScore,
  InternalTier,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import {
  TIER_SCORE_RANGES,
  TIER_COMPONENT_CONSTRAINTS,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import {
  STANDARD_WEIGHTS,
  NO_LEADERSHIP_WEIGHTS,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringRules';

// ============================================================================
// TEST HELPERS
// ============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Create a minimal ExtractedEvidence with defaults */
function makeEvidence(overrides: Partial<DeepPartial<ExtractedEvidence>> = {}): ExtractedEvidence {
  return {
    scope: {
      level: 'school',
      confidence: 0.5,
      evidence: 'default test evidence',
      ...overrides.scope,
    },
    recognitions: overrides.recognitions ?? [],
    role: {
      title: 'member',
      type: 'member',
      isLeadershipApplicable: true,
      evidence: 'default role evidence',
      ...overrides.role,
    },
    impact: {
      hasQuantifiedOutcomes: false,
      metrics: [],
      estimatedPeopleReached: null,
      tangibleOutcomes: [],
      ...overrides.impact,
    },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 3,
      weeksPerYear: 36,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
      ...overrides.commitment,
    },
    character: {
      primaryTrait: 'discipline',
      communityBenefit: 'minimal',
      authenticitySignals: [],
      paddingSignals: [],
      ...overrides.character,
    },
    categoryMatch: {
      category: 'leadership_government',
      confidence: 'medium',
      ...overrides.categoryMatch,
    },
    overallSignalStrength: overrides.overallSignalStrength ?? 'moderate',
  } as ExtractedEvidence;
}

/** Create a mock TierClassification */
function makeTier(internalTier: InternalTier, overrides: Partial<TierClassification> = {}): TierClassification {
  return {
    internalTier,
    externalTier: internalTier <= 2 ? 1 : internalTier <= 3 ? 2 : internalTier <= 5 ? 3 : 4,
    confidence: 'medium',
    signals: [],
    scoreRange: { ...TIER_SCORE_RANGES[internalTier] },
    componentConstraints: {
      recognition: { ...TIER_COMPONENT_CONSTRAINTS[internalTier].recognition },
      leadership: { ...TIER_COMPONENT_CONSTRAINTS[internalTier].leadership },
      community: { ...TIER_COMPONENT_CONSTRAINTS[internalTier].community },
      commitment: { ...TIER_COMPONENT_CONSTRAINTS[internalTier].commitment },
    },
    tierScore: TIER_SCORE_RANGES[internalTier].min + 1,
    reasoning: `Test classification at Tier ${internalTier}`,
    ...overrides,
  } as TierClassification;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertRange(value: number, min: number, max: number, label: string): void {
  assert(value >= min && value <= max, `${label}: expected ${min}-${max}, got ${value}`);
}

// ============================================================================
// TEST: Tier Assessment Component
// ============================================================================

console.log('\n=== Tier Assessment Component ===');

{
  const tier = makeTier(1, { tierScore: 9.5 });
  const result = activityRuleScorerService.scoreTierAssessment(tier, 0.30);
  assert(result.score === 9.5, 'Tier 1 score = tierScore');
  assert(result.tier === 1, 'External tier = 1');
  assert(result.weight === 0.30, 'Weight = 0.30');
  // round1(9.5 * 0.30) = round1(2.85) = 2.9 due to Math.round(28.5)=29
  assert(Math.abs(result.weightedScore - 2.9) < 0.01, 'Weighted score correct');
  console.log(`  Tier 1: score=${result.score}, weighted=${result.weightedScore}`);
}

{
  const tier = makeTier(4, { tierScore: 4.5 });
  const result = activityRuleScorerService.scoreTierAssessment(tier, 0.30);
  assert(result.score === 4.5, 'Tier 4 score = 4.5');
  assert(result.tier === 3, 'External tier = 3 (maps from internal 4)');
  console.log(`  Tier 4: score=${result.score}, ext=${result.tier}`);
}

// ============================================================================
// TEST: Recognition Component
// ============================================================================

console.log('\n=== Recognition Component ===');

{
  // No recognitions
  const evidence = makeEvidence({ recognitions: [] });
  const tier = makeTier(5);
  const result = activityRuleScorerService.scoreRecognition(evidence, tier, 0.25);
  assert(result.level === 'none', 'No recognitions → level none');
  assertRange(result.score, 1, 3, 'No recognitions within Tier 5 constraints');
  console.log(`  No recognitions: ${result.score}/10, level=${result.level}`);
}

{
  // National verifiable recognition
  const evidence = makeEvidence({
    recognitions: [
      { name: 'USAMO Qualifier', level: 'national', isVerifiable: true, selectivityContext: 'top 500 of 300K' },
    ],
  });
  const tier = makeTier(2);
  const result = activityRuleScorerService.scoreRecognition(evidence, tier, 0.25);
  assert(result.level === 'national', 'National recognition detected');
  assertRange(result.score, 6, 9, 'National + verifiable + selectivity within Tier 2');
  console.log(`  National: ${result.score}/10, level=${result.level}`);
}

{
  // School recognition (unverifiable)
  const evidence = makeEvidence({
    recognitions: [
      { name: 'Best Club Award', level: 'school', isVerifiable: false },
    ],
  });
  const tier = makeTier(4);
  const result = activityRuleScorerService.scoreRecognition(evidence, tier, 0.25);
  assert(result.level === 'school', 'School level');
  // School base (3.5) - 1 (unverifiable) = 2.5, clamped to Tier 4 recognition range [2, 5]
  assertRange(result.score, 2, 5, 'School unverifiable within Tier 4');
  console.log(`  School unverifiable: ${result.score}/10`);
}

// ============================================================================
// TEST: Leadership Component
// ============================================================================

console.log('\n=== Leadership Component ===');

{
  // Leadership N/A (solo research)
  const evidence = makeEvidence({
    role: { title: 'Researcher', type: 'contributor', isLeadershipApplicable: false, evidence: 'solo' },
  });
  const tier = makeTier(3);
  const result = activityRuleScorerService.scoreLeadership(evidence, tier, 0.125);
  assert(!result.isApplicable, 'Leadership N/A');
  assert(result.score === 0, 'N/A score = 0');
  assert(result.weight === 0, 'N/A weight = 0');
  assert(result.role === 'not_applicable', 'Role is not_applicable');
  console.log(`  N/A: score=${result.score}, applicable=${result.isApplicable}`);
}

{
  // Founder with national scope
  const evidence = makeEvidence({
    role: { title: 'Founder', type: 'founder', isLeadershipApplicable: true, evidence: 'founded org' },
    scope: { level: 'national', confidence: 0.8, evidence: 'national scope' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '500', unit: 'students', context: 'served', isVerifiable: true }],
      estimatedPeopleReached: 500,
      tangibleOutcomes: ['Served 500 students'],
    },
  });
  const tier = makeTier(2);
  const result = activityRuleScorerService.scoreLeadership(evidence, tier, 0.125);
  assert(result.isApplicable, 'Leadership applicable');
  assert(result.role === 'founder', 'Role is founder');
  assertRange(result.score, 5, 9, 'Founder + national scope within Tier 2');
  console.log(`  Founder national: ${result.score}/10`);
}

{
  // Basic member with leadership applicable
  const evidence = makeEvidence({
    role: { title: 'Member', type: 'member', isLeadershipApplicable: true, evidence: 'club member' },
  });
  const tier = makeTier(5);
  const result = activityRuleScorerService.scoreLeadership(evidence, tier, 0.125);
  assert(result.isApplicable, 'Leadership applicable');
  assertRange(result.score, 1, 3, 'Member within Tier 5 constraints');
  console.log(`  Member: ${result.score}/10`);
}

// ============================================================================
// TEST: Community & Character Component
// ============================================================================

console.log('\n=== Community & Character Component ===');

{
  // Significant community benefit, highly authentic
  const evidence = makeEvidence({
    character: {
      primaryTrait: 'service',
      communityBenefit: 'significant',
      authenticitySignals: ['visits every Saturday', 'knows residents by name'],
      paddingSignals: [],
    },
  });
  const tier = makeTier(3);
  const result = activityRuleScorerService.scoreCommunityCharacter(evidence, tier, 0.15);
  assert(result.primaryTrait === 'service', 'Trait is service');
  assert(result.communityBenefit === 'significant', 'Benefit is significant');
  assert(result.authenticitySignal === 'highly_authentic', 'Highly authentic signal');
  assertRange(result.score, 3, 8, 'High community score within Tier 3');
  console.log(`  Service + significant: ${result.score}/10`);
}

{
  // Self-focused with padding signals
  const evidence = makeEvidence({
    character: {
      primaryTrait: 'discipline',
      communityBenefit: 'self-focused',
      authenticitySignals: [],
      paddingSignals: ['resume padding detected', 'generic claims'],
    },
  });
  const tier = makeTier(5);
  const result = activityRuleScorerService.scoreCommunityCharacter(evidence, tier, 0.15);
  assert(result.authenticitySignal === 'resume_padding', 'Resume padding signal');
  assertRange(result.score, 1, 5, 'Low community score within Tier 5');
  console.log(`  Self-focused + padding: ${result.score}/10`);
}

// ============================================================================
// TEST: Commitment Component
// ============================================================================

console.log('\n=== Commitment Component ===');

{
  // 4 years with progression through junior year
  const evidence = makeEvidence({
    commitment: {
      yearsActive: 4,
      hoursPerWeek: 15,
      weeksPerYear: 40,
      showsProgression: true,
      progressionArc: 'member → officer → president',
      sustainedThroughJunior: true,
    },
  });
  const tier = makeTier(3);
  const result = activityRuleScorerService.scoreCommitment(evidence, tier, 0.175);
  assert(result.years === 4, 'Years = 4');
  assert(result.showsProgression, 'Shows progression');
  assert(result.sustainedThroughJunior, 'Sustained through junior');
  assertRange(result.score, 3, 8, '4yr + progression within Tier 3');
  console.log(`  4yr progression: ${result.score}/10`);
}

{
  // Minimal commitment (< 1 year)
  const evidence = makeEvidence({
    commitment: {
      yearsActive: 0.5,
      hoursPerWeek: 2,
      weeksPerYear: 10,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
  });
  const tier = makeTier(6);
  const result = activityRuleScorerService.scoreCommitment(evidence, tier, 0.175);
  assertRange(result.score, 1, 3, 'Minimal commitment within Tier 6');
  console.log(`  Minimal: ${result.score}/10`);
}

{
  // High intensity (20+ hrs/wk average)
  const evidence = makeEvidence({
    commitment: {
      yearsActive: 2,
      hoursPerWeek: 25,
      weeksPerYear: 52,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
  });
  const tier = makeTier(4);
  const result = activityRuleScorerService.scoreCommitment(evidence, tier, 0.175);
  // 2yr base (5-6) + 1 for high intensity = 6-7, clamped to [2, 7]
  assertRange(result.score, 2, 7, 'High intensity within Tier 4');
  console.log(`  High intensity: ${result.score}/10`);
}

// ============================================================================
// TEST: Full Activity Scoring
// ============================================================================

console.log('\n=== Full Activity Scoring ===');

{
  // Tier 2 activity (national distinction)
  const evidence = makeEvidence({
    scope: { level: 'national', confidence: 0.8, evidence: 'USAMO qualifier' },
    recognitions: [
      { name: 'USAMO Qualifier', level: 'national', isVerifiable: true, selectivityContext: 'top 500 of 300K' },
    ],
    role: { title: 'Team Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'captain' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: 'top 500', unit: 'rank', context: 'of 300K participants', isVerifiable: true }],
      estimatedPeopleReached: null,
      tangibleOutcomes: ['USAMO qualification'],
    },
    commitment: {
      yearsActive: 3,
      hoursPerWeek: 10,
      weeksPerYear: 40,
      showsProgression: true,
      progressionArc: 'member → team captain',
      sustainedThroughJunior: true,
    },
    character: {
      primaryTrait: 'curiosity',
      communityBenefit: 'moderate',
      authenticitySignals: ['specific competition history'],
      paddingSignals: [],
    },
    overallSignalStrength: 'strong',
  });

  const tier = classifyTier(evidence);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);

  assert(result.total > 0 && result.total <= 10, 'Total in valid range');
  assertRange(result.total, tier.scoreRange.min, tier.scoreRange.max, 'Total within tier range');
  assert(result.breakdown.weightConfig.leadershipApplicable, 'Leadership is applicable');
  assert(result.tierJustification.length > 0, 'Has tier justification');
  assert(result.overallRationale.length > 0, 'Has overall rationale');
  assert(result.improvementPaths.length > 0, 'Has improvement paths');
  console.log(`  Tier ${tier.internalTier} activity: ${result.total}/10 (range: ${tier.scoreRange.min}-${tier.scoreRange.max})`);
}

{
  // Tier 5 activity (basic participation)
  const evidence = makeEvidence({
    scope: { level: 'school', confidence: 0.6, evidence: 'school club' },
    recognitions: [],
    role: { title: 'Member', type: 'member', isLeadershipApplicable: true, evidence: 'club member' },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 2,
      weeksPerYear: 30,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
    character: {
      primaryTrait: 'discipline',
      communityBenefit: 'self-focused',
      authenticitySignals: [],
      paddingSignals: [],
    },
  });

  const tier = classifyTier(evidence);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);

  assertRange(result.total, tier.scoreRange.min, tier.scoreRange.max, 'Total within tier range');
  console.log(`  Tier ${tier.internalTier} basic: ${result.total}/10 (range: ${tier.scoreRange.min}-${tier.scoreRange.max})`);
}

// ============================================================================
// TEST: Leadership N/A Weight Redistribution
// ============================================================================

console.log('\n=== Weight Redistribution (Leadership N/A) ===');

{
  const evidence = makeEvidence({
    role: { title: 'Researcher', type: 'contributor', isLeadershipApplicable: false, evidence: 'solo research' },
    commitment: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 40, showsProgression: true, progressionArc: 'assistant → lead researcher', sustainedThroughJunior: true },
  });

  const tier = makeTier(4);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);

  assert(!result.breakdown.weightConfig.leadershipApplicable, 'Leadership not applicable');
  assert(result.breakdown.weightConfig.leadershipWeight === 0, 'Leadership weight = 0');
  assert(result.breakdown.leadershipImpact.isApplicable === false, 'Leadership marked N/A');

  // Verify redistributed weights
  const totalWeight =
    result.breakdown.weightConfig.tierWeight +
    result.breakdown.weightConfig.recognitionWeight +
    result.breakdown.weightConfig.leadershipWeight +
    result.breakdown.weightConfig.communityWeight +
    result.breakdown.weightConfig.commitmentWeight;
  assert(Math.abs(totalWeight - 1.0) < 0.01, `Total weight = 1.0 (got ${totalWeight})`);

  console.log(`  Leadership N/A: total weight=${totalWeight.toFixed(3)}, score=${result.total}/10`);
}

// ============================================================================
// TEST: Tier Constraint Clamping
// ============================================================================

console.log('\n=== Tier Constraint Clamping ===');

{
  // Tier 4: activity total must be 4.0-5.4
  const evidence = makeEvidence({
    scope: { level: 'school', confidence: 0.6, evidence: 'school' },
    recognitions: [{ name: 'School Award', level: 'school', isVerifiable: true }],
    role: { title: 'Team Lead', type: 'team_lead', isLeadershipApplicable: true, evidence: 'team lead' },
    commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: null, sustainedThroughJunior: false },
    character: { primaryTrait: 'discipline', communityBenefit: 'moderate', authenticitySignals: ['specific'], paddingSignals: [] },
  });

  const tier = makeTier(4);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);

  assertRange(result.total, 4.0, 5.4, 'Tier 4 total clamped to 4.0-5.4');
  console.log(`  Tier 4 clamped: ${result.total}/10`);
}

{
  // Tier 5: recognition never exceeds constraint max
  const evidence = makeEvidence({
    recognitions: [
      { name: 'Amazing Award', level: 'state', isVerifiable: true, selectivityContext: 'top 10%' },
    ],
  });
  const tier = makeTier(5);
  const result = activityRuleScorerService.scoreRecognition(evidence, tier, 0.25);

  assertRange(
    result.score,
    TIER_COMPONENT_CONSTRAINTS[5].recognition.min,
    TIER_COMPONENT_CONSTRAINTS[5].recognition.max,
    'Tier 5 recognition clamped to constraint'
  );
  console.log(`  Tier 5 recognition clamped: ${result.score}/10 (max: ${TIER_COMPONENT_CONSTRAINTS[5].recognition.max})`);
}

// ============================================================================
// TEST: Score Range Structural Guarantee
// ============================================================================

console.log('\n=== Structural Guarantee: All Tiers ===');

for (const internalTier of [1, 2, 3, 4, 5, 6] as InternalTier[]) {
  const range = TIER_SCORE_RANGES[internalTier];

  // Create evidence that would produce high component scores
  const evidence = makeEvidence({
    scope: { level: 'national', confidence: 0.9, evidence: 'strong' },
    recognitions: [{ name: 'Top Award', level: 'national', isVerifiable: true, selectivityContext: 'top 1%' }],
    role: { title: 'Founder', type: 'founder', isLeadershipApplicable: true, evidence: 'founder' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '1000', unit: 'people', context: 'served', isVerifiable: true }],
      estimatedPeopleReached: 1000,
      tangibleOutcomes: ['Major outcome'],
    },
    commitment: {
      yearsActive: 4,
      hoursPerWeek: 20,
      weeksPerYear: 50,
      showsProgression: true,
      progressionArc: 'member → founder',
      sustainedThroughJunior: true,
    },
    character: {
      primaryTrait: 'service',
      communityBenefit: 'significant',
      authenticitySignals: ['genuine', 'specific'],
      paddingSignals: [],
    },
    overallSignalStrength: 'strong',
  });

  const tier = makeTier(internalTier);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);

  assertRange(result.total, range.min, range.max, `Tier ${internalTier} total within range`);
  console.log(`  Tier ${internalTier}: ${result.total}/10 (range: ${range.min}-${range.max})`);
}

// ============================================================================
// TEST: Weight Configuration Verification
// ============================================================================

console.log('\n=== Weight Configuration ===');

{
  // Standard weights sum to 1.0
  const sum = STANDARD_WEIGHTS.tier + STANDARD_WEIGHTS.recognition +
    STANDARD_WEIGHTS.leadership + STANDARD_WEIGHTS.community + STANDARD_WEIGHTS.commitment;
  assert(Math.abs(sum - 1.0) < 0.001, `Standard weights sum to 1.0 (got ${sum})`);
  console.log(`  Standard weights: ${sum}`);
}

{
  // No-leadership weights sum to 1.0
  const sum = NO_LEADERSHIP_WEIGHTS.tier + NO_LEADERSHIP_WEIGHTS.recognition +
    NO_LEADERSHIP_WEIGHTS.leadership + NO_LEADERSHIP_WEIGHTS.community + NO_LEADERSHIP_WEIGHTS.commitment;
  assert(Math.abs(sum - 1.0) < 0.001, `No-leadership weights sum to 1.0 (got ${sum})`);
  console.log(`  No-leadership weights: ${sum}`);
}

// ============================================================================
// TEST: Output Shape Conformity
// ============================================================================

console.log('\n=== Output Shape Conformity ===');

{
  const evidence = makeEvidence({
    commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  });
  const tier = makeTier(4);
  const result: ActivityScore = activityRuleScorerService.scoreActivity(evidence, tier);

  // Verify all required fields
  assert(typeof result.total === 'number', 'total is number');
  assert(result.total >= 0 && result.total <= 10, 'total in [0, 10]');
  assert(typeof result.breakdown === 'object', 'breakdown is object');
  assert(typeof result.tierJustification === 'string', 'tierJustification is string');
  assert(typeof result.comparisonBenchmarks === 'object', 'comparisonBenchmarks is object');
  assert(typeof result.comparisonBenchmarks.similarTo === 'string', 'similarTo is string');
  assert(typeof result.comparisonBenchmarks.above === 'string', 'above is string');
  assert(typeof result.comparisonBenchmarks.below === 'string', 'below is string');
  assert(Array.isArray(result.improvementPaths), 'improvementPaths is array');
  assert(typeof result.overallRationale === 'string', 'overallRationale is string');

  // Verify breakdown shape
  const b = result.breakdown;
  assert(typeof b.tierAssessment.tier === 'number', 'tierAssessment.tier is number');
  assert(typeof b.recognitionLevel.level === 'string', 'recognitionLevel.level is string');
  assert(typeof b.leadershipImpact.isApplicable === 'boolean', 'leadershipImpact.isApplicable is boolean');
  assert(typeof b.leadershipImpact.role === 'string', 'leadershipImpact.role is string');
  assert(typeof b.communityCharacter.primaryTrait === 'string', 'communityCharacter.primaryTrait is string');
  assert(typeof b.communityCharacter.communityBenefit === 'string', 'communityCharacter.communityBenefit is string');
  assert(typeof b.communityCharacter.authenticitySignal === 'string', 'communityCharacter.authenticitySignal is string');
  assert(typeof b.commitmentProgression.years === 'number', 'commitmentProgression.years is number');
  assert(typeof b.commitmentProgression.showsProgression === 'boolean', 'commitmentProgression.showsProgression is boolean');
  assert(typeof b.commitmentProgression.sustainedThroughJunior === 'boolean', 'commitmentProgression.sustainedThroughJunior is boolean');

  // Verify weight config
  assert(typeof b.weightConfig.tierWeight === 'number', 'weightConfig.tierWeight is number');
  assert(typeof b.weightConfig.leadershipApplicable === 'boolean', 'weightConfig.leadershipApplicable is boolean');

  console.log(`  Output shape: all fields present and valid`);
}

// ============================================================================
// TEST: Realistic Activity Profiles
// ============================================================================

console.log('\n=== Realistic Activity Profiles ===');

{
  // CS Club President
  const evidence = makeEvidence({
    scope: { level: 'school', confidence: 0.7, evidence: 'school CS club' },
    recognitions: [{ name: 'Best Club Award', level: 'school', isVerifiable: false }],
    role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'president' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '50', unit: 'members', context: 'grew club', isVerifiable: false }],
      estimatedPeopleReached: 50,
      tangibleOutcomes: ['Grew club to 50 members'],
    },
    commitment: { yearsActive: 3, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: 'member → VP → president', sustainedThroughJunior: true },
    character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['specific programming projects'], paddingSignals: [] },
  });

  const tier = classifyTier(evidence);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);
  assertRange(result.total, tier.scoreRange.min, tier.scoreRange.max, 'CS Club within tier range');
  console.log(`  CS Club President: Tier ${tier.internalTier}, Score ${result.total}/10`);
}

{
  // Grocery Store Worker
  const evidence = makeEvidence({
    scope: { level: 'local', confidence: 0.8, evidence: 'local grocery' },
    recognitions: [],
    role: { title: 'Cashier', type: 'contributor', isLeadershipApplicable: false, evidence: 'cashier' },
    impact: {
      hasQuantifiedOutcomes: false,
      metrics: [],
      estimatedPeopleReached: null,
      tangibleOutcomes: [],
    },
    commitment: { yearsActive: 2, hoursPerWeek: 15, weeksPerYear: 52, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
    character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: ['specific hours'], paddingSignals: [] },
  });

  const tier = classifyTier(evidence);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);
  assertRange(result.total, tier.scoreRange.min, tier.scoreRange.max, 'Grocery within tier range');
  assert(!result.breakdown.weightConfig.leadershipApplicable, 'Grocery: leadership N/A');
  console.log(`  Grocery Worker: Tier ${tier.internalTier}, Score ${result.total}/10`);
}

{
  // Farm/Research activity
  const evidence = makeEvidence({
    scope: { level: 'local', confidence: 0.6, evidence: 'family farm' },
    recognitions: [],
    role: { title: 'Farmer/Researcher', type: 'contributor', isLeadershipApplicable: false, evidence: 'family farm work' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '2 acres', unit: 'managed', context: 'sustainable farming', isVerifiable: false }],
      estimatedPeopleReached: null,
      tangibleOutcomes: ['Sustainable farming practices'],
    },
    commitment: { yearsActive: 4, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, progressionArc: 'helper → manager', sustainedThroughJunior: true },
    character: { primaryTrait: 'resilience', communityBenefit: 'moderate', authenticitySignals: ['specific farm details', 'seasonal work'], paddingSignals: [] },
  });

  const tier = classifyTier(evidence);
  const result = activityRuleScorerService.scoreActivity(evidence, tier);
  assertRange(result.total, tier.scoreRange.min, tier.scoreRange.max, 'Farm within tier range');
  console.log(`  Farm/Research: Tier ${tier.internalTier}, Score ${result.total}/10`);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n========================================');
console.log(`Activity Rule Scorer Tests: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
