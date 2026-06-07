# Essay Intelligence — Cost & Output Cut Implementation Prompt

> Hand this document to the implementation agent/swarm. It is the **only** authorization needed to begin work. Everything the agent must know — mission, constraints, verification protocol, stop-gates, deliverables — is here.

---

## 0. Mission

Enact the cuts identified in two sibling audits:

1. `docs/analysis/COST_DEADWEIGHT_AUDIT.md` — input/output cost deadweight, per-call ratios, caching gaps.
2. `docs/analysis/OUTPUT_CUT_LIST.md` — field-level redundancy and diagnostic-for-own-sake cuts in L3.75 Phase B output schema.

**Target:** reduce per-essay cost by **$0.66–$0.99** (20–25% of current ~$3.60) with **zero quality regression** and measurable improvement in output scannability.

**Non-goal:** do not downgrade any Sonnet call to Haiku. All wins are efficiency wins at the current quality tier. If you find yourself tempted to swap models, stop and flag to Tue.

---

## 1. Non-negotiable constraints

Read these before reading anything else. A violation here invalidates the work regardless of what else ships.

### 1.1 NO GUESSING (CLAUDE.md §1a)

- Do not claim a fix works without running the same cost-ledger gate that would have caught it failing.
- Do not claim a cache is hit without inspecting `cache_read_input_tokens` in the response payload.
- Do not claim a field was cut without diffing the post-change fixture output against the pre-change fixture output.
- Commit messages may not contain "should," "probably," or "I think." If you aren't certain, keep investigating.

### 1.2 COST BUDGET ($5 hard cap per run, per memory `feedback_cost_budget.md`)

- Every full-pipeline A/B run on the calibration set costs ~$35–45. **You may NOT run the full set without Tue's per-run approval.**
- Default to **single-fixture runs** (fixture 05 `harvard-2028-i-too-can-dance`) for iteration. Cost per run ≈ $3.60 pre-cut, targeting ~$2.70 post-cut.
- No "tangent" dumps, pre-smokes, or exploratory runs without separate approval. If you think you need one, stop and ask.
- Log projected cost before every run: `printf "estimated cost: $X.XX (reason: ...)"` and get a human ack if > $5.

### 1.3 NO DEGRADED FALLBACKS (CLAUDE.md §2)

If a cache restructure breaks, the call must return a clear error. You may NOT add a "non-cached path fallback" that silently reverts. The goal is reliability at the new shape, not dual paths.

### 1.4 BRANCH & PR DISCIPLINE (`docs/GIT_WORKFLOW.md`)

- Branch from `main`: `perf/cost-cut-wave-1`.
- One atomic commit per logical change (not one commit per phase).
- Each commit title states the measured saving: e.g. `perf(l3.75): cap Phase B list fields — ~$0.08/essay output`.
- PR description carries the before/after cost ledger diff and the fixture-05 JSON diff summary.

### 1.5 DO NOT TOUCH (out of scope)

- Any model ID. All calls stay on current Sonnet / Haiku.
- L3 walk algorithm itself (sentence-level understanding, back-prop logic, connection scout integration). Cache restructure only.
- L4 crystallizer output schema (we cut inputs, not outputs, for L4).
- Focused/incremental re-analysis mode (`focusedAnalyzer.ts`). Separate audit.
- Conversator / chat integration. Separate track.
- Tests in `tests/unit/*`. Infrastructure tests only — no schema changes that break them.

---

## 2. Prerequisite (zero cost, must ship first)

### Phase 0: Observability

**Before any cut is attempted**, land a per-call cost-ledger enhancement that makes every other phase verifiable.

**Files:**
- `src/lib/llm/claude.ts` — the per-call cost log emitter.
- `src/services/essayIntelligence/analysis/*.ts` — all call sites that log cost.

**Change:** every call log must emit four numbers, not two:
- `fresh_input_tokens` (uncached input)
- `cache_read_tokens` (10× cheaper)
- `cache_create_tokens` (25% more expensive than fresh)
- `output_tokens`

And their dollar equivalents. Cache-hit rate is `cache_read / (cache_read + fresh_input + cache_create)`.

**Schema for the log line** (JSON, one per call, appended to run log):

```json
{
  "layer": "L3.75-phaseB",
  "fixture": "05-harvard-2028-i-too-can-dance",
  "iter": 0,
  "fresh_input": 7842,
  "cache_read": 2148,
  "cache_create": 0,
  "output": 10000,
  "fresh_input_usd": 0.0235,
  "cache_read_usd": 0.000644,
  "cache_create_usd": 0.0,
  "output_usd": 0.1500,
  "total_usd": 0.1741,
  "cache_hit_rate": 0.215
}
```

