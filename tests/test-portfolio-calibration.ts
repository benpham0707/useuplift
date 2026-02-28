/**
 * Portfolio Calibration Unit Tests — $0.00 cost (pure code, no API calls)
 *
 * Tests the cross-activity calibration rules:
 * 1. Evidence Consistency — hard invariants between evidence and component scores
 * 2. Relative Ordering — higher-tier activities MUST score higher
 * 3. Minimum Spread — prevent score clustering
 * 4. Major Relevance Annotation — correct tagging for downstream scoring
 *
 * Run: npx tsx tests/test-portfolio-calibration.ts
 */

import {
  calibratePortfolio,
  type CalibrationInput,
  type PortfolioCalibrationResult,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioCalibrator';
import type {
  ActivityScore,
  ExtractedEvidence,
  TierClassification,
  InternalTier,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import {
  TIER_SCORE_RANGES,
  TIER_COMPONENT_CONSTRAINTS,
  TIER_ASSESSMENT_SCORES,
  INTERNAL_TO_EXTERNAL_TIER,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

// ============================================================================
// TEST HELPERS
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

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U> ? Array<DeepPartial<U>>
    : T[P] extends object ? DeepPartial<T[P]>
    : T[P];
};

function makeEvidence(overrides: DeepPartial<ExtractedEvidence> = {}): ExtractedEvidence {
  return {
    scope: {
      level: 'school',
      confidence: 0.5,
      evidence: 'default',
      ...overrides.scope,
    },
    recognitions: (overrides.recognitions ?? []) as ExtractedEvidence['recognitions'],
    role: {
      title: 'member',
      type: 'member',
      isLeadershipApplicable: true,
      evidence: 'default',
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
      hoursPerWeek: 2,
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
    overallSignalStrength: (overrides.overallSignalStrength as ExtractedEvidence['overallSignalStrength']) ?? 'moderate',
  };
}

function makeTier(internalTier: InternalTier, confidence: 'high' | 'medium' | 'low' = 'medium'): TierClassification {
  const range = TIER_SCORE_RANGES[internalTier];
  const tierScores = TIER_ASSESSMENT_SCORES[internalTier];
  return {
    internalTier,
    externalTier: INTERNAL_TO_EXTERNAL_TIER[internalTier],
    confidence,
    signals: [],
    scoreRange: { ...range },
    componentConstraints: { ...TIER_COMPONENT_CONSTRAINTS[internalTier] },
    tierScore: tierScores.base,
    reasoning: `Test tier ${internalTier}`,
  };
}

function makeActivityScore(
  total: number,
  tier: InternalTier,
  overrides: {
    recognitionScore?: number;
    leadershipScore?: number;
    leadershipApplicable?: boolean;
    communityScore?: number;
    communityAuthenticitySignal?: 'highly_authentic' | 'genuine' | 'neutral' | 'resume_padding';
    commitmentScore?: number;
    commitmentYears?: number;
    commitmentProgression?: boolean;
  } = {}
): ActivityScore {
  const tierScores = TIER_ASSESSMENT_SCORES[tier];
  const leadershipApplicable = overrides.leadershipApplicable ?? true;

  // Weights
  const tierWeight = leadershipApplicable ? 0.30 : 0.343;
  const recWeight = leadershipApplicable ? 0.25 : 0.286;
  const leadWeight = leadershipApplicable ? 0.125 : 0;
  const commWeight = leadershipApplicable ? 0.15 : 0.171;
  const commitWeight = leadershipApplicable ? 0.175 : 0.20;

  const tierScore = tierScores.base;
  const recScore = overrides.recognitionScore ?? 5;
  const leadScore = overrides.leadershipScore ?? 5;
  const commScore = overrides.communityScore ?? 5;
  const commitScore = overrides.commitmentScore ?? 5;

  return {
    total,
    breakdown: {
      tierAssessment: {
        score: tierScore,
        maxScore: 10,
        weight: tierWeight,
        weightedScore: tierScore * tierWeight,
        rationale: 'test',
        tier: INTERNAL_TO_EXTERNAL_TIER[tier],
      },
      recognitionLevel: {
        score: recScore,
        maxScore: 10,
        weight: recWeight,
        weightedScore: recScore * recWeight,
        rationale: 'test',
        level: 'school',
      },
      leadershipImpact: {
        score: leadScore,
        maxScore: 10,
        weight: leadWeight,
        weightedScore: leadScore * leadWeight,
        rationale: 'test',
        isApplicable: leadershipApplicable,
        role: 'member',
        impactScope: 'individual',
      },
      communityCharacter: {
        score: commScore,
        maxScore: 10,
        weight: commWeight,
        weightedScore: commScore * commWeight,
        rationale: 'test',
        primaryTrait: 'discipline',
        communityBenefit: 'minimal',
        authenticitySignal: overrides.communityAuthenticitySignal ?? 'neutral',
      },
      commitmentProgression: {
        score: commitScore,
        maxScore: 10,
        weight: commitWeight,
        weightedScore: commitScore * commitWeight,
        rationale: 'test',
        years: overrides.commitmentYears ?? 1,
        showsProgression: overrides.commitmentProgression ?? false,
        sustainedThroughJunior: false,
      },
      weightConfig: {
        tierWeight,
        recognitionWeight: recWeight,
        leadershipWeight: leadWeight,
        communityWeight: commWeight,
        commitmentWeight: commitWeight,
        leadershipApplicable,
      },
    },
    tierJustification: 'test',
    comparisonBenchmarks: { similarTo: '', above: '', below: '' },
    improvementPaths: [],
    overallRationale: 'test',
  };
}

function makeInput(
  id: string,
  title: string,
  tier: InternalTier,
  total: number,
  evidenceOverrides: DeepPartial<ExtractedEvidence> = {},
  scoreOverrides: Parameters<typeof makeActivityScore>[2] = {}
): CalibrationInput {
  return {
    activityId: id,
    activityTitle: title,
    score: makeActivityScore(total, tier, scoreOverrides),
    tier: makeTier(tier),
    evidence: makeEvidence(evidenceOverrides),
  };
}

// ============================================================================
// TEST: EMPTY PORTFOLIO
// ============================================================================

function testEmptyPortfolio(): void {
  console.log('\n-- Empty Portfolio --');
  const result = calibratePortfolio([]);
  assert(result.activities.length === 0, 'No activities returned');
  assert(result.summary.totalActivities === 0, 'Total is 0');
  assert(result.summary.activitiesAdjusted === 0, 'None adjusted');
}

// ============================================================================
// TEST: SINGLE ACTIVITY (no cross-activity rules apply)
// ============================================================================

function testSingleActivity(): void {
  console.log('\n-- Single Activity --');
  const input = makeInput('solo', 'CS Club', 4, 4.5);
  const result = calibratePortfolio([input]);
  assert(result.activities.length === 1, 'One activity returned');
  // Score should stay within tier 4 range (4.0-5.4)
  assert(result.activities[0].score.total >= 4.0, 'Score >= tier 4 min');
  assert(result.activities[0].score.total <= 5.4, 'Score <= tier 4 max');
}

// ============================================================================
// TEST: EVIDENCE CONSISTENCY — Recognition
// ============================================================================

function testEvidenceConsistency_RecognitionCap(): void {
  console.log('\n-- Evidence Consistency: No recognitions caps score at 3 --');
  const input = makeInput('no-rec', 'Science Club', 5, 3.0, {
    recognitions: [], // No recognitions
  }, { recognitionScore: 6 }); // LLM gave 6 despite no recognitions

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.recognitionLevel.score <= 3,
    `Recognition capped at 3 (got ${activity.score.breakdown.recognitionLevel.score})`
  );
  assert(activity.wasAdjusted, 'Activity was adjusted');
  assert(
    activity.adjustments.some(a => a.rule === 'EVIDENCE_CONSISTENCY'),
    'EVIDENCE_CONSISTENCY rule applied'
  );
}

function testEvidenceConsistency_NationalRecognitionFloor(): void {
  console.log('\n-- Evidence Consistency: National recognition floors at 7 --');
  const input = makeInput('natl-rec', 'USAMO', 2, 7.5, {
    recognitions: [{ name: 'USAMO Qualifier', level: 'national', isVerifiable: true }],
  }, { recognitionScore: 4 }); // LLM underscored

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.recognitionLevel.score >= 7,
    `Recognition floored at 7 (got ${activity.score.breakdown.recognitionLevel.score})`
  );
}

// ============================================================================
// TEST: EVIDENCE CONSISTENCY — Leadership
// ============================================================================

function testEvidenceConsistency_FounderFloor(): void {
  console.log('\n-- Evidence Consistency: Founder role floors leadership at 5 --');
  const input = makeInput('founder', 'CS Club', 4, 4.5, {
    role: { type: 'founder', title: 'Founder', isLeadershipApplicable: true, evidence: 'Founded club' },
  }, { leadershipScore: 2, leadershipApplicable: true });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.leadershipImpact.score >= 5,
    `Founder leadership floored at 5 (got ${activity.score.breakdown.leadershipImpact.score})`
  );
}

