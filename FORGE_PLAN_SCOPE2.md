# Implementation Blueprint: Scope 2 — Cross-Layer Improvement Architecture

Every analysis layer (L3, L3.5, L3.75) emits structured `ImprovementCandidate` entries alongside its existing observations. Candidates accumulate inline in an `ImprovementCandidateStore` on the coordinator. L4 shifts from generator to consolidator (dedupe, prioritize, stamp architectural reasoning with full lineage). L5 shifts from generator to expander/materializer (receives consolidated targets, writes `rewriteExample` for each). `buildImprovementManifest()` shifts from 207-line retroactive scraper with keyword regex to a ~60-line projection of the consolidated candidate store. Zero new LLM calls; all improvement signal piggybacks on existing Sonnet passes. Net cost delta: **+$0.006/essay** (approximately 0.25% of current $2.41 pipeline cost).

---

## Core Types

All types land in `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts`. New types go after the existing `ImprovementManifest` at line 2428. Existing interfaces gain optional fields so backward compatibility is preserved (old persisted profiles load without migration).

```typescript
// ============================================================================
// IMPROVEMENT CANDIDATE — Pre-consolidation signal emitted inline by L3/L3.5/L3.75
// ============================================================================

/**
 * Lifecycle states for an improvement candidate.
 *
 * candidate    — freshly emitted by L3/L3.5/L3.75, not yet seen by L4
 * consolidated — absorbed into a CoachingMap priority by L4 (lineage preserved)
 * superseded   — L4 chose a different candidate for the same scope; dominated
 * finalized    — L5 wrote a rewriteExample; candidate is now a full ImprovementEntry
 *
 * Mirrors FindingMaturity — reuses the same append-only lifecycle pattern.
 */
export type ImprovementCandidateState =
  | 'candidate'
  | 'consolidated'
  | 'superseded'
  | 'finalized';

/**
 * ImprovementCandidate — a prescriptive signal from a single analysis layer.
 *
 * KEY DESIGN DISTINCTION vs Finding:
 *   Finding       = descriptive claim about the essay ("P1 opens in summary mode")
 *   Candidate     = prescriptive action the student could take ("replace summary with scene")
 *
 * Findings are what the analysis layer SEES.
 * Candidates are what the analysis layer RECOMMENDS.
 *
 * A single Finding can spawn zero or many candidates (a pattern observation may suggest
 * multiple fixes). A candidate may cite a finding via sourceFindingId, but candidates
 * also exist for observations too localized to be findings (e.g., one cliched sentence).
 *
 * ID scheme: CAND_{sourceLayer}_{locKey}_{shortHash}
 *   e.g., CAND_L3_P2S4_a3f7, CAND_L375_P0edge0_b12c, CAND_L35_P1S2_9e4a
 *
 * The LLM fills: observation, suggestedChange, technique, demonstrationSketch, coachingValue.
 * The orchestrator fills: id, sourceLayer, paragraph, sentence, lifecycleState, createdAt.
 */
export interface ImprovementCandidate {
  /** Unique ID, pattern: CAND_{layer}_{locKey}_{hash}. Orchestrator-assigned. */
  id: string;

  /** Which analysis layer emitted this candidate. Orchestrator-assigned. */
  sourceLayer: 'L3' | 'L3.5' | 'L3.75';

  /** Target paragraph (0-based); -1 for essay-level candidates */
  paragraph: number;

  /** Target sentence within paragraph; null for paragraph-level or essay-level candidates */
  sentence: number | null;

  /**
   * Optional link to a Finding that motivated this candidate.
   * When set, L5 and the manifest can pull evidence/scope/maturity from the finding.
   * null when the candidate is localized to a sentence too narrow to be a finding.
   */
  sourceFindingId: string | null;

  /**
   * What the analysis noticed — diagnostic prose. This is CLOSE to the observation
   * text the layer already produces; it is NOT a new creative writing task for the LLM.
   *
   * L3 source: derived from sentenceUnderstanding.primaryFunction + significantChoices
   * L3.5 source: derived from weakness observation prose
   * L3.75 source: the growth edge's quality + description
   */
  observation: string;

  /**
   * What to change — specific, actionable prose. This is the prescriptive complement
   * to observation. The L3.5 prompt already asks the LLM to write "what specificity
   * would look like" inside weakness observations — this field captures THAT content
   * in a structured slot instead of burying it in prose.
   */
  suggestedChange: string;

  /**
   * Named technique from TECHNIQUE_ROUTES vocabulary.
   * The LLM picks from a fixed list (injected into the prompt as vocabulary).
   * null is valid — not every suggestion maps to a named technique.
   * LLM-first: never forced, never regex-routed. Replaces matchClaimToTechnique().
   */
  technique: string | null;

  /**
   * Short prose sketch of what the improved version looks like (1-3 sentences).
   * Optional at L3/L3.75. L3.5 is encouraged to emit one for isProblem sentences.
   * L5 will expand this into a full rewriteExample (2-4 sentences).
   * null is valid — if the LLM cannot concretely sketch the improvement, it says so.
   */
  demonstrationSketch: string | null;

  /**
   * Coaching importance — LLM-assigned based on structural role and impact.
   * 'critical'   → would substantially change essay effectiveness
   * 'high'       → meaningful improvement visible to AO
   * 'medium'     → useful refinement
   * 'contextual' → depends on the student's intent
   * 'diagnostic' → signal for the coach, not directly actionable
   *
   * Reuses FindingCoachingValue taxonomy for consistent routing across systems.
   */
  coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic';

  /**
   * Lifecycle state. Starts as 'candidate'. Transitions:
   *   candidate → consolidated (L4 absorbed it into a priority)
   *   candidate → superseded   (L4 chose a different candidate for overlapping scope)
   *   consolidated → finalized (L5 wrote a rewriteExample for the priority)
   */
  lifecycleState: ImprovementCandidateState;

  /**
   * Supersession pointer — if this candidate was dominated by another, which one.
   * Used for lineage tracking and audit. null unless lifecycleState === 'superseded'.
   */
  supersededBy: string | null;

  /** ISO timestamp of emission. Orchestrator-assigned. */
  createdAt: string;
}

/**
 * ImprovementCandidateStoreSnapshot — serialized form for persistence/debugging.
 * Mirrors FindingStore's serialization pattern.
 */
export interface ImprovementCandidateStoreSnapshot {
  candidates: ImprovementCandidate[];
  nextId: number;
}
```

### Extensions to existing types

```typescript
// ============================================================================
// GAP-3: CraftAssessment gains pairedImprovement on each growth edge
// ============================================================================

// profileTypes.ts:854 — amended

export interface CraftAssessment {
  strengthSignatures: Array<{
    quality: string;
    evidence: string;
    paragraphs: number[];
  }>;
  growthEdges: Array<{
    quality: string;
    description: string;
    paragraphs: number[];
    /**
     * GAP-3: The LLM's architectural prescription for this growth edge.
     * Optional — when null, the edge is descriptive only (pattern observation
     * without a clear single fix). When present, it is the prescriptive
     * complement that today's prompt explicitly forbids ("Do NOT prescribe fixes").
     *
     * Extracted into an ImprovementCandidate by
     * analysisOrchestrator.extractL375Candidates() immediately after L3.75 applies.
     */
    pairedImprovement?: {
      /** Named technique from TECHNIQUE_ROUTES, or null */
      technique: string | null;
      /** One-sentence directive — the action the student should take */
      directive: string;
      /** WHY this matters architecturally (not just locally to the paragraph) */
      architecturalReason: string;
      /** 1-2 sentence sketch of the improved version, or null */
      demonstrationSketch: string | null;
      /** Expected impact if acted on */
      expectedImpact: 'transformative' | 'significant' | 'incremental';
    } | null;
  }>;
  imageSystem: string;
  sentencePatterns: string;
  wordPatterns: string;
}

// ============================================================================
// GAP-4: CoachingMap.priorities gain consolidation lineage + inherited detail
// ============================================================================

// profileTypes.ts:1934 — amended

export interface CoachingMap {
  transformativeInsight: {
    insight: string;
    evidenceLocations: Array<{ paragraph: number; sentence?: number }>;
    whyThisTransforms: string;
    requiresStudentAwareness: boolean;
  };
  priorities: Array<{
    priority: string;
    target: { paragraphs: number[]; description: string };
    architecturalReason: string;
    unlocksNext: string;
    expectedImpact: 'transformative' | 'significant' | 'incremental';
    /**
     * GAP-4: IDs of ImprovementCandidates this priority consolidated.
     * Empty array = L4 gap-filled (no upstream candidate matched); the priority
     * was generated from North Star + Score Matrix directly.
     * Non-empty = consolidated; used by coordinator.applyConsolidation() to mark
     * the referenced candidates as lifecycleState='consolidated'.
     */
    consolidatedFrom: string[];
    /**
     * GAP-4: Named technique (from TECHNIQUE_ROUTES) for this priority.
     * If the consolidated candidates agree on a technique, L4 inherits it.
     * If they disagree or had null, L4 picks one or leaves it null.
     * Replaces the current pattern where buildImprovementManifest() produces
     * ImprovementEntry.technique === null for every l4_priority source.
     */
    technique: string | null;
    /**
     * GAP-4: Best demonstration sketch from the consolidated candidates, or null.
     * L5 will expand this into a full rewriteExample. When L4 gap-fills a priority
     * with no upstream candidate, this is null (L5 will generate from scratch).
     */
    demonstrationSketch: string | null;
  }>;
  protectedStrengths: Array<{
    description: string;
    locations: Array<{ paragraph: number; sentence?: number }>;
    whyProtect: string;
  }>;
  // NOTE (Scope 1 coordination): emergentPatterns and scoreTensions are compressed
  // to string[] in Scope 1. Scope 2 does not reintroduce the object shape.
  emergentPatterns: string[];
  scoreTensions: string[];
}

// ============================================================================
// GAP-1: SentenceUnderstanding gains optional inline candidate
// ============================================================================

// profileTypes.ts:347 — amended

export interface SentenceUnderstanding {
  observedFunctions: ObservationEntry[];
  inferredIntents: ObservationEntry[];
  narrativeContributions: ObservationEntry[];
  rhetoricalFunctions: string[];
  paragraphContribution: string;
  craft: SentenceCraft;
  significantChoices: Array<{ word: string; significance: string }>;
  connectionRefs: string[];
  findingRefs: string[];
  tags: string[];
  primaryFunction?: string;
  significance?: 'pivotal' | 'contributing' | 'transitional';
  /**
   * GAP-1: Inline improvement candidate emitted by L3 walk.
   * null for the majority of sentences — the LLM decides which sentences
   * warrant a candidate. The L3 system prompt already instructs
   * "Each observation should map to a potential IMPROVEMENT" (line 244);
   * this field is the structured slot for that mapping.
   *
   * After parsing, the candidate is ALSO pushed into
   * coordinator.candidateStore. This field remains on the understanding
   * for referential traceability (coaching can see "the walk flagged this sentence").
   */
  improvementCandidate?: ImprovementCandidate | null;
}

// ============================================================================
// GAP-2: SentenceAnalysis gains optional inline candidate
// ============================================================================

// profileTypes.ts:418 — amended

export interface SentenceAnalysis {
  effectiveness: number;
  effectivenessReasoning: string; // KEPT — Scope 1 locked decision
  strengths: ObservationEntry[];
  weaknesses: ObservationEntry[];
  isStrength: boolean;
  isProblem: boolean;
  priorityForImprovement: number;
  confidence?: SentenceAnalysisConfidence;
  /**
   * GAP-2: Inline improvement candidate emitted by L3.5 analysis pass.
   * Strongly encouraged when isProblem === true OR priorityForImprovement >= 4.
   * null for clean sentences.
   *
   * The L3.5 prompt already demands fix prose inside weakness observations
   * ("Every weakness MUST explain what specificity would look like" — line 378).
   * This field captures the same content in a structured slot. No new reasoning
   * burden on the LLM — the content already has to exist.
   */
  improvementCandidate?: ImprovementCandidate | null;
}
```

### The technique vocabulary (shared constant)

Extracted to a new constant used by all three layer prompts (L3, L3.5, L3.75) and available to L4/L5. Single source of truth mirrors the existing `TECHNIQUE_ROUTES` table in `coachingService.ts:104-232` so technique names stay consistent.

```typescript
// src/services/essayIntelligence/analysis/techniqueVocabulary.ts — NEW FILE

/**
 * Technique vocabulary injected into L3/L3.5/L3.75 prompts.
 * The LLM picks from this list (or emits null) when filling
 * ImprovementCandidate.technique. Never regex-routed at the system level.
 *
 * Single source of truth: mirrors TECHNIQUE_ROUTES in coachingService.ts
 * to prevent drift. 20 techniques total.
 */
export const TECHNIQUE_VOCABULARY_LIST: readonly string[] = [
  'SUMMARY-TO-SCENE',
  'COLD OPEN / SENSORY TIMESTAMP',
  'SOMATIC VULNERABILITY',
  'NAMED CHARACTER',
  'EVIDENCE ANCHORING',
  'COLLABORATIVE SPECIFICITY',
  'RITUAL DETAIL / BOOKEND INVERSION',
  'VOICE COMPARISON',
  'FUNCTIONAL DETAIL',
  'ANTI-LESSON',
  'STAKES ESTABLISHMENT',
  'SCENE EXPANSION',
  'BRIDGE SENTENCE',
  'DEFINITIONAL PIVOT',
  'SUSTAINED VULNERABILITY',
  'NARRATIVE ARC',
  'ENACTED PARALLEL',
  'SHOW THROUGH SPECIFIC ACTION',
  'VOICE AUTHENTICITY',
  'INCREMENTAL REVELATION',
] as const;

export const TECHNIQUE_VOCABULARY_PROMPT_BLOCK = `
TECHNIQUE VOCABULARY (for improvementCandidate.technique field only; pick one or set to null):
${TECHNIQUE_VOCABULARY_LIST.join(' | ')}

Rules:
- Pick at most ONE technique per candidate.
- If no standard technique cleanly applies, use null — never force a match.
- The technique names are case-sensitive — emit the exact uppercase strings above.
`.trim();

export function isValidTechnique(name: string | null): boolean {
  if (name === null) return true;
  return TECHNIQUE_VOCABULARY_LIST.includes(name as typeof TECHNIQUE_VOCABULARY_LIST[number]);
}
```

---

## Items

### 1. `ImprovementCandidateStore` — new lifecycle-managed store on the coordinator

**Before**: No such store. `ImprovementEntry` exists only as a post-hoc scrape target inside `buildImprovementManifest()`.

**After**: Append-only store mirroring `FindingStore` at `src/services/essayIntelligence/findings/findingStore.ts`. Candidates accumulate across L3 → L3.75 → L3.5 → L4 → L5 with lifecycle state transitions. Serializable for persistence with the rest of the profile.

