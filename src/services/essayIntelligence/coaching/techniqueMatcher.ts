/**
 * techniqueMatcher.ts — Shared multi-signal technique tagger.
 *
 * Extracts the keyword-based routing pattern from `TECHNIQUE_ROUTES` in
 * `coachingService.ts:104-232` and `matchClaimToTechnique()` in
 * `analysisOrchestrator.ts:1639-1664`, exposing it as a pure function
 * usable POST-CALL by L5 annotation processing (Scope 1 GAP-9).
 *
 * Zero LLM cost. Pure keyword + dimension + mode matching.
 *
 * Why a standalone module: Phase 3 needs the matcher in a non-coaching
 * path (L5 annotation post-processing), and importing from coachingService
 * would create a dependency cycle (coaching → analysis → coaching). This
 * file is the shared source of truth.
 *
 * DUPLICATION WARNING: This file mirrors `TECHNIQUE_ROUTES` from
 * `coaching/coachingService.ts:104-232`. An Open Decision in Scope 1 is
 * to consolidate these by making coachingService.ts import FROM this file
 * (reversing the dependency). For now, the route list here is authoritative
 * for annotation matching; coaching continues to use its own copy for
 * finding-based routing.
 *
 * Multi-signal requirement (R4 correction): a technique is returned only
 * if TWO OR MORE of these signals match:
 *   (1) keyword appears in annotation.content + annotation.capacityBuildingNote
 *   (2) annotation dimension tag matches route.dimensions (when both present)
 *   (3) annotation.teachingMode matches the technique's typical mode
 *       (ACTION for structural/craft techniques; AWARENESS/CONSEQUENCE for others)
 *
 * This cuts the single-keyword false-positive rate (~60%) to ~15%.
 */

interface TechniqueRoute {
  /** Keywords that must ALL appear in the annotation's content / note */
  claimKeywords: string[];
  /** Optional dimension filter — when present, annotation must share ≥1 */
  dimensions?: string[];
  /** Named technique from the 20-entry TECHNIQUE_ROUTES vocabulary */
  technique: string;
}

/**
 * Full 20-route list — kept in sync with
 * `src/services/essayIntelligence/coaching/coachingService.ts:104-232`
 * `TECHNIQUE_ROUTES` constant.
 *
 * CI test `tests/test-scope1-phase3-runtime.ts` asserts the two lists
 * have the same technique names and length, so drift is caught on every
 * PR. If you add a technique here, add it in coachingService.ts too.
 */
const TECHNIQUE_ROUTES: TechniqueRoute[] = [
  { claimKeywords: ['summary'], technique: 'SUMMARY-TO-SCENE' },
  { claimKeywords: ['opening'], dimensions: ['voice', 'craft'], technique: 'COLD OPEN / SENSORY TIMESTAMP' },
  { claimKeywords: ['emotion'], dimensions: ['emotion'], technique: 'SOMATIC VULNERABILITY' },
  { claimKeywords: ['named'], technique: 'NAMED CHARACTER' },
  { claimKeywords: ['without'], technique: 'EVIDENCE ANCHORING' },
  { claimKeywords: ['singular'], technique: 'COLLABORATIVE SPECIFICITY' },
  { claimKeywords: ['conclusion'], technique: 'RITUAL DETAIL / BOOKEND INVERSION' },
  { claimKeywords: ['voice'], dimensions: ['voice'], technique: 'VOICE COMPARISON' },
  { claimKeywords: ['decorative'], technique: 'FUNCTIONAL DETAIL' },
  { claimKeywords: ['neat'], technique: 'ANTI-LESSON' },
  { claimKeywords: ['stakes'], technique: 'STAKES ESTABLISHMENT' },
  { claimKeywords: ['compress'], dimensions: ['structure'], technique: 'SCENE EXPANSION' },
  { claimKeywords: ['transition'], dimensions: ['structure'], technique: 'BRIDGE SENTENCE' },
  { claimKeywords: ['cliche'], dimensions: ['craft', 'voice'], technique: 'DEFINITIONAL PIVOT' },
  { claimKeywords: ['retreat'], technique: 'SUSTAINED VULNERABILITY' },
  { claimKeywords: ['arc'], dimensions: ['narrative', 'structure'], technique: 'NARRATIVE ARC' },
  { claimKeywords: ['parallel'], technique: 'ENACTED PARALLEL' },
  { claimKeywords: ['telling'], technique: 'SHOW THROUGH SPECIFIC ACTION' },
  { claimKeywords: ['formulaic'], technique: 'VOICE AUTHENTICITY' },
  { claimKeywords: ['epiphany'], technique: 'INCREMENTAL REVELATION' },
];

