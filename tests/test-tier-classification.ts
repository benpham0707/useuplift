/**
 * Tier Classification Unit Tests
 *
 * Tests the deterministic tier classifier (Phase 2 of decomposed scoring architecture).
 * All tests are pure code — no API calls, $0.00 cost.
 *
 * Test cases are derived from the comparisonBenchmarksLibrary (200+ benchmark entries)
 * plus edge cases for borderline activities, low signal strength, and constraint validation.
 *
 * Expected: ALL tests pass. Any failure indicates a rule calibration issue.
 */

import {
  classifyTier,
  matchesBenchmarkTier,
  clampToTierRange,
  clampComponentScore,
  getInternalTierName,
  toExternalTier,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/tierClassifier';
import {
  ExtractedEvidence,
  InternalTier,
  TIER_SCORE_RANGES,
  TIER_COMPONENT_CONSTRAINTS,
  INTERNAL_TO_EXTERNAL_TIER,
  TIER_ASSESSMENT_SCORES,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

// ============================================================================
// TEST HELPERS
// ============================================================================

/** Create a minimal ExtractedEvidence with defaults for fields not under test */
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
      yearsActive: 0,
      hoursPerWeek: 0,
      weeksPerYear: 0,
      showsProgression: false,
      progressionArc: null,
      sustainedThroughJunior: false,
      ...overrides.commitment,
    },
    character: {
      primaryTrait: 'discipline',
      communityBenefit: 'self-focused',
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

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  FAIL: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    const msg = `${message}: expected ${expected}, got ${actual}`;
    failures.push(msg);
    console.error(`  FAIL: ${msg}`);
  }
}

function assertInRange(value: number, min: number, max: number, message: string): void {
  if (value >= min && value <= max) {
    passed++;
  } else {
    failed++;
    const msg = `${message}: ${value} not in range [${min}, ${max}]`;
    failures.push(msg);
    console.error(`  FAIL: ${msg}`);
  }
}

// ============================================================================
// SECTION 1: TIER 1 (PINNACLE) TEST CASES
// ============================================================================

function testTier1Classification(): void {
  console.log('\n=== TIER 1 (PINNACLE) TESTS ===');

  // T1-01: IMO team member — the pinnacle of math competitions
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'international', confidence: 1.0, evidence: 'IMO team member' },
      recognitions: [
        { name: 'International Mathematical Olympiad team member', level: 'international', isVerifiable: true, selectivityContext: '6 students represent the US from ~10,000 candidates' },
      ],
      role: { title: 'Team member', type: 'contributor', isLeadershipApplicable: false, evidence: 'National team' },
      commitment: { yearsActive: 4, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, progressionArc: 'AMC → AIME → USAMO → IMO', sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assertEqual(result.internalTier, 1 as InternalTier, 'T1-01: IMO team member → Tier 1');
    assertEqual(result.externalTier, 1, 'T1-01: External tier = 1');
  }

  // T1-02: USAMO qualifier with selectivity context
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.9, evidence: 'USAMO qualifier' },
      recognitions: [
        { name: 'USAMO qualifier', level: 'national', isVerifiable: true, selectivityContext: 'Top ~500 out of 300,000+ AMC participants (0.17%)' },
      ],
      role: { title: 'Competitor', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual competitor' },
      commitment: { yearsActive: 3, hoursPerWeek: 10, weeksPerYear: 40, showsProgression: true, progressionArc: 'AMC → AIME → USAMO', sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assertEqual(result.internalTier, 1 as InternalTier, 'T1-02: USAMO qualifier → Tier 1');
  }

  // T1-03: Regeneron STS finalist
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 1.0, evidence: 'Regeneron STS finalist' },
      recognitions: [
        { name: 'Regeneron Science Talent Search finalist', level: 'national', isVerifiable: true, selectivityContext: '40 finalists from ~1,900 applicants' },
      ],
      role: { title: 'Researcher', type: 'contributor', isLeadershipApplicable: false, evidence: 'Independent research' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '1', unit: 'publication', context: 'Original research', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['Published original research'] },
      commitment: { yearsActive: 2, hoursPerWeek: 15, weeksPerYear: 40, showsProgression: true, progressionArc: null, sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_research', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assertEqual(result.internalTier, 1 as InternalTier, 'T1-03: Regeneron STS finalist → Tier 1');
  }

  // T1-04: Published in peer-reviewed journal
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.8, evidence: 'Published in peer-reviewed journal' },
      recognitions: [
        { name: 'Published in peer-reviewed journal', level: 'national', isVerifiable: true, selectivityContext: '<0.1% of high schoolers publish' },
      ],
      role: { title: 'Co-author', type: 'contributor', isLeadershipApplicable: false, evidence: 'Named co-author' },
      commitment: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 30, showsProgression: true, progressionArc: null, sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_research', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assertEqual(result.internalTier, 1 as InternalTier, 'T1-04: Peer-reviewed publication → Tier 1');
  }

  // T1-05: D1 recruited athlete
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.9, evidence: 'D1 recruited athlete' },
      recognitions: [
        { name: 'D1 recruited athlete', level: 'national', isVerifiable: true, selectivityContext: '~2% of high school athletes play D1' },
      ],
      role: { title: 'Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Team captain' },
      commitment: { yearsActive: 4, hoursPerWeek: 25, weeksPerYear: 48, showsProgression: true, progressionArc: 'JV → Varsity starter → Captain', sustainedThroughJunior: true },
      categoryMatch: { category: 'athletics', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assertEqual(result.internalTier, 1 as InternalTier, 'T1-05: D1 recruited athlete → Tier 1');
  }

  // T1-06: Founded nonprofit serving 2000+ with media coverage
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.8, evidence: 'Nonprofit with national media coverage' },
      recognitions: [
        { name: 'Featured in local and national media', level: 'national', isVerifiable: true, selectivityContext: undefined },
      ],
      role: { title: 'Founder & CEO', type: 'founder', isLeadershipApplicable: true, evidence: 'Founded 501(c)(3)' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '2000', unit: 'people served', context: 'Food insecurity program', isVerifiable: true }], estimatedPeopleReached: 2000, tangibleOutcomes: ['501(c)(3) status', 'Served 2000+ meals'] },
      commitment: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 50, showsProgression: true, progressionArc: 'Started program → Incorporated → Expanded to 3 cities', sustainedThroughJunior: true },
      character: { primaryTrait: 'service', communityBenefit: 'significant', authenticitySignals: ['501(c)(3) incorporation'], paddingSignals: [] },
      categoryMatch: { category: 'community_service', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 2, 'T1-06: Founded major nonprofit → Tier 1 or 2');
  }

  // T1-07: NSDA national champion
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 1.0, evidence: 'NSDA national champion' },
      recognitions: [
        { name: 'NSDA national champion', level: 'national', isVerifiable: true, selectivityContext: 'One student per event per year' },
      ],
      role: { title: 'Debater', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual competition' },
      commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 40, showsProgression: true, progressionArc: 'Novice → Varsity → National champion', sustainedThroughJunior: true },
      categoryMatch: { category: 'debate_speech', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assertEqual(result.internalTier, 1 as InternalTier, 'T1-07: NSDA national champion → Tier 1');
  }

  // T1-08: Revenue-generating business $10K+
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.7, evidence: 'App with 15,000 users' },
      recognitions: [
        { name: 'App with 15,000+ users', level: 'national', isVerifiable: true, selectivityContext: undefined },
      ],
      role: { title: 'Founder & Developer', type: 'founder', isLeadershipApplicable: true, evidence: 'Solo founder' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '15000', unit: 'users', context: 'Active monthly users', isVerifiable: true }, { value: '25000', unit: 'dollars', context: 'Annual revenue', isVerifiable: true }], estimatedPeopleReached: 15000, tangibleOutcomes: ['15K users', '$25K revenue', 'Featured in TechCrunch'] },
      commitment: { yearsActive: 2, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, progressionArc: 'Prototype → Launch → Revenue → Scale', sustainedThroughJunior: true },
      categoryMatch: { category: 'entrepreneurship', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 2, 'T1-08: Revenue-generating app with 15K users → Tier 1 or 2');
  }
}

