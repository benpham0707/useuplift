# Test Reorganization Manifest — 2026-06-02

> Phase B of `chore/codebase-cleanup`. Moved **131** flat `tests/*.ts` dev-harness
> scripts into `src/`-mirrored domain folders. tests/unit, tests/integration,
> tests/property, fixtures, corpus, output, calibration, utils, test-helpers
> were **left untouched** (wired to the tsx runners + vitest.config.ts).

## Method (zero-breakage)

1. Classified each script by its dominant `../src/...` import → mirrored domain.
2. **AST-safe rewrite** (TypeScript compiler API): added one `../` level to every
   relative import / export-from / dynamic-import / require specifier, and inserted
   one `'..'` after `__dirname` in every `path.join|resolve(__dirname, …)`.
   String literals inside test assertions (e.g. `src.includes("from './x'")`) are
   not module specifiers, so they were never touched.
   → 587 module-specifier edits + 49 `__dirname` edits across 128 files.
3. **Hand-fixed 5 files** whose directory base bypassed the `__dirname` identifier
   (inline `path.dirname(__filename)` / `_d = dirname(_f)` / `new URL(import.meta.url)`):
   model-id-consistency, nuance-calibration, scoring-calibration-e2e,
   chat-conversation-robotics, chat-conversation-tutoring — each given +1 level.
4. Updated `.github/workflows/ci.yml` (descriptive-contract-lint path) and 16 live
   docs + the agent-memory index referencing moved script paths.

## Verification

- `tsc --noEmit`: exit 0 (all imports resolve).
- Static path check: 46 `__dirname` path resolutions, all land under `tests/` correctly.
- Runtime smoke (API-free): descriptive-contract-lint ✓, verify-ap-stats 40/40 ✓,
  model-id-consistency 8/8 ✓, port-g3-few-shot-calibration 30/30 ✓.

## Excluded (left flat at tests/ root — in-flight uncommitted work)

- `tests/dump-full-profile.ts`
- `tests/test-conversator-v2-e2e.ts`
- `tests/test-l35-essay-level-only.ts`
- `tests/verify-l5-essay-level-rewrites.ts`

## Layout

### `tests/academic/` — 9
- test-academic-planning-advisor.ts
- test-academic-planning-e2e.ts
- test-capability-conversation.ts
- test-deep-academic-report.ts
- test-insight-driven-advisor-e2e.ts
- test-major-resolution-comprehensive.ts
- test-natural-advisor-e2e.ts
- test-report-advisor-integration-e2e.ts
- test-research-backed-guidance.ts

### `tests/activity/` — 27
- test-achievement-retrieval.ts
- test-activity-rule-scorer.ts
- test-adaptive-modes-quick.ts
- test-analysis-teaching-pipeline.ts
- test-chat-conversation-robotics.ts
- test-chat-conversation-tutoring.ts
- test-description-rule-scorer.ts
- test-dynamic-conversation-engine.ts
- test-dynamic-engine-live.ts
- test-enhanced-activity-teaching.ts
- test-feature-extractor.ts
- test-impressiveness-calibration.ts
- test-kb-and-cross-user-cache.ts
- test-knowledge-assembly-unit.ts
- test-knowledge-driven-activity-teaching.ts
- test-narrative-quick.ts
- test-nuance-calibration.ts
- test-portfolio-calibration.ts
- test-portfolio-narrative-e2e.ts
- test-rule-scorer-calibration.ts
- test-scoring-calibration-e2e.ts
- test-scoring-calibration-edge-cases.ts
- test-scoring-phase3.ts
- test-scoring-robustness.ts
- test-stage2-reliability.ts
- test-tier-classification.ts
- test-universal-quality-check.ts

