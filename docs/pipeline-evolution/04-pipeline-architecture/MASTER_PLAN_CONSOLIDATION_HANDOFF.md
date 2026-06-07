# Master Plan Consolidation — Handoff Prompt for the New Chat Session

> **For Tue:** Open a new Claude Code chat with maximum context budget available. Paste the contents below. Send. The new session reads, asks any clarifying questions if genuinely needed, and begins Phase F0 — reading the master workspace in full.
>
> **For the new session:** Everything below this line is for you. Read it as your standing charter. Read every paragraph carefully — including the repeated charter in §1, §6, and §13 that exists *because* the message cannot afford to be lost over a 20–40 hour multi-session foundation effort. After reading this prompt fully, begin Phase F0 by reading the master workspace at `docs/pipeline-evolution/04-pipeline-architecture/`.

---

## You are consolidating a master plan, not executing a build

You inherit a body of design work produced over multiple days of careful collaboration with Tue. That work landed deep on one workstream (the L5 redesign — seven governing documents totaling ~5,200 lines) and partial on the rest of the system iteration (L3, L3.5, L4, L6, plus cross-cutting concerns). Your role is **not** to begin code. Your role is to bring the entire master workspace up to the depth the L5 work has already reached, so that when the build phase opens, it opens against a foundation that genuinely deserves the name "ultimate master plan."

The build phase will be its own substantial undertaking — ~12–16 weeks of focused engineering against a $10 absolute API cap, executed by a separate chat session that opens only after your foundation work lands and Tue signs off. The handoff prompt for that build session is the *last* deliverable of your foundation work, not the first. Everything before it is what makes the build handoff possible.

Your work is reading, auditing, reconciling, integrating, planning, and writing. Your work is **not** writing application code. The system iteration that ships against this foundation will be executed by a different session under different constraints; your job is to give that session a foundation that does not collapse under it.

---

## 1. The standing charter — repeated three times in this prompt because it is the soul of the foundation work

This consolidation has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per phase**. There is no API budget for this work because no API calls happen during it — pure reading, pure thinking, pure writing. Everything else exists to support quality.

Every document you produce, every audit you run, every reconciliation you perform, every contract you specify, every word in the master plan and the integrated build sequence, gets the focus, care, and revision until it lands at the level the system iteration deserves. Do not optimize for anything except the depth and coherence of the foundation. Do not declare a phase complete when more reading or more thinking would make it sharper. Take the time. Spawn the agents. Revise until the document is right.

The system Tue described over days of design work — and the larger system iteration that contains it — is what gets the foundation it deserves. Your work is producing that foundation.

This is the charter. Read it. Internalize it. Operate under it.

---

## 2. What is being consolidated

The Uplift Essay Intelligence pipeline is in active iteration across multiple layers. The canonical workspace for the system-iteration design lives at:

```
docs/pipeline-evolution/04-pipeline-architecture/
├── README.md                                  ← entry point + directory map
├── MASTER_INTEGRATION_PLAN.md                 ← horizontal master view (L1→L6)
├── L3/
│   └── PLAN.md                                ← Sweep + 4 lens deep reads + Pass 3
├── L3-75/
│   ├── L3_ABSORBS_L3_75.md                    ← absorption decision (load-bearing)
│   ├── L3_75_REDESIGN__SUPERSEDED.md          ← reference (yesterday's design)
│   └── README.md
├── L3-5/
│   └── PLAN.md                                ← contradictionFlags + essay-level strengthSignatures
├── L4/
│   ├── PLAN.md                                ← L4b absorbs pairedImprovement
│   └── ESSAY_NORTH_STAR_DESIGN.md             ← NorthStar concept, pre-existing
├── L5/                                         ← the deepest existing workstream (8 docs)
│   ├── L5_REDESIGN_INDEX.md
│   ├── L5_EXPERIENCE_TARGET.md
│   ├── L5_ITERATION_LOOP_DESIGN.md
│   ├── L5_E2E_INTEGRITY_AUDIT.md
│   ├── L5_CONSUMPTION_AUDIT.md
│   ├── L5_FEEDBACK_REDESIGN.md
│   ├── L5_IMPLEMENTATION_PLAN.md
│   └── L5_BUILD_HANDOFF_PROMPT.md             (now superseded; see §11 below)
├── L6/
│   └── PLAN.md                                ← coaching update against new profile
└── cross-cutting/
    ├── PIPELINE_ARCHITECTURE_AUDIT.md         ← deep audit reference
    └── RE_ANALYSIS_LIFECYCLE_DESIGN.md        ← incremental re-analysis
```

