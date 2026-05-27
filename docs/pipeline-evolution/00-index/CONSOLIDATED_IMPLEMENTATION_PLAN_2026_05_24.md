# Consolidated Implementation Plan — Cost + Quality Session

> **Date**: 2026-05-24. **Supersedes**: [`IMPLEMENTATION_PLAN_2026_05_22.md`](./IMPLEMENTATION_PLAN_2026_05_22.md) (kept as historical record of pre-review scope).
> **Audit source**: [`COST_QUALITY_AUDIT_2026_05_22.md`](./COST_QUALITY_AUDIT_2026_05_22.md).
> **Branch**: `fix/warm-edit-completedalllayers`.
>
> **Plan reflects 11 locked decisions** from the 2026-05-24 audit walkthrough (see §0 record). Every item below ties back to one of those decisions.

---

## §0 — Locked decision record (from walkthrough 2026-05-24)

| # | Decision | Source |
|---|---|---|
| D1 | Mop up every safe cut into the codebase before the regen | Batch 1 Q1 |
| D2 | Phase 7 = bridge prep this session (review + absorption design draft only, no code) | Batch 1 Q2 |
| D3 | Regen fires ONCE, after Stage 0 + 1 + 2 land | Batch 1 Q3 |
| D4 | All 8 ranked quality items in scope this session | Batch 2 Q1 |
| D5 | Executive Brief = (a) new Sonnet micro-call | Batch 2 Q2 |
| D6 | Coherence-resolution = (a) L4 prompt extension | Batch 2 Q3 |
| D7 | Calibration few-shot = all three layers (L3.5 + L4 + L5) | Batch 2 Q4 |
| D8 | Re-confirm all 8: stay with all 8 + single regen | Batch 3 Q1 |
| D9 | Output cut list: HOLD for Phase 7 PR (defer all field deletions + array caps) | Batch 3 Q2 |
| D10 | Phase 7 bridge depth = review + absorption design draft (no code) | Batch 3 Q3 |
| D11 | Stage 3 regen spend approval: **up to $1.70, one run** | Batch 3 Q4 |

---

## §0.5 — Stage 2 gate decisions (locked 2026-05-24, post-design walkthrough)

All 9 Stage-1 designs landed and their open Stage-2-gate questions answered. Stage 2 implementations proceed with these locked decisions; no further per-design blocking:

| Design | Open question | Locked decision |
|---|---|---|
| 1.A Executive Brief | Target tier source | Infer from `EssayProfile.admissionsPositioning.archetypeContext` as default; workshop layer override when explicitly provided |
| 1.B Coherence-resolution | `coherenceResolutions` field location | Both `ParagraphScoreMatrix` (paragraph-scope) AND `EssayNorthStar` (essay-scope) |
| 1.C Calibration few-shot | EssayType parametrize day-1 or single-set | Single-set first; fork by EssayType only if regen shows drift |
| 1.D Coaching mode | Default essay-level mode | `'mixed'` — LLM picks per-annotation; mode-locked list constrains where rewrite is required |
| 1.E Signals → capability | Per-signal flags or master | Per-signal sub-flags (6) — A/B highest-leverage first |
| 1.F Model sentences + cut-list | Cut-list >5 behavior | Warning + truncate to top 5 by confidence; surface "essay needs structural review" if LLM wanted more |
| 1.G Coaching prompt restructure | Turn-rotation summary mechanism | Haiku call at turn end (cached on the turn record), not template |
| 1.H Corpus wiring | Partial / missing corpus data | Ship wire-up anyway; retrieval returns empty cleanly; data growth unblocked |
| 1.Z Phase 7 bridge | Deliverable shape | 4 separate docs (consumer-migration table, field-survival map, Pass-3 skeleton, gap list) — become Phase 7 PR sections |

These decisions update the §3 design entries' "Open question for Tue" sections — that text in each design doc should now be considered resolved per this table. Design docs themselves are not edited; this record IS the resolution log.

---

## §1 — Stage map (revised)

