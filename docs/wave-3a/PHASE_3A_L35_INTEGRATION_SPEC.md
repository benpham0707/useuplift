# Phase 3A — L3.5 × Corpus Retrieval Integration Specification

**Status:** IMPLEMENTED behind `ENABLE_CORPUS_RETRIEVAL_L35=true` (default OFF). Block tests + live Claude smoke test pass.

**Phase 3B (structured telemetry persistence) — IMPLEMENTED (2026-04-20):**
- New module [`corpusTelemetryPersistence.ts`](../../src/services/essayIntelligence/analysis/corpusTelemetryPersistence.ts) writes one JSONL record per analysis run to `logs/corpus-telemetry.jsonl` (override via `CORPUS_TELEMETRY_PATH` env var).
- Record format matches the spec's `L35CorpusTelemetry` interface: per-stage attempts (anchor / perParagraph / phaseAssessment / other), attribution counters, fallback log, block-token estimate, total latency, layer tag, timestamp, essayId.
- Persistence is feature-flag-gated (`ENABLE_CORPUS_RETRIEVAL_L35`) and silent-fail — any filesystem error logs a warning and returns. A `persistCorpusTelemetryForced()` escape hatch exists for A/B-runners that need baseline (flag-off) records.
- Attribution tracking now aggregates on `telemetry.attribution` (move/AP counts + fabricated refs) instead of scattered locals. Block-token estimator (char/4 heuristic) lets downstream tooling compute token inflation deltas.
- Tests: [`tests/corpus/test-phase3b-telemetry-persistence.ts`](../../tests/corpus/test-phase3b-telemetry-persistence.ts) — 29 deterministic checks (path resolution, partitioning, JSONL roundtrip, feature-flag gate, silent-fail on unwritable path). Passes as of 2026-04-20.

**Phase 3C (wiring retrieval into remaining layers) — IMPLEMENTED + POLISHED (2026-04-20):**

**Per-layer feature flags (Phase 3C polish pass):**
| Env var | Default | Inherits master? | Semantics |
|---|---|---|---|
| `ENABLE_CORPUS_RETRIEVAL_L35` | OFF | — | Master flag. Gates L3.5 wiring AND acts as default for L3/L3.75/L4/L5 when unset. |
| `ENABLE_CORPUS_RETRIEVAL_L3` | inherit | yes | L3 walk archetype retrieval. |
| `ENABLE_CORPUS_RETRIEVAL_L375` | inherit | yes | L3.75 holistic synthesis archetype retrieval. |
| `ENABLE_CORPUS_RETRIEVAL_L4` | inherit | yes | L4 crystallizer archetypes + craft moves. |
| `ENABLE_CORPUS_RETRIEVAL_L5` | inherit | yes | L5 deep annotation craft moves. |
| `ENABLE_CORPUS_RETRIEVAL_L6` | OFF | **NO** | L6 coaching craft moves. Opt-in only — adds ~1.8s/turn to interactive UX. |

A layer-specific flag explicitly set to `false` acts as a kill switch (overrides master-on). Set to `true` overrides master-off for incremental rollout.

**Layer wiring details:**
- **L3 (understanding walk, `sequentialDeepWalk.ts`)** — archetype retrieval once at walk start, block injected into each paragraph prompt. Uses the NEW `buildDescriptiveArchetypesBlock()` — no calibration/evaluative language — to preserve Understanding-only framing. Stage tag `'walk'`.
- **L3.75 (holistic synthesis, `holisticSynthesis.ts`)** — descriptive archetype block injected into `synthesize()` and `synthesizeIteration()` (first iteration only; later iterations refine, not re-contextualize). Stage tag `'synthesis'`.
- **L4 (crystallizer, `crystallizer.ts`)** — calibration-framed archetype block + anchor-moves block injected into the non-cached call-instruction segment of all 3 L4 calls (NorthStar / ScoreMatrix / L4b). L4 produces ScoreMatrix (evaluative), so calibration framing is appropriate. Stage tag `'crystallizer'`. Attribution detection on combined L4 output.
- **L5 (feedback, `deepAnnotationService.ts`)** — anchor-moves block injected into shared context; every paragraph annotation inherits consistent growth-target vocabulary. Stage tag `'feedback'`. Attribution detection on combined annotation output.
- **L6 (coaching, `coachingService.ts`)** — anchor-moves keyed on student message, injected into the non-cached user prompt (cached system prefix preserved). Opt-in via dedicated flag due to latency impact. Stage tag `'coaching'`. Attribution detection on coach's raw response.