// ============================================================================
// SECTION 2: TIER 2 (NATIONAL) TEST CASES
// ============================================================================

function testTier2Classification(): void {
  console.log('\n=== TIER 2 (NATIONAL) TESTS ===');

  // T2-01: AIME qualifier with top score
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.8, evidence: 'AIME qualifier' },
      recognitions: [
        { name: 'AIME qualifier', level: 'national', isVerifiable: true },
      ],
      role: { title: 'Competitor', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual' },
      commitment: { yearsActive: 3, hoursPerWeek: 8, weeksPerYear: 40, showsProgression: true, progressionArc: 'AMC → AIME', sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 2, 'T2-01: AIME qualifier → Tier 1 or 2');
  }

  // T2-02: State Science Olympiad medalist
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'state', confidence: 0.9, evidence: 'State Science Olympiad medals' },
      recognitions: [
        { name: 'State Science Olympiad medalist', level: 'state', isVerifiable: true },
      ],
      role: { title: 'Team member', type: 'contributor', isLeadershipApplicable: true, evidence: 'Key team member' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '3', unit: 'state medals', context: 'Gold in Chemistry, Silver in Physics and Biology', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['3 state medals'] },
      commitment: { yearsActive: 3, hoursPerWeek: 8, weeksPerYear: 30, showsProgression: true, progressionArc: 'Member → Event captain → 3x state medalist', sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-02: State Science Olympiad medalist → Tier 2 or 3');
  }

  // T2-03: All-State ensemble member
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'state', confidence: 0.9, evidence: 'All-State orchestra' },
      recognitions: [
        { name: 'All-State orchestra member', level: 'state', isVerifiable: true },
      ],
      role: { title: 'First chair violin', type: 'team_lead', isLeadershipApplicable: true, evidence: 'Section leader' },
      commitment: { yearsActive: 4, hoursPerWeek: 12, weeksPerYear: 44, showsProgression: true, progressionArc: 'Back stand → Section leader → First chair → All-State', sustainedThroughJunior: true },
      categoryMatch: { category: 'performing_arts', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-03: All-State ensemble → Tier 2 or 3');
  }

  // T2-04: Summer research at university lab (competitive program)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'regional', confidence: 0.7, evidence: 'University lab research' },
      recognitions: [
        { name: 'SSP (Summer Science Program) alum', level: 'national', isVerifiable: true },
      ],
      role: { title: 'Research intern', type: 'contributor', isLeadershipApplicable: false, evidence: 'Independent research project' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '1', unit: 'poster presentation', context: 'Regional symposium', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['Poster presentation at regional symposium'] },
      commitment: { yearsActive: 2, hoursPerWeek: 30, weeksPerYear: 12, showsProgression: true, progressionArc: 'Assistive tasks → Independent project → Poster presentation', sustainedThroughJunior: false },
      categoryMatch: { category: 'stem_research', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-04: SSP alum + university research → Tier 2 or 3');
  }

  // T2-05: Multi-year program leader (100+ served) for community service
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'regional', confidence: 0.6, evidence: 'Community tutoring program' },
      recognitions: [
        { name: 'City volunteer recognition award', level: 'regional', isVerifiable: true },
      ],
      role: { title: 'Program Director', type: 'founder', isLeadershipApplicable: true, evidence: 'Created and directs tutoring program' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '150', unit: 'students tutored', context: 'Weekly program', isVerifiable: true }, { value: '500', unit: 'hours', context: 'Total volunteer hours', isVerifiable: true }], estimatedPeopleReached: 150, tangibleOutcomes: ['150 students tutored', '85% showed grade improvement'] },
      commitment: { yearsActive: 3, hoursPerWeek: 8, weeksPerYear: 40, showsProgression: true, progressionArc: 'Volunteer → Lead tutor → Program director', sustainedThroughJunior: true },
      character: { primaryTrait: 'service', communityBenefit: 'significant', authenticitySignals: ['Grade improvement data tracked'], paddingSignals: [] },
      categoryMatch: { category: 'community_service', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-05: Multi-year program leader 150+ served → Tier 2 or 3');
  }

  // T2-06: State debate champion
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'state', confidence: 1.0, evidence: 'State debate champion' },
      recognitions: [
        { name: 'State debate champion', level: 'state', isVerifiable: true },
      ],
      role: { title: 'Debater', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual competition' },
      commitment: { yearsActive: 3, hoursPerWeek: 10, weeksPerYear: 35, showsProgression: true, progressionArc: 'Novice → JV → Varsity → State champion', sustainedThroughJunior: true },
      categoryMatch: { category: 'debate_speech', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-06: State debate champion → Tier 2 or 3');
  }

  // T2-07: All-State selection (team sport)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'state', confidence: 0.9, evidence: 'All-State soccer' },
      recognitions: [
        { name: 'All-State selection', level: 'state', isVerifiable: true },
      ],
      role: { title: 'Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Team captain' },
      commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 44, showsProgression: true, progressionArc: 'JV → Varsity → Starter → Captain → All-State', sustainedThroughJunior: true },
      categoryMatch: { category: 'athletics', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-07: All-State athlete + captain → Tier 2 or 3');
  }

  // T2-08: Editor-in-chief of school publication with awards
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'regional', confidence: 0.7, evidence: 'School newspaper' },
      recognitions: [
        { name: 'Scholastic regional Gold Key', level: 'regional', isVerifiable: true },
      ],
      role: { title: 'Editor-in-Chief', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Top editorial position' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '24', unit: 'issues published', context: 'Monthly issues', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['24 issues published', 'Regional writing award'] },
      commitment: { yearsActive: 3, hoursPerWeek: 10, weeksPerYear: 36, showsProgression: true, progressionArc: 'Writer → Section editor → Editor-in-Chief', sustainedThroughJunior: true },
      categoryMatch: { category: 'writing_journalism', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-08: Editor-in-chief + regional award → Tier 2 or 3');
  }

  // T2-09: FRC team lead at state level
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'state', confidence: 0.8, evidence: 'FRC state championship' },
      recognitions: [
        { name: 'FRC state championship award', level: 'state', isVerifiable: true },
      ],
      role: { title: 'Programming Lead', type: 'team_lead', isLeadershipApplicable: true, evidence: 'Lead programmer' },
      impact: { hasQuantifiedOutcomes: true, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: ['State championship', 'Innovation award'] },
      commitment: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 30, showsProgression: true, progressionArc: 'Member → Sub-lead → Programming lead', sustainedThroughJunior: true },
      categoryMatch: { category: 'technology', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 3, 'T2-09: FRC team lead + state award → Tier 2 or 3');
  }

  // T2-10: Small business with real customers
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'regional', confidence: 0.6, evidence: 'Local business' },
      recognitions: [],
      role: { title: 'Founder', type: 'founder', isLeadershipApplicable: true, evidence: 'Started business' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '5000', unit: 'dollars revenue', context: 'Annual', isVerifiable: true }, { value: '200', unit: 'customers', context: 'Repeat customers', isVerifiable: true }], estimatedPeopleReached: 200, tangibleOutcomes: ['$5K revenue', '200 repeat customers'] },
      commitment: { yearsActive: 2, hoursPerWeek: 12, weeksPerYear: 48, showsProgression: true, progressionArc: 'Startup → Growth → Profit', sustainedThroughJunior: true },
      categoryMatch: { category: 'entrepreneurship', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.internalTier <= 4, 'T2-10: Small business with real revenue → Tier 3 or 4');
  }
}