| Stage | What | Items | Spend | Approval |
|-------|------|-------|-------|----------|
| **0** | Cost-hygiene mop-up | 5 atomic commits | $0 | Per-commit |
| **1** | Quality designs + Phase 7 bridge | **9 design docs** | $0 | Per-design Tue review |
| **2** | Quality implementations | **8 implementations** | $0 (cached prompt growth only) | Per-design Tue approval before code |
| **3** | Bundled verification regen | 1 Crochet run | **≤$1.70 (approved D11)** | Pre-approved per D11 |
| **4** | Out of scope (this session) | Phase 7 retirement + output cut list shipping | — | Separate project |

---

## §2 — Stage 0: cost-hygiene mop-up (zero spend)

Five atomic commits. Each: independent verification → change → tsc + vitest → commit. Stop on any failure and surface.

### 0.A — `runningUnderstandingManager` chain delete

**Claim**: zero live consumers of the manager class, the `RunningUnderstanding` interface, or the two parent-type fields that carry it.

**Verification at HEAD (pre-change, required)**:
1. `grep -rn "EssayUnderstanding\b\|ParagraphUnderstanding\b" src/ --include="*.ts"` — verify parent types either (a) have no live consumers (delete entire type) or (b) have consumers but the two `RunningUnderstanding` fields specifically have no readers (delete fields only).
2. Re-confirm `grep -rn "runningUnderstandingSnapshot\|finalUnderstanding\|RunningUnderstandingManager" src/ --include="*.ts"` returns zero hits outside `types.ts` and `runningUnderstandingManager.ts` itself.

**Change** (case b — fields-only, most likely):
- Delete `src/services/essayIntelligence/analysis/runningUnderstandingManager.ts` (474 lines).
- Delete `RunningUnderstanding` interface declaration in `types.ts:166`.
- Delete fields `runningUnderstandingSnapshot` (`types.ts:500-501`) and `finalUnderstanding` (`types.ts:543-544`).
- Delete the comment block at `types.ts:8` referencing it.
- Delete the type guard helper at `types.ts:620`.

**Gate**: `npx tsc --noEmit` clean + `npx vitest run` ≥ 749 passing.
**Rollback**: single `git revert`.

### 0.B — `EditUnderstandingOutput.analysisMode` field delete

**Claim**: field written but no consumer reads it. Confirmed by its own JSDoc and TODO(M1) markers.

**Verification at HEAD**: `grep -rn "\.analysisMode" src/ --include="*.ts" | grep -v test | grep -v analysisPass` returns only TODO + write sites in `editUnderstandingService.ts`.

**Change**:
- Delete field from `EditUnderstandingOutput` (`profileTypes.ts:4988`).
- Delete two `analysisMode: ...` literals (`editUnderstandingService.ts:1197, 1451`).
- Delete `const analysisMode = selectAnalysisMode(...)` at `:1435`.
- Delete TODO(M1) comments at `:913-919, :1196, :1450`.
- If `selectAnalysisMode` itself has no other caller → delete the helper.

**Gate**: tsc + vitest clean.

### 0.C — L1 `cacheSystemPrompt: true` cache marker

**Claim**: `firstImpressions.ts` runs N parallel Haiku calls with an explicitly cacheable system prompt (`firstImpressions.ts:61` comment confirms "cacheable across all parallel paragraph calls"), but the call site does not pass `cacheSystemPrompt: true`. Free ~$0.01–0.02 saving missed.

**Verification at HEAD**: read `firstImpressions.ts:540-545` (or current location); confirm the `callClaudeWithRetry({...})` invocation lacks `cacheSystemPrompt: true`. Read another L1 call site for comparison if N>1 exist.

**Change**: add `cacheSystemPrompt: true` to the call site(s). One-line addition.

