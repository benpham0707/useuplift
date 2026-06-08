# Activity Workshop Wrap-Up

Master plan for finishing the Activity Workshop — integrate built-but-not-wired modules, ship counselor-parity P0 items, calibrate, then UX overhaul.

## Goal
Convert the current ~$0.40, ~5-7 min, 80%-analytical / 30%-editorial Activity Workshop into a fully-integrated, calibrated, UX-finished product that delivers counselor-parity editorial output on the 7 axes where AI legitimately wins (availability, iteration count, consistency, cross-draft memory, multi-essay coordination, accessibility, speed).

## Docs in this folder
- [01-MASTER-PLAN.md](01-MASTER-PLAN.md) — 4-phase plan with gates, ~10–12 weeks (**v1 — failed adversarial review, awaiting v2**)
- [02-EXECUTION-PROMPT.md](02-EXECUTION-PROMPT.md) — paste-ready handoff (needs amendment protocol patch)
- [parallel-tracks/](parallel-tracks/00-INDEX.md) — 4 parallel workstreams (WS-A through WS-D) + main thread sequence
- `work-logs/forge-plan-review.md` — adversarial review verdict (5 BLOCKERS, 5 MAJORS)
- `exemplars/`, `compliance/`, `ux/`, `calibration/` — output folders for the parallel workstreams

## Scope
- **In scope:** `src/services/portfolioStrategy/services/activityWorkshop/` + its rendered UI surface
- **Out of scope:** Essay Intelligence, Common App / PIQ / Narrative / Academic workshops, marketing/GTM
- The Essay Intelligence wrap-up will follow the same playbook in a separate effort

## Status
- Created: 2026-05-12
- Phase: **PAUSED — plan v1 failed adversarial review**
- Owner: Tue
- Adversarial review: [complete — 5 BLOCKERS, 5 MAJORS, 6 minors](work-logs/forge-plan-review.md)
- Next action: review findings → decide on plan v2 reframe → re-run adversarial check before unlocking execution

## Review verdict (one line)
Plan v1 is structurally well-disciplined (gates, parallel tracks, integration-debt awareness) but has wrong premise (Phase 1 modules are already wired), wrong sequencing (UX last when UX is the moat), and missing compliance/budget envelopes. **Do not execute as written.**

## Update protocol
- Update **Phase** above at end of every work session
- Append concrete completion under the matching phase heading in `01-MASTER-PLAN.md`
- Never claim phase complete without the explicit gate check passing
