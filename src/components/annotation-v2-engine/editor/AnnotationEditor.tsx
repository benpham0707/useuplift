/**
 * AnnotationEditor — Workstream B top-level component.
 *
 * Responsibilities:
 *   - Mount TipTap with a tight StarterKit (no horizontal rule, no blockquote,
 *     no headings in the content; paragraphs, inline code, strikethrough keep).
 *   - Initialize content from profile.paragraphs as one <p> per paragraph.
 *   - Attach a single PM plugin that exposes two DecorationSets:
 *       1. paragraph-tint node decorations (from paragraphTint.ts)
 *       2. sentence underline inline decorations (from decorations.ts)
 *     Decorations are memoized against (doc, profile, phases, reducedMotion)
 *     so transient cursor transactions don't rebuild the set.
 *   - Render the gutter as a sibling (left column) aligned via ResizeObserver.
 *   - Soft-lock via useSoftLock — sets editable=false and applies visual class.
 *   - Wire hover/click event dispatchers from PM event handlers to the props.
 *     (Workstream J owns the real click manager; we just emit sentence IDs.)
 *
 * Spec citations inline (e.g. // Phase 5 §2.1).
 */

/* eslint-disable react-refresh/only-export-components */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type FC,
} from 'react';
import type { EssayProfile } from './stubs';
import { buildSentenceDecorations, type UnderlinePhase } from './decorations';
import {
  buildParagraphTintDecorations,
  type ParagraphTintSaturation,
} from './paragraphTint';
import { useSoftLock } from './softLock';
import { EditorGutter } from './gutter';
import { positionToSentenceId, buildSentenceRangeMap } from './sentenceMapping';

export type ParagraphTintPhase = 'hidden' | 'muted40' | 'deep55';

export interface AnnotationEditorProps {
  profile: EssayProfile;
  paragraphTintPhase: ParagraphTintPhase;
  underlinePhase: UnderlinePhase;
  selectedSentenceId: string | null;
  softLocked: boolean;
  onSentenceHover?: (id: string | null) => void;
  onSentenceClick?: (id: string) => void;
  onParagraphClick?: (index: number) => void;
  /**
   * γ integration addition — fires once when the TipTap editor is ready.
   * Consumers (e.g. ClickManager in Workstream J) use `editor.view.coordsAtPos`
   * for position math instead of DOM querying.
   */
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
  reducedMotion: boolean;
}

const SATURATION_BY_PHASE: Record<ParagraphTintPhase, ParagraphTintSaturation> = {
  hidden: 0,
  muted40: 40,
  deep55: 55,
};

// ---------------------------------------------------------------------------
// Decoration plugin
// ---------------------------------------------------------------------------
//
// We hold the "current" decorations outside PM state (via a ref passed into
// the plugin factory) so React can update them on prop change without having
// to build a PM transaction per render. The plugin's `decorations` prop reads
// the ref on every view update.

interface DecorationRef {
  /** Paragraph-tint node decorations */
  paragraphTint: DecorationSet;
  /** Sentence inline decorations */
  sentences: DecorationSet;
  /** Selected-sentence ring (inline decoration) */
  selection: DecorationSet;
}

const pluginKey = new PluginKey<DecorationRef>('annotation-v2-decorations');

