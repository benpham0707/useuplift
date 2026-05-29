/**
 * SentenceRing — click-feedback overlay ring (Workstream J).
 *
 * Phase 7 §2.1 — the luminous click-feedback ring
 * -----------------------------------------------
 * This is the CLICK-FEEDBACK ring, rendered as an absolute overlay on top of
 * the editor. It is distinct from Workstream B's `anno-sentence-selected`
 * decoration, which provides the PERSISTENT selection box-shadow while a
 * sentence is selected.
 *
 * Two-ring model (J's ring ownership decision):
 *   1. Click-feedback ring (this component) — brief, decays after the 120ms
 *      fade-in + 180ms content-swap envelope ends (t=360 total). It exists
 *      purely to render the §2.1 mousedown scale pulse + the 120ms ring
 *      fade-in as an overlay that is NOT dependent on whether B's decoration
 *      plugin has flushed `selectedSentenceId`.
 *   2. Selection ring (B's decoration) — persistent via PM decoration while
 *      selectedSentenceId is set. Takes over once the click envelope
 *      settles.
 *
 * We keep them separate for now because:
 *   - B's decoration is a PM inline decoration and re-runs only on prop
 *     change; coupling a scale-pulse animation to the PM transaction cycle
 *     is invasive (would require motion on a widget span mid-transaction).
 *   - The click-feedback overlay is bound to `performance.now()` timers
 *     from useClickTimeline; rendering it as a React overlay keeps the
 *     timing precise and the motion/react transitions independent of PM.
 *
 * Phase 7 §3.9 reduced-motion:
 *   - No scale pulse (transform: none).
 *   - Ring opacity ramp uses DURATION.reducedMotionCrossfade (140ms) and
 *     easings collapse to `ease`.
 *
 * Positioning:
 *   We compute the sentence's bounding rect via PM's
 *   `view.coordsAtPos(from)` and `coordsAtPos(to)`. The overlay span
 *   absolute-positions itself relative to `editorRef` (the editor surface
 *   container). We re-measure on window resize and on scroll of the
 *   nearest scrollable ancestor.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { Editor } from '@tiptap/react';

import { DURATION, EASING, TIER_CSS_VAR, type Tier } from '../tokens';
import { sentenceIdToRange } from '../editor/sentenceMapping';
import type { EssayProfile } from '../types/profile';

export type SentenceRingPhase = 'mousedown' | 'ring-fade' | 'settled' | 'none';

export interface SentenceRingProps {
  readonly sentenceId: string | null;
  readonly phase: SentenceRingPhase;
  readonly tier: Tier | null;
  readonly editor: Editor | null;
  readonly profile: EssayProfile;
  /**
   * The editor surface element — used as the positioning context so
   * coordsAtPos values can be translated into CSS top/left on the
   * overlay.
   */
  readonly editorRef: React.RefObject<HTMLElement>;
  readonly reducedMotion: boolean;
}

interface Rect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Compute the overlay rect (in editorRef-local coordinates) for a
 * sentence's PM range. Multi-line sentences get a bounding box from the
 * line containing `from` to the line containing `to`; this is a simplified
 * approach — the ideal behaviour would be per-line rings, but that's a
 * Phase-7-future nicety.
 */
function computeSentenceRect(
  editor: Editor,
  from: number,
  to: number,
  container: HTMLElement,
): Rect | null {
  try {
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const containerBox = container.getBoundingClientRect();

    // Use the left-top from start and right-bottom from end; for a
    // single-line sentence this is the correct bounding rect. For a
    // wrapped sentence we union horizontally across the editor's padding
    // width so the ring still covers the sentence — not perfect but
    // non-broken.
    const left = Math.min(start.left, end.left) - containerBox.left;
    const top = start.top - containerBox.top;
    const bottom = end.bottom - containerBox.top;
    const right = Math.max(start.right, end.right) - containerBox.left;

    const isWrapped = end.top > start.top + 2;
    // For wrapped sentences, widen the ring to the editor's content box
    // left/right so it reads as "the full span" rather than a jagged
    // diagonal.
    const width = isWrapped
      ? containerBox.width
      : Math.max(4, right - left);
    const rectLeft = isWrapped ? 0 : left;
    const height = Math.max(4, bottom - top);

    return {
      top,
      left: rectLeft,
      width,
      height,
    };
  } catch {
    // coordsAtPos can throw if the position is out of range during a
    // transient editor state. Silently decline to render rather than
    // crash the overlay layer.
    return null;
  }
}

