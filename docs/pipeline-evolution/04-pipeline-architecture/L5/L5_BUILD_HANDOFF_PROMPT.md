# L5 Build — Handoff Prompt for New Chat Session

> **[SUPERSEDED 2026-04-26 — see `../INTEGRATED_BUILD_HANDOFF_PROMPT.md`]**
> The L5-only build handoff is replaced by the integrated build handoff covering all workstreams (L3 redesign, L3.75 absorption execution, L3.5 extension, L4 absorption + Audit F1 fix, L5 redesign, Conversator, focused_structural mode, corpus retrieval expansion, UI surfaces, L6 light update). The L5-only $10 cap may be expanded to $25 per Tue's F7 TQ-2 selection. Do not use this handoff for the integrated build.
>
> **Original (preserved for historical reference):**

> **For Tue:** Open a new Claude Code chat. Paste the contents below. The new session reads, asks any clarifying questions if needed, then begins D-0.1 of the L5 redesign build phase.
>
> **For the new session:** Everything below this line is for you. Read it as your standing charter. Do not summarize it back. Do not skim it. Read every paragraph carefully — including the repeated charter in §1, §6, and §13 that exists *because* the message can't afford to be lost mid-build. After reading, load the governing docs in the canonical order named in §3, then begin D-0.1.

---

## You are the implementer of the Uplift L5 redesign

You inherit a complete design produced over multiple days of careful collaboration with Tue. The design is committed to disk in six governing documents totaling ~5,300 lines. The thinking is done. Your role is the build: a 12–16-week sequential implementation that turns the design into a working system, with an absolute API budget of **$10** across the entire build — including the final E2E validation run.

You are not redesigning. You are not relitigating decisions. You are not asking whether the design is right — Tue and the prior session worked through that exhaustively. Your work begins from the contract the design produced and ends at the moment the integrated system is built and run once for Tue's system-level review.

---

## 1. The standing charter — repeated three times in this prompt because it is the soul of the build

This build has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable**. The single hard constraint is the **$10 absolute API cap across the entire build**. Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the design deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over days of design work is what gets built — at the level the design deserves.

This is the charter. Read it. Internalize it. Operate under it.

---

## 2. What is being built

Briefly — the long-form spec is in the governing docs.

The L5 (feedback) layer of Uplift's Essay Intelligence pipeline is being redesigned. The current system produces feedback that a sophisticated user could approximate with one Claude session — it has the moat (14 reviewed admits with paragraph annotations, 190 named craft moves, 53 anchored exemplar excerpts, 14 archetypes, 11 anti-archetypes, a 98-cell voice-archetype matrix, 18 corpus limits, 14 reader-bias guards, 75 issue patterns, 95 school-fit records) but doesn't cite back to the student. The redesign closes the wiring failure between the data the system has and the feedback it emits, and elevates the experience to what Tue described: a layered teaching pass where every focus point in a student's essay carries seven teaching moves (why / how / internalize / iterate / connect / multiplicity / contribute), every focus point surfaces 2–4 substantively different paths the student can choose between, and every iteration carries forward only what was effective and best while saved budget redirects automatically into deeper teaching on the parts that changed.

The redesign also adds:

- **An iteration loop** with selective carry-forward (the dead `priorAnnotations` wire at `analysisOrchestrator.ts:850` gets fed from a new TaughtMoves ledger). Iteration N reads the essay with N iterations of accumulated understanding; non-repetition extends across turns architecturally.
- **A Conversator** as analysis-driven targeted inquiry agent: the analysis layers know what specifics they need (a SpecificsNeed signal extends the existing `UnderstandingQuestion` queue); the Conversator asks the student for those specifics with non-leading questions, captures answers, structures them into `GroundTruthFact` / `StoryFragment` / `IntentSignal` records, and feeds them back into the next iteration's analysis prompts.
- **Ten student-facing surfaces** (lede, progress strip, focus card with multiplicity, connection map, voice anchor, score accordion, deferred surface, iteration response, Conversator panel, conversator-grounded chat) replacing the current annotation-flat L5 UI.

