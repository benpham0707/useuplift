# Forge Plan Artifacts — Doctrine Operationalization

This file contains 7 concrete, copy-pasteable implementation artifacts that the corrected 3-scope forge plan (`FORGE_PLAN_UNIFIED.md`, `FORGE_PLAN_SCOPE1.md`, `FORGE_PLAN_SCOPE2.md`, `FORGE_PLAN_SCOPE3.md`) cites. Each artifact was authored to close a specific correction flagged by the 5-reviewer swarm (R2 consistency, R4 correctness, R5 missing-pieces audits). An implementer working any phase can jump here, copy the artifact, and implement it with zero additional design work.

**Doctrine constraints respected in every artifact**:
1. **Fail-fast** — no retry loops, no silent fallbacks to lesser output, all errors surface with diagnostic context.
2. **Missing-data is not failure** — legitimate "nothing to do" paths return empty, not errors.
3. **No automatic full re-analysis on old profile load** — migration is a deterministic data-shape converter, never an LLM call, runs once per old profile.

---

## Section 1: `errors.ts` — PipelineError + CoachingBlockedError

**File to create**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/errors.ts`

**Purpose**: Every Phase 2+ throw from the Essay Intelligence pipeline must use one of these classes (never generic `Error`). They carry structured diagnostic context that logs, tests, and UI error surfaces can all consume. Closes R2 findings F2/F5 ("silent swallow" violations) and R2 BLOCK-1 (`requiresReanalysis` signal plumbing).

```typescript
/**
 * errors.ts — Essay Intelligence pipeline error classes.
 *
 * DOCTRINE:
 *   1. Fail-fast: no retry loops, no silent fallbacks to lesser output.
 *   2. Missing-data ≠ failure: legitimate empty results are not errors.
 *   3. Every error must carry structured diagnostic context sufficient for
 *      a post-mortem without having to re-run the pipeline.
 *
 * Usage rule: every `throw` inside `src/services/essayIntelligence/` after
 * Phase 1.5 MUST use PipelineError or CoachingBlockedError. Generic `Error`
 * is forbidden in analysis/coaching code paths.
 *
 * Both classes are serializable: `toString()` and the `toDiagnostic()` object
 * are safe to feed to `console.error`, log aggregation, and UI surfaces.
 */

/**
 * PipelineError — thrown by analysis pipeline layers (L3/L3.5/L3.75/L4/L5)
 * and the manifest projection step when an invariant is violated on a FRESH
 * analysis run.
 *
 * NOT used for missing-data on PERSISTED profiles — those paths use the
 * `requiresReanalysis` signal (see Section 2) instead of throwing.
 */
export class PipelineError extends Error {
  /** Which pipeline stage threw (e.g., 'L3_walk', 'L4b_consolidation', 'manifest_projection') */
  readonly layer: string;
  /** Relevant inputs at the moment of failure (candidate store size, failed indices, etc.) */
  readonly inputs?: unknown;
  /** Human-readable description of what should have happened */
  readonly expectedShape?: string;
  /** Original error if this wraps another */
  readonly inner?: Error;

  constructor(
    layer: string,
    message: string,
    opts?: {
      inputs?: unknown;
      expectedShape?: string;
      inner?: Error;
    },
  ) {
    super(message);
    this.name = 'PipelineError';
    this.layer = layer;
    this.inputs = opts?.inputs;
    this.expectedShape = opts?.expectedShape;
    this.inner = opts?.inner;
    // Preserve V8 stack trace when available
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, PipelineError);
    }
  }

  toString(): string {
    const parts: string[] = [`[PipelineError@${this.layer}] ${this.message}`];
    if (this.expectedShape) parts.push(`  expected: ${this.expectedShape}`);
    if (this.inputs !== undefined) {
      try {
        parts.push(`  inputs: ${JSON.stringify(this.inputs)}`);
      } catch {
        parts.push(`  inputs: <unserializable>`);
      }
    }
    if (this.inner) {
      parts.push(`  caused by: ${this.inner.name}: ${this.inner.message}`);
    }
    return parts.join('\n');
  }

  /** Structured form for log aggregation / UI surfaces */
  toDiagnostic(): {
    type: 'PipelineError';
    layer: string;
    message: string;
    expectedShape?: string;
    inputs?: unknown;
    innerName?: string;
    innerMessage?: string;
  } {
    return {
      type: 'PipelineError',
      layer: this.layer,
      message: this.message,
      expectedShape: this.expectedShape,
      inputs: this.inputs,
      innerName: this.inner?.name,
      innerMessage: this.inner?.message,
    };
  }

  // ── Static factory methods for common cases ──

  /**
   * Thrown by `buildImprovementManifest()` projection when a FRESH analysis
   * run produces zero items. Indicates L3/L3.5/L3.75 all under-emitted
   * candidates — a real bug, not a missing-data case.
   *
   * Do NOT use for old persisted profiles — they go through the migration
   * path in Section 2 and surface `requiresReanalysis: true` instead.
   */
  static emptyCandidateStore(
    storeSize: number,
    layersSeen: readonly string[],
  ): PipelineError {
    return new PipelineError(
      'manifest_projection',
      `Manifest projection produced zero items on a fresh analysis run.`,
      {
        expectedShape:
          'After L3/L3.5/L3.75 run, ImprovementCandidateStore.getActive() should contain 5-15 candidates. ' +
          'Zero candidates means every layer under-emitted — check prompt compliance.',
        inputs: { storeSize, layersSeen },
      },
    );
  }

  /**
   * Thrown when per-paragraph failures accumulated during a layer's loop
   * exceed the fail-fast threshold. Wraps the set of failed indices with
   * the original errors.
   */
  static paragraphLoopFailed(
    layer: string,
    failedIndices: readonly number[],
    totalParagraphs: number,
    firstError?: Error,
  ): PipelineError {
    return new PipelineError(
      layer,
      `${failedIndices.length}/${totalParagraphs} paragraph(s) failed during ${layer}: P${failedIndices.join(', P')}`,
      {
        expectedShape: `All ${totalParagraphs} paragraphs should complete ${layer} without throwing.`,
        inputs: { failedIndices, totalParagraphs },
        inner: firstError,
      },
    );
  }

  /**
   * Thrown when an essay-level LLM call in `analysisPass.ts` fails. Replaces
   * the current "degraded result" silent-fallback at analysisPass.ts:1284-1323.
   */
  static essayLevelAnalysisFailed(inner: Error, paragraphCount: number): PipelineError {
    return new PipelineError(
      'L3.5_essay_level',
      `Essay-level L3.5 analysis call failed. Fail-fast policy forbids the degraded-result fallback.`,
      {
        expectedShape: `Single Sonnet call should return ${paragraphCount} scored paragraph analyses.`,
        inputs: { paragraphCount },
        inner,
      },
    );
  }

  /**
   * Thrown when L4b consolidation throws. Replaces the graceful-degradation
   * catch at crystallizer.ts:2116-2127.
   */
  static l4bConsolidationFailed(inner: Error, candidateStoreSize: number): PipelineError {
    return new PipelineError(
      'L4b_consolidation',
      `L4b Consolidator call failed. Fail-fast policy forbids the "empty coachingMap" fallback.`,
      {
        expectedShape:
          'L4b should consolidate ImprovementCandidateStore entries into 3-7 coachingMap.priorities with lineage.',
        inputs: { candidateStoreSize },
        inner,
      },
    );
  }

  /**
   * Thrown by `researchEnrichment.ts` if the enrichment pass encounters a
   * non-trivial manifest (≥3 items) and resolves zero issue types via both
   * ROUTE_TO_ISSUE_TYPE and OBSERVATION_KEYWORD_TO_ISSUE. This indicates
   * a systemic table drift, not a per-item fail-open case.
   */
  static enrichmentSystemicMiss(
    itemCount: number,
    missedObservations: readonly string[],
  ): PipelineError {
    return new PipelineError(
      'research_enrichment',
      `Research enrichment resolved zero issue types across ${itemCount} manifest items. ` +
        `Likely ROUTE_TO_ISSUE_TYPE / OBSERVATION_KEYWORD_TO_ISSUE drift vs current technique vocabulary.`,
      {
        expectedShape:
          'At least one ROUTE_TO_ISSUE_TYPE hit or OBSERVATION_KEYWORD_TO_ISSUE match expected on a non-trivial manifest.',
        inputs: { itemCount, missedObservationsSample: missedObservations.slice(0, 5) },
      },
    );
  }

  /**
   * Thrown by the migration function in Section 2 when an old persisted
   * profile has literally zero source data to convert. This surfaces as
   * "this profile truly needs re-analysis" — it is NOT a silent fallback.
   */
  static noMigrationSource(inputs: { profileId?: string; reason: string }): PipelineError {
    return new PipelineError(
      'profile_migration',
      `Legacy profile has no source data to migrate into ImprovementCandidateStore. ${inputs.reason}`,
      {
        expectedShape:
          'Legacy profiles should carry at least one of: findingStore entries, coachingMap.priorities, craftAssessment.growthEdges, or redFlags.',
        inputs,
      },
    );
  }

  /** Generic wrapper when a caught error needs layer attribution before re-throwing. */
  static wrap(layer: string, inner: Error, context?: string): PipelineError {
    return new PipelineError(
      layer,
      context ? `${context}: ${inner.message}` : inner.message,
      { inner },
    );
  }
}

