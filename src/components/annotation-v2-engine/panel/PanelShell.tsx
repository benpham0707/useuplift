/**
 * PanelShell — the 40%-width glass container that holds all three
 * panel modes (overview / insight / list).
 *
 * Responsibilities:
 *   - 40% right column geometry on desktop (≥1024px). Mobile adaption
 *     is Workstream M; this shell assumes desktop viewport.
 *   - Slide-in from right on `visible: false → true` (Phase 5 §2.1
 *     step 2 — 250ms ease-out-expo).
 *   - Fully hidden (translateX 100%) when `visible=false` — used
 *     during Phase 4 loading.
 *   - 180ms content crossfade between modes and between sentences/tabs
 *     inside insight mode (Phase 7 §2.2, Phase 11 §3). Uses motion/
 *     react `AnimatePresence mode="wait"` keyed on
 *     `panelModeTransitionKey(mode)`.
 *   - ESC key closes insight/list to overview (Phase 7 §2.6).
 *   - Live region announces mode + meta-line changes for SR users.
 *   - Accepts Round-2 slots (insightSlot / profileSlot / listSlot /
 *     progressBarSlot / breadcrumbSlot) that F, H, I populate.
 *
 * Authority:
 *   - docs/ux_phases/phase_5_first_reveal.md §2.1 / §2.9
 *   - docs/ux_phases/phase_7_click_panel_open.md §2, §2.2, §2.6
 *   - docs/ux_phases/phase_8_reading_insight.md §2.9, §3.1, §2.11
 *   - docs/ux_phases/phase_11_list_map.md §3, §5
 */

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
  DURATION,
  EASING,
  TIER_META,
  TYPOGRAPHY,
  Z_LAYER,
} from '../tokens';
import type { EssayProfile } from '../types/profile';
import type { InsightTabId, PanelMode } from './PanelModes';
import { panelModeTransitionKey } from './PanelModes';
import { PanelHeader } from './PanelHeader';
import { PanelTabs } from './PanelTabs';
import { OverviewCard } from './OverviewCard';

export interface PanelShellProps {
  readonly mode: PanelMode;
  readonly selectedSentenceId: string | null;
  readonly profile: EssayProfile;
  /**
   * Phase 4 — panel is hidden (translated fully off-screen) during
   * loading, slides in at Phase 5 reveal. Flipping `false → true`
   * triggers the 250ms ease-out-expo slide.
   */
  readonly visible: boolean;
  readonly reducedMotion: boolean;
  /** Phase 6 gate source for Profile tab (see PanelTabs). */
  readonly insightsReadCount: number;

  readonly onTabChange?: (tab: InsightTabId) => void;
  readonly onModeChange?: (mode: PanelMode) => void;
  /**
   * Sentence-nav primitive. PanelShell doesn't route overview's
   * "Start here" by itself — the host wires this so selecting a
   * sentence flows through the same path as an editor click.
   */
  readonly onSelectSentence?: (sentenceId: string) => void;

  // --- Round-2 slots ---
  /** Workstream F — renders the insight card body inside insight mode. */
  readonly insightSlot?: ReactNode;
  /** Workstream F — renders the Profile tab body inside insight mode. */
  readonly profileSlot?: ReactNode;
  /** Workstream I — renders the list body inside list mode. */
  readonly listSlot?: ReactNode;
  /** Workstream H — 3px tier-gradient progress bar in the header. */
  readonly progressBarSlot?: ReactNode;
  /** Workstream F — cross-ref NavStack breadcrumb, left of meta line. */
  readonly breadcrumbSlot?: ReactNode;
}

// ---------------------------------------------------------------------------
// Live-region announcements — Phase 8 §2.11 a11y.
// ---------------------------------------------------------------------------