**Verification of Phase 0:**
- Run fixture 05 once with the new logger.
- Grep the log for a `"cache_read"` > 0 on L3 walk P1+ (proves existing caching is measurable).
- Confirm `total_usd` matches the top-line `calculateCost()` value to ≤ 1% (proves no double-count).
- Commit: `obs(cost): split per-call cost log into fresh/cache/output with $ breakdown`.

**STOP GATE:** Do not proceed to Phase 1 until Tue has reviewed the first run's log and signed off that the ledger is correct. This is the instrument the rest of the work is measured on.

---

## 3. Implementation phases

Each phase ships as its own commit with its own verification. Do not bundle phases.

### Phase 1 — L4 shared-profile caching (highest ROI, $0.20–0.25/essay)

**Source:** `COST_DEADWEIGHT_AUDIT.md` §A1 + §C.

**Files:**
- `src/services/essayIntelligence/analysis/crystallizer.ts` — L4a-NorthStar, L4a-ScoreMatrix, L4b call sites.
- `src/services/essayIntelligence/profileManager/profileRouter.ts` — `assembleL4*` rules if they exist.

**Change:** the three L4 calls share ~80% of their input (profile dump + L3.75 synthesis + walk). Today that 80% is in the user-prompt and is re-sent fresh on each of the three calls. Move the stable portion into a **multi-block system prompt with `cache_control: { type: 'ephemeral' }`** so L4a-NorthStar writes the cache once and the other two read at 1/10 price.

**System-prompt block structure (target):**
```
[block 1] SYSTEM instructions (stable, already cached)  → cache_control: ephemeral
[block 2] essay text + L3 walk summary + L3.75 Phase A/B output + voice identity  → cache_control: ephemeral (THE NEW BLOCK)
[block 3] call-specific instructions (NorthStar vs ScoreMatrix vs Crystallizer directives)
User prompt: minimal — just the "now produce X" directive.
```

**Due diligence before coding:**
- Read `callClaudeWithRetry` in `src/lib/llm/claude.ts` to confirm it accepts a multi-block system array with `cache_control` on each block (it does — grep `cache_control: { type: 'ephemeral' as const }` at claude.ts:561).
- Confirm Anthropic's 4-breakpoint cache limit — we use one for the stable system template, one for the profile block. Two of four, safe.
- Inspect the three L4 prompt builders and prove the 80% overlap claim with a real diff. If it's < 50% overlap, the saving estimate is wrong and you must re-audit before shipping.

**Verification:**
- Run fixture 05 pre-change, record L4 total cost: expect ~$0.49.
- Run fixture 05 post-change, record L4 total cost: expect ~$0.24–0.29.
- Log line proves: L4a-NorthStar has `cache_create > 20K`, L4a-ScoreMatrix + L4b have `cache_read > 20K each`.
- `tests/output/phase-b-dump.json`: L4 output JSON identical byte-for-byte to pre-change (we cut **inputs**, not outputs). If it differs, the prompt restructure changed semantics — stop and diagnose.
- `npx tsc --noEmit` clean.

**Fail-stop:** if L4 output diverges semantically (measurable via JSON structure diff > trivial whitespace), roll back the commit. A cache restructure that changes output is a regression, not a cost cut.

### Phase 2 — L3.75 Phase B output caps (OUTPUT_CUT_LIST, $0.08–0.15/essay)

**Source:** `OUTPUT_CUT_LIST.md` §A, §B, §Concrete prompt-level changes (items 1–4).

**Files:**
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — `SYSTEM_PROMPT_PHASE_B` assembly.
- `src/services/essayIntelligence/profileTypes.ts` — type definitions for the schema fields being removed.
- `src/services/essayIntelligence/analysis/llmJsonParser.ts` or a new `phaseBPostParse.ts` — parse-time dedup check.
- Any consumer of the fields being deleted — `src/components/annotation-v2*/`, `src/services/essayIntelligence/presentation/*`, L4/L5 readers. These must compile after field removal.

