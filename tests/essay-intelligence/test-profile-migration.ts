/**
 * test-profile-migration.ts — Unit test for Phase 1.5 legacy profile migration.
 *
 * Tests the deterministic data-shape conversion from legacy persisted
 * EssayProfile (no improvementCandidateSnapshot) to populated
 * ImprovementCandidateStoreSnapshot. Zero LLM calls needed.
 *
 * Usage:
 *   npx tsx tests/test-profile-migration.ts
 */

import { migrateLegacyProfileToCandidateStore } from '../../src/services/essayIntelligence/improvements/profileMigration';
import { isPipelineError } from '../../src/services/essayIntelligence/errors';
import type { EssayProfile, Finding } from '../../src/services/essayIntelligence/profileTypes';

// ============================================================================
// TEST HELPERS
// ============================================================================

/** Minimal EssayProfile stub sufficient for migration testing */
function makeStubProfile(overrides: Partial<EssayProfile> = {}): EssayProfile {
  return {
    index: {
      essayLength: { paragraphs: 7, sentences: 24, words: 350 },
      paragraphCount: 7,
      activeParagraphs: [0, 1, 2, 3, 4, 5, 6],
      northStarConfidence: 'hypothesis' as const,
      comprehensionDepth: 'surface' as const,
      analysisCompleteness: 'partial' as const,
      holisticCoverage: { populated: 0, total: 10 },
      staleness: { staleItems: 0, totalItems: 0, ratio: 0 },
      qualityFlags: [],
      improvementPhase: {
        level: 'architecture' as const,
        reasoning: '',
        focusAreas: [],
        deferredAreas: [],
        readinessAssessment: '',
        dimensionPhases: [],
        coachingLens: '',
      },
      fullAnalysisCount: 1,
      lastComprehensiveAt: null,
    },
    voiceIdentity: { signature: '', register: '', distinctivePatterns: [], evolution: '', authenticVsPerformed: [] },
    voiceMap: {
      dimensions: [],
      observations: [],
      codeSwitching: [],
      voiceFingerprint: { dominantRegister: '', signaturePatterns: [], vocabularyLevel: '' },
    },
    emotionalTopography: {
      arcTrajectory: '',
      peakMoments: [],
      undertones: [],
      emotionalProgression: [],
      showVsTell: [],
      authenticityAssessment: '',
    },
    momentEarnednessMap: { moments: [] },
    thematicArchitecture: {
      centralThesis: '',
      thematicThreads: [],
      subtext: '',
      contradictions: [],
    },
    narrativeStrategy: {
      primaryStrategy: '',
      pivotPoints: [],
      pacingAnalysis: '',
      structuralChoices: [],
    },
    characterRevelation: {
      personPortrait: '',
      valuesRevealed: [],
      growthArc: '',
      intellectualFingerprint: '',
      blindSpots: [],
    },
    craftAssessment: {
      strengthSignatures: [],
      growthEdges: [],
      imageSystem: '',
      sentencePatterns: '',
      wordPatterns: '',
    },
    entanglements: [],
    admissionsPositioning: {
      archetypeContext: { archetype: '', poolDensity: '', differentiator: '' },
      institutionalFit: [],
      redFlags: [],
      memorability: '',
      competitiveContext: '',
    },
    essayUnderstanding: { prose: '', generatedAt: '' },
    northStar: {
      activeScale: 'personal_statement',
      confidence: 'hypothesis' as const,
      throughLine: { centralElement: '', elementType: 'idea', transformation: '' },
      throughLineMap: { topLevelSummary: '' },
      structuralRoles: [],
      trajectory: [],
      distinctiveness: { signature: '', nonInterchangeability: '' },
      intentBridge: { writerGoal: '', readerExperience: '', gap: '' },
    },
    paragraphs: [],
    connections: { edges: [], lastScoutPass: null },
    editHistory: [],
    findings: [],
    questionQueue: [],
    conversationInsights: [],
    patternInsights: [],
    studentDeclaredContext: '',
    ...overrides,
  } as unknown as EssayProfile;
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'F1',
    claim: 'The essay relies on summary mode',
    scope: { type: 'paragraph', paragraph: 2, textEvidence: [] },
    maturity: 'confirmed',
    maturityReasoning: '',
    coachingValue: 'high',
    dimensions: [],
    buildsOn: [],
    relatedTo: [],
    source: 'walk',
    deepeningPotential: null,
    raisesQuestions: [],
    evidence: [{ text: 'P2 describes the experience without showing it', type: 'present' }],
    growthLineage: [],
    ...overrides,
  } as Finding;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log('\n=== Phase 1.5: Profile Migration Unit Tests ===\n');

