# Shared Contracts

> Interfaces, schemas, and prompts that MORE THAN ONE workstream depends on. Binding across all chats.
> **Rule**: if you change a contract, update this file in the SAME commit. No silent contract drift.

**Last updated**: 2026-04-24

## How to read this file

Each contract entry has:
- **Name**: stable identifier.
- **Owner**: chat with design authority over the contract's shape.
- **Version**: incremented when the contract changes.
- **Dependents**: which workstreams rely on this contract.
- **Shape**: the binding interface (TypeScript type, prompt block structure, or behavior spec).
- **Changelog**: dated list of changes with migration notes.

---

## Contract: `SYSTEM_PROMPT_PHASE_B` block structure

**Owner**: 01 Cost (through Phase C landing); shared afterward.
**Version**: v1 (current) — not yet modified.
**Dependents**: 02 (may extend with ground-truth section), 03 (may extend with research-retrieval section).

**Current shape**: Monolithic system prompt in `holisticSynthesis.ts`. Cost chat's Phase C1 will add a `QUANTITY DISCIPLINE` subsection. Structure remains single-block.

**Anti-patterns**:
- Do NOT add new fields to the Phase B output schema without coordinating here. Schema bloat is the reason we're cutting.
- Do NOT add research-retrieval text inline into the system prompt without going through a cached block (violates RAG architecture).

**Pending changes**:
- [01 Phase C1] Add `QUANTITY DISCIPLINE` subsection with array caps (signatures ≤ 8, edges ≤ 6, threads ≤ 5).
- [02, 03] Any future additions require handoff note + this contract's version bump.

---

## Contract: `ProfileIndex` (Phase B output schema)

**Owner**: shared (01 Cost has Phase C deletions, 02 may add `experienceProfileRef`, 03 may add research linkage fields).
**Version**: v2 pending Phase C cuts (v1 is current in code).
**Dependents**: all three chats.
**File**: `src/services/essayIntelligence/profileTypes.ts`.

**Current binding interface** (excerpt, not exhaustive — read profileTypes.ts for full):
```typescript
interface ProfileIndex {
  thematicArchitecture: {
    centralThesis: string;
    thesisConfidence: number;      // [01 Phase C — keep in v2]
    threads: Thread[];             // [01 Phase C — cap 5, drop appearances[]]
    // ...
  };
  narrativeStrategy: {
    primaryStrategy: string;       // [01 Phase C — merge strategyRationale into this]
    strategyRationale: string;     // [01 Phase C — DELETE in v2]
    arcMomentum: string;           // [01 Phase C — KEEP in v2 for now; dedup deferred]
    // ...
  };
  characterRevelation: {
    writerPortrait: string;        // [01 Phase C — merge intellectualFingerprint in]
    revealedQualities: string[];   // [01 Phase C — KEEP in v2 for now; merge deferred]
    intellectualFingerprint: string; // [01 Phase C — KEEP in v2 for now; merge deferred]
    valuesRevealed: string[];
    // ...
  };
  craftAssessment: {
    rhythm: string;                // keep — prose signal
    sentencePatterns: {            // [01 Phase C — strip numeric distribution stats]
      // ...
    };
  };
  admissionsPositioning: {
    portfolioPosition: string;     // [01 Phase C — KEEP in v2 for now]
    archetypeContext: {
      poolDensity: number;         // [01 Phase C — DECISION PENDING FROM TUE]
      // ...
    };
  };
  strengthSignatures: Signature[]; // [01 Phase C — cap 8]
  growthEdges: Edge[];             // [01 Phase C — cap 6, all must have pairedImprovement]
  // ...
}
```

**v2 migration plan** (after Phase C lands):
- Deletions: `strategyRationale` (merged), `threads[].appearances[]` sentence granularity (paragraph only), `craftAssessment.sentencePatterns.*distribution` numeric stats.
- Caps enforced post-parse.
- Open: `poolDensity` pending Tue's decision.

**If 02 or 03 need to extend `ProfileIndex`**:
- MUST add the field, document here, cite the use case.
- MUST NOT name-collide with existing or deleted fields.
- MUST coordinate cache implications — if the field rides in a cached block, the block's stability depends on the field's presence being deterministic.

---

## Contract: `selfAssessedConvergence` output schema

**Owner**: 01 Cost (through Phase B landing).
**Version**: v1 (current) → v2 pending rename.
**Dependents**: 02 (may read convergence state to decide whether to re-fetch conversator context), 03 (may read to gate research caching).

**v1 (current)**:
```typescript
{
  hasConverged: boolean;
  reasoning: string;
  remainingOpportunities: string[];  // renames to `reversingContradictions` in v2
}
```

