/**
 * Anchor Resolution — maps annotation text spans to character offsets
 * in the current (possibly edited) essay text.
 *
 * Resolution order:
 * 1. Hash match → use original offsets directly (anchorMethod: 'exact')
 * 2. Fuzzy substring match via greedy longest-prefix walk (anchorMethod: 'fuzzy')
 * 3. Paragraph fallback — match by paragraph index (anchorMethod: 'paragraph')
 * 4. Failed — annotation cannot be located (anchorMethod: 'failed')
 *
 * The fuzzy matching algorithm is adapted from TextUpgradeForge.tsx.
 */

import type { EssayAnnotation } from '../../../pipeline/types';
import type { ResolvedAnnotation } from '../types';

const MIN_SEGMENT_LENGTH = 8;

// ============================================================================
// FUZZY MATCHING (adapted from TextUpgradeForge)
// ============================================================================

/**
 * Find where a phrase matches within a text. If the phrase isn't a verbatim
 * substring, finds the longest contiguous matching segments by greedily
 * matching the longest prefix of the remaining phrase, then advancing.
 *
 * Returns character ranges in the target text.
 */
export function findMatchRanges(
  text: string,
  phrase: string,
  minLen = MIN_SEGMENT_LENGTH,
): Array<{ start: number; end: number }> {
  if (!phrase || !text || phrase.length < minLen) return [];

  // Strategy 1: exact substring match
  const exactIdx = text.indexOf(phrase);
  if (exactIdx !== -1) return [{ start: exactIdx, end: exactIdx + phrase.length }];

  // Strategy 2: greedy longest-prefix walk
  const ranges: Array<{ start: number; end: number }> = [];
  let phraseOffset = 0;
  let textSearchStart = 0;

  while (phraseOffset < phrase.length) {
    const remaining = phrase.slice(phraseOffset);
    if (remaining.length < minLen) break;

    // Find the longest prefix of `remaining` that exists in text after textSearchStart
    let bestLen = 0;
    let bestIdx = -1;

    for (let len = remaining.length; len >= minLen; len--) {
      const sub = remaining.slice(0, len);
      const foundIdx = text.indexOf(sub, textSearchStart);
      if (foundIdx !== -1) {
        bestLen = len;
        bestIdx = foundIdx;
        break;
      }
    }

    if (bestIdx !== -1) {
      ranges.push({ start: bestIdx, end: bestIdx + bestLen });
      phraseOffset += bestLen;
      textSearchStart = bestIdx + bestLen;
      // Skip whitespace between segments in the phrase
      while (phraseOffset < phrase.length && phrase[phraseOffset] === ' ') phraseOffset++;
    } else {
      // No prefix match found — skip one character and retry
      phraseOffset++;
    }
  }

  return ranges;
}

// ============================================================================
// TEXT HASHING (Web Crypto API for browser)
// ============================================================================

/**
 * Compute SHA-256 hash of text via Web Crypto API. Returns hex string.
 * Falls back to a simple hash if crypto.subtle is unavailable (e.g. tests).
 */
export async function computeTextHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback: simple DJB2 hash for environments without Web Crypto
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
}

// ============================================================================
// PARAGRAPH UTILITIES
// ============================================================================

function splitParagraphs(text: string): Array<{ start: number; end: number }> {
  const paragraphs: Array<{ start: number; end: number }> = [];
  let offset = 0;
  const parts = text.split('\n');
  for (const part of parts) {
    if (part.trim().length > 0) {
      paragraphs.push({ start: offset, end: offset + part.length });
    }
    offset += part.length + 1; // +1 for the newline
  }
  return paragraphs;
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve all annotations to character offsets in the current text.
 *
 * @param annotations - The annotations from the analysis result
 * @param currentText - The current essay text (may differ from analyzed text)
 * @param analysisTextHash - The SHA-256 hash of the text that was analyzed
 * @param currentTextHash - Optional pre-computed hash of currentText (avoids recomputation)
 * @returns Annotations with resolved character positions
 */
export function resolveAnchors(
  annotations: EssayAnnotation[],
  currentText: string,
  analysisTextHash: string,
  currentTextHash?: string,
): ResolvedAnnotation[] {
  const paragraphs = splitParagraphs(currentText);
  // If hashes match, offsets from the analysis are directly usable
  const textUnchanged = currentTextHash !== undefined && currentTextHash === analysisTextHash;

  return annotations.map((annotation) => {
    const { span } = annotation;

    // Strategy 1: Text unchanged — use original offsets directly
    if (textUnchanged) {
      const start = Math.min(span.startOffset, currentText.length);
      const end = Math.min(span.endOffset, currentText.length);
      return {
        ...annotation,
        resolvedStart: start,
        resolvedEnd: end,
        anchorMethod: 'exact' as const,
      };
    }

    // Strategy 2: Exact substring match of the span text
    const exactIdx = currentText.indexOf(span.text);
    if (exactIdx !== -1) {
      return {
        ...annotation,
        resolvedStart: exactIdx,
        resolvedEnd: exactIdx + span.text.length,
        anchorMethod: 'exact' as const,
      };
    }

    // Strategy 3: Fuzzy substring match
    const fuzzyRanges = findMatchRanges(currentText, span.text);
    if (fuzzyRanges.length > 0) {
      // Use the full extent of matched ranges
      const start = fuzzyRanges[0].start;
      const end = fuzzyRanges[fuzzyRanges.length - 1].end;
      return {
        ...annotation,
        resolvedStart: start,
        resolvedEnd: end,
        anchorMethod: 'fuzzy' as const,
      };
    }

    // Strategy 4: Paragraph fallback
    const paraIdx = span.paragraphIndex;
    if (paraIdx >= 0 && paraIdx < paragraphs.length) {
      const para = paragraphs[paraIdx];
      return {
        ...annotation,
        resolvedStart: para.start,
        resolvedEnd: para.end,
        anchorMethod: 'paragraph' as const,
      };
    }

    // Strategy 5: Failed — position at start of text
    return {
      ...annotation,
      resolvedStart: 0,
      resolvedEnd: 0,
      anchorMethod: 'failed' as const,
    };
  });
}
