# Writing System Improvement — Chat Implementation Guide

> **Purpose**: Context handoff document with pre-built prompts for 4 implementation chats.
> **Created**: 2026-02-19
> **Status**: Ready to execute

---

## Prerequisites

Before starting any chat, ensure you have:
- All 5 analysis reports in `docs/analysis/`:
  - `ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md` (500 lines) — Activity system deep dive
  - `PIQ_WORKSHOP_WRITING_ANALYSIS.md` (502 lines) — PIQ system deep dive
  - `COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md` (627 lines) — Common App system deep dive
  - `WRITING_IMPROVEMENT_ROADMAP.md` (1,618 lines) — Master implementation plan
  - `SUCCESS_CRITERIA_AND_VALIDATION.md` — Success metrics, quality gates, validation tests, progress tracker

---

## Shared Context for ALL Chats

Paste this block at the start of each chat so Claude has the full picture:

```
## PROJECT CONTEXT — Writing Quality Improvement Initiative

We are upgrading Uplift's 3 writing workshop systems (Activity Workshop, PIQ Workshop, Common App Workshop) to match and exceed type.ai-level writing quality while being more cost-effective.

### Key Analysis Reports (read these first)
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` — Master implementation plan with types, specs, file paths
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` — Success metrics, quality gates, validation tests for every feature
- `docs/analysis/ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md` — Activity system deep dive
- `docs/analysis/PIQ_WORKSHOP_WRITING_ANALYSIS.md` — PIQ system deep dive
- `docs/analysis/COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md` — Common App system deep dive

### Current Gaps vs Type.ai (priority order)
1. **Inline editing commands** — 0/5, no targeted editing at all
2. **Unified voice profile** — 3 workshops, 3 incompatible voice schemas
3. **RAG with examples** — all teaching content is static, no vector retrieval
4. **Story mining engine** — no dedicated brainstorming flow
5. **Analytics/feedback loops** — no tracking of what actually helps students

### Current Strengths (already exceed type.ai)
- Rubric-based critique: 10-13 dimension rubrics with prompt-specific weights
- Anti-cliché/banned terms: 500+ patterns, semantic analysis
- Teaching philosophy: celebration → explain → transform → practice
- Domain expertise: college-specific research, admissions knowledge bases

### Architecture Quick Reference
- Stack: TypeScript strict, Express (8789), React 18/Vite, Supabase PG, Clerk, Anthropic Claude
- Models: Sonnet (`claude-sonnet-4-5-20250929`) for quality, Haiku (`claude-haiku-4-5-20251001`) for speed
- LLM wrapper: `src/lib/llm/claude.ts` + `src/lib/llm/unified.ts`
- Service pattern: class + singleton export, types in `types.ts`, index for re-exports

### Known Bugs to Fix
- Stale model ID: `claude-sonnet-4-5-20250514` → `claude-sonnet-4-5-20250929` in multiple files
- 3 files with @ts-nocheck in PIQ: piqDatabaseService.ts, piqWorkshopAnalysisService.ts, issuePatterns.ts
- PIQ issuePatterns.ts uses `thematic_coherence` dimension not in type union
```

---

## Chat 1: Foundation & Quick Wins + Shared Type Infrastructure

### When to Run
First. Everything else depends on this.

### Goal
Fix existing bugs, enable prompt caching for 30-40% cost reduction, and build the shared type foundations that all later phases depend on.

### Prompt