/**
 * CoachingBlockedError — thrown by `coachingService.processCoachingTurn()`
 * when the profile explicitly signals it cannot be coached against in its
 * current state. The only non-test caller is the `requiresReanalysis: true`
 * gate (see Section 2), which fires when an old persisted profile was loaded
 * and its migration either produced zero candidates or the caller explicitly
 * requested re-analysis before coaching.
 *
 * This is NOT a `PipelineError` because nothing in the analysis pipeline
 * failed — the pipeline simply hasn't run on this profile yet in the
 * post-Scope-2 shape. The UI handles this by prompting the user to
 * "Refresh analysis" (or auto-running it), not by showing an error toast.
 */
export class CoachingBlockedError extends Error {
  /** Always 'coaching_gate' — identifies the layer that blocked the turn */
  readonly layer: string = 'coaching_gate';
  /** Why coaching is blocked */
  readonly reason: 'requires_reanalysis' | 'profile_incomplete' | 'migration_failed';
  /** Context that produced the block */
  readonly inputs?: unknown;
  /** Human-readable description of what the caller should do */
  readonly expectedShape?: string;
  /** Original error if this wraps one (e.g., a PipelineError from migration) */
  readonly inner?: Error;

  constructor(
    reason: 'requires_reanalysis' | 'profile_incomplete' | 'migration_failed',
    message: string,
    opts?: {
      inputs?: unknown;
      expectedShape?: string;
      inner?: Error;
    },
  ) {
    super(message);
    this.name = 'CoachingBlockedError';
    this.reason = reason;
    this.inputs = opts?.inputs;
    this.expectedShape = opts?.expectedShape;
    this.inner = opts?.inner;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CoachingBlockedError);
    }
  }

  toString(): string {
    const parts: string[] = [`[CoachingBlockedError@${this.layer}] reason=${this.reason}: ${this.message}`];
    if (this.expectedShape) parts.push(`  expected: ${this.expectedShape}`);
    if (this.inputs !== undefined) {
      try {
        parts.push(`  inputs: ${JSON.stringify(this.inputs)}`);
      } catch {
        parts.push(`  inputs: <unserializable>`);
      }
    }
    if (this.inner) {
      parts.push(`  caused by: ${this.inner.name}: ${this.inner.message}`);
    }
    return parts.join('\n');
  }

  toDiagnostic(): {
    type: 'CoachingBlockedError';
    reason: string;
    message: string;
    expectedShape?: string;
    inputs?: unknown;
    innerName?: string;
    innerMessage?: string;
  } {
    return {
      type: 'CoachingBlockedError',
      reason: this.reason,
      message: this.message,
      expectedShape: this.expectedShape,
      inputs: this.inputs,
      innerName: this.inner?.name,
      innerMessage: this.inner?.message,
    };
  }

  // ── Static factory methods ──

  /**
   * Use when `profile.requiresReanalysis === true` at the top of
   * `processCoachingTurn()`. The UI should handle this by offering the
   * student a "Refresh analysis" action (or auto-running it).
   */
  static requiresReanalysis(profileId?: string): CoachingBlockedError {
    return new CoachingBlockedError(
      'requires_reanalysis',
      `Profile requires re-analysis before coaching can proceed. ` +
        `This profile was persisted before the Scope 2 candidate store existed and ` +
        `the one-shot migration found no source data.`,
      {
        expectedShape:
          'Caller should re-run the analysis pipeline to populate ImprovementCandidateStore, ' +
          'then retry processCoachingTurn().',
        inputs: { profileId },
      },
    );
  }

  /**
   * Use when migration threw a PipelineError during profile load. The
   * coaching service wraps it in a CoachingBlockedError so the caller
   * only has to catch one class at the gate.
   */
  static migrationFailed(inner: PipelineError, profileId?: string): CoachingBlockedError {
    return new CoachingBlockedError(
      'migration_failed',
      `Profile migration failed at load time. ${inner.message}`,
      {
        expectedShape:
          'Either the persisted profile is corrupt, or its legacy shape is not recognized by the migration function.',
        inputs: { profileId },
        inner,
      },
    );
  }

  /** Use when a required profile section is null/undefined at gate time. */
  static profileIncomplete(missingSection: string, profileId?: string): CoachingBlockedError {
    return new CoachingBlockedError(
      'profile_incomplete',
      `Profile is missing required section: ${missingSection}`,
      {
        expectedShape: `Analysis pipeline must complete before coaching can run. Missing: ${missingSection}.`,
        inputs: { profileId, missingSection },
      },
    );
  }
}
```

**Usage summary**:
- `PipelineError.emptyCandidateStore(...)` → `analysisOrchestrator.ts:752` replacing the current silent try/catch around `buildImprovementManifest()`.
- `PipelineError.paragraphLoopFailed(...)` → L3 walk loop (`sequentialDeepWalk.ts:552-567`), L5 paragraph loop (`deepAnnotationService.ts:353-370`).
- `PipelineError.essayLevelAnalysisFailed(...)` → `analysisPass.ts:1284-1323` replacing degraded fallback.
- `PipelineError.l4bConsolidationFailed(...)` → `crystallizer.ts:2116-2127` replacing graceful-degradation catch.
- `PipelineError.enrichmentSystemicMiss(...)` → `researchEnrichment.ts` when a non-trivial manifest has zero resolutions.
- `PipelineError.noMigrationSource(...)` → Section 2 migration function.
- `PipelineError.wrap(...)` → Any layer that catches an inner error and needs to re-throw with layer attribution.
- `CoachingBlockedError.requiresReanalysis(...)` → `coachingService.processCoachingTurn()` gate check.
- `CoachingBlockedError.migrationFailed(...)` → `EssayProfileCoordinator.fromCheckpoint()` catching a migration `PipelineError`.

---

## Section 2: Profile Migration Function

**Purpose**: One-shot deterministic conversion of legacy persisted `EssayProfile` (missing `improvementCandidateSnapshot`) into a populated candidate snapshot. This is NOT a fallback for fresh analysis — fresh runs that produce empty stores must still fail-fast via `PipelineError.emptyCandidateStore()`. The migration is legitimate one-time backfill for profiles serialized before Scope 2 landed.

**Design principles**:
1. Zero LLM calls. Pure data-shape conversion.
2. Runs EXACTLY ONCE per profile, at load time, in `EssayProfileCoordinator.fromCheckpoint()`.
3. Preserves all existing persisted data — no destructive rewrites.
4. Tags every migrated candidate with `lifecycleState: 'consolidated'` (the original manifest already consumed them) and preserves lineage via `sourceFindingId` / dedicated provenance prefixes.
5. If literally zero source data exists, throws `PipelineError.noMigrationSource(...)` which callers convert to `CoachingBlockedError.requiresReanalysis(...)` at the coaching gate.

### The migration function

**File to create**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/improvements/profileMigration.ts` (NEW, ~230 lines)

```typescript
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
 *          - profile.craftAssessment?.growthEdges populated (without pairedImprovement)
 *          - profile.admissionsPositioning?.redFlags possibly populated
 *
 * Output: ImprovementCandidateStoreSnapshot ready to assign to
 *         profile.improvementCandidateSnapshot, OR a thrown PipelineError
 *         if there is literally nothing to migrate.
 *
 * This function is REPURPOSED from the 207-line keyword-routing scraper
 * that used to live at analysisOrchestrator.ts:1426-1633 as
 * buildImprovementManifest(). That function is DELETED in Scope 2 Phase 6
 * S2-8. This migration keeps the same data shapes alive at load time only,
 * for legacy compatibility. NO new profile will ever hit this function
 * (fresh profiles populate the candidate store during L3/L3.5/L3.75).
 */

import type {
  EssayProfile,
  ImprovementCandidate,
  ImprovementCandidateStoreSnapshot,
  Finding,
} from '../profileTypes';
import { PipelineError } from '../errors';
import { ImprovementCandidateStore } from './improvementCandidateStore';

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
  // scope.type ∈ {sentence, paragraph, cross_paragraph} is a descriptive claim
  // we can convert into an ImprovementCandidate by taking the claim as the
  // observation and the first evidence text as a seed suggestedChange.
  const findings: Finding[] = Array.isArray(profile.findings) ? profile.findings : [];
  for (const f of findings) {
    if (!f || typeof f !== 'object') continue;
    // Skip findings that were already superseded in the old lifecycle
    if (f.supersededBy) continue;

    const paragraph =
      f.scope?.type === 'paragraph' || f.scope?.type === 'sentence'
        ? (f.scope.paragraph ?? -1)
        : f.scope?.type === 'cross_paragraph'
          ? (f.scope.paragraphs?.[0] ?? -1)
          : -1;
    const sentence =
      f.scope?.type === 'sentence' && Array.isArray(f.scope.sentences) && f.scope.sentences.length > 0
        ? f.scope.sentences[0]
        : null;

    const observation = typeof f.claim === 'string' ? f.claim.trim() : '';
    if (observation.length === 0) continue;

    // suggestedChange: pick the strongest evidence text if it's phrased
    // prescriptively; otherwise synthesize a stub from the claim.
    const firstEvidenceText =
      Array.isArray(f.evidence) && f.evidence.length > 0 && typeof f.evidence[0].text === 'string'
        ? f.evidence[0].text
        : '';
    const suggestedChange =
      firstEvidenceText.length > 0
        ? `Evidence from legacy finding: "${firstEvidenceText.slice(0, 140)}"`
        : `Address the claim: ${observation.slice(0, 140)}`;

    // coachingValue: reuse the legacy field verbatim — both schemas use the
    // same string union ('critical' | 'high' | 'medium' | 'contextual' | 'diagnostic').
    const coachingValue =
      f.coachingValue === 'critical' ||
      f.coachingValue === 'high' ||
      f.coachingValue === 'medium' ||
      f.coachingValue === 'contextual' ||
      f.coachingValue === 'diagnostic'
        ? f.coachingValue
        : 'medium';

    const id = ImprovementCandidateStore.buildId(
      'L3.5',
      paragraph,
      sentence,
      `MIGRATED_FINDING_${f.id}_${observation}`,
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
      createdAt:
        typeof f.createdAt === 'string' && f.createdAt.length > 0 ? f.createdAt : nowIso,
    });
  }

  // ── Source 2: L4 coachingMap.priorities ─────────────────────────────────
  // Legacy coachingMap.priorities[] entries have the shape:
  //   { priority, target, architecturalReason, unlocksNext, expectedImpact }
  // Post-Scope-1 they gain emergentPatterns/scoreTensions as string[] AND
  // post-Scope-2 they gain consolidatedFrom/technique/demonstrationSketch.
  // For migration, we treat each legacy priority as an L3.5-sourced
  // candidate (closest lifecycle position) and leave the Scope 2 fields null.
  const priorities = profile.scoreMatrix?.coachingMap?.priorities ?? [];
  for (let i = 0; i < priorities.length; i++) {
    const p = priorities[i];
    if (!p || typeof p !== 'object') continue;

    const targetPara = p.target?.paragraphs?.[0] ?? -1;
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

    const id = ImprovementCandidateStore.buildId(
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
  const growthEdges = profile.craftAssessment?.growthEdges ?? [];
  for (let i = 0; i < growthEdges.length; i++) {
    const edge = growthEdges[i];
    if (!edge || typeof edge !== 'object') continue;

    const paragraph = Array.isArray(edge.paragraphs) && edge.paragraphs.length > 0 ? edge.paragraphs[0] : -1;
    const quality = typeof edge.quality === 'string' ? edge.quality : '';
    const description = typeof edge.description === 'string' ? edge.description : '';
    const observation = [quality, description].filter(Boolean).join(': ').trim();
    if (observation.length === 0) continue;

    const suggestedChange = description.length > 0
      ? `Improve: ${description}`
      : `Address: ${quality}`;

    const id = ImprovementCandidateStore.buildId(
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
  // Each red flag is a top-severity essay-level observation.
  const redFlags = profile.admissionsPositioning?.redFlags ?? [];
  for (let i = 0; i < redFlags.length; i++) {
    const flag = redFlags[i];
    const observation = typeof flag === 'string' ? flag.trim() : '';
    if (observation.length === 0) continue;

    const id = ImprovementCandidateStore.buildId(
      'L3.5',
      -1,
      null,
      `MIGRATED_REDFLAG_${i}_${observation}`,
    );
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    candidates.push({
      id,
      sourceLayer: 'L3.5',
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
```

