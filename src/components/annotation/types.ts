/**
 * Frontend-specific types for the annotation UI.
 *
 * Extends backend EssayAnnotation with resolved text positions,
 * filter state, text segmentation, and context panel navigation.
 */

import type {
  EssayAnnotation,
  DerivedDimensionScore,
  AnnotatedAnalysisResult,
  DeepDiveResult,
  AnnotationSeverity,
} from '../../pipeline/types';

// ============================================================================
// RESOLVED ANNOTATIONS
// ============================================================================

/** An annotation with its text span resolved to character offsets in the current editor text */
export interface ResolvedAnnotation extends EssayAnnotation {
  /** Resolved start character offset in the current text */
  resolvedStart: number;
  /** Resolved end character offset (exclusive) in the current text */
  resolvedEnd: number;
  /** How the anchor was resolved */
  anchorMethod: 'exact' | 'fuzzy' | 'paragraph' | 'failed';
}

// ============================================================================
// FILTER STATE
// ============================================================================

/** Active filters for which annotations to display */
export interface AnnotationFilters {
  /** Which severity levels are visible */
  severities: Set<AnnotationSeverity>;
  /** Which dimension IDs are visible (empty = all) */
  dimensionIds: Set<string>;
  /** Whether to show stale annotations (text edited since analysis) */
  showStale: boolean;
}

// ============================================================================
// TEXT SEGMENTATION
// ============================================================================

/** A contiguous segment of essay text, possibly overlapping with annotations */
export interface TextSegment {
  /** The text content of this segment */
  text: string;
  /** Start character offset in the full essay text */
  start: number;
  /** End character offset (exclusive) */
  end: number;
  /** Annotations covering this segment (filtered by active filters) */
  annotations: ResolvedAnnotation[];
  /** Highest severity among overlapping annotations (for styling) */
  dominantSeverity?: AnnotationSeverity;
}

/** Paragraph-level summary for the minimap / navigation */
export interface ParagraphInfo {
  /** 0-based paragraph index */
  index: number;
  /** Full paragraph text */
  text: string;
  /** Start character offset in the full essay text */
  startOffset: number;
  /** End character offset (exclusive) */
  endOffset: number;
  /** Total annotations touching this paragraph */
  annotationCount: number;
  /** Breakdown of annotation counts by severity */
  severityCounts: Record<AnnotationSeverity, number>;
}

// ============================================================================
// CONTEXT PANEL NAVIGATION
// ============================================================================

/** Discriminated union for what the right-side context panel shows */
export type ContextPanelView =
  | { type: 'dashboard' }
  | { type: 'annotation'; annotationId: string }
  | { type: 'deep-dive'; annotationId: string; result?: DeepDiveResult };

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type {
  EssayAnnotation,
  DerivedDimensionScore,
  AnnotatedAnalysisResult,
  DeepDiveResult,
  AnnotationSeverity,
};
