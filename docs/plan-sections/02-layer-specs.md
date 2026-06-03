# Layer-by-Layer Specifications: L3.75, L4, L5, L6 (Updated)

> These specifications replace the corresponding sections in docs/specs/PLAN.md (lines 1236-1590).
> They incorporate all decisions from the gap analysis, North Star design, type system design, and quality review findings.

---

### Layer 3.75: Holistic Synthesis (Sonnet x 1) — FULL ESSAY-LEVEL UNDERSTANDING

**New file**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (~250 lines)

**The gap this fills**: During the L3 walk, `holisticEvolution` captures incremental shifts (thesis crystallizing, voice signature emerging) — but only 4 fields. The full holistic profile has 7 major sections with dozens of fields: emotional topography (arc, undertones, authenticity), character revelation (values, growth arc, blind spots), craft assessment (sentence patterns, image system), admissions positioning (tellability, distinctiveness, red flags), etc. Nothing in the current architecture populates these comprehensively.

**Three new responsibilities** beyond the original synthesis:

1. **Voice Map population.** L3.75 sees the complete sentence-level understanding — every paragraph, every sentence, every connection. It maps register, vocabulary fingerprint, sentence rhythm, perspective/distance, and tonal disposition (humor, irony, earnestness, irreverence, solemnity — per review S4) across the entire essay. It identifies stability regions and shift points. For each shift, it assesses intentionality — does this shift align with a structural boundary? Does it serve an identifiable purpose in another dimension? Does it commit fully to the new register or oscillate? Intentionality assessments carry a confidence level (0-1). Below 0.6, the system should present the shift as a question to the student, not a conclusion (per review M4).

2. **Moment Earned-ness Map.** L3.75 traces backward from each significant moment — emotional peaks, intellectual realizations, humorous payoffs (per review S5, not just emotions) — to identify the narrative mechanisms that earn it. For each moment, it builds the arrow network: which earlier passages contribute through sensory grounding, emotional setup, stakes establishment, character revelation, thematic preparation, intellectual scaffolding, or comedic/subversive setup. When a moment is unearned, the map identifies the specific gap: "P3S5 claims devastation but no prior passage established emotional proximity to the object." The arrow network IS the diagnosis — sparse arrows mean unearned moments, dense arrows mean earned ones.

3. **Cross-Dimension Entanglements.** L3.75 identifies moments where 2+ dimensions intersect meaningfully: "P2S3's voice shift from concrete to reflective IS the thematic pivot from transaction to value." Entanglements are stored as a separate section (the 8th holistic section, per review C1), not inside individual dimension sections. They are the evidence layer — specific, located, with precise paragraph/sentence references. L4's distinctiveness signature will synthesize across these entanglements to produce the global interpretive reading (per review S7).

**Input**: Profile Index + all paragraph understanding maps + all connections + the incremental `holisticEvolution` values accumulated during the walk (as a starting point, not the final answer) + scout connection leads.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached forever): System instructions — role as holistic synthesizer, output schema, voice map dimensions, earned-ness mechanism types, entanglement detection guidance, examples of intentional vs unintentional voice shifts.
- **Block 2** (essay-specific, cached across L3.75 + L3.5 if sequential): Full essay text + complete sentence-level understanding maps for all paragraphs + connection graph + scout connection leads.
- **Block 3** (call-specific, not cached): The incremental `holisticEvolution` accumulation from the walk as a starting scaffold. Prompt: "Synthesize the complete holistic profile from the ground up. The walk's incremental observations are a starting point — confirm, deepen, or correct them using the full understanding."