The build executes against a maximum-quality, no-fallback discipline: every step has a single owner, a single failure surface, and zero silent degradation. When something fails, telemetry catches it and we fix at source.

---

## 3. Reading order — required before any code

Read these documents in this order. All paths under `docs/`. Do not skip. Do not skim. The plan is portable across sessions exactly because the docs are thorough; that durability only works if you read them.

1. **`docs/L5_REDESIGN_INDEX.md`** — the doc-ownership map, canonical reading order, supersession links, six load-bearing principles, four locked user-decisions. ~150 lines. Read this first.

2. **`docs/L5_EXPERIENCE_TARGET.md`** — the yardstick. What the student feels. The seven teaching moves, the non-repetition contract, the divergent-path multiplicity (Move 6), the ten surfaces, the eight non-negotiables, the journey, the overrides on the original redesign doc. ~450 lines. Read every section. The non-negotiables in §8 are the contract you build to.

3. **`docs/L5_ITERATION_LOOP_DESIGN.md`** — selective carry-forward as quality booster + cost optimizer. The 40-row carry-forward inventory in §3 is reference material you'll consult continuously. The IterationLedger / TaughtMove / CarryForwardDecision types in §7.1 are committed verbatim into the codebase by D-0.1. The 5-iteration cost trajectory in §8 backs your cost-discipline mental model. ~626 lines.

4. **`docs/L5_E2E_INTEGRITY_AUDIT.md`** — the integration spine. The 29-step E2E student flow with per-step ownership / inputs / outputs / failure surface in §2. The Conversator design in §4. The SpecificsNeed signal design in §3. The structured-answer types in §4.5. The no-fallback diff in §6 lists every place fallbacks were removed across the prior docs. ~693 lines.

5. **`docs/L5_CONSUMPTION_AUDIT.md`** — the field-level inventory, ~270 rows mapping every upstream field to its source layer, defined-at file:line, production cost, current consumer, proposed consumer, verdict, carry-forward default, rationale. The yardstick the build measures against per-row. §A1 carry-forward classification, §A2 surface rewire, §A3 new state types are the addendum the build phase consumes. ~470 lines.

6. **`docs/L5_FEEDBACK_REDESIGN.md`** — the original L5 redesign. **Carries `[SUPERSEDED — see ...]` markers at seven sections.** Mostly preserved as historical context and partial source-of-truth. Read with awareness of the supersession map in the index doc. ~1010 lines.

Then:

7. **`docs/L5_IMPLEMENTATION_PLAN.md`** — the single canonical sequential build plan. ~95 deliverables across six build phases plus the final E2E validation. Each deliverable has a contract, a behavior spec, a failure surface, a validation path, an effort estimate, a revision discipline. This is what you execute against. ~2200 lines.

Reading time: roughly 4–6 hours of focused reading. Do it.

---

## 4. The four user-decisions — locked in writing

These are settled. Do not relitigate.

| Decision | Locked answer | Source |
|---|---|---|
| Q1 — redirection fraction | **20%** of carry-forward savings reinvested into deeper treatment of changed paragraphs | iteration design §11 Q1 |
| Q4 — landing-detector confidence floor | **0.7** to count as `addressed`; below → `partially_addressed` | iteration design §11 Q4 |
| Q-A — Conversator availability | **Continuous chat surface, always available**; analysis-initiated dig questions fire at specific moments (after first feedback, between iterations, when student is stuck) | this session 2026-04-26 |
| Q-B — specifics dig origination | **Analysis-driven (B1).** Analysis layers produce structured signals naming what they need; Conversator asks, captures, structures, feeds back. The Conversator's flexibility is in *how* to ask (non-leading), *when* to fire (timing), *how to handle nuance* — not in deciding *what* to ask. | this session 2026-04-26 |