**Architectural cleanups (polish pass):**
- Retrieval helpers (`retrieveAnchorMoves`, `retrievePhaseArchetypes`) now accept an optional `stageTag` parameter. Callers pass their layer's tag directly — no more post-hoc mutation of telemetry records.
- `buildDescriptiveArchetypesBlock()` is a new block builder for understanding-layer use cases; `buildPhaseArchetypesBlock()` is reserved for evaluative layers.
- Attribution detection (`detectFabricatedReferences`) runs on every layer that injects `[MOVE-#]` / `[AP-#]` labels (L3.5, L4, L5, L6). Archetypes don't carry numbered labels, so layers that only inject archetypes (L3, L3.75 iter 0+) don't need attribution.

**Tests:**
- [`tests/corpus/test-phase3c-wiring.ts`](../../tests/corpus/test-phase3c-wiring.ts) — 45 deterministic checks covering flag matrix, stage override, descriptive block anti-contamination assertions, record builder partitioning.

**Checkpoint 3 runner:**
- [`tests/corpus/run-checkpoint3-ab.ts`](../../tests/corpus/run-checkpoint3-ab.ts) — runs control vs treatment on 8 fixtures, writes telemetry to `tests/output/checkpoint3/telemetry-{control,treatment}.jsonl`, emits `report.md` + `summary.json`. Automates 4 safety gates (stability correlation, citation density, token inflation, latency, hallucination rate). The two spec "improves" conditions (score-vs-baseline correlation, weakness specificity) require human-rated inputs that aren't automated — report surfaces the metrics a human needs to read.

**Phase 3A implementation notes (2026-04-20):**
- Retrieval backend: **Claude Haiku in-context ranking** (`src/services/essayIntelligence/corpus/claudeRetrieval.ts`). The full Wave-3a catalog (190 moves + 14 archetypes + 11 anti-patterns) is packed into a cached Haiku system prompt; per-call user message carries the query. **No OpenAI, no pgvector at retrieval time** — Uplift is Anthropic-only.
  - Observed: first call ~5.5s (catalog cache priming), subsequent calls ~1.8s (cache hit). Cost: ~$0.005/call steady-state.
  - The OpenAI+pgvector path (`retrieval.ts` + `embedCorpus.ts` + migration `20260420000000_add_corpus_embeddings.sql`) is retained as **legacy** for future scale (corpus > ~1000 entities) but is NOT the production path.
- All 3 integration points (anchor moves, per-paragraph anti-patterns, phase archetypes) wired in [`corpusRetrievalBlocks.ts`](../../src/services/essayIntelligence/analysis/corpusRetrievalBlocks.ts).
- Per-paragraph anti-patterns are NOT gated on `paragraphEffectiveness < 65` because effectiveness is produced by the analysis call itself (chicken/egg). Instead, gated by relevance > 0.5 — strong paragraphs naturally surface nothing.
- Tests:
  - [`tests/corpus/test-phase3a-blocks.ts`](../../tests/corpus/test-phase3a-blocks.ts) — 28 deterministic checks (no API).
  - [`tests/corpus/test-claude-retrieval-live.ts`](../../tests/corpus/test-claude-retrieval-live.ts) — 6 live checks against `ANTHROPIC_API_KEY` — **passing** as of 2026-04-20.
- Live A/B test (Checkpoint 3) against the 8 fixtures still pending — now unblocked by 3B/3C.
**Date:** 2026-04-20
**Source:** Autonomous swarm specification (Phase 3A design agent)
**Implementation path:** `src/services/essayIntelligence/analysis/analysisPass.ts` + `phaseAssessment.ts`

## Implementation safety model

Wire behind a feature flag: `ENABLE_CORPUS_RETRIEVAL_L35` (default `false`). All retrieval calls wrapped in try/catch with graceful degradation. Integration can ship to production disabled, then be enabled per-deployment after A/B validation.

## Three integration points

### 3.1 Primary — anchor paragraph moves retrieval

Location: `analysisPass()`, between `buildSystemPrompt` (line ~1895) and `buildProfileContext` call.

