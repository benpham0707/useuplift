# L4 Composite Call — Design (SUPERSEDED 2026-05-20 by L4_CACHE_UNIFICATION_DESIGN.md)

> ⚠️ **SUPERSEDED 2026-05-20** — the production Phase 3 path is the unified-cache approach (`L4_CACHE_UNIFICATION_DESIGN.md`), not the composite collapse described here. The composite saves more $ (~$0.22 vs ~$0.15) but at non-zero quality risk: mid-call calibration loss, attention dilution, and weakening of the W3.3 anti-clustering protocol's forced-ranking step. Tue's call: quality risk outweighs the extra $0.07.
>
> The composite code stays in `crystallizer.ts` behind `L4_COMPOSITE_CALL=true` (default off) as a dormant fallback — useful if Phase 7's parity gate or a later quality bet flushes out a different architecture that wants this primitive.
>
> The rest of this document is preserved as the original design + verification plan for the composite. Do not build against it without first re-reading the unified-cache design and confirming with Tue that the quality risk is acceptable.

---

# L4 Composite Call — Design (original)

> **Status**: design under review. NO LLM spend yet. Implementation lands behind a feature flag (`L4_COMPOSITE_CALL=true`) — default off. Verification spend gated on Tue approval per cost-budget memory.
>
> **Phase**: Phase 3 of UNIFIED_PLAN_HOLD_2026_05_10. Target save: **$1.54 → ~$1.32** (~$0.22 per essay).
>
> **Owns**: collapse `crystallizer.ts` 3 sequential Sonnet calls (L4a-NorthStar + L4a-ScoreMatrix + L4b) into one composite call. Resolve the C2 cache-defeat documented at `crystallizer.ts:1789-1798` by eliminating cross-call cache attempts entirely (one call = one cache opportunity, not three competing prefixes).
>
> **Doesn't own**: L4 prompt content quality, L4b candidate consolidation logic, L4 schema. Those stay verbatim.

---

## What's broken today

```
3 sequential Sonnet calls inside crystallizer.crystallize():

  Call 1 (L4a-NorthStar):    systemPrompt_A + profileContext + corpus + instruction_A → northStar
                                                ↓
  Call 2 (L4a-ScoreMatrix):  systemPrompt_B + profileContext + corpus + instruction_B(northStar) → scoreMatrix
                                                ↓
  Call 3 (L4b):              systemPrompt_C + profileContext + corpus + instruction_C(northStar, scoreMatrix, candidates) → priorities + coachingMap + coherenceReport
```

Two independent costs being paid:

1. **`profileContext` re-billed 3×.** ~6K input tokens × 3 = ~18K input tokens duplicated. At Sonnet input $3/MTok that's roughly $0.18 of pure duplication paid every essay.
2. **C2 cache-defeat.** The `cacheSystemPrompt: true` flag was added thinking it would amortize, then ROLLED BACK on 2026-05-04 (commit `f249acb`) after C6 calibration showed L4 cost went *up* $0.549 → $0.625. Reason: Anthropic's cache key is the *full prefix* including the system prompt; three different system prompts = three never-matching cache slots = three cache-create taxes with zero reads.

Crochet baseline (`tests/output/full-profile-14-harvard-2028-crochet.md`):

| Sub-call | Cost | Input | Output |
|---|---|---|---|
| L4a-NorthStar | ~$0.16 | ~38K | ~2.5K |
| L4a-ScoreMatrix | ~$0.18 | ~39K | ~2.7K |
| L4b | ~$0.23 | ~38K | ~3.4K |
| **Total** | **$0.572** | **~115K** | **~8.6K** |

(Numbers approximated from the ledger row `L4 | $0.5724 | 115676 | 8625` — exact split across sub-calls lands in the verification ledger row split per A1.)

## What the composite changes

```
1 Sonnet call:

  systemPrompt_composite + profileContext + corpus + instruction_composite(priorNorthStar, candidates) → northStar + scoreMatrix + priorities + coachingMap + coherenceReport
```

