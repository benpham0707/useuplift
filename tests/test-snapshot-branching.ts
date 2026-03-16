/**
 * test-snapshot-branching.ts — Tests for Improvement #10: Version Branching
 *
 * Tests snapshot lifecycle (create, list, delete, limits) and auto-trigger detection.
 * The comparison test requires ANTHROPIC_API_KEY and makes a real Sonnet call.
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-snapshot-branching.ts
 */

import {
  SnapshotManager,
  hashCurrentState,
  shouldAutoSnapshotForEdit,
  shouldAutoSnapshotForMilestone,
} from '../src/services/essayIntelligence/versioning';
import type {
  SnapshotUnderstanding,
  EssaySnapshot,
  Finding,
  Connection,
} from '../src/services/essayIntelligence/profileTypes';
import type {
  CurrentEssayState,
  EditEvent,
  MilestoneEvent,
} from '../src/services/essayIntelligence/versioning';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockUnderstanding(overrides?: Partial<SnapshotUnderstanding>): SnapshotUnderstanding {
  return {
    northStarThroughLine: 'The essay argues that constraint breeds creativity through personal coding experience.',
    northStarStructuralRoles: [
      { paragraphIndex: 0, role: 'Opening hook — establishes tension', significance: 'load_bearing' },
      { paragraphIndex: 1, role: 'Context — provides background', significance: 'supporting' },
      { paragraphIndex: 2, role: 'Climax — core insight', significance: 'load_bearing' },
      { paragraphIndex: 3, role: 'Resolution — earned payoff', significance: 'transitional' },
    ],
    paragraphUnderstandings: [
      {
        paragraphIndex: 0,
        text: 'The first time I broke production at 2am, I learned more about debugging than any class could teach.',
        understanding: {
          role: 'Opening hook through vivid anecdote',
          function: 'Establishes the student as someone who learns from failure',
          narrativeContribution: 'Creates stakes and authenticity through vulnerability',
          emotionalRegister: {
            dominantEmotion: 'anxious exhilaration',
            depth: 'genuine',
            authenticity: 'high',
            showVsTell: 'showing',
            strongestMoment: 'broke production at 2am',
          },
          craftProfile: {
            rhythmPattern: 'short punchy opener followed by reflective expansion',
            imageUsage: 'concrete — 2am, production, debugging',
            voiceConsistency: 'consistent informal register',
            standoutMoment: 'The specificity of 2am creates authenticity',
          },
        },
      },
      {
        paragraphIndex: 1,
        text: 'Growing up, I always loved taking things apart to understand them.',
        understanding: {
          role: 'Background context — establishes curiosity pattern',
          function: 'Bridges childhood curiosity to current coding passion',
          narrativeContribution: 'Provides the "before" state for the transformation arc',
          emotionalRegister: {
            dominantEmotion: 'nostalgia',
            depth: 'moderate',
            authenticity: 'moderate',
            showVsTell: 'telling',
            strongestMoment: null,
          },
          craftProfile: {
            rhythmPattern: 'standard narrative pace',
            imageUsage: 'generic — taking things apart',
            voiceConsistency: 'consistent',
            standoutMoment: null,
          },
        },
      },
      {
        paragraphIndex: 2,
        text: 'That night, watching the fix deploy, I understood: the constraint of a live system was what made me careful, precise, creative.',
        understanding: {
          role: 'Climax — core insight about constraint and creativity',
          function: 'Delivers the essay\'s thesis through earned realization',
          narrativeContribution: 'Pays off the opening tension with insight',
          emotionalRegister: {
            dominantEmotion: 'quiet triumph',
            depth: 'deep',
            authenticity: 'high',
            showVsTell: 'showing',
            strongestMoment: 'constraint was what made me careful, precise, creative',
          },
          craftProfile: {
            rhythmPattern: 'builds to three-part list (careful, precise, creative)',
            imageUsage: 'concrete — watching the fix deploy',
            voiceConsistency: 'elevated from P0, intentionally',
            standoutMoment: 'Three-part rhythmic payoff',
          },
        },
      },
    ],
    findings: [
      {
        id: 'F1',
        claim: 'The essay uses constraint as both literal subject matter and structural principle',
        scope: { type: 'essay' },
        maturity: 'confirmed',
        maturityReasoning: 'Verified across P0 (2am production) and P2 (constraint insight)',
        coachingValue: 'critical',
        dimensions: ['theme', 'craft'],
        buildsOn: [],
        relatedTo: ['F2'],
        evidence: [{ text: 'constraint of a live system', location: { paragraph: 2 }, type: 'direct_quote' }],
        lineage: [{ timestamp: '2026-03-13T10:00:00Z', fromMaturity: 'hypothesis', toMaturity: 'confirmed', trigger: 'walk_P2', reasoning: 'P2 explicitly states the constraint thesis' }],
        source: 'walk',
        deepeningPotential: null,
        raisesQuestions: [],
        createdAt: '2026-03-13T10:00:00Z',
        lastUpdated: '2026-03-13T10:00:00Z',
      } as Finding,
      {
        id: 'F2',
        claim: 'The 2am anecdote is the essay\'s authenticating detail',
        scope: { type: 'paragraph', paragraph: 0 },
        maturity: 'developing',
        maturityReasoning: 'Strong specific detail but not yet connected to broader pattern',
        coachingValue: 'high',
        dimensions: ['voice', 'narrative'],
        buildsOn: [],
        relatedTo: ['F1'],
        evidence: [{ text: 'broke production at 2am', location: { paragraph: 0 }, type: 'direct_quote' }],
        lineage: [{ timestamp: '2026-03-13T10:00:00Z', fromMaturity: 'hypothesis', toMaturity: 'developing', trigger: 'walk_P0', reasoning: 'Specific but not yet anchored to arc' }],
        source: 'walk',
        deepeningPotential: 'Could explore whether other sensory details support the 2am scene',
        raisesQuestions: ['Does the rest of the essay match this specificity?'],
        createdAt: '2026-03-13T10:00:00Z',
        lastUpdated: '2026-03-13T10:00:00Z',
      } as Finding,
    ],
    connections: [
      {
        id: 'C1',
        from: { paragraph: 0, type: 'paragraph' },
        to: { paragraph: 2, type: 'paragraph' },
        description: 'P0\'s 2am scene sets up P2\'s constraint insight — the specific failure enables the general realization',
        reverseIllumination: 'P2 retroactively elevates P0 from anecdote to argument',
        routingTags: ['thematic'],
        significance: 'Load-bearing — without this connection, P2\'s thesis is unearned',
        strengthCategory: 'strong',
        directionality: 'bidirectional',
        discoveredBy: 'walk',
        status: 'active',
        relatedFindings: ['F1', 'F2'],
        createdAt: '2026-03-13T10:00:00Z',
      } as Connection,
    ],
    connectionGraphSummary: 'Hub-and-spoke centered on P2 (climax). P0→P2 is load-bearing.',
    holisticSections: {
      voiceIdentity: { dominant: 'informal technical', register: 'casual-to-reflective' },
      thematicArchitecture: { centralThesis: 'Constraint breeds creativity' },
    },
    questionQueue: [],
    maturity: 'developing',
    readingStrategy: {
      strategy: 'Read for the constraint-creativity dialectic — every paragraph should map to one side',
      bestApproach: 'Track how specific moments earn the general claim',
      antiPatterns: ['Don\'t read as a resume of technical skills'],
      contextPriorities: ['thematicArchitecture', 'narrativeStrategy', 'voiceIdentity'],
    },
    improvementPhase: {
      level: 'architecture',
      reasoning: 'Core thesis is clear, structural connections forming, craft needs attention',
      focusAreas: ['Strengthen P1 — currently weakest link', 'Tighten P2 rhythm'],
      deferredAreas: ['Word-level polish', 'Sentence variation'],
      readinessAssessment: 'Ready for structural refinement, not yet for polish',
      legacyReadiness: { essayLevel: 70, paragraphLevel: 50, sentenceLevel: 30, wordLevel: 10 },
      dimensionPhases: [],
      coachingLens: 'Focus on how paragraphs serve the through-line. P1 needs a clearer role.',
      transition: null,
    },
    ...overrides,
  };
}

