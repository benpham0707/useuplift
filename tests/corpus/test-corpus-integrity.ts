/**
 * tests/corpus/test-corpus-integrity.ts
 *
 * Integrity gates for the Wave-3a corpus knowledge substrate.
 *
 * Run: `npx tsx tests/corpus/test-corpus-integrity.ts`
 *
 * Required checks:
 *   1. Every moveId reference in every file resolves to a real move.
 *   2. Every essayId in every file is a real corpus essay.
 *   3. moveDependencies DAG is acyclic.
 *   4. Every fully-attested archetype's loadBearingMoveIds exist in the moves catalog.
 *   5. Every move has at least one excerpt.
 *   6. No move has an empty sourceEssays array.
 *   7. voiceArchetypeCompatibility covers every voice × archetype pair (no gaps).
 *   8. Every contextualValidity exemplar references a real essay.
 *   9. Reserved Hopkins archetypes have provenance: 'pending-hopkins-reviews' AND empty arrays (consistent state).
 *  10. SchoolFitVector archetypeAffinities reference real archetypes.
 *  11. Every reader-bias guard targets at least one pipeline layer.
 *  12. Manifest counts match actual data file sizes.
 *
 * Exit code 0 = all gates passed; non-zero = at least one gate failed.
 */

import {
  TOP_TIER_CRAFT_MOVES,
  MOVE_EXCERPTS,
  ESSAY_ARCHETYPES,
  MOVE_DEPENDENCIES,
  VOICE_ARCHETYPE_COMPATIBILITY,
  CORPUS_LIMITS,
  DELIBERATE_ABSENCES,
  ANTI_ARCHETYPES,
  CONTEXTUAL_VALIDITY_PATTERNS,
  READER_BIAS_GUARDS,
  SCHOOL_FIT_VECTORS,
  CORPUS_MANIFEST,
  ALL_CORPUS_ESSAY_IDS,
} from '../../src/services/essayIntelligence/corpus';

import type { VoiceRegister } from '../../src/services/essayIntelligence/corpus';

const failures: string[] = [];
const warnings: string[] = [];

function fail(check: string, msg: string) {
  failures.push(`[${check}] ${msg}`);
}

function warn(check: string, msg: string) {
  warnings.push(`[${check}] ${msg}`);
}

const VOICE_REGISTERS: VoiceRegister[] = [
  'plain',
  'literary-reflective',
  'maximalist',
  'comedic',
  'domain-insider',
  'intellectual-playful',
  'lyric',
];

const moveIds = new Set(TOP_TIER_CRAFT_MOVES.map((m) => m.id));
const archetypeIds = new Set(ESSAY_ARCHETYPES.map((a) => a.id));
const validEssayIds = new Set<string>(ALL_CORPUS_ESSAY_IDS);

// ─────────────────────────────────────────────────────────────────────────
// CHECK 1: Every moveId reference resolves
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 1: Every moveId reference resolves...');

for (const exc of MOVE_EXCERPTS) {
  if (!moveIds.has(exc.moveId)) {
    fail('1', `MoveExcerpt ${exc.id} references unknown moveId '${exc.moveId}'`);
  }
}

for (const arch of ESSAY_ARCHETYPES) {
  if (arch.provenance === 'pending-hopkins-reviews') continue; // reserved slots
  for (const moveId of arch.loadBearingMoveIds) {
    if (!moveIds.has(moveId)) fail('1', `Archetype '${arch.id}' loadBearing references unknown moveId '${moveId}'`);
  }
  for (const stage of arch.structuralStages) {
    for (const moveId of stage.requiredMoveIds) {
      if (moveId.endsWith('-OPTIONAL')) continue; // hint-suffix entries are non-binding placeholders
      if (!moveIds.has(moveId)) fail('1', `Archetype '${arch.id}' stage '${stage.stageName}' required references unknown moveId '${moveId}'`);
    }
    for (const moveId of stage.optionalMoveIds) {
      if (moveId.endsWith('-OPTIONAL')) continue;
      if (!moveIds.has(moveId)) fail('1', `Archetype '${arch.id}' stage '${stage.stageName}' optional references unknown moveId '${moveId}'`);
    }
  }
}

