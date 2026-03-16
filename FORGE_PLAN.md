# Implementation Plan: Student Context Gathering & Pipeline Enrichment

The Conversator becomes an intelligence gatherer — a pre-analysis conversation with the student that produces `StudentDeclaredContext`, a structured representation of what the student says about their essay's intent, audience, domain, and backstory. This context is then injected into L3 walk, L3.75 synthesis, L3.5 analysis, and L4/L5 downstream layers as a user-message section, enabling the system to perceive things it currently misses (intended irony, domain expertise, cultural references, emotional backstory invisible in the text alone).

---

## Objectives (with exemplar outputs)

### OBJ-6: Gathering Service — Infrastructure Composition (CREATE)

**Current output**: Nothing. The system reads only the essay text. If a student writes about Kintsugi but never mentions their Japanese heritage, L3 cannot know whether the reference is deep cultural knowledge or a Wikipedia paragraph. If a student's cold, clinical prose is intentional detachment (literary device), L3.75 reads it as flatness.

**Target output**: Before analysis begins, the system conducts a 2-4 turn gathering conversation. After gathering:

```typescript
StudentDeclaredContext {
  intent: "I want this essay to show that my relationship with failure changed when I stopped seeing broken pottery as ruined",
  domain: "Japanese ceramics, specifically Kintsugi — I've practiced for 3 years with my grandmother",
  audience: "MIT admissions — I'm applying for materials science",
  backstory: "My grandmother is a certified Kintsugi artisan in Kanazawa. The bowl in P2 is one she repaired after the 2007 earthquake.",
  emotionalStakes: "This essay is about my grandmother's declining health and how repair became personal",
  voiceChoices: "The clinical tone in P1-P2 is intentional — I wanted distance before the emotional reveal in P4",
  rawExchanges: ConversationTurn[]  // full gathering conversation for audit
}
```

**Resolution**: `novel`

**Rationale for rejecting both proposals**:
- Proposal A's deep-dive-template approach **breaks** (Adversary A-OBJ-6-gathering-via-deepdive): `runDeepDive()` requires `profile`, `currentSynthesis`, and `readingStrategy` — none of which exist before analysis. Deep dives are investigation tools for an understood essay, not blank-slate gathering tools.
- Proposal A's question-queue reuse **breaks** (Adversary A-OBJ-6-question-queue-pollution): `UnderstandingQuestion` targets textual investigation ("What does the shift in P3S2 reveal?"). Meta-essay questions ("What were you trying to say?") aren't investigable by deep dive templates.
- Proposal A's InsightCategory reuse **degrades** (Adversary A-OBJ-6-stage1-reuse): The Stage 1 taxonomy is designed for coaching (reinterpretation, correction, resistance) — not elicitation (intent, domain, backstory).
- Proposal B's L1 extension **breaks** (Adversary B-OBJ-6-L1-epistemic): Adding `cannotInterpret` to L1 ripples to 4+ consumers and requires Haiku to perform epistemic reasoning it's unreliable at.
- Proposal B's coaching-service reuse **breaks** (Adversary B-OBJ-6-coaching-reuse): The coaching service degenerates with an empty profile — Stage 2 routing, Stage 3 context assembly, Stage 4 deepening all assume a populated profile.

**Novel approach — standalone `GatheringService`**:

A lightweight, purpose-built 3-phase gathering service that shares NO infrastructure with the analysis pipeline or coaching service. It exists entirely before the pipeline runs.

**Phase 1: Seed Question Generation** (Haiku, ~$0.003)
- Input: essay text only (no profile, no understanding)
- System prompt: "You are reading a college essay for the first time. What 2-3 things would you want to ask the writer to understand their essay more deeply? Focus on: authorial intent, domain knowledge, emotional backstory, and voice choices."
- Output: 2-3 seed questions ranked by information value
- Why Haiku: This is pattern recognition on surface text, not deep reasoning

