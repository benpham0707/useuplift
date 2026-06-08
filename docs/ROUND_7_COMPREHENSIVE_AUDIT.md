# Round 7 Comprehensive E2E Audit

**Date:** 2026-04-17
**Branch:** `feat/forge-plan-pipeline-refactor`
**Scope:** Essay Intelligence system end-to-end, post-Round 7c hardening, before Round 8 (personalized revision planning)
**Method:** 8 parallel read-only audit agents across pipeline, historical (7a), analytical/strategic (7b+7c), persistence, lifecycle, coaching, cost/cache/perf, and test coverage.

---
           












































































           
## Executive Summary  

Round 7a/7b/7c landed the signal infrastructure cleanly. Each round's per-round audit caught its local bugs. But a system-wide lens surfaces **cross-cutting issues that per-round audits couldn't see** — particularly at the boundaries between layers.

**Headline findings:**

1. **P0 — PERSISTENCE IS BROKEN.** `essayId: ''` is hardcoded in coordinator checkpoint metadata and never overridden. Every Supabase save attempts to upsert an empty string into a `UUID NOT NULL` column — fails silently (save wrapped in try/catch log-and-continue). Cross-session state (Round 7a snapshots, 7b/7c signals, coaching memory) **never lands in production**. Symptoms invisible until a student reloads the page.

2. **P0 — No retry on transient LLM errors.** `callClaudeWithRetry` default is `maxRetries = 0` and zero callers in the essay intelligence tree use it. A single 429 during L3 (7 paragraph calls sequential) nukes the whole pipeline.

3. **P0 — No credits deduction on `/essay-coaching/respond`.** Zero-balance users can spam Sonnet calls unbounded. Billing-integrity doctrine explicitly violated.

4. **P1 — Haiku routing is dead code.** Every coach turn (including "ok thanks") hits Sonnet. Dead code: `runStage1InsightExtraction`, `runStage1_5CognitiveAssessment`, `generateMinimalResponse`. 5-10x overcharge on minimal turns.

5. **P1 — "Integration tests" are source-regex grep.** 7c's M10 integration tests, 7b's analytical-deepening integration tests pin strings not behavior. A rename of `enrichment` → `enr` with empty fields would scream "regression" while real behavior breaks; gutting field population while preserving string shape would pass.

6. **P1 — No CI.** `.github/workflows/` does not exist. `package.json` has no `test` script. Enforcement is a pre-push hook blocking direct pushes to main. Zero automated gating.

7. **P2 — Signals are inventory, not capability.** 7b+7c signal machinery lands in prompts only. No code path gates behavior, re-routes coaching, or demands follow-up. "Did Sonnet happen to read it this turn" is the sole determinant of impact.

8. **P2 — Prompt overload under full enrichment.** historicalSection + analyticalSection + strategicSection injects 600-1100 tokens of verdict-laden content BEFORE the essay text. Sonnet reads verdicts before evidence — opposite of how an AO actually works. Round 8 compounds this.

Round 8 (personalized revision planning) **cannot ship safely** without addressing the P0 items. P1 items are ship-blockers too if the goal is production-grade delivery.

---

## Architecture Overview (current state)

### Pipeline
```
L1 First Impressions (Haiku, parallel with L2)
L2 Structural Cartography (Sonnet) [should be Haiku — audit finding]
L3 Sequential Deep Walk (Sonnet, per-paragraph, cached prefix)
L3.75 Holistic Synthesis (Sonnet, 3-iter cap, 0.60 budget)
  ├── Phase A / Phase B / Meta / Curation
  ├── Deep Dives (0-3)
  ├── Rereads (per-gated-paragraph)
  └── Prose Synth — NO CACHING (hot bug)
L3.5 Analysis Pass (Sonnet, per-paragraph) — writes claimEarnednessMap + rhetoricalInventory
L4 Crystallizer (3 Sonnet calls: NorthStar + ScoreMatrix + L4b) + 1 Haiku adversarial
L5 Deep Annotation (Sonnet, per-paragraph + cross-paragraph)
Archetype Distance (pure code, post-L3.5)
AO First Read (Haiku, NOW serial post-distance — was parallel pre-7c)
L6 Coaching (Sonnet primary + optional Sonnet deepening)
```

Per-essay comprehensive cost: **$1.10–$2.00** (single-iter growth → 3-iter + 2 deep dives + 1 reread).