for (const dep of MOVE_DEPENDENCIES) {
  if (!moveIds.has(dep.moveId)) fail('1', `MoveDependency moveId '${dep.moveId}' is not a known move`);
  for (const r of dep.hardRequires) if (!moveIds.has(r)) fail('1', `MoveDependency for '${dep.moveId}' hardRequires unknown move '${r}'`);
  for (const e of dep.enables) if (!moveIds.has(e)) fail('1', `MoveDependency for '${dep.moveId}' enables unknown move '${e}'`);
  for (const c of dep.conflicts) if (!moveIds.has(c)) fail('1', `MoveDependency for '${dep.moveId}' conflicts with unknown move '${c}'`);
  // Phase 1A: every MoveDependency must carry a non-empty corpusJustification
  if (!dep.corpusJustification || dep.corpusJustification.trim().length < 40) {
    fail('1', `MoveDependency for '${dep.moveId}' has missing/thin corpusJustification (must be ≥40 chars, cite review)`);
  }
}

for (const limit of CORPUS_LIMITS) {
  if (limit.targetType === 'move' && !moveIds.has(limit.targetId)) {
    fail('1', `CorpusLimit targetId '${limit.targetId}' (type=move) not found in moves catalog`);
  }
  if (limit.targetType === 'archetype' && !archetypeIds.has(limit.targetId)) {
    fail('1', `CorpusLimit targetId '${limit.targetId}' (type=archetype) not found in archetypes catalog`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 2: Every essayId references a real corpus essay
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 2: Every essayId is a real corpus essay...');

for (const m of TOP_TIER_CRAFT_MOVES) {
  for (const src of m.sourceEssays) {
    if (!validEssayIds.has(src.essayId)) fail('2', `CraftMove '${m.id}' references invalid essayId '${src.essayId}'`);
  }
}
for (const exc of MOVE_EXCERPTS) {
  if (!validEssayIds.has(exc.essayId)) fail('2', `MoveExcerpt '${exc.id}' references invalid essayId '${exc.essayId}'`);
}
for (const arch of ESSAY_ARCHETYPES) {
  if (!validEssayIds.has(arch.exemplarEssayId)) fail('2', `Archetype '${arch.id}' exemplarEssayId '${arch.exemplarEssayId}' invalid`);
}
for (const abs of DELIBERATE_ABSENCES) {
  for (const ex of abs.exemplars) {
    if (!validEssayIds.has(ex.essayId)) fail('2', `DeliberateAbsence '${abs.id}' exemplar essayId '${ex.essayId}' invalid`);
  }
}
for (const cp of CONTEXTUAL_VALIDITY_PATTERNS) {
  for (const ex of cp.exemplars) {
    if (!validEssayIds.has(ex.essayId)) fail('2', `ContextualPattern '${cp.id}' exemplar essayId '${ex.essayId}' invalid`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 3: moveDependencies DAG is acyclic
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 3: moveDependencies DAG is acyclic...');

const requiresMap = new Map<string, string[]>();
for (const dep of MOVE_DEPENDENCIES) {
  requiresMap.set(dep.moveId, dep.requires);
}

function hasCycle(start: string): string[] | null {
  const visited = new Set<string>();
  const stack: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  while (stack.length) {
    const { node, path } = stack.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    const reqs = requiresMap.get(node) ?? [];
    for (const r of reqs) {
      if (path.includes(r)) return [...path, r];
      stack.push({ node: r, path: [...path, r] });
    }
  }
  return null;
}

for (const dep of MOVE_DEPENDENCIES) {
  const cycle = hasCycle(dep.moveId);
  if (cycle) fail('3', `Cycle detected in moveDependencies: ${cycle.join(' -> ')}`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 4: Every fully-attested archetype's loadBearingMoveIds exist
// (covered by CHECK 1; re-stated for visibility)
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 4: Fully-attested archetypes have non-empty loadBearingMoveIds...');

for (const arch of ESSAY_ARCHETYPES) {
  if (arch.provenance === 'fully-attested' && arch.loadBearingMoveIds.length === 0) {
    fail('4', `Fully-attested archetype '${arch.id}' has empty loadBearingMoveIds`);
  }
  if (arch.provenance === 'fully-attested' && arch.structuralStages.length === 0) {
    fail('4', `Fully-attested archetype '${arch.id}' has empty structuralStages`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 5: Every move has at least one excerpt (warning, not failure)
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 5: Every move has at least one excerpt...');

const movesWithExcerpts = new Set(MOVE_EXCERPTS.map((e) => e.moveId));
const movesWithoutExcerpts: string[] = [];
for (const m of TOP_TIER_CRAFT_MOVES) {
  if (!movesWithExcerpts.has(m.id)) movesWithoutExcerpts.push(m.id);
}
if (movesWithoutExcerpts.length > 0) {
  warn('5', `${movesWithoutExcerpts.length} of ${TOP_TIER_CRAFT_MOVES.length} moves lack an excerpt. Wave-3b should backfill. Missing: ${movesWithoutExcerpts.slice(0, 10).join(', ')}${movesWithoutExcerpts.length > 10 ? '...' : ''}`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 6: No move has an empty sourceEssays array
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 6: No move has empty sourceEssays...');

for (const m of TOP_TIER_CRAFT_MOVES) {
  if (m.sourceEssays.length === 0) fail('6', `Move '${m.id}' has empty sourceEssays array`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 7: voiceArchetypeCompatibility covers all voice × archetype pairs
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 7: voiceArchetypeCompatibility covers all 7 × 14 = 98 cells...');

const seenVoices = new Set<VoiceRegister>();
for (const v of VOICE_ARCHETYPE_COMPATIBILITY) {
  if (seenVoices.has(v.voiceRegister)) fail('7', `Duplicate voice register entry: '${v.voiceRegister}'`);
  seenVoices.add(v.voiceRegister);

  const seenArchetypes = new Set<string>();
  for (const a of v.archetypeCompatibility) {
    if (seenArchetypes.has(a.archetypeId)) fail('7', `Voice '${v.voiceRegister}' has duplicate archetype entry '${a.archetypeId}'`);
    seenArchetypes.add(a.archetypeId);
    if (!archetypeIds.has(a.archetypeId)) fail('7', `Voice '${v.voiceRegister}' references unknown archetype '${a.archetypeId}'`);
  }
  // Ensure every archetype is covered for this voice
  for (const arch of ESSAY_ARCHETYPES) {
    if (!seenArchetypes.has(arch.id)) fail('7', `Voice '${v.voiceRegister}' missing archetype '${arch.id}'`);
  }
}
// Ensure all voices present
for (const vr of VOICE_REGISTERS) {
  if (!seenVoices.has(vr)) fail('7', `Voice register '${vr}' missing from compatibility matrix`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 8: contextualValidity exemplars valid
// (covered by CHECK 2)
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// CHECK 9: Archetype provenance is internally consistent
//
// Post-Hopkins-integration (2026-04-20): all 14 archetypes should be
// fully-attested. This check ensures consistency — if an archetype claims
// 'fully-attested' it must have non-empty load-bearing data, and
// 'pending-hopkins-reviews' must have empty arrays.
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 9: Archetype provenance consistency...');

for (const arch of ESSAY_ARCHETYPES) {
  if (arch.provenance === 'fully-attested') {
    if (arch.loadBearingMoveIds.length === 0) {
      fail('9', `Fully-attested archetype '${arch.id}' has empty loadBearingMoveIds — should be hydrated`);
    }
    if (arch.structuralStages.length === 0) {
      fail('9', `Fully-attested archetype '${arch.id}' has empty structuralStages — should be hydrated`);
    }
  }
  if (arch.provenance === 'pending-hopkins-reviews') {
    if (arch.loadBearingMoveIds.length !== 0) {
      fail('9', `Pending archetype '${arch.id}' should have empty loadBearingMoveIds until review lands`);
    }
    if (arch.structuralStages.length !== 0) {
      fail('9', `Pending archetype '${arch.id}' should have empty structuralStages until review lands`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 10: SchoolFitVector archetypeAffinities reference real archetypes
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 10: SchoolFitVector archetypeAffinities reference real archetypes...');

for (const v of SCHOOL_FIT_VECTORS) {
  for (const aff of v.archetypeAffinities) {
    if (!archetypeIds.has(aff.archetypeId)) fail('10', `SchoolFitVector for '${v.schoolId}' references unknown archetype '${aff.archetypeId}'`);
    if (aff.strength < 0 || aff.strength > 10) fail('10', `SchoolFitVector for '${v.schoolId}' archetype '${aff.archetypeId}' strength ${aff.strength} out of range [0, 10]`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 11: Every reader-bias guard targets at least one pipeline layer
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 11: Reader-bias guards target at least one pipeline layer...');

for (const g of READER_BIAS_GUARDS) {
  if (g.appliesTo.length === 0) fail('11', `BiasGuard '${g.id}' has empty appliesTo`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 12: Manifest counts match actual sizes
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 12: Manifest counts match actual data sizes...');

const expected = {
  moves: TOP_TIER_CRAFT_MOVES.length,
  excerpts: MOVE_EXCERPTS.length,
  archetypes: ESSAY_ARCHETYPES.length,
  deliberateAbsences: DELIBERATE_ABSENCES.length,
  antiArchetypes: ANTI_ARCHETYPES.length,
  contextualValidityPatterns: CONTEXTUAL_VALIDITY_PATTERNS.length,
  biasGuards: READER_BIAS_GUARDS.length,
  schoolFitVectors: SCHOOL_FIT_VECTORS.length,
  moveDependencies: MOVE_DEPENDENCIES.length,
  corpusLimits: CORPUS_LIMITS.length,
};
for (const [k, v] of Object.entries(expected)) {
  const actual = (CORPUS_MANIFEST.totals as Record<string, number>)[k];
  if (actual !== v) fail('12', `Manifest totals.${k} = ${actual} but actual data has ${v}`);
}

// ─────────────────────────────────────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('CORPUS INTEGRITY REPORT');
console.log('══════════════════════════════════════════════════════════════════');
console.log(`Moves:                ${TOP_TIER_CRAFT_MOVES.length}`);
console.log(`Excerpts:             ${MOVE_EXCERPTS.length}`);
console.log(`Archetypes (total):   ${ESSAY_ARCHETYPES.length}`);
console.log(`  attested:           ${ESSAY_ARCHETYPES.filter((a) => a.provenance === 'fully-attested').length}`);
console.log(`  reserved (Hopkins): ${ESSAY_ARCHETYPES.filter((a) => a.provenance === 'pending-hopkins-reviews').length}`);
console.log(`Move dependencies:    ${MOVE_DEPENDENCIES.length}`);
console.log(`Voice×Archetype cells:${VOICE_ARCHETYPE_COMPATIBILITY.reduce((a, v) => a + v.archetypeCompatibility.length, 0)}`);
console.log(`Deliberate absences:  ${DELIBERATE_ABSENCES.length}`);
console.log(`Anti-archetypes:      ${ANTI_ARCHETYPES.length}`);
console.log(`Contextual patterns:  ${CONTEXTUAL_VALIDITY_PATTERNS.length}`);
console.log(`Reader-bias guards:   ${READER_BIAS_GUARDS.length}`);
console.log(`School-fit vectors:   ${SCHOOL_FIT_VECTORS.length}`);
console.log(`Corpus limits:        ${CORPUS_LIMITS.length}`);
console.log('──────────────────────────────────────────────────────────────────');

if (warnings.length > 0) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (failures.length > 0) {
  console.log(`\nFAILURES (${failures.length}):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('INTEGRITY: FAILED');
  console.log('══════════════════════════════════════════════════════════════════');
  process.exit(1);
} else {
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('INTEGRITY: PASSED');
  console.log('══════════════════════════════════════════════════════════════════');
  process.exit(0);
}
