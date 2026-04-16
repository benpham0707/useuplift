/**
 * snapshotStore.ts — Pure composable operations over a RevisionHistory.
 *
 * Phase 1 operations:
 *   - writeSnapshot       append a new snapshot (with reset detection + pruning)
 *   - readRecentSnapshots read last N, preserving oldest→newest order
 *   - detectResetCondition inspect reset state without committing
 *   - pruneToMax          enforce the 10-entry cap, counting archived drops
 *   - mostRecentSnapshot  convenience for "current vs most-recent prior" callers
 *
 * All operations are pure: they take a RevisionHistory (or its pieces) and
 * return a NEW RevisionHistory. No hidden state, no mutation of the input.
 * The coordinator composes these.
 *
 * Reset semantics:
 *   - substantial_rewrite: token overlap < SUBSTANTIAL_OVERLAP_THRESHOLD
 *     with the most-recent prior snapshot. ARCHIVES prior snapshots
 *     (increments archivedSnapshots by their count, empties array),
 *     records a resetEvent, then appends the new snapshot.
 *   - topic_change: archetype label differs between current and most-recent
 *     prior. SOFT reset — keeps snapshots, records a resetEvent only.
 *   - manual_reset: explicit `manualReset=true` on writeSnapshot. Archives
 *     like substantial_rewrite.
 *
 * Cap: SNAPSHOT_HISTORY_MAX = 10 (exported).
 */

import type {
  EssayProfile,
} from '../profileTypes';
import {
  extractSnapshot,
  getArchetypeLabel,
  type ProfileSnapshot,
  type RevisionHistory,
  type RevisionResetSignal,
} from './profileSnapshot';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Token overlap below this threshold → substantial_rewrite reset. */
export const SUBSTANTIAL_OVERLAP_THRESHOLD = 0.3;

/** Max snapshots retained in RevisionHistory.snapshots. Excess → archivedSnapshots counter. */
export const SNAPSHOT_HISTORY_MAX = 10;

// ============================================================================
// HELPERS
// ============================================================================

export function emptyRevisionHistory(): RevisionHistory {
  return {
    snapshots: [],
    archivedSnapshots: 0,
    resetEvents: [],
  };
}

/**
 * Tokenize for overlap measurement. Deliberately simple: lowercased,
 * whitespace-split, filter empties. Matches the spec's "whitespace-split,
 * lowercased" rule exactly — no stemming or punctuation stripping, because
 * stronger tokenization would mask small-edit-but-large-rewrite cases.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Jaccard-style overlap on unique tokens.
 * Returns 1.0 when both strings are empty (no change = no reset).
 */
export function tokenOverlap(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1.0;
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 1.0 : intersection / union;
}

/**
 * Reconstruct essay text from a profile's paragraphs — matches the shape
 * extractSnapshot uses so overlap is computed over the same tokens.
 */
function profileEssayText(profile: EssayProfile): string {
  return (profile.paragraphs ?? [])
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('\n\n');
}

/**
 * Reconstruct a usable essay text from a prior snapshot. We do NOT persist
 * the full text (only the hash) — so we fall back to the essayTextLength
 * signal for a coarse comparison when we need to compute overlap with a
 * prior snapshot's CONTENT. For Phase 1, the caller computes overlap using
 * the current essay text vs the current profile's paragraphs one write ago,
 * which is equivalent to prior snapshot text ONLY when the coordinator
 * captures the pre-mutation profile. We preserve the API shape here so
 * Phase 2 can wire prior text through if needed.
 *
 * For now, `computeOverlapAgainstPrior` requires the caller to pass the
 * prior essay text explicitly; the snapshot alone is not sufficient to
 * reconstruct it.
 */

/**
 * Compute overlap between current profile text and an explicit prior essay
 * text (typically captured at the last writeSnapshot call).
 */
export function computeOverlapAgainstPrior(
  currentEssayText: string,
  priorEssayText: string,
): number {
  return tokenOverlap(currentEssayText, priorEssayText);
}

// ============================================================================
// PUBLIC: detectResetCondition
// ============================================================================