### Signal surface on EssayProfile
| Signal | Added | Type | Persistence |
|--------|-------|------|-------------|
| revisionHistory (snapshots, resets) | 7a | embedded JSONB | ❌ broken (H1) |
| revisionIntelligence | 7a | derived, pure | ❌ |
| voiceEvolution | 7a | derived, pure | ❌ |
| claimEarnednessMap | 7b | L3.5 aggregated | ❌ |
| rhetoricalInventory | 7b | L3.5 + L3.75 | ❌ |
| archetypeDistanceProfile | 7c | pure code | ❌ |
| aoFirstRead.archetypePositioning | 7c | enriched AO call | ❌ |

All seven ride inside `profile_cache` JSONB. **None reach Supabase in production today** (see P0-1).

### Coach section composition (cached system prompt order)
```
coachingPhilosophy (~3.5k tokens)
FORBIDDEN_PATTERNS_BLOCK
SECTION_WORD_BUDGETS
round3DirectivesBlock
historicalSection          ← 7a
analyticalSection          ← 7b
strategicSection           ← 7c
===ESSAY PROFILE CONTEXT===  (1-2k tokens)
===ESSAY TEXT===             (300-1500 tokens)
phaseSection
antiConvergenceSection
```

Fresh-profile total: ~8-10k tokens. Full-enrichment: ~12-16k tokens.

---

## Domain-by-domain findings

### Domain 1 — Analysis Pipeline Integrity

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D1-H1 | HIGH | `sequentialDeepWalk.applyWalkOutputToProfile` mutates profile directly, bypassing coordinator. Connection tracking split: walk uses `conn_l3_${Date.now()}` IDs, coordinator uses counter-based IDs → mutation tracking + staleness tracker observe only half the writes. | sequentialDeepWalk.ts:945, 1952-2085 |
| D1-H2 | HIGH | Walk error path also mutates profile directly (`markParagraphSkipped`), then throws. `walkSkipped` markers set but the throw skips `safeCheckpoint` — markers never persisted. | sequentialDeepWalk.ts:820, 829 |
| D1-H3 | HIGH | Orchestrator writes `aoFirstRead` and `improvementManifest` via forced type casts `(profileForAO as { aoFirstRead?: ... }).aoFirstRead = ...`. No `applyAOFirstRead` method on coordinator. No validation, no mutation tracking. | analysisOrchestrator.ts:774-776, 1224 |
| D1-H4 | HIGH | `runL2` docstring says "returns null on failure" but implementation only throws. Null-check at `:428` is unreachable. Misleading contract. | analysisOrchestrator.ts:1320-1330 |
| D1-M1 | MED | AO first-read failure silently degrades — no downstream marker, manifest builder sees empty AO source, `layersCompleted` does not record failure. | analysisOrchestrator.ts:777-781 |
| D1-M3 | MED | L3.75 `rhetoricalInventoryRaw` consumed via `unknown` cast — type-unsafe cross-layer smuggling. | analysisOrchestrator.ts:554-557 |
| D1-M4 | MED | L3.5 fails on ANY failed paragraph (even one). A transient hiccup on P8 of 10 kills the whole analysis. No per-paragraph retry. | analysisPass.ts:2374, analysisOrchestrator.ts:615-620 |
| D1-M5 | MED | Dual synthesis path (Phase 3 full + Phase 5.75 delta) can overwrite each other. Holistic sections end with ambiguous lineage. | analysisOrchestrator.ts:548, 1082 |
| D1-L1 | LOW | Walk's `profile.index.connectionGraph.push` is orphan — `refreshIndex` rebuilds from scratch immediately. | sequentialDeepWalk.ts:2073 |
| D1-L2 | LOW | Walk connection IDs use `Date.now() + random` — potential collision at high velocity. | sequentialDeepWalk.ts:2046 |

