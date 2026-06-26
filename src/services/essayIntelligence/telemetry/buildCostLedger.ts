// ============================================================================
// BUILD COST LEDGER (Phase 0 D-0.10)
// ============================================================================
// Spec: INTEGRATED_BUILD_SEQUENCE.md D-0.10 / L5_IMPLEMENTATION_PLAN §2 D-0.10.
// Companion file: BUILD_COST_LEDGER.md at repo root (human-friendly
// markdown table, append-only).
//
// Enforces the structural cost discipline. Per Tue's TQ-2 (2026-04-26):
//   $10 hard cap across the entire integrated build, with hard halt at $9
//   (warn at $7). Mid-build escalations to Tue when a touchpoint genuinely
//   needs more headroom; do not silently expand.
//
// `checkCapBeforeCall()` MUST be called by the LLM adapter BEFORE every
// API call. It throws `BuildCostCapExceededError` when cumulative spend
// has reached $9 — the next API call cannot proceed.
//
// `recordCost()` MUST be called by the LLM adapter AFTER every API call
// returns. It appends a row to the ledger (sync write — guarantees the
// record landed before the next call), updates the in-memory cumulative,
// and emits an iteration telemetry event.
//
// State recovery: on first call into the module, the ledger file is
// read and the cost column is summed to recover cumulative state. This
// makes the cap survive process restarts (a long build session may
// restart many times without losing the cap). If the ledger file is
// missing, it is created with a header. If parsing fails, the module
// throws — silently starting with $0 would defeat the cap.
//
// Per the no-fallback charter: every failure surface throws. Telemetry
// emit failure halts the caller; ledger write failure halts the caller;
// parse failure on init halts the caller. We do not soft-fail the cap
// to keep a caller's API call going.

// Default-imported (not named) so this Node-only module stays browser-COMPILABLE:
// claude.ts lazy-loads it via dynamic import (Node-only at runtime), but Vite still
// has to compile the resulting chunk for the browser, and named imports of Node
// builtins hard-fail browser externalization. Default imports externalize cleanly.
import fs from 'fs';
import path from 'path';

import type { IterationTelemetryEvent } from '../profileTypes';
import { emitIterationEvent } from './iterationTelemetry';

// ─── Constants ──────────────────────────────────────────────────────────

/** Hard halt threshold. The next API call after cumulative reaches this throws.
 *  Raised 9.0 → 15.0 (2026-06-06, by Tue): the original build cap is exhausted but
 *  the pipeline is now in an ongoing verification/surfacing phase. The operative
 *  discipline is NOT this all-time number — it is: keep EACH run ≤ ~$4, and do not
 *  re-run back-to-back to fix small things one at a time (batch all fixes, verify
 *  once). This ceiling is the coarse backstop; the per-run discipline is the guard. */
export const HARD_CAP_USD = 15.0;

/** Warn threshold. Logs a warning when cumulative crosses this. */
export const WARN_THRESHOLD_USD = 13.0;

/** Path to the markdown ledger at repo root. */
export const LEDGER_PATH = path.resolve(process.cwd(), 'BUILD_COST_LEDGER.md');

/** Header row format. Order matches `appendEntryToLedger`'s row layout. */
const LEDGER_HEADER = `# Build Cost Ledger

> Append-only record of every Claude API call made during the integrated
> pipeline build (\`feat/integrated-pipeline-build\`). Enforced by
> \`src/services/essayIntelligence/telemetry/buildCostLedger.ts\` (D-0.10).
> Cap: $${HARD_CAP_USD.toFixed(2)} hard halt, $${WARN_THRESHOLD_USD.toFixed(2)} warn.

| timestamp | deliverable | model | prompt | fixture | input_tokens | output_tokens | cache_read | cache_write | cost_usd | quality_note | cumulative_usd | fresh_input_usd | cache_read_usd | cache_create_usd | output_usd |
| --------- | ----------- | ----- | ------ | ------- | ------------ | ------------- | ---------- | ----------- | -------- | ------------ | -------------- | --------------- | -------------- | ---------------- | ---------- |
`;

// ─── Types ──────────────────────────────────────────────────────────────

/**
 * Input shape for `recordCost`. Mirrors the columns in BUILD_COST_LEDGER.md.
 * Optional fields produce empty cells in the markdown.
 */
