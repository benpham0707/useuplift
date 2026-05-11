# 02 — Conversator ↔ Analysis Ground Truth

> ⚠️ **SUPERSEDED 2026-05-10** — the design returned via the L5 doc-set
> (`../04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md` §3, §4 owns the
> Conversator-as-targeted-inquiry-agent design). Conversator integration is
> now Phase 3 of the integrated build sequence under workstream 04, not a
> standalone deliverable from this workstream. This stub is preserved as a
> historical pointer.
>
> **Status**: `superseded by L5 doc-set` — see `L5/L5_E2E_INTEGRITY_AUDIT.md`.
> **Last updated**: 2026-05-10.

---

## Original spec (preserved as historical context)

**Workstream lead**: Conversator integration chat.
**Goal**: eliminate fabrication (P0 of Deep Research Synthesis) by wiring the Conversator's output as structured ground truth into the Essay Intelligence pipeline's rewrite paths.
**Source prompt**: kicked off separately, per user request 2026-04-23. Expected deliverable: `docs/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md`.

**Last updated (original)**: 2026-04-23
**Status (historical)**: `in_flight` — design doc being produced.

---

## Stub — to be populated by Conversator chat

When the Conversator chat returns its design doc, this file should be replaced/extended with:

1. **Current state** — what exists in conversator code today, what's wired/unwired.
2. **Target state** — ExperienceProfile schema, injection architecture.
3. **Rollout phases** — incremental implementation plan.
4. **Pipeline integration points** — L1, L3, L3.5, L5, L6 hooks, with file:line.
5. **Status tracking** — per-phase status table.
6. **Links to CONTRACTS.md entries** added by this workstream.

---

## Known cross-dependencies (from cost chat's initial map)

- **L3 walk integration** waits on Cost Phase D1 (cache prefix stabilization). Then adds ExperienceProfile as a second cached block in canonical order — see [CONTRACTS.md § L3 walk user prompt structure](../shared/CONTRACTS.md).
- **L5 rewrite grounding** waits on Cost Phase D2 (sharedContext cache marker). Then adds ExperienceProfile constraint block as another cached block — see [CONTRACTS.md § L5 user prompt structure](../shared/CONTRACTS.md).
- **Fabrication strategy coordination**: overlaps with RAG chat's potential corpus-anchored rewrite approach. Need positioning (primary vs complementary) — see [HANDOFFS.md § H6](../shared/HANDOFFS.md).
- **Port A2 / `ENABLE_VOICE_PROFILE_IMPORT`** claimed by this workstream (it's already a voice-persistence design).

---

## Obligations to other workstreams

Before implementing:

- [ ] Read [README.md](../README.md), [CURRENT_STATE.md](../00-index/CURRENT_STATE.md), [FILE_OWNERSHIP.md](../00-index/FILE_OWNERSHIP.md), [CONTRACTS.md](../shared/CONTRACTS.md), [HANDOFFS.md](../shared/HANDOFFS.md).
- [ ] Acknowledge or propose alternative to L3 walk canonical block order (H2).
- [ ] Reserve 1 cache breakpoint at L5 (H3).
- [ ] Declare anti-fabrication primacy position (H6).
- [ ] Claim or decline `ENABLE_VOICE_PROFILE_IMPORT` ownership (H5).

---

## Links

- [DECISIONS.md](./DECISIONS.md)
- [CONTRACTS.md](../shared/CONTRACTS.md)
- [HANDOFFS.md](../shared/HANDOFFS.md)
- [CHANGE_LOG.md](../shared/CHANGE_LOG.md)
- [01 Cost PLAN.md](../01-cost-recovery/PLAN.md)
