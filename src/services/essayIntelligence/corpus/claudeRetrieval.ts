/**
 * claudeRetrieval.ts — Claude-native corpus retrieval (Wave-3a, Anthropic-only).
 *
 * Replaces the OpenAI-embedding + pgvector retrieval path with a pure-Claude
 * in-context retrieval approach:
 *
 *   1. On first call, build a compact catalog of the full Wave-3a corpus
 *      (~6-7K tokens for 190 moves + 14 archetypes + 11 anti-patterns).
 *   2. Pack the catalog into a cached Haiku system prompt (Anthropic prompt cache:
 *      subsequent calls pay ~$0.005 each instead of full prompt cost).
 *   3. Per retrieval, send a user message with the query text + instruction to
 *      return top-k IDs with relevance scores + one-line reasons.
 *   4. Hydrate the returned IDs against the structured corpus data in memory.
 *
 * Why this over pgvector+OpenAI:
 *   - Uplift is Anthropic-only. No third-party embedding keys required.
 *   - At our corpus scale (~280 entities), the full catalog fits in a single
 *     cached prompt. Retrieval latency: ~1.5s (Haiku). Cost: ~$0.005/call.
 *   - Claude judgment integrates structured metadata (voice compatibility,
 *     transferability, difficulty) directly into the ranking — the OpenAI path
 *     used pre-filter + cosine-rank, which is blind to semantic nuance.
 *   - Cache invalidation = corpus content hash (below).
 *
 * The `retrieval.ts` pgvector path is retained as legacy (can be re-enabled for
 * scale if the corpus grows past ~1000 entities).
 */

import { createHash } from 'crypto';
import { callClaudeWithRetry } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from '../analysis/llmJsonParser';
import { TOP_TIER_CRAFT_MOVES } from './topTierCraftMoves';
import { ESSAY_ARCHETYPES } from './essayArchetypes';
import { ANTI_ARCHETYPES } from './antiArchetypes';
import { VOICE_ARCHETYPE_COMPATIBILITY } from './voiceArchetypeCompatibility';
import type {
  CraftMove,
  EssayArchetype,
  VoiceRegister,
} from './corpusTypes';

// ─────────────────────────────────────────────────────────────────────────
// Model + cost profile
// ─────────────────────────────────────────────────────────────────────────

const HAIKU = 'claude-haiku-4-5-20251001';
const RETRIEVAL_MAX_TOKENS = 800;
const RETRIEVAL_TEMPERATURE = 0.1;
const RETRIEVAL_TIMEOUT_MS = 15_000;

export const CLAUDE_RETRIEVAL_API_VERSION = '3a.2.0-claude';

// ─────────────────────────────────────────────────────────────────────────
// Shared result types (parallel to retrieval.ts)
// ─────────────────────────────────────────────────────────────────────────

export interface ClaudeRetrievalResult<TEntity> {
  entity: TEntity;
  similarity: number;
  reason: string;
  provenance: {
    essayId: string | null;
    paragraph: number | null;
  };
}

