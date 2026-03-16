/**
 * versionTracker.ts — Essay version lifecycle management.
 *
 * Pure data management — no LLM calls.
 * Manages the active version (in-progress) and completed versions (sealed).
 * Tracks accumulated changes, staleness, and produces a ReanalysisBrief
 * that tells the re-analysis pipeline exactly what changed and why.
 */

import type {
  EditUnderstandingOutput,
  EditUnderstanding,
  StalenessEffect,
  StalenessStrength,
  VersionRecord,
  ReanalysisBrief,
  EditApproach,
  EditStrategyPattern,
} from './profileTypes';

// ============================================================================
// LOCAL TYPES
// ============================================================================

// ReanalysisBrief is the canonical type defined in profileTypes.ts — imported above.
// Re-export it for convenience so callers can import from versionTracker directly.
export type { ReanalysisBrief } from './profileTypes';

/**
 * ReanalysisTrigger — result of shouldTriggerReanalysis().
 */
export interface ReanalysisTrigger {
  shouldTrigger: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

// ============================================================================
// INTERNAL STATE TYPES
// ============================================================================

/**
 * PendingChange — a single recorded edit within the active version.
 */
interface PendingChange {
  timestamp: string;
  location: { paragraph: number; sentence?: number };
  oldText: string;
  newText: string;
  understanding?: EditUnderstanding;
  intentAnnotation?: string;
}

/**
 * ActiveLightTouchAdjustment — a non-structural profile tweak during active version.
 */
interface ActiveLightTouchAdjustment {
  field: string;
  adjustment: string;
  source: 'conversation' | 'edit_workshop';
  timestamp: string;
}

/**
 * StalenessAccumulator — running tally of which profile areas have accumulated staleness.
 *
 * Staleness upgrades: if the same area is hit multiple times,
 * weak→moderate→strong. Once strong, stays strong.
 */
interface StalenessAccumulator {
  strongStale: Set<string>;
  moderateStale: Set<string>;
  weakStale: Set<string>;
  totalEdits: number;
  transformativeCount: number;
  significantCount: number;
  moderateCount: number;
}

/**
 * ActiveVersion — the current in-progress version.
 */
interface ActiveVersion {
  /** Version number (completedVersions.length + 1 at init) */
  version: number;
  /** ISO timestamp when this version started */
  startedAt: string;
  /** Essay text at the start of this version (the "before" baseline) */
  baselineText: string;
  /** Latest essay text — updated with each recordEdit call */
  currentText: string;
  /** All changes accumulated since the last analysis */
  changes: PendingChange[];
  /** ConversationInsight IDs collected since the last version */
  insightsSinceLastVersion: string[];
  /** Light-touch profile adjustments applied without triggering re-analysis */
  lightTouchAdjustments: ActiveLightTouchAdjustment[];
  /** Accumulated staleness across all recorded edits */
  accumulatedStaleness: StalenessAccumulator;
  /** W9.1: Tracked editing approaches within this version */
  approaches: EditApproach[];
  /** W9.1: Currently active approach ID (null until first approach detected) */
  currentApproachId: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Build a canonical location key for grouping changes per location. */
function locationKey(loc: { paragraph: number; sentence?: number }): string {
  return loc.sentence !== undefined
    ? `p${loc.paragraph}:s${loc.sentence}`
    : `p${loc.paragraph}`;
}

/** Create a fresh, empty StalenessAccumulator. */
function createEmptyStalenessAccumulator(): StalenessAccumulator {
  return {
    strongStale: new Set<string>(),
    moderateStale: new Set<string>(),
    weakStale: new Set<string>(),
    totalEdits: 0,
    transformativeCount: 0,
    significantCount: 0,
    moderateCount: 0,
  };
}

/**
 * Derive a stable string key from a StalenessEffect for accumulator tracking.
 * Uses the target type + relevant identifiers.
 */
function effectKey(effect: StalenessEffect): string {
  const t = effect.target;
  switch (t.type) {
    case 'holistic':
      return `holistic:${t.section}`;
    case 'paragraph':
      return `paragraph:${t.index}`;
    case 'sentence':
      return `sentence:${t.paragraph}:${t.sentence}`;
    case 'connections':
      return `connections:${t.connectionIds.sort().join(',')}`;
    case 'north_star':
      return 'north_star';
    case 'entanglements':
      return 'entanglements';
  }
}

/**
 * Staleness strength ordering for upgrade comparisons.
 * Higher index = stronger staleness.
 */
const STRENGTH_ORDER: StalenessStrength[] = ['weak', 'moderate', 'strong'];

function strengthIndex(s: StalenessStrength): number {
  return STRENGTH_ORDER.indexOf(s);
}

/**
 * Merge a StalenessEffect into the StalenessAccumulator.
 * If the same area is already tracked at a weaker level, upgrade it.
 */
function mergeEffect(acc: StalenessAccumulator, effect: StalenessEffect): void {
  const key = effectKey(effect);
  const incoming = effect.strength;

  // Determine the current highest strength for this key
  let current: StalenessStrength | null = null;
  if (acc.strongStale.has(key)) {
    current = 'strong';
  } else if (acc.moderateStale.has(key)) {
    current = 'moderate';
  } else if (acc.weakStale.has(key)) {
    current = 'weak';
  }

  // If current is already stronger or equal, no upgrade needed
  if (current !== null && strengthIndex(current) >= strengthIndex(incoming)) {
    return;
  }

  // Remove from weaker sets before adding to the correct one
  if (current === 'weak') {
    acc.weakStale.delete(key);
  } else if (current === 'moderate') {
    acc.moderateStale.delete(key);
  }

  // Insert at the correct level
  switch (incoming) {
    case 'strong':
      acc.strongStale.add(key);
      break;
    case 'moderate':
      acc.moderateStale.add(key);
      break;
    case 'weak':
      acc.weakStale.add(key);
      break;
  }
}

/**
 * Serialize a StalenessAccumulator to a JSON-safe plain object.
 * Set<string> fields serialize to {} in JSON, so convert them to arrays.
 * Call this before any persistence or logging of the accumulator.
 */
export function serializeStalenessAccumulator(acc: StalenessAccumulator): {
  strongStale: string[];
  moderateStale: string[];
  weakStale: string[];
  totalEdits: number;
  transformativeCount: number;
  significantCount: number;
  moderateCount: number;
} {
  return {
    strongStale: [...acc.strongStale],
    moderateStale: [...acc.moderateStale],
    weakStale: [...acc.weakStale],
    totalEdits: acc.totalEdits,
    transformativeCount: acc.transformativeCount,
    significantCount: acc.significantCount,
    moderateCount: acc.moderateCount,
  };
}

/**
 * Derive a human-readable label for a staleness key (for the brief).
 */
function humanizeStaleKey(key: string): string {
  if (key.startsWith('holistic:')) return `holistic section: ${key.replace('holistic:', '')}`;
  if (key.startsWith('paragraph:')) return `paragraph ${key.replace('paragraph:', '')}`;
  if (key.startsWith('sentence:')) {
    const parts = key.split(':');
    return `sentence ${parts[2]} in paragraph ${parts[1]}`;
  }
  if (key.startsWith('connections:')) return 'connections';
  return key.replace(/_/g, ' ');
}

/**
 * Compute the change scope given the set of changed paragraph indices
 * and total edit count.
 *
 * 'sentence'       — no meaningful changes, or a single edit in one paragraph
 * 'paragraph'      — multiple edits confined to one paragraph
 * 'multi_paragraph'— changes spanning 2-3 paragraphs
 * 'essay_level'    — changes spanning 4+ paragraphs
 */
function computeChangeScope(
  changedParas: number[],
  totalEdits: number
): 'sentence' | 'paragraph' | 'multi_paragraph' | 'essay_level' {
  const uniqueParas = new Set(changedParas).size;
  if (totalEdits === 0) return 'sentence'; // no-op / trivial
  if (uniqueParas === 0) return 'sentence'; // edge case: no paragraph data
  if (uniqueParas >= 4) return 'essay_level';
  if (uniqueParas >= 2) return 'multi_paragraph';
  // All changes in exactly one paragraph:
  if (totalEdits === 1) return 'sentence'; // single edit in one paragraph
  return 'paragraph'; // multiple edits in one paragraph
}

/**
 * W9.1: Compute word-level similarity ratio between two texts.
 * Returns 0.0 (completely different) to 1.0 (identical).
 * Uses a simple word overlap (Jaccard-like) approach — fast, no LLM.
 */
function wordSimilarity(textA: string, textB: string): number {
  if (textA === textB) return 1.0;
  if (textA.length === 0 && textB.length === 0) return 1.0;
  if (textA.length === 0 || textB.length === 0) return 0.0;

  const wordsA = textA.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const wordsB = textB.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  if (wordsA.length === 0 && wordsB.length === 0) return 1.0;
  if (wordsA.length === 0 || wordsB.length === 0) return 0.0;

  // Build frequency maps for order-independent comparison
  const freqA = new Map<string, number>();
  for (const w of wordsA) freqA.set(w, (freqA.get(w) ?? 0) + 1);
  const freqB = new Map<string, number>();
  for (const w of wordsB) freqB.set(w, (freqB.get(w) ?? 0) + 1);

  // Intersection count (min of each word's frequency)
  let intersection = 0;
  for (const [word, countA] of freqA) {
    const countB = freqB.get(word) ?? 0;
    intersection += Math.min(countA, countB);
  }

  // Union count (max of each word's frequency)
  const allWords = new Set([...freqA.keys(), ...freqB.keys()]);
  let union = 0;
  for (const word of allWords) {
    union += Math.max(freqA.get(word) ?? 0, freqB.get(word) ?? 0);
  }

  return union === 0 ? 1.0 : intersection / union;
}

/** W9.1: Generate a unique approach ID. */
let approachCounter = 0;
function generateApproachId(): string {
  return `approach_${Date.now()}_${++approachCounter}`;
}

// ============================================================================
// VERSION TRACKER
// ============================================================================

export class VersionTracker {
  private activeVersion: ActiveVersion | null = null;
  private completedVersions: VersionRecord[] = [];

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  /**
   * Initialize the tracker for a new essay session.
   *
   * @param baselineText  - The essay text at the start of the first version.
   * @param analysisVersion - Optional: if the essay already has prior versions,
   *                          start numbering from this value. Default: starts at 1.
   */
  initialize(baselineText: string, analysisVersion?: number): void {
    const versionNumber = analysisVersion ?? this.completedVersions.length + 1;

    this.activeVersion = {
      version: versionNumber,
      startedAt: new Date().toISOString(),
      baselineText,
      currentText: baselineText,
      changes: [],
      insightsSinceLastVersion: [],
      lightTouchAdjustments: [],
      accumulatedStaleness: createEmptyStalenessAccumulator(),
      approaches: [],
      currentApproachId: null,
    };

    console.log(
      `[VersionTracker] Initialized version ${versionNumber} at ${this.activeVersion.startedAt}`
    );
  }

