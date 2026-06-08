# Integration Map — How the Three Workstreams + Architecture Track Compose

> The single picture of how the changeset, the L3.75 retirement, the Conversator integration, and the Intelligent RAG fit together. Read this before any of the four pieces is finalized in isolation.

**Last updated**: 2026-04-26

---

## The four moving pieces

1. **Changeset** (`01-cost-recovery/PLAN.md`) — Phases A–E. Single PR. Fixes regressions in current architecture.
2. **Architecture track** (`01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md`) — kills L3.75, absorbs into L3 lenses + Pass 3.
3. **02 Conversator** (`02-conversator-ground-truth/PLAN.md`) — ExperienceProfile ground-truth injection.
4. **03 Intelligent RAG** (`03-intelligent-rag/PLAN.md`) — layered research retrieval per layer.

---

## Why integration before isolated execution matters

**The fixture verification run tests the entire pipeline.** Running it before the four pieces are reconciled means:

- The verification validates a pipeline shape that's about to be re-architected (L3.75 retirement is `planned`).
- Phases A–E touch files that 02 and 03 will inject into. If their canonical block ordering is wrong, the changeset's cache fixes (D1/D2) silently regress when 02 and 03 land.
- The Architecture track's lens-direct emission may **obviate** Phase B (iter_1 prompt) and Phase C (Phase B output cuts) — those phases are anchored to a `holisticSynthesis.ts` that the architecture track plans to delete.
- A localized $2 verification that proves only "the changeset works" is worth far less than a single $2 verification that proves "the integrated pipeline shape stays coherent through the next architectural moves."

**Tue's framing (2026-04-26)**: integration first, then 1-fixture verification.

---

## How the four pieces compose

### Time axis

```
NOW                                                                FUTURE
 │                                                                    │
 ├── Changeset (Phases A–E) ──────────► land + verify (1 fixture)     │
 │                                                                    │
 │   wait on: 02 design returns, 03 design returns,                   │
 │            integration gate (D5) satisfied                         │
 │                                                                    │
 ├── 02 design returns ─► PLAN.md updated ─► 02 implementation        │
 │                                                                    │
 ├── 03 design returns ─► PLAN.md updated ─► 03 implementation        │
 │                                                                    │
 │                                                                    │
 ├── Architecture track preconditions:                                │
 │     - changeset verified                                           │
 │     - L3 lens redesign lands                                       │
 │     - 02/03 design docs returned and confirm lens-injection compat │
 │     - Tue approves                                                 │
 │                                                                    │
 ├──────────────────────────► L3.75 retirement ─► L3 absorbs ─────────►
 │                                                                    │
 │                                                                    │
 ├── 02/03 implementation lands AGAINST:                              │
 │     - if pre-pivot: Phase D1/D2 v3 cached block ordering           │
 │     - if post-pivot: lens-prompt injection surfaces                │
 │                                                                    │
 ▼                                                                    ▼
```

### File overlap matrix

| File | Changeset | Architecture | 02 Conversator | 03 RAG |
|---|---|---|---|---|
| `holisticSynthesis.ts` | B1, B2, B3, C1, A3 (writes) | **DELETES** entirely | reads convergence state | reads convergence state |
| `analysisOrchestrator.ts` | A2, E3 | re-routes (no L3.75 step) | adds conversator-fetch step (TBD) | adds research-stage step (TBD) |
| `sequentialDeepWalk.ts` | D1, E2 | major rewrite (lenses + Pass 3) | adds ExperienceProfile cached block | adds research cached block |
| `deepAnnotationService.ts` | D2 | reads new lens fields | adds rewrite-grounding block | adds anti-archetype/move block |
| `profileTypes.ts` | C3 schema deletions (low-consumer) | major schema reshape (lens-direct fields) | adds `experienceProfileRef` | adds research linkage fields |
| `claude.ts` | A1 ledger | reads ledger | reads ledger | reads ledger |
| `editUnderstandingService.ts` | E1 (delete analysisMode) | unaffected | unaffected | unaffected |
| `runningUnderstandingManager.ts` | E2 | major rewrite (lens-state) | unaffected | unaffected |
| `corpus/*` | unaffected | unaffected | reads voice corpus for grounding | primary owner |
| `profileRouter.ts` | (Tier 5.2 backlog) | re-anchored to lens budgets | reads | extends or replaces |

### Key load-bearing claims (must hold across all four pieces)

1. **The changeset is a bridge, not a parallel solution.** Every phase (A–E) is justified IF the architecture track is the long-term answer AND the changeset's improvements survive the architectural pivot.
2. **02 and 03 will both inject into prompts the changeset is restructuring.** Ordering encoded in [CONTRACTS.md § L3 walk user prompt structure v3](../shared/CONTRACTS.md) and [§ L5 user prompt structure v3](../shared/CONTRACTS.md) must match what 02 and 03's designs actually need.
3. **The single verification fixture run tests all of (current changeset) + (the seams 02 + 03 will inject through) + (the future-pivot-compatibility of those seams).** Running it before integration means re-running it after integration anyway.

---

## Audit: does each Phase A–E item survive the integrated picture?

### Phase A — Observability

| Item | Survives architecture pivot? | Survives 02? | Survives 03? | Verdict |
|---|---|---|---|---|
| A1 Cost ledger split | YES (ledger is layer-agnostic) | YES (02 reads ledger) | YES (03 reads ledger) | **KEEP** |
| A2 Convergence telemetry | NO — L3.75 deleted, no iter loop | YES if pre-pivot, dead post-pivot | YES if pre-pivot | **KEEP for bridge** (telemetry will inform whether iter_1 fix actually landed before pivot) |
| A3 Phase B truncation flag | NO — Phase B parser deleted | YES if pre-pivot | YES if pre-pivot | **KEEP for bridge** (proves D3 buffer raise worked; deleted alongside `holisticSynthesis.ts` at pivot) |

