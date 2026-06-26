# Foundation — State & Handoff (2026-06-21)

> The consolidating index for the essay-intelligence knowledge/eval/integration foundation. Wraps a
> multi-cycle effort (KB build → integration planning → eval-gate spec → harsh audits → foundation fixes).
> Read this first to understand what exists, what's verified/guarded, what's specced-not-built, and the
> clean next phase. Every claim here was verified at HEAD; sub-agent claims were re-checked (several
> overturned — see "Audit corrections" below).

## TL;DR honest status
- **The KNOWLEDGE + GOLD foundation is built, corrected, verified, and CI-guarded.** What we teach is
  derived from accurately-analyzed Harvard/Hopkins admit essays; the false claims that had leaked into the
  live retrieval catalog are fixed and can't silently return.
- **The INTEGRATION (KB→generation) and the EVAL GATE are fully SPECCED but ZERO BUILT** (verified: no
  `INCLUDE_KB`, `loadKbEntries`, `compileKbIntoCorpus`, `renderExecutiveBrief`, etc. in `src/`). The specs
  are now coherent and the known build-traps are corrected in-spec.
- **Measurable $500/hr remains gated on data that doesn't exist** (revision-pair ground truth) — the
  honest ceiling, tracked in the Deferred Register below, not solved by any spec.
- **Honest completeness ≈ 15% built+verified, ~50% specced, ~35% neither** (2026-06-21 vision audit). The
  built 15% is high-quality but NARROW (3 of ~18 craft axes; 0% generation built; 0% *provable* quality).
  The deepest gap is not breadth (a grind) — it's that the system **cannot yet produce OR prove** admit-level
  output. See "Vision vs reality" below.

## Artifact map (status)
| Artifact | Role | Status |
|----------|------|--------|
| `essays/entries/*.json` (44) | The verified KB (facts ×23, reflection ×8, restraint ×6, rhythm ×7) | BUILT; clean (44/44 parse, 0 dangling, tiers honest, 21/21 craft tagged surfaceVsExpert 18/3) |
| `src/.../corpus/{topTierCraftMoves,essayArchetypes,antiArchetypes}.ts` (190 moves) | Live retrieval catalog | CORRECTED (8 false-claim sites fixed across 2 truth-passes) + tsc-clean |
| `tests/calibration/verifyGoldClaims.ts` | Never-regress guard (pins 6 facts, bans 11 phrases, advisory-scans reviews + corpus) | BUILT, passing (exit 0), **CI-enforced** |
| `tests/calibration/top-tier-reference/` | The gold (14 admit essays + 14 reviews + close-reads) | CORRECTED (review prose 05/07/10; banners) |
| `EDITORIAL_EVAL_GATE_SPEC.md` v2 | The eval gate (authoritative) | SPEC ready (Stage-1 buildable; Stage-2 gated on integration) |
| `INTEGRATION_BLUEPRINT.md` | KB→generation build plan (authoritative architecture) | SPEC, coherence-corrected (Item 8 superseded→eval-v2; STAGE_RESOLVER; DIM_MAP+SUBTOPIC_MAP F-1) |
| `INTEGRATION_PLAN.md` / `INTEGRATION_DEBATES.md` | Original vision / fork record | SUPERSEDED-bannered → defer to BLUEPRINT + EVAL_SPEC v2 |
| `KNOWLEDGE_SCALING_LOOP.md` | Win condition (6 gates) | G6 redefined (hygiene-gate + advisory-lift); schema dimensionTags corrected |
| `_craft-taxonomy.md` | The ~18-axis breadth scaffold | reference |
| `FOUNDATION_AUDIT.md` + `essays/_audits/cycle-1*.md` | The fault maps + cycle audits | reference |
| `ADR-001-knowledge-application-architecture.md` | **The architecture decision: how knowledge reaches+applies** | **ACCEPTED 2026-06-26** — pivots Items 3/4/6/9 from dimension-filter → whole-essay LLM-judged curation (Phase C). BLUEPRINT Items 3/4/6/8/9 + Execution Order revised per it 2026-06-26; **read before building** |

## What is VERIFIED + GUARDED (the trustworthy core)
1. **Gold accuracy:** ~200 review/rating claims + all 190 corpus-move excerpt claims truth-checked vs raw
   essays. Net defect rate ~7% (concentrated), all corrected. The catalog's craft taxonomy is ~93%+ clean.