**Gate**: tsc + vitest clean. No behavior change for the test suite (test runs don't measure cache benefit).

### 0.D — L5 `sharedContext` `cache_control` block

**Claim**: L5 sets `cacheSystemPrompt: true`, but the shared user-message context (coachingMap, score matrix, cross-patterns assembled identically per paragraph call) is in the user message without a cache marker. Recoverable ~$0.03–0.06.

**Verification at HEAD**:
1. Locate the shared-context block in `deepAnnotationService.ts` (was at `:1815-1835` per dissolved cost-recovery plan, line numbers will have drifted).
2. Confirm structure: is the user message a single string today, or already a messages array with cache slots?
3. Confirm what the "shared" content is — has the Phase 2 assembler convergence wire moved this?

**Change**: restructure the L5 user message into a messages array: `[shared context with cache_control: 'ephemeral', paragraph-specific prompt]`. Follows the same pattern as the L3-walk Phase D1 cache fix.

**Gate**: tsc + vitest clean. **Pre-implementation pause**: surface the exact diff before writing — this touches L5's hot path; want a sanity check.

### 0.E — Flip `L4_UNIFIED_CACHE` default to on

**Claim**: Phase 3 cache unification code-complete; 30 unit tests passing (system-prompt byte-identical across modes); zero quality risk per design. Today default OFF (`process.env.L4_UNIFIED_CACHE === 'true'`). Mop-up = land it on.

**Verification at HEAD**:
1. Re-read `crystallizer.ts:136-143` (the `useUnifiedCache()` helper).
2. Re-read the 30 unit tests — confirm they pass with the flag set explicitly OR override env.
3. Check whether the existing tests assume default-off (some may need flag-flip override).

**Change options** (pick during implementation):
- **(i)** Invert default: `process.env.L4_UNIFIED_CACHE !== 'false'`. Kill switch via env. Tests that assume default-off get explicit `L4_UNIFIED_CACHE=false` override.
- **(ii)** Hard-code on, remove flag entirely (cleanest, no rollback via env). Riskier.

Recommend (i) — kill switch preserves Phase 3 design's "one-line rollback by leaving the flag unset" property.

**Gate**: tsc clean; ALL 30 L4 cache unification tests still pass; full vitest still passes (some tests may need flag-flip-aware fixtures).

**Rollback**: revert OR `L4_UNIFIED_CACHE=false` in environment.

---

## §3 — Stage 1: quality designs + Phase 7 bridge (zero spend)

**Nine design docs.** Each goes to its layer's folder under `docs/pipeline-evolution/04-pipeline-architecture/`. Each Tue-reviewed before its Stage 2 implementation begins. No code in this stage.

### 1.A — Executive Brief (D5 → option (a) new Sonnet micro-call)
- **Doc**: `04-pipeline-architecture/L5/EXECUTIVE_BRIEF_DESIGN.md`
- **Scope**: <300-word brief: 5 directives + 3 model sentences + 1 calibrated verdict. New small Sonnet call post-L4, sees compressed L4+L5 surface.
- **Cover**: input shape (compressed profile), output schema, prompt skeleton, calibration test, render location, +$0.05–0.10 cost estimate, kill-switch flag.

### 1.B — Coherence-resolution (D6 → option (a) L4 prompt extension)
- **Doc**: `04-pipeline-architecture/L4/COHERENCE_RESOLUTION_DESIGN.md`
- **Scope**: L4 crystallizer prompt block — for each contradiction, resolve OR frame for student. $0 marginal cost.
- **Cover**: prompt block text, handling rules (resolve / frame / escalate), L4 output schema addition (`coherenceResolution` field), L5 read-site changes, dedup vs `contradictionConsumer.ts` existing surface.

### 1.C — Calibration few-shot (D7 → all three layers)
- **Doc**: `04-pipeline-architecture/cross-cutting/CALIBRATION_FEWSHOT_DESIGN.md`
- **Scope**: Static anchored exemplars injected into L3.5 sentence effectiveness + L4 ScoreMatrix paragraph scoring + L5 annotation tier reasoning prompts.
- **Cover**: which 4–8 exemplars per scale, prompt block text (cached), expected calibration shift, +$0.02–0.04 cost estimate, retrieval upgrade path (Phase 8 corpus master flag).

### 1.D — Coaching mode (research-flagged learned-helplessness fix)
- **Doc**: `04-pipeline-architecture/L5/COACHING_MODE_DESIGN.md`
- **Scope**: Per-annotation mode toggle — alongside rewrite mode, an "ask + principle" mode. Student writes their own revision; system supplies questions, principles, corpus exemplars (no rewriteExample).
- **Cover**: L5Annotation schema extension (`teachingMode` already exists at line 164; this redefines the `awareness` / `connection` modes' content shape), prompt route per mode, mode selection rules (avoid all-rewrite even when triggered), upstream signal needs.
- **Risk note**: largest of the 8 items; touches L5 redesign in flight (`L5_FEEDBACK_REDESIGN.md`). Design must reconcile.

### 1.E — Signals → capability (Round 7 P2-7)
- **Doc**: `04-pipeline-architecture/cross-cutting/SIGNALS_TO_CAPABILITY_DESIGN.md`
- **Scope**: Convert 7a/7b/7c signals (`revisionIntelligence`, `claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile`, etc.) from inert prompt inventory to deterministic capabilities. Each signal gets: a code gate, a consuming finding, or a coach handler.
- **Cover**: per-signal contract (what gates / what consumes / what surfaces), authenticity-round template reuse, deterministic vs LLM-judged dispatch.
- **Cite**: `ROUND_7_OPEN_ITEMS.md`, ROUND_7 D3-M1 mutual-contradiction example.

### 1.F — Model sentences + decisive cut-list
- **Doc**: `04-pipeline-architecture/L5/MODEL_SENTENCES_AND_CUT_LIST_DESIGN.md`
- **Scope**: L5 emits 2–3 candidate model sentences per high-priority annotation (not just one rewriteExample). Cut-list: separate L5 output for ≥0.9-confidence deletions with rationale.
- **Cover**: schema extension (`rewriteVariants: ModelSentence[]`, `cutCandidates: CutEntry[]`), prompt directives, conflict with existing `rewriteExample` slot, render location (Brief? Roadmap?).
- **Cite**: counselor-gap memory — the "editorial last mile."

### 1.G — Prompt-overload fix (Round 7 P2-8)
- **Doc**: `04-pipeline-architecture/L6/COACHING_PROMPT_RESTRUCTURE_DESIGN.md`
- **Scope**: L6 coaching prompt restructure. Compact "Diagnostic Snapshot" (≤300 tokens) replaces 600–1,100 tokens of verdict-laden injection. Essay text moves BEFORE verdicts (read like an AO, not like an editor).
- **Cover**: section ordering, compaction rules, signal demotion (deferred-area signals stay loaded but un-prefaced), per-round compounding mitigation.
- **Cite**: `ROUND_7_OPEN_ITEMS.md` P2-8 ROOT description.

### 1.H — Wire 8 dormant corpus types into L5
- **Doc**: `04-pipeline-architecture/L5/CORPUS_WIRING_DESIGN.md`
- **Scope**: `voiceArchetypeCompatibility` (98 cells), `corpusLimits` (18), `readerBiasGuards` (14, `appliesTo` includes `'L5'`), `schoolFitVectors` (95), plus `[AP-#]` anti-archetype resolver + `patternId` resolver.
- **Cover**: per-type producer (already exists?), L5 consumer wire site, `corpusRetrievalBlocks.ts` extension shape, per-type `ENABLE_CORPUS_RETRIEVAL_*` flag interaction (Phase 8 master flag), retrieval block prompt format.
- **Risk note**: largest implementation surface of the 8 (8 types × producer + consumer). Phase 8 flag gating contains the rollout.
- **Cite**: `L5_FEEDBACK_REDESIGN.md §2 / §5`, `L5_CONSUMPTION_AUDIT.md rows 202-215`, `IMPLEMENTATION_STATUS_MATRIX.md row 24`.

### 1.Z — Phase 7 bridge: review + absorption design (D10)
- **Doc**: `04-pipeline-architecture/L3-75/PHASE_7_BRIDGE_2026_05_24.md`
- **Scope**: Read-only review of `FIELD_DISPOSITION_TABLE.md` + `ITERATION_SYNTHESIS_2026_05.md` + `L3_ABSORBS_L3_75.md` against HEAD. Grep-verify the 6 consumer-migration sites. Draft the L3 Pass-3 absorption design (which load-bearing 10% lands where, prompt skeleton, no code).
- **Cover**: per-consumer migration site table (file:line, current read, post-absorption read), 10% load-bearing field map (writerPortrait, entanglements, arcTrajectory, momentEarnednessMap.mechanisms, connectionGraphSummary, …), L3 Pass-3 prompt skeleton, gap list ("designs say X, code does Y" discrepancies).
- **No-go**: no `holisticSynthesis.ts` deletion, no orchestrator change, no L3 code added.

---

## §4 — Stage 2: quality implementations

**Conditional on Stage 1 sign-off per design.** No item gets implemented before Tue approves its design doc.

Each implementation:
- Single atomic commit per design item where possible (some — Brief, coaching mode, corpus wiring — may span multiple commits).
- Behind a feature flag for any change that alters student-visible output (Brief, coherence-resolution surfacing, coaching mode, model sentences variants).
- Calibration few-shot ships unflagged (additive cached prompt block).
- TSC + vitest clean per commit.
- A/B verification deferred to Stage 3 regen.

**Implementation order recommendation** (smallest blast radius first; revisable):
1. 2.C — calibration few-shot (additive prompt block, easiest to verify)
2. 2.B — coherence-resolution (L4 prompt extension)
3. 2.A — Executive Brief (new call, kill-switch flagged)
4. 2.G — prompt-overload fix (L6 prompt restructure)
5. 2.E — signals → capability (per-signal increments)
6. 2.F — model sentences + cut-list (L5 schema growth)
7. 2.H — corpus wiring (largest, flag-gated)
8. 2.D — coaching mode (largest student-visible change; ships last with kill switch)

**No spend in this stage** — flags off / additive cached prompts only.

---

## §5 — Stage 3: bundled verification regen (≤$1.70 approved per D11)

Single Crochet fixture run with:
- `L4_UNIFIED_CACHE=true` (or default-on per 0.E)
- All Stage 0 cleanup applied
- All Stage 1 designs reviewed
- All Stage 2 implementations landed (kill-switch flags flipped on for the regen)

### What the run validates

**Cost (all measured against the May 5 baseline)**:
1. Total cold-start ≤ $1.42 from Phase 1 cuts (or honestly capture what they actually achieve)
2. L4 calls 2 & 3 show `cache_read_input_tokens > 0` (Phase 3 cache fires)
3. L1 system-prompt cache reads are non-zero (0.C cache marker fires)
4. L5 shared-context cache reads are non-zero on paragraph calls 2+ (0.D cache marker fires)
5. Total cold-start ≤ $1.20 (post-Phase-3 ladder target)

**Quality — baseline + 8 interventions**:
6. 20–30 L5 annotations (density lock holds)
7. ≥3 of 4 teaching modes per essay (diversity floor)
8. Avg per-annotation token ≥250 (depth proxy)
9. Executive Brief present, ≤300 words, contains 5 directives + ≥1 model sentence + verdict (1.A)
10. Zero raw `coherenceReport.contradictions` reach student render (1.B)
11. Spot-check 5 sentence scores against calibration exemplars for band coherence (1.C)
12. ≥1 coaching-mode annotation surfaced where applicable (1.D)
13. Each shipped signal has its capability evidence trace (1.E)
14. ≥1 high-priority annotation carries `rewriteVariants` with 2–3 candidates (1.F)
15. L6 coach prompt size ≤300 tokens for diagnostic section (1.G)
16. ≥1 retrieval from each wired corpus type with flag on (1.H)
17. Writer portrait richness vs prior dump — manual subjective check

### Fail modes

- Cost > $1.50 cold-start: diagnose which layer regressed; isolate before any re-run.
- Cache reads zero on L4 / L1 / L5: cache fix(es) not firing — investigate, do not re-run blindly.
- Phase B `_truncated: true`: array-cap or output-growth variance — revisit caps.
- Quality regression on subjective surfaces (writer portrait, tellability): discuss revert vs refinement.
- ≥2 of the 8 quality interventions fail acceptance: stop, identify whether shared-cause or independent, decide on partial revert.

### Run command (subject to a final pre-run sanity check)

```
L4_UNIFIED_CACHE=true ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  npx tsx tests/dump-full-profile.ts --fixture 14-harvard-2028-crochet
```

### Output artifacts to capture
- `BUILD_COST_LEDGER.md` appended.
- `tests/output/full-profile-14-harvard-2028-crochet.md` regenerated.
- Side-by-side cost-delta table vs May 5 baseline.
- Per-finding pass/fail grid for items 1–17 above.

---

## §6 — Deferred / out of scope

- **`OUTPUT_CUT_LIST.md` field deletions + array caps** (D9 → bundle into Phase 7 PR).
- **Phase 7 — `holisticSynthesis.ts` deletion + 6 consumer migrations + L3 Pass-3 absorber code** (separate multi-week project; Stage 1.Z lays groundwork only).
- **`deepDiveRunner` re-enable decision** (Phase 8.5).
- **`findingMaturityRefresh` wire** (post-Phase-6 measurement-gated).

---

## §7 — Invariants & discipline (carried from prior plan)

- **Never silently relax cost target.** $0.85 cold-start stays the bar.
- **Never trim downstream-consumed surface without measurement.** Every "quality bet" needs a consumer trace OR a Phase 6 measurement criterion.
- **Never delete code based on a sub-agent's report alone.** Verify at HEAD with own grep before action.
- **Never collapse the three-API-layer split** (L3 / L3.5 / L5).
- **No Sonnet → Haiku swaps without Tue approval.**
- **Net cost delta per code change: zero or negative; no tangent dumps.**
- **$5 hard cap on total testing spend.** D11 approves $1.70 of this; $3.30 remaining for the entire session.

---

## §8 — Session size honest read

This session as scoped:
- Stage 0: 5 atomic commits, ~2–4 hours of careful work.
- Stage 1: 9 design docs, ~12–20 hours of design + review iteration.
- Stage 2: 8 implementations, ~3–7 days of code depending on coaching-mode + corpus-wiring depth.
- Stage 3: 1 verification regen + analysis, ~half a day.
- Total: **realistically a 1–2 week project**, not a single session.

If the wall-clock matters, the option to phase (Batch 3 Q1 option 2) is still available — top 3 quality items + regen this week, items 4–8 next week with a second regen ($3.40 total testing spend, fits in the $5 cap).

The plan as locked stays comprehensive. Surface a phase split if wall-clock pressure emerges.

---

## §9 — Next action

Stage 0.A is the safest possible first move:
1. Run the `EssayUnderstanding`/`ParagraphUnderstanding` parent-type live-consumer check.
2. If result confirms deletion is safe, apply the `runningUnderstandingManager` chain delete.
3. tsc + vitest. Commit.

I can start that now on your word, or hold pending any final revision to this plan.

---

## §10 — Cross-references

- Audit: [`COST_QUALITY_AUDIT_2026_05_22.md`](./COST_QUALITY_AUDIT_2026_05_22.md)
- Original plan (superseded): [`IMPLEMENTATION_PLAN_2026_05_22.md`](./IMPLEMENTATION_PLAN_2026_05_22.md)
- State of truth: [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- Unified plan: [`UNIFIED_PLAN_HOLD_2026_05_10.md`](./UNIFIED_PLAN_HOLD_2026_05_10.md)
- Phase 3 design: `docs/pipeline-evolution/04-pipeline-architecture/L4/L4_CACHE_UNIFICATION_DESIGN.md`
- Phase 7 specs: `docs/pipeline-evolution/04-pipeline-architecture/L3-75/{FIELD_DISPOSITION_TABLE.md, ITERATION_SYNTHESIS_2026_05.md, L3_ABSORBS_L3_75.md}`
- L5 redesign: `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_FEEDBACK_REDESIGN.md`
- Round 7 quality gaps: `docs/ROUND_7_OPEN_ITEMS.md`
- Cost docs: `docs/analysis/{COST_DEADWEIGHT_AUDIT.md, OUTPUT_CUT_LIST.md, COST_CUT_IMPLEMENTATION_PROMPT.md}`
- Counselor gap: memory `essay-intelligence-counselor-gap.md`
- Cost budget rule: memory `feedback_cost_budget.md`
- LLM-first design: memory `feedback_llm-first-design.md`
- Integration-debt pattern: memory `pitfalls_integration_debt.md`

---

## §11 — Stage 2 HEAD verification CORRECTIONS — 2026-05-24

Pre-implementation HEAD grep on the 8 Stage-2 designs (mirrors audit C1/C2 pattern). Each design doc has its own CORRECTIONS section appended; this is the roll-up.

| # | Item | HEAD status | Real Stage 2 delta |
|---|---|---|---|
| 1 | Calibration few-shot | **2/3 SHIPPED** — L3.5 anchors at `analysisPass.ts:469-498`; L4 anchors via `scoreMatrixAnchors.ts` (G3) at `crystallizer.ts:552, 1169, 1566`. L5 layer doesn't fit code (no 0-100 score emitted). | **Item effectively closed.** Optionally redefine the L5 target field (e.g., `priority` 1-5) — recommend defer. |
| 2 | Coherence-resolution | PARTIAL — `CoherenceReport` shipped; `CoherenceResolution` field and prompt directive NOT. | Net-new: prompt extension + schema field (per §0.5: ParagraphScoreMatrix + EssayNorthStar) + L5 read-site. **Clean to ship.** |
| 3 | Executive Brief | NOT SHIPPED — zero hits. | Net-new Sonnet call + schema + integration. **Clean to ship.** |
| 4 | Prompt-overload (L6) | PARTIAL — L6 exists, `revisionIntelligence` wired at `coachingService.ts:2225`; current prompt ordering UNVERIFIED. | **Pre-implementation gate**: read `promptBlocks.ts` to confirm current ordering / Diagnostic-Snapshot-like compaction before any code. |
| 5 | Signals → capability | MIXED — `revisionIntelligence` shipped (consumed at `coachingService.ts:2225`); `claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile` have ZERO producer hits — must verify they exist under different names or are entirely speculative. | **Pre-implementation gate**: confirm each named signal has a HEAD producer before building a router for them. |
| 6 | Model sentences + cut-list | NOT SHIPPED — zero hits. | Net-new schema (2 fields) + prompt directives + fabrication guard extension. **Clean to ship.** |
| 7 | Corpus wiring | MIXED — `[AP-#]` resolver + `antiArchetypes` already shipped at `corpusRetrievalBlocks.ts:104, 470, 475` (data, resolver, fabrication-attribution scan). `readerBiasGuards` NOT shipped. `patternId` resolver unverified. | Items 1 (readerBiasGuards) is greenfield; Item 2 (antiArchetypes-[AP-#]) is mostly shipped (only L5-consumer surface may be new); Item 3 (patternId) needs HEAD verification. |
| 8 | Coaching mode | NAMING COLLISION (blocker) — design's `coachingMode` collides with existing per-turn `CoachingMode` enum at `profileTypes.ts:303-308` + existing `L5TeachingMode` at `profileTypes.ts:5006`. Three distinct concepts, three name collisions. | **Design-edit gate before Stage 2**: pick a non-colliding field name (e.g., `revisionMode` `'rewrite' \| 'ask'`); search-and-replace through the design body. |

### Revised Stage 2 order (post-CORRECTIONS)

Locked items, ready to implement:
1. **Item 2** Coherence-resolution — clean delta, schema + prompt + L5 read-site
2. **Item 6** Model sentences + cut-list — clean greenfield
3. **Item 3** Executive Brief — clean greenfield

Blocked pending Tue sign-off / pre-work:
4. **Item 4** L6 prompt restructure — gated on HEAD inspection of `promptBlocks.ts`
5. **Item 5** Signals→capability — gated on confirming the 3 named signals have producers
6. **Item 7** Corpus wiring — verify which sub-items are net-new
7. **Item 8** Coaching mode — gated on design rename to resolve naming collision

Closed:
- **Item 1** Calibration few-shot — 2/3 already shipped; L5 piece doesn't fit code.

### Cost-recovery implication

Items 1's "+$0.009/essay" cache cost is already banked in the cached prompts at HEAD. The May-5 baseline ledger's zero cache_read situation is the same dynamic as audit C1/C2 — the fixes are shipped, the Phase 6 regen will confirm whether they fire.

### Lesson (third occurrence)

C1/C2 caught two stale design claims. CAL-C1/C2/C3 + S2C-C1/C2 + CW-C1 + CM-C1 catch six more. **Design docs must verify against HEAD before being treated as work-to-do.** Append CORRECTIONS rather than silently revise — the audit trail matters.

---

## §12 — Stage 2 mid-session state (2026-05-27)

Four commits shipped on `fix/warm-edit-completedalllayers`:

| Commit | Item | Status |
|---|---|---|
| `36112fd` | Stage 2 audit | Doc-only — CORRECTIONS to 8 design docs |
| `5cb9b51` | Item 2 Coherence-Resolution | Shipped (additive, unflagged) |
| `6ffe5bd` | Item 6 Model Sentences + Cut-list | Shipped (behind `ENABLE_REWRITE_VARIANTS` + `ENABLE_CUT_LIST`) |
| `b1bc29b` | Item 3 Executive Brief | Shipped (behind `ENABLE_EXECUTIVE_BRIEF`) |

**Items remaining (Stage 2):**

| # | Item | HEAD verification update (2026-05-27) | Decision needed |
|---|---|---|---|
| 4 | L6 prompt restructure | Premise doesn't match HEAD — no single "essay text" or "verdicts" block in L6; ~20 distributed sidecars. Design as written cannot be implemented. See `COACHING_PROMPT_RESTRUCTURE_DESIGN.md` CPR-C2. | Pick (a) compact sidecars / (b) Diagnostic-Snapshot-above-conversation / (c) drop Item 4. Recommend (b). |
| 5 | Signals→capability | Three named signals (`claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile`) confirmed zero hits across entire `src/` tree. They do not exist anywhere. Only nameable signal is `revisionIntelligence`, already wired. See `SIGNALS_TO_CAPABILITY_DESIGN.md` S2C-C4. | Pick (a) drop Item 5 / (b) build producers first / (c) audit actual inert prompts. Recommend (a). |
| 7 | Corpus wiring (1-3 of 10) | `antiArchetypes` + `[AP-#]` resolver fully shipped at `corpusRetrievalBlocks.ts:104,470,475`. `patternId` producer + catalog + validator shipped (consumer-side resolver helper may still be missing). `readerBiasGuards` confirmed greenfield. | Ship readerBiasGuards as standalone next session — small clean delta. |
| 8 | Coaching mode | Naming collision identified ✓. Recommended name `revisionMode` + sibling-to-`rewriteVariants` schema sketched at `COACHING_MODE_DESIGN.md` CM-C4. | Pick field name (recommend `revisionMode`), then Stage 2 ship is straightforward. |

**Session discipline:**
- $0 of $5 testing cap spent (Phase 6 regen remains pre-approved up to $1.70 per D11).
- AnnotationV2 backend-handoff work preserved uncommitted across 3 stash cycles, zero conflicts in final pop state.
- File-scoped `git add` on every commit; `tsc --noEmit` + `npx vitest run` (925 / 5 skipped) green at every commit boundary.

**Next session entry points (in order of leverage):**

1. **Phase 6 regen** — flip the three flags + run the Crochet fixture (≤$1.70 approved). Validates Items 2/3/6 + the May-5 cache_read question simultaneously. Highest-information single move.
2. **Resolve Items 4, 5, 8** — three small Tue decisions (one prompt-restructure scope choice, one drop-or-rescope, one field name). All three unblock implementation work that mirrors Items 2/6's shape.
3. **Item 7 standalone** — readerBiasGuards retrieval + L5 wire-up. Small clean delta. Can ship in parallel with Phase 6 regen since flag-gated.

**Phase 6 regen command (subject to final pre-run sanity check):**

```
ENABLE_EXECUTIVE_BRIEF=true \
ENABLE_REWRITE_VARIANTS=true \
ENABLE_CUT_LIST=true \
L4_UNIFIED_CACHE=true \
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  npx tsx tests/dump-full-profile.ts --fixture 14-harvard-2028-crochet
```

Item 2 (coherence-resolution) is unflagged (additive prompt directive + schema only) — no flag needed.

---

## §13 — Stage 2 final-decision log (2026-05-27)

Walking through the remaining open-gate items in back-and-forth with Tue:

### Item 4 — L6 prompt restructure → DECIDED: (b) Diagnostic Snapshot
- Locked sub-decisions: no model sentences, top 3 directives, phase level + focusAreas, include committeeOneLiner, independent `ENABLE_DIAGNOSTIC_SNAPSHOT` flag, partial-emit fallback.
- Shipped at `c95fd01` — new `coaching/diagnosticSnapshot.ts` module + `coachingService.ts:2660` wire site.

### Item 5 — Signals → capability → DECIDED: (a) drop
- Stage 2 router would have zero inputs (three named signals don't exist). Dead code.
- **Phase 6.5 deferred audit task** (documented in `SIGNALS_TO_CAPABILITY_DESIGN.md` S2C-C5): walk L4/L5/L6 cached prompt blocks against downstream consumer paths; classify each as load-bearing or inert with grep + read evidence. Run AFTER Phase 6 regen produces per-layer token-cost data so the audit has a real baseline. If real inert content surfaces, design the capability conversion against actual targets.

### Item 7 — Corpus wiring → (pending decision, recommend ship readerBiasGuards only)

### Item 8 — Coaching mode → (pending decision, recommend `revisionMode` field name)