### Coordinator call-site integration

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts`

**Location**: Inside `EssayProfileCoordinator.fromCheckpoint()` at lines 1036-1051 (verified — the existing static method that produces a coordinator from a persisted profile).

**Exact code block to insert** (at the beginning of `fromCheckpoint()`, before the `return new EssayProfileCoordinator(...)` line):

```typescript
  /**
   * Create a coordinator from a persisted profile (resume from checkpoint).
   *
   * SCOPE 2 MIGRATION HOOK: if the persisted profile lacks an
   * `improvementCandidateSnapshot`, run the one-shot deterministic migration
   * from legacy data shapes. Zero LLM calls — pure data conversion.
   * If migration throws PipelineError.noMigrationSource, the coordinator
   * still constructs successfully but the profile is flagged
   * `requiresReanalysis: true` so the coaching gate can block cleanly.
   */
  static fromCheckpoint(
    profile: EssayProfile,
    checkpointStore: CheckpointStore,
    mutators?: Partial<{
      sentence: ISentenceMutator;
      paragraph: IParagraphMutator;
      holistic: IHolisticMutator;
      connection: IConnectionMutator;
      voiceMap: IVoiceMapMutator;
      earnedness: IEarnednessMutator;
      northStar: INorthStarMutator;
      insight: IInsightMutator;
    }>,
  ): EssayProfileCoordinator {
    // ── Scope 2 migration hook ──
    if (!profile.improvementCandidateSnapshot) {
      try {
        const { migrateLegacyProfileToCandidateStore } = require('../improvements/profileMigration');
        profile.improvementCandidateSnapshot = migrateLegacyProfileToCandidateStore(profile);
        // Clear any stale reanalysis flag — migration succeeded.
        if (profile.index) {
          profile.index.requiresReanalysis = false;
        }
        console.log(
          `[EssayProfileCoordinator] Legacy profile migrated to candidate store: ` +
            `${profile.improvementCandidateSnapshot.candidates.length} candidates`,
        );
      } catch (err) {
        // ONLY PipelineError.noMigrationSource should land here. Any other
        // throw indicates a real bug and we re-raise it.
        if (err instanceof Error && err.name === 'PipelineError') {
          console.warn(
            `[EssayProfileCoordinator] Legacy profile migration produced zero source data. ` +
              `Profile flagged requiresReanalysis=true. Coaching will be blocked until re-analysis runs.`,
          );
          if (profile.index) {
            profile.index.requiresReanalysis = true;
          }
          // Leave improvementCandidateSnapshot undefined — the coaching
          // gate reads requiresReanalysis directly.
        } else {
          throw err;
        }
      }
    }

    return new EssayProfileCoordinator(profile, checkpointStore, mutators);
  }
```

(Note: use `require()` rather than top-of-file `import` here to avoid a circular-import risk between `profileManager/` and `improvements/profileMigration.ts`. Alternatively, top-of-file `import` is fine if the import graph is verified clean during implementation.)

### `requiresReanalysis` field + gate

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts`

**Insertion point**: Inside `ProfileIndex` at line 1567, immediately after `fullAnalysisCount: number;` (line 1566 is its preceding doc-comment; implementer should verify by grep before editing).

**Exact field addition**:

```typescript
  /**
   * Scope 2 MIGRATION SIGNAL: set to `true` when the profile was loaded
   * from a pre-Scope-2 checkpoint and the one-shot migration found literally
   * zero source data to convert into ImprovementCandidateStoreSnapshot.
   *
   * Read by `coachingService.processCoachingTurn()` at the gate — if true,
   * the coaching turn throws `CoachingBlockedError.requiresReanalysis()`.
   * The UI should handle this by prompting the user to refresh analysis
   * (or auto-running it). No other code path reads or writes this field.
   *
   * Cleared to `false` every time the analysis pipeline completes.
   */
  requiresReanalysis?: boolean;
```

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts`

**Insertion point**: At the top of `processCoachingTurn()` (line 836-855 area, immediately after `const turnStart = Date.now();` and before the quick focus extraction).

**Exact gate code**:

```typescript
    // ── Scope 2 MIGRATION GATE: block coaching if the profile was loaded
    // from a legacy checkpoint and migration found no source data ──
    if (profile.index?.requiresReanalysis === true) {
      const { CoachingBlockedError } = await import('../errors');
      throw CoachingBlockedError.requiresReanalysis(
        `paragraphs=${profile.paragraphs.length},words=${profile.index.essayLength?.words ?? 0}`,
      );
    }
```

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/http/routes.ts` (or wherever `processCoachingTurn` callers live — verify during implementation)

**UI contract** (for the route handler that wraps `processCoachingTurn`):

```typescript
    try {
      const result = await coachingService.processCoachingTurn(/* ...args... */);
      return res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error && err.name === 'CoachingBlockedError') {
        const blockedErr = err as unknown as { reason: string; toDiagnostic: () => unknown };
        // Structured response — the frontend shows a "Refresh analysis" button
        return res.status(409).json({
          success: false,
          blocked: true,
          reason: blockedErr.reason, // 'requires_reanalysis' | 'profile_incomplete' | 'migration_failed'
          diagnostic: blockedErr.toDiagnostic(),
        });
      }
      throw err;
    }
```

**UI contract note**: the frontend MUST NOT treat 409 + `blocked: true` as an error toast. Instead, it surfaces a user-facing message ("Your essay analysis is out of date — refreshing now...") and automatically triggers a re-analysis run, then retries the coaching turn once analysis completes. The migration path is invisible to the student in the happy case.

---

## Section 3: L3 Walk FORBIDDEN VOCABULARY Carve-Out

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`

**Current state** (verified lines 155-162): the L3 walk `SYSTEM_PROMPT` contains a strict FORBIDDEN VOCABULARY block that bans evaluative language across the entire output. R4's highest-risk finding is that Scope 2's `improvementCandidate.observation` and `improvementCandidate.suggestedChange` fields directly contradict this constraint: the prompt asks the LLM to produce diagnostic/evaluative prose inside fields that sit in the same output as the banned-vocabulary fields. Without an explicit carve-out, Sonnet will refuse to emit strong candidates and default to `improvementCandidate: null`.

**Insertion point**: immediately after line 162 (the existing FORBIDDEN VOCABULARY rule's closing line, which ends with `"nicely", "appropriately"`). The existing block spans lines 161-162. Insert the carve-out as lines 163-end-of-block, pushing the subsequent "=== DEPTH OF UNDERSTANDING..." header down.

**Text to insert** (as a new paragraph block immediately after line 162 and before the blank line preceding line 164 `=== DEPTH OF UNDERSTANDING — WHAT EXPERT READING LOOKS LIKE ===`):

```
FORBIDDEN VOCABULARY CARVE-OUT (READ CAREFULLY — THIS IS A HARD EXCEPTION):