```typescript
let corpusMovesAnchor: RetrievalResult<CraftMove>[] = [];
if (process.env.ENABLE_CORPUS_RETRIEVAL_L35 === 'true') {
  try {
    corpusMovesAnchor = await retrieveMovesBySignal(
      anchorParagraphText,
      { voiceRegisters: profile.voiceIdentity?.register ? [profile.voiceIdentity.register] : [] },
      3,
    );
  } catch (err) {
    console.warn(`[L3.5/corpus] Anchor retrieval failed: ${(err as Error).message}. Degrading.`);
  }
}
// Inject as CORPUS-ANCHORED CRAFT MOVES block into anchor user prompt when length > 0.
```

Prompt-block format (inserted after profileContext, before findingContext):
```
## CORPUS-ANCHORED CRAFT MOVES (Admitted Essays)
[MOVE-1]: <displayName>
  Source: <essayId> P<paragraph>
  Mechanism: <mechanism (1 sentence)>
  Effectiveness anchor: ~80-90

[MOVE-2]: ...

CALIBRATION GUIDANCE:
When a sentence here uses a similar move, score confidently 75+.
When it attempts the move but falls short (generic/telling), score lower and mark the gap.
```

### 3.2 Secondary — per-paragraph anti-pattern detection (weak paragraphs only)

Location: `analysisPass()` parallel-paragraph loop (line ~1950). Gated by `paragraphEffectiveness < 65`:

```typescript
let antiPatterns: Array<{ id: string; description: string; similarity: number }> = [];
if (para.paragraphEffectiveness < 65 && process.env.ENABLE_CORPUS_RETRIEVAL_L35 === 'true') {
  try {
    const raw = await retrieveAntiPatterns(
      para.sentences.map((s) => s.text).join(' '),
      2,
    );
    antiPatterns = raw.filter((ap) => ap.similarity > 0.5);
  } catch (err) {
    console.warn(`[L3.5/corpus] Anti-pattern retrieval P${para.index} failed: ${(err as Error).message}`);
  }
}
```

Prompt-block (injected into paragraph user prompt, gated on `antiPatterns.length > 0`):
```
## FAILURE-MODE DETECTION (Corpus Anti-Patterns)
[AP-1]: <id> (match confidence: <similarity>)
  Pattern: <description>
  Corpus evidence: this pattern has been scored <low> in 2+ essays
  Improvement path: <failureMode line>
```

### 3.3 Tertiary — phase assessment archetype anchoring

Location: `phaseAssessment.ts`, `buildPhaseUserPrompt()` (line ~305):

```typescript
let phaseAnchorEssays: RetrievalResult<EssayArchetype>[] = [];
if (process.env.ENABLE_CORPUS_RETRIEVAL_L35 === 'true') {
  try {
    const query = [
      profile.thematicArchitecture?.thesis ?? '',
      profile.narrativeStrategy?.primaryStrategy ?? '',
    ].filter(Boolean).join(' ');
    phaseAnchorEssays = await retrieveArchetypeMatches(query, { k: 2 });
  } catch (err) {
    console.warn(`[L3.5/corpus] Phase archetype retrieval failed: ${(err as Error).message}`);
  }
}
```

Prompt-block (injected in phase user prompt after holisticDigest):
```
## PHASE BOUNDARY REFERENCE (Corpus Archetypes)
<archetype 1>: <description first sentence>
  Structural signals: <first stage purpose>
  When-to-use: <first 30 words>

<archetype 2>: ...

INTERPRETATION: Use these as calibration anchors when placing this essay in
foundation / architecture / craft / polish / distinction. Dimensions can
develop unevenly (e.g., voice at craft, structure at architecture).
```

## Fallback semantics (all layers)

1. Retrieval throws → log warn → continue with empty array → skip injection
2. Retrieval times out (>2s) → `Promise.race` against timeout → degrade
3. Retrieval returns 0 results → skip injection silently (valid outcome)
4. OpenAI rate-limit → graceful degrade (no retry for per-paragraph; single retry for anchor)

## Telemetry per analysisPass call

