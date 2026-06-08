# FORGE_PLAN_V2: Coaching Effectiveness — 7-Gap Blueprint

**Date**: 2026-04-02
**Branch**: `feat/conversator-v2-coaching-annotation-v2`
**Scope**: 7 quality gaps in the essay coaching pipeline — essay type awareness, portfolio context, activity story depth, technique teaching, word count intelligence, transformation examples, college expectations

---

## Part 1: Reality Verification Report

### GAP-1 + GAP-5 (Essay Type + Word Count)

**Finding DIRECT-GAP1-1** | Severity: **weak**
- Issue: Direct proposes threading `essayType` through `PipelineInput` -> `ReanalysisOrchestrator.processCoachingTurn()` -> `coachingService.processCoachingTurn()` -> `runStage3CoachingResponse()`. This requires 4 signature changes. However, the profile already has `northStar.activeScale` which maps 1:1 to essay type.
- Fix: Unnecessary work. The profile is already passed through the call chain.

**Finding RETHINK-GAP1-1** | Severity: **incomplete**
- Issue: Rethink proposes `SCALE_TO_ESSAY_TYPE = { piq: 'piq', supplement: 'supplement', personal_statement: 'common_app' }` to derive essay type from `profile.northStar.activeScale`. This is correct — the mapping is verified in `reanalysisOrchestrator.ts:611-615` which does exactly this conversion. However, `BlockContext` already HAS `essayType` and `collegeId` fields (verified in `types.ts:28-30`). They just aren't populated.
- Fix: The fix is simply populating the existing fields at line 1672-1678 in `coachingService.ts` where `blockCtx` is constructed. Zero new types needed.

**Finding DIRECT-GAP5-1** | Severity: **broken**
- Issue: Direct proposes adding `essayType` to change the word count from hardcoded 650. But the word count display at line 2094 is in `buildStableProfileContext()`, not in the block system. Adding `essayType` to `BlockContext` wouldn't reach the word count code path.
- Fix: The word count fix needs to happen in `buildStableProfileContext()` where `profile.northStar.activeScale` is already available.

**Finding RETHINK-GAP5-1** | Severity: **weak**
- Issue: Rethink correctly identifies that `profile.northStar.activeScale` can determine word limits. But the proposed solution of "derive at the call site" is vague about WHERE exactly the word count fix goes.
- Fix: Fix goes in `buildStableProfileContext()` at line 2094 where the hardcoded `/650` lives.

### GAP-2 + GAP-3 (Portfolio + Activity Depth)

**Finding DIRECT-GAP2-1** | Severity: **broken**
- Issue: Direct proposes querying `portfolio_analytics.detailed` JSONB. This table does NOT exist in the Supabase schema. The only file referencing `portfolio_analytics` is `src/modules/analytics/portfolio.ts`, which is an OpenAI-based analytics module — completely separate from the essay intelligence system. There is no `portfolio_analytics` DB table to query.
- Fix: Portfolio synthesis data does not exist as a queryable DB field. It would need to be derived from existing activity profiles or omitted.

**Finding DIRECT-GAP2-2** | Severity: **weak**
- Issue: Direct proposes extending `StudentModuleOutputs` with 7 portfolio fields (archetype, coreNarrative, primaryDifferentiator, competitiveAdvantages, vulnerabilities, coherenceScore, narrativeThread). However, none of this data exists in any DB table. It would need to be computed or inferred.
- Fix: The Rethink approach of 4 simpler fields is more pragmatic, but BOTH approaches face the same problem: there is no pre-computed portfolio synthesis in the DB. The best path is to derive a lightweight synthesis from the activity profiles already loaded.

**Finding RETHINK-GAP3-1** | Severity: **incomplete**
- Issue: Rethink proposes reading `profile_data` JSONB from `activity_profiles` table. This is verified to exist — `chatPersistenceService.ts` stores/loads `ActivityProfile` objects as JSONB in `profile_data`. The `ActivityProfile` type (in `profile/types.ts`) has `story.origin`, `story.relationships`, `meaning.proudestMoment`, `meaning.whyItMatters`. However, `personalSignificance` does NOT exist on `ActivityMeaning` — it exists in a completely different type in `portfolioStrategy/types/essaySystem.ts:592`.
- Fix: Use `meaning.whyItMatters` instead of `meaning.personalSignificance`.

**Finding DIRECT-GAP3-1** | Severity: **incomplete**
- Issue: Direct proposes querying `profile_data` for `origin`, `keyRelationship`, `proudestMoment`. These fields DO exist: `story.origin` (with sub-fields `howStarted`, `whyJoined`, `initialMotivation`, `catalyst`), `story.relationships[]`, and `meaning.proudestMoment`. But the integration point into `assembleCrossModuleContext` needs careful thought — the current `activityProfiles` query selects flat columns (`title, tier, key_strengths, key_moment, authentic_quote`) from `activity_profiles`, not the JSONB `profile_data`.
- Fix: A separate query for `profile_data` JSONB is needed, or the existing query needs to also select `profile_data`.

### GAP-4 + GAP-6 (Technique Teaching + Transformation Examples)

**Finding DIRECT-GAP4-1** | Severity: **weak**
- Issue: Direct proposes creating a `TECHNIQUE_NAME_TO_CATEGORY` mapping from TECHNIQUE_ROUTES technique names (e.g., `'SUMMARY-TO-SCENE'`) to TECHNIQUE_BUNDLES keys (e.g., `'storytelling'`). This is necessary because the route names don't match the category keys. The route names are custom strings like `'SUMMARY-TO-SCENE'`, `'COLD OPEN / SENSORY TIMESTAMP'`, `'SOMATIC VULNERABILITY'`. The bundle keys are `'storytelling'`, `'technical_depth'`, `'evidence_impact'`, etc. There IS a semantic gap that needs bridging.
- Fix: A mapping table is the right approach. The technique library's `getTechniqueCoachingBlock()` already exists and accepts a category ID.

