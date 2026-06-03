# Implementation Prompt: Improvement #1 -- Finding Lifecycle (Graduated Evolution)

## Context

The Essay Intelligence V2 system (PLAN2) produces **Findings** as its core structured output: referenceable claims about the essay that carry evidence, scope, maturity, coaching value, and relationship references. Findings are the index into the prose understanding -- they are what downstream systems (L3.5 scoring, L5 annotations, L6 coaching, dispatch) query against.

Currently, findings are created as flat, independent objects. They have `maturity`, `buildsOn`, `relatedTo`, and `supersededBy` fields defined in the type system but no lifecycle management. This improvement builds the **finding lifecycle**: the system by which findings evolve from initial hypothesis through confirmation to depth, relating to each other naturally, surviving across growth cycles, and serving as the primary dispatch signal for where to invest next.

This is foundational -- Improvement #3 (Connections) and Improvement #10 (Version Branching) both depend on a working finding lifecycle. Connections reference findings. Branches fork the finding store. Get this right and everything else composes. Get it wrong and the system accumulates noise.

---

## Design Principles (LLM-First Rules That Apply Here)

### From Rule 1: The LLM Owns All Judgment

**The LLM decides maturity, not a formula.** There are no deterministic maturity transition rules. When the walk reads P3 and sees that a hypothesis from P1 now has supporting evidence, the LLM assigns the new maturity (`developing`, `confirmed`, etc.) with reasoning. The system validates referential integrity (no backward jumps without explicit supersession, no references to non-existent IDs) but never overrides the LLM's maturity assessment.

**The LLM decides merge/supersession relationships, not scope-matching.** When the walk produces a finding about P3 that overlaps with an existing finding about P1, the LLM decides whether the new finding `buildsOn` the existing one, `supersedes` it, or is independent. No `FindingMerger.matchCandidate()` that checks scope + dimension overlap. The LLM sees the existing findings in context and outputs relationship references.

