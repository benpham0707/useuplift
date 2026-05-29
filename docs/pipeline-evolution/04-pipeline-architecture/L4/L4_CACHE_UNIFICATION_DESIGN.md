# L4 Cache Unification (C7 fix) — Design

> **Status**: code complete on `fix/warm-edit-completedalllayers`, behind `L4_UNIFIED_CACHE=true` (default off). Awaiting verification spend.
>
> **Phase**: Phase 3 of UNIFIED_PLAN_HOLD_2026_05_10. Target save: **$1.54 → ~$1.42** (~$0.10–0.16 per essay, zero quality risk).
>
> **Owns**: kill the C2 cache-defeat (`crystallizer.ts:1789-1798`) at its root without collapsing the 3 focused L4 calls. Each call keeps its own output budget, mid-call calibration, failure isolation. Calls 2 and 3 hit cache on the shared prefix instead of re-paying ~20K tokens of identical content.
>
> **Doesn't own**: any change to prompt content, call ordering, output schema, or downstream consumers.

---

## Why this instead of the composite

We started this phase with a composite call (`COMPOSITE_CALL_DESIGN.md`, code dormant behind `L4_COMPOSITE_CALL`). Tue pushed back: collapsing 3 → 1 risks quality drops in three places — mid-call calibration loss, attention dilution across sections, and weakening of the W3.3 anti-clustering protocol (which requires the model to do forced ranking *before* scoring).

The composite saves more dollars (~$0.22 vs ~$0.15) but at non-zero quality risk. The unified-cache approach attacks the **actual** root cause from the C2 rollback comment:

> *"Anthropic's cache key includes the entire prefix (system + tools + messages) up to the breakpoint, so different system prompts = different cache keys = no cross-call hit."*

The original commit `f249acb` rolled back `cacheSystemPrompt: true` because three different system prompts made the cache_create tax pure dead weight. The proper fix — *"unify system prompts or use system-block cache breakpoints — see C7 follow-up"* — was anticipated but never built. This is C7.

## Architecture

```
                       SAME SYSTEM PROMPT (cached after call 1)
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
       Call 1: Mode A           Call 2: Mode B           Call 3: Mode C
       (North Star)             (Score Matrix)           (Consolidation)
            │                        │                        │
   ┌────────┴────────┐      ┌────────┴────────┐      ┌────────┴────────┐
   │ Block 1 [cache] │      │ Block 1 [cache] │      │ Block 1 [cache] │
   │ profileContext  │ ◄─── │ same bytes      │ ◄─── │ same bytes      │
   │ + corpus        │      │ → cache_read    │      │ → cache_read    │
   │ + essay facts   │      │                 │      │                 │
   │ + entanglement  │      │                 │      │                 │
   │ + connection IDs│      │                 │      │                 │
   │ (~10-15K tok)   │      │                 │      │                 │
   ├─────────────────┤      ├─────────────────┤      ├─────────────────┤
   │ Block 2 (no $$) │      │ Block 2 (no $$) │      │ Block 2 (no $$) │
   │ MODE: A         │      │ MODE: B         │      │ MODE: C         │
   │ + NS reminders  │      │ + NS JSON       │      │ + NS+SM JSON    │
   │   (~0.5K tok)   │      │ + L3.5 anchors  │      │ + candidates    │
   │                 │      │   (~2K tok)     │      │ + score summary │
   │                 │      │                 │      │   (~6K tok)     │
   └─────────────────┘      └─────────────────┘      └─────────────────┘
```

### What stays the same (every line of it)

- **3 separate Sonnet calls** in sequence. Same call ordering as today.
- **Same output budgets** per call: NS 3500, SM 3500, L4b 6000 tokens.
- **Same prompt content** — every rule from the focused prompts is preserved verbatim inside its mode section. W3.3 anti-clustering, scoring anchors block, consolidate-don't-invent, signature-move preservation, coherence investigation a-e, all 5 coachingMap sections.
- **Same mid-call calibration**: Mode B receives the NorthStar JSON from Mode A; Mode C receives both NS + SM JSON from prior calls.
- **Same failure isolation**: Mode A parse failure → throw; Mode C parse failure → `PipelineError.l4bConsolidationFailed`.
- **Same downstream consumers**. `L4CrystallizationResult` shape is unchanged. `analysisOrchestrator.ts:980` reads the same fields.

### What's new

1. **`buildSystemPromptL4Unified(scale, essayType?)`** — one system prompt covering all 3 modes. Mode selector lives in the user prompt's first line ("MODE: A | B | C"). The prompt is byte-identical across the 3 calls within one L4 run, which makes the Anthropic prefix cache fire on calls 2 and 3.
2. **`buildL4UnifiedSharedPrefix(...)`** — the stable user-prompt prefix block. Contains profileContext + corpus + essay facts + entanglement IDs + connection IDs. Identical across all 3 calls, placed in a `userPromptBlocks` block with `cacheBreakpoint: true`.
3. **`buildL4UnifiedTailModeA/B/C(...)`** — three small per-mode tails carrying only the per-call dynamic content. These go into a second `userPromptBlocks` block (no cache breakpoint — they vary per call, by design).
4. **Compact JSON serialization** of NS (passed into Mode B) and NS+SM (passed into Mode C). Switching from `JSON.stringify(x, null, 2)` to `JSON.stringify(x)` saves ~25% on those serialized tokens at zero quality cost — Sonnet parses both equally well.
5. **`cacheSystemPrompt: true`** is re-enabled on all 3 calls (now safe because the system prompt is identical across calls).

