# Crochet Partial Calibration Report — 2026-05-03

**Status:** Pipeline aborted at L3.75 Phase B truncation. $0.5847 spent.
**Completed layers:** L1, AO First Read, L2, L2.5, L3 walk (5/5 paragraphs), L3.75 Phase A.
**Failed:** L3.75 Phase B (LLM hit 10K output cap before producing required `admissionsPositioning` + `entanglements` sections).
**Never ran (downstream of L3.75 Phase B):** L3.5 essay-level analysis, L4 northStar, Phase 5.55 essay-level emission service (Option 5 Phase B), Phase 5.6 aggregator + queue mints.

---

## What completed fully (calibration signal preserved)

### Cost model (empirical, per-stage)

| Stage | Calls | Cost | Notes |
|---|---|---|---|
| L1 first impressions | 5 (Haiku, parallel) | $0.0546 | P1, P3, P7 hit Haiku max-tokens 2000 — **L1 output bloat is real**, not Option 5-specific |
| AO First Read | 1 (Haiku) | $0.0022 | putDownRisk=low |
| L2 structural | 1 (Sonnet) | $0.0569 | arc=rags_to_riches; **31/89 LLM-hallucinated connection endpoints rejected** by ConnectionMutator |
| L2.5 scout | 1 (Haiku) | $0.0125 | 9 repeated elements, 0 tonal shifts, 0 structural echoes |
| L3 walk P0 (3 sent.) | 1 (Sonnet) | $0.0821 | 0 back-props, 0 connections, 0 findings, 0 evolutions |
| L3 walk P1 (10 sent.) | 1 (Sonnet) | $0.0947 | **TRUNCATION WARNING** — priorSentenceUpdates + newConnections both missing |
| L3 walk P2 (4 sent.) | 1 (Sonnet) | $0.0954 | 0 back-props, 0 connections, 0 findings, 0 evolutions |
| L3 walk P3 (6 sent.) | 1 (Sonnet) | $0.0988 | **TRUNCATION WARNING** — same fields missing |
| L3 walk P4 (3 sent.) | 1 (Sonnet) | $0.0875 | 0 back-props, 0 connections, 0 findings, 0 evolutions |
| L3 walk total | 5 paragraphs | **$0.4585** | 1 improvement candidate harvested across 5 paragraphs (very low) |
| L3.75 Phase A | 1 (Sonnet) | $0.1542 | 6886 output tokens, stopReason=end_turn (clean completion) |
| **TOTAL spent** | | **$0.5847** | |

### Cost model vs my projection

| Stage | Projected | Actual | Delta |
|---|---|---|---|
| L1 (5 paras) | $0.025 | $0.055 | **+120%** — Haiku output bloat on first impressions |
| L2 | $0.06 | $0.057 | match |
| L2.5 | $0.013 | $0.013 | match |
| L3 walk (5 paras) | $0.30-0.40 | $0.459 | +20% (lowered cap helped on sparse paragraphs; dense paragraphs still expensive) |
| L3.75 Phase A | $0.07 | $0.154 | **+120%** — Sonnet produced ~7K output |

### L3 walk depth signal (Option 5 architecture validation)

