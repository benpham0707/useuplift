/**
 * coachingPlanner.ts — Phase 2 core: pick ONE ImprovementEntry per turn,
 * enforce cross-turn principle rotation, record what was taught.
 *
 * WHY THIS EXISTS
 *   The V2 audit blind-spot report found the coach teaching "be specific"
 *   5 turns in a row (with 0.0% wordform overlap — the existing anti-
 *   repetition metric is measuring strings, not pedagogical payload). The
 *   root cause is that `buildImprovementQueueSection()` unconditionally picked
 *   `active[0]` — always the highest-priority item, no awareness of what the
 *   coach already taught.
 *
 *   This module adds that awareness as a pure, unit-testable function. The
 *   planner returns a DeploymentSelection; the coaching service integrates
 *   that selection into the prompt and, after the turn, calls
 *   `recordDeployment` to update the session's `taughtLedger`.
 *
 * MANIFEST CONSUMPTION GAP (April 2026 audit fix)
 *   The pre-fix planner rotated by principle category alone, with zero
 *   awareness of impact tier, item source, surface-by deadlines, or whether
 *   the item carried a routed technique. The audit found that of 12 manifest
 *   items per session (~$0.69 in L4 cost) only 3-4 ever surfaced — 9 silently
 *   dropped, including transformative items (delete-P5) and red_flag clichés.
 *
 *   The new selection logic enforces a four-stage gate (in order of
 *   precedence):
 *     1. Force-surface: any untaught red_flag/howler item past its
 *        `surfaceByTurn` deadline jumps to front, ignoring tier and category.
 *     2. Impact-tier gating (hard rule): pool restricted to the highest tier
 *        present in the untaught set — transformative > significant >
 *        incremental.
 *     3. Within the chosen tier, prefer items whose principleCategory is NOT
 *        in the last 3 turns' ledger (existing rotation logic).
 *     4. Within the rotation pool, prefer items with a non-null `technique`
 *        field — improves the Q6 technique-fire rate by ensuring the prompt
 *        always carries a routed vocabulary handle when one exists.
 *
 * DESIGN CONSTRAINTS (from the user's testing philosophy)
 *   - Zero LLM calls: pure TypeScript functions, deterministic, unit-testable
 *     against synthetic inputs for $0 and <1ms per call.
 *   - Additive: does not mutate manifest items, only reads. Coaching service
 *     calls through it; if the planner returns null, buildImprovementQueueSection
 *     falls back to existing behavior (defensive regression guard).
 *   - Loud on ambiguity: when no priority remains, selection returns null and
 *     the prompt falls back to "all addressed" mode.
 *
 * @see profileTypes.ts `TaughtEntry` `PrincipleCategory` `ImprovementEntry.surfaceByTurn`
 * @see V2 audit blind-spot hunter report (April 2026)
 */

import type {
  ImprovementEntry,
  ImprovementManifest,
  CoachingSessionMemory,
  TaughtEntry,
  PrincipleCategory,
} from '../profileTypes';

// ═══════════════════════════════════════════════════════════════════════════
// TECHNIQUE → PRINCIPLE CATEGORY
//
// Coarser than issue types, finer than "craft vs content." Used to rotate
// the coach across different pedagogical categories per turn so that a
// student doesn't get "be specific" five different ways.
// ═══════════════════════════════════════════════════════════════════════════

