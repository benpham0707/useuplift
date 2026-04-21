/**
 * corpusTelemetryPersistence.ts — Phase 3B Wave-3a telemetry persistence.
 *
 * Phase 3A logged retrieval effectiveness via `console.log`. That's fine for
 * interactive dev, but we can't compute A/B metrics (Checkpoint 3), hallucination
 * trends, or per-stage latency distributions off scrollback. This module
 * converts the transient `CorpusRetrievalTelemetry` accumulator into a durable
 * JSONL record, one line per analysis run, so downstream tooling can aggregate.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * File format
 * ─────────────────────────────────────────────────────────────────────────
 *
 * One JSON object per line (`CorpusTelemetryRecord`). Appended atomically via
 * `fs.appendFile` — safe against concurrent writers because each record is
 * a complete line terminated by `\n` and Node's `appendFile` on POSIX is
 * O_APPEND at the kernel level. No locking required.
 *
 * Default path: `logs/corpus-telemetry.jsonl` (relative to process cwd).
 * Override with env var `CORPUS_TELEMETRY_PATH`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Safety model
 * ─────────────────────────────────────────────────────────────────────────
 *
 * - Feature-flag gated: no-op when `ENABLE_CORPUS_RETRIEVAL_L35 !== 'true'`.
 *   (We don't persist records when the flag is off — nothing interesting to
 *   store, and the record would add noise to the JSONL file.)
 * - All I/O wrapped in try/catch. Persistence errors never propagate to the
 *   analysis pipeline. A failed write logs a warning and returns.
 * - Directory is auto-created with `recursive: true` on first write.
 */

import { appendFile, mkdir } from 'fs/promises';
import { dirname, isAbsolute, resolve } from 'path';
import type {
  CorpusRetrievalTelemetry,
  CorpusRetrievalAttempt,
  CorpusRetrievalFallback,
  CorpusAttributionSummary,
} from './corpusRetrievalBlocks';
import { isCorpusRetrievalEnabled } from './corpusRetrievalBlocks';

// ─────────────────────────────────────────────────────────────────────────
// Types — match spec "Telemetry per analysisPass call"
// ─────────────────────────────────────────────────────────────────────────

export interface CorpusTelemetryRecord {
  /** ISO timestamp when this record was finalized. */
  timestamp: string;
  /** Essay UUID. `'unknown'` if caller didn't thread an essayId. */
  essayId: string;
  /** Analysis layer/stage the record describes — 'L3.5' today, future layers in 3C. */
  layer: string;
  /** Mirrors ENABLE_CORPUS_RETRIEVAL_L35 at the moment the record was emitted. */
  featureFlagEnabled: boolean;

  /** Attempts bucketed by stage for easy aggregation. */
  retrievalAttempts: {
    anchor: CorpusRetrievalAttempt | null;
    perParagraph: CorpusRetrievalAttempt[];
    phaseAssessment: CorpusRetrievalAttempt | null;
    /** All other stages (walk/synthesis/crystallizer/feedback/coaching) — populated by 3C wiring. */
    other: CorpusRetrievalAttempt[];
  };

  attributionTest: CorpusAttributionSummary;
  fallbacksTriggered: CorpusRetrievalFallback[];
  totalLatencyMs: number;
  corpusBlockTokens: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Path resolution
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_REL_PATH = 'logs/corpus-telemetry.jsonl';

export function resolveTelemetryLogPath(): string {
  const raw = process.env.CORPUS_TELEMETRY_PATH?.trim();
  const rel = raw && raw.length > 0 ? raw : DEFAULT_REL_PATH;
  return isAbsolute(rel) ? rel : resolve(process.cwd(), rel);
}

// ─────────────────────────────────────────────────────────────────────────
// Record builder
// ─────────────────────────────────────────────────────────────────────────

export interface BuildRecordOptions {
  essayId: string;
  layer: string;
  telemetry: CorpusRetrievalTelemetry;
  /** Optional override; defaults to `telemetry.totalLatencyMs`. */
  totalLatencyMs?: number;
}

export function buildCorpusTelemetryRecord(opts: BuildRecordOptions): CorpusTelemetryRecord {
  const { essayId, layer, telemetry, totalLatencyMs } = opts;

  // Partition attempts by stage. Anchor + phase are scalar (last-write-wins);
  // paragraph attempts stay arrayed. Everything else spills to `other`.
  let anchor: CorpusRetrievalAttempt | null = null;
  let phase: CorpusRetrievalAttempt | null = null;
  const perParagraph: CorpusRetrievalAttempt[] = [];
  const other: CorpusRetrievalAttempt[] = [];

  for (const attempt of telemetry.attempts) {
    switch (attempt.stage) {
      case 'anchor':
        anchor = attempt;
        break;
      case 'phase':
        phase = attempt;
        break;
      case 'paragraph':
        perParagraph.push(attempt);
        break;
      default:
        other.push(attempt);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    essayId: essayId && essayId.length > 0 ? essayId : 'unknown',
    layer,
    featureFlagEnabled: telemetry.featureFlagEnabled,
    retrievalAttempts: { anchor, perParagraph, phaseAssessment: phase, other },
    attributionTest: {
      movesReferenced: telemetry.attribution.movesReferenced,
      antiPatternsReferenced: telemetry.attribution.antiPatternsReferenced,
      fabricatedReferences: [...telemetry.attribution.fabricatedReferences],
    },
    fallbacksTriggered: [...telemetry.fallbacksTriggered],
    totalLatencyMs: totalLatencyMs ?? telemetry.totalLatencyMs,
    corpusBlockTokens: telemetry.corpusBlockTokens,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────

/**
 * Append a single JSONL record to the telemetry log. Silent-fail — any
 * filesystem error just logs a warning. Persistence must NEVER interfere with
 * the analysis pipeline.
 *
 * No-ops when `ENABLE_CORPUS_RETRIEVAL_L35` is not 'true'. If you need to
 * persist records in a control (flag-off) run — e.g. for A/B baseline — call
 * `persistCorpusTelemetryForced()` instead.
 */
export async function persistCorpusTelemetry(record: CorpusTelemetryRecord): Promise<void> {
  if (!isCorpusRetrievalEnabled()) return;
  return persistCorpusTelemetryForced(record);
}

/**
 * Persist regardless of feature flag — used by A/B test runners that need
 * baseline (flag-off) records to compare against treatment (flag-on) records.
 */
export async function persistCorpusTelemetryForced(record: CorpusTelemetryRecord): Promise<void> {
  const logPath = resolveTelemetryLogPath();
  try {
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, `${JSON.stringify(record)}\n`, 'utf8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[L3.5/corpus] Telemetry persist failed at ${logPath}: ${msg}. Continuing.`);
  }
}