### Feature flag

`process.env.L4_UNIFIED_CACHE === 'true'` → unified-cache path. Default off → today's 3-call path. The dormant composite path (`L4_COMPOSITE_CALL`) stays in place but unified takes precedence when both are set. One-line rollback by leaving the flag unset.

## Expected savings

Conservative arithmetic against the Crochet baseline (`L4 | $0.5724 | 115676 input | 8625 output`):

| Shared content | Tokens (per call) | Today | Unified (1× create + 2× read) | Save |
|---|---|---|---|---|
| System prompt (unified) | ~6K | 3× fresh ($0.054) | $0.0225 + $0.0036 | **~$0.028** |
| Profile context | ~8K | 3× fresh ($0.072) | $0.030 + $0.0048 | **~$0.037** |
| Corpus block | ~2K | 3× fresh ($0.018) | $0.0075 + $0.0012 | **~$0.009** |
| Entanglement+connection IDs | ~0.5K | 3× fresh ($0.0045) | $0.0019 + $0.0003 | **~$0.002** |
| Compact NS/SM in Modes B/C | ~2K (calls 2+3) | $0.012 fresh | $0.009 compact | **~$0.003** |
| Eliminated wasted cache_create from C2 historical state | — | up to $0.08 stranded | $0 | **~$0.05–$0.08** |
| **Total expected save** | | | | **~$0.13–$0.16** |

Cold-start cost ladder: $1.54 (post-Phase 1) → ~$1.40 (post-Phase 3 unified). Phase 7 (L3.75 retirement) remains the larger downstream save (~$0.35).

## Verification proposal

Same Crochet single-run pattern, **same $1.50 cap**.

**Command**:
```bash
L4_UNIFIED_CACHE=true ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  npx tsx tests/dump-full-profile.ts --essay 14-harvard-2028-crochet.txt
```

**Artifacts produced**:
- `tests/output/full-profile-14-harvard-2028-crochet.md` (analytical dump)
- `tests/output/full-profile-14-harvard-2028-crochet.json` (profile JSON)
- `tests/output/full-profile-14-harvard-2028-crochet-student.md` + `.json` (Phase 2 wire)

**Pass criteria** (because we keep the 3 focused calls, parity should match within natural model variance):

1. **Cost**: total L4 row ≤ $0.45 (was $0.572). Tolerance ±$0.05.
2. **Cache reads fire**: telemetry shows non-zero `cache_read_input_tokens` on Mode B and Mode C — this is the proof the C7 fix worked. (Phase 1 A1 cost-ledger split already in place catches this.)
3. **Structural parity** with existing Crochet baseline: NS roles count, SM paragraph count, crossParagraphPatterns count, coachingMap section coverage, contradictions count all within ±20% of the baseline.
4. **No regression in dump-lint findings**.
5. **`detectScoreClustering` does not fire** more than baseline.

**Fallback** if any criterion fails: halt, no further spend, iterate the prompts offline against the persisted output.

## Why this preserves quality

Every quality concern raised about the composite is mooted here:

| Composite concern | Composite | Unified-cache |
|---|---|---|
| Mid-call calibration (model commits to NS before scoring) | At risk — one reasoning pass | Same as today — NS is committed in call 1, serialized into call 2 |
| Attention dilution across sections | At risk — one prompt does 3 jobs | Same as today — each call has one job |
| Anti-clustering enforced (forced ranking before scoring) | At risk — could score in JSON-output order | Same as today — call 2 dedicated to scoring |
| Verdict / transformativeInsight depth | At risk — shared output budget | Same as today — each call has its own budget |
| Failure isolation | At risk — one failure kills all 3 sections | Same as today — Mode A failure stops before Mode B/C spend |

The unified path is **functionally equivalent** to today for the model — same prompt content per call, same context, same output budget. The only changes are operational: shared system prompt bytes (cache key match), shared user-prompt prefix block (cache_read instead of fresh), compact serialization (smaller token bills).

## Risks

- **Cache misses if the prefix changes between calls within a run.** The shared prefix is a pure function of (profile, scale, profileContext, corpusPrepend) — none of those mutate during the L4 run, so this risk is structural and tested (see `tests/unit/l4-unified-cache.test.ts § Cache-structure invariants`).
- **5-minute TTL.** Anthropic's default prompt cache expires after 5 minutes. If calls 1 → 3 span more than 5 minutes (rare for L4, where the whole layer typically runs in <90 seconds total), calls 2/3 miss cache. No correctness impact; just lost savings on slow runs. Could move to extended cache (1 hour TTL) later if needed.
- **Compact JSON in Mode B/C tails.** Sonnet handles compact JSON fine in our experience, but if a future model regresses on compact parsing we'd see it as either truncation or hallucinated field names. Phase 6 verification regen catches this.

## Rollback plan

One-line revert: leave `L4_UNIFIED_CACHE` unset. The 3-call path stays intact, untouched, fully tested by today's suite. The dormant composite path (`L4_COMPOSITE_CALL`) remains available as a separate fallback if we later want to revisit collapse.
