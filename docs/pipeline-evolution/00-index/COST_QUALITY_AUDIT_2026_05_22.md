# Cost + Quality Audit — Essay Intelligence Pipeline

> **Date**: 2026-05-22. **Author**: combined audit (3-agent investigation + ground-truth verification).
> **Scope**: `src/services/essayIntelligence/` L1–L6. **Bar**: multi-session counselor engagement.
> **Source of truth alongside**: [`CURRENT_STATE.md`](./CURRENT_STATE.md) (live pipeline state),
> [`UNIFIED_PLAN_HOLD_2026_05_10.md`](./UNIFIED_PLAN_HOLD_2026_05_10.md) (8-phase rationale).
>
> Companion: [`IMPLEMENTATION_PLAN_2026_05_22.md`](./IMPLEMENTATION_PLAN_2026_05_22.md) (staged execution with gates).

---

## 0. Headline

**The $1.20 target is the *projected* cold-start after Phase 3, not a measured number.**

- Last *measured* per-essay cost: **$1.69** (`tests/output/full-profile-14-harvard-2028-crochet.md`, 2026-05-05). Run captured **zero cache hits** and was **before L5 per-paragraph annotation entered the path**.
- Current cold-start with L5 active is likely **~$1.85–2.10** (the $1.69 dump's "Layers completed" list omits L5; 20–30 L5 annotations × Sonnet adds ~$0.20–0.40).
- Cost ladder (per [`CURRENT_STATE.md:66`](./CURRENT_STATE.md)): $1.69 → $1.42 (Phase 1) → $1.20 (Phase 3) → $0.85 (Phase 7) → $0.70 (Phase 8 selective).
- "$1.20" = lifecycle target *or* projected Phase-3 cold-start depending on context (lifecycle = $0.85 cold + 3 focused at ~$0.10 each).
- Phase 1 cuts **shipped, unverified** (~$0.22 estimated, no post-cut ledger run exists). Phase 3 **code-complete behind `L4_UNIFIED_CACHE=true`, default off, unverified**. Phase 7 (the biggest cut) **not started**.

The savings exist on paper, on disk, and behind feature flags. None have been confirmed against a live ledger.

---

## 1. Cost map (cold-start, measured + estimated)

From the Crochet dump's own per-layer table (2026-05-05, pre-L5):

| Layer | Cost | % of total | Tokens in / out | Model | Cache status |
|---|---:|---:|---|---|---|
| L1 first impressions | $0.045 | 2.7% | 11.2K / 6.8K | Haiku | `cacheSystemPrompt` NOT set at call site — uncached |
| AO first read | $0.002 | 0.1% | 1.1K / 0.4K | Haiku | live consumer (`coachingService` `putDownRisk`, `committeeOneLiner`) |
| L2.5 scout | $0.012 | 0.7% | 2.4K / 2.0K | Haiku | cache_control present |
| L2 structural | $0.046 | 2.7% | 2.0K / 2.4K | Sonnet | cache_control present |
| **L3 walk** | **$0.169** | **10.0%** | 2.9K / 10.1K | Sonnet | `cacheSystemPrompt: true` |
| **L3.75 iter_0** | **$0.531** | **31.4%** | 48.6K / 22.6K | Sonnet | cached, but no compounding (single call) |
| understanding_prose | $0.031 | 1.8% | 2.6K / 1.6K | Sonnet | cached |
| reread_P3 | $0.107 | 6.3% | 3.3K / 6.0K | Sonnet | **REMOVED 2026-05-12 (Phase 1 Cut A)** |
| L3.5 | $0.083 | 4.9% | 8.2K / 3.5K | Sonnet | cache_control present |
| **L4 (3 calls)** | **$0.572** | **33.9%** | 115.7K / 8.6K | Sonnet | **C2 cache-defeat — Phase 3 unified-cache fixes** |
| delta_synthesis | $0.077 | 4.5% | 13.1K / 2.5K | Sonnet | — |
| L5 (NOT in this dump) | est. $0.20–0.40 | — | — | Sonnet | per-paragraph fan-out, `cacheSystemPrompt: true` |
| **TOTAL (cold-start, no L5)** | **$1.69** | 100% | | | **zero cache_read across all layers** |

**Two layers are ~72% of spend: L4 ($0.57, 34%) + L3.75 ($0.65 all-in incl. prose+reread+delta, ~38%).** That is where the money is.

### Cost-cut status

| Phase | Scope | Projected save | Status |
|---|---|---:|---|
| 1 (A/B/D/E/F/G + R5–R9 + ledger split) | L3.75 reread cut, L4-Haiku adversarial drop, L1/L2/L2.5/L3.5 output trims | ~$0.22–0.24 | **SHIPPED** (`3aa1ae0`→`6465935`) — unverified against ledger |
| 3 (L4 cache unification, C7 fix) | Keep 3 calls, unify system prompt, cache shared prefix | $0.13–0.16 | **CODE COMPLETE** behind `L4_UNIFIED_CACHE=true` default off (commits `8773ba4`, `2d507f8`) — unverified |
| 6 (bundled regen) | One Crochet run — bank + measure | — | **PENDING TUE APPROVAL** (~$1.20 spend) |
| 7 (L3.75 retirement) | Delete `holisticSynthesis.ts` 3,573 lines, ~6 consumer migrations | ~$0.35 | **NOT STARTED** — biggest single cut |
| 8 (flag activation) | Focus Mode → AI Risk → Corpus Retrieval → Voice Profile → deep-dive | $0 to +$0.10 selective | **NOT STARTED** |

### Remaining cost fat

1. **L4 uncached prefix — ~$0.13–0.16** — addressable by Phase 3; needs verification flip.
2. **L3.75 entire layer — ~$0.35** — addressable only by Phase 7 retirement.
3. **L1 caching — small but free** — `firstImpressions.ts:540-545` does not pass `cacheSystemPrompt: true` despite the system prompt being explicitly cacheable. Every parallel L1 call re-pays the system prompt. ~$0.01–0.02 recoverable.
4. **L5 shared context** — `cacheSystemPrompt: true` IS set, but the assembled shared user-message block (coachingMap, score matrix, cross-patterns) is not cached. Recoverable ~$0.03–0.06.
5. **Sonnet→Haiku downgrades — OFF the table.** Per `COST_CUT_IMPLEMENTATION_PROMPT.md:14`: "if tempted to swap models, stop and flag Tue." Quality policy.

---

## 2. Quality map

The pipeline's quality is **front-loaded into L3 + L3.75 understanding, then translated by L4 + L5**.

| Layer | Quality contribution | Why | Risk if cut |
|---|---|---|---|
| **L3 walk** | **Highest** | Per-paragraph sequential Sonnet read; sentence-level understanding every downstream layer reads. Counselor-grade microscopic pattern tracking. | High — this IS the quality core. |
| **L3.75 holistic synthesis** | High *output* | `writerPortrait`, `tellabilitySummary` are the "highest-delight" / "single most important AO-signal" student-facing fields. | Medium — but ~90% redundant with redesigned L3; Phase 7 absorbs the load-bearing 10%. |
| **L4 crystallizer** | High (translation) | NorthStar + ScoreMatrix + L4b → strategic frame, calibrated verdicts, ImprovementManifest. The "actionable backbone." | High if layer removed; safe to optimize caching. |
| **L5 deepAnnotationService** | High (student surface) | The actual teaching artifact. 20–30 ranked annotations × ~375 tok. | High — this is what students see. |
| L3.5 analysis pass | Medium | Judgment layer (effectiveness, verdicts, pattern matches). Anti-contamination design. | Medium. |
| L1 / L2 / L2.5 | Low | Descriptive/structural scaffolding. Planned-cut under L3 redesign (sweep absorbs at higher quality). | Low if redesign lands; current consumers are real. |
| L6 coaching | Medium (delivery) | Phase-aware conversational coaching; limited today by signals-as-inventory + prompt overload. | Medium. |

**Load-bearing quality design**: the **THREE-SEPARATE-API-LAYERS split** — L3 (understanding/WHAT IS), L3.5 (analysis/HOW WELL), L5 (feedback/WHAT TO DO) — with separate prompts as structural anti-contamination. Do not collapse.

### Known quality gaps (from audits)

**L5 redesign (`L5_FEEDBACK_REDESIGN.md §1.8`, `L5_E2E_INTEGRITY_AUDIT.md §2.3`)** — 16 missing capabilities; 11 of 29 E2E steps unbuilt:
- No coaching mode (every annotation is rewrite-shaped → research-flagged learned helplessness).
- No `[AP-#]` anti-pattern or `patternId` resolution — anti-archetype corpus never reaches student.
- No calibration few-shot retrieval — 53 anchored `MOVE_EXCERPTS` exist, unused.
- No qualitative score reframing — numeric scores fixated on (Butler & Nisan).
- 8 of 11 corpus types unwired at L5 (`voiceArchetypeCompatibility`, `corpusLimits`, `readerBiasGuards` literally with `appliesTo: 'L5'`, `schoolFitVectors`).

**ROUND_7 (`ROUND_7_OPEN_ITEMS.md`)** — two P2 quality findings open:
- **P2-7** Signals are inventory, not capability. 7a/7b/7c signals land in coach prompt only; no code gate, no routing.
- **P2-8** Prompt overload / verdict-before-evidence inversion. 600–1,100 tokens of verdict-laden content injected *before* the essay text.

**WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS** (March 2026, 8-agent swarm):
- P0 fabricated metrics; P1 learned helplessness; P2 feedback overload; P3 score-centric UX; P4 scoring miscalibrated in middle (~70% of prompts have zero calibration few-shot).

**Counselor-gap memory** — pipeline at ~80% analytical depth, ~30% editorial/strategic value. P0 gaps:
- No Executive Brief (<300 words: 5 directives + 3 model sentences + 1 verdict).
- No coherence-resolution before student surface (~11 self-flagged contradictions reach student raw).
- No revision craft / model sentences (system says "add a bridge sentence", counselor *writes* 2–3 candidates).
- No cut-list with deletion confidence; no calibrated competitive verdict; no portfolio-coordinated read.

### Highest-leverage quality improvements (ranked)

| # | Improvement | Where | Marginal cost | Status |
|---|---|---|---:|---|
| 1 | **Executive Brief layer** (<300 words: 5 directives + 3 model sentences + 1 verdict) | New layer above L4/L5, OR fold into L4 | $0 if folded, ~$0.05–0.10 new call | PLANNED |
| 2 | **Coherence-resolution pass** — collapse the ~11 self-flagged contradictions before student surface | L4→L5 boundary | $0 (prompt extension, no new call) | PLANNED |
| 3 | **Calibration few-shot in scoring prompts** — inject anchored `MOVE_EXCERPTS` | L3.5, L4, L5 | +~$0.02–0.04 (prompt tokens) | PLANNED |
| 4 | **Coaching mode** — questions + principles + corpus exemplars (alongside rewrite mode) | L5 | $0 (prompt mode toggle) | PLANNED |
| 5 | **Signals → capability** — gate routing / force consuming finding / fire coach handler per signal | L3.5/L4/L6 | $0 | PLANNED |
| 6 | **Model sentences + decisive cut-list** — L5 drafts 2–3 candidates per priority; cut-list ≥0.9 confidence | L5 | minor prompt growth | PLANNED |
| 7 | **Prompt-overload fix** — Diagnostic Snapshot compaction; essay text before verdicts | L6 | $0 (prompt restructure) | PLANNED |
| 8 | **Wire 8 dormant corpus types into L5** + `[AP-#]` / `patternId` resolvers | L5 | per `ENABLE_CORPUS_RETRIEVAL_*` activations | PLANNED (Phase 8) |

Items 1–3 are highest-ROI: pure output/prompt transforms over the existing diagnostic stack, near-zero new cost, biggest perceived-quality gain.

### Quality risks in the cost-cutting

| Risk | Mitigation |
|---|---|
| **L3 `priority:'always'` demotion** ($0.10–0.20 save proposed in `COST_DEADWEIGHT_AUDIT.md` A5) | **Don't.** L3 walk depends on each call seeing accumulated state. Demoting always-sections risks losing back-propagation/connection context — directly degrades the quality core. |
| **Output array caps** (`strengthSignatures` 21→6-8, `growthEdges` 11→4-6) — unmeasured | These are LLM-discipline instructions, not measured cuts. Per `CURRENT_STATE.md:41` "quality bet" protocol, every consumer impact must be traced or a Phase-6 measurement criterion must be added. |
| **20–30 annotation density lock** | Plausible per feedback-overload research, but the Top-N ranker discards a real annotation pool. If sort is miscalibrated, useful annotations get dropped. Phase 6 quality checks (mode diversity, ACTION+rewrite floor, avg ≥250 tokens) are density proxies, *not* a measure of whether the *right* ones were surfaced. |
| **`findingMaturityRefresh` deferral** | A growth/iteration mechanism. Deferring caps how much understanding deepens across drafts. A discipline call, not a quality regression. |

---

## 3. What we don't need

### A — Confirmed dead (zero live consumer, grep-verified at HEAD)

Both items are pure code debt — no cost saving today (already not executing) but no quality risk either:

| Item | Evidence | Action |
|---|---|---|
| `runningUnderstandingManager.ts` (474 lines) + `RunningUnderstanding` interface + `runningUnderstandingSnapshot` / `finalUnderstanding` fields on parent types | Zero external readers of either field; zero external constructors / writers via `RunningUnderstandingManager` or `createEmpty()`. Only references live inside the manager file itself and in `types.ts` (declaration site only). | Delete after one final check that `EssayUnderstanding` itself has live consumers (and is therefore safe to remove a field from) vs being entirely dead. |
| `EditUnderstandingOutput.analysisMode` (field at `profileTypes.ts:4988`, written at `editUnderstandingService.ts:1197,1451`) | The function's own JSDoc (`editUnderstandingService.ts:913–919`) declares no downstream consumer reads the field; explicit TODO(M1) markers at write sites. Outside `editUnderstandingService.ts`, grep returns zero reads. | Delete field, prompt write, type declaration, two `analysisMode:` literals. |

### B — Intentionally dormant (do NOT delete — queued capability)

The earlier audit flagged these as dead. **They are not.** Verified against `CURRENT_STATE.md`:

| Item | Where it lives | Why not dead |
|---|---|---|
| `deepDiveRunner.ts` / `dispatchDeepDives` | `analysisOrchestrator.ts:103, 1814–1820` (call commented out) | `CURRENT_STATE.md:144`: "deep-dive growth loop intentionally commented out — re-enable decision deferred to Phase 8.5 with populated FindingStore." Deleting destroys queued capability. |
| `findingMaturityRefresh.ts` / `refreshFindingMaturity` | `findings/findingMaturityRefresh.ts:169` (no consumer) | `CURRENT_STATE.md:30, 88`: "deferred to post-Phase-6 decision after measuring findingPromotion's downstream effect on Phase 5.55 emission rate (cost-discipline call)." |

Both have known future homes. Leaving them in place is the right call.

### C — Confirmed redundant LAYER (the real "don't need")

**L3.75 ≈ 90% redundant with the planned-redesigned L3.** `L3_ABSORBS_L3_75.md`: "~90% of what L3.75 emits today (voice/theme/narrative/admissions dimension profiles) is what the new L3 lenses already produce. Lens outputs ARE the holistic profile fields." Only ~10% (writerPortrait, entanglements, `arcTrajectory`, `momentEarnednessMap.mechanisms`, connectionGraphSummary) is genuinely cross-dimension — becomes a single "L3 Pass 3" call.

**Per-essay cost recoverable: ~$0.35** (L3.75 iter_0 $0.53 + understanding_prose $0.03 + delta_synthesis $0.08, minus the small absorbed L3-Pass-3 call ~$0.10).

**Status**: Phase 7. Not started. Single biggest cost win in the plan.

### D — Output cuts (all proposed, none shipped)

Per `OUTPUT_CUT_LIST.md`, bundled into the unshipped L3.75 retirement PR:

- Field deletions: `thesisConfidence`, `arcMomentum`, `portfolioPosition`, `intellectualFingerprint`, `blindSpots` (consumer at `coachingService.ts:4016` re-routes to `redFlags`), `revealedQualities` (merge into `valuesRevealed`), `threads[].appearances[]` sentence granularity, `craftAssessment.sentencePatterns` numeric stats.
- Array caps: `strengthSignatures` 21→6-8, `growthEdges` 11→4-6, `threads` 6→3-5, `contradictions` 3→1-3, `entanglements` cap 3, `structuralChoices`/`valuesRevealed`/`distinctivenessFactors`/`redFlags` 3-5.
- Savings: ~$0.10/essay direct + compounded downstream (every smaller profile read by L3.5/L4/L5/L6 is cheaper).

These are **quality bets**, not measured cuts. Array caps must be diffed against a fixture before shipping (Phase 6 regen).

---

## 4. Combined cost × quality matrix

The actionable table — what to do per item:

| Item | Cost contribution | Quality value | Verdict |
|---|---:|---|---|
| L1 first impressions | $0.045 | Low (scaffolding) | **Keep for now**, cut in L3 redesign. Free win: add missing `cacheSystemPrompt: true` at call site (~$0.01–0.02). |
| AO first read | $0.002 | Live consumer, low cost | **Keep.** |
| L2 / L2.5 | $0.058 | Low (scaffolding) | **Cut in L3 redesign**, not now. |
| **L3 walk** | $0.169 (10%) | **Quality core** | **Protect.** Reject any proposed cut here (e.g. always-section demotion). |
| **L3.75 holistic** | **$0.65 (38%)** | High output, ~90% redundant | **Retire (Phase 7).** Biggest cost win; preserve the 10% via L3 Pass-3. |
| L3.5 analysis | $0.083 (5%) | Medium (judgment, anti-contamination) | **Keep as-is.** |
| **L4 crystallizer** | **$0.57 (34%)** | High (translation) | **Keep layer, fix caching.** Phase 3 cache unification — verify the flag fires. |
| L5 deep annotation | est. $0.20–0.40 | High (student surface) | **Keep, improve.** Wire dormant corpus, calibration few-shot, coaching mode. |
| L6 coaching | — (per message) | Medium (delivery) | **Improve.** Prompt-overload + signals→capability. |
| Executive Brief (NEW) | $0 folded / ~$0.05–0.10 new call | High perceived gain | **Add (cheap).** |
| Coherence-resolution (NEW) | $0 | High (trust) | **Add (free).** |
| Calibration few-shot (PROMPT) | ~$0.02–0.04 | Medium-high (score consistency) | **Add (cheap).** |
| `runningUnderstandingManager` + chain | $0 | None (dead) | **Delete.** |
| `EditUnderstandingOutput.analysisMode` | $0 | None (dead) | **Delete.** |
| `deepDiveRunner`, `findingMaturityRefresh` | $0 | Queued | **Leave.** |

**The headline finding**: cost and quality are mostly *not* in tension here.
- The biggest cost cut (Phase 7) is **quality-neutral** if the 10% absorption is done right.
- The biggest quality wins (Brief, coherence, calibration) are **nearly free**.
- The genuine tension is narrow: L3 always-section demotion (reject) and unmeasured array caps (gate on Phase 6 regen).

---

## 5. Verification status — what's *banked* vs *asserted*

| Claim | Status |
|---|---|
| Phase 1 cuts save ~$0.22 | **Asserted** — sum of per-commit estimates, no post-cut ledger run |
| Phase 3 L4 cache fires | **Asserted** — 30 unit tests pass (byte-identity + structure invariants); no live API run has shown `cache_read_input_tokens > 0` |
| Phase 7 saves $0.35 + closes redundancy | **Designed** — not started |
| "$1.20 cold-start after Phase 3" | **Projected** — last measured cold-start $1.69, pre-L5 |
| "$0.85 cold-start after Phase 7" | **Projected** |
| "Phase 1 zero quality regression" | **Asserted, not measured** — the array caps + L1/L2/L2.5/L3.5 output trims have no diffed-fixture baseline |
| 20–30 annotation density better than 60 thin | **Plausible per research, not measured against this codebase** |

**One verification run (Phase 6) does double duty** — confirms Phase 1 + Phase 3 cost cuts *and* baselines quality (writerPortrait richness, array-cap signal loss, L4-cache neutrality, L5 density mode-diversity).

---

## 6. Inconsistency flagged in `CURRENT_STATE.md`

Cost ladder (line 66): "$1.69 → ($1.42 after 1) → ($1.20 after 3)".
Phase 3 row (line 59): "$1.54 → ~$1.40 (~$0.13-$0.16 save)".

Phase 1 lands at $1.42 per ladder; Phase 3 starts at $1.54 per its own row. $0.12 gap. Looks like either Phase 1 ladder figure or Phase 3 baseline is stale. Flag in the next CURRENT_STATE update.

---

## 7. Recommended sequence

1. **Free now (no spend, no quality risk):** delete `runningUnderstandingManager` chain + `analysisMode` field.
2. **Free now (designs only):** write spec docs for Executive Brief, coherence-resolution, calibration few-shot. Tue reviews before any implementation.
3. **Cheap quality (after design approval):** implement the 3 cheap items above each layer's prompt path. Cost change: near-zero except calibration few-shot (~$0.02–0.04).
4. **Verification spend (Tue approval):** one Crochet regen with `L4_UNIFIED_CACHE=true`. Bundle: confirm Phase 1 cuts in the ledger; confirm Phase 3 cache fires; baseline quality post-cheap-improvements.
5. **Phase 7 retirement:** separate project. Out of this implementation session's scope.

Detailed gates per item in [`IMPLEMENTATION_PLAN_2026_05_22.md`](./IMPLEMENTATION_PLAN_2026_05_22.md).

---

## CORRECTIONS — appended 2026-05-24

Two claims in §1 ("Remaining cost fat") and §7.1 (the original Stage 0 mop-up list) were **wrong**. Verification at HEAD during the 2026-05-24 implementation session caught them:

### C1 — L1 `cacheSystemPrompt: true` was already set
- **Audit claim**: missing at the firstImpressions call site, ~$0.01–0.02 free recoverable.
- **Reality at HEAD**: present at `firstImpressions.ts:548`.
- **Root cause of the error**: the sub-agent investigation that informed §1 read the dissolved cost-recovery plan (`01-cost-recovery/PLAN.md`'s pre-shipped state) and didn't verify at HEAD.
- **Impact**: the $0.01–0.02 was already saved; not "still on the table."

### C2 — L5 sharedContext `cache_control` was already shipped
- **Audit claim**: missing user-message cache marker, ~$0.03–0.06 recoverable.
- **Reality at HEAD**: shipped in commit `979187a feat(llm): C1+C2+C5 — user-prompt cache breakpoints (L4 + L5)`. `deepAnnotationService.ts:2014-2017` uses `userPromptBlocks` with `cacheBreakpoint: true` on the sharedContext.
- **Root cause**: same as C1 — sub-agent read the Phase D2 design from the dissolved plan as if it were pending.
- **Impact**: same as C1 — already coded.

### Live verification status (the *real* open question)
The May 5 baseline ledger shows non-zero `cache_write` on Sonnet calls but **zero `cache_read` across every layer**. Three possible explanations:
1. The fixes don't actually fire as designed (prefix instability prevents reads).
2. The ledger predates the C1/C2/C5 cache breakpoints (commit `979187a`) — possible if the run was on an older commit.
3. Test-mode disables cache compounding.

**Resolution requires the Phase 6 regen.** The audit's headline ("$1.20 is projected, not measured") stands — but the picture is *not* "cache fixes pending"; it is "cache fixes shipped but unverified in production telemetry."

### Stage 0 list correction
Per these findings, the §7 Stage 0 mop-up list collapses from 5 items to 3:
- 0.A `runningUnderstandingManager` chain — real (shipped 2026-05-24 in `eb30356`).
- 0.B `analysisMode` field — real (shipped 2026-05-24 in `1548475`).
- 0.C L1 cache marker — **NO-OP** (already shipped previously).
- 0.D L5 sharedContext cache — **NO-OP** (already shipped previously).
- 0.E L4 `L4_UNIFIED_CACHE` default flip — real (shipped 2026-05-24 in `2596c42`).

The cost ladder's L1/L5 savings should be considered *already banked* in the codebase, awaiting only Phase 6 regen confirmation.

### Lesson
Sub-agent reports about codebase state need verification at HEAD before being treated as audit findings. The same "no guessing" discipline that applies to fixes also applies to the planning artifacts that drive them.

---

## 8. Anchor citations

- Pipeline source: `src/services/essayIntelligence/analysis/{firstImpressions,crystallizer,deepAnnotationService,holisticSynthesis,sequentialDeepWalk,essayLevelL3Walk,analysisPass,phaseAssessment,editUnderstandingService,runningUnderstandingManager,deepDiveRunner}.ts`
- State of truth: `docs/pipeline-evolution/00-index/CURRENT_STATE.md`
- L5 gaps: `docs/pipeline-evolution/04-pipeline-architecture/L5/{L5_FEEDBACK_REDESIGN.md §1.8, L5_E2E_INTEGRITY_AUDIT.md §2.3, L5_CONSUMPTION_AUDIT.md}`
- Cost docs: `docs/analysis/{COST_DEADWEIGHT_AUDIT.md, OUTPUT_CUT_LIST.md, COST_CUT_IMPLEMENTATION_PROMPT.md, L3_PIPELINE_REDESIGN.md}`
- Round 7 gaps: `docs/ROUND_7_COMPREHENSIVE_AUDIT.md`, `docs/ROUND_7_OPEN_ITEMS.md`
- Counselor gap: memory `essay-intelligence-counselor-gap.md`
- L4 cache design: `docs/pipeline-evolution/04-pipeline-architecture/L4/L4_CACHE_UNIFICATION_DESIGN.md`
- Crochet baseline dump: `tests/output/full-profile-14-harvard-2028-crochet.md`
- Cost ledger: `BUILD_COST_LEDGER.md`
