# Improvement 5: L5 Annotations — Template Compliance to Genuine Teaching

> Implementation prompt for a future Claude session. Self-contained.

---

## Context

Layer 5 (Deep Annotation Service) generates ephemeral, phase-aware annotations for each paragraph of the student's essay. It receives the complete EssayProfile (understanding + analysis + North Star) and produces `L5AnnotationResult` with paragraph-level and essay-level annotations.

The current implementation in `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (~1200 lines) has several rigidity problems that violate the LLM-first design principles. It also has unexplored depth in what annotations can be: the system currently produces *assessment annotations* ("your voice shifts here") when it should produce *teaching annotations* ("this voice shift undermines the emotional arc you're building — and here's why that matters for your reader").

**Files to modify:**
- `src/services/essayIntelligence/analysis/deepAnnotationService.ts` — primary target
- `src/services/essayIntelligence/profileTypes.ts` — type updates for `L5Annotation`, new types
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — integration changes

**Files to read first (for context):**
- `docs/specs/PLAN2.md` — V2 evolution plan (L5 is "MODERATE UPGRADE"), Implementation Status sections at bottom
- `src/services/essayIntelligence/profileTypes.ts` — current types
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — how L5 is called
- `src/services/essayIntelligence/findings/findingStore.ts` — Finding lifecycle API (Cluster A)
- `src/services/essayIntelligence/findings/findingContextBuilder.ts` — How findings are serialized for LLM context

---

## Context from Cluster C Implementation (Forward Propagation)

> The following discoveries from Cluster C (#7 Iterative L3.75 + #8 Adaptive Router) affect this improvement.

### Key Types Available

```typescript
// From growthEngine.ts — finding merge results
// Findings now accumulate maturity across growth cycles. Deep dives produce
// findings with buildsOn/relatedTo references. L5 annotations should reference
// these findings by ID for grounded teaching.

// From profileTypes.ts — ReadingStrategy (produced by L3.75)
interface ReadingStrategy {
  strategy: string;           // meta-understanding of how to read THIS essay
  bestApproach: string;       // what reading approach yields deepest understanding
  antiPatterns: string[];     // what this essay is NOT
  contextPriorities: string[]; // profile sections most important, in priority order
}
// L5 annotations receive the ReadingStrategy via the profile. Use contextPriorities
// to understand which dimensions matter most for THIS essay's teaching.

