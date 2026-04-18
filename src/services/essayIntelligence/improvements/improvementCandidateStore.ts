/**
 * improvementCandidateStore.ts — Append-only lifecycle-managed candidate store.
 *
 * Design: Mirrors `FindingStore` at `findings/findingStore.ts` exactly.
 * Candidates are never deleted — only lifecycle-transitioned:
 *   candidate → consolidated (L4 absorbed into a CoachingMap priority)
 *             → finalized (L5 materialized with rewriteExample)
 *           OR → superseded (dominated by a newer candidate during L4 review)
 *
 * getActive() excludes 'superseded'. serialize() snapshots the full store
 * onto `EssayProfile.improvementCandidateSnapshot` for checkpoint persistence.
 * Phase 1.5's profileMigration already constructs snapshots of this shape
 * from legacy persisted data.
 *
 * NO LLM CALLS. NO ANALYTICAL JUDGMENT. Pure CRUD + lifecycle bookkeeping.
 * The LLM assigns `coachingValue`, `technique`, and decides consolidation.
 * The store only validates referential integrity and lifecycle transitions.
 *
 * Scope 2 Phase 4. Reference: FORGE_PLAN_SCOPE2.md Item 1.
 */

import type {
  ImprovementCandidate,
  ImprovementCandidateStoreSnapshot,
} from '../profileTypes';
import { buildCandidateId } from './candidateIds';

export class ImprovementCandidateStore {
  private candidates: Map<string, ImprovementCandidate> = new Map();
  private nextId: number = 1;

  /**
   * Generate a deterministic candidate ID.
   *
   * Uses the same underlying `buildCandidateId()` helper that Phase 1.5's
   * `profileMigration.ts` uses — single source of truth for ID format.
   * IDs are stable across re-runs of the same essay + same observation
   * text, which gives the store idempotency for free.
   */
  static buildId(
    layer: 'L3' | 'L3.5' | 'L3.75',
    paragraph: number,
    sentence: number | null,
    discriminator: string,
  ): string {
    return buildCandidateId(layer, paragraph, sentence, discriminator);
  }

  /** Number of candidates (all lifecycle states). */
  get size(): number {
    return this.candidates.size;
  }

  /**
   * Add a new candidate to the store.
   *
   * Idempotent: if a candidate with the same ID already exists, the add is
   * skipped with a debug log (not a warning — collision is expected for
   * hash-based IDs during re-runs, and the harvest audit trail needs to
   * distinguish "LLM under-emitted" from "store rejected duplicate").
   *
   * X28/X33 correction from R2 audit: the previous wording said "silently
   * ignored" which tripped the fail-fast doctrine's rule 5. Now logs with
   * layer prefix + full context at debug level.
   */
  add(candidate: ImprovementCandidate): void {
    if (this.candidates.has(candidate.id)) {
      console.debug(
        `[ImprovementCandidateStore.add] idempotent skip — candidate id=${candidate.id} ` +
          `already in store (source=${candidate.sourceLayer}, paragraph=${candidate.paragraph})`,
      );
      return;
    }
    this.candidates.set(candidate.id, candidate);
  }

  /** Bulk-add helper. */
  addAll(candidates: ImprovementCandidate[]): void {
    for (const c of candidates) this.add(c);
  }

  /** Look up a candidate by ID. Returns undefined if not present. */
  get(id: string): ImprovementCandidate | undefined {
    return this.candidates.get(id);
  }

  /** All non-superseded candidates. Default read for downstream consumers. */
  getActive(): ImprovementCandidate[] {
    return Array.from(this.candidates.values()).filter(
      (c) => c.lifecycleState !== 'superseded',
    );
  }

  /** Active candidates from a specific source layer. */
  getBySource(layer: ImprovementCandidate['sourceLayer']): ImprovementCandidate[] {
    return this.getActive().filter((c) => c.sourceLayer === layer);
  }

  /** Active candidates scoped to a specific paragraph (includes essay-level). */
  getByScope(paragraph: number): ImprovementCandidate[] {
    return this.getActive().filter((c) => c.paragraph === paragraph);
  }

  /**
   * Active candidates sorted by coachingValue — 'critical' first,
   * 'diagnostic' last. Downstream improvement-queue surface typically
   * wants this order.
   */
  getActiveSortedByCoachingValue(): ImprovementCandidate[] {
    const ORDER: Record<ImprovementCandidate['coachingValue'], number> = {
      critical: 0,
      high: 1,
      medium: 2,
      contextual: 3,
      diagnostic: 4,
    };
    return this.getActive().sort(
      (a, b) => ORDER[a.coachingValue] - ORDER[b.coachingValue],
    );
  }

  /**
   * Port G2 (Focus Mode) — rank active candidates by ROI and mark all but the
   * top-N with `visible=false`. Does NOT remove candidates from the store
   * (Rule 2 — never discard paid LLM output). Idempotent: re-running with
   * the same input produces identical `visible` assignments.
   *
   * ROI = priorityScore × phaseAlignmentScore, where:
   *   - priorityScore: coachingValue → number
   *     { critical: 4, high: 3, medium: 2, contextual: 1.5, diagnostic: 1 }
   *   - phaseAlignmentScore: 1.0 when the candidate's implied phase matches
   *     `currentPhase`, else 0.6.
   *
   * Implied-phase heuristic (documented inline — simple, not load-bearing):
   *   foundation   ← coachingValue=critical OR technique ∈ {show_dont_tell, specificity, concrete_detail, narrative_clarity}
   *   architecture ← coachingValue=high OR technique ∈ {structural_role, through_line, fulcrum, earned_moment}
   *   craft        ← technique ∈ {anaphora, juxtaposition, sensory_detail, vocabulary_domain, rhythm, cadence}
   *   polish       ← coachingValue=medium without craft technique
   *   distinction  ← coachingValue=contextual or diagnostic
   *
   * `maxVisible` is clamped to a minimum of 2 — the research supports 2-3,
   * not 1 (Sommers 1982; Kluger & DeNisi 1996).
   *
   * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port G2.
   */
  rankAndApplyFocusMode(
    currentPhase: string | null,
    maxVisible: number = 3,
  ): void {
    const cap = Math.max(2, maxVisible);
    const active = this.getActive();
    const scored = active
      .map((c) => ({ c, roi: computeFocusRoi(c, currentPhase) }))
      .sort((a, b) => b.roi - a.roi);
    for (let i = 0; i < scored.length; i++) {
      scored[i].c.visible = i < cap;
    }
  }

