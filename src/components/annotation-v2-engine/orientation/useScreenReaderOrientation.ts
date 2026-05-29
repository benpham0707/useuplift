/**
 * useScreenReaderOrientation — parallel orientation path for
 * screen-reader users (Phase 6 §9, §2.10).
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md §2.10 (accessibility rules:
 *     every visual cue has a screen-reader equivalent, debounced
 *     announcements, no chatter).
 *   - docs/ux_phases/phase_6_orientation.md §9 (specific announcement
 *     messages and sequencing).
 *   - docs/ux_phases/phase_5_first_reveal.md §2.10 (reveal-end live
 *     region the orientation layer feeds into).
 *
 * Sequence produced:
 *   1. At `bloomInteractive` flip → "Analysis complete. {N}
 *      annotations ready for review. Use Tab to navigate."
 *   2. On every `autoSelectedSentenceId` identity change (non-null) →
 *      "Auto-selected strongest sentence in paragraph {P}." If the
 *      paragraph can't be inferred, we fall back to the shorter
 *      "Auto-selected strongest sentence." string.
 *   3. On every `hintShown` identity change (non-null) → hint headline
 *      + body.
 *
 * Debounce:
 *   - Minimum 500ms between consecutive announcements (§9 "so SR doesn't
 *     stack them"). Announcements that arrive inside the quiet window
 *     are queued and emitted sequentially once the window expires. The
 *     queue is de-duplicated by content string — identical consecutive
 *     announcements collapse to one.
 *
 * Output contract:
 *   - Returns `announcements: string[]`, a live queue. The consumer
 *     (the host page) renders this into its own `aria-live="polite"`
 *     region. We don't own the DOM region itself because the panel
 *     already owns one (PanelShell §2.11); duplicating would cause SR
 *     chatter.
 *   - Consumers should render the most-recent N items (or only the
 *     tail) inside the aria-live region. Our `announcements` is an
 *     append-only list so consumers can drive their own render policy
 *     (e.g. "only render the last one", or "clear after 3s").
 *
 * Reduced motion: per §9 rule, SAME announcements fire; timing is
 * unchanged. Motion preferences affect visual motion, not narration.
 */

import { useEffect, useRef, useState } from 'react';

import type { HintDef } from './hintsRegistry';

export interface UseScreenReaderOrientationArgs {
  readonly bloomInteractive: boolean;
  readonly autoSelectedSentenceId: string | null;
  readonly hintShown: HintDef | null;
  readonly reducedMotion: boolean;
  /**
   * Total annotation count. Included in the reveal-end announcement.
   * Undefined = omit the count from the announcement (fallback string).
   */
  readonly annotationCount?: number;
  /**
   * Optional paragraph lookup for the auto-selected sentence. If
   * supplied, allows the richer "paragraph N" phrasing. Return `null`
   * when unknown — we'll degrade gracefully.
   */
  readonly paragraphOfSentence?: (sentenceId: string) => number | null;
}

export interface UseScreenReaderOrientationResult {
  readonly announcements: readonly string[];
}

const DEBOUNCE_MS = 500;

const bloomMessage = (annotationCount: number | undefined): string => {
  if (typeof annotationCount === 'number' && annotationCount > 0) {
    const noun = annotationCount === 1 ? 'annotation' : 'annotations';
    return `Analysis complete. ${annotationCount} ${noun} ready for review. Use Tab to navigate.`;
  }
  return 'Analysis complete. Annotations ready for review. Use Tab to navigate.';
};

const autoSelectMessage = (paragraph: number | null): string => {
  if (paragraph !== null && paragraph > 0) {
    return `Auto-selected strongest sentence in paragraph ${paragraph}.`;
  }
  return 'Auto-selected strongest sentence.';
};

const hintMessage = (hint: HintDef): string =>
  `${hint.headline} ${hint.body}`;

export function useScreenReaderOrientation(
  args: UseScreenReaderOrientationArgs,
): UseScreenReaderOrientationResult {
  const {
    bloomInteractive,
    autoSelectedSentenceId,
    hintShown,
    annotationCount,
    paragraphOfSentence,
  } = args;

  // Emitted announcements (visible to consumers).
  const [announcements, setAnnouncements] = useState<string[]>([]);
  // Pending queue (not yet emitted) — flushed through the debounce.
  const pendingRef = useRef<string[]>([]);
  // Timestamp of the last emission.
  const lastEmitTsRef = useRef<number>(0);
  // Latest emitted content (for collapse-dedup).
  const lastEmittedRef = useRef<string | null>(null);
  // Active timer, if any.
  const timerRef = useRef<number | null>(null);
  // Latch for one-shot events.
  const bloomAnnouncedRef = useRef(false);
  const lastAutoSelectIdRef = useRef<string | null>(null);
  const lastHintIdRef = useRef<string | null>(null);

  const enqueue = (message: string): void => {
    // Don't queue identical consecutive content.
    const queue = pendingRef.current;
    const tail = queue.length > 0 ? queue[queue.length - 1] : lastEmittedRef.current;
    if (tail === message) return;
    queue.push(message);
    schedule();
  };

  const schedule = (): void => {
    // If we already have a timer armed, let it drive the flush.
    if (timerRef.current !== null) return;

    const flush = (): void => {
      timerRef.current = null;
      const next = pendingRef.current.shift();
      if (next === undefined) return;
      // Collapse if identical to last emitted.
      if (next !== lastEmittedRef.current) {
        lastEmittedRef.current = next;
        lastEmitTsRef.current = Date.now();
        setAnnouncements((prev) => [...prev, next]);
      }
      // If more pending, schedule the next flush after debounce.
      if (pendingRef.current.length > 0) {
        timerRef.current = window.setTimeout(flush, DEBOUNCE_MS);
      }
    };

    const now = Date.now();
    const elapsed = now - lastEmitTsRef.current;
    const wait = Math.max(0, DEBOUNCE_MS - elapsed);
    timerRef.current = window.setTimeout(flush, wait);
  };

  // Bloom-end — one-shot.
  useEffect(() => {
    if (!bloomInteractive || bloomAnnouncedRef.current) return;
    bloomAnnouncedRef.current = true;
    enqueue(bloomMessage(annotationCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloomInteractive, annotationCount]);

  // Auto-select — fires on every identity change.
  useEffect(() => {
    if (autoSelectedSentenceId === null) {
      lastAutoSelectIdRef.current = null;
      return;
    }
    if (lastAutoSelectIdRef.current === autoSelectedSentenceId) return;
    lastAutoSelectIdRef.current = autoSelectedSentenceId;
    const paragraph = paragraphOfSentence
      ? paragraphOfSentence(autoSelectedSentenceId)
      : null;
    enqueue(autoSelectMessage(paragraph));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectedSentenceId, paragraphOfSentence]);

  // Hint shown — fires on every hint identity change.
  useEffect(() => {
    if (!hintShown) {
      lastHintIdRef.current = null;
      return;
    }
    if (lastHintIdRef.current === hintShown.id) return;
    lastHintIdRef.current = hintShown.id;
    enqueue(hintMessage(hintShown));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintShown]);

  // Unmount cleanup.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { announcements };
}
