/**
 * Wave-3a Corpus Type Surface
 *
 * Shared types for the typed, machine-readable corpus knowledge substrate
 * derived from 10 hand-curated v2.1 close-reading reviews of admitted essays
 * (10 Harvard-2028, 4 Hopkins reserved pending parallel-track reviews).
 *
 * INTENTIONAL TYPE-NAME DISTINCTNESS:
 *   The sibling module `src/services/essayIntelligence/archetypes/archetypeTypes.ts`
 *   defines `ArchetypeId` / `ArchetypeBaseline` — those are Round 7c CATEGORICAL
 *   classification labels (snake_case: `immigrant_parent_sacrifice`, `stem_epiphany`).
 *   This module's `EssayArchetype` is a different concept: a BUILDABLE RECIPE
 *   derived from a specific corpus essay (kebab-case: `compressed-heritage`,
 *   `interior-transformation-metaphor-possession`). The two coexist intentionally;
 *   downstream consumers should import from the appropriate module per use case.
 *
 * Source-of-truth: `tests/calibration/top-tier-reference/reviews/*-review-v2.md`
 * Methodology: v2.1 (sentence-level granularity, transferability load-test).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Voice Register (closed union)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The seven voice registers attested across the corpus. Distinct from
 * `Round 7c VoiceRegister` in `archetypes/archetypeTypes.ts`; do not conflate.
 *
 * - `plain` — direct, unornamented, content-led (Michael, Billy)
 * - `literary-reflective` — metaphor-balanced, register-mixed (Sarika, Michelle)
 * - `maximalist` — high reference-density, expansive (Lauren)
 * - `comedic` — humor-led with structural pivot (Orlee, Daniella)
 * - `domain-insider` — specialized vocabulary without explanation (Lauren, Michelle)
 * - `intellectual-playful` — mundane topic, philosophical reach (Daniella)
 * - `lyric` — sonic density, rhythmic prose (Sarika in places, Clara opening)
 */
export type VoiceRegister =
  | 'plain'
  | 'literary-reflective'
  | 'maximalist'
  | 'comedic'
  | 'domain-insider'
  | 'intellectual-playful'
  | 'lyric';

// ─────────────────────────────────────────────────────────────────────────────
// Source-essay identifiers (closed union; matches PROVENANCE.md)
// ─────────────────────────────────────────────────────────────────────────────

export type CorpusEssayId =
  // Hopkins (4) — essay text exists; reviews pending parallel chat
  | '01-hopkins-2029-splash-of-color'
  | '02-hopkins-2029-building-a-universe'
  | '03-hopkins-2028-korean-sticky-notes'
  | '04-hopkins-2027-ordering-the-disorderly'
  // Harvard (10) — full v2.1 review attestation
  | '05-harvard-2028-i-too-can-dance'
  | '06-harvard-2028-three-days-before-a-plane'
  | '07-harvard-2028-peabody-skatepark'
  | '08-harvard-2028-cookies'
  | '09-harvard-2028-bra-shopping'
  | '10-harvard-2028-the-zoo'
  | '11-harvard-2028-fish-out-of-water'
  | '12-harvard-2028-three-years-alone'
  | '13-harvard-2028-sondheim'
  | '14-harvard-2028-crochet';

/** All corpus essay IDs as a const array — used by integrity test. */
export const ALL_CORPUS_ESSAY_IDS = [
  '01-hopkins-2029-splash-of-color',
  '02-hopkins-2029-building-a-universe',
  '03-hopkins-2028-korean-sticky-notes',
  '04-hopkins-2027-ordering-the-disorderly',
  '05-harvard-2028-i-too-can-dance',
  '06-harvard-2028-three-days-before-a-plane',
  '07-harvard-2028-peabody-skatepark',
  '08-harvard-2028-cookies',
  '09-harvard-2028-bra-shopping',
  '10-harvard-2028-the-zoo',
  '11-harvard-2028-fish-out-of-water',
  '12-harvard-2028-three-years-alone',
  '13-harvard-2028-sondheim',
  '14-harvard-2028-crochet',
] as const satisfies readonly CorpusEssayId[];

// ─────────────────────────────────────────────────────────────────────────────
// School identifiers (for school-fit vectors)
// ─────────────────────────────────────────────────────────────────────────────