**v2 (after Phase B lands)**:
```typescript
{
  hasConverged: boolean;
  reasoning: string;
  reversingContradictions: string[]; // empty/absent → converge
}
```

**Consumer callout**: any chat reading `remainingOpportunities` must migrate to `reversingContradictions` after Phase B.

---

## Contract: L3 walk user prompt structure

**Owner**: 01 Cost (through Phase D1 landing); shared afterward.
**Version**: v1 (current: mutating prefix) → v2 pending Phase D1 (stable essay-text cached block).
**Dependents**: 02 (may add ExperienceProfile block), 03 (may add research block).
**File**: `sequentialDeepWalk.ts:616–667`.

**v1 (current, mutating prefix)**:
Single concatenated user prompt with mutating holisticEvolution + paragraph-specific context. Cache hit rate ~23%.

**v2 (after Phase D1)**:
Messages array:
```
[
  { role: 'user', content: <essay_text + L1 + L2 + scout_header>, cache_control: ephemeral },
  { role: 'user', content: <accumulating_walk_findings_digest> },
  { role: 'user', content: <target_paragraph + scout_leads + questions + connection_driven_context> }
]
```

**v3 (after 02 and/or 03 integrate)**:
02 and 03 may add additional cached blocks. Ordering MUST be deterministic across all callers to preserve cache keys. Proposed canonical order:
```
[
  { essay_text + L1 + L2, cache_control: ephemeral },
  { ExperienceProfile (02), cache_control: ephemeral },       // if ground-truth injected
  { research_block (03), cache_control: ephemeral },          // if corpus retrieved
  { accumulating_walk_findings_digest },                      // uncached, appended per paragraph
  { target_paragraph + scout_leads + questions + context }    // uncached, fresh per call
]
```

**Rule**: cached blocks must come BEFORE uncached blocks. Order of cached blocks must be stable across callers. Any chat adding a cached block must update this contract's canonical order.

---

## Contract: L5 user prompt structure

**Owner**: 01 Cost (through Phase D2 landing); shared afterward.
**Version**: v1 (current: uncached sharedContext) → v2 (Phase D2 marks sharedContext cached).
**Dependents**: 02 (rewrite grounding), 03 (anti-archetype/corpus injection).
**File**: `deepAnnotationService.ts:1815–1835`.

**v2 (after Phase D2)**:
```
[
  { sharedContext (includes profile full context), cache_control: ephemeral },
  { paragraph-specific prompt (uncached) }
]
```

**v3 (02/03 integration)**:
```
[
  { sharedContext, cache_control: ephemeral },
  { ExperienceProfile rewrite constraints (02), cache_control: ephemeral },
  { research block for this paragraph (03), cache_control: ephemeral },
  { paragraph-specific prompt }
]
```

---

## Contract: `ENABLE_CORPUS_RETRIEVAL_L35` and per-layer override flags

**Owner**: 03 RAG.
**Version**: v1 (current: OFF by default, master flag gates all layers).
**Dependents**: 01 Cost (may not flip without RAG approval), 02 (may read to decide prompt composition).

**Current default**: OFF (unset).
**Flip authority**: 03 RAG decides when and in what order to flip after:
- Cost Phase C eliminates Phase B truncation (hard prerequisite).
- RAG architecture doc lands and prescribes flip sequence.

**Layer overrides** (from `corpusRetrievalBlocks.ts`): `ENABLE_CORPUS_RETRIEVAL_L3`, `_L375`, `_L4`, `_L5`, `_L6`.

**No chat may flip this flag in production or tests without RAG chat's explicit approval noted in `HANDOFFS.md`.**

---

## Contract: Cost ledger schema (Phase A output)

**Owner**: 01 Cost.
**Version**: v1 (new, not yet landed).
**Dependents**: 02 and 03 may read ledger output for their verification.

**v1 shape** (JSONL record, one per API call):
```json
{
  "timestamp": "2026-04-23T12:34:56.789Z",
  "fixture": "05-harvard-2028-i-too-can-dance",
  "layer": "L3.75",
  "subcall": "phaseB",
  "iter": 0,
  "fresh_input_tokens": 7842,
  "cache_read_tokens": 2148,
  "cache_create_tokens": 0,
  "output_tokens": 6800,
  "fresh_input_usd": 0.0235,
  "cache_read_usd": 0.000644,
  "cache_create_usd": 0.0,
  "output_usd": 0.102,
  "total_usd": 0.126,
  "cache_hit_rate": 0.215,
  "stopReason": "end_turn"
}
```

**Location**: `tests/output/run-ledger/{fixture}-{timestamp}.jsonl`.

