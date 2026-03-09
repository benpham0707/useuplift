# Key Design Decisions, Progressive Cost Curve & Implementation Order (Updated)

> Updates PLAN.md Key Design Decisions (lines ~2706-2741), Progressive Cost Curve (lines ~2610-2663), and Implementation Order (lines ~2666-2703).
> Incorporates all new systems: North Star, voice map, earned-ness map, two-pathway edit handling, split-table DB, Profile Manager redesign.

---

## Key Design Decisions

### Foundational Principles

**1. No heuristics for judgment.** All quality evaluation goes through LLM calls. Haiku for first impressions, classification, and trivial pre-filtering. Sonnet for deep understanding, judgment, synthesis, and crystallization. Deterministic code only for factual text parsing (paragraph splitting, word counting, sentence alignment, diff computation). The single exception: Haiku as a binary pre-filter in the Edit Understanding pipeline ("trivial mechanical fix or real content change?") — and even that errs toward escalation to Sonnet.

**2. LLM output IS the profile data.** L3's understanding output and L3.5's analysis output use the profile's own data structures. There is no "analyze then translate to profile" step — the LLM writes directly into profile format. The Profile Manager's coordinator dispatches to domain mutators that apply the output (supersessions, connection refs, index updates) without transformation. Two cognitive acts (understanding + analysis), two outputs, each stored directly. ZERO translation redundancy.

**3. Multi-resolution mapping.** The profile maps the essay at every level — holistic (8 sections + North Star), paragraph, sentence, word/phrase. Every sentence's purpose is understood. Significant word choices are mapped. Voice is mapped as a spatial field across the essay, not a single score. Emotional moments are traced backward through arrow networks, not flagged with booleans.

**4. 3-way intent distinction.** Every sentence separates observed function (IS doing), inferred intent (TRYING to do), and prescriptive role (SHOULD be doing). Prevents coaching from imposing wrong intent. When conversation reveals student's actual intent, `inferredIntent` is confirmed or corrected — the 3-way split makes this surgical rather than destructive.

**5. Bidirectional profile updates.** When P3's analysis reveals P1's opening is the central metaphor, P1's profile is updated immediately via back-propagation. No separate retrospective pass needed. The SentenceMutator handles back-propagation for sentence-level changes; the coordinator propagates staleness for cross-domain effects.

**6. Profile Index + selective injection.** A compact (~200-300 token) index is always loaded. Full profile sections loaded only when relevant. Tags enable fast semantic routing. Every API call — not just Layer 3 — uses this pattern. The 19-table database architecture makes selective loading natural: load voice data without loading connections, load one paragraph without loading all.

**7. Profile grows deeper, never repeats.** Each layer adds NEW understanding, references existing profile entries, never duplicates. L3 doesn't re-state what L1 already observed — it deepens and contextualizes it. Supersession replaces entire arrays, not appends. Single source of truth for connections (centralized store with ID refs).

### Architectural Decisions

**8. Sequential walk is non-negotiable.** Cross-paragraph connections, voice drifts, thematic thread tracking — these are inherently relational and only discovered through sequential reading with compounding context. L3's paragraph-by-paragraph walk with back-propagation captures emergent patterns that parallel analysis would miss entirely.

**9. Both pipelines coexist.** Old annotation pipeline = "fast mode." Essay Intelligence System = "deep mode." The student chooses or the system auto-selects based on essay investment level. No forced migration.

**10. Split-table database architecture replaces monolithic JSONB.** 19 tables across 6 domain modules, not a single JSONB document. One entity per table. JSONB for variable-structure content (sentence observations, holistic sections). Scalar columns for queryable fields (effectiveness scores, staleness flags, confidence levels). The EssayProfile is assembled from multiple tables by the Profile Router, which decides what to load per task. A coaching turn about voice loads the voice section and tagged sentences. A full L5 pass loads everything. Write-frequency drives table boundaries — high-frequency updates (conversation insights, staleness flags) never contend with low-frequency updates (holistic sections, North Star). See `docs/plan-sections/05-database-architecture.md` for full specification.

**11. No heuristic fallbacks.** If Sonnet/Haiku fails, retry with exponential backoff. If it keeps failing, checkpoint and trip the circuit breaker (max 3 retries per checkpoint position). Never substitute heuristic guesses for LLM judgment. Partial results from completed layers are preserved and usable.

