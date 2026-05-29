/**
 * ClickManager — top-level click orchestration (Workstream J).
 *
 * Wires the click/hover primitives into a single component:
 *   useRapidClick   → 40ms coalesce window (§2.4)
 *   useClickTimeline → ms-by-ms state machine (§2.1 / §3.1)
 *   useHoverTooltip → 300ms delay (§2.5)
 *   useDeselection  → Escape + click-outside (§2.8)
 *   useParagraphClick → paragraph gutter (§2.7)
 *   SentenceRing    → luminous click-feedback ring (§2.1)
 *   HoverTooltip    → tier + headline preview (§2.5)
 *
 * Consumer usage:
 *   const handlers = useClickManagerHandlers({ editor, profile, ... });
 *   <AnnotationEditor
 *     onSentenceClick={handlers.onSentenceClick}
 *     onSentenceHover={handlers.onSentenceHover}
 *     onParagraphClick={handlers.onParagraphClick}
 *     ...
 *   />
 *   <ClickManager ... />
 *
 * We expose BOTH a React component (for rendering overlays) and a hook
 * (for providing the event handlers the editor consumes) so the
 * consumer can place the overlays wherever their editor's positioning
 * context lives.
 *
 * Phase 7 §2.5 — on click, the hover tooltip dismisses immediately
 * regardless of timer. We call `hover.dismiss()` at the moment `report()`
 * fires, before the coalesce window even closes, because the commitment
 * has already been made conceptually.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import type { Editor } from '@tiptap/react';

import type { EssayProfile } from '../types/profile';
import { sentenceIdToRange } from '../editor/sentenceMapping';

import { useRapidClick } from './useRapidClick';
import { useClickTimeline, type ClickTimelineState } from './useClickTimeline';
import { useHoverTooltip } from './useHoverTooltip';
import { useDeselection } from './useDeselection';
import { useParagraphClick } from './useParagraphClick';
import { SentenceRing, type SentenceRingPhase } from './SentenceRing';
import { HoverTooltip } from './HoverTooltip';

export interface ClickManagerProps {
  readonly editor: Editor | null;
  readonly profile: EssayProfile;
  readonly editorRef: RefObject<HTMLElement>;
  readonly panelRef: RefObject<HTMLElement>;
  readonly selectedSentenceId: string | null;
  readonly onSelectSentence: (sentenceId: string) => void;
  readonly onSelectParagraph: (paragraphIndex: number) => void;
  readonly onDeselect: () => void;
  readonly reducedMotion: boolean;
  /**
   * Demo-only timeline slow-motion multiplier (1 = normal, 2 = 2x slower).
   * Defaults to 1 for production.
   */
  readonly slowMotion?: number;
  /**
   * The event handlers the editor needs. Normally a caller will destructure
   * these from the returned hook object and forward them to AnnotationEditor;
   * we surface them through the component's children prop for ergonomic
   * composition in simple demos.
   */
  readonly children?: (api: ClickManagerApi) => React.ReactNode;
  /**
   * Optional instrumentation — fires whenever the click timeline advances
   * through a phase. Used by demos to surface ms-by-ms state.
   */
  readonly onTimelineChange?: (state: ClickTimelineState) => void;
}

/**
 * The event handlers the parent wires to AnnotationEditor. Mirrors the
 * editor's prop names so the parent can spread this object onto the
 * editor without re-mapping.
 */
export interface ClickManagerApi {
  readonly onSentenceClick: (sentenceId: string) => void;
  readonly onSentenceHover: (sentenceId: string | null) => void;
  readonly onParagraphClick: (paragraphIndex: number) => void;
  /** Timeline state for demo display. */
  readonly timeline: ClickTimelineState;
  /** Coalesce pending id for demo display. */
  readonly pendingClickId: string | null;
  /** Tooltip visible id for demo display. */
  readonly tooltipId: string | null;
}

/** Convert a click timeline phase into the ring's visual phase. */
function ringPhaseFor(
  timeline: ClickTimelineState,
  selectedSentenceId: string | null,
): SentenceRingPhase {
  // The ring overlay tracks the click-feedback envelope only. Once the
  // timeline is 'settled', B's decoration takes over and our overlay
  // disappears to avoid double-rendering.
  if (timeline.phase === 'idle') return 'none';
  if (timeline.phase === 'settled') return 'none';
  if (timeline.sentenceId == null) return 'none';
  if (selectedSentenceId && selectedSentenceId !== timeline.sentenceId) {
    // A new click is in progress — ring follows the new id.
    if (timeline.phase === 'mousedown') return 'mousedown';
    return 'ring-fade';
  }
  switch (timeline.phase) {
    case 'mousedown':
      return 'mousedown';
    case 'ring-fade':
    case 'content-swap':
      return 'ring-fade';
    default:
      return 'none';
  }
}

/**
 * Hook form — returns the full API without rendering anything. Consumers
 * that want tighter control over where the overlays live can use this
 * and render SentenceRing / HoverTooltip themselves.
 */