**Implementation**:

New file `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/improvements/improvementCandidateStore.ts` (~130 lines):

```typescript
/**
 * ImprovementCandidateStore — append-only lifecycle-managed store.
 *
 * Design: Mirrors FindingStore (findings/findingStore.ts) exactly.
 * Candidates are never deleted, only lifecycle-transitioned.
 * getActive() excludes 'superseded'. Serialize() snapshots the whole store
 * for persistence alongside the profile.
 *
 * NO LLM CALLS. NO ANALYTICAL JUDGMENT. Pure CRUD + lifecycle bookkeeping.
 * The LLM assigns coachingValue, technique, and decides consolidation.
 * The store only validates referential integrity and lifecycle transitions.
 */

import type {
  ImprovementCandidate,
  ImprovementCandidateState,
  ImprovementCandidateStoreSnapshot,
} from '../profileTypes';

export class ImprovementCandidateStore {
  private candidates: Map<string, ImprovementCandidate> = new Map();
  private nextId: number = 1;

  /** Generate a hash fragment for ID construction. */
  static generateHash(key: string): string {
    // Short deterministic hash — stable across runs for the same essay
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16).slice(0, 4).padStart(4, '0');
  }

  /** Build a canonical candidate ID. */
  static buildId(
    layer: 'L3' | 'L3.5' | 'L3.75',
    paragraph: number,
    sentence: number | null,
    discriminator: string,
  ): string {
    const layerTag = layer === 'L3.5' ? 'L35' : layer === 'L3.75' ? 'L375' : 'L3';
    const loc = sentence != null ? `P${paragraph}S${sentence}` : `P${paragraph}edge`;
    return `CAND_${layerTag}_${loc}_${ImprovementCandidateStore.generateHash(discriminator)}`;
  }

  get size(): number {
    return this.candidates.size;
  }

  /** Add a new candidate. Idempotent skip with debug log on duplicate ID. */
  add(candidate: ImprovementCandidate): void {
    if (this.candidates.has(candidate.id)) {
      // Idempotent skip with debug log (X28/X33 fix from R2 audit).
      // Candidate IDs are hash-based and CAN collide legitimately across re-runs,
      // so this is not an error — but we log at debug level so the harvest audit
      // trail can distinguish "LLM under-emitted" from "store rejected duplicate."
      console.debug(
        `[ImprovementCandidateStore.add] idempotent skip — candidate id=${candidate.id} already in store (source=${candidate.sourceLayer}, paragraph=${candidate.paragraph})`,
      );
      return;
    }
    this.candidates.set(candidate.id, candidate);
  }

  addAll(candidates: ImprovementCandidate[]): void {
    for (const c of candidates) this.add(c);
  }

  get(id: string): ImprovementCandidate | undefined {
    return this.candidates.get(id);
  }

  /** All non-superseded candidates. */
  getActive(): ImprovementCandidate[] {
    return Array.from(this.candidates.values())
      .filter(c => c.lifecycleState !== 'superseded');
  }

  /** Candidates from a specific source layer (active only). */
  getBySource(layer: ImprovementCandidate['sourceLayer']): ImprovementCandidate[] {
    return this.getActive().filter(c => c.sourceLayer === layer);
  }

  /** Candidates in a specific scope (paragraph index). */
  getByScope(paragraph: number): ImprovementCandidate[] {
    return this.getActive().filter(c => c.paragraph === paragraph);
  }

  /** Sorted by coachingValue ('critical' first, 'diagnostic' last). */
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

  /** Mark candidates as consolidated (absorbed into an L4 priority). */
  markConsolidated(ids: string[]): void {
    for (const id of ids) {
      const c = this.candidates.get(id);
      if (!c) continue;
      if (c.lifecycleState === 'superseded') continue; // Don't un-supersede
      c.lifecycleState = 'consolidated';
    }
  }

  /** Mark candidates as superseded (dominated by another). */
  markSuperseded(ids: string[], supersededBy: string | null = null): void {
    for (const id of ids) {
      const c = this.candidates.get(id);
      if (!c) continue;
      c.lifecycleState = 'superseded';
      c.supersededBy = supersededBy;
    }
  }

  /** Mark candidates as finalized (L5 wrote a rewriteExample). */
  markFinalized(ids: string[]): void {
    for (const id of ids) {
      const c = this.candidates.get(id);
      if (!c) continue;
      c.lifecycleState = 'finalized';
    }
  }

  /** Build a prompt-ready context block of active candidates for L4 consumption. */
  toL4ContextBlock(): string {
    const active = this.getActive();
    if (active.length === 0) {
      return '(no pre-generated candidates — L4 should generate priorities directly from North Star + Score Matrix)';
    }
    return JSON.stringify(
      active.map(c => ({
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

  serialize(): ImprovementCandidateStoreSnapshot {
    return {
      candidates: Array.from(this.candidates.values()),
      nextId: this.nextId,
    };
  }

  static deserialize(snapshot: ImprovementCandidateStoreSnapshot): ImprovementCandidateStore {
    const store = new ImprovementCandidateStore();
    for (const c of snapshot.candidates) store.candidates.set(c.id, c);
    store.nextId = snapshot.nextId;
    return store;
  }
}
```

Also update `src/services/essayIntelligence/improvements/index.ts` to export the new symbols (new file; parallel to `findings/index.ts`).

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/improvements/improvementCandidateStore.ts` — NEW FILE (~130 lines)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/improvements/index.ts` — NEW FILE (barrel export)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2428` — add `ImprovementCandidate`, `ImprovementCandidateState`, `ImprovementCandidateStoreSnapshot` types

**Cost**: Zero — pure infrastructure, no LLM calls.

**Source**: direct — Direct's store design is cleaner than Rethink's "reuse Finding for everything" which conflates descriptive and prescriptive signals.

---

### 2. `EssayProfileCoordinator` — add candidate store + 5 new methods

**Before**: Coordinator at `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts:907` manages `profile` + `findingStore` + mutators. No improvement candidate concept.

**After**: Coordinator also owns an `ImprovementCandidateStore`. Five new methods wire the pipeline: `addImprovementCandidates`, `getImprovementCandidates`, `getImprovementCandidateContextBlock`, `applyConsolidation`, `markImprovementsFinalized`. Each method parallels the existing `applyInsight`/`applyScoreMatrix` style — delegate to the store, call `afterMutation` if appropriate, emit a console log.

**Implementation**:

Add near line 916 of `essayProfileManager.ts` (after the `findingStore` field):

```typescript
// ── ImprovementCandidateStore (Scope 2) ──
private candidateStore: ImprovementCandidateStore;
```

In the constructor (near line 977):

```typescript
// Scope 2: Initialize ImprovementCandidateStore from persisted snapshot (or empty)
if (profile.improvementCandidateSnapshot) {
  this.candidateStore = ImprovementCandidateStore.deserialize(
    profile.improvementCandidateSnapshot,
  );
} else {
  this.candidateStore = new ImprovementCandidateStore();
}
```

New methods (insert near line 2140 alongside `getFindingStore()`):

```typescript
/**
 * Scope 2: Add improvement candidates harvested from a layer result.
 * Called by analysisOrchestrator immediately after L3, L3.5, or L3.75 applies.
 * Idempotent — duplicate IDs are passed through unchanged (with debug log, see add()).
 */
addImprovementCandidates(
  candidates: ImprovementCandidate[],
  options: { source: 'L3' | 'L3.5' | 'L3.75' },
): void {
  this.candidateStore.addAll(candidates);
  console.log(
    `[Coordinator] ${options.source}: added ${candidates.length} improvement candidates ` +
    `(total active: ${this.candidateStore.getActive().length})`,
  );
}

/** Scope 2: Expose the candidate store (read access for orchestrator). */
getImprovementCandidateStore(): ImprovementCandidateStore {
  return this.candidateStore;
}

/** Scope 2: Get active candidates sorted by coachingValue. */
getImprovementCandidates(): ImprovementCandidate[] {
  return this.candidateStore.getActiveSortedByCoachingValue();
}

/** Scope 2: Build the L4 prompt context block from active candidates. */
getImprovementCandidateContextBlock(): string {
  return this.candidateStore.toL4ContextBlock();
}

/**
 * Scope 2: Apply L4's consolidation decisions to the candidate store.
 * Called by orchestrator after L4 result is parsed.
 *
 * For each CoachingMap priority:
 *   - Candidates in priority.consolidatedFrom → lifecycleState='consolidated'
 *   - Candidates NOT referenced by any priority → lifecycleState='superseded'
 *     (L4 saw them and chose not to use them; they are dominated by other candidates
 *     or the priority list L4 generated)
 */
applyConsolidation(consolidatedIds: string[], supersededIds: string[]): void {
  this.candidateStore.markConsolidated(consolidatedIds);
  this.candidateStore.markSuperseded(supersededIds);
  console.log(
    `[Coordinator] Consolidation applied: ${consolidatedIds.length} consolidated, ` +
    `${supersededIds.length} superseded. Remaining active: ${this.candidateStore.getActive().length}`,
  );
}

/**
 * Scope 2: Mark candidates as finalized (L5 wrote rewriteExamples for them).
 * Called by orchestrator after L5 result is harvested into the manifest.
 */
markImprovementsFinalized(ids: string[]): void {
  this.candidateStore.markFinalized(ids);
}
```

The `EssayProfile` type also needs a `improvementCandidateSnapshot?: ImprovementCandidateStoreSnapshot` field so persistence works. This is a one-line addition to `profileTypes.ts` wherever `EssayProfile` is declared (search for `export interface EssayProfile`).

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts:916` — add `candidateStore` field
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts:977` — initialize in constructor
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts:2140` — add 5 new methods near `getFindingStore()`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts` — add `improvementCandidateSnapshot?` to `EssayProfile` (search for `export interface EssayProfile`)

**Cost**: Zero — pure infrastructure.

**Source**: direct — Rethink's "findings-as-improvements" collapse would eliminate this whole class, but it loses the prescriptive/descriptive distinction that makes candidates useful to L5 as expansion targets.

---

### 3. L3 Walk (`sequentialDeepWalk.ts`): add `improvementCandidate` field to per-sentence output

**Before**: The L3 walk system prompt at `sequentialDeepWalk.ts:155-409` emits per-sentence `primaryFunction`, `significance`, `tags`, `craft`, `significantChoices`. Line 244 already tells the LLM "Each observation should map to a potential IMPROVEMENT — if it doesn't suggest something the student could change, it's not useful" — but there is no structured field to capture that mapping, so the LLM's improvement thinking is lost.

**After**: Add an optional `improvementCandidate` field to the per-sentence JSON output schema. The LLM opts in sentence-by-sentence — null is the expected response for most sentences. The "UNDERSTANDING ONLY" ban on evaluative language stays in effect for `primaryFunction`/`significance`/`significantChoices`; the new field is the ONE place in L3 output where the LLM is invited to name a concrete improvement, scoped to a specific sentence where the understanding already revealed the opportunity.

**CRITICAL SAFEGUARD — L3 FORBIDDEN VOCABULARY CARVE-OUT**: The L3 system prompt (`sequentialDeepWalk.ts`) explicitly bans evaluative vocabulary ("effective", "weak", "strong", "stock", "unearned", etc.) across all output fields. This ban must NOT apply to `improvementCandidate.observation` and `improvementCandidate.suggestedChange` — these two fields are the ONE permitted evaluative surface in this layer. Without an explicit carve-out, Sonnet will treat the FORBIDDEN VOCABULARY as a hard cross-field constraint and produce weak/vague candidates like "this sentence could carry more" instead of "relies on stock metaphor". **This is the single highest-leverage safeguard in the entire plan.** Complete prompt text including the carve-out is embedded inline below and also rendered at `FORGE_PLAN_ARTIFACTS.md` section "L3 Carve-Out" for easy copy-paste into the real file.

**Implementation**:

**Prompt changes** — add to the output schema in `sequentialDeepWalk.ts` at line 318 (inside `sentenceUnderstandings` array item). Before:

```json
"sentenceUnderstandings": [
  {
    "index": 0,
    "primaryFunction": "One sentence: the single most important thing this sentence does...",
    "significance": "pivotal | contributing | transitional",
    "tags": [...],
    "connectionRefs": [],
    "craft": { ... },
    "significantChoices": [ ... ]
  }
]
```

After:

```json
"sentenceUnderstandings": [
  {
    "index": 0,
    "primaryFunction": "One sentence: the single most important thing this sentence does...",
    "significance": "pivotal | contributing | transitional",
    "tags": [...],
    "connectionRefs": [],
    "craft": { ... },
    "significantChoices": [ ... ],

    "improvementCandidate": null
    // OR — when the understanding genuinely reveals a specific improvement
    // opportunity for THIS sentence (not a general essay concern):
    "improvementCandidate": {
      "observation": "What the understanding reveals the sentence is trying but failing to do (diagnostic — may echo primaryFunction in evaluative terms)",
      "suggestedChange": "The specific, named change that would directly address what the understanding identified",
      "technique": "TECHNIQUE_NAME_FROM_VOCABULARY or null",
      "demonstrationSketch": "1-3 sentence sketch of the improved version, or null if you cannot concretely sketch it",
      "coachingValue": "critical | high | medium | contextual | diagnostic"
    }
  }
]
```

Add this prose section immediately after the existing output schema (around line 395, before "IMPORTANT" section):

```
=== IMPROVEMENT CANDIDATE EMISSION (the one prescriptive field in L3) ===

The rest of this layer is UNDERSTANDING ONLY (zero evaluative language).
The improvementCandidate field is the ONE exception: it captures concrete
improvement opportunities that the understanding revealed at this specific sentence.