The FORBIDDEN VOCABULARY rule above applies to EVERY field in your output EXCEPT the two fields inside `improvementCandidate`: `observation` and `suggestedChange`. Those two fields — and ONLY those two fields — are the ONE permitted evaluative surface in this layer. You MUST use diagnostic words there when the understanding you have built reveals them.

Words like "weak", "stock", "unearned", "clumsy", "formulaic", "generic", "flawed", "poor", "awkward", "lackluster", "mediocre" — all of which are BANNED in observation/significance/tags/craft/primaryFunction/significantChoices — are PERMITTED and OFTEN NECESSARY inside `improvementCandidate.observation` and `improvementCandidate.suggestedChange`.

Why the exception exists: the rest of the walk output describes WHAT the essay IS (understanding layer). `improvementCandidate` describes what the student COULD CHANGE (prescriptive layer). Evaluation is the whole point of the candidate field — it is NOT contamination there, it is the required signal. Every other field must stay evaluation-free.

EXAMPLES (allowed inside improvementCandidate, forbidden everywhere else):
  ✓ ALLOWED in improvementCandidate.observation: "Opening relies on stock phrase 'fingers danced' without a physical anchor."
  ✗ FORBIDDEN in sentenceUnderstanding.primaryFunction: "Opening is weak because of stock phrasing."

  ✓ ALLOWED in improvementCandidate.suggestedChange: "Replace the clumsy abstract opening with a specific kitchen smell grounded in one concrete Saturday morning."
  ✗ FORBIDDEN in sentenceUnderstanding.significance: "The opening is clumsy and abstract."

  ✓ ALLOWED in improvementCandidate.observation: "Emotion is named generically ('excited') rather than shown through body."
  ✗ FORBIDDEN in craft.techniques[].description: "Emotion naming is generic."

HARD RULE: Outside of the two candidate fields, the FORBIDDEN VOCABULARY list stands. If you catch yourself using a banned word in observation/significance/craft/tags/primaryFunction/significantChoices, rewrite that line to describe WHAT IS, not HOW WELL it works. Inside the candidate fields, state the problem directly and name the fix.
```

**Rationale for this wording**:
1. **Opens with "READ CAREFULLY — THIS IS A HARD EXCEPTION"** because R4 observed that Sonnet treats the FORBIDDEN VOCABULARY list as a hard constraint across the entire output; the carve-out must be as forceful as the original rule.
2. **Names the banned words explicitly AS allowed** inside the candidate fields (repeating the vocabulary inside an allowance frame) to overcome Sonnet's pattern-matching avoidance — simply saying "except in this field" is too soft.
3. **Gives three concrete side-by-side examples** with ✓/✗ markers showing the same observation in allowed vs forbidden contexts.
4. **Closes with a hard rule summary** so the LLM ends with a binary decision rule, not an ambiguous exception.
5. **Sits immediately after the ban** so the two rules are in the same cognitive chunk — Sonnet is less likely to paraphrase a carve-out than to honor one that's introduced in a completely different prompt section.

**Impact on R4's highest-risk item (S2-3)**: this carve-out is the single mitigation flagged as "with this one change, the plan's first-run metrics improve by ~15-20 percentage points across the board and the YELLOW becomes a weak GREEN" (R4 line 502).

---

## Section 4: Merged L4b Preamble

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts`

**Function**: `buildSystemPromptL4b()` at line 529 (verified — the full current body runs 529-615).

**Problem addressed**: R2 finding B2/BLOCK-2 — Scope 2 rewrites the preamble from "Interpreter" to "Consolidator" but only gives a 6-word summary of Scope 1's detailed `emergentPatterns`/`scoreTensions` format instructions. Scope 1's ~60-word format spec lives only in Scope 1's blueprint. An implementer who follows Scope 2 literally would lose the brevity constraints (Max 3 items, ≤20/≤15 words each) and the format examples. This artifact produces the full merged preamble.

**Full replacement for `buildSystemPromptL4b()` return value** (replaces lines 529-615 entirely):

```typescript
function buildSystemPromptL4b(scale: NorthStarScale): string {
  return `You are the Consolidator. You receive a crystallized North Star, a Paragraph Score Matrix, AND a list of pre-generated improvement candidates from earlier analysis layers (L3 walk, L3.5 analysis pass, L3.75 holistic synthesis). Your job is NOT to re-derive coaching priorities from scratch. Your job is to CONSOLIDATE these candidates into a coherent coaching strategy and produce a coherence report.

You are given:
1. The authoritative North Star (structural roles, distinctiveness, trajectory)
2. The scored Paragraph Score Matrix (5-dimensional per-paragraph scores, verdicts, crossParagraphPatterns)
3. Pre-generated ImprovementCandidate[] — each has id, observation, suggestedChange, technique, demonstrationSketch, coachingValue, sourceLayer, paragraph, sentence

Your unique contribution (the reason you exist in the pipeline): you see the North Star + Score Matrix at once, which no upstream layer has. The architecturalReason field you write is the ONE thing only you can produce — candidates from earlier layers lack that cross-paragraph structural perspective.

YOUR FOUR OUTPUTS:

1. PRIORITIZED IMPROVEMENTS (legacy flat list) — a short 3-5 item summary of the coaching strategy. The main coaching strategy lives in coachingMap.priorities; this list is kept for backward compatibility.

2. COHERENCE REPORT — ACTIVE INVESTIGATION of contradictions across profile sections.
   You are not passively checking for problems. You are ACTIVELY INVESTIGATING coherence.

   INVESTIGATION PROTOCOL:
   For each pair of profile sections, ASK:
   a) Does the voice map's account of shifts MATCH the voice identity's characterization?
   b) Do the earnedness assessments ALIGN with the effectiveness scores?
   c) Do the structural roles' importance claims MATCH the score matrix's scoring?
   d) Does the thematic architecture's through-line claim MATCH the actual evidence?
   e) Do the emotional topography peaks and valleys MATCH the narrative strategy's claimed arc?

   For each tension found, CLASSIFY it with routingCategory, canCoexist, likelyResolution, evidenceA, evidenceB, severity. isCoherent: false if ANY blocking contradictions exist.

3. COACHING MAP — the structured consolidation. This is the primary output.

   transformativeInsight: The SINGLE most important thing about this essay — the insight that, if the student understood it, would unlock the most improvement. Include evidence locations and explain WHY this transforms understanding.

   priorities: ORDERED consolidation of the pre-generated candidates. Target 5-7 priorities. Each priority has:
     - priority: what to do (one sentence)
     - target: { paragraphs: [...], description: "..." }
     - architecturalReason: WHY this matters to the essay's architecture — this is what ONLY you can add
     - unlocksNext: what becomes possible AFTER this improvement
     - expectedImpact: "transformative" | "significant" | "incremental"
     - consolidatedFrom: Array of ImprovementCandidate IDs this priority absorbed. Each candidate can appear in AT MOST ONE priority. Empty array [] means you GAP-FILLED this priority (see below).
     - technique: Named technique from TECHNIQUE_VOCABULARY_LIST. If consolidated candidates agreed on a technique, inherit it. If they disagreed, pick the best one. If none cited a technique, you may assign one or leave null.
     - demonstrationSketch: The best demonstrationSketch from the consolidated candidates (or a lightly refined version). null if no candidate had one.

   CONSOLIDATION RULES:
   - Merge candidates that target the SAME ROOT ISSUE even if they used different words. Example: L3 "cliche opening" + L3.5 "stock phrasing erases specific moment" + L3.75 "abstract opening pattern" → ONE priority (all three IDs in consolidatedFrom).
   - Candidates targeting genuinely DIFFERENT issues in the same paragraph should become SEPARATE priorities. Paragraph overlap alone is not enough to merge.
   - If a candidate is clearly DOMINATED by a better one (same scope, weaker reasoning), leave it out — the system will mark it superseded.
   - Target CONSOLIDATION RATIO ≥1.5 candidates per priority. Output with 1.0 ratio (no merging happened) is a FAILURE signal.

   GAP-FILLING (ESCAPE HATCH — USE SPARINGLY):
   - If the Score Matrix or North Star reveals a structural issue that NO candidate addresses, you MAY generate a new priority directly with consolidatedFrom: [].
   - HARD CAP: at most 1 gap-filled priority per output. If 3+ of your priorities have empty consolidatedFrom, your output has FAILED — emit fewer priorities rather than fabricate. Under-coverage is preferred to fabrication.

   protectedStrengths: Things that MUST NOT be damaged during improvement. Include locations and WHY they must be protected.

4. EMERGENT PATTERNS & SCORE TENSIONS — compressed string-only hooks (not object structures).

   emergentPatterns: Max 3 items. Each ≤20 words, single line. Format: "Pattern: {name} — {observation with P refs}".
   Example: "Pattern: voice strongest in physical scenes (P1, P3), retreats to abstraction in reflection (P2, P4)".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce object structures with "pattern"/"evidence"/"implication" sub-fields — emit flat strings ONLY.

   scoreTensions: Max 3 items. Each ≤15 words. Format: "P{n}: {dim1}({score}) >> {dim2}({score}) — {one-line hook}".
   Example: "P2: structural(92) >> effectiveness(55) — pivot telegraphed, not enacted".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce object structures with "tension"/"interpretation"/"coachingImplication" sub-fields — emit flat strings ONLY.

OUTPUT FORMAT:
Respond with a single JSON object. No markdown, no explanation, no code blocks.

