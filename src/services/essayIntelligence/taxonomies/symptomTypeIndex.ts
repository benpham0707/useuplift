/**
 * Port B2a — SymptomDiagnoser 29-type Taxonomy Index
 *
 * Extracts the 29 named failure-mode archetypes from the V1 narrative-workshop
 * `symptomDiagnoser.ts` (authoritative source) into a closed enum catalog
 * consumed by L3.5 `AnalysisPass`. The taxonomy is the cognitive content
 * ported — the per-type "WHY IT FAILS" research citations (Harry Bauld,
 * 8-second attention window, peak-end rule, etc.) stay server-side in the
 * R&D source and are looked up at L5 via `symptomType` when B2b (the
 * role-branched router) lands.
 *
 * Scope breakdown (matches verdict §3 Port B2):
 *   • 9 opening archetypes   — hook / opener-specific failure modes
 *   • 14 closing archetypes  — ending / conclusion-specific failure modes
 *   • 6 cross-dimensional    — generic narrative weaknesses applicable anywhere
 *
 * Scope is retained as routing metadata for B2b (the L5 role-branched router
 * will dispatch opening-scoped rewrites differently from closing-scoped ones).
 * B2a itself uses scope only as a prompt-instruction nudge (opening sentences
 * should prefer opening_* types), not as a runtime assertion.
 *
 * Authoritative source:
 *   src/services/narrativeWorkshop/analyzers/symptomDiagnoser.ts:29-177
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port B2 + §8 preservation.
 */

export type SymptomScope = 'opening' | 'closing' | 'cross_dim';

export interface SymptomDefinition {
  /** snake_case enum value — stable contract between L3.5 emission and L5 lookup */
  type: string;
  /** Routing metadata — which paragraph role this archetype normally lands on */
  scope: SymptomScope;
  /** ≤100-char structural one-liner describing the failure mode (no research citations) */
  definition: string;
}

// ---------------------------------------------------------------------------
// 29-type catalog
// ---------------------------------------------------------------------------
// ORDER MATTERS ONLY for readability in prompt rendering (opening → closing →
// cross_dim). Consumers should treat the list as an unordered set and look up
// by `type`. Bumping B2_SYMPTOM_TAXONOMY in PROMPT_BLOCK_VERSIONS is required
// when this list changes (add/remove/rename), since the catalog text lands
// in the cached L3.5 prompt body.

