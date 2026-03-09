# Profile Manager Architecture (Updated)
> Replaces PLAN.md Profile Manager references. Incorporates coordinator + domain mutators split, staleness tracking, validation, readiness scoring, and circuit breaker.

---

## 1. Architecture: Coordinator + Domain Mutators

A single monolithic Profile Manager that handles sentence understanding, holistic synthesis, connection creation, voice map entries, earned-ness arrows, and North Star updates would become a god object within a month. The fix (from review S8): split into a thin coordinator that orchestrates, and focused domain mutators that own their slice of the profile.

### The Coordinator (`essayProfileManager.ts`)

The EssayProfileCoordinator is deliberately thin. It is a dispatch hub, not a domain expert.

**What it does:**
- Owns the optimistic concurrency write lock (single `writeVersion` counter, incremented on every mutation)
- Dispatches mutations to the correct domain mutator(s) based on which layer is calling
- Manages cross-domain staleness propagation via a declared dependency map (see Section 3)
- Triggers ProfileIndex recomputation after every mutation
- Handles checkpointing at pipeline boundaries
- Validates cross-domain consistency (delegates intra-domain validation to each mutator)

**What it does NOT do:**
- Contain any domain-specific mutation logic (no sentence parsing, no connection deduplication, no holistic section merging)
- Import database modules or know how persistence works
- Make LLM calls or contain any AI logic
- Decide what content belongs in any profile section

**Why mutable in-place**: During the L3 understanding walk, the coordinator processes 5+ mutations in 30-45 seconds (one per paragraph, each with back-propagations and new connections). Creating immutable copies on each mutation would be wasteful — the profile is a single-writer, single-reader data structure during the pipeline. The coordinator is the sole writer. Safety comes through exclusive ownership, not copying.

**Why the coordinator does not own persistence**: Testability. In tests, the checkpoint store is a no-op or an in-memory buffer. In production, the orchestrator provides a callback that writes to Supabase. The coordinator never imports database modules.

### The 8 Domain Mutators

Each mutator owns one slice of the EssayProfile. It validates its own domain's internal referential integrity. The coordinator validates cross-domain consistency.

| Mutator | Domain | What It Owns |
|---------|--------|-------------|
| `SentenceMutator` | Sentence-level understanding and analysis | `observedFunctions`, `inferredIntents`, `narrativeContributions`, word significance, tags, back-propagation from later paragraphs. Supersession model: entire arrays replaced, not appended. |
| `ParagraphMutator` | Paragraph-level understanding, analysis, role | Paragraph role, effectiveness score, emotional register, craft profile, structural bookkeeping (sentence counts, index boundaries). |
| `HolisticMutator` | All 7 holistic sections + entanglements | Voice identity, emotional topography, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, AND the 8th section (cross-dimension entanglements). Supports both incremental merge (during L3 walk) and full supersession (during L3.75). |
| `ConnectionMutator` | Connection creation, removal, updates | `connections.all[]`, `imageRecurrences`, `narrativeArcMap`, `redundancies`. Manages `connectionRefs` on sentences (coordinated with SentenceMutator). Ensures unique connection IDs and valid endpoints. |
| `VoiceMapMutator` | Voice shift entries and stability regions | Voice map entries across 5 dimensions (register, vocabulary fingerprint, sentence rhythm, perspective/distance, tonal disposition). Intentionality assessments with confidence levels. Stability region annotations. |
| `EarnednessMutator` | Earned-ness arrow creation, removal, typing | Backward-trace arrows from emotional/intellectual peaks to supporting earlier passages. Mechanism typing (sensory grounding, emotional setup, stakes establishment, character revelation, thematic preparation). Gap identification for unearned moments. |
| `NorthStarMutator` | North Star updates | Through-line map, structural roles, trajectory, distinctiveness signature, intent bridge. Typically only written during L4 crystallization; rarely updated afterward except through conversation insights. |
| `InsightMutator` | Conversation insight storage | Insight creation from L6 conversation. Categorization (confirmation, reinterpretation, new context, correction, preference, clarification, emotional reaction, resistance). Partial supersession support. Durability management (ephemeral, draft-durable, essay-durable, student-durable). Pattern detection metadata. |

**Intra-domain validation examples** (each mutator enforces these on its own writes):
- `SentenceMutator` ensures sentence indices are in range of the actual paragraph.
- `ConnectionMutator` ensures connection IDs are unique and both endpoints exist.
- `EarnednessMutator` ensures backward-trace arrows point to valid paragraph/sentence locations.
- `VoiceMapMutator` ensures shift points reference valid paragraph boundaries.
- `InsightMutator` ensures insights reference valid profile locations and that superseded insights are properly linked.

### Coordinator Class Definition