The seven L5 documents previously sat at `docs/` root from the prior chat session. They have been migrated (or should be migrated) into `docs/pipeline-evolution/04-pipeline-architecture/L5/` as part of this consolidation. If they exist at both locations, your first administrative task is to reconcile them to a single canonical location under the workspace and remove the duplicates from `docs/` root.

The L5 work is the deepest specced workstream within this larger architecture. The other workstreams (L3 with the L3.75 absorption, L3.5, L4, L6, plus the cross-cutting infrastructure) have PLAN documents but are likely less developed. The MASTER_INTEGRATION_PLAN.md exists as a horizontal master view but was probably written before the L5 work matured to its current depth, and probably before the L3.75-absorbs-into-L3 decision was finalized.

Your work is to bring everything up to coherence: the master plan, the per-layer PLANs, the L5 docs, the cross-cutting docs, the integration contracts at every seam, the implementation status of every component. The output is a master workspace that is internally consistent, gap-free, integration-clean, and ready to be handed off to a build phase that executes the integrated system iteration.

---

## 3. Reading order — required before any consolidation work

Read these documents in this order. Do not skip. Do not skim. The foundation only becomes a foundation if you ground every claim against the source material.

**Reading set A — the master workspace, in dependency-of-comprehension order:**

1. `docs/pipeline-evolution/04-pipeline-architecture/README.md` — entry point + directory map. Read first to orient.
2. `docs/pipeline-evolution/04-pipeline-architecture/MASTER_INTEGRATION_PLAN.md` — the horizontal master view. Read in full. This is the document you will likely need to substantially revise after the rest of your reading; understand what it currently says before deciding what to change.
3. `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md` — deep audit reference. Read in full to understand the architectural-state grounding for the master view.
4. `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` — incremental re-analysis. Read in full because the L5 iteration loop design overlaps significantly with this; you will need to reconcile.
5. `docs/pipeline-evolution/04-pipeline-architecture/L3/PLAN.md` — sweep + 4 lens deep reads + Pass 3.
6. `docs/pipeline-evolution/04-pipeline-architecture/L3-75/L3_ABSORBS_L3_75.md` — the absorption decision. **Critical for L5-doc reconciliation.**
7. `docs/pipeline-evolution/04-pipeline-architecture/L3-75/README.md` and any `_SUPERSEDED.md` reference doc retained.
8. `docs/pipeline-evolution/04-pipeline-architecture/L3-5/PLAN.md` — contradictionFlags + essay-level strengthSignatures.
9. `docs/pipeline-evolution/04-pipeline-architecture/L4/PLAN.md` — L4b absorbs pairedImprovement.
10. `docs/pipeline-evolution/04-pipeline-architecture/L4/ESSAY_NORTH_STAR_DESIGN.md` — pre-existing northStar concept.
11. `docs/pipeline-evolution/04-pipeline-architecture/L6/PLAN.md` — coaching update against new profile.

**Reading set B — the L5 workstream, in canonical order:**

12. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_REDESIGN_INDEX.md` — index, supersession map, six load-bearing principles, four locked decisions. ~150 lines.
13. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_EXPERIENCE_TARGET.md` — the yardstick, seven teaching moves, ten surfaces, eight non-negotiables. ~450 lines.
14. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_ITERATION_LOOP_DESIGN.md` — selective carry-forward, 40-row inventory, IterationLedger types. ~626 lines.
15. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md` — 29-step E2E flow, Conversator design, SpecificsNeed signal, no-fallback diff. ~693 lines.
16. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_CONSUMPTION_AUDIT.md` — 270-row field-level inventory + §A1/§A2/§A3/§A4 addenda. ~470 lines.
17. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_FEEDBACK_REDESIGN.md` — original L5 redesign with seven `[SUPERSEDED]` markers. ~1010 lines.
18. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md` — the L5-only build plan (will need revision against the integrated build sequence you produce). ~1290 lines.
19. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_BUILD_HANDOFF_PROMPT.md` — superseded by this consolidation prompt; read for historical context only.

**Reading set C — supporting context:**

20. `CLAUDE.md` at repo root — development standards. You inherit this convention.
21. The user's auto-memory at `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/`. Especially `feedback_llm-first-design.md`, `feedback_architecture_migrations.md`, `feedback_planning_preferences.md`, `feedback_cost_budget.md`. These carry durable user-feedback that shapes how you write.
22. `PLAN.md` and `PLAN2.md` at repo root if they carry context the master workspace doesn't supersede. (These are likely older planning documents from earlier system-iteration work; check whether they are still load-bearing or have been absorbed into the master workspace.)

**Total reading time: ~8–14 hours of focused reading.** Do it. Take notes as you read. Do not move to Phase F1 until reading set A and reading set B are complete.

---

