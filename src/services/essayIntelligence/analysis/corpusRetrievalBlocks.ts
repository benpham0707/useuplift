/**
 * corpusRetrievalBlocks.ts — Phase 3A L3.5 ↔ corpus integration (Wave-3a).
 *
 * Wraps the Wave-3a corpus retrieval API in analysis-pass-specific helpers:
 *
 *   1. `retrieveAnchorMoves()`  — craft moves semantically similar to the anchor
 *      paragraph's text, filtered by the essay's voice register.
 *   2. `retrieveParagraphAntiPatterns()` — anti-patterns matching a paragraph's
 *      text. Similarity-gated so strong paragraphs naturally surface no results.
 *   3. `retrievePhaseArchetypes()` — essay archetypes matching the profile's
 *      thematic+narrative signature, used to anchor phase-boundary placement.
 *
 * Plus prompt-block builders that format retrieval results into the exact
 * markdown blocks specified in `docs/wave-3a/PHASE_3A_L35_INTEGRATION_SPEC.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Retrieval backend
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Uses the Anthropic-native Claude-retrieval path (`claudeRetrieval.ts`):
 * cached Haiku system prompt containing the full corpus catalog, per-call user
 * message with the query. No OpenAI embeddings, no pgvector query — pure
 * Claude, consistent with Uplift's single-LLM-provider architecture.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Safety model
 * ─────────────────────────────────────────────────────────────────────────
 *
 * - Feature-flagged behind `ENABLE_CORPUS_RETRIEVAL_L35` (default OFF).
 * - Every retrieval call is wrapped in try/catch + a per-call timeout.
 * - A failed retrieval becomes an empty result array. The caller skips the
 *   prompt block silently, so analysis quality never regresses below baseline.
 */

import type { EssayProfile } from '../profileTypes';
import type {
  CraftMove,
  EssayArchetype,
  VoiceRegister,
} from '../corpus/corpusTypes';
import {
  retrieveMovesBySignal,
  retrieveAntiPatterns,
  retrieveArchetypeMatches,
  type ClaudeRetrievalResult as RetrievalResult,
} from '../corpus/claudeRetrieval';

// ─────────────────────────────────────────────────────────────────────────
// Feature flag + tunables
// ─────────────────────────────────────────────────────────────────────────

const FEATURE_FLAG = 'ENABLE_CORPUS_RETRIEVAL_L35';

/** Per-retrieval soft timeout. Degrades to empty on expiry. Claude Haiku
 *  retrieval typically responds in ~1.5s; we give it 8s of slack before
 *  degrading, since retrieval failure is cheaper than mid-analysis stall. */
const RETRIEVAL_TIMEOUT_MS = 8000;

/** Anchor move retrieval: how many moves to surface. */
const ANCHOR_MOVE_COUNT = 3;

/** Per-paragraph anti-pattern retrieval. */
const ANTI_PATTERN_COUNT = 2;
const ANTI_PATTERN_MIN_SIMILARITY = 0.5;

/** Phase archetype retrieval. */
const PHASE_ARCHETYPE_COUNT = 2;

/** Closed voice-register union — matches corpusTypes.VoiceRegister exactly. */
const VALID_VOICE_REGISTERS: ReadonlySet<string> = new Set<VoiceRegister>([
  'plain',
  'literary-reflective',
  'maximalist',
  'comedic',
  'domain-insider',
  'intellectual-playful',
  'lyric',
]);

// ─────────────────────────────────────────────────────────────────────────
// Telemetry
// ─────────────────────────────────────────────────────────────────────────

export interface CorpusRetrievalAttempt {
  stage: 'anchor' | 'paragraph' | 'phase' | 'walk' | 'synthesis' | 'crystallizer' | 'feedback' | 'coaching';
  paragraphIndex: number | null;
  resultCount: number;
  latencyMs: number;
  injected: boolean;
  error: string | null;
}

/** Fallback occurrence — retrieval threw, timed out, or produced 0 usable results. */
export interface CorpusRetrievalFallback {
  stage: CorpusRetrievalAttempt['stage'];
  paragraphIndex: number | null;
  reason: string;
}

/** Attribution counters — aggregated across all attempts in a single run. */
export interface CorpusAttributionSummary {
  /** Total distinct [MOVE-#] labels referenced in LLM output across all calls. */
  movesReferenced: number;
  /** Total distinct [AP-#] labels referenced in LLM output across all calls. */
  antiPatternsReferenced: number;
  /** References emitted by the LLM that were NOT injected → hallucinations. */
  fabricatedReferences: string[];
}