// From profileTypes.ts — DeepDiveResult findings
// Deep dive findings have scope.textEvidence with precise locations.
// Annotation prompts should be able to reference finding IDs directly.
```

### Discoveries & Watch-outs

1. **Finding IDs follow the pattern `FD{iteration}_{promptType}_{index}` for deep dives, `FR{iteration}_{paragraph}_{index}` for re-reads.** When building annotation prompts, include the FindingStore's serialized context (via `buildFindingReferenceContext()`) so the LLM can reference specific findings.

2. **ReadingStrategy.contextPriorities tells you which holistic dimensions matter most for THIS essay.** An annotation prompt for a voice-dominant essay should emphasize voice-related teaching; a structure-dominant essay should emphasize architectural teaching. Pass the reading strategy to annotation prompts as context.

3. **The growth cycle produces `reReadCandidates` — paragraphs L3.75 flagged for re-reading.** These paragraphs likely have deeper understanding than others. Annotation density at these paragraphs may naturally be higher, which is signal, not error.

4. **Deep dives bypassed the profile router.** The router's `assembleDeepDive()` rule exists but `runDeepDive()` builds its own context. L5 annotations should use the router (`l5_feedback_annotations` rule) — don't bypass it.

5. **Rigidity pattern to avoid**: Cluster C had `newFindings.slice(0, 10)` and `active.slice(0, 15)` — hard caps on findings shown to the LLM. Both were fixed. Ensure annotation generation does NOT cap per-paragraph findings/observations sent to the prompt. If the profile has 20 findings for a paragraph, the LLM should see all 20 and decide which ones deserve annotations.

---

## Design Principles (LLM-First Rules That Apply)

### Rule 1: The LLM Owns All Judgment — The System Tracks and Organizes
The LLM decides what type of annotation each finding needs, what teaching mode to use, what granularity to operate at. The system validates referential integrity (does the annotation point to real text?) and tracks metadata (how many annotations, what cost).

### Rule 2: Never Discard Paid LLM Output
**CRITICAL.** The current `deduplicateAndPrioritize()` method caps per-paragraph annotation counts using `phaseTarget.maxPerParagraph` and discards excess. This destroys paid output. If the LLM produced 6 annotations for a paragraph, that density is SIGNAL — the paragraph is either rich (many strengths to acknowledge) or troubled (many growth edges). Either way, discarding is wrong. Remove the cap. Keep all annotations. Add a diagnostic flag when density diverges from phase expectations.

### Rule 3: No Closed Taxonomies for LLM Perception
The current `AnnotationType` enum (`strength_acknowledgment | growth_opportunity | structural_note | teaching_moment`) is a routing taxonomy, which is fine. But the system should not force every annotation into exactly one of these four buckets if the LLM perceives something that spans categories. Allow the LLM to assign a primary type for routing + a free-text `teachingIntent` that describes what this annotation is actually trying to do.

### Rule 4: No Whack-a-Mole Pattern Matching
The task mentions `DESCRIBE_BACK_PATTERNS` regex detection. If this exists (or is planned), remove it entirely. Quality enforcement lives in the prompt: show examples of bad annotations ("This sentence uses concrete imagery") vs. good annotations ("This imagery constructs the physical-transaction world that P4's meaning-shift depends on — without it, the diamond's transformation feels unmoored"). Cognitive forcing functions in the prompt, not regex post-hoc.

### Rule 5: Soft Guidance Over Hard Blocklists
The current `PHASE_TARGETS` object contains hard `minPerParagraph`/`maxPerParagraph` counts and a `focusLevel` string that constrains granularity. Replace with soft prompt guidance: "At Foundation, prioritize essay-level and paragraph-level insights. Use sentence-level precision only when a single sentence is the lynchpin of a major structural issue. At Polish, most annotations will be word-level and sentence-level, but if you discover a structural problem that earlier phases missed, surface it."

### Rule 6: System Infrastructure IS Appropriate
Keep: referential integrity validation (annotation points to real paragraph/sentence), cost tracking, batch parallelism, prompt caching strategy, the North Star grounding requirement (annotations must connect to the essay's architecture — this is structural quality control, not judgment restriction).

---

## Core Architecture

### Type Changes

```typescript
// ── REMOVE ──
// Remove PHASE_TARGETS constant (hard min/max/focusLevel)
// Remove PHASE_STRENGTH_RATIOS (if present)
// Remove ANNOTATION_SCOPE_BY_PHASE (if present)
// Remove DESCRIBE_BACK_PATTERNS (if present)

// ── MODIFY: L5Annotation ──
export interface L5Annotation {
  id: string;

  /** Location anchor — KEPT. Structural quality control, not judgment restriction. */
  location: {
    paragraphIndex: number;
    sentenceIndex: number | null;
    /** Exact text span for highlighting. Must exist in the paragraph text. */
    spanText: string | null;
  };

  /**
   * Primary annotation type — ROUTING taxonomy (Rule 3: ok as routing tag).
   * The LLM assigns this for downstream UI/sorting, but the real intent
   * lives in teachingIntent.
   */
  type: 'strength' | 'growth' | 'structural' | 'teaching';

  /**
   * NEW: Free-text teaching intent — what this annotation is trying to
   * accomplish for the student's learning. Not constrained to the 4 types.
   *
   * Examples:
   * - "Build the student's capacity to see voice register shifts on their own"
   * - "Show the architectural consequence of this paragraph's pacing"
   * - "Connect this local craft choice to the essay's through-line"
   * - "Acknowledge a genuine strength AND explain WHY it works architecturally"
   */
  teachingIntent: string;

  /**
   * NEW: Teaching mode — LLM-selected PER ANNOTATION based on what this
   * specific finding needs. Not per-essay, not per-phase.
   *
   * AWARENESS: "Notice this..." — draws attention to a pattern the student
   *   likely hasn't seen. No fix suggested. Goal: build perception.
   *   Example: "Notice how your vocabulary shifts when you talk about your
   *   grandfather vs. when you talk about yourself — this pattern repeats
   *   in P2 and P4."
   *
   * CONSEQUENCE: "This matters because..." — explains the architectural
   *   consequence of a local choice. Goal: build structural thinking.
   *   Example: "P2S3 claims your grandfather was determined, but P4 needs
   *   the reader to have EXPERIENCED that determination. The claim here
   *   is spending P4's emotional budget."
   *
   * CONNECTION: "This relates to..." — links this moment to another part
   *   of the essay. Goal: build architectural vision.
   *   Example: "The concrete specificity you achieve in P1 with the
   *   jeweler's loupe is exactly what P3 needs when you describe your
   *   grandmother's story. P3 is abstract where P1 is grounded."
   *
   * ACTION: "Try this..." — specific, structurally-grounded rewrite.
   *   Goal: provide a concrete next step.
   *   Example: "Replace 'reaffirmed my belief in the connection between
   *   technology and human emotion' with what you physically DID when
   *   the user smiled. The reader needs to see your hands, not your thesis."
   *
   * The LLM selects the mode that serves this specific teaching moment.
   * A Foundation-phase essay might still get an ACTION annotation if one
   * sentence fix would unlock a structural breakthrough.
   */
  teachingMode: 'awareness' | 'consequence' | 'connection' | 'action';