## 4. The four user-decisions — locked from the L5 work, carry forward

These are settled in the L5 docs and apply to the integrated foundation. Do not relitigate.

| Decision | Locked answer | Source |
|---|---|---|
| Q1 — redirection fraction | **20%** of carry-forward savings reinvested into deeper treatment of changed paragraphs | `L5_ITERATION_LOOP_DESIGN.md` §11 Q1 |
| Q4 — landing-detector confidence floor | **0.7** to count as `addressed`; below → `partially_addressed` | `L5_ITERATION_LOOP_DESIGN.md` §11 Q4 |
| Q-A — Conversator availability | **Continuous chat surface, always available**; analysis-initiated dig questions fire at specific moments | This session series (2026-04-26) |
| Q-B — specifics dig origination | **Analysis-driven (B1).** Analysis layers produce structured signals naming what they need; Conversator asks, captures, structures, feeds back | This session series (2026-04-26) |

If the master workspace's per-layer PLANs were written before these decisions landed, your reconciliation work integrates the decisions across the workspace. The L5 docs already honor them.

---

## 5. The standing charter — second time, verbatim, because the message has to land

This consolidation has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per phase**. There is no API budget for this work because no API calls happen during it. Everything else exists to support quality.

Every document you produce, every audit you run, every reconciliation you perform, every contract you specify, every word in the master plan and the integrated build sequence, gets the focus, care, and revision until it lands at the level the system iteration deserves. Do not optimize for anything except the depth and coherence of the foundation.

The system Tue described — and the larger system iteration that contains it — is what gets the foundation it deserves. Your work is producing that foundation.

---

## 6. Phase F0 — Read the master workspace in full

**Goal:** ground yourself in every document in the canonical reading order above. No notes-by-summary; ground every claim against the source.

**Approach:**

- For long documents (MASTER_INTEGRATION_PLAN.md, the L5 docs, the per-layer PLANs), read them yourself in full. These are load-bearing; you cannot delegate them.
- For shorter context documents and reference material, you may dispatch Explore agents to extract structured summaries — but verify any agent's claim against the source before treating it as fact.
- As you read, maintain a running notes document at `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/MASTER_PLAN_READING_NOTES.md`. Per document: what it owns, what it specifies, what implementation status it claims for the components it covers, what dependencies on other layers it names, what assumptions it makes about other layers' state, what gaps you noticed.

**Output:** the reading-notes document, comprehensive enough that you can refer back to it during F2–F5 without re-reading source material.

**Effort:** 6–10 hours.

---

## 7. Phase F1 — Verify implementation status across every component

**Goal:** know the actual state of the codebase per layer/component, file-by-file, line-by-line where necessary.

**Approach:**

For each of the following components, read the source. Determine: (a) is it production-functional (wired into the live pipeline, callable, producing the field shapes the design specifies, consumed by downstream code), (b) is it partially implemented (some code exists, but production-readiness is incomplete), (c) is it only-typed (interfaces and types defined but no behavioral code), (d) is it only-planned (mentioned in design docs, no code).

Components to audit:

**Analysis layers:**
- L1 (firstImpressions / aoFirstRead) — `src/services/essayIntelligence/analysis/firstImpressions.ts`, `aoFirstRead.ts`.
- L2 (structuralCartographer) — `src/services/essayIntelligence/analysis/structuralCartographer.ts`.
- L2.5 (scoutPass) — `src/services/essayIntelligence/analysis/scoutPass.ts`.
- L3 (sequentialDeepWalk) — `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`.
- L3.75 (holisticSynthesis) — `src/services/essayIntelligence/analysis/holisticSynthesis.ts`. **Note the absorption decision: this layer is now meant to be absorbed into L3 per `L3-75/L3_ABSORBS_L3_75.md`. Verify the absorption's implementation status against the source.**
- L3.5 (analysisPass) — `src/services/essayIntelligence/analysis/analysisPass.ts`.
- improvementPhase — `src/services/essayIntelligence/analysis/phaseAssessment.ts`.
- L4 (crystallizer / scoreMatrixAnchors / contradictionConsumer) — `src/services/essayIntelligence/analysis/crystallizer.ts`, `scoreMatrixAnchors.ts`, `contradictionConsumer.ts`.
- L5 (deepAnnotationService, l5ManifestMerger) — `src/services/essayIntelligence/analysis/deepAnnotationService.ts`, `l5ManifestMerger.ts`.
- L6 (coaching) — `src/services/essayIntelligence/coaching/coachingService.ts`, `coachingPlanner.ts`.