  // --------------------------------------------------------------------------
  // RECORDING METHODS
  // --------------------------------------------------------------------------

  /**
   * Record an edit and its LLM-derived understanding.
   * Updates currentText and merges staleness effects into the accumulator.
   *
   * Must be called after initialize().
   */
  recordEdit(editOutput: EditUnderstandingOutput, currentText: string): void {
    if (!this.activeVersion) {
      throw new Error(
        '[VersionTracker] recordEdit called before initialize(). Call initialize() first.'
      );
    }

    const { diff, understanding, stalenessEffects } = editOutput;

    // Build a PendingChange for each sentence-level change in the diff
    // so we can do per-location net-change computation later.
    // If diff has no sentence changes (essay-level rewrite), create one paragraph-level entry.
    let changesAdded = 0;

    for (const paraChange of diff.paragraphChanges) {
      if (paraChange.sentenceChanges.length === 0) {
        // Paragraph-level change (e.g., added/removed paragraph)
        const change: PendingChange = {
          timestamp: new Date().toISOString(),
          location: { paragraph: paraChange.paragraphIndex },
          oldText: '',
          newText: '',
          understanding,
        };
        this.activeVersion.changes.push(change);
        changesAdded++;
      } else {
        for (const sentChange of paraChange.sentenceChanges) {
          if (sentChange.changeType === 'unchanged') continue;
          const change: PendingChange = {
            timestamp: new Date().toISOString(),
            location: {
              paragraph: paraChange.paragraphIndex,
              sentence: sentChange.sentenceIndex,
            },
            oldText: sentChange.oldText ?? '',
            newText: sentChange.newText ?? '',
            understanding,
          };
          this.activeVersion.changes.push(change);
          changesAdded++;
        }
      }
    }

    // If diff had no granular changes (shouldn't happen, but be defensive)
    if (changesAdded === 0 && diff.paragraphChanges.length === 0) {
      const change: PendingChange = {
        timestamp: new Date().toISOString(),
        location: { paragraph: 0 },
        oldText: this.activeVersion.currentText,
        newText: currentText,
        understanding,
      };
      this.activeVersion.changes.push(change);
    }

    // Update current text
    this.activeVersion.currentText = currentText;

    // ── Reversion Detection ──
    // If the student has edited the text back to the baseline (full reversion),
    // clear ALL accumulated staleness — the essay is back where it started.
    // This prevents false triggers when a student experiments and then undoes.
    if (currentText === this.activeVersion.baselineText) {
      console.log(
        '[VersionTracker] Full reversion detected — clearing accumulated staleness'
      );
      this.activeVersion.accumulatedStaleness = createEmptyStalenessAccumulator();

      // W9.1: Mark current approach as abandoned on full reversion
      if (this.activeVersion.currentApproachId) {
        const currentApproach = this.activeVersion.approaches.find(
          a => a.id === this.activeVersion!.currentApproachId
        );
        if (currentApproach) {
          currentApproach.abandoned = true;
          console.log(`[VersionTracker] Approach ${currentApproach.id} abandoned (full reversion)`);
        }
        this.activeVersion.currentApproachId = null;
      }

      // Preserve the change records (they document the journey) but reset counters.
      return;
    }

    // Update significance counters
    const acc = this.activeVersion.accumulatedStaleness;
    acc.totalEdits++;
    switch (understanding.significance) {
      case 'transformative':
        acc.transformativeCount++;
        break;
      case 'significant':
        acc.significantCount++;
        break;
      case 'moderate':
        acc.moderateCount++;
        break;
      // 'minor' intentionally not counted in named buckets
    }

    // Merge staleness effects
    for (const effect of stalenessEffects) {
      mergeEffect(acc, effect);
    }

    // ── W9.1: Approach Tracking ──
    // Detect partial reversions: if currentText is becoming MORE similar to the baseline
    // than the previous text was, the student may be reverting toward an earlier state.
    this.trackApproach(currentText, understanding.apparentPurpose);
  }

