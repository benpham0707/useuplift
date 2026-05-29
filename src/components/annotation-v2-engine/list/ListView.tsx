/**
 * ListView — the planning-mode body that fills PanelShell.listSlot.
 *
 * Layout top-to-bottom per Phase 11 §3.1 panel diagram:
 *   1. Header strip: "All annotations" + chip summary + sort toggle +
 *      close (routes back to overview).
 *   2. Tier histogram.
 *   3. L3.75 prose callout.
 *   4. Filter chip row.
 *   5. Grouped rows with sticky paragraph headers (paragraph default).
 *   6. Footer CTA — single pinned target.
 *
 * Scroll: the rows scroll within the list body; the header and CTA
 * sit outside the scroll area. Sticky paragraph headers (CSS
 * `position: sticky`) ride along inside the rows scroll.
 *
 * The mode-transition key for the panel never changes while the
 * student operates in list mode (Phase 11 §3 notes this explicitly)
 * — filter and sort changes animate bar widths and fade chip states
 * locally; the whole panel does NOT crossfade.
 *
 * Authority:
 *   - docs/ux_phases/phase_11_list_map.md §3, §4, §5.
 *   - docs/ux_phases/phase_10_navigation.md §3 (progress bar inherits
 *     into this surface — Workstream H provides the slot; here we
 *     just display it in the header if the consumer passes it in).
 */