function createDecorationPlugin(ref: React.MutableRefObject<DecorationRef>) {
  return new Plugin<DecorationRef>({
    key: pluginKey,
    state: {
      init: () => ref.current,
      apply: () => ref.current,
    },
    props: {
      decorations(state) {
        const current = pluginKey.getState(state);
        if (!current) return DecorationSet.empty;
        // Merge the three sets. PM accepts multiple DecorationSets via `find`
        // contract; simplest reliable path is a single merged set.
        // DecorationSet.create accepts all decorations for the doc at once.
        const all: Decoration[] = [
          ...current.paragraphTint.find(),
          ...current.sentences.find(),
          ...current.selection.find(),
        ];
        return DecorationSet.create(state.doc, all);
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Content initialization
// ---------------------------------------------------------------------------

function profileToInitialContent(profile: EssayProfile): string {
  // TipTap accepts HTML strings at init. One <p> per paragraph.
  // No inline formatting at init — analysis shapes are separate.
  return profile.paragraphs
    .map((p) => {
      // Minimal HTML-escape. Students' text can contain &/</>/quotes.
      const safe = p.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${safe || '<br>'}</p>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AnnotationEditor: FC<AnnotationEditorProps> = ({
  profile,
  paragraphTintPhase,
  underlinePhase,
  selectedSentenceId,
  softLocked,
  onSentenceHover,
  onSentenceClick,
  onParagraphClick,
  onEditorReady,
  reducedMotion,
}) => {
  // We stash the current decorations in a ref so the plugin always reads fresh.
  const decorationsRef = useRef<DecorationRef>({
    paragraphTint: DecorationSet.empty,
    sentences: DecorationSet.empty,
    selection: DecorationSet.empty,
  });

  const editorContentRef = useRef<HTMLDivElement | null>(null);

  // Stable handler refs (so PM event listeners don't close over stale props).
  const handlersRef = useRef({ onSentenceHover, onSentenceClick, onParagraphClick });
  useEffect(() => {
    handlersRef.current = { onSentenceHover, onSentenceClick, onParagraphClick };
  }, [onSentenceHover, onSentenceClick, onParagraphClick]);

  // Keep a stable profile ref for event handlers.
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const editor = useEditor({
    extensions: [
      // Disable marks/nodes the spec explicitly doesn't want.
      // StarterKit includes: paragraph, text, bold, italic, strike, code,
      // codeBlock, blockquote, heading, bulletList, orderedList, listItem,
      // hardBreak, horizontalRule, history.
      // We keep: paragraph, text, bold, italic, strike, code, hardBreak, history.
      // We drop: codeBlock, blockquote, heading, lists, horizontalRule.
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        // Keep inline marks the spec allows
        code: {},
        strike: {},
        bold: {},
        italic: {},
      }),
    ],
    content: profileToInitialContent(profile),
    // Soft-lock flag comes from useSoftLock below; init disabled if starting locked.
    editable: !softLocked,
    // Disable autofocus so the student's cursor doesn't jump on mount.
    autofocus: false,
    // TipTap 2.x: editorProps for PM-layer handlers.
    editorProps: {
      attributes: {
        'aria-label': 'Essay editor',
        role: 'textbox',
        'aria-multiline': 'true',
        class: 'anno-editor-content',
      },
      // PM is not strictly typed here — these handlers take EditorView + Event.
      handleClick: (view: EditorView, pos: number) => {
        // Pass the raw PM doc directly — avoids needing a fully-wired Editor
        // instance at the PM-plugin layer.
        const id = positionToSentenceId(view.state.doc, pos, profileRef.current);
        if (id && handlersRef.current.onSentenceClick) {
          handlersRef.current.onSentenceClick(id);
          return true;
        }
        return false;
      },
    },
  });

  // Attach the decoration plugin AFTER first render — TipTap's useEditor
  // registers plugins at construction time via `extensions`, but our plugin
  // closes over a React ref so we register it via `registerPlugin` once the
  // editor exists.
  //
  // React StrictMode double-mounts effects; guard against re-registering the
  // same keyed plugin (ProseMirror throws "Adding different instances of a
  // keyed plugin") and against calling APIs on a destroyed editor.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // If the plugin is already registered (StrictMode second run), skip.
    const existing = pluginKey.get(editor.state);
    if (!existing) {
      const plugin = createDecorationPlugin(decorationsRef);
      try {
        editor.registerPlugin(plugin);
      } catch (err) {
        // Defensive — PM throws if the plugin was somehow registered between
        // our check and the call. Treat as already-registered.
        if (!(err instanceof RangeError)) throw err;
      }
    }
    // γ addition — expose editor to consumers after plugin registration.
    onEditorReady?.(editor);
    return () => {
      if (editor.isDestroyed) return;
      try {
        editor.unregisterPlugin(pluginKey);
      } catch {
        // Ignore — plugin may already be unregistered.
      }
    };
    // onEditorReady intentionally omitted from deps — fire once per editor instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Hover tracking — PM doesn't expose a first-class hover listener; we hook
  // the DOM directly on the content element and use event delegation.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // During React StrictMode's double-mount, the second effect runs against
    // an editor whose view may not yet be attached. Guard before accessing.
    let root: HTMLElement;
    try {
      root = editor.view.dom;
    } catch {
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const span = target.closest<HTMLElement>('[data-anno-sentence-id]');
      const id = span?.dataset.annoSentenceId ?? null;
      handlersRef.current.onSentenceHover?.(id);
    };
    const handleMouseLeave = () => {
      handlersRef.current.onSentenceHover?.(null);
    };

    root.addEventListener('mouseover', handleMouseOver);
    root.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      root.removeEventListener('mouseover', handleMouseOver);
      root.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor]);

  // Soft lock visual + editable state.
  const soft = useSoftLock(editor ?? null, softLocked);

  // Re-derive decorations whenever relevant inputs change.
  // This memo is the hot path — we must not rebuild on unrelated editor
  // transactions (e.g. selection changes). We re-run only on:
  //   - doc identity (profile content)
  //   - profile identity (tiers & ranges)
  //   - visible-phase props
  //   - selection id
  //   - reduced-motion flag
  const doc: PmNode | null = editor?.state.doc ?? null;

  const paragraphTintDeco = useMemo(() => {
    if (!doc) return DecorationSet.empty;
    return buildParagraphTintDecorations(
      doc,
      profile,
      SATURATION_BY_PHASE[paragraphTintPhase],
    );
  }, [doc, profile, paragraphTintPhase]);

  const sentenceDeco = useMemo(() => {
    if (!doc) return DecorationSet.empty;
    return buildSentenceDecorations(doc, profile, underlinePhase, reducedMotion);
  }, [doc, profile, underlinePhase, reducedMotion]);

  const selectionDeco = useMemo(() => {
    if (!doc || !selectedSentenceId) return DecorationSet.empty;
    const ranges = buildSentenceRangeMap(doc, profile);
    const range = ranges.get(selectedSentenceId);
    if (!range) return DecorationSet.empty;
    // Phase 7 §2.1 — the ring is rendered via CSS class. Panel owns interaction.
    return DecorationSet.create(doc, [
      Decoration.inline(range.from, range.to, {
        class: 'anno-sentence-selected',
        'data-anno-selected': 'true',
      }),
    ]);
  }, [doc, profile, selectedSentenceId]);

  // Push decorations into the plugin ref and force a view update so PM reads
  // the fresh DecorationSets.
  useEffect(() => {
    if (!editor) return;
    decorationsRef.current = {
      paragraphTint: paragraphTintDeco,
      sentences: sentenceDeco,
      selection: selectionDeco,
    };
    // Bump PM so it re-invokes `props.decorations`. A no-op transaction is
    // the idiomatic way; we `setMeta` with our plugin key so the plugin's
    // `apply` reducer is entered (even though it just re-reads the ref).
    editor.view.dispatch(editor.view.state.tr.setMeta(pluginKey, true));
  }, [editor, paragraphTintDeco, sentenceDeco, selectionDeco]);

  // If softLocked changes but the editor already exists, keep the `editable`
  // prop in sync via useSoftLock. No extra work needed here.

  // Announce soft-lock state changes to screen readers via an aria-live region.
  // One region lives below the editor; its contents are what useSoftLock returns.
  const announcement = soft.announcement;

  const handleGutterClick = useCallback(
    (idx: number) => {
      handlersRef.current.onParagraphClick?.(idx);
    },
    [],
  );

  // Gutter fade phase: we show labels whenever tints are visible (Phase 5 §2.8
  // — labels appear before underlines during the cross-lap). Demo can override
  // by driving paragraphTintPhase.
  const gutterFade = paragraphTintPhase === 'hidden' ? 'hidden' : 'visible';

  return (
    <div
      className={`anno-editor-shell ${soft.containerClass}`}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <EditorGutter
        editorContentRef={editorContentRef}
        paragraphs={profile.paragraphs}
        fadePhase={gutterFade}
        reducedMotion={reducedMotion}
        onParagraphClick={handleGutterClick}
      />
      <div
        ref={editorContentRef}
        className="anno-editor-surface"
        data-anno-soft-locked={softLocked ? 'true' : 'false'}
      >
        <EditorContent editor={editor} />
      </div>
      <div
        className="anno-editor-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </div>
  );
};
