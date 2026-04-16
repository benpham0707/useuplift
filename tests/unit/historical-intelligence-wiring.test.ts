/**
 * historical-intelligence-wiring.test.ts — Round 7a FIX C.
 *
 * Closes the gap between "unit tests use hand-built ProfileSnapshot objects"
 * and "the pipeline actually emits snapshots the compute functions can read."
 * Every other suite in this phase tests one side of the contract — this
 * suite exercises the full path:
 *
 *   realistic EssayProfile → extractSnapshot → writeSnapshot →
 *   readRecentSnapshots → computeRevisionIntelligence / computeVoiceEvolution
 *   → historicalIntelligenceSection
 *
 * If the extraction side ever drifts from what the computation side expects
 * (field names, scope shape, dimensions ordering, anchor derivation), the
 * unit suites would still pass with their hand-built snapshots while the
 * real pipeline silently produces noise. This suite is the tripwire.
 *
 * Zero LLM calls — all fixtures are deterministic TypeScript.
 *
 * Run: npx tsx tests/unit/historical-intelligence-wiring.test.ts
 * Exit: 0 = pass, 1 = fail.
 */

import {
  extractSnapshot,
  type ProfileSnapshot,
  type RevisionHistory,
} from '../../src/services/essayIntelligence/history/profileSnapshot';
import {
  writeSnapshot,
  readRecentSnapshots,
} from '../../src/services/essayIntelligence/history/snapshotStore';
import { computeRevisionIntelligence } from '../../src/services/essayIntelligence/history/revisionIntelligence';
import { computeVoiceEvolution } from '../../src/services/essayIntelligence/history/voiceEvolution';
import { historicalIntelligenceSection } from '../../src/services/essayIntelligence/coaching/promptBlocks';
import type {
  EssayProfile,
  Finding,
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

// ─── realistic fixtures ─────────────────────────────────────────────────────

/**
 * Build a realistic Finding with the full live shape — paragraph scope,
 * evidence, lineage, maturity, etc. No shortcuts: if a field is required
 * on `Finding`, we populate it with a synthetic-but-plausible value. This
 * is what the wiring contract depends on.
 */
function buildFinding(args: {
  id: string;
  paragraph: number;
  sentence?: number;
  dims: string[];
  anchorText: string;
  maturity?: 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded';
}): Finding {
  const maturity = args.maturity ?? 'confirmed';
  const scopeType = args.sentence === undefined ? 'paragraph' : 'sentence';
  return {
    id: args.id,
    claim: `Finding ${args.id} — ${args.dims.join('/')} at P${args.paragraph}`,
    scope: {
      type: scopeType,
      paragraph: args.paragraph,
      sentences: args.sentence === undefined ? undefined : [args.sentence],
      textEvidence: [
        {
          text: args.anchorText,
          location: { paragraph: args.paragraph, sentence: args.sentence },
        },
      ],
    },
    maturity,
    maturityReasoning: `wiring fixture — ${maturity}`,
    coachingValue: 'high',
    dimensions: args.dims as Finding['dimensions'],
    buildsOn: [],
    relatedTo: [],
    source: 'walk',
    deepeningPotential: null,
    raisesQuestions: [],
    evidence: [
      {
        text: args.anchorText,
        location: { paragraph: args.paragraph, sentence: args.sentence },
        type: 'present',
      },
    ],
    lineage: [],
    createdAt: '2026-04-16T00:00:00.000Z',
    lastUpdated: '2026-04-16T00:00:00.000Z',
  } as Finding;
}

interface ProfileBuild {
  paragraphs: string[];
  findings: Finding[];
  voiceMarkers: string[];
  voiceWeaknesses: string[];
  registerShifts?: Array<{ paragraph: number; from: string; to: string; driver?: string }>;
}

function buildProfile(args: ProfileBuild): EssayProfile {
  const base = {
    index: {
      improvementPhase: {
        level: 'craft',
        reasoning: 'wiring fixture',
        focusAreas: ['tell→scene'],
        deferredAreas: [],
        readinessAssessment: 'iterating',
        legacyReadiness: {
          essayLevel: 3,
          paragraphLevel: 3,
          sentenceLevel: 2,
          wordLevel: 1,
        },
        dimensionPhases: [],
        coachingLens: 'tighten tell-mode',
        transition: null,
      },
    },
    paragraphs: args.paragraphs.map((text, i) => ({ index: i, text })),
    findings: args.findings,
    voiceIdentity: {
      signature: 'reflective voice',
      register: 'contemplative',
      distinctivePatterns: [],
      evolution: '',
      authenticVsPerformed: [],
      primaryRegister: 'contemplative',
      voiceMarkers: args.voiceMarkers,
      voiceWeaknesses: args.voiceWeaknesses,
      registerShifts: args.registerShifts ?? [],
    },
    admissionsPositioning: {
      archetypeContext: {
        archetype: 'music-as-life-metaphor',
        poolDensity: 'common',
        differentiator: 'AI DJ specificity',
      },
    },
    northStar: { activeScale: 'personal_statement' },
    metadata: {
      confidenceLevel: 'comprehensive',
      lastUpdatedLayer: 4,
      paragraphsCovered: args.paragraphs.map((_, i) => i),
      conversationInsightsCount: 0,
      totalAnalysisCost: 0,
      createdAt: '2026-04-16T00:00:00.000Z',
      lastMutatedAt: '2026-04-16T00:00:00.000Z',
      legacyProfile: false,
    },
  };
  return base as unknown as EssayProfile;
}

// Two sessions of the SAME essay. Paragraph bodies overlap heavily so the
// store does NOT trip substantial_rewrite across the boundary.
const BASE_P0 = 'The practice room hummed with the long decay of an E-minor chord as I opened my laptop.';
const BASE_P1 = 'My hands moved between piano keys and keyboard keys in a rhythm I had spent months teaching myself to trust.';
const BASE_P3 = 'Between drafts of the arrangement I ran my code again watching the spectrum analyzer paint the room.';

// Session 1: tell_mode (voice_mechanics) at P2 with anchor "I felt inspired by the craft".
const SESSION1_P2 = 'I felt inspired by the craft as software extended what a piano could say to a listener.';
const SESSION1_PARAGRAPHS = [BASE_P0, BASE_P1, SESSION1_P2, BASE_P3];

// Session 2: P2 rewritten (anchor gone, new finding with a multi-dim tag at P2).
const SESSION2_P2 = 'I pressed a chord with one hand and watched the waveform spike across my screen with the other.';
const SESSION2_PARAGRAPHS = [BASE_P0, BASE_P1, SESSION2_P2, BASE_P3];

// ─── tests ──────────────────────────────────────────────────────────────────

test('session 1: extract + write yields a snapshot the reader can see', () => {
  const profile1 = buildProfile({
    paragraphs: SESSION1_PARAGRAPHS,
    findings: [
      buildFinding({
        id: 'F1',
        paragraph: 2,
        dims: ['voice_mechanics', 'tell_mode'],
        anchorText: 'I felt inspired by the craft',
      }),
    ],
    voiceMarkers: ['em-dash pivots', 'concrete verbs', 'self-correction'],
    voiceWeaknesses: [],
  });

  // Pure extract path — no store.
  const snap = extractSnapshot(profile1, 's1', 1);
  assert(snap.sessionId === 's1', 'sessionId threaded');
  assert(snap.findings.length === 1, 'finding extracted');
  assert(snap.findings[0].craftCategory === 'voice_mechanics', 'primary dim = voice_mechanics');
  assert(
    Array.isArray(snap.findings[0].allDimensions) && snap.findings[0].allDimensions!.length === 2,
    'multi-dim finding should populate allDimensions',
  );
  assert(snap.voiceIdentitySnapshot.voiceMarkers.length === 3, 'voice markers threaded');

  // Store path — write and read back.
  const writeResult = writeSnapshot({
    history: undefined,
    profile: profile1,
    sessionId: 's1',
    version: 1,
  });
  const read = readRecentSnapshots(writeResult.history, 5);
  assert(read.length === 1, 'readRecentSnapshots sees the written snapshot');
  assert(read[0].sessionId === 's1', 'snapshot round-trip preserved sessionId');
  assert(read[0].findings[0].anchorText === 'I felt inspired by the craft', 'anchor round-trip');
});

test('session 2: compute reads session 1 snapshot, surfaces addressed + persistent', () => {
  // Build session 1 snapshot first.
  const profile1 = buildProfile({
    paragraphs: SESSION1_PARAGRAPHS,
    findings: [
      buildFinding({
        id: 'F1',
        paragraph: 2,
        dims: ['voice_mechanics', 'tell_mode'],
        anchorText: 'I felt inspired by the craft',
      }),
      // A second tell_mode finding at P3 so session 2 can mirror (cat, para)
      // and light up persistent detection cleanly.
      buildFinding({
        id: 'F2',
        paragraph: 3,
        dims: ['voice_mechanics'],
        anchorText: 'running my code again',
      }),
    ],
    voiceMarkers: ['em-dash pivots', 'concrete verbs', 'self-correction'],
    voiceWeaknesses: [],
  });
  const w1 = writeSnapshot({
    history: undefined,
    profile: profile1,
    sessionId: 's1',
    version: 1,
  });
  assert(w1.history.snapshots.length === 1, 'session 1 snapshot in store');

  // Session 2 — paragraph-2 anchor "I felt inspired by the craft" is GONE
  // from the essay text AND from the findings list (addressed). A new
  // finding at P3 mirrors the prior one by (cat, para) (persistent).
  const profile2 = buildProfile({
    paragraphs: SESSION2_PARAGRAPHS,
    findings: [
      buildFinding({
        id: 'F3',
        paragraph: 3,
        dims: ['voice_mechanics'],
        anchorText: 'running my code again',
      }),
    ],
    voiceMarkers: ['em-dash pivots', 'concrete verbs'],
    voiceWeaknesses: ['reaches for closure'],
  });

  // Write session 2 with priorEssayText so the reset detector compares
  // against the prior draft (high token overlap → no reset).
  const priorText1 = SESSION1_PARAGRAPHS.join('\n\n');
  const w2 = writeSnapshot({
    history: w1.history,
    profile: profile2,
    sessionId: 's2',
    version: 2,
    priorEssayText: priorText1,
  });
  assert(!w2.resetSignal.triggered, `no reset expected, got ${w2.resetSignal.reason}`);
  assert(w2.history.snapshots.length === 2, `session 2 store has 2 snapshots, got ${w2.history.snapshots.length}`);

  const chain: ProfileSnapshot[] = readRecentSnapshots(w2.history, 10);

  // Now run compute using the live compute entry points.
  const revIntel = computeRevisionIntelligence(profile2, chain);
  const voiceEvo = computeVoiceEvolution(profile2, chain);

  assert(revIntel !== null, 'revisionIntelligence non-null with 2 snapshots');
  assert(voiceEvo !== null, 'voiceEvolution non-null with 2 snapshots');

  // Session 1's F1 anchor is no longer in session 2 essay text and (voice_mechanics, P2)
  // is NOT in session 2 findings — so it should register addressed, not persistent.
  const addressedP2 = revIntel!.addressedFindings.find(
    (a) => a.craftCategory === 'voice_mechanics' && a.paragraph === 2,
  );
  assert(addressedP2, `expected (voice_mechanics, P2) addressed, got ${JSON.stringify(revIntel!.addressedFindings)}`);

  // (voice_mechanics, P3) was in prior AND current → persistent.
  const persistentP3 = revIntel!.persistentFindings.find(
    (p) => p.craftCategory === 'voice_mechanics' && p.paragraph === 3,
  );
  assert(persistentP3, `expected (voice_mechanics, P3) persistent, got ${JSON.stringify(revIntel!.persistentFindings)}`);

  // Marker diff: "self-correction" lost between s1 and s2.
  assert(
    voiceEvo!.markersLostSincePrior.includes('self-correction'),
    `expected self-correction lost, got ${JSON.stringify(voiceEvo!.markersLostSincePrior)}`,
  );

  // Coach section: reflects the signals and contains the expected header.
  const section = historicalIntelligenceSection(revIntel, voiceEvo);
  assert(section.length > 0, 'coach section non-empty with signals');
  assert(
    section.includes('ACCUMULATED SIGNAL FROM REVISION HISTORY'),
    `coach section missing header, got "${section.slice(0, 200)}"`,
  );
});

test('empty signals: historicalIntelligenceSection(null, null) returns ""', () => {
  const out = historicalIntelligenceSection(null, null);
  assert(out === '', `expected empty string, got "${out.slice(0, 80)}"`);
});

test('question-framing invariant: framings that fire contain "?"', () => {
  // Build a chain where pattern-level fires so we can inspect humanFraming.
  const mkP = (findings: Finding[], markers: string[]): EssayProfile =>
    buildProfile({
      paragraphs: SESSION1_PARAGRAPHS,
      findings,
      voiceMarkers: markers,
      voiceWeaknesses: [],
    });

  const p1 = mkP(
    [
      buildFinding({ id: 'S1F1', paragraph: 0, dims: ['tell_mode'], anchorText: 'seed a0' }),
    ],
    ['em-dash pivots', 'concrete verbs', 'self-correction'],
  );
  const p2 = mkP(
    [
      buildFinding({ id: 'S2F1', paragraph: 0, dims: ['tell_mode'], anchorText: 'stall a1' }),
      buildFinding({ id: 'S2F2', paragraph: 1, dims: ['tell_mode'], anchorText: 'stall b1' }),
      buildFinding({ id: 'S2F3', paragraph: 2, dims: ['tell_mode'], anchorText: 'stall c1' }),
    ],
    ['em-dash pivots', 'concrete verbs', 'self-correction'],
  );
  const w1 = writeSnapshot({ history: undefined, profile: p1, sessionId: 'w1', version: 1 });
  const w2 = writeSnapshot({
    history: w1.history,
    profile: p2,
    sessionId: 'w2',
    version: 2,
    priorEssayText: SESSION1_PARAGRAPHS.join('\n\n'),
  });
  const chain: ProfileSnapshot[] = readRecentSnapshots(w2.history, 10);
  const revIntel = computeRevisionIntelligence(p2, chain);
  assert(revIntel !== null, 'not null');
  assert(revIntel!.patternLevelIssues.length >= 1, `expected >=1 pattern issue, got ${revIntel!.patternLevelIssues.length}`);
  for (const p of revIntel!.patternLevelIssues) {
    assert(p.humanFraming.includes('?'), `humanFraming must contain '?', got "${p.humanFraming}"`);
  }
});

// ─── report ─────────────────────────────────────────────────────────────────

// Guard against unused `RevisionHistory` import when tsc checks strictness.
export type __TouchHistoryType = RevisionHistory;

console.log('═══════════════════════════════════════════════════════════════════');
console.log('UNIT: historical intelligence wiring (Round 7a FIX C)');
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
