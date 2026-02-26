/**
 * Description Rule Scorer Unit Tests
 *
 * Tests the deterministic description scoring (Layer 3a of decomposed scoring architecture).
 * All tests are pure code — no API calls, $0.00 cost.
 *
 * Expected: ALL tests pass. Any failure indicates a scoring rule issue.
 */

import {
  descriptionRuleScorerService,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionRuleScorer';
import type {
  ExtractedDescriptionFeatures,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/featureTypes';
import type {
  DescriptionScore,
  DescriptionScoreComponent,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import {
  DESCRIPTION_DIMENSION_WEIGHTS,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringRules';

// ============================================================================
// TEST HELPERS
// ============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Create a minimal ExtractedDescriptionFeatures with defaults */
function makeFeatures(overrides: DeepPartial<ExtractedDescriptionFeatures> = {}): ExtractedDescriptionFeatures {
  return {
    activityId: 'test-activity',
    verbs: overrides.verbs as ExtractedDescriptionFeatures['verbs'] ?? [],
    numbers: overrides.numbers as ExtractedDescriptionFeatures['numbers'] ?? [],
    roleOwnership: {
      individualPhrases: [],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
      ...overrides.roleOwnership,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: [],
      hasMeasurableOutcome: false,
      ...overrides.impact,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: [],
      passesThousandStudentTest: false,
      ...overrides.differentiation,
    },
    characterEfficiency: {
      totalChars: 100,
      charLimit: 150,
      utilizationRate: 0.67,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
      ...overrides.characterEfficiency,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: [],
      readsAsAIGenerated: false,
      ...overrides.authenticity,
    },
    detectedActivityType: overrides.detectedActivityType ?? 'other',
  } as ExtractedDescriptionFeatures;
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
// TEST: Role Ownership Scoring
// ============================================================================

console.log('\n=== Role Ownership Scoring ===');

{
  // High individual ownership
  const features = makeFeatures({
    roleOwnership: {
      individualPhrases: ['Founded', 'Designed the curriculum', 'Recruited 20 mentors'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
  });
  const result = descriptionRuleScorerService.scoreRoleOwnership(features);
  assertRange(result.score, 8, 10, 'High individual ownership');
  assert(result.rationale.length > 0, 'Has rationale');
  console.log(`  High individual: ${result.score}/10`);
}

{
  // All team phrases, no individual
  const features = makeFeatures({
    roleOwnership: {
      individualPhrases: [],
      teamPhrases: ['We organized', 'The club hosted', 'Our team won'],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
  });
  const result = descriptionRuleScorerService.scoreRoleOwnership(features);
  assertRange(result.score, 0, 3, 'All team, no individual');
  console.log(`  All team: ${result.score}/10`);
}

{
  // Uses first person (penalty)
  const features = makeFeatures({
    roleOwnership: {
      individualPhrases: ['I founded', 'I designed'],
      teamPhrases: [],
      usesFirstPerson: true,
      firstPersonInstances: ['I', 'I'],
      roleClearFromDescription: true,
    },
  });
  const result = descriptionRuleScorerService.scoreRoleOwnership(features);
  // Still decent because individual, but -1 for first person
  assertRange(result.score, 7, 10, 'First person penalty applied');
  console.log(`  First person: ${result.score}/10`);
}

{
  // Empty — no phrases at all
  const features = makeFeatures({
    roleOwnership: {
      individualPhrases: [],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
  });
  const result = descriptionRuleScorerService.scoreRoleOwnership(features);
  assertRange(result.score, 0, 3, 'Empty ownership');
  console.log(`  Empty: ${result.score}/10`);
}

// ============================================================================
// TEST: Impact Evidence Scoring
// ============================================================================

console.log('\n=== Impact Evidence Scoring ===');

{
  // Strong: 2 causal chains + measurable outcome
  const features = makeFeatures({
    impact: {
      causalChains: [
        { action: 'Redesigned curriculum', outcome: '40% score improvement', hasExternalValidation: true },
        { action: 'Trained 15 tutors', outcome: 'Program adopted school-wide', hasExternalValidation: true },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
  });
  const result = descriptionRuleScorerService.scoreImpactEvidence(features);
  assertRange(result.score, 9, 10, 'Strong impact');
  console.log(`  Strong impact: ${result.score}/10`);
}

{
  // Only unsupported claims, no chains
  const features = makeFeatures({
    impact: {
      causalChains: [],
      unsupportedClaims: ['made a positive impact', 'helped the community'],
      hasMeasurableOutcome: false,
    },
  });
  const result = descriptionRuleScorerService.scoreImpactEvidence(features);
  assertRange(result.score, 0, 2, 'Only unsupported claims → max 2');
  console.log(`  Unsupported only: ${result.score}/10`);
}

{
  // No impact at all
  const features = makeFeatures({
    impact: {
      causalChains: [],
      unsupportedClaims: [],
      hasMeasurableOutcome: false,
    },
  });
  const result = descriptionRuleScorerService.scoreImpactEvidence(features);
  assert(result.score === 0, 'No impact → score 0');
  console.log(`  No impact: ${result.score}/10`);
}

{
  // 1 chain without validation + measurable
  const features = makeFeatures({
    impact: {
      causalChains: [
        { action: 'Organized event', outcome: '200 attendees', hasExternalValidation: false },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
  });
  const result = descriptionRuleScorerService.scoreImpactEvidence(features);
  assertRange(result.score, 4, 6, '1 chain + measurable');
  console.log(`  1 chain: ${result.score}/10`);
}

// ============================================================================
// TEST: Action Precision Scoring
// ============================================================================

console.log('\n=== Action Precision Scoring ===');

{
  // Elite verbs
  const features = makeFeatures({
    verbs: [
      { verb: 'designed', lemma: 'design', context: 'designed a new system', isIndividualAction: true },
      { verb: 'engineered', lemma: 'engineer', context: 'engineered the solution', isIndividualAction: true },
      { verb: 'pioneered', lemma: 'pioneer', context: 'pioneered the approach', isIndividualAction: true },
    ],
  });
  const result = descriptionRuleScorerService.scoreActionPrecision(features);
  assertRange(result.score, 9, 10, 'Elite verbs → high score');
  console.log(`  Elite verbs: ${result.score}/10`);
}

{
  // Poor verbs
  const features = makeFeatures({
    verbs: [
      { verb: 'participated', lemma: 'participate', context: 'participated in activities', isIndividualAction: true },
      { verb: 'helped', lemma: 'help', context: 'helped with tasks', isIndividualAction: true },
      { verb: 'was', lemma: 'be', context: 'was a member', isIndividualAction: true },
    ],
  });
  const result = descriptionRuleScorerService.scoreActionPrecision(features);
  assertRange(result.score, 0, 3, 'Poor verbs → low score');
  console.log(`  Poor verbs: ${result.score}/10`);
}

{
  // No verbs at all
  const features = makeFeatures({ verbs: [] });
  const result = descriptionRuleScorerService.scoreActionPrecision(features);
  assert(result.score === 1, 'No verbs → score 1');
  console.log(`  No verbs: ${result.score}/10`);
}

{
  // Mixed verbs (some strong, some weak)
  const features = makeFeatures({
    verbs: [
      { verb: 'led', lemma: 'lead', context: 'led the team', isIndividualAction: true },
      { verb: 'worked', lemma: 'work', context: 'worked on tasks', isIndividualAction: true },
      { verb: 'organized', lemma: 'organize', context: 'organized events', isIndividualAction: true },
    ],
  });
  const result = descriptionRuleScorerService.scoreActionPrecision(features);
  assertRange(result.score, 5, 7, 'Mixed verbs → mid score');
  console.log(`  Mixed verbs: ${result.score}/10`);
}

// ============================================================================
// TEST: Quantification Scoring
// ============================================================================

console.log('\n=== Quantification Scoring ===');

{
  // 3+ meaningful with context
  const features = makeFeatures({
    numbers: [
      { rawValue: '200', numericValue: 200, unit: 'students', hasContext: true, isMeaningful: true },
      { rawValue: '$12K', numericValue: 12000, unit: 'dollars raised', hasContext: true, isMeaningful: true },
      { rawValue: '40%', numericValue: 40, unit: 'improvement', hasContext: true, isMeaningful: true },
    ],
  });
  const result = descriptionRuleScorerService.scoreQuantification(features);
  assertRange(result.score, 9, 10, '3 meaningful numbers → top score');
  console.log(`  3 meaningful: ${result.score}/10`);
}

{
  // Only vanity metrics
  const features = makeFeatures({
    numbers: [
      { rawValue: '10', numericValue: 10, unit: 'meetings', hasContext: false, isMeaningful: false, vanityReason: 'attendance count' },
      { rawValue: '4', numericValue: 4, unit: 'years', hasContext: false, isMeaningful: false, vanityReason: 'time span' },
    ],
  });
  const result = descriptionRuleScorerService.scoreQuantification(features);
  assertRange(result.score, 0, 2, 'Vanity only → low score');
  console.log(`  Vanity only: ${result.score}/10`);
}

{
  // No numbers at all
  const features = makeFeatures({ numbers: [] });
  const result = descriptionRuleScorerService.scoreQuantification(features);
  assert(result.score === 1, 'No numbers → score 1');
  console.log(`  No numbers: ${result.score}/10`);
}

// ============================================================================
// TEST: Differentiation Scoring
// ============================================================================

console.log('\n=== Differentiation Scoring ===');

{
  // Highly unique
  const features = makeFeatures({
    differentiation: {
      uniqueDetails: ['Built custom AI model for crop prediction', 'Used family farm data', 'Published results'],
      genericPhrases: [],
      passesThousandStudentTest: true,
      standoutElement: 'Built custom AI model for crop prediction',
    },
  });
  const result = descriptionRuleScorerService.scoreDifferentiation(features);
  assertRange(result.score, 9, 10, 'Highly unique → top score');
  console.log(`  Highly unique: ${result.score}/10`);
}

{
  // Completely generic
  const features = makeFeatures({
    differentiation: {
      uniqueDetails: [],
      genericPhrases: ['organized events', 'helped community', 'worked with team', 'gained experience'],
      passesThousandStudentTest: false,
    },
  });
  const result = descriptionRuleScorerService.scoreDifferentiation(features);
  assertRange(result.score, 0, 3, 'Completely generic → low score');
  console.log(`  Generic: ${result.score}/10`);
}

// ============================================================================
// TEST: Full Description Scoring
// ============================================================================

console.log('\n=== Full Description Scoring ===');

{
  // Strong description (CS research)
  const features = makeFeatures({
    verbs: [
      { verb: 'designed', lemma: 'design', context: 'designed neural network', isIndividualAction: true },
      { verb: 'published', lemma: 'publish', context: 'published results', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '93%', numericValue: 93, unit: 'accuracy', hasContext: true, isMeaningful: true },
      { rawValue: '200', numericValue: 200, unit: 'images classified', hasContext: true, isMeaningful: true },
    ],
    roleOwnership: {
      individualPhrases: ['Designed neural network', 'Published results in journal'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [
        { action: 'Designed neural network', outcome: '93% accuracy on crop disease detection', hasExternalValidation: true },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
    differentiation: {
      uniqueDetails: ['Neural network for crop disease', 'Family farm data'],
      genericPhrases: [],
      passesThousandStudentTest: true,
      standoutElement: 'Neural network for crop disease detection',
    },
  });
  const result = descriptionRuleScorerService.scoreDescription(features);

  assert(result.total > 0 && result.total <= 10, 'Total in valid range');
  assertRange(result.total, 7, 10, 'Strong description → high total');
  assert(result.breakdown.specificity.score > 0, 'Specificity scored');
  assert(result.breakdown.impactClarity.score > 0, 'Impact clarity scored');
  assert(result.breakdown.actionLanguage.score > 0, 'Action language scored');
  assert(result.breakdown.quantification.score > 0, 'Quantification scored');
  assert(result.breakdown.authenticityVoice.score > 0, 'Authenticity voice scored');
  assert(result.overallRationale.length > 0, 'Has overall rationale');
  assert(Array.isArray(result.strengths), 'Has strengths array');
  assert(Array.isArray(result.improvements), 'Has improvements array');
  console.log(`  Strong description: ${result.total}/10`);
  console.log(`    Role: ${result.breakdown.specificity.score}, Impact: ${result.breakdown.impactClarity.score}, ` +
    `Action: ${result.breakdown.actionLanguage.score}, Quant: ${result.breakdown.quantification.score}, ` +
    `Diff: ${result.breakdown.authenticityVoice.score}`);
}

{
  // Weak description (generic grocery work)
  const features = makeFeatures({
    verbs: [
      { verb: 'worked', lemma: 'work', context: 'worked as cashier', isIndividualAction: true },
      { verb: 'helped', lemma: 'help', context: 'helped customers', isIndividualAction: true },
    ],
    numbers: [],
    roleOwnership: {
      individualPhrases: [],
      teamPhrases: ['worked with team', 'store operations'],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: ['gained valuable experience'],
      hasMeasurableOutcome: false,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: ['worked as cashier', 'helped customers', 'gained experience'],
      passesThousandStudentTest: false,
    },
  });
  const result = descriptionRuleScorerService.scoreDescription(features);

  assertRange(result.total, 1, 4, 'Weak description → low total');
  assert(result.improvements.length > 0, 'Has improvement suggestions');
  console.log(`  Weak description: ${result.total}/10`);
}

// ============================================================================
// TEST: Weighted Total Calculation
// ============================================================================

console.log('\n=== Weighted Total Verification ===');

{
  // Verify weights sum to 1.0
  const weights = DESCRIPTION_DIMENSION_WEIGHTS;
  const sum = weights.roleOwnership + weights.impactEvidence + weights.differentiation +
    weights.actionPrecision + weights.quantification;
  assert(Math.abs(sum - 1.0) < 0.001, `Weights sum to 1.0 (got ${sum})`);
  console.log(`  Weights sum: ${sum}`);
}

{
  // Verify weighted total matches manual calculation
  const features = makeFeatures({
    verbs: [
      { verb: 'led', lemma: 'lead', context: 'led team', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '50', numericValue: 50, unit: 'members', hasContext: true, isMeaningful: true },
    ],
    roleOwnership: {
      individualPhrases: ['Led'],
      teamPhrases: ['team'],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [
        { action: 'Led team', outcome: '50 members engaged', hasExternalValidation: false },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
    differentiation: {
      uniqueDetails: ['Specific leadership approach'],
      genericPhrases: [],
      passesThousandStudentTest: false,
    },
  });

  const result = descriptionRuleScorerService.scoreDescription(features);
  const manual =
    result.breakdown.specificity.score * 0.25 +
    result.breakdown.impactClarity.score * 0.25 +
    result.breakdown.authenticityVoice.score * 0.20 +
    result.breakdown.actionLanguage.score * 0.15 +
    result.breakdown.quantification.score * 0.15;

  const manualRounded = Math.round(manual * 10) / 10;
  assert(
    Math.abs(result.total - manualRounded) <= 0.1,
    `Weighted total matches manual: ${result.total} vs ${manualRounded}`
  );
  console.log(`  Weighted total: ${result.total}, manual: ${manualRounded}`);
}

// ============================================================================
// TEST: Output Shape Conformity
// ============================================================================

console.log('\n=== Output Shape Conformity ===');

{
  const features = makeFeatures({
    verbs: [{ verb: 'organized', lemma: 'organize', context: 'organized events', isIndividualAction: true }],
    numbers: [{ rawValue: '100', numericValue: 100, unit: 'attendees', hasContext: true, isMeaningful: true }],
    roleOwnership: {
      individualPhrases: ['Organized events'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [{ action: 'organized', outcome: '100 attendees', hasExternalValidation: false }],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
    differentiation: {
      uniqueDetails: ['specific detail'],
      genericPhrases: [],
      passesThousandStudentTest: true,
    },
  });

  const result: DescriptionScore = descriptionRuleScorerService.scoreDescription(features);

  // Verify all required fields exist
  assert(typeof result.total === 'number', 'total is number');
  assert(result.total >= 0 && result.total <= 10, 'total in [0, 10]');
  assert(typeof result.breakdown === 'object', 'breakdown is object');
  assert(typeof result.breakdown.specificity === 'object', 'specificity exists');
  assert(typeof result.breakdown.impactClarity === 'object', 'impactClarity exists');
  assert(typeof result.breakdown.actionLanguage === 'object', 'actionLanguage exists');
  assert(typeof result.breakdown.quantification === 'object', 'quantification exists');
  assert(typeof result.breakdown.authenticityVoice === 'object', 'authenticityVoice exists');
  assert(Array.isArray(result.strengths), 'strengths is array');
  assert(Array.isArray(result.improvements), 'improvements is array');
  assert(typeof result.overallRationale === 'string', 'overallRationale is string');
  assert(result.overallRationale.length > 0, 'overallRationale non-empty');

  // Verify component shape
  for (const key of ['specificity', 'impactClarity', 'actionLanguage', 'quantification', 'authenticityVoice'] as const) {
    const comp = result.breakdown[key] as DescriptionScoreComponent;
    assert(typeof comp.score === 'number', `${key}.score is number`);
    assert(comp.score >= 0 && comp.score <= 10, `${key}.score in [0, 10]`);
    assert(comp.maxScore === 10, `${key}.maxScore is 10`);
    assert(typeof comp.rationale === 'string', `${key}.rationale is string`);
    assert(comp.rationale.length > 0, `${key}.rationale non-empty`);
  }

  console.log(`  Output shape: all fields present and valid`);
}

// ============================================================================
// TEST: Edge Cases
// ============================================================================

console.log('\n=== Edge Cases ===');

{
  // Completely empty features
  const features = makeFeatures();
  const result = descriptionRuleScorerService.scoreDescription(features);
  assert(result.total >= 0 && result.total <= 10, 'Empty features → valid total');
  assertRange(result.total, 0, 3, 'Empty features → low score');
  console.log(`  Empty features: ${result.total}/10`);
}

{
  // Unknown verb lemmas (should get default tier 3)
  const features = makeFeatures({
    verbs: [
      { verb: 'flibbertigibbet', lemma: 'flibbertigibbet', context: 'did something', isIndividualAction: true },
    ],
  });
  const result = descriptionRuleScorerService.scoreActionPrecision(features);
  // Default tier 3 → score should be ~6 (3 × 2 = 6)
  assertRange(result.score, 5, 7, 'Unknown verbs get default tier 3');
  console.log(`  Unknown verb: ${result.score}/10`);
}

{
  // Only team verbs, no individual
  const features = makeFeatures({
    verbs: [
      { verb: 'organized', lemma: 'organize', context: 'we organized', isIndividualAction: false },
      { verb: 'hosted', lemma: 'host', context: 'the club hosted', isIndividualAction: false },
    ],
  });
  const result = descriptionRuleScorerService.scoreActionPrecision(features);
  // Falls back to all verbs since no individual
  assert(result.score > 0, 'Falls back to team verbs when no individual');
  console.log(`  Team verbs only: ${result.score}/10`);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n========================================');
console.log(`Description Rule Scorer Tests: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