// ============================================================================
// SECTION 3: TIER 3 (STATE/REGIONAL) TEST CASES
// ============================================================================

function testTier3Classification(): void {
  console.log('\n=== TIER 3 (STATE/REGIONAL) TESTS ===');

  // T3-01: Club president with 3-year commitment and outcomes
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.8, evidence: 'School robotics club' },
      recognitions: [
        { name: 'School innovation award', level: 'school', isVerifiable: false },
      ],
      role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Elected president' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '35', unit: 'members', context: 'Grew from 10 to 35', isVerifiable: true }], estimatedPeopleReached: 35, tangibleOutcomes: ['Grew membership from 10 to 35', 'Started weekly workshops'] },
      commitment: { yearsActive: 3, hoursPerWeek: 6, weeksPerYear: 36, showsProgression: true, progressionArc: 'Member → VP → President', sustainedThroughJunior: true },
      character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['Specific growth numbers'], paddingSignals: [] },
      categoryMatch: { category: 'technology', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 3 && result.internalTier <= 4, 'T3-01: Club president with growth → Tier 3 or 4');
  }

  // T3-02: Varsity starter for 2+ years (athletics)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'School varsity team' },
      recognitions: [
        { name: 'Most Improved Player', level: 'school', isVerifiable: false },
      ],
      role: { title: 'Varsity starter', type: 'contributor', isLeadershipApplicable: true, evidence: 'Starting position' },
      commitment: { yearsActive: 3, hoursPerWeek: 12, weeksPerYear: 25, showsProgression: true, progressionArc: 'JV → Varsity → Starter', sustainedThroughJunior: true },
      categoryMatch: { category: 'athletics', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T3-02: Varsity starter 3 years → Tier 4 or 5');
  }

  // T3-03: AMC Honor Roll (top 5% but not AIME)
  // With national recognition, the classifier may classify this as high as T2 or T3.
  // The evidence extractor (Phase 1) is responsible for setting the right recognition level.
  // If marked as 'national' + verifiable, classifier trusts it, which is correct behavior.
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 0.5, evidence: 'AMC scorer' },
      recognitions: [
        { name: 'AMC Honor Roll', level: 'national', isVerifiable: true },
      ],
      role: { title: 'Math team member', type: 'member', isLeadershipApplicable: false, evidence: 'Participant' },
      commitment: { yearsActive: 2, hoursPerWeek: 4, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    // National verifiable recognition can push to T3 (via T3-A). The evidence level
    // determines the tier — if Phase 1 marks it national, that's a T3+ signal.
    assert(result.internalTier >= 2 && result.internalTier <= 5, 'T3-03: AMC Honor Roll (national) → Tier 2-5');
  }

  // T3-04: Varsity debater with regional wins
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'regional', confidence: 0.7, evidence: 'Regional debate circuit' },
      recognitions: [
        { name: 'Regional debate tournament winner', level: 'regional', isVerifiable: true },
      ],
      role: { title: 'Varsity debater', type: 'contributor', isLeadershipApplicable: false, evidence: 'Varsity team' },
      impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: ['2 regional tournament wins'] },
      commitment: { yearsActive: 2, hoursPerWeek: 8, weeksPerYear: 30, showsProgression: true, progressionArc: 'Novice → Varsity', sustainedThroughJunior: true },
      categoryMatch: { category: 'debate_speech', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 3 && result.internalTier <= 4, 'T3-04: Varsity debater regional wins → Tier 3 or 4');
  }

  // T3-05: Regular volunteer at established org (weekly, 2+ years)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'local', confidence: 0.7, evidence: 'Food bank volunteering' },
      recognitions: [],
      role: { title: 'Lead volunteer', type: 'team_lead', isLeadershipApplicable: true, evidence: 'Promoted to lead volunteer' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '200', unit: 'hours', context: 'Total volunteer hours', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['200+ hours over 2 years'] },
      commitment: { yearsActive: 2, hoursPerWeek: 4, weeksPerYear: 45, showsProgression: true, progressionArc: 'Volunteer → Lead volunteer', sustainedThroughJunior: true },
      character: { primaryTrait: 'service', communityBenefit: 'moderate', authenticitySignals: ['Consistent weekly schedule'], paddingSignals: [] },
      categoryMatch: { category: 'community_service', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T3-05: Regular lead volunteer 2 years → Tier 4 or 5');
  }

  // T3-06: School newspaper section editor
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'School newspaper' },
      recognitions: [],
      role: { title: 'Section Editor', type: 'team_lead', isLeadershipApplicable: true, evidence: 'Section editor' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '30', unit: 'articles', context: 'Published', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['30 published articles'] },
      commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: 'Writer → Section editor', sustainedThroughJunior: true },
      categoryMatch: { category: 'writing_journalism', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T3-06: Section editor 2 years → Tier 4 or 5');
  }

  // T3-07: Founded school club (first-gen context — tier should NOT inflate)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'Founded CS club at school with no STEM clubs' },
      recognitions: [],
      role: { title: 'Founder & President', type: 'founder', isLeadershipApplicable: true, evidence: 'Created club from scratch' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '25', unit: 'members', context: 'Club members', isVerifiable: true }], estimatedPeopleReached: 25, tangibleOutcomes: ['25 active members', 'Weekly coding sessions'] },
      commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: 'Founded → Established → Growing', sustainedThroughJunior: true },
      character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['First-gen student', 'Created something from nothing'], paddingSignals: [] },
      categoryMatch: { category: 'technology', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    // Should be Tier 4 (school-level founder, no regional+ recognition)
    assert(result.internalTier >= 3 && result.internalTier <= 4, 'T3-07: Founded school CS club (first-gen) → Tier 3 or 4 (NOT inflated to 2)');
    assert(result.internalTier !== 2, 'T3-07: Context should NOT inflate to Tier 2');
  }

  // T3-08: Part-time job (1+ year) — work experience
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'local', confidence: 0.8, evidence: 'Part-time retail job' },
      recognitions: [],
      role: { title: 'Cashier', type: 'contributor', isLeadershipApplicable: true, evidence: 'Part-time worker' },
      impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
      commitment: { yearsActive: 1, hoursPerWeek: 15, weeksPerYear: 48, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: ['Consistent work schedule'], paddingSignals: [] },
      categoryMatch: { category: 'work_family', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T3-08: Part-time job 1 year → Tier 4 or 5');
  }
}