```
Read these analysis reports first — they contain the full context for what we're building:
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` (master plan — READ ALL OF IT, especially Sections 2, 5, 6, 7, 8, 11, 12)
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` (success metrics — READ Section 2 for Phase 0 gates, Section 3 for Phase 1 gates, Section 7 for cross-cutting gates)
- `docs/analysis/ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/PIQ_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md`

This is Chat 1 of 4 in our writing quality improvement initiative. We need to:

## Phase 0: Quick Wins (~1.5 days)

### 0A. Fix Model ID Inconsistency
Find and fix ALL instances of `claude-sonnet-4-5-20250514` → `claude-sonnet-4-5-20250929` across the codebase. Known locations:
- `src/services/commonAppWorkshop/services/techniqueSuggestionRouter.ts`
- `src/services/commonAppWorkshop/services/batchGenerationService.ts`
- `src/services/commonAppWorkshop/services/stage0Service.ts` (if present)
- `src/services/commonAppWorkshop/services/stage1ConsolidatedService.ts` (if present)
- PIQ Supabase edge functions (`supabase/functions/`)
- Any other files — do a full grep

### 0B. Enable Prompt Caching on All Sonnet Calls
Add `cacheSystemPrompt: true` to every Sonnet call that has a stable (non-per-request) system prompt. Key files:
- Activity: `stage1ContextAwareAnalysisService.ts`, `stage2ConditionalTeachingService.ts`, `scoringOrchestrator.ts`
- Common App: `batchGenerationService.ts`, `semanticScoringService.ts` (if not already cached)
- PIQ: edge functions (`workshop-analysis/`, `teaching-layer/`, `validate-workshop/`)

### 0C. Fix PIQ Type Issues
- Remove @ts-nocheck from: `piqDatabaseService.ts`, `piqWorkshopAnalysisService.ts`, `issuePatterns.ts`
- Fix underlying type errors properly
- Fix `thematic_coherence` dimension reference in issuePatterns.ts

## Phase 1A: Shared Type Infrastructure (~1 day)

Build the foundational types and services that Chats 2-4 will consume:

### 1. StudentVoiceProfile Type System
Create `src/services/voiceProfile/types.ts` with the `StudentVoiceProfile` interface from the roadmap (Section 2). This is the unified voice profile that replaces 3 incompatible schemas.

### 2. VoiceProfileService (core only)
Create `src/services/voiceProfile/voiceProfileService.ts` with:
- `buildFromSample()` — Haiku call to analyze writing and produce StudentVoiceProfile
- `getPromptSummary()` — token-efficient summary for prompt injection
- `fromCommonAppFingerprint()`, `fromActivityChatFingerprint()`, `fromPIQFingerprint()` — converters from existing formats
- `save()` / `load()` — Supabase persistence

### 3. Database Migration
Create `supabase/migrations/XXX_add_voice_profiles.sql` for the voice_profiles table.

### 4. InlineEditRequest/Result Types
Create `src/services/inlineEditor/types.ts` with EditingCommand union type, InlineEditRequest, InlineEditResult from the roadmap (Section 5). These types will be implemented in Chat 2.

### 5. RAG Types (stubs)
Create `src/services/rag/types.ts` with RAGResult, RAGTransformation, RAGEssayFragment from the roadmap (Section 4). Implementation in Chat 3.

### 6. Analytics Types (stubs)
Create `src/services/analytics/types.ts` with the analytics event types from the roadmap (Section 10). Implementation in Chat 4.

## Swarm Configuration: 3 Agents

Spin up a swarm with these 3 named agents working in parallel:

### Agent: "fixer" (general-purpose)
**Focus**: Phase 0 quick wins — all bug fixes and caching
**Owns these files**:
- `src/services/commonAppWorkshop/services/techniqueSuggestionRouter.ts` — model ID fix
- `src/services/commonAppWorkshop/services/batchGenerationService.ts` — model ID fix + prompt caching
- `src/services/commonAppWorkshop/services/stage0Service.ts` — model ID fix
- `src/services/commonAppWorkshop/services/stage1ConsolidatedService.ts` — model ID fix
- `src/services/commonAppWorkshop/services/semanticScoringService.ts` — prompt caching
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts` — prompt caching
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts` — prompt caching
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts` — prompt caching
- `supabase/functions/workshop-analysis/index.ts` — model ID + caching
- `supabase/functions/teaching-layer/index.ts` — caching
- `supabase/functions/validate-workshop/index.ts` — model routing
- Any other files with stale model IDs (full codebase grep first)
- PIQ files: remove @ts-nocheck from `piqDatabaseService.ts`, `piqWorkshopAnalysisService.ts`, `issuePatterns.ts` and fix underlying type errors
**Tasks**: (1) grep + fix all `20250514` → `20250929`, (2) add `cacheSystemPrompt: true` to all stable Sonnet calls, (3) fix PIQ type issues
**Done when**: `grep "20250514"` returns 0, `grep "ts-nocheck" src/services/piq` returns 0, `npx tsc --noEmit` passes

### Agent: "voice-architect" (general-purpose)
**Focus**: Voice profile service + database migration
**Creates these files**:
- `src/services/voiceProfile/types.ts` — StudentVoiceProfile interface (from roadmap Section 2)
- `src/services/voiceProfile/voiceProfileService.ts` — buildFromSample(), enrichProfile(), getPromptSummary(), save()/load(), format converters
- `src/services/voiceProfile/index.ts` — re-exports
- `supabase/migrations/XXX_add_voice_profiles.sql` — voice_profiles table with RLS
**Tasks**: (1) Create full type system, (2) Implement service with Haiku profiling call, (3) Implement Supabase persistence, (4) Implement converters from CommonApp/Activity/PIQ fingerprint formats
**Done when**: Types compile, service has working buildFromSample + save/load, migration SQL is valid

### Agent: "type-scaffolder" (general-purpose)
**Focus**: Type stubs for all future phases
**Creates these files**:
- `src/services/inlineEditor/types.ts` — EditingCommand union (15 commands), InlineEditRequest, InlineEditResult (from roadmap Section 5)
- `src/services/rag/types.ts` — RAGResult, RAGTransformation, RAGEssayFragment (from roadmap Section 4)
- `src/services/analytics/types.ts` — WritingAnalyticsEvent, PromptEffectiveness, VersionComparison (from roadmap Section 10)
- `src/services/storyMining/types.ts` — StorySeed, StoryMiningResult (from roadmap Section 3)
- `src/services/authenticity/types.ts` — AIRiskAssessment (from roadmap Section 7)
- `src/services/sessionContext/types.ts` — DocumentSession, EditRecord (from roadmap Section 9)
- Index files for each new service directory
**Tasks**: (1) Read roadmap Sections 2-10 for all type specs, (2) Create complete type files with JSDoc, (3) Create index.ts for each
**Done when**: All type files exist, `npx tsc --noEmit` passes, all types match roadmap specs

Run `npx tsc --noEmit` after all 3 agents complete to verify combined type safety.

## Validation (from SUCCESS_CRITERIA_AND_VALIDATION.md, Section 2)

Before considering this chat complete, verify ALL Phase 0 + Phase 1A gates:
- `grep -r "20250514" src/ supabase/ --include="*.ts"` returns 0 results
- `grep -r "ts-nocheck" src/services/piq` returns 0 results
- `npx tsc --noEmit` passes with zero errors
- All existing tests still pass
- Prompt caching: second run of same pipeline costs < 70% of first run

Update the Progress Tracker in `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` Section 10 (Phase 0 and Phase 1 checkboxes) with results.
```

### Expected Output
- All model IDs fixed
- Prompt caching enabled (~30-40% cost reduction)
- PIQ type issues resolved
- `src/services/voiceProfile/` — complete service + types
- `src/services/inlineEditor/types.ts` — type stubs
- `src/services/rag/types.ts` — type stubs
- `src/services/analytics/types.ts` — type stubs
- `supabase/migrations/XXX_add_voice_profiles.sql`
- Clean `npx tsc --noEmit`

---

## Chat 2: Inline Editing + Voice Integration + Authenticity

### When to Run
After Chat 1 is committed and verified.

### Goal
Build the inline editing system (biggest type.ai gap), integrate voice profiles into all workshops, and add authenticity scoring.

### Prompt

```
Read these analysis reports for full context:
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` (Sections 5, 6, 7, 9 are most relevant)
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` (Section 4 for Phase 2 gates, Section 8 for Type.ai scorecard)
- `docs/analysis/ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/PIQ_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md`