- **5/5 paragraphs completed walking.**
- **0 findings produced across 5 paragraphs.** The framework expects 1 finding per paragraph minimum (per the prompt's "FINDINGS (MANDATORY — EVERY PARAGRAPH PRODUCES FINDINGS)" section). Crochet is a polished essay but **0 findings is well below baseline**.
- **0 back-propagations** across the entire walk.
- **0 newConnections produced by the walk** (vs 89 produced by L2; per-paragraph walk found nothing additional).
- **1 improvement candidate harvested across 5 paragraphs.** The walk recognized one improvable moment.

### Truncation pattern (pre-existing fragility, not Option 5-induced)

| Trigger | Frequency |
|---|---|
| L3 walk on 6+ sentence paragraphs | 2/5 paragraphs (P1=10sent, P3=6sent) |
| L3 walk on ≤4 sentence paragraphs | 0/5 (sparse paragraphs fit) |
| L3.75 Phase B at 10K output cap | 1/1 (the abort point) |
| jsonrepair fired on every Sonnet call | 5/5 L3 + Phase A — every Sonnet output had malformed JSON |

### LLM contract drift (warrants investigation)

- ConnectionMutator rejected 31 of 89 connections from L2 (35% hallucination rate on sentence indices).
- jsonrepair fired on every Sonnet call (every L3 walk paragraph + L3.75 Phase A).
- **L3 walk produced 0 findings against a "MANDATORY: every paragraph produces findings" prompt instruction.** The LLM is silently dropping the contract.

---

## What we couldn't validate this run

| Target | Status |
|---|---|
| Option 5 Phase B emission output | **NEVER RAN** — pipeline aborted upstream |
| Working-move silence on Crochet's landing moves (taxidermist / Viet Cong / Agnes / patchwork-quilt) | **UNKNOWN** — Phase B never ran |
| Concept library population | **EMPTY** — Phase B never ran |
| framingSeed quality | **UNTESTABLE** — no emissions produced |
| L3 walk gapCandidates (the new lightweight Phase A proposal field) | **UNKNOWN** — produced 0 findings, may have produced 0 gapCandidates too |
| Aggregator queue mints | **UNKNOWN** — Phase 5.6 never reached |

---

## Issues identified (each is now a calibration deliverable)

### 1. L3.75 Phase B 10K output cap insufficient (BLOCKING)

Pre-existing fragility (documented in code comment line 105-112). Crochet's Phase B exceeds 10K because P3 alone carries Vietnam War + grandmother portrait + crochet origin. Fix: raise to **14000 max_tokens**. Adds ~$0.05 per call. **Must land before next full-pipeline calibration.**

### 2. L1 first-impressions output bloat (HIGH cost impact, MEDIUM scope)

Haiku P1, P3, P7 each hit 2000 output tokens (max). Each L1 call should produce a compact ParagraphFirstImpression — apparentPurpose, emotionalRegister, voiceObservation, craftNotices, notablePhrases. Producing 2000 tokens means the LLM is over-elaborating. Audit the L1 prompt for opportunity to instruct briefer output. Estimated savings: **~$0.03 per essay.**

### 3. L3.75 Phase A output bloat (HIGH cost impact)

Phase A produced 6886 output tokens — nearly the 8K cap. Phase A schema has 4 sections (voiceIdentity, voiceMap, emotionalTopography, momentEarnednessMap). 6886 tokens for 4 sections = ~1700 tokens per section. The schema demands rich nested output. Audit for compression opportunities. Estimated savings: **~$0.05 per essay.**

### 4. L2 connection hallucination rate (35%) (MEDIUM)

ConnectionMutator rejected 31/89 connections due to invalid sentence indices. The LLM is making up sentence numbers. This is wasted output cost (LLM produced 31 fake connections that the system threw away) AND a quality concern (the surviving 58 may have had similar drift just within valid bounds). Investigate L2 prompt clarity on sentence indexing. Estimated savings: **~$0.02 per essay** if the prompt produces fewer hallucinations.

### 5. L3 walk producing 0 findings (CRITICAL — depth concern)

The walk's MANDATORY findings instruction is being ignored. Crochet has at least 5-10 plausible findings (compressed-biography sentence, magical-instrument personification on the steel hook, Agnes elephant specificity, mother-daughter network, etc) — the framework recognizes them in the corpus review (`14-clara-crochet-review-v2.md`). The walk produced none. **This is the calibration's most important finding.** Either the walk's reading is shallow or the prompt's findings instruction is unclear after recent edits. Need diagnostic walk on a single paragraph with explicit findings expectation.

### 6. L3 walk truncation on dense paragraphs (MEDIUM)

P1 (10 sentences) and P3 (6 sentences) hit truncation despite the 4000 cap. priorSentenceUpdates + newConnections silently dropped. The dynamic formula `min(4000, max(1800, sentenceCount*200 + 1500))` gives P1: `min(4000, max(1800, 3500))` = 3500. P1 used 3500. Need either (a) raise cap further on dense paragraphs, OR (b) split the walk into per-sentence sub-calls for dense paragraphs.

### 7. JSON malformation across all Sonnet calls (LOW — handled by jsonrepair but signals prompt drift)

jsonrepair fired on every Sonnet call. The LLM is producing slightly invalid JSON consistently. Worth investigating whether the schema description is too long or has competing instructions. Not blocking — jsonrepair handles it.

### 8. Option 5 Phase B never validated (CRITICAL — calibration goal)

Original calibration goal completely deferred due to upstream abort. Need to either run isolated Phase B harness OR fix #1 above and re-run full pipeline.

---

## Calibration plan (preserves signal, doesn't waste $0.58)

### Phase 1 — Fix the upstream blockers (zero API cost)

- **Fix #1:** Raise SYNTHESIS_MAX_TOKENS_PHASE_B from 10000 → 14000 in `holisticSynthesis.ts:114`. One-line change.
- **Fix #6:** Raise WALK_MAX_TOKENS_CAP from 4000 → 5000 in `sequentialDeepWalk.ts:106`. Restores headroom for dense paragraphs.
- **Verify** tsc + vitest stay green.

### Phase 2 — Build isolated Phase B harness (~$0.20-0.30)

Construct synthetic profile from Crochet's actual content (manually-stubbed findings, weaknesses, growthEdges based on the corpus review's verdict). Feed directly to `runEssayLevelEmissionPass`. Validates:
- Working-move silence (4 known landing moves should produce 0 emissions)
- framingSeed register on any emissions produced
- conceptTag prose form
- expectedDiscovery content-specificity
- 3-cap enforcement

### Phase 3 — Re-run full pipeline on Crochet after Phase 1 fixes (~$1.20-1.30)

Once Phase 1 fixes land + Phase 2 validates Phase B logic, re-run full Crochet pipeline. Cost over $1 cap by ~$0.30 but the prior $0.58 isn't wasted — it informed Phase 1 fixes that lower the abort risk to zero.

### Phase 4 — Address remaining quality concerns (deferrable)

- **#5 L3 walk findings = 0** — diagnostic walk on single Crochet paragraph with explicit expectations.
- **#2 L1 bloat** — prompt audit (zero API cost).
- **#3 L3.75 Phase A bloat** — prompt audit (zero API cost).
- **#4 L2 hallucination rate** — prompt audit (zero API cost).

---

## Bottom line

**$0.58 was not wasted — it produced:**
1. Empirical cost model (calibrated my projections, surfaced where bloat lives)
2. Truncation pattern map (which paragraphs trigger which caps)
3. Pre-existing fragility documentation (L3.75 Phase B max-tokens, L1 output bloat, L2 hallucination rate, L3 walk findings drift)
4. **A clear blocker stack** — 8 specific issues with file:line locations, severity tags, and fixes

**Next deliverable: Phase 1 fixes (zero API cost) → Phase 2 isolated Phase B test (~$0.30). After that, full pipeline re-run is meaningfully more reliable.**
