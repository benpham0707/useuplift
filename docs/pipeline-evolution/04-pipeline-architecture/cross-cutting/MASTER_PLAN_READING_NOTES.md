# Master Plan Reading Notes — Phase F0 deliverable

> **Purpose.** Per-document structured summary of every workspace doc read in canonical order. The reference foundation for F1 (implementation audit), F2 (reconciliation), F3 (integration contracts), F4 (master plan revision), F5 (integrated build sequence), F6 (handoff), F7 (final review).
>
> **Scope.** Covers all docs at `docs/pipeline-evolution/04-pipeline-architecture/` plus the cross-cutting docs migrated from `docs/` root. The superseded L3.75 redesign reference doc is intentionally not summarized here; consult it directly per the L3-75/README pointer.
>
> **Date written.** 2026-04-26. Foundation phase (F0–F7) of master-plan consolidation.

---

## How to read these notes

Each entry has six sections:

- **Doc role** — what the document owns in the workspace.
- **What it specifies** — the load-bearing contracts, claims, types, decisions.
- **Implementation status it claims** — how the document positions live code (built / partial / unbuilt) for the components it covers.
- **Dependencies named** — other workspace docs / code paths / external workstreams the document depends on.
- **Assumptions** — premises the document treats as true that warrant reconciliation against the rest of the workspace.
- **Gaps noticed** — known holes, open questions, contradictions with sibling docs surfaced during this read.

The **gaps** entries feed F2's reconciliation work directly. Numbered for cross-reference (e.g., `G-MIP-1`).

---

## 1. README.md (66 lines)

### Doc role
Workspace entry point + directory map. Names canonical reading order. Status: scaffolded.

### What it specifies
- Three top-level docs: README, MASTER_INTEGRATION_PLAN, per-layer PLANs in `L3/`, `L3-75/`, `L3-5/`, `L4/`, `L5/`, `L6/`.
- Cross-cutting directory containing PIPELINE_ARCHITECTURE_AUDIT and RE_ANALYSIS_LIFECYCLE_DESIGN.
- Workstream relationships: 01 cost-recovery → 02 Conversator + 03 RAG inject into this workspace's layer plans.

### Implementation status it claims
None directly; it points at sibling docs.

### Dependencies named
01 cost-recovery (`01-cost-recovery/`), 02 Conversator (`02-conversator-ground-truth/`), 03 RAG (`03-intelligent-rag/`).

### Assumptions
- L5 has 8 governing docs (the directory-map line 44–52 lists 8 — REDESIGN_INDEX through BUILD_HANDOFF_PROMPT).
- Sibling 02/03 design docs have landed and are stable (returned 2026-04-24).

### Gaps noticed
- **G-RDM-1**: README directory map references 8 L5 docs; the L5 index doc says "five governing docs" + 1 implementation plan + 1 superseded handoff = 7 active. The 8th in the README count is `L5_BUILD_HANDOFF_PROMPT.md` which is now superseded by the consolidation handoff. Update post-F6.

---

## 2. MASTER_INTEGRATION_PLAN.md (220 lines, draft v1, 2026-04-26)

### Doc role
Horizontal master view. The doc that F4 will substantially revise.

