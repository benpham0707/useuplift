# Forge-Plan Adversarial Review — Activity Workshop Wrap-Up Master Plan

> Three agents (Diagnostician + Pessimist + Reframer, all Opus) attacked the locked plan at `01-MASTER-PLAN.md`. Findings synthesized below. The plan is **not safe to execute as written.** See "Recommended actions" at the end.

---

## TL;DR

- **The plan's Phase 1 premise is empirically wrong.** The 5 modules it claims need wiring are already wired in production code (grep-verified, memory dated 2026-02-28). Phases 0/1 (~25% of timeline) target a problem that does not exist.
- **Phase 2 ships features whose UI lands 3–9 weeks later** — creating the exact integration debt the plan promises to fight.
- **Phase 3 tuning cost is structurally unbounded** (~$150+) and violates the $5/run cap with no envelope mechanism.
- **Phase 0.3 outcomes capture is FERPA/COPPA-adjacent** with no consent plumbing.
- **Framing is artifact-comparison ("be the counselor") when the user's actual edge is access-pattern** — UX is buried in Phase 4 despite being the stated moat.

The plan is structurally well-disciplined (gates, parallel outcomes track, integration-debt awareness). The defects are at the **premise** and **prioritization** layers, not the execution-discipline layer.

---

## BLOCKER findings

### B1. Phase 1 premise is empirically wrong; execution prompt makes the plan unfalsifiable
**Severity**: BLOCKER
**Sources**: Diagnostician F-1, Adversary A-7
**Quoted from plan**:
> "Modules to audit: 2A Teaching Sophistication routing… 6-Layer Cognitive Decomposition… Expertise Signaling Library… Activity Profile bridge…" (§0.1)
> "Phase 1 — Integration Debt Cleanup (Weeks 2–3)" (entire phase)

**Failure mode**: Grep across `src/services/portfolioStrategy/services/activityWorkshop/` confirms:
- `profileBridgeService` imported by Stage 0/2/3 + `batchActivityAnalysisService.ts`
- `teachingSophisticationRouter` imported by `activityTeachingLayerService.ts` + re-exported from scoring index
- `expertiseSignaling` consumed by `scoringOrchestrator.ts`, `descriptionRuleScorer.ts`, `portfolioCalibrator.ts`, `expertSystemPrompts.ts`, `teachingLayerTypes.ts`

Memory `activity-workshop-quality-plan.md` (2026-02-28): "ALL 3 IMPROVEMENTS COMPLETE ✓". The plan is quoting stale parenthetical caveats from older memory entries. Combined with the execution prompt's "Do not negotiate scope. Drive the plan as written" — the executor would burn Weeks 2–3 producing a "PARTIAL/DEAD" audit that finds nothing, then trip the Phase 2 gate trivially.

**Mitigation**: Collapse Phase 0.1 to a 1-day verification task with default outcome "LIVE → proceed to Phase 2." Reclaim Weeks 2–3 for Phase 2 (which is underbudgeted — see M2). Add an amendment protocol to the execution prompt: forge-plan findings → user approval → plan updates.

---

### B2. Phase 2 ships features whose UI surface waits until Phase 4 — the plan creates its own integration debt
**Severity**: BLOCKER
**Sources**: Diagnostician F-2
**Quoted from plan**:
> "2.1 Executive Brief layer… Renders FIRST in UI; **full depth on tap (Phase 4 wires the UI)**"
> "2.5 Calibrated competitive verdict… confidence interval"
> "2.7 Advice-trace ledger… Surface in UI"
> "Phase 4.4 Trust signals (Week 15): Confidence intervals (from 2.5) visible everywhere"

**Failure mode**: Four Phase 2 items (Executive Brief, confidence intervals, model-sentence variants, advice-trace ledger) emit structured fields no surface consumes for 3–9 weeks. This is the exact "module built but never wired into output" pattern in `pitfalls_integration_debt.md`. Plan's own Principle #1 prohibits this.

**Mitigation**: Pair each Phase 2 item with a minimum-viable surface in the same week (a debug route, a markdown section). Overlap Phase 4.1 IA work with Phase 2 — design first, then ship features into a real surface.

---

### B3. Phase 3 tuning cost is structurally unbounded; ~$157+ violates the $5/run cap
**Severity**: BLOCKER
**Sources**: Adversary A-3
**Quoted from plan**:
> "3.2 Prompt tuning… Tune **one** prompt at a time. Re-run **full calibration** after each change."

**Failure mode**: 15 portfolios × $0.50/run target = $7.50/sweep. Realistic tuning: 7 prompts × 3 attempts × $7.50 = **$157.50** just in Phase 3.2. Plus 3.4 failure-mode runs. `feedback_cost_budget.md` is "$5 HARD CAP per test run" with explicit rule to ask before any range >$5. Plan offers no envelope, no escalation pathway, no fast-loop subset for iteration. Executor either silently violates the rule or stalls asking permission 30 times.

