/**
 * paragraphRef.ts
 *
 * Centralizes paragraph-reference convention between the two indexing
 * systems the coaching pipeline uses:
 *
 *   - INTERNAL / MANIFEST:   0-indexed (P0 == first paragraph, array index)
 *   - STUDENT-FACING / COACH TEXT: 1-indexed (P1 == first paragraph in prose)
 *
 * The Round 3 audit (Agent B) observed silent delta-tracking failures caused
 * by `coach_suggestion` events written with 1-indexed refs while the manifest
 * and per-paragraph delta telemetry expected 0-indexed refs. `normalizeParagraphRef`
 * is the single funnel every event-emit site must pass values through.
 *
 * Design notes:
 *   - Pure functions. No I/O. Fast enough to run on every event emit.
 *   - `source` makes the caller's intent explicit so the conversion is never
 *     ambiguous. No auto-detection heuristics — the caller knows the origin.
 *   - Dev-mode sanity assertion (logs, does not throw) when the resulting
 *     index would exceed the essay's paragraph count.
 */

/**
 * The origin of a paragraph reference, which determines whether a conversion
 * to 0-indexed internal form is needed.
 *
 *   - 'manifest'        — already 0-indexed (ImprovementEntry.paragraph,
 *                         sidecar.focusParagraphs, Finding.scope.paragraph, etc.)
 *   - 'student_message' — usually 1-indexed ("P1", "P2") as students speak
 *                         in 1-indexed prose. Convert to 0-indexed.
 *   - 'coach_text'      — same as student_message: the coach writes 1-indexed
 *                         "P1" labels in student-facing prose.
 */
export type ParagraphRefSource = 'manifest' | 'student_message' | 'coach_text';

/**
 * Normalize a paragraph reference to 0-indexed internal form.
 *
 * Accepted inputs:
 *   - number (e.g. 0, 1, 2)
 *   - string ("P1", "p2", "P10", "3")
 *
 * When `source` is 'manifest', the input is passed through unchanged
 * (after stripping any optional "P" prefix — tolerant parse).
 *
 * When `source` is 'student_message' or 'coach_text', the input is treated
 * as 1-indexed and decremented by 1.
 *
 * Returns NaN (and logs a warning) if the input cannot be parsed. Callers
 * should filter NaN out before writing events.
 */
export function normalizeParagraphRef(
  value: string | number,
  source: ParagraphRefSource,
): number {
  let raw: number;

  if (typeof value === 'number') {
    raw = value;
  } else {
    // Strip optional leading P/p and parse the digits.
    const m = value.trim().match(/^[Pp]?(\d+)$/);
    if (!m) {
      console.warn(
        `[paragraphRef] Could not parse "${value}" (source=${source}) — returning NaN`,
      );
      return NaN;
    }
    raw = parseInt(m[1], 10);
  }

  if (!Number.isFinite(raw)) {
    console.warn(
      `[paragraphRef] Non-finite paragraph ref (source=${source}) — returning NaN`,
    );
    return NaN;
  }

  if (source === 'manifest') {
    return raw;
  }

  // 1-indexed student-facing → 0-indexed internal.
  // Clamp to 0 when prose happens to say "P0" (treated as first paragraph).
  return Math.max(0, raw - 1);
}

/**
 * Dev-mode sanity assertion: warn when a 0-indexed ref exceeds the known
 * paragraph count for the essay. Does NOT throw — event emission should
 * never be blocked by a telemetry mismatch.
 */
export function assertRefInRange(
  ref: number,
  paragraphCount: number,
  context: string,
): void {
  if (!Number.isFinite(ref) || ref < 0) {
    console.warn(
      `[paragraphRef] Out-of-range ref ${ref} (context=${context}, paragraphCount=${paragraphCount}) — event will still be emitted but downstream telemetry may mis-attribute it.`,
    );
    return;
  }
  if (ref >= paragraphCount) {
    console.warn(
      `[paragraphRef] Ref P${ref} exceeds paragraph count ${paragraphCount} (context=${context}) — likely an off-by-one in the emission site.`,
    );
  }
}

/**
 * Convenience: normalize a list of mixed-format refs to 0-indexed ints,
 * dropping any that fail to parse. Deduplicates and preserves insertion order.
 */
export function normalizeParagraphRefs(
  values: Array<string | number>,
  source: ParagraphRefSource,
): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const v of values) {
    const r = normalizeParagraphRef(v, source);
    if (Number.isFinite(r) && !seen.has(r)) {
      seen.add(r);
      out.push(r);
    }
  }
  return out;
}