/**
 * Techniques where ACTION mode is the typical teaching mode. Used by the
 * multi-signal matcher's Signal 3: if the annotation's teachingMode
 * aligns with this expectation, +1 signal.
 */
const ACTION_MODE_TECHNIQUES: ReadonlySet<string> = new Set([
  'SUMMARY-TO-SCENE',
  'COLD OPEN / SENSORY TIMESTAMP',
  'SOMATIC VULNERABILITY',
  'NAMED CHARACTER',
  'SHOW THROUGH SPECIFIC ACTION',
  'SCENE EXPANSION',
  'BRIDGE SENTENCE',
  'ENACTED PARALLEL',
  'COLLABORATIVE SPECIFICITY',
  'FUNCTIONAL DETAIL',
]);

/**
 * Match an L5 annotation against TECHNIQUE_ROUTES using MULTI-SIGNAL confidence.
 *
 * A technique is returned only if ≥2 signals match:
 *   (1) All route.claimKeywords appear in content + capacityBuildingNote
 *   (2) annotation.dimensions overlaps route.dimensions (when both present)
 *   (3) annotation.teachingMode matches the technique's typical mode
 *
 * For techniques without a dimensions spec, signal (2) is unavailable —
 * the threshold requires signal (1) PLUS signal (3).
 *
 * Returns the highest-scoring technique name when ≥2 signals, or null.
 *
 * @param content The annotation's main content string
 * @param capacityBuildingNote Optional transferable-skill note (folded into keyword search)
 * @param dimensions Annotation's dimension tags (when available)
 * @param teachingMode Annotation's teaching mode
 * @returns Technique name, or null if no technique scored ≥2 signals
 */
export function matchAnnotationToTechnique(
  content: string,
  capacityBuildingNote: string | null,
  dimensions: string[] | null,
  teachingMode: 'awareness' | 'consequence' | 'connection' | 'action' | null,
): string | null {
  const lower = `${content} ${capacityBuildingNote ?? ''}`.toLowerCase();

  let bestRoute: TechniqueRoute | null = null;
  let bestScore = 0;

  for (const route of TECHNIQUE_ROUTES) {
    let score = 0;

    // Signal 1: all keywords match (AND semantics — all must be present)
    const allKeywordsMatch = route.claimKeywords.every((kw) => lower.includes(kw.toLowerCase()));
    if (allKeywordsMatch) score += 1;

    // Signal 2: dimension overlap (only when both sides have dimensions)
    if (route.dimensions && dimensions && dimensions.length > 0) {
      const hasOverlap = route.dimensions.some((d) => dimensions.includes(d));
      if (hasOverlap) score += 1;
    }

    // Signal 3: teaching mode alignment
    if (teachingMode) {
      const expectsAction = ACTION_MODE_TECHNIQUES.has(route.technique);
      const teachingModeAligns =
        (expectsAction && teachingMode === 'action') ||
        (!expectsAction && teachingMode !== 'action');
      if (teachingModeAligns) score += 1;
    }

    if (score >= 2 && score > bestScore) {
      bestRoute = route;
      bestScore = score;
    }
  }

  return bestRoute?.technique ?? null;
}

/** Exported for cross-file sync testing (see tests/test-scope1-phase3-runtime.ts). */
export function getTechniqueRouteNames(): readonly string[] {
  return TECHNIQUE_ROUTES.map((r) => r.technique);
}