EMIT a candidate ONLY when ALL of these are true:
1. Your understanding of THIS sentence revealed that it is attempting something
   it cannot fully accomplish with its current wording (e.g., claiming emotional
   weight it hasn't earned through specificity).
2. You can name a SPECIFIC, localized change — not "make it better" but
   "replace the abstract verb with a physical anchor."
3. The fix lives in THIS sentence, not across paragraphs. Cross-essay or
   structural fixes belong to L3.75, not here.

EMIT null for the majority of sentences. A candidate on every sentence means
you are not discriminating — re-read and remove the ones that don't meet the bar.
Target: 20-40% of sentences in a weak essay, 5-15% in a strong essay.

The observation field may use diagnostic language ("relies on stock metaphor")
even though the rest of the output is descriptive only. The suggestedChange
field should be prose the student could act on, not a prescription to the pipeline.

=== FORBIDDEN VOCABULARY CARVE-OUT (CRITICAL) ===
The FORBIDDEN VOCABULARY rule defined earlier in this prompt ("effective",
"weak", "strong", "compelling", "poor", "stock", "unearned", "fails to",
"succeeds in", etc.) explicitly does NOT apply to the
improvementCandidate.observation and improvementCandidate.suggestedChange
fields. These two fields are the ONE permitted evaluative surface in this layer.

Use banned words inside these two fields when your understanding reveals them.
Example observations you ARE permitted to write inside improvementCandidate:
- "Relies on stock metaphor 'fingers danced' without a physical anchor"
- "Claims emotional weight the earlier specifics haven't earned"
- "Opening is weak because the abstract noun 'passion' carries the whole load"

All other L3 output fields (primaryFunction, significance, significantChoices,
craft.*, tags, connectionRefs) remain UNDERSTANDING ONLY — no evaluative words.
This carve-out is surgical: it unlocks prescription exactly where Scope 2
needs it and nowhere else.

{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}

EXAMPLE — P1S1 of a piano essay:
Primary function (descriptive): "Opens the essay with an abstract aesthetic claim,
using stock metaphor to gesture at musical transformation"

Improvement candidate:
{
  "observation": "Opening leans on stock metaphor 'fingers danced' without a physical anchor",
  "suggestedChange": "Replace with the specific physical sensation of the keys — the weight, a particular practice room, one concrete detail",
  "technique": "COLD OPEN / SENSORY TIMESTAMP",
  "demonstrationSketch": null,
  "coachingValue": "high"
}
```

Where `{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}` is a template substitution performed at prompt build time — import `TECHNIQUE_VOCABULARY_PROMPT_BLOCK` from `./techniqueVocabulary` and inject it. Since the SYSTEM_PROMPT in sequentialDeepWalk.ts is a `const` template literal, convert it to a function `buildSystemPrompt()` that returns `const base = \`...\`; return base.replace('{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}', TECHNIQUE_VOCABULARY_PROMPT_BLOCK);`. Update `walkEssay()` at line 415 to call `buildSystemPrompt()` instead of referencing the `SYSTEM_PROMPT` constant directly.

**Parser changes** — `parseSentenceUnderstanding()` at `sequentialDeepWalk.ts:1076`:

```typescript
private parseSentenceUnderstanding(raw: unknown, paragraphIndex: number, sentenceIndex: number): SentenceUnderstanding {
  if (!raw || typeof raw !== 'object') {
    return this.emptySentenceUnderstanding();
  }
  const obj = raw as Record<string, unknown>;

  // ... existing parse logic for primaryFunction, significance, craft, etc ...

  const result: SentenceUnderstanding = {
    observedFunctions: bridgeObservations,
    inferredIntents: this.parseObservationEntries(obj.inferredIntents),
    narrativeContributions: this.parseObservationEntries(obj.narrativeContributions),
    rhetoricalFunctions: this.safeStringArray(obj.rhetoricalFunctions),
    paragraphContribution: primaryFunction ?? this.safeString(obj.paragraphContribution, ''),
    craft: this.parseSentenceCraft(obj.craft),
    significantChoices: this.parseSignificantChoices(obj.significantChoices),
    connectionRefs: this.safeStringArray(obj.connectionRefs),
    findingRefs: [],
    tags: this.safeStringArray(obj.tags),
  };

  if (primaryFunction) result.primaryFunction = primaryFunction;
  if (significance) result.significance = significance;

  // Scope 2 GAP-1: parse improvementCandidate if present
  const rawCand = obj.improvementCandidate;
  if (rawCand && typeof rawCand === 'object' && rawCand !== null) {
    const c = rawCand as Record<string, unknown>;
    const observation = typeof c.observation === 'string' ? c.observation : '';
    const suggestedChange = typeof c.suggestedChange === 'string' ? c.suggestedChange : '';
    // Only emit if the LLM provided substantive content
    if (observation.length > 0 && suggestedChange.length > 0) {
      const techniqueRaw = typeof c.technique === 'string' ? c.technique : null;
      const technique = isValidTechnique(techniqueRaw) ? techniqueRaw : null;
      const coachingValue = this.validateCoachingValue(c.coachingValue) ?? 'medium';
      result.improvementCandidate = {
        id: ImprovementCandidateStore.buildId('L3', paragraphIndex, sentenceIndex, observation),
        sourceLayer: 'L3',
        paragraph: paragraphIndex,
        sentence: sentenceIndex,
        sourceFindingId: null, // L3 doesn't have findings yet at per-sentence level
        observation,
        suggestedChange,
        technique,
        demonstrationSketch: typeof c.demonstrationSketch === 'string' && c.demonstrationSketch.length > 0
          ? c.demonstrationSketch
          : null,
        coachingValue,
        lifecycleState: 'candidate',
        supersededBy: null,
        createdAt: new Date().toISOString(),
      };
    }
  } else {
    result.improvementCandidate = null;
  }

  return result;
}

// Helper — validate the LLM-emitted coachingValue
private validateCoachingValue(raw: unknown): ImprovementCandidate['coachingValue'] | null {
  const valid = ['critical', 'high', 'medium', 'contextual', 'diagnostic'] as const;
  if (typeof raw !== 'string') return null;
  return valid.includes(raw as typeof valid[number])
    ? raw as ImprovementCandidate['coachingValue']
    : null;
}
```

`parseSentenceUnderstandings()` at line 1036 needs to pass `paragraphIndex` and the sentence index through:

```typescript
private parseSentenceUnderstandings(
  raw: unknown,
  sentences: string[],
  paragraphIndex: number, // NEW parameter
): UnderstandingWalkOutput['sentenceUnderstandings'] {
  // ... existing logic ...
  for (let i = 0; i < sentences.length; i++) {
    const llmData = llmByIndex.get(i);
    const source = llmData?.primaryFunction !== undefined ? llmData : llmData?.understanding;
    parsed.push({
      index: i,
      understanding: this.parseSentenceUnderstanding(source, paragraphIndex, i),
    });
  }
  return parsed;
}
```

`parseWalkOutput()` at line 922 calls `parseSentenceUnderstandings()` — already has `pIdx`, just pass it.

**Orchestrator harvest** — in `analysisOrchestrator.ts` after the existing walk application loop at line 429:

```typescript
// Apply each walk step to the coordinator
for (const walkOutput of l3Result.walkOutputs) {
  coordinator.applyUnderstandingWalkStep(walkOutput);
}

// Scope 2 GAP-1: Harvest L3 inline candidates into the candidate store
const l3Candidates: ImprovementCandidate[] = [];
for (const walkOutput of l3Result.walkOutputs) {
  for (const sw of walkOutput.sentenceUnderstandings) {
    if (sw.understanding.improvementCandidate) {
      l3Candidates.push(sw.understanding.improvementCandidate);
    }
  }
}
if (l3Candidates.length > 0) {
  coordinator.addImprovementCandidates(l3Candidates, { source: 'L3' });
}
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:155-409` — convert `SYSTEM_PROMPT` const to `buildSystemPrompt()` function, inject `TECHNIQUE_VOCABULARY_PROMPT_BLOCK`
- `sequentialDeepWalk.ts:318` — extend `sentenceUnderstandings[]` output schema with `improvementCandidate`
- `sequentialDeepWalk.ts:395` — insert the "IMPROVEMENT CANDIDATE EMISSION" prose section INCLUDING the explicit FORBIDDEN VOCABULARY carve-out for `improvementCandidate.observation` and `improvementCandidate.suggestedChange` (see `FORGE_PLAN_ARTIFACTS.md` section "L3 Carve-Out" for the verbatim carve-out text)
- `sequentialDeepWalk.ts:415` — call `buildSystemPrompt()` instead of `SYSTEM_PROMPT`
- `sequentialDeepWalk.ts:552-567` — **MODIFY** the per-paragraph L3 walk failure loop. Currently on parse/LLM error for paragraph N, the code calls `emptyWalkOutput(pIdx)` and pushes the empty shell into the aggregate `walkOutputs[]` as if that paragraph had been successfully walked. New behavior: accumulate failed indices into `failedWalkParagraphs: number[]`; at loop end, if any failed, throw `PipelineError { layer: 'L3-walk', failedWalkParagraphs, cause }` with full diagnostic context. Remove the `emptyWalkOutput(pIdx)` push — it is the L3 equivalent of the L5 "push-empty" anti-pattern fixed in Scope 1.
- `sequentialDeepWalk.ts:922` (`parseWalkOutput`) — thread `pIdx` to `parseSentenceUnderstandings`
- `sequentialDeepWalk.ts:1036` (`parseSentenceUnderstandings`) — accept paragraph index parameter
- `sequentialDeepWalk.ts:1076` (`parseSentenceUnderstanding`) — parse `improvementCandidate` field, build ID via `ImprovementCandidateStore.buildId`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts:429` — harvest L3 candidates into coordinator after applying walk outputs

**Cost**:
- **Input**: +~180 tokens per L3 call (cached system prompt addition for vocabulary + instruction). This is a cache HIT after P0 of the first essay — effectively free after the first paragraph. Non-cache hit cost: 180 × $3/M = $0.00054 one-time per essay.
- **Output**: +~400 tokens per essay (candidates on ~25% of sentences at ~60 tokens each — e.g., 7 paragraphs × 4 sentences × 0.25 × 60 ≈ 420 tokens). At Sonnet output pricing $15/M: **+$0.006/essay**.
- Total: **+$0.0065/essay** worst case.

**Source**: direct — the L3 prompt already tells the LLM "each observation should map to a potential IMPROVEMENT" (line 244). Adding the structured field captures what the LLM is already asked to think about, closest to the richest per-sentence context in the pipeline. Rethink's proposal to join L3 observations with L3.5 problem flags post-hoc loses the unique L3 advantage: L3 sees the understanding AS IT FORMS, with fresh cross-paragraph context from the walk.

---

### 4. L3.5 Analysis Pass (`analysisPass.ts`): add `improvementCandidate` field to per-sentence output

**Before**: `analysisPass.ts:377-379` in the system prompt says: "Every weakness MUST explain what specificity would look like: 'Instead of "it was difficult", show the specific difficulty — what did it feel like, what happened?'" The fix prose is embedded in `weaknesses[].observation` strings — nothing downstream extracts it. `buildImprovementManifest()` never reads `profile.paragraphs[i].sentences[j].analysis.weaknesses`.

**After**: Add `improvementCandidate` field to each sentence analysis item. L3.5 is explicitly instructed to extract the fix content it ALREADY has to write into weaknesses into a structured slot. Zero new reasoning burden — the content must exist either way.

**Implementation**:

**Prompt changes** — `analysisPass.ts:306` (`buildSystemPrompt`). Insert a new section after `## priorityForImprovement (0-5)` (around line 404) and before `## PRE-SCORING CALIBRATION`:

```
## IMPROVEMENT CANDIDATE (for problem sentences)

When isProblem=true OR priorityForImprovement >= 4, emit an improvementCandidate.
When isProblem=false AND priorityForImprovement <= 3, set improvementCandidate to null.

The purpose: you already write "what improvement would look like" inside your
weakness observations (see the weakness rule above). Pull that prescriptive content
into a structured slot so downstream systems can route it.

SCHEMA:
{
  "observation": "The diagnosis — you may reuse or lightly compress your weakness text",
  "suggestedChange": "The fix prose — pull this directly from the 'what specificity would look like' part of your weakness",
  "technique": "TECHNIQUE_NAME or null (from vocabulary below)",
  "demonstrationSketch": "1-3 sentence sketch of the improved version, or null if uncertain",
  "coachingValue": "critical | high | medium | contextual | diagnostic"
}

{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}

RULES:
- The suggestedChange MUST be action prose the student can enact. "More specific" is not a suggestedChange; "replace 'nervous' with the physical — hands, stomach, breathing, voice pitch" IS.
- demonstrationSketch is the hardest to get right. Leave it null if you cannot produce a structurally grounded sketch. A null sketch with a strong suggestedChange is better than a generic sketch.
- coachingValue: 'critical' only when structural importance AND low effectiveness coincide; 'high' for important sentences that would benefit substantially; 'medium' for improvements that are useful but not load-bearing.

EXAMPLE (for a sentence with effectiveness=38, isProblem=true, priorityForImprovement=5):
{
  "observation": "P1S1 opens with 'From the moment my fingers first danced across the piano keys' — stock metaphor for engagement that any applicant could write",
  "suggestedChange": "Replace the universal 'fingers danced' with a specific physical memory from this student's practice room — the weight of one key, a particular callus, a repeat at a specific measure",
  "technique": "COLD OPEN / SENSORY TIMESTAMP",
  "demonstrationSketch": "I pressed down on middle C until my knuckle turned white. Mrs. Chen had told me forty times: loosen your wrist. I couldn't.",
  "coachingValue": "critical"
}
```

Also extend the `## OUTPUT FORMAT` block at line 458. Add the field to each `sentenceAnalyses[]` item in the schema:

```json
"sentenceAnalyses": [
  {
    "sentenceIndex": 0,
    "effectivenessReasoning": "...",
    "effectiveness": 65,
    "strengths": [ ... ],
    "weaknesses": [ ... ],
    "isStrength": false,
    "isProblem": false,
    "priorityForImprovement": 2,
    "confidence": { ... },
    "improvementCandidate": null
  }
]
```

Add the substitution step in `buildSystemPrompt()`:

```typescript
function buildSystemPrompt(): string {
  const base = `You are an expert admissions essay analyst. ...
  // ... all the existing prose ...`;
  return base.replace(
    '{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}',
    TECHNIQUE_VOCABULARY_PROMPT_BLOCK,
  );
}
```

**Parser changes** — `analysisPass.ts:1059` (`validateAndTransform`):

```typescript
// Inside the for loop that iterates expectedSentenceCount (around line 1091):
sentenceAnalyses.push({
  sentenceIndex: i,
  effectiveness,
  effectivenessReasoning: String(rawSA.effectivenessReasoning || 'No reasoning provided'),
  strengths: extractObservations(rawSA.strengths),
  weaknesses: extractObservations(rawSA.weaknesses),
  isStrength: typeof rawSA.isStrength === 'boolean' ? rawSA.isStrength : effectiveness >= 76,
  isProblem: typeof rawSA.isProblem === 'boolean' ? rawSA.isProblem : effectiveness < 50,
  priorityForImprovement: clampPriority(Number(rawSA.priorityForImprovement) || 0),
  confidence,
  // Scope 2 GAP-2: parse improvementCandidate
  improvementCandidate: parseImprovementCandidate(rawSA.improvementCandidate, 'L3.5', paragraphIndex, i),
});
```

New helper function (inside `analysisPass.ts`):

```typescript
function parseImprovementCandidate(
  raw: unknown,
  sourceLayer: 'L3' | 'L3.5' | 'L3.75',
  paragraph: number,
  sentence: number | null,
): ImprovementCandidate | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const observation = typeof c.observation === 'string' ? c.observation : '';
  const suggestedChange = typeof c.suggestedChange === 'string' ? c.suggestedChange : '';
  if (observation.length === 0 || suggestedChange.length === 0) return null;

  const technique = typeof c.technique === 'string' && isValidTechnique(c.technique)
    ? c.technique
    : null;

  const validCV = ['critical', 'high', 'medium', 'contextual', 'diagnostic'] as const;
  const coachingValue = typeof c.coachingValue === 'string' && validCV.includes(c.coachingValue as typeof validCV[number])
    ? c.coachingValue as ImprovementCandidate['coachingValue']
    : 'medium';

  return {
    id: ImprovementCandidateStore.buildId(sourceLayer, paragraph, sentence, observation),
    sourceLayer,
    paragraph,
    sentence,
    sourceFindingId: null,
    observation,
    suggestedChange,
    technique,
    demonstrationSketch: typeof c.demonstrationSketch === 'string' && c.demonstrationSketch.length > 0
      ? c.demonstrationSketch
      : null,
    coachingValue,
    lifecycleState: 'candidate',
    supersededBy: null,
    createdAt: new Date().toISOString(),
  };
}
```

**Type extension** — the `AnalysisPassOutput.sentenceAnalyses[]` at `profileTypes.ts:2968` needs the new field:

```typescript
sentenceAnalyses: Array<{
  sentenceIndex: number;
  effectiveness: number;
  effectivenessReasoning: string;
  strengths: ObservationEntry[];
  weaknesses: ObservationEntry[];
  isStrength: boolean;
  isProblem: boolean;
  priorityForImprovement: number;
  confidence?: SentenceAnalysisConfidence;
  /** Scope 2 GAP-2: inline candidate (null when not a problem sentence) */
  improvementCandidate?: ImprovementCandidate | null;
}>;
```

**Mutator propagation** — `applyAnalysisPassResult` at `essayProfileManager.ts:1534` needs to copy the candidate onto the stored `SentenceAnalysis` and push into the store. Update the existing loop at line 1540:

```typescript
// SentenceMutator: store analysis for each sentence
for (const sa of result.sentenceAnalyses) {
  const mutations = this.sentenceMutator.applySentenceAnalysis(
    this.profile,
    result.paragraphIndex,
    sa.sentenceIndex,
    {
      effectiveness: sa.effectiveness,
      effectivenessReasoning: sa.effectivenessReasoning,
      strengths: sa.strengths,
      weaknesses: sa.weaknesses,
      isStrength: sa.isStrength,
      isProblem: sa.isProblem,
      priorityForImprovement: sa.priorityForImprovement,
      // Scope 2 GAP-2: propagate candidate onto SentenceAnalysis
      improvementCandidate: sa.improvementCandidate ?? null,
    },
  );
  allMutations.push(...mutations);

  // Scope 2 GAP-2: harvest into candidate store
  if (sa.improvementCandidate) {
    this.candidateStore.add(sa.improvementCandidate);
  }
}
```

The `SentenceMutator.applySentenceAnalysis()` at `profileManager/mutators/sentenceMutator.ts:151` already accepts a `Partial<SentenceAnalysis>` object — just ensure it passes through the new optional field to the stored `sentence.analysis`.

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisPass.ts:306` (`buildSystemPrompt`) — insert the "IMPROVEMENT CANDIDATE" prose section
- `analysisPass.ts:458` (OUTPUT FORMAT) — extend schema with `improvementCandidate` field
- `analysisPass.ts:1091` — parse `improvementCandidate` into the sentence analysis
- `analysisPass.ts:1284-1323` — **REMOVE** the essay-level degraded return path that returns `{ paragraphAnalyses: [], ..., failedParagraphs: [] }` with EMPTY `failedParagraphs` when parse/LLM errors occur. This silently evades the orchestrator's fail-fast gate because an empty `failedParagraphs` is indistinguishable from "no failures." Rethrow the underlying error as `PipelineError { layer: 'L3.5-essay', paragraphIndex: <failing paragraph>, failedParagraphs: <actual list of failed indices>, rawError: <original> }`. The outer orchestrator catch can then decide whether to build a partial result for non-L3.5 layers or surface the failure to the caller.
- `analysisPass.ts` — add `parseImprovementCandidate()` helper
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2968` — add `improvementCandidate?: ImprovementCandidate | null` to `sentenceAnalyses[]` item
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:418` — add `improvementCandidate?: ImprovementCandidate | null` to `SentenceAnalysis`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts:1540` — propagate candidate through mutator and harvest into store

**Cost**:
- **Input**: +~180 cached tokens (technique vocabulary + instruction) — effectively free after first call.
- **Output**: +~550 tokens per essay (~30% of sentences × ~60 tokens/candidate + ~175 tokens for demonstrationSketch on 50% of those = ~550). At $15/M: **+$0.008/essay**.
- Total: **+$0.008/essay**.

**Source**: direct — the L3.5 prompt ALREADY extracts fix prose inside weaknesses (line 378). We're moving that same content into a structured slot with zero new cognitive burden. Rethink's proposal (leave prose alone, let buildImprovementManifest pick it up via finding join) requires GAP-1's sentence-harvest loop to construct findings from raw weakness observations — losing the LLM's own routing of technique + coaching value.

---

### 5. L3.75 Holistic Synthesis (`holisticSynthesis.ts`): add `pairedImprovement` on each growth edge

**Before**: `holisticSynthesis.ts:629-632` system prompt says "craftAssessment.craftPatterns: Describe WHAT patterns exist (e.g., 'P2 and P4 use abstract nouns where P1 and P3 use concrete imagery'). Do NOT label them as weaknesses." The coercer at line 1435-1457 renames `craftPatterns` → `growthEdges`. No action, no technique, no architectural reasoning. `buildImprovementManifest()` then runs `matchClaimToTechnique()` keyword regex to retroactively attach a technique.

**After**: Each growth edge carries an optional `pairedImprovement` object with `{ technique, directive, architecturalReason, demonstrationSketch, expectedImpact }`. The L3.75 LLM has the holistic synthesis context — it uniquely sees the architectural purpose each edge serves. Prompt is updated to invite (not require) a pairedImprovement when the LLM can name a specific fix. The "Do NOT label them as weaknesses" language is REMOVED; that framing made sense when there was no prescriptive slot, but now the LLM has a place to put the prescription.

**Implementation**:

**Prompt changes** — `holisticSynthesis.ts:629-632`. Before:

```
- craftAssessment.craftSignatures: Describe WHAT techniques are present and WHERE (e.g., "Uses anaphora in P3S1-S3, sentence fragments in P5S2-S4, extended metaphor linking P1 and P4"). Do NOT evaluate how well they work.
- craftAssessment.craftPatterns: Describe WHAT patterns exist (e.g., "P2 and P4 use abstract nouns where P1 and P3 use concrete imagery"). Do NOT label them as weaknesses.
```

After:

```
- craftAssessment.craftSignatures: Describe WHAT techniques are present and WHERE (e.g., "Uses anaphora in P3S1-S3, sentence fragments in P5S2-S4, extended metaphor linking P1 and P4"). Do NOT evaluate how well they work.
- craftAssessment.growthEdges: Describe WHAT patterns exist AND optionally pair an architectural improvement.
  The description field stays descriptive — no evaluative language.
  The NEW pairedImprovement field is the ONE place in L3.75 output where you may emit a prescriptive action, BECAUSE you uniquely see the full essay's architecture.

  EMIT a pairedImprovement when you can name:
  1. A SPECIFIC technique that addresses the pattern (from the vocabulary below)
  2. A WHY grounded in the essay's architecture (not just "this would improve the paragraph")
  3. A DIRECTIVE the student can act on in one re-read pass

  EMIT null for pairedImprovement when:
  - The edge is a structural observation without a single clear fix
  - You cannot name a specific technique that applies
  - The fix requires student context you don't have

  GOOD pairedImprovement (for a growth edge "P2 and P4 use abstract nouns where P1 and P3 use concrete imagery"):
  {
    "technique": "SOMATIC VULNERABILITY",
    "directive": "Replace abstract nouns in P2 and P4 ('hope', 'perseverance') with the body memory that evidences each",
    "architecturalReason": "P1 and P3's concrete imagery established the essay's epistemology — value comes through sensory specificity. P2 and P4's abstract nouns break that contract and make the emotional arc feel asserted rather than earned",
    "demonstrationSketch": "Instead of 'I held onto hope', write 'I kept the flashcards in my pocket and read them under the bus seat'",
    "expectedImpact": "significant"
  }

  BAD pairedImprovement:
  {
    "technique": null,
    "directive": "Improve the craft",
    "architecturalReason": "It would be better",
    "demonstrationSketch": null,
    "expectedImpact": "incremental"
  }
  (too vague, no architectural specificity, no named technique)