```typescript
class EssayProfileCoordinator {
  private profile: EssayProfile;
  private writeVersion: number;
  private stalenessTracker: StalenessTracker;
  private checkpointStore: CheckpointStore;
  private circuitBreaker: CircuitBreakerState;

  // ── Domain mutators ──
  private sentence: SentenceMutator;
  private paragraph: ParagraphMutator;
  private holistic: HolisticMutator;
  private connection: ConnectionMutator;
  private voiceMap: VoiceMapMutator;
  private earnedness: EarnednessMutator;
  private northStar: NorthStarMutator;
  private insight: InsightMutator;

  // ═══ LAYER-SPECIFIC ENTRY POINTS ═══
  // Each layer calls exactly ONE method. The coordinator routes internally.

  /** L1: Seed the profile from first impressions */
  applyFirstImpressions(impressions: ParagraphFirstImpression[]): void;

  /** L2: Apply structural cartography */
  applyStructuralCartography(cartography: StructuralCartography): void;

  /** L2.5: Apply connection scout leads */
  applyScoutLeads(scout: ConnectionScout): void;

  /** L3: Apply one paragraph's understanding walk output */
  applyUnderstandingWalkStep(output: UnderstandingWalkOutput): void;

  /** L3.75: Apply holistic synthesis (replaces all 7+1 holistic sections) */
  applyHolisticSynthesis(synthesis: HolisticSynthesisOutput): void;

  /** L3.5: Apply one paragraph's analysis pass output */
  applyAnalysisPassResult(result: AnalysisPassOutput): void;

  /** L4: Apply North Star crystallization */
  applyNorthStar(northStar: NorthStarOutput): void;

  /** L6: Apply a conversation insight */
  applyConversationInsight(insight: ConversationInsight): void;

  /** Edit pipeline: Apply light-touch profile updates from editing (see Section 7) */
  applyLightTouchUpdate(update: LightTouchUpdate): void;

  /** Edit pipeline: Apply edit understanding from re-analysis */
  applyEditUnderstanding(output: EditUnderstandingOutput): void;

  // ═══ QUERY METHODS (read-only) ═══

  /** Get current profile (read-only snapshot for rendering) */
  getProfile(): Readonly<EssayProfile>;

  /** Get current staleness state */
  getStalenessState(): StalenessSnapshot;

  /** Compute readiness scores */
  computeReadiness(): ReadinessScores;

  /** Run quick validation (referential integrity) */
  validateQuick(): ValidationResult;

  /** Run full validation (semantic coherence — expensive) */
  validateFull(): ValidationResult;

  /** Get staleness report for external consumers */
  getStalenessReport(): StalenessReport;

  // ═══ LIFECYCLE ═══

  /** Checkpoint to storage (calls CheckpointStore callback) */
  checkpoint(reason: CheckpointReason): void;

  /** Recompute the ProfileIndex (runs after every mutation) */
  private recomputeIndex(): void;

  /** Propagate staleness across domains (runs after mutations that touch cross-domain concerns) */
  private propagateStaleness(trigger: StalenessTrigger): void;
}
```

### Initialization

The factory function `createInitialProfile()` produces a properly shaped EssayProfile from raw essay text. No builder pattern, no complex constructor — a plain data object ready for L1 to populate.

```typescript
function createInitialProfile(input: {
  essayText: string;
  paragraphTexts: string[];
  sentenceTexts: string[][];     // sentenceTexts[paragraphIdx][sentenceIdx]
  metadata: {
    essayType: 'common_app' | 'supplement' | 'piq';
    wordCount: number;
    promptText?: string;
  };
}): EssayProfile {
  // Creates:
  // - ProfileIndex with essayLength, empty paragraphDigest stubs, all zeros
  // - Empty holistic sections (all string fields = '', all arrays = [])
  // - Paragraph map with sentence stubs (text populated, understanding/analysis = null)
  // - Empty connections store
  // - Empty voice map, earned-ness map, North Star
  // - Metadata: confidenceLevel = 'initial', lastUpdatedLayer = 0
  //
  // No LLM calls. No complex logic. Just data shaping.
}
```

The initial profile is ~2KB. Every field has a defined empty state. L1 first impressions populate the first real content. The factory function is the ONLY way to create an EssayProfile — no other code path should construct one from scratch.

### Mutation Routing: How `applyUnderstandingWalkStep` Works Internally

This is the most complex entry point — it touches 3 mutators and the coordinator's own bookkeeping.

1. **SentenceMutator**: Store `paragraphUnderstanding` as the paragraph's understanding entry. For each `priorSentenceUpdate`, replace the target sentence's understanding fields (supersession — entire `observedFunctions` array replaced, not appended).

2. **ConnectionMutator**: Add `newConnections` to `connections.all[]` with unique IDs. Add connection ref IDs to endpoint sentences (coordinated with SentenceMutator). Validate no duplicate connection IDs.

3. **HolisticMutator**: Merge `holisticEvolution` fields — only fields that are present in the output. Omitted fields are unchanged. This is the incremental holistic update during the walk; the full holistic profile comes from L3.75.

4. **Coordinator**: Recompute Profile Index (paragraph digests, connection graph, topic tags). Propagate staleness for any back-propagated sentences (their connections and earned-ness arrows may be affected). Checkpoint if at a pipeline boundary.

### Integration with Each Pipeline Layer

How the coordinator is called at each pipeline stage:

| Layer | Coordinator Method | What Happens Inside |
|-------|-------------------|-------------------|
| L1 | `applyFirstImpressions()` | SentenceMutator populates sentence stubs with first-impression understanding. ParagraphMutator sets initial paragraph roles. Index recomputed with initial tags and digests. |
| L2 | `applyStructuralCartography()` | ParagraphMutator updates paragraph roles with structural context (supersession). HolisticMutator seeds narrative strategy. Index updated with structural tags. |
| L2.5 | `applyScoutLeads()` | ConnectionMutator creates provisional connections (low-confidence leads for L3). SentenceMutator adds scout-tag refs. |
| L3 (per paragraph) | `applyUnderstandingWalkStep()` | SentenceMutator stores paragraph understanding + applies back-propagations. ConnectionMutator adds new connections. HolisticMutator merges holistic evolution. Staleness propagated for back-propagated sentences. Index recomputed. |
| L3.75 | `applyHolisticSynthesis()` | HolisticMutator replaces ALL 7+1 holistic sections (full supersession). VoiceMapMutator populated with full voice map. EarnednessMutator populated with earned-ness arrow network. This is the first time holistic sections are comprehensively populated. Index section token counts recomputed. **Checkpoint.** |
| L3.5 (per paragraph, parallel) | `applyAnalysisPassResult()` | SentenceMutator stores analysis for each sentence. ParagraphMutator stores paragraph effectiveness. HolisticMutator updates craft assessment strength signatures. Index hasStrengths/hasWeaknesses flags updated. Readiness scores recomputed after all paragraphs complete. **Checkpoint.** |
| L4 | `applyNorthStar()` | NorthStarMutator stores the five dimensions. Index finalized. **Checkpoint.** |
| L6 | `applyConversationInsight()` | InsightMutator categorizes and stores the insight. Depending on category: SentenceMutator may update inferred intents (confirmation/reinterpretation), ConnectionMutator may add/modify connections (new context), VoiceMapMutator may update intentionality (preference/correction). Staleness propagated. |
| Edit (light-touch) | `applyLightTouchUpdate()` | Per-sentence row-level updates. Text references updated. Staleness markers applied. No profile-level lock. See Section 7. |
| Edit (re-analysis) | `applyEditUnderstanding()` | Pre-mutation snapshot taken. Understanding/analysis mutations applied through normal mutator paths. Profile-level optimistic lock used. |