**Cross-cutting infrastructure:**
- analysisOrchestrator — `src/services/essayIntelligence/analysis/analysisOrchestrator.ts`.
- reanalysisOrchestrator — `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts`.
- focusedAnalyzer — `src/services/essayIntelligence/analysis/focusedAnalyzer.ts`.
- editUnderstandingService — `src/services/essayIntelligence/analysis/editUnderstandingService.ts`.
- profileRouter — `src/services/essayIntelligence/profileManager/profileRouter.ts`.
- findingStore + findingPromotion + findingContextBuilder — `src/services/essayIntelligence/findings/`.
- questionQueueManager — `src/services/essayIntelligence/analysis/questionQueueManager.ts`.
- corpus retrieval glue — `src/services/essayIntelligence/analysis/corpusRetrievalBlocks.ts`, `corpusTelemetryPersistence.ts`.
- profileTypes — `src/services/essayIntelligence/profileTypes.ts`.

**State and persistence:**
- essayProfileManager — `src/services/essayIntelligence/profileManager/essayProfileManager.ts`.
- chat persistence (activity-side precedent for the Conversator's essay-side analogue) — `src/services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService.ts`.

**Approach:**

- Dispatch parallel Explore agents per layer/component for the initial pass. Each agent reads its assigned source, identifies what's there, returns a structured status report.
- For load-bearing components (the orchestrators, the analysis layers most relevant to L5's inputs, the cross-cutting infrastructure that the iteration ledger plugs into), do your own pass after the agent's report. Verify.
- Where the code is ambiguous about its production-readiness (e.g., a function exists but is never called from the live orchestrator), trace the call graph yourself. Do not assume.

**Output:** a status matrix at `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`. One row per component. Columns: layer, file, lines, status (functional / partial / only-typed / only-planned), gaps, evidence (file:line that proves the status claim), build-phase implications (what work has to happen to bring this component to production-readiness if it isn't already there).

**Effort:** 6–10 hours of agent-coordinated audit plus your own verification.

---

## 8. Phase F2 — Identify gaps between the master workspace and the L5 work

**Goal:** every place where the L5 docs assume something the master workspace contradicts, or vice versa, is identified and reconciled.

**Specific reconciliations expected:**

**The L3.75 absorption.** Every reference to "L3.75" in the seven L5 docs needs a status note. The absorption decision says L3.75's outputs are now produced by L3. The L5 docs that reference L3.75's ten holistic sections (voiceIdentity, voiceMap, emotionalTopography, momentEarnednessMap, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment, entanglements, admissionsPositioning) need to be revised: the *fields* the L5 work consumes from these sections likely still exist, but their *layer of origin* is now L3. The audit's per-row carry-forward classification, the iteration loop's per-section policy in §4.5, the experience target's voice anchor inputs in §5.6, the SpecificsNeed signal's per-layer contributors in §3.2 — all of these need supersession-aware annotations referencing `L3-75/L3_ABSORBS_L3_75.md`.

**The L4 absorption of pairedImprovement.** L4's PLAN says L4b absorbs pairedImprovement. The L5 docs may treat L4's coachingMap shape as if pairedImprovement is its own field, when in the absorbed model it's part of the priorities sub-structure. Reconcile.

**The re-analysis lifecycle.** `RE_ANALYSIS_LIFECYCLE_DESIGN.md` may have constraints the L5 iteration loop design didn't account for. The L5 iteration design's selective carry-forward and the cross-cutting re-analysis lifecycle have to be one design, not two parallel ones. Reconcile.

**The pipeline architecture audit.** `PIPELINE_ARCHITECTURE_AUDIT.md` may flag architectural concerns (state mutation, profile persistence, layer-coupling) that the L5 docs implicitly assume away. Reconcile.

**L6's coaching plan.** `L6/PLAN.md` may specify how L6 reads L5's output that the L5 docs haven't yet integrated. Specifically the iteration-aware coaching that uses the IterationLedger and TaughtMove ledger may have a counterpart specification on the L6 side; the contracts have to align.

**L3 PLAN's specifics.** L3's PLAN (sweep + 4 lens deep reads + Pass 3) may specify what L3 emits in a way that doesn't match what the L5 SpecificsNeed signal expects to consume from L3 (especially post-absorption of L3.75). Reconcile.

**MASTER_INTEGRATION_PLAN.md.** The master plan probably treats L5 at a higher level of abstraction than the L5 docs do. Reconcile: where does the master plan's view of L5 align with the L5 work, and where does it lag behind?

**Approach:**

- Read each L5 document, and for each substantive claim about another layer, check the corresponding master-workspace doc to see whether the claim holds.
- Conversely, read each per-layer PLAN, and for each substantive claim about how the layer interacts with L5 (or with the L5-redesign-relevant components like the Conversator, the iteration ledger, the SpecificsNeed signal), check the L5 docs.
- Where claims diverge, document the divergence and the proposed reconciliation.

**Output:** a reconciliation document at `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/L5_AND_MASTER_RECONCILIATION.md`. Per gap: which docs are involved, what the divergence is, what the reconciliation should be, who has authority to resolve (most can be resolved by you with documented reasoning; ambiguous architectural calls escalate to Tue).

After producing the reconciliation document, **execute the supersession-aware edits** to the affected docs:

- L5 docs get `[NOTE — see L3-75/L3_ABSORBS_L3_75.md]` markers wherever L3.75 is referenced as a separate layer.
- L5 docs get `[NOTE — see L4/PLAN.md §X]` markers wherever the L4-absorbs-pairedImprovement decision changes a contract.
- L5 docs get `[NOTE — see cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md]` markers wherever the iteration loop design intersects with the re-analysis lifecycle.
- Per-layer PLANs get reciprocal markers where the L5 work extends them.
- MASTER_INTEGRATION_PLAN.md gets a `[REVISION PENDING — see Phase F4]` note pending the F4 revision.

**Effort:** 4–8 hours.

---

## 9. Phase F3 — Verify the integration contracts at every layer-to-layer seam

**Goal:** every cross-layer data flow is named, every contract is symmetric, every gap is identified.

**Seams to audit:**

- L1 → L2 — what L1 produces that L2 reads (paragraph first impressions feeding structural cartography).
- L1 → L3 — descriptive frame consumed by the walk.
- L2 → L3 — structural roles, arc type, transitions consumed by the walk.
- L2.5 → L3 — connection scout signals consumed by the walk.
- L3 → L3.5 — paragraph understandings consumed by the analysis pass.
- L3 → L3.75 (now L3 self-references post-absorption) — sentence understandings + holistic evolution propagating into the holistic synthesis.
- L3.75 (within L3) → L4 — holistic synthesis consumed by northStar / scoreMatrix / coachingMap / coherence.
- L3.5 → L4 — paragraph analyses consumed by L4.
- improvementPhase → L4 + L5 — phase context consumed.
- L4 → L5 — northStar, scoreMatrix, coachingMap, coherenceReport consumed by L5.
- L5 → manifest → L6 — L5 outputs merged into ImprovementManifest, consumed by L6 coaching.
- Findings store → all layers — Finding lineage and maturity propagating across layers.
- Profile router → L5 (and other consumers) — the slicing contract.
- Conversator → analysis layers (L1, L3, L3.5, L4, L5) — GroundTruthFact / StoryFragment / IntentSignal consumed in subsequent iterations.
- IterationLedger → all layers — currentIteration, taughtMoves, recentDecisions read by various components.
- Edit-understanding → focused analyzer → all layers — diff and StalenessEffect drive carry-forward decisions.
- Re-analysis lifecycle → orchestrators → all layers — incremental re-analysis triggers.

**For each seam:**

- What does the producer emit (field shape, type, value range)?
- What does the consumer read?
- Is the contract symmetric (producer emits exactly what consumer reads)?
- Where the contract is asymmetric, is it deliberate (consumer reads a sub-slice) or a gap (consumer expects something producer doesn't produce)?
- What's the carry-forward classification at this seam?
- What happens at the seam under the no-fallback stance — when producer fails, how does consumer know?

**Approach:**

- Use the L5 consumption audit (270 rows) as the starting field-level inventory for L5 inputs.
- Build similar (lighter-weight) inventories for the seams that don't yet have them.
- Cross-reference against the implementation status matrix from F1 — note seams where the producer or consumer is partially implemented.

**Output:** integration contracts matrix at `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/INTEGRATION_CONTRACTS.md`. One row per seam. Columns: producer, producer-emit, consumer, consumer-read, symmetry-status (symmetric / sub-slice / gap), carry-forward classification, failure surface at the seam, implementation status, gaps to close before build phase.

**Effort:** 4–6 hours.

---

## 10. Phase F4 — Update or rewrite MASTER_INTEGRATION_PLAN.md

**Goal:** the master plan becomes the master plan. After Phases F0–F3, you know enough about the system iteration to elevate the master plan to coherence.

The revision integrates everything you've learned:

- Every per-layer PLAN's authoritative content named and cross-referenced.
- The L3.75 absorption fully integrated.
- The L4 pairedImprovement absorption fully integrated.
- The cross-cutting re-analysis lifecycle integrated.
- The L5 redesign as the deepest workstream, with its seven docs as authoritative for L5-internal contracts.
- The implementation status matrix as a layer-state foundation.
- The integration contracts at every seam.
- The four locked user-decisions (Q1, Q4, Q-A, Q-B).
- The standing charter principles (no-fallback stance, agent dispatch licensing, continuous revision, Tue system-level review at the end).

**Substantial revision is expected.** The master plan was written at one point in time; the L5 work and the per-layer absorption decisions have evolved beyond what it currently captures. The revised version is the canonical horizontal master view. Likely 1,500–2,500 lines after revision.

**Revision discipline:**

- Read the existing MASTER_INTEGRATION_PLAN.md fully.
- Identify what stands (the architectural narrative, the higher-level integration story).
- Identify what needs revision (specific layer claims, specific contracts, specific implementation-status assumptions).
- Identify what needs addition (the L3.75 absorption, the L4 absorption, the L5 redesign integration, the cross-cutting re-analysis integration, the integration contracts at every seam, the implementation status references, the standing charter).
- Revise in place, preserving useful content with supersession markers where claims have changed.

**Output:** revised `docs/pipeline-evolution/04-pipeline-architecture/MASTER_INTEGRATION_PLAN.md`.

**Effort:** 4–8 hours.

---

## 11. Phase F5 — Produce INTEGRATED_BUILD_SEQUENCE.md

**Goal:** the executable spine for the entire system iteration build. The `MASTER_INTEGRATION_PLAN.md` is horizontal narrative; this is vertical execution order.

**Scope:**

- All deliverables across all layers: L3 work, L3.5 work, L4 work (with L4b absorption), L5 work (the ~95 deliverables in `L5_IMPLEMENTATION_PLAN.md`), L6 work, cross-cutting infrastructure (orchestrator extensions, profile router updates, telemetry, persistence, etc.).
- The L3.75 → L3 absorption work as deliverables.
- Integration test points at every seam from F3.
- The final E2E run as the system-level pivot.

**Per-deliverable structure** (mirrors the L5 implementation plan's deliverable contracts):

- ID (e.g., D-L3-1.7, D-L4-2.3, D-L5-1.8, D-XCUT-1.1, D-INT-3.5).
- Type (type definition / migration / service / service-extension / prompt / fixture / integration test / cross-cutting).
- Workstream (L3, L3.5, L4, L5, L6, cross-cutting, integration).
- File path(s).
- Depends on (deliverable IDs).
- Blocks (deliverable IDs).
- Contract (types/signatures/inputs/outputs).
- Behavior spec.
- Failure surface.
- Validation (unit / integration / mock-LLM / API touchpoint).
- Estimated effort.

**Cross-cutting concerns from the L5 implementation plan extend to the integrated build:**

- No-fallback stance applied across every workstream.
- Carry-forward defaults declared per deliverable that touches profile state.
- Cost ledger across the whole build (the $10 cap covers the entire integrated build, not just L5).
- Tue review at the system level after the final E2E run.
- Halt-on-failure policy at every orchestration deliverable.
- Continuous test-running.
- Agent dispatch licensing.

**The integrated build sequence will be substantially larger than the L5 implementation plan alone** because it covers all workstreams. Likely 2,500–4,000 lines.

**Critical integration question to resolve in this phase:** which workstreams can run in parallel, which must be sequential? Concretely:

- Can L3 work and L5 work proceed in parallel, or does L5 depend on L3 completing first (because L5 reads from L3)?
- Can the Conversator (Phase 3 of the L5 plan) be built without L3.5 / L3.75 / L4 specifics-need-emission deliverables being complete? Or is the Conversator gated on those?
- Can the cross-cutting infrastructure (telemetry, profile router updates, orchestrator extensions) precede the layer work, or does some of it depend on layer types existing?

The integrated build sequence answers these explicitly per deliverable, with the dependency graph as the canonical source of truth.

**The cost cap.** The L5 implementation plan allocated $10 for L5-only API spend (mid-build touchpoints + final E2E). The integrated build covers more workstreams, so the cap may need to be revised. Either: (a) the $10 cap holds for the entire integrated build (in which case allocations across workstreams have to be tighter than the L5-only allocation), or (b) the cap is increased proportionally to cover the larger scope. **This is a Tue-decision; flag it explicitly in the document and propose both options for Tue's selection.**

**Output:** `docs/pipeline-evolution/04-pipeline-architecture/INTEGRATED_BUILD_SEQUENCE.md`.

**Effort:** 6–12 hours.

---

## 12. Phase F6 — Write the integrated build handoff prompt

**Goal:** the build-phase chat session opens against this prompt. After F0–F5 land, this prompt directs that session to execute the integrated build sequence with the standing charter intact.

The prompt:

- Names the build session as the implementer of the integrated system iteration build, not just L5.
- References the master workspace as the canonical foundation.
- References INTEGRATED_BUILD_SEQUENCE.md as the executable spine.
- Carries the standing charter forward: unlimited time, tokens, revisions, agents; the $10 cap (or whatever Tue selects in the F5 cost-cap proposal); no fallbacks; continuous revision; system-level Tue review at the end.
- Names the build session's first deliverable: typically Phase F0-equivalent reading of the master workspace and INTEGRATED_BUILD_SEQUENCE.md, then beginning at the integrated build sequence's first deliverable.
- Specifies the escalation rule, boundary of authority, operational reminders.
- Closes with the success criterion: the integrated system runs end-to-end on a real essay; Tue reviews the integrated output; the seven teaching moves land, multiplicity works, non-repetition holds, the iteration loop carries forward correctly, the Conversator integrates answers, every layer L1–L6 produces what the design specifies.

**Output:** `docs/pipeline-evolution/04-pipeline-architecture/INTEGRATED_BUILD_HANDOFF_PROMPT.md`.

The previous `L5_BUILD_HANDOFF_PROMPT.md` (whether at `docs/` root or in the L5/ subdirectory) gets a `[SUPERSEDED — see INTEGRATED_BUILD_HANDOFF_PROMPT.md]` marker at the top, so a stale handoff doesn't get used by mistake.

**Effort:** 2–4 hours.

---

## 13. The standing charter — third time, because the message has to survive a 20–40 hour multi-session foundation effort

This consolidation has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per phase**. There is no API budget for this work because no API calls happen during it. Everything else exists to support quality.

Every document you produce, every audit you run, every reconciliation you perform, every contract you specify, every word in the master plan and the integrated build sequence, gets the focus, care, and revision until it lands at the level the system iteration deserves. Do not optimize for anything except the depth and coherence of the foundation. Do not declare a phase complete when more reading or more thinking would make it sharper. Take the time. Spawn the agents. Revise until the document is right.

The system Tue described — and the larger system iteration that contains it — is what gets the foundation it deserves. Your work is producing that foundation.

---

## 14. Phase F7 — Final review and Tue sign-off

After F0–F6 land, the master workspace contains:

- README.md (existing; updated if the directory map changed).
- MASTER_INTEGRATION_PLAN.md (revised in F4).
- L3/PLAN.md (revised in F2 with reconciliation markers).
- L3-75/L3_ABSORBS_L3_75.md (existing; preserved).
- L3-5/PLAN.md (revised in F2 if reconciliation needed).
- L4/PLAN.md and ESSAY_NORTH_STAR_DESIGN.md (revised in F2 if reconciliation needed).
- L5/ — all seven L5 docs with reconciliation markers from F2.
- L6/PLAN.md (revised in F2 if reconciliation needed).
- cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md (existing).
- cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md (existing).
- cross-cutting/MASTER_PLAN_READING_NOTES.md (produced in F0).
- cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md (produced in F1).
- cross-cutting/L5_AND_MASTER_RECONCILIATION.md (produced in F2).
- cross-cutting/INTEGRATION_CONTRACTS.md (produced in F3).
- INTEGRATED_BUILD_SEQUENCE.md (produced in F5).
- INTEGRATED_BUILD_HANDOFF_PROMPT.md (produced in F6).

Re-read every document in the master workspace. Confirm internal consistency. Confirm every layer's contracts are satisfied. Confirm the integrated build sequence is executable. Confirm the handoff is honest.

Produce a final review summary at `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`:

- What changed across the workspace during F0–F6 (high-level summary).
- What's settled and what's open (the open questions tagged to gating phases).
- Which Tue-decisions are required before the build phase opens (cost-cap selection from F5; any architectural ambiguities surfaced during reconciliation).
- The build-phase entry conditions.

**Tue reviews the entire foundation.** This is the sign-off gate. Tue confirms the foundation is ready before the build chat opens. After Tue's sign-off, the build chat opens against `INTEGRATED_BUILD_HANDOFF_PROMPT.md`.

**Effort:** variable; depends on Tue's review depth and the corrections that emerge.

---

## 15. Operational discipline carried forward

The following carry forward from the L5 work and apply to your foundation work:

**No fallbacks** — applies to your writing. Where you find an architectural claim in a doc that is fundamentally a fallback ("we'll do X if Y fails"), question it. Most fallbacks are smell; the no-fallback discipline says single-owner-with-visible-failure is the design. If you propose to keep a fallback during reconciliation, document explicitly why it's not actually a fallback (it's deliberate independent architecture, like comprehensive-mode escalation in `selectAnalysisMode()`).

**LLM-first design principles** (from `feedback_llm-first-design.md`) apply throughout. Don't propose deterministic formulas for contextual judgments; don't propose closed taxonomies that limit LLM perception; don't propose discarding paid LLM output.

**Architecture migration discipline** (from `feedback_architecture_migrations.md`) — preserve what works in the legacy paths until the new path is E2E-validated.

**Vision-driven planning** (from `feedback_planning_preferences.md`) — don't list error handling, type safety, or validation as plan items. The integrated build sequence has functional capability deliverables, not maintenance deliverables.

**Cost discipline** (from `feedback_cost_budget.md`) — but for foundation work this is moot since no API calls happen.

**Agent and swarm dispatch.** Use them. Spawn agents per layer for parallel investigation in F1. Spawn agents for parallel reading of long docs where you don't need to read them yourself in F0. Spawn agents for parallel reconciliation work in F2. Spawn code-review-style agents to verify implementation status claims in F1. Whatever the deliverable benefits from.

**Continuous revision until quality lands.** Three rounds is the minimum. If a reconciliation document still has ambiguity on round three, do round four. The document is done when it is *right*, not when it has been "shipped."

**Long-form thinking per phase.** No phase ships in first draft. Read, think, write, review, revise, commit. Take the time.

---

## 16. Boundary of authority during foundation work

**You can do unilaterally:**

- Read every document in the workspace.
- Audit every component in the codebase for implementation status.
- Produce all the audit / reconciliation / contracts / build-sequence / handoff documents.
- Revise per-layer PLANs with supersession markers and clear annotations of what changed and why (Tue reviews these revisions in F7).
- Revise the L5 docs with supersession markers per F2's reconciliation findings.
- Add documents to the cross-cutting directory.
- Migrate the L5 docs from `docs/` root into `docs/pipeline-evolution/04-pipeline-architecture/L5/` if they aren't already there.
- Dispatch any agents the work benefits from.

**Requires Tue (mid-foundation escalation):**

- Architectural decisions that emerge from F2 reconciliation that aren't already settled in the existing docs (genuine architectural ambiguity).
- Cost-cap selection in F5 (the integrated build's cost cap — $10 across the integrated build, or higher).
- Any change to the four locked user-decisions (Q1, Q4, Q-A, Q-B).
- Removal of any existing PLAN's substantive content (you can revise; you can mark superseded; you cannot delete authoritative content without sign-off).

**At F7 — full Tue sign-off.** The entire foundation gets reviewed. Tue confirms before the build chat opens.

---

## 17. Operational reminders

- **You can use any tools available** — Bash, Read, Edit, Write, Grep, Glob, Agent dispatch (Explore, Plan, security-architect, general-purpose), the supabase MCP if RLS-policy reading is needed during status audit, the playwright/chrome-devtools MCP if UI-state inspection is needed.
- **Tue's chat is `tue.w.pham@gmail.com`**. Mid-foundation escalations go through this same chat session structure — interrupts to Tue are messages that surface a specific blocking question.
- **The current date is 2026-04-26.**
- **Memory** at `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/` carries durable user-feedback. Read alongside the workspace docs.
- **CLAUDE.md** at the repo root has development standards.
- **No API spend during foundation work.** Pure reading, pure thinking, pure writing. The $10 build cap is reserved for the build phase that opens after F7.
- **Branch hygiene:** the current working branch is `feat/wave-3a-phase-3b-3c`. Foundation work commits to this branch (or to a `docs/master-plan-consolidation` sub-branch — your call as long as Tue can review). The build chat will branch into `feat/integrated-pipeline-build` from wherever the foundation lands.

---

## 18. Closing — what success looks like

The master workspace contains a foundation that genuinely deserves the name "ultimate master plan."

- Every layer's PLAN has been reconciled with every other layer's PLAN and with the L5 docs.
- Every component's actual implementation status is known and documented.
- Every layer-to-layer integration contract is named, symmetric, and validated.
- The MASTER_INTEGRATION_PLAN.md is the horizontal master view, fully coherent.
- The INTEGRATED_BUILD_SEQUENCE.md is the vertical execution spine, executable deliverable-by-deliverable.
- The L5 docs are reconciled against the absorption decisions and the master plan.
- The cross-cutting docs are integrated with the layer story.
- The standing charter (no fallbacks, agent dispatch, continuous revision, system-level review) is articulated as workspace-wide discipline.
- The build-phase handoff prompt is ready to open a new chat that executes the integrated build coherently.

When Tue reads the consolidated workspace at F7, the impression is: **the entire system iteration has been thought through to depth across every layer, every seam, every cross-cutting concern. The build phase, when it opens, opens against a foundation that does not collapse under it.**

That is what every phase of this foundation work is for. Earn it.

Begin with Phase F0 — read `docs/pipeline-evolution/04-pipeline-architecture/README.md` first.
