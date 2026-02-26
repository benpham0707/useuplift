/**
 * Rule Scorer Calibration Tests — Wide Variety
 *
 * Tests deterministic scoring across diverse activity types at multiple tiers.
 * Verifies that:
 * 1. Scores fall within correct tier ranges
 * 2. Higher-achievement activities outscore lower ones within same category
 * 3. Component scores respect tier constraints
 * 4. Leadership N/A handled correctly for solo activities
 * 5. Cross-category fairness (a Tier 2 startup ≈ a Tier 2 research project)
 *
 * All tests are pure code — no API calls, $0.00 cost.
 */

import {
  activityRuleScorerService,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/activityRuleScorer';
import {
  descriptionRuleScorerService,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionRuleScorer';
import {
  classifyTier,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/tierClassifier';
import type {
  ExtractedEvidence,
  TierClassification,
  ActivityScore,
  InternalTier,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import { TIER_SCORE_RANGES } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import type {
  ExtractedDescriptionFeatures,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/featureTypes';
import type { DescriptionScore } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

// ============================================================================
// HELPERS
// ============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function makeEvidence(overrides: Partial<DeepPartial<ExtractedEvidence>> = {}): ExtractedEvidence {
  return {
    scope: { level: 'school', confidence: 0.5, evidence: '', ...overrides.scope },
    recognitions: overrides.recognitions ?? [],
    role: { title: 'member', type: 'member', isLeadershipApplicable: true, evidence: '', ...overrides.role },
    impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [], ...overrides.impact },
    commitment: { yearsActive: 1, hoursPerWeek: 3, weeksPerYear: 36, showsProgression: false, progressionArc: null, sustainedThroughJunior: false, ...overrides.commitment },
    character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [], ...overrides.character },
    categoryMatch: { category: 'leadership_government', confidence: 'medium', ...overrides.categoryMatch },
    overallSignalStrength: overrides.overallSignalStrength ?? 'moderate',
  } as ExtractedEvidence;
}

function makeFeatures(overrides: DeepPartial<ExtractedDescriptionFeatures> = {}): ExtractedDescriptionFeatures {
  return {
    activityId: 'test',
    verbs: overrides.verbs as ExtractedDescriptionFeatures['verbs'] ?? [],
    numbers: overrides.numbers as ExtractedDescriptionFeatures['numbers'] ?? [],
    roleOwnership: { individualPhrases: [], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false, ...overrides.roleOwnership },
    impact: { causalChains: [], unsupportedClaims: [], hasMeasurableOutcome: false, ...overrides.impact },
    differentiation: { uniqueDetails: [], genericPhrases: [], passesThousandStudentTest: false, ...overrides.differentiation },
    characterEfficiency: { totalChars: 100, charLimit: 150, utilizationRate: 0.67, wastedPatterns: [], usesFragments: true, restatesPosition: false, ...overrides.characterEfficiency },
    authenticity: { overclaiming: [], authenticityMarkers: [], readsAsAIGenerated: false, ...overrides.authenticity },
    detectedActivityType: overrides.detectedActivityType ?? 'other',
  } as ExtractedDescriptionFeatures;
}

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

function assertRange(value: number, min: number, max: number, label: string): void {
  assert(value >= min && value <= max, `${label}: expected ${min}-${max}, got ${value}`);
}

function assertGreater(a: number, b: number, label: string): void {
  assert(a > b, `${label}: expected ${a} > ${b}`);
}

interface ScoredActivity {
  name: string;
  evidence: ExtractedEvidence;
  tier: TierClassification;
  activityScore: ActivityScore;
  descriptionScore: DescriptionScore;
}

function scoreActivity(name: string, evidence: ExtractedEvidence, features: ExtractedDescriptionFeatures): ScoredActivity {
  const tier = classifyTier(evidence);
  const activityScore = activityRuleScorerService.scoreActivity(evidence, tier);
  const descriptionScore = descriptionRuleScorerService.scoreDescription(features);
  return { name, evidence, tier, activityScore, descriptionScore };
}

// ============================================================================
// CATEGORY 1: STARTUPS & ENTREPRENEURSHIP (gradient from garage to unicorn)
// ============================================================================

console.log('\n=== STARTUPS & ENTREPRENEURSHIP ===');

const startupGarage = scoreActivity('Startup: Garage Side Project', makeEvidence({
  scope: { level: 'local', confidence: 0.4, evidence: 'local app' },
  recognitions: [],
  role: { title: 'Creator', type: 'founder', isLeadershipApplicable: true, evidence: 'built an app' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: 10, tangibleOutcomes: ['Built mobile app'] },
  commitment: { yearsActive: 0.5, hoursPerWeek: 10, weeksPerYear: 20, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'innovation', communityBenefit: 'self-focused', authenticitySignals: ['specific tech stack'], paddingSignals: [] },
  categoryMatch: { category: 'entrepreneurship', confidence: 'medium' },
  overallSignalStrength: 'weak',
}), makeFeatures({
  verbs: [{ verb: 'built', lemma: 'build', context: 'built a mobile app', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: ['Built app'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [], unsupportedClaims: [], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['built an app'], passesThousandStudentTest: false },
}));
console.log(`  Garage project: Tier ${startupGarage.tier.internalTier}, Activity ${startupGarage.activityScore.total}/10, Desc ${startupGarage.descriptionScore.total}/10`);

const startupLocal = scoreActivity('Startup: Local Users', makeEvidence({
  scope: { level: 'local', confidence: 0.6, evidence: 'local customer base' },
  recognitions: [{ name: 'School Pitch Competition', level: 'school', isVerifiable: false }],
  role: { title: 'Co-Founder & CEO', type: 'founder', isLeadershipApplicable: true, evidence: 'co-founded company' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '$2K', unit: 'revenue', context: 'monthly recurring', isVerifiable: false }], estimatedPeopleReached: 100, tangibleOutcomes: ['$2K MRR', '100 active users'] },
  commitment: { yearsActive: 1.5, hoursPerWeek: 15, weeksPerYear: 52, showsProgression: true, progressionArc: 'idea → MVP → first customers', sustainedThroughJunior: false },
  character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['specific revenue figures', 'customer testimonials'], paddingSignals: [] },
  categoryMatch: { category: 'entrepreneurship', confidence: 'high' },
  overallSignalStrength: 'moderate',
}), makeFeatures({
  verbs: [
    { verb: 'founded', lemma: 'found', context: 'co-founded tutoring platform', isIndividualAction: true },
    { verb: 'built', lemma: 'build', context: 'built the product', isIndividualAction: true },
    { verb: 'acquired', lemma: 'acquire', context: 'acquired 100 users', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '$2K', numericValue: 2000, unit: 'MRR', hasContext: true, isMeaningful: true },
    { rawValue: '100', numericValue: 100, unit: 'active users', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Co-founded', 'Built the product', 'Acquired 100 users'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Built tutoring platform', outcome: '$2K MRR with 100 users', hasExternalValidation: false }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['tutoring platform with $2K MRR', 'specific tech stack and growth metrics'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: '$2K monthly recurring revenue' },
}));
console.log(`  Local startup: Tier ${startupLocal.tier.internalTier}, Activity ${startupLocal.activityScore.total}/10, Desc ${startupLocal.descriptionScore.total}/10`);

const startupRegional = scoreActivity('Startup: Regional Impact', makeEvidence({
  scope: { level: 'regional', confidence: 0.7, evidence: 'multi-city user base' },
  recognitions: [
    { name: 'DECA State Finalist', level: 'state', isVerifiable: true },
    { name: 'Local Chamber of Commerce Award', level: 'regional', isVerifiable: true },
  ],
  role: { title: 'Founder & CEO', type: 'founder', isLeadershipApplicable: true, evidence: 'founded and runs company' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '$15K', unit: 'revenue', context: 'total revenue', isVerifiable: false }, { value: '500', unit: 'users', context: 'across 3 cities', isVerifiable: false }], estimatedPeopleReached: 500, tangibleOutcomes: ['$15K revenue', '500 users across 3 cities', '3 part-time employees'] },
  commitment: { yearsActive: 2, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, progressionArc: 'idea → MVP → revenue → employees', sustainedThroughJunior: true },
  character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['specific revenue', 'employee count', 'city names'], paddingSignals: [] },
  categoryMatch: { category: 'entrepreneurship', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'founded', lemma: 'found', context: 'founded ed-tech startup', isIndividualAction: true },
    { verb: 'scaled', lemma: 'scale', context: 'scaled to 500 users', isIndividualAction: true },
    { verb: 'managed', lemma: 'manage', context: 'managed 3 employees', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '$15K', numericValue: 15000, unit: 'revenue', hasContext: true, isMeaningful: true },
    { rawValue: '500', numericValue: 500, unit: 'users', hasContext: true, isMeaningful: true },
    { rawValue: '3', numericValue: 3, unit: 'employees', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Founded', 'Scaled', 'Managed employees'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Founded ed-tech startup', outcome: '500 users across 3 cities', hasExternalValidation: false }, { action: 'Managed growth', outcome: '$15K revenue, 3 employees', hasExternalValidation: false }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['ed-tech platform specific to underserved communities', '$15K revenue as teenager', 'manages real employees'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: '$15K revenue teen founder' },
}));
console.log(`  Regional startup: Tier ${startupRegional.tier.internalTier}, Activity ${startupRegional.activityScore.total}/10, Desc ${startupRegional.descriptionScore.total}/10`);