**Phase 2: Multi-turn Gathering Conversation** (Haiku for classification, no LLM for routing)
- Student answers seed questions
- Each answer is classified (Haiku) into one of 6 gathering facets: `intent | domain | audience | backstory | emotionalStakes | voiceChoices`
- Classification drives follow-up: if `domain` is rich but `intent` is empty, ask about intent next
- Conversation cap: 4 turns (2-3 questions + 1 follow-up)
- Pure logic routing — no LLM for deciding what to ask next (gap detection is trivial: which facets have zero content?)

**Phase 3: Crystallization** (Sonnet, ~$0.01)
- Input: full gathering conversation + essay text
- System prompt: "Synthesize the student's declarations into a structured context object. Preserve their exact words for intent. Flag any contradictions between what they say and what the text shows (these are coaching gold)."
- Output: `StudentDeclaredContext` — the structured object that travels through the pipeline
- Why Sonnet: Synthesis of free-form conversation into structured output requires quality

**Total cost**: ~$0.015-0.02 per gathering (1 Haiku seed + 2-4 Haiku classifications + 1 Sonnet crystallization)

**New file**: `src/services/essayIntelligence/analysis/gatheringService.ts` (~300 lines)

**Type additions** to `profileTypes.ts`:
```typescript
interface StudentDeclaredContext {
  intent: string | null;
  domain: string | null;
  audience: string | null;
  backstory: string | null;
  emotionalStakes: string | null;
  voiceChoices: string | null;
  contradictions: Array<{ declared: string; observed: string; tension: string }>;
  confidence: 'partial' | 'complete';
  rawExchanges: Array<{ role: 'system' | 'student'; content: string }>;
}
```

**Why this is novel (not just "incremental modified")**:
- No deep-dive templates, no question queue, no coaching service reuse, no L1 extension
- Purpose-built for elicitation (not investigation), with its own question taxonomy
- Gap detection is pure logic (which facets are empty), not LLM-driven (no B-OBJ-6-gap-triage-logic degradation)
- Runs entirely before the pipeline — no dependency on profile, synthesis, or reading strategy

---

### OBJ-1: Pre-Analysis Student Context on PipelineInput (CREATE)

**Current output**: `PipelineInput` has: `essayId`, `essayText`, `essayType`, `promptText?`, `checkpointStore?`, `includeAnnotations?`, `reanalysisBrief?`, `priorFindings?`.

**Target output**: `PipelineInput` gains `studentContext?: StudentDeclaredContext`. The orchestrator threads it to every phase.

**Resolution**: `incremental`

This is a data-plumbing objective. Add `studentContext?: StudentDeclaredContext` to `PipelineInput`. The orchestrator passes it forward to L3, L3.75, L3.5, L4, L5. No new files.

---

### OBJ-2: L3 Walk Enrichment via Student Context (ELEVATE)

**Current output**: L3 walk understands each paragraph based solely on text + accumulated understanding from prior paragraphs. When a student writes "the clinical distance was a choice," L3 cannot know this.

**Target output**: L3 walk receives student context and uses it as an investigation lens. When the student says "the clinical tone in P1-P2 is intentional," the walk's understanding of P1 shifts from "flat/detached register" to "deliberately constrained register creating distance for later contrast." The walk produces architecturally richer observations because it can distinguish intentional craft from accidental weakness.

**Exemplar — P1 understanding without context**:
```
Role: "Opening scene-setter with sensory grounding"
Function: "Establishes clinical, observational register through specific physical details"
```

**Exemplar — P1 understanding WITH context**:
```
Role: "Deliberate emotional suppression establishing baseline for P4 contrast"
Function: "Constructs clinical register through specific physical details — the CHOICE of this register
(student-confirmed as intentional distancing) positions the reader in the narrator's pre-revelation
epistemology: understanding through measurement rather than feeling"
```

**Resolution**: `incremental_modified`

A's injection approach is correct in principle, but A-OBJ-2-injection-position (student context at end of ~6K prompt gets minimal attention) and A-OBJ-7-uniform-injection (bypasses ProfileRouter token budget) must be addressed.

**Modification**: Inject student context as a **dedicated section in the user prompt, immediately after the essay text and before accumulated understanding context**. This positions it in the high-attention zone (after the thing being analyzed, before the context used to analyze it).

