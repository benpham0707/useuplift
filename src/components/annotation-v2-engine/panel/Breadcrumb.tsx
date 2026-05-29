/**
 * Breadcrumb — Phase 8 §2.9 jump-back crumb renderer.
 *
 * Renders 0–2 ancestor crumbs (the stack's non-current entries) into
 * PanelShell's `breadcrumbSlot`. The current sentence is NOT shown
 * here — it already lives in the meta line right-of-breadcrumb, so
 * duplicating it would double the visual weight and consume header
 * width that Phase 8 §2.9 flagged as scarce.
 *
 * Each crumb reads as `← ¶N` (paragraph-only ancestor) or `← ¶N · sM`
 * when the source was a specific sentence. Crumbs are clickable; a
 * click pops the stack back to (and through) that entry via the
 * `onBack` prop, which the host consumer wires to NavStack.pop() in a
 * loop until the target entry is current.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.9 (breadcrumb
 *     rendering rule, 3-deep max, tier-colored dot, max 12ch per
 *     crumb with truncation).
 *   - docs/ux_phases/phase_8_reading_insight.md §3.1 (breadcrumb
 *     typography — size.breadcrumb, tracking.meta-family).
 */

import { motion } from 'motion/react';

import { DURATION, EASING, TIER_CSS_VAR, TYPOGRAPHY } from '../tokens';
import type { EssayProfile } from '../types/profile';
import type { NavStackEntry } from './useNavStack';

export interface BreadcrumbProps {
  /** Full stack from useNavStack. Breadcrumb renders `stack.slice(0,-1)`. */
  readonly stack: readonly NavStackEntry[];
  readonly profile: EssayProfile;
  /**
   * Fired when a crumb is clicked. The host is responsible for popping
   * the stack until `entry` is the current sentence — this component
   * only announces intent.
   */
  readonly onBack: (entry: NavStackEntry) => void;
  readonly reducedMotion: boolean;
}

interface CrumbView {
  readonly entry: NavStackEntry;
  readonly paragraphNumber: number;
  readonly sentenceNumber: number;
  readonly tierVar: string;
  readonly label: string;
}

function resolveCrumb(entry: NavStackEntry, profile: EssayProfile): CrumbView | null {
  const sentence = profile.sentences.find((s) => s.id === entry.sentenceId);
  if (!sentence) return null;
  const p = sentence.paragraphIndex + 1;
  const s = sentence.indexWithinParagraph + 1;
  const tierVar = TIER_CSS_VAR[sentence.tier];
  // Phase 8 §2.9 — ancestor crumbs label as `← ¶N` (paragraph-level
  // shorthand) rather than `← ¶N · sM`; the 3-deep stack cannot afford
  // the width of the full meta per-crumb. The full identity lives in
  // the sentence dot color and the hover tooltip via `title`.
  const label = `\u00B6${p}`;
  return {
    entry,
    paragraphNumber: p,
    sentenceNumber: s,
    tierVar,
    label,
  };
}

export function Breadcrumb({
  stack,
  profile,
  onBack,
  reducedMotion,
}: BreadcrumbProps): JSX.Element | null {
  // Phase 8 §2.9 — ancestors only; slice the latest (current) off.
  const ancestors = stack.slice(0, -1);
  if (ancestors.length === 0) return null;

  const crumbs = ancestors
    .map((entry) => resolveCrumb(entry, profile))
    .filter((c): c is CrumbView => c !== null);
  if (crumbs.length === 0) return null;

  // Phase 8 §2.9 — when depth exceeds 2 ancestors the oldest collapses
  // with an ellipsis affordance. Our stack hook bounds at 3 so this
  // component will receive at most 2 ancestors; we keep the ellipsis
  // branch as defensive rendering in case the hook contract changes.
  const overflow = ancestors.length - crumbs.length;

  return (
    <motion.div
      aria-label="Navigation breadcrumb"
      initial={reducedMotion ? false : { opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : {
              duration: DURATION.contentCrossfade / 1000,
              ease: EASING.contentCrossfade,
            }
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.breadcrumb,
        fontWeight: TYPOGRAPHY.weight.medium,
        lineHeight: TYPOGRAPHY.lineHeight.sansTight,
        letterSpacing: TYPOGRAPHY.tracking.meta,
        color: 'hsl(220 10% 45%)',
      }}
    >
      {overflow > 0 ? (
        <span
          title={`${overflow} earlier step${overflow === 1 ? '' : 's'} collapsed`}
          style={{ opacity: 0.6 }}
        >
          …
        </span>
      ) : null}
      {crumbs.map((crumb) => (
        <CrumbButton
          key={`${crumb.entry.sentenceId}-${crumb.entry.timestamp}`}
          crumb={crumb}
          onBack={() => onBack(crumb.entry)}
        />
      ))}
    </motion.div>
  );
}

function CrumbButton({
  crumb,
  onBack,
}: {
  readonly crumb: CrumbView;
  readonly onBack: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      // Phase 8 §2.9 — click pops the stack back to this entry.
      aria-label={`Back to paragraph ${crumb.paragraphNumber}, sentence ${crumb.sentenceNumber}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 'inherit',
        letterSpacing: 'inherit',
        // Phase 8 §2.9 — 12ch max per crumb. The current copy format
        // (`¶N`) is 2–3 chars, so truncation almost never fires.
        maxWidth: '12ch',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Arrow glyph — Phase 8 §2.9 "small left-arrow". */}
      <span aria-hidden="true" style={{ opacity: 0.7 }}>
        {'\u2190'}
      </span>
      {/* Tier dot — target sentence's tier, 6px, matching pill style. */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: 999,
          background: `hsl(var(${crumb.tierVar}))`,
        }}
      />
      <span>{crumb.label}</span>
    </button>
  );
}
