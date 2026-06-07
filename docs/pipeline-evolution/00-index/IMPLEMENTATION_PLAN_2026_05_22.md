# Implementation Plan — Cost + Quality Audit Follow-On

> **Date**: 2026-05-22. **Companion to**: [`COST_QUALITY_AUDIT_2026_05_22.md`](./COST_QUALITY_AUDIT_2026_05_22.md).
> **Branch**: `fix/warm-edit-completedalllayers`.
> **Discipline**: every item has a Claim → Verification → Change → Gate → Approval. Do nothing whose claim cannot be evidenced at HEAD.

---

## Stage map

| Stage | What | Spend | Approval | Reversible? |
|---|---|---:|---|---|
| **0** | Zero-spend hygiene — delete confirmed-dead code | $0 | None (each commit is atomic) | Yes — single revert per commit |
| **1** | Cheap-quality DESIGNS (no code) — Exec Brief, coherence-resolution, calibration few-shot | $0 | Tue reviews each design before implementation | N/A |
| **2** | Cheap-quality IMPLEMENTATION (after Stage 1 approval) | near-$0 | Per-design Tue approval | Yes — feature-flag gated where possible |
| **3** | Verification regen — Crochet with `L4_UNIFIED_CACHE=true` | ~$1.20–1.70 | **Explicit Tue approval required** (cost-budget memory) | N/A |
| **4** | Out of scope this session: Phase 7 L3.75 retirement | — | Separate project | — |

Each stage gates the next. No skip-ahead.

---

## Stage 0 — Zero-spend hygiene

Two atomic commits. Each: independent verification → change → tsc clean → vitest clean → commit. If any step fails, stop and surface.

### 0.A — `runningUnderstandingManager` chain

**Claim**: the `RunningUnderstandingManager` class, the `RunningUnderstanding` interface, and the two parent-type fields that carry it (`ParagraphUnderstanding.runningUnderstandingSnapshot`, `EssayUnderstanding.finalUnderstanding`) have zero live consumers.

**Evidence at HEAD (2026-05-22)**:
- `grep -rn "runningUnderstandingSnapshot\|finalUnderstanding\|runningUnderstandingManager\." src/ --include="*.ts"` → 0 hits outside `types.ts` and `runningUnderstandingManager.ts` itself.
- `grep -rn "RunningUnderstandingManager\|createEmpty()\|new RunningUnderstandingManager" src/ --include="*.ts"` → 0 hits outside the manager file.
- Manager file: 474 lines, has no external importer.
- Parent type `EssayUnderstanding` (types.ts:517) — *not yet verified to be live*. The field carries `null` per type; if nobody reads or writes the parent either, the entire chain is deletable.

**Verification step before change**:
1. `grep -rn "EssayUnderstanding\b" src/ --include="*.ts" | grep -v ".d.ts"` — does the parent type have live consumers?
2. `grep -rn "ParagraphUnderstanding\b" src/ --include="*.ts" | grep -v ".d.ts"` — same for the other parent.
3. If parent types have live consumers but only the two fields are unused → delete just the fields + the manager + the interface.
4. If parent types have ZERO live consumers → delete the whole chain.

**Change** (assuming case 3 — fields-only):
- Delete `src/services/essayIntelligence/analysis/runningUnderstandingManager.ts`.
- Delete `interface RunningUnderstanding` declaration in `types.ts` (line ~166).
- Delete the field `runningUnderstandingSnapshot: RunningUnderstanding | null` on `ParagraphUnderstanding` (types.ts ~500–501).
- Delete the field `finalUnderstanding: RunningUnderstanding | null` on `EssayUnderstanding` (types.ts ~543–544).
- Delete the comment block at types.ts:8 referencing it.
- Delete the type guard helper at types.ts:620 (`Whether a RunningUnderstanding change is "meaningful"`).
- Remove any barrel re-exports.

**Gate**:
- `npx tsc --noEmit` → exit 0.
- `npx vitest run` → ≥ 749 passed (no regression vs CURRENT_STATE baseline).
- No new warnings.

**Approval**: none required if the verification step shows zero live consumers. If a consumer surfaces, STOP and discuss.

**Rollback**: single `git revert`.

