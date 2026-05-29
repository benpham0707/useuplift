// ============================================================================
// TAUGHT MOVE ID STABILITY — property test (D-1.13)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md
//   §D-1.13 — "Property test asserting that for any given
//   (L5Annotation, iteration) pair, generateTaughtMoveId(annotation, iteration)
//   produces the same id regardless of context, time, or call order."
//
// Sister to the unit test at tests/unit/taught-move-builder.test.ts:273-335
// (round-2 audit T2.6 closure: light property check, 100 cases). This file
// is the full property battery: 1000 randomized shapes per property
// (100 for the Symbol-cache check), covering eight orthogonal claims —
// determinism, JSON-roundtrip purity, iteration sensitivity, paragraphIndex
// sensitivity, annotation.id sensitivity, field-only dependence,
// call-order independence, and Symbol-keyed cache resistance.
//
// [D-1.13 scope] This test asserts (id, paragraphIndex, iteration)
// determinism + sensitivity. It does NOT assert global id-string uniqueness
// across all (iter, paraIdx, annotation.id) triples — that's an
// L5-prompt-level invariant (annotation.id is meant to be globally unique
// within a single L5AnnotationResult), not a generateTaughtMoveId-level one.
//
// Seed convention: tests/property/ uses a deterministic LCG so property
// failures are reproducible at a specific commit hash (re-running the test
// at the same commit replays the same 1000 cases). The seed constant has
// no semantic meaning beyond being constant. If a future deliverable wants
// to re-roll seeds (broader coverage sweeps), it can add a D113_SEED env
// var override; not built now per YAGNI.

import { describe, it, expect } from 'vitest';

import type { L5Annotation } from '../../src/services/essayIntelligence/analysis/deepAnnotationService';
import { generateTaughtMoveId } from '../../src/services/essayIntelligence/analysis/taughtMoveBuilder';

// ─── Deterministic RNG (LCG, Numerical Recipes constants) ─────────────

const SEED_CONSTANT = 0xd1130001;