This is Chat 2 of 4. Chat 1 has already been completed — the following now exist:
- `src/services/voiceProfile/` — StudentVoiceProfile type + VoiceProfileService + DB migration
- `src/services/inlineEditor/types.ts` — EditingCommand, InlineEditRequest, InlineEditResult types
- All model IDs are fixed, prompt caching is enabled

We now need to build:

## Phase 2A: Inline Editing System (~5 days)

### 1. InlineEditorService
Create `src/services/inlineEditor/inlineEditorService.ts`:
- `applyCommand(request: InlineEditRequest): Promise<InlineEditResult>` — apply an editing command
- `suggestCommands(selectedText, fullDocument, essayType?): Promise<CommandSuggestion[]>` — suggest 2-3 best commands for a selection
- Uses Haiku for speed (< 3s), Sonnet for complex commands (deepen_vulnerability, connect_to_theme)
- Generates 2 alternatives: primary (safe) + creative (bolder)
- Includes teachingNote + transferable principle

### 2. Command Prompt Templates
Create `src/services/inlineEditor/commandPrompts.ts`:
- 15 command-specific prompt templates (see roadmap Section 5 for the full list)
- Each template: ~300 token system prompt + voice constraint block + banned terms + RAG slot
- Template for: make_concrete, show_dont_tell, clarify_learning, add_stakes, strengthen_voice, cut_filler, add_evidence, deepen_vulnerability, connect_to_theme, fix_hook, sharpen_ending, expand_moment, compress, add_dialogue, remove_cliche

### 3. SessionContextService
Create `src/services/sessionContext/sessionContextService.ts`:
- `startSession()` — create/resume editing session
- `updateDocument()` — update text, invalidate stale analysis cache
- `getDocumentContextBlock()` — compact 200-300 token context block for LLM prompts
- `recordEdit()` — track edit history (accepted/rejected)

### 4. StyleConsistencyService
Create `src/services/voiceProfile/styleConsistencyService.ts`:
- `quickVoiceCheck()` — heuristic check (banned terms, sentence length deviation, formality mismatch). NO LLM cost.
- `buildVoiceConstraintBlock()` — standard voice constraint block for all prompts
- `validateVoiceConsistency()` — optional LLM validation for high-stakes outputs

### 5. AIRiskScorer
Create `src/services/authenticity/aiRiskScorer.ts`:
- Pure heuristic scorer (NO LLM cost, < 50ms)
- Scores: vocabulary uniformity, sentence length variance, generic reflection density, banned terms, cliché density, hedging density, adverb density
- Returns AIRiskAssessment with flaggedPassages and personalization suggestions

### 6. Voice Profile Integration into All Workshops
- Common App: Load voice profile in `evolvedWorkshopOrchestrator.ts`, pass to Stage 0 (skip excavation if confident) and Stage 2 (inject into suggestion prompts via `batchGenerationService.ts`)
- Activity: Load in `activityWorkshopService.ts`, pass to Stage 2 teaching prompts, initialize chat from profile in `dynamicConversationEngine.ts`
- PIQ: Load in `piqChatContext.ts`, include in chat system prompt

### 7. API Endpoints
Add to `src/http/routes.ts`:
- `POST /api/inline-edit` — apply editing command
- `POST /api/inline-edit/suggest-commands` — suggest commands for selection
- `POST /api/authenticity-check` — run AI risk scorer
- `GET/PUT /api/voice-profile` — get/update voice profile

## Swarm Configuration: 3 Agents

### Agent: "inline-editor" (general-purpose)
**Focus**: The core inline editing system — the biggest type.ai gap to close
**Creates these files**:
- `src/services/inlineEditor/inlineEditorService.ts` — applyCommand() + suggestCommands()
- `src/services/inlineEditor/commandPrompts.ts` — 15 command-specific prompt templates
- `src/services/sessionContext/sessionContextService.ts` — startSession(), updateDocument(), getDocumentContextBlock(), recordEdit()
- `src/services/sessionContext/index.ts`
- `src/services/inlineEditor/index.ts`
**Reads**: roadmap Section 5 (Inline Editing), Section 9 (Document-Context), Section 12 Spec 2 (command prompt template)
**Tasks**: (1) Build 15 command prompt templates with voice constraint slot + RAG slot + banned terms, (2) Implement InlineEditorService with Haiku for simple commands / Sonnet for complex, (3) Implement SessionContextService for document-level awareness, (4) Ensure dual alternatives (primary safe + creative bold) on every command
**Done when**: All 15 commands can be called with test input and return valid InlineEditResult JSON, response time < 3s for Haiku commands

