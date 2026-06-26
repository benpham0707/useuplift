> ⚠️ ARCHIVED (2026-06-21). The per-fix ARCHITECTURE verdicts are superseded by INTEGRATION_BLUEPRINT.md. What SURVIVES: the honest-ceiling analysis (no revision-pair ground truth → can't prove $500/hr) and the output-shape/sequencing-slot insight — both carried into FOUNDATION_AUDIT.md (S-4) and INTEGRATION_BLUEPRINT Item 6.

# Field-Knowledge Blueprint — Critical Revision (Iterative Pressure-Test, 2 rounds)

> **What this is.** An adversarial 2-round loop stress-tested whether
> `FIELD_KNOWLEDGE_BLUEPRINT.md` actually makes the annotator a $500/hr-advisor-grade
> system that can *evolve its capabilities* — not just retrieve text. Round 1 attacked
> the blueprint on three axes (sourcing / utilization / evolution). Round 2 attacked the
> fixes Round 1 proposed. Every load-bearing code claim was re-verified at HEAD by the
> orchestrator (not taken from sub-agents). This is the honest result.

## Headline verdict

The original blueprint is an **excellent retrieval-plumbing plan (8/10)** and a **weak
expertise/evolution plan**: Sourcing **C+**, Utilization **D**, Evolution **3/10**. It is
necessary but nowhere near sufficient. It silently assumes *retrieve-and-inject = expertise*
and *static retrieval = a system that evolves*. Neither holds. The fixes that close the gap
are real but each has a serious failure mode that must be gated — and two of them depend on
dormant code that must be wired first.

---

## Part A — The expertise gaps (Round 1, all verified)

| ID | Severity | Gap | Verified evidence |
|----|----------|-----|-------------------|
| **USE-5** | fatal | **Wrong altitude.** Knowledge is injected per-span (L5) but expertise is *synthesis*. A synthesis layer already exists — `executiveBrief.ts` `generateExecutiveBrief` (wired `analysisOrchestrator.ts:1357-1367`) emits verdict + 5 directives + **3 model sentences** `{originalSentence, revisedSentence, rationale}` (`:125,145-146`, validated `:427`). The blueprint never feeds or even mentions it. | grep + read confirmed |
| **SRC-1/3** | fatal | **Axis mismatch.** 190 moves are *surface-craft* on an 8-value axis (voice 96, structure 70, …); the rubric needs the 12-value axis. `docs/research/` is AO **evaluation** knowledge (how to *rate* a file), not sentence-level **revision** craft. For the 5 high-weight dims (reflection_meaning_making, intellectual_vitality_curiosity, context_constraints_disclosure, school_program_fit, ethical_awareness_humility) there are ~0 craft moves; chunked passages teach *rating*, not *rewriting*. | read `3.1_INTELLECTUAL_CURIOSITY.md` etc. |
| **USE-2** | fatal | **Name-drop blindness.** The only "did it use the knowledge" check is `detectFabricatedReferences` — an index-in-range regex (`corpusRetrievalBlocks.ts:560-579`). An annotation that says "Apply [MOVE-2] here" scores *identically* to a genuine essay-specific read. The success metric the plan ships (`movesReferenced>0`) is satisfied by the exact failure mode. | read |
| **USE-4** | fatal | **Single-dimension reduction.** `DimensionTarget` = the one weakest dim per paragraph, retrieved independently. Deletes cross-paragraph coordination/sequencing ("fix P2's stakes *before* P4's reflection") — which *is* the expert judgment. Inputs for coordination already exist (`northStar.coherenceResolutions`, L4 `coachingMap.priorities` w/ `unlocksNext`, `admissionsPositioning`) and go unused by retrieval. | read |
| **EVO-1/2** | fatal | **Static + can't manufacture its own gold.** No learning loop anywhere. The richest evolution asset — real `(before-draft, advice, after-text, applied?)` pairs — is **not captured** (see corrected finding below) yet the plan punts "get real pairs" to external acquisition. | verified |
| **EVO-3 / USE-6** | serious | **Unfalsifiable.** No eval against the counselor reference (`tests/output/full-profile-14-harvard-2028-crochet.md`). Every "Verify" in the blueprint checks *plumbing* ("injections>0"), never output quality. The only calibration harness targets the OLD `src/pipeline/annotationPipeline` and scores numeric MAE, not editorial quality. | read `tests/calibration/` |

---

## Part B — Verified corrections to claims (orchestrator-checked at HEAD)

These overturn assertions made *in the loop itself* — recorded so the plan rests on reality.

1. **`priorRewriteDigest` is DORMANT, not "already captured."** Round 1's EVO-2 said the system
   captures the advice→revision→outcome triple and discards it. **Wrong.** `priorRewriteDigest`
   (`profileTypes.ts:2662`) has a type field, two doc-comments, and **one reader**
   (`rewriteGeneration.ts:794`) — and **zero writer sites**. It is `undefined` on every profile
   (the integration-debt pattern: type+reader, no writer). The *live* signal is the weaker
   `computeRevisionIntelligence` (`essayProfileManager.ts:2427`, "ZERO LLM calls"), which derives
   `addressedFindings` by **anchor-text drift** — it knows *text changed*, not *which advice caused
   it*, and carries no per-move dimension delta. **Consequence:** the evolution loop must first
   *build the capture path*, not merely aggregate existing data.

2. **`executiveBrief` is DORMANT and UNSURFACED.** Written at `analysisOrchestrator.ts:1367`, its
   only consumer is `diagnosticSnapshot.ts:56` (behind a *separate* `ENABLE_DIAGNOSTIC_SNAPSHOT`
   flag that **drops the model sentences**), and `ENABLE_EXECUTIVE_BRIEF` defaults OFF. It appears
   **nowhere** in `presentation/` (the student render layer). **Consequence:** "feed the synthesis
   layer" (the top fix) is moot until the brief is *enabled and rendered* — that surfacing is the
   true first step.

3. **No consent model exists.** grep for consent/opt-in/GDPR across essayIntelligence/credits finds
   only *feature flags*. Profiles persist to `essay_understanding` keyed to a Clerk user =
   identified personal data, often from minors. **Consequence:** any plan to promote student essay
   text into a KB that teaches other students is a hard compliance/ethics blocker, not a "later" item.

---

## Part C — The fixes and their CONSTRAINED, surviving forms (Round 2 verdicts)

Round 2 attacked the naive fixes. None survived as written; each survives only gated.

### Fix 1 — Feed the synthesis layer (was: "extend generateExecutiveBrief with retrieved moves")
**Verdict: rejected as written; survives re-sequenced + reshaped.**
- **Prerequisite (blocking):** enable + **render** the executive brief first (Correction 2). Until it
  renders to students, enriching it optimizes an invisible artifact.
- **No-name-drop mechanism:** inject moves into the brief's **system prompt as a silent reasoning
  menu** — "these mechanisms are for YOUR reasoning only; NEVER name a move in the output." Extend
  the attribution scanner to **flag any `[MOVE-#]`/move-name leaking into the rendered brief** and
  trigger a retry. (Moves have no quotable slot in the 300-word shape; without this they become
  rationale jargon = the name-drop relocated to the highest-visibility surface.)
- **Single move-owner (avoid double-count):** L5 *already* injects moves per-span
  (`deepAnnotationService.ts:966`); feeding the brief too creates duplication/contradiction
  ("add MOVE-X to P4" vs "cut P4"). The brief must be the *coordinator* — read L5's injected-move
  set + attribution (requires L5 to persist it) and suppress moves it overrides.
- **Cheaper alternative to test first:** sharpen L5's own move-injection (it's the layer that
  renders) and let the brief inherit quality for free — measure whether brief-feeding adds lift
  *over* a well-tuned L5 before building the cross-paragraph path.