### Domain 2 — Round 7a Historical Intelligence

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D2-H1 | HIGH | Snapshot + revisionIntelligence + voiceEvolution fire ONCE PER PARAGRAPH (analysisOrchestrator loops). Idempotent on sessionId so no duplication, but 6 paragraphs = 6 full recomputes of pattern/velocity/voice math. Wasted compute + `priorSnapshotEssayText` cache drift. | essayProfileManager.ts:1743, 1857-1860 |
| D2-H2 | HIGH | `sessionsPersisted` semantics drift: counts coordinator lifetimes, not true revision sessions. Frontend recreating coordinator per turn causes overcount. Round 8 planners reading this will over-escalate. | essayProfileManager.ts:1015 |
| D2-H3 | HIGH | `SnapshotFinding.severity` permanently hardcoded `'moderate'`. Pattern-level alarms fire with no severity weighting — cosmetic "word choice" issue contributes equally to "central claim unearned." | profileSnapshot.ts:286-299 |
| D2-H4 | HIGH | 16-char SHA-1 prefix for `essayTextHash` — statistically safe per student but `splitPriorsFromCurrent` strips by hash equality alone. Should corroborate with sessionId. | revisionIntelligence.ts:42, 165 |
| D2-H5 | HIGH | Cache bust on `null → populated` transition is unavoidable (one-time), but mid-session recomputes between turns can re-write `summaryForCoach` even when underlying signals are equivalent → cache bust mid-session. | coachingService.ts:2107 |
| D2-M1 | MED | No GC of snapshots. `archivedSnapshots` counter + `resetEvents[]` grow append-only for essay lifetime. Unbounded over years. | snapshotStore.ts:208-219 |
| D2-M2 | MED | `revisionSessionId` = `${createdAt}-${Date.now()}`. Two coordinator constructs in same ms collide. Use `randomUUID()`. | essayProfileManager.ts:1015 |
| D2-M3 | MED | `anchorTextAfter: ''` always empty — field exists in schema, consumers will expect "what student replaced with" and get nothing. | revisionIntelligence.ts:288 |
| D2-M4 | MED | Register stability trend = count of shifts across snapshots. Moving shifts to different paragraphs shows as "stable." | voiceEvolution.ts:232 |
| D2-M5 | MED | Vividness derived from marker/weakness cardinality alone. L3 under-producing markers triggers false flattening. | profileSnapshot.ts:314 |
| D2-M7 | MED | Identical back-to-back drafts: `computeRevisionIntelligence` reports `persistentFindings` with `sessionsPersisted=2` even though student did nothing. No hash-equality short-circuit. | revisionIntelligence.ts |

### Domain 3 — Round 7b + 7c Signal Quality (rollup)

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D3-H1 | HIGH | **Signals are inventory, not capability.** 7b + 7c signals injected into coach prompt only. No gating, no routing, no follow-up enforcement. "Did Sonnet happen to read it this turn" is the sole determinant. | coaching/coachingService.ts:2089-2098 |
| D3-H2 | HIGH | Full-enrichment prompt reads VERDICT BEFORE EVIDENCE. Three sections upstream of essay text = opposite of how AO actually reads. 600-1100 tokens of judgment-laden material before the essay. | coachingService.ts:2078-2113 |
| D3-H3 | HIGH | Compound false-positive surface: archetype clichéFlags (Jaccard ≥2/3 + 30-char prefix substring), differentiatorsPresent (M3 corroboration weak), mostUnderearnedParagraphs (strict >0.5 ratio). Scenario exists where clean essay trips 3+ false signals simultaneously. | archetypeDistance.ts:775-855, 864-957; analysisPass.ts:1615-1623 |
| D3-M1 | MED | Mutual 7b/7c inconsistency: `strongestBreakoutDimension='claim'` + `claim earnedness=UNEARNED` on the SAME claim. Section codas pull coach in opposite directions. | — |
| D3-M2 | MED | Evidence grounding inconsistent: 7b is well-grounded (claim assessments MUST cite evidence); 7c clichéFlags emit only a string with no paragraph/quote citation; strategic section falls back to `location='throughout'`. | promptBlocks.ts:3083 |
| D3-M3 | MED | `detectClichéFlags` reads `profile.findings` (L3 outputs) for corroboration. L3 maturityReasoning free text can corroborate an L3.5-driven cliché flag — surprising dataflow. | archetypeDistance.ts:775-855 |
| D3-M4 | MED | `aggregateDistance` high-variance: single-sentence rephrasing shifts Jaccard by ~0.2, tips from `competent_within_archetype` to `edging_out`. Coach reports "your read has shifted" — student revision journey reads as instability. No smoothing. | — |
| D3-M5 | MED | Magic thresholds 0.25/0.45/0.7 on a weighted float of 5 heuristics — band-boundary flips from 4-token edits. Hard rule doing LLM-judgment work. | archetypeDistance.ts:104-106 |
| D3-L1 | LOW | `mostUnderearnedParagraphs` computed, never consumed by any prompt. Dead inventory. | analysisPass.ts:1615-1623 |
| D3-L2 | LOW | `differentiatorsPresent` computed, never rendered by `strategicIntelligenceSection`. Only clichéFlags surfaces. | — |
| D3-L4 | LOW | `overlapWithOtherSignals` exists on ClaimEarnednessAssessment, never consumed. | — |
| D3-L5 | LOW | `diversityScore` in RhetoricalInventory never rendered. | — |

