# Essay Intelligence Cost Audit — Per-Call Input/Output Deadweight

**Source:** checkpoint3 full A/B run, 2026-04-21, `/tmp/checkpoint3-full.log`. Sonnet 4.5 pricing: **$3/1M input, $15/1M output** (output is 5× per token).

**Central framing:** on any Sonnet call, cost = `(input tokens × $3 + output tokens × $15) / 1M`. Because output is 5× per-token, a call is input-dominated only when input tokens exceed 5× output tokens. Knowing this ratio per layer tells us whether to cut prompt tokens (input-dominated layers) or cap response tokens (output-dominated layers).

This doc maps every layer's cost concentration and flags deadweight on the winning side.

---

## Per-call cost model: where cost actually comes from

Measured per-call from the log, representative values from fixture 05 control:

| Layer / call | Input tok | Output tok | Input $ | Output $ | **Dominates** | In:Out ratio |
|---|---:|---:|---:|---:|---:|---:|
| L1 P0 (Haiku) | 2,274 | 705 | $0.002 | $0.004 | **output** | 3.2× |
| L1 P7 (Haiku) | 2,425 | 2,000 | $0.002 | $0.010 | **output** | 1.2× |
| L2 (Sonnet) | 4,218 | 3,000 | $0.013 | $0.045 | **output** | 1.4× |
| L2.5 (Sonnet) | 3,124 | 2,000 | $0.009 | $0.030 | **output** | 1.6× |
| L3 P0 (Sonnet) | 11,890 | 2,500 | $0.036 | $0.038 | near-even | 4.8× |
| L3 P7 (Sonnet) | 15,563 | 3,000 | $0.047 | $0.045 | near-even | 5.2× |
| L3.5 essay-level | 6,542 | 2,000 | $0.020 | $0.030 | **output** | 3.3× |
| **L3.75 Phase A** (iter0) | ~10,000 | 8,000 | $0.030 | $0.120 | **output** | 1.25× |
| **L3.75 Phase B** (iter0) | ~10,000 | 10,000 | $0.030 | $0.150 | **output** | 1× |
| **L4a-NorthStar** | **36,299** | 3,500 | **$0.109** | $0.053 | **INPUT (67%)** | 10.4× |
| **L4a-ScoreMatrix** | **39,738** | 1,273 | **$0.119** | $0.019 | **INPUT (86%)** | 31× |
| **L4b Crystallizer** | **41,707** | 4,618 | **$0.125** | $0.069 | **INPUT (64%)** | 9× |
| L5 P0 | 7,650 | 1,420 | $0.023 | $0.021 | near-even | 5.4× |
| L5 P5 | 8,811 | 2,000 | $0.026 | $0.030 | **output** | 4.4× |
| L5 cross-para | 7,152 | 1,500 | $0.021 | $0.023 | near-even | 4.8× |

