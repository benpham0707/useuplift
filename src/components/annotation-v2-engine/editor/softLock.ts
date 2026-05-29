/**
 * Soft-lock hook for Phase 4 loading state.
 *
 * Phase 4 §2.3 — during analysis, the editor is read-only but visually present:
 *   - `editor.setEditable(false)` — prevents mutations
 *   - Visual treatment: subtle 0.7 text opacity + `cursor: not-allowed` on the
 *     container (applied via CSS class; `softLock.ts` only toggles the flag)
 *   - Selection still works (for reading / copy-out)
 *
 * This hook returns the CSS class name to apply to the editor container and
 * keeps the TipTap editor's `editable` state synced with the `softLocked` prop.
 */

import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

export interface SoftLockState {
  /** Class to apply to the editor container. */
  containerClass: string;
  /** Whether the editor is currently locked. */
  locked: boolean;
  /** For aria-live announcements in the accessibility region. */
  announcement: string;
}

export function useSoftLock(editor: Editor | null, softLocked: boolean): SoftLockState {
  useEffect(() => {
    if (!editor) return;
    // Only call setEditable if state is actually changing — avoids an extra
    // transaction on every render.
    if (editor.isEditable === softLocked) {
      editor.setEditable(!softLocked);
    }
  }, [editor, softLocked]);

  return {
    containerClass: softLocked ? 'editor-soft-locked' : '',
    locked: softLocked,
    announcement: softLocked
      ? 'Analysis in progress. Editor is read-only.'
      : 'Editor is editable.',
  };
}