{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}
```

Extend the output schema in the prompt at line 532 (inside `craftPatterns` — note the field is still named `craftPatterns` in the LLM-facing schema for backward compat, just like it is today; the coercer renames). Change:

```json
"craftPatterns": [
  {
    "quality": "<name of the craft pattern observed>",
    "description": "<describe WHAT the pattern is and WHERE it appears — do NOT evaluate it>",
    "paragraphs": [<paragraph indices>]
  }
]
```

to:

```json
"craftPatterns": [
  {
    "quality": "<name of the craft pattern observed>",
    "description": "<describe WHAT the pattern is and WHERE it appears>",
    "paragraphs": [<paragraph indices>],
    "pairedImprovement": null
    // OR — when you can name a specific architectural fix:
    "pairedImprovement": {
      "technique": "TECHNIQUE_NAME or null",
      "directive": "One-sentence action the student should take",
      "architecturalReason": "Why this matters to the essay's architecture specifically",
      "demonstrationSketch": "1-2 sentence sketch, or null",
      "expectedImpact": "transformative | significant | incremental"
    }
  }
]
```

**Coercer changes** — `holisticSynthesis.ts:1435` (`coerceCraftAssessment`):

```typescript
function coerceCraftAssessment(raw: Record<string, unknown>): CraftAssessment {
  const signaturesRaw = raw.craftSignatures ?? raw.strengthSignatures;
  const patternsRaw = raw.craftPatterns ?? raw.growthEdges;

  return {
    strengthSignatures: ensureArray(signaturesRaw).map((item: Record<string, unknown>) => ({
      quality: String(item.quality ?? ''),
      evidence: String(item.evidence ?? ''),
      paragraphs: ensureNumberArray(item.paragraphs),
    })),
    growthEdges: ensureArray(patternsRaw).map((item: Record<string, unknown>) => {
      const edge: CraftAssessment['growthEdges'][number] = {
        quality: String(item.quality ?? ''),
        description: String(item.description ?? ''),
        paragraphs: ensureNumberArray(item.paragraphs),
      };
      // Scope 2 GAP-3: parse pairedImprovement if present
      const rawPI = item.pairedImprovement;
      if (rawPI && typeof rawPI === 'object' && rawPI !== null) {
        const pi = rawPI as Record<string, unknown>;
        const directive = typeof pi.directive === 'string' ? pi.directive : '';
        const architecturalReason = typeof pi.architecturalReason === 'string' ? pi.architecturalReason : '';
        if (directive.length > 0 && architecturalReason.length > 0) {
          const techniqueRaw = typeof pi.technique === 'string' ? pi.technique : null;
          const technique = (techniqueRaw !== null && isValidTechnique(techniqueRaw)) ? techniqueRaw : null;
          const validImpact = ['transformative', 'significant', 'incremental'] as const;
          const expectedImpact = typeof pi.expectedImpact === 'string' && validImpact.includes(pi.expectedImpact as typeof validImpact[number])
            ? pi.expectedImpact as typeof validImpact[number]
            : 'incremental';
          edge.pairedImprovement = {
            technique,
            directive,
            architecturalReason,
            demonstrationSketch: typeof pi.demonstrationSketch === 'string' && pi.demonstrationSketch.length > 0
              ? pi.demonstrationSketch
              : null,
            expectedImpact,
          };
        } else {
          edge.pairedImprovement = null;
        }
      } else {
        edge.pairedImprovement = null;
      }
      return edge;
    }),
    imageSystem: String(raw.imageSystem ?? ''),
    sentencePatterns: String(raw.sentencePatterns ?? ''),
    wordPatterns: String(raw.wordPatterns ?? ''),
  };
}
```

Also fix the buildSystemPrompt variant — `holisticSynthesis.ts`'s system prompt is similarly a const that needs template substitution. If there are multiple system prompts (Phase A vs Phase B), find the one that contains line 532's `craftPatterns` schema and update IT specifically.

**Orchestrator harvest** — `analysisOrchestrator.ts` after the existing `coordinator.applyHolisticSynthesis(growthResult.finalSynthesis)` call at line 472:

```typescript
// Apply the final synthesis to the profile
coordinator.applyHolisticSynthesis(growthResult.finalSynthesis);
growthReadingStrategy = growthResult.readingStrategy;