If you find yourself questioning one of these, you're either misreading the design or about to drift. Stop and re-read the relevant doc section.

---

## 5. The $10 cap allocation

| Bucket | Amount | Purpose |
|---|---|---|
| Final E2E run | $1.30 | iter-1 (~$1.00) + iter-2 focused (~$0.30) |
| Final E2E fix-cycle re-runs | $2.20 | up to ~7 cycles at ~$0.30 each |
| Phase 1 — landing detector calibration | $0.50–$1.00 | mid-build API touchpoint #1 |
| Phase 2 — specifics-need emission sanity | $0.50–$1.00 | mid-build API touchpoint #2 |
| Phase 3 — Conversator dig + extractor sanity | $1.50–$2.00 | mid-build API touchpoint #3 |
| Phase 4 — L3.75 targeted-refresh contamination check | $1.00–$1.50 | mid-build API touchpoint #4 |
| Phase 4 — Tier 2 non-repetition smoke | $0.50–$1.00 | mid-build API touchpoint #5 |
| Slack | $0.30–$1.50 | unallocated buffer |

**Total cap: $10. Hard halt at $9. Warn at $7.**

Every API call goes through the build cost ledger (`BUILD_COST_LEDGER.md`, created in D-0.10). Cost-recording utility auto-appends every call: deliverable id, model, prompt, input tokens, output tokens, cost USD, output quality note, cumulative spend.

Mid-build API touchpoints are the only API spend during build. Every other prompt deliverable is **pure-text three-round-self-review with mocked integration tests, zero API**. The five touchpoints are the targeted moments where empirical validation is worth the spend (the prompts whose quality cannot be assessed by reading them — landing-detection calibration, specifics-need emission triggering, Conversator non-leading composition + parallel extraction, L3.75 section-mask honoring, Tier 2 non-repetition under repetitive priors).

---

## 6. The standing charter — second time, verbatim, because it has to land

This build has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable**. The single hard constraint is the **$10 absolute API cap across the entire build**. Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the design deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over days of design work is what gets built — at the level the design deserves.

---

## 7. What "unlimited" specifically licenses

**Agent and swarm dispatch.** Spawn agents wherever a deliverable benefits from parallel investigation. Examples named in the implementation plan §12.7:

- Phase 0 D-0.5: Explore agent thoroughness=very thorough on every existing EssayProfile consumer in the codebase.
- Phase 0 D-0.6, D-0.7: security-architect agent on the new tables' RLS policies.
- Phase 0 D-0.8: database-best-practices agent (using the Supabase Postgres skill) on the migration SQL.
- Phase 1 D-1.7: Plan agent enumerating every edge case for the priorAnnotations index-remap.
- Phase 1 D-1.12, Phase 3 D-3.15: code-review-style general-purpose agent on no-fallback enforcement against orchestrator code.
- Phase 4 D-4.2: parallel Plan agents drafting variant prompts for the comparison pass.

Multi-agent swarms are useful for large parallelizable investigations; spawn them when a single agent would be insufficient.

**Continuous revision until quality lands.** Three rounds per prompt is the *minimum*, not the maximum. If round 3 still has a sentence that leads the student or a constraint that's too soft or an output schema that's ambiguous, do round 4. Do round 8. Do round 12. The prompt is done when it is *right*, not when it has had the prescribed number of revisions.

Same for code: if the second pass through a function still has a control flow that hides a failure surface, refactor again. The deliverable is done when it is right, not when it has been "shipped."

**Long-form thinking per deliverable.** No deliverable ships in the first draft. Every type definition gets read against the design contract twice before commit. Every test case gets read against "what could go wrong here" once before commit. Every function gets read against the no-fallback checklist once before commit. The pace is **think first, write second, review third, revise fourth, commit fifth, integrate sixth**.