### Fix 2 — Make expertise measurable (was: "LLM-judge eval vs the crochet reference")
**Verdict: survives-with-changes. This is the spine — it must land FIRST** (it is the only
instrument that tells whether any other fix helps vs relocates the name-drop).
- **Stratified reference SET, not one essay:** Common App narrative + UC PIQ + STEM supplement +
  low-income/first-gen + activity essay. The reference calibrates the *rubric's severity per axis*;
  it is **never a similarity target** (a single Harvard-crochet gold rewards lyric mimicry on a
  plain-register PIQ).
- **Relative, not absolute:** score **treatment vs baseline pairwise** (regression gate at −0.15),
  not "match the reference" — the crochet dump is itself ~30% editorial value, so absolute scoring
  caps the ceiling at our current artifact.
- **Judge safeguards (all required, else rubber-stamp):** rubric-anchored 1-5 with explicit
  "longer ≠ better"; report length as a covariate (treatment wins but 1.4× longer → human review);
  position-swap pairwise (discard if order flips winner); **cross-family judge** (not Sonnet judging
  Sonnet) ; **human spot-check calibration** (Tue scores N=10 blind; gate trusted only if
  judge-human agreement clears a threshold).
- **Cadence:** per-PR smoke on 2-3 rotating essays (catches gross regressions, prevents overfit);
  weekly/pre-release deep run on the full stratified set under a pre-approved budget. New harness
  targeting `essayIntelligence` (reuse `CostTracker` + fixtures, **not** the MAE scorer).