/**
 * Decide whether a write should trigger a reset, WITHOUT mutating history.
 * Callers that want to preview the decision (e.g., logging/UX) use this;
 * writeSnapshot composes the same logic internally.
 *
 * Priority order (first match wins):
 *   1. manualReset flag
 *   2. substantial_rewrite (overlap < threshold)
 *   3. topic_change (archetype differs)
 *
 * Inputs:
 *   - priorSnapshot: the most-recent prior snapshot, or null on first write
 *   - priorEssayText: the essay text from which priorSnapshot was built,
 *     or '' when unavailable (forces overlap=0 on non-empty current text,
 *     which correctly triggers substantial_rewrite only when BOTH texts
 *     are non-trivial — an empty prior text yields overlap 0 on any
 *     non-empty current text, which we squelch below)
 *   - currentEssayText: reconstructed from the current profile
 *   - priorArchetype / currentArchetype: archetype labels for topic_change
 *   - manualReset: explicit flag
 */
export function detectResetCondition(args: {
  priorSnapshot: ProfileSnapshot | null;
  priorEssayText: string | null;
  currentEssayText: string;
  priorArchetype: string | null;
  currentArchetype: string | null;
  manualReset?: boolean;
}): RevisionResetSignal {
  if (args.manualReset === true) {
    return { triggered: true, reason: 'manual_reset' };
  }

  // No prior snapshot → nothing to reset against.
  if (args.priorSnapshot === null) {
    return { triggered: false, reason: null };
  }

  // substantial_rewrite check — requires prior text. If prior text is
  // unknown (null/empty) we CANNOT honestly measure overlap; skip this
  // check rather than false-positive on first post-load write.
  if (args.priorEssayText && args.priorEssayText.length > 0) {
    const overlap = computeOverlapAgainstPrior(
      args.currentEssayText,
      args.priorEssayText,
    );
    if (overlap < SUBSTANTIAL_OVERLAP_THRESHOLD) {
      return {
        triggered: true,
        reason: 'substantial_rewrite',
        tokenOverlap: overlap,
      };
    }
  }

  // topic_change check — soft reset when archetype label differs.
  // Both null = no archetype info yet = not a change.
  if (
    args.priorArchetype !== null &&
    args.currentArchetype !== null &&
    args.priorArchetype !== args.currentArchetype
  ) {
    return { triggered: true, reason: 'topic_change' };
  }

  return { triggered: false, reason: null };
}

// ============================================================================
// PUBLIC: pruneToMax
// ============================================================================

/**
 * Trim snapshots to at most `max` entries. Excess entries are DROPPED
 * (not retained as objects) and the count is added to archivedSnapshots.
 * Returns a new RevisionHistory.
 */
export function pruneToMax(
  history: RevisionHistory,
  max: number = SNAPSHOT_HISTORY_MAX,
): RevisionHistory {
  if (history.snapshots.length <= max) return history;
  const excess = history.snapshots.length - max;
  return {
    snapshots: history.snapshots.slice(excess),
    archivedSnapshots: history.archivedSnapshots + excess,
    resetEvents: history.resetEvents,
  };
}

// ============================================================================
// PUBLIC: readRecentSnapshots / mostRecentSnapshot
// ============================================================================

/**
 * Return the last N snapshots, preserving oldest→newest order.
 * Null-safe on undefined / missing history.
 */
export function readRecentSnapshots(
  history: RevisionHistory | undefined,
  n: number,
): ProfileSnapshot[] {
  if (!history || !history.snapshots || history.snapshots.length === 0) return [];
  if (n <= 0) return [];
  if (n >= history.snapshots.length) return [...history.snapshots];
  return history.snapshots.slice(history.snapshots.length - n);
}

/**
 * Convenience — last snapshot (the "most recent prior" when called BEFORE
 * writeSnapshot on a new cycle). Returns null when history is empty.
 */
export function mostRecentSnapshot(
  history: RevisionHistory | undefined,
): ProfileSnapshot | null {
  if (!history || !history.snapshots || history.snapshots.length === 0) return null;
  return history.snapshots[history.snapshots.length - 1];
}

// ============================================================================
// PUBLIC: writeSnapshot
// ============================================================================

