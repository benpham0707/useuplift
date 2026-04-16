/**
 * revisionIntelligence.ts — Phase 2a derived signals.
 *
 * Consumes the Phase 1 ProfileSnapshot chain (from Agent A) plus the
 * current EssayProfile to compute cross-session revision intelligence:
 *   - addressedFindings: prior-snapshot findings whose anchor text is gone
 *     (deduped against persistentFindings — persistence wins)
 *   - persistentFindings: same ISSUE in prior AND current. Primary match on
 *     (category, paragraph); secondary match on (category, anchorText) so a
 *     paragraph reorder surfaces as `movedFromParagraph` instead of
 *     vanishing from both passes.
 *   - regressionEvents: category addressed, went absent, then returned
 *   - patternLevelIssues: >=3 paragraphs in current + >=2 session signal,
 *     surfaced per DIMENSION (not just primary craftCategory) so findings
 *     with multiple dimensions contribute to every pattern they belong to
 *   - revisionVelocity: fastest/slowest/median turns-to-address
 *   - summaryForCoach: 2–4 sentence deterministic summary
 *
 * ZERO LLM calls. Pure computation.
 *
 * DEVIATIONS from the original Round 7a spec (per Agent A deviations):
 *   1. `SnapshotFinding.severity` is always `'moderate'` — there is no live
 *      severity signal. Pattern-level detection therefore does NOT gate on
 *      severity. We still require (a) >=3 instances in the current profile
 *      AND (b) the category to have appeared in at least one prior snapshot
 *      (the >=2-session signal). When a real severity signal lands (Round
 *      7b per the lead), add a severity gate back into patternLevelIssues.
 *   2. `SnapshotFinding.maturity` is never `'addressed'` on extraction.
 *      Addressed-ness is COMPUTED here via anchor-text drift against the
 *      current essay text, not read off the snapshot.
 *
 * Exports:
 *   - computeRevisionIntelligence(currentProfile, history) → signals | null
 */

import type {
  EssayProfile,
  Finding,
  RevisionIntelligenceSignals,
} from '../profileTypes';
import {
  hashEssayText,
  type ProfileSnapshot,
  type SnapshotFinding,
} from './profileSnapshot';

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

/**
 * Compute cross-session revision intelligence.
 *
 * @param currentProfile The live profile we're evaluating this session.
 * @param history        Snapshots, oldest→newest. Callers typically pass
 *                       `readRecentSnapshots(profile.revisionHistory, 10)`
 *                       AFTER the current session's snapshot has been
 *                       written — so `history[history.length - 1]` is the
 *                       CURRENT session's snapshot and "most-recent prior"
 *                       is `history[history.length - 2]`.
 *
 *                       We still guard on `history.length < 2` returning
 *                       null — a single-snapshot history means "only this
 *                       session exists, nothing to compare against."
 *
 *                       If the caller passes history BEFORE writing the
 *                       current snapshot (priors only), the math still
 *                       works: `history[length - 1]` is then the most-
 *                       recent prior, and we also check against the live
 *                       profile's current findings / essay text.
 *
 * @returns              null when history.length < 2. Otherwise a populated
 *                       signal object (individual arrays may still be empty).
 */