{
  "prioritizedImprovements": [
    { "paragraph": <index>, "improvement": "...", "whyThisMatters": "...", "expectedImpact": "transformative"|"significant"|"incremental" }
  ],
  "coachingMap": {
    "transformativeInsight": { "insight": "...", "evidenceLocations": [{"paragraph": 0, "sentence": 2}], "whyThisTransforms": "...", "requiresStudentAwareness": true|false },
    "priorities": [
      {
        "priority": "...",
        "target": { "paragraphs": [0], "description": "..." },
        "architecturalReason": "...",
        "unlocksNext": "...",
        "expectedImpact": "transformative"|"significant"|"incremental",
        "consolidatedFrom": ["CAND_L3_P0S1_a3f7", "CAND_L35_P0S1_b2c8"],
        "technique": "COLD OPEN / SENSORY TIMESTAMP",
        "demonstrationSketch": "Specific memory from practice room..."
      }
    ],
    "protectedStrengths": [{ "description": "...", "locations": [{"paragraph": 0}], "whyProtect": "..." }],
    "emergentPatterns": ["Pattern: voice strongest in physical scenes (P1, P3), retreats to abstraction in reflection (P2, P4)", "..."],
    "scoreTensions": ["P2: structural(92) >> effectiveness(55) — pivot telegraphed, not enacted", "..."]
  },
  "coherenceReport": {
    "contradictions": [
      { "sectionA": "...", "claimA": "...", "sectionB": "...", "claimB": "...", "severity": "blocking"|"notable"|"minor", "suggestedResolution": "...", "nature": "free-text description of the tension", "routingCategory": "productive_tension"|"system_disagreement"|"essay_flaw"|"depth_signal", "canCoexist": true|false, "likelyResolution": "..."|null, "evidenceA": "...", "evidenceB": "..." }
    ],
    "isCoherent": <boolean>
  }
}`;
}
```