**The picture:**
- **L4 is massively input-dominated.** Three calls × ~40K input each = ~120K input tokens/essay just for L4, at $3/1M = **$0.36 in pure L4 input tokens per essay**. This is the single biggest cost concentration and by far the largest dead-weight target.
- **L3.75 Phase B is output-dominated** (1:1 ratio × 5× price = 83% of that call's cost is output). Every output-token cut we make lands here at 5× the per-token value of input.
- **L3 walk is near-balanced** (~5:1 input:output, matching the 5× price ratio). Neither side is a clear win target.
- **L1/L2/L2.5/L3.5 are all output-dominated** and all cheap. Not worth optimizing.
- **L5 per-paragraph** is output-biased and relatively small (~$0.06/paragraph). Not the big lever.

---

## Part A — Input-side deadweight (what's in the prompt that doesn't earn)

Input-dominated layers: **L4a-NorthStar, L4a-ScoreMatrix, L4b, L3 walk (partial), L3.75 iteration path**. Fix these by trimming the user-prompt context.

### A1. L4 re-reads the entire profile THREE times ($0.25-0.30/essay of pure dead weight)

L4 fires as three separate calls (`L4a-NorthStar`, `L4a-ScoreMatrix`, `L4b`) each assembled by `ProfileRouter` to include essentially the same profile content: all paragraph understanding, L3.5 analyses, L3.75 synthesis, findings, voice identity. Input sizes:

- L4a-NorthStar: **36,299 tokens**
- L4a-ScoreMatrix: **39,738 tokens**
- L4b Crystallizer: **41,707 tokens**

Total L4 input: **~117,744 tokens × $3/1M = $0.353 per essay** on just L4 input. Output from L4 is only ~9K tokens = $0.135. **Input is 72% of L4's total cost of ~$0.49.**

**Deadweight:** the three calls share 80%+ of their input. A single shared system-prompt-cache write + smaller per-call user prompts would save most of this. Currently `cacheSystemPrompt` only caches the *system* portion (stable prompt template). The massive *user-prompt profile dump* is NOT cached across the three calls because it goes in the user prompt. Three identical cache writes would cost ~$0.13 once and the following two reads at 10× cheaper = **save ~$0.20-0.25/essay**.

**Concrete fix:** Move the stable profile dump from the user prompt into a cached system-prompt segment (Anthropic supports multi-block system prompts with `cache_control`), so the first L4a call writes the cache and the subsequent two read it at 1/10 the price. Implementation: ~20 lines in `crystallizer.ts` to restructure the prompt shape.

### A2. L3 walk's user prompt grows with every paragraph

L3 input sizes across P0-P9 in one run: 11,890 → 10,798 → 12,336 → 14,446 → 13,058 → 12,336 → 12,889 → **15,563** → 12,961 → 13,154. The prompt is the system-prompt + accumulated profile context + current paragraph text. The profile portion grows by ~1-4K tokens per paragraph as back-propagations and connections accumulate.

**Token math:** 10 paragraphs × ~13K avg input = 130K input tokens = $0.39/essay on L3 input alone. Current system prompt is cached; the growing profile block is NOT. If the profile block had a cache-control break at a stable point (say, "everything except the most recent paragraph's back-props"), the ~8-10K stable portion would be 10× cheaper on paragraphs 2-10. **Estimated save: $0.07-0.10/essay.**

**Caveat:** the whole point of L3's sequential walk is that each call sees the MOST RECENT accumulated state. So cache-break positioning matters — you can't cache the full profile because it literally changes each call. But you CAN cache the essay text + system prompt + stable profile subsections (voiceIdentity stub, arcType early guess) that don't change between paragraphs.

### A3. L3.75 Phase A and Phase B run in parallel with near-identical user prompts

Both phases assemble the same `userPrompt` (priorVoice + aiRisk + corpus + essayText + understanding + evolutionScaffold). Measured size per phase: ~10K input tokens. Two calls × 10K = 20K input × $3/1M = $0.06 per essay. **If Phase A and Phase B shared a cached user prompt** (Anthropic doesn't expose user-prompt caching as a separate construct, but can be achieved by moving the shared assembly into the system prompt), save ~$0.03/essay.

Minor relative to L4 but cheap to fix.

### A4. Corpus retrieval block (treatment arm, 3,057 tokens) adds ~$0.01/essay for 0 citations

Documented in `OUTPUT_CUT_LIST.md`. Trivial cost, but the block is injected into BOTH the L3.75 `synthesize()` preamble AND the `synthesizeIteration()` preamble on iteration 0. If the block isn't producing measurable output influence, cutting it saves $0.01/essay treatment.

### A5. Context deadweight in individual prompts (reading the `profileRouter`)

The profile router's L3 walk rule marks **many** sections as `priority: 'always'` (search `priority: 'always'` in `profileRouter.ts` finds 30+ occurrences for that rule). That's why the router emits "Always-priority items (9-16K tokens) exceed budget (8K target)" on every L3 call.

Some of the "always" items that are probably not pulling their weight for the immediate paragraph:
- Full voice identity signature re-injected per paragraph when it changes only slowly
- All prior back-propagations when only the last 2-3 are structurally relevant
- Full connection graph when only connections adjacent to the current paragraph are needed

**Audit ask:** go through `assembleL3UnderstandingWalk` in `profileRouter.ts` and demote at least half of the `priority: 'always'` sections to `priority: 'connection_driven'`. The router would then drop them when over budget. **Estimated save: $0.10-0.20/essay on L3.**

---

## Part B — Output-side deadweight (what the model emits that doesn't earn)

Output-dominated layers: **L3.75 Phase A and Phase B, L2.5, L2, L3.5, L5**. Fix these by capping response tokens and trimming schema.

### B1. L3.75 Phase B emits 10K output tokens at the ceiling — about 25-35% is redundancy

Per the separate `OUTPUT_CUT_LIST.md`:
- `strengthSignatures[]` balloons to 21 entries when 8 distinct ones exist.
- `growthEdges[]` has 11 entries where 5-6 are genuine (the rest are strengths mislabeled or descriptions without fixes).
- `blindSpots[]` and `redFlags[]` overlap 50%.
- `threads[]` has near-duplicate dominant threads.

Measured: fixture 05 Phase B section sizes in bytes of JSON — `craftAssessment: 22,935` (38% of total Phase B output). If `strengthSignatures` alone drops from 21 → 8 entries with deduplication, that's roughly a 50% cut to craftAssessment, or ~11KB saved = **~2.7K output tokens × $15/1M = $0.04/essay**. With `growthEdges` + duplicate threads cut, **total output savings: $0.06-0.08/essay per Phase B call**.

With 1-2 Phase B calls per essay, net **$0.08-0.15/essay saved on Phase B output** without losing signal.

### B2. L3 walk output (2500-3000 tokens/paragraph) carries similar bloat

`priorSentenceUpdates` and `newConnections` arrays on each L3 walk call can grow unbounded. Fixture 05 log shows paragraphs with `0 back-props, 0 connections` but still hitting 2,500-3,600 output tokens — meaning sentence-level JSON is the bulk, and the model fills it with descriptive redundancy.

**Deadweight candidates in L3 walk output:**
- `sentenceCraftObservations` with 5-10 observations per sentence (common pattern). Many are restatements.
- `paragraphUnderstanding` redundantly summarizing what sentence-level analyses already captured.
- `holisticEvolution` delta fields emitted even when no shift happened ("no change from prior paragraph" emitted as prose).

**Estimated save:** 15-20% cut on L3 walk output with disciplined caps. 10 paragraphs × 2.5K output × 0.15 = 3.75K × $15/1M × 10 calls = **$0.04/essay per L3 walk**.

### B3. L5 per-paragraph output sometimes pads to 2000 cap

Fixture 05 L5 output: most paragraphs hit exactly 2,000 output tokens (the soft cap). This suggests model output is reaching the limit rather than finishing naturally — a sign there's room to either raise quality (by leaving slack) or tighten schema (by fewer mandatory fields). Current per-paragraph L5 cost: $0.05-0.06. With 10 paragraphs + cross-para call = **$0.55-0.65/essay on L5**.

If schema is trimmed so the model emits 1,500 instead of 2,000 tokens average, save 500 tokens × 11 calls × $15/1M = **$0.08/essay**.

### B4. L4b Crystallizer output is 4,618 tokens — audit what's in it

L4b produces the improvement manifest + coherence report + priorities. Output size: 4,618 tokens × $15/1M = $0.069 on this call's output. If the manifest lists 12 items (observed in fixture 05), and the Output Cut List recommends capping at the top 5-8 most impactful, we'd save ~$0.02-0.03.

### B5. L3.75 Phase A's `momentEarnednessMap.moments` array

Phase A emits the earnedness map with one entry per "moment" in the essay. On craft-phase essays this becomes a long list, often with moments that duplicate or sit at the same paragraph-sentence anchor. Potential reduction with discipline: ~$0.03/essay.

---

## Part C — Prompt caching: what's already saving, what isn't

`callClaudeWithRetry` supports `cacheSystemPrompt: true`, set on:
- L3 walk (sequentialDeepWalk.ts:666)
- L3.75 Phase A + B (holisticSynthesis.ts:1970, 1981, 2211, 2222)
- Other layers via similar opt-in

Anthropic pricing: cache **read** = $0.30/1M (10× cheaper), cache **write** = $3.75/1M (25% more than fresh input). Break-even: 2 reads of the same cached content pay for the write.

**What IS likely cached today** (system-prompt portions):
- SHARED_PREAMBLE + SYSTEM_PROMPT_PHASE_A template (~1,200 tokens)
- SYSTEM_PROMPT_PHASE_B template (~1,500 tokens)
- L3 walk SYSTEM_PROMPT (~2,000 tokens)
- L4 system prompts

Rough saving if cache hit on 10 L3 walks + 2 Phase calls + 1 Phase B call = 13 × 2,000 stable tokens = 26K tokens at 10% price vs fresh: **save ~$0.07/essay** already being realized (assumed — not verified in log).

**What's NOT cached but could be:**
- The massive ~36K user-prompt profile block in L4 (reused across L4a-NorthStar, L4a-ScoreMatrix, L4b)
- The essay text itself (reused across every single call — L1-L5)
- Stable L3.75 user prompt assembly between Phase A + Phase B

**Highest-leverage cache fix:** put the **essay text** + **L3.75 understanding context** into a cached system-prompt block at the top of L4's prompt. One write, three reads. Expected saving: **$0.15-0.25/essay** on L4 alone.

Caching the essay text across ALL layers (L3, L3.75, L4, L5) would save additional tokens — essay is 3-5K tokens, consumed by ~20 calls per pipeline, at 10% of fresh-input price: **save ~$0.05-0.15/essay**.

**Observability gap:** the current log emits `input + output = $X` per call but does NOT log `cache_read_input_tokens` or `cache_creation_input_tokens` even though the response carries them. We can't currently tell whether caching is effective. **Fix is 5 lines in `callClaudeWithRetry` callers** — make cost logs split into fresh-input / cache-read / cache-write / output. No API cost to implement.

---

## Part D — Redundant-run deadweight (calls that shouldn't fire)

### D1. L3.75 iteration 1 when Meta already reported converged

From the A/B log: only **1 of 11 runs** triggered iter_1. That's actually working — the convergence short-circuit fires correctly in 10/11 runs. But the 1 run that did iter_1 cost an extra $0.475. Audit whether its Meta output actually flagged non-convergence, or whether a bug let iter_1 fire despite convergence. Potential save: **$0.50 × ~10% of runs = $0.05/essay amortized**.

### D2. Reread on Meta-flagged disagreement (fires 73% of runs, $0.11 each)

This is a structural feature, not deadweight — the reread targets a specific paragraph where L3.75 detected walk/synthesis disagreement. But it's triggered by Meta's disagreement count ≥ threshold. Audit threshold tuning: is every "disagreement" worth a reread, or are borderline disagreements costing $0.11 for minor nits? **Potential save with tighter threshold: $0.05/essay.**

### D3. Delta synthesis on blocking contradictions (27% of runs, $0.13 avg)

Fires when L4 finds "blocking contradictions" and needs `admissions_positioning` or another section rewritten. Structural, probably earns keep — but worth auditing that "blocking contradiction" threshold isn't too aggressive.

### D4. Understanding prose synthesis ran and was silently failing (~$0.05-0.08/essay)

Fixed in the Phase B session (`response.text` → `response.content` bug). Pre-fix: the call fired on every growth iteration, paid $0.05-0.08, and threw "Unexpected response type: undefined". Post-fix: the call now produces useful output consumed by `EssayPortrait.tsx`. **Past waste eliminated. Going forward this call should show up in the cost ledger and be audited for whether `EssayPortrait.tsx` is the only consumer.**

---

## Part E — Estimated total savings from full audit

| Fix | Side | Est. saving per essay |
|---|---|---|
| Cache L4 shared profile (A1) | Input | $0.20-0.25 |
| Cache essay text across layers (C) | Input | $0.05-0.15 |
| Demote L3 walk "always" sections (A5) | Input | $0.10-0.20 |
| Cap L3.75 Phase B schema (OUTPUT_CUT_LIST + B1) | Output | $0.08-0.15 |
| L3 walk output discipline (B2) | Output | $0.04 |
| L5 schema trim (B3) | Output | $0.08 |
| L4b manifest cap (B4) | Output | $0.02-0.03 |
| Phase A earnedness map discipline (B5) | Output | $0.03 |
| Cut unused corpus block OR citation-labels (A4) | Input | $0.01 |
| Tighten reread threshold (D2) | Call-count | $0.05 |
| Total realistic estimate | | **$0.66-0.99/essay** |

**Current cost:** ~$3.60/essay. **Post-fix:** ~$2.60-2.95/essay. Roughly a **20-25% reduction** with no quality loss (and the output-cut changes actively improve quality by removing redundancy).

Notably — **none of these require downgrading to Haiku**. All are efficiency wins at the current Sonnet quality level.

---

## Part F — What's NOT deadweight (explicit keep-at-cost)

- **L3 walk per-paragraph Sonnet cost** — the core product. Each sequential call produces sentence-level understanding that all downstream layers consume. Can be marginally trimmed but not eliminated.
- **L3.75 Phase A + B parallel calls** — produces the holistic sections. Can be output-trimmed but not merged or skipped.
- **L4 crystallization** — produces the North Star + score matrix + priorities. Input-heavy but output is direct user value. Fix with caching, not elimination.
- **L5 per-paragraph feedback** — direct user-facing output. Fix with schema trim, not reduction in coverage.
- **Reread on Meta disagreement** — surgical, $0.11, produces real signal.
- **L4 delta synthesis on blocking contradictions** — surgical.

---

## Implementation priority

1. **Observability first (no cost impact):** add cache_read / cache_write / fresh_input split to per-call log lines. This takes 5-10 lines of code and unlocks us to *verify* every other change actually saves what we expected.
2. **L4 prompt caching restructure:** highest-ROI single change. 1 engineer-hour. Saves $0.20+/essay.
3. **OUTPUT_CUT_LIST prompt caps:** text-only change to Phase B system prompt. Saves $0.08-0.15/essay + dramatically improves output scannability.
4. **profileRouter always-priority demotion** for L3 walk: review + downgrade ~30 "always" sections to connection_driven. Saves $0.10-0.20/essay.
5. **Essay text in shared system-prompt cache block:** architectural, ~1 hour of work. Saves $0.05-0.15/essay.

Items 2-5 together land the full estimated $0.60-$0.90/essay savings.
