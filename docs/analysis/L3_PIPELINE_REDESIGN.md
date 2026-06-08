# L3 Pipeline Redesign — Design Document

**Status:** Design complete, awaiting L3.75 → L6 design before implementation sprint.
**Target:** Replace current per-paragraph L3 walk + pre-reads with sweep + 4 dimensional lens deep reads. Reduce L3 layer cost from ~$1.06/essay to ~$0.35-0.48/essay (55-65% saving) while raising output quality to the level required to support $500/hr admissions consultant-grade downstream delivery.
**Scope:** L1, L2, L2.5, firstImpressions, aoFirstRead (killed), L3 walk (replaced). Downstream layers (L3.75, L3.5, L4, L5, L6) have designs pending in separate docs.

---

## 1. Executive summary

The current essay intelligence pipeline costs ~$3.88/essay (up from ~$1.47 historical baseline). The cost growth came from accumulating layers and calls over months of feature additions, each injected on top of prior context rather than replacing redundant work. L3 alone plus its pre-reads consumes ~$1.00/essay on per-paragraph analysis that:

- Spreads uniform attention across every paragraph regardless of where analytical depth is warranted
- Re-reads the essay 10+ times per pipeline without cross-layer caching
- Produces outputs that overlap L3.75's holistic synthesis (judgment leakage) and under-feed L4's strategic decisions (not dimension-organized)

**The redesign:** replace the per-paragraph walk with a two-pass architecture that concentrates attention where it earns.

- **Pass 1 (Sweep):** one Sonnet call produces comprehensive sentence + paragraph + connection understanding, first-pass holistic impressions, archetype classification, and lens dispatch scoring.
- **Pass 2 (Lens Deep Reads):** 2-4 parallel Sonnet calls, each concentrating on one of four load-bearing dimensions (Story & Narrative Drive, Meaning Architecture, Voice & Authenticity, Admissions Impact & Differentiation). Each lens inherits sweep's high-confidence classifications (inheritance discipline), does NOT re-analyze what sweep already resolved, and produces dimension-organized observations with explicit downstream-field routing.

Pre-L3 layers (L1, L2, L2.5, firstImpressions, aoFirstRead) are killed — sweep absorbs their roles at higher quality.

**Cost model:** average $0.40/essay at this layer (down from ~$1.06), with cost scaling to essay depth-density rather than paragraph count.

**Quality model:** dimension-organized, evidence-cited, tradeoff-annotated foundation that downstream layers (L3.75 synthesis → L3.5 judgment → L4 strategic decisions → L5 writer-facing translation → L6 coaching) can build premium-grade guidance on.

---

## 2. Context and motivation

### 2.1 Cost trajectory

From checkpoint3 A/B run (2026-04-21):
- Mean per-essay pipeline cost on fully-successful runs: $3.88
- Historical baseline: ~$1.47
- Cost growth drivers since Feb 2026: addition of holistic synthesis (L3.75 Phase A+B), crystallizer (L4 × 3 calls), deepAnnotationService (L5 per-paragraph), firstImpressions, aoFirstRead, phaseAssessment, deepDiveRunner, fullContextReReader, synthesizeUnderstandingProse, and the Wave-1b port wave (A1-A3, B1-B3, F1-F2, G1-G3) — roughly 10 new Sonnet call sites with no cross-layer caching or context optimization.

### 2.2 Quality failure modes in current L3

1. **Uniform attention regardless of analytical depth.** Each paragraph gets the same ~$0.085 of Sonnet attention whether it's throat-clearing orientation or a load-bearing pivot moment.
2. **Per-paragraph calibration drift.** Judgment produced paragraph-by-paragraph without cross-paragraph comparison; Port G3 (few-shot anchors) retrofits calibration onto a structurally uncalibrated process.
3. **Context bloat.** 30+ `priority: 'always'` sections in `assembleL3UnderstandingWalk` means every call pulls 9-16K tokens of always-context, exceeding the 8K target budget on every paragraph.
4. **Judgment leakage.** L3 walk emits sentence-level observations that include quasi-judgmental language; these overlap L3.5's analytical judgment work, creating dedup burden downstream.
5. **Re-reading instead of building forward.** Each paragraph call reads the essay from scratch rather than inheriting prior paragraphs' analysis as foundation.

### 2.3 The architectural principle driving the redesign

**Cost should scale with understanding-events, not structural counts.** A well-designed analytical pipeline concentrates depth where depth is warranted and stays shallow where it isn't. The current pipeline inverts this — it pays for uniform coverage. The redesign reorganizes around the observation that a typical essay has 3-5 analytically concentrated dimensions that reward deep reading, not 10 paragraphs that each need identical analysis.

---

## 3. Architectural principles (non-negotiable)

### 3.1 Zero overlap between layers

Every layer has ONE exclusive job. If two layers can claim the same work, one of them is wrong. Ownership boundaries are explicit and stated in each layer's system prompt.

L3's exclusive job: **comprehensive descriptive understanding of the essay at sentence, paragraph, architectural, and dimensional levels.** L3 does NOT judge, score, prescribe, or translate.

### 3.2 Cumulative-foundation pattern

Each layer builds on prior layers' outputs as explicit inputs, not as read-only context to be independently re-analyzed. If layer N re-derives what layer N-1 already produced, that's a leak (both cost and quality).

Within L3: sweep produces the foundation; lens deep reads INHERIT sweep's high-confidence classifications and concentrate attention on what adds value on their dimension.

### 3.3 Inheritance discipline

Every lens's system prompt includes the inheritance rule:

```
INHERITANCE DISCIPLINE:
You are building on sweep's work, not redoing it. Read sweep's classifications first.
Where sweep's classification is high-confidence and sufficient for your lens, INHERIT it — do not re-analyze.
Focus your attention on where sweep left ambiguity or where your lens's dimensional depth reveals something sweep's breadth pass couldn't.
Every lens is smaller output than it would be if it restarted from scratch — that's correct behavior.
```