Single profile-context bill. Single system prompt. Single output. Sequential dependency that was previously enforced by call ordering is now enforced inside the model's reasoning — the prompt asks for NorthStar first, then ScoreMatrix derived from it, then L4b derived from both.

Expected per-essay arithmetic:

| | Today | Composite (projected) | Delta |
|---|---|---|---|
| Input tokens | ~115K | ~40K (1 copy of profile + corpus) | −65K |
| Output tokens | ~8.6K | ~8.6K (same content) | 0 |
| Input $ @ $3/MTok | ~$0.345 | ~$0.120 | −$0.225 |
| Output $ @ $15/MTok | ~$0.129 | ~$0.129 | 0 |
| **L4 total** | **~$0.572** | **~$0.350** | **−$0.222** |

Cold-start cost ladder: $1.54 (post-Phase 1) → ~$1.32 (post-Phase 3).

## Schema

The composite output schema is **exactly the union** of today's three raw output shapes — `RawCrystallizationOutput` already exists at `crystallizer.ts:980`:

```ts
interface RawCrystallizationOutput {
  northStar:     { activeScale, throughLineMap, structuralRolesMap, trajectory,
                   distinctivenessSignature, intentBridge, confidence, lastUpdatedBy, evolution? };
  scoreMatrix:   { paragraphs: unknown[], crossParagraphPatterns: string[],
                   prioritizedImprovements: unknown[], coachingMap?: unknown };
  coherenceReport: { contradictions: unknown[], isCoherent: boolean };
}
```

No new types. No new builders. `buildNorthStar`, `buildScoreMatrix`, `buildCoachingMap`, `buildCoherenceReport`, `parsePrioritizedImprovements` are all reused as-is on the composite output.

## Prompt strategy

### System prompt — single composite

Today's three system prompts total ~1100 lines. A naive concat would explode the prompt budget and dilute LLM attention. The composite system prompt is **written fresh** as a single tighter document that covers:

1. **Role framing** (1 paragraph) — "You are the Crystallizer. You produce the structural core (North Star + Score Matrix) and the consolidation layer (priorities + coaching map + coherence report) in ONE structured response."
2. **Output ordering protocol** (the dependency chain made explicit):
   - First populate `northStar.structuralRolesMap` (anchor for everything downstream).
   - Then populate `scoreMatrix.paragraphs[].scores` using the structural roles as calibration.
   - Then populate `scoreMatrix.coachingMap.priorities` consolidating from `consolidatedFrom: [candidate IDs]`.
   - Then populate `coherenceReport.contradictions` cross-checking the prior three sections.
3. **Per-section contracts** — each of the existing system prompts trimmed to its load-bearing content:
   - NorthStar: throughLineMap, structuralRolesMap, trajectory, distinctivenessSignature, intentBridge, confidence (per `ACTIVE_DIMENSIONS[scale]`).
   - ScoreMatrix: 5-dim scoring + anti-clustering protocol + verdict + crossParagraphPatterns.
   - L4b: prioritizedImprovements with `consolidatedFrom` discipline, coachingMap 5 sections, coherenceReport investigation protocol.
4. **Anti-shortcut clause** (new) — "Producing this in one response is not permission to short any section. Each section's contract is the same as if it ran as a focused call."
5. **Output format JSON skeleton** — single object containing all three sub-objects.

Target size: ~500 lines. Phase 1 instruction-quality is preserved; verbose examples may be trimmed where the contract is clear without them.

### User prompt — single payload, future cache breakpoint

```
[Block 1 — possible cache breakpoint]
=== ESSAY TEXT ===
{essayText}

=== PROFILE SECTIONS (L1 → L3.75 → L3.5) ===
{assembledContext serialized}

{corpusPrepend if any}

[Block 2 — instruction tail]
{composite call instruction — includes candidate context block from L4b}
```

Phase 3 itself doesn't add the cache breakpoint — single call means cache doesn't pay off yet. Block 1 is structured to *be* a stable prefix so L5 can later be modified to share it (Phase 5 / Phase 8 consideration; out of scope here).

## Cache-control posture