**Rule**: 02 and 03 may read these files to verify their own work's cost/cache impact. Neither may modify the emitter without cost chat's acknowledgement.

---

---

## Contract: L3.75 layer existence (retirement notice)

**Owner**: 01 Cost (Architecture track).
**Version**: v1 (current: L3.75 exists as a distinct layer) → v2 pending architecture pivot (L3.75 deleted; work absorbed into L3 + L3.5).
**Dependents**: ALL workstreams (02 Conversator and 03 RAG had assumed L3.75 as a stable injection point).

**v1 (current)**:
L3.75 exists as a distinct layer between L3 walk and L3.5 analysis. Calls: Phase A + Phase B synthesis, Meta validation, Curation, optional iter_1, optional Reread, UnderstandingProse. Owns 10 holistic-profile sections (`HolisticSynthesisOutput`).

**v2 (pending Architecture-track pivot, see [`01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md`](../01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md))**:
- L3.75 layer **DELETED**. `holisticSynthesis.ts` removed from codebase.
- L3 lenses (Voice / Meaning / Story / Admissions) emit canonical holistic-profile fields DIRECTLY — no synthesis transformation between lens output and profile field.
- New **L3 Pass 3** call (single Sonnet, ~3-4K output, ~$0.08): produces 4 cross-dimension fields only — `writerPortrait`, `entanglements`, `emotionalTopography.arcTrajectory`, `momentEarnednessMap.mechanisms` (+ optional `connectionGraphSummary`).
- L3.5 absorbs cross-lens contradiction detection via new `contradictionFlags[]` output field.
- L3.5 absorbs essay-level `strengthSignatures[]` (migrated from `craftAssessment`).
- L4b absorbs `pairedImprovement` payload (migrated from `craftAssessment.growthEdges`).
- UnderstandingProse call deleted; EssayPortrait UI renders from structured fields.

**Hard preconditions for v2**:
1. Consolidated changeset (`PLAN.md`) lands and verifies on v1 architecture.
2. L3 redesign ships (Sweep + 4 lens schemas in code).
3. Workstream 02 + 03 design docs return and confirm injection-point compatibility with lens-direct injection (no longer injecting into L3.75 user prompt).
4. Tue approves the pivot.

**v2 migration impact on other contracts**:
- `SYSTEM_PROMPT_PHASE_B` block structure (this file) — **becomes obsolete**; Phase B prompt deleted with the layer. Replaced by lens-emission prompts and the Pass 3 prompt. Contract retired.
- `ProfileIndex` (this file) — schema cuts honored at lens-emission time instead of L3.75 parse time. The `OUTPUT_CUT_LIST` deletions still apply but are enforced upstream.
- `selfAssessedConvergence` (this file) — **becomes obsolete**; iter_1 / Meta deleted with the layer. Contract retired.
- `L3 walk user prompt structure` (this file) — restructured to lens user prompts. Cached blocks contract (essay text → ExperienceProfile → research → target paragraph) remains valid — same canonical order, just now scoped per-lens user prompt.
- `L5 user prompt structure` (this file) — unchanged.

**Anti-pattern flagged for 02 and 03**:
- Do NOT assume L3.75 prompts as a long-term injection target. Designs SHOULD inject into lens user prompts directly. If any 02 or 03 design relies on L3.75-specific surfaces, raise in [HANDOFFS.md H7](./HANDOFFS.md) immediately so the architecture pivot can be coordinated.

**Cross-references**:
- Authoritative plan: [`01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md`](../01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md).
- Superseded redesign: [`01-cost-recovery/ARCHITECTURE/L3_75_REDESIGN__SUPERSEDED.md`](../01-cost-recovery/ARCHITECTURE/L3_75_REDESIGN__SUPERSEDED.md).
- Handoff: [`HANDOFFS.md` H7](./HANDOFFS.md).

---

## Adding a new contract

If your workstream creates an interface another chat will depend on:

1. Name it uniquely.
2. Draft the shape here under a new `## Contract:` heading.
3. Declare owner and dependents.
4. Post a handoff note in `HANDOFFS.md` alerting other chats.
5. Merge the contract into this file in the same commit as the code change.

---

## Contract changelog

| Date | Contract | Change | By |
|---|---|---|---|
| 2026-04-23 | (all) | Initial contracts file created | 01 Cost |
| 2026-04-24 | L3.75 layer existence | NEW retirement-notice contract added; v2 deletes the layer (Architecture track) | 01 Cost (Architecture) |
| 2026-04-25 | L3.75 layer existence | Pivot direction APPROVED by Tue; status `draft` → `planned`. Decision A: `characterRevelation.blindSpots[]` CUT from v2 schema (redFlags is single home). | 01 Cost (Architecture) |
