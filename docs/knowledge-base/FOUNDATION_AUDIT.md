# Foundation Audit — KB / Eval / Plan-Stack (pre-build, 2026-06-20)

> Historical fault-map (2026-06-20); the corrections shipped — see FOUNDATION_STATE_AND_HANDOFF.md for current status. Kept (not archived) because tests/calibration/verifyGoldClaims.ts cites it.

> Four parallel harsh audits (gold integrity / KB data quality / cross-artifact coherence / eval new-
> angles+meta) + orchestrator HEAD-verification of the load-bearing claims. Decision: **FIX THE
> FOUNDATION FIRST** (pause forward building) before the eval gate or KB integration. This is the
> consolidated fault map + verified corrections + remediation plan.

## Verdict
**The foundation is NOT yet strong enough to build on.** The problem is below the eval gate: (1) the
GOLD everything calibrates against has verified factual errors already wired into live prompts; (2) the
plan-stack is internally contradictory; (3) even a perfect eval gate is a local maximum — it can certify
"not embarrassing," never "$500/hr good," because no `(draft→advice→better-draft)` ground truth exists.

## Layer 1 — GOLD integrity (VERIFIED errors, some live in prompts)
- **G-1 [verified] False/mischaracterized craft claims wired into the LIVE retrieval catalog.** Essay-10
  "one-sentence hinge paragraph" (reviews' headline structural move) — "Until I became one" is the **2nd
  sentence of a two-sentence paragraph**, not a one-sentence paragraph; yet it's a live `CraftMove`
  (`topTierCraftMoves.ts:782 one-sentence-hinge-paragraph`) + a load-bearing archetype stage
  (`essayArchetypes.ts:228` "paragraph 2 (single-sentence paragraph)"). Essay-07 "routine word-planting
  through-line (childhood→adult)" — "routine" appears **once** (claim false). Essay-09 `qualityTier:
  excellent` but `expectedEQI: 78` (good band) — self-contradiction that would **penalize a correct
  pipeline**. Essay-05 "wheelchair appears once" — appears **twice** (already partly corrected in KB,
  not in the review/corpus). Essay-12 "independence echoed" — appears once. Essay-09 "eleven-thirteenths
  vs eleven-thirteenths" — identical text, no contrast. → the reviews' Part-II craft taxonomy is
  corrupted at the source, and the README's "firewall" (corpus never injected into prompts) is breached.
- **G-2 The "expert" gold is self-authored fiction.** `expert-ratings.json` (10 tiered essays + scores +
  rationales) authored in one commit by one author; no AO, no second rater, no inter-rater agreement.
  Regression anchor at best, not ground truth. Self-quote errors too ("I learned" claimed 3×, actually 5×).
- **G-3 Provenance:** 10/14 essays (71%) are Crimson **sponsored consultant-marketing** with self-admitted
  **unverified** admissions; only 4 (Hopkins) are institution-published Tier-1.
- **G-4 Selection bias:** 14 essays, 2 schools, 1 type, **0 denies/negative exemplars**. Can't define a
  quality *bar* with only points above the line.
- **G-5 Half-built treated as complete:** 14 essays not the claimed 30; 6/14 have structured close-reads;
  `baseline.json` is a placeholder; `runCalibration` is **not in CI** and has never run.

## Layer 2 — KB data quality (B+ overall; craft layer over-claimed)
- **K-1 Tier inflation:** 13/18 craft entries label Uplift's own non-independent sponsored-content corpus
  as **Tier-1** (should be Tier-2-with-self-citation-disclosure) + cite a **404 URL** (`thecrimson.com/sponsored/`).
- **K-2 Dangling links rotted:** a cycle-1 "do-now" relink was never done; now **8/44 entries** have broken
  `connections[].toId` (incl. the `postsffa-identity` hyphen bug + 2 new rhythm→imagery danglers). G5 not green.
- **K-3 Staleness:** volatile fact entries (supplement prompts `effectiveDate 2025-08-01`) are ~weeks from a
  full cycle stale; monthly re-verify cadence already slipping.
- **K-4 Single-author dependence (Sawyer/CEG) persists** as a structural pattern (deferred again).
- **Strong (keep):** the FACT layer's external sources genuinely verify; generative scaffolding is rich;
  provenance trails are candid; schema bifurcation (thin facts / rich craft) is clean.

## Layer 3 — Plan-stack incoherence (artifacts desynced after eval-spec-v2)
- **C-1 [FATAL] G6 unsatisfiable.** `KNOWLEDGE_SCALING_LOOP` G6 = "measurably lifts the editorial eval" but
  eval-v2 makes the only lift axis (B2) **advisory/ground-truth-less**; the gating axes measure hygiene not
  lift. The win condition can never close against its own instrument.
- **C-2 [FATAL] Blueprint Item 8 is STALE** — still describes the v1 ship-gate eval-v2 explicitly retracted
  ("worse than no gate"); a builder following the blueprint builds the rejected gate.
- **C-3 [serious] DIM_MAP wrong vocabulary** — entries use a MIX (12-rubric + craft-axis tags incl.
  `authentic_voice`/`voice`/`specificity`); the build-time assertion would fail on real data.
- **C-4 [serious] Missing-field defaults defeat the guarantees** — `surfaceVsExpert` absent in **78%** of
  application blocks (→ defaults to 'expert' → suppression is a no-op); `reuse` in **1/44** (→ originality
  gate starved; A1 will flag legit verbatim fact-quoting).
- **C-5 [serious] `loadKbEntries` schema gap** — eval reads `workedExample.after`/`failureModes`/
  `reuse.verbatimReuseOK` present in 21/44, 21/44, **1/44**, via undocumented positional `application[N]` nesting.
- **C-6 STAGE_RESOLVER won't compile** (`Record<8-member-union>` missing `crystallizer`; use `Partial`).
- **C-7 Cost off ~15×** in the blueprint ($1.5 claimed vs ~$43 grand-total A/B run, ~8.6× the $5 cap).
- **C-8 Reversed prior verdict:** the blueprint re-introduced the menu/coordinator `FIELD_KNOWLEDGE_CRITIQUE`
  said DON'T-build, without re-justifying.

## Layer 4 — The structural ceiling (deepest; no spec fixes it)
- **S-1 Statistically inert:** n=6-8 essays (3 ran successfully) → lift tests detect only effects so large a
  human catches them by eye; κ-accreditation at n≈24 is mathematically unreachable (CI can't exclude 0.6) →
  editorial axes stay advisory **forever**.
- **S-2 A_C gameable + false-positives:** noun-injection template-with-slots passes; good architectural/
  concise advice fails; "transposability" is quietly circular-or-toothless.
- **S-3 Goodhart attractor = "specific-sounding divergence":** A1 punishes echoing the genuinely-good gold as
  regurgitation → rewards moving AWAY from the only ground truth of quality we have.
- **S-4 [the root] No editorial-correctness ground truth exists.** The gold rates finished essays; the $500/hr
  value is revision-advice correctness. The gate certifies hygiene, never quality. **Escape = a revision-pair
  ground-truth corpus (real drafts + expert advice + before/after deltas)** — a data/human-expert problem.

## Remediation plan (chosen direction: FIX FOUNDATION FIRST)
**Wave 1 (truth + coherence):**
1. Grep-verify EVERY countable/structural claim across all 14 reviews + close-reading-rationale + expert-
   ratings → a definitive corrections list (claim → actual → false/true → wired-into-live-catalog?).
2. Redefine G6 (Layer-3 C-1) to something the instrument can gate. Mark blueprint Item 8 superseded by eval-v2.
**Wave 2 (gold remediation — the active bug):**
3. Quarantine/correct the false moves in the live catalog (`one-sentence-hinge-paragraph` + any others from #1);
   add a build-time "every countable review claim grep-verified" lint.
4. Downgrade the sponsored-content tier inflation (K-1) + fix the 404 URL; relink the 8 dangling connections (K-2).
5. Add ≥ a few negative/deny exemplars (G-4); honestly version the half-built corpus (G-5).
**Wave 3 (coherence finish):** reconcile DIM_MAP/missing-field-defaults/STAGE_RESOLVER/cost/README-gates/menu.
**Then:** revisit the eval gate (build only the honest hygiene core) AND decide the S-4 strategic fork
(revision-pair ground-truth corpus = the real path to *measurable* $500/hr).