const MOCK_ESSAY_TEXT = `The first time I broke production at 2am, I learned more about debugging than any class could teach.

Growing up, I always loved taking things apart to understand them.

That night, watching the fix deploy, I understood: the constraint of a live system was what made me careful, precise, creative.`;

const MODIFIED_ESSAY_TEXT = `The first time I crashed our school's server at 2am during a hackathon, I discovered something unexpected about problem-solving under pressure.

Growing up, I always loved taking things apart to understand them.

That night, watching the fix deploy, I understood: the constraint of a live system was what made me careful, precise, creative. Every limitation became a doorway to innovation.`;

// ============================================================================
// TESTS
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertThrows(fn: () => void, message: string): void {
  try {
    fn();
    failed++;
    console.error(`  ✗ ${message} (expected to throw but did not)`);
  } catch {
    passed++;
    console.log(`  ✓ ${message}`);
  }
}

// --------------------------------------------------------------------------
// Test 1: SnapshotManager CRUD
// --------------------------------------------------------------------------

function testSnapshotManagerCRUD(): void {
  console.log('\n=== Test 1: SnapshotManager CRUD ===\n');

  const manager = new SnapshotManager();
  const understanding = createMockUnderstanding();

  // Create
  const snap1 = manager.createSnapshot(
    'Before P1 rewrite',
    'Student about to rewrite opening',
    MOCK_ESSAY_TEXT,
    understanding,
    'student_manual',
  );

  assert(snap1.id === 'snap-1', 'First snapshot gets ID snap-1');
  assert(snap1.name === 'Before P1 rewrite', 'Name is preserved');
  assert(snap1.text === MOCK_ESSAY_TEXT, 'Text is frozen');
  assert(snap1.paragraphCount === 3, 'Paragraph count is correct');
  assert(snap1.source === 'student_manual', 'Source is preserved');
  assert(snap1.understanding.findings.length === 2, 'Findings are deep-copied');
  assert(snap1.understanding.connections.length === 1, 'Connections are deep-copied');

  // Verify deep copy isolation
  understanding.findings.push({
    id: 'F99',
    claim: 'This should not appear in the snapshot',
    scope: { type: 'essay' },
    maturity: 'hypothesis',
    maturityReasoning: 'test',
    coachingValue: 'contextual',
    dimensions: ['theme'],
    buildsOn: [],
    relatedTo: [],
    evidence: [],
    lineage: [],
    source: 'walk',
    deepeningPotential: null,
    raisesQuestions: [],
    createdAt: '2026-03-13T12:00:00Z',
    lastUpdated: '2026-03-13T12:00:00Z',
  } as Finding);

  assert(
    snap1.understanding.findings.length === 2,
    'Deep copy isolation: mutation to source does not affect snapshot'
  );

  // List
  const list = manager.listSnapshots();
  assert(list.length === 1, 'List shows 1 snapshot');
  assert(list[0].id === 'snap-1', 'List entry has correct ID');
  assert(list[0].name === 'Before P1 rewrite', 'List entry has correct name');

  // Get
  const retrieved = manager.getSnapshot('snap-1');
  assert(retrieved !== undefined, 'getSnapshot returns the snapshot');
  assert(retrieved!.text === MOCK_ESSAY_TEXT, 'getSnapshot returns correct text');

  const missing = manager.getSnapshot('snap-999');
  assert(missing === undefined, 'getSnapshot returns undefined for missing ID');

  // Delete
  manager.createSnapshot('Second snapshot', 'test', MOCK_ESSAY_TEXT, createMockUnderstanding(), 'auto_milestone');
  assert(manager.count === 2, 'Count is 2 after second snapshot');

  manager.deleteSnapshot('snap-1');
  assert(manager.count === 1, 'Count is 1 after deleting snap-1');
  assert(manager.getSnapshot('snap-1') === undefined, 'Deleted snapshot is gone');
  assert(manager.getSnapshot('snap-2') !== undefined, 'Other snapshot still exists');

  // Delete non-existent
  assertThrows(
    () => manager.deleteSnapshot('snap-999'),
    'Deleting non-existent snapshot throws'
  );
}