export interface BuildCostEntry {
  deliverableId?: string;
  model: string;
  promptName?: string;
  fixtureKey?: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costUsd: number;
  qualityNote?: string;
  /**
   * Phase 1 A1 cost-component split (2026-05-12, telemetry foundation).
   * Optional per-component dollars that sum to `costUsd`. Recorded by
   * `calculateCostBreakdown` in `src/lib/llm/claude.ts` for new entries;
   * legacy entries leave them blank in the ledger.
   *
   * Why: enables Phase 6 verification analysis to attribute cost-cut
   * impact to specific cost bases (e.g., "Cut B saved $0.075 by
   * eliminating one Haiku output call" surfaces as a drop in
   * `output_usd` plus correlated `fresh_input_usd` reduction). A single
   * rolled-up cost_usd cannot distinguish which cost basis moved.
   */
  freshInputUsd?: number;
  cacheReadUsd?: number;
  cacheCreateUsd?: number;
  outputUsd?: number;
  /** Optional iteration tag — when present, telemetry event is keyed to this iteration. */
  iteration?: number;
  /**
   * D-1.11 Step 15: optional essay ID for telemetry buffer keying. When
   * absent, the cost-ledger emit lands in a sentinel '<build-cost-ledger>'
   * bucket (the cost ledger is a process-level audit, not per-essay
   * scoped — most callers are tooling / probes that don't have an
   * essayId in scope). Real essay-scoped callers should pass it.
   */
  essayId?: string;
}

/**
 * Structured exception thrown by `checkCapBeforeCall` when cumulative
 * has reached or exceeded `HARD_CAP_USD`. The orchestrator / test
 * harness catches this to halt cleanly without proceeding to the API call.
 */
export class BuildCostCapExceededError extends Error {
  constructor(
    public readonly cumulativeUsd: number,
    public readonly capUsd: number = HARD_CAP_USD,
    public readonly lastEntry?: BuildCostEntry,
  ) {
    super(
      `[BuildCostLedger] Hard cap exceeded: cumulative $${cumulativeUsd.toFixed(4)} >= cap $${capUsd.toFixed(2)}. ` +
        `The next API call cannot proceed. Escalate to Tue if more headroom is genuinely needed; do not silently expand.`,
    );
    this.name = 'BuildCostCapExceededError';
  }
}

// ─── Module-level state ────────────────────────────────────────────────

let cumulativeUsd = 0;
let initialized = false;
let warnCrossed = false;

// ─── Init / recovery ───────────────────────────────────────────────────

/**
 * Initialize the ledger module. Idempotent — safe to call multiple times.
 *
 * On first init: reads BUILD_COST_LEDGER.md if present and recovers
 * cumulative state by summing the cost_usd column. If the file is
 * missing, creates it with the header. If parsing fails, throws.
 *
 * Module functions (recordCost, checkCapBeforeCall) auto-init on first
 * call, so explicit init() is rarely needed in production. Tests call
 * `__resetLedgerForTesting` to reset state between cases.
 */
export function initLedger(): void {
  if (initialized) return;
  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, LEDGER_HEADER, 'utf-8');
    cumulativeUsd = 0;
    initialized = true;
    return;
  }
  const content = fs.readFileSync(LEDGER_PATH, 'utf-8');
  cumulativeUsd = parseCumulativeFromLedger(content);
  warnCrossed = cumulativeUsd >= WARN_THRESHOLD_USD;
  initialized = true;
}

/**
 * Sum the cost_usd column (column index 10 in the |-delimited table)
 * from the markdown content. Skips header / separator / non-data rows.
 *
 * Throws if a row's cost cell exists but doesn't parse as a number —
 * silent recovery would mask a corrupted ledger. The cap discipline
 * requires accurate cumulative; we'd rather halt and have the operator
 * fix the ledger than start the build with the wrong baseline.
 */