### Agent: "voice-integrator" (general-purpose)
**Focus**: Style consistency, authenticity scoring, and wiring voice profiles into all 3 workshops
**Creates these files**:
- `src/services/voiceProfile/styleConsistencyService.ts` — quickVoiceCheck(), buildVoiceConstraintBlock(), validateVoiceConsistency()
- `src/services/authenticity/aiRiskScorer.ts` — pure heuristic scorer (NO LLM calls)
- `src/services/authenticity/index.ts`
**Modifies these files** (voice profile integration):
- `src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator.ts` — load voice profile, pass to Stage 0 + Stage 2
- `src/services/commonAppWorkshop/services/batchGenerationService.ts` — inject voice constraint block into suggestion prompts
- `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts` — load voice profile, pass to Stage 2
- `src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts` — initialize chat voice from profile
- `src/services/piqWorkshop/piqChatContext.ts` — include voice profile in system prompt
**Reads**: roadmap Section 6 (Style Layer), Section 7 (Anti-AI-Detection), Section 12 Spec 4 (heuristic signals)
**Tasks**: (1) Build heuristic voice check (banned terms, sentence length, formality), (2) Build AI risk scorer with 7 heuristic signals, (3) Wire voice profile loading + injection into all 3 workshop orchestrators
**Done when**: quickVoiceCheck catches planted violations, AIRiskScorer separates AI from human text, all 3 workshops load and use voice profiles

