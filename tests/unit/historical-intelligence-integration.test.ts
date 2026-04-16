/**
 * historical-intelligence-integration.test.ts — Phase 4 end-to-end.
 *
 * Asserts the full Round 7 chain using the shared fixtures:
 *   Session 1 → Session 2 → Session 3 → Reset
 *
 * Exercises:
 *   - Session 1: null signals + empty coaching section
 *   - Session 2: addressed + persistent + pattern-level + non-empty section
 *   - Session 3: marker loss + over-revision warning + "OVER-REVISION WARNING"
 *     substring in the section output
 *   - Reset path: substantial_rewrite after session 3 archives history and
 *     drops revisionIntelligence back to null
 *
 * Run: npx tsx tests/unit/historical-intelligence-integration.test.ts
 */

import { computeRevisionIntelligence } from '../../src/services/essayIntelligence/history/revisionIntelligence';
import { computeVoiceEvolution } from '../../src/services/essayIntelligence/history/voiceEvolution';
import {
  writeSnapshot,
  readRecentSnapshots,
} from '../../src/services/essayIntelligence/history/snapshotStore';
import { historicalIntelligenceSection } from '../../src/services/essayIntelligence/coaching/promptBlocks';
import {
  SESSION1_PROFILE,
  SESSION2_PROFILE,
  SESSION3_PROFILE,
  ESSAY_TEXT_SESSION1,
  ESSAY_TEXT_SESSION2,
} from '../fixtures/historical-intelligence';
import type { RevisionHistory } from '../../src/services/essayIntelligence/history/profileSnapshot';
import type { EssayProfile } from '../../src/services/essayIntelligence/profileTypes';

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

// Helper: simulate the coordinator's end-of-analysis hook. Writes the snapshot
// for `profile` against `prior` history, then computes intelligence and
// attaches it to profile. Returns updated profile + history.
function captureSession(
  profile: EssayProfile,
  priorHistory: RevisionHistory | undefined,
  sessionId: string,
  version: number,
  priorEssayText: string | null,
): { history: RevisionHistory; resetSignal: ReturnType<typeof writeSnapshot>['resetSignal'] } {
  const writeResult = writeSnapshot({
    history: priorHistory,
    profile,
    sessionId,
    version,
    priorEssayText,
  });
  profile.revisionHistory = writeResult.history;
  const snapshots = writeResult.history.snapshots;
  profile.revisionIntelligence = computeRevisionIntelligence(profile, snapshots);
  profile.voiceEvolution = computeVoiceEvolution(profile, snapshots);
  return { history: writeResult.history, resetSignal: writeResult.resetSignal };
}

// ─── tests ───────────────────────────────────────────────────────────────────

test('Session 1: null signals + empty coaching section', () => {
  captureSession(SESSION1_PROFILE, undefined, 's1', 1, null);
  assert(SESSION1_PROFILE.revisionIntelligence === null, 'revisionIntelligence null on session 1');
  assert(SESSION1_PROFILE.voiceEvolution === null, 'voiceEvolution null on session 1');
  const section = historicalIntelligenceSection(null, null);
  assert(section === '', `section must be empty on session 1, got: "${section.slice(0, 80)}"`);
});

test('Session 2: addressed + persistent + pattern-level + non-empty section', () => {
  const afterSession1 = captureSession(SESSION1_PROFILE, undefined, 's1', 1, null);
  const afterSession2 = captureSession(
    SESSION2_PROFILE,
    afterSession1.history,
    's2',
    2,
    ESSAY_TEXT_SESSION1,
  );
  assert(!afterSession2.resetSignal.triggered, `no reset expected on session 2, got ${afterSession2.resetSignal.reason}`);

  const ri = SESSION2_PROFILE.revisionIntelligence;
  assert(ri !== null, 'revisionIntelligence non-null');

  // P2 was addressed — its anchor "I felt inspired" should no longer appear
  // in the session-2 essay text.
  const p2Addressed = ri!.addressedFindings.find(
    (a) => a.paragraph === 2 && a.craftCategory === 'tell_mode',
  );
  assert(p2Addressed, 'P2 tell_mode should be addressed');

  // P4 and P6 still have tell_mode findings in current — they should appear
  // as persistent (same category, same paragraph as prior snapshot).
  const p4Persistent = ri!.persistentFindings.find(
    (p) => p.paragraph === 4 && p.craftCategory === 'tell_mode',
  );
  const p6Persistent = ri!.persistentFindings.find(
    (p) => p.paragraph === 6 && p.craftCategory === 'tell_mode',
  );
  // At least one of the two must register as persistent.
  assert(p4Persistent || p6Persistent, 'P4 or P6 tell_mode should be persistent');

  // Pattern-level: current has 2 paragraphs (P4, P6). Spec requires >=3 →
  // pattern-level should NOT fire in session 2. This confirms the gating.
  assert(
    ri!.patternLevelIssues.length === 0,
    `pattern-level needs >=3 paragraphs; got ${ri!.patternLevelIssues.length}`,
  );

  const voiceEvo = SESSION2_PROFILE.voiceEvolution;
  assert(voiceEvo !== null, 'voiceEvolution non-null');
  // Session 2 has only one flattening transition at most — warning must NOT fire.
  assert(
    voiceEvo!.overRevisionWarning.triggered === false,
    'single-session flattening must NOT trigger over-revision',
  );

  const section = historicalIntelligenceSection(ri, voiceEvo);
  assert(section.length > 0, 'section non-empty on session 2');
  assert(section.includes('ACCUMULATED SIGNAL'), 'section header present');
});