// ── Test 1: Happy path — findings + priorities + growthEdges + redFlags ──

console.log('Test 1: Happy path — 4 sources populated');
{
  const profile = makeStubProfile({
    findings: [
      makeFinding({ id: 'F1', claim: 'Summary mode dominates P2', scope: { type: 'paragraph', paragraph: 2, textEvidence: [] }, coachingValue: 'high' }),
      makeFinding({ id: 'F2', claim: 'No named people in essay', scope: { type: 'essay_level', textEvidence: [] }, coachingValue: 'critical' }),
      makeFinding({ id: 'F3', claim: 'Redundant restatement in P6', scope: { type: 'sentence', paragraph: 5, sentences: [2], textEvidence: [] }, coachingValue: 'medium' }),
    ],
    scoreMatrix: {
      coachingMap: {
        transformativeInsight: { insight: '', evidenceLocations: [], whyThisTransforms: '', requiresStudentAwareness: false },
        priorities: [
          {
            priority: 'Ground abstract claims in concrete moments',
            target: { paragraphs: [0, 1], description: 'P1-P2' },
            architecturalReason: 'P1-P2 operate entirely in summary mode',
            unlocksNext: 'Unlocks sensory grounding',
            expectedImpact: 'transformative' as const,
          },
        ],
        protectedStrengths: [],
        // Phase 1: CoachingMap.emergentPatterns and scoreTensions are
        // now string[] (Scope 1 compression). The legacy object shape is
        // still ACCEPTED by buildCoachingMap()'s backward-compat parser,
        // but this test's fixture uses the new shape since it's constructing
        // the type directly without going through the parser.
        emergentPatterns: ['Pattern: test — test fixture pattern'],
        scoreTensions: [],
      },
    } as unknown as EssayProfile['scoreMatrix'],
    craftAssessment: {
      strengthSignatures: [],
      growthEdges: [
        { quality: 'Sensory detail', description: 'Essay lacks concrete physical imagery', paragraphs: [0, 1, 2] },
      ],
      imageSystem: '',
      sentencePatterns: '',
      wordPatterns: '',
    },
    admissionsPositioning: {
      archetypeContext: { archetype: '', poolDensity: '', differentiator: '' },
      institutionalFit: [],
      redFlags: ['Solo credit for likely teamwork', 'Scope inflation in P0'],
      memorability: '',
      competitiveContext: '',
    },
  });

  const result = migrateLegacyProfileToCandidateStore(profile);

  // 3 findings + 1 priority + 1 growthEdge + 2 redFlags = 7 candidates
  assert(result.candidates.length === 7, `Produces 7 candidates (got ${result.candidates.length})`);
  assert(result.nextId === 8, `nextId = candidates.length + 1 = 8 (got ${result.nextId})`);

  // Source distribution
  const l35 = result.candidates.filter(c => c.sourceLayer === 'L3.5');
  const l375 = result.candidates.filter(c => c.sourceLayer === 'L3.75');
  assert(l35.length === 4, `4 L3.5-sourced (3 findings + 1 priority) (got ${l35.length})`);
  assert(l375.length === 3, `3 L3.75-sourced (1 growthEdge + 2 redFlags) (got ${l375.length})`);

  // All consolidated (legacy manifest already consumed them)
  assert(
    result.candidates.every(c => c.lifecycleState === 'consolidated'),
    'All candidates have lifecycleState=consolidated',
  );

  // All have null technique and demonstrationSketch (expected quality tradeoff)
  assert(
    result.candidates.every(c => c.technique === null && c.demonstrationSketch === null),
    'All technique and demonstrationSketch are null (expected for migration)',
  );

  // Sentence-scoped finding (F3) preserved sentence coordinate
  const f3Candidate = result.candidates.find(c => c.sourceFindingId === 'F3');
  assert(f3Candidate !== undefined, 'F3 candidate exists');
  assert(f3Candidate?.paragraph === 5, `F3 paragraph = 5 (got ${f3Candidate?.paragraph})`);
  assert(f3Candidate?.sentence === 2, `F3 sentence = 2 (got ${f3Candidate?.sentence})`);

  // Essay-level finding (F2) has paragraph=-1
  const f2Candidate = result.candidates.find(c => c.sourceFindingId === 'F2');
  assert(f2Candidate?.paragraph === -1, `F2 paragraph = -1 (essay-level) (got ${f2Candidate?.paragraph})`);

  // Red flags have coachingValue='critical'
  const redFlagCandidates = result.candidates.filter(c => c.observation.startsWith('Solo credit') || c.observation.startsWith('Scope inflation'));
  assert(
    redFlagCandidates.every(c => c.coachingValue === 'critical'),
    'Red flags have coachingValue=critical',
  );

  // coachingValue mapping: priority with transformative → critical
  const priorityCandidate = result.candidates.find(c => c.suggestedChange === 'Ground abstract claims in concrete moments');
  assert(priorityCandidate?.coachingValue === 'critical', `Transformative priority → critical (got ${priorityCandidate?.coachingValue})`);

  // IDs are deterministic
  const ids = result.candidates.map(c => c.id);
  assert(ids.every(id => id.startsWith('CAND_')), 'All IDs start with CAND_');
  assert(new Set(ids).size === ids.length, 'All IDs are unique');
}