export function computeRevisionIntelligence(
  currentProfile: EssayProfile,
  history: ProfileSnapshot[],
): RevisionIntelligenceSignals | null {
  // Guard: no basis for comparison. Session one + any zero/one-snapshot state.
  if (!history || history.length < 2) return null;

  const currentEssayText = reconstructEssayText(currentProfile);
  const currentFindings = currentProfile.findings ?? [];

  // Split history into "prior snapshots" and the (optional) current snapshot.
  // We detect the current snapshot by matching essay-text hash against the
  // live profile — the same profile instance the caller just derived this
  // from SHOULD produce an identical hash. When no match (e.g., caller
  // passed priors-only), treat the entire history as priors.
  const priorSnapshots = splitPriorsFromCurrent(history, currentProfile);

  // If every snapshot turned out to be "current-matching" (or the split
  // collapsed priors to zero), we still have nothing to compare against.
  if (priorSnapshots.length === 0) return null;

  const rawAddressedFindings = detectAddressedFindings(priorSnapshots, currentEssayText);
  const persistentFindings = detectPersistentFindings(priorSnapshots, currentFindings);
  const regressionEvents = detectRegressionEvents(priorSnapshots, currentFindings);
  const patternLevelIssues = detectPatternLevelIssues(priorSnapshots, currentFindings);

  // ── addressed vs persistent dedup ───────────────────────────────────────
  // A finding whose anchor text was rewritten (so the old anchor no longer
  // appears in the essay text) can be picked up by BOTH passes: the anchor
  // is gone so addressed detection fires, AND the same (category, paragraph)
  // is still flagged in the current profile so persistent detection fires.
  // Persistent is the stronger signal — if the issue is still there by
  // category+paragraph, the finding was NOT really addressed, just
  // re-anchored. Dropping the dup avoids double-counting in
  // `summaryForCoach` and avoids giving the coach two conflicting signals
  // for the same slot.
  const persistentKeys = new Set(
    persistentFindings.map((p) => makeKey(p.craftCategory, p.paragraph)),
  );
  const addressedFindings = rawAddressedFindings.filter(
    (a) => !persistentKeys.has(makeKey(a.craftCategory, a.paragraph)),
  );

  const revisionVelocity = computeVelocity(addressedFindings, persistentFindings);

  // Compose summary AFTER the dedup so surfaced counts reflect the final
  // deduped arrays, not the raw pre-dedup ones.
  const summaryForCoach = composeSummary({
    addressedFindings,
    persistentFindings,
    regressionEvents,
    patternLevelIssues,
    revisionVelocity,
  });

  return {
    addressedFindings,
    persistentFindings,
    regressionEvents,
    patternLevelIssues,
    revisionVelocity,
    summaryForCoach,
  };
}

// ============================================================================
// TEXT / FINDING HELPERS
// ============================================================================

function reconstructEssayText(profile: EssayProfile): string {
  return (profile.paragraphs ?? [])
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('\n\n');
}

/**
 * Partition a snapshot chain into "priors" vs the (optional) snapshot that
 * matches the CURRENT profile. We match by essayTextHash so we correctly
 * strip a snapshot that was just written for the current session — avoiding
 * the "iterated over current's own findings" bug where addressed findings
 * would never be detected (the anchor is trivially present in current text).
 *
 * When no match is found (caller passed priors-only or a profile that has
 * mutated since the last write), all entries are treated as priors.
 */
function splitPriorsFromCurrent(
  history: ProfileSnapshot[],
  currentProfile: EssayProfile,
): ProfileSnapshot[] {
  if (history.length === 0) return [];
  const currentHash = hashEssayText(reconstructEssayText(currentProfile));
  // If the trailing snapshot's hash matches current, that snapshot IS the
  // current-session capture — strip it.
  if (history[history.length - 1].essayTextHash === currentHash) {
    return history.slice(0, -1);
  }
  return [...history];
}

/**
 * Derive a Finding's paragraph index the same way Agent A's snapshot
 * extractor does — so (category, paragraph) match keys line up across
 * the snapshot and live-profile sides of every comparison.
 *
 * Returns -1 when no paragraph can be determined (essay-level scope).
 */
function findingParagraph(f: Finding): number {
  const scope = f.scope;
  if (!scope) return -1;
  if (scope.type === 'essay_level') return -1;
  if (scope.type === 'cross_paragraph') {
    return scope.paragraphs && scope.paragraphs.length > 0 ? scope.paragraphs[0] : -1;
  }
  return typeof scope.paragraph === 'number' ? scope.paragraph : -1;
}

/**
 * Mirror of snapshot extractor's deriveCraftCategory: first dimension,
 * lowercased; 'uncategorized' when dimensions[] empty.
 */
function findingCraftCategory(f: Finding): string {
  if (!f.dimensions || f.dimensions.length === 0) return 'uncategorized';
  return String(f.dimensions[0]).toLowerCase();
}

/**
 * Mirror of snapshot extractor's deriveAnchorText — first 'present'
 * evidence text, else any evidence text, else claim.slice(0, 120).
 * Used to produce a stable anchor for persistent findings without
 * re-opening the snapshot contract.
 */
function findingAnchorText(f: Finding): string {
  for (const ev of f.evidence) {
    if (ev.text && ev.text.length > 0 && ev.type === 'present') return ev.text;
  }
  for (const ev of f.evidence) {
    if (ev.text && ev.text.length > 0) return ev.text;
  }
  return (f.claim ?? '').slice(0, 120);
}

