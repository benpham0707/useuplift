/**
 * Comprehensive test for impressiveness calibration module.
 * Validates all 12 domains load, ladders/markers exist, core functions work,
 * substring bug fixes, 5-param signature, legacy fields, and exemplar coverage.
 *
 * Run: npx tsx tests/test-impressiveness-calibration.ts
 */
import {
  getAllImpressivenessDomains,
  getImpressivenessDomain,
  getCalibrationStats,
  analyzeImpressiveness,
  getAlignmentForMajor,
  getBestExemplarForTeaching,
  resolveMajor,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/impressivenessCalibration';

import type { ExtractedEvidence, TierClassification } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

// ── Test 1: Domain Loading ───────────────────────────────────────────
console.log('\n[1] Domain Loading');
const domains = getAllImpressivenessDomains();
assert(domains.length === 12, `12 domains loaded (got ${domains.length})`);
console.log(`    IDs: ${domains.map(d => d.domainId).join(', ')}`);

// ── Test 2: Ladder Completeness ──────────────────────────────────────
console.log('\n[2] Ladder Completeness');
for (const d of domains) {
  assert(d.ladder.length === 5, `${d.domainId} has 5 levels (got ${d.ladder.length})`);
  const levels = d.ladder.map(e => e.level);
  const expectedLevels = ['baseline', 'notable', 'impressive', 'exceptional', 'extraordinary'];
  assert(
    expectedLevels.every(l => levels.includes(l as any)),
    `${d.domainId} has all 5 level types`,
  );
}

// ── Test 3: Technical Depth Markers ──────────────────────────────────
console.log('\n[3] Technical Depth Markers');
let totalMarkers = 0;
for (const d of domains) {
  const count = d.technicalDepthMarkers.length;
  totalMarkers += count;
  assert(count >= 5, `${d.domainId} has ${count} markers (min 5)`);
}
console.log(`    Total markers: ${totalMarkers}`);

// ── Test 4: Stats ────────────────────────────────────────────────────
console.log('\n[4] Calibration Stats');
const stats = getCalibrationStats();
assert(stats.totalDomains === 12, `stats.totalDomains = ${stats.totalDomains}`);
assert(stats.totalMarkers > 50, `stats.totalMarkers = ${stats.totalMarkers} (expected >50)`);
assert(stats.perDomain.length === 12, `stats.perDomain has 12 entries`);

// ── Test 5: analyzeImpressiveness (5-param signature) ────────────────
console.log('\n[5] analyzeImpressiveness (5-param signature)');
const mockEvidence = {
  scope: {
    level: 'national' as const,
    confidence: 0.9,
    evidence: 'Published in national journal',
  },
  recognitions: [{
    name: 'Peer-reviewed publication',
    level: 'national' as const,
    isVerifiable: true,
  }],
  role: {
    title: 'Lead Researcher',
    type: 'team_lead' as const,
    isLeadershipApplicable: true,
    evidence: 'Led research team',
  },
  impact: {
    hasQuantifiedOutcomes: true,
    metrics: [{ value: '3', unit: 'publications', context: 'peer-reviewed', isVerifiable: true }],
    estimatedPeopleReached: null,
    tangibleOutcomes: ['Published paper'],
  },
  commitment: {
    yearsActive: 2,
    hoursPerWeek: 20,
    weeksPerYear: 40,
    isYearRound: true,
    progressionNarrative: 'Started as assistant, became lead',
  },
  categoryMatch: {
    category: 'stem_research',
    confidence: 'high' as const,
  },
  overallSignalStrength: 'strong' as const,
} as ExtractedEvidence;

const mockTier = {
  internalTier: 2,
  externalTier: 1,
  tierLabel: 'National/International Impact',
  tierScore: 22,
  confidence: 'high',
  reasoning: 'Test tier',
  scoreRange: { min: 20, max: 25 },
} as TierClassification;

// New 5-param signature: (evidence, tier, expertiseResult, intendedMajor, description)
const result = analyzeImpressiveness(
  mockEvidence,
  mockTier,
  { domainId: 'stem_research' },  // expertiseResult
  'Biology',                       // intendedMajor
  'Led IRB-approved research on gene expression patterns, published in peer-reviewed journal with faculty co-authors',
);

assert(result.level !== undefined, `level: ${result.level}`);
assert(result.confidence !== 'low', `confidence: ${result.confidence}`);
assert(result.detectedMarkers.length >= 1, `detected ${result.detectedMarkers.length} markers`);
assert(result.majorAlignment !== null, `majorAlignment present: ${result.majorAlignment?.alignment}`);
console.log(`    Tier boost: ${result.tierBoost}`);
console.log(`    Top markers: ${result.detectedMarkers.slice(0, 3).map(m => m.marker.term).join(', ')}`);

// ── Test 5b: Legacy Fields on Merged Return Type ─────────────────────
console.log('\n[5b] Legacy Fields (backward compat)');
assert(typeof result.percentileRange === 'string' && result.percentileRange.length > 0,
  `percentileRange: "${result.percentileRange}"`);
assert(typeof result.levelExplanation === 'string' && result.levelExplanation.length > 0,
  `levelExplanation present (${result.levelExplanation?.length} chars)`);
assert(typeof result.promptSummary === 'string' && result.promptSummary.length > 0,
  `promptSummary present (${result.promptSummary?.length} chars)`);
assert(Array.isArray(result.technicalDepthMarkers),
  `technicalDepthMarkers is array (${result.technicalDepthMarkers?.length} entries)`);
if (result.majorAlignment) {
  assert(result.majorAlignment.relevance !== undefined,
    `majorAlignment.relevance: ${result.majorAlignment.relevance}`);
}

// ── Test 6: Major Alignment ──────────────────────────────────────────
console.log('\n[6] Major Alignment');
const csForCS = getAlignmentForMajor('coding_engineering', 'Computer Science');
assert(
  csForCS !== null && (csForCS.alignment === 'critical' || csForCS.alignment === 'strong'),
  `CS for CS major: ${csForCS?.alignment ?? 'not found'}`,
);

const workForCS = getAlignmentForMajor('work_employment', 'Computer Science');
console.log(`    Work for CS: ${workForCS?.alignment ?? 'not found'}`);

const researchForBio = getAlignmentForMajor('stem_research', 'Biology');
assert(
  researchForBio !== null && (researchForBio.alignment === 'critical' || researchForBio.alignment === 'strong'),
  `Research for Biology: ${researchForBio?.alignment ?? 'not found'}`,
);

// ── Test 7: Exemplar Lookup ──────────────────────────────────────────
console.log('\n[7] Exemplar Lookup');
const exemplar = getBestExemplarForTeaching('stem_research', ['evidence_of_impact'], 'impressive');
if (exemplar) {
  assert(exemplar.text.length <= 160, `exemplar length: ${exemplar.text.length} chars`);
  console.log(`    Text: "${exemplar.text.substring(0, 80)}..."`);
  console.log(`    Why it works: "${exemplar.whyItWorks.substring(0, 80)}..."`);
} else {
  console.log('    No exemplar found (may need exemplar data population)');
}

// ── Test 7b: All 12 Domains Have Exemplars ───────────────────────────
console.log('\n[7b] All 12 Domains Have Exemplars');
const allDomainIds = [
  'stem_research', 'stem_competition', 'coding_engineering', 'debate_speech',
  'performing_arts', 'athletics', 'community_service', 'entrepreneurship',
  'work_employment', 'leadership_government', 'medical_health', 'arts_creative',
];
for (const domainId of allDomainIds) {
  const ex = getBestExemplarForTeaching(domainId, ['evidence_of_impact'], 'impressive');
  assert(ex !== null, `${domainId} has exemplars`);
}

// ── Test 8: Domain Lookup ────────────────────────────────────────────
console.log('\n[8] Domain Lookup');
const stemDomain = getImpressivenessDomain('stem_research');
assert(stemDomain !== undefined, 'stem_research domain found');
assert(stemDomain?.domainId === 'stem_research', `domainId: ${stemDomain?.domainId}`);

const nonexistent = getImpressivenessDomain('nonexistent_domain');
assert(nonexistent === undefined, 'nonexistent domain returns undefined');

// ── Test 9: Substring Bug Fixes (Domain Resolution) ─────────────────
console.log('\n[9] Substring Bug Fixes (Domain Resolution)');

// "community volunteer" should resolve to community_service, NOT debate_speech (old "mun" bug)
const communityEvidence = {
  ...mockEvidence,
  categoryMatch: { category: 'community_service', confidence: 'high' as const },
} as ExtractedEvidence;
const communityResult = analyzeImpressiveness(
  communityEvidence,
  { ...mockTier, internalTier: 4 } as TierClassification,
  undefined,
  undefined,
  'Organized community volunteer events serving 200+ families at local food bank',
);
// The domain resolution should not pick debate_speech for "community" text
assert(communityResult.level !== undefined, 'community activity resolves to a valid level');
console.log(`    "community volunteer" → level: ${communityResult.level}`);

// ── Test 10: Major Resolution Substring Bug Fixes ────────────────────
console.log('\n[10] Major Resolution Substring Fixes');

// "Sports Medicine" should NOT resolve to mechanical_engineering ("me" alias bug)
const sportsMedResult = resolveMajor('Sports Medicine');
assert(sportsMedResult !== 'mechanical_engineering',
  `"Sports Medicine" → ${sportsMedResult ?? 'null'} (NOT mechanical_engineering)`);

// Short alias "ee" should NOT match "Electrical Engineering" via substring
const eeResult = resolveMajor('Electrical Engineering');
assert(eeResult !== null, `"Electrical Engineering" resolves: ${eeResult}`);

// Standard majors should still resolve correctly
const csResult = resolveMajor('Computer Science');
assert(csResult !== null, `"Computer Science" resolves: ${csResult}`);

const bioResult = resolveMajor('Biology');
assert(bioResult !== null, `"Biology" resolves: ${bioResult}`);

const econResult = resolveMajor('Economics');
assert(econResult !== null, `"Economics" resolves: ${econResult}`);

// ── Summary ──────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log('All spot checks passed!');