### Domain 4 — Persistence + Coordinator

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D4-H1 | **P0** | **`CheckpointMetadata.essayId` hardcoded to `''` — never overridden. Every save tries to upsert empty string into `UUID NOT NULL` column. Fails silently (try/catch log-and-continue). No cross-session state persists in production.** | essayProfileManager.ts:2630 |
| D4-H2 | HIGH | Round 7a snapshots ride inside same JSONB blob. No separate table, no FK to essays(id). Partial write corrupts entire revision chain. | — |
| D4-H3 | HIGH | `captureRevisionSnapshot` fires per-paragraph; `priorSnapshotEssayText` updated every call → overlap=1.0 on last iteration → any next call computes as "no rewrite" even on substantial change. | essayProfileManager.ts:1743 |
| D4-H4 | HIGH | Two different `hashEssayText` functions under same exported name: SupabaseCheckpointStore uses SHA-256 full, profileSnapshot uses SHA-1 16-char. Footgun. | supabaseCheckpointStore.ts:55; profileSnapshot.ts:170-172 |
| D4-M1 | MED | Profile JSONB 180-470KB observed. No size guard. Round 8 compounds. Supabase TOAST warnings at ~1MB. | — |
| D4-M2 | MED | No optimistic locking on upsert. `writeVersion` tracked but no `WHERE version < $new` guard. Two-tab race = last-writer-wins. | supabaseCheckpointStore.ts:82 |
| D4-M3 | MED | `sessionStore` in-memory cache can go stale on external writes. No invalidation-on-write. | essayCoachingRoutes.ts:35-49 |
| D4-M5 | MED | `SupabaseCheckpointStore.save` is fire-and-forget. Persistent persistence failure invisible. | supabaseCheckpointStore.ts:88-94 |
| D4-M6 | MED | `crossDomainValidation.validateFull` has no teeth — warnings only, result logged not gating save. | crossDomainValidation.ts:38-59 |
| D4-M7 | MED | `aoFirstRead = null` via direct mutation (not through coordinator) — no writeVersion bump, no validation. | essayProfileManager.ts:1797-1801 |
| D4-L1 | LOW | Legacy `essay_understanding.understanding` column dead but still `NOT NULL DEFAULT '{}'`. | migration 20260304000002:14 |
| D4-L2 | LOW | GIN index on `understanding` (dead column). No GIN on `profile_cache`. | migration 20260304000002:41 |
| D4-L3 | LOW | `SupabaseCheckpointStore.save` hardcodes `essay_type: 'common_app'` — flips PIQ/supplement rows on every save (cosmetic in JSON but misleading in SQL column). | supabaseCheckpointStore.ts:79 |
| D4-L4 | LOW | Server restart → fresh `revisionSessionId` on rehydrate → snapshot appended as new entry rather than replacing. Climbs to 10-cap over restarts. | essayProfileManager.ts:1015 |

### Domain 5 — Focused + Reanalysis Lifecycle

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D5-H1 | HIGH | Manifest rebuild skipped on comprehensive-deferred path. Strategic signals cleared (post-7c fix) but `improvementManifest` still anchored to pre-edit paragraph indices. | reanalysisOrchestrator.ts:1207-1228 |
| D5-H2 | HIGH | Escalated-to-comprehensive throw leaves half-updated profile: focused deltas applied, holistic not refreshed, strategic signals never cleared on this branch. | reanalysisOrchestrator.ts:1261-1274 |
| D5-H3 | HIGH | Mid-comprehensive `analyzeEssay` throw leaves coordinator with staleness marks but no re-analysis. Next session resumes from quasi-stale state. | reanalysisOrchestrator.ts:685-689 |
| D5-H4 | HIGH | `fromCheckpoint` rebuild post-reanalysis discards in-flight focused-applied deltas (applied to old coordinator, replaced by fresh coordinator from analyzeEssay). | reanalysisOrchestrator.ts:699-713 |
| D5-H5 | HIGH | L3.75 holistic synthesis called in Level 3 escalation with BLANK `holisticEvolution` (all fields undefined). Discards existing profile's holistic state entirely. Incomplete synthesis can erase good prior sections. | focusedAnalyzer.ts:1195-1201, 1254-1260 |
| D5-M6 | MED | Trivial-filter (whitespace/punct edit) still runs full focused analysis — ~$0.15 wasted per trivial edit. | editUnderstandingService.ts:1232-1275 |
| D5-M7 | MED | `debounceTimers` unhandled rejections on superseded edits. HTTP callers don't catch → unhandled rejection → Node process risk. | reanalysisOrchestrator.ts:284-289 |
| D5-M10 | MED | `runFocusedAnalysis` final fallback picks `{paragraphIndex:0, sentenceIndex:0}` when diff empty. No-op edits still fire focused pass. | focusedAnalyzer.ts:1718-1721 |
| D5-M11 | MED | Per-paragraph delta gate is OBSERVATIONAL only (telemetry test), not runtime enforced. Memory note misleading. | tests/unit/per-paragraph-delta-gate.test.ts |
| D5-M12 | MED | Ripple detection is LLM-emitted, not computed. Escalation re-evaluation is presence-of-field check, not meaningful-delta check. | focusedAnalyzer.ts:853, 1164 |
| D5-L15 | LOW | `mergedFunctions` referenced in log but undefined — ReferenceError if that code path reached. | focusedAnalyzer.ts:1403 |

