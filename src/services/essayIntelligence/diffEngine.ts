/**
 * Diff Engine — 3-tier text diffing for Essay Understanding
 *
 * Compares old vs new essay text at paragraph, sentence, and semantic levels.
 * Uses SHA-256 hashes for fast paragraph-level change detection.
 *
 * Implements IDiffEngine from types.ts.
 */

import { createHash } from 'crypto';
import { splitParagraphs } from '../../workshop/scoring/featureExtractor';

import type {
  IDiffEngine,
  DiffResult,
  MeaningfulDiffResult,
  ParagraphUnderstanding,
  RunningUnderstanding,
} from './types';

// ============================================================================
// DIFF ENGINE
// ============================================================================

class DiffEngine implements IDiffEngine {
  /**
   * Compute SHA-256 hash of normalized text.
   * Normalizes whitespace so trivial formatting changes don't trigger re-analysis.
   */
  hashText(text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Compare old vs new essay text paragraph-by-paragraph.
   * Returns which paragraphs changed, whether structure changed, and added/removed indices.
   */
  diffText(
    oldText: string,
    newText: string,
    oldParagraphs: ParagraphUnderstanding[],
  ): DiffResult {
    const newParagraphTexts = splitParagraphs(newText);
    const oldCount = oldParagraphs.length;
    const newCount = newParagraphTexts.length;

    // Structural change: paragraph count differs
    const structuralChange = oldCount !== newCount;

    // Hash each new paragraph
    const newHashes = newParagraphTexts.map(p => this.hashText(p));

    // Find changed paragraphs by comparing hashes
    const changedParagraphs: number[] = [];
    const minCount = Math.min(oldCount, newCount);

    for (let i = 0; i < minCount; i++) {
      if (oldParagraphs[i].textHash !== newHashes[i]) {
        changedParagraphs.push(i);
      }
    }

    // Added paragraphs (indices beyond old count)
    const addedParagraphs: number[] = [];
    for (let i = oldCount; i < newCount; i++) {
      addedParagraphs.push(i);
    }

    // Removed paragraphs (indices beyond new count)
    const removedParagraphs: number[] = [];
    for (let i = newCount; i < oldCount; i++) {
      removedParagraphs.push(i);
    }

    const hasChanges =
      changedParagraphs.length > 0 ||
      addedParagraphs.length > 0 ||
      removedParagraphs.length > 0;

    // First changed index: the earliest paragraph that differs
    let firstChangedIndex: number | null = null;
    if (changedParagraphs.length > 0) {
      firstChangedIndex = changedParagraphs[0];
    } else if (addedParagraphs.length > 0) {
      firstChangedIndex = addedParagraphs[0];
    } else if (removedParagraphs.length > 0) {
      firstChangedIndex = removedParagraphs[0];
    }

    return {
      hasChanges,
      changedParagraphs,
      firstChangedIndex,
      structuralChange,
      addedParagraphs,
      removedParagraphs,
    };
  }

  /**
   * Check whether two RunningUnderstanding snapshots differ in meaningful ways.
   * "Meaningful" = thesis, arc, connections, or emotional journey changed.
   */
  meaningfulDiff(
    oldRU: RunningUnderstanding,
    newRU: RunningUnderstanding,
  ): MeaningfulDiffResult {
    const changedAspects: string[] = [];

    // 1. Thesis change
    if (oldRU.emergingThesis !== newRU.emergingThesis) {
      changedAspects.push('thesis');
    }
    if (Math.abs(oldRU.thesisConfidence - newRU.thesisConfidence) > 0.15) {
      changedAspects.push('thesis_confidence');
    }

    // 2. Arc change
    if (oldRU.arcType !== newRU.arcType) {
      changedAspects.push('arc_type');
    }
    if (oldRU.currentMomentum !== newRU.currentMomentum) {
      changedAspects.push('arc_momentum');
    }

    // 3. Connections change (count + types)
    if (oldRU.connections.length !== newRU.connections.length) {
      changedAspects.push('connections_count');
    } else {
      const oldConnStr = oldRU.connections
        .map(c => `${c.type}:${c.paragraphs.join('-')}`)
        .sort()
        .join('|');
      const newConnStr = newRU.connections
        .map(c => `${c.type}:${c.paragraphs.join('-')}`)
        .sort()
        .join('|');
      if (oldConnStr !== newConnStr) {
        changedAspects.push('connections_content');
      }
    }

    // 4. Emotional journey change
    if (oldRU.emotionalArc.length !== newRU.emotionalArc.length) {
      changedAspects.push('emotional_journey');
    } else {
      const emotionChanged = oldRU.emotionalArc.some((ea, i) => {
        const newEa = newRU.emotionalArc[i];
        return ea.register !== newEa.register || Math.abs(ea.depth - newEa.depth) > 0.2;
      });
      if (emotionChanged) {
        changedAspects.push('emotional_journey');
      }
    }

    // 5. Voice consistency change
    if (
      Math.abs(
        oldRU.voiceFingerprint.consistencyScore -
        newRU.voiceFingerprint.consistencyScore
      ) > 0.15
    ) {
      changedAspects.push('voice_consistency');
    }

    // 6. AO takeaway change
    if (oldRU.aoTakeaway !== newRU.aoTakeaway) {
      changedAspects.push('ao_takeaway');
    }

    // 7. Memorability factor change
    if (oldRU.memorabilityFactor !== newRU.memorabilityFactor) {
      changedAspects.push('memorability');
    }

    // 8. Strengths/weaknesses count change
    if (oldRU.strengthsFound.length !== newRU.strengthsFound.length) {
      changedAspects.push('strengths');
    }
    if (oldRU.weaknessesFound.length !== newRU.weaknessesFound.length) {
      changedAspects.push('weaknesses');
    }

    return {
      isMeaningful: changedAspects.length > 0,
      changedAspects,
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const diffEngine = new DiffEngine();
export { DiffEngine };
