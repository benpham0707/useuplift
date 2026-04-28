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
// is the full property battery: 1000 randomized shapes per property,
// covering six orthogonal claims.
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
      // Ids match — catches WeakMap/Object.is/=== identity caches.
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
          // location is special: paragraphIndex is in the format, sentenceIndex/spanText are not.
          // Mutate sentenceIndex and spanText (NOT paragraphIndex) and assert id unchanged.
          const mutatedLocation = {
            ...original.location,
            sentenceIndex:
              original.location.sentenceIndex === null
                ? randInt(0, 12)
                : null,
            spanText: original.location.spanText === null ? `mutated-span-${i}` : null,
          };
          const mutated: L5Annotation = { ...original, location: mutatedLocation };
          expect(
            generateTaughtMoveId(mutated, iter),
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
          // Object / other — skip (id and location handled above; no other object fields exist today).
          continue;
        }

        expect(
          generateTaughtMoveId(mutated, iter),
          `case ${i} key=${String(key)}: mutating this field must not change the id; original.id=${original.id}, paraIdx=${original.location.paragraphIndex}, iter=${iter}`,
        ).toBe(baseId);
      }
    }
  });
});