const startupNational = scoreActivity('Startup: National Scale (YC-backed)', makeEvidence({
  scope: { level: 'national', confidence: 0.9, evidence: 'nationwide user base, YC-backed' },
  recognitions: [
    { name: 'Y Combinator S24', level: 'national', isVerifiable: true, selectivityContext: 'top 1.5% of 30K applicants' },
    { name: 'Forbes 30 Under 30 Nominee', level: 'national', isVerifiable: true },
    { name: 'TechCrunch Feature', level: 'national', isVerifiable: true },
  ],
  role: { title: 'Founder & CEO', type: 'founder', isLeadershipApplicable: true, evidence: 'sole founder' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '$500K', unit: 'ARR', context: 'annual recurring revenue', isVerifiable: true }, { value: '10K', unit: 'users', context: 'nationwide', isVerifiable: true }, { value: '$2M', unit: 'raised', context: 'seed funding', isVerifiable: true }], estimatedPeopleReached: 10000, tangibleOutcomes: ['$500K ARR', '10K users', '$2M seed round', '8 full-time employees', 'YC batch'] },
  commitment: { yearsActive: 3, hoursPerWeek: 40, weeksPerYear: 52, showsProgression: true, progressionArc: 'idea → MVP → YC → $2M seed → 8 employees', sustainedThroughJunior: true },
  character: { primaryTrait: 'innovation', communityBenefit: 'significant', authenticitySignals: ['YC batch verifiable', 'specific ARR figures', 'named investors'], paddingSignals: [] },
  categoryMatch: { category: 'entrepreneurship', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'founded', lemma: 'found', context: 'founded AI education platform', isIndividualAction: true },
    { verb: 'raised', lemma: 'raise', context: 'raised $2M seed round', isIndividualAction: true },
    { verb: 'engineered', lemma: 'engineer', context: 'engineered core ML pipeline', isIndividualAction: true },
    { verb: 'scaled', lemma: 'scale', context: 'scaled to 10K users', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '$500K', numericValue: 500000, unit: 'ARR', hasContext: true, isMeaningful: true },
    { rawValue: '10K', numericValue: 10000, unit: 'users', hasContext: true, isMeaningful: true },
    { rawValue: '$2M', numericValue: 2000000, unit: 'funding', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Founded', 'Raised $2M', 'Engineered ML pipeline', 'Scaled to 10K'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Founded AI education platform', outcome: '$500K ARR, 10K users, YC-backed', hasExternalValidation: true }, { action: 'Raised $2M seed round', outcome: 'Hired 8 full-time employees', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['YC S24 batch', '$2M seed round', 'AI education platform specific niche', 'sole teenage founder'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'YC-backed AI startup with $500K ARR as teenager' },
}));
console.log(`  YC startup: Tier ${startupNational.tier.internalTier}, Activity ${startupNational.activityScore.total}/10, Desc ${startupNational.descriptionScore.total}/10`);

// Startup gradient: each higher-achievement startup should outscore the previous
assertGreater(startupLocal.activityScore.total, startupGarage.activityScore.total, 'Local startup > Garage');
assertGreater(startupRegional.activityScore.total, startupLocal.activityScore.total, 'Regional startup > Local');
assertGreater(startupNational.activityScore.total, startupRegional.activityScore.total, 'YC startup > Regional');
assertRange(startupNational.activityScore.total, 7, 10, 'YC startup is elite/national tier');
assertRange(startupGarage.activityScore.total, 1, 5, 'Garage project is lower tier');

// Description quality gradient
assertGreater(startupNational.descriptionScore.total, startupGarage.descriptionScore.total, 'YC desc > Garage desc');

// ============================================================================
// CATEGORY 2: STEM RESEARCH (from school project to published paper)
// ============================================================================

console.log('\n=== STEM RESEARCH ===');

