# Pipeline Evolution — Shared Planning Workspace

> **Purpose**: A single coordinated source of truth for three parallel chats working on the Essay Intelligence pipeline. Prevents overlap, contradiction, and lost context between sessions. Treat this directory like a lightweight MCP: every chat reads the index first, writes to its own workstream directory, and updates shared contracts when it touches something another chat cares about.

## Why this exists

Three chats are running in parallel:

1. **Cost recovery + intentional pipeline flow** (this chat, the one you're reading from).
2. **Conversator ↔ Analysis ground truth integration** — anti-fabrication, ExperienceProfile schema, injecting student's real life into the pipeline.
3. **Intelligent RAG architecture** — layered retrieval of the deep research corpus (Wave-3a, Harvard-10, taxonomies) into L1–L6 without dumping or drowning context.

All three touch the same files (`holisticSynthesis.ts`, `profileRouter.ts`, `analysisOrchestrator.ts`, `sequentialDeepWalk.ts`, `deepAnnotationService.ts`, `crystallizer.ts`, the corpus modules). Without coordination, they will contradict each other, step on the same prompt blocks, and produce fixes that either conflict or silently undo each other.

This directory is how they coordinate.

## Rules for every chat

1. **READ** `00-index/CURRENT_STATE.md` at the start of every work session. It names who owns what file, what's landed, what's in flight, what's blocked.
2. **READ** `shared/CONTRACTS.md` before proposing any change to a shared interface (prompts, schemas, routes). Contracts are binding across chats.
3. **WRITE** your plans, decisions, and outputs to your own workstream directory (`01-cost-recovery/`, `02-conversator-ground-truth/`, `03-intelligent-rag/`). Do not write into another chat's directory.
4. **UPDATE** `00-index/CURRENT_STATE.md` whenever a tier/phase changes status (planned → in flight → landed → verified).
5. **UPDATE** `shared/CONTRACTS.md` whenever you change a shared interface. Document what changed, what callers must migrate, and why.
6. **LOG** cross-chat dependencies in `shared/HANDOFFS.md`. Example: "Cost recovery Phase C1 depends on Intelligent RAG agreeing that Phase B schema cuts don't break its planned retrieval surface."
7. **NEVER** silently duplicate work another chat has planned. If you see overlap, flag it in `shared/HANDOFFS.md` and wait for resolution.
8. **NEVER** hand-edit the checked-in code until a plan is reviewed. This workspace is planning-first; execution is explicit.

## Layout

```
docs/pipeline-evolution/
├── README.md                          ← this file
├── 00-index/
│   ├── CURRENT_STATE.md               ← single source of truth: who owns what, status
│   ├── FILE_OWNERSHIP.md              ← which chat owns which source files
│   └── GLOSSARY.md                    ← shared vocabulary
├── 01-cost-recovery/                  ← this chat's workstream
│   ├── PLAN.md                        ← consolidated changeset, verification plan
│   ├── DECISIONS.md                   ← decisions Tue has made, with dates
│   ├── AUDITS/                        ← forensic audit outputs already gathered
│   └── POST_RUN/                      ← after verification run, results land here
├── 02-conversator-ground-truth/       ← chat 2's workstream
│   ├── PLAN.md                        ← will be populated by chat 2
│   └── DECISIONS.md
├── 03-intelligent-rag/                ← chat 3's workstream
│   ├── PLAN.md                        ← will be populated by chat 3
│   └── DECISIONS.md
└── shared/
    ├── CONTRACTS.md                   ← shared interfaces, schemas, prompts
    ├── HANDOFFS.md                    ← cross-chat dependencies and resolutions
    └── CHANGE_LOG.md                  ← chronological log of all landed changes
```

## Conventions

- **Status values** for work items: `draft` | `planned` | `approved` | `in_flight` | `blocked` | `landed` | `verified` | `reverted`.
- **Ownership**: every source file listed in `FILE_OWNERSHIP.md` has exactly one "primary" chat. Other chats can read, but must propose changes through handoffs.
- **Dates**: always absolute. `2026-04-23`, not "Tuesday" or "yesterday".
- **Cross-references**: use relative links. `[Phase C1](../01-cost-recovery/PLAN.md#phase-c1)`.
- **Contract changes**: require `CONTRACTS.md` update BEFORE the code change. If a chat ships a contract change without updating this file, other chats have standing authorization to revert.

## Anti-patterns this workspace is designed to prevent

- Chat A rewrites a prompt that chat B was about to extend.
- Chat A adds a new schema field that chat B's deletion work was predicated on.
- Chat A caches a prompt prefix that chat B wants to inject research into.
- Two chats both solve fabrication (one via ground truth, one via regex guards) with neither knowing about the other.
- A cost fix that ships before a quality integration, locking in a design that the quality work has to undo.
- A plan lands in one chat and is invisible to the others.

## If you are a chat starting work

1. Read `00-index/CURRENT_STATE.md` — know the shape of what's in flight.
2. Read `00-index/FILE_OWNERSHIP.md` — know what you own and what you don't.
3. Read `shared/CONTRACTS.md` — know the binding interfaces.
4. Read `shared/HANDOFFS.md` — know the open questions and dependencies.
5. Read your own workstream's `PLAN.md` and `DECISIONS.md` — restore context.
6. Only then, plan and act.
