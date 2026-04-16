/**
 * profileSnapshot.ts — Pure types + extraction + hashing for cross-session
 * revision history.
 *
 * Phase 1 of the Revision History system. Snapshots are the minimal subset
 * of a profile that Phase 2 (Voice Evolution tracking) and Phase 3 (cross-
 * revision trend analysis) need to reason about WITHOUT having to carry
 * full EssayProfile history in memory.
 *
 * Scope guards:
 *   - Pure computation only. No I/O, no LLM calls.
 *   - No dependencies beyond Node built-ins (node:crypto for hashing).
 *   - Types + extract + hash ONLY. Storage/reset logic lives in
 *     `snapshotStore.ts`.
 *
 * Versioning note: this module is DIFFERENT from `versioning/` — versioning
 * handles per-turn in-session snapshots; this module handles persisted
 * cross-session history capped at 10 entries.
 */

import { createHash } from 'node:crypto';
import type {
  EssayProfile,
  Finding,
  FindingMaturity,
  ImprovementPhase,
  VoiceIdentity,
} from '../profileTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Severity scale for snapshot findings. NOTE: the live Finding type does NOT
 * currently expose a direct severity field; this snapshot defaults to
 * 'moderate' for every finding pending a future schema extension. Downstream
 * consumers comparing across snapshots must treat severity as a stable
 * placeholder until a real severity signal flows in.
 */
export type SnapshotFindingSeverity = 'moderate' | 'significant' | 'severe';

/**
 * Maturity values retained in the snapshot. The live FindingMaturity enum is
 * richer (hypothesis | developing | confirmed | deepened | superseded);
 * we collapse it into the three-state snapshot schema to keep the subset
 * stable across schema evolution.
 */
export type SnapshotFindingMaturity = 'active' | 'addressed' | 'superseded';

/** Vividness signal derived deterministically from voice marker/weakness counts. */
export type VividnessSignal = 'vivid' | 'balanced' | 'flattened';

/**
 * Snapshot-shape Finding — the minimal slice of a Finding Phase 2/3 need.
 * Fields absent from the live Finding type are derived; see mapping notes
 * in `extractSnapshotFindings`.
 */
export interface SnapshotFinding {
  id: string;
  paragraph: number;
  sentenceIndex: number | null;
  anchorText: string;
  craftCategory: string;
  severity: SnapshotFindingSeverity;
  maturity: SnapshotFindingMaturity;
  /**
   * All dimensions on the underlying Finding, lowercased. Populated ONLY
   * when `finding.dimensions.length >= 2`; undefined when 0 or 1. This is
   * a size optimization — the single-dimension case is already fully
   * captured by `craftCategory`, so storing a one-element array per
   * finding across 10 snapshots would inflate history for no signal.
   *
   * Consumers (pattern detection) should read this field when present and
   * fall back to `craftCategory` when it is undefined.
   */
  allDimensions?: string[];
}

/** Compact voice-identity slice for cross-revision Voice Evolution checks. */
export interface VoiceIdentitySnapshot {
  primaryRegister: string | null;
  voiceMarkers: string[];
  voiceWeaknesses: string[];
  registerShifts: Array<{ paragraph: number; from: string; to: string }>;
  vividnessSignal: VividnessSignal;
}

/**
 * ProfileSnapshot — the only object Phase 2/3 consumers read. It is
 * intentionally small (target <5 KB on realistic profiles) so that stacking
 * 10 of them in a profile adds minimal storage overhead.
 *
 * Ordering invariant: when held in a RevisionHistory.snapshots array, they
 * are stored oldest → newest. Consumers wanting "most recent prior" should
 * read `snapshots[snapshots.length - 1]` BEFORE a new snapshot is appended.
 */
