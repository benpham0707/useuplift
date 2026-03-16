/**
 * snapshotTrigger.ts — Auto-snapshot detection logic.
 *
 * Detects patterns that suggest the student is at a meaningful branch point
 * and should snapshot before proceeding. All detection is heuristic-based
 * (no LLM calls, $0 cost).
 *
 * Patterns detected:
 * 1. Major rewrite (>40% of a paragraph's text changed)
 * 2. Structural change (paragraph added/removed/reordered)
 * 3. Growth milestone (understanding maturity reached 'deep' for first time)
 *
 * NOT a trigger: Rapid small edits (typos, word choice adjustments).
 */

import type { SnapshotManager } from './snapshotManager';

// ============================================================================
// TYPES
// ============================================================================

/**
 * EditEvent — information about an edit, passed from the version tracker
 * or edit understanding service.
 */
export interface EditEvent {
  /** Which paragraph was edited (primary) */
  paragraph: number;
  /** Number of characters that changed */
  changedCharacters: number;
  /** Length of the original text before edit */
  originalLength: number;
  /** Type of edit */
  type: 'content' | 'structural';
  /** If structural, what kind of structural change */
  structuralChange?: 'paragraph_added' | 'paragraph_removed' | 'paragraph_reordered';
}

/**
 * AutoSnapshotDecision — result of trigger evaluation.
 */
export interface AutoSnapshotDecision {
  /** Whether to auto-snapshot */
  should: boolean;
  /** Human-readable reason for the decision */
  reason: string;
  /** Suggested snapshot name */
  suggestedName: string;
}

/**
 * MilestoneEvent — information about an understanding milestone.
 */
export interface MilestoneEvent {
  /** What milestone was reached */
  milestone: 'maturity_deep' | 'all_paragraphs_walked' | 'convergence_reached';
  /** Description of the milestone */
  description: string;
}

// ============================================================================
// AUTO-SNAPSHOT TRIGGER
// ============================================================================

/** Minimum time between auto-snapshots (ms) — prevents snapshot spam */
const MIN_AUTO_SNAPSHOT_INTERVAL_MS = 60_000; // 1 minute

/** Threshold for "major rewrite" detection (ratio of changed chars to original) */
const MAJOR_REWRITE_THRESHOLD = 0.4;

/**
 * Evaluate whether an edit should trigger an auto-snapshot.
 *
 * @param editEvent - Information about the edit
 * @param snapshotManager - For checking recent snapshot history
 * @returns Decision with reason and suggested name, or null if no trigger
 */
export function shouldAutoSnapshotForEdit(
  editEvent: EditEvent,
  snapshotManager: SnapshotManager,
): AutoSnapshotDecision | null {
  // Don't auto-snapshot if we already have a recent snapshot
  if (hasRecentSnapshot(snapshotManager)) {
    return null;
  }

  // Pattern 1: Major rewrite
  if (editEvent.type === 'content' && editEvent.originalLength > 0) {
    const changeRatio = editEvent.changedCharacters / editEvent.originalLength;
    if (changeRatio > MAJOR_REWRITE_THRESHOLD) {
      return {
        should: true,
        reason:
          `Major rewrite of P${editEvent.paragraph} detected ` +
          `(${Math.round(changeRatio * 100)}% changed). ` +
          `Auto-saving snapshot before the change.`,
        suggestedName: `Before P${editEvent.paragraph} rewrite`,
      };
    }
  }

  // Pattern 2: Structural change (paragraph added/removed/reordered)
  if (editEvent.type === 'structural' && editEvent.structuralChange) {
    const changeLabels: Record<string, string> = {
      paragraph_added: 'paragraph addition',
      paragraph_removed: 'paragraph removal',
      paragraph_reordered: 'paragraph reordering',
    };
    const label = changeLabels[editEvent.structuralChange] ?? editEvent.structuralChange;

    return {
      should: true,
      reason:
        `Structural change detected (${label}). ` +
        `Auto-saving snapshot before the change.`,
      suggestedName: `Before ${label}`,
    };
  }

  return null;
}

/**
 * Evaluate whether a growth milestone should trigger an auto-snapshot.
 *
 * @param milestoneEvent - The milestone that was reached
 * @param snapshotManager - For checking recent snapshot history and capacity
 * @returns Decision with reason and suggested name, or null if no trigger
 */
export function shouldAutoSnapshotForMilestone(
  milestoneEvent: MilestoneEvent,
  snapshotManager: SnapshotManager,
): AutoSnapshotDecision | null {
  // Don't auto-snapshot if we already have a recent snapshot
  if (hasRecentSnapshot(snapshotManager)) {
    return null;
  }

  // Don't auto-snapshot milestones if we're running low on capacity
  // (reserve 2 slots for manual snapshots)
  if (snapshotManager.count >= 3) {
    return null;
  }

  const milestoneNames: Record<string, string> = {
    maturity_deep: 'Understanding milestone: deep maturity',
    all_paragraphs_walked: 'Understanding milestone: full walk complete',
    convergence_reached: 'Understanding milestone: growth converged',
  };

  const name = milestoneNames[milestoneEvent.milestone] ?? 'Growth milestone';

  return {
    should: true,
    reason:
      `${milestoneEvent.description} ` +
      `Auto-saving snapshot at this milestone.`,
    suggestedName: name,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if there was a snapshot created within the minimum interval.
 */
function hasRecentSnapshot(snapshotManager: SnapshotManager): boolean {
  const snapshots = snapshotManager.listSnapshots();
  if (snapshots.length === 0) return false;

  const lastSnapshot = snapshots[snapshots.length - 1];
  const msSinceLastSnapshot = Date.now() - new Date(lastSnapshot.createdAt).getTime();
  return msSinceLastSnapshot < MIN_AUTO_SNAPSHOT_INTERVAL_MS;
}