export function useClickManager(props: Omit<ClickManagerProps, 'children'>): {
  readonly api: ClickManagerApi;
  readonly ringProps: {
    readonly sentenceId: string | null;
    readonly phase: SentenceRingPhase;
    readonly tier: ReturnType<typeof tierFor>;
  };
  readonly tooltipProps: {
    readonly visible: boolean;
    readonly sentenceId: string | null;
    readonly position: { readonly x: number; readonly y: number } | null;
  };
} {
  const {
    editor,
    profile,
    editorRef,
    panelRef,
    selectedSentenceId,
    onSelectSentence,
    onSelectParagraph,
    onDeselect,
    reducedMotion,
    slowMotion = 1,
    onTimelineChange,
  } = props;

  // --- Timeline machine ----------------------------------------------------
  const timeline = useClickTimeline({
    onRingShow: () => {
      // Ring show is handled visually by SentenceRing reading the
      // timeline state; we don't need a side effect here. Kept as an
      // explicit no-op so the contract remains future-extensible.
    },
    onContentSwap: (id) => {
      // Phase 7 §3.1 t=180 — drive panel mode change. This is where
      // E's AnimatePresence crossfade begins.
      onSelectSentence(id);
    },
    reducedMotion,
    slowMotion,
  });

  // Surface timeline updates to the demo.
  const onTimelineChangeRef = useRef(onTimelineChange);
  useEffect(() => {
    onTimelineChangeRef.current = onTimelineChange;
  }, [onTimelineChange]);
  useEffect(() => {
    onTimelineChangeRef.current?.(timeline.state);
  }, [timeline.state]);

  // --- Rapid-click coalescer ----------------------------------------------
  const rapid = useRapidClick({
    onCommit: (id) => {
      timeline.start(id);
    },
  });

  // --- Hover tooltip -------------------------------------------------------
  const hover = useHoverTooltip();

  // --- Paragraph click -----------------------------------------------------
  const paragraph = useParagraphClick({ onParagraphSelect: onSelectParagraph });

  // --- Deselection ---------------------------------------------------------
  useDeselection({
    editorRef,
    panelRef,
    hasSelection: selectedSentenceId != null,
    onDeselect: () => {
      // Dismiss the tooltip and abort any in-flight click envelope so
      // the ring doesn't persist into the overview state.
      hover.dismiss();
      rapid.abort();
      timeline.abort();
      onDeselect();
    },
  });

  // --- Editor-facing handlers ---------------------------------------------

  const onSentenceClick = useCallback(
    (id: string) => {
      // Phase 7 §2.5 — click dismisses tooltip immediately.
      hover.dismiss();
      // Phase 7 §2.8 "click-same-sentence is an idempotent no-op" — we
      // still fire `report()` so the ring re-pulses as proof of receipt
      // (§3.7 re-pulse). useClickTimeline's `start()` re-kicks the ring
      // animation; the onContentSwap call will pass the same id to
      // onSelectSentence, which is a same-mode no-op in usePanelMode.
      rapid.report(id);
    },
    [hover, rapid],
  );

  const onSentenceHover = useCallback(
    (id: string | null) => {
      if (id == null) {
        hover.reportLeave();
      } else {
        hover.reportEnter(id);
      }
    },
    [hover],
  );

  // --- Tooltip anchor computation -----------------------------------------
  // Position the tooltip above the hovered sentence's top-center.
  const tooltipPosition = useMemo(() => {
    if (!editor || !hover.tooltipId) return null;
    try {
      const range = sentenceIdToRange(editor, hover.tooltipId, profile);
      if (!range) return null;
      const start = editor.view.coordsAtPos(range.from);
      const end = editor.view.coordsAtPos(range.to);
      const x = (start.left + end.right) / 2;
      const y = start.top;
      return { x, y };
    } catch {
      return null;
    }
  }, [editor, hover.tooltipId, profile]);

  // --- Ring inputs ---------------------------------------------------------
  // The ring's active sentence is either the timeline's in-flight id
  // (during an envelope) or null (when B's decoration takes over).
  const ringSentenceId =
    timeline.state.phase !== 'idle' && timeline.state.phase !== 'settled'
      ? timeline.state.sentenceId
      : null;

  const ringTier = useMemo(
    () => tierFor(profile, ringSentenceId),
    [profile, ringSentenceId],
  );

  const ringPhase = ringPhaseFor(timeline.state, selectedSentenceId);

  const api: ClickManagerApi = {
    onSentenceClick,
    onSentenceHover,
    onParagraphClick: paragraph.handleGutterClick,
    timeline: timeline.state,
    pendingClickId: rapid.pending,
    tooltipId: hover.tooltipId,
  };

  return {
    api,
    ringProps: {
      sentenceId: ringSentenceId,
      phase: ringPhase,
      tier: ringTier,
    },
    tooltipProps: {
      visible: hover.tooltipId != null,
      sentenceId: hover.tooltipId,
      position: tooltipPosition,
    },
  };
}

function tierFor(profile: EssayProfile, sentenceId: string | null) {
  if (!sentenceId) return null;
  return profile.sentences.find((s) => s.id === sentenceId)?.tier ?? null;
}

/**
 * Component form — renders the ring + tooltip overlays and exposes the
 * editor-facing event handlers via the `children` render prop.
 */
export function ClickManager(props: ClickManagerProps) {
  const { children, editor, profile, editorRef, reducedMotion } = props;

  const { api, ringProps, tooltipProps } = useClickManager(props);

  return (
    <>
      <SentenceRing
        sentenceId={ringProps.sentenceId}
        phase={ringProps.phase}
        tier={ringProps.tier}
        editor={editor}
        profile={profile}
        editorRef={editorRef}
        reducedMotion={reducedMotion}
      />
      <HoverTooltip
        visible={tooltipProps.visible}
        sentenceId={tooltipProps.sentenceId}
        profile={profile}
        position={tooltipProps.position}
        reducedMotion={reducedMotion}
      />
      {children?.(api)}
    </>
  );
}