**Mitigation**: Define an explicit Phase 3 budget envelope ($150–$200), get it approved once at Phase 3 entry. Define a 3-portfolio "fast loop" for tune iteration; full 15-portfolio sweep only at commit decisions.

---

### B4. Outcomes data capture is FERPA/COPPA-adjacent with zero consent design
**Severity**: BLOCKER
**Sources**: Adversary A-6
**Quoted from plan**:
> "0.3 Outcomes flywheel kickoff (parallel) — DB migration: `application_outcomes` table (user_id, school, decision, decision_date, portfolio_snapshot_id)"
> Principle #4: "No moat without it."

**Failure mode**: Uplift serves underage applicants. Linking education records (essays, portfolio) to admission decisions and retaining indefinitely as a "moat" triggers FERPA-derivative obligations + parental-consent norms for <18 student records. The plan budgets zero weeks for compliance. Either ships without consent UI (later forced deletion floods) or a legal review halts the migration mid-Week-1.

**Mitigation**: Add to 0.3 — explicit opt-in checkbox, parental-consent path for minors, retention policy + deletion endpoint, one-paragraph privacy review *before* migration applies. Treat compliance as a Phase 0 gate.

---

### B5. UX is bundled at Phase 4 despite being the conversation's stated moat
**Severity**: BLOCKER
**Sources**: Reframer B-2
**Quoted from plan**:
> "Phase 4 — UX Overhaul (Weeks 10–16+) — The current 3000-line markdown output is a deliverable, not an experience. UX is where the '$500/hr feels like' sensation lives or dies."

**Failure mode**: The plan acknowledges UX is the perception unlock, then schedules it last. 3000 lines of correct markdown shipped today is already most of the analytical content; the gap is delivery. A UX shell over the *current* pipeline could close 50% of perceived counselor-gap before any of the 7 P0s land. Building 7 P0s into a wall-of-markdown surface then re-rendering everything in Phase 4 is double-shipping.

**Mitigation**: Insert Phase 1.5 (Week 2–3, reclaimed from collapsed Phase 1): UX prototype shell over today's output. Executive Brief surface first, depth-on-tap navigation. Then Phase 2 features ship into a real surface, not into JSON nobody renders.

---

## MAJOR findings

### M1. Gates run on a rubric that does not exist until Phase 3
**Sources**: Diagnostician F-3, Adversary A-2
**Quoted from plan**:
> "If diff is improvement or neutral → commit. If regression → revert" (Phase 1)
> "Aggregate calibration score ≥ Phase 0 baseline + 25%" (Phase 3 Gate)
> "3.1 Counselor-graded rubric (Week 8 start)"

**Failure mode**: Phase 1/2 reverts on calibration diffs *before* a rubric exists. "Improvement or neutral" is vibes. Worse: Phase 0 baselines are recorded against a pipeline that has no Executive Brief/model sentences/advice trace; by Week 8 they're scoring a different-shaped output under a yet-to-be-defined rubric. The +25% gate is incoherent.

**Mitigation**: Move rubric definition + 1 hand-authored exemplar artifact to Phase 0. Replace Phase 1 calibration-diff gating with narrower checks (typecheck + reachability + 2-fixture eyeball). After each phase, recompute rolling baseline. Compare Phase N+1 against rolling, not Phase 0 freeze.

---

### M2. Phase 2 underbudgeted: 7 P0s in 4 weeks including 3 DB migrations + new chat surface
**Sources**: Diagnostician F-4
**Quoted from plan**:
> "Phase 2 — Counselor-Parity P0 (Weeks 4–7) — Seven P0 items… Build each end-to-end before the next."

**Failure mode**: 2.2 Elicitation Loop requires chat UI (which Phase 4.3 schedules for Weeks 12–14 — direct contradiction with "end-to-end"). 2.3 Off-Activity Store + 2.7 Advice-Trace Ledger need new migrations with RLS policies. Counselor-gap memory itself places elicitation in Wave 3 (multi-week effort). 7 items in 20 working days = 3 days/item including migration, wiring, calibration, revert path. Not real.

**Mitigation**: Split Phase 2 into 2A (output transforms: Executive Brief, Cut-List, Calibrated Verdict, Model Sentences — Weeks 4–6) and 2B (architecture: Elicitation, Off-Activity Store, Advice-Trace — Weeks 7–10). Update timeline to ~14 weeks OR defer 2B to a follow-on plan.

---

### M3. Elicitation Loop has no mid-flow state machine
**Sources**: Adversary A-1
**Failure mode**: User answers 2 of 5 probes, closes tab. Stage 2 must decide: re-run with partial profile, block, or discard. Plan specifies none. Partial profile is a third state the merge logic doesn't model. Tier flapping between runs lands on 2.7 advice-trace as ghost-reason changes — user-visible incoherence.

**Mitigation**: Add to 2.2 spec — `elicitation_session` state machine (pending/partial/complete/abandoned), Stage 2 reads only `complete`, advice-trace writes only on `complete`.

---