The injection is NOT through ProfileRouter — it's a direct string injection in `sequentialDeepWalk.ts`'s paragraph prompt building, at the same structural position as `reanalysisContext`. This avoids A-OBJ-7-uniform-injection (no token budget pollution) while ensuring visibility.

**Implementation**: Add `studentContext?: string` to `walkEssay()` options. In each paragraph's user prompt, inject after essay text:

```
=== STUDENT-DECLARED CONTEXT ===
The writer has shared the following about their essay. Use this to deepen
your understanding — what the text DOES may differ from what the student
INTENDED, and that divergence is itself meaningful.

{formatted student context}
```

**Critical framing**: The prompt says "use this to deepen understanding" not "use this as truth." The walk is free to notice that the student's declared intent doesn't match the text — that's an observation, not a contradiction to suppress. Confirmed V1 finding #3: "Note alignment, not resolve."

**File changes**: `sequentialDeepWalk.ts` — add option, inject into prompt building.

---

### OBJ-3: L3.75 Holistic Synthesis Enrichment (ELEVATE)

**Current output**: L3.75 synthesizes 10 holistic sections from paragraph-level understanding only. Voice identity, emotional topography, thematic architecture — all inferred from text alone.

**Target output**: L3.75 receives student context and uses it to:
1. Anchor voice analysis with student-confirmed voice choices ("the clinical tone was intentional")
2. Enrich thematic architecture with student-stated intent ("this essay is about repair")
3. Add emotional depth to topography with declared stakes ("this is about my grandmother's health")
4. Inform admissions positioning with stated audience ("MIT materials science")

**Exemplar — voice identity without context**:
```
signature: "Clinical, observational register with high specificity in sensory details.
Register shifts to more colloquial warmth in P4."
```

**Exemplar — voice identity WITH context**:
```
signature: "Clinical, observational register with high specificity in sensory details —
CONFIRMED by writer as deliberate emotional suppression technique. The register shift to
colloquial warmth in P4 gains architectural significance: the writer's stated intent was
'distance before emotional reveal,' making P4's warmth the first moment of unguarded voice
rather than a style inconsistency."
```

**Resolution**: `incremental_modified`