  /**
   * Record a ConversationInsight ID collected during this version.
   */
  recordConversationInsight(insightId: string): void {
    if (!this.activeVersion) {
      throw new Error(
        '[VersionTracker] recordConversationInsight called before initialize().'
      );
    }
    this.activeVersion.insightsSinceLastVersion.push(insightId);
  }

  /**
   * Record a light-touch profile adjustment (no re-analysis needed).
   */
  recordLightTouchAdjustment(
    field: string,
    adjustment: string,
    source: 'conversation' | 'edit_workshop'
  ): void {
    if (!this.activeVersion) {
      throw new Error(
        '[VersionTracker] recordLightTouchAdjustment called before initialize().'
      );
    }
    this.activeVersion.lightTouchAdjustments.push({
      field,
      adjustment,
      source,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // TRIGGER EVALUATION
  // --------------------------------------------------------------------------

  /**
   * Evaluate whether accumulated changes warrant a re-analysis.
   *
   * Trigger conditions (ANY sufficient):
   * - >= 1 transformative change
   * - >= 2 significant changes
   * - >= 4 moderate changes (compounding effect)
   * - >= 1 change with scope 'comprehensive' or 'targeted_holistic_refresh'
   * - > 70% of paragraphs changed (broad essay rework)
   * - > 3 hours since baselineText and changes exist
   */
  shouldTriggerReanalysis(): ReanalysisTrigger {
    if (!this.activeVersion) {
      return { shouldTrigger: false, reason: 'No active version', urgency: 'low' };
    }

    const av = this.activeVersion;
    const acc = av.accumulatedStaleness;

    // No changes → no trigger
    if (av.changes.length === 0) {
      return { shouldTrigger: false, reason: 'No changes accumulated', urgency: 'low' };
    }

    // Condition 1: transformative change
    if (acc.transformativeCount >= 1) {
      console.log('[VersionTracker] Reanalysis trigger: transformative change detected');
      return {
        shouldTrigger: true,
        reason: `Transformative change detected (${acc.transformativeCount} total)`,
        urgency: 'high',
      };
    }

    // Condition 2: 2+ significant changes
    if (acc.significantCount >= 2) {
      console.log('[VersionTracker] Reanalysis trigger: 2+ significant changes');
      return {
        shouldTrigger: true,
        reason: `${acc.significantCount} significant changes accumulated`,
        urgency: 'high',
      };
    }

    // Condition 3: 4+ moderate changes (compounding)
    if (acc.moderateCount >= 4) {
      console.log('[VersionTracker] Reanalysis trigger: 4+ moderate changes');
      return {
        shouldTrigger: true,
        reason: `${acc.moderateCount} moderate changes (compounding effect)`,
        urgency: 'medium',
      };
    }

    // Condition 4: any change with broad scope recommendation
    const hasBroadScope = av.changes.some((c) => {
      const scope = c.understanding?.scopeRecommendation?.scope;
      return scope === 'comprehensive' || scope === 'targeted_holistic_refresh';
    });
    if (hasBroadScope) {
      console.log('[VersionTracker] Reanalysis trigger: broad scope recommendation');
      return {
        shouldTrigger: true,
        reason: 'Change requires comprehensive or holistic re-analysis scope',
        urgency: 'high',
      };
    }

    // Condition 5: > 70% of paragraphs changed
    const changedParas = new Set(av.changes.map((c) => c.location.paragraph));
    // Use current text paragraph count as the denominator — baseline underestimates
    // if paragraphs were added during the session, which inflates changeRatio.
    const estimatedTotalParas = Math.max(
      1,
      av.currentText.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    );
    const changeRatio = changedParas.size / estimatedTotalParas;
    if (changeRatio > 0.7) {
      console.log(
        `[VersionTracker] Reanalysis trigger: ${Math.round(changeRatio * 100)}% of paragraphs changed`
      );
      return {
        shouldTrigger: true,
        reason: `${Math.round(changeRatio * 100)}% of paragraphs have changes (broad rework)`,
        urgency: 'high',
      };
    }

    // Condition 6: > 3 hours since baseline was set and there are changes
    const startedAt = new Date(av.startedAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - startedAt) / (1000 * 60 * 60);
    if (hoursElapsed > 3 && av.changes.length > 0) {
      console.log(`[VersionTracker] Reanalysis trigger: ${hoursElapsed.toFixed(1)}h elapsed`);
      return {
        shouldTrigger: true,
        reason: `${hoursElapsed.toFixed(1)} hours elapsed with ${av.changes.length} pending changes`,
        urgency: 'low',
      };
    }

    return {
      shouldTrigger: false,
      reason: 'Change volume below all trigger thresholds',
      urgency: 'low',
    };
  }

  // --------------------------------------------------------------------------
  // BRIEF GENERATION
  // --------------------------------------------------------------------------

  /**
   * Generate a compact ReanalysisBrief for the re-analysis pipeline.
   * No LLM call — pure data synthesis.
   *
   * Uses net-change computation: collapses all changes per (paragraph, sentence)
   * into a single A→B entry, marking reversions if detected.
   */
  generateReanalysisBrief(): ReanalysisBrief {
    if (!this.activeVersion) {
      return this.buildEmptyBrief();
    }

    const av = this.activeVersion;

    // --- Significance ordering for max computation ---
    const SIGNIFICANCE_ORDER: Record<string, number> = {
      trivial: 0, minor: 1, moderate: 2, significant: 3, transformative: 4,
    };

    // --- Net change computation ---
    // Group changes by location key, tracking ALL changes per location for max significance.
    const grouped = new Map<
      string,
      { first: PendingChange; last: PendingChange; allChanges: PendingChange[]; count: number }
    >();

    for (const change of av.changes) {
      const key = locationKey(change.location);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { first: change, last: change, allChanges: [change], count: 1 });
      } else {
        existing.last = change;
        existing.allChanges.push(change);
        existing.count++;
      }
    }

    const netChanges: ReanalysisBrief['netChanges'] = [];
    const changedParagraphIndices: number[] = [];
    let hasReordering = false;
    let hasInsertions = false;
    let hasDeletions = false;

    for (const [, group] of grouped) {
      const { first, last } = group;
      const netOld = first.oldText;
      const netNew = last.newText;
      const reverted = netOld === netNew && group.count > 1;

      // Detect structural changes from understanding
      const understanding = last.understanding;
      if (understanding) {
        const ct = understanding.changeType;
        if (ct === 'reorder') hasReordering = true;
        if (ct === 'addition') hasInsertions = true;
        if (ct === 'deletion') hasDeletions = true;
      } else {
        // Fallback: infer from empty texts
        if (netOld === '' && netNew !== '') hasInsertions = true;
        if (netOld !== '' && netNew === '') hasDeletions = true;
      }

      changedParagraphIndices.push(first.location.paragraph);

      // Use MAX significance across all changes in this group, not just the last.
      // If edit 1 is 'transformative' (A→B) and edit 2 is 'minor' (B→C),
      // net significance reflects the transformative impact (A→C can be transformative).
      const maxSignificance = group.allChanges.reduce<string>((max, c) => {
        const curr = c.understanding?.significance ?? 'minor';
        return (SIGNIFICANCE_ORDER[curr] ?? 1) > (SIGNIFICANCE_ORDER[max] ?? 1) ? curr : max;
      }, 'minor');

      netChanges.push({
        location: first.location,
        oldText: netOld,
        newText: netNew,
        significance: maxSignificance,
        changeType: understanding?.changeType ?? 'content_change',
        ...(reverted ? { appearsToHaveReverted: true } : {}),
      });
    }

    // --- Structural summary ---
    const uniqueChangedParas = [...new Set(changedParagraphIndices)].sort((a, b) => a - b);
    const changeScope = computeChangeScope(changedParagraphIndices, av.changes.length);

    const structural: ReanalysisBrief['structural'] = {
      paragraphsChanged: uniqueChangedParas,
      hasReordering,
      hasInsertions,
      hasDeletions,
      changeScope,
    };

    // --- Student intent ---
    // Gather intent from intentAnnotations in changes (conversation context)
    const intentParts = av.changes
      .filter((c) => c.intentAnnotation)
      .map((c) => c.intentAnnotation as string)
      .filter((s, i, arr) => arr.indexOf(s) === i); // deduplicate
    const studentIntent = intentParts.length > 0 ? intentParts.join('; ') : undefined;

    // --- Cap netChanges at 20 most significant (overflow protection for 100+ edits) ---
    // The brief targets <500 tokens — unbounded netChanges exceed that for heavy edit sessions.
    const MAX_NET_CHANGES = 20;
    const sortedNetChanges = [...netChanges].sort(
      (a, b) =>
        (SIGNIFICANCE_ORDER[b.significance] ?? 1) - (SIGNIFICANCE_ORDER[a.significance] ?? 1)
    );
    const cappedNetChanges = sortedNetChanges.slice(0, MAX_NET_CHANGES);
    const wasTruncated = netChanges.length > MAX_NET_CHANGES;
    if (wasTruncated) {
      console.warn(
        `[VersionTracker] netChanges capped at ${MAX_NET_CHANGES} (had ${netChanges.length}) — oldest/least significant dropped.`
      );
    }

    // --- Stale areas (prioritized: strong > moderate > weak) ---
    const acc = av.accumulatedStaleness;
    const staleAreas: string[] = [
      ...[...acc.strongStale].map(humanizeStaleKey),
      ...[...acc.moderateStale].map(humanizeStaleKey),
      ...[...acc.weakStale].map(humanizeStaleKey),
    ];

    // --- W9.3: Approach context for re-analysis prompts ---
    const approachContext = this.getApproachContext();

    // --- Summary for prompt (~300 tokens max) ---
    let summaryForPrompt = this.buildSummaryForPrompt(
      cappedNetChanges,
      structural,
      staleAreas,
      studentIntent,
      av.accumulatedStaleness,
      wasTruncated ? netChanges.length : undefined
    );

    // Append approach context to the summary if available
    if (approachContext) {
      summaryForPrompt += `\n\n--- Edit Strategy Context ---\n${approachContext}`;
    }

    return {
      netChanges: cappedNetChanges,
      structural,
      studentIntent,
      staleAreas,
      summaryForPrompt,
      ...(wasTruncated ? { truncated: true } : {}),
      ...(approachContext ? { approachContext } : {}),
    };
  }

  // --------------------------------------------------------------------------
  // VERSION CLOSE
  // --------------------------------------------------------------------------

  /**
   * Seal the active version into a VersionRecord and start a new active version.
   *
   * @param analysisText - The essay text as of this analysis checkpoint.
   *                       This becomes the baseline for the next version.
   * @returns The sealed VersionRecord.
   */
  closeVersion(analysisText: string): VersionRecord {
    if (!this.activeVersion) {
      throw new Error('[VersionTracker] closeVersion called before initialize().');
    }

    const av = this.activeVersion;

    // Seal into a VersionRecord (matches profileTypes.ts exactly)
    const sealed: VersionRecord = {
      version: av.version,
      snapshotText: analysisText,
      analyzedAt: new Date().toISOString(),
      changes: av.changes.map((c) => ({
        timestamp: c.timestamp,
        location: c.location,
        oldText: c.oldText,
        newText: c.newText,
        understanding: c.understanding,
        intentAnnotation: c.intentAnnotation,
      })),
      insightsSinceLastVersion: [...av.insightsSinceLastVersion],
      lightTouchAdjustments: av.lightTouchAdjustments.map((a) => ({
        field: a.field,
        adjustment: a.adjustment,
        source: a.source,
      })),
      accumulatedStaleness: serializeStalenessAccumulator(av.accumulatedStaleness),
      // W9.1/W9.2: Preserve approach tracking data in the sealed version
      approaches: av.approaches.length > 0 ? [...av.approaches] : undefined,
      editStrategy: this.detectEditStrategy(),
    };

    this.completedVersions.push(sealed);

    console.log(
      `[VersionTracker] Closed version ${av.version} — ${av.changes.length} changes, ` +
        `${av.insightsSinceLastVersion.length} insights, ` +
        `${av.approaches.length} approaches tracked. ` +
        `Starting version ${av.version + 1}.`
    );

    // Start fresh active version
    this.activeVersion = {
      version: av.version + 1,
      startedAt: new Date().toISOString(),
      baselineText: analysisText,
      currentText: analysisText,
      changes: [],
      insightsSinceLastVersion: [],
      lightTouchAdjustments: [],
      accumulatedStaleness: createEmptyStalenessAccumulator(),
      approaches: [],
      currentApproachId: null,
    };

    return sealed;
  }

  // --------------------------------------------------------------------------
  // ACCESSORS
  // --------------------------------------------------------------------------

  getActiveVersion(): ActiveVersion {
    if (!this.activeVersion) {
      throw new Error('[VersionTracker] getActiveVersion called before initialize().');
    }
    return this.activeVersion;
  }

  getCompletedVersions(): VersionRecord[] {
    return this.completedVersions;
  }

  getAccumulatedStaleness(): StalenessAccumulator {
    if (!this.activeVersion) {
      throw new Error('[VersionTracker] getAccumulatedStaleness called before initialize().');
    }
    return this.activeVersion.accumulatedStaleness;
  }

  // --------------------------------------------------------------------------
  // W9.2: EDIT STRATEGY DETECTION (programmatic — no LLM)
  // --------------------------------------------------------------------------

  /**
   * Detect the student's editing strategy pattern from accumulated changes.
   * Returns null if there aren't enough changes to determine a pattern (< 2 edits).
   *
   * Detection rules (evaluated in priority order):
   * - Reversion detected + new edit afterward → 'experimenting_with_alternatives'
   * - All edits on paragraph 0 → 'iterating_on_opening_voice'
   * - Edits span 3+ unique paragraphs → 'restructuring_argument'
   * - Edits on a single non-opening paragraph → 'polishing_specific_section'
   */
  detectEditStrategy(): EditStrategyPattern | null {
    if (!this.activeVersion) return null;

    const av = this.activeVersion;
    if (av.changes.length < 2) return null;

    // Check for experimentation: any abandoned approach followed by a new one
    const hasAbandonedApproach = av.approaches.some(a => a.abandoned);
    const hasActiveApproach = av.currentApproachId !== null;
    if (hasAbandonedApproach && hasActiveApproach) {
      return 'experimenting_with_alternatives';
    }

    // Gather unique paragraph indices from all changes
    const changedParas = new Set<number>();
    for (const change of av.changes) {
      changedParas.add(change.location.paragraph);
    }

    // All edits concentrated on paragraph 0 (the opening)
    if (changedParas.size === 1 && changedParas.has(0)) {
      return 'iterating_on_opening_voice';
    }

    // Edits span 3+ paragraphs → restructuring
    if (changedParas.size >= 3) {
      return 'restructuring_argument';
    }

    // Edits on a single non-opening paragraph
    if (changedParas.size === 1 && !changedParas.has(0)) {
      return 'polishing_specific_section';
    }

    // 2 paragraphs changed — not enough signal for a clear pattern
    return null;
  }

  // --------------------------------------------------------------------------
  // W9.3: CROSS-VERSION APPROACH CONTEXT
  // --------------------------------------------------------------------------

  /**
   * Build a formatted context block describing approaches and edit strategy
   * for injection into re-analysis prompts and coaching prompts.
   *
   * Returns null if no approach data exists.
   */
  getApproachContext(): string | null {
    if (!this.activeVersion) return null;

    const av = this.activeVersion;
    if (av.approaches.length === 0) return null;

    const parts: string[] = [];

    // Edit strategy pattern
    const strategy = this.detectEditStrategy();
    if (strategy) {
      const strategyLabels: Record<EditStrategyPattern, string> = {
        'iterating_on_opening_voice': 'Iterating on opening/voice',
        'restructuring_argument': 'Restructuring the argument',
        'polishing_specific_section': 'Polishing a specific section',
        'experimenting_with_alternatives': 'Experimenting with alternatives',
      };
      parts.push(`Edit strategy: ${strategyLabels[strategy]}`);
    }

    // Active approach
    const activeApproach = av.approaches.find(a => a.id === av.currentApproachId);
    if (activeApproach) {
      parts.push(`Current approach: ${activeApproach.description}`);
    }

    // Abandoned approaches
    const abandoned = av.approaches.filter(a => a.abandoned);
    if (abandoned.length > 0) {
      parts.push(
        `Abandoned approaches (${abandoned.length}): ` +
        abandoned.map(a => a.description).join('; ')
      );
    }

    // Include completed version approaches if available
    if (this.completedVersions.length > 0) {
      const lastVersion = this.completedVersions[this.completedVersions.length - 1];
      if (lastVersion.approaches && lastVersion.approaches.length > 0) {
        const prevAbandoned = lastVersion.approaches.filter(a => a.abandoned);
        if (prevAbandoned.length > 0) {
          parts.push(
            `Previously abandoned approaches (version ${lastVersion.version}): ` +
            prevAbandoned.map(a => a.description).join('; ')
          );
        }
      }
    }

    return parts.length > 0 ? parts.join('\n') : null;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  /**
   * W9.1: Track editing approaches within the active version.
   *
   * Detects partial reversions by comparing the new text's similarity to the baseline.
   * If the text becomes >20% MORE similar to the baseline than it was before this edit,
   * the student is likely reverting. When detected:
   * - Current approach is marked abandoned
   * - A new approach is created and linked via nextApproach
   *
   * @param currentText  The essay text after this edit
   * @param purpose      The apparent purpose of the edit (from EditUnderstanding)
   */
  private trackApproach(currentText: string, purpose: string): void {
    if (!this.activeVersion) return;

    const av = this.activeVersion;
    const baseline = av.baselineText;

    // Compute similarity to baseline BEFORE and AFTER the edit.
    // We need the previous text — which is the text before this edit was applied.
    // av.currentText was already updated to currentText, so we look at the
    // second-to-last change's newText (or baseline if only one change exists).
    const previousText = av.changes.length >= 2
      ? av.changes[av.changes.length - 2].newText || baseline
      : baseline;

    const prevSimilarity = wordSimilarity(previousText, baseline);
    const currSimilarity = wordSimilarity(currentText, baseline);

    // Detect partial reversion: similarity to baseline increased by >20%
    const similarityDelta = currSimilarity - prevSimilarity;
    const isPartialReversion = similarityDelta > 0.20 && av.currentApproachId !== null;

    if (isPartialReversion) {
      // Mark current approach as abandoned
      const currentApproach = av.approaches.find(a => a.id === av.currentApproachId);
      if (currentApproach) {
        currentApproach.abandoned = true;

        // Create a new approach and link from the abandoned one
        const newApproach: EditApproach = {
          id: generateApproachId(),
          description: purpose || 'Reverting toward earlier version',
          snapshotText: currentText,
          abandoned: false,
        };
        currentApproach.nextApproach = newApproach.id;
        av.approaches.push(newApproach);
        av.currentApproachId = newApproach.id;

        console.log(
          `[VersionTracker] Partial reversion detected (similarity delta +${(similarityDelta * 100).toFixed(1)}%). ` +
          `Approach ${currentApproach.id} abandoned → new approach ${newApproach.id}`
        );
      }
    } else if (av.currentApproachId === null && av.changes.length >= 1) {
      // First meaningful edit — create the initial approach
      const approach: EditApproach = {
        id: generateApproachId(),
        description: purpose || 'Initial editing approach',
        snapshotText: currentText,
        abandoned: false,
      };
      av.approaches.push(approach);
      av.currentApproachId = approach.id;
    } else if (av.currentApproachId !== null) {
      // Update current approach's snapshot text
      const currentApproach = av.approaches.find(a => a.id === av.currentApproachId);
      if (currentApproach) {
        currentApproach.snapshotText = currentText;
      }
    }
  }

  private buildEmptyBrief(): ReanalysisBrief {
    return {
      netChanges: [],
      structural: {
        paragraphsChanged: [],
        hasReordering: false,
        hasInsertions: false,
        hasDeletions: false,
        changeScope: 'sentence',
      },
      staleAreas: [],
      summaryForPrompt: 'No changes accumulated since last analysis.',
    };
  }

  private buildSummaryForPrompt(
    netChanges: ReanalysisBrief['netChanges'],
    structural: ReanalysisBrief['structural'],
    staleAreas: string[],
    studentIntent: string | undefined,
    acc: StalenessAccumulator,
    totalBeforeCap?: number
  ): string {
    const parts: string[] = [];

    // Change count + significance breakdown
    const nonReverted = netChanges.filter((c) => !c.appearsToHaveReverted);
    const reverted = netChanges.filter((c) => c.appearsToHaveReverted);

    if (nonReverted.length === 0 && reverted.length > 0) {
      parts.push(`${reverted.length} change(s) were made and reverted — net text unchanged.`);
    } else if (nonReverted.length > 0) {
      const significanceCounts: Partial<Record<string, number>> = {};
      for (const c of nonReverted) {
        significanceCounts[c.significance] = (significanceCounts[c.significance] ?? 0) + 1;
      }
      const sigSummary = Object.entries(significanceCounts)
        .map(([sig, count]) => `${count} ${sig}`)
        .join(', ');
      parts.push(`${nonReverted.length} net change(s): ${sigSummary}.`);
    } else {
      parts.push('No net changes detected.');
    }

    // Structural scope
    parts.push(
      `Scope: ${structural.changeScope.replace('_', ' ')} ` +
        `(${structural.paragraphsChanged.length} paragraph(s) affected).`
    );

    if (structural.hasInsertions) parts.push('Includes new content insertions.');
    if (structural.hasDeletions) parts.push('Includes content deletions.');
    if (structural.hasReordering) parts.push('Includes paragraph reordering.');

    // Student intent
    if (studentIntent) {
      const trimmedIntent =
        studentIntent.length > 120 ? studentIntent.slice(0, 117) + '...' : studentIntent;
      parts.push(`Student intent: "${trimmedIntent}"`);
    }

    // Top stale areas (cap at 5 for brevity)
    if (staleAreas.length > 0) {
      const topStale = staleAreas.slice(0, 5);
      parts.push(
        `Priority re-analysis areas: ${topStale.join(', ')}${staleAreas.length > 5 ? `, +${staleAreas.length - 5} more` : ''}.`
      );
    }

    // Significance summary from accumulator
    if (acc.transformativeCount > 0) {
      parts.push(`[FLAG] ${acc.transformativeCount} transformative change(s) — full re-analysis recommended.`);
    } else if (acc.significantCount > 0) {
      parts.push(`${acc.significantCount} significant change(s) detected.`);
    }

    // Truncation notice (shown only if netChanges was capped for token budget)
    if (totalBeforeCap !== undefined) {
      parts.push(`(Showing top 20 of ${totalBeforeCap} total changes, sorted by significance.)`);
    }

    return parts.join(' ');
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Factory convenience function for creating a VersionTracker.
 * VersionTracker is stateful per essay session — do NOT use a singleton.
 */
export function createVersionTracker(baselineText: string): VersionTracker {
  const tracker = new VersionTracker();
  tracker.initialize(baselineText);
  return tracker;
}