function parseCumulativeFromLedger(content: string): number {
  let total = 0;
  let dataRowsSeen = 0;
  for (const line of content.split('\n')) {
    const trimmed = line.trimEnd();
    // Data rows start with `|` and have content. Skip header (`| timestamp |...`),
    // separator (`| --- |...`), and blank lines.
    if (!trimmed.startsWith('|')) continue;
    if (trimmed.startsWith('| ---')) continue;
    if (/^\|\s*timestamp\s*\|/i.test(trimmed)) continue;
    const cells = trimmed.split('|').map((c) => c.trim());
    // Expected layout (column index in `cells`):
    //   0:''  1:timestamp  2:deliverable  3:model  4:prompt  5:fixture
    //   6:input_tokens  7:output_tokens  8:cache_read  9:cache_write
    //   10:cost_usd  11:quality_note  12:cumulative_usd  13:''
    if (cells.length < 13) continue;
    const costCell = cells[10];
    if (!costCell || costCell === '-') continue;
    const cost = parseFloat(costCell);
    if (Number.isNaN(cost)) {
      throw new Error(
        `[BuildCostLedger] init: failed to parse cost_usd cell "${costCell}" on row ${dataRowsSeen + 1}. ` +
          `Ledger may be corrupted — fix manually or restore from version control before continuing.`,
      );
    }
    total += cost;
    dataRowsSeen += 1;
  }
  return total;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Throws `BuildCostCapExceededError` if cumulative has reached
 * `HARD_CAP_USD`. Called by the LLM adapter BEFORE every API call.
 *
 * Auto-initializes the ledger module on first call.
 */
export function checkCapBeforeCall(): void {
  if (!initialized) initLedger();
  if (cumulativeUsd >= HARD_CAP_USD) {
    throw new BuildCostCapExceededError(cumulativeUsd, HARD_CAP_USD);
  }
}

/**
 * Append an entry to the ledger, update cumulative, emit telemetry.
 * Called by the LLM adapter AFTER every API call returns.
 *
 * Sync write — the file write completes before the function returns,
 * so a process crash mid-call cannot lose the entry. The in-memory
 * cumulative is updated atomically with the write.
 *
 * Failure surfaces:
 *   - Auto-init fails → throws (halts caller).
 *   - File append fails → throws (halts caller).
 *   - Telemetry emit fails → throws (halts caller — per no-fallback).
 *
 * The function logs a warning to stderr when cumulative crosses
 * `WARN_THRESHOLD_USD` for the first time (warnCrossed latch). Subsequent
 * calls don't re-warn.
 */
export function recordCost(entry: BuildCostEntry): void {
  if (!initialized) initLedger();
  cumulativeUsd += entry.costUsd;
  const timestamp = new Date().toISOString();
  appendEntryToLedger({ ...entry, timestamp });
  if (!warnCrossed && cumulativeUsd >= WARN_THRESHOLD_USD) {
    warnCrossed = true;
    console.warn(
      `[BuildCostLedger] WARN threshold crossed: cumulative $${cumulativeUsd.toFixed(4)} >= warn $${WARN_THRESHOLD_USD.toFixed(2)}. ` +
        `$${(HARD_CAP_USD - cumulativeUsd).toFixed(4)} of headroom remaining before hard halt.`,
    );
  }
  // Telemetry: emit a step event for the cost record. Iteration is
  // optional in BuildCostEntry; default to 0 when absent (orchestrator-
  // less calls during tooling / probes).
  const event: IterationTelemetryEvent = {
    iteration: entry.iteration ?? 0,
    step: `llm.${entry.model}${entry.promptName ? `.${entry.promptName}` : ''}`,
    status: 'succeeded',
    cost: entry.costUsd,
    tokenUsage: {
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      cacheReadTokens: entry.cacheReadTokens,
      cacheWriteTokens: entry.cacheWriteTokens,
    },
    model: entry.model,
    timestamp,
  };
  emitIterationEvent(entry.essayId ?? '<build-cost-ledger>', event);
}

/**
 * Read the current cumulative spend without modifying state.
 *
 * Auto-initializes on first call (so a freshly-restarted process
 * picks up cumulative from disk before reporting).
 */
export function getCumulativeCost(): number {
  if (!initialized) initLedger();
  return cumulativeUsd;
}

/**
 * Build the markdown row and append. Sync write.
 *
 * Cells follow the header column order. Empty optional fields render
 * as a single space; numeric fields render with cost-appropriate
 * precision (4 decimals for USD).
 */
function appendEntryToLedger(entry: BuildCostEntry & { timestamp: string }): void {
  // Phase 1 A1 (2026-05-12): 4 cost-component columns appended after
  // cumulative_usd. Legacy entries (no breakdown provided) emit ' ' so
  // parseCumulativeFromLedger continues reading cost_usd at cells[10]
  // without re-indexing.
  const cells = [
    entry.timestamp,
    entry.deliverableId ?? ' ',
    entry.model,
    entry.promptName ?? ' ',
    entry.fixtureKey ?? ' ',
    String(entry.inputTokens),
    String(entry.outputTokens),
    entry.cacheReadTokens != null ? String(entry.cacheReadTokens) : ' ',
    entry.cacheWriteTokens != null ? String(entry.cacheWriteTokens) : ' ',
    entry.costUsd.toFixed(4),
    (entry.qualityNote ?? ' ').replace(/\|/g, '\\|').replace(/\n/g, ' '),
    cumulativeUsd.toFixed(4),
    entry.freshInputUsd != null ? entry.freshInputUsd.toFixed(4) : ' ',
    entry.cacheReadUsd != null ? entry.cacheReadUsd.toFixed(4) : ' ',
    entry.cacheCreateUsd != null ? entry.cacheCreateUsd.toFixed(4) : ' ',
    entry.outputUsd != null ? entry.outputUsd.toFixed(4) : ' ',
  ];
  const row = `| ${cells.join(' | ')} |\n`;
  fs.appendFileSync(LEDGER_PATH, row, 'utf-8');
}

// ─── Test-only ─────────────────────────────────────────────────────────

/**
 * Test helper. Resets in-memory state. Does NOT delete the on-disk
 * ledger; tests that need a clean ledger should write their own
 * isolated path or remove the file before each case.
 */
export function __resetLedgerForTesting(): void {
  cumulativeUsd = 0;
  initialized = false;
  warnCrossed = false;
}