Inject student context into the L3.75 user prompt (not system prompt — confirmed V1 finding #4: preserve caching). Position: after the holistic evolution scaffold, before the output schema.

**Voice claims stay in L3.5** (confirmed V1 finding #2): L3.75 describes voice patterns and notes student confirmations. L3.5 evaluates whether the intentional choices land (e.g., "the student intended clinical distance, but the text reads as emotionally disengaged rather than deliberately restrained — the technique doesn't achieve its stated purpose").

**File changes**: `holisticSynthesis.ts` — inject `studentContext` into Phase A and Phase B user prompt builders.

---

### OBJ-4: L3.5 Analysis — Voice Claims + Intent (ELEVATE)

**Current output**: L3.5 evaluates each paragraph's effectiveness based on understanding + holistic context. Voice analysis identifies register, shifts, and patterns. But it cannot distinguish "this register choice was intentional and achieved its effect" from "this register choice seems accidental and creates flatness."

**Target output**: L3.5 analysis includes:
- Intent-effect gap detection: "Student intended X, text achieves Y" — this gap (or alignment) is coaching fuel
- Voice claim evaluation: "Student says clinical tone is intentional distance. Does the text support this reading? Yes: the sensory specificity in P1S2 constructs a deliberately clinical epistemology."

**Exemplar — sentence analysis without context**:
```
strengths: ["Uses specific sensory details to ground the reader"]
weaknesses: ["Register feels clinical and emotionally distant"]
```

**Exemplar — sentence analysis WITH context**:
```
strengths: ["Uses specific sensory details to construct deliberate emotional distance
(confirmed as intentional by writer). The clinical register serves the essay's architecture:
pre-revelation restraint that makes P4's emotional disclosure land harder."]
weaknesses: ["While the clinical register IS intentional, the transition to emotional warmth
in P4 is abrupt rather than graduated — the gap between 'cold counter temperature' and P4's
colloquial warmth creates a jarring shift rather than the contrast the writer intended."]
```

**Resolution**: `incremental_modified`

Inject student context into `buildProfileContext()` (Block 2 of L3.5, which is cached across all parallel paragraph calls). Position: after holistic understanding sections, as a new `=== STUDENT-DECLARED CONTEXT ===` section.

**Addresses A-OBJ-7-caching-break**: By adding to Block 2 (the cached block), student context is part of the cache key. All parallel paragraph analyses share the same cached prefix. No prefix caching break — the context is part of the prefix, not appended per-paragraph.

**File changes**: `analysisPass.ts` — add `studentContext?: StudentDeclaredContext` parameter to `runAnalysisPass()`, inject into `buildProfileContext()`.

---

### OBJ-5: L4/L5 — IntentBridge Pre-Population (ELEVATE)

**Current output**: `IntentBridge.studentIntent` is null on first analysis. It gets populated only after L6 coaching conversations. This means the first-pass North Star has no student voice — it's entirely system-inferred.

**Target output**: `IntentBridge.studentIntent` is pre-populated from gathering if the student stated intent. The crystallizer prompt instructs: "The student has stated their intent (see context). Use this as the `studentIntent` field. Note alignment or divergence — do NOT resolve the divergence."

**Exemplar — IntentBridge without context**:
```
{ studentIntent: null, systemReading: "Essay about cultural heritage through ceramic repair",
  alignmentNote: null }
```

**Exemplar — IntentBridge WITH context**:
```
{
  studentIntent: "I want this essay to show that my relationship with failure changed when
  I stopped seeing broken pottery as ruined",
  systemReading: "Essay traces an epistemological shift: from failure-as-loss to failure-as-material.
  The Kintsugi metaphor operates on three levels: literal craft, family relationship, personal identity.",
  alignmentNote: "Student frames it as 'relationship with failure' — system reads a deeper layer
  about epistemology (how the narrator KNOWS things). The student's frame is accurate but partial —
  coaching can surface the epistemological dimension."
}
```

**Resolution**: `incremental_modified`

Inject student context into crystallizer prompt. The crystallizer already produces IntentBridge — this just gives it data to populate `studentIntent` from.

**Not** Proposal B's approach (let L4 produce IntentBridge from student context independently) — Adversary B-OBJ-5-premature-intentbridge correctly notes that the coaching discovery moment matters. But pre-populating from an explicit gathering conversation is different from pre-chewing — the student literally SAID their intent. The discovery moment is in the *divergence*, not in the extraction.

**File changes**: `crystallizer.ts` — inject `studentContext` into crystallization prompt.

---

### OBJ-7: Downstream Layer Injection Protocol (ELEVATE)

**Current output**: No student context flows through the pipeline.

**Target output**: A single `buildStudentContextBlock(ctx: StudentDeclaredContext): string` utility function that formats student context into a prompt-injectable section. Each layer calls it when building prompts. Not a universal injection — each layer uses it in its own prompt-building function at the architecturally correct position.

**Resolution**: `incremental_modified`

**Addresses A-OBJ-7-uniform-injection**: NOT a single injection point. Each layer injects at its own optimal position:
- L3: after essay text, before accumulated understanding (high-attention for the walk)
- L3.75: after holistic evolution scaffold, before output schema (synthesis context)
- L3.5: in Block 2 (cached profile context), after holistic understanding sections
- L4: in crystallizer prompt, near IntentBridge output schema (direct relevance)
- L5: in annotation prompt, after phase context (feedback framing)

L1 and L2 are **excluded** (confirmed V1 finding #1): L1 is descriptive cataloguing that should not be biased by student declarations. L2 is structural cartography that should not be influenced by stated intent.

**Addresses A-OBJ-7-caching-break**: Each layer manages its own caching. L3.5's Block 2 includes student context in the cached prefix. L3's system prompt remains cached (student context goes in user prompt). L3.75's system prompt remains cached.

**New utility**: `buildStudentContextBlock()` in a shared module (`src/services/essayIntelligence/analysis/contextFormatters.ts`).

**File changes**: New file `contextFormatters.ts` (~50 lines). Modifications to: `sequentialDeepWalk.ts`, `holisticSynthesis.ts`, `analysisPass.ts`, `crystallizer.ts`, `deepAnnotationService.ts`.

---

## Execution Plan

### Step 1: Type Definitions + Formatting Utility

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/profileTypes.ts` |
| **Change** | Add `StudentDeclaredContext` interface (intent, domain, audience, backstory, emotionalStakes, voiceChoices, contradictions, confidence, rawExchanges) |
| **Source** | Novel |
| **Achieves** | OBJ-1 (types) |
| **Enables** | Steps 2-7 (all consumers need the type) |
| **Depends on** | Nothing |
| **Verify** | `npx tsc --noEmit` — type compiles, no consumers broken |

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/contextFormatters.ts` (NEW) |
| **Change** | `buildStudentContextBlock(ctx: StudentDeclaredContext): string` — formats context into a prompt section with header, facets, and contradictions |
| **Source** | Novel |
| **Achieves** | OBJ-7 (utility) |
| **Enables** | Steps 3-6 (all injection points call this) |
| **Depends on** | Step 1 types |
| **Verify** | Unit test: formatter produces expected string from sample context |

### Step 2: GatheringService

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/gatheringService.ts` (NEW) |
| **Change** | 3-phase gathering service: `generateSeedQuestions()` (Haiku), `classifyAnswer()` (Haiku), `crystallizeContext()` (Sonnet). Exported `GatheringService` class + `gatheringService` singleton. |
| **Source** | Novel |
| **Achieves** | OBJ-6 (the heart) |
| **Enables** | Steps 3-7 (all enrichment depends on gathered context) |
| **Depends on** | Step 1 types |
| **Verify** | Integration test: feed essay text, get seed questions, simulate student answers, get `StudentDeclaredContext` |

### Step 3: PipelineInput Extension + L3 Walk Injection

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` |
| **Change** | Add `studentContext?: StudentDeclaredContext` to `PipelineInput`. Thread to L3 walk call via `options.studentContext`. |
| **Source** | Incremental |
| **Achieves** | OBJ-1 (plumbing) |
| **Enables** | Steps 4-6 |
| **Depends on** | Steps 1, 2 |
| **Verify** | `npx tsc --noEmit` — pipeline compiles with new optional field |

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` |
| **Change** | Add `studentContext?: string` to `walkEssay()` options. In paragraph prompt building, inject formatted student context after essay text, before accumulated understanding. Uses `buildStudentContextBlock()`. |
| **Source** | Incremental modified (A's injection + Adversary's position fix) |
| **Achieves** | OBJ-2 (walk enrichment) |
| **Enables** | Richer understanding flows downstream to L3.75 and L3.5 |
| **Depends on** | Steps 1, 3 (pipeline threading) |
| **Verify** | Integration test: walk with/without student context — compare understanding depth for an essay with intentional voice choices |

### Step 4: L3.75 Holistic Synthesis Injection

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/holisticSynthesis.ts` |
| **Change** | Add `studentContext?: StudentDeclaredContext` to `HolisticSynthesisInput` and `SynthesisIterationInput`. Inject formatted context into Phase A and Phase B user prompts after holistic evolution scaffold. |
| **Source** | Incremental modified |
| **Achieves** | OBJ-3 (synthesis enrichment) |
| **Enables** | Richer holistic sections feed better L3.5 analysis |
| **Depends on** | Step 3 (orchestrator threading) |
| **Verify** | Integration test: synthesis with student context produces voice identity that acknowledges student-confirmed voice choices |

### Step 5: L3.5 Analysis Pass Injection

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/analysisPass.ts` |
| **Change** | Add `studentContext?: StudentDeclaredContext` parameter to `runAnalysisPass()`. Inject formatted context into `buildProfileContext()` Block 2, after holistic understanding sections, as a `=== STUDENT-DECLARED CONTEXT ===` section. |
| **Source** | Incremental modified (A's Block 2 + caching fix) |
| **Achieves** | OBJ-4 (analysis enrichment with voice claims + intent-effect gaps) |
| **Enables** | Intent-aware scoring, voice claim evaluation |
| **Depends on** | Step 3 (orchestrator threading) |
| **Verify** | Integration test: analysis with student context produces intent-effect gap observations in sentence strengths/weaknesses |

### Step 6: L4 Crystallizer + L5 Annotations Injection

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/crystallizer.ts` |
| **Change** | Accept `studentContext?: StudentDeclaredContext`. Inject into crystallization prompt. When student context has `intent`, instruct the LLM to populate `IntentBridge.studentIntent` from it. |
| **Source** | Incremental modified |
| **Achieves** | OBJ-5 (IntentBridge pre-population) |
| **Enables** | First-pass North Star with student voice |
| **Depends on** | Step 3 (orchestrator threading) |
| **Verify** | Integration test: crystallization with student intent produces populated IntentBridge.studentIntent with alignmentNote |

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/deepAnnotationService.ts` |
| **Change** | Accept `studentContext?: StudentDeclaredContext`. Inject into annotation prompt so L5 feedback is intent-aware. |
| **Source** | Incremental |
| **Achieves** | OBJ-7 (complete downstream coverage) |
| **Enables** | Annotations that reference student intent |
| **Depends on** | Step 3 (orchestrator threading) |
| **Verify** | `npx tsc --noEmit` |

### Step 7: Orchestrator Wiring

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` |
| **Change** | Thread `input.studentContext` to: L3 walk options, L3.75 synthesis input, L3.5 analysis pass, L4 crystallizer, L5 annotations. Format via `buildStudentContextBlock()` where needed. |
| **Source** | Incremental |
| **Achieves** | OBJ-7 (complete wiring) |
| **Enables** | End-to-end student context flow |
| **Depends on** | Steps 3-6 (all injection points exist) |
| **Verify** | End-to-end test: `PipelineInput` with `studentContext` produces profile with populated IntentBridge, understanding references student declarations |

### Step 8: Index + Exports

| Attribute | Value |
|-----------|-------|
| **File** | `src/services/essayIntelligence/index.ts` |
| **Change** | Export `GatheringService`, `gatheringService`, `StudentDeclaredContext`, `buildStudentContextBlock` |
| **Source** | Incremental |
| **Achieves** | Clean import paths |
| **Enables** | External consumers (API routes, tests) |
| **Depends on** | Steps 1-7 |
| **Verify** | `npx tsc --noEmit` |

---

## Output Quality

### Current vs Target vs Expected per OBJ

| OBJ | Current | Target | Expected |
|-----|---------|--------|----------|
| OBJ-6 (Gathering) | No gathering. System reads text blindly. | 2-4 turn gathering conversation producing structured `StudentDeclaredContext` with 6 facets. | Gathering captures intent, domain, and voice choices in 90%+ of sessions. ~$0.015-0.02 per gathering. |
| OBJ-2 (L3 Walk) | Understanding based on text alone. Intentional craft choices read as accidents. | Walk understands intentional choices as architectural decisions. Observations reach architectural level more consistently. | ~15-25% of paragraphs produce deeper observations when student context is available. Most impact on voice-related and intent-related paragraphs. |
| OBJ-3 (L3.75 Synthesis) | Holistic synthesis inferred entirely from text. Voice identity, emotional topography, thematic architecture all system-inferred. | Synthesis anchored by student-confirmed voice, intent, and emotional stakes. Contradictions between declared intent and text behavior explicitly noted. | Voice identity gains "confirmed by writer" annotations. Thematic architecture gains student-stated framing. 100% of syntheses incorporate available context. |
| OBJ-4 (L3.5 Analysis) | Analysis evaluates text without knowing intent. Cannot distinguish intentional-but-failed from accidental. | Analysis produces intent-effect gap observations. Voice claims evaluated against text evidence. | ~30% of sentence analyses gain intent-aware observations when student context is available. Scoring itself unchanged (we add perception, not adjust numbers). |
| OBJ-5 (L4 IntentBridge) | `studentIntent: null` on first pass. North Star is entirely system-inferred. | IntentBridge populated from gathering. Alignment note captures divergence. | 100% of first-pass analyses with gathering produce populated IntentBridge. |
| OBJ-7 (Injection Protocol) | No injection protocol exists. | Per-layer injection at architecturally optimal positions. Caching preserved. Token budgets respected. | Zero caching breaks. Zero token budget violations. All 5 downstream layers receive context. |

---

## Risks

### R1: Gathering Quality Variance (Medium)
**Risk**: Haiku seed questions may be generic ("What were you trying to say?") rather than essay-specific ("The Kintsugi reference in P2 — is this from personal experience?").
**Mitigation**: Seed question prompt includes essay text and instructs Haiku to ask SPECIFIC questions grounded in textual observations. Test with 10 diverse essays and evaluate question specificity.
**Impact if unmitigated**: Low — generic questions still elicit useful context (students' answers are rich even to generic prompts). The crystallization Sonnet compensates.

### R2: Student Context Overfit (Low)
**Risk**: L3 walk over-indexes on student declarations, reading everything through the lens of stated intent rather than maintaining independent analytical judgment.
**Mitigation**: Injection framing explicitly says "what the text DOES may differ from what the student INTENDED, and that divergence is itself meaningful." The walk's system prompt still enforces understanding-only descriptive analysis.
**Impact if unmitigated**: Medium — the walk might confirm student intent uncritically. Confirmed V1 finding #3 ("note alignment, not resolve") is the structural guard.

### R3: Gathering Abandonment (Low)
**Risk**: Students may skip or rush through gathering, producing thin context.
**Mitigation**: `StudentDeclaredContext.confidence` field distinguishes 'partial' from 'complete'. The pipeline works with or without context (all fields are nullable). Partial context is still better than none.
**Impact if unmitigated**: None — the pipeline degrades gracefully to current behavior.

### R4: Token Budget Inflation (Low)
**Risk**: Student context adds ~200-500 tokens to each downstream prompt.
**Mitigation**: `buildStudentContextBlock()` is compact (6 facets, ~50-100 words each max). For L3, context is in user prompt (no budget impact). For L3.5, context is in Block 2 (cached — paid once). For L3.75, context is in user prompt (single call — fixed cost). Net pipeline cost increase: ~$0.01-0.02.
**Impact if unmitigated**: Negligible — $0.02 on a $0.15-0.50 pipeline.

---

## System Strengths Preservation Check

| Strength | Preserved? | How |
|----------|-----------|-----|
| S1: Understanding/Analysis/Feedback separation | Yes | Student context is injected at each layer's prompt level. L3 uses it for understanding, L3.5 for evaluation, L5 for feedback. No layer confusion. |
| S2: Deep dive infrastructure reusability | Yes | GatheringService is standalone. Deep dives are untouched. |
| S3: Question queue lifecycle management | Yes | Gathering questions are NOT in the question queue. They're a separate conversation. No queue pollution. |
| S4: System prompt caching architecture | Yes | All system prompts remain cached. Student context goes in user prompts (L3, L3.75, L4) or cached Block 2 (L3.5). |
| S5: Stage 1 classification reusability | Yes | Coaching service Stage 1 taxonomy is untouched. Gathering uses its own facet classification. |

---

## Rejected Approaches

### Deep-Dive Template Reuse for Gathering (Proposal A, OBJ-6)
Rejected because `runDeepDive()` requires `profile`, `currentSynthesis`, and `readingStrategy` that don't exist before analysis. The function signature is `runDeepDive(request, essayText, profile, currentSynthesis, readingStrategy, findingStore?)` — 3 of 5 required parameters are unavailable at gathering time. Confirmed by source reading of `deepDiveRunner.ts:78-85`.

### L1 Extension with `cannotInterpret` (Proposal B, OBJ-6)
Rejected because: (1) L1 type change ripples to 4+ consumers (coordinator, router, walk, analysis pass), (2) Haiku is unreliable for epistemic reasoning about what it can't interpret, (3) it violates L1's design principle of purely descriptive cataloguing.

### Question Queue for Gathering Questions (Proposal A, OBJ-6)
Rejected because `UnderstandingQuestion` is designed for textual investigation ("What does P3S2's shift reveal?") not meta-essay elicitation ("What were you trying to say?"). Gathering questions aren't investigable by deep dive templates — they require student answers, not LLM analysis.

### Coaching Service for Gathering Conversation (Proposal B, OBJ-6)
Rejected because the coaching service degenerates with an empty profile: Stage 2 routing uses `assembleContext()` which needs populated profile sections, Stage 3 prompt references North Star and improvement phase, Stage 4 deepening evaluates insights against existing understanding. With an empty profile, all these stages produce garbage.

### ReadingStrategy as Distribution Channel (Proposal B, OBJ-7)
Rejected because L3.5 and L4 do NOT consume ReadingStrategy. The `ReadingStrategy` type is produced by L3.75 and consumed by the growth engine for question curation. It doesn't reach `buildProfileContext()` in analysisPass.ts or the crystallizer prompt.

### Single L3.75 Editorial Pass for All Context (Proposal B, OBJ-7)
Rejected as single point of failure. If L3.75's editorial pass mishandles student context, all downstream layers get corrupted context. Per-layer injection with a shared formatting utility is more robust.

### Weaving Context into L1 Observations (Proposal B, OBJ-2)
Rejected because it erases provenance. If L1 observations incorporate student declarations, later layers can't distinguish "the text shows X" from "the student said X." This violates the understanding/analysis/feedback separation (S1) and makes it impossible for L3.5 to evaluate intent-effect gaps.

---

## Unlocked Opportunities

### U1: Supplement/PIQ Intent Bridging
With gathering, supplements and PIQs can populate `IntentBridge` via `DistinctivenessSignature` — the student says "this supplement is about my research lab because no one else has done computational origami," and the system can evaluate whether the text achieves that distinctiveness. Currently impossible without gathering because the first L6 conversation happens AFTER analysis.

### U2: Coaching-Quality Leap
When the coach knows what the student INTENDED, it can have higher-quality conversations: "You said you wanted clinical distance in P1-P2 — let's look at whether the text achieves that" is radically more useful than "P1-P2 seem emotionally distant." This transforms coaching from "here's what I see" to "here's how what you intended compares to what I see."

### U3: Re-Analysis Efficiency
On re-analysis, `StudentDeclaredContext` persists. The focused analysis mode can check whether edits moved the text closer to or further from the student's stated intent. This makes re-analysis intent-aware without requiring a new gathering conversation.

### U4: Portfolio Strategy Integration
`StudentDeclaredContext.audience` (e.g., "MIT materials science") enables portfolio-level intelligence: does this essay's positioning complement or duplicate other essays in the portfolio? Currently, portfolio strategy infers audience from essay type alone.

---

## Scope

### Files Changed (8)
1. `src/services/essayIntelligence/profileTypes.ts` — add `StudentDeclaredContext` interface (~20 lines)
2. `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — add `studentContext` to `PipelineInput`, thread to all phases (~30 lines)
3. `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` — add `studentContext` option, inject in prompt (~25 lines)
4. `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — add to input types, inject in Phase A/B prompts (~30 lines)
5. `src/services/essayIntelligence/analysis/analysisPass.ts` — add parameter, inject in `buildProfileContext()` (~25 lines)
6. `src/services/essayIntelligence/analysis/crystallizer.ts` — add parameter, inject for IntentBridge (~20 lines)
7. `src/services/essayIntelligence/analysis/deepAnnotationService.ts` — add parameter, inject in annotation prompt (~15 lines)
8. `src/services/essayIntelligence/index.ts` — exports (~5 lines)

### Files Created (2)
1. `src/services/essayIntelligence/analysis/gatheringService.ts` — ~300 lines (3-phase gathering)
2. `src/services/essayIntelligence/analysis/contextFormatters.ts` — ~50 lines (shared formatting utility)

### Estimated Total Diff
~520 lines added, ~0 lines removed. No refactoring — all additive changes to existing files (new optional parameters, new prompt sections). Two new files for new capability.
