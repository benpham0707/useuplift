# Unified Execution Plan: Essay Intelligence Pipeline Cleanup (Scopes 1-3)

After this ships, the Essay Intelligence pipeline (L1 → L2 → L2.5 → L3 → L3.75 → L3.5 → L4 → L5) drops ~3,000-6,500 output tokens of dead description per essay (Scope 1), every analysis layer emits structured `ImprovementCandidate` entries inline that L4 consolidates and L5 materializes with a required `rewriteExample` (Scope 2), and every finalized improvement is late-bound at coaching session init with a research-backed before/after from the 75-transformation knowledge base plus college-specific tailoring (Scope 3). Net cost delta per essay: **−$0.029 to −$0.066** (savings from Scope 1's dead-field compression outweigh Scope 2's +$0.018-0.030 candidate emission; Scope 3 is free). The system moves from 170:1 description-to-prescription ratio to a prescriptive pipeline where `technique` is non-null on ≥80% of manifest items (current: 0%) and `demonstration` is non-null on ≥70% (current: hardcoded null).

**Transformation source clarification (R1 verification)**: The 75 transformations live in `src/services/commonAppWorkshop/services/researchBackedTeachingService.ts` → `TEACHING_KNOWLEDGE_BASE` as nested `transformations[]` arrays under each of 26 issue types (24 × 3 + 1 × 2 + 1 × 1 = 75). The separate flat `src/services/commonAppWorkshop/data/transformationExamples.ts` file has only 14 entries and is NOT the source Scope 3 uses. Earlier plan drafts said "79" — corrected to 75 per main-thread verification.

---

## Operating Doctrine: Fail-Fast, No Silent Degradation

This plan operates under a strict fail-fast doctrine that every item MUST respect:

1. **No retry loops on guaranteed failures.** If an LLM call returns malformed JSON, do not blind-retry. Diagnose or surface the error. The existing `llm/claude.ts` transient-error retries are fine; new code does not add its own retry layer on top.
2. **No silent fallbacks to lesser output.** If the new inline candidate projection produces zero items on a fresh analysis, **throw `PipelineError`** naming which upstream layer under-emitted. Do not silently invoke the legacy `buildImprovementManifest()` scraper — that scraper produces LESSER output (retroactive keyword matching instead of lineage-preserving projection) and the whole point of Scope 2 is to replace it. The scraper may remain physically in the source tree (no deletion needed), but it is NEVER wired as an automatic fallback.
3. **Pre-existing profiles are handled by explicit signal, not silent reconstruction.** Old persisted profiles with an empty `improvementCandidateSnapshot` surface `requiresReanalysis: true` on the profile. Callers (coaching service, UI) handle the signal by re-running analysis — they do NOT silently fall back to the scraper.
4. **Missing-data is not failure.** Scope 3's research-enrichment "fail-open" pattern (skip population if the `ROUTE_TO_ISSUE_TYPE` lookup misses) is legitimate — the research DB covers 26 issue types and some candidates may not match. A missing enrichment is not a degraded output; an unmatched item simply ships without the optional `researchBacking`/`collegeNote` fields. This is distinct from "silently substituting a different code path" which is forbidden.
5. **All errors surface with diagnostic context.** Every thrown error must name the layer, the inputs, and the expected output shape — so the caller can debug without bisecting prompts.

---

## Cross-Scope Consistency Audit

### Shared types (reconciled canonical definitions)

#### `ImprovementEntry` (profileTypes.ts:2380)

This is the existing type; all three scopes extend it. The baseline (unchanged) is:

```typescript
export interface ImprovementEntry {
  id: string;
  paragraph: number;
  observation: string;
  action: string;
  stakes: string;
  technique: string | null;          // Scope 2 populates from LLM; Scope 3 uses as lookup key
  demonstration: string | null;      // Scope 2 populates from L5 backfill; Scope 3 fills when null
  wordEconomyCut: string | null;
  source: 'l4_priority' | 'l35_finding' | 'l375_growth_edge' | 'l3_observation' | 'l5_annotation' | 'red_flag' | 'ao_first_read';
  sourceRef: string | null;
  priority: number;
  impact: 'transformative' | 'significant' | 'incremental';
  conversatorEnrichments: string[];
}
```

**Additions (all optional, strictly additive)**:

| Field | Added by | Read by | Notes |
|---|---|---|---|
| `researchBacking?: { principle; whyItWorks; sourceRef; citationId? } \| null` | Scope 3 item 6 | Scope 3 item 3 (`principleLine` in `buildImprovementQueueSection`) | Populated at coaching session init from `TEACHING_KNOWLEDGE_BASE` |
| `collegeNote?: string \| null` | Scope 3 item 6 | Scope 3 item 3 (`collegeNoteLine`) | Populated only when `collegeId` present |

Scopes 1 and 2 do NOT modify `ImprovementEntry`. Scope 2 extends `CoachingMap.priorities[]` (where the manifest entries are sourced from) but not the entry type itself.

#### `ImprovementCandidate` (NEW, Scope 2 only)

Scope 2 item Core Types introduces a new type distinct from `ImprovementEntry`. Canonical definition:

```typescript
export interface ImprovementCandidate {
  id: string;                       // CAND_L3_P2S4_a3f7
  sourceLayer: 'L3' | 'L3.5' | 'L3.75';
  paragraph: number;
  sentence: number | null;
  sourceFindingId: string | null;
  observation: string;
  suggestedChange: string;
  technique: string | null;         // from TECHNIQUE_VOCABULARY_LIST or null
  demonstrationSketch: string | null;
  coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic';
  lifecycleState: 'candidate' | 'consolidated' | 'superseded' | 'finalized';
  supersededBy: string | null;
  createdAt: string;
}
```

Scope 3 never reads this type directly — it reads only the finalized `ImprovementEntry` in the manifest. Scope 1 does not touch it. **No cross-scope type conflict.**

#### `ImprovementManifest` (profileTypes.ts:2417)

Baseline unchanged by Scope 1 and Scope 2. Scope 3 adds one optional field:

| Field | Added by | Purpose |
|---|---|---|
| `_enriched?: boolean` | Scope 3 item 6 | Idempotency flag for `enrichWithResearchDatabase()` |

Scope 2 item 8 rewrites the `buildImprovementManifest()` BODY (source of manifest items shifts from scraper to projection) but does not change the manifest TYPE itself. **No conflict.**

#### `CoachingMap` (profileTypes.ts:1934)

**This is the single largest coordination point between Scope 1 and Scope 2.** Both scopes touch this type.

Scope 1 item 4 changes:
- `emergentPatterns: Array<{ pattern; evidence; implication }>` → `emergentPatterns: string[]` (max 3 items, ≤20 words each)
- `scoreTensions: Array<{ paragraph; tension; interpretation; coachingImplication }>` → `scoreTensions: string[]`

Scope 2 item 5 / item Core Types changes `priorities[]` shape:
- Adds `consolidatedFrom: string[]` — candidate IDs the priority absorbed
- Adds `technique: string | null` — inherited from consolidated candidates
- Adds `demonstrationSketch: string | null` — best sketch from consolidated candidates

**Scope 2 explicitly respects Scope 1's compression.** Scope 2's core-types definition comments (FORGE_PLAN_SCOPE2.md:239-243):

> `// NOTE (Scope 1 coordination): emergentPatterns and scoreTensions are compressed`
> `// to string[] in Scope 1. Scope 2 does not reintroduce the object shape.`
> `emergentPatterns: string[];`
> `scoreTensions: string[];`

**Unified canonical `CoachingMap`** (merging both scopes):

```typescript
export interface CoachingMap {
  transformativeInsight: {
    insight: string;
    evidenceLocations: Array<{ paragraph: number; sentence?: number }>;
    whyThisTransforms: string;
    requiresStudentAwareness: boolean;
  };
  priorities: Array<{
    priority: string;
    target: { paragraphs: number[]; description: string };
    architecturalReason: string;
    unlocksNext: string;
    expectedImpact: 'transformative' | 'significant' | 'incremental';
    // Scope 2 additions:
    consolidatedFrom: string[];
    technique: string | null;
    demonstrationSketch: string | null;
  }>;
  protectedStrengths: Array<{
    description: string;
    locations: Array<{ paragraph: number; sentence?: number }>;
    whyProtect: string;
  }>;
  // Scope 1 compression (Scope 2 respects):
  emergentPatterns: string[];
  scoreTensions: string[];
}
```

**Status: reconciled, no open conflict.** Execution order must ensure Scope 1's type change lands BEFORE Scope 2 parses L4 output (otherwise Scope 2's L4b schema reads `string[]` but the type still defines `Array<{...}>`).

#### `SentenceCraft` (profileTypes.ts:404)

Scope 1 item 1 changes:
- `rhythm: string` → `rhythm: RhythmTag` (closed enum)
- `voiceAlignment: string` → `voiceAlignment?: string` (optional, `@deprecated`)

Scope 2 item 1 verifies compatibility (FORGE_PLAN_SCOPE2.md:2180-2184):
> `1. craft.rhythm becomes enum tag — Scope 2 does not modify SentenceCraft. No conflict.`
> `2. craft.voiceAlignment removed — Scope 2 does not reference this field. No conflict.`

Scope 3 does not touch sentence-level types. **No conflict.**

#### `SentenceUnderstanding` (profileTypes.ts:347) and `SentenceAnalysis` (profileTypes.ts:418)

Scope 2 items 3-4 add optional `improvementCandidate?: ImprovementCandidate | null` to both. Scope 1 does not modify these interfaces. Scope 3 does not read them. **No conflict.**

#### `CraftAssessment.growthEdges` (profileTypes.ts:854)

Scope 2 item 5 adds optional `pairedImprovement?: { technique; directive; architecturalReason; demonstrationSketch; expectedImpact } | null` to each edge. Scope 1 item 2 compresses the ENCLOSING L3.75 synthesis (voiceMap observations, showVsTell, authenticityAssessment, codeSwitching) but does NOT touch `craftAssessment.growthEdges`. **No conflict.**

#### `L5Annotation` (deepAnnotationService.ts:117)

**Both Scope 1 and Scope 2 extend this interface.** This is the second-largest coordination point.

Scope 1 item 5 (bundled with GAP-6/7/8/9) adds four fields:
- `stakes: string | null` — AO-framed phenomenological impact
- `wordEconomyCut: string | null` — cut suggestion for additive rewrites
- `antiPatternExample: string | null` — exact clichéd phrase quote
- `transferablePrinciple: string | null` — named technique from matcher

Scope 2 item 7 adds one field:
- `consolidatedTargetIndex?: number` — backlink to the materialized L4 priority

**All five additions are orthogonal.** Field names do not collide; semantic purposes do not overlap. Unified `L5Annotation` fields after both scopes:

```typescript
export interface L5Annotation {
  // ... existing fields (id, location, type, teachingIntent, teachingMode, content,
  //     teachingRationale, northStarConnection, priority, phase, rewriteExample,
  //     confidence, crossParagraphRefs, capacityBuildingNote) ...

  // Scope 1 GAP-5 bundle:
  stakes: string | null;
  wordEconomyCut: string | null;
  antiPatternExample: string | null;
  transferablePrinciple: string | null;

  // Scope 2 item 7:
  consolidatedTargetIndex?: number;
}
```

**Status: reconciled, no conflict.** Both scopes modify `validateAnnotations()` to extract their fields — see "Shared file edits" below.

#### `VoiceMap.codeSwitching` (profileTypes.ts:569-592)

Scope 1 item 2 converts from `CodeSwitchEvent[]` to `codeSwitching?: CodeSwitchEvent[]` (optional, `@deprecated`). No other scope touches this. **No conflict.**

---

### Shared file edits

Table of files touched by multiple scopes, with per-scope edits and the merge strategy.