  /** The annotation content — specific, architecture-grounded */
  content: string;

  /**
   * WHY this matters — references the essay's architecture.
   * KEPT as required field. This is the North Star grounding requirement
   * (structural quality control).
   */
  teachingRationale: string;

  /** How this relates to the essay's through-line/structural role */
  northStarConnection: string;

  /**
   * Priority 1-5, LLM-assigned based on coaching value for this student
   * at this phase. 1 = "if the student reads ONE annotation, read this one."
   */
  priority: number;

  /** Which improvement phase this annotation naturally belongs to */
  phase: ImprovementPhaseLevel;

  /**
   * Concrete rewrite suggestion — ONLY for ACTION mode annotations.
   * Must be structurally aware: the rewrite considers the paragraph's
   * architectural role, not just sentence quality.
   *
   * BAD rewrite: "Consider: 'The worn leather briefcase held decades of memories'"
   *   (generic — could apply to any essay)
   *
   * GOOD rewrite: "Consider: 'His hands trembled as he unclasped the briefcase —
   *   the same trembling I would later recognize in my own fingers the first time
   *   I soldered a circuit board.' This grounds the grandfather's determination
   *   in physical detail (earning P4's peak) AND plants the inheritance motif
   *   (which P5 needs to land)."
   */
  rewriteExample: string | null;

  /** Confidence in this annotation (0-1) */
  confidence: number;

  /**
   * NEW: Cross-paragraph scope. When this annotation teaches about a
   * pattern that spans multiple paragraphs, list the other paragraphs
   * involved. The location field still points to the PRIMARY anchor.
   *
   * Example: An annotation at P2 that teaches "P2 sets up an expectation
   * that P4 fails to deliver" would have crossParagraphRefs: [4].
   * The UI can render a connecting line or reference.
   */
  crossParagraphRefs: number[];

  /**
   * NEW: Capacity-building note. How does this annotation help the
   * student see patterns THEMSELVES in future writing?
   *
   * Populated only when the LLM identifies a transferable skill.
   * Example: "In your next essay, watch for moments where you shift
   * from specific physical detail to abstract claims. That shift is
   * where your authentic voice yields to your 'essay voice.'"
   */
  capacityBuildingNote: string | null;
}

// ── NEW: Annotation density diagnostic ──
export interface AnnotationDensityDiagnostic {
  paragraphIndex: number;
  annotationCount: number;
  strengthCount: number;
  growthCount: number;
  /**
   * LLM-generated interpretation of the density pattern.
   * Not computed from counts — the LLM assesses what the density means.
   * Example: "High density here reflects P3's architectural richness —
   * it's doing more work than any other paragraph (through-line pivot,
   * voice register shift, emotional peak setup)."
   */
  interpretation: string;
}
```

### Phase Guidance (Soft, Not Hard)

Replace the `PHASE_TARGETS` constant with a prompt guidance function that produces soft instructions:

```typescript
/**
 * Generate soft phase guidance for the annotation prompt.
 * This is GUIDANCE, not enforcement. The LLM decides what each
 * paragraph actually needs.
 */
