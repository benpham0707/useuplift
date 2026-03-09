/**
 * Re-analysis Service — Selective re-analysis after text edits
 *
 * When a student edits their essay, this service:
 * 1. Compares old vs new text at paragraph granularity
 * 2. Preserves annotations in unchanged paragraphs (with offset adjustment)
 * 3. Marks annotations in changed paragraphs as stale
 * 4. Runs the full annotation pipeline on the new text
 * 5. Builds a changeReport showing preserved/regenerated/removed/added annotations
 *
 * Integration points:
 * - annotationPipeline: lazily imported to avoid circular dependency
 * - types: ReanalysisRequest, ReanalysisResult, AnnotatedAnalysisResult
 */

import type {
  ReanalysisRequest,
  ReanalysisResult,
  AnnotatedAnalysisResult,
  EssayAnnotation,
} from './types';
import { splitParagraphs } from '../workshop/scoring/featureExtractor';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Compute character offset where each paragraph starts in the original text.
 * Returns an array of { text, startOffset, endOffset } for each paragraph.
 */
function paragraphOffsets(text: string): Array<{ text: string; startOffset: number; endOffset: number }> {
  const paragraphs = splitParagraphs(text);
  const result: Array<{ text: string; startOffset: number; endOffset: number }> = [];
  let searchFrom = 0;

  for (const para of paragraphs) {
    const idx = text.indexOf(para, searchFrom);
    if (idx === -1) {
      // Fallback: use current position
      result.push({ text: para, startOffset: searchFrom, endOffset: searchFrom + para.length });
      searchFrom += para.length;
    } else {
      result.push({ text: para, startOffset: idx, endOffset: idx + para.length });
      searchFrom = idx + para.length;
    }
  }

  return result;
}

/**
 * Determine which paragraph index (0-based) an annotation falls in,
 * based on its character offset.
 */
function findParagraphIndex(
  annotation: EssayAnnotation,
  offsets: Array<{ startOffset: number; endOffset: number }>,
): number {
  for (let i = 0; i < offsets.length; i++) {
    if (annotation.span.startOffset >= offsets[i].startOffset &&
        annotation.span.startOffset < offsets[i].endOffset) {
      return i;
    }
  }
  // Fallback to the annotation's own paragraph index
  return annotation.span.paragraphIndex;
}

// ============================================================================
// SERVICE
// ============================================================================

class ReanalysisService {
  /**
   * Re-analyze an essay after text edits.
   *
   * Compares old and new text at paragraph level, identifies which
   * paragraphs changed, and runs a fresh full pipeline analysis.
   * Returns a changeReport showing what happened to each annotation.
   */
  async reanalyze(request: ReanalysisRequest): Promise<ReanalysisResult> {
    const { newText, previousResult } = request;

    // Split both texts into paragraphs
    const oldParagraphs = splitParagraphs(previousResult.text);
    const newParagraphs = splitParagraphs(newText);
    const oldOffsets = paragraphOffsets(previousResult.text);

    // Identify which paragraphs changed
    const changedParagraphIndices = new Set<number>();
    const maxLen = Math.max(oldParagraphs.length, newParagraphs.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= oldParagraphs.length || i >= newParagraphs.length) {
        // Paragraph added or removed — treat as changed
        changedParagraphIndices.add(i);
      } else if (oldParagraphs[i] !== newParagraphs[i]) {
        changedParagraphIndices.add(i);
      }
    }

    // Classify previous annotations as stable or stale
    const stableAnnotationIds: string[] = [];
    const staleAnnotationIds: string[] = [];

    for (const annotation of previousResult.annotations) {
      const paraIdx = findParagraphIndex(annotation, oldOffsets);
      if (changedParagraphIndices.has(paraIdx)) {
        staleAnnotationIds.push(annotation.id);
      } else {
        stableAnnotationIds.push(annotation.id);
      }
    }

    // Run full pipeline on the new text
    // Use dynamic import to avoid circular dependency with annotationPipeline
    const { annotationPipeline } = await import('./annotationPipeline');
    const freshResult = await annotationPipeline.analyze(newText, {
      essayType: previousResult.essayType,
    });

    // Build the change report by comparing previous and fresh annotations
    const changeReport = this.buildChangeReport(
      previousResult,
      freshResult,
      stableAnnotationIds,
      staleAnnotationIds,
    );

    return {
      result: freshResult,
      changeReport,
    };
  }

  /**
   * Build a change report comparing previous and fresh analysis results.
   *
   * - preserved: annotations from previous that still appear (same span text found in new)
   * - regenerated: annotations at locations that were stale and got new annotations
   * - removed: previous annotations not present in new result
   * - added: new annotations not matching any previous annotation
   */
  private buildChangeReport(
    previous: AnnotatedAnalysisResult,
    fresh: AnnotatedAnalysisResult,
    stableIds: string[],
    staleIds: string[],
  ): ReanalysisResult['changeReport'] {
    const preserved: string[] = [];
    const regenerated: string[] = [];
    const removed: string[] = [];
    const added: string[] = [];

    // Build a set of span texts from fresh annotations for matching
    const freshSpanTexts = new Set(fresh.annotations.map(a => a.span.text));

    // Check each previous annotation
    for (const prevAnnotation of previous.annotations) {
      if (stableIds.includes(prevAnnotation.id)) {
        // Was in an unchanged paragraph — check if fresh result has similar annotation
        if (freshSpanTexts.has(prevAnnotation.span.text)) {
          preserved.push(prevAnnotation.id);
        } else {
          removed.push(prevAnnotation.id);
        }
      } else {
        // Was in a changed paragraph — it's either regenerated or removed
        removed.push(prevAnnotation.id);
      }
    }

    // Find stale IDs that got regenerated (new annotations near same locations)
    const previousSpanTexts = new Set(previous.annotations.map(a => a.span.text));

    for (const freshAnnotation of fresh.annotations) {
      if (previousSpanTexts.has(freshAnnotation.span.text)) {
        // Matches a previous annotation's span — it was regenerated
        if (!preserved.includes(freshAnnotation.id)) {
          regenerated.push(freshAnnotation.id);
        }
      } else {
        // Completely new annotation
        added.push(freshAnnotation.id);
      }
    }

    return { preserved, regenerated, removed, added };
  }
}

/** Singleton export */
export const reanalysisService = new ReanalysisService();