export interface WriteSnapshotArgs {
  /** The current history (possibly from a prior write). */
  history: RevisionHistory | undefined;
  /** Current profile — source for the extracted snapshot. */
  profile: EssayProfile;
  /** Stable session identifier — idempotency key. */
  sessionId: string;
  /** Monotonic per-essay version for the new snapshot. */
  version: number;
  /**
   * Essay text associated with the MOST RECENT PRIOR snapshot (used for
   * substantial_rewrite overlap detection). Pass null when unknown
   * (e.g., just loaded from persisted state without a cached text).
   * Note: snapshots intentionally do not persist full text — only hash —
   * so the coordinator is responsible for threading this through when it
   * wants the substantial_rewrite check to fire.
   */
  priorEssayText?: string | null;
  /** Explicit manual reset flag (archives like substantial_rewrite). */
  manualReset?: boolean;
}

export interface WriteSnapshotResult {
  history: RevisionHistory;
  snapshot: ProfileSnapshot;
  resetSignal: RevisionResetSignal;
}

/**
 * Append a new snapshot to the history, applying reset semantics and cap.
 *
 * Idempotency: if a snapshot with the same sessionId already exists,
 * it is REPLACED in place (no append, no prune change). The prior
 * snapshot's position is preserved so history order is stable.
 *
 * Returns the new history, the snapshot that was written, and the reset
 * signal that fired (if any).
 */
export function writeSnapshot(args: WriteSnapshotArgs): WriteSnapshotResult {
  const current: RevisionHistory = args.history
    ? {
        snapshots: [...args.history.snapshots],
        archivedSnapshots: args.history.archivedSnapshots,
        resetEvents: [...args.history.resetEvents],
      }
    : emptyRevisionHistory();

  const newSnapshot = extractSnapshot(args.profile, args.sessionId, args.version);

  // Idempotency: replace in place if sessionId already present.
  const existingIdx = current.snapshots.findIndex(
    (s) => s.sessionId === args.sessionId,
  );
  if (existingIdx >= 0) {
    const nextSnapshots = [...current.snapshots];
    nextSnapshots[existingIdx] = newSnapshot;
    return {
      history: {
        snapshots: nextSnapshots,
        archivedSnapshots: current.archivedSnapshots,
        resetEvents: current.resetEvents,
      },
      snapshot: newSnapshot,
      resetSignal: { triggered: false, reason: null },
    };
  }

  // Compute reset signal against most-recent prior.
  const prior = mostRecentSnapshot(current);
  const currentEssayText = profileEssayText(args.profile);
  const currentArchetype = getArchetypeLabel(args.profile);
  const priorArchetype = prior ? prior.archetypeLabel : null;

  const resetSignal = detectResetCondition({
    priorSnapshot: prior,
    priorEssayText: args.priorEssayText ?? null,
    currentEssayText,
    priorArchetype,
    currentArchetype,
    manualReset: args.manualReset,
  });

  let next: RevisionHistory = current;

  if (resetSignal.triggered && resetSignal.reason !== null) {
    const priorCount = current.snapshots.length;
    if (
      resetSignal.reason === 'substantial_rewrite' ||
      resetSignal.reason === 'manual_reset'
    ) {
      // Hard reset: archive all prior snapshots.
      next = {
        snapshots: [],
        archivedSnapshots: current.archivedSnapshots + priorCount,
        resetEvents: [
          ...current.resetEvents,
          {
            atSnapshotVersion: newSnapshot.version,
            reason: resetSignal.reason,
            priorSnapshotCount: priorCount,
          },
        ],
      };
    } else if (resetSignal.reason === 'topic_change') {
      // Soft reset: record the event, KEEP snapshots.
      next = {
        snapshots: current.snapshots,
        archivedSnapshots: current.archivedSnapshots,
        resetEvents: [
          ...current.resetEvents,
          {
            atSnapshotVersion: newSnapshot.version,
            reason: 'topic_change',
            priorSnapshotCount: priorCount,
          },
        ],
      };
    }
  }

  // Append the new snapshot.
  const appended: RevisionHistory = {
    snapshots: [...next.snapshots, newSnapshot],
    archivedSnapshots: next.archivedSnapshots,
    resetEvents: next.resetEvents,
  };

  // Enforce cap.
  const pruned = pruneToMax(appended, SNAPSHOT_HISTORY_MAX);

  return { history: pruned, snapshot: newSnapshot, resetSignal };
}

