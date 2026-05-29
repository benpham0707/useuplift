/**
 * useDeselection — Escape + click-outside deselection (Workstream J).
 *
 * Phase 7 §2.8 — deselection policy
 * ---------------------------------
 *   - Escape anywhere → returns panel to overview.
 *   - Click outside BOTH the editor and the panel → returns to overview.
 *   - Click inside the editor on non-annotated space (a SAGE sentence or
 *     empty whitespace) does NOT deselect. SAGE clicks are distinguished
 *     because the editor still fires `onSentenceClick` with a valid
 *     sentenceId (Phase 7 §2.5 soft dead-zone rule); whitespace produces
 *     no sentence id and is therefore a no-op at this layer.
 *   - Click inside the panel does NOT deselect.
 *
 * What this hook deliberately does NOT do:
 *   - It does not render anything.
 *   - It does not know about SAGE / FUNCTIONAL tiers — that's the
 *     editor's and panel's problem. If `hasSelection` is false, we skip
 *     the click-outside listener entirely (nothing to deselect).
 *
 * Phase 7 §2.6 — Escape is Escape-only; click-outside ON DESKTOP does not
 * always deselect. However, the spec defines the canonical "outside both
 * editor and panel" case as a valid deselection because at that point the
 * student has clicked into a zone the editor doesn't own (toolbar chrome,
 * viewport margins, etc.). We honour that.
 */

import { useEffect, type RefObject } from 'react';

export interface UseDeselectionArgs {
  readonly editorRef: RefObject<HTMLElement>;
  readonly panelRef: RefObject<HTMLElement>;
  readonly hasSelection: boolean;
  readonly onDeselect: () => void;
}

export function useDeselection(args: UseDeselectionArgs): void {
  const { editorRef, panelRef, hasSelection, onDeselect } = args;

  useEffect(() => {
    if (!hasSelection) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Phase 7 §2.8 — universal dismiss. Do NOT swallow the event
        // here; other hooks (tooltip dismiss) may also want it.
        onDeselect();
      }
    };

    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const editor = editorRef.current;
      const panel = panelRef.current;
      if (editor && editor.contains(target)) return;
      if (panel && panel.contains(target)) return;
      // Click was neither inside editor nor panel → deselect.
      onDeselect();
    };

    window.addEventListener('keydown', handleKey);
    // Use pointerdown, not click: the spec's 40ms coalescing acts on
    // pointerdown so the deselection should fire at the same moment.
    // Capture phase ensures we see the event before components that
    // stopPropagation() for their own reasons.
    window.addEventListener('pointerdown', handlePointer, true);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('pointerdown', handlePointer, true);
    };
  }, [editorRef, panelRef, hasSelection, onDeselect]);
}