- **Editorial axes** (the memory-defined counselor gaps): cross-paragraph reasoning, model-sentence
  specificity (exact-original→revision→why), sequencing, coherence-resolution, calibrated verdict.

### Fix 3 — On-axis knowledge for the 5 empty dims (was: "DimensionPlaybook Sonnet distillation")
**Verdict: rejected as written; survives only as extraction-WITH-ABSTENTION.**
- **Abstention mandatory:** the source is AO *evaluation* prose with no sentence-level craft for
  these dims, so a "produce the JSON" prompt will **invent** plausible `revisionMove`/`weakExample`
  fields and stamp them with a citation (fabrication wearing an authority badge). Craft fields must
  be **nullable + required-null** when the source only describes how AOs *rate*: "emit principle +
  detectionSignal, set craft fields null, do NOT invent."
- **Quote-grounding:** every non-null example/move must carry a verbatim `sourceQuote`; a post-pass
  validator confirms the quote literally appears in the cited file or the field is rejected.
- **Output the gap, don't paper over it:** the null fields become a **visible "craft-missing"
  inventory per dimension** — more valuable than fake fullness, and it feeds Fix 4.

### Fix 4 — Capability evolution (was: "autonomous advice→revision→efficacy flywheel")
**Verdict: rejected as autonomous flywheel; survives only as human-curated growth + honest measurement.**
- **Build the capture path first** (Correction 1): wire `priorRewriteDigest` (L5 persists each shown
  draft + `gapId` + the `dimensionTarget` it addressed; orchestrator recomputes "applied?" each
  re-analysis using **semantic/embedding similarity**, not substring — scene/insight drafts are
  deliberately non-paste-able, so substring under-captures the *best* revisions).
- **No self-referential quality gate:** "applied AND dimension_delta>threshold" promotes whatever a
  17-year-old wrote that nudged an LLM's own score up → KB self-poisoning. Promotion requires
  (a) semantic "applied," (b) an **independent** judge (never saw the advice) rating the result
  *absolutely* against the rubric, and (c) **human curator approval**. The corpus is the product's
  spine; it cannot self-poison.
- **Consent + de-identification, blocking** (Correction 3): no student text enters a teaching KB
  without explicit opt-in (first-class consent record), de-identification, and a deletion path.