/**
 * Trim ONLY outer whitespace — case-sensitive interior comparison as spec'd.
 */
function normalizeAnchorForSearch(anchor: string): string {
  return anchor.trim();
}

// ============================================================================
// ADDRESSED FINDINGS
// ============================================================================

/**
 * A finding is "addressed" when its anchorText, recorded in a prior snapshot,
 * no longer appears in the current essay text (case-sensitive; outer
 * whitespace trimmed). We track each (category, paragraph) addressed slot
 * exactly once, keyed to the MOST RECENT prior snapshot in which it appeared
 * — that's the one against which "disappeared now" is meaningful.
 *
 * turnsToAddress: number of snapshots between the finding's FIRST appearance
 * and its disappearance in the current profile. For a finding first seen in
 * snapshot K and gone in the current profile, the turns count is
 * (history.length - K).
 */
function detectAddressedFindings(
  history: ProfileSnapshot[],
  currentEssayText: string,
): RevisionIntelligenceSignals['addressedFindings'] {
  const addressed: RevisionIntelligenceSignals['addressedFindings'] = [];
  if (history.length === 0) return addressed;

  // Iterate across the UNION of anchor-entries from every prior snapshot,
  // so we surface findings that first appeared in an earlier snapshot even
  // if they were already absent from the most-recent prior. Dedupe by
  // (category, paragraph, anchorText) — one addressed event per unique
  // slot, keyed to the EARLIEST appearance to compute turnsToAddress.
  const seen = new Set<string>();

  // Walk oldest → newest so the first time we see a given key, it's the
  // earliest appearance. That naturally gives turnsToAddress = history.length
  // - firstIdx.
  for (let idx = 0; idx < history.length; idx++) {
    for (const sf of history[idx].findings) {
      const key = `${sf.craftCategory}|P${sf.paragraph}|${sf.anchorText}`;
      if (seen.has(key)) continue;

      const needle = normalizeAnchorForSearch(sf.anchorText);
      if (needle.length === 0) {
        seen.add(key);
        continue;
      }

      // Anchor still present in the current essay → not addressed.
      if (currentEssayText.includes(needle)) {
        seen.add(key);
        continue;
      }

      // Anchor gone — this is an addressed slot. turnsToAddress counts
      // from the earliest appearance (idx) to "now" (one past the end).
      const turnsToAddress = history.length - idx;

      addressed.push({
        findingId: sf.id,
        craftCategory: sf.craftCategory,
        paragraph: sf.paragraph,
        turnsToAddress,
        anchorTextBefore: sf.anchorText,
        // "After" anchor text: the snapshot alone cannot reliably
        // reconstruct the rewritten phrase. We leave this empty and
        // document the limitation in the schema — downstream consumers
        // surface before/disappeared as sufficient signal for a coach
        // prompt.
        anchorTextAfter: '',
      });
      seen.add(key);
    }
  }

  return addressed;
}

// ============================================================================
// PERSISTENT FINDINGS
// ============================================================================

/**
 * Key used to match findings across snapshots. Deliberately NOT the findingId
 * — ids can be reassigned across sessions. (category, paragraph) is the
 * coarse-but-stable bucket.
 */
function makeKey(category: string, paragraph: number): string {
  return `${category}|P${paragraph}`;
}

/**
 * Normalize an anchor snippet for cross-snapshot anchor-match comparison.
 * Lowercased + outer whitespace trimmed so two snapshots that quote the
 * same phrase match despite capitalization drift or surrounding space.
 * Empty string → `null` so callers don't match "nothing" against "nothing."
 */
function normalizeAnchorForMatch(anchor: string): string | null {
  const t = anchor.trim().toLowerCase();
  return t.length === 0 ? null : t;
}

/**
 * A finding is "persistent" when the same ISSUE shows up in BOTH at least
 * one prior snapshot AND the current profile. Two match paths, in order:
 *
 *   PRIMARY — (craftCategory, paragraph) match in place. The issue lives
 *   at the same slot. sessionsPersisted counts consecutive prior presence.
 *
 *   SECONDARY — (craftCategory, anchorText) match across prior snapshots
 *   when the primary match FAILS. Catches paragraph reorder — a student
 *   who moves P2 → P4 without rewriting the anchor still has the same
 *   issue, just relocated. When this fires, we record `movedFromParagraph`
 *   set to the paragraph the finding occupied in the most-recent prior
 *   where it appeared. anchorText match uses `normalizeAnchorForMatch`
 *   (lowercase + trim) for robustness across case/whitespace drift.
 *
 * sessionsPersisted is computed the same way in both paths — number of
 * consecutive prior snapshots (walking back from most-recent) where the
 * match holds, PLUS 1 for the current profile. Mixed paths (primary in
 * some priors, secondary in others) still count as long as each prior
 * has a hit under either rule.
 */