import { type ReactNode, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { TYPOGRAPHY } from '../tokens';
import type { EssayProfile } from '../types/profile';
import type {
  FilterState,
  ListGrouping,
  ListSorting,
  ViewedState,
} from '../types/navigation';
import { FilterChips } from './FilterChips';
import { ListRow } from './ListRow';
import { ProseCallout } from './ProseCallout';
import { TierHistogram } from './TierHistogram';
import { useListFilter } from './useListFilter';
import { useTierCounts } from './useTierCounts';

export interface ListViewProps {
  readonly profile: EssayProfile;
  readonly filter: FilterState;
  readonly sort: ListSorting;
  readonly grouping: ListGrouping;
  readonly viewed: ViewedState;
  readonly reducedMotion: boolean;

  readonly onFilterChange: (next: FilterState) => void;
  readonly onSortChange: (next: ListSorting) => void;
  readonly onGroupingChange?: (next: ListGrouping) => void;

  /**
   * Row click — jump to the sentence AND open its insight card.
   * Owned by the host (PanelShell parent) so list-mode can hand off
   * cleanly into Phase 7 insight mode.
   */
  readonly onSelectSentence: (sentenceId: string) => void;

  /**
   * Optional: list-row hover broadcasts the sentence ID so the host
   * can render a secondary tier-colored ring on the corresponding
   * sentence in the editor column (§2.4), OR brighten the matching
   * minimap block (demonstrated in the demo).
   */
  readonly onHoverSentence?: (sentenceId: string | null) => void;

  /**
   * Optional progress slot — Workstream H provides the 3px tier-
   * gradient bar from Phase 10 §3. Rendered just below the header
   * strip when provided.
   */
  readonly progressSlot?: ReactNode;
}

export function ListView({
  profile,
  filter,
  sort,
  grouping,
  viewed,
  reducedMotion,
  onFilterChange,
  onSortChange,
  onGroupingChange,
  onSelectSentence,
  onHoverSentence,
  progressSlot,
}: ListViewProps) {
  // Derived data ----------------------------------------------------------
  const filteredCounts = useTierCounts(profile, { filter });
  const histogramCounts = useTierCounts(profile); // unfiltered — magnitude-first
  const listResult = useListFilter({
    profile,
    filter,
    sort,
    viewed,
    grouping,
  });

  // Chip count signals ----------------------------------------------------
  //   critical: total CRITICAL + NEEDS_WORK annotated sentences.
  //   unreviewed: total annotated sentences not in viewed-state.
  //   strengths: total STRONG+ annotated sentences with type === 'strength'.
  const chipCounts = useMemo(() => {
    let critical = 0;
    let unreviewed = 0;
    let strengths = 0;
    const sentenceById = new Map(profile.sentences.map((s) => [s.id, s]));
    for (const a of profile.annotations) {
      const s = sentenceById.get(a.sentenceId);
      if (!s) continue;
      if (s.tier === 'CRITICAL' || s.tier === 'NEEDS_WORK') critical++;
      if (!viewed.has(s.id)) unreviewed++;
      if (
        a.type === 'strength' &&
        (s.tier === 'STRONG' ||
          s.tier === 'EXCEPTIONAL' ||
          s.tier === 'MASTERFUL')
      ) {
        strengths++;
      }
    }
    return { critical, unreviewed, strengths };
  }, [profile, viewed]);

  // CTA target ------------------------------------------------------------
  //
  // Phase 11 §2.8 — "single target":
  //   1) first unreviewed CRITICAL
  //   2) otherwise first unreviewed NEEDS_WORK
  //   3) otherwise first unreviewed STRONG+
  //   4) otherwise Phase-10 end-of-review form (highest-priority
  //      overall, even if reviewed).
  const cta = useMemo(() => computeCta(profile, viewed), [profile, viewed]);

  const totalAnnotations = profile.annotations.length;
  const chipSummary = summarizeActiveFilters(filter);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TYPOGRAPHY.families.sans,
      }}
    >
      {/* --- 1. Header strip ------------------------------------------------- */}
      <div
        style={{
          padding: `16px ${TYPOGRAPHY.panelPaddingX} 8px`,
          borderBottom: '1px solid hsl(220 15% 92%)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'hsl(220 15% 20%)',
            }}
          >
            All annotations
          </span>
          <SortToggle
            sort={sort}
            onChange={onSortChange}
            reducedMotion={reducedMotion}
          />
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'hsl(220 10% 50%)',
            letterSpacing: '0.02em',
          }}
        >
          {listResult.totalInView} of {totalAnnotations}
          {chipSummary ? ` · ${chipSummary}` : ''}
        </div>
        {progressSlot ? (
          <div style={{ marginTop: 10 }}>{progressSlot}</div>
        ) : null}
      </div>

      {/* --- 2. Tier histogram ---------------------------------------------- */}
      <TierHistogram
        counts={histogramCounts}
        totalSentences={profile.sentences.length}
        reducedMotion={reducedMotion}
      />

      {/* --- 3. Prose callout ----------------------------------------------- */}
      <ProseCallout holisticSynthesis={profile.holisticSynthesis} />

      {/* --- 4. Filter chips ------------------------------------------------ */}
      <FilterChips
        filter={filter}
        counts={chipCounts}
        onFilterChange={onFilterChange}
      />

      {/* Grouping segmented control (§2.3 alternate groupings) */}
      {onGroupingChange ? (
        <div
          style={{
            padding: `0 ${TYPOGRAPHY.panelPaddingX}`,
            marginBottom: 10,
          }}
        >
          <GroupingSegmented
            grouping={grouping}
            onChange={onGroupingChange}
          />
        </div>
      ) : null}

      {/* --- 5. Grouped rows (scrollable) ----------------------------------- */}
      <ol
        aria-label="Annotation list"
        style={{
          flex: 1,
          overflowY: 'auto',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {listResult.groups.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          listResult.groups.map((group) => (
            <li key={group.key} style={{ padding: 0 }}>
              <GroupHeader label={group.label} count={group.rows.length} />
              <ul
                role="list"
                style={{ listStyle: 'none', margin: 0, padding: 0 }}
              >
                {group.rows.map((row) => (
                  <ListRow
                    key={row.annotationId}
                    sentenceId={row.sentenceId}
                    paragraphIndex={row.paragraphIndex}
                    indexWithinParagraph={row.indexWithinParagraph}
                    tier={row.tier}
                    annotationType={row.annotationType}
                    critique={row.critique}
                    viewed={row.viewed}
                    hasRewrite={row.hasRewrite}
                    onClick={onSelectSentence}
                    onHover={onHoverSentence}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </ul>
            </li>
          ))
        )}
      </ol>

      {/* --- 6. Sticky CTA footer ------------------------------------------- */}
      {cta ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cta.sentenceId}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.14,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              padding: `12px ${TYPOGRAPHY.panelPaddingX}`,
              borderTop: '1px solid hsl(220 15% 92%)',
              background: 'rgba(255,255,255,0.95)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              role="link"
              onClick={() => onSelectSentence(cta.sentenceId)}
              aria-label={`${cta.text} Target: paragraph ${cta.paragraphIndex + 1}, sentence ${cta.indexWithinParagraph + 1}.`}
              style={{
                appearance: 'none',
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: 'hsl(220 25% 20%)',
                textAlign: 'left',
                width: '100%',
                fontFamily: TYPOGRAPHY.families.sans,
              }}
            >
              {cta.text} <span aria-hidden="true">→</span>
            </button>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group header — sticky within the rows scroll.
// ---------------------------------------------------------------------------

function GroupHeader({
  label,
  count,
}: {
  readonly label: string;
  readonly count: number;
}) {
  return (
    <div
      role="heading"
      aria-level={3}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `8px ${TYPOGRAPHY.panelPaddingX}`,
        // Sticky headers need their own bg so scrolling rows don't
        // bleed through. Match the panel's glass tone so the header
        // feels like part of the surface, not a chrome strip.
        background: 'rgba(248, 249, 251, 0.95)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'hsl(220 15% 30%)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        borderBottom: '1px solid hsl(220 15% 94%)',
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontWeight: 500,
          color: 'hsl(220 10% 55%)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort toggle — tiny segmented control: Priority ↔ Doc order.
// ---------------------------------------------------------------------------

function SortToggle({
  sort,
  onChange,
  reducedMotion,
}: {
  readonly sort: ListSorting;
  readonly onChange: (next: ListSorting) => void;
  readonly reducedMotion: boolean;
}) {
  const options: readonly { value: ListSorting; label: string }[] = [
    { value: 'priority', label: 'Priority' },
    { value: 'documentOrder', label: 'Doc order' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Sort order"
      style={{
        display: 'inline-flex',
        borderRadius: 6,
        border: '1px solid hsl(220 15% 88%)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const active = sort === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: active ? 600 : 500,
              color: active ? 'hsl(220 20% 20%)' : 'hsl(220 10% 45%)',
              background: active ? 'hsl(220 15% 93%)' : 'white',
              border: 'none',
              cursor: 'pointer',
              transition: reducedMotion
                ? undefined
                : 'background-color 120ms linear',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grouping segmented control — Paragraph / Tier / Type.
// ---------------------------------------------------------------------------

function GroupingSegmented({
  grouping,
  onChange,
}: {
  readonly grouping: ListGrouping;
  readonly onChange: (next: ListGrouping) => void;
}) {
  const options: readonly { value: ListGrouping; label: string }[] = [
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'tier', label: 'Tier' },
    { value: 'type', label: 'Type' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Group rows"
      style={{
        display: 'inline-flex',
        borderRadius: 6,
        border: '1px solid hsl(220 15% 88%)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const active = grouping === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: active ? 600 : 500,
              color: active ? 'hsl(220 20% 20%)' : 'hsl(220 10% 45%)',
              background: active ? 'hsl(220 15% 93%)' : 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — Phase 11 §4.7.
// ---------------------------------------------------------------------------

function EmptyState({ filter }: { readonly filter: FilterState }) {
  const anyFilter = filter.critical || filter.unreviewed || filter.strengths;
  const copy = anyFilter
    ? 'No feedback matches these filters. Try clearing one.'
    : 'No feedback on this essay yet.';
  return (
    <li
      style={{
        padding: '32px 24px',
        color: 'hsl(220 10% 55%)',
        fontSize: '13px',
        textAlign: 'center',
      }}
    >
      {copy}
    </li>
  );
}

// ---------------------------------------------------------------------------
// CTA computation — Phase 11 §2.8 + §4.8.
// ---------------------------------------------------------------------------

interface CtaResult {
  readonly sentenceId: string;
  readonly paragraphIndex: number;
  readonly indexWithinParagraph: number;
  readonly text: string;
}

function computeCta(
  profile: EssayProfile,
  viewed: ViewedState,
): CtaResult | null {
  const sentenceById = new Map(profile.sentences.map((s) => [s.id, s]));
  const rowsFor = (tiers: readonly string[], onlyUnreviewed: boolean) =>
    profile.annotations
      .map((a) => {
        const s = sentenceById.get(a.sentenceId);
        if (!s) return null;
        return { a, s };
      })
      .filter(
        (x): x is { a: typeof profile.annotations[number]; s: NonNullable<ReturnType<typeof sentenceById.get>> } =>
          x != null,
      )
      .filter(({ s }) => tiers.includes(s.tier))
      .filter(({ s }) => (onlyUnreviewed ? !viewed.has(s.id) : true))
      .sort((x, y) => {
        if (x.a.priority !== y.a.priority) return x.a.priority - y.a.priority;
        if (x.s.paragraphIndex !== y.s.paragraphIndex) {
          return x.s.paragraphIndex - y.s.paragraphIndex;
        }
        return x.s.indexWithinParagraph - y.s.indexWithinParagraph;
      });

  const pick = (
    tiers: readonly string[],
    onlyUnreviewed: boolean,
    template: (meta: string) => string,
  ): CtaResult | null => {
    const hits = rowsFor(tiers, onlyUnreviewed);
    const first = hits[0];
    if (!first) return null;
    const meta = `\u00b6${first.s.paragraphIndex + 1}s${
      first.s.indexWithinParagraph + 1
    }`;
    return {
      sentenceId: first.s.id,
      paragraphIndex: first.s.paragraphIndex,
      indexWithinParagraph: first.s.indexWithinParagraph,
      text: template(meta),
    };
  };

  // Order per §4.8.
  return (
    pick(
      ['CRITICAL'],
      true,
      (m) => `Start with: ${m} — your highest-priority improvement`,
    ) ??
    pick(['NEEDS_WORK'], true, (m) => `Start with: ${m} — your next priority`) ??
    pick(
      ['STRONG', 'EXCEPTIONAL', 'MASTERFUL'],
      true,
      (m) => `Next up: ${m} — worth a read`,
    ) ??
    pick(
      ['CRITICAL', 'NEEDS_WORK', 'STRONG', 'EXCEPTIONAL', 'MASTERFUL'],
      false,
      (m) => `Most important: ${m}. Start there`,
    )
  );
}

// ---------------------------------------------------------------------------
// Active-filter summary for header sub-line.
// ---------------------------------------------------------------------------

function summarizeActiveFilters(filter: FilterState): string {
  const parts: string[] = [];
  if (filter.critical) parts.push('Critical only');
  if (filter.unreviewed) parts.push('Unreviewed');
  if (filter.strengths) parts.push('Strengths');
  return parts.join(' · ');
}

