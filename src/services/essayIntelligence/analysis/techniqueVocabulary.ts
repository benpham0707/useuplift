/**
 * techniqueVocabulary.ts — Shared technique enum for LLM prompt injection.
 *
 * Single source of truth for the 20-entry technique vocabulary that gets
 * injected into L3, L3.5, and L3.75 system prompts in Phase 5. The LLM
 * picks from this list (or emits null) when filling
 * `ImprovementCandidate.technique` inline during the deep walk, analysis
 * pass, and holistic synthesis.
 *
 * DUPLICATION WARNING: this list mirrors `TECHNIQUE_ROUTES` in
 * `coaching/coachingService.ts:104-232` and the route list in
 * `coaching/techniqueMatcher.ts` (Phase 3). An Open Decision in Scope 2
 * flags consolidating the three via a reverse import from this file.
 *
 * For now, the canonical source is `coachingService.ts:TECHNIQUE_ROUTES`
 * and this file must stay in lockstep. CI test
 * `tests/test-scope2-technique-vocab-sync.ts` (Phase 4 gate) asserts the
 * lengths + names match, so drift is caught on every PR.
 *
 * Phase 4 (Scope 2 infrastructure). Consumed by Phase 5 layer prompts.
 */

/**
 * The 20 named craft techniques students can learn through coaching.
 *
 * Ordered to match `TECHNIQUE_ROUTES` in `coachingService.ts:104-232`.
 * When adding a technique, add it to both files AND update the sync test.
 */
export const TECHNIQUE_VOCABULARY_LIST: readonly string[] = [
  'SUMMARY-TO-SCENE',
  'COLD OPEN / SENSORY TIMESTAMP',
  'SOMATIC VULNERABILITY',
  'NAMED CHARACTER',
  'EVIDENCE ANCHORING',
  'COLLABORATIVE SPECIFICITY',
  'RITUAL DETAIL / BOOKEND INVERSION',
  'VOICE COMPARISON',
  'FUNCTIONAL DETAIL',
  'ANTI-LESSON',
  'STAKES ESTABLISHMENT',
  'SCENE EXPANSION',
  'BRIDGE SENTENCE',
  'DEFINITIONAL PIVOT',
  'SUSTAINED VULNERABILITY',
  'NARRATIVE ARC',
  'ENACTED PARALLEL',
  'SHOW THROUGH SPECIFIC ACTION',
  'VOICE AUTHENTICITY',
  'INCREMENTAL REVELATION',
] as const;

/**
 * Prompt-ready vocabulary block for injection into L3/L3.5/L3.75 system
 * prompts. Rendered once at module load; cached with the system prompt so
 * it costs only one set of cache-write tokens per day.
 *
 * Rules are explicit: (1) pick at most one technique, (2) null when no
 * standard technique cleanly applies — never force a match, (3) names
 * are case-sensitive and must be emitted exactly.
 */
export const TECHNIQUE_VOCABULARY_PROMPT_BLOCK = `TECHNIQUE VOCABULARY (for improvementCandidate.technique field only; pick one or set to null):
${TECHNIQUE_VOCABULARY_LIST.join(' | ')}

Rules:
- Pick at most ONE technique per candidate.
- If no standard technique cleanly applies, use null — never force a match.
- The technique names are case-sensitive — emit the exact uppercase strings above.`;

/**
 * Runtime validator: does `name` match a known technique?
 *
 * Used by candidate parsers in L3/L3.5/L3.75 to normalize LLM output.
 * Null is also valid (LLM opted not to assign a technique). Any other
 * string falls back to null rather than carrying through as an
 * unrecognized technique name.
 */
export function isValidTechnique(name: string | null | undefined): boolean {
  if (name === null || name === undefined) return true;
  return (TECHNIQUE_VOCABULARY_LIST as readonly string[]).includes(name);
}

/**
 * Normalize an arbitrary string to a valid technique name or null.
 *
 * Attempts exact match first, then case-insensitive match, then returns
 * null. Prefer over direct `isValidTechnique` checks when you need to
 * handle LLM case drift ("Summary-To-Scene" → "SUMMARY-TO-SCENE").
 */
export function normalizeTechnique(name: string | null | undefined): string | null {
  if (name === null || name === undefined) return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;

  // Exact match
  if ((TECHNIQUE_VOCABULARY_LIST as readonly string[]).includes(trimmed)) {
    return trimmed;
  }

  // Case-insensitive fallback
  const upper = trimmed.toUpperCase();
  for (const tech of TECHNIQUE_VOCABULARY_LIST) {
    if (tech.toUpperCase() === upper) return tech;
  }

  return null;
}
