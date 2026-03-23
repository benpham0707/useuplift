# FORGE_PLAN_CONVERSATOR.md — Final Implementation Blueprint

**Date**: 2026-03-15
**Pipeline**: Analyst -> Agent A (Direct) + Agent B (Rethink) -> Reality Checker + Blueprint Assembler
**Status**: FINAL — passes the "start coding" test

---

## PART 1: REALITY VERIFICATION

### Verification Summary

Every claim from both agents was verified against the actual codebase. Below are the findings organized by agent and gap.

---

### Finding A-1-1
**Severity**: weak
**Issue**: Agent A proposes appending a ~1200-token craft technique library to the "cached system prompt." The system prompt is `staticCoachingPhilosophy` (lines 873-1019, coachingService.ts), which is already ~1500 tokens of dense philosophy text. The system prompt is cached (`cacheSystemPrompt: true`, line 1151). Adding 1200 tokens WORKS technically — the cache will include it — but it inflates every cached prompt and the library itself is static knowledge that Sonnet already has.
**Fix**: If a technique library is added, it belongs in the system prompt for caching benefit. But the library should be compact (~400 tokens max) and reference existing profile data rather than duplicating knowledge Sonnet already possesses.

### Finding A-2-1
**Severity**: broken
**Issue**: Agent A proposes `techniquesTaught: Array<{technique, turnIntroduced, studentDemonstrated}>` on `CoachingSessionMemory` with "regex matching against 15 known technique names in the coach's response text." This is fundamentally incompatible with CLAUDE.md's LLM-first design principles and the `feedback_llm-first-design.md` rules: "No regex quality enforcement" and "LLM owns judgment, system tracks." Regex against free-text coaching responses is fragile and violates the codebase's architecture.
**Fix**: Track demonstrated capabilities via LLM extraction (B's approach), not regex.

### Finding A-3-1
**Severity**: weak
**Issue**: Agent A proposes adding `interactionMode` to Stage1Output. Stage1Output (line 153, coachingService.ts) already has 14 fields. Adding an 8th output field to an already-complex Haiku JSON schema increases parse failure risk. The existing `cognitiveState` (10 values) + `conversationType` (4 values) + `scopeCertainty` (3 values) already provide substantial mode signal.
**Fix**: Mode detection is better handled by Stage 1.5's `CognitiveAssessment.recommendedApproach` (free prose, line 2061), which already adapts to context without a closed taxonomy.

### Finding A-4-1
**Severity**: incomplete
**Issue**: Agent A proposes changing `buildFindingCoachingContext()` call signature to `buildFindingCoachingContext(coordinator, stage1)`. The actual signature (line 2360) is `buildFindingCoachingContext(coordinator: EssayProfileCoordinator): string`. The function calls `coordinator.getFindingStore()` then `buildFindingContext(findingStore, options)`. Adding scope filtering is correct in principle, but the proposed function name change doesn't match the actual function — the real function is a private method on `CoachingService`, not the imported `buildFindingContext` from `findingContextBuilder.ts`.
**Fix**: Modify the existing private method `buildFindingCoachingContext` to accept `stage1: Stage1Output` as a second parameter and use `focusProbabilities` to compute `scopeFilter`.

### Finding A-5-1
**Severity**: incomplete
**Issue**: Agent A proposes `formatEditUnderstandingForCoaching()` utility. No such function exists. The `editStrategyContext` parameter already exists on `processCoachingTurn` (line 237) and is passed through to Stage 3 (line 866). It's currently a plain string populated by the caller (version tracker). The `EditUnderstandingOutput` type (line 3373, profileTypes.ts) contains `diff`, `understanding`, `stalenessEffects`, `analysisMode`. The `EditUnderstanding` type (line 1317) has `significance`, `significanceReasoning`, `apparentPurpose`, `purposeConfidence`, `profileImpact.connectionImpact`, `profileImpact.holisticImpact`. The data is rich — the serialization utility is the right idea, but it must be built from scratch.
**Fix**: Create the utility in the version tracker or as a new helper, serializing `EditUnderstandingOutput` into the `editStrategyContext` string that's already wired through.

### Finding A-6-1
**Severity**: weak
**Issue**: Agent A proposes a `student_profile` JSONB column on the `profiles` DB table. The `profiles` table (per CLAUDE.md schema) stores user data and credits. Adding per-student learning preferences here conflates user account data with essay coaching session data. Also, `student_profile` naming collides conceptually with `EssayProfile`.
**Fix**: Cross-essay student preferences should be stored as a separate field, but the naming needs care. Consider `coaching_preferences` on the `profiles` table, or a separate `student_coaching_profiles` table.

### Finding A-8-1
**Severity**: incomplete
**Issue**: Agent A proposes "enrich `assembleL6CoachingParagraph` with authenticVsPerformed data scoped to target paragraph." The actual function (line 1140, profileRouter.ts) already includes a `voiceContext` section (lines 1210-1221) with `signature`, `register.baseline`, and `distinctivePatterns`. It does NOT include `authenticVsPerformed`. The `authenticVsPerformed` field (line 541, profileTypes.ts) is `Array<{location: [number, number], assessment: 'authentic' | 'performed', reasoning: string}>`. Scoping this to the target paragraph is straightforward — filter by `location[0] === pIdx`.
**Fix**: Add paragraph-scoped `authenticVsPerformed` entries to the existing `voiceContext` section in `assembleL6CoachingParagraph`.

### Finding A-10-1
**Severity**: weak
**Issue**: Agent A proposes adding `profile.essayUnderstanding.prose` and `centralTension` to `buildProfileContextText()`. Both fields exist on `EssayProfile.essayUnderstanding` (lines 1611, 1618, profileTypes.ts). The function `buildProfileContextText` (line 1173, coachingService.ts) currently includes: North Star summary, critical concerns, assembled profile sections, and conversation insights. Adding prose (~300-700 tokens) to EVERY route would inflate token costs for paragraph-scoped queries where it's not needed.
**Fix**: B's approach is better — include prose+centralTension for overview route (where holistic context matters), centralTension one-liner for other routes.

### Finding B-1-1
**Severity**: weak
**Issue**: Agent B proposes a ~300-token directive telling Sonnet to "USE the profile's existing CraftAssessment data as its technique library." The `CraftAssessment` type (line 839, profileTypes.ts) has `strengthSignatures`, `growthEdges`, `imageSystem`, `sentencePatterns`, `wordPatterns`. These are essay-specific observations, NOT a technique library. Telling Sonnet to "use them as your technique library" conflates observation with instruction. The 7 named techniques (sensory threading, earned abstraction, etc.) are not defined anywhere in the codebase.
**Fix**: A compact technique library with named techniques IS useful as a shared vocabulary between coach and student. But it should reference profile data to ground techniques in the student's essay, not replace the library concept entirely.

### Finding B-2-1
**Severity**: incomplete
**Issue**: Agent B proposes adding `demonstratedCapabilities: string[]` to SessionMemory, populated by the existing pattern detection Haiku call. The pattern detection call (line 1801, coachingService.ts) uses Haiku with a specific JSON schema (lines 1827-1845). Adding a new output field is feasible — the schema is in the system prompt, not compiled. However, the parsed output type (line 1890-1896) must also be updated, and the defensive fallback (lines 1898-1912) must handle the new field.
**Fix**: Extend the pattern detection Haiku call's JSON schema with a `demonstratedCapabilities` field. This is clean — one call already exists, adding one field is low-risk.

### Finding B-3-1
**Severity**: weak
**Issue**: Agent B proposes NO explicit modes, relying on `CognitiveAssessment.recommendedApproach`. The `recommendedApproach` field (line 2061, profileTypes.ts) is free prose, produced by Stage 1.5 Haiku (line 1960). This is already the system's mode-selection mechanism. B is correct that adding explicit modes creates a closed taxonomy that violates LLM-first design. However, there is no mechanism for MODE PERSISTENCE — a brainstorming session should STAY in brainstorm mode across turns without the student re-requesting it.
**Fix**: Add `approachesUsed` tracking (already exists on SessionMemory, line 2096-2101) with the recommended approach text. Inject this history into Stage 1.5 so the cognitive assessment can detect "student is still in brainstorming mode" implicitly.

### Finding B-4-1
**Severity**: incomplete
**Issue**: Agent B proposes routing-rule-aware finding injection. The current `buildFindingCoachingContext` (line 2360) is called AFTER routing (line 1099), so the routing rule IS available. However, B's proposal doesn't specify HOW to get the routing rule into the finding context builder — the current method takes only `coordinator`. The routing rule variable is `routingRule` (line 287-288) but it's not passed to the finding context builder.
**Fix**: Pass `routingRule` to the finding context builder so it can scope findings per route.

### Finding B-5-1
**Severity**: weak
**Issue**: Agent B's "REVISION COACHING PROTOCOL" is a prompt-only change — a 4-step protocol injected into the system prompt. This is conceptually sound but the system prompt is already ~1500 tokens of dense philosophy. The edit context is already injected at the USER prompt level (line 1030-1038). Adding revision-specific protocol to the system prompt while edit context lives in the user prompt creates split attention.
**Fix**: The revision coaching protocol should be injected at the USER prompt level, conditional on `recentEditContext` being present, right after the edit context section.

### Finding B-6-1
**Severity**: weak
**Issue**: Agent B's `StudentDurableStore` proposes `durability: 'student_durable'` on insights. The existing `ConversationInsight` type (lines 1716-1717, profileTypes.ts) already has a durability concept via `preferenceDurability` on Stage1Output (line 172). However, actual persistence of cross-essay preferences is NOT implemented anywhere — the `profiles` table doesn't have a coaching preferences column.
**Fix**: Both agents need a persistence mechanism. The simpler approach: add a `coaching_preferences` JSONB column to the profiles table, populated at session end with student preferences that have `preferenceDurability: 'general'`.

### Finding B-8-1
**Severity**: incomplete
**Issue**: Agent B proposes a "Voice Shield" — ~150 tokens in `buildProfileContextText`. The function (line 1173) is a private method on `CoachingService` that builds a string from profile sections. Injecting voice shield data here is feasible. However, B claims "top 3 authentic moments" — the `authenticVsPerformed` array (line 541) is not ranked. "Top 3" would require a ranking heuristic or LLM pre-processing.
**Fix**: Include ALL `authenticVsPerformed` entries (typically 4-8 entries) filtered to just `'authentic'` assessments, with their locations and reasoning. No arbitrary "top 3" — let the LLM decide which are most relevant.

### Finding B-10-1
**Severity**: weak
**Issue**: Agent B proposes that for `l6_coaching_overview` route, prose understanding REPLACES structured holistic sections, saving 3000-5000 tokens. The `assembleL6CoachingOverview` (line 1329, profileRouter.ts) currently includes ALL holistic sections as `holisticFull` (lines 1343-1360). Replacing this with `essayUnderstanding.prose` (~300-700 tokens) would save tokens but LOSE structured data that coaching might need (specific voice observations, specific craft patterns, emotional arc details). The prose is a synthesis, not a lossless summary.
**Fix**: Include BOTH prose (as the primary framing) AND a compact summary of holistic sections (key fields only), not the full dump. This gives the best of both worlds.

---

## PART 2: FORCED-CHOICE SYNTHESIS

| Gap | Choice | Rationale |
|-----|--------|-----------|
| GAP-1 (Craft) | `hybrid` | A's compact library (reduced to ~400 tokens) + B's directive to use profile data |
| GAP-2 (Capability) | `rethink` | B's Haiku-extracted capabilities. A's regex is anti-pattern in this codebase. |
| GAP-3/7/9 (Modes) | `refined` | Neither. Leverage existing CognitiveAssessment + enhanced session memory history |
| GAP-4 (Findings) | `hybrid` | Both scope findings. B's routing-rule-aware approach + A's `stage1` parameter passing |
| GAP-5 (Revision) | `hybrid` | A's serialization utility + B's coaching protocol as conditional user prompt injection |
| GAP-6 (Cross-Essay) | `refined` | Simpler than both. Use existing `preferenceDurability` on insights + DB persistence |
| GAP-8 (Voice) | `hybrid` | A's router enrichment (scoped authenticVsPerformed) + B's voice shield directive in system prompt |
| GAP-10 (Understanding) | `refined` | Include prose+centralTension with smart scoping: full for overview, centralTension-only for others |

### GAP-1 Decision Rationale
A's 1200-token library is too large — Sonnet already knows writing techniques. B's 300-token directive that tells Sonnet to use CraftAssessment "as a technique library" is conceptually confused — CraftAssessment contains essay-specific observations, not technique definitions. The hybrid: a ~400-token technique vocabulary (10 named techniques with 1-line definitions) appended to the system prompt, PLUS a directive to ground technique teaching in the profile's CraftAssessment data. The vocabulary creates shared language between coach and student; the profile data grounds it in the actual essay.

### GAP-2 Decision Rationale
A's regex extraction violates LLM-first design (Rule: "No regex quality enforcement"). The pattern detection Haiku call already runs, already produces JSON output, already has a schema. Adding `demonstratedCapabilities: string[]` to its output is a 5-line schema change. The Haiku sees the full conversation and can identify what the student has demonstrated (used a technique, applied a concept, articulated an insight) far better than regex matching against a fixed list.

### GAP-3/7/9 Decision Rationale
A's explicit modes (7-value enum + Haiku detection + mode persistence) creates a closed taxonomy that contradicts LLM-first design. B correctly identifies that CognitiveAssessment already handles this, but misses the mode persistence problem — a brainstorming session should feel continuous without the student re-requesting it each turn. The refined approach: inject `approachesUsed` history into Stage 1.5 so the Haiku can detect continuity ("student has been brainstorming for 3 turns"), and add a `sessionMode` free-text field to SessionMemory updated by the pattern detection call. No enum, no closed taxonomy — the LLM describes the mode in prose.

### GAP-4 Decision Rationale
Both agents scope findings. B's routing-rule-aware approach is more nuanced (voice routes get voice-dimension findings, paragraph routes get paragraph-scoped findings). A's mechanism for getting Stage1 data into the finder context is correct. The hybrid: modify `buildFindingCoachingContext` to accept both `coordinator` and `stage1`+`routingRule`, then apply routing-rule-aware scoping per B's design.

### GAP-5 Decision Rationale
A correctly identifies that `EditUnderstandingOutput` should be serialized into the already-wired `editStrategyContext` string. B's revision coaching protocol is a good prompt-level improvement. The hybrid: build the serialization utility (A) AND inject a conditional revision coaching protocol at the user prompt level near the edit context section (B, with fix from B-5-1).

### GAP-8 Decision Rationale
A's router enrichment adds paragraph-scoped `authenticVsPerformed` data to the `voiceContext` section in `assembleL6CoachingParagraph`. This is valuable — the coach needs to know which voice moments are authentic vs performed when discussing a specific paragraph. B's voice shield directive ("Any suggestion must PRESERVE this writer's voice") belongs in the system prompt as a coaching philosophy addition. Both changes are complementary, not competing.

### GAP-10 Decision Rationale
A's always-include approach wastes tokens on paragraph-scoped queries. B's replace-on-overview approach loses structured data. The refined approach: for `l6_coaching_overview`, include `prose` + `centralTension` + compact holistic summary (signature, top threads, top strength). For `l6_coaching_paragraph` and `l6_coaching_voice`, include `centralTension` one-liner only. For `inline_edit_sentence`, omit (sentence-level doesn't need essay-wide understanding prose).

---

## PART 3: IMPLEMENTATION BLUEPRINT

### Architecture Overview

All 8 gaps are implemented as changes to 3 core files + 1 new utility + 1 DB migration:

| File | Changes |
|------|---------|
| `src/services/essayIntelligence/coaching/coachingService.ts` | GAP-1, GAP-3, GAP-4, GAP-5, GAP-10 |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | GAP-8, GAP-10 |
| `src/services/essayIntelligence/profileTypes.ts` | GAP-2, GAP-3, GAP-6 |
| `src/services/essayIntelligence/coaching/editContextFormatter.ts` | GAP-5 (new file) |
| `supabase/migrations/NNNN_coaching_preferences.sql` | GAP-6 |

**Zero new LLM calls.** All changes extend existing prompts or add system prompt text.
**Estimated cost delta: ~$0.001-0.003/turn** (from additional tokens in cached system prompt + session memory fields).

---

### ITEM 1: Craft Technique Vocabulary (GAP-1)

**Choice**: `hybrid` — compact technique library in system prompt + directive to ground in profile data

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: Append to `staticCoachingPhilosophy` (after line 1019, before the closing backtick)

**Exact text to append** (~400 tokens):

```typescript
// Append to staticCoachingPhilosophy string, after the "COACHING PATTERNS" section:

`

CRAFT TEACHING VOCABULARY:
When teaching craft, use these named techniques so the student builds a shared vocabulary:

- SENSORY GROUNDING: Replace abstract claims with physical details the reader can see/hear/touch
- EARNED ABSTRACTION: An insight the essay has BUILT toward, not asserted at the start
- TONAL COUNTERPOINT: Placing contrasting emotional registers next to each other for impact
- RHYTHMIC VARIATION: Alternating sentence lengths — short punch after long build
- SHOW-DON'T-TELL INVERSION: When the essay TELLS an emotion it should SHOW through action/detail
- SUBTEXT CONSTRUCTION: What the essay communicates WITHOUT stating — through juxtaposition, omission, implication
- SPECIFICITY ESCALATION: Moving from general to hyper-specific ("music" -> "Chopin's Ballade No. 1 at 2am")
- BOOKENDING: Opening and closing images/phrases that create structural resonance
- VOICE ANCHORING: Sentences where the writer sounds MOST like themselves — protect and amplify these
- NARRATIVE COMPRESSION: Covering more time/events in fewer words when the material isn't load-bearing

Your profile context includes CraftAssessment (strengthSignatures, growthEdges) — USE those to identify which techniques this student already employs and which they need.
When you reference a technique, NAME IT so the student can recognize it later: "This is what I'd call sensory grounding — you're replacing 'I felt sad' with 'I couldn't look at the piano without hearing her breathing.'"`;
```

**Why these 10**: Each addresses a specific, common essay weakness observable in admissions writing. They are orthogonal (no overlap). They map naturally to the existing `CraftAssessment.strengthSignatures` and `growthEdges` fields.

**Token impact**: ~400 tokens added to the cached system prompt. Since the system prompt is cached (`cacheSystemPrompt: true`), this is a one-time cost of ~$0.0015 per session, then free on subsequent turns via cache read.

**Verification**: The system prompt is passed as `systemPrompt` to `callClaude` at line 1143 with `cacheSystemPrompt: true`. The technique vocabulary will be cached with the rest of the philosophy.

---

### ITEM 2: Demonstrated Capabilities Tracking (GAP-2)

**Choice**: `rethink` — extend the pattern detection Haiku call

**File 1**: `src/services/essayIntelligence/profileTypes.ts`
**Location**: `CoachingSessionMemory` interface (line 2082)

**Type change** — add field after `nextFocus`:

```typescript
export interface CoachingSessionMemory {
  // ... existing fields (turnCount, topicsDiscussed, approachesUsed, studentStances, sessionArcSummary, nextFocus) ...

  /**
   * Capabilities the student has DEMONSTRATED in this session.
   * Populated by the pattern detection Haiku — the LLM identifies when
   * the student has used a technique, articulated a concept, or shown
   * a capability they hadn't shown before.
   *
   * Each entry is a free-text description, not a fixed taxonomy.
   * Examples: "used specificity escalation in P3 revision",
   *           "identified voice shift between P2-P3 unprompted",
   *           "articulated the difference between showing and telling"
   */
  demonstratedCapabilities: string[];
}
```

**File 2**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location 1**: `detectPatternsLLM` system prompt (line 1817), add to the JSON schema:

```
// Add to the JSON schema in the system prompt, after "qualitySignals":
  "demonstratedCapabilities": ["<things the student HAS DONE in this conversation — techniques applied, concepts articulated, self-corrections made>"]
```

**Location 2**: Parse the new field (after line 1931):

```typescript
// After qualitySignals parse, add:
const demonstratedCapabilities: string[] = Array.isArray(parsed.demonstratedCapabilities)
  ? parsed.demonstratedCapabilities.filter((c: unknown) => typeof c === 'string')
  : [];
```

**Location 3**: Return it in the result (after line 1937):

```typescript
// Add to return object:
demonstratedCapabilities,
```

**Location 4**: Update session memory after pattern detection (around line 322):

```typescript
// After line 322 (memory.nextFocus = patternResult.nextFocusSuggestion):
memory.demonstratedCapabilities = [
  ...new Set([
    ...memory.demonstratedCapabilities,
    ...patternResult.demonstratedCapabilities,
  ])
];
```

**Location 5**: `initializeSessionMemory` (line 2171), add:

```typescript
demonstratedCapabilities: [],
```

**Location 6**: Inject into Stage 3 prompt — add to the session arc section (around line 1077):

```typescript
// Add to sessionArcSection, after the nextFocus line:
${sessionMemory.demonstratedCapabilities.length > 0
  ? `STUDENT HAS DEMONSTRATED: ${sessionMemory.demonstratedCapabilities.join('; ')}\nBuild on what they can already do. Don't re-teach what they've shown they understand.`
  : ''}
```

**Cost**: Zero additional LLM calls. The pattern detection Haiku call (line 1868) already runs on turn 3+. Adding one JSON field adds ~20 output tokens per call = ~$0.00002/turn.

---

### ITEM 3: Session Mode Continuity (GAP-3/7/9)

**Choice**: `refined` — leverage existing CognitiveAssessment + enhanced session memory

**File 1**: `src/services/essayIntelligence/profileTypes.ts`
**Location**: `CoachingSessionMemory` interface (line 2082)

**Type change** — add `sessionMode` field:

```typescript
export interface CoachingSessionMemory {
  // ... existing fields ...

  /**
   * LLM-inferred session mode — what kind of interaction is happening.
   * Updated by pattern detection. Free text, NOT an enum.
   *
   * Examples:
   * - "brainstorming alternative openings"
   * - "deep-diving into voice patterns in P3"
   * - "working through a revision of the conclusion"
   * - "processing emotional reaction to feedback"
   * - "evaluating two competing approaches to the transition"
   *
   * The Stage 1.5 cognitive assessment reads this to detect continuity.
   * The Stage 3 prompt uses it to maintain session coherence.
   */
  sessionMode: string;
}
```

**File 2**: `src/services/essayIntelligence/coaching/coachingService.ts`

**Location 1**: `detectPatternsLLM` system prompt (line 1817), add:

```
// Add to the JSON schema:
  "sessionMode": "<1-sentence description of what kind of interaction is happening right now>"
```

**Location 2**: Parse and apply (after pattern detection result handling, ~line 323):

```typescript
memory.sessionMode = patternResult.sessionMode || memory.sessionMode || '';
```

**Location 3**: Inject into Stage 1.5 cognitive assessment prompt (line 1972). Add after the session memory injection:

```typescript
// In the userPrompt for Stage 1.5, add:
${sessionMemory.sessionMode ? `CURRENT SESSION MODE: ${sessionMemory.sessionMode}\nIf the student's message continues this mode, your assessment should acknowledge the continuity.` : ''}
```

**Location 4**: Inject into Stage 3 session arc section (around line 1077):

```typescript
// Add to sessionArcSection:
${sessionMemory.sessionMode ? `CURRENT MODE: ${sessionMemory.sessionMode}` : ''}
```

**Location 5**: `initializeSessionMemory` (line 2171), add:

```typescript
sessionMode: '',
```

**Why this over explicit modes**: The existing system already has mode-like behavior through `CognitiveAssessment.recommendedApproach` (line 2061) + `conversationType` (line 161). What it lacks is PERSISTENCE — knowing that "we've been brainstorming for 3 turns." A free-text `sessionMode` field populated by the pattern detection Haiku provides this persistence without a closed taxonomy. The Haiku sees the full conversation and can describe the mode naturally. The LLM reading this description in subsequent turns will maintain continuity.

**Cost**: Zero additional LLM calls. ~30 tokens added to existing pattern detection output + ~15 tokens added to Stage 1.5 + Stage 3 prompts.

---

### ITEM 4: Routing-Rule-Aware Finding Injection (GAP-4)

**Choice**: `hybrid` — B's routing-rule-aware scoping + A's parameter passing

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`

**Change 1**: Modify call site (line 1099) to pass routing context:

```typescript
// Change from:
const findingSection = this.buildFindingCoachingContext(coordinator);
// To:
const findingSection = this.buildFindingCoachingContext(coordinator, stage1, routingRule);
```

**Change 2**: Modify `buildFindingCoachingContext` (line 2360):

```typescript
/**
 * Build finding context scoped to the current routing rule and student focus.
 *
 * Routing-rule-aware scoping:
 * - l6_coaching_paragraph: paragraph-scoped findings + 2 essay-level critical
 * - l6_coaching_voice: voice/craft dimension findings only
 * - l6_coaching_overview: top 5 by coaching value as coaching priorities
 * - inline_edit_sentence: sentence-scoped findings only
 */
private buildFindingCoachingContext(
  coordinator: EssayProfileCoordinator,
  stage1: Stage1Output,
  routingRule: RoutingRule,
): string {
  const findingStore = coordinator.getFindingStore();
  const active = findingStore.getActiveSortedByCoachingValue();

  if (active.length === 0) return '';

  // Determine scope based on routing rule
  const options: import('../findings/findingContextBuilder').FindingContextOptions = {
    includeSuperseded: false,
    includeEvidence: true,
    includeLineage: false,
    includeDeepeningPotential: false,
  };

  switch (routingRule) {
    case 'l6_coaching_paragraph':
    case 'inline_edit_sentence': {
      // Extract focus paragraph from Stage 1
      const focusPara = this.extractFocusParagraph(stage1);
      if (focusPara !== null) {
        options.scopeFilter = focusPara;
        options.maxActiveFindings = 5;
      } else {
        options.maxActiveFindings = 3;
      }
      break;
    }
    case 'l6_coaching_voice': {
      // Filter to voice/craft dimension findings
      const voiceCraftFindings = active.filter(f =>
        f.dimensions.some(d => ['voice', 'craft'].includes(d))
      );
      if (voiceCraftFindings.length > 0) {
        // Build custom context from filtered findings
        const lines = voiceCraftFindings.slice(0, 5).map(f =>
          `${f.id} [${f.maturity}/${f.coachingValue}] ${f.claim.slice(0, 150)}`
        );
        return `\n\n=== VOICE & CRAFT FINDINGS (weave into your response when discussing relevant moments) ===\n${lines.join('\n')}`;
      }
      options.maxActiveFindings = 3;
      break;
    }
    case 'l6_coaching_overview':
    default:
      options.maxActiveFindings = 5;
      break;
  }

  const findingContext = buildFindingContext(findingStore, options);

  // Active directive — per B's insight, tell the LLM to weave findings in
  return `\n\n=== KEY FINDINGS (weave these into your response when discussing relevant topics — don't list them as a separate section) ===\n` +
    findingContext;
}

/**
 * Extract the most likely focus paragraph index from Stage 1 focus probabilities.
 * Returns null if no clear focus (max prob < 0.4).
 */
private extractFocusParagraph(stage1: Stage1Output): number | null {
  let maxProb = 0;
  let maxLabel = '';
  for (const [label, prob] of Object.entries(stage1.focusProbabilities)) {
    if (prob > maxProb) {
      maxProb = prob;
      maxLabel = label;
    }
  }
  if (maxProb < 0.4) return null;
  const match = maxLabel.match(/P(\d+)/);
  return match ? parseInt(match[1], 10) - 1 : null;
}
```

**Why routing-rule-aware**: Currently `buildFindingCoachingContext` dumps the top 5 findings regardless of what the student is discussing. If the student asks about P3's voice, they see findings about P1's structure — noise that dilutes the prompt. Routing-rule-aware scoping ensures findings are relevant to the current conversation context.

**Import needed**: Add `RoutingRule` to the import from `profileRouter` at line 45:

```typescript
import type { ProfileRouter, RoutingRule } from '../profileManager/profileRouter';
```

**Cost**: Zero additional LLM calls. May REDUCE token costs by filtering to fewer findings.

---

### ITEM 5: Edit Understanding Serialization + Revision Protocol (GAP-5)

**Choice**: `hybrid` — A's serialization utility + B's coaching protocol

**File 1** (new): `src/services/essayIntelligence/coaching/editContextFormatter.ts`

```typescript
/**
 * EditContextFormatter — serializes EditUnderstandingOutput into a coaching-ready
 * string for the editStrategyContext parameter.
 *
 * The editStrategyContext is already wired through processCoachingTurn (param 7)
 * into Stage 3's user prompt (line 1035). This utility provides rich serialization
 * instead of the caller constructing a plain string.
 */

import type { EditUnderstandingOutput, EditUnderstanding } from '../profileTypes';

/**
 * Format an EditUnderstandingOutput into a coaching-ready context string.
 *
 * Includes:
 * - Significance + reasoning (how big is this change?)
 * - Apparent purpose + confidence (what was the student trying to do?)
 * - Connection impacts (what relationships were affected?)
 * - Holistic impact (how does this change the essay's overall character?)
 *
 * @param editOutput  The EditUnderstandingOutput from the reanalysis pipeline
 * @returns A formatted string suitable for the editStrategyContext parameter
 */
export function formatEditUnderstandingForCoaching(
  editOutput: EditUnderstandingOutput,
): string {
  const u = editOutput.understanding;
  const parts: string[] = [];

  // Significance
  parts.push(
    `EDIT SIGNIFICANCE: ${u.significance.toUpperCase()}` +
    `\n  ${u.significanceReasoning}`
  );

  // What the student was trying to do
  parts.push(
    `APPARENT PURPOSE (${Math.round(u.purposeConfidence * 100)}% confident): ${u.apparentPurpose}`
  );

  // Change type
  parts.push(`CHANGE TYPE: ${u.changeType.replace(/_/g, ' ')}`);

  // Connection impacts
  const brokenOrWeakened = u.profileImpact.connectionImpact.filter(
    c => c.effect === 'broken' || c.effect === 'weakened'
  );
  if (brokenOrWeakened.length > 0) {
    const impactLines = brokenOrWeakened.map(c =>
      `  ${c.connectionId}: ${c.effect} — ${c.reasoning}`
    );
    parts.push(
      `CONNECTION IMPACTS (${brokenOrWeakened.length} affected):\n${impactLines.join('\n')}`
    );
  }

  // Holistic impact
  if (u.profileImpact.holisticImpact) {
    parts.push(`HOLISTIC IMPACT: ${u.profileImpact.holisticImpact}`);
  }

  // Direct impact
  if (u.profileImpact.directImpact) {
    parts.push(`DIRECT IMPACT: ${u.profileImpact.directImpact}`);
  }

  return parts.join('\n\n');
}
```

**File 2**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: After the edit context section in Stage 3 prompt (after line 1038)

Add conditional revision coaching protocol:

```typescript
// After editStrategySection (line 1038), add:
const revisionProtocolSection = recentEditContext
  ? `\n\n=== REVISION COACHING PROTOCOL ===
When responding to a student who just edited their essay:
1. ACKNOWLEDGE what they changed and what it tells you about their thinking
2. ASSESS whether the edit achieved its apparent purpose
3. SURFACE any new issues the edit introduced (broken connections, voice shifts)
4. GUIDE the next step — don't just evaluate, direct forward
Do NOT list these steps. Weave them into a natural coaching response.`
  : '';
```

Then inject `revisionProtocolSection` in the user prompt (add after `${editStrategySection}` at line 1130):

```typescript
${editStrategySection}
${revisionProtocolSection}
```

**Integration with caller**: The `formatEditUnderstandingForCoaching` utility is called by whoever populates the `editStrategyContext` parameter — typically the version tracker or the caller of `processCoachingTurn`. This is a caller-side change, not a CoachingService change.

**Cost**: Zero additional LLM calls. ~100 tokens added to the user prompt when a revision is present.

---

### ITEM 6: Cross-Essay Student Preferences (GAP-6)

**Choice**: `refined` — leverage existing `preferenceDurability` + simple DB persistence

**File 1**: `src/services/essayIntelligence/profileTypes.ts`
**Location**: After `CoachingSessionMemory` (around line 2124)

Add new type:

```typescript
/**
 * StudentCoachingPreferences — cross-essay preferences persisted to DB.
 *
 * Populated from ConversationInsights that have `durability: 'general'`
 * (preferences that apply across all essays, not just the current one).
 *
 * Loaded at session start, saved at session end.
 * NOT on EssayProfile — this is student-level, not essay-level.
 */
export interface StudentCoachingPreferences {
  /** Style preferences: "I like short sentences", "Don't use semicolons" */
  stylePreferences: string[];

  /** Techniques the student has demonstrated across essays */
  demonstratedTechniques: string[];

  /** Learning style observations persisted from prior sessions */
  learningObservations: string[];

  /** Last updated timestamp */
  lastUpdatedAt: string;
}
```

**File 2**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: `processCoachingTurn` signature (line 230)

Add optional parameter:

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
  studentPreferences?: StudentCoachingPreferences, // NEW
): Promise<CoachingResult> {
```

**Location 2**: Inject student preferences into `buildProfileContextText` (line 1173):

```typescript
// After conversation insights section (line 1220), add:
if (studentPreferences && studentPreferences.stylePreferences.length > 0) {
  parts.push(
    `STUDENT PREFERENCES (persistent across essays):\n` +
    studentPreferences.stylePreferences.map(p => `  - ${p}`).join('\n')
  );
}
```

**File 3** (DB migration): `supabase/migrations/NNNN_add_coaching_preferences.sql`

```sql
-- Add coaching preferences JSONB column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS coaching_preferences JSONB DEFAULT '{"stylePreferences":[],"demonstratedTechniques":[],"learningObservations":[],"lastUpdatedAt":null}'::jsonb;

COMMENT ON COLUMN profiles.coaching_preferences IS 'Cross-essay student coaching preferences. Populated from ConversationInsights with durability=general.';
```

**Persistence logic** (caller-side, NOT in CoachingService): At session end, the caller extracts `general` durability insights from the session and writes them to `profiles.coaching_preferences`. At session start, the caller loads them and passes to `processCoachingTurn`.

**Cost**: Zero additional LLM calls. ~50 tokens added to the user prompt when preferences exist.

---

### ITEM 7: Voice Protection in Router + System Prompt (GAP-8)

**Choice**: `hybrid` — A's router enrichment + B's system prompt directive

**File 1**: `src/services/essayIntelligence/profileManager/profileRouter.ts`
**Location**: `assembleL6CoachingParagraph` method (line 1140), specifically the `voiceContext` section (line 1210)

**Change**: Enrich `voiceContext` with paragraph-scoped `authenticVsPerformed`:

```typescript
// Replace the existing voiceContext section (lines 1210-1221) with:
if (profile.voiceIdentity.signature || profile.voiceIdentity.distinctivePatterns.length > 0) {
  // Filter authenticVsPerformed to entries in or near the target paragraph
  const relevantVoiceMoments = profile.voiceIdentity.authenticVsPerformed.filter(
    entry => entry.location[0] === pIdx ||
      entry.location[0] === pIdx - 1 ||
      entry.location[0] === pIdx + 1
  );

  sections.push({
    name: 'voiceContext',
    content: {
      signature: profile.voiceIdentity.signature,
      register: profile.voiceMap.register.baseline,
      distinctivePatterns: profile.voiceIdentity.distinctivePatterns,
      // NEW: paragraph-scoped voice authenticity data
      voiceMoments: relevantVoiceMoments.length > 0
        ? relevantVoiceMoments.map(entry => ({
            location: `P${entry.location[0] + 1}S${entry.location[1] + 1}`,
            assessment: entry.assessment,
            reasoning: entry.reasoning,
          }))
        : undefined,
    },
    tokenEstimate: estimateTokens(profile.voiceIdentity.signature) + 50 +
      (relevantVoiceMoments.length * 30),
    priority: 'always',
  });
}
```

**File 2**: `src/services/essayIntelligence/profileManager/profileRouter.ts`
**Location**: `assembleInlineEditSentence` method (line 1388)

**Change**: Add voice guard section after paragraph craft profile (after line 1434):

```typescript
// After paragraph craft profile section, add voice guard:
// Voice guard — protect authentic voice in edit suggestions
if (profile.voiceIdentity.signature) {
  const sentenceVoiceMoments = profile.voiceIdentity.authenticVsPerformed.filter(
    entry => entry.location[0] === pIdx && entry.location[1] === sIdx
  );

  if (sentenceVoiceMoments.length > 0) {
    sections.push({
      name: 'voiceGuard',
      content: {
        voiceSignature: profile.voiceIdentity.signature,
        thisLocation: sentenceVoiceMoments.map(entry => ({
          assessment: entry.assessment,
          reasoning: entry.reasoning,
        })),
      },
      tokenEstimate: estimateTokens(profile.voiceIdentity.signature) + 30,
      priority: 'always',
    });
  }
}
```

**File 3**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: `staticCoachingPhilosophy` (after the "ADMISSIONS GROUNDING" section, around line 992)

**Change**: Add voice protection directive (~80 tokens):

```typescript
`

VOICE PROTECTION:
This student has a real voice. Your profile context identifies authentic moments
(where the writer sounds genuinely like themselves) and performed moments
(where they sound like someone else). When suggesting changes:
- NEVER edit toward generic "good writing" if it erases the student's voice
- PROTECT authentic moments — highlight them, build around them
- Only address performed moments if the student's authentic voice would serve better
- When in doubt, ask the student to read both versions aloud`;
```

**Cost**: Zero additional LLM calls. ~80 tokens added to cached system prompt + ~30-90 tokens added to voice context per paragraph-scoped call.

---

### ITEM 8: Essay Understanding Context (GAP-10)

**Choice**: `refined` — smart scoping by routing rule

**File 1**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: `buildProfileContextText` method (line 1173)

**Change**: Add essay understanding context after North Star section (after line 1187):

```typescript
// After North Star section (line 1187), add:
// Essay understanding context — scoped by routing rule
const eu = profile.essayUnderstanding;
if (eu.centralTension) {
  // Always include centralTension one-liner — it's the essay's driving force
  parts.push(`CENTRAL TENSION: ${eu.centralTension}`);
}
```

**File 2**: `src/services/essayIntelligence/profileManager/profileRouter.ts`
**Location**: `assembleL6CoachingOverview` method (line 1329)

**Change**: Add essay understanding prose section (after North Star, around line 1368):

```typescript
// After North Star section, add essay understanding prose:
if (profile.essayUnderstanding.prose) {
  sections.push({
    name: 'essayUnderstanding',
    content: {
      prose: profile.essayUnderstanding.prose,
      centralTension: profile.essayUnderstanding.centralTension,
      maturity: profile.essayUnderstanding.maturity,
      confirmedInsights: profile.essayUnderstanding.confirmedInsights.slice(0, 5),
      activeHypotheses: profile.essayUnderstanding.activeHypotheses.slice(0, 3),
    },
    tokenEstimate: estimateTokens(profile.essayUnderstanding.prose) + 100,
    priority: 'always',
  });
}
```

**Why not replace holistic sections**: B proposed replacing `holisticFull` with prose on overview routes. This loses structured data that coaching needs (specific voice patterns, emotional arc details). Instead, the prose is ADDED as a separate section. The token budget enforcement system (`applyTokenBudget`) will handle total limits — if budget is tight, `paragraphDigests` (priority: `nice_to_have`) gets dropped before `essayUnderstanding` (priority: `always`).

**Cost**: ~200-700 tokens added to overview route (prose length varies by essay maturity). ~20 tokens added to paragraph/voice routes (centralTension only).

---

### Execution Order (Dependency Chain)

```
Phase 1 — Type Changes (no behavioral change, just definitions):
  1. ITEM 2 types: Add demonstratedCapabilities to CoachingSessionMemory
  2. ITEM 3 types: Add sessionMode to CoachingSessionMemory
  3. ITEM 6 types: Add StudentCoachingPreferences type
  → npx tsc --noEmit after each

Phase 2 — System Prompt Changes (static, cached, no logic):
  4. ITEM 1: Craft technique vocabulary → staticCoachingPhilosophy
  5. ITEM 7 part 3: Voice protection directive → staticCoachingPhilosophy
  → Test: verify system prompt compiles and is under 2500 tokens total

Phase 3 — Router Changes (context assembly, no LLM):
  6. ITEM 7 parts 1-2: Voice context enrichment in profileRouter
  7. ITEM 8 part 2: Essay understanding in assembleL6CoachingOverview
  → npx tsc --noEmit

Phase 4 — Coaching Service Logic (the meat):
  8. ITEM 2 logic: Extend pattern detection + session memory update
  9. ITEM 3 logic: Session mode in pattern detection + Stage 1.5 + Stage 3
  10. ITEM 4: Routing-rule-aware finding injection
  11. ITEM 8 part 1: centralTension in buildProfileContextText
  12. ITEM 5 part 1: editContextFormatter.ts (new file)
  13. ITEM 5 part 2: Revision protocol injection in Stage 3
  14. ITEM 6 logic: studentPreferences parameter + injection
  → npx tsc --noEmit
  → ANTHROPIC_API_KEY="..." npx tsx tests/test-coaching-quality.ts (if exists)

Phase 5 — DB Migration:
  15. ITEM 6: coaching_preferences column migration
  → supabase db push

Phase 6 — Caller-Side Integration:
  16. Wire formatEditUnderstandingForCoaching at caller sites
  17. Wire StudentCoachingPreferences load/save at session boundaries
  → Full E2E test
```

---

### Cost Summary Table

| Item | Per-Turn Token Delta | Per-Turn Cost Delta | Notes |
|------|---------------------|--------------------|----|
| ITEM 1 (Craft Vocabulary) | +400 cached system | ~$0.0000 (cached) | One-time $0.0015 cache write |
| ITEM 2 (Capabilities) | +20 output, +50 prompt | ~$0.0001 | Extends existing Haiku call |
| ITEM 3 (Session Mode) | +30 output, +45 prompt | ~$0.0001 | Extends existing Haiku call |
| ITEM 4 (Finding Scoping) | -100 to +0 prompt | ~-$0.0002 | May REDUCE tokens by scoping |
| ITEM 5 (Edit Context) | +100 prompt (when editing) | ~$0.0001 | Conditional, not every turn |
| ITEM 6 (Preferences) | +50 prompt (when present) | ~$0.0001 | Only when preferences exist |
| ITEM 7 (Voice) | +80 cached + 30-90 prompt | ~$0.0002 | Voice context + guard |
| ITEM 8 (Understanding) | +20-700 prompt (by route) | ~$0.0005 | 20 for paragraph, 700 for overview |
| **TOTAL** | | **~$0.001-0.003/turn** | Dominated by ITEM 8 overview route |

---

### Rejected Approaches (with reasoning)

| Approach | Why Rejected |
|----------|-------------|
| Agent A's regex technique extraction (GAP-2) | Violates LLM-first design principle. Regex against free-text LLM output is fragile. The pattern detection Haiku already runs — extending it is cleaner. |
| Agent A's explicit InteractionMode enum (GAP-3) | Creates a closed taxonomy (7 values) for a space that is inherently open-ended. The existing CognitiveAssessment provides mode signal through free prose. |
| Agent A's 1200-token technique library (GAP-1) | Too large. Sonnet already knows writing techniques. The library should create shared vocabulary, not teach Sonnet craft. |
| Agent B's "use CraftAssessment as technique library" (GAP-1) | CraftAssessment contains essay-specific observations, not technique definitions. The directive conflates two different things. |
| Agent B's no-mode position (GAP-3) | Correct in rejecting enums, but misses the mode persistence problem. A brainstorming session should stay in brainstorm mode. |
| Agent B's replace-holistic-with-prose (GAP-10) | Prose is a synthesis, not a lossless summary. Replacing structured holistic sections loses specific data the coach might need (voice patterns, emotional arc details). |
| Agent A's student_profile JSONB on profiles table (GAP-6) | The approach is right but naming collides with EssayProfile. Renamed to `coaching_preferences`. |
| Agent A's 15-technique library (GAP-1) | Reduced to 10. 15 creates information overload in a cached prompt; 10 covers the critical territory without bloat. |

---

### Existing Infrastructure Leveraged

| Infrastructure | How Used | Items |
|---------------|----------|-------|
| Pattern detection Haiku call (line 1801) | Extended output schema | ITEM 2, ITEM 3 |
| `editStrategyContext` parameter (line 237) | Already wired end-to-end | ITEM 5 |
| `CoachingSessionMemory` (line 2082) | Extended with new fields | ITEM 2, ITEM 3 |
| `staticCoachingPhilosophy` cached system prompt | Appended to | ITEM 1, ITEM 7 |
| `buildProfileContextText` (line 1173) | Modified to include new sections | ITEM 6, ITEM 8 |
| `buildFindingCoachingContext` (line 2360) | Refactored for routing awareness | ITEM 4 |
| `assembleL6CoachingParagraph` voiceContext (line 1210) | Enriched with authenticVsPerformed | ITEM 7 |
| `assembleL6CoachingOverview` (line 1329) | Extended with essayUnderstanding | ITEM 8 |
| `assembleInlineEditSentence` (line 1388) | Extended with voiceGuard | ITEM 7 |
| `preferenceDurability` on Stage1Output (line 172) | Drives cross-essay preference persistence | ITEM 6 |
| `EssayProfile.essayUnderstanding` (line 1683) | Surfaced to coaching prompts | ITEM 8 |
| `VoiceIdentity.authenticVsPerformed` (line 541) | Scoped and injected into router sections | ITEM 7 |
| Token budget enforcement (line 223) | Handles overflow from new sections | ALL |
| Prompt caching (`cacheSystemPrompt: true`) | System prompt additions are cached | ITEM 1, ITEM 7 |

---

### Before/After: Stage 3 Prompt Architecture

**BEFORE** (current):
```
SYSTEM (cached, ~1500 tokens):
  staticCoachingPhilosophy (role, voice, dialogue, resistance, honesty, phase guidance)

USER (dynamic, ~3000-8000 tokens):
  BLOCK 2: profileContextText (North Star, critical concerns, assembled sections, conversation insights)
  BLOCK 3: essayText + findingSection + conversation + currentMessage + editContext +
           stage1Section + cognitiveSection + sessionArcSection + escalationSection +
           patternSection + antiRepetitionSection + editStrategySection +
           improvementPhase
```

**AFTER** (with all 8 items):
```
SYSTEM (cached, ~2000 tokens):
  staticCoachingPhilosophy (role, voice, dialogue, resistance, honesty, phase guidance)
  + CRAFT TEACHING VOCABULARY (~400 tokens) [ITEM 1]
  + VOICE PROTECTION (~80 tokens) [ITEM 7]

USER (dynamic, ~3000-9000 tokens):
  BLOCK 2: profileContextText (North Star, CENTRAL TENSION [ITEM 8], critical concerns,
           assembled sections [enriched with voiceMoments ITEM 7],
           conversation insights, STUDENT PREFERENCES [ITEM 6])
  BLOCK 3: essayText + findingSection [SCOPED by routing rule, ITEM 4] +
           conversation + currentMessage + editContext +
           REVISION PROTOCOL [conditional, ITEM 5] + editStrategySection [richer, ITEM 5] +
           stage1Section + cognitiveSection +
           sessionArcSection [+sessionMode ITEM 3, +demonstratedCapabilities ITEM 2] +
           escalationSection + patternSection + antiRepetitionSection +
           improvementPhase
```

**Net token impact**: +500 cached (one-time), +100-800 dynamic per turn (varies by route and available data).
