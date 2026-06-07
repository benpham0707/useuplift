You are producing the **calibration fixture set + locked baselines** for the Activity Workshop wrap-up. This is the regression guardrail for everything else. Master plan §0.2 specified 10–15 portfolios; review finding F-6 said that's insufficient for stratified coverage. You're building the expanded version: 20–30 portfolios.

## Read first (in order)

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` §0.2 + §3.2 — calibration spec
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — findings F-6, A-2, A-4 (calibration defects to fix)
3. `src/services/portfolioStrategy/services/activityWorkshop/types.ts` — `ActivityWorkshopInput` shape
4. `tests/test-full-pipeline-e2e-output.ts` — existing E2E test (model the runner on this)
5. `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/activity-workshop.md` — v4.3 pipeline structure
6. `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_cost_budget.md` — cost discipline ($5/run cap; pause and request approval for anything larger)

## Produce — three deliverables

### Deliverable 1: Stratified fixture set (20–30 portfolios)

Every cell in this coverage table must be hit by ≥1 fixture:

| Dimension | Cells (count each) |
|-----------|---------------------|
| Tier | strong (5) / mid (10) / weak (5) / mixed-signal (5) |
| Archetype | builder / caretaker / scholar / innovator / leader / advocate (each ≥3) |
| Constraint | first-gen-heavy / work-hours-heavy / unconstrained / mixed (each ≥4) |
| Major | STEM / humanities / arts / business / undecided (each ≥3) |
| Portfolio size | 4–6 (≥3) / 7–9 (≥10) / 10–13 (≥10) / 14+ (≥3) |
| Spike clarity | clear-spike (≥8) / well-rounded (≥8) / contradictory (≥5) |

Store as JSON under `tests/fixtures/activity-calibration/F-NN-<archetype>-<tier>.json`:

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
  "input": { /* full ActivityWorkshopInput payload */ },
  "notes": "Synthetic but plausible. Modeled on tests/output/.... Edge: research + family-business work hours."
}
```

Sources:
- Start from existing `tests/output/` portfolios as templates
- Augment with synthetic ones to fill coverage gaps
- Every synthetic portfolio must be plausible — no impossible activities, no real org names that don't exist

### Deliverable 2: Baseline runner (`tests/run-activity-calibration.ts`)

A TypeScript runner that:
- Iterates every `tests/fixtures/activity-calibration/*.json`
- Runs full Activity Workshop pipeline (Stage 0 → 1 → 2 → 3 → Final Narrative)
- Captures: full output JSON, per-stage cost, per-stage latency, total cost, total latency, exact model versions used
- Writes baseline to `tests/fixtures/activity-calibration/baselines/<id>.json` with timestamp + git SHA pin
- Prints aggregate: total cost, total time, fixtures completed, errors

**Cost protection — non-negotiable**:
- Estimate cost BEFORE running. If estimate >$15 total, abort and surface the estimate
- Honor `feedback_cost_budget.md`: pause and request approval before exceeding $5 single-fixture or $15 sweep
- `--fast-loop` mode runs only 3 canary fixtures (explicitly named, representative) for iteration

Usage:
```bash
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-activity-calibration.ts                # full sweep
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-activity-calibration.ts --fixture F-01
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-activity-calibration.ts --fast-loop    # 3-fixture canary
```

### Deliverable 3: Methodology doc (`docs/activity-workshop-wrap-up/calibration/methodology.md`)

Reusable doc covering:
- How fixtures were chosen + stratification rationale
- How baselines are captured (model versions, timestamps, git SHA pinning)
- How to add a new fixture without breaking stratification
- How to interpret a "regression": per-fixture floor (no individual drop >X) + aggregate (not aggregate-only — finding A-4 fix)
- Fast-loop subset: which 3 fixtures are canaries, why those three
- Cost envelope: per-fixture, per-sweep, per-fast-loop (target: full sweep <$15)

## Quality bar

- **Every stratification cell hit ≥1.** Verify manually via coverage table; auto-verify with the bonus audit script below.
- **Baselines pin model versions** (`claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001`). If Anthropic rotates IDs, baselines explicitly invalidate (don't silently use the new model).
- **Fast-loop subset (3 fixtures) is named** and explicitly representative — chosen for diversity, not random.
- **Cost-per-run measured + recorded** per fixture. First baseline run IS the evidence for Phase 3 envelope approval.
- **No fixture uses real-sounding-but-fake org names.** Use `<School Name>` placeholders if needed.

## Output structure

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
└── audit-calibration-coverage.ts        (bonus)

docs/activity-workshop-wrap-up/calibration/
└── methodology.md
```

## Bonus

`tests/audit-calibration-coverage.ts` — reads every fixture, prints coverage table, exits non-zero if any cell is empty. Reusable as fixtures evolve.

Begin by reading `types.ts` to lock the exact `ActivityWorkshopInput` schema, then design the coverage table, THEN start authoring fixtures. Don't write code until the schema is grounded.