**The LLM assigns coaching value, not a formula.** `coachingValue` is a routing signal (5 levels: critical / high / medium / contextual / diagnostic) that the LLM assigns based on how useful this finding would be for coaching this specific student. No `MATURITY_SCORING_WEIGHT` multipliers -- maturity and value are orthogonal. A hypothesis-level finding can be `critical` (it might transform the essay's architecture). A deepened finding can be `diagnostic` (it confirms what the system already knew).

### From Rule 2: Never Discard Paid LLM Output

Findings are never deleted. A wrong finding is `superseded` with lineage preserved. A contradicted finding is marked with its contradiction reason. The finding store is an append-only log with pointer-based evolution (supersession chains, buildsOn trees). Querying active findings means filtering to `maturity !== 'superseded'`.

### From Rule 3: No Closed Taxonomies for LLM Perception

Finding `dimensions` use the existing `HolisticDimension` union type as routing tags, not as a closed taxonomy of what findings can be about. The LLM assigns whichever dimensions apply. If a finding touches voice AND structure AND admissions, it gets all three. The dimension list is for routing and coverage tracking, not for constraining what the LLM can observe.

### From Rule 6: System Infrastructure for Bookkeeping

Maturity states (`hypothesis | developing | confirmed | deepened | superseded`) are system bookkeeping -- they track lifecycle position. The LLM assigns the state; the system enforces referential integrity. `coachingValue` levels are routing infrastructure. Finding IDs, timestamps, source tracking -- all system bookkeeping.

---

## Core Architecture

### Type Definitions

```typescript
// In profileTypes.ts -- extends the existing Finding interface from PLAN2

interface Finding {
  id: string;

  /** The insight itself -- a claim about the essay */
  claim: string;

  /** What part of the essay this finding is about */
  scope: FindingScope;

  /** Lifecycle maturity -- LLM-assigned, system-validated */
  maturity: FindingMaturity;

  /**
   * LLM's reasoning for the current maturity level.
   * Required on every maturity assignment or transition.
   * Serves as audit trail and context for future LLM calls.
   */
  maturityReasoning: string;

  /** How useful this finding is for coaching -- LLM-assigned routing signal */
  coachingValue: FindingCoachingValue;

  /** LLM-assigned dimensions this finding touches */
  dimensions: HolisticDimension[];

  /** Findings this one builds on (depth chain -- emergent, not forced) */
  buildsOn: string[];

  /** Findings this one relates to laterally */
  relatedTo: string[];

  /** If superseded, what replaced it */
  supersededBy?: string;

  /**
   * If superseded, WHY. LLM explains the supersession.
   * This prevents the superseded finding from polluting understanding
   * by giving downstream systems the context to ignore it correctly.
   */
  supersessionReason?: string;

  /** What discovered this finding */
  source: FindingSource;

  /**
   * What investigating this finding further might reveal.
   * null if fully explored. Used by dispatch to select deep dives.
   * LLM-generated prose, not a category.
   */
  deepeningPotential: string | null;

  /** Questions this finding raises */
  raisesQuestions: string[];

  /** Text evidence -- every finding must cite specific text or specific absences */
  evidence: FindingEvidence[];

  /**
   * Growth lineage -- every time this finding's maturity changes,
   * record what happened. Append-only.
   */
  lineage: FindingLineageEntry[];

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last maturity change */
  lastUpdated: string;
}

type FindingMaturity = 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded';

type FindingCoachingValue = 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic';

type FindingSource = 'walk' | 'deep_dive' | 'coaching' | 'edit_reanalysis' | 'coherence_check' | 'holistic_synthesis';

interface FindingScope {
  type: 'word' | 'sentence' | 'sentence_group' | 'paragraph' | 'cross_paragraph' | 'essay_level';
  paragraph?: number;
  sentences?: number[];
  paragraphs?: number[];
  textEvidence: Array<{
    text: string;
    location: { paragraph: number; sentence?: number };
  }>;
}

interface FindingEvidence {
  /** Quoted text, or description of an absence */
  text: string;
  /** Where in the essay (null for essay-level absences) */
  location?: { paragraph: number; sentence?: number };
  /** 'present' = text is quoted; 'absent' = evidence is something NOT there */
  type: 'present' | 'absent';
}

interface FindingLineageEntry {
  timestamp: string;
  previousMaturity: FindingMaturity;
  newMaturity: FindingMaturity;
  trigger: string;         // what caused the change: 'walk_P3', 'deep_dive_voice', 'coaching_turn_2'
  reasoning: string;       // LLM's explanation
  supersedes?: string;     // if this transition superseded another finding
}
```

### The Finding Store

```typescript
// findingStore.ts -- pure data management, no LLM calls

class FindingStore {
  private findings: Map<string, Finding> = new Map();
  private nextId: number = 1;

  /** Generate a unique finding ID */
  generateId(): string {
    return `F${this.nextId++}`;
  }

  /** Add a new finding. Validates referential integrity of buildsOn/relatedTo. */
  add(finding: Finding): void {
    // Validate: all buildsOn IDs must exist and not be superseded
    for (const parentId of finding.buildsOn) {
      const parent = this.findings.get(parentId);
      if (!parent) throw new Error(`Finding ${finding.id} buildsOn non-existent ${parentId}`);
      // Warning (not error) if building on superseded finding -- LLM might have good reason
      if (parent.maturity === 'superseded') {
        console.warn(`Finding ${finding.id} buildsOn superseded ${parentId} -- verify intent`);
      }
    }
    // Validate: all relatedTo IDs must exist
    for (const relId of finding.relatedTo) {
      if (!this.findings.has(relId)) {
        throw new Error(`Finding ${finding.id} relatedTo non-existent ${relId}`);
      }
    }
    this.findings.set(finding.id, finding);
  }

  /** Update maturity. Validates no unexplained backward jumps. */
  updateMaturity(
    id: string,
    newMaturity: FindingMaturity,
    reasoning: string,
    trigger: string,
    supersedes?: string,
  ): void {
    const finding = this.findings.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);

    const MATURITY_ORDER: Record<FindingMaturity, number> = {
      hypothesis: 0, developing: 1, confirmed: 2, deepened: 3, superseded: -1,
    };

    // Backward jump validation (system guardrail, not analytical judgment)
    // superseded can go to any state (it's a special case)
    // any state can go to superseded (that's the normal retirement path)
    if (
      newMaturity !== 'superseded' &&
      finding.maturity !== 'superseded' &&
      MATURITY_ORDER[newMaturity] < MATURITY_ORDER[finding.maturity]
    ) {
      // Log warning but allow -- the LLM provided reasoning
      console.warn(
        `Maturity backward jump: ${finding.id} ${finding.maturity} -> ${newMaturity}. ` +
        `Reasoning: ${reasoning}`
      );
    }

    finding.lineage.push({
      timestamp: new Date().toISOString(),
      previousMaturity: finding.maturity,
      newMaturity,
      trigger,
      reasoning,
      supersedes,
    });

    finding.maturity = newMaturity;
    finding.maturityReasoning = reasoning;
    finding.lastUpdated = new Date().toISOString();

    // Handle supersession pointer on the target
    if (supersedes) {
      const superseded = this.findings.get(supersedes);
      if (superseded) {
        superseded.supersededBy = id;
        superseded.maturity = 'superseded';
        superseded.supersessionReason = reasoning;
        superseded.lineage.push({
          timestamp: new Date().toISOString(),
          previousMaturity: superseded.maturity,
          newMaturity: 'superseded',
          trigger,
          reasoning: `Superseded by ${id}: ${reasoning}`,
        });
      }
    }
  }

  /** Get all active (non-superseded) findings */
  getActive(): Finding[] {
    return Array.from(this.findings.values())
      .filter(f => f.maturity !== 'superseded');
  }

  /** Get findings by scope (for a specific paragraph, cross-paragraph, etc.) */
  getByScope(paragraph: number): Finding[] {
    return this.getActive().filter(f =>
      f.scope.paragraph === paragraph ||
      (f.scope.paragraphs && f.scope.paragraphs.includes(paragraph))
    );
  }

  /** Get findings by coaching value (for dispatch decisions) */
  getByCoachingValue(value: FindingCoachingValue): Finding[] {
    return this.getActive().filter(f => f.coachingValue === value);
  }

  /** Get the full supersession chain for a finding (for lineage display) */
  getSupersessionChain(id: string): Finding[] {
    const chain: Finding[] = [];
    let current = this.findings.get(id);
    while (current) {
      chain.push(current);
      current = current.supersededBy
        ? this.findings.get(current.supersededBy)
        : undefined;
    }
    return chain;
  }

  /**
   * Get depth trees -- findings connected by buildsOn chains.
   * Returns root findings (no parents) with their descendant chains.
   * Used for understanding how deep the system has gone on each thread.
   */
  getDepthTrees(): Array<{ root: Finding; descendants: Finding[] }> {
    const roots = this.getActive().filter(f => f.buildsOn.length === 0);
    return roots.map(root => ({
      root,
      descendants: this.getDescendants(root.id),
    }));
  }

  private getDescendants(rootId: string): Finding[] {
    const children = this.getActive().filter(f => f.buildsOn.includes(rootId));
    return children.flatMap(child => [child, ...this.getDescendants(child.id)]);
  }

  /** Serialize for persistence / context passing */
  serialize(): Finding[] {
    return Array.from(this.findings.values());
  }

  /** Summary for LLM context (compact representation) */
  toContextSummary(): string {
    const active = this.getActive();
    const byCv: Record<string, number> = {};
    const byMat: Record<string, number> = {};
    for (const f of active) {
      byCv[f.coachingValue] = (byCv[f.coachingValue] || 0) + 1;
      byMat[f.maturity] = (byMat[f.maturity] || 0) + 1;
    }
    return `${active.length} active findings. ` +
      `Maturity: ${JSON.stringify(byMat)}. ` +
      `Coaching value: ${JSON.stringify(byCv)}. ` +
      `${this.findings.size - active.length} superseded.`;
  }
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/essayIntelligence/findings/findingStore.ts` | CREATE | FindingStore class -- pure data management |
| `src/services/essayIntelligence/findings/findingContextBuilder.ts` | CREATE | Builds finding context for LLM prompts |
| `src/services/essayIntelligence/findings/index.ts` | CREATE | Barrel export |
| `src/services/essayIntelligence/profileTypes.ts` | MODIFY | Add/update Finding, FindingLineageEntry, FindingEvidence types |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | MODIFY | Walk prompt now includes existing findings as context; walk output includes finding relationships |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | MODIFY | L3.75 validates finding maturity, may propose maturity changes |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | MODIFY | Generates annotations from findings, not observation arrays |
| `src/services/essayIntelligence/profileManager/essayProfileManager.ts` | MODIFY | Integrates FindingStore |
| `tests/essay-intelligence/test-finding-lifecycle.ts` | CREATE | Finding lifecycle integration tests |

---

## Deeper Design Questions (with Proposed Answers)

### 1. How does finding granularity interact with the walk's paragraph-by-paragraph reading?

The walk reads paragraph-by-paragraph but produces findings at natural granularity. Here is how cross-paragraph findings emerge during the sequential walk:

**During the walk (P1 through PN):**
- When the walk reads P1, it produces findings scoped to P1 (words, sentences, paragraph-level).
- When the walk reads P3, it may notice that P3's imagery echoes P1's. The walk produces a finding scoped to `cross_paragraph` with `paragraphs: [0, 2]`. This is a **hypothesis-level cross-paragraph finding** -- the walk has seen both endpoints but hasn't yet confirmed whether the echo is intentional, structural, or accidental.
- The walk may also produce a **retrospective finding** that updates an existing P1 finding's maturity. "F2 claimed P1's sensory register was decorative. P3 reveals it was establishing an epistemological framework. F2 is now developing because this connection provides supporting evidence."

**After the walk (L3.75):**
- L3.75 sees the full text simultaneously. It can produce findings that span the entire essay -- patterns invisible to the sequential reader. These findings cite evidence from multiple paragraphs and are often at `essay_level` scope.
- L3.75 may confirm walk-produced cross-paragraph findings (hypothesis -> confirmed) or complicate them (hypothesis -> developing with new nuance).

**The key insight:** The walk doesn't need to "handle" cross-paragraph findings specially. It naturally produces them when it notices connections to earlier text. The finding's scope captures the full span. The maturity captures the uncertainty ("I've seen two data points but haven't confirmed the pattern"). Later growth steps deepen them.

**Prompt guidance for the walk:**

```
When reading this paragraph, you may notice connections to earlier text.
If you do, produce a finding with cross_paragraph scope. Mark it as
'hypothesis' if you're noticing a possible pattern, 'developing' if you
have evidence from both endpoints. Don't force cross-paragraph findings --
only produce them when you genuinely see something that connects.

If a finding from an earlier paragraph changes meaning in light of this
paragraph, reference it by ID in your retrospectiveFindings. Explain
what changed and update its maturity if warranted.
```

### 2. Finding DEPTH vs. finding COUNT

The system must prefer 8 profound findings over 30 shallow ones. This is a prompt engineering problem, not a system enforcement problem (Rule 5: soft guidance over hard blocklists).

**Prompt-level quality controls:**

```
=== FINDING QUALITY ===

A finding is worth producing if it would change how you coach this student
OR how you understand the essay's architecture of meaning. Apply this test
ruthlessly: if removing a finding would change nothing about coaching or
understanding, DON'T produce it.

DEPTH OVER COUNT. A finding that identifies a technique ("P2S1 uses a
simile") is never worth producing. A finding that reveals how a technique
serves the essay's meaning-making IS worth producing.

CONCRETE EXAMPLE of depth vs. count:

SHALLOW (don't produce): 5 separate findings for P2, each identifying
a different technique (simile, parallel structure, anaphora, etc.)

DEEP (produce): 1 finding that explains how P2's grammatical parallelism
("Just as I used notes... I could use code...") argues for equivalence
between two domains -- and that this argument is the essay's structural
pivot but its weakest intellectual moment, because assertion replaces
evidence. This ONE finding captures what 5 technique-identification
findings never could.

HOW MANY FINDINGS?
- Transitional paragraph: 0-1 findings. Most of what it does is captured
  in the paragraph reading prose.
- Contributing paragraph: 1-2 findings. One about its primary function,
  maybe one about a craft moment.
- Pivotal paragraph: 2-5 findings. Multiple threads of meaning converge
  here; each genuine insight gets its own finding.

If you produced more than 5 findings for a single paragraph, ask yourself:
are these genuinely distinct insights, or could 2-3 of them be combined
into a single deeper finding?
```

**Why no hard cap:** A paragraph might legitimately warrant 6 findings if it is the essay's fulcrum where voice, theme, structure, and admissions all converge meaningfully. The LLM decides. The prompt steers toward depth.

**Diagnostic signal:** If the walk consistently produces 4+ findings per paragraph for a 7-paragraph essay (28+ total), that is a signal the prompt is producing shallow findings. Log it, adjust prompt temperature/emphasis in the next iteration. Do NOT trim the findings after they are produced (Rule 2).

### 3. Finding EVOLUTION across growth cycles (concrete example)

Walk through one finding's lifecycle across a complete growth cycle:

**Walk reads P0 (music essay opening):**
```
F1: {
  claim: "P0 opens with kinesthetic vocabulary ('fingers danced,' 'sound
         washed') but shifts to abstract register by S3 ('profound connection').
         The shift may be intentional framing or an unconscious lapse into
         essay-writing voice.",
  maturity: 'hypothesis',
  maturityReasoning: "Seen the shift but can't determine intent without
                      reading the rest of the essay.",
  coachingValue: 'high',
  dimensions: ['voice', 'craft'],
  buildsOn: [],
  deepeningPotential: "If the abstract register dominates the essay,
                       this is a voice authenticity finding. If the writer
                       returns to kinesthetic later, it's a conscious range."
}
```

**Walk reads P2-P3 (sees more abstract register):**
```
F1 update: maturity -> 'developing'
maturityReasoning: "P2 and P3 both use abstract register ('believe in the
                    power of,' 'reaffirmed my connection'). The pattern is
                    consistent enough to be significant. The kinesthetic
                    register appears only in P0S1-S2 and P4S3."

New finding F5 (buildsOn F1):
  claim: "The writer's voice is bifurcated: native kinesthetic register
         in concrete moments, performed abstract register in reflective
         moments. This creates an authenticity gap -- the essay is most
         genuine when describing physical experience and most generic
         when philosophizing.",
  maturity: 'developing',
  buildsOn: ['F1'],
  coachingValue: 'critical',
  deepeningPotential: "Is this gap the essay's blind spot or does the
                       writer sense it? Coaching could reveal intent."
```

**L3.75 holistic synthesis:**
```
F5 update: maturity -> 'confirmed'
maturityReasoning: "Full-text view confirms: kinesthetic register in
                    P0S1-2, P1S3, P4S3 only. Abstract register in all
                    other reflective passages. The bifurcation is
                    comprehensive and consistent."

F1 update: maturity -> 'superseded', supersededBy: 'F5'
supersessionReason: "F5 captures the full pattern that F1 only hypothesized.
                     F1's observation about P0 is subsumed into F5's
                     essay-wide voice bifurcation finding."
```

**Deep dive (voice_authenticity):**
```
F5 update: maturity -> 'deepened'
maturityReasoning: "Voice authenticity deep dive reveals the bifurcation
                    isn't just register -- it's epistemological. The
                    kinesthetic voice embodies 'maker-knowing' while
                    the abstract voice performs 'reflector-knowing.' The
                    college essay form demands reflection, creating an
                    ironic tension the writer hasn't recognized."

New finding F12 (buildsOn F5):
  claim: "The essay unknowingly performs its own thesis: constraint
         (reflective essay form) forcing creative adaptation (the writer
         tries to philosophize but their authentic insights come through
         physical description). If the writer became aware of this,
         the revision almost writes itself.",
  maturity: 'confirmed',
  buildsOn: ['F5'],
  coachingValue: 'critical',
  dimensions: ['voice', 'craft', 'epistemology'],
  deepeningPotential: null  // fully explored at this level
```

**Coaching turn (student says "I want to show I'm intellectual"):**
```
New finding F15 (relatedTo F12):
  claim: "Student intends to demonstrate intellectual sophistication.
         But the text reveals intellectual sophistication through concrete
         observation (P4S3: 'seeing users smile') more effectively than
         through philosophical assertion. The student's goal and their
         best evidence point in opposite directions.",
  source: 'coaching',
  maturity: 'confirmed',
  coachingValue: 'critical',
  relatedTo: ['F12'],
  deepeningPotential: "Can the student see that their concrete voice IS
                       intellectual sophistication? Or do they equate
                       intellectualism with abstraction?"
```

### 4. Finding PRUNING: handling genuinely wrong findings

A student says: "Actually, I wrote the Chopin reference before I knew anything about AI. They're not connected." This contradicts F8 which claimed the Chopin reference was deliberate setup for the music-coding bridge.

**The finding is not deleted.** It is superseded:

```
F8 update: maturity -> 'superseded'
supersessionReason: "Student correction: Chopin reference was written before
                     the AI content existed. The textual connection is real
                     (both are in the essay) but the intentionality reading
                     was wrong. Revised understanding: the Chopin reference
                     is a relic of an earlier draft, not deliberate setup."

New finding F16 (supersedes F8):
  claim: "The Chopin reference in P1 predates the AI content. This means
         the apparent music-coding bridge is accidental -- an artifact of
         revision history, not intentional architecture. The essay's
         structure happens to create a connection the writer didn't intend.
         Coaching opportunity: the accidental connection could be made
         intentional through revision.",
  source: 'coaching',
  maturity: 'confirmed',
  buildsOn: [],
  supersedes: 'F8',
```

**How superseded findings avoid polluting understanding:**

1. `getActive()` filters out superseded findings. All downstream consumers use `getActive()`.
2. The `supersessionReason` is available when tracing lineage (useful for coaching transparency).
3. The LLM context builder excludes superseded findings from the active findings section but includes a brief "previously superseded" summary so the LLM doesn't rediscover the same wrong reading.

**Context builder approach:**
```
=== ACTIVE FINDINGS ===
[...active findings listed here...]

=== SUPERSEDED (do not re-derive these readings) ===
F8 (superseded by F16): Previously read the Chopin reference as deliberate
setup for music-coding bridge. Student corrected: Chopin predated AI content.
```

### 5. How findings relate to ParagraphReading prose and EssayUnderstanding prose

**Prose is the narrative understanding. Findings are the structured index.** They serve different consumers and must stay in sync:

- **ParagraphReading.reading** (prose) is consumed by humans and by the LLM in subsequent calls. It reads like literary analysis. It references findings implicitly but doesn't cite finding IDs.
- **Finding objects** are consumed by dispatch, scoring (L3.5), annotations (L5), and coaching (L6). They carry IDs, scopes, maturities, and relationships that enable programmatic queries.

**Sync mechanism:** The walk produces BOTH simultaneously. The paragraph reading prose IS the narrative from which findings are extracted. The LLM outputs:
1. The paragraph reading (prose)
2. The findings (structured, with IDs)
3. The finding IDs are referenced in the reading's context but the prose stands alone

**When findings change but prose doesn't get rewritten** (e.g., a deep dive deepens F5 but doesn't re-walk P0):
- The finding store is updated.
- The paragraph reading prose for P0 is NOT rewritten (it's still accurate at the level it was written).
- The essay-level understanding prose IS updated (the deep dive produces a `proseAddition` that extends it).
- Mismatch between paragraph prose and finding maturity is acceptable and expected: prose captures the understanding AT THE TIME it was written. Findings evolve beyond it. The next re-walk will bring prose up to date.

**The SentenceParticipation index** is derived from findings:
```typescript
function deriveSentenceParticipation(
  paragraph: number,
  sentence: number,
  store: FindingStore,
): SentenceParticipation {
  const relevantFindings = store.getActive().filter(f =>
    (f.scope.paragraph === paragraph && f.scope.sentences?.includes(sentence)) ||
    (f.scope.paragraphs?.includes(paragraph))
  );

  return {
    findingRefs: relevantFindings.map(f => f.id),
    significance: relevantFindings.length === 0
      ? 'unremarkable'
      : relevantFindings.some(f => f.coachingValue === 'critical')
        ? 'pivotal'
        : relevantFindings.some(f => f.coachingValue === 'high')
          ? 'contributing'
          : 'transitional',
    tags: [...new Set(relevantFindings.flatMap(f => f.dimensions))],
    connectionRefs: [], // populated by Connection system (Improvement #3)
    primaryFunction: relevantFindings.length > 0
      ? relevantFindings.sort((a, b) =>
          COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
        )[0].claim.slice(0, 200)
      : '',
  };
}
```

Note: `significance` derivation here is a convenience for UI display, not an analytical judgment (Rule 6). The actual significance is in the findings themselves.

---

## Prompt Engineering Guidance

### Walk Prompt: Finding Production

The walk prompt must guide the LLM to produce findings with proper lifecycle metadata. Key sections to add to the existing PLAN2 walk system prompt:

```
=== FINDING LIFECYCLE ===

Every finding you produce has a maturity level. Be honest about what you
know vs. what you're guessing:

  hypothesis: "I notice this pattern but can't confirm it yet. I've seen
              one data point; I need more to know if it's real."

  developing: "I've seen this pattern in multiple places. It's likely real
              but I haven't tested it against alternatives."

  confirmed: "I have strong evidence from multiple sources. I'm confident
             in this reading."

  deepened:  "Not only is this confirmed, but I've drawn out its
             implications for the essay's architecture and coaching."

Most walk findings should be 'hypothesis' or 'developing'. The walk sees
the essay paragraph-by-paragraph -- it rarely has enough evidence for
'confirmed'. That's fine. Honest uncertainty is MORE valuable than
premature confidence, because it drives the right deep dive selection.

=== BUILDING ON EXISTING FINDINGS ===

You have access to all existing findings (listed below). When you produce
a new finding, check:

1. Does it BUILD ON an existing finding? If F3 said "P1's imagery is
   kinesthetic" and you're adding "the kinesthetic register extends
   to P3 and reveals a maker-epistemology," your new finding should
   list F3 in buildsOn. This creates depth chains.

2. Does it SUPERSEDE an existing finding? If F3 said "P1's imagery
   seems decorative" and you now see "P1's imagery is foundational --
   it establishes the epistemological framework for the entire essay,"
   your new finding supersedes F3. Explain WHY in your maturityReasoning.

3. Is it INDEPENDENT? Not every finding connects to existing ones.
   A new observation about P5's humor that doesn't relate to anything
   earlier is independent. Don't force connections.

=== EVIDENCE GROUNDING ===

Every finding must cite evidence. Evidence is either:
- PRESENT: quote the specific text. "In P2S1, 'fingers danced across
  the keys' imports performance vocabulary."
- ABSENT: describe what's NOT there. "No paragraph shows the writer
  experiencing the constraint-creativity idea firsthand. The claim
  exists only as philosophical assertion."

Absence is evidence. "The essay never shows X" is as important as
"The essay shows Y" -- often more important for coaching.

=== DEEPENING POTENTIAL ===

For each finding, consider: what would investigating further reveal?

  If the answer is something specific and actionable:
    deepeningPotential: "Investigating whether the abstract register
    is a habit or a protective choice would clarify whether to coach
    toward concreteness or toward safety in vulnerability."

  If the finding is fully explored:
    deepeningPotential: null

This field drives dispatch. Findings with high coachingValue AND non-null
deepeningPotential are prime candidates for deep dives.
```

### Walk Prompt: Retrospective Findings

```
=== LOOKING BACKWARD ===

After reading this paragraph, consider: does this change your understanding
of EARLIER text?

Common patterns:
- An earlier finding was a hypothesis. This paragraph provides confirming
  or contradicting evidence. Update the maturity.
- An earlier paragraph reading missed something that this paragraph reveals.
  Produce a new finding about the earlier paragraph.
- An earlier finding's claim needs revision. The new finding supersedes it.

Output these as retrospectiveFindings with:
- The target scope (which earlier paragraph/sentences)
- The finding (with proper buildsOn/supersedes references)
- If it updates an existing finding's maturity, reference it by ID
```

### L3.75 Prompt: Finding Curation

```
=== FINDING VALIDATION ===

You see all findings produced by the walk. From your simultaneous
full-text vantage point, assess:

1. MATURITY ACCURACY: Are any findings marked 'hypothesis' that the
   full-text view can confirm? Are any marked 'confirmed' that the
   full-text view complicates? Propose maturity updates with reasoning.

2. MISSING FINDINGS: What essay-level findings did the sequential
   walk miss? (Patterns only visible with simultaneous view.)
   Produce new findings with proper scope and maturity.

3. SUPERSESSION: Are any findings effectively saying the same thing
   at different depths? The deeper one should supersede the shallower.
   But ONLY if the deeper one genuinely subsumes the shallower -- not
   merely overlaps.

4. COACHING VALUE: Now that you see the full picture, are the
   coachingValue assignments appropriate? A finding that seemed
   'medium' from P2's vantage might be 'critical' when you see
   how it connects to P6's resolution.
```

---

## Integration Points

### With Improvement #3 (Connections)

Findings and connections reference each other bidirectionally:
- A finding's `claim` can describe a connection: "The earning chain from P1 to P3 is broken."
- A connection's `description` can reference findings: "This thematic echo connects F3's kinesthetic register to F7's epistemological framework."
- The cross-referencing uses IDs, not embedded descriptions.
- No circular dependency: findings cite connection IDs in `relatedTo`, connections cite finding IDs in their description. Both are indexed independently. The system reconstructs the full graph at query time.

**Key interaction:** When a connection is discovered (Improvement #3), it may trigger finding maturity updates. "Connection C4 confirms that the kinesthetic vocabulary in P0 and P4 is structurally linked" might advance F1 from `hypothesis` to `developing`. This is an LLM decision during the connection discovery step, not a mechanical trigger.

### With Improvement #10 (Version Branching)

Branches fork the finding store. When a student creates a branch:
- The branch gets a COPY of the finding store at that point.
- Edits on the branch may supersede findings, deepen others, or add new ones.
- The main branch's finding store is unaffected.
- Branch comparison (Improvement #10) works by diffing two finding stores: which findings are in both, which diverged, which are unique to each branch.

**Key interaction:** Finding IDs must be globally unique across branches. Use a prefix: `F-main-1`, `F-branch1-1`. This prevents ID collisions when comparing or merging.

### With PLAN2's Growth Engine

The finding store IS the primary state for the growth engine's convergence measurement:

```typescript
function computeStepReward(
  storeBefore: FindingStore,
  storeAfter: FindingStore,
): StepReward {
  const before = storeBefore.getActive();
  const after = storeAfter.getActive();

  // Count findings that gained maturity
  const deepened = after.filter(f => {
    const prev = storeBefore.findings.get(f.id);
    return prev && MATURITY_ORDER[f.maturity] > MATURITY_ORDER[prev.maturity];
  }).length;

  // Count new findings
  const added = after.filter(f => !storeBefore.findings.has(f.id)).length;

  // Count supersessions
  const superseded = after.filter(f =>
    f.maturity === 'superseded' &&
    storeBefore.findings.get(f.id)?.maturity !== 'superseded'
  ).length;

  // ... compose reward from these signals
}
```

---

## Implementation Sequence

### Step 1: Types and FindingStore (day 1)
1. Add/update types in `profileTypes.ts`: `Finding`, `FindingLineageEntry`, `FindingEvidence`, `FindingScope`
2. Create `findingStore.ts` with all CRUD operations
3. Create `findingContextBuilder.ts` that serializes findings for LLM context
4. Unit tests: add, update maturity, supersession chains, referential integrity validation

### Step 2: Walk Integration (days 2-3)
1. Update walk system prompt with finding lifecycle guidance
2. Update `WalkParagraphOutput` to include proper finding lifecycle metadata
3. Update walk output parser to construct findings with IDs, lineage, evidence
4. Update back-propagation to use finding maturity updates instead of observation array replacement
5. Integration test: walk produces findings with maturity, buildsOn, evidence

### Step 3: L3.75 Integration (day 3)
1. Update L3.75 prompt with finding validation instructions
2. L3.75 output now includes finding maturity proposals and new essay-level findings
3. Finding store receives L3.75 updates through the same `updateMaturity` path
4. Integration test: L3.75 validates walk findings, proposes maturity changes

### Step 4: Downstream Integration (day 4)
1. Update SentenceParticipation derivation to use FindingStore
2. Update L3.5 (analysis pass) to receive findings instead of observation arrays
3. Update L5 (annotations) to generate from findings
4. Compatibility shim for any remaining legacy consumers

### Step 5: Growth Cycle Test (day 5)
1. Run full growth cycle: walk -> L3.75 -> deep dive -> coaching turn
2. Verify finding maturity progression across the cycle
3. Verify convergence measurement works (step reward computation)
4. Verify supersession chains are correct
5. Score output against PLAN2 quality rubric (finding depth test)

**Total: ~5 days. Each step produces testable output. No big-bang migration.**
