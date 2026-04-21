/**
 * embeddingText.ts — Text-construction functions for corpus embedding (Phase 2).
 *
 * For each of the 6 entity types embedded into the `corpus_embeddings` pgvector
 * table, build the exact text that OpenAI text-embedding-3-small will see.
 *
 * Text construction determines retrieval behavior. These functions encode
 * deliberate choices about which fields carry semantic signal vs. which
 * are filter-metadata.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN PRINCIPLES (per Phase 2B swarm design, confirmed by Tue 2026-04-20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. INCLUDE only high-semantic-load fields. Metadata used for structured
 *    pre-filtering (dimensions, compatibleRegisters, transferability) lives
 *    in the `filters` JSONB column, NOT in the embedded text. Including them
 *    in embedding text dilutes semantic signal with categorical tokens.
 *
 * 2. EXCLUDE pointer fields (move IDs in loadBearingMoveIds, archetype IDs in
 *    transplant paths). IDs are identifiers, not semantic content.
 *
 * 3. EXCLUDE empty-by-convention fields (prerequisites: [] is always empty
 *    under Architecture C). Dead fields waste tokens.
 *
 * 4. SEPARATOR: double newline (\n\n). Matches natural-paragraph-break
 *    patterns the embedding model was trained on.
 *
 * 5. STABILITY: these functions must be deterministic and stable under
 *    no-op changes. Reordering fields, changing separator, or adding new
 *    fields all invalidate content hashes and trigger re-embedding.
 */

import type {
  CraftMove,
  MoveExcerpt,
  EssayArchetype,
  AntiArchetype,
  DeliberateAbsence,
  CorpusEssayId,
} from './corpusTypes';

/**
 * Build embedding text for a CraftMove.
 *
 * Order: displayName → mechanism → detectionSignal → universalApplication
 *
 * EXCLUDED fields and rationale:
 *   - prerequisites: always empty [] under Architecture C (hard gates moved to moveDependencies.ts)
 *   - antiPatterns: moved to dedicated AntiArchetype entities with their own embeddings
 *   - sourceEssays: redundant with separately-embedded MoveExcerpt entities
 *   - dimensions, compatibleRegisters, transferability, difficulty: pre-filter metadata (JSONB)
 */
export function buildMoveEmbeddingText(move: CraftMove): string {
  const parts = [
    move.displayName,
    move.mechanism,
    move.detectionSignal,
    move.universalApplication,
  ].filter((p) => p && p.trim());

  return parts.join('\n\n');
}

/**
 * Build embedding text for a MoveExcerpt.
 *
 * Order: excerpt (raw corpus sentence) → annotation → tags-as-text
 *
 * Tags-as-text justification: retrievalTags like `['metaphor', 'opening', 'voice']`
 * carry dimension-based retrieval signal. Embedded as `"Tags: metaphor, opening, voice."`
 * they gain semantic weight for queries like "show me metaphor examples" without
 * inflating token count.
 *
 * EXCLUDED:
 *   - anchorLevel: numeric quality metadata, not semantic content
 */
export function buildExcerptEmbeddingText(excerpt: MoveExcerpt): string {
  const parts: string[] = [excerpt.excerpt, excerpt.annotation];
  if (excerpt.retrievalTags.length > 0) {
    parts.push(`Tags: ${excerpt.retrievalTags.join(', ')}.`);
  }
  return parts.filter((p) => p && p.trim()).join('\n\n');
}

/**
 * Build embedding text for an EssayArchetype.
 *
 * Order: description → structural-stage purposes → whenToUse → whenNotToUse
 *
 * Stage-PURPOSES included, not stage names or move IDs. The purpose field carries
 * semantic-rich explanation ("Establish literal setting and metaphorical concern
 * simultaneously") while stage names are labels and move IDs are pointers.
 *
 * whenNotToUse INCLUDED because negative examples are load-bearing for
 * hybrid retrieval: a student whose voice is ornate should NOT match an
 * archetype whose whenNotToUse contains "ornate voice required."
 *
 * EXCLUDED:
 *   - loadBearingMoveIds: pointers; coaching layer joins separately
 *   - voiceRequirements, contentRequirements: filter metadata
 *   - commonFailureModes: coaching-layer L5/L6 guidance, not retrieval signal
 *   - schoolFitStrength: separate retrieval surface
 *   - provenance: metadata
 */
export function buildArchetypeEmbeddingText(archetype: EssayArchetype): string {
  const stagePurposes = archetype.structuralStages
    .map((stage) => `${stage.stageName}: ${stage.purpose}`)
    .join(' | ');

  const parts: string[] = [archetype.description];
  if (stagePurposes) parts.push(`Stages: ${stagePurposes}`);
  parts.push(`When to use: ${archetype.whenToUse}`);
  parts.push(`When not to use: ${archetype.whenNotToUse}`);

  return parts.filter((p) => p && p.trim()).join('\n\n');
}

/**
 * Build embedding text for an AntiArchetype.
 *
 * Order: description → diagnostic signals → failure mode
 *
 * EXCLUDED:
 *   - corpusAlternativeArchetypeId: pointer; coaching layer resolves separately
 *   - transplantPath: L5 coaching guidance, not retrieval content
 */
export function buildAntiPatternEmbeddingText(ap: AntiArchetype): string {
  const signals = ap.diagnosticSignals.join(' | ');
  const parts: string[] = [ap.description];
  if (signals) parts.push(`Signals: ${signals}`);
  parts.push(`Failure: ${ap.failureMode}`);
  return parts.filter((p) => p && p.trim()).join('\n\n');
}

/**
 * Build embedding text for a DeliberateAbsence.
 *
 * Order: description (what the essay doesn't do) → why (the principle)
 *
 * EXCLUDED:
 *   - appliesToArchetypeIds: pointers
 *   - exemplars: essay-specific demonstrations; MoveExcerpts cover exemplar retrieval
 */
export function buildAbsenceEmbeddingText(abs: DeliberateAbsence): string {
  const parts: string[] = [abs.description, abs.why];
  return parts.filter((p) => p && p.trim()).join('\n\n');
}

/**
 * Build embedding text for a raw review passage.
 *
 * No transformation — raw review text IS the embedding text. Context
 * (essayId, paragraphNum) lives in metadata columns, not in the embedded text.
 *
 * Parameters kept on the signature for symmetry with the other builders and
 * to allow future extensions (e.g., prepending the essay title for richer
 * context). Currently unused in the text output.
 */
export function buildReviewPassageEmbeddingText(
  paragraph: string,
  _context: { essayId: CorpusEssayId; paragraphNum: number },
): string {
  return paragraph.trim();
}
