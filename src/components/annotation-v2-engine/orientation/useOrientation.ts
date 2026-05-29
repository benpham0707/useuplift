/**
 * useOrientation — master orchestrator for the Phase 6 First-Time
 * Orientation layer (Workstream K).
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md (entire document — this
 *     hook is the coordination surface for every decision in §§2.1–2.10).
 *   - §2.1 chip inactivity pulse (12s threshold, single 400ms pulse).
 *   - §2.3 progressive hints (one-shot, max one on-screen, queued).
 *   - §2.5 keyboard shortcut surfaces (footer appears after first panel
 *     close).
 *   - §5 hint registry priority / fire-once key semantics.
 *
 * Responsibilities:
 *   - Owns the 12s inactivity clock feeding the "Start here" chip pulse.
 *   - Owns the hint queue (via `useHintQueue`) — receives trigger
 *     signals from the page and decides whether to enqueue each hint,
 *     honoring localStorage one-shot and reduced-motion skip rules.
 *   - Owns the keyboard-shortcut footer visibility (one-shot after
 *     first panel close).
 *   - Feeds the parallel screen-reader orientation path.
 *   - Exposes `dismissHint` (user interaction) and
 *     `resetAllHintsForDemo` (demo-only affordance).
 *
 * Not owned here:
 *   - Measuring hover durations (consumer supplies a pre-debounced
 *     boolean `filterIconHovered` / `listToggleHovered`).
 *   - The DOM rendering of hints (AmbientHint) or footer
 *     (KeyboardShortcutFooter) — consumer composes those using the
 *     outputs of this hook.
 *   - Server-side OrientationState (§11) — client-side only for Wave β;
 *     backend sync arrives with γ.
 *
 * Trigger → hint wiring:
 *
 *   | Trigger signal from consumer                   | Hint              |
 *   |------------------------------------------------|-------------------|
 *   | bloomInteractive=true && panelOpenedOnce=true  | h1_panel_exists   |
 *   | filterIconHovered=true                         | h2_filters_...    |
 *   | insightsReadCount >= 2                         | h3_profile_tab... |
 *   | panelMode=insight && >5min since bloom start   | h4_coaching_bar   |
 *   | listToggleHovered=true                         | h5_list_view...   |
 *
 * Notes on each:
 *   - h1 fires after the first panel-open (the panel has displayed its
 *     first insight). Prior to that, the overview card is visible but
 *     the "this panel follows your clicks" framing hasn't paid off yet.
 *   - h4 is never-trigger unless `coachingBarPresent=true`; demos that
 *     don't include the coaching bar pass false and h4 never queues.
 *   - h3 respects "Profile tab gated until 2 insights read" (§2.6).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { PanelMode } from '../panel/PanelModes';
import {
  HINT_REGISTRY,
  KEYBOARD_FOOTER_STORAGE_KEY,
  clearAllHintStorageForDemo,
  readHintSeen,
  writeHintSeen,
  type HintDef,
  type HintId,
} from './hintsRegistry';
import { useHintQueue } from './useHintQueue';
import { useInactivityTimer } from './useInactivityTimer';

// --- types --------------------------------------------------------------

export interface UseOrientationOpts {
  /**
   * Flips true at Phase 5 t=2600ms (bloom-end, bloom becomes
   * interactive). Seeds orientation: starts SR announcement, arms
   * inactivity timer, allows hint triggers to begin evaluating.
   */
  readonly bloomInteractive: boolean;
  /**
   * Deduplicated count of insights read (dwell-threshold met, from
   * `usePanelMode.insightsReadCount`).
   */
  readonly insightsReadCount: number;
  /**
   * Current panel mode (drives h4 "coaching bar after 5min open" gate
   * and the SR announcement cadence).
   */
  readonly panelMode: PanelMode;
  /**
   * Flips true once the panel has displayed its first insight-mode
   * view (from either Phase 5 auto-select or a voluntary click).
   * Feeds h1 trigger.
   */
  readonly panelOpenedOnce: boolean;
  /**
   * Timestamp (ms since epoch) when the panel was closed for the first
   * time in this session, or null if never closed. Feeds the
   * keyboard-footer one-shot gate.
   */
  readonly firstInsightCloseTimestamp: number | null;
  /** Consumer-debounced hover state on the list-view toolbar toggle. */
  readonly listToggleHovered: boolean;
  /** Consumer-debounced hover state on the filters toolbar icon. */
  readonly filterIconHovered: boolean;
  /**
   * Flips true on the student's FIRST sentence click (ever). Drives the
   * 12s inactivity timer's reset semantics — see §2.1.
   */
  readonly userClicked: boolean;
  readonly reducedMotion: boolean;
  /**
   * True when the coaching bar exists in this scope (host app context,
   * not every demo harness includes it). When false, h4 is
   * silently-never-trigger.
   */
  readonly coachingBarPresent?: boolean;
  /**
   * Timestamp of the last activity that should *reset* the inactivity
   * timer. When a consumer wants to restart the 12s clock (e.g., on
   * any click/keypress), it passes a fresh timestamp. Default: tied to
   * `userClicked` transitions only.
   */
  readonly lastInteractionTs?: number;
  /**
   * Cutoff threshold for h4. Spec §2.8 / this workstream = 5 minutes.
   */
  readonly h4ThresholdMs?: number;
}

