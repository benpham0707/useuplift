# WS-D: Calibration Set + Locked Baselines

> **Purpose**: Build the 20–30 portfolio fixture set with stratified coverage, run the current pipeline against each, lock baselines as JSON. This is the regression guardrail for the entire wrap-up.
> **Owner**: Claude Code agent (engineering work) under Tue's review
> **Estimated time**: 3–4 days (fixture authoring is the long pole)
> **Output location**: `tests/fixtures/activity-calibration/` + `docs/activity-workshop-wrap-up/calibration/methodology.md`
> **Cost**: ~$8–15 in API spend for baseline capture (one-time)

---

## Paste this prompt into a fresh session

You are producing the **calibration fixture set + baselines** for the Activity Workshop wrap-up. Master plan §0.2 specified 10–15 portfolios; review finding F-6 said that's not enough for the coverage matrix. You're building the expanded version: 20–30 portfolios with stratified gating.

### What to read first

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` §0.2 + §3.2 — calibration spec
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — findings F-6, A-2, A-4 (the calibration-set defects to fix)
3. `src/services/portfolioStrategy/services/activityWorkshop/types.ts` — `ActivityWorkshopInput` shape
4. `tests/test-full-pipeline-e2e-output.ts` — existing E2E test you'll model the runner on
5. Memory: `activity-workshop.md` — v4.3 pipeline structure
6. Memory: `feedback_cost_budget.md` — cost discipline ($5/run cap, request approval for >$5)

### What to produce

Three deliverables:

#### 1. Fixture set (20–30 portfolios)

Stratified coverage table — every cell must be hit by ≥1 fixture:

| Dimension | Cells |
|-----------|-------|
| Tier | strong (5) / mid (10) / weak (5) / mixed-signal (5) |
| Archetype | builder / caretaker / scholar / innovator / leader / advocate (each ≥3) |
| Constraint | first-gen-heavy / work-hours-heavy / unconstrained / mixed (each ≥4) |
| Major | STEM / humanities / arts / business / undecided (each ≥3) |
| Portfolio size | 4–6 activities (≥3) / 7–9 (≥10) / 10–13 (≥10) / 14+ (≥3) |
| Spike clarity | clear-spike (≥8) / well-rounded (≥8) / contradictory (≥5) |

Store as JSON under `tests/fixtures/activity-calibration/<id>-<archetype>-<tier>.json`. Each file:

```jsonc
{
  "id": "F-01",
  "name": "Strong STEM builder, first-gen, clear-spike",
  "stratification": {
    "tier": "strong",
    "archetype": "builder",
    "constraint": "first-gen",
    "major": "STEM",
    "portfolioSize": 11,
    "spikeClarity": "clear-spike"
  },
  "input": { /* ActivityWorkshopInput — full payload */ },
  "notes": "Synthetic but plausible. Modeled on tests/output/.... Edge case: research lab + family business work obligations."
}
```

**Source materials**:
- Start from `tests/output/` existing portfolios as templates
- Augment with synthetic ones to fill coverage gaps
- Each synthetic portfolio must be plausible (no fabricated impossible activities)

#### 2. Baseline runner (`tests/run-activity-calibration.ts`)

A script that:
- Iterates every fixture in `tests/fixtures/activity-calibration/*.json`
- Runs the full Activity Workshop pipeline (Stage 0 → 1 → 2 → 3 → Final Narrative)
- Captures: full output JSON, per-stage cost, per-stage latency, total cost, total latency, model versions used
- Writes baseline under `tests/fixtures/activity-calibration/baselines/<id>.json` with timestamp + git SHA
- Prints aggregate: total cost, total time, fixtures completed, any errors

Cost protection:
- Estimate cost BEFORE running. If estimate >$15 total, abort and surface
- Use `feedback_cost_budget.md` rules: pause and request approval before exceeding $5/single-run, $15/sweep

Usage:
```bash
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-activity-calibration.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-activity-calibration.ts --fixture F-01
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-activity-calibration.ts --fast-loop  # 3 fixtures only
```

#### 3. Methodology doc (`docs/activity-workshop-wrap-up/calibration/methodology.md`)

A reusable doc covering:
- How fixtures were chosen + stratification rationale
- How baselines are captured (model versions, timestamps, git SHA pinning)
- How to add a new fixture without breaking the stratification
- How to interpret a "regression" (per-fixture floor + aggregate, not aggregate-only — fixing review finding A-4)
- Fast-loop methodology: which 3 fixtures are the canary set for iteration
- Cost envelope: per-fixture, per-sweep, per-fast-loop

### Quality bar

- **Every stratification cell is hit ≥1.** Manually verify via coverage table.
- **Baselines pin model versions** (`claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001`) — if Anthropic rotates IDs, baselines explicitly invalidate.
- **Fast-loop subset (3 fixtures) is named** and explicitly representative — chosen for diversity, not random
- **Cost-per-run measured + recorded** per fixture. The first baseline run IS the cost-budget evidence for Phase 3 envelope approval.
- **No fixture relies on synthetic facts that look real but aren't** (e.g., don't invent a real-sounding org name; use `<School Name>` placeholders if needed).

### Output structure

```
tests/
├── fixtures/activity-calibration/
│   ├── F-01-builder-strong.json
│   ├── F-02-scholar-mid.json
│   ├── ...
│   └── baselines/
│       ├── F-01.json
│       └── ...
├── run-activity-calibration.ts
docs/activity-workshop-wrap-up/calibration/
└── methodology.md
```

### Bonus: stratification audit script

`tests/audit-calibration-coverage.ts` — reads every fixture, prints the coverage table, fails CI if any cell is empty. Reusable when fixtures evolve.

---

## Status

- [ ] Started
- [ ] Fixture coverage table finalized (which fixtures hit which cells)
- [ ] Synthetic fixtures authored
- [ ] Baseline runner written + type-checked
- [ ] Cost estimate pre-approved (target: <$15 total)
- [ ] Baselines captured + committed
- [ ] Methodology doc written
- [ ] Stratification audit script (bonus)