export type SchoolId =
  | 'harvard'
  | 'johns-hopkins'
  | 'stanford'
  | 'yale'
  | 'princeton'
  | 'mit'
  | 'caltech'
  | 'uchicago'
  | 'brown'
  | 'columbia'
  | 'penn'
  | 'cornell'
  | 'dartmouth'
  | 'duke'
  | 'northwestern';

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline layer identifiers (for bias-guard injection-targets)
// ─────────────────────────────────────────────────────────────────────────────

export type PipelineLayer = 'L3' | 'L3.5' | 'L3.75' | 'L4' | 'L5' | 'L6';

// ─────────────────────────────────────────────────────────────────────────────
// Craft Move
// ─────────────────────────────────────────────────────────────────────────────

export type MoveTransferability = 'universal' | 'broad' | 'narrow' | 'specific';
export type MoveDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type MoveDimension =
  | 'voice'
  | 'structure'
  | 'specificity'
  | 'emotion'
  | 'argument'
  | 'opening'
  | 'closing'
  | 'metaphor';

export interface SourceEssayCitation {
  essayId: CorpusEssayId;
  paragraph: number;
  excerpt: string;
}

export interface CraftMove {
  /** Stable kebab-case identifier. */
  id: string;
  displayName: string;
  /** 1-3 sentences naming what specifically the move does. NO platitudes. */
  mechanism: string;
  /** What the pipeline would look for in a draft to detect this move. */
  detectionSignal: string;
  /** Cross-topic transferability statement. */
  universalApplication: string;
  transferability: MoveTransferability;
  difficulty: MoveDifficulty;
  /**
   * DEPRECATED for coaching gates — use hardRequires in MoveDependency instead.
   * This field stays for backward compatibility until Wave-3b migration completes.
   * Soft pedagogical "these moves usually come first" hints, NOT blocking gates.
   */
  prerequisites: string[];
  /** Specific failure modes when the move is misapplied. */
  antiPatterns: string[];
  sourceEssays: SourceEssayCitation[];
  dimensions: MoveDimension[];
  compatibleRegisters: VoiceRegister[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Move Excerpt
// ─────────────────────────────────────────────────────────────────────────────

export interface MoveExcerpt {
  id: string;
  moveId: string;
  essayId: CorpusEssayId;
  paragraph: number;
  /** 2-5 sentence self-contained excerpt — readable without surrounding essay. */
  excerpt: string;
  /** 1-2 sentences naming what the excerpt demonstrates. */
  annotation: string;
  /** Tags for dimension-based + topic-based retrieval. */
  retrievalTags: string[];
  /** 1-10 calibration anchor strength for few-shot use. */
  anchorLevel: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Essay Archetype
// ─────────────────────────────────────────────────────────────────────────────

export interface ArchetypeStage {
  stageName: string;
  purpose: string;
  /** "paragraph 1-2", "single sentence hinge", "closing paragraph", etc. */
  typicalLocation: string;
  requiredMoveIds: string[];
  optionalMoveIds: string[];
}

export type ArchetypeProvenance =
  | 'fully-attested'           // v2.1 review exists
  | 'pending-hopkins-reviews'; // reserved slot, awaiting parallel-chat output

export interface EssayArchetype {
  /** Stable kebab-case identifier. */
  id: string;
  /** Corpus essay this archetype was derived from. */
  exemplarEssayId: CorpusEssayId;
  description: string;
  structuralStages: ArchetypeStage[];
  loadBearingMoveIds: string[];
  voiceRequirements: VoiceRegister[];
  /** What the writer's life must contain for this archetype to work. */
  contentRequirements: string[];
  whenToUse: string;
  whenNotToUse: string;
  commonFailureModes: string[];
  schoolFitStrength: Partial<Record<SchoolId, 'strong' | 'moderate' | 'weak' | 'not-a-fit'>>;
  /** Provenance of this archetype's source review. */
  provenance: ArchetypeProvenance;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deliberate Absence
// ─────────────────────────────────────────────────────────────────────────────

export interface DeliberateAbsence {
  id: string;
  description: string;
  /** Why the absence is load-bearing — derived from review observations. */
  why: string;
  appliesToArchetypeIds: string[];
  exemplars: Array<{ essayId: CorpusEssayId; demonstration: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anti-Archetype
// ─────────────────────────────────────────────────────────────────────────────

export interface AntiArchetype {
  id: string;
  description: string;
  /** Concrete signals in a student draft that suggest this anti-pattern. */
  diagnosticSignals: string[];
  failureMode: string;
  /** Which corpus archetype the student should reach for instead. */
  corpusAlternativeArchetypeId: string;
  /** Concrete steps to convert from anti-archetype toward the alternative. */
  transplantPath: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Move Dependency (DAG node)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Relationship-confidence enum distinguishing structural gates from soft hints.
 *
 * `hard-attested` — Structural requirement: the dependent move CANNOT succeed
 *   without the required move present. Attested by explicit review text.
 *   Coaching uses this as a blocking gate.
 *
 * `strong-correlation` — The two moves co-occur across 3+ corpus essays,
 *   or the review explicitly describes them as clustered. Coaching surfaces
 *   as "writers who do X often also do Y" — NEVER blocks.
 *
 * `suggested-pairing` — Observed together in 1-2 essays. Weak signal.
 *   Coaching may mention; never gates.
 */
export type DependencyConfidence =
  | 'hard-attested'
  | 'strong-correlation'
  | 'suggested-pairing';

export interface MoveDependency {
  moveId: string;
  /**
   * Hard structural prerequisites — moves that must be present for this one
   * to work. SMALL LIST (≤10 entries across entire file). Every entry cites
   * review evidence via `corpusJustification`.
   */
  hardRequires: string[];
  /**
   * Moves this one structurally makes possible. Informational, not gating.
   */
  enables: string[];
  /**
   * Structural incompatibilities — moves that cannot coexist with this one
   * in the same passage. Rare and corpus-attested.
   */
  conflicts: string[];
  /**
   * Specific review passage(s) attesting the hard relationships. REQUIRED
   * when hardRequires or conflicts is non-empty. Cite essay + paragraph.
   */
  corpusJustification: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived Correlation (generated by tools/corpus/deriveCorrelations.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derived correlation between two moves. NEVER hand-coded — computed by
 * `tools/corpus/deriveCorrelations.ts` from move.sourceEssays +
 * archetype.loadBearingMoveIds + structuralStage membership.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SCORING MODEL (revised 2026-04-20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Three orthogonal signals, each weighted by semantic authority:
 *
 * archetypeScore (0-5) — DOMINANT SIGNAL
 *   5: both moves appear in same archetype's loadBearingMoveIds
 *      OR same structuralStage.requiredMoveIds
 *   4: one is loadBearing, other appears in same archetype's requiredMoveIds
 *   2: both appear in same archetype (anywhere incl. optional)
 *   0: no shared archetype
 *   Rationale: curator explicitly identifying two moves as co-defining an
 *   architecture is the strongest correlation signal we have.
 *
 * attestationScore (0-3) — CROSS-ESSAY EVIDENCE
 *   3: 4+ essays attesting
 *   2: 3 essays
 *   1: 2 essays
 *   0: 1 essay
 *   Rationale: corpus-wide replication raises confidence.
 *
 * proximityScore (0-2) — REVIEWER-UNIT SIGNAL
 *   2: same paragraph in any essay (min distance 0)
 *   1: adjacent or near-adjacent (distance 1-2)
 *   0: distant (3+)
 *   Rationale: reviewer analyzing moves in same paragraph treats them as
 *   a cognitive unit.
 *
 * totalScore = archetypeScore + attestationScore + proximityScore (0-10)
 *
 * TIER ASSIGNMENT:
 *   strong-correlation: totalScore ≥ 6 OR archetypeScore ≥ 5 (auto-promote
 *     because curator evidence is authoritative even without other signals)
 *   suggested-pairing: totalScore ≥ 4
 *   (below 4 is dropped from output)
 *
 * RETRIEVAL SORT ORDER per move:
 *   Primary: totalScore DESC
 *   Tiebreaker: archetypeScore DESC
 *   Final tiebreaker: moveIdB lexical ASC (determinism)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * COACHING CONSUMPTION (Phase 2+)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   strong-correlation → surface as "writers who do X often also do Y"
 *                        (NEVER "you must do Y" — no hard gating)
 *   suggested-pairing  → surface as "consider: Y appears near X in corpus"
 *
 * Hard gates live in moveDependencies.ts (6 entries). Derived correlations
 * are ADVISORY ONLY — coaching never blocks on them.
 */
export interface DerivedCorrelation {
  moveIdA: string;
  moveIdB: string;
  /** Essays where both moves co-occur, with paragraph proximity (min distance). */
  coOccurrences: Array<{
    essayId: CorpusEssayId;
    minParagraphDistance: number; // 0 = same paragraph; 1 = adjacent; etc.
  }>;
  /** Archetypes where both moves share any membership. */
  sharedArchetypes: string[];
  /** Unique essays attesting the correlation. Derived from coOccurrences. */
  attestingEssays: CorpusEssayId[];
  /** 0-5 archetype-cluster score per scoring rules above. */
  archetypeScore: number;
  /** 0-3 cross-essay attestation score per scoring rules above. */
  attestationScore: number;
  /** 0-2 proximity score per scoring rules above. */
  proximityScore: number;
  /** 0-10 total composite score (archetypeScore + attestationScore + proximityScore). */
  totalScore: number;
  /** Classification per tier thresholds. */
  tier: 'strong-correlation' | 'suggested-pairing';
}

/**
 * Per-move retrieval index — sorted correlations ready for Phase 2 retrieval
 * API. Generated alongside derivedCorrelations.json for zero-cost lookup.
 *
 * Sort order: totalScore DESC, archetypeScore DESC, moveIdB ASC (determinism).
 */
export interface PerMoveCorrelationIndex {
  sourceHash: string; // must match DerivedCorrelationsArtifact.sourceHash
  derivedAt: string;
  scriptVersion: string;
  byMove: Record<string, {
    strongCorrelations: Array<{
      moveId: string;
      totalScore: number;
      archetypeScore: number;
      attestationScore: number;
      proximityScore: number;
      sharedArchetypes: string[];
      attestingEssayCount: number;
    }>;
    suggestedCorrelations: Array<{
      moveId: string;
      totalScore: number;
      archetypeScore: number;
      attestationScore: number;
      proximityScore: number;
      sharedArchetypes: string[];
      attestingEssayCount: number;
    }>;
  }>;
}

/** Top-level shape of the derivedCorrelations.json artifact. */
export interface DerivedCorrelationsArtifact {
  /** SHA-256 of the inputs used to derive (moves + archetypes). Changes trigger re-derivation. */
  sourceHash: string;
  /** ISO timestamp of derivation run. */
  derivedAt: string;
  /** The underlying script version that produced this artifact. */
  scriptVersion: string;
  /** All derived correlations above confidence threshold (≥4). */
  correlations: DerivedCorrelation[];
  /** Derivation metadata for debugging. */
  stats: {
    totalPairsConsidered: number;
    correlationsAboveThreshold: number;
    strongCorrelations: number;
    suggestedPairings: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice × Archetype Compatibility (THE SAFETY RAIL)
// ─────────────────────────────────────────────────────────────────────────────

export type CompatibilityFit = 'native' | 'reachable' | 'risky' | 'forbidden';

export interface ArchetypeFitEntry {
  archetypeId: string;
  fit: CompatibilityFit;
  /** Citation-bearing rationale. `forbidden` MUST cite specific corpus evidence. */
  rationale: string;
}

export interface VoiceArchetypeMatch {
  voiceRegister: VoiceRegister;
  archetypeCompatibility: ArchetypeFitEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG embedding metadata (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Entity types that get embedded into the `corpus_embeddings` pgvector table.
 * Adding a new type requires (a) adding here, (b) teaching embedCorpus.ts
 * how to construct the embedding text for the type, (c) adding retrieval
 * query paths in retrieval.ts.
 */
export type EmbeddingEntityType =
  | 'move'              // CraftMove mechanism + detection + universalApplication
  | 'excerpt'           // MoveExcerpt raw excerpt text
  | 'archetype'         // EssayArchetype description + stages
  | 'anti-pattern'      // AntiArchetype description + failure mode
  | 'absence'           // DeliberateAbsence description + why
  | 'review-passage';   // raw review markdown paragraphs, for L6 conversation grounding

/**
 * Metadata stored alongside each embedding. Enables structured filtering
 * before semantic rank — the hybrid-retrieval core.
 */
export interface EmbeddingMetadata {
  entityType: EmbeddingEntityType;
  entityId: string;
  /**
   * Content hash (SHA-256 of source text). Used to skip re-embedding
   * unchanged entries. Content-addressable invalidation.
   */
  contentHash: string;
  /** Source corpus essay if applicable (null for archetype-level entries). */
  sourceEssayId: CorpusEssayId | null;
  /** Source paragraph if applicable. */
  sourceParagraph: number | null;
  /** Structured filters — indexed for fast WHERE clauses before vector rank. */
  filters: {
    voiceRegisters?: VoiceRegister[];
    dimensions?: MoveDimension[];
    archetypeIds?: string[];
    transferability?: MoveTransferability;
    difficulty?: MoveDifficulty;
  };
  /** Free-form provenance string for human audit. */
  provenance: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contextual Validity (clichés earned in context)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContextualPattern {
  id: string;
  defaultClassification: 'cliché' | 'overused' | 'generic';
  /** What context lets this pattern earn its place rather than fail. */
  validatingContext: string;
  /** How the pipeline could detect the validating context. */
  detectionRule: string;
  exemplars: Array<{ essayId: CorpusEssayId; earningContext: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reader Bias Guard
// ─────────────────────────────────────────────────────────────────────────────

export interface BiasGuard {
  id: string;
  biasDescription: string;
  /** Plain prose, ready to inject into an LLM prompt. */
  correctiveInstruction: string;
  appliesTo: PipelineLayer[];
  evidenceFromCorpus: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// School Fit Vector
// ─────────────────────────────────────────────────────────────────────────────

export type ResolutionType = 'external-preferred' | 'internal-preferred' | 'either';

export interface SchoolFitDimensions {
  /** 0-10 — how dense the craft must be to clear this school's bar. */
  craftDensity: number;
  /** 0-10 — how much specific intellectual content the essay must show. */
  intellectualSpecificity: number;
  /** 0-10 — how much biographical/identity content the essay can carry. */
  biographicalLoad: number;
  /** 0-10 — how much voice/structural risk the school will reward. */
  voiceRisk: number;
  resolutionType: ResolutionType;
}

export interface ArchetypeAffinity {
  archetypeId: string;
  /** 0-10 — how strongly this archetype maps to this school's selection pattern. */
  strength: number;
}

export interface SchoolFitVector {
  schoolId: SchoolId;
  dimensions: SchoolFitDimensions;
  archetypeAffinities: ArchetypeAffinity[];
  /** Honest provenance — direct corpus evidence vs. inferred from cross-school analysis. */
  corpusEvidence: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Corpus Limit (per-move/per-archetype "cannot teach when")
// ─────────────────────────────────────────────────────────────────────────────

export interface CannotTeachCondition {
  /** Detectable condition in student draft or student context. */
  condition: string;
  /** Why the move/archetype fails under this condition. */
  reason: string;
  /** How the pipeline would detect this condition. */
  detectionGuidance: string;
}

export interface CorpusLimit {
  targetId: string;
  targetType: 'move' | 'archetype';
  cannotTeachWhen: CannotTeachCondition[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest
// ─────────────────────────────────────────────────────────────────────────────

export interface CorpusManifest {
  version: string;
  lastModified: string; // ISO date
  totals: {
    moves: number;
    excerpts: number;
    archetypes: number;
    archetypesAttested: number;
    archetypesReserved: number;
    deliberateAbsences: number;
    antiArchetypes: number;
    contextualValidityPatterns: number;
    biasGuards: number;
    schoolFitVectors: number;
    schoolFitVectorsAttested: number;
    schoolFitVectorsInferred: number;
    moveDependencies: number;
    voiceArchetypeCompatibilityCells: number;
    corpusLimits: number;
  };
  sourceOfTruth: {
    essaysDir: string;
    reviewsDir: string;
    methodologyFile: string;
    provenanceFile: string;
  };
}
