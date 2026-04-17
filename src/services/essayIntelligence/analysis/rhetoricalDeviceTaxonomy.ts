/**
 * Rhetorical Device Taxonomy — Round 7b Phase 2
 *
 * Curated closed-set taxonomy of rhetorical devices the L3.5 analysis pass
 * may detect per-paragraph, plus a normalizer that maps raw LLM strings
 * to the canonical set (with an 'other' escape hatch), and a validator
 * that filters trivially-bad instances at the parser.
 *
 * This file is prompt-facing: the taxonomy block is embedded in the L3.5
 * system prompt so the LLM sees the exact choice set. Changes here ripple
 * into prompt text through the exported string block.
 *
 * Design discipline:
 *   - Closed set of canonical types; 'other' is the ONLY escape hatch.
 *   - Normalizer is CONSERVATIVE — unknown strings → 'other', never a
 *     guessed-close canonical. The LLM then supplies `deviceName` for
 *     free-text identification on 'other' instances.
 *   - Validator is EVIDENCE-ORIENTED — a device instance with no quote
 *     or a trivial/generic effect is dropped. The floor is quote + effect,
 *     not confidence or depth.
 *
 * Consumed by: analysisPass.ts (parser, prompt) and holisticSynthesis.ts
 * (subset validation, dominant device computation).
 */

import type {
  RhetoricalDeviceType,
  RhetoricalDeviceInstance,
} from '../profileTypes';

// ============================================================================
// TAXONOMY
// ============================================================================

export interface RhetoricalDeviceDescriptor {
  displayName: string;
  category: 'structural' | 'sentence_level' | 'tropic' | 'tonal' | 'other';
  oneLineDescription: string;
}

/**
 * Canonical taxonomy. The LLM sees this set; every emitted deviceType is
 * normalized against it. The descriptions are deliberately SHORT and
 * discriminative — enough to let the LLM pick the right type, not enough to
 * seduce it into over-detection.
 */
export const RHETORICAL_DEVICE_TAXONOMY: Record<RhetoricalDeviceType, RhetoricalDeviceDescriptor> = {
  // ── Structural (essay-level or across-sentences) ────────────────────────
  callback: {
    displayName: 'Callback',
    category: 'structural',
    oneLineDescription: 'A later passage deliberately echoes an earlier image, phrase, or move, creating recognition.',
  },
  circular_frame: {
    displayName: 'Circular frame',
    category: 'structural',
    oneLineDescription: 'The ending returns to the opening, recontextualizing it rather than merely repeating.',
  },
  juxtaposition: {
    displayName: 'Juxtaposition',
    category: 'structural',
    oneLineDescription: 'Two contrasting images, ideas, or registers placed adjacently so the tension does the work.',
  },
  parallel_structure: {
    displayName: 'Parallel structure',
    category: 'structural',
    oneLineDescription: 'Repeated grammatical shape across clauses or sentences to build rhythm or equivalence.',
  },
  fragmented_rhythm: {
    displayName: 'Fragmented rhythm',
    category: 'structural',
    oneLineDescription: 'Intentional sentence fragments or staccato cadence that disrupt flow for effect.',
  },
  in_medias_res: {
    displayName: 'In medias res',
    category: 'structural',
    oneLineDescription: 'Opening mid-scene without setup, trusting the reader to orient through action.',
  },
  flashback: {
    displayName: 'Flashback',
    category: 'structural',
    oneLineDescription: 'A break from present narrative to a prior moment that reframes the current one.',
  },
  delayed_reveal: {
    displayName: 'Delayed reveal',
    category: 'structural',
    oneLineDescription: 'A key fact is withheld until late so earlier passages reread differently in hindsight.',
  },

  // ── Sentence-level (syntactic / schematic) ──────────────────────────────
  anaphora: {
    displayName: 'Anaphora',
    category: 'sentence_level',
    oneLineDescription: 'Deliberate repetition of the same word or phrase at the start of successive clauses.',
  },
  epistrophe: {
    displayName: 'Epistrophe',
    category: 'sentence_level',
    oneLineDescription: 'Deliberate repetition of the same word or phrase at the END of successive clauses.',
  },
  zeugma: {
    displayName: 'Zeugma',
    category: 'sentence_level',
    oneLineDescription: 'One verb yokes two objects in different senses (literal + figurative) for economy or wit.',
  },
  asyndeton: {
    displayName: 'Asyndeton',
    category: 'sentence_level',
    oneLineDescription: 'Deliberate omission of conjunctions between list items for speed or emphasis.',
  },
  polysyndeton: {
    displayName: 'Polysyndeton',
    category: 'sentence_level',
    oneLineDescription: 'Deliberate excess of conjunctions to slow rhythm or accumulate weight.',
  },
  chiasmus: {
    displayName: 'Chiasmus',
    category: 'sentence_level',
    oneLineDescription: 'A reversed-parallel structure (A B : B A) that turns an idea in on itself.',
  },

  // ── Tropic (figurative language) ────────────────────────────────────────
  metaphor: {
    displayName: 'Metaphor',
    category: 'tropic',
    oneLineDescription: 'A non-literal comparison that fuses two domains without "like" or "as".',
  },
  extended_metaphor: {
    displayName: 'Extended metaphor',
    category: 'tropic',
    oneLineDescription: 'A metaphor sustained across multiple sentences or paragraphs, its vehicle re-entered.',
  },
  simile: {
    displayName: 'Simile',
    category: 'tropic',
    oneLineDescription: 'An explicit comparison using "like" or "as".',
  },
  hyperbole: {
    displayName: 'Hyperbole',
    category: 'tropic',
    oneLineDescription: 'Deliberate exaggeration for emphasis or comic effect, not meant literally.',
  },
  litotes: {
    displayName: 'Litotes',
    category: 'tropic',
    oneLineDescription: 'Deliberate understatement via double negative ("not unhappy") for restraint or irony.',
  },
  metonymy: {
    displayName: 'Metonymy',
    category: 'tropic',
    oneLineDescription: 'Substitution of a closely-associated thing for the thing itself ("the crown" for the monarch).',
  },
  personification: {
    displayName: 'Personification',
    category: 'tropic',
    oneLineDescription: 'Non-human things given human qualities, action, or agency.',
  },
  synecdoche: {
    displayName: 'Synecdoche',
    category: 'tropic',
    oneLineDescription: 'A part stands in for the whole ("all hands on deck") or whole for part.',
  },

  // ── Tonal ───────────────────────────────────────────────────────────────
  irony: {
    displayName: 'Irony',
    category: 'tonal',
    oneLineDescription: 'A deliberate gap between what is said and what is meant, trusted to the reader.',
  },
  understatement: {
    displayName: 'Understatement',
    category: 'tonal',
    oneLineDescription: 'Deliberate downplaying — the register sits below the weight of what is described.',
  },
  self_effacement: {
    displayName: 'Self-effacement',
    category: 'tonal',
    oneLineDescription: 'The narrator diminishes themselves to let subject, humor, or others carry the line.',
  },
  volta: {
    displayName: 'Volta',
    category: 'tonal',
    oneLineDescription: 'A deliberate tonal or argumentative turn — the essay pivots on its own prior claim.',
  },

  // ── Escape hatch ────────────────────────────────────────────────────────
  other: {
    displayName: 'Other',
    category: 'other',
    oneLineDescription: 'A rhetorical device outside this taxonomy; `deviceName` must be provided.',
  },
};

