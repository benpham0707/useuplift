# Essay Intelligence — Surfacing Work: Change Log + Verification Checklist

> **Durable record (2026-06-05/06).** Everything changed in the surfacing-quality
> push, what's verified statically, and exactly what a run must confirm — so we
> never redo this archaeology and a run is never wasted. Companion docs:
> [`L5_INPUT_DEPTH_AND_WIRING_PLAN.md`](./L5_INPUT_DEPTH_AND_WIRING_PLAN.md),
> [`SURFACING_FIRST_ARCHITECTURE_PLAN.md`](./SURFACING_FIRST_ARCHITECTURE_PLAN.md).
> Memory: `essay-intelligence-l5-surfacing.md`.

---

## The core findings (why this work existed)

1. **No wired user surface.** Only `/essay-coaching/start` was mounted; it returned
   one conversational coaching turn. `renderAnalysisForStudent` (the structured
   document composer) had ZERO production callers — a prototype run only by the
   dump test. The deep analysis was generated, paid for, and dropped.
2. **Cost = unsurfaced, repetitive diagnosis.** Comprehensive run ≈ **$2.88** (7-para).
   Per-layer: L1 $0.06 · L2+L2.5 $0.07 · **L3 walk $0.62** · **L3.75 $0.45** ·
   L3.5 $0.08 · **L4 $0.57** · **L5 $0.48**. The surface consumes ~$0.8–1.2 of it;
   the per-sentence L3 walk (most expensive) is read for ONE field. Same insight
   re-derived ~7×.
3. **The deep content is good; the surfacing dropped it.** Verified the
   `coachingMap.priorities` (deep mentor blocks), writer portrait, growth edges,
   and protected strengths match/exceed the reference reviews
   (`tests/calibration/top-tier-reference/reviews/*-review-v2.md`). The gap is
   delivery, not intelligence.

---

## Changes made this session (all tsc-clean, 627 unit tests green)

### 1A — structural bug fixes
- **signatureMove null-collapse** — `intraDomainValidation.ts`
  `validateSignatureMoveAgainstParagraphs`: drop the offending instance, keep the
  move if ≥1 grounded instance survives (was: any bad instance → whole move null).
  + honest telemetry in `holisticSynthesis.ts synthesizeSignatureMove`
  (`llm_null` | `malformed` | `validator_rejected` | `parse_error`) persisted as
  `craftAssessment.signatureMoveNullReason` (new type in `profileTypes.ts`).
  Dumper (`tests/dump-full-profile.ts`) only says "distributed craft" on genuine
  `llm_null`. Tests: `tests/unit/signature-move-validation.test.ts` (13).
- **strengthSignatures / growthEdges bloat** — `analysisPass.ts`: removed BOTH the
  `primaryStrength`→strengthSignatures and `primaryWeakness`→growthEdges pushes
  (each routed a full paragraph VERDICT into the curated fingerprint channel,
  causing long-prose bloat + short+long duplicates + the same `reasoning` as both
  a "strength" and a "growth edge"). `reasoning` still preserved as `paragraphVerdict`.
- **per-sentence L3.5 render** — NO change needed: the dumper already renders
  `sent.analysis` (989-1001); crochet showed none only because that profile used
  the essay-level path (`sentenceAnalyses: []`). Population is a 1D check.

### 1B — deepened diagnostic inputs (holisticSynthesis.ts prompt rewrites)
Forced *mechanism + discrimination* (the reference-review hallmark) on the 11
below-bar fields: `voiceIdentity.signature`, `distinctivePatterns`,
`vocabularyFingerprint.baseline`, `sentenceRhythm.baseline`,
`tonalDisposition.baseline`, `authenticityAssessment` (cap 40→~60w + matching
constraint), `intellectualFingerprint`, `sentencePatterns`, `institutionalFit`,
`portfolioPosition`, `memorability`. Banned the generic phrasings each produced.

### 1C — cultural/domain decode (new capability)
Required CULTURAL/DOMAIN DECODE block in Phase B quality standards (modeled on the
redFlags forced-checklist), routed into `subtext` + character fields, with the
reference's examples (Confucian virtues, funerary flowers) + anti-fabrication guard.