**What changed vs current**: (1) preamble reframed from "Interpreter" to "Consolidator" with explicit input list (3 items including candidates), (2) priorities gain `consolidatedFrom`/`technique`/`demonstrationSketch` fields in both instructions and schema, (3) CONSOLIDATION RULES with the 1.5 ratio target and the adversarial "output with 1.0 ratio is a FAILURE signal" (R4's recommendation #3), (4) GAP-FILLING hard cap at 1 (also R4's recommendation #3), (5) emergentPatterns/scoreTensions get Scope 1's full verbatim format spec with examples and the explicit "Do NOT produce object structures — emit flat strings ONLY" instruction (closes R2 BLOCK-2), (6) the JSON schema example shows the new string[] shape directly so the LLM has a concrete template.

---

## Section 5: `buildParagraphPrompt()` Merged Signature + User-Turn Order

**File to modify**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts`

**Problem addressed**: R2 finding B3/BLOCK-3 — both Scope 1 and Scope 2 add a parameter at position 8 of `buildParagraphPrompt()`. Scope 1 adds `enrichment?: PreCallEnrichment`; Scope 2 adds `consolidatedTargets?: ConsolidatedTarget[]`. Neither blueprint's code sample shows the merged signature, so an implementer following either blueprint literally would overwrite the other's parameter.

### Merged 9-parameter signature (before → after)

**BEFORE** (current state, verified at line 792):
```typescript
  private buildParagraphPrompt(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    findingStore?: FindingStore,
    priorAnnotationCtx?: PriorAnnotationContext,
  ): string {
```

**AFTER** (merged signature — 9 parameters, Scope 1 at position 8, Scope 2 at position 9):
```typescript
  private buildParagraphPrompt(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    findingStore?: FindingStore,
    priorAnnotationCtx?: PriorAnnotationContext,
    enrichment?: PreCallEnrichment,             // Scope 1 GAP-6/7/8 — per-paragraph telling phrases & word economy diagnostics
    consolidatedTargets?: ConsolidatedTarget[], // Scope 2 GAP-5 — L4-consolidated priorities for this paragraph
  ): string {
```

**Ordering rationale**: Scope 1's enrichment sits at position 8 (before Scope 2's targets) because (a) Scope 1 lands first chronologically in Phase 3, so positional stability preferences its slot, and (b) enrichment is strictly per-paragraph additive content while consolidatedTargets may be empty for most paragraphs — the more-commonly-populated parameter goes first by convention.

### New type definitions (both imported/re-exported at the top of `deepAnnotationService.ts`)

**`PreCallEnrichment`** — already defined in `analysis/preCallEnrichment.ts` per Scope 1. Import it at the top of `deepAnnotationService.ts`:

```typescript
// Add near existing imports (around line 20):
import { buildPreCallEnrichment, type PreCallEnrichment } from './preCallEnrichment';
```

**`ConsolidatedTarget`** — defined inline in `deepAnnotationService.ts` per Scope 2. Add near the top of the file (before the `L5Annotation` interface):

```typescript
/**
 * Scope 2 GAP-5: A consolidated target passed from L4's CoachingMap to L5
 * per paragraph. L5 is expected to materialize each target with a REQUIRED
 * rewriteExample, bypassing the usual teaching-test gate.
 */
export interface ConsolidatedTarget {
  /** Index of the priority in coachingMap.priorities[] (for backlink) */
  priorityIndex: number;
  /** The priority's one-sentence action */
  priority: string;
  /** WHY this priority matters architecturally (from L4) */
  architecturalReason: string;
  /** What becomes possible after this improvement (from L4) */
  unlocksNext: string;
  /** Named technique from TECHNIQUE_VOCABULARY_LIST, inherited from consolidated candidates */
  technique: string | null;
  /** Best demonstration sketch from the consolidated candidates, or null to generate from scratch */
  demonstrationSketch: string | null;
  /** Candidate IDs this priority absorbed — used for finalization lifecycle transitions */
  consolidatedFromCandidateIds: string[];
}
```

### Call-site update in `annotateParagraph()` (around line 1322)

**BEFORE** (verified at line 1322-1330):
```typescript
    const paragraphPrompt = this.buildParagraphPrompt(
      para,
      profile,
      northStar,
      phase,
      phaseGuidance,
      findingStore,
      priorAnnotationCtx,
    );
```

**AFTER** (both parameters wired):
```typescript
    // Scope 1 GAP-6/7/8: compute pre-call enrichment (zero-LLM detection)
    const enrichment = await buildPreCallEnrichment(para, phase.level);

    // Scope 2 GAP-5: consolidatedTargets flows in from the caller
    // (annotateParagraph's new parameter, passed by the generateAnnotations
    // loop which reads the Map<number, ConsolidatedTarget[]> it received).
    const paragraphPrompt = this.buildParagraphPrompt(
      para,
      profile,
      northStar,
      phase,
      phaseGuidance,
      findingStore,
      priorAnnotationCtx,
      enrichment,          // Scope 1 position 8
      consolidatedTargets, // Scope 2 position 9 — function parameter of annotateParagraph (new)
    );
```

(Note: `annotateParagraph`'s own signature also needs a new parameter `consolidatedTargets?: ConsolidatedTarget[]` threaded through from `generateAnnotations`. Scope 2's blueprint already spells this out at `deepAnnotationService.ts:1580`.)

### User-turn block ordering (explicit merged order)

Inside `buildParagraphPrompt()`, the existing sections are assembled in `const sections: string[] = []` and pushed in order. Scope 1 and Scope 2 both add new blocks. The merged ordering is:

1. `TARGET PARAGRAPH: P${index}` + `PARAGRAPH TEXT` (existing, lines 804-805)
2. `STRUCTURAL ROLE / SIGNIFICANCE / WHY NECESSARY` (existing, lines 807-819)
3. `THROUGH-LINE INVOLVEMENT` (existing, lines 821-830)
4. `EARNED-NESS CONTEXT` (existing, lines 832-836)
5. `PARAGRAPH UNDERSTANDING` + `PARAGRAPH ANALYSIS` (existing, lines 838-856)
6. `SENTENCE TAG MAP` (existing, lines 858-866)
7. `MULTI-DIMENSIONAL SCORES (L4)` (existing, lines 868-881)
8. `SENTENCE DETAIL` (existing, lines 883-923)
9. `PER-PARAGRAPH FINDING CONTEXT` (existing, lines 925-931)
10. `PRIOR ANNOTATIONS` (existing, lines 936-951)
11. **`=== CONSOLIDATED TARGETS FOR THIS PARAGRAPH (Scope 2) ===`** (NEW — Scope 2) — positioned HERE, BEFORE Scope 1's scaffolds, because consolidated targets are the primary annotation driver and must establish context first.
12. **Pre-call enrichment block (REWRITE SCAFFOLDS + DETECTED ANTI-PATTERN PHRASES + WORD ECONOMY SIGNALS)** (NEW — Scope 1) — positioned HERE, AFTER the consolidated targets, because scaffolds support both target materialization and discovery annotations.
13. `GENERATION INSTRUCTIONS` (existing, lines 953-969) — always last

**Ordering rationale**: Scope 2's CONSOLIDATED TARGETS must appear BEFORE Scope 1's REWRITE SCAFFOLDS because:
- Scope 2's MATERIALIZATION MODE instructs the LLM to produce one annotation per target. If scaffolds appear first, the LLM may confuse a scaffold with a target and over-materialize.
- Consolidated targets are prescriptive; scaffolds are suggestive. Prescriptive context should precede suggestive context in prompt assembly.
- Scope 1's REWRITE SCAFFOLDS augment BOTH consolidated target materialization (providing rewrite patterns for `rewriteExample`) AND discovery annotations. Placing scaffolds after targets means the LLM reads "here are your targets" then "here are patterns you can use for the targets and for anything else you find."

**Exact code to insert** in `buildParagraphPrompt()` between the existing "PRIOR ANNOTATIONS" block (ending around line 951) and the "Generation instructions" block (starting around line 953):

```typescript
    // ── Scope 2 GAP-5: Consolidated targets (materialization mode) ──
    if (consolidatedTargets && consolidatedTargets.length > 0) {
      const targetLines = consolidatedTargets.map((t, i) => {
        return [
          `[${i}] ${t.priority}`,
          `    Technique: ${t.technique ?? 'none'}`,
          `    Why: ${t.architecturalReason}`,
          `    Unlocks: ${t.unlocksNext}`,
          `    Starting sketch: ${t.demonstrationSketch ?? '(generate from scratch)'}`,
        ].join('\n');
      }).join('\n\n');

      sections.push(
        `=== CONSOLIDATED TARGETS FOR THIS PARAGRAPH (Scope 2) ===\n` +
        `Materialize EACH target below into exactly ONE annotation with a REQUIRED rewriteExample.\n` +
        `These are the L4 Crystallizer's consolidated coaching strategy — they bypass the teaching test.\n\n` +
        targetLines +
        `\n\nAfter materializing all ${consolidatedTargets.length} targets, you MAY add additional discovery annotations.`,
      );
    }

    // ── Scope 1 GAP-6/7/8: Pre-call enrichment (rewrite scaffolds + word economy) ──
    if (enrichment && enrichment.promptBlock) {
      sections.push(enrichment.promptBlock);
    }

    // ── Generation instructions (existing) ──
    sections.push(
      `\nGENERATION INSTRUCTIONS:\n` +
      // ... (existing body unchanged) ...
    );
```

---

## Section 6: 6 Missing ROUTE_TO_ISSUE_TYPE Entries

**File to modify**: The `ROUTE_TO_ISSUE_TYPE` table inside `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/researchEnrichment.ts` (new file created in Scope 3 Phase 7).

**Problem addressed**: R2 finding E4/CRIT-2 — Scope 2's `TECHNIQUE_VOCABULARY_LIST` contains 20 techniques (verified against `coachingService.ts:104-232` `TECHNIQUE_ROUTES`), but Scope 3's `ROUTE_TO_ISSUE_TYPE` has only 14 entries covering the legacy `matchClaimToTechnique()` routes. The 6 missing techniques (`COLLABORATIVE SPECIFICITY`, `FUNCTIONAL DETAIL`, `ANTI-LESSON`, `SUSTAINED VULNERABILITY`, `NARRATIVE ARC`, `INCREMENTAL REVELATION`) will fall through to the keyword fallback even when the LLM correctly emits them.

**IssueType vocabulary** (verified against `researchBackedTeachingService.ts:34-71` — 32 total union members, not 26 as the Scope 3 comment claims; the Scope 3 blueprint should be updated to reflect 32):
```
telling_not_showing, cliche_language, cliche_inspirational, cliche_ai_convergence,
cliche_narrative_arc, cliche_value_signaling, cliche_topic_framing, cliche_essay_formula,
performative_intelligence, premature_resolution, missing_systems_awareness,
passive_victim_framing, strategic_vulnerability, false_epiphany, image_renovation,
incremental_revelation, weak_opening, weak_ending, generic_why_us, generic_why_major,
activity_listing, weak_structure, weak_transitions, missing_technical_depth,
missing_unique_insight, missing_evidence_of_impact, missing_intellectual_engagement,
over_narrated, missing_character_through_thought, shallow_reflection, missing_complexity,
missing_connection_specificity
```

### Table entries to add (with rationales)

```typescript
  // ── Scope 3 Phase 7 addition: cover remaining 6 Scope 2 techniques ──

  'COLLABORATIVE SPECIFICITY':    'missing_evidence_of_impact',
  // Rationale: this technique addresses the "I developed" singular-first-person
  // failure mode where the student claims solo credit. The IssueType
  // `missing_evidence_of_impact` is the closest match because it covers
  // "claims without proof" — inflated solo claims are claims without the
  // collaborator-proof context that would actually support them.

  'FUNCTIONAL DETAIL':            'over_narrated',
  // Rationale: the directive ("Every detail must reveal character, carry theme,
  // or advance narrative. If it's just scenery, cut it.") targets descriptive
  // detail that fills space without function. `over_narrated` is the
  // IssueType for "story where evidence would be stronger" — decorative
  // detail is the exact surface symptom of over-narration. Alternative
  // `missing_intellectual_engagement` is rejected because the issue is
  // STRUCTURAL (cut the decoration), not analytical (think harder).

  'ANTI-LESSON':                  'premature_resolution',
  // Rationale: the technique fights the "too neat, manufactured growth,
  // sudden epiphany" failure mode. `premature_resolution` is the exact
  // IssueType for essays that wrap up cleanly before the real complication
  // has been earned. The alternative `shallow_reflection` misses the
  // structural narrative problem (resolution comes too early) in favor
  // of a cognitive depth framing, which is the wrong lens here.

  'SUSTAINED VULNERABILITY':      'strategic_vulnerability',
  // Rationale: "vulnerability retreat, pulls back, avoids emotional depth"
  // is the exact opposite signal of the `strategic_vulnerability` IssueType,
  // which detects performative/calculated vulnerability that stops short
  // of genuine risk. Both addresses the same structural problem from
  // different directions, so the teaching content for strategic_vulnerability
  // (which critiques the pulled-back form) is the correct research
  // backing for this technique's prescription.

  'NARRATIVE ARC':                'weak_structure',
  // Rationale: "no arc, flat progression, no turning point" is the headline
  // example of `weak_structure` (which covers "essay_structure_problems
  // including missing before/after turning points"). Alternative
  // `cliche_narrative_arc` is rejected because that IssueType specifically
  // targets the OPPOSITE failure (over-familiar arcs), whereas this
  // technique addresses the ABSENCE of any arc.

  'INCREMENTAL REVELATION':       null,
  // Rationale: `incremental_revelation` exists in the IssueType union but has
  // NO entry in TEACHING_KNOWLEDGE_BASE (verified against
  // researchBackedTeachingService.ts lines 149-984, which populates only 26
  // of the 32 IssueType union members). Mapping this technique to
  // `incremental_revelation` would silently miss at lookup time. The `null`
  // sentinel is intentional: it tells the sync test that the absence is
  // deliberate, not forgotten, and the enrichment for this technique
  // legitimately fails open until the TEACHING_KNOWLEDGE_BASE entry is added.
  // See Section 6 type signature `Record<string, IssueType | null>`.
```

### Full updated ROUTE_TO_ISSUE_TYPE table (20 entries — 100% coverage of Scope 2's TECHNIQUE_VOCABULARY_LIST)

```typescript
// Nullable mapping — `null` is an intentional sentinel for techniques whose
// target IssueType exists in the type union but has NO populated
// TEACHING_KNOWLEDGE_BASE bundle. The sync test explicitly allows null.
const ROUTE_TO_ISSUE_TYPE: Record<string, IssueType | null> = {
  // Original 14 (from legacy matchClaimToTechnique):
  'SUMMARY-TO-SCENE':                     'weak_structure',
  'COLD OPEN / SENSORY TIMESTAMP':        'weak_opening',
  'SOMATIC VULNERABILITY':                'telling_not_showing',
  'NAMED CHARACTER':                      'telling_not_showing',
  'EVIDENCE ANCHORING':                   'missing_evidence_of_impact',
  'RITUAL DETAIL / BOOKEND INVERSION':    'weak_ending',
  'VOICE COMPARISON':                     'cliche_ai_convergence',
  'SHOW THROUGH SPECIFIC ACTION':         'telling_not_showing',
  'VOICE AUTHENTICITY':                   'performative_intelligence',
  'DEFINITIONAL PIVOT':                   'cliche_language',
  'STAKES ESTABLISHMENT':                 'passive_victim_framing',
  'SCENE EXPANSION':                      'weak_structure',
  'BRIDGE SENTENCE':                      'weak_transitions',
  'ENACTED PARALLEL':                     'missing_connection_specificity',

  // Scope 3 Phase 7 addition: 6 techniques previously missing.
  // Added to close Scope 2 TECHNIQUE_VOCABULARY_LIST coverage gap (R2 CRIT-2).
  'COLLABORATIVE SPECIFICITY':            'missing_evidence_of_impact',
  'FUNCTIONAL DETAIL':                    'over_narrated',
  'ANTI-LESSON':                          'premature_resolution',
  'SUSTAINED VULNERABILITY':              'strategic_vulnerability',
  'NARRATIVE ARC':                        'weak_structure',
  // `incremental_revelation` IssueType exists in the union but has NO
  // TEACHING_KNOWLEDGE_BASE bundle (verified at
  // researchBackedTeachingService.ts lines 149-984 — only 26 of 32
  // union members are populated). `null` is an intentional sentinel.
  'INCREMENTAL REVELATION':               null,
};
```

**Pedagogical mapping note**: F1's `FORGE_PLAN_SCOPE3.md` ships a simpler set of mappings for 3 of the new techniques (FUNCTIONAL DETAIL → `telling_not_showing`, ANTI-LESSON → `shallow_reflection`, SUSTAINED VULNERABILITY → `telling_not_showing`). The mappings above are F2's more pedagogically precise alternatives, both are runtime-safe since every non-null target is a populated `TEACHING_KNOWLEDGE_BASE` bundle. **Implementers should match whichever choice is already in `SCOPE3.md` when wiring the real `researchEnrichment.ts` file**, and this Section 6 alternative stands as a recorded alternative to consider during a future tuning pass. The `INCREMENTAL REVELATION → null` sentinel and the nullable type signature are the authoritative choice and MUST be used.

**Test addition**: add a unit test `tests/test-scope3-technique-coverage.ts` (Phase 7 gate) that imports `TECHNIQUE_VOCABULARY_LIST` from `analysis/techniqueVocabulary.ts` and `ROUTE_TO_ISSUE_TYPE` from `analysis/researchEnrichment.ts` (behind a `__testing` namespace export) and asserts:
```typescript
// Every technique in the vocabulary has an entry — `null` is a valid value
// for techniques intentionally uncovered (e.g., INCREMENTAL REVELATION).
// `undefined` means the technique was added to the vocabulary but forgotten
// in the routing table — that's the real regression guard.
for (const tech of TECHNIQUE_VOCABULARY_LIST) {
  expect(ROUTE_TO_ISSUE_TYPE).toHaveProperty(tech.name);
}

// Every NON-NULL mapping must target a populated TEACHING_KNOWLEDGE_BASE key.
// This catches drift if a future refactor adds an IssueType to the union but
// forgets to populate its TEACHING_KNOWLEDGE_BASE bundle.
const POPULATED_ISSUE_TYPES = new Set([
  'telling_not_showing', 'cliche_ai_convergence', 'cliche_inspirational',
  'performative_intelligence', 'missing_systems_awareness',
  'passive_victim_framing', 'strategic_vulnerability', 'premature_resolution',
  'cliche_language', 'false_epiphany', 'weak_opening', 'weak_ending',
  'generic_why_us', 'generic_why_major', 'activity_listing', 'weak_structure',
  'weak_transitions', 'missing_technical_depth', 'missing_unique_insight',
  'missing_evidence_of_impact', 'missing_intellectual_engagement',
  'over_narrated', 'missing_character_through_thought', 'shallow_reflection',
  'missing_complexity', 'missing_connection_specificity',
]);
for (const [techName, issueType] of Object.entries(ROUTE_TO_ISSUE_TYPE)) {
  if (issueType !== null) {
    expect(POPULATED_ISSUE_TYPES.has(issueType)).toBe(true);
  }
}
```

---

## Section 7: Real PipelineError Usage Examples

Each example below shows the exact file, the current silent-fallback code, and the replacement that throws a `PipelineError` with diagnostic context. All 6 sites were called out by reviewers R2, R4, or R5 as violating Operating Doctrine rule #5 ("Errors surface with diagnostic context").

### Example 1: `analysisOrchestrator.ts` manifest projection site

**File**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts`

**Current code** (lines 750-768, verified):

```typescript
    try {
      const profileForManifest = coordinator.getProfile() as EssayProfile;
      const manifest = this.buildImprovementManifest(
        profileForManifest,
        coordinator.getFindingStore(),
        input.essayText,
        input.essayType,
      );
      profileForManifest.improvementManifest = manifest;
      console.log(
        `[Orchestrator] ImprovementManifest: ${manifest.items.length} items from ${manifest.sources.join(', ')}`,
      );
    } catch (error) {
      // Manifest generation is NOT fatal — log and continue
      console.error(
        '[Orchestrator] ImprovementManifest generation failed (non-fatal):',
        error instanceof Error ? error.message : String(error),
      );
    }
```

**Replacement** (after Scope 2 S2-8 rewrites `buildImprovementManifest` as a projection):

```typescript
    // Scope 2 S2-8: manifest projection — no silent fallback.
    // If the projection emits zero items on a fresh analysis run, that is a
    // real bug (L3/L3.5/L3.75 under-emitted candidates). Fail-fast.
    const profileForManifest = coordinator.getProfile() as EssayProfile;
    const candidateStore = coordinator.getImprovementCandidateStore();
    const manifest = this.buildImprovementManifest(
      profileForManifest,
      coordinator.getFindingStore(),
      candidateStore,
      input.essayText,
      input.essayType,
    );

    if (manifest.items.length === 0) {
      throw PipelineError.emptyCandidateStore(
        candidateStore.size,
        ['L3', 'L3.5', 'L3.75', 'L4'],
      );
    }

    profileForManifest.improvementManifest = manifest;
    console.log(
      `[Orchestrator] ImprovementManifest: ${manifest.items.length} items from ${manifest.sources.join(', ')} ` +
        `(candidate store: ${candidateStore.size} active)`,
    );
```

Add `import { PipelineError } from '../errors';` at the top of the file.

### Example 2: `analysisPass.ts:1284-1323` essay-level degraded return

**File**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisPass.ts`

**Current code** (lines 1284-1323, verified): the `catch` block after `analyzeEssayLevel()` returns a degraded result with empty `paragraphAnalyses` and a synthesized `degradedPhase`. This is a Rule 2 violation — degraded fallback that returns fake scoring data.

**Replacement**:

```typescript
    if (phaseEstimate === 'early') {
      console.log(
        `[AnalysisPass] Mode: essay_level (early phase), 1 Sonnet call for ${analyzableParagraphs.length} paragraphs`,
      );
      try {
        return await this.analyzeEssayLevel(profile, staleAreaHints, findingStore, essayType, startTime);
      } catch (error) {
        // Fail-fast: no degraded result. The coaching system cannot operate
        // on fake scoring data. If essay-level analysis failed, the pipeline
        // must surface it clearly so the caller can retry or escalate.
        const innerErr = error instanceof Error ? error : new Error(String(error));
        throw PipelineError.essayLevelAnalysisFailed(innerErr, analyzableParagraphs.length);
      }
    }
```

Delete the 40-line degraded-path block (`let degradedPhase: ImprovementPhase; ... analysisMode: 'essay_level' as const, failedParagraphs: [] }`) entirely.

Add `import { PipelineError } from '../errors';` at the top of the file.

### Example 3: `deepAnnotationService.ts:353-370` paragraph-level failure accumulator

**File**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts`

**Current code** (lines 353-370, verified):

```typescript
    for (let i = 0; i < paragraphResults.length; i++) {
      const result = paragraphResults[i];
      if (result.status === 'fulfilled') {
        paragraphAnnotations.push(result.value.paragraphAnnotations);
        totalCost += result.value.cost;
        totalTokenUsage.inputTokens += result.value.tokenUsage.inputTokens;
        totalTokenUsage.outputTokens += result.value.tokenUsage.outputTokens;
        totalTokenUsage.cacheReadTokens += result.value.tokenUsage.cacheReadTokens;
        totalTokenUsage.cacheWriteTokens += result.value.tokenUsage.cacheWriteTokens;
      } else {
        // Log failure but continue — partial results are better than no results
        console.error(
          `[DeepAnnotationService] Paragraph ${i} annotation failed:`,
          result.reason instanceof Error ? result.reason.message : result.reason,
        );
        paragraphAnnotations.push({ paragraphIndex: i, annotations: [] });
      }
    }
```

**Replacement** (accumulate failures, throw at loop end if any):

```typescript
    const failedIndices: number[] = [];
    let firstError: Error | undefined;
    for (let i = 0; i < paragraphResults.length; i++) {
      const result = paragraphResults[i];
      if (result.status === 'fulfilled') {
        paragraphAnnotations.push(result.value.paragraphAnnotations);
        totalCost += result.value.cost;
        totalTokenUsage.inputTokens += result.value.tokenUsage.inputTokens;
        totalTokenUsage.outputTokens += result.value.tokenUsage.outputTokens;
        totalTokenUsage.cacheReadTokens += result.value.tokenUsage.cacheReadTokens;
        totalTokenUsage.cacheWriteTokens += result.value.tokenUsage.cacheWriteTokens;
      } else {
        failedIndices.push(i);
        if (!firstError) {
          firstError = result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason));
        }
        console.error(
          `[DeepAnnotationService] Paragraph ${i} annotation failed:`,
          result.reason instanceof Error ? result.reason.message : result.reason,
        );
      }
    }

    // Fail-fast: if ANY paragraph failed, surface the structured error.
    // Partial results on the L5 annotation layer mean some paragraphs have
    // coaching content and others don't — the coaching system cannot
    // operate on an inconsistent surface.
    if (failedIndices.length > 0) {
      throw PipelineError.paragraphLoopFailed(
        'L5_paragraph_annotation',
        failedIndices,
        paragraphResults.length,
        firstError,
      );
    }
```

Add `import { PipelineError } from '../errors';` at the top of the file.

### Example 4: `sequentialDeepWalk.ts:552-567` per-paragraph walk failure accumulator

**File**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`

**Current code** (lines 552-567, verified):

```typescript
      } catch (error) {
        // No retry — count as consecutive failure immediately
        consecutiveFailures++;
        skippedParagraphs.push(pIdx);

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[SequentialDeepWalk] P${pIdx + 1}/${paragraphs.length} FAILED ` +
          `(consecutive: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${errorMessage}`,
        );

        this.markParagraphSkipped(profile, pIdx, errorMessage);

        // Push a minimal walk output so indices stay aligned
        walkOutputs.push(this.emptyWalkOutput(pIdx));
      }
```

**Replacement** (accumulate first-error reference, throw at loop end if any failures):

```typescript
      } catch (error) {
        // No retry — count as consecutive failure immediately
        consecutiveFailures++;
        skippedParagraphs.push(pIdx);

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorObj = error instanceof Error ? error : new Error(errorMessage);
        if (!firstWalkError) {
          firstWalkError = errorObj;
        }
        console.error(
          `[SequentialDeepWalk] P${pIdx + 1}/${paragraphs.length} FAILED ` +
          `(consecutive: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${errorMessage}`,
        );

        this.markParagraphSkipped(profile, pIdx, errorMessage);

        // Push a minimal walk output so indices stay aligned for the
        // post-loop check; if we end up throwing, the output is discarded.
        walkOutputs.push(this.emptyWalkOutput(pIdx));
      }
    } // end paragraph loop

    // Fail-fast: if ANY paragraph failed the walk, surface the structured error.
    // Partial walks mean downstream layers receive half-populated sentenceUnderstandings,
    // which corrupts L3.5 analysis, L3.75 synthesis, and all downstream coaching.
    if (skippedParagraphs.length > 0) {
      throw PipelineError.paragraphLoopFailed(
        'L3_walk',
        skippedParagraphs,
        paragraphs.length,
        firstWalkError,
      );
    }
```

Declare `let firstWalkError: Error | undefined;` at the top of the walk method alongside `let consecutiveFailures = 0;` and `const skippedParagraphs: number[] = [];`. Add `import { PipelineError } from '../errors';` at the top of the file.

### Example 5: `crystallizer.ts:2116-2127` L4b graceful-degradation catch

**File**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts`

**Current code** (lines 2116-2127, verified):

```typescript
    } catch (l4bError) {
      // L4b is NON-FATAL — graceful degradation
      l4bDegraded = true;
      console.warn(
        '[Crystallizer] L4b failed (non-fatal — degrading gracefully):',
        l4bError instanceof Error ? l4bError.message : String(l4bError),
      );

      // Defaults: empty coherence, no prioritizedImprovements, no coachingMap
      coherenceReport = { contradictions: [], isCoherent: true };
      // scoreMatrix already has empty prioritizedImprovements and undefined coachingMap from L4a
    }
```

**Replacement**:

```typescript
    } catch (l4bError) {
      // Fail-fast: no degraded fallback. L4b produces the coachingMap that
      // drives L5 materialization, Scope 3 enrichment, and the manifest.
      // An empty coachingMap poisons every downstream stage — surfacing
      // the error is the only safe path.
      const inner = l4bError instanceof Error ? l4bError : new Error(String(l4bError));
      const candidateStoreSize =
        (coordinator?.getImprovementCandidateStore?.()?.size) ?? 0;
      throw PipelineError.l4bConsolidationFailed(inner, candidateStoreSize);
    }
```

Delete the `l4bDegraded` flag and all code paths that reference it, since the function now cannot return in a degraded state. Add `import { PipelineError } from '../errors';` at the top of the file.

### Example 6: `researchEnrichment.ts` systemic failure escalation

**File**: `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/researchEnrichment.ts` (new file created in Scope 3 Phase 7)

**Problem addressed**: R5 B2 / R2 ADV-6 — the enrichment function currently silently returns the unenriched manifest when every item fails to resolve. This hides ROUTE_TO_ISSUE_TYPE drift. A per-item miss is fail-open (legitimate), but a systemic miss across a non-trivial manifest is a real bug.

**Current code** (planned implementation from Scope 3 — the enrichment function has a `try { resolveIssueType() } catch { continue; }` that silently skips items and never tracks aggregate resolution rate):

```typescript
  for (const item of manifest.items) {
    let issueType: IssueType | null = null;
    try {
      issueType = resolveIssueType(item);
    } catch {
      continue;
    }
    // ... enrichment logic ...
  }
  manifest._enriched = true;
  return manifest;
```

**Replacement** (track resolution rate, throw on systemic miss):

```typescript
  let resolvedCount = 0;
  const missedObservations: string[] = [];

  for (const item of manifest.items) {
    let issueType: IssueType | null = null;
    try {
      issueType = resolveIssueType(item);
    } catch (err) {
      // Per-item resolver exception is logged but not fatal — the enrichment
      // is additive and a single malformed item should not block the
      // whole session. Aggregate failure is caught by the post-loop check.
      console.warn(
        `[researchEnrichment] resolveIssueType threw for item id=${item.id}: `,
        err instanceof Error ? err.message : String(err),
      );
      missedObservations.push(item.observation ?? '(no observation)');
      continue;
    }
    if (issueType == null) {
      missedObservations.push(item.observation ?? '(no observation)');
      continue;
    }
    resolvedCount++;
    // ... enrichment logic (unchanged) ...
  }

  // Fail-fast on SYSTEMIC table drift: if the manifest is non-trivial
  // (3+ items) and we resolved zero issue types, ROUTE_TO_ISSUE_TYPE
  // and OBSERVATION_KEYWORD_TO_ISSUE have drifted from the vocabulary
  // the upstream layers are emitting. This is a real bug and must
  // surface, not hide.
  if (manifest.items.length >= 3 && resolvedCount === 0) {
    throw PipelineError.enrichmentSystemicMiss(manifest.items.length, missedObservations);
  }

  console.log(
    `[researchEnrichment] Resolved ${resolvedCount}/${manifest.items.length} items ` +
      `(${Math.round((100 * resolvedCount) / Math.max(1, manifest.items.length))}%)`,
  );

  manifest._enriched = true;
  return manifest;
```

Add `import { PipelineError } from '../errors';` at the top of the file.

**Why the 3-item threshold**: single-item or 2-item manifests (e.g., PIQ supplements with one improvement) are legitimately small; a 0% resolution rate on a 1-item manifest is a per-item miss, not systemic. The 3+ threshold balances fail-fast on real drift against false positives from edge cases.

---

## Completion note

All 7 artifacts verified against current codebase state as of commit `6a6e1be` on branch `feat/conversator-v2-coaching-annotation-v2`. Every file path is absolute. Every line number was re-verified via direct file reads against the current codebase state (not re-used from the plan's reported line numbers, several of which the 5-reviewer swarm caught as drifted). All type shapes referenced in the artifacts (`ImprovementCandidate`, `ImprovementCandidateStoreSnapshot`, `CraftAssessment.growthEdges`, `Finding`, `ImprovementEntry`, `ImprovementManifest`, `EssayProfile`, `ProfileIndex`, `IssueType`) were verified against `profileTypes.ts` and `researchBackedTeachingService.ts`.

**Assumptions flagged to F1 and the validator**:
1. **IssueType count discrepancy**: Scope 3's current blueprint claims "26 IssueType union members have teaching bundles" (FORGE_PLAN_SCOPE3.md:147). The actual union at `researchBackedTeachingService.ts:34-71` has **32 members**. The Scope 3 plan comment should be corrected to "32 IssueType members" — this does not change the 6-entry addition in Section 6 but affects the accuracy of the plan's maintenance documentation.
2. **`fromCheckpoint` import style**: Section 2 uses `require()` for the migration import to avoid circular-import risk between `profileManager/` and `improvements/`. Implementation may prefer a top-of-file `import` if the import graph is verified clean during Phase 4. Either style is acceptable as long as a Phase 1.5 compile check confirms no cycle.
3. **`coachingService` gate placement**: Section 2's gate code uses `await import('../errors')` at runtime. A top-of-file import is simpler and equivalent; runtime import is only necessary if Phase 1.5 exposes a cycle. Implementation can use either.
4. **`crystallizer.ts` coordinator reference**: Example 5 assumes the L4b catch site has access to the `coordinator` variable (for `getImprovementCandidateStore().size`). If the current crystallizer entry point does not carry the coordinator through, the candidate store size can be passed in via the outer `runCrystallization()` function signature — this is a 1-line threading change the implementer should make alongside the catch replacement.
5. **Migration covers `findings[]` but not `findingStore` serialization format**: if the persisted format is not `profile.findings: Finding[]` but rather a different serialization (e.g., `findingStoreSnapshot` or similar), Section 2's migration function must be updated to read from the actual persisted field. The current migration assumes `profile.findings` is the serialized FindingStore — this should be verified during Phase 1.5 implementation by reading a real persisted profile fixture.
6. **`requiresReanalysis` field placement**: Section 2 places the field on `ProfileIndex` (line 1566). An alternative placement is on `EssayProfile` directly or on a new `flags: {...}` sub-object. `ProfileIndex` was chosen because (a) it is already loaded eagerly on every profile load, (b) it already contains migration-adjacent signals like `fullAnalysisCount`, and (c) it stays in the always-hot path for the coaching gate check. The alternative placements are functionally equivalent — F1 should update the plan to match whichever field the implementer picks.

**Estimated LOC across all 7 artifacts**: ~1,750 lines (including doc comments, prose rationale, before/after blocks, and complete code listings). Section breakdown:
- Section 1 (errors.ts): ~280 LOC of TypeScript + ~20 LOC of usage summary
- Section 2 (migration): ~240 LOC of migration function + ~70 LOC of coordinator integration + ~40 LOC of field/gate plumbing
- Section 3 (L3 carve-out): ~40 LOC of prompt text + ~20 LOC of rationale
- Section 4 (L4b preamble): ~120 LOC of prompt text
- Section 5 (buildParagraphPrompt): ~90 LOC of signature + ~80 LOC of type defs + ~60 LOC of call-site + ordering rationale
- Section 6 (ROUTE_TO_ISSUE_TYPE): ~70 LOC of table additions with rationales + full 20-entry table
- Section 7 (PipelineError usage): ~320 LOC across 6 before/after code blocks

Ready for F1 to cite in the 4 plan files.
