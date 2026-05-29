/**
 * useKeyboardShortcuts — Phase 10 §3.1 + Phase 11 §3.12 keyboard bindings.
 *
 * Handled keys:
 *   - Tab / ↓ / ArrowDown               → onNext()
 *   - Shift+Tab / ↑ / ArrowUp           → onPrev()
 *   - Escape                            → onEscape()
 *   - 'l' / 'L'                         → onToggleList?.()
 *   - '1' / '2' / '3' (when list mode)  → onFilterNumber?.(1|2|3)
 *
 * Guards:
 *   - Does nothing when the active element is an input/textarea/
 *     contenteditable field (Phase 10 §3.1 — Tab must not compete with
 *     form semantics when we add comment inputs in Phase 16).
 *   - `preventDefault()` only on the keys we actually consume. This
 *     preserves default browser behavior for `Space` (scroll), `Enter`
 *     (reserved), and every other unhandled key.
 *   - Global listener on `window`. When `enabled === false`, nothing is
 *     registered — useful for demo toggles and modal overlays.
 *
 * Returns: nothing. Side effect is pure event registration scoped to
 * the component lifecycle.
 */

import { useEffect } from 'react';

export interface UseKeyboardShortcutsOpts {
  readonly onNext: () => void;
  readonly onPrev: () => void;
  readonly onEscape: () => void;
  readonly onToggleList?: () => void;
  readonly onFilterNumber?: (n: 1 | 2 | 3) => void;
  readonly enabled: boolean;
}

// ---------------------------------------------------------------------------
// Focus guards — same contract used by chat / editor hooks elsewhere.
// ---------------------------------------------------------------------------

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // ProseMirror contenteditable containers expose `.ProseMirror` on the
  // root element. Be safe: treat any ancestor contenteditable as editable.
  let el: HTMLElement | null = target;
  while (el) {
    if (el.isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useKeyboardShortcuts(opts: UseKeyboardShortcutsOpts): void {
  const {
    onNext,
    onPrev,
    onEscape,
    onToggleList,
    onFilterNumber,
    enabled,
  } = opts;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const { key, shiftKey, ctrlKey, metaKey, altKey } = e;
      // Ignore mod-combos we don't own (Cmd/Ctrl+K is Phase 11, etc.).
      // Shift+Tab is the one modified-key we DO handle.
      const hasDisqualifyingMod = ctrlKey || metaKey || altKey;

      if (hasDisqualifyingMod) return;

      // Advance keys.
      if (!shiftKey && (key === 'Tab' || key === 'ArrowDown')) {
        e.preventDefault();
        onNext();
        return;
      }
      // Retreat keys.
      if (
        (shiftKey && key === 'Tab') ||
        (!shiftKey && key === 'ArrowUp')
      ) {
        e.preventDefault();
        onPrev();
        return;
      }
      if (key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (!shiftKey && (key === 'l' || key === 'L')) {
        if (onToggleList) {
          e.preventDefault();
          onToggleList();
        }
        return;
      }
      if (!shiftKey && (key === '1' || key === '2' || key === '3')) {
        if (onFilterNumber) {
          e.preventDefault();
          const n = Number(key) as 1 | 2 | 3;
          onFilterNumber(n);
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onNext, onPrev, onEscape, onToggleList, onFilterNumber]);
}
