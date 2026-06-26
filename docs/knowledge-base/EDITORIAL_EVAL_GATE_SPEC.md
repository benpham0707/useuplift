# Editorial Eval Gate — Build Spec v2 (post-harsh-audit; Stage-1 build-ready)

> The measurement spine (INTEGRATION_BLUEPRINT Item 8). v1 was harshly red-teamed on TRUST and
> BUILD-READINESS; v1 was NOT-BUILDABLE-AS-SPECCED and over-claimed. v2 absorbs every finding. The
> honest result: this is a **regression / anti-regurgitation / anti-template / anti-fabrication /
> anti-commoditization / gross-quality-sanity gate** — genuinely useful, falsifiable, mostly
> non-circular — NOT an "editorial-correctness" or "$500/hr-verified" gate. Editorial-correctness has
> no ground truth here (the gold rates finished essays, not revision advice) and stays ADVISORY.

## What a GREEN gate means (corrected — claims ONLY what's falsifiable)
GREEN = treatment **did not** plagiarize the KB exemplars, **did not** collapse to one template,
**did not** hallucinate move refs, **did not** regress the pipeline's own scores, **did not** go
generic/commoditized, AND can rank gross quality (poor≪excellent) like a human. GREEN does **NOT**
mean the advice is editorially correct or admit-bar — that is reported as **directional advisory only**.
Shipping the gate is strictly better than none **only with this label**; with v1's "measurably better
editorial" headline it would reward bland output (the audit's F4) and be worse than none.

## The bootstrapping reality (RT-2 F1) → TWO STAGES
The KB→pipeline integration (INTEGRATION_BLUEPRINT Item 9) is NOT built; `INCLUDE_KB` exists nowhere in
`src/`. So on day one there is no KB-on "treatment." Therefore:
- **Stage 1 (BUILD NOW, KB-absent):** the deterministic hygiene + concreteness checks + B1 evaluation-
  agreement, validated against EXISTING `essayIntelligence` output. Day-one mode is **baseline-vs-baseline →
  null lift expected; that IS the calibration** (records the self-overlap floor, the template-variance
  baseline, the concreteness baseline), not a pass.
- **Stage 2 (DORMANT until Item 9 compiles a KB-on arm):** the *lift* checks (treatment-vs-baseline
  originality-vs-KB, move-execution, no-regression-vs-baseline, B2 helpful-lift). Declared, not built,
  until `moveById.get('kb-…')` resolves.

## Standalone KB loader (RT-2 F3 — build this first, independent of Item 9)
`loadKbEntries(): KbEntry[]` reads `docs/knowledge-base/essays/entries/*.json` directly. The eval reads
`workedExample.after` / `failureModes` / `reuse.verbatimReuseOK` from JSON at eval time — it does NOT need
the runtime Item-9 compile. Cheapest unblock for A1/A3.

## Cost model (RT-2 F6 — the v1 figure was ~5× wrong)
A full treatment+baseline pipeline run is **~$22** (8 fixtures × 2 arms × ~$1–4/essay; verified from the
last checkpoint run) — 4× the $5 cap. So:
- **Run the pipeline ONCE per fixture, PERSIST the `EssayProfile` JSON.** All Stage-1 deterministic checks
  run over the **cached profiles** → **~$0 per-PR**, runs every diff.
- The B-tier judge + any pipeline re-run is **release-only**, 1-fixture smoke max for interactive use.
- A fixture whose pipeline run partially failed (L3/L3.75 errors — ~60% partial-failure rate observed) =
  **INCONCLUSIVE**, never PASS.

## TIER A — HARD GATE (deterministic over cached profiles; ~$0; blocks ship)
- **A1 Originality (anti-regurgitation).** trigram-overlap(generated prose, `loadKbEntries().workedExample.after`)
  ≤ **0.15**; exclude `reuse.verbatimReuseOK` spans. Stage-1: self-overlap floor (gen-vs-gen). Stage-2: vs KB.
  **SCOPE POLICY (2026-06-21, FOUNDATION_AUDIT C-4):** A1 applies ONLY to entries that carry a craft
  `workedExample` (the 21 craft entries — those are do-not-mimic). The 23 FACT entries have NO
  `workedExample` and their value IS reproducing the verified source exactly (SFFA ruling text, policy
  wording) — they are **out of A1's scope** (quoting a verified fact is correct, not regurgitation). So
  the near-empty `reuse` coverage (1/44) is not a gap for A1; `reuse.verbatimReuseOK` only matters for the
  rare craft entry that legitimately quotes a fixed phrase. (Originality for fact-grounded output is
  instead handled by A_C: the *application/framing* around the quote must still be user-tailored.)
