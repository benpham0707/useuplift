# Phase 0 + 1A Iteration Sprint — Building Chat Prompt

> **Purpose**: Paste this entire prompt into the building chat to fix all gaps identified by the post-implementation audit.
> **Created**: 2026-02-20
> **Scope**: Fix caching gaps, add FK constraint, create validation tests, update progress tracker

---

## PROJECT CONTEXT — Writing Quality Improvement Initiative

We are upgrading Uplift's 3 writing workshop systems (Activity Workshop, PIQ Workshop, Common App Workshop) to match and exceed type.ai-level writing quality while being more cost-effective.

### Key Analysis Reports (read these for full context)
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` — Master implementation plan with types, specs, file paths
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` — Success metrics, quality gates, validation tests for every feature

### Architecture Quick Reference
- Stack: TypeScript strict, Express (8789), React 18/Vite, Supabase PG, Clerk, Anthropic Claude
- Models: Sonnet (`claude-sonnet-4-5-20250929`) for quality, Haiku (`claude-haiku-4-5-20251001`) for speed
- LLM wrapper: `src/lib/llm/claude.ts` + `src/lib/llm/unified.ts`
- Service pattern: class + singleton export, types in `types.ts`, index for re-exports

---

## WHAT WAS ALREADY BUILT (Phase 0 + Phase 1A — verified by audit)

A previous building session completed the following. **All claims have been independently verified:**

### Phase 0 — DONE
1. **Model IDs fixed**: 123 instances of correct model IDs across 99 files. Zero stale `20250514` remain.
2. **Prompt caching enabled**: 68 files use `cacheSystemPrompt: true` via `callClaude()` in `src/lib/llm/claude.ts`. The caching infrastructure is fully implemented with `cache_control: { type: 'ephemeral' }`, cache hit/miss token tracking, and cost calculation.
3. **PIQ type fixes**: Zero `@ts-nocheck` in `src/services/piq/`. `thematic_coherence` correctly fixed to `narrative_arc_stakes`.

### Phase 1A — DONE
1. **StudentVoiceProfile type**: `src/services/voiceProfile/types.ts` — 83 lines, `StudentVoiceProfile` + `AuthenticPhrase` interfaces. Matches roadmap spec.
2. **VoiceProfileService**: `src/services/voiceProfile/voiceProfileService.ts` — 387 lines, 8 methods. Uses Haiku for `buildFromSample()`, Sonnet for `enrichProfile()`. Class + singleton pattern. Proper error handling.
3. **Database migration**: `supabase/migrations/20260220000000_add_voice_profiles.sql` — creates `voice_profiles` table with UUID id, TEXT user_id, INTEGER version, JSONB profile, timestamps, UNIQUE(user_id), RLS enabled + policy.
4. **3 converters**: `fromCommonAppFingerprint`, `fromActivityChatFingerprint`, `fromPIQFingerprint` — all return `Partial<StudentVoiceProfile>`.
5. **6 type stubs**: `inlineEditor/`, `rag/`, `analytics/`, `storyMining/`, `authenticity/`, `sessionContext/` — all with `types.ts` + `index.ts`, clean cross-service imports, no circular deps.

### What compiles
- `npx tsc --noEmit` passes with **zero errors**
- Regression tests pass: AP stats 40/40, major resolution 119/119

---

## WHAT NEEDS FIXING (Audit Findings)

An independent 4-agent audit found these gaps. **This is what you need to fix.**

### P1 — Critical (5 items)

