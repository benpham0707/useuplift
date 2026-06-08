/**
 * Scoring Calibration Edge-Case Tests
 *
 * Validates all 10 calibration issues with concrete passing criteria.
 * Tests are PURE CODE (no LLM) — they call the deterministic rule scorers,
 * tier classifier, and portfolio calibrator directly.
 *
 * Run: npx tsx tests/test-scoring-calibration-edge-cases.ts
 *
 * Issue Map:
 *  1  Research vs Tutoring — tier + activity score gap
 *  2  Title Inflation (President no evidence)
 *  3  Selectivity Context (MIT lab vs school club)
 *  4  Description Jargon Without Outcome
 *  5  Portfolio Score Consistency (scale check)
 *  6  Title-Only Cap
 *  7  Founded Scaling (small vs large)
 *  8  Hours/Week Context (retail vs research)
 *  9  Mid-Tier Spread (5 mid-tier activities)
 * 10  Quantification Significance (% vs small number)
 */

import {
  classifyTier,
  descriptionRuleScorerService,
  activityRuleScorerService,
  calibratePortfolio,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring';

import type {
  ExtractedEvidence,
  TierClassification,
  ActivityScore,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

import {
  TIER_SCORE_RANGES,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

import type {
  ExtractedDescriptionFeatures,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/featureTypes';

import type {
  CalibrationInput,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioCalibrator';

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS ${testName}`);
  } else {
    failed++;
    const msg = detail ? `${testName}: ${detail}` : testName;
    failures.push(msg);
    console.log(`  FAIL ${testName}${detail ? ` -- ${detail}` : ''}`);
  }
}

function assertRange(value: number, min: number, max: number, name: string): void {
  assert(
    value >= min && value <= max,
    name,
    `expected ${min}-${max}, got ${value}`
  );
}

// ============================================================================
// MOCK BUILDERS — realistic objects matching type interfaces
// ============================================================================

/**
 * Build a minimal ExtractedEvidence object with sensible defaults.
 * Override specific fields via the `overrides` partial.
 */
function buildEvidence(overrides: Partial<ExtractedEvidence> = {}): ExtractedEvidence {
  return {
    scope: {
      level: 'school',
      confidence: 0.5,
      evidence: 'school-level activity',
    },
    recognitions: [],
    role: {
      title: 'Member',
      type: 'member',
      isLeadershipApplicable: true,
      evidence: 'general member',
    },
    impact: {
      hasQuantifiedOutcomes: false,
      metrics: [],
      estimatedPeopleReached: null,
      tangibleOutcomes: [],
    },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 3,
      weeksPerYear: 36,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
    character: {
      primaryTrait: 'discipline',
      communityBenefit: 'minimal',
      authenticitySignals: [],
      paddingSignals: [],
    },
    categoryMatch: {
      category: 'general',
      confidence: 'medium',
    },
    overallSignalStrength: 'moderate',
    ...overrides,
  };
}

/**
 * Build a minimal ExtractedDescriptionFeatures object with sensible defaults.
 */
function buildDescFeatures(overrides: Partial<ExtractedDescriptionFeatures> = {}): ExtractedDescriptionFeatures {
  return {
    activityId: 'test-activity',
    verbs: [],
    numbers: [],
    roleOwnership: {
      individualPhrases: [],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: [],
      hasMeasurableOutcome: false,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: [],
      passesThousandStudentTest: false,
    },
    characterEfficiency: {
      totalChars: 100,
      charLimit: 150,
      utilizationRate: 0.67,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: [],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'other',
    ...overrides,
  };
}

// ============================================================================
// TEST 1: Research vs Tutoring (Issue 1)
// ============================================================================

function testResearchVsTutoring(): void {
  console.log('\n--- Test 1: Research vs Tutoring (Issue 1) ---');

  // ML Research Assistant — co-authored paper, 50K records, NLP pipeline, university
  const researchEvidence = buildEvidence({
    scope: {
      level: 'national',
      confidence: 0.9,
      evidence: 'University research lab, co-authored paper submitted to peer-reviewed journal',
    },
    recognitions: [
      {
        name: 'Co-authored peer-reviewed NLP paper',
        level: 'national',
        isVerifiable: true,
        selectivityContext: 'Peer-reviewed journal, <20% acceptance rate',
      },
    ],
    role: {
      title: 'Research Assistant',
      type: 'contributor',
      isLeadershipApplicable: false,
      evidence: 'Worked as research assistant in university NLP lab; built data pipeline for 50K records',
    },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [
        { value: '50000', unit: 'records processed', context: 'Built NLP data pipeline processing 50K clinical records', isVerifiable: true },
      ],
      estimatedPeopleReached: 50000,
      tangibleOutcomes: ['Co-authored peer-reviewed paper', 'Built NLP data pipeline for clinical records'],
    },
    commitment: {
      yearsActive: 2,
      hoursPerWeek: 15,
      weeksPerYear: 40,
      showsProgression: true,
      progressionArc: 'data entry -> independent pipeline development -> co-author',
      sustainedThroughJunior: true,
    },
    character: {
      primaryTrait: 'curiosity',
      communityBenefit: 'significant',
      authenticitySignals: ['specific technical details', 'named lab and dataset', 'progression arc'],
      paddingSignals: [],
    },
    categoryMatch: {
      category: 'stem_research',
      confidence: 'high',
    },
    overallSignalStrength: 'strong',
  });

  // Basic tutoring — helped students, no publications, no measurable outcomes
  const tutoringEvidence = buildEvidence({
    scope: {
      level: 'school',
      confidence: 0.7,
      evidence: 'Tutored students at school after hours',
    },
    recognitions: [],
    role: {
      title: 'Tutor',
      type: 'contributor',
      isLeadershipApplicable: true,
      evidence: 'Volunteered as math tutor for underclassmen',
    },
    impact: {
      hasQuantifiedOutcomes: false,
      metrics: [],
      estimatedPeopleReached: 10,
      tangibleOutcomes: ['Helped students with homework'],
    },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 3,
      weeksPerYear: 30,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
    character: {
      primaryTrait: 'service',
      communityBenefit: 'moderate',
      authenticitySignals: [],
      paddingSignals: [],
    },
    categoryMatch: {
      category: 'tutoring',
      confidence: 'high',
    },
    overallSignalStrength: 'weak',
  });

  const researchTier = classifyTier(researchEvidence);
  const tutoringTier = classifyTier(tutoringEvidence);

  const researchScore = activityRuleScorerService.scoreActivity(researchEvidence, researchTier);
  const tutoringScore = activityRuleScorerService.scoreActivity(tutoringEvidence, tutoringTier);

  console.log(`  Research: tier=${researchTier.internalTier}, score=${researchScore.total}`);
  console.log(`  Tutoring: tier=${tutoringTier.internalTier}, score=${tutoringScore.total}`);

  // Research should be Tier 1-3 (internal), Tutoring should be Tier 4-6
  assert(
    researchTier.internalTier <= 3,
    'Research gets internal tier <= 3',
    `got tier ${researchTier.internalTier}`
  );

  assert(
    tutoringTier.internalTier >= 4,
    'Tutoring gets internal tier >= 4',
    `got tier ${tutoringTier.internalTier}`
  );

  // Research final score should exceed tutoring by >= 2.0 points
  const gap = researchScore.total - tutoringScore.total;
  assert(
    gap >= 2.0,
    `Research score (${researchScore.total}) >= Tutoring score (${tutoringScore.total}) + 2.0`,
    `gap is ${gap.toFixed(1)}`
  );
}

// ============================================================================
// TEST 2: Title Inflation — President No Evidence (Issues 2, 6)
// ============================================================================

function testTitleInflation(): void {
  console.log('\n--- Test 2: Title Inflation (Issues 2, 6) ---');

  // "CS Club President" with NO described leadership actions
  const presidentNoImpact = buildDescFeatures({
    activityId: 'president-no-impact',
    verbs: [
      { verb: 'led', lemma: 'lead', context: 'Led weekly meetings', isIndividualAction: true },
    ],
    numbers: [],
    roleOwnership: {
      individualPhrases: ['Led weekly meetings'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: ['led the club'],
      hasMeasurableOutcome: false,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: ['led weekly meetings'],
      passesThousandStudentTest: false,
    },
    characterEfficiency: {
      totalChars: 30,
      charLimit: 150,
      utilizationRate: 0.2,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: [],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'leadership_government',
  });

  // "CS Club Member" who organized 3 hackathons, grew club 10 -> 45
  const memberWithImpact = buildDescFeatures({
    activityId: 'member-with-impact',
    verbs: [
      { verb: 'organized', lemma: 'organize', context: 'Organized 3 inter-school hackathons', isIndividualAction: true },
      { verb: 'grew', lemma: 'grow', context: 'Grew membership from 10 to 45', isIndividualAction: true },
      { verb: 'built', lemma: 'build', context: 'Built automated sign-up system', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '3', numericValue: 3, unit: 'hackathons', hasContext: true, isMeaningful: true },
      { rawValue: '10', numericValue: 10, unit: 'initial members', hasContext: true, isMeaningful: true },
      { rawValue: '45', numericValue: 45, unit: 'members', hasContext: true, isMeaningful: true },
    ],
    roleOwnership: {
      individualPhrases: ['Organized 3 inter-school hackathons', 'Grew membership from 10 to 45', 'Built automated sign-up system'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [
        { action: 'Organized hackathons and built automated sign-up', outcome: 'Grew club from 10 to 45 members', hasExternalValidation: false },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
    differentiation: {
      uniqueDetails: ['inter-school hackathons', '10 to 45 growth', 'automated sign-up system'],
      genericPhrases: [],
      passesThousandStudentTest: true,
      standoutElement: '350% membership growth through technical innovation',
    },
    characterEfficiency: {
      totalChars: 120,
      charLimit: 150,
      utilizationRate: 0.8,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: ['specific growth numbers', 'technical details'],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'coding_engineering',
  });

  const presidentDescScore = descriptionRuleScorerService.scoreDescription(presidentNoImpact);
  const memberDescScore = descriptionRuleScorerService.scoreDescription(memberWithImpact);

  console.log(`  President (no impact): total=${presidentDescScore.total}`);
  console.log(`  Member (with impact):  total=${memberDescScore.total}`);

  // Member with demonstrated impact should score higher than President without
  assert(
    memberDescScore.total > presidentDescScore.total,
    `Member with impact (${memberDescScore.total}) > President without impact (${presidentDescScore.total})`
  );
}

// ============================================================================
// TEST 3: Selectivity Context (Issue 3)
// ============================================================================

function testSelectivityContext(): void {
  console.log('\n--- Test 3: Selectivity Context (Issue 3) ---');

  // Same research activity, but at MIT research lab (national scope, verifiable)
  const mitEvidence = buildEvidence({
    scope: {
      level: 'national',
      confidence: 0.9,
      evidence: 'MIT Computer Science and Artificial Intelligence Lab (CSAIL)',
    },
    recognitions: [
      {
        name: 'MIT CSAIL research placement',
        level: 'national',
        isVerifiable: true,
        selectivityContext: '<5% acceptance for high school research interns',
      },
    ],
    role: {
      title: 'Research Intern',
      type: 'contributor',
      isLeadershipApplicable: false,
      evidence: 'Selected as high school research intern at MIT CSAIL',
    },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [
        { value: '3', unit: 'experiments conducted', context: 'Led 3 independent experiments', isVerifiable: true },
      ],
      estimatedPeopleReached: null,
      tangibleOutcomes: ['Independent experiments at MIT CSAIL'],
    },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 20,
      weeksPerYear: 10,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
    character: {
      primaryTrait: 'curiosity',
      communityBenefit: 'self-focused',
      authenticitySignals: ['named institution', 'specific lab'],
      paddingSignals: [],
    },
    categoryMatch: {
      category: 'stem_research',
      confidence: 'high',
    },
    overallSignalStrength: 'strong',
  });

  // Same activity at school science club
  const schoolEvidence = buildEvidence({
    scope: {
      level: 'school',
      confidence: 0.7,
      evidence: 'School Science Club',
    },
    recognitions: [],
    role: {
      title: 'Research Member',
      type: 'contributor',
      isLeadershipApplicable: false,
      evidence: 'Member of school science club doing experiments',
    },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [
        { value: '3', unit: 'experiments conducted', context: 'Conducted 3 experiments', isVerifiable: false },
      ],
      estimatedPeopleReached: null,
      tangibleOutcomes: ['Experiments at school science club'],
    },
    commitment: {
      yearsActive: 1,
      hoursPerWeek: 5,
      weeksPerYear: 30,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
    },
    character: {
      primaryTrait: 'curiosity',
      communityBenefit: 'self-focused',
      authenticitySignals: [],
      paddingSignals: [],
    },
    categoryMatch: {
      category: 'stem_research',
      confidence: 'medium',
    },
    overallSignalStrength: 'moderate',
  });

  const mitTier = classifyTier(mitEvidence);
  const schoolTier = classifyTier(schoolEvidence);

  const mitScore = activityRuleScorerService.scoreActivity(mitEvidence, mitTier);
  const schoolScore = activityRuleScorerService.scoreActivity(schoolEvidence, schoolTier);

  console.log(`  MIT research: tier=${mitTier.internalTier}, score=${mitScore.total}`);
  console.log(`  School club:  tier=${schoolTier.internalTier}, score=${schoolScore.total}`);

  // MIT version should score higher (better scope, selectivity, verifiability)
  assert(
    mitScore.total > schoolScore.total,
    `MIT research (${mitScore.total}) > School club (${schoolScore.total})`
  );

  // MIT should be at least one internal tier better
  assert(
    mitTier.internalTier < schoolTier.internalTier,
    `MIT tier (${mitTier.internalTier}) < School tier (${schoolTier.internalTier})`
  );
}

// ============================================================================
// TEST 4: Description Jargon Without Outcome (Issue 4)
// ============================================================================

function testJargonWithoutOutcome(): void {
  console.log('\n--- Test 4: Jargon Without Outcome (Issue 4) ---');

  // "Used Python/pandas for data analysis on research dataset" — no outcome
  const jargonFeatures = buildDescFeatures({
    activityId: 'jargon-no-outcome',
    verbs: [
      { verb: 'used', lemma: 'use', context: 'Used Python/pandas for data analysis', isIndividualAction: true },
    ],
    numbers: [],
    roleOwnership: {
      individualPhrases: ['Used Python/pandas for data analysis'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: [],
      hasMeasurableOutcome: false,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: ['Used Python/pandas for data analysis'],
      passesThousandStudentTest: false,
    },
    characterEfficiency: {
      totalChars: 60,
      charLimit: 150,
      utilizationRate: 0.4,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: [],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'coding_engineering',
  });

  const jargonScore = descriptionRuleScorerService.scoreDescription(jargonFeatures);

  console.log(`  Jargon (no outcome): total=${jargonScore.total}`);
  console.log(`    Breakdown: roleOwnership=${jargonScore.breakdown.specificity.score}, impact=${jargonScore.breakdown.impactClarity.score}, action=${jargonScore.breakdown.actionLanguage.score}, quant=${jargonScore.breakdown.quantification.score}, diff=${jargonScore.breakdown.authenticityVoice.score}`);

  // Description score should be capped at moderate (7 or below)
  assert(
    jargonScore.total <= 7.0,
    `Jargon without outcome score <= 7.0`,
    `got ${jargonScore.total}`
  );
}

// ============================================================================
// TEST 5: Portfolio Score Consistency (Issue 5)
// ============================================================================

function testPortfolioScoreConsistency(): void {
  console.log('\n--- Test 5: Portfolio Score Consistency (Issue 5) ---');

  // Build 3 activities with varied tiers to calibrate
  const activities: CalibrationInput[] = [];

  // Activity A: Tier 2 (state/regional)
  const evidenceA = buildEvidence({
    scope: { level: 'state', confidence: 0.8, evidence: 'State science fair winner' },
    recognitions: [{ name: 'State Science Fair 1st Place', level: 'state', isVerifiable: true }],
    role: { title: 'Researcher', type: 'contributor', isLeadershipApplicable: false, evidence: 'Independent research project' },
    impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '1st', unit: 'place', context: 'Won first place at state science fair', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['State science fair award'] },
    commitment: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 36, showsProgression: true, progressionArc: 'started research -> won state fair', sustainedThroughJunior: true },
    character: { primaryTrait: 'curiosity', communityBenefit: 'moderate', authenticitySignals: ['specific fair name'], paddingSignals: [] },
    categoryMatch: { category: 'stem_research', confidence: 'high' },
    overallSignalStrength: 'strong',
  });
  const tierA = classifyTier(evidenceA);
  const scoreA = activityRuleScorerService.scoreActivity(evidenceA, tierA);
  activities.push({ activityId: 'a', activityTitle: 'Science Research', score: scoreA, tier: tierA, evidence: evidenceA });

  // Activity B: Tier 4 (school level)
  const evidenceB = buildEvidence({
    scope: { level: 'school', confidence: 0.6, evidence: 'School club' },
    role: { title: 'Member', type: 'member', isLeadershipApplicable: true, evidence: 'Club member' },
    commitment: { yearsActive: 1, hoursPerWeek: 2, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
    character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
    categoryMatch: { category: 'general', confidence: 'medium' },
    overallSignalStrength: 'weak',
  });
  const tierB = classifyTier(evidenceB);
  const scoreB = activityRuleScorerService.scoreActivity(evidenceB, tierB);
  activities.push({ activityId: 'b', activityTitle: 'Chess Club', score: scoreB, tier: tierB, evidence: evidenceB });

  // Activity C: Tier 3 (school leader)
  const evidenceC = buildEvidence({
    scope: { level: 'school', confidence: 0.7, evidence: 'School newspaper editor' },
    recognitions: [{ name: 'Editor-in-Chief award', level: 'school', isVerifiable: false }],
    role: { title: 'Editor-in-Chief', type: 'executive', isLeadershipApplicable: true, evidence: 'Led editorial team of 12' },
    impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '12', unit: 'team members', context: 'Led team of 12 writers', isVerifiable: false }], estimatedPeopleReached: 500, tangibleOutcomes: ['Published monthly newspaper'] },
    commitment: { yearsActive: 2, hoursPerWeek: 8, weeksPerYear: 36, showsProgression: true, progressionArc: 'writer -> section editor -> editor-in-chief', sustainedThroughJunior: true },
    character: { primaryTrait: 'creativity', communityBenefit: 'moderate', authenticitySignals: ['specific role progression'], paddingSignals: [] },
    categoryMatch: { category: 'journalism', confidence: 'high' },
    overallSignalStrength: 'moderate',
  });
  const tierC = classifyTier(evidenceC);
  const scoreC = activityRuleScorerService.scoreActivity(evidenceC, tierC);
  activities.push({ activityId: 'c', activityTitle: 'Newspaper', score: scoreC, tier: tierC, evidence: evidenceC });

  // Run portfolio calibration
  const calibResult = calibratePortfolio(activities, 'Computer Science');

  console.log(`  Calibration: ${calibResult.summary.activitiesAdjusted}/${calibResult.summary.totalActivities} adjusted`);

  // Verify all calibrated scores are on 1-10 scale
  for (const act of calibResult.activities) {
    assertRange(
      act.score.total,
      1.0,
      10.0,
      `Activity '${act.activityTitle}' score on 1-10 scale (got ${act.score.total})`
    );
  }

  // Run calibration again — result should be deterministic
  const calibResult2 = calibratePortfolio(activities, 'Computer Science');
  for (let i = 0; i < calibResult.activities.length; i++) {
    assert(
      calibResult.activities[i].score.total === calibResult2.activities[i].score.total,
      `Deterministic: '${calibResult.activities[i].activityTitle}' same score across runs`
    );
  }
}

// ============================================================================
// TEST 6: Founded Scaling (Issue 7)
// ============================================================================

function testFoundedScaling(): void {
  console.log('\n--- Test 6: Founded Scaling (Issue 7) ---');

  // "Founded book club with 5 friends" — small scale
  const smallFoundedFeatures = buildDescFeatures({
    activityId: 'small-founded',
    verbs: [
      { verb: 'founded', lemma: 'found', context: 'Founded book club with 5 friends', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '5', numericValue: 5, unit: 'friends', hasContext: true, isMeaningful: false, vanityReason: 'very small group' },
    ],
    roleOwnership: {
      individualPhrases: ['Founded book club'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: [],
      hasMeasurableOutcome: false,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: ['book club with friends'],
      passesThousandStudentTest: false,
    },
    characterEfficiency: {
      totalChars: 40,
      charLimit: 150,
      utilizationRate: 0.27,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: [],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'other',
  });

  // "Founded nonprofit serving 500+ families" — large scale
  const largeFoundedFeatures = buildDescFeatures({
    activityId: 'large-founded',
    verbs: [
      { verb: 'founded', lemma: 'found', context: 'Founded nonprofit serving 500+ families', isIndividualAction: true },
      { verb: 'serving', lemma: 'serve', context: 'serving 500+ families in need', isIndividualAction: true },
      { verb: 'partnered', lemma: 'partner', context: 'Partnered with 3 local organizations', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '500+', numericValue: 500, unit: 'families served', hasContext: true, isMeaningful: true },
      { rawValue: '3', numericValue: 3, unit: 'partner organizations', hasContext: true, isMeaningful: true },
    ],
    roleOwnership: {
      individualPhrases: ['Founded nonprofit', 'Partnered with 3 local organizations'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [
        { action: 'Founded nonprofit and partnered with organizations', outcome: 'Serving 500+ families in need', hasExternalValidation: true },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
    differentiation: {
      uniqueDetails: ['500+ families', '3 partner organizations'],
      genericPhrases: [],
      passesThousandStudentTest: true,
      standoutElement: 'Nonprofit with measurable community impact',
    },
    characterEfficiency: {
      totalChars: 110,
      charLimit: 150,
      utilizationRate: 0.73,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: ['specific scale', 'partner organizations'],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'community_service',
  });

  const smallScore = descriptionRuleScorerService.scoreDescription(smallFoundedFeatures);
  const largeScore = descriptionRuleScorerService.scoreDescription(largeFoundedFeatures);

  console.log(`  Small founded: total=${smallScore.total}`);
  console.log(`  Large founded: total=${largeScore.total}`);

  // Small "founded" should get moderate-low score
  assert(
    smallScore.total <= 5.5,
    `Small founded score <= 5.5`,
    `got ${smallScore.total}`
  );

  // Large "founded" should get solid score
  assert(
    largeScore.total >= 7.5,
    `Large founded score >= 7.5`,
    `got ${largeScore.total}`
  );

  // Large should clearly beat small
  assert(
    largeScore.total > smallScore.total + 1.0,
    `Large founded (${largeScore.total}) > Small founded (${smallScore.total}) + 1.0`
  );
}

// ============================================================================
// TEST 7: Hours/Week Context (Issue 8)
// ============================================================================

function testHoursWeekContext(): void {
  console.log('\n--- Test 7: Hours/Week Context (Issue 8) ---');

  // 20hr/wk retail job
  const retailEvidence = buildEvidence({
    scope: { level: 'local', confidence: 0.7, evidence: 'Part-time retail job' },
    recognitions: [],
    role: { title: 'Sales Associate', type: 'contributor', isLeadershipApplicable: false, evidence: 'Retail sales associate' },
    impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
    commitment: { yearsActive: 2, hoursPerWeek: 20, weeksPerYear: 50, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
    character: { primaryTrait: 'discipline', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: [] },
    categoryMatch: { category: 'work_employment', confidence: 'high' },
    overallSignalStrength: 'moderate',
  });

  // 20hr/wk research lab
  const researchEvidence = buildEvidence({
    scope: { level: 'regional', confidence: 0.8, evidence: 'University research lab' },
    recognitions: [],
    role: { title: 'Research Assistant', type: 'contributor', isLeadershipApplicable: false, evidence: 'Research assistant at university lab' },
    impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '200', unit: 'samples processed', context: 'Processed 200 tissue samples weekly', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['Contributed to ongoing cancer research project'] },
    commitment: { yearsActive: 2, hoursPerWeek: 20, weeksPerYear: 40, showsProgression: true, progressionArc: 'observer -> trained technician -> independent researcher', sustainedThroughJunior: true },
    character: { primaryTrait: 'curiosity', communityBenefit: 'significant', authenticitySignals: ['specific lab tasks', 'progression arc'], paddingSignals: [] },
    categoryMatch: { category: 'stem_research', confidence: 'high' },
    overallSignalStrength: 'strong',
  });

  const retailTier = classifyTier(retailEvidence);
  const researchTier = classifyTier(researchEvidence);

  const retailScore = activityRuleScorerService.scoreActivity(retailEvidence, retailTier);
  const researchScore = activityRuleScorerService.scoreActivity(researchEvidence, researchTier);

  console.log(`  Retail (20hr/wk):   tier=${retailTier.internalTier}, score=${retailScore.total}`);
  console.log(`  Research (20hr/wk): tier=${researchTier.internalTier}, score=${researchScore.total}`);

  // Research lab should score higher despite same hours
  assert(
    researchScore.total > retailScore.total,
    `Research lab (${researchScore.total}) > Retail job (${retailScore.total}) despite same hours`
  );
}

// ============================================================================
// TEST 8: Mid-Tier Spread (Issue 9)
// ============================================================================

function testMidTierSpread(): void {
  console.log('\n--- Test 8: Mid-Tier Spread (Issue 9) ---');

  // Five genuinely different mid-tier activities
  const midTierActivities: { name: string; evidence: ExtractedEvidence }[] = [
    {
      name: 'School Club Member',
      evidence: buildEvidence({
        scope: { level: 'school', confidence: 0.6, evidence: 'Member of school environmental club' },
        role: { title: 'Member', type: 'member', isLeadershipApplicable: true, evidence: 'Active member' },
        commitment: { yearsActive: 1, hoursPerWeek: 2, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
        character: { primaryTrait: 'service', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
        categoryMatch: { category: 'environmental', confidence: 'medium' },
        overallSignalStrength: 'weak',
      }),
    },
    {
      name: 'Volunteer Tutor',
      evidence: buildEvidence({
        scope: { level: 'school', confidence: 0.7, evidence: 'Volunteer tutor for underclassmen' },
        role: { title: 'Tutor', type: 'contributor', isLeadershipApplicable: true, evidence: 'Peer tutoring in math' },
        impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '15', unit: 'students helped weekly', context: 'Tutored 15 students weekly', isVerifiable: false }], estimatedPeopleReached: 15, tangibleOutcomes: ['Regular tutoring sessions'] },
        commitment: { yearsActive: 2, hoursPerWeek: 4, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
        character: { primaryTrait: 'service', communityBenefit: 'moderate', authenticitySignals: ['regular schedule'], paddingSignals: [] },
        categoryMatch: { category: 'tutoring', confidence: 'high' },
        overallSignalStrength: 'moderate',
      }),
    },
    {
      name: 'Varsity Athlete',
      evidence: buildEvidence({
        scope: { level: 'school', confidence: 0.8, evidence: 'Varsity soccer team' },
        recognitions: [{ name: 'Varsity Letter', level: 'school', isVerifiable: true }],
        role: { title: 'Team Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Captain of varsity soccer team' },
        commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 36, showsProgression: true, progressionArc: 'JV -> Varsity -> Captain', sustainedThroughJunior: true },
        character: { primaryTrait: 'discipline', communityBenefit: 'moderate', authenticitySignals: ['4 years of commitment'], paddingSignals: [] },
        categoryMatch: { category: 'athletics', confidence: 'high' },
        overallSignalStrength: 'moderate',
      }),
    },
    {
      name: 'Student Newspaper Editor',
      evidence: buildEvidence({
        scope: { level: 'school', confidence: 0.7, evidence: 'Student newspaper' },
        recognitions: [{ name: 'Best Feature Article award', level: 'school', isVerifiable: false }],
        role: { title: 'Section Editor', type: 'team_lead', isLeadershipApplicable: true, evidence: 'Features section editor' },
        impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '20', unit: 'articles per semester', context: 'Edited 20 articles per semester', isVerifiable: false }], estimatedPeopleReached: 200, tangibleOutcomes: ['Edited features section'] },
        commitment: { yearsActive: 3, hoursPerWeek: 6, weeksPerYear: 36, showsProgression: true, progressionArc: 'writer -> section editor', sustainedThroughJunior: true },
        character: { primaryTrait: 'creativity', communityBenefit: 'moderate', authenticitySignals: ['specific section', 'article count'], paddingSignals: [] },
        categoryMatch: { category: 'journalism', confidence: 'high' },
        overallSignalStrength: 'moderate',
      }),
    },
    {
      name: 'Part-Time Job with Initiative',
      evidence: buildEvidence({
        scope: { level: 'local', confidence: 0.7, evidence: 'Part-time job at coffee shop' },
        recognitions: [],
        role: { title: 'Shift Lead', type: 'team_lead', isLeadershipApplicable: true, evidence: 'Promoted to shift lead' },
        impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '8', unit: 'team members managed', context: 'Managed team of 8 per shift', isVerifiable: false }], estimatedPeopleReached: null, tangibleOutcomes: ['Promoted to shift lead', 'Managed team during peak hours'] },
        commitment: { yearsActive: 2, hoursPerWeek: 15, weeksPerYear: 50, showsProgression: true, progressionArc: 'barista -> shift lead', sustainedThroughJunior: true },
        character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: ['specific promotion path'], paddingSignals: [] },
        categoryMatch: { category: 'work_employment', confidence: 'high' },
        overallSignalStrength: 'moderate',
      }),
    },
  ];

  const scores: number[] = [];
  for (const act of midTierActivities) {
    const tier = classifyTier(act.evidence);
    const score = activityRuleScorerService.scoreActivity(act.evidence, tier);
    scores.push(score.total);
    console.log(`  ${act.name.padEnd(30)} tier=${tier.internalTier}  score=${score.total}`);
  }

  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const spread = maxScore - minScore;

  console.log(`  Spread: ${spread.toFixed(1)} (min=${minScore}, max=${maxScore})`);

  // Spread across the group should be >= 1.5 points
  assert(
    spread >= 1.5,
    `Mid-tier spread >= 1.5`,
    `got ${spread.toFixed(1)} (min=${minScore}, max=${maxScore})`
  );
}

// ============================================================================
// TEST 9: Quantification Significance (Issue 10)
// ============================================================================

function testQuantificationSignificance(): void {
  console.log('\n--- Test 9: Quantification Significance (Issue 10) ---');

  // "89% retention rate" — percentage metric
  const percentageFeatures = buildDescFeatures({
    activityId: 'percentage-metric',
    verbs: [
      { verb: 'achieved', lemma: 'achieve', context: 'Achieved 89% student retention rate', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '89%', numericValue: 89, unit: 'retention rate', hasContext: true, isMeaningful: true },
    ],
    roleOwnership: {
      individualPhrases: ['Achieved 89% student retention rate'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: true,
    },
    impact: {
      causalChains: [
        { action: 'Implemented new tutoring curriculum', outcome: '89% retention rate', hasExternalValidation: false },
      ],
      unsupportedClaims: [],
      hasMeasurableOutcome: true,
    },
    differentiation: {
      uniqueDetails: ['89% retention rate'],
      genericPhrases: [],
      passesThousandStudentTest: true,
    },
    characterEfficiency: {
      totalChars: 70,
      charLimit: 150,
      utilizationRate: 0.47,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: ['specific percentage'],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'community_service',
  });

  // "helped 8 students" — small absolute number, low significance
  const smallNumberFeatures = buildDescFeatures({
    activityId: 'small-number',
    verbs: [
      { verb: 'helped', lemma: 'help', context: 'Helped 8 students with homework', isIndividualAction: true },
    ],
    numbers: [
      { rawValue: '8', numericValue: 8, unit: 'students', hasContext: false, isMeaningful: false, vanityReason: 'small count without context' },
    ],
    roleOwnership: {
      individualPhrases: ['Helped 8 students'],
      teamPhrases: [],
      usesFirstPerson: false,
      firstPersonInstances: [],
      roleClearFromDescription: false,
    },
    impact: {
      causalChains: [],
      unsupportedClaims: [],
      hasMeasurableOutcome: false,
    },
    differentiation: {
      uniqueDetails: [],
      genericPhrases: ['helped students with homework'],
      passesThousandStudentTest: false,
    },
    characterEfficiency: {
      totalChars: 40,
      charLimit: 150,
      utilizationRate: 0.27,
      wastedPatterns: [],
      usesFragments: true,
      restatesPosition: false,
    },
    authenticity: {
      overclaiming: [],
      authenticityMarkers: [],
      readsAsAIGenerated: false,
    },
    detectedActivityType: 'community_service',
  });

  const percentageScore = descriptionRuleScorerService.scoreDescription(percentageFeatures);
  const smallNumScore = descriptionRuleScorerService.scoreDescription(smallNumberFeatures);

  // Compare the quantification dimension specifically
  const percentQuant = percentageScore.breakdown.quantification.score;
  const smallQuant = smallNumScore.breakdown.quantification.score;

  console.log(`  Percentage metric (89%):   quant=${percentQuant}, total=${percentageScore.total}`);
  console.log(`  Small number (8 students): quant=${smallQuant}, total=${smallNumScore.total}`);

  // Percentage should get higher quantification score
  assert(
    percentQuant > smallQuant,
    `Percentage quantification (${percentQuant}) > Small number quantification (${smallQuant})`
  );

  // Overall score should also reflect this
  assert(
    percentageScore.total > smallNumScore.total,
    `Percentage total (${percentageScore.total}) > Small number total (${smallNumScore.total})`
  );
}

// ============================================================================
// TEST 10: Title-Only Cap (Issue 6 specific)
// ============================================================================

function testTitleOnlyCap(): void {
  console.log('\n--- Test 10: Title-Only Cap (Issue 6) ---');

  // "President of Chess Club — led weekly meetings" — minimal actions described
  const titleOnlyEvidence = buildEvidence({
    scope: { level: 'school', confidence: 0.6, evidence: 'School chess club' },
    recognitions: [],
    role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'President of chess club' },
    impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: ['Weekly meetings'] },
    commitment: { yearsActive: 1, hoursPerWeek: 3, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
    character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: ['title without supporting evidence'] },
    categoryMatch: { category: 'general', confidence: 'medium' },
    overallSignalStrength: 'weak',
  });

  const tier = classifyTier(titleOnlyEvidence);
  const score = activityRuleScorerService.scoreActivity(titleOnlyEvidence, tier);

  console.log(`  President (no actions): tier=${tier.internalTier}, score=${score.total}`);

  // Score should be moderate (4-6), NOT high (8+)
  assertRange(score.total, 2.0, 6.0, `Title-only President score in moderate range (${score.total})`);

  // Should NOT be classified as Tier 1 or 2
  assert(
    tier.internalTier >= 4,
    `Title-only President not high tier`,
    `got internal tier ${tier.internalTier}`
  );
}

// ============================================================================
// TEST 11: Regression — Tier Score Ranges Are Non-Overlapping
// ============================================================================

function testTierRangesNonOverlapping(): void {
  console.log('\n--- Test 11: Regression — Tier Ranges Non-Overlapping ---');

  const tiers = [1, 2, 3, 4, 5, 6] as const;

  // Verify each tier range is valid (min < max)
  for (const t of tiers) {
    const range = TIER_SCORE_RANGES[t];
    assert(
      range.min < range.max,
      `Tier ${t} range valid: min(${range.min}) < max(${range.max})`
    );
  }

  // Verify no overlaps: tier N max < tier N+1 max AND tier N min > tier N+1 min
  // (lower tier number = better score = higher range)
  for (let i = 0; i < tiers.length - 1; i++) {
    const higher = TIER_SCORE_RANGES[tiers[i]];
    const lower = TIER_SCORE_RANGES[tiers[i + 1]];
    assert(
      higher.min > lower.max,
      `Tier ${tiers[i]} min (${higher.min}) > Tier ${tiers[i + 1]} max (${lower.max}) — no overlap`
    );
  }
}

// ============================================================================
// TEST 12: Activity Rule Scorer respects tier clamping
// ============================================================================

function testActivityScorerTierClamping(): void {
  console.log('\n--- Test 12: Activity Scorer Tier Clamping ---');

  // Create an activity with inflated evidence but low tier
  const lowTierEvidence = buildEvidence({
    scope: { level: 'school', confidence: 0.5, evidence: 'School club' },
    recognitions: [],
    role: { title: 'Member', type: 'member', isLeadershipApplicable: true, evidence: 'Member' },
    commitment: { yearsActive: 1, hoursPerWeek: 2, weeksPerYear: 20, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
    character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
    categoryMatch: { category: 'general', confidence: 'low' },
    overallSignalStrength: 'weak',
  });

  const tier = classifyTier(lowTierEvidence);
  const score = activityRuleScorerService.scoreActivity(lowTierEvidence, tier);

  // The score must fall within the tier's allowed range
  const expectedRange = TIER_SCORE_RANGES[tier.internalTier];

  console.log(`  Tier ${tier.internalTier}: expected range ${expectedRange.min}-${expectedRange.max}, got ${score.total}`);

  assertRange(
    score.total,
    expectedRange.min,
    expectedRange.max,
    `Score ${score.total} within tier ${tier.internalTier} range [${expectedRange.min}, ${expectedRange.max}]`
  );
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function main(): void {
  console.log('================================================================');
  console.log('  Scoring Calibration Edge-Case Tests (All 10 Issues + Regression)');
  console.log('================================================================');

  try { testResearchVsTutoring(); } catch (e) { failed++; failures.push(`Test 1 crashed: ${e}`); console.log(`  CRASH: Test 1 - ${e}`); }
  try { testTitleInflation(); } catch (e) { failed++; failures.push(`Test 2 crashed: ${e}`); console.log(`  CRASH: Test 2 - ${e}`); }
  try { testSelectivityContext(); } catch (e) { failed++; failures.push(`Test 3 crashed: ${e}`); console.log(`  CRASH: Test 3 - ${e}`); }
  try { testJargonWithoutOutcome(); } catch (e) { failed++; failures.push(`Test 4 crashed: ${e}`); console.log(`  CRASH: Test 4 - ${e}`); }
  try { testPortfolioScoreConsistency(); } catch (e) { failed++; failures.push(`Test 5 crashed: ${e}`); console.log(`  CRASH: Test 5 - ${e}`); }
  try { testFoundedScaling(); } catch (e) { failed++; failures.push(`Test 6 crashed: ${e}`); console.log(`  CRASH: Test 6 - ${e}`); }
  try { testHoursWeekContext(); } catch (e) { failed++; failures.push(`Test 7 crashed: ${e}`); console.log(`  CRASH: Test 7 - ${e}`); }
  try { testMidTierSpread(); } catch (e) { failed++; failures.push(`Test 8 crashed: ${e}`); console.log(`  CRASH: Test 8 - ${e}`); }
  try { testQuantificationSignificance(); } catch (e) { failed++; failures.push(`Test 9 crashed: ${e}`); console.log(`  CRASH: Test 9 - ${e}`); }
  try { testTitleOnlyCap(); } catch (e) { failed++; failures.push(`Test 10 crashed: ${e}`); console.log(`  CRASH: Test 10 - ${e}`); }
  try { testTierRangesNonOverlapping(); } catch (e) { failed++; failures.push(`Test 11 crashed: ${e}`); console.log(`  CRASH: Test 11 - ${e}`); }
  try { testActivityScorerTierClamping(); } catch (e) { failed++; failures.push(`Test 12 crashed: ${e}`); console.log(`  CRASH: Test 12 - ${e}`); }

  console.log('\n================================================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
}

main();