---

## 2. Staleness Tracking System

When the VoiceMapMutator adds a new voice shift entry at paragraph 3, the coordinator needs to know: which other sections might now be out of date? This is the staleness tracking system — a combination of a declared dependency map (Section 3), depth-bounded propagation, and per-element tracking with timestamps.

### Core Types

```typescript
interface StalenessTracker {
  /** All currently stale entries, keyed by a location string (e.g., 'p2.s3', 'holistic.voice_identity') */
  entries: Map<string, StalenessEntry>;

  /** Mark an element as stale */
  markStale(target: StalenessTarget, strength: StalenessStrength, reason: string, trigger: MutationType): void;

  /** Clear staleness for an element (after it's been refreshed) */
  clearStaleness(target: StalenessTarget): void;

  /** Clear all staleness of a given strength or weaker */
  clearByStrength(maxStrength: StalenessStrength): void;

  /** Get all strong-stale entries (for re-analysis suggestion logic) */
  getStrongStaleCount(): number;

  /** Get staleness snapshot (for Profile Router — decides what to include in LLM calls) */
  getSnapshot(): StalenessSnapshot;

  /** Get full report (for external consumers — UI, debugging) */
  getReport(): StalenessReport;
}

interface StalenessEntry {
  target: StalenessTarget;
  strength: StalenessStrength;
  reason: string;
  /** When this staleness was recorded */
  markedAt: number;
  /** Which mutation caused this staleness */
  triggeredBy: MutationType;
  /** Propagation depth: 0 = the changed element itself, 1 = direct connection, 2 = two-hop */
  depth: 0 | 1 | 2;
}

type StalenessStrength = 'strong' | 'moderate' | 'weak';

type StalenessTarget =
  | { type: 'holistic'; section: HolisticSectionType }
  | { type: 'paragraph'; index: number }
  | { type: 'sentence'; paragraph: number; sentence: number }
  | { type: 'connections'; connectionIds: string[] }
  | { type: 'north_star' }
  | { type: 'entanglements' };

type HolisticSectionType =
  | 'voice_identity'
  | 'emotional_topography'
  | 'thematic_architecture'
  | 'narrative_strategy'
  | 'character_revelation'
  | 'craft_assessment'
  | 'admissions_positioning'
  | 'cross_dimension_entanglements';

interface StalenessSnapshot {
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  /** Strong-stale entries, for the Profile Router to prioritize in context assembly */
  strongEntries: StalenessEntry[];
  /** Moderate-stale entries, for inclusion when token budget allows */
  moderateEntries: StalenessEntry[];
}

interface StalenessReport {
  /** Full snapshot */
  snapshot: StalenessSnapshot;
  /** Weak entries (included for completeness, not actionable) */
  weakEntries: StalenessEntry[];
  /** Whether re-analysis is suggested (strong count >= 3) */
  reanalysisSuggested: boolean;
  /** Total staleness by domain */
  byDomain: Record<string, { strong: number; moderate: number; weak: number }>;
  /** When staleness was last cleared (by layer or checkpoint) */
  lastClearedAt: number | null;
}
```

### Staleness Depth Limits (review S1)

In well-connected essays, staleness can cascade: changing one sentence marks 3-5 connected sentences stale, each with their own connections. After 10 edits, the majority of the profile could be flagged stale — defeating the purpose of focused mode. The fix: three tiers of staleness with bounded propagation.

| Depth | Strength | Meaning | Propagation Rule |
|-------|----------|---------|-----------------|
| 0 — the changed element itself | **strong** | Must be refreshed before use in any LLM call | Always marked |
| 1 — directly connected elements | **moderate** | Include in next relevant LLM call for potential update | Marked only for elements with direct connections or dependency map entries |
| 2 — two-hop connections | **weak** | Logged for information; does not trigger refresh | Logged but NOT propagated further. No depth-3 staleness exists. |

**Re-analysis suggestions trigger on strong-staleness count**, not total staleness. When 3+ sentences have strong staleness, the system suggests re-analysis. Moderate staleness accumulates silently — the next L3.75 or L3.5 pass will pick it up naturally. Weak staleness is purely informational and never triggers any action.

**Example cascade**: Student edits P3S2. Staleness propagation:
1. **Depth 0 (strong)**: P3S2 understanding + analysis marked stale. Paragraph P3 digest marked stale.
2. **Depth 1 (moderate)**: Connections involving P3S2 (say, conn_007 linking P3S2 to P1S4). The other endpoint P1S4 marked moderate-stale. Earned-ness arrows pointing to P3S2 marked moderate-stale. Holistic sections per dependency map (emotional_topography, thematic_architecture) marked moderate-stale.
3. **Depth 2 (weak)**: Connections involving P1S4 (say, conn_003 linking P1S4 to P5S1). P5S1 marked weak-stale. **Propagation stops here.** Connections involving P5S1 are NOT traversed.

### Session Boundary Handling (review M3)

If the student leaves mid-flow-state with a high engagement threshold (many rapid edits accumulating moderate staleness) and returns the next day in reflective mode, the accumulated staleness context is wrong — the student is in a different cognitive state.

**Rules at session boundary:**
- **Reset engagement threshold**: The staleness accumulation counter (how many moderate-stale entries before suggesting re-analysis) resets to default. The student's editing rhythm restarts.
- **Preserve version record**: The actual staleness entries survive across sessions. Strong staleness from the previous session is still strong. What resets is the behavioral threshold for *suggesting* re-analysis, not the staleness data itself.
- **Session boundary detection**: Defined as 30+ minutes of inactivity. The coordinator checks `Date.now() - lastMutationTimestamp` on the next mutation. If > 30 minutes, reset the engagement threshold.

```typescript
interface SessionBoundaryState {
  /** Timestamp of the last mutation */
  lastMutationAt: number;
  /** Current engagement threshold — number of strong-stale entries before suggesting re-analysis */
  reanalysisThreshold: number;
  /** Default threshold (restored at session boundary) */
  defaultThreshold: 3;
  /** Whether the current session is the first since profile creation */
  isFirstSession: boolean;
}
```

---

## 3. Dependency Map (Cross-Domain Propagation)