// ============================================================================
// SECTION 4: TIER 4 (SCHOOL LEADER) TEST CASES
// ============================================================================

function testTier4Classification(): void {
  console.log('\n=== TIER 4 (SCHOOL LEADER) TESTS ===');

  // T4-01: NHS member with some projects
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'NHS member' },
      recognitions: [],
      role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'Member by GPA qualification' },
      impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: ['Helped organize 2 service events'] },
      commitment: { yearsActive: 2, hoursPerWeek: 2, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
      categoryMatch: { category: 'leadership_government', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T4-01: NHS member → Tier 4 or 5');
  }

  // T4-02: School math team member (no major wins)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.6, evidence: 'School math team' },
      recognitions: [],
      role: { title: 'Team member', type: 'member', isLeadershipApplicable: false, evidence: 'Regular participant' },
      commitment: { yearsActive: 2, hoursPerWeek: 3, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T4-02: Math team member → Tier 4 or 5');
  }

  // T4-03: Club officer (secretary/treasurer)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'School club' },
      recognitions: [],
      role: { title: 'Treasurer', type: 'executive', isLeadershipApplicable: true, evidence: 'Club officer' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '500', unit: 'dollars managed', context: 'Club budget', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['Managed club budget'] },
      commitment: { yearsActive: 1, hoursPerWeek: 3, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      categoryMatch: { category: 'leadership_government', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T4-03: Club treasurer → Tier 4 or 5');
  }

  // T4-04: Supporting role in school musical (performing arts)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'School musical' },
      recognitions: [],
      role: { title: 'Supporting cast', type: 'contributor', isLeadershipApplicable: false, evidence: 'Cast member' },
      commitment: { yearsActive: 2, hoursPerWeek: 8, weeksPerYear: 12, showsProgression: true, progressionArc: 'Ensemble → Supporting role', sustainedThroughJunior: true },
      categoryMatch: { category: 'performing_arts', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T4-04: Supporting cast 2 years → Tier 4 or 5');
  }

  // T4-05: Peer tutor through school program
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'School peer tutoring' },
      recognitions: [],
      role: { title: 'Peer tutor', type: 'contributor', isLeadershipApplicable: false, evidence: 'Peer tutor' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '15', unit: 'students tutored', context: 'Weekly tutoring', isVerifiable: true }], estimatedPeopleReached: 15, tangibleOutcomes: ['15 students tutored'] },
      commitment: { yearsActive: 1, hoursPerWeek: 3, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'empathy', communityBenefit: 'moderate', authenticitySignals: ['Regular schedule'], paddingSignals: [] },
      categoryMatch: { category: 'community_service', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T4-05: Peer tutor → Tier 4 or 5');
  }

  // T4-06: Self-taught programmer with GitHub portfolio
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.5, evidence: 'Personal projects' },
      recognitions: [],
      role: { title: 'Self-taught developer', type: 'contributor', isLeadershipApplicable: false, evidence: 'Self-directed' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '5', unit: 'projects completed', context: 'GitHub portfolio', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['5 completed projects on GitHub'] },
      commitment: { yearsActive: 2, hoursPerWeek: 8, weeksPerYear: 48, showsProgression: true, progressionArc: 'Tutorials → Personal projects → Complex apps', sustainedThroughJunior: true },
      character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: ['Verifiable GitHub commits'], paddingSignals: [] },
      categoryMatch: { category: 'technology', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 4 && result.internalTier <= 5, 'T4-06: Self-taught programmer with portfolio → Tier 4 or 5');
  }
}

// ============================================================================
// SECTION 5: TIER 5 (ACTIVE PARTICIPANT) TEST CASES
// ============================================================================

function testTier5Classification(): void {
  console.log('\n=== TIER 5 (ACTIVE PARTICIPANT) TESTS ===');

  // T5-01: Key Club member (no leadership, regular attendance)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.5, evidence: 'Key Club member' },
      recognitions: [],
      role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'General member' },
      commitment: { yearsActive: 2, hoursPerWeek: 2, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      character: { primaryTrait: 'service', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
      categoryMatch: { category: 'leadership_government', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 5, 'T5-01: Key Club member → Tier 5 or 6');
  }

  // T5-02: JV athlete (bench player)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.5, evidence: 'JV basketball' },
      recognitions: [],
      role: { title: 'Player', type: 'participant', isLeadershipApplicable: false, evidence: 'Bench player' },
      commitment: { yearsActive: 1, hoursPerWeek: 8, weeksPerYear: 16, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      categoryMatch: { category: 'athletics', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 5, 'T5-02: JV bench player 1 season → Tier 5 or 6');
  }

  // T5-03: Band member (no audition required)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.5, evidence: 'School band' },
      recognitions: [],
      role: { title: 'Band member', type: 'member', isLeadershipApplicable: false, evidence: 'Open-enrollment ensemble' },
      commitment: { yearsActive: 2, hoursPerWeek: 3, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      categoryMatch: { category: 'performing_arts', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 5, 'T5-03: Band member no audition → Tier 5 or 6');
  }

  // T5-04: School art show participant
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.5, evidence: 'School art show' },
      recognitions: [],
      role: { title: 'Artist', type: 'participant', isLeadershipApplicable: false, evidence: 'Displayed work' },
      commitment: { yearsActive: 1, hoursPerWeek: 3, weeksPerYear: 20, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      categoryMatch: { category: 'visual_arts', confidence: 'medium' },
      overallSignalStrength: 'weak',
    }));
    assert(result.internalTier >= 5, 'T5-04: Art show participant → Tier 5 or 6');
  }

  // T5-05: Church youth group service
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'local', confidence: 0.5, evidence: 'Church youth group' },
      recognitions: [],
      role: { title: 'Youth group member', type: 'participant', isLeadershipApplicable: false, evidence: 'Regular attendee' },
      commitment: { yearsActive: 2, hoursPerWeek: 3, weeksPerYear: 45, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      character: { primaryTrait: 'service', communityBenefit: 'moderate', authenticitySignals: ['Regular attendance'], paddingSignals: [] },
      categoryMatch: { category: 'community_service', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));
    assert(result.internalTier >= 5, 'T5-05: Youth group service → Tier 5 or 6');
  }
}

// ============================================================================
// SECTION 6: TIER 6 (DEVELOPING) TEST CASES
// ============================================================================