/**
 * Prompt-facing formatted list of the taxonomy, organized by category.
 * Pasted into the L3.5 system prompt so the LLM sees the closed set.
 */
export function formatTaxonomyForPrompt(): string {
  const byCategory: Record<string, string[]> = {
    structural: [],
    sentence_level: [],
    tropic: [],
    tonal: [],
    other: [],
  };
  for (const [key, desc] of Object.entries(RHETORICAL_DEVICE_TAXONOMY)) {
    byCategory[desc.category].push(`  - ${key}: ${desc.oneLineDescription}`);
  }
  const lines: string[] = [];
  lines.push('STRUCTURAL (essay-level / across-sentence):');
  lines.push(...byCategory.structural);
  lines.push('SENTENCE-LEVEL (syntactic schemes):');
  lines.push(...byCategory.sentence_level);
  lines.push('TROPIC (figurative language):');
  lines.push(...byCategory.tropic);
  lines.push('TONAL:');
  lines.push(...byCategory.tonal);
  lines.push('ESCAPE:');
  lines.push(...byCategory.other);
  return lines.join('\n');
}

// ============================================================================
// NORMALIZER
// ============================================================================

/**
 * Raw-string → canonical RhetoricalDeviceType normalization.
 *
 * Design: CONSERVATIVE. Prefer 'other' to a wrong-but-close canonical.
 * When the LLM hands us a string outside the canonical set, only map to
 * a canonical if the mapping is essentially lossless (case variant,
 * obvious synonym like "metaphorical" → metaphor). Otherwise return
 * 'other' and let the LLM supply `deviceName` for auditing.
 *
 * Mapping rules (documented for auditing):
 *   - Case-insensitive exact match against canonical keys → that key.
 *   - Hyphen/space/underscore variants of canonical keys → canonical key.
 *     (e.g., "in medias res" / "in-medias-res" → "in_medias_res".)
 *   - "metaphorical" → "metaphor" (adjective form).
 *   - "similes" / "simile-like" → "simile" (plural/variant).
 *   - "repetition" → "anaphora" (conservative — most essay repetition the
 *     LLM tags is anaphora-shaped; genuinely non-anaphora repetition is rare
 *     enough that mislabel risk is low and 'other' provides a fallback).
 *   - "antithesis" → 'other' (NOT juxtaposition — antithesis is a stricter
 *     rhetorical form; we preserve the distinction by sending it to 'other'
 *     with deviceName). Documented here; asserted in tests.
 *   - "parallelism" → "parallel_structure" (synonym).
 *   - "frag" / "fragment" / "fragments" → "fragmented_rhythm".
 *   - Anything else → 'other'.
 */