export interface CorpusRetrievalTelemetry {
  featureFlagEnabled: boolean;
  attempts: CorpusRetrievalAttempt[];
  fallbacksTriggered: CorpusRetrievalFallback[];
  attribution: CorpusAttributionSummary;
  /** Rough estimate of injected corpus-block size (char/4 heuristic). */
  corpusBlockTokens: number;
  totalLatencyMs: number;
}

export function createTelemetry(): CorpusRetrievalTelemetry {
  return {
    featureFlagEnabled: isCorpusRetrievalEnabled(),
    attempts: [],
    fallbacksTriggered: [],
    attribution: {
      movesReferenced: 0,
      antiPatternsReferenced: 0,
      fabricatedReferences: [],
    },
    corpusBlockTokens: 0,
    totalLatencyMs: 0,
  };
}

/** Append a fallback event — called whenever a retrieval degrades to empty. */
export function recordFallback(
  telemetry: CorpusRetrievalTelemetry,
  stage: CorpusRetrievalAttempt['stage'],
  paragraphIndex: number | null,
  reason: string,
): void {
  telemetry.fallbacksTriggered.push({ stage, paragraphIndex, reason });
}

/** Estimate token cost of an injected block (char/4 heuristic, avoids tokenizer dep). */
export function estimateBlockTokens(block: string): number {
  if (!block) return 0;
  return Math.ceil(block.length / 4);
}

// ─────────────────────────────────────────────────────────────────────────
// Feature-flag gates (Wave-3a Phase 3C)
// ─────────────────────────────────────────────────────────────────────────
//
// Layer-specific flags let us roll out corpus retrieval one layer at a time
// and A/B-test per layer. The master flag (`ENABLE_CORPUS_RETRIEVAL_L35`) is
// the original gate for the L3.5 × corpus wiring; the per-layer flags
// (`ENABLE_CORPUS_RETRIEVAL_L3`, `_L375`, `_L4`, `_L5`, `_L6`) gate the
// Phase 3C layer wirings independently.
//
// Semantics:
//   - When a layer-specific flag is set ('true'), that layer performs corpus
//     retrieval regardless of the master flag.
//   - When a layer-specific flag is UNSET, the layer falls back to the master
//     flag — so setting `ENABLE_CORPUS_RETRIEVAL_L35=true` alone flips ALL
//     layers on (simplest single-knob config).
//   - When a layer-specific flag is set to 'false' explicitly, the layer
//     stays OFF even if the master flag is on (explicit override).
//
// This gives us three rollout patterns:
//   1. Single-knob prod enable → set master, all layers on.
//   2. Incremental rollout → keep master off, flip layers on one at a time.
//   3. Targeted kill switch → master on, set one layer='false' to disable it.

const FEATURE_FLAG_L3 = 'ENABLE_CORPUS_RETRIEVAL_L3';
const FEATURE_FLAG_L375 = 'ENABLE_CORPUS_RETRIEVAL_L375';
const FEATURE_FLAG_L4 = 'ENABLE_CORPUS_RETRIEVAL_L4';
const FEATURE_FLAG_L5 = 'ENABLE_CORPUS_RETRIEVAL_L5';
const FEATURE_FLAG_L6 = 'ENABLE_CORPUS_RETRIEVAL_L6';

/** Master flag — gates the L3.5 × corpus wiring AND acts as the default for
 *  layer-specific flags when those are unset. */
export function isCorpusRetrievalEnabled(): boolean {
  return process.env[FEATURE_FLAG] === 'true';
}

function resolveLayerFlag(layerEnv: string): boolean {
  const layerVal = process.env[layerEnv];
  if (layerVal === 'true') return true;
  if (layerVal === 'false') return false;
  return isCorpusRetrievalEnabled();
}

/** Per-layer flag resolvers — used by L3/L3.75/L4/L5/L6 wirings. */
export function isCorpusRetrievalEnabledForL3(): boolean {
  return resolveLayerFlag(FEATURE_FLAG_L3);
}
export function isCorpusRetrievalEnabledForL375(): boolean {
  return resolveLayerFlag(FEATURE_FLAG_L375);
}
export function isCorpusRetrievalEnabledForL4(): boolean {
  return resolveLayerFlag(FEATURE_FLAG_L4);
}
export function isCorpusRetrievalEnabledForL5(): boolean {
  return resolveLayerFlag(FEATURE_FLAG_L5);
}
/** L6 is opt-in only — master flag does NOT enable it. Coaching runs on
 *  interactive latency budgets; retrieval adds ~1.8s/turn. Explicit opt-in
 *  via `ENABLE_CORPUS_RETRIEVAL_L6=true`. */