export interface ClaudeRetrievalFilters {
  voiceRegisters?: VoiceRegister[];
  transferability?: 'universal' | 'broad' | 'narrow' | 'specific';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// ─────────────────────────────────────────────────────────────────────────
// In-memory lookups + cached catalog
// ─────────────────────────────────────────────────────────────────────────

const moveById = new Map(TOP_TIER_CRAFT_MOVES.map((m) => [m.id, m]));
const archetypeById = new Map(ESSAY_ARCHETYPES.map((a) => [a.id, a]));
const antiPatternById = new Map(ANTI_ARCHETYPES.map((a) => [a.id, a]));

let _movesCatalog: string | null = null;
let _archetypesCatalog: string | null = null;
let _antiPatternsCatalog: string | null = null;

function truncate(s: string, max: number): string {
  const cleaned = s.replace(/\s+/g, ' ').trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1).trim()}…`;
}

/**
 * Build the craft-moves catalog. One line per move:
 *   [id] displayName | registers:a,b | transferability | difficulty | mechanism(120ch)
 */
function getMovesCatalog(): string {
  if (_movesCatalog) return _movesCatalog;
  const lines = TOP_TIER_CRAFT_MOVES.map((m) => {
    const registers = m.compatibleRegisters.join(',');
    const essays = m.sourceEssays?.length ? ` | seen:${m.sourceEssays.length}ex` : '';
    return `[${m.id}] ${m.displayName} | ${registers} | ${m.transferability} | ${m.difficulty}${essays}\n  ${truncate(m.mechanism, 140)}`;
  });
  _movesCatalog = lines.join('\n');
  return _movesCatalog;
}

/**
 * Build the archetypes catalog.
 */
function getArchetypesCatalog(): string {
  if (_archetypesCatalog) return _archetypesCatalog;
  const lines = ESSAY_ARCHETYPES.map((a) => {
    const voices = a.voiceRequirements.join(',');
    const stages = a.structuralStages
      .map((s) => s.stageName)
      .slice(0, 5)
      .join('→');
    return `[${a.id}] voices:${voices} | stages: ${stages}\n  ${truncate(a.description, 180)}\n  when-to-use: ${truncate(a.whenToUse, 140)}`;
  });
  _archetypesCatalog = lines.join('\n');
  return _archetypesCatalog;
}

/**
 * Build the anti-patterns catalog.
 */
function getAntiPatternsCatalog(): string {
  if (_antiPatternsCatalog) return _antiPatternsCatalog;
  const lines = ANTI_ARCHETYPES.map((a) => {
    const signals = a.diagnosticSignals.slice(0, 3).map((s) => truncate(s, 80)).join(' / ');
    return `[${a.id}] ${truncate(a.description, 130)}\n  signals: ${signals}`;
  });
  _antiPatternsCatalog = lines.join('\n');
  return _antiPatternsCatalog;
}

/**
 * Content hash of the full catalog surface — used for cache-invalidation
 * keys and telemetry. Changes when any catalog string changes.
 */
export function getCatalogContentHash(): string {
  const combined = [
    getMovesCatalog(),
    getArchetypesCatalog(),
    getAntiPatternsCatalog(),
  ].join('\n═══\n');
  return createHash('sha256').update(combined).digest('hex').slice(0, 16);
}

// ─────────────────────────────────────────────────────────────────────────
// Voice-archetype safety-rail helper (identical to retrieval.ts)
// ─────────────────────────────────────────────────────────────────────────

export function getForbiddenArchetypesForVoice(voice: VoiceRegister): Set<string> {
  const forbidden = new Set<string>();
  const block = VOICE_ARCHETYPE_COMPATIBILITY.find((v) => v.voiceRegister === voice);
  if (!block) return forbidden;
  for (const cell of block.archetypeCompatibility) {
    if (cell.fit === 'forbidden') forbidden.add(cell.archetypeId);
  }
  return forbidden;
}

// ─────────────────────────────────────────────────────────────────────────
// Core: run a ranking call against Claude Haiku
// ─────────────────────────────────────────────────────────────────────────

interface RankingRow {
  id: string;
  relevance: number;
  reason: string;
}

function parseRanking(response: string, validIds: Set<string>): RankingRow[] {
  let parsed: unknown;
  try {
    parsed = parseLlmJsonOutput(response, 'claudeRetrieval');
  } catch {
    return [];
  }
  // Accept both {results: [...]} and bare array.
  const rows: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as Record<string, unknown>)?.results;
  if (!Array.isArray(rows)) return [];
  const out: RankingRow[] = [];
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const id = String((r as Record<string, unknown>).id ?? '');
    if (!validIds.has(id)) continue; // hallucinated id — drop
    const rawRel = Number((r as Record<string, unknown>).relevance);
    const relevance = Number.isFinite(rawRel) ? Math.min(1, Math.max(0, rawRel)) : 0.5;
    const reason = String((r as Record<string, unknown>).reason ?? '').slice(0, 240);
    out.push({ id, relevance, reason });
  }
  out.sort((a, b) => b.relevance - a.relevance);
  return out;
}

const SYSTEM_PREAMBLE = `You are the retrieval layer of the Uplift essay-intelligence corpus.

Your job: given a query (a paragraph of student essay text, or a thesis+strategy signature), return the top-k most relevant entries from the corpus catalog below. Relevance means: this corpus entry would help a human reader understand, score, or coach the student's text.

RULES:
1. Only return ids that appear in the catalog. Never invent ids.
2. Each result has: id (string, exact match from catalog), relevance (0-1 float), reason (one-sentence justification grounded in the catalog entry).
3. Rank by relevance descending. Only return entries with relevance ≥ 0.4.
4. If no entry meets the bar, return an empty results array.
5. Output strict JSON only, no markdown fencing:
   {"results":[{"id":"move-id","relevance":0.82,"reason":"..."},...]}

