# Parallel Workstreams

> While the main thread revises the plan (v1 → v2 → re-review → execute), these 4 workstreams run in parallel. Each is self-contained — paste the prompt into a fresh session/agent/team and it runs without blocking the main thread.

## Main thread (Tue + Claude, sequential)

This is what you and I drive directly. Estimated 3–5 working days, gated by your decisions.

1. **Verify** the Phase 1 grep findings personally (15 min) — confirm the 5 modules are wired
2. **Decide** the UX-first reframe (yes/no — strong recommendation: yes)
3. **Decide** Phase 2 split (2A output transforms / 2B architecture) and revised timeline (~14 weeks)
4. **Pre-approve** Phase 3 cost envelope ($150–$200)
5. **Patch** `02-EXECUTION-PROMPT.md` with the plan-amendment protocol
6. **Re-issue** `01-MASTER-PLAN.md` as v2 incorporating B1–B5 + M1–M5 from `work-logs/forge-plan-review.md`
7. **Re-run** forge-plan adversarial review against v2 (same 3-agent pipeline)
8. **Unlock execution** only if v2 passes

The parallel workstreams feed v2 with the inputs it needs (exemplar artifact, compliance design, UX north star, calibration baselines) so v2 isn't authored in a vacuum.

## Parallel workstreams (dispatch in any order, run concurrently)

| ID | Title | Output | Why it can parallelize |
|----|-------|--------|------------------------|
| [WS-A](WS-A-exemplar-artifact.md) | Exemplar target output | Hand-authored Executive Brief, Cut-List, model-sentences, advice-trace UI text | Pure editorial work; no code, no infra deps |
| [WS-B](WS-B-compliance-design.md) | Outcomes consent design | FERPA/COPPA analysis + consent flow + retention policy | Legal/policy research; no code deps |
| [WS-C](WS-C-ux-north-star.md) | UX north-star brief | IA wireframe + visual reference library + design brief | Design research; no code deps |
| [WS-D](WS-D-calibration-baseline.md) | Calibration set + baselines | 20-30 portfolio fixtures + locked baselines + methodology | Engineering against current pipeline; no plan-v2 deps |

## Dispatch options

- **Solo session**: paste one WS prompt into a fresh Claude Code session at repo root
- **Swarm**: dispatch all 4 to specialized agents (per `docs/SWARM_GUIDE.md`)
- **Mixed**: WS-A (Tue handwrites), WS-B (legal subagent), WS-C (you), WS-D (Claude agent)

## Dependency graph

```
Main thread:     [Verify B1] → [Decide reframe] → [Plan v2] → [Re-review] → [Execute]
                                                      ↑
WS-A (exemplar)  ────────────────────────────────────┤
WS-B (compliance) ───────────────────────────────────┤
WS-C (UX brief)  ────────────────────────────────────┤
WS-D (calibration)───────────────────────────────────┘
```

All four feed into "Plan v2 authoring." None block each other. Plan v2 is the convergence point.

## Status tracking

Each WS file ends with a "Status" section. Update it at start/handoff/completion. Index here updates only at workstream complete:

- [ ] WS-A: Exemplar artifact
- [ ] WS-B: Compliance design
- [ ] WS-C: UX north star
- [ ] WS-D: Calibration baseline
- [ ] Main: Plan v2 authored
- [ ] Main: v2 forge-plan review passed
- [ ] Main: Execution unlocked