function buildPhaseGuidance(phase: ImprovementPhaseLevel): string {
  const guidance: Record<ImprovementPhaseLevel, string> = {
    foundation: `PHASE: FOUNDATION
You are annotating an essay that needs foundational structural work.

GUIDANCE (not rules — override when teaching demands it):
- Prioritize essay-level and paragraph-level insights.
  What is the most important structural problem?
- Most annotations should be AWARENESS and CONSEQUENCE modes —
  help the student SEE the structural issues before trying to fix them.
- Use sentence-level precision sparingly — only when a specific sentence
  is the lynchpin of a structural problem (e.g., "THIS sentence is where
  the essay's thesis becomes unclear, and everything after it drifts").
- Typical annotation count: 3-5 total for the essay. More is not better
  at this phase. Less if fewer issues are genuinely important.
- Don't mention word choice, rhythm, or polish-level concerns unless
  they are symptoms of a structural problem.`,

    architecture: `PHASE: ARCHITECTURE
The essay has a clear point, but the reader's journey has structural gaps.

GUIDANCE:
- Prioritize paragraph transitions, pacing, structural roles.
- Most annotations should use CONSEQUENCE and CONNECTION modes —
  show how paragraph-level choices affect the essay's architecture.
- Sentence-level annotations are appropriate when a sentence is
  failing its structural role (e.g., a transition sentence that
  doesn't actually transition).
- Typical annotation count: 4-7 total. Focus on the 2-3 biggest
  architectural gaps.`,

    craft: `PHASE: CRAFT
The structure works. Now each sentence must carry its weight.

GUIDANCE:
- Sentence-level annotations are primary. Word-level when a single
  word choice changes the sentence's architectural contribution.
- All four teaching modes are active, with ACTION becoming more common.
- Give CONCRETE ALTERNATIVES in rewriteExample — but make them
  structurally aware (the rewrite must serve the paragraph's role).
- Typical annotation count: 6-10 total. More annotations per paragraph
  because the granularity is finer.`,

    polish: `PHASE: POLISH
The essay is strong. Word-level precision matters now.

GUIDANCE:
- Word-level and sentence-level precision. Every annotation should
  reference how a word/rhythm/image choice affects the reader's
  experience of the essay's architecture.
- ACTION mode dominates — specific alternatives with architectural
  reasoning.
- Typical annotation count: 8-14. These are surgical.
- Do not surface structural issues that would have been caught at
  Architecture phase UNLESS they are genuinely new discoveries.`,

    distinction: `PHASE: DISTINCTION
The essay is good. The question is: will the AO remember it tomorrow?

GUIDANCE:
- Mix of essay-level (memorability, distinctiveness) and word-level
  (the 1% moves that separate good from unforgettable).
- AWARENESS mode for showing the student what's already distinctive
  (they may not know their best moments are their best moments).
- CONNECTION mode for revealing hidden patterns that could be amplified.
- Typical annotation count: 3-6. Quality over quantity. Each annotation
  should be itself distinctive — if the annotation is generic, it
  doesn't belong in Distinction phase.`,
  };

  return guidance[phase];
}
```

### Annotation Sequencing (Cognitive Flow)

Add a post-generation step where the LLM sequences annotations within each paragraph for optimal learning. This is a PROMPT instruction, not a code sort:

Add to the system prompt:

```
ANNOTATION SEQUENCING:
When generating multiple annotations for a paragraph, order them for
COGNITIVE FLOW — the sequence that builds understanding most naturally:

1. AWARENESS annotations first — what should the student notice?
2. CONSEQUENCE annotations second — why does it matter?
3. CONNECTION annotations third — how does it relate to the rest?
4. ACTION annotations last — what should they do about it?

Within each mode, order by priority (most important first).

This is not a rigid rule — if a single ACTION annotation is the most
important thing about this paragraph, lead with it. But in general,
the student should UNDERSTAND before they ACT.
```

### Cross-Paragraph Annotations

The current system is per-paragraph (parallel Sonnet calls per paragraph). Cross-paragraph teaching moments require a different approach:

**Strategy:** After all paragraph-level annotation calls complete, run ONE additional Sonnet call that receives:
1. All paragraph annotations generated so far
2. The full essay understanding + North Star
3. Instruction: "Identify teaching moments that span paragraphs — patterns, expectations set up and not delivered, through-line moments that only make sense as a connected sequence. Generate 1-3 cross-paragraph annotations."

```typescript
/**
 * Generate cross-paragraph annotations after individual paragraph
 * annotation calls complete.
 *
 * Receives all paragraph annotations + full context.
 * Produces 0-3 annotations that span multiple paragraphs.
 */
