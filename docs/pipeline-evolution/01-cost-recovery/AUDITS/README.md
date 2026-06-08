# Audits — Cost Recovery

> Forensic investigation outputs that informed the consolidated changeset. Read-only reference material.
> All chats may cite these; only 01 modifies them.

**Last updated**: 2026-04-23

## Contents

These are the five investigations run during the initial diagnosis session (2026-04-22 to 2026-04-23). They are the evidence base for [PLAN.md](../PLAN.md).

The source outputs are in the session transcript. Summaries below capture the load-bearing findings. Full forensic output per audit is intentionally NOT duplicated here — if a specific claim needs to be re-verified, re-run the audit.

### 1. Regression diagnosis ($1.47 → $3.60)

**Question**: where did $2.13 of per-essay cost go?

**Top findings**:
- Wave-3a ports A2/F2 + L3.5 prompt expansion (A3/G3/B1/B3/F1) + L4 scoreMatrixAnchors: $0.11–$0.21 when all flags ON.
- Most of the regression was NOT from the ports themselves but from iter_1 rate inflation (+$0.25) + reread-always-fires (+$0.10–$0.15) + Phase B output bloat (+$0.10–$0.15).
- Active ports (A1, A3+wiring, G3, B1, B3, F1) combine to only ~$0.02–$0.03/essay. The large-cost ports (A2, F2, Phase 3C) are feature-flagged OFF.

### 2. Harvard-10 port-by-port audit

**Question**: which ports are load-bearing vs. trimmable?

**Verdict**:
- KEEP: A1 (PIQ coaching guardrails), A3 (PIQ 13-dim), G3 (calibration anchors), B1 (pattern library), B3 (authenticity tiers).
- TRIM: F1 (cliché anchors — 5 exemplars marginal over prior 5).
- OFF (trim design, not port): A2 (voice prior — use session cache instead of Supabase).
- OFF (gated, awaiting A/B): F2 (AI risk), Phase 3C (corpus retrieval).

### 3. Phase B output forensics

**Question**: is Phase B exceeding its cap?

**Verdict** (confidence: HIGH):
- `SYNTHESIS_MAX_TOKENS_PHASE_B = 10000` (line 114). Actual fixture 05 output: ~15,012 tokens.
- Fixtures 02 and 09 fail at JSON parse positions 15,732 and 30,037 — truncation mid-structure.
- `tests/unit/repair-truncated-json.test.ts` was written AFTER the 2026-04-21 production failures. Proves truncation is real and not yet fully recovered.
- Comment at `holisticSynthesis.ts:105–112` documents a prior raise from 7K→10K after similar truncation. The cap has been chased once already.
- Output cuts are MANDATORY (correctness), not optional (optimization).

### 4. iter_1 convergence root cause

**Question**: why is iter_1 firing at 62.5%?

**Verdict** (confidence: HIGH):
- Prompt at `holisticSynthesis.ts:784–795` reads "For complex essays with multiple themes or structural issues: 1–2 iterations max" — the LLM interprets this as permission, not cap.
- `selfAssessedConvergence.remainingOpportunities` schema creates rhetorical burden to justify convergence (require filling the array).
- "When in doubt, CONVERGE" is the final sentence — positional weight as fallback, not rule.
- 5/5 essays that fired iter_1 are 622–643 words (above 500-word auto-converge threshold). Length alone triggers the "complex essay" license.
- Commit `0f404e7` (2026-03-19) is the regression point. Intended to tighten, accidentally loosened via the "1–2 iterations max" normalizer.

### 5. L3 / L5 cost autopsy

**Question**: where in per-paragraph calls are we leaking cost?

**Verdict**:
- L3 walk cache hit rate: 23% (checkpoint3 piano-essay). User prompt prefix mutates per paragraph (holisticEvolution appended, scoutLeads swap, assembledContext shifts). Anthropic cache requires exact prefix match → 77% of calls pay full price.
- L5 `sharedContext` is identical across 10 paragraph calls but has no `cache_control` marker. 0% cache contribution to sharedContext.
- Fix targets (ranked by ROI): L3 cache prefix stabilization ($0.08–0.12), L5 cache marker ($0.03–0.06), earlier-paragraph digest consolidation ($0.04–0.08, riskier quality-wise).

### 6. Research utilization map

**Question**: is the deep research database actually being used?

**Verdict**:
- ~60% wired, 40% blocked or dormant.
- Wired + always-on: PIQ rubric, authenticity tiers, issue pattern index.
- Wired but gated OFF: Wave-3a corpus (190 moves + 14 archetypes + 98 cells) — blocked by Phase B truncation, not by architecture.
- Partially wired: school-fit vectors (test-only), move dependencies (retrieval-only), voice×archetype compatibility (filter-only).
- Dormant: anti-archetypes, contextual validity patterns, corpus limits, cliché library (server-side only).
- **Tie-in**: Phase C (our Phase B cuts) is the unblocker for corpus retrieval flag flip. Two-for-one.

### 7. Pipeline intentionality audit

**Question**: what does the pipeline do that doesn't belong?

**Top 10 by impact**:
1. L5 rereads fire after convergence (`analysisOrchestrator.ts:1200–1268`) — **CRITICAL**, addressed by Phase B2.
2. `analysisMode` computed by LLM, never read (`editUnderstandingService.ts`) — addressed by Phase E1.
3. `arcMomentum` stored dually (`emotionalTopography` + `narrativeStrategy`) — deferred to future cleanup.
4. Focused-mode branching doesn't exist in orchestrator — deferred (product decision).
5. Checkpoint errors silently swallowed — addressed by Phase E3 (observability).
6. L2.5 runs unconditionally on single-paragraph essays — deferred (edge case).
7. `persistCorpusTelemetry` fire-and-forget — deferred (low impact).
8. `thesisConfidence` dual-source (walk + thematicArchitecture) — deferred.
9. `profileRouter` O(n²) section reads — deferred (perf only).
10. `runningUnderstanding.emotionalArc` computed, never read — addressed by Phase E2.

---

## How to use these audits

- Cite with the audit number: "per AUDIT 4, iter_1 prompt regression is commit `0f404e7`".
- If a claim from an audit is challenged, note the challenge in the relevant DECISIONS.md or HANDOFFS.md. Don't silently overwrite.
- New audits commissioned during execution land here as `AUDIT_{n}_<topic>.md`.
