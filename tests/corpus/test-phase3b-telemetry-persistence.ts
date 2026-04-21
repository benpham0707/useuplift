/**
 * test-phase3b-telemetry-persistence.ts — Deterministic tests for the
 * Phase 3B structured-telemetry persistence layer.
 *
 * Run:
 *   npx tsx tests/corpus/test-phase3b-telemetry-persistence.ts
 *
 * No API calls — validates:
 *   1. Path resolution (default + CORPUS_TELEMETRY_PATH override)
 *   2. Record builder partitions attempts by stage correctly
 *   3. Attribution + fallback + block-token counters flow through
 *   4. JSONL appender writes well-formed lines to disk
 *   5. Feature-flag gate: persist() is a no-op when flag off; forced bypass works
 *   6. Persistence silent-fails when the path is unwritable
 */

import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  createTelemetry,
  recordFallback,
  estimateBlockTokens,
  type CorpusRetrievalTelemetry,
} from '../../src/services/essayIntelligence/analysis/corpusRetrievalBlocks';
import {
  buildCorpusTelemetryRecord,
  persistCorpusTelemetry,
  persistCorpusTelemetryForced,
  resolveTelemetryLogPath,
} from '../../src/services/essayIntelligence/analysis/corpusTelemetryPersistence';

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

async function readJsonl(path: string): Promise<Array<Record<string, unknown>>> {
  const raw = await fs.readFile(path, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

function makeSampleTelemetry(): CorpusRetrievalTelemetry {
  const t = createTelemetry();
  t.attempts.push(
    { stage: 'anchor', paragraphIndex: null, resultCount: 3, latencyMs: 1800, injected: true, error: null },
    { stage: 'paragraph', paragraphIndex: 1, resultCount: 2, latencyMs: 1500, injected: true, error: null },
    { stage: 'paragraph', paragraphIndex: 2, resultCount: 0, latencyMs: 1200, injected: false, error: null },
    { stage: 'phase', paragraphIndex: null, resultCount: 2, latencyMs: 2100, injected: true, error: null },
    { stage: 'walk', paragraphIndex: 4, resultCount: 0, latencyMs: 900, injected: false, error: 'boom' },
  );
  recordFallback(t, 'walk', 4, 'boom');
  t.attribution.movesReferenced = 4;
  t.attribution.antiPatternsReferenced = 1;
  t.attribution.fabricatedReferences.push('[MOVE-7]');
  t.corpusBlockTokens = 512;
  t.totalLatencyMs = 8200;
  return t;
}

async function main(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Phase 3B telemetry persistence — deterministic tests');
  console.log('════════════════════════════════════════════════════════════════');

  const savedFlag = process.env.ENABLE_CORPUS_RETRIEVAL_L35;
  const savedPath = process.env.CORPUS_TELEMETRY_PATH;

  // ─── [1] Path resolution ──────────────────────────────────────────────
  console.log('\n[1] Path resolution');
  delete process.env.CORPUS_TELEMETRY_PATH;
  const defaultPath = resolveTelemetryLogPath();
  assert(defaultPath.endsWith('logs/corpus-telemetry.jsonl'), 'default path under logs/');

  const absOverride = join(tmpdir(), `corpus-tel-abs-${Date.now()}.jsonl`);
  process.env.CORPUS_TELEMETRY_PATH = absOverride;
  assert(resolveTelemetryLogPath() === absOverride, 'absolute override respected');

  process.env.CORPUS_TELEMETRY_PATH = 'relative/path/tel.jsonl';
  assert(resolveTelemetryLogPath().endsWith('relative/path/tel.jsonl'), 'relative override resolves against cwd');

  // ─── [2] Block-token estimator ────────────────────────────────────────
  console.log('\n[2] Block-token estimator');
  assert(estimateBlockTokens('') === 0, 'empty → 0 tokens');
  assert(estimateBlockTokens('abcd') === 1, '4 chars → 1 token');
  assert(estimateBlockTokens('abcdefghij') === 3, '10 chars → 3 tokens (ceil)');

  // ─── [3] Record builder partitioning ──────────────────────────────────
  console.log('\n[3] Record builder partitions attempts by stage');
  const telemetry = makeSampleTelemetry();
  const record = buildCorpusTelemetryRecord({ essayId: 'essay-123', layer: 'L3.5', telemetry });
  assert(record.essayId === 'essay-123', 'essayId flows through');
  assert(record.layer === 'L3.5', 'layer set');
  assert(record.retrievalAttempts.anchor?.stage === 'anchor', 'anchor attempt partitioned');
  assert(record.retrievalAttempts.perParagraph.length === 2, 'paragraph attempts = 2');
  assert(record.retrievalAttempts.phaseAssessment?.stage === 'phase', 'phase attempt partitioned');
  assert(record.retrievalAttempts.other.length === 1, 'walk attempt lands in other');
  assert(record.retrievalAttempts.other[0].stage === 'walk', 'walk stage preserved in other');
  assert(record.attributionTest.movesReferenced === 4, 'attribution moves count');
  assert(record.attributionTest.antiPatternsReferenced === 1, 'attribution AP count');
  assert(
    record.attributionTest.fabricatedReferences.length === 1 &&
      record.attributionTest.fabricatedReferences[0] === '[MOVE-7]',
    'fabricated references flow through',
  );
  assert(record.fallbacksTriggered.length === 1, 'fallbacks flow through');
  assert(record.fallbacksTriggered[0].reason === 'boom', 'fallback reason preserved');
  assert(record.corpusBlockTokens === 512, 'block tokens flow through');
  assert(record.totalLatencyMs === 8200, 'totalLatencyMs flow through');
  assert(typeof record.timestamp === 'string' && record.timestamp.length > 0, 'timestamp set');

  // Empty essayId defaults to 'unknown'
  const anon = buildCorpusTelemetryRecord({ essayId: '', layer: 'L3.5', telemetry });
  assert(anon.essayId === 'unknown', "empty essayId → 'unknown'");

  // ─── [4] JSONL append + parse roundtrip (forced persist) ──────────────
  console.log('\n[4] Persist + re-read JSONL (forced bypass)');
  const writePath = join(tmpdir(), `corpus-tel-write-${Date.now()}.jsonl`);
  process.env.CORPUS_TELEMETRY_PATH = writePath;
  try {
    await persistCorpusTelemetryForced(record);
    await persistCorpusTelemetryForced({ ...record, essayId: 'essay-456' });
    const rows = await readJsonl(writePath);
    assert(rows.length === 2, 'two rows written');
    assert(rows[0].essayId === 'essay-123', 'row 0 essayId');
    assert(rows[1].essayId === 'essay-456', 'row 1 essayId');
  } finally {
    await fs.rm(writePath, { force: true });
  }

  // ─── [5] Feature-flag gate on persistCorpusTelemetry ──────────────────
  console.log('\n[5] Feature-flag gate on persistCorpusTelemetry');
  const gatedPath = join(tmpdir(), `corpus-tel-gated-${Date.now()}.jsonl`);
  process.env.CORPUS_TELEMETRY_PATH = gatedPath;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L35;
  await persistCorpusTelemetry(record);
  let gatedExists = true;
  try {
    await fs.access(gatedPath);
  } catch {
    gatedExists = false;
  }
  assert(gatedExists === false, 'no file written when flag OFF');

  process.env.ENABLE_CORPUS_RETRIEVAL_L35 = 'true';
  try {
    await persistCorpusTelemetry(record);
    const rows = await readJsonl(gatedPath);
    assert(rows.length === 1, 'one row written when flag ON');
    assert(rows[0].layer === 'L3.5', 'layer preserved in persisted row');
  } finally {
    await fs.rm(gatedPath, { force: true });
  }

  // ─── [6] Silent-fail on unwritable path ───────────────────────────────
  console.log('\n[6] Silent-fail on unwritable path');
  process.env.CORPUS_TELEMETRY_PATH = '/this/path/does/not/exist/and-cannot-be-created/definitely/not/tel.jsonl';
  // Make the parent a file to guarantee mkdir failure — tmpdir(). Create a file
  // at `badRoot` then point the path underneath it, so mkdir('badRoot/sub')
  // fails with ENOTDIR.
  const badRoot = join(tmpdir(), `corpus-tel-bad-${Date.now()}`);
  await fs.writeFile(badRoot, 'not a directory', 'utf8');
  process.env.CORPUS_TELEMETRY_PATH = join(badRoot, 'sub', 'tel.jsonl');
  let threw = false;
  try {
    await persistCorpusTelemetryForced(record);
  } catch {
    threw = true;
  }
  assert(threw === false, 'persist does not throw on filesystem error');
  await fs.rm(badRoot, { force: true });

  // ─── Teardown: restore env ────────────────────────────────────────────
  if (savedFlag === undefined) delete process.env.ENABLE_CORPUS_RETRIEVAL_L35;
  else process.env.ENABLE_CORPUS_RETRIEVAL_L35 = savedFlag;
  if (savedPath === undefined) delete process.env.CORPUS_TELEMETRY_PATH;
  else process.env.CORPUS_TELEMETRY_PATH = savedPath;

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('════════════════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

void main();