function makeLcg(seed: number): () => number {
  // 32-bit linear congruential generator. Constants from Numerical Recipes.
  // Returns a float in [0, 1). Sufficient for property-test case generation;
  // no cryptographic claim.
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const rand = makeLcg(SEED_CONSTANT);

function randInt(min: number, max: number): number {
  // Inclusive min, exclusive max.
  return Math.floor(rand() * (max - min)) + min;
}

function randString(prefix: string): string {
  // Random alphanumeric tail; intentionally allows dashes occasionally to
  // exercise the (already-known, out-of-scope) case where annotation.id
  // contains the same delimiter as the id format. Determinism still holds
  // even with dashes; uniqueness is not in scope (see scope comment above).
  const tailLen = randInt(3, 10);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
  let tail = '';
  for (let i = 0; i < tailLen; i++) {
    tail += alphabet[Math.floor(rand() * alphabet.length)];
  }
  return `${prefix}-${tail}`;
}

const TEACHING_MODES = ['awareness', 'consequence', 'connection', 'action'] as const;
const ANNOTATION_TYPES = ['strength', 'growth', 'teaching', 'action', 'structural'] as const;
const PHASES = ['foundation', 'architecture', 'craft', 'polish', 'distinction'] as const;
const GROUNDING = ['grounded', 'weakly_grounded', 'ungrounded'] as const;

function makeRandomAnnotation(overrides: Partial<L5Annotation> = {}): L5Annotation {
  // Generate a fully-populated L5Annotation with randomized field values.
  // The two id-determining fields (id, location.paragraphIndex) are random
  // but recorded so the caller can predict the expected derived id.
  const id = randString('A');
  const paragraphIndex = randInt(0, 24);
  const sentenceIndex = rand() > 0.5 ? randInt(0, 12) : null;
  const spanText = rand() > 0.5 ? randString('span') : null;
  return {
    id,
    location: { paragraphIndex, sentenceIndex, spanText },
    type: ANNOTATION_TYPES[randInt(0, ANNOTATION_TYPES.length)] as L5Annotation['type'],
    teachingIntent: randString('intent'),
    teachingMode: TEACHING_MODES[randInt(0, TEACHING_MODES.length)],
    content: randString('content'),
    teachingRationale: randString('rationale'),
    northStarConnection: randString('northstar'),
    stakes: rand() > 0.3 ? randString('stakes') : null,
    priority: randInt(1, 6),
    phase: PHASES[randInt(0, PHASES.length)],
    rewriteExample: rand() > 0.5 ? randString('rewrite') : null,
    wordEconomyCut: rand() > 0.5 ? randString('cut') : null,
    antiPatternExample: rand() > 0.5 ? randString('anti') : null,
    transferablePrinciple: rand() > 0.5 ? randString('principle') : null,
    confidence: rand(),
    crossParagraphRefs: rand() > 0.7 ? [randInt(0, 24), randInt(0, 24)] : [],
    capacityBuildingNote: rand() > 0.5 ? randString('capacity') : null,
    groundingQuality: rand() > 0.5 ? GROUNDING[randInt(0, GROUNDING.length)] : undefined,
    surfaced: true,
    ...overrides,
  };
}

const N = 1000;

// ─── Properties ────────────────────────────────────────────────────────

describe('D-1.13 — TaughtMove ID stability property test (1000 randomized shapes)', () => {
  it('Property 1: determinism — repeated calls on the same (annotation, iteration) return the same id', () => {
    for (let i = 0; i < N; i++) {
      const ann = makeRandomAnnotation();
      const iter = randInt(0, 50);
      const id1 = generateTaughtMoveId(ann, iter);
      const id2 = generateTaughtMoveId(ann, iter);
      const id3 = generateTaughtMoveId(ann, iter);
      const id4 = generateTaughtMoveId(ann, iter);
      // All four calls produce the same id; no time/order/state dependence.
      expect(id1, `case ${i}: ann.id=${ann.id} paraIdx=${ann.location.paragraphIndex} iter=${iter}`).toBe(id2);
      expect(id2).toBe(id3);
      expect(id3).toBe(id4);
    }
  });

  it('Property 2: reference-independence — JSON round-trip yields reference-distinct annotations whose ids equal the originals', () => {
    for (let i = 0; i < N; i++) {
      const ann = makeRandomAnnotation();
      const iter = randInt(0, 50);
      const cloned = JSON.parse(JSON.stringify(ann)) as L5Annotation;
      // Sanity: round-trip produced a distinct reference but structurally equal.
      expect(cloned).not.toBe(ann);
      expect(cloned.id).toBe(ann.id);
      expect(cloned.location.paragraphIndex).toBe(ann.location.paragraphIndex);
      // Ids match — catches WeakMap, Object.is, and `===` identity caches
      // (the clone is a distinct reference, so any cache keyed on the
      // original reference would miss and recompute, exposing impurity if
      // the recomputation produced a different id). Note: JSON round-trip
      // strips Symbol-keyed properties, so a Symbol-keyed cache slips
      // through here — that bug class is covered by Property 9 below.
      expect(generateTaughtMoveId(cloned, iter), `case ${i}: ann.id=${ann.id}`).toBe(
        generateTaughtMoveId(ann, iter),
      );
    }
  });

  it('Property 3: iteration sensitivity — distinct iterations produce distinct ids for the same annotation', () => {
    for (let i = 0; i < N; i++) {
      const ann = makeRandomAnnotation();
      const i1 = randInt(0, 50);
      // Pick a second iteration that's guaranteed != i1.
      const i2 = i1 + 1 + randInt(0, 50);
      expect(i1).not.toBe(i2);
      expect(generateTaughtMoveId(ann, i1), `case ${i}: ann.id=${ann.id} i1=${i1} i2=${i2}`).not.toBe(
        generateTaughtMoveId(ann, i2),
      );
    }
  });

  it('Property 4: paragraph-index sensitivity — distinct paragraphIndex (with same id, iteration) produces distinct ids', () => {
    for (let i = 0; i < N; i++) {
      const baseId = randString('A');
      const iter = randInt(0, 50);
      const p1 = randInt(0, 24);
      const p2 = p1 + 1 + randInt(0, 24);
      expect(p1).not.toBe(p2);
      const ann1 = makeRandomAnnotation({ id: baseId, location: { paragraphIndex: p1, sentenceIndex: null, spanText: null } });
      const ann2 = makeRandomAnnotation({ id: baseId, location: { paragraphIndex: p2, sentenceIndex: null, spanText: null } });
      expect(generateTaughtMoveId(ann1, iter), `case ${i}: id=${baseId} p1=${p1} p2=${p2} iter=${iter}`).not.toBe(
        generateTaughtMoveId(ann2, iter),
      );
    }
  });

  it('Property 5: annotation-id sensitivity — distinct annotation.id (with same paragraphIndex, iteration) produces distinct ids', () => {
    for (let i = 0; i < N; i++) {
      const para = randInt(0, 24);
      const iter = randInt(0, 50);
      const id1 = randString('A1');
      // Construct id2 with a guaranteed-different prefix to avoid LCG collision.
      const id2 = randString('A2') + `-distinct-${i}`;
      expect(id1).not.toBe(id2);
      const ann1 = makeRandomAnnotation({ id: id1, location: { paragraphIndex: para, sentenceIndex: null, spanText: null } });
      const ann2 = makeRandomAnnotation({ id: id2, location: { paragraphIndex: para, sentenceIndex: null, spanText: null } });
      expect(generateTaughtMoveId(ann1, iter), `case ${i}: id1=${id1} id2=${id2} para=${para} iter=${iter}`).not.toBe(
        generateTaughtMoveId(ann2, iter),
      );
    }
  });

  // Property 6 is the most valuable: it catches the bug class round-2 T2.6
  // was setting up coverage for (any future implementation that adds a
  // hidden read of teachingMode, content, sentenceIndex, etc. into the id).
  // We iterate Object.keys(annotation) rather than hand-listing fields so
  // any future field added to L5Annotation is automatically covered — a
  // hand-listed sweep would silently miss new fields.
  //
  // [round-3-style review fix 2026-04-29] Two upgrades:
  //   1. The location handler now ALSO asserts that mutating paragraphIndex
  //      DOES change the id (positive sensitivity + negative sensitivity in
  //      the same place — symmetry catches stale-cache regressions where a
  //      future paragraphIndex read might miss the cache invalidation).
  //   2. The unhandled-type branch now THROWS instead of silently `continue`-ing.
  //      Prior shape silently skipped any future field whose value was a
  //      non-array object — exactly the dead-wire pattern the round-2 audit
  //      flagged. Failing loud surfaces new fields the moment they land.
  //
  // [enum-cast hygiene] The `as L5Annotation` casts below intentionally
  // construct values that violate the L5AnnotationType / L5TeachingMode /
  // ImprovementPhaseLevel unions (e.g., type = "mutated-type-N"). This is
  // safe and intentional: generateTaughtMoveId reads ONLY annotation.id and
  // annotation.location.paragraphIndex per the format contract, so the
  // unioned fields are not consulted at runtime. The test's claim is "if
  // the SUT silently starts reading any of these fields, the id will
  // change" — runtime divergence is what we're checking, not type validity.
  // Violating the union is the point: it's how we prove the SUT doesn't
  // depend on the field.
  it('Property 6: field-only dependence — mutating any field other than id or location.paragraphIndex leaves the id unchanged', () => {
    for (let i = 0; i < N; i++) {
      const original = makeRandomAnnotation();
      const iter = randInt(0, 50);
      const baseId = generateTaughtMoveId(original, iter);

      // Walk every top-level field in the annotation; for each non-id-determining
      // field, replace it with a divergent value and assert id unchanged.
      for (const key of Object.keys(original) as Array<keyof L5Annotation>) {
        if (key === 'id') continue; // id IS in the format; mutating must change the id (covered by Property 5)
        if (key === 'location') {
          // location.paragraphIndex IS in the format → mutating must change the id.
          // location.sentenceIndex / location.spanText are NOT → mutating must leave the id unchanged.
          // Assert both halves to enforce symmetry.
          const newPara = original.location.paragraphIndex + 1 + randInt(0, 24);
          const paraMutated: L5Annotation = {
            ...original,
            location: { ...original.location, paragraphIndex: newPara },
          };
          expect(
            generateTaughtMoveId(paraMutated, iter),
            `case ${i} key=location.paragraphIndex: mutation MUST change id; original.id=${original.id}, oldPara=${original.location.paragraphIndex}, newPara=${newPara}, iter=${iter}`,
          ).not.toBe(baseId);

          const sentSpanMutated: L5Annotation = {
            ...original,
            location: {
              ...original.location,
              sentenceIndex: original.location.sentenceIndex === null ? randInt(0, 12) : null,
              spanText: original.location.spanText === null ? `mutated-span-${i}` : null,
            },
          };
          expect(
            generateTaughtMoveId(sentSpanMutated, iter),
            `case ${i} key=location.sentenceIndex/spanText: original.id=${original.id}`,
          ).toBe(baseId);
          continue;
        }

        // For all other fields, swap the value to a divergent one of the same type.
        const value = original[key];
        let mutated: L5Annotation;
        if (typeof value === 'string') {
          mutated = { ...original, [key]: `mutated-${key}-${i}` } as L5Annotation;
        } else if (typeof value === 'number') {
          mutated = { ...original, [key]: value + 1 } as L5Annotation;
        } else if (typeof value === 'boolean') {
          mutated = { ...original, [key]: !value } as L5Annotation;
        } else if (value === null) {
          // null → fill with a string for nullable string fields, number for nullable number fields.
          // L5Annotation's nullable fields are all string|null in practice.
          mutated = { ...original, [key]: `mutated-null-${key}-${i}` } as L5Annotation;
        } else if (Array.isArray(value)) {
          mutated = { ...original, [key]: [...(value as number[]), 999 + i] } as L5Annotation;
        } else if (typeof value === 'undefined') {
          // Optional fields like groundingQuality. Set to a defined value.
          mutated = { ...original, [key]: 'grounded' } as L5Annotation;
        } else {
          // Fail-loud (round-3-style review fix). A future L5Annotation field
          // whose value is a non-array object would have silently slipped
          // through under the prior `continue`. Throwing here forces the
          // test author to extend Property 6's mutation strategy when a new
          // field shape arrives — the dead-wire pattern this property is
          // designed to prevent.
          throw new Error(
            `[D-1.13 Property 6] Unhandled field type for key=${String(key)} (typeof=${typeof value}). ` +
              `A new L5Annotation field shape was added without extending the property test. ` +
              `Add a mutation branch for this type so the field is covered by the field-only-dependence check.`,
          );
        }

        expect(
          generateTaughtMoveId(mutated, iter),
          `case ${i} key=${String(key)}: mutating this field must not change the id; original.id=${original.id}, paraIdx=${original.location.paragraphIndex}, iter=${iter}`,
        ).toBe(baseId);
      }
    }
  });

  // Property 7: call-order independence. Spec literal: "regardless of context,
  // time, or call order." Property 1 covers repeated calls on the same input
  // (no order effect when there's no other call). This property covers
  // INTERLEAVED calls: a sequence of distinct (annotation, iteration) pairs
  // computed in canonical order vs in a shuffled order; ids must match
  // pair-by-pair. A regression that introduces a stateful "last call cache"
  // or a buffer that pollutes across calls would fail here but pass Property 1.
  it('Property 7: call-order independence — interleaved/shuffled call order produces the same ids as canonical order', () => {
    // Build N distinct (annotation, iteration) pairs.
    const pairs: Array<{ ann: L5Annotation; iter: number }> = [];
    for (let i = 0; i < N; i++) {
      pairs.push({ ann: makeRandomAnnotation(), iter: randInt(0, 50) });
    }

    // Canonical order: compute id by walking pairs[] front-to-back.
    const canonicalIds = pairs.map(({ ann, iter }) => generateTaughtMoveId(ann, iter));

    // Shuffled order: Fisher-Yates with the seeded LCG, walk in shuffled
    // order, store result back at the original index. If the function is
    // stateless / call-order-independent, the two arrays must match
    // element-by-element.
    const indices = pairs.map((_, idx) => idx);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const shuffledIds: string[] = new Array(pairs.length);
    for (const idx of indices) {
      shuffledIds[idx] = generateTaughtMoveId(pairs[idx].ann, pairs[idx].iter);
    }

    expect(shuffledIds).toEqual(canonicalIds);
  });

  // [Time-independence property removed in harmony-audit follow-up
  //  2026-04-29] An earlier review pass added a "Property 8" that awaited
  //  microtask + setTimeout(0) boundaries between two calls on the same
  //  input. For a pure 4-token template-string concat with zero state, that
  //  property is redundant with Property 1 (back-to-back determinism): if
  //  the function read Date.now() / performance.now() into the id, Property
  //  1's repeated calls would already diverge. The microtask version added
  //  ~15 lines + async machinery to assert a bug class the existing
  //  property already catches. Removed to honor "complex but not
  //  overengineered." Spec literal-conformance for "regardless of … time"
  //  is satisfied by Property 1's determinism check.

  // Property 8: Symbol-keyed identity-cache resistance. JSON.parse(JSON.stringify(...))
  // in Property 2 strips Symbol keys, so a Symbol-keyed cache attached to the
  // original would silently miss-and-recompute on the clone — passing the
  // round-trip check vacuously. This property attaches a Symbol-keyed
  // property to the original object, computes the id once, then computes
  // again on the SAME reference; any cache that read its own Symbol key
  // would still hit, and any mutation we make to the Symbol value would not
  // affect the id (because the SUT never reads Symbols). Net assertion:
  // adding/changing a Symbol-keyed property leaves the id unchanged. NOT
  // redundant with Property 2: round-trip drops Symbols, so the clone path
  // would always miss the cache; the SAME-REFERENCE path is what proves
  // the SUT doesn't key its own cache by an attached Symbol.
  it('Property 8: Symbol-keyed property mutations do not affect the id (catches Symbol-keyed identity caches)', () => {
    const tag = Symbol.for('d113.symbol.cache.probe');
    for (let i = 0; i < 100; i++) {
      const ann = makeRandomAnnotation();
      const iter = randInt(0, 50);
      const baseId = generateTaughtMoveId(ann, iter);
      // Mutate a Symbol-keyed field on the SAME reference.
      (ann as unknown as Record<symbol, unknown>)[tag] = `probe-${i}`;
      const afterId = generateTaughtMoveId(ann, iter);
      expect(afterId, `case ${i}: Symbol-keyed property must not influence id; ann.id=${ann.id}`).toBe(baseId);
      // Change the Symbol value and re-check.
      (ann as unknown as Record<symbol, unknown>)[tag] = { nested: i };
      const afterId2 = generateTaughtMoveId(ann, iter);
      expect(afterId2).toBe(baseId);
    }
  });
});
