# Agent Teams / Swarm Guide

> **Read this file when planning or running a multi-agent swarm.**
> Referenced from CLAUDE.md — not loaded every session.
> The standing authorization and decision triggers live in CLAUDE.md so they're always active.

---

## Strategic Decision Framework

Before spawning, ask yourself:

1. **Is there real parallelism?** Can teammates work on genuinely independent units simultaneously, or will they mostly be waiting on each other? If work is inherently sequential, a swarm adds coordination overhead for no speed gain.

2. **Does the task have clear domain boundaries?** Swarms excel when you can carve clean ownership lines (e.g., frontend/backend/tests). If work is deeply interconnected in a single module, one focused agent thinking deeply will outperform three agents stepping on each other.

3. **Is depth or breadth the bottleneck?** Deep careful reasoning in one area → single agent wins. Breadth across many areas → swarm wins.

4. **Right-size the team.** More agents ≠ better results. Match team size to the actual parallelizable work:
   - **2-3 agents**: Moderate tasks with 2-3 independent workstreams
   - **4-5 agents**: Cross-layer features (frontend + backend + services + tests)
   - **6-8 agents**: Large builds, major refactors, or deep multi-angle investigations

## When to Swarm vs. Single-Agent

**High-value swarm scenarios:** Cross-layer features, codebase-wide refactors, multi-angle investigation/debugging, building new service modules, research-heavy parallel exploration.

**Keep it single-agent:** Single/few-file changes, deep sequential reasoning (prompt design, algorithm refinement), questions/review/small tweaks, tasks where coordination overhead exceeds the benefit.

**Anti-patterns to avoid:**
- **Over-fragmentation**: Don't split naturally cohesive work across 4 agents. A single agent with full context produces more coherent code.
- **Swarm-for-swarm's-sake**: If coordination cost exceeds the work itself, go single-agent.
- **Shallow parallel work**: Three agents doing surface-level work is worse than one going deep.
- **Premature spawning**: Read the relevant code and understand the task before deciding team composition.

## Team Composition for Uplift

| Role | Domain | Key Files |
|------|--------|-----------|
| **Frontend** | React components, UI/UX, Tailwind, shadcn/ui | `src/components/`, `src/pages/`, `src/hooks/` |
| **Backend** | Express routes, middleware, API endpoints | `src/http/`, `src/services/credits/`, `src/services/api/` |
| **AI/Services** | Claude integration, prompts, analysis engines | `src/services/orchestrator/`, `src/core/analysis/`, `src/lib/llm/` |
| **Workshop** | Multi-stage workshops | `src/services/commonAppWorkshop/`, `src/services/narrativeWorkshop/`, `src/services/piqWorkshop/`, `src/services/portfolioStrategy/services/` |
| **Data/Research** | Academic data, course knowledge, majors | `src/services/portfolioStrategy/data/`, `src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/` |
| **Testing** | E2E tests, integration tests | `tests/` |
| **Database** | Supabase schema, migrations, RLS | `supabase/migrations/`, `src/integrations/supabase/` |

## Teammate Rules

1. **File Ownership**: Teammates MUST declare files before starting. No two teammates touch the same file.
2. **Type Contracts First**: Define shared interfaces in `types.ts` files before implementing in parallel.
3. **Integration Points**: Lead coordinates cross-boundary handoffs — define the contract, then both sides build to it.
4. **Testing**: Each teammate tests their domain. Testing specialist runs cross-cutting E2E after integration.
5. **Blockers**: Report to the Lead immediately. Never work around blockers with hacks.

## Swarm Quality Gates

Before the Lead considers a swarm task complete:

- [ ] All teammates reported completion
- [ ] No file conflicts between worktrees
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] All tests pass (teammate + E2E integration)
- [ ] Lead reviewed combined diff for consistency
- [ ] No regressions in existing functionality