**Change:**
1. **Add to SYSTEM_PROMPT_PHASE_B** the full "QUANTITY DISCIPLINE" block from `OUTPUT_CUT_LIST.md §Concrete prompt-level changes #1`. Copy it verbatim.
2. **Delete from the type + schema:**
   - `thematicArchitecture.thesisConfidence`
   - `narrativeStrategy.arcMomentum`
   - `narrativeStrategy.strategyRationale` (merge semantic into `primaryStrategy`)
   - `admissionsPositioning.portfolioPosition`
   - `admissionsPositioning.archetypeContext.poolDensity`
   - `characterRevelation.revealedQualities` (merge survivors into `valuesRevealed`)
   - `characterRevelation.intellectualFingerprint` (merge a single-sentence version into `writerPortrait`)
   - `thematicArchitecture.threads[].appearances[]` — drop to paragraph granularity
   - `craftAssessment.sentencePatterns` numeric distribution statistics (keep rhythm prose)
3. **Reframe** contradictions, redFlags, archetypeDifferentiator, memorability per §Concrete prompt-level changes #3.
4. **Parse-time dedup** per §Concrete prompt-level changes #4 — dropping duplicate strengthSignatures by evidence-overlap, dropping growthEdges without `pairedImprovement`, collapsing blindSpots/redFlags that restate each other.

**Due diligence before coding:**
- Grep every consumer of each field being deleted:
  ```
  grep -rn "thesisConfidence\|arcMomentum\|strategyRationale\|portfolioPosition\|poolDensity\|revealedQualities\|intellectualFingerprint" src/ tests/
  ```
  Every hit must be updated or deleted. Do not rely on TypeScript alone — runtime JSON reads may exist (e.g., in `tests/output/*` fixtures or annotation-v2 components).
- For each reframing (contradictions → "which do you want the reader to land on?"), read the current prompt and confirm the rewrite reads as one coherent directive, not a bolt-on.
- Run the pre-cut fixture 05 Phase B output (already at `tests/output/phase-b-dump.json`) and enumerate the actual field counts:
  - `strengthSignatures.length` (expected 21)
  - `growthEdges.length` (expected 11)
  - `threads.length` (expected 6)
  - `blindSpots.length`, `redFlags.length`
- Post-cut, expect these at the caps or below.

**Verification:**
- Run fixture 05 post-change. Measure:
  - Phase B output tokens: expect drop from ~10,000 → ~6,500–7,500 (25–35%).
  - `strengthSignatures.length` ≤ 8.
  - `growthEdges.length` ≤ 6 and **every entry has a non-empty `pairedImprovement`**.
  - `threads.length` ≤ 5.
  - No entry in `blindSpots` shares its structural pattern with an entry in `redFlags` (script a similarity check if manual inspection is ambiguous).
- `craftAssessment` byte size (in serialized JSON) should drop ~40%.
- `npx tsc --noEmit` clean — catches consumers that still reference deleted fields.
- Human spot-check (surface to Tue): read the new Phase B output for fixture 05 end-to-end. Confirm:
  - Every retained signature is distinct.
  - Every retained growth edge has a concrete fix.
  - No information the writer would miss.

**Fail-stop:** if Phase B output caps below 6,000 tokens, prompt is over-clamping. If above 8,000, discipline isn't landing. If `pairedImprovement` is empty on any growth edge, the parse-time filter must drop it — if the filter lets it through, the filter is broken, not the prompt.

### Phase 3 — profileRouter `priority: 'always'` demotion (L3 walk, $0.10–0.20/essay)

**Source:** `COST_DEADWEIGHT_AUDIT.md §A5`.

**Files:**
- `src/services/essayIntelligence/profileManager/profileRouter.ts` — **69 occurrences** of `priority: 'always'` today. Concentrated in `assembleL3UnderstandingWalk` and adjacent rules.