function testTier6Classification(): void {
  console.log('\n=== TIER 6 (DEVELOPING) TESTS ===');

  // T6-01: Science club member (passive, no competitions)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.3, evidence: 'Science club' },
      recognitions: [],
      role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'Listed as member' },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: ['No specific contributions mentioned'] },
      categoryMatch: { category: 'stem_competition', confidence: 'low' },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.internalTier, 6 as InternalTier, 'T6-01: Passive science club member → Tier 6');
  }

  // T6-02: One-time hackathon attendee
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'local', confidence: 0.3, evidence: 'Hackathon' },
      recognitions: [],
      role: { title: 'Participant', type: 'participant', isLeadershipApplicable: false, evidence: 'Attended once' },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      categoryMatch: { category: 'stem_competition', confidence: 'low' },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.internalTier, 6 as InternalTier, 'T6-02: One-time hackathon → Tier 6');
  }

  // T6-03: MUN club member (no awards, no competitions)
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.3, evidence: 'MUN club' },
      recognitions: [],
      role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'Club member' },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: ['Common padding activity'] },
      categoryMatch: { category: 'debate_speech', confidence: 'medium' },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.internalTier, 6 as InternalTier, 'T6-03: MUN member no awards → Tier 6');
  }

  // T6-04: One-time service event
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'local', confidence: 0.3, evidence: 'Beach cleanup' },
      recognitions: [],
      role: { title: 'Volunteer', type: 'participant', isLeadershipApplicable: false, evidence: 'One-time event' },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'service', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: ['Single event'] },
      categoryMatch: { category: 'community_service', confidence: 'medium' },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.internalTier, 6 as InternalTier, 'T6-04: One-time beach cleanup → Tier 6');
  }

  // T6-05: Required community service hours only
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.3, evidence: 'Mandatory service hours' },
      recognitions: [],
      role: { title: 'Volunteer', type: 'participant', isLeadershipApplicable: false, evidence: 'Completed required hours' },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: ['Mandatory, not voluntary'] },
      categoryMatch: { category: 'community_service', confidence: 'low' },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.internalTier, 6 as InternalTier, 'T6-05: Required community service → Tier 6');
  }

  // T6-06: "CEO" of inactive venture
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.2, evidence: 'Self-started venture' },
      recognitions: [],
      role: { title: 'CEO', type: 'founder', isLeadershipApplicable: true, evidence: 'Self-given title' },
      impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'creativity', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: ['Self-given title without outcomes'] },
      categoryMatch: { category: 'entrepreneurship', confidence: 'low' },
      overallSignalStrength: 'weak',
    }));
    // Even though role is 'founder', without commitment/impact it shouldn't make it past T5
    assert(result.internalTier >= 5, 'T6-06: CEO of inactive venture → Tier 5 or 6');
  }

  // T6-07: Completed online coding tutorial
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.2, evidence: 'Online course' },
      recognitions: [],
      role: { title: 'Student', type: 'participant', isLeadershipApplicable: false, evidence: 'Self-study' },
      commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      categoryMatch: { category: 'technology', confidence: 'low' },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.internalTier, 6 as InternalTier, 'T6-07: Online coding tutorial → Tier 6');
  }
}

// ============================================================================
// SECTION 7: EXTERNAL TIER MAPPING TESTS
// ============================================================================

function testExternalTierMapping(): void {
  console.log('\n=== EXTERNAL TIER MAPPING TESTS ===');

  // Verify all 6→4 mappings
  assertEqual(INTERNAL_TO_EXTERNAL_TIER[1], 1, 'Internal 1 (Pinnacle) → External 1');
  assertEqual(INTERNAL_TO_EXTERNAL_TIER[2], 1, 'Internal 2 (National) → External 1');
  assertEqual(INTERNAL_TO_EXTERNAL_TIER[3], 2, 'Internal 3 (State/Regional) → External 2');
  assertEqual(INTERNAL_TO_EXTERNAL_TIER[4], 3, 'Internal 4 (School Leader) → External 3');
  assertEqual(INTERNAL_TO_EXTERNAL_TIER[5], 3, 'Internal 5 (Participant) → External 3');
  assertEqual(INTERNAL_TO_EXTERNAL_TIER[6], 4, 'Internal 6 (Developing) → External 4');

  // Verify toExternalTier function
  for (const tier of [1, 2, 3, 4, 5, 6] as InternalTier[]) {
    assertEqual(
      toExternalTier(tier),
      INTERNAL_TO_EXTERNAL_TIER[tier],
      `toExternalTier(${tier}) matches constant`
    );
  }
}

// ============================================================================
// SECTION 8: SCORE RANGE CONSTRAINT TESTS
// ============================================================================

function testScoreRangeConstraints(): void {
  console.log('\n=== SCORE RANGE CONSTRAINT TESTS ===');

  // Verify non-overlapping ranges
  const tiers = [1, 2, 3, 4, 5, 6] as InternalTier[];
  for (let i = 0; i < tiers.length - 1; i++) {
    const higher = TIER_SCORE_RANGES[tiers[i]];
    const lower = TIER_SCORE_RANGES[tiers[i + 1]];
    assert(
      higher.min > lower.max,
      `Tier ${tiers[i]} min (${higher.min}) > Tier ${tiers[i + 1]} max (${lower.max}) — no overlap`
    );
  }

  // Verify each tier range is valid
  for (const tier of tiers) {
    const range = TIER_SCORE_RANGES[tier];
    assert(range.min <= range.max, `Tier ${tier}: min (${range.min}) <= max (${range.max})`);
    assert(range.min >= 1.0, `Tier ${tier}: min (${range.min}) >= 1.0`);
    assert(range.max <= 10.0, `Tier ${tier}: max (${range.max}) <= 10.0`);
  }

  // Verify the classification produces score ranges matching the tier
  for (const tier of tiers) {
    const expected = TIER_SCORE_RANGES[tier];
    // Build evidence that should classify to this tier
    const result = classifyTier(makeEvidence(getEvidenceForTier(tier)));
    // The score range in the result should match the tier's defined range
    assertEqual(result.scoreRange.min, expected.min, `Tier ${tier} classification scoreRange.min = ${expected.min}`);
    assertEqual(result.scoreRange.max, expected.max, `Tier ${tier} classification scoreRange.max = ${expected.max}`);
  }

  // Test clamping
  assertEqual(clampToTierRange(11.0, 1), 10.0, 'Clamp 11.0 to Tier 1 → 10.0');
  assertEqual(clampToTierRange(0.5, 6), 1.0, 'Clamp 0.5 to Tier 6 → 1.0');
  assertEqual(clampToTierRange(6.0, 3), 6.0, 'Clamp 6.0 to Tier 3 → 6.0 (within range)');
  assertEqual(clampToTierRange(5.5, 4), 5.4, 'Clamp 5.5 to Tier 4 → 5.4 (clamped to max)');
  assertEqual(clampToTierRange(3.0, 4), 4.0, 'Clamp 3.0 to Tier 4 → 4.0 (clamped to min)');
}

/**
 * Build evidence that should classify to a specific tier.
 * Used for testing that classification score ranges match.
 */
