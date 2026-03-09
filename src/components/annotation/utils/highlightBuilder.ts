/**
 * Highlight Builder — converts resolved annotations into renderable text segments.
 *
 * Algorithm:
 * 1. Filter annotations by active filters (severity, dimension, stale)
 * 2. Collect all boundary points (start/end of each annotation)
 * 3. Sort boundary points and deduplicate
 * 4. Walk through text, splitting at boundaries
 * 5. For overlapping annotations: highest severity wins for styling
 *
 * Also provides paragraph-level summary info for minimap navigation.
 */

import type { AnnotationSeverity } from '../../../pipeline/types';
import type { ResolvedAnnotation, AnnotationFilters, TextSegment, ParagraphInfo } from '../types';

// ============================================================================
// SEVERITY ORDERING (higher index = more urgent)
// ============================================================================

const SEVERITY_RANK: Record<AnnotationSeverity, number> = {
  strength: 0,
  suggestion: 1,
  important: 2,
  critical: 3,
};

function compareSeverity(a: AnnotationSeverity, b: AnnotationSeverity): number {
  return SEVERITY_RANK[a] - SEVERITY_RANK[b];
}

function maxSeverity(severities: AnnotationSeverity[]): AnnotationSeverity | undefined {
  if (severities.length === 0) return undefined;
  return severities.reduce((max, s) => (compareSeverity(s, max) > 0 ? s : max));
}

// ============================================================================
// ANNOTATION FILTERING
// ============================================================================

function passesFilter(annotation: ResolvedAnnotation, filters: AnnotationFilters): boolean {
  // Severity filter
  if (!filters.severities.has(annotation.severity)) return false;

  // Dimension filter (empty set = show all)
  if (filters.dimensionIds.size > 0 && !filters.dimensionIds.has(annotation.dimensionId)) return false;

  // Stale filter
  if (!filters.showStale && annotation.stale) return false;

  // Skip failed anchors
  if (annotation.anchorMethod === 'failed') return false;

  return true;
}

// ============================================================================
// SEGMENT BUILDER
// ============================================================================

/**
 * Build renderable text segments from resolved annotations and active filters.
 *
 * Each segment is a contiguous span of text that either has no annotations
 * or has a consistent set of overlapping annotations. The dominant severity
 * is the highest severity among overlapping annotations (for highlight color).
 */
export function buildHighlightSegments(
  text: string,
  annotations: ResolvedAnnotation[],
  filters: AnnotationFilters,
): TextSegment[] {
  if (!text) return [];

  // Step 1: filter annotations
  const active = annotations.filter((a) => passesFilter(a, filters));

  if (active.length === 0) {
    return [{ text, start: 0, end: text.length, annotations: [] }];
  }

  // Step 2: collect all boundary points
  const boundarySet = new Set<number>();
  boundarySet.add(0);
  boundarySet.add(text.length);

  for (const a of active) {
    if (a.resolvedStart >= 0 && a.resolvedStart <= text.length) boundarySet.add(a.resolvedStart);
    if (a.resolvedEnd >= 0 && a.resolvedEnd <= text.length) boundarySet.add(a.resolvedEnd);
  }

  // Step 3: sort boundary points
  const boundaries = Array.from(boundarySet).sort((a, b) => a - b);

  // Step 4: walk segments
  const segments: TextSegment[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    if (segStart === segEnd) continue;

    // Find all annotations that overlap this segment
    const overlapping = active.filter(
      (a) => a.resolvedStart < segEnd && a.resolvedEnd > segStart,
    );

    const dominant = overlapping.length > 0
      ? maxSeverity(overlapping.map((a) => a.severity))
      : undefined;

    segments.push({
      text: text.slice(segStart, segEnd),
      start: segStart,
      end: segEnd,
      annotations: overlapping,
      dominantSeverity: dominant,
    });
  }

  return segments;
}

// ============================================================================
// PARAGRAPH INFO BUILDER
// ============================================================================

const EMPTY_SEVERITY_COUNTS: Record<AnnotationSeverity, number> = {
  critical: 0,
  important: 0,
  suggestion: 0,
  strength: 0,
};

/**
 * Build paragraph-level summary information for minimap and navigation.
 * Annotations are counted per paragraph based on their resolved positions.
 */
export function buildParagraphInfo(
  text: string,
  annotations: ResolvedAnnotation[],
): ParagraphInfo[] {
  if (!text) return [];

  const paragraphs: ParagraphInfo[] = [];
  const lines = text.split('\n');
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const startOffset = offset;
    const endOffset = offset + line.length;

    // Only include non-empty paragraphs
    if (line.trim().length > 0) {
      // Count annotations touching this paragraph
      const severityCounts: Record<AnnotationSeverity, number> = { ...EMPTY_SEVERITY_COUNTS };
      let annotationCount = 0;

      for (const a of annotations) {
        if (a.anchorMethod === 'failed') continue;
        // Annotation overlaps this paragraph if its range intersects
        if (a.resolvedStart < endOffset && a.resolvedEnd > startOffset) {
          annotationCount++;
          severityCounts[a.severity]++;
        }
      }

      paragraphs.push({
        index: paragraphs.length,
        text: line,
        startOffset,
        endOffset,
        annotationCount,
        severityCounts,
      });
    }

    offset = endOffset + 1; // +1 for the newline character
  }

  return paragraphs;
}