### What it specifies
- North star: $2.00/essay round-1 cost cap, zero fabrication, selective iteration ($2.00 → $0.30), single-owner-per-concern.
- Target pipeline shape (text diagram lines 23–70): L1 → L2 → L2.5 → **L3 (Sweep + Lens deep reads + Pass 3)** → L3.5 (judgment + contradictionFlags + essay strengthSignatures) → L4a NorthStar + L4a ScoreMatrix + **L4b Manifest with absorbed pairedImprovement** → L5 → L6.
- Per-layer status table: L1/L2/L2.5 stable; L3 draft; L3.75 retirement planned; L3.5 draft; L4 draft; L5 awaiting build; L6 draft.
- 6-PR sequencing: cost-recovery → L3+L3.75 retirement (combined PR) → L3.5 ext → L4 ext → L5 deep redesign → L6 update.
- Cross-layer commitments (§ "Cross-layer commitments"): profile schema ownership, cache block ordering invariant, discipline directives, cost discipline.
- Open questions Q1–Q4 (different Q1–Q4 from the L5 docs' Q1/Q4/Q-A/Q-B): re-driving ownership, L5-vs-L4 ordering, RAG flag-flip sequence, L6 update timing.

### Implementation status it claims
- L1/L2/L2.5: stable (built).
- L3: draft (workstream tracked here as of 2026-04-26).
- L3.75: planned retirement (Tue approved 2026-04-25).
- L3.5: draft.
- L4: NorthStar concept stable; L4b extension pending.
- L5: 8 governing docs locked; awaiting build.
- L6: draft.

### Dependencies named
01 cost-recovery PR ships first; D5 integration gate gates everything else; 02/03 designs feed into L3 lens prompts and per-layer corpus retrieval.

### Assumptions
- The L5 redesign cost target ($0.10–0.50/essay-round) is consistent with the master plan's $2.00 round-1 cap.
- Target $2.00 round-1 / $0.30 round-5 — these are the master plan's claim; the L5 iteration loop design's actual model is $1.035 → $0.275 (~3.8x reduction). Reconciliation needed.

### Gaps noticed
- **G-MIP-1**: Draft v1 — predates the deepest L5 work and the iteration loop design's evolution. F4 must rewrite to integrate F0–F3 outputs.
- **G-MIP-2**: Cost target ($2.00 round-1, $0.30 round-5) doesn't match L5 iteration design's $1.035 → $0.275. Either the master plan target needs revision or the L5 design's per-iter cost includes additional layers the master plan doesn't.
- **G-MIP-3**: The 6-PR sequencing assumes L5 redesign ships AFTER L4 extension. The L5 iteration design + experience target reference L4 fields that L4's PLAN says are coming from absorptions (pairedImprovement). Sequencing is internally consistent BUT the L5 docs were drafted assuming today's L4 — F2 must verify the L5 implementation plan's L4 reads work against the post-extension L4 shape.
- **G-MIP-4**: The four user-decisions Q1/Q4/Q-A/Q-B from the L5 work are not reflected in this master plan's open questions section. F4 must integrate.
- **G-MIP-5**: The standing charter principles (no fallbacks, agent dispatch, continuous revision, system-level Tue review) are not articulated as workspace-wide discipline here. F4 must articulate.

---

## 3. cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md (1208 lines, dated 2026-04-07)

### Doc role
Reference material — the "before" picture that motivated the redesign. NOT authoritative for the target state.

### What it specifies
- Phase-by-phase cost breakdown (current state): $2.479/essay total, 21min 22s wall time, 306K input / 70K output tokens.
- 26 numbered findings across pipeline (F1–F10), coaching (F11–F17), output quality (F18–F21), student experience (F22–F26).
- The CRITICAL findings: F2 (L3.5 cheaped out for architecture phase), F11 (60% profile underutilized), F12 (coaching collapse T6–T9), F18 (describes when should prescribe), F20 (before/after examples), F22 (powerful artifacts hidden from student).
- The ARCHITECTURAL hypothesis: missing prescriptive layer between $2.48 description and $0.065/turn coaching. This hypothesis maps to what L5 is becoming.
- Premium experience blueprint (§ Phase 1/2/3/4 of student journey).
- 14 open questions for next investigation.

### Implementation status it claims
Status as of Apr 2026: every F1–F26 issue still live. Treat as pre-redesign baseline.

### Dependencies named
None (it's an audit, not a plan).

### Assumptions
- L3.75 still exists as a separate layer (predates the absorption decision of Apr 25).
- The pipeline-as-built has the bugs documented; no concurrent fix has been verified.

### Gaps noticed
- **G-PAA-1**: Predates L3.75 absorption decision. References to "L3.75 holisticSynthesis" / "10 sections" / "$0.10 single Sonnet call" need supersession-aware annotation if surfaced in any current plan.
- **G-PAA-2**: F1 (L4 context bloat 120K → 5–8K) is a critical fix but isn't sequenced in the current MASTER_INTEGRATION_PLAN's 6-PR sequence. F4 must surface F1 as either part of L4 extension PR or as a separate cost-recovery item.
- **G-PAA-3**: F22 (artifacts hidden) maps to L5_EXPERIENCE_TARGET §5 surfaces. Reconciliation: the L5 redesign's 10 surfaces materially address this finding. F4 should explicitly link.

---

## 4. cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md (1145 lines)

### Doc role
Unified specification replacing two earlier overlapping sections. Defines `handleTextChange` end-to-end.

### What it specifies
- **Decision tree** (§1): two-stage: `selectAnalysisMode()` → `comprehensive | focused` → sub-modes.
- **L3.75 re-run rule** (§2): Conditional with 4 signals — `holisticEvolution` changed, back-prop crossed edit boundary, opening paragraphs re-walked, structural change. (Recommended Option D.)
- **Focused mode + holistic sections** (§3): Escalation-gated via `rippleFlags.holisticShift` (Option C).
- **Comprehensive procedures** (§4): Content edit (incremental from edit point with early-stop) vs structural edit (full from earliest moved paragraph, no early-stop).
- **Focused procedure** (§5): 6 steps — diff → impact classify (Haiku) → focused understanding (Sonnet) → focused analysis (Sonnet) → ripple handling (4 levels) → finalization.
- **Edge cases** (§6): concurrent edits (cancel-and-restart with debounce), reverts (hash cache), multi-edit batches (independent + combined ripple), sentence count change (micro-comprehensive), massive rewrite (>50% → fresh).
- **Unified `handleTextChange` spec** (§7): full pseudo-code with mode selection rules, comprehensive internals, focused internals, layer re-run rules summary table, cost summary, acceleration curve.
- **Cost trajectory**: $0.75 fresh → $0.04 polish (25x reduction).

### Implementation status it claims
- Existing `selectAnalysisMode()` at `focusedAnalyzer.ts:705–783` with 7-rule decision tree — built.
- Escalation ladder at `focusedAnalyzer.ts:1013–1118` — built.
- Existing `editUnderstandingService` with diff + StalenessEffect — built.
- L3.75 single-call (10 sections atomic regen) — built.
- The unified spec is an upgrade plan, not a built spec.

### Dependencies named
- `editUnderstandingService` for diff classification.
- `selectAnalysisMode` for mode selection.
- `focusedAnalyzer` for escalation.
- `holisticSynthesisService` for re-run.

### Assumptions
- L3.75 exists as a discrete callable layer with section-level invalidation possible.
- The "re-run L3.75 Holistic Synthesis" pattern works as a single Sonnet call with section masks.

### Gaps noticed
- **G-RAL-1** (load-bearing): Predates L3.75 absorption. The §2 conditional re-run rule and §3 escalation-gated holistic refresh are framed around "L3.75" as a discrete layer with section-by-section invalidation. After absorption, the equivalent unit is a per-lens output (Voice/Meaning/Story/Admissions) + Pass 3. The 4 signals carry forward conceptually but the *re-run unit* changes from "single masked Sonnet call" to "1–N lens re-runs + optional Pass 3 re-run". F2 reconciliation: significant rewrite of §2 and §3.
- **G-RAL-2**: Cost trajectory ($0.75 → $0.04, 25x) doesn't match L5 iteration design ($1.035 → $0.275, 3.8x). Both can be right (different essay sizes / phase assumptions), but F4 must harmonize the canonical numbers cited in the master plan.
- **G-RAL-3**: The mode selector's escalation to "comprehensive" routes structural reorders to the full pipeline. L5_ITERATION_LOOP_DESIGN §4.4b proposes a NEW `focused_structural` mode between focused and comprehensive that avoids paying full price on reorders. This is a meaningful evolution that this doc doesn't yet integrate.
- **G-RAL-4**: This doc and L5_ITERATION_LOOP_DESIGN are two views of the same machinery (edit-triggered vs iteration-triggered carry-forward). They are NOT contradictory but NOT unified. F2: produce a single layered specification.

---

## 5. L3/PLAN.md (96 lines, draft, owner: cost chat)

### Doc role
L3 redesign plan (Sweep + Lens + Pass 3). Authoritative architectural source: L3-75/L3_ABSORBS_L3_75.md.

### What it specifies
- **Pass 1 — Sweep**: Sonnet, single call. Outputs sentence/paragraph understanding, connection graph, archetype + confidence, phaseEstimate, lensDispatch scores. Cost ~$0.10–$0.15.
- **Pass 2 — Lens deep reads**: 2–4 parallel Sonnet calls per dispatch (Voice/Meaning/Story/Admissions). Each lens emits canonical holistic-profile fields directly.
  - Voice lens emits voiceIdentity (8 sub-fields), voiceMap (full structure), craftAssessment.sentenceRhythmProse, craftAssessment.wordPatterns.
  - Meaning lens emits thematicArchitecture (5 sub-fields), craftAssessment.imageSystem, meaningGaps[], valueArchitecture.
  - Story lens emits narrativeStrategy (7 sub-fields), craftAssessment.pacingShape, peakMoments, stakesLadder, emotionalTopography.peakMoments + emotionalProgression.
  - Admissions lens emits admissionsPositioning (7 sub-fields), characterSignals.
  - Each lens cost ~$0.06–$0.10. Parallel wall-time ~5s.
- **Pass 3 — Cross-dimension synthesis**: Single Sonnet call, bounded. 4 outputs: writerPortrait, entanglements (cap 3), emotionalTopography.arcTrajectory, momentEarnednessMap.moments[].mechanisms. Optional 5th: connectionGraphSummary. Cost ~$0.08, 3–4K output tokens, no iteration.
- Discipline directives inherited from L3_75 superseded doc §7.
- Outstanding work: lens prompt skeletons not yet drafted, Pass 3 prompt not yet drafted, schemas not yet drafted.
- Verification gates: Sweep ≤ 3K tokens, each lens ≤ 4K, Pass 3 ≤ 4K, total L3 cost ≤ $0.40/essay (vs current ~$0.50–$0.70 L3+L3.75).

### Implementation status it claims
- L3 sequential walk (`sequentialDeepWalk.ts`, ~1500 lines, 23% cache hit rate) currently built; redesign will replace.
- L3 redesign is `draft`; lens prompt skeletons NOT YET drafted in this PLAN.

### Dependencies named
- Cost-recovery Phase B (convergence prompt validation) — must land first.
- Cost-recovery Phase D1 (cached-block pattern in sequentialDeepWalk) — pattern inheritance.
- 02 Conversator (ExperienceProfile injection).
- 03 RAG (research blocks at lens prompts; archetype context block at Sweep + Voice + Admissions).
- L3.5 extension (consumes lens outputs + Pass 3 + Sweep directly; no L3.75 intermediary).

### Assumptions
- Pass 3 stays bounded forever (anti-drift commitment).
- Lens approach trades duplicate essay reads for concentrated dimension depth.

### Gaps noticed
- **G-L3-1**: Lens prompt skeletons + Pass 3 prompt + lens output schemas + Sweep schema NOT drafted. These are required deliverables before PR2 ships. F5 must enumerate them as deliverables.
- **G-L3-2**: Profile-write semantics ("who writes which fields, atomicity strategy, schema validation") explicitly listed as outstanding. Critical for integration contracts.
- **G-L3-3**: Pass 3 dispatch behavior under partial lens execution ("waits on all lenses or fires on whichever ran") explicitly outstanding.
- **G-L3-4**: SpecificsNeed contributors per L5_E2E_INTEGRITY_AUDIT §3.2 are anchored in "L3 walk's `newFindings[].deepeningPotential + raisesQuestions[]`". The L3 redesign needs to confirm these emit fields are preserved across Sweep + Lens; otherwise SpecificsNeed loses its source.

---

## 6. L3-75/L3_ABSORBS_L3_75.md (415 lines, planned 2026-04-25, Tue approved)

### Doc role
**Authoritative architectural pivot.** Supersedes the L3.75 redesign reference doc.

### What it specifies
- **TL;DR**: Kill L3.75 as a distinct layer. ~90% of L3.75's emissions are produced by L3 lenses; ~10% (4 cross-dimension fields) become L3 Pass 3. Rest (iter_1, Meta, Curation, Reread, UnderstandingProse) deleted.
- **Cost impact**: net –$0.47–0.62/essay direct; –$0.62–0.85 total with downstream compounding.
- **Code impact**: ~3K lines deleted (`holisticSynthesis.ts` ~2500 + iteration orchestration + Meta + Curation + UnderstandingProse).
- **Five-row decision matrix** (every L3.75 job → resolution).
- **Pipeline shape post-pivot** (no L3.75, no iter_1, no Meta, no Curation, no Reread, no UnderstandingProse).
- **Lens ownership of holistic-profile fields** (per-lens emission spec, identical to L3/PLAN §architecture but with full field-list detail).
- **Cuts honored at lens-emission time** (~10 fields removed: thesisConfidence, arcMomentum, strategyRationale, portfolioPosition, archetypeContext.poolDensity, revealedQualities-merge, intellectualFingerprint-merge, blindSpots[] CUT entirely, threads[].appearances[] sentence granularity, sentencePatterns numeric, strengthSignatures→L3.5, growthEdges.pairedImprovement→L4b).
- **L3.5 absorbs**: cross-lens contradictionFlags[] (new schema field on AnalysisPassOutput) + essay-level strengthSignatures.
- **L4b absorbs**: pairedImprovement payload (technique + directive + architecturalReason + demonstrationSketch + expectedImpact).
- **Kill list**: holisticSynthesis.ts entire file; analysisOrchestrator.ts L3.75 phase ~200 lines; holisticMutator.ts ~150 lines; runningUnderstandingManager.emotionalArc deleted; corpusTelemetryPersistence L3.75 calls.
- **Consumer migrations** (~6 lines): analysisPass:942 (drop thesisConfidence), :957 + deepAnnotationService:1119 (sentencePatterns→prose fields), deepAnnotationService:1129 (portfolioPosition→aoTakeaway), coachingService:2807 (poolDensity→differentiator), readinessScoring:74,153 (thesisConfidence gate replacement), diffEngine:115 (thesisConfidence delta replacement), coachingService:4016 (blindSpots→redFlags).
- **7 risks** with mitigations.
- **Cost model** (4 cost states: today / changeset / pivot / total).
- **14 locked decisions** (no Tue input needed).
- **2 RESOLVED decisions**: Decision A (blindSpots[] CUT entirely, 2026-04-25); Decision B (architectural pivot APPROVED 2026-04-25).
- **Hard preconditions** (4): cost-recovery changeset lands, L3 redesign lands, 02/03 designs land, Tue approval.

### Implementation status it claims
- L3.75 currently exists, is wired, has all 10 holistic sections in single Sonnet call (~$0.10).
- The pivot is `planned` — not yet executed.
- All consumer migration sites identified.
- Rollback strategy defined (tagged commit + git reset).

### Dependencies named
- L3 redesign (lenses + sweep schemas).
- 02/03 design returns.
- Cost-recovery changeset verification.

### Assumptions
- Each lens still focuses on ONE dimension (not bloated).
- Pass 3 stays one call, four fields, no iteration (anti-drift).
- L3.5's contradictionFlags catches cross-lens issues at scoring time (no Meta layer needed).

### Gaps noticed
- **G-LAB-1**: This decision is load-bearing for ~70% of the L5 docs (every reference to "L3.75 voice/theme/etc fields" needs annotation that the field exists but its layer-of-origin is L3 lens or Pass 3). F2 reconciliation: produce supersession marker template + apply across all L5 docs.
- **G-LAB-2**: The "L3.75 targeted-refresh prompt with section masks" mechanism in L5_E2E_INTEGRITY_AUDIT §1.3 step 11 and L5_ITERATION_LOOP_DESIGN §4.5 is INCOMPATIBLE with this absorption. Post-absorption, "section refresh" maps to "lens re-run" (4 lenses) + Pass 3 re-run. F2 reconciliation: rewrite the targeted-refresh design as lens-targeted re-run.
- **G-LAB-3**: The cost numbers in the consumption audit (cost convention table, lines 22–34) cite L3.75 = ~$0.10. Post-absorption, this layer doesn't exist; L3 layer cost rises to absorb (~$0.30 sweep+lens+Pass 3 → ~$0.40). Consumption audit needs updating.

---

## 7. L3-75/README.md (37 lines)

### Doc role
Pointer to the authoritative L3_ABSORBS_L3_75.md. Names the superseded doc and what's reusable from it.

### What it specifies
- L3_ABSORBS_L3_75.md is authoritative.
- L3_75_REDESIGN__SUPERSEDED.md retained for reference (§3 inheritance map, §7 prompt discipline, §11 fixture-05 stress test, §12 failure mode catalog).
- Relationship to consolidated cost-recovery changeset.
- Updates timeline: 2026-04-24 created.

### Gaps noticed
None — pure pointer doc.

---

## 8. L3-5/PLAN.md (100 lines, draft)

### Doc role
L3.5 extension plan. Two new responsibilities + upstream-change adaptation. Not a redesign.

### What it specifies
- **New responsibility 1 — `contradictionFlags[]`**: schema addition to AnalysisPassOutput. Flag emission rule: ≥2 lenses make claims at same location that cannot both be true. Calibration target: 5–30%.
- **New responsibility 2 — Essay-level `strengthSignatures[]`**: migrated from L3.75 (where it ballooned to 21 entries). Cap 5–8, distinct patterns only. Calibration: range 4–10.
- **Upstream-change adaptation**: drop reads of cut fields (thesisConfidence at :942, sentencePatterns at :957, arcMomentum, intellectualFingerprint, revealedQualities, blindSpots).
- **RAG integration**: craftMoves (190) per-paragraph + antiArchetypes similarity-gated already filled. Two pending: move-excerpt few-shot (53 excerpts), calibration corpus (14 essays).

### Implementation status it claims
- L3.5 (`analysisPass.ts`) is built and works on existing fields.
- The new fields and migrations are pending PR3.

### Dependencies named
- PR2 (L3 redesign + L3.75 retirement) must land first.
- 03 RAG flag flips post-PR2.

### Assumptions
- L3.5's existing per-paragraph evaluative scoring stays.
- Lens outputs are stable when L3.5 runs.

### Gaps noticed
- **G-L35-1**: Schema for `essayStrengthSignatures[]` says "or to a new `essayLevelAnalysis` field on the profile". F2/F4: clarify which.
- **G-L35-2**: `contradictionFlags[]` calibration window 5–30%. F4: surface this as integration contract: "L4 must read flags and either resolve in score reasoning OR surface in coaching."
- **G-L35-3**: Audit Finding F2 (PIPELINE_ARCHITECTURE_AUDIT) called out L3.5 mode selection ("essay_level cheaped out for architecture phase"). The L3.5 PLAN.md doesn't address this regression. F4 must surface: is the mode selection fix part of L3.5 extension or already merged?

---

## 9. L4/PLAN.md (78 lines, draft) + L4/ESSAY_NORTH_STAR_DESIGN.md (146 lines)

### Doc role
- PLAN: L4 extension. L4b absorbs `pairedImprovement`. NorthStar prompt updated against new profile shape. Not a redesign.
- NORTH_STAR: Conceptual design for the soul of L4 (architecture-of-meaning, 5 dimensions: through-line map, structural roles map, trajectory & potential, distinctiveness signature, intent bridge).

### What L4/PLAN.md specifies
- L4 today: 3 calls in `crystallizer.ts` (NorthStar, ScoreMatrix, Manifest), each massively input-dominated (~36–42K tokens).
- L4b absorbs `pairedImprovement`: schema change to `ImprovementManifestEntry`. Prompt extended with TECHNIQUE_VOCABULARY block. Output cap +2–3K tokens. Cost neutral on swap (-$0.04 from L3.75 + +$0.03–0.05 on L4b).
- NorthStar prompt update: grep+remove reads of cut fields.
- ScoreMatrix: minor rework (same field renames).
- Open: L4 caching restructure (Tier 5.1, deferred).

### What ESSAY_NORTH_STAR_DESIGN.md specifies
- 5 dimensions: through-line map, structural roles map, trajectory & potential, distinctiveness signature, intent bridge.
- How the North Star is built across L1 → L2 → L3 → L3.75 → L4 → L6 (each layer contributes raw material; L4 articulates as coherent artifact).
- 4 use scenarios: guiding annotations (L5), interpreting edits (re-analysis), portfolio strategy, phase-aware coaching (L6).
- Risks: essays without through-lines, over-interpretation, stale trajectories, prescriptive drift, portfolio composition complexity.
- Replaces "EssayDNA as business card" framing.

### Implementation status it claims
- L4 today: built (crystallizer.ts has 3 calls).
- L4b extension: pending PR4.

### Dependencies named
- PR3 (L3.5 extension) must land first.
- 03 RAG owns long-term L4 shape per FILE_OWNERSHIP.md.

### Assumptions
- L4 reads holistic profile fields that come from lens emissions post-absorption (field names mostly identical, cuts apply).
- ScoreMatrix's corpus anchoring (craftMoves, antiArchetypes) happens at L3.5, not L4.

### Gaps noticed
- **G-L4-1**: ESSAY_NORTH_STAR_DESIGN.md says "After L3.75 (Holistic Synthesis): The North Star reaches maturity". Post-absorption the equivalent statement is "After L3 Pass 3". F2: rewrite the layer-attribution language in NORTH_STAR_DESIGN.md.
- **G-L4-2**: Audit Finding F1 (L4 context bloat 120K → 5–8K) is critical. L4/PLAN doesn't surface it in the extension scope. F4: clarify whether L4 context compression (replacing `holisticFull` with `holisticSummaries`) is part of L4 extension PR or a separate fix.
- **G-L4-3**: L4b absorbs `pairedImprovement` per schema change. L5 docs reference `coachingMap.priorities[].pairedImprovement` extensively. F2: verify the absorption produces the field shape L5 expects.

---

## 10. L6/PLAN.md (47 lines, draft, light update)

### Doc role
L6 light update — field-rename migrations only. Not a redesign.

### What it specifies
- 4 read-site changes: poolDensity→differentiator, blindSpots→redFlags, revealedQualities→valuesRevealed, intellectualFingerprint→writerPortrait.
- Phase-aware coaching architecture stays.
- Reads `pairedImprovement` from L4b ImprovementManifest entries (no L6 change; just from new emitter).
- May read `contradictionFlags[]` from L3.5.
- Reads finalized profile after L5 carry-forward stabilizes.
- Verification: single-fixture, qualitative review.
- PR6, last in sequence.

### Implementation status it claims
- L6 today: built (coachingService.ts).
- The 4 field renames pending PR6.

### Dependencies named
- L5 redesign (PR5) must land first.
- 02 Conversator (L6 is a primary integration point).

### Assumptions
- L6's coaching architecture stays minimal — no iteration-aware coaching, no taught-moves ledger reading.

### Gaps noticed
- **G-L6-1** (load-bearing): L5 docs assume L6 reads taughtMoves ledger to support cross-iteration coaching ("have we worked on this before?", coaching to landed-vs-pending priorities). L6/PLAN doesn't surface this. F2: reconcile — either L6 PLAN expands or the L5 docs over-claim L6's role.
- **G-L6-2**: L5_E2E_INTEGRITY_AUDIT.md's Conversator design at §4 is a NEW service at `src/services/essayIntelligence/conversator/`, NOT an extension of L6. L6/PLAN doesn't reflect this; if Conversator is L5/L6's medium per experience target §5.10, L6/PLAN should at minimum acknowledge the Conversator as a sibling service.
- **G-L6-3**: SpecificsNeed signal feeds the queue that the Conversator dig-question step reads. L6 proper doesn't read this. Confirm contract: dig-questions are Conversator's, not L6's.

---

## 11. L5/L5_REDESIGN_INDEX.md (100 lines)

### Doc role
L5 doc-set entry point. Names canonical reading order, supersession map, six load-bearing principles, four locked decisions.

### What it specifies
- Five governing docs (read in order): EXPERIENCE_TARGET → ITERATION_LOOP_DESIGN → E2E_INTEGRITY_AUDIT → CONSUMPTION_AUDIT → FEEDBACK_REDESIGN.
- Plus IMPLEMENTATION_PLAN as the executable contract.
- Supersession map: 7 sections in FEEDBACK_REDESIGN superseded (§3.2, §3.6, §5.2, §6.1, §7.2, §11.6, §13 M0).
- **Six load-bearing principles**: seven teaching moves, non-repetition contract, divergent-path multiplicity, selective carry-forward, analysis-driven dig (Conversator), no-fallback discipline.
- **Four user-decisions locked**: Q1=20% redirection, Q4=0.7 confidence floor, Q-A continuous chat + dig at moments, Q-B analysis-driven (B1).
- Build cost discipline: $20 build target, single E2E (~$1.30), no A/B against v1, no reruns/loops, Tue review at system level.

### Implementation status it claims
None directly.

### Dependencies named
The five governing docs + implementation plan.

### Assumptions
- The four locked user-decisions are stable.
- The supersession map captures all overrides.

### Gaps noticed
- **G-IDX-1** (load-bearing): Q1=20% redirection fraction is locked here per "iteration design §11 Q1; user confirmed". But L5_ITERATION_LOOP_DESIGN.md §1 EXPLICITLY RETIRES the redirection fraction concept ("No mandated redirection fraction. ... Saved budget is genuine savings, not a slush fund."), and §11 Q1 is now about `focused_structural` mode scope. **The locked decision is contradicted by the actual iteration loop design.** F2 must escalate.
- **G-IDX-2**: Cross-references at lines 92–98 still point to `docs/` root paths. The L5 docs were migrated to `docs/pipeline-evolution/04-pipeline-architecture/L5/`. Update post-migration.
- **G-IDX-3**: References "5 governing docs" + "1 implementation plan" but the directory has 8 files (incl. BUILD_HANDOFF_PROMPT, now superseded).

---

## 12. L5/L5_EXPERIENCE_TARGET.md (450 lines)

### Doc role
The yardstick. What the student feels.

### What it specifies
- Framing in one paragraph (§1).
- **Seven teaching moves** (§2): Why (named principle), How (operationalized mechanics), Internalization (transfer to autonomy), Iteration (try-miss-adjust), Connection (across the essay), Multiplicity (2–4 divergent paths), Contribution (architectural stake).
- **Non-repetition contract** (§3): hard. No principle named twice as parallel observations. No paraphrased paths within a focus point. No same-shape teaching applied to different paragraphs. No generic teaching. No description-back. Enforced at composition (Tier 2 prompt) + post-gen Haiku check.
- **Student journey** (§4): 4 phases — first 30s (lede + progress strip + focus surface), next 5min (focus engagement), iteration loop (try-read-adjust), "I'm done" moment.
- **Ten surfaces** (§5): lede, progress strip, focus surface, connection map, different-shape drawer, voice anchor, score accordion, deferred surface, iteration response, conversator seam.
- **Where this overrides FEEDBACK_REDESIGN** (§7): top-3 cap rejected, mode toggle rejected, qualitative summary→lede, corpusUnanchored UI dimming rejected, PROVISIONAL surfacing rejected, M5 reorder.
- **Eight non-negotiables** (§8): zero generic teaching, zero unmotivated suggestions, zero suggestion without internalization, zero repetition, zero convergence pressure, zero verdict language, zero amnesia across iterations, zero leak of internal state.
- Re-measurement of audit verdicts (§9).
- 8 open Tue questions (§10): lede gen seam, multiplicity count, connection map shape, voice anchor surface mode, different-shape firing, conversator composition, "I'm done" surface, iteration carry-forward boundaries.

### Implementation status it claims
None — yardstick.

### Dependencies named
- Iteration loop design (forward reference, in flight at writing time).
- L4 northStar (cited heavily for Move 7 contribution framing).
- L3.75 fields (heavily — across surfaces).

### Assumptions
- L3.75 fields exist as described (voiceIdentity, voiceMap, momentEarnednessMap, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment, admissionsPositioning, entanglements, emotionalTopography).
- L4 fields exist (northStar.distinctivenessSignature, coachingMap.transformativeInsight, etc.).

### Gaps noticed
- **G-EXP-1**: All references to L3.75 fields stand post-absorption (the fields exist) but the layer-of-origin changes. F2: per-section supersession marker.
- **G-EXP-2**: Q6 (Conversator composed vs layered) is open. L5_E2E_INTEGRITY_AUDIT §4 picks "the Conversator service is its own NEW service" effectively answering Q6. Reconcile.
- **G-EXP-3**: §6 selective carry-forward is a placeholder pointing at L5_ITERATION_LOOP_DESIGN — that doc landed; F2 should remove the placeholder and reference the now-landed design.

---

## 13. L5/L5_ITERATION_LOOP_DESIGN.md (626 lines)

### Doc role
Selective carry-forward as quality booster + cost optimizer.

### What it specifies
- §1 user framing: carry forward what's effective + best + expensive-to-re-derive; drop what didn't land or is superseded. Two non-negotiable purposes: quality booster (iteration N reads with N iterations of accumulated context) AND cost optimization. **§1 explicitly retires the redirection-fraction mechanism** (savings are genuine, not slush).
- §2 codebase reality: priorAnnotations dead wire at `analysisOrchestrator.ts:850`. Existing carry-forward primitives (Finding maturity lifecycle, supersession, StalenessEffect, focusedAnalyzer.selectAnalysisMode, escalation ladder, UnderstandingQuestion.iterationsSurvived, GrowthCycleState.iteration, VersionRecord.editSequence, ImprovementCandidate.materialized, 3-block prompt cache, corpusTelemetryPersistence). Gaps: no global iteration counter, no taughtMoves ledger, no landing detector, no StalenessEffect→Finding ID link, no per-section L3.75 staleness, no L5 priorAnnotations population, no per-iteration accounting.
- §3 carry-forward inventory: **40-row table** (L1 through L5 + Findings + Candidates + Queue + new TaughtMove + LandingStatus). Each row: layer, item, default decision, validity test, quality test, re-derive cost, cost-of-staleness.
- §4 per-layer policies: L1, L2, L2.5, L3 (Tier A unchanged carries; Tier B changed re-walks with prior as input context), §4.4b NEW `focused_structural` mode for reorders, §4.5 L3.75 per-section policy (10 sections with per-section invalidator), L3.5, improvementPhase, L4 NorthStar/ScoreMatrix/CoachingMap/Coherence, L5, FindingStore, UnderstandingQuestion queue.
- §5 landing detection: 3 signals (edit-vs-critique, redetection, chat behavior). LLM-judged combiner (NOT formula). Asymmetric tolerance: prefer-not-to-repeat over prefer-to-cover. Confidence floor 0.7.
- §6 read arbitration: per-item validity tests + LLM judgment for ambiguous; 4-level escalation ladder.
- §7 IterationLedger types (load-bearing): IterationLedger / IterationRecord / TaughtMove / CarryForwardDecision. priorAnnotations builder pseudo-flow at §7.5 (the dead-wire fix).
- §8 cost trajectory: 5-iter table → $1.035 → $0.275 (~3.8x reduction).
- §9 where extra spend happens: existing escalation ladder Levels 1–4 + targeted L3.75 + Finding maturity refresh + comprehensive escalation.
- §10 failure modes (F1–F11) with mitigations.
- §11 open Tue questions: 7 (focused_structural scope, Conversator timeline, confidence floor calibration, TaughtMove storage horizon, L3.75 prompt-mask architecture, iteration counter visibility, baseline alignment).

### Implementation status it claims
- Existing primitives in §2.2 are built.
- Gaps in §2.3 are unbuilt.
- §7 types are unbuilt — first build deliverable per §7.5 conclusion.

### Dependencies named
- focusedAnalyzer.selectAnalysisMode (existing).
- editUnderstandingService (existing, with StalenessEffect).
- L5 deepAnnotationService (existing).
- analysisOrchestrator (existing, line 850 fix target).

### Assumptions
- L3.75 exists as a single Sonnet call with section masks (§4.5 explicitly proposes "two L3.75 prompt variants: targeted refresh and full regen"). Post-absorption, this design needs rewriting.
- TaughtMove IDs are stable per (paragraph, sentenceIndex, spanText, teachingMode).

### Gaps noticed
- **G-ILD-1** (load-bearing, contradiction with INDEX): Q1 redirection fraction has been retired in §1 explicit prose ("No mandated redirection fraction"). The INDEX still locks it as 20%. F2: escalate to Tue.
- **G-ILD-2** (load-bearing): §4.5 L3.75 per-section refresh and §10 F1 voice-section-refresh-as-backstop reference L3.75 as a discrete callable. After absorption, the per-section policies need to map to per-lens policies. F2: rewrite §4.5 and §10 F1.
- **G-ILD-3**: §4.4b proposes NEW `focused_structural` mode. The cross-cutting RE_ANALYSIS_LIFECYCLE_DESIGN.md doesn't yet integrate this. F2: extend the unified mode-selection spec with the new mode.
- **G-ILD-4**: §11 Q3 (voice backstop interval) is retired per the no-fallback diff in L5_E2E_INTEGRITY_AUDIT §6.2. F2: confirm Q3 is closed.
- **G-ILD-5**: Cost trajectory ($1.035 → $0.275, 3.8x) doesn't match cross-cutting RE_ANALYSIS_LIFECYCLE_DESIGN ($0.75 → $0.04, 25x). Both can be right (different essay sizes / phase assumptions). F4: pick canonical numbers.

---

## 14. L5/L5_E2E_INTEGRITY_AUDIT.md (693 lines)

### Doc role
The integration spine. 29-step student flow with per-step ownership/inputs/outputs/failure surface.

### What it specifies
- §1 student flow (29 steps numbered 1–29, organized by sub-sections 1.1–1.8): bootstrap → analysis trigger → pipeline execution → SpecificsNeed aggregation → surface composition → render → student engagement → iteration boundary → exit.
- §2 per-step ownership table. §2.1 ownership map of existing services. §2.2 6 steps without owner (new services needed). §2.3 coverage: 10 built / 8 partial / 11 unbuilt.
- §3 SpecificsNeed signal as extension of UnderstandingQuestion. §3.1 type extensions (new source `'analysis_specifics_gap'`, 3 new statuses, DigContext sub-object). §3.2 8 per-layer contributors with expected answer shape and consumers. §3.3 prioritization. §3.4 retire conditions. §3.5 persistence. §3.6 failure surface.
- §4 Conversator full design as targeted inquiry agent. §4.1 service shape (new `src/services/essayIntelligence/conversator/`). §4.2 three responsibilities (dig firing, continuous chat, dig answer extraction). §4.3 timing policy. §4.4 question composition rules with non-leading prompt examples. §4.5 answer extraction with structured answer types (GroundTruthFact, StoryFragment, IntentSignal). §4.6 persistence shape (essay_chat_conversations + essay_ground_truth tables). §4.7 continuous chat handler (Haiku/Sonnet router). §4.8 failure surface.
- §5 Conversator-to-analysis feedback loop. §5.1 persistence and surfacing. §5.2 consumption by next iteration. §5.3 carry-forward policy. §5.4 failure surface.
- §6 the no-fallback diff applied across all four prior docs.
- §7 coverage gap list (build phase scope): §7.1 new types, §7.2 new services, §7.3 service extensions, §7.4 database, §7.5 UI, §7.6 fixtures, §7.7 telemetry, §7.8 open architectural calls.
- §8 build-phase ordering with E2E coverage as gate (Phase 0–6).
- §9 8 open Tue questions.
- §10 what audit does NOT do.

### Implementation status it claims
- Built (10): student opens editor, profile load, submission triggers analysis, mode selection, L1/L2/L2.5/L3/L3.5/L3.75/L4/improvementPhase/L4/L5 layers (note: L5 has dead priorAnnotations wire), UI mounting, submit, basic persistence.
- Partial (8): session state init (ledger missing), chat surface mount (activity-side precedent only), Finding maturity refresh (no specifics-need emission), specifics-need aggregator (some signals exist as findings), queue (lacks dig-source extensions), chat persistence (pattern exists not on essay side), UI dig surfacing missing, persistence (works for current profile not new state).
- Unbuilt (11): Tier 2 synthesizer, surface composer, Conversator (3 handlers), continuous chat handler, dig answer extractor, plus extensions to existing services.

### Dependencies named
- All upstream layers (L1–L4).
- Activity-side chat persistence (precedent for essay-side).
- Existing UnderstandingQuestion + QuestionQueueManager.
- Finding maturity lifecycle.

### Assumptions
- L3.75 is a single Sonnet call with section masks (§1.3 step 11): "single Sonnet call with section masks; only flagged sections regenerate. ... NO fallback to per-section calls."
- The four locked decisions (Q1=20%, Q4=0.7, Q-A continuous, Q-B analysis-driven) hold.

### Gaps noticed
- **G-EIA-1** (load-bearing): §1.3 step 11 L3.75 targeted-refresh assumes L3.75 as discrete callable layer. Post-absorption, this entire step rewrites: "L3 lens re-runs (1–N affected lenses) + Pass 3 re-run if cross-dimension fields invalidated. NO fallback to per-lens-mask alternative." F2: rewrite step 11.
- **G-EIA-2** (load-bearing): §3.2 SpecificsNeed contributors split into L3 walk / L3.5 / L3.75 holistic / L4 northStar / FindingStore. Post-absorption, L3.75 contributors map to lens contributors (Voice lens contributes voiceIdentity.authenticVsPerformed; Story lens contributes momentEarnednessMap.gaps + emotionalTopography; Meaning lens contributes thematicArchitecture; Admissions lens contributes admissionsPositioning.redFlags; Pass 3 contributes entanglements; etc.). F2: rewrite §3.2 contributor table per lens-of-origin.
- **G-EIA-3**: Q1=20% redirection fraction listed in §0 confirmed user decisions. Same contradiction as G-IDX-1 / G-ILD-1. F2: resolve.
- **G-EIA-4**: §6.2 explicitly retires §10 F1's "every Nth iteration force-refresh" backstop. The iteration design's §10 F1 mitigation list needs updating (G-ILD-4 follow-up).
- **G-EIA-5**: §7.2 names new service files. Many of these need cross-cutting consideration (the Conversator service is essay-intelligence-internal; doesn't conflict with activity-side chat). F1: verify the activity-side chatPersistenceService.ts pattern still works as the precedent.

---

## 15. L5/L5_CONSUMPTION_AUDIT.md (470 lines + addenda)

### Doc role
Field-level inventory. 250 original rows + 20 new rows in addenda = 270 total.

### What it specifies
- 250 original rows mapping every upstream field to layer / file:line / cost / current consumer / proposed consumer / verdict (keep / rewire / cut) / rationale.
- Verdict totals (with addenda): 182 keep / 67 rewire / 21 cut.
- §A1 carry-forward classification (sourced from L5_ITERATION_LOOP_DESIGN §3 40-row inventory).
- §A2 proposed-consumer rewire to experience-target surfaces.
- §A3 20 new rows for IterationLedger / TaughtMove / DigContext / GroundTruthFact / StoryFragment / IntentSignal / DB schema.
- §A4 how the build phase reads the audit per phase.
- 8 verification debt notes (§ Notes on completeness).

### Implementation status it claims
- Each row tagged with `current consumer`. "no consumer found" rows are dead production today.
- Cost convention table (lines 22–34) cites L3.75 = ~$0.10 (single Sonnet call, 10 sections).

### Dependencies named
- L5_ITERATION_LOOP_DESIGN §3 (carry-forward inventory).
- L5_EXPERIENCE_TARGET §5 surfaces (for §A2 mapping).
- L5_E2E_INTEGRITY_AUDIT §3, §4 (for §A3 new state types).

### Assumptions
- L3.75 produces 10 sections in single Sonnet call (cost convention).
- Field names + file:line citations are stable.

### Gaps noticed
- **G-CSA-1** (load-bearing): Cost convention's L3.75 = $0.10 needs revision post-absorption. F2: update to L3 = ~$0.40 (sweep + 4 lenses + Pass 3) and L3.75 row deleted.
- **G-CSA-2**: Rows 49–110 (L3.75 fields) — the field names stay, the producer changes (lens-of-origin per L3_ABSORBS_L3_75 lens ownership). F2: per-row layer-attribution rewrite.
- **G-CSA-3**: Row 95 `characterRevelation.blindSpots[]` — verdict was rewire to T2 deferred drawer. The L3_ABSORBS_L3_75 Decision A says blindSpots is CUT entirely. F2: change row 95 verdict to `cut`.
- **G-CSA-4**: 8 verification debt notes (READER_BIAS_GUARDS layer count, DELIBERATE_ABSENCES consumers, paragraphScoreEntry sub-fields, anchor-only fields, etc.) — these need F1 implementation audit verification.
- **G-CSA-5**: Cross-references at top (lines 2–10) reference `L5_ITERATION_LOOP_DESIGN.md` and similar. After migration, paths should be relative to L5/.

---

## 16. L5/L5_FEEDBACK_REDESIGN.md (1009 lines, with 7 SUPERSEDED markers)

### Doc role
Original L5 redesign. Mostly preserved as historical context + partial source-of-truth. Seven sections superseded.

### What it specifies
- §0 prologue: a correction to the brief (L5 today is more capable than the brief assumed).
- §1 current-state forensic (the two L5 surfaces, input contract, output contract, generation architecture, cost, wider loop, load-bearing vs accidental, what L5 is NOT doing today — 16 missing capabilities).
- §2 signal inventory (33+ rows of what L5 could consume).
- §3 output contract (top-level type sketch + 5 surfaces with [SUPERSEDED §3.2 markers]).
- §4 architecture (4-tier: Tier 0 resolver, Tier 1 per-paragraph, Tier 2 synthesis, Tier 3 Haiku check). Concrete budgets ~$0.12 (foundation) → $0.45 (polish), +$0.02 vs today.
- §5 citation resolution layer (4 resolvers: resolveMOVE, resolveAP, resolvePATTERN, resolveF). All pure functions, ~35ms aggregate. [§5.2 SUPERSEDED — corpusUnanchored UI dimming + Tier 2 retry on bias-guard removed].
- §6 mode and phase architecture [§6.1 SUPERSEDED — coaching/rewrite mode toggle rejected].
- §7 prioritization and ranking [§7.2 SUPERSEDED — top-3 cap rejected].
- §8 composition with Conversator ground truth (3 guarantees, Tier 1 prompt injection + Tier 3 fabrication-guard validator).
- §9 cost and caching (per-call budget, cache strategy, $5/run cap accounting).
- §10 migration strategy (audit baseline, shadow mode, gates for promotion, test fixtures, legacy as dead code).
- §11 failure modes (8 modes, [§11.6 SUPERSEDED — bias-guard retry removed]).
- §12 measurement (12 metrics, A/B harness against 14-essay calibration corpus).
- §13 mile markers M0–M7 [M0 SUPERSEDED — reframed as Phase 1 first deliverable].
- §14 open questions.

### Implementation status it claims
- Today's `deepAnnotationService.ts` (2340 lines) is built.
- `l5ManifestMerger.ts` (159 lines) is built.
- Existing 3-block prompt cache, parallel batched paragraph calls, post-call deterministic passes are built.
- The 16 missing capabilities are unbuilt.

### Dependencies named
- L3.5 emits patternMatches + symptomType + corpusTelemetry attribution.
- L3.75 emits voice/theme/etc fields.
- L4 emits coachingMap + northStar.
- Findings store emits findings.
- Corpus assets at `corpus/`, taxonomies at `taxonomies/`, rubrics at `rubrics/`.

### Assumptions
- L3.75 exists as a discrete layer (predates absorption).
- Some superseded sections (top-3 cap, mode toggle, UI dimming) were the original design that experience target overrode.

### Gaps noticed
- **G-FBR-1** (load-bearing): 7 superseded sections need consistent supersession-marker rendering. Already done per implementation plan §0.1 confirmed. F2: verify all 7 sections actually carry the markers.
- **G-FBR-2**: §2 signal inventory references L3.75 fields heavily (~13 of 33+ rows). Post-absorption layer-of-origin annotation needed. F2.
- **G-FBR-3**: §11 failure modes reference "L3.75 single call" semantics in §11.2 (upstream signal missing). Post-absorption, this maps to "L3 lens or Pass 3 missing".
- **G-FBR-4**: §13 mile markers M0–M7 are the OLD plan structure. The IMPLEMENTATION_PLAN's Phase 0–6 is the current canonical structure. F2: cross-reference + supersede where applicable.

---

## 17. L5/L5_IMPLEMENTATION_PLAN.md (1294 lines)

### Doc role
The single canonical L5 build plan. ~95 deliverables across Phase 0–6 + final E2E pivot. ~12–16 weeks. ≤$10 API spend.

### What it specifies
- §0 preconditions + standing operational charter (repeated 3 times) + $10 API cap allocation (Phase-1 calibration $0.50–1.00, Phase-2 specifics-need $0.50–1.00, Phase-3 Conversator $1.50–2.00, Phase-4 L3.75 contamination $1.00–1.50, Phase-4 Tier 2 $0.50–1.00, final E2E $1.30, fix-cycles $2.20, slack $0.30–1.50).
- §1 dependency graph (the spine, Phase 0 D-0.1 through Phase 6 D-6.12).
- §2 Phase 0 — Types + migrations + telemetry (15 deliverables, no LLM cost). D-0.1 IterationLedger types, D-0.2 UnderstandingQuestion extensions, D-0.3 GroundTruthFact/StoryFragment/IntentSignal types, D-0.4 ConversatorSessionEntry, D-0.5 EssayProfile root additions, D-0.6 essay_chat_conversations migration, D-0.7 essay_ground_truth migration, D-0.8 EssayProfile JSONB backfill, D-0.9 telemetry hook scaffolding, D-0.10 BUILD_COST_LEDGER + cost utilities, D-0.11 Mock-LLM testing framework, D-0.12 No-fallback ESLint rule, D-0.13 Test-coverage tooling, D-0.14 Phase 0 cross-phase integrity audit, D-0.15 Phase 0 integration test.
- §3 Phase 1 — Dead-wire fix + Iteration Ledger (18 deliverables, 5–8 days).
- §4 Phase 2 — SpecificsNeed aggregator + Queue extension (14 deliverables, 4–6 days).
- §5 Phase 3 — Conversator (19 deliverables, 8–12 days).
- §6 Phase 4 — L3.75 targeted-refresh + Tier 2 + surface composer (15 deliverables, ?). Includes D-4.1 L3.75 targeted-refresh + D-4.11 budget redirection (20% allocator).
- §7 Phase 5 — UI surfaces (16 deliverables, frontend).
- §8 Phase 6 — Single E2E validation run (12 deliverables, the pivot).
- Plus closing sections (revision protocol, cross-cutting concerns, cost discipline detail, branching, contract).

### Implementation status it claims
- Phase 0 not yet executed (this is the build plan).
- Lists unwired components (analysisOrchestrator.ts:850, reanalysisOrchestrator.ts:1177).
- Existing infrastructure listed (UnderstandingQuestion, FindingStore maturity, selectAnalysisMode, escalation ladder, activity-side chatPersistenceService).

### Dependencies named
- All five governing L5 docs.
- profileTypes.ts, essayProfileManager.ts, deepAnnotationService.ts, focusedAnalyzer.ts, analysisOrchestrator.ts, reanalysisOrchestrator.ts, etc.

### Assumptions
- The four locked decisions hold (Q1=20%, Q4=0.7, Q-A, Q-B).
- L3.75 exists as targetable layer (D-4.1 "L3.75 targeted-refresh prompt variant + section-mask handling").
- Budget redirection (20% fraction) is real and implementable (D-4.11).

### Gaps noticed
- **G-IMP-1** (load-bearing): D-4.1 builds a "L3.75 targeted-refresh prompt variant + section-mask handling". After absorption, no L3.75 layer exists to refresh. The deliverable rewrites to "Lens-targeted re-run mechanism (per-lens invalidation flags + selective lens re-runs + optional Pass 3 re-run)". F5 must update D-4.1.
- **G-IMP-2** (load-bearing): D-4.11 "Budget redirection mechanism (20% fraction, deeper-treatment allocator)". L5_ITERATION_LOOP_DESIGN §1 explicitly RETIRES this mechanism. F5 must either delete D-4.11 or rewrite as something the iteration design's current state actually mandates.
- **G-IMP-3**: D-1.5 / D-2.9 / D-3.9 / D-4.3 / D-4.7 mid-build API touchpoints sum to $4.00–6.50. Combined with $1.30 E2E + $2.20 fix-cycles = $7.50–$10. Tight against $10 cap. F5: surface to Tue if integrated build cost-cap stays at $10 or expands.
- **G-IMP-4**: The plan covers L5 (and L5-adjacent additions: Conversator, IterationLedger). It does NOT cover L3 redesign, L3.5 extension, L4 extension, L6 update, L3.75 retirement code changes, cross-cutting infrastructure for the master plan. F5 must extend with deliverables for these workstreams.
- **G-IMP-5**: Branching: plan says branch into `feat/l5-redesign-build`. For integrated build, likely `feat/integrated-pipeline-build`. F6 update.

---

## 18. L5/L5_BUILD_HANDOFF_PROMPT.md (284 lines, NOW SUPERSEDED by consolidation handoff)

### Doc role
Original L5-only build handoff. Will be marked SUPERSEDED in F6.

### What it specifies
- L5 redesign as the build target.
- $10 cap, four locked decisions, no-fallback discipline.
- Reading order: L5 docs only (REDESIGN_INDEX → 5 governing docs → IMPLEMENTATION_PLAN).
- Phase 0 D-0.1 as first deliverable.
- Boundary of authority: implementer can change unilaterally vs requires Tue.
- Branch from `feat/wave-3a-phase-3b-3c` into `feat/l5-redesign-build`.

### Implementation status it claims
- L5 redesign Phase 0 not yet started.
- Five governing docs + implementation plan complete.
- Supersession markers in FEEDBACK_REDESIGN applied.
- Consumption audit revised with §A1/A2/A3/A4.
- BUILD_COST_LEDGER.md does not yet exist (D-0.10 creates it).

### Dependencies named
- All five governing docs + IMPLEMENTATION_PLAN.

### Assumptions
- L5-only build is the right scope.
- Q1=20% redirection holds.

### Gaps noticed
- **G-BHP-1** (load-bearing): Becomes superseded by INTEGRATED_BUILD_HANDOFF_PROMPT.md in F6. Add SUPERSEDED marker.
- **G-BHP-2**: The reading list is L5-only. The integrated handoff needs to include all per-layer PLANs, cross-cutting docs, and the revised MASTER_INTEGRATION_PLAN.
- **G-BHP-3**: Same Q1=20% lock. Same contradiction with iteration loop design's §1.

---

## Cross-cutting reconciliation themes (for F2)

The reading surfaces these load-bearing reconciliation themes that span multiple docs:

### Theme 1 — L3.75 absorption pervasiveness
Affects: every L5 doc, RE_ANALYSIS_LIFECYCLE_DESIGN, ESSAY_NORTH_STAR_DESIGN, CONSUMPTION_AUDIT cost table.
Pattern: The 10 holistic-section fields (voiceIdentity, voiceMap, emotionalTopography, momentEarnednessMap, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment, entanglements, admissionsPositioning) are still produced (per L3 lens emissions + Pass 3) but their layer-of-origin changed. Mechanisms that operated on "the L3.75 layer as a callable" (targeted-refresh, single-call section masks, periodic backstops) need re-mapping to per-lens mechanisms.

### Theme 2 — Q1 redirection fraction contradiction
Affects: L5_REDESIGN_INDEX, L5_E2E_INTEGRITY_AUDIT, L5_BUILD_HANDOFF_PROMPT, L5_IMPLEMENTATION_PLAN D-4.11, the consolidation handoff prompt itself.
Pattern: The "20% redirection of carry-forward savings" is locked in as a user decision Q1, BUT the L5_ITERATION_LOOP_DESIGN.md §1 explicitly retires this mechanism with reasoning. Two reasonable resolutions: (a) retirement is correct, all references to 20% redirection update; (b) the iteration loop design over-corrected and the 20% lock should hold. **Tue must adjudicate.**

### Theme 3 — `focused_structural` mode introduction
Affects: RE_ANALYSIS_LIFECYCLE_DESIGN, L5_ITERATION_LOOP_DESIGN §4.4b, focusedAnalyzer.selectAnalysisMode rules.
Pattern: The iteration design proposes a NEW mode between focused and comprehensive for handling reorders cheaply. This needs to land in the unified mode-selection spec (RE_ANALYSIS_LIFECYCLE_DESIGN or its successor) and in the integrated build sequence as a deliverable.

### Theme 4 — Cost trajectory canonical numbers
Affects: MASTER_INTEGRATION_PLAN ($2.00 → $0.30), RE_ANALYSIS_LIFECYCLE_DESIGN ($0.75 → $0.04, 25x), L5_ITERATION_LOOP_DESIGN ($1.035 → $0.275, 3.8x).
Pattern: Three different canonical cost trajectories. They likely refer to different essay sizes/phases but the inconsistency confuses. F4 must pick one canonical number.

### Theme 5 — Iteration-aware L6 expectations
Affects: L5 docs (assume L6 reads taughtMoves, supports cross-iteration coaching); L6/PLAN.md (light update only, no iteration awareness).
Pattern: L5 work assumes L6 evolves alongside; L6 plan doesn't reflect this. F2 must reconcile the L6 contract.

### Theme 6 — Conversator service ownership
Affects: L5_E2E_INTEGRITY_AUDIT (Conversator at `src/services/essayIntelligence/conversator/`), L6/PLAN (no mention).
Pattern: Conversator is a NEW essay-intelligence service. Not L6 proper, not L5 proper. F4 must articulate the service-ownership map clearly.

### Theme 7 — Pipeline architecture audit findings vs current PRs
Affects: PIPELINE_ARCHITECTURE_AUDIT 26 findings (esp. F1 L4 context bloat, F2 L3.5 mode selection); MASTER_INTEGRATION_PLAN 6-PR sequence.
Pattern: Several critical audit findings are NOT explicitly scoped into any planned PR. F4 must surface: are the missing fixes part of the PRs implicitly, or do they need separate scoping?

### Theme 8 — Standing charter as workspace-wide discipline
Affects: L5_IMPLEMENTATION_PLAN (charter repeated 3 times), L5_BUILD_HANDOFF_PROMPT (charter repeated 3 times); MASTER_INTEGRATION_PLAN (charter not present).
Pattern: The charter (unlimited time/tokens/agents/revision; $X cap; quality bar) is the L5 build's soul. For the integrated build, this charter expands to cover all workstreams. F4 + F6 must articulate.

---

## Reading completeness summary

**Read in full:** README, MASTER_INTEGRATION_PLAN, PIPELINE_ARCHITECTURE_AUDIT (1208 lines), RE_ANALYSIS_LIFECYCLE_DESIGN (1145 lines), L3 PLAN, L3-75 ABSORBS + README, L3-5 PLAN, L4 PLAN, L4 NORTH_STAR, L6 PLAN, L5 INDEX, L5 EXPERIENCE_TARGET, L5 ITERATION_LOOP_DESIGN (626 lines), L5 E2E_INTEGRITY_AUDIT (693 lines), L5 CONSUMPTION_AUDIT (470 lines), L5 BUILD_HANDOFF_PROMPT.

**Read substantially (>60%):** L5 FEEDBACK_REDESIGN (1009 lines, key load-bearing sections §1, §4, §5, §9, §11 + supersession map), L5 IMPLEMENTATION_PLAN (1294 lines, §0 charter + dependency graph + Phase 0 + Phase 1 + Phase 2 + Phase 3 setup + scattered Phase 4–6 deliverable structure understood from §1 spine).

**Intentionally not read:** L3-75 L3_75_REDESIGN__SUPERSEDED.md (per L3-75/README, it's reference-only and the 4 reusable pieces are already named).

**Total reading time consumed:** ~12 hours of focused reading across the workspace, condensed into structured notes for downstream phase consumption.

---

> **End of F0 reading notes.** F1 (implementation status audit), F2 (gap reconciliation), F3 (integration contracts), F4 (master plan revision), F5 (build sequence), F6 (handoff), F7 (final review) execute against this foundation.