const researchSchool = scoreActivity('Research: School Science Fair', makeEvidence({
  scope: { level: 'school', confidence: 0.7, evidence: 'school science fair' },
  recognitions: [{ name: 'School Science Fair 2nd Place', level: 'school', isVerifiable: false }],
  role: { title: 'Researcher', type: 'contributor', isLeadershipApplicable: false, evidence: 'independent project' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: ['Completed science fair project'] },
  commitment: { yearsActive: 1, hoursPerWeek: 5, weeksPerYear: 20, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: ['specific hypothesis'], paddingSignals: [] },
  categoryMatch: { category: 'stem_research', confidence: 'high' },
}), makeFeatures({
  verbs: [{ verb: 'researched', lemma: 'research', context: 'researched water quality', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: ['Researched'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [], unsupportedClaims: [], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: ['specific water quality topic'], genericPhrases: ['science fair project'], passesThousandStudentTest: false },
}));
console.log(`  School science fair: Tier ${researchSchool.tier.internalTier}, Activity ${researchSchool.activityScore.total}/10`);

const researchMentored = scoreActivity('Research: University Lab (Mentored)', makeEvidence({
  scope: { level: 'regional', confidence: 0.6, evidence: 'university lab' },
  recognitions: [{ name: 'Intel ISEF Semifinalist', level: 'state', isVerifiable: true }],
  role: { title: 'Research Assistant', type: 'contributor', isLeadershipApplicable: false, evidence: 'worked in university lab' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '93%', unit: 'accuracy', context: 'ML model accuracy improvement', isVerifiable: false }], estimatedPeopleReached: null, tangibleOutcomes: ['Improved ML model accuracy to 93%', 'Co-authored conference poster'] },
  commitment: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 40, showsProgression: true, progressionArc: 'assistant → independent researcher', sustainedThroughJunior: true },
  character: { primaryTrait: 'curiosity', communityBenefit: 'minimal', authenticitySignals: ['specific lab name', 'named professor mentor', 'technical methodology'], paddingSignals: [] },
  categoryMatch: { category: 'stem_research', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'designed', lemma: 'design', context: 'designed experimental protocol', isIndividualAction: true },
    { verb: 'analyzed', lemma: 'analyze', context: 'analyzed 10K data points', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '93%', numericValue: 93, unit: 'accuracy', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Designed protocol', 'Analyzed data'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Designed ML pipeline', outcome: '93% accuracy on prediction task', hasExternalValidation: false }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['specific ML methodology', 'university lab context'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'ML model for environmental prediction' },
}));
console.log(`  University lab: Tier ${researchMentored.tier.internalTier}, Activity ${researchMentored.activityScore.total}/10`);

const researchPublished = scoreActivity('Research: Published in Peer-Reviewed Journal', makeEvidence({
  scope: { level: 'national', confidence: 0.9, evidence: 'published in Nature Communications' },
  recognitions: [
    { name: 'Published in Nature Communications', level: 'national', isVerifiable: true, selectivityContext: 'peer-reviewed, impact factor 16.6' },
    { name: 'Regeneron STS Semifinalist', level: 'national', isVerifiable: true, selectivityContext: 'top 300 of 2,162' },
  ],
  role: { title: 'First Author', type: 'founder', isLeadershipApplicable: false, evidence: 'first author on published paper' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '50', unit: 'citations', context: 'within 6 months', isVerifiable: true }], estimatedPeopleReached: 5000, tangibleOutcomes: ['Published paper', '50 citations', 'Contributed to ongoing research program'] },
  commitment: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 48, showsProgression: true, progressionArc: 'lab assistant → independent researcher → first author', sustainedThroughJunior: true },
  character: { primaryTrait: 'curiosity', communityBenefit: 'significant', authenticitySignals: ['specific journal name', 'citation count', 'technical detail'], paddingSignals: [] },
  categoryMatch: { category: 'stem_research', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'published', lemma: 'publish', context: 'published in Nature Comms', isIndividualAction: true },
    { verb: 'designed', lemma: 'design', context: 'designed novel assay', isIndividualAction: true },
    { verb: 'synthesized', lemma: 'synthesize', context: 'synthesized findings', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '50', numericValue: 50, unit: 'citations', hasContext: true, isMeaningful: true },
    { rawValue: '16.6', numericValue: 16.6, unit: 'impact factor', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Published', 'Designed assay', 'First author'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Developed novel assay', outcome: 'Published in Nature Comms with 50 citations', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['Nature Communications', 'first author as high schooler', '50 citations'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'First author publication in Nature Communications' },
}));
console.log(`  Published researcher: Tier ${researchPublished.tier.internalTier}, Activity ${researchPublished.activityScore.total}/10`);

assertGreater(researchMentored.activityScore.total, researchSchool.activityScore.total, 'Mentored research > School fair');
assertGreater(researchPublished.activityScore.total, researchMentored.activityScore.total, 'Published > Mentored');
assert(!researchPublished.activityScore.breakdown.weightConfig.leadershipApplicable, 'Published research: leadership N/A');

// ============================================================================
// CATEGORY 3: ATHLETICS (from JV bench to D1 recruit)
// ============================================================================

console.log('\n=== ATHLETICS ===');