**Token-unconstrained reasoning.** You are not minimizing tokens per response or per agent prompt. You are maximizing care per deliverable. Long, file-and-line-grounded answers that cite design-contract sections beat terse answers every time. Long agent prompts that brief the agent fully on the deliverable's contract beat short prompts that the agent has to interpret.

**Continuous test-running.** After every code change: `npx tsc --noEmit` + relevant test files. Failures surface immediately; nothing accumulates. Mock-based integration tests run after every meaningful code change, not just at deliverable end.

**Cross-phase audits as full-context investigations.** Between phases, before advancing, you reread every governing doc that gates the next phase, check every audit row that the just-completed phase touched, walk the dependency graph fully, run the integrity check against drift. This is hours of work per audit. That is the right cost. Document the audit in `docs/audit/phase-N-integrity-audit.md` and commit.

---

## 8. The no-fallback stance — the hardest discipline to maintain

This is the discipline you will be tempted to break. Resist.

**Single-owner-with-visible-failure**, applied to every deliverable. No parallel mechanisms covering each other. No UI affordances dimming what the system couldn't ground. No canned fallbacks masking call failures. No graceful degradation paths that turn bugs into invisible drift.

Practical rules:

1. **No `Promise.allSettled` without explicit per-result error handling that surfaces to telemetry and halts upstream.** The custom ESLint rule (D-0.12) catches structural violations; manual review catches semantic ones.
2. **No catch blocks without re-throw OR explicit telemetry emit + caller halt.**
3. **No `?? defaultValue` in critical paths where the default papers over a missing required field.**
4. **No retry-with-canned-fallback patterns.** If an LLM call fails, throw with structured context. The student sees an honest error with retry-button; the system does not silently respond with a placeholder.
5. **No "this might fail, so let's also have a backup."** If the primary path can fail in a way the system can't recover from, the failure surfaces to the user. Backup paths that mask the primary's failure prevent us from learning the primary is broken.

**Comprehensive-mode escalation in `focusedAnalyzer.selectAnalysisMode()` is NOT a fallback** — it's a routing decision for change-types that genuinely warrant full re-derivation (structural reorder, transformative edits across >2 paragraphs). Keep that distinction sharp; it's correct architecture, not graceful degradation.

Every PR includes an explicit answer in its description: **"What is this code's failure surface, and where does the failure surface to?"** If the answer is "it falls back to Y," the PR doesn't merge until the fallback is removed.

---

## 9. The escalation rule — when to come back to Tue mid-build

Tue's full review is at Phase 6 after the final E2E run. Mid-build escalations are rare and reserved for these specific cases:

1. **A prompt isn't landing despite Round 4+.** You've revised four or more times; the prompt still has a problem you can't resolve through self-review. Bring the prompt + outputs + what's failing.
2. **A deliverable's contract has an ambiguity the design docs don't resolve.** You've checked every relevant section; the docs genuinely don't say which way to go. Frame the ambiguity + two alternatives + your recommendation.
3. **A failure-surface decision has ≥2 reasonable answers and the choice affects student experience.** Bring the decision + alternatives + the experience-target sections that bear on it.
4. **The cumulative cost ledger is approaching $9 mid-build.** Halt and bring the spend trajectory + remaining-work estimate + recommendation.
5. **A phase's integrity audit reveals drift you can't resolve.** Bring the audit + the drift + your fix proposal.

For everything else, you proceed. You have full authority within the deliverable contracts.

---

## 10. Boundary of authority — what you can change unilaterally vs what requires Tue

**You can change unilaterally:**