| File | Scope 1 edits | Scope 2 edits | Scope 3 edits | Merge strategy |
|---|---|---|---|---|
| `profileTypes.ts` | `SentenceCraft` (rhythm enum + drop voiceAlignment), `VoiceMap.codeSwitching?`, `CoachingMap.emergentPatterns/scoreTensions: string[]` | Add `ImprovementCandidate` types, extend `CoachingMap.priorities[]` with 3 fields, extend `SentenceUnderstanding`/`SentenceAnalysis`/`CraftAssessment.growthEdges` with optional candidate fields, add `improvementCandidateSnapshot?` to `EssayProfile` | Add `researchBacking?`/`collegeNote?` to `ImprovementEntry`, add `_enriched?` to `ImprovementManifest` | Land Scope 1 first (CoachingMap shape change), then Scope 2 (adds `priorities[]` sub-fields to the already-compressed `CoachingMap`), then Scope 3 (pure additive extension of untouched `ImprovementEntry`). All edits are to distinct fields/interfaces within the file — no line-level collision. |
| `crystallizer.ts` | Lines 306-307, 500-501 (crossParagraphPatterns brevity); lines 587-607 (L4b prompt + schema: emergentPatterns/scoreTensions as string[]); lines 1317-1345 (extend `buildCoachingMap()` at line 1269 to ACCEPT both the old object shape AND the new string[] shape for `emergentPatterns`/`scoreTensions` — current implementation only parses the object shape, so Scope 1 INTRODUCES backward-compat parsing, it does NOT modify an existing flattener) | Line 529 (`buildSystemPromptL4b` preamble rewrite: Interpreter → Consolidator); line 823 (`buildCallInstructionL4b` adds `candidateContextBlock` param + inject as user turn); line 1912 (`crystallize()` adds `candidateContextBlock?` param); line 2049 (thread into call instruction); `buildCoachingMap()` parser adds `consolidatedFrom`/`technique`/`demonstrationSketch` parsing | None | **Both scopes touch L4b prompt + parser.** Land Scope 1 first — it compresses `emergentPatterns`/`scoreTensions` to string arrays. Then Scope 2's preamble rewrite and consolidator instructions are ADDITIVE to the compressed prompt (no overlap with the string compression). Scope 2's parser additions target `priorities[]` item fields, not `emergentPatterns`/`scoreTensions` — so the two `buildCoachingMap()` edits touch adjacent but non-overlapping parse branches. |
| `deepAnnotationService.ts` | Lines 117-201 (`L5Annotation` adds `stakes`, `wordEconomyCut`, `antiPatternExample`, `transferablePrinciple`); lines 241-257 (`RawAnnotation` adds same); lines 594-595 (rewriteExample instructions: remove "null beats generic", require for ACTION mode, add REWRITE SCAFFOLDS instruction); ~line 595 (add WORD ECONOMY, ANTI-PATTERN, AO STAKES GROUNDING sections); lines 624-651 (JSON schema extension); lines 711-748 (sharedContext: EMERGENT PATTERNS / SCORE TENSIONS / CROSS-PARAGRAPH PATTERNS blocks); lines 1084-1090 (`renderHolisticContext` surfaces `archetypeContext`); ~line 20 (import `buildPreCallEnrichment`); ~line 320-340 (annotateParagraph calls `buildPreCallEnrichment`); line 792 (`buildParagraphPrompt` signature adds `enrichment?`); ~line 953 (inject enrichment); ~line 398 (post-call `techniqueMatcher` tagger loop); lines 1493-1524 (validateAnnotations extracts four Scope 1 fields) | Line 117 (`L5Annotation` adds `consolidatedTargetIndex?`); line 281 (`generateAnnotations` adds two new params: `consolidatedTargetsByParagraph`, `candidateStore`); line 531 (`buildSystemPrompt` adds "SCOPE 2 — MATERIALIZATION MODE" section); line 792 (`buildParagraphPrompt` signature adds `consolidatedTargets?` — must merge with Scope 1's `enrichment?` param); ~line 1510 (raw annotation parser parses `consolidatedTargetIndex`); new `ConsolidatedTarget` type export | None | **Highest-friction file.** Both scopes: (a) extend `L5Annotation`/`RawAnnotation` with optional fields (orthogonal, compose), (b) extend `buildParagraphPrompt` signature (must combine to `(para, profile, northStar, phase, phaseGuidance, findingStore?, priorAnnotationCtx?, enrichment?, consolidatedTargets?)`), (c) add new sections to `buildSystemPrompt` (Scope 1's WORD ECONOMY / ANTI-PATTERN / AO STAKES / REWRITE SCAFFOLDS; Scope 2's MATERIALIZATION MODE — all orthogonal textual additions), (d) extend `validateAnnotations()` to extract their fields (Scope 1: four fields; Scope 2: one field — append Scope 2's extraction after Scope 1's). **Rule:** Scope 1 lands first; Scope 2 merges on top, combining parameters and appending prompt sections. Both scopes' prompt token budgets must be re-checked together (see Risk register). |
| `analysisOrchestrator.ts` | None | Line 429 (harvest L3 candidates after walk apply); line 472 (harvest L3.75 pairedImprovement candidates); line 568 (pass `coordinator.getImprovementCandidateContextBlock()` to `crystallize`); ~line 580 (post-L4 `applyConsolidation` call); line 714 (build `consolidatedTargetsByParagraph`, pass to `generateAnnotations`, pass `candidateStore`); ~line 733 (mark finalized candidates after L5); line 752 (rebuild `buildImprovementManifest` caller with candidate store + l5Result); lines 1414-1664 (replace `buildImprovementManifest()` with projection, **delete** `matchClaimToTechnique()`) | None | Scope 2 is the only scope editing this file. No merge conflict. **Scope 1 note:** Scope 1 GAP-4's wiring of `emergentPatterns`/`scoreTensions` into L5 sharedContext happens in `deepAnnotationService.ts:711-748`, NOT in `analysisOrchestrator.ts` — so no overlap. |
| `sequentialDeepWalk.ts` | Lines 325-328 (drop voiceAlignment from schema, convert rhythm to enum); lines 1135-1145 (`parseSentenceCraft`); line 1730 (default init) | Lines 155-409 (convert `SYSTEM_PROMPT` const → `buildSystemPrompt()` function injecting `TECHNIQUE_VOCABULARY_PROMPT_BLOCK`); line 318 (schema: add `improvementCandidate`); line 395 (insert IMPROVEMENT CANDIDATE EMISSION prose); line 415 (use `buildSystemPrompt()`); line 922 (`parseWalkOutput` threads `pIdx`); line 1036 (`parseSentenceUnderstandings` accepts paragraph index); line 1076 (`parseSentenceUnderstanding` parses `improvementCandidate`) | None | **Both scopes touch the L3 walk prompt and parser.** Scope 1's schema edits (lines 325-328) touch `craft` block; Scope 2's schema edits (line 318) touch `sentenceUnderstandings[]` item top-level. Non-overlapping inside the JSON schema. Scope 1's parser edits target `parseSentenceCraft()`; Scope 2's target `parseSentenceUnderstanding()` (the caller). Non-overlapping. **Rule:** Scope 1 lands first; Scope 2's `buildSystemPrompt()` conversion and candidate field addition merge on top of the already-compressed craft schema. |
| `holisticSynthesis.ts` | Lines 299-368 (voiceMap schema: cap observations[], remove codeSwitching); lines 387-394 (emotionalTopography: cap showVsTell[], compress authenticityAssessment); line 1155 (codeSwitching parser guard) | Lines 629-632 (replace "Do NOT label them as weaknesses" with pairedImprovement guidance); line 532 (craftPatterns output schema adds `pairedImprovement`); line 1435 (`coerceCraftAssessment` parses `pairedImprovement`) | None | **Both scopes touch the L3.75 system prompt and coercers.** Scope 1 edits `voiceMap` / `emotionalTopography` sections; Scope 2 edits the `craftAssessment.craftPatterns` / `growthEdges` section. No line-level overlap. **Rule:** Scope 1 first, Scope 2 merges on adjacent sections. |
| `analysisPass.ts` | ~line 180 (new `extractFirstSentence` helper); lines 193-245 (`buildAnchorContext()` uses first-sentence extraction; specific edit points at 212-213 for 120-char cap and 227/229 for 150-char cap); lines 470-474, 490 (evidence length caps in prompt schema; effectivenessReasoning UNCHANGED) | Line 306 (`buildSystemPrompt` inserts IMPROVEMENT CANDIDATE section + `TECHNIQUE_VOCABULARY_PROMPT_BLOCK` substitution); line 458 (output schema adds `improvementCandidate`); line 1091 (`validateAndTransform` parses candidate); new `parseImprovementCandidate` helper; line 1284-1323 **REMOVE** essay-level degraded return (X11 fix) | None | **Both scopes touch the L3.5 system prompt and parser.** Scope 1 edits `strengths[].evidence`/`weaknesses[].evidence`/`strengthSignatures[].evidence` length caps; Scope 2 inserts a new IMPROVEMENT CANDIDATE section and extends the output schema with a new top-level `improvementCandidate` field. Non-overlapping. `effectivenessReasoning` is explicitly LOCKED (Scope 2 preserves it per Scope 1's decision, FORGE_PLAN_SCOPE2.md:2182). **Rule:** Scope 1 first, Scope 2 merges on top. |
| `profileManager/essayProfileManager.ts` | None | Line 916 (add `candidateStore` field); line 977 (initialize in constructor from snapshot); line 2140 (add 5 new methods: `addImprovementCandidates`, `getImprovementCandidateStore`, `getImprovementCandidates`, `getImprovementCandidateContextBlock`, `applyConsolidation`, `markImprovementsFinalized`); line 1540 (propagate `improvementCandidate` through sentence mutator and harvest into store); line 766 (keep `codeSwitching: []` initializer — Scope 1 coord) | None | Scope 2 is the primary editor. Scope 1's only interaction is the note at line 766 that the `codeSwitching: []` initializer stays even though the type is now optional. No conflict. |
| `profileManager/validation/intraDomainValidation.ts` | Line 264 (`?? []` guard on `codeSwitching`) | None | None | Scope 1 only. |
| `profileManager/mutators/voiceMapMutator.ts` | Lines 203, 210, 212, 361-368 (null guards on `codeSwitching`) | None | None | Scope 1 only. |
| `profileManager/mutators/sentenceMutator.ts` | Lines 65-75, 155-158 (drop `voiceAlignment` write branch) | Accepts `improvementCandidate` through the `Partial<SentenceAnalysis>` object (no signature change needed) | None | **Both scopes touch the mutator.** Scope 1 removes the `voiceAlignment` write branch entirely; Scope 2 relies on the existing `Partial<SentenceAnalysis>` pattern to pass through the new optional `improvementCandidate` field with zero edits. No line-level collision. |
| `focusedAnalyzer.ts` | Line 1338 (drop `voiceAlignment` from default init) | None | None | Scope 1 only. |
| `fullContextReReader.ts` | Lines 122-126 (schema), 544-548 (fallback), 605-612 (`coerceSentenceCraft`) — all drop `voiceAlignment` | None | None | Scope 1 only. |
| `coaching/teachingContentRouter.ts` | Read-only access via `detectTellingPhrases(essayText, maxMatches)` — no edits | None | None | Scope 1 leverages existing infrastructure. |
| `coaching/coachingService.ts` | None | None | Line 849 (insert 9-line enrichment hook in `processCoachingTurn()`); line 4149 (add `collegeNoteLine` + `principleLine` consts); line 4167 (append to return string) | Scope 3 only. |
| `coaching/collegeOverlay.ts` | None | None | Line 189 (append ELITE TEACHING PATTERNS section when `research.eliteExamples.length > 0`) | Scope 3 only. |
| **NEW FILES** | `analysis/preCallEnrichment.ts`, `coaching/techniqueMatcher.ts` | `improvements/improvementCandidateStore.ts`, `improvements/index.ts`, `analysis/techniqueVocabulary.ts` | `analysis/researchEnrichment.ts` | No collisions — each scope adds its own files. Note that Scope 1's `techniqueMatcher.ts` and Scope 2's `techniqueVocabulary.ts` serve different purposes (matcher: post-call keyword tagger, in `coaching/`; vocabulary: pre-call prompt block, in `analysis/`). Both are new; neither depends on the other. |

### Shared prompt edits

Same information, reorganized by LLM prompt instead of by file.

| Prompt | Scope 1 edits | Scope 2 edits | Scope 3 edits | Merge strategy |
|---|---|---|---|---|
| **L3 walk system prompt** (`sequentialDeepWalk.ts`) | Drop `voiceAlignment` field, convert `rhythm` to closed enum taxonomy | Wrap existing const in `buildSystemPrompt()` function that substitutes `{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}`; add `improvementCandidate` field to `sentenceUnderstandings[]` schema; insert IMPROVEMENT CANDIDATE EMISSION prose (~30 lines after existing output schema) | None | Scope 1's `craft` block compression is localized; Scope 2's additions are elsewhere in the same prompt. Both edits land in the same file but target different JSON blocks and different prose sections. |
| **L3.5 analysis pass system prompt** (`analysisPass.ts`) | Hard-cap `strengths[].evidence` / `weaknesses[].evidence` / `strengthSignatures[].evidence` at ≤10 words; **DO NOT** cap `effectivenessReasoning` (locked decision) | Insert IMPROVEMENT CANDIDATE section after `priorityForImprovement` description, before PRE-SCORING CALIBRATION; extend output schema with `improvementCandidate` field | None | Non-overlapping. Scope 1's edits are inline cap annotations inside existing schema fields; Scope 2 adds a new section + new schema field. |
| **L3.75 holistic synthesis system prompt (Phase A)** (`holisticSynthesis.ts`) | Cap `voiceMap.*.observations[]` to max 2 entries/dimension; REMOVE `codeSwitching[]` block entirely; cap `showVsTell[]` at max 4 entries; compress `authenticityAssessment` to one sentence (≤40 words) | Replace "Do NOT label them as weaknesses" in `craftAssessment.craftPatterns` guidance with pairedImprovement instructions; extend `craftPatterns[]` output schema with optional `pairedImprovement` object; inject `{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}` | None | Scope 1 touches `voiceMap` and `emotionalTopography`; Scope 2 touches `craftAssessment`. Non-overlapping. |
| **L4a score matrix prompt** (`crystallizer.ts` buildSystemPromptL4aScoreMatrix) | Add brevity cap to `crossParagraphPatterns` (max 3 items, ≤15 words) | None | None | Scope 1 only. |
| **L4b crystallizer prompt** (`crystallizer.ts` buildSystemPromptL4b + buildCallInstructionL4b) | Compress `emergentPatterns` from object array to `string[]` (max 3, ≤20 words), compress `scoreTensions` similarly (≤15 words) | Rewrite preamble from "Interpreter" to "Consolidator"; add three new fields to each `priorities[]` item in output schema (`consolidatedFrom`, `technique`, `demonstrationSketch`); inject `candidateContextBlock` as new user-turn block with consolidation instructions | None | **Both scopes rewrite the L4b prompt substantially.** Scope 1 rewrites the preamble/schema for `emergentPatterns`/`scoreTensions`; Scope 2 rewrites the preamble for the consolidator role and adds `priorities[]` item fields. These are NOT orthogonal — both redraft the same prompt preamble. **Merge strategy: Scope 2's preamble rewrite WINS for the overall framing ("You are the Consolidator..."), but MUST include Scope 1's compression instructions for `emergentPatterns`/`scoreTensions`.** In the unified prompt, the Consolidator preamble is followed by the four output sections, where outputs 4 (`emergentPatterns` and `scoreTensions`) use Scope 1's string[] format. FORGE_PLAN_SCOPE2.md explicitly calls this out at line 1379: `"4. emergentPatterns, scoreTensions: these are now string[] (per Scope 1). List the patterns and tensions as prose strings. Not object-structured."` — Scope 2 already accounts for Scope 1. |
| **L5 paragraph system prompt** (`deepAnnotationService.ts` buildSystemPrompt) | Remove "null beats generic" permission (line 594); make `rewriteExample` REQUIRED for ACTION mode (with mode-change escape hatch); add REWRITE SCAFFOLDS instruction block; add AO STAKES GROUNDING section; add WORD ECONOMY section; add ANTI-PATTERN EXAMPLE section; extend JSON schema with four new output fields (`stakes`, `wordEconomyCut`, `antiPatternExample`, `transferablePrinciple` — the last is post-call populated, so schema shows it as null placeholder) | Add SCOPE 2 — MATERIALIZATION MODE section (~30 lines); extend JSON schema with `consolidatedTargetIndex?` field | None | **Both scopes extend this prompt with new sections.** All additions are orthogonal. The combined L5 system prompt after both scopes includes: REWRITE EXAMPLES (Scope 1 hardened) → MATERIALIZATION MODE (Scope 2 new) → AO STAKES GROUNDING (Scope 1 new) → WORD ECONOMY (Scope 1 new) → ANTI-PATTERN EXAMPLE (Scope 1 new) → existing sections. **Token budget check required** — see Risk register. |
| **L5 paragraph user turn** (`buildParagraphPrompt`) | Inject pre-call enrichment block (REWRITE SCAFFOLDS + DETECTED ANTI-PATTERN PHRASES + WORD ECONOMY SIGNALS) before GENERATION INSTRUCTIONS | Inject CONSOLIDATED TARGETS FOR THIS PARAGRAPH block | None | Both additions are per-paragraph user-turn injections. Order them as: existing context → Scope 2's CONSOLIDATED TARGETS → Scope 1's pre-call enrichment → existing GENERATION INSTRUCTIONS. Token impact per paragraph: Scope 1 +50-150; Scope 2 +400; combined +450-550 per paragraph user turn. |
| **L5 sharedContext** (rendered once per essay, cached) | Inject EMERGENT PATTERNS / SCORE TENSIONS / CROSS-PARAGRAPH PATTERNS blocks from compressed L4 output; surface `archetypeContext` from L3.75 | None | None | Scope 1 only. |
| **Coaching prompt** (`coachingService.ts` buildImprovementQueueSection) | None | None | Add `collegeNoteLine` and `principleLine` to the CURRENT PRIORITY block | Scope 3 only. |
| **Coaching overlay** (`collegeOverlay.ts` getCollegeCoachingOverlay) | None | None | Append ELITE TEACHING PATTERNS section when research has populated eliteExamples | Scope 3 only. |

### Conflicts resolved

1. **`CoachingMap.emergentPatterns` / `scoreTensions` type shape** — Scope 1 changes them to `string[]`; Scope 2 explicitly preserves that shape (debates FORGE_PLAN_SCOPE2.md:2183-2184, types FORGE_PLAN_SCOPE2.md:239-243). **Resolution:** Land Scope 1's type change first so Scope 2's L4b output schema already has the correct target type. No code conflict.

2. **`L4b` system prompt preamble rewrite** — Both scopes rewrite the same preamble. **Resolution:** Scope 2's "Consolidator" framing wins for the overall role; Scope 1's compression instructions for `emergentPatterns`/`scoreTensions` are preserved as output 4 instructions inside the Scope 2 rewrite. FORGE_PLAN_SCOPE2.md line 1379 already bakes this in.

3. **`buildParagraphPrompt()` signature** — Scope 1 adds `enrichment?: PreCallEnrichment`; Scope 2 adds `consolidatedTargets?: ConsolidatedTarget[]`. **Resolution:** Final signature is `(para, profile, northStar, phase, phaseGuidance, findingStore?, priorAnnotationCtx?, enrichment?, consolidatedTargets?)`. Both scopes' call sites in `annotateParagraph` must be updated together.

4. **`L5Annotation` / `RawAnnotation` interface extensions** — Scope 1 adds 4 fields; Scope 2 adds 1 field. **Resolution:** All 5 fields coexist; no naming collision.

5. **`validateAnnotations()` extraction logic** — Both scopes add extraction blocks. **Resolution:** Append Scope 2's single-line extraction (`consolidatedTargetIndex`) after Scope 1's four-field extraction block inside the existing validator.

6. **L5 prompt token budget** — Scope 1 adds ~300-400 tokens to system prompt (four new sections) plus ~100-200 tokens per-paragraph user turn (enrichment); Scope 2 adds ~400 tokens to system prompt (MATERIALIZATION MODE) plus ~400 tokens per-paragraph user turn (CONSOLIDATED TARGETS). Combined system prompt growth: ~700-800 tokens. **Resolution:** Current L5 system prompt is ~6000 tokens per FORGE_PLAN_SCOPE2.md:2188 ("currently ~6000 tokens for the system prompt; we add ~400"). Scope 1 adds another ~400. Combined ~6800 tokens — still under typical 8K cached system prompt caps. **Verify in Phase 5.**

7. **`technique` vocabulary source of truth** — Scope 1 ships `techniqueMatcher.ts` with an embedded 20-route list (for post-call keyword matching). Scope 2 ships `techniqueVocabulary.ts` with an embedded 20-route list (for pre-call prompt injection). Both duplicate `coachingService.ts:104-232` TECHNIQUE_ROUTES. **Resolution:** Accept the three-way duplication for now; add a cross-validation unit test (`tests/test-technique-vocab-sync.ts`) that asserts all three lists stay in sync. Long-term consolidation is an Open Decision.

8. **`matchClaimToTechnique()` deletion vs preservation** — Scope 2 item 8 deletes it entirely; Scope 3 item 1 depends on the mapping the function produces (technique → IssueType). **Resolution:** Scope 3's `ROUTE_TO_ISSUE_TYPE` table in `researchEnrichment.ts` is an INDEPENDENT lookup table (not a call to `matchClaimToTechnique`). It maps `technique` strings that L4/L5 now produce via LLM emission → `IssueType` strings. No dependency on the deleted function. Verified: FORGE_PLAN_SCOPE3.md:155-170 embeds the mapping as a module-level const.

### Open conflicts

**None requiring human adjudication.** All detected conflicts have deterministic resolutions documented above. Two items carry residual risk that should be monitored during rollout:

- **L5 token budget**: combined prompt is ~6800 tokens. If real-world usage with all fields active pushes past 8K, we may need to trim one of Scope 1's four new sections (recommend starting with WORD ECONOMY which is conditional on Polish/Distinction phases only). Monitor during Phase 5 E2E validation.
- **Three-way TECHNIQUE_ROUTES duplication**: guaranteed to drift unless the sync test runs in CI. Flagged in Risk register.

---

## Net Cost and Quality Delta

### Cost table (per essay, Sonnet pricing)

| Scope | Output tokens Δ | Input tokens Δ | $/essay Δ |
|---|---:|---:|---:|
| Scope 1 (nine GAPs) | −3,035 to −6,485 | +310 to +1,130 non-cache | **−$0.047 to −$0.096** |
| Scope 2 (eight items) | +1,200 net | +4,240 (900 L4b uncached + 2800 L5 uncached + 540 L3/L3.5/L3.75 cached) | **+$0.018 to +$0.030** |
| Scope 3 (six items) | 0 | +0 to +260 per coaching turn (non-pipeline) | **$0** per essay (~+$0.0008 per coaching session) |
| **COMBINED (per essay)** | **−1,835 to −5,285** | **+4,550 to +5,370** | **−$0.029 to −$0.066** |

**First-day cache-miss overhead (X27 from R4 audit)**: Scope 2 Item 3 converts the L3 `SYSTEM_PROMPT` const in `sequentialDeepWalk.ts` to a `buildSystemPrompt()` function with `{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}` substitution. This changes the system prompt's content hash, which forces Anthropic prompt caching to REBUILD the cache on first use. The result: the first post-deployment day pays full uncached cost for every L3 call until the cache warms up (~24 hours). Cost impact: roughly +$0.10 per essay spike on day 1, then returns to the steady-state cost table above. **Budget ~$50 in first-day cache-miss overhead** for Scope 2 Item 3 (assuming ~500 essays/day). The same issue applies to Scope 2 Item 4 (L3.5) and Item 5 (L3.75) but at lower magnitude because those prompts are smaller. No action required — this is a one-time transient cost that the plan flags for visibility.

**Interpretation:** Scope 1's dead-field compression more than compensates for Scope 2's candidate emission overhead. The pipeline ships net cheaper than today while the coaching output becomes more prescriptive and research-backed. Day 1 of deployment will show a temporary cost spike from cache misses; steady-state delta (Day 2+) matches the table above.

### Metric targets — first-run vs steady-state

R4 correctness audit flagged that the original plan's headline metrics (technique ≥80%, demonstration ≥70%, rewriteExample ≥95%, consolidation ratio ≥1.5) are **steady-state** targets — what the pipeline reaches after 2-3 rounds of prompt tuning. On the **first E2E run** they will land 5-15 percentage points lower because Sonnet's compliance with new prompt sections, enum vocabulary, and consolidation instructions improves across tuning iterations.

**Split targets (Phase 8 validation gate uses FIRST-RUN; Phase 8.5 tuning uses STEADY-STATE)**:

| Metric | First-run target (~70% of steady-state) | Steady-state target |
|---|---:|---:|
| Manifest items with non-null `technique` | ≥56% | ≥80% |
| Manifest items with non-null `demonstration` | ≥49% | ≥70% |
| L5 `rewriteExample` coverage on consolidated targets | ≥66% | ≥95% |
| L4 consolidation ratio (candidates/priority) | ≥1.05 | ≥1.5 |
| L4 gap-fill frequency | ≤30% | ≤20% |
| Candidate store size after L3.75 | 5-15 | 5-15 |

**Phase 8 gate PASSES at first-run targets** — this is the minimum bar for declaring the plan successful. **Phase 8.5** (prompt tuning, not in this plan's scope) pushes the metrics from first-run to steady-state via 2-3 iterations of prompt refinement. If Phase 8 fails even the first-run targets, the ROOT CAUSE is likely the L3 FORBIDDEN VOCABULARY carve-out was dropped (see Scope 2 Item 3) or the ACTION mode escape hatch leaked back in (see Scope 1 GAP-6) — NOT a need for further iteration.

### Audit findings resolved

Out of 26 findings in `docs/PIPELINE_ARCHITECTURE_AUDIT.md`, the unified plan resolves:

| Finding | Summary | Resolved by |
|---|---|---|
| F6 | Only 2 findings produced for 7-paragraph essay | Scope 2 items 3-5 (L3/L3.5/L3.75 each emit candidates per-sentence/per-edge) |
| F11 | Profile intelligence ~60% unused in coaching | **PARTIALLY resolved.** Scope 1 item 5 (archetypeContext wiring) + Scope 3 item 3 (researchBacking/collegeNote rendering). The plan wires the data into the coaching prompt but does NOT force the coaching LLM to USE it — the vocabulary rule added in Item 3 (X23) pushes technique-name utilization from ~30% to ~50-65%. Full resolution (100% utilization of all profile intelligence sections: Question Queue, Coherence Contradictions, Writer Portrait, Red Flags, Institutional Fit, Anti-Convergence Patterns) requires coaching-loop changes outside this plan's scope. Waste drops from ~60% → ~30-40%. |
| F13 | Named craft techniques never deploy | Scope 1 item 9 (post-call technique tagger) + Scope 2 item 8 (LLM-emitted technique on every priority) |
| F18 | System describes when it should prescribe | **Scope 2 core architectural fix** — inline candidate emission + L4 consolidation + L5 materialization |
| F19 | 5-6 core insights repeated ~50 times | Scope 2 item 6 (L4 consolidates cross-layer duplicates via `consolidatedFrom` lineage) |
| F20 | Before/after examples almost never appear | Scope 2 item 7 (L5 REQUIRED rewriteExample for consolidated targets) + Scope 3 item 1 (research-backed demonstration fill) |

**Partial resolution:** F1 (L4 context bloat), F2 (L3.5 mode), F3 (re-read selectivity), F4 (L3 full text), F5 (understanding prose synthesis), F7 (L2 Haiku), F8 (connection noise), F9 (budget overrides), F10 (quality grading), F12 (meta-coaching loop), F14 (zero student prose), F15 (admissions intelligence vanishes), F16 (agency overrides), F17 (insight-per-turn rule), F21-F26 (voice/reader/craft gaps). Scope 1 partially addresses cost bloat (F1); Scope 3 partially addresses F15 via elite examples wiring. Most of the coaching-behavior findings (F12, F16, F17, F25) are beyond the scope of the three blueprints.

### Qualitative shifts

- L3 output: sentence `rhythm` moves from prose to enum tag; `voiceAlignment` dropped (no consumers).
- L3.75 output: `codeSwitching` removed; `voiceMap.*.observations[]` capped at 2 per dimension; `showVsTell` capped at 4; each growth edge now carries optional architectural `pairedImprovement`.
- L3.5 output: `evidence` strings capped at 10 words; `effectivenessReasoning` preserved (locked); every problem sentence now emits structured `improvementCandidate`.
- L4 output: Role shifts from Interpreter → Consolidator. `emergentPatterns`/`scoreTensions` become 1-line coaching signals wired into L5. Each priority carries consolidation lineage (`consolidatedFrom`), LLM-emitted `technique`, and inherited `demonstrationSketch`.
- L5 output: Each annotation carries AO-framed `stakes`, quoted `antiPatternExample` on cliché annotations, `wordEconomyCut` on additive rewrites, named `transferablePrinciple` on ~50% of annotations. `rewriteExample` coverage rises from 30-50% → 80-95% (ACTION mode) to 95%+ (consolidated target mode).
- Manifest: `technique` non-null on ≥80% (was 0%); `demonstration` non-null on ≥70% (was hardcoded 0%); each item also carries optional `researchBacking` and `collegeNote` after coaching session init.

---

## Dependency Graph

```
Phase 0: Prerequisites
  ├── Type-check baseline (npx tsc --noEmit)
  └── E2E baseline (piano essay)

Phase 1: Scope 1 prerequisite type migrations
  ├── S1-GAP4-types (CoachingMap.emergentPatterns/scoreTensions: string[])
  │     └── buildCoachingMap() backward-compat extension (accepts both object and string[] shapes)
  └── S1-GAP1 (SentenceCraft: enum rhythm, drop voiceAlignment)
        └── parseSentenceCraft() at sequentialDeepWalk + fullContextReReader

Phase 1.5: Doctrine Operationalization (BLOCKS ALL PHASE 2+)
  ├── new file: src/services/essayIntelligence/errors.ts
  │     └── PipelineError class (layer + candidateStoreSize + candidateIds + diagnosticContext)
  │     └── CoachingBlockedError class (for requiresReanalysis signal surfacing)
  │     └── Complete definition in FORGE_PLAN_ARTIFACTS.md section "PipelineError Class"
  └── All Phase 2+ throws must use PipelineError / CoachingBlockedError — not generic Error

Phase 2: Scope 1 independent schema compressions (parallel)
  ├── S1-GAP1-prompt (L3 walk prompt: rhythm enum, drop voiceAlignment)   [depends on GAP1-types]
  ├── S1-GAP2 (L3.75 compress voiceMap/showVsTell/codeSwitching/authenticity)
  ├── S1-GAP3 (L3.5 extractFirstSentence + evidence length caps)
  └── S1-GAP4-prompt (L4b prompt compression + L5 sharedContext wiring)   [depends on GAP4-types]

Phase 3: Scope 1 L5 enrichments (bundled)
  ├── S1-GAP5/6/7/8/9-fields (L5Annotation adds stakes/wordEconomyCut/antiPatternExample/transferablePrinciple)
  ├── S1-preCallEnrichment (new file: analysis/preCallEnrichment.ts)
  ├── S1-techniqueMatcher (new file: coaching/techniqueMatcher.ts)
  ├── S1-GAP5 (archetypeContext render + AO STAKES GROUNDING prompt)      [depends on fields]
  ├── S1-GAP6 (pre-call enrichment injection + REWRITE SCAFFOLDS)          [depends on preCallEnrichment]
  ├── S1-GAP7 (WORD ECONOMY pre-call diagnostics + prompt section)         [depends on preCallEnrichment]
  ├── S1-GAP8 (ANTI-PATTERN EXAMPLE prompt section)                         [depends on preCallEnrichment]
  └── S1-GAP9 (post-call techniqueMatcher tagger loop)                      [depends on techniqueMatcher]

Phase 4: Scope 2 infrastructure
  ├── S2-1 (ImprovementCandidateStore + types)
  │     └── improvements/improvementCandidateStore.ts (new file)
  │     └── profileTypes.ts: ImprovementCandidate types + improvementCandidateSnapshot on EssayProfile
  ├── S2-techniqueVocabulary (new file: analysis/techniqueVocabulary.ts)
  └── S2-2 (EssayProfileCoordinator extensions)                             [depends on S2-1]

Phase 5: Scope 2 layer candidate emission (parallel)
  ├── S2-3 (L3 walk improvementCandidate field)                             [depends on S2-1, S2-techniqueVocabulary, S1-GAP1-prompt]
  ├── S2-4 (L3.5 analysis pass improvementCandidate field)                  [depends on S2-1, S2-techniqueVocabulary, S1-GAP3]
  └── S2-5 (L3.75 pairedImprovement field)                                  [depends on S2-1, S2-techniqueVocabulary, S1-GAP2]

Phase 6: Scope 2 consolidation (sequential)
  ├── S2-6 (L4b Consolidator prompt rewrite + parser extensions)            [depends on S2-3/4/5, S1-GAP4]
  ├── S2-7 (L5 MATERIALIZATION MODE + buildParagraphPrompt signature)       [depends on S2-6, S1-GAP5/6/7/8]
  └── S2-8 (buildImprovementManifest projection + delete matchClaimToTechnique) [depends on S2-6, S2-7]

Phase 7: Scope 3 enrichment
  ├── S3-6 (profileTypes: ImprovementEntry.researchBacking?/collegeNote?; ImprovementManifest._enriched?)
  ├── S3-1 (analysis/researchEnrichment.ts new file)                        [depends on S3-6, S2-8 (optional — designed to be robust to either shape)]
  ├── S3-2 (coachingService.ts processCoachingTurn hook)                    [depends on S3-1]
  ├── S3-3 (buildImprovementQueueSection rendering)                         [depends on S3-6]
  ├── S3-4 (collegeOverlay.ts elite examples wiring)                        [independent]
  └── S3-5 (Harvard/MIT/Stanford TODO comments)                             [independent]

Phase 8: E2E validation
```

Full dependency table:

| Item | Depends on | Parallel with | Rollback point |
|---|---|---|---|
| S1-GAP4-types | — | S1-GAP1-types | Yes (type + parser guard land together) |
| S1-GAP1-types | — | S1-GAP4-types | Yes |
| S1-GAP1-prompt | S1-GAP1-types | S1-GAP2, S1-GAP3, S1-GAP4-prompt | Yes |
| S1-GAP2 | — | S1-GAP1-prompt, S1-GAP3, S1-GAP4-prompt | Yes (each change is type-safe via `?? []` guards) |
| S1-GAP3 | — | S1-GAP1-prompt, S1-GAP2, S1-GAP4-prompt | Yes |
| S1-GAP4-prompt | S1-GAP4-types | S1-GAP1-prompt, S1-GAP2, S1-GAP3 | Yes |
| S1-preCallEnrichment | — | S1-techniqueMatcher | Yes (new file, no imports) |
| S1-techniqueMatcher | — | S1-preCallEnrichment | Yes (new file, no imports) |
| S1-GAP5/6/7/8/9-fields | — | — | Bundled with Phase 3 |
| S1-GAP5 | S1-GAP5/6/7/8/9-fields | S1-GAP6, GAP7, GAP8, GAP9 | Yes |
| S1-GAP6 | S1-preCallEnrichment, S1-GAP5/6/7/8/9-fields | S1-GAP5, GAP7, GAP8 | Yes |
| S1-GAP7 | S1-preCallEnrichment, S1-GAP5/6/7/8/9-fields | S1-GAP5, GAP6, GAP8 | Yes |
| S1-GAP8 | S1-preCallEnrichment, S1-GAP5/6/7/8/9-fields | S1-GAP5, GAP6, GAP7 | Yes |
| S1-GAP9 | S1-techniqueMatcher, S1-GAP5/6/7/8/9-fields | S1-GAP5, GAP6, GAP7, GAP8 | Yes |
| S2-1 | — | S2-techniqueVocabulary | Yes (new infrastructure) |
| S2-techniqueVocabulary | — | S2-1 | Yes (new file) |
| S2-2 | S2-1 | — | Yes |
| S2-3 (L3 walk) | S2-1, S2-2, S2-techniqueVocabulary, S1-GAP1-prompt | S2-4, S2-5 | Yes (field is `?`; absent → parser returns null) |
| S2-4 (L3.5 pass) | S2-1, S2-2, S2-techniqueVocabulary, S1-GAP3 | S2-3, S2-5 | Yes |
| S2-5 (L3.75 pairedImprovement) | S2-1, S2-2, S2-techniqueVocabulary, S1-GAP2 | S2-3, S2-4 | Yes |
| S2-6 (L4 Consolidator) | S2-3, S2-4, S2-5, S1-GAP4-prompt | — | Yes (parser accepts both legacy object and new string[] shapes for Scope 1 coord) |
| S2-7 (L5 materializer) | S2-6, S1-GAP5/6/7/8 (all L5 prompt sections) | — | Yes |
| S2-8 (manifest projection) | S2-6, S2-7 | — | Yes (deletes matchClaimToTechnique — mechanical cleanup once projection works) |
| S3-6 (type extensions) | — | S3-4, S3-5 | Yes (purely additive optional fields) |
| S3-1 (researchEnrichment.ts) | S3-6, S2-8 (structural — designed to tolerate Scope 2 drift) | S3-4, S3-5 | Yes (new file) |
| S3-2 (coaching hook) | S3-1 | — | Yes (9-line insertion; revert is trivial) |
| S3-3 (queue section render) | S3-6 | S3-2 | Yes |
| S3-4 (elite examples overlay) | — | S3-1, S3-2, S3-3, S3-5, S3-6 | Yes (additive prompt section) |
| S3-5 (Harvard/MIT/Stanford TODOs) | — | Everything | Yes (docs-only) |

---

## Execution Phases

### Phase 0 — Prerequisite checks

**Items:** None (validation only).

**Commands:**
```bash
cd /Users/tuepham/uplift-final-final-18698-62030
npx tsc --noEmit > /tmp/tsc-baseline.log 2>&1
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-conversator-v2-e2e.ts > /tmp/e2e-baseline.log 2>&1
```

**Capture:** baseline token counts for L3/L3.5/L3.75/L4/L5, baseline manifest item count, baseline `technique`/`demonstration` coverage (expected: 0%/0%), baseline E2E timing.

**Gate to Phase 1:** type-check passes. E2E runs without errors (content doesn't need to be perfect, just stable).

**Rollback:** N/A.

---

### Phase 1 — Scope 1 type migrations (safe foundation)

**Items:** S1-GAP1-types, S1-GAP4-types.

**Files touched:**
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts` (SentenceCraft enum + RhythmTag type; CoachingMap.emergentPatterns/scoreTensions → string[])
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` (parseSentenceCraft)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/fullContextReReader.ts` (coerceSentenceCraft + default init)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/focusedAnalyzer.ts` (default init)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/mutators/sentenceMutator.ts` (drop voiceAlignment write branch)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/mutators/voiceMapMutator.ts` (codeSwitching null guards — if bundled with GAP2)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileManager/validation/intraDomainValidation.ts` (codeSwitching guard — if bundled)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/crystallizer.ts` (`buildCoachingMap()` extension for backward-compat; lines 1317-1345)
- `/Users/tuepham/uplift-final-final-18698-62030/tests/dump-full-profile.ts:326-335` — **TYPE-CHECK FIX**: update readers of `emergentPatterns[i].pattern`/`.evidence`/`.implication` to read the new `string[]` shape. Current code reads `p.pattern` / `p.evidence` / `p.implication` on a string, which will fail type-check in strict mode. Edit: replace the inner object-field reads with the raw string (e.g., `lines.push(\`- ${p}\`)`). Similarly update readers of `scoreTensions[i].paragraph`/`.tension`/`.interpretation`/`.coachingImplication` at lines 332-335.
- `/Users/tuepham/uplift-final-final-18698-62030/tests/test-l4-contradiction-mining.ts:188-197` — **TYPE-CHECK FIX**: update `firstTension.paragraph`/`firstTension.interpretation.length` readers to the new `string[]` shape. Edit: `firstTension` is now a string; replace sub-field access with `firstTension.length` and the raw string itself.

**Validation gate:**
- `npx tsc --noEmit` passes (critical: CoachingMap/SentenceCraft shape change must not break any consumer).
- Run a saved fixture `EssayProfile` through the coordinator and confirm the legacy-object `emergentPatterns` load via the flattener as `string[]` without errors.
- Smoke test `tests/test-conversator-v2-e2e.ts` — expect no behavioral change yet.

**Rollback criteria:** Any existing persisted profile fails to load (backward compat broken). Any test that reads `CoachingMap.emergentPatterns[i].pattern` crashes. Revert the type change and revisit the backward-compat extension to `buildCoachingMap()` (likely the string/object union is not handled).

Source: FORGE_PLAN_SCOPE1.md items 1 + 4 (types portion only).

---

### Phase 2 — Scope 1 schema compressions (parallel)

**Items:** S1-GAP1-prompt, S1-GAP2, S1-GAP3, S1-GAP4-prompt.

**Files touched:**
- `sequentialDeepWalk.ts:325-328, 1730` (GAP1 L3 prompt)
- `fullContextReReader.ts:122-126, 544-548, 605-612` (GAP1 mirror)
- `focusedAnalyzer.ts:1338` (GAP1 default)
- `holisticSynthesis.ts:299-368, 387-394, 1155` (GAP2 L3.75 compress)
- `profileTypes.ts` (VoiceMap.codeSwitching optional)
- `profileManager/validation/intraDomainValidation.ts:264` (GAP2 guard)
- `profileManager/mutators/voiceMapMutator.ts:203,210,212,361-368` (GAP2 guards)
- `profileManager/essayProfileManager.ts:766` (GAP2 init — no change, documented)
- `analysisPass.ts:~180, 193-245, 470-474, 490` (GAP3 anchor extraction at `buildAnchorContext` + evidence caps; buildAnchorContext spans lines 193-245, specific edit points at 212-213 and 227, 229)
- `crystallizer.ts:587-607, 306-307, 500-501` (GAP4 L4b prompt + L4a crossParagraphPatterns)
- `deepAnnotationService.ts:711-748` (GAP4 L5 sharedContext wiring for emergentPatterns/scoreTensions/crossParagraphPatterns)
- `/Users/tuepham/uplift-final-final-18698-62030/tests/test-l375-earned-voice-audit.ts:220` — **TYPE-CHECK FIX**: add `?? []` guard on `voiceMap.codeSwitching` (the field becomes optional in GAP-2, so unguarded `.length` access on undefined will fail strict-mode type check). Edit: `if ((voiceMap.codeSwitching ?? []).length > 0) { for (const cs of (voiceMap.codeSwitching ?? [])) {...} }`.

**Validation gate:**
- `npx tsc --noEmit` passes.
- Run E2E `tests/test-conversator-v2-e2e.ts`.
- **Token count check:** L3 output drops by ~1,300-3,000 tokens, L3.75 drops by ~400-800, L3.5 drops by ~1,300-2,600, L4 drops by ~490-880. Total output drop: ~3,500-7,300 tokens.
- **Content check (manual):** inspect L3 walk output — confirm `rhythm` is an enum tag (one word), no `voiceAlignment` field. Confirm L3.75 output has no `codeSwitching`, `voiceMap.*.observations[]` has ≤2 entries. Confirm L4 output `emergentPatterns`/`scoreTensions` are `string[]`. Confirm L5 sharedContext (inspect generated prompt) includes the three new L4 coaching hooks.

**Rollback criteria:** Any layer output malformed (JSON parse failures, missing required fields). `effectivenessReasoning` mistakenly capped (verify it's unchanged). Coaching prompt rendering broken for essays with stored `voiceAlignment`/`codeSwitching` (backward compat).

Source: FORGE_PLAN_SCOPE1.md items 1-4.

---

### Phase 3 — Scope 1 L5 enrichment bundle

**Items:** S1-GAP5/6/7/8/9-fields (bundled), S1-preCallEnrichment, S1-techniqueMatcher, S1-GAP5, S1-GAP6, S1-GAP7, S1-GAP8, S1-GAP9.

**Files touched:**
- `src/services/essayIntelligence/analysis/preCallEnrichment.ts` (NEW, ~80 LOC)
- `src/services/essayIntelligence/coaching/techniqueMatcher.ts` (NEW, ~50 LOC)
- `deepAnnotationService.ts:117-201, 241-257` (L5Annotation + RawAnnotation add 4 fields)
- `deepAnnotationService.ts:~20` (import buildPreCallEnrichment + techniqueMatcher)
- `deepAnnotationService.ts:~320-340` (annotateParagraph calls buildPreCallEnrichment)
- `deepAnnotationService.ts:792` (buildParagraphPrompt signature adds `enrichment?`)
- `deepAnnotationService.ts:~953` (inject enrichment block in paragraph user turn)
- `deepAnnotationService.ts:594-595, ~595-600` (system prompt: REWRITE EXAMPLES hardened + AO STAKES GROUNDING + WORD ECONOMY + ANTI-PATTERN EXAMPLE sections)
- `deepAnnotationService.ts:624-651` (JSON schema extension with 4 new output fields)
- `deepAnnotationService.ts:1084-1090` (renderHolisticContext surfaces archetypeContext)
- `deepAnnotationService.ts:~398` (post-call techniqueMatcher tagger loop)
- `deepAnnotationService.ts:1493-1524` (validateAnnotations extracts 4 new fields)

**Validation gate:**
- `npx tsc --noEmit` passes.
- Run E2E. Metrics:
  - ACTION-mode annotations with non-null `rewriteExample`: ≥80% (was 30-50%).
  - Growth annotations with `antiPatternExample` set: ≥50% when detected phrases exist.
  - Annotations with `transferablePrinciple` set: 40-60%.
  - Annotations with `stakes` set: 70-90% of non-strength annotations.
- Prompt token budget: cached system prompt ~6400 tokens (up from ~6000). Per-paragraph user turn +50-150 non-cached input.
- **Backward compat:** load a stored profile that predates Scope 1's field additions. Confirm missing fields default to null without crashes.

**Rollback criteria:** L5 annotations missing required fields. Prompt token budget exceeds Anthropic caching limits. `techniqueMatcher` or `preCallEnrichment` throws at runtime.

Source: FORGE_PLAN_SCOPE1.md items 5-9.

---

### Phase 4 — Scope 2 infrastructure (pure additions)

**Items:** S2-1 (ImprovementCandidateStore), S2-techniqueVocabulary, S2-2 (Coordinator extensions).

**Files touched:**
- `src/services/essayIntelligence/improvements/improvementCandidateStore.ts` (NEW, ~130 LOC)
- `src/services/essayIntelligence/improvements/index.ts` (NEW, ~5 LOC)
- `src/services/essayIntelligence/analysis/techniqueVocabulary.ts` (NEW, ~30 LOC)
- `profileTypes.ts:2428` (ImprovementCandidate, ImprovementCandidateState, ImprovementCandidateStoreSnapshot types; SentenceUnderstanding.improvementCandidate?; SentenceAnalysis.improvementCandidate?; CraftAssessment.growthEdges[].pairedImprovement?; CoachingMap.priorities[] extensions; EssayProfile.improvementCandidateSnapshot?)
- `profileManager/essayProfileManager.ts:916, 977, 2140` (candidateStore field + constructor init + 5 new methods)

**Validation gate:**
- `npx tsc --noEmit` passes.
- New unit test: `tests/test-scope2-candidate-store.ts` — add/getActive/markConsolidated/markSuperseded/serialize/deserialize round-trip.
- New unit test: `tests/test-technique-vocab-sync.ts` — assert `TECHNIQUE_VOCABULARY_LIST` length/content matches `coachingService.TECHNIQUE_ROUTES` AND `techniqueMatcher.TECHNIQUE_ROUTES` (cross-file sync).
- E2E still passes (coordinator has empty candidate store; no behavior change yet).

**Rollback criteria:** Store serialization breaks existing profile persistence. Type system rejects the extensions (shouldn't happen — all optional).

Source: FORGE_PLAN_SCOPE2.md items 1-2 + Core Types.

---

### Phase 5 — Scope 2 layer candidate emission (parallel after Phase 4)

**Items:** S2-3 (L3 walk), S2-4 (L3.5 pass), S2-5 (L3.75 pairedImprovement).

**Files touched:**
- `sequentialDeepWalk.ts:155-409, 318, 395, 415, 922, 1036, 1076` (L3 walk: buildSystemPrompt function, schema, prose, parser threading paragraph index)
- `analysisOrchestrator.ts:429` (harvest L3 candidates after walk apply)
- `analysisPass.ts:306, 458, 1091` (L3.5: IMPROVEMENT CANDIDATE section + schema + parser + helper)
- `profileTypes.ts:2968` (AnalysisPassOutput.sentenceAnalyses[].improvementCandidate?)
- `profileManager/essayProfileManager.ts:1540` (mutator propagation + harvest into store)
- `holisticSynthesis.ts:629-632, 532, 1435` (L3.75: prompt + schema + coerceCraftAssessment)
- `analysisOrchestrator.ts:472` (extractL375Candidates + addImprovementCandidates)
- `profileTypes.ts:862` (CraftAssessment.growthEdges[].pairedImprovement?)

**Validation gate:**
- `npx tsc --noEmit` passes.
- Unit tests:
  - `tests/test-scope2-l3-candidate-extraction.ts`
  - `tests/test-scope2-l35-candidate-extraction.ts`
  - `tests/test-scope2-l375-paired-improvement.ts`
- E2E: confirm candidate store has 5-15 active candidates after L3.75 runs.
- L3/L3.5/L3.75 output tokens up ~400/550/350 respectively (matches Scope 2 cost table).

**Rollback criteria:** Candidate store has 0 entries despite scoring issues present (prompt injection failing). LLM emits malformed candidates that break the parser. Any existing L3/L3.5/L3.75 consumer fails due to schema change.

Source: FORGE_PLAN_SCOPE2.md items 3-5.

---

### Phase 6 — Scope 2 consolidation and materialization (sequential)

**Items:** S2-6 (L4 Consolidator), S2-7 (L5 materializer), S2-8 (manifest projection + delete scraper).

**CRITICAL MERGED ARTIFACTS (required reading before implementation)**:
- The merged L4b preamble (combining Scope 2's Consolidator framing with Scope 1's verbatim `emergentPatterns`/`scoreTensions` format instructions for `string[]` compression) is rendered in full at `FORGE_PLAN_ARTIFACTS.md` section "Merged L4b Preamble". Implementers should copy that text verbatim into `crystallizer.ts:buildSystemPromptL4b()` — do NOT reconstruct it from the per-scope blueprints, which would lose Scope 1's 60-word format spec (Max 3 items, ≤20/≤15 words, exact example strings).
- The merged 9-parameter `buildParagraphPrompt()` signature and the merged user-turn block ordering (existing context → Scope 2 CONSOLIDATED TARGETS → Scope 1 REWRITE SCAFFOLDS → existing GENERATION INSTRUCTIONS) are rendered at `FORGE_PLAN_ARTIFACTS.md` section "buildParagraphPrompt Merged Signature". Implementers should copy verbatim.
- The `PipelineError` class definition (new file `src/services/essayIntelligence/errors.ts`) lives at `FORGE_PLAN_ARTIFACTS.md` section "PipelineError Class".
- The `migrateLegacyProfileToCandidateStore()` function lives at `FORGE_PLAN_ARTIFACTS.md` section "Profile Migration".

**Files touched:**
- `crystallizer.ts:529, 823, 1912, 2049, parser` (L4b Consolidator preamble + candidateContextBlock param + priorities[] parser)
- `analysisOrchestrator.ts:568, ~580` (pass candidateContextBlock to crystallize; post-L4 applyConsolidation)
- `deepAnnotationService.ts:117, 281, 531, 792, ~1510` (L5 consolidatedTargetIndex; generateAnnotations params; MATERIALIZATION MODE section; buildParagraphPrompt signature merges Scope 1's enrichment? param with Scope 2's consolidatedTargets?; ConsolidatedTarget type export)
- `analysisOrchestrator.ts:714, ~733` (buildConsolidatedTargetsByParagraph; mark finalized after L5)
- `analysisOrchestrator.ts:1414-1664` (replace buildImprovementManifest with projection; **DELETE matchClaimToTechnique**)
- `analysisOrchestrator.ts:752` (new manifest call signature)

**Validation gate:**
- `npx tsc --noEmit` passes.
- Unit tests:
  - `tests/test-scope2-l4-consolidation.ts`
  - `tests/test-scope2-l5-materialization.ts`
- E2E assertions (match FORGE_PLAN_SCOPE2.md verification plan, use FIRST-RUN targets from the "Metric targets — first-run vs steady-state" section above):
  - Manifest items with non-null `technique`: ≥56% first-run (≥80% steady-state).
  - Manifest items with non-null `demonstration`: ≥49% first-run (≥70% steady-state).
  - Consolidation ratio ≥1.05 first-run (≥1.5 steady-state).
  - Gap-fill frequency ≤30% first-run (≤20% steady-state).
  - L5 rewriteExample coverage on consolidated targets: ≥66% first-run (≥95% steady-state).
  - Grep: zero references to `matchClaimToTechnique` in the codebase after this phase.
- **L4 non-consolidation output regression check (critical — X25 fix)**: After Scope 2's L4b Consolidator preamble lands, verify that `coherenceReport.contradictions.length`, `coherenceReport.resolvedGaps.length`, and `transformativeInsight.insight` quality have NOT regressed vs the Phase 5 baseline. Compare structured outputs field-by-field using a saved JSON snapshot. The Consolidator role rewrite targets `priorities[]` production but L4b STILL owns `coherenceReport` and `transformativeInsight` — the new framing may inadvertently suppress those sections. If any regression is detected, the Consolidator preamble needs an explicit "COHERENCE REPORT + TRANSFORMATIVE INSIGHT ARE STILL YOUR RESPONSIBILITY" section preserving those outputs. See Risk register for the specific mitigation path.
- Cost check: pipeline total within +$0.03/essay of pre-phase baseline (Scope 2 envelope).

**Rollback criteria:** Manifest produces empty items for essays with candidates (consolidation broken). L5 discovery mode completely suppressed (MATERIALIZATION MODE instruction too strict). Scoring or coaching regressions from deleted `matchClaimToTechnique`. **No fallback:** If the manifest projection produces zero items on a fresh analysis, fail loudly with a diagnostic `PipelineError` naming which layers under-emitted. Do NOT invoke the legacy scraper as a fallback (the whole point of Scope 2 is the lineage-preserving projection; a retroactive-scraper output is lesser-output and must not silently substitute). Pre-existing profiles with empty `improvementCandidateSnapshot` surface an explicit `requiresReanalysis: true` flag to callers.

Source: FORGE_PLAN_SCOPE2.md items 6-9.

---

### Phase 7 — Scope 3 enrichment (end-to-end research DB wiring)

**Items:** S3-6 (type extensions), S3-1 (researchEnrichment.ts), S3-2 (coaching hook), S3-3 (render), S3-4 (elite examples), S3-5 (TODOs).

**Files touched:**
- `profileTypes.ts:2406, 2427` (ImprovementEntry.researchBacking?/collegeNote?, ImprovementManifest._enriched?)
- `src/services/essayIntelligence/analysis/researchEnrichment.ts` (NEW, ~275 LOC)
- `coaching/coachingService.ts:849, 4149, 4167` (enrichment hook; render collegeNote/principle)
- `coaching/collegeOverlay.ts:189` (elite examples block)
- `src/services/commonAppWorkshop/data/harvard.ts:1484, mit.ts:1439, stanford.ts:2557` (TODO comments only)

**Validation gate:**
- `npx tsc --noEmit` passes.
- New unit test: `tests/test-scope3-enrichment.ts` (6 sub-tests from FORGE_PLAN_SCOPE3.md verification plan):
  - Synthetic manifest with 3 items (mapped, keyword-fallback, unmapped) enriches correctly.
  - Idempotency: second call is a no-op.
  - College-aware: Stanford lookup works for both 'stanford' and 'STANFORD' case.
  - Miss handling: unmapped items stay null.
  - End-to-end render: coaching prompt contains `PRINCIPLE:` and `COLLEGE NOTE:` lines.
  - Elite examples surfacing: `getCollegeCoachingOverlay('brown')` returns the new block; `('harvard')` does not.
- Production log check: `[researchEnrichment] Enrichment complete — items=N, demonstrations=N, stakes_upgraded=N, college_notes=N` appears on first coaching turn, does NOT appear on subsequent turns.
- E2E: coaching response for a Brown supplement includes a college-specific note on at least one improvement.

**Rollback criteria:** `enrichWithResearchDatabase` throws and breaks the coaching turn (fail-open is broken). Stale manifest from Phase 6 (manifest shape differs from what Scope 3 expects — adapt via structural property reads per FORGE_PLAN_SCOPE3.md:751). `_enriched` flag fails to set (causing enrichment to re-run every turn).

Source: FORGE_PLAN_SCOPE3.md items 1-6.

---

### Phase 8 — E2E validation (the audit piano-essay baseline)

**Items:** None (validation only).

**Commands:**
```bash
cd /Users/tuepham/uplift-final-final-18698-62030
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-conversator-v2-e2e.ts > /tmp/e2e-after.log 2>&1
diff -u /tmp/e2e-baseline.log /tmp/e2e-after.log | head -200
```

**Assertions (against `docs/PIPELINE_ARCHITECTURE_AUDIT.md`):**
- F6 (only 2 findings): candidate store has 5-15 active candidates before L4 consolidation, ≥5 consolidated priorities after L4.
- F13 (named techniques never deploy): ≥80% of manifest items have non-null `technique`.
- F18 (describes when should prescribe): each L3.5 `isProblem` sentence has a candidate with non-empty `suggestedChange`.
- F19 (insights repeated ~50x): candidate deduplication ratio ≥1.5 per priority (consolidation working).
- F20 (before/after almost never appears): ≥70% of manifest items have non-null `demonstration`; ≥95% of consolidated-target L5 annotations have non-null `rewriteExample`; ≥50% of manifest items have non-null `researchBacking` (Scope 3 hit rate).
- F11 (profile intelligence ~60% unused): `archetypeContext` is injected into L5 prompt (grep render output); `researchBacking`/`collegeNote` appear in coaching prompt (grep coaching prompt output).

**Cost comparison:** total pipeline cost per essay `−$0.029 to −$0.066` delta vs Phase 0 baseline. Input tokens up ~4,500; output tokens down ~2,000-5,300.

**Coaching smoke test:** run a 5-turn coaching session with a Brown supplement essay. Confirm:
- Turn 1: coaching response references a specific before/after transformation from the research database.
- Turn 1: coaching response references a Brown-specific elite pattern.
- Turn 2+: the `[researchEnrichment]` log line does NOT reappear (idempotency).
- The legacy `matchClaimToTechnique` code path is never hit (it's deleted).

**Final rollback criteria:**
- Any audit finding that was "resolved by this phase" regresses.
- Total cost exceeds Phase 0 baseline + $0.05 per essay.
- Coaching turn latency > 2x baseline on the first turn (Scope 3 enrichment blocking).

---

## Risk Register

| Risk | Phase | Signal | Rollback action | Mitigation |
|---|---|---|---|---|
| **`effectivenessReasoning` accidentally capped** — load-bearing for both L3.5 scoring AND coaching `activeConcerns`. Both uses must be preserved. | 2 (GAP-3) | L3.5 scoring drifts vs baseline (scoring shifts ≥10 points on fixture sentences); `activeConcerns` in coaching prompt look truncated (mid-word or ≤120 chars). | Revert `analysisPass.ts` evidence-cap edits; ensure prompt instruction for `effectivenessReasoning` is UNCHANGED (only `buildAnchorContext()` changed). | Code review checklist: `git diff analysisPass.ts` must show NO change to `effectivenessReasoning` prompt text at lines 306-404. The only acceptable edits are: `extractFirstSentence` helper, `buildAnchorContext` function body, and `evidence` string cap annotations. |
| **`craft.rhythm` enum conversion breaks downstream L5 render** | 1/2 (GAP-1) | `deepAnnotationService.ts:910` renders `rhythm=${undefined}` or `rhythm=` (empty) in L5 paragraph prompt for pivotal sentences. | Revert type change; keep `rhythm: string` as before. | The consumer at line 910 already uses `?? 'uncharacterized'`, so an empty enum is rendered as a fallback label. Enum values are strings, not objects — renderer treats them identically. Verify via E2E spot check. |
| **Scope 2 retroactive-scraper → empty manifest on old profiles** — `buildImprovementManifest()` is rewritten as projection; profiles persisted pre-Scope-2 have empty `ImprovementCandidateStore`. | 6 (S2-8) | Re-running analysis on a persisted profile produces `manifest.items.length === 0` (only AO red flags). | **FAIL-FAST — no silent fallback.** If manifest projection produces zero items on a FRESH analysis run, throw a diagnostic error (`PipelineError: manifest projection produced zero items — check L3/L3.5/L3.75 candidate emission`). If an OLD persisted profile is loaded with an empty `improvementCandidateSnapshot`, signal explicit `requiresReanalysis: true` on the profile — do NOT silently invoke the legacy scraper. The scraper code may remain physically present in source history (no need to delete it in the same PR), but it is NOT wired as a fallback code path. | Fail-fast: pre-existing profiles are handled by an explicit re-analysis signal. No retry loops. No lesser-output fallback. |
| **Scope 3 enrichment hook runs on stale manifest or wrong session — RESOLVED in Item 6.** R5 audit verified `_enriched` IS persisted via Supabase (see Risk row above for the fix). Scope 3 Item 6 excludes the flag from `SupabaseCheckpointStore.save()` via a JSON replacer. | 7 (S3-2, S3-6) | If Item 6's exclusion is not implemented, coaching response uses stale research examples after a research DB update OR collegeId switch. | Ensure Item 6's `SupabaseCheckpointStore.save()` JSON replacer is landed. | Verified by the new sub-tests in `test-scope3-enrichment.ts` (serialize/deserialize idempotency + collegeId switch). Monitor the enrichment log line; if it never re-appears after a re-analysis, the exclusion was not applied. |
| **L5 token budget overrun** — combined system prompt grows to ~6800 tokens after both Scope 1 and Scope 2 edits. Anthropic prompt caching has a minimum chunk size; if the prompt structure changes too aggressively, cache hit rate drops. | 3, 6 | Cache hit rate drops ≥20% vs Phase 0 baseline; latency increases; input token cost spikes. | Trim Scope 1's WORD ECONOMY section (conditional on Polish/Distinction only); or trim Scope 2's MATERIALIZATION MODE to ~200 tokens. | Measure cache hit rate in Phase 5 and Phase 6 validation gates. If drop > 20%, investigate. |
| **Three-way `TECHNIQUE_ROUTES` duplication drift** — `coachingService.ts:104-232`, `coaching/techniqueMatcher.ts` (Scope 1), `analysis/techniqueVocabulary.ts` (Scope 2). All three must stay in sync. | 3, 4 | A new technique added to one list is missing from the others; LLM emits a technique name the matcher doesn't recognize; or the matcher ROUTE_TO_ISSUE_TYPE lookup misses. | Trivial — sync the list manually. | Add CI unit test `tests/test-technique-vocab-sync.ts` that asserts length + names match across all three lists. Runs on every PR. |
| **Backward compat with persisted profiles** — new optional fields on `SentenceCraft`, `VoiceMap`, `SentenceUnderstanding`, `SentenceAnalysis`, `CraftAssessment.growthEdges`, `L5Annotation`, `ImprovementEntry`, `ImprovementManifest`, `EssayProfile`. | 1, 3, 4, 7 | Loading a stored profile fails with TypeError: cannot read property X of undefined. | Revert the specific field addition; add `?? null` / `?? []` guard on the reader side. | All new fields are marked optional (`?`). All readers should use optional-chaining. Explicitly exercise backward compat with a fixture profile saved pre-Scope-1 during Phase 1 validation. |
| **L5 MATERIALIZATION MODE suppresses discovery annotations** — Scope 2's instruction "For each consolidated target, produce exactly ONE annotation" may be interpreted as "ONLY produce annotations for consolidated targets." | 6 (S2-7) | L5 output has annotation count equal to consolidated target count (discovery mode dead). | Edit the system prompt: strengthen the "you MAY add additional discovery annotations" clause to "you SHOULD add additional discovery annotations when you see them." | Discovery mode escape hatch is explicitly in the Scope 2 prompt (item 7, section 2). Verify in Phase 6 E2E that total L5 annotations > consolidated target count. |
| **Scope 2 L4 gap-fill too frequent** — if upstream layers under-emit candidates, L4 falls back to gap-filling and the improvement pipeline degrades to the current state. | 6 | Gap-fill frequency > 30% (priorities with empty `consolidatedFrom`). | Strengthen candidate-emission prompts (L3/L3.5/L3.75) to lower the emission bar. | Monitor in Phase 6 validation. Target ≤20% gap-fill. |
| **`codeSwitching` removal breaks a consumer we missed** — Scope 1 removes it from generation but keeps the type optional. | 2 (GAP-2) | Runtime error in a consumer that reads `codeSwitching.length` without the `?? []` guard. | Add the missing guard. | Scope 1 plan lists all known consumers (`intraDomainValidation.ts:264`, `voiceMapMutator.ts:203-368`). Add a TypeScript check to verify all reads are guarded. |
| **Scope 3 Stanford/stanford case-sensitivity bug resurfaces** — `getCollegeInsight()` internal map uses capitalized keys; Scope 3 normalizes at call site via `normalizeCollegeIdsForLookup()`. | 7 (S3-1) | Supplements with lowercase `collegeId` return null for college notes. | The normalizer tries `[lower, capitalized, upper]`; verify it's called for every `getCollegeSpecificGuidance` call. | Unit test covers both `'stanford'` and `'STANFORD'` cases. |
| **`_enriched` flag persisted via Supabase — CONFIRMED, not just a risk.** The flag IS serialized via `SupabaseCheckpointStore.save()` because it's nested inside `profile.improvementManifest` which is persisted as JSONB. If a student switches `collegeId` mid-thread or the research DB is updated, the stale `_enriched = true` flag short-circuits re-enrichment forever. | 7 (S3-1, S3-6) | Enrichment log line never appears after a re-analysis pass; `collegeNote` is never populated after a college switch. | Scope 3 Item 6 modifies `SupabaseCheckpointStore.save()` to exclude `improvementManifest._enriched` from serialization (JSON replacer skips the key). | FIX LANDS IN SCOPE 3 ITEM 6 — not a monitoring item. See Open Decision 8 update. |
| **Blueprint correction needed: `buildImprovementManifest` line count discrepancy** — Scope 2 claims 207 lines at `analysisOrchestrator.ts:1426-1633`. Real-world: starts at 1426, `matchClaimToTechnique` at 1639, last line of manifest at ~1634, so ~208 lines. Close enough. | N/A | — | — | No correction needed. |

### Blueprint corrections flagged

1. **Scope 2 Decision 12 (backward compat)**: **RESOLVED via fail-fast + migration.** Option C (legacy fallback) rejected per doctrine rule #2. Old persisted profiles without `improvementCandidateSnapshot` are migrated via a deterministic one-shot data shape conversion (no LLM calls — see `FORGE_PLAN_ARTIFACTS.md` section 'Profile Migration'). If migration finds zero source data, surface `requiresReanalysis: true` to callers.
2. **Scope 3 Item 4 (elite examples count)**: FORGE_PLAN_SCOPE3.md is inconsistent in its final counting. Line 3 says "11 of 13", line 497 says "10 of 13", line 498 corrects to "10 populated, 3 empty" (Harvard/MIT/Stanford empty). The unified plan uses **10 of 13**. Correction should be propagated.
3. **Scope 3 Item 1 line-number precision**: FORGE_PLAN_SCOPE3.md:2131 cites `researchBackedTeachingService.ts:2131` for the singleton export. Not re-verified by this plan. Should be checked against the real file during Phase 7 implementation.
4. **Three-way technique list duplication**: Scope 1 (`techniqueMatcher.ts`) and Scope 2 (`techniqueVocabulary.ts`) independently propose to duplicate `coachingService.TECHNIQUE_ROUTES`. Neither scope's plan mentions the other. **Flagged** — the unified plan adds a sync test; long-term consolidation deferred.

---

## Verification Strategy

### Per-phase type checks

`npx tsc --noEmit` runs as a gate between every phase. Phase 1's CoachingMap shape change is the riskiest — most downstream consumers of CoachingMap.emergentPatterns expected the object shape.

### Per-phase E2E smoke tests

`tests/test-conversator-v2-e2e.ts` runs at the end of every phase. Behavior comparisons:

- Phase 1: no behavior change.
- Phase 2: L3/L3.5/L3.75/L4 output shapes change; L5 sharedContext gains three new blocks.
- Phase 3: L5 annotations gain four new fields; ACTION mode rewriteExample coverage rises.
- Phase 4: no behavior change (pure infrastructure).
- Phase 5: candidate store populated; no L4/L5 behavior change yet.
- Phase 6: L4 priorities have lineage; L5 materializes targets; manifest technique/demonstration populated.
- Phase 7: coaching prompt rendering includes PRINCIPLE and COLLEGE NOTE lines.

### New unit tests

**Scope 2 / Scope 3**:
- `tests/test-scope2-candidate-store.ts` (Phase 4 gate)
- `tests/test-technique-vocab-sync.ts` (Phase 4 gate — cross-scope sync)
- `tests/test-scope2-l3-candidate-extraction.ts` (Phase 5 gate)
- `tests/test-scope2-l35-candidate-extraction.ts` (Phase 5 gate)
- `tests/test-scope2-l375-paired-improvement.ts` (Phase 5 gate)
- `tests/test-scope2-l4-consolidation.ts` (Phase 6 gate)
- `tests/test-scope2-l5-materialization.ts` (Phase 6 gate)
- `tests/test-scope2-migration.ts` (Phase 6 gate — X4 fix — legacy profile migration + `requiresReanalysis` signal)
- `tests/test-scope2-manifest-fail-fast.ts` (Phase 6 gate — asserts empty projection throws `PipelineError` naming under-emitting layers; asserts no dead-code scraper fallback)
- `tests/test-scope3-enrichment.ts` (Phase 7 gate, 6 sub-tests + 2 new: serialize/deserialize idempotency, collegeId switch mid-session)
- `tests/test-scope3-technique-coverage.ts` (Phase 7 gate — asserts every TECHNIQUE_VOCABULARY_LIST entry resolves via ROUTE_TO_ISSUE_TYPE to a non-null IssueType OR is on the documented null-sentinel list)

**Scope 1 unit tests (X30 fix from R5 audit — adds fast feedback vs E2E-only validation)**:
- `tests/test-scope1-rhythm-enum.ts` (Phase 1 gate — `parseSentenceCraft` with valid enum, legacy prose, empty, missing)
- `tests/test-scope1-coaching-map-backcompat.ts` (Phase 1 gate — `buildCoachingMap` accepts both legacy object shape and new string[] shape)
- `tests/test-scope1-anchor-context.ts` (Phase 2 gate — `buildAnchorContext` with first-sentence extraction, length caps at 120/150 chars at positions 212-213/227/229)
- `tests/test-scope1-pre-call-enrichment.ts` (Phase 3 gate — `buildPreCallEnrichment` with/without telling phrases, Polish vs Foundation phase gating)
- `tests/test-scope1-technique-matcher-multi-signal.ts` (Phase 3 gate — `matchAnnotationToTechnique` multi-signal requirement: ≥2 of {keyword, dimension, mode}; asserts single-keyword matches are rejected)
- `tests/test-scope1-l5-new-fields-extraction.ts` (Phase 3 gate — `validateAnnotations` extracts `stakes`, `wordEconomyCut`, `antiPatternExample`, `transferablePrinciple`; drops ACTION mode without `rewriteExample`)

### Audit finding resolution matrix

| Audit finding | Current state | Resolved in | Verification |
|---|---|---|---|
| F6 (2 findings for 7-paragraph essay) | 0% candidate emission | Phase 5 (S2-3, S2-4, S2-5) | Phase 8: candidate store has 5-15 entries |
| F11 (profile intelligence ~60% unused) | Partial (archetypeContext orphaned, research DB disconnected) | Phase 3 (S1-GAP5) + Phase 7 (S3-1/2/3) | Phase 8: archetypeContext rendered in L5 prompt; researchBacking rendered in coaching prompt |
| F13 (named techniques never deploy) | 0% coverage | Phase 3 (S1-GAP9) + Phase 6 (S2-6) | Phase 8: ≥80% of manifest items have non-null `technique` |
| F18 (describes when should prescribe) | Architectural gap | Phase 5-6 (S2-3/4/5/6/7/8) | Phase 8: every L3.5 `isProblem` sentence has non-empty `suggestedChange`; consolidation ratio ≥1.5 |
| F19 (5-6 insights repeated ~50x) | Duplication via scraper | Phase 6 (S2-6 consolidation) | Phase 8: consolidation ratio ≥1.5 candidates per priority |
| F20 (before/after almost never appears) | 0% demonstration coverage | Phase 6 (S2-7 L5 required rewriteExample) + Phase 7 (S3-1 research-backed fill) | Phase 8: ≥70% manifest demonstration coverage, ≥95% consolidated-target rewriteExample |

**Not resolved by this plan (out of 26 findings):**
F1 (partially — Scope 1 GAPs 1-4 reduce L4 context bloat by ~1K tokens; full L4 120K→5K fix requires profile router changes out of scope).
F2 (L3.5 mode selection — not touched).
F3 (re-read selectivity — not touched).
F4 (L3 full essay text in every paragraph call — not touched).
F5 (understanding prose synthesis failed silently — not touched).
F7 (L2 Haiku downgrade — not touched).
F8 (connection noise filter — not touched).
F9 (budget enforcement — not touched).
F10 (quality grading gaps — not touched).
F12 (meta-coaching loop — not touched; coaching-loop behavior).
F14 (zero student prose coached — not touched).
F15 (admissions intelligence front-loads — partially addressed by Scope 3 item 4).
F16 (coach overrides student agency — coaching-loop behavior, not touched).
F17 (one-insight-per-turn — coaching-loop behavior, not touched).
F21 (system reads intention into incidental choices — not touched; pedagogy).
F22 (powerful artifacts hidden from student — UI, not touched).
F23 (no post-session deliverable — UI, not touched).
F24 (coaching voice breaks under stress — coaching-loop behavior).
F25 (coaching responses too long for 17-year-old — coaching-loop behavior).
F26 (no student writing during session — coaching-loop behavior).

The three scopes are **analysis-pipeline focused**; coaching-loop behavior and UI findings are the next work item after this plan lands.

---

## Open Decisions

Aggregated from all three blueprints plus cross-scope coordination.

1. **[Scope 1] `codeSwitching[]` deprecation window** — the type is made optional. Schedule follow-up migration to remove entirely once all stored profiles reprocessed? Not a blocker.
2. **[Scope 1] `techniqueMatcher.ts` consolidation with `coachingService.TECHNIQUE_ROUTES`** — duplicates the 20-route list. Follow-up refactor can reverse the dependency.
3. **[Scope 1] `matchAnnotationToTechnique` dimension filtering** — L5 annotations don't carry a dimension tag, so the shared matcher ignores dimension filters. May produce false-positive routes. Monitor in Phase 3 E2E.
4. **[Scope 2] `TECHNIQUE_VOCABULARY_LIST` source of truth** — import from `coachingService.TECHNIQUE_ROUTES` (reverse dependency) vs. duplicate with unit test assertion. Unified plan adopts duplicate-with-test.
5. **[Scope 2] L4 candidate context block cache** — candidate block is essay-specific, not cached. If candidate volume grows > 25, L4b input cost balloons. Recommended: cap at top 20 by coachingValue.
6. **[Scope 2] Backward compatibility — RESOLVED via fail-fast.** Old persisted profiles with empty `improvementCandidateSnapshot` surface an explicit `requiresReanalysis: true` flag; callers (coaching service, UI) handle this by re-running analysis, not by silently invoking the scraper. No legacy fallback. This implements the project rule against silent degradation / lesser-output fallbacks.
7. **[Scope 2] Scope-overlap dedup pre-pass before L4** — a deterministic scope-overlap check at harvest time could eliminate duplicates before L4 consolidation runs. Flagged as early follow-up PR.
8. **[Scope 3] `_enriched` flag persistence across sessions — RESOLVED.** The plan originally claimed in-memory-only; R5 audit verified this is WRONG — the flag is serialized via `SupabaseCheckpointStore.save()` because it sits inside `profile.improvementManifest` which is persisted as JSONB. **Action**: Scope 3 Item 6 modifies `SupabaseCheckpointStore.save()` to exclude `improvementManifest._enriched` from serialization via a JSON replacer that skips the key (2-line change). Alternative considered: track `_enrichedCollegeId: string | null` and re-run enrichment when `collegeId` changes between sessions (preserves idempotency for unchanged-college case). Without this fix, enrichment NEVER re-runs when the research DB updates OR when the student switches `collegeId` mid-thread — those students are stuck with the pre-switch enrichment forever. This is a data-flow correctness fix, not an optimization.
9. **[Scope 3] Export `ROUTE_TO_ISSUE_TYPE` / `OBSERVATION_KEYWORD_TO_ISSUE` tables for testability** — currently module-private. Consider `__testing` namespace if table inspection is needed.
10. **[Scope 3] `researchBacking.citationId` write-without-reader** — no downstream consumer currently. Write it anyway (cheap) and remove in 3-month cleanup if unused.
11. **[Cross-scope] Three-way TECHNIQUE_ROUTES duplication** — `coachingService.ts`, `techniqueMatcher.ts` (Scope 1), `techniqueVocabulary.ts` (Scope 2). Long-term consolidation needed.
12. **[Cross-scope] L5 token budget** — combined ~6800 tokens. Monitor cache hit rate; trim if it drops.

---

## Unaddressed Audit Findings

Out of 26 findings in `docs/PIPELINE_ARCHITECTURE_AUDIT.md`, 6 are resolved by the unified plan and **20 are NOT addressed**. The unaddressed findings fall into four buckets:

### Bucket 1: Pipeline cost/architecture fixes requiring separate scoping

- **F1 (L4 context bloat, 120K→5-8K)** — Scope 1 reduces L4 input by compressing a few fields, but the real fix is profile router changes that wholesale reduce the context passed to L4. Not in scope.
- **F2 (L3.5 mode selection for architecture phase)** — a mode gate change, not a prompt/schema fix. Separate scope.
- **F3 (re-read selectivity)** — confidence threshold tuning. Separate scope.
- **F4 (L3 full essay text in every paragraph call)** — caching/chunking fix. Separate scope.
- **F7 (L2 Haiku downgrade)** — A/B test on L2 model choice. Separate scope.
- **F9 (budget enforcement)** — hard cap infrastructure. Separate scope.

**Future scope:** "Pipeline cost optimization" — P0 findings from the audit (F1/F2/F3) with an estimated $0.50/essay savings.

### Bucket 2: Quality/content bugs requiring investigation

- **F5 (Understanding prose synthesis failed silently)** — likely a parse bug. Listed as P0 in the audit but requires debugging, not planning.
- **F8 (55 connections, most trivial)** — connection significance threshold needs tuning.
- **F10 (Quality grading gaps)** — broken grading logic.

**Future scope:** "Pipeline quality fixes" — debugging-driven, not plannable in advance.

### Bucket 3: Coaching-loop behavior (out of scope for analysis pipeline)

- **F12 (Meta-coaching loop, T6-T9)** — coaching conversation state machine issue.
- **F14 (Zero student-written prose coached)** — session structure.
- **F16 (Coach overrides student agency 3 times)** — coaching voice.
- **F17 (One-insight-per-turn rule violated)** — prompt enforcement.
- **F21 (System reads intention into incidental choices)** — pedagogy / overfitting.
- **F24 (Coaching voice breaks under stress)** — coaching prompt robustness.
- **F25 (Coaching responses too long for 17-year-old)** — coaching prompt length.
- **F26 (No student writing during session)** — session structure.

**Future scope:** "Coaching loop redesign" — separate workstream. This plan improves what the coaching LLM sees (richer manifest, research-backed demos, college notes) but does not change coaching loop behavior itself.

### Bucket 4: UI / product features (not code-fix findings)

- **F22 (Powerful artifacts hidden from student)** — UI rendering fix.
- **F23 (No post-session deliverable)** — new feature.
- **F11 (partial)** — some profile intelligence gaps are UI, not analysis.
- **F15 (partial)** — admissions intelligence surfacing is partly UI.

**Future scope:** "Essay Intelligence UI surfacing" — separate product work.

### Summary

| Category | Count | Status |
|---|---:|---|
| Resolved by Scopes 1-3 | 6 | Complete plan |
| Pipeline cost/arch (future scope) | 6 | Scheduled next |
| Quality bugs (investigation-driven) | 3 | Debug queue |
| Coaching loop behavior | 8 | Separate workstream |
| UI / product features | 3 | Product backlog |
| **Total** | **26** | |

The 3-scope plan resolves the **architectural root cause** of F18/F19/F20 (description vs prescription, duplication, before/after missing) — which the audit identifies as the top-tier finding — while deferring independent cost/quality/UX workstreams to future scopes.
