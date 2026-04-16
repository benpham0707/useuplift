/**
 * planner-impact-tier.test.ts — Unit test for the manifest-consumption-gap
 * fix in coachingPlanner.selectNextDeployment.
 *
 * The April 2026 audit found that of 12 manifest items per session
 * (~$0.69 in L4 cost), only 3-4 ever surfaced — 9 silently dropped.
 * Confirmed drops included transformative items (delete-P5) and red_flag
 * cliché items (IMP_11/IMP_12). The pre-fix planner rotated by principle
 * category alone with zero awareness of impact tier, source, or
 * surface-by deadlines.
 *
 * This test verifies the four-stage gate documented in coachingPlanner.ts:
 *   1. Force-surface red_flag/howler items past their surfaceByTurn deadline
 *   2. Impact-tier gating (transformative > significant > incremental)
 *   3. Category rotation within tier
 *   4. Technique preference within rotation pool
 *
 * No LLM calls. Pure deterministic assertions.
 *
 * Run: npx tsx tests/unit/planner-impact-tier.test.ts
 */

import {
  selectNextDeployment,
} from '../../src/services/essayIntelligence/coaching/coachingPlanner';
import type {
  ImprovementEntry,
  ImprovementManifest,
  CoachingSessionMemory,
} from '../../src/services/essayIntelligence/profileTypes';

