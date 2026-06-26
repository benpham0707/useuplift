> ⚠️ ARCHIVED/SUPERSEDED (2026-06-21). Historical. Current: docs/knowledge-base/INTEGRATION_BLUEPRINT.md (architecture), README.md (KB schema/ops), essays/_MAP.md (build state).

# Field-Knowledge Integration Plan — Making the Annotator Vertically Expert

> **Created 2026-06-14.** How to integrate the field knowledge we've built (corpus,
> RAG, craft registries) into the essay-intelligence annotator so it generates
> expert, advisor-grade, dimension-spanning guidance — not the LLM's generic
> "add imagery" reflex. Grounded in a 4-subsystem deep-dive (all counts/claims
> verified at HEAD).

---

## What we actually have (verified)

**1. The corpus** (`essayIntelligence/corpus/`) — the annotator's field knowledge.
- **190 CraftMoves**, genuinely advisor-grade: each carries `mechanism`, `detectionSignal`, `universalApplication`, `antiPatterns`, verbatim `sourceEssays` excerpts, `dimensions`, `compatibleRegisters`. Plus 14 archetypes, 11 anti-archetypes, 7 voice matches.
- **Narrow axis:** `MoveDimension` has 8 *craft* values (voice 96, structure 70, specificity 47, argument 43, closing 35, metaphor 33, emotion 28, opening 17) — NOT the 11 rubric dimensions. Strong on craft/voice/structure/specificity; **thin on reflection/meaning + transformative-impact; absent on ownership/leadership/community/fit/time.**
- From **only 14 essays at 2 schools** (Harvard, Hopkins). ~half the designed corpus entity types ship **empty** (MoveExcerpt, MoveDependency, DeliberateAbsence, ContextualPattern, SchoolFitVector…).

**2. The RAG store** (`services/rag/`) — pgvector, correctly built (cosine + HNSW + diversity + anti-copy).
- Seeded from PIQ examples + activity rubric + counselor KB → **~130–150 fragments / ~30 transformations**, narrow + activity/PIQ-skewed (mostly *evaluation criteria*, not exemplar prose).
- **Likely empty in production** (no seed in CI/migrations/git; needs manual run + `OPENAI_API_KEY`). **Not wired into the essay-analysis/annotation pipeline at all** — only inlineEditor + 2 workshop stages use it.

**3. The craft registries** (`workshop/registry/`) — **5 strategies** (advisor-grade: teaching + howToUse + pitfalls + examples), **10 patterns** (teaching + before/after), **15 signals** (scoring fns, no teaching).
- Consumed **only** by `src/pipeline/annotationPipeline.ts` (`/api/v1/annotate`) — a **separate, parallel annotation system** from ours — and even there *shallowly* (strategies name-dropped; their rich teaching/examples dropped; signals 100% dead code).
- **Our** essayIntelligence annotator does not touch the registries at all.

**4. Retrieval wiring** (`corpusRetrievalBlocks.ts` + `corpus/claudeRetrieval.ts`).
- Claude-native (Haiku ranks the corpus catalog by relevance). Wired into L3/L3.75/L3.5/L4/L5/L6/phaseAssessment.
- **ALL flags OFF by default**; production never sets them. The master-flag flip was blocked by Phase B truncation — **now resolved** by our Phase B headroom raise (17000, no truncation observed).
- **Similarity + voice-filtered:** retrieves moves *topically similar to the essay's own text*, filtered to the essay's *own* voice register → **structurally reinforces the current style; cannot surface a move the essay is missing.**
- **No dimension-targeted path:** retrieval never reads the dimension scores. Nothing takes "reflection is weak here" and retrieves reflection techniques.
- Latent bug: `retrieveAnchorMoves` gates on the master flag only, so per-layer `_L5` is a no-op for it.

---

## Why the annotations aren't expert (root causes)

1. **Running blind** — L5 retrieval was OFF, so annotations used pure generic LLM knowledge (→ the show-tell default).
2. **Wrong retrieval direction** — even on, it feeds moves *like what the essay already does*, not what it's *missing*.
3. **Narrow knowledge** — the corpus is craft-axis-only; the two highest-weighted rubric dimensions (reflection/meaning, transformative-impact) have almost no moves; ownership/efficiency/originality have none.
4. **Fragmented + dormant** — the advisor-grade registry strategies feed a *different* pipeline; RAG is unused/empty; half the corpus is empty scaffolding.

