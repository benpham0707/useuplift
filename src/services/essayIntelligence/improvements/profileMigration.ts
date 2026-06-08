/**
 * profileMigration.ts — One-shot legacy profile migration.
 *
 * DOCTRINE:
 *   - Zero LLM calls. Deterministic data-shape conversion ONLY.
 *   - Runs EXACTLY ONCE per profile at load time.
 *   - NOT a fallback for fresh-analysis failures.
 *   - Throws PipelineError.noMigrationSource(...) when source data is empty.
 *
 * Input: legacy EssayProfile persisted BEFORE Scope 2 introduced the
 *        ImprovementCandidateStore. Such profiles have:
 *          - profile.improvementCandidateSnapshot === undefined
 *          - profile.findings (the FindingStore serialization) populated
 *          - profile.scoreMatrix?.coachingMap?.priorities populated (legacy
 *            object shape without consolidatedFrom / technique / demonstrationSketch)
 *          - profile.craftAssessment.growthEdges populated (without pairedImprovement)
 *          - profile.admissionsPositioning.redFlags possibly populated
 *
 * Output: ImprovementCandidateStoreSnapshot ready to assign to
 *         profile.improvementCandidateSnapshot, OR a thrown PipelineError
 *         if there is literally nothing to migrate.
 *
 * Related: this function is REPURPOSED from the 208-line keyword-routing
 * scraper that currently lives at analysisOrchestrator.ts:1426-1633 as
 * buildImprovementManifest(). That function will be DELETED in Phase 6
 * (Scope 2 S2-8) when the inline candidate projection replaces it. The
 * migration preserves the same data-shape conversion for legacy-profile
 * backfill only — no new profile will ever hit this function (fresh
 * profiles populate the candidate store during L3/L3.5/L3.75).
 *
 * QUALITY TRADEOFF — migrated candidates are STRICTLY LESSER than fresh ones:
 *   - `technique` is always null (fresh candidates inherit a named
 *     TECHNIQUE_VOCABULARY_LIST entry from the LLM emission)
 *   - `demonstrationSketch` is always null (fresh candidates seed L5
 *     rewriteExample generation)
 *   - `suggestedChange` is boilerplate ("Evidence from legacy finding: ...",
 *     "Address the claim: ...") rather than LLM-generated prescription
 *   - `coachingValue` comes from the legacy Finding (which was scored by an
 *     earlier pipeline) and may be less calibrated than fresh L3.5 output
 *
 * This is an ACCEPTED tradeoff: the alternative is re-running the full
 * $2.48 analysis pipeline on every legacy profile load, which the user
 * explicitly rejected. Students working on migrated profiles will see
 * less precise coaching until they trigger a fresh re-analysis (which
 * replaces the entire candidate store with fresh L3/L3.5/L3.75 output).
 *
 * Reference: docs/specs/FORGE_PLAN_ARTIFACTS.md Section 2.
 */

import type {
  EssayProfile,
  Finding,
  FindingScope,
  ImprovementCandidate,
  ImprovementCandidateStoreSnapshot,
} from '../profileTypes';
import { PipelineError } from '../errors';
import { buildCandidateId } from './candidateIds';

/**
 * Derive (paragraph, sentence) from a Finding's scope. The FindingScope
 * union carries six scope kinds — this function picks the "most specific
 * first" paragraph+sentence coordinate for each variant.
 *
 * Returns `{ paragraph: -1, sentence: null }` for essay-level and word-level
 * findings (which don't have a natural paragraph coordinate in the current
 * schema) and for sentence_group findings whose `sentences[]` is empty.
 */
function scopeCoordinates(scope: FindingScope | undefined): {
  paragraph: number;
  sentence: number | null;
} {
  if (!scope || typeof scope !== 'object') return { paragraph: -1, sentence: null };
  switch (scope.type) {
    case 'sentence':
    case 'sentence_group':
      // Field is `sentences: number[]` (plural array). Pick the first entry
      // as the representative sentence coordinate.
      return {
        paragraph: typeof scope.paragraph === 'number' ? scope.paragraph : -1,
        sentence:
          Array.isArray(scope.sentences) && scope.sentences.length > 0 ? scope.sentences[0] : null,
      };
    case 'paragraph':
      return {
        paragraph: typeof scope.paragraph === 'number' ? scope.paragraph : -1,
        sentence: null,
      };
    case 'cross_paragraph':
      return {
        paragraph:
          Array.isArray(scope.paragraphs) && scope.paragraphs.length > 0 ? scope.paragraphs[0] : -1,
        sentence: null,
      };
    case 'word':
      // Word-level findings don't carry a sentence coordinate; use the
      // paragraph if present. The textEvidence[0].location can supply
      // a finer coordinate if callers need it later.
      return {
        paragraph: typeof scope.paragraph === 'number' ? scope.paragraph : -1,
        sentence: null,
      };
    case 'essay_level':
      return { paragraph: -1, sentence: null };
    default:
      // Unknown scope variant — be defensive, not silent. Use essay-level
      // as the safest coordinate, but the caller's dedup / filter will
      // still skip the candidate if the observation is empty.
      return { paragraph: -1, sentence: null };
  }
}