function testEvidenceConsistency_PassiveMemberCap(): void {
  console.log('\n-- Evidence Consistency: Passive member caps leadership at 3 --');
  const input = makeInput('member', 'NHS', 5, 3.0, {
    role: { type: 'member', title: 'Member', isLeadershipApplicable: true, evidence: 'Member' },
  }, { leadershipScore: 7, leadershipApplicable: true });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.leadershipImpact.score <= 3,
    `Member leadership capped at 3 (got ${activity.score.breakdown.leadershipImpact.score})`
  );
}

// ============================================================================
// TEST: EVIDENCE CONSISTENCY — Community
// ============================================================================

function testEvidenceConsistency_SelfFocusedCap(): void {
  console.log('\n-- Evidence Consistency: Self-focused caps community at 4 --');
  const input = makeInput('self', 'Personal Blog', 5, 3.0, {
    character: { communityBenefit: 'self-focused', primaryTrait: 'creativity', authenticitySignals: [], paddingSignals: [] },
  }, { communityScore: 7 });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.communityCharacter.score <= 4,
    `Self-focused community capped at 4 (got ${activity.score.breakdown.communityCharacter.score})`
  );
}

function testEvidenceConsistency_SignificantCommunityFloor(): void {
  console.log('\n-- Evidence Consistency: Significant community floors at 5 --');
  const input = makeInput('service', 'Homeless Shelter', 4, 4.5, {
    character: { communityBenefit: 'significant', primaryTrait: 'service', authenticitySignals: ['weekly shifts for 2 years'], paddingSignals: [] },
  }, { communityScore: 2 });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.communityCharacter.score >= 5,
    `Significant community floored at 5 (got ${activity.score.breakdown.communityCharacter.score})`
  );
}

