/**
 * Editor foundation — public exports for Workstream B.
 *
 * Consumers (Workstream D bloom, E panel, J click) should import from this
 * barrel only. Internals (stubs, decoration plugin) are not re-exported.
 */

export { AnnotationEditor } from './AnnotationEditor';
export type {
  AnnotationEditorProps,
  ParagraphTintPhase,
} from './AnnotationEditor';
export type { UnderlinePhase } from './decorations';
export { buildSentenceDecorations } from './decorations';
export { buildParagraphTintDecorations } from './paragraphTint';
export type { ParagraphTintSaturation } from './paragraphTint';
export { EditorGutter } from './gutter';
export type { EditorGutterProps, GutterRow } from './gutter';
export { useSoftLock } from './softLock';
export type { SoftLockState } from './softLock';
export {
  sentenceIdToRange,
  sentenceToRange,
  positionToSentenceId,
  buildSentenceRangeMap,
  buildParagraphPositions,
} from './sentenceMapping';
export type { ParagraphPositions } from './sentenceMapping';

// Temporary stub types — remove from barrel at integration and re-export from
// ../tokens and ../types/profile instead.
export type {
  Tier,
  Paragraph,
  SentenceProfile,
  EssayProfile,
  ParagraphRole,
} from './stubs';
export { TIER_CSS_VAR, EASING, DURATION } from './stubs';
