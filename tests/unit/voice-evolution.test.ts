/**
 * voice-evolution.test.ts — Phase 2b regression.
 *
 * Covers `computeVoiceEvolution`:
 *   - Null-history / single-snapshot → null
 *   - Marker diff: lost + gained populated correctly
 *   - Over-revision warning fires on >=2 consecutive flattening transitions
 *   - Single-session flattening does NOT trigger the warning
 *   - Intentional shift (markers swapped + register stable) detected
 *   - Intentional shift takes precedence over over-revision warning
 *   - All pre-composed framings contain '?'
 *
 * Run: npx tsx tests/unit/voice-evolution.test.ts
 */

import { computeVoiceEvolution } from '../../src/services/essayIntelligence/history/voiceEvolution';
import { writeSnapshot } from '../../src/services/essayIntelligence/history/snapshotStore';
import type {
  EssayProfile,
} from '../../src/services/essayIntelligence/profileTypes';
import type { ProfileSnapshot } from '../../src/services/essayIntelligence/history/profileSnapshot';

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

interface VoiceShape {
  voiceMarkers: string[];
  voiceWeaknesses: string[];
  registerShifts?: Array<{ paragraph: number; from: string; to: string; driver?: string }>;
}

function mkProfile(paragraphTexts: string[], voice: VoiceShape): EssayProfile {
  const base = {
    index: {
      improvementPhase: {
        level: 'craft',
        reasoning: '',
        focusAreas: [],
        deferredAreas: [],
        readinessAssessment: '',
        legacyReadiness: { essayLevel: 3, paragraphLevel: 3, sentenceLevel: 2, wordLevel: 1 },
        dimensionPhases: [],
        coachingLens: '',
        transition: null,
      },
    },
    paragraphs: paragraphTexts.map((text, i) => ({ index: i, text })),
    findings: [],
    voiceIdentity: {
      signature: '',
      register: 'reflective',
      distinctivePatterns: [],
      evolution: '',
      authenticVsPerformed: [],
      primaryRegister: 'reflective',
      voiceMarkers: voice.voiceMarkers,
      voiceWeaknesses: voice.voiceWeaknesses,
      registerShifts: voice.registerShifts ?? [],
    },
    admissionsPositioning: {
      archetypeContext: {
        archetype: 'test',
        poolDensity: 'common',
        differentiator: '',
      },
    },
    metadata: {
      confidenceLevel: 'comprehensive',
      lastUpdatedLayer: 4,
      paragraphsCovered: paragraphTexts.map((_, i) => i),
      conversationInsightsCount: 0,
      totalAnalysisCost: 0,
      createdAt: '2026-04-16T00:00:00.000Z',
      lastMutatedAt: '2026-04-16T00:00:00.000Z',
      legacyProfile: false,
    },
  };
  return base as unknown as EssayProfile;
}

function buildSnapshotChain(profiles: EssayProfile[]): ProfileSnapshot[] {
  let history = undefined as ReturnType<typeof writeSnapshot>['history'] | undefined;
  let priorText: string | null = null;
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const text = p.paragraphs.map((pp) => pp.text).join('\n\n');
    const r = writeSnapshot({
      history,
      profile: p,
      sessionId: `s${i + 1}`,
      version: i + 1,
      priorEssayText: priorText,
    });
    history = r.history;
    priorText = text;
  }
  return history ? [...history.snapshots] : [];
}

// Three canonical voice shapes. Sized so `deriveVividness` from snapshot
// extraction yields the desired signal deterministically.
const VIVID = {
  voiceMarkers: ['em-dash pivots', 'concrete verbs', 'self-correction', 'parataxis'],
  voiceWeaknesses: [],
};
const BALANCED = {
  voiceMarkers: ['em-dash pivots', 'concrete verbs'],
  voiceWeaknesses: ['reaches for "resonant"'],
};
const FLATTENED = {
  voiceMarkers: ['em-dash pivots'],
  voiceWeaknesses: ['abstract closings', 'reaches for "resonant"', 'philosophical fog'],
};

// Text large enough that high token overlap prevents substantial_rewrite
// from archiving history across sessions.
const STABLE_TEXT = [
  'The morning light hit the practice room like a slow reveal, and I opened my laptop.',
  'Composing is like solving a puzzle, each piece clicking into rhythm and harmony.',
  'Reimagining classical pieces by infusing modern elements became my favorite endeavor.',
  'As I explored music complexities I noticed parallels with code and logic.',
  'Whether at a piano or a computer I am driven to create and explore.',
];