// Scope 2 GAP-3: Harvest L3.75 growth edge candidates into the store
const l375Candidates = this.extractL375Candidates(
  growthResult.finalSynthesis,
);
if (l375Candidates.length > 0) {
  coordinator.addImprovementCandidates(l375Candidates, { source: 'L3.75' });
}
```

New private method on the orchestrator:

```typescript
private extractL375Candidates(
  synthesis: HolisticSynthesisOutput,
): ImprovementCandidate[] {
  const candidates: ImprovementCandidate[] = [];
  const growthEdges = synthesis.craftAssessment?.growthEdges ?? [];

  for (let i = 0; i < growthEdges.length; i++) {
    const edge = growthEdges[i];
    if (!edge.pairedImprovement) continue;
    const pi = edge.pairedImprovement;
    const primaryPara = edge.paragraphs[0] ?? -1;

    // Map expectedImpact → coachingValue
    const coachingValue: ImprovementCandidate['coachingValue'] =
      pi.expectedImpact === 'transformative' ? 'critical'
      : pi.expectedImpact === 'significant' ? 'high'
      : 'medium';

    candidates.push({
      id: ImprovementCandidateStore.buildId(
        'L3.75',
        primaryPara,
        null,
        `edge${i}-${edge.quality}`,
      ),
      sourceLayer: 'L3.75',
      paragraph: primaryPara,
      sentence: null,
      sourceFindingId: null,
      observation: `${edge.quality}: ${edge.description}`,
      suggestedChange: pi.directive,
      technique: pi.technique,
      demonstrationSketch: pi.demonstrationSketch,
      coachingValue,
      lifecycleState: 'candidate',
      supersededBy: null,
      createdAt: new Date().toISOString(),
    });
  }

  return candidates;
}
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/holisticSynthesis.ts:629-632` — replace "Do NOT label them as weaknesses" with pairedImprovement guidance
- `holisticSynthesis.ts:532` — extend `craftPatterns[]` output schema with `pairedImprovement`
- `holisticSynthesis.ts:1435` (`coerceCraftAssessment`) — parse `pairedImprovement` into each growth edge
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:862` — extend `growthEdges` type with optional `pairedImprovement`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts:472` — call `extractL375Candidates()` and `addImprovementCandidates()`

**Cost**:
- **Input**: +~180 cached tokens (shared vocabulary + instruction) — cache hit.
- **Output**: +~350 tokens per essay (4-6 growth edges × ~60 tokens for pairedImprovement). At $15/M: **+$0.005/essay**.
- Total: **+$0.005/essay**.

**Source**: hybrid — Direct's pairedImprovement field structure wins (keeps L3.75's prescriptive output close to its diagnostic). Rethink's "let L3.75 promote edges to findings" loses the distinction: a growth edge is a pattern observation, not yet an actionable improvement, and without the pairedImprovement structure the LLM still has nowhere to put the architectural reasoning that only L3.75 can see.

---

### 6. L4 Crystallizer (`crystallizer.ts`): L4b becomes consolidator

**Before**: `buildSystemPromptL4b()` at `crystallizer.ts:529` instructs the LLM to "produce" `prioritizedImprovements`, `coachingMap`, and `coherenceReport` from scratch. It receives the North Star + Score Matrix + profile context but does not see upstream improvement candidates. The resulting `coachingMap.priorities[]` entries have no technique, no demonstration, no lineage.

**After**: L4b receives the `ImprovementCandidateStore.toL4ContextBlock()` as a new user-turn input block. Its instructions shift from "produce priorities" to "consolidate these candidates into priorities." Each output priority carries `consolidatedFrom: string[]` lineage, `technique: string | null` (inherited from consolidated candidates or LLM-picked), and `demonstrationSketch: string | null` (best sketch from the candidates, or null if gap-fill). L4 gains a gap-fill escape hatch: if no upstream candidate covers a score-matrix-visible issue, L4 may generate a new priority directly, with empty `consolidatedFrom: []`.

**IMPLEMENTATION NOTE**: The merged L4b preamble — combining this Item 6's Consolidator framing with Scope 1 GAP-4's verbatim format instructions for `emergentPatterns: string[]` (max 3, ≤20 words, pattern+evidence format) and `scoreTensions: string[]` (max 3, ≤15 words, "P{n}: dim1(score) >> dim2(score) — hook" format) — is rendered in full at `FORGE_PLAN_ARTIFACTS.md` section "Merged L4b Preamble". Do NOT reconstruct the preamble from the prose below alone — Scope 1's ~60-word format spec must be embedded inside output 4 of the Consolidator preamble. The 6-word mention at line 1379 of this file is a coordination note, not a complete spec.

**Implementation**:

**Prompt changes** — `crystallizer.ts:529` (`buildSystemPromptL4b`). Replace the preamble starting at "You are the Interpreter" with:

```
You are the Consolidator. You receive a crystallized North Star, a Paragraph Score Matrix, AND a list of pre-generated improvement candidates from earlier analysis layers (L3 walk, L3.5 analysis pass, L3.75 holistic synthesis). Your job is NOT to re-derive coaching priorities from scratch. Your job is to CONSOLIDATE these candidates into a coherent coaching strategy, and produce a coherence report.

You are given:
1. The authoritative North Star (structural roles, distinctiveness, trajectory)
2. The scored Paragraph Score Matrix (5-dimensional per-paragraph scores)
3. Pre-generated ImprovementCandidate[] — each has observation, suggestedChange, technique, demonstrationSketch, coachingValue, sourceLayer, scope
```

And replace the description of output 1 (currently "PRIORITIZED IMPROVEMENTS"):

```
YOUR FOUR OUTPUTS:

1. PRIORITIZED IMPROVEMENTS (legacy flat list) — your first pass at the coaching strategy. Keep this as a short summary (3-5 items); the main coaching strategy lives in coachingMap.priorities.

2. COACHING MAP — the structured consolidation. This is the primary output.

   transformativeInsight: The single most important thing about this essay — the insight that, if the student understood it, would unlock the most improvement.

   priorities: ORDERED consolidation of the pre-generated candidates.
   Each priority has:
     - priority: what to do (one sentence)
     - target: { paragraphs: [...], description: "..." }
     - architecturalReason: WHY this matters to the essay's architecture — this is what ONLY you can add, because you have the North Star + Score Matrix
     - unlocksNext: what becomes possible AFTER this improvement
     - expectedImpact: "transformative" | "significant" | "incremental"
     - consolidatedFrom: Array of ImprovementCandidate IDs this priority absorbed. Each candidate can appear in AT MOST ONE priority. Candidates that address the same root issue should be consolidated into a single priority. Empty array means you are GAP-FILLING (see below).
     - technique: Named technique from the vocabulary. If the consolidated candidates agreed on a technique, inherit it. If they disagreed, pick the best one. If none cited a technique, you may assign one or leave null.
     - demonstrationSketch: The best demonstrationSketch from the consolidated candidates (or a lightly refined version). null if no candidate had one.

   CONSOLIDATION RULES:
   - Merge candidates that target the SAME ROOT ISSUE even if they used different words. Example: L3 "cliche opening" + L3.5 "stock phrasing erases specific moment" + L3.75 "abstract opening pattern" are ONE root issue — consolidate them into ONE priority.
   - Candidates targeting genuinely DIFFERENT issues in the same paragraph should become SEPARATE priorities. Paragraph overlap is not enough to merge.
   - If a candidate is clearly DOMINATED by a better one (same scope, weaker reasoning), leave it out — the system will mark it superseded.
   - Target 5-7 priorities for the final list. Quality over quantity.

   GAP-FILLING (escape hatch):
   - If the Score Matrix or North Star reveals a structural issue that NO candidate addresses, you MAY generate a new priority directly. Set consolidatedFrom: [] to mark it as gap-filled. Use this SPARINGLY — upstream layers had richer context than you do for per-paragraph issues.

   protectedStrengths: Things that MUST NOT be damaged during improvement. Include locations and WHY they must be protected.

3. COHERENCE REPORT — active investigation of contradictions across profile sections. (UNCHANGED from current behavior.)

4. emergentPatterns, scoreTensions: these are now string[] (per Scope 1). List the patterns and tensions as prose strings. Not object-structured.
```

Add the candidate context block to `buildCallInstructionL4b()` at `crystallizer.ts:823`:

```typescript
function buildCallInstructionL4b(
  l4aNorthStar: EssayNorthStar,
  l4aScoreMatrix: ParagraphScoreMatrix,
  paragraphCount: number,
  candidateContextBlock: string, // NEW parameter
): string {
  const l4aContext = JSON.stringify({
    northStar: l4aNorthStar,
    scoreMatrix: {
      paragraphs: l4aScoreMatrix.paragraphs,
      crossParagraphPatterns: l4aScoreMatrix.crossParagraphPatterns,
    },
  }, null, 2);

  const scoresSummary = l4aScoreMatrix.paragraphs.map((p) =>
    `  P${p.index}: effectiveness=${p.scores.effectiveness}, structural=${p.scores.structural}, ` +
    `voice=${p.scores.voice}, emotional=${p.scores.emotional}, thematic=${p.scores.thematic} | ` +
    `priority=${p.priorityForImprovement} | "${p.verdict}"`
  ).join('\n');

  return `=== L4a CRYSTALLIZATION OUTPUT (AUTHORITATIVE) ===
${l4aContext}

=== PER-PARAGRAPH SCORE SUMMARY ===
${scoresSummary}

=== PRE-GENERATED IMPROVEMENT CANDIDATES (Scope 2) ===
These candidates were emitted inline by L3 (walk), L3.5 (analysis pass), and L3.75 (holistic synthesis). Each represents a concrete improvement suggestion from the layer that saw the underlying evidence. Your job is to CONSOLIDATE these into coachingMap.priorities — not to regenerate from scratch.

${candidateContextBlock}

TASK: Using the structural roles, scores, AND candidates above, produce the four outputs.

1. prioritizedImprovements (short legacy list, 3-5 items)

2. coachingMap.priorities — Consolidate the candidates above. Each priority MUST include:
   - consolidatedFrom: list the candidate IDs you merged (empty [] ONLY when gap-filling)
   - technique: named technique or null (reuse from candidates when present)
   - demonstrationSketch: best sketch from consolidated candidates or null

3. coherenceReport — ACTIVELY investigate consistency across profile sections.
4. coachingMap.emergentPatterns & scoreTensions — string[] (NOT objects — per Scope 1)

REMINDERS:
- Score matrix has ${paragraphCount} paragraphs (indices 0 through ${paragraphCount - 1}).
- Every candidate ID should appear in exactly one priority's consolidatedFrom, OR be intentionally dropped (dominated). The system will mark non-referenced candidates as superseded.
- The architecturalReason field is YOUR unique contribution — it's WHY this priority matters to the essay's architecture, which only you can see with the North Star.`;
}
```

Update the output schema inside `buildSystemPromptL4b` at line 598:

```json
"coachingMap": {
  "transformativeInsight": { ... },
  "priorities": [
    {
      "priority": "...",
      "target": { "paragraphs": [0], "description": "..." },
      "architecturalReason": "...",
      "unlocksNext": "...",
      "expectedImpact": "transformative|significant|incremental",
      "consolidatedFrom": ["CAND_L3_P0S1_a3f7", "CAND_L35_P0S1_b2c8"],
      "technique": "COLD OPEN / SENSORY TIMESTAMP",
      "demonstrationSketch": "Specific memory from practice room..."
    }
  ],
  "protectedStrengths": [ ... ],
  "emergentPatterns": ["string", ...],
  "scoreTensions": ["string", ...]
}
```

**Parser changes** — update the raw parser for `coachingMap.priorities` (search for `buildCoachingMap` in `crystallizer.ts`):

```typescript
// Inside the priorities parser:
priorities: rawPriorities.map((rp: Record<string, unknown>) => ({
  priority: String(rp.priority ?? ''),
  target: { ... },
  architecturalReason: String(rp.architecturalReason ?? ''),
  unlocksNext: String(rp.unlocksNext ?? ''),
  expectedImpact: validImpact(rp.expectedImpact),
  // Scope 2 GAP-4: parse lineage + technique + sketch
  consolidatedFrom: Array.isArray(rp.consolidatedFrom)
    ? rp.consolidatedFrom.filter((id): id is string => typeof id === 'string')
    : [],
  technique: typeof rp.technique === 'string' && isValidTechnique(rp.technique)
    ? rp.technique
    : null,
  demonstrationSketch: typeof rp.demonstrationSketch === 'string' && rp.demonstrationSketch.length > 0
    ? rp.demonstrationSketch
    : null,
})),
```

**Crystallizer signature** — `crystallize()` at `crystallizer.ts:1912` gains a new optional parameter:

```typescript
async crystallize(
  profile: Readonly<EssayProfile>,
  essayType: EssayType,
  essayText: string,
  priorNorthStar?: EssayNorthStar,
  findingStore?: FindingStore,
  connectionGraph?: ConnectionGraph,
  candidateContextBlock?: string, // NEW — Scope 2
): Promise<L4CrystallizationResult> {
```

Inside the L4b phase at line 2049:

```typescript
const l4bCallInstruction = buildCallInstructionL4b(
  northStar,
  scoreMatrix,
  paragraphCount,
  candidateContextBlock ?? '(no pre-generated candidates)',
);
```

**Orchestrator wiring** — `analysisOrchestrator.ts:568`:

```typescript
l4Result = await crystallizerService.crystallize(
  profileForCrystal as EssayProfile,
  input.essayType,
  input.essayText,
  priorNorthStar,
  findingStoreForL4.size > 0 ? findingStoreForL4 : undefined,
  connectionGraphForL4.totalCount > 0 ? connectionGraphForL4 : undefined,
  coordinator.getImprovementCandidateContextBlock(), // Scope 2 GAP-4
);
```

**Post-L4 consolidation** — add after line 580 (after `applyCoherenceReport`):

```typescript
// Scope 2 GAP-4 + GAP-7: Apply consolidation decisions to the candidate store
const coachingMap = l4Result.scoreMatrix.coachingMap;
if (coachingMap?.priorities && coachingMap.priorities.length > 0) {
  const consolidatedIds: string[] = [];
  for (const p of coachingMap.priorities) {
    consolidatedIds.push(...(p.consolidatedFrom ?? []));
  }

  // Candidates not referenced by any priority are dominated — mark superseded
  const referencedSet = new Set(consolidatedIds);
  const allActiveBeforeL4 = coordinator.getImprovementCandidateStore().getActive();
  const supersededIds = allActiveBeforeL4
    .filter(c => !referencedSet.has(c.id))
    .map(c => c.id);

  coordinator.applyConsolidation(consolidatedIds, supersededIds);
}
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts:529` (`buildSystemPromptL4b`) — rewrite preamble as "Consolidator"; update schema
- `crystallizer.ts:823` (`buildCallInstructionL4b`) — add `candidateContextBlock` parameter and inject as new user-turn block
- `crystallizer.ts` — update coachingMap parser (`buildCoachingMap`) to parse `consolidatedFrom`, `technique`, `demonstrationSketch`
- `crystallizer.ts:1912` (`crystallize`) — add `candidateContextBlock` parameter
- `crystallizer.ts:2049` — thread parameter into `buildCallInstructionL4b`
- `crystallizer.ts:2116-2127` — **REMOVE** the L4b "graceful degradation" try/catch that sets a fallback `coherenceReport` and drops `coachingMap` on parse or LLM failure. L4b failure must throw `PipelineError { layer: 'L4b', candidateStoreSize: <N>, candidateIds: [...] }` with full diagnostic context. Silent fallback to a stub `coherenceReport` masks the exact situation Scope 2 is meant to surface (L4 unable to consolidate).
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:1934` (`CoachingMap`) — extend `priorities[]` item with the three new fields
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts:568` — pass candidate context block
- `analysisOrchestrator.ts:~580` — invoke `applyConsolidation()` with the resolved ID sets

**Cost**:
- **Input**: +~900 tokens per L4b call (candidate context block for ~15-20 candidates at ~50 tokens each, NOT cached because candidates are essay-specific). At $3/M: **+$0.0027/essay**.
- **Output**: -~800 tokens (L4b no longer derives priorities from scratch; consolidation lineage takes fewer tokens than freshly-written priorities). At $15/M: **-$0.012/essay**.
- Net: **-$0.009/essay** (savings from reduced regeneration).

**Source**: direct — Rethink's "L4 adds findingRef to existing priorities" is 80% of the way there but misses consolidation semantics: without `consolidatedFrom: string[]`, L4 can only point at ONE upstream finding per priority, losing the merging behavior that eliminates cross-layer duplicates. Direct's approach preserves the full lineage.

---

### 7. L5 Deep Annotation (`deepAnnotationService.ts`): narrow to materializer of consolidated targets

**Before**: L5's system prompt at `deepAnnotationService.ts:552-658` asks the LLM to (1) identify WHAT to annotate, (2) teach WHY, (3) demonstrate HOW (optional). Line 595: "A null rewrite with strong teachingRationale beats a generic rewrite" — gives the LLM permission to drop the demonstration. Result: 30-50% `rewriteExample` coverage per the audit.

**After**: L5 receives a per-paragraph list of consolidated improvement targets (from `coachingMap.priorities` where `target.paragraphs` includes this paragraph) AND a `ImprovementCandidate[]` list of candidates for the paragraph from the candidate store. The prompt changes from "generate annotations" to "materialize these targets + optionally discover additional teaching moments." For consolidated targets, `rewriteExample` becomes REQUIRED. The existing "optional discovery" mode is preserved as a second-class escape hatch — the LLM may add annotations not tied to a target, but those follow the current null-allowed rules.

**Implementation**:

**Signature change** — `generateAnnotations()` at `deepAnnotationService.ts:281`:

```typescript
async generateAnnotations(
  profile: Readonly<EssayProfile>,
  reanalysisBrief?: ReanalysisBrief,
  contradictionFlags?: string[],
  findingStore?: FindingStore,
  readingStrategy?: ReadingStrategy,
  priorAnnotations?: Map<number, PriorAnnotationContext>,
  // Scope 2 GAP-5: per-paragraph consolidated targets from L4
  consolidatedTargetsByParagraph?: Map<number, ConsolidatedTarget[]>,
  // Scope 2 GAP-5: per-paragraph unconsolidated candidates (for optional annotation)
  candidateStore?: ImprovementCandidateStore,
): Promise<L5AnnotationResult> {
```

New supporting type (in `deepAnnotationService.ts`):

```typescript
/**
 * Scope 2: A consolidated target passed from L4's CoachingMap to L5 per paragraph.
 * L5 is expected to materialize each target with a REQUIRED rewriteExample.
 */
export interface ConsolidatedTarget {
  priorityIndex: number; // index in coachingMap.priorities (for backlink)
  priority: string;
  architecturalReason: string;
  unlocksNext: string;
  technique: string | null;
  demonstrationSketch: string | null;
  consolidatedFromCandidateIds: string[]; // for finalization tracking
}
```

**Prompt changes** — extend `buildSystemPrompt()` at line 531 with a new section near line 594 (after REWRITE EXAMPLES section):

```
SCOPE 2 — MATERIALIZATION MODE:

You may receive a "CONSOLIDATED TARGETS" block in the paragraph-specific user turn.
These targets are the L4 Crystallizer's prioritized coaching strategy for the paragraph,
consolidated from candidates that earlier layers (L3 walk, L3.5 analysis, L3.75 synthesis)
emitted inline against specific evidence.

When CONSOLIDATED TARGETS are provided for the paragraph you are annotating:

1. For EACH target, produce exactly ONE annotation with:
   - teachingMode: "action" (these targets are prescriptive by construction)
   - content: 1-2 sentences that name the architectural consequence
   - teachingRationale: WHY this matters (can reuse target.architecturalReason)
   - northStarConnection: REQUIRED — reference the structural role
   - rewriteExample: REQUIRED, not null. Expand target.demonstrationSketch into a
     2-4 sentence structurally aware rewrite. If demonstrationSketch is null,
     generate one from scratch using the target.technique and the paragraph text.
   - consolidatedTargetIndex: index of the target in the list (for backlinking)
   - priority: inherit from target position (target 1 → priority 1)

2. After materializing ALL targets, you MAY add additional annotations in the
   current discovery mode — the usual AWARENESS / CONSEQUENCE / CONNECTION / ACTION
   rules apply, including the existing rewriteExample: null fallback.

3. The "teaching test" ("could the student see this by re-reading carefully?")
   applies to discovery annotations but NOT to consolidated target annotations.
   Consolidated targets are the curated strategy — they bypass the teaching test
   because their value comes from cross-layer consolidation, not local visibility.

If NO consolidated targets are provided, operate in the existing discovery mode
for the paragraph — nothing changes.
```

**Output schema extension** — L5Annotation gains a new optional field for backlinking:

```typescript
// deepAnnotationService.ts:117
export interface L5Annotation {
  // ... existing fields ...
  /**
   * Scope 2 GAP-5: If this annotation materialized a consolidated target from
   * coachingMap.priorities, the index of that priority (else undefined).
   * Used by the orchestrator to mark the source candidates as finalized.
   */
  consolidatedTargetIndex?: number;
}
```

Update the output schema in the prompt at line 630:

```json
"annotations": [
  {
    "paragraphIndex": 0,
    "sentenceIndex": 2,
    "spanText": "...",
    "type": "growth",
    "teachingIntent": "...",
    "teachingMode": "action",
    "content": "...",
    "teachingRationale": "...",
    "northStarConnection": "...",
    "priority": 1,
    "phase": "...",
    "rewriteExample": "REQUIRED for consolidated target annotations, optional for discovery",
    "confidence": 0.85,
    "crossParagraphRefs": [],
    "capacityBuildingNote": "...",
    "consolidatedTargetIndex": 0
  }
]
```

**Per-paragraph prompt build** — in `buildParagraphPrompt()` at `deepAnnotationService.ts:792`:

**IMPLEMENTATION NOTE**: The FINAL signature after both Scope 1 and Scope 2 land is a 9-parameter function combining Scope 1's `enrichment?: PreCallEnrichment` (GAP-6) with Scope 2's `consolidatedTargets?: ConsolidatedTarget[]`. Neither blueprint's code sample below shows the full 9-parameter shape. Both parameters land at position 8 in their respective scopes; when merged, Scope 1 becomes position 8 and Scope 2 becomes position 9. The **complete merged signature AND the merged user-turn block ordering** (existing context → Scope 2 CONSOLIDATED TARGETS → Scope 1 REWRITE SCAFFOLDS → existing GENERATION INSTRUCTIONS) is rendered verbatim at `FORGE_PLAN_ARTIFACTS.md` section "buildParagraphPrompt Merged Signature". Implementers should copy from ARTIFACTS, not from either individual blueprint.

```typescript
private buildParagraphPrompt(
  para: Readonly<ParagraphProfile>,
  profile: Readonly<EssayProfile>,
  northStar: EssayNorthStar,
  phase: ImprovementPhase,
  phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
  findingStore?: FindingStore,
  priorAnnotationCtx?: PriorAnnotationContext,
  consolidatedTargets?: ConsolidatedTarget[], // Scope 2 GAP-5 (position 8 in Scope 2 alone; position 9 after merge with Scope 1's `enrichment?` at position 8)
): string {
  const sections: string[] = [];

  // ... existing sections ...

  // Scope 2 GAP-5: Inject consolidated targets block
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
      `\n\nAfter materializing all ${consolidatedTargets.length} targets, you may add additional discovery annotations.`
    );
  }

  // ... rest of existing logic ...
  return sections.join('\n\n');
}
```

**Parser changes** — in the raw annotation parser (around `deepAnnotationService.ts:1510`):

```typescript
// Scope 2 GAP-5: parse consolidatedTargetIndex
const consolidatedTargetIndex = typeof raw.consolidatedTargetIndex === 'number'
  ? raw.consolidatedTargetIndex
  : undefined;