export function SentenceRing(props: SentenceRingProps) {
  const {
    sentenceId,
    phase,
    tier,
    editor,
    profile,
    editorRef,
    reducedMotion,
  } = props;

  const [rect, setRect] = useState<Rect | null>(null);

  // Re-measure on sentence change + on scroll + on resize. Stored in a
  // state, not a ref, because we need React to commit the new top/left.
  useEffect(() => {
    if (!editor || !sentenceId || phase === 'none') {
      setRect(null);
      return;
    }
    const container = editorRef.current;
    if (!container) return;

    const measure = () => {
      const range = sentenceIdToRange(editor, sentenceId, profile);
      if (!range) {
        setRect(null);
        return;
      }
      const next = computeSentenceRect(editor, range.from, range.to, container);
      setRect(next);
    };

    measure();

    // Listen on scroll (capture so we catch nested scrollers) + resize.
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [editor, sentenceId, phase, profile, editorRef]);

  const ringStyle = useMemo<CSSProperties | null>(() => {
    if (!rect || !tier) return null;
    const tierVar = TIER_CSS_VAR[tier];
    return {
      position: 'absolute',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      pointerEvents: 'none',
      borderRadius: 4,
      // Phase 7 §2.1 — 2px outline + luminous halo.
      boxShadow: `inset 0 0 0 1.5px hsl(var(${tierVar}) / 0.7), 0 0 8px 0 hsl(var(${tierVar}) / 0.2)`,
      willChange: 'transform, opacity',
      // Phase 5 §7 Z_LAYER.editor + 1 to overlay decorations without
      // escaping the editor z-stack.
      zIndex: 11,
    };
  }, [rect, tier]);

  if (!ringStyle || phase === 'none' || !sentenceId) return null;

  // Phase 7 §2.1 + §3.1 — animation variant per timeline phase.
  //   mousedown  : opacity 0, scale(1.012) briefly (60ms)
  //   ring-fade  : opacity ramps 0 → 0.8 over 120ms, scale back to 1
  //   settled    : hold 0.8 opacity; B's decoration takes over
  // Reduced motion: drop the scale; opacity ramps over
  // DURATION.reducedMotionCrossfade (140ms).

  const pulseScale = reducedMotion ? 1 : phase === 'mousedown' ? 1.012 : 1;

  const targetOpacity = phase === 'mousedown' ? 0.4 : 0.8;

  return (
    <motion.span
      aria-hidden="true"
      data-anno-click-ring="true"
      data-ring-phase={phase}
      initial={{ opacity: 0, scale: 1 }}
      animate={{
        opacity: targetOpacity,
        scale: pulseScale,
      }}
      transition={{
        opacity: {
          duration:
            (reducedMotion
              ? DURATION.reducedMotionCrossfade
              : DURATION.ringFadeIn) / 1000,
          ease: reducedMotion
            ? 'easeOut'
            : ([0.22, 1, 0.36, 1] as [number, number, number, number]),
        },
        scale: {
          duration: DURATION.mousedownPulse / 1000,
          // Phase 7 §3.8 — press pulse uses motion-in / ease-out-quart.
          ease: reducedMotion
            ? 'linear'
            : ([0.22, 1, 0.36, 1] as [number, number, number, number]),
        },
      }}
      style={ringStyle}
    />
  );
}

// Re-export easing key names to help demo pages surface what's driving the
// animation. Not essential to the component API; harmless to expose.
export const RING_EASING = {
  pulse: EASING.underlineBloom,
  fade: EASING.underlineBloom,
} as const;
