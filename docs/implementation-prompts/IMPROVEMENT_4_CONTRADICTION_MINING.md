# 

> **REVISED PROMPT — replaces IMPROVEMENT_4_CONTRADICTION_MINING.md**
> Paste this entire document into a new Claude Code session. It is self-contained.
> All rigidity issues from the original spec have been fixed per LLM-first design principles.

---

## 0. Context from Cluster A Implementation

Cluster A (#1 Finding Lifecycle, #3 Bidirectional Connections) is COMPLETE. Key things that affect this implementation:

### Finding Store: The Contradiction Mining Data Source

The adversarial Haiku pass should receive finding context. Findings are the system's structured index into understanding. Contradictions often manifest as tensions between findings:

**Finding→Score tension**: Finding F3 at `maturity: 'confirmed'` claims "P2 has deeply earned emotional resonance" but L3.5 scores P2's earnedness at 4/10. The adversarial pass should see both the finding (with its evidence) and the score to detect this.

**Key APIs**:
- `buildFindingContext(store, { includeSuperseded: true, includeEvidence: true })` — full finding context with evidence for the adversarial pass. Include superseded findings so the adversarial pass can see where the system changed its mind.
- `store.getActiveSortedByCoachingValue()` — priority-ordered findings for focused probing.
- `store.getByDimension(dim)` — findings touching a specific dimension. Useful for cross-dimension contradiction detection (e.g., all 'voice' findings vs all 'emotion' findings).
- `store.getDepthTrees()` — shows how deep the system has gone on each thread. Shallow threads (root with no descendants) might indicate areas the system hasn't explored enough to find contradictions.
- `store.getSupersessionChain(findingId)` — shows how understanding evolved. A long supersession chain (F1→F2→F3→F4) on a single topic might indicate the system kept changing its mind — itself a form of instability worth probing.

**Concrete finding types for contradiction detection**:
```typescript
// Actual Finding type (profileTypes.ts lines 1950-2018)
interface Finding {
  id: string;               // F1, F2, ...
  claim: string;             // The insight itself
  maturity: FindingMaturity;  // hypothesis|developing|confirmed|deepened|superseded
  coachingValue: FindingCoachingValue;  // critical|high|medium|contextual|diagnostic
  dimensions: HolisticDimension[];     // Which dimensions this touches
  buildsOn: string[];        // Depth chain
  supersededBy?: string;     // Pointer to replacement
  evidence: FindingEvidence[];  // Text evidence with locations
  // ... (see profileTypes.ts for full type)
}
```

### Connection Graph: Architectural Contradiction Signal

The connection graph reveals structural tensions the adversarial pass should probe:

**Key signals**:
- `graph.findStructuralIslands(totalParagraphs)` — paragraphs with no strong connections. If L3.75 says "cohesive essay with strong through-line" but 2 paragraphs are islands, that's a contradiction between holistic assessment and structural reality.
- `graph.getHubs()` — hub paragraphs. If the hub paragraph scores low, that's a structural contradiction (the essay's most connected paragraph is its weakest?).
- `buildHolisticConnectionContext(graph, totalParagraphs)` — full adjacency + hubs + islands for the adversarial prompt.

**Asymmetric connections are NOT contradictions**: Connections with `directionality: 'asymmetric'` mean one endpoint serves the other more than vice versa. This is normal (setup→payoff is inherently directional). The adversarial pass should not flag asymmetric connections as inconsistencies. However, if a connection claims to be `bidirectional` but its `reverseIllumination` is empty or weak, THAT might be worth probing.

**Connection strength vs understanding claims**: If L3 understanding says "P0 and P4 are thematically linked" but the connection graph shows that connection as `strengthCategory: 'tentative'`, the adversarial pass should ask: is the understanding overstating the connection, or did the scout/walk fail to capture its true strength?

### Supersession Chains as Instability Signal

The adversarial pass should look at supersession chains:
```typescript
// Long chain: F1 (hypothesis) → F2 (superseded F1) → F3 (superseded F2)
// This means the system kept revising its reading of the same phenomenon.
// Worth probing: is F3 actually stable, or will it be superseded again?
store.getSupersessionChain('F1');  // Returns [F1, F2, F3, ...]
```

Multiple supersessions on the same topic might indicate the essay is genuinely ambiguous (productive tension) or that the system is miscalibrating (system disagreement).

### Coaching Map Integration with Findings

The CoachingMap's `transformativeInsight` should reference the most architecturally significant finding. Use `store.getDeepDiveCandidates()` to identify findings with the highest coaching value and unexplored deepening potential — these are where the coaching map should focus.

The `protectedStrengths` should cross-reference with confirmed/deepened findings. If a finding is at `maturity: 'deepened'` and `coachingValue: 'critical'`, it's likely a strength worth protecting.

### Watch-outs

1. **Finding evidence includes 'absent' type**: `FindingEvidence.type` can be `'absent'` — meaning the finding is about something the essay does NOT do. "The essay never shows vulnerability" is absence evidence. The adversarial pass should be aware of absence-based findings — they're often the source of productive tensions.

2. **Findings never deleted**: All findings persist (superseded ones with pointers to replacements). The adversarial pass sees the full history. This is intentional — a finding that was superseded 3 times is itself information about the essay's complexity.

3. **Connection routing tags are system-inferred, not LLM-assigned**: Tags like 'structural', 'thematic' etc. are inferred via keyword heuristic from the LLM's description. They might be wrong. The adversarial pass should read the actual `description` and `significance` fields, not just the routing tags.

---

## 1. Context

### What Exists Today

The Crystallizer (L4) is the ONLY layer that sees EVERYTHING together: the full paragraph-level understanding from L3, the holistic synthesis from L3.75, and the per-sentence scoring from L3.5. It produces three artifacts in a single Sonnet call:

1. **EssayNorthStar** — the architecture of meaning (through-line, structural roles, trajectory, distinctiveness, intent bridge). An emergent property that transcends any individual profile section.
2. **ParagraphScoreMatrix** — multi-dimensional per-paragraph scoring (effectiveness, structural, voice, emotional, thematic) with cross-paragraph patterns.
3. **CoherenceReport** — contradictions detected across profile sections.

The current implementation (`src/services/essayIntelligence/analysis/crystallizer.ts`, ~955 lines) is well-structured but the coherence report is **passive** — it asks the LLM "report contradictions if they exist" in a single Sonnet call that is already producing two other complex artifacts. The contradiction mining is an afterthought, not a primary objective. Consequences:

- **Attention splitting**: The Sonnet call is simultaneously constructing the North Star, computing a 5-dimension score matrix, AND checking for contradictions. The contradiction check gets the least cognitive attention because the other two outputs are larger.
- **No adversarial perspective**: The same LLM call that created the synthesis checks its own synthesis for contradictions. This is like asking a writer to proofread their own work — they're blind to their own rationalizations.
- **No productive/destructive distinction**: All contradictions are treated as "issues" to resolve. But many contradictions are FEATURES of good essays — a raw authentic voice with rough craft, or an unconventional structure that breaks rules effectively.
- **No coaching map**: The crystallizer produces `prioritizedImprovements` (a list of what to fix) but not a coaching MAP (what matters, in what order, why, and what to protect).

### Rigidity Issues Fixed From Original Spec

The original IMPROVEMENT_4 spec contained these rigidity violations:

- **RED: `assessSentiment()` keyword-based function** — The original spec proposed a function that detects sentiment through keyword matching (e.g., looking for words like "fulcrum," "strongest," "weakest" in understanding text). This is Rule 4 (no whack-a-mole pattern matching). Completely eliminated. The LLM reads the actual text and forms its own judgment about tensions.

- **RED: `buildEvidencePairs()` with threshold-based detection** — The original spec proposed checking "if earned && score < 60" or "if understanding.role contains 'fulcrum' && score < X" as contradiction triggers. This is a deterministic formula replacing contextual judgment. Eliminated. The adversarial LLM reads both sides and assesses tension directly.

- **ORANGE: 4 fixed contradiction categories as closed enum** — The original spec defined exactly 4 categories (understanding-analysis mismatch, holistic-analysis divergence, cross-dimension tension, voice-earnedness inconsistency). These are useful ROUTING categories but were presented as a closed taxonomy. Revised: the 4 routing categories are kept as system routing tags (Rule 6) but the LLM's description of the tension nature is free-text (Rule 3). The LLM can identify novel tension types; the routing category is the system's way of handling them downstream.

- **GREEN: Two-pass architecture (Sonnet + adversarial Haiku)** — Kept. This is sound system infrastructure (Rule 6): a quality-checking mechanism, not an analytical judgment replacement.

- **GREEN: North Star irreplaceability test** — Kept. A structural quality check that surfaces when the North Star is just lossy compression rather than emergent insight.

- **GREEN: Coaching map concept** — Kept and expanded. The diagnostic coaching map that tells the feedback layer what matters most and why.

### Where This Improvement Fits

```
L3 Walk → L3.75 Holistic Synthesis → L3.5 Analysis Pass → L4 Crystallizer (THIS IMPROVEMENT) → L5 Feedback
```