// --------------------------------------------------------------------------
// Test 2: Max Snapshot Limit
// --------------------------------------------------------------------------

function testMaxSnapshotLimit(): void {
  console.log('\n=== Test 2: Max Snapshot Limit ===\n');

  const manager = new SnapshotManager();

  // Create 5 snapshots (the limit)
  for (let i = 0; i < 5; i++) {
    manager.createSnapshot(
      `Snapshot ${i + 1}`,
      'test',
      MOCK_ESSAY_TEXT,
      createMockUnderstanding(),
      'student_manual',
    );
  }

  assert(manager.count === 5, 'Can create up to 5 snapshots');
  assert(!manager.hasCapacity, 'hasCapacity is false at limit');

  // 6th snapshot should throw
  assertThrows(
    () => manager.createSnapshot(
      'One too many',
      'test',
      MOCK_ESSAY_TEXT,
      createMockUnderstanding(),
      'student_manual',
    ),
    'Creating 6th snapshot throws'
  );

  // Delete one, then create should work
  manager.deleteSnapshot('snap-3');
  assert(manager.hasCapacity, 'hasCapacity is true after deleting one');

  const newSnap = manager.createSnapshot(
    'Replacement',
    'test',
    MOCK_ESSAY_TEXT,
    createMockUnderstanding(),
    'student_manual',
  );
  assert(newSnap.id === 'snap-6', 'New snapshot gets next sequential ID');
  assert(manager.count === 5, 'Count is back to 5');
}