- `cacheSystemPrompt: true` is **set** on the composite call. With one call there's no cross-call mismatch; the cache_create cost is incurred once and the next iteration (re-analysis run on the same essay) reads it back if it lands inside the 5-minute TTL.
- No `userPromptBlocks` cache breakpoints in Phase 3. Single call doesn't need them; adding them just increases prompt-construction complexity for zero gain.

## Failure modes and the handling that doesn't degrade

The 3-call path is fail-fast since Phase 6a: L4a parse failure → exception; L4b parse failure → `PipelineError.l4bConsolidationFailed`. The composite preserves this discipline:

| Failure | Composite path response |
|---|---|
| Total parse failure (no JSON, malformed) | Throw — same surface as today's L4a parse failure. No retry, no degraded result. |
| `northStar` field missing/invalid | Throw — same surface as today's L4a parse failure. |
| `scoreMatrix.paragraphs` field missing/invalid | Throw — same surface as today's L4a parse failure. |
| `scoreMatrix.coachingMap` field missing | Throw `PipelineError.l4bConsolidationFailed` — same surface as today's L4b. |
| `coherenceReport` field missing (LLM truncated at max_tokens) | Log warning + default `{ contradictions: [], isCoherent: true }` — same as today's L4b truncation path at `crystallizer.ts:1957-1962`. |
| `prioritizedImprovements` field missing | Empty array — same as today. |
| Output exceeds `maxTokens` (truncation mid-JSON) | Detect via `stopReason === 'max_tokens'`; log; attempt `jsonrepair`; fall back to truncation-tolerant parsing. |

The composite's max-output budget is `L4A_NORTH_STAR_MAX_TOKENS + L4A_SCORE_MATRIX_MAX_TOKENS + L4B_MAX_OUTPUT_TOKENS = 3500 + 3500 + 6000 = 13000` tokens. Sonnet's hard ceiling is 64K, so 13K is safe with headroom.

## What this doesn't change

- **No prompt-content rewrites.** The instructions inside the composite are the same instructions today's three prompts give, in shorter form.
- **No schema migrations.** `buildNorthStar`, `buildScoreMatrix`, `buildCoachingMap`, `buildCoherenceReport`, `parsePrioritizedImprovements` are reused verbatim.
- **No consumer changes.** `L4CrystallizationResult` shape is unchanged. `analysisOrchestrator.ts:980` reads the same fields.
- **No `analysisMode` field changes** (Phase 1 already dropped it).
- **No telemetry changes** beyond the ledger row reflecting one row instead of three. The A1 cost-ledger split (commits `6465935`) handles this naturally — `subcall: 'L4_composite'` instead of `L4a-NorthStar` / `L4a-ScoreMatrix` / `L4b`.

## Feature flag

`process.env.L4_COMPOSITE_CALL === 'true'` → composite path. Default off → today's 3-call path. Both paths are present in `crystallize()` and selected by a single `if` at the top of the method.

The flag is **production-removable** once Phase 6 verification proves parity. Rollback is a one-line revert to `false`. No type or schema work to undo.

## Files modified

| File | Change |
|---|---|
| `src/services/essayIntelligence/analysis/crystallizer.ts` | Add `buildSystemPromptL4Composite`, `buildCallInstructionL4Composite`, and a branch inside `crystallize()` selecting composite when the flag is set. Add `RawL4CompositeOutput` (identical to `RawCrystallizationOutput`). ~250 net new lines; no deletions in Phase 3. |
| `docs/pipeline-evolution/04-pipeline-architecture/L4/COMPOSITE_CALL_DESIGN.md` | This file. |
| `tests/unit/l4-composite-parsing.test.ts` | New. Validates the composite output → builder pipeline against synthetic raw outputs. No LLM calls. |

## Validation path

### Pre-spend (zero cost, fully complete before any verification run):