The dependency map is a **static configuration object**, not a dynamic graph. It encodes architectural knowledge about the EssayProfile's internal relationships. When a new holistic section is added, one entry in the map covers it. The coordinator reads the map after every mutation and marks targets as stale — it never computes staleness dynamically.

### Types

```typescript
/**
 * Declares which mutations affect which profile sections.
 * The coordinator reads this to propagate staleness after every mutation.
 *
 * Key: the type of mutation that occurred.
 * Value: the sections that may now be stale, with staleness strength.
 */
type StalenessDependencyMap = Record<MutationType, StalenessEffect[]>;

type MutationType =
  | 'sentence_understanding_updated'
  | 'sentence_analysis_updated'
  | 'paragraph_role_updated'
  | 'holistic_section_updated'
  | 'connection_added'
  | 'connection_removed'
  | 'voice_shift_added'
  | 'voice_shift_removed'
  | 'voice_intentionality_updated'
  | 'earnedness_arrow_added'
  | 'earnedness_arrow_removed'
  | 'north_star_updated'
  | 'conversation_insight_applied';

interface StalenessEffect {
  /** Which section is affected */
  target: StalenessTarget;
  /** How strongly this mutation affects the target */
  strength: StalenessStrength;
  /** Human-readable reason (for debugging and logging) */
  reason: string;
}
```

### Dependency Declarations

The complete map. Each row reads: "When [mutation] occurs, mark [target] as [strength]-stale because [reason]."

**Voice Map changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Voice shift added at P(n) | `emotional_topography` | moderate | Voice shift may coincide with emotional transition |
| | `thematic_architecture` | moderate | Voice shift may carry thematic weight |
| | `craft_assessment` | moderate | New craft pattern detected |
| | `cross_dimension_entanglements` | strong | Voice-theme or voice-emotion entanglement may exist |
| Voice shift removed | Same targets | moderate | Entanglement that depended on this shift may be invalid |
| Voice intentionality updated | `admissions_positioning` | weak | Intentional voice choices affect memorability assessment |

**Sentence understanding changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Sentence understanding updated (P(n)S(m)) | Paragraph P(n) digest | strong | Paragraph summary needs refresh |
| | Connections involving P(n)S(m) | moderate | Connection descriptions may need updating |
| | Earned-ness arrows pointing to P(n)S(m) | moderate | Arrow mechanisms may have changed |
| | `voice_identity` | weak | Voice signature evidence may have shifted |

**Connection changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Connection added (P(a)S(b) to P(c)S(d)) | `narrative_strategy` | moderate | New connection may reveal arc structure |
| | `thematic_architecture` | moderate | Connection may carry thematic thread |
| | `cross_dimension_entanglements` | moderate | New entanglement possible between connected elements |
| Connection removed | Same targets | moderate | Structural understanding may need revision |

**Earned-ness arrow changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Earned-ness arrow added (P(a) earns P(b)) | `character_revelation` | moderate | Earning mechanism may reveal character values |
| | `admissions_positioning` | moderate | Earned moments affect memorability assessment |
| | `emotional_topography` | moderate | Earning mechanism is part of emotional progression |
| Earned-ness arrow removed | Same targets | moderate | Emotional progression understanding may need revision |

**North Star changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| North Star updated | ALL holistic sections | moderate | North Star reframes how every dimension is interpreted |
| | `cross_dimension_entanglements` | strong | Through-line reinterpretation may invalidate existing entanglements |

**Holistic section changes affect:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Holistic section updated | `cross_dimension_entanglements` | moderate | Section change may create or invalidate entanglements |
| | `admissions_positioning` | weak | Positioning synthesis draws from all holistic sections |

**Conversation insight applied:**

| Mutation | Stale Target | Strength | Reason |
|----------|-------------|----------|--------|
| Conversation insight (reinterpretation) | Affected sentences | strong | Student explicitly corrected understanding |
| | Related holistic sections | moderate | Understanding shift may cascade to holistic level |
| Conversation insight (confirmation) | Affected sentences | — | No staleness — confidence boosted, nothing invalidated |
| Conversation insight (new context) | Related holistic sections | moderate | New information may enrich holistic understanding |

### How the Coordinator Uses the Map

After every mutation, the coordinator:

1. Identifies the `MutationType` from the mutator's return value.
2. Looks up the mutation type in the dependency map.
3. For each `StalenessEffect`, calls `stalenessTracker.markStale()` with the target, strength, and reason.
4. The staleness tracker enforces depth limits: if the target is already stale at equal or greater strength, the new marking is a no-op. If the target is stale at weaker strength, it upgrades.
5. The coordinator never computes "what might be affected" dynamically — it reads the static map. This makes staleness propagation deterministic and testable.

---

## 4. Validation (Two Tiers)

Validation catches internal inconsistencies without blocking mutations. Both tiers return results that are logged and available for review — neither throws exceptions nor prevents writes. They exist to detect bugs in mutators (Tier 1) and prompt quality issues (Tier 2).

### Tier 1 — Quick Validation (after every mutation, <1ms target)

Referential integrity checks. These are fast because they traverse known indices, not content.

**Checks:**
- **Index bounds**: All paragraph/sentence indices in understanding, analysis, connections, voice map, and earned-ness map are within range of the actual essay structure.
- **Connection refs**: Every `connectionRef` ID in every sentence points to an existing entry in `connections.all[]`.
- **Connection endpoints**: Every connection's `from` and `to` indices point to existing paragraphs/sentences.
- **Earned-ness arrows**: Every arrow's source and target point to valid paragraph/sentence locations.
- **Voice shift entries**: Every entry references a valid paragraph boundary.
- **No orphaned refs**: No sentence carries a `connectionRef` to a deleted connection.
- **Index consistency**: Paragraph digests array length matches actual paragraph count. Token counts are non-negative.

### Tier 2 — Full Validation (at checkpoints — after L3, after L3.75, after L3.5)

Semantic coherence checks. These read content and cross-reference between domains. More expensive than Tier 1 but still no LLM calls — these are structural cross-checks.

