/**
 * Sentence-level position mapping utilities.
 *
 * The editor document is paragraph-level (one <p> per paragraph); sentences
 * are NOT ProseMirror nodes. Sentence boundaries are derived from byte offsets
 * stored on `SentenceProfile` (startOffset / endOffset are offsets within the
 * paragraph's plain text).
 *
 * PM position math reminder:
 *   - Each paragraph node contributes +1 (opening) and +1 (closing) in the
 *     PM position sequence.
 *   - Text inside a paragraph is a flat run of characters, each contributing +1.
 *   - So for paragraph P at doc-node index i, its content starts at
 *     `textStart = docPosition(P) + 1` and ends at `textStart + P.text.length`.
 *
 * We walk the doc once, record each paragraph's text-start PM position, then
 * convert sentence (paragraphIndex, startOffset, endOffset) → PM range via
 *   from = paragraphTextStart + startOffset
 *   to   = paragraphTextStart + endOffset
 *
 * This strategy is resilient to editing inside a paragraph as long as the
 * profile is re-derived after the edit (Workstream D owns incremental re-analysis).
 * Between analyses, stale profile offsets may drift; sentenceMapping is
 * best-effort and returns null if offsets overflow the paragraph length.
 */

import type { Editor } from '@tiptap/react';
import type { Node as PmNode } from '@tiptap/pm/model';
import type { EssayProfile, SentenceProfile } from './stubs';

export interface ParagraphPositions {
  /** Paragraph index in profile.paragraphs. */
  paragraphIndex: number;
  /** PM position of the first character of this paragraph's text content. */
  textStart: number;
  /** PM position immediately after the last character. */
  textEnd: number;
  /** Raw text length (textEnd - textStart). */
  textLength: number;
}

/**
 * Walk the doc and record each top-level paragraph's text-start / text-end PM positions.
 *
 * Assumption: profile.paragraphs order matches doc paragraph order 1:1. If the
 * doc has more paragraphs than the profile (e.g. student added a blank line),
 * the extra ones are ignored. If the doc has fewer, extra profile paragraphs
 * are skipped.
 */
export function buildParagraphPositions(doc: PmNode): ParagraphPositions[] {
  const positions: ParagraphPositions[] = [];
  let paragraphIndex = 0;

  // Top-level children are paragraphs (per our schema — see AnnotationEditor).
  doc.forEach((node, offset) => {
    if (node.type.name !== 'paragraph') return;
    // `offset` is the position BEFORE the paragraph node. Its content starts at offset + 1.
    const textStart = offset + 1;
    const textEnd = textStart + node.textContent.length;
    positions.push({
      paragraphIndex,
      textStart,
      textEnd,
      textLength: textEnd - textStart,
    });
    paragraphIndex += 1;
  });

  return positions;
}

/**
 * Resolve a sentence ID to its PM position range.
 * Returns null if the sentence's paragraph isn't in the doc, or offsets overflow.
 */
export function sentenceIdToRange(
  editor: Editor | null,
  sentenceId: string,
  profile: EssayProfile,
): { from: number; to: number } | null {
  if (!editor) return null;
  const sentence = profile.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return null;
  return sentenceToRange(editor, sentence);
}

export function sentenceToRange(
  editor: Editor,
  sentence: SentenceProfile,
): { from: number; to: number } | null {
  const positions = buildParagraphPositions(editor.state.doc);
  const paragraph = positions[sentence.paragraphIndex];
  if (!paragraph) return null;

  const from = paragraph.textStart + sentence.startOffset;
  const to = paragraph.textStart + sentence.endOffset;

  if (from < paragraph.textStart || to > paragraph.textEnd || from >= to) {
    return null;
  }
  return { from, to };
}

/**
 * Reverse lookup: given a PM position, find the sentence ID containing it.
 * Used by Workstream J (click manager) to map clicks → sentence IDs when a
 * ProseMirror transaction coordinate is all they have.
 *
 * Accepts either a TipTap Editor (external callers) or a raw PM doc (internal
 * PM handlers that only have a view). The `editorOrDoc` discriminator keeps
 * both call paths ergonomic.
 */
export function positionToSentenceId(
  editorOrDoc: Editor | PmNode | null,
  pos: number,
  profile: EssayProfile,
): string | null {
  if (!editorOrDoc) return null;
  // TipTap's Editor instance exposes `.state.doc`; a raw PM node does not.
  // Duck-type on the presence of `state` to pick the doc.
  const doc: PmNode = (editorOrDoc as Editor).state
    ? (editorOrDoc as Editor).state.doc
    : (editorOrDoc as PmNode);
  const positions = buildParagraphPositions(doc);

  // Binary search would be overkill (paragraphs ≤ ~12 on a Common App essay).
  const paragraph = positions.find((p) => pos >= p.textStart && pos <= p.textEnd);
  if (!paragraph) return null;

  const offsetInParagraph = pos - paragraph.textStart;
  const candidates = profile.sentences.filter(
    (s) => s.paragraphIndex === paragraph.paragraphIndex,
  );
  // Sentences are contiguous within a paragraph; find the one whose range
  // contains offsetInParagraph.
  const hit = candidates.find(
    (s) => offsetInParagraph >= s.startOffset && offsetInParagraph < s.endOffset,
  );
  return hit?.id ?? null;
}

/**
 * Produce a precomputed map for rendering passes that need every sentence's range at once
 * (decorations.ts calls this once per render).
 */
export function buildSentenceRangeMap(
  doc: PmNode,
  profile: EssayProfile,
): Map<string, { from: number; to: number }> {
  const positions = buildParagraphPositions(doc);
  const map = new Map<string, { from: number; to: number }>();

  for (const sentence of profile.sentences) {
    const paragraph = positions[sentence.paragraphIndex];
    if (!paragraph) continue;
    const from = paragraph.textStart + sentence.startOffset;
    const to = paragraph.textStart + sentence.endOffset;
    if (from < paragraph.textStart || to > paragraph.textEnd || from >= to) continue;
    map.set(sentence.id, { from, to });
  }
  return map;
}