function describeModeForLiveRegion(
  mode: PanelMode,
  profile: EssayProfile,
): string {
  switch (mode.kind) {
    case 'overview':
      return 'Viewing essay overview.';
    case 'insight': {
      const sentence = profile.sentences.find(
        (s) => s.id === mode.sentenceId,
      );
      if (!sentence) return 'Viewing insight.';
      const tierLabel = TIER_META[sentence.tier].label;
      return `Viewing insight for paragraph ${sentence.paragraphIndex + 1}, sentence ${sentence.indexWithinParagraph + 1}, tier ${tierLabel}. ${mode.tab === 'profile' ? 'Profile tab.' : 'Insights tab.'}`;
    }
    case 'list': {
      const chips: string[] = [];
      if (mode.filter.critical) chips.push('critical only');
      if (mode.filter.unreviewed) chips.push('unreviewed');
      if (mode.filter.strengths) chips.push('strengths');
      return chips.length === 0
        ? 'Viewing all annotations.'
        : `Viewing all annotations filtered by ${chips.join(', ')}.`;
    }
    case 'paragraph':
      return `Viewing paragraph ${mode.paragraphIndex + 1}.`;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PanelShell({
  mode,
  selectedSentenceId,
  profile,
  visible,
  reducedMotion,
  insightsReadCount,
  onTabChange,
  onModeChange,
  onSelectSentence,
  insightSlot,
  profileSlot,
  listSlot,
  progressBarSlot,
  breadcrumbSlot,
}: PanelShellProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');

  // Phase 8 §2.11 — mode changes announce to the live region.
  // Initial empty state is fine; we only announce AFTER the first
  // real mode change (to avoid a "viewing overview" shout on mount).
  const isInitialRef = useRef(true);
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    setLiveMessage(describeModeForLiveRegion(mode, profile));
  }, [mode, profile]);

  // Phase 7 §2.6 — ESC closes insight/list to overview.
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && mode.kind !== 'overview') {
      e.preventDefault();
      onModeChange?.({ kind: 'overview' });
    }
  };

  const transitionKey = panelModeTransitionKey(mode);

  // Phase 7 §2.2 — crossfade duration/easing; reduced-motion collapses
  // to the UX_PLAN §16 220ms linear crossfade.
  const crossfade = useMemo(
    () =>
      reducedMotion
        ? {
            duration: DURATION.reducedMotionCrossfade / 1000,
            ease: 'linear' as const,
          }
        : {
            duration: DURATION.contentCrossfade / 1000,
            ease: EASING.contentCrossfade,
          },
    [reducedMotion],
  );

  // Phase 5 §2.1 — slide-in / slide-out from the right edge. When
  // reduced-motion matches, the panel swaps instantly.
  const slideVariants = useMemo(
    () => ({
      hidden: {
        x: reducedMotion ? 0 : '100%',
        opacity: reducedMotion ? 0 : 1,
        pointerEvents: 'none' as const,
      },
      visible: {
        x: 0,
        opacity: 1,
        pointerEvents: 'auto' as const,
      },
    }),
    [reducedMotion],
  );

  const slideTransition = reducedMotion
    ? { duration: 0 }
    : {
        duration: DURATION.panelSlide / 1000,
        ease: EASING.panelSlide,
      };

  return (
    <motion.aside
      ref={panelRef as React.RefObject<HTMLElement>}
      aria-label="Essay analysis panel"
      aria-hidden={!visible}
      role="complementary"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      variants={slideVariants}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      transition={slideTransition}
      // Phase 5 §2.9 + UX_PLAN §14 — 40% right column, glass panel.
      // Width is a percentage of the editor shell's container, not the
      // viewport, so integration with the editor column (60%) can land
      // with no further resizing.
      className="glass-panel relative flex h-full w-[40%] min-w-[360px] flex-col overflow-hidden"
      style={{
        // Phase 8 §3.1 — prose max-width is enforced inside each mode's
        // body; the shell just holds the glass surface + borders.
        zIndex: Z_LAYER.panel,
        fontFamily: TYPOGRAPHY.families.sans,
        // Glass-panel class from workshop.css provides bg + blur; we
        // add a subtle inner border to separate from the editor column.
        borderLeft: '1px solid hsl(220 15% 90% / 0.6)',
      }}
    >
      {/* Phase 8 §2.11 — live region for mode-change announcements.
          aria-live="polite" defers to the user's current task; changes
          announce after ~200ms idle per ATOK speech queueing. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        {liveMessage}
      </div>

      <PanelHeader
        mode={mode}
        profile={profile}
        reducedMotion={reducedMotion}
        breadcrumbSlot={breadcrumbSlot}
        progressBarSlot={progressBarSlot}
        onCloseToOverview={
          mode.kind === 'overview'
            ? undefined
            : () => onModeChange?.({ kind: 'overview' })
        }
      />

      {mode.kind === 'insight' ? (
        <PanelTabs
          activeTab={mode.tab}
          currentTier={
            profile.sentences.find((s) => s.id === mode.sentenceId)?.tier ??
            'FUNCTIONAL'
          }
          insightsReadCount={insightsReadCount}
          reducedMotion={reducedMotion}
          onChange={(tab) => onTabChange?.(tab)}
        />
      ) : null}

      {/* Phase 7 §2.2 / Phase 11 §3 — 180ms content crossfade between
          modes. AnimatePresence mode="wait" guarantees the outgoing
          body fades out before the incoming body fades in, preserving
          the "one panel identity" illusion. */}
      <div className="relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={transitionKey}
            id={
              mode.kind === 'insight'
                ? `panel-tabpanel-${mode.tab}`
                : undefined
            }
            role={mode.kind === 'insight' ? 'tabpanel' : undefined}
            aria-labelledby={
              mode.kind === 'insight' ? `panel-tab-${mode.tab}` : undefined
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossfade}
            className="h-full"
          >
            {renderBody({
              mode,
              profile,
              reducedMotion,
              insightSlot,
              profileSlot,
              listSlot,
              onModeChange,
              onSelectSentence,
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

// ---------------------------------------------------------------------------
// Body resolution — picks the right content per mode+tab.
// ---------------------------------------------------------------------------

interface RenderBodyArgs {
  readonly mode: PanelMode;
  readonly profile: EssayProfile;
  readonly reducedMotion: boolean;
  readonly insightSlot?: ReactNode;
  readonly profileSlot?: ReactNode;
  readonly listSlot?: ReactNode;
  readonly onModeChange?: (mode: PanelMode) => void;
  readonly onSelectSentence?: (sentenceId: string) => void;
}

function renderBody(args: RenderBodyArgs): ReactNode {
  const {
    mode,
    profile,
    reducedMotion,
    insightSlot,
    profileSlot,
    listSlot,
    onModeChange,
    onSelectSentence,
  } = args;

  if (mode.kind === 'overview') {
    return (
      <OverviewCard
        profile={profile}
        reducedMotion={reducedMotion}
        onStartHere={(sentenceId) => {
          onSelectSentence?.(sentenceId);
          onModeChange?.({ kind: 'insight', sentenceId, tab: 'insights' });
        }}
        onOpenList={() =>
          onModeChange?.({
            kind: 'list',
            filter: { critical: false, unreviewed: false, strengths: false },
            sort: 'priority',
          })
        }
      />
    );
  }

  if (mode.kind === 'list') {
    // Workstream I owns the list body; shell provides a minimal
    // fallback so the demo renders legibly without I.
    return listSlot ?? <ListSlotFallback />;
  }

  // Insight mode — render the tab's slot, or a fallback.
  if (mode.tab === 'profile') {
    return profileSlot ?? <SlotFallback label="Profile" />;
  }
  return insightSlot ?? <SlotFallback label="Insight" />;
}

// ---------------------------------------------------------------------------
// Fallbacks — visible placeholders for Round-1. Round-2 replaces.
// ---------------------------------------------------------------------------

function SlotFallback({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: `${TYPOGRAPHY.panelPaddingTop} ${TYPOGRAPHY.panelPaddingX}`,
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.meta,
        color: 'hsl(220 10% 55%)',
        letterSpacing: TYPOGRAPHY.tracking.meta,
      }}
    >
      {label} slot — wired by downstream workstream.
    </div>
  );
}

function ListSlotFallback() {
  return <SlotFallback label="List" />;
}