### Student-render field-mismatch fixes (`renderAnalysisForStudent.ts`)
- **priorities**: read `cp.priority` (deep block) not `cp.action` (nonexistent →
  jargon `architecturalReason`); `cp.target.paragraphs` not `cp.paragraphs`;
  `impact = cp.expectedImpact` directly (was 'high'/'medium' → always 'incremental');
  dropped `architecturalReason` (internal "North Star" jargon) from student view;
  appended `unlocksNext` as "Once you do this".
- **strengths**: `protectedStrengths[].description` not `.strength` (was `[object Object]`).
- **annotated essay**: surface per-paragraph strengths (✓) + growth edges (△);
  word-boundary clamp; dedup multi-paragraph entries to first paragraph;
  `firstQuotedSpan` ignores contraction apostrophes; 5 → ~17 annotations.

### Feature 1 — delivery (the surface now exists)
`essayCoachingRoutes.ts`: `/start` returns the full `studentDocument`
(resiliently); new read-only `POST /essay-coaching/analysis` (cache fetch, no run,
no debit).

### Feature 2 — annotated essay (render)
`InlineAnnotation` gains `detail?`; annotations split headline → detail; each
growth note links to the covering revision priority (`priorityRef`, closing the
stale TODO) — emit-don't-transform.

### Run-waste safeguards
- Phase A max_tokens 8000→9500, Phase B 14000→17000 (the 1B/1C depth + cultural
  decode land in late fields; admissionsPositioning historically truncated first).
- Audited ALL renderer-consumed fields against real data — no `cp.action`-class
  silent drops remain.

---

## VERIFICATION CHECKLIST — what a run must confirm (so it's not wasted)

Run the analysis on **crochet** (and #02 for generalization), save outputs (below),
then confirm:

- [ ] **No truncation** — neither Phase A nor B logs `stopReason: max_tokens`.
- [ ] **signatureMove populates** (or logs an honest `reason=` if null) — no false
      "distributed craft".
- [ ] **strengthSignatures / growthEdges** — no long verdict-prose entries, no
      short+long duplicates.
- [ ] **1B fields hit the reference floor** — `voiceIdentity.signature` names a
      mechanism (no "oscillates/commands a voice"); `distinctivePatterns` carry
      function; `sentenceRhythm.baseline` ≠ "varied"; `institutionalFit` states a
      contrast; `memorability` ranks one winner; `portfolioPosition` ≠ "occupies
      the [theme] dimension".
- [ ] **Cultural decode present** — crochet surfaces Confucian virtue vocabulary /
      funerary-flower read in `subtext` (or "none" honestly).
- [ ] **Already-deep fields did NOT regress** — priorities, transformativeInsight,
      writerPortrait, imageSystem, redFlags, MEM.
- [ ] **Student document renders clean** — annotated essay ~10-14 distinct
      annotations (✓+△, anchored, headline→detail, priority links); priorities show
      the deep blocks; strengths are real; no `[object Object]`.
- [ ] **per-sentence L3.5** — does `sent.analysis` populate on this path? (open #3)

Diff against `tests/calibration/top-tier-reference/reviews/14-clara-crochet-review-v2.md`
and `02-shotaro-building-a-universe-review-v2.md`.

---

## Where results are saved (reuse, don't re-run)

- **Full profile JSON**: `tests/output/full-profile-<essay>.json` — the cached
  profile; reload it to re-render / re-inspect WITHOUT a run.
- **Student render**: `tests/output/STUDENT-RENDER-<essay>-CURRENT.md` (regen via
  the render-only script — deterministic, free).
- **Per-run archive**: `tests/output/runs/<date>-<essay>/` (profile.json +
  student.md + cost log + diff-notes) — see save harness.
- **Reference bar**: `tests/calibration/top-tier-reference/reviews/*-review-v2.md`.

> Re-rendering the student document from a saved profile JSON costs **$0** and is
> deterministic. Only a *content* change (new essay or changed prompts) needs a run.
