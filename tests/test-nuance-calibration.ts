/**
 * Nuance Calibration Tests — ~$0.10-0.15 (Sonnet calls for select test cases)
 *
 * Tests the full hybrid pipeline:
 *   ExtractedEvidence → TierClassification → RuleScorer → Retrieval → Calibration
 *
 * Verifies:
 * - Adjusted scores stay within tier bounds (structural guarantee preserved)
 * - Calibration produces adjustments for activities with clear nuance gaps
 * - Graceful degradation when no calibration data matches
 * - Component adjustments respect magnitude caps
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { calibrateActivity } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/nuanceCalibrationService';
import { classifyTier } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/tierClassifier';
import { activityRuleScorerService } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/activityRuleScorer';
import type { ExtractedEvidence, TierClassification, InternalTier } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';
import { TIER_SCORE_RANGES } from '../src/services/portfolioStrategy/services/activityWorkshop/scoring/types';

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

// ============================================================================
// TEST 1: TIER BOUNDS PRESERVED (no LLM — uses graceful degradation)
// ============================================================================

async function testTierBoundsPreserved(): Promise<void> {
  console.log('\n=== Test: Tier Bounds Preserved (graceful degradation, $0.00) ===');

  // Unknown activity → no calibration data → should skip LLM call
  const evidence = makeEvidence({
    categoryMatch: { category: 'unknown_category', confidence: 'low' },
    scope: { level: 'school', confidence: 0.3, evidence: 'vague' },
  });

  const tier = classifyTier(evidence);
  const ruleScore = activityRuleScorerService.scoreActivity(evidence, tier);

  const result = await calibrateActivity(
    evidence,
    tier,
    ruleScore,
    { title: 'Obscure Hobby Club', description: 'Did various things at the club' }
  );

  assert(!result.calibrationApplied, 'Calibration should be skipped for unknown category');
  assert(result.adjustments.length === 0, 'No adjustments for uncalibrated result');
  assert(result.adjustedActivityTotal === ruleScore.total, 'Total should equal rule scorer output');
  assert(result.tierAgreement === 'confirmed', 'Tier should be confirmed when no calibration');
}

// ============================================================================
// TEST 2: MEDICAL RESEARCH CALIBRATION (Sonnet call ~$0.02)
// ============================================================================

async function testMedicalResearchCalibration(): Promise<void> {
  console.log('\n=== Test: Medical Research Calibration (Sonnet, ~$0.02) ===');

  const evidence = makeEvidence({
    categoryMatch: { category: 'medical_health', confidence: 'high' },
    scope: { level: 'regional', confidence: 0.7, evidence: 'hospital research program' },
    recognitions: [
      { name: 'Hospital Research Award', level: 'regional', isVerifiable: true },
    ],
    role: { title: 'Research Assistant', type: 'contributor', isLeadershipApplicable: true, evidence: 'research assistant in clinical lab' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '150', unit: 'patient charts reviewed', context: 'chart review study', isVerifiable: true }],
      estimatedPeopleReached: 150,
      tangibleOutcomes: ['Completed data analysis for published study'],
    },
    commitment: { yearsActive: 2, hoursPerWeek: 10, weeksPerYear: 40, showsProgression: true, progressionArc: 'volunteer → research assistant → co-author', sustainedThroughJunior: true },
    character: { primaryTrait: 'curiosity', communityBenefit: 'moderate', authenticitySignals: ['specific protocol knowledge'], paddingSignals: [] },
    overallSignalStrength: 'strong',
  });

  const tier = classifyTier(evidence);
  const ruleScore = activityRuleScorerService.scoreActivity(evidence, tier);

  console.log(`  Rule scorer: total=${ruleScore.total}, tier=${tier.internalTier}`);

  const result = await calibrateActivity(
    evidence,
    tier,
    ruleScore,
    {
      title: 'Clinical Research Assistant',
      description: 'Conducted chart review for 150 patients in cardiology department, contributed to published IRB-approved study on atrial fibrillation outcomes',
      position: 'Research Assistant',
    }
  );

  console.log(`  Calibrated: total=${result.adjustedActivityTotal}, applied=${result.calibrationApplied}`);
  if (result.adjustments.length > 0) {
    for (const adj of result.adjustments) {
      console.log(`    ${adj.component}: ${adj.originalScore} → ${adj.adjustedScore} (${adj.reason})`);
    }
  }

  // Verify tier bounds
  const tierRange = TIER_SCORE_RANGES[tier.internalTier];
  assert(
    result.adjustedActivityTotal >= tierRange.min && result.adjustedActivityTotal <= tierRange.max,
    `Adjusted total ${result.adjustedActivityTotal} should be in range [${tierRange.min}-${tierRange.max}]`
  );

  // Verify adjustment magnitudes
  for (const adj of result.adjustments) {
    assert(
      Math.abs(adj.adjustedScore - adj.originalScore) <= 1.5,
      `${adj.component} adjustment magnitude ${Math.abs(adj.adjustedScore - adj.originalScore)} should be <= 1.5`
    );
  }
}

// ============================================================================
// TEST 3: STEM COMPETITION CALIBRATION (Sonnet call ~$0.02)
// ============================================================================

async function testStemCompetitionCalibration(): Promise<void> {
  console.log('\n=== Test: STEM Competition Calibration (Sonnet, ~$0.02) ===');

  const evidence = makeEvidence({
    categoryMatch: { category: 'stem_competition', confidence: 'high' },
    scope: { level: 'national', confidence: 0.9, evidence: 'AIME qualifier' },
    recognitions: [
      { name: 'AIME Qualifier', level: 'national', isVerifiable: true, selectivityContext: 'Top 2% of 300,000+ AMC takers' },
    ],
    role: { title: 'Math Team Captain', type: 'president_captain', isLeadershipApplicable: true, evidence: 'captain of math team' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '10', unit: 'AIME score', context: 'score of 10 on AIME', isVerifiable: true }],
      estimatedPeopleReached: 30,
      tangibleOutcomes: ['Led team to state competition'],
    },
    commitment: { yearsActive: 3, hoursPerWeek: 8, weeksPerYear: 40, showsProgression: true, progressionArc: 'member → competitor → captain', sustainedThroughJunior: true },
    character: { primaryTrait: 'curiosity', communityBenefit: 'moderate', authenticitySignals: ['specific AIME score'], paddingSignals: [] },
    overallSignalStrength: 'strong',
  });

  const tier = classifyTier(evidence);
  const ruleScore = activityRuleScorerService.scoreActivity(evidence, tier);

  console.log(`  Rule scorer: total=${ruleScore.total}, tier=${tier.internalTier}`);

  const result = await calibrateActivity(
    evidence,
    tier,
    ruleScore,
    {
      title: 'Math Team Captain & AIME Qualifier',
      description: 'Led school math team as captain; qualified for AIME with score of 10, top 2% of 300K+ AMC takers',
      position: 'Captain',
    }
  );

  console.log(`  Calibrated: total=${result.adjustedActivityTotal}, applied=${result.calibrationApplied}`);
  if (result.adjustments.length > 0) {
    for (const adj of result.adjustments) {
      console.log(`    ${adj.component}: ${adj.originalScore} → ${adj.adjustedScore} (${adj.reason})`);
    }
  }

  // Verify tier bounds
  const tierRange = TIER_SCORE_RANGES[tier.internalTier];
  assert(
    result.adjustedActivityTotal >= tierRange.min && result.adjustedActivityTotal <= tierRange.max,
    `Adjusted total ${result.adjustedActivityTotal} should be in range [${tierRange.min}-${tierRange.max}]`
  );

  // Verify calibration was applied (has matching data)
  assert(
    result.calibrationApplied,
    'Calibration should be applied for well-matched STEM competition'
  );
}

// ============================================================================
// TEST 4: COMMUNITY SERVICE — LOW-IMPACT (Sonnet call ~$0.02)
// ============================================================================

async function testCommunityServiceCalibration(): Promise<void> {
  console.log('\n=== Test: Community Service Calibration (Sonnet, ~$0.02) ===');

  const evidence = makeEvidence({
    categoryMatch: { category: 'community_service', confidence: 'high' },
    scope: { level: 'local', confidence: 0.6, evidence: 'food bank' },
    recognitions: [],
    role: { title: 'Volunteer', type: 'contributor', isLeadershipApplicable: true, evidence: 'regular volunteer' },
    impact: {
      hasQuantifiedOutcomes: true,
      metrics: [{ value: '200', unit: 'hours', context: 'volunteer hours', isVerifiable: false }],
      estimatedPeopleReached: 100,
      tangibleOutcomes: ['Served meals weekly'],
    },
    commitment: { yearsActive: 2, hoursPerWeek: 4, weeksPerYear: 40, showsProgression: false, progressionArc: null, sustainedThroughJunior: true },
    character: { primaryTrait: 'service', communityBenefit: 'moderate', authenticitySignals: ['weekly schedule'], paddingSignals: [] },
    overallSignalStrength: 'moderate',
  });

  const tier = classifyTier(evidence);
  const ruleScore = activityRuleScorerService.scoreActivity(evidence, tier);

  console.log(`  Rule scorer: total=${ruleScore.total}, tier=${tier.internalTier}`);

  const result = await calibrateActivity(
    evidence,
    tier,
    ruleScore,
    {
      title: 'Food Bank Volunteer',
      description: 'Volunteered weekly at community food bank for 2 years, 200+ hours, served meals to 100+ families',
      position: 'Volunteer',
    }
  );

  console.log(`  Calibrated: total=${result.adjustedActivityTotal}, applied=${result.calibrationApplied}`);
  if (result.adjustments.length > 0) {
    for (const adj of result.adjustments) {
      console.log(`    ${adj.component}: ${adj.originalScore} → ${adj.adjustedScore} (${adj.reason})`);
    }
  }

  // Verify tier bounds
  const tierRange = TIER_SCORE_RANGES[tier.internalTier];
  assert(
    result.adjustedActivityTotal >= tierRange.min && result.adjustedActivityTotal <= tierRange.max,
    `Adjusted total ${result.adjustedActivityTotal} should be in range [${tierRange.min}-${tierRange.max}]`
  );
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function main(): Promise<void> {
  console.log('=== Nuance Calibration Tests ===');
  console.log('Estimated cost: ~$0.08-0.10\n');

  await testTierBoundsPreserved();
  await testMedicalResearchCalibration();
  await testStemCompetitionCalibration();
  await testCommunityServiceCalibration();

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

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