═══════════════════════════════════════════════════════════════════════════
CORPUS CATALOG (Wave-3a, version {{VERSION}})
═══════════════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRAFT MOVES (attested in admitted essays — kind of moves to REWARD on match):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{MOVES}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESSAY ARCHETYPES (structural shapes that worked):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{ARCHETYPES}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-PATTERNS (common failure modes — match if student is drifting toward one):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{ANTIS}}`;

function buildSystemPrompt(): string {
  return SYSTEM_PREAMBLE
    .replace('{{VERSION}}', CLAUDE_RETRIEVAL_API_VERSION)
    .replace('{{MOVES}}', getMovesCatalog())
    .replace('{{ARCHETYPES}}', getArchetypesCatalog())
    .replace('{{ANTIS}}', getAntiPatternsCatalog());
}

async function runRanking(
  query: string,
  instruction: string,
  validIds: Set<string>,
): Promise<RankingRow[]> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = `${instruction}\n\nQUERY:\n${query.trim()}\n\nReturn JSON now.`;
  const response = await callClaudeWithRetry<string>(
    {
      model: HAIKU,
      systemPrompt,
      userPrompt,
      maxTokens: RETRIEVAL_MAX_TOKENS,
      temperature: RETRIEVAL_TEMPERATURE,
      useJsonMode: true,
      cacheSystemPrompt: true,
      timeoutMs: RETRIEVAL_TIMEOUT_MS,
    },
  );
  return parseRanking(response.content, validIds);
}

// ─────────────────────────────────────────────────────────────────────────
// Public API — mirrors the shape of retrieval.ts
// ─────────────────────────────────────────────────────────────────────────

/**
 * Retrieve craft moves semantically relevant to the query text.
 *
 * Applies structured filters post-ranking (voice/transferability/difficulty).
 * Returns fully-hydrated CraftMove objects with provenance for coaching citation.
 */
export async function retrieveMovesBySignal(
  text: string,
  filters: ClaudeRetrievalFilters = {},
  k: number = 10,
): Promise<ClaudeRetrievalResult<CraftMove>[]> {
  const validIds = new Set(moveById.keys());
  const rows = await runRanking(
    text,
    `Rank the top ${k * 2} CRAFT MOVES most relevant to this paragraph of student essay text. Prefer moves whose detection signal actually matches what the paragraph is doing; do not reward distant thematic similarity. If the student is attempting a move imperfectly, include it with a moderate relevance.`,
    validIds,
  );
  const filtered = rows.filter((r) => {
    const entity = moveById.get(r.id);
    if (!entity) return false;
    if (filters.transferability && entity.transferability !== filters.transferability) return false;
    if (filters.difficulty && entity.difficulty !== filters.difficulty) return false;
    if (filters.voiceRegisters && filters.voiceRegisters.length > 0) {
      const hasOverlap = entity.compatibleRegisters.some((r) =>
        filters.voiceRegisters!.includes(r),
      );
      if (!hasOverlap) return false;
    }
    return true;
  });
  const top = filtered.slice(0, k);
  return top.map((r) => {
    const entity = moveById.get(r.id)!;
    const firstSource = entity.sourceEssays?.[0];
    return {
      entity,
      similarity: r.relevance,
      reason: r.reason,
      provenance: {
        essayId: firstSource?.essayId ?? null,
        paragraph: firstSource?.paragraph ?? null,
      },
    };
  });
}

/**
 * Retrieve essay archetypes matching the draft's thematic+narrative signature.
 *
 * Voice-safety-rail: archetypes whose compatibility cell for the given voice
 * is `forbidden` are filtered out before return.
 */
export async function retrieveArchetypeMatches(
  draftDescription: string,
  options: { k?: number; excludeForbiddenForVoice?: VoiceRegister } = {},
): Promise<ClaudeRetrievalResult<EssayArchetype>[]> {
  const validIds = new Set(archetypeById.keys());
  const k = options.k ?? 5;
  const rows = await runRanking(
    draftDescription,
    `Rank the top ${k * 2} ESSAY ARCHETYPES whose structural shape + when-to-use signature matches this thesis+strategy description. Prefer archetypes that genuinely fit; do not force a match when none apply.`,
    validIds,
  );
  const forbidden = options.excludeForbiddenForVoice
    ? getForbiddenArchetypesForVoice(options.excludeForbiddenForVoice)
    : new Set<string>();
  const top = rows.filter((r) => !forbidden.has(r.id)).slice(0, k);
  return top.map((r) => {
    const entity = archetypeById.get(r.id)!;
    return {
      entity,
      similarity: r.relevance,
      reason: r.reason,
      provenance: {
        essayId: entity.exemplarEssayId ?? null,
        paragraph: null,
      },
    };
  });
}

/**
 * Retrieve anti-patterns whose diagnostic signals match the student's paragraph.
 * Matches the shape of retrieval.retrieveAntiPatterns for drop-in compatibility.
 */
export async function retrieveAntiPatterns(
  draftText: string,
  k: number = 5,
): Promise<Array<{ id: string; description: string; similarity: number; reason: string }>> {
  const validIds = new Set(antiPatternById.keys());
  const rows = await runRanking(
    draftText,
    `Rank the top ${k * 2} ANTI-PATTERNS whose diagnostic signals suggest the student's paragraph is drifting toward that failure mode. Only include an anti-pattern if its signals match CONCRETELY — topic overlap alone is not enough. If the paragraph is strong and shows no failure mode, return an empty list.`,
    validIds,
  );
  return rows.slice(0, k).map((r) => {
    const entity = antiPatternById.get(r.id)!;
    return {
      id: r.id,
      description: entity.description,
      similarity: r.relevance,
      reason: r.reason,
    };
  });
}