function testEvidenceConsistency_ResumePaddingCap(): void {
  console.log('\n-- Evidence Consistency: Resume padding caps community at 3 --');
  const input = makeInput('padding', 'One-Day Volunteer', 6, 1.5, {}, {
    communityScore: 6,
    communityAuthenticitySignal: 'resume_padding',
  });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.communityCharacter.score <= 3,
    `Resume padding community capped at 3 (got ${activity.score.breakdown.communityCharacter.score})`
  );
}

// ============================================================================
// TEST: EVIDENCE CONSISTENCY — Commitment
// ============================================================================

function testEvidenceConsistency_ThreeYearsFloor(): void {
  console.log('\n-- Evidence Consistency: 3+ years floors commitment at 5 --');
  const input = makeInput('loyal', 'Track Team', 4, 4.5, {
    commitment: { yearsActive: 3, showsProgression: false, hoursPerWeek: 5, weeksPerYear: 36, progressionArc: null, sustainedThroughJunior: false },
  }, { commitmentScore: 2, commitmentYears: 3 });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.commitmentProgression.score >= 5,
    `3yr commitment floored at 5 (got ${activity.score.breakdown.commitmentProgression.score})`
  );
}

function testEvidenceConsistency_ProgressionArcFloor(): void {
  console.log('\n-- Evidence Consistency: 3yr + progression floors commitment at 6 --');
  const input = makeInput('growth', 'Debate', 3, 6.0, {
    commitment: { yearsActive: 4, showsProgression: true, hoursPerWeek: 8, weeksPerYear: 36, progressionArc: 'member → captain', sustainedThroughJunior: true },
  }, { commitmentScore: 4, commitmentYears: 4, commitmentProgression: true });

  const result = calibratePortfolio([input]);
  const activity = result.activities[0];
  assert(
    activity.score.breakdown.commitmentProgression.score >= 6,
    `4yr with progression floored at 6 (got ${activity.score.breakdown.commitmentProgression.score})`
  );
}