export const SYMPTOM_CATALOG: readonly SymptomDefinition[] = [
  // --- 9 opening archetypes -------------------------------------------------
  {
    type: 'dictionary_definition_opening',
    scope: 'opening',
    definition: 'Opens with a dictionary or encyclopedia definition rather than the writer\'s own voice.',
  },
  {
    type: 'childhood_opening_cliche',
    scope: 'opening',
    definition: 'Opens with "Ever since I was young" or equivalent childhood-memory framing.',
  },
  {
    type: 'famous_quote_opening',
    scope: 'opening',
    definition: 'Opens by quoting a famous figure (Gandhi, Einstein, Obama, etc.) instead of the writer.',
  },
  {
    type: 'rhetorical_question_flat',
    scope: 'opening',
    definition: 'Opens with a generic rhetorical question ("Have you ever wondered...?").',
  },
  {
    type: 'thesis_statement_opening',
    scope: 'opening',
    definition: 'Opens with academic thesis framing ("This essay will discuss...", "I am a person who...").',
  },
  {
    type: 'melodramatic_opening',
    scope: 'opening',
    definition: 'Opens with generic foreshadowing ("Little did I know my life would change forever").',
  },
  {
    type: 'generic_scene_setting',
    scope: 'opening',
    definition: 'Opens with elaborate scene description disconnected from the story being told.',
  },
  {
    type: 'weak_opening',
    scope: 'opening',
    definition: 'Generic opening that does not create engagement or urgency for the reader.',
  },
  {
    type: 'generic_opening',
    scope: 'opening',
    definition: 'Opening that could apply to anyone\'s essay — fails the "swap the name" test.',
  },

  // --- 14 closing archetypes ------------------------------------------------
  {
    type: 'weak_ending',
    scope: 'closing',
    definition: 'General ending that leaves no lasting impression or memory.',
  },
  {
    type: 'abrupt_ending',
    scope: 'closing',
    definition: 'Ends too suddenly without emotional or structural closure.',
  },
  {
    type: 'anticlimactic_ending',
    scope: 'closing',
    definition: 'Does not deliver on the emotional peak the essay has built toward.',
  },
  {
    type: 'summary_conclusion',
    scope: 'closing',
    definition: 'Rehashes what was already said ("In conclusion, I learned that...").',
  },
  {
    type: 'preachy_ending',
    scope: 'closing',
    definition: 'Ends with moral lesson stated explicitly ("This taught me the importance of...").',
  },
  {
    type: 'generic_ending',
    scope: 'closing',
    definition: 'Could apply to anyone\'s essay — loses the specificity that personalized the body.',
  },
  {
    type: 'excited_to_attend_ending',
    scope: 'closing',
    definition: 'Ends with "I can\'t wait to attend [University]" or equivalent college-lust framing.',
  },
  {
    type: 'sudden_pivot_ending',
    scope: 'closing',
    definition: 'Abruptly pivots to college mention with no organic connection to the narrative.',
  },
  {
    type: 'false_resolution_ending',
    scope: 'closing',
    definition: 'Claims a problem is fully solved when the narrative showed otherwise.',
  },
  {
    type: 'career_announcement_ending',
    scope: 'closing',
    definition: 'Ends with "That\'s when I decided to become a doctor/lawyer/engineer."',
  },
  {
    type: 'overexplained_ending',
    scope: 'closing',
    definition: 'Tells the reader exactly what to think and feel about the essay.',
  },
  {
    type: 'repetitive_ending',
    scope: 'closing',
    definition: 'Repeats content or phrases from earlier in the essay rather than extending them.',
  },
  {
    type: 'abstract_ending',
    scope: 'closing',
    definition: 'Ends with vague abstractions instead of a concrete image or moment.',
  },
  {
    type: 'academic_ending',
    scope: 'closing',
    definition: 'Ends with thesis-conclusion wrap-up appropriate for argumentative, not personal, essays.',
  },

  // --- 6 cross-dimensional types -------------------------------------------
  {
    type: 'abstract_language',
    scope: 'cross_dim',
    definition: 'Uses abstractions (success, passion, values) without concrete sensory or factual anchors.',
  },
  {
    type: 'passive_agency',
    scope: 'cross_dim',
    definition: 'Events happen to the narrator ("I was tasked", "Ideas flowed") rather than driven by them.',
  },
  {
    type: 'cliche_metaphor',
    scope: 'cross_dim',
    definition: 'Relies on overused comparisons (puzzles, journeys, doors opening, keys unlocking).',
  },
  {
    type: 'telling_not_showing',
    scope: 'cross_dim',
    definition: 'Summarizes events ("I worked hard") instead of depicting them through scene or action.',
  },
  {
    type: 'generic_pacing',
    scope: 'cross_dim',
    definition: 'Flat sentence structure with uniform cadence that kills narrative momentum.',
  },
  {
    type: 'weak_verb',
    scope: 'cross_dim',
    definition: 'Leans on "to be" or static verbs instead of action verbs that carry meaning.',
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup index (O(1) membership test)
// ---------------------------------------------------------------------------

export const SYMPTOM_INDEX: Map<string, SymptomDefinition> = new Map(
  SYMPTOM_CATALOG.map((entry) => [entry.type, entry]),
);

/**
 * Runtime guard — is this string one of the 29 known symptom types?
 * Used by L3.5 `validateAndTransform` to coerce unknown LLM emissions onto
 * the OpenEnum escape hatch (`symptomTypeOpen`).
 */
export function isKnownSymptomType(s: string): boolean {
  return SYMPTOM_INDEX.has(s);
}

/**
 * Render the catalog as prompt-body lines for injection into the L3.5
 * system prompt. One line per entry, grouped by scope for readability.
 * The scope headers are structural only — they help the LLM route a
 * sentence's symptom emission to the scoped archetypes when applicable
 * (opening sentences prefer opening_* types, etc.).
 *
 * Content is deterministic (no template variables) so the block version
 * marker in PROMPT_BLOCK_VERSIONS cleanly gates Anthropic cache-key
 * divergence on catalog edits.
 */
export function getSymptomCatalogLines(): string {
  const byScope: Record<SymptomScope, SymptomDefinition[]> = {
    opening: [],
    closing: [],
    cross_dim: [],
  };
  for (const entry of SYMPTOM_CATALOG) {
    byScope[entry.scope].push(entry);
  }

  const renderGroup = (label: string, entries: SymptomDefinition[]): string => {
    const head = `**${label}** (${entries.length}):`;
    const body = entries.map((e) => `- \`${e.type}\` — ${e.definition}`).join('\n');
    return `${head}\n${body}`;
  };

  return [
    renderGroup('OPENING archetypes', byScope.opening),
    renderGroup('CLOSING archetypes', byScope.closing),
    renderGroup('CROSS-DIMENSIONAL weaknesses', byScope.cross_dim),
  ].join('\n\n');
}

/**
 * Scope-partition helper (exported for tests + future B2b router).
 * Avoids consumers having to filter the catalog themselves and keeps
 * the scope-count invariants (9 / 14 / 6) discoverable at the type layer.
 */
export function getSymptomTypesByScope(scope: SymptomScope): SymptomDefinition[] {
  return SYMPTOM_CATALOG.filter((e) => e.scope === scope);
}
