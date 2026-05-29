/**
 * useListFilter — applies filter + sort + grouping to the profile's
 * annotations and produces renderer-ready `ListRowShape` arrays.
 *
 * Pure, memoized, React-first. No network, no persistence — callers
 * supply the ambient state (filter / sort / viewed / grouping) and
 * receive the derived rows back.
 *
 * Filter semantics (Phase 11 §2.4, AND composition):
 *   - `critical` → only CRITICAL or NEEDS_WORK tier annotations
 *                  (the two tiers that carry the red/amber underline
 *                  per Phase 6 §2.2 — "triage" semantic).
 *   - `unreviewed` → only sentences whose ViewedState record is absent.
 *   - `strengths` → only annotations whose `type === 'strength'` AND
 *                   whose sentence is STRONG/EXCEPTIONAL/MASTERFUL
 *                   (Phase 11 §4.5 chip label + count rule).
 *
 * Sort:
 *   - priority      → lower `Annotation.priority` first (0 = highest
 *                     impact per Phase 8 §2.8), tie-breaking by
 *                     document order.
 *   - documentOrder → paragraph-index then indexWithinParagraph.
 *
 * Grouping:
 *   - paragraph → insertion order by paragraphIndex (group key = number)
 *   - tier      → insertion order severity-first: CRITICAL, NEEDS_WORK,
 *                 STRONG, EXCEPTIONAL, MASTERFUL (FUNCTIONAL excluded
 *                 per Phase 11 §2.3 — sage/no-underline doesn't carry
 *                 an annotation in practice).
 *   - type      → Phase 8 §2.2 order: growth, strength, structural,
 *                 teaching.
 */

import { useMemo } from 'react';

import type { Tier } from '../tokens';
import type {
  AnnotationType,
  EssayProfile,
} from '../types/profile';
import type {
  FilterState,
  ListGrouping,
  ListSorting,
  ViewedState,
} from '../types/navigation';
import {
  buildRow,
  groupByParagraph,
  groupByTier,
  groupByType,
  type ListRowShape,
} from './listFormatting';

// ---------------------------------------------------------------------------
// Filter predicates. Individual predicates (AND-composed by the hook).
// ---------------------------------------------------------------------------

const CRITICAL_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'CRITICAL',
  'NEEDS_WORK',
]);

const STRENGTH_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
]);

// Phase 11 §2.3 — FUNCTIONAL excluded from the default row stream.
// Not a filter; a pre-filter. FUNCTIONAL sentences rarely have
// annotations, but the fixture attaches one teaching annotation to
// a FUNCTIONAL sentence (p4s5) — we still include those when there's
// a real L5 annotation, per Phase 8 §2.2 (teaching annotations can
// sit on otherwise-silent sentences).

/**
 * Tier-severity ordering for the tier grouping mode.
 * Matches Phase 11 §2.3's alternate-grouping choice ("by tier" group
 * headers render CRITICAL first, then NEEDS_WORK, etc.). FUNCTIONAL
 * lands at the bottom if any row happens to carry that tier.
 */
const TIER_SEVERITY_ORDER: readonly Tier[] = [
  'CRITICAL',
  'NEEDS_WORK',
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
  'FUNCTIONAL',
];