**Checks:**
- **Voice-emotion alignment**: If the voice map records an "intentional shift at P3," does the emotional topography record an emotional transition near P3? Misalignment is a warning, not an error — the shift could be structural rather than emotional.
- **Earned-ness / connection alignment**: If the earned-ness map claims "P1 earns P4," does the connection graph record a P1-to-P4 link? Missing link means the earned-ness map sees a relationship the connection graph missed (or vice versa) — a signal for the next synthesis pass.
- **Evaluative language in understanding**: Scan understanding fields for evaluative words ("effectively," "weakly," "successfully"). Their presence suggests L3 leaked evaluation into understanding — a contamination signal for prompt tuning.
- **Orphaned connection refs**: Sentences with `connectionRefs` pointing to connections where neither endpoint is that sentence.
- **North Star / holistic coherence**: If the North Star's structural roles map labels P4 as "the fulcrum," does narrative strategy's `turningPoint` agree?
- **Profile Index completeness**: All tags present in sentence/paragraph data are reflected in the index. All connections in `connections.all[]` appear in the `connectionGraph`. No stale digests (paragraph digest text roughly matches current understanding).

### Types

```typescript
interface ValidationResult {
  /** Whether all checks passed */
  valid: boolean;
  /** Individual check results */
  checks: ValidationCheck[];
  /** Summary counts */
  summary: {
    passed: number;
    warnings: number;    // Semantic misalignments (Tier 2)
    errors: number;      // Referential integrity violations (Tier 1)
  };
  /** Timestamp */
  validatedAt: number;
  /** Which tier was run */
  tier: 'quick' | 'full';
}

interface ValidationCheck {
  /** Machine-readable check name */
  name: string;          // 'connection_refs_valid', 'voice_emotion_alignment', 'index_completeness'
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  details?: string;      // Human-readable explanation when failed
  /** Where the issue was found */
  locations?: Array<{ paragraph: number; sentence?: number }>;
}
```

**Error handling philosophy**: Quick validation errors are logged as warnings — they indicate a bug in a mutator that should be investigated but should not block the pipeline. Full validation warnings are logged as informational — they indicate potential prompt quality issues that may self-correct in subsequent layers. Neither tier blocks the pipeline or prevents writes.

---

## 5. Readiness Scoring

Four functions, each returns 0-100. Together they compose into the `ReadinessScores` object that feeds improvement phase detection (`detectImprovementPhase()`). These scores are a heuristic proxy for essay quality — they exist to determine the feedback zoom level, not to be shown to students.

### Types

```typescript
interface ReadinessScores {
  essay: number;          // 0-100: thesis + arc + voice + holistic population
  paragraph: number;      // 0-100: paragraph effectiveness distribution
  sentence: number;       // 0-100: sentence effectiveness + problem-free ratio
  word: number;           // 0-100: word-level weakness absence
}
```

### `essayReadiness(profile: EssayProfile): number`

Thesis + arc + voice + holistic population:

| Component | Points | How Scored |
|-----------|--------|-----------|
| Thesis present and confident | 0-30 | `thesisConfidence >= 0.8` = 30, `>= 0.5` = 20, `>= 0.3` = 10, absent = 0 |
| Arc coherent | 0-25 | Narrative strategy identified (10) + turning point exists (10) + arc momentum not 'stalling' (5) |
| Voice map populated with stability regions | 0-20 | Voice signature present (10) + at least one stability region identified (5) + intentionality assessed for all shifts (5) |
| Holistic sections populated | 0-25 | 3-4 points per non-empty holistic section (7 sections, some worth more) |
| Critical essay-level weaknesses | -12 each, max -25 | Red flags in admissions positioning, no coherent thesis after L3, voice entirely inconsistent |

### `paragraphReadiness(profile: EssayProfile): number`

Paragraph effectiveness distribution:

- % of paragraphs with `effectiveness >= 60` maps to 0-70 points (linear)
- Bonus: % of paragraphs with `effectiveness >= 80` maps to 0-30 additional points
- Penalty: each paragraph with `effectiveness < 40` subtracts 5 points (floor at 0)

### `sentenceReadiness(profile: EssayProfile): number`

Sentence health:

- Problem-free ratio (sentences where `isProblem = false`) contributes 70% weight
- Average sentence effectiveness contributes 30% weight
- Formula: `(problemFreeRatio * 70) + (avgEffectiveness / 100 * 30)`

### `wordReadiness(profile: EssayProfile): number`

Word-level weakness absence:

- % of sentences with no word-level weaknesses (no entries in `weaknesses` that reference word/phrase-level issues) x 100

### Calibration Targets

These are starting estimates. The first 20 real essays through the pipeline will calibrate whether the boundaries between Foundation/Architecture/Craft/Polish/Distinction land where they should.

| Essay Quality | Essay | Paragraph | Sentence | Word | Expected Phase |
|--------------|-------|-----------|----------|------|----------------|
| Strong essay, first analysis | ~80 | ~75 | ~70 | ~60 | Craft or Polish |
| Average essay | ~60 | ~50 | ~50 | ~45 | Architecture |
| Weak essay | ~25 | ~40 | ~35 | ~30 | Foundation |
| Near-final polish | ~90 | ~85 | ~80 | ~75 | Polish or Distinction |

---

## 6. Circuit Breaker (review S10)

If the pipeline crashes repeatedly at the same point — malformed essay text causing unparseable Sonnet output, a sentence that consistently produces invalid JSON, a connection that breaks referential integrity on every retry — the system must fail gracefully rather than loop forever.

### Rules

1. **Max 3 retries per checkpoint position.** Each retry restores from the last checkpoint and re-runs the failed step.
2. **After 3 failures at the same point**, the coordinator marks the analysis as `FAILED` with structured error details.
3. **Alert the student**: "We're having trouble analyzing this section of your essay. Our team has been notified."
4. **The walk continues.** If the walk crashed on paragraph 4, paragraphs 1-3's understanding is complete and usable. P5 can still proceed — it will have a gap in P4's understanding, but the walk output for P5 will still add value. P4 keeps L1/L2 understanding with a `walkSkipped: true` flag.
5. **Failed paragraphs preserve what exists.** L1 first impressions and L2 structural cartography are already stored. The failure is only in L3 deep understanding (or L3.5 analysis). The paragraph is not blank — it has shallow understanding.
6. **Manual retry available** after a cooldown period (configurable, default 5 minutes). The cooldown prevents automated retry loops and gives transient API issues time to resolve.