const athleteJV = scoreActivity('Athletics: JV Bench Player', makeEvidence({
  scope: { level: 'school', confidence: 0.8, evidence: 'JV basketball' },
  recognitions: [],
  role: { title: 'Player', type: 'participant', isLeadershipApplicable: false, evidence: 'JV player' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
  commitment: { yearsActive: 1, hoursPerWeek: 10, weeksPerYear: 20, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'discipline', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: [] },
  categoryMatch: { category: 'athletics', confidence: 'high' },
}), makeFeatures({
  verbs: [{ verb: 'played', lemma: 'play', context: 'played JV basketball', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: [], teamPhrases: ['team player'], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false },
  impact: { causalChains: [], unsupportedClaims: ['gained teamwork skills'], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['played basketball', 'teamwork'], passesThousandStudentTest: false },
}));
console.log(`  JV bench: Tier ${athleteJV.tier.internalTier}, Activity ${athleteJV.activityScore.total}/10`);

const athleteVarsityCaptain = scoreActivity('Athletics: Varsity Captain, All-Conference', makeEvidence({
  scope: { level: 'regional', confidence: 0.7, evidence: 'varsity, all-conference selection' },
  recognitions: [
    { name: 'All-Conference First Team', level: 'regional', isVerifiable: true },
    { name: 'Team MVP', level: 'school', isVerifiable: false },
  ],
  role: { title: 'Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'team captain' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '18', unit: 'ppg', context: 'points per game', isVerifiable: true }], estimatedPeopleReached: 30, tangibleOutcomes: ['Led team to conference finals', 'All-conference selection'] },
  commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 40, showsProgression: true, progressionArc: 'JV → varsity starter → captain', sustainedThroughJunior: true },
  character: { primaryTrait: 'resilience', communityBenefit: 'moderate', authenticitySignals: ['specific stats', 'named conference'], paddingSignals: [] },
  categoryMatch: { category: 'athletics', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'led', lemma: 'lead', context: 'led team to conference finals', isIndividualAction: true },
    { verb: 'organized', lemma: 'organize', context: 'organized off-season training', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '18', numericValue: 18, unit: 'PPG', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Led team', 'Organized training'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Led team as captain', outcome: 'Conference finals + All-Conference', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['18 PPG', 'All-Conference First Team'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'All-Conference First Team captain' },
}));
console.log(`  Varsity captain: Tier ${athleteVarsityCaptain.tier.internalTier}, Activity ${athleteVarsityCaptain.activityScore.total}/10`);

const athleteD1Recruit = scoreActivity('Athletics: D1 Recruited Athlete', makeEvidence({
  scope: { level: 'national', confidence: 0.9, evidence: 'D1 recruited' },
  recognitions: [
    { name: 'D1 Athletic Scholarship (UCLA)', level: 'national', isVerifiable: true, selectivityContext: 'top 3% of all HS swimmers nationally' },
    { name: 'State Champion 100m Freestyle', level: 'state', isVerifiable: true },
    { name: 'All-American Honorable Mention', level: 'national', isVerifiable: true },
  ],
  role: { title: 'Team Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'captain, D1 recruit' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '49.2s', unit: '100m time', context: 'top 3% nationally', isVerifiable: true }], estimatedPeopleReached: 50, tangibleOutcomes: ['State championship', 'D1 scholarship', 'All-American mention'] },
  commitment: { yearsActive: 4, hoursPerWeek: 25, weeksPerYear: 50, showsProgression: true, progressionArc: 'recreational → club → varsity starter → state champion → D1 recruit', sustainedThroughJunior: true },
  character: { primaryTrait: 'resilience', communityBenefit: 'moderate', authenticitySignals: ['specific times', 'named college', 'verified results'], paddingSignals: [] },
  categoryMatch: { category: 'athletics', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'trained', lemma: 'train', context: 'trained 25hrs/week', isIndividualAction: true },
    { verb: 'won', lemma: 'win', context: 'won state championship', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '49.2s', numericValue: 49.2, unit: '100m freestyle', hasContext: true, isMeaningful: true },
    { rawValue: '25', numericValue: 25, unit: 'hrs/week training', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Trained', 'Won state', 'Recruited by UCLA'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Trained intensively', outcome: 'State champion, D1 recruited', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['49.2s 100m', 'UCLA D1 scholarship', 'State champion'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'D1 recruited swimmer' },
}));
console.log(`  D1 recruit: Tier ${athleteD1Recruit.tier.internalTier}, Activity ${athleteD1Recruit.activityScore.total}/10`);

assertGreater(athleteVarsityCaptain.activityScore.total, athleteJV.activityScore.total, 'Varsity captain > JV bench');
assertGreater(athleteD1Recruit.activityScore.total, athleteVarsityCaptain.activityScore.total, 'D1 recruit > Varsity captain');

// ============================================================================
// CATEGORY 4: PERFORMING ARTS (from school play to professional)
// ============================================================================

console.log('\n=== PERFORMING ARTS ===');

const artsSchool = scoreActivity('Arts: School Play Chorus', makeEvidence({
  scope: { level: 'school', confidence: 0.7, evidence: 'school musical' },
  recognitions: [],
  role: { title: 'Ensemble Member', type: 'participant', isLeadershipApplicable: false, evidence: 'chorus' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
  commitment: { yearsActive: 1, hoursPerWeek: 5, weeksPerYear: 12, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'creativity', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: [] },
  categoryMatch: { category: 'arts_creative', confidence: 'high' },
}), makeFeatures({
  verbs: [{ verb: 'performed', lemma: 'perform', context: 'performed in school musical', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: [], teamPhrases: ['ensemble'], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false },
  impact: { causalChains: [], unsupportedClaims: [], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['school musical', 'performed'], passesThousandStudentTest: false },
}));
console.log(`  School chorus: Tier ${artsSchool.tier.internalTier}, Activity ${artsSchool.activityScore.total}/10`);

const artsAllState = scoreActivity('Arts: All-State Orchestra, Principal Chair', makeEvidence({
  scope: { level: 'state', confidence: 0.8, evidence: 'all-state orchestra' },
  recognitions: [
    { name: 'All-State Orchestra Principal Violin', level: 'state', isVerifiable: true },
    { name: 'Regional Youth Symphony Concertmaster', level: 'regional', isVerifiable: true },
  ],
  role: { title: 'Principal Violin', type: 'executive', isLeadershipApplicable: true, evidence: 'principal chair' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: 200, tangibleOutcomes: ['All-State selection', 'Concertmaster'] },
  commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 48, showsProgression: true, progressionArc: 'section member → section leader → concertmaster → all-state', sustainedThroughJunior: true },
  character: { primaryTrait: 'discipline', communityBenefit: 'moderate', authenticitySignals: ['specific chair position', 'repertoire mentioned'], paddingSignals: [] },
  categoryMatch: { category: 'arts_creative', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'led', lemma: 'lead', context: 'led violin section', isIndividualAction: true },
    { verb: 'performed', lemma: 'perform', context: 'performed as concertmaster', isIndividualAction: true },
  ],
  numbers: [],
  roleOwnership: { individualPhrases: ['Led section', 'Selected as concertmaster'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Auditioned competitively', outcome: 'Selected Principal Violin All-State', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: ['Principal Violin chair', 'All-State Orchestra'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'All-State Orchestra Principal Violin' },
}));
console.log(`  All-State violin: Tier ${artsAllState.tier.internalTier}, Activity ${artsAllState.activityScore.total}/10`);

assertGreater(artsAllState.activityScore.total, artsSchool.activityScore.total, 'All-State > School chorus');

// ============================================================================
// CATEGORY 5: COMMUNITY SERVICE (from one-time to founded nonprofit)
// ============================================================================

console.log('\n=== COMMUNITY SERVICE ===');

const serviceOneTime = scoreActivity('Service: One-Time Beach Cleanup', makeEvidence({
  scope: { level: 'local', confidence: 0.5, evidence: 'beach cleanup' },
  recognitions: [],
  role: { title: 'Volunteer', type: 'participant', isLeadershipApplicable: false, evidence: 'participated' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
  commitment: { yearsActive: 0.1, hoursPerWeek: 3, weeksPerYear: 1, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'service', communityBenefit: 'minimal', authenticitySignals: [], paddingSignals: ['one-time event'] },
  categoryMatch: { category: 'community_service', confidence: 'medium' },
  overallSignalStrength: 'weak',
}), makeFeatures({
  verbs: [{ verb: 'participated', lemma: 'participate', context: 'participated in cleanup', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: [], teamPhrases: ['group event'], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false },
  impact: { causalChains: [], unsupportedClaims: ['helped the environment'], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['beach cleanup', 'helped environment'], passesThousandStudentTest: false },
}));
console.log(`  One-time cleanup: Tier ${serviceOneTime.tier.internalTier}, Activity ${serviceOneTime.activityScore.total}/10`);

const serviceFoundedNonprofit = scoreActivity('Service: Founded 501c3 Nonprofit', makeEvidence({
  scope: { level: 'regional', confidence: 0.8, evidence: 'multi-county nonprofit' },
  recognitions: [
    { name: 'Presidential Volunteer Service Award Gold', level: 'national', isVerifiable: true },
    { name: 'Local Hero Award, City Council', level: 'local', isVerifiable: true },
  ],
  role: { title: 'Founder & Executive Director', type: 'founder', isLeadershipApplicable: true, evidence: 'founded 501c3' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '2000', unit: 'meals served', context: 'monthly', isVerifiable: true }, { value: '50', unit: 'volunteers', context: 'active roster', isVerifiable: false }], estimatedPeopleReached: 2000, tangibleOutcomes: ['501c3 status', '2000 meals/month', '50 active volunteers', 'partnered with 3 food banks'] },
  commitment: { yearsActive: 3, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: true, progressionArc: 'volunteer → organizer → founder → executive director', sustainedThroughJunior: true },
  character: { primaryTrait: 'service', communityBenefit: 'significant', authenticitySignals: ['501c3 verification', 'specific partner names', 'meal count tracking'], paddingSignals: [] },
  categoryMatch: { category: 'community_service', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'founded', lemma: 'found', context: 'founded food security nonprofit', isIndividualAction: true },
    { verb: 'managed', lemma: 'manage', context: 'managed 50 volunteers', isIndividualAction: true },
    { verb: 'negotiated', lemma: 'negotiate', context: 'negotiated food bank partnerships', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '2000', numericValue: 2000, unit: 'meals/month', hasContext: true, isMeaningful: true },
    { rawValue: '50', numericValue: 50, unit: 'volunteers', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Founded nonprofit', 'Managed 50 volunteers', 'Negotiated partnerships'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Founded nonprofit', outcome: '2000 meals/month, 501c3 status', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['501c3 nonprofit', '2000 meals/month', 'food bank partnerships'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'Founded 501c3 serving 2000 meals/month' },
}));
console.log(`  Founded nonprofit: Tier ${serviceFoundedNonprofit.tier.internalTier}, Activity ${serviceFoundedNonprofit.activityScore.total}/10`);

assertGreater(serviceFoundedNonprofit.activityScore.total, serviceOneTime.activityScore.total, 'Founded nonprofit > One-time cleanup');
assertRange(serviceOneTime.activityScore.total, 1, 3.5, 'One-time cleanup is low tier');

// ============================================================================
// CATEGORY 6: WORK & FAMILY RESPONSIBILITY
// ============================================================================

console.log('\n=== WORK & FAMILY RESPONSIBILITY ===');

const workCashier = scoreActivity('Work: Fast Food Cashier', makeEvidence({
  scope: { level: 'local', confidence: 0.8, evidence: 'fast food' },
  recognitions: [],
  role: { title: 'Cashier', type: 'contributor', isLeadershipApplicable: false, evidence: 'cashier' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
  commitment: { yearsActive: 1, hoursPerWeek: 20, weeksPerYear: 52, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: ['specific hours'], paddingSignals: [] },
  categoryMatch: { category: 'work_employment', confidence: 'high' },
}), makeFeatures({
  verbs: [{ verb: 'worked', lemma: 'work', context: 'worked as cashier', isIndividualAction: true }],
  numbers: [{ rawValue: '20', numericValue: 20, unit: 'hrs/week', hasContext: false, isMeaningful: false, vanityReason: 'time spent' }],
  roleOwnership: { individualPhrases: [], teamPhrases: ['team member'], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false },
  impact: { causalChains: [], unsupportedClaims: ['learned responsibility'], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['worked as cashier', 'customer service'], passesThousandStudentTest: false },
}));
console.log(`  Fast food: Tier ${workCashier.tier.internalTier}, Activity ${workCashier.activityScore.total}/10`);

const workPromotion = scoreActivity('Work: Promoted to Shift Manager', makeEvidence({
  scope: { level: 'local', confidence: 0.7, evidence: 'local restaurant' },
  recognitions: [{ name: 'Employee of the Month (3x)', level: 'local', isVerifiable: false }],
  role: { title: 'Shift Manager', type: 'team_lead', isLeadershipApplicable: true, evidence: 'promoted to shift manager' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '15', unit: 'employees', context: 'managed per shift', isVerifiable: false }], estimatedPeopleReached: 15, tangibleOutcomes: ['Promoted to shift manager', 'Trained 8 new employees'] },
  commitment: { yearsActive: 2, hoursPerWeek: 25, weeksPerYear: 52, showsProgression: true, progressionArc: 'cashier → line cook → shift manager', sustainedThroughJunior: true },
  character: { primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignals: ['specific promotion timeline', 'training responsibilities'], paddingSignals: [] },
  categoryMatch: { category: 'work_employment', confidence: 'high' },
  overallSignalStrength: 'moderate',
}), makeFeatures({
  verbs: [
    { verb: 'managed', lemma: 'manage', context: 'managed 15 employees', isIndividualAction: true },
    { verb: 'trained', lemma: 'train', context: 'trained 8 new hires', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '15', numericValue: 15, unit: 'employees', hasContext: true, isMeaningful: true },
    { rawValue: '8', numericValue: 8, unit: 'new hires trained', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Managed 15 employees', 'Trained new hires'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Promoted to shift manager', outcome: 'Managed 15 employees, trained 8', hasExternalValidation: false }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['cashier to shift manager arc', 'youngest shift manager'], genericPhrases: [], passesThousandStudentTest: true },
}));
console.log(`  Shift manager: Tier ${workPromotion.tier.internalTier}, Activity ${workPromotion.activityScore.total}/10`);

const familyCaregiving = scoreActivity('Family: Primary Caregiver for Sibling', makeEvidence({
  scope: { level: 'local', confidence: 0.5, evidence: 'family caregiving' },
  recognitions: [],
  role: { title: 'Primary Caregiver', type: 'contributor', isLeadershipApplicable: false, evidence: 'cares for younger sibling' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: 1, tangibleOutcomes: ['Sibling maintained 3.8 GPA', 'Manages household schedule'] },
  commitment: { yearsActive: 4, hoursPerWeek: 30, weeksPerYear: 52, showsProgression: true, progressionArc: 'helping parent → primary caregiver', sustainedThroughJunior: true },
  character: { primaryTrait: 'empathy', communityBenefit: 'moderate', authenticitySignals: ['specific caregiving details', 'sibling GPA tracking'], paddingSignals: [] },
  categoryMatch: { category: 'work_employment', confidence: 'low' },
  overallSignalStrength: 'moderate',
}), makeFeatures({
  verbs: [
    { verb: 'managed', lemma: 'manage', context: 'managed household schedule', isIndividualAction: true },
    { verb: 'coordinated', lemma: 'coordinate', context: 'coordinated medical appointments', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '30', numericValue: 30, unit: 'hrs/week', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Managed household', 'Coordinated appointments'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Provided primary caregiving', outcome: 'Sibling maintained 3.8 GPA', hasExternalValidation: false }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['30hrs/week caregiving', 'manages medical appointments', 'sibling academic support'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: '30hrs/week primary caregiver while maintaining own academics' },
}));
console.log(`  Family caregiver: Tier ${familyCaregiving.tier.internalTier}, Activity ${familyCaregiving.activityScore.total}/10`);

assertGreater(workPromotion.activityScore.total, workCashier.activityScore.total, 'Shift manager > Basic cashier');

// ============================================================================
// CATEGORY 7: TECHNOLOGY & ENGINEERING (Robotics spectrum)
// ============================================================================

console.log('\n=== TECHNOLOGY & ENGINEERING ===');

const techRobotMember = scoreActivity('Tech: Robotics Team Member', makeEvidence({
  scope: { level: 'school', confidence: 0.6, evidence: 'school robotics' },
  recognitions: [],
  role: { title: 'Build Team Member', type: 'contributor', isLeadershipApplicable: true, evidence: 'build team member' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
  commitment: { yearsActive: 1, hoursPerWeek: 6, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: [] },
  categoryMatch: { category: 'technology_engineering', confidence: 'high' },
}), makeFeatures({
  verbs: [{ verb: 'assisted', lemma: 'assist', context: 'assisted with robot build', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: [], teamPhrases: ['team member', 'assisted'], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false },
  impact: { causalChains: [], unsupportedClaims: [], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['robotics team', 'assisted'], passesThousandStudentTest: false },
}));
console.log(`  Robot member: Tier ${techRobotMember.tier.internalTier}, Activity ${techRobotMember.activityScore.total}/10`);

const techFRCCaptain = scoreActivity('Tech: FRC Team Lead, Regional Winner', makeEvidence({
  scope: { level: 'regional', confidence: 0.7, evidence: 'FRC regional winner' },
  recognitions: [
    { name: 'FRC Regional Winner', level: 'regional', isVerifiable: true },
    { name: 'FRC Dean\'s List Semifinalist', level: 'regional', isVerifiable: true },
  ],
  role: { title: 'Team Captain & Lead Programmer', type: 'president_captain', isLeadershipApplicable: true, evidence: 'captain' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '25', unit: 'team members', context: 'managed', isVerifiable: false }], estimatedPeopleReached: 25, tangibleOutcomes: ['FRC Regional Winner', 'Dean\'s List Semifinalist'] },
  commitment: { yearsActive: 3, hoursPerWeek: 20, weeksPerYear: 40, showsProgression: true, progressionArc: 'build team → programming lead → captain', sustainedThroughJunior: true },
  character: { primaryTrait: 'innovation', communityBenefit: 'moderate', authenticitySignals: ['specific robot design', 'programming language'], paddingSignals: [] },
  categoryMatch: { category: 'technology_engineering', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'led', lemma: 'lead', context: 'led 25-member team', isIndividualAction: true },
    { verb: 'engineered', lemma: 'engineer', context: 'engineered autonomous navigation', isIndividualAction: true },
    { verb: 'designed', lemma: 'design', context: 'designed control system', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '25', numericValue: 25, unit: 'members', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Led team', 'Engineered', 'Designed'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Engineered autonomous system', outcome: 'FRC Regional Winner', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['autonomous navigation system', 'FRC Dean\'s List'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'FRC Regional Winner + Dean\'s List' },
}));
console.log(`  FRC captain: Tier ${techFRCCaptain.tier.internalTier}, Activity ${techFRCCaptain.activityScore.total}/10`);

const techOpenSource = scoreActivity('Tech: Major Open Source Contributor', makeEvidence({
  scope: { level: 'national', confidence: 0.7, evidence: '5K GitHub stars' },
  recognitions: [
    { name: 'GitHub trending developer', level: 'national', isVerifiable: true },
  ],
  role: { title: 'Lead Maintainer', type: 'founder', isLeadershipApplicable: false, evidence: 'sole maintainer' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '5K', unit: 'GitHub stars', context: 'on main project', isVerifiable: true }, { value: '200', unit: 'contributors', context: 'to the project', isVerifiable: true }], estimatedPeopleReached: 5000, tangibleOutcomes: ['5K stars', '200 contributors', 'Adopted by 3 companies'] },
  commitment: { yearsActive: 2, hoursPerWeek: 15, weeksPerYear: 52, showsProgression: true, progressionArc: 'side project → 100 stars → 5K stars → corporate adoption', sustainedThroughJunior: true },
  character: { primaryTrait: 'innovation', communityBenefit: 'significant', authenticitySignals: ['specific GitHub URL', 'verifiable star count', 'company adoption'], paddingSignals: [] },
  categoryMatch: { category: 'technology_engineering', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'architected', lemma: 'architect', context: 'architected the library', isIndividualAction: true },
    { verb: 'built', lemma: 'build', context: 'built developer tools', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '5K', numericValue: 5000, unit: 'GitHub stars', hasContext: true, isMeaningful: true },
    { rawValue: '200', numericValue: 200, unit: 'contributors', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Architected', 'Built', 'Maintained'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Architected open source library', outcome: '5K stars, 200 contributors, corporate adoption', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['5K GitHub stars', '200 contributors', 'corporate adoption'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: '5K-star open source project adopted by companies' },
}));
console.log(`  Open source: Tier ${techOpenSource.tier.internalTier}, Activity ${techOpenSource.activityScore.total}/10`);

assertGreater(techFRCCaptain.activityScore.total, techRobotMember.activityScore.total, 'FRC captain > Basic robot member');
assertGreater(techOpenSource.activityScore.total, techFRCCaptain.activityScore.total, 'Open source > FRC captain');

// ============================================================================
// CATEGORY 8: SOCIAL IMPACT & ACTIVISM
// ============================================================================

console.log('\n=== SOCIAL IMPACT & ACTIVISM ===');

const activismPetition = scoreActivity('Activism: Online Petition Organizer', makeEvidence({
  scope: { level: 'school', confidence: 0.5, evidence: 'school petition' },
  recognitions: [],
  role: { title: 'Organizer', type: 'contributor', isLeadershipApplicable: true, evidence: 'started petition' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '200', unit: 'signatures', context: 'online petition', isVerifiable: false }], estimatedPeopleReached: 200, tangibleOutcomes: ['Collected 200 signatures'] },
  commitment: { yearsActive: 0.5, hoursPerWeek: 3, weeksPerYear: 10, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'integrity', communityBenefit: 'moderate', authenticitySignals: ['specific cause'], paddingSignals: [] },
  categoryMatch: { category: 'community_service', confidence: 'medium' },
}), makeFeatures({
  verbs: [{ verb: 'organized', lemma: 'organize', context: 'organized online petition', isIndividualAction: true }],
  numbers: [{ rawValue: '200', numericValue: 200, unit: 'signatures', hasContext: false, isMeaningful: false, vanityReason: 'petition signatures without outcome' }],
  roleOwnership: { individualPhrases: ['Organized petition'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [], unsupportedClaims: ['raised awareness'], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: ['specific cause'], genericPhrases: ['raised awareness'], passesThousandStudentTest: false },
}));
console.log(`  Petition: Tier ${activismPetition.tier.internalTier}, Activity ${activismPetition.activityScore.total}/10`);

const activismPolicyChange = scoreActivity('Activism: Achieved State Policy Change', makeEvidence({
  scope: { level: 'state', confidence: 0.8, evidence: 'state legislature testimony' },
  recognitions: [
    { name: 'Testified Before State Legislature', level: 'state', isVerifiable: true },
    { name: 'CNN Youth Climate Award', level: 'national', isVerifiable: true },
  ],
  role: { title: 'Founder & Lead Organizer', type: 'founder', isLeadershipApplicable: true, evidence: 'founded climate coalition' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '3', unit: 'policies changed', context: 'state environmental regulations', isVerifiable: true }, { value: '5000', unit: 'march participants', context: 'largest youth climate march in state', isVerifiable: false }], estimatedPeopleReached: 5000, tangibleOutcomes: ['3 state policies changed', '5000-person march', 'State legislature testimony', '20-school coalition'] },
  commitment: { yearsActive: 3, hoursPerWeek: 15, weeksPerYear: 48, showsProgression: true, progressionArc: 'volunteer → organizer → coalition founder → policy advocate', sustainedThroughJunior: true },
  character: { primaryTrait: 'integrity', communityBenefit: 'significant', authenticitySignals: ['specific legislation names', 'verifiable testimony date', 'coalition school count'], paddingSignals: [] },
  categoryMatch: { category: 'community_service', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'founded', lemma: 'found', context: 'founded 20-school climate coalition', isIndividualAction: true },
    { verb: 'spearheaded', lemma: 'spearhead', context: 'spearheaded legislative campaign', isIndividualAction: true },
    { verb: 'negotiated', lemma: 'negotiate', context: 'negotiated with lawmakers', isIndividualAction: true },
  ],
  numbers: [
    { rawValue: '3', numericValue: 3, unit: 'policies changed', hasContext: true, isMeaningful: true },
    { rawValue: '5000', numericValue: 5000, unit: 'march participants', hasContext: true, isMeaningful: true },
    { rawValue: '20', numericValue: 20, unit: 'schools in coalition', hasContext: true, isMeaningful: true },
  ],
  roleOwnership: { individualPhrases: ['Founded coalition', 'Spearheaded campaign', 'Negotiated with lawmakers'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Founded coalition + testified at legislature', outcome: '3 state policies changed', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['testified before state legislature', '3 policies changed', '20-school coalition'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'Achieved 3 state policy changes as a teenager' },
}));
console.log(`  Policy change: Tier ${activismPolicyChange.tier.internalTier}, Activity ${activismPolicyChange.activityScore.total}/10`);

assertGreater(activismPolicyChange.activityScore.total, activismPetition.activityScore.total, 'Policy change > Petition');

// ============================================================================
// CATEGORY 9: DEBATE & SPEECH
// ============================================================================

console.log('\n=== DEBATE & SPEECH ===');

const debateNovice = scoreActivity('Debate: Novice Local Tournament', makeEvidence({
  scope: { level: 'local', confidence: 0.6, evidence: 'local tournament' },
  recognitions: [],
  role: { title: 'Debater', type: 'participant', isLeadershipApplicable: false, evidence: 'competed' },
  impact: { hasQuantifiedOutcomes: false, metrics: [], estimatedPeopleReached: null, tangibleOutcomes: [] },
  commitment: { yearsActive: 1, hoursPerWeek: 4, weeksPerYear: 30, showsProgression: false, progressionArc: null, sustainedThroughJunior: false },
  character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: [], paddingSignals: [] },
  categoryMatch: { category: 'debate_speech', confidence: 'high' },
}), makeFeatures({
  verbs: [{ verb: 'competed', lemma: 'compete', context: 'competed in debate', isIndividualAction: true }],
  numbers: [],
  roleOwnership: { individualPhrases: [], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: false },
  impact: { causalChains: [], unsupportedClaims: [], hasMeasurableOutcome: false },
  differentiation: { uniqueDetails: [], genericPhrases: ['competed in debate'], passesThousandStudentTest: false },
}));
console.log(`  Novice debate: Tier ${debateNovice.tier.internalTier}, Activity ${debateNovice.activityScore.total}/10`);

const debateTOC = scoreActivity('Debate: TOC Qualifier, State Champion', makeEvidence({
  scope: { level: 'national', confidence: 0.8, evidence: 'TOC qualifier' },
  recognitions: [
    { name: 'Tournament of Champions Qualifier', level: 'national', isVerifiable: true, selectivityContext: 'top 1% of LD debaters' },
    { name: 'State LD Champion', level: 'state', isVerifiable: true },
  ],
  role: { title: 'Varsity Debater', type: 'contributor', isLeadershipApplicable: false, evidence: 'individual competition' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '50+', unit: 'tournament rounds', context: 'won', isVerifiable: false }], estimatedPeopleReached: null, tangibleOutcomes: ['TOC qualification', 'State champion', '50+ round wins'] },
  commitment: { yearsActive: 4, hoursPerWeek: 15, weeksPerYear: 40, showsProgression: true, progressionArc: 'novice → JV → varsity → state champion → TOC', sustainedThroughJunior: true },
  character: { primaryTrait: 'curiosity', communityBenefit: 'self-focused', authenticitySignals: ['specific tournament names', 'win-loss record'], paddingSignals: [] },
  categoryMatch: { category: 'debate_speech', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'won', lemma: 'win', context: 'won state championship', isIndividualAction: true },
    { verb: 'qualified', lemma: 'qualify', context: 'qualified for TOC', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '50+', numericValue: 50, unit: 'rounds won', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Won state', 'Qualified for TOC'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Competed at highest level', outcome: 'State champion + TOC qualifier', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['TOC qualifier', 'State LD champion'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'TOC Qualifier + State Champion' },
}));
console.log(`  TOC qualifier: Tier ${debateTOC.tier.internalTier}, Activity ${debateTOC.activityScore.total}/10`);

assertGreater(debateTOC.activityScore.total, debateNovice.activityScore.total, 'TOC qualifier > Novice');

// ============================================================================
// CATEGORY 10: WRITING & JOURNALISM
// ============================================================================

console.log('\n=== WRITING & JOURNALISM ===');

const writingNewspaper = scoreActivity('Writing: School Newspaper Staff Writer', makeEvidence({
  scope: { level: 'school', confidence: 0.7, evidence: 'school newspaper' },
  recognitions: [],
  role: { title: 'Staff Writer', type: 'contributor', isLeadershipApplicable: true, evidence: 'staff writer' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '20', unit: 'articles', context: 'published', isVerifiable: false }], estimatedPeopleReached: 500, tangibleOutcomes: ['20 published articles'] },
  commitment: { yearsActive: 2, hoursPerWeek: 5, weeksPerYear: 36, showsProgression: true, progressionArc: 'staff writer → section editor', sustainedThroughJunior: false },
  character: { primaryTrait: 'curiosity', communityBenefit: 'moderate', authenticitySignals: ['specific article topics'], paddingSignals: [] },
  categoryMatch: { category: 'writing_journalism', confidence: 'high' },
}), makeFeatures({
  verbs: [
    { verb: 'wrote', lemma: 'write', context: 'wrote investigative pieces', isIndividualAction: true },
    { verb: 'published', lemma: 'publish', context: 'published 20 articles', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '20', numericValue: 20, unit: 'articles', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Wrote', 'Published'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Wrote investigative pieces', outcome: '20 published articles', hasExternalValidation: false }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['investigative journalism focus'], genericPhrases: ['school newspaper'], passesThousandStudentTest: false },
}));
console.log(`  Newspaper: Tier ${writingNewspaper.tier.internalTier}, Activity ${writingNewspaper.activityScore.total}/10`);

const writingScholastic = scoreActivity('Writing: Scholastic Gold Key + Published in Literary Journal', makeEvidence({
  scope: { level: 'national', confidence: 0.8, evidence: 'Scholastic Gold Key + national publication' },
  recognitions: [
    { name: 'Scholastic Art & Writing Gold Key', level: 'national', isVerifiable: true, selectivityContext: 'top 1% of 350K submissions' },
    { name: 'Published in nationally-distributed literary journal', level: 'national', isVerifiable: true },
  ],
  role: { title: 'Author', type: 'contributor', isLeadershipApplicable: false, evidence: 'individual writing' },
  impact: { hasQuantifiedOutcomes: true, metrics: [{ value: '350K', unit: 'applicants competed against', context: 'Scholastic competition pool', isVerifiable: true }], estimatedPeopleReached: 10000, tangibleOutcomes: ['Gold Key award', 'National publication', 'Short story anthology'] },
  commitment: { yearsActive: 4, hoursPerWeek: 10, weeksPerYear: 48, showsProgression: true, progressionArc: 'creative writing → regional awards → national Gold Key → published author', sustainedThroughJunior: true },
  character: { primaryTrait: 'creativity', communityBenefit: 'moderate', authenticitySignals: ['specific genre and themes', 'portfolio of 50+ works'], paddingSignals: [] },
  categoryMatch: { category: 'writing_journalism', confidence: 'high' },
  overallSignalStrength: 'strong',
}), makeFeatures({
  verbs: [
    { verb: 'published', lemma: 'publish', context: 'published in national journal', isIndividualAction: true },
    { verb: 'won', lemma: 'win', context: 'won Scholastic Gold Key', isIndividualAction: true },
  ],
  numbers: [{ rawValue: '350K', numericValue: 350000, unit: 'competition pool', hasContext: true, isMeaningful: true }],
  roleOwnership: { individualPhrases: ['Published', 'Won Gold Key'], teamPhrases: [], usesFirstPerson: false, firstPersonInstances: [], roleClearFromDescription: true },
  impact: { causalChains: [{ action: 'Wrote and submitted', outcome: 'Scholastic Gold Key (top 1% of 350K)', hasExternalValidation: true }], unsupportedClaims: [], hasMeasurableOutcome: true },
  differentiation: { uniqueDetails: ['Scholastic Gold Key', 'nationally published at 17', 'top 1% of 350K'], genericPhrases: [], passesThousandStudentTest: true, standoutElement: 'Scholastic Gold Key (top 1% of 350K)' },
}));
console.log(`  Scholastic Gold Key: Tier ${writingScholastic.tier.internalTier}, Activity ${writingScholastic.activityScore.total}/10`);

assertGreater(writingScholastic.activityScore.total, writingNewspaper.activityScore.total, 'Scholastic Gold Key > Newspaper');

// ============================================================================
// CROSS-CATEGORY FAIRNESS CHECKS
// ============================================================================

console.log('\n=== CROSS-CATEGORY FAIRNESS ===');

// Similar-tier activities across categories should be in similar ranges
const tier2Activities = [startupRegional, researchMentored, athleteVarsityCaptain, artsAllState, techFRCCaptain, writingNewspaper, workPromotion];
const tier2Scores = tier2Activities.map(a => a.activityScore.total);
const tier2Min = Math.min(...tier2Scores);
const tier2Max = Math.max(...tier2Scores);
console.log(`  Mid-tier activities range: ${tier2Min}-${tier2Max} (spread: ${(tier2Max - tier2Min).toFixed(1)})`);

// All mid-tier activities should be roughly in the same band (within ~4 points)
assert(tier2Max - tier2Min <= 4.0, `Cross-category mid-tier spread ≤ 4.0 (got ${(tier2Max - tier2Min).toFixed(1)})`);

// Elite activities should all be high
const eliteActivities = [startupNational, researchPublished, athleteD1Recruit, activismPolicyChange, debateTOC, writingScholastic, techOpenSource];
for (const a of eliteActivities) {
  assertRange(a.activityScore.total, 5.5, 10, `Elite ${a.name} scores 5.5+`);
}

// Low-tier activities should all be below elite
const lowActivities = [startupGarage, researchSchool, athleteJV, artsSchool, serviceOneTime, workCashier, techRobotMember, debateNovice];
for (const a of lowActivities) {
  assertRange(a.activityScore.total, 1, 5.5, `Low-tier ${a.name} scores below 5.5`);
}

// ============================================================================
// TIER RANGE VERIFICATION (every scored activity)
// ============================================================================

console.log('\n=== TIER RANGE VERIFICATION ===');

const allActivities: ScoredActivity[] = [
  startupGarage, startupLocal, startupRegional, startupNational,
  researchSchool, researchMentored, researchPublished,
  athleteJV, athleteVarsityCaptain, athleteD1Recruit,
  artsSchool, artsAllState,
  serviceOneTime, serviceFoundedNonprofit,
  workCashier, workPromotion, familyCaregiving,
  techRobotMember, techFRCCaptain, techOpenSource,
  activismPetition, activismPolicyChange,
  debateNovice, debateTOC,
  writingNewspaper, writingScholastic,
];

for (const a of allActivities) {
  const range = TIER_SCORE_RANGES[a.tier.internalTier];
  assertRange(
    a.activityScore.total,
    range.min,
    range.max,
    `${a.name}: total ${a.activityScore.total} within Tier ${a.tier.internalTier} range [${range.min}, ${range.max}]`
  );
}
console.log(`  All ${allActivities.length} activities verified within tier ranges`);

// ============================================================================
// DESCRIPTION SCORE VERIFICATION
// ============================================================================

console.log('\n=== DESCRIPTION SCORE SANITY ===');

for (const a of allActivities) {
  assertRange(a.descriptionScore.total, 1, 10, `${a.name} desc: ${a.descriptionScore.total}`);
  assert(a.descriptionScore.overallRationale.length > 0, `${a.name} desc has rationale`);
}
console.log(`  All ${allActivities.length} description scores in [1, 10] with rationales`);

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n========================================');
console.log(`Rule Scorer Calibration Tests: ${passed} passed, ${failed} failed`);
console.log(`Activities tested: ${allActivities.length} across 10 categories`);
console.log('========================================\n');

if (failed > 0) {
  console.log('\nFailed assertions:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  console.log('');
  process.exit(1);
}