  /**
   * Mark candidates as consolidated (L4 absorbed them into a CoachingMap
   * priority). Does NOT un-supersede already-superseded candidates — the
   * lifecycle transitions are strict forward moves.
   */
  markConsolidated(ids: string[]): void {
    for (const id of ids) {
      const c = this.candidates.get(id);
      if (!c) continue;
      if (c.lifecycleState === 'superseded') continue; // forward-only
      c.lifecycleState = 'consolidated';
    }
  }

  /**
   * Mark candidates as superseded (dominated by another candidate during
   * L4 review). Accepts an optional `supersededBy` ID for provenance.
   */
  markSuperseded(ids: string[], supersededBy: string | null = null): void {
    for (const id of ids) {
      const c = this.candidates.get(id);
      if (!c) continue;
      c.lifecycleState = 'superseded';
      c.supersededBy = supersededBy;
    }
  }

  /**
   * Mark candidates as finalized (L5 materialized rewriteExamples for them).
   * The candidate is still in the store — finalized just means "downstream
   * has consumed this candidate; no further lifecycle transitions expected."
   */
  markFinalized(ids: string[]): void {
    for (const id of ids) {
      const c = this.candidates.get(id);
      if (!c) continue;
      c.lifecycleState = 'finalized';
    }
  }

  /**
   * Build a prompt-ready context block of active candidates for L4 to
   * consume during consolidation. Returns a stub sentence when the store
   * is empty so the L4 prompt can branch cleanly instead of showing an
   * empty JSON array.
   *
   * Phase 5 (L4 Consolidator) reads this block and groups candidates into
   * CoachingMap priorities. Phase 6 (manifest projection) validates that
   * every consolidated candidate has been marked with `lifecycleState`.
   */
  toL4ContextBlock(): string {
    const active = this.getActive();
    if (active.length === 0) {
      return '(no pre-generated candidates — L4 should generate priorities directly from North Star + Score Matrix)';
    }
    return JSON.stringify(
      active.map((c) => ({
        id: c.id,
        sourceLayer: c.sourceLayer,
        paragraph: c.paragraph,
        sentence: c.sentence,
        observation: c.observation,
        suggestedChange: c.suggestedChange,
        technique: c.technique,
        demonstrationSketch: c.demonstrationSketch,
        coachingValue: c.coachingValue,
      })),
      null,
      2,
    );
  }

  /** Snapshot the store for persistence with the profile. */
  serialize(): ImprovementCandidateStoreSnapshot {
    return {
      candidates: Array.from(this.candidates.values()),
      nextId: this.nextId,
    };
  }

  /**
   * Restore a store from a persisted snapshot. Used by the
   * EssayProfileCoordinator constructor when loading a profile with an
   * existing `improvementCandidateSnapshot`, and by Phase 1.5's
   * profileMigration.ts which constructs snapshots directly from legacy
   * persisted data.
   */
  static deserialize(
    snapshot: ImprovementCandidateStoreSnapshot,
  ): ImprovementCandidateStore {
    const store = new ImprovementCandidateStore();
    for (const c of snapshot.candidates) {
      store.candidates.set(c.id, c);
    }
    store.nextId = snapshot.nextId;
    return store;
  }
}

// ============================================================================
// Port G2 — Focus Mode ROI helpers
// ============================================================================

const G2_PRIORITY_SCORE: Record<ImprovementCandidate['coachingValue'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  contextual: 1.5,
  diagnostic: 1,
};

const G2_FOUNDATION_TECHNIQUES = new Set([
  'show_dont_tell', 'specificity', 'concrete_detail', 'narrative_clarity',
]);
const G2_ARCHITECTURE_TECHNIQUES = new Set([
  'structural_role', 'through_line', 'fulcrum', 'earned_moment',
]);
const G2_CRAFT_TECHNIQUES = new Set([
  'anaphora', 'juxtaposition', 'sensory_detail', 'vocabulary_domain',
  'rhythm', 'cadence',
]);

function impliedPhaseFor(c: ImprovementCandidate): string {
  const tech = c.technique?.toLowerCase() ?? '';
  if (c.coachingValue === 'critical' || G2_FOUNDATION_TECHNIQUES.has(tech)) {
    return 'foundation';
  }
  if (c.coachingValue === 'high' || G2_ARCHITECTURE_TECHNIQUES.has(tech)) {
    return 'architecture';
  }
  if (G2_CRAFT_TECHNIQUES.has(tech)) {
    return 'craft';
  }
  if (c.coachingValue === 'medium') {
    return 'polish';
  }
  // contextual + diagnostic
  return 'distinction';
}

export function computeFocusRoi(
  c: ImprovementCandidate,
  currentPhase: string | null,
): number {
  const priority = G2_PRIORITY_SCORE[c.coachingValue] ?? 0;
  const alignment = currentPhase && impliedPhaseFor(c) === currentPhase ? 1.0 : 0.6;
  return priority * alignment;
}