// ============================================================================
// TEST: RELATIVE ORDERING
// ============================================================================

function testRelativeOrdering_HigherTierScoresHigher(): void {
  console.log('\n-- Relative Ordering: Higher tier must score higher --');
  // Tier 3 activity scored 6.5 while Tier 5 activity scored 3.5 — correct, should not change
  const tier3 = makeInput('research', 'Research', 3, 6.5);
  const tier5 = makeInput('club', 'Club Member', 5, 3.0);

  const result = calibratePortfolio([tier3, tier5]);
  const researchOut = result.activities.find(a => a.activityId === 'research')!;
  const clubOut = result.activities.find(a => a.activityId === 'club')!;

  assert(
    researchOut.score.total > clubOut.score.total,
    `Research (Tier 3: ${researchOut.score.total}) > Club (Tier 5: ${clubOut.score.total})`
  );
}

function testRelativeOrdering_FixesViolation(): void {
  console.log('\n-- Relative Ordering: Fixes tier-score violation --');
  // BUG CASE: Tier 4 grocery (5.2) scored higher than Tier 3 research (5.0)
  const research = makeInput('research', 'ML Research', 3, 5.5);
  const grocery = makeInput('grocery', 'Grocery Store', 4, 5.5);

  const result = calibratePortfolio([research, grocery]);
  const researchOut = result.activities.find(a => a.activityId === 'research')!;
  const groceryOut = result.activities.find(a => a.activityId === 'grocery')!;

  assert(
    researchOut.score.total > groceryOut.score.total,
    `Research (${researchOut.score.total}) > Grocery (${groceryOut.score.total}) after calibration`
  );
  assert(
    researchOut.score.total - groceryOut.score.total >= 0.1, // At least some gap
    `Gap between research and grocery is >= 0.1`
  );
}

function testRelativeOrdering_ThreeActivitiesDifferentTiers(): void {
  console.log('\n-- Relative Ordering: Three activities across tiers --');
  const tier2 = makeInput('usamo', 'USAMO', 2, 8.0);
  const tier4 = makeInput('cs-club', 'CS Club', 4, 5.0);
  const tier6 = makeInput('passive', 'Science Club', 6, 2.0);

  const result = calibratePortfolio([tier2, tier4, tier6]);
  const scores = result.activities.map(a => ({ id: a.activityId, total: a.score.total }));
  const usamo = scores.find(s => s.id === 'usamo')!;
  const csClub = scores.find(s => s.id === 'cs-club')!;
  const passive = scores.find(s => s.id === 'passive')!;

  assert(usamo.total > csClub.total, `USAMO (${usamo.total}) > CS Club (${csClub.total})`);
  assert(csClub.total > passive.total, `CS Club (${csClub.total}) > Passive (${passive.total})`);
}

// ============================================================================
// TEST: MINIMUM SPREAD
// ============================================================================

function testMinimumSpread_NoActionWhenAdequate(): void {
  console.log('\n-- Minimum Spread: No action when spread is adequate --');
  // Use evidence-consistent overrides so evidence rules don't trigger
  // (default evidence has empty recognitions + member role → caps scores)
  const inputs = [
    makeInput('a', 'Activity A', 3, 6.5, {
      recognitions: [{ name: 'State Award', level: 'regional', isVerifiable: true }],
      role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'led org' },
    }, { recognitionScore: 5, leadershipScore: 5 }),
    makeInput('b', 'Activity B', 4, 4.5, {
      recognitions: [{ name: 'School Award', level: 'school', isVerifiable: true }],
      role: { title: 'Vice President', type: 'officer', isLeadershipApplicable: true, evidence: 'VP' },
    }, { recognitionScore: 5, leadershipScore: 5 }),
    makeInput('c', 'Activity C', 5, 2.5, {}, { recognitionScore: 3, leadershipScore: 3 }),
  ];

  const result = calibratePortfolio(inputs);
  assert(
    !result.summary.spreadEnforced,
    'Spread enforcement not needed (range = 4.0)'
  );
}