// ── Test 2: Zero source data → throws PipelineError.noMigrationSource ──

console.log('\nTest 2: Zero source data → PipelineError');
{
  const profile = makeStubProfile({
    findings: [],
    scoreMatrix: undefined,
    craftAssessment: {
      strengthSignatures: [],
      growthEdges: [],
      imageSystem: '',
      sentencePatterns: '',
      wordPatterns: '',
    },
    admissionsPositioning: {
      archetypeContext: { archetype: '', poolDensity: '', differentiator: '' },
      institutionalFit: [],
      redFlags: [],
      memorability: '',
      competitiveContext: '',
    },
  });

  let threw = false;
  let thrownErr: unknown;
  try {
    migrateLegacyProfileToCandidateStore(profile);
  } catch (err) {
    threw = true;
    thrownErr = err;
  }

  assert(threw, 'Throws on zero source data');
  assert(isPipelineError(thrownErr), `Throws PipelineError (got ${(thrownErr as Error)?.name ?? typeof thrownErr})`);
  if (isPipelineError(thrownErr)) {
    assert(thrownErr.layer === 'profile_migration', `layer = profile_migration (got ${thrownErr.layer})`);
    assert(thrownErr.message.includes('no source data'), `Message mentions no source data`);
  }
}

// ── Test 3: Superseded findings are skipped ──

console.log('\nTest 3: Superseded findings skipped');
{
  const profile = makeStubProfile({
    findings: [
      makeFinding({ id: 'F1', claim: 'Original claim', supersededBy: 'F2' }),
      makeFinding({ id: 'F2', claim: 'Better claim' }),
    ],
  });

  const result = migrateLegacyProfileToCandidateStore(profile);
  assert(result.candidates.length === 1, `Only 1 candidate (superseded F1 skipped) (got ${result.candidates.length})`);
  assert(result.candidates[0].sourceFindingId === 'F2', `Surviving candidate is F2`);
}

// ── Test 4: Deterministic IDs — same input → same output ──

console.log('\nTest 4: Deterministic IDs');
{
  const profile = makeStubProfile({
    findings: [makeFinding({ id: 'F1', claim: 'Summary mode' })],
  });

  const result1 = migrateLegacyProfileToCandidateStore(profile);
  const result2 = migrateLegacyProfileToCandidateStore(profile);
  assert(
    result1.candidates[0].id === result2.candidates[0].id,
    `Same input produces same ID: ${result1.candidates[0].id}`,
  );
}

// ── Test 5: Empty claim findings are skipped ──

console.log('\nTest 5: Empty claim findings skipped');
{
  const profile = makeStubProfile({
    findings: [
      makeFinding({ id: 'F1', claim: '' }),
      makeFinding({ id: 'F2', claim: '   ' }),
      makeFinding({ id: 'F3', claim: 'Valid claim' }),
    ],
  });

  const result = migrateLegacyProfileToCandidateStore(profile);
  assert(result.candidates.length === 1, `Only 1 candidate (2 empty claims skipped) (got ${result.candidates.length})`);
}

// ── Results ──

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ MIGRATION TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All migration tests passed');
}
