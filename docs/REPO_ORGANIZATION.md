# Repo Organization & File Hygiene

> **Purpose:** keep the repo navigable. Born out of the 2026-05-28 cleanup that
> archived 179 historical markdown files out of the project root. These rules
> stop that sprawl from regrowing. Referenced by `CLAUDE.md` — follow them.

---

## 1. The root directory is for live, load-bearing files only

A markdown file may live at the **repo root** only if it is one of:

| File | Why it's allowed at root |
|------|--------------------------|
| `README.md` | Standard repo entry point |
| `CLAUDE.md` | Auto-loaded dev standards (source of truth) |
| `GEMINI.md` | Auto-loaded by the Gemini CLI from the working dir |
| `COORDINATION.md` | Live cross-agent session scratchpad (read/written per `GEMINI.md`) |
| `BUILD_COST_LEDGER.md` | **Read/written at runtime** by `buildCostLedger.ts` (`cwd()/BUILD_COST_LEDGER.md`) — moving it breaks cost tracking |

**Litmus test before creating a root-level `.md`:** *Is this file imported,
read at runtime, or auto-loaded by tooling?* If no → it goes in `docs/`.

> **Spec docs live in `docs/specs/`, not root.** `PLAN.md`, `PLAN2.md`, and the
> `FORGE_PLAN_{ARTIFACTS,SCOPE1,SCOPE2,SCOPE3,UNIFIED}.md` artifacts were relocated
> there (2026-06-02) — they're cited only in `src/` *comments* (no runtime read), so
> they don't need to sit at root. Reference them as `docs/specs/<NAME>.md`.

**Anything else — design docs, audits, summaries, handoff prompts, "X_COMPLETE"
status files, college overlays — does NOT belong at root.** It goes under `docs/`.

---

## 2. Where things go

```
docs/
├── README.md                     # the index — start here
├── REPO_ORGANIZATION.md          # this file
├── <topic>/                      # LIVE design docs, grouped by subsystem
│   (essay-intelligence/, research/, analysis/, pipeline-evolution/ …)
└── archived/                     # everything historical / superseded
    ├── citation/                 # citation-system design era
    ├── forge/                    # FORGE debate + plan docs (non-code-cited)
    ├── college-overlays/         # per-college overlay databases
    ├── lovable/                  # Lovable frontend handoff prompts
    ├── phases/                   # PHASE_* / STAGE_* milestone docs
    ├── plans/                    # superseded PLAN-* / PLAN_* docs
    ├── pricing/                  # pricing/credit strategy docs
    ├── research/                 # historical research notes
    ├── summaries/                # *_COMPLETE.md / *_SUMMARY.md status snapshots
    └── misc/                     # one-offs that don't fit a bucket
```

**Live vs archived:** a doc is **live** if it describes the *current* design or
an *in-flight* initiative. The moment a doc is a status snapshot ("…_COMPLETE",
"…_SUMMARY", "FINAL_…"), a closed audit, or describes a superseded design, it is
**archived**, not deleted — git history + the `archived/` tree preserve it.

---

## 3. Never delete — archive

Historical docs are **moved with `git mv` into `docs/archived/<bucket>/`**, never
`rm`-ed. This preserves file history and keeps the knowledge searchable. (Truly
regenerable artifacts — build output, temp screenshots, dependency dirs — are the
exception; those are `.gitignore`-d, see §5.)

---

## 4. Tests & generated output

- **Test source** → `tests/` (`tests/test-*.ts`, `tests/unit/*.test.ts`, harnesses). Committed.
- **Curated reference artifacts** (the canonical profile dumps used as quality baselines, e.g. `tests/output/full-profile-*.md`) → committed **explicitly**, one at a time.
- **Transient dumps** (`*.jsonl` telemetry, `phase-b-dump.json`, ad-hoc audit `.md`) → **not committed**; they're gitignored or simply left untracked. Don't `git add tests/output/` wholesale.

---

## 5. What is gitignored (cruft that must never be committed)

- `.tmp-screenshots/` — disposable UI-iteration captures
- `clerk-nextjs/node_modules/`, `mcp-uplift-portfolio/node_modules/` — nested sub-project deps
- `*.log`, `dist/`, `build/`, `coverage/`, `node_modules/` — standard build/dep cruft
- `tests/output/**/*.jsonl`, `tests/output/phase-b-dump.json` — transient dumps
- External corpus raw/essays/transcripts — third-party copyright

**Nested sub-projects** `clerk-nextjs/` (its own git repo) and
`mcp-uplift-portfolio/` are intentionally **not tracked** by the main repo. Leave
them be; do not delete or force-add them.

---

## 6. Committing in-flight feature code

Do **not** commit code that fails `npx tsc --noEmit`. A half-built feature stays
untracked on its branch until it's green — committing 24 type errors "to get it
tracked" is not cleanup, it's debt. Land features when they compile.

---

## 7. Quick self-check before any commit that adds docs

1. New `.md` at repo root? → move to `docs/` (unless it's in the §1 allowlist).
2. Status/summary/audit doc? → `docs/archived/<bucket>/`.
3. Generated dump under `tests/output/`? → don't `git add` it.
4. `npx tsc --noEmit` green? → required for any `src/` commit.