### Agent: "api-tester" (general-purpose)
**Focus**: API endpoints + validation test files
**Modifies**:
- `src/http/routes.ts` — add endpoints: POST /api/inline-edit, POST /api/inline-edit/suggest-commands, POST /api/authenticity-check, GET /api/voice-profile, PUT /api/voice-profile
**Creates test files**:
- `tests/test-voice-profile-accuracy.ts` — 10 diverse samples, 80%+ agreement with human labels
- `tests/test-voice-preservation.ts` — profiled vs non-profiled output comparison
- `tests/test-voice-cross-workshop.ts` — same profile across all 3 workshops
- `tests/test-inline-editing-e2e.ts` — all 15 commands on 5 test passages each
- `tests/test-ai-risk-scorer.ts` — 10 AI essays vs 10 human essays
- `tests/test-style-consistency.ts` — false positive/true positive rates
**Reads**: SUCCESS_CRITERIA_AND_VALIDATION.md Sections 3 + 4 for exact pass/fail criteria
**Tasks**: (1) Add all API endpoints with proper request validation, (2) Write all 6 test files with exact pass criteria from success doc, (3) Run tests and report results
**Done when**: All endpoints respond correctly, test files exist and can be run (passing depends on other agents' work being complete)

Run `npx tsc --noEmit` after all 3 agents complete.

## Validation (from SUCCESS_CRITERIA_AND_VALIDATION.md, Sections 3-4)

Before considering this chat complete, verify ALL Phase 1 + Phase 2 gates:

Voice System (Phase 1):
- Voice profile accuracy: 80%+ agreement with human labels on 10 test samples
- Voice preservation: profiled output has lower voice deviation than non-profiled
- Cross-workshop: voice metrics within 20% across all 3 workshops
- Persistence: save/load roundtrip works correctly

Inline Editing (Phase 2):
- All 15 commands pass on 4/5 test passages each
- p95 response time: < 3s (Haiku commands), < 5s (Sonnet commands)
- AI risk scorer: mean gap > 30 points between AI-generated and human text
- quickVoiceCheck: < 10% false positive rate, > 80% true positive on violations
- Voice-profiled inline edits pass quickVoiceCheck in 90%+ of cases

Create these test files: test-voice-profile-accuracy.ts, test-voice-preservation.ts, test-voice-cross-workshop.ts, test-inline-editing-e2e.ts, test-ai-risk-scorer.ts, test-style-consistency.ts

Update the Progress Tracker in `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` Section 10 (Phase 1 and Phase 2 checkboxes).
Update the Type.ai Parity Scorecard in Section 8 with actual scores.
```

### Expected Output
- `src/services/inlineEditor/` — complete service with 15 commands
- `src/services/sessionContext/` — document session management
- `src/services/voiceProfile/styleConsistencyService.ts`
- `src/services/authenticity/` — heuristic AI risk scorer
- Voice profiles flowing into all 3 workshops
- New API endpoints
- Clean type check

---

## Chat 3: RAG Layer + Story Mining

### When to Run
After Chat 2 is committed and verified.

### Goal
Build the RAG system with pgvector for example-backed teaching, and the story mining engine for brainstorming.

### Prompt

```
Read these analysis reports for full context:
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` (Sections 3, 4, 12 are most relevant)
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` (Section 5 for Phase 3 gates)
- `docs/analysis/ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/PIQ_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md`

This is Chat 3 of 4. Chats 1-2 have been completed — we now have:
- Voice profile system (types, service, DB, integrated into all workshops)
- Inline editing system (15 commands, session context, API endpoints)
- Style consistency + AI risk scorer
- All model IDs fixed, prompt caching enabled
- Type stubs exist at `src/services/rag/types.ts`

We now need to build:

## Phase 3A: RAG Layer (~5-6 days)

### 1. Database Schema
Create `supabase/migrations/XXX_add_rag_embeddings.sql`:
- Enable pgvector extension
- `rag_essay_fragments` table with vector(1536) embeddings, metadata columns (essay_type, prompt_type, dimension, quality_tier, college, technique, why_it_works, transferable_principle)
- `rag_transformations` table with before/after text + embeddings, effectiveness_score
- HNSW indexes for fast similarity search
- RLS policies

### 2. RAGService
Implement `src/services/rag/ragService.ts` (types already exist):
- `retrieveExamples()` — pgvector similarity search with metadata filtering
- `retrieveTransformations()` — find relevant before/after pairs
- `formatForPrompt()` — format retrieved results as abstracted patterns (NEVER copy language)
- `addExample()` — embed and store new content
- Embedding: Use Anthropic's or OpenAI's embedding API (text-embedding-3-small, 1536 dims)

### 3. Content Migration (ragSeeder.ts)
Create `src/services/rag/ragSeeder.ts` to migrate existing static content to pgvector:
- Common App college research files (10+ files in `services/` referencing college data) → rag_essay_fragments
- PIQ teaching examples → rag_transformations
- Activity expert knowledge base content → rag_essay_fragments
- Common App transformation examples → rag_transformations
- Estimated: ~500 fragments, ~100 transformations
- Run as one-time migration script

### 4. RAG Integration into Workshops
- Common App Stage 2 (`batchGenerationService.ts`): Retrieve 2-3 relevant fragments for each issue's dimension, inject as "Here is how strong essays handle [dimension]..."
- PIQ (`piqChatContext.ts` + edge functions): Retrieve teaching transformations for detected issues
- Activity Stage 2 (`stage2ConditionalTeachingService.ts`): Retrieve description transformations matching improvement areas
- Inline Editor (`inlineEditorService.ts`): Retrieve targeted transformations for the specific editing command

## Phase 3B: Story Mining Engine (~3-4 days)

### 5. StoryMiningService
Implement `src/services/storyMining/storyMiningService.ts`:
- `mineStories()` — extract story moments from activity profiles + chat histories
  - Haiku pass 1: Extract 8-12 specific moments (decisions, conflicts, emotions)
  - Haiku pass 2: Cluster by theme, score distinctiveness
  - Sonnet pass: Rank top seeds per target prompt, suggest narrative angles
- `deepenSeed()` — interactive follow-up for a specific story seed
- `rankForPrompt()` — re-rank seeds for a specific prompt

### 6. Story Mining Types
Enhance `src/services/storyMining/types.ts` (may already have stubs) with StorySeed, StoryMiningResult, including distinctiveness scoring, prompt fit, narrative angles, seed quotes.

### 7. API Endpoints
Add to `src/http/routes.ts`:
- `POST /api/story-mining/mine` — run full story mining
- `POST /api/story-mining/deepen` — deepen a specific seed
- `POST /api/story-mining/rank` — rank seeds for a prompt

## Swarm Configuration: 4 Agents

### Agent: "rag-builder" (general-purpose)
**Focus**: RAG database schema + core RAGService
**Creates these files**:
- `supabase/migrations/XXX_add_rag_embeddings.sql` — pgvector extension, rag_essay_fragments table (vector(1536), metadata columns), rag_transformations table, HNSW indexes, RLS policies
- `src/services/rag/ragService.ts` — retrieveExamples(), retrieveTransformations(), formatForPrompt(), addExample()
- `src/services/rag/index.ts`
**Reads**: roadmap Section 4 (RAG Layer), Section 12 Spec 3 (retrieval query example)
**Tasks**: (1) Create pgvector migration with proper indexes, (2) Implement similarity search with metadata filtering, (3) Implement formatForPrompt that abstracts patterns (NEVER copies language — check for quoted phrases > 8 words), (4) Choose embedding approach (OpenAI text-embedding-3-small or Anthropic)
**Done when**: Migration applies cleanly, RAGService can embed + retrieve test data, formatForPrompt output < 300 tokens per 3 examples

### Agent: "content-migrator" (general-purpose)
**Focus**: Extract all existing static teaching content and seed into pgvector
**Creates**:
- `src/services/rag/ragSeeder.ts` — one-time migration script
**Reads ALL of these for extractable content**:
- Common App college research files (all files in `src/services/commonAppWorkshop/services/` referencing college data, dean quotes, examples, principles)
- PIQ teaching examples (`src/services/piq/teachingExamples.ts` or similar)
- Activity expert knowledge base (`src/services/portfolioStrategy/services/activityWorkshop/` — counselor insights, expertise data)
- Common App transformation examples (before/after pairs in technique system)
**Tasks**: (1) Read ALL static content sources, catalog what exists, (2) Extract and tag each fragment (essay_type, prompt_type, dimension, quality_tier, technique, why_it_works, transferable_principle), (3) Build seeder script that embeds and inserts, (4) Target: 400+ fragments, 80+ transformations
**Done when**: Seeder runs without error, `SELECT COUNT(*) FROM rag_essay_fragments` >= 400, all rows have non-null embeddings and complete metadata

### Agent: "story-miner" (general-purpose)
**Focus**: Story mining service — extraction, clustering, ranking
**Creates these files**:
- `src/services/storyMining/storyMiningService.ts` — mineStories(), deepenSeed(), rankForPrompt()
- `src/services/storyMining/index.ts`
**Reads**: roadmap Section 3 (Story Mining), Section 12 Spec 5 (extraction + ranking prompts)
**Tasks**: (1) Implement 3-pass pipeline: Haiku extraction → Haiku clustering/distinctiveness → Sonnet ranking, (2) Each StorySeed must have: specific moment, emotionalCore, distinctiveness score, reflectionDepth score, promptFit scores, narrativeAngles, seedQuotes, (3) mineStories should extract 8-12 moments from activity profiles, (4) rankForPrompt should produce different top seeds for different prompts
**Done when**: mineStories returns 8-12 seeds from test input, seeds have all required fields, ranking produces different top picks per prompt

### Agent: "integrator" (general-purpose)
**Focus**: Wire RAG + Story Mining into all workshops + API endpoints
**Modifies these files**:
- `src/services/commonAppWorkshop/services/batchGenerationService.ts` — inject RAG context ("Here is how strong essays handle [dimension]...") into suggestion prompts
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts` — inject RAG transformations for description improvement areas
- `src/services/piqWorkshop/piqChatContext.ts` — add RAG example retrieval for teaching
- `src/services/inlineEditor/inlineEditorService.ts` — add RAG transformation retrieval per editing command
- `src/http/routes.ts` — add POST /api/story-mining/mine, POST /api/story-mining/deepen, POST /api/story-mining/rank
**Creates test files**:
- `tests/test-rag-retrieval-e2e.ts` — relevance in 8/10 queries, diversity, no language copying
- `tests/test-rag-teaching-impact.ts` — A/B comparison: RAG-enhanced vs plain teaching
- `tests/test-story-mining-e2e.ts` — 8 activity profiles, moment quality, ranking correlation
**Reads**: SUCCESS_CRITERIA_AND_VALIDATION.md Section 5 for exact pass/fail criteria
**Tasks**: (1) Add RAG retrieval calls to all 3 workshop suggestion/teaching stages, (2) Add story mining API endpoints, (3) Write all 3 test files with exact criteria from success doc
**Done when**: All workshops include RAG context in prompts, API endpoints respond correctly, test files exist and run

Run `npx tsc --noEmit` after all 4 agents complete.

## Validation (from SUCCESS_CRITERIA_AND_VALIDATION.md, Section 5)

Before considering this chat complete, verify ALL Phase 3 gates:

RAG Layer:
- RAG retrieval: relevant results in 8/10 test queries
- RAG teaching impact: enhanced output preferred in 7/10 blind comparisons
- Content seeded: 400+ fragments, 80+ transformations, all with embeddings
- formatForPrompt output < 300 tokens, contains no copied phrases > 8 words
- Top-3 results diverse (pairwise similarity < 0.85)

Story Mining:
- Extracts 8-12 specific moments from 8 activity profiles
- Distinctiveness ranking correlates with human judgment (Spearman r > 0.6)
- Top-ranked seed differs per prompt (not same seed wins all)
- Coverage: moments from 80%+ of provided activities

Create these test files: test-rag-retrieval-e2e.ts, test-rag-teaching-impact.ts, test-story-mining-e2e.ts

Update the Progress Tracker in `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` Section 10 (Phase 3 checkboxes).
Update the Type.ai Parity Scorecard in Section 8 with actual scores.
```

### Expected Output
- `supabase/migrations/XXX_add_rag_embeddings.sql` — pgvector schema
- `src/services/rag/` — complete RAG service + seeder
- `src/services/storyMining/` — complete story mining service
- RAG integrated into all workshop suggestion/teaching prompts
- New API endpoints
- Clean type check

---

## Chat 4: Analytics + Polish + E2E Validation

### When to Run
After Chat 3 is committed and verified.

### Goal
Build the analytics/feedback loop system, run comprehensive E2E validation across all systems, and polish any rough edges.

### Prompt

```
Read these analysis reports for full context:
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` (Section 10 is most relevant)
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` (Section 6 for Phase 4 gates, Section 8 for FINAL Type.ai scorecard, Section 9 for full test suite, Section 1 for North Star metrics)
- `docs/analysis/ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/PIQ_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md`

This is Chat 4 of 4 (final). Chats 1-3 have been completed — we now have:
- Voice profile system (unified, persistent, integrated into all workshops)
- Inline editing system (15 commands, session context, authenticity scoring)
- RAG layer (pgvector, example retrieval, integrated into workshop prompts)
- Story mining engine (moment extraction, clustering, prompt-fit ranking)
- All model IDs fixed, prompt caching enabled, style consistency service

We now need to build:

## Phase 4A: Analytics System (~3-4 days)

### 1. Database Schema
Create `supabase/migrations/XXX_add_analytics.sql`:
- `writing_analytics` table (event-based: suggestion_shown, suggestion_accepted/rejected, score_change, inline_edit, command_used)
- `prompt_effectiveness` table (aggregated: prompt_hash, acceptance rate, avg score improvement)
- Indexes for efficient querying by user, session, event type

### 2. WritingAnalyticsService
Implement `src/services/analytics/writingAnalyticsService.ts` (types already exist):
- Track: suggestion shown/accepted/rejected, score changes, inline edits, command usage
- Query: acceptance rates, most-used commands, average score improvement
- Prompt effectiveness aggregation

### 3. VersionComparisonService
Implement `src/services/analytics/versionComparisonService.ts`:
- Compare two essay versions using cached analysis scores (no LLM cost)
- Show per-dimension score deltas, improvements, regressions
- Identify most impactful edit

### 4. Analytics Integration
Add tracking calls to:
- Common App Stage 2 suggestions → trackSuggestionShown
- PIQ teaching output → trackSuggestionShown
- Activity Stage 2 description optimization → trackSuggestionShown
- Inline editor → trackInlineEdit (command + accepted/rejected)
- All workshops → trackScoreChange on re-analysis

### 5. API Endpoints
Add to `src/http/routes.ts`:
- `GET /api/analytics/acceptance-rate` — suggestion acceptance rates
- `GET /api/analytics/commands` — most-used inline commands
- `GET /api/analytics/score-improvement` — average score improvements
- `POST /api/analytics/compare-versions` — version comparison

## Phase 4B: E2E Validation & Polish (~2 days)

### 6. Comprehensive Type Check
Run `npx tsc --noEmit` across the full codebase and fix any issues.

### 7. E2E Test: Inline Editing
Create `tests/test-inline-editing-e2e.ts`:
- Test all 15 editing commands with sample text
- Verify voice preservation (generate edits with voice profile, check consistency)
- Verify response time < 3s for Haiku commands
- Verify dual alternatives (primary + creative)

### 8. E2E Test: Voice Profile
Create `tests/test-voice-profile-e2e.ts`:
- Build profile from sample text
- Verify profile persistence (save/load)
- Verify prompt summary generation
- Verify cross-workshop consistency (same profile produces similar voice in all workshops)

### 9. E2E Test: RAG
Create `tests/test-rag-retrieval-e2e.ts`:
- Seed test data
- Verify similarity search returns relevant results
- Verify formatForPrompt produces usable output
- Verify no language copying (abstracted patterns only)

### 10. E2E Test: Story Mining
Create `tests/test-story-mining-e2e.ts`:
- Mine stories from sample activity profiles
- Verify distinctiveness scoring
- Verify prompt-fit ranking
- Verify narrative angle suggestions

### 11. Cost Validation
Run cost comparison: same inputs through old pipeline vs new pipeline, verify cost reduction targets (~45%).

## Swarm Configuration: 4 Agents

### Agent: "analytics-builder" (general-purpose)
**Focus**: Analytics database schema + core services
**Creates these files**:
- `supabase/migrations/XXX_add_analytics.sql` — writing_analytics table (event-based), prompt_effectiveness table (aggregated), indexes for user/session/type
- `src/services/analytics/writingAnalyticsService.ts` — trackSuggestionShown/Accepted/Rejected(), trackScoreChange(), trackInlineEdit(), getAcceptanceRate(), getMostUsedCommands(), getAverageScoreImprovement()
- `src/services/analytics/versionComparisonService.ts` — compareVersions() using cached scores (NO LLM cost), returns per-dimension deltas, improvements, regressions, mostImpactfulEdit
- `src/services/analytics/index.ts`
**Reads**: roadmap Section 10 (Feedback Loops & Analytics)
**Tasks**: (1) Create migration with proper indexes + RLS, (2) Implement event tracking with < 50ms overhead, (3) Implement aggregation queries, (4) Implement version comparison using cached analysis scores
**Done when**: Migration applies, tracking creates DB rows, aggregations return correct results on test data, version comparison produces accurate deltas

### Agent: "analytics-integrator" (general-purpose)
**Focus**: Wire analytics tracking into every suggestion/editing flow
**Modifies these files**:
- `src/services/commonAppWorkshop/services/batchGenerationService.ts` — trackSuggestionShown after generating suggestions
- `src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator.ts` — trackScoreChange on re-analysis
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts` — trackSuggestionShown for description optimization
- `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts` — trackScoreChange on re-analysis
- `src/services/piqWorkshop/` — trackSuggestionShown for PIQ teaching output
- `src/services/inlineEditor/inlineEditorService.ts` — trackInlineEdit (command + accepted/rejected)
- `src/http/routes.ts` — add GET /api/analytics/acceptance-rate, GET /api/analytics/commands, GET /api/analytics/score-improvement, POST /api/analytics/compare-versions
**Tasks**: (1) Add tracking calls at every suggestion generation point, (2) Add tracking at every score computation point, (3) Add tracking to inline editor, (4) Create analytics API endpoints
**Done when**: Generating a suggestion in any workshop creates a writing_analytics row, inline edits are tracked, API endpoints respond correctly

### Agent: "test-runner" (general-purpose)
**Focus**: Comprehensive E2E test suite + full regression
**Creates these test files**:
- `tests/test-analytics-tracking.ts` — verify all event types create DB rows, verify aggregation queries
- `tests/test-version-comparison.ts` — verify score deltas match manual calculation (no API key needed)
- `tests/test-cost-validation.ts` — run full pipeline, measure token cost, verify < $1.60 per student
- `tests/run-writing-improvement-suite.ts` — master runner for ALL 14 test files with pass/fail summary
**Runs all existing tests for regression**:
- `tests/test-voice-profile-accuracy.ts` (from Chat 2)
- `tests/test-inline-editing-e2e.ts` (from Chat 2)
- `tests/test-ai-risk-scorer.ts` (from Chat 2)
- `tests/test-rag-retrieval-e2e.ts` (from Chat 3)
- `tests/test-story-mining-e2e.ts` (from Chat 3)
- All pre-existing tests
**Reads**: SUCCESS_CRITERIA_AND_VALIDATION.md Section 9 (full test suite list + run commands)
**Tasks**: (1) Write 4 new test files, (2) Create master test runner, (3) Run full regression, (4) Report pass/fail for all 14 tests
**Done when**: All 14 test files exist and can be executed, master runner reports overall status

### Agent: "polish-validator" (general-purpose)
**Focus**: Final quality polish, scorecard, and progress tracker
**Tasks**:
1. Run `npx tsc --noEmit` on full codebase — fix ANY errors
2. Run `grep -r "ts-nocheck" src/` — must return 0
3. Run `grep -r "20250514" src/ supabase/` — must return 0
4. Review all new services for: error handling, proper exports (class + singleton), consistent patterns
5. **Fill in the Type.ai Parity Scorecard** in `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` Section 8 with actual measured scores for all 20 capabilities
6. **Update the Progress Tracker** in Section 10 — mark all checkboxes with actual results
7. **Verify North Star Metrics** from Section 1: voice preservation score, cost per student, inline edit latency, teaching specificity, authenticity score
8. Write a final summary: what we achieved, what exceeded targets, what fell short, and recommended next steps
**Done when**: Type check clean, scorecard filled in with 85+/100, progress tracker complete, North Star metrics measured

Run all agents, then final gate: `npx tsc --noEmit` + all 14 tests pass.

## Validation (from SUCCESS_CRITERIA_AND_VALIDATION.md, Sections 6-8)

Before considering this chat complete, verify ALL Phase 4 gates AND final project gates:

Analytics (Phase 4):
- All event types tracked correctly (verified with E2E test)
- Version comparison produces correct score deltas
- Aggregation queries return correct results on test data
- Tracking adds < 50ms latency

Final Project Gates (Section 7):
- Full regression: ALL 14 test files pass (Section 9 has the full list and run commands)
- Cost validation: per-student cost < $1.60 (run test-cost-validation.ts)
- Type.ai parity scorecard: 85+/100 (Section 8)
- Zero @ts-nocheck in entire codebase
- npx tsc --noEmit passes

North Star Metrics (Section 1):
- Voice preservation: 85%+ consistency score
- Inline edit latency: < 3s (Haiku), < 5s (Sonnet) at p95
- Teaching specificity: 80%+ of teaching includes retrieved real examples
- Authenticity: < 30 AI risk score on system-generated suggestions

Create test files: test-analytics-tracking.ts, test-version-comparison.ts, test-cost-validation.ts, run-writing-improvement-suite.ts (runs all 14 tests)

Update the FINAL Progress Tracker in `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` Section 10 (ALL phases).
Fill in the FINAL Type.ai Parity Scorecard in Section 8 with actual measured scores.
```

### Expected Output
- `supabase/migrations/XXX_add_analytics.sql`
- `src/services/analytics/` — complete analytics + version comparison
- Analytics tracking integrated into all suggestion/editing flows
- 4 new E2E test files
- Clean type check across full codebase
- Cost validation confirming ~45% reduction

---

## Summary: Chat Execution Order

```
Chat 1: Foundation & Quick Wins + Shared Types — 3 AGENTS
   ├── "fixer": Model IDs, prompt caching, PIQ type fixes
   ├── "voice-architect": StudentVoiceProfile + VoiceProfileService + DB migration
   └── "type-scaffolder": Type stubs for inlineEditor, RAG, analytics, storyMining, authenticity, sessionContext
         │
         ▼
Chat 2: Inline Editing + Voice Integration + Authenticity — 3 AGENTS
   ├── "inline-editor": InlineEditorService (15 commands) + commandPrompts + SessionContextService
   ├── "voice-integrator": StyleConsistencyService + AIRiskScorer + wire voice profiles into all 3 workshops
   └── "api-tester": API endpoints + 6 validation test files
         │
         ▼
Chat 3: RAG Layer + Story Mining — 4 AGENTS
   ├── "rag-builder": pgvector schema + RAGService
   ├── "content-migrator": Extract static content → ragSeeder (400+ fragments, 80+ transformations)
   ├── "story-miner": StoryMiningService (3-pass: extract → cluster → rank)
   └── "integrator": Wire RAG into all workshops + story mining API + 3 test files
         │
         ▼
Chat 4: Analytics + Polish + E2E Validation — 4 AGENTS
   ├── "analytics-builder": DB schema + WritingAnalyticsService + VersionComparisonService
   ├── "analytics-integrator": Wire tracking into all suggestion/editing flows + API endpoints
   ├── "test-runner": 4 new test files + master runner + full 14-test regression
   └── "polish-validator": Type check, scorecard fill-in, progress tracker, North Star metrics
```

**Total agents across all chats**: 14 (3 + 3 + 4 + 4)
**Estimated total**: ~31 days of development, ~45% cost reduction, writing quality matching/exceeding type.ai

---

## Key Files Reference

### New Services (created across Chats 1-4)

```
src/services/voiceProfile/          [Chat 1: types+service, Chat 2: style consistency]
  types.ts
  voiceProfileService.ts
  styleConsistencyService.ts
  index.ts

src/services/inlineEditor/          [Chat 1: types, Chat 2: implementation]
  types.ts
  inlineEditorService.ts
  commandPrompts.ts
  index.ts

src/services/sessionContext/        [Chat 2]
  types.ts
  sessionContextService.ts
  index.ts

src/services/rag/                   [Chat 1: types, Chat 3: implementation]
  types.ts
  ragService.ts
  ragSeeder.ts
  index.ts

src/services/storyMining/          [Chat 3]
  types.ts
  storyMiningService.ts
  index.ts

src/services/authenticity/         [Chat 2]
  types.ts
  aiRiskScorer.ts
  index.ts

src/services/analytics/            [Chat 1: types, Chat 4: implementation]
  types.ts
  writingAnalyticsService.ts
  versionComparisonService.ts
  index.ts
```

### Existing Files Modified

```
src/http/routes.ts                                          [Chats 2,3,4: new endpoints]
src/lib/llm/claude.ts                                       [Chat 1: verify caching support]

src/services/commonAppWorkshop/services/
  evolvedWorkshopOrchestrator.ts                            [Chat 2: voice profile loading]
  batchGenerationService.ts                                 [Chats 1,2,3: model ID, caching, voice, RAG]
  techniqueSuggestionRouter.ts                              [Chat 1: model ID fix]
  stage0Service.ts                                          [Chat 1: model ID fix]
  semanticScoringService.ts                                 [Chat 1: prompt caching]

src/services/portfolioStrategy/services/activityWorkshop/
  activityWorkshopService.ts                                [Chat 2: voice profile loading]
  stages/stage1ContextAwareAnalysisService.ts               [Chat 1: prompt caching]
  stages/stage2ConditionalTeachingService.ts                [Chats 1,2,3: caching, voice, RAG]
  scoring/scoringOrchestrator.ts                            [Chat 1: prompt caching]
  chat/dynamicConversationEngine.ts                         [Chat 2: voice profile init]

src/services/piqWorkshop/
  piqChatContext.ts                                         [Chats 2,3: voice profile, RAG]

supabase/functions/
  workshop-analysis/index.ts                                [Chat 1: model ID, caching]
  teaching-layer/index.ts                                   [Chat 1: caching]
  validate-workshop/index.ts                                [Chat 1: model routing]

supabase/migrations/
  XXX_add_voice_profiles.sql                                [Chat 1]
  XXX_add_rag_embeddings.sql                                [Chat 3]
  XXX_add_analytics.sql                                     [Chat 4]
```

### Database Tables Added

```
voice_profiles          [Chat 1] — Persistent student voice profiles
rag_essay_fragments     [Chat 3] — Embedded essay examples for retrieval
rag_transformations     [Chat 3] — Before/after teaching transformations
writing_analytics       [Chat 4] — Event-based analytics tracking
prompt_effectiveness    [Chat 4] — Aggregated prompt performance data
```