**Finding DIRECT-GAP4-2** | Severity: **weak**
- Issue: Direct proposes making `buildFindingCoachingContext` async. This function (line 4002) is currently synchronous. Making it async would require changing the call site at line 1716 from `const findingSection = this.buildFindingCoachingContext(...)` to `const findingSection = await this.buildFindingCoachingContext(...)`. The calling function `runStage3CoachingResponse` is already async, so this is a safe change. However, it adds latency to every coaching turn (lazy-loading technique bundles).
- Fix: Pre-warm technique bundles at service initialization, or cache after first load (which `techniqueLibrary.ts` already does via `_techniqueBundles`).

**Finding RETHINK-GAP4-1** | Severity: **weak**
- Issue: Rethink proposes replacing `routeFindingToTechnique()` with `routeFindingToEnrichedTechnique()` that returns `{ technique, directive, enrichment }`. This is a clean API but changes the return type of a private method. The method is only called at line 4081, so the blast radius is small.
- Fix: Both approaches are viable. The Rethink approach is simpler (single function, no mapping table) but the Direct approach keeps the existing method untouched.

**Finding DIRECT-GAP6-1** | Severity: **incomplete**
- Issue: Direct proposes `getTransformationForTechnique()` with its own mapping table. `TRANSFORMATION_EXAMPLES` is verified to be exported as `export const TRANSFORMATION_EXAMPLES: TransformationExample[]` from `transformationExamples.ts`. The `TransformationExample` type has `category` (growth_resilience, passion_interest, character_trait, emotion_label, experience_impact, short_form) and `primaryCraftMove` (sensory_details, specific_names, active_verbs, statistics_data, emotional_physical). The mapping from TECHNIQUE_ROUTES technique names to TransformationExample categories is non-trivial — e.g., `'SUMMARY-TO-SCENE'` -> `'storytelling'` -> ??? There's no direct category mapping.
- Fix: Map TECHNIQUE_ROUTES technique names to `TransformationExample.primaryCraftMove` instead of `category`. E.g., `'SUMMARY-TO-SCENE'` -> `sensory_details`, `'SOMATIC VULNERABILITY'` -> `emotional_physical`.

**Finding RETHINK-GAP6-1** | Severity: **incomplete**
- Issue: Rethink proposes `TRANSFORMATION_EXAMPLES.find()` inside the enriched technique function. This is correct syntactically but the matching logic needs to bridge from technique route names to `TransformationExample` properties. Rethink doesn't specify what field to match on.
- Fix: Same as Direct fix — match on `primaryCraftMove`.

### GAP-7 (College Expectations)

**Finding DIRECT-GAP7-1** | Severity: **broken**
- Issue: Direct proposes creating a new file `collegeExpectationsBridge.ts` with a manual `COLLEGE_TO_TIER` mapping for 17 schools. However, `collegeOverlay.ts` ALREADY EXISTS and handles 13 colleges with lazy-loaded research data. It already produces compact coaching blocks. Adding a second file for college data creates duplication and inconsistency.
- Fix: Use the existing `collegeOverlay.ts` infrastructure. If tier data is needed, import `COLLEGE_TIERS` from `collegeExpectationsDatabase.ts` and map college IDs to tiers there.

**Finding RETHINK-GAP7-1** | Severity: **weak**
- Issue: Rethink proposes importing `getCollegeTier`/`getMajorExpectations` inside `assembleCrossModuleContext()`. These functions ARE verified to exist in `collegeExpectationsDatabase.ts`. However, `getCollegeTier(tier: CollegeTier)` takes a `CollegeTier` enum value (not a college name), and `getMajorExpectations(major: string)` takes a major name. The Rethink design would need to first determine the tier from the college ID (for which there is no existing mapping from college ID -> CollegeTier), then call `getCollegeTier()`.
- Fix: The existing `collegeOverlay.ts` already has `getCollegeCoachingOverlay()` which accepts a college ID string. This is the right integration point — it already loads college-specific values, red/green flags, and AO quotes. The `essayTypeBlock()` in `promptBlocks.ts` already calls it (line 1889-1893). It just isn't being populated with `collegeId` because `BlockContext.collegeId` is never set.

**Finding RETHINK-GAP7-2** | Severity: **broken**
- Issue: Rethink proposes appending tier briefing to `academicContext.courseLoadSummary`. This conflates two different data sources — academic course load is about the student's transcript, not about the target college's expectations. Mixing them produces a confusing signal for the LLM.
- Fix: College expectations should be injected into the prompt block system via `essayTypeBlock()` (which already handles supplement + college overlay) and potentially as a separate profile context section, not appended to academic data.

---

## Part 2: Forced-Choice Synthesis

### GAP-1: Essay Type Awareness
**Choice: RETHINK (refined)**

The profile already carries `northStar.activeScale` through the entire call chain. The `BlockContext` already has `essayType` and `collegeId` fields — they just aren't populated. The fix is 3 lines at the `blockCtx` construction site (line 1672). Zero signature changes, zero new parameters. Direct's 4-signature-change threading is unnecessary work.

### GAP-2: Portfolio Context
**Choice: HYBRID (simplified)**