### Domain 6 — Coaching Layer

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D6-H1 | **P0** | **Haiku message-classification path is DEAD CODE.** `runStage1InsightExtraction`, `runStage1_5CognitiveAssessment`, `generateMinimalResponse` defined but never invoked. Every turn hits Sonnet. Minimal "ok thanks" turns cost ~$0.01-0.02 where ~$0.001 would suffice. 5-10x overcharge. | coachingService.ts:1552, 3608, 3751 |
| D6-H2 | **P0** | **No credits deduction on `/essay-coaching/respond`.** Zero-balance users can spam Sonnet calls unbounded. Violates CLAUDE.md doctrine #4 (atomic credit deduction). | essayCoachingRoutes.ts:457-497 |
| D6-H3 | HIGH | HTTP routes return raw 500 with `error.message` — leaks Anthropic SDK errors, CoachingBlockedError details, Supabase errors to clients. | essayCoachingRoutes.ts:448-451, 493-496, 523-526 |
| D6-H4 | HIGH | `saveCoachingState` fire-and-forget. Persistent save failure → next session revives stale sessionMemory. Silent failure explicitly banned by CLAUDE.md §2. | essayCoachingRoutes.ts:148-160 |
| D6-H5 | HIGH | No session-memory compression. `events` array grows unbounded. Turn 30+ user prompts 8-12k tokens. Breaches context at long sessions. | coachingService.ts |
| D6-M1 | MED | `forbiddenPatterns.lintCoachingResponse` not called at runtime. Violations never measured in production. | forbiddenPatterns.ts:180 |
| D6-M3 | MED | Multi-essay scoping: cannot switch essays within a session. Portfolio digest runs fresh Supabase query on EACH `/respond` (but only once per `/start`). | essayCoachingRoutes.ts:472, 418 |
| D6-M4 | MED | ImprovementPhase is filter not gate. 7b/7c sections surface regardless of phase. Foundation-phase student sees rhetorical device listings they can't act on. | promptBlocks.ts:1714, 1830-1831 |
| D6-M6 | MED | `cognitiveAssessment` returned to client synthesized from sidecar — not a real Haiku call. Degrades to `"Student is ${cognitiveState}"` if innerVoice missing. | coachingService.ts:1069-1087 |
| D6-L1 | LOW | No "Luna" persona in system prompt despite LunaSprite frontend mascot. Coach introduces as "senior essay coach." | promptBlocks.ts:48 |
| D6-L2 | LOW | Technique naming rule contradicts foundation-phase jargon ban. | promptBlocks.ts:131-135, craftVocabulary |

