/**
 * Editor gutter — paragraph role labels + dots rendered in the left margin.
 *
 * Layout strategy: the gutter is a SIBLING absolute-positioned column inside
 * the editor container (not a ProseMirror widget decoration). Rationale:
 *   - Widget decorations attach to inline positions; aligning them to the
 *     paragraph's top edge fights PM's layout model.
 *   - A sibling column driven by ResizeObserver + paragraph rect measurement
 *     lets us render plain React nodes with normal event handling and Framer
 *     Motion stagger primitives — cheap and accessible.
 *
 * Alignment algorithm:
 *   1. Query `[data-anno-paragraph-index]` nodes inside the editor's DOM
 *      (these are the paragraph tint decorations from paragraphTint.ts, which
 *      cover exactly the paragraph extent).
 *   2. For each, read its `offsetTop` relative to the editor content root.
 *   3. Render a gutter row per paragraph at that `top` with the role label
 *      and a clickable dot.
 *   4. Re-measure on ResizeObserver events (font-load, window resize, soft-lock
 *      state change).
 */

/* eslint-disable react-refresh/only-export-components */

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';
import type { Paragraph, ParagraphRole, Tier } from './stubs';

export interface GutterRow {
  paragraphIndex: number;
  role: ParagraphRole;
  tier: Tier;
  /** px from the top of the editor content root. */
  top: number;
  /** px height of the paragraph block. */
  height: number;
}

export interface EditorGutterProps {
  /** The editor content root — gutter measures paragraphs inside this element. */
  editorContentRef: React.RefObject<HTMLElement | null>;
  paragraphs: Paragraph[];
  /** Phase 5 §2.8 — labels fade in during cross-lap, out when editor-wide hidden. */
  fadePhase: 'hidden' | 'visible';
  /** Stagger delay per row (ms), top→bottom. 40ms per Phase 5 §2.8. */
  staggerMs?: number;
  reducedMotion: boolean;
  onParagraphClick?: (paragraphIndex: number) => void;
}

const ROLE_LABEL: Record<NonNullable<ParagraphRole>, string> = {
  HOOK: 'HOOK',
  BUILDUP: 'BUILDUP',
  FULCRUM: 'FULCRUM',
  RESOLUTION: 'RESOLUTION',
  CLOSING: 'CLOSING',
};

export const EditorGutter: FC<EditorGutterProps> = memo(function EditorGutter({
  editorContentRef,
  paragraphs,
  fadePhase,
  staggerMs = 40,
  reducedMotion,
  onParagraphClick,
}) {
  const [rows, setRows] = useState<GutterRow[]>([]);

  const measure = useCallback(() => {
    const root = editorContentRef.current;
    if (!root) return;

    const nodes = root.querySelectorAll<HTMLElement>('[data-anno-paragraph-index]');
    // If decorations haven't rendered yet (e.g. before first doc update), fall
    // back to direct <p> children — still 1:1 with paragraphs array.
    const targets = nodes.length > 0 ? Array.from(nodes) : Array.from(root.querySelectorAll<HTMLElement>(':scope > p'));

    const rootRect = root.getBoundingClientRect();
    const next: GutterRow[] = [];

    targets.forEach((el, i) => {
      const paragraph = paragraphs[i];
      if (!paragraph) return;
      const rect = el.getBoundingClientRect();
      next.push({
        paragraphIndex: paragraph.index,
        role: paragraph.role,
        tier: paragraph.paragraphTintTier,
        top: rect.top - rootRect.top,
        height: rect.height,
      });
    });

    setRows(next);
  }, [editorContentRef, paragraphs]);

  useEffect(() => {
    const root = editorContentRef.current;
    if (!root) return;

    // Initial measure + measure after fonts load (font metrics shift heights).
    measure();
    if (typeof document !== 'undefined' && (document as Document & { fonts?: FontFaceSet }).fonts) {
      (document as Document & { fonts: FontFaceSet }).fonts.ready.then(measure).catch(() => undefined);
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(root);
    // Also re-measure on window resize (font scaling / viewport width changes).
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editorContentRef, measure]);

  // Re-measure when the paragraphs array identity changes (new analysis etc.)
  useEffect(() => {
    measure();
  }, [paragraphs, measure]);

  const visible = fadePhase === 'visible';

  const rowElements = useMemo(
    () =>
      rows.map((row, i) => {
        const label = row.role ? ROLE_LABEL[row.role] : null;
        const delay = reducedMotion ? 0 : i * staggerMs;
        return (
          <div
            key={row.paragraphIndex}
            className={`editor-gutter-row${visible ? ' editor-gutter-row--visible' : ''}`}
            style={{
              top: row.top,
              height: row.height,
              // Stagger via CSS custom prop — workshop.css reads this to set
              // transition-delay (keeps animations out of JS).
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              ...({ '--gutter-stagger-delay': `${delay}ms` } as React.CSSProperties),
            }}
          >
            <button
              type="button"
              className={`editor-gutter-dot editor-gutter-dot--${row.tier.toLowerCase().replace('_', '-')}`}
              aria-label={`Paragraph ${row.paragraphIndex + 1}${label ? `, ${label.toLowerCase()}` : ''}`}
              onClick={() => onParagraphClick?.(row.paragraphIndex)}
            />
            {label ? (
              <span className="editor-gutter-label" role="presentation">
                {label}
              </span>
            ) : null}
          </div>
        );
      }),
    [rows, visible, reducedMotion, staggerMs, onParagraphClick],
  );

  return (
    <div
      className={`editor-gutter${visible ? ' editor-gutter--visible' : ''}`}
      aria-hidden={!visible}
    >
      {rowElements}
    </div>
  );
});

/**
 * Bare wrapper re-exported through a `forwardRef` so AnnotationEditor can pass
 * refs if it ever needs to programmatically focus the gutter (keyboard nav in
 * Workstream H may want this).
 */
export const EditorGutterWithRef = forwardRef<HTMLDivElement, EditorGutterProps>(
  function EditorGutterWithRef(props, _ref) {
    return <EditorGutter {...props} />;
  },
);
