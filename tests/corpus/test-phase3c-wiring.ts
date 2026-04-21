/**
 * test-phase3c-wiring.ts — Deterministic tests for Phase 3C layer wiring.
 *
 * No API calls. Validates:
 *   1. Per-layer feature flags resolve correctly (master on/off, per-layer
 *      override to 'true' / 'false' / unset, L6 opt-in-only semantics).
 *   2. Stage overrides on retrieve* helpers produce attempts/fallbacks
 *      tagged with the caller-supplied stage string (no post-hoc mutation).
 *   3. L3-safe descriptive archetype block contains NO calibration/eval
 *      language ("calibrate", "foundation / architecture / craft / polish /
 *      distinction", "rank", "score", "rubric", "standard"). This is the
 *      contract that keeps L3 Understanding-layer uncontaminated.
 *   4. Empty-input builders return empty strings (silent skip-injection).
 *
 * Run:
 *   npx tsx tests/corpus/test-phase3c-wiring.ts
 */

import {
  // feature flags
  isCorpusRetrievalEnabled,
  isCorpusRetrievalEnabledForL3,
  isCorpusRetrievalEnabledForL375,
  isCorpusRetrievalEnabledForL4,
  isCorpusRetrievalEnabledForL5,
  isCorpusRetrievalEnabledForL6,
  // retrieval helpers
  createTelemetry,
  retrieveAnchorMoves,
  retrievePhaseArchetypes,
  retrieveParagraphAntiPatterns,
  // block builders
  buildDescriptiveArchetypesBlock,
  buildPhaseArchetypesBlock,
} from '../../src/services/essayIntelligence/analysis/corpusRetrievalBlocks';
import type { RetrievalResult } from '../../src/services/essayIntelligence/corpus/retrieval';
import type { EssayArchetype } from '../../src/services/essayIntelligence/corpus/corpusTypes';
import type { EssayProfile } from '../../src/services/essayIntelligence/profileTypes';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

function saveEnv(): Record<string, string | undefined> {
  return {
    master: process.env.ENABLE_CORPUS_RETRIEVAL_L35,
    l3: process.env.ENABLE_CORPUS_RETRIEVAL_L3,
    l375: process.env.ENABLE_CORPUS_RETRIEVAL_L375,
    l4: process.env.ENABLE_CORPUS_RETRIEVAL_L4,
    l5: process.env.ENABLE_CORPUS_RETRIEVAL_L5,
    l6: process.env.ENABLE_CORPUS_RETRIEVAL_L6,
  };
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  const keys: Array<[string, string]> = [
    ['master', 'ENABLE_CORPUS_RETRIEVAL_L35'],
    ['l3', 'ENABLE_CORPUS_RETRIEVAL_L3'],
    ['l375', 'ENABLE_CORPUS_RETRIEVAL_L375'],
    ['l4', 'ENABLE_CORPUS_RETRIEVAL_L4'],
    ['l5', 'ENABLE_CORPUS_RETRIEVAL_L5'],
    ['l6', 'ENABLE_CORPUS_RETRIEVAL_L6'],
  ];
  for (const [savedKey, envKey] of keys) {
    const v = saved[savedKey];
    if (v === undefined) delete process.env[envKey];
    else process.env[envKey] = v;
  }
}

function clearAllFlags(): void {
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L35;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L3;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L375;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L4;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L5;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L6;
}