const TECHNIQUE_TO_PRINCIPLE: Record<string, PrincipleCategory> = {
  // scene_grounding family
  'SUMMARY-TO-SCENE':                    'scene_grounding',
  'COLD OPEN / SENSORY TIMESTAMP':       'scene_grounding',
  'SCENE EXPANSION':                     'scene_grounding',
  'SHOW THROUGH SPECIFIC ACTION':        'scene_grounding',
  'FUNCTIONAL DETAIL':                   'scene_grounding',

  // evidence_anchoring family
  'EVIDENCE ANCHORING':                  'evidence_anchoring',
  'COLLABORATIVE SPECIFICITY':           'evidence_anchoring',

  // voice_authenticity family
  'VOICE COMPARISON':                    'voice_authenticity',
  'VOICE AUTHENTICITY':                  'voice_authenticity',
  'DEFINITIONAL PIVOT':                  'voice_authenticity',

  // narrative_structure family
  'NARRATIVE ARC':                       'narrative_structure',
  'BRIDGE SENTENCE':                     'narrative_structure',
  'ENACTED PARALLEL':                    'narrative_structure',
  'INCREMENTAL REVELATION':              'narrative_structure',
  'ANTI-LESSON':                         'narrative_structure',

  // character_presence family
  'NAMED CHARACTER':                     'character_presence',

  // craft_compression family
  'RITUAL DETAIL / BOOKEND INVERSION':   'craft_compression',

  // emotional_stakes family
  'SOMATIC VULNERABILITY':               'emotional_stakes',
  'SUSTAINED VULNERABILITY':             'emotional_stakes',
  'STAKES ESTABLISHMENT':                'emotional_stakes',
};

/** Default category for items without a recognized technique */
const DEFAULT_PRINCIPLE: PrincipleCategory = 'thematic_coherence';