function detectPersistentFindings(
  history: ProfileSnapshot[],
  currentFindings: Finding[],
): RevisionIntelligenceSignals['persistentFindings'] {
  const persistent: RevisionIntelligenceSignals['persistentFindings'] = [];
  if (history.length === 0) return persistent;

  // Pre-index primary (category, paragraph) keys per snapshot.
  const snapshotKeySets: Array<Set<string>> = history.map(
    (s) => new Set(s.findings.map((f) => makeKey(f.craftCategory, f.paragraph))),
  );
  // Pre-index secondary (category, normalizedAnchor) → paragraph per snap.
  // Map value is the snapshot finding's paragraph so we can record
  // `movedFromParagraph` without a second pass.
  const snapshotAnchorIndex: Array<Map<string, number>> = history.map((s) => {
    const idx = new Map<string, number>();
    for (const sf of s.findings) {
      const norm = normalizeAnchorForMatch(sf.anchorText);
      if (!norm) continue;
      const k = `${sf.craftCategory}|${norm}`;
      // First-claim wins per snapshot to keep the paragraph stable.
      if (!idx.has(k)) idx.set(k, sf.paragraph);
    }
    return idx;
  });

  const seen = new Set<string>();
  for (const f of currentFindings) {
    // Drop superseded findings from the current set — they are explicitly
    // resolved and shouldn't count as "still there."
    if (f.maturity === 'superseded') continue;

    const paragraph = findingParagraph(f);
    const category = findingCraftCategory(f);
    const primaryKey = makeKey(category, paragraph);
    if (seen.has(primaryKey)) continue;

    const inPrimary = snapshotKeySets.some((ks) => ks.has(primaryKey));

    // Secondary: (category, normalizedAnchor) from the CURRENT finding's
    // anchor vs any prior snapshot's anchor index.
    const currentAnchor = findingAnchorText(f);
    const normCurrent = normalizeAnchorForMatch(currentAnchor);
    const secondaryKey = normCurrent ? `${category}|${normCurrent}` : null;
    const secondaryHitIndex =
      secondaryKey === null
        ? -1
        : (() => {
            for (let i = snapshotAnchorIndex.length - 1; i >= 0; i--) {
              if (snapshotAnchorIndex[i].has(secondaryKey)) return i;
            }
            return -1;
          })();

    if (!inPrimary && secondaryHitIndex === -1) continue;

    // Count consecutive presence walking back from most-recent. A prior
    // counts as "present" if EITHER the primary (cat,para) key OR the
    // secondary (cat,anchor) key hits that snapshot.
    let consecutive = 0;
    for (let i = snapshotKeySets.length - 1; i >= 0; i--) {
      const primaryHit = snapshotKeySets[i].has(primaryKey);
      const secondaryHit =
        secondaryKey !== null && snapshotAnchorIndex[i].has(secondaryKey);
      if (primaryHit || secondaryHit) consecutive++;
      else break;
    }
    const sessionsPersisted = consecutive + 1; // +1 for current profile

    // `movedFromParagraph` is only set when primary missed and secondary
    // fired — the paragraph index the finding occupied in the most-recent
    // prior where it appeared via anchor match.
    let movedFromParagraph: number | undefined;
    if (!inPrimary && secondaryHitIndex >= 0 && secondaryKey !== null) {
      movedFromParagraph = snapshotAnchorIndex[secondaryHitIndex].get(secondaryKey);
    }

    persistent.push({
      findingId: f.id,
      craftCategory: category,
      paragraph,
      sessionsPersisted,
      anchorText: currentAnchor,
      ...(movedFromParagraph !== undefined ? { movedFromParagraph } : {}),
    });
    seen.add(primaryKey);
  }

  return persistent;
}

// ============================================================================
// REGRESSION EVENTS
// ============================================================================

