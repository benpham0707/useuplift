# Phase 2 Handoff Prompt — SpecificsNeed Aggregator + Queue Extension

> Paste the section below into a fresh Claude Code session to begin Phase 2.
> The session that produced this handoff just closed Phase 1 at HEAD `128f065`
> on branch `feat/integrated-pipeline-build`.

---

We're building Uplift, an AI college essay coaching system. Phase 1 just
closed cleanly: 18 deliverables shipped, 5 audit-driven prerequisites,
zero CRITICAL/HIGH drift in the integrity audit, $0.5110 cumulative API
spend (well under the $1.00 mid-Phase-1 threshold). Phase 1's outcome:
the dead wire is alive — iter-2's L5 reads iter-1's taughtMoves with
landing status populated by D-1.6.5; priorAnnotations Map threads
correctly under every edit shape; verbatim repetition is structurally
prevented.

We're starting Phase 2 of the L5_IMPLEMENTATION_PLAN: **SpecificsNeed
Aggregator + Queue Extension** (D-2.1 through D-2.14, 4–6 days,
≤$2.00 cumulative cost target). Phase 2 is **prompt-heavy** — five
layer prompts get extended (L3 walk, L3.5 analysis, L3.75 holistic, L4
northStar, FindingStore stuck-hypothesis) to emit `specifics-need`
entries when a finding's deepening can't advance from text alone, plus
a new aggregator that deduplicates emissions into the question queue.

## Repository

- Path: `/Users/tuepham/uplift-final-final-18698-62030`
- Branch: `feat/integrated-pipeline-build`
- HEAD: `128f065` (Phase 1 closed)
- Recent commits: see `git log --oneline -25`

## Critical context to read FIRST (before any work)