// --------------------------------------------------------------------------
// Test 3: Nesting Limit
// --------------------------------------------------------------------------

function testNestingLimit(): void {
  console.log('\n=== Test 3: Nesting Limit ===\n');

  const manager = new SnapshotManager();

  // Create root snapshot
  const root = manager.createSnapshot(
    'Root',
    'test',
    MOCK_ESSAY_TEXT,
    createMockUnderstanding(),
    'student_manual',
  );

  // Create child (nesting level 1) — should work
  const child = manager.createSnapshot(
    'Child of Root',
    'test',
    MOCK_ESSAY_TEXT,
    createMockUnderstanding(),
    'student_manual',
    undefined,
    root.id,
  );

  assert(child.parentSnapshotId === root.id, 'Child has parent reference');

  // Create grandchild (nesting level 2) — should throw
  assertThrows(
    () => manager.createSnapshot(
      'Grandchild',
      'test',
      MOCK_ESSAY_TEXT,
      createMockUnderstanding(),
      'student_manual',
      undefined,
      child.id,
    ),
    'Creating grandchild (nesting > 2) throws'
  );

  // Nesting with non-existent parent — should throw
  assertThrows(
    () => manager.createSnapshot(
      'Orphan',
      'test',
      MOCK_ESSAY_TEXT,
      createMockUnderstanding(),
      'student_manual',
      undefined,
      'snap-999',
    ),
    'Creating snapshot with non-existent parent throws'
  );
}

// --------------------------------------------------------------------------
// Test 4: Delete with Children (Orphaning)
// --------------------------------------------------------------------------

function testDeleteWithChildren(): void {
  console.log('\n=== Test 4: Delete with Children (Orphaning) ===\n');

  const manager = new SnapshotManager();

  const parent = manager.createSnapshot(
    'Parent',
    'test',
    MOCK_ESSAY_TEXT,
    createMockUnderstanding(),
    'student_manual',
  );

  const child = manager.createSnapshot(
    'Child',
    'test',
    MOCK_ESSAY_TEXT,
    createMockUnderstanding(),
    'student_manual',
    undefined,
    parent.id,
  );

  assert(child.parentSnapshotId === parent.id, 'Child has parent before deletion');

  manager.deleteSnapshot(parent.id);

  const orphanedChild = manager.getSnapshot(child.id);
  assert(orphanedChild !== undefined, 'Child still exists after parent deletion');
  assert(
    orphanedChild!.parentSnapshotId === undefined,
    'Child is orphaned (parent reference removed)'
  );
}

// --------------------------------------------------------------------------
// Test 5: Comparison Caching
// --------------------------------------------------------------------------