export interface UseOrientationResult {
  /**
   * Single-frame pulse signal fed into StartHereChip.showInactivityPulse.
   * Flips true for 400ms after 12s of inactivity post-bloom, then
   * auto-clears. Consumer does not need to reset.
   */
  readonly startHereChipInactivityPulse: boolean;
  /** The hint currently on-screen (null if none). */
  readonly activeHint: HintDef | null;
  /** Controls KeyboardShortcutFooter.visible. */
  readonly keyboardShortcutFooterVisible: boolean;
  /**
   * Live queue of polite announcements intended for the host's
   * aria-live region. Consumer chooses a render policy (e.g., tail
   * rendering). See `useScreenReaderOrientation` for the primary path;
   * this array mirrors those announcements for consumer convenience.
   */
  readonly ariaAnnouncements: readonly string[];
  /**
   * User dismissed the currently-active hint (ESC / click-outside /
   * auto). Persists the seen flag and promotes the next queued hint.
   */
  readonly dismissHint: (id: HintId) => void;
  /**
   * User took the taught action (clicked the anchor). Same state
   * transition as dismiss, but tagged for telemetry.
   */
  readonly consumeHintThroughAction: (id: HintId) => void;
  /**
   * User dismissed the keyboard-shortcut footer via its × affordance.
   * Persists and the footer never returns.
   */
  readonly dismissKeyboardShortcutFooter: () => void;
  /**
   * Demo-only — wipes all hint + footer localStorage keys so a session
   * can be replayed from scratch.
   */
  readonly resetAllHintsForDemo: () => void;
}

// Helper — evaluate whether a hint is eligible to fire (localStorage
// unset, reduced-motion opt-in).
const hintEligible = (hint: HintDef, reducedMotion: boolean): boolean => {
  if (reducedMotion && hint.reducedMotionBehavior === 'skip-entirely') {
    return false;
  }
  return !readHintSeen(hint.localStorageKey);
};