- [ ] tsc clean.
- [ ] Unit test: feed a synthetic `RawCrystallizationOutput` JSON into `buildNorthStar` + `buildScoreMatrix` + `buildCoachingMap` + `buildCoherenceReport` from the composite branch and confirm `L4CrystallizationResult` shape equivalence with the 3-call path.
- [ ] Unit test: feed a truncated composite output (coherenceReport cut) and confirm graceful default + warning.
- [ ] Unit test: feed a malformed composite output (missing scoreMatrix) and confirm fail-fast.
- [ ] Vitest suite passes 100% (688/5 baseline + new tests).
- [ ] Review composite system prompt + instruction with Tue. Output sample format from the prompt's JSON skeleton confirmed to match expected dump shape.

### Single verification run (Tue approval required):

**Fixture**: `14-harvard-2028-crochet.txt` (491 words — already the canonical baseline; matches the $0.572 L4 cost in `full-profile-14-harvard-2028-crochet.md`).

**Command**:
```
L4_COMPOSITE_CALL=true ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  npx tsx tests/dump-full-profile.ts --essay 14-harvard-2028-crochet.txt
```

**Expected cost**: ~$1.32 cold-start (Crochet $1.69 baseline − $0.22 composite saving − ~$0.15 already saved by post-Phase-1 cuts already in this branch). **Cap proposal: $1.50** — if the run exceeds it, halt and re-design.

**Pass criteria** (all must hold):

1. **Cost** — composite L4 row ≤ $0.40 (compared to 3-call $0.572). Tolerance: ±$0.05.
2. **Schema parity** — `full-profile-14-harvard-2028-crochet.md` and the persisted JSON sidecar contain:
   - `northStar.structuralRolesMap.length` ≥ 3 (Crochet baseline: 5 roles).
   - `scoreMatrix.paragraphs.length === paragraphCount` (Crochet: 7).
   - `scoreMatrix.crossParagraphPatterns.length` in [1, 3].
   - `scoreMatrix.coachingMap.priorities.length` in [3, 7] (lock target).
   - `scoreMatrix.coachingMap.priorities[*].consolidatedFrom` non-empty on every priority.
   - `coherenceReport.contradictions[*].severity` populated; `isCoherent` reflects severity.
3. **Anti-clustering survival** — `detectScoreClustering` does not fire on the composite output (or fires no more than on the 3-call baseline). Per the W3.3 protocol embedded in the system prompt.
4. **Dump lint clean** — `lintDump()` findings ≤ Crochet baseline findings.
5. **Render parity** — `full-profile-14-harvard-2028-crochet-student.md` (Phase 2 wire) is structurally identical section-for-section to a hand-rendered version of the 3-call baseline.

**Fallback**: if any pass criterion fails, the verification halts at the criterion; the composite branch stays behind the flag; we iterate the prompt offline (no further spend until the next approval).

### Out of scope for Phase 3 verification

- No quality A/B against the 3-call baseline beyond the structural parity above. The cost-budget memory explicitly forbids re-running 3-call to compare side-by-side ("no A/B against v1").
- No Three-Days-Before-a-Plane regression check. If Crochet passes, the composite ships behind-flag; if a downstream regression surfaces later, that's a Phase 8 quality bet, not a Phase 3 blocker.

## Open questions before verification

1. **Composite system prompt sizing.** Is ~500 lines the right target, or should we aim tighter (~350)? The current 1100-line surface area is partly redundancy that disappears in the composite. Tue's call — preference for verbose-but-thorough or terse-but-tight?
2. **`requiresStudentAwareness` on `transformativeInsight`.** Today this is set per-essay by L4b's reasoning. In the composite, is the model still self-aware enough to set this honestly when it's also producing the priorities that depend on the insight? (Empirical question; verification answers it.)
3. **Re-crystallization path.** When `priorNorthStar` is set (iteration N≥2 re-runs), the composite must still pass it as input. Implementation note for the prompt: re-crystallization with a prior NS is the same shape; the model just gets the prior as additional context.

---

## Rollback plan

One-line revert: set the flag default to `false` (it already is). The 3-call path stays intact, untouched, fully tested by today's suite. Phase 7 retires holisticSynthesis.ts independently of Phase 3 — these don't share a critical path.
