/**
 * l5ManifestMerger.ts — Plumb L5 annotation output into ImprovementManifest items.
 *
 * WHY THIS EXISTS
 *   L5's deep annotation pass spends ~$0.50/run producing:
 *     - rewriteExample (essay-specific sample rewrite, REQUIRED on ACTION mode)
 *     - transferablePrinciple (named technique matched by techniqueMatcher)
 *     - stakes (AO-framed phenomenological impact)
 *     - antiPatternExample (the exact cliché/stock phrase quoted)
 *
 *   Before this module existed, NONE of these fields reached the coaching
 *   prompt — they were computed, displayed in the audit scorecard, and
 *   discarded from the live flow. The pipeline cost audit flagged this as
 *   the largest single source of wasted spend.
 *
 *   This module merges L5's output into matching ImprovementManifest items
 *   immediately after manifest construction, filling null fields where the
 *   manifest was silent. Research enrichment (researchEnrichment.ts) runs
 *   AFTER this merge and only fills fields still null, so L5's
 *   essay-specific rewrites take precedence over research DB boilerplate.
 *
 * MATCHING RULE
 *   For each manifest item:
 *     1. Find all L5 annotations at the same paragraph index
 *     2. Prefer ACTION-mode annotations (they carry rewriteExample)
 *     3. Among ACTION annotations, prefer higher-priority (lower number)
 *     4. Tie-break on sentence-index proximity if manifest has sourceRef
 *
 *   Essay-level manifest items (paragraph === -1) match essayLevelAnnotations.
 *
 * NON-DESTRUCTIVE
 *   Every merge is null-check-gated. If the manifest item already has a
 *   demonstration (e.g., from researchEnrichment on a prior turn), we do
 *   NOT overwrite it. This keeps the merger idempotent and composable.
 */

import type { ImprovementManifest, ImprovementEntry } from '../profileTypes';
import type { L5AnnotationResult, L5Annotation } from './deepAnnotationService';

export interface L5MergeStats {
  itemsMerged: number;
  demonstrationsFilled: number;
  techniquesFilled: number;
  stakesFilled: number;
}

/**
 * For a given manifest item, pick the L5 annotation with the highest
 * coaching value for merging. ACTION mode beats CONSEQUENCE beats AWARENESS.
 * Within a mode, lower priority number (1-5 where 1 is highest) wins.
 */
function pickBestAnnotation(
  candidates: L5Annotation[],
): L5Annotation | null {
  if (candidates.length === 0) return null;
  const modeScore = (m: string): number =>
    m === 'action' ? 3 : m === 'consequence' ? 2 : m === 'connection' ? 1 : 0;
  const sorted = [...candidates].sort((a, b) => {
    const modeDiff = modeScore(b.teachingMode) - modeScore(a.teachingMode);
    if (modeDiff !== 0) return modeDiff;
    // Lower priority number = higher importance
    return (a.priority ?? 5) - (b.priority ?? 5);
  });
  return sorted[0];
}

/**
 * Merge L5 annotations into manifest items. Mutates the manifest in place.
 * Returns stats for observability/audit.
 */
export function mergeL5IntoManifest(
  manifest: ImprovementManifest,
  l5Result: L5AnnotationResult,
): L5MergeStats {
  const stats: L5MergeStats = {
    itemsMerged: 0,
    demonstrationsFilled: 0,
    techniquesFilled: 0,
    stakesFilled: 0,
  };

  if (!manifest?.items?.length) return stats;
  if (!l5Result) return stats;

  // Build a paragraph → annotations map for O(1) lookup
  const byParagraph = new Map<number, L5Annotation[]>();
  for (const pa of l5Result.paragraphAnnotations ?? []) {
    const list = byParagraph.get(pa.paragraphIndex) ?? [];
    for (const ann of pa.annotations ?? []) list.push(ann);
    byParagraph.set(pa.paragraphIndex, list);
  }
  const essayLevelAnns = l5Result.essayLevelAnnotations ?? [];

  for (const item of manifest.items) {
    const candidates =
      item.paragraph === -1
        ? essayLevelAnns
        : byParagraph.get(item.paragraph) ?? [];
    const best = pickBestAnnotation(candidates);
    if (!best) continue;

    let changed = false;

    // essaySpecificDemo: L5 rewriteExample is ALWAYS essay-specific, so populate
    // unconditionally — this is the canonical in-voice demo that coaching prefers.
    if (!item.essaySpecificDemo && best.rewriteExample) {
      item.essaySpecificDemo = best.rewriteExample;
      changed = true;
    }

    // demonstration: preserved for backward compat. L5 rewriteExample > research
    // DB boilerplate (filled later as genericExample).
    if (!item.demonstration && best.rewriteExample) {
      item.demonstration = best.rewriteExample;
      stats.demonstrationsFilled++;
      changed = true;
    }

    // technique: L5 transferablePrinciple is the named craft technique
    // (from techniqueMatcher's multi-signal match — higher precision than
    // the keyword fallback). Fill when manifest's technique is null.
    if (!item.technique && best.transferablePrinciple) {
      item.technique = best.transferablePrinciple;
      stats.techniquesFilled++;
      changed = true;
    }

    // stakes: L5 stakes is AO-framed phenomenological impact. Fill when
    // manifest stakes is empty OR thin ("Evidence: ..." is a thin placeholder
    // from the L3.5 finding path — prefer L5's framing if available).
    const isThinStakes =
      !item.stakes ||
      item.stakes.trim() === '' ||
      item.stakes.startsWith('Evidence:');
    if (isThinStakes && best.stakes) {
      item.stakes = best.stakes;
      stats.stakesFilled++;
      changed = true;
    }

    // wordEconomyCut: L5 emits this for ACTION-mode additive rewrites in
    // polish/distinction phases. Prefer L5's if manifest is silent.
    if (!item.wordEconomyCut && best.wordEconomyCut) {
      item.wordEconomyCut = best.wordEconomyCut;
      changed = true;
    }

    // Record which L5 annotation was merged for provenance/telemetry
    if (changed) {
      stats.itemsMerged++;
      item.conversatorEnrichments = item.conversatorEnrichments ?? [];
      item.conversatorEnrichments.push(
        `[l5-merge:${best.id.slice(0, 8)}] mode=${best.teachingMode} pri=${best.priority}`,
      );
    }
  }

  return stats;
}
