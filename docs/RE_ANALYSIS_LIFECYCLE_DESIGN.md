# Re-Analysis Lifecycle: Unified Design Specification

> **Purpose**: Replace the two overlapping sections in PLAN.md ("Incremental Update: Re-Walk from Edit Point" and "Analysis Modes: Comprehensive vs Focused") with a single, unambiguous specification an engineer can implement without guesswork.
>
> **Status**: Design document. Brainstorms approaches, recommends one per area, and provides implementation-ready detail.

---

## Table of Contents

1. [Unified Decision Tree](#1-unified-decision-tree)
2. [L3.75 Holistic Synthesis Re-Run Rules](#2-l375-holistic-synthesis-re-run-rules)
3. [Focused Mode and Holistic Sections](#3-focused-mode-and-holistic-sections)
4. [Comprehensive Re-Analysis: Full Procedure](#4-comprehensive-re-analysis-full-procedure)
5. [Focused Re-Analysis: Full Procedure](#5-focused-re-analysis-full-procedure)
6. [Edge Cases](#6-edge-cases)
7. [Unified Specification: `handleTextChange`](#7-unified-specification-handletextchange)

---

## 1. Unified Decision Tree

### The Problem

The plan has two sections describing re-analysis behavior:

- **"Incremental Update"** (lines ~2116-2198): Describes re-walk-from-edit-point for content and structural edits. This is the "comprehensive" re-analysis procedure.
- **"Analysis Modes"** (lines ~2390-2607): Introduces focused mode as an alternative for small edits on deep profiles, with `selectAnalysisMode()` as the entry gate.

The relationship is implicit but never stated: comprehensive mode in the "Analysis Modes" section IS the incremental update procedure. The plan says this in one sentence ("This is the existing pipeline... it follows the incremental update strategy described in the previous section") but the reader has to cross-reference 200 lines of document to piece it together. Worse, there is no unified decision tree showing the COMPLETE flow from "text changed" to "profile updated."

### Approaches

**Approach A: Two-Stage Decision (Mode, then Variant)**
```
selectAnalysisMode() → comprehensive | focused
  comprehensive → selectComprehensiveVariant() → content_edit | structural_insert | structural_delete | structural_reorder
  focused → run focused pipeline
```
Pro: Clean separation. Each stage has a single responsibility.
Con: "Comprehensive" is doing double duty as both a mode name and a family of procedures.

**Approach B: Flat Classification (Single Decision)**
```
classifyChange() → full_rewalk | partial_rewalk | structural_rewalk | focused_word | focused_sentence | focused_paragraph
```
Pro: Every code path gets an explicit name. No ambiguity about what "comprehensive" means.
Con: More branches, more complex decision logic, harder to reason about.

**Approach C: Two-Stage with Explicit Sub-Modes (Recommended)**
```
selectAnalysisMode() → comprehensive | focused
  comprehensive:
    structural_edit → full structural procedure (remap + full rewalk)
    content_edit → incremental content procedure (rewalk from edit point, early-stop)
  focused:
    word_level → focused pipeline (1-2 Sonnet calls)
    sentence_level → focused pipeline (1-2 Sonnet calls, wider context)
    paragraph_level → focused pipeline (escalated, possible holistic refresh)
```
Pro: Preserves the clean two-mode split while making sub-modes explicit. The "comprehensive" mode contains exactly the incremental update logic already described. The "focused" mode maps to impact classification levels.
Con: Slightly more structure than Approach A, but eliminates all ambiguity.

### Recommendation: Approach C

The key clarification that resolves the overlap: **"comprehensive mode" IS the incremental update procedure.** It is NOT a full-from-scratch re-analysis. It re-uses everything it can (profile snapshots, unchanged paragraph understanding) but re-walks from the edit point forward. "Comprehensive" refers to the scope of profile rebuild (understanding walk + holistic synthesis + analysis pass), not "redo everything."

### The Complete Decision Tree

```
Student edits essay text
    │
    ▼
handleTextChange(profile, oldText, newText)
    │
    ├── 1. DIFF DETECTION
    │   diffEngine.diffText() → DiffResult
    │   ├── No changes → return existing profile (no cost)
    │   └── Changes detected → classify each change
    │
    ├── 2. CHANGE CLASSIFICATION
    │   Each change tagged: { type: 'structural' | 'content', paragraphs: number[],
    │                         textChangeRatio: number, sentencesAffected: number }
    │
    ├── 3. MODE SELECTION
    │   selectAnalysisMode(profile, changes) → 'comprehensive' | 'focused'
    │   │
    │   │  Rules (checked in order, first match wins):
    │   │  ┌─────────────────────────────────────────────────────────────────────┐
    │   │  │ Profile confidence < 'deep'                   → comprehensive     │
    │   │  │ Any structural change (insert/delete/reorder)  → comprehensive     │
    │   │  │ Multiple paragraphs with >30% text changed     → comprehensive     │
    │   │  │ Single paragraph with >30% text changed        → comprehensive     │
    │   │  │ Profile confidence >= 'deep' AND                                   │
    │   │  │   all changes are minor (<30% per paragraph)   → focused           │
    │   │  │ Default                                        → comprehensive     │
    │   │  └─────────────────────────────────────────────────────────────────────┘
    │   │
    │   ▼
    ├── 4a. COMPREHENSIVE MODE ─────────────────────────────────────────────────┐
    │   │                                                                       │
    │   ├── Structural edit?                                                    │
    │   │   YES → structural procedure (remap indices, full rewalk, full L3.75, │
    │   │          full L3.5, full L4+L5)                                       │
    │   │   NO  → content edit procedure (rewalk from edit point, early-stop    │
    │   │          check, conditional L3.75, scoped L3.5, L4+L5)               │
    │   │                                                                       │
    │   └── → Updated profile (all layers refreshed as needed)                  │
    │                                                                           │
    └── 4b. FOCUSED MODE ───────────────────────────────────────────────────────┐
        │                                                                       │
        ├── Impact classification (Haiku)                                       │
        ├── Focused understanding update (Sonnet)                               │
        ├── Focused analysis update (Sonnet)                                    │
        ├── Ripple check → escalation ladder                                    │
        │   ├── No ripple → done                                                │
        │   ├── Paragraph ripple → paragraph-level refresh                      │
        │   ├── Holistic ripple → targeted holistic section refresh              │
        │   └── Full cascade → escalate to comprehensive mode                   │
        │                                                                       │
        └── → Updated profile (surgical, minimal disturbance)                   │
                                                                                │
    BOTH MODES (post-update):                                                   │
        ├── Re-compute ImprovementPhase                                         │
        ├── Re-generate L5 feedback (affected paragraphs)                       │
        ├── Update ProfileIndex                                                 │
        └── Persist to DB                                                       │
```

---

## 2. L3.75 Holistic Synthesis Re-Run Rules

### The Problem

L3.75 Holistic Synthesis populates 7 major sections of the profile: voice identity, emotional topography, thematic architecture, narrative strategy, character revelation, craft assessment, and admissions positioning. After a comprehensive re-walk, these sections are potentially stale -- they were computed from the OLD sentence-level understanding. But the plan never specifies WHEN L3.75 should re-run during re-analysis.

This is the biggest gap in the re-analysis design.

### Approaches

**Option A: Always Re-Run L3.75 After Any Comprehensive Re-Walk**

- Procedure: After the understanding walk completes (whether full re-walk or partial from edit point), always run the L3.75 holistic synthesis call.
- Pro: Simple rule. Always fresh. Zero risk of stale holistic sections.
- Con: Costs $0.02-0.04 per re-analysis even when unnecessary. For a content edit in P5 that only changes one sentence's word choice but triggers comprehensive mode (e.g., because profile is still 'developing'), the holistic sections probably didn't change.
- Cost impact: +$0.02-0.04 per comprehensive re-analysis. Negligible in isolation, but adds up across a multi-round session.

**Option B: Re-Run L3.75 Only When `holisticEvolution` Changed During Re-Walk**

- Procedure: After the understanding re-walk, check whether ANY re-walked paragraph produced non-empty `holisticEvolution` (centralThesis, thesisConfidence, voiceSignature, arcMomentum changes). If yes, re-run L3.75. If all re-walked paragraphs had empty `holisticEvolution`, skip.
- Pro: Saves $0.02-0.04 when the edit was localized and didn't shift essay-level understanding.
- Con: `holisticEvolution` only tracks 4 incremental fields (thesis, thesisConfidence, voiceSignature, arcMomentum). L3.75 synthesizes 7 FULL sections covering dozens of fields -- emotional arc, character revelation, admissions positioning, craft patterns, etc. An edit could change character revelation (e.g., rewriting a key anecdote) without touching any of the 4 `holisticEvolution` fields. This creates a blind spot.
- Risk: Medium. The 4 `holisticEvolution` fields are a SUBSET of what L3.75 produces. Using them as a proxy for "did anything holistic change?" is unreliable.

**Option C: Re-Run L3.75 Based on Change Category Classification**

- Procedure: Classify the edit into categories. Re-run L3.75 for: thesis-carrying edits, voice-affecting edits, arc-affecting edits, structural edits, paragraph deletions/insertions. Skip for: purely local word/phrase changes, rhythm tweaks, minor sentence rewrites that don't touch thematic content.
- Pro: Targeted. Only pays the L3.75 cost when the edit type suggests holistic impact.
- Con: Requires a reliable change-category classifier, which is itself a judgment call. What determines "thesis-carrying"? The sentence happens to contain the central thesis? But thesis can be implicit across several sentences. Complex and fragile.

**Option D: Conditional Re-Run with Back-Propagation Signal (Recommended)**

- Procedure: After the understanding re-walk, re-run L3.75 if ANY of these signals are present:
  1. `holisticEvolution` changed (any of the 4 fields)
  2. `priorSentenceUpdates` modified sentences in paragraphs BEFORE the edit point (back-propagation crossed the edit boundary -- the edit changed how we understand earlier parts of the essay)
  3. The earliest re-walked paragraph is P0 or P1 (opening paragraphs disproportionately affect holistic readings -- voice identity, first impressions, thematic setup)
  4. The edit involved a structural change (insert/delete/reorder -- these always affect narrative strategy and arc)

  If NONE of these signals are present, skip L3.75 -- the edit was localized and the holistic synthesis is still valid.

- Pro: Uses multiple cheap signals (no LLM call needed) to make the decision. Covers the blind spot in Option B by also checking back-propagation and structural change. Conservative enough to catch most holistic-affecting edits, but avoids unnecessary re-runs for truly local changes.
- Con: Still possible to miss a case where, say, rewriting P4's climax changes character revelation but doesn't trigger back-propagation to earlier paragraphs and doesn't touch the 4 `holisticEvolution` fields. This is an edge case because a genuinely climax-level rewrite would typically shift at least `arcMomentum`.
- Cost impact: Re-runs L3.75 in ~60-70% of comprehensive re-analyses (structural edits always trigger it, most significant content edits produce `holisticEvolution` or back-propagation). Saves ~$0.02-0.04 on the remaining ~30-40%.

### Recommendation: Option D (Conditional with Back-Propagation Signal)

**Why this wins**: It uses signals already produced by the understanding walk (zero additional LLM cost for the decision), covers the `holisticEvolution` blind spot via back-propagation checking, and is conservative enough to catch most holistic-affecting edits. The rare edge case (holistic sections stale but no signal triggered) is self-correcting: the next re-analysis will catch it, and the staleness in the interim affects feedback quality slightly but doesn't corrupt the profile.

**Implementation**:

```typescript
function shouldReRunHolisticSynthesis(
  walkResult: ReWalkResult,
  changes: EditDiff[],
  startParagraph: number,
): boolean {
  // Signal 1: holisticEvolution changed during re-walk
  if (walkResult.paragraphs.some(p =>
    p.holisticEvolution.centralThesis !== undefined ||
    p.holisticEvolution.thesisConfidence !== undefined ||
    p.holisticEvolution.voiceSignature !== undefined ||
    p.holisticEvolution.arcMomentum !== undefined
  )) {
    return true;
  }

  // Signal 2: back-propagation crossed the edit boundary
  if (walkResult.paragraphs.some(p =>
    p.priorSentenceUpdates.some(u => u.paragraph < startParagraph)
  )) {
    return true;
  }

  // Signal 3: opening paragraphs were re-walked
  if (startParagraph <= 1) {
    return true;
  }

  // Signal 4: structural change
  if (changes.some(c => c.type === 'structural')) {
    return true;
  }

  return false;
}
```

**Fallback**: If in doubt, re-run. The cost of a false-positive ($0.02-0.04) is much lower than the cost of a false-negative (stale holistic sections producing subtly wrong feedback for the rest of the session).

---

## 3. Focused Mode and Holistic Sections

### The Problem

When focused mode updates one sentence's understanding, the holistic sections (voice identity, thematic architecture, etc.) were computed from the FULL sentence map. Does a single-sentence change require refreshing any holistic sections?

### Analysis by Change Type

| Change | Example | Holistic Impact | Refresh Needed? |
|--------|---------|-----------------|-----------------|
| Synonym substitution | "walked" -> "drifted" | Minimal. Voice might shift microscopically. | No |
| Stylistic word change | "very" removed | None meaningful. | No |
| Image-carrying word | "diamond" -> "crystal" | Potentially. If "diamond" is tracked in `imageRecurrences` and is a central metaphor, the entire image system reading may shift. | Targeted refresh of `craftAssessment.imageSystem` |
| Thesis-carrying sentence rewritten | "I learned that..." -> completely new sentence | Significant. Thematic architecture, character revelation, admissions positioning could all shift. | Full L3.75 re-run OR escalation to comprehensive |
| Voice-defining sentence rewritten | The one sentence that establishes the writer's distinctive voice | Voice identity section is stale. | Targeted refresh of `voiceIdentity` |

### Approaches

**Approach A: Never Refresh Holistic Sections in Focused Mode**

- Pro: Simplest. Focused mode stays fast and cheap. The whole point is surgical precision.
- Con: Creates a growing divergence between sentence-level understanding and holistic sections over multiple focused edits. After 5 word changes, the holistic voice reading might be subtly off.
- Risk: Low for individual edits, accumulates over a session.

**Approach B: Always Refresh All Holistic Sections After Focused Mode**

- Pro: Always consistent.
- Con: Defeats the purpose of focused mode. A $0.02-0.04 L3.75 call after every $0.02-0.04 focused analysis doubles the cost. Focused mode's speed advantage vanishes.

**Approach C: Escalation-Gated Holistic Refresh (Recommended)**

- The focused pipeline already has a ripple detection system (step 5 in the focused pipeline). The ripple flags include `holisticShift: boolean`. Use this as the gate:
  - `holisticShift: false` -> No holistic refresh. Done.
  - `holisticShift: true` -> Targeted holistic section refresh (NOT full L3.75, but a lighter call that updates ONLY the affected section).
  - If the targeted refresh reveals cascading changes -> escalate to comprehensive mode.

- Pro: Uses existing infrastructure. Only pays for holistic refresh when the focused understanding update itself detects holistic impact. The LLM doing the focused understanding update has enough context (paragraph understanding, connected sentences, holistic section summaries) to detect whether the change ripples to the holistic level.
- Con: Relies on the focused understanding LLM correctly detecting holistic ripples. Risk of false negatives.
- Mitigation: The focused understanding prompt explicitly asks "Does this ripple to holistic sections? Does it change voice, thesis, arc, character, admissions positioning?" with relevant holistic context loaded. The LLM has enough information to make this call accurately.

### Recommendation: Approach C (Escalation-Gated)

**The escalation ladder for holistic refresh in focused mode:**

```
Focused understanding update detects ripple:
  │
  ├── holisticShift: false → No holistic refresh. Done.
  │
  ├── holisticShift: true, specificRipples identifies 1-2 sections
  │   │
  │   └── Targeted holistic section refresh (single Sonnet call, ~$0.01-0.02)
  │       Input: updated sentence understanding + relevant holistic section + profile context
  │       Output: updated holistic section (supersession)
  │       └── If the refresh produces changes that would cascade to other sections
  │           → escalate to full L3.75 ($0.02-0.04)
  │
  └── holisticShift: true, specificRipples is broad (3+ sections)
      │
      └── Full L3.75 re-run ($0.02-0.04)
          └── If L3.75 reveals fundamental shift
              → escalate to comprehensive mode
```

**Cost impact**: Most focused edits (80%+) produce `holisticShift: false` and cost $0. The 15% that produce targeted section refresh add ~$0.01-0.02. The 5% that trigger full L3.75 add ~$0.02-0.04. Expected additional cost per focused edit: ~$0.003 on average. Negligible.

---

## 4. Comprehensive Re-Analysis: Full Procedure

### Content Edit (Paragraph Text Changed, Structure Preserved)

When the student edits paragraph N (of M total), and `selectAnalysisMode()` returns `'comprehensive'`:

```
COMPREHENSIVE RE-ANALYSIS: CONTENT EDIT
========================================

PRE-REQUISITES:
- Existing EssayProfile with completed L1-L3.75-L3.5-L4-L5
- DiffResult showing which paragraphs changed
- firstChangedIndex = N (earliest changed paragraph)

STEP 1: PREPARATION
  1a. Preserve P0..P(N-1) understanding maps (unchanged, including all back-propagations)
  1b. Preserve EssayProfile snapshot through P(N-1) (holistic evolution, connections)
  1c. Mark P(N)..P(M-1) understanding + analysis as STALE

STEP 2: L1 FIRST IMPRESSIONS RE-RUN (parallel Haiku)
  2a. Re-run L1 for changed paragraphs only (parallel Haiku calls)
  2b. For unchanged paragraphs: keep existing L1 data

STEP 3: CONNECTION SCOUT RE-RUN (Haiku)
  3a. Re-run L2.5 Connection Scout on full essay text (the edited paragraph
      may have new words/phrases that create new cross-paragraph connections)
  3b. Cost: ~$0.005 (single Haiku call)
  3c. Why: Scout leads from the original analysis are stale -- the edited
      paragraph's words have changed, so surface-level connection patterns differ

STEP 4: UNDERSTANDING RE-WALK (sequential Sonnet, from edit point)
  4a. Start from paragraph N with:
      - EssayProfile snapshot from P(N-1) (all understanding, connections, holistic)
      - Updated scout leads from step 3
      - Updated L1 impressions from step 2
  4b. Walk P(N) -> P(N+1) -> ... -> P(M-1) sequentially
  4c. Each walk step produces: paragraphUnderstanding, holisticEvolution,
      priorSentenceUpdates, newConnections
  4d. Profile Manager applies each output immediately (supersession, connections, etc.)

  EARLY-STOP CHECK (after walking paragraph N):
  4e. Did P(N)'s re-walk produce ANY of:
      - priorSentenceUpdates to P0..P(N-1)? (back-propagation crossed edit boundary)
      - newConnections involving P0..P(N-1)? (new cross-paragraph links)
      - holisticEvolution changes? (thesis, voice, arc shifted)

      If ALL THREE are empty/unchanged:
        → P(N)'s edit was self-contained
        → SKIP re-walking P(N+1)..P(M-1) (their understanding isn't affected)
        → Keep P(N+1)..P(M-1) understanding from original walk
        → Proceed to step 5 with only P(N) as "re-walked"

      If ANY are non-empty:
        → Continue re-walking P(N+1)..P(M-1)
        → No more early-stop checks (once the edit rippled, finish the walk)

STEP 5: L3.75 HOLISTIC SYNTHESIS (conditional)
  5a. Evaluate shouldReRunHolisticSynthesis() (see Section 2)
  5b. If YES: run L3.75 with complete updated sentence understanding
      → All 7 holistic sections re-synthesized (~$0.02-0.04)
  5c. If NO: keep existing holistic sections from original L3.75

STEP 6: L3.5 ANALYSIS RE-RUN (parallel Sonnet)
  6a. Determine which paragraphs need re-analysis:
      - Always: paragraphs that were re-walked (P(N), and P(N+1)..P(M-1) if walked)
      - Always: paragraphs whose understanding was modified by back-propagation
        (priorSentenceUpdates from step 4 targeted sentences in P(X) where X < N)
      - Conditional: if holisticEvolution changed thesis or voice signature,
        ALL paragraphs need re-analysis (every paragraph's effectiveness depends
        on the holistic picture)
  6b. Re-run L3.5 for the determined set (parallel Sonnet calls)
  6c. Prompt caching: essay + understanding profile cached across parallel calls
  6d. Cost: $0.02-0.03 per paragraph, prompt caching saves ~75%

STEP 7: POST-ANALYSIS
  7a. Re-compute ImprovementPhase via detectImprovementPhase()
  7b. Update ProfileIndex (tags, connections, concerns, section token counts)
  7c. Re-crystallize EssayDNA (L4) from updated profile
  7d. Re-generate L5 annotations for affected paragraphs (phase-aware)
  7e. Persist updated profile to DB

COST: ~$0.10-0.35 depending on:
  - How many paragraphs re-walked (early-stop can save 60%+)
  - Whether L3.75 re-runs ($0.02-0.04 if yes)
  - How many paragraphs need re-analysis (prompt caching reduces cost)

TIME: ~10-25s
```

### Structural Edit (Insert, Delete, or Reorder)

```
COMPREHENSIVE RE-ANALYSIS: STRUCTURAL EDIT
============================================

STEP 1: INDEX REMAPPING
  1a. Build mapping: Map<oldIndex, newIndex>
      - Insert P3: old P3->P4, P4->P5, etc.
      - Delete P3: old P4->P3, P5->P4, etc.
      - Reorder (P2<->P4): P2->P4, P4->P2
  1b. Remap ALL connection endpoints in connections.all[]
  1c. Remap ALL connectionRefs on sentences
  1d. Remap Profile Index entries (paragraphDigest, connectionGraph)
  1e. Remap holistic section references (pivotPoints, peakMoments, etc.)
  1f. For insertions: create empty paragraph entry at the new index
  1g. For deletions: remove the paragraph entry + all its connections

STEP 2: L1 FIRST IMPRESSIONS
  2a. For insertions: run L1 on the new paragraph (Haiku)
  2b. For deletions: no L1 needed (paragraph is gone)
  2c. For reorders: L1 data moves with the paragraph (no re-run needed)
  2d. For all: re-run L1 on any paragraphs whose TEXT also changed

STEP 3: CONNECTION SCOUT RE-RUN (always for structural changes)
  3a. Full re-run on the new essay text (structure changed, all connections stale)

STEP 4: UNDERSTANDING RE-WALK
  4a. Determine start point:
      - Insert: from the inserted paragraph forward
      - Delete: from the deletion point forward
      - Reorder: from the earliest moved paragraph forward
  4b. Use EssayProfile snapshot from BEFORE the start point
  4c. Walk sequentially to end
  4d. NO early-stop check (structural changes always affect everything downstream)

STEP 5: L3.75 HOLISTIC SYNTHESIS (always for structural changes)
  5a. Always re-run. Structural changes inherently affect narrative strategy,
      arc, pacing, and often thematic architecture.

STEP 6: L3.5 ANALYSIS RE-RUN (all paragraphs, parallel)
  6a. Full re-analysis. Structural changes affect every paragraph's effectiveness.

STEP 7: POST-ANALYSIS (same as content edit step 7)

COST: ~$0.25-0.50 (nearly full analysis cost, but with prompt caching savings)
TIME: ~15-30s
```

---

## 5. Focused Re-Analysis: Full Procedure

When `selectAnalysisMode()` returns `'focused'`:

```
FOCUSED RE-ANALYSIS
====================

PRE-REQUISITES:
- EssayProfile with confidenceLevel >= 'deep'
- All changes are minor (<30% text change per paragraph)
- No structural changes

STEP 1: DIFF DETECTION (deterministic, <5ms)
  1a. Character-level diff between old and new text
  1b. Identify: which paragraphs, which sentences, which words changed
  1c. Compute: textChangeRatio per paragraph, sentencesAffected count
  1d. Output: Array<FocusedEditDiff> where each entry has:
      { paragraph, sentence, oldText, newText, changeType: 'word'|'phrase'|'sentence' }

STEP 2: IMPACT CLASSIFICATION (single Haiku call, ~$0.002, ~0.5s)
  2a. Input:
      - ProfileIndex (always loaded, ~200-300 tokens)
      - ParagraphDigest for affected paragraphs
      - The specific text changes (old -> new)
      - ConnectionGraph entries involving affected sentences
  2b. Haiku assesses:
      - Impact scope: 'word' | 'sentence' | 'paragraph' | 'broader'
      - Affected profile sections: which parts of understanding/analysis are stale
      - Ripple probability: low/medium/high
      - Whether the changed sentence carries thematic, voice-defining, or thesis weight
  2c. Output: ImpactClassification
      {
        scope: 'word' | 'sentence' | 'paragraph' | 'broader',
        affectedSections: string[],      // e.g., ['P2S4.understanding', 'voiceIdentity']
        rippleProbability: 'low' | 'medium' | 'high',
        isThesisCarrying: boolean,
        isVoiceDefining: boolean,
        isImageCarrying: boolean,
        recommendation: 'proceed_focused' | 'escalate_comprehensive'
      }
  2d. If recommendation === 'escalate_comprehensive':
      → Abort focused pipeline, delegate to comprehensive mode
      → This catches cases where Haiku recognizes the "small" edit is actually
        a thesis rewrite or structural sentence that changes everything

STEP 3: FOCUSED UNDERSTANDING UPDATE (single Sonnet call, ~$0.02-0.04, ~2-3s)
  3a. Context loaded via Profile Router:
      - Changed sentence's CURRENT understanding (full SentenceUnderstanding)
      - The specific text change (old -> new, with character-level diff)
      - Paragraph understanding (role, function, craft profile)
      - Connected sentences' understanding (loaded via connectionRefs)
      - Relevant holistic sections (loaded based on ImpactClassification.affectedSections)
  3b. Prompt asks Sonnet:
      "Here is P2S4's CURRENT understanding: [rendered with [U1], [U2] labels]
       The student changed: '[old text]' -> '[new text]'

       Given the context:
       1. How does this change affect P2S4's understanding? Update the specific
          fields that changed (supersession for arrays, replacement for strings).
       2. Does this ripple beyond P2S4? If yes, what SPECIFICALLY changes and where?
       3. Does this affect any holistic sections (voice, thesis, arc, character, etc.)?"
  3c. Output: FocusedUnderstandingResult
      {
        updatedSentenceUnderstanding: Partial<SentenceUnderstanding>,
        rippleFlags: {
          beyondSentence: boolean,
          beyondParagraph: boolean,
          holisticShift: boolean,
          specificRipples: Array<{
            target: [paragraph, sentence] | 'holistic_section_name',
            description: string,
          }>,
        },
        newConnections: Connection[],
        removedConnectionIds: string[],
      }
  3d. Profile Manager applies:
      - Supersede changed understanding fields on the target sentence
      - Add/remove connections
      - Do NOT touch other sentences' understanding (unless ripple handling in step 5)

STEP 4: FOCUSED ANALYSIS UPDATE (single Sonnet call, ~$0.02-0.04, ~2-3s)
  4a. Input:
      - Updated understanding from step 3 (the new reading)
      - Previous analysis for the changed sentence (effectiveness, strengths, weaknesses)
      - Current ImprovementPhase
      - Paragraph-level analysis (effectiveness, verdict)
  4b. Prompt asks Sonnet:
      "P2S4's understanding was updated: [new understanding].
       Previous analysis: effectiveness [X], weaknesses: [Y].

       Re-evaluate:
       1. Does the old weakness resolve? Any new strengths?
       2. Updated effectiveness score with reasoning.
       3. Does paragraph-level effectiveness shift?"
  4c. Output: FocusedAnalysisResult
      {
        updatedSentenceAnalysis: Partial<SentenceAnalysis>,
        paragraphEffectivenessDelta: number | null,
        resolvedWeaknesses: string[],
        newStrengths: ObservationEntry[],
      }
  4d. Profile Manager applies:
      - Supersede changed analysis fields on the target sentence
      - Adjust paragraph effectiveness if delta provided

STEP 5: RIPPLE HANDLING (conditional, cost varies)
  5a. Check rippleFlags from step 3:

      ┌─────────────────────────────────────────────────────────────┐
      │ No ripple (all flags false)                                 │
      │ → DONE. Skip to step 6.                                    │
      │ Cost so far: ~$0.04-0.08                                   │
      ├─────────────────────────────────────────────────────────────┤
      │ beyondSentence = true, beyondParagraph = false              │
      │ → Paragraph-level refresh:                                  │
      │   Re-run L3.5 analysis for the affected paragraph only      │
      │   (single Sonnet call, ~$0.02-0.03)                         │
      │   This catches cases where the sentence change affects       │
      │   neighboring sentences' effectiveness evaluations.          │
      │ → Check: did paragraph effectiveness change significantly?   │
      │   If yes AND paragraph had connections → continue checking   │
      │   If no → DONE                                              │
      ├─────────────────────────────────────────────────────────────┤
      │ beyondParagraph = true, holisticShift = false               │
      │ → Connected-sentence refresh:                                │
      │   For each specificRipple targeting a sentence:              │
      │   Run focused understanding + analysis update on THAT        │
      │   sentence too (Sonnet calls, ~$0.02-0.04 each)              │
      │   This handles: "diamond" changed in P1, P3 and P5 have     │
      │   connections to P1's diamond reference.                      │
      │ → DONE after updating connected sentences                    │
      ├─────────────────────────────────────────────────────────────┤
      │ holisticShift = true, specificRipples has 1-2 sections      │
      │ → Targeted holistic section refresh:                         │
      │   Single Sonnet call to re-synthesize the affected           │
      │   holistic section(s) with updated sentence understanding    │
      │   (~$0.01-0.02)                                              │
      │ → Re-run L3.5 analysis for paragraphs tagged with the       │
      │   affected holistic section's topic (optional, based on      │
      │   whether the refresh produced meaningful changes)            │
      │ → DONE                                                       │
      ├─────────────────────────────────────────────────────────────┤
      │ holisticShift = true, specificRipples is broad (3+ sections) │
      │ OR escalation triggered at any sub-step                      │
      │ → ESCALATE TO COMPREHENSIVE MODE                             │
      │   The "small" edit turned out to have essay-wide impact.     │
      │   Abort focused pipeline, run full comprehensive procedure    │
      │   from step 4a in the decision tree.                          │
      │   Cost: ~$0.15-0.35 (comprehensive), but the focused work    │
      │   done so far is NOT wasted -- the updated sentence           │
      │   understanding from step 3 is valid and preserved.           │
      └─────────────────────────────────────────────────────────────┘

STEP 6: FINALIZATION
  6a. Re-compute ImprovementPhase via detectImprovementPhase()
      (phase CAN shift after focused edits -- fixing the last sentence-level
       issue could shift Craft -> Polish)
  6b. Update ProfileIndex (tags, connections, concerns)
  6c. Re-generate L5 feedback ONLY for the affected sentence/paragraph
      (phase-aware, at current zoom level)
  6d. Persist updated profile to DB

COST BREAKDOWN:
  No ripple:     ~$0.04-0.08  (impact + understanding + analysis)
  Paragraph:     ~$0.06-0.11  (+ paragraph re-analysis)
  Connected:     ~$0.08-0.16  (+ connected sentence updates)
  Holistic:      ~$0.07-0.14  (+ section refresh)
  Escalation:    ~$0.15-0.35  (falls through to comprehensive)

TIME:
  No ripple:     ~2-4s
  Paragraph:     ~4-6s
  Connected:     ~5-8s
  Holistic:      ~5-8s
  Escalation:    ~15-25s (comprehensive)
```

### Multiple Focused Edits in One Batch

If the student made 3 word changes across different sentences:

```
For each change, run steps 1-2 (diff + impact classification) collectively.

If ALL changes are word-level with low ripple probability:
  → Run steps 3-4 for each change as SEPARATE focused updates
  → This is better than batching because each Sonnet call concentrates
    on one change (higher signal-to-noise per the plan's argument)
  → Parallelize the independent focused calls where sentences are in
    different paragraphs

If ANY change is flagged as potentially broader:
  → Group all changes and escalate to comprehensive mode
  → The interaction effects between multiple changes are too complex
    for independent focused calls

After all individual updates:
  → Run step 5 (ripple handling) ONCE for the combined set of updates
  → Run step 6 (finalization) ONCE
```

---

## 6. Edge Cases

### 6.1 Student Makes 3 Edits Before Re-Analysis Completes

**Approaches:**

**A: Queue and Sequential** -- Queue each edit, process one at a time.
- Pro: Deterministic. Each re-analysis sees the result of the previous one.
- Con: Slow. Student waits for 3 serial re-analyses.

**B: Batch on Debounce** -- Wait for edits to settle (e.g., 2-second debounce), then analyze the cumulative diff from the last stable state.
- Pro: Fast. One re-analysis covers all edits. Student gets one coherent feedback update.
- Con: If the student is actively typing, re-analysis never triggers.

**C: Cancel-and-Restart (Recommended)** -- When a new edit arrives while re-analysis is running, cancel the in-progress analysis and restart with the latest text.
- Pro: Always analyzes the latest state. No stale results.
- Con: Wasted work on the cancelled analysis. But this is bounded: comprehensive mode has checkpoints, and focused mode is cheap enough to restart.
- Mitigation: Use a debounce (1-2 seconds) before starting re-analysis. This absorbs rapid sequential edits. If re-analysis is already running when a new edit arrives after the debounce window, cancel and restart.

**Recommendation: C (Cancel-and-Restart with Debounce)**

```typescript
class ReAnalysisScheduler {
  private debounceTimer: NodeJS.Timeout | null = null;
  private runningAnalysis: AbortController | null = null;
  private latestText: string | null = null;

  scheduleReAnalysis(profile: EssayProfile, newText: string): void {
    this.latestText = newText;

    // Debounce: wait for edits to settle
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      // Cancel any running analysis
      if (this.runningAnalysis) {
        this.runningAnalysis.abort();
      }

      // Start new analysis with latest text
      this.runningAnalysis = new AbortController();
      this.executeReAnalysis(profile, this.latestText!, this.runningAnalysis.signal);
    }, 1500); // 1.5s debounce
  }
}
```

### 6.2 Student Deletes a Paragraph While Re-Analysis Is Running

This is a specific case of 6.1. The cancel-and-restart approach handles it: the running analysis is cancelled, and the new analysis starts with the post-deletion text. The new analysis will detect the structural change and run comprehensive mode with index remapping.

**Important**: The abort must be graceful. If L3 walk is mid-paragraph, the already-completed paragraphs' understanding is still valid and can be preserved as a checkpoint. The next analysis can potentially resume from the checkpoint (if the deletion point is AFTER the checkpoint).

### 6.3 Student Reverts an Edit

**Approaches:**

**A: Treat as a New Edit** -- The revert is just another text change. Diff engine sees the text reverted to a previous state, runs re-analysis.
- Pro: Simple. Consistent with all other edit handling.
- Con: Wasteful. We already had a valid profile for this text state.

**B: Profile Versioning with Snapshot Restore** -- Keep snapshots of the profile at each analysis pass. If the text matches a previous snapshot's text hash, restore that snapshot instead of re-analyzing.
- Pro: Instant revert. Zero cost.
- Con: Memory/storage overhead for snapshots. Complexity of managing version history.

**C: Hash-Based Cache Lookup (Recommended)** -- Before running re-analysis, hash the full text and check if a profile for this exact text already exists (either in the analysis pass history or a lightweight cache).
- Pro: Nearly zero overhead (one hash comparison). Handles reverts without explicit version management.
- Con: Only catches exact reverts, not "revert plus one more word change."
- Implementation: The `essay_understanding` table already stores `textHash`. Maintain a small in-memory LRU cache of recent profile states keyed by text hash. On revert, hash-match returns the cached profile. Cache size: last 5 states (bounded memory).

**Recommendation: C (Hash-Based Cache Lookup)**

```typescript
// In handleTextChange, before any analysis:
const newTextHash = hashText(newText);
const cachedProfile = profileCache.get(newTextHash);
if (cachedProfile) {
  console.log('[ReAnalysis] Text matches cached profile, restoring');
  return { profile: cachedProfile, pass: { trigger: 'revert_restore', cost: 0 } };
}
```

### 6.4 Multiple Small Edits Across Different Paragraphs

**Example**: Student changes a word in P1S2 and a word in P4S3 simultaneously.

**Approaches:**

**A: Run Focused Mode for Each Edit Independently (in parallel)**
- Pro: Each focused call concentrates on its change. Independent edits don't interfere.
- Con: If both changes happen to interact (e.g., P1S2 and P4S3 are connected via a metaphor), independent focused calls miss the interaction.

**B: Batch All Edits into a Single Focused Call**
- Pro: The LLM sees both changes together, can detect interactions.
- Con: Splits the LLM's attention. The plan specifically argues that focused mode's advantage is concentration on a single change.

**C: Independent Focused + Combined Ripple Check (Recommended)**
- Run focused understanding + analysis for each edit independently (parallel if in different paragraphs).
- After all individual updates, run a SINGLE ripple check that considers the combined effect.
- If the combined ripple check detects interactions (e.g., both changes affect the same holistic section), escalate to the appropriate ripple handling level.

**Recommendation: C**

The key insight: understanding updates are LOCAL (a word change affects that sentence's reading). But ripple effects are GLOBAL (two local changes might together shift the holistic picture even if neither would alone). Process understanding locally, check ripples globally.

### 6.5 Edit Changes Sentence Count Within a Paragraph

**Example**: Student splits one sentence into two, or merges two sentences into one.

This is a special case: it's not a structural edit (paragraph count unchanged) but the sentence indices within the paragraph shift. Existing sentence-level understanding for sentences AFTER the edit point within that paragraph is misaligned.

**Handling**: Detect sentence count change during diff. For the affected paragraph:
- If sentence count changed: treat the ENTIRE paragraph as needing re-walk (comprehensive mode for that paragraph, but only that paragraph if the edit was otherwise minor and no ripple detected).
- Sentence-level understanding for unchanged sentences before the edit point within the paragraph: preserve but remap indices.
- Sentence-level understanding for the changed/new sentences: rebuild via walk.

This is a "micro-comprehensive" -- comprehensive mode scoped to a single paragraph. It still uses the existing paragraph-level early-stop logic to determine whether downstream paragraphs need re-walking.

### 6.6 Very Large Edit (Student Rewrites Entire Essay)

If `textChangeRatio > 0.5` across the entire essay (more than half the text changed), treat as a fresh analysis rather than re-analysis:

```typescript
if (overallTextChangeRatio > 0.50) {
  // This is effectively a new essay. Full fresh analysis is cheaper and
  // higher quality than trying to incrementally update a mostly-stale profile.
  return analyzeEssay(input);
}
```

The existing profile's value diminishes rapidly as more text changes. At 50%+ change, the incremental approach's overhead (staleness tracking, selective re-walk, ripple handling) exceeds the cost of a clean start.

---

## 7. Unified Specification: `handleTextChange`

This is the single, complete specification that replaces both the "Incremental Update" and "Analysis Modes" sections in the plan.

### Entry Point

```typescript
async function handleTextChange(
  existingProfile: EssayProfile,
  oldText: string,
  newText: string,
): Promise<ReAnalysisResult> {
  // ═══════════════════════════════════════════════════════
  // PHASE 0: PRELIMINARY CHECKS
  // ═══════════════════════════════════════════════════════

  // 0a. Text hash comparison -- revert detection
  const newTextHash = hashText(newText);
  const cachedProfile = profileCache.get(newTextHash);
  if (cachedProfile) {
    return { profile: cachedProfile, trigger: 'revert_restore', cost: 0 };
  }

  // 0b. Diff detection
  const diff = diffEngine.computeDiff(oldText, newText, existingProfile);
  if (!diff.hasChanges) {
    return { profile: existingProfile, trigger: 'no_change', cost: 0 };
  }

  // 0c. Massive rewrite detection
  if (diff.overallTextChangeRatio > 0.50) {
    return analyzeEssay({ ...input, text: newText }); // Fresh analysis
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 1: CHANGE CLASSIFICATION
  // ═══════════════════════════════════════════════════════

  const changes: EditDiff[] = classifyChanges(diff);
  // Each EditDiff: { type, paragraphs, textChangeRatio, sentencesAffected,
  //                  sentenceCountChanged, changedSentences[] }

  // ═══════════════════════════════════════════════════════
  // PHASE 2: MODE SELECTION
  // ═══════════════════════════════════════════════════════

  const mode = selectAnalysisMode(existingProfile, changes);
  // Returns 'comprehensive' | 'focused'

  // ═══════════════════════════════════════════════════════
  // PHASE 3: EXECUTE SELECTED MODE
  // ═══════════════════════════════════════════════════════

  let result: ModeResult;
  if (mode === 'comprehensive') {
    result = await runComprehensiveReAnalysis(existingProfile, newText, changes, diff);
  } else {
    result = await runFocusedReAnalysis(existingProfile, newText, changes, diff);
  }

  // ═══════════════════════════════════════════════════════
  // PHASE 4: POST-UPDATE (common to both modes)
  // ═══════════════════════════════════════════════════════

  // 4a. Re-compute improvement phase
  const newPhase = detectImprovementPhase(result.profile);
  result.profile.index.improvementPhase = newPhase;

  // 4b. Update ProfileIndex
  recomputeProfileIndex(result.profile);

  // 4c. Re-crystallize EssayDNA (L4)
  //     For focused mode: only if analysis changed meaningfully
  //     For comprehensive mode: always
  if (mode === 'comprehensive' || result.analysisChanged) {
    result.profile = await recrystallize(result.profile);
  }

  // 4d. Re-generate L5 annotations (phase-aware)
  //     Scope: affected paragraphs only (not full essay)
  const annotationScope = result.affectedParagraphs;
  result.profile = await regenerateAnnotations(result.profile, annotationScope);

  // 4e. Cache current state for revert detection
  profileCache.set(newTextHash, result.profile);

  // 4f. Persist to DB
  await persistProfile(result.profile);

  // 4g. Record analysis pass
  const pass = buildAnalysisPass(mode, result);
  result.profile.analysisPasses.push(pass);

  return {
    profile: result.profile,
    pass,
    trigger: mode === 'comprehensive'
      ? (diff.structuralChange ? 'structural_change' : 'content_edit')
      : 'focused_edit',
    cost: result.totalCost,
  };
}
```

### Mode Selection Logic

```typescript
function selectAnalysisMode(
  profile: EssayProfile,
  changes: EditDiff[],
): 'comprehensive' | 'focused' {
  // Rule 1: No deep profile -> comprehensive (nothing to leverage)
  if (profile.index.confidenceLevel === 'initial' ||
      profile.index.confidenceLevel === 'developing') {
    return 'comprehensive';
  }

  // Rule 2: Structural changes -> comprehensive
  if (changes.some(c => c.type === 'structural')) {
    return 'comprehensive';
  }

  // Rule 3: Sentence count changed within a paragraph -> comprehensive
  //         (sentence indices shift, understanding misaligned)
  if (changes.some(c => c.sentenceCountChanged)) {
    return 'comprehensive';
  }

  // Rule 4: Multiple paragraphs significantly rewritten -> comprehensive
  const significantRewrites = changes.filter(c =>
    c.type === 'content' && c.textChangeRatio > 0.30
  );
  if (significantRewrites.length > 1) {
    return 'comprehensive';
  }

  // Rule 5: Single paragraph significantly rewritten -> comprehensive
  //         (but incremental: re-walk only from that paragraph)
  if (significantRewrites.length === 1) {
    return 'comprehensive';
  }

  // Rule 6: Minor changes with deep profile -> FOCUSED
  if (profile.index.confidenceLevel === 'deep' ||
      profile.index.confidenceLevel === 'comprehensive') {
    return 'focused';
  }

  // Default: comprehensive (safe)
  return 'comprehensive';
}
```

### Comprehensive Mode Internals

```typescript
async function runComprehensiveReAnalysis(
  profile: EssayProfile,
  newText: string,
  changes: EditDiff[],
  diff: DiffResult,
): Promise<ModeResult> {
  const isStructural = changes.some(c => c.type === 'structural');

  // ── STEP 1: Index remapping (structural only) ──
  if (isStructural) {
    const mapping = buildIndexMapping(diff);
    remapIndices(profile, mapping);
  }

  // ── STEP 2: L1 re-run (parallel Haiku) ──
  const l1Paragraphs = isStructural
    ? getAllParagraphIndices(newText)         // All paragraphs for structural
    : diff.changedParagraphs;                // Only changed for content
  await reRunFirstImpressions(profile, newText, l1Paragraphs);

  // ── STEP 3: Connection Scout re-run (Haiku) ──
  await reRunConnectionScout(profile, newText);

  // ── STEP 4: Understanding re-walk ──
  const startIdx = isStructural
    ? (getEarliestMovedParagraph(diff) ?? 0)
    : (diff.firstChangedIndex ?? 0);

  const walkResult = await reWalkFromParagraph(
    profile, newText, startIdx,
    { allowEarlyStop: !isStructural },  // No early-stop for structural
  );

  // ── STEP 5: L3.75 Holistic Synthesis (conditional) ──
  if (isStructural || shouldReRunHolisticSynthesis(walkResult, changes, startIdx)) {
    await reRunHolisticSynthesis(profile);
  }

  // ── STEP 6: L3.5 Analysis re-run ──
  const analysisScope = determineAnalysisScope(
    profile, walkResult, startIdx, isStructural,
  );
  // analysisScope: number[] — which paragraphs need re-analysis
  await reRunAnalysisPass(profile, analysisScope);

  return {
    profile,
    affectedParagraphs: analysisScope,
    totalCost: computeTotalCost(),
    analysisChanged: true,
  };
}
```

### Focused Mode Internals

```typescript
async function runFocusedReAnalysis(
  profile: EssayProfile,
  newText: string,
  changes: EditDiff[],
  diff: DiffResult,
): Promise<ModeResult> {
  const affectedParagraphs = new Set<number>();
  let totalCost = 0;

  // ── Group changes by paragraph ──
  const changesByParagraph = groupBy(changes, c => c.paragraphs[0]);

  // ── Process each paragraph's changes ──
  for (const [paraIdx, paraChanges] of changesByParagraph) {
    // STEP 2: Impact classification
    const impact = await classifyImpact(profile, paraChanges);
    totalCost += impact.cost;

    if (impact.recommendation === 'escalate_comprehensive') {
      // Abort focused, run comprehensive
      return runComprehensiveReAnalysis(profile, newText, changes, diff);
    }

    // STEP 3-4: Focused understanding + analysis for each changed sentence
    for (const change of paraChanges) {
      const understandingResult = await focusedUnderstandingUpdate(
        profile, change, impact,
      );
      totalCost += understandingResult.cost;

      const analysisResult = await focusedAnalysisUpdate(
        profile, change, understandingResult,
      );
      totalCost += analysisResult.cost;

      // Apply to profile
      applyFocusedUpdate(profile, change, understandingResult, analysisResult);
      affectedParagraphs.add(paraIdx);
    }
  }

  // ── STEP 5: Combined ripple handling ──
  const combinedRipples = collectRipples(/* from all focused updates */);
  const rippleResult = await handleRipples(profile, combinedRipples);
  totalCost += rippleResult.cost;

  if (rippleResult.escalated) {
    // Focused work preserved, but run comprehensive on top
    return runComprehensiveReAnalysis(profile, newText, changes, diff);
  }

  for (const p of rippleResult.additionalParagraphs) {
    affectedParagraphs.add(p);
  }

  return {
    profile,
    affectedParagraphs: Array.from(affectedParagraphs),
    totalCost,
    analysisChanged: rippleResult.analysisChanged,
  };
}
```

### Layer Re-Run Rules Summary

| Layer | Comprehensive (Content) | Comprehensive (Structural) | Focused (No Ripple) | Focused (With Ripple) |
|-------|------------------------|---------------------------|--------------------|-----------------------|
| L1 First Impressions | Changed paragraphs only | All paragraphs | Skip | Skip |
| L2 Structural Cartography | Skip (unless structure-adjacent) | Always re-run | Skip | Skip |
| L2.5 Connection Scout | Always re-run | Always re-run | Skip | Skip |
| L3 Understanding Walk | From edit point forward (early-stop possible) | From earliest moved paragraph (no early-stop) | 1 sentence (focused call) | 1 sentence + ripple targets |
| L3.75 Holistic Synthesis | Conditional (4 signals) | Always | Skip | Conditional (escalation-gated) |
| L3.5 Analysis Pass | Affected paragraphs (scoped) | All paragraphs | 1 sentence (focused call) | 1 sentence + ripple scope |
| L4 Crystallization | Always | Always | If analysis changed | If analysis changed |
| L5 Annotations | Affected paragraphs | All paragraphs | Affected sentence/paragraph | Affected scope |
| Phase Detection | Always | Always | Always | Always |
| ProfileIndex Update | Always | Always | Always | Always |

### Cost Summary

| Scenario | Mode | Cost | Time |
|----------|------|------|------|
| First analysis | Full pipeline | $0.52-1.00 | 30-45s |
| Paragraph rewrite, early-stop triggered | Comprehensive | $0.08-0.15 | 8-12s |
| Paragraph rewrite, full re-walk | Comprehensive | $0.15-0.35 | 15-25s |
| Structural edit (insert/delete) | Comprehensive | $0.25-0.50 | 15-30s |
| Structural edit (reorder) | Comprehensive | $0.35-0.80 | 20-35s |
| Word change, no ripple | Focused | $0.04-0.08 | 2-4s |
| Word change, paragraph ripple | Focused | $0.06-0.11 | 4-6s |
| Word change, holistic ripple | Focused | $0.07-0.14 | 5-8s |
| Sentence rewrite, no ripple | Focused | $0.05-0.10 | 3-5s |
| Multiple word changes (3), no ripple | Focused | $0.10-0.18 | 3-6s (parallel) |
| Escalation from focused | Focused -> Comprehensive | $0.15-0.35 | 15-25s |
| Revert to previous text | Cache restore | $0.00 | <100ms |
| Massive rewrite (>50%) | Fresh analysis | $0.52-1.00 | 30-45s |

### Acceleration Curve (Typical Session)

```
Round 1: Fresh analysis
  Mode: Full Pipeline | Phase: Foundation
  Cost: ~$0.75 | Time: ~35s                    ████████████████████

Round 2: Student restructures P3, rewrites P4
  Mode: Comprehensive (structural) | Phase: Architecture
  L3.75: YES (structural) | L3.5: all paragraphs
  Cost: ~$0.35 | Time: ~22s                    ██████████████

Round 3: Student rewrites P2S3-S5, improves P4S2
  Mode: Comprehensive (content, sentence count changed in P2)
  L3.75: YES (back-propagation from P2 to P1) | L3.5: P2, P3, P4
  Cost: ~$0.18 | Time: ~14s                    █████████

Round 4: Student changes 3 words across P2-P3
  Mode: Focused | Phase: Polish
  3 parallel focused calls, no ripple
  L3.75: NO | L3.5: 3 sentence-level updates
  Cost: ~$0.08 | Time: ~4s                     ███

Round 5: Student tweaks P4S2 phrasing
  Mode: Focused | Phase: Distinction
  1 focused call, no ripple
  Cost: ~$0.04 | Time: ~3s                     ██

Cumulative: ~$1.40 (well under $2 ceiling)
25x cost reduction from Round 1 to Round 5.
```

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Decision tree structure | Two-stage: mode then sub-mode | Clear separation of concerns, explicit naming |
| "Comprehensive" = | Incremental update from edit point | NOT full fresh analysis. Re-uses preserved profile. |
| L3.75 re-run rule | Conditional: 4 signals (holisticEvolution, back-prop crossing, opening para, structural) | Uses free signals from the walk. Conservative but not wasteful. |
| Focused holistic refresh | Escalation-gated via rippleFlags.holisticShift | Only pays when LLM detects holistic impact. 80%+ of focused edits skip. |
| Concurrent edits | Cancel-and-restart with 1.5s debounce | Always analyzes latest state. No stale results. |
| Revert handling | Hash-based cache lookup (LRU 5) | Near-zero overhead. Handles exact reverts instantly. |
| Multiple focused edits | Independent focused calls + combined ripple check | Preserves focused mode's concentration advantage. Catches interaction effects. |
| Sentence count change | Triggers comprehensive for that paragraph | Sentence index misalignment is too complex for focused mode. |
| Massive rewrite (>50%) | Fresh analysis | Incremental overhead exceeds fresh analysis cost at this threshold. |
| Early-stop in comprehensive | After first re-walked paragraph only | If edit rippled at all, finish the walk. No subsequent checks. |
| L4 re-crystallization | Always for comprehensive, conditional for focused | Comprehensive changes are significant enough to warrant DNA refresh. Focused changes may not be. |
| Analysis scope in comprehensive | Determined by back-propagation and holisticEvolution reach | If thesis changed, all paragraphs. If local, only affected paragraphs. |

---

## Implementation Priority

1. **`selectAnalysisMode()`** -- Gate function. Simple, deterministic, can be unit-tested immediately.
2. **Enhanced `diffEngine`** -- Character-level diffing, textChangeRatio, sentenceCountChanged detection.
3. **Comprehensive re-analysis procedure** -- Upgrade existing `handleTextChange()` to the full procedure (L2.5 re-run, L3.75 conditional, scoped L3.5).
4. **`shouldReRunHolisticSynthesis()`** -- The 4-signal conditional logic.
5. **`impactClassifier`** -- Haiku-powered impact assessment for focused mode.
6. **`focusedAnalyzer`** -- The focused understanding + analysis pipeline.
7. **Ripple handling + escalation ladder** -- The conditional escalation logic.
8. **`ReAnalysisScheduler`** -- Debounce + cancel-and-restart for concurrent edits.
9. **Profile cache** -- Hash-based LRU for revert detection.

Items 1-4 can ship together as "comprehensive mode v2." Items 5-7 ship as "focused mode." Items 8-9 are operational infrastructure.
