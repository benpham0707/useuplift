/**
 * PanelTabs — the Insights / Profile tab bar inside the insight mode.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.9 / §3.1 (two tabs,
 *     Insights default).
 *   - docs/ux_phases/phase_6_* orientation — Profile tab is GATED until
 *     the student has read ≥2 insights.
 *   - docs/ux_phases/phase_7_click_panel_open.md §2.5 — SAGE
 *     (FUNCTIONAL) exception: when the clicked sentence is
 *     FUNCTIONAL, Profile gets a soft "View in Profile →" CTA even if
 *     the gate hasn't dropped yet (the Insights tab's content is thin
 *     enough that offering Profile is a service, not a sell).
 *
 * Tab indicator is a 2px underline beneath the active tab, colored by
 * the current sentence's tier (reinforces the tier strip at the top of
 * the panel — §2.3). Switching tabs fires the 180ms panel-body
 * crossfade via usePanelMode's AnimatePresence key.
 */

import { type KeyboardEvent, useRef } from 'react';
import { motion } from 'motion/react';

import {
  DURATION,
  EASING,
  TIER_CSS_VAR,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';
import type { InsightTabId } from './PanelModes';

interface PanelTabsProps {
  readonly activeTab: InsightTabId;
  /** Tier of the sentence currently open in the insight mode. */
  readonly currentTier: Tier;
  /**
   * Phase 6 gating source: number of unique insights the student has
   * read. Profile tab unlocks at `>= 2`.
   */
  readonly insightsReadCount: number;
  readonly reducedMotion: boolean;
  readonly onChange: (tab: InsightTabId) => void;
}

// Phase 6 orientation — Profile is gated until 2 insights are read.
const PROFILE_TAB_GATE = 2;

interface TabDef {
  readonly id: InsightTabId;
  readonly label: string;
}

const TABS: readonly TabDef[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'profile', label: 'Profile' },
];

function tierAccent(tier: Tier): string {
  // Phase 8 §3.1 — FUNCTIONAL renders at 70% saturation (visual silence).
  if (tier === 'FUNCTIONAL') {
    return `hsl(var(${TIER_CSS_VAR[tier]}) / 0.70)`;
  }
  return `hsl(var(${TIER_CSS_VAR[tier]}))`;
}

export function PanelTabs({
  activeTab,
  currentTier,
  insightsReadCount,
  reducedMotion,
  onChange,
}: PanelTabsProps) {
  // Phase 6 — the gate is "2 insights read OR tier === FUNCTIONAL".
  // SAGE (FUNCTIONAL) gets Profile as an invite, not a gate (Phase 7
  // §2.5). Everyone else hits the count-based gate first.
  const gateOpen = insightsReadCount >= PROFILE_TAB_GATE;
  const sageInvite = currentTier === 'FUNCTIONAL';
  const profileDisabled = !gateOpen && !sageInvite;

  const tabRefs = useRef<Record<InsightTabId, HTMLButtonElement | null>>({
    insights: null,
    profile: null,
  });

  const indicatorColor = tierAccent(currentTier);

  // Phase 8 §2.9 keyboard model — Tab/Shift+Tab navigate between tabs,
  // Enter/Space activate. ArrowLeft/Right mirror Enter for common tab
  // semantics (aria-tablist convention).
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const order: InsightTabId[] = ['insights', 'profile'];
      const currentIdx = order.indexOf(activeTab);
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      // Skip disabled tabs during arrow navigation.
      for (let step = 1; step <= order.length; step += 1) {
        const nextIdx = (currentIdx + delta * step + order.length) % order.length;
        const candidate = order[nextIdx];
        if (candidate === 'profile' && profileDisabled) continue;
        onChange(candidate);
        tabRefs.current[candidate]?.focus();
        return;
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Insight view"
      className="relative flex items-end gap-1"
      style={{
        paddingLeft: TYPOGRAPHY.panelPaddingX,
        paddingRight: TYPOGRAPHY.panelPaddingX,
        borderBottom: '1px solid hsl(220 15% 90% / 0.6)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.id === 'profile' && profileDisabled;
        // Phase 7 §2.5 — when SAGE and gate still closed, show a soft
        // CTA-style hint inline on the Profile tab so the student can
        // discover the Profile content on this sentence.
        const showSageHint = tab.id === 'profile' && sageInvite && !gateOpen;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            role="tab"
            type="button"
            id={`panel-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-tabpanel-${tab.id}`}
            aria-disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled && !showSageHint}
            onClick={() => {
              if (isDisabled && !showSageHint) return;
              onChange(tab.id);
            }}
            onKeyDown={onTabKeyDown}
            // Phase 8 §3.1 — tab label typography.
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.panelHeader,
              fontWeight: isActive
                ? TYPOGRAPHY.weight.semibold
                : TYPOGRAPHY.weight.medium,
              color: isDisabled
                ? 'hsl(220 10% 65%)'
                : isActive
                ? 'hsl(220 15% 20%)'
                : 'hsl(220 10% 40%)',
              background: 'transparent',
              border: 'none',
              cursor: isDisabled && !showSageHint ? 'not-allowed' : 'pointer',
              padding: '10px 4px',
              position: 'relative',
              letterSpacing: TYPOGRAPHY.tracking.prose,
            }}
          >
            <span className="flex items-baseline gap-1.5">
              {tab.label}
              {showSageHint ? (
                // Phase 7 §2.5 — inline CTA arrow. Kept subtle (10px
                // chevron) so it reads as an invite, not an instruction.
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: '10px',
                    color: tierAccent('FUNCTIONAL'),
                    letterSpacing: '0.06em',
                  }}
                >
                  View
                  {'\u00A0'}
                  {'\u2192'}
                </span>
              ) : null}
            </span>

            {/* Phase 8 §3.1 — 2px underline indicator, tier-colored. */}
            {isActive ? (
              <motion.span
                aria-hidden="true"
                layoutId="panel-tabs-indicator"
                className="absolute left-0 right-0"
                style={{
                  bottom: -1,
                  height: 2,
                  background: indicatorColor,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        duration: DURATION.contentCrossfade / 1000,
                        ease: EASING.contentCrossfade,
                      }
                }
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