1. `CLAUDE.md` — project standards
2. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/MEMORY.md`
3. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_cost_budget.md` — **$5 hard cap per test run; ask before any API call >$5**
4. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_planning_preferences.md`
5. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_llm-first-design.md` — **6 rules; especially Rule 1 (LLM owns judgment, system tracks) and Rule 4 (no whack-a-mole pattern matching)**
6. `docs/audit/phase-1-integrity-audit.md` — Phase 1 closure verdict + 7 OPEN deferred items
7. `docs/audit/d1-15-mock-llm-integration.md` — D-1.15 audit doc; lists architectural decisions ratified during build
8. `docs/audit/d1-18-phase1-cost-closure.md` — Phase 1 cost ledger closure
9. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md` §D-2.1–§D-2.14 (literal contracts for the 14 deliverables)
10. `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_ITERATION_LOOP_DESIGN.md` §6 (SpecificsNeed contract; what each layer emits)

## What this Phase 2 chat MUST do differently

### 1. Address the 7 OPEN deferred items FIRST (foundation work)

Before D-2.1 starts, close the deferred items from Phase 1 so we don't
keep accumulating debt. Per Tue's directive (2026-04-30):
*"we should address all of them so we have proper foundation and we
don't keep deferring them."* The 7 OPEN items live in
`docs/audit/phase-1-integrity-audit.md` §6. Catalogue them with
disposition (fix inline / new sub-deliverable / formal close) and
work through them before any Phase 2 prompt engineering begins.

### 2. PIQ workshop is the prompting benchmark

Tue's directive (2026-04-30): *"Let's check the prompting standard we
had for PIQ workshop or Common App workshop. Mainly PIQ workshop as I
believe the prompting was that one's strength."* Before extending any
of the 5 Phase 2 prompts, **read** the PIQ workshop's existing prompts
to study what makes them strong:

- `src/services/piq/` — find every `.ts` file with prompt strings or
  prompt-builder functions; specifically the multi-stage workshop
  prompts (the architecture matches Common App workshop's
  Stage 1–5 pattern)
- `src/services/commonAppWorkshop/stages/` — secondary reference
- `src/services/narrativeWorkshop/` — tertiary reference

Document what makes the PIQ prompts strong (the structural elements,
the cognitive forcing functions, how they avoid fluff, how they shape
voice) as a "Phase 2 prompt-engineering benchmark" doc at
`docs/pipeline-evolution/04-pipeline-architecture/L5/PHASE_2_PROMPT_BENCHMARK.md`.
Every Phase 2 prompt round-1 draft must measure against that benchmark
before going to Tue for review.

### 3. Iterate every prompt with Tue's review at every round

Tue's directive: *"let's do prompts and review every time"* — meaning:
- Round 1: agent drafts the prompt against the PIQ benchmark
- Round 2: Tue reviews the round-1 draft, critiques output (real or
  simulated)
- Round 3+: agent iterates based on critique
- DO NOT close a prompt at "passes type-check" — close it at "Tue
  ratifies the output quality"

This shifts the audit pattern from "three-agent ratification" to
"Tue-ratification per prompt." The three-agent audit pattern continues
for non-prompt deliverables (D-2.1 the queue manager, D-2.7 the
aggregator, D-2.8 the orchestrator integration, D-2.10–D-2.13 the
tests/audits).

### 4. Every API call must earn its spot

Tue's directive (2026-04-30): *"each call is worthwhile and we iterate
and improve upon each one based on my input and critique of the
output and what can be better about it."*

Spec budgets D-2.9 at $0.50–$1.00 (mid-build API touchpoint #2). When
the time comes:
- Surface the run plan to Tue BEFORE spending (not after)
- Run on ONE essay first; show output; iterate prompt; only run a
  second time if Tue ratifies
- Per `feedback_cost_budget.md` §15: "If a full run will cover a
  specific fixture, don't do a smaller single-fixture pre-smoke. That's
  double-spend." So plan the single-essay run as the canonical first
  output Tue reviews.

### 5. Output discipline: anti-fluff, anti-repetition, concise-by-default

Tue's directive (2026-04-30) on output quality:
*"We don't want a system that just sounds smart but actually thinks
through what it's doing... develop and curate the best possible outputs
that are actually intelligent and equate to the guidance and output
and experience 500/hr counselors would."*

*"We need to be careful not to create repetition of concepts or outputs
and also be concise in terms of length. Not concise where we're missing
out on important details and guidance but concise where everything
should earn its spot naturally."*

*"Our users are going to be high-school students that aren't going to
bother to read through every detail. Only the most engaging ones and
that seem useful."*

Translate this into prompt engineering:
- **Cognitive forcing functions in every prompt**: every claim must
  cite text (no "the essay shows..." without a quoted span). Per Rule 4
  of `feedback_llm-first-design.md`, solve quality at the prompt layer,
  not at a post-hoc filter.
- **Anti-repetition is structural, not by post-hoc dedup**: prompts
  must include "do not repeat what L1/L2/L3 already said about this
  paragraph" guidance, with the prior-layer outputs threaded into the
  prompt as context the LLM is told to NOT redundantly re-derive.
- **Length budgets in the prompt**: tell the LLM "1 sentence per
  observation; 3 observations max per paragraph; if you can't compress
  the insight, the insight isn't sharp enough yet — drop it."
- **Engaging language**: the prompt should explicitly direct the LLM
  to write like a high-quality college counselor talking TO the
  student (not at), not in essay-grading-rubric voice.
- **Earn-its-spot rule**: every emission gets a `whyItMatters` field
  that, if the LLM can't fill it with a non-trivial answer, the
  emission is dropped. This is the LLM-first version of "did this
  earn its spot in the output?"

Bake the "$500/hr counselor benchmark" into every prompt — the LLM
should be told what tone, depth, and texture to produce, with examples
of strong vs weak emissions.

### 6. The standing operational charter still holds

Per the prior session's discipline:
- **No silent fallbacks** — every catch must re-throw, emit telemetry,
  or be a documented carve-out
- **Cite finding IDs in commit bodies** (D-2.1, T2.4, MED-1, etc.)
- **Three-agent ratification audit before commit** for non-prompt
  deliverables (D-2.1, D-2.7, D-2.8, D-2.10, D-2.11, D-2.12)
- **Per-prompt ratification = Tue review at each round** (D-2.2, D-2.3,
  D-2.4, D-2.5, D-2.6 — the prompt-engineering deliverables)
- **Pause and surface every scope expansion** — Phase 2 has 14
  deliverables; if a 15th is needed, surface to Tue
- **Don't touch shipped Phase 1 implementation files** unless a real
  Phase 2 contract requires it; if it does, surface first
- **Verify every file:line claim before acting**
- **Pause for high-level decisions** (cost approvals, prompt
  ratification rounds, scope expansions, product-direction questions)

## Phase 2 deliverable order (recommended)

1. **Phase 1 deferred-items closure pass** (~half day) — enumerate the
   7 OPEN items from `docs/audit/phase-1-integrity-audit.md` §6, fix
   inline or formally close each one
2. **PHASE_2_PROMPT_BENCHMARK.md** (~half day) — read PIQ workshop
   prompts; document what makes them strong; establish round-1 draft
   measure-against criteria
3. **D-2.1** — QuestionQueueManager extension (3-4h, pure code,
   three-agent audit)
4. **D-2.2 through D-2.6** — five prompt extensions (3-8h each, with
   per-round Tue review). Order: D-2.2 (L3 walk) → D-2.3 (L3.5
   analysis) → D-2.4 (L3.75 holistic) → D-2.5 (L4 northStar) → D-2.6
   (FindingStore stuck-hypothesis)
5. **D-2.7** — `specificsNeedAggregator.ts` (5-7h, three-agent audit)
6. **D-2.8** — Aggregator integration into analysisOrchestrator (~2h)
7. **D-2.9** — Mid-build API touchpoint #2 (3-4h, $0.50–$1.00 with
   pre-spend ratification)
8. **D-2.10** — Queue persistence concurrency test (3-4h)
9. **D-2.11** — Aggregator dedup property test (~2h)
10. **D-2.12** — Mock-LLM integration test for Phase 2 spine (~3h)
11. **D-2.13** — Phase 2 cross-phase integrity audit (~3h)
12. **D-2.14** — Phase 2 cumulative cost-ledger check (~30m)

## Begin by

1. Reading the critical context files (1–10 above) — surface back to
   Tue when complete with a summary of the PIQ prompt-strength findings
   AND the 7 OPEN deferred items rolled into a concrete first-pass
   closure plan
2. Do NOT start D-2.1 or any prompt work until Tue ratifies the
   PHASE_2_PROMPT_BENCHMARK.md and the deferred-items closure plan
3. Surface every Phase 2 high-level decision to Tue immediately —
   prompt round-1 drafts, cost-spend pre-ratification, scope
   expansions, product-direction questions

The session standing authorization is to work autonomously WITHIN each
non-prompt deliverable's audit cycle, AND to pause for Tue review at
every prompt round. Anything in between (like a found dead wire,
unexpected drift, scope question) gets surfaced.
