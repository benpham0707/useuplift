# Chat 2: Iteration Fixes + Voice Integration + Inline Editing + Authenticity

> **Purpose**: Complete prompt for Chat 2 of the Writing Quality Improvement initiative.
> **Includes**: Unfixed Phase 0/1A iteration items + Phase 1B voice integration + Phase 2 inline editing
> **Created**: 2026-02-20 (post-audit)

---

Read these analysis reports first — they contain the full context for what we're building:
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` (master plan — READ Sections 2, 5, 6, 7, 9, 12)
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` (success metrics — READ Sections 3, 4, 7, 8)
- `docs/analysis/COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/PIQ_WORKSHOP_WRITING_ANALYSIS.md`
- `docs/analysis/ACTIVITY_WORKSHOP_WRITING_ANALYSIS.md`

---

## PROJECT CONTEXT

We are upgrading Uplift's 3 writing workshop systems (Activity Workshop, PIQ Workshop, Common App Workshop) to match and exceed type.ai-level writing quality while being more cost-effective.

### Architecture Quick Reference
- Stack: TypeScript strict, Express (8789), React 18/Vite, Supabase PG, Clerk, Anthropic Claude
- Models: Sonnet (`claude-sonnet-4-5-20250929`) for quality, Haiku (`claude-haiku-4-5-20251001`) for speed
- LLM wrapper: `src/lib/llm/claude.ts` (supports `cacheSystemPrompt: true`) + `src/lib/llm/unified.ts`
- Service pattern: class + singleton export, types in `types.ts`, index for re-exports
- Supabase project ID: `zclaplpkuvxkrdwsgrul`

---

## WHAT ALREADY EXISTS (independently verified by 2 audits)

Chat 1 completed Phase 0 + Phase 1A. Two independent audit swarms verified every claim:

### Phase 0 — VERIFIED DONE
- **Model IDs**: 123 correct instances across 99 files. Zero stale `20250514` remain.
- **Prompt caching infra**: `src/lib/llm/claude.ts` fully supports `cacheSystemPrompt` with `cache_control: { type: 'ephemeral' }`, cache hit/miss token tracking, and cost calculation with cache pricing.
- **65 src/ files** use `cacheSystemPrompt: true` via `callClaude()`.
- **PIQ type fixes**: Zero `@ts-nocheck` in `src/services/piq/`. `thematic_coherence` fixed to `narrative_arc_stakes`.

### Phase 1A — VERIFIED DONE
- **StudentVoiceProfile type**: `src/services/voiceProfile/types.ts` — 84 lines. `StudentVoiceProfile` interface with register, linguistics, personality, authenticPhrases, weaknesses, preservationWarnings, confidence (0-1 scale), sampleCount. Also exports `AuthenticPhrase`.
- **VoiceProfileService**: `src/services/voiceProfile/voiceProfileService.ts` — 387 lines, 8 methods:
  - `buildFromSample(userId, text, source)` → full profile (uses **Haiku**)
  - `enrichProfile(userId, text, source)` → merged profile (uses **Sonnet**)
  - `getPromptSummary(profile, maxTokens?)` → compact text (~500 tokens)
  - `fromCommonAppFingerprint(fp)` → `Partial<StudentVoiceProfile>`
  - `fromActivityChatFingerprint(fp)` → `Partial<StudentVoiceProfile>`
  - `fromPIQFingerprint(fp)` → `Partial<StudentVoiceProfile>`
  - `save(profile)` → Supabase upsert on `voice_profiles`
  - `load(userId)` → profile or null
- **Database migration**: `supabase/migrations/20260220000000_add_voice_profiles.sql` — `voice_profiles` table (id UUID, user_id TEXT UNIQUE, version INT, profile JSONB, timestamps, RLS + policy)
- **6 type stubs** with `types.ts` + `index.ts` each: `inlineEditor/`, `rag/`, `analytics/`, `storyMining/`, `authenticity/`, `sessionContext/`. All match roadmap specs, clean cross-service imports.
- **`npx tsc --noEmit` passes with 0 errors**
- **Regression tests pass**: AP stats 40/40, major resolution 119/119

### KNOWN ISSUES FROM AUDIT (you must fix these)

