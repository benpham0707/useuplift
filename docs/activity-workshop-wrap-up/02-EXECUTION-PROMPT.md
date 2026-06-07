# Activity Workshop Wrap-Up — Execution Handoff Prompt

> Paste this into a fresh Claude Code session at repo root to begin (or continue) execution.
> Re-paste at the start of every new session. The prompt is self-contained.

---

## Your job

You are executing the Activity Workshop wrap-up effort. The plan is locked. You are not here to redesign it — you are here to drive it to "done" while obeying its non-negotiable rules.

## Read first (every session, in order)

1. `docs/activity-workshop-wrap-up/00-INDEX.md` — find the current **Phase** status
2. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` — locate the active phase section
3. `docs/activity-workshop-wrap-up/work-logs/` — read the most recent log to know what was just done
4. `CLAUDE.md` §1a (NO GUESSING) — the rules below derive from it; treat as binding

## Determine the next action

1. What is the current phase?
2. What gate must be green to be in this phase? Verify it.
3. What is the next uncompleted task within the current phase?
4. Are there blockers (failing tests, integration debt, missing fixtures)?

If a gate is not actually green → stop. Surface the gap. Do not paper over it to move forward.

## Non-negotiable execution rules

1. **No "should work" commits.** If the change isn't verified by a calibration diff (for prompts/logic) or a green `npx tsc --noEmit` + reachability grep (for new wiring), it doesn't ship.
2. **No bulk wiring.** Each integration walks E2E before the next starts. Memory's integration-debt pattern recurred because changes were batched.
3. **No silent fallbacks.** Per `CLAUDE.md`: never return fake/heuristic results to mask a failure. Surface the failure, fix the path.
4. **No new build front while debt remains.** If you're in Phase 1 and tempted to start a Phase 2 item, stop. The plan exists to prevent that exact move.
5. **One prompt tune at a time.** Calibration set run after each. Revert anything that regresses aggregate score.
6. **Always grep before claiming "live".** A module is not integrated until you can name the live call site.

## Use of tools

- **Agent/Explore** for codebase research — but never duplicate what you've already delegated. Read the returned summary before re-investigating.
- **TaskCreate** for any work spanning >2 tool calls; mark complete as you go, never batch.
- **Bash** for `tsc`, `grep`, calibration runs. Avoid `cat`/`echo`; use `Read`/`Write`/`Edit`.
- **Swarms** allowed only for Phase 2 items 2.1–2.7 where parallelism is genuinely independent. Phase 0/1 is sequential by design.
- Before any code change, write a focused work log at `docs/activity-workshop-wrap-up/work-logs/<phase>-<task>.md` capturing: what you're changing, why, what diff you expect on calibration, rollback plan.

## End-of-session protocol

- The subtask you closed has a green check (calibration diff, type check, or written audit entry)
- `00-INDEX.md` Phase line is updated
- A `work-logs/<phase>-<task>.md` exists with: what shipped, calibration diff, follow-ups
- No half-finished file changes remain in the working tree (stash or commit, don't abandon)
- If you ran out of time mid-task, write `work-logs/RESUME-HERE.md` with: current state, exact next step, blockers

## When to escalate

- Any phase gate fails and the fix isn't obvious
- Cost or latency target appears infeasible (Phase 3 specifically)
- A P0 item turns out to depend on Essay Intelligence wrap-up (out of scope here)
- Calibration baseline regresses without an obvious cause
- You found integration debt the audit missed
- A sub-agent reports success without verifiable artifacts — flag it, don't accept it

## Start now

1. Read the docs in order above
2. State out loud: current phase, current task, gate state
3. If green and unblocked → execute the next task
4. If blocked → surface the blocker to the user with the smallest viable fix path

Do not negotiate scope. Do not propose new features. Do not skip gates. Drive the plan as written, and escalate the rare case it needs revision.
