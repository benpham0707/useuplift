/**
 * HeaderNarrative — the single-line curator's note that fades into the
 * toolbar region at t=900ms during Phase 5's bloom (Phase 5 §2.1 step 5
 * and §6 copy deck #8–13).
 *
 * This is NOT a toast, NOT a modal, NOT a score. It's a single sentence
 * that names one strength and one direction — per Phase 5 §2.2, the
 * header narrative is the third framing device (after overview card and
 * strengths wave) that lands before the critical wave.
 *
 * Copy resolution:
 *   - Server-side, the profile's `overview.headerNarrative` already
 *     carries the resolved template string (Phase 5 §6 #8–13 pick by
 *     holistic strongest/weakest dimension).
 *   - If the essay has zero STRONG+ sentences — Phase 5 §2.2 fallback —
 *     we override with §6 #12: "This is a first pass. Let's find the
 *     center." Task spec asks us to soften to a gentler "find what's
 *     working first" variant; we use the spec-verbatim #12 unless
 *     overridden by `fallbackCopy`.
 *
 * Animation:
 *   - 240ms fade + 2px Y-translate on appear (α-A
 *     `DURATION.headerNarrativeFade`, Phase 5 §4 motion table).
 *   - Dismisses on first user interaction (any sentence click) — the
 *     consumer wires `onDismiss` via its own interaction listener.
 *   - `prefers-reduced-motion`: static fade, no Y-translate (Phase 5
 *     §2.1 reduced-motion rule).
 *
 * Typography: `TYPOGRAPHY.size.headerNarrative` (16px), medium weight,
 * sage-toned text color. Per α-A `TYPOGRAPHY.families.sans`.
 *
 * Positioning: the caller places the component inside the toolbar
 * region; this component does NOT self-position. It's visually an
 * inline element with flex/centered alignment owned by the caller.
 */

import { type FC, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { DURATION, EASING, TYPOGRAPHY } from '../tokens';
import type { EssayProfile } from '../types/profile';

export interface HeaderNarrativeProps {
  readonly visible: boolean;
  readonly profile: EssayProfile;
  readonly reducedMotion: boolean;
  /**
   * Phase 5 §6 #6 fallback — when the essay has zero STRONG+ sentences,
   * the default copy softens. Overrideable by the consumer (e.g., the
   * demo toggles to exercise the fallback path).
   */
  readonly fallbackCopy?: string;
  /** Fires on first user interaction in the editor; hides the narrative. */
  readonly onDismiss?: () => void;
}

// Phase 5 §6 #12 — early-draft (no STRONG+) header narrative.
const DEFAULT_FALLBACK_COPY =
  "Let's find what's working first — then build from there.";

function hasStrongPlus(profile: EssayProfile): boolean {
  for (const s of profile.sentences) {
    if (s.tier === 'STRONG' || s.tier === 'EXCEPTIONAL' || s.tier === 'MASTERFUL') {
      return true;
    }
  }
  return false;
}

export const HeaderNarrative: FC<HeaderNarrativeProps> = ({
  visible,
  profile,
  reducedMotion,
  fallbackCopy = DEFAULT_FALLBACK_COPY,
  onDismiss,
}) => {
  // Phase 5 §2.2 edge case — override when no STRONG+ sentences exist.
  const copy = useMemo(() => {
    if (hasStrongPlus(profile)) return profile.overview.headerNarrative;
    return fallbackCopy;
  }, [profile, fallbackCopy]);

  // Phase 5 §4 motion table — 240ms fade + 2px Y-translate (disabled
  // under reduced motion per §2.1).
  const initial = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 2 };
  const animate = reducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const exit = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 2 };

  const transition = reducedMotion
    ? {
        duration: DURATION.reducedMotionCrossfade / 1000,
        ease: 'linear' as const,
      }
    : {
        duration: DURATION.headerNarrativeFade / 1000,
        ease: EASING.contentCrossfade,
      };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          // Phase 5 §2.1 step 5 — single-line curator's note.
          // role="note" is the ARIA equivalent of a sidebar/callout.
          role="note"
          aria-label="Analysis summary"
          onClick={onDismiss}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
          style={{
            // Typography per α-A TYPOGRAPHY.size.headerNarrative.
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.headerNarrative,
            fontWeight: TYPOGRAPHY.weight.medium,
            lineHeight: TYPOGRAPHY.lineHeight.sans,
            // Sage-toned color — matches Phase 5 §6 "sage-toned text".
            color: 'hsl(220 15% 38%)',
            // Caller places us; we only contribute typography + hit area.
            cursor: onDismiss ? 'pointer' : 'default',
            // Keep the line single-line-friendly at container widths
            // down to ~640px (Phase 5 §2.1 step 5 "one line").
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {copy}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