/**
 * Convert an old persisted EssayProfile into an ImprovementCandidateStoreSnapshot.
 *
 * @param profile The legacy profile (must have improvementCandidateSnapshot undefined)
 * @returns A snapshot ready to assign directly to profile.improvementCandidateSnapshot
 * @throws PipelineError.noMigrationSource if the legacy profile has literally
 *         zero usable source data — callers should convert this into a
 *         CoachingBlockedError.requiresReanalysis at the coaching gate.
 */
export function migrateLegacyProfileToCandidateStore(
  profile: EssayProfile,
): ImprovementCandidateStoreSnapshot {
  const candidates: ImprovementCandidate[] = [];
  const seenIds = new Set<string>();
  const nowIso = new Date().toISOString();

  // ── Source 1: L3.5 Finding-store entries ────────────────────────────────
  // Legacy profiles persist findings as profile.findings[]. Each Finding with
  // an evidence-backed claim is a descriptive observation we convert into an
  // ImprovementCandidate by treating the claim as the observation and the
  // first evidence text as a seed suggestedChange.
  //
  // Scope types handled (see FindingScope in profileTypes.ts):
  //   sentence, sentence_group → (paragraph, sentences[0])
  //   paragraph                → (paragraph, null)
  //   cross_paragraph          → (paragraphs[0], null)
  //   word                     → (paragraph, null)  (word-level loses finer coord)
  //   essay_level              → (-1, null)
  const findings: Finding[] = Array.isArray(profile.findings) ? profile.findings : [];
  for (const f of findings) {
    if (!f || typeof f !== 'object') continue;
    // Skip findings that were superseded during their original lifecycle
    if (f.supersededBy) continue;

    const { paragraph, sentence } = scopeCoordinates(f.scope);

    const observation = typeof f.claim === 'string' ? f.claim.trim() : '';
    if (observation.length === 0) continue;

    // suggestedChange: pick the first evidence text as a seed hint; fall back
    // to restating the claim as an action prompt. Not ideal — fresh analysis
    // emits prescriptive suggestedChange directly — but sufficient for the
    // one-shot backfill path.
    const firstEvidenceText =
      Array.isArray(f.evidence) && f.evidence.length > 0 && typeof f.evidence[0].text === 'string'
        ? f.evidence[0].text
        : '';
    const suggestedChange =
      firstEvidenceText.length > 0
        ? `Evidence from legacy finding: "${firstEvidenceText.slice(0, 140)}"`
        : `Address the claim: ${observation.slice(0, 140)}`;

    // coachingValue: reuse legacy field verbatim if valid, else default.
    const validCoachingValues = new Set(['critical', 'high', 'medium', 'contextual', 'diagnostic']);
    const coachingValue: ImprovementCandidate['coachingValue'] =
      typeof f.coachingValue === 'string' && validCoachingValues.has(f.coachingValue)
        ? (f.coachingValue as ImprovementCandidate['coachingValue'])
        : 'medium';

    const id = buildCandidateId(
      'L3.5',
      paragraph,
      sentence,
      `MIGRATED_FINDING_${f.id ?? 'noid'}_${observation}`,
    );
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    candidates.push({
      id,
      sourceLayer: 'L3.5',
      paragraph,
      sentence,
      sourceFindingId: f.id ?? null,
      observation,
      suggestedChange,
      technique: null, // Legacy findings don't carry named techniques
      demonstrationSketch: null,
      coachingValue,
      // Consolidated: the legacy manifest already consumed these findings.
      lifecycleState: 'consolidated',
      supersededBy: null,
      createdAt: nowIso,
    });
  }

  // ── Source 2: L4 coachingMap.priorities ─────────────────────────────────
  // Legacy coachingMap.priorities[] entries have the shape:
  //   { priority, target, architecturalReason, unlocksNext, expectedImpact }
  // Post-Scope-2 they gain consolidatedFrom/technique/demonstrationSketch.
  // For migration, we treat each legacy priority as an L3.5-sourced
  // candidate (closest lifecycle position) and leave the Scope 2 fields null.
  const priorities = profile.scoreMatrix?.coachingMap?.priorities ?? [];
  for (let i = 0; i < priorities.length; i++) {
    const p = priorities[i];
    if (!p || typeof p !== 'object') continue;

    const targetPara = Array.isArray(p.target?.paragraphs) && p.target.paragraphs.length > 0
      ? p.target.paragraphs[0]
      : -1;
    const observation =
      typeof p.architecturalReason === 'string' && p.architecturalReason.length > 0
        ? p.architecturalReason
        : typeof p.priority === 'string'
          ? p.priority
          : '';
    if (observation.length === 0) continue;

    const suggestedChange =
      typeof p.priority === 'string' && p.priority.length > 0 ? p.priority : observation;

    const coachingValue: ImprovementCandidate['coachingValue'] =
      p.expectedImpact === 'transformative'
        ? 'critical'
        : p.expectedImpact === 'significant'
          ? 'high'
          : 'medium';

    const id = buildCandidateId(
      'L3.5',
      targetPara,
      null,
      `MIGRATED_PRIORITY_${i}_${observation}`,
    );
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    candidates.push({
      id,
      sourceLayer: 'L3.5',
      paragraph: targetPara,
      sentence: null,
      sourceFindingId: null,
      observation,
      suggestedChange,
      technique: null,
      demonstrationSketch: null,
      coachingValue,
      lifecycleState: 'consolidated',
      supersededBy: null,
      createdAt: nowIso,
    });
  }

  // ── Source 3: L3.75 craftAssessment.growthEdges ─────────────────────────
  // Each legacy growth edge has { quality, description, paragraphs[] }.
  // Becomes an L3.75-sourced candidate.
  // `craftAssessment` is non-optional on EssayProfile (profileTypes.ts:1731),
  // but we still check growthEdges defensively in case a corrupt profile
  // persisted without it.
  const growthEdges = profile.craftAssessment?.growthEdges ?? [];
  for (let i = 0; i < growthEdges.length; i++) {
    const edge = growthEdges[i];
    if (!edge || typeof edge !== 'object') continue;

    const paragraph = Array.isArray(edge.paragraphs) && edge.paragraphs.length > 0
      ? edge.paragraphs[0]
      : -1;
    const quality = typeof edge.quality === 'string' ? edge.quality : '';
    const description = typeof edge.description === 'string' ? edge.description : '';
    const observation = [quality, description].filter((s) => s.length > 0).join(': ').trim();
    if (observation.length === 0) continue;

    const suggestedChange =
      description.length > 0 ? `Improve: ${description}` : `Address: ${quality}`;

    const id = buildCandidateId(
      'L3.75',
      paragraph,
      null,
      `MIGRATED_GROWTH_${i}_${observation}`,
    );
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    candidates.push({
      id,
      sourceLayer: 'L3.75',
      paragraph,
      sentence: null,
      sourceFindingId: null,
      observation,
      suggestedChange,
      technique: null,
      demonstrationSketch: null,
      coachingValue: 'medium',
      lifecycleState: 'consolidated',
      supersededBy: null,
      createdAt: nowIso,
    });
  }

  // ── Source 4: admissionsPositioning.redFlags ────────────────────────────
  // Each red flag is a top-severity essay-level observation. admissionsPositioning
  // is an L3.75 holistic-synthesis output, so tag these candidates as L3.75-sourced.
  const redFlags = profile.admissionsPositioning?.redFlags ?? [];
  for (let i = 0; i < redFlags.length; i++) {
    const flag = redFlags[i];
    const observation = typeof flag === 'string' ? flag.trim() : '';
    if (observation.length === 0) continue;

    const id = buildCandidateId(
      'L3.75',
      -1,
      null,
      `MIGRATED_REDFLAG_${i}_${observation}`,
    );
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    candidates.push({
      id,
      sourceLayer: 'L3.75',
      paragraph: -1,
      sentence: null,
      sourceFindingId: null,
      observation,
      suggestedChange: `Resolve red flag: ${observation.slice(0, 140)}`,
      technique: null,
      demonstrationSketch: null,
      coachingValue: 'critical',
      lifecycleState: 'consolidated',
      supersededBy: null,
      createdAt: nowIso,
    });
  }

  // ── Doctrine gate: zero source data is not silently allowed ─────────────
  if (candidates.length === 0) {
    throw PipelineError.noMigrationSource({
      profileId: profile.index?.essayLength
        ? `${profile.index.essayLength.paragraphs}p/${profile.index.essayLength.words}w`
        : undefined,
      reason:
        'All four migration sources (findings, coachingMap.priorities, craftAssessment.growthEdges, ' +
        'admissionsPositioning.redFlags) were empty or missing. This profile must be re-analyzed.',
    });
  }

  console.log(
    `[profileMigration] Migrated ${candidates.length} candidates from legacy profile ` +
      `(findings=${findings.length}, priorities=${priorities.length}, growthEdges=${growthEdges.length}, redFlags=${redFlags.length})`,
  );

  return {
    candidates,
    nextId: candidates.length + 1,
  };
}