/**
 * A regression occurs when a (category, paragraph) key was present in
 * snapshot K, ABSENT in snapshot(s) K+1…K+M (M>=1), then present again
 * in a LATER snapshot OR in the current profile.
 *
 * We detect this by walking each unique key's presence timeline across the
 * history and flagging the first "present → absent(>=1) → present again"
 * transition per key.
 */
function detectRegressionEvents(
  history: ProfileSnapshot[],
  currentFindings: Finding[],
): RevisionIntelligenceSignals['regressionEvents'] {
  const events: RevisionIntelligenceSignals['regressionEvents'] = [];
  if (history.length < 2) return events;

  // Build per-index key set + current profile as the trailing timeline slot.
  const timeline: Array<Set<string>> = history.map(
    (s) => new Set(s.findings.map((f) => makeKey(f.craftCategory, f.paragraph))),
  );
  const currentKeys = new Set<string>();
  for (const f of currentFindings) {
    if (f.maturity === 'superseded') continue;
    currentKeys.add(makeKey(findingCraftCategory(f), findingParagraph(f)));
  }
  timeline.push(currentKeys);
  // timeline indices: 0..history.length-1 = history, timeline.length-1 = current profile.

  // Collect every key ever seen.
  const allKeys = new Set<string>();
  for (const ks of timeline) for (const k of ks) allKeys.add(k);

  for (const key of allKeys) {
    // Walk the timeline; find first pattern: present → absent(>=1) → present.
    let seenPresent = false;
    let disappearedAt = -1;
    for (let i = 0; i < timeline.length; i++) {
      const here = timeline[i].has(key);
      if (!seenPresent) {
        if (here) seenPresent = true;
      } else if (disappearedAt === -1) {
        if (!here) disappearedAt = i;
      } else {
        if (here) {
          const [category, paragraphStr] = key.split('|');
          const paragraph = Number(paragraphStr.replace(/^P/, ''));
          const gapLength = i - disappearedAt;
          events.push({
            craftCategory: category,
            paragraph: Number.isFinite(paragraph) ? paragraph : -1,
            // Spec: previouslyAddressedAtSession = K+1 where K is the
            // index (0-based) of the last-present snapshot before the gap.
            // We expose 1-based session numbers for coach readability.
            previouslyAddressedAtSession: disappearedAt + 1,
            // Spec: reappearedAtSession = K+M+N (1-based). `i` is the 0-based
            // index where the key came back; +1 for 1-based readability.
            reappearedAtSession: i + 1,
            reasoning: `${category} at P${Number.isFinite(paragraph) ? paragraph : '?'} was absent in ${gapLength} snapshot${gapLength === 1 ? '' : 's'} then returned`,
          });
          break; // one event per key — first regression is enough signal
        }
      }
    }
  }

  return events;
}

// ============================================================================
// PATTERN-LEVEL ISSUES
// ============================================================================

/**
 * normalizeCategoryLabel: "voice_mechanics" → "voice mechanics". Keeps the
 * framing readable without leaking the snake_case storage format.
 */
function normalizeCategoryLabel(category: string): string {
  return category.replace(/_/g, ' ');
}

/**
 * Pattern-level issue: a DIMENSION that spans >=3 paragraphs in the current
 * profile AND appears in at least one prior snapshot (the >=2-session
 * signal). We iterate over every dimension each current finding carries
 * (not just the primary one) so findings tagged with multiple dimensions
 * like `['narrative_pacing', 'voice_mechanics']` can surface a pattern on
 * EACH dimension independently when each passes the threshold.
 *
 * Prior-snapshot match reads `allDimensions` when present (>=2-dim
 * findings) and falls back to `craftCategory` (1-dim findings). This keeps
 * the >=2-session gate correct even when the primary dimension rotated
 * between sessions.
 *
 * Dedupe: at most one pattern entry per dimension. `craftCategory` is
 * preserved as the primary display field (dimensions[0]).
 *
 * ─────────────────────────────────────────────────────────────────────
 * SEVERITY TODO (Round 7b or later) — see the matching comment block in
 * `profileSnapshot.ts::extractSnapshotFindings`. Today every snapshot
 * finding has `severity: 'moderate'` because the live `Finding` has no
 * severity signal, so a severity gate here would always pass. When a real
 * severity signal lands, re-introduce the filter at this threshold.
 * ─────────────────────────────────────────────────────────────────────
 */
