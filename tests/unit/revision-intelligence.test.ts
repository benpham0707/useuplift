/**
 * revision-intelligence.test.ts — Phase 2a regression.
 *
 * Covers the pure `computeRevisionIntelligence` surface:
 *   - Null-history and single-snapshot history return null (no basis)
 *   - Addressed detection: prior anchor text gone from current essay
 *   - Persistent detection: same (category, paragraph) in prior AND current
 *   - Regression detection: category present → absent → present again
 *   - Pattern-level: >=3 paragraphs in current + >=2-session signal +
 *     humanFraming contains '?'
 *   - Velocity: fastestAddress / medianTurnsToAddress populated
 *   - summaryForCoach non-empty when signals exist, empty when none
 *
 * Run: npx tsx tests/unit/revision-intelligence.test.ts
 * Exit: 0 = pass, 1 = fail.
 */

import { computeRevisionIntelligence } from '../../src/services/essayIntelligence/history/revisionIntelligence';
import { writeSnapshot } from '../../src/services/essayIntelligence/history/snapshotStore';
import type {
  EssayProfile,
  Finding,
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

function mkFinding(
  id: string,
  paragraph: number,
  sentence: number | null,
  dims: string[],
  anchorText: string,
  maturity: 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded' = 'confirmed',
): Finding {
  return {
    id,
    claim: `Claim ${id}`,
    scope: {
      type: sentence === null ? 'paragraph' : 'sentence',
      paragraph,
      sentences: sentence === null ? undefined : [sentence],
      textEvidence: [
        { text: anchorText, location: { paragraph, sentence: sentence ?? undefined } },
      ],
    },
    maturity,
    maturityReasoning: 'test',
    coachingValue: 'high',
    dimensions: dims as Finding['dimensions'],
    buildsOn: [],
    relatedTo: [],
    source: 'walk',
    deepeningPotential: null,
    raisesQuestions: [],
    evidence: [
      {
        text: anchorText,
        location: { paragraph, sentence: sentence ?? undefined },
        type: 'present',
      },
    ],
    lineage: [],
    createdAt: '2026-04-16T00:00:00.000Z',
    lastUpdated: '2026-04-16T00:00:00.000Z',
  } as Finding;
}

function mkProfile(
  paragraphTexts: string[],
  findings: Finding[],
): EssayProfile {
  const base = {
    index: {
      improvementPhase: {
        level: 'craft',
        reasoning: 'test',
        focusAreas: [],
        deferredAreas: [],
        readinessAssessment: 'test',
        legacyReadiness: {
          essayLevel: 3,
          paragraphLevel: 3,
          sentenceLevel: 2,
          wordLevel: 1,
        },
        dimensionPhases: [],
        coachingLens: 'test',
        transition: null,
      },
    },
    paragraphs: paragraphTexts.map((text, i) => ({ index: i, text })),
    findings,
    voiceIdentity: {
      signature: 'voice',
      register: 'reflective',
      distinctivePatterns: [],
      evolution: '',
      authenticVsPerformed: [],
      primaryRegister: 'reflective',
      voiceMarkers: ['m1'],
      voiceWeaknesses: [],
      registerShifts: [],
    },
    admissionsPositioning: {
      archetypeContext: {
        archetype: 'test archetype',
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

/**
 * Compose a sequence of (profile, essayText) tuples into a snapshot chain.
 * Simulates what the coordinator would produce over sessions 1..N.
 */
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

// ─── tests ───────────────────────────────────────────────────────────────────

test('null-history: empty → null', () => {
  const profile = mkProfile(['p0'], []);
  const out = computeRevisionIntelligence(profile, []);
  assert(out === null, 'expected null for empty history');
});

test('single-snapshot history → null', () => {
  const profile = mkProfile(['p0'], []);
  const chain = buildSnapshotChain([profile]);
  assert(chain.length === 1, 'sanity: 1 snapshot built');
  const out = computeRevisionIntelligence(profile, chain);
  assert(out === null, 'single-snapshot must return null');
});

test('addressed detection: prior anchor gone from current essay', () => {
  const essayV1Text = 'Alpha paragraph with program-note language about music.';
  const essayV2Text = 'Alpha paragraph rewritten with grounded scene work about music.';
  const v1 = mkProfile(
    [essayV1Text],
    [mkFinding('F1', 0, 0, ['voice', 'craft'], 'program-note language')],
  );
  const v2 = mkProfile(
    [essayV2Text],
    [], // no findings this session — assume it was resolved
  );
  const chain = buildSnapshotChain([v1, v2]);
  assert(chain.length === 2, 'need both snapshots');

  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'should not be null');
  const addressed = out!.addressedFindings;
  assert(addressed.length >= 1, `expected >=1 addressed, got ${addressed.length}`);
  const match = addressed.find((a) => a.anchorTextBefore === 'program-note language');
  assert(match, 'expected F1 anchor among addressed');
  assert(match!.craftCategory === 'voice', 'category voice');
  assert(match!.paragraph === 0, 'paragraph 0');
  assert(match!.turnsToAddress >= 1, `turnsToAddress >=1, got ${match!.turnsToAddress}`);
});

test('persistent detection: (category, paragraph) in prior AND current', () => {
  const t = 'shared paragraph text about music';
  const v1 = mkProfile(
    [t, t, t],
    [mkFinding('F1', 1, null, ['craft'], 'snippet A')],
  );
  const v2 = mkProfile(
    [t, t, t],
    [mkFinding('F9', 1, null, ['craft'], 'snippet A')], // same (craft, 1) again
  );
  const chain = buildSnapshotChain([v1, v2]);

  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');
  const persistent = out!.persistentFindings;
  assert(persistent.length === 1, `expected 1 persistent, got ${persistent.length}`);
  assert(persistent[0].craftCategory === 'craft', 'category craft');
  assert(persistent[0].paragraph === 1, 'paragraph 1');
  assert(persistent[0].sessionsPersisted >= 2, `sessionsPersisted >=2, got ${persistent[0].sessionsPersisted}`);
});

test('regression detection: addressed then reappears', () => {
  const t = 'paragraph text about something';
  // S1: voice finding at P2
  const v1 = mkProfile(
    [t, t, t, t, t],
    [mkFinding('F1', 2, null, ['voice'], 'snip1')],
  );
  // S2: finding absent (no voice findings anywhere)
  const v2 = mkProfile(
    [t, t, t, t, t],
    [mkFinding('F2', 0, null, ['craft'], 'other snip')],
  );
  // S3: finding absent again
  const v3 = mkProfile(
    [t, t, t, t, t],
    [mkFinding('F3', 0, null, ['craft'], 'other snip 2')],
  );
  // S4: voice finding at P2 returns
  const v4 = mkProfile(
    [t, t, t, t, t],
    [mkFinding('F4', 2, null, ['voice'], 'snip4')],
  );
  const chain = buildSnapshotChain([v1, v2, v3, v4]);

  const out = computeRevisionIntelligence(v4, chain);
  assert(out !== null, 'not null');
  const regressions = out!.regressionEvents;
  const hit = regressions.find(
    (r) => r.craftCategory === 'voice' && r.paragraph === 2,
  );
  assert(hit, `expected regression for voice at P2, got ${JSON.stringify(regressions)}`);
  assert(hit!.reasoning.length > 0, 'reasoning non-empty');
  assert(
    hit!.reappearedAtSession > hit!.previouslyAddressedAtSession,
    'reappeared > previouslyAddressed',
  );
});

test('pattern-level: 3 paragraphs + prior-snapshot presence + humanFraming has ?', () => {
  const t = 'generic text';
  // S1: tell_mode at P1 (seed prior-snapshot presence)
  const v1 = mkProfile(
    [t, t, t, t, t, t, t],
    [mkFinding('F1', 1, null, ['tell_mode'], 'snip1')],
  );
  // S2: tell_mode at P2, P4, P6 — cluster of 3
  const v2 = mkProfile(
    [t, t, t, t, t, t, t],
    [
      mkFinding('F2', 2, null, ['tell_mode'], 'snip2'),
      mkFinding('F3', 4, null, ['tell_mode'], 'snip3'),
      mkFinding('F4', 6, null, ['tell_mode'], 'snip4'),
    ],
  );
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');
  const issues = out!.patternLevelIssues;
  assert(issues.length >= 1, `expected >=1 issue, got ${issues.length}`);
  const tellMode = issues.find((i) => i.craftCategory === 'tell_mode');
  assert(tellMode, 'expected tell_mode pattern');
  assert(tellMode!.instances.length === 3, `expected 3 instances, got ${tellMode!.instances.length}`);
  assert(tellMode!.humanFraming.includes('?'), 'humanFraming MUST contain ?');
});

test('pattern-level: <3 instances does NOT fire', () => {
  const t = 'generic';
  const v1 = mkProfile([t, t, t], [mkFinding('F1', 1, null, ['tell_mode'], 'a')]);
  const v2 = mkProfile(
    [t, t, t],
    [mkFinding('F2', 2, null, ['tell_mode'], 'b')], // only 1 in current
  );
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');
  assert(out!.patternLevelIssues.length === 0, 'single-paragraph cluster must NOT fire');
});

test('velocity: fastest + median populated when addressed findings exist', () => {
  // We need two addressed findings with DIFFERENT turn counts. Keep essay
  // text overlap high across revisions so substantial_rewrite does not
  // archive history.
  //
  // v1: introduces anchor "tangled-one" in P0 and anchor "tangled-two" in P2.
  // v2: anchor-one is GONE from text (addressed at 1 turn), anchor-two
  //     still present, both findings preserved in s2's anchor snapshot
  //     so we can compute the "addressed" event against either.
  // v3: anchor-two is also GONE (addressed at 2 turns from v1).
  const v1 = mkProfile(
    [
      'shared prose stays stable tangled-one more shared prose here',
      'stable middle paragraph with stable middle content',
      'shared prose stays stable tangled-two more shared prose here',
    ],
    [
      mkFinding('F1', 0, null, ['voice'], 'tangled-one'),
      mkFinding('F2', 2, null, ['craft'], 'tangled-two'),
    ],
  );
  const v2 = mkProfile(
    [
      'shared prose stays stable grounded-one more shared prose here',
      'stable middle paragraph with stable middle content',
      'shared prose stays stable tangled-two more shared prose here',
    ],
    [mkFinding('FNew', 2, null, ['craft'], 'tangled-two')],
  );
  const v3 = mkProfile(
    [
      'shared prose stays stable grounded-one more shared prose here',
      'stable middle paragraph with stable middle content',
      'shared prose stays stable grounded-two more shared prose here',
    ],
    [],
  );
  const chain = buildSnapshotChain([v1, v2, v3]);
  assert(chain.length === 3, `expected 3 snapshots, got ${chain.length}`);
  const out = computeRevisionIntelligence(v3, chain);
  assert(out !== null, 'not null');

  // F1 addressed at 2 turns (from v1 → v3, disappeared at v2 so turns=2)
  // F2 addressed at 1 turn (present in v1, v2; absent in v3)
  assert(out!.addressedFindings.length >= 2, `expected >=2 addressed, got ${out!.addressedFindings.length}`);

  const vel = out!.revisionVelocity;
  assert(vel !== null, 'velocity non-null');
  assert(vel!.fastestAddress !== null, 'fastestAddress non-null');
  assert(
    typeof vel!.medianTurnsToAddress === 'number' && (vel!.medianTurnsToAddress as number) > 0,
    'medianTurnsToAddress > 0',
  );
});

test('addressed/persistent dedup: rewritten anchor with same (cat, para) → persistent only', () => {
  // v1 has tell_mode at P2 with anchor "old tell phrase here".
  // v2 has tell_mode at P2 with anchor "new grounded scene" and the essay
  // text has been rewritten so "old tell phrase here" is no longer present.
  // Expected: persistent fires on (tell_mode, P2); addressed is deduped away.
  const v1 = mkProfile(
    ['stable intro text here', 'stable middle text here', 'stable tail with old tell phrase here'],
    [mkFinding('F1', 2, null, ['tell_mode'], 'old tell phrase here')],
  );
  const v2 = mkProfile(
    ['stable intro text here', 'stable middle text here', 'stable tail with new grounded scene'],
    [mkFinding('F2', 2, null, ['tell_mode'], 'new grounded scene')],
  );
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');

  const persistentP2 = out!.persistentFindings.find(
    (p) => p.craftCategory === 'tell_mode' && p.paragraph === 2,
  );
  assert(persistentP2, 'P2 tell_mode must register as persistent');

  const addressedP2 = out!.addressedFindings.find(
    (a) => a.craftCategory === 'tell_mode' && a.paragraph === 2,
  );
  assert(
    !addressedP2,
    `addressedFindings should NOT contain (tell_mode, P2) once persistent fires there, got ${JSON.stringify(addressedP2)}`,
  );
});

test('persistent: paragraph reorder detected via secondary anchor match', () => {
  // v1 has tell_mode at P2 with anchor "X shared phrase present text".
  // v2 has tell_mode at P4 with the SAME anchor — same issue, just moved.
  // Expected: persistent[0].paragraph === 4, movedFromParagraph === 2.
  const t = 'paragraph body text that stays stable here';
  const v1 = mkProfile(
    [t, t, `${t} X shared phrase present text tail`, t, t, t, t],
    [mkFinding('F1', 2, null, ['tell_mode'], 'X shared phrase present text')],
  );
  const v2 = mkProfile(
    [t, t, t, t, `${t} X shared phrase present text tail`, t, t],
    [mkFinding('F9', 4, null, ['tell_mode'], 'X shared phrase present text')],
  );
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');

  const moved = out!.persistentFindings.find(
    (p) => p.craftCategory === 'tell_mode' && p.paragraph === 4,
  );
  assert(moved, `expected persistent at P4, got ${JSON.stringify(out!.persistentFindings)}`);
  assert(moved!.movedFromParagraph === 2, `movedFromParagraph expected 2, got ${moved!.movedFromParagraph}`);
});

test('persistent: secondary match requires anchor match — different anchor at new paragraph NOT persistent', () => {
  // v1 tell_mode at P2, anchor "X".
  // v2 tell_mode at P4, anchor "completely different text".
  // Primary (cat, para) fails (P2 ≠ P4). Secondary (cat, anchor) fails
  // because anchors differ. Result: NOT persistent by either path. Because
  // the anchor "X" is no longer in the essay text, addressed may still fire
  // — that's acceptable per the spec.
  const t = 'stable body text';
  const v1 = mkProfile(
    [t, t, `${t} X tail`, t, t, t, t],
    [mkFinding('F1', 2, null, ['tell_mode'], 'X')],
  );
  const v2 = mkProfile(
    [t, t, t, t, `${t} completely different text tail`, t, t],
    [mkFinding('F9', 4, null, ['tell_mode'], 'completely different text')],
  );
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');

  const falseMoved = out!.persistentFindings.find(
    (p) => p.craftCategory === 'tell_mode' && p.paragraph === 4,
  );
  assert(
    !falseMoved,
    `tell_mode at P4 with disjoint anchor must NOT register as persistent, got ${JSON.stringify(falseMoved)}`,
  );
});

test('pattern-level: multi-dimension finding fires on each passing dimension', () => {
  // Construct a chain where two dimensions each independently pass the
  // (>=3 paragraphs in current) + (>=2 session) gates.
  // v1 (prior): 3 findings on [narrative_pacing, voice_mechanics] at P0/P2/P4
  //             to seed BOTH dimensions in the prior snapshot's allDimensions.
  // v2 (current): 3 findings on [narrative_pacing, voice_mechanics] at P2/P4/P6
  //             to clear the >=3 paragraph gate in the CURRENT profile.
  const t = 'stable text body repeated';
  const v1 = mkProfile(
    [t, t, t, t, t, t, t],
    [
      mkFinding('F1', 0, null, ['narrative_pacing', 'voice_mechanics'], 'a1'),
      mkFinding('F2', 2, null, ['narrative_pacing', 'voice_mechanics'], 'a2'),
      mkFinding('F3', 4, null, ['narrative_pacing', 'voice_mechanics'], 'a3'),
    ],
  );
  const v2 = mkProfile(
    [t, t, t, t, t, t, t],
    [
      mkFinding('F4', 2, null, ['narrative_pacing', 'voice_mechanics'], 'b1'),
      mkFinding('F5', 4, null, ['narrative_pacing', 'voice_mechanics'], 'b2'),
      mkFinding('F6', 6, null, ['narrative_pacing', 'voice_mechanics'], 'b3'),
    ],
  );
  const chain = buildSnapshotChain([v1, v2]);
  const out = computeRevisionIntelligence(v2, chain);
  assert(out !== null, 'not null');

  const hitPacing = out!.patternLevelIssues.find((p) => p.craftCategory === 'narrative_pacing');
  const hitMech = out!.patternLevelIssues.find((p) => p.craftCategory === 'voice_mechanics');
  assert(hitPacing, `expected narrative_pacing pattern, got ${JSON.stringify(out!.patternLevelIssues)}`);
  assert(hitMech, `expected voice_mechanics pattern, got ${JSON.stringify(out!.patternLevelIssues)}`);
  assert(hitPacing!.instances.length === 3, 'narrative_pacing 3 paragraphs');
  assert(hitMech!.instances.length === 3, 'voice_mechanics 3 paragraphs');
  // Each entry should appear exactly once (no duplicates per dimension).
  const pacingCount = out!.patternLevelIssues.filter((p) => p.craftCategory === 'narrative_pacing').length;
  const mechCount = out!.patternLevelIssues.filter((p) => p.craftCategory === 'voice_mechanics').length;
  assert(pacingCount === 1, `narrative_pacing must dedupe to 1 entry, got ${pacingCount}`);
  assert(mechCount === 1, `voice_mechanics must dedupe to 1 entry, got ${mechCount}`);
});

test('summaryForCoach: non-empty when signals exist, empty when none', () => {
  // Case A: signals exist — pattern-level should pop.
  const t = 'neutral text';
  const v1 = mkProfile(
    [t, t, t, t, t, t, t],
    [mkFinding('F1', 1, null, ['tell_mode'], 'aa')],
  );
  const v2 = mkProfile(
    [t, t, t, t, t, t, t],
    [
      mkFinding('F2', 2, null, ['tell_mode'], 'bb'),
      mkFinding('F3', 4, null, ['tell_mode'], 'cc'),
      mkFinding('F4', 6, null, ['tell_mode'], 'dd'),
    ],
  );
  const chainA = buildSnapshotChain([v1, v2]);
  const outA = computeRevisionIntelligence(v2, chainA);
  assert(outA !== null, 'not null A');
  assert(outA!.summaryForCoach.length > 0, 'summary non-empty when patterns exist');
  const sentenceCountA = outA!.summaryForCoach.split(/[.?!]\s|[.?!]$/).filter((s) => s.trim().length > 0).length;
  assert(sentenceCountA <= 4, `summary should be <=4 sentences, got ${sentenceCountA}`);

  // Case B: two identical snapshots with NO findings anywhere — no signals.
  const v3 = mkProfile([t], []);
  const v4 = mkProfile([t], []);
  const chainB = buildSnapshotChain([v3, v4]);
  const outB = computeRevisionIntelligence(v4, chainB);
  assert(outB !== null, 'not null B');
  assert(outB!.summaryForCoach.length === 0, `summary should be empty when no signals, got "${outB!.summaryForCoach}"`);
});

// ─── report ─────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════════');
console.log('UNIT: revision intelligence (Phase 2a)');
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