- **Volume + exploration:** no `moveEfficacy` ranking influence until a move has ≥~30 independent
  observations (below that it's noise); reserve a retrieval-slot fraction for low-history moves
  (else rich-get-richer monoculture).
- **Use the live anchor-drift signal for *measurement only*** (which advice categories get addressed
  vs persist vs regress, aggregated cross-student) — never for promotion. That tells you *which craft
  the KB fails to land*, feeding Fix 3's gap inventory + the human-curated seed.
- **Honest framing:** this is a *human-curated corpus-growth pipeline seeded by real revisions*, not
  an autonomous compounding flywheel. 20 counselor-vetted weak→strong pairs on
  reflection_meaning_making beat 2,000 auto-promoted student deltas.

---

## Part D — Honest ceiling (the part no engineering changes)

What we can source **today** (no new ingestion) supports a **"well-read, well-organized generalist
counselor"** — roughly a strong $80–150/hr tier, not $500/hr. Three hard limits:
1. **Axis** — craft corpus is surface-craft; expertise corpus is evaluation knowledge; neither
   natively supplies sentence-level revision teaching for the 5 high-weight dims (Fix 3 mitigates,
   doesn't manufacture depth).
2. **No real pairs, no outcomes** — 14 essays, 2 schools, 1 type, 0 admit/deny signal. The system
   can describe what good looks like; it cannot say "this move correlated with admits in profiles
   like yours." Closing this is the human-curated + consented-revision track (Fix 4), which is slow.
3. **Generic craft layer** — the only essay-*craft* prose (SECTION_7.8) is intro-tier; the genuinely
   expert craft (registry strategies) is ~15 items confined to structural style.
True $500/hr level requires real essay volume + outcomes + human counselor curation — a content/ops
track, not a retrieval feature. Engineering gets us a credible, measurable, *improving* generalist;
the last mile is curation.

---

## Part E — Revised execution order (measurement-first spine)

0. **Ship the retrieval plumbing** (original blueprint Items 1, 2, 5, 6) — still correct, still the
   foundation. Per-layer flag fix, DimensionTarget at L3.5, dimension-targeted retrieval, teaching
   block, generalized fabrication check.
1. **Fix 2 — editorial eval harness FIRST** (stratified set, relative pairwise, judge safeguards,
   human calibration). Nothing downstream is verifiable without it.
2. **Enable + render the executive brief** (Correction 2) — surface the synthesis layer.
3. **Fix 1 — feed the brief as silent reasoning scaffold** + make it the move-coordinator; measure
   lift via Fix 2. (Test the "tune L5 instead" alternative here.)
4. **Fix 3 — extraction-with-abstention** → on-axis principles + a craft-missing inventory.
5. **Fix 4 — capture path → consent → human-curated promotion → measurement-only efficacy.** The
   long track; do not gate 0-4 on it.

**Critical path to a *measurably better* annotator:** 0 → 1 → 2 → 3. Evolution (4) is parallel/slow.

---

## Part F — Convergence status & what a Round 3 would test

**Not strictly converged:** Round 2 surfaced new fatal-class findings (dormant capture path, no
consent model, fabrication risk, judge gameability), so by a loop-until-dry bar another round is
warranted. **But** the problem space is now fully characterized and every load-bearing claim is
HEAD-verified; remaining uncertainty is in the *gated-fix designs*, not in discovering new problems.

A **Round 3** would attack the constrained fixes themselves:
- Does the "silent reasoning menu" actually change the brief's model sentences, or do they regress
  to ignoring it? (Only answerable empirically — needs Fix 2 first → a real measurement.)
- Is the cross-family judge + human-calibration enough for a trustworthy gate, or does editorial
  quality resist LLM judging entirely?
- Is the human-curation throughput realistic, or does it bottleneck the whole evolution track?
- Does extraction-with-abstention leave the 5 high-weight dims so empty that the honest answer is
  "we cannot teach these well until we source real craft"?

These are best answered by **building Fix 2 (measurement) and running it**, not by more pure
critique — the loop has reached the point where the next signal comes from data, not argument.

---

## Part G — Round 3 results & FINAL convergence (all HEAD-verified)

Round 3 red-teamed the gated fixes and challenged the whole frame. It produced two
premise-overturning corrections (both verified by the orchestrator) and final build verdicts.

### G.1 — Premise corrections (verified)
1. **The circularity critique rested on a false scarcity premise.** Rounds 1-2 said "the only
   gold is the Sonnet-generated crochet dump." **Wrong.** `tests/calibration/top-tier-reference/`
   holds **14 real published admit essays** (Hopkins ETW + Crimson) with human-gated v2 reviews,
   `PROVENANCE.md`, `REJECTION_LOG.md`; and `tests/calibration/expert-ratings.json` has
   **tiered (poor→excellent) per-dimension ratings WITH prose rationales** — including a `poor`
   essay (EQI 21), i.e. a real negative anchor. So non-circular, human-anchored ground truth
   **exists** for *evaluation* quality. (Nuance R3M-2, verified: it rates *finished essays*, not
   *revision advice* — so editorial-action correctness is still hard to ground.)
2. **The system is already past pure retrieval.** `claudeRetrieval.ts` packs the full ~280-entity
   corpus (~6-7K tokens) into a cached prompt and asks Claude to *reason* about relevance ("prefer
   moves whose detection signal matches… do not reward distant thematic similarity"). "Smarter
   retrieval" is therefore **not the frontier** — the catalog already fits in context and an LLM
   already judges it.

### G.2 — Final fix verdicts
- **Fix 2 (measurement) — BUILD-MINIMAL, and FIRST.** Two-tier gate: **GATED** only on falsifiable/
  structural axes (model-sentence present + `original` is a verbatim essay substring + non-empty
  rationale; cross-paragraph reference count; cut-with-confidence present; sequencing explicit) plus
  **evaluation-agreement** against the human `top-tier-reference` corpus. **ADVISORY (never blocks)**:
  "earned vs performed," verdict calibration, "is the revision better" — circular today. **One-time
  human accreditation** of the judge (Tue scores ~20-30 pairs blind once per rubric version → per-axis
  Cohen's κ → demote sub-0.6 axes to advisory → quarterly drift audit), NOT per-run human scoring
  (which doesn't scale and silently reverts to LLM-grades-LLM). **Cross-family judge** (OpenAI SDK is
  already a live dep) to kill self-preference. **Fork** `runCalibration.ts`'s loaders/scaffold;
  **discard** `qualityScorer`'s MAE-on-scores and its regex-keyword "annotation quality" (which is
  literally USE-2's name-drop failure shipped as a metric, `qualityScorer.ts:278-310`). Honest label:
  the gate measures **craft-polish + evaluation-agreement, NOT $500/hr**.
- **Fix 1 (feed the brief) — DON'T-BUILD the menu/coordinator.** Model sentences are hard-constrained
  to in-essay content + a 600-token ceiling; an abstract move has no quotable slot and no plausible
  mechanism to improve a concrete in-essay rewrite — likely prompt-bloat, not lift. The brief already
  reads the top-5 L5 annotations, so it inherits L5's move quality for free. **One altitude, not two.**
  Minimal: render the brief, tune its OWN prompt against Fix 2; re-open menu-feeding only if the eval
  shows a gap L5 can't cover.
- **Fix 3 (extraction) — BUILD-MINIMAL, scoped, NON-uniform.** The emptiness test resolves
  differently per dim (verified by reading the docs): **`3.6_SELF_AWARENESS`** has ~3-5 genuine
  weak→strong reflection-craft pairs (the WEAK-vs-MATURE "DURING" contrast, the vulnerability-paradox
  pair) — hand-extract those with quote-grounding. **`3.1_INTELLECTUAL_CURIOSITY` and
  ethical_awareness are ~pure evaluation knowledge (≈0 craft)** — do NOT run a distillation pipeline
  whose correct output is mostly nulls; hand-write a one-line "craft-missing; rating-signal only;
  flagged for human curation" manifest. For 4 of 5 dims the honest deliverable is *documenting that we
  cannot teach them yet*.
- **Fix 4 (evolution) — DEFER ENTIRELY**, except wire `priorRewriteDigest`'s **writer** as
  measurement-only capture (cheap; stops the integration-debt bleed; accumulates data for later). No
  consent model exists, no revision traffic exists yet, and the first useful curated pair sits behind
  the entire capture+consent+judge+curation stack. Start it after the generalist ships and there's
  traffic to capture.

### G.3 — The FRAME verdict (the loop's most important output)
**The blueprint is optimizing a local maximum.** It tunes knowledge *access* when access is already
adequate (corpus fits in context, an LLM already ranks it). The two binding constraints are:
1. **Content** — the corpus has **nothing** on 5 of 12 rubric dims; no architecture fixes that, only
   sourcing/curation (the slow track).
2. **Output shape** — the synthesis output cannot *carry* expert reasoning. The executive brief emits
   **5 independent directives + 3 independent model sentences**; directives have `affectedParagraphs[]`
   but **no ordering-dependency field**. A $500/hr advisor's signature move — "fix P2's stakes *before*
   P4's reflection, because P4 depends on P2" (cross-paragraph sequencing, the USE-4 capability) — is
   **architecturally inexpressible**. No amount of knowledge injection produces sequenced reasoning if
   the schema has no slot for it.

**Recommended architecture (hybrid a+c):** (a) treat the small corpus as **in-context reference** the
synthesis call reads, not pre-ranked injected snippets (extends what `claudeRetrieval.ts` started);
(c) **add a sequencing/dependency slot** to the synthesis output so it emits a *coordinated revision
plan* with explicit ordering between directives. (c) is the highest-leverage single change because it
unblocks the one capability retrieval can never supply. Then measure with Fix 2.

### G.4 — FINAL build order
1. **Fix 2 (measurement), build-minimal** — the spine; nothing downstream is falsifiable without it.
2. **Render the executive brief** (enable + add to `presentation/`).
3. **Frame change (a)+(c): in-context corpus reference + a sequencing/dependency slot** in the
   synthesis output. (Replaces the rejected Fix 1 menu/coordinator.)
4. **Ship the retrieval plumbing** the blueprint already specified correctly (flag-fix, DimensionTarget,
   dimension retrieval, teaching block, generalized fabrication check) — still valuable, now measured.
5. **Fix 3 minimal:** hand-extract `3.6`; hand-write the craft-missing manifest for the rest.
6. **Fix 4 deferred:** wire `priorRewriteDigest` writer (measurement-only) now; everything else later.

### G.5 — Convergence
**CONVERGED.** Round 3 produced final verdicts and two premise corrections but **no new
problem-dimension** — the surface is fully characterized and every load-bearing claim is HEAD-verified.
The honest ceiling (Part D) stands and is hardened: engineering buys a **measurable, coordinated
generalist**; the 5 empty high-weight dims and the absence of real outcomes/pairs are content/ops gaps
no architecture closes. The next real signal comes from **building Fix 2 and running it** — not from
more critique.