1. **2 Common App services bypass `callClaude()`** — `batchGenerationService.ts` (line 521) and `semanticScoringService.ts` (line 469) use `new Anthropic()` directly. No prompt caching on their calls.
   - `batchGenerationService.ts`: sends prompt as user message (no system message to cache). Its `generateBatchSuggestions()` uses `this.client.messages.create()`.
   - `semanticScoringService.ts`: has `system: SEMANTIC_SCORING_SYSTEM_PROMPT` as plain string on `this.client.messages.create()`.

2. **8/9 edge functions lack caching** — only `piq-chat/index.ts` has `cache_control`. These 7 functions + their call counts need it:
   - `narrative-overview/index.ts` (1 call)
   - `strategic-constraints/index.ts` (1 call, `STRATEGIC_ANALYZER_PROMPT` at line 466)
   - `suggestion-rationales/index.ts` (1 call)
   - `teaching-layer/index.ts` (1 call, `TEACHING_LAYER_SYSTEM_PROMPT` at line 430)
   - `validate-suggestions/stage1-authenticity.ts` (1 call)
   - `validate-suggestions/simple-validator.ts` (1 call)
   - `validate-workshop/index.ts` (1 call)
   - `workshop-analysis/index.ts` (**4 calls** — lines 134, 194, 264, 347)

3. **Missing FK constraint** on `voice_profiles.user_id` — no `REFERENCES profiles(clerk_id)`.

4. **Zero validation tests created** — 0/4 spec'd test files exist.

5. **~194 files have `@ts-nocheck`** across `src/services/`, including key files you'll modify (evolvedWorkshopOrchestrator.ts, activityWorkshopService.ts, batchGenerationService.ts). **Do NOT try to remove @ts-nocheck from these files** — that's a separate cleanup. Work with them as-is.

---

## WHAT TO BUILD IN THIS CHAT

This chat covers: **Phase 0/1A iteration fixes + Phase 1B (voice integration) + Phase 2 (inline editing + authenticity)**.

### PART A: Iteration Fixes (from audit)

#### A1. Edge function caching
For each of the 7 uncached edge functions, convert `system:` from string to array format with `cache_control`:
```typescript
// BEFORE:
system: SOME_SYSTEM_PROMPT,

// AFTER (matches piq-chat pattern at lines 132-138):
system: [
  {
    type: 'text',
    text: SOME_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' },
  },
],
```
**NOTE**: `workshop-analysis/index.ts` has **4 separate Claude calls** — apply caching to all 4. Reference: `supabase/functions/piq-chat/index.ts` lines 132-138.

#### A2. Raw SDK service caching
For `semanticScoringService.ts`: add `cache_control` to the system prompt in `this.client.messages.create()` at line 504-513 using the same array format above.

For `batchGenerationService.ts`: this one sends its prompt as a user message (no system message), so standard system-prompt caching doesn't apply. Leave it as-is — the voice integration work below will interact with this file's `generateBatchSuggestions()` method.

#### A3. FK constraint migration
Create `supabase/migrations/20260220100000_add_voice_profiles_fk.sql`:
```sql
ALTER TABLE voice_profiles
  ADD CONSTRAINT voice_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(clerk_id) ON DELETE CASCADE;
```

#### A4. Confidence scale alignment
In `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` around line 146, update `confidence: number; // 0-100` to `confidence: number; // 0-1` (implementation uses 0-1, which is more standard).

### PART B: Phase 1B — Voice Profile Integration into All Workshops

Wire the existing `VoiceProfileService` into all 3 workshop orchestrators so the student's voice profile flows into every LLM prompt.

#### B1. Common App Integration
- **`src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator.ts`** (has `@ts-nocheck`):
  - Import `voiceProfileService` from `@/services/voiceProfile`
  - At the start of the workshop flow, load the student's voice profile: `const voiceProfile = await voiceProfileService.load(userId)`
  - If a profile exists and confidence > 0.7, skip voice excavation in Stage 0 (use profile instead)
  - Pass `voiceProfile` to Stage 2 (batch generation)
- **`src/services/commonAppWorkshop/services/batchGenerationService.ts`** (has `@ts-nocheck`):
  - Add `voiceProfile?: StudentVoiceProfile` to the `HolisticContext` interface (line 98-103) or as a separate parameter on `generateBatchSuggestions()`
  - In the prompt construction, inject voice constraints using `voiceProfileService.getPromptSummary(voiceProfile)` alongside the existing `voiceFingerprint` data
  - The existing `VoiceFingerprint` stays — voice profile supplements it, doesn't replace it