// When building the annotation:
{
  // ... existing fields ...
  rewriteExample: (raw.rewriteExample && typeof raw.rewriteExample === 'string')
    ? raw.rewriteExample.trim()
    : null,
  consolidatedTargetIndex,
}
```

**Orchestrator wiring** — in `analysisOrchestrator.ts:714`:

```typescript
// Scope 2 GAP-5: Build per-paragraph consolidated targets from coachingMap
const consolidatedTargetsByParagraph = this.buildConsolidatedTargetsByParagraph(
  l4Result.scoreMatrix.coachingMap,
  profile.paragraphs.length,
);

l5Result = await deepAnnotationService.generateAnnotations(
  profileForAnnotations as EssayProfile,
  input.reanalysisBrief,
  contradictionAnnotationFlags,
  findingStoreForL5.size > 0 ? findingStoreForL5 : undefined,
  growthReadingStrategy,
  undefined, // priorAnnotations
  consolidatedTargetsByParagraph, // Scope 2 GAP-5
  coordinator.getImprovementCandidateStore(), // Scope 2 GAP-5
);
```

New private helper on `AnalysisOrchestrator`:

```typescript
private buildConsolidatedTargetsByParagraph(
  coachingMap: CoachingMap | undefined,
  paragraphCount: number,
): Map<number, ConsolidatedTarget[]> {
  const map = new Map<number, ConsolidatedTarget[]>();
  if (!coachingMap?.priorities || coachingMap.priorities.length === 0) return map;

  for (let i = 0; i < coachingMap.priorities.length; i++) {
    const p = coachingMap.priorities[i];
    for (const pIdx of p.target.paragraphs) {
      if (pIdx < 0 || pIdx >= paragraphCount) continue;
      if (!map.has(pIdx)) map.set(pIdx, []);
      map.get(pIdx)!.push({
        priorityIndex: i,
        priority: p.priority,
        architecturalReason: p.architecturalReason,
        unlocksNext: p.unlocksNext,
        technique: p.technique,
        demonstrationSketch: p.demonstrationSketch,
        consolidatedFromCandidateIds: p.consolidatedFrom,
      });
    }
  }
  return map;
}
```

**Finalization** — after L5 completes, mark referenced candidates as finalized. Add after line 733 (after `safeCheckpoint('after_l5')`):

```typescript
// Scope 2 GAP-5: Mark consolidated candidates as finalized when L5 produced
// an annotation for them (via consolidatedTargetIndex backlink)
if (l5Result) {
  const finalizedIds: string[] = [];
  const allL5Annotations = [
    ...l5Result.paragraphAnnotations.flatMap(pa => pa.annotations),
    ...l5Result.essayLevelAnnotations,
    ...l5Result.crossParagraphAnnotations,
  ];
  for (const ann of allL5Annotations) {
    if (ann.consolidatedTargetIndex === undefined) continue;
    // Find the priority this annotation materialized (by paragraph + index)
    const priority = l4Result.scoreMatrix.coachingMap?.priorities[ann.consolidatedTargetIndex];
    if (priority && priority.consolidatedFrom.length > 0) {
      finalizedIds.push(...priority.consolidatedFrom);
    }
  }
  if (finalizedIds.length > 0) {
    coordinator.markImprovementsFinalized(finalizedIds);
  }
}
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:117` (`L5Annotation`) — add optional `consolidatedTargetIndex`
- `deepAnnotationService.ts:281` (`generateAnnotations`) — add two new parameters
- `deepAnnotationService.ts:531` (`buildSystemPrompt`) — insert "SCOPE 2 — MATERIALIZATION MODE" section
- `deepAnnotationService.ts:792` (`buildParagraphPrompt`) — inject consolidated targets block
- `deepAnnotationService.ts:~1510` (raw annotation parser) — parse `consolidatedTargetIndex`
- `deepAnnotationService.ts` — export `ConsolidatedTarget` type
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts:714` — build targets map, pass to `generateAnnotations`, finalize after
- `analysisOrchestrator.ts` — add `buildConsolidatedTargetsByParagraph()` helper

**Cost**:
- **Input**: +~400 tokens per L5 call (consolidated targets block for the paragraph). Parallel paragraph calls so tokens multiply by paragraph count. 7 paragraphs × 400 = 2800 tokens. Cached system prompt remains cached; only Block 3 grows. At $3/M: **+$0.008/essay**.
- **Output**: +~1000 tokens per essay (~5 consolidated targets × 200 tokens for mandatory rewriteExample). The existing L5 output drops slightly because the LLM no longer has to discover targets first. Net output: +~700 tokens. At $15/M: **+$0.011/essay**.
- Total: **+$0.019/essay**.

**Source**: hybrid — Direct's "L5 narrows to expander" structure + Rethink's framing "L5 is a materializer, not a discoverer." Rethink's `paraFindingIndex` approach is elegant but works against findings, not consolidated priorities — L4's architectural reasoning is lost if L5 sees raw findings instead of consolidated priorities with architecturalReason.

---

### 8. `buildImprovementManifest` — replaced with a projection function

**Before**: `buildImprovementManifest()` at `analysisOrchestrator.ts:1426` is a 207-line imperative function with 5 scraping sources, hardcoded paragraph dedup, keyword-regex technique routing (`matchClaimToTechnique` at line 1639-1664 with 14 entries duplicating `TECHNIQUE_ROUTES`), and every `demonstration` field hardcoded to null.

**After**: `buildImprovementManifest()` shrinks to ~110 lines. It consumes (a) `coachingMap.priorities[]` (already populated with technique + demonstrationSketch from the candidate pipeline), (b) the `L5AnnotationResult` for rewriteExample backfill, and (c) residual active candidates from the store that L4 didn't consolidate but that still carry coaching value. `matchClaimToTechnique()` is REMOVED entirely — technique selection is now always LLM-driven.

**Implementation**:

Replace lines 1414-1664 of `analysisOrchestrator.ts` with:

```typescript
/**
 * Build the improvement manifest from the consolidated coaching strategy.
 *
 * Post-Scope 2: this is a projection, not a scraper.
 *
 * Primary source: coachingMap.priorities (L4-consolidated, carries technique
 *   and demonstrationSketch from upstream candidates).
 * Secondary source: L5 annotations with rewriteExample (backfills demonstration).
 * Tertiary source: residual high-coachingValue candidates the store still
 *   has active (L4 didn't consolidate them but they're worth surfacing).
 *
 * AO red flags remain a special case — they are signal-processed from
 * aoFirstRead.gutReaction and cannot be represented as candidates (they live
 * outside the candidate pipeline).
 */
private buildImprovementManifest(
  profile: EssayProfile,
  findingStore: FindingStore,
  candidateStore: ImprovementCandidateStore,
  l5Result: L5AnnotationResult | null,
  _essayText: string,
  _essayType: EssayType,
): ImprovementManifest {
  const items: ImprovementEntry[] = [];
  const sources: string[] = [];
  let priority = 1;

  const WORD_LIMITS: Record<string, number> = {
    supplement: 250,
    piq: 350,
    personal_statement: 650,
  };
  const wordLimit = WORD_LIMITS[profile.northStar?.activeScale ?? ''] ?? 650;
  const wordCount = profile.paragraphs.reduce(
    (sum, p) => sum + p.text.split(/\s+/).length,
    0,
  );

  // Track which items correspond to which coachingMap.priorities index,
  // so Source 2 can backfill demonstrations via consolidatedTargetIndex.
  const itemToPriorityIndex = new Map<string, number>(); // IMP_id → priority index

  // ── Source 1: L4 Consolidated Priorities (primary) ──
  // Each priority already carries technique + demonstrationSketch from
  // the candidate pipeline. No keyword routing needed.
  const coachingMap = profile.scoreMatrix?.coachingMap;
  if (coachingMap?.priorities && coachingMap.priorities.length > 0) {
    sources.push('l4_consolidated_priorities');
    const priorityList = coachingMap.priorities.slice(0, 7);
    for (let pIdx = 0; pIdx < priorityList.length; pIdx++) {
      const p = priorityList[pIdx];
      const targetPara = p.target?.paragraphs?.[0] ?? -1;
      const impId = `IMP_${priority}`;
      items.push({
        id: impId,
        paragraph: targetPara,
        observation: p.architecturalReason,
        action: p.priority,
        stakes: p.unlocksNext,
        technique: p.technique, // NOW POPULATED — inherited from candidates
        demonstration: p.demonstrationSketch, // NOW POPULATED — will be upgraded by L5 backfill below
        wordEconomyCut: null,
        source: 'l4_priority',
        sourceRef: p.consolidatedFrom.length > 0
          ? p.consolidatedFrom.join(',')
          : null,
        priority: priority++,
        impact: p.expectedImpact,
        conversatorEnrichments: [],
      });
      itemToPriorityIndex.set(impId, pIdx);
    }
  }

  // ── Source 2: L5 Annotation Demonstration Backfill ──
  // L5 materialized each consolidated target with a REQUIRED rewriteExample.
  // Walk the items we just built and upgrade their demonstration field
  // from the L5 rewriteExample via the consolidatedTargetIndex backlink.
  if (l5Result && coachingMap?.priorities) {
    const allL5Anns = [
      ...l5Result.paragraphAnnotations.flatMap(pa => pa.annotations),
      ...l5Result.essayLevelAnnotations,
      ...l5Result.crossParagraphAnnotations,
    ];
    // Build a lookup: priorityIndex → L5 annotation with rewriteExample
    const annByPriorityIdx = new Map<number, L5Annotation>();
    for (const ann of allL5Anns) {
      if (ann.consolidatedTargetIndex === undefined) continue;
      if (!ann.rewriteExample) continue;
      // Keep the first annotation for each priority (highest priority value wins)
      if (!annByPriorityIdx.has(ann.consolidatedTargetIndex)) {
        annByPriorityIdx.set(ann.consolidatedTargetIndex, ann);
      }
    }
    // Backfill demonstration on each l4_priority item using the lookup
    for (const item of items) {
      if (item.source !== 'l4_priority') continue;
      const pIdx = itemToPriorityIndex.get(item.id);
      if (pIdx === undefined) continue;
      const materializingAnn = annByPriorityIdx.get(pIdx);
      if (materializingAnn?.rewriteExample) {
        item.demonstration = materializingAnn.rewriteExample;
      }
    }
    sources.push('l5_annotations_backfill');
  }

  // ── Source 3: Residual Active Candidates ──
  // Candidates that L4 chose not to consolidate but that still carry
  // high coaching value. Surface the top 3 as additional manifest items.
  const residualCandidates = candidateStore
    .getActiveSortedByCoachingValue()
    .filter(c => c.coachingValue === 'critical' || c.coachingValue === 'high')
    .slice(0, 3);
  if (residualCandidates.length > 0) {
    sources.push('residual_candidates');
    for (const c of residualCandidates) {
      if (items.length >= 10) break;
      // Soft dedup: skip if a priority already targets the same paragraph
      const alreadyCovered = items.some(i => i.paragraph === c.paragraph);
      if (alreadyCovered) continue;
      items.push({
        id: `IMP_${priority}`,
        paragraph: c.paragraph,
        observation: c.observation,
        action: c.suggestedChange,
        stakes: c.sourceLayer === 'L3.75'
          ? 'Architectural pattern from holistic synthesis'
          : 'Inline observation from walk',
        technique: c.technique,
        demonstration: c.demonstrationSketch,
        wordEconomyCut: null,
        source: c.sourceLayer === 'L3' ? 'l3_observation' : (c.sourceLayer === 'L3.5' ? 'l35_finding' : 'l375_growth_edge'),
        sourceRef: c.id,
        priority: priority++,
        impact: c.coachingValue === 'critical' ? 'transformative'
          : c.coachingValue === 'high' ? 'significant' : 'incremental',
        conversatorEnrichments: [],
      });
    }
  }

  // ── Source 4: AO First Read Red Flags (UNCHANGED — signal-processed special case) ──
  if (profile.aoFirstRead) {
    sources.push('ao_first_read');
    const ao = profile.aoFirstRead;

    // People absence
    if (ao.gutReaction?.includes('no named individuals') ||
        ao.gutReaction?.includes('people absence') ||
        ao.gutReaction?.toLowerCase().includes('no teacher') ||
        ao.gutReaction?.toLowerCase().includes('no mentor')) {
      if (items.length < 10) {
        items.push({
          id: `IMP_${priority}`,
          paragraph: -1,
          observation: 'No named individuals appear in the essay. Every experience is described in isolation.',
          action: 'Add ONE named person — teacher, teammate, mentor — with one physical detail. Show them in one sentence.',
          stakes: 'People absence is a red flag AOs catch in 30 seconds. It makes the essay feel like a philosophy paper, not a personal statement.',
          technique: 'NAMED CHARACTER',
          demonstration: null,
          wordEconomyCut: null,
          source: 'red_flag',
          sourceRef: null,
          priority: priority++,
          impact: 'significant',
          conversatorEnrichments: [],
        });
      }
    }

    // Put-down risk (UNCHANGED)
    if (ao.putDownRisk === 'high' && ao.committeeOneLiner && items.length < 10) {
      const alreadyHasHookItem = items.some(i =>
        i.observation.toLowerCase().includes('opening') ||
        i.observation.toLowerCase().includes('hook'));
      if (!alreadyHasHookItem) {
        items.push({
          id: `IMP_${priority}`,
          paragraph: 0,
          observation: `AO committee one-liner: "${ao.committeeOneLiner}". Put-down risk: HIGH.`,
          action: 'The opening must stop the AO from skimming in 3 sentences. Replace abstract opening with a physical moment.',
          stakes: `The AO will reduce this essay to "${ao.committeeOneLiner}" in committee. The opening must force them to stop and read.`,
          technique: 'COLD OPEN / SENSORY TIMESTAMP',
          demonstration: null,
          wordEconomyCut: null,
          source: 'ao_first_read',
          sourceRef: null,
          priority: priority++,
          impact: 'transformative',
          conversatorEnrichments: [],
        });
      }
    }
  }

  // ── Word Economy: Identify cuttable paragraphs (UNCHANGED) ──
  const structuralRoles = profile.northStar?.structuralRolesMap ?? [];
  for (const role of structuralRoles) {
    if (role.weight === 'supporting' || role.role.toLowerCase().includes('redundant')) {
      for (const item of items) {
        if (!item.wordEconomyCut && item.paragraph !== role.paragraphs[0]) {
          const cutParaIdx = role.paragraphs[0];
          const cutParaWords = profile.paragraphs[cutParaIdx]?.text.split(/\s+/).length ?? 0;
          item.wordEconomyCut = `Cut P${cutParaIdx + 1} (${cutParaWords} words — ${role.role}). Use the space for this improvement.`;
          break;
        }
      }
    }
  }

  return {
    items: items.slice(0, 10),
    generatedAt: new Date().toISOString(),
    sources,
    wordCount,
    wordLimit,
  };
}

// DELETED: matchClaimToTechnique() at lines 1639-1664 — technique is now LLM-emitted
// at every layer. The 14-entry keyword table duplicated TECHNIQUE_ROUTES in
// coachingService.ts and was the primary LLM-first design violation in Scope 2.
```

**Caller update** — `analysisOrchestrator.ts:752`:

```typescript
const profileForManifest = coordinator.getProfile() as EssayProfile;
const manifest = this.buildImprovementManifest(
  profileForManifest,
  coordinator.getFindingStore(),
  coordinator.getImprovementCandidateStore(), // Scope 2
  l5Result, // Scope 2 — for rewriteExample backfill
  input.essayText,
  input.essayType,
);
profileForManifest.improvementManifest = manifest;
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts:1414-1633` — replace `buildImprovementManifest()` implementation
- `analysisOrchestrator.ts:1639-1664` — **DELETE** `matchClaimToTechnique()` method entirely
- `analysisOrchestrator.ts:752` — update call signature with candidate store + l5Result
- `analysisOrchestrator.ts:750-768` — **REMOVE** the surrounding try/catch that logs "Manifest generation is NOT fatal — log and continue" and returns a degraded profile. The new projection MUST be allowed to throw `PipelineError`; the outer pipeline catch handles it correctly via `buildPartialResult`. This surrounding catch is THE most load-bearing fail-fast violation in the existing codebase — its removal is non-optional for Item 8. Without this removal the projection's `PipelineError` would be swallowed and the legacy scraper's failure mode silently reinstated.
- Fail-fast invariant: on `manifest.items.length === 0` from a fresh analysis run, throw `PipelineError { layer: 'manifest-projection', candidateStoreSize: candidateStore.getActive().length, candidateIds: [...] }`. Do not wrap this throw in any try/catch inside `buildImprovementManifest` or its caller.

**Cost**: Zero LLM cost (pure TypeScript). Net code delta: -~130 lines (207-line function becomes 110 lines; 25-line `matchClaimToTechnique()` deleted).

**Source**: hybrid — Direct's approach of replacing with projection logic + Rethink's insight that demonstration backfill via L5 annotations avoids duplication. The residual candidate source is a safety net: it prevents high-value candidates that L4 chose to drop (e.g., overlap dedup) from vanishing entirely from the student's view.

---

### 9. Scope 1 coordination — CoachingMap dead-field compression

**Before**: `emergentPatterns` and `scoreTensions` are dead object arrays per the audit (confirmed in diagnostic). Scope 1 compresses them to `string[]`.

**After**: Scope 2's type definition for `CoachingMap` (Item 1 Core Types) already uses `string[]` for these two fields. No additional work — this is a Scope 1/Scope 2 handoff point.

**Conflict risk**: LOW. Scope 1 removes the object shape; Scope 2 does not reintroduce it. The L4b prompt in Item 6 instructs the LLM to emit `string[]` for these two fields, consistent with Scope 1.

**Source**: refined — pure coordination, not a standalone change.

---

## Execution Order

Dependencies between items (enforced by code imports and data flow):

0. **Item 0** (`PipelineError` / `CoachingBlockedError` classes) — **MUST LAND BEFORE ITEM 8** (fail-fast prerequisite). New file `src/services/essayIntelligence/errors.ts`. Complete class definitions in `FORGE_PLAN_ARTIFACTS.md` section "PipelineError Class". Item 8's manifest projection throws `PipelineError { layer: 'manifest-projection', candidateStoreSize, candidateIds }` when the projection yields zero items on a fresh analysis. Item 10's coaching entry point throws `CoachingBlockedError` when `requiresReanalysis` is set.
1. **Item 1** (`ImprovementCandidateStore` + types) — **MUST LAND FIRST**. Items 2-8 all import from this.
2. **Item 2** (`EssayProfileCoordinator` extensions) — **SECOND**. Items 3-7 call coordinator methods added here.
3. **Item 3** (L3 walk candidate emission) — **THIRD**. Can be tested end-to-end in isolation once Items 1-2 land.
4. **Item 4** (L3.5 candidate emission) — **FOURTH**. Parallel with Item 5; no dependency on Item 3.
5. **Item 5** (L3.75 pairedImprovement) — **FIFTH**. Parallel with Item 4.
6. **Item 6** (L4 consolidator) — **SIXTH**. Depends on Items 3-5 populating the candidate store.
7. **Item 7** (L5 materializer) — **SEVENTH**. Depends on Item 6's consolidatedFrom lineage.
8. **Item 8** (manifest projection) — **EIGHTH**. Depends on Items 6 and 7.
9. **Item 9** (Scope 1 coordination) — coordinate with Scope 1 execution.
10. **Item 10** (Migration + requiresReanalysis plumbing) — **PREREQUISITE FOR ITEM 8 + CROSS-CUTS PHASE 6 → PHASE 7**. Adds the deterministic legacy-profile → candidate-store conversion and the signal plumbing that replaces the banned 30-day fallback.

   **Scope of Item 10**:
   - Add `requiresReanalysis?: boolean` to `EssayProfile` in `profileTypes.ts` (optional, defaults to undefined/false).
   - Implement `migrateLegacyProfileToCandidateStore(profile: EssayProfile): { candidates: ImprovementCandidate[]; requiresReanalysis: boolean }` — reads from `l35Findings`, `l375GrowthEdges`, and `coachingMap` and emits synthetic `ImprovementCandidate[]` with `sourceLayer` tagged per origin. Zero LLM calls. See `FORGE_PLAN_ARTIFACTS.md` section "Profile Migration" for the complete implementation.
   - Call `migrateLegacyProfileToCandidateStore()` from `EssayProfileCoordinator` load path when loading an old persisted profile detected by the absence of `improvementCandidateSnapshot` AND the presence of non-empty legacy data. Exact call-site location specified in `FORGE_PLAN_ARTIFACTS.md`.
   - When migration yields zero candidates (truly empty legacy profile), set `profile.requiresReanalysis = true`.
   - `coachingService.processCoachingTurn()` checks `profile.requiresReanalysis` at entry and throws `CoachingBlockedError({ reason: 'requiresReanalysis', action: 're-run full pipeline' })` if true.
   - UI/caller handles `CoachingBlockedError` by re-running analysis — NEVER by silently invoking the legacy scraper.
   - New unit test `tests/test-scope2-migration.ts` asserts: (a) migration produces candidates from fixture legacy profile, (b) fresh profile with no legacy data yields `requiresReanalysis = true`, (c) `CoachingBlockedError` is thrown from `processCoachingTurn()` when set.

**Landing strategy**: Item 0 + Item 10 land as a single PR before Item 8 (they jointly implement the fail-fast path Item 8 depends on).

**Landing strategy**: Items 1-2 can land in a single PR (pure infrastructure). Items 3-5 can land as three parallel feature branches (the inline fields are additive and backward-compatible — old profiles keep working). Items 6-7 land next in sequence. Item 8 lands last. Each landing is independently type-safe because all new fields are optional (`?`).

---

## Cost Summary

| Layer | Current Cost | Input Δ | Output Δ | Net Δ |
|-------|--------------|---------|----------|-------|
| L3 walk | ~$0.62 | +180 cached | +400 | **+$0.0065** |
| L3.5 analysis | ~$0.08 | +180 cached | +550 | **+$0.008** |
| L3.75 synthesis | ~$0.50 | +180 cached | +350 | **+$0.005** |
| L4b consolidator | ~$0.12 | +900 uncached | -800 | **-$0.009** |
| L5 annotations | ~$0.15 | +2800 uncached | +700 | **+$0.019** |
| Phase 7 manifest | ~$0 | 0 | 0 | $0 |
| **NET per essay** | $2.41 | +4240 | +1200 | **+$0.0295** |

