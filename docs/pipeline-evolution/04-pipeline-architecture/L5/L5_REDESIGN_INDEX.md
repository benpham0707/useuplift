# L5 Redesign — Documentation Index

> **What this is.** A one-page map of the L5 redesign documentation set. Read this first; it tells you which doc owns what, the canonical reading order, and what's superseded by what. Without this index, a reader opens the oldest doc first and builds against the wrong contract.

## The five governing docs (canonical reading order)

Read in this order. Each doc references the next.

| Order | Doc | Owns |
|---|---|---|
| 1 | **`L5_EXPERIENCE_TARGET.md`** | The yardstick. What the student feels. Seven teaching moves, non-repetition contract, divergent-path multiplicity, the ten student-facing surfaces, the eight non-negotiables, the journey, the overrides on the original redesign doc. |
| 2 | **`L5_ITERATION_LOOP_DESIGN.md`** | Selective carry-forward as quality booster + cost optimizer. The 40-row carry-forward inventory. Per-layer policies. Landing detection. The IterationLedger / TaughtMove / CarryForwardDecision types. The 5-iteration cost trajectory. The 20% redirection fraction. The fix for the dead `priorAnnotations` wire. |
| 3 | **`L5_E2E_INTEGRITY_AUDIT.md`** | The integration spine. The 29-step E2E student flow. Per-step ownership / inputs / outputs / failure surface. The Conversator design as analysis-driven inquiry agent. The SpecificsNeed signal as an extension of UnderstandingQuestion. The structured-answer types (GroundTruthFact, StoryFragment, IntentSignal). The no-fallback diff applied across the prior docs. The build-phase ordering. |
| 4 | **`L5_CONSUMPTION_AUDIT.md`** | The field-level inventory. ~250 rows mapping every upstream field to its source layer, defined-at file:line, production cost, current consumer, proposed consumer, verdict (keep / rewire / cut), carry-forward default, rationale. The yardstick the build phase measures against per-row. *(Note: revised against the experience target's surfaces and the iteration design's carry-forward classifications.)* |
| 5 | **`L5_FEEDBACK_REDESIGN.md`** | The original L5 redesign. Mostly preserved as historical context and partial source-of-truth. **Seven sections superseded** — see supersession map below. The resolver + tiered-generator architecture (§4), the citation resolution layer (§5), the cost / caching strategy (§9), the failure modes (§11) all stand. |

## The implementation plan (separate, derived from the five)

| Order | Doc | Owns |
|---|---|---|
| 6 | **`L5_IMPLEMENTATION_PLAN.md`** | The single canonical sequential build plan. ~75–90 deliverables across six build phases plus a final E2E validation run. Each deliverable has a contract, a behavior spec, a failure surface, a validation path, and dependency / blocks links. The plan is what the implementer executes against; the five governing docs are referenced from the plan but not re-derived during build. |

## Supersession map — `L5_FEEDBACK_REDESIGN.md` overrides

The original redesign doc carries inline `[SUPERSEDED — see ...]` markers at each affected section. Listed here for fast reference:

| Original section | Superseded by | What changed |
|---|---|---|
| §3.2 (the five surfaces, top-3 cap) | `L5_EXPERIENCE_TARGET.md` §5 + §7.1 | Surfaces redefined to ten; hard top-3 cap rejected. Number of focus items determined by essay; non-repetition contract is the binding operational constraint. |
| §3.6 (`corpusUnanchored: true` UI dimming) | `L5_EXPERIENCE_TARGET.md` §7.4 + `L5_E2E_INTEGRITY_AUDIT.md` §6.1 | UI dimming affordance removed under no-fallback stance. When citation is thin, the system writes prose more carefully — does not surface UI affordance leaking internal state. |
| §5.2 (`corpusLimitFlagged` + Tier 2 retry on bias-guard) | `L5_E2E_INTEGRITY_AUDIT.md` §6.1 | UI affordance removed; Tier 2 retry removed. Haiku post-gen bias-guard check downgraded to diagnostic telemetry only. Prompt failures fixed at source, not papered with retry. |
| §6.1 (coaching/rewrite mode toggle) | `L5_EXPERIENCE_TARGET.md` §7.2 | Mode toggle rejected. Every focus point carries both teaching and rewrite paths; student is not "in a mode." Q1 in original §14 dissolves. |
| §7.2 (top-3 cap research justification) | `L5_EXPERIENCE_TARGET.md` §7.1 | Reaffirms the §3.2 supersession. Three-cap is operational over-enforcement; the non-repetition contract is the actual binding constraint. |
| §11.6 (reader-bias `biasGuardFlagged` UI caveat) | `L5_E2E_INTEGRITY_AUDIT.md` §6.1 | UI caveat removed. Bias-guard violations are prompt-engineering bugs to surface and fix, not graceful-degradation UI flags. |
| §13 M0 (`priorAnnotations` wire-up as "hygiene") | `L5_ITERATION_LOOP_DESIGN.md` §7.5 + `L5_E2E_INTEGRITY_AUDIT.md` §8 Phase 1 | Wire-up was framed as M0 hygiene. Reframed as Phase 1 build-phase first deliverable, fed from `taughtMoves` ledger (not just connected to undefined-fix), gated by Phase 0 schema work. **2026-05-10 status**: WIRE IS LIVE at `analysisOrchestrator.ts:1299-1300` (`buildPriorAnnotationsForOrchestrator` composes per-paragraph `PriorAnnotationContext` from the iterationLedger's prior `taughtMoves[]`). Earlier doc claims of "dead at line 850" and "parallel dead at reanalysisOrchestrator:1177" are stale. |

## The six load-bearing principles, in one place

These run through every doc and every build deliverable. If a recommendation, a contract, or a piece of prose violates one of these, it's wrong.

### 1. The seven teaching moves — every focus point

**Why** (the principle, named, cited), **How** (mechanics, operationalized), **Internalization** (transfer to autonomy), **Iteration** (try, miss, adjust), **Connection** (across the essay), **Multiplicity** (divergent paths, student chooses), **Contribution** (architectural stake to the essay overall). Source: `L5_EXPERIENCE_TARGET.md` §2. Non-negotiable.

### 2. The non-repetition contract

No two pieces of guidance the student reads in a single session may carry the same teaching weight. Generic teaching is forbidden. Description-back is forbidden. Two paths within a focus point may not be paraphrases. Two focus items may not be the same shape applied to different paragraphs. Extends across iteration turns via `TaughtMove.landing` lifecycle. Source: `L5_EXPERIENCE_TARGET.md` §3.

### 3. Divergent-path multiplicity (no convergence pressure)

At every focus point the system surfaces multiple legitimate paths forward (typically 2–4), each substantively different from the others, each cited from a different exemplar where possible. The system *resists* converging on a "best option." The student picks. The student may pick none. Lateral options live inside the focus card; architectural options live in a separate "different shape" surface. Source: `L5_EXPERIENCE_TARGET.md` §2 (Move 6) and §5.5.

### 4. Selective carry-forward (quality booster + cost optimizer, both load-bearing)

Carry forward only what was effective, what is best, and what's expensive-to-re-derive. Drop teaching that didn't land, superseded findings, hypotheses that never matured, anything where re-derivation produces a better read than carry-forward. Saved budget redirects automatically (20% default per Q1) into deeper treatment of the changed paragraphs. Iteration N reads the essay with N iterations of accumulated understanding, not from cold start. Source: `L5_ITERATION_LOOP_DESIGN.md` §1, §3 inventory, §9 redirection.

### 5. Analysis-driven dig (Conversator as targeted inquiry agent)

The analysis layers know what specifics they need (every layer with a low-confidence or gap signal contributes to the SpecificsNeed queue). The Conversator is the *targeted inquiry agent* that asks for those specifics, captures answers, structures them, and feeds them back. The Conversator's flexibility is in *how* to ask (non-leading), *when* to ask (timing), and *how to handle nuance* (clarification turns) — not in deciding *what* to ask. Continuous chat is always available; dig questions fire at specific moments. Source: `L5_E2E_INTEGRITY_AUDIT.md` §3, §4.

### 6. No fallbacks — single owner, visible failure

Every step has one owner, one input contract, one output contract, one failure surface. No parallel mechanisms covering each other. No UI affordances dimming what the system couldn't ground. No canned fallbacks masking call failures. No graceful degradation paths that turn bugs into invisible drift. When something doesn't work, the failure surfaces — to telemetry, to the student honestly when they're affected, to the next iteration's analysis as a flag. Source: `L5_E2E_INTEGRITY_AUDIT.md` §1 stance + §6 diff applied to all prior docs. Confirmed by Tue 2026-04-26.

## The four user-decisions, locked in

| Q | Topic | Answer | Source |
|---|---|---|---|
| Q1 | Redirection fraction | 20% | `L5_ITERATION_LOOP_DESIGN.md` §11 Q1; user confirmed |
| Q4 | Landing-detector confidence floor | 0.7 | `L5_ITERATION_LOOP_DESIGN.md` §11 Q4; user confirmed |
| Q-A | Conversator availability | Continuous chat surface, always available; dig questions fire at specific moments (after first feedback, between iterations, when stuck) | This session; user confirmed |
| Q-B | Specifics dig origination | Analysis-driven (B1). Analysis layers produce structured signals naming exactly what they need; Conversator is targeted inquiry agent. | This session; user confirmed |

## The build cost discipline

- **Total build-phase API spend target: <$20.** Per-prompt validation small fixture runs (~$0.10–$2 per prompt, hard-capped at $5). Single E2E validation run (~$1.30). Mid-build escalations to Tue only when a prompt isn't landing within its $2 deliverable budget.
- **No A/B against v1.** v1 already has runs and tests; re-running is double-spend. The validation is one full E2E test of the new system on a single representative essay.
- **No reruns / no loops.** If the E2E run fails mid-pipeline, the pipeline halts at the failing step. Diagnose, fix at source, re-run from the broken step (not from step 1) using persisted upstream outputs.
- **Tue review at the system level**, not at the prompt level. Prompts are sole-author with internal validation discipline. Tue reads the integrated output once, after the E2E run, and that's where iteration begins.

Source: this session 2026-04-26.

## How to use this index

- **If you are starting a new session on the L5 redesign:** read this index, then the five governing docs in canonical order, then `L5_IMPLEMENTATION_PLAN.md` if it exists.
- **If you are about to write a deliverable:** find it in the implementation plan; consult the plan's "what to read before starting" pointer for the deliverable; do not re-read all five docs.
- **If you find a contradiction between two docs:** the canonical order resolves it. Later docs override earlier docs at the section level via supersession markers. The implementation plan is the executable contract; if it disagrees with a governing doc, the disagreement is a bug — escalate.
- **If you are reading the original `L5_FEEDBACK_REDESIGN.md`:** check for supersession markers at every section header before treating its prose as the contract. Mostly the doc still stands; seven sections do not.

## Cross-references at a glance

- Original L5 redesign: `docs/L5_FEEDBACK_REDESIGN.md`
- Experience target: `docs/L5_EXPERIENCE_TARGET.md`
- Iteration loop design: `docs/L5_ITERATION_LOOP_DESIGN.md`
- E2E integrity audit: `docs/L5_E2E_INTEGRITY_AUDIT.md`
- Consumption audit (revised): `docs/L5_CONSUMPTION_AUDIT.md`
- Implementation plan: `docs/L5_IMPLEMENTATION_PLAN.md`
- This index: `docs/L5_REDESIGN_INDEX.md`

> **The thinking is done. The integration is done. The plan is what's next.** This index is the bridge that keeps the build phase grounded against the right yardstick. Update this index when supersession lands; do not let docs drift apart silently.