2. **Never-regress:** `verifyGoldClaims.ts` pins every corrected fact + bans every removed false phrase,
   scans reviews AND corpus for new countable claims, and **fails CI** on regression.
3. **Honesty/coherence:** the plan-stack's fatal contradictions (G6 unsatisfiable; blueprint↔eval-v2;
   DIM_MAP join; schema mistype) are resolved/bannered; tier-inflation removed; suppression field honest (18/3).

## Audit corrections (sub-agent claims re-verified at HEAD — several overturned)
- COH-5 "DIM_MAP missing `authentic_voice` / wrong vocab" → **partly wrong**: map covers all 11 real tags; prose corrected, lossy `intellectual_vitality→argument` flagged.
- F-4 "188 corpus moves unaudited landmines" → **truth-checked**: only **2 misquotes** found (both fixed), not widespread corruption.
- F-8 "essay-09 EQI contradiction unannotated" → **wrong**: it IS documented (`expectedGenreAdjustedEQI:88` + genreNote — the intentional genre-trap). No fix.
- F-1 "DIM_MAP join fatal" → **CONFIRMED + FIXED** (subtopic now feeds the dimension join in the compile spec).

## Vision vs reality (2026-06-21 honest audit)
| Vision axis | Reality (evidence) | Gap |
|-------------|--------------------|-----|
| ~18 craft axes ("plethora") | 3 axes KB-built (restraint 6, rhythm 7, reflection 8) | ~83% of breadth unbuilt (a grind — tractable by effort) |
| Depth per axis at admit-bar | Built axes genuinely non-obvious/expert (verified); but 6–8 entries each = starter palette | real but not exhaustive |
| Many experts reconciled | **53 distinct authorities** cited (Le Guin, Hemingway, Tufte, Fish… NOT CEG-dependent) | real, not aspirational |
| Dot-connecting edge | 111 connections, 0 orphans, but only **13% cross-subtopic** | thin where it matters — within-axis glossary, not cross-portfolio intelligence |
| Recognize→generate fresh fix | **0% built in `src/`** (KB is a library no running code reads) | the entire KB→output bridge is specced, unbuilt |
| Measurably reaches "best admits" | eval certifies only hygiene; editorial-lift advisory (no ground truth) | **structurally unmeasurable** until S-4 exists |

**Structural ceilings (no amount of the current approach closes these):** (1) more entries can't manufacture
editorial-correctness proof — needs S-4 revision-pairs; (2) within-axis links can't produce the cross-domain
"$300/hr" edge; (3) a KB no code reads can't lift output until integration is built.

**The 3 highest-leverage moves (NOT polish):**
1. **Build the integration end-to-end on the 3 axes you already have — BEFORE widening.** Prove that *any*
   KB entry measurably improves generated output (re-run the cycle-1d Harvard benchmark with KB ON). Converts
   the foundation from "trusted library" to "tested system" and de-risks everything downstream.
2. **Start the S-4 revision-pair corpus now + assign an owner.** The only path to *measurable* admit-level;
   even 30–50 real `(draft→expert edit→better draft)` pairs flip editorial-lift from advisory to gateable.
3. **Do the 8→18 `MoveDimension` re-tag (breadth-by-promotion).** Most expert moves already exist in the 190
   corpus moves, filed under voice/structure — re-tagging exposes ~10 axes' worth of paid-for craft cheaply.

## Doc consolidation (2026-06-21)
The superseded "Field Knowledge" (Era-B) docs were archived to `docs/archived/essay-intelligence-field-knowledge/`
(FIELD_KNOWLEDGE_{BLUEPRINT,INTEGRATION_PLAN,DEBATES,CRITIQUE_AND_REVISION}, KNOWLEDGE_BASE_BUILD_PLAN) — all
bannered; the CRITIQUE's surviving ceiling/sequencing reasoning is carried into FOUNDATION_AUDIT S-4 + BLUEPRINT
Item 6. The win-condition doc moved into this folder (`./KNOWLEDGE_SCALING_LOOP.md`). Fresh-reader path:
`docs/README.md` → this file → one authoritative doc per topic, all in `docs/knowledge-base/`.