**Commit message** (proposed):
```
phase 0a — delete runningUnderstandingManager chain — verified zero importers

- Removes 474-line manager + RunningUnderstanding interface + 2 dead fields
  on ParagraphUnderstanding / EssayUnderstanding.
- Verified zero external readers of runningUnderstandingSnapshot,
  finalUnderstanding, or any RunningUnderstandingManager method via static
  grep + dynamic import search (excluding types.ts and the manager file
  itself).
- Quality-first protocol Category 1: verified-dead-code. No downstream
  consumer trace required.
- Phase 7's L3.75 retirement notes already plan the parallel emotionalArc
  field deletion; this delete reaches it earlier.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

### 0.B — `EditUnderstandingOutput.analysisMode` field

**Claim**: the field is written but no consumer reads it; its own JSDoc admits this.

**Evidence at HEAD**:
- `editUnderstandingService.ts:913–919` (JSDoc): "NO downstream consumer reads that field. The reanalysisOrchestrator uses `FocusedAnalyzer.selectAnalysisMode()` instead… the field is informational only (logged but not acted upon)."
- TODO(M1) markers at write sites (`editUnderstandingService.ts:1196, 1450`).
- `grep -rn "\.analysisMode" src/ --include="*.ts" | grep -v "test" | grep -v "analysisPass"` → only TODO comments + write sites in `editUnderstandingService.ts`. (Note: `analysisPass.ts` has a *different, live* `analysisMode: 'essay_level' | 'paragraph_level'` field — disambiguated by file.)
- Type at `profileTypes.ts:4988`.

**Verification step before change**:
1. Re-run the grep above at HEAD.
2. Confirm no telemetry/logging code outside `editUnderstandingService.ts` reads `.analysisMode` from an `EditUnderstandingOutput` shape.
3. Confirm no other file constructs an `EditUnderstandingOutput` literal that would break if the field is removed.

**Change**:
- Delete field from `EditUnderstandingOutput` interface (`profileTypes.ts:4988`).
- Delete the two `analysisMode: ...` literals at `editUnderstandingService.ts:1197, 1451`.
- Delete the local `const analysisMode = selectAnalysisMode(...)` at `editUnderstandingService.ts:1435` (no longer referenced).
- Delete the TODO(M1) comments at `:913–919, :1196, :1450`.
- If `selectAnalysisMode` itself has no other caller after this delete, delete the helper too.

**Gate**:
- `npx tsc --noEmit` → exit 0.
- `npx vitest run` → no regression.
- Spot-check telemetry: search for `analysisMode` in console log statements; confirm no log line silently references it post-delete.

**Approval**: none required.

**Rollback**: single revert.

---

## Stage 1 — Cheap-quality designs (no code, no spend)

Three short design specs. Each gets its own design doc under `docs/pipeline-evolution/04-pipeline-architecture/`. Tue reviews before Stage 2 begins.

### 1.A — Executive Brief layer

**Goal**: <300-word brief above the diagnostic stack: 5 directives + 3 model sentences + 1 calibrated verdict.

**Open design question (must resolve before implementation)**: separate new call vs folding into an existing call.

| Option | Approach | Cost | Trade-off |
|---|---|---:|---|
| (a) New micro-call | Small Sonnet call post-L4, sees compressed profile | +$0.05–0.10 | Cleanest separation; can be Haiku candidate if quality holds |
| (b) Fold into L4b | L4b emits brief as an additional section | $0 | Tighter coupling; L4b prompt grows |
| (c) Render-side | Pure deterministic composition over L4 + L5 output | $0 | Zero LLM judgment in the brief — may be too template-y |

**Recommendation**: (a) starting with Sonnet — quality first; revisit Haiku at calibration time. Keeps the brief out of L4's already-large prompts and lets it be revised independently.

**Design doc to produce**: `docs/pipeline-evolution/04-pipeline-architecture/L5/EXECUTIVE_BRIEF_DESIGN.md`. Must cover: input shape (compressed L4+L5 surface), output schema, prompt skeleton, calibration test, cost estimate, where it renders in the dump path.

**Approval gate**: Tue picks (a)/(b)/(c) before any code.

---

### 1.B — Coherence-resolution pass

**Goal**: collapse or frame the ~11 self-flagged contradictions (`coherenceReport.contradictions`, L3.5 `contradictionFlags`) before the student surface so the student never sees raw self-contradiction.

**Approach options**:
| Option | Where | Cost |
|---|---|---:|
| (a) Prompt extension on L4 crystallizer | L4 prompt sees contradictions and resolves them in NorthStar / ScoreMatrix reasoning | $0 (prompt growth) |
| (b) Dedicated post-L4 resolver call | Tiny Sonnet pass over contradiction list | +$0.02–0.05 |

**Recommendation**: (a). The crystallizer already sees the coherence report (`contradictionConsumer.ts:44-86`); the gap is that resolution isn't *enforced* in its prompt — it's incidental. A prompt block "for each contradiction, either resolve it with reasoning or escalate it to the student with framing" is structural, not new judgment.

**Design doc**: `docs/pipeline-evolution/04-pipeline-architecture/L4/COHERENCE_RESOLUTION_DESIGN.md`. Cover: prompt block text, contradiction handling rules (resolve/frame/escalate), what changes in L4 output schema (does L4 emit a `coherenceResolution` field?), L5 read-site changes.

**Approval gate**: Tue picks (a)/(b).

---

### 1.C — Calibration few-shot in scoring prompts

**Goal**: inject anchored exemplars ("band 70 looks like X, band 80 looks like Y") into scoring prompts so the LLM has concrete calibration anchors. ~70% of scoring prompts have zero few-shot today; this is the #1 cause of mid-band miscalibration per `WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS`. 53 anchored `MOVE_EXCERPTS` already exist.

**Open design questions**:
1. **Which prompts get few-shots?** Candidates: L3.5 `analysisPass` sentence effectiveness, L4 ScoreMatrix paragraph scoring, L5 annotation tier reasoning.
2. **Static block or retrieved?** Static = same exemplars every call (cheaper, simpler, less relevant). Retrieved = `corpusRetrievalBlocks` looks up exemplars by archetype/theme (more relevant, depends on Phase 8 corpus master flag).
3. **Cost impact**: each prompt grows by ~500–1500 cached tokens. Per-call cost +$0.001–0.003 cached + +$0.01–0.04 first-call cache-write. Acceptable.

**Recommendation**: static block first (simpler, no flag dependency); retrieved variant arrives free when Phase 8 corpus master is activated. Pick the 4–8 highest-signal exemplars per scoring scale.

**Design doc**: `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/CALIBRATION_FEWSHOT_DESIGN.md`. Cover: which prompts receive it, exemplar selection, prompt block text, expected calibration shift (test: same essay, with/without — Sonnet's scores should converge band-internally).

**Approval gate**: Tue picks which scoring prompts get the treatment first.

---

## Stage 2 — Cheap-quality implementation

Conditional on Stage 1 sign-off per design.

Each implementation:
- Single atomic commit per design item.
- Behind a feature flag where it changes student-visible output (Brief, coherence-resolution surfacing).
- Calibration few-shot ships unflagged — additive cache-friendly prompt block.
- TSC clean + vitest clean per commit.
- A/B verification deferred to Stage 3 regen.

No spend in this stage — implementations land flag-off, ready for verification.

---

## Stage 3 — Verification regen (REQUIRES TUE APPROVAL)

**Spend**: estimated ~$1.20–1.70 on the Crochet fixture (491 words, 5 paragraphs). Per the $5-cap budget rule, **explicit Tue approval needed before running**.

**What the run does — bundled**:

1. Confirm Phase 1 cost cuts banked. Ledger should show:
   - Total cold-start ≤ $1.42 (per ladder).
   - No `reread_P3` row (Cut A removed it).
   - L2.5 emissions ≤ 15 (Cut E).
   - L3.5 `growthEdges` ≤ 3 per paragraph (Cut G).
   - L1 output token count below pre-Cut-D baseline.

2. Confirm Phase 3 L4 cache fires. With `L4_UNIFIED_CACHE=true`:
   - L4 calls 2 and 3 show `cache_read_input_tokens > 0`.
   - L4 cumulative input tokens reduced by ~60–70% from prior baseline.
   - Total cold-start ≤ $1.20 (per ladder, post-Phase-3 target).

3. Quality baseline:
   - 20–30 L5 annotations (density lock).
   - ≥3 of 4 teaching modes per essay (diversity floor).
   - Avg per-annotation token ≥250 (depth proxy).
   - Manual scan: writerPortrait richness vs prior dump; tellabilitySummary coherence; no truncation flag on Phase B.

4. Cheap-quality items (if Stage 2 implementations have landed flag-on):
   - Exec Brief present, ≤300 words, contains 5 directives + ≥1 model sentence + verdict.
   - Coherence resolution: zero raw `coherenceReport.contradictions` reach the student-facing render.
   - Calibration few-shot: spot-check 5 sentence scores against the calibration exemplars for band coherence.

**Run command** (proposed, awaiting approval):
```
L4_UNIFIED_CACHE=true ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  npx tsx tests/dump-full-profile.ts --fixture 14-harvard-2028-crochet
```

**Fail modes**:
- Cost > $1.50: diagnose which layer regressed; isolate before re-run.
- `cache_read` zero on L4: Phase 3 not firing — investigate, do not pay for a second run blindly.
- Phase B `_truncated: true`: array-cap variance hit; revisit caps.
- Quality drop on subjective surfaces: discuss revert vs refinement.

**Output artifacts to capture**:
- Updated `BUILD_COST_LEDGER.md` (append-only).
- `tests/output/full-profile-14-harvard-2028-crochet.md` regenerated.
- Side-by-side cost-delta table vs the May 5 baseline.

---

## Stage 4 — Out of scope (separate project)

**Phase 7 — L3.75 retirement.** 3,573-line file. ~6 consumer migrations. Architectural change. Has its own design (`L3_ABSORBS_L3_75.md`, `FIELD_DISPOSITION_TABLE.md`). Single biggest cost win ($0.35) and the move that gets us to $0.85 cold-start. Distinct multi-week project. **Not started in this session.**

When it lands, the deletions in Stage 0 will already be done (good — fewer references to migrate).

---

## Discipline & invariants

- **Never silently relax cost target.** $0.85 cold-start stays the bar.
- **Never trim downstream-consumed surface without measurement.** Every "quality bet" needs a consumer trace OR a Phase 6 measurement criterion.
- **Never delete code based on a sub-agent's report alone.** Verify at HEAD with own grep before action. (This audit corrected `deepDiveRunner` and `findingMaturityRefresh` from "delete" to "keep" via exactly this check.)
- **Never collapse the three-API-layer split** (L3 / L3.5 / L5) — load-bearing quality design.
- **No Sonnet → Haiku swaps without Tue approval.**
- **Net cost delta per code change: zero or negative, no tangent dumps.**

---

## Open questions for Tue

1. **Audit doc location confirmed?** `00-index/` (with CURRENT_STATE) vs `analysis/` (with COST_DEADWEIGHT_AUDIT, etc.)?
2. **Stage 0 deletions** — proceed atomically as planned, or hold until Phase 7 retirement to bundle?
3. **Executive Brief option (1.A)** — (a) new call, (b) fold into L4, or (c) deterministic render-side?
4. **Coherence-resolution option (1.B)** — (a) L4 prompt extension or (b) dedicated resolver call?
5. **Calibration few-shot scope (1.C)** — which scoring prompts first?
6. **Stage 3 verification regen** — approve ~$1.20–1.70 spend?

---

## Cross-references

- Audit: [`COST_QUALITY_AUDIT_2026_05_22.md`](./COST_QUALITY_AUDIT_2026_05_22.md)
- State of truth: [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- Unified plan: [`UNIFIED_PLAN_HOLD_2026_05_10.md`](./UNIFIED_PLAN_HOLD_2026_05_10.md)
- Cost docs: `docs/analysis/{COST_DEADWEIGHT_AUDIT.md, OUTPUT_CUT_LIST.md, COST_CUT_IMPLEMENTATION_PROMPT.md}`
- Phase 3 design: `docs/pipeline-evolution/04-pipeline-architecture/L4/L4_CACHE_UNIFICATION_DESIGN.md`
- L3.75 retirement plan: `docs/pipeline-evolution/04-pipeline-architecture/L3-75/{FIELD_DISPOSITION_TABLE.md, ITERATION_SYNTHESIS_2026_05.md}`
- Cost budget rule: memory `feedback_cost_budget.md`
- Integration-debt pattern: memory `pitfalls_integration_debt.md`
- LLM-first design: memory `feedback_llm-first-design.md`