L4 is the convergence layer. It is the first and only layer that can detect:
- Understanding vs. scoring divergences (L3 says "fulcrum paragraph" but L3.5 scores it at 52)
- Holistic vs. per-paragraph divergences (L3.75 says "consistent voice" but paragraph understandings show register shifts)
- Cross-dimension tensions (high voice quality but low emotional impact — the voice is authentic but not landing)
- Intent vs. execution gaps (the essay's thesis says one thing but the structure enacts something else)

If L4 misses a contradiction, no downstream layer can catch it — L5 and L6 receive L4's output as ground truth.

### Key Files

- `src/services/essayIntelligence/analysis/crystallizer.ts` — L4 implementation (prompt, validation, North Star + Score Matrix + Coherence)
- `src/services/essayIntelligence/profileTypes.ts` — Type definitions (EssayNorthStar, ParagraphScoreMatrix, CoherenceIssue, CoherenceReport)
- `src/services/essayIntelligence/analysis/analysisPass.ts` — L3.5, produces scores consumed by L4
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — L3.75, produces holistic sections consumed by L4
- `src/services/essayIntelligence/analysis/deepAnnotationService.ts` — Downstream consumer of L4 output

---

## 2. Design Principles Applied

### Rule 1: The LLM Owns All Judgment — The System Tracks and Organizes

Whether a contradiction is productive or destructive, whether it reveals essay depth or system error, whether the understanding or the scoring is more defensible — these are ALL contextual judgments. The LLM assesses; the system tracks the assessment and routes it downstream.

**Litmus test applied:**
- `runAdversarialPass()` — SYSTEM infrastructure: schedules a quality-checking LLM call. PASS.
- `mergeAdversarialResults()` — SYSTEM tracking: combines two LLM outputs without overriding either. PASS.
- The adversarial Haiku's assessment of "productive_tension" vs "system_disagreement" — LLM judgment with a routing tag. PASS.
- Any function that detects contradictions via keyword matching, threshold comparison, or sentiment analysis — FAIL. None exist in this design.

### Rule 2: Never Discard Paid LLM Output

If the primary Sonnet call says "no contradictions" but the adversarial Haiku finds tensions, BOTH perspectives are kept. The adversarial output is stored alongside the primary output with a `source: 'adversarial'` tag. The resolution — if any — is another judgment call by a downstream consumer, not a discard.

If the adversarial pass finds 7 tensions, all 7 are kept. No quotas, no "top 3 most important contradictions" trimming. If 7 tensions exist, that IS the signal — this essay has complex internal dynamics, or the analysis pipeline has calibration issues.

### Rule 3: No Closed Taxonomies

The 4 routing categories (`productive_tension`, `system_disagreement`, `essay_flaw`, `depth_signal`) are system routing tags for downstream handling (Rule 6 — system infrastructure for operational concerns). They are NOT a taxonomy of what the LLM can perceive.

The LLM describes the tension's nature in free-text prose. The routing category is assigned by the LLM for the system's benefit, not as a constraint on the LLM's perception. If the LLM finds a tension that doesn't fit neatly into any category, it picks the closest and explains in `nature`.

### Rule 4: No Whack-a-Mole Pattern Matching

No keyword-based contradiction detection. No `assessSentiment()`. No `if (understanding.role.contains('fulcrum') && score < 60)`. The adversarial LLM reads the actual profile sections, forms its own assessment of tensions, and reports what it finds.

The probing strategy in the prompt GUIDES the LLM's attention (look at understanding-vs-scoring, look at holistic claims) but does not PRESCRIBE what constitutes a contradiction. The LLM may find tensions the probing strategy didn't anticipate.

### Rule 5: Soft Guidance Over Hard Blocklists

The adversarial prompt lists areas to probe but explicitly states: "It is PERFECTLY VALID to find zero contradictions" and "Do NOT manufacture tensions to fill a quota." The probing areas are attention-directing guidance, not a checklist that must produce findings.

### Rule 6: System Infrastructure for Operational Concerns

The two-pass architecture (Sonnet + Haiku) is system infrastructure — a quality-checking mechanism. The routing categories are system bookkeeping. The North Star irreplaceability test is structural quality checking. These are all operational concerns that don't replace analytical judgment.

---

## 3. Core Architecture

### What the LLM Produces vs. What the System Manages

**LLM produces (all judgment lives here):**
- Whether a tension exists between two profile sections
- Whether that tension is productive (essay feature) or destructive (system error or essay flaw)
- Whether both readings can coexist or one is wrong
- Which reading is more defensible (if they can't coexist)
- The nature of the tension in free-text prose
- The North Star irreplaceability assessment
- The coaching map: transformative insight, priorities, protected strengths, emergent patterns
- Whether an essay's core identity has shifted vs. been refined (re-crystallization)

**System manages (all infrastructure lives here):**
- Scheduling the adversarial Haiku pass after the primary Sonnet call
- Merging adversarial findings into the coherence report with source tags
- Routing categories for downstream consumers
- North Star version tracking and changelog assembly
- Cost tracking per call
- Timing and token usage logging

### Architecture Change: Two-Pass Crystallization

**Current:** Single Sonnet call produces North Star + Score Matrix + Coherence Report. The coherence check is passive.

**New: Primary Sonnet + Adversarial Haiku.**

**Pass 1 (Sonnet, ~$0.05-0.10):** Produces North Star + Score Matrix + initial coherence assessment + Coaching Map. The prompt for this pass is enhanced with active investigation guidance (see Section 5). The primary pass ACTIVELY checks coherence rather than passively reporting whatever it happens to notice.

**Pass 2 (Haiku, ~$0.002-0.005):** Adversarial contradiction mining. Receives the complete profile PLUS the Sonnet's outputs. Reads with a skeptical eye — specifically looking for tensions the Sonnet might have rationalized away or missed because it was simultaneously constructing two other complex artifacts.

The adversarial pass is NOT a re-analysis. It reads what already exists and probes for consistency. This is why Haiku is appropriate — it needs to READ critically, not CREATE deeply.

**Why two passes work better than one:**

1. **Cognitive load**: The primary Sonnet call is already doing heavy work constructing the North Star and Score Matrix. Adding "also be deeply skeptical of your own synthesis" creates a conflicting cognitive demand — the same call can't simultaneously CONSTRUCT and DECONSTRUCT with full attention.

2. **Fresh eyes**: The adversarial Haiku hasn't participated in the synthesis. It reads the Sonnet's output as a naive reader, catching rationalizations that the Sonnet is blind to (just as a proofreader catches what a writer cannot).

3. **Cost efficiency**: Haiku at ~$0.003 per call is negligible. The total L4 cost increases by <5%.

### Type Changes

```typescript
// NEW: Adversarial contradiction output (in crystallizer.ts, not profileTypes.ts)
interface AdversarialContradictionOutput {
  /**
   * Contradictions found by adversarial probing.
   * Each includes the LLM's assessment of tension type.
   */
  contradictions: Array<{
    /** Free-text description of section A's claim */
    sectionA: string;
    claimA: string;

    /** Free-text description of section B's claim */
    sectionB: string;
    claimB: string;

    /**
     * LLM's free-text description of the tension nature.
     * NOT constrained to categories — the LLM describes what it sees.
     * Example: "The understanding layer reads P3 as an ironic inversion
     * of the opening, but the scoring treats it as a failed attempt at
     * the same register. These are fundamentally different readings."
     */
    nature: string;

    /**
     * System routing tag — LLM assigns the closest category.
     * These are routing signals for downstream handling, not perception limits.
     */
    routingCategory:
      | 'productive_tension'   // Essay feature: both readings can coexist
      | 'system_disagreement'  // Layers disagree: one is probably wrong
      | 'essay_flaw'           // Essay contradicts itself (coaching opportunity)
      | 'depth_signal';        // Contradiction reveals essay complexity

    /** Can both readings coexist, or is one wrong? LLM-assessed. */
    canCoexist: boolean;

    /** If they can't coexist, which is more likely correct and why? */
    likelyResolution: string | null;

    /** LLM-assessed severity for routing */
    severity: 'blocking' | 'notable' | 'minor';

    /** Specific evidence from the profile for both sides */
    evidenceA: string;
    evidenceB: string;
  }>;

  /**
   * Adversarial assessment of the North Star.
   * Does the North Star pass the irreplaceability test?
   */
  northStarAssessment: {
    passesIrreplaceabilityTest: boolean;
    reasoning: string;
    /** If it fails: what emergent insight is missing? */
    missingInsight: string | null;
  };

  /** Overall coherence assessment */
  overallCoherence: boolean;
}

// EXTENDED: CoherenceIssue (in profileTypes.ts) gains new fields
// Add to existing CoherenceIssue interface:
//   routingCategory?: 'productive_tension' | 'system_disagreement' | 'essay_flaw' | 'depth_signal';
//   canCoexist?: boolean;
//   likelyResolution?: string | null;
//   evidenceA?: string;
//   evidenceB?: string;
//   source?: 'primary' | 'adversarial';
// All optional for backward compatibility.

// NEW: CoachingMap (in profileTypes.ts)
interface CoachingMap {
  /**
   * The single most important coaching insight — what would transform
   * this essay if the student understood it?
   *
   * This is NOT "fix your thesis." It is "your essay performs the
   * constraint it describes — the structure IS the argument, and
   * if you can see that, the revision writes itself."
   */
  transformativeInsight: {
    insight: string;
    evidenceLocations: Array<{ paragraph: number; sentence?: number }>;
    whyThisTransforms: string;
    /**
     * True if the student needs to SEE the pattern themselves (guided
     * discovery is more effective than direct telling for structural insights).
     * False if direct instruction is appropriate (e.g., "your conclusion
     * undercuts your opening").
     */
    requiresStudentAwareness: boolean;
  };

  /**
   * Ordered coaching priorities — what to address and in what sequence.
   * The sequence matters: some improvements unlock others.
   */
  priorities: Array<{
    priority: number;  // 1 = first, 2 = second, etc.
    target: {
      paragraphs: number[];
      description: string;
    };
    architecturalReason: string;
    unlocksNext: string | null;
    expectedImpact: 'transformative' | 'significant' | 'incremental';
  }>;

  /**
   * What the essay does well that coaching should PROTECT.
   * Equally important as what to improve — many coaching systems
   * accidentally destroy strengths while fixing weaknesses.
   */
  protectedStrengths: Array<{
    description: string;
    locations: Array<{ paragraph: number; sentence?: number }>;
    whyProtect: string;
  }>;

  /**
   * Emergent patterns visible ONLY from the crystallizer's complete view.
   * Things no individual layer (understanding, scoring, holistic) can see
   * but become visible when all three are compared.
   */
  emergentPatterns: Array<{
    pattern: string;
    evidence: string;
    implication: string;
  }>;

  /**
   * Score tensions that reveal coaching priorities.
   * A paragraph with 82 effectiveness but 45 structural means
   * great writing in the wrong place. These cross-dimension tensions
   * are the crystallizer's unique diagnostic contribution.
   */
  scoreTensions: Array<{
    paragraph: number;
    tension: string;
    interpretation: string;
    coachingImplication: string;
  }>;
}

// NEW: NorthStarEvolution (in profileTypes.ts)
interface NorthStarEvolution {
  /** Version number — increments each crystallization */
  version: number;

  /** What changed from the previous version */
  changelog: Array<{
    field: string;
    previousValue: string;
    newValue: string;
    trigger: string;
  }>;

  /**
   * LLM-assessed: has the essay's fundamental identity shifted
   * or just been refined?
   */
  coreIdentityStable: boolean;
  stabilityAssessment: string;
}
```

### Coaching Map: Replacing prioritizedImprovements

The existing `prioritizedImprovements` in `ParagraphScoreMatrix` is a flat list of what to fix. The `CoachingMap` replaces it with richer structure:

- **Transformative insight**: The ONE thing that would transform the essay. Not "fix your thesis" but the deep architectural insight that reframes everything.
- **Ordered priorities**: What to fix, in what order, because sequence matters (structural fixes must precede craft fixes).
- **Protected strengths**: What NOT to change — equally important as what to change. Coaching that accidentally destroys the essay's authentic voice is worse than no coaching.
- **Emergent patterns**: What the complete view reveals that no individual layer could see.
- **Score tensions**: Cross-dimension scoring tensions that reveal coaching priorities.

---

## 4. Deeper Design

### The Coexistence Test: Productive vs. Destructive

The fundamental question for every tension: "Can both readings coexist?"

**Productive tension (essay feature):**
- "Voice is authentic but craft is rough" — improving craft while protecting voice IS the coaching goal. Both observations are true and useful simultaneously.
- "Structurally unconventional but deeply effective" — the unconventionality IS why it works. These don't contradict; they define each other.
- "Claims constraint enables creativity but never demonstrates it" — the gap between claim and evidence IS the essay's unfinished business. This tension is the coaching moment.

**System disagreement (calibration error):**
- "Understanding says P3 is deeply earned but scoring says P3 is unearned" — one layer misread. The adversarial pass should state which is more defensible based on the actual text.
- "Voice map shows 4 register shifts but voice identity says consistent" — data conflict. At most one can be right.
- "L3.5 scored P3 at 45 but holistic synthesis calls it the essay's strongest moment" — scoring calibration error or holistic synthesis hyperbole.

**Essay flaw (coaching opportunity):**
- "The essay argues for synthesis but the structure enacts separation" — the form contradicts the content. This might be the essay's deepest available insight.
- "The writer's stated goal diverges from what the text actually does" — the intent-execution gap IS the coaching opportunity.

**Depth signal (essay complexity):**
- "The narrator claims growth but the vocabulary shows regression" — this could be intentional (the growth is performed, the regression is real) or unintentional (the writer doesn't see it). Either way, it reveals depth the individual layers couldn't name.
- "Humor and solemnity coexist without irony" — unusual tonal combination that reveals something about the writer's relationship to the subject.

The adversarial Haiku assesses these categories. The system routes based on the category. Neither constrains what the LLM can perceive.

### The North Star Irreplaceability Test

The North Star's value proposition is that it contains EMERGENT understanding — insight that doesn't exist in any individual profile section and can't be reconstructed from them. If you deleted the North Star, would you lose understanding that requires re-reading the entire profile holistically?

Three dimensions of the test:

**1. Distinctiveness Signature Irreplaceability:**
Delete the distinctiveness signature. Can you reconstruct the SAME insight from voice identity + thematic architecture + paragraph understandings? If yes, the signature is lossy compression, not emergent insight.

Good distinctiveness: "This essay's power is that its structure performs its argument — the fragmented paragraphs about learning to code mirror the debugging process the writer describes, creating a meta-structural argument that the 'broken' structure IS the thesis."

Bad distinctiveness: "This essay is about the writer's experience learning to code and discovering a passion for problem-solving." (This is a summary. It exists in the thematic architecture already.)

**2. Structural Roles Architectural Quality:**
Does each structural role describe ARCHITECTURAL FUNCTION or just CONTENT?

Good: "P2 frames the economic lens that makes P3's stakes calculable — without the family's financial context, the coding bootcamp choice reads as privilege rather than gamble."

Bad: "P2 introduces the family's financial situation." (Content description. The paragraph understanding already says this.)

**3. Through-Line Meaning Transformation:**
Does the through-line trace MEANING transformation or just physical appearances?

Good: "The diamond's signification shifts from commodity (P1, price-tagged) to inheritance (P3, grandmother's ring) to identity marker (P5, the writer's own choice to wear it) — tracking the writer's relationship to material value."

Bad: "The diamond appears in P1, P3, and P5." (Appearance tracking. The connection graph already does this.)

### North Star Evolution and Stability

When the essay is re-analyzed (after edits or coaching), the North Star may need to evolve. But it also needs stability — the essay's core identity shouldn't shift wildly based on minor re-analysis variance.

**Core identity vs. surface interpretation:**
- Core identity = what the essay fundamentally IS (a constraint-creativity meditation, a loss narrative, an identity assertion). Shifts only when the student makes structural changes or coaching reveals divergent intent.
- Surface interpretation = how the system reads the execution (through-line tracking, structural role assessments, trajectory). Evolves naturally as understanding deepens.

The crystallizer explicitly assesses: "Core identity [stable/shifted]. Surface interpretation [refined/significantly updated/unchanged]." This prevents the North Star from drifting aimlessly while allowing genuine evolution.

### Emergent Patterns: What Only the Complete View Reveals

The crystallizer is the ONLY layer that sees understanding + scoring + holistic synthesis simultaneously. What patterns become visible only from this vantage point?

**1. Dimension correlation patterns:**
"Voice quality and structural importance are inversely correlated — the writer's strongest voice appears in transitional paragraphs, not load-bearing ones. This suggests the writer is most authentic when they feel least pressure to perform."

No individual layer can see this. Understanding doesn't know about scores. Scoring doesn't know about structural roles. The holistic synthesis knows voice quality per paragraph but not structural roles. Only the crystallizer has all three.

**2. Score-structure mismatches:**
"The highest-scored paragraph (P2, effectiveness 82) is structurally decorative. The lowest-scored paragraph (P4, effectiveness 51) is load-bearing. This inversion means the essay's BEST WRITING is in the WRONG PLACE architecturally."

**3. Growth trajectory:**
"The emotional topography shows rising intensity but the scoring shows declining effectiveness. The writer's ambition outpaces their craft in the second half — they're reaching for deeper emotional territory without the craft tools to land it."

**4. Cross-system validation:**
"The voice map identifies P0-P1 as performative and P3-P4 as genuine. The scoring independently confirms this — P0-P1 average 58, P3-P4 average 75. The understanding, holistic synthesis, and scoring all converge on the same reading."

These patterns are the crystallizer's highest-value output because they CAN'T come from anywhere else in the pipeline.

### Interaction: Contradiction Mining x Scoring Validation (#2)

If Improvement #2 has been implemented, L3.5 includes confidence metadata on each score. This enriches the adversarial pass significantly:

- **High-confidence low score on a "strongest moment"**: Genuine contradiction. The adversarial Haiku should probe whether the understanding or the scoring is more defensible.
- **Low-confidence low score on a "strongest moment"**: The scoring itself acknowledges uncertainty. The adversarial pass should flag this as a lower-severity tension with a note about scoring uncertainty.
- **High-confidence high scores everywhere**: If all scores are high-confidence AND uniformly high, this could indicate genuine quality OR calibration drift (the LLM was too generous). The adversarial pass can cross-check against the holistic synthesis's quality assessment.

Without Improvement #2's confidence metadata, the adversarial pass still works — it just has less nuanced information about score reliability.

### Interaction: Contradiction Mining x Continuous Phase Detection (#9)

If Improvement #9 has been implemented, the coaching map's priority ordering should be phase-aware:

- At Foundation: the transformative insight focuses on structural coherence. Score tensions between effectiveness and structural role are highest priority.
- At Craft: the transformative insight focuses on execution quality. Score tensions between voice and emotional impact are highest priority.
- At Distinction: the transformative insight focuses on what makes the essay unforgettable. Emergent patterns about the essay's unique identity are highest priority.

The crystallizer receives the ImprovementPhase as context and adjusts coaching map emphasis accordingly.

### Edge Case: No Contradictions Found

A well-analyzed, straightforward essay may genuinely have no contradictions. The adversarial pass should validate this possibility rather than manufacturing tensions:

- The adversarial output can return `contradictions: []` with `overallCoherence: true`.
- This IS information — it tells downstream consumers that the profile is internally consistent.
- The adversarial prompt explicitly states: "Finding zero tensions is a valid outcome."
- The system should NOT log this as a warning or treat it as suspicious.

### Edge Case: North Star Fails Irreplaceability

If the adversarial pass determines the North Star is just lossy compression:

1. Log: `[Crystallizer] North Star failed irreplaceability test: {reasoning}`
2. Store the failure assessment in the coherence report.
3. Do NOT re-run the crystallization. The North Star is still better than nothing — even a mediocre North Star provides structural context for L5.
4. If a re-crystallization is triggered later (edit, coaching insight), the failure assessment is included in context so the Sonnet can produce a more emergent North Star.

### Edge Case: Contradictions Between Adversarial and Primary

What if the adversarial Haiku contradicts the primary Sonnet's coherence assessment? (Sonnet says "coherent", Haiku says "3 blocking tensions".)

Both assessments are kept. The adversarial findings are tagged with `source: 'adversarial'`. Downstream consumers can decide how to handle the disagreement — but the system never discards either.

---

## 5. Prompt Engineering

### Enhanced Primary Sonnet Prompt: Active Coherence Investigation

Add to the existing system prompt's coherence section. This replaces the passive "report contradictions if they exist" framing with active investigation:

```
## COHERENCE — ACTIVE INVESTIGATION, NOT PASSIVE REPORTING

Don't just report contradictions you happen to notice. ACTIVELY INVESTIGATE:

1. FOR EACH HOLISTIC CLAIM (voice identity assertion, emotional arc description,
   thematic thesis):
   Find the specific paragraph-level data that supports OR undermines it.
   If you make a holistic claim like "consistent voice throughout," trace it:
   which paragraphs support this? Does the voice map show register shifts
   that complicate "consistent"? If you can't find strong support, that's
   a tension worth reporting.

2. FOR EACH HIGH-PRIORITY PARAGRAPH in the score matrix:
   Does its architectural role (from structural roles) match its score profile?
   Load-bearing paragraphs with low scores are URGENT — the essay's weight
   rests on weak material.
   Decorative paragraphs with high scores are DIAGNOSTIC — good writing
   in the wrong structural position. The student writes well when the stakes
   are low; why does quality drop when it matters?

3. READ THE OVERALL SCORE DISTRIBUTION:
   Does it match the essay's actual quality range? An essay with uniform
   65-75 scores across all paragraphs is almost certainly showing score
   clustering rather than genuine uniformity. Most essays have peaks and
   valleys — look for them.

4. LOOK FOR INTENT-EXECUTION GAPS:
   The essay's thesis (from thematic architecture) states what the essay
   is TRYING to do. The structural roles show what it ACTUALLY does.
   Does the essay execute its intent? Where does execution diverge from
   ambition? These gaps are the richest coaching material.

For each tension you find, assess whether both readings can coexist
(productive tension — the essay IS complex) or one is wrong (system
disagreement — a layer misread). This distinction determines how
the coaching layer handles it.
```

### Adversarial Haiku Prompt (Complete)

This is the full prompt for the adversarial pass. It runs AFTER the primary Sonnet call and receives the primary output as context.

```
You are a skeptical reviewer checking a crystallization analysis for
internal consistency. You are NOT re-doing the analysis — you are
STRESS-TESTING it.

You receive:
1. The complete essay profile (understanding + holistic synthesis + scoring)
2. The primary crystallization output (North Star + Score Matrix + Coaching Map
   + initial coherence assessment)

Your job: find tensions the primary analysis missed or smoothed over.
The primary analyzer tends to rationalize — it created the synthesis
and is naturally biased toward seeing it as coherent. You are the fresh
eyes.

PROBING STRATEGY (areas to investigate — NOT a checklist to fill):

PROBE 1 — UNDERSTANDING vs. SCORING:
For each paragraph, compare what the understanding says this paragraph
DOES with how the scoring says it PERFORMS. The understanding describes
function; the scoring evaluates execution. They often diverge in
interesting ways.

Key patterns to look for:
- "Fulcrum paragraph" with low effectiveness → structural importance ≠ execution quality
- "Transitional paragraph" with high effectiveness → best writing in the lowest-stakes position
- "Opening paragraph" with mediocre effectiveness → the essay's first impression underperforms

For each divergence, briefly read the actual essay text and form your
own judgment: which assessment (understanding or scoring) is more
defensible? Is this a genuine tension (the paragraph really IS
important but poorly executed) or a measurement error?

PROBE 2 — HOLISTIC CLAIMS vs. EVIDENCE:
The holistic synthesis (voice identity, emotional topography, thematic
architecture, narrative strategy, etc.) makes claims about the essay
as a whole. Each claim should be evidenced in the paragraph-level data.

Pick the BOLDEST claim in the holistic synthesis and trace its evidence:
- Which paragraphs support it?
- Which paragraphs complicate or undermine it?
- Is the claim well-supported, partially supported, or unsubstantiated?

If a holistic claim is unsubstantiated by the paragraph data, that's
either a synthesis overreach (the Sonnet inferred too much) or the
paragraph analysis missed something (the data is there but the analysis
didn't surface it). State which and why.

PROBE 3 — NORTH STAR IRREPLACEABILITY:
The North Star should contain EMERGENT understanding that doesn't exist
in any individual profile section. Apply three tests:

DISTINCTIVENESS TEST: Read the distinctiveness signature. Now imagine
deleting it. Can you reconstruct the SAME insight from the voice identity
+ thematic architecture + paragraph understandings? If yes, the signature
is lossy compression, not emergent insight. It fails.

STRUCTURAL ROLE TEST: Read each structural role description. Does it
describe ARCHITECTURAL FUNCTION ("frames the economic lens that makes P3's
stakes calculable") or just CONTENT ("introduces the family's background")?
Content descriptions are summaries — they exist in the paragraph understanding
already. Only architectural descriptions pass.

THROUGH-LINE TEST (if present): Does the through-line trace MEANING
TRANSFORMATION ("the diamond's signification shifts from commodity to
inheritance to identity marker") or just PHYSICAL APPEARANCES ("the
diamond appears in P1, P3, and P5")? Appearance tracking is already done
by the connection graph. Only meaning transformation passes.

PROBE 4 — PRODUCTIVE TENSIONS (the essay's own internal complexity):
Look past system consistency. Are there tensions WITHIN THE ESSAY ITSELF
that the analysis hasn't surfaced?

The best essays HAVE productive tensions:
- "Raw authentic voice but rough craft" — the authenticity might depend
  on the roughness. Polishing could destroy what makes it real.
- "Unconventional structure but unclear arc" — the unconventionality
  might BE the arc, or it might be confusion disguised as creativity.
- "Specific, grounded early paragraphs but abstract late paragraphs" —
  intentional shift from concrete to reflective? Or the writer running
  out of material?

When you find productive tension, describe it as an OPEN QUESTION
for coaching, not as a problem with a solution. The student decides
how to handle it.

PROBE 5 — COACHING MAP QUALITY:
Is the transformative insight genuinely transformative, or is it a
restatement of an obvious problem? Does the priority ordering make
architectural sense (structural before craft, foundational before
decorative)? Are the protected strengths genuinely worth protecting?

FOR EACH TENSION YOU FIND:
- State both sides with specific evidence (cite paragraph/sentence indices)
- Assess: can both readings coexist (productive) or is one wrong (destructive)?
- If one is wrong, which is more defensible based on the actual text?
- Assign a routing category: productive_tension | system_disagreement |
  essay_flaw | depth_signal
- Rate severity: blocking | notable | minor
  (blocking = fundamentally changes the coaching direction;
   notable = should be surfaced but doesn't change direction;
   minor = interesting but not actionable)

IMPORTANT:
- Finding zero tensions is a VALID outcome for a well-analyzed,
  straightforward essay. Do not manufacture tensions to seem thorough.
- Do NOT re-score or re-analyze — only check CONSISTENCY.
- You are a PROOFREADER of the analysis, not a competing analyst.

Output JSON:
{
  "contradictions": [
    {
      "sectionA": "string — which profile section (e.g., 'P3 understanding')",
      "claimA": "string — what section A claims",
      "sectionB": "string — which profile section (e.g., 'L3.5 scoring P3')",
      "claimB": "string — what section B claims",
      "nature": "string — free-text description of the tension",
      "routingCategory": "productive_tension" | "system_disagreement" |
                         "essay_flaw" | "depth_signal",
      "canCoexist": true/false,
      "likelyResolution": "string | null — if can't coexist, which is right",
      "severity": "blocking" | "notable" | "minor",
      "evidenceA": "string — specific text/data supporting claim A",
      "evidenceB": "string — specific text/data supporting claim B"
    }
  ],
  "northStarAssessment": {
    "passesIrreplaceabilityTest": true/false,
    "reasoning": "string — detailed assessment of each test",
    "missingInsight": "string | null — what emergent insight is absent"
  },
  "overallCoherence": true/false
}
```

### Coaching Map Prompt Section (added to primary Sonnet prompt)

```
## COACHING MAP

After constructing the North Star and Score Matrix, produce a coaching map
that tells the feedback layer what matters most and why.

TRANSFORMATIVE INSIGHT:
What is the ONE thing that would transform this essay if the student
understood it? Not "fix your thesis" — that's an instruction. Think deeper:

Good: "Your essay performs its argument — the fragmented structure mirrors
the debugging process you describe. If you can see this structural metaphor,
you can make it intentional rather than accidental, and the revision writes itself."

Bad: "You need a clearer thesis statement in your opening paragraph."

The transformative insight should be something that REFRAMES how the student
sees their own essay. It often comes from emergent patterns visible only
from the complete view — dimension correlations, score-structure mismatches,
intent-execution gaps.

For each transformative insight, indicate whether it requires student
AWARENESS (guided discovery is more effective) or can be TOLD directly.

COACHING PRIORITIES:
Order improvements by architectural importance AND dependency chain.
Priority 1 should unlock Priority 2 — don't list 5 independent items.
List improvements that form a SEQUENCE of revision.

For each priority:
- Which paragraphs are affected?
- What is the architectural reason this matters (in North Star terms)?
- What does fixing this unlock for the next priority?
- What is the expected impact (transformative / significant / incremental)?

PROTECTED STRENGTHS:
What should the student NOT change? These are equally important as what
to improve. Many well-intentioned revisions accidentally destroy:
- Authentic voice moments
- Structural innovations that seem like errors but aren't
- Moments of genuine emotion embedded in rough craft

For each protected strength, explain WHAT WOULD BE LOST if it were changed.

EMERGENT PATTERNS:
What can you see from the complete view that no individual analysis layer
could see? These often come from comparing dimensions:
- Voice quality vs. structural importance (inversely correlated?)
- Score trajectory across paragraphs (rising? falling? peak in the middle?)
- Quality distribution vs. structural weight (best writing in wrong place?)

SCORE TENSIONS:
Identify paragraphs where the score dimensions pull in different directions.
A paragraph with high effectiveness but low structural score = good writing
in the wrong position. A paragraph with high voice but low emotional score =
authentic voice that isn't landing emotionally.

Each score tension implies a coaching action: "Move the good writing to
where it matters" or "The voice is working; now help it CONNECT emotionally."
```

### Re-Crystallization Prompt Addition

When crystallizing an essay that already has a North Star (re-crystallization after edit or coaching), add this to the call instruction:

```
PRIOR NORTH STAR (version ${priorNorthStar.evolution?.version ?? 1}):
${JSON.stringify(priorNorthStar, null, 2)}

WHAT CHANGED SINCE LAST CRYSTALLIZATION:
${changeDescription}

YOUR RE-CRYSTALLIZATION TASK:
Update the North Star to reflect new understanding. But ASSESS whether
the essay's CORE IDENTITY has shifted or just been refined.

Core identity shifts are RARE and significant — they happen when:
- A structural edit changes what the essay IS about
- A coaching conversation reveals the student's intent diverges from the text
- Re-analysis discovers the essay's deeper argument was different than assumed

Most updates are REFINEMENTS, not identity shifts. Examples of refinements:
- Through-line map gains a new stop (the diamond appears in a new paragraph)
- Structural role is reclassified (P2 was "supporting" but edits made it load-bearing)
- Trajectory path is extended (the essay now has a coda)

Track what changed and why in the evolution changelog.
Explicitly state: "Core identity: [stable/shifted]. Reasoning: ..."
```

### Token Budget Estimate

**Primary Sonnet call (enhanced):**
- Additional system prompt (active coherence + coaching map schema): ~600 tokens (cached)
- Additional output (coaching map): ~300-500 tokens
- Net increase from current: ~$0.005-0.015

**Adversarial Haiku call (new):**
- Input: full profile + primary Sonnet output (~3000-6000 tokens)
- Output: adversarial findings (~200-800 tokens)
- Cost: ~$0.002-0.005

**Total L4 cost increase: ~$0.007-0.020 per essay.**
This is <15% increase from the current ~$0.05-0.10 baseline.

---

## 6. Integration Points

### With Improvement #2 (Anti-Clustering Scoring Validation)

L3.5's confidence metadata enriches the adversarial pass. When scores have confidence levels:
- High-confidence scores that contradict understanding = likely genuine tensions
- Low-confidence scores that contradict understanding = the scoring itself is uncertain
- The adversarial pass should note confidence context when assessing score-understanding divergences

L3.5's anchor-based calibration also reduces the number of calibration-error contradictions the adversarial pass would otherwise find. Better-calibrated scores mean the adversarial pass can focus on genuine tensions rather than scoring artifacts.

### With Improvement #9 (Continuous Phase Detection)

The coaching map's priority ordering should be phase-aware:
- The crystallizer receives the ImprovementPhase as input context
- At Foundation: transformative insights focus on structural coherence; score-structural tensions are highest priority
- At Craft: transformative insights focus on execution quality; voice-emotional tensions are highest priority
- At Distinction: transformative insights focus on what makes the essay unforgettable; emergent patterns about unique identity are highest priority

Per-dimension phases from Improvement #9 allow the coaching map to target different coaching approaches for different dimensions in the same essay.

### With L5 Feedback Layer (Annotations)

L5 consumes the coaching map to determine annotation priorities:
- `coachingMap.priorities[0]` → highest-priority annotation target
- `coachingMap.protectedStrengths` → strength annotations that warn against over-revision
- `coachingMap.transformativeInsight.requiresStudentAwareness` → guided discovery annotations vs. direct instruction

The coaching map REPLACES `prioritizedImprovements` as L5's source of what to annotate. Any consumer of `prioritizedImprovements` should be updated to read `coachingMap.priorities`.

### With L6 Coaching (Conversation)

L6 uses the coaching map as conversation strategy:
- The transformative insight may be revealed gradually across turns (if `requiresStudentAwareness: true`)
- Protected strengths inform what the coach AFFIRMS
- Score tensions are conversation starters: "I noticed your P2 has really strong voice but the emotional connection drops — what were you going for there?"
- Productive tensions are question generators: "Your essay has this interesting quality where the structure is unconventional but it works. Was that intentional?"

### With PLAN2 ReadingStrategy

The crystallizer's emergent patterns and coaching map can eventually inform the ReadingStrategy for re-analysis. "This essay rewards attention to vocabulary domain shifts" is exactly the kind of meta-insight the crystallizer can produce from its complete view.

### With PLAN2 Growth Engine

The coaching map's `emergentPatterns` feed back into the growth engine as high-value investigation leads. An emergent pattern like "voice quality inversely correlates with structural importance" can generate a deep dive question: "WHY does the writer's voice strengthen when stakes are lower?"

---

## 7. Implementation Sequence

### Step 1: Type Definitions (30 min)
**File:** `src/services/essayIntelligence/profileTypes.ts`

1. Add `CoachingMap` interface (as defined in Section 3)
2. Add `NorthStarEvolution` interface (as defined in Section 3)
3. Extend `CoherenceIssue` with optional fields: `routingCategory`, `canCoexist`, `likelyResolution`, `evidenceA`, `evidenceB`, `source`
4. Extend `EssayNorthStar` with optional `evolution?: NorthStarEvolution`
5. Update `ParagraphScoreMatrix`: add optional `coachingMap?: CoachingMap` alongside existing `prioritizedImprovements` (keep both during transition)
6. All new fields are OPTIONAL — backward compatible with existing profiles
7. Run `npx tsc --noEmit` — should compile cleanly

### Step 2: Enhanced Primary Sonnet Prompt (2-3 hours)
**File:** `src/services/essayIntelligence/analysis/crystallizer.ts`

1. Update `buildSystemPrompt()`:
   - Add Active Coherence Investigation section (from Section 5)
   - Add Coaching Map schema and instructions (from Section 5)
   - Update output JSON schema to include `coachingMap` alongside existing fields
   - Add North Star irreplaceability framing to the North Star guidance section
   - Keep ALL existing content — changes are ADDITIVE

2. Update the output format in `buildSystemPrompt()`:
   - Add `coachingMap` to the expected JSON output
   - Add `routingCategory`, `canCoexist`, `evidenceA`, `evidenceB` to coherence issue schema
   - Add `evolution` to North Star schema (for re-crystallization)

3. Update `buildCallInstruction()`:
   - When prior North Star exists (re-crystallization), add re-crystallization context (from Section 5)
   - Include prior North Star + change description in the call instruction

### Step 3: Adversarial Pass Function (2 hours)
**File:** `src/services/essayIntelligence/analysis/crystallizer.ts`

1. Add `AdversarialContradictionOutput` interface (local to crystallizer, not in profileTypes)

2. Add `runAdversarialPass()` function:
   ```typescript
   async function runAdversarialPass(
     profile: Readonly<EssayProfile>,
     essayText: string,
     primaryResult: L4CrystallizationResult,
     profileContext: AssembledProfileContext,
   ): Promise<{
     output: AdversarialContradictionOutput;
     cost: number;
     tokenUsage: { inputTokens: number; outputTokens: number };
   }>
   ```
   - Uses Haiku model (`claude-haiku-4-5-20251001`)
   - System prompt: adversarial role + probing strategy (from Section 5)
   - User message: serialized profile context + primary crystallization output
   - Parse JSON response with error recovery (Haiku self-fix pattern)
   - Temperature: 0.2 (focused, deterministic reading)
   - Max output tokens: 3000

3. Add `validateAdversarialOutput()`:
   - Validate JSON structure
   - Validate routing categories are one of the 4 values (default to 'depth_signal' if unknown)
   - Validate severity is one of 3 values (default to 'notable')
   - No other validation — the LLM's assessments are taken as-is

### Step 4: Merge Adversarial Results (1 hour)
**File:** `src/services/essayIntelligence/analysis/crystallizer.ts`

1. Add `mergeAdversarialResults()` function:
   ```typescript
   function mergeAdversarialResults(
     primaryCoherence: CoherenceReport,
     adversarial: AdversarialContradictionOutput,
   ): CoherenceReport
   ```
   - Convert adversarial contradictions to `CoherenceIssue` format with `source: 'adversarial'`
   - Tag primary coherence issues with `source: 'primary'`
   - Concatenate both sets — no deduplication (the two perspectives may surface the same tension differently, and both perspectives have value)
   - Update `overallCoherent` based on both assessments: if EITHER says incoherent, the merged report is incoherent
   - Store `northStarAssessment` in the coherence report (add field if needed)

2. This is SYSTEM tracking (Rule 1) — combining two LLM outputs without overriding either.

### Step 5: Update Crystallize Method (1-2 hours)
**File:** `src/services/essayIntelligence/analysis/crystallizer.ts`

1. Update the main `crystallize()` method:
   ```
   a. Run primary Sonnet call (unchanged call structure, enhanced prompt)
   b. Parse primary results including coaching map
   c. Run adversarial Haiku pass (new)
   d. Merge adversarial results into coherence report
   e. If adversarial pass fails → log warning, use primary results only
   f. Return enhanced L4CrystallizationResult with merged coherence
   ```

2. Update `L4CrystallizationResult`:
   - Add optional `adversarialCost?: number`
   - Add optional `adversarialTimingMs?: number`
   - Total cost = primary cost + adversarial cost

3. Error handling for adversarial pass:
   - If Haiku call fails: log warning, proceed with primary results only
   - The adversarial pass is a QUALITY ENHANCEMENT, not a required step
   - Self-fix pattern: if JSON parsing fails, send error + bad output to Haiku for repair

### Step 6: Coaching Map Extraction (1-2 hours)
**File:** `src/services/essayIntelligence/analysis/crystallizer.ts`

1. Update `buildScoreMatrix()` (or add `buildCoachingMap()`) to parse the coaching map from LLM output:
   - Extract `transformativeInsight` with evidence locations
   - Extract `priorities` with architectural reasons and unlock chains
   - Extract `protectedStrengths` with protection reasons
   - Extract `emergentPatterns` with evidence and implications
   - Extract `scoreTensions` with interpretations and coaching implications
   - Defaults: empty arrays for all list fields, generic transformative insight for required fields

2. Store coaching map on the `ParagraphScoreMatrix.coachingMap` field.

3. For backward compatibility, continue to populate `prioritizedImprovements` from `coachingMap.priorities` (map priority descriptions to the old format). This can be removed once all consumers are updated.

### Step 7: North Star Evolution Tracking (1 hour)
**File:** `src/services/essayIntelligence/analysis/crystallizer.ts`

1. When `crystallize()` receives a profile with an existing North Star:
   - Include prior North Star in the call instruction (re-crystallization prompt)
   - Parse `evolution` from the output
   - If no prior North Star: set `evolution.version = 1`, empty changelog

2. Add `buildEvolutionChangelog()`:
   - Compares new North Star to prior
   - Records field-level changes
   - This is SYSTEM tracking (Rule 1) — recording what changed, not judging whether it should have

### Step 8: Update Downstream Consumers (1-2 hours)

**File:** `src/services/essayIntelligence/analysis/deepAnnotationService.ts`
- Update to read `coachingMap.priorities` instead of `prioritizedImprovements`
- Use `coachingMap.protectedStrengths` to generate strength-protection annotations
- Use `coachingMap.transformativeInsight` for the highest-priority annotation

**File:** Any other consumers of `prioritizedImprovements`
- Search codebase for `prioritizedImprovements` references
- Update each to read from `coachingMap.priorities` with fallback to `prioritizedImprovements`

### Step 9: Testing (2-3 hours)

Create test file: `tests/test-l4-contradiction-mining.ts`

1. **Adversarial pass quality test**: Run full pipeline against the piano test essay.
   - Verify: adversarial pass finds real tensions (not manufactured ones)
   - Verify: tensions have specific evidence (not generic claims)
   - Verify: routing categories match the tension descriptions
   - Verify: `canCoexist` assessment is defensible

2. **North Star irreplaceability test**: Check that the North Star passes the irreplaceability test.
   - If it fails, examine the distinctiveness signature — is it a summary?
   - A failure here is a PROMPT issue, not a code issue

3. **Coaching map quality test**: Verify the coaching map is useful.
   - Is the transformative insight genuinely transformative (not "fix your thesis")?
   - Are priorities ordered by architectural importance?
   - Are protected strengths genuinely worth protecting?
   - Do score tensions identify real cross-dimension divergences?

4. **Re-crystallization test**: Run analysis, simulate an edit, re-crystallize.
   - Verify: evolution changelog tracks what changed
   - Verify: core identity stability assessment is reasonable

5. **Zero-contradiction test**: Use a straightforward, well-written essay.
   - Verify: adversarial pass returns empty contradictions if none exist
   - Verify: system does not log warnings for empty results

6. **Cost verification**: The adversarial Haiku pass should cost ~$0.002-0.005.
   - Total L4 cost should increase by <15%

7. **Backward compatibility test**: Verify existing consumers of `prioritizedImprovements` still work with the dual-population approach.

### Step 10: Type Check and Cleanup (30 min)

1. `npx tsc --noEmit` — fix any remaining type errors
2. Verify all consumers of `CoherenceIssue` handle new optional fields gracefully
3. Verify `coachingMap` and `prioritizedImprovements` are both populated during transition
4. Remove any debugging artifacts
5. Ensure no functions detect contradictions via keyword matching, threshold comparison, or sentiment analysis — final litmus test

### Dependency Notes
- This improvement has NO hard dependencies on Improvements #2 or #9 — implement independently
- If Improvement #2 is implemented: confidence metadata enriches the adversarial pass (acknowledged in probing strategy), but the adversarial pass works without it
- If Improvement #9 is implemented: phase context enriches the coaching map priority ordering, but the coaching map works without phase awareness
- The coaching map replaces `prioritizedImprovements` — downstream consumers need updating (Step 8)
- The adversarial Haiku pass is gracefully degradable — if it fails, the system proceeds with primary results only

### Cost Impact Summary
- Enhanced primary Sonnet prompt: +$0.005-0.015 per essay (additional output tokens for coaching map)
- Adversarial Haiku pass: +$0.002-0.005 per essay (new call)
- Evolution tracking output: +$0.001-0.003 per re-crystallization
- **Total additional cost: ~$0.007-0.020 per essay analysis**
- **Latency impact: +1-3 seconds** (Haiku call after Sonnet, sequential)