function testMinimumSpread_EnforcesWhenClustered(): void {
  console.log('\n-- Minimum Spread: Enforces spread when scores cluster --');
  // All three activities scored within 0.5 of each other — in different tiers
  const inputs = [
    makeInput('a', 'Activity A', 3, 5.8),
    makeInput('b', 'Activity B', 4, 5.3),
    makeInput('c', 'Activity C', 5, 5.2), // This is ABOVE tier 5 range (2.5-3.9) — will get clamped
  ];

  const result = calibratePortfolio(inputs);
  const scores = result.activities.map(a => a.score.total);
  const range = Math.max(...scores) - Math.min(...scores);

  // Tier clamping should spread them: Tier 3 (5.5-6.9), Tier 4 (4.0-5.4), Tier 5 (2.5-3.9)
  assert(
    range >= 1.5,
    `Score range after calibration is ${range.toFixed(1)} (should be >= 1.5 after tier clamping)`
  );
}

function testMinimumSpread_TwoActivitiesSkipped(): void {
  console.log('\n-- Minimum Spread: Skipped for < 3 activities --');
  const inputs = [
    makeInput('a', 'Activity A', 4, 4.5),
    makeInput('b', 'Activity B', 4, 4.7),
  ];

  const result = calibratePortfolio(inputs);
  // With only 2 activities, spread enforcement is skipped
  assert(
    !result.summary.spreadEnforced,
    'Spread enforcement skipped for 2 activities'
  );
}

// ============================================================================
// TEST: TIER RANGE CLAMPING
// ============================================================================

function testTierRangeClamping_ClampsAbove(): void {
  console.log('\n-- Tier Range Clamping: Clamps above max --');
  // Tier 5 range is 2.5-3.9, but score is 5.0
  const input = makeInput('over', 'Over-scored', 5, 5.0);
  const result = calibratePortfolio([input]);
  assert(
    result.activities[0].score.total <= 3.9,
    `Score clamped to tier 5 max (got ${result.activities[0].score.total})`
  );
}

function testTierRangeClamping_ClampsBelow(): void {
  console.log('\n-- Tier Range Clamping: Clamps below min --');
  // Tier 3 range is 5.5-6.9, but score is 3.0
  const input = makeInput('under', 'Under-scored', 3, 3.0);
  const result = calibratePortfolio([input]);
  assert(
    result.activities[0].score.total >= 5.5,
    `Score clamped to tier 3 min (got ${result.activities[0].score.total})`
  );
}

function testTierRangeClamping_NoOpWhenInRange(): void {
  console.log('\n-- Tier Range Clamping: No-op when in range --');
  // Use evidence-consistent data so evidence consistency rules don't change the total
  // Default evidence has empty recognitions + member role → caps recognition & leadership at 3
  const input = makeInput('ok', 'In Range', 4, 4.8, {
    recognitions: [{ name: 'School Award', level: 'school', isVerifiable: true }],
    role: { title: 'Vice President', type: 'officer', isLeadershipApplicable: true, evidence: 'VP' },
  }, { recognitionScore: 5, leadershipScore: 5 });
  const result = calibratePortfolio([input]);
  // Should not be clamped — 4.8 is within tier 4 range (4.0-5.4)
  assert(
    result.activities[0].score.total === 4.8,
    `Score unchanged at 4.8 (got ${result.activities[0].score.total})`
  );
}

// ============================================================================
// TEST: MAJOR RELEVANCE ANNOTATION
// ============================================================================

function testMajorRelevance_CoreDetection(): void {
  console.log('\n-- Major Relevance: Core detection for CS major --');
  const input = makeInput('cs', 'Computer Science Club', 4, 4.5, {
    categoryMatch: { category: 'technology', confidence: 'high' },
    impact: { tangibleOutcomes: ['Built web app', 'Taught programming to students'], hasQuantifiedOutcomes: true, metrics: [], estimatedPeopleReached: 25 },
  });

  const result = calibratePortfolio([input], 'Computer Science');
  const annotation = result.activities[0].majorRelevance;
  assert(
    annotation.relevance === 'core',
    `CS Club is core for CS major (got ${annotation.relevance})`
  );
}