---

## The integration vision

A single **field-knowledge retrieval layer** the annotator calls, that:
1. Reads the **diagnosis** — which rubric dimensions are weak/absent per paragraph & span (from L3.5/L4 scores, MEM gaps, findings).
2. Retrieves **dimension-targeted** field knowledge — techniques/exemplars/before-afters that teach the *weak/missing* dimensions — from a **unified, rubric-dimension-tagged** knowledge base (corpus moves + registry strategies/patterns + RAG transformations).
3. Returns a **diverse, dimension-spanning** set (cap show-tell; prioritize the high-weight meaning dimensions).
4. Is injected **per-span** into the annotator (not one essay-level block), so each annotation is grounded in the specific technique for the specific weakness — feeding the locked annotation shape (paths / flow / tailored / space-economy).

---

## Phased plan (static-first; batch runs to verify)

### Phase 1 — Turn the lights on (fast unlock; mostly static)
- Fix the master-flag-only bug in `retrieveAnchorMoves` so the per-layer L5 gate works.
- Enable corpus retrieval for L5 (now that Phase B truncation is resolved).
- Make L5 retrieval **per-paragraph**, not one essay-level block, so moves route to the right span.
- *Effect:* annotator goes from zero field knowledge → the 190-move corpus. Verify in the next batched run.

### Phase 2 — Retrieve what's missing, not what's there (the quality lever)
- Add a **dimension-targeted retrieval** path: read the paragraph's weak/absent dimension scores (L3.5/L4) + MEM gaps, and retrieve moves/strategies that teach **those** dimensions — instead of similarity-to-existing-text + voice-lock.
- Requires a **rubric-dimension cross-tag** on corpus moves (map the 8 craft dims ↔ the 11 rubric dims, or add rubric tags), so retrieval can ask "give me reflection/meaning techniques."
- Relax the voice-register hard filter (it currently prevents surfacing moves in registers the essay hasn't used yet).

### Phase 3 — Broaden the knowledge base to advisor-grade breadth
- Author/ingest CraftMoves + strategies + exemplars for the **missing dimensions**: reflection & meaning, transformative impact, ownership/agency, intellectual command, efficiency/dead-weight, originality/anti-cliché.
- Populate the empty corpus entity types (MoveExcerpt few-shots, ContextualPattern earned-cliché, DeliberateAbsence).
- Grow the strategy registry beyond 5; **unify** the registry's advisor-grade strategies into the field-knowledge the essayIntelligence annotator retrieves (today they only feed the other pipeline).
- Optionally seed + wire the RAG store (and add a CI/idempotent seed + a row-count check) for transformation before/after pairs.

### Phase 4 — Inject richly + enforce coverage
- Inject the retrieved **teaching + examples + before/after** into the annotation prompt (not name-drops), per-span.
- Coverage/diversity rule: span multiple dimensions per essay, cap show-tell to where it's load-bearing, prioritize the high-weight meaning dimensions, never repeat a concept.
- Wire the 15 signal compute-fns into scoring so dimension weakness is measured, feeding Phase-2 targeting.

---

## Risks & sequencing
- **Don't unify the two annotation pipelines yet** — that's a large architectural decision; for now, bring the *field knowledge* (registry strategies) into the essayIntelligence retrieval, don't merge the pipelines.
- **Cost:** turning retrieval on adds Haiku ranking calls per layer (~cheap). Phase B is at 17K (headroom, not lean) — fine under the current "make it good" directive; revisit in the later cost pass.
- **Verify in batched runs only** (≤$4/run, no back-to-back). Phase 1+2 should be built static then verified in ONE run; #02 generalization folded in.
- **No degraded fallbacks:** retrieval already degrades to `[]` on failure (fine); never fabricate corpus refs (the `detectFabricatedReferences` guard stays).

---

## Highest-leverage first step
Phase 1 + the Phase-2 dimension-targeting are the unlock: the annotator starts *using* the 190-move library AND gets pointed at what each paragraph is *missing*. Phase 3 (breadth authoring) is the deeper investment that makes it genuinely "best of the best." Recommend: build Phase 1+2 static, verify on crochet+#02 in one run, then scope Phase 3 breadth-authoring against what the run still lacks.