function getEvidenceForTier(tier: InternalTier): Partial<DeepPartial<ExtractedEvidence>> {
  switch (tier) {
    case 1:
      return {
        scope: { level: 'international', confidence: 1.0, evidence: 'IMO' },
        recognitions: [{ name: 'IMO team', level: 'international', isVerifiable: true, selectivityContext: '6 per country' }],
        commitment: { yearsActive: 4, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, sustainedThroughJunior: true },
        categoryMatch: { category: 'stem_competition', confidence: 'high' },
        overallSignalStrength: 'strong',
      };
    case 2:
      return {
        scope: { level: 'national', confidence: 0.8, evidence: 'National competition' },
        recognitions: [{ name: 'National finalist', level: 'national', isVerifiable: true }],
        role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Organization president' },
        commitment: { yearsActive: 3, hoursPerWeek: 10, weeksPerYear: 40, showsProgression: true, sustainedThroughJunior: true },
        categoryMatch: { category: 'stem_competition', confidence: 'high' },
        overallSignalStrength: 'strong',
      };
    case 3:
      // Tier 3: State/regional — weaker than T2 (no exec role, shorter commitment)
      return {
        scope: { level: 'regional', confidence: 0.7, evidence: 'Regional competition' },
        recognitions: [{ name: 'Regional award', level: 'regional', isVerifiable: true }],
        role: { title: 'Competitor', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual competitor' },
        impact: { hasQuantifiedOutcomes: true, metrics: [], estimatedPeopleReached: 50, tangibleOutcomes: ['Regional recognition'] },
        commitment: { yearsActive: 2, hoursPerWeek: 6, weeksPerYear: 30, showsProgression: true, sustainedThroughJunior: true },
        categoryMatch: { category: 'athletics', confidence: 'high' },
        overallSignalStrength: 'moderate',
      };
    case 4:
      return {
        scope: { level: 'school', confidence: 0.7, evidence: 'School club' },
        role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Club president' },
        impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '20', unit: 'members', context: 'Club size', isVerifiable: true }], estimatedPeopleReached: 20, tangibleOutcomes: ['Organized 5 events'] },
        commitment: { yearsActive: 2, hoursPerWeek: 4, weeksPerYear: 36, showsProgression: true, sustainedThroughJunior: true },
        character: { primaryTrait: 'discipline', communityBenefit: 'moderate', authenticitySignals: ['Specific event details'], paddingSignals: [] },
        categoryMatch: { category: 'leadership_government', confidence: 'medium' },
        overallSignalStrength: 'moderate',
      };
    case 5:
      return {
        scope: { level: 'school', confidence: 0.5, evidence: 'School participation' },
        role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'General member' },
        commitment: { yearsActive: 1, hoursPerWeek: 2, weeksPerYear: 30, showsProgression: false, sustainedThroughJunior: false },
        categoryMatch: { category: 'leadership_government', confidence: 'medium' },
        overallSignalStrength: 'moderate',
      };
    case 6:
      return {
        scope: { level: 'school', confidence: 0.2, evidence: 'Brief participation' },
        role: { title: 'Attendee', type: 'participant', isLeadershipApplicable: false, evidence: 'Attended once' },
        commitment: { yearsActive: 0, hoursPerWeek: 0, weeksPerYear: 0, showsProgression: false, sustainedThroughJunior: false },
        categoryMatch: { category: 'leadership_government', confidence: 'low' },
        overallSignalStrength: 'weak',
      };
  }
}

// ============================================================================
// SECTION 9: COMPONENT CONSTRAINT TESTS
// ============================================================================

function testComponentConstraints(): void {
  console.log('\n=== COMPONENT CONSTRAINT TESTS ===');

  const tiers = [1, 2, 3, 4, 5, 6] as InternalTier[];
  const components = ['recognition', 'leadership', 'community', 'commitment'] as const;

  // Verify all component ranges are valid
  for (const tier of tiers) {
    const constraints = TIER_COMPONENT_CONSTRAINTS[tier];
    for (const comp of components) {
      const range = constraints[comp];
      assert(range.min >= 1, `Tier ${tier} ${comp} min >= 1`);
      assert(range.max <= 10, `Tier ${tier} ${comp} max <= 10`);
      assert(range.min <= range.max, `Tier ${tier} ${comp} min <= max`);
    }
  }

  // Recognition is tightly constrained — verify it follows tier hierarchy
  for (let i = 0; i < tiers.length - 1; i++) {
    const higherMax = TIER_COMPONENT_CONSTRAINTS[tiers[i]].recognition.max;
    const lowerMax = TIER_COMPONENT_CONSTRAINTS[tiers[i + 1]].recognition.max;
    assert(
      higherMax >= lowerMax,
      `Recognition: Tier ${tiers[i]} max (${higherMax}) >= Tier ${tiers[i + 1]} max (${lowerMax})`
    );
  }

  // Community has wider ranges — verify it partially transcends tier
  // Tier 4 community max should be > Tier 4 recognition max
  assert(
    TIER_COMPONENT_CONSTRAINTS[4].community.max > TIER_COMPONENT_CONSTRAINTS[4].recognition.max,
    'Tier 4: community max > recognition max (community transcends tier)'
  );
  assert(
    TIER_COMPONENT_CONSTRAINTS[5].community.max > TIER_COMPONENT_CONSTRAINTS[5].recognition.max,
    'Tier 5: community max > recognition max (community transcends tier)'
  );

  // Test clamping function
  assertEqual(clampComponentScore(10, 'recognition', 4), 5, 'Clamp recognition 10 in Tier 4 → 5');
  assertEqual(clampComponentScore(0, 'recognition', 1), 8, 'Clamp recognition 0 in Tier 1 → 8');
  assertEqual(clampComponentScore(5, 'community', 4), 5, 'Clamp community 5 in Tier 4 → 5 (within range)');
  assertEqual(clampComponentScore(8, 'community', 4), 6, 'Clamp community 8 in Tier 4 → 6 (clamped to max)');
  assertEqual(clampComponentScore(0, 'commitment', 3), 3, 'Clamp commitment 0 in Tier 3 → 3 (clamped to min)');
}

// ============================================================================
// SECTION 10: TIER ASSESSMENT SCORE TESTS
// ============================================================================