Worst-case delta: **+$0.030/essay** (1.2% of current cost).

Most likely delta once caching stabilizes: **+$0.018/essay** (0.75% of current cost).

**Zero new LLM calls.** Every improvement emission piggybacks on an existing layer pass.

---

## Contract with Scope 3

Scope 3 integrates a research database to enrich improvements with transformation examples, college-specific guidance, and research-backed stakes. Scope 2 leaves the following fields as the enrichment surface for Scope 3:

### On `ImprovementCandidate`:

- `technique: string | null` — Scope 3 looks up matching `TransformationExample` entries by technique name (string key, not ID — decoupled from database migration)
- `demonstrationSketch: string | null` — Scope 3 MAY overwrite with a database-pulled example if a stronger match exists. Scope 2's sketches are OK-quality starting points; Scope 3's enrichment is deterministic lookup, not generation.
- `coachingValue` — Scope 3 reads this to route enrichment (critical candidates get more enrichment budget)

### On `ImprovementEntry` (the finalized manifest item):

- `demonstration: string | null` — Scope 2 populates from `demonstrationSketch` + L5 rewriteExample. Scope 3 may upgrade to a research-backed transformation example.
- `technique: string | null` — Scope 2 sets from the consolidated priority's technique. Scope 3 uses as the primary lookup key for enrichment.
- `stakes: string` — Scope 2 sets from `unlocksNext`. Scope 3 may append research-backed stakes (AO quotes, acceptance rate deltas).
- `conversatorEnrichments: string[]` — Already empty array on creation; Scope 3 populates directly (Scope 2 doesn't touch).

### New fields Scope 3 will add to `ImprovementEntry` (Scope 3's responsibility):

- `researchBacking?: { principle: string; whyItWorks: string; sourceRef: string; citationId?: string } | null` (single structured object, NOT an array — X29 cosmetic fix from R2 audit aligning this note with Scope 3's actual shape)
- `collegeNote?: string | null` (admissions-specific framing)
- ~~`transformationExampleId?: string | null`~~ — Scope 3 does NOT add this field (the principle/sourceRef chain in `researchBacking` covers the provenance need). Drop from this note; noted for future reference if a direct FK ever becomes useful.

Scope 2 does NOT define these — they are Scope 3's extension point. Scope 2's type shape is a STRICT SUBSET of what Scope 3 needs, so Scope 3 can add optional fields without breaking Scope 2.

---

## Conflicts / Coordination with Scope 1

### Locked Scope 1 decisions Scope 2 respects:

1. **`craft.rhythm` becomes enum tag** — Scope 2 does not modify `SentenceCraft`. No conflict.
2. **`craft.voiceAlignment` removed** — Scope 2 does not reference this field. No conflict.
3. **`effectivenessReasoning` KEPT** — Scope 2's `SentenceAnalysis` interface preserves this field. Explicitly verified.
4. **`emergentPatterns` / `scoreTensions` → `string[]` activated as coaching signals** — Scope 2's `CoachingMap` type definition uses `string[]` for both. L4b prompt in Item 6 instructs the LLM to emit strings, consistent with Scope 1.
5. **L5 pre-call infrastructure (`TRANSFORMATION_EXAMPLES`, `detectTellingPhrases()`, `TECHNIQUE_ROUTES` tagging)** — Scope 2's L5 materialization mode COEXISTS with Scope 1's L5 enrichments. The consolidated targets list comes AFTER Scope 1's pre-call enrichments in the paragraph user turn. No conflict.

### Potential coordination friction:

- **L5 `rewriteExample` requirement**: Scope 1 may also touch L5 prompt. Scope 2 makes `rewriteExample` REQUIRED for consolidated target annotations but preserves the "null allowed" rule for discovery annotations. Scope 1's pre-call enrichments should flow into the user turn as before, and the L5 prompt's MATERIALIZATION MODE section is additive. **Action**: when both scopes land, verify the L5 prompt still fits under its token budget (currently ~6000 tokens for the system prompt; we add ~400).

- **`TECHNIQUE_VOCABULARY_PROMPT_BLOCK`**: Scope 2's new constant mirrors the full 20-entry `TECHNIQUE_ROUTES` table. If Scope 1 adds or removes techniques from `TECHNIQUE_ROUTES`, Scope 2 must update its vocabulary list to stay in sync. **Mitigation**: define `TECHNIQUE_VOCABULARY_LIST` by importing the names directly from `TECHNIQUE_ROUTES` in `coachingService.ts` — single source of truth. Switch to:

  ```typescript
  // Alternative implementation avoiding the drift risk:
  import { TECHNIQUE_ROUTES } from '../coaching/coachingService';
  export const TECHNIQUE_VOCABULARY_LIST = TECHNIQUE_ROUTES.map(r => r.technique);
  ```

  This creates a runtime dependency from the analysis layer on the coaching layer, which is directionally reversed from the current architecture (analysis feeds coaching). **OPEN DECISION**: accept the reverse dependency for source-of-truth hygiene, or duplicate the list with a unit test asserting they match.

---

## Rejected Approaches

1. **Rethink's "collapse ImprovementEntry into Finding"**. Rejected because findings are DESCRIPTIVE claims about the essay ("the opening uses stock metaphor") while improvements are PRESCRIPTIVE actions ("replace with a physical anchor"). These are genuinely different concepts — one describes, one commands. Collapsing them loses the distinction that makes the candidate pipeline useful to L5 (which needs prescriptive targets to materialize). Findings remain findings; candidates are a new first-class concept.

2. **Rethink's "L3 stays silent; join weaknesses with understandings post-hoc"**. Rejected because L3 sees the richest per-sentence context in the pipeline (full understanding as it forms, fresh cross-paragraph connections from the walk). Post-hoc join is strictly less informed than inline emission. The L3 system prompt ALREADY tells the LLM "each observation should map to a potential IMPROVEMENT" (line 244) — the structured field captures what the LLM is already asked to think about.

3. **Direct's "L5 annotations become manifest entries"**. Rejected because it creates duplication: an L4 priority and an L5 annotation about the same paragraph would become two manifest entries for the same issue. Instead, Scope 2 uses L5 annotations to BACKFILL the `demonstration` field on existing manifest entries via the `consolidatedTargetIndex` backlink (Item 8 Source 2). This preserves L5's ephemeral contract (not stored in profile) while making `demonstration` finally non-null.

4. **"Add LLM-based semantic dedup at L4 as a dedicated pass"**. Rejected because it adds latency and L4 can do it inside its existing consolidation call. The `consolidatedFrom: string[]` lineage IS the dedup record — if L4 absorbs three candidates into one priority, the other two are dominated, and the coordinator marks them superseded in a single deterministic pass after L4 returns.

5. **"Move Phase 7 manifest build to between L4 and L5"** (Rethink's proposal for GAP-8). Rejected because it creates a chicken-and-egg problem: manifest items need demonstrations from L5, but L5 needs consolidated targets from L4 via the manifest... leading to a circular dependency. Scope 2 breaks the cycle by passing the L4 `coachingMap.priorities` DIRECTLY to L5 (not through the manifest), then L5 annotations backfill the manifest AFTER both complete. Phase 7 stays at the end.

6. **"Add a demonstration field to ImprovementCandidate distinct from demonstrationSketch"**. Rejected — one field is enough. The sketch is 1-3 sentences (L3/L3.5/L3.75 scope); L5's rewriteExample is 2-4 sentences (expanded). The lifecycle is: sketch emitted at candidate layer → priority inherits it via L4 → L5 materializes it as rewriteExample → manifest.demonstration is set from the L5 value via backfill. No parallel field needed.

### OPEN DECISIONS

- **TECHNIQUE_VOCABULARY_LIST source of truth**: Import from `coachingService.TECHNIQUE_ROUTES` (reverse dependency) vs. duplicate with unit test assertion. Recommendation: duplicate with assertion — easier to reason about layer boundaries, explicit intent to keep them in sync. The unit test should be in `tests/test-scope2-technique-vocab-sync.ts` and compare length + names.

- **L4 candidate context block cache behavior**: The candidate context block is essay-specific so it does NOT participate in the cached system prompt. If candidate volume grows large (>25 candidates), the L4b input cost balloons. Recommendation: cap the context block at the top 20 active candidates by `coachingValue` before serialization. If this cap is hit frequently in testing, we should reconsider whether upstream layers are emitting too aggressively.

- **Backward compatibility**: Existing persisted profiles do not have `improvementCandidateSnapshot`. The coordinator initializer handles this gracefully (empty store). The manifest projection in Item 8 reads from `candidateStore.getActive()` — which is empty for old profiles. **Action: fail-fast. No dead-code fallback.** Old persisted profiles without `improvementCandidateSnapshot` are migrated via `migrateLegacyProfileToCandidateStore()` — a deterministic one-shot conversion from existing `l35Findings`, `l375GrowthEdges`, and `coachingMap` into the new candidate store shape (zero LLM calls). Fresh analysis runs that produce zero candidates throw `PipelineError` naming the under-emitting layer. See `FORGE_PLAN_ARTIFACTS.md` sections 'Profile Migration' and 'PipelineError Class' for the complete migration function and error class definitions.

---

## Verification Plan

### Type safety
1. `npx tsc --noEmit` from repo root must pass after each item lands (Items 1-8 staged in order).

### Unit tests (new)

- `tests/test-scope2-candidate-store.ts` — verify store lifecycle: add → getActive → markConsolidated → markSuperseded → serialize/deserialize round-trip.
- `tests/test-scope2-technique-vocab-sync.ts` — assert `TECHNIQUE_VOCABULARY_LIST.length === TECHNIQUE_ROUTES.length` and names match exactly.
- `tests/test-scope2-l3-candidate-extraction.ts` — run L3 walk on a fixture essay with a clichéd opening; assert `walkOutput.sentenceUnderstandings[0].understanding.improvementCandidate !== null`; assert the `technique` is in the vocabulary; assert orchestrator harvested it into the store.
- `tests/test-scope2-l35-candidate-extraction.ts` — similar for L3.5 on a sentence with `effectiveness < 50`. Assert `improvementCandidate.suggestedChange` is non-empty.
- `tests/test-scope2-l375-paired-improvement.ts` — run L3.75 on a fixture where `craftAssessment.growthEdges` should pair with a technique. Assert `pairedImprovement !== null` for at least one edge.
- `tests/test-scope2-l4-consolidation.ts` — run the full pipeline; assert that `coachingMap.priorities[0].consolidatedFrom.length > 0` (L4 actually consolidated candidates, not gap-filled everything). Assert that every candidate in the store after L4 has `lifecycleState !== 'candidate'` (either consolidated or superseded).
- `tests/test-scope2-l5-materialization.ts` — assert that for every priority with `consolidatedFrom.length > 0`, there is an L5 annotation with `consolidatedTargetIndex` matching the priority index AND `rewriteExample !== null`.

### E2E assertions (extend existing `tests/test-conversator-v2-e2e.ts` or create `tests/test-scope2-e2e.ts`)

Target metrics, grounded in the audit's F18/F19/F20 findings:

1. **Manifest items with non-null `technique`**: current ~0%; post-Scope-2 target ≥80%. Measured via `pipelineResult.profile.improvementManifest.items.filter(i => i.technique !== null).length / items.length`.

2. **Manifest items with non-null `demonstration`**: current 0% (hardcoded null per audit); post-Scope-2 target ≥70% (L5 materializes consolidated targets with required rewriteExample). Measured via `items.filter(i => i.demonstration !== null).length / items.length`.

3. **Candidate pipeline volume**: The test pipeline should emit 5-10 candidates per essay (per audit's F6 target range of 5-10 findings per essay). Verify via `coordinator.getImprovementCandidates().length`.

4. **Consolidation ratio**: L4 should consolidate at a ratio roughly 2-3 candidates per priority. Measured via `coachingMap.priorities.flatMap(p => p.consolidatedFrom).length / coachingMap.priorities.length`. Target: ≥1.5.

5. **Gap-fill frequency**: priorities with empty `consolidatedFrom` (L4 gap-filled because no candidate matched) should be rare — target ≤20% of priorities. If >30%, upstream layers are under-emitting; investigate.

6. **L5 rewriteExample coverage on consolidated targets**: assert ≥95%. Measured as `(l5 annotations with consolidatedTargetIndex set AND rewriteExample !== null) / (l5 annotations with consolidatedTargetIndex set)`. This is the key metric for the audit's F20 gap.

7. **`matchClaimToTechnique()` deletion**: grep the codebase; assert zero references remain after Item 8 lands.

### Regression (existing tests must still pass)

- `tests/test-conversator-v2-e2e.ts` — full coaching pipeline. `pipelineResult.profile.improvementManifest.items.length > 0` should still hold; content should be richer.
- `tests/test-comprehensive-e2e.ts` — if it exists, full E2E.
- Existing L3/L3.5/L3.75/L4/L5 layer tests — all optional field additions are backward-compatible; existing tests that don't check the new fields should pass unchanged.

### Cost tracking

Add per-layer token accounting assertions to the E2E test:
- L3 output tokens post-Scope-2: within +10% of pre-Scope-2 baseline
- L3.5 output tokens: within +15%
- L3.75 output tokens: within +10%
- L4b input tokens: +5-15% (candidate context block)
- L5 input+output tokens: +10-25% (per-paragraph consolidated targets)
- **Total pipeline cost**: within +2% of pre-Scope-2 baseline (should land at ~$2.44/essay vs. current ~$2.41/essay)

---

## Summary of File Changes

| File | Change | Lines |
|------|--------|-------|
| `src/services/essayIntelligence/improvements/improvementCandidateStore.ts` | NEW | ~130 |
| `src/services/essayIntelligence/improvements/index.ts` | NEW | ~5 |
| `src/services/essayIntelligence/analysis/techniqueVocabulary.ts` | NEW | ~30 |
| `src/services/essayIntelligence/profileTypes.ts` | Extended (`ImprovementCandidate`, etc.) | +~180 |
| `src/services/essayIntelligence/profileManager/essayProfileManager.ts` | Candidate store + 5 methods | +~80 |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | Prompt + parser for `improvementCandidate` | +~80 |
| `src/services/essayIntelligence/analysis/analysisPass.ts` | Prompt + parser for `improvementCandidate` | +~90 |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | Prompt + coercer for `pairedImprovement` | +~60 |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | L4b consolidator prompt + parser | +~120 |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | L5 materialization mode | +~80 |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Harvest wiring + new `buildImprovementManifest` + delete `matchClaimToTechnique` | **-~50 net** (new wiring +~150, deleted scraper -~200) |

**Net code change: approximately +675 lines across 11 files** (net-positive because the new infrastructure outweighs the deleted scraper). The deleted `matchClaimToTechnique()` regex table is the biggest quality improvement per-line: eliminating the LLM-first design violation.
