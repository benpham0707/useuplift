/**
 * candidateIds.ts — Deterministic ID generation for ImprovementCandidate.
 *
 * Used by:
 *   - Phase 1.5's profileMigration.ts (legacy profile backfill)
 *   - Phase 4's ImprovementCandidateStore class (fresh analysis emission)
 *   - Phase 5's inline L3/L3.5/L3.75 emission
 *
 * Why a standalone file: the ID format is a contract shared across phases
 * that land at different times. Defining it here (Phase 1.5) lets both
 * profileMigration.ts and the later ImprovementCandidateStore class import
 * the same builder without either depending on the other.
 *
 * ID format: `CAND_{layer}_P{paragraph}[S{sentence}]_{hash}`
 *   - layer: 'L3' | 'L3_5' | 'L3_75' (dots replaced with underscores for ID safety)
 *   - paragraph: 0-based index, or 'ESSAY' for -1 (essay-level)
 *   - sentence: optional 0-based index
 *   - hash: 8-char hex from a cheap non-cryptographic hash of the salt
 *
 * Examples:
 *   CAND_L3_P2S4_a3f71b9c
 *   CAND_L3_5_P0_b8c4d2ef
 *   CAND_L3_75_ESSAY_11aa22bb
 *
 * Determinism: the same (layer, paragraph, sentence, salt) tuple always
 * produces the same ID. This lets the migration function dedupe across
 * source passes without tracking state, and lets re-runs be idempotent.
 */

/**
 * Generate a deterministic candidate ID.
 *
 * @param sourceLayer 'L3' | 'L3.5' | 'L3.75'
 * @param paragraph 0-based paragraph index, or -1 for essay-level
 * @param sentence 0-based sentence index, or null for paragraph-scope
 * @param salt Unique string that distinguishes candidates at the same
 *             (layer, paragraph, sentence) coordinate — typically the
 *             observation text or a source-prefixed identifier.
 * @returns A stable ID string safe for use in Map keys, JSON, and logs.
 */
export function buildCandidateId(
  sourceLayer: 'L3' | 'L3.5' | 'L3.75',
  paragraph: number,
  sentence: number | null,
  salt: string,
): string {
  const layerToken = sourceLayer.replace(/\./g, '_');
  const paraToken = paragraph === -1 ? 'ESSAY' : `P${paragraph}`;
  const sentToken = sentence !== null && sentence >= 0 ? `S${sentence}` : '';
  const hash = hashString(salt);
  return `CAND_${layerToken}_${paraToken}${sentToken}_${hash}`;
}

/**
 * Cheap non-cryptographic 32-bit string hash (djb2 variant).
 *
 * This is NOT for security — only for generating stable 8-char hex suffixes
 * that disambiguate candidates at the same position. Collision probability
 * at 10-100 candidates per paragraph is negligible.
 */
function hashString(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    // djb2: hash * 33 + char
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  // Convert to unsigned 32-bit and hex-pad to 8 chars
  return (hash >>> 0).toString(16).padStart(8, '0');
}