export interface ProfileSnapshot {
  sessionId: string;
  version: number;
  timestamp: string;
  essayTextHash: string;
  essayTextLength: number;
  improvementPhase: ImprovementPhase | null;
  findings: SnapshotFinding[];
  voiceIdentitySnapshot: VoiceIdentitySnapshot;
  /**
   * 0–1 normalization of `admissionsPositioning.archetypeContext.poolDensity`.
   * Mapping: saturated=1.0, common=0.75, moderate=0.5, uncommon=0.25,
   * rare=0.1. 0 when no archetypeContext is present.
   *
   * (Note: the Phase 1 spec referred to this as
   * `aoFirstRead.archetypeContext.saturationInPool` — that path does not
   * exist in the live schema. The archetype fields actually live under
   * `admissionsPositioning.archetypeContext` and use `poolDensity`. We
   * translate here so Phase 2+ consumers see a stable 0–1 scalar.)
   */
  archetypeSaturation: number;
  /**
   * Raw archetype label captured at snapshot time, or null when absent.
   * Used by `detectResetCondition` for topic_change detection — comparing
   * labels across snapshots is the only reliable signal that the essay's
   * archetype has shifted (saturation alone collapses too many cases).
   */
  archetypeLabel: string | null;
}

/**
 * RevisionResetSignal — returned from `detectResetCondition` so callers
 * can inspect WHY a reset was decided before committing the write.
 */
export interface RevisionResetSignal {
  triggered: boolean;
  reason: 'substantial_rewrite' | 'topic_change' | 'manual_reset' | null;
  tokenOverlap?: number;
}

/**
 * RevisionHistory — the container the coordinator stores on the profile.
 *
 * Invariants:
 *   - snapshots[] is oldest → newest
 *   - snapshots.length ≤ 10 (pruneToMax enforces)
 *   - archivedSnapshots counts historical entries that were dropped
 *     (by pruning or by substantial_rewrite / manual_reset)
 *   - resetEvents is append-only; each entry records a reset trigger
 */
export interface RevisionHistory {
  snapshots: ProfileSnapshot[];
  archivedSnapshots: number;
  resetEvents: Array<{
    atSnapshotVersion: number;
    reason: 'substantial_rewrite' | 'topic_change' | 'manual_reset';
    priorSnapshotCount: number;
  }>;
}

// ============================================================================
// HASHING
// ============================================================================

/**
 * hashEssayText — stable short hash used to identify a specific essay-text
 * state across snapshots. We use SHA-1 (fast, available in Node built-ins,
 * no deps) and keep the first 16 hex chars — collision risk is negligible
 * for per-student snapshot chains (<< 10 entries per profile).
 *
 * NOT a security primitive — this is a content fingerprint, not a MAC.
 */
