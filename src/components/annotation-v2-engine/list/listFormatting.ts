/**
 * Pure formatting helpers for Workstream I (list view).
 *
 * Shared by ListView, ListRow, and Minimap. No React. No state. No
 * side effects. Tested in isolation.
 *
 * Authority:
 *   - docs/ux_phases/phase_11_list_map.md §2.3 (grouping)
 *   - docs/ux_phases/phase_11_list_map.md §2.4 (row layout — meta +
 *     truncated critique with soft fade, not ellipsis)
 *   - docs/ux_phases/phase_11_list_map.md §3.2 tokens (60ch clip)
 */

import type { Tier } from '../tokens';
import type {
  Annotation,
  AnnotationType,
  SentenceProfile,
} from '../types/profile';

// ---------------------------------------------------------------------------
// Meta breadcrumb — Phase 11 §2.4.
// ---------------------------------------------------------------------------

/**
 * `¶{P}s{M}` breadcrumb. Input indices are 0-based from the fixture;
 * the output is 1-based for student-facing parity (fixture IDs are
 * `p1s1` = first sentence of first paragraph).
 *
 * Matches the Phase 11 §2.4 format exactly. The tier label is NOT
 * appended here — callers layer it in with a separator dot so the
 * renderer can use `TIER_META[tier].label` directly.
 */
export function formatMeta(
  paragraphIndex: number,
  sentenceIndexWithinParagraph: number,
): string {
  return `\u00b6${paragraphIndex + 1}s${sentenceIndexWithinParagraph + 1}`;
}

// ---------------------------------------------------------------------------
// Critique truncation — Phase 11 §2.4 "first line of the critique,
// clipped at ~60ch with soft fade".
// ---------------------------------------------------------------------------

/**
 * Returns the first paragraph / logical line of the critique,
 * clipped at `maxCh` (default 60). The clip happens at a word
 * boundary so the soft fade in the renderer reads as continuous
 * prose, not as a mid-word chop.
 *
 * We do NOT append an ellipsis character — §2.4 mandates a CSS-rendered
 * soft fade. The renderer applies the gradient over the last characters
 * of the returned string.
 */
export function truncateCritique(text: string, maxCh = 60): string {
  if (!text) return '';
  // First-line extraction: critique strings in the fixture are
  // occasionally multi-sentence but always single-paragraph; we take
  // everything up to the first hard break or the full text.
  const firstLine = text.split(/\n+/)[0] ?? text;
  if (firstLine.length <= maxCh) return firstLine;

  // Word-boundary clip. We walk backward from `maxCh` to find the
  // last whitespace so we never cut mid-word. If the first `maxCh`
  // characters contain no whitespace (e.g. a freakishly long URL),
  // we fall back to the hard clip so the row never overflows.
  let cut = maxCh;
  while (cut > 0 && !/\s/.test(firstLine[cut]!)) {
    cut--;
  }
  const clipped = cut > 0 ? firstLine.slice(0, cut) : firstLine.slice(0, maxCh);
  return clipped.trimEnd();
}

// ---------------------------------------------------------------------------
// Grouping — Phase 11 §2.3.
// ---------------------------------------------------------------------------

export type ListGroupingKind = 'paragraph' | 'tier' | 'type';

export interface ListRowShape {
  readonly annotationId: string;
  readonly sentenceId: string;
  readonly paragraphIndex: number;
  readonly indexWithinParagraph: number;
  readonly tier: Tier;
  readonly annotationType: AnnotationType;
  readonly priority: number;
  readonly viewed: boolean;
  readonly hasRewrite: boolean;
  readonly critique: string;
}

/**
 * Generic grouping helper.
 *
 * Returns a Map<groupKey, rows>. The key type varies by grouping:
 *   - 'paragraph' → paragraphIndex (number)
 *   - 'tier'      → Tier string
 *   - 'type'      → AnnotationType string
 *
 * The renderer reads the keys in insertion order; callers are
 * responsible for feeding already-sorted rows so the insertion order
 * matches the intended render order.
 */
export function groupByParagraph(
  rows: readonly ListRowShape[],
): ReadonlyMap<number, readonly ListRowShape[]> {
  const map = new Map<number, ListRowShape[]>();
  for (const row of rows) {
    const key = row.paragraphIndex;
    const arr = map.get(key) ?? [];
    arr.push(row);
    map.set(key, arr);
  }
  return map;
}

export function groupByTier(
  rows: readonly ListRowShape[],
): ReadonlyMap<Tier, readonly ListRowShape[]> {
  const map = new Map<Tier, ListRowShape[]>();
  for (const row of rows) {
    const arr = map.get(row.tier) ?? [];
    arr.push(row);
    map.set(row.tier, arr);
  }
  return map;
}

export function groupByType(
  rows: readonly ListRowShape[],
): ReadonlyMap<AnnotationType, readonly ListRowShape[]> {
  const map = new Map<AnnotationType, ListRowShape[]>();
  for (const row of rows) {
    const arr = map.get(row.annotationType) ?? [];
    arr.push(row);
    map.set(row.annotationType, arr);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Row construction helper — turns an (annotation, sentence) pair into a
// renderer-friendly ListRowShape. The caller supplies viewed-state.
// ---------------------------------------------------------------------------

export function buildRow(args: {
  readonly annotation: Annotation;
  readonly sentence: SentenceProfile;
  readonly viewed: boolean;
}): ListRowShape {
  const { annotation, sentence, viewed } = args;
  return {
    annotationId: annotation.id,
    sentenceId: sentence.id,
    paragraphIndex: sentence.paragraphIndex,
    indexWithinParagraph: sentence.indexWithinParagraph,
    tier: sentence.tier,
    annotationType: annotation.type,
    priority: annotation.priority,
    viewed,
    hasRewrite: annotation.rewrite != null,
    critique: annotation.critique,
  };
}

// ---------------------------------------------------------------------------
// Forbidden-substring guard — Phase 11 §3.5.
// Shared by ProseCallout server-validation and any future "don't render
// a number" sites.
// ---------------------------------------------------------------------------

/**
 * Phase 11 §3.5 forbidden-strings rule: the prose line must never
 * contain a numeric score, percentage, letter grade, or the literal
 * words "score"/"grade". If the LLM output violates this (the L3.75
 * prompt has guardrails but we enforce client-side too), the caller
 * should render nothing — fail safe.
 *
 * Patterns:
 *   /\b\d+%/           → any integer percentage, e.g. "78%"
 *   /\b[A-F][+-]?\b/  → a letter grade, e.g. "B+" or "A"
 *   /score/i           → the literal word "score" in any case
 *   /grade/i           → the literal word "grade" in any case
 *   /\b\d{1,3}\/\d{1,3}\b/ → "78/100" form
 *   /\b\d+\s*(?:out\s+of|of)\s+\d+\b/i → "7 of 10" score form
 *
 * The letter-grade pattern deliberately uses a word boundary on both
 * sides, so legitimate content like "A sentence that" or "I am" is
 * NOT flagged — the test is for a lone A/B/C/D/E/F or the graded
 * `A+`/`B-` forms the spec calls out.
 */
const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /\b\d+%/,
  /\b[A-F][+-]?\b/,
  /score/i,
  /grade/i,
  /\b\d{1,3}\/\d{1,3}\b/,
  /\b\d+\s*(?:out\s+of|of)\s+\d+\b/i,
];

export function containsForbiddenStatistic(text: string): boolean {
  if (!text) return false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}