export function inferPrincipleCategory(item: ImprovementEntry): PrincipleCategory {
  if (item.technique && TECHNIQUE_TO_PRINCIPLE[item.technique]) {
    return TECHNIQUE_TO_PRINCIPLE[item.technique];
  }
  // Source-based fallback — L4 priorities that target paragraph 0 with
  // no technique are structural/thematic; red flags are character presence.
  if (item.source === 'red_flag') return 'character_presence';
  if (item.paragraph === -1) return 'thematic_coherence';
  return DEFAULT_PRINCIPLE;
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECTION
// ═══════════════════════════════════════════════════════════════════════════

export interface DeploymentSelection {
  /** The ImprovementEntry chosen for this turn */
  item: ImprovementEntry;
  /** Inferred principle category for rotation tracking */
  principleCategory: PrincipleCategory;
  /** Why this item was picked (for telemetry + prompt rationale) */
  selectionReason:
    | 'first_unaddressed'       // fallback: default first-in-queue behavior
    | 'category_rotation'       // picked to avoid repeating a prior category
    | 'only_remaining'          // only one item left to deploy
    | 'force_surface'           // red_flag/howler past surfaceByTurn deadline
    | 'impact_tier_gate'        // selected by tier-gating (transformative > significant > incremental)
    | 'technique_preference';   // selected within tier because it carries a routed technique
  /** Other items still unaddressed and untaught, for NEXT IN QUEUE block */
  remaining: ImprovementEntry[];
}

/** Tiers in descending priority. Used by impact-tier gating. */
const IMPACT_TIERS: ReadonlyArray<ImprovementEntry['impact']> = [
  'transformative',
  'significant',
  'incremental',
];

/**
 * Sources that should be force-surfaced when their `surfaceByTurn` deadline
 * has elapsed. red_flag covers both AO red flags and howler-pass cliché /
 * factual / structural red-flag items (howlers are projected with
 * `source: 'red_flag'` by analysisOrchestrator).
 */
const FORCE_SURFACE_SOURCES: ReadonlySet<ImprovementEntry['source']> = new Set([
  'red_flag',
]);

/**
 * Select the next improvement to deploy this turn.
 *
 * Algorithm (executed in this order):
 *   0. Drop items already 'addressed' in improvementProgress.
 *   1. FORCE-SURFACE: any untaught red_flag/howler item past its
 *      `surfaceByTurn` deadline jumps to the front, bypassing tier + category.
 *   2. IMPACT-TIER GATE: restrict the untaught pool to the highest tier
 *      present (transformative → significant → incremental).
 *   3. CATEGORY ROTATION: within the chosen tier, prefer an item whose
 *      principleCategory is NOT in the last 3 turns' ledger.
 *   4. TECHNIQUE PREFERENCE: within the rotation pool, prefer items with
 *      a non-null `technique` field (improves Q6 technique-fire rate).
 *   5. If nothing in `untaught`, fall back to retaught items (better than
 *      no coaching).
 *
 * Returns null if nothing is available (all addressed — surfaces "revision
 * plan" mode in the prompt).
 */
export function selectNextDeployment(
  manifest: ImprovementManifest,
  memory: CoachingSessionMemory,
): DeploymentSelection | null {
  if (!manifest || manifest.items.length === 0) return null;

  const progress = memory.improvementProgress ?? {};
  const ledger = memory.taughtLedger ?? {};

  // Drop already-addressed items (end of coaching on that item).
  const unaddressed = manifest.items.filter((i) => {
    const status = progress[i.id] ?? 'queued';
    return status !== 'addressed';
  });

  if (unaddressed.length === 0) return null;

  // Split by whether already in the ledger (taught but not addressed).
  const untaught = unaddressed.filter((i) => !(i.id in ledger));
  const retaught = unaddressed.filter((i) => i.id in ledger);

  // The next turn's number (1-based) for surface-by deadline checks.
  // memory.turnCount is the count of completed turns; the turn about to be
  // emitted is turnCount + 1.
  const nextTurn = (memory.turnCount ?? 0) + 1;

  // ── Stage 1: FORCE-SURFACE deadline ──────────────────────────────────────
  // Any untaught red_flag/howler item whose `surfaceByTurn` has elapsed
  // jumps to the front. This prevents IMP_11/IMP_12-style cliché items from
  // silently aging out of selection while category-rotation prefers other
  // items.
  const overdue = untaught.filter(
    (i) =>
      FORCE_SURFACE_SOURCES.has(i.source) &&
      typeof i.surfaceByTurn === 'number' &&
      nextTurn > i.surfaceByTurn,
  );
  if (overdue.length > 0) {
    // Among overdue items, pick by lowest priority number (highest priority).
    // Tie-break: prefer items with a routed technique (Q6 fire rate).
    const sortedOverdue = [...overdue].sort((a, b) => {
      const techDelta = (a.technique ? 0 : 1) - (b.technique ? 0 : 1);
      if (techDelta !== 0) return techDelta;
      return a.priority - b.priority;
    });
    const selected = sortedOverdue[0];
    return {
      item: selected,
      principleCategory: inferPrincipleCategory(selected),
      selectionReason: 'force_surface',
      remaining: unaddressed.filter((i) => i.id !== selected.id),
    };
  }

  // ── Stage 2 + 3 + 4: tier gating → category rotation → technique pref ──
  let selected: ImprovementEntry | undefined;
  let reason: DeploymentSelection['selectionReason'] = 'first_unaddressed';

  if (untaught.length > 0) {
    // Recent principle categories from the ledger — used for rotation.
    const ledgerEntries = Object.values(ledger);
    const recentCategories = new Set(
      ledgerEntries
        .sort((a, b) => b.turn - a.turn)
        .slice(0, 3) // look back at last 3 turns
        .map((e) => e.principleCategory),
    );

    // Tier gate: select highest non-empty tier from `untaught`.
    let tierPool: ImprovementEntry[] = [];
    let tierUsed: ImprovementEntry['impact'] | null = null;
    for (const tier of IMPACT_TIERS) {
      const candidates = untaught.filter((i) => i.impact === tier);
      if (candidates.length > 0) {
        tierPool = candidates;
        tierUsed = tier;
        break;
      }
    }
    // Defensive: if no item has a recognized impact tier (shouldn't happen
    // given the type), fall through to the full untaught set.
    if (tierPool.length === 0) tierPool = untaught;

    // Within tier, apply category rotation.
    const fresh = tierPool.filter(
      (i) => !recentCategories.has(inferPrincipleCategory(i)),
    );
    const rotationPool = fresh.length > 0 && ledgerEntries.length > 0 ? fresh : tierPool;

    // Within rotation pool, prefer items with a routed technique.
    const withTechnique = rotationPool.filter((i) => !!i.technique);
    const finalPool = withTechnique.length > 0 ? withTechnique : rotationPool;

    // Tie-break by priority (lower = higher priority).
    selected = [...finalPool].sort((a, b) => a.priority - b.priority)[0];

    // Determine reason — most-specific stage that actually filtered.
    if (untaught.length === 1) {
      reason = 'only_remaining';
    } else if (
      withTechnique.length > 0 &&
      withTechnique.length < rotationPool.length
    ) {
      reason = 'technique_preference';
    } else if (fresh.length > 0 && ledgerEntries.length > 0 && fresh.length < tierPool.length) {
      reason = 'category_rotation';
    } else if (tierUsed && tierPool.length < untaught.length) {
      reason = 'impact_tier_gate';
    } else {
      reason = 'first_unaddressed';
    }
  } else if (retaught.length > 0) {
    // Everything has been taught at least once; fall back to the
    // highest-priority one that isn't addressed. Coach gets a second bite.
    selected = retaught[0];
    reason = 'only_remaining';
  }

  if (!selected) return null;

  const principleCategory = inferPrincipleCategory(selected);
  const remaining = unaddressed.filter((i) => i.id !== selected!.id);

  return { item: selected, principleCategory, selectionReason: reason, remaining };
}

// ═══════════════════════════════════════════════════════════════════════════
// RECORDING
// ═══════════════════════════════════════════════════════════════════════════

export interface RecordDeploymentInput {
  selection: DeploymentSelection;
  /** 1-based turn number that just completed */
  turn: number;
  /** Coach's response text — used to decide explicit vs contextual mode */
  responseText: string;
}

/**
 * Record that a deployment happened. Mutates memory.taughtLedger in place.
 * Called by the coaching service after a turn completes.
 *
 * Deployment mode:
 *   - 'explicit': coach's response mentions the technique name verbatim
 *     (signaling it was the primary lesson)
 *   - 'contextual': item was in the DEPLOY slot but coach pivoted or didn't
 *     name the technique (e.g., student changed topic)
 */
export function recordDeployment(
  memory: CoachingSessionMemory,
  input: RecordDeploymentInput,
): void {
  if (!memory.taughtLedger) memory.taughtLedger = {};
  const { selection, turn, responseText } = input;
  const tech = selection.item.technique;
  const techniqueNamedInResponse =
    !!tech && responseText.toUpperCase().includes(tech.toUpperCase());
  const mode: TaughtEntry['deploymentMode'] = techniqueNamedInResponse ? 'explicit' : 'contextual';
  memory.taughtLedger[selection.item.id] = {
    turn,
    technique: tech,
    principleCategory: selection.principleCategory,
    deploymentMode: mode,
    impId: selection.item.id,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TELEMETRY HELPERS — for the final scorecard
// ═══════════════════════════════════════════════════════════════════════════

/** Count distinct principle categories taught across the session. */
export function categoryDiversity(memory: CoachingSessionMemory): {
  distinctCategories: number;
  totalDeployments: number;
  diversityRatio: number;
  perCategoryCount: Record<PrincipleCategory, number>;
} {
  const ledger = memory.taughtLedger ?? {};
  const entries = Object.values(ledger);
  const perCat: Partial<Record<PrincipleCategory, number>> = {};
  for (const e of entries) {
    perCat[e.principleCategory] = (perCat[e.principleCategory] ?? 0) + 1;
  }
  const distinct = Object.keys(perCat).length;
  return {
    distinctCategories: distinct,
    totalDeployments: entries.length,
    diversityRatio: entries.length > 0 ? distinct / entries.length : 0,
    perCategoryCount: perCat as Record<PrincipleCategory, number>,
  };
}