export function isCorpusRetrievalEnabledForL6(): boolean {
  return process.env[FEATURE_FLAG_L6] === 'true';
}

// ─────────────────────────────────────────────────────────────────────────
// Internal: bounded-latency retrieval wrapper
// ─────────────────────────────────────────────────────────────────────────

async function withTimeout<T>(op: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([op, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Profile-derived filters
// ─────────────────────────────────────────────────────────────────────────

/**
 * Extract a typed VoiceRegister from the profile's free-text register field,
 * returning null when the value doesn't match the corpus's closed union.
 */
export function resolveVoiceRegister(profile: Readonly<EssayProfile>): VoiceRegister | null {
  const raw = profile.voiceIdentity?.register;
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (VALID_VOICE_REGISTERS.has(normalized)) return normalized as VoiceRegister;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Retrieval functions (thin wrappers around corpus/retrieval.ts)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Retrieve craft moves semantically similar to the anchor paragraph's text.
 * Voice-filtered when the profile's register maps to a corpus register.
 *
 * Returns empty array on feature-flag off, retrieval error, or timeout.
 */
export async function retrieveAnchorMoves(
  anchorText: string,
  profile: Readonly<EssayProfile>,
  telemetry: CorpusRetrievalTelemetry,
  /** Wave-3a Phase 3C: caller-supplied stage tag. Defaults to 'anchor' (L3.5
   *  anchor-paragraph call site). Non-L3.5 callers pass their layer's tag so
   *  telemetry can be sliced per-layer without post-hoc mutation. */
  stageTag: CorpusRetrievalAttempt['stage'] = 'anchor',
): Promise<RetrievalResult<CraftMove>[]> {
  if (!isCorpusRetrievalEnabled()) return [];
  const start = Date.now();
  const voice = resolveVoiceRegister(profile);
  try {
    const moves = await withTimeout(
      retrieveMovesBySignal(
        anchorText,
        voice ? { voiceRegisters: [voice] } : {},
        ANCHOR_MOVE_COUNT,
      ),
      RETRIEVAL_TIMEOUT_MS,
      'anchor-moves-retrieval',
    );
    telemetry.attempts.push({
      stage: stageTag,
      paragraphIndex: null,
      resultCount: moves.length,
      latencyMs: Date.now() - start,
      injected: moves.length > 0,
      error: null,
    });
    return moves;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[corpus/${stageTag}] Moves retrieval failed: ${msg}. Degrading.`);
    telemetry.attempts.push({
      stage: stageTag,
      paragraphIndex: null,
      resultCount: 0,
      latencyMs: Date.now() - start,
      injected: false,
      error: msg,
    });
    recordFallback(telemetry, stageTag, null, msg);
    return [];
  }
}

/**
 * Retrieve anti-patterns matching a paragraph's text. Filtered to
 * similarity > 0.5 — the natural gate that keeps strong paragraphs from
 * surfacing any anti-pattern block.
 */
export async function retrieveParagraphAntiPatterns(
  paragraphText: string,
  paragraphIndex: number,
  telemetry: CorpusRetrievalTelemetry,
): Promise<Array<{ id: string; description: string; similarity: number }>> {
  if (!isCorpusRetrievalEnabled()) return [];
  const start = Date.now();
  try {
    const raw = await withTimeout(
      retrieveAntiPatterns(paragraphText, ANTI_PATTERN_COUNT),
      RETRIEVAL_TIMEOUT_MS,
      `anti-pattern-retrieval P${paragraphIndex}`,
    );
    const filtered = raw.filter((ap) => ap.similarity > ANTI_PATTERN_MIN_SIMILARITY);
    telemetry.attempts.push({
      stage: 'paragraph',
      paragraphIndex,
      resultCount: filtered.length,
      latencyMs: Date.now() - start,
      injected: filtered.length > 0,
      error: null,
    });
    return filtered;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[L3.5/corpus] Anti-pattern retrieval P${paragraphIndex} failed: ${msg}`);
    telemetry.attempts.push({
      stage: 'paragraph',
      paragraphIndex,
      resultCount: 0,
      latencyMs: Date.now() - start,
      injected: false,
      error: msg,
    });
    recordFallback(telemetry, 'paragraph', paragraphIndex, msg);
    return [];
  }
}

/**
 * Retrieve essay archetypes matching the profile's thematic+narrative signature.
 * Used by phase assessment to anchor boundary placement in corpus exemplars.
 */
export async function retrievePhaseArchetypes(
  profile: Readonly<EssayProfile>,
  telemetry: CorpusRetrievalTelemetry,
  /** Wave-3a Phase 3C: caller-supplied stage tag. Defaults to 'phase' (phase
   *  assessment call site). L3/L3.75/L4 pass their own tag so per-layer
   *  aggregation works without mutation. */
  stageTag: CorpusRetrievalAttempt['stage'] = 'phase',
): Promise<RetrievalResult<EssayArchetype>[]> {
  if (!isCorpusRetrievalEnabled()) return [];
  const start = Date.now();
  const query = [
    profile.thematicArchitecture?.centralThesis ?? '',
    profile.narrativeStrategy?.primaryStrategy ?? '',
    profile.narrativeStrategy?.arcType ?? '',
  ]
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(' — ');
  if (query.length === 0) {
    const reason = 'empty query (no thesis/strategy on profile)';
    telemetry.attempts.push({
      stage: stageTag,
      paragraphIndex: null,
      resultCount: 0,
      latencyMs: Date.now() - start,
      injected: false,
      error: reason,
    });
    recordFallback(telemetry, stageTag, null, reason);
    return [];
  }
  const voice = resolveVoiceRegister(profile);
  try {
    const archetypes = await withTimeout(
      retrieveArchetypeMatches(query, {
        k: PHASE_ARCHETYPE_COUNT,
        excludeForbiddenForVoice: voice ?? undefined,
      }),
      RETRIEVAL_TIMEOUT_MS,
      'archetype-retrieval',
    );
    telemetry.attempts.push({
      stage: stageTag,
      paragraphIndex: null,
      resultCount: archetypes.length,
      latencyMs: Date.now() - start,
      injected: archetypes.length > 0,
      error: null,
    });
    return archetypes;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[corpus/${stageTag}] Archetype retrieval failed: ${msg}`);
    telemetry.attempts.push({
      stage: stageTag,
      paragraphIndex: null,
      resultCount: 0,
      latencyMs: Date.now() - start,
      injected: false,
      error: msg,
    });
    recordFallback(telemetry, stageTag, null, msg);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Prompt-block builders
// ─────────────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  if (!s) return '';
  const cleaned = s.replace(/\s+/g, ' ').trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1).trim()}…`;
}

/**
 * Format CORPUS-ANCHORED CRAFT MOVES block for the anchor paragraph prompt.
 * Returns empty string when there are no moves to inject.
 */
export function buildCorpusMovesBlock(moves: RetrievalResult<CraftMove>[]): string {
  if (moves.length === 0) return '';
  const lines: string[] = [];
  lines.push('## CORPUS-ANCHORED CRAFT MOVES (Admitted Essays)');
  moves.forEach((r, i) => {
    const { entity, provenance } = r;
    const sourceBits: string[] = [];
    if (provenance.essayId) {
      sourceBits.push(
        provenance.paragraph !== null
          ? `${provenance.essayId} P${provenance.paragraph}`
          : provenance.essayId,
      );
    }
    lines.push(`[MOVE-${i + 1}]: ${entity.displayName}`);
    if (sourceBits.length > 0) {
      lines.push(`  Source: ${sourceBits.join(', ')}`);
    }
    lines.push(`  Mechanism: ${truncate(entity.mechanism, 220)}`);
    lines.push(`  Effectiveness anchor: ~80-90 when executed with the specificity shown in the source`);
    lines.push('');
  });
  lines.push('CALIBRATION GUIDANCE:');
  lines.push('When a sentence here uses a similar move, score confidently 75+.');
  lines.push('When a sentence attempts the move but falls short (generic/telling), score lower and mark the gap.');
  return lines.join('\n');
}

/**
 * Format FAILURE-MODE DETECTION block for per-paragraph prompts.
 * Returns empty string when there are no anti-patterns to inject.
 */
export function buildAntiPatternsBlock(
  antiPatterns: Array<{ id: string; description: string; similarity: number }>,
): string {
  if (antiPatterns.length === 0) return '';
  const lines: string[] = [];
  lines.push('## FAILURE-MODE DETECTION (Corpus Anti-Patterns)');
  antiPatterns.forEach((ap, i) => {
    lines.push(`[AP-${i + 1}]: ${ap.id} (match confidence: ${ap.similarity.toFixed(2)})`);
    lines.push(`  Pattern: ${truncate(ap.description, 260)}`);
    lines.push('  Corpus evidence: this pattern has scored low across multiple reference essays');
  });
  lines.push('');
  lines.push('If this paragraph demonstrates one of these patterns, cite the [AP-#] label in the sentence-level weaknesses.');
  return lines.join('\n');
}

/**
 * Format PHASE BOUNDARY REFERENCE block for phase assessment prompts.
 * Returns empty string when there are no archetypes to inject.
 *
 * Use this variant ONLY for phase assessment — it contains explicit
 * calibration language ("use these as calibration anchors when placing
 * this essay in foundation / architecture / …"). Evaluative framing is
 * appropriate there because phase assessment IS an evaluative layer.
 *
 * For understanding-only layers (L3 walk, L3.75 synthesis) use
 * `buildDescriptiveArchetypesBlock()` instead.
 */
export function buildPhaseArchetypesBlock(
  archetypes: RetrievalResult<EssayArchetype>[],
): string {
  if (archetypes.length === 0) return '';
  const lines: string[] = [];
  lines.push('## PHASE BOUNDARY REFERENCE (Corpus Archetypes)');
  for (const r of archetypes) {
    const a = r.entity;
    const stagePurpose = a.structuralStages?.[0]?.purpose ?? '';
    const whenToUse = typeof a.whenToUse === 'string' ? a.whenToUse : '';
    const firstSentence = (a.description ?? '').split(/(?<=[.!?])\s+/)[0] ?? '';
    lines.push(`${a.displayName}: ${truncate(firstSentence, 200)}`);
    if (stagePurpose) lines.push(`  Structural signals: ${truncate(stagePurpose, 180)}`);
    if (whenToUse) lines.push(`  When-to-use: ${truncate(whenToUse, 180)}`);
    lines.push('');
  }
  lines.push('INTERPRETATION: Use these as calibration anchors when placing this essay in');
  lines.push('foundation / architecture / craft / polish / distinction. Dimensions can');
  lines.push('develop unevenly (e.g., voice at craft, structure at architecture).');
  return lines.join('\n');
}

/**
 * Wave-3a Phase 3C: L3-safe descriptive archetype block.
 *
 * Same archetype data as `buildPhaseArchetypesBlock`, rendered WITHOUT the
 * calibration call-to-action. Purely descriptive — "here are patterns seen
 * in admitted essays" — so it contextualizes understanding without pushing
 * the LLM toward evaluation. Appropriate for L3 walk (understanding-only)
 * and L3.75 holistic synthesis (synthesis-only).
 *
 * Design invariant: must NEVER contain evaluative framing ("better",
 * "weaker", "calibrate", "score", "rank"). If an admissions reader were
 * to read this block alongside the student's essay, they should feel
 * they're reading field notes about similar essays, not a grading rubric.
 */
export function buildDescriptiveArchetypesBlock(
  archetypes: RetrievalResult<EssayArchetype>[],
): string {
  if (archetypes.length === 0) return '';
  const lines: string[] = [];
  lines.push('## REFERENCE ARCHETYPES (Patterns from Admitted Essays)');
  lines.push('');
  lines.push('These are structural and thematic patterns observed in the reference corpus.');
  lines.push('They are offered as descriptive context to widen your vocabulary for what');
  lines.push('this essay might be doing. Do not use them to judge the essay.');
  lines.push('');
  for (const r of archetypes) {
    const a = r.entity;
    const firstSentence = (a.description ?? '').split(/(?<=[.!?])\s+/)[0] ?? '';
    const stagePurpose = a.structuralStages?.[0]?.purpose ?? '';
    lines.push(`${a.displayName}: ${truncate(firstSentence, 200)}`);
    if (stagePurpose) lines.push(`  Common opening move: ${truncate(stagePurpose, 180)}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// Attribution test — detects hallucinated corpus references
// ─────────────────────────────────────────────────────────────────────────

/**
 * Scan analysis output text for `[MOVE-#]` / `[AP-#]` references and check
 * every one against the labels actually injected. Any label that appears in
 * the output but not in the injected set is a fabrication — log and flag.
 *
 * Returns the count of referenced labels + list of fabricated references.
 */
export function detectFabricatedReferences(
  outputText: string,
  injectedMoveCount: number,
  injectedAntiPatternCount: number,
): { referenced: string[]; fabricated: string[] } {
  const referenced = new Set<string>();
  const labelRe = /\[(MOVE|AP)-(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(outputText)) !== null) {
    referenced.add(`${m[1]}-${m[2]}`);
  }
  const fabricated: string[] = [];
  for (const ref of referenced) {
    const [kind, idxStr] = ref.split('-');
    const idx = Number(idxStr);
    if (kind === 'MOVE' && (idx < 1 || idx > injectedMoveCount)) fabricated.push(`[${ref}]`);
    if (kind === 'AP' && (idx < 1 || idx > injectedAntiPatternCount)) fabricated.push(`[${ref}]`);
  }
  return { referenced: Array.from(referenced).map((r) => `[${r}]`), fabricated };
}
