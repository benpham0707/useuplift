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
 *
 * Reference: docs/specs/FORGE_PLAN_ARTIFACTS.md Section 1 (Doctrine Operationalization).
 */

/**
 * PipelineError — thrown by analysis pipeline layers (L3/L3.5/L3.75/L4/L5)
 * and the manifest projection step when an invariant is violated on a FRESH
 * analysis run.
 *
 * NOT used for missing-data on PERSISTED profiles — those paths use the
 * `requiresReanalysis` signal (see profileMigration.ts) instead of throwing.
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
   * path in profileMigration.ts and surface `requiresReanalysis: true` instead.
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
   * Thrown by the migration function in profileMigration.ts when an old
   * persisted profile has literally zero source data to convert. This surfaces
   * as "this profile truly needs re-analysis" — it is NOT a silent fallback.
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
 * Type guard for PipelineError. Preferred over `instanceof` checks because
 * it works reliably across module boundaries, transpilation targets, and
 * multiple copies of the errors module (e.g., in agent worktrees).
 *
 * Usage:
 *   catch (err) {
 *     if (isPipelineError(err)) {
 *       console.error(err.layer, err.toDiagnostic());
 *     }
 *   }
 */
export function isPipelineError(err: unknown): err is PipelineError {
  return err instanceof Error && err.name === 'PipelineError';
}

/**
 * Type guard for CoachingBlockedError.
 *
 * Usage:
 *   catch (err) {
 *     if (isCoachingBlockedError(err)) {
 *       // Return 409 to UI with err.reason
 *     }
 *   }
 */
export function isCoachingBlockedError(err: unknown): err is CoachingBlockedError {
  return err instanceof Error && err.name === 'CoachingBlockedError';
}

/**
 * CoachingBlockedError — thrown by `coachingService.processCoachingTurn()`
 * when the profile explicitly signals it cannot be coached against in its
 * current state. The only non-test caller is the `requiresReanalysis: true`
 * gate (see profileMigration.ts), which fires when an old persisted profile
 * was loaded and its migration either produced zero candidates or the caller
 * explicitly requested re-analysis before coaching.
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
   * Use when `profile.index.requiresReanalysis === true` at the top of
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