```typescript
interface L35CorpusTelemetry {
  essayId: string;
  featureFlagEnabled: boolean;
  retrievalAttempts: {
    anchor: { resultCount: number; latencyMs: number; error: string | null; injected: boolean };
    perParagraph: Array<{ paragraph: number; resultCount: number; latencyMs: number; error: string | null }>;
    phaseAssessment: { resultCount: number; latencyMs: number; error: string | null };
  };
  attributionTest: {
    movesReferenced: number;      // count [MOVE-#] in output
    antiPatternsReferenced: number; // count [AP-#]
    fabricatedReferences: string[]; // references not in retrieval log → hallucination
  };
  fallbacksTriggered: Array<{ stage: string; reason: string }>;
  totalLatencyMs: number;
  corpusBlockTokens: number;
}
```

Log as JSON at end of `analysisPass()` — downstream Phase 3B telemetry design will consume these.

## A/B test protocol

**Fixtures** (8 essays, v2.1 hand-rated baselines available):
- `05-harvard-2028-i-too-can-dance` — craft phase, strong voice
- `08-harvard-2028-cookies` — architecture phase, mixed specificity
- `12-harvard-2028-three-years-alone` — craft, plain-voice sacrifice
- `03-hopkins-2028-korean-sticky-notes` — foundation/architecture
- `11-harvard-2028-fish-out-of-water` — architecture, narrative-driven
- `06-harvard-2028-three-days-before-a-plane` — architecture→craft boundary
- `02-hopkins-2029-building-a-universe` — architecture, metaphor-heavy
- `09-harvard-2028-bra-shopping` — craft, vulnerable voice

**Metrics:**
1. Score correlation (control vs baseline) vs (treatment vs baseline) — target ≥ +0.05
2. Citation density — % of reasoning referencing [MOVE-#]/[AP-#]/[E-#] — target ≥ 5%
3. Weakness specificity — blind human rating 1-5 — target ≥ 4.0
4. Token inflation — input token delta — target < +2K
5. Latency delta — target < +2s per essay
6. Hallucination rate — fabricated references / total references — target ≤ 1%

**Ship if:** (1) OR (3) improves AND (2,4,5,6) within bounds.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Prompt bloat | Cap at 2-3 moves anchor, 2 anti-patterns/para, 1-2 archetypes in phase |
| Citation hallucination | Attribution test post-analysis; circuit-break if rate >5% across 3 calls |
| Retrieval noise | Apply voice-register + dimension filters; similarity threshold ≥0.65 (moves), ≥0.50 (anti-patterns) |
| Latency regression | Parallelize retrieval with Sonnet calls via `Promise.all`; 2s timeout; retrieve only anchor + weak paras |
| Schema drift | Corpus data loaded once at module init; immutable for session |

## Implementation checklist (6 phases, ~7-10 days)

See full checklist in swarm output archived at `docs/wave-3a/` (this doc distills the spec).

**Phase 1 — Retrieval wiring + anchor** (1-2 days)
- [ ] Add ENABLE_CORPUS_RETRIEVAL_L35 env var + docs
- [ ] Import retrieval functions in analysisPass.ts
- [ ] Add telemetry interface
- [ ] Implement `buildCorpusMovesBlock()`
- [ ] Inject anchor retrieval + block into `buildUserPrompt()`
- [ ] Test on 2 fixture essays

**Phase 2 — Per-paragraph anti-patterns** (1-2 days)
- [ ] Implement `buildAntiPatternsBlock()`
- [ ] Gate on effectiveness < 65
- [ ] Similarity > 0.5 filter
- [ ] Test on 3 fixtures

**Phase 3 — Phase assessment** (1 day)
- [ ] Implement `buildPhaseTransitionBlock()`
- [ ] Wire into `phaseAssessment.buildPhaseUserPrompt()`
- [ ] Test on boundary-case essay

**Phase 4 — Telemetry + attribution** (1-2 days)
- [ ] `testAttribution()` scans output for corpus references
- [ ] Log full telemetry JSON per call
- [ ] Wire downstream CoachingService logging

**Phase 5 — A/B test** (2-3 days)
- [ ] Run control (flag OFF) on 8 fixtures
- [ ] Run treatment (flag ON) on same 8
- [ ] Compute metrics
- [ ] Blind human evaluation

**Phase 6 — Production** (1 day)
- [ ] Code review
- [ ] Deploy flag OFF
- [ ] Enable on staging, monitor dashboard
- [ ] Enable in production after 48h of stable staging telemetry