### Domain 7 — Cost + Cache + Performance

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D7-H1 | **P0** | **`callClaudeWithRetry` default `maxRetries = 0` — zero callers use it.** Single 429/529 during L3 (7 paragraph calls sequential) fails pipeline, bills user for dead run. CLAUDE.md retry-with-backoff not applied. | claude.ts:813 |
| D7-H2 | HIGH | L3.75 prose-synthesis call has NO caching. Uses message-based interface without `cacheSystemPrompt`. ~$0.04/run waste. | holisticSynthesis.ts:3124-3131 |
| D7-H3 | HIGH | L3.75 iteration soft-ceiling $0.60, iteration cap 3. Edge cases exceed budget and truncate mid-cycle (convergence reason `budget_exhausted` silent). | growthEngine.ts:28-34 |
| D7-H4 | HIGH | AO first-read serialization (7c H1 fix) adds +2-5s to critical path. Acceptable trade for enabling Phase 3 enrichment, but Round 8 should not compound. | analysisOrchestrator.ts:730-782 |
| D7-M1 | MED | No centralized rate limiting. L3.5 + L5 per-paragraph bursts can 429 Anthropic with no local queueing. | — |
| D7-M2 | MED | L4 cache reverted (three different system prompts). ~$0.25/run on table if consolidated. | crystallizer.ts:2520-2530 |
| D7-M3 | MED | L3 walk output 3500 tokens/paragraph × 7 = $0.37 ceiling on L3 alone. Budget test verifies prefix/suffix split, not dollar ceiling. | sequentialDeepWalk.ts:99 |
| D7-M4 | MED | No cost budget test for L1, L2, L2.5, L3.5, L4, L5, AO first-read. Only L3 and L3.75 covered. | — |
| D7-M5 | MED | L2 structuralCartographer uses Sonnet — classification work, Haiku candidate. ~$0.02/run savings. | structuralCartographer.ts:31 |
| D7-L1 | LOW | `aoFirstRead.ts:635-638` hardcodes STALE Haiku pricing ($0.80 input vs current $1.00). Under-reports AO cost by ~20%. | — |

### Domain 8 — Test Coverage + Integration Gaps

| ID | Severity | Finding | File:Line |
|----|----------|---------|-----------|
| D8-H1 | **P0** | **"Orchestrator-wiring integration tests" are source-regex grep.** Never instantiate orchestrator, never await promise, never assert runtime behavior. A rename + empty-fields would pass. Same class as the bug 7c's fix was supposed to prevent. | strategic-intelligence-integration.test.ts:454-514; analytical-deepening-integration.test.ts:355-360 |
| D8-H2 | **P0** | **Zero E2E orchestrator test in CI-eligible suite.** Only E2E is `test-conversator-v2-e2e.ts` (live-LLM, manual-run, audit file diffed manually). | — |
| D8-H3 | HIGH | **Massive modules with ~zero unit coverage**: crystallizer (3064 LOC), holisticSynthesis (3387), sequentialDeepWalk (2334), analysisPass (2711), coachingService (5365), essayProfileManager (3212), mutators (~3000). | — |
| D8-H4 | HIGH | Zero DB/RLS/migration tests. The 4 Round 7a migration hotfixes tell the story of untested migration paths. | — |
| D8-H5 | HIGH | No cross-user data-isolation test. Clerk-keyed tables never verified against user A reading user B's row. Zero-tolerance fraud doctrine not automated. | — |
| D8-M4 | MED | `test-conversator-v2-e2e.ts` audit artifact (`.txt`) updated manually when someone runs it. No expected-vs-actual comparator. Silent prose degradation possible. | — |
| D8-M5 | MED | Live-LLM tests no cost budget at suite level. `tests/utils/costTracker.ts` doesn't exist. CLAUDE.md "cost tracking" partially aspirational. | — |
| D8-M6 | MED | `ao-first-read-system-prompt-golden.txt` is the only prompt-golden. `aoFirstRead.ts` modified on branch — is golden regenerated? No diff tripwire. | — |
| D8-NO-CI | **P0** | `.github/workflows/` does not exist. `package.json` has no `test` script. Enforcement is `.githooks/pre-push` only (blocks push to main, runs zero tests). | — |

---

## Cross-cutting concerns

### 1. Silent-failure anti-pattern is systemic
- D4-H1 (persistence) — try/catch log-and-continue on every checkpoint
- D4-M5 (persistence) — save errors never surfaced
- D6-H4 (coaching) — saveCoachingState fire-and-forget
- D6-M1 (coaching) — forbiddenPatterns lint informational only
- D7-H1 (LLM) — retry disabled, transient errors silent
- D8-H1 (tests) — source-regex pins give false confidence

CLAUDE.md §2 explicitly forbids silent failures. The pipeline has adopted them as a coping mechanism for unstable primitives.

### 2. Coordinator write discipline is incomplete
- D1-H1, D1-H2, D1-H3: three HIGH findings of direct profile mutation bypassing coordinator
- D4-M7: `aoFirstRead = null` direct mutation
- D4-H1: the essayId gap is itself a coordinator metadata bug

Round 8 will add `revisionPlan` to the profile. Under current discipline, it will likely inherit the same split-brain bug unless the pattern is fixed first.

### 3. Inventory-not-capability
- D3-H1 explicitly: 7b + 7c signals lose their leverage because nothing structurally gates behavior on them
- D6-M1: forbiddenPatterns is inventory too
- D2 signals (revisionIntelligence, voiceEvolution) same shape