test('Session 2 — pattern-level DOES fire when 3 instances exist', () => {
  // Synthetic variant of session 2 with a tell_mode finding at P8 added
  // alongside P4 + P6 to clear the >=3 paragraph threshold.
  const fakeSession2 = structuredClone(SESSION2_PROFILE);
  // Re-attach a synthetic tell_mode finding for a 3rd paragraph (P0).
  const synth = {
    ...fakeSession2.findings[0],
    id: 'FP0',
    scope: { type: 'paragraph' as const, paragraph: 0, textEvidence: [{ text: 'bolted phrase', location: { paragraph: 0 } }] },
    evidence: [{ text: 'bolted phrase', location: { paragraph: 0 }, type: 'present' as const }],
  };
  fakeSession2.findings = [...fakeSession2.findings, synth];
  // Reset revisionHistory so captureSession writes against a prior s1 chain.
  fakeSession2.revisionHistory = undefined;

  // Re-capture: session 1 → variant session 2.
  const s1Fresh = structuredClone(SESSION1_PROFILE);
  s1Fresh.revisionHistory = undefined;
  const after1 = captureSession(s1Fresh, undefined, 's1', 1, null);
  captureSession(fakeSession2, after1.history, 's2', 2, ESSAY_TEXT_SESSION1);

  const ri = fakeSession2.revisionIntelligence;
  assert(ri !== null, 'ri non-null');
  assert(ri!.patternLevelIssues.length >= 1, `expected >=1 pattern issue, got ${ri!.patternLevelIssues.length}`);
  const tellMode = ri!.patternLevelIssues.find((p) => p.craftCategory === 'tell_mode');
  assert(tellMode, 'tell_mode pattern present');
  assert(tellMode!.humanFraming.includes('?'), 'humanFraming contains ?');

  const section = historicalIntelligenceSection(ri, fakeSession2.voiceEvolution);
  assert(section.includes('Pattern-level issues worth surfacing'), 'section contains pattern line');
});

test('Session 3: marker loss + over-revision warning + section substring', () => {
  // Fresh chain: s1 → s2 → s3
  const s1 = structuredClone(SESSION1_PROFILE);
  const s2 = structuredClone(SESSION2_PROFILE);
  const s3 = structuredClone(SESSION3_PROFILE);
  s1.revisionHistory = undefined;
  s2.revisionHistory = undefined;
  s3.revisionHistory = undefined;

  const after1 = captureSession(s1, undefined, 's1', 1, null);
  const after2 = captureSession(s2, after1.history, 's2', 2, ESSAY_TEXT_SESSION1);
  const after3 = captureSession(s3, after2.history, 's3', 3, ESSAY_TEXT_SESSION2);
  assert(!after3.resetSignal.triggered, `no reset expected on session 3, got ${after3.resetSignal.reason}`);

  const voiceEvo = s3.voiceEvolution;
  assert(voiceEvo !== null, 'voiceEvolution non-null');
  assert(voiceEvo!.markersLostSincePrior.length > 0, 'markers lost must be >0');
  assert(
    voiceEvo!.overRevisionWarning.triggered === true,
    'over-revision warning must fire on session 3 (>=2 consecutive flattening)',
  );

  const ri = s3.revisionIntelligence;
  const section = historicalIntelligenceSection(ri, voiceEvo);
  assert(section.includes('OVER-REVISION WARNING'), 'section contains OVER-REVISION WARNING substring');
});

test('Reset path: substantial_rewrite archives history; intelligence returns null', () => {
  // Build s1 → s2 → s3, then overwrite with a brand new essay (low overlap).
  const s1 = structuredClone(SESSION1_PROFILE);
  const s2 = structuredClone(SESSION2_PROFILE);
  const s3 = structuredClone(SESSION3_PROFILE);
  s1.revisionHistory = undefined;
  s2.revisionHistory = undefined;
  s3.revisionHistory = undefined;
  const after1 = captureSession(s1, undefined, 's1', 1, null);
  const after2 = captureSession(s2, after1.history, 's2', 2, ESSAY_TEXT_SESSION1);
  const after3 = captureSession(s3, after2.history, 's3', 3, ESSAY_TEXT_SESSION2);

  // Construct a fully new profile with <30% token overlap against session 3.
  const newProfile = structuredClone(s3);
  newProfile.paragraphs = [
    { index: 0, text: 'Summer at my grandmother\'s kitchen smelled of cardamom and slow afternoons.' },
    { index: 1, text: 'Flour dusted every counter like snow and the radio played in Urdu and English in turns.' },
    { index: 2, text: 'Her recipes lived in her hands, not in notebooks, and I spent weeks learning to read them.' },
  ] as EssayProfile['paragraphs'];
  newProfile.findings = [];
  newProfile.revisionHistory = after3.history; // pass prior history into capture

  const priorHistoryCount = after3.history.snapshots.length;
  const afterReset = captureSession(
    newProfile,
    after3.history,
    's4',
    4,
    s3.paragraphs.map((p) => p.text).join('\n\n'),
  );

  assert(
    afterReset.resetSignal.triggered,
    `expected reset signal after low-overlap rewrite, got ${JSON.stringify(afterReset.resetSignal)}`,
  );
  assert(
    afterReset.resetSignal.reason === 'substantial_rewrite',
    `expected substantial_rewrite, got ${afterReset.resetSignal.reason}`,
  );
  assert(
    afterReset.history.archivedSnapshots >= priorHistoryCount,
    `expected archivedSnapshots >= ${priorHistoryCount}, got ${afterReset.history.archivedSnapshots}`,
  );
  // Post-reset the history holds only the new snapshot → compute returns null.
  assert(
    newProfile.revisionIntelligence === null,
    'revisionIntelligence must be null post-reset',
  );
  assert(
    newProfile.voiceEvolution === null,
    'voiceEvolution must be null post-reset',
  );
});

// ─── report ─────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════════');
console.log('UNIT: historical intelligence integration (Phase 4)');
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
