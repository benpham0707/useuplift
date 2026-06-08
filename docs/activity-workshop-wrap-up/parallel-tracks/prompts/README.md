# Paste-Ready Prompts

Each file in this folder is the **prompt itself** — open the file, select all, copy, paste into a fresh Claude Code session at repo root.

## Four prompts

| File | Workstream | Output location |
|------|------------|-----------------|
| [WS-A-PROMPT.md](WS-A-PROMPT.md) | Hand-authored target exemplar (Executive Brief, Cut-List, model sentences, advice-trace UI) | `docs/activity-workshop-wrap-up/exemplars/` |
| [WS-B-PROMPT.md](WS-B-PROMPT.md) | FERPA/COPPA consent & retention design + SQL migrations | `docs/activity-workshop-wrap-up/compliance/` |
| [WS-C-PROMPT.md](WS-C-PROMPT.md) | IA wireframe + visual reference library + design brief | `docs/activity-workshop-wrap-up/ux/` |
| [WS-D-PROMPT.md](WS-D-PROMPT.md) | 20–30 calibration fixtures + baseline runner + methodology | `tests/fixtures/activity-calibration/` + `docs/activity-workshop-wrap-up/calibration/` |

## How to dispatch

**Single session**: `cat docs/activity-workshop-wrap-up/parallel-tracks/prompts/WS-A-PROMPT.md` → paste into fresh Claude Code session.

**Multi-session in parallel**: open 4 terminal tabs / browser tabs, paste one prompt per session, let them run concurrently. None block each other.

**Swarm (advanced)**: dispatch via Agent tool with `subagent_type: general-purpose`, paste the prompt as the `prompt` parameter. See `docs/SWARM_GUIDE.md`.

## Dispatch order recommendation

If running sequentially through your own sessions:
1. **WS-A first** (exemplar) — feeds WS-C (UX wireframe needs to know what data it surfaces)
2. **WS-D in parallel with WS-A** — independent, no shared deps
3. **WS-B in parallel** — independent, long lead time for legal review anyway
4. **WS-C after WS-A** (or in parallel if comfortable working from the plan specs directly)

All four converge at "plan v2 authoring" — the main thread waits on these inputs to author v2.
