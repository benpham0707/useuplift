/**
 * Student-facing analysis document types.
 *
 * These types define the structured output of renderAnalysisForStudent() —
 * the document the student sees BEFORE entering coaching conversations.
 * Every field is in student-facing language, not system jargon.
 */

import type { ImprovementPhaseLevel, ConfidenceLevel } from '../profileTypes';

// ============================================================================
// MAIN DOCUMENT TYPE
// ============================================================================

export interface StudentAnalysisDocument {
  /** Section 1: Essay text with inline annotations */
  annotatedEssay: AnnotatedEssaySection;

  /** Section 2: Revision priorities — ordered by impact */
  revisionPriorities: RevisionPriority[];

  /** Section 3: Structural map — what each paragraph does */
  structuralMap: StructuralMapEntry[];

  /** Section 4: Overall assessment */
  overallAssessment: OverallAssessmentSection;

  /** Metadata */
  meta: {
    essayWordCount: number;
    paragraphCount: number;
    improvementPhase: ImprovementPhaseLevel;
    analysisConfidence: ConfidenceLevel;
    generatedAt: string;
  };
}

// ============================================================================
// SECTION TYPES
// ============================================================================

export interface AnnotatedEssaySection {
  paragraphs: AnnotatedParagraph[];
  annotationCount: number;
}

export interface AnnotatedParagraph {
  index: number;
  text: string;
  /** Annotations anchored to specific spans */
  inlineAnnotations: InlineAnnotation[];
}

export interface InlineAnnotation {
  /** The exact text span to highlight */
  spanText: string;
  /** Headline — the move (✓) or the issue (△), in a few words. Student-facing. */
  observation: string;
  /** Optional elaboration: why it matters + the concrete fix. Carries the growth
   *  edge's coaching so the annotation reads observation → why → fix, not a label. */
  detail?: string;
  /** Strength or growth area */
  nature: 'strength' | 'growth';
  /** Rank of the revision priority that addresses this in depth, if one covers
   *  this paragraph — so the inline note links to the full coaching instead of
   *  re-deriving it. null when no priority covers it. */
  priorityRef: number | null;
}

export interface RevisionPriority {
  /** 1-indexed rank */
  rank: number;
  /** Student-facing title */
  title: string;
  /** Why this matters — in terms the student can feel */
  whyItMatters: string;
  /** Which paragraph(s) */
  paragraphs: number[];
  /** The craft technique that addresses this */
  craftTechnique: string;
  /** Expected impact level */
  impact: 'transformative' | 'significant' | 'incremental';
}

export interface StructuralMapEntry {
  paragraphIndex: number;
  /** What this paragraph does — plain language */
  role: string;
  /** How well it fulfills that role */
  effectiveness: string;
  /** How important it is */
  weight: 'load-bearing' | 'supporting' | 'transitional' | 'decorative';
}

export interface OverallAssessmentSection {
  /** Phase in student language */
  phase: string;
  /** What that phase means */
  phaseExplanation: string;
  /** What's genuinely working */
  strengths: string[];
  /** The essay's central idea as the system reads it */
  centralIdea: string;
  /** What makes this essay potentially distinctive — or why it isn't */
  distinctiveness: string;
  /** Who you come across as */
  writerPortrait: string;
}

// ============================================================================
// RENDER OPTIONS
// ============================================================================

export interface RenderOptions {
  /** 'initial' = first time. 'post_edit' = after revision */
  mode: 'initial' | 'post_edit';
  /** Max revision priorities (default 5) */
  maxPriorities?: number;
}