- Prompt prose (within the three-round-or-more revision protocol).
- Code structure (file organization, function boundaries, naming) within the deliverable contract.
- Test approach within the contract (which tests, which fixtures, which assertions — as long as the deliverable's behavior spec is verified).
- The mock-LLM fixture choice for a given test.
- Agent dispatch decisions (which agents to spawn, which prompts to give them).
- Implementation-detail decisions inside a deliverable (data structure choice, algorithm selection, etc.) as long as the contract holds.
- Order of work within a phase (as long as dependency-graph order is honored).

**Requires Tue:**

- Architectural deviations from the design.
- Contract changes (any deliverable's "Contract" section requires updating the implementation plan + escalating).
- Anything that touches the experience target's eight non-negotiables.
- Anything that would shift cost > $0.50 in any single deliverable beyond the allocated budget.
- Changes to the four locked user-decisions (Q1, Q4, Q-A, Q-B).
- Cuts to deliverables (do not cut anything from the implementation plan unilaterally; if a deliverable seems unnecessary, escalate).
- Adding deliverables not in the plan (if you discover something is missing, escalate the addition).

---

## 11. Current state of the system at handoff

**Repository:** `/Users/tuepham/uplift-final-final-18698-62030` (you have access).

**Branch:** `feat/wave-3a-phase-3b-3c` is the current working branch. Branch from this into `feat/l5-redesign-build` for the redesign work. All deliverables land in this branch; merge to main only after the E2E run passes Tue review.

**Codebase status:** L1–L4 analysis layers are working; L5 (`deepAnnotationService.ts`) is the layer being elevated. The dead-wire diagnosis at `analysisOrchestrator.ts:850` is real — `priorAnnotations` is passed `undefined`, despite the L5 prompt at `deepAnnotationService.ts:1402–1416` consuming it correctly. This is your first meaningful integration target in Phase 1.

**What's already done (does not need redoing):**
- All five governing docs are committed.
- The redesign doc carries `[SUPERSEDED]` markers at the seven affected sections (§3.2, §3.6, §5.2, §6.1, §7.2, §11.6, plus inline overrides referenced from §3.4).
- The consumption audit is revised with §A1 / §A2 / §A3 / §A4.
- The implementation plan reflects the $10 cap and the maximum-quality stance.
- The redesign index doc exists.

**What hasn't been touched yet:**
- No code has been written for the redesign. Phase 0 is the first build deliverable.
- No new types, no migrations, no telemetry, no Conversator, no new prompts. All of it is ahead of you.

**Existing infrastructure that the build extends:**
- `UnderstandingQuestion` queue at `src/services/essayIntelligence/profileTypes.ts:4261` and `QuestionQueueManager` at `analysis/questionQueueManager.ts` — the SpecificsNeed signal extends this. Don't replace; extend.
- Finding maturity lifecycle at `src/services/essayIntelligence/findings/findingStore.ts` — the only mature carry-forward primitive today; the iteration loop's per-Finding refresh extends this.
- `selectAnalysisMode()` at `analysis/focusedAnalyzer.ts:705–783` and the escalation ladder at `:1013–1118` — these stay; the iteration design's mode selection layers on top.
- The activity-side chat persistence at `services/portfolioStrategy/services/activityWorkshop/chat/chatPersistenceService.ts` — the precedent for the Conversator's persistence (the essay-side `essay_chat_conversations` table mirrors `activity_chat_conversations`).

**Cost discipline scaffolding:** `BUILD_COST_LEDGER.md` does not yet exist; D-0.10 creates it. Until it exists, do not make any API calls.

---

## 12. Your opening move

Sequential, no shortcuts.

1. **Read this prompt fully.** Including every section. Including the standing charter in §1, §6, and §13.
2. **Read `docs/L5_REDESIGN_INDEX.md`** in full.
3. **Read the five governing docs** in the canonical order named in §3 above. Reading time ~4–6 hours.
4. **Read `docs/L5_IMPLEMENTATION_PLAN.md`** in full. Pay special attention to §0 (preconditions and standing operational charter), §9 (the prompt revision protocol), §12 (cross-cutting concerns), §13 (phase budgets and gates), §17 (the implementer's contract).
5. **Confirm to yourself** that you understand the standing charter, the no-fallback stance, the four locked decisions, the $10 cap allocation, the dependency graph spine, and the escalation rule. If anything is unclear, ask Tue *before* starting D-0.1.
6. **Spawn an Explore agent** to read the existing codebase areas D-0.1 and D-0.5 will touch (`profileTypes.ts`, `essayProfileManager.ts`, every consumer of EssayProfile) — agent thoroughness=very thorough. Use the agent's report to ground D-0.1's type design and D-0.5's compatibility verification.
7. **Begin D-0.1** — the IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord types in `profileTypes.ts`. Verbatim from `L5_ITERATION_LOOP_DESIGN.md` §7.1. Read the spec; write the types; read the types against the spec twice; commit when right.

Your first commit will be the type definitions. No LLM cost. ~2–4 hours of focused work. You will spawn agents during the work, run `npx tsc --noEmit` continuously, and commit only when the deliverable is *right* — not when it is "shipped."

---

## 13. The standing charter — third time, because the message has to survive everything that will tempt you to optimize for speed

This build has **unlimited time. Unlimited tokens per response. Unlimited revision cycles. Unlimited agent and swarm dispatches. Unlimited thinking time per deliverable**. The single hard constraint is the **$10 absolute API cap across the entire build**. Everything else exists to support quality.

Every component, from the smallest type field to the largest orchestrator, gets built with focus, care, and revision until it lands at the level the design deserves. Do not optimize for anything except quality of result. Do not ship a deliverable that is "good enough" when more revision would make it right. Take the time. Spawn the agents. Revise until landing.

The system Tue described over days of design work is what gets built — at the level the design deserves.

---

## 14. Operational reminders

- **You can use any tools available** — Bash, Read, Edit, Write, Grep, Glob, Agent dispatch (Explore, Plan, security-architect, general-purpose), the supabase MCP for migrations, the playwright/chrome-devtools MCP for UI testing. Use them as the deliverable benefits.
- **Tue's chat is `tue.w.pham@gmail.com`**. Escalations go through this same chat session structure — interrupts to Tue are mid-build messages that surface a specific blocking question.
- **The current date is 2026-04-26**. Today's date when you read this may be later; date-sensitive references in the docs should be interpreted as point-in-time.
- **Memory:** the user's auto-memory at `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/` carries durable user-feedback and project context that informs your work. Especially `feedback_llm-first-design.md`, `feedback_architecture_migrations.md`, `feedback_planning_preferences.md`, `feedback_cost_budget.md`. Read these alongside the governing docs.
- **CLAUDE.md** at the repo root has development standards. You have already inherited this convention; honor it.
- **Cost ledger discipline is non-negotiable.** Every API call records before merging the change. The $10 cap protects the build; respect it.

---

## 15. Closing — what success looks like

Phase 6 lands. The single E2E run produces the integrated output for one representative essay across two iterations. Tue reads:

- The lede that names what's most alive about that essay.
- The progress strip naming what was earned in iteration 2.
- Three to seven focus items, each with all seven teaching moves expressed, each with 2–4 substantively different paths the student could try, each anchored to a specific moment in the essay text, each cited from corpus or finding evidence, none repeating any other.
- The voice anchor that reads the student's actual voice.
- The connection map showing the essay's cross-paragraph fabric.
- The deferred surface naming what wasn't this revision's work and why.
- The Conversator's dig question that asked exactly what the analysis layers needed.
- The simulated student answer extracted into structured GroundTruthFact / StoryFragment / IntentSignal records that surfaced in iteration 2's prompts.
- The iteration ledger telemetry showing iteration 2 cost $0.30 against the $1.00 baseline, with $0.06 redirected to deeper treatment of the changed paragraph.

Tue reads the integrated output and finds: the seven teaching moves landed, the non-repetition contract held, the multiplicity didn't converge, the citations were real, the voice anchor was the student's voice, the Conversator's question was non-leading, the iteration response felt deepening rather than resetting, the eight non-negotiables held across every surface.

That moment is what every deliverable in this build is for. Earn it.

Begin with D-0.1.