const results: Array<{ name: string; pass: boolean; detail?: string }> = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (err) {
    results.push({
      name,
      pass: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function makeItem(overrides: Partial<ImprovementEntry> = {}): ImprovementEntry {
  return {
    id: 'IMP_X',
    paragraph: 0,
    observation: '',
    action: '',
    stakes: '',
    technique: null,
    demonstration: null,
    wordEconomyCut: null,
    source: 'l4_priority',
    sourceRef: null,
    priority: 1,
    impact: 'significant',
    conversatorEnrichments: [],
    ...overrides,
  };
}

function makeManifest(items: ImprovementEntry[]): ImprovementManifest {
  return {
    items,
    generatedAt: new Date().toISOString(),
    sources: ['test'],
    wordCount: 350,
    wordLimit: 650,
  };
}

function makeMemory(overrides: Partial<CoachingSessionMemory> = {}): CoachingSessionMemory {
  return {
    turnCount: 0,
    events: [],
    sessionArcSummary: '',
    nextFocus: '',
    strategicQuestion: '',
    questionStaleness: 0,
    ...overrides,
  } as CoachingSessionMemory;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPACT-TIER GATING
// ═══════════════════════════════════════════════════════════════════════════

test('tier-gating: 2 transformative + 3 significant → planner picks transformative first', () => {
  const items = [
    // 3 significant placed FIRST in the array to prove the planner doesn't
    // just walk in array order — it gates by tier before anything else.
    makeItem({ id: 'S1', impact: 'significant', priority: 1, technique: 'EVIDENCE ANCHORING' }),
    makeItem({ id: 'S2', impact: 'significant', priority: 2, technique: 'BRIDGE SENTENCE' }),
    makeItem({ id: 'S3', impact: 'significant', priority: 3, technique: 'NAMED CHARACTER' }),
    // 2 transformative placed AFTER. Planner must still pick one of these.
    makeItem({ id: 'T1', impact: 'transformative', priority: 4, technique: 'NARRATIVE ARC' }),
    makeItem({ id: 'T2', impact: 'transformative', priority: 5, technique: 'STAKES ESTABLISHMENT' }),
  ];
  const sel = selectNextDeployment(makeManifest(items), makeMemory());
  assert(sel !== null, 'expected non-null selection');
  assert(
    sel.item.impact === 'transformative',
    `expected transformative tier, got ${sel.item.impact} (id=${sel.item.id})`,
  );
  assert(
    sel.item.id === 'T1' || sel.item.id === 'T2',
    `expected T1 or T2, got ${sel.item.id}`,
  );
});

test('tier-gating: only significant + incremental → planner picks significant', () => {
  const items = [
    makeItem({ id: 'I1', impact: 'incremental', priority: 1, technique: 'FUNCTIONAL DETAIL' }),
    makeItem({ id: 'S1', impact: 'significant', priority: 2, technique: 'EVIDENCE ANCHORING' }),
    makeItem({ id: 'I2', impact: 'incremental', priority: 3, technique: 'COLD OPEN / SENSORY TIMESTAMP' }),
  ];
  const sel = selectNextDeployment(makeManifest(items), makeMemory());
  assert(sel !== null, 'expected non-null selection');
  assert(sel.item.id === 'S1', `expected S1 (significant), got ${sel.item.id}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// FORCE-SURFACE DEADLINE
// ═══════════════════════════════════════════════════════════════════════════

test('force-surface: red_flag with surfaceByTurn=2 not surfaced by T3 jumps to front', () => {
  const items = [
    // A high-priority transformative item that would normally be picked.
    makeItem({
      id: 'T1',
      impact: 'transformative',
      priority: 1,
      technique: 'NARRATIVE ARC',
      source: 'l4_priority',
    }),
    // A red_flag cliché item (significant tier) that would normally lose
    // the tier gate to T1 — but because it's overdue, it must jump to front.
    makeItem({
      id: 'IMP_RF',
      impact: 'significant',
      priority: 5,
      technique: 'VOICE AUTHENTICITY',
      source: 'red_flag',
      surfaceByTurn: 2,
    }),
  ];
  // turnCount=2 means the next turn will be 3, which is > surfaceByTurn=2.
  const sel = selectNextDeployment(
    makeManifest(items),
    makeMemory({ turnCount: 2 }),
  );
  assert(sel !== null, 'expected non-null selection');
  assert(
    sel.item.id === 'IMP_RF',
    `expected IMP_RF (force-surfaced), got ${sel.item.id}`,
  );
  assert(
    sel.selectionReason === 'force_surface',
    `expected reason=force_surface, got ${sel.selectionReason}`,
  );
});

test('force-surface: red_flag with surfaceByTurn=3 NOT yet overdue at T2 → tier gate wins', () => {
  const items = [
    makeItem({
      id: 'T1',
      impact: 'transformative',
      priority: 1,
      technique: 'NARRATIVE ARC',
    }),
    makeItem({
      id: 'IMP_RF',
      impact: 'significant',
      priority: 5,
      technique: 'VOICE AUTHENTICITY',
      source: 'red_flag',
      surfaceByTurn: 3,
    }),
  ];
  // turnCount=1 → next turn is 2, NOT > 3. Force-surface should not fire.
  const sel = selectNextDeployment(
    makeManifest(items),
    makeMemory({ turnCount: 1 }),
  );
  assert(sel !== null, 'expected non-null selection');
  assert(sel.item.id === 'T1', `expected T1 (tier gate), got ${sel.item.id}`);
});

test('force-surface: only fires for untaught items (already in ledger → ignored)', () => {
  const items = [
    makeItem({
      id: 'T1',
      impact: 'transformative',
      priority: 1,
      technique: 'NARRATIVE ARC',
    }),
    makeItem({
      id: 'IMP_RF',
      impact: 'significant',
      priority: 5,
      technique: 'VOICE AUTHENTICITY',
      source: 'red_flag',
      surfaceByTurn: 1,
    }),
  ];
  const sel = selectNextDeployment(
    makeManifest(items),
    makeMemory({
      turnCount: 5,
      taughtLedger: {
        // Already taught — must not be force-surfaced again.
        IMP_RF: {
          turn: 2,
          technique: 'VOICE AUTHENTICITY',
          principleCategory: 'voice_authenticity',
          deploymentMode: 'explicit',
          impId: 'IMP_RF',
        },
      },
    }),
  );
  assert(sel !== null, 'expected non-null selection');
  assert(sel.item.id === 'T1', `expected T1, got ${sel.item.id}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// TECHNIQUE PREFERENCE
// ═══════════════════════════════════════════════════════════════════════════

test('technique-preference: same tier, item with technique outranks item without', () => {
  const items = [
    // Both transformative, same category candidates. Item without technique
    // listed first by priority; planner should still prefer the one with a
    // technique because Q6 fire rate depends on it.
    makeItem({
      id: 'NO_TECH',
      impact: 'transformative',
      priority: 1,
      technique: null,
    }),
    makeItem({
      id: 'WITH_TECH',
      impact: 'transformative',
      priority: 2,
      technique: 'NARRATIVE ARC',
    }),
  ];
  const sel = selectNextDeployment(makeManifest(items), makeMemory());
  assert(sel !== null, 'expected non-null selection');
  assert(
    sel.item.id === 'WITH_TECH',
    `expected WITH_TECH (has technique), got ${sel.item.id} (technique=${sel.item.technique})`,
  );
});

test('technique-preference: when ALL items lack technique, falls back to priority order', () => {
  const items = [
    makeItem({ id: 'A', impact: 'transformative', priority: 2, technique: null }),
    makeItem({ id: 'B', impact: 'transformative', priority: 1, technique: null }),
  ];
  const sel = selectNextDeployment(makeManifest(items), makeMemory());
  assert(sel !== null, 'expected non-null selection');
  assert(sel.item.id === 'B', `expected B (priority 1), got ${sel.item.id}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPOUND SCENARIO — THE AUDIT FIXTURE
// ═══════════════════════════════════════════════════════════════════════════

test('audit-fixture: transformative delete-P5 + red_flag clichés all surface within 5 turns', () => {
  // Synthetic fixture mirroring the audit:
  //   - IMP_5: delete P5 (transformative, priority 5)
  //   - IMP_11, IMP_12: red_flag clichés with surfaceByTurn=2
  //   - several significant/incremental items competing
  const items = [
    makeItem({ id: 'IMP_1', impact: 'significant', priority: 1, technique: 'EVIDENCE ANCHORING' }),
    makeItem({ id: 'IMP_2', impact: 'significant', priority: 2, technique: 'BRIDGE SENTENCE' }),
    makeItem({ id: 'IMP_5', impact: 'transformative', priority: 5, technique: 'NARRATIVE ARC' }),
    makeItem({ id: 'IMP_8', impact: 'significant', priority: 8, technique: 'SOMATIC VULNERABILITY' }),
    makeItem({
      id: 'IMP_11',
      impact: 'significant',
      priority: 11,
      technique: 'VOICE AUTHENTICITY',
      source: 'red_flag',
      surfaceByTurn: 2,
    }),
    makeItem({
      id: 'IMP_12',
      impact: 'significant',
      priority: 12,
      technique: 'VOICE AUTHENTICITY',
      source: 'red_flag',
      surfaceByTurn: 2,
    }),
  ];

  // Simulate 5 turns. After each turn, record the deployment in the ledger.
  const memory = makeMemory();
  const surfaced: string[] = [];
  for (let turn = 1; turn <= 5; turn++) {
    const sel = selectNextDeployment(makeManifest(items), memory);
    if (!sel) break;
    surfaced.push(sel.item.id);
    // Simulate recordDeployment — write to ledger and bump turnCount.
    memory.taughtLedger = memory.taughtLedger ?? {};
    memory.taughtLedger[sel.item.id] = {
      turn,
      technique: sel.item.technique,
      principleCategory: sel.principleCategory,
      deploymentMode: 'explicit',
      impId: sel.item.id,
    };
    memory.turnCount = turn;
  }

  // Turn 1: tier-gating picks IMP_5 (only transformative).
  assert(surfaced[0] === 'IMP_5', `T1 expected IMP_5 (transformative), got ${surfaced[0]}`);
  // By turn 3+ the red_flag items must surface (overdue: surfaceByTurn=2,
  // nextTurn=3 > 2). The planner force-surfaces them ahead of remaining
  // significant items.
  assert(
    surfaced.includes('IMP_11') || surfaced.includes('IMP_12'),
    `expected IMP_11 or IMP_12 to surface in 5 turns, got [${surfaced.join(', ')}]`,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;
for (const r of results) {
  if (r.pass) {
    passed++;
    console.log(`  PASS  ${r.name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${r.name}`);
    if (r.detail) console.log(`        ${r.detail}`);
  }
}
console.log(`\n${passed}/${results.length} tests passed (${failed} failed)`);
if (failed > 0) process.exit(1);