### Types

```typescript
interface CircuitBreakerState {
  /** Number of retries at current checkpoint position */
  retryCount: number;
  /** Maximum retries before tripping */
  maxRetries: 3;
  /** The checkpoint position where failures are occurring */
  failurePoint: string;         // e.g., 'l3_walk_paragraph_4', 'l3_5_analysis_paragraph_2'
  /** Error details from each attempt */
  attempts: Array<{
    timestamp: number;
    error: string;
    /** What the LLM returned (if anything) — for debugging */
    rawOutput?: string;
  }>;
  /** Whether the circuit breaker has tripped */
  tripped: boolean;
  /** When the cooldown expires (null if not tripped) */
  cooldownExpiresAt: number | null;
}

/** Marker on paragraphs that failed during the L3 walk */
interface WalkSkippedMarker {
  /** The paragraph was not deeply understood due to pipeline failure */
  walkSkipped: true;
  /** Which layer failed */
  failedAt: 'l3_understanding' | 'l3_5_analysis';
  /** Error summary */
  errorSummary: string;
  /** Timestamp of failure */
  failedAt_timestamp: number;
  /** Whether manual retry has been requested */
  retryRequested: boolean;
}
```

**Circuit breaker state is persisted with the checkpoint** so that a process restart does not reset the retry count. If the orchestrator restarts and loads a checkpoint with `retryCount: 2`, the next failure trips the breaker rather than starting a fresh count.

---

## 7. Light-Touch Update Pathway

When the student makes edits through the Conversational Edit Workshop (Pathway 1), many profile adjustments are mechanical and do not require LLM intelligence or the full mutation pipeline. These "light-touch" updates bypass the profile-level optimistic lock entirely, using per-sentence row-level updates instead (review M8). This prevents two browser tabs editing different paragraphs from conflicting unnecessarily.

### What Qualifies as Light-Touch

Light-touch updates are strictly mechanical. They never involve analytical judgment.

| Update Type | What Happens | Why No LLM Needed |
|-------------|-------------|-------------------|
| **Text reference updates** | When a sentence's text changes, update the stored `text` field on the sentence entry | The new text is provided by the student; the system is recording, not interpreting |
| **Structural bookkeeping** | Sentence counts per paragraph, sentence index boundaries, paragraph boundary markers | These are derived from the new essay text structure, not from understanding |
| **Index remapping** | When paragraphs are inserted/deleted/reordered, remap all paragraph and sentence indices in understanding, analysis, connections, voice map, earned-ness arrows | Mechanical index shift — old P3 becomes new P4, all references updated |
| **Staleness marker application** | Mark affected sentences, paragraphs, and holistic sections as stale per the dependency map | Staleness propagation is deterministic from the dependency map |
| **Inferred intent updates (from conversation)** | When the student explicitly states intent in conversation ("I meant this sentence to be ironic"), update `inferredIntents` | The student is the authority on their own intent — this is recording, not inferring |

### What Does NOT Qualify as Light-Touch

Any update that involves understanding or evaluation must go through the full coordinator with the optimistic write lock:

- New sentence understanding (what does this sentence do in the essay?)
- Analysis updates (how well does this sentence work?)
- Connection creation or removal (requires understanding of what connects and why)
- Voice map changes (requires reading the actual voice characteristics)
- Earned-ness arrow changes (requires understanding narrative mechanisms)
- Holistic section updates (requires synthesis across the full profile)

### Types

```typescript
interface LightTouchUpdate {
  /** Which type of light-touch update */
  type: 'text_reference' | 'structural_bookkeeping' | 'index_remap' | 'staleness_application' | 'inferred_intent';

  /** For text_reference: the sentences whose text changed */
  textUpdates?: Array<{
    paragraph: number;
    sentence: number;
    newText: string;
  }>;

  /** For structural_bookkeeping: updated paragraph/sentence counts */
  structuralUpdates?: {
    paragraphCount: number;
    sentenceCounts: number[];  // sentenceCounts[paragraphIdx]
  };

  /** For index_remap: the mapping from old indices to new indices */
  indexRemap?: {
    paragraphMap: Map<number, number>;    // oldIdx -> newIdx
    /** Paragraphs that were inserted (have no old index) */
    insertedParagraphs: number[];
    /** Paragraphs that were deleted (have no new index) */
    deletedParagraphs: number[];
  };

  /** For staleness_application: explicit staleness markers to apply */
  stalenessMarkers?: Array<{
    target: StalenessTarget;
    strength: StalenessStrength;
    reason: string;
  }>;

  /** For inferred_intent: student-stated intent updates */
  intentUpdates?: Array<{
    paragraph: number;
    sentence: number;
    /** The student's stated intent — replaces inferredIntents array */
    intents: ObservationEntry[];
    /** Source: the conversation turn where the student stated this */
    source: string;
  }>;
}
```

### Concurrency Model

Light-touch updates use per-sentence row-level updates on `essay_sentence_analyses` in the database. They do NOT touch `essay_profiles.write_version` and therefore do NOT conflict with concurrent coaching or analysis operations. Only the Profile Manager's analytical mutations (understanding/analysis updates that change the profile index) use the optimistic lock.

This means:
- Two browser tabs editing different paragraphs through Pathway 1 will not conflict.
- A coaching conversation (L6) can proceed while light-touch updates are being applied to recently edited sentences.
- If a re-analysis (comprehensive or focused) starts, it acquires the optimistic lock. Light-touch updates continue on individual sentences without blocking. If the re-analysis later touches those same sentences, the re-analysis output supersedes the light-touch updates.

### Pre-Mutation Snapshots for Escalation

When the Edit Understanding pipeline determines that a focused (light-touch) analysis is appropriate, the coordinator snapshots the affected fields before mutation. If the focused analysis later discovers the edit's blast radius is larger than expected and escalates to comprehensive, the snapshot enables cheap rollback.

```typescript
interface PreMutationSnapshot {
  /** Which fields were snapshotted */
  scope: Array<{
    paragraph: number;
    sentence?: number;
    fields: string[];           // ['observedFunctions', 'inferredIntents', ...]
  }>;
  /** Deep copies of the original values */
  values: Map<string, unknown>;   // key = 'p2.s3.observedFunctions', value = original array
  /** Timestamp for staleness comparison */
  takenAt: number;
}
```

