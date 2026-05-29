/**
 * useBloomChoreography — the Phase 5 "The Bloom" master state machine.
 *
 * Consumes Phase 4's `paragraphTintsReady` and `revealReady` hand-off
 * signals (see `docs/ux_phases/phase_4_loading_state.md` §2.8) and emits
 * discrete phase transitions that drive the editor surface (paragraph
 * tint phase, underline phase, gutter fade), the right panel (visible +
 * auto-select sentence), the header narrative glow, and the "Start here"
 * chip. The timing schedule lives in `./bloomTimings.ts` (which cites
 * Phase 5 §§2.1 / 3 / 4 for every landmark).
 *
 * Contract:
 *   - `paragraphTintsReady: false → true` flips tints to `muted40`
 *     (Phase 4 §2.2 pre-bloom at L3.5 completion).
 *   - `revealReady: false → true` kicks the timeline forward:
 *       t=0    → tints deepen to `deep55` (Phase 5 §2.1 step 1)
 *       t=180  → panel visible (Phase 5 §2.1 step 2)
 *       t=400  → gutter labels visible (Phase 5 §2.1 step 3)
 *       t=600  → strengths wave (Phase 5 §2.1 step 4)
 *       t=900  → header narrative visible (Phase 5 §2.1 step 5)
 *       t=1500 → critical wave (Phase 5 §2.1 step 6)
 *       t=2200 → auto-select strongest sentence (Phase 5 §2.1 step 7)
 *       t=2400 → "Start here" chip visible (Phase 5 §2.6)
 *       t=2400 → underlinePhase flips to 'full' (both waves complete)
 *       t=2600 → interactive (Phase 5 §2.1 step 8)
 *   - Revealready going back to `false` (e.g., user-cancelled
 *     re-analysis) resets the machine to the Phase 4 pre-bloom state.
 *   - `reducedMotion: true` collapses the entire choreography to a
 *     single crossfade at t=400ms (Phase 5 §2.1 "all blooms collapse
 *     to a single 220ms crossfade"), with panel + chip + narrative +
 *     auto-select all landing at that mark. See `REDUCED_MOTION_TIMELINE`.
 *   - Edge cases (Phase 5 §2.2 / §2.6):
 *       · Zero STRONG+ sentences → strengths wave skipped; critical
 *         wave begins at t=600 (advanced by 900ms) and "Start here"
 *         chip becomes the primary nudge (§2.6 "promoted to primary").
 *       · Zero CRITICAL / NEEDS_WORK sentences → critical wave skipped;
 *         `interactive` still lands at t=2600 so the handoff timing is
 *         stable for Phase 6.
 *
 * Accessibility (Phase 5 §2.10 / Phase 6 §9):
 *   - At t=0 (reveal begins) we flip `ariaAnnouncement` to
 *     "Analysis complete." — callers mirror this into a polite
 *     live region.
 *   - At t=2200 (auto-select) we append the paragraph hint
 *     "Auto-selected strongest sentence in paragraph N."
 *   - When strongest sentence is null, we skip the auto-select
 *     announcement (there's no strongest sentence to name).
 *
 * The hook owns NO DOM. It's a pure orchestrator; consumers route its
 * outputs into the editor/panel/chip components.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { EssayProfile } from '../types/profile';
import type {
  ParagraphTintPhase,
  UnderlinePhase,
} from '../editor';
import type { Tier } from '../tokens';
import { useAutoSelectStrongest } from './useAutoSelectStrongest';
import {
  BLOOM_TIMELINE,
  REDUCED_MOTION_TIMELINE,
} from './bloomTimings';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type GutterFadePhase = 'hidden' | 'visible';

export interface BloomState {
  /** Editor paragraph tint phase. Phase 5 §2.1 step 1. */
  readonly paragraphTintPhase: ParagraphTintPhase;
  /** Editor sentence underline phase. Phase 5 §2.1 steps 4 / 6. */
  readonly underlinePhase: UnderlinePhase;
  /** Panel slide-in gate. Phase 5 §2.1 step 2 / §2.9. */
  readonly panelVisible: boolean;
  /** Gutter role label visibility. Phase 5 §2.1 step 3 / §2.8. */
  readonly gutterFadePhase: GutterFadePhase;
  /** Header narrative glow visibility. Phase 5 §2.1 step 5 / §6. */
  readonly headerNarrativeVisible: boolean;
  /** "Start here" chip visibility. Phase 5 §2.6. */
  readonly startHereChipVisible: boolean;
  /**
   * Sentence id to auto-select into the panel, or null. Phase 5 §2.6.
   * `null` until t=2200ms; stays `null` on the zero-STRONG+ fallback.
   */
  readonly autoSelectedSentenceId: string | null;
  /** "Start here" chip's click target — the top CRITICAL sentence id. */
  readonly topCriticalSentenceId: string | null;
  /**
   * Phase 5 §2.6 "promoted to primary" — when no STRONG+ sentence
   * exists, the chip is the primary nudge. Downstream chip rendering
   * reads this to swap styling.
   */
  readonly startHereChipPromoted: boolean;
  /** t=2600ms handoff to Phase 6. */
  readonly interactive: boolean;
  /**
   * Latest polite-live-region announcement to publish. Resets to an
   * empty string between landmark announcements; consumers copy this
   * into an aria-live="polite" region. Phase 5 §2.10 / Phase 6 §9.
   */
  readonly ariaAnnouncement: string;
}