function detectPatternLevelIssues(
  history: ProfileSnapshot[],
  currentFindings: Finding[],
): RevisionIntelligenceSignals['patternLevelIssues'] {
  if (history.length === 0) return [];

  // Group current findings by DIMENSION (not just primary category) → unique
  // paragraphs + finding ids. A finding with dimensions ['A', 'B'] contributes
  // to BOTH buckets; dedupe at the paragraph level so each finding only
  // counts once per dimension bucket.
  interface Bucket {
    paragraphs: Set<number>;
    instances: Array<{ paragraph: number; findingId: string }>;
    /** craftCategory (dimensions[0]) the first time we saw this dimension
     *  as a primary — used for human-readable labels when the dim IS the
     *  primary. When the dim only shows up as a secondary, fall back to
     *  the dim name itself. */
    primaryDisplay: string;
  }
  const buckets = new Map<string, Bucket>();

  for (const f of currentFindings) {
    if (f.maturity === 'superseded') continue;
    const dims = Array.isArray(f.dimensions)
      ? f.dimensions.map((d) => String(d).toLowerCase()).filter((d) => d.length > 0)
      : [];
    const effectiveDims = dims.length === 0 ? ['uncategorized'] : dims;
    const paragraph = findingParagraph(f);
    const primary = effectiveDims[0];

    for (const dim of effectiveDims) {
      let bucket = buckets.get(dim);
      if (!bucket) {
        bucket = { paragraphs: new Set(), instances: [], primaryDisplay: dim };
        buckets.set(dim, bucket);
      }
      // Upgrade display label if we later see this dim as a primary.
      if (dim === primary) bucket.primaryDisplay = primary;
      if (!bucket.paragraphs.has(paragraph)) {
        bucket.paragraphs.add(paragraph);
        bucket.instances.push({ paragraph, findingId: f.id });
      }
    }
  }

  // Build the prior-snapshot dimension indexes. Read `allDimensions` when
  // present, `craftCategory` otherwise. Separate "most-recent prior" from
  // "earlier priors" so we can assign persistenceSignal (persistent vs.
  // regression).
  const priorSnap = history[history.length - 1];
  const priorDims = new Set<string>();
  for (const f of priorSnap.findings) {
    priorDims.add(f.craftCategory);
    if (f.allDimensions) for (const d of f.allDimensions) priorDims.add(d);
  }
  const earlierDims = new Set<string>();
  for (let i = 0; i < history.length - 1; i++) {
    for (const f of history[i].findings) {
      earlierDims.add(f.craftCategory);
      if (f.allDimensions) for (const d of f.allDimensions) earlierDims.add(d);
    }
  }

  const issues: RevisionIntelligenceSignals['patternLevelIssues'] = [];

  for (const [dim, bucket] of buckets) {
    if (bucket.paragraphs.size < 3) continue;
    const inPrior = priorDims.has(dim);
    const inEarlier = earlierDims.has(dim);
    if (!inPrior && !inEarlier) continue;

    // Determine persistenceSignal — see original note for full rationale.
    let persistenceSignal: 'new' | 'persistent' | 'regression';
    if (inPrior) persistenceSignal = 'persistent';
    else if (inEarlier) persistenceSignal = 'regression';
    else persistenceSignal = 'new';

    const paragraphList = bucket.instances
      .map((i) => `P${i.paragraph}`)
      .sort()
      .join(', ');

    const humanFraming = `Your ${normalizeCategoryLabel(dim)} pattern appears across ${paragraphList} — intentional or habit?`;

    issues.push({
      craftCategory: dim,
      instances: bucket.instances,
      persistenceSignal,
      humanFraming,
    });
  }

  // Stable sort so downstream output is deterministic across runs.
  issues.sort((a, b) => a.craftCategory.localeCompare(b.craftCategory));
  return issues;
}

// ============================================================================
// VELOCITY
// ============================================================================