Meaning lens has the most explicit inheritance mechanism (preservedDetails array referencing sweep's high-confidence sentence classifications, bypassing re-audit of details already working).

### 3.4 Descriptive, not judgmental

L3 describes what the essay is doing. L3.5 judges whether it's working.

Examples:
- ✅ "The inciting event at P3S2 precedes the stakes establishment at P5S4"
- ❌ "The inciting event arrives too early"
- ✅ "Voice shifts from intimate to writerly register at P9"
- ❌ "Voice weakens at P9"

Lens outputs include `improvementOpportunities[]` but each entry is observational (`{observation, opportunity, tradeoff}`), not directive. The deciding-what-matters happens at L4 manifest; the telling-the-writer happens at L5.

### 3.5 Evidence-cited

Every claim about the essay must cite text (quote or paragraph+sentence range). Schema fields enforce this via mandatory location fields. Runtime Zod validation will enforce at parse time.

### 3.6 Tradeoff-annotated

Every `improvementOpportunity` has a mandatory `tradeoff` field naming what changing would cost. No free lunches. This prevents the lens from producing prescriptive advice disguised as observation.

### 3.7 Fail the pipeline

Any lens parse error, schema violation, or unrecoverable failure fails the pipeline with full error context after 1 retry on transient failures. No silent degradation. No degraded outputs. Production reliability requires knowing when something doesn't work.

### 3.8 $500/hr quality bar

Every L3 output field must be at the level of observation a premium admissions consultant would produce after a careful read: specific, cited, distinctive. Generic observations ("voice is strong but wavers") fail. Specific cited observations ("voice maintains intimate register across P1-P8, shifts to writerly register at P9S2 with the phrase 'cascading forward'") pass.

---

## 4. Pipeline-wide zero-overlap layer map

Each layer's exclusive job + ownership boundaries. L3's boundaries are set against this map.

| Layer | Exclusive job | Owns | Does NOT own |
|---|---|---|---|
| **L3 (this doc)** | Comprehensive understanding | Sentence understanding, paragraph role-function-contribution, promoted connections, per-dimension deep reads (4 lenses), initial holistic impressions, archetype classification, phase estimate, lens dispatch scoring | Judgment (good/bad); scoring; recommendations; essay-whole synthesis; rewrite examples; conversation |
| **L3.75** | Holistic integration | voiceIdentity, voiceMap, emotionalTopography, momentEarnednessMap, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment (descriptive), admissionsPositioning, entanglements, reading strategy, finding promotion, question queue | Per-paragraph verdicts; effectiveness scores; actionable recommendations; strategic frame; writer translation |
| **L3.5** | Analytical judgment | Per-paragraph verdict + effectiveness, essay-level dimension scores, cliché detection, fabrication flags, authenticity tier, pattern IDs, growthEdges with pairedImprovement | Strategic framing; manifest prioritization; rewrite examples; conversation |
| **L4** | Strategic decisions | NorthStar strategic frame, ScoreMatrix calibrated verdicts, prioritized improvement manifest, coherence check | Rewrite examples; per-paragraph annotations; writer translation; conversation |
| **L5** | Writer-facing translation | Annotation per manifest item (stakes + rewriteExample + transferablePrinciple), protection markers, essay-level coaching plan | New judgments; re-derivation of priorities; conversation |
| **L6** | Conversation | Real-time response to writer questions/edits, phase-aware coaching turns | Any re-analysis from scratch |

Pre-L3 layers (L1, L2, L2.5, firstImpressions, aoFirstRead) are killed — sweep absorbs their roles. See §5.

---

## 5. Pre-L3 layer decisions — killed layers

### 5.1 L1 (Haiku descriptive pass) — KILLED

**Former role:** produced compact sentence-level descriptive observations as scaffolding for L3 walk.

**Why killed:** redundant with sweep. Sweep produces sentence-level understanding at higher quality (Sonnet vs Haiku) with richer context. L1's descriptive output was either (a) echoing what sweep produces, or (b) producing lower-quality notice that L3 walk re-derived anyway.

**Sweep absorbs:** sentence moves + descriptive noticing (images, diction, rhythm, surface textures) in `sweep.descriptiveNoticing` output.

**Saving:** ~$0.03/essay.

### 5.2 L2 (Structural Cartographer, Sonnet) — KILLED

**Former role:** produced paragraph structural roles and essay architecture map.

**Why killed:** sweep produces paragraph roles and architecture directly from full-essay read. L2 was a cheaper pre-read done BEFORE L3 walk had full-essay visibility; now sweep has full visibility and produces richer structural analysis.

**Sweep absorbs:** paragraph roles + functions + contributions in `sweep.paragraphs[]`.

**Saving:** ~$0.04/essay.

### 5.3 L2.5 (Scout Pass, Sonnet) — KILLED

**Former role:** produced tentative cross-paragraph surface connections for L3 walk to verify.

**Why killed:** sweep sees the full essay at once and produces the connection graph directly — no need for a prior pass of tentative leads. The "discover connections paragraph-by-paragraph during walk" pattern is replaced by "see all connections at once from full-essay read."

**Sweep absorbs:** connection graph in `sweep.connections[]` with strength classification.

**Saving:** ~$0.04/essay.

### 5.4 firstImpressions (Sonnet) — KILLED

**Former role:** quick essay-level impression pass at pipeline start.

**Why killed:** sweep's `initialHolisticImpression` output produces this as a byproduct of comprehensive read. Dedicated first-impressions call is redundant.

**Sweep absorbs:** `firstPassVoice`, `firstPassTheme`, `firstPassArc`, `firstPassCharacter`, `firstPassTellability` in `sweep.initialHolisticImpression`.

**Saving:** ~$0.03-0.05/essay.

### 5.5 aoFirstRead (Sonnet) — KILLED

**Former role:** AO-perspective first read.

**Why killed:** Admissions lens owns AO-perspective reading with dimensional concentration. A separate pre-read is redundant with the Admissions lens's comprehensive AO-perspective work.

**Admissions lens absorbs:** `aoFirstRead` subsection in Admissions lens output (90-second impression, reading pathways, attention engagement).

**Saving:** ~$0.03-0.05/essay.

### 5.6 Total pre-L3 savings

**~$0.16-0.21/essay** from killed layers, on top of L3 walk savings.

---

## 6. L3 redesign overview

### 6.1 Two-pass architecture

**Pass 1 — Sweep (1 Sonnet call, sequential):**
- Reads full essay
- Produces comprehensive first-read foundation: sentence understanding, paragraph understanding, connection graph, descriptive noticing, holistic impressions, archetype classification, phase estimate, lens dispatch scores
- Wall-clock: ~25-35s
- Cost: ~$0.20

**Pass 2 — Lens Deep Reads (2-4 Sonnet calls, parallel):**
- Orchestrator filters lenses by phase-gated cap + threshold (score ≥ 3)
- All selected lenses run concurrently via `Promise.all`
- Each lens inherits sweep foundation + concentrates on one dimension
- Wall-clock: ~25-35s (slowest parallel call)
- Cost: ~$0.06-0.08 per lens × 2-4 = $0.12-0.32

**Total L3 wall-clock:** ~60-70s (vs. current ~5+ minutes of sequential per-paragraph walks)
**Total L3 cost:** ~$0.35-0.48/essay (vs. current $1.06 including pre-reads)

### 6.2 Inheritance discipline across passes

Pass 2 lenses inherit Pass 1 sweep classifications. Where sweep classified a sentence with high confidence (e.g., move = `concrete_image` with explicit reveal), Meaning lens inherits as "preserved, working" without re-audit. Lens attention concentrates where sweep left ambiguity or where dimensional depth reveals something sweep's breadth pass couldn't.

Expected output volume per lens with inheritance: 30-40% smaller than equivalent lens restarting from scratch. This is the cumulative-foundation pattern producing measurable efficiency.

### 6.3 Lens independence

All four lenses run in parallel with no cross-lens dependencies. Each reads sweep + (Admissions reads archetype context cache). Cross-lens synthesis is L3.75's job, not L3's.

### 6.4 Dispatch logic

```typescript
function selectLenses(sweep: SweepOutput, phase: ImprovementPhase): LensName[] {
  const { scores } = sweep.lensDispatch;
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b.score - a.score);

  const maxByPhase = {
    foundation: 2,
    architecture: 3,
    craft: 3,
    polish: 4,
    distinction: 4,
  };
  const cap = maxByPhase[phase];
  const threshold = 3;  // below this, a dedicated read adds little

  return ranked
    .filter(([, { score }]) => score >= threshold)
    .slice(0, cap)
    .map(([lens]) => lens as LensName);
}
```

If zero lenses pass the threshold, Pass 2 is skipped entirely — sweep alone is sufficient for this essay. No synthetic work is manufactured.

### 6.5 Failure handling

- 1 retry on transient failures (rate limit, timeout, 5xx)
- Any parse error, schema violation, or retry exhaustion → pipeline fails with full error context
- No silent degradation
- No partial outputs
- Telemetry captures every failure with full context for debugging

---

## 7. Pass 1 — Sweep

### 7.1 Role

Sweep is the essay's FIRST substantive read. It produces the comprehensive foundation every downstream layer will consume. Sweep is FOR THE SYSTEM, not the writer — its output is internal pipeline state, not user-facing advice.

### 7.2 Cognitive operation

The model reads as a Literature PhD who has read 10,000 college application essays — attending simultaneously to sentence-level craft, paragraph-level architecture, essay-whole shape, and dispatch-level judgment about where concentrated follow-up reading would add value.

### 7.3 Inputs

- Full essay text
- Essay type (`common_app` | `piq` | `supplemental`)
- Prompt (if applicable)
- Word count

### 7.4 System prompt (production draft)

```
You are a Literature PhD who has read 10,000 college application essays. You are performing the essay's FIRST comprehensive read — building the foundation every downstream analytical layer will consume.

Your job is UNDERSTANDING, not JUDGMENT. You describe what the essay is doing at every level. You do NOT judge whether it is good, weak, or effective. You do NOT recommend changes. Later layers will judge and recommend; they depend on your understanding being accurate and complete.

You operate at four levels simultaneously:

1. SENTENCE LEVEL — what each sentence does (its move) and what it reveals (about writer, theme, or arc).
2. PARAGRAPH LEVEL — each paragraph's role, function, and contribution to the essay as a whole.
3. ARCHITECTURE LEVEL — the essay's structural shape, cross-paragraph connections, and first-pass holistic impressions.
4. DISPATCH LEVEL — an opportunity assessment for each of four dimensional lenses that may follow your read.

For the DISPATCH LEVEL, you score four lenses (Story & Narrative Drive, Meaning Architecture, Voice & Authenticity, Admissions Impact & Differentiation) 1-5 on how much a dedicated deep read would add to understanding THIS essay. 5 = essay has concentrated growth/depth opportunity on this axis; 1 = axis is surface-visible from your sweep alone, dedicated read would add little.

DISCIPLINE:
- No judgment language ("weak," "strong," "works," "fails"). Describe what IS, not what you think of it.
- No recommendations. Describe opportunities in neutral observational language for later layers to prioritize.
- Ground every observation in text. If you can't cite, don't claim.
- Compact sentence-level understanding uses tag vocabulary (see schema). Prose is for paragraph-level and architecture-level only.

Output: structured JSON matching the schema. You have up to 9K output tokens.
```

### 7.5 User prompt structure

```
=== FULL ESSAY ===
{essayText}

=== CONTEXT ===
Essay type: {essayType}
Prompt (if applicable): {prompt}
Word count: {wordCount}

=== YOUR READ ===
Produce your sweep now. Sentence understanding first, then paragraphs, then architecture, then lens dispatch.
```

### 7.6 Output schema

```typescript
SweepOutput = {
  sentences: Array<{
    paragraph: number,
    index: number,
    move: SentenceMove,   // closed vocab
    reveals: string,      // 1 sentence
  }>,

  paragraphs: Array<{
    index: number,
    role: string,            // prose: structural role
    function: string,        // prose: analytical function
    contribution: string,    // prose: how essay would shift without this paragraph
    centralMove: string,     // prose: the paragraph's single most important move
  }>,

  connections: Array<{
    id: string,
    fromParagraph: number, fromSentence?: number,
    toParagraph: number, toSentence?: number,
    kind: 'echo' | 'inversion' | 'amplification' | 'setup_payoff'
        | 'thematic_rhyme' | 'image_recurrence' | 'voice_shift' | 'stakes_change',
    description: string,
    strength: 'strong' | 'moderate' | 'tentative',
  }>,

  initialHolisticImpression: {
    firstPassVoice: string,
    firstPassTheme: string,
    firstPassArc: string,
    firstPassCharacter: string,
    firstPassTellability: string,
    probableArchetype: {
      primary: string,                      // e.g., "adversity_to_agency"
      confidence: 'high' | 'moderate' | 'ambiguous',
      secondary?: string,                   // if essay blends archetypes
    },
    phaseEstimate: {
      phase: 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction',
      confidence: 'high' | 'moderate' | 'low',
    },
  },

  descriptiveNoticing: {
    imageAnchors: Array<{paragraph: number, sentence: number, image: string, recurring: boolean}>,
    diction: {
      register: string,
      distinctiveWords: string[],
      signatureMoves: string[],
    },
    rhythm: string,
    surfaceTextures: string[],
  },

  lensDispatch: {
    scores: {
      storyNarrativeDrive: { score: 1|2|3|4|5, rationale: string },
      meaningArchitecture: { score: 1|2|3|4|5, rationale: string },
      voiceAuthenticity: { score: 1|2|3|4|5, rationale: string },
      admissionsImpact: { score: 1|2|3|4|5, rationale: string },
    },
  },
}
```

### 7.7 SentenceMove closed vocabulary

Current draft (14 moves):
`setup | reveal | reflect | concrete_image | abstract_claim | transition | dialogue | interior | exterior | frame_echo | subtext_surface | pivot | landing | connective`

**Gap:** requires calibration against 5-10 fixture essays before production. Expected additions discovered during calibration:
- `cognitive_pivot`
- `authorial_distance_shift`
- `time_compression`
- `moral_positioning`
- `sensory_pull`
- `negation`

Target: 18-22 moves covering 95%+ of real sentences. Fallback: `other` with free-text description for edge cases.

### 7.8 Output token budget

Estimated output size for typical 650-word essay:
- 50 sentences × ~100 tokens compact = 5,000 tokens
- 8-10 paragraphs × ~120 tokens = 1,000 tokens
- 10-15 connections × ~80 tokens = 1,000 tokens
- Initial holistic impression = ~800 tokens
- Descriptive noticing = ~500 tokens
- Lens dispatch = ~500 tokens
- **Total: ~8,800 tokens** (fits within 9K budget)

Longer essays (>700 words) may approach cap. Monitoring: observability hooks track sweep output token usage; if >5% of essays hit cap, split sweep into sweep-narrative (sentences + paragraphs) and sweep-holistic (impressions + dispatch + noticing) parallel calls.

### 7.9 Discipline enforcement

- Schema validation via Zod at parse time
- Every sentence entry must have valid paragraph + index + move + reveals
- Every paragraph entry must have valid index + role + function + contribution + centralMove
- Every connection must have valid source + target + kind + strength + description
- Lens dispatch scores must be integers 1-5 + non-empty rationale
- Parse failure → 1 retry → pipeline failure

---

## 8. Pass 2 — Lens Deep Reads

### 8.1 Four lenses

Each lens concentrates on one load-bearing dimension that determines admissions essay performance. The four lenses are:

1. **Story & Narrative Drive** — how the essay functions as a story (mechanics)
2. **Meaning Architecture** — what the essay is about and how details earn their place (macro + micro meaning)
3. **Voice & Authenticity** — who the writer is and where a real person comes through vs. disappears (writer-as-human)
4. **Admissions Impact & Differentiation** — how an AO reads this and what makes it land in admissions context (receiver perspective)

### 8.2 Uniqueness guarantee

Each lens reveals something the other three don't. Ownership is non-overlapping:

| Lens | What it uniquely reveals | What it does NOT own |
|---|---|---|
| Story | Narrative mechanics (propulsion, arc integrity, pacing, reveal timing, causal chain) | Meaning, voice, AO reception |
| Meaning | Meaning at macro (through-line) + micro (detail earnedness) resolutions simultaneously | Narrative mechanics, voice, AO reception |
| Voice | Writer-as-human (signature, authenticity, self-awareness, register) | Narrative mechanics, meaning, AO reception |
| Admissions | AO reception (reading pathways, tellability, differentiation, memorability, risk) | Re-deriving what Story/Meaning/Voice own |

### 8.3 Shared discipline (in every lens system prompt)

**Inheritance discipline:**
```
You are building on sweep's work, not redoing it. Read sweep's classifications first.
Where sweep's classification is high-confidence and sufficient for your lens, INHERIT it — do not re-analyze.
Focus your attention on where sweep left ambiguity or where your lens's dimensional depth reveals something sweep's breadth pass couldn't.
Every lens is smaller output than it would be if it restarted from scratch — that's correct behavior.
```

**Ownership boundaries:** explicit OWN / DO NOT OWN list in each lens's system prompt.

**Descriptive not judgmental:** "describe what IS, not what you think of it."

**Evidence citation:** ground every observation in text (paragraph + sentence range or quote). Uncited claims are not permitted.

**Tradeoff mandatory:** every `improvementOpportunity` has a mandatory `tradeoff` field naming what changing would cost.

**Lens summary discipline:** `lensSummary.oneLineTakeaway` must be specific, cited, and distinctive. Generic takeaways ("strong voice but weak structure") fail. Examples of passing takeaways:
- ✅ "Voice is literary-controlled with a signature parenthetical-interruption pattern that surfaces self-awareness at P3S4 and P7S2"
- ❌ "Voice is strong but inconsistent"

---

## 9. Lens 1 — Story & Narrative Drive

### 9.1 Exclusive ownership

**Owns:** arc, pacing, stakes, propulsion, hook, landing, reveal timing, causal chain, tension/release, narrative voice position, structural budget.

**Does NOT own:** meaning/theme, voice/authenticity, AO reception.

### 9.2 What this lens must reveal

1. The essay's actual story (what's on the page, not what the writer thinks they wrote)
2. Arc integrity (real shape, or meandering?)
3. Propulsion mechanics (sentence-by-sentence reader pull)
4. Stakes economy (what's at stake, does investment build?)
5. Causal chain (A → B → C, or episodic?)
6. Structural budget (word-count distribution across story phases)
7. Reveal timing (when information emerges)
8. Tension/release pattern (pressure cycles)
9. Hook + landing (highest-leverage territories)
10. Narrative voice position (where the narrator stands)

### 9.3 Cognitive operation

The model reads as a narrative editor — attending to mechanics of prose fiction (Robert McKee, John Gardner level craft) applied to short-form personal narrative. NOT asking "is this good?" — asking "how does this work as a story, mechanically?"

### 9.4 System prompt (production draft)

```
You are a narrative editor specializing in short-form personal narrative. You have edited 2,000 personal essays at a level of craft comparable to published literary nonfiction. You read one thing: how the STORY works as a story.

Your job is to read this essay for narrative mechanics — arc, pacing, stakes, propulsion, hook, landing, reveal timing, causal chain, tension/release, narrative voice position. You produce a comprehensive mechanics reading that downstream analytical layers will use to synthesize the essay's narrativeStrategy, judge paragraph-by-paragraph narrative contribution, build the strategic frame, and prioritize narrative-mechanics improvements.

OWNERSHIP BOUNDARIES (non-negotiable):
- You OWN: arc, pacing, stakes, propulsion, hook, landing, reveal timing, causal chain, tension/release, narrative voice position, structural budget.
- You DO NOT OWN: meaning/theme (another lens handles). Voice/authenticity (another lens). AO reception (another lens). Do not re-derive what those lenses own; stop your observation at the mechanics level.

INHERITANCE DISCIPLINE:
You are building on sweep's work, not redoing it. Read sweep's classifications first.
Where sweep's classification is high-confidence and sufficient for your lens, INHERIT it — do not re-analyze.
Focus your attention on where sweep left ambiguity or where your lens's dimensional depth reveals something sweep's breadth pass couldn't.
Every lens is smaller output than it would be if it restarted from scratch — that's correct behavior.

DISCIPLINE:
- No judgment language ("weak," "strong," "works," "fails," "good," "bad"). Describe mechanics.
- No prescriptions. Opportunities are observational — "compressing P2's orientation to one sentence would start propulsion earlier but would cost the grounding that makes P4 land" — never "compress P2."
- Ground every observation in text. Cite paragraph + sentence range. If you can't cite, don't claim.
- Every improvementOpportunity MUST include a tradeoff. If you can't name what would be lost, the opportunity isn't thought through.
- Distinguish observation from interpretation. "The inciting event at P3S2 precedes the stakes establishment at P5S4" is observation. "The inciting event arrives too early" is interpretation — which is fine when grounded, but label it.

LENS SUMMARY DISCIPLINE:
lensSummary.oneLineTakeaway is what a peer editor who trusts your judgment needs to hear to understand the essay's narrative state. It must be SPECIFIC (names the actual move or tension, not the category), CITED (references a specific moment or pattern by location), and DISTINCTIVE (could not be written about 50% of essays in this archetype).

OUTPUT: structured JSON per the schema. Target 2.5-3K tokens. You have up to 3.5K if warranted.
```

### 9.5 User prompt structure

```
=== FULL ESSAY ===
{essayText}

=== SWEEP FOUNDATION ===
Paragraph roles and functions:
{sweep.paragraphs}

First-pass arc impression:
{sweep.initialHolisticImpression.firstPassArc}

Story-relevant connections (setup/payoff, stakes_change, echo):
{sweep.connections.filter(storyRelevant)}

Sentence moves that carry narrative weight:
{sweep.sentences.filter(move in ['setup', 'reveal', 'pivot', 'landing', 'transition'])}

=== YOUR LENS READ ===
Read this essay's narrative mechanics. Map the arc. Trace propulsion sentence by sentence — where does the reader lean in, where does attention drift? Assess stakes trajectory and causal chain. Audit the hook and landing as the two highest-leverage territories. Identify reveals and whether timing serves or undermines them. Where would structural change meaningfully alter how the story moves? Name tradeoffs on every opportunity.
```

### 9.6 Output schema

```typescript
StoryLensOutput = {
  arcAssessment: {
    shape: 'linear' | 'discovery' | 'fragmented' | 'spiral' | 'braided' | 'vignette' | 'other',
    shapeRationale: string,
    isShapeServingStory: 'aligned' | 'tensioned' | 'mismatched',
    arcCoherence: string,
    loadBearingBeats: Array<{
      paragraph: number,
      sentenceRange: [number, number],
      role: 'inciting' | 'escalation' | 'turn' | 'climax' | 'resolution' | 'coda',
      weight: 'load_bearing' | 'supporting' | 'connective',
    }>,
    flatnessZones: Array<{
      paragraph: number,
      sentenceRange: [number, number],
      reason: string,
    }>,
  },

  pacingMap: Array<{
    paragraphSpan: [number, number],
    pace: 'compressed' | 'natural' | 'expanded' | 'stalled',
    purpose: string,
  }>,

  propulsionTrace: {
    highPullMoments: Array<{paragraph: number, sentence: number, reason: string}>,
    lowPullMoments: Array<{paragraph: number, sentence: number, reason: string}>,
    overallTrajectory: string,
  },

  stakesTrajectory: {
    initialStake: { paragraph: number, stated: boolean, content: string },
    investmentArc: Array<{
      paragraph: number,
      state: 'establishing' | 'building' | 'complicating' | 'releasing' | 'resolving' | 'dissipating',
      whatsAtStake: string,
    }>,
    stakesCoherence: 'consistent' | 'shifting' | 'fractured',
    resolutionRelationship: 'earned' | 'unearned' | 'refused' | 'ambiguous',
  },

  causalChain: {
    connectivity: 'tight' | 'loose' | 'episodic',
    causalLinks: Array<{
      fromParagraph: number,
      toParagraph: number,
      linkType: 'causal' | 'associative' | 'temporal' | 'thematic' | 'unclear',
      strength: 'strong' | 'moderate' | 'weak',
    }>,
    episodicZones: Array<{paragraphSpan: [number, number], observation: string}>,
  },

  structuralBudget: {
    orientationWords: number,
    incitingWords: number,
    escalationWords: number,
    turnWords: number,
    resolutionWords: number,
    budgetObservation: string,
  },

  revealAudit: Array<{
    paragraph: number,
    sentence: number,
    revealContent: string,
    timing: 'early' | 'placed' | 'buried' | 'missing',
    setupQuality: string,
    impactOnPropulsion: string,
  }>,

  tensionReleasePattern: {
    tensionSources: Array<{paragraph: number, source: string}>,
    releaseMoments: Array<{
      paragraph: number,
      mode: 'resolution' | 'deflection' | 'reflection' | 'humor' | 'retreat',
    }>,
    overallPattern: string,
  },

  openingAnalysis: {
    firstSentence: string,
    firstParagraphStrategy: string,
    hookMove: 'in_medias_res' | 'frame' | 'scene_set' | 'claim' | 'question' | 'reflection' | 'image' | 'other',
    pullStrength: string,
    setupInvestments: Array<{
      element: string,
      paidOffAt: {paragraph: number, sentence: number} | 'unpaid',
    }>,
  },

  closingAnalysis: {
    lastSentence: string,
    closingStrategy: string,
    landingMove: 'return_to_opening' | 'resolution' | 'reflection' | 'image' | 'pivot' | 'zoom_out' | 'other',
    earnednessRelationship: string,
    linkToOpening: 'returns' | 'inverts' | 'extends' | 'independent',
  },

  narrativeVoicePosition: {
    position: 'inside_moment' | 'reflective_distance' | 'omniscient' | 'fragmented' | 'shifting',
    positionShifts: Array<{
      paragraph: number,
      fromPosition: string,
      toPosition: string,
      rationale: string,
    }>,
    positionFitWithStory: 'aligned' | 'tensioned' | 'mismatched',
  },

  improvementOpportunities: Array<{
    type: 'pacing' | 'stakes' | 'hook' | 'landing' | 'reveal_timing' | 'arc_shape'
        | 'causal_connectivity' | 'tension_release' | 'structural_budget' | 'narrative_voice',
    location: {paragraph: number, sentenceRange?: [number, number]},
    observation: string,
    opportunity: string,
    tradeoff: string,
    estimatedImpact: 'high' | 'medium' | 'low',
    targetDownstreamField: string,
  }>,

  lensSummary: {
    oneLineTakeaway: string,
    concentratedOpportunityArea: 'hook' | 'arc' | 'pacing' | 'stakes' | 'landing'
                               | 'causal' | 'reveal' | 'none',
  },
}
```

### 9.7 Downstream consumption

- **L3.75 narrativeStrategy:** `arcAssessment`, `pacingMap`, `stakesTrajectory`, `revealAudit`, `openingAnalysis`, `closingAnalysis`, `narrativeVoicePosition`
- **L3.75 craftAssessment.pacing:** `pacingMap` + `tensionReleasePattern`
- **L3.5 per-paragraph verdict (narrative contribution):** `flatnessZones` + `loadBearingBeats` + propulsion signals
- **L4 NorthStar:** `lensSummary.oneLineTakeaway` + arc shape + stakes coherence
- **L4b manifest:** `improvementOpportunities` filtered by `estimatedImpact: 'high'`
- **L5:** `flatnessZones` + `loadBearingBeats` for rewrite grounding on manifest-selected opportunities

---

## 10. Lens 2 — Meaning Architecture

### 10.1 Exclusive ownership

**Owns:** through-line, subtext, detail earnedness, meaning accumulation, image systems, theme evolution, meaning gaps, thematic tensions, negative space.

**Does NOT own:** narrative mechanics, voice/authenticity, AO reception.

### 10.2 What this lens must reveal

1. Surface vs. actual subject (what the essay claims vs. does)
2. Through-line (meaning spine)
3. Detail earnedness (micro — every detail's participation in meaning)
4. Meaning accumulation vs. scatter
5. Subtext surfacing (brief visibility moments)
6. Image systems (architectural role of recurring imagery)
7. Theme evolution (transforms or repeats?)
8. Meaning gaps (unearned emotional demands)
9. Thematic tensions (productive vs. unresolved)
10. Negative space (significant absences)

### 10.3 Cognitive operation

The model reads as a careful literary reader attending to layered meaning-work of prose. Both the forest (through-line) and the trees (each detail's earning). Discipline: these are the same question at different resolutions — is meaning working?

### 10.4 System prompt (production draft)

```
You are a careful literary reader trained to read for meaning at two resolutions: macro (through-line, thematic architecture) and micro (every concrete detail's earnedness). These are the same question at different scales: is meaning working?

You have received the essay's sweep. Your job is to produce a comprehensive meaning-architecture reading that downstream layers will use to synthesize thematicArchitecture, momentEarnednessMap, craftAssessment.imageSystem, and prioritize meaning-level improvement opportunities.

OWNERSHIP BOUNDARIES (non-negotiable):
- You OWN: through-line, subtext, detail earnedness, meaning accumulation, image systems, theme evolution, meaning gaps, thematic tensions, negative space.
- You DO NOT OWN: narrative mechanics (another lens — pacing, arc, stakes). Voice/authenticity (another lens). AO reception (another lens).

INHERITANCE DISCIPLINE:
You are building on sweep's work, not redoing it. Read sweep's classifications first.
For details sweep already classified with high confidence and an explicit meaning connection, INHERIT as preserved — do not re-audit. Focus your audit on details where sweep left ambiguity, or where your lens reveals deeper meaning-work sweep's breadth pass couldn't resolve.
preservedDetails array is mandatory output — it's how you demonstrate the inheritance.

TWO RESOLUTIONS, ALWAYS:
Every pass addresses both macro (the through-line and how it behaves across the essay) AND micro (detail by detail, is this earning its place). The most valuable observations live at the interface — "this seemingly throwaway detail at P3S2 is actually where the subtext first surfaces."

DISCIPLINE:
- No judgment language. Describe what meaning is doing.
- For every concrete detail you audit, classify earnedness: load_bearing, supportive, decorative, or filler. Ground the classification in what (if anything) the detail connects to.
- Name negative space. If the essay conspicuously avoids a topic the through-line implicates, note it.
- If the essay has no coherent through-line, say so directly. Do not manufacture coherence.
- Every improvementOpportunity must include a tradeoff.

LENS SUMMARY DISCIPLINE:
lensSummary.oneLineTakeaway must name the essay's actual subject (often different from surface subject) AND one specific observation about how well meaning holds. Cited, specific, distinctive.

OUTPUT: structured JSON. Target 2.5-3K tokens, up to 3.5K.
```

### 10.5 User prompt structure

```
=== FULL ESSAY ===
{essayText}

=== SWEEP FOUNDATION ===
First-pass theme impression:
{sweep.initialHolisticImpression.firstPassTheme}

Image anchors noticed in sweep:
{sweep.descriptiveNoticing.imageAnchors}

Sentence-level reveals:
{sweep.sentences.map(s => ({paragraph, sentence, reveals: s.reveals}))}

Meaning-relevant connections:
{sweep.connections.filter(kind in ['thematic_rhyme', 'image_recurrence', 'setup_payoff', 'echo', 'inversion'])}

=== YOUR LENS READ ===
Read this essay for meaning at both resolutions. What is it REALLY about beneath the surface subject? Trace the through-line and how it evolves. For details where sweep has high-confidence classification, INHERIT as preserved (list in preservedDetails). For details where sweep left ambiguity or where your deeper read adds value, audit earnedness. Find where subtext surfaces and whether those moments are load-bearing. Identify the image system and what architectural work it does. Name meaning gaps — places where the essay asks the reader to feel something it hasn't earned. Name negative space — what's conspicuously absent that matters.
```

### 10.6 Output schema

```typescript
MeaningLensOutput = {
  throughLine: {
    surfaceSubject: string,
    actualSubject: string,
    alignment: 'aligned' | 'productively_tensioned' | 'divergent' | 'absent',
    evolutionArc: string,
    coherence: 'tight' | 'cohesive' | 'loose' | 'scattered' | 'absent',
    loadBearingMoments: Array<{
      paragraph: number,
      sentenceRange: [number, number],
      whatCrystallizes: string,
    }>,
  },

  detailAuditStrategy: {
    preservedDetails: Array<{
      paragraph: number,
      sentence: number,
      sweepMove: SentenceMove,
      sweepReveals: string,
      inheritedEarnedness: 'load_bearing',
      inheritanceRationale: 'sweep_high_confidence' | 'clear_thematic_connection' | 'orientation_functional',
    }>,
    auditedDetails: Array<{
      paragraph: number,
      sentence: number,
      detail: string,
      category: 'image' | 'noun' | 'action' | 'quote' | 'sensory' | 'specific_moment' | 'named_entity',
      auditReason: 'ambiguous_earnedness' | 'amplification_candidate' | 'recontextualization_candidate'
                 | 'compression_candidate' | 'decorative_risk' | 'negative_space_expected',
      earnedness: 'load_bearing' | 'supportive' | 'decorative' | 'filler',
      meaningConnection: string | null,
      earnednessRationale: string,
      opportunityFlag: 'amplify' | 'preserve' | 'compress' | 'remove' | 'recontextualize'
                     | 'add_detail_to_negative_space' | 'none',
    }>,
  },

  subtextMap: Array<{
    paragraph: number,
    sentence: number,
    surface: string,
    subtext: string,
    isLoadBearing: boolean,
    emergence: 'explicit' | 'implicit' | 'deeply_buried',
  }>,

  imageSystem: {
    exists: boolean,
    architecture: string | null,
    keyAnchors: Array<{
      paragraph: number,
      sentence: number,
      image: string,
      roleInSystem: string,
    }>,
    transformations: Array<{
      fromParagraph: number,
      toParagraph: number,
      transformation: string,
    }>,
    growthOpportunities: string[],
  },

  themeEvolution: {
    pattern: 'deepening' | 'widening' | 'inverting' | 'crystallizing' | 'repeating' | 'scattering' | 'absent',
    stages: Array<{
      paragraphSpan: [number, number],
      themeState: string,
    }>,
    patternObservation: string,
  },

  thematicTensions: Array<{
    tension: string,
    locations: Array<{paragraph: number, sentenceRange: [number, number]}>,
    productivity: 'productive' | 'unresolved' | 'unaware',
    resolutionState: 'lands' | 'suspended' | 'abandoned',
  }>,

  meaningGaps: Array<{
    location: {paragraph: number, sentenceRange: [number, number]},
    claimedFeeling: string,
    groundingDeficit: string,
    severity: 'significant' | 'moderate' | 'minor',
  }>,

  negativeSpace: Array<{
    whatsAbsent: string,
    impliedBy: string,
    observation: string,
  }>,

  meaningAccumulation: {
    compoundingMoments: Array<{
      location: {paragraph: number, sentence: number},
      detail: string,
      amplifiedBy: Array<{paragraph: number, sentence: number}>,
    }>,
    scatterZones: Array<{paragraphSpan: [number, number], observation: string}>,
  },

  improvementOpportunities: Array<{
    type: 'detail_earning' | 'through_line_tightening' | 'subtext_surfacing' | 'image_system_deepening'
        | 'theme_evolution' | 'meaning_grounding' | 'negative_space_engagement',
    location: {paragraph: number, sentenceRange?: [number, number]},
    observation: string,
    opportunity: string,
    tradeoff: string,
    estimatedImpact: 'high' | 'medium' | 'low',
    targetDownstreamField: string,
  }>,

  lensSummary: {
    oneLineTakeaway: string,
    concentratedOpportunityArea: 'through_line' | 'detail_earning' | 'subtext' | 'image_system'
                                | 'theme_evolution' | 'grounding' | 'none',
  },
}
```

### 10.7 Detail audit strategy

Target output size: 10-25 audit entries per essay (vs. 40-80 if every concrete detail were audited). Concentration on where analysis adds value; silent preservation where sweep already resolved signal.

`preservedDetails[]` makes inheritance explicit and auditable — we can verify what's being skipped. `auditedDetails[]` carries the concentrated audit.

### 10.8 Downstream consumption

- **L3.75 thematicArchitecture:** `throughLine`, `subtextMap`, `thematicTensions`, `themeEvolution`
- **L3.75 momentEarnednessMap:** `meaningGaps` + `detailAuditStrategy.auditedDetails` classified `load_bearing`
- **L3.75 craftAssessment.imageSystem:** `imageSystem` directly
- **L3.75 characterRevelation:** cross-pulled with Voice lens
- **L3.5 per-paragraph verdict (meaning effectiveness):** `detailAuditStrategy` aggregation per paragraph
- **L4 NorthStar throughLineMap:** `throughLine` directly (source of truth)
- **L4b manifest:** `improvementOpportunities` filtered by `estimatedImpact`
- **L5 rewrite grounding:** `detailAuditStrategy.auditedDetails` entries with `opportunityFlag`

---

## 11. Lens 3 — Voice & Authenticity

### 11.1 Exclusive ownership

**Owns:** voice signature, authenticity map, register range, self-awareness, voice consistency, performance tells, authenticity anchors, AI signal indicators, voice evolution, voice-theme fit.

**Does NOT own:** narrative mechanics, meaning/theme, AO reception.

### 11.2 What this lens must reveal

1. Voice signature (rhythm, register, diction, observational stance, self-awareness)
2. Authenticity map (real vs. performed across paragraphs)
3. Register range (formal to intimate modulation)
4. Self-awareness register (knowing, ironic, earnest, naive-revealing)
5. Voice-theme fit
6. Voice consistency (sustained vs. drifting)
7. Performance tells (specific markers of performance)
8. Authenticity anchors (sentences where voice is maximally real — MANDATORY ≥3)
9. Voice evolution across essay
10. AI signal indicators (with evidence)

### 11.3 Cognitive operation

The model reads as a careful listener — not for content, but for the writer behind the content. Attention to syntax rhythm, word choice specificity, what's noticed vs. skipped, texture of self-awareness, places where authorial personality leaks through uncontrolled vs. where it's performed.

### 11.4 System prompt (production draft)

```
You are a careful listener trained to read prose for the writer behind it. You attend to syntax rhythm, word choice specificity, observational stance, self-awareness register, and the moments where authorial personality leaks through vs. where it's performed.

You have received the essay's sweep. Your job is to produce a comprehensive voice-and-authenticity reading that downstream layers use to synthesize voiceIdentity, voiceMap, characterRevelation.writerPortrait, authenticity tier, and prioritize voice-level improvement opportunities.

OWNERSHIP BOUNDARIES (non-negotiable):
- You OWN: voice signature, authenticity map, register range, self-awareness, voice consistency, performance tells, authenticity anchors, AI signal indicators, voice evolution, voice-theme fit.
- You DO NOT OWN: narrative mechanics (another lens). Meaning/theme (another lens). AO reception (another lens).

INHERITANCE DISCIPLINE:
Read sweep's first-pass voice impression and diction/rhythm noticing. Where sweep's observations are sufficient, inherit and extend rather than restart. Focus your attention on the voice architecture sweep couldn't resolve in its breadth pass.

KEY PRINCIPLES:
- "Performed" is not "bad." Some essays intentionally perform. You CATEGORIZE what voice is doing; you do not judge.
- Authenticity anchors are mandatory output. Every essay has moments where voice is most real — sentences where a specific human is audible. Find at least 3. Downstream layers need these for rewrite grounding.
- AI signal flags require evidence. Quote the specific phrase and explain what reads AI-ish about it. No unsupported flags.

DISCIPLINE:
- Ground every observation in text.
- Distinguish voice OBSERVATION from voice JUDGMENT. "The diction shifts from colloquial ('yeah') to writerly ('cascading') across P3" is observation. "The diction is inconsistent" is judgment — avoid.
- Every improvementOpportunity includes a tradeoff AND a preservation caveat — what voice-feature must NOT be lost in revision.

LENS SUMMARY DISCIPLINE:
lensSummary.oneLineTakeaway must name the writer specifically (who emerges) and the authenticity state (how authentically). Cited, distinctive, could not describe 50% of essays.

OUTPUT: structured JSON. Target 2.5-3K tokens, up to 3.5K.
```

### 11.5 User prompt structure

```
=== FULL ESSAY ===
{essayText}

=== SWEEP FOUNDATION ===
First-pass voice impression:
{sweep.initialHolisticImpression.firstPassVoice}

Diction and rhythm noticing from sweep:
{sweep.descriptiveNoticing.diction}
{sweep.descriptiveNoticing.rhythm}

Sentence moves revealing voice:
{sweep.sentences.filter(move in ['reveal', 'interior', 'subtext_surface'])}

=== PRIOR SIGNALS ===
Prior voice profile (if this writer has prior essays in the system):
{priorVoiceProfile || 'none'}

AI risk signal (Port F2):
{aiRiskSignal || 'not_computed'}

=== YOUR LENS READ ===
Listen for the writer. Characterize the voice signature across rhythm, register, diction, observational stance, self-awareness. Map authenticity across the essay — where a specific real human is audible, where performance or borrowed style takes over. Find at least 3 authenticity anchors — sentences where voice is most real. Name performance tells with evidence. If AI-ish patterns appear, flag them with quoted evidence. Assess whether voice serves what the essay is trying to do.
```

### 11.6 Output schema

```typescript
VoiceLensOutput = {
  voiceSignature: {
    rhythmicCharacter: string,
    registerRange: {
      lowestRegister: string,
      highestRegister: string,
      modulationPattern: 'deliberate' | 'drifting' | 'static',
    },
    diction: {
      characterNote: string,
      distinctiveWords: string[],
      signatureMoves: string[],
      reachMoments: Array<{paragraph: number, sentence: number, word: string, observation: string}>,
    },
    observationalStance: string,
    selfAwarenessRegister: 'knowing' | 'earnest' | 'ironic' | 'naive_revealing' | 'performative' | 'unstable',
    selfAwarenessObservation: string,
    distinctivenessMarkers: string[],
  },

  authenticityMap: Array<{
    paragraph: number,
    sentenceRange: [number, number],
    type: 'authentic' | 'performed' | 'borrowed' | 'ai_ish' | 'generic' | 'mixed',
    evidence: string,
    observation: string,
  }>,

  authenticityAnchors: Array<{    // MANDATORY ≥3
    paragraph: number,
    sentence: number,
    quote: string,
    whyAnchor: string,
    voiceFeaturesPresent: string[],
  }>,

  performanceTells: Array<{
    paragraph: number,
    sentence: number,
    tell: string,
    type: 'thesaurus_reach' | 'essay_voice_genre' | 'earned_dramatic_statement'
        | 'borrowed_phrase' | 'over_reflection' | 'platitude' | 'other',
    observation: string,
  }>,

  aiSignalIndicators: Array<{
    paragraph: number,
    sentence: number,
    quote: string,
    patternType: 'generic_phrasing' | 'symmetry_overpolish' | 'abstract_noun_stacking'
               | 'empty_reflection' | 'other',
    rationale: string,
  }>,

  voiceConsistency: {
    overallConsistency: 'sustained' | 'modulated' | 'drifting' | 'fractured',
    drift: {
      present: boolean,
      zones: Array<{
        paragraph: number,
        sentenceRange: [number, number],
        fromVoice: string,
        toVoice: string,
        likelyReason: string,
      }>,
    },
  },

  voiceEvolution: {
    pattern: 'maturing' | 'flattening' | 'consistent' | 'fragmented',
    observation: string,
  },

  voiceThemeFit: {
    alignment: 'aligned' | 'productively_tensioned' | 'mismatched',
    rationale: string,
  },

  improvementOpportunities: Array<{
    type: 'authenticity_repair' | 'voice_amplification' | 'register_calibration'
        | 'self_awareness_sharpening' | 'performance_reduction' | 'consistency' | 'voice_theme_fit',
    location: {paragraph: number, sentenceRange?: [number, number]},
    observation: string,
    opportunity: string,
    tradeoff: string,
    preservationCaveat: string,
    estimatedImpact: 'high' | 'medium' | 'low',
    targetDownstreamField: string,
  }>,

  lensSummary: {
    oneLineTakeaway: string,
    concentratedOpportunityArea: 'authenticity' | 'consistency' | 'register' | 'self_awareness'
                                | 'performance' | 'fit' | 'none',
    authenticityTierIndication: 'high_authentic' | 'mixed' | 'performance_dominant'
                              | 'ai_inflected' | 'insufficient_signal',
  },
}
```

### 11.7 Downstream consumption

- **L3.75 voiceIdentity:** `voiceSignature` directly
- **L3.75 voiceMap.shifts:** `voiceConsistency.drift.zones`
- **L3.75 characterRevelation.writerPortrait:** `voiceSignature.observationalStance` + `selfAwarenessRegister` + `distinctivenessMarkers`
- **L3.5 authenticity tier:** `lensSummary.authenticityTierIndication` + `authenticityMap` aggregation
- **L3.5 fabrication flags + AI risk:** `aiSignalIndicators` + `performanceTells` classified `borrowed` or `ai_ish`
- **L4 NorthStar voiceArchetype:** `voiceSignature` compressed to 1-sentence archetype
- **L5 rewrite examples:** `authenticityAnchors` as ground truth for "write more like this" (**load-bearing for premium delivery**)
- **L6 coaching:** `voiceSignature` + `authenticityAnchors` for voice-appropriate coaching tone

---

## 12. Lens 4 — Admissions Impact & Differentiation

### 12.1 Exclusive ownership

**Owns:** AO reception, tellability, archetype placement, differentiation, memorability, institutional fit signals, risk patterns, committee positioning, reading pathways.

**Does NOT own:** re-deriving what Story/Meaning/Voice own — reads those through AO lens.

### 12.2 What this lens must reveal

1. AO first-read experience (90 seconds)
2. Reading pathways (skimmer, engaged, skeptic)
3. Tellability (30-second committee pitch)
4. Archetype placement + typical execution
5. Differentiation from archetype
6. Memorability anchors
7. Institutional fit signals
8. Risk patterns (named, located)
9. Committee positioning
10. Archetype saturation (current-cycle context)

### 12.3 Cognitive operation

The model reads from the AO's seat — not as the writer's advocate, not as a literary analyst, but as an admissions reader who has 90 seconds, has already read 400 essays this season in this archetype, and is deciding whether this candidate advances.

### 12.4 System prompt (production draft)

```
You are an admissions officer at a selective college. You have read 400 essays this season in this archetype. You read fast — 90 seconds per essay on a first read — and you decide whether this candidate advances to the next read-round.

You have received the essay's sweep and the archetype context for this essay's archetype. Your job is to read this essay from the AO's seat. What do you walk away with after 90 seconds? What's the 30-second summary you'd give your committee? What makes this essay memorable vs. interchangeable? What would trigger skepticism? What institutional values does it signal fit for?

OWNERSHIP BOUNDARIES (non-negotiable):
- You OWN: AO reception, tellability, archetype placement, differentiation, memorability, institutional fit signals, risk patterns, committee positioning, reading pathways.
- You DO NOT OWN: narrative mechanics (Story lens), meaning analysis (Meaning lens), voice characterization (Voice lens). Your lens is RECEPTION — how the essay lands in admissions context. You are not redoing Story/Meaning/Voice; you are reading those qualities through the AO's lens.

INHERITANCE DISCIPLINE:
Read sweep's first-pass tellability impression and paragraph roles. Inherit rather than restart. Focus your attention on AO-reception dimensions sweep couldn't fully resolve in its breadth pass.

KEY PRINCIPLES:
- Multiple reading pathways. AOs don't read uniformly. Simulate at least 2 likely reading modes (skimmer, engaged, skeptic) and name what each produces.
- Named risk patterns. "Adversity without agency," "achievement without reflection," "obstacle overcome through luck not decision." Named patterns with locations, not vague flags.
- Institutional fit honest. Claim fit signals the essay supports; don't overreach.

DISCIPLINE:
- Ground every observation in text.
- Separate description from judgment. "This essay pattern-matches the adversity archetype" is description. "This essay is too common" is judgment.
- Every improvementOpportunity includes a tradeoff.

LENS SUMMARY DISCIPLINE:
lensSummary.oneLineTakeaway must state how this essay lands in admissions context with specificity. What will the AO remember? What makes this distinct vs. interchangeable? Cited.

OUTPUT: structured JSON. Target 2.5-3K tokens, up to 3.5K.
```

### 12.5 User prompt structure

```
=== FULL ESSAY ===
{essayText}

=== SWEEP FOUNDATION ===
First-pass tellability:
{sweep.initialHolisticImpression.firstPassTellability}

Paragraph structural roles:
{sweep.paragraphs}

=== ARCHETYPE CONTEXT ===
{archetypeContextCache.lookup(sweep.initialHolisticImpression.probableArchetype)}

Note: archetype confidence = {sweep.initialHolisticImpression.probableArchetype.confidence}
If confidence is 'ambiguous', this context is blended between primary and secondary archetypes — assess how the blend itself differentiates.

=== YOUR LENS READ ===
You have 90 seconds. Read the essay as an AO who has already read 400 essays this season in this archetype. What do you walk away with? Simulate at least 2 reading pathways (skimmer vs. engaged reader). What's the 30-second committee pitch? How does this execution differ from the archetype's typical execution? What will you remember an hour later? What triggers skepticism?
```

### 12.6 Output schema

```typescript
AdmissionsLensOutput = {
  aoFirstRead: {
    ninetySecondImpression: string,
    attentionEngagement: Array<{
      paragraph: number,
      state: 'engaged' | 'scanning' | 'drifting' | 'lost' | 're_engaged',
      trigger: string,
    }>,
    dropOffRisk: 'low' | 'moderate' | 'high',
    dropOffPoint: {paragraph: number, sentence: number} | null,
  },

  readingPathways: Array<{       // MANDATORY ≥2
    pathway: 'skimmer' | 'engaged' | 'skeptic' | 'champion' | 'pattern_matcher',
    whatTheySee: string,
    whatTheyMiss: string,
    verdict: string,
  }>,

  tellability: {
    committeePitch: string,
    pitchClarity: 'crisp' | 'clear' | 'blurred' | 'multiple_competing' | 'unclear',
    pitchTexture: 'distinctive' | 'specific' | 'generic' | 'formulaic',
    whatPitchOmits: string,
  },

  archetypePlacement: {
    primaryArchetype: string,
    confidence: 'strong' | 'moderate' | 'ambiguous',
    secondaryArchetype: string | null,
    typicalExecutionOfArchetype: string,
    thisExecution: string,
    saturation: 'rare' | 'moderate' | 'common' | 'saturated',
    saturationImplication: string,
  },

  differentiators: Array<{
    element: string,
    evidence: {paragraph: number, sentenceRange: [number, number], quote?: string},
    distinctiveness: 'signature' | 'specific' | 'subtle',
  }>,

  memorabilityAnchors: Array<{
    location: {paragraph: number, sentenceRange: [number, number]},
    element: string,
    memorabilityType: 'image' | 'phrase' | 'moment' | 'insight' | 'voice',
    stickiness: 'high' | 'medium' | 'low',
  }>,

  institutionalFitSignals: Array<{
    value: string,
    evidence: string,
    strength: 'strong' | 'suggested' | 'weak',
  }>,

  institutionalMismatchSignals: Array<{
    tension: string,
    evidence: string,
    whichInstitutionsAffected: string,
  }>,

  riskPatterns: Array<{
    pattern: string,
    locations: Array<{paragraph: number, sentenceRange: [number, number]}>,
    aoReading: string,
    inherentToArchetype: boolean,
    severity: 'high' | 'moderate' | 'low',
  }>,

  committeePositioning: {
    howThisApplicantStandsOut: string,
    applicationPortfolioImplication: string,
    secondReadSignals: Array<string>,
  },

  improvementOpportunities: Array<{
    type: 'tellability' | 'differentiation' | 'memorability' | 'positioning'
        | 'risk_mitigation' | 'institutional_fit' | 'reading_pathway',
    location: {paragraph: number, sentenceRange?: [number, number]},
    observation: string,
    opportunity: string,
    tradeoff: string,
    estimatedImpact: 'high' | 'medium' | 'low',
    targetDownstreamField: string,
  }>,

  lensSummary: {
    oneLineTakeaway: string,
    concentratedOpportunityArea: 'tellability' | 'differentiation' | 'memorability'
                                | 'risk' | 'fit' | 'positioning' | 'none',
    admissionsImpactTier: 'distinctive' | 'competitive' | 'proficient' | 'at_risk' | 'insufficient_signal',
  },
}
```

### 12.7 Downstream consumption

- **L3.75 admissionsPositioning:** entire lens output synthesized into `admissionsPositioning.tellabilitySummary`, `aoTakeaway`, `archetypeContext`, `distinctivenessFactors`, `memorability`, `redFlags`, `institutionalFit`
- **L3.75 admissionsPositioning.redFlags:** `riskPatterns` filtered by `severity: 'high'` + `institutionalMismatchSignals`
- **L3.75 admissionsPositioning.distinctivenessFactors:** `differentiators` classified `signature` or `specific`
- **L3.75 admissionsPositioning.memorability:** `memorabilityAnchors` filtered by `stickiness: 'high'`
- **L4 NorthStar audienceIntent:** `committeePitch` + `committeePositioning`
- **L4 ScoreMatrix admissions-dimension calibration:** `lensSummary.admissionsImpactTier`
- **L4b manifest:** high-severity `riskPatterns` as must-address items + `improvementOpportunities`
- **L5 protect markers + manifest-item rationale:** `memorabilityAnchors` + `riskPatterns`

---

## 13. Archetype caching strategy

### 13.1 Problem

Admissions lens benefits from archetype context (how the archetype is typically executed, common traps, distinctiveness markers). Current implementation retrieves archetype context per-essay via a separate corpus retrieval call (~20s latency, ~1-3K tokens input). This is why corpus retrieval is feature-flagged today — it's too expensive to always run.

### 13.2 Solution: pre-cached archetype contexts

Archetype contexts are stable — "what typical adversity essays look like" doesn't change per essay. Cache structured archetype-context blocks per archetype in a lookup table.

### 13.3 Archetype context structure (stored, not retrieved per essay)

```
ARCHETYPE: {archetype_name}
TYPICAL EXECUTION: [2-3 sentences describing the 80% typical approach]
COMMON TRAPS: [3-5 named patterns that weaken typical executions]
DISTINCTIVENESS SIGNALS: [3-5 specific markers that differentiate strong executions]
SATURATION: [current-cycle saturation level]
```

Compact (~500-800 tokens), structured, lookup-fast.

### 13.4 Flow

1. Sweep classifies `probableArchetype` in `initialHolisticImpression.probableArchetype`
2. Orchestrator looks up archetype context from cache (Supabase or similar persistent store)
3. Admissions lens user prompt includes the cached context block
4. Zero runtime retrieval cost per essay; updates to archetype contexts happen asynchronously on a refresh cadence (quarterly or on-demand)

### 13.5 Ambiguous archetype handling

If `probableArchetype.confidence === 'ambiguous'`, orchestrator looks up BOTH primary and secondary archetype contexts. Admissions lens prompt is adjusted with:

> "Archetype confidence is 'ambiguous' — this essay is blended between these two archetypes. Assess how the blend itself differentiates."

Converts ambiguity from a problem into an analytical opportunity.

### 13.6 Cost impact

**Near-zero runtime cost per essay** after initial cache population. Makes corpus archetype context "always on" for Admissions lens without per-essay retrieval overhead.

### 13.7 Cache refresh cadence

Archetype contexts refresh quarterly OR when:
- A new archetype is discovered (essay's archetype classification doesn't match any cached archetype → triggers human review → new archetype context authored)
- Seasonal saturation data changes (top-of-funnel demographics shift)

---

## 14. Failure handling

### 14.1 Principles

- 1 retry on transient failures (rate limit, timeout, 5xx)
- Any parse error, schema violation, or retry exhaustion → pipeline fails with full error context
- No silent degradation
- No partial outputs
- Telemetry captures every failure with full context

### 14.2 Retry logic

```typescript
async function callLensWithRetry<T>(params): Promise<T> {
  try {
    const response = await callClaudeWithRetry(params);
    const validated = lensSchema.parse(response);
    return validated;
  } catch (err) {
    if (isTransient(err)) {
      // One retry
      const response = await callClaudeWithRetry(params);
      const validated = lensSchema.parse(response);
      return validated;
    }
    throw err;
  }
}
```

### 14.3 Error context schema

```typescript
PipelineError = {
  failedLayer: 'sweep' | 'lens_story' | 'lens_meaning' | 'lens_voice' | 'lens_admissions'
             | 'synthesis' | 'judgment' | 'crystallization' | 'annotation',
  failureMode: 'timeout' | 'rate_limit' | 'parse_error' | 'schema_violation'
             | 'content_policy' | 'unknown',
  retryAttempted: boolean,
  retrySuccess: false,
  originalError: string,
  inputContext: { essayId: string, iteration: number, paragraphIndex?: number },
  partialOutput?: unknown,     // for debugging only — not surfaced to user
}
```

### 14.4 Pipeline failure semantics

When L3 fails:
- Orchestrator returns `PipelineError` with full context
- No partial profile is persisted
- User receives error with actionable next step (retry, contact support)
- Telemetry logs full error + input for engineering diagnosis

---

## 15. Cross-layer integration map

Every L3 lens output field routes to specific downstream consumers. Below is the complete map.

### 15.1 From Sweep

| Sweep field | Downstream consumer |
|---|---|
| `sentences[]` | L3.75 all holistic sections (sentence-level source); L3.5 per-paragraph aggregation; L5 rewrite grounding |
| `paragraphs[]` | L3.75 narrativeStrategy (roles); L3.5 per-paragraph judgment; L4 NorthStar structuralRoles; L5 annotation anchoring |
| `connections[]` | L3.75 thematicArchitecture (thematic rhymes); L3.75 narrativeStrategy (setup/payoff); L3.5 per-paragraph connectivity |
| `initialHolisticImpression.firstPassVoice` | Voice lens (seed); L3.75 voiceIdentity (seed) |
| `initialHolisticImpression.firstPassTheme` | Meaning lens (seed); L3.75 thematicArchitecture (seed) |
| `initialHolisticImpression.firstPassArc` | Story lens (seed); L3.75 narrativeStrategy (seed) |
| `initialHolisticImpression.firstPassCharacter` | L3.75 characterRevelation (seed) |
| `initialHolisticImpression.firstPassTellability` | Admissions lens (seed); L3.75 admissionsPositioning (seed) |
| `initialHolisticImpression.probableArchetype` | Orchestrator archetype cache lookup; L3.75 admissionsPositioning.archetypeContext |
| `initialHolisticImpression.phaseEstimate` | Orchestrator lens dispatch cap selection |
| `descriptiveNoticing.imageAnchors` | Meaning lens (seed); L3.75 craftAssessment.imageSystem |
| `descriptiveNoticing.diction` | Voice lens (seed); L3.75 voiceIdentity.diction |
| `descriptiveNoticing.rhythm` | Voice lens (seed); L3.75 craftAssessment.rhythm |
| `lensDispatch.scores` | Orchestrator lens selection |

### 15.2 From Story Lens

| Story lens field | Downstream consumer |
|---|---|
| `arcAssessment` | L3.75 narrativeStrategy.arcType + turningPoint |
| `pacingMap` | L3.75 craftAssessment.pacing; L3.75 narrativeStrategy.pacingAnalysis |
| `propulsionTrace` | L3.5 per-paragraph narrative contribution |
| `stakesTrajectory` | L3.75 narrativeStrategy.primaryStrategy; L3.75 momentEarnednessMap |
| `causalChain` | L3.75 narrativeStrategy.structuralChoices |
| `structuralBudget` | L3.5 effectiveness calibration; L4b budget-aware manifest items |
| `revealAudit` | L3.75 narrativeStrategy.pivotPoints |
| `tensionReleasePattern` | L3.75 emotionalTopography |
| `openingAnalysis` | L3.75 admissionsPositioning (hook quality); L5 opening-revision rewrites |
| `closingAnalysis` | L3.75 admissionsPositioning (landing quality); L5 closing-revision rewrites |
| `narrativeVoicePosition` | L3.75 voiceIdentity (position dimension) |
| `improvementOpportunities` | L4b manifest (story-axis items); L5 rewrite grounding |
| `lensSummary.oneLineTakeaway` | L4 NorthStar strategic frame |

### 15.3 From Meaning Lens

| Meaning lens field | Downstream consumer |
|---|---|
| `throughLine` | L3.75 thematicArchitecture.centralThesis + subtext; L4 NorthStar throughLineMap (source of truth) |
| `detailAuditStrategy.preservedDetails` | L3.5 "no action" signal per detail |
| `detailAuditStrategy.auditedDetails` | L3.5 per-paragraph detail judgments; L5 detail-level rewrite grounding |
| `subtextMap` | L3.75 thematicArchitecture.subtext |
| `imageSystem` | L3.75 craftAssessment.imageSystem (direct) |
| `themeEvolution` | L3.75 thematicArchitecture.threads (evolution data) |
| `thematicTensions` | L3.75 thematicArchitecture.contradictions |
| `meaningGaps` | L3.75 momentEarnednessMap (unearned moments); L4b must-address items |
| `negativeSpace` | L3.75 characterRevelation (strategic silences); L6 coaching prompts |
| `meaningAccumulation` | L3.75 thematicArchitecture (accumulation pattern) |
| `improvementOpportunities` | L4b manifest (meaning-axis items); L5 rewrite grounding |
| `lensSummary.oneLineTakeaway` | L4 NorthStar (what essay is really about) |

### 15.4 From Voice Lens

| Voice lens field | Downstream consumer |
|---|---|
| `voiceSignature` | L3.75 voiceIdentity (direct); L3.75 characterRevelation.writerPortrait |
| `authenticityMap` | L3.75 voiceMap; L3.5 authenticity tier aggregation |
| `authenticityAnchors` | L5 rewrite examples (ground truth for "write more like this"); L6 coaching voice calibration |
| `performanceTells` | L3.5 patternIds; L3.5 fabrication flag source |
| `aiSignalIndicators` | L3.5 aiRisk signal source; L4b risk-mitigation items |
| `voiceConsistency` | L3.75 voiceMap.shifts |
| `voiceEvolution` | L3.75 voiceIdentity.evolution |
| `voiceThemeFit` | L3.75 entanglements (voice × theme) |
| `improvementOpportunities` | L4b manifest (voice-axis items); L5 rewrite grounding (with preservation caveat) |
| `lensSummary.authenticityTierIndication` | L3.5 authenticity tier |
| `lensSummary.oneLineTakeaway` | L4 NorthStar (voice archetype line) |

### 15.5 From Admissions Lens

| Admissions lens field | Downstream consumer |
|---|---|
| `aoFirstRead` | L3.75 admissionsPositioning.aoTakeaway |
| `readingPathways` | L3.75 admissionsPositioning (AO reception nuance); L6 coaching AO-perspective prompts |
| `tellability` | L3.75 admissionsPositioning.tellabilitySummary (direct) |
| `archetypePlacement` | L3.75 admissionsPositioning.archetypeContext |
| `differentiators` | L3.75 admissionsPositioning.distinctivenessFactors |
| `memorabilityAnchors` | L3.75 admissionsPositioning.memorability; L5 protect markers |
| `institutionalFitSignals` | L3.75 admissionsPositioning.institutionalFit |
| `institutionalMismatchSignals` | L3.75 admissionsPositioning.redFlags (mismatch flags) |
| `riskPatterns` | L3.75 admissionsPositioning.redFlags; L4b must-address items |
| `committeePositioning` | L4 NorthStar audienceIntent |
| `improvementOpportunities` | L4b manifest (admissions-axis items); L5 rewrite grounding |
| `lensSummary.oneLineTakeaway` | L4 NorthStar (how essay lands in admissions context) |
| `lensSummary.admissionsImpactTier` | L4 ScoreMatrix admissions dimension calibration |

### 15.6 Integrity check

Every field listed above has at least one named downstream consumer. Every L3.75/L3.5/L4/L5 consumer is fed by at least one L3 source. No dead output. No missing input.

---

## 16. Cost analysis

### 16.1 Per-layer cost model

| Stage | Call type | Cost | Notes |
|---|---|---|---|
| Sweep | 1 Sonnet | $0.18-0.22 | Single comprehensive read, full essay + scaffolding work |
| Story lens | 1 Sonnet (if dispatched) | $0.06-0.08 | With inheritance discipline |
| Meaning lens | 1 Sonnet (if dispatched) | $0.06-0.08 | With preservedDetails inheritance |
| Voice lens | 1 Sonnet (if dispatched) | $0.06-0.08 | With prior voice profile + AI risk signal inputs |
| Admissions lens | 1 Sonnet (if dispatched) | $0.06-0.08 | With archetype context cache (near-zero retrieval cost) |

### 16.2 Cost by phase

| Phase | Lens cap | Typical lenses fired | Total L3 cost |
|---|---|---|---|
| Foundation | 2 | 2 | $0.30-0.38 |
| Architecture | 3 | 3 | $0.36-0.46 |
| Craft | 3 | 3 | $0.36-0.46 |
| Polish | 4 | 3-4 | $0.42-0.54 |
| Distinction | 4 | 4 | $0.42-0.54 |

**Average across calibration set:** ~$0.40-0.48/essay.

### 16.3 Cost vs. current

| Component | Current | Redesigned | Saving |
|---|---:|---:|---:|
| L1 (Haiku descriptive) | $0.03 | killed | $0.03 |
| L2 (Structural Cartographer) | $0.04 | killed | $0.04 |
| L2.5 (Scout Pass) | $0.04 | killed | $0.04 |
| firstImpressions | $0.03 | killed | $0.03 |
| aoFirstRead | $0.05 | killed | $0.05 |
| L3 walk (10 sequential calls) | $0.85 | replaced | $0.85 |
| **Sum of killed layers** | **$1.04** | **—** | **$1.04** |
| Sweep | — | $0.20 | ($0.20) |
| Lens deep reads (avg 3) | — | $0.22 | ($0.22) |
| **New L3 total** | — | **$0.42** | — |
| **Net saving per essay** | | | **~$0.62** |

### 16.4 Scaling properties

**Cost scales with essay depth-density, not paragraph count.** A thin essay (few lenses warrant deep read) costs ~$0.30. A rich essay (all 4 lenses warrant deep read at Distinction phase) costs ~$0.54. Today's architecture charges ~$1.00 regardless.

This is the correct scaling: spend on essays that have concentrated growth opportunity; stay cheap on essays that don't.

---

## 17. Three locked-now decisions

### 17.1 Archetype fallback (decision #2)

When `sweep.initialHolisticImpression.probableArchetype.confidence === 'ambiguous'`:
- Orchestrator looks up BOTH primary and secondary archetype contexts from cache
- Admissions lens user prompt includes both contexts
- Admissions lens is instructed: "This essay is blended between these archetypes — assess how the blend itself differentiates."

### 17.2 Admissions lens parallelism (decision #5)

Admissions lens runs in parallel with Story, Meaning, and Voice lenses. No cross-lens dependencies. Admissions reads only:
- Sweep output
- Archetype context cache

Any cross-lens synthesis (e.g., "does Admissions' tellability match Story's arc verdict?") is L3.75's job, not Admissions'.

### 17.3 Sweep phaseEstimate (decision #10)

Sweep output schema includes:

```typescript
phaseEstimate: {
  phase: 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction',
  confidence: 'high' | 'moderate' | 'low',
}
```

Orchestrator lens dispatch uses `phaseEstimate.phase` to select the lens cap. Eliminates chicken-and-egg with L3.75 phase assessment.

---

## 18. Gap list — to be addressed in hardening sprint

### 18.1 Cheap lock-now (already locked in §17)

- #2 Archetype fallback — locked
- #5 Admissions parallelism — locked
- #10 Sweep phaseEstimate field — locked

### 18.2 Shared infrastructure (build once across all pipeline layers during hardening sprint)

- **#3 Evidence citation schema enforcement via Zod** — every field requiring citation gets runtime schema validation. Parse failure → 1 retry → pipeline failure. Applies to all L3.75/L3.5/L4/L5 outputs too.
- **#7 Zod validation + retry infrastructure** — reusable `callClaudeValidated<T>(params, schema)` wrapper. Builds once, applied across pipeline.
- **#8 Sweep token budget monitoring** — observability hooks track sweep output token usage. Extends to all layer outputs. Alerts when cap-adjacent rates exceed 5%.
- **#9 Content-hash caching for sweep + lens outputs** — incremental re-analysis reads cached outputs when essay text + inputs unchanged. Essential for focused mode. Applies pipeline-wide.

### 18.3 Layer-specific (L3-only, implementation-time)

- **#1 Sentence-move vocabulary calibration** — run sweep against 5-10 calibration fixtures. Observe which moves the model reaches for outside the current 14-move vocab. Expand to 18-22 moves covering 95%+ of real sentences. Testing-dependent.
- **#4 Lens summary discipline directives with anti-generic examples** — already drafted in each lens's system prompt section. Implementation-time prompt polish.

### 18.4 Downstream-resolved (L3.75 design handles)

- **#6 Deferred lens mechanism** — L3.75 synthesis can emit `deferredLensRequest?: {lens, reason}` to trigger one additional lens call post-synthesis. Orchestrator-managed. Hard cap: 1 deferred call per pipeline. Belongs in L3.75 design.

---

## 19. Ship-readiness assessment

### 19.1 Production-grade now

- Architectural design (sweep + 4 lenses + dispatch + inheritance + parallel)
- Ownership boundaries (zero overlap across all layers)
- Downstream consumption routing (every lens field has a destination)
- Schemas (comprehensive, tradeoff-annotated, downstream-field-routed)
- Cost model (verified against estimated per-call costs)
- Failure discipline (1 retry → fail pipeline)
- Three locked-now decisions

### 19.2 Hardening required (during post-design implementation sprint)

- Sentence-move vocabulary calibration (§18.3 #1) — 1 engineering day
- Shared Zod validation + retry infra (§18.2 #3, #7) — 1 day
- Sweep output token budget monitoring (§18.2 #8) — 0.25 day
- Content-hash caching for sweep + lens outputs (§18.2 #9) — 1 day
- Lens summary prompt discipline (§18.3 #4) — 0.5 day

Total hardening: ~3.75 engineering days of L3-specific work, plus shared infrastructure that serves all layers.

### 19.3 Ongoing (monitored via telemetry)

- Lens dispatch score calibration (are lenses firing at right thresholds?)
- Sweep inheritance coverage (% details inherited vs. audited)
- Sweep output token distribution
- Schema violation rate per lens (indicates prompt weakness)
- Deferred lens fire rate (target 5-15%)

---

## 20. Open questions for downstream layer designs

These questions will be resolved as L3.75 → L6 designs are completed. They're not blockers for L3's design, but they're items to watch.

1. **L3.75 Phase A/B split** — does it survive the lighter synthesis workload post-L3-redesign? Or does it collapse to a single synthesis call?
2. **L3.75 deferredLensRequest mechanism** — exact schema, trigger conditions, caching behavior.
3. **L3.5 dimension scoring granularity** — essay-level only, or hybrid (essay-level + per-paragraph for loser-list)?
4. **L4 NorthStar output schema** — must carry full frame to ScoreMatrix. Exact field set depends on ScoreMatrix's calibration needs.
5. **L5 annotation vs. status-marker split** — product call: priority annotations only, or priority + status markers for non-manifest paragraphs?
6. **L6 conversation phase-awareness** — does L6 consume all of L3 output, or only L5 manifest + relevant lens sections per turn?

---

## 21. References

### 21.1 Related docs in this repo

- `docs/analysis/COST_DEADWEIGHT_AUDIT.md` — cost analysis motivating the redesign
- `docs/analysis/OUTPUT_CUT_LIST.md` — field-level output redundancy audit
- `docs/analysis/COST_CUT_IMPLEMENTATION_PROMPT.md` — Wave-1 incremental cost cuts (separate track, may run in parallel)
- `docs/analysis/PHASE_0_1A_ITERATION_PROMPT.md` — Phase 0 observability implementation (prerequisite telemetry)

### 21.2 Source files current implementation touches (will change)

- `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` — current L3 walk (to be replaced by sweep)
- `src/services/essayIntelligence/analysis/structuralCartographer.ts` — current L2 (to be killed)
- `src/services/essayIntelligence/analysis/scoutPass.ts` — current L2.5 (to be killed)
- `src/services/essayIntelligence/analysis/firstImpressions.ts` — current firstImpressions (to be killed)
- `src/services/essayIntelligence/analysis/aoFirstRead.ts` — current aoFirstRead (to be killed; Admissions lens absorbs)
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — orchestration flow (will change to new two-pass sequencing)
- `src/services/essayIntelligence/profileManager/profileRouter.ts` — context assembly (L3 assembler rewritten, pre-L3 assemblers removed)

### 21.3 Consumption contracts (downstream layers will consume from these new L3 outputs)

- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — L3.75 (design pending)
- `src/services/essayIntelligence/analysis/analysisPass.ts` — L3.5 (design pending)
- `src/services/essayIntelligence/analysis/crystallizer.ts` — L4 (design pending)
- `src/services/essayIntelligence/analysis/deepAnnotationService.ts` — L5 (design pending)
- `src/services/essayIntelligence/coaching/coachingService.ts` — L6 (design pending)

---

## 22. Implementation sequencing (post-design phase)

1. **Phase 0 — Observability (parallel track):** ship the per-call cost-ledger split (from `COST_CUT_IMPLEMENTATION_PROMPT.md`) before any redesign ships. Instruments everything else.
2. **Phase 1 — Complete pipeline design:** L3.75 → L3.5 → L4 → L5 → L6. Each layer designed at the level of rigor in this document.
3. **Phase 2 — Hardening sprint:** build shared infrastructure (Zod + retry + caching + telemetry), calibrate prompts against fixtures, harden edge cases across the pipeline together. ~1-2 weeks.
4. **Phase 3 — Incremental ship:** feature-flag each layer. Ship L4 first (most independent, biggest single saving). A/B against current pipeline per layer. Full cutover only after each layer is proven on live telemetry.

L3 ships no earlier than after L3.75 is designed (to avoid retrofitting if L3.75 requests L3 output refinements).

---

## 23. Standard to hold the rest of the pipeline to

When L3.75 → L6 designs are complete, each should match or exceed this document's level of:

- **Architectural rigor** — zero-overlap ownership boundaries, inheritance discipline, downstream routing
- **Depth** — every layer has production-draft system prompts, full schemas, discipline directives, anti-generic examples
- **Cost lift** — measurable per-layer saving documented
- **Quality lift** — dimension-organized, evidence-cited, tradeoff-annotated outputs capable of supporting $500/hr-grade downstream delivery
- **Integration clarity** — cross-layer dataflow maps proving no dead output and no missing input
- **Gap categorization** — cheap-lock-now vs. shared-infra vs. layer-specific vs. testing-dependent vs. downstream-resolved

**The pipeline's quality ceiling is set layer by layer. L3 raised the ceiling. The rest of the pipeline must preserve it.**