function testMajorRelevance_UnrelatedDetection(): void {
  console.log('\n-- Major Relevance: Unrelated detection --');
  const input = makeInput('farm', 'Family Farm', 5, 3.0, {
    categoryMatch: { category: 'work_family', confidence: 'high' },
    impact: { tangibleOutcomes: ['Managed irrigation'], hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null },
  });

  const result = calibratePortfolio([input], 'Computer Science');
  const annotation = result.activities[0].majorRelevance;
  assert(
    annotation.relevance === 'unrelated',
    `Farm is unrelated for CS major (got ${annotation.relevance})`
  );
}

function testMajorRelevance_NoMajorSpecified(): void {
  console.log('\n-- Major Relevance: No major = unrelated --');
  const input = makeInput('any', 'Any Activity', 4, 4.5);
  const result = calibratePortfolio([input]); // No intendedMajor
  const annotation = result.activities[0].majorRelevance;
  assert(
    annotation.relevance === 'unrelated',
    `No major specified → unrelated (got ${annotation.relevance})`
  );
}

function testMajorRelevance_SupportingDetection(): void {
  console.log('\n-- Major Relevance: Supporting detection --');
  const input = makeInput('tutor', 'Math Tutor', 4, 4.5, {
    categoryMatch: { category: 'community_service', confidence: 'medium' },
    impact: { tangibleOutcomes: ['Tutored math and science homework'], hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: 8 },
  });

  const result = calibratePortfolio([input], 'Computer Science');
  const annotation = result.activities[0].majorRelevance;
  // Math tutoring is tangentially related to CS — should be supporting or unrelated
  assert(
    annotation.relevance === 'supporting' || annotation.relevance === 'unrelated',
    `Math tutor is supporting/unrelated for CS (got ${annotation.relevance})`
  );
}

// ============================================================================
// TEST: FULL PORTFOLIO CALIBRATION (CS APPLICANT)
// ============================================================================

