# 03 — Intelligent RAG Architecture

> ⚠️ **SUPERSEDED 2026-05-10** — the design returned via the L5 doc-set
> (`../04-pipeline-architecture/L5/L5_FEEDBACK_REDESIGN.md` §2 / §5 owns the
> retrieval architecture; the resolver pattern + tiered-generator + citation
> resolution layer cover the original RAG goals). Per the unified plan,
> 3 of 11 corpus types are wired (`CraftMove`, `EssayArchetype`,
> `VoiceRegister` via `corpusRetrievalBlocks.ts`); the remaining 8 land
> as Phase 8 corpus-retrieval activation. The 5 unset `ENABLE_CORPUS_RETRIEVAL_*`
> flags are the operational gates. This stub is preserved as a historical pointer.
>
> **Status**: `superseded by L5 doc-set` — see `L5/L5_FEEDBACK_REDESIGN.md`.
> **Last updated**: 2026-05-10.

---

## Original spec (preserved as historical context)

**Workstream lead**: RAG architecture chat.
**Goal**: wire the dormant research corpus (Wave-3a: 190 moves, 14 archetypes, 98 compatibility cells; plus anti-archetypes, school-fit vectors, move dependencies, contextual validity, corpus limits, cliché library) into the pipeline via a layered, budgeted retrieval architecture. Not a dump — an intelligent retrieval where the right research flows to the right layer at the right cost.
**Source prompt**: kicked off separately, per user request 2026-04-23. Expected deliverable: `docs/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`.

**Last updated (original)**: 2026-04-23
**Status (historical)**: `in_flight` — design doc being produced.

---

## Stub — to be populated by RAG chat

When the RAG chat returns its design doc, this file should be replaced/extended with:

1. **Research-utilization matrix** — which asset answers which question at which layer.
2. **Target architecture** — retrieval triggering model, budget framework, per-layer RAG strategy.
3. **Anti-contamination guards** — relevance thresholds, mutual exclusion, cache strategy.
4. **Dormant asset rollout order** — prioritized integration plan.
5. **Corpus flag flip sequence** — per-layer activation order + quality gates.
6. **Status tracking** — per-phase status table.
7. **Links to CONTRACTS.md entries** added by this workstream.

---

## Known cross-dependencies (from cost chat's initial map)

- **Hard block**: `ENABLE_CORPUS_RETRIEVAL_L35` cannot flip until Cost Phase C lands. Phase B truncation is what's preventing corpus E2E validation today. See [HANDOFFS.md § H1](../shared/HANDOFFS.md).
- **L3 walk research block** rides in cached prefix canonical order — see [CONTRACTS.md § L3 walk user prompt structure](../shared/CONTRACTS.md).
- **L5 retrieval block** uses 1 cache breakpoint at L5 — see [HANDOFFS.md § H3](../shared/HANDOFFS.md).
- **`profileRouter` extend-or-replace decision** — Cost's backlogged Tier 5.2 (69 always-priority demotion) depends on this. See [HANDOFFS.md § H4](../shared/HANDOFFS.md).
- **Anti-fabrication positioning** — RAG should declare itself COMPLEMENTARY to 02's ground truth, not competing. See [HANDOFFS.md § H6](../shared/HANDOFFS.md).

---

## Obligations to other workstreams

Before implementing:

- [ ] Read [README.md](../README.md), [CURRENT_STATE.md](../00-index/CURRENT_STATE.md), [FILE_OWNERSHIP.md](../00-index/FILE_OWNERSHIP.md), [CONTRACTS.md](../shared/CONTRACTS.md), [HANDOFFS.md](../shared/HANDOFFS.md).
- [ ] Confirm `ENABLE_CORPUS_RETRIEVAL_L35` flip waits on Cost Phase C verification (H1).
- [ ] Acknowledge or propose alternative to L3 walk canonical block order (H2).
- [ ] Reserve 1 cache breakpoint at L5 (H3).
- [ ] Declare extend-or-replace for `profileRouter` (H4).
- [ ] Claim or decline `ENABLE_AI_RISK_SIGNAL` ownership (H5).
- [ ] Confirm complementary position on anti-fabrication (H6).

---

## Links

- [DECISIONS.md](./DECISIONS.md)
- [CONTRACTS.md](../shared/CONTRACTS.md)
- [HANDOFFS.md](../shared/HANDOFFS.md)
- [CHANGE_LOG.md](../shared/CHANGE_LOG.md)
- [01 Cost PLAN.md](../01-cost-recovery/PLAN.md)
