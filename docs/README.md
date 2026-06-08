# Uplift Documentation Index

> Start here. **Rules for what goes where:** [REPO_ORGANIZATION.md](./REPO_ORGANIZATION.md).
> Project root holds only live, load-bearing files (README, CLAUDE.md, GEMINI.md,
> COORDINATION.md, BUILD_COST_LEDGER.md). The authoritative spec docs (PLAN, PLAN2,
> FORGE_PLAN_*) live in [`docs/specs/`](./specs/); everything else lives under `docs/`.

## Live documentation

| Area | Path | What's there |
|------|------|--------------|
| Essay Intelligence | [`essay-intelligence/`](./essay-intelligence/) | Current Essay Intelligence pipeline design |
| Pipeline evolution | [`pipeline-evolution/`](./pipeline-evolution/) | Active L3–L6 architecture work, cost recovery, RAG, conversator ground-truth |
| Writing-quality analysis | [`analysis/`](./analysis/) | Writing improvement roadmap, success criteria, per-workshop writing analyses, cost/output cut lists |
| Research | [`research/`](./research/) | Numbered research taxonomy (sections 1–6: activities, awards, character, red-flags, academic history), counseling-system, extracurricular databases, synthesis |
| Architecture | [`architecture/`](./architecture/) | Writing-quality engine architecture |
| Workshop | [`workshop/`](./workshop/) | Workshop chat system docs |
| Specs / UI | [`specs/`](./specs/), [`ui-reference/`](./ui-reference/) | College database spec, product vision |
| Audits | [`audit/`](./audit/) | Standing audit reports |

## Historical / superseded

Everything historical is archived (never deleted) under
[`archived/`](./archived/) — bucketed by theme: `citation/`, `forge/`,
`college-overlays/`, `lovable/`, `phases/`, `plans/`, `pricing/`, `research/`,
`summaries/`, `misc/`, plus older `test-outputs/`. The 2026-05-28 cleanup moved
179 historical root-level docs here.

## Conventions

- **New design doc for a live subsystem** → its topic folder above.
- **Status snapshot / completion summary / closed audit** → `archived/<bucket>/`.
- **Never create design/summary `.md` at the repo root** (see REPO_ORGANIZATION.md §1).