**Change:** audit each of the 69 always-priority sections. Demote to `'connection_driven'` or `'proximity'` any section that:
- Is NOT structurally needed for every paragraph (e.g. full voice signature vs. just current voice stub).
- Is already covered by another always-priority section (e.g. full connection graph when current-paragraph-adjacent graph would do).
- Has been observed in logs as pushed out when over budget anyway (i.e. the priority label isn't changing outcomes).

**Target:** reduce always-priority sections from 69 → ~30–35 (roughly half). The router should no longer emit "Always-priority items (9–16K tokens) exceed budget (8K target)" on routine L3 calls.

**Due diligence before coding:**
- For each demotion candidate, open the section in profileRouter and read what it injects. Read two or three L3 call inputs from a recent run log to see what's actually being consumed.
- The demotion criteria must be written down **per section** — do not bulk-demote. Each demotion needs a one-line rationale in the commit.
- Make sure `'connection_driven'` sections actually have the connection metadata they need to fire (grep the dispatcher for `connection_driven` handling — confirm it works on L3 walk context, not just L5).

**Verification:**
- Run fixture 05 post-change. Measure:
  - L3 walk total input tokens: expect drop from ~130K → ~105K (~20% cut).
  - Router log: no more "exceeds budget" warnings on routine paragraphs.
  - L3 walk **output**: should be identical (±1%) — we cut input context, not instructions. If output drifts noticeably, the demoted sections were load-bearing. Roll back and re-pick.
- Downstream: L3.75 Phase A/B should produce the same output (they read L3 walk output, not L3 walk input). Byte-diff Phase A/B output against pre-change baseline. Divergence = signal that L3's quality regressed. Fail-stop.
- `npx tsc --noEmit` clean.

**Fail-stop:** if L3.75 Phase B output JSON differs > trivial whitespace, L3 regressed. A downstream divergence is the only reliable proxy for "did we cut load-bearing context?" Roll back commits per-section until Phase B stabilizes.

### Phase 4 — Essay-text shared cache block across layers ($0.05–0.15/essay)

**Source:** `COST_DEADWEIGHT_AUDIT.md §C (last item)`.

**Files:**
- `src/services/essayIntelligence/profileManager/profileRouter.ts` — essay text injection points.
- Call sites: sequentialDeepWalk, holisticSynthesis (both phases), analysisOrchestrator (L3.5), crystallizer (L4), growthEngine / L5.

**Change:** essay text (3–5K tokens) is consumed by ~20 calls per pipeline. Put it in a dedicated cached system-prompt block **once per pipeline run**, referenced by every layer.

**Due diligence:**
- Anthropic cache breakpoint budget: we will be holding ≥ 2 breakpoints by Phase 4 (system template + essay text). Confirm no layer needs 3+ breakpoints that would collide.
- Essay text is stable per run but differs per fixture — confirm cache scope is per-fixture, not global (it is — `ephemeral` caches are per-request-chain).
- The essay text may appear inside larger assembled blocks today (e.g. "here is the essay followed by walk output"). Extract it to a dedicated block so the cache key is stable.

**Verification:**
- Measure L3 walk cache hits on P1–P9: expect `cache_read > 3K` on each.
- Measure L3.5, L4, L5 cache hits for essay-text block: expect `cache_read` equal to essay length on every call after the first.
- Per-essay total cost delta: expect additional $0.05–0.15 saved on top of Phase 1–3.

**Fail-stop:** if cache hit rate doesn't materialize, the block isn't positioned correctly. Anthropic caches require *exact prefix match* — any prior variance in the prompt invalidates the cache. Log fresh_input on a call that should have hit — if it's still high, the prefix is drifting.

### Phase 5 (optional, defer for separate PR) — L5 schema trim ($0.08/essay)

**Source:** `COST_DEADWEIGHT_AUDIT.md §B3`.

Out of scope for this wave. L5 per-paragraph output hits the 2000-token cap on many paragraphs — needs schema audit similar to Phase B. Queue as separate work after waves 1–4 land.

### Phase 6 (optional, defer) — Reread threshold tuning ($0.05/essay)

**Source:** `COST_DEADWEIGHT_AUDIT.md §D2`.

Out of scope. Requires running the calibration set to re-tune the Meta disagreement threshold, which is a separate $35+ budget decision.

---

## 4. Verification protocol (applies to every phase)

After every phase's commit, and once more before PR open, run the **full verification matrix**:

### 4.1 Compile & lint
- `npx tsc --noEmit` (must be clean; fix every error — no `@ts-ignore` shortcuts).
- No new `any` types.
- No new `console.log` leaks.

### 4.2 Fixture 05 single-run smoke
- Run the full pipeline on fixture 05.
- Diff `tests/output/phase-b-dump.json` against its pre-change snapshot — expected shape: **deletions and count reductions only**, no new fields, no inserted noise.
- Diff the cost ledger line-by-line. Every affected layer must show the expected $ delta, ±10%.

### 4.3 Cost-ledger verification
- For each claimed saving (e.g. "Phase 1 saves $0.20"), present a table:
  | Phase | Pre-cost (fixture 05) | Post-cost | Delta | Target delta |
  | --- | --- | --- | --- | --- |
  | 1    | ...                  | ...       | ...   | $0.20–0.25 |
- If actual delta is < 50% of target, stop and investigate before continuing. Do not amortize later phases against unmet prior targets.

### 4.4 Quality gates (no regression)
- `writerPortrait`: read it. Should feel as rich as pre-change.
- `tellabilitySummary`: must still deliver a coherent 30-sec AO summary.
- `pivotPoints`: must still locate at paragraph + sentence.
- `growthEdges[]`: every retained edge has `pairedImprovement`. If any lack it, the filter is broken.
- L4 priorities: count and structure preserved (we cut inputs, not outputs).
- L5 per-paragraph annotations: byte-diff against baseline. Any drift must be justified.

### 4.5 No new fabricated content
- Phase B output must not invent fields to compensate for removed ones. Grep the post-change output for any field not in the updated type — any hit is a prompt leak and must be fixed.

### 4.6 Full calibration run (ONE TIME, before PR merge)
- Only after Tue signs off, run the full A/B calibration set (~$35–45).
- Required deliverables:
  - Cost ledger delta table for every fixture.
  - Mean/median/p95 cost per essay pre vs post.
  - Any fixture where quality score drops > 2% — full diff + explanation.

---

## 5. Anti-guessing protocol (read before touching code)

Because every item in the audit is a **claim** based on a single fixture run, treat each as a hypothesis to verify, not a fact to execute on:

1. **Before Phase 1:** re-measure L4 three-call input overlap on TWO additional fixtures. If overlap is < 70%, the cache gain is smaller than audited and you must re-estimate.
2. **Before Phase 2:** re-count `strengthSignatures`, `growthEdges`, `threads` on TWO additional fixtures. If fixture 05 was an outlier (e.g. a verbose essay), caps tuned for 05 will over-clamp the median essay. Adjust caps accordingly.
3. **Before Phase 3:** inspect a non-fixture-05 L3 walk run log and confirm the "always items exceed budget" warning fires there too. If not, the router is already self-correcting and the demotion gain is smaller.
4. **After each phase:** the cost-ledger numbers must match the audit's estimate **within 30%**. If actual saving is $0.05 where audit claimed $0.20, one of three things is true and you must figure out which before continuing:
   - Audit over-estimated (acceptable — record and continue).
   - Change didn't land as intended (unacceptable — diagnose).
   - Caching regressed elsewhere (unacceptable — diagnose).

**Never commit a change whose effect you have not verified on the cost ledger.**

---

## 6. Team composition (swarm split — optional)

Tue has standing authorization for up to 8 teammates. For this wave, three specialized agents + one Lead is right-sized:

| Role | Scope | Files owned |
|---|---|---|
| **Lead (you)** | Sequencing, verification, PR assembly | None; coordinates |
| **Observability agent** | Phase 0 ledger split | `src/lib/llm/claude.ts`, call-site loggers |
| **L4 caching agent** | Phase 1 + Phase 4 (essay-text cache) | `crystallizer.ts`, `profileRouter.ts` L4 rules, essay-text block placement |
| **L3.75 schema agent** | Phase 2 (Phase B caps + type deletions + dedup) | `holisticSynthesis.ts`, `profileTypes.ts`, `llmJsonParser.ts`, downstream consumers |
| **Router demotion agent** | Phase 3 (profileRouter L3 walk rules) | `profileRouter.ts` L3 rules |

**Coordination rules:**
- Phases are sequential. Observability ships first. Phase 1 before Phase 4 (both touch the prompt structure, Phase 1 establishes the multi-block pattern Phase 4 reuses).
- Phase 2 and Phase 3 are independent and can run in parallel after Phase 0 is merged.
- Every agent commits to `perf/cost-cut-wave-1` branch directly (not sub-branches). Lead rebases and squashes if needed before PR.
- Every agent writes its commit message with the measured $ delta. No speculative deltas.

If you prefer a single-agent execution (no swarm), the same phase sequence applies — just done sequentially by one agent. Swarm parallelism only saves wall-clock on Phase 2 vs Phase 3.

---

## 7. Deliverables

A single PR titled `perf(essay-intel): wave-1 cost cuts — $0.60–0.90/essay`.

**PR body must contain:**
- Cost ledger delta table (pre/post/target) per phase.
- Fixture 05 Phase B output diff summary (fields removed, counts reduced).
- Cache hit rate per layer (pre: unknown → post: measured).
- Quality gate sign-off (writerPortrait, tellability, pivotPoints, growthEdges pairedImprovement check).
- Link to the full calibration run's output (if run).
- Explicit note on anything that didn't hit its target and why.

**Also update:**
- `docs/analysis/COST_DEADWEIGHT_AUDIT.md` — add a "Post-implementation" section at the bottom with actual-vs-estimated table.
- `docs/analysis/OUTPUT_CUT_LIST.md` — mark each cut field with ✅ (shipped) or ⏸ (deferred) status.

Do NOT write new architecture docs, new PLAN.md, or new decision logs for this work. The two audits + the PR body carry the full record.

---

## 8. Rollback plan

Each phase is an atomic commit. If any phase fails a quality gate post-merge, `git revert <sha>` is sufficient — no phase leaves behind infrastructure that would prevent revert.

Phase 0 (observability) is the exception: keep it. It is pure telemetry and valuable regardless of whether cuts land.

---

## 9. Success criteria (the bar to close this work)

- [ ] Phase 0 ledger is live and verified on fixture 05.
- [ ] Phases 1–3 shipped (Phase 4 if time allows; defer if not).
- [ ] Fixture 05 end-to-end cost drops by ≥ $0.45 (conservative floor of the $0.66–0.99 estimate).
- [ ] Full calibration set mean cost drops by ≥ 15%.
- [ ] Zero fixtures show quality regression > 2%.
- [ ] Phase B output is objectively scannable (8 signatures not 21; 5 growth edges all with fixes; 3 threads not 6).
- [ ] `npx tsc --noEmit` clean, no new `any`, no new `@ts-ignore`.
- [ ] PR approved by Tue.

If any row is red at PR time, the PR sits and we diagnose. We do not merge partial cost cuts with unresolved quality questions.

---

## 10. Out-of-band questions for Tue before starting

Answer these with Tue before writing any code. Every one of these unknowns invalidates a specific downstream assumption.

1. **Approval to run Phase 0 (observability)?** ~$3.60 on fixture 05 to verify the new ledger.
2. **Approval to run one fixture-05 A/B per phase (Phases 1–4)?** Roughly 4 × $3.60 = $14.40 budget total. Still under the $5-per-run cap individually.
3. **Approval to run the full calibration set ONCE before PR merge?** ~$35–45.
4. **Does fixture 05 represent the median essay, or is it the verbose outlier?** If outlier, we need a second reference fixture for cap tuning in Phase 2.
5. **Who else is currently editing `profileRouter.ts` or `holisticSynthesis.ts`?** Both are active files per git status. Merge-conflict risk.
6. **Is there an annotation-v2 component that reads the fields being deleted in Phase 2?** (`thesisConfidence`, `arcMomentum`, etc.) The grep in §3 Phase 2 catches code; a manual walk of the annotation-v2 demo pages is needed to confirm nothing user-facing will break.

Do not start Phase 1 until Tue has answered questions 1, 2, 4, 5, 6. Question 3 can wait until pre-merge.

---

## Appendix A — File map

| File | Role in this wave |
|---|---|
| `src/lib/llm/claude.ts` | Phase 0: cost-log splitter |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | Phase 1: L4 prompt restructure |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | Phase 3: demote always-priority. Phase 4: essay-text block placement |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | Phase 2: Phase B prompt caps + reframing |
| `src/services/essayIntelligence/profileTypes.ts` | Phase 2: delete field types |
| `src/services/essayIntelligence/analysis/llmJsonParser.ts` | Phase 2: parse-time dedup |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | Phase 3/4: verify L3 walk behavior post-change |
| `src/components/annotation-v2*/` | Phase 2: consumer audit for deleted fields |
| `tests/output/phase-b-dump.json` | Pre/post diff target |
| `tests/output/checkpoint3/` | Full-run ledger baseline |

## Appendix B — Fixture 05 baseline (from pre-change run)

- Total pipeline cost: ~$3.60
- L4 total: ~$0.49 (NorthStar $0.16 + ScoreMatrix $0.14 + Crystallizer $0.19)
- L3 walk total: ~$0.85 (10 paragraphs)
- L3.75 total: ~$0.30 (Phase A + B, iter 0; one iter_1 reread occurred elsewhere at $0.47)
- L5 total: ~$0.60
- Phase B `craftAssessment` size: 22,935 bytes
- Phase B `strengthSignatures.length`: 21
- Phase B `growthEdges.length`: 11

## Appendix C — Rejected scope (do not do in this wave)

- Downgrading any Sonnet call to Haiku.
- Removing L3.75 Phase A or Phase B (keep both).
- Skipping reread on Meta disagreement.
- Altering the L4 output schema.
- Changing the conversator or chat integration.
- Consolidating L3.75 iter_1 into iter_0.
- Rewriting the prompt-caching infrastructure in `claude.ts` beyond the log splitter.
