/**
 * Feature Extractor Test — Layer 1 Cognitive Decomposition
 *
 * Tests that Haiku correctly extracts structured features from activity
 * descriptions WITHOUT making judgments or scores.
 *
 * Uses the same 5 test activities from the E2E pipeline output.
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-feature-extractor.ts
 */

import dotenv from 'dotenv';
// Load env BEFORE any service imports so claude.ts picks up the key
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
// Verify key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found in .env files');
  process.exit(1);
}

import {
  featureExtractorService,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/featureExtractor';
import type {
  BatchFeatureExtractionInput,
  ActivityFeatureExtraction,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring/featureTypes';

// ============================================================================
// TEST DATA — Same activities as E2E pipeline
// ============================================================================

const TEST_ACTIVITIES: BatchFeatureExtractionInput = {
  activities: [
    {
      id: 'cs-club',
      title: 'Computer Science Club Founder',
      description: 'Founded school\'s first CS club; taught 25 students basic Python and web dev fundamentals; organized first multi-school hackathon attracting 60 participants from 4 schools',
      role: 'Founder & President',
      category: 'school_activity',
      hoursPerWeek: 5,
      weeksPerYear: 36,
      yearsInvolved: 2,
      gradeLevels: [10, 11],
      achievements: [
        { title: 'Founded first CS club at school' },
        { title: 'Organized multi-school hackathon', level: 'regional' },
      ],
    },
    {
      id: 'research',
      title: 'Machine Learning Research',
      description: 'Worked with professor on NLP research analyzing rural healthcare access patterns. Built data pipeline processing 50,000 patient records. Co-authored paper submitted to undergraduate journal.',
      role: 'Research Assistant',
      category: 'project',
      hoursPerWeek: 10,
      weeksPerYear: 40,
      yearsInvolved: 1,
      gradeLevels: [11],
      achievements: [
        { title: 'Co-authored research paper', level: 'regional' },
      ],
    },
    {
      id: 'grocery',
      title: 'Grocery Store Associate',
      description: 'Promoted to shift lead after 6 months. Train new employees. Work 20 hours per week to help support family.',
      role: 'Stock Clerk/Cashier → Shift Lead',
      category: 'work',
      hoursPerWeek: 20,
      weeksPerYear: 52,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      isPaid: true,
    },
    {
      id: 'farm',
      title: 'Family Farm Work',
      description: 'Help run 200-acre family farm during growing season. Drive equipment, manage irrigation systems, keep records of harvest yields.',
      role: 'Helper',
      category: 'work',
      hoursPerWeek: 15,
      weeksPerYear: 24,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
    },
    {
      id: 'tutor',
      title: 'Math & Science Tutor',
      description: 'Lead tutor at county library program. Help with math and science homework after school. About 8 students come regularly. Received Volunteer of the Quarter award.',
      role: 'Lead Tutor',
      category: 'volunteer',
      hoursPerWeek: 3,
      weeksPerYear: 36,
      yearsInvolved: 2,
      gradeLevels: [10, 11],
      achievements: [
        { title: 'Volunteer of the Quarter', level: 'local' },
      ],
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    gradeLevel: 12,
    firstGen: true,
    lowIncome: true,
    rural: true,
    workFamilyObligations: true,
  },
  charLimit: 150,
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${message}`);
  } else {
    failCount++;
    console.log(`  ✗ FAIL: ${message}`);
  }
}

function assertExists(value: unknown, message: string): void {
  assert(value !== null && value !== undefined, message);
}

function assertNonEmpty(arr: unknown[], message: string): void {
  assert(Array.isArray(arr) && arr.length > 0, message);
}

// ============================================================================
// TEST: EXTRACTION STRUCTURE
// ============================================================================

function testExtractionStructure(extraction: ActivityFeatureExtraction): void {
  console.log(`\n── Testing structure for: ${extraction.activityTitle} ──`);

  // Description features exist
  assertExists(extraction.descriptionFeatures, 'descriptionFeatures exists');
  assertExists(extraction.descriptionFeatures.verbs, 'verbs array exists');
  assertExists(extraction.descriptionFeatures.numbers, 'numbers array exists');
  assertExists(extraction.descriptionFeatures.roleOwnership, 'roleOwnership exists');
  assertExists(extraction.descriptionFeatures.impact, 'impact exists');
  assertExists(extraction.descriptionFeatures.differentiation, 'differentiation exists');
  assertExists(extraction.descriptionFeatures.characterEfficiency, 'characterEfficiency exists');
  assertExists(extraction.descriptionFeatures.authenticity, 'authenticity exists');
  assertExists(extraction.descriptionFeatures.detectedActivityType, 'detectedActivityType exists');

  // Activity evidence exists
  assertExists(extraction.activityEvidence, 'activityEvidence exists');
  assertExists(extraction.activityEvidence.scope, 'scope exists');
  assertExists(extraction.activityEvidence.recognitions, 'recognitions array exists');
  assertExists(extraction.activityEvidence.role, 'role exists');
  assertExists(extraction.activityEvidence.impact, 'impact exists');
  assertExists(extraction.activityEvidence.commitment, 'commitment exists');
  assertExists(extraction.activityEvidence.character, 'character exists');
  assertExists(extraction.activityEvidence.categoryMatch, 'categoryMatch exists');
  assertExists(extraction.activityEvidence.overallSignalStrength, 'overallSignalStrength exists');

  // Metadata
  assertExists(extraction.metadata, 'metadata exists');
  assert(extraction.metadata.tokensUsed.input > 0, 'tokens used > 0');
  assert(extraction.metadata.cost > 0, 'cost > 0');
}

// ============================================================================
// TEST: CS CLUB EXTRACTION QUALITY
// ============================================================================

function testCSClubExtraction(extraction: ActivityFeatureExtraction): void {
  console.log(`\n── Testing CS Club extraction quality ──`);
  const desc = extraction.descriptionFeatures;
  const ev = extraction.activityEvidence;

  // Should extract key verbs: Founded, taught, organized
  assertNonEmpty(desc.verbs, 'verbs extracted');
  const verbLemmas = desc.verbs.map(v => v.lemma.toLowerCase());
  assert(verbLemmas.some(v => v.includes('found')), 'extracted verb "found/founded"');
  assert(verbLemmas.some(v => v.includes('taught') || v.includes('teach')), 'extracted verb "teach/taught"');
  assert(verbLemmas.some(v => v.includes('organiz')), 'extracted verb "organize/organized"');

  // Should extract numbers: 25, 60, 4
  assertNonEmpty(desc.numbers, 'numbers extracted');
  const numValues = desc.numbers.map(n => n.numericValue);
  assert(numValues.includes(25), 'extracted number 25 (students)');
  assert(numValues.includes(60), 'extracted number 60 (participants)');

  // Role ownership should show individual signals
  assertNonEmpty(desc.roleOwnership.individualPhrases, 'individual phrases found');

  // Should detect as founder role
  assert(ev.role.type === 'founder', `role type is founder (got: ${ev.role.type})`);

  // Should detect school-level scope (founded at school, hackathon was multi-school)
  assert(
    ev.scope.level === 'school' || ev.scope.level === 'local' || ev.scope.level === 'regional',
    `scope is school/local/regional (got: ${ev.scope.level})`
  );

  // Activity type should be CS-related (coding, competition, or leadership — hackathon is borderline)
  assert(
    desc.detectedActivityType === 'coding_engineering' ||
    desc.detectedActivityType === 'leadership_government' ||
    desc.detectedActivityType === 'stem_competition' ||
    desc.detectedActivityType === 'academic',
    `activity type detected correctly (got: ${desc.detectedActivityType})`
  );

  // Differentiation: "first CS club at school" should be flagged as unique
  assertNonEmpty(desc.differentiation.uniqueDetails, 'unique details found');
}

// ============================================================================
// TEST: TUTOR EXTRACTION (WEAK DESCRIPTION)
// ============================================================================

function testTutorExtraction(extraction: ActivityFeatureExtraction): void {
  console.log(`\n── Testing Tutor extraction (weak description) ──`);
  const desc = extraction.descriptionFeatures;
  const ev = extraction.activityEvidence;

  // Should extract verbs: Help, come (weak verbs)
  assertNonEmpty(desc.verbs, 'verbs extracted');

  // Should extract number: 8 (students)
  assertNonEmpty(desc.numbers, 'numbers extracted');

  // Should detect generic phrases ("Help with math and science homework")
  assertNonEmpty(desc.differentiation.genericPhrases, 'generic phrases detected');

  // Should NOT pass thousand-student test
  assert(!desc.differentiation.passesThousandStudentTest, 'fails thousand-student test');

  // Impact should show unsupported or weak claims
  assert(!desc.impact.hasMeasurableOutcome, 'no measurable outcome detected');

  // Role should detect the recognition (Volunteer of the Quarter)
  assertNonEmpty(ev.recognitions, 'recognitions found');
  assert(
    ev.recognitions.some(r => r.name.toLowerCase().includes('volunteer')),
    'Volunteer of the Quarter recognized'
  );
  assert(
    ev.recognitions.some(r => r.level === 'local' || r.level === 'school'),
    'recognition level is local/school'
  );
}

// ============================================================================
// TEST: GROCERY EXTRACTION (WORK WITH FAMILY CONTEXT)
// ============================================================================

function testGroceryExtraction(extraction: ActivityFeatureExtraction): void {
  console.log(`\n── Testing Grocery extraction ──`);
  const desc = extraction.descriptionFeatures;
  const ev = extraction.activityEvidence;

  // Should detect progression arc
  assert(ev.commitment.showsProgression, 'progression detected');

  // Commitment from metadata
  assert(ev.commitment.yearsActive >= 3, `years >= 3 (got: ${ev.commitment.yearsActive})`);
  assert(ev.commitment.hoursPerWeek >= 20, `hours >= 20 (got: ${ev.commitment.hoursPerWeek})`);

  // Should detect work_employment type
  assert(desc.detectedActivityType === 'work_employment', `type is work_employment (got: ${desc.detectedActivityType})`);

  // Should detect character: resilience or discipline
  assert(
    ev.character.primaryTrait === 'resilience' || ev.character.primaryTrait === 'discipline',
    `character trait is resilience/discipline (got: ${ev.character.primaryTrait})`
  );

  // Numbers: 6 (months), 20 (hours)
  assertNonEmpty(desc.numbers, 'numbers extracted');
}

// ============================================================================
// TEST: CROSS-ACTIVITY CONSISTENCY
// ============================================================================

function testCrossActivityConsistency(extractions: ActivityFeatureExtraction[]): void {
  console.log(`\n── Testing cross-activity consistency ──`);

  // All activities should have extractions
  assert(extractions.length === 5, `all 5 activities extracted (got: ${extractions.length})`);

  // All should have unique activity IDs
  const ids = extractions.map(e => e.activityId);
  assert(new Set(ids).size === ids.length, 'all activity IDs are unique');

  // CS Club should have more verbs than Tutor (richer description)
  const csClub = extractions.find(e => e.activityId === 'cs-club')!;
  const tutor = extractions.find(e => e.activityId === 'tutor')!;
  assert(
    csClub.descriptionFeatures.verbs.length >= tutor.descriptionFeatures.verbs.length,
    `CS Club has >= verbs than Tutor (${csClub.descriptionFeatures.verbs.length} vs ${tutor.descriptionFeatures.verbs.length})`
  );

  // Research should have highest scope or recognitions
  const research = extractions.find(e => e.activityId === 'research')!;
  assert(
    research.activityEvidence.recognitions.length > 0,
    'Research has recognitions'
  );

  // Farm should detect family_responsibility or work_employment
  const farm = extractions.find(e => e.activityId === 'farm')!;
  assert(
    farm.descriptionFeatures.detectedActivityType === 'family_responsibility' ||
    farm.descriptionFeatures.detectedActivityType === 'work_employment',
    `Farm detected as family/work (got: ${farm.descriptionFeatures.detectedActivityType})`
  );
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FEATURE EXTRACTOR TEST — Layer 1 Cognitive Decomposition');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Activities: ${TEST_ACTIVITIES.activities.length}`);
  console.log(`Student: First-gen, rural, CS major`);
  console.log('');

  const startTime = Date.now();

  // Run batch extraction
  console.log('Running batch feature extraction (parallel Haiku calls)...\n');
  const result = await featureExtractorService.extractBatch(TEST_ACTIVITIES);

  const duration = Date.now() - startTime;
  console.log(`\n── Extraction Results ──`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Success: ${result.extractions.length}/${TEST_ACTIVITIES.activities.length}`);
  console.log(`  Failures: ${result.failures.length}`);
  console.log(`  Total Cost: $${result.totalCost.toFixed(4)}`);
  console.log(`  Tokens: ${result.totalTokens.input} in / ${result.totalTokens.output} out`);

  if (result.failures.length > 0) {
    console.log(`\n  FAILURES:`);
    for (const f of result.failures) {
      console.log(`    ${f.activityId}: ${f.error}`);
    }
  }

  // Run tests
  for (const extraction of result.extractions) {
    testExtractionStructure(extraction);
  }

  const csClub = result.extractions.find(e => e.activityId === 'cs-club');
  if (csClub) testCSClubExtraction(csClub);

  const tutor = result.extractions.find(e => e.activityId === 'tutor');
  if (tutor) testTutorExtraction(tutor);

  const grocery = result.extractions.find(e => e.activityId === 'grocery');
  if (grocery) testGroceryExtraction(grocery);

  testCrossActivityConsistency(result.extractions);

  // Print detailed extraction for manual inspection
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  DETAILED EXTRACTION OUTPUT (for manual inspection)');
  console.log('═══════════════════════════════════════════════════════════════');

  for (const extraction of result.extractions) {
    console.log(`\n┌─ ${extraction.activityTitle} (${extraction.activityId}) ─────────`);
    const desc = extraction.descriptionFeatures;
    const ev = extraction.activityEvidence;

    console.log(`│ Activity Type: ${desc.detectedActivityType}`);
    console.log(`│ Verbs: ${desc.verbs.map(v => `${v.verb}${v.isIndividualAction ? '(I)' : '(T)'}`).join(', ')}`);
    console.log(`│ Numbers: ${desc.numbers.map(n => `${n.rawValue} ${n.unit}${n.isMeaningful ? '' : ' [VANITY]'}`).join(', ') || '(none)'}`);
    console.log(`│ Role Ownership: ${desc.roleOwnership.individualPhrases.length} individual / ${desc.roleOwnership.teamPhrases.length} team phrases`);
    console.log(`│ Impact: ${desc.impact.causalChains.length} causal chains, measurable=${desc.impact.hasMeasurableOutcome}`);
    console.log(`│ Differentiation: ${desc.differentiation.uniqueDetails.length} unique / ${desc.differentiation.genericPhrases.length} generic`);
    console.log(`│   Passes 1000-student test: ${desc.differentiation.passesThousandStudentTest}`);
    if (desc.differentiation.standoutElement) {
      console.log(`│   Standout: ${desc.differentiation.standoutElement}`);
    }
    console.log(`│ Char Efficiency: ${desc.characterEfficiency.totalChars}/${desc.characterEfficiency.charLimit} (${(desc.characterEfficiency.utilizationRate * 100).toFixed(0)}%), fragments=${desc.characterEfficiency.usesFragments}`);
    if (desc.characterEfficiency.wastedPatterns.length > 0) {
      console.log(`│   Wasted: ${desc.characterEfficiency.wastedPatterns.map(w => `${w.pattern}("${w.example}")`).join(', ')}`);
    }
    console.log(`│ Authenticity: ${desc.authenticity.overclaiming.length} overclaiming, AI=${desc.authenticity.readsAsAIGenerated}`);
    console.log(`│`);
    console.log(`│ Scope: ${ev.scope.level} (conf: ${ev.scope.confidence})`);
    console.log(`│ Role: ${ev.role.type} ("${ev.role.title}")`);
    console.log(`│ Recognitions: ${ev.recognitions.map(r => `${r.name} [${r.level}${r.isVerifiable ? ', verified' : ''}]`).join('; ') || '(none)'}`);
    console.log(`│ Impact: people=${ev.impact.estimatedPeopleReached ?? 'unknown'}, outcomes=${ev.impact.tangibleOutcomes.length}`);
    console.log(`│ Commitment: ${ev.commitment.yearsActive}yr, ${ev.commitment.hoursPerWeek}hr/wk, progression=${ev.commitment.showsProgression}`);
    if (ev.commitment.progressionArc) {
      console.log(`│   Arc: ${ev.commitment.progressionArc}`);
    }
    console.log(`│ Character: ${ev.character.primaryTrait}, community=${ev.character.communityBenefit}`);
    console.log(`│ Category: ${ev.categoryMatch.category} (${ev.categoryMatch.confidence})`);
    console.log(`│ Signal Strength: ${ev.overallSignalStrength}`);
    console.log(`└──────────────────────────────────────────`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`);
  console.log(`  COST: $${result.totalCost.toFixed(4)}`);
  console.log(`  DURATION: ${duration}ms`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