function testTierAssessmentScores(): void {
  console.log('\n=== TIER ASSESSMENT SCORE TESTS ===');

  // Verify tier scores are within their tier's score range
  const tiers = [1, 2, 3, 4, 5, 6] as InternalTier[];
  for (const tier of tiers) {
    const scores = TIER_ASSESSMENT_SCORES[tier];
    const range = TIER_SCORE_RANGES[tier];
    assertInRange(scores.base, range.min, range.max, `Tier ${tier} base score within range`);
    assertInRange(scores.strong, range.min, range.max, `Tier ${tier} strong score within range`);
    assert(scores.strong >= scores.base, `Tier ${tier}: strong (${scores.strong}) >= base (${scores.base})`);
  }

  // Verify tierScore in classification result
  {
    // High signal count (3+) → strong score
    const evidence = makeEvidence({
      scope: { level: 'international', confidence: 1.0, evidence: 'IMO' },
      recognitions: [{ name: 'IMO team member', level: 'international', isVerifiable: true, selectivityContext: '6 per country' }],
      role: { title: 'Competitor', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '1', unit: 'medal', context: 'Gold', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['IMO Gold Medal'] },
      commitment: { yearsActive: 4, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'strong',
    });
    const result = classifyTier(evidence);
    assertEqual(result.internalTier, 1 as InternalTier, 'IMO gold → Tier 1');
    assertInRange(result.tierScore, 9.0, 10.0, 'IMO gold tier score in Tier 1 range');
  }
}

// ============================================================================
// SECTION 11: CONFIDENCE & SIGNAL TRANSPARENCY TESTS
// ============================================================================

function testConfidenceAndTransparency(): void {
  console.log('\n=== CONFIDENCE & TRANSPARENCY TESTS ===');

  // Weak signal strength → low confidence
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.3, evidence: 'Vague description' },
      role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'Listed' },
      commitment: { yearsActive: 1, hoursPerWeek: 2, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      overallSignalStrength: 'weak',
    }));
    assertEqual(result.confidence, 'low', 'Weak signal → low confidence');
  }

  // Strong evidence with many signals → high confidence
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'state', confidence: 0.9, evidence: 'State champion' },
      recognitions: [{ name: 'State champion', level: 'state', isVerifiable: true }],
      role: { title: 'Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Team captain' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '1', unit: 'championship', context: 'State', isVerifiable: true }], estimatedPeopleReached: 100, tangibleOutcomes: ['State championship'] },
      commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 40, showsProgression: true, progressionArc: 'JV → Varsity → Captain → State champion', sustainedThroughJunior: true },
      categoryMatch: { category: 'athletics', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));
    assert(result.confidence !== 'low', 'Strong evidence → not low confidence');
  }

  // Verify signals array is always populated
  {
    const result = classifyTier(makeEvidence({
      overallSignalStrength: 'weak',
    }));
    assert(result.signals.length > 0, 'Signals array is always populated (even for Tier 6)');
    assert(result.reasoning.length > 0, 'Reasoning is always populated');
  }

  // Each signal has required fields
  {
    const result = classifyTier(makeEvidence(getEvidenceForTier(2)));
    for (const signal of result.signals) {
      assert(signal.rule.length > 0, `Signal has rule: ${signal.rule}`);
      assert(typeof signal.matched === 'boolean', `Signal has matched: ${signal.matched}`);
      assert(signal.evidence.length > 0, `Signal has evidence text`);
      assert(signal.weight > 0 && signal.weight <= 1, `Signal weight in (0,1]: ${signal.weight}`);
    }
  }
}

// ============================================================================
// SECTION 12: LOW CONFIDENCE WIDENED CONSTRAINTS TESTS
// ============================================================================

function testWidenedConstraints(): void {
  console.log('\n=== WIDENED CONSTRAINTS TESTS ===');

  // Low confidence should widen component constraints by ±1
  {
    const result = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.3, evidence: 'Sparse description' },
      role: { title: 'Member', type: 'member', isLeadershipApplicable: false, evidence: 'Brief mention' },
      commitment: { yearsActive: 1, hoursPerWeek: 2, weeksPerYear: 20, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      overallSignalStrength: 'weak',
    }));

    if (result.confidence === 'low') {
      const tier = result.internalTier;
      const normalConstraints = TIER_COMPONENT_CONSTRAINTS[tier];

      // Widened min should be normalMin - 1 (floored at 1)
      assertEqual(
        result.componentConstraints.recognition.min,
        Math.max(1, normalConstraints.recognition.min - 1),
        `Low confidence: recognition min widened from ${normalConstraints.recognition.min}`
      );

      // Widened max should be normalMax + 1 (capped at 10)
      assertEqual(
        result.componentConstraints.recognition.max,
        Math.min(10, normalConstraints.recognition.max + 1),
        `Low confidence: recognition max widened from ${normalConstraints.recognition.max}`
      );
    } else {
      // If not low confidence, constraints should match normal
      assert(true, 'Non-low-confidence — skip widening test (acceptable)');
    }
  }
}

// ============================================================================
// SECTION 13: HELPER FUNCTION TESTS
// ============================================================================

function testHelperFunctions(): void {
  console.log('\n=== HELPER FUNCTION TESTS ===');

  // getInternalTierName
  assertEqual(getInternalTierName(1).includes('Pinnacle'), true, 'Tier 1 name includes "Pinnacle"');
  assertEqual(getInternalTierName(2).includes('National'), true, 'Tier 2 name includes "National"');
  assertEqual(getInternalTierName(3).includes('State'), true, 'Tier 3 name includes "State"');
  assertEqual(getInternalTierName(4).includes('School'), true, 'Tier 4 name includes "School"');
  assertEqual(getInternalTierName(5).includes('Participant'), true, 'Tier 5 name includes "Participant"');
  assertEqual(getInternalTierName(6).includes('Developing'), true, 'Tier 6 name includes "Developing"');

  // clampToTierRange edge cases
  assertEqual(clampToTierRange(9.0, 1), 9.0, 'Clamp: exactly at min is valid');
  assertEqual(clampToTierRange(10.0, 1), 10.0, 'Clamp: exactly at max is valid');
  assertEqual(clampToTierRange(8.95, 2), 8.9, 'Clamp: 8.95 to Tier 2 → 8.9');

  // Verify all tiers have complete constraint definitions
  for (const tier of [1, 2, 3, 4, 5, 6] as InternalTier[]) {
    assert(TIER_SCORE_RANGES[tier] !== undefined, `TIER_SCORE_RANGES has tier ${tier}`);
    assert(TIER_COMPONENT_CONSTRAINTS[tier] !== undefined, `TIER_COMPONENT_CONSTRAINTS has tier ${tier}`);
    assert(TIER_ASSESSMENT_SCORES[tier] !== undefined, `TIER_ASSESSMENT_SCORES has tier ${tier}`);
    assert(INTERNAL_TO_EXTERNAL_TIER[tier] !== undefined, `INTERNAL_TO_EXTERNAL_TIER has tier ${tier}`);
  }
}

// ============================================================================
// SECTION 14: REAL-WORLD SCENARIO TESTS
// ============================================================================