function testFullPortfolio_CSApplicant(): void {
  console.log('\n-- Full Portfolio: CS Applicant (Research vs Retail) --');

  const portfolio = [
    makeInput('research', 'ML Research Assistant', 3, 6.0, {
      recognitions: [{ name: 'Co-authored paper', level: 'regional', isVerifiable: true }],
      role: { type: 'contributor', title: 'Research Assistant', isLeadershipApplicable: false, evidence: 'Worked with professor' },
      commitment: { yearsActive: 1, hoursPerWeek: 10, weeksPerYear: 40, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '50000', unit: 'records', context: 'data pipeline', isVerifiable: false }], estimatedPeopleReached: null, tangibleOutcomes: ['Built NLP pipeline'] },
      categoryMatch: { category: 'stem_research', confidence: 'high' },
    }),
    makeInput('grocery', 'Grocery Store', 4, 5.0, {
      role: { type: 'team_lead', title: 'Shift Lead', isLeadershipApplicable: true, evidence: 'Promoted to shift lead' },
      commitment: { yearsActive: 3, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, progressionArc: 'clerk → shift lead', sustainedThroughJunior: true },
      character: { primaryTrait: 'resilience', communityBenefit: 'minimal', authenticitySignals: ['supports family'], paddingSignals: [] },
      categoryMatch: { category: 'work_family', confidence: 'high' },
    }, { commitmentScore: 4, commitmentYears: 3, commitmentProgression: true }),
    makeInput('cs-club', 'CS Club Founder', 4, 5.0, {
      role: { type: 'founder', title: 'Founder & President', isLeadershipApplicable: true, evidence: 'Founded school first CS club' },
      commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: 'founder', sustainedThroughJunior: false },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '25', unit: 'students', context: 'taught', isVerifiable: false }], estimatedPeopleReached: 60, tangibleOutcomes: ['Organized hackathon'] },
      categoryMatch: { category: 'technology', confidence: 'high' },
    }, { leadershipScore: 3, leadershipApplicable: true }),
    makeInput('tutor', 'Math Tutor', 5, 3.5, {
      recognitions: [{ name: 'Volunteer of the Quarter', level: 'local', isVerifiable: false }],
      role: { type: 'team_lead', title: 'Lead Tutor', isLeadershipApplicable: true, evidence: 'Lead tutor' },
      commitment: { yearsActive: 2, hoursPerWeek: 3, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'empathy', communityBenefit: 'moderate', authenticitySignals: ['8 regulars'], paddingSignals: [] },
      categoryMatch: { category: 'community_service', confidence: 'high' },
    }),
    makeInput('farm', 'Family Farm', 5, 3.0, {
      role: { type: 'contributor', title: 'Helper', isLeadershipApplicable: false, evidence: 'Helps on farm' },
      commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 24, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      character: { primaryTrait: 'resilience', communityBenefit: 'minimal', authenticitySignals: ['200 acres', 'drive equipment'], paddingSignals: [] },
      categoryMatch: { category: 'work_family', confidence: 'high' },
    }, { commitmentScore: 3, commitmentYears: 4 }),
  ];

  const result = calibratePortfolio(portfolio, 'Computer Science');

  // Get results by ID
  const get = (id: string) => result.activities.find(a => a.activityId === id)!;

  // --- Ordering assertions ---
  assert(
    get('research').score.total > get('grocery').score.total,
    `Research (${get('research').score.total}) > Grocery (${get('grocery').score.total})`
  );
  assert(
    get('research').score.total > get('cs-club').score.total,
    `Research (${get('research').score.total}) > CS Club (${get('cs-club').score.total}) — Research is Tier 3`
  );

  // --- Tier range assertions ---
  assert(
    get('research').score.total >= 5.5 && get('research').score.total <= 6.9,
    `Research in tier 3 range [5.5, 6.9] (got ${get('research').score.total})`
  );
  assert(
    get('grocery').score.total >= 4.0 && get('grocery').score.total <= 5.4,
    `Grocery in tier 4 range [4.0, 5.4] (got ${get('grocery').score.total})`
  );
  assert(
    get('tutor').score.total >= 2.5 && get('tutor').score.total <= 3.9,
    `Tutor in tier 5 range [2.5, 3.9] (got ${get('tutor').score.total})`
  );

  // --- Evidence consistency assertions ---
  // CS Club founder should have leadership >= 5
  assert(
    get('cs-club').score.breakdown.leadershipImpact.score >= 5,
    `CS Club founder leadership >= 5 (got ${get('cs-club').score.breakdown.leadershipImpact.score})`
  );
  // Grocery 3yr commitment should have commitment >= 5
  assert(
    get('grocery').score.breakdown.commitmentProgression.score >= 5,
    `Grocery 3yr commitment >= 5 (got ${get('grocery').score.breakdown.commitmentProgression.score})`
  );
  // Farm 4yr commitment should have commitment >= 5
  assert(
    get('farm').score.breakdown.commitmentProgression.score >= 5,
    `Farm 4yr commitment >= 5 (got ${get('farm').score.breakdown.commitmentProgression.score})`
  );

  // --- Major relevance assertions ---
  assert(
    get('research').majorRelevance.relevance === 'core' || get('research').majorRelevance.relevance === 'supporting',
    `ML Research relevant to CS (got ${get('research').majorRelevance.relevance})`
  );
  assert(
    get('cs-club').majorRelevance.relevance === 'core',
    `CS Club is core for CS (got ${get('cs-club').majorRelevance.relevance})`
  );
  assert(
    get('farm').majorRelevance.relevance === 'unrelated',
    `Farm unrelated to CS (got ${get('farm').majorRelevance.relevance})`
  );

  // --- Summary assertions ---
  assert(result.summary.totalActivities === 5, 'Total 5 activities');
  assert(result.summary.activitiesAdjusted > 0, 'Some activities were adjusted');

  console.log(`  Calibration summary:`);
  console.log(`    Adjusted: ${result.summary.activitiesAdjusted}/${result.summary.totalActivities}`);
  console.log(`    Total adjustments: ${result.summary.totalAdjustments}`);
  console.log(`    Rules: ${result.summary.rulesApplied.join(', ')}`);
  console.log(`    Original range: ${result.summary.originalRange.min.toFixed(1)}-${result.summary.originalRange.max.toFixed(1)}`);
  console.log(`    Calibrated range: ${result.summary.calibratedRange.min.toFixed(1)}-${result.summary.calibratedRange.max.toFixed(1)}`);
}

// ============================================================================
// TEST: SCORE STABILITY — All within tier ranges
// ============================================================================