## Deferred Work Register (tracked so nothing is lost)
**A. Build-resume (apply when integration build begins; all captured in-spec):**
- Build the integration per `INTEGRATION_BLUEPRINT.md` (loader → compile KB→corpus w/ DIM_MAP+SUBTOPIC_MAP → diagnosis → selection → brief) — verify the `restraint/botched → restraint entry` join END-TO-END (F-1) before trusting it.
- Build the eval per `EDITORIAL_EVAL_GATE_SPEC.md` v2 Stage-1 first (KB-absent, cached profiles).
- 8→18 `MoveDimension` expansion + native-move re-tag (add a dedicated `intellectual`/`curiosity` dim, not `argument` — F-13); add `surfaceVsExpert` to the 190 native moves.
**B. Doc-hygiene (low priority, non-blocking):**
- F-6: `reviewPassages.generated.ts` is cited as an existing precedent but does not exist — correct to "proposed pattern."
- F-10: README standards #7/#8 say "(added cycle-2)" but there is no `cycle-2-audit.md` (work is in cycle-1d + entries) — relabel or add a stub.
- F-11: `top-tier-reference/README.md` still asserts a "firewall" (corpus never in prompts) that reality breaches — correct the claim.
- F-12: legacy `runCalibration` (over the OLD annotationPipeline) has a placeholder `baseline.json` and isn't in CI — orthogonal to this foundation; decide keep/retire.
**C. The ceiling (S-4 — sourcing/human-expert tracks; the real path to MEASURABLE $500/hr):**
- **Revision-pair ground-truth corpus** `(draft → expert advice → better-draft + expert quality delta)` — the ONLY thing that makes editorial-lift gateable (today it's advisory). No artifact/owner yet — **highest-value future investment.**
- **Negative/deny exemplars** for the gold (a bar needs points below the line; synthetic poor-tier set covers calibration only).
- **Real external authority** to replace self-authored/sponsored gold; finish the half-built corpus (14→target; 6/14→14 close-reads).

## Phase 0 — architecture study (DONE 2026-06-25)
Before building, a $0 study validated whether the blueprint's knowledge-application approach is optimal.
Finding (3 convergent audits): **NO — pivot.** The deterministic dimension-filter silos knowledge (the F-1
bug class is intrinsic to it), makes the relevance call mechanically (violates LLM-first), and is blind to
cross-paragraph patterns; the live channel is also noisy (16.6K catalog, 63:1 dilution) and delivers a thin
3-move surface. **Decision (ADR-001): broad-availability + one whole-essay LLM-judged curation pass**, with
determinism demoted to an availability gate + provenance. This deletes the DIM_MAP/SUBTOPIC_MAP/F-1 join
class entirely and reuses existing infra. **ADR-001 ACCEPTED 2026-06-26 (owner-confirmed); INTEGRATION_BLUEPRINT
Items 3/4/6/8/9 + Execution Order revised in place per the ADR (each carries an inline "REVISED per ADR-001"
block; filter-arm text retained as the A/B comparison arm).** The two arms (curation vs filter) are
A/B-measurable on the 3 axes — the eval (Item 8: ≤3-surfaced assertion + A_C), not the ADR, retires the filter arm.

## The clean next phase (when ready to resume) — prove lift before widening
*(Build order now reflects ADR-001's curation arm — see BLUEPRINT Execution Order "REVISED per ADR-001".)*
1. **Build eval Stage-1** (measurement-first) → calibrate thresholds empirically on existing output; **add the
   ≤3-applications-surfaced assertion + wire A_C** (Item 8 amendment) since the curation arm's noise bound is now a
   model judgment, not the filter's `slice(0,2)`.
2. **Build the curation arm per BLUEPRINT end-to-end on the 3 existing axes**, gated by Stage-1: Item 9 **principle-digest
   block** → Item 3 **descriptive leads** → Item 6 **Phase C** (whole-essay curation in the L3.75 call) → placement
   (brief / L5 `corpusContext`). **The F-1 DIM_MAP/SUBTOPIC_MAP join is no longer on the path** (ADR-001 deletes it) —
   instead verify a `restraint` essay's Phase-C pass surfaces a restraint principle with **no join existing**. Then
   **re-run the cycle-1d Harvard benchmark with KB ON** to PROVE a KB entry actually lifts output, and **A/B the Phase-C
   arm vs the legacy Item-4 filter arm** through the gate (A_C + ≤3 + B2 decide which ships). Do NOT author more axes
   until this lift is demonstrated (leverage move #1 — converts "trusted library" into "tested system").
3. **In parallel, begin the S-4 revision-pair corpus + assign an owner** (leverage move #2 — the only path to
   *measurable* admit-level). Then 8→18 re-tag for breadth-by-promotion (#3). Everything else is polish on a
   now-trustworthy base.