export function hashEssayText(text: string): string {
  return createHash('sha1').update(text, 'utf8').digest('hex').slice(0, 16);
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

/**
 * Translate live FindingMaturity → snapshot three-state maturity.
 *
 * - 'superseded' maps verbatim (preserves the explicit superseded signal).
 * - everything else maps to 'active' because Findings in flight are the
 *   only live state the current schema expresses. A future 'addressed'
 *   state should be plumbed through when the live type grows one.
 */
function mapMaturity(m: FindingMaturity): SnapshotFindingMaturity {
  if (m === 'superseded') return 'superseded';
  // 'hypothesis' | 'developing' | 'confirmed' | 'deepened' are all live work
  return 'active';
}

/**
 * Derive anchor text from a Finding. Priority order:
 *   1. first evidence.text (if 'present' and non-empty)
 *   2. first evidence.text (even if 'absent' — still a concrete snippet)
 *   3. claim.slice(0, 120) fallback
 */
function deriveAnchorText(f: Finding): string {
  for (const ev of f.evidence) {
    if (ev.text && ev.text.length > 0 && ev.type === 'present') {
      return ev.text;
    }
  }
  for (const ev of f.evidence) {
    if (ev.text && ev.text.length > 0) return ev.text;
  }
  const claim = f.claim ?? '';
  return claim.slice(0, 120);
}

/**
 * Derive craftCategory from Finding.dimensions. Primary = first dimension,
 * lowercased. Empty dimensions → 'uncategorized'.
 *
 * Using only the FIRST dimension (not a join) keeps categories comparable
 * across snapshots; Finding.dimensions is ordered but not rank-ordered,
 * so Phase 2+ consumers should treat category as a coarse bucket.
 */
function deriveCraftCategory(f: Finding): string {
  if (!f.dimensions || f.dimensions.length === 0) return 'uncategorized';
  return String(f.dimensions[0]).toLowerCase();
}

/**
 * Extract paragraph + sentenceIndex from FindingScope. Scope shapes:
 *   - word | sentence | sentence_group | paragraph: has `paragraph`
 *     (sentences[] is primary for sentence scope)
 *   - cross_paragraph: use paragraphs[0] when present
 *   - essay_level: paragraph = -1, sentence = null
 */
function deriveLocation(f: Finding): { paragraph: number; sentenceIndex: number | null } {
  const scope = f.scope;
  if (!scope) return { paragraph: -1, sentenceIndex: null };

  if (scope.type === 'essay_level') {
    return { paragraph: -1, sentenceIndex: null };
  }

  if (scope.type === 'cross_paragraph') {
    const p = scope.paragraphs && scope.paragraphs.length > 0 ? scope.paragraphs[0] : -1;
    return { paragraph: p, sentenceIndex: null };
  }

  const paragraph = typeof scope.paragraph === 'number' ? scope.paragraph : -1;
  let sentenceIndex: number | null = null;
  if (scope.type === 'sentence' && scope.sentences && scope.sentences.length > 0) {
    sentenceIndex = scope.sentences[0];
  }
  // sentence_group / paragraph / word: leave sentenceIndex null unless
  // only one sentence is scoped (then treat it as the anchor)
  if (
    sentenceIndex === null &&
    scope.sentences &&
    scope.sentences.length === 1
  ) {
    sentenceIndex = scope.sentences[0];
  }
  return { paragraph, sentenceIndex };
}

/**
 * Map live Findings to SnapshotFinding[]. See header comments on severity:
 * there is no severity signal in the live type, so we default to 'moderate'
 * for every finding. Superseded findings are INCLUDED so downstream trend
 * tracking can observe when problems were resolved.
 *
 * `allDimensions` is populated ONLY when the underlying Finding carries 2+
 * dimensions — single-dimension findings are fully captured by
 * `craftCategory`, so we skip the redundant array to keep snapshot size
 * small.
 */
function extractSnapshotFindings(findings: Finding[]): SnapshotFinding[] {
  const out: SnapshotFinding[] = [];
  for (const f of findings) {
    const loc = deriveLocation(f);
    const dimsLower = Array.isArray(f.dimensions)
      ? f.dimensions.map((d) => String(d).toLowerCase())
      : [];
    const allDimensions = dimsLower.length >= 2 ? dimsLower : undefined;
    out.push({
      id: f.id,
      paragraph: loc.paragraph,
      sentenceIndex: loc.sentenceIndex,
      anchorText: deriveAnchorText(f),
      craftCategory: deriveCraftCategory(f),
      // ─────────────────────────────────────────────────────────────────
      // SEVERITY TODO (Round 7b or later)
      //
      // The `severity: 'moderate'` assignment below is CARGO-CULTED from
      // the Round 7a spec — the live `Finding` type does not expose a
      // severity signal, so every snapshot finding gets the same value.
      // That makes downstream severity gates meaningless.
      //
      // When a real severity signal lands on `Finding` (expected Round 7b
      // or later), update this mapping to read it and update
      // `detectPatternLevelIssues` in `revisionIntelligence.ts` to gate
      // on `severity >= significant`. The cross-file TODO is flagged at
      // the top of `detectPatternLevelIssues` too.
      // ─────────────────────────────────────────────────────────────────
      severity: 'moderate',
      maturity: mapMaturity(f.maturity),
      ...(allDimensions ? { allDimensions } : {}),
    });
  }
  return out;
}

/**
 * Derive vividnessSignal deterministically from voice marker / weakness
 * cardinality. The rule is intentionally simple — Phase 2's Voice Evolution
 * pass reads this off the snapshot directly so no extra computation crosses
 * the snapshot boundary.
 */
function deriveVividness(
  markers: string[],
  weaknesses: string[],
): VividnessSignal {
  const m = markers.length;
  const w = weaknesses.length;
  if (m >= 3 && w <= 1) return 'vivid';
  if (w >= 3 && m <= 1) return 'flattened';
  return 'balanced';
}

function extractVoiceIdentitySnapshot(voice: VoiceIdentity): VoiceIdentitySnapshot {
  const markers = Array.isArray(voice.voiceMarkers) ? voice.voiceMarkers : [];
  const weaknesses = Array.isArray(voice.voiceWeaknesses) ? voice.voiceWeaknesses : [];
  const shifts = Array.isArray(voice.registerShifts)
    ? voice.registerShifts.map((s) => ({
        paragraph: s.paragraph,
        from: s.from,
        to: s.to,
      }))
    : [];
  const primaryRegister =
    typeof voice.primaryRegister === 'string' && voice.primaryRegister.length > 0
      ? voice.primaryRegister
      : typeof voice.register === 'string' && voice.register.length > 0
        ? voice.register
        : null;

  return {
    primaryRegister,
    voiceMarkers: markers,
    voiceWeaknesses: weaknesses,
    registerShifts: shifts,
    vividnessSignal: deriveVividness(markers, weaknesses),
  };
}

/**
 * Normalize `admissionsPositioning.archetypeContext.poolDensity` → 0–1.
 * See ProfileSnapshot.archetypeSaturation docblock for rationale.
 */
function deriveArchetypeSaturation(profile: EssayProfile): number {
  const ctx = profile.admissionsPositioning?.archetypeContext;
  if (!ctx) return 0;
  switch (ctx.poolDensity) {
    case 'saturated':
      return 1.0;
    case 'common':
      return 0.75;
    case 'moderate':
      return 0.5;
    case 'uncommon':
      return 0.25;
    case 'rare':
      return 0.1;
    default:
      return 0;
  }
}

// ============================================================================
// PUBLIC: extractSnapshot
// ============================================================================

/**
 * Build a ProfileSnapshot from a full EssayProfile.
 *
 * Pure function — no profile mutation, no I/O. The caller (typically
 * `snapshotStore.writeSnapshot` composed from the coordinator) is
 * responsible for persisting the result.
 *
 * @param profile   The full profile at the moment of capture.
 * @param sessionId Stable identifier for the session; idempotency key.
 *                  Writing with the same id REPLACES the prior entry.
 * @param version   Monotonic per-essay counter the caller maintains.
 */
export function extractSnapshot(
  profile: EssayProfile,
  sessionId: string,
  version: number,
): ProfileSnapshot {
  const essayText = (profile.paragraphs ?? [])
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('\n\n');

  const improvementPhase: ImprovementPhase | null =
    profile.index && profile.index.improvementPhase
      ? profile.index.improvementPhase
      : null;

  return {
    sessionId,
    version,
    timestamp: new Date().toISOString(),
    essayTextHash: hashEssayText(essayText),
    essayTextLength: essayText.length,
    improvementPhase,
    findings: extractSnapshotFindings(profile.findings ?? []),
    voiceIdentitySnapshot: extractVoiceIdentitySnapshot(
      profile.voiceIdentity ?? ({} as VoiceIdentity),
    ),
    archetypeSaturation: deriveArchetypeSaturation(profile),
    archetypeLabel: getArchetypeLabel(profile),
  };
}

/**
 * Return the archetype label used for topic-change detection.
 * Exported so snapshotStore can compare archetype labels between the
 * incoming profile and the most-recent prior snapshot without having to
 * re-traverse the full profile. Returns null when no archetype is set.
 */
export function getArchetypeLabel(profile: EssayProfile): string | null {
  const ctx = profile.admissionsPositioning?.archetypeContext;
  if (!ctx || typeof ctx.archetype !== 'string' || ctx.archetype.length === 0) {
    return null;
  }
  return ctx.archetype;
}