export function useOrientation(opts: UseOrientationOpts): UseOrientationResult {
  const {
    bloomInteractive,
    insightsReadCount,
    panelMode,
    panelOpenedOnce,
    firstInsightCloseTimestamp,
    listToggleHovered,
    filterIconHovered,
    userClicked,
    reducedMotion,
    coachingBarPresent = false,
    lastInteractionTs,
    h4ThresholdMs = 5 * 60 * 1000,
  } = opts;

  const queue = useHintQueue();

  // ---------------------- 12s chip inactivity pulse ----------------------

  // Latch the pulse true for one tick, then auto-clear. The chip
  // component itself also self-clears after DURATION.autoSelectPulse;
  // we mirror that here so the returned boolean doesn't stick.
  const [pulse, setPulse] = useState(false);
  const pulseClearTimerRef = useRef<number | null>(null);

  const handlePulseThreshold = useCallback(() => {
    if (reducedMotion) return; // §9 — no pulse under reduced motion.
    setPulse(true);
    if (pulseClearTimerRef.current !== null) {
      window.clearTimeout(pulseClearTimerRef.current);
    }
    // 400ms matches DURATION.autoSelectPulse. Chip auto-clears too, but
    // we clear the signal so later resets don't re-pulse immediately.
    pulseClearTimerRef.current = window.setTimeout(() => {
      setPulse(false);
      pulseClearTimerRef.current = null;
    }, 420);
  }, [reducedMotion]);

  // The inactivity clock runs only while bloomInteractive. Reset signal:
  // EITHER `userClicked` transition (§2.1 "becomes idle again" — a
  // click is the canonical activity) OR an explicit
  // `lastInteractionTs` from the consumer. Defaulting to `userClicked`
  // means the pulse fires at most once per session in practice: if the
  // student is idle for 12s they get the pulse; if they then click,
  // they've engaged and the pulse hasn't been re-armed because
  // userClicked stays true.
  const resetSignal = useMemo(() => {
    // When consumer supplies a ts, that's the authoritative reset.
    if (typeof lastInteractionTs === 'number') return lastInteractionTs;
    // Fallback: reset on the userClicked edge. Since userClicked is
    // stable once true, this doesn't re-arm; see doc comment above.
    return userClicked ? 1 : 0;
  }, [lastInteractionTs, userClicked]);

  useInactivityTimer({
    active: bloomInteractive && !userClicked,
    resetOn: resetSignal,
    thresholdMs: 12_000,
    onThreshold: handlePulseThreshold,
  });

  useEffect(() => {
    return () => {
      if (pulseClearTimerRef.current !== null) {
        window.clearTimeout(pulseClearTimerRef.current);
        pulseClearTimerRef.current = null;
      }
    };
  }, []);

  // ---------------------- bloom-start timestamp -------------------------

  const bloomStartTsRef = useRef<number | null>(null);
  useEffect(() => {
    if (bloomInteractive && bloomStartTsRef.current === null) {
      bloomStartTsRef.current = Date.now();
    }
  }, [bloomInteractive]);

  // ---------------------- hint trigger evaluation -----------------------

  // h1_panel_exists — after first panel open.
  useEffect(() => {
    if (!bloomInteractive || !panelOpenedOnce) return;
    const hint = HINT_REGISTRY.h1_panel_exists;
    if (!hintEligible(hint, reducedMotion)) return;
    queue.enqueue(hint);
  }, [bloomInteractive, panelOpenedOnce, reducedMotion, queue]);

  // h2_filters_live_in_toolbar — on hover near filter icon.
  useEffect(() => {
    if (!bloomInteractive || !filterIconHovered) return;
    const hint = HINT_REGISTRY.h2_filters_live_in_toolbar;
    if (!hintEligible(hint, reducedMotion)) return;
    queue.enqueue(hint);
  }, [bloomInteractive, filterIconHovered, reducedMotion, queue]);

  // h3_profile_tab_available — after 2 insights read.
  useEffect(() => {
    if (!bloomInteractive || insightsReadCount < 2) return;
    const hint = HINT_REGISTRY.h3_profile_tab_available;
    if (!hintEligible(hint, reducedMotion)) return;
    queue.enqueue(hint);
  }, [bloomInteractive, insightsReadCount, reducedMotion, queue]);

  // h4_coaching_bar_available — panel on insight mode for >5min.
  useEffect(() => {
    if (!bloomInteractive || !coachingBarPresent) return;
    if (panelMode.kind !== 'insight') return;
    const startTs = bloomStartTsRef.current;
    if (startTs === null) return;
    const elapsed = Date.now() - startTs;
    if (elapsed < h4ThresholdMs) {
      // Re-check after the remainder.
      const remaining = h4ThresholdMs - elapsed;
      const t = window.setTimeout(() => {
        const hint = HINT_REGISTRY.h4_coaching_bar_available;
        if (!hintEligible(hint, reducedMotion)) return;
        queue.enqueue(hint);
      }, remaining);
      return () => window.clearTimeout(t);
    }
    const hint = HINT_REGISTRY.h4_coaching_bar_available;
    if (!hintEligible(hint, reducedMotion)) return;
    queue.enqueue(hint);
  }, [
    bloomInteractive,
    coachingBarPresent,
    panelMode,
    reducedMotion,
    queue,
    h4ThresholdMs,
  ]);

  // h5_list_view_available — on hover near list toggle.
  useEffect(() => {
    if (!bloomInteractive || !listToggleHovered) return;
    const hint = HINT_REGISTRY.h5_list_view_available;
    if (!hintEligible(hint, reducedMotion)) return;
    queue.enqueue(hint);
  }, [bloomInteractive, listToggleHovered, reducedMotion, queue]);

  // ---------------------- keyboard shortcut footer ----------------------

  // One-shot gate — we re-read localStorage on mount. The visible flag
  // flips true on first-insight-close, and stays true until the student
  // dismisses via the × (which sets the storage key).
  const [kbFooterVisible, setKbFooterVisible] = useState(false);
  const kbDismissedLatchRef = useRef<boolean>(readHintSeen(KEYBOARD_FOOTER_STORAGE_KEY));

  useEffect(() => {
    if (kbDismissedLatchRef.current) {
      setKbFooterVisible(false);
      return;
    }
    if (firstInsightCloseTimestamp !== null) {
      setKbFooterVisible(true);
    }
  }, [firstInsightCloseTimestamp]);

  const dismissKeyboardShortcutFooter = useCallback(() => {
    writeHintSeen(KEYBOARD_FOOTER_STORAGE_KEY);
    kbDismissedLatchRef.current = true;
    setKbFooterVisible(false);
  }, []);

  // ---------------------- SR mirror ------------------------------------

  // We assemble a lightweight ariaAnnouncements mirror here so
  // consumers that don't wire the dedicated useScreenReaderOrientation
  // hook still get something useful. The dedicated hook is the full
  // implementation (debounce, queueing); this mirror is append-only
  // events coinciding with hint emissions.
  const [ariaAnnouncements, setAriaAnnouncements] = useState<string[]>([]);
  const lastAnnouncedHintRef = useRef<HintId | null>(null);

  useEffect(() => {
    const active = queue.active;
    if (!active) {
      lastAnnouncedHintRef.current = null;
      return;
    }
    if (lastAnnouncedHintRef.current === active.id) return;
    lastAnnouncedHintRef.current = active.id;
    setAriaAnnouncements((prev) => [...prev, `${active.headline} ${active.body}`]);
  }, [queue.active]);

  // Seed a reveal-end announcement once.
  const bloomAnnouncedRef = useRef(false);
  useEffect(() => {
    if (!bloomInteractive || bloomAnnouncedRef.current) return;
    bloomAnnouncedRef.current = true;
    setAriaAnnouncements((prev) => [
      ...prev,
      'Analysis complete. Annotations ready for review. Use Tab to navigate.',
    ]);
  }, [bloomInteractive]);

  // ---------------------- outward API ----------------------------------

  const resetAllHintsForDemo = useCallback(() => {
    clearAllHintStorageForDemo();
    kbDismissedLatchRef.current = false;
    setKbFooterVisible(false);
    setAriaAnnouncements([]);
    bloomAnnouncedRef.current = false;
  }, []);

  return {
    startHereChipInactivityPulse: pulse,
    activeHint: queue.active,
    keyboardShortcutFooterVisible: kbFooterVisible,
    ariaAnnouncements,
    dismissHint: queue.dismiss,
    consumeHintThroughAction: queue.consumeThroughAction,
    dismissKeyboardShortcutFooter,
    resetAllHintsForDemo,
  };
}