Neither design works as proposed — there is no pre-computed portfolio synthesis in the DB. The practical path: derive a lightweight portfolio synthesis from the activity profiles already loaded in `assembleCrossModuleContext()`. Add 4 fields to `StudentModuleOutputs` (Rethink's simpler shape) but compute them from the activity profiles array, not from a nonexistent DB table.

### GAP-3: Activity Story Depth
**Choice: RETHINK (refined)**

Reading `profile_data` JSONB alongside flat columns is the right approach. The `ActivityProfile` type has rich story data (`story.origin`, `story.keyMoments`, `meaning.proudestMoment`, `meaning.whyItMatters`). Fix: add `profile_data` to the existing SELECT query and extract coaching-relevant fields.

### GAP-4: Technique Teaching
**Choice: HYBRID**

Use Rethink's single-function approach (`routeFindingToEnrichedTechnique`) but with Direct's insight about needing a mapping table. The route technique names (`SUMMARY-TO-SCENE`) don't match the library category keys (`storytelling`). Build a `TECHNIQUE_TO_CATEGORY` map, use it inside the enriched routing function.

### GAP-5: Word Count Intelligence
**Choice: RETHINK (refined)**

Fix goes in `buildStableProfileContext()` at line 2094. Use `profile.northStar.activeScale` to select the correct word limit. No new parameters needed.

### GAP-6: Transformation Examples
**Choice: HYBRID**

Map TECHNIQUE_ROUTES technique names to `TransformationExample.primaryCraftMove` values. Attach the best-matching transformation example to the finding's technique directive in `buildFindingCoachingContext()`. One mapping table, inline in the enriched routing function.

### GAP-7: College Expectations
**Choice: REFINED (neither)**

Both designs miss the key fact: `collegeOverlay.ts` already exists and does most of what's needed. The `essayTypeBlock()` in `promptBlocks.ts` already calls `getCollegeCoachingOverlay(ctx.collegeId)`. The only missing piece is populating `BlockContext.collegeId`. This requires: (1) storing `collegeId` in the session store, (2) passing it from `/start` route body to `BlockContext`, (3) threading it from session store through `processCoachingTurn` on subsequent calls.

---

## Part 3: Implementation Blueprint

### Dependency Order

```
ITEM 1 (GAP-1 Essay Type)     -- standalone, no deps
ITEM 2 (GAP-5 Word Count)     -- standalone, no deps
ITEM 3 (GAP-7 College Overlay) -- standalone, no deps
ITEM 4 (GAP-3 Activity Depth)  -- standalone, no deps
ITEM 5 (GAP-2 Portfolio)       -- depends on ITEM 4 (uses enriched activity data)
ITEM 6 (GAP-4 Technique)       -- standalone, no deps
ITEM 7 (GAP-6 Transformation)  -- depends on ITEM 6 (uses enriched technique function)
```

Recommended execution: Items 1-4 in parallel, then 5, then 6-7 together.

---

### ITEM 1: Essay Type Awareness in Block System

**Gap**: `BlockContext.essayType` is never populated. The coach generates generic Common App advice for PIQs and supplements.

**Files to modify**:
1. `src/services/essayIntelligence/coaching/coachingService.ts` (~1672)

**Before** (line 1672-1678):
```typescript
const blockCtx: BlockContext = {
  mode: coachingMode,
  phase: phase.level,
  iterationRound,
  editSignificance: recentEditContext ? 'present' as const : undefined,
  isInSessionDraft,
};
```

**After**:
```typescript
// Derive essay type from profile's activeScale (the source of truth)
const SCALE_TO_ESSAY_TYPE: Record<string, BlockContext['essayType']> = {
  supplement: 'supplement',
  piq: 'piq',
  personal_statement: 'common_app',
};
const derivedEssayType = SCALE_TO_ESSAY_TYPE[profile.northStar.activeScale] ?? 'common_app';

const blockCtx: BlockContext = {
  mode: coachingMode,
  phase: phase.level,
  iterationRound,
  editSignificance: recentEditContext ? 'present' as const : undefined,
  isInSessionDraft,
  essayType: derivedEssayType,
};
```

**Why this works**: `profile` is already available in `runStage3CoachingResponse()` (parameter at line 1653). `northStar.activeScale` is type `NorthStarScale = 'supplement' | 'piq' | 'personal_statement'` (verified in `profileTypes.ts:120`). The mapping to `BlockContext.essayType` type values is exact. The existing `essayTypeBlock()` in `promptBlocks.ts:1883` already handles `supplement`, `piq`, and defaults for `common_app`.

**Verification**: After change, run a coaching session with a PIQ essay. The Stage 3 prompt should include `ESSAY TYPE: UC Personal Insight Question (PIQ). 350 words maximum.` instead of the generic Common App identity.

**Cost impact**: Zero. No new LLM calls. Same prompt tokens (essayTypeBlock was returning empty string before, now returns ~200 tokens of type-specific guidance).

---

### ITEM 2: Word Count Intelligence

**Gap**: Word count display is hardcoded to `/650` (Common App limit). PIQs have 350-word limit; supplements typically 150-300.

**Files to modify**:
1. `src/services/essayIntelligence/coaching/coachingService.ts` (~2094)

**Before** (line 2092-2098):
```typescript
const totalWords = profile.paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0);
parts.push(
  `WORD COUNT: ${totalWords}/650` +
  (totalWords > 600 ? ' — TIGHT. Every addition requires a specific cut.' :
   totalWords > 500 ? ' — some room, but word economy still applies.' :
   ' — room to expand, but resist filling it with decoration.'),
);
```

**After**:
```typescript
// Word limits by essay type (derived from profile's activeScale)
const WORD_LIMITS: Record<string, number> = {
  supplement: 250,       // Most supplements 150-300; 250 is a safe middle
  piq: 350,              // UC PIQs: exactly 350
  personal_statement: 650, // Common App: 650
};
const wordLimit = WORD_LIMITS[profile.northStar.activeScale] ?? 650;
const totalWords = profile.paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0);
const pctUsed = totalWords / wordLimit;
parts.push(
  `WORD COUNT: ${totalWords}/${wordLimit}` +
  (pctUsed > 0.92 ? ' — TIGHT. Every addition requires a specific cut.' :
   pctUsed > 0.77 ? ' — some room, but word economy still applies.' :
   ' — room to expand, but resist filling it with decoration.'),
);
```

**Why this works**: `profile.northStar.activeScale` is available here (already used in `buildStableProfileContext` at line 2059). The percentage-based thresholds (92% = tight, 77% = moderate) replace absolute word counts, so they scale to all essay types. For Common App: 92% * 650 = 598 (similar to old 600 threshold). For PIQ: 92% * 350 = 322 (appropriate for 350-word limit).

**Verification**: Run coaching for a PIQ. Word count should show `${n}/350` not `${n}/650`.

**Cost impact**: Zero.

---

### ITEM 3: College Overlay Activation (GAP-7)

**Gap**: `BlockContext.collegeId` is never populated. The college overlay system (`collegeOverlay.ts`) exists and works but is never activated.

**Files to modify**:
1. `src/http/essayCoachingRoutes.ts` (session store + route handlers)
2. `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` (`processCoachingTurn` signature)
3. `src/services/essayIntelligence/coaching/coachingService.ts` (`processCoachingTurn` signature + blockCtx)

**Step 3a: Extend session store to persist collegeId and essayType**

File: `src/http/essayCoachingRoutes.ts`

**Before** (line 37-41):
```typescript
const sessionStore = new Map<string, {
  orchestrator: import('@/services/essayIntelligence/analysis/reanalysisOrchestrator').ReanalysisOrchestrator;
  createdAt: number;
  lastAccessed: number;
}>();
```

**After**:
```typescript
const sessionStore = new Map<string, {
  orchestrator: import('@/services/essayIntelligence/analysis/reanalysisOrchestrator').ReanalysisOrchestrator;
  createdAt: number;
  lastAccessed: number;
  /** College ID for supplement essays (e.g., 'stanford', 'mit') */
  collegeId?: string;
  /** Essay type from the /start request */
  essayType?: string;
}>();
```

**Step 3b: Capture collegeId from /start request body**

File: `src/http/essayCoachingRoutes.ts`

**Before** (line 136):
```typescript
const { essayId, essayText, essayType = 'common_app' } = req.body;
```

**After**:
```typescript
const { essayId, essayText, essayType = 'common_app', collegeId } = req.body;
```

**Before** (line 178-182):
```typescript
sessionStore.set(sessionKey, {
  orchestrator,
  createdAt: Date.now(),
  lastAccessed: Date.now(),
});
```

**After**:
```typescript
sessionStore.set(sessionKey, {
  orchestrator,
  createdAt: Date.now(),
  lastAccessed: Date.now(),
  collegeId: typeof collegeId === 'string' ? collegeId.toLowerCase() : undefined,
  essayType,
});
```

**Step 3c: Pass collegeId through processCoachingTurn calls**

File: `src/http/essayCoachingRoutes.ts`

On the `/start` route (line 190-197), add `collegeId` parameter:
```typescript
const coachingResult = await orchestrator.processCoachingTurn(
  'What do you think of my essay?',
  [],
  undefined,
  undefined,
  undefined,
  crossModuleContext || undefined,
  typeof collegeId === 'string' ? collegeId.toLowerCase() : undefined, // NEW
);
```

On the `/respond` route (line 264-271), add `collegeId` parameter:
```typescript
const result = await session.orchestrator.processCoachingTurn(
  studentMessage,
  conversationHistory,
  undefined,
  sessionMemory,
  learningStyle,
  crossModuleContext || undefined,
  session.collegeId, // NEW
);
```

**Step 3d: Thread collegeId through ReanalysisOrchestrator**

File: `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts`

**Before** (line 334-341):
```typescript
async processCoachingTurn(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  recentEditSummary?: string,
  sessionMemory?: CoachingSessionMemory,
  learningStyle?: LearningStyleObservations,
  crossModuleContext?: string,
): Promise<CoachingTurnResult> {
```

**After**:
```typescript
async processCoachingTurn(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  recentEditSummary?: string,
  sessionMemory?: CoachingSessionMemory,
  learningStyle?: LearningStyleObservations,
  crossModuleContext?: string,
  collegeId?: string,
): Promise<CoachingTurnResult> {
```

And pass it through to `coachingService.processCoachingTurn()` (line 415-429):

**Before**:
```typescript
const coachingResult: CoachingResult = await coachingService.processCoachingTurn(
  studentMessage,
  conversationHistory,
  profile,
  this.coordinator,
  this.router,
  richEditContext,
  editStrategyContext,
  sessionMemory,
  learningStyle,
  crossModuleContext,
  coachingMode,
  iterationRound,
  isInSessionDraft,
);
```

**After**:
```typescript
const coachingResult: CoachingResult = await coachingService.processCoachingTurn(
  studentMessage,
  conversationHistory,
  profile,
  this.coordinator,
  this.router,
  richEditContext,
  editStrategyContext,
  sessionMemory,
  learningStyle,
  crossModuleContext,
  coachingMode,
  iterationRound,
  isInSessionDraft,
  collegeId,
);
```

**Step 3e: Accept collegeId in CoachingService and populate BlockContext**

File: `src/services/essayIntelligence/coaching/coachingService.ts`

**Before** (line 767-781):
```typescript
async processCoachingTurn(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  profile: EssayProfile,
  coordinator: EssayProfileCoordinator,
  router: ProfileRouter,
  recentEditContext?: string,
  editStrategyContext?: string,
  sessionMemory?: CoachingSessionMemory,
  learningStyle?: LearningStyleObservations,
  crossModuleContext?: string,
  coachingMode?: CoachingMode,
  iterationRound?: number,
  isInSessionDraft?: boolean,
): Promise<CoachingResult> {
```

**After**:
```typescript
async processCoachingTurn(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  profile: EssayProfile,
  coordinator: EssayProfileCoordinator,
  router: ProfileRouter,
  recentEditContext?: string,
  editStrategyContext?: string,
  sessionMemory?: CoachingSessionMemory,
  learningStyle?: LearningStyleObservations,
  crossModuleContext?: string,
  coachingMode?: CoachingMode,
  iterationRound?: number,
  isInSessionDraft?: boolean,
  collegeId?: string,
): Promise<CoachingResult> {
```

Then pass `collegeId` to `runStage3CoachingResponse` (line 886-901):

Add it to the call and to the `runStage3CoachingResponse` signature (add after `isInSessionDraft`):
```typescript
private async runStage3CoachingResponse(
  // ... existing params ...
  isInSessionDraft?: boolean,
  collegeId?: string,  // NEW
): Promise<{ response: string; sidecar: CoachingSidecar; s3Cost: LayerCost }> {
```

And finally populate `blockCtx.collegeId` (combining with ITEM 1):
```typescript
const blockCtx: BlockContext = {
  mode: coachingMode,
  phase: phase.level,
  iterationRound,
  editSignificance: recentEditContext ? 'present' as const : undefined,
  isInSessionDraft,
  essayType: derivedEssayType,
  collegeId,  // NEW — activates college overlay in essayTypeBlock()
};
```

**Why this works**: `essayTypeBlock()` at line 1887-1898 already has the full implementation — it checks `ctx.collegeId`, calls `getCollegeCoachingOverlay()`, and appends core values, red/green flags, and AO quotes. We are simply connecting the plumbing.

**Verification**: Call `/essay-coaching/start` with `{ essayId: "...", essayText: "...", essayType: "supplement", collegeId: "stanford" }`. The coaching response should reference Stanford's core values and red flags.

**Cost impact**: Zero new LLM calls. Adds ~300-500 tokens to the system prompt (from college overlay). These are cached via `cacheSystemPrompt: true`.

---

### ITEM 4: Activity Story Depth

**Gap**: `assembleCrossModuleContext()` queries only flat columns (`title, tier, key_strengths, key_moment, authentic_quote`) from `activity_profiles`. The rich JSONB `profile_data` column has origin stories, key moments, proudest moments, and personal meaning — unused.

**Files to modify**:
1. `src/http/essayCoachingRoutes.ts` (~89-103)
2. `src/services/studentNarrativeBridge.ts` (~19-42)

**Step 4a: Extend StudentModuleOutputs to accept richer activity data**

File: `src/services/studentNarrativeBridge.ts`

**Before** (line 25-35):
```typescript
activityProfiles?: Array<{
  title: string;
  tier: number;
  keyStrengths: string[];
  /** Rich personal details from the activity conversator ... */
  keyMoment?: string;
  /** Authentic quotes from the student's own words during activity chat */
  authenticQuote?: string;
}>;
```

**After**:
```typescript
activityProfiles?: Array<{
  title: string;
  tier: number;
  keyStrengths: string[];
  /** Rich personal details from the activity conversator ... */
  keyMoment?: string;
  /** Authentic quotes from the student's own words during activity chat */
  authenticQuote?: string;
  /** Origin story — how/why they got involved (from profile_data JSONB) */
  originStory?: string;
  /** Proudest moment in this activity (from profile_data JSONB) */
  proudestMoment?: string;
  /** Why this activity matters to them personally (from profile_data JSONB) */
  whyItMatters?: string;
}>;
```

**Step 4b: Extend the assembly to render richer activity context**

File: `src/services/studentNarrativeBridge.ts`

**Before** (line 76-82):
```typescript
const activityLines = outputs.activityProfiles.map(a => {
  let line = `${a.title} (Tier ${a.tier}): ${a.keyStrengths.slice(0, 2).join(', ')}`;
  if (a.keyMoment) line += ` | Key moment: ${a.keyMoment}`;
  if (a.authenticQuote) line += ` | In their words: "${a.authenticQuote}"`;
  return line;
});
```

**After**:
```typescript
const activityLines = outputs.activityProfiles.map(a => {
  let line = `${a.title} (Tier ${a.tier}): ${a.keyStrengths.slice(0, 2).join(', ')}`;
  if (a.originStory) line += ` | Origin: ${a.originStory}`;
  if (a.keyMoment) line += ` | Key moment: ${a.keyMoment}`;
  if (a.proudestMoment) line += ` | Proudest: ${a.proudestMoment}`;
  if (a.whyItMatters) line += ` | Why it matters: ${a.whyItMatters}`;
  if (a.authenticQuote) line += ` | In their words: "${a.authenticQuote}"`;
  return line;
});
```

**Step 4c: Load profile_data JSONB in assembleCrossModuleContext**

File: `src/http/essayCoachingRoutes.ts`

**Before** (line 89-103):
```typescript
const { data: activityProfiles } = await supabaseAdmin
  .from('activity_profiles')
  .select('activity_id, title, tier, key_strengths, key_moment, authentic_quote')
  .eq('profile_id', profileId)
  .limit(10);

if (activityProfiles && activityProfiles.length > 0) {
  outputs.activityProfiles = activityProfiles.map(ap => ({
    title: ap.title ?? 'Untitled',
    tier: ap.tier ?? 3,
    keyStrengths: Array.isArray(ap.key_strengths) ? ap.key_strengths as string[] : [],
    keyMoment: ap.key_moment ?? undefined,
    authenticQuote: ap.authentic_quote ?? undefined,
  }));
}
```

**After**:
```typescript
const { data: activityProfiles } = await supabaseAdmin
  .from('activity_profiles')
  .select('activity_id, title, tier, key_strengths, key_moment, authentic_quote, profile_data')
  .eq('profile_id', profileId)
  .limit(10);

if (activityProfiles && activityProfiles.length > 0) {
  outputs.activityProfiles = activityProfiles.map(ap => {
    // Extract rich story data from the JSONB profile_data if available
    const pd = ap.profile_data as Record<string, any> | null;
    const story = pd?.story as Record<string, any> | undefined;
    const meaning = pd?.meaning as Record<string, any> | undefined;

    // Build a concise origin string from the origin sub-object
    let originStory: string | undefined;
    if (story?.origin) {
      const o = story.origin as Record<string, string>;
      // Combine howStarted + catalyst for a compact origin narrative
      originStory = o.howStarted
        ? (o.catalyst ? `${o.howStarted} (catalyst: ${o.catalyst})` : o.howStarted)
        : undefined;
    }

    return {
      title: ap.title ?? 'Untitled',
      tier: ap.tier ?? 3,
      keyStrengths: Array.isArray(ap.key_strengths) ? ap.key_strengths as string[] : [],
      keyMoment: ap.key_moment ?? undefined,
      authenticQuote: ap.authentic_quote ?? undefined,
      originStory,
      proudestMoment: typeof meaning?.proudestMoment === 'string' ? meaning.proudestMoment : undefined,
      whyItMatters: typeof meaning?.whyItMatters === 'string' ? meaning.whyItMatters : undefined,
    };
  });
}
```

**Why this works**: The `activity_profiles` table has a `profile_data` JSONB column (verified in `chatPersistenceService.ts:45`). The `ActivityProfile` type (verified in `profile/types.ts:34-63`) contains `story.origin` (with `howStarted`, `whyJoined`, `catalyst`) and `meaning.proudestMoment`, `meaning.whyItMatters`. We safely extract with optional chaining and type guards.

**Verification**: Create an activity profile via the activity conversator. Then start a coaching session. The cross-module context should include origin stories and proudest moments.

**Cost impact**: ~100-200 extra tokens per activity in the cross-module context. For a student with 5 activities: ~500-1000 extra tokens. At cached pricing: negligible.

---

### ITEM 5: Portfolio Synthesis Context

**Gap**: The coach has no awareness of the student's overall application narrative, spike, or competitive positioning. It coaches each essay in isolation.

**Files to modify**:
1. `src/services/studentNarrativeBridge.ts` (add portfolioSynthesis field + rendering)
2. `src/http/essayCoachingRoutes.ts` (compute synthesis from loaded activities)

**Step 5a: Add portfolioSynthesis to StudentModuleOutputs**

File: `src/services/studentNarrativeBridge.ts`

**Before** (line 19):
```typescript
export interface StudentModuleOutputs {
  essayIntelligence?: { ... };
  activityProfiles?: Array<{ ... }>;
  piqSummaries?: string[];
  academicContext?: { ... };
}
```

**After** (add after `academicContext`):
```typescript
export interface StudentModuleOutputs {
  essayIntelligence?: { ... };
  activityProfiles?: Array<{ ... }>;
  piqSummaries?: string[];
  academicContext?: { ... };
  /** Derived portfolio synthesis — computed from activity profiles, not stored */
  portfolioSynthesis?: {
    /** Dominant application narrative thread */
    coreNarrative?: string;
    /** Primary spike area (if detected) */
    spike?: string;
    /** Unique differentiator vs typical applicant pool */
    uniqueValue?: string;
    /** Number of Tier 1-2 activities (strong signal activities) */
    strongActivityCount: number;
  };
}
```

**Step 5b: Render portfolio synthesis in assembleStudentContext**

File: `src/services/studentNarrativeBridge.ts`

Add after the academic context rendering (before the return):

```typescript
// Portfolio synthesis (derived from activity profiles — holistic narrative)
if (outputs.portfolioSynthesis) {
  const ps = outputs.portfolioSynthesis;
  const parts: string[] = [];
  if (ps.coreNarrative) parts.push(`Core narrative: ${ps.coreNarrative}`);
  if (ps.spike) parts.push(`Spike: ${ps.spike}`);
  if (ps.uniqueValue) parts.push(`Unique value: ${ps.uniqueValue}`);
  parts.push(`Strong activities (Tier 1-2): ${ps.strongActivityCount}`);
  if (parts.length > 0) sections.push(`Portfolio: ${parts.join('. ')}`);
}
```

**Step 5c: Compute portfolio synthesis in assembleCrossModuleContext**

File: `src/http/essayCoachingRoutes.ts`

Add after the activity profiles mapping block:

```typescript
// Derive lightweight portfolio synthesis from loaded activity data
if (outputs.activityProfiles && outputs.activityProfiles.length >= 2) {
  const strongActivities = outputs.activityProfiles.filter(a => a.tier <= 2);
  // Extract spike from the highest-tier activity
  const topActivity = outputs.activityProfiles
    .slice()
    .sort((a, b) => a.tier - b.tier)[0];

  outputs.portfolioSynthesis = {
    spike: topActivity && topActivity.tier <= 2
      ? `${topActivity.title} (Tier ${topActivity.tier})`
      : undefined,
    strongActivityCount: strongActivities.length,
    // Core narrative and unique value require LLM synthesis —
    // these fields are left undefined until a portfolio analysis has been run
    coreNarrative: undefined,
    uniqueValue: undefined,
  };
}
```

**Why this works**: We derive what we can from existing data without new DB queries or LLM calls. `coreNarrative` and `uniqueValue` remain undefined until a dedicated portfolio analysis module populates them — this is a placeholder that can be enriched later without changing the interface.

**Verification**: With 2+ activity profiles, the cross-module context should include a `Portfolio:` section showing spike and strong activity count.

**Cost impact**: Zero.

---

### ITEM 6: Technique Teaching Enrichment

**Gap**: `routeFindingToTechnique()` returns only `{ technique, directive }`. The coach gets a craft technique name and a coaching directive, but no deeper pedagogical content (WHY the technique works, EXAMPLES of transformations). The `techniqueLibrary.ts` has this content but is never called.

**Files to modify**:
1. `src/services/essayIntelligence/coaching/coachingService.ts` (~3967 and ~4070)

**Step 6a: Add technique-to-category mapping**

Add after the `TECHNIQUE_ROUTES` array (after line ~215):

```typescript
/**
 * Maps TECHNIQUE_ROUTES technique names to TechniqueLibrary category IDs.
 * Used to look up pedagogical content (WHY, HOW, EXAMPLES) for each route.
 * Only mapped techniques get enriched teaching — unmapped ones keep the base directive.
 */
const TECHNIQUE_TO_CATEGORY: Record<string, string> = {
  'SUMMARY-TO-SCENE': 'storytelling',
  'COLD OPEN / SENSORY TIMESTAMP': 'storytelling',
  'SOMATIC VULNERABILITY': 'voice_authenticity',
  'NAMED CHARACTER': 'storytelling',
  'EVIDENCE ANCHORING': 'evidence_impact',
  'COLLABORATIVE SPECIFICITY': 'evidence_impact',
  'RITUAL DETAIL / BOOKEND INVERSION': 'storytelling',
  'VOICE COMPARISON': 'voice_authenticity',
  'FUNCTIONAL DETAIL': 'storytelling',
  'STAKES ESTABLISHMENT': 'storytelling',
  'SCENE EXPANSION': 'storytelling',
  'NARRATIVE ARC': 'storytelling',
  'SHOW THROUGH SPECIFIC ACTION': 'evidence_impact',
  'VOICE AUTHENTICITY': 'voice_authenticity',
  'DEFINITIONAL PIVOT': 'voice_authenticity',
  'SUSTAINED VULNERABILITY': 'reflection_depth',
  'ANTI-LESSON': 'reflection_depth',
};
```

**Step 6b: Create enriched routing function**

Replace `routeFindingToTechnique` (line 3967-3985):

**Before**:
```typescript
private routeFindingToTechnique(finding: Finding): { technique: string; directive: string } | null {
  const claimLower = finding.claim.toLowerCase();
  for (const route of TECHNIQUE_ROUTES) {
    const keywordsMatch = route.claimKeywords.every(kw => claimLower.includes(kw));
    if (!keywordsMatch) continue;
    if (route.dimensions && route.dimensions.length > 0) {
      const dimMatch = route.dimensions.some(d => finding.dimensions.includes(d));
      if (!dimMatch) continue;
    }
    return { technique: route.technique, directive: route.directive };
  }
  return null;
}
```

**After**:
```typescript
private async routeFindingToEnrichedTechnique(finding: Finding): Promise<{
  technique: string;
  directive: string;
  /** Pedagogical enrichment from technique library (null if no match) */
  enrichment: string | null;
} | null> {
  const claimLower = finding.claim.toLowerCase();

  for (const route of TECHNIQUE_ROUTES) {
    const keywordsMatch = route.claimKeywords.every(kw => claimLower.includes(kw));
    if (!keywordsMatch) continue;
    if (route.dimensions && route.dimensions.length > 0) {
      const dimMatch = route.dimensions.some(d => finding.dimensions.includes(d));
      if (!dimMatch) continue;
    }

    // Look up pedagogical content from technique library
    let enrichment: string | null = null;
    const categoryId = TECHNIQUE_TO_CATEGORY[route.technique];
    if (categoryId) {
      const { getTechniqueTeaching } = await import('./techniqueLibrary');
      const teaching = await getTechniqueTeaching(categoryId);
      if (teaching) {
        // Compact to ~100 tokens: WHY + one example
        enrichment = `WHY: ${teaching.why.slice(0, 200)}`;
        if (teaching.examples && teaching.examples !== 'No transformation examples available.') {
          // Take first example only
          const firstExample = teaching.examples.split('\n\n')[0];
          if (firstExample) enrichment += `\nEXAMPLE: ${firstExample.slice(0, 300)}`;
        }
      }
    }

    return { technique: route.technique, directive: route.directive, enrichment };
  }

  return null;
}
```

**Step 6c: Make buildFindingCoachingContext async and use enriched routing**

File: `src/services/essayIntelligence/coaching/coachingService.ts`

**Before** (line 4002):
```typescript
private buildFindingCoachingContext(
```

**After**:
```typescript
private async buildFindingCoachingContext(
```

**Before** (line 4080-4085, inside the `findingLines` map):
```typescript
const findingLines = selectedFindings.map(f => {
  // ...
  const techniqueMatch = this.routeFindingToTechnique(f);
  const techniqueDirective = techniqueMatch
    ? `\n  → TECHNIQUE: ${techniqueMatch.technique} — ${techniqueMatch.directive}`
    : '';
  return `[${f.id}] ...`;
});
```

**After** (use `Promise.all` for parallel enrichment):
```typescript
const findingLines = await Promise.all(selectedFindings.map(async f => {
  const scopeStr = f.scope.type === 'essay_level'
    ? 'essay-level'
    : f.scope.type === 'cross_paragraph'
    ? `P${(f.scope.paragraphs ?? []).map(p => p + 1).join('+P')}`
    : `P${(f.scope.paragraph ?? 0) + 1}`;
  const dims = f.dimensions.join(', ');
  const evidence = f.evidence.length > 0
    ? ` Evidence: "${f.evidence[0].text.slice(0, 100)}${f.evidence[0].text.length > 100 ? '...' : ''}"`
    : '';
  // Route finding to enriched technique with pedagogical content
  const techniqueMatch = await this.routeFindingToEnrichedTechnique(f);
  let techniqueDirective = '';
  if (techniqueMatch) {
    techniqueDirective = `\n  → TECHNIQUE: ${techniqueMatch.technique} — ${techniqueMatch.directive}`;
    if (techniqueMatch.enrichment) {
      techniqueDirective += `\n  → TEACHING: ${techniqueMatch.enrichment}`;
    }
  }
  return `[${f.id}] [${f.maturity}/${f.coachingValue}] ${scopeStr} [${dims}]\n  ${f.claim}${evidence}${techniqueDirective}`;
}));
```

**Step 6d: Update call site to await**

File: `src/services/essayIntelligence/coaching/coachingService.ts` (line 1716)

**Before**:
```typescript
const findingSection = this.buildFindingCoachingContext(coordinator, localStage1Adapter, profile);
```

**After**:
```typescript
const findingSection = await this.buildFindingCoachingContext(coordinator, localStage1Adapter, profile);
```

**Why this works**: `runStage3CoachingResponse` is already async. `techniqueLibrary.ts` uses a module-level cache (`_techniqueBundles`), so the lazy import is a one-time cost on first call. Subsequent calls return from cache. The `Promise.all` ensures all findings are enriched in parallel.

**Verification**: Run a coaching session on an essay with identified findings. The Stage 3 prompt should include `TEACHING:` blocks with WHY + EXAMPLE alongside technique directives.

**Cost impact**: Zero new LLM calls. Adds ~100-200 tokens per matched finding to the system prompt. With 3-5 matched findings: ~300-1000 extra tokens. These are cached.

---

### ITEM 7: Transformation Example Injection

**Gap**: `TRANSFORMATION_EXAMPLES` (before/after writing examples) exist in the codebase but are never injected into coaching prompts. The coach describes techniques abstractly instead of demonstrating transformations.

**Files to modify**:
1. `src/services/essayIntelligence/coaching/coachingService.ts` (inside `routeFindingToEnrichedTechnique`)

**Implementation**: Add transformation example lookup to the enrichment step in ITEM 6.

In the `routeFindingToEnrichedTechnique` function (from ITEM 6), after the technique teaching lookup, add:

```typescript
// Also look up a matching transformation example (before/after)
const TECHNIQUE_TO_CRAFT_MOVE: Record<string, string> = {
  'SUMMARY-TO-SCENE': 'sensory_details',
  'COLD OPEN / SENSORY TIMESTAMP': 'sensory_details',
  'SOMATIC VULNERABILITY': 'emotional_physical',
  'NAMED CHARACTER': 'specific_names',
  'EVIDENCE ANCHORING': 'statistics_data',
  'COLLABORATIVE SPECIFICITY': 'specific_names',
  'SHOW THROUGH SPECIFIC ACTION': 'active_verbs',
  'STAKES ESTABLISHMENT': 'emotional_physical',
  'VOICE AUTHENTICITY': 'active_verbs',
};

const craftMove = TECHNIQUE_TO_CRAFT_MOVE[route.technique];
if (craftMove) {
  const { TRANSFORMATION_EXAMPLES } = await import(
    '../../commonAppWorkshop/data/transformationExamples'
  );
  const example = TRANSFORMATION_EXAMPLES.find(
    ex => ex.primaryCraftMove === craftMove
  );
  if (example && enrichment) {
    enrichment += `\nTRANSFORMATION:\n  Before: "${example.before.text.slice(0, 150)}..."\n  After: "${example.after.text.slice(0, 150)}..."`;
  } else if (example && !enrichment) {
    enrichment = `TRANSFORMATION:\n  Before: "${example.before.text.slice(0, 150)}..."\n  After: "${example.after.text.slice(0, 150)}..."`;
  }
}
```

**Why this works**: `TRANSFORMATION_EXAMPLES` is verified as a named export (`export const TRANSFORMATION_EXAMPLES: TransformationExample[]`). Each example has `primaryCraftMove` of type `CraftMove = 'sensory_details' | 'specific_names' | 'active_verbs' | 'statistics_data' | 'emotional_physical'`. The mapping from technique route names to craft moves is semantically sound (e.g., `SUMMARY-TO-SCENE` is about `sensory_details`).

**Verification**: Trigger a coaching turn where a finding matches `SUMMARY-TO-SCENE`. The prompt should include a `TRANSFORMATION:` block with a concrete before/after example.

**Cost impact**: ~100-200 extra tokens per matched finding. Cached in system prompt.

---

## Cost Summary

| Item | New LLM Calls | Extra Prompt Tokens | Dev Effort |
|------|---------------|---------------------|------------|
| 1. Essay Type | 0 | ~200 (type-specific guidance) | 10 min |
| 2. Word Count | 0 | 0 (same tokens, different numbers) | 5 min |
| 3. College Overlay | 0 | ~300-500 (college data, cached) | 30 min |
| 4. Activity Depth | 0 | ~500-1000 (richer activity context) | 20 min |
| 5. Portfolio Synthesis | 0 | ~50-100 (derived summary) | 15 min |
| 6. Technique Teaching | 0 | ~300-1000 (pedagogical content, cached) | 25 min |
| 7. Transformation Examples | 0 | ~200-400 (before/after, cached) | 10 min |
| **TOTAL** | **0** | **~1550-3200** | **~2 hours** |

All additional tokens are injected into the system prompt and cached via `cacheSystemPrompt: true`. At Sonnet cached read pricing (~$0.30/1M tokens), the incremental cost is ~$0.0005-0.001 per turn. Negligible.

---

## Open Questions (Resolvable During Implementation)

1. **Supplement word limits vary by college**. ITEM 2 uses a flat 250. Should we look up per-college word limits from college research data? The `CollegeResearch` type may have a `maxWords` field — verify during implementation.

2. **Activity profiles table columns**. ITEM 4 assumes `profile_data` is always returned as a JSON object by Supabase. Verify that the column type is indeed `jsonb` (not `json` or `text`), and that Supabase auto-parses it.

3. **TECHNIQUE_TO_CATEGORY mapping completeness**. ITEM 6 maps 17 of 19 TECHNIQUE_ROUTES entries. Two are unmapped (`BRIDGE SENTENCE`, `ENACTED PARALLEL`). Verify during implementation whether these map to `connection_specificity` or should be left unmapped.

4. **Transformation example quality**. ITEM 7 takes the FIRST matching example per craft move. The examples database may have better matches for specific essay contexts. Consider scoring by `relevantPromptTypes` alignment if needed.

5. **College ID validation**. ITEM 3 passes `collegeId` from the request body without validation beyond lowercasing. The `getCollegeCoachingOverlay()` function returns null for unknown IDs, which is safe but silent. Consider logging a warning for unknown college IDs.

---

## File Change Summary

| File | Items | Nature |
|------|-------|--------|
| `src/services/essayIntelligence/coaching/coachingService.ts` | 1, 2, 3e, 6, 7 | Core changes: BlockContext population, word count, enriched technique routing, async buildFindingCoachingContext |
| `src/http/essayCoachingRoutes.ts` | 3a-c, 4c, 5c | Session store extension, collegeId threading, activity depth query, portfolio synthesis derivation |
| `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` | 3d | processCoachingTurn signature + threading |
| `src/services/studentNarrativeBridge.ts` | 4a-b, 5a-b | Type extension + rendering for activity depth and portfolio synthesis |

No new files created. No new DB tables. No new LLM calls. No breaking changes to existing consumers.
