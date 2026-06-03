# docs/ Live-vs-Archived Audit — 2026-06-02

> Phase C of `chore/codebase-cleanup`. A 6-agent classification swarm read all
> 99 ambiguous live docs (the 196 code-cited / current-structured-dir docs were
> auto-kept; 4 in-flight docs skipped). Conservative policy: **keep** anything
> that reads as current design, an active backlog item, or part of a cohesive
> active set (`implementation-prompts/`, `lovable-prompts/`); **archive** only
> unambiguous closed historical records. **23 docs archived**, none code-cited.

## Archived (23)

### `docs/archived/audit/` — 10
- docs/audit/PERFORMANCE_RELIABILITY_AUDIT.md
- docs/audit/d1-12-halt-on-error-pass.md
- docs/audit/d1-15-mock-llm-integration.md
- docs/audit/d1-18-phase1-cost-closure.md
- docs/audit/phase-0-integrity-audit.md
- docs/audit/phase-1-deferred-items-closure.md
- docs/audit/phase-2-round-1-6-retroactive-integrity.md
- docs/audit/round-1.md
- docs/audit/round-2.md
- docs/audit/round-3.md

### `docs/archived/completion-snapshots/` — 5
- docs/QUALITY_GAP1_CALIBRATION.md
- docs/wave-3a/CHECKPOINT_1B_REPORT.md
- docs/wave-3a/CORPUS_EXTRACTION_WORKSHEET.md
- docs/wave-3a/PHASE_3B_3C_SMOKE_FINDINGS.md
- docs/wave-3a/VALIDATION_SWARM_RESULTS.md

### `docs/archived/misc/` — 2
- docs/OPUS_REWRITE_PROMPTS.md
- docs/analysis/CHAT_2_COMBINED_PROMPT.md

### `docs/archived/phases/` — 6
- docs/analysis/PHASE_0_1A_ITERATION_PROMPT.md
- docs/phase_reviews/PHASE_10_15_REDUX_DEEP_DIVE.md
- docs/phase_reviews/PHASE_14_15_IMPLEMENTATION_AUDIT.md
- docs/phase_reviews/PHASE_14_15_IMPLEMENTATION_COMPLETE.md
- docs/phase_reviews/PHASE_14_15_QUALITY_COMPARISON.md
- docs/wave-3a/PHASE_1J_HOPKINS_INTEGRATION_PLAN.md

## Reference rewrites
Updated 6 live files that linked to a moved audit doc → new `docs/archived/audit/…`
paths (phase-1-integrity-audit.md [kept live, code-cited], two L5 pipeline docs,
two integration/unit test comments, one output dump).

## Kept live despite borderline signals (conservative)
- `docs/implementation-prompts/IMPROVEMENT_2,4_*`, `PLAN2_REMAINING_GAPS`,
  `CHECKPOINT_PROMPT` — part of the active V2 improvement backlog; no separate
  REVISED file supersedes IMPROVEMENT_2, so no copy loss risk taken.
- `docs/lovable-prompts/*` (00–06) — cohesive active frontend build set; kept whole.
- `docs/DEEP_REPORT_CONTEXT_HANDOFF.md` — matched a `_HANDOFF` archive pattern but
  is the live deep-report architecture reference (cited in CLAUDE.md/MEMORY).

## Verification
tsc --noEmit exit 0; no stale references to the 23 in the live tree; docs/README
references none of them.