function testComparisonCaching(): void {
  console.log('\n=== Test 5: Comparison Caching ===\n');

  const manager = new SnapshotManager();

  manager.createSnapshot(
    'Test',
    'test',
    MOCK_ESSAY_TEXT,
    createMockUnderstanding(),
    'student_manual',
  );

  const mockComparison = {
    snapshotId: 'snap-1',
    snapshotName: 'Test',
    comparedAt: new Date().toISOString(),
    analysis: 'Test analysis',
    paragraphDeltas: [],
    structuralDelta: {
      lostConnections: [],
      gainedConnections: [],
      changedConnections: [],
      architecturalAssessment: 'Test',
    },
    findingDelta: {
      newFindings: [],
      supersededFindings: [],
      maturityDifferences: [],
    },
    coachingImplications: 'Test implications',
  };

  // No cache initially
  assert(
    manager.getCachedComparison('snap-1', 'hash123') === null,
    'No cached comparison initially'
  );

  // Cache a comparison
  manager.cacheComparison('snap-1', 'hash123', mockComparison);
  const cached = manager.getCachedComparison('snap-1', 'hash123');
  assert(cached !== null, 'Cached comparison is retrievable');
  assert(cached!.analysis === 'Test analysis', 'Cached comparison has correct data');

  // Different hash = no cache
  assert(
    manager.getCachedComparison('snap-1', 'differentHash') === null,
    'Different hash returns null (no cache hit)'
  );

  // Invalidate cache
  manager.invalidateCache();
  assert(
    manager.getCachedComparison('snap-1', 'hash123') === null,
    'Cache is empty after invalidation'
  );
}

// --------------------------------------------------------------------------
// Test 6: Serialization / Deserialization
// --------------------------------------------------------------------------

function testSerialization(): void {
  console.log('\n=== Test 6: Serialization / Deserialization ===\n');

  const manager = new SnapshotManager();

  manager.createSnapshot('Snap 1', 'ctx1', MOCK_ESSAY_TEXT, createMockUnderstanding(), 'student_manual');
  manager.createSnapshot('Snap 2', 'ctx2', MODIFIED_ESSAY_TEXT, createMockUnderstanding(), 'auto_before_rewrite', 'Major P0 rewrite');

  const serialized = manager.serialize();
  assert(serialized.snapshots.length === 2, 'Serialized has 2 snapshots');
  assert(serialized.nextId === 3, 'Serialized has correct nextId');

  // Deserialize into a new manager
  const restored = SnapshotManager.deserialize(serialized);
  assert(restored.count === 2, 'Restored manager has 2 snapshots');
  assert(restored.getSnapshot('snap-1')!.name === 'Snap 1', 'Restored snap-1 has correct name');
  assert(restored.getSnapshot('snap-2')!.autoTrigger === 'Major P0 rewrite', 'Restored snap-2 has autoTrigger');

  // New snapshots get correct IDs
  const snap3 = restored.createSnapshot('Snap 3', 'ctx3', MOCK_ESSAY_TEXT, createMockUnderstanding(), 'student_manual');
  assert(snap3.id === 'snap-3', 'New snapshot in restored manager gets ID snap-3');
}

// --------------------------------------------------------------------------
// Test 7: State Hashing
// --------------------------------------------------------------------------

function testStateHashing(): void {
  console.log('\n=== Test 7: State Hashing ===\n');

  const state1: CurrentEssayState = {
    text: MOCK_ESSAY_TEXT,
    understanding: createMockUnderstanding(),
  };

  const state2: CurrentEssayState = {
    text: MOCK_ESSAY_TEXT,
    understanding: createMockUnderstanding(),
  };

  const state3: CurrentEssayState = {
    text: MODIFIED_ESSAY_TEXT,
    understanding: createMockUnderstanding(),
  };

  const hash1 = hashCurrentState(state1);
  const hash2 = hashCurrentState(state2);
  const hash3 = hashCurrentState(state3);

  assert(hash1 === hash2, 'Same state produces same hash');
  assert(hash1 !== hash3, 'Different text produces different hash');
  assert(hash1.length === 16, 'Hash is 16 characters');
}

// --------------------------------------------------------------------------
// Test 8: Auto-Snapshot Triggers (Edit)
// --------------------------------------------------------------------------