**Output**:
```typescript
interface HolisticSynthesisOutput {
  voiceIdentity: {
    signature: string;
    register: string;
    distinctivePatterns: string[];
    evolution: string;
    authenticMoments: Array<{ paragraph: number; sentence: number; moment: string }>;
    voiceDrifts: Array<{ paragraph: number; from: string; to: string }>;
    // consistencyScore REMOVED — replaced by voiceMap
  };
  voiceMap: {
    dimensions: {
      register: Array<{ paragraphs: number[]; level: string }>;
      vocabularyFingerprint: Array<{ domain: string; examples: string[]; paragraphs: number[] }>;
      sentenceRhythm: Array<{ paragraphs: number[]; pattern: string }>;
      perspectiveDistance: Array<{ paragraphs: number[]; stance: string }>;
      tonalDisposition: Array<{ paragraphs: number[]; tone: string }>;  // humor, irony, earnestness, etc.
    };
    stabilityRegions: Array<{ paragraphs: number[]; voiceCharacter: string }>;
    shiftPoints: Array<{
      location: { paragraph: number; sentence: number };
      from: string;
      to: string;
      intentional: boolean;
      intentionalityConfidence: number;       // 0-1. Below 0.6 → present as question
      intentionalityReasoning: string;        // WHY the system thinks intentional/unintentional
      servesOtherDimension: string | null;    // e.g. "emotional transition", "thematic pivot"
      codeSwitching: { language: string; trigger: string; culturalFunction: string } | null;
    }>;
  };
  emotionalTopography: {
    arc: string;
    peakMoments: Array<{ paragraph: number; sentence: number; moment: string; intensity: number }>;
    undertones: string[];
    authenticityAssessment: string;
    emotionalProgression: Array<{ paragraph: number; register: string; depth: number }>;
    // isEarned REMOVED — replaced by earnednessMap
  };
  earnednessMap: {
    moments: Array<{
      location: { paragraph: number; sentence: number };
      momentType: 'emotional' | 'intellectual' | 'humorous' | 'subversive';
      description: string;
      intensity: number;
      arrows: Array<{
        source: { paragraph: number; sentence: number };
        mechanism: 'sensory_grounding' | 'emotional_setup' | 'stakes_establishment'
          | 'character_revelation' | 'thematic_preparation'
          | 'intellectual_scaffolding' | 'comedic_setup';
        contribution: string;           // What this source passage contributes
      }>;
      earned: boolean;                  // Derived: arrows.length >= threshold for momentType
      gap: string | null;               // If unearned: what is missing
    }>;
  };
  thematicArchitecture: {
    centralThesis: string;
    thesisConfidence: number;
    thesisEvolution: string;
    threads: Array<{
      thread: string;
      introducedAt: { paragraph: number; sentence: number };
      appearances: Array<{ paragraph: number; sentence: number }>;
      strength: 'dominant' | 'supporting' | 'hinted' | 'dropped';
    }>;
    subtext: string;
    contradictions: string[];
  };
  narrativeStrategy: {
    primaryStrategy: string;
    whyThisStructure: string;
    pivotPoints: Array<{ paragraph: number; sentence: number; description: string }>;
    pacingAnalysis: string;
    arcType: string;
    arcMomentum: 'building' | 'sustaining' | 'releasing' | 'stalling';
    turningPoint: { paragraph: number; sentence: number } | null;
  };
  characterRevelation: {
    whoIsThisWriter: string;
    valuesRevealed: string[];
    growthArc: string;
    blindSpots: string[];
    intellectualFingerprint: string;
    revealedQualities: string[];
  };
  craftAssessment: {
    sentenceLevelPatterns: string;
    wordChoiceProfile: string;
    imageSystem: string;
    // NOTE: strengthSignatures and growthEdges populated by L3.5 analysis, not here
  };
  admissionsPositioning: {
    tellabilitySummary: string;
    distinctivenessFactors: string[];
    institutionalFit: string;
    redFlags: string[];
    memorabilityAssessment: string;
    aoTakeaway: string;
  };
  crossDimensionEntanglements: Array<{
    dimensions: string[];               // e.g. ["voice", "theme"] or ["structure", "emotion", "character"]
    location: { paragraph: number; sentence: number };
    description: string;                // "P2S3's voice shift from concrete to reflective IS the thematic pivot"
    significance: 'foundational' | 'supporting' | 'subtle';
  }>;
}
```

**North Star preparation**: L3.75 produces the raw material L4 will synthesize. The thematic architecture's thread map, the connection graph's cross-paragraph links, the voice map's shift points, the earned-ness map's arrow network, the entanglements — L3.75 sees them all with the complete sentence-level understanding as evidence. L4's job is not to repeat this work but to synthesize across it, finding the architecture of meaning that no individual section articulates.

**Why a separate call instead of expanding `holisticEvolution`**: The walk's job is paragraph-level deep understanding with back-propagation. Asking it to ALSO synthesize essay-level voice maps, earned-ness networks, and cross-dimension entanglements splits its cognitive focus. A dedicated synthesis call reads all the sentence-level work and THINKS holistically — the same principle behind separating L3 and L3.5.