### `tests/essay-intelligence/` — 60
- test-ai-risk-scorer.ts
- test-analysis-raw-output.ts
- test-block-system-preflight.ts
- test-block-system-v3-audit.ts
- test-coaching-only.ts
- test-connection-graph.ts
- test-conversator-v2-trace.ts
- test-cross-module-context.ts
- test-descriptive-contract-lint.ts
- test-essay-level-l3-walk.ts
- test-finding-lifecycle.ts
- test-information-theoretic-analyzer.ts
- test-infrastructure-failfast.ts
- test-inline-editing-e2e.ts
- test-inline-editing-latency.ts
- test-knowledge-block.ts
- test-l3-depth-audit.ts
- test-l35-anti-clustering.ts
- test-l35-score-audit.ts
- test-l375-earned-voice-audit.ts
- test-l5-teaching-audit.ts
- test-l6-coaching-audit.ts
- test-mode-detection.ts
- test-port-a2-voice-persistence.ts
- test-port-a3-piq-rubric.ts
- test-port-b1-pattern-library.ts
- test-port-b2a-symptom-taxonomy.ts
- test-port-b3-ps2-authenticity.ts
- test-port-f1-cliche-anchors.ts
- test-port-f2-ai-risk-signal.ts
- test-port-g1-fabrication-guard.ts
- test-port-g2-focus-mode.ts
- test-port-g3-few-shot-calibration.ts
- test-profile-migration.ts
- test-rag-retrieval-e2e.ts
- test-realistic-session-e2e.ts
- test-sarika-calibration.ts
- test-scope1-phase1-runtime.ts
- test-scope1-phase2-runtime.ts
- test-scope1-phase3-runtime.ts
- test-scope2-phase4-runtime.ts
- test-scope2-phase5-runtime.ts
- test-scope2-phase6a-runtime.ts
- test-scope3-phase7-runtime.ts
- test-sentence-tier-mapping.ts
- test-shadow-runner.ts
- test-signature-move-validation.ts
- test-step-7-crochet-full-pipeline.ts
- test-story-mining-e2e.ts
- test-style-consistency.ts
- test-teaching-router-unit.ts
- test-unified-system-preflight.ts
- test-voice-cross-workshop.ts
- test-voice-preservation.ts
- test-voice-profile-accuracy.ts
- test-voice-profile-unit.ts
- test-wave1-smoke.ts
- test-wave2-smoke.ts
- test-wave3-preanalysis.ts
- test-wave3-registries.ts

### `tests/harness/` — 4
- dump-phase-b.ts
- generate-deep-report-output.ts
- run-rag-seeder.ts
- verify-ap-stats.ts

### `tests/infra/` — 10
- test-analytics-tracking.ts
- test-api-key-diagnostic.ts
- test-expert-knowledge-ab-comparison.ts
- test-model-id-consistency.ts
- test-prompt-block-versions.ts
- test-prompt-caching-validation.ts
- test-rag-teaching-impact.ts
- test-student-theory-parse.ts
- test-system-prompt-version.ts
- test-version-comparison.ts

### `tests/portfolio/` — 8
- test-academic-advisor-live-e2e.ts
- test-activity-profile-chat-e2e.ts
- test-capability-e2e-ux.ts
- test-conversation-scenarios-analysis.ts
- test-full-pipeline-e2e-output.ts
- test-improvement-verification.ts
- test-user-experience-e2e.ts
- test-v41-pipeline-cohesive.ts

### `tests/scoring/` — 2
- test-narrative-analyzers.ts
- test-narrative-rebuild-calibration.ts

### `tests/workshop/` — 11
- test-annotation-validation.ts
- test-enhanced-workshop-deep-analysis.ts
- test-enhanced-workshop-e2e.ts
- test-enhanced-workshop-full-loop.ts
- test-essay-profiles-calibration.ts
- test-hybrid-scoring-calibration.ts
- test-port-a3-orchestrator-wiring.ts
- test-technique-system-audit.ts
- test-workshop-integration.ts
- test-workshop-llm-e2e.ts
- test-workshop-registry.ts
