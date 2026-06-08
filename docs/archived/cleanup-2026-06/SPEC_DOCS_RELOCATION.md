# Spec Docs Relocation — 2026-06-02 (Phase D)

Moved the 7 authoritative spec docs out of the repo root into `docs/specs/`:
`PLAN.md`, `PLAN2.md`, `FORGE_PLAN_{ARTIFACTS,SCOPE1,SCOPE2,SCOPE3,UNIFIED}.md`.

**Why it's safe:** these had no runtime `fs` reads — every reference was a `src/`
comment pointer (`// Spec: PLAN.md`, `// See FORGE_PLAN_ARTIFACTS.md`). Verified
across the whole repo before moving.

**Reference updates (word-boundary, true refs only):** 11 clean `src/` files + 14
live docs + 3 memory files re-pointed to `docs/specs/<NAME>.md`. `REPO_ORGANIZATION.md`
allowlist and `docs/README.md` updated.

**Intentionally NOT rewritten (false positives):** `CLAUDE.md` / `forge-plan.md`
("create/update a `PLAN.md`" is the generic planning protocol, not the spec);
`pipeline-evolution/*/PLAN.md` (link to a different workstream `PLAN.md`);
`.planning/` (separate workspace); historical `docs/archived/**`.

**Deferred (preserve in-flight isolation):** 4 uncommitted pipeline files still
carry bare `PLAN.md`/`FORGE_PLAN_*` comment pointers — harmless (comments only),
to be re-pointed after the in-flight work is committed:
- src/services/essayIntelligence/coaching/coachingService.ts
- src/services/essayIntelligence/profileTypes.ts
- src/services/essayIntelligence/analysis/phaseAssessment.ts
- src/services/essayIntelligence/profileManager/profileRouter.ts

Root: 12 → 5 tracked load-bearing `.md`. tsc --noEmit exit 0.
