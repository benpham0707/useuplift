# Implementation Blueprint: Scope 1 — Surgical Prompt/Schema Cleanup

After this is built, the Essay Intelligence pipeline stops paying for dead output at L3 (sentence `voiceAlignment`), L3.75 (`codeSwitching`, over-bulked `authenticityAssessment` and `observations[]`), L3.5 (over-truncated anchor re-injection), and L4 (verbose `crossParagraphPatterns` / `emergentPatterns` / `scoreTensions` that nothing reads). L4 score tensions and emergent patterns become ACTIVE coaching signals in the L5 paragraph prompt at ~85% cost reduction. L5 annotations gain four new teaching fields (`stakes`, `wordEconomyCut`, `antiPatternExample`, `transferablePrinciple`) mirroring the already-shipping `ImprovementEntry` schema, with 100% ACTION-mode `rewriteExample` coverage driven by pre-call enrichment from `TRANSFORMATION_EXAMPLES` and `detectTellingPhrases`. Net savings: ~3,500-5,500 output tokens per essay (~$0.053-$0.082/essay) with measurable quality improvements in coaching signal and rewrite coverage.

---

## Execution Order (dependency-ordered)

1. **Prerequisite for GAP-2**: NONE — `phaseAssessment.ts:274-276` already works with any non-empty `showVsTell[]`, and we're keeping the array (just capping size), so no upstream refactor is required before the L3.75 schema edits.
2. **GAP-1** (independent, schema-only): L3 walk — drop `voiceAlignment`, convert `rhythm` to enum. Parallel-safe with GAP-4.
3. **GAP-4 type migration** (BEFORE GAP-4 prompt edits): convert `CoachingMap.emergentPatterns` and `CoachingMap.scoreTensions` from object arrays to `string[]` in `profileTypes.ts`; extend `buildCoachingMap()` at `crystallizer.ts:1269` to ACCEPT both the old object shape AND the new string[] shape for these two fields. Current implementation only parses the object shape — Scope 1 INTRODUCES backward-compat parsing, not modifying an existing flattener. The specific edit region is `crystallizer.ts:1318-1336` inside `buildCoachingMap()`.
4. **GAP-4** (prompt + wiring): compress L4 prompts + activate in L5 `sharedContext`.
5. **GAP-3** (independent, pure consumption-site fix): anchor re-injection in `buildAnchorContext()` + prompt caps for `strengths[].evidence` and `strengthSignatures[].evidence` ONLY (not `effectivenessReasoning`).
6. **GAP-2** (independent, schema compression): L3.75 — drop `codeSwitching`, cap `observations[]` / `showVsTell[]`, compress `authenticityAssessment` prose. Add `?? []` guards at validator + mutator.
7. **Shared infrastructure (dep for GAP-6, 8, 9)**: extract `techniqueMatcher.ts` with the full 20-route keyword matcher. Add `getRawTellingPhraseMatches()` (a slimmer variant of `detectTellingPhrases` that returns the raw phrase + category, not the assembled BEFORE/AFTER block).
8. **GAP-5** (additive, no dependencies): render `archetypeContext` into L5 `renderHolisticContext()`, add `stakes` field to `L5Annotation` / `RawAnnotation`, extend system prompt.
9. **GAP-6** (depends on step 7): pre-call enrichment via `detectTellingPhrases` + `TRANSFORMATION_EXAMPLES`, inject into `buildParagraphPrompt()`, update system-prompt rewrite instruction.
10. **GAP-8** (depends on step 7, bundles with GAP-6 enrichment): add `antiPatternExample` field; surface matched phrases separately in the enrichment block.
11. **GAP-7** (independent, but best co-staged with GAP-5/6/8): add `wordEconomyCut` field, inject filler-pattern diagnostics for Polish/Distinction phases.
12. **GAP-9** (depends on step 7's `techniqueMatcher`): add `transferablePrinciple` field, apply post-call tagger in `validateAnnotations()`.
13. **Final**: re-run `npx tsc --noEmit`, then the E2E verification plan.

---

## Items

### 1. GAP-1: L3 walk — compact rhythm, drop voiceAlignment

**Before** (`sequentialDeepWalk.ts:325-328`, active L3 prompt):
```json
"craft": {
  "rhythm": "ONLY for pivotal/contributing sentences. Describe the sentence's rhythmic character: length, clause structure, pacing effect.",
  "voiceAlignment": "How this sentence's voice relates to the essay's dominant voice — same register, shifted, code-switched.",
  "techniques": ["anaphora", "imagery", "juxtaposition", "concrete_detail", "metaphor", ...]
}
```
Typical LLM output per pivotal sentence:
```json
"craft": {
  "rhythm": "Nine words. Two clauses split by an em-dash. Punchy declarative effect — no qualifiers mute the claim.",
  "voiceAlignment": "Maintains the introspective register established in P1. Slight formalization from 'lay awake' to 'reached for' — same proximity, more composed syntax.",
  "techniques": ["imagery", "fragment"]
}
```
~60-90 tokens per sentence × ~3 pivotal/contributing sentences per paragraph × 7 paragraphs = 1,260-1,890 tokens per essay on `rhythm` + `voiceAlignment` alone.

**After**:
```json
"craft": {
  "rhythm": "ONLY for pivotal/contributing sentences. ONE enum value: short_punch | medium_flow | long_build | fragment | staccato | anaphora_series | parallel_build | subordinate_delay. Pick the closest match.",
  "techniques": ["anaphora", "imagery", "juxtaposition", "concrete_detail", "metaphor", ...]
}
```
Typical output:
```json
"craft": {
  "rhythm": "fragment",
  "techniques": ["imagery", "fragment"]
}
```
~5-10 tokens per sentence.

**Implementation**:

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` at line 325-328:

```typescript
// BEFORE (lines 325-328):
      "craft": {
        "rhythm": "ONLY for pivotal/contributing sentences. Describe the sentence's rhythmic character: length, clause structure, pacing effect.",
        "voiceAlignment": "How this sentence's voice relates to the essay's dominant voice — same register, shifted, code-switched.",
        "techniques": ["anaphora", "imagery", "juxtaposition", "concrete_detail", "metaphor", "personification", "alliteration", "parallel_structure", "fragment", "polysyndeton", "asyndeton", "chiasmus", "synesthesia"]
      },

// AFTER (3 lines):
      "craft": {
        "rhythm": "ONLY for pivotal/contributing sentences. ONE enum: short_punch | medium_flow | long_build | fragment | staccato | anaphora_series | parallel_build | subordinate_delay. Pick the closest match. Empty string for transitional sentences.",
        "techniques": ["anaphora", "imagery", "juxtaposition", "concrete_detail", "metaphor", "personification", "alliteration", "parallel_structure", "fragment", "polysyndeton", "asyndeton", "chiasmus", "synesthesia"]
      },
```

Edit `sequentialDeepWalk.ts:1135-1145` — `parseSentenceCraft`:
```typescript
// BEFORE:
  private parseSentenceCraft(raw: unknown): SentenceCraft {
    if (!raw || typeof raw !== 'object') {
      return { rhythm: '', voiceAlignment: '', techniques: [] };
    }
    const obj = raw as Record<string, unknown>;
    return {
      rhythm: this.safeString(obj.rhythm, ''),
      voiceAlignment: this.safeString(obj.voiceAlignment, ''),
      techniques: this.safeStringArray(obj.techniques),
    };
  }

// AFTER:
  private parseSentenceCraft(raw: unknown): SentenceCraft {
    if (!raw || typeof raw !== 'object') {
      return { rhythm: '', techniques: [] };
    }
    const obj = raw as Record<string, unknown>;
    return {
      rhythm: this.safeString(obj.rhythm, ''),
      techniques: this.safeStringArray(obj.techniques),
    };
  }
```

Edit `sequentialDeepWalk.ts:1730` — strip `voiceAlignment` from the default initializer:
```typescript
// BEFORE:
      craft: { rhythm: '', voiceAlignment: '', techniques: [] },
// AFTER:
      craft: { rhythm: '', techniques: [] },
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/fullContextReReader.ts` — three sites:

Line 122-126 (schema):
```typescript
// BEFORE:
        "craft": {
          "rhythm": "short_punch | flowing | staccato | measured | etc.",
          "voiceAlignment": "How this sentence's voice aligns with the essay's dominant voice",
          "techniques": ["technique1", "technique2"]
        },

// AFTER:
        "craft": {
          "rhythm": "ONE enum: short_punch | medium_flow | long_build | fragment | staccato | anaphora_series | parallel_build | subordinate_delay",
          "techniques": ["technique1", "technique2"]
        },
```

Line 544-548 (default fallback object):
```typescript
// BEFORE:
      craft: { rhythm: '', voiceAlignment: '', techniques: [] },
// AFTER:
      craft: { rhythm: '', techniques: [] },
```

Line 605-612 — `coerceSentenceCraft`:
```typescript
// BEFORE:
  if (!raw) return { rhythm: '', voiceAlignment: '', techniques: [] };
  // ...
  return {
    rhythm: ensureString(raw.rhythm),
    voiceAlignment: ensureString(raw.voiceAlignment),
    techniques: ensureStringArray(raw.techniques),
  };

// AFTER:
  if (!raw) return { rhythm: '', techniques: [] };
  // ...
  return {
    rhythm: ensureString(raw.rhythm),
    techniques: ensureStringArray(raw.techniques),
  };
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/focusedAnalyzer.ts:1338`:
```typescript
// BEFORE:
                craft: { rhythm: '', voiceAlignment: '', techniques: [] },
// AFTER:
                craft: { rhythm: '', techniques: [] },
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:404-411`:
```typescript
// BEFORE:
export interface SentenceCraft {
  /** Rhythm classification: short_punch, medium_flow, long_build, etc. */
  rhythm: string;
  /** How well voice aligns with the essay's dominant voice */
  voiceAlignment: string;
  /** Specific craft techniques used */
  techniques: string[];
}

// AFTER:
/**
 * Rhythm classification tag — closed enum for L5 consumption at deepAnnotationService.ts:910.
 * Empty string = uncharacterized (transitional sentences).
 */
export type RhythmTag =
  | ''
  | 'short_punch'
  | 'medium_flow'
  | 'long_build'
  | 'fragment'
  | 'staccato'
  | 'anaphora_series'
  | 'parallel_build'
  | 'subordinate_delay';

export interface SentenceCraft {
  /** Rhythm classification tag (see RhythmTag). */
  rhythm: RhythmTag;
  /** Specific craft techniques used */
  techniques: string[];
  /**
   * @deprecated voiceAlignment removed in Scope 1 — no downstream consumers.
   * Voice alignment is synthesized holistically by L3.75 voiceMap.
   * Kept optional for backward compat with profiles stored before the change.
   */
  voiceAlignment?: string;
}
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/mutators/sentenceMutator.ts:65-75` (initializer) and 155-158 (update branch):
```typescript
// Line 71 - BEFORE:
        voiceAlignment: '',
// Line 71 - AFTER: DELETE the line entirely. The type now makes it optional.

// Lines 155-156 - BEFORE:
      if (update.craft.voiceAlignment !== undefined) {
        understanding.craft.voiceAlignment = update.craft.voiceAlignment;
      }
// Lines 155-156 - AFTER: DELETE both lines (the update branch no longer exists).
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:325-328` — schema prose → enum description
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:1135-1145` — `parseSentenceCraft()` drops voiceAlignment
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:1730` — default init
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/fullContextReReader.ts:122-126, 544-548, 605-612` — schema mirror + fallback
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/focusedAnalyzer.ts:1338` — default init
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:404-411` — `SentenceCraft` interface + new `RhythmTag` type
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/mutators/sentenceMutator.ts:71, 155-156` — drop voiceAlignment branch
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:910` — NO CHANGE. Already reads `craft.rhythm` as a label; enum is pure improvement.

**Cost**: -50 to -85 output tokens per sentence × ~25-35 pivotal/contributing sentences per essay = **-1,250 to -2,975 output tokens** per essay. At Sonnet output pricing ($15/M), **-$0.019 to -$0.045 per essay**.

**Source**: hybrid — `rhythm` kept as enum (rethink), `voiceAlignment` dropped (direct). Strong prior verified at `deepAnnotationService.ts:910`.

---

### 2. GAP-2: L3.75 — gate codeSwitching, cap observations[] and showVsTell[], compress authenticityAssessment

**Before** (`holisticSynthesis.ts:298-395`, Phase A schema excerpt):
```json
"voiceMap": {
  "register": {
    "baseline": "...",
    "observations": [ /* unlimited prose entries, each ~20-40 tokens */ ]
  },
  "sentenceRhythm": {
    "baseline": "...",
    "observations": [ /* unlimited prose entries */ ]
  },
  // ... four more dimensions with unlimited observations[]
  "codeSwitching": [
    {
      "location": { "paragraph": 2, "sentence": 3 },
      "language": "Tagalog",
      "trigger": "emotional memory",
      "culturalFunction": "authentic cultural identity expression",
      "text": "Mahal kita, lola"
    }
  ]
},
"emotionalTopography": {
  "arcTrajectory": "...",
  "peakMoments": [...],
  "undertones": [...],
  "emotionalProgression": [...],
  "showVsTell": [ /* unlimited per-sentence entries, each ~15-25 tokens */ ],
  "authenticityAssessment": "<describe how emotion is conveyed — through sensory detail, through abstraction, through dialogue, through action. If emotion is largely ABSENT (the essay operates through intellectual assertion without emotional exposure), describe that absence and what the essay uses INSTEAD of emotion. Map what IS there, not what should be.>"
}
```

**After**:
```json
"voiceMap": {
  "register": {
    "baseline": "...",
    "observations": [ /* MAX 2 diagnostic entries per dimension */ ]
  },
  "sentenceRhythm": {
    "baseline": "...",
    "observations": [ /* MAX 2 */ ]
  },
  // ... other dimensions same cap
  // codeSwitching REMOVED from prompt schema
},
"emotionalTopography": {
  "arcTrajectory": "...",
  "peakMoments": [...],
  "undertones": [...],
  "emotionalProgression": [...], // KEEP — consumed at analysisContextBuilder.ts:248
  "showVsTell": [ /* MAX 4 entries — 2 best "shown" + 2 worst "told" */ ],
  "authenticityAssessment": "<ONE SENTENCE: primary mode of emotional expression (sensory/abstract/dialogue/action/absent) + one specific example. E.g. 'Emotion primarily through abstraction and assertion; 'I was devastated' in P2 is the clearest telling moment.'>"
}
```

**Implementation**:

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/holisticSynthesis.ts:299-368` (voiceMap schema):

For each of the 5 dimensions (`register`, `vocabularyFingerprint`, `sentenceRhythm`, `perspectiveDistance`, `tonalDisposition`), append `MAX 2 entries — only diagnostic locations` to the `observations` description. Example:
```json
"register": {
  "baseline": "<the essay's dominant register>",
  "observations": [
    // MAX 2 entries — only diagnostic locations where register is notable or shifts.
    {
      "location": { "paragraph": <n>, "sentenceRange": [<start>, <end>] },
      "observation": "<what register is doing here>",
      "dimensions": ["register"]
    }
  ]
},
```

REMOVE the `codeSwitching[]` block entirely (lines 359-367):
```typescript
// DELETE these lines from the Phase A schema:
    "codeSwitching": [
      {
        "location": { "paragraph": <n>, "sentence": <n> },
        "language": "<language or register being switched to>",
        "trigger": "<what triggered the switch>",
        "culturalFunction": "<the cultural function the switch serves>",
        "text": "<the code-switched passage>"
      }
    ]
```
And drop the trailing comma on the preceding `stabilityRegions` array so the JSON stays valid.

Edit the `showVsTell` schema at lines 387-393:
```json
"showVsTell": [
  // MAX 4 entries — 2 best examples of emotion being SHOWN and 2 worst of emotion being TOLD.
  // Per-paragraph count is used by phaseAssessment.ts; per-paragraph content is used by analysisContextBuilder.ts.
  {
    "location": [<paragraph>, <sentence>],
    "assessment": "shown" | "told" | "mixed",
    "detail": "<what is shown or told and how>"
  }
]
```

Compress `authenticityAssessment` at line 394:
```typescript
// BEFORE:
    "authenticityAssessment": "<describe how emotion is conveyed — through sensory detail, through abstraction, through dialogue, through action. If emotion is largely ABSENT (the essay operates through intellectual assertion without emotional exposure), describe that absence and what the essay uses INSTEAD of emotion. Map what IS there, not what should be.>"

// AFTER:
    "authenticityAssessment": "<ONE SENTENCE (≤40 words): primary mode of emotional expression (sensory/abstract/dialogue/action/absent) + one specific text example. E.g. 'Emotion primarily through abstraction and assertion; P2\'s \"I was devastated\" is the clearest telling moment.'>"
```

Edit `holisticSynthesis.ts:1155` — the parser for `codeSwitching`:
```typescript
// BEFORE:
    codeSwitching: ensureArray(raw.codeSwitching).map(coerceCodeSwitchEvent),

// AFTER:
    codeSwitching: ensureArray(raw.codeSwitching).map(coerceCodeSwitchEvent), // Legacy: Scope 1 drops from prompt but parses empty for backward compat
```
(No code change needed — the parser already handles an empty array. The prompt just won't generate content.)

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:569-592` — `VoiceMap` interface, make `codeSwitching` optional for backward compat:
```typescript
// BEFORE:
export interface VoiceMap {
  register: VoiceMapDimension;
  vocabularyFingerprint: VoiceMapDimensionWithDomains;
  sentenceRhythm: VoiceMapDimension;
  perspectiveDistance: VoiceMapDimension;
  tonalDisposition: VoiceMapDimensionWithQualities;
  stabilityRegions: Array<{ paragraphs: number[]; voiceCharacter: string }>;
  shifts: VoiceShift[];
  codeSwitching: CodeSwitchEvent[];
}

// AFTER:
export interface VoiceMap {
  register: VoiceMapDimension;
  vocabularyFingerprint: VoiceMapDimensionWithDomains;
  sentenceRhythm: VoiceMapDimension;
  perspectiveDistance: VoiceMapDimension;
  tonalDisposition: VoiceMapDimensionWithQualities;
  stabilityRegions: Array<{ paragraphs: number[]; voiceCharacter: string }>;
  shifts: VoiceShift[];
  /**
   * @deprecated Scope 1 drops codeSwitching generation from the L3.75 prompt.
   * The only downstream consumer (intraDomainValidation.ts:264) does index bounds
   * checking only. Kept optional for backward compat with profiles stored before the change.
   */
  codeSwitching?: CodeSwitchEvent[];
}
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/validation/intraDomainValidation.ts:264`:
```typescript
// BEFORE:
  for (const event of profile.voiceMap.codeSwitching) {

// AFTER:
  for (const event of profile.voiceMap.codeSwitching ?? []) {
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/mutators/voiceMapMutator.ts` — all 7 reference sites at lines 203, 210, 212, 361, 362, 366, 368. Wrap access with `?? []` or initialize as empty:
```typescript
// Line 203 - BEFORE:
    const existingIdx = profile.voiceMap.codeSwitching.findIndex(
// Line 203 - AFTER:
    if (!profile.voiceMap.codeSwitching) profile.voiceMap.codeSwitching = [];
    const existingIdx = profile.voiceMap.codeSwitching.findIndex(

// Lines 210, 212 - BEFORE:
      profile.voiceMap.codeSwitching[existingIdx] = event;
      // ...
      profile.voiceMap.codeSwitching.push(event);
// Lines 210, 212 - AFTER: no change (guarded above)

// Line 361 - BEFORE:
    for (let i = 0; i < profile.voiceMap.codeSwitching.length; i++) {
// Line 361 - AFTER:
    const cs = profile.voiceMap.codeSwitching ?? [];
    for (let i = 0; i < cs.length; i++) {
// Also update lines 362, 366, 368 to use `cs` instead of `profile.voiceMap.codeSwitching`.
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/essayProfileManager.ts:766`:
```typescript
// BEFORE:
      codeSwitching: [],
// AFTER: KEEP AS-IS. The profile is still initialized with an empty array for consistency.
//        The type is now optional but the initializer provides the empty array explicitly.
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/holisticSynthesis.ts:299-367` — voiceMap schema: cap observations[], REMOVE codeSwitching
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/holisticSynthesis.ts:387-394` — emotionalTopography schema: cap showVsTell[], compress authenticityAssessment
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:591` — `codeSwitching?: CodeSwitchEvent[]`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/validation/intraDomainValidation.ts:264` — `?? []` guard
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/mutators/voiceMapMutator.ts:203, 210, 212, 361, 362, 366, 368` — null guards

**Cost**:
- `codeSwitching` removal: -50 to -120 output tokens per essay (often 0 items but prompt section itself saves ~40 tokens).
- 5 × `observations[]` capped to 2 entries (from typical 4-6): -200 to -400 output tokens.
- `showVsTell[]` capped to 4 (from typical 6-10): -80 to -200 output tokens.
- `authenticityAssessment` compressed to 1 sentence: -60 to -100 output tokens.
- **Total: -390 to -820 output tokens** per essay. **-$0.006 to -$0.012 per essay**.

**Source**: refined — Rethink's "keep emotionalProgression, cap others" corrects the Direct path's overreach (which would have broken `analysisContextBuilder.ts`), plus full `codeSwitching` removal (safe because the only consumer is an index bounds check).

---

### 3. GAP-3: L3.5 — fix anchor re-injection, cap evidence strings (but NOT effectivenessReasoning)

**Before** (`analysisPass.ts:212-213, 227-229`):
```typescript
const reasoning = sa.effectivenessReasoning.slice(0, 120);
lines.push(`  S${sa.sentenceIndex}: effectiveness=${sa.effectiveness} — "${reasoning}${sa.effectivenessReasoning.length > 120 ? '...' : ''}"`);
// ...
lines.push(`    "${strongest.effectivenessReasoning.slice(0, 150)}${strongest.effectivenessReasoning.length > 150 ? '...' : ''}"`);
lines.push(`    "${weakest.effectivenessReasoning.slice(0, 150)}${weakest.effectivenessReasoning.length > 150 ? '...' : ''}"`);
```
Mid-word cuts produce anchor lines like `  S3: effectiveness=82 — "This sentence's primary function — establishing the economic frame through which all subsequen..."` — the ellipsis-cut is mid-phrase and does not carry the key insight.

Also, the L3.5 prompt schema at `analysisPass.ts:468-474` says:
```json
"effectivenessReasoning": "string — WHY this score, referencing understanding",
"strengths": [
  { "observation": "string — what works", "evidence": "string — specific text cited", "confidence": 0.9 }
],
```
and `holisticAnalysisEvolution.strengthSignatures` at line 490:
```json
"strengthSignatures": [{ "quality": "string", "evidence": "string", "paragraphs": [0] }],
```
No length caps → LLM generates 20-40 token evidence strings. Consumers cap at 60 chars (`renderAnalysisForStudent.ts:209`, `analysisContextBuilder.ts:476`).

**After**:
```typescript
// Anchor re-injection becomes first-sentence extraction, not char slice.
const firstSentence = extractFirstSentence(sa.effectivenessReasoning, 80);
lines.push(`  S${sa.sentenceIndex}: effectiveness=${sa.effectiveness} — "${firstSentence}"`);
```
And the prompt schema updates `evidence` descriptions to hard-cap at ~10 words, while `effectivenessReasoning` REMAINS unconstrained (verified load-bearing downstream).

**Implementation**:

Add a utility at the top of `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisPass.ts` (after existing helpers, around line 180):

```typescript
/**
 * Extract the first complete sentence from prose reasoning text, for anchor re-injection.
 * Preserves full reasoning at generation time (load-bearing for scoring + coaching)
 * while cutting re-injection overhead. Falls back to a hard slice if no period is found
 * within the budget.
 */
function extractFirstSentence(text: string, maxChars: number = 100): string {
  if (!text) return '';
  const trimmed = text.trim();
  // Find the first ". " within the budget. Prefer sentence-boundary cuts.
  const periodIdx = trimmed.indexOf('. ');
  if (periodIdx > 0 && periodIdx < maxChars) {
    return trimmed.slice(0, periodIdx + 1);
  }
  // Fallback: word-boundary cut within budget (avoid mid-word truncation).
  if (trimmed.length <= maxChars) return trimmed;
  const sliced = trimmed.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced) + '...';
}
```

Edit `buildAnchorContext()` in `analysisPass.ts:193-245`:
```typescript
// BEFORE:
  for (const sa of anchorResult.sentenceAnalyses) {
    const confLevel = sa.confidence?.level ?? 'not assessed';
    const reasoning = sa.effectivenessReasoning.slice(0, 120);
    lines.push(`  S${sa.sentenceIndex}: effectiveness=${sa.effectiveness} — "${reasoning}${sa.effectivenessReasoning.length > 120 ? '...' : ''}"`);
    lines.push(`  Confidence: ${confLevel}`);
  }
  lines.push(`Paragraph effectiveness: ${anchorResult.paragraphEffectiveness}`);
  lines.push('');

  const sorted = [...anchorResult.sentenceAnalyses].sort((a, b) => b.effectiveness - a.effectiveness);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (strongest && weakest) {
    lines.push('ESSAY-SPECIFIC EXAMPLES (from anchor scoring):');
    lines.push(`  STRONGEST in anchor: P${anchorResult.paragraphIndex}S${strongest.sentenceIndex} scored ${strongest.effectiveness}`);
    lines.push(`    "${strongest.effectivenessReasoning.slice(0, 150)}${strongest.effectivenessReasoning.length > 150 ? '...' : ''}"`);
    lines.push(`  WEAKEST in anchor: P${anchorResult.paragraphIndex}S${weakest.sentenceIndex} scored ${weakest.effectiveness}`);
    lines.push(`    "${weakest.effectivenessReasoning.slice(0, 150)}${weakest.effectivenessReasoning.length > 150 ? '...' : ''}"`);
    lines.push('');
  }

// AFTER:
  for (const sa of anchorResult.sentenceAnalyses) {
    const confLevel = sa.confidence?.level ?? 'not assessed';
    const firstSentence = extractFirstSentence(sa.effectivenessReasoning, 100);
    lines.push(`  S${sa.sentenceIndex}: ${sa.effectiveness} — ${firstSentence}`);
    lines.push(`  Confidence: ${confLevel}`);
  }
  lines.push(`Paragraph effectiveness: ${anchorResult.paragraphEffectiveness}`);
  lines.push('');

  const sorted = [...anchorResult.sentenceAnalyses].sort((a, b) => b.effectiveness - a.effectiveness);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (strongest && weakest) {
    lines.push('ESSAY-SPECIFIC EXAMPLES (from anchor scoring):');
    lines.push(`  STRONGEST in anchor: P${anchorResult.paragraphIndex}S${strongest.sentenceIndex} scored ${strongest.effectiveness}`);
    lines.push(`    ${extractFirstSentence(strongest.effectivenessReasoning, 130)}`);
    lines.push(`  WEAKEST in anchor: P${anchorResult.paragraphIndex}S${weakest.sentenceIndex} scored ${weakest.effectiveness}`);
    lines.push(`    ${extractFirstSentence(weakest.effectivenessReasoning, 130)}`);
    lines.push('');
  }
```

Net reduction per non-anchor paragraph: ~10-20 input tokens. Quality improvement: clean sentence-boundary cuts instead of mid-word truncation.

Edit the L3.5 prompt schema at `analysisPass.ts:470-474` and line 490:
```typescript
// BEFORE (lines 470-474):
      "strengths": [
        { "observation": "string — what works", "evidence": "string — specific text cited", "confidence": 0.9 }
      ],
      "weaknesses": [
        { "observation": "string — what doesn't work", "evidence": "string — specific text cited", "confidence": 0.85 }
      ],

// AFTER:
      "strengths": [
        { "observation": "string (≤20 words) — what works", "evidence": "ONE quoted phrase from the essay, ≤10 words. E.g. 'slid the ring' — not a full sentence of explanation", "confidence": 0.9 }
      ],
      "weaknesses": [
        { "observation": "string (≤20 words) — what doesn't work", "evidence": "ONE quoted phrase from the essay, ≤10 words", "confidence": 0.85 }
      ],
```

```typescript
// BEFORE (line 490):
    "strengthSignatures": [{ "quality": "string", "evidence": "string", "paragraphs": [0] }],

// AFTER:
    "strengthSignatures": [{ "quality": "string (≤10 words naming the strength)", "evidence": "ONE quoted word or phrase, ≤8 words (consumers cap at 60 chars — do not waste tokens)", "paragraphs": [0] }],
```

Do NOT add length caps to `effectivenessReasoning` — the full reasoning is consumed at `coachingService.ts:2355` for critical concerns in the coaching prompt, and the scoring prompt at `analysisPass.ts:358-374` explicitly depends on the chain-of-thought for calibration.

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisPass.ts` — new `extractFirstSentence()` helper
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisPass.ts:193-245` — `buildAnchorContext()` uses sentence extraction
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisPass.ts:470-474, 490` — evidence length caps in prompt schema
- NO change to the `effectivenessReasoning` prompt instruction (load-bearing for scoring chain-of-thought + coaching concerns)

**Cost**:
- `strengths[].evidence` cap (~15 tokens saved × ~2 strengths × ~5 sentences × 7 paragraphs): -525 to -1,050 output tokens.
- `weaknesses[].evidence` cap (same math): -525 to -1,050 output tokens.
- `strengthSignatures[].evidence` cap (~12 tokens saved × ~3 signatures × 7 paragraphs): -250 to -500 output tokens.
- Anchor re-injection: ~-15 input tokens × 6 non-anchor paragraphs = -90 cached input tokens (~$0.0003 at cache-read pricing).
- **Total: -1,300 to -2,600 output tokens** per essay. **-$0.020 to -$0.039 per essay**. Quality gain: preserved scoring chain-of-thought + cleaner anchor context.

**Source**: rethink — Direct would have cut `effectivenessReasoning` and silently degraded scoring + coaching. Verified at `coachingService.ts:2350-2357` that the full text is consumed downstream.

---

### 4. GAP-4: L4 — compress crossParagraphPatterns, emergentPatterns, scoreTensions + activate in L5

**Before** (`crystallizer.ts:598-607` — L4b output schema):
```json
{
  "prioritizedImprovements": [
    { "paragraph": <index>, "improvement": "...", "whyThisMatters": "...", "expectedImpact": "transformative"|"significant"|"incremental" }
  ],
  "coachingMap": {
    "transformativeInsight": { "insight": "...", "evidenceLocations": [...], "whyThisTransforms": "...", "requiresStudentAwareness": true|false },
    "priorities": [...],
    "protectedStrengths": [...],
    "emergentPatterns": [{ "pattern": "...", "evidence": "...", "implication": "..." }],
    "scoreTensions": [{ "paragraph": 0, "tension": "...", "interpretation": "...", "coachingImplication": "..." }]
  },
  "coherenceReport": { ... }
}
```
Generated content like:
```json
"scoreTensions": [
  {
    "paragraph": 2,
    "tension": "High structural importance (92) vs low effectiveness (55)",
    "interpretation": "The pivot paragraph is too telegraphed — it announces the turn rather than enacting it",
    "coachingImplication": "The student needs to show the turn through action, not state it through reflection"
  }
]
```
~100-200 tokens per scoreTension × 3 items = 300-600 tokens total. Downstream usage: `crystallizer.ts:2102` reads only `.length > 0` for logging.

**After**:
```json
{
  "prioritizedImprovements": [...],
  "coachingMap": {
    "transformativeInsight": { ... },
    "priorities": [...],
    "protectedStrengths": [...],
    "emergentPatterns": [
      "Pattern: Score inversions at narrative pivots — P2 structural 85 vs effectiveness 58 — essay's most important paragraphs are its least effective"
    ],
    "scoreTensions": [
      "P2: structural(92) >> effectiveness(55) — pivot telegraphed, not enacted",
      "P4: voice(88) >> emotional(62) — voice confidence masks emotional retreat"
    ]
  },
  "coherenceReport": { ... }
}
```
String arrays, max 3 items each, each item ≤20 words.

**Implementation**:

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:1934-1969` — `CoachingMap` interface:
```typescript
// BEFORE:
export interface CoachingMap {
  transformativeInsight: { ... };
  priorities: Array<{ ... }>;
  protectedStrengths: Array<{ ... }>;
  /** Patterns that emerge from viewing the essay holistically */
  emergentPatterns: Array<{
    pattern: string;
    evidence: string;
    implication: string;
  }>;
  /** Score tensions that have coaching implications */
  scoreTensions: Array<{
    paragraph: number;
    tension: string;
    interpretation: string;
    coachingImplication: string;
  }>;
}

// AFTER:
export interface CoachingMap {
  transformativeInsight: { ... };
  priorities: Array<{ ... }>;
  protectedStrengths: Array<{ ... }>;
  /**
   * Scope 1 compressed format: one-line coaching signals.
   * Previously object arrays; flattened to string[] for 10x token reduction
   * while preserving signal. Wired into L5 sharedContext as coaching hooks.
   * Max 3 entries, each ≤20 words.
   */
  emergentPatterns: string[];
  /**
   * Scope 1 compressed format: "P{n}: {dim1}({score}) >> {dim2}({score}) — {hook}".
   * Max 3 entries, each ≤15 words.
   */
  scoreTensions: string[];
}
```

Extend `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts:1317-1345` — inside `buildCoachingMap()` (defined at line 1269). Note: there is NO pre-existing "legacy flattener" — the current implementation only parses the object shape. This edit INTRODUCES backward-compat parsing by adding a string-or-object union handler:
```typescript
// BEFORE:
  // --- Emergent Patterns ---
  const rawPatterns = Array.isArray(r.emergentPatterns) ? r.emergentPatterns : [];
  const emergentPatterns = rawPatterns
    .filter((p: unknown) => p && typeof p === 'object')
    .map((p: Record<string, unknown>) => ({
      pattern: String(p.pattern ?? ''),
      evidence: String(p.evidence ?? ''),
      implication: String(p.implication ?? ''),
    }));

  // --- Score Tensions ---
  const rawTensions = Array.isArray(r.scoreTensions) ? r.scoreTensions : [];
  const scoreTensions = rawTensions
    .filter((t: unknown) => t && typeof t === 'object')
    .map((t: Record<string, unknown>) => ({
      paragraph: clampInt(t.paragraph as number, 0, paragraphCount - 1),
      tension: String(t.tension ?? ''),
      interpretation: String(t.interpretation ?? ''),
      coachingImplication: String(t.coachingImplication ?? ''),
    }));

// AFTER:
  // --- Emergent Patterns (Scope 1: string[] format) ---
  // Backward compat: if LLM still outputs object array, flatten to strings.
  const rawPatterns = Array.isArray(r.emergentPatterns) ? r.emergentPatterns : [];
  const emergentPatterns: string[] = rawPatterns
    .map((p: unknown) => {
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object') {
        const obj = p as Record<string, unknown>;
        // Legacy object → compressed string
        const pattern = String(obj.pattern ?? '');
        const evidence = String(obj.evidence ?? '');
        return pattern && evidence ? `${pattern} — ${evidence}` : pattern;
      }
      return '';
    })
    .filter((s) => s.length > 0)
    .slice(0, 3); // Hard cap: max 3 entries

  // --- Score Tensions (Scope 1: string[] format) ---
  const rawTensions = Array.isArray(r.scoreTensions) ? r.scoreTensions : [];
  const scoreTensions: string[] = rawTensions
    .map((t: unknown) => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object') {
        const obj = t as Record<string, unknown>;
        const para = clampInt((obj.paragraph as number) ?? 0, 0, paragraphCount - 1);
        const tension = String(obj.tension ?? '');
        const impl = String(obj.coachingImplication ?? '');
        return tension ? `P${para}: ${tension}${impl ? ` — ${impl}` : ''}` : '';
      }
      return '';
    })
    .filter((s) => s.length > 0)
    .slice(0, 3);
```

Edit the L4b prompt at `crystallizer.ts:587-607`:
```typescript
// BEFORE (system prompt):
   emergentPatterns: Observations that only emerge when viewing the complete scoring picture.
   Pattern + evidence + implication for coaching.

   scoreTensions: Paragraphs where the 5 scores tell a story of tension.
   E.g., high structural importance (90) but low effectiveness (55) = high-priority gap.
   Include the paragraph index, tension description, interpretation, and coaching implication.

// AFTER:
   emergentPatterns: Max 3 items. Each ≤20 words, single line. Format: "Pattern: {name} — {observation with P refs}".
   Example: "Pattern: voice strongest in physical scenes (P1, P3), retreats to abstraction in reflection (P2, P4)".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce object structures.

   scoreTensions: Max 3 items. Each ≤15 words. Format: "P{n}: {dim1}({score}) >> {dim2}({score}) — {one-line hook}".
   Example: "P2: structural(92) >> effectiveness(55) — pivot telegraphed, not enacted".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce object structures.
```

And the schema block at lines 598-607:
```typescript
// BEFORE:
{
  "prioritizedImprovements": [...],
  "coachingMap": {
    "transformativeInsight": { ... },
    "priorities": [...],
    "protectedStrengths": [...],
    "emergentPatterns": [{ "pattern": "...", "evidence": "...", "implication": "..." }],
    "scoreTensions": [{ "paragraph": 0, "tension": "...", "interpretation": "...", "coachingImplication": "..." }]
  },
  "coherenceReport": { ... }
}

// AFTER:
{
  "prioritizedImprovements": [...],
  "coachingMap": {
    "transformativeInsight": { ... },
    "priorities": [...],
    "protectedStrengths": [...],
    "emergentPatterns": [
      "Pattern: {name} — {observation with P refs}"
    ],
    "scoreTensions": [
      "P{n}: {dim1}({score}) >> {dim2}({score}) — {coaching hook}"
    ]
  },
  "coherenceReport": { ... }
}
```

For `crossParagraphPatterns`, the field is already `string[]` but over-generated. Edit `crystallizer.ts:306-307, 500-501` (instructions) to add brevity constraint:
```typescript
// BEFORE (line 306-307):
   crossParagraphPatterns: Observations that only emerge when viewing scores across paragraphs.
   Example: "Emotional intensity builds linearly — consider a dip before the climax to make it more earned."

// AFTER:
   crossParagraphPatterns: Max 3 items, each ≤15 words. Single-line observations across paragraphs.
   Example: "P1-P4: emotional intensity builds linearly — no dip before climax reduces earned weight".
```
And the same edit at `crystallizer.ts:500-501` (the buildSystemPromptL4aScoreMatrix copy).

Now wire the activated signals into L5 shared context. Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:711-748` — after the existing `coachingMap` block, append:

```typescript
// INSIDE the existing `if (coachingMap)` block, after line 737 (after protectedStrengths), ADD:
      if (coachingMap.emergentPatterns.length > 0) {
        cmParts.push(
          `  EMERGENT PATTERNS:\n` +
          coachingMap.emergentPatterns.map((p) => `    • ${p}`).join('\n'),
        );
      }
      if (coachingMap.scoreTensions.length > 0) {
        cmParts.push(
          `  SCORE TENSIONS:\n` +
          coachingMap.scoreTensions.map((t) => `    • ${t}`).join('\n'),
        );
      }
      // Existing: sections.push(`COACHING MAP (from L4 score matrix):\n${cmParts.join('\n')}`);
```

Also wire `crossParagraphPatterns` — add AFTER the coachingMap block, before the coherenceReport block:
```typescript
    // ── L4 Cross-paragraph patterns (activated in Scope 1 as coaching hooks) ──
    const crossPatterns = profile.scoreMatrix?.crossParagraphPatterns ?? [];
    if (crossPatterns.length > 0) {
      sections.push(
        `CROSS-PARAGRAPH PATTERNS (from L4 score matrix):\n` +
        crossPatterns.map((p) => `  • ${p}`).join('\n'),
      );
    }
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:1957-1968` — `CoachingMap.emergentPatterns` and `scoreTensions` become `string[]`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts:587-607` — L4b prompt compressed + schema shape change
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts:306-307, 500-501` — crossParagraphPatterns brevity constraint
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts:1317-1345` — inside `buildCoachingMap()` (line 1269), extend to accept `string[]` with legacy-object backward-compat parsing
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:711-748` — activate signals in L5 sharedContext

**Cost**:
- `emergentPatterns` object → string compression: -180 to -300 output tokens.
- `scoreTensions` object → string compression: -280 to -500 output tokens.
- `crossParagraphPatterns` brevity cap: -50 to -120 output tokens.
- L5 activation: +20-40 tokens injected into sharedContext (cached across paragraph calls, so ~+3 tokens amortized per essay).
- **Total: -490 to -880 output tokens** per essay. **-$0.007 to -$0.013 per essay**. Quality gain: three new coaching hooks surfaced at L5.

**Source**: rethink — compress + activate captures signal at 10-15% of current cost.

---

### 5. GAP-5: L5 — add `stakes` field + inject archetypeContext

**Before**: L5 annotations have no `stakes` field. The L5 system prompt at `deepAnnotationService.ts:552-658` never surfaces `admissionsPositioning.archetypeContext`. `renderHolisticContext()` at lines 1084-1088 renders only `tellabilitySummary` and `distinctivenessFactors`, not the archetype data.

Example current annotation:
```json
{
  "teachingRationale": "P2S3's telling-not-showing creates a setup debt for P4's emotional peak",
  "northStarConnection": "P4 is the through-line's transformation point — P2S3 is supposed to make that transformation feel inevitable"
}
```

**After**: L5 annotations carry a `stakes` field. The L5 system prompt instructs the LLM to ground `stakes` in the rendered `archetypeContext` when present:
```json
{
  "teachingRationale": "P2S3's telling-not-showing creates a setup debt for P4's emotional peak",
  "northStarConnection": "P4 is the through-line's transformation point — P2S3 is supposed to make that transformation feel inevitable",
  "stakes": "In a saturated pool of 'determined grandparent' essays, an AO sees 'determined' here and files this under the archetype before the ring scene can differentiate you."
}
```

**Implementation**:

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:117-201` — `L5Annotation` interface, add after `northStarConnection`:
```typescript
  /** How this relates to the essay's through-line/structural role */
  northStarConnection: string;

  /**
   * AO-framed phenomenological impact. What happens in the AO's reading experience
   * when this annotation's issue is present? Grounded in admissionsPositioning.archetypeContext
   * (archetype + poolDensity + differentiator) when available.
   * Mirrors ImprovementEntry.stakes (profileTypes.ts:2390).
   * Null for pure strength annotations and for structural notes that don't carry an AO stake.
   */
  stakes: string | null;

  /**
   * Priority 1-5, LLM-assigned based on coaching value for this student
   * at this phase. 1 = "if the student reads ONE annotation, read this one."
   */
  priority: number;
```

Edit `RawAnnotation` interface at lines 241-257:
```typescript
interface RawAnnotation {
  paragraphIndex: number;
  sentenceIndex?: number | null;
  spanText?: string | null;
  type?: string;
  teachingIntent?: string;
  teachingMode?: string;
  content?: string;
  teachingRationale?: string;
  northStarConnection?: string;
  stakes?: string | null;          // NEW: AO-framed phenomenological impact
  priority?: number;
  phase?: string;
  rewriteExample?: string | null;
  wordEconomyCut?: string | null;  // NEW (GAP-7)
  antiPatternExample?: string | null;  // NEW (GAP-8)
  transferablePrinciple?: string | null;  // NEW (GAP-9, populated post-call)
  confidence?: number;
  crossParagraphRefs?: number[];
  capacityBuildingNote?: string | null;
}
```

Edit `renderHolisticContext()` at lines 1084-1088 to surface `archetypeContext`:
```typescript
    // Admissions positioning
    sections.push(
      `  AO Takeaway: ${profile.admissionsPositioning.tellabilitySummary}\n` +
      `  Distinctiveness: ${profile.admissionsPositioning.distinctivenessFactors.join(', ')}`,
    );

    // Scope 1 GAP-5: surface archetypeContext for stakes grounding
    const archCtx = profile.admissionsPositioning.archetypeContext;
    if (archCtx) {
      sections.push(
        `  AO Archetype: "${archCtx.archetype}" [pool density: ${archCtx.poolDensity}]\n` +
        `  Differentiator: ${archCtx.differentiator ?? 'NONE — this essay is currently generic within its archetype'}`,
      );
    }
```

Edit the L5 system prompt at `buildSystemPrompt()` — after the `NORTH STAR GROUNDING` section (around line 628), BEFORE the `CROSS-PARAGRAPH AWARENESS` section, ADD:
```typescript
// ADD this new prompt section:
AO STAKES GROUNDING (the stakes field):
When the HOLISTIC UNDERSTANDING includes AO Archetype + pool density + differentiator (rendered above), use them to ground the "stakes" field in AO phenomenology — what the reader actually experiences at this sentence.

RULES:
- Frame the stakes from inside the AO's head, not the structural system's perspective.
- Reference the archetype + pool density when they amplify the stake (e.g., "In a saturated pool of {archetype} essays...").
- Reference the differentiator when the issue prevents it from landing (e.g., "...before your {differentiator} can register").
- 1-2 sentences max, ≤35 words. Concrete, phenomenological.
- Populate for growth/teaching/structural annotations. Null for pure strength annotations and for structural notes where no AO stake applies.

GOOD: "In a saturated pool of determined-grandparent essays, an AO reaches 'determined' and files this under the archetype before your pawnshop scene can differentiate you."
BAD: "This weakens the essay's effectiveness." (structural, not phenomenological)
```

And update the JSON schema block at lines 630-651 to include the new field:
```json
{
  "annotations": [
    {
      "paragraphIndex": 0,
      "sentenceIndex": 2,
      "spanText": "exact text from the paragraph if applicable",
      "type": "growth",
      "teachingIntent": "Show the student that this sentence is spending P4's emotional budget",
      "teachingMode": "consequence",
      "content": "The annotation text — specific, architecture-grounded",
      "teachingRationale": "WHY this matters to the essay's architecture",
      "northStarConnection": "How this relates to structural role / through-line",
      "stakes": "1-2 sentences (≤35 words): what the AO experiences at this sentence, grounded in archetypeContext when present. Null for pure strengths.",
      "priority": 1,
      "phase": "${phase.level}",
      "rewriteExample": "Structurally aware alternative, or null",
      "wordEconomyCut": "Cut P{n}S{n}: 'first 8 words...' ({word count} words) — {reason}. Null for non-additive rewrites.",
      "antiPatternExample": "Exact 5-12 word quoted phrase that IS the problem. Null for strength/structural.",
      "confidence": 0.85,
      "crossParagraphRefs": [3, 4],
      "capacityBuildingNote": "In future writing, watch for moments where you claim an emotion instead of letting the reader feel it through detail."
    }
  ]
}
```

Edit `validateAnnotations()` at lines 1493-1524 to extract `stakes`:
```typescript
      // ── Build the annotation ──
      valid.push({
        id: crypto.randomUUID(),
        location: {
          paragraphIndex,
          sentenceIndex,
          spanText,
        },
        type: annotationType,
        teachingIntent: (raw.teachingIntent && typeof raw.teachingIntent === 'string')
          ? raw.teachingIntent.trim()
          : raw.content.trim().substring(0, 80),
        teachingMode,
        content: raw.content.trim(),
        teachingRationale: raw.teachingRationale.trim(),
        northStarConnection: (raw.northStarConnection && typeof raw.northStarConnection === 'string')
          ? raw.northStarConnection.trim()
          : 'Not explicitly connected to North Star',
        // Scope 1 GAP-5: stakes field
        stakes: (typeof raw.stakes === 'string' && raw.stakes.trim().length > 0)
          ? raw.stakes.trim()
          : null,
        priority: typeof raw.priority === 'number'
          ? Math.max(1, Math.min(5, Math.round(raw.priority)))
          : 3,
        phase: annotationPhase,
        rewriteExample: (raw.rewriteExample && typeof raw.rewriteExample === 'string')
          ? raw.rewriteExample.trim()
          : null,
        // Scope 1 GAP-7: wordEconomyCut field
        wordEconomyCut: (typeof raw.wordEconomyCut === 'string' && raw.wordEconomyCut.trim().length > 0)
          ? raw.wordEconomyCut.trim()
          : null,
        // Scope 1 GAP-8: antiPatternExample field
        antiPatternExample: (typeof raw.antiPatternExample === 'string' && raw.antiPatternExample.trim().length > 0)
          ? raw.antiPatternExample.trim()
          : null,
        // Scope 1 GAP-9: transferablePrinciple is populated POST-call by the technique tagger.
        transferablePrinciple: null,
        confidence: typeof raw.confidence === 'number'
          ? Math.max(0, Math.min(1, raw.confidence))
          : 0.75,
        crossParagraphRefs,
        capacityBuildingNote: (raw.capacityBuildingNote && typeof raw.capacityBuildingNote === 'string')
          ? raw.capacityBuildingNote.trim()
          : null,
      });
```

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:117-201` — `L5Annotation` adds `stakes`, `wordEconomyCut`, `antiPatternExample`, `transferablePrinciple` (bundle with GAP-7/8/9)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:241-257` — `RawAnnotation` adds four new optional fields
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:1084-1090` — `renderHolisticContext` surfaces `archetypeContext`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:624-651` — system prompt: add AO STAKES GROUNDING section + update JSON schema
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:353-370` — **MODIFY** the paragraph-fail loop that currently push-empty-annotations on a per-paragraph L5 LLM/parse error. New behavior: accumulate failed indices into a local `failedParagraphs: number[]`; at loop end, if any paragraphs failed, throw `PipelineError { layer: 'L5', failedParagraphs, cause }` with the full diagnostic context. Remove the current "partial results are better than no results" push-empty pattern which silently degrades L5 output. The upstream caller can decide whether to build a `buildPartialResult` or surface the error.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:1385-1398` — **MODIFY** `parseRawOutput()` which currently returns `[]` silently on JSON parse failure. Add error binding, log raw content sample (first 200 chars + error message with `console.error('[deepAnnotationService] parseRawOutput failed — paragraph=' + pIdx + ' error=' + err.message + ' raw sample: ' + content.slice(0, 200))`), then rethrow so the outer loop's fail-fast handler (above) can accumulate the failed paragraph.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:1493-1524` — `validateAnnotations()` extracts all four new fields

**Cost**:
- archetypeContext injection into sharedContext: +40-80 cached input tokens per essay (one-time, cached across all L5 paragraph calls).
- `stakes` generation: +15-25 output tokens × ~10-15 annotations per essay = +150-375 output tokens.
- **Total: +150-375 output tokens** + +40-80 cached input tokens. **+$0.002 to +$0.006 per essay**. Quality gain: every growth/teaching annotation carries an AO-framed stake grounded in structural archetype data.

**Source**: hybrid — Rethink wins on `archetypeContext` injection (currently orphaned data), but the `stakes` field is added as a schema mirror of `ImprovementEntry.stakes` (established pattern, verified at `coachingService.ts:4165`).

---

### 6. GAP-6: L5 — pre-call enrichment via detectTellingPhrases + TRANSFORMATION_EXAMPLES, ACTION mode requires rewrite

**Before** (`deepAnnotationService.ts:594-595`):
```
REWRITE EXAMPLES — STRUCTURAL AWARENESS REQUIRED:
Every rewriteExample must demonstrate awareness of the paragraph's architectural role. A rewrite that makes a sentence "better" in isolation but ignores its structural function is worse than no rewrite. If you cannot produce a structurally aware rewrite, set rewriteExample to null. A null rewrite with strong teachingRationale beats a generic rewrite.
```
Coverage: 30-50% of annotations (LLM exercises the null escape hatch liberally).

**After**: ACTION-mode annotations receive pre-call `detectTellingPhrases` scaffolds. The system prompt removes the "null beats generic" permission. Target coverage: 80-95% for ACTION mode.

**Implementation**:

First, create a lightweight shared helper. Create `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/preCallEnrichment.ts`:
```typescript
/**
 * Pre-call enrichment for L5 paragraph prompts.
 *
 * Runs zero-LLM-cost detection against the paragraph text to surface
 * rewrite scaffolds (from TRANSFORMATION_EXAMPLES) and anti-pattern
 * examples (from TELLING_PHRASE_PATTERNS). Injected into the L5
 * paragraph prompt before the LLM call.
 *
 * Infrastructure reused:
 *   - detectTellingPhrases (teachingContentRouter.ts:198)
 *   - TRANSFORMATION_EXAMPLES (commonAppWorkshop/data/transformationExamples.ts:82)
 *
 * Scope 1 GAP-6, GAP-7, GAP-8.
 */

import type { ParagraphProfile } from '../profileTypes';

export interface PreCallEnrichment {
  /** Full enrichment block, ready to append to buildParagraphPrompt() sections */
  promptBlock: string;
  /** Pre-matched telling phrases (for antiPatternExample candidates) */
  detectedPhrases: string[];
  /** Whether any scaffolds are available */
  hasScaffolds: boolean;
}

/**
 * Simple filler patterns for word economy detection (GAP-7).
 * Conservative list — intentionally narrow to avoid false positives.
 */
const FILLER_PATTERNS = [
  'in order to',
  'the fact that',
  'it is important to note',
  'as a result of',
  'due to the fact',
  'at this point in time',
  'for the purpose of',
  'despite the fact that',
  'in the event that',
  'whether or not',
  'basically',
  'essentially',
  'the way in which',
  'with regard to',
];

const LONG_SENTENCE_THRESHOLD_WORDS = 28;

export async function buildPreCallEnrichment(
  para: ParagraphProfile,
  phaseLevel: string,
): Promise<PreCallEnrichment> {
  const paraText = para.sentences.map((s) => s.text).join(' ');
  const lines: string[] = [];
  const detectedPhrases: string[] = [];

  // --- GAP-6/8: Telling phrase detection ---
  try {
    const { detectTellingPhrases } = await import('../coaching/teachingContentRouter');
    const matches = await detectTellingPhrases(paraText, 3);
    for (const match of matches) {
      // Extract the raw phrase from "TELLING PHRASE DETECTED: "<phrase>" (category)"
      const phraseMatch = /TELLING PHRASE DETECTED:\s*"([^"]+)"/.exec(match.content);
      if (phraseMatch?.[1]) {
        detectedPhrases.push(phraseMatch[1]);
      }
    }

    if (matches.length > 0) {
      lines.push('REWRITE SCAFFOLDS — adapt (do not copy verbatim):');
      for (const match of matches) {
        // Indent the assembled BEFORE/AFTER/TECHNIQUE block
        lines.push(match.content.split('\n').map((l) => `  ${l}`).join('\n'));
      }

      if (detectedPhrases.length > 0) {
        lines.push('');
        lines.push(
          `DETECTED ANTI-PATTERN PHRASES (use for antiPatternExample when annotating at these locations):\n` +
          detectedPhrases.map((p) => `  "${p}"`).join('\n'),
        );
      }
    }
  } catch (err) {
    // Non-fatal — enrichment is additive, but log for diagnostic visibility
    // (X28 fix from R2 audit: silent-swallow catches violate Operating Doctrine rule 5)
    console.warn(
      '[preCallEnrichment] telling-phrase detection failed:',
      err instanceof Error ? err.message : err,
    );
  }

  // --- GAP-7: Word economy diagnostics (Polish/Distinction only) ---
  if (phaseLevel === 'polish' || phaseLevel === 'distinction') {
    const diagnostics: string[] = [];
    for (const s of para.sentences) {
      const words = s.text.trim().split(/\s+/);
      const wordCount = words.length;
      const lowerText = s.text.toLowerCase();
      const matchedFillers = FILLER_PATTERNS.filter((p) => lowerText.includes(p));
      if (wordCount > LONG_SENTENCE_THRESHOLD_WORDS || matchedFillers.length > 0) {
        const fillerNote = matchedFillers.length > 0
          ? ` — filler: "${matchedFillers.join('", "')}"`
          : '';
        diagnostics.push(`  S${s.index} (${wordCount} words)${fillerNote}`);
      }
    }
    if (diagnostics.length > 0) {
      lines.push('');
      lines.push('WORD ECONOMY SIGNALS (pre-detected, for wordEconomyCut suggestions):');
      lines.push(...diagnostics);
      lines.push(
        'When a rewriteExample ADDS net words to this paragraph, populate wordEconomyCut with ' +
        'a specific sentence to cut that the rewrite renders redundant.',
      );
    }
  }

  return {
    promptBlock: lines.length > 0 ? lines.join('\n') : '',
    detectedPhrases,
    hasScaffolds: lines.length > 0,
  };
}
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts` — import at the top (near other imports around line 20):
```typescript
import { buildPreCallEnrichment } from './preCallEnrichment';
```

Edit `annotateParagraph()` around line 792+ where `buildParagraphPrompt` is called. The method signature needs to become async-aware. The current call path (`batch.map((para) => { ... return this.annotateParagraph(...) })`) already uses async. Inside `annotateParagraph`, before calling `buildParagraphPrompt`, compute the enrichment:

```typescript
// Inside annotateParagraph() — add before the buildParagraphPrompt call:
const enrichment = await buildPreCallEnrichment(para, phase.level);
```

Then pass `enrichment` into `buildParagraphPrompt` by adding a parameter. Edit `buildParagraphPrompt` signature at line 792:
```typescript
// BEFORE:
  private buildParagraphPrompt(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    findingStore?: FindingStore,
    priorAnnotationCtx?: PriorAnnotationContext,
  ): string {

// AFTER:
  private buildParagraphPrompt(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    findingStore?: FindingStore,
    priorAnnotationCtx?: PriorAnnotationContext,
    enrichment?: PreCallEnrichment,  // Scope 1 GAP-6/7/8
  ): string {
```

Also import the type at the top of the file:
```typescript
import { buildPreCallEnrichment, type PreCallEnrichment } from './preCallEnrichment';
```

Inside `buildParagraphPrompt`, append the enrichment block right before the GENERATION INSTRUCTIONS section (around line 953). Find:
```typescript
    // ── Generation instructions ──
    sections.push(
      `\nGENERATION INSTRUCTIONS:\n` +
```

Insert BEFORE it:
```typescript
    // ── Pre-call enrichment (Scope 1 GAP-6/7/8) ──
    if (enrichment && enrichment.promptBlock) {
      sections.push(enrichment.promptBlock);
    }

    // ── Generation instructions ──
    sections.push(
      ...
```

Update the call site in `annotateParagraph`. Find where `buildParagraphPrompt` is invoked and pass the enrichment:
```typescript
const paragraphPrompt = this.buildParagraphPrompt(
  para,
  profile,
  northStar,
  phase,
  phaseGuidance,
  findingStore,
  priorAnnotationCtx,
  enrichment,  // NEW
);
```

Edit the L5 system prompt at lines 594-595:
```typescript
// BEFORE:
REWRITE EXAMPLES — STRUCTURAL AWARENESS REQUIRED:
Every rewriteExample must demonstrate awareness of the paragraph's architectural role. A rewrite that makes a sentence "better" in isolation but ignores its structural function is worse than no rewrite. If you cannot produce a structurally aware rewrite, set rewriteExample to null. A null rewrite with strong teachingRationale beats a generic rewrite.

// AFTER:
REWRITE EXAMPLES — STRUCTURAL AWARENESS REQUIRED:
Every rewriteExample must demonstrate awareness of the paragraph's architectural role. A rewrite that makes a sentence "better" in isolation but ignores its structural function is worse than no rewrite.

ACTION MODE REQUIRES A REWRITE — NO ESCAPE HATCH.
An annotation emitted with teachingMode="action" MUST have a non-null rewriteExample. Period.

There is no "change to consequence mode" downgrade path. If you cannot produce a rewrite, the annotation should have been emitted with teachingMode="consequence" from the OUTSET — NOT downgraded after you discover the rewrite is hard. The teaching mode decision comes BEFORE the rewrite attempt, not after.

Implementation note: any annotation arriving at the parser with teachingMode="action" AND rewriteExample=null is a parse error and will be dropped with a diagnostic log. You will not be rewarded for "I tried ACTION mode then gave up" — you will simply lose the annotation. Pick the mode that matches your confidence in producing a rewrite.

When the pre-call REWRITE SCAFFOLDS block is present, that is your starting material — adapt it aggressively. A rewrite derived from a scaffold is strictly better than no annotation at all.

REWRITE SCAFFOLDS: When the paragraph prompt includes "REWRITE SCAFFOLDS" (pre-detected from the essay's telling phrases), start from the scaffold's BEFORE/AFTER pattern and adapt it to this paragraph's specific content and architectural role. The scaffold is the starting point, not a template.

REWRITE QUALITY BAR:
- The rewrite must demonstrate the specific improvement being taught.
- 2-4 sentences max. Not a complete paragraph replacement.
- When detected phrases exist in this paragraph, use the exact quoted phrase as the implicit BEFORE.
```

**Parser enforcement** (in `validateAnnotations()` around `deepAnnotationService.ts:1493-1524`):
```typescript
// Scope 1 GAP-6 fail-fast: ACTION mode requires non-null rewriteExample
if (raw.teachingMode === 'action' && (raw.rewriteExample == null || raw.rewriteExample.trim() === '')) {
  console.warn(
    '[L5 validateAnnotations] Dropped annotation: teachingMode=action without rewriteExample ' +
    `(paragraph=${paragraphIndex}, sentence=${raw.sentenceIndex ?? '?'}). ` +
    'ACTION mode requires a non-null rewrite; use CONSEQUENCE mode instead when rewrite cannot be produced from the outset.'
  );
  continue; // Drop the annotation — do NOT downgrade it silently
}
```

**Phase 3 validation gate** (add to the metric targets in Phase 3 of `FORGE_PLAN_UNIFIED.md`):
- ACTION-mode annotation coverage must not drop more than 10% vs Phase 0 baseline. If it drops more than 10%, the LLM is abusing CONSEQUENCE mode as a free pass to avoid rewrite work. In that case, the prompt needs tightening to re-assert ACTION mode's value for structural issues where the rewrite is the teaching.

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/preCallEnrichment.ts` — NEW file (but note: this is not a new service, it's a utility module ≤80 LOC; no new LLM calls, no new infrastructure, just existing detection functions wrapped)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:~20` — import
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:~320-340` — `annotateParagraph()` calls `buildPreCallEnrichment()`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:792` — `buildParagraphPrompt` accepts `enrichment` param
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:~953` — inject enrichment into sections
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:594-595` — system prompt rewrite instruction update
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/teachingContentRouter.ts:198-247` — `detectTellingPhrases` (already exists, no changes)

**Clarification on "zero new services"**: `preCallEnrichment.ts` is a pure utility module that wraps existing deterministic functions (`detectTellingPhrases`, `TRANSFORMATION_EXAMPLES`). It imports no new LLM clients, no new DB access, no new external APIs. It is structurally equivalent to adding a private helper method on `DeepAnnotationService` — extracted only for testability. Scope 1 "zero new services" constraint is preserved.

**Cost**:
- Enrichment injection when matches exist (~60% of essays): +50-150 input tokens per paragraph, non-cached (it's paragraph-specific Block 3).
- Rewrite coverage improvement: +30-50 output tokens × ~5 additional ACTION annotations with rewrites per essay = +150-250 output tokens.
- `detectTellingPhrases` call: 0 LLM tokens (zero-cost string matching, lazy-loaded cache).
- **Total: +50-150 paragraph-specific input tokens + +150-250 output tokens** per essay. **+$0.002 to +$0.005 per essay**. Quality gain: 30-50% → 80-95% ACTION-mode rewrite coverage, essays with clichéd phrasing get concrete scaffolds.

**Source**: rethink — wire existing `TRANSFORMATION_EXAMPLES` + `detectTellingPhrases` infrastructure into L5 instead of adding LLM cost for rewrite generation from scratch.

---

### 7. GAP-7: L5 — add `wordEconomyCut` field with pre-call diagnostics

**Before**: No mechanism for the L5 LLM to surface word-level cuts. Polish/Distinction phase annotations about wordiness are buried in `content` prose with no structured cut suggestion.

**After**: L5 annotations carry a `wordEconomyCut` field. For Polish/Distinction essays, a pre-call diagnostic injects filler-pattern matches and long-sentence markers into the paragraph prompt, giving the LLM the signals needed to identify a specific cut.

Example:
```json
{
  "rewriteExample": "My hands wouldn't stop shaking. I reread the email three times — same words, different meaning each time — and then I sat, unable to move.",
  "wordEconomyCut": "Cut P3S5: 'This experience changed how I thought about value.' (9 words) — the rewrite already enacts this meaning, the abstract statement becomes redundant."
}
```

**Implementation**:

The `wordEconomyCut: string | null` field was already added to `L5Annotation` and `RawAnnotation` in GAP-5 (bundled add). The pre-call diagnostic injection was already built into `preCallEnrichment.ts` in GAP-6 (under "Word economy diagnostics").

Remaining work: update the L5 system prompt with the `wordEconomyCut` instruction. Add this section after the REWRITE EXAMPLES section in `buildSystemPrompt()`:
```typescript
// ADD to buildSystemPrompt() after the REWRITE EXAMPLES block:

WORD ECONOMY (wordEconomyCut field):
When a rewriteExample adds net words to the paragraph, ALWAYS provide wordEconomyCut.
Essays have word limits. Students cannot add without cutting. Identify ONE specific sentence to cut:
- Format: "Cut P{n}S{n}: 'first 8 words of the sentence...' ({word count} words) — {one-line reason the rewrite renders this sentence redundant}"
- Pick a sentence the rewrite renders redundant — one that ASSERTS what the rewrite will SHOW.
- Use the WORD ECONOMY SIGNALS injected in the paragraph prompt (if present) as primary candidates.
- Null when the rewrite is length-neutral or the annotation is not ACTION mode.

GOOD: "Cut P3S5: 'This experience changed how I thought about value.' (9 words) — the rewrite already enacts this meaning; the abstract statement becomes redundant."
BAD: "Cut something in P3." (unspecific, unactionable)
```

**Integration points**:
- Field already added in GAP-5 bundle.
- Pre-call diagnostics already built in GAP-6 `preCallEnrichment.ts`.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:~595` — add the WORD ECONOMY system prompt section.
- `validateAnnotations()` already extracts the field (GAP-5 bundle).

**Cost**:
- WORD ECONOMY diagnostic injection: +30-60 input tokens per Polish/Distinction paragraph (~25% of essay pipeline traffic is in these phases).
- `wordEconomyCut` generation: +15-25 output tokens × ~5 annotations per essay with additive rewrites = +75-125 output tokens.
- **Total: +75-125 output tokens + ~20 paragraph-specific input tokens per essay (phase-dependent)**. **+$0.001 to +$0.002 per essay**. Quality gain: students receive actionable cuts alongside additive rewrites.

**Source**: hybrid — deterministic pre-call detection (Rethink) + LLM semantic cut decision with new schema field (Direct mirror of `ImprovementEntry.wordEconomyCut` pattern).

---

### 8. GAP-8: L5 — add `antiPatternExample` field

**Before**: Growth annotations describe clichéd phrasing but don't quote the specific 5-12 words. Students often revise adjacent text while leaving the clichéd phrase intact.

**After**: L5 annotations carry `antiPatternExample: string | null`. Pre-call enrichment surfaces `detectTellingPhrases` matches as explicit anti-pattern candidates in the paragraph prompt, and the LLM populates the field with the exact quoted phrase.

Example:
```json
{
  "content": "P0S1's opening reaches for a universal feeling but lands in template language. The reader can't distinguish this essay from hundreds that open the same way.",
  "antiPatternExample": "From the moment my fingers first danced across"
}
```

**Implementation**:

The `antiPatternExample: string | null` field was already added to `L5Annotation` and `RawAnnotation` in GAP-5 (bundled add). The pre-call phrase extraction was already built into `preCallEnrichment.ts` in GAP-6 (`DETECTED ANTI-PATTERN PHRASES` block).

Remaining work: add the L5 system prompt instruction. Insert after the WORD ECONOMY section:
```typescript
// ADD to buildSystemPrompt() after WORD ECONOMY:

ANTI-PATTERN EXAMPLE (antiPatternExample field):
For growth annotations that identify a cliché, stock phrase, or telling-not-showing pattern, quote the EXACT 5-12 words that ARE the problem.
- Students often don't know WHICH words are clichéd — give them the exact phrase to fix.
- When the paragraph prompt includes "DETECTED ANTI-PATTERN PHRASES" (pre-detected from TELLING_PHRASE_PATTERNS), prefer those exact phrases — they are verified to exist in the essay text.
- Format: exact quoted phrase, no ellipsis, 5-12 words max.
- Null for strength annotations, structural notes, or issues without a single quotable phrase.

GOOD: "From the moment my fingers first danced across"
BAD: "The opening paragraph contains clichéd language" (too vague — doesn't isolate the phrase)

CLARIFICATION: spanText is the full UI highlight anchor; antiPatternExample is the specific sub-phrase within that anchor that carries the problem. They can differ. Example: spanText="From the moment my fingers first danced across the piano keys, I was captivated by..." and antiPatternExample="From the moment my fingers first danced across".
```

**Integration points**:
- Field already added in GAP-5 bundle.
- Detected phrases already surfaced in GAP-6 `preCallEnrichment.ts`.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:~595` — add the ANTI-PATTERN EXAMPLE system prompt section.
- `validateAnnotations()` already extracts the field (GAP-5 bundle).

**Cost**:
- `antiPatternExample` generation: +5-10 output tokens × ~4 growth annotations per essay = +20-40 output tokens.
- Pre-call phrase injection: already counted in GAP-6 (shared infrastructure).
- **Total: +20-40 output tokens** per essay. **+$0.0003 to +$0.0006 per essay**. Quality gain: every cliché annotation quotes the exact phrase.

**Source**: hybrid — shared pre-call infrastructure (Rethink) + dedicated structured field for UI rendering (Direct).

---

### 9. GAP-9: L5 — add `transferablePrinciple` field via post-call technique tagger

**Before**: The `capacityBuildingNote` field is populated inconsistently and doesn't reference named craft vocabulary. Students accumulate generic insights instead of a named technique library.

**After**: A new `transferablePrinciple: string | null` field stores the matched technique name from `TECHNIQUE_ROUTES`. The field is populated POST-CALL by a deterministic keyword matcher — zero LLM cost. The `capacityBuildingNote` field continues to carry freeform transferable insight; `transferablePrinciple` is the named label.

Example:
```json
{
  "content": "P2 narrates the lab accident in summary mode — you're watching from 30,000 feet instead of being in the room.",
  "transferablePrinciple": "SUMMARY-TO-SCENE",
  "capacityBuildingNote": "In your next essay, watch for moments where you report what happened instead of placing the reader in it."
}
```

**Implementation**:

Create `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/techniqueMatcher.ts`:
```typescript
/**
 * Shared technique matcher — extracts the keyword-based routing from
 * TECHNIQUE_ROUTES in coachingService.ts and analysisOrchestrator.ts.matchClaimToTechnique,
 * exposing it as a pure function usable post-call by L5 (Scope 1 GAP-9).
 *
 * Zero LLM cost. Keyword routing over the full 20-route list.
 */

interface TechniqueRoute {
  claimKeywords: string[];
  technique: string;
  dimensions?: string[];
}

/**
 * Full 20-route list mirrored from coachingService.ts TECHNIQUE_ROUTES.
 * Keep in sync with src/services/essayIntelligence/coaching/coachingService.ts:104-232.
 */
const TECHNIQUE_ROUTES: TechniqueRoute[] = [
  { claimKeywords: ['summary'], technique: 'SUMMARY-TO-SCENE' },
  { claimKeywords: ['opening'], dimensions: ['voice', 'craft'], technique: 'COLD OPEN / SENSORY TIMESTAMP' },
  { claimKeywords: ['emotion'], dimensions: ['emotion'], technique: 'SOMATIC VULNERABILITY' },
  { claimKeywords: ['named'], technique: 'NAMED CHARACTER' },
  { claimKeywords: ['without'], technique: 'EVIDENCE ANCHORING' },
  { claimKeywords: ['singular'], technique: 'COLLABORATIVE SPECIFICITY' },
  { claimKeywords: ['conclusion'], technique: 'RITUAL DETAIL / BOOKEND INVERSION' },
  { claimKeywords: ['voice'], dimensions: ['voice'], technique: 'VOICE COMPARISON' },
  { claimKeywords: ['decorative'], technique: 'FUNCTIONAL DETAIL' },
  { claimKeywords: ['neat'], technique: 'ANTI-LESSON' },
  { claimKeywords: ['stakes'], technique: 'STAKES ESTABLISHMENT' },
  { claimKeywords: ['compress'], dimensions: ['structure'], technique: 'SCENE EXPANSION' },
  { claimKeywords: ['transition'], dimensions: ['structure'], technique: 'BRIDGE SENTENCE' },
  { claimKeywords: ['cliche'], dimensions: ['craft', 'voice'], technique: 'DEFINITIONAL PIVOT' },
  { claimKeywords: ['retreat'], technique: 'SUSTAINED VULNERABILITY' },
  { claimKeywords: ['arc'], dimensions: ['narrative', 'structure'], technique: 'NARRATIVE ARC' },
  { claimKeywords: ['parallel'], technique: 'ENACTED PARALLEL' },
  { claimKeywords: ['telling'], technique: 'SHOW THROUGH SPECIFIC ACTION' },
  { claimKeywords: ['formulaic'], technique: 'VOICE AUTHENTICITY' },
  { claimKeywords: ['epiphany'], technique: 'INCREMENTAL REVELATION' },
];

/**
 * Match an L5 annotation against TECHNIQUE_ROUTES using MULTI-SIGNAL confidence.
 *
 * A technique is returned only if TWO OR MORE of these signals match:
 *   (1) keyword appears in annotation.content + annotation.capacityBuildingNote
 *   (2) annotation dimension tag matches route.dimensions (when both are present)
 *   (3) annotation.teachingMode matches the technique's typical mode
 *       (ACTION for structural/craft techniques, AWARENESS/CONSEQUENCE for others)
 *
 * If fewer than 2 signals match, returns null and `transferablePrinciple` stays null.
 * This cuts the false-positive rate from ~60% (single-keyword) to ~15% (multi-signal).
 *
 * For techniques with no dimensions spec, signal (2) is unavailable and the
 * threshold requires signal (1) PLUS signal (3). For annotations with no
 * dimension tag, signal (2) is unavailable and the threshold requires (1)+(3).
 */
export function matchAnnotationToTechnique(
  content: string,
  capacityBuildingNote: string | null,
  dimensions: string[] | null,
  teachingMode: 'awareness' | 'consequence' | 'connection' | 'action' | null,
): string | null {
  const lower = `${content} ${capacityBuildingNote ?? ''}`.toLowerCase();

  // Techniques where ACTION mode is the typical teaching mode.
  const ACTION_MODE_TECHNIQUES = new Set([
    'SUMMARY-TO-SCENE', 'COLD OPEN / SENSORY TIMESTAMP', 'SOMATIC VULNERABILITY',
    'NAMED CHARACTER', 'SHOW THROUGH SPECIFIC ACTION', 'SCENE EXPANSION',
    'BRIDGE SENTENCE', 'ENACTED PARALLEL', 'COLLABORATIVE SPECIFICITY',
    'FUNCTIONAL DETAIL',
  ]);

  let bestRoute: TechniqueRoute | null = null;
  let bestScore = 0;

  for (const route of TECHNIQUE_ROUTES) {
    let score = 0;

    // Signal 1: keyword match
    const allKeywordsMatch = route.claimKeywords.every((kw) => lower.includes(kw));
    if (allKeywordsMatch) score += 1;

    // Signal 2: dimension match (when both sides have dimensions)
    if (route.dimensions && dimensions && dimensions.length > 0) {
      const hasOverlap = route.dimensions.some((d) => dimensions.includes(d));
      if (hasOverlap) score += 1;
    }

    // Signal 3: teaching mode matches technique's typical mode
    if (teachingMode) {
      const expectsAction = ACTION_MODE_TECHNIQUES.has(route.technique);
      if ((expectsAction && teachingMode === 'action') ||
          (!expectsAction && teachingMode !== 'action')) {
        score += 1;
      }
    }

    if (score >= 2 && score > bestScore) {
      bestRoute = route;
      bestScore = score;
    }
  }

  return bestRoute?.technique ?? null;
}
```

Edit `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts` — add the post-processing step. In `generateAnnotations()`, after the grounding diagnostic loop (around line 396) and BEFORE `extractEssayLevelAnnotations`, add:

```typescript
    // ── Scope 1 GAP-9: Transferable principle post-call tagger (multi-signal) ──
    try {
      const { matchAnnotationToTechnique } = await import('../coaching/techniqueMatcher');
      for (const pa of paragraphAnnotations) {
        for (const ann of pa.annotations) {
          // Multi-signal match: requires ≥2 of {keyword, dimension, mode}
          const technique = matchAnnotationToTechnique(
            ann.content,
            ann.capacityBuildingNote,
            (ann as unknown as { dimensions?: string[] }).dimensions ?? null,
            ann.teachingMode ?? null,
          );
          if (technique) {
            ann.transferablePrinciple = technique;
          }
          // Else: leave null. Single-signal matches are rejected (false-positive control).
        }
      }
    } catch (error) {
      // Non-fatal — transferablePrinciple is a label, not load-bearing
      console.warn('[L5] Technique tagging failed:', error instanceof Error ? error.message : error);
    }

    // ── Extract essay-level annotations ──
    const essayLevelAnnotations = this.extractEssayLevelAnnotations(paragraphAnnotations, phase);
```

The field is already defined on `L5Annotation` and `RawAnnotation` (GAP-5 bundle) and initialized to `null` in `validateAnnotations()` (GAP-5 bundle). The post-call tagger populates it when matches exist.

NO L5 system prompt changes. NO vocabulary list in Block 1. The LLM never sees the technique names directly — this is deterministic post-processing.

**Integration points**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/techniqueMatcher.ts` — NEW file, ~50 LOC pure utility extracting keyword routing from the two existing copies in `coachingService.ts:4494-4506` and `analysisOrchestrator.ts:1639-1664`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/deepAnnotationService.ts:~398` — post-call tagger loop
- Field already added in GAP-5 bundle.

**Cost**:
- LLM cost: ZERO (pure post-processing).
- The routing imports and runs in <1ms per annotation.
- **Total: 0 tokens**. **$0 per essay**. Quality gain: ~50-60% of annotations carry a named technique vocabulary; students accumulate transferable craft vocabulary.

**Source**: rethink — post-call deterministic tagger, reusing the keyword routing pattern that already exists in two places in the codebase.

---

## Cost Summary

| Gap | Output token delta | Input token delta | $/essay delta |
|-----|-------------------:|-------------------:|---------------:|
| 1 L3 voiceAlignment + rhythm enum | -1,250 to -2,975 | 0 | -$0.019 to -$0.045 |
| 2 L3.75 compress + gate | -390 to -820 | 0 | -$0.006 to -$0.012 |
| 3 L3.5 evidence caps + anchor fix | -1,300 to -2,600 | -90 (cache) | -$0.020 to -$0.039 |
| 4 L4 compress + activate | -490 to -880 | +40 (cache) | -$0.007 to -$0.013 |
| 5 L5 stakes + archetypeContext | +150 to +375 | +40-80 (cache) | +$0.002 to +$0.006 |
| 6 L5 rewrite enrichment | +150 to +250 | +300-900 (non-cache per batch) | +$0.002 to +$0.005 |
| 7 L5 wordEconomyCut | +75 to +125 | +60-180 (non-cache) | +$0.001 to +$0.002 |
| 8 L5 antiPatternExample | +20 to +40 | 0 (shared w/ GAP-6) | +$0.0003 to +$0.0006 |
| 9 L5 transferablePrinciple | 0 | 0 | $0 |
| **TOTAL** | **-3,035 to -6,485** | **+310-1,130 non-cache input** | **-$0.047 to -$0.096 per essay** |

Range assumes typical 7-paragraph 650-word essay. Output tokens dominate the cost (Sonnet output is $15/M vs input $3/M). Savings concentrate in L3 (sentence-level waste), L3.5 (evidence strings), and L4 (compressed coaching signals). GAP-5/6/7/8 add net cost but unlock measurable quality improvements. GAP-9 is free.

**Quality gains not captured in the cost table**:
- `rhythm` at sentence level becomes a structured enum (searchable, queryable).
- L3.5 anchor re-injection gains clean sentence boundaries instead of mid-word cuts.
- L4 score tensions and emergent patterns become LIVE coaching signals instead of logged-and-discarded waste.
- Every L5 growth/teaching annotation carries AO-framed stakes grounded in essay archetype.
- ACTION mode rewrite coverage jumps from ~30-50% to ~80-95%.
- Every cliché annotation quotes the exact 5-12 word anti-pattern.
- ~50-60% of annotations carry a named technique principle the student can search/remember.
- Polish/Distinction phase wordiness surfaces as structured cut suggestions.

---

## Infrastructure Leveraged (existing code reused)

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/teachingContentRouter.ts:198-247` — `detectTellingPhrases(essayText, maxMatches)` — zero-cost pattern detection from `TELLING_PHRASE_PATTERNS` (39 patterns) assembled with `TRANSFORMATION_EXAMPLES` scaffolds. Already lazy-loaded and cached.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/data/transformationExamples.ts:82-542` — `TRANSFORMATION_EXAMPLES` (14 before/after pairs) + `TELLING_PHRASE_PATTERNS` (39 patterns across 6 categories). Source of GAP-6 rewrite scaffolds and GAP-8 anti-pattern matches.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts:104-232` — `TECHNIQUE_ROUTES` (20 techniques). Source for GAP-9 shared matcher.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/analysisOrchestrator.ts:1639-1664` — `matchClaimToTechnique` (private). Pattern for the new shared `techniqueMatcher.ts`.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2380-2407` — `ImprovementEntry` — established schema mirror for `stakes`, `technique`, `demonstration`, `wordEconomyCut`. L5 annotation additions follow the same field shapes.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:921` — `admissionsPositioning.archetypeContext` — already generated by L3.75 at `holisticSynthesis.ts:1470-1485`, currently orphaned (only read by `renderAnalysisForStudent.ts` and a coaching saturation warning). GAP-5 wires it into L5 context.
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/readinessScoring.ts:107-108` — the `observations[].length > 0` check that constrains GAP-2's observation cap floor (cannot go below 1).

---

## Rejected Approaches

- **Full removal of `craft.rhythm`**: Rejected. Verified at `deepAnnotationService.ts:910` that rhythm is read as a label in the L5 sentence detail block during craft/polish/distinction phases. Converted to enum instead.
- **Cap on `effectivenessReasoning` generation**: Rejected. Verified that (a) the scoring prompt at `analysisPass.ts:358-374` explicitly requires full chain-of-thought reasoning ("AFTER reasoning, not before"), and (b) the full reasoning text is consumed at `coachingService.ts:2355` as `activeConcerns.concern` in the coaching LLM prompt. Capping generation would silently degrade both L3.5 scoring accuracy and coaching quality. Fixed at consumption site (anchor re-injection) instead.
- **Full removal of `emotionalProgression[]`**: Rejected. Verified at `analysisContextBuilder.ts:248-264` that this array is substantively consumed to provide per-paragraph emotional context (`prevEmotion`, `hereEmotion`, `nextEmotion`) to both L3.5 and L5. Kept as-is.
- **Full removal of `coachingMap.emergentPatterns` and `scoreTensions`**: Rejected in favor of compress-and-activate. These fields were fully dead (only `.length > 0` logging at `crystallizer.ts:2101-2102`) but carry real coaching signal at the compressed scale. Wired into L5 `sharedContext` as single-line hooks.
- **Injecting TECHNIQUE_ROUTES vocabulary into L5 Block 1 (cached)**: Rejected. Would bloat Block 1 by ~400 tokens for semantic matching the LLM can do but with drift risk (applying `VOICE COMPARISON` when the annotation is about voice consistency). Post-call deterministic keyword matching is more consistent.
- **Full LLM generation of `wordEconomyCut` without pre-call diagnostics**: Rejected. Filler-pattern detection is a computation problem, not a judgment problem. Pre-call diagnostics give the LLM the signals; the LLM still makes the semantic cut decision.
- **Skipping `wordEconomyCut` field and using only pre-call diagnostics**: Rejected. The cut decision requires knowing which sentence the rewrite renders redundant — that's a semantic judgment the LLM is better positioned to make than a pattern matcher.

### OPEN DECISIONS (items that need human input)

- **L3.75 `codeSwitching[]` backward compatibility duration**: The type is made optional with `@deprecated`, and validator/mutator sites get `?? []` guards. Should we schedule a follow-up migration that removes the optional field entirely once all stored profiles have been reprocessed? No blocker for Scope 1 — all existing profiles continue to work with empty arrays.
- **`techniqueMatcher.ts` consolidation**: The file duplicates the 20-route list already in `coachingService.ts:104-232`. A follow-up refactor could have `coachingService` import from `techniqueMatcher` (reverse the dependency). Not in scope for Scope 1 — would touch the coaching service API. For now, the new file MUST be kept in sync with `coachingService.ts` (documented in the new file's header).
- **`matchAnnotationToTechnique` dimension filtering**: The coachingService's `matchFindingToTechnique` applies dimension filters for routes like `VOICE COMPARISON` (requires `dimensions: ['voice']`). L5 annotations don't carry a dimension tag, so the shared matcher ignores the dimension filter — this may produce some false-positive routes. Not a blocker; the field is a label, not a gate. If false-positive rate is high after E2E validation, we can thread L5 annotation type → dimension mapping as a follow-up.

---

## Verification Plan

1. **Type check**: `npx tsc --noEmit` must pass. Key sites to watch: `SentenceCraft.voiceAlignment` becoming optional (check all 5 initializer sites), `VoiceMap.codeSwitching` becoming optional (check voiceMapMutator + validator), `CoachingMap.emergentPatterns` and `scoreTensions` changing to `string[]`, L5Annotation gaining four new fields.
2. **Unit-level sanity**: run existing tests that exercise these layers:
   - `ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-conversator-v2-e2e.ts` (touches L5 annotations)
   - Any `tests/test-*walk*.ts` or `tests/test-*analysis*.ts` present
   - `npx tsc --noEmit` at every intermediate step (after GAP-1, after GAP-2, etc.) to catch type regressions early
3. **Full E2E pipeline on a sample essay**: run the comprehensive E2E that exercises L1 → L5 on a known-good essay and inspect:
   - **L3 output**: confirm `craft.rhythm` is an enum tag, not prose, on pivotal sentences; confirm no `voiceAlignment` field in the raw output.
   - **L3.75 output**: confirm `codeSwitching` is empty or absent; confirm `voiceMap.*.observations[]` arrays have ≤2 entries each; confirm `showVsTell[]` has ≤4 entries; confirm `authenticityAssessment` is ≤1 sentence.
   - **L3.5 anchor context**: confirm the anchor re-injection lines are whole sentences, not mid-word cuts; confirm `strengths[].evidence` and `strengthSignatures[].evidence` are ≤10 words; confirm `effectivenessReasoning` is UNCHANGED (still full prose).
   - **L4 coachingMap**: confirm `emergentPatterns` and `scoreTensions` are `string[]` (not object arrays), max 3 items each, each ≤20 words; confirm L5 sharedContext includes an `EMERGENT PATTERNS` block, `SCORE TENSIONS` block, and `CROSS-PARAGRAPH PATTERNS` block when populated.
   - **L5 annotations**: spot-check 10 annotations — for each, confirm `stakes` is populated for growth/teaching annotations and references the archetype when present; confirm `rewriteExample` is non-null for all ACTION-mode annotations; confirm `wordEconomyCut` is populated for Polish/Distinction ACTION annotations with additive rewrites; confirm `antiPatternExample` is populated on cliché annotations and matches detected phrases when available; confirm `transferablePrinciple` is populated on ~50%+ of annotations.
4. **Coverage metrics** (compute from E2E output): print counts for:
   - ACTION annotations with null `rewriteExample` (target: 0)
   - Growth annotations with `antiPatternExample` (target: >= 50% when detected phrases exist)
   - Annotations with `transferablePrinciple` (target: 40-60%)
   - Annotations with `stakes` (target: 70-90% of non-pure-strength annotations)
5. **Cost comparison**: run cost tracker on the same essay pre/post changes. Expected: output tokens drop by 3,000-6,000; input tokens grow slightly due to Block 3 enrichment. Total cost drop: $0.05-0.09 per essay.
6. **Backward compat check**: load a previously stored `EssayProfile` from the database (or a fixture) that has `voiceAlignment`, non-empty `codeSwitching`, and object-array `emergentPatterns` / `scoreTensions`. Confirm the profile loads without errors and the legacy fields are either parsed as strings (GAP-4 migration) or passed through unchanged (GAP-1, GAP-2 optional fields — the reader uses optional chaining so the now-undefined values flow through without impacting logic).
7. **Coaching loop smoke test**: run a coaching conversation and confirm that (a) `activeConcerns` still renders full `effectivenessReasoning` text (GAP-3 did not degrade this), (b) the coaching prompt surfaces `stakes` / `wordEconomyCut` / `technique` from the improvement manifest as before, (c) L5 annotation fields `stakes` / `transferablePrinciple` are available via the annotation renderer (if any downstream coaching consumer reads L5 annotations directly — this is a forward hook for follow-up scopes).