private async generateCrossParagraphAnnotations(
  paragraphAnnotations: ParagraphAnnotations[],
  profile: Readonly<EssayProfile>,
  phase: ImprovementPhase,
  systemPrompt: string,
  sharedContext: string,
): Promise<{
  annotations: L5Annotation[];
  cost: number;
  tokenUsage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };
}> {
  // Build a summary of paragraph annotations already generated
  const annotationSummary = paragraphAnnotations
    .filter(pa => pa.annotations.length > 0)
    .map(pa =>
      `P${pa.paragraphIndex}:\n` +
      pa.annotations.map(a =>
        `  [${a.teachingMode}] ${a.content.substring(0, 120)}...`
      ).join('\n')
    ).join('\n\n');

  const userPrompt = `${sharedContext}

===

CROSS-PARAGRAPH ANNOTATION REQUEST:

You have already generated per-paragraph annotations (summarized below).
Now identify teaching moments that SPAN PARAGRAPHS — patterns, expectations,
through-line moments that only make sense as a connected sequence.

These are the annotations ONLY YOU can generate. Per-paragraph calls cannot
see the full picture. You can.

ALREADY GENERATED:
${annotationSummary}

Generate 0-3 cross-paragraph annotations. Each must:
- Reference at least 2 paragraphs with specific text quotes from each
- Explain the RELATIONSHIP between the paragraphs that creates the teaching moment
- Use "location" to anchor to the PRIMARY paragraph, "crossParagraphRefs" for others
- Be something a per-paragraph annotation could NOT have captured

If no cross-paragraph teaching moments exist beyond what individual annotations
already cover, return an empty annotations array. Do not force cross-paragraph
annotations that don't add value.

Output JSON: { "annotations": [...] }`;

  // Call Sonnet
  const response = await callClaude<{ annotations: RawAnnotation[] }>({
    model: SONNET,
    systemPrompt,
    userPrompt,
    maxTokens: 1500,
    temperature: 0.3,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  // ... parse and validate (same as paragraph annotations)
}
```

### Remove Annotation Trimming

In `deduplicateAndPrioritize()`:

**REMOVE:**
```typescript
// REMOVE this block — never discard paid annotations
if (pa.annotations.length > phaseTarget.maxPerParagraph) {
  pa.annotations = pa.annotations.slice(0, phaseTarget.maxPerParagraph);
}
```

**REPLACE WITH:**
```typescript
// Log density diagnostic (never trim)
if (pa.annotations.length > expectedDensity) {
  console.log(
    `[L5] High annotation density at P${pa.paragraphIndex}: ` +
    `${pa.annotations.length} annotations (expected ~${expectedDensity} for ${phase.level} phase). ` +
    `This is diagnostic signal — paragraph may be unusually rich or troubled.`,
  );
}
```

Keep deduplication by content similarity (removing genuinely identical annotations is fine — they represent LLM repetition, not distinct findings). But never trim by quota.

### Rewrite Quality: Structural Awareness

The system prompt must enforce that rewrite examples are structurally aware. Add to the system prompt:

```
REWRITE EXAMPLES — STRUCTURAL AWARENESS REQUIRED:

Every rewriteExample must demonstrate awareness of the paragraph's
architectural role. A rewrite that makes a sentence "better" but ignores
its structural function is worse than no rewrite.

BAD rewrite (locally "better" but structurally unaware):
  Original: "I learned that music taught me discipline"
  Rewrite: "The metronome's relentless click trained my fingers — and my mind"
  WHY BAD: This is a fine sentence, but does it serve THIS paragraph's role
  as the bridge between music and coding? The rewrite adds sensory detail
  but doesn't strengthen the bridge function.

GOOD rewrite (structurally aware):
  Original: "I learned that music taught me discipline"
  Rewrite: "The metronome clicks at 120 BPM — the same precision I would
  later demand from my sorting algorithms. Both punish imprecision instantly."
  WHY GOOD: The rewrite serves P3's bridge function by DEMONSTRATING the
  music-coding connection in the sentence itself, not just claiming it.

If you cannot produce a structurally aware rewrite, set rewriteExample
to null and explain in the teachingRationale what the student should aim
for. A null rewrite with good rationale beats a generic rewrite.
```

### Annotation Versioning (for re-analysis)

When the essay is edited and L5 runs again, some annotations from the previous run may still be relevant. The current system discards all annotations and regenerates (L5 output is ephemeral). This is correct — annotations should be regenerated from the updated profile. But we should add a mechanism to acknowledge the previous annotation context:

```typescript
/**
 * When L5 runs during re-analysis, pass a summary of the previous
 * annotation set so the LLM can:
 * 1. Acknowledge when previous annotations are no longer relevant
 * 2. Deepen previous annotations that are still relevant
 * 3. Not repeat identical annotations verbatim
 */
interface PriorAnnotationContext {
  /** Summary of previous annotations for this paragraph */
  priorAnnotations: Array<{
    content: string;
    type: string;
    teachingMode: string;
    /** Whether the student's edit addressed this annotation */
    addressedByEdit: boolean;
  }>;
}
```

Add to the re-analysis paragraph prompt:

```
PRIOR ANNOTATIONS (from before the student's edit):
${priorAnnotations.map(a =>
  `  [${a.addressedByEdit ? 'ADDRESSED' : 'STILL RELEVANT'}] ` +
  `(${a.teachingMode}) ${a.content.substring(0, 100)}...`
).join('\n')}

If an annotation was ADDRESSED by the edit:
- Acknowledge the improvement briefly: "The revision of P2S3 now grounds
  the grandfather's determination in physical detail — this was the
  biggest gap in the previous version."
- Surface any NEW concerns the edit may have introduced.

If an annotation is STILL RELEVANT:
- Don't repeat it verbatim. Either deepen it (add new dimension or
  architectural connection) or reference it briefly and move to
  what's changed.
```

---

## Deeper Design

### Teaching vs. Assessment: The Core Distinction

Every annotation must pass the TEACHING TEST: "Does this help the student understand something about their own writing that they couldn't see without this annotation?"

**Assessment annotation (fails the test):**
> "Your voice shifts between formal and informal registers in P3."

The student can SEE this if they look. This annotation describes; it doesn't teach.

**Teaching annotation (passes the test):**
> "Your voice shifts from the careful formality of 'demonstrated remarkable resilience' to the natural warmth of 'he just kept going, you know?' — and that warmth is exactly what P5 needs to feel earned. Right now P5 tries to claim that warmth but the reader hasn't heard it since P3. If you can hold that register through P4, the reader arrives at P5 already feeling close to your grandfather."

This explains a CONSEQUENCE the student can't see without architectural knowledge.

**Prompt engineering for this distinction:**

Add to the system prompt:

```
THE TEACHING TEST:
Before finalizing each annotation, ask yourself: "Could the student see
this by re-reading their own essay carefully?"

If YES → this is ASSESSMENT, not teaching. You are describing what IS.
  Either: upgrade it to teaching by adding CONSEQUENCE, or don't include it.

If NO → this is TEACHING. You are showing them something they can't see
  without understanding the essay's architecture, the reader's experience,
  or the admissions context.

Examples of the upgrade:
  ASSESSMENT: "P2 uses extended metaphor."
  TEACHING: "P2's extended metaphor (chess as politics) does double duty:
  it makes the abstract strategic thinking concrete for the reader AND
  it establishes the vocabulary domain that P4's leadership moment
  needs to feel native, not imported."

The student already knows P2 uses a metaphor. They don't know WHY it
matters that it does.
```

### Building Student Capacity

The best annotations don't just fix THIS essay — they help the student see patterns in ALL their writing. The `capacityBuildingNote` field serves this purpose, but only when genuinely transferable:

```
CAPACITY BUILDING (the capacityBuildingNote field):

Populate this field ONLY when you identify a transferable writing skill.
Not every annotation has one. But when it does, frame it as a PATTERN
the student can look for on their own:

GOOD: "In your next essay, watch for the moment where you switch from
showing a specific experience to explaining what it means. That switch
is almost always where your strongest writing yields to your safest.
Try staying in the moment 2 sentences longer."

BAD: "Remember to show, don't tell." (Generic. Not transferable because
it doesn't tell the student WHAT to look for or WHERE in their writing
the pattern appears.)

BAD: null when a genuine skill was present. If the annotation teaches
the student to see voice register shifts, that's transferable — say so.
```

### Annotation Density as Diagnostic Signal

When a paragraph has unusually high or low annotation density relative to phase expectations, this is SIGNAL, not a problem to fix:

- **High density + mostly growth annotations** → this paragraph needs the most work. The coaching layer should know this.
- **High density + mostly strength annotations** → this paragraph is the essay's strongest. The coaching layer should leverage this.
- **High density + mixed types** → this paragraph is doing a lot of architectural work. It may be trying to do too much.
- **Low density + pivotal structural role** → concerning. Is the system missing something? Or is the paragraph doing its job quietly and efficiently?
- **Zero density** → either the paragraph is transitional (fine) or the annotation prompt failed (investigate).

The LLM interprets the density pattern as part of the cross-paragraph annotation call (it sees all paragraph densities at once).

---

## Prompt Engineering: The L5 System Prompt (Revised)

The full system prompt for L5 annotation calls. Replaces the current `buildSystemPrompt()` output.

```
You are a writing teacher generating annotations for a college admissions
essay. You have access to a deep analytical profile of this essay —
including structural architecture, voice map, emotional topography,
earned-ness assessments, thematic threads, and a North Star that captures
what the essay is trying to MEAN.

YOUR FUNDAMENTAL PRINCIPLE: Every annotation is a TEACHING MOMENT, not
an assessment. You never describe what IS — you explain what it MEANS
for the essay's architecture and what the student can't see without your
architectural knowledge.

THE TEACHING TEST:
Before finalizing each annotation, ask: "Could the student see this by
re-reading their own essay carefully?"
- If YES → this is assessment, not teaching. Upgrade it by adding
  CONSEQUENCE (why it matters for the architecture) or don't include it.
- If NO → this is teaching. Keep it.

TEACHING MODES (select per annotation — not per essay or per phase):
- AWARENESS: "Notice this..." — draws attention to a pattern.
  Goal: build the student's capacity to see patterns themselves.
- CONSEQUENCE: "This matters because..." — explains architectural impact.
  Goal: build structural thinking.
- CONNECTION: "This relates to..." — links moments across the essay.
  Goal: build architectural vision.
- ACTION: "Try this..." — specific, structurally-grounded suggestion.
  Goal: provide a concrete next step.

Select the mode that serves each specific teaching moment. Don't default
to ACTION for everything — awareness and consequence build deeper
learning than instructions.

${buildPhaseGuidance(phase.level)}

ANNOTATION SEQUENCING:
Order annotations within each paragraph for cognitive flow:
AWARENESS → CONSEQUENCE → CONNECTION → ACTION.
Exception: if a single annotation is clearly the most important thing
about this paragraph, lead with it regardless of mode.

REWRITE QUALITY:
Every rewriteExample must demonstrate awareness of the paragraph's
architectural role. A rewrite that makes a sentence "better" in
isolation but ignores its structural function is worse than no rewrite.

If you cannot produce a structurally aware rewrite, set rewriteExample
to null. A null rewrite with strong teachingRationale beats a generic
rewrite.

STRENGTH ANNOTATIONS:
When acknowledging strengths, explain WHY they work architecturally.
"This is a strong opening" is assessment. "This opening earns the
reader's attention by creating a specific sensory world — and that
world is what makes P4's meaning-shift possible. Without P1's
physicality, P4 would have nothing to disrupt." is teaching.

NORTH STAR GROUNDING (required — structural quality control):
Every annotation's northStarConnection must reference THIS essay's
specific architecture (structural role, through-line, earned-ness,
or connection network). If you cannot ground an observation in the
essay's architecture, do not include it.

READING STRATEGY AWARENESS:
${readingStrategy ? `
The analysis system discovered that this essay rewards attention to:
"${readingStrategy.strategy}"

Let this guide what you emphasize in annotations. If the reading strategy
says the essay rewards attention to vocabulary domain shifts, annotations
about voice register and word choice carry more weight than generic
structural observations. The reading strategy tells you what makes THIS
essay tick — let your annotations match.
` : ''}

CROSS-PARAGRAPH AWARENESS:
If an annotation's teaching point involves another paragraph, populate
crossParagraphRefs with the other paragraph indices. The annotation
still anchors to one primary location, but the reader can see the
connection.

CAPACITY BUILDING:
When an annotation teaches a transferable writing skill, populate
capacityBuildingNote with a pattern the student can look for in
future writing. Not every annotation has one — only populate when
genuinely transferable.

ANNOTATION STRUCTURE (JSON):
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
      "priority": 1,
      "phase": "${phase.level}",
      "rewriteExample": "Structurally aware alternative, or null",
      "confidence": 0.85,
      "crossParagraphRefs": [3, 4],
      "capacityBuildingNote": "In future writing, watch for moments where you claim an emotion instead of letting the reader feel it through detail."
    }
  ]
}

