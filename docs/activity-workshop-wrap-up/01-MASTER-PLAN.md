# Activity Workshop Wrap-Up: Master Plan

> **Scope:** `src/services/portfolioStrategy/services/activityWorkshop/` only.
> **Timeline:** ~10–12 weeks linear execution.
> **Outcome:** Fully wired, calibrated, UX-finished Activity Workshop that delivers counselor-parity editorial output on the axes where AI wins.

---

## Non-negotiable execution principles

1. **No new build until every "built but not wired" module is verified live.** Grep before any "shipped" claim.
2. **No prompt change without calibration set diff.** Vibes-based tuning is banned.
3. **Phases gate each other.** Don't open Phase N+1 work mid-Phase N. Backlog new ideas, don't insert.
4. **Outcomes data collection starts Day 1**, parallel to everything else. No moat without it.
5. **No fabricated polish.** Every "improvement" must show up in a calibration diff or it doesn't ship.
6. **Each integration walks E2E before the next starts.** No bulk wiring with batch validation at the end — that's how integration debt re-accrues.

---

## Phase 0 — Inventory & Calibration Set (Week 1)

### 0.1 Wiring audit
For each module flagged in memory as "built but not wired", produce a status entry: LIVE / PARTIAL / DEAD, plus call sites and gap to live.

Modules to audit:
- 2A Teaching Sophistication routing (memory: "routing logic built, banned content lists defined, integration pending")
- 6-Layer Cognitive Decomposition (memory: "feature extraction complete, rule/calibration refactors in progress")
- Expertise Signaling Library (memory: "15 files, 14K lines integrated but not live in all teaching paths")
- Activity Profile bridge (`profileBridge.ts`, `chatPersistenceService.ts`) — is the Conversator-to-pipeline path actually live in production routes?
- Scoring Teaching Layer transformations (R-series memory says merge condition may discard within-limit rewrites — verify)

For each: `grep -rn '<symbol>' src/` for static imports + `import(` for dynamic. Confirm a live call chain from an HTTP route or scheduled job. Output: `work-logs/phase-0-integration-audit.md`.

### 0.2 Calibration set construction
Build 10–15 reference portfolios:
- Tier mix: 3 strong, 5 mid, 4 weak, 3 mixed-signal
- Archetype coverage: all 6 (builder/caretaker/scholar/innovator/leader/advocate)
- Constraint mix: 3 first-gen, 3 work-hours-heavy, 3 unconstrained, rest mixed
- Major coverage: STEM (3), humanities (3), arts (2), business (2), undecided (2)

For each portfolio, capture as JSON fixtures under `tests/fixtures/activity-calibration/`:
- Input: full ActivityWorkshopInput
- Baseline output: current pipeline result (locked at audit time)
- Expected delta: nothing yet; baselines become reference. Counselor-graded rubric scores added in Phase 3.

### 0.3 Outcomes flywheel — parallel track, starts Week 1
- DB migration: `application_outcomes` table (`user_id`, `school`, `decision`, `decision_date`, `portfolio_snapshot_id`, `essays_snapshot_id`)
- Capture flow: post-decision-date prompt in user dashboard
- Runs in parallel for the full 10–12 weeks. Data only compounds.
- Owner can be different from main wrap-up executor.

### Gate to Phase 1
- `phase-0-integration-audit.md` complete, every module categorized
- Calibration fixtures committed and runnable: `npx tsx tests/run-activity-calibration.ts` outputs baseline JSON for every portfolio
- Outcomes table migration applied + capture UI in code review

---

## Phase 1 — Integration Debt Cleanup (Weeks 2–3)

For each module flagged PARTIAL or DEAD in 0.1, walk the full integration cycle:
1. Read implementation in full
2. Identify call-site insertion point in pipeline
3. Wire it (static import + invocation + result merge)
4. Type-check (`npx tsc --noEmit`)
5. Run calibration set, diff vs baseline
6. If diff is improvement or neutral → commit. If regression → revert + document why in `work-logs/phase-1-<module>.md`.
7. Only then move to next module.

### Order — highest leverage first

1. **Expertise Signaling Library** — directly attacks the "~50% commoditized teaching" gap from your audit. Routes domain-specific patterns into Stage 2 teaching. Highest user-visible delta.
2. **2A Teaching Sophistication routing** — wires teaching depth to description score bands. Prevents foundational tier from getting advanced-writer feedback (and vice versa).
3. **6-Layer Cognitive Decomposition** — scoring consistency. Less surface-visible but reduces tier flapping across re-runs, which is the single biggest trust-killer.
4. **Activity Profile bridge** — verify Conversator → pipeline path actually fires. If not, the "replace fabricated metrics with verified facts" promise is unfulfilled.
5. **Scoring Teaching Layer transformations** — verify within-limit rewrites are surfaced, not discarded by merge conditions.