**12. Anti-repetition is structural, not instructional.** Repetition is prevented by three structural defenses — separate API calls (Understanding/Analysis/Feedback can't cross-contaminate), supersession model (entire arrays REPLACED on update, not appended), and single source of truth for connections (centralized store with ID refs). The LLM receives current profile state via Profile Router, produces its current understanding in the profile's own data format, and the Profile Manager applies supersessions. No deduplication logic needed.

### New Concept Decisions

**13. Voice is a map, not a number.** The old `consistencyScore` was a scalar that collapsed a rich spatial phenomenon into one number. The VoiceMap is a 5-dimension spatial field: register, vocabulary fingerprint, sentence rhythm, perspective/distance, and tonal disposition (humor, irony, earnestness, irreverence, solemnity). It maps stability regions and shift points across the essay. Each shift carries an intentionality assessment with confidence (0-1). Below 0.6 confidence, the system presents the shift as a question to the student, not a conclusion. Code-switching events (language, trigger, cultural function) are first-class entries, not anomalies. The VoiceMapMutator owns all voice mutations; the coordinator propagates staleness to emotional topography and thematic architecture when voice data changes.

**14. Earned-ness is a backward-tracing arrow network, not a boolean flag.** The old `isEarned` was a boolean on emotional peaks. The EarnednessMap traces backward from every significant moment — emotional peaks, intellectual realizations, humorous payoffs, subversive turns — to identify 7 mechanism types that earn it: sensory grounding, emotional setup, stakes establishment, character revelation, thematic preparation, intellectual scaffolding, and comedic/subversive setup. Each arrow connects a source passage to the moment it earns, with a typed mechanism and a contribution description. Sparse arrows = unearned (the diagnosis IS the map structure). Dense arrows = earned. No threshold score, no boolean — the arrow density itself communicates earned-ness. The EarnednessMutator owns arrow creation, removal, and typing; the coordinator propagates staleness to character revelation and admissions positioning when arrows change.

**15. North Star is architecture of meaning, not a summary.** L4 produces the North Star — a 5-dimension crystallization that captures what makes this essay THIS essay and no other. Through-Line Map (the central element's journey: surface, submerge, transform, resolve), Structural Roles Map (what each paragraph IS in the architecture — the fulcrum, the setup, the payoff), Trajectory & Potential (where the essay could go — MULTIPLE plausible paths, not a single prescription), Distinctiveness Signature (what makes this essay non-interchangeable, synthesized from cross-dimension entanglements), and Intent Bridge (student's understanding alongside system's). Scaled by essay type: supplements get 2 dimensions, PIQs get 3, personal statements get all 5. The North Star replaces EssayDNA — it's not a fingerprint but an interpretive map that guides every subsequent coaching interaction.

**16. Cross-dimension entanglements are the 8th holistic section.** When P2S3's voice shift from concrete to reflective IS the thematic pivot from transaction to value, that intersection lives in the entanglements section — not inside voice identity, not inside thematic architecture. Entanglements are the evidence layer: specific, located (paragraph/sentence references), with named dimensions that intersect. L4's distinctiveness signature synthesizes across entanglements to produce the global interpretive reading. The HolisticMutator owns all 7 standard sections plus entanglements; they share a single supersession boundary at L3.75.

**17. Two-pathway edit handling.** Student edits flow through the Edit Understanding Pipeline (Haiku pre-filter + Sonnet understanding/mapping/scoping) which produces an EditUnderstanding. Then two pathways diverge based on context. **Pathway 1 (Conversational Edit Workshop)**: real-time companion for students actively editing. The workshop discusses the change, explores implications, teaches — without re-analyzing. Profile updates are "light-touch" (text references, staleness markers). Cheap (~$0.03-0.08 per session). **Pathway 2 (Version-Based Re-Analysis)**: deliberate re-analysis triggered by the student or by staleness accumulation. Builds a 4-section re-analysis brief (version summary, accumulated changes, conversation insights, recommended scope) that enriches the re-analysis prompt with everything learned since the last analysis. More expensive (~$0.12-0.30) but 20-40% cheaper than naive re-analysis because conversation context narrows scope. The two pathways are not mutually exclusive — a workshop session can conclude with a triggered re-analysis.

**18. Edit understanding uses Sonnet, not Haiku.** The old PLAN.md asked Haiku to predict edit impact — a shallow classifier disconnected from real understanding. The new pipeline uses Haiku ONLY as a trivial pre-filter (binary: "mechanical fix or real change?"). ALL interpretive work — significance assessment, change type classification, apparent purpose inference, connection impact mapping, scope recommendation — happens in a single integrated Sonnet call that receives the diff alongside profile context. The pipeline does not predict impact; it UNDERSTANDS the change, and the scope follows from that understanding. Cost: ~$0.02-0.05 per meaningful edit, well justified by the quality difference.

**19. Profile Manager: thin coordinator + 8 domain mutators.** A monolithic Profile Manager would become a god object within a month. The architecture splits into EssayProfileCoordinator (owns the write lock, dispatches mutations, manages cross-domain staleness, triggers index recomputation, handles checkpointing) and 8 focused domain mutators (SentenceMutator, ParagraphMutator, HolisticMutator, ConnectionMutator, VoiceMapMutator, EarnednessMutator, NorthStarMutator, InsightMutator). Each layer calls exactly ONE coordinator method. The coordinator routes internally to the relevant mutators. Each mutator owns its domain's internal referential integrity. The coordinator owns cross-domain staleness propagation via a declared dependency map. Every piece is independently testable — give a mutator a profile, call a method, assert the result. No LLM calls, no database, no rendering.

**20. Staleness propagates with depth limits.** In well-connected essays, unbounded staleness cascation can flag the majority of the profile stale after a few edits — defeating focused mode. Three tiers with bounded propagation: Depth 0 (the changed element itself) = **strong** staleness, must be refreshed before use; Depth 1 (directly connected elements) = **moderate**, included in next relevant LLM call; Depth 2 (two-hop connections) = **weak**, logged but NOT propagated further. Re-analysis suggestions trigger on strong-staleness count (3+ sentences), not total staleness. Moderate staleness accumulates silently and is picked up naturally by the next L3.75 or L3.5 pass.

**21. Conversation insights are durable knowledge, not chat history.** 8 primary categories (intent confirmation/reinterpretation, contextual revelation, preference, emotional significance, audience awareness, structural intention, creative aspiration, correction). Each insight has secondary attributes, 4 durability levels (permanent/stable/contextual/tentative), and partial supersession (a new insight about a sentence's intent supersedes the old one for that sentence, but insights about different sentences coexist). The InsightMutator handles categorization, supersession, and durability management. Insights enrich the re-analysis brief (Pathway 2) and the coaching context (L6), creating a flywheel where conversation makes analysis cheaper and more accurate.

**22. Version tracking accumulates changes between analyses.** Each edit produces a VersionRecord: the changed text, the EditUnderstanding output, conversation insights gathered during the editing session, and an intent annotation. Between two full analyses, the version tracker accumulates these records into a chronological narrative of what changed and why. The Re-Analysis Brief Assembler consumes this accumulated history to build a focused, context-rich brief that tells the re-analysis LLM exactly what to pay attention to — enabling 20-40% cost reduction compared to naive comprehensive re-analysis.

### System Convergence Decisions

**23. Progressive Precision — feedback zooms, analysis doesn't.** Understanding and Analysis ALWAYS evaluate everything at every level. The Improvement Phase determines what FEEDBACK surfaces. This means phase transitions are free — no re-analysis needed when the phase shifts, because the deeper-level analysis is already computed. The zoom is a downstream filter on existing analysis. Five phases: Foundation, Architecture, Craft, Polish, Distinction.

**24. Focused mode is not cheaper comprehensive — it's a different lens.** When the profile is deep and the edit is small, focused analysis produces HIGHER quality results than comprehensive re-analysis. The LLM concentrates 100% on the change instead of spreading across the entire paragraph. Existing understanding is leveraged as context, not rebuilt. The escalation ladder catches edge cases where small changes have outsized ripple effects. Pre-mutation snapshots enable cheap rollback when escalation is needed.

**25. The system converges through the interaction of Progressive Precision x Analysis Modes x Two-Pathway Edit Handling.** Each editing round is simultaneously more surgical (focused mode = narrower analytical aperture), more precise (progressive precision = feedback zoomed to current level), and more informed (conversation insights from Pathway 1 enrich Pathway 2 re-analysis). The cost curve reflects this triple convergence: Round 1 ~$0.75 (full pipeline, no prior knowledge) to Round 5 ~$0.03 (focused, zoomed, informed). The 20-40% cost reduction from conversation context is the payoff for the two-pathway architecture — what the student tells the system in Pathway 1 directly reduces the work needed in Pathway 2.

---

## Progressive Cost Curve

### Per-Event Costs

| Event | Analysis Mode | Cost | Time |
|-------|--------------|------|------|
| First full analysis (L1-L2-L2.5-L3-L3.75-L3.5-L4-L5) | Comprehensive | ~$0.52-1.00 | 30-45s |
| Edit understanding (per meaningful edit) | Sonnet understanding | ~$0.02-0.05 | 1-3s |
| Conversational edit workshop session (Pathway 1) | Real-time companion | ~$0.03-0.08 | — |
| Version-based re-analysis with brief (Pathway 2) | Comprehensive (enriched) | ~$0.12-0.30 | 15-25s |
| Structural edit re-analysis (insert/delete/reorder) | Comprehensive | ~$0.30-0.50 | 20-30s |
| Multiple sentence focused re-analysis | Focused | ~$0.08-0.15 | 8-12s |
| Single sentence focused re-analysis | Focused | ~$0.04-0.08 | 3-5s |
| Word-level focused re-analysis | Focused | ~$0.02-0.04 | 2-3s |
| Conversation turn (L6 coaching) | — | ~$0.01-0.03 | 1-3s |

**Key cost insight — Pathway 2 vs naive re-analysis**: A version-based re-analysis (Pathway 2) costs ~$0.12-0.30 compared to ~$0.30-0.50 for a naive structural re-analysis. The 20-40% savings come from three sources: (1) the re-analysis brief narrows scope based on accumulated EditUnderstandings, (2) conversation insights from Pathway 1 resolve ambiguities the LLM would otherwise spend tokens exploring, and (3) the version tracker identifies which profile sections need updating vs which are still valid. The brief is ~150-300 tokens of focused context that saves ~500-1000 tokens of exploratory analysis.

### The Acceleration Curve (typical editing session)

```
Round 1: Comprehensive. Full pipeline. No prior knowledge.
  Mode: Comprehensive | Phase: Foundation
  Cost: ~$0.52-1.00 | Time: 30-45s                          ████████████████████

Round 2: Student edits P3-P4 while chatting with workshop.
  Pathway 1: Conversational workshop discusses changes       ~$0.05 ██
  + Version-based re-analysis with brief (Pathway 2)
  Mode: Comprehensive (enriched) | Phase: Architecture
  Cost: ~$0.15-0.25 | Time: 15-25s                          ██████████
  Workshop context saved 20-40% vs naive re-analysis.

Round 3: Student rewrites P2S3-S5, improves P4S2.
  Pathway 1: Quick workshop conversation                     ~$0.03 █
  + Focused re-analysis (sentence-level)
  Mode: Focused | Phase: Craft
  Cost: ~$0.08-0.15 | Time: 8-12s                           ████████

Round 4: Student changes 3 words across P2-P3.
  Edit understanding classifies as low-significance
  Mode: Focused (word-level) | Phase: Polish
  Cost: ~$0.03-0.06 | Time: 3-5s                            ███

Round 5: Student tweaks P4S2 phrasing.
  Mode: Focused (micro) | Phase: Distinction
  Cost: ~$0.02-0.04 | Time: 2-3s                            ██

  + 10 coaching turns (L6) across session:                   ~$0.10-0.20
```

### Cumulative Session Cost

| After | Cumulative Cost | Notes |
|-------|----------------|-------|
| Round 1 | ~$0.52-1.00 | Full deep understanding built |
| Round 2 | ~$0.72-1.30 | Workshop conversation + enriched re-analysis (not naive) |
| Round 3 | ~$0.83-1.48 | Sentence-level craft improved, conversation context accumulating |
| Round 4 | ~$0.86-1.54 | Word-level polish, focused mode at near-minimum cost |
| Round 5 + coaching | ~$0.98-1.78 | Essay near-final, total well under $2 ceiling |

Well under the $2 ceiling per essay. The acceleration is dramatic: Round 1 costs ~$0.75 average, Round 5 costs ~$0.03 average — **a 25x reduction**. This comes from three compounding effects:

1. **Focused mode** — the analytical aperture narrows as the profile deepens, so later rounds examine fewer sentences with richer context.
2. **Progressive precision** — feedback zooms to the student's current phase, so the system does less work generating and filtering feedback.
3. **Conversation enrichment** — what the student tells the Pathway 1 workshop directly reduces the work Pathway 2 re-analysis needs. By Round 3-4, the re-analysis brief contains enough conversation context that the LLM can skip exploratory analysis and focus on confirmed changes.

The net effect of the two-pathway architecture: Rounds 2-3 are ~20-40% cheaper than the old design (which ran naive comprehensive re-analysis without conversation context). Rounds 4-5 were already cheap via focused mode. The savings concentrate where the old design was most wasteful — mid-session re-analysis where the student has been actively discussing their changes.

---

## Implementation Order

### Wave A: Type Foundation (Phase 1A-1E groundwork)

The entire system's type contracts come first. Every subsequent wave depends on these types being defined, reviewed, and stable. No implementation code until the types compile cleanly.

1. **Core profile types**: EssayProfile, ProfileIndex, ParagraphProfile, SentenceUnderstanding, SentenceAnalysis, ObservationEntry — the foundational data structures.
2. **Holistic section types**: VoiceIdentity, VoiceMap (5 dimensions, shift points, intentionality assessments, code-switching), EmotionalTopography, EarnednessMap (7 mechanism types, arrow network), ThematicArchitecture, NarrativeStrategy, CharacterRevelation, CraftAssessment, AdmissionsPositioning, CrossDimensionEntanglements.
3. **North Star types**: ThroughLineMap, StructuralRolesMap, TrajectoryAndPotential, DistinctivenessSignature, IntentBridge — all 5 dimensions with essay-type scaling rules.
4. **Conversation and version types**: ConversationInsight (8 categories, secondary attributes, 4 durability levels, supersession), VersionRecord (text snapshots, EditUnderstanding output, intent annotations).
5. **Edit understanding types**: ChangeDetectionOutput, EditUnderstanding, EditSignificance, ChangeType classification, ScopeRecommendation, ReAnalysisBrief.
6. **Profile Manager types**: MutationType, StalenessEffect, StalenessTarget, StalenessEntry, StalenessSnapshot, CheckpointMetadata, CircuitBreakerState, PreMutationSnapshot, ValidationResult, ReadinessScores, ImprovementPhase.
7. **Profile Router**: Universal selective injection with layer awareness — decides which profile sections to load per task based on ProfileIndex tags and staleness state.
8. **Profile Manager coordinator + all 8 mutators**: EssayProfileCoordinator, SentenceMutator, ParagraphMutator, HolisticMutator, ConnectionMutator, VoiceMapMutator, EarnednessMutator, NorthStarMutator, InsightMutator. Plus StalenessTracker (with depth-limited propagation) and Validator (quick + full tiers).
9. **Factory function**: `createInitialProfile()` — produces a properly shaped empty EssayProfile from raw essay text. No LLM calls, just data shaping.

**Exit criteria**: `npx tsc --noEmit` passes. All types are documented with JSDoc. Profile Manager unit tests pass (give mutator a profile, call method, assert result — no LLM, no DB).

### Wave B: Core Pipeline (Phase 1A-1C, L1-L3.75-L3.5)

The analysis pipeline that builds the deep profile from scratch.

1. **L1 Haiku first impressions** (1A): Replace deterministic L1 with Haiku call. Output populates sentence stubs via `applyFirstImpressions()`.
2. **L2 Sonnet structural cartography** (1B): Upgrade to Sonnet. Output populates paragraph roles via `applyStructuralCartography()`.
3. **L2.5 Connection Scout** (1C): Haiku call for surface cross-paragraph connection detection. Output creates provisional connections via `applyScoutLeads()`.
4. **L3 Understanding Walk**: Sequential paragraph-by-paragraph Sonnet calls. Understanding-only output, back-propagation, selective profile injection. Each paragraph processed via `applyUnderstandingWalkStep()`.
5. **L3.75 Holistic Synthesis**: Single Sonnet call producing all 8 holistic sections (voice identity, voice map, emotional topography, earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, cross-dimension entanglements). Applied via `applyHolisticSynthesis()`. **Checkpoint after completion.**
6. **L3.5 Analysis Pass**: Separate parallel Sonnet calls per paragraph. Evaluation with complete understanding + holistic context. Applied via `applyAnalysisPassResult()`. Readiness scores recomputed after all paragraphs complete. **Checkpoint after completion.**
7. **Improvement Phase Detection**: `detectImprovementPhase()` runs after L3.5, stored in ProfileIndex. Five phases: Foundation, Architecture, Craft, Polish, Distinction.

**Exit criteria**: Full pipeline runs on 3+ test essays. Profile depth validated. Back-propagation verified. Voice map populated with shift points. Earned-ness arrows present for all significant moments. Entanglements detected.

### Wave C: Crystallization + Feedback (Phase 1G, 1K)

The output-facing layers that produce what the student actually sees.

1. **L4 North Star crystallization**: Single Sonnet call producing the 5-dimension North Star from complete understanding + holistic profile. Scaled by essay type. Applied via `applyNorthStar()`. **Checkpoint after completion.**
2. **L5 Phase-aware annotations**: Feedback generation using understanding + analysis + North Star context. Improvement phase determines feedback zoom level. Annotations are ephemeral — never stored in the Profile Manager.
3. **L6 Coaching with conversation insight system**: Phase-aware coaching responses. Every coaching turn can produce ConversationInsights (via `applyConversationInsight()`). 8 insight categories, 4 durability levels, partial supersession. Insights enrich future re-analysis briefs and coaching context.

**Exit criteria**: North Star produces meaningful architecture-of-meaning (not summaries). Annotations reference the North Star when discussing essay direction. Coaching responses adapt to improvement phase. Conversation insights are stored and retrievable.

### Wave D: Edit Intelligence (NEW — the two-pathway system)

The complete edit handling system, from detection through re-analysis.

1. **Edit Understanding Pipeline** (`analysis/editUnderstanding.ts`, ~300 lines): Haiku pre-filter (trivial/real binary) + mechanical change detection (paragraph/sentence/word alignment) + integrated Sonnet call (significance, change type, apparent purpose, connection impact, scope recommendation).
2. **Conversational Edit Workshop** (`analysis/conversationalEditWorkshop.ts`, ~250 lines): Pathway 1. Real-time companion that discusses edits with the student. Produces conversation insights. Light-touch profile updates only (text references, staleness markers, via `applyLightTouchUpdate()`).
3. **Version Tracker** (`analysis/versionTracker.ts`, ~200 lines): Accumulates VersionRecords between analyses. Each record: changed text, EditUnderstanding output, conversation insights, intent annotation. Provides chronological narrative for the re-analysis brief.
4. **Re-Analysis Brief Assembler** (`analysis/reanalysisBriefAssembler.ts`, ~150 lines): Builds the 4-section brief: (1) version summary (what changed since last analysis), (2) accumulated changes (from version tracker), (3) conversation insights (what the student revealed), (4) recommended scope (derived from staleness state + EditUnderstanding scoping). The brief is ~150-300 tokens that saves ~500-1000 tokens of exploratory analysis.
5. **Two-pathway orchestration**: Integration in the main orchestrator. Edit triggers Edit Understanding Pipeline. Result feeds Pathway 1 (workshop) and/or Pathway 2 (re-analysis with brief). Staleness accumulation triggers Pathway 2 suggestion when 3+ sentences reach strong staleness.

**Exit criteria**: Trivial edits correctly filtered by Haiku. Meaningful edits understood by Sonnet. Workshop produces conversation insights. Version tracker accumulates correctly. Re-analysis brief demonstrably reduces re-analysis cost by 20-40% vs naive comprehensive. Pre-mutation snapshots enable escalation rollback.

### Wave E: Database + Infrastructure (Phase 1H-1J, 1L)

The persistence, caching, and reliability infrastructure.

1. **19-table migration**: All tables from `docs/plan-sections/05-database-architecture.md`. 6 domain modules: Essay Core (existing), Essay Profile (6 tables), Analysis Lifecycle (2 tables), Conversation & Coaching (4 tables), Feedback & Improvement (3 tables), Portfolio Intelligence (2 tables). Plus 3 supporting structures (analysis locks, version records, version snapshots). RLS policies on every table. Indexes per the specification.
2. **Prompt caching (3-block strategy)**: Block 1 (static instructions, cached forever), Block 2 (essay-specific context, cached across sequential layer calls), Block 3 (call-specific, not cached). Critical for L3.5 analysis pass where understanding profile is cached across parallel paragraph calls.
3. **Checkpointing + circuit breaker**: CheckpointStore implementation for Supabase. Strategic checkpoint placement (after L1+L2, after L3, after L3.75, after L3.5, after L5, conversation saves, before re-analysis). Circuit breaker: max 3 retries per checkpoint position. Failure preserves everything before the failure point. Cooldown period (5 min default) prevents retry loops.
4. **Consistency validation**: Quick validation (referential integrity, <1ms, after every mutation) + full validation (semantic coherence, at checkpoints). Neither blocks the pipeline — both log results for review.
5. **Focused analysis mode with escalation ladder**: `selectAnalysisMode()` in orchestrator. Diff detection, impact classification, focused understanding/analysis updates, escalation when focused analysis discovers larger blast radius. Pre-mutation snapshots for rollback.

**Exit criteria**: All 19 tables created with RLS. Prompt caching reduces L3.5 cost measurably. Checkpoint/resume works (kill process mid-L3, resume from checkpoint). Circuit breaker trips after 3 failures. Focused mode selects correctly for small/medium/large edits. Escalation rollback works.

### Wave F: Testing + Integration (Phase 2-3)

End-to-end verification and frontend integration. Runs in parallel with later stages of Waves D-E where possible.

1. **E2E test** (3A): Full pipeline on 3+ diverse essays. Profile depth validation. Cost tracking.
2. **Profile depth & back-propagation validation** (3B): Verify P1 is updated when P3 reveals new meaning.
3. **Selective profile injection test** (3C): Verify Profile Router loads correct sections per task.
4. **Incremental update test** (3D): Both comprehensive and focused modes. Two-pathway edit flow.
5. **Prompt iteration validation** (3E): Drive prompt refinement. Expect 3-5 iterations. Especially critical for L3 unified output (paragraph profile + prior sentence updates + connections + holistic evolution) and L3.75 holistic synthesis (voice map + earned-ness + entanglements).
6. **Progressive precision test** (3F): Verify phase detection, phase transitions, feedback zoom level adaptation.
7. **Focused analysis test** (3G): Verify mode selection, focused pipeline, escalation ladder, ripple detection. Pre-mutation snapshot rollback.
8. **Edit intelligence test** (NEW, 3H): Verify Haiku pre-filter accuracy. Verify Sonnet understanding quality. Verify Pathway 1 workshop produces useful insights. Verify Pathway 2 brief reduces re-analysis cost. Verify version tracker accumulation.
9. **HTTP routes** (2A): Including `/analyze` (first analysis), `/update` (auto-selects analysis mode), `/workshop` (Pathway 1), `/reanalyze` (Pathway 2 with brief), `/coach` (L6 conversation).
10. **Coaching service** (2B): Phase-aware coaching responses with conversation insight integration.
11. **Coexistence strategy** (2C): Old annotation pipeline continues as fast mode. Essay Intelligence System as deep mode. Migration path for existing profiles (legacy flag in `essay_profiles` table triggers re-analysis).
12. **Frontend integration** (Phase 4): After all backend waves verified.

**Exit criteria**: All test suites pass. HTTP routes return correct responses. Coaching adapts to phase. Old pipeline continues working. Frontend displays profile data and annotations correctly.

---

### Wave Dependencies

```
Wave A ─────────────────────►  Wave B ──────────► Wave C
  (types, router,                (L1-L3.75-L3.5)    (L4-L5-L6)
   profile manager)                  │                   │
         │                           │                   │
         └──────────────────────► Wave D ◄───────────────┘
                                  (edit intelligence — needs
                                   profile manager + L6 insights)
                                     │
                                     ▼
                                  Wave E
                                  (database, caching,
                                   checkpointing)
                                     │
                                     ▼
                                  Wave F
                                  (testing, integration,
                                   frontend)
```

Waves B and D can partially overlap: Wave D's Edit Understanding Pipeline can be built once Wave A's types are stable and Wave B's L3 is producing real profiles to edit. However, Pathway 1 (Conversational Workshop) requires L6 patterns from Wave C, and Pathway 2 (Re-Analysis Brief) requires the full pipeline from Wave B to have something to re-analyze.

Wave E (database) can start as soon as Wave A types are stable — the 19-table migration derives directly from the type definitions. Prompt caching and checkpointing integration happen after Wave B produces the actual LLM calls to cache and checkpoint.

Wave F runs continuously from Wave B onward. Each wave's exit criteria include tests. The full E2E test (3A) is the final gate before frontend integration.
