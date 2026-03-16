# Essay Intelligence System — Full Remediation Plan

> **Purpose**: Bring every component of the Essay Intelligence system up to date with the evolved findings-based architecture. Fix broken pipelines, eliminate data loss, improve prompt quality, and unify the observation/findings lifecycle.
>
> **Companion to**: `PLAN.md` (authoritative architecture). This plan does NOT change the architecture — it completes the migration that the architecture requires.
>
> **Created**: 2026-03-14 | **Status**: IMPLEMENTATION COMPLETE (all 25 items across 4 waves)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Complete Issue Registry (30 items)](#complete-issue-registry)
4. [Wave 0: Prompt Quality Fixes](#wave-0-prompt-quality-fixes)
5. [Wave 1: Context Enrichment](#wave-1-context-enrichment)
6. [Wave 2: Format Migration](#wave-2-format-migration)
7. [Wave 3: Architecture Completion](#wave-3-architecture-completion)
8. [Dependency Graph & Execution Order](#dependency-graph--execution-order)
9. [Type Safety Strategy](#type-safety-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Risk Matrix](#risk-matrix)
12. [Swarm Execution Plan](#swarm-execution-plan)

---

## Problem Statement

The Essay Intelligence system evolved from **observation arrays** (`observedFunctions[]`, `inferredIntents[]`, `narrativeContributions[]`) to a **findings-based architecture** (`primaryFunction` + `Finding[]` in centralized `FindingStore` + prose understanding). The L3 walk now produces rich output — `primaryFunction`, `significance`, `tags`, `craft.techniques`, `significantChoices`, structured `Finding` objects — but most consumers still read the deprecated observation arrays through a lossy bridge.

**The bridge pattern** (`sequentialDeepWalk.ts:1057-1062`) synthesizes a single fake `ObservationEntry` from `primaryFunction` with placeholder evidence `'(derived from primaryFunction)'` and hardcoded `confidence: 1.0`. Two arrays (`inferredIntents`, `narrativeContributions`) are always empty in Phase 1. This creates cascading quality loss through 14 consumer files.

**Beyond the bridge**, the audit found:
- **2 BROKEN pipelines** (coaching precision supersession, observation↔findings lifecycle disconnect)
- **6 DEGRADED consumers** (L3.5, L3.75, focused analyzer, deep dive runner, re-reader, profile router)
- **3 categories of paid LLM output being discarded** (tags, craft.techniques, significantChoices — never read by any consumer)
- **1 Rule 2 violation** (L5 annotation filter destroys paid output based on character count)
- **1 anti-contamination violation** (deep dives produce `coachingValue` — an analysis-layer concept in an understanding-layer tool)
- **Multiple prompt quality issues** (L1 evaluative leaks, L2 banned fallback, phase assessment silent failures, calibration redundancy)
- **Type system inconsistencies** (export name mismatch, optional/required confusion, no finding↔sentence linkage)

---

## Root Cause Analysis

1. **Migration in progress**: Phase 1 is a live transition from Phase 0 (observation arrays) to Phase 1 (primaryFunction + findings). The bridge was a short-term compat measure that became permanent.
2. **Findings stored centrally**: The decision to centralize findings in `FindingStore` broke the local-reference pattern. Sentences have no `findingRefs` field to navigate to their findings.
3. **Backward compatibility debt**: Consumers still expect observation arrays, so the bridge generates fake ones. New consumers read findings, old consumers read observations — two parallel systems with no sync.
4. **Unused walk output**: `tags`, `craft.techniques`, `significantChoices` were built in anticipation of L5 sophistication that hasn't arrived yet.
5. **Prompt evolution lagged behind data evolution**: Prompts still reference old data shapes, show old examples, and assemble impoverished context.

---

## Complete Issue Registry

### BROKEN (must fix before shipping)

| ID | Issue | File(s) | Impact |
|----|-------|---------|--------|
| B1 | Coaching precision supersession dead — `inferredIntents` empty → `gatherTargetedObservations()` returns nothing → Stage 4 falls to blunt replace | `coachingService.ts:1299-1410, 2614-2649` | Student corrections destroy confirmed observations instead of surgical update |
| B2 | Observations ↔ Findings disconnected — coaching supersedes findings but doesn't update observations; mutations update observations but don't mark findings stale | `sentenceMutator.ts`, `coachingService.ts`, `profileTypes.ts` | Profile state diverges between two parallel systems |
| B3 | Deep dive prompts produce `coachingValue` — analysis-layer judgment in understanding-layer tool | `deepDivePromptLibrary.ts`, `deepDiveRunner.ts:431` | Anti-contamination violation |

### HIGH SEVERITY DEGRADATION

| ID | Issue | File(s) | Impact |
|----|-------|---------|--------|
| H1 | voiceMap completely omitted from L3.5 context — only voiceIdentity summary included | `analysisPass.ts:512-520` | L3.5 re-derives voice analysis from scratch |
| H2 | Earning mechanisms shown as count only ("3 mechanisms") — not detailed | `analysisPass.ts:591-599` | L3.5 cannot evaluate earned-ness with specificity |
| H3 | Walk's `tags`, `craft.techniques`, `significantChoices` never read by any consumer | `sequentialDeepWalk.ts` → nowhere | Paid LLM output completely discarded |
| H4 | L5 annotation filter destroys annotations with `northStarConnection.length < 10` | `deepAnnotationService.ts:348-368` | Rule 2 violation — paid output deleted, no regeneration |
| H5 | Findings not linked back to sentences — no `findingRefs` on `SentenceUnderstanding` | `profileTypes.ts:333-382` | Every consumer must rebuild sentence→finding mapping |
| H6 | L1 evaluative leaks — field-level guidance weaker than role-level banned words | `firstImpressions.ts:86-97` | Evaluation contaminates L3 walk input context |
| H7 | Focused analyzer generates fake observations + produces zero new findings | `focusedAnalyzer.ts:1200-1221` | Synthetic data propagates; edit insights lost |

### MEDIUM SEVERITY DEGRADATION

| ID | Issue | File(s) | Impact |
|----|-------|---------|--------|
| M1 | L3.5 gets sparse sentence understanding — only primaryFunction + significance | `analysisPass.ts:626-641` | Missing significantChoices, emotionalInflection |
| M2 | L3.75 context uses observation arrays instead of primaryFunction + findings | `holisticSynthesis.ts:750-786` | Impoverished synthesis input |
| M3 | fullContextReReader prompts still expect old format (3 observation arrays) | `fullContextReReader.ts:120-127, 541-556` | Re-reads produce old-format data |
| M4 | deepDiveRunner builds context from old observation arrays | `deepDiveRunner.ts:376-382` | Deep dives get impoverished context |
| M5 | Re-read findings orphaned — no caller absorbs them into profile | `fullContextReReader.ts → reanalysisOrchestrator.ts` | Re-read insights discarded |
| M6 | Scout output unused by walk — no code consuming scout leads | `scoutPass.ts → sequentialDeepWalk.ts` | Scout tokens wasted |
| M7 | Phase assessment silent fallback — returns 'foundation' on failure, no degradation flag | `phaseAssessment.ts:394-411` | Hides upstream failures |
| M8 | L2 structural cartographer uses banned "development" role as fallback | `structuralCartographer.ts:195-200` | Invalid roles propagate downstream |
| M9 | L3.5 calibration sections redundant (~170 lines with 3 overlapping sections) | `analysisPass.ts:311-481` | Prompt attention diluted |
| M10 | L3.75 anti-contamination lacks concrete examples | `holisticSynthesis.ts:238-258` | Circumlocution bypasses word ban |
| M11 | L3.75 evolution scaffold doesn't explain 4/10 coverage gap | `holisticSynthesis.ts:834-857` | LLM over-anchors on scaffolded sections |
| M12 | `correctInferredIntent()` appends instead of erroring when observation not found | `sentenceMutator.ts:478-517` | Silent data accumulation |
| M13 | `addArrow()` silent failure on empty moments array | `earnednessMutator.ts:368-405` | Coaching insights lost |
| M14 | Connection duplicate detection mutates inside helper, overwrites original description | `connectionMutator.ts:111-132` | Bidirectional upgrade loses forward description |
| M15 | Type export name mismatch: `NorthStar` exported but actual type is `EssayNorthStar` | `index.ts:23` | Potential compilation failure |
| M16 | `findings?: Finding[]` optional but always initialized as `[]` | `profileTypes.ts:1704` | Inconsistent optionality |
| M17 | Deep dive prompt uses `"low"` but valid enum is `"contextual"` | `deepDivePromptLibrary.ts:48` | LLM produces invalid value, silently coerced |

---

## Wave 0: Prompt Quality Fixes

> **Theme**: Improve LLM output quality without changing data structures. All items are independent and parallelizable.

### W0.1 — L1 Anti-Evaluative Field Guidance

**File**: `firstImpressions.ts` | **Lines**: 86-97 | **Complexity**: S | **Risk**: Low

**Current**: Banned words list is strong at role level, but `apparentPurpose`, `voiceObservation`, and `tags` fields have only parenthetical hints, no concrete correct/incorrect examples.

**Spec**:
- After line 97 (end of field definitions), add `FIELD-SPECIFIC EXAMPLES (correct vs incorrect)`:
  - **apparentPurpose** — CORRECT: "This paragraph introduces a physical setting through sensory details — the sound of a cash register, the smell of leather — and places the narrator inside a specific location." WRONG: "This paragraph effectively establishes the scene and draws the reader in with vivid sensory language."
  - **voiceObservation** — CORRECT: "The narrator uses short declarative sentences, avoids adjectives, and addresses the reader in second person. The rhythm is staccato." WRONG: "The narrator's voice is refreshingly direct and achieves a compelling conversational tone."
  - **tags** — Add: "Tags should be CONTENT labels (what is discussed) not QUALITY labels. Use 'family-dinner', 'violin-practice', 'code-switching' — NOT 'powerful-moment', 'vivid-scene', 'strong-opening'."
- ~12 lines added to cacheable system prompt (~150 tokens on write, negligible on cache reads)

**Why**: Haiku benefits disproportionately from field-local examples. Per-field contrast pairs adjacent to field definitions are 2-3x more effective than distant general examples for smaller models.

---

### W0.2 — L2 Structural Cartographer Banned Fallback Fix

**File**: `structuralCartographer.ts` | **Lines**: 188-201 | **Complexity**: S | **Risk**: Low

**Current**: On paragraph role count mismatch, pads with `role: 'development'` — which is on the BANNED ROLE LABELS list at line 108 of the same file's prompt.

**Spec**:
- Replace fallback role with sentinel: `role: '[STRUCTURAL ROLE NOT ASSESSED — L2 paragraph count mismatch]'`
- Replace fallback narrativeFunction: `'[Not assessed — paragraph was missing from L2 output]'`
- Replace fallback strengthContribution: `'[Not assessed — requires L2 re-analysis]'`
- Upgrade `console.warn` at line 186 to `console.error` with essay paragraph count and LLM-returned count

**Why**: Downstream L3 walk that reads `role: 'development'` treats it as real analysis, compounding errors through L3.75 and L3.5. Sentinel strings are obviously non-real and force downstream to handle missing data.

---

### W0.3 — Phase Assessment Degradation Flags

**File**: `phaseAssessment.ts` | **Lines**: 45, 188-247, 394-473 | **Complexity**: M | **Risk**: Medium

**Current**: On empty analyses or LLM failure, silently returns `phase: 'foundation'` with `cost: 0`. No flag distinguishing genuine assessment from default fallback. `buildHolisticDigest` accesses sub-fields like `ta.thesisConfidence` without null checks.

**Spec**:
1. Add to `PhaseAssessmentResult` interface (line 45):
   ```
   isDegraded: boolean
   degradationReason?: string
   ```
2. Set `isDegraded: true` in both fallback paths (lines 396, 458). Set `isDegraded: false` in success path.
3. Guard all sub-field access in `buildHolisticDigest` (lines 188-247):
   - `ta.thesisConfidence`: guard with `if (typeof ta.thesisConfidence === 'number')`
   - `ta.threads`: guard with `if (Array.isArray(ta.threads) && ta.threads.length > 0)`
   - Same pattern for `ns.pivotPoints`, `ca.strengthSignatures`, `ca.growthEdges`, `cr.valuesRevealed`, `ap.distinctivenessFactors`, `ap.redFlags`
4. Update 3 callers: `analysisPass.ts:1002`, `analysisPass.ts:1183`, `focusedAnalyzer.ts:1708`

**Why**: Without `isDegraded`, downstream consumers (L5 feedback, L6 coaching) receive a foundation phase assessment indistinguishable from a genuine one. Students get "Your essay is at foundation phase" when they should get "Analysis failed, please retry."

---

### W0.4 — L3.5 Calibration Consolidation

**File**: `analysisPass.ts` | **Lines**: 311-481 | **Complexity**: M | **Risk**: Medium

**Current**: ~170 lines with 3 overlapping calibration sections: ANTI-CLUSTERING RULES (324-329), CALIBRATION EXAMPLES (331-343), and ESSAY-SPECIFIC CALIBRATION (407-424). sentenceRanking duplicated at line 481.

**Spec** (target ~120 lines, same signal):
1. **Merge SCORING CALIBRATION + CALIBRATION EXAMPLES** — table then examples, no interruption. New section: ~35 lines.
2. **Merge ANTI-CLUSTERING RULES into ESSAY-SPECIFIC CALIBRATION** — rename to `PRE-SCORING CALIBRATION (mandatory before scoring any sentence)`. Keep 4 rules as bullets, then ceiling/floor/gap reflection. Remove redundant rule #2. New section: ~20 lines.
3. **Fold EVIDENCE REQUIREMENTS into EVALUATION METHOD** — steps 5 and 6 already say "with SPECIFIC text evidence" — fold 3 evidence rules as sub-bullets.
4. **Remove sentenceRanking final note** (line 481) — duplicates step 2.

**Why**: Related calibration concepts co-located produce better Sonnet attention. "Wall of rules" effect is reduced. ~50 token savings per cache write.

**Testing**: Run `test-l35-score-audit.ts` before and after on same essay. Verify score distribution is not materially different.

---

### W0.5 — L3.75 Anti-Contamination + Evolution Scaffold

**File**: `holisticSynthesis.ts` | **Lines**: 238-258, 834-861 | **Complexity**: S | **Risk**: Low

**Current**: SHARED_PREAMBLE has banned vocabulary list but no contrast examples. Evolution scaffold lists 4 walk fields but doesn't explain that remaining 6/10 holistic sections have NO scaffold.

**Spec**:
1. After line 252, add contamination contrast examples:
   - CONTAMINATED: `"The writer has a particularly authentic and engaging conversational style"`
   - CLEAN: `"The writer uses second-person address in reflective passages and switches to fragmented, staccato sentences during action sequences. The vocabulary draws from two registers: clinical medical terminology and informal family speech."`
2. Replace lines 857-858 with explicit coverage-gap instruction:
   ```
   COVERAGE NOTICE: The walk tracked only 4 signals:
     1. centralThesis → thematicArchitecture
     2. thesisConfidence → thematicArchitecture.thesisConfidence
     3. voiceSignature → voiceIdentity.signature
     4. arcMomentum → narrativeStrategy.arcMomentum

   The remaining sections (voiceMap, emotionalTopography, momentEarnednessMap,
   characterRevelation, craftAssessment, admissionsPositioning, entanglements)
   have NO scaffold — synthesize entirely from paragraph-level understanding.
   ```

**Why**: Sonnet can avoid banned words through circumlocution. Concrete before/after examples teach the PATTERN. Coverage-gap instruction prevents over-anchoring on 4 scaffolded sections.

---

### W0.6 — LLM JSON Parser Diagnostics

**File**: `llmJsonParser.ts` | **Lines**: 129-199 | **Complexity**: S | **Risk**: Low

**Current**: On total parse failure, error message shows "First 200 chars" with no indication of which strategies failed or why.

**Spec**:
1. Add `breadcrumbs: string[]` to `parseJsonString`. Each strategy appends: `S1:direct→S1:FAIL(Unexpected token at pos 847)`.
2. Return `{ result, breadcrumbs } | null` (internal change, not exported).
3. Include breadcrumb trail in error messages.
4. Add "Last 200 chars" and "Input length: N chars" to error message.

**Why**: Critical path component used by every analysis layer. Breadcrumb trail turns opaque failure into actionable chain of diagnoses. Essential for self-fixing error recovery.

---

## Wave 1: Context Enrichment

> **Theme**: Feed rich data that ALREADY EXISTS to consumers that currently don't see it. All items are additive — no data structures change, no output formats change.

### W1.1 — Add voiceMap to L3.5 Context

**File**: `analysisPass.ts` | **After line 520** | **Complexity**: S | **Risk**: Low

**Current**: `buildProfileContext()` renders `voiceIdentity` (signature, register, evolution, distinctivePatterns) but completely skips `voiceMap` (5 dimensions × N observations with location data).

**Spec**:
- After the `if (profile.voiceIdentity)` block (line 520), add `if (profile.voiceMap)` block:
  - Render 5 dimension baselines (register, vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition)
  - Render stability regions (max 3): `Paragraphs [P0,P1,P2]: ${voiceCharacter}`
  - Render voice shifts (ALL — these are most valuable): location, shifting dimensions, from/to description, intentionality assessment + confidence
  - Render code-switching events (max 3): location, language, cultural function
- Truncation: If total voiceMap rendering exceeds 1500 chars, truncate observations arrays first. Never truncate shifts.
- Also add compact voiceMap section to `deepAnnotationService.ts:renderHolisticContext()` after line 969 (baselines + shifts only, ~500 chars)

**Dependencies**: W0.5 (L3.75 must produce clean voiceMap)

---

### W1.2 — Expose Earning Mechanisms

**File**: `analysisPass.ts` | **Lines**: 591-601 | **Complexity**: S | **Risk**: Low

**Current**: Shows `[${moment.mechanisms.length} earning mechanism(s)]` — a count. Actual `EarningMechanism` objects (type, contribution, location) are invisible.

**Spec**:
- Replace count-only line with per-mechanism detail lines:
  ```
  Mechanism: ${mech.type} from P${mech.location.paragraph}S${mech.location.sentence}: ${mech.contribution.substring(0, 120)}
  ```
- Also update `deepAnnotationService.ts:renderEarnednessMap()` (line 1057) to include `contribution` field
- Also update `deepAnnotationService.ts:getEarnednessContext()` (lines 1123-1131) to list mechanisms when paragraph contains a significant moment

**Dependencies**: None

---

### W1.3 — Wire Sentence Tags to L5

**File**: `deepAnnotationService.ts` | **Complexity**: S | **Risk**: Low

**Current**: `SentenceUnderstanding.tags` (semantic tags like `"opening_hook"`, `"emotional_peak"`) are populated by L3 but never read by L5.

**Spec**:
1. In sentence detail section (after line 851): If `s.understanding.tags?.length > 0`, push `Tags: [${tags.join(', ')}]`
2. At paragraph level (after line 813): Add SENTENCE TAG MAP showing which sentences carry notable tags
3. In system prompt (after line 579): Add guidance explaining what tags mean and how to use them for annotation calibration
4. Tags inform but do NOT constrain annotation density (LLM-first design: LLM owns judgment)

**Dependencies**: None

---

### W1.4 — Wire craft.techniques to L5

**File**: `deepAnnotationService.ts` | **Complexity**: S | **Risk**: Low

**Current**: `SentenceCraft.techniques` (e.g., "anaphora", "juxtaposition") populated by L3, never read by L5.

**Spec**:
1. In sentence detail (after function line, line 851): `Craft: [${techniques.join(', ')}] rhythm=${rhythm}`
2. Only for craft/polish/distinction phases (already guarded by line 831 phase check)
3. In system prompt: Add guidance to reference techniques by name in annotations

**Dependencies**: None

---

### W1.5 — Wire significantChoices to L5

**File**: `deepAnnotationService.ts` | **Complexity**: S | **Risk**: Low

**Current**: `significantChoices: Array<{word, significance}>` populated by L3, never read by L5.

**Spec**:
1. In sentence detail: `Notable words: "${w.word}" (${w.significance.substring(0, 80)}); ...`
2. For craft/polish/distinction phases. Polish phase especially — word-level precision is the focus.
3. In system prompt (Polish phase description lines 92-96): Add note about notable words as prime annotation targets.

**Dependencies**: W1.4 (same code block, implement together)

---

### W1.6 — Fix Annotation Filtering (Rule 2 Violation)

**File**: `deepAnnotationService.ts` | **Lines**: 348-368 | **Complexity**: M | **Risk**: Medium

**Current**: `northStarConnection.trim().length < 10` → annotation DELETED. Legitimate connections like "Voice" (5 chars) destroyed. No regeneration.

**Spec**:
1. **Remove destructive filter.** Delete `pa.annotations = pa.annotations.filter(...)`.
2. **Replace with semantic grounding diagnostic.** Add `groundingQuality: 'grounded' | 'weakly_grounded' | 'ungrounded'` field to annotation.
3. **Semantic check**: `'grounded'` = contains P-reference, structural role, through-line, or essay element (`/(P\d|through.line|structural|fulcrum|arc|earning|voice|theme)/i`). `'weakly_grounded'` = non-empty, >= 10 chars, no architectural vocabulary. `'ungrounded'` = empty/null or < 10 chars.
4. **Log diagnostics, don't filter.** If ungrounded > 30%, log prompt quality warning.
5. Add `groundingQuality?: 'grounded' | 'weakly_grounded' | 'ungrounded'` to L5Annotation interface.
6. Set during `validateAnnotations()` (lines 1388-1419).

**Dependencies**: Deploy after W1.1-W1.5 (enriched context reduces ungrounded annotations at source)

---

## Wave 2: Format Migration

> **Theme**: Update all consumers to read the new findings-based data model instead of deprecated observation arrays.

### W2.1 — L3.5 Reads Findings as Primary Source

**File**: `analysisPass.ts` | **Lines**: 626-658 (Block 2), 700-788 (Block 3) | **Complexity**: S | **Risk**: Medium-High

**Current**: Block 2 (`buildProfileContext`) already reads `primaryFunction` with observation fallback — this is correct. Block 3 (`buildParagraphPrompt`) lists sentences as raw text without per-sentence understanding or findings.

**Spec**:
1. In `buildParagraphPrompt` (Block 3, lines 726-731): After each `[S${i}] "${text}"`, add:
   - `[Function: ${primaryFunction}, significance: ${significance}]` (if present)
   - `[Tags: ${tags.join(', ')}]` (if present)
2. Replace `buildParagraphFindingContext` with `buildAnnotationFindingContext` for [F] labels matching system prompt expectations
3. Keep `else` fallback reading `observedFunctions` for pre-Phase-1 profiles

**Dependencies**: W1.1, W1.2 (voiceMap/mechanisms in context first)

---

### W2.2 — L3.75 Reads primaryFunction + Findings

**File**: `holisticSynthesis.ts` | **Lines**: 750-828 | **Complexity**: S | **Risk**: Low

**Current**: `buildUnderstandingContext()` reads `primaryFunction` when present (Phase 2 branch), falls back to observation arrays. Does NOT include craft.techniques, tags, or findings.

**Spec**:
1. After primaryFunction line, add craft techniques and tags per sentence
2. Extend function signature to accept optional `FindingStore`
3. After connection graph section (line 825), inject `buildFindingReferenceContext(findingStore)` for global finding context
4. Keep observation array fallback for pre-Phase-1 profiles

**Dependencies**: W0.5 (clean L3.75 first)

---

### W2.3 — fullContextReReader Produces Findings Format

**File**: `fullContextReReader.ts` | **Lines**: 116-142, 219-223, 538-571 | **Complexity**: M | **Risk**: Medium

**Current**: Prompt template (lines 116-142) asks for `observedFunctions`, `inferredIntents`, `narrativeContributions`. Coercion (lines 538-571) parses into old arrays. Original sentence formatting (lines 219-223) uses old arrays.

**Spec**:
1. **Update prompt template**: Replace 3 observation arrays with `primaryFunction`, `significance`, `craft`, `tags`, `significantChoices`
2. **Update coercion** (`coerceSentenceUnderstanding`): Read `primaryFunction` first; if present, use it. If absent, fall back to `observedFunctions`.
3. **Update original sentence formatting**: Show `Function: ${primaryFunction}`, `Significance: ${significance}`, `Craft: ${techniques.join(', ')}`, `Tags: ${tags.join(', ')}`
4. Bridge: keep synthesizing `observedFunctions` from `primaryFunction` until all consumers migrated

**Dependencies**: profileTypes.ts Finding type (already exists)

---

### W2.4 — Deep Dive Runner Uses New Format

**File**: `deepDiveRunner.ts` | **Lines**: 351-399 | **Complexity**: S | **Risk**: Low

**Current**: `buildParagraphContext` reads `observedFunctions.map(f => f.observation)` and `inferredIntents`. Empty in Phase 1.

**Spec**:
1. Replace observation reading with: `Function: ${primaryFunction} [${significance}]`
2. Add `Craft: [${techniques.join(', ')}]` and `Tags: [${tags.join(', ')}]`
3. Remove `inferredIntents` and `narrativeContributions` reading
4. Keep observation fallback for pre-Phase-1 profiles
5. Per-paragraph finding context already available via `buildFindingReferenceContext` in parent prompt

**Dependencies**: W2.2 (align with L3.75 format expectations)

---

### W2.5 — Focused Analyzer Produces Findings

**File**: `focusedAnalyzer.ts` | **Lines**: 762-829, 1199-1221 | **Complexity**: L | **Risk**: Medium-High

**Current**: Generates fake observations (`observedFunctions = [{ observation: primaryFunction, confidence: 1.0, evidence: '(derived from primaryFunction)' }]`). Produces zero new findings. Finding context built for understanding step but NOT passed to analysis step.

**Spec**:
1. **Keep observation bridge during implementation** — remove in follow-up after W2.1-W2.4 verified
2. **Add `newFindings` to focused understanding output schema** (lines 181-195): Optional array with `claim`, `scope`, `maturity`, `evidence`, `dimensions`, `deepeningPotential`, `raisesQuestions`
3. **Add `newFindings` to `FocusedUnderstandingDelta` interface** (lines 62-91)
4. **Update `parseUnderstandingDelta`** (lines 283-316): Parse and validate newFindings
5. **Process new findings through FindingStore** (after line 829): Generate ID, add to store with `source: 'edit_reanalysis'`
6. **Pass finding context to focused analysis prompt** (Step 2, lines 503-579): Add `findingContext` parameter

**Dependencies**: W2.1 (focused analysis must align with L3.5 format)

---

### W2.6 — Fix Deep Dive coachingValue Bug

**File**: `deepDivePromptLibrary.ts` | **Line**: 48 | **Complexity**: S | **Risk**: Very Low

**Current**: SHARED_OUTPUT_FORMAT says `"coachingValue": "critical" | "high" | "medium" | "low" | "diagnostic"`. But `FindingCoachingValue` type is `'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic'`. Value `"low"` is invalid — silently coerced to `"medium"`.

**Spec**: Change `"low"` to `"contextual"` in line 48.

**Design decision**: Keep coachingValue in deep dive prompts. It's about finding utility, not essay quality. The LLM producing the finding has the best context for estimating coaching value at creation time.

**Dependencies**: None

---

### W2.7 — Add findingRefs to SentenceUnderstanding

**File**: `profileTypes.ts` | **Lines**: 333-382 | **Complexity**: M | **Risk**: Medium

**Current**: `SentenceUnderstanding` has `connectionRefs: string[]` for graph refs but no `findingRefs` for findings.

**Spec**:
1. Add `findingRefs: string[]` to `SentenceUnderstanding` (after `connectionRefs`). Required, not optional (follows same pattern).
2. Add `findingRefs: []` to `ensureUnderstanding` in `sentenceMutator.ts` (line 63-80)
3. Add mutation support in `applySentenceUnderstanding` following `connectionRefs` pattern (line 200)
4. Populate during walk: After findings committed to FindingStore, call `deriveSentenceParticipation` for each sentence and apply refs
5. Recompute at checkpoint boundaries: Add `recomputeAllFindingRefs(profile, findingStore)` utility
6. Update `coerceSentenceUnderstanding` in `fullContextReReader.ts` — always `findingRefs: []` (system-derived, not LLM-produced)
7. Update focused analyzer's empty understanding creation (line 1200-1211)
8. Add migration: when loading profile without `findingRefs`, initialize to `[]`

**Blast radius**: Breaking type change — every constructor of SentenceUnderstanding must add `findingRefs: []`. Use `tsc --noEmit` to find all sites.

**Dependencies**: None (additive foundation — do first in Wave 2)

---

## Wave 3: Architecture Completion

> **Theme**: Fix broken pipelines, unify observation/findings lifecycle, clean up type system.

### W3.1 — Fix Coaching Precision Supersession

**File**: `coachingService.ts` | **Lines**: 1299-1410, 1449-1451, 2515-2554 | **Complexity**: M | **Risk**: Low-Medium

**Current**: Coaching already routes through `gatherTargetedFindings` (not observations). Stage 4 `runReinterpretationDeepening` correctly supersedes findings via `findingStore.updateMaturity()`. BUT: after superseding findings, it does NOT reverse-propagate to update sentence-level understanding.

**Spec** (Option A — bridge approach for immediate fix):
- After the finding supersession loop (lines 1557-1563), add a reverse-propagation step:
  - For each superseded finding, identify its scope sentences
  - For those sentences, synthesize updated `inferredIntents` from remaining active findings
  - Apply via `coordinator.applySentenceUnderstanding({ inferredIntents: [...] })`
- This keeps the coaching pipeline working with findings AS primary AND observations as secondary

**Why Option A over Option B** (full migration): Option A is a ~20-line addition to one function. Option B requires rewriting `gatherTargetedObservations`, the Stage 4 prompt, and the precision reconstruction logic — a much larger change that should wait for W3.2.

**Dependencies**: W0.3 (phase assessment flags for coaching context)

---

### W3.2 — Observations ↔ Findings Bidirectional Sync

**File**: `sentenceMutator.ts`, `coachingService.ts`, `essayProfileManager.ts` | **Complexity**: L | **Risk**: CRITICAL

**Current**: Two parallel systems with no sync. Coaching supersedes findings; mutations update observations. Profile state diverges.

**Spec** (gradual migration — NOT all-or-nothing):
1. **Phase A: Coexistence** — Both observations and findingRefs exist. Producers emit both. Consumers prefer findings when available, fall back to observations.
2. **Phase B: Consumer migration** — All consumers migrated to read findings (completed by W2.1-W2.5). Observation arrays become secondary.
3. **Phase C: Sync hooks** — When FindingStore changes, recompute affected sentences' observation bridges. When mutations change observations, mark related findings as `under_review`.
4. **Phase D (future, NOT in this remediation)**: Remove observation arrays from SentenceUnderstanding.

For this remediation, implement Phase A + Phase C (sync hooks).

**Dependencies**: W2.1, W2.3, W2.5, W2.7 (all producers must emit findings, findingRefs must exist)

---

### W3.3 — Silent Mutation Fixes

**Complexity**: S-M per fix | **Risk**: Medium

#### W3.3a — `correctInferredIntent` append-instead-of-error
**File**: `sentenceMutator.ts:478-517`
**Fix**: When observation text doesn't match, log warning with full context (paragraph, sentence, searched text, available texts). Do NOT append — the append creates accumulated intents. Return empty mutations array to signal the correction couldn't be applied.

#### W3.3b — `addArrow` silent failure on empty moments
**File**: `earnednessMutator.ts:368-405`
**Fix**: When `moments.length === 0`, return a specific mutation type `'earnedness_deferred'` instead of empty array. The coaching coordinator can queue this for processing after next L3.75 synthesis.

#### W3.3c — Connection `isDuplicate` mutation inside helper
**File**: `connectionMutator.ts:111-132`
**Fix**: Change `isDuplicate` to return `{ connection: Connection | null; isReverse: boolean }` without mutating. Move directionality upgrade to `addConnection()`. On reverse match, set `reverseIllumination = new description` but preserve original forward description.

**Dependencies**: None (each is independent)

---

### W3.4 — Re-read Findings Absorption

**File**: `analysisOrchestrator.ts` (growth cycle), `fullContextReReader.ts` | **Complexity**: M | **Risk**: Medium

**Current**: `runTargetedReRead()` returns `ReReadResult` with `findings` array, but no caller absorbs them into the profile's FindingStore. The growth cycle in `analysisOrchestrator.ts` calls re-reads but drops the findings.

**Spec**:
1. In the growth cycle (after re-read call), iterate `reReadResult.findings`
2. For each finding, add to FindingStore with `source: 'full_context_reread'`
3. Also apply `reReadResult.newConnections` to the connection graph
4. Log absorption count for diagnostics

**Dependencies**: W2.3 (reReader must produce findings format)

---

### W3.5 — Scout → Walk Wiring

**File**: `sequentialDeepWalk.ts`, `scoutPass.ts` | **Complexity**: M | **Risk**: Low-Medium

**Current**: Scout produces `ConnectionScoutOutput` (repeatedElements, tonalShifts, structuralEchoes). Walk has NO code consuming these. Scout tokens are wasted.

**Spec**:
1. In the walk's per-paragraph prompt assembly, add a "SCOUT LEADS" section
2. Filter scout output to only include leads relevant to the current paragraph (matching paragraph indices)
3. Format: `"L2.5 detected: repeated 'diamond' in P1S2 and P3S4 — investigate whether this builds the essay's core tension"`
4. Add scout leads to the walk's `holisticEvolution` accumulator context so later paragraphs see which leads were already investigated

**Dependencies**: None

---

### W3.6 — Type System Cleanup

**File**: `profileTypes.ts`, `index.ts` | **Complexity**: S | **Risk**: Low

**Spec**:
1. Fix export: `index.ts:23` — change `NorthStar` to `EssayNorthStar`
2. Change `findings?: Finding[]` to `findings: Finding[]` (always initialized as `[]`)
3. Verify `createInitialProfile()` in `essayProfileManager.ts` initializes `findings: []` (already does)

**Dependencies**: W2.6, W2.7, W3.2 (dependent type changes must land first)

---

## Dependency Graph & Execution Order

### Critical Path (longest chain)

```
W0.5 (L3.75 anti-contamination)
  → W1.1 + W1.2 (voiceMap + mechanisms into L3.5)
    → W2.1 (L3.5 reads findings)
      → W2.5 (focused analyzer produces findings)
        → W3.2 (observations-findings unification)
          → W3.6 (type system cleanup)
```

### Secondary Chains

```
W0.5 → W2.2 (L3.75 reads primaryFunction) → W2.4 (deepDive new format)
W0.3 → W3.1 (coaching precision fix)
W2.3 → W3.4 (re-read absorption)
```

### Fully Independent (can start anytime)

```
W0.1, W0.2, W0.6 (prompt fixes)
W1.3, W1.4, W1.5 (L5 context wiring)
W2.6 (deep dive bug fix)
W2.7 (findingRefs type addition)
W3.3 (silent mutation fixes)
W3.5 (scout-walk wiring)
```

### Full Dependency Matrix

```
W0.1 ─────────────> (none)
W0.2 ─────────────> (none)
W0.3 ─────────────> W3.1
W0.4 ─────────────> W1.1, W1.2 (consolidation before enrichment)
W0.5 ─────────────> W1.1, W1.2, W2.2
W0.6 ─────────────> (none)
W1.1 ─────────────> W2.1
W1.2 ─────────────> W2.1
W1.3-W1.5 ────────> (none)
W1.6 ─────────────> (none, but deploy after W1.3-W1.5)
W2.1 ─────────────> W2.5
W2.2 ─────────────> W2.4
W2.3 ─────────────> W3.4
W2.5 ─────────────> W3.2
W2.6 ─────────────> (none)
W2.7 ─────────────> W2.1, W3.2
W3.1 ─────────────> (none)
W3.2 ─────────────> W3.6
W3.3 ─────────────> (none)
W3.4 ─────────────> (none)
W3.5 ─────────────> (none)
W3.6 ─────────────> (none, LAST)
```

---

## Type Safety Strategy

### Phase A — Additive Changes (Safe, Do First)
1. **W2.7**: Add `findingRefs: string[]` to `SentenceUnderstanding` (breaking but mechanical — `tsc --noEmit` catches all sites)
2. **W0.3**: Add `isDegraded: boolean` to `PhaseAssessmentResult`
3. **W1.6**: Add `groundingQuality?` to L5Annotation

### Phase B — Soft-Breaking Changes (During Wave 2)
4. Fix `coachingValue` enum in deep dive prompt (W2.6 — prompt-only)
5. Any new Finding utility types needed

### Phase C — Gradual Migration (Wave 3)
6. **W3.2**: Coexistence — both observation arrays and findingRefs populated simultaneously
7. **W3.6**: Cleanup — `findings?: Finding[]` → `findings: Finding[]`, export name fix

### Phase D — Future (NOT in this remediation)
8. Make observation arrays optional on SentenceUnderstanding
9. Remove observation bridge from walk

---

## Testing Strategy

### Existing Tests as Regression Guards

| Test | Covers | Affected By |
|------|--------|-------------|
| `test-l3-depth-audit.ts` | L1 → L3 walk quality | W0.1, W0.5, W3.5 |
| `test-l35-score-audit.ts` | L3.5 score differentiation | W0.4, W1.1, W1.2, W2.1 |
| `test-l35-anti-clustering.ts` | L3.5 score spread | W0.4, W1.1, W1.2 |
| `test-l375-earned-voice-audit.ts` | L3.75 holistic synthesis | W0.5, W2.2 |
| `test-l5-teaching-audit.ts` | L5 annotation quality | W1.3-W1.6 |
| `test-l6-coaching-audit.ts` | L6 coaching | W3.1 |
| `test-finding-lifecycle.ts` | FindingStore CRUD | W2.3, W2.5 |
| `test-connection-graph.ts` | Connections | W3.5 |

### New Tests Needed

**Wave 0**:
- `test-l1-anti-eval-compliance.ts` — Run L1, scan output for banned evaluative words
- `test-l375-anti-contamination.ts` — Run L3.75, scan holistic sections for forbidden vocabulary

**Wave 1**:
- `test-l35-context-enrichment.ts` — Inspect L3.5 assembled context for voiceMap, mechanisms, findings
- `test-l5-context-enrichment.ts` — Inspect L5 context for tags, craft, significantChoices
- `test-l5-filter-regression.ts` — Generate annotations with short North Star connections, assert NOT filtered

**Wave 2**:
- `test-finding-flow-integration.ts` — End-to-end: L3 produces findings → L3.75 reads them → L3.5 sees them → L5 references them
- `test-focused-analyzer-findings.ts` — Edit essay, run focused analysis, assert findings produced
- `test-finding-refs-roundtrip.ts` — Verify findingRefs survive serialize/deserialize

**Wave 3**:
- `test-coaching-phase-precision.ts` — Run coaching at different phase levels, verify response focus
- `test-reread-absorption.ts` — Run growth cycle with re-reads, verify findings absorbed

### Quality Verification Protocol

Each wave: Run `test-l35-score-audit.ts` and `test-l375-earned-voice-audit.ts` on the same essay before and after. Compare:
- **W0**: Holistic sections should have fewer evaluative words. Scores should not change dramatically.
- **W1**: Scores may shift slightly (more context = better calibration). Check score spread (StdDev).
- **W2**: Finding references should appear in L3.5 output. L3.5 should reference findings by [F] ID.
- **W3**: Coaching responses should be more phase-specific. Type check must pass cleanly.

Final: `npx tsc --noEmit` must pass after every wave.

---

## Risk Matrix

| Item | Blast Radius | Incremental? | Test Coverage | Risk |
|------|-------------|-------------|---------------|------|
| W0.1-W0.2 | L1/L2 only | Yes (prompt) | test-l3-depth-audit | LOW |
| W0.3 | Phase → L5/L6 | Yes (additive) | Indirect | LOW |
| W0.4 | L3.5 scoring | No (refactor) | test-l35-score-audit | **MEDIUM** |
| W0.5-W0.6 | L3.75/parser | Yes (prompt) | test-l375 | LOW |
| W1.1-W1.2 | All scores | Yes (additive) | test-l35-score-audit | MEDIUM |
| W1.3-W1.5 | Annotations | Yes (additive) | test-l5-teaching | LOW |
| W1.6 | Annotations | Yes (filter) | test-l5-teaching | LOW |
| W2.1 | All scores + phase | Partially | test-l35-score-audit | **MEDIUM-HIGH** |
| W2.2-W2.4 | Holistic/deep dives | Yes | test-l375, none | MEDIUM |
| W2.5 | Edit re-analysis | Yes | None | **MEDIUM-HIGH** |
| W2.6 | Deep dive type | Yes | test-finding-lifecycle | LOW |
| W2.7 | All sentence consumers | Yes (additive) | tsc --noEmit | MEDIUM |
| W3.1 | Coaching | Yes | test-l6-coaching | LOW-MEDIUM |
| W3.2 | Everything | NO (big) | All tests | **CRITICAL** |
| W3.3 | Per-mutator | Per-fix | None | MEDIUM |
| W3.4 | Growth cycle | Yes | None | MEDIUM |
| W3.5 | L3 depth | Yes | test-l3-depth | LOW-MEDIUM |
| W3.6 | Everything | Last | tsc --noEmit | MEDIUM |

---

## Swarm Execution Plan

### Session 1 — Wave 0 (3 agents, all parallel)

| Agent | Items | Files | Est. Time |
|-------|-------|-------|-----------|
| A | W0.1 + W0.2 | firstImpressions.ts, structuralCartographer.ts | Fast |
| B | W0.3 + W0.4 | phaseAssessment.ts, analysisPass.ts | Medium |
| C | W0.5 + W0.6 | holisticSynthesis.ts, llmJsonParser.ts | Fast |

Gate: `npx tsc --noEmit` + run `test-l35-score-audit.ts` baseline

### Session 2 — Wave 1 + Early Wave 2 (4 agents)

| Agent | Items | Files | Blocks On |
|-------|-------|-------|-----------|
| A | W1.1 + W1.2 | analysisPass.ts (context builder) | W0.5 |
| B | W1.3 + W1.4 + W1.5 + W1.6 | deepAnnotationService.ts | Nothing |
| C | W2.7 | profileTypes.ts, sentenceMutator.ts, focusedAnalyzer.ts, fullContextReReader.ts | Nothing |
| D | W2.6 | deepDivePromptLibrary.ts | Nothing |

Gate: `npx tsc --noEmit` + run `test-l5-teaching-audit.ts`

### Session 3 — Wave 2 Core (3 agents)

| Agent | Items | Files | Blocks On |
|-------|-------|-------|-----------|
| A | W2.1 | analysisPass.ts (Block 3, findings) | W1.1, W1.2 |
| B | W2.2 | holisticSynthesis.ts (context) | W0.5 |
| C | W2.3 | fullContextReReader.ts | W2.7 |

Gate: `npx tsc --noEmit` + run `test-l35-score-audit.ts` + `test-l375-earned-voice-audit.ts`

### Session 4 — Wave 2 Completion + Wave 3 Start (5 agents)

| Agent | Items | Files | Blocks On |
|-------|-------|-------|-----------|
| A | W2.5 | focusedAnalyzer.ts | W2.1 |
| B | W2.4 | deepDiveRunner.ts | W2.2 |
| C | W3.1 | coachingService.ts | W0.3 |
| D | W3.3a + W3.3b + W3.3c | sentenceMutator.ts, earnednessMutator.ts, connectionMutator.ts | Nothing |
| E | W3.5 | sequentialDeepWalk.ts, scoutPass.ts | Nothing |

Gate: `npx tsc --noEmit` + run full test suite

### Session 5 — Wave 3 Completion (3 agents)

| Agent | Items | Files | Blocks On |
|-------|-------|-------|-----------|
| A | W3.4 | analysisOrchestrator.ts | W2.3 |
| B | W3.2 | sentenceMutator.ts, coachingService.ts, essayProfileManager.ts | W2.1, W2.3, W2.5, W2.7 |
| C | W3.6 | profileTypes.ts, index.ts | W3.2 |

Gate: `npx tsc --noEmit` + full test suite + quality comparison with Session 1 baseline

---

## Summary

| Wave | Items | Complexity | Key Outcome |
|------|-------|------------|-------------|
| **0** | 6 | 2M + 4S | Better prompts → better LLM output quality |
| **1** | 6 | 1M + 5S | Rich data reaches consumers → immediate quality lift |
| **2** | 7 | 1L + 3M + 3S | Consumers read findings → unified data model |
| **3** | 6 | 1L + 3M + 2S | Broken pipelines fixed → system coherent |
| **Total** | **25 items** | 2L + 9M + 14S | Complete system alignment |

**Estimated sessions**: 5 swarm sessions with 3-5 agents each. Critical path: W0.5 → W1.1 → W2.1 → W2.5 → W3.2 → W3.6 (6 sequential dependencies).

**The goal**: Every layer of the Essay Intelligence system reads the richest available data, produces findings in the unified format, and maintains bidirectional consistency between the observation legacy and findings future. No paid LLM output is discarded. No consumer reads impoverished data when rich data exists.