- **A2 Anti-template (deep-structure).** FORM×LANDING-TARGET of each final sentence; no cell > 2/N. FORM
  tagged by a Haiku classifier whose **stability must be validated** (tag the same item 3× → same cell ≥X%)
  before A2 is trusted (RT-2 planted-failure ii).
- **A_C Anti-commoditization / concreteness (NEW — closes the audit's killer F4).** Bland safe generic
  feedback ("add sensory detail, tighten word economy, lean into your voice") must FAIL. Deterministic
  proxy: feedback must (a) quote/cite ≥1 specific span from THIS student's essay, and (b) propose ≥1
  concrete essay-specific change (a named rewrite target), not a transposable directive. Operationalize:
  a generic-feedback **canary string** is run through Tier-A every build; if it PASSES, that is the gate's
  documented blind spot, surfaced in red in every report. Plus a "transposability" check — if the feedback
  would read identically against a *different* fixture essay, FAIL. This is the one check that attacks the
  product's documented primary failure mode (commoditized feedback) rather than rewarding it.
- **A4 Fabrication.** `detectFabricatedReferences(output, injectedMoveCount, injectedAntiPatternCount)` →
  `fabricated.length === 0`. Inert until Item 9 injects labeled moves (RT-2 F7) — kept as a forward guard.
- **A5 No-regression (REBUILT — RT-2 F2: do NOT reuse qualityScorer; it scores the LEGACY pipeline).**
  A new check over `EssayProfile.scoreMatrix` / aggregated `paragraphEffectiveness`: treatment must not
  drop below baseline. **Forbidden:** the regex-keyword `measureInsightSpecificity`/`scoreAnnotationQuality`
  path (RT-1 F2 — Part G said discard it; it's USE-2's name-drop-as-metric). Stage-2 (needs a treatment arm).
- **A6 Curation-bound — ≤3 KB applications surfaced (NEW — ADR-001, 2026-06-26).** Deterministic count gate:
  the curation arm (Phase C, BLUEPRINT Item 6) must surface **≤3 KB applications per essay** (whole-essay + L5
  placements combined, counted by distinct `kbSourceId` reaching any rendered surface). FAIL if >3. **Why this
  exists:** the legacy filter arm bounded noise structurally via `slice(0,2)`; ADR-001 moves selection to an LLM
  judgment, so the structural bound is gone and the gate must assert it. Pairs with A_C (A6 bounds *how many*;
  A_C bounds *whether each is concrete/non-generic*). Inert on the legacy filter arm (already bounded); load-bearing
  on the curation arm. Counted in the non-circular deterministic load.
- **A3 Move-execution → DEMOTED to ADVISORY (RT-1 F5, RT-2 F4).** "Scan output against `failureModes`" is
  not a defined deterministic op and the Haiku-classifier fallback is an un-accredited LLM judge. A3 gates
  ONLY per failureMode that has a concrete deterministic proxy (e.g. restraint: regex for the label as
  grammatical subject within N tokens of a follow-on explanatory clause) OR a κ-accredited classifier;
  otherwise advisory. Not counted in the "non-circular hard" load.

## TIER B — JUDGE (cross-family LLM; advisory; gates ONLY per accreditation)
- **B1 Evaluation-agreement (gross-quality sanity; gates once accredited).** System's quality read vs
  human gold. **Honest about F8:** poor≪excellent is trivial and proves little; the discriminating test is
  **adjacent tiers + the two TRAP essays** (04 polished-but-hollow EQI 37; 09 quantified-but-unliterary
  EQI 78) where surface and substance diverge — report those SEPARATELY; the extremes are a sanity floor,
  not the signal. B1 must NOT be the discarded MAE-on-scores construct (RT-1 F2): it is rank-order + TRAP
  discrimination, computed from the pipeline's qualitative verdicts, not `qualityScorer.scoreResult` EQI/MAE.
- **B2 Helpful-lift (editorial-correctness) — ADVISORY-ONLY, NO GROUND TRUTH (RT-1 F1).** There is no
  `(draft, advice, better/worse)` gold; the gold rates finished essays. B2 is inter-LLM agreement, useful
  as a directional signal at best. Cross-family + position-swap reduce *bias*; they do not create *truth*.
  Report it as "directional, unanchored." It gates nothing until real revision pairs OR κ-accreditation exist.

## Anti-circularity (corrected)
- Deterministic Tier-A (A1/A2/A_C/A4/A5/A6) has **no LLM in the verdict** — the non-circular hard load. (A2/A_C
  use Haiku only to *tag/classify*, not to *judge quality*, and A2's tagger needs a stability check.)
- Human/institutional gold anchor (real admits + institution-published close-reads + human v2 reviews) for B1.
- **Cross-family judge = REAL but mis-wired in v1 (RT-2 F5):** it's `callGPT5` → `gpt-4o` via
  **`UPLIFT_OPENAI_KEY`** (NOT `OPENAI_API_KEY`); client is null if unset. Spec REQUIRES: name the real env
  var, pin an explicit model id, **hard-fail** the eval if the key is unset (don't silently skip B), and
  stop labeling `gpt-4o` as "gpt5".
- **Accreditation is EVENT-DRIVEN, not just quarterly (RT-1 F6):** any change to the judge model, judge
  prompt, or rubric weights **demotes all B-axes to advisory until re-accredited.** Report κ confidence
  intervals; an axis whose κ-CI includes <0.6 stays advisory. (Quarterly is the backstop, not the trigger.)

## Anti-gameability (corrected)
- Length covariate (>1.3× → human review, not auto-pass). Position-swap + agreement on every B2 pair.
- **Specificity placebo arm** (irrelevant specific *facts*) AND a **NEW register placebo arm (RT-1 F9)**:
  inject fluent craft-jargon that is actionably empty; if either beats baseline with the judge, the judge is
  biased → distrust that run's B2. (Register-placebo targets the correlated-prior bias cross-family can't fix.)
- A_C is the structural defense against the bland-output reward (F4).

## Anti-Goodhart (corrected — RT-1 F10)
Held-out slice + rotating fixtures are a **partial mitigation, not a solution** at n=14 (only 6 richly
close-read) + 10 synthetic. Synthetic tiered set is calibration-only. State the small-corpus ceiling plainly.

## Honest scope (the sentence that must lead every report)
"This gate certifies: no regression, no regurgitation, no template collapse, no fabrication, not generic,
and gross-quality recognition. It does NOT certify the advice is editorially correct or admit-bar — that
is unanchored/advisory until real revision pairs exist. A GREEN gate prevents shipping regressions and
commoditized/regurgitated output; it does not prove $500/hr quality."

## Integration (build surface, corrected)
- `loadKbEntries()` (NEW, JSON loader). Persist `EssayProfile` per fixture (run pipeline once).
- New `tests/calibration/editorialEval.ts`: Tier-A over cached profiles + Tier-B judge (release-only).
- New no-regression scorer over `EssayProfile` (NOT `qualityScorer`).
- Reuse: `detectFabricatedReferences` (A4), the trigram-overlap util (shared w/ runtime Item 7), the
  `run-checkpoint3-ab.ts` runArm to PRODUCE+persist the profiles (once).
- Judge via `callUnifiedLLM({provider:'gpt5'})` (real path, `unified.ts:234`), gated on `UPLIFT_OPENAI_KEY`.

## Build sequence (corrected, RT-2)
1. `loadKbEntries()` JSON loader.
2. Run `essayIntelligence` once per fixture (KB-absent), persist profiles. (one-off ~$22, release-budget)
3. Stage-1 deterministic checks over cached profiles: A1-floor, A2 (+tagger-stability), A_C, A4-forward, A6 (≤3 curation-bound; curation arm only), B1.
   Self-validate: baseline-vs-baseline → null lift (the calibration). Per-PR ≈ $0.
4. Wire the cross-family judge (`UPLIFT_OPENAI_KEY`, pinned model, hard-fail-if-unset); run B2 ADVISORY.
5. One-time human accreditation (κ per B-axis) → promote accredited axes.
6. **[gated on Item 9]** Stage-2 lift checks (A1-vs-KB, A3-proxies, A5-no-regression, B2-lift).

## Planted-failure coverage (target, post-fixes)
(i) KB regurgitation → A1-vs-KB (Stage 2, needs loader+KB arm). (ii) template collapse → A2 (needs tagger-
stability check). (iii) confident-wrong advice → **uncatchable, by admission** (no ground truth) → advisory.
(iv) verbose-but-no-better → length covariate + A5-no-regression (Stage 2). (v) **bland/commoditized → A_C
(NEW, Stage 1)** — the one the v1 gate rewarded.

## Audit log (what changed v1→v2)
RT-2 F1 bootstrapping → two stages. RT-2 F2 A5 wrong pipeline → rebuilt over EssayProfile. RT-2 F3 no loader →
loadKbEntries. RT-2 F4 A3 stub → advisory. RT-2 F5 judge mis-wired → UPLIFT_OPENAI_KEY + pin + hard-fail.
RT-2 F6 cost 5× → persisted-profile model. RT-1 F1 B2 no ground truth → advisory-only. RT-1 F2 B1 resurrected
discarded MAE → rank+TRAP, forbid keyword scorer. RT-1 F3 "70% signal" false → relabel to hygiene+sanity.
RT-1 F4 bland passes+rewarded → A_C anti-commoditization (the key add). RT-1 F6 accreditation decay → event-
driven. RT-1 F8 tier-extremes trivial → TRAP/adjacent focus. RT-1 F9 correlated-prior → register-placebo.
RT-1 F10 Goodhart at small-n → labeled partial.
