# File Ownership

> Every source file listed here has exactly one PRIMARY chat. Other chats can READ and propose changes, but must route through `shared/HANDOFFS.md` before touching.

**Last updated**: 2026-04-23

## Ownership rules

- **Primary**: has write authority, drives the design, resolves conflicts.
- **Reader**: may read for context, cite in plans, but cannot modify without primary's acknowledgement.
- **Shared**: both chats have legitimate claims; coordinate via handoffs before changing.

## Hot files (all three chats care about these)

| File | Primary | Readers | Notes |
|---|---|---|---|
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | **01 Cost** (through verification) | 02, 03 | Phase B prompt + parser. Cost chat holds until Phase C lands; after that, 02 and 03 can extend. Coordinate via CONTRACTS.md. |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | **01 Cost** (short-term) | 02, 03 | Iteration loop, layer sequencing. 02 may need a conversator-fetch step here; 03 may need a research-stage step. Coordinate. |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | **01 Cost** (Phase D1) | 02, 03 | L3 walk. Cost stabilizes essay-text cache first; then 02 can add ExperienceProfile block; 03 can add research block. |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | **01 Cost** (Phase D2) | 02, 03 | L5. Cost adds cache marker first; 02 integrates for rewrite grounding; 03 integrates anti-archetypes. |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | **03 RAG** (long-term) | 01, 02 | Budget + priority architecture. Cost will propose Tier 5.2 demotions; RAG may replace the budget model entirely. RAG wins on design authority. |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | **03 RAG** (L4 wiring) | 01 | Cost has Tier 5.1 caching ambition here; RAG owns final shape. |
| `src/services/essayIntelligence/profileTypes.ts` | **shared** | all | Any schema change MUST update CONTRACTS.md first. |

## Workstream 01 (Cost) owned exclusively

| File | Scope |
|---|---|
| `src/lib/llm/claude.ts` | Phase A1 cost ledger. Other chats read ledger; don't modify emitter. |
| `src/services/essayIntelligence/analysis/editUnderstandingService.ts` | Phase E1 dead-code delete. |
| `src/services/essayIntelligence/analysis/runningUnderstandingManager.ts` | Phase E2 emotionalArc delete. |
| `src/services/essayIntelligence/analysis/llmJsonParser.ts` | Phase C2 post-parse enforcement. |
| Consumer-migration files (if cuts approved): `readinessScoring.ts`, `diffEngine.ts`, `coachingService.ts` (for poolDensity only), `essayCoachingRoutes.ts` | Only touched if Tue approves the corresponding Phase C deletion. |

## Workstream 02 (Conversator) owned exclusively

| File | Scope |
|---|---|
| `src/services/conversator*/` or `src/services/piq/conversator*/` | Conversator internals. |
| `src/services/essayIntelligence/profileBridge.ts` (if it exists) | Chat-pipeline bridge. |
| `src/services/essayIntelligence/chatPersistenceService.ts` (if it exists) | Persistence layer. |
| New files: `ExperienceProfile` type + service (location TBD by design doc) | |

## Workstream 03 (RAG) owned exclusively

| File | Scope |
|---|---|
| `src/services/essayIntelligence/corpus/*` | Corpus data, retrieval helpers. |
| `src/services/essayIntelligence/analysis/corpusRetrievalBlocks.ts` | Retrieval block builders. |
| `src/services/essayIntelligence/corpus/corpusTelemetryPersistence.ts` | Telemetry. |
| `src/services/essayIntelligence/taxonomies/*` | issuePatternIndex, clicheLibrary. |
| `src/services/essayIntelligence/rubrics/*` | piqRubric, authenticityTiers. |
| New files: `researchRouter` (if designed) | |

## Environment flags

| Flag | Primary | Notes |
|---|---|---|
| `ENABLE_CORPUS_RETRIEVAL_L35` (+ per-layer overrides) | **03 RAG** | Currently OFF. RAG decides flip sequence after Cost Phase C unblocks. |
| `ENABLE_AI_RISK_SIGNAL` | **02 Conversator** or **03 RAG** (TBD) | Touches authorship/voice — relevant to both. Default OFF, leave OFF until design clarifies. |
| `ENABLE_VOICE_PROFILE_IMPORT` | **02 Conversator** | Port A2. Relevant to ground-truth voice signal. Default OFF, flip under Conversator design. |
| `ENABLE_HAIKU_MINIMAL_PATH` | **01 Cost** (monitoring only) | Default ON. Monitor for accidental flip-off in prod config. |

## Tests and fixtures

| Path | Primary | Notes |
|---|---|---|
| `tests/output/checkpoint3/` | **01 Cost** | Baseline + post-run results. |
| `tests/output/phase-b-dump.json` | **01 Cost** | Phase B shape reference. |
| `tests/calibration/top-tier-reference/` | **03 RAG** | Harvard-10 source material. |
| `tests/unit/repair-truncated-json.test.ts` | **01 Cost** | Truncation recovery tests. |

## Handoff triggers

A file's ownership may transfer or become shared when:

1. The primary's scoped work has landed and verified.
2. Primary explicitly releases via a note in `HANDOFFS.md`.
3. Two chats both need write access concurrently — escalate to Tue; do not coexist silently.

## Out-of-scope files

Any file not listed here is NOT part of this coordination protocol. Default ownership falls to whichever chat's workstream the change naturally belongs to. If ambiguous, list it here before touching.
