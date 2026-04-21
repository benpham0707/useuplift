/**
 * src/services/essayIntelligence/corpus/index.ts
 *
 * Wave-3a barrel export. Re-exports the 11 data files plus types and the
 * `CORPUS_MANIFEST` constant for downstream consumers (Wave-3b pipeline
 * integration, coaching layers, etc.).
 *
 * This module is the canonical machine-readable substrate derived from the
 * v2.1 close-reading reviews of the top-tier admit corpus. All entries here
 * trace to specific source-essay paragraphs (citations carried in the
 * `sourceEssays` field of each move; in `exemplars` for absences and
 * contextual patterns; in archetype `description` and `loadBearingMoveIds`).
 *
 * Hopkins archetype slots (essays 01-04) are reserved with stable IDs and
 * `provenance: 'pending-hopkins-reviews'`. They will be hydrated when the
 * parallel-track v2.1 reviews land at
 * `tests/calibration/top-tier-reference/reviews/0{1,2,3,4}-*-v2.md`.
 */

import { TOP_TIER_CRAFT_MOVES } from './topTierCraftMoves';
import { MOVE_EXCERPTS } from './moveExcerpts';
import { ESSAY_ARCHETYPES } from './essayArchetypes';
import { MOVE_DEPENDENCIES } from './moveDependencies';
import { VOICE_ARCHETYPE_COMPATIBILITY } from './voiceArchetypeCompatibility';
import { CORPUS_LIMITS } from './corpusLimits';
import { DELIBERATE_ABSENCES } from './deliberateAbsences';
import { ANTI_ARCHETYPES } from './antiArchetypes';
import { CONTEXTUAL_VALIDITY_PATTERNS } from './contextualValidity';
import { READER_BIAS_GUARDS } from './readerBiasGuards';
import { SCHOOL_FIT_VECTORS } from './schoolFitVectors';
import type { CorpusManifest } from './corpusTypes';

// Re-export types
export type {
  VoiceRegister,
  CorpusEssayId,
  SchoolId,
  PipelineLayer,
  MoveTransferability,
  MoveDifficulty,
  MoveDimension,
  SourceEssayCitation,
  CraftMove,
  MoveExcerpt,
  ArchetypeStage,
  ArchetypeProvenance,
  EssayArchetype,
  DeliberateAbsence,
  AntiArchetype,
  MoveDependency,
  CompatibilityFit,
  ArchetypeFitEntry,
  VoiceArchetypeMatch,
  ContextualPattern,
  BiasGuard,
  ResolutionType,
  SchoolFitDimensions,
  ArchetypeAffinity,
  SchoolFitVector,
  CannotTeachCondition,
  CorpusLimit,
  CorpusManifest,
} from './corpusTypes';

export { ALL_CORPUS_ESSAY_IDS } from './corpusTypes';

// Re-export data
export { TOP_TIER_CRAFT_MOVES };
export { MOVE_EXCERPTS };
export { ESSAY_ARCHETYPES };
export { MOVE_DEPENDENCIES };
export { VOICE_ARCHETYPE_COMPATIBILITY };
export { CORPUS_LIMITS };
export { DELIBERATE_ABSENCES };
export { ANTI_ARCHETYPES };
export { CONTEXTUAL_VALIDITY_PATTERNS };
export { READER_BIAS_GUARDS };
export { SCHOOL_FIT_VECTORS };

// ─────────────────────────────────────────────────────────────────────────
// Manifest
// ─────────────────────────────────────────────────────────────────────────

const archetypesAttested = ESSAY_ARCHETYPES.filter((a) => a.provenance === 'fully-attested').length;
const archetypesReserved = ESSAY_ARCHETYPES.filter((a) => a.provenance === 'pending-hopkins-reviews').length;

const schoolFitVectorsAttested = SCHOOL_FIT_VECTORS.filter((v) =>
  v.corpusEvidence.startsWith('Directly attested')
).length;
const schoolFitVectorsInferred = SCHOOL_FIT_VECTORS.length - schoolFitVectorsAttested;

const voiceArchetypeCompatibilityCells = VOICE_ARCHETYPE_COMPATIBILITY.reduce(
  (acc, v) => acc + v.archetypeCompatibility.length,
  0,
);

export const CORPUS_MANIFEST: CorpusManifest = {
  version: '3a.0.1',
  lastModified: '2026-04-19',
  totals: {
    moves: TOP_TIER_CRAFT_MOVES.length,
    excerpts: MOVE_EXCERPTS.length,
    archetypes: ESSAY_ARCHETYPES.length,
    archetypesAttested,
    archetypesReserved,
    deliberateAbsences: DELIBERATE_ABSENCES.length,
    antiArchetypes: ANTI_ARCHETYPES.length,
    contextualValidityPatterns: CONTEXTUAL_VALIDITY_PATTERNS.length,
    biasGuards: READER_BIAS_GUARDS.length,
    schoolFitVectors: SCHOOL_FIT_VECTORS.length,
    schoolFitVectorsAttested,
    schoolFitVectorsInferred,
    moveDependencies: MOVE_DEPENDENCIES.length,
    voiceArchetypeCompatibilityCells,
    corpusLimits: CORPUS_LIMITS.length,
  },
  sourceOfTruth: {
    essaysDir: 'tests/calibration/top-tier-reference/essays/',
    reviewsDir: 'tests/calibration/top-tier-reference/reviews/',
    methodologyFile: 'tests/calibration/top-tier-reference/reviews/METHODOLOGY.md',
    provenanceFile: 'tests/calibration/top-tier-reference/PROVENANCE.md',
  },
};
