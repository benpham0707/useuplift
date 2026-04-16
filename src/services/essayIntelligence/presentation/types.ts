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
  /** Section 1: The committee one-liner — the AO's snap summary */
  committeeOneLiner: string;

  /** Section 2: The honest AO reaction */
  aoReaction: AOReactionSection;

  /** Section 3: Essay text with inline annotations */
  annotatedEssay: AnnotatedEssaySection;

  /** Section 4: Revision priorities — ordered by impact */
  revisionPriorities: RevisionPriority[];

  /** Section 5: Structural map — what each paragraph does */
  structuralMap: StructuralMapEntry[];

  /** Section 6: Overall assessment */
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

export interface AOReactionSection {
  /** The AO's internal monologue */
  gutReaction: string;
  /** Risk the reader stops after P1 */
  putDownRisk: 'high' | 'moderate' | 'low';
  /** What (if anything) makes the AO keep reading */
  hookMoment: string | null;
  /** Essay archetype */
  archetype: string;
  /** What pool density means in plain language */
  archetypeFrequency: string;
}

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
  /** Brief observation — 1-2 sentences, student-facing */
  observation: string;
  /** Strength or growth area */
  nature: 'strength' | 'growth';
  /** Link to a revision priority */
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