function computeVelocity(
  addressed: RevisionIntelligenceSignals['addressedFindings'],
  persistent: RevisionIntelligenceSignals['persistentFindings'],
): RevisionIntelligenceSignals['revisionVelocity'] {
  if (addressed.length === 0 && persistent.length === 0) return null;

  const fastest =
    addressed.length === 0
      ? null
      : addressed.reduce((acc, a) => (a.turnsToAddress < acc.turnsToAddress ? a : acc), addressed[0]);

  const slowest =
    persistent.length === 0
      ? null
      : persistent.reduce(
          (acc, p) => (p.sessionsPersisted > acc.sessionsPersisted ? p : acc),
          persistent[0],
        );

  let medianTurnsToAddress: number | null = null;
  if (addressed.length > 0) {
    const sorted = addressed.map((a) => a.turnsToAddress).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianTurnsToAddress =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  return {
    fastestAddress: fastest
      ? {
          findingId: fastest.findingId,
          craftCategory: fastest.craftCategory,
          turns: fastest.turnsToAddress,
        }
      : null,
    slowestPersisting: slowest
      ? {
          findingId: slowest.findingId,
          craftCategory: slowest.craftCategory,
          sessionsUnaddressed: slowest.sessionsPersisted,
        }
      : null,
    medianTurnsToAddress,
  };
}

// ============================================================================
// SUMMARY COMPOSITION
// ============================================================================

interface SummaryInputs {
  addressedFindings: RevisionIntelligenceSignals['addressedFindings'];
  persistentFindings: RevisionIntelligenceSignals['persistentFindings'];
  regressionEvents: RevisionIntelligenceSignals['regressionEvents'];
  patternLevelIssues: RevisionIntelligenceSignals['patternLevelIssues'];
  revisionVelocity: RevisionIntelligenceSignals['revisionVelocity'];
}

/**
 * Deterministic 2–4 sentence summary. Priority order for limited space:
 *   1. Pattern-level issue (strongest coach signal)
 *   2. Regression event (second strongest)
 *   3. Addressed/persistent counts (progress snapshot)
 *   4. Velocity highlight when data exists
 *
 * Empty string when no signal is worth surfacing.
 */
function composeSummary(inputs: SummaryInputs): string {
  const sentences: string[] = [];

  if (inputs.patternLevelIssues.length > 0) {
    const top = inputs.patternLevelIssues[0];
    sentences.push(
      `A ${normalizeCategoryLabel(top.craftCategory)} pattern now spans ${top.instances.length} paragraphs.`,
    );
  }

  if (inputs.regressionEvents.length > 0) {
    const r = inputs.regressionEvents[0];
    sentences.push(
      `${normalizeCategoryLabel(r.craftCategory)} at P${r.paragraph} has returned after being resolved earlier.`,
    );
  }

  const addressedCount = inputs.addressedFindings.length;
  const persistentCount = inputs.persistentFindings.length;
  if (addressedCount > 0 && persistentCount > 0) {
    sentences.push(
      `${addressedCount} finding${addressedCount === 1 ? '' : 's'} addressed since a prior session; ${persistentCount} still unresolved.`,
    );
  } else if (addressedCount > 0) {
    sentences.push(
      `${addressedCount} finding${addressedCount === 1 ? '' : 's'} addressed since a prior session.`,
    );
  } else if (persistentCount > 0) {
    sentences.push(
      `${persistentCount} prior-session finding${persistentCount === 1 ? '' : 's'} still unresolved in the current draft.`,
    );
  }

  // Flag the first moved-paragraph finding, when we have room — the signal
  // is "same pattern, new slot" which is easy for the coach to miss when
  // they read persistent counts as a flat number.
  if (sentences.length < 4) {
    const moved = inputs.persistentFindings.find(
      (p) => typeof p.movedFromParagraph === 'number' && p.movedFromParagraph !== p.paragraph,
    );
    if (moved) {
      sentences.push(
        `One issue moved from P${moved.movedFromParagraph} to P${moved.paragraph} — still the same pattern.`,
      );
    }
  }

  if (
    sentences.length < 4 &&
    inputs.revisionVelocity &&
    inputs.revisionVelocity.slowestPersisting &&
    inputs.revisionVelocity.slowestPersisting.sessionsUnaddressed >= 3
  ) {
    const sp = inputs.revisionVelocity.slowestPersisting;
    sentences.push(
      `${normalizeCategoryLabel(sp.craftCategory)} has now persisted across ${sp.sessionsUnaddressed} sessions.`,
    );
  }

  // Enforce 4-sentence cap hard.
  if (sentences.length === 0) return '';
  const capped = sentences.slice(0, 4);

  // Ensure each sentence terminates with .?!
  const terminated = capped.map((s) =>
    /[.?!]$/.test(s.trim()) ? s : s.replace(/\s*$/, '.'),
  );
  return terminated.join(' ');
}
