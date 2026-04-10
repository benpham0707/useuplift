/**
 * improvements/ — Scope 2 improvement pipeline barrel export.
 *
 * Canonical entry point for the improvement-candidate lifecycle:
 * - `ImprovementCandidateStore` (Phase 4): append-only lifecycle store
 * - `buildCandidateId` (Phase 1.5): deterministic ID generation
 * - `migrateLegacyProfileToCandidateStore` (Phase 1.5): one-shot backfill
 *
 * Types (`ImprovementCandidate`, `ImprovementCandidateState`,
 * `ImprovementCandidateStoreSnapshot`) remain exported from `profileTypes.ts`
 * where they live alongside `EssayProfile`.
 */

export { ImprovementCandidateStore } from './improvementCandidateStore';
export { buildCandidateId } from './candidateIds';
export { migrateLegacyProfileToCandidateStore } from './profileMigration';