async function main(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Phase 3C wiring — deterministic tests');
  console.log('════════════════════════════════════════════════════════════════');

  const saved = saveEnv();

  // ─── [1] Master flag off, no overrides → all layers off ───────────────
  console.log('\n[1] Master OFF, no overrides — all layers OFF');
  clearAllFlags();
  assert(isCorpusRetrievalEnabled() === false, 'master off');
  assert(isCorpusRetrievalEnabledForL3() === false, 'L3 off (falls back to master)');
  assert(isCorpusRetrievalEnabledForL375() === false, 'L3.75 off (falls back)');
  assert(isCorpusRetrievalEnabledForL4() === false, 'L4 off (falls back)');
  assert(isCorpusRetrievalEnabledForL5() === false, 'L5 off (falls back)');
  assert(isCorpusRetrievalEnabledForL6() === false, 'L6 off (opt-in only)');

  // ─── [2] Master on, no per-layer overrides → all except L6 inherit ────
  console.log('\n[2] Master ON, no overrides — L3/L3.75/L4/L5 inherit ON, L6 stays OFF');
  clearAllFlags();
  process.env.ENABLE_CORPUS_RETRIEVAL_L35 = 'true';
  assert(isCorpusRetrievalEnabled() === true, 'master on');
  assert(isCorpusRetrievalEnabledForL3() === true, 'L3 inherits master');
  assert(isCorpusRetrievalEnabledForL375() === true, 'L3.75 inherits master');
  assert(isCorpusRetrievalEnabledForL4() === true, 'L4 inherits master');
  assert(isCorpusRetrievalEnabledForL5() === true, 'L5 inherits master');
  assert(isCorpusRetrievalEnabledForL6() === false, 'L6 does NOT inherit (opt-in only)');

  // ─── [3] Master on, per-layer kill switch → targeted disable works ────
  console.log('\n[3] Master ON, L4=false kill switch — L4 off, others stay on');
  clearAllFlags();
  process.env.ENABLE_CORPUS_RETRIEVAL_L35 = 'true';
  process.env.ENABLE_CORPUS_RETRIEVAL_L4 = 'false';
  assert(isCorpusRetrievalEnabledForL3() === true, 'L3 inherits ON');
  assert(isCorpusRetrievalEnabledForL4() === false, 'L4 killed by explicit false');
  assert(isCorpusRetrievalEnabledForL5() === true, 'L5 inherits ON');

  // ─── [4] Master off, per-layer explicit ON → incremental rollout ──────
  console.log('\n[4] Master OFF, L3=true only — only L3 on');
  clearAllFlags();
  process.env.ENABLE_CORPUS_RETRIEVAL_L3 = 'true';
  assert(isCorpusRetrievalEnabled() === false, 'master off');
  assert(isCorpusRetrievalEnabledForL3() === true, 'L3 explicitly on');
  assert(isCorpusRetrievalEnabledForL375() === false, 'L3.75 still off');
  assert(isCorpusRetrievalEnabledForL4() === false, 'L4 still off');

  // ─── [5] L6 opt-in (master doesn't cascade) ───────────────────────────
  console.log('\n[5] L6=true alone enables L6');
  clearAllFlags();
  process.env.ENABLE_CORPUS_RETRIEVAL_L6 = 'true';
  assert(isCorpusRetrievalEnabledForL6() === true, 'L6 opt-in works');
  assert(isCorpusRetrievalEnabledForL3() === false, 'L3 not accidentally enabled by L6 flag');

  // ─── [6] Stage-override on retrieve helpers — no mutation needed ──────
  console.log('\n[6] Stage override on retrieve* helpers (simulated error path)');
  // We force the feature flag on, but since no OPENAI_API_KEY / real corpus
  // is in the test env, retrieval calls fail. We validate the ERROR path
  // records the caller-supplied stage tag correctly.
  process.env.ENABLE_CORPUS_RETRIEVAL_L35 = 'true';
  const minimalProfile = {
    voiceIdentity: { register: 'plain' },
    thematicArchitecture: { centralThesis: 'test' },
    narrativeStrategy: { primaryStrategy: 'reflective', arcType: 'reflective' },
  } as unknown as EssayProfile;

  const tel1 = createTelemetry();
  // Stage tag 'walk' — expected to land on the attempt record regardless of
  // whether retrieval succeeds or errors out.
  await retrieveAnchorMoves('query text', minimalProfile, tel1, 'walk').catch(() => {});
  if (tel1.attempts.length > 0) {
    assert(tel1.attempts[0].stage === 'walk', "retrieveAnchorMoves respects stage='walk'");
  } else {
    assert(false, "expected at least one attempt record with stage='walk'");
  }

  const tel2 = createTelemetry();
  await retrievePhaseArchetypes(minimalProfile, tel2, 'synthesis').catch(() => {});
  if (tel2.attempts.length > 0) {
    assert(tel2.attempts[0].stage === 'synthesis', "retrievePhaseArchetypes respects stage='synthesis'");
  } else {
    assert(false, "expected at least one attempt record with stage='synthesis'");
  }

  const tel3 = createTelemetry();
  await retrieveParagraphAntiPatterns('text', 2, tel3).catch(() => {});
  if (tel3.attempts.length > 0) {
    assert(tel3.attempts[0].stage === 'paragraph', 'retrieveParagraphAntiPatterns default stage=paragraph');
  } else {
    assert(false, 'expected at least one attempt record for paragraph retrieval');
  }

  // Fallback tagging propagates the stage override too (verified when query
  // is empty → synchronous no-retrieval path on archetypes).
  const tel4 = createTelemetry();
  const emptyProfile = { voiceIdentity: { register: 'plain' } } as unknown as EssayProfile;
  await retrievePhaseArchetypes(emptyProfile, tel4, 'crystallizer');
  assert(tel4.attempts[0]?.stage === 'crystallizer', 'empty-query fallback uses stageTag');
  assert(tel4.fallbacksTriggered[0]?.stage === 'crystallizer', 'fallback record uses stageTag');

  // ─── [7] L3-safe descriptive archetype block — no eval language ───────
  console.log('\n[7] Descriptive archetype block — no calibration/evaluative language');
  const fakeArch: RetrievalResult<EssayArchetype>[] = [
    {
      entity: {
        id: 'x',
        displayName: 'Arc of Discovery',
        description: 'Essays that trace a gradual realization.',
        structuralStages: [{ purpose: 'Open with tension, build through questioning.' }],
        whenToUse: 'Works when the student has ambiguity to explore.',
        forbiddenForVoices: [],
        dimensions: ['narrative'],
      } as unknown as EssayArchetype,
      similarity: 0.8,
      provenance: { essayId: 'exemplar-01', paragraph: null },
    },
  ];
  const descBlock = buildDescriptiveArchetypesBlock(fakeArch);
  const phaseBlock = buildPhaseArchetypesBlock(fakeArch);

  // Descriptive block must NOT contain these evaluative/calibration words:
  const bannedInDescriptive = [
    'calibrate',
    'calibration',
    'foundation / architecture / craft',
    'rubric',
    'rank',
    'score',
    'measure against',
    'standard',
  ];
  for (const banned of bannedInDescriptive) {
    assert(
      !descBlock.toLowerCase().includes(banned.toLowerCase()),
      `descriptive block does not contain "${banned}"`,
    );
  }
  assert(descBlock.includes('REFERENCE ARCHETYPES'), 'descriptive block has REFERENCE ARCHETYPES header');
  assert(descBlock.includes('Do not use them to judge'), 'descriptive block disclaims evaluative use');
  assert(descBlock.includes('Arc of Discovery'), 'descriptive block renders displayName');

  // Phase block SHOULD contain calibration language (it's meant for the
  // phase assessment layer specifically).
  assert(phaseBlock.includes('calibration anchors'), 'phase block retains calibration language');
  assert(phaseBlock.includes('foundation / architecture'), 'phase block retains phase-placement vocabulary');

  assert(buildDescriptiveArchetypesBlock([]) === '', 'descriptive block empty on empty input');

  // ─── [8] Record builder handles new stage tags ────────────────────────
  console.log('\n[8] Telemetry record builder handles all 3C stage tags');
  const { buildCorpusTelemetryRecord } = await import(
    '../../src/services/essayIntelligence/analysis/corpusTelemetryPersistence'
  );
  const richTel = createTelemetry();
  richTel.attempts.push(
    { stage: 'walk', paragraphIndex: null, resultCount: 1, latencyMs: 100, injected: true, error: null },
    { stage: 'synthesis', paragraphIndex: null, resultCount: 2, latencyMs: 200, injected: true, error: null },
    { stage: 'crystallizer', paragraphIndex: null, resultCount: 3, latencyMs: 300, injected: true, error: null },
    { stage: 'feedback', paragraphIndex: null, resultCount: 4, latencyMs: 400, injected: true, error: null },
    { stage: 'coaching', paragraphIndex: null, resultCount: 5, latencyMs: 500, injected: true, error: null },
  );
  const record = buildCorpusTelemetryRecord({
    essayId: 'e1',
    layer: 'L3',
    telemetry: richTel,
  });
  // None of walk/synthesis/crystallizer/feedback/coaching should land in
  // anchor or phaseAssessment — they all belong in `other`.
  assert(record.retrievalAttempts.anchor === null, 'no anchor attempt when none tagged anchor');
  assert(record.retrievalAttempts.phaseAssessment === null, 'no phase attempt when none tagged phase');
  assert(record.retrievalAttempts.perParagraph.length === 0, 'no per-paragraph');
  assert(
    record.retrievalAttempts.other.length === 5,
    'walk/synthesis/crystallizer/feedback/coaching all land in `other`',
  );
  const otherStages = record.retrievalAttempts.other.map((a) => a.stage).sort();
  assert(
    JSON.stringify(otherStages) === JSON.stringify(['coaching', 'crystallizer', 'feedback', 'synthesis', 'walk']),
    'all 5 Phase-3C stage tags preserved in order',
  );

  // Teardown
  restoreEnv(saved);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('════════════════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

void main();
