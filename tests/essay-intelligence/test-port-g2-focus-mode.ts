#!/usr/bin/env tsx
/**
 * Port G2 — Focus Mode (2-3 items max at L5 surfacing) smoke test
 *
 * Verifies:
 *   1. G2_FOCUS_MODE slot is pre-claimed at v1.0.0 and declared 'prescriptive'.
 *   2. ImprovementCandidate interface carries the new `visible?: boolean` field
 *      (compile-time check via a typed fixture candidate).
 *   3. `computeFocusRoi` returns priority × alignment per the documented mapping.
 *   4. `rankAndApplyFocusMode` flips `visible = false` on all but top-N by ROI.
 *   5. Full array retained — no candidate removed (Rule 2).
 *   6. Idempotent — re-running produces identical visible assignments.
 *   7. `maxVisible` floor: callers passing 1 get clamped to 2.
 *   8. deepAnnotationService.ts gates the call on ENABLE_FOCUS_MODE env var.
 *   9. L1/L3/L3.5/L3.75/L4 prompts untouched — G2 is L5-scope only.
 *
 * ---------------------------------------------------------------------------
 * MEASUREMENT PLAN (per verdict §3 Port G2) — post-merge UX instrumentation.
 *
 * Session-level engagement metric: student acts on a Focus-Mode-surfaced
 * annotation at rate ≥ X% vs current (non-Focus) rate.
 *
 * Requires UX event wiring:
 *   - emit `focus_mode.annotation_surfaced` per visible annotation at
 *     finalization time (paragraphIndex, candidateId, visible=true).
 *   - emit `focus_mode.annotation_acted_on` when the student applies
 *     a surfaced annotation (via L5 ACTION rewrite, inline edit, etc.).
 *   - Compute action-rate on paired cohorts (ENABLE_FOCUS_MODE on vs off)
 *     for 2 weeks before promoting the flag to default-on.
 *
 * Promotion criteria:
 *   - action-rate on Focus cohort ≥ 1.5x baseline, OR
 *   - action-rate unchanged but per-session coaching_quality_rating ≥ +1 point.
 * ---------------------------------------------------------------------------
 *
 * Run: npx tsx tests/test-port-g2-focus-mode.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  PROMPT_BLOCK_VERSIONS,
  PROMPT_BLOCK_DECLARATIONS,
} from '../../src/lib/llm/promptBlockVersions';
import type { ImprovementCandidate } from '../../src/services/essayIntelligence/profileTypes';
import {
  ImprovementCandidateStore,
  computeFocusRoi,
} from '../../src/services/essayIntelligence/improvements/improvementCandidateStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passed = 0;
let failed = 0;
function assert(cond: unknown, label: string): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('Port G2 — Focus Mode (2-3 items at L5 surfacing)');

// 1. Slot pre-claim + prescriptive declaration
assert(
  PROMPT_BLOCK_VERSIONS.G2_FOCUS_MODE === 'v1.0.0',
  `G2_FOCUS_MODE version is v1.0.0 (got ${PROMPT_BLOCK_VERSIONS.G2_FOCUS_MODE})`,
);
assert(
  PROMPT_BLOCK_DECLARATIONS.G2_FOCUS_MODE.level === 'prescriptive',
  `G2 declared at 'prescriptive' level (got ${PROMPT_BLOCK_DECLARATIONS.G2_FOCUS_MODE.level})`,
);

// 2. ImprovementCandidate has `visible?: boolean` (compile-time check)
function makeCandidate(overrides: Partial<ImprovementCandidate>): ImprovementCandidate {
  return {
    id: overrides.id ?? 'CAND_TEST',
    sourceLayer: 'L3.5',
    paragraph: 0,
    sentence: 0,
    sourceFindingId: null,
    observation: 'test observation',
    suggestedChange: 'test change',
    technique: null,
    demonstrationSketch: null,
    coachingValue: 'medium',
    lifecycleState: 'candidate',
    supersededBy: null,
    createdAt: '2026-04-18T00:00:00.000Z',
    ...overrides,
  };
}
const probe: ImprovementCandidate = makeCandidate({ visible: false });
assert(probe.visible === false, 'ImprovementCandidate accepts visible: false');
const probe2: ImprovementCandidate = makeCandidate({});
assert(probe2.visible === undefined, 'ImprovementCandidate visible defaults to undefined');

// 3. computeFocusRoi mapping
const critFoundation = makeCandidate({ id: 'a', coachingValue: 'critical' });
const highArchitecture = makeCandidate({ id: 'b', coachingValue: 'high' });
const diagDistinction = makeCandidate({ id: 'c', coachingValue: 'diagnostic' });
assert(
  computeFocusRoi(critFoundation, 'foundation') === 4.0,
  `critical candidate aligned to foundation: ROI = 4 (got ${computeFocusRoi(critFoundation, 'foundation')})`,
);
assert(
  computeFocusRoi(critFoundation, 'craft') === 2.4,
  `critical candidate misaligned to craft: ROI = 2.4 (got ${computeFocusRoi(critFoundation, 'craft')})`,
);
assert(
  computeFocusRoi(highArchitecture, 'architecture') === 3.0,
  `high candidate aligned to architecture: ROI = 3 (got ${computeFocusRoi(highArchitecture, 'architecture')})`,
);
assert(
  computeFocusRoi(diagDistinction, 'distinction') === 1.0,
  `diagnostic candidate aligned to distinction: ROI = 1 (got ${computeFocusRoi(diagDistinction, 'distinction')})`,
);
assert(
  computeFocusRoi(critFoundation, null) === 2.4,
  `null phase → misaligned multiplier 0.6 (got ${computeFocusRoi(critFoundation, null)})`,
);

// 4. rankAndApplyFocusMode: top-N visible=true, rest visible=false
{
  const store = new ImprovementCandidateStore();
  const candidates = [
    makeCandidate({ id: 'c1', coachingValue: 'critical' }),    // ROI 4.0
    makeCandidate({ id: 'c2', coachingValue: 'high' }),         // ROI 1.8 (misaligned)
    makeCandidate({ id: 'c3', coachingValue: 'diagnostic' }),   // ROI 0.6
    makeCandidate({ id: 'c4', coachingValue: 'medium' }),       // ROI 1.2
    makeCandidate({ id: 'c5', coachingValue: 'contextual' }),   // ROI 0.9
  ];
  for (const c of candidates) {
    (store as unknown as { candidates: Map<string, ImprovementCandidate> }).candidates.set(c.id, c);
  }
  store.rankAndApplyFocusMode('foundation', 3);

  const byId = (id: string) => candidates.find((c) => c.id === id)!;
  assert(byId('c1').visible === true,  'c1 (critical/foundation) is visible (ROI 4.0, rank 1)');
  assert(byId('c2').visible === true,  'c2 (high) is visible (ROI 1.8, rank 2)');
  assert(byId('c4').visible === true,  'c4 (medium) is visible (ROI 1.2, rank 3)');
  assert(byId('c5').visible === false, 'c5 (contextual) is hidden (ROI 0.9, rank 4)');
  assert(byId('c3').visible === false, 'c3 (diagnostic) is hidden (ROI 0.6, rank 5)');
}

// 5. Full retention — no candidate removed
{
  const store = new ImprovementCandidateStore();
  const candidates = Array.from({ length: 5 }, (_, i) =>
    makeCandidate({ id: `r${i}`, coachingValue: 'medium' }),
  );
  for (const c of candidates) {
    (store as unknown as { candidates: Map<string, ImprovementCandidate> }).candidates.set(c.id, c);
  }
  const before = store.getActive().length;
  store.rankAndApplyFocusMode('polish', 3);
  const after = store.getActive().length;
  assert(before === 5 && after === 5, `Active candidate count unchanged after Focus Mode (${before} → ${after})`);
}

// 6. Idempotence
{
  const store = new ImprovementCandidateStore();
  const candidates = [
    makeCandidate({ id: 'i1', coachingValue: 'critical' }),
    makeCandidate({ id: 'i2', coachingValue: 'high' }),
    makeCandidate({ id: 'i3', coachingValue: 'medium' }),
    makeCandidate({ id: 'i4', coachingValue: 'diagnostic' }),
  ];
  for (const c of candidates) {
    (store as unknown as { candidates: Map<string, ImprovementCandidate> }).candidates.set(c.id, c);
  }
  store.rankAndApplyFocusMode('foundation', 3);
  const snapshot = candidates.map((c) => c.visible);
  store.rankAndApplyFocusMode('foundation', 3);
  const snapshot2 = candidates.map((c) => c.visible);
  assert(
    JSON.stringify(snapshot) === JSON.stringify(snapshot2),
    'rankAndApplyFocusMode is idempotent',
  );
}

// 7. maxVisible floor at 2
{
  const store = new ImprovementCandidateStore();
  const candidates = [
    makeCandidate({ id: 'f1', coachingValue: 'critical' }),
    makeCandidate({ id: 'f2', coachingValue: 'high' }),
    makeCandidate({ id: 'f3', coachingValue: 'medium' }),
  ];
  for (const c of candidates) {
    (store as unknown as { candidates: Map<string, ImprovementCandidate> }).candidates.set(c.id, c);
  }
  store.rankAndApplyFocusMode('foundation', 1); // attempts to cap at 1, clamped to 2
  const visibleCount = candidates.filter((c) => c.visible === true).length;
  assert(visibleCount === 2, `maxVisible clamped to 2 floor (got ${visibleCount} visible)`);
}

// 8. deepAnnotationService.ts integration — gated on ENABLE_FOCUS_MODE env
const repoRoot = resolve(__dirname, '..', '..');
const dasSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/deepAnnotationService.ts'),
  'utf8',
);
assert(
  dasSrc.includes("process.env.ENABLE_FOCUS_MODE === 'true'"),
  'deepAnnotationService.ts gates Focus Mode on ENABLE_FOCUS_MODE env var',
);
assert(
  /\brankAndApplyFocusMode\b/.test(dasSrc),
  'deepAnnotationService.ts calls rankAndApplyFocusMode',
);

// 9. L1/L3/L3.5/L3.75/L4 prompts untouched — G2 is L5-scope only
for (const rel of [
  'src/services/essayIntelligence/analysis/firstImpressions.ts',
  'src/services/essayIntelligence/analysis/sequentialDeepWalk.ts',
  'src/services/essayIntelligence/analysis/holisticSynthesis.ts',
  'src/services/essayIntelligence/analysis/analysisPass.ts',
  'src/services/essayIntelligence/analysis/crystallizer.ts',
]) {
  const src = readFileSync(resolve(repoRoot, rel), 'utf8');
  assert(
    !src.includes('G2_FOCUS_MODE') && !src.includes('rankAndApplyFocusMode'),
    `${rel.split('/').pop()} does NOT reference G2 (L5-scope only)`,
  );
}

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