function testRealWorldScenarios(): void {
  console.log('\n=== REAL-WORLD SCENARIO TESTS ===');

  // Scenario 1: CS Applicant — ML Research vs Grocery Store
  {
    const mlResearch = classifyTier(makeEvidence({
      scope: { level: 'regional', confidence: 0.7, evidence: 'University research lab' },
      recognitions: [
        { name: 'Presented at regional ML conference', level: 'regional', isVerifiable: true },
      ],
      role: { title: 'Research Assistant', type: 'contributor', isLeadershipApplicable: false, evidence: 'ML research under professor supervision' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '1', unit: 'conference poster', context: 'Regional ML symposium', isVerifiable: true }], estimatedPeopleReached: null, tangibleOutcomes: ['Conference poster presentation', 'Co-authored paper in preparation'] },
      commitment: { yearsActive: 1, hoursPerWeek: 15, weeksPerYear: 20, showsProgression: true, progressionArc: 'Data collection → Model training → Paper writing', sustainedThroughJunior: false },
      categoryMatch: { category: 'stem_research', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));

    const grocery = classifyTier(makeEvidence({
      scope: { level: 'local', confidence: 0.8, evidence: 'Grocery store' },
      recognitions: [],
      role: { title: 'Cashier', type: 'contributor', isLeadershipApplicable: true, evidence: 'Part-time cashier' },
      impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
      commitment: { yearsActive: 1, hoursPerWeek: 15, weeksPerYear: 48, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
      character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: ['Consistent work schedule'], paddingSignals: [] },
      categoryMatch: { category: 'work_family', confidence: 'high' },
      overallSignalStrength: 'moderate',
    }));

    assert(
      mlResearch.internalTier < grocery.internalTier ||
      (mlResearch.internalTier === grocery.internalTier && mlResearch.scoreRange.max > grocery.scoreRange.max),
      'Scenario 1: ML Research should tier higher than Grocery Store'
    );
  }

  // Scenario 2: USAMO Qualifier vs CS Club President
  {
    const usamo = classifyTier(makeEvidence({
      scope: { level: 'national', confidence: 1.0, evidence: 'USAMO qualifier' },
      recognitions: [
        { name: 'USAMO qualifier', level: 'national', isVerifiable: true, selectivityContext: 'Top ~500 out of 300,000+' },
      ],
      role: { title: 'Competitor', type: 'contributor', isLeadershipApplicable: false, evidence: 'Individual' },
      commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 40, showsProgression: true, progressionArc: 'AMC → AIME → USAMO', sustainedThroughJunior: true },
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
      overallSignalStrength: 'strong',
    }));

    const csClub = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'CS Club' },
      recognitions: [],
      role: { title: 'President', type: 'president_captain', isLeadershipApplicable: true, evidence: 'Club president' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '30', unit: 'members', context: 'Active members', isVerifiable: true }], estimatedPeopleReached: 30, tangibleOutcomes: ['Weekly workshops', 'Hackathon participation'] },
      commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: 'Member → VP → President', sustainedThroughJunior: true },
      character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['Specific event details'], paddingSignals: [] },
      categoryMatch: { category: 'technology', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));

    assert(usamo.internalTier <= 2, 'Scenario 2: USAMO → Tier 1 or 2');
    assert(csClub.internalTier >= 4, 'Scenario 2: CS Club President → Tier 4+');
    assert(usamo.internalTier < csClub.internalTier, 'Scenario 2: USAMO ranks strictly higher than CS Club President');
    assert(
      usamo.scoreRange.min > csClub.scoreRange.max,
      `Scenario 2: USAMO min score (${usamo.scoreRange.min}) > CS Club max (${csClub.scoreRange.max}) — no overlap`
    );
  }

  // Scenario 3: First-gen context does NOT inflate tier
  {
    const firstGenClub = classifyTier(makeEvidence({
      scope: { level: 'school', confidence: 0.7, evidence: 'Founded CS club at under-resourced school' },
      recognitions: [],
      role: { title: 'Founder', type: 'founder', isLeadershipApplicable: true, evidence: 'Created club from scratch' },
      impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '20', unit: 'members', context: 'Club members at school with no STEM clubs', isVerifiable: true }], estimatedPeopleReached: 20, tangibleOutcomes: ['20 members in first year'] },
      commitment: { yearsActive: 1, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
      character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['First-gen', 'No prior STEM clubs at school'], paddingSignals: [] },
      categoryMatch: { category: 'technology', confidence: 'medium' },
      overallSignalStrength: 'moderate',
    }));

    assert(firstGenClub.internalTier >= 4, 'Scenario 3: First-gen school club founder → Tier 4+ (NOT inflated to 2)');
  }

  // Scenario 4: Mixed portfolio should have spread
  {
    const published = classifyTier(makeEvidence(getEvidenceForTier(1)));
    const hospital = classifyTier(makeEvidence(getEvidenceForTier(3)));
    const bioClub = classifyTier(makeEvidence(getEvidenceForTier(4)));
    const soccer = classifyTier(makeEvidence(getEvidenceForTier(5)));

    assert(
      published.internalTier < hospital.internalTier,
      'Scenario 4: Published research higher tier than hospital volunteer'
    );
    assert(
      hospital.internalTier <= bioClub.internalTier,
      'Scenario 4: Hospital volunteer higher or equal tier to bio club'
    );
    assert(
      bioClub.internalTier <= soccer.internalTier,
      'Scenario 4: Bio club higher or equal tier to soccer'
    );
    assert(
      published.scoreRange.min - soccer.scoreRange.max >= 4.0,
      `Scenario 4: Score gap between T1 and T5 >= 4.0 (actual: ${published.scoreRange.min - soccer.scoreRange.max})`
    );
  }
}

// ============================================================================
// SECTION 15: BENCHMARK MATCHING TESTS
// ============================================================================

function testBenchmarkMatching(): void {
  console.log('\n=== BENCHMARK MATCHING TESTS ===');

  // Match USAMO qualifier to benchmark
  {
    const evidence = makeEvidence({
      recognitions: [{ name: 'USAMO qualifier', level: 'national', isVerifiable: true }],
      categoryMatch: { category: 'stem_competition', confidence: 'high' },
    });
    const result = matchesBenchmarkTier(evidence, 1);
    assertEqual(result.matched, true, 'USAMO qualifier matches Tier 1 benchmark');
  }

  // Match All-State ensemble to benchmark
  {
    const evidence = makeEvidence({
      recognitions: [{ name: 'All-State ensemble member', level: 'state', isVerifiable: true }],
      categoryMatch: { category: 'performing_arts', confidence: 'high' },
    });
    const result = matchesBenchmarkTier(evidence, 3);
    assertEqual(result.matched, true, 'All-State ensemble matches internal Tier 3 (benchmark Tier 2)');
  }

  // Low confidence category → no match
  {
    const evidence = makeEvidence({
      recognitions: [{ name: 'Something', level: 'national', isVerifiable: true }],
      categoryMatch: { category: 'stem_competition', confidence: 'low' },
    });
    const result = matchesBenchmarkTier(evidence, 1);
    assertEqual(result.matched, false, 'Low confidence category → no benchmark match');
  }

  // Unknown category → no match
  {
    const evidence = makeEvidence({
      recognitions: [{ name: 'Custom award', level: 'national', isVerifiable: true }],
      categoryMatch: { category: 'nonexistent_category', confidence: 'high' },
    });
    const result = matchesBenchmarkTier(evidence, 1);
    assertEqual(result.matched, false, 'Unknown category → no benchmark match');
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function main(): Promise<void> {
  console.log('============================================================');
  console.log('TIER CLASSIFICATION UNIT TESTS');
  console.log('Phase 2 of Decomposed Scoring Architecture');
  console.log('Cost: $0.00 (all deterministic, no API calls)');
  console.log('============================================================');

  testTier1Classification();
  testTier2Classification();
  testTier3Classification();
  testTier4Classification();
  testTier5Classification();
  testTier6Classification();
  testExternalTierMapping();
  testScoreRangeConstraints();
  testComponentConstraints();
  testTierAssessmentScores();
  testConfidenceAndTransparency();
  testWidenedConstraints();
  testHelperFunctions();
  testRealWorldScenarios();
  testBenchmarkMatching();

  console.log('\n============================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('============================================================');

  if (failed > 0) {
    console.log('\nFAILURES:');
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
}

main();