Round 8's revision plan, if designed as "more prompt content," continues the pattern. Alternative: a structured `RevisionPlan` object returned as a first-class API response, consumed by the frontend independent of the coach.

### 4. Test-as-documentation, not test-as-gate
- D8-H1, D8-H2, D8-H3: coverage concentrated on small leaf helpers (prompt-block builders, pure-code distance math) but skips the large integration surfaces (orchestrator, crystallizer, holisticSynthesis, coaching turn)
- D8-NO-CI: no automation

Tests pin past fixes but don't protect future-state behavioral invariants.

### 5. Cost opacity
- D7-H1: transient errors bill users
- D6-H1: minimal turns billed as Sonnet
- D6-H2: zero-balance users billed
- D4-H1: failed saves waste LLM work that never persists

Actual per-student monthly cost likely exceeds plan assumptions.

---

## Round 8 Readiness Assessment

Round 8 is **personalized revision planning** — consumes 7a/7b/7c signals + coaching state to propose per-draft revision targets. Here's the readiness by domain:

| Domain | Round 8 blocker? | Fix priority |
|--------|------------------|--------------|
| Analysis Pipeline (D1) | D1-H1/H2/H3 will propagate: Round 8 will mutate profile directly | P1 |
| Historical (D2) | D2-H2/H3 semantic drift + D2-M3/M7 identical-hash — Round 8 planner will over-escalate | P1 |
| 7b+7c signals (D3) | D3-H1 signals inert, D3-H2 prompt overload compounds with 4th section | P1 |
| **Persistence (D4)** | **D4-H1 BLOCKS Round 8 entirely** — revision plans silently lose data | **P0** |
| Lifecycle (D5) | D5-H1/H2/H3 stale state after edit — Round 8 "did the revision land?" loop breaks | P1 |
| **Coaching (D6)** | **D6-H1 dead Haiku + D6-H2 no credits** — Round 8 plan delivery fails billing + cost | **P0** |
| **Cost (D7)** | **D7-H1 no retry** — Round 8 transient errors fail silently | **P0** |
| **Tests (D8)** | **D8-H1/H2/NO-CI** — Round 8 ships with no regression gate | **P0** |

### Mandatory pre-Round-8 fixes

1. **Fix D4-H1 — thread `essayId` through coordinator.** Either add `essayId` to `EssayProfileCoordinator.createNew/fromCheckpoint`, or `setEssayId()` setter called by orchestrator, or pass through `checkpoint(reason, essayId)`. Validate with a DB round-trip test.
2. **Fix D7-H1 — enable retry on `callClaude`.** Either change default `maxRetries` to 3 with exponential backoff, or migrate all call sites to `callClaudeWithRetry(..., 3)`.
3. **Fix D6-H2 — atomic credit deduction on `/essay-coaching/respond`.** Pre-call balance check + post-call debit in transaction.
4. **Fix D6-H1 — wire Haiku routing for minimal turns.** Either use the existing orphaned methods or rewrite the acknowledgment path.
5. **Fix D8-H1 — replace source-regex integration tests with runtime tests using mocked `callClaude` spy.**
6. **Add CI.** `.github/workflows/ci.yml` running `npx tsc --noEmit` + `tests/unit/run-all.ts` on every PR. Minimum bar.

### Strongly recommended pre-Round-8 hygiene

7. Fix D1-H1/H2/H3 — unify write path through coordinator. Add `applyAOFirstRead`, `applyImprovementManifest`.
8. Add profile size guard (D4-M1) — warn at 750KB, error at 2MB.
9. Fix D7-H2 — enable caching on L3.75 prose-synth (~$0.04/run savings).
10. Merge the three coach Round-7 sections into one unified "DIAGNOSTIC SNAPSHOT" frame (addresses D3-H2 overload + M1 mutual inconsistency).
11. Add `signalsReferenced: string[]` audit loop so we can measure D3-H1 inventory-vs-capability.
12. Fix D5-H1/H2 — manifest rebuild on all deferral/escalation paths.
13. Fix D6-H3/H4 — graceful error envelope + awaited persistence with error surfacing.
14. Add structural test: instantiate orchestrator, mock LLM, assert runtime enrichment population for each signal.
15. Add DB migration idempotency test + RLS cross-user isolation test.

### Prescriptive Round 8 design constraints