export function normalizeDeviceType(raw: string): RhetoricalDeviceType {
  if (typeof raw !== 'string') return 'other';
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (cleaned.length === 0) return 'other';

  // Exact canonical match (after hyphen/space → underscore normalization)
  if (cleaned in RHETORICAL_DEVICE_TAXONOMY) {
    return cleaned as RhetoricalDeviceType;
  }

  // Explicit variant mappings
  const variants: Record<string, RhetoricalDeviceType> = {
    metaphorical: 'metaphor',
    metaphors: 'metaphor',
    similes: 'simile',
    simile_like: 'simile',
    repetition: 'anaphora',
    repetitions: 'anaphora',
    parallelism: 'parallel_structure',
    parallel: 'parallel_structure',
    frag: 'fragmented_rhythm',
    fragment: 'fragmented_rhythm',
    fragments: 'fragmented_rhythm',
    fragmented: 'fragmented_rhythm',
    ironic: 'irony',
    understated: 'understatement',
    volta_turn: 'volta',
    hyperbolic: 'hyperbole',
    personified: 'personification',
    extended_metaphors: 'extended_metaphor',
    callback_reference: 'callback',
    callbacks: 'callback',
    // "antithesis" intentionally NOT mapped to juxtaposition — sent to 'other'.
  };
  if (cleaned in variants) return variants[cleaned];

  return 'other';
}

// ============================================================================
// INSTANCE VALIDATOR
// ============================================================================

/**
 * Minimum word count for the `effect` field. Below this threshold an
 * instance is considered trivially-generic and dropped at the parser.
 *
 * Rationale: the effect must describe WHAT this device does IN THIS ESSAY —
 * "creates rhythm" (2 words) is generic, "accelerates urgency that you then
 * undercut with the fragment at sentence 6" (14 words) is specific. Six
 * words is the crude floor; genuine effect statements are consistently longer.
 */
const EFFECT_MIN_WORDS = 6;

/**
 * Validate a RhetoricalDeviceInstance. Returns false when the instance is
 * trivially bad and should be dropped by the parser. Logs are emitted at
 * the call site — this function is pure.
 */
export function isValidInstance(instance: RhetoricalDeviceInstance): boolean {
  if (!instance) return false;

  // Location floor
  if (
    typeof instance.location?.paragraph !== 'number' ||
    instance.location.paragraph < 0
  ) {
    return false;
  }
  if (
    !Array.isArray(instance.location.sentences) ||
    instance.location.sentences.length === 0
  ) {
    return false;
  }
  // sentence indices must be non-negative numbers
  for (const s of instance.location.sentences) {
    if (typeof s !== 'number' || s < 0) return false;
  }

  // Quote floor — empty or whitespace-only is garbage
  if (typeof instance.quote !== 'string' || instance.quote.trim().length === 0) {
    return false;
  }

  // Effect floor — empty or trivially generic effect is dropped.
  // B-M2 (Round 7b hardening): stricter specificity rule. An effect is valid
  // when it meets EITHER of:
  //   (a) ≥10 words (more-than-minimum specificity by length), OR
  //   (b) contains a specific location marker (P\d+ or "sentence \d+"),
  //       which proves the LLM anchored the effect to THIS essay's text.
  // The old 6-word floor was too permissive; short effects without location
  // anchors are almost always generic ("creates resonance", "adds rhythm").
  if (typeof instance.effect !== 'string') return false;
  const effectTrimmed = instance.effect.trim();
  if (effectTrimmed.length === 0) return false;
  const effectWordCount = effectTrimmed.split(/\s+/).filter(w => w.length > 0).length;
  if (effectWordCount < EFFECT_MIN_WORDS) return false;
  if (effectWordCount < 10 && !/P\d+|sentence \d+/i.test(effectTrimmed)) {
    return false;
  }

  // 'other' requires deviceName
  if (instance.deviceType === 'other') {
    if (typeof instance.deviceName !== 'string' || instance.deviceName.trim().length === 0) {
      return false;
    }
  }

  return true;
}