// ─── tests ───────────────────────────────────────────────────────────────────

test('null-history: empty → null', () => {
  const profile = mkProfile(STABLE_TEXT, VIVID);
  const out = computeVoiceEvolution(profile, []);
  assert(out === null, 'expected null');
});

test('single-snapshot history → null', () => {
  const profile = mkProfile(STABLE_TEXT, VIVID);
  const chain = buildSnapshotChain([profile]);
  const out = computeVoiceEvolution(profile, chain);
  assert(out === null, `single snapshot should return null, got ${JSON.stringify(out)}`);
});

test('marker diff: lost + gained sets correct', () => {
  const v1 = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'concrete verbs', 'self-correction'],
    voiceWeaknesses: [],
  });
  const v2 = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'new sensory hooks'],
    voiceWeaknesses: [],
  });
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeVoiceEvolution(v2, chain);
  assert(out !== null, 'not null');
  assert(out!.markersLostSincePrior.includes('concrete verbs'), 'lost "concrete verbs"');
  assert(out!.markersLostSincePrior.includes('self-correction'), 'lost "self-correction"');
  assert(out!.markersGainedSincePrior.includes('new sensory hooks'), 'gained "new sensory hooks"');
});

test('over-revision warning DOES NOT fire on single flattening transition', () => {
  const v1 = mkProfile(STABLE_TEXT, VIVID);
  const v2 = mkProfile(STABLE_TEXT, FLATTENED);
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeVoiceEvolution(v2, chain);
  assert(out !== null, 'not null');
  assert(out!.vividnessTrajectory === 'flattening', 'trajectory flattening');
  assert(out!.overRevisionWarning.triggered === false, 'single-transition flattening must NOT fire');
});

test('over-revision warning FIRES on >=2 consecutive flattening transitions', () => {
  // Timeline: vivid → balanced → flattened → flattened (current)
  // Transitions: vivid→balanced (flattening), balanced→flattened (flattening),
  //              flattened→flattened (maintained)
  // We want the MOST RECENT two transitions to both be flattening. So use:
  //   v1: vivid
  //   v2: balanced
  //   v3: flattened
  //   current profile: flattened (which maps to same flattened — "maintained")
  // That's 1 flattening + 1 flattening + 1 maintained at the end. The last 2
  // transitions are (balanced→flattened = flattening) + (flattened→flattened
  // = maintained) — doesn't trigger.
  //
  // To get two CONSECUTIVE flattening transitions ending at the current
  // transition, use: v1 vivid → v2 vivid → v3 balanced → current flattened.
  // Transitions: maintained, flattening, flattening → last two flattening. FIRES.
  const v1 = mkProfile(STABLE_TEXT, VIVID);
  const v2 = mkProfile(STABLE_TEXT, VIVID);
  const v3 = mkProfile(STABLE_TEXT, BALANCED);
  const current = mkProfile(STABLE_TEXT, FLATTENED);
  const chain = buildSnapshotChain([v1, v2, v3, current]);
  assert(chain.length === 4, `expected 4 snapshots, got ${chain.length}`);
  const out = computeVoiceEvolution(current, chain);
  assert(out !== null, 'not null');
  assert(out!.overRevisionWarning.triggered === true, 'must fire on 2 consecutive flattening');
  assert(out!.overRevisionWarning.framingForCoach !== null, 'framing non-null');
  assert(out!.overRevisionWarning.framingForCoach!.includes('?'), 'framing must contain ?');
});

test('intentional shift: markers swapped + stable register → detected, warning suppressed', () => {
  // Register shifts must be stable (same count across snaps + current).
  // We use 1 register shift in every snapshot so the trend is 'stable'.
  const shifts = [{ paragraph: 3, from: 'contemplative', to: 'expository' }];
  const v1 = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'concrete verbs'],
    voiceWeaknesses: [],
    registerShifts: shifts,
  });
  const v2 = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'concrete verbs'],
    voiceWeaknesses: [],
    registerShifts: shifts,
  });
  // v3 transitions from balanced vividness → flattened for a single step
  // AND swaps markers. Because register stays stable, the intentional-
  // shift detector should fire and suppress the over-revision warning.
  const v3 = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'sensory timestamps'], // "concrete verbs" lost, "sensory timestamps" gained
    voiceWeaknesses: [],
    registerShifts: shifts,
  });
  const current = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['sensory timestamps', 'new distinct move'], // "em-dash pivots" lost, "new distinct move" gained
    voiceWeaknesses: [],
    registerShifts: shifts,
  });
  const chain = buildSnapshotChain([v1, v2, v3, current]);
  const out = computeVoiceEvolution(current, chain);
  assert(out !== null, 'not null');
  assert(out!.intentionalShift.detected === true, 'intentional shift must be detected');
  // Even if vividness trajectory shows flattening somewhere, intentional
  // shift should suppress the warning.
  assert(
    out!.overRevisionWarning.triggered === false,
    'intentional shift must suppress over-revision warning',
  );
});

