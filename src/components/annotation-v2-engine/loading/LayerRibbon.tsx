/**
 * Phase 4 — Layer Ribbon component.
 *
 * Authority:
 *   - docs/ux_phases/phase_4_loading_state.md §2.1 (7-dot segmented
 *     progress, hairline connector, caption below)
 *   - docs/ux_phases/phase_4_loading_state.md §3 (caption swap timings:
 *     120ms out, 180ms in with 2px Y-translate)
 *   - docs/ux_phases/phase_4_loading_state.md §8 open question #2
 *     (aria-live polite, debounced)
 *   - workshop.css `@keyframes ribbon-dot-pulse` (1.5s breathe)
 *
 * Visual contract:
 *   - Horizontal row of 7 dots: L1 → L2 → L2.5 → L3 → L3.75 → L3.5 → L5
 *     (L4 merged into L3.75 per §2.1 footnote).
 *   - 6px diameter dots, 2px gap, 1px hairline connector between dots.
 *   - Dot states:
 *       - `pending` — hsl(220 10% 70% / 0.3).
 *       - `active`  — EXCEPTIONAL hue @ 80% opacity with 1.5s breathe
 *                     pulse (from workshop.css `@keyframes ribbon-dot-pulse`).
 *       - `done`    — STRONG hue @ full opacity.
 *   - Caption below the ribbon: 13px (tokens.TYPOGRAPHY.size.loadingCaption),
 *     morphs on change via 120ms fade out + 180ms fade in with
 *     2px Y-translate. Driven by motion/react's `AnimatePresence`.
 *   - Live region announces each caption for screen readers.
 *
 * prefers-reduced-motion: pulse becomes a static color, caption swap
 * collapses to a simple opacity crossfade (no Y-translate). workshop.css
 * handles the pulse side; the caption side is gated here.
 */

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { LayerName } from '../types/navigation';
import { DURATION, TYPOGRAPHY } from '../tokens';
import { RIBBON_LAYER_ORDER } from './captions';

export type DotState = 'pending' | 'active' | 'done';

interface LayerRibbonProps {
  readonly activeLayer: LayerName | null;
  readonly completedLayers: ReadonlySet<LayerName>;
  readonly caption: string;
  /**
   * When true, the ribbon renders in cancelled state — all dots fade
   * to muted, pulse stops, caption shows the cancelled string.
   */
  readonly cancelled?: boolean;
}

function dotStateFor(
  layer: LayerName,
  activeLayer: LayerName | null,
  completed: ReadonlySet<LayerName>,
): DotState {
  if (completed.has(layer)) return 'done';
  if (activeLayer === layer) return 'active';
  return 'pending';
}

export function LayerRibbon({
  activeLayer,
  completedLayers,
  caption,
  cancelled = false,
}: LayerRibbonProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  // Live-region: announce caption changes for screen readers. Phase 4 §8
  // open question 2 recommends a polite, debounced live region. We
  // mirror the caption into a dedicated hidden div with aria-live so
  // the AnimatePresence-driven visible caption doesn't fight the
  // assistive-tech announcement cadence.
  const liveRegionRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = caption;
    }
  }, [caption]);

  return (
    <div
      role="group"
      aria-label="Analysis progress"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        opacity: cancelled ? 0.5 : 1,
        transition: 'opacity 220ms ease-out',
      }}
    >
      {/* Dots row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
        aria-hidden="true"
      >
        {RIBBON_LAYER_ORDER.map((layer, idx) => {
          const state = cancelled
            ? 'pending'
            : dotStateFor(layer, activeLayer, completedLayers);
          return (
            <div
              key={layer}
              style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <RibbonDot
                state={state}
                label={layer}
                reducedMotion={Boolean(prefersReducedMotion)}
              />
              {idx < RIBBON_LAYER_ORDER.length - 1 && (
                <div
                  style={{
                    width: '12px',
                    height: '1px',
                    background: 'hsl(220 10% 70% / 0.35)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Caption — animated crossfade with 2px Y-translate. */}
      <div
        style={{
          minHeight: '18px',
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {caption ? (
            <motion.div
              key={caption}
              initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : 2,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : -2,
                transition: {
                  duration: DURATION.captionSwapOut / 1000,
                  ease: [0.4, 0, 1, 1] as const, // ease-in (Phase 4 §3)
                },
              }}
              transition={{
                duration: DURATION.captionSwapIn / 1000,
                ease: [0.16, 1, 0.3, 1] as const, // ease-out (Phase 4 §3)
              }}
              style={{
                fontSize: TYPOGRAPHY.size.loadingCaption,
                fontFamily: TYPOGRAPHY.families.sans,
                color: 'hsl(220 15% 35%)',
                fontFeatureSettings: '"ss01"',
                lineHeight: TYPOGRAPHY.lineHeight.sans,
                letterSpacing: TYPOGRAPHY.tracking.prose,
                textAlign: 'center',
              }}
            >
              {caption}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Hidden live region for SR announcements. Polite so it doesn't
          interrupt; atomic so the entire caption is re-read on swap. */}
      <span
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  );
}

interface RibbonDotProps {
  readonly state: DotState;
  readonly label: LayerName;
  readonly reducedMotion: boolean;
}

function RibbonDot({ state, label, reducedMotion }: RibbonDotProps): JSX.Element {
  // Colors per Phase 4 §2.1:
  //   pending → hsl(220 10% 70% / 0.3)
  //   active  → hsl(var(--anno-exceptional) / 0.80) + pulse
  //   done    → hsl(var(--anno-strong)) at full opacity
  const colorMap: Record<DotState, string> = {
    pending: 'hsl(220 10% 70% / 0.3)',
    active: 'hsl(var(--anno-exceptional) / 0.80)',
    done: 'hsl(var(--anno-strong))',
  };

  const shouldPulse = state === 'active' && !reducedMotion;

  return (
    <div
      title={label}
      aria-label={label}
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: colorMap[state],
        transition: 'background-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        animation: shouldPulse ? 'ribbon-dot-pulse 1.5s ease-in-out infinite' : 'none',
      }}
    />
  );
}

export default LayerRibbon;