#### B2. Activity Workshop Integration
- **`src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts`** (has `@ts-nocheck`):
  - Import `voiceProfileService`
  - Load voice profile at pipeline start
  - Pass to Stage 2 (`stage2ConditionalTeachingService`) for description optimization
- **`src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts`**:
  - If voice profile exists, initialize conversation voice matching from it instead of cold-starting

#### B3. PIQ Integration
- **`supabase/functions/piq-chat/contextBuilder.ts`** (Deno edge function — CANNOT import Node.js modules):
  - Load voice profile **directly via Supabase client** (NOT via VoiceProfileService):
    ```typescript
    const { data: voiceData } = await supabaseClient
      .from('voice_profiles')
      .select('profile')
      .eq('user_id', userId)
      .single();
    ```
  - In `PIQContext` interface (line 12), add a `studentVoiceProfile?: any` field
  - In `buildPIQContext()`, load and include the profile
  - In `formatContextForLLM()`, add a voice profile section similar to the existing voiceFingerprint section but richer (using the profile's register, linguistics, personality data)

#### B4. Voice Profile API Endpoints
Add to `src/http/routes.ts`:
```typescript
// GET /api/voice-profile — load profile for authenticated user
r.get("/api/voice-profile", requireAuth, async (req, res) => {
  const profile = await voiceProfileService.load(req.auth.userId);
  res.json({ success: true, data: profile });
});

// PUT /api/voice-profile — build/enrich profile from writing sample
r.put("/api/voice-profile", requireAuth, async (req, res) => {
  const { text, source } = req.body;
  const existing = await voiceProfileService.load(req.auth.userId);
  const profile = existing
    ? await voiceProfileService.enrichProfile(req.auth.userId, text, source)
    : await voiceProfileService.buildFromSample(req.auth.userId, text, source);
  res.json({ success: true, data: profile });
});
```

### PART C: Phase 2 — Inline Editing System

This is the **biggest type.ai gap** to close. Build a command palette of 15 targeted editing operations.

#### C1. InlineEditorService
Create `src/services/inlineEditor/inlineEditorService.ts`:
- `applyCommand(request: InlineEditRequest): Promise<InlineEditResult>` — apply an editing command
  - Uses **Haiku** for most commands (< 3s response time)
  - Uses **Sonnet** for complex commands: `deepen_vulnerability`, `connect_to_theme` (< 5s)
  - Generates 2 alternatives: primary (safe, incremental) + creative (bolder)
  - Includes `teachingNote` + `principle` (transferable writing lesson)
  - Injects voice constraint block if `voiceProfile` provided
- `suggestCommands(selectedText, fullDocument, essayType?): Promise<CommandSuggestion[]>` — suggest 2-3 best commands for a selection
  - Uses **Haiku** for speed (< 2s)
  - Analyzes selection for: vagueness → make_concrete, telling → show_dont_tell, filler → cut_filler, etc.
- Types already exist at `src/services/inlineEditor/types.ts` (15 `EditingCommand` variants, `InlineEditRequest`, `InlineEditResult`)

#### C2. Command Prompt Templates
Create `src/services/inlineEditor/commandPrompts.ts`:
- 15 command-specific prompt templates (~300 token system + ~200 token user context)
- Each template has slots for: `{VOICE_SUMMARY}`, `{BANNED_TERMS}`, `{RAG_EXAMPLES}` (empty for now, RAG comes in Chat 3)
- Template structure per the roadmap Section 5 (lines 660-683):
```
System: You are a college essay writing coach. Your task is to {COMMAND_DESCRIPTION}.

RULES:
- Preserve the student's authentic voice: {VOICE_SUMMARY}
- Generate exactly 2 alternatives: one safe (minimal change), one creative (bolder)
- Each must fit naturally in the surrounding context
- Explain what changed and why (one sentence)
- State the transferable writing principle

{RAG_EXAMPLES if available}

BANNED TERMS: {BANNED_LIST}

User:
SURROUNDING CONTEXT: {100 chars before}[SELECTED]{100 chars after}
FULL ESSAY TYPE: {essay_type}
SELECTED TEXT TO EDIT: "{selected_text}"
COMMAND: {command}
```
- JSON output format matching `InlineEditResult`

#### C3. SessionContextService
Create `src/services/sessionContext/sessionContextService.ts`:
- `startSession(input: StartSessionInput): DocumentSession` — create/resume editing session
- `updateDocument(sessionId, newText): void` — update text, invalidate stale cache
- `getDocumentContextBlock(sessionId): string` — compact 200-300 token context block for LLM prompts
- `recordEdit(sessionId, edit: EditRecord): void` — track edit history
- Types already exist at `src/services/sessionContext/types.ts`

#### C4. StyleConsistencyService
Create `src/services/voiceProfile/styleConsistencyService.ts`:
- `quickVoiceCheck(text, profile): { bannedTermsFound, vocabularyMismatch, sentenceLengthDeviation, formalityMismatch }` — heuristic, NO LLM cost, < 10ms
  - Check `avoidWords` from profile against text
  - Compute average sentence length, compare to `profile.linguistics.averageSentenceLength`
  - Check formality markers (contractions → casual, passive voice → formal)
  - Check vocabulary level (long words ratio)
- `buildVoiceConstraintBlock(profile): string` — standard voice constraint block for LLM prompts (~200 tokens)
  - Include: register, formality, sentence length target, banned terms, signature words to preserve
- `validateVoiceConsistency(text, profile, context): Promise<{isConsistent, issues?, suggestedFixes?}>` — optional LLM validation for high-stakes outputs
- Export class + singleton

#### C5. AIRiskScorer
Create `src/services/authenticity/aiRiskScorer.ts`:
- **Pure heuristic scorer** — NO LLM calls, < 50ms
- 7 signals (see roadmap Section 7):
  1. Vocabulary uniformity (low variety → AI-like)
  2. Sentence length variance (too uniform → AI-like)
  3. Generic reflection density ("I learned that...", "This experience taught me...")
  4. Banned/overused terms from existing cliché lists
  5. Cliché density (phrases like "pushed my boundaries", "stepping out of my comfort zone")
  6. Hedging density ("somewhat", "perhaps", "in some ways")
  7. Adverb density (too many -ly words → polished AI style)
- Returns `AIRiskAssessment` (type exists at `src/services/authenticity/types.ts`):
  - `overallRisk: number` (0-100)
  - `signals: { name, score, flaggedExamples }[]`
  - `flaggedPassages: { text, startIndex, endIndex, reason, suggestion }[]`
- Export class + singleton

#### C6. Inline Edit API Endpoints
Add to `src/http/routes.ts`:
```typescript
POST /api/inline-edit           — Body: InlineEditRequest → Response: InlineEditResult
POST /api/inline-edit/suggest   — Body: { selectedText, fullDocument, essayType? } → Response: CommandSuggestion[]
POST /api/authenticity-check    — Body: { text } → Response: AIRiskAssessment
```

### PART D: Validation Tests

Create these test files following existing patterns (see `tests/harness/verify-ap-stats.ts` for no-API-key pattern, `tests/portfolio/test-full-pipeline-e2e-output.ts` for API-key pattern):

1. **`tests/infra/test-model-id-consistency.ts`** (no API key) — grep-based CI guard
2. **`tests/essay-intelligence/test-voice-profile-unit.ts`** (no API key) — test getPromptSummary(), 3 converters with mock data
3. **`tests/essay-intelligence/test-voice-preservation.ts`** (no API key for pure function tests, API key for LLM tests) — summary captures voice, converters work
4. **`tests/infra/test-prompt-caching-validation.ts`** (needs API key) — run callClaude twice, verify cache hits + cost reduction
5. **`tests/essay-intelligence/test-voice-profile-accuracy.ts`** (needs API key) — 5 diverse samples, buildFromSample(), verify reasonable profiles
6. **`tests/essay-intelligence/test-voice-cross-workshop.ts`** (needs API key) — same profile fed to all 3 workshops, voice metrics within 20%
7. **`tests/essay-intelligence/test-inline-editing-e2e.ts`** (needs API key) — all 15 commands on 5 passages each, verify JSON schema, dual alternatives, teaching notes
8. **`tests/essay-intelligence/test-ai-risk-scorer.ts`** (no API key) — 10 AI texts vs 10 human texts, mean gap > 30
9. **`tests/essay-intelligence/test-style-consistency.ts`** (no API key) — quickVoiceCheck catches 8/10 planted violations, < 10% false positive

---

## SWARM CONFIGURATION: 4 Agents

### Agent 1: "caching-fixer" (general-purpose)
**Focus**: All caching fixes (iteration items A1 + A2)
**Owns these files**:
- `src/services/commonAppWorkshop/services/semanticScoringService.ts` — add `cache_control` to system prompt
- `supabase/functions/narrative-overview/index.ts` — add caching
- `supabase/functions/strategic-constraints/index.ts` — add caching
- `supabase/functions/suggestion-rationales/index.ts` — add caching
- `supabase/functions/teaching-layer/index.ts` — add caching
- `supabase/functions/validate-suggestions/stage1-authenticity.ts` — add caching
- `supabase/functions/validate-suggestions/simple-validator.ts` — add caching
- `supabase/functions/validate-workshop/index.ts` — add caching
- `supabase/functions/workshop-analysis/index.ts` — add caching to ALL 4 calls
- `supabase/migrations/20260220100000_add_voice_profiles_fk.sql` — **NEW**, FK constraint
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` — update confidence scale comment (line ~146)

**Pattern**: See `supabase/functions/piq-chat/index.ts` lines 132-138 for the exact working caching pattern.
**Do NOT** refactor batchGenerationService to use callClaude() — just note that it can't be cached (prompt in user msg).
**Done when**: `grep -r "cache_control" supabase/functions/ --include="*.ts" | wc -l` returns 12+ (was 1). FK migration file exists. Confidence spec updated.

### Agent 2: "inline-editor" (general-purpose)
**Focus**: Core inline editing system (C1 + C2 + C3)
**Creates these files**:
- `src/services/inlineEditor/inlineEditorService.ts` — `applyCommand()` + `suggestCommands()`
- `src/services/inlineEditor/commandPrompts.ts` — 15 command-specific prompt templates
- `src/services/sessionContext/sessionContextService.ts` — session management
- Update `src/services/inlineEditor/index.ts` — add service exports
- Update `src/services/sessionContext/index.ts` — add service exports

**Reads**: Roadmap Section 5 (Inline Editing), Section 9 (Document-Context), Section 12 if present
**Key decisions**:
- Haiku for most commands (speed), Sonnet for deepen_vulnerability + connect_to_theme (quality)
- JSON output with proper error handling for parse failures
- Each template must have `{VOICE_SUMMARY}` and `{RAG_EXAMPLES}` slots (RAG slot stays empty until Chat 3)
- `callClaude()` from `src/lib/llm/claude.ts` with `cacheSystemPrompt: true` on command prompt templates
**Done when**: All 15 commands can be called, `npx tsc --noEmit` passes, InlineEditResult JSON schema is valid

### Agent 3: "voice-integrator" (general-purpose)
**Focus**: Style consistency, authenticity, voice profile wiring into workshops (B1-B4 + C4 + C5)
**Creates these files**:
- `src/services/voiceProfile/styleConsistencyService.ts` — `quickVoiceCheck()`, `buildVoiceConstraintBlock()`, `validateVoiceConsistency()`
- `src/services/authenticity/aiRiskScorer.ts` — pure heuristic scorer (NO LLM calls)
- Update `src/services/authenticity/index.ts` — add aiRiskScorer exports
**Modifies these files** (voice profile integration):
- `src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator.ts` — load voice profile, pass to Stage 0 + Stage 2
- `src/services/commonAppWorkshop/services/batchGenerationService.ts` — add `voiceProfile?` to HolisticContext, inject voice constraints in prompts
- `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts` — load voice profile, pass to Stage 2
- `src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts` — init voice from profile
- `supabase/functions/piq-chat/contextBuilder.ts` — load profile via direct Supabase query (NOT VoiceProfileService — this is Deno), add to PIQContext, include in formatContextForLLM()

**CRITICAL NOTE about PIQ**: The PIQ chat is a **Deno edge function** (`supabase/functions/piq-chat/`). It CANNOT import `VoiceProfileService` from `src/services/`. You must load the voice profile via direct Supabase client query (the edge function already has `supabaseClient` available). Load from `voice_profiles` table, parse the JSONB `profile` column.

**CRITICAL NOTE about @ts-nocheck**: The orchestrator files (evolvedWorkshopOrchestrator, activityWorkshopService, batchGenerationService) all have `@ts-nocheck`. Do NOT try to remove it — just add your changes. Your types from `src/services/voiceProfile/` are clean, the @ts-nocheck won't affect them.

**Done when**: `voiceProfileService.load()` is called in all 3 workshop entry points, quickVoiceCheck catches planted violations, AIRiskScorer runs in < 50ms

### Agent 4: "api-tester" (general-purpose)
**Focus**: API endpoints + all validation test files (B4 + C6 + D)
**Modifies**:
- `src/http/routes.ts` — add all endpoints:
  - `GET /api/voice-profile` (requireAuth)
  - `PUT /api/voice-profile` (requireAuth)
  - `POST /api/inline-edit` (requireAuth)
  - `POST /api/inline-edit/suggest` (requireAuth)
  - `POST /api/authenticity-check` (requireAuth)
**Creates these test files** (all NEW):
- `tests/infra/test-model-id-consistency.ts` (no API key)
- `tests/essay-intelligence/test-voice-profile-unit.ts` (no API key)
- `tests/essay-intelligence/test-voice-preservation.ts` (mostly no API key)
- `tests/infra/test-prompt-caching-validation.ts` (needs API key)
- `tests/essay-intelligence/test-voice-profile-accuracy.ts` (needs API key)
- `tests/essay-intelligence/test-voice-cross-workshop.ts` (needs API key)
- `tests/essay-intelligence/test-inline-editing-e2e.ts` (needs API key)
- `tests/essay-intelligence/test-ai-risk-scorer.ts` (no API key)
- `tests/essay-intelligence/test-style-consistency.ts` (no API key)

**Test patterns**: Read `tests/harness/verify-ap-stats.ts` for no-API-key pattern, `tests/portfolio/test-full-pipeline-e2e-output.ts` for API-key pattern. Use console.log output, pass/fail counts, summary at end.
**Done when**: All endpoints respond correctly, all test files exist and pass basic syntax check, no-API-key tests pass

---

## VERIFICATION AFTER ALL AGENTS COMPLETE

Run these checks in order:

```bash
# 1. Type check — MUST pass with 0 errors
npx tsc --noEmit

# 2. Stale model IDs — MUST return 0
grep -r "20250514" src/ supabase/ --include="*.ts" | wc -l

# 3. Edge function caching — should return 12+ (was 1)
grep -r "cache_control" supabase/functions/ --include="*.ts" | wc -l

# 4. New service files exist
ls src/services/inlineEditor/inlineEditorService.ts
ls src/services/inlineEditor/commandPrompts.ts
ls src/services/sessionContext/sessionContextService.ts
ls src/services/voiceProfile/styleConsistencyService.ts
ls src/services/authenticity/aiRiskScorer.ts
ls supabase/migrations/20260220100000_add_voice_profiles_fk.sql

# 5. No-API-key tests
npx tsx tests/infra/test-model-id-consistency.ts
npx tsx tests/essay-intelligence/test-voice-profile-unit.ts
npx tsx tests/essay-intelligence/test-voice-preservation.ts
npx tsx tests/essay-intelligence/test-ai-risk-scorer.ts
npx tsx tests/essay-intelligence/test-style-consistency.ts
npx tsx tests/harness/verify-ap-stats.ts
npx tsx tests/academic/test-major-resolution-comprehensive.ts

# 6. API-key tests (if available)
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/infra/test-prompt-caching-validation.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/essay-intelligence/test-voice-profile-accuracy.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/essay-intelligence/test-voice-cross-workshop.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/essay-intelligence/test-inline-editing-e2e.ts
```

## PROGRESS TRACKER UPDATE

After all verification passes, update `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` Section 10:
- Phase 0: Update caching status, mark validation tests as done
- Phase 1A: Mark FK constraint as done, validation tests as done
- Phase 1B: Fill in voice integration checkboxes
- Phase 2: Fill in inline editing, authenticity, style consistency checkboxes
- Section 8 (Type.ai Scorecard): Update scores for capabilities 1-3 (voice), 9-12 (inline editing), 14 (style), 15 (anti-AI)