**Why this produces better holistic sections**: During the walk, the LLM only sees P1-P3 when synthesizing after P3's walk step. The holistic synthesis sees EVERYTHING — every sentence's purpose, every connection, the complete narrative arc. Its earned-ness map traces arrows from P5's payoff back to P1's setup. Its voice map identifies intentional variation because it sees both the shift and the structural reason for it. Its entanglements identify voice-theme intersections because it holds both dimensions simultaneously.

**Cost**: ~$0.03-0.05 (single Sonnet call with prompt-cached understanding profile, larger output than before due to voice map + earned-ness map)
**Timing**: Runs AFTER L3 walk completes, BEFORE L3.5 analysis pass. L3.5 analysis then has both complete sentence-level understanding AND complete holistic understanding (including voice map and earned-ness map) as context.

---

### Layer 4: Crystallization (Sonnet x 1) — NORTH STAR + SCORING + COHERENCE

**File**: `src/services/essayIntelligence/analysis/crystallizer.ts` (exists, needs substantial rewrite)

**This layer's purpose**: Synthesize the complete profile into three artifacts that no earlier layer produces — the Essay North Star (architecture of meaning), the Paragraph Score Matrix (per-paragraph multi-dimensional evaluation), and the Coherence Report (contradiction detection). L4 reads across ALL holistic sections, the connection graph, paragraph digests, the voice map, the earned-ness map, and entanglements to produce understanding that transcends any individual section.

**What the North Star IS**: The system's understanding of how an essay **means** — not what it says, not how well it says it, but the architecture by which individual moments compose into a unified act of self-revelation. Think of a conductor studying a symphony score: the conductor doesn't need the notes (sentence-level understanding) or tuning assessment (analysis layer). The conductor needs the interpretive vision — the first movement's theme reappears inverted in the fourth, and that inversion IS the emotional argument. The North Star is this kind of knowledge.

**What the North Star is NOT**: A summary. A summary is lossy compression — everything in it exists more deeply elsewhere. The North Star is an emergent property. The through-line map doesn't exist in the sentence-level understanding. The structural roles map doesn't exist in the paragraph analysis. You cannot derive the North Star by compressing; you can only produce it by synthesizing. If you deleted it, you would lose an interpretive synthesis that requires re-reading the entire profile holistically.

**North Star vs ProfileIndex**: The ProfileIndex is for machines — routing, token estimation, selective loading. The North Star is for meaning — it tells downstream consumers WHY a paragraph matters, not just WHAT it contains. Both exist. They serve different purposes.

