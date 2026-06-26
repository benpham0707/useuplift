> ⚠️ ARCHIVED/SUPERSEDED (2026-06-21). Historical. Current: docs/knowledge-base/INTEGRATION_BLUEPRINT.md (architecture), README.md (KB schema/ops), essays/_MAP.md (build state).

# Knowledge-Base Build Plan — Filling the Field Knowledge to Counselor-Grade

> **Created 2026-06-14.** How to fill the integrated RAG knowledge base so the
> annotator reasons like a top ($500/hr) counselor across all dimensions — not
> just craft. Based on a 3-source content audit (all claims verified at HEAD).
> Companion: [`FIELD_KNOWLEDGE_INTEGRATION_PLAN.md`](./FIELD_KNOWLEDGE_INTEGRATION_PLAN.md).

---

## Headline: the knowledge mostly EXISTS — encoding ≫ authoring

The corpus (190 craft moves) is craft-only and made us think the base was thin.
It isn't. The missing dimensions — reflection/meaning, intellectual command,
ownership/agency, originality, admissions positioning, school fit — are **already
written, in depth, with AO citations**, just not encoded into retrievable form:

- **`docs/research/` tree** — a near-complete, citation-backed AO knowledge base.
  `synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (168KB: 7 character dimensions w/
  Dee Leopold's self-awareness frameworks, Before/During/After maturity, Vulnerability
  Paradox, "8× curiosity," weak/mature examples), `HOLISTIC_REVIEW_FOUNDATION.md`
  (how AOs actually rate/decide — Harvard 1–6, Personal Rating supremacy, Narrative
  Coherence), `counseling-system/SECTION_7.8_ESSAY_STRATEGY.md` ("So What?" test,
  Essence/Wikipedia/Search-and-Replace tests, instant-reject topics, vocabulary
  red-flags), `section3-character/3.1–3.7`. **This is a ~90%-built RAG KB for exactly
  the dimensions the craft corpus lacks.**
- **The 14 reviews** — **376 numbered universal principles** + ~41 pattern clusters
  + per-school "fare elsewhere" rationale + "what this can't teach" guardrails.
  Only the *craft moves* were encoded; the principles/strategy/positioning prose is not.
- **`expertCounselorKnowledgeBase.ts`** — 7 narrative arcs, 7 authenticity signals +
  6 fabrication red-flags + 5-level spectrum, Oof Factor, Committee Pitch Test,
  character framework. Advisor-grade, essay-applicable — but **siloed in activityWorkshop**.
- **23 PIQ transformation pairs** — real-shaped weak→strong w/ diffs + principle, but
  **synthetic** (hand-authored), 4 dimensions, 5 buckets unauthored.

So the work is mostly **ENCODE what we have**, plus **AUTHOR a few genuine gaps**,
plus **INGEST more real examples** (the one true scarcity).

---

## The three-tier fill strategy

### Tier 1 — ENCODE (cheap, highest yield, fills the missing dimensions)
Turn already-written knowledge into dimension-tagged RAG entries:
- `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` → reflection/meaning,
  intellectual command, ownership/agency, maturity. **Single highest-yield file.**
- `docs/research/counseling-system/SECTION_7.8_ESSAY_STRATEGY.md` → positioning, school
  fit, originality (the concrete tests + instant-reject + red-flag-vocab).
- `HOLISTIC_REVIEW_FOUNDATION.md` → the evaluative *frame* (how AOs weight/decide).
- The reviews' **376 universal principles** → `{principle, dimension, sourceEssay, transfer}`.
- `ANNOTATION_PIPELINE_DEEP_RESEARCH_R1 §2–7` (insight-depth 6-level, insight taxonomy,
  failure modes, character-revelation hierarchy, narrative arcs) + `R3 §6` (cliché lists
  + freshness) → reflection, originality, ownership — ready-made leveled scales.
- `expertCounselorKnowledgeBase` essay-applicable sections (arcs, authenticity, oof,
  committee pitch) → impact, ownership, positioning. (Copy into the essay KB; don't
  couple to activity types. Drop the portfolio-only section.)
- Populate `CannotTeachCondition` from the 6 reviews that have it.

### Tier 2 — AUTHOR (the genuine gaps; small but real)
- **Intellectual command** techniques — thinnest dimension; no strong structured source.
- **Efficiency / dead-weight** techniques — only one good source (R4 §2.8 white-space).
- The 5 missing PIQ transformation buckets (VOICE/REFLECTION/IDENTITY/CRAFT/COHERENCE).

### Tier 3 — INGEST (the real scarcity; slow, ongoing)
- **Real exemplar essays:** we have **14, from 2 schools (Harvard/Hopkins), 1 type
  (Common App)**. Target **~50–150 across 6–10 schools and 4 types** (Common App, UC
  PIQ, supplement/Why-Us, activity). The `external/` ingest pipeline is **stubbed**
  (10 sources registered, 0 ingested); the proven path is the manual `top-tier-reference/`
  workflow (~25–35 min/essay) feeding the RAG store.
- **Real weak→strong pairs:** we have **ZERO real ones** (all 34 are synthetic). This is
  the single highest-value missing teaching asset — and the hardest to source (essays
  publish only final form). Sources: revision case studies in books, consented consultant
  material, and — over time — our own platform's user-revision data.

---

## Do we need specific examples? YES — two kinds, and it's our biggest real gap
1. **Exemplar passages** (real admitted-essay excerpts) — ground every technique in a
   real instance. We have 14 essays' worth; need breadth (schools/types).
2. **Real weak→strong transformations** — a counselor teaches by *before→after*. We have
   none real. Highest-value asset to acquire.
3. **Tagging rule (non-negotiable):** several research-doc examples are *fabricated
   illustrations* (e.g. "23% food waste"). They're fine as teaching exemplars but MUST be
   tagged `synthetic` so the AI never cites them as real evidence (mirrors the existing
   `detectFabricatedReferences` guard).

---

## Entry schema (what makes each item produce expert results)
Every knowledge entry should carry:
- **dimension(s)** — tagged to the 11 rubric dims + cross-cutting (intellectual command,
  efficiency, originality, positioning). This is what enables dimension-scoped retrieval.
- **technique / principle name** — the named move.
- **when-to-use** — the trigger/diagnostic signal (so retrieval matches the right gap).
- **mechanism / why** — the advisor reasoning (anti-platitude).
- **example** — a real or (tagged) synthetic instance; before→after where possible.
- **anti-pattern** — how it fails / the cliché version.
- **provenance** — source + `real | synthetic` + AO-citation where applicable.

Granularity: **technique-level** (one move per entry), so a span's specific weakness
retrieves a handful of targeted techniques — not a whole document.

---

## What ensures the best outcomes (the quality bar)
1. **Breadth across all dimensions**, weighted toward the high-value meaning/impact/
   ownership/positioning ones the craft corpus lacks (Tier 1 fills these).
2. **Clean, normalized dimension + technique taxonomy** — the current RAG seed mixes
   categories with dimensions and uses free-text technique filters that miss. Fix this
   first or dimension-scoped retrieval stays unreliable.
3. **Real-AO grounding** — the citation-backed frameworks (Dee Leopold, Hargadon, SFFA,
   NACAC) are the trustworthy anchors; synthetic examples tagged as such.
4. **Provenance + rights reconciliation** — the `external/` source bar EXCLUDES the
   Crimson-sponsored source that 10 of our 14 essays came from. Reconcile the standard
   before scaling ingestion (and treat current corpus essays as internal-only).
5. **Anti-fabrication** kept end-to-end (synthetic tags + the fabricated-reference guard).

---

## Sequencing
1. **Taxonomy first** — define the normalized dimension+technique vocabulary (so everything
   encoded after is retrievable). Cheap, unblocks everything.
2. **Tier-1 encode** — `docs/research/` synthesis + counseling files + the 376 principles +
   expertCounselorKB + R1 §2–7 / R3 §6 into the RAG with the schema above. This alone takes
   the base from craft-only to dimension-spanning advisor-grade.
3. **Tier-2 author** the 3 genuine gaps.
4. **Tier-3 ingest** real essays + (eventually) real pairs — ongoing, in parallel, via the
   manual workflow; doesn't block 1–2.
5. Only then is the integration (dimension-scoped retrieval → annotator) running over a base
   that's actually worth retrieving from.

**Bottom line:** we are not authoring a counselor from scratch — we already wrote most of
one (especially `docs/research/`). The build is: normalize the taxonomy, **encode** the
existing depth into the dimension-tagged RAG, author the 2–3 thin dimensions, and ingest
more real essays + the first real before/after pairs over time.