### Gate to Phase 2
- Every PARTIAL/DEAD module is now LIVE or formally retired with rationale
- Calibration set re-run shows aggregate baseline ≥ Phase 0 baseline
- No regression silently shipped (every change has a recorded diff)

---

## Phase 2 — Counselor-Parity P0 (Weeks 4–7)

Seven P0 items from the counselor-gap analysis, sequenced by impact-per-complexity. Build each end-to-end before the next.

### 2.1 Executive Brief layer (Week 4)
- New top-of-output module, ≤300 words
- Inputs: Stage 3 synthesis + portfolio narrative
- Output: 1-sentence verdict + top-3 strengths (each cited to specific activity) + top-3 actions (ranked by leverage) + competitive read (school-list-aware)
- Renders FIRST in UI; full depth on tap (Phase 4 wires the UI)
- LLM: Sonnet, one call, ~$0.03

### 2.2 Elicitation loop (Weeks 4–5)
- After Stage 1, flag activities with low signal (vague description, missing leadership/impact/scope/time)
- Generate 3–5 targeted probes per low-signal activity (Haiku, cheap)
- Surface probes as chat-style prompts BEFORE Stage 2 fires
- Capture responses into ActivityProfile, then run Stage 2 with enriched facts
- **This is the single biggest counselor-parity unlock.** Counselors elicit in session; we currently take description as given.

### 2.3 Off-activity material store (Week 5)
- Migration: `activity_supplementary_facts` (`activity_id`, `fact_type`, `content`, `source`, `verified`, `captured_at`)
- Stores facts from 2.2 elicitation that can't fit 150-char description
- Available to Stage 2 teaching, interview prep, essay angle generation
- Tied to advice-trace ledger (2.7)

### 2.4 Cut-list with deletion confidence (Week 6)
- For portfolios >10 activities, output a ranked cut-list
- Each cut: "Remove [X], confidence Y%, because [Z]"
- Confidence derived from: tier, redundancy with other activities, spike alignment, narrative thread fit
- Defensible explanation per cut, not just a ranked list

### 2.5 Calibrated competitive verdict (Week 6)
- Harvard 1-6 scale + confidence interval (e.g., "3.5 ± 0.5")
- Confidence derived from: data completeness, analysis-vs-scoring tier agreement, constraint context, sample-size of similar profiles in outcomes data (when available)
- Reduces overclaim risk + signals genuine uncertainty rather than false precision

### 2.6 Revision craft / model sentences (Week 7)
- For top-5 deep-teaching activities, generate 2–3 model-sentence variants per description rewrite
- Each variant labeled with what it emphasizes (impact / scope / agency / specificity)
- Student picks or blends
- This is what counselors hand-draft; we currently give principle + fragment

### 2.7 Advice-trace ledger (Week 7)
- DB: `activity_advice_history` (`activity_id`, `session_id`, `advice_summary`, `tier_assigned`, `confidence`, `timestamp`, `superseded_by`)
- On each re-run, diff against most recent prior advice
- Surface in UI: "We said X last time; now Y. Reason: [Z, citing what changed]"
- Makes the system feel like a coach with memory, not a stateless analyzer

### Gate to Phase 3
- All 7 P0 items wired into the pipeline result and reachable from the rendered output
- Calibration set re-run; aggregate output strictly improves on Phase 1 baseline
- Cost-per-run measured, latency measured (record in `work-logs/phase-2-budget-check.md`)

---

## Phase 3 — Calibration & Tuning (Weeks 8–9)

### 3.1 Counselor-graded rubric (Week 8 start)
Score every calibration fixture against a fixed rubric covering: tier-justification quality, action specificity, evidence citation rate, voice preservation, school-strategy fit, model-sentence usability. This becomes the truth signal for tuning.

### 3.2 Prompt tuning against fixed set
- Tune **one** prompt at a time
- Re-run full calibration after each change
- Keep if aggregate score improves; revert if not
- No subjective "this feels better" allowed
- Log every tune attempt + outcome in `work-logs/phase-3-tuning-log.md`

### 3.3 Cost & latency optimization
- Audit every prompt for redundancy and prompt-caching opportunities
- Trim oversized few-shots
- Targets:
  - Cost ≤$0.50/run with all new features live
  - Latency ≤4 min wall clock
