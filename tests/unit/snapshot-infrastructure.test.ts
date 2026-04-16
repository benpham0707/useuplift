/**
 * snapshot-infrastructure.test.ts — Phase 1 Revision History regression.
 *
 * Covers the pure profileSnapshot + snapshotStore surface:
 *   - extractSnapshot pulls the minimal documented subset
 *   - hashEssayText is deterministic and content-sensitive
 *   - readRecentSnapshots returns oldest→newest, null-safe
 *   - writeSnapshot is idempotent on repeated sessionId
 *   - detectResetCondition fires on <30% token overlap (substantial_rewrite)
 *   - topic_change is a soft reset (keeps snapshots, records event)
 *   - manual_reset archives like substantial_rewrite
 *   - pruneToMax caps at 10, excess → archivedSnapshots
 *   - resetEvents are recorded with priorSnapshotCount
 *   - size on a realistic profile is under a sensible bound
 *
 * Run: npx tsx tests/unit/snapshot-infrastructure.test.ts
 * Exit: 0 = pass, 1 = fail.
 */

import {
  extractSnapshot,
  hashEssayText,
} from '../../src/services/essayIntelligence/history/profileSnapshot';
import {
  SNAPSHOT_HISTORY_MAX,
  SUBSTANTIAL_OVERLAP_THRESHOLD,
  detectResetCondition,
  emptyRevisionHistory,
  mostRecentSnapshot,
  pruneToMax,
  readRecentSnapshots,
  tokenOverlap,
  writeSnapshot,
} from '../../src/services/essayIntelligence/history/snapshotStore';
import type {
  EssayProfile,
  Finding,
  RevisionHistory,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── harness ─────────────────────────────────────────────────────────────────

type TestFn = () => void;
const results: Array<{ name: string; pass: boolean; detail?: string }> = [];

function test(name: string, fn: TestFn): void {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (err) {
    results.push({
      name,
      pass: false,
      detail: err instanceof Error ? err.stack ?? err.message : String(err),
    });
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

// ─── fixtures ────────────────────────────────────────────────────────────────

function makeFinding(
  id: string,
  paragraph: number,
  sentence: number | null,
  dims: string[],
  maturity: 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded',
): Finding {
  return {
    id,
    claim: `Claim for ${id} — something about ${dims.join('/')}.`,
    scope: {
      type: sentence === null ? 'paragraph' : 'sentence',
      paragraph,
      sentences: sentence === null ? undefined : [sentence],
      textEvidence: [
        { text: `evidence text for ${id}`, location: { paragraph, sentence: sentence ?? undefined } },
      ],
    },
    maturity,
    maturityReasoning: `reason for ${maturity}`,
    coachingValue: 'high',
    dimensions: dims as Finding['dimensions'],
    buildsOn: [],
    relatedTo: [],
    source: 'walk',
    deepeningPotential: null,
    raisesQuestions: [],
    evidence: [
      {
        text: `quoted text for ${id}`,
        location: { paragraph, sentence: sentence ?? undefined },
        type: 'present',
      },
    ],
    lineage: [],
    createdAt: '2026-04-16T00:00:00.000Z',
    lastUpdated: '2026-04-16T00:00:00.000Z',
  } as Finding;
}

/**
 * Realistic-ish profile fixture: 5 paragraphs of prose, 4 findings, a voice
 * identity with markers/weaknesses, an archetype. Cast through `unknown`
 * because the live EssayProfile surface is far wider than the snapshot code
 * touches — we only populate the fields the extractor reads.
 */
function makeProfile(overrides: Partial<EssayProfile> = {}): EssayProfile {
  const paragraphs = [
    'The Chopin Nocturne was still ringing in the practice room when I opened my laptop and started debugging the AI DJ algorithm.',
    'Composing is like solving a puzzle — the pieces must align in rhythm and harmony. I spent hours experimenting with chord progressions.',
    'Reimagining classical pieces by infusing modern elements became my favorite endeavor.',
    'As I explored music complexities I noticed parallels with coding. I realized composing and algorithms both require logic and creativity.',
    'Whether at a piano or a computer I am driven to create and explore the limitless possibilities at my fingertips.',
  ];
  const base = {
    index: {
      improvementPhase: {
        level: 'craft',
        reasoning: 'Voice is developed; craft refinements are next.',
        focusAreas: ['register control', 'image repetition'],
        deferredAreas: ['structural reordering'],
        readinessAssessment: 'mid-revision polish work',
        legacyReadiness: {
          essayLevel: 3,
          paragraphLevel: 3,
          sentenceLevel: 2,
          wordLevel: 1,
        },
        dimensionPhases: [],
        coachingLens: 'polish the voice markers you already have',
        transition: null,
      },
    },
    paragraphs: paragraphs.map((text, i) => ({ index: i, text })),
    findings: [
      makeFinding('F1', 0, 0, ['voice', 'craft'], 'confirmed'),
      makeFinding('F2', 1, null, ['emotion'], 'developing'),
      makeFinding('F3', 2, 1, ['theme'], 'deepened'),
      makeFinding('F4', 4, 0, ['craft'], 'superseded'),
    ],
    voiceIdentity: {
      signature: 'reflective technical voice',
      register: 'contemplative',
      distinctivePatterns: [],
      evolution: '',
      authenticVsPerformed: [],
      primaryRegister: 'contemplative-technical',
      voiceMarkers: ['em-dash pivots', 'concrete nouns', 'self-correction'],
      voiceWeaknesses: ['reaches for "resonant"'],
      registerShifts: [
        { paragraph: 3, from: 'contemplative', to: 'expository', driver: 'thesis recap' },
      ],
    },
    admissionsPositioning: {
      archetypeContext: {
        archetype: 'music as life metaphor',
        poolDensity: 'common',
        differentiator: 'AI DJ specificity',
      },
    },
    metadata: {
      confidenceLevel: 'comprehensive',
      lastUpdatedLayer: 4,
      paragraphsCovered: [0, 1, 2, 3, 4],
      conversationInsightsCount: 0,
      totalAnalysisCost: 0,
      createdAt: '2026-04-16T00:00:00.000Z',
      lastMutatedAt: '2026-04-16T00:00:00.000Z',
      legacyProfile: false,
    },
  };
  return { ...base, ...overrides } as unknown as EssayProfile;
}

const ESSAY_A = `Paragraph one about music and code.
Paragraph two about algorithms and harmony.
Paragraph three about creative discipline and attention.`;
const ESSAY_A_PRIME = `Paragraph one about music and code.
Paragraph two about algorithms and harmony.
Paragraph three about creative discipline and attention.
Paragraph four adds a closing reflection on persistence.`;
const ESSAY_B = `Entirely different topic — summer at grandmother's kitchen.
Flour on counters, sunlight through windows, cardamom and patience.
The recipe was never written down; it lived in her hands.`;

// ─── tests ───────────────────────────────────────────────────────────────────

test('hashEssayText: deterministic and content-sensitive', () => {
  assert(hashEssayText('abc') === hashEssayText('abc'), 'same input must hash same');
  assert(hashEssayText('abc') !== hashEssayText('abd'), 'different input must differ');
  assert(hashEssayText('').length === 16, 'hash length must be 16');
});

test('tokenOverlap: identical texts overlap = 1, disjoint = 0', () => {
  assert(tokenOverlap(ESSAY_A, ESSAY_A) === 1, 'identical must be 1');
  const overlapLow = tokenOverlap(ESSAY_A, ESSAY_B);
  assert(overlapLow < SUBSTANTIAL_OVERLAP_THRESHOLD, `disjoint should be <${SUBSTANTIAL_OVERLAP_THRESHOLD}, got ${overlapLow}`);
  const overlapHigh = tokenOverlap(ESSAY_A, ESSAY_A_PRIME);
  assert(overlapHigh > SUBSTANTIAL_OVERLAP_THRESHOLD, `similar-with-addition should be >threshold, got ${overlapHigh}`);
});

test('extractSnapshot: minimal subset is captured correctly', () => {
  const profile = makeProfile();
  const snap = extractSnapshot(profile, 'session-1', 1);

  assert(snap.sessionId === 'session-1', 'sessionId set');
  assert(snap.version === 1, 'version set');
  assert(typeof snap.timestamp === 'string' && snap.timestamp.length > 0, 'timestamp set');
  assert(snap.essayTextHash.length === 16, 'hash length 16');
  assert(snap.essayTextLength > 0, 'essayTextLength > 0');
  assert(snap.improvementPhase !== null, 'improvementPhase threaded');
  assert(snap.improvementPhase!.level === 'craft', 'improvementPhase.level passed through');

  // findings
  assert(snap.findings.length === 4, `expected 4 findings, got ${snap.findings.length}`);
  const f1 = snap.findings.find((f) => f.id === 'F1');
  assert(f1, 'F1 present');
  assert(f1!.paragraph === 0, 'F1 paragraph 0');
  assert(f1!.sentenceIndex === 0, 'F1 sentenceIndex 0');
  assert(f1!.anchorText.length > 0, 'F1 anchorText derived');
  assert(f1!.craftCategory === 'voice', 'F1 craftCategory first-dimension');
  assert(f1!.severity === 'moderate', 'F1 severity default moderate');
  assert(f1!.maturity === 'active', 'F1 maturity mapped active');
  const f4 = snap.findings.find((f) => f.id === 'F4');
  assert(f4, 'F4 present');
  assert(f4!.maturity === 'superseded', 'F4 superseded preserved');

  // voice snapshot
  assert(snap.voiceIdentitySnapshot.primaryRegister === 'contemplative-technical', 'primaryRegister threaded');
  assert(snap.voiceIdentitySnapshot.voiceMarkers.length === 3, 'voiceMarkers threaded');
  assert(snap.voiceIdentitySnapshot.voiceWeaknesses.length === 1, 'voiceWeaknesses threaded');
  assert(snap.voiceIdentitySnapshot.vividnessSignal === 'vivid', 'vividness = vivid for 3 markers + 1 weakness');
  assert(snap.voiceIdentitySnapshot.registerShifts.length === 1, 'registerShifts threaded');

  // archetype
  assert(snap.archetypeSaturation === 0.75, 'archetypeSaturation common=0.75');
  assert(snap.archetypeLabel === 'music as life metaphor', 'archetypeLabel threaded');
});

test('extractSnapshot: vividness = flattened for weak voice', () => {
  const profile = makeProfile();
  // ts hack: mutate voiceIdentity
  (profile.voiceIdentity as unknown as { voiceMarkers: string[]; voiceWeaknesses: string[] }).voiceMarkers = ['em-dash pivots'];
  (profile.voiceIdentity as unknown as { voiceMarkers: string[]; voiceWeaknesses: string[] }).voiceWeaknesses = [
    'abstract closings',
    'reaches for "resonant"',
    'philosophical fog in P5',
  ];
  const snap = extractSnapshot(profile, 's', 1);
  assert(snap.voiceIdentitySnapshot.vividnessSignal === 'flattened', 'expected flattened');
});

test('extractSnapshot: vividness = balanced otherwise', () => {
  const profile = makeProfile();
  (profile.voiceIdentity as unknown as { voiceMarkers: string[]; voiceWeaknesses: string[] }).voiceMarkers = ['one', 'two'];
  (profile.voiceIdentity as unknown as { voiceMarkers: string[]; voiceWeaknesses: string[] }).voiceWeaknesses = ['one', 'two'];
  const snap = extractSnapshot(profile, 's', 1);
  assert(snap.voiceIdentitySnapshot.vividnessSignal === 'balanced', 'expected balanced');
});

test('readRecentSnapshots: null-safe + oldest→newest ordering', () => {
  assert(readRecentSnapshots(undefined, 3).length === 0, 'undefined → []');
  assert(readRecentSnapshots(emptyRevisionHistory(), 3).length === 0, 'empty → []');

  const profile = makeProfile();
  let history: RevisionHistory | undefined = undefined;
  for (let i = 1; i <= 5; i++) {
    const r = writeSnapshot({
      history,
      profile,
      sessionId: `s${i}`,
      version: i,
    });
    history = r.history;
  }
  const last3 = readRecentSnapshots(history, 3);
  assert(last3.length === 3, 'last3 length 3');
  assert(last3[0].sessionId === 's3', 'order oldest first');
  assert(last3[2].sessionId === 's5', 'newest last');
  const all = readRecentSnapshots(history, 99);
  assert(all.length === 5, 'n larger than size returns all');
});

test('writeSnapshot: idempotent on repeated sessionId (replace, not duplicate)', () => {
  const profile = makeProfile();
  const r1 = writeSnapshot({ history: undefined, profile, sessionId: 'dup', version: 1 });
  const r2 = writeSnapshot({ history: r1.history, profile, sessionId: 'dup', version: 2 });
  assert(r2.history.snapshots.length === 1, `expected 1 snapshot after 2nd write, got ${r2.history.snapshots.length}`);
  assert(r2.history.snapshots[0].version === 2, 'version 2 replaces 1');
});

test('detectResetCondition: substantial_rewrite fires on low overlap', () => {
  const priorSnap = extractSnapshot(makeProfile(), 's0', 1);
  const sig = detectResetCondition({
    priorSnapshot: priorSnap,
    priorEssayText: ESSAY_A,
    currentEssayText: ESSAY_B,
    priorArchetype: null,
    currentArchetype: null,
  });
  assert(sig.triggered, 'should trigger');
  assert(sig.reason === 'substantial_rewrite', `reason=substantial_rewrite, got ${sig.reason}`);
  assert(typeof sig.tokenOverlap === 'number' && sig.tokenOverlap < SUBSTANTIAL_OVERLAP_THRESHOLD, 'overlap recorded');
});

test('detectResetCondition: no reset when no prior snapshot', () => {
  const sig = detectResetCondition({
    priorSnapshot: null,
    priorEssayText: null,
    currentEssayText: ESSAY_B,
    priorArchetype: null,
    currentArchetype: null,
  });
  assert(!sig.triggered, 'first write must not trigger');
});

test('detectResetCondition: topic_change when archetype labels differ', () => {
  const priorSnap = extractSnapshot(makeProfile(), 's0', 1);
  const sig = detectResetCondition({
    priorSnapshot: priorSnap,
    priorEssayText: ESSAY_A,
    currentEssayText: ESSAY_A_PRIME,
    priorArchetype: 'music as life metaphor',
    currentArchetype: 'immigrant identity',
  });
  assert(sig.triggered, 'should trigger');
  assert(sig.reason === 'topic_change', `expected topic_change, got ${sig.reason}`);
});

test('writeSnapshot: substantial_rewrite archives prior history + records event', () => {
  const profile = makeProfile();
  // Write 3 prior snapshots with the same essay, advancing priorText between writes.
  let history: RevisionHistory | undefined = undefined;
  let text = 'alpha beta gamma delta epsilon zeta eta theta iota';
  for (let i = 1; i <= 3; i++) {
    const p = makeProfile({
      paragraphs: [{ index: 0, text }],
    } as unknown as Partial<EssayProfile>);
    const r = writeSnapshot({
      history,
      profile: p,
      sessionId: `s${i}`,
      version: i,
      priorEssayText: i === 1 ? null : text,
    });
    history = r.history;
  }
  assert(history!.snapshots.length === 3, 'history has 3');
  // Now write a brand-new essay with low token overlap.
  const newText = 'zephyr mango piano bicycle constellation lavender';
  const newProfile = makeProfile({
    paragraphs: [{ index: 0, text: newText }],
  } as unknown as Partial<EssayProfile>);
  const r4 = writeSnapshot({
    history,
    profile: newProfile,
    sessionId: 's4',
    version: 4,
    priorEssayText: text,
  });
  assert(r4.resetSignal.triggered, 'reset triggered');
  assert(r4.resetSignal.reason === 'substantial_rewrite', 'reason substantial_rewrite');
  assert(r4.history.snapshots.length === 1, `expected 1 snapshot after archive, got ${r4.history.snapshots.length}`);
  assert(r4.history.snapshots[0].sessionId === 's4', 'new snapshot present');
  assert(r4.history.archivedSnapshots === 3, `expected 3 archived, got ${r4.history.archivedSnapshots}`);
  assert(r4.history.resetEvents.length === 1, 'one reset event');
  assert(r4.history.resetEvents[0].priorSnapshotCount === 3, 'priorSnapshotCount=3');
  assert(r4.history.resetEvents[0].reason === 'substantial_rewrite', 'reason preserved');
});

test('writeSnapshot: topic_change is SOFT reset (keeps snapshots, records event)', () => {
  const profileA = makeProfile();
  const profileB = makeProfile();
  (profileB.admissionsPositioning as unknown as { archetypeContext: { archetype: string; poolDensity: string } })
    .archetypeContext = { archetype: 'immigrant identity', poolDensity: 'uncommon' };
  const r1 = writeSnapshot({ history: undefined, profile: profileA, sessionId: 's1', version: 1 });
  const r2 = writeSnapshot({
    history: r1.history,
    profile: profileB,
    sessionId: 's2',
    version: 2,
    // Prior text passed so we don't also trip substantial_rewrite by accident.
    priorEssayText: profileA.paragraphs.map((p) => p.text).join('\n\n'),
  });
  assert(r2.resetSignal.triggered, 'triggered');
  assert(r2.resetSignal.reason === 'topic_change', `reason=topic_change, got ${r2.resetSignal.reason}`);
  assert(r2.history.snapshots.length === 2, `soft reset keeps snapshots; got ${r2.history.snapshots.length}`);
  assert(r2.history.archivedSnapshots === 0, 'soft reset archives nothing');
  assert(r2.history.resetEvents.length === 1, 'records event');
  assert(r2.history.resetEvents[0].reason === 'topic_change', 'event reason topic_change');
});

test('writeSnapshot: manual_reset archives like substantial_rewrite', () => {
  const profile = makeProfile();
  let history: RevisionHistory | undefined = undefined;
  for (let i = 1; i <= 3; i++) {
    history = writeSnapshot({ history, profile, sessionId: `s${i}`, version: i }).history;
  }
  const r = writeSnapshot({
    history,
    profile,
    sessionId: 's4',
    version: 4,
    manualReset: true,
  });
  assert(r.resetSignal.reason === 'manual_reset', 'manual_reset reason');
  assert(r.history.snapshots.length === 1, 'prior archived');
  assert(r.history.archivedSnapshots === 3, 'archived count 3');
});

test('pruneToMax: caps at 10, excess counted in archivedSnapshots', () => {
  const profile = makeProfile();
  let history: RevisionHistory | undefined = undefined;
  for (let i = 1; i <= SNAPSHOT_HISTORY_MAX + 3; i++) {
    history = writeSnapshot({ history, profile, sessionId: `s${i}`, version: i }).history;
  }
  assert(history!.snapshots.length === SNAPSHOT_HISTORY_MAX, `cap at ${SNAPSHOT_HISTORY_MAX}, got ${history!.snapshots.length}`);
  assert(history!.archivedSnapshots === 3, `expected 3 archived from pruning, got ${history!.archivedSnapshots}`);
  // newest preserved, oldest dropped
  const firstId = history!.snapshots[0].sessionId;
  const lastId = history!.snapshots[history!.snapshots.length - 1].sessionId;
  assert(firstId === 's4', `oldest retained should be s4, got ${firstId}`);
  assert(lastId === `s${SNAPSHOT_HISTORY_MAX + 3}`, `newest should be s${SNAPSHOT_HISTORY_MAX + 3}, got ${lastId}`);
});

test('mostRecentSnapshot: convenience for current-vs-prior', () => {
  assert(mostRecentSnapshot(undefined) === null, 'undefined → null');
  assert(mostRecentSnapshot(emptyRevisionHistory()) === null, 'empty → null');
  const profile = makeProfile();
  const r1 = writeSnapshot({ history: undefined, profile, sessionId: 's1', version: 1 });
  const r2 = writeSnapshot({ history: r1.history, profile, sessionId: 's2', version: 2 });
  const last = mostRecentSnapshot(r2.history);
  assert(last !== null && last.sessionId === 's2', 'last is s2');
});

test('realistic snapshot size under 5 KB', () => {
  const profile = makeProfile();
  const snap = extractSnapshot(profile, 'size-test', 1);
  const bytes = Buffer.byteLength(JSON.stringify(snap), 'utf8');
  console.log(`  [size] snapshot JSON: ${bytes} bytes`);
  assert(bytes < 5000, `snapshot should be <5 KB, got ${bytes}`);
});

test('allDimensions: undefined on single-dim findings (size optimization)', () => {
  // All findings in the base fixture carry 1 or 2 dimensions; the 1-dim
  // ones should have NO allDimensions field present on the snapshot.
  const profile = makeProfile();
  const snap = extractSnapshot(profile, 'single-dim-test', 1);
  // F2 has dims ['emotion'] — only 1. F3 has dims ['theme'] — only 1.
  const f2 = snap.findings.find((f) => f.id === 'F2');
  const f3 = snap.findings.find((f) => f.id === 'F3');
  assert(f2, 'F2 present');
  assert(f3, 'F3 present');
  assert(f2!.allDimensions === undefined, `F2 allDimensions must be undefined for 1-dim finding, got ${JSON.stringify(f2!.allDimensions)}`);
  assert(f3!.allDimensions === undefined, `F3 allDimensions must be undefined for 1-dim finding, got ${JSON.stringify(f3!.allDimensions)}`);
  // F1 has ['voice', 'craft'] — 2 dims — allDimensions should be populated.
  const f1 = snap.findings.find((f) => f.id === 'F1');
  assert(f1, 'F1 present');
  assert(
    Array.isArray(f1!.allDimensions) && f1!.allDimensions!.includes('voice') && f1!.allDimensions!.includes('craft'),
    `F1 allDimensions must list both dims, got ${JSON.stringify(f1!.allDimensions)}`,
  );
});

test('allDimensions: populated snapshot stays under 2 KB on realistic case', () => {
  // Swap each finding in the fixture to carry 2 dimensions to exercise the
  // allDimensions path. Verify the resulting snapshot stays well under 2 KB
  // — the dims are short strings so the overhead should be small.
  const profile = makeProfile();
  const findings = (profile as unknown as { findings: Array<{ dimensions?: string[] }> }).findings;
  for (const f of findings) {
    f.dimensions = ['narrative_pacing', 'voice_mechanics'];
  }
  const snap = extractSnapshot(profile, 'multi-dim-test', 1);
  const bytes = Buffer.byteLength(JSON.stringify(snap), 'utf8');
  console.log(`  [size] multi-dim snapshot JSON: ${bytes} bytes`);
  assert(bytes < 2000, `multi-dim snapshot should stay under 2 KB, got ${bytes}`);
  // And every finding should now carry allDimensions.
  for (const sf of snap.findings) {
    assert(
      Array.isArray(sf.allDimensions) && sf.allDimensions!.length === 2,
      `every finding should have 2-dim allDimensions, got ${JSON.stringify(sf.allDimensions)}`,
    );
  }
});

// ─── report ─────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════════');
console.log('UNIT: snapshot infrastructure (Phase 1 — Revision History)');
console.log('═══════════════════════════════════════════════════════════════════');
for (const r of results) {
  const mark = r.pass ? '[PASS]' : '[FAIL]';
  console.log(`  ${mark} ${r.name}${r.detail ? `\n    ${r.detail.split('\n').join('\n    ')}` : ''}`);
}
const passed = results.filter((r) => r.pass).length;
console.log('───────────────────────────────────────────────────────────────────');
console.log(`  ${passed}/${results.length} passed`);
console.log('═══════════════════════════════════════════════════════════════════');
process.exit(passed === results.length ? 0 : 1);