**When snapshots are NOT taken**: During the initial pipeline (L1 through L5), there is no escalation scenario — the layers run in sequence and each sees the complete prior state. Snapshots only apply to post-initial-analysis edits through the Edit Understanding pipeline.

---

## 8. Profile Manager API

The complete public interface. Each method maps to exactly one layer or pathway. Internal routing to domain mutators is an implementation detail — callers never interact with mutators directly.

```typescript
class EssayProfileCoordinator {

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a coordinator for a new essay (wraps createInitialProfile).
   * Used by the orchestrator at pipeline start.
   */
  static createNew(input: {
    essayText: string;
    paragraphTexts: string[];
    sentenceTexts: string[][];
    metadata: {
      essayType: 'common_app' | 'supplement' | 'piq';
      wordCount: number;
      promptText?: string;
    };
    checkpointStore: CheckpointStore;
  }): EssayProfileCoordinator;

  /**
   * Create a coordinator from a persisted profile (resume from checkpoint).
   * Used by the orchestrator when resuming a pipeline or starting a new session.
   */
  static fromCheckpoint(
    profile: EssayProfile,
    checkpointStore: CheckpointStore,
  ): EssayProfileCoordinator;

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER-SPECIFIC MUTATION METHODS
  // Each layer calls exactly ONE method. The coordinator routes internally.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * L1: Seed the profile from Haiku first impressions (parallel per-paragraph).
   * Produces: ParagraphFirstImpression[] from L1 Haiku calls.
   * Mutators: SentenceMutator (sentence stubs), ParagraphMutator (initial roles).
   */
  applyFirstImpressions(impressions: ParagraphFirstImpression[]): void;

  /**
   * L2: Apply structural cartography from Sonnet bird's-eye analysis.
   * Produces: StructuralCartography from L2 Sonnet call.
   * Mutators: ParagraphMutator (structural roles, supersession), HolisticMutator (narrative strategy seed).
   */
  applyStructuralCartography(cartography: StructuralCartography): void;

  /**
   * L2.5: Apply connection scout leads from Haiku parallel scan.
   * Produces: ConnectionScout from L2.5 Haiku call.
   * Mutators: ConnectionMutator (provisional connections), SentenceMutator (scout-tag refs).
   */
  applyScoutLeads(scout: ConnectionScout): void;

  /**
   * L3: Apply one paragraph's understanding walk output.
   * Produces: UnderstandingWalkOutput from L3 Sonnet call (one per paragraph, sequential).
   * Mutators: SentenceMutator (understanding + back-propagation), ConnectionMutator (new connections),
   *           HolisticMutator (incremental holistic evolution).
   * Triggers: Staleness propagation for back-propagated sentences. Index recomputed.
   */
  applyUnderstandingWalkStep(output: UnderstandingWalkOutput): void;

  /**
   * L3.75: Apply holistic synthesis — replaces ALL 7+1 holistic sections.
   * Produces: HolisticSynthesisOutput from L3.75 Sonnet call.
   * Mutators: HolisticMutator (full supersession), VoiceMapMutator (voice map),
   *           EarnednessMutator (earned-ness arrow network).
   * Triggers: Checkpoint (after_l3_75). Index section token counts recomputed.
   */
  applyHolisticSynthesis(synthesis: HolisticSynthesisOutput): void;

  /**
   * L3.5: Apply one paragraph's analysis pass output.
   * Produces: AnalysisPassOutput from L3.5 Sonnet call (parallel per-paragraph).
   * Mutators: SentenceMutator (analysis per sentence), ParagraphMutator (effectiveness),
   *           HolisticMutator (craft assessment strength signatures).
   * Triggers: Index hasStrengths/hasWeaknesses flags updated. Readiness recomputed
   *           after all paragraphs complete. Checkpoint (after_l3_5).
   */
  applyAnalysisPassResult(result: AnalysisPassOutput): void;

  /**
   * L4: Apply North Star crystallization.
   * Produces: NorthStarOutput from L4 Sonnet call.
   * Mutators: NorthStarMutator (five dimensions: through-line map, structural roles,
   *           trajectory, distinctiveness signature, intent bridge).
   * Triggers: Checkpoint (after_l4). Index finalized.
   */
  applyNorthStar(northStar: NorthStarOutput): void;

  /**
   * L6: Apply a conversation insight from coaching interaction.
   * Produces: ConversationInsight from L6 insight extraction.
   * Mutators: InsightMutator (always). Conditionally: SentenceMutator (confirmation/reinterpretation),
   *           ConnectionMutator (new context), VoiceMapMutator (preference/correction).
   * Triggers: Staleness propagated per insight category.
   */
  applyConversationInsight(insight: ConversationInsight): void;

  /**
   * Edit pipeline: Apply light-touch profile updates from Pathway 1 editing.
   * Produces: LightTouchUpdate from the Edit Understanding pipeline's mechanical processing.
   * Mutators: SentenceMutator (text refs, intent), ParagraphMutator (structural bookkeeping).
   * NOTE: Uses per-sentence row-level updates. Does NOT acquire the profile-level optimistic lock.
   * See Section 7 for full specification.
   */
  applyLightTouchUpdate(update: LightTouchUpdate): void;

  /**
   * Edit pipeline: Apply edit understanding from re-analysis (comprehensive or focused).
   * Produces: EditUnderstandingOutput from the Edit Understanding pipeline's Sonnet call.
   * Mutators: Routes to appropriate mutators based on the edit's scope and type.
   * NOTE: Takes pre-mutation snapshot for potential escalation rollback.
   *        Uses the profile-level optimistic lock.
   */
  applyEditUnderstanding(output: EditUnderstandingOutput): void;

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS (read-only — no mutations, no side effects)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current profile as a read-only snapshot.
   * Used by the Profile Router for rendering into LLM prompts.
   */
  getProfile(): Readonly<EssayProfile>;

  /**
   * Get current staleness state.
   * Used by the Profile Router to decide what to include in LLM calls,
   * and by the Edit Understanding pipeline for mode selection.
   */
  getStalenessState(): StalenessSnapshot;

  /**
   * Get full staleness report with domain breakdown.
   * Used by the UI to show staleness indicators and re-analysis suggestions.
   */
  getStalenessReport(): StalenessReport;

  /**
   * Compute readiness scores across all four granularity levels.
   * Used by detectImprovementPhase() to determine feedback zoom level.
   */
  computeReadiness(): ReadinessScores;

  /**
   * Run quick validation — referential integrity checks only.
   * Target: <1ms. Run after every mutation.
   */
  validateQuick(): ValidationResult;

  /**
   * Run full validation — semantic coherence checks.
   * More expensive. Run at checkpoints (after L3, L3.75, L3.5).
   */
  validateFull(): ValidationResult;

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Checkpoint to durable storage via the CheckpointStore callback.
   * Called at pipeline boundaries. Runs full validation. Persists circuit breaker state.
   */
  checkpoint(reason: CheckpointReason): Promise<void>;
}
```