/** Phase 8 §2.2 — canonical insight-type ordering. */
const TYPE_ORDER: readonly AnnotationType[] = [
  'growth',
  'strength',
  'structural',
  'teaching',
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseListFilterArgs {
  readonly profile: EssayProfile;
  readonly filter: FilterState;
  readonly sort: ListSorting;
  readonly viewed: ViewedState;
  readonly grouping: ListGrouping;
}

export interface UseListFilterResult {
  /** Flat, sorted, filtered row stream. */
  readonly rows: readonly ListRowShape[];
  /**
   * Same rows, grouped by the active grouping. Key type is a plain
   * `string` in the public shape to keep consumers agnostic of the
   * grouping mode; the value is the underlying tier/type/paragraph.
   */
  readonly groups: readonly {
    readonly key: string;
    readonly label: string;
    readonly rows: readonly ListRowShape[];
  }[];
  /** Total rows visible after filter + grouping. */
  readonly totalInView: number;
  /** Rows eliminated by the filter (pre-grouping). */
  readonly filteredOutCount: number;
}

export function useListFilter(args: UseListFilterArgs): UseListFilterResult {
  const { profile, filter, sort, viewed, grouping } = args;

  return useMemo<UseListFilterResult>(() => {
    // ---- 1. Build the flat row stream from annotations + sentences.
    const sentenceById = new Map(profile.sentences.map((s) => [s.id, s]));
    const allRows: ListRowShape[] = [];
    for (const annotation of profile.annotations) {
      const sentence = sentenceById.get(annotation.sentenceId);
      if (!sentence) continue;
      // Viewed-state is keyed by sentence (Phase 10 §2.6 — a sentence
      // with 3 annotations is viewed only when all 3 have been read).
      const isViewed = viewed.has(sentence.id);
      allRows.push(buildRow({ annotation, sentence, viewed: isViewed }));
    }

    // ---- 2. Apply the three filter predicates (AND composition).
    const passes = (row: ListRowShape): boolean => {
      if (filter.critical && !CRITICAL_TIERS.has(row.tier)) return false;
      if (filter.unreviewed && row.viewed) return false;
      if (filter.strengths) {
        // Strengths chip = annotations of type 'strength' on a
        // STRONG+ sentence. Matches Phase 11 §4.5 chip definition.
        if (row.annotationType !== 'strength') return false;
        if (!STRENGTH_TIERS.has(row.tier)) return false;
      }
      return true;
    };

    const filtered = allRows.filter(passes);
    const filteredOutCount = allRows.length - filtered.length;

    // ---- 3. Sort.
    const sorted = [...filtered];
    if (sort === 'priority') {
      sorted.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.paragraphIndex !== b.paragraphIndex) {
          return a.paragraphIndex - b.paragraphIndex;
        }
        return a.indexWithinParagraph - b.indexWithinParagraph;
      });
    } else {
      // documentOrder
      sorted.sort((a, b) => {
        if (a.paragraphIndex !== b.paragraphIndex) {
          return a.paragraphIndex - b.paragraphIndex;
        }
        return a.indexWithinParagraph - b.indexWithinParagraph;
      });
    }

    // ---- 4. Group.
    const groups: UseListFilterResult['groups'] = (() => {
      if (grouping === 'paragraph') {
        const byParagraph = groupByParagraph(sorted);
        // Paragraph groups render in document order regardless of sort.
        const keys = Array.from(byParagraph.keys()).sort((a, b) => a - b);
        return keys.map((pIdx) => ({
          key: `paragraph-${pIdx}`,
          label: `Paragraph ${pIdx + 1}`,
          rows: byParagraph.get(pIdx) ?? [],
        }));
      }
      if (grouping === 'tier') {
        const byTier = groupByTier(sorted);
        // Tier groups render in severity order per Phase 11 §2.3.
        return TIER_SEVERITY_ORDER.filter((t) => byTier.has(t)).map((t) => ({
          key: `tier-${t}`,
          label: tierGroupLabel(t),
          rows: byTier.get(t) ?? [],
        }));
      }
      // grouping === 'type'
      const byType = groupByType(sorted);
      return TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({
        key: `type-${t}`,
        label: typeGroupLabel(t),
        rows: byType.get(t) ?? [],
      }));
    })();

    return {
      rows: sorted,
      groups,
      totalInView: sorted.length,
      filteredOutCount,
    };
  }, [profile, filter, sort, viewed, grouping]);
}

// ---------------------------------------------------------------------------
// Group-header label helpers. Phase 11 §4.6.
// ---------------------------------------------------------------------------

function tierGroupLabel(tier: Tier): string {
  // §4.6 — "Critical", "Needs work", "Strong", "Exceptional",
  // "Masterful" (sentence-case, not the all-caps form from TIER_META).
  switch (tier) {
    case 'CRITICAL':
      return 'Critical';
    case 'NEEDS_WORK':
      return 'Needs work';
    case 'FUNCTIONAL':
      return 'Functional';
    case 'STRONG':
      return 'Strong';
    case 'EXCEPTIONAL':
      return 'Exceptional';
    case 'MASTERFUL':
      return 'Masterful';
  }
}

function typeGroupLabel(t: AnnotationType): string {
  // Phase 11 §4.6 — "Voice | Craft | Structure | Content" maps the
  // domain vocabulary to the four AnnotationType values:
  //   growth → Voice (a growth note is a voice/craft suggestion)
  //   strength → Craft (a celebrated craft move)
  //   structural → Structure (paragraph-level)
  //   teaching → Content (conceptual)
  // This mapping is the simplest one that matches §4.6 wording; it's
  // not load-bearing on the type union itself.
  switch (t) {
    case 'growth':
      return 'Voice';
    case 'strength':
      return 'Craft';
    case 'structural':
      return 'Structure';
    case 'teaching':
      return 'Content';
  }
}