**Verdict on A**: all three keep, with explicit understanding that A2 and A3 are bridge-only — they will be deleted at pivot time. A1 is permanent.

### Phase B — iter_1 convergence regression

| Item | Survives architecture pivot? | Verdict |
|---|---|---|
| B1 Convergence prompt rewrite | NO — convergence loop deleted at pivot | **KEEP for bridge** (saves $0.25/essay until pivot lands; pivot may take weeks) |
| B2 Reread curation | NO — same | **KEEP for bridge** |
| B3 Schema rename `remainingOpportunities` → `reversingContradictions` | NO — schema deleted at pivot | **REVISE** (the rename is throw-away work; instead, leave the field as-is and let pivot delete it. Saves migration churn for downstream consumers who'd have to migrate twice.) |

**Verdict on B**: keep B1+B2 as bridge. **Re-evaluate B3** — the schema rename is a 4-day investment that gets deleted in 2 weeks. Defer or skip.

### Phase C — Phase B output cuts

| Item | Survives architecture pivot? | Verdict |
|---|---|---|
| C1 QUANTITY DISCIPLINE prompt | NO — prompt deleted | **KEEP for bridge** (correctness fix; mandatory until pivot) |
| C2 Post-parse enforcement | NO — parser deleted | **KEEP for bridge** |
| C3 Low-consumer field deletions (sentencePatterns numeric, threads.appearances, strategyRationale merge) | PARTIAL — fields gone in pivot anyway, but deletion in changeset reduces output tokens NOW | **KEEP** (correctness benefit immediate, deletion work is throw-away but small) |
| C4 MAX_TOKENS raise to 12000 | NO — cap deleted with file | **KEEP for bridge** (D3 resolved; trivial 1-line change) |

**Verdict on C**: all keep as bridge-only. Mandatory for correctness today.

### Phase D — Cache fixes

| Item | Survives architecture pivot? | Verdict |
|---|---|---|
| D1 L3 walk essay-text cached block | YES — L3 walk file persists, gets RESHAPED but cached prefix is even more important under lens architecture | **KEEP — load-bearing into pivot** |
| D2 L5 sharedContext cache marker | YES — L5 unchanged by architecture pivot | **KEEP — load-bearing into pivot** |

**Verdict on D**: both KEEP. These are not bridge — they survive the pivot and improve under it.

### Phase E — Dead code cleanup

| Item | Survives architecture pivot? | Verdict |
|---|---|---|
| E1 Delete analysisMode | YES (independent of L3.75) | **KEEP** |
| E2 Delete emotionalArc | YES (independent) | **KEEP** |
| E3 Checkpoint telemetry | YES (independent) | **KEEP** |

**Verdict on E**: all KEEP.

---

## Audit summary

**Drop or defer from changeset**:
- **B3 schema rename** — throw-away work that gets deleted by pivot. Defer or skip; document the field renaming in the pivot's schema design instead.

**Re-confirm as bridge** (will be deleted at pivot, but valuable in interim):
- A2, A3, B1, B2, C1, C2, C3, C4

**Keep as permanent improvements** (survive pivot):
- A1 (cost ledger), D1 (L3 essay-text cache), D2 (L5 cache), E1, E2, E3

**Cost-savings expectation revised**:
- Bridge work alone: ~$0.40 (iter_1 fix + Phase B truncation + cache bleeds)
- Permanent work: ~$0.15 (cache bleeds + dead code; carries past pivot)
- Pivot delivers: additional ~$0.62–0.85
- **Combined target ≤$2.00/essay still holds.**

---

## What integrating with 02 and 03 means in practice

When 02 and 03 designs return, three checks before the changeset executes:

1. **Block ordering check** — does [CONTRACTS.md § L3 walk user prompt structure v3](../shared/CONTRACTS.md) match what 02 and 03 actually want? If not, update the contract BEFORE running the verification fixture (else cache invalidation post-integration is a regression).
2. **L5 cache breakpoint check** — does [HANDOFFS.md § H3](../shared/HANDOFFS.md) reservation (1 each for 02 and 03) actually match their needs? If 03 needs 2 breakpoints at L5, the breakpoint budget needs renegotiation.
3. **Anti-fabrication primacy check** — does [HANDOFFS.md § H6](../shared/HANDOFFS.md) hold? Specifically: does Phase C1's `QUANTITY DISCIPLINE` prompt step on 02's anti-fabrication discipline, or are they orthogonal? If they overlap, 02 owns; we trim C1.

---

## Failure modes this map prevents

- **Localized verification**: changeset proves itself, fails when 02/03 land, requires another paid run.
- **Throw-away schema work**: B3 rename creates downstream consumer migration that gets deleted at pivot.
- **Block-ordering drift**: cached blocks land in different order across callers, cache silently misses.
- **Bridge work treated as permanent**: someone forgets that B1/B2/C1 etc. are scaffolding and pours engineering into refining them after pivot makes them irrelevant.

---

## Update procedure

When 02 design returns:
1. Update `02-conversator-ground-truth/PLAN.md` with the actual plan.
2. Walk this Integration Map's audit tables — does any Phase A–E item invalidate? Note in the table.
3. Walk H1–H7 — resolve or carry.
4. Update [PLAN.md § Pre-execution integration gate](../01-cost-recovery/PLAN.md) check-list.

When 03 design returns:
1. Same procedure, with the RAG plan.

When both return AND audits clear:
1. Tue final approval recorded in DECISIONS.md as D6.
2. Schedule the single-fixture verification run.