test('deliberate trimming (lost>0, gained=0) with stable vividness → intentional, no warning', () => {
  // Fixture: two snapshots, both VIVID on vividness. The student drops a
  // marker between them without adding anything new. Because vividness is
  // 'maintained' (not flattening), this is controlled trimming — NOT
  // over-revision. Warning must stay off.
  const v1 = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'concrete verbs', 'self-correction', 'parataxis'],
    voiceWeaknesses: [],
  });
  const current = mkProfile(STABLE_TEXT, {
    voiceMarkers: ['em-dash pivots', 'concrete verbs', 'self-correction'], // 'parataxis' trimmed
    voiceWeaknesses: [],
  });
  const chain = buildSnapshotChain([v1, current]);
  const out = computeVoiceEvolution(current, chain);
  assert(out !== null, 'not null');
  assert(out!.markersLostSincePrior.includes('parataxis'), 'lost parataxis');
  assert(out!.markersGainedSincePrior.length === 0, 'no new markers');
  assert(out!.vividnessTrajectory !== 'flattening', `vividness should not be flattening, got ${out!.vividnessTrajectory}`);
  assert(out!.intentionalShift.detected === true, 'intentional shift (trimming) must be detected');
  const reasoning = out!.intentionalShift.reasoning ?? '';
  assert(
    /trim|controlled|removed/i.test(reasoning),
    `trimming reasoning should mention trim/controlled/removed, got "${reasoning}"`,
  );
  assert(out!.overRevisionWarning.triggered === false, 'warning must stay off when trimming is controlled');
});

test('trimming with FLATTENING vividness → intentional OFF, over-revision fires', () => {
  // Fixture: vivid → vivid → balanced → current=flattened with markers
  // progressively trimmed and NO new ones added. That's the failure mode —
  // polishing the life out of an essay. Intentional-shift must NOT swallow
  // this case; the over-revision warning must fire.
  const v1 = mkProfile(STABLE_TEXT, VIVID);
  const v2 = mkProfile(STABLE_TEXT, VIVID); // vivid
  const v3 = mkProfile(STABLE_TEXT, BALANCED); // balanced
  const current = mkProfile(STABLE_TEXT, FLATTENED); // flattened
  const chain = buildSnapshotChain([v1, v2, v3, current]);
  const out = computeVoiceEvolution(current, chain);
  assert(out !== null, 'not null');
  // FLATTENED has 1 marker + 3 weaknesses — markers have been dropped across
  // the chain, no gains. Vividness trajectory at the final transition is
  // balanced→flattened = 'flattening'.
  assert(out!.vividnessTrajectory === 'flattening', `expected flattening, got ${out!.vividnessTrajectory}`);
  assert(out!.markersGainedSincePrior.length === 0, 'no gains');
  assert(out!.markersLostSincePrior.length > 0, 'markers lost');
  assert(
    out!.intentionalShift.detected === false,
    'intentional shift must be OFF when vividness is flattening',
  );
  assert(
    out!.overRevisionWarning.triggered === true,
    'over-revision warning must fire on flattening + trimming',
  );
});

test('all pre-composed framings contain ? when present', () => {
  const v1 = mkProfile(STABLE_TEXT, VIVID);
  const v2 = mkProfile(STABLE_TEXT, VIVID);
  const v3 = mkProfile(STABLE_TEXT, BALANCED);
  const current = mkProfile(STABLE_TEXT, FLATTENED);
  const chain = buildSnapshotChain([v1, v2, v3, current]);
  const out = computeVoiceEvolution(current, chain);
  assert(out !== null, 'not null');
  if (out!.overRevisionWarning.framingForCoach) {
    assert(out!.overRevisionWarning.framingForCoach.includes('?'), 'framing contains ?');
  }
});

// ─── report ─────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════════');
console.log('UNIT: voice evolution (Phase 2b)');
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