export interface UseBloomChoreographyArgs {
  readonly paragraphTintsReady: boolean;
  readonly revealReady: boolean;
  readonly profile: EssayProfile;
  readonly reducedMotion: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const STRONG_PLUS_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
]);
const CRITICAL_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'CRITICAL',
  'NEEDS_WORK',
]);

function hasStrongPlus(profile: EssayProfile): boolean {
  for (const s of profile.sentences) {
    if (STRONG_PLUS_TIERS.has(s.tier)) return true;
  }
  return false;
}

function hasCriticalTier(profile: EssayProfile): boolean {
  for (const s of profile.sentences) {
    if (CRITICAL_TIERS.has(s.tier)) return true;
  }
  return false;
}

/** Phase 5 §2.10 — auto-select paragraph announcement template. */
function autoSelectAnnouncement(
  profile: EssayProfile,
  sentenceId: string | null,
): string {
  if (!sentenceId) return '';
  const sentence = profile.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return '';
  return `Auto-selected strongest sentence in paragraph ${
    sentence.paragraphIndex + 1
  }.`;
}

// Frozen "nothing happening" state — returned before `paragraphTintsReady`
// fires, and as the reset target when `revealReady` drops back to false.
function initialBloomState(
  topCriticalSentenceId: string | null,
  chipPromoted: boolean,
): BloomState {
  return {
    paragraphTintPhase: 'hidden',
    underlinePhase: 'hidden',
    panelVisible: false,
    gutterFadePhase: 'hidden',
    headerNarrativeVisible: false,
    startHereChipVisible: false,
    autoSelectedSentenceId: null,
    topCriticalSentenceId,
    startHereChipPromoted: chipPromoted,
    interactive: false,
    ariaAnnouncement: '',
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBloomChoreography(
  args: UseBloomChoreographyArgs,
): BloomState {
  const { paragraphTintsReady, revealReady, profile, reducedMotion } = args;

  const { strongestSentenceId, topCriticalSentenceId } =
    useAutoSelectStrongest(profile);

  // Phase 5 §2.2 — zero-STRONG+ edge case. `chipPromoted` is surfaced
  // out so the chip component can swap to primary-button styling per
  // §2.6 copy #15.
  const zeroStrongPlus = useMemo(
    () => !hasStrongPlus(profile),
    [profile],
  );
  const zeroCritical = useMemo(
    () => !hasCriticalTier(profile),
    [profile],
  );
  const chipPromoted = zeroStrongPlus;

  const [state, setState] = useState<BloomState>(() =>
    initialBloomState(topCriticalSentenceId, chipPromoted),
  );

  // Track all in-flight timers so a cancel (revealReady → false) can
  // tear them down atomically. Ref keeps the callback stable across
  // renders without re-triggering effects.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scheduledRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  // -------------------------------------------------------------------------
  // paragraphTintsReady → pre-bloom flip to muted40
  //
  // Phase 4 §2.2 + Phase 5 §2.1 step 1 — L3.5 completion paints the
  // paragraph tints at 40% saturation BEFORE reveal starts. Once
  // `revealReady` fires we deepen to 55%; that transition is owned by
  // the landmark scheduler below.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!paragraphTintsReady) {
      // If tints go back to not-ready (shouldn't happen in normal flow
      // but defensive for cancellation/re-analysis), reset.
      setState((prev) => {
        if (prev.paragraphTintPhase === 'hidden') return prev;
        // Only reset when reveal hasn't also fired — otherwise the
        // reveal reset handler below owns the teardown.
        if (revealReady) return prev;
        return initialBloomState(topCriticalSentenceId, chipPromoted);
      });
      return;
    }
    // paragraph_tints_ready == true, reveal hasn't started yet
    // (or has finished and paragraph tints persist — harmless no-op).
    setState((prev) => {
      if (prev.paragraphTintPhase !== 'hidden') return prev;
      return {
        ...prev,
        paragraphTintPhase: 'muted40',
      };
    });
  }, [paragraphTintsReady, revealReady, topCriticalSentenceId, chipPromoted]);

  // -------------------------------------------------------------------------
  // revealReady → kick off the timeline
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!revealReady) {
      // Cancel/reset: drop all timers, reset visible state to tints-
      // only (Phase 4 state) if tints were ready, else initial.
      clearTimers();
      scheduledRef.current = false;
      setState((prev) => {
        const resetTint: ParagraphTintPhase = paragraphTintsReady
          ? 'muted40'
          : 'hidden';
        // Fast reset — only tint carries over, everything else snaps
        // back to pre-bloom idle.
        return {
          ...initialBloomState(topCriticalSentenceId, chipPromoted),
          paragraphTintPhase: resetTint,
        };
      });
      return;
    }

    // Guard: only schedule once per revealReady transition. React strict
    // mode's double-invoke of effects would otherwise fire duplicate
    // timers.
    if (scheduledRef.current) return;
    scheduledRef.current = true;

    // ---------- Reduced-motion collapse ----------
    // Phase 5 §2.1 — single 220ms crossfade at t=400ms. Everything lands
    // together; no staggered waves.
    if (reducedMotion) {
      // Immediate accessibility announcement at t=0 per §2.10.
      setState((prev) => ({
        ...prev,
        ariaAnnouncement: 'Analysis complete.',
      }));

      const fireAt = REDUCED_MOTION_TIMELINE.fireAt;
      const crossfade = REDUCED_MOTION_TIMELINE.crossfadeMs;

      const t = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          paragraphTintPhase: 'deep55',
          underlinePhase: 'full',
          panelVisible: true,
          gutterFadePhase: 'visible',
          headerNarrativeVisible: true,
          startHereChipVisible: true,
          autoSelectedSentenceId: strongestSentenceId,
          topCriticalSentenceId,
          startHereChipPromoted: chipPromoted,
          interactive: true,
          // Stack both announcements (if applicable) into one message
          // so the live region reads them sequentially.
          ariaAnnouncement: strongestSentenceId
            ? `Analysis complete. ${autoSelectAnnouncement(
                profile,
                strongestSentenceId,
              )}`
            : 'Analysis complete.',
        }));
      }, fireAt + crossfade);
      timersRef.current.push(t);
      return () => {
        clearTimers();
        scheduledRef.current = false;
      };
    }

    // ---------- Full choreography ----------
    // Phase 5 §3 — landmarks from bloomTimings.ts.

    // t=0 — Paragraph tint deepens 40→55% AND live region announces
    // "Analysis complete." (Phase 5 §2.10).
    setState((prev) => ({
      ...prev,
      paragraphTintPhase: 'deep55',
      ariaAnnouncement: 'Analysis complete.',
    }));

    const schedule = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
    };

    // t=180 — Panel slides in (Phase 5 §2.1 step 2).
    schedule(BLOOM_TIMELINE.panelFillStart, () => {
      setState((prev) => ({ ...prev, panelVisible: true }));
    });

    // t=400 — Gutter labels begin fading in (Phase 5 §2.1 step 3 / §2.8).
    schedule(BLOOM_TIMELINE.gutterLabelsStart, () => {
      setState((prev) => ({ ...prev, gutterFadePhase: 'visible' }));
    });

    // t=600 — Strengths wave begins. Phase 5 §2.2 edge case: if the
    // essay has no STRONG+ sentences, we skip straight to the critical
    // wave at t=600 (spec: "the critical wave begins at t=600ms and the
    // header narrative softens accordingly").
    schedule(BLOOM_TIMELINE.strengthsWaveStart, () => {
      setState((prev) => ({
        ...prev,
        underlinePhase: zeroStrongPlus ? 'criticalWave' : 'strengthsWave',
      }));
    });

    // t=900 — Header narrative fades in (Phase 5 §2.1 step 5 / §6).
    schedule(BLOOM_TIMELINE.headerNarrativeStart, () => {
      setState((prev) => ({ ...prev, headerNarrativeVisible: true }));
    });

    // t=1500 — Critical wave begins. Phase 5 §2.1 step 6. Skipped
    // entirely when essay has no CRITICAL / NEEDS_WORK sentences (in
    // which case the strengths wave continues alone until t=2400).
    if (!zeroStrongPlus && !zeroCritical) {
      schedule(BLOOM_TIMELINE.criticalWaveStart, () => {
        setState((prev) => ({ ...prev, underlinePhase: 'criticalWave' }));
      });
    } else if (zeroStrongPlus && !zeroCritical) {
      // We already flipped to criticalWave at t=600 above; no action.
    }

    // t=2200 — Auto-selection fires (Phase 5 §2.1 step 7 / §2.6).
    schedule(BLOOM_TIMELINE.autoSelectStart, () => {
      setState((prev) => ({
        ...prev,
        autoSelectedSentenceId: strongestSentenceId,
        ariaAnnouncement: strongestSentenceId
          ? autoSelectAnnouncement(profile, strongestSentenceId)
          : prev.ariaAnnouncement,
      }));
    });

    // t=2400 — Underline phase reaches "full" (both waves settled) and
    // the "Start here" chip fades in (Phase 5 §2.6 @ t=2400 per §3).
    //
    // If `zeroCritical`, the 'full' transition happens at the strengths
    // wave end (≈t=1500); we still land both waves by t=2400 for
    // timing consistency with the interactive handoff at t=2600.
    schedule(BLOOM_TIMELINE.criticalWaveEnd, () => {
      setState((prev) => ({
        ...prev,
        underlinePhase: 'full',
        startHereChipVisible: true,
      }));
    });

    // t=2600 — Interactive (Phase 5 §2.1 step 8). Phase 6 orientation
    // takes over from here.
    schedule(BLOOM_TIMELINE.interactive, () => {
      setState((prev) => ({ ...prev, interactive: true }));
    });

    return () => {
      clearTimers();
      scheduledRef.current = false;
    };
    // We intentionally avoid re-running this effect on `profile` or
    // `reducedMotion` changes mid-reveal — the timeline is scheduled
    // once per revealReady transition. Consumers who need to hot-swap
    // those should toggle revealReady.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealReady]);

  // Keep the `topCriticalSentenceId` and `startHereChipPromoted` fields
  // synchronized with the memoized values across re-renders — they're
  // derived from `profile` and are otherwise decoupled from the
  // timeline schedule.
  useEffect(() => {
    setState((prev) => {
      if (
        prev.topCriticalSentenceId === topCriticalSentenceId &&
        prev.startHereChipPromoted === chipPromoted
      ) {
        return prev;
      }
      return {
        ...prev,
        topCriticalSentenceId,
        startHereChipPromoted: chipPromoted,
      };
    });
  }, [topCriticalSentenceId, chipPromoted]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return state;
}
