/**
 * Port B2a — L3.5 SymptomTaxonomy prompt-block builder
 *
 * Produces the `B2_SYMPTOM_TAXONOMY` block body that gets appended to the
 * L3.5 `AnalysisPass` system prompt before the OUTPUT FORMAT section. The
 * block is wrapped by `withPromptBlockVersion(..., 'B2_SYMPTOM_TAXONOMY')`
 * so its content version seeds a distinct cache key — bumping the slot in
 * PROMPT_BLOCK_VERSIONS invalidates just this block's slice of the cached
 * system prompt rather than forcing a full cache miss.
 *
 * Authoring convention (Wave-1b.5):
 *   The prompt body below is tagged `// @prompt-block B2_SYMPTOM_TAXONOMY`
 *   on the line immediately above the template literal. The descriptive-
 *   contract lint discovers the tag, looks up B2_SYMPTOM_TAXONOMY's declared
 *   level (`evaluative`) in PROMPT_BLOCK_DECLARATIONS, and skips forbidden-
 *   vocabulary scanning — L3.5 is evaluative territory.
 *
 * What the block contains:
 *   1. A brief role sentence explaining the taxonomy's purpose for L3.5.
 *   2. The 29 catalog entries rendered by `getSymptomCatalogLines()`
 *      (grouped into OPENING / CLOSING / CROSS-DIMENSIONAL).
 *   3. A `missing_elements` note — when a symptom is emitted, the LLM MAY
 *      additionally surface what's ABSENT (sensory_details, concrete_objects,
 *      micro_moment, emotional_truth). This is the positive schema from the
 *      V1 symptomDiagnoser (lines 148-162) and is LLM-first compatible
 *      (positive, not prescriptive).
 *   4. Emission contract — how `symptomType` + `symptomTypeOpen` relate in
 *      the sentenceAnalyses output (schema extension is documented in the
 *      OUTPUT FORMAT section of analysisPass.ts itself).
 *
 * What the block deliberately does NOT contain:
 *   • The "WHY IT FAILS" research citations from the V1 source — those live
 *     server-side for L5 rewrite routing once B2b lands. Injecting them at
 *     L3.5 would bloat the cached prompt without helping the classification
 *     step.
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port B2 + §8 preservation.
 */

import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';
import {
  getSymptomCatalogLines,
  SYMPTOM_CATALOG,
} from './symptomTypeIndex';

// @prompt-block B2_SYMPTOM_TAXONOMY
const SYMPTOM_TAXONOMY_BODY = `## SYMPTOM TAXONOMY (29 named failure modes)

When a sentence carries a structural failure mode that matches one of the 29 archetypes below, emit its snake_case name in the sentence's \`symptomType\` field. This names the failure pattern concretely so downstream coaching can route to the right rewrite guidance. Emit at most one type per sentence — the most load-bearing one if several apply.

If the sentence carries a structural failure mode that is real but does NOT fit any of the 29 archetypes, emit a free-text description in \`symptomTypeOpen\` instead. This is the OpenEnum escape hatch — do not force a sentence into an archetype that doesn't fit. If the sentence has no structural symptom (it's working, or its issues are local-craft only, not archetypal), leave BOTH fields null.

${getSymptomCatalogLines()}

### Scope routing guidance

- A sentence whose paragraph role is \`opening\` SHOULD prefer an \`opening_*\` archetype when one fits. It MAY carry a CROSS-DIMENSIONAL archetype when the symptom is genuinely scope-agnostic.
- A sentence whose paragraph role is \`closing\` SHOULD prefer a \`closing_*\` / \`*_ending\` archetype when one fits. It MAY carry a CROSS-DIMENSIONAL archetype when applicable.
- Body-paragraph sentences typically carry CROSS-DIMENSIONAL archetypes when they carry any symptom.
- These are preferences, not hard rules — a closing sentence can still exhibit \`abstract_language\` (cross-dim) and should be marked as such when that's the load-bearing issue.

### Missing-element note (positive schema)

When you emit a \`symptomType\` or \`symptomTypeOpen\`, you MAY also surface what is structurally ABSENT from the sentence in your \`weaknesses[].observation\` field. The four absence categories are:

- **sensory_details** — specific sights, sounds, textures, physical details missing
- **concrete_objects** — numbers, ages, specific objects, or proper nouns missing
- **micro_moment** — a single grounding scene or moment that would anchor the abstraction
- **emotional_truth** — a feeling being told rather than shown through action or reaction

This is diagnostic metadata, not prescription — you are noting what's absent, not telling the writer what to add. L5 will convert absences into prescriptive rewrites.`;

/**
 * Build the B2 symptom-taxonomy prompt block, wrapped with block-version
 * markers for cache-key divergence on catalog bumps.
 *
 * Deterministic — takes no arguments. The block body is fully static (the
 * 29-entry catalog is the single source of truth). This makes it a pure
 * cacheable extension to the L3.5 system prompt.
 */
export function buildSymptomTaxonomyBlock(): string {
  return withPromptBlockVersion(SYMPTOM_TAXONOMY_BODY, 'B2_SYMPTOM_TAXONOMY');
}

/**
 * Re-export catalog for tests + future B2b consumers that want the
 * structured list rather than the rendered prompt text.
 */
export { SYMPTOM_CATALOG };