#### P1-1: Confidence scale decision
- **Issue**: `StudentVoiceProfile.confidence` and `register.confidence` use 0-1 scale in implementation, but the roadmap spec (WRITING_IMPROVEMENT_ROADMAP.md line 146) says 0-100.
- **Decision**: Keep 0-1 (it's more standard for ML confidence scores). Update the roadmap spec comment to say 0-1.
- **Files**: `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` — update the comment on confidence field from `// 0-100` to `// 0-1`
- **Complexity**: Trivial

#### P1-2: Missing FK constraint on voice_profiles
- **Issue**: `supabase/migrations/20260220000000_add_voice_profiles.sql` has `user_id TEXT NOT NULL` but NO `REFERENCES profiles(clerk_id)`. This allows orphaned voice profiles.
- **Fix**: Create a NEW migration file (do NOT modify the existing one) that adds the FK constraint:
```sql
-- supabase/migrations/20260220100000_add_voice_profiles_fk.sql
ALTER TABLE voice_profiles
  ADD CONSTRAINT voice_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(clerk_id) ON DELETE CASCADE;
```
- **Complexity**: Trivial

#### P1-3: 2 Common App services bypass callClaude() — no caching
- **Issue**: `batchGenerationService.ts` (line 521) and `semanticScoringService.ts` (line 469) instantiate their own `new Anthropic()` client directly instead of using `callClaude()` from `src/lib/llm/claude.ts`. This means the prompt caching infrastructure doesn't reach them. These have large, stable system prompts — high-value caching targets.
- **Fix for each**: Convert `system: "..."` (string format) to the array format with `cache_control`:
```typescript
// BEFORE (string format, no caching):
system: SOME_PROMPT_STRING,

// AFTER (array format with caching):
system: [
  {
    type: 'text' as const,
    text: SOME_PROMPT_STRING,
    cache_control: { type: 'ephemeral' as const },
  },
],
```
  Do this for every `client.messages.create()` call in both files that has a stable (non-per-request) system prompt. Leave dynamic/per-request system prompts as-is.
- **Files**:
  - `src/services/commonAppWorkshop/services/batchGenerationService.ts` — find all `this.client.messages.create()` calls
  - `src/services/commonAppWorkshop/services/semanticScoringService.ts` — find all `this.client.messages.create()` calls
- **Complexity**: Medium (need to read each file, identify which system prompts are stable vs dynamic)

#### P1-4: 7 edge functions lack prompt caching
- **Issue**: 7 of 8 Claude-using edge functions don't have `cache_control` on their system prompts. Only `piq-chat` has it.
- **Fix**: For each edge function, convert the `system:` field from string format to array format with `cache_control`, exactly like piq-chat does:
```typescript
// BEFORE (string):
system: SOME_SYSTEM_PROMPT,

// AFTER (array with caching):
system: [
  {
    type: 'text',
    text: SOME_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' },
  },
],
```
- **Files to fix** (grep for `system:` in each to find the exact calls):
  1. `supabase/functions/narrative-overview/index.ts`
  2. `supabase/functions/strategic-constraints/index.ts` (line 466, `STRATEGIC_ANALYZER_PROMPT`)
  3. `supabase/functions/suggestion-rationales/index.ts`
  4. `supabase/functions/teaching-layer/index.ts` (line 430, `TEACHING_LAYER_SYSTEM_PROMPT`)
  5. `supabase/functions/validate-suggestions/stage1-authenticity.ts`
  6. `supabase/functions/validate-suggestions/simple-validator.ts`
  7. `supabase/functions/validate-workshop/index.ts`
  8. `supabase/functions/workshop-analysis/index.ts` (4 calls — lines 134, 194, 264, 347)
- **Reference**: See `supabase/functions/piq-chat/index.ts` lines 132-138 for the exact working pattern.
- **NOTE**: `workshop-analysis/index.ts` has **4 separate Claude calls** — apply caching to all 4 system prompts.
- **Complexity**: Small (repetitive pattern, ~15 minutes total)

#### P1-5: Create 4 validation tests (spec'd in SUCCESS_CRITERIA_AND_VALIDATION.md Section 9)
- **Issue**: Zero of the 4 Phase 0/1A validation tests were created. The success criteria doc has pseudocode specs for each.
- **Files to create**:

1. **`tests/infra/test-prompt-caching-validation.ts`** — Verify prompt caching reduces cost
   - Run a Sonnet call with `cacheSystemPrompt: true` twice with the same system prompt
   - First call: expect `cache_creation_input_tokens > 0`
   - Second call: expect `cache_read_input_tokens > 0`
   - Pass if: second run cost < 70% of first run cost
   - Use `callClaude()` from `src/lib/llm/claude.ts`
   - Needs ANTHROPIC_API_KEY

2. **`tests/essay-intelligence/test-voice-profile-accuracy.ts`** — Verify voice profiling quality
   - Create 5 diverse writing samples (formal academic, casual personal, energetic activity description, reflective essay, creative narrative)
   - For each: call `voiceProfileService.buildFromSample()`
   - Verify: register detection is reasonable (e.g., casual text → not 'formal'), vocabulary level matches (sophisticated text → 'sophisticated'), sentence length is roughly correct
   - Pass if: 4/5 samples produce reasonable profiles
   - Needs ANTHROPIC_API_KEY

3. **`tests/essay-intelligence/test-voice-preservation.ts`** — Verify prompt summary captures voice
   - Build a profile from a sample, then call `getPromptSummary()`
   - Verify: summary includes register, vocabulary level, formality, signature words
   - Verify: summary is < 600 tokens (compact enough for prompt injection)
   - This is a pure function test — does NOT need API key if you pass in a pre-built profile
   - Also test: `fromCommonAppFingerprint`, `fromActivityChatFingerprint`, `fromPIQFingerprint` — pass mock data, verify output shape

4. **`tests/infra/test-model-id-consistency.ts`** — Automated guard against stale model IDs
   - Grep `src/` and `supabase/` for `20250514` — must return 0 results
   - Grep for `20250929` — must return > 0 results (Sonnet exists)
   - Grep for `20251001` — must return > 0 results (Haiku exists)
   - This is a CI-guard test — does NOT need API key
   - Use `child_process.execSync` to run grep commands

- **Test patterns**: Follow existing test patterns in the project. Use `console.log` for output. Track pass/fail counts. Print summary at end. See `tests/harness/verify-ap-stats.ts` for a good template of a no-API-key test, and `tests/portfolio/test-full-pipeline-e2e-output.ts` for an API-key test pattern.
- **Complexity**: Medium (each test ~80-150 lines)

### P2 — Important (2 items)

#### P2-1: VoiceProfileService unit tests
- **File**: `tests/essay-intelligence/test-voice-profile-unit.ts` (new)
- **Test these pure functions** (no API key needed):
  - `getPromptSummary()` — pass a mock StudentVoiceProfile, verify output contains key fields, verify length is reasonable
  - `fromCommonAppFingerprint()` — pass mock VoiceFingerprint, verify register/linguistics/authenticPhrases mapping
  - `fromActivityChatFingerprint()` — pass mock data, verify personality/formality mapping
  - `fromPIQFingerprint()` — pass mock data, verify linguistics mapping
- **Test with mocked LLM** (if feasible):
  - `buildFromSample()` — verify it calls Haiku, handles JSON parse errors gracefully
  - `enrichProfile()` — verify it calls Sonnet, merges profiles correctly
- **Complexity**: Medium

#### P2-2: Update Progress Tracker
- **File**: `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` — Section 10
- **Replace** the Phase 0 and Phase 1A sections with the audit-verified versions below:

```markdown
### Phase 0: Foundation ⚠️ (2026-02-19, audit-verified 2026-02-20)

\```
Implementation:
  ✅ Model IDs fixed (grep confirms 0 stale) — 123 instances verified across src/ and supabase/
  ⚠️ Prompt caching enabled — 68 files use cacheSystemPrompt: true.
     GAPS: batchGenerationService.ts and semanticScoringService.ts bypass callClaude() (raw
     Anthropic SDK, no caching). 7/8 edge functions lack caching (only piq-chat cached).
     Academic workshop (callUnifiedLLM) and deep report (dynamic prompts) correctly excluded.
  ✅ PIQ @ts-nocheck removed + types fixed — narrative_arc_stakes verified correct
  ⬜ PIQ teaching examples (9 remaining dimensions) — deferred to later phase

Validation:
  ✅ grep "20250514" returns 0 — verified by audit
  ✅ npx tsc --noEmit passes — verified by audit (0 errors)
  ✅ Regression tests pass — AP stats 40/40, major resolution 119/119
  ⬜ Prompt caching shows 30%+ reduction on second run — needs runtime validation
  ❌ test-prompt-caching-validation.ts — NOT YET CREATED

Gate: ⚠️ PARTIAL PASS — model IDs and type fixes verified. Caching has gaps in 2 raw-SDK
services + 7 edge functions. Validation test missing.
\```

### Phase 1: Voice System — Phase 1A ⚠️ (2026-02-19, audit-verified 2026-02-20)

\```
Implementation:
  ✅ StudentVoiceProfile type created — src/services/voiceProfile/types.ts
  ✅ VoiceProfileService implemented (build, enrich, save, load) — 387 lines, 8 methods
  ⚠️ Database migration created — correct schema BUT missing FK constraint
     (REFERENCES profiles(clerk_id)). Not yet applied to Supabase.
  ✅ Converters from existing formats (CommonApp, Activity, PIQ) — all verified
  ⬜ Workshop integrations — deferred to Phase 1B
  ✅ Type stubs created (6 services) — all with types.ts + index.ts, clean imports
  ⚠️ Confidence scale: implementation uses 0-1, spec says 0-100.

Validation:
  ❌ test-voice-profile-accuracy.ts — NOT YET CREATED
  ❌ test-voice-preservation.ts — NOT YET CREATED
  ❌ test-voice-cross-workshop.ts — NOT YET CREATED (needs Phase 1B)
  ❌ Persistence roundtrip test — NOT YET CREATED
  ✅ npx tsc --noEmit passes — verified by audit

Gate: ⚠️ IMPLEMENTATION COMPLETE, VALIDATION INCOMPLETE — all artifacts exist and compile.
0/4 validation tests created. FK constraint missing. Confidence scale mismatch.
\```
```

After you complete all fixes, update these sections to reflect the new state (change ❌ to ✅, update ⚠️ notes, etc.).

---

## SWARM CONFIGURATION: 3 Agents

Spin up a swarm with these 3 named agents working in parallel:

### Agent: "caching-fixer" (general-purpose)
**Focus**: P1-3 + P1-4 — Fix caching gaps in 2 services + 7 edge functions
**Owns these files**:
- `src/services/commonAppWorkshop/services/batchGenerationService.ts` — add `cache_control` to raw Anthropic SDK calls
- `src/services/commonAppWorkshop/services/semanticScoringService.ts` — add `cache_control` to raw Anthropic SDK calls
- `supabase/functions/narrative-overview/index.ts` — add caching
- `supabase/functions/strategic-constraints/index.ts` — add caching
- `supabase/functions/suggestion-rationales/index.ts` — add caching
- `supabase/functions/teaching-layer/index.ts` — add caching
- `supabase/functions/validate-suggestions/stage1-authenticity.ts` — add caching
- `supabase/functions/validate-suggestions/simple-validator.ts` — add caching
- `supabase/functions/validate-workshop/index.ts` — add caching
- `supabase/functions/workshop-analysis/index.ts` — add caching to all 4 calls

**Pattern reference**: See `supabase/functions/piq-chat/index.ts` lines 132-138 for the exact edge function caching pattern. For the 2 src/ services, use the same array format since they use raw `client.messages.create()`.

**IMPORTANT**: Do NOT refactor batchGenerationService or semanticScoringService to use callClaude() — that would be a much larger change. Just add `cache_control` blocks to their existing raw SDK calls.

### Agent: "test-builder" (general-purpose)
**Focus**: P1-5 + P2-1 — Create all 5 test files
**Owns these files** (all NEW):
- `tests/infra/test-prompt-caching-validation.ts`
- `tests/essay-intelligence/test-voice-profile-accuracy.ts`
- `tests/essay-intelligence/test-voice-preservation.ts`
- `tests/infra/test-model-id-consistency.ts`
- `tests/essay-intelligence/test-voice-profile-unit.ts`

**Test pattern reference**: Read `tests/harness/verify-ap-stats.ts` for the no-API-key test pattern, and `tests/portfolio/test-full-pipeline-e2e-output.ts` for the API-key test pattern. Follow the same style: console.log output, pass/fail counts, summary at end.

**For voice profile tests**: Import from `src/services/voiceProfile` — the service is already built and exports `voiceProfileService` singleton + types.

### Agent: "doc-fixer" (general-purpose)
**Focus**: P1-1 + P1-2 + P2-2 — Confidence scale, FK migration, progress tracker update
**Owns these files**:
- `docs/analysis/WRITING_IMPROVEMENT_ROADMAP.md` — update confidence comment from `// 0-100` to `// 0-1` (line ~146)
- `supabase/migrations/20260220100000_add_voice_profiles_fk.sql` — **NEW** file, FK constraint migration
- `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md` — update Section 10 with audit-verified status

---

## VERIFICATION AFTER ALL AGENTS COMPLETE

After all 3 agents finish, run these checks:

```bash
# 1. Type check — must pass with 0 errors
npx tsc --noEmit

# 2. Model ID check — must return 0
grep -r "20250514" src/ supabase/ --include="*.ts" | wc -l

# 3. Caching in edge functions — should return 8 (was 1 before)
grep -r "cache_control" supabase/functions/ --include="*.ts" | wc -l

# 4. Run no-API-key tests
npx tsx tests/infra/test-model-id-consistency.ts
npx tsx tests/essay-intelligence/test-voice-preservation.ts
npx tsx tests/essay-intelligence/test-voice-profile-unit.ts
npx tsx tests/harness/verify-ap-stats.ts
npx tsx tests/academic/test-major-resolution-comprehensive.ts

# 5. Run API-key tests (if API key available)
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/infra/test-prompt-caching-validation.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/essay-intelligence/test-voice-profile-accuracy.ts
```

All must pass before this iteration sprint is considered complete. After verification, update the Progress Tracker Section 10 with final results and change the gates from ⚠️ to ✅.