### M4. No exemplar target artifact — plan violates user's own planning principle
**Sources**: Reframer B-6
**Failure mode**: `feedback_planning_preferences.md` Rule 3: "'Elevate' objectives must include CONCRETE EXEMPLAR OUTPUT." Plan has zero exemplars. There is no target-executive-brief, no target-cut-list, no UI mock. The plan describes shape and budget but never *the output itself*. Without it, "improvement" is unfalsifiable.

**Mitigation**: Phase 0 deliverable — hand-author the target Executive Brief + Cut-List + advice-trace surface for ONE calibration portfolio. Rubric falls out of the exemplar.

---

### M5. Outcomes flywheel is named "the moat," then orphaned
**Sources**: Reframer B-5
**Failure mode**: Plan Principle #4 says "No moat without it" — then Phase 0.3 sets up capture and the topic never re-appears until Phase 4.5 stretch goal at Week 16+. A plan that calls something the moat and parks it 15 weeks is treating it as background.

**Mitigation**: Outcomes capture UI is a Phase 1.5 deliverable (alongside the UX prototype), not parallel-track background. Consent flow + post-decision capture appears on the user surface from Day 1.

---

## Minor findings (noted, not blocking)

- **A-4 Cross-prompt coupling defeats "tune one at a time"** — Stage 0 archetype affects Stage 2 teaching; aggregate-score gating hides per-fixture regressions. Add per-fixture floor (no individual drop >X) alongside aggregate.
- **F-6 10–15 portfolios can't cover 720-cell matrix** — define stratified gates (must improve in ≥3 archetypes × ≥2 tiers) OR grow set to ~30.
- **A-5 Phase 4 has no designer** — 7 weeks of Claude Code agents building unstyled shadcn cards without a visual reference. Insert 4.0: 1-page IA + visual reference (existing premium-site assets, type.ai, competitors) before any 4.1 code lands.
- **B-1 Counselor-parity framing may be wrong yardstick** — user's edge is access-pattern. Reconsider naming the success metric "return rate + action taken" instead of "matches counselor artifact."
- **B-7 Activity-only scope may be local maximum** — counselor-gap D-1 (portfolio-coordinated read) requires cross-workshop synthesis. Activity-internal Executive Brief is structurally incapable of delivering it.
- **F-7 Missing risks** — model deprecation over 16 weeks, elicitation round-trip latency, executor handoff with only RESUME-HERE.md.

---

## What the plan gets right (after attacking hard)

- **Outcomes-flywheel-from-Day-1** is correct prioritization for longest-pole work — execution just needs to make it visible, not background.
- **Hard-gating phase transitions** is the right structural discipline; the gates themselves are the defect, not the gating model.
- **Excluding Essay Intelligence wrap-up** is a sharp scoping call.
- **Each-integration-walks-E2E** principle correctly diagnoses the integration-debt antipattern — even though Phase 2/4 split violates it.
- **Risk register exists at all** — most plans don't include one; this one is incomplete but the scaffold is right.

---

## Recommended actions (in order)

1. **Pause execution.** Do not start Phase 0/1 as written.
2. **Verify B1 personally** — re-run the grep at the bottom of this doc; confirm Phase 1's modules are already live. (Estimated time: 15 minutes.)
3. **Author exemplar artifacts** (M4) — one hand-written target Executive Brief + Cut-List for the reference portfolio `tests/output/full-profile-14-harvard-2028-crochet.md`. This becomes the truth signal.
4. **Decide on UX-first reframe** (B5) — does Phase 1.5 (UX prototype over current output) replace Phase 1 (integration debt that doesn't exist)? Strong recommendation: yes.
5. **Add compliance gate** (B4) — consent flow design must precede the 0.3 migration.
6. **Pre-approve Phase 3 cost envelope** (B3) — $150–$200 one-time approval, with fast-loop subset for iteration.
7. **Split Phase 2 into 2A/2B** (M2) — output transforms first, architecture second. Update timeline accordingly.
8. **Patch the execution prompt** — add an amendment protocol: forge-plan findings → user approval → plan updates → execution resumes.
9. **Re-issue the plan as v2** — incorporate B1–B5 and M1–M5. Re-run forge-plan adversarial review against v2 before unlocking execution.

---

## Verification commands (run these to confirm B1)

```bash
grep -rn "profileBridge" src/services/portfolioStrategy/services/activityWorkshop/ --include="*.ts" | head
grep -rn "teachingSophisticationRouter" src/services/portfolioStrategy/services/activityWorkshop/ --include="*.ts" | head
grep -rn "expertiseSignaling" src/services/portfolioStrategy/services/activityWorkshop/ --include="*.ts" | head
```

If these return active imports in pipeline code (stages, scoring, batch services), Phase 1 is moot.

---

**Reviewer chain**: Diagnostician (Opus) → Pessimist + Reframer in parallel (Opus, Opus) → Synthesis (this doc).
**Findings density**: 21 raw findings → 10 consolidated (5 BLOCKER + 5 MAJOR) + 6 noted minors.
**Date**: 2026-05-12.
