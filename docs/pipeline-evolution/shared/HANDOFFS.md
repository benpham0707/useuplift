# Cross-Chat Handoffs

> Every cross-workstream dependency, open question, and resolution lives here.
> Format: append-only log. Don't delete. Mark resolved.

**Last updated**: 2026-04-24

## Open handoffs

### H1 — RAG (03) waits on Cost (01) Phase C

**Raised**: 2026-04-23
**By**: 01 Cost
**To**: 03 RAG
**Status**: open

**Content**: `ENABLE_CORPUS_RETRIEVAL_L35` flag flip is blocked by Phase B output truncation. Cost chat's Phase C1/C2/C3 will get Phase B under 8K tokens (+ safety buffer). Until Phase C lands and is verified, RAG cannot run E2E validation with corpus on, because pipeline fails at Phase B before retrieval output can be observed downstream.

**Expected resolution**: After Phase C lands and verifies on fixtures 02 + 09 (previously failing), RAG is unblocked to flip flags per its architecture plan.

**RAG-side ack needed**: confirm RAG design doc does not assume Phase B truncation must stay (it doesn't — chat 2 prompt acknowledges this).

---

### H2 — L3 walk cache prefix canonical order

**Raised**: 2026-04-23
**By**: 01 Cost
**To**: 02 Conversator, 03 RAG
**Status**: open

**Content**: Cost Phase D1 will restructure L3 walk user prompt into a messages array with a single cached essay-text block (v2 of `L3 walk user prompt structure` contract). 02 and 03 will likely both want to add their own cached blocks (ExperienceProfile, research block).

Cache keys require exact prefix match, so block ORDER must be stable across all callers. Proposed canonical order:
```
[essay_text (01)] → [ExperienceProfile (02)] → [research_block (03)] → [accumulating] → [target]
```

**Ask**: 02 and 03, on returning your design docs, confirm you can work within this ordering. If not, propose alternative and update contract.

**Resolution condition**: both chats acknowledge in their PLAN.md.

---

### H3 — L5 per-paragraph context budget allocation

**Raised**: 2026-04-23
**By**: 01 Cost
**To**: 02 Conversator, 03 RAG
**Status**: open

**Content**: L5 runs 10× per essay. Any content injected per-paragraph multiplies by 10 in cost. Budget-conscious design needed.

- 02 wants rewrite grounding: ExperienceProfile constraint block.
- 03 wants anti-archetype + move retrieval.
- 01 (Cost Phase D2) stabilizes sharedContext cache.

If both 02 and 03 add cached blocks, they split the available cache budget (Anthropic allows 4 cache breakpoints per request; 1 is already used by system prompt, 1 by sharedContext). Two more available for ground-truth + research.

**Ask**: 02 and 03, reserve exactly ONE cache breakpoint each at L5 in your designs. Do not budget for more without coordination.

---

### H4 — `profileRouter` extension vs replacement

**Raised**: 2026-04-23
**By**: 01 Cost
**To**: 03 RAG
**Status**: open

**Content**: Cost has a backlogged Tier 5.2 item (demote 69 `priority: 'always'` sections in profileRouter). RAG likely wants to extend profileRouter with research-budget sibling OR replace the budget architecture.

If RAG proposes to REPLACE the router, Cost's Tier 5.2 should be cancelled (don't improve code that's being rewritten). If RAG proposes to EXTEND, Cost's Tier 5.2 becomes a prerequisite cleanup.

**Ask**: RAG design doc must state "extend" or "replace" decision in its section 3 (Budget and Priority Framework).

**Resolution condition**: RAG's PLAN.md declares intent; Cost updates backlog accordingly.

---

### H5 — Who owns `ENABLE_AI_RISK_SIGNAL` flip decision

**Raised**: 2026-04-23
**By**: 01 Cost
**To**: 02 Conversator, 03 RAG
**Status**: open

**Content**: Port F2 (AI risk signal) is feature-flagged OFF. It touches authorship/voice — relevant to both Conversator (fabrication concern) and RAG (signal could feed research-retrieval decisions).

Neither chat has claimed it yet. Without an owner, the flag stays OFF and the feature is dormant.

**Ask**: 02 or 03, claim ownership in your design doc and document your promotion gate.

---

### H6 — Anti-fabrication strategy: ground truth (02) vs research (03) vs prompt discipline (01)

**Raised**: 2026-04-23
**By**: 01 Cost
**To**: 02 Conversator, 03 RAG
**Status**: open

**Content**: Three workstreams converge on anti-fabrication from different angles:
- 01 Phase C1 adds QUANTITY DISCIPLINE to Phase B prompt — cheap, limited.
- 02 architects ExperienceProfile as ground truth — structural, high-effort.
- 03 may propose corpus-anchored rewrites — "only elaborate with moves the corpus validates" — alternative structural solution.

If both 02 and 03 claim the fabrication fix, they need to coordinate. They're not mutually exclusive — ground truth answers "what happened" and corpus answers "how others crafted similar moments" — but they overlap in rewrite-path injection.

**Ask**: 02's design should treat itself as PRIMARY anti-fabrication mechanism. 03's design should position research as COMPLEMENTARY (providing craft exemplars, not fact substitutes). Confirm alignment in your design docs.

---

### H7 — L3.75 layer retirement: 02 / 03 injection-point coordination

**Raised**: 2026-04-24
**By**: 01 Cost (Architecture track)
**To**: 02 Conversator, 03 RAG
**Status**: **ack required** (Tue approved pivot direction 2026-04-25 — both chats must now confirm compatibility, not weigh in on the direction itself)

**2026-04-25 update**: Tue approved the pivot direction. The pivot is now `planned`, not `draft`. Both 02 and 03 MUST design around lens-direct injection. The "if any 02 or 03 design depends on L3.75 specifically, surface here NOW" ask is upgraded from informational to blocking — designs that assume L3.75 surfaces will need rework when the pivot lands.

**Additional change**: `characterRevelation.blindSpots[]` is now explicitly cut (Decision A). If either chat's design references blindSpots, migrate to `admissionsPositioning.redFlags[]`.

**Content**: Cost Recovery's Architecture track proposes deleting L3.75 entirely. Authoritative plan: [`01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md`](../01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md). Yesterday's redesign (`L3_75_REDESIGN.md`) is now SUPERSEDED.

Under the pivot:
- Lens deep reads emit canonical holistic-profile fields DIRECTLY (no synthesis transformation).
- One small Pass 3 call inside L3 produces 4 cross-dimension fields only.
- L3.75 calls (Meta, Curation, iter_1, Reread, UnderstandingProse) all DELETED.
- `holisticSynthesis.ts` removed from codebase.

**Why this affects 02 and 03**:
Both chats had assumed L3.75 as a stable injection point. Under the pivot:
- ExperienceProfile (02) injection moves from L3.75 user prompt to lens user prompts. CLEANER, but requires 02 design to confirm injection works at the lens level (4 lens prompts have 4 separate ground-truth surfaces, vs 1 today).
- Research blocks (03) inject into lens user prompts directly. CLEANER, with bigger per-lens budget than today's L3.75 corpus block (which is shared across 10 sections in one call).

**Asks**:

1. **Workstream 02 Conversator**: confirm in your design doc that ExperienceProfile injection at the LENS level (per-dimension: voice ground truth → Voice lens, value/meaning ground truth → Meaning lens, narrative facts → Story lens, admissions context → Admissions lens) is compatible with your design — or flag a blocker.
2. **Workstream 03 RAG**: confirm in your design doc that per-layer research retrieval can target individual LENS prompts instead of L3.75 (i.e., voice-research → Voice lens, archetype-research → Admissions lens). Cleaner ownership; should be a design simplification.
3. **Both**: if any part of your design depends on L3.75 specifically (Meta convergence signal, iter_1 ripple handling, UnderstandingProse output, etc.), surface here NOW so the pivot can be revised before it becomes binding.

**Resolution condition**: 02 and 03 ack in their PLAN.md that their design works under the pivot OR raise specific incompatibilities here.

**Notes**:
- Pivot does NOT block the consolidated changeset ([`PLAN.md`](../01-cost-recovery/PLAN.md)) — the changeset operates on current architecture and ships first.
- Pivot lands AFTER L3 redesign + 02/03 designs return + Tue approves.
- See [CONTRACTS.md § L3.75 layer existence](./CONTRACTS.md) for the v1→v2 contract change.

---

## Resolved handoffs

*(empty — none yet)*

---

## How to use this file

**To raise a handoff**:
1. Append under `## Open handoffs` with the next `H{n}` id.
2. Fill date, from/to, status, content, ask.
3. Notify the receiving chat in your own PLAN.md.

**To resolve a handoff**:
1. Move the entry from `Open` to `Resolved`.
2. Add a "Resolution" line with date, resolver, outcome.
3. Keep the full history — don't delete the content.

**To respond to a handoff without resolving**:
1. Append a dated response block under the handoff.
2. Keep status `open` until both chats agree it's resolved.