**Input**: Profile Index + all holistic sections (voice identity, voice map, emotional topography, earned-ness map, thematic architecture, narrative strategy, character revelation, craft assessment, admissions positioning, cross-dimension entanglements) + paragraph digests from Profile Index (NOT full sentence maps — they're in the profile, not needed for crystallization) + connection graph summary.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached forever): System instructions — role as crystallizer, North Star dimensions with guidance (through-line traces meaning transformation not just appearance, structural roles identify necessity not topic, trajectory presents MULTIPLE plausible paths), scoring rubric for paragraph matrix, coherence checking rules. Includes examples of good vs bad North Star output (summary-like = bad, architecture-of-meaning = good).
- **Block 2** (essay-specific, cached): Full essay text + holistic synthesis output + paragraph digests + connection graph summary + voice map + earned-ness map + entanglements.
- **Block 3** (call-specific, not cached): "Crystallize the North Star, score each paragraph, and report any contradictions found in the profile."

**Scaled by essay type** (per review C4):
- **Supplements** (<250 words): Two dimensions — structural roles map (what this essay does in the portfolio) + distinctiveness signature. No through-line (too short for submersion/transformation). No trajectory (the essay is too focused). Intent bridge populated by L6 if conversation happens.
- **PIQs** (~350 words): Three dimensions — add through-line map. PIQs are long enough for a central element to surface, develop, and resolve.
- **Personal statements** (~650 words): Full five dimensions.

**Output**:
```typescript
interface CrystallizationOutput {
  northStar: EssayNorthStar;
  paragraphScoreMatrix: ParagraphScoreMatrix;
  coherenceReport: CoherenceReport;
}

interface EssayNorthStar {
  /** How many dimensions are populated depends on essay type */
  essayType: 'supplement' | 'piq' | 'personal_statement';

  /** Traces the central element's journey: where it surfaces, submerges, transforms, resolves.
   *  NOT "diamond appears in P1, P3, P5" (connection graph does that).
   *  IS "the diamond's MEANING transforms from commodity → inheritance → identity." */
  throughLineMap: {
    centralElement: string;
    journey: Array<{
      paragraph: number;
      sentence: number;
      meaningAtThisPoint: string;
      transformation: string | null;      // How meaning changed from previous appearance
    }>;
    overallArc: string;                   // The meaning transformation as a single statement
  } | null;                               // null for supplements

  /** What each section IS in the architecture of meaning — structural necessity, not topic.
   *  The pawnshop scene isn't "the opening" — it's the essay's frame of risk. */
  structuralRolesMap: Array<{
    paragraph: number;
    structuralRole: string;               // "frame of risk", "value system establishment", "fulcrum"
    whyNecessary: string;                 // What breaks if this section is removed
    significanceLevel: 'load-bearing' | 'connective' | 'fulcrum' | 'decorative';
  }>;

  /** Where the essay IS and where it COULD go. MULTIPLE plausible paths (per review S9).
   *  For works in progress: what the essay's momentum demands.
   *  For finished essays: what the strongest version of what's here looks like. */
  trajectory: {
    currentState: string;                 // Where the essay is now
    plausiblePaths: Array<{
      path: string;                       // "Resolve through direct confrontation with inherited values"
      supportLevel: 'strong' | 'moderate' | 'speculative';
      evidenceFromText: string;           // What in the current text supports this path
    }>;
    unrealizedConnections: Array<{        // Connections the student hasn't discovered yet
      description: string;
      paragraphs: number[];
    }>;
  } | null;                               // null for supplements

  /** What makes THIS essay non-interchangeable — the specific combination of experience,
   *  structural choice, and voice that could not have been written by anyone else.
   *  NOT "about family and imperfection" (describes thousands of essays).
   *  IS "uses pawnshop economics to dramatize the gap between market and inherited value." */
  distinctivenessSignature: {
    whatMakesItUnique: string;
    voiceContribution: string;            // How voice specifically contributes to distinctiveness
    structuralContribution: string;       // How structural choices contribute
    experienceContribution: string;       // How the specific experience contributes
  };

  /** Student's stated understanding alongside the system's. Populated by L6 conversation.
   *  Divergences are coaching opportunities, not problems. */
  intentBridge: {
    studentStatedIntent: string | null;   // null until L6 conversation
    systemReading: string;
    alignments: string[];                 // Where student and system agree
    divergences: string[];                // Where they differ — coaching fuel
    confirmedInsights: string[];          // Student confirmed the system's reading
  };

  /** Confidence and metadata */
  confidence: 'hypothesis' | 'emerging' | 'deep' | 'comprehensive';
  tokenEstimate: number;                  // For selective loading decisions
}

interface ParagraphScoreMatrix {
  paragraphs: Array<{
    index: number;
    scores: {
      effectiveness: number;              // 0-100, from L3.5 analysis
      structuralContribution: number;     // 0-100, how well it fulfills its structural role
      voiceConsistency: number;           // 0-100, relative to essay's dominant voice
      emotionalContribution: number;      // 0-100, emotional depth and earned-ness
      thematicRelevance: number;          // 0-100, contribution to through-line/themes
    };
    verdict: string;                      // Single-sentence assessment
    priorityForImprovement: number;       // 1-5, informed by structural role significance
  }>;
  crossParagraphPatterns: string[];       // "Emotional intensity builds linearly — consider a dip before climax"
  prioritizedImprovements: Array<{
    paragraph: number;
    improvement: string;
    whyThisMatters: string;               // References North Star structural roles
    expectedImpact: 'transformative' | 'significant' | 'incremental';
  }>;
}

interface CoherenceReport {
  contradictions: Array<{
    sectionA: string;                     // e.g. "thematicArchitecture.centralThesis"
    claimA: string;
    sectionB: string;
    claimB: string;
    severity: 'blocking' | 'notable' | 'minor';
    suggestedResolution: string;
  }>;
  isCoherent: boolean;                    // false if any blocking contradictions
}
```

**Token budget** (per review M1): The North Star should be ~500-800 tokens when fully populated (personal statement with all 5 dimensions). Supplements: ~200-300 tokens. PIQs: ~300-500 tokens. The ParagraphScoreMatrix and CoherenceReport add ~200-400 tokens. Total L4 output: ~700-1200 tokens.

**Selective loading rules for consumers**:
- **L5 annotations**: Through-line map + structural roles map (needed for "local symptom → structural consequence" transformation)
- **L6 coaching**: Through-line map + structural roles + intent bridge (needed for phase-aware coaching with significance awareness)
- **Edit interpretation**: Structural roles map only (needed to assess edit significance based on structural position)
- **Portfolio strategy**: Full North Star (needed for cross-essay composition)
- **Re-analysis brief**: Structural roles map + trajectory (per review C3 — what is structurally significant about the changed areas)

**The FULL EssayProfile is preserved separately** — the North Star is a lens into it, not a replacement. The North Star articulates something that NO individual profile section contains. It sees across the thematic architecture, the connection graph, the structural roles, and the character revelation, and articulates the single integrated understanding that ties them together.

**Cost**: ~$0.03-0.05 (single Sonnet call, prompt-cached holistic sections)
**Timing**: Runs AFTER L3.5 analysis pass completes (needs paragraph effectiveness scores for the score matrix). Runs in parallel with L5 if North Star is not yet needed — but L5 benefits significantly from North Star context, so sequential (L4 → L5) is preferred when budget allows.

---

### Layer 5: Deep Annotations (Sonnet, parallel) — PHASE-AWARE FEEDBACK WITH NORTH STAR CONTEXT

**File**: `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (exists, needs update)

**Input**: Profile Index (including `improvementPhase`) + full profile (Understanding + Analysis layers) + Essay North Star (structural roles map + through-line map)

This is where the **Feedback layer** is generated — NOT stored in the profile, delivered as annotation output. The annotations read the complete Understanding + Analysis AND the North Star to generate contextually appropriate suggestions **at the current improvement phase zoom level** with **structural significance awareness**.

**The North Star transformation**: Without the North Star, L5 looks at a paragraph and sees a local symptom: "telling rather than showing the grandfather's value system" → "Consider showing your grandfather's values through a specific action." With the North Star's structural roles map, L5 knows that this paragraph's structural role is to establish the value system that the fulcrum (paragraph 4) will test the student against. The annotation becomes: "Your grandfather's values need to be FELT by the reader before paragraph 4, where you almost trade them away. Right now we're told he chose the cloudy diamond — but we don't experience the weight of that choice. What if we SAW the moment he chose it? The reader needs to carry his choice in their body so that when you almost sell the ring, we feel what's at stake." The difference: the first addresses a local symptom, the second addresses the same symptom in terms of its structural consequences for the essay's architecture.

**Re-analysis brief integration**: When L5 runs during re-analysis (not first-time analysis), it receives the re-analysis brief alongside its normal inputs. The brief contains:
1. What changed (paragraph and sentence-level diffs)
2. Why it changed (student's stated intents from conversations, or "No conversation context")
3. Tentative assessments (light-touch adjustments, staleness flags)
4. **Structural significance** (per review C3): What is structurally important about the changed areas, populated from the North Star's structural roles map. "The changed sentence is in the fulcrum paragraph" or "This edit is in a transitional section with no through-line involvement."

This context allows L5 to generate annotations that acknowledge the student's intent ("You mentioned wanting the transition to feel less abrupt — here's how the new version works in that direction, and here's what it could still do to serve the essay's emotional arc").

**Phase-aware annotation generation**: The annotation prompt receives `improvementPhase` from the ProfileIndex and focuses feedback accordingly:

| Phase | Annotation Count | Focus | What's Surfaced |
|-------|-----------------|-------|-----------------|
| Foundation | 2-3 | Essay-level | Thesis clarity, arc coherence, structural problems |
| Architecture | 3-5 | Paragraph-level | Paragraph roles, transitions, pacing, show vs tell |
| Craft | 5-8 | Sentence-level | Sentence effectiveness, rhythm, opening/closing craft |
| Polish | 8-12 | Word/phrase-level | Specific word choices, image precision, verb strength |
| Distinction | 3-5 | Memorability | Voice uniqueness, what makes this unforgettable, the 1% |

**The key principle**: Analysis ALWAYS evaluates everything at every level. The improvement phase acts as a **filter** on which analysis findings become feedback. The system knows about the word-level issues in Foundation phase — it just doesn't surface them until the big-picture issues are resolved.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached forever): System instructions — role as annotation generator, phase-aware feedback rules, output schema, examples of North-Star-informed annotations vs generic annotations.
- **Block 2** (essay-specific, cached across all parallel L5 calls): Full essay text + complete understanding profile + analysis results + North Star (structural roles + through-line map) + re-analysis brief (if re-analysis).
- **Block 3** (call-specific, not cached): Target paragraph to annotate + improvement phase context:

```
IMPROVEMENT PHASE: ${phase.level}
Focus areas: ${phase.focusAreas.join(', ')}
Deferred areas: ${phase.deferredAreas.join(', ')}

NORTH STAR CONTEXT:
This paragraph's structural role: ${northStar.structuralRolesMap[paragraphIndex].structuralRole}
Significance: ${northStar.structuralRolesMap[paragraphIndex].significanceLevel}
Through-line involvement: ${throughLineInvolvement || 'None'}

Generate annotations ONLY for issues at the current phase level.
Frame each annotation in terms of its STRUCTURAL consequence — not just "fix this"
but "fix this because of what it means for the essay's architecture."

${phase.level === 'foundation' ? 'Focus on 2-3 essay-level observations. Do NOT surface sentence-level or word-level issues — those will be addressed after the foundation is solid.' : ''}
${phase.level === 'craft' ? 'Paragraphs are pulling weight. Focus on 5-8 sentence-level improvements. Be specific — cite the sentence, explain why it underperforms in its structural context, show a rewrite.' : ''}
${phase.level === 'distinction' ? 'This essay is polished. Focus on what will make an admissions officer REMEMBER this essay. The 1% that separates good from unforgettable.' : ''}
```

**Output**:
```typescript
interface AnnotationFeedback {
  /** Prescriptive: what the sentence SHOULD be doing in the essay's architecture */
  prescriptiveRole: string;
  /** Concrete improvement suggestions — framed with structural consequence */
  suggestions: string[];
  /** Example rewrite if needed */
  rewriteExample: string | null;
  /** Teaching framing — WHY this matters to the essay's architecture (not just "do this") */
  teachingRationale: string;
  /** Which improvement phase this annotation targets */
  phaseRelevance: ImprovementPhase['level'];
  /** Structural role context from North Star */
  structuralContext: string | null;
}
```

**Why feedback isn't stored**: If we stored P1S1's annotation feedback as `prescriptiveRole: "Ground the reader more deeply in physical sensation"`, and then the student asks the coach "How should I improve my opening?", the coach would either repeat the stored feedback (redundant) or generate fresh feedback that contradicts it (confusing). By keeping feedback ephemeral, every annotation and coaching turn generates feedback fresh from Understanding + Analysis + North Star, appropriate to the current context and improvement phase.

**Cost**: ~$0.02-0.03 per paragraph x 5 paragraphs = ~$0.08-0.15 (parallel, fast)
**Prompt caching**: Essay + understanding profile + North Star cached → ~75% input token savings across parallel calls
**Timing**: Runs AFTER L4 crystallization completes (needs North Star context). All paragraphs annotated in PARALLEL since all context is complete.

---

### Layer 6: Conversation-Driven Deepening (ongoing) — INSIGHT EXTRACTION + PHASE-AWARE COACHING + PROFILE DEEPENING

**File**: `src/services/essayIntelligence/coachingService.ts` (to be built, ~400 lines)

**This layer's purpose**: L6 is the only layer where information flows INWARD — the student tells us something the text alone could never reveal. Every other layer reads the essay and builds understanding outward. When a student says "actually, the diamond is about my grandfather — he always said flawed things are more interesting," that statement is authoritative in a way no inference can be. L6 extracts these insights, deepens the profile, and generates phase-aware coaching responses with structural significance awareness.

**Input (always loaded)**: Profile Index (including `improvementPhase`), North Star. Relevant profile sections loaded based on focus detection.

**The L6 Pipeline** has five stages per student message:

**Stage 1 — Insight Extraction + Focus Detection (Haiku, single call)**

Every student message is classified in a single Haiku call that produces two outputs simultaneously (per review S2):

*Output A — Insight Classification* (8 primary categories):
- **Confirmation** — "Yes, that's exactly what I meant" → boosts confidence in existing understanding
- **Reinterpretation** — "Actually, it's more about my grandfather" → replaces inferredIntents, triggers cascade check
- **New context** — "I also volunteer at a food bank" → adds new understanding
- **Correction** — "No, that sentence isn't about fear" → negates existing understanding, lowers confidence
- **Preference** — "I like the shorter version better" → records stylistic preference
- **Clarification** — "What I meant was..." → refines existing understanding
- **Emotional reaction** — "That paragraph makes me cringe" → signal about the student's relationship to their own writing
- **Resistance** — "I know the transition is abrupt, but I want it that way" → artistic intent assertion, probe for reasoning

Secondary attributes (modulate nuance): emotional valence (-1 to 1), confidence level (0-1), explicitness (explicit/implicit/ambiguous), scope certainty (0-1), novelty (novel/refinement/repetition). A single statement is captured as "reinterpretation, with strong emotional investment, high confidence, affecting essay-level understanding."

*Output B — Focus Detection* (what the student is asking about):
- Which paragraph(s)/sentence(s) are relevant
- What dimension(s) the question touches (voice, structure, emotion, theme, etc.)
- Whether this is a coaching question, a revision discussion, or a meta-conversation

*Scope detection*: Treated as a probability distribution, not a point estimate. "I like the ending" has high probability for the last paragraph, moderate for the last 2-3 sentences. Resolution comes from immediate context (did the coach just ask about a specific sentence?) and natural follow-up probing. Multi-scope insights are supported — "I wrote the first and last paragraphs together" creates a cross-paragraph connection.

**Stage 2 — Context Routing (Profile Router, no LLM call)**

Based on focus detection output, the Profile Router selects relevant profile sections:
- Always: Profile Index + North Star (structural roles relevant to the focused area)
- If coaching question: Understanding + Analysis for focused paragraph(s) + relevant holistic sections
- If revision discussion: Focused paragraph understanding + earned-ness map arrows involving that paragraph + voice map entries for that area
- If meta-conversation: Conversation insight history + improvement phase context
- Connection-guided loading: If the focused sentence has connections to other sentences, load those sentences' understanding too

**Stage 3 — Coaching Response Generation (Sonnet)**

Generates a phase-aware coaching response with full structural significance awareness:

```
The student is in the ${phase.level} improvement phase.
${phase.reasoning}

NORTH STAR CONTEXT:
${relevantNorthStarSections}

When they ask for general improvement advice, focus on: ${phase.focusAreas.join(', ')}.
Acknowledge but defer: ${phase.deferredAreas.join(', ')}.

If they specifically ask about a deferred area (e.g., word choice in Foundation phase),
give a brief, honest answer but redirect to what matters most right now.
Frame improvement advice in terms of structural consequence — not just "fix this"
but "fix this because of how it serves the essay's architecture."
```

Phase-aware zoom:
- Foundation phase student asks "how do I improve?" → coach focuses on thesis and structure, NOT word choice
- Craft phase student asks "how do I improve?" → coach focuses on specific sentence rewrites
- Polish phase student asks about a word → coach gives deep word-level guidance because that's WHERE the student is
- The coach can acknowledge lower-level issues exist ("Your word choices are mostly strong — we'll fine-tune those once the paragraph structure is solid") without diving into them. Motivating, not dismissive.

**Stage 4 — Profile Deepening (conditional, category-dependent)**

Each insight category maps to specific Profile Manager behavior:

| Category | Model | Profile Action |
|----------|-------|---------------|
| Confirmation | Haiku (or none) | Boost confidence on targeted understanding. No structural change. |
| Reinterpretation | Sonnet | Replace `inferredIntents` on targeted sentences. Trigger cascade check — may invalidate related holistic sections, earned-ness arrows, entanglements. Flag stale sections for next synthesis pass. |
| New context | Sonnet | Add new understanding. May affect narrative strategy, character revelation, North Star trajectory. |
| Correction | Haiku | Negate targeted understanding, lower confidence on related inferences. |
| Preference | None | Record in conversation insights. Inform future coaching tone. |
| Clarification | Haiku | Refine targeted understanding without replacing it. |
| Emotional reaction | Haiku | Record as meta-insight. May inform earned-ness map (student feels cringe → possible inauthenticity signal). |
| Resistance | Haiku | Record artistic intent. Suppress the system's suggestion on that element. Probe for reasoning in next coaching turn. |

**Partial supersession**: Insights can partially update prior insights. "Yes, it's about imperfection, but specifically how imperfection makes things MORE valuable" — the core insight (imperfection) is confirmed while the framing (negative vs positive) is revised. The system marks the original as partially superseded, preserving confirmed portions.

**Pattern detection**: Over a session, meta-insights emerge from sequences of statements. A student who keeps returning to paragraph 3 but never mentions paragraph 2. A student who agrees with feedback but never implements it. These patterns are stored separately so they inform coaching strategy without polluting the essay profile.

**Stage 5 — Phase Re-check (conditional)**

If a `reinterpretation` or `new_context` insight changes the analysis landscape enough to shift the improvement phase (e.g., student reveals the thesis is actually about X, which resolves the "unclear thesis" concern → Foundation → Architecture), update `improvementPhase` in ProfileIndex. Subsequent coaching turns use the new zoom level.

**Cross-session durability**: Each insight gets a durability level inferred from scope and category:
- **Ephemeral** — tied to specific text, invalidated by edits ("I chose 'stumbled' deliberately")
- **Draft-durable** — survives minor edits, invalidated by structural rewrites
- **Essay-durable** — persists as long as this essay is being worked on
- **Student-durable** — persists across all essays ("I'm a perfectionist and that's part of what I'm writing about")

Student-durable insights are stored in a separate `student_insights` table (per review C1), not in the essay-specific conversation insights. The re-analysis brief pulls from both essay-level and student-level insight stores.

**Portfolio intent** (per review M7): When a student references another essay ("I want my Common App to complement my Stanford supplement"), the insight is categorized as `portfolio_intent` and routed to the portfolio intelligence layer. L6 does not resolve cross-essay questions itself — it captures the signal and routes it.

**Integration with Conversational Edit Workshop**: When the student edits during conversation (Pathway 1 from the version-based re-analysis design), insight extraction captures both what they SAID and what they DID. The edit understanding pipeline feeds L6 its reading of the change, and the coach can respond: "I noticed you changed 'decided' to 'couldn't' — that shifts the moment from a rational choice to something deeper. Tell me more about what you're going for." The student's response becomes an insight that enriches both the version record and the essay profile.

**Prompt structure** (3-block caching):
- **Block 1** (static, cached across entire coaching session): System instructions — coaching philosophy, phase-aware zoom rules, insight extraction taxonomy, North Star usage guidance, examples of good coaching responses at each phase.
- **Block 2** (session-specific, cached across turns within session): Essay text + Profile Index + North Star + relevant profile sections (updated by Profile Router each turn). Profile sections are re-rendered when the focus shifts to a different area.
- **Block 3** (turn-specific, not cached): Conversation history (last 8-12 messages for continuity) + current student message + Haiku's focus detection and insight classification output.

**Output per turn**:
```typescript
interface CoachingTurnOutput {
  /** The coaching response to display to the student */
  response: string;

  /** Extracted insight, if the student revealed something new */
  insight: {
    category: 'confirmation' | 'reinterpretation' | 'new_context' | 'correction'
      | 'preference' | 'clarification' | 'emotional_reaction' | 'resistance';
    content: string;
    scope: {
      paragraphs: number[];
      sentences: number[];
      holistic: boolean;                  // Affects essay-level understanding
    };
    scopeCertainty: number;               // 0-1
    secondaryAttributes: {
      emotionalValence: number;           // -1 to 1
      confidence: number;                 // 0-1
      explicitness: 'explicit' | 'implicit' | 'ambiguous';
      novelty: 'novel' | 'refinement' | 'repetition';
    };
    durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';
    supersedes: string | null;            // ID of prior insight this partially/fully replaces
  } | null;

  /** Profile update instructions for the Profile Manager */
  profileUpdates: Array<{
    target: string;                       // e.g. "paragraphs[2].sentences[3].understanding.inferredIntents"
    action: 'replace' | 'boost_confidence' | 'lower_confidence' | 'add' | 'flag_stale';
    value: unknown;
    cascadeCheck: boolean;                // Should the Profile Manager check for downstream staleness?
  }> | null;

  /** Focus detection result (for logging and Profile Router) */
  focusDetection: {
    paragraphs: number[];
    sentences: number[];
    dimensions: string[];
    conversationType: 'coaching' | 'revision' | 'meta';
  };

  /** Pattern detection, if a meta-insight emerged from the conversation sequence */
  patternDetection: {
    pattern: string;
    evidence: string;
    coachingImplication: string;
  } | null;
}
```

**Cost per turn**: ~$0.01-0.03 total
- Haiku focus detection + insight classification: ~$0.001-0.003 (single call, small prompt)
- Sonnet coaching response: ~$0.01-0.02 (prompt-cached essay + profile, only conversation history is new)
- Sonnet profile deepening (for reinterpretation/new_context only): ~$0.01-0.02 (only runs when insight requires Sonnet-level updating)
- Most turns: Haiku classification + Sonnet response = ~$0.01-0.02. Profile deepening is occasional.

**Cost per session** (estimated 15-25 turns): ~$0.15-0.50, depending on how many reinterpretation/new_context insights trigger Sonnet profile updates. Prompt caching across turns provides ~60-70% savings on the essay + profile context.