function testAllScoresWithinTierRanges(): void {
  console.log('\n-- Structural Guarantee: All scores within tier ranges --');

  // Create activities across all 6 tiers
  const inputs = [
    makeInput('t1', 'USAMO', 1, 9.5),
    makeInput('t2', 'State Champion', 2, 8.0),
    makeInput('t3', 'Club President', 3, 6.0),
    makeInput('t4', 'Team Captain', 4, 4.5),
    makeInput('t5', 'Club Member', 5, 3.0),
    makeInput('t6', 'Passive', 6, 1.5),
  ];

  const result = calibratePortfolio(inputs);

  for (const activity of result.activities) {
    const tier = inputs.find(i => i.activityId === activity.activityId)!.tier.internalTier;
    const range = TIER_SCORE_RANGES[tier];
    assert(
      activity.score.total >= range.min && activity.score.total <= range.max,
      `${activity.activityTitle} (Tier ${tier}): ${activity.score.total} in [${range.min}, ${range.max}]`
    );
  }

  // Verify strict descending order
  const scores = result.activities.map(a => a.score.total);
  for (let i = 0; i < scores.length - 1; i++) {
    assert(
      scores[i] > scores[i + 1],
      `Score[${i}] (${scores[i]}) > Score[${i + 1}] (${scores[i + 1]})`
    );
  }
}

// ============================================================================
// TEST: IDEMPOTENCY — Running calibration twice gives same result
// ============================================================================

function testIdempotency(): void {
  console.log('\n-- Idempotency: Double calibration is stable --');
  const inputs1 = [
    makeInput('a', 'Research', 3, 6.0),
    makeInput('b', 'Club', 4, 5.0),
    makeInput('c', 'Passive', 6, 2.0),
  ];

  const result1 = calibratePortfolio(inputs1);

  // Build second round inputs from first round outputs
  const inputs2: CalibrationInput[] = result1.activities.map(a => {
    const original = inputs1.find(i => i.activityId === a.activityId)!;
    return {
      activityId: a.activityId,
      activityTitle: a.activityTitle,
      score: a.score,
      tier: original.tier,
      evidence: original.evidence,
    };
  });

  const result2 = calibratePortfolio(inputs2);

  // Scores should be identical after second pass
  for (let i = 0; i < result1.activities.length; i++) {
    const s1 = result1.activities[i].score.total;
    const s2 = result2.activities[i].score.total;
    assert(
      Math.abs(s1 - s2) < 0.01,
      `${result1.activities[i].activityTitle}: pass1=${s1}, pass2=${s2} (stable)`
    );
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log('================================================================');
  console.log('  PORTFOLIO CALIBRATION TESTS — $0.00 (pure code, no API)');
  console.log('================================================================');

  // Empty / single
  testEmptyPortfolio();
  testSingleActivity();

  // Evidence consistency
  testEvidenceConsistency_RecognitionCap();
  testEvidenceConsistency_NationalRecognitionFloor();
  testEvidenceConsistency_FounderFloor();
  testEvidenceConsistency_PassiveMemberCap();
  testEvidenceConsistency_SelfFocusedCap();
  testEvidenceConsistency_SignificantCommunityFloor();
  testEvidenceConsistency_ResumePaddingCap();
  testEvidenceConsistency_ThreeYearsFloor();
  testEvidenceConsistency_ProgressionArcFloor();

  // Relative ordering
  testRelativeOrdering_HigherTierScoresHigher();
  testRelativeOrdering_FixesViolation();
  testRelativeOrdering_ThreeActivitiesDifferentTiers();

  // Minimum spread
  testMinimumSpread_NoActionWhenAdequate();
  testMinimumSpread_EnforcesWhenClustered();
  testMinimumSpread_TwoActivitiesSkipped();

  // Tier range clamping
  testTierRangeClamping_ClampsAbove();
  testTierRangeClamping_ClampsBelow();
  testTierRangeClamping_NoOpWhenInRange();

  // Major relevance
  testMajorRelevance_CoreDetection();
  testMajorRelevance_UnrelatedDetection();
  testMajorRelevance_NoMajorSpecified();
  testMajorRelevance_SupportingDetection();

  // Full portfolio
  testFullPortfolio_CSApplicant();

  // Structural guarantees
  testAllScoresWithinTierRanges();
  testIdempotency();

  // Summary
  console.log('\n================================================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\n  FAILURES:`);
    for (const f of failures) {
      console.log(`    - ${f}`);
    }
  }
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