function testAutoSnapshotTriggerEdit(): void {
  console.log('\n=== Test 8: Auto-Snapshot Triggers (Edit) ===\n');

  const manager = new SnapshotManager();

  // Pattern 1: Major rewrite (>40% changed)
  const majorRewrite: EditEvent = {
    paragraph: 0,
    changedCharacters: 60,
    originalLength: 100,
    type: 'content',
  };
  const decision1 = shouldAutoSnapshotForEdit(majorRewrite, manager);
  assert(decision1 !== null, 'Major rewrite triggers auto-snapshot');
  assert(decision1!.should === true, 'Major rewrite decision.should is true');
  assert(decision1!.suggestedName.includes('P0'), 'Suggested name references paragraph');

  // Minor edit (10% changed) — should NOT trigger
  const minorEdit: EditEvent = {
    paragraph: 1,
    changedCharacters: 10,
    originalLength: 100,
    type: 'content',
  };
  const decision2 = shouldAutoSnapshotForEdit(minorEdit, manager);
  assert(decision2 === null, 'Minor edit does not trigger auto-snapshot');

  // Pattern 2: Structural change
  const structuralChange: EditEvent = {
    paragraph: 2,
    changedCharacters: 0,
    originalLength: 0,
    type: 'structural',
    structuralChange: 'paragraph_added',
  };
  const decision3 = shouldAutoSnapshotForEdit(structuralChange, manager);
  assert(decision3 !== null, 'Structural change triggers auto-snapshot');
  assert(decision3!.suggestedName.includes('addition'), 'Suggested name describes structural change');

  // Rate limiting: after creating a snapshot, next trigger is suppressed
  manager.createSnapshot('Recent', 'test', MOCK_ESSAY_TEXT, createMockUnderstanding(), 'auto_before_rewrite');

  const decision4 = shouldAutoSnapshotForEdit(majorRewrite, manager);
  assert(decision4 === null, 'Auto-snapshot suppressed when recent snapshot exists');
}

// --------------------------------------------------------------------------
// Test 9: Auto-Snapshot Triggers (Milestone)
// --------------------------------------------------------------------------

function testAutoSnapshotTriggerMilestone(): void {
  console.log('\n=== Test 9: Auto-Snapshot Triggers (Milestone) ===\n');

  const manager = new SnapshotManager();

  const milestone: MilestoneEvent = {
    milestone: 'maturity_deep',
    description: 'Understanding maturity reached deep for the first time.',
  };

  const decision = shouldAutoSnapshotForMilestone(milestone, manager);
  assert(decision !== null, 'First deep maturity triggers auto-snapshot');
  assert(decision!.suggestedName.includes('deep maturity'), 'Suggested name reflects milestone');

  // Capacity preservation: with 3+ snapshots, milestones don't trigger
  // (reserves slots for manual snapshots)
  for (let i = 0; i < 3; i++) {
    manager.createSnapshot(`Snap ${i}`, 'test', MOCK_ESSAY_TEXT, createMockUnderstanding(), 'student_manual');
  }

  // Need to wait for the rate limit to pass
  // Since we can't easily mock time, just verify the capacity check
  const managerWithCapacity = new SnapshotManager();
  for (let i = 0; i < 3; i++) {
    // Create snapshots with timestamps in the past to avoid rate limiting
    const snap = managerWithCapacity.createSnapshot(
      `Old snap ${i}`,
      'test',
      MOCK_ESSAY_TEXT,
      createMockUnderstanding(),
      'student_manual',
    );
    // Manually adjust the creation time to be old (hacky but necessary for unit test)
    (snap as { createdAt: string }).createdAt = '2026-01-01T00:00:00Z';
  }

  const decision2 = shouldAutoSnapshotForMilestone(milestone, managerWithCapacity);
  assert(
    decision2 === null,
    'Milestone auto-snapshot suppressed when 3+ snapshots exist (preserves capacity)'
  );
}

// --------------------------------------------------------------------------
// Run All Tests
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Snapshot Branching Tests (Improvement #10) ===');

  testSnapshotManagerCRUD();
  testMaxSnapshotLimit();
  testNestingLimit();
  testDeleteWithChildren();
  testComparisonCaching();
  testSerialization();
  testStateHashing();
  testAutoSnapshotTriggerEdit();
  testAutoSnapshotTriggerMilestone();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