- If targets infeasible, decide explicitly: spend more $ vs cut a feature. No silent overruns.

### 3.4 Failure-mode hardening
- Run pipeline against:
  - Empty activity list
  - Single activity
  - 25+ activities
  - Conflicting profile data (chat says X, description says Y)
  - Malformed input
  - LLM 429 / 500 mid-batch
- Verify graceful degradation, no silent failures, no fake/hardcoded fallback output
- Document failure modes in `docs/activity-workshop-wrap-up/work-logs/phase-3-failure-runbook.md`

### Gate to Phase 4
- Aggregate calibration score ≥ Phase 0 baseline + 25%
- Cost/run within budget
- Latency within budget
- Failure runbook documented and tested

---

## Phase 4 — UX Overhaul (Weeks 10–16+)

The current 3000-line markdown output is a deliverable, not an experience. UX is where the "$500/hr feels like" sensation lives or dies.

### 4.1 Information architecture (Week 10)
- Executive Brief surface up top (built in 2.1, now render correctly)
- Progressive disclosure tree:
  - Level 1: Executive Brief
  - Level 2: Activity Tiles (tier + headline strength + 1 action)
  - Level 3: Activity Detail (full Stage 2 teaching for that activity)
  - Level 4: Citations + evidence panel
- No wall-of-markdown allowed anywhere

### 4.2 Action-orientation (Week 11)
- "Next 30 minutes" panel: top-3 highest-leverage actions ranked
- Each action: 1-click "open the activity I should edit" + paste-ready rewrite from 2.6
- Track completion state across sessions

### 4.3 Conversational surface (Weeks 12–14)
- Wrap the elicitation loop (2.2) + advice-trace ledger (2.7) in chat UI
- Always-on iteration: "what about this activity?" → focused re-analysis (use existing chat-pipeline bridge)
- Memory visible: "you asked about X in session 2; here's how that changed today"

### 4.4 Trust signals (Week 15)
- Confidence intervals (from 2.5) visible everywhere a verdict appears
- Evidence citations clickable (jump to source text in original activity)
- "Why this tier?" explainer button on every activity card
- Cost transparency: tell the user this run cost $X (builds trust + sets premium positioning)

### 4.5 Outcomes-aware UI (Week 16+, requires Phase 0.3 data accumulation)
- Once outcomes data has accumulated (target: 100+ data points by Week 16), surface "students with similar portfolios saw decision outcomes at [schools]"
- This is the moat made visible
- Stretch — only ship when data quality is real

### Gate to "done"
- A real user (not internal) completes a full Activity Workshop flow solo, no hand-holding
- Measure: time-to-first-action, return rate within 7 days, completion of recommended changes
- 3 of 5 users hit "took one recommended action within 24 hrs" → ship to broader cohort. Below that → iterate.

---

## What "done" looks like (single-sentence test)

A first-time user uploads their activities, gets an Executive Brief in <60 seconds, opens chat to refine one weak activity, captures 3 supplementary facts via elicitation, sees an updated tier with confidence interval and a 2-variant model-sentence rewrite, takes one action, and returns the next day — all without anyone walking them through it.

## What this plan deliberately excludes

- Essay Intelligence wrap-up (same playbook, separate effort)
- Other workshops (Common App, PIQ, Narrative, Academic)
- New analytical capabilities beyond the 7 P0 items
- Marketing, pricing, GTM
- "Nice-to-have" tooling not on the critical path

## Risk register

| Risk | Mitigation |
|------|------------|
| Integration debt repeats — build new before wiring old | Phase 0/1 gates; no Phase 2 until audit clean |
| Tuning regresses what works | Calibration set + diff-or-revert discipline |
| Scope creep mid-execution | Phases are gated; new items → backlog, never current phase |
| UX work underestimated | 7 weeks budgeted; explicit "real user solo" gate |
| Outcomes data never collected | Phase 0.3 starts Week 1, parallel ownership |
| Cost balloons with new features | Phase 3 explicit budget check; hard $0.50 cap |
| Counselor-graded rubric is subjective | Lock rubric BEFORE Phase 3 tuning starts; rubric itself doesn't change during tuning |
| Sub-agent reports success without verification | Hard rule from CLAUDE.md §1a: grep, reproduce, verify — no "should work" commits |

## When to escalate to the user

- Any phase gate fails and the fix isn't obvious
- Cost or latency target appears infeasible
- A planned P0 item turns out to be dependent on Essay Intelligence work
- Adversarial review (forge-plan) surfaces a structural gap not covered here
- Calibration set baseline regresses unexpectedly