OUTPUT: JSON object with "annotations" array. No markdown wrapping.
```

---

## Integration Points

### Connection to PLAN2 (V2 Evolution)

PLAN2 says L5 is a "MODERATE UPGRADE" — annotations are generated from findings + essay understanding instead of from observation arrays. This improvement is compatible with that evolution:

- **V1 (current):** L5 reads observation arrays from `SentenceUnderstanding`. Annotations reference `[U1], [U2]` labels.
- **V2 (PLAN2):** L5 reads `Finding` objects + `ParagraphReading` prose + `EssayUnderstanding` prose. Annotations reference finding IDs.
- **This improvement:** Works with EITHER input format. The changes are to the annotation OUTPUT and the PROMPT quality, not the input source. When V2 input types arrive, the annotations get richer because the input is deeper — but the annotation architecture (teaching modes, cross-paragraph, capacity building) works with V1 inputs too.

### Connection to Improvement 6 (L6 Coaching)

L5 annotations and L6 coaching serve different purposes:
- L5: "Here's what to notice about your essay" (text-anchored, architectural)
- L6: "Let's talk about your essay" (conversational, responsive)

The cross-paragraph annotation capability in L5 reduces pressure on L6 to surface architectural patterns — the annotations already show the connections. L6 can then focus on DIALOGUE about those connections rather than explaining them from scratch.

The `capacityBuildingNote` field in L5 annotations also feeds L6: if the student asks about a pattern, L6 can reference the annotation's capacity-building guidance as a starting point.

### Connection to Re-Analysis Pipeline

When L5 runs during re-analysis:
1. The `reanalysisBrief` provides edit context (what changed, student intent)
2. The `PriorAnnotationContext` provides previous annotation context
3. L5 acknowledges edits that addressed previous annotations
4. L5 surfaces new concerns introduced by edits
5. L5 deepens annotations that are still relevant rather than repeating verbatim

---

## Implementation Sequence

### Step 1: Type Updates (profileTypes.ts)
- Update `L5Annotation` interface with new fields: `teachingIntent`, `teachingMode`, `crossParagraphRefs`, `capacityBuildingNote`
- Rename `type` values: `strength_acknowledgment` → `strength`, `growth_opportunity` → `growth`, `structural_note` → `structural`, `teaching_moment` → `teaching`
- Add `AnnotationDensityDiagnostic` interface
- Add `PriorAnnotationContext` interface

### Step 2: Remove Rigidity (deepAnnotationService.ts)
- Remove `PHASE_TARGETS` constant
- Remove `PHASE_STRENGTH_RATIOS` if present
- Remove `ANNOTATION_SCOPE_BY_PHASE` if present
- Remove `DESCRIBE_BACK_PATTERNS` if present
- Remove the per-paragraph cap in `deduplicateAndPrioritize()` — keep deduplication, remove trimming
- Remove the essay-level annotation cap
- Replace with density diagnostic logging

### Step 3: Replace System Prompt (deepAnnotationService.ts)
- Replace `buildSystemPrompt()` with the revised prompt above
- Replace `buildPhaseGuidance()` — soft guidance, not hard targets
- Add teaching test, teaching modes, cognitive sequencing, rewrite quality, capacity building instructions

### Step 4: Update Paragraph Prompt (deepAnnotationService.ts)
- Remove `GENERATION INSTRUCTIONS` that enforce hard counts
- Add phase guidance as soft context
- Add prior annotation context when running during re-analysis

### Step 5: Add Cross-Paragraph Annotations (deepAnnotationService.ts)
- Implement `generateCrossParagraphAnnotations()` method
- Call it after all paragraph-level calls complete
- Add cross-paragraph annotations to `L5AnnotationResult`

### Step 6: Update Validation (deepAnnotationService.ts)
- Update `validateAnnotations()` to handle new fields
- Add validation for `crossParagraphRefs` (indices must be valid)
- Keep North Star grounding validation (structural quality control)
- Remove any remaining type-based filtering

### Step 7: Update Orchestrator (analysisOrchestrator.ts)
- Pass `PriorAnnotationContext` when running L5 during re-analysis
- Handle cross-paragraph annotations in the result

### Step 8: Test
- Run against 3 test essays (strong/weak/creative)
- Verify: no annotations are trimmed by quota
- Verify: annotations pass the teaching test (consequence, not assessment)
- Verify: rewrite examples are structurally aware
- Verify: cross-paragraph annotations capture teaching moments that per-paragraph calls miss
- Verify: phase guidance influences but doesn't hard-constrain annotation granularity
- Compare annotation quality against current system (subjective, 5-essay sample)
