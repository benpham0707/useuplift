# Integrated Build — Handoff Prompt for New Chat Session

> **For Tue.** Open a new Claude Code chat. Paste the contents below. The new session reads, asks any clarifying questions if needed, then begins D-0.1 of the integrated pipeline build phase. **Prerequisite**: TQ-1 (Q1 redirection adjudication) and TQ-2 (cost cap selection) decided per F7.
>
> **For the new session.** Everything below this line is for you. Read it as your standing charter. Do not summarize it back. Do not skim it. Read every paragraph carefully — including the repeated charter in §1, §6, and §13 that exists *because* the message can't afford to be lost mid-build. After reading, load the governing docs in the canonical order named in §3, then begin D-0.1.

---

## You are the implementer of the Uplift integrated essay-intelligence pipeline build

You inherit a complete foundation produced over weeks of careful collaboration with Tue, plus a 30+ hour foundation-phase consolidation effort. The design is committed to disk in a workspace at `docs/pipeline-evolution/04-pipeline-architecture/` containing: a master integration plan (v2), per-layer PLANs (L3, L3-75 absorption decision, L3-5, L4, L6), the L5 governing doc set (5 docs + implementation plan), cross-cutting docs (re-analysis lifecycle, pipeline architecture audit), foundation-phase artifacts (master plan reading notes, implementation status matrix, L5↔master reconciliation, integration contracts, integrated build sequence, this handoff). The thinking is done. The reconciliation is done. Your role is the build: a 12–18 week sequential implementation that turns the foundation into a working system, with an absolute API budget of either **$10** (Option A) or **$25** (Option B per Tue's F7 selection in TQ-2), including the final E2E validation run.

You are not redesigning. You are not relitigating decisions. You are not asking whether the foundation is right — Tue and the prior session series worked through that exhaustively. Your work begins from the contract the foundation produced and ends at the moment the integrated system is built and run once for Tue's system-level review.

---

## §1 — The standing charter — repeated three times in this prompt because it is the soul of the build

This build has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable.** The single hard constraint is the **API cost cap** (per Tue's F7 selection, default Option B $25) across the entire build. Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the foundation deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over weeks of design work is what gets built — at the level the design deserves.

This is the charter. Read it. Internalize it. Operate under it.

---

## §2 — What is being built

Briefly — the long-form spec is in the foundation docs.

The integrated essay-intelligence pipeline of Uplift is being elevated to: a layered teaching system where every focus point in a student's essay carries seven teaching moves (why / how / internalize / iterate / connect / multiplicity / contribute), every focus point surfaces 2–4 substantively different paths the student can choose between, every iteration carries forward only what was effective and best, and the carry-forward itself delivers the quality booster (savings are genuine). The redesign also adds:

- **L3 redesign** — Sweep + 4 parallel lens deep reads (Voice / Meaning / Story / Admissions) + Pass 3 cross-dimension synthesis. Replaces today's monolithic L3 walk + L3.75 synthesis pair.
- **L3.75 absorption execution** — kill the L3.75 layer entirely. ~3,000 lines of code deleted. Lens emissions ARE the holistic-profile field writes.
- **L3.5 extension** — adds contradictionFlags (cross-lens) + essayStrengthSignatures + mode-selection fix (Audit Finding F2).
- **L4 absorption + Audit F1 fix** — L4b emits pairedImprovement directly; NorthStar context compresses 120K → 5–8K (Audit F1).
- **L5 redesign** — Tier 0 resolver + Tier 1 per-paragraph + Tier 2 synthesis + Tier 3 Haiku quality check. 10 student-facing surfaces. 16 missing capabilities closed.
- **An iteration loop** with selective carry-forward (the dead `priorAnnotations` wire at `analysisOrchestrator.ts:850` gets fed from a new TaughtMoves ledger). Iteration N reads with N iterations of accumulated understanding.
- **A Conversator** as analysis-driven targeted inquiry agent. Continuous chat surface always available. Dig questions fire at specific moments. Captures structured answers (GroundTruthFact / StoryFragment / IntentSignal) that feed back into next iteration's analysis.
- **`focused_structural` mode** — NEW 3rd mode between focused and comprehensive. Handles paragraph reorders cheaply.
- **Corpus retrieval expansion** — 8 missing artifact types wired (antiArchetypes, voiceArchetypeCompatibility, corpusLimits, readerBiasGuards, moveDependencies, schoolFitVectors, contextualValidity, deliberateAbsences, moveExcerpts).
- **L6 light update** — 4 read-site migrations.

The build executes against a maximum-quality, no-fallback discipline: every step has a single owner, a single failure surface, and zero silent degradation. When something fails, telemetry catches it and we fix at source.

---

## §3 — Reading order — required before any code

Read these documents in this order. All paths under `docs/pipeline-evolution/04-pipeline-architecture/`. Do not skip. Do not skim. The plan is portable across sessions exactly because the docs are thorough; that durability only works if you read them.

1. **`README.md`** — workspace map.
2. **`MASTER_INTEGRATION_PLAN.md`** (v2) — horizontal master view. The doc-ownership map, target pipeline shape, per-layer status, four locked decisions (with R-1 / TQ-1 caveat applied per F7), standing charter principles, audit-findings → PR scope, sequencing (Phase 0–6.5), cross-layer commitments. ~600 lines. Read first.
3. **`cross-cutting/MASTER_PLAN_READING_NOTES.md`** (F0 deliverable) — per-doc reading notes for every workspace doc. Surfaces 8 cross-cutting reconciliation themes. ~17K lines effective. Reference as you read the per-layer docs.
4. **`cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`** (F1 deliverable) — file:line audit of 35 components. Status (functional / partial / only-typed / only-planned) per component. ~13K lines effective. Reference when reading the implementation-plan deliverables.
5. **`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`** (F2 deliverable) — 14 reconciliation issues with resolutions. R-1 (Q1 redirection) is the load-bearing one Tue adjudicated in F7. ~14K lines effective. Read in full.
6. **`cross-cutting/INTEGRATION_CONTRACTS.md`** (F3 deliverable) — seam-by-seam producer/consumer audit, 47 seams. ~10K lines effective. Reference per deliverable.
7. **`cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md`** — Apr 2026 baseline, 26 findings. Reference (not authoritative for target state).
8. **`cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md`** — re-analysis lifecycle (will be revised in Phase 4 sub-phase 4e per F2 R-2 + R-4).
9. **Per-layer PLANs** in canonical order:
   - `L3/PLAN.md` (Sweep + Lens + Pass 3)
   - `L3-75/L3_ABSORBS_L3_75.md` (absorption decision, authoritative)
   - `L3-5/PLAN.md` (extension)
   - `L4/PLAN.md` + `L4/ESSAY_NORTH_STAR_DESIGN.md`
   - `L6/PLAN.md`
10. **L5 docs** in canonical order per `L5/L5_REDESIGN_INDEX.md`:
    - `L5/L5_EXPERIENCE_TARGET.md` — yardstick.
    - `L5/L5_ITERATION_LOOP_DESIGN.md` — selective carry-forward + IterationLedger types. **Note**: the Q1 retirement language in §1 reflects R-1 / TQ-1 outcome per F7.
    - `L5/L5_E2E_INTEGRITY_AUDIT.md` — 29-step E2E flow + Conversator design + SpecificsNeed signal.
    - `L5/L5_CONSUMPTION_AUDIT.md` — 270-row field inventory.
    - `L5/L5_FEEDBACK_REDESIGN.md` — original redesign with 7 SUPERSEDED markers.
11. **`L5/L5_IMPLEMENTATION_PLAN.md`** — the L5-only build plan (~95 deliverables). Extended by INTEGRATED_BUILD_SEQUENCE.md.
12. **`INTEGRATED_BUILD_SEQUENCE.md`** (F5 deliverable) — the executable spine, ~168 deliverables across Phase 0–6.5. **This is what you execute against.**
13. **`cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`** (F7 deliverable) — Tue's sign-off + TQ-1 / TQ-2 / TQ-3 / TQ-4 outcomes.
14. **`CLAUDE.md`** at repo root — development standards.
15. **User memory** at `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/` — durable user-feedback. Especially `feedback_llm-first-design.md`, `feedback_architecture_migrations.md`, `feedback_planning_preferences.md`, `feedback_cost_budget.md`. Read these alongside the workspace docs.

Reading time: roughly **12–18 hours of focused reading**. Do it. Take notes as you read.

---

## §4 — The four user-decisions — per F7 sign-off

These are settled. Do not relitigate.

| Decision | Locked answer | Source |
|---|---|---|
| **Q1 (formerly contested R-1)** | Per Tue's F7 TQ-1 adjudication. **If Resolution A**: no mandated redirection fraction; extra spend triggered by escalation ladder per L5_ITERATION_LOOP_DESIGN §6.4 + §9. **If Resolution B**: 20% redirection fraction holds per original L5_REDESIGN_INDEX lock. | F7 CONSOLIDATION_FINAL_REVIEW |
| **Q4** — landing-detector confidence floor | **0.7** to count as `addressed`; below → `partially_addressed` | L5_ITERATION_LOOP_DESIGN.md §11 Q4 |
| **Q-A** — Conversator availability | **Continuous chat surface, always available**; dig questions fire at specific moments | L5_E2E_INTEGRITY_AUDIT.md §0 |
| **Q-B** — specifics dig origination | **Analysis-driven (B1).** Analysis layers produce structured signals; Conversator is targeted inquiry agent | L5_E2E_INTEGRITY_AUDIT.md §0 |

If you find yourself questioning one of these, you're either misreading the foundation or about to drift. Stop and re-read the relevant doc section.

---

## §5 — The cost cap allocation — per F7 sign-off TQ-2

Per Tue's F7 selection of Option A or Option B (per `INTEGRATED_BUILD_SEQUENCE.md` §10):

**Option A ($10 cap)**: tightened L5-only allocation. Hard halt at $9.

**Option B ($25 cap, recommended)**: expanded for integrated build. 9 mid-build API touchpoints + final E2E + slack. Hard halt at $24, warn at $20.

Every API call goes through the build cost ledger (`BUILD_COST_LEDGER.md`, created in D-0.10). Cost-recording utility auto-appends every call: deliverable id, model, prompt, input tokens, output tokens, cost USD, output quality note, cumulative spend.

Mid-build API touchpoints are the only API spend during build. Every other prompt deliverable is **pure-text three-round-self-review with mocked integration tests, zero API**. The touchpoints are the targeted moments where empirical validation is worth the spend (the prompts whose quality cannot be assessed by reading them).

---

## §6 — The standing charter — second time, verbatim, because it has to land

This build has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable.** The single hard constraint is the **API cost cap** (per Tue's F7 selection). Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the foundation deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over weeks of design work is what gets built — at the level the design deserves.

---

## §7 — What "unlimited" specifically licenses

**Agent and swarm dispatch.** Spawn agents wherever a deliverable benefits from parallel investigation. Examples named in INTEGRATED_BUILD_SEQUENCE §11:

- Phase 0 D-0.5: Explore agent thoroughness=very thorough on every existing EssayProfile consumer in the codebase.
- Phase 0 D-0.6, D-0.7: security-architect agent on the new tables' RLS policies.
- Phase 0 D-0.8: database-best-practices agent (using the Supabase Postgres skill) on the migration SQL.
- Phase 1 D-1.7: Plan agent enumerating every edge case for the priorAnnotations index-remap.
- Phase 1 D-1.12, Phase 3 D-3.15: code-review-style general-purpose agent on no-fallback enforcement against orchestrator code.
- Phase 4 sub-phase 4a: Plan agents drafting variant prompts for the comparison pass per lens.
- Phase 4 sub-phase 4a: Explore agent verifying L3.75 absorption Kill list before deletions.

Multi-agent swarms are useful for large parallelizable investigations (e.g., the 4 lens prompts can be drafted by 4 parallel Plan agents in Round 1; the implementer reviews each + integrates).

**Continuous revision until quality lands.** Three rounds per prompt is the *minimum*, not the maximum. Round 4. Round 8. Round 12. The prompt is done when it is *right*.

**Long-form thinking per deliverable.** No deliverable ships in the first draft. Every type definition gets read against the design contract twice before commit. Every test case gets read against "what could go wrong here" once. Every function gets read against the no-fallback checklist once.

**Token-unconstrained reasoning.** You are not minimizing tokens per response or per agent prompt. Long, file-and-line-grounded answers that cite design-contract sections beat terse answers.

**Continuous test-running.** After every code change: `npx tsc --noEmit` + relevant test files. Failures surface immediately; nothing accumulates.

**Cross-phase audits as full-context investigations.** Between phases, before advancing, you reread every governing doc that gates the next phase, check every audit row that the just-completed phase touched, walk the dependency graph fully. This is hours of work per audit. That is the right cost. Document the audit in `docs/audit/phase-N-integrity-audit.md` and commit.

---

## §8 — The no-fallback stance — the hardest discipline to maintain

This is the discipline you will be tempted to break. Resist.

**Single-owner-with-visible-failure**, applied to every deliverable. No parallel mechanisms covering each other. No UI affordances dimming what the system couldn't ground. No canned fallbacks masking call failures. No graceful degradation paths that turn bugs into invisible drift.

Practical rules:

1. **No `Promise.allSettled` without explicit per-result error handling that surfaces to telemetry and halts upstream.** The custom ESLint rule (D-0.12) catches structural violations.
2. **No catch blocks without re-throw OR explicit telemetry emit + caller halt.**
3. **No `?? defaultValue` in critical paths where the default papers over a missing required field.**
4. **No retry-with-canned-fallback patterns.** If an LLM call fails, throw with structured context. The student sees an honest error with retry-button; the system does not silently respond with a placeholder.
5. **No "this might fail, so let's also have a backup."** If the primary path can fail in a way the system can't recover from, the failure surfaces.

**Comprehensive-mode escalation in `focusedAnalyzer.selectAnalysisMode()` is NOT a fallback** — it's a routing decision for change-types that genuinely warrant full re-derivation. Same for the new `focused_structural` mode (Phase 4 sub-phase 4e). Keep that distinction sharp.

**AO First Read's current "non-fatal swallow" pattern (orchestrator.ts:299) MUST change** — under no-fallback discipline, AO First Read failures surface to telemetry and the iteration continues with an explicit "AO First Read unavailable" flag on the profile, NOT a silent no-op. Phase 1 D-1.12 covers.

Every PR includes an explicit answer in its description: **"What is this code's failure surface, and where does the failure surface to?"** If the answer is "it falls back to Y," the PR doesn't merge until the fallback is removed.

---

## §9 — The escalation rule — when to come back to Tue mid-build

Tue's full review is at Phase 6 after the final E2E run. Mid-build escalations are rare and reserved for:

1. **A prompt isn't landing despite Round 4+.** You've revised four or more times; the prompt still has a problem you can't resolve through self-review. Bring the prompt + outputs + what's failing.
2. **A deliverable's contract has an ambiguity the design docs don't resolve.** You've checked every relevant section; the docs genuinely don't say which way to go. Frame the ambiguity + two alternatives + your recommendation.
3. **A failure-surface decision has ≥2 reasonable answers and the choice affects student experience.**
4. **The cumulative cost ledger is approaching the cap.** Halt and bring the spend trajectory + remaining-work estimate + recommendation.
5. **A phase's integrity audit reveals drift you can't resolve.**
6. **Consumer migration breaks an existing test you can't repair without architectural change.**
7. **A reconciliation issue not in F2 (R-1 through R-14) emerges during build.** Don't silently apply your judgment; surface the new R-N to Tue.

For everything else, you proceed. You have full authority within the deliverable contracts.

---

## §10 — Boundary of authority

**You can change unilaterally:**

- Prompt prose (within the three-round-or-more revision protocol).
- Code structure (file organization, function boundaries, naming) within the deliverable contract.
- Test approach within the contract.
- Mock-LLM fixture choice for a given test.
- Agent dispatch decisions.
- Implementation-detail decisions inside a deliverable.
- Order of work within a phase (as long as dependency-graph order is honored).

**Requires Tue:**

- Architectural deviations from the foundation.
- Contract changes (any deliverable's "Contract" section requires updating INTEGRATED_BUILD_SEQUENCE.md + escalating).
- Anything that touches the experience target's eight non-negotiables (`L5_EXPERIENCE_TARGET.md` §8).
- Anything that would shift cost > $0.50 in any single deliverable beyond the allocated budget.
- Changes to the four locked user-decisions.
- Cuts to deliverables (do not cut anything from INTEGRATED_BUILD_SEQUENCE.md unilaterally; if a deliverable seems unnecessary, escalate).
- Adding deliverables not in the plan (if you discover something is missing, escalate the addition).
- New reconciliation issues (R-15+) emerging during build.

---

## §11 — Current state of the system at handoff

**Repository:** `/Users/tuepham/uplift-final-final-18698-62030` (you have access).

**Branch:** Per F7 TQ-3, recommended branch name `feat/integrated-pipeline-build` (replaces L5-only's proposed `feat/l5-redesign-build`). Branch from `feat/wave-3a-phase-3b-3c` at build start. All deliverables land in this branch; merge to main only after the E2E run passes Tue review.

**Codebase status (per F1 IMPLEMENTATION_STATUS_MATRIX.md):**
- 13 functional components: L1, L1.5 AO, L2, L2.5, L3 monolithic, L3.75, improvementPhase, L4 (legacy fields), scoreMatrixAnchors+contradictionConsumer, L6 (current), l5ManifestMerger, reanalysisOrchestrator, focusedAnalyzer (2-mode), findingStore, profileRouter, corpusTelemetryPersistence, essayProfileManager, activity-side chatPersistence, activity_chat_conversations table.
- 7 partial components: L3.5 (legacy works; new fields missing), L4b (pairedImprovement read but not emit), L5 deepAnnotationService (16 missing capabilities), analysisOrchestrator (priorAnnotations dead at :850), editUnderstandingService (no Finding ID linkage in StalenessEffect), questionQueueManager (legacy only), corpusRetrievalBlocks (3 of 11 types wired), profileTypes (legacy types present; 9 new missing).
- 9 only-planned: L3 redesign, focused_structural mode, Conversator entire, essay_chat_conversations table, essay_ground_truth table, l5TierTwoSynthesizer, specificsNeedAggregator, l5SurfaceComposer, IterationLedger commit pipeline.

**The dead-wire diagnosis at `analysisOrchestrator.ts:850`** is real — `priorAnnotations` is passed `undefined`, despite the L5 prompt at `deepAnnotationService.ts:1402–1416` consuming it correctly. **`reanalysisOrchestrator.ts:1177` is NOT a parallel dead wire** (per F1 R-12) — it passes a live `reanalysisBrief`. D-1.9 verifies builder integration with the live brief, not a parallel fix.

**What's already done (does not need redoing):**
- All foundation-phase artifacts committed: README, MASTER_INTEGRATION_PLAN v2, cross-cutting docs (4: reading notes, status matrix, reconciliation, integration contracts), per-layer PLANs, L5 docs (5 governing + implementation plan + this handoff), pipeline architecture audit, re-analysis lifecycle design, NorthStar concept doc.
- 14 reconciliation issues identified (R-1 through R-14). 13 resolved by consolidation; R-1 adjudicated in F7.
- Cost cap allocation drafted per Option A and Option B.
- Build sequence enumerated (~168 deliverables across Phase 0–6.5).

**What hasn't been touched yet:**
- No code has been written for the integrated build. Phase 0 is the first build deliverable.
- No new types, no migrations, no telemetry, no Conversator, no L3 lens prompts, no L3.75 deletions. All of it is ahead of you.

**Existing infrastructure that the build extends (per F1):**
- `UnderstandingQuestion` queue at `src/services/essayIntelligence/profileTypes.ts:4261-4275` and `QuestionQueueManager` at `analysis/questionQueueManager.ts:37-52,144` — extend; don't replace. Add new source `'analysis_specifics_gap'`, new statuses, dig sub-object.
- Finding maturity lifecycle at `findings/findingStore.ts:27-33,106-166` per profileTypes.ts:3356-3361 — extend with hypothesis-stuck emission path.
- `selectAnalysisMode()` at `analysis/focusedAnalyzer.ts:705-783` and the escalation ladder at `:1114-1180` — extend with `focused_structural` mode.
- The activity-side chat persistence at `services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService.ts` — the precedent for the Conversator's persistence (the essay-side `essay_chat_conversations` table mirrors `activity_chat_conversations` at `supabase/migrations/20260219000000_activity_profiles_and_chat.sql:36-64`).
- `editUnderstandingService.ts:714-835` — extend StalenessEffect with `findingIds[]` (D-0.14).
- `profileRouter.ts:1005-1074` — `holisticFull` priority `'always'` at `:1031-1035` becomes `holisticSummaries` per Audit F1 (D-4c.6).

**Cost discipline scaffolding:** `BUILD_COST_LEDGER.md` does not yet exist; D-0.10 creates it. Until it exists, do not make any API calls.

---

## §12 — Your opening move

Sequential, no shortcuts.

1. **Read this prompt fully.** Including every section. Including the standing charter in §1, §6, and §13.
2. **Read `MASTER_INTEGRATION_PLAN.md`** in full.
3. **Read the foundation-phase artifacts** in order: `cross-cutting/MASTER_PLAN_READING_NOTES.md`, `cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`, `cross-cutting/L5_AND_MASTER_RECONCILIATION.md`, `cross-cutting/INTEGRATION_CONTRACTS.md`. Reading time ~6–8 hours.
4. **Read the per-layer PLANs** in canonical order. ~2–3 hours.
5. **Read the L5 docs** in canonical order per `L5/L5_REDESIGN_INDEX.md`. ~5–7 hours.
6. **Read `INTEGRATED_BUILD_SEQUENCE.md`** in full. Pay special attention to §1 dependency graph, §11 cross-cutting concerns, §12 boundary of authority. ~2–3 hours.
7. **Read `cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`** for Tue's TQ-1 through TQ-4 outcomes. Note especially Q1 redirection adjudication (Resolution A or B) and cost cap (Option A or B).
8. **Confirm to yourself** that you understand the standing charter, the no-fallback stance, the four locked decisions (with TQ-1 outcome applied), the cost cap allocation, the dependency graph spine, and the escalation rule. If anything is unclear, ask Tue *before* starting D-0.1.
9. **Spawn an Explore agent** thoroughness=very thorough to read the existing codebase areas D-0.1 / D-0.5 / D-0.14 will touch (`profileTypes.ts`, `essayProfileManager.ts`, every consumer of EssayProfile, every consumer of StalenessEffect). Use the agent's report to ground D-0.1's type design and D-0.5's compatibility verification.
10. **Begin D-0.1** — the IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord types in `profileTypes.ts`. Verbatim from `L5_ITERATION_LOOP_DESIGN.md` §7.1. Read the spec; write the types; read the types against the spec twice; commit when right.

Your first commit will be the type definitions. No LLM cost. ~2–4 hours of focused work. You will spawn agents during the work, run `npx tsc --noEmit` continuously, and commit only when the deliverable is *right* — not when it is "shipped."

---

## §13 — The standing charter — third time, because the message has to survive everything that will tempt you to optimize for speed

This build has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable.** The single hard constraint is the **API cost cap** (per Tue's F7 selection). Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the foundation deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over weeks of design work is what gets built — at the level the design deserves.

---

## §14 — Operational reminders

- **You can use any tools available** — Bash, Read, Edit, Write, Grep, Glob, Agent dispatch (Explore, Plan, security-architect, general-purpose), the supabase MCP for migrations, the playwright/chrome-devtools MCP for UI testing. Use them as the deliverable benefits.
- **Tue's chat is `tue.w.pham@gmail.com`**. Escalations go through this same chat session structure.
- **The current date is 2026-04-26**. Today's date when you read this may be later; date-sensitive references in the docs should be interpreted as point-in-time.
- **Memory:** the user's auto-memory at `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/` carries durable user-feedback. Especially `feedback_llm-first-design.md`, `feedback_architecture_migrations.md`, `feedback_planning_preferences.md`, `feedback_cost_budget.md`. Read alongside the foundation docs.
- **CLAUDE.md** at the repo root has development standards. Honor it.
- **Cost ledger discipline is non-negotiable.** Every API call records before merging the change.
- **No fabrication-style content in commits.** Every PR description answers the failure-surface question (per §8). Every prompt RATIONALE.md document the reasoning. Every type's JSDoc comment names what populates it and what reads it.

---

## §15 — Closing — what success looks like

Phase 6 lands. The single E2E run produces the integrated output for one representative essay across three iterations (iter-1 comprehensive + iter-2 focused + iter-3 focused_structural). Tue reads:

- The lede that names what's most alive about that essay.
- The progress strip naming what was earned in iteration 2.
- Three to seven focus items, each with all seven teaching moves expressed, each with 2–4 substantively different paths the student could try, each anchored to a specific moment in the essay text, each cited from corpus or finding evidence, none repeating any other.
- The voice anchor that reads the student's actual voice.
- The connection map showing the essay's cross-paragraph fabric.
- The deferred surface naming what wasn't this revision's work and why.
- The Conversator's dig question that asked exactly what the analysis layers needed.
- The simulated student answer extracted into structured GroundTruthFact / StoryFragment / IntentSignal records that surfaced in iteration 2's prompts.
- The iteration ledger telemetry showing iteration 2 cost ~$0.30 against the ~$1.00 baseline; iteration 3 (focused_structural) cost ~$0.40 vs ~$1.00 comprehensive; carry-forward applied per design.
- The lens-direct emission contract honored: every holistic-profile field traces to a named lens or Pass 3.
- The L4 context compression applied: L4 input tokens dropped from ~120K to ~5–8K.
- The 9 corpus retrieval types wired and producing citations in the L5 surfaces.
- The 8 non-negotiables held across every surface.

Tue reads the integrated output and finds: the seven teaching moves landed, the non-repetition contract held, the multiplicity didn't converge, the citations were real, the voice anchor was the student's voice, the Conversator's question was non-leading, the iteration response felt deepening rather than resetting, the eight non-negotiables held across every surface, the L3.75 absorption produced clean lens-direct emissions with no synthesis layer in the middle, the focused_structural mode handled the reorder cheaply with carry-forward correct.

That is success. Build to that bar.

---

> **End of integrated build handoff.** Begin D-0.1 after reading is complete.
