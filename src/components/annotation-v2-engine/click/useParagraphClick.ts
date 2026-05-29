/**
 * useParagraphClick — paragraph gutter click orchestration (Workstream J).
 *
 * Phase 7 §2.7 — paragraph-scope panel view
 * -----------------------------------------
 * Gutter clicks are structurally different from sentence clicks:
 *   - They open the paragraph-scope panel view (distinct mode / content
 *     shape) rather than a sentence-scope insight.
 *   - They do NOT participate in the sentence rapid-click coalescing
 *     window — a gutter click is a commitment unto itself and does not
 *     race against sentence clicks in the same 40ms window (the editor's
 *     handleClick fires for sentences; the gutter fires onParagraphClick
 *     on a DOM-level button — different event paths).
 *   - The 180ms crossfade still applies when the panel mode changes;
 *     PanelShell's AnimatePresence keyed on panelModeTransitionKey
 *     handles that (E owns the transition, not J).
 *
 * This hook is a thin orchestration layer so parents can wire gutter
 * clicks without re-implementing the logic. It emits `handleGutterClick`
 * which the parent passes to AnnotationEditor's `onParagraphClick` prop.
 *
 * Parent responsibility (per J's scope): call panelMode.toParagraph(idx)
 * or similar. Until paragraph-scope mode lands in PanelModes, the demo
 * can route paragraph clicks to logging + an "overview with paragraph
 * hint" state. That future routing is a Wave γ concern; J exposes the
 * primitive today.
 */

import { useCallback } from 'react';

export interface UseParagraphClickArgs {
  /**
   * Fires when the student clicks the gutter for paragraph `index`.
   * Parent is responsible for switching the panel mode + updating any
   * selection state.
   */
  readonly onParagraphSelect: (paragraphIndex: number) => void;
}

export interface UseParagraphClickResult {
  /** Pass this to `AnnotationEditor`'s `onParagraphClick` prop. */
  readonly handleGutterClick: (paragraphIndex: number) => void;
}

export function useParagraphClick(
  args: UseParagraphClickArgs,
): UseParagraphClickResult {
  const { onParagraphSelect } = args;

  const handleGutterClick = useCallback(
    (paragraphIndex: number) => {
      onParagraphSelect(paragraphIndex);
    },
    [onParagraphSelect],
  );

  return { handleGutterClick };
}