### Checkpoint Types

```typescript
interface CheckpointStore {
  /** Save the current profile state. Called by the coordinator at pipeline boundaries. */
  save(profile: EssayProfile, metadata: CheckpointMetadata): Promise<void>;

  /** Load a previously saved profile. Called by the orchestrator before resuming. */
  load(essayId: string): Promise<EssayProfile | null>;
}

interface CheckpointMetadata {
  essayId: string;
  /** Why this checkpoint was taken */
  reason: CheckpointReason;
  /** Which pipeline layer just completed */
  completedLayer: string;
  /** Write version for optimistic concurrency */
  writeVersion: number;
  /** Current staleness state */
  stalenessSnapshot: StalenessSnapshot;
  /** Validation result from quick validation */
  validationResult: ValidationResult;
  /** Cost accumulated so far */
  costSoFar: number;
}

type CheckpointReason =
  | 'after_l1_l2'          // L1 + L2 complete — structural foundation established
  | 'after_l3'             // L3 understanding walk complete — deep understanding done
  | 'after_l3_75'          // L3.75 holistic synthesis complete — full understanding
  | 'after_l3_5'           // L3.5 analysis pass complete — evaluation done
  | 'after_l4'             // L4 North Star crystallization complete
  | 'after_l5'             // L5 feedback generation complete — full pipeline done
  | 'conversation_save'    // Periodic save during L6 conversation
  | 'before_reanalysis'    // Snapshot before re-analysis (rollback point)
  | 'circuit_breaker';     // Save before marking analysis as failed
```

---

## Profile Manager Boundary (CRITICAL)

This boundary must be maintained strictly as the system grows. The Profile Manager is the most-touched module in the system — every layer interacts with it. If synthesis logic, rendering logic, or persistence logic creeps in, the module becomes untestable and unmaintainable.

**The Profile Manager OWNS:**

| Responsibility | What This Means |
|---------------|-----------------|
| **Mutations** | Every write to the EssayProfile goes through the coordinator. No layer modifies the profile directly. |
| **Staleness tracking** | Cross-domain staleness propagation via the declared dependency map. Marks sections as stale, clears staleness after refresh. |
| **Referential integrity** | Connection refs point to existing connections. Earned-ness arrows point to valid locations. Voice shifts reference valid paragraphs. Sentence indices are in range. |
| **Index recomputation** | ProfileIndex always reflects current state. Cheap fields after every mutation, expensive fields at checkpoints. |
| **Checkpointing** | Calls the CheckpointStore callback at pipeline boundaries. Manages circuit breaker state. |
| **Readiness scoring** | Four readiness functions that feed improvement phase detection. |
| **Pre-mutation snapshots** | For focused-mode rollback when escalation is needed. |

**The Profile Manager does NOT own:**

| Not Its Job | Who Owns It | Why |
|-------------|-------------|-----|
| **Synthesis** (L3.75) | Holistic synthesis layer | The manager stores synthesis results, but the LLM decides what the holistic sections say |
| **Evaluation** (L3.5) | Analysis pass layer | The manager stores analysis results, but the LLM decides effectiveness scores and strengths/weaknesses |
| **Crystallization** (L4) | North Star crystallization layer | The manager stores the North Star, but the LLM produces it |
| **Storage / persistence** | Pipeline orchestrator | The manager calls a CheckpointStore callback. It does not know about Supabase, tables, or SQL. |
| **Rendering** | Profile Router | The manager provides the profile data. The router decides how to render it for LLM prompts. |
| **Mode selection** | Edit Understanding pipeline | The manager provides staleness state and readiness scores. The pipeline decides comprehensive vs focused. |
| **Feedback generation** | L5 / L6 layers | Feedback is ephemeral. The manager never stores it. |

---

## File Organization

```
src/services/essayIntelligence/profile/
├── coordinator.ts              // EssayProfileCoordinator class (~300 lines)
├── factory.ts                  // createInitialProfile() (~80 lines)
├── staleness.ts                // StalenessTracker + StalenessDependencyMap (~200 lines)
├── validation.ts               // Quick + full validation (~250 lines)
├── readiness.ts                // Four readiness scoring functions (~150 lines)
├── circuitBreaker.ts           // Circuit breaker state management (~80 lines)
├── types.ts                    // All Profile Manager types (~250 lines)
└── mutators/
    ├── sentenceMutator.ts      // Sentence understanding + analysis mutations (~200 lines)
    ├── paragraphMutator.ts     // Paragraph-level mutations (~100 lines)
    ├── holisticMutator.ts      // All 7+1 holistic sections (~180 lines)
    ├── connectionMutator.ts    // Connection CRUD + referential integrity (~150 lines)
    ├── voiceMapMutator.ts      // Voice shift entries + intentionality (~120 lines)
    ├── earnednessMutator.ts    // Earned-ness arrows + backward traces (~130 lines)
    ├── northStarMutator.ts     // North Star five dimensions (~80 lines)
    └── insightMutator.ts       // Conversation insights + supersession (~120 lines)
```

Total: ~2090 lines across 15 files. The coordinator is the largest single file but stays under 300 lines because domain logic lives in the mutators. Each mutator is focused enough to be fully comprehensible in a single reading.