- Round 8's output MUST be a structured `RevisionPlan` object, not prose-only. Frontend should render independent of the coach.
- Priority cap ≤ 3 recommendations per turn (prevent overwhelm, compound with D3-H2).
- Translate analytical jargon ("unearned claim at P3S2" → "your grandmother's hands moment tells instead of shows") — deterministic mapping or LLM translation pass.
- Haiku rendering path for plan display (addresses D6-H1 + keeps per-turn cost ~$0.01).
- Feature flag + short-circuit when `improvementPhase === 'distinction'` and priorities empty.
- Budget test ≤ $0.15/call.
- Additive schema. Separate `essay_revision_plans` table with FK if plans need queryable lifecycle independent of profile blob.

---

## Prioritized Fix Backlog

### P0 — Ship-blockers for Round 8

| # | Domain | Finding | Est. Effort |
|---|--------|---------|-------------|
| 1 | Persistence | Thread `essayId` through coordinator (D4-H1) | S (half day) |
| 2 | LLM wrapper | Enable retry with backoff (D7-H1) | S |
| 3 | Coaching HTTP | Atomic credit deduction (D6-H2) | M (1 day) |
| 4 | Coaching | Wire Haiku for minimal turns (D6-H1) | M |
| 5 | Tests | Replace source-regex integration tests (D8-H1) | M |
| 6 | CI | Add GH Actions workflow for tsc + unit tests (D8-NO-CI) | S |

**Total P0: ~4-5 developer-days.**

### P1 — Hardening before Round 8 scales

| # | Domain | Finding | Est. Effort |
|---|--------|---------|-------------|
| 7 | Pipeline | Coordinator write discipline (D1-H1/H2/H3) | L (2-3 days) |
| 8 | Coaching | Graceful error envelope + awaited persist (D6-H3/H4) | M |
| 9 | Coaching | Session memory compression (D6-H5) | M |
| 10 | Lifecycle | Manifest rebuild on deferral paths (D5-H1/H2) | M |
| 11 | Lifecycle | L3.75 holistic synthesis blank-state bug (D5-H5) | M |
| 12 | Persistence | Size guard + SHA function consolidation (D4-M1, D4-H4) | S |
| 13 | Cost | L3.75 prose-synth caching (D7-H2) | S |
| 14 | Tests | DB migration + RLS isolation tests (D8-H4/H5) | L |
| 15 | 7b+7c | Merge 3 sections → 1 "DIAGNOSTIC SNAPSHOT" (D3-H2) | M |

**Total P1: ~8-10 developer-days.**

### P2 — Quality / robustness

- Historical snapshot per-paragraph fire (D2-H1) — compute once per analysis cycle
- `sessionsPersisted` rename to `consecutiveWriteCycles` (D2-H2)
- Severity signal for 7a snapshots (D2-H3)
- `aggregateDistance` smoothing (D3-M4)
- Named constants for 7b/7c thresholds (D3-M5)
- Trivial-edit skip gate (D5-M6)
- `forbiddenPatterns` runtime post-hoc lint (D6-M1)
- Cost budget tests for L1, L2, L2.5, L3.5, L4, L5, AO (D7-M4)
- L2 Haiku migration (D7-M5)
- AO stale pricing constants (D7-L1)

**Total P2: ~4-5 developer-days.**

### P3 — Polish

- Dead schema trim (D3-L1/L2/L4/L5)
- `essay_type` hardcoded default fix (D4-L3)
- `revisionSessionId` UUID (D2-M2)
- Luna persona in coach prompt (D6-L1)
- L4 ambiguous lineage (D1-M5)

---

## Recommendation

**Do NOT ship Round 8 on current foundation.**

Execute P0 (~5 dev-days) before Round 8 implementation starts. Execute P1 (~10 dev-days) in parallel with Round 8 design. P2/P3 can ship with or after Round 8.

Alternative read: Round 8 as currently scoped (personalized revision planning consuming 7a/7b/7c signals) is blocked on D4-H1 alone. Even if you shipped Round 8 tomorrow, its central output — the plan itself — would not persist across sessions. Nothing else in this audit matters as much as fixing the persistence pipe.

**Suggested path forward:**

1. **Week 1** — P0 fixes + CI stand-up. Single "Round 7 Hardening" PR.
2. **Week 2** — P1 hardening + Round 8 design doc / forge-plan.
3. **Week 3+** — Round 8 implementation on a foundation that actually holds state.

This audit is the stock-taking pass. The next decision — which P0/P1 items to fix, in what order, under what owner — is yours.

---

*Audit produced 2026-04-17 via 8 parallel domain agents. Source reports available at `/private/tmp/claude-501/.../tasks/` (transient). All findings cite `file:line`. No code modifications made.*
