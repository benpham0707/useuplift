# Edit Understanding, Two-Pathway Edit Handling & Analysis Modes (Updated)
> Replaces docs/specs/PLAN.md "Incremental Update" (lines ~2116-2201) and "Analysis Modes" (lines ~2390-2608).
> Incorporates LLM-nuanced edit understanding, conversational edit workshop, version-based re-analysis, and updated analysis modes.

---

## Section A: Edit Understanding Pipeline

### Vision

The old docs/specs/PLAN.md design had two approaches to edit handling, both wrong in different directions. The original 1D asked a cheap Haiku call to PREDICT impact — unreliable guesswork disconnected from real understanding. The v1 correction swung the other way, making everything deterministic — word count ratios, syntactic pattern matching, mechanical graph traversal. But essay editing is a meaning-making activity. When a student changes one word, the significance depends entirely on context that only an LLM reading the actual words can understand.

The Edit Understanding Pipeline holds the middle: a structured pipeline (Detect -> Understand -> Classify -> Map -> Scope) that provides discipline and predictability, with Sonnet-level LLM intelligence at each interpretive step. The pipeline tells the system WHAT to do at each stage. The LLM brings the judgment of HOW significant, WHAT kind, and HOW FAR the impact reaches.

The key distinction from the old 1D: the Haiku classifier was a separate, shallow prediction call ("what will this change affect?") that guessed without deeply understanding the change itself. The new approach does not predict — it UNDERSTANDS the change first, and the scope FOLLOWS from that understanding. Understanding and scoping happen in the same call, with the same context, by the same model.

### The Pipeline: Detect -> Understand -> Map -> Scope

```
+-----------------------------------------------------------------------------+
| Student edits essay text                                                    |
|                                                                             |
| Step 0: HAIKU PRE-FILTER (~$0.001)                                         |
|   Binary: "trivial mechanical fix or real content change?"                  |
|   Trivial (typo, comma, capitalization) -> log, no profile work, DONE      |
|   Real content change -> proceed to Step 1                                 |
|                                                                             |
| Step 1: CHANGE DETECTION (mechanical, ~10-50ms, free)                      |
|   Paragraph alignment -> sentence alignment -> word-level diff             |
|   Output: hierarchical description of what physically changed               |
|                                                                             |
| Step 2: CHANGE UNDERSTANDING (Sonnet call, ~$0.02-0.05)                    |
|   + Step 3: PROFILE MAPPING (same Sonnet call)                             |
|   + Step 4: SCOPE RECOMMENDATION (same Sonnet call)                        |
|   One integrated call that understands, maps, and scopes                    |
|                                                                             |
| Output: EditUnderstanding -- feeds Pathway 1 workshop OR Pathway 2 brief   |
+-----------------------------------------------------------------------------+
```

#### Step 0: Haiku Pre-Filter

Not every edit deserves a Sonnet call. A Haiku pre-filter prevents unnecessary cost for trivially insignificant edits.

**When Haiku is enough**: The student fixes a typo ("teh" -> "the"), adds a comma, changes capitalization, or corrects a misspelling. Haiku receives the raw diff only (no profile context needed) and classifies: "mechanical correction, no semantic change." No Sonnet call, no profile update. Cost: ~$0.001.

**When Haiku escalates to Sonnet**: Any change to actual content words, sentence structure, added/removed content, or any change to a sentence the ProfileIndex has tagged as structurally important. Haiku's job is binary: "is this a trivial mechanical fix or a real content change?" If real -> hand to Sonnet.

This keeps costs manageable for students who make many trivial fixes while ensuring every meaningful edit gets full LLM understanding.

#### Step 1: Change Detection (Mechanical Pre-Processing)

This is the one step that remains purely mechanical. It produces the raw material the LLM will interpret.

**Paragraph alignment**: Hash each paragraph. Unchanged hashes = paragraph did not change. If paragraphs were inserted, deleted, or reordered, produce a remapping (old P3 -> new P4). This uses the same `remapIndices` logic defined in `essayProfileManager.ts`.

**Sentence alignment within changed paragraphs**: Align sentences between old and new versions. Pair each changed sentence with its most likely counterpart (by position, confirmed by textual overlap). Flag genuinely new sentences and deleted sentences.

**Word-level diff within changed sentences**: For each changed sentence, produce the actual textual difference — old text, new text, which words changed. This is the input the LLM will read.

The output is a complete, hierarchical description: "paragraph 2, sentence 4: old text 'I decided to keep the ring,' new text 'I couldn't let it go.' Also: paragraph 1, sentence 2: new sentence inserted."

This step is fast (~10-50ms), costs nothing, and produces clean structured input for the LLM.

```typescript
interface ChangeDetectionOutput {
  /** Structural changes at the paragraph level */
  structuralChanges: {
    type: 'insertion' | 'deletion' | 'reorder';
    oldIndex?: number;
    newIndex?: number;
  }[];

  /** Content changes within existing paragraphs */
  contentChanges: Array<{
    paragraphIndex: number;

    /** Sentence-level changes within this paragraph */
    sentenceChanges: Array<{
      sentenceIndex: number;
      changeType: 'modified' | 'inserted' | 'deleted';
      oldText?: string;
      newText?: string;
      /** Word-level diff for modified sentences */
      wordDiff?: Array<{
        type: 'unchanged' | 'added' | 'removed';
        text: string;
      }>;
    }>;

    /** Mechanical metrics (useful for the Haiku pre-filter and logging) */
    textChangeRatio: number;   // 0-1: fraction of paragraph text changed
  }>;

  /** Index remapping if structural changes occurred */
  indexRemap?: Map<number, number>;  // old paragraph index -> new paragraph index
}
```

#### Step 2: Change Understanding (Sonnet Call -- The Core Intelligence)

This is the heart of the system. A single Sonnet call receives the raw diff from Step 1 alongside the relevant profile context and produces a nuanced reading of what the edit means.

**Input to the Sonnet call**:
- The raw diff from Step 1 (old text -> new text for each changed sentence)
- The changed sentence's existing profile data (understanding, analysis, tags, connections)
- The paragraph's role and structural context (from ProfileIndex)
- A compact summary from the North Star (the sentence's structural role, through-line relevance)
- If available: conversation insights about the student's intent for this edit

**The LLM produces three layers of output in one integrated call:**

**Significance Assessment**: Not a word count ratio but a contextual judgment. "This is a single word change ('decided' -> 'couldn't') but it's in the fulcrum sentence and shifts the essay's theory of agency. High significance." Or: "Three sentences were rewritten in P3 but the paragraph's role and emotional register are unchanged — the student polished the prose without altering the meaning. Moderate significance."

The assessment considers:
- Where the change is (thesis sentence vs transitional detail vs sensory description)
- What structural role the sentence plays (fulcrum, setup, payoff, bridge, atmosphere)
- Whether the change alters the sentence's function or just its expression
- Whether key meaning-carrying words changed (nouns/verbs) vs modifiers (adjectives/adverbs)
- Whether the change connects to or disconnects from other parts of the essay

**Change Type Classification**: The LLM categorizes the change with nuance that syntactic analysis cannot:

| Change Type | Description | Example (diamond essay) |
|-------------|-------------|------------------------|
| **Refinement** | Same meaning, better execution | "walked" -> "drifted" where drifting serves the essay's dreamlike quality |
| **Deepening** | The sentence now carries more weight | Adding "his practiced fingers" — a sensory detail that grounds the pawnshop scene |
| **Meaning evolution** | The sentence communicates something different | "decided" -> "couldn't" — rational agency to emotional compulsion |
| **Voice/tone shift** | Same content, different register | "The experience was impactful" -> "That moment cracked something open" |
| **Structural reorganization** | Paragraphs moved, split, merged | Student reorders the pawnshop scene to open with the diamond, not the lights |
| **Simplification** | Content removed or compressed | Cutting the grandfather's backstory to a single sentence |
| **Expansion** | New content added | Adding a new paragraph about the grandmother's reaction |

These are not mutually exclusive. A change can be both a deepening and a voice shift. The LLM captures the full character of the change.

**Apparent Purpose**: A tentative inference about WHY the student made this change: "The student seems to be softening the essay's rational framework — three changes in this paragraph all move from analytical language to felt language." This inference is tagged as tentative. If the student discusses the edit in the Conversational Workshop, their stated intent supersedes this inference.

#### Step 3: Profile Mapping (Same Sonnet Call)

With its understanding of the change in hand, the LLM maps the impact to the profile. This happens in the same call as Step 2 — the LLM has all the context it needs.

**Connection impact**: For each connection involving the changed sentence, the LLM judges the effect:
- "The setup-payoff connection to P5S4 is NOT broken — the ring is still being kept. But the NATURE of the payoff changed. The connection transforms rather than breaks."
- "The echo connection to P1S3 is strengthened — 'couldn't' echoes the grandmother's emotional attachment."
- "No impact on the contrast connection to P4S2."

This is qualitatively different from mechanical graph traversal, which can only say "this sentence has 3 connections, therefore check 3 sentences." The LLM understands WHETHER and HOW each connection is affected.

**Paragraph-level impact**: Does the change alter the paragraph's role, emotional register, or structural function? "Paragraph 4's role as the fulcrum is preserved, but its emotional quality shifted from resolve to vulnerability."

**Holistic impact**: Does this ripple into essay-level understanding? "This change affects the thematic architecture — the essay's thesis shifts from 'choosing inherited values' to 'being unable to escape inherited values.' It affects voice identity — the rational register of 'decided' is replaced by the emotional register of 'couldn't.'"

**What does NOT need updating**: Equally important — the LLM identifies what is unaffected. "Paragraph 1's understanding is unaffected. The connection graph structure is intact. The emotional earned-ness map for P4's climax is actually STRENGTHENED."

#### Step 4: Scope Recommendation (Same Sonnet Call, Final Output)

Based on everything above, the LLM recommends the analysis scope with reasoning:

**Sentence-level update**: "This change is well-contained. Update P2S4's understanding and check its two connections. No holistic work needed." -> Cost: ~$0.02-0.04

**Paragraph-level re-analysis**: "The voice shift across three sentences changes how this paragraph functions. Re-walk paragraph 2's understanding." -> Cost: ~$0.05-0.10

**Targeted holistic refresh**: "The meaning evolution in the fulcrum sentence alters the thematic architecture and voice identity. Update the changed sentence, its connections, and refresh those two holistic sections." -> Cost: ~$0.08-0.15

**Comprehensive re-analysis**: "The student inserted a new paragraph and reordered two others. The essay's structural skeleton changed." -> Cost: ~$0.15-0.50

The scope recommendation includes reasoning that gets logged for the double-check loop and future calibration.

### The EditUnderstanding Type

```typescript
interface EditUnderstanding {
  /** Unique ID for this understanding (for version record tracking) */
  id: string;

  /** Timestamp */
  timestamp: number;

  /** The raw diff this understanding was derived from */
  changeDetection: ChangeDetectionOutput;

  /** Step 2: What the change MEANS */
  significance: {
    level: 'trivial' | 'low' | 'moderate' | 'high' | 'critical';
    reasoning: string;
    confidence: number;  // 0-1
  };

  changeTypes: Array<{
    type: 'refinement' | 'deepening' | 'meaning_evolution' | 'voice_shift'
        | 'structural_reorganization' | 'simplification' | 'expansion';
    description: string;
    /** Which specific change(s) this classification applies to */
    appliesTo: Array<{ paragraph: number; sentence: number }>;
  }>;

  apparentPurpose: {
    inference: string;
    confidence: number;  // 0-1
    /** Superseded if student explains their intent via workshop conversation */
    supersededByConversation: boolean;
  };

  /** Step 3: What profile sections are affected */
  profileMapping: {
    /** Direct impact -- always needs updating */
    directImpact: Array<{
      paragraph: number;
      sentence: number;
      impactType: 'understanding_stale' | 'understanding_wrong' | 'analysis_stale';
    }>;

    /** Connection impact -- which connections need verification */
    connectionImpact: Array<{
      connectionId: string;
      impact: 'broken' | 'transformed' | 'strengthened' | 'weakened' | 'unaffected';
      reasoning: string;
    }>;

    /** Paragraph-level impact -- does the paragraph's role/register change? */
    paragraphImpact: Array<{
      paragraphIndex: number;
      affected: boolean;
      description: string;
    }>;

    /** Holistic sections affected */
    holisticImpact: {
      voiceIdentity: boolean;
      thematicArchitecture: boolean;
      narrativeStrategy: boolean;
      emotionalTopography: boolean;
      characterRevelation: boolean;
      craftAssessment: boolean;
      admissionsPositioning: boolean;
      northStar: boolean;
    };

    /** What is explicitly NOT affected (the LLM's "all clear" for these areas) */
    unaffected: string[];
  };

  /** Step 4: Recommended analysis scope */
  scopeRecommendation: {
    scope: 'sentence' | 'paragraph' | 'holistic_refresh' | 'comprehensive';
    reasoning: string;
    /** Specific targets if scope is sentence or paragraph */
    targets?: Array<{ paragraph: number; sentence?: number }>;
    /** Which holistic sections to refresh if scope is holistic_refresh */
    holisticSections?: string[];
  };
}
```

### Cost Model

**Per-edit costs** (the full pipeline):

| Step | Cost | When |
|------|------|------|
| Haiku pre-filter | ~$0.001 | Every edit |
| Sonnet understanding call | ~$0.02-0.05 | Real content changes only |
| **Total per meaningful edit** | **~$0.02-0.05** | -- |

**Session cost estimates** (Edit Understanding pipeline only, not including re-analysis):

| Editing pattern | Haiku cost | Sonnet cost | Total |
|----------------|-----------|-------------|-------|
| 30 edits (20 trivial + 10 meaningful) | ~$0.02 | ~$0.30 | ~$0.32 |
| 50 edits (35 trivial + 15 meaningful) | ~$0.05 | ~$0.50 | ~$0.55 |
| Light session (10 edits, 7 trivial + 3 meaningful) | ~$0.01 | ~$0.10 | ~$0.11 |

**Debounce batching reduces cost further**: Rapid consecutive edits (within 1.5s) are collapsed into one understanding call. The Sonnet call processes the accumulated diff, not each individual keystroke.

**Cost control for very active editors**: After 10+ understanding calls in a session, the system groups subsequent edits into larger batches (5-minute windows) and processes them together. The workshop shifts from per-edit conversation to periodic check-ins: "You've been making a lot of changes to paragraphs 2 and 3 — want to talk about what you're working toward?"

### Escalation During Analysis

The system starts at the scope the Edit Understanding pipeline recommended, but can widen mid-analysis if the actual re-analysis work reveals broader impact than expected:

- A sentence-level update discovers that the meaning shift broke a connection to a thesis-carrying sentence -> escalates to targeted holistic refresh
- A paragraph re-walk produces back-propagations that cross the edit boundary -> escalates to comprehensive
- A holistic refresh reveals that the voice identity shifted fundamentally -> escalates to comprehensive

This is a safety net: the LLM's initial scope judgment is usually right, but when the actual analysis work uncovers surprises, the system widens rather than producing a stale profile.

**Circuit breaker** (review finding S10): If analysis crashes repeatedly on the same section (e.g., malformed Sonnet output), max 3 retries per checkpoint. After 3 failures, mark the analysis as failed with error details and alert the student: "We're having trouble analyzing this section." Do not loop.

### Integration with the Conversational Workshop

The Edit Understanding pipeline's output feeds directly into the workshop's conversational ability. Instead of "you made a change in P4S3," the workshop can say:

"You changed 'decided to keep the ring' to 'couldn't let it go.' That's interesting — 'decided' framed this as a rational choice you made. 'Couldn't' suggests something deeper, like the ring has a hold on you that's beyond reason. Is that what you're going for? Because that shift changes how your whole essay reads — instead of arguing for inherited values, you're showing how inherited attachments work on us even when we don't choose them."

This is the payoff of LLM-powered edit understanding. The workshop does not just notice the edit — it UNDERSTANDS it and can have an intelligent conversation about it.

### Edge Cases & Risks

**Multiple simultaneous changes across paragraphs**: The student makes changes to P1, P3, and P5 in one submission. The understanding call receives all three diffs together and can see cross-paragraph patterns: "All three changes move from analytical to felt language — the student is doing a voice revision, not fixing individual sentences." This holistic view is another advantage of LLM understanding over mechanical per-sentence analysis.

**Over-interpretation risk**: The LLM might read profound significance into a casual word swap. Mitigation: the understanding output includes a confidence level. Low-confidence interpretations are logged but do not trigger escalation unless confirmed by subsequent analysis or the student. The Conversational Workshop can ground-truth by asking the student.

**Under-interpretation risk**: The LLM might miss a subtle but important change buried among many edits. Mitigation: the double-check loop (Section B, Pathway 2) compares the edit understanding's assessment against re-analysis findings. Systematic under-interpretation is caught and calibrated.

**The "not" problem**: No longer a special case. The LLM naturally understands that adding "not" inverts meaning. It does not need a magnitude threshold to tell it this is significant — it reads the words and knows.

---

## Section B: Two-Pathway Edit Handling

### The Paradigm Shift

The old docs/specs/PLAN.md treated every edit as a trigger for analysis. The system was always reacting — detecting a change, classifying its impact, re-walking, re-analyzing. This creates three fundamental problems:

**Waste.** Most edits during active writing are exploratory. The student tries something, decides against it, tries something else. Analyzing each attempt burns cost and latency on versions that will not survive five minutes.

**Blindness.** Without conversation context, re-analysis stares at changed text and has to independently reconstruct what the student was trying to do. This is like reading a diff without the commit message — you can see WHAT changed but not WHY.

**Disruption.** Constant analysis results popping up while the student is actively editing breaks their creative flow.

The new design recognizes that editing an essay is a *process*, not a series of isolated events. Two distinct pathways match how students actually work:

```
+--------------------------------------+    +--------------------------------------+
| PATHWAY 1                            |    | PATHWAY 2                            |
| Conversational Edit Workshop         |    | Version-Based Re-Analysis            |
|                                      |    |                                      |
| Active while student is editing      |    | Triggered deliberately               |
| Light, responsive, conversational    |    | Student says "fresh read" or system  |
| Captures intent, not evaluation      |    | suggests it                          |
| Profile stays structurally sound     |    |                                      |
| Cost: ~$0.03-0.08/session            |    | Uses accumulated context from P1     |
|                                      |    | Full analytical depth                |
| Think: workshop assistant watching   |    | Cost: 20-40% cheaper than blind      |
| you write, asking "what are you      |    | re-analysis because it knows where   |
| going for?"                          |    | to focus and why things changed      |
+--------------------------------------+    +--------------------------------------+
                    |                                        |
                    |         +----------------+             |
                    +-------->| Version Record |<------------+
                              | (shared state) |
                              +----------------+
```

Think of a writing tutor. They do not stop you mid-sentence to analyze your grammar. They watch you write, ask "what are you going for there?" when something interesting happens, and when you put the pen down and say "what do you think?", they give you a considered, informed reading.

### When Does Each Pathway Activate?

| Situation | Pathway | Why |
|-----------|---------|-----|
| Student is actively editing | Pathway 1 automatically | Light-touch companion, does not interrupt flow |
| Student clicks "Get Fresh Analysis" | Pathway 2 | Deliberate request for deep re-read |
| System suggests re-analysis (cumulative changes, structural edits, declining reliability) | Pathway 2 (after student agrees) | Never auto-trigger; always a suggestion |
| Student has not requested analysis but profile is heavily stale | System suggests Pathway 2 | "My understanding is getting thin — a fresh analysis would help" |

The student can always trigger Pathway 2 manually, at any time, for any reason. Pathway 1 runs automatically but respects the student's editing rhythm.

### Pathway 1: Conversational Edit Workshop

The student is in the editor. They change "walked" to "drifted." What happens?

#### Significance Detection (Deterministic -- No LLM)

Per review finding S3, significance detection in Pathway 1 is deterministic, not LLM-based. This keeps the per-edit cost near zero:

1. **Diff ratio**: How much text changed? A single word in a 20-word sentence = low. Three sentences rewritten = high.
2. **ProfileIndex tag lookup**: Does the changed sentence carry structurally important tags? Tags like `thesis`, `fulcrum`, `voice:defining`, `connection:setup-payoff` elevate significance. An unmarked transitional sentence stays low.

The combination produces a significance score. Below threshold -> log silently. Above threshold -> generate a nudge.

**Not every change gets a comment.** Most word swaps in unremarkable sentences are logged silently — the system notes the change in the version record but says nothing. The student is not interrupted.

#### Adaptive Engagement Threshold

The threshold for generating a nudge is adaptive, matching the student's editing rhythm:

- **Early in session** (few changes): Lower threshold — each change is relatively significant
- **During rapid editing** (many changes in short time): Higher threshold — the student is in a flow state and should not be interrupted
- **After student engages** (responds to a nudge, asks follow-up): Lower threshold — the student wants conversation
- **After student ignores** (5+ nudges with no response): Higher threshold — respect the student's preference
- **Session boundary reset** (review finding M3): If the student leaves and returns the next day, the threshold resets. The version record persists, but editing rhythm restarts. A student who left mid-flow-state with a high threshold returns fresh.

#### Nudge Generation (Haiku -- Cheap)

Per review finding S3, nudge generation uses Haiku, not Sonnet. A nudge is a simple conversational question, not deep analysis:

"I noticed you changed the ending of your third paragraph — the one that carries the turn in your narrative. Tell me what you're going for with the new version?"

Haiku generates this from: the sentence's ProfileIndex tags + the change type (from the deterministic classification) + a template. Cost: ~$0.002 per nudge.

#### Response Processing (Sonnet -- When Student Engages)

When the student responds to a nudge, the response goes through Sonnet processing. This is where real intelligence lives:

- **Insight extraction** (review finding S2): Haiku does both L6 classification AND insight taxonomy in a single call. The classification drives Profile Manager action (confirmation, reinterpretation, new context, correction, preference, clarification, emotional reaction, resistance). The insight taxonomy enriches the version record.
- **Workshop conversation**: If the student asks a follow-up or seems uncertain, Sonnet draws on existing profile understanding to help them think through the change. "Your original ending created a sharp contrast with paragraph 4's opening. The new version softens that contrast — which could work if you want a more gradual emotional transition. Does that match what you're going for?"

No scoring, no evaluation in the conversation — just helping the student think.

#### Light-Touch Profile Updates (Minimal, Defensive)

When the student edits through Pathway 1, the essay text has changed but the profile has not been re-analyzed. The conversational pathway makes minimal, defensive adjustments to keep the profile coherent without doing real analysis.

**What gets updated immediately** (mechanical, not analytical):
- **Sentence text references**: If the profile references the text of a changed sentence, the reference is updated to the new text
- **Structural bookkeeping**: If sentences are added or deleted, the paragraph's sentence count and indices are adjusted. Connection references are remapped if their endpoints moved.
- **Staleness markers**: Changed sentences and their connected sentences get flagged as "stale"

**Staleness depth limits** (review finding S1): In well-connected essays, unrestricted staleness propagation marks half the profile stale after a few edits. This degrades fastest for the students who benefit most (strong essays with rich connections). The fix:

| Staleness depth | Strength | Effect on re-analysis suggestion |
|----------------|----------|----------------------------------|
| Direct (the changed sentence) | Strong | Counts toward suggestion threshold |
| 1-hop connection | Moderate | Counted at 0.5x weight |
| 2-hop connection | Weak/informational | Logged but does not count toward threshold |

Re-analysis suggestions trigger on strong-staleness count, not total staleness.

**What gets a light adjustment** (when conversation context exists):
- **Inferred intents**: If the student explained their intent behind a change, the sentence's `inferredIntents` can be updated with the student's own words. The student is the authority on their own intent.
- **Version record notes**: If the workshop detected that a change aligns with or contradicts the essay's existing voice/theme (a cheap check against the ProfileIndex), a note is added to the version record for re-analysis to verify.

**What does NOT get updated**:
- Effectiveness scores, strength/weakness assessments, or any evaluative analysis. These require the LLM to actually read and judge the new text.
- Holistic sections (voice identity, thematic architecture, narrative strategy). These are too interconnected to update partially.
- Connection semantics. If a connection existed based on a shared metaphor and the student changed one endpoint, the system flags the connection as "needs verification" but does not decide whether it still holds.

The philosophy is: **keep the profile structurally sound and honestly marked** (we know what is stale, we know what the student intended), rather than attempting analytical updates that might be wrong. Light-touch adjustments are hypotheses, not conclusions. Re-analysis will verify them.

**Concurrency model** (review finding M8): Light-touch updates (text reference updates, staleness markers) use per-sentence row-level updates on `essay_sentence_analyses` — no profile-level optimistic lock needed. Only Profile Manager analytical mutations (from re-analysis) use the optimistic write lock. This means two browser tabs editing different paragraphs through Pathway 1 will not conflict unnecessarily.

#### Pathway 1 Cost Model (Revised per Review Finding S3)

| Component | Cost | Frequency |
|-----------|------|-----------|
| Significance detection | Free (deterministic) | Every edit |
| Haiku nudge generation | ~$0.002 | ~3-5 per session |
| Sonnet response processing | ~$0.01-0.02 | ~2-3 per session (only when student engages) |
| Haiku insight extraction | ~$0.001 | Per student message |
| **Total per session** | **~$0.03-0.08** | -- |

This is dramatically cheaper than the old "analyze every edit" model, and the student gets a more natural experience.

### Pathway 2: Version-Based Re-Analysis

The student says "I'm ready for a fresh read" — or the system suggests it. By this point, the system has accumulated a rich context of what changed, why, and what the student was trying to achieve. Re-analysis is therefore *cheaper* (it knows where to focus), *better* (it understands the student's intent behind changes), and *more trustworthy* (it can double-check its own light-touch adjustments from Pathway 1).

#### The Re-Analysis Brief

The version record gets distilled into a re-analysis brief — a structured summary injected into the re-analysis prompts. It answers four questions for the LLM:

1. **What changed?** A structured diff at the paragraph and sentence level — not character-by-character, but semantically meaningful. "P2S4: word swap, 'walked' to 'drifted'. P3S5: full sentence rewrite. P1: new sentence inserted after S2."

2. **Why did it change?** The student's stated intents, quoted from conversations. "Student's goal for P3 rewrite: 'I want the reader to feel the weight of the diamond before I talk about what it means.'" Where no intent was captured: "No conversation context — student edited without discussion."

3. **What did we already tentatively assess?** The light-touch adjustments and staleness flags. "P2S4's intent was tentatively updated to 'dreamlike transition.' P3S5 is marked fully stale — no light-touch assessment attempted. The connection between P1S1 and P5S4 is flagged for verification."

4. **What is structurally significant about the changed areas?** (Review finding C3) Populated from the North Star's structural roles map. "P4S3 is the essay's fulcrum — the moment the student chooses to keep the ring. P2S4 bridges the pawnshop scene and the reflection. P1S2 establishes the sensory grounding." This prevents re-analysis from having to rediscover structural significance it already knows.

This brief replaces the blind "here's a changed essay, figure it out" approach. The LLM starts from a position of knowledge, not ignorance.

```typescript
interface ReAnalysisBrief {
  /** What changed since last analysis */
  changes: ChangeEntry[];

  /** Student's stated intents from workshop conversations */
  intents: Array<{
    changeRef: string;        // References a ChangeEntry.id
    studentStatement: string; // Quoted from conversation
    insightCategory: string;  // confirmation, reinterpretation, new_context, etc.
  }>;

  /** Light-touch adjustments made during Pathway 1 */
  lightTouchLog: LightTouchAdjustment[];

  /** Staleness summary -- what parts of the profile are how stale */
  stalenessMap: Array<{
    paragraph: number;
    sentence: number;
    depth: 'direct' | '1-hop' | '2-hop';
    staleSince: number;       // Timestamp
  }>;

  /** North Star structural context for changed areas */
  structuralSignificance: Array<{
    paragraph: number;
    sentence?: number;
    structuralRole: string;   // "fulcrum", "setup", "bridge", "payoff", etc.
    throughLineRelevance: string; // How this relates to the essay's central element
  }>;

  /** Conversation insights collected since last analysis */
  conversationInsights: Array<{
    category: string;
    scope: { paragraph: number; sentence?: number };
    content: string;
    confidence: number;
  }>;
}
```

#### How Accumulated Context Makes Re-Analysis Better

The re-analysis brief is not just cheaper — it is fundamentally more informed:

**Mode selection becomes more precise.** Changes that would have been classified as "ambiguous — default to comprehensive" can now be confidently routed to focused mode because we know from conversation context that the student was working on voice in one paragraph, not restructuring the essay. The conversation context acts as a free impact classifier, often more accurate than any algorithmic classification because it has the student's own words about their intent.

**Focused analysis prompts are better targeted.** Instead of "re-analyze P2," the prompt says "P2S4 changed from 'walked' to 'drifted' — the student said they want a dreamlike quality connecting to the fog imagery in P5. Evaluate whether 'drifted' achieves this and whether it changes the connection to P5S2." The LLM's analysis is surgically precise because it knows what to look for.

**Estimated savings**: 20-40% reduction in re-analysis cost for sessions where the student actively engaged with the conversational workshop.

#### The Double-Check Loop

After re-analysis completes, the system has two readings of the changed areas: the light-touch adjustments from Pathway 1 (quick, conversational, hypothesis-level) and the full re-analysis from Pathway 2 (thorough, LLM-evaluated, authoritative).

The double-check compares them:

**Agreement**: The light-touch adjustment said "P2S4's change strengthens the dreamlike quality" and re-analysis confirmed "drifted creates a dissociative quality that enhances the reflective tone." These align — the light-touch system's judgment was sound.

**Disagreement — light-touch missed something**: Re-analysis discovered that the word change in P2S4 actually broke a subtle rhythmic pattern that connected P2 to P4's pacing. The light-touch system did not catch this because it does not analyze craft at the inter-paragraph level. This is expected — it is exactly why re-analysis exists.

**Disagreement — light-touch was wrong**: The light-touch system flagged P3's rewrite as "likely improves the metaphor's physicality" based on the student's stated intent. Re-analysis found the rewrite actually made the metaphor more abstract — the student's intent did not match their execution. This is valuable feedback both for the student ("you wanted this to be more physical, but the new version moved in the opposite direction") and for system calibration.

Over time, the double-check results reveal patterns in the light-touch system's accuracy — structured comparison records ("light-touch predicted X, re-analysis found Y, delta = Z") that inform threshold tuning and prompt adjustment.

#### When to Suggest Re-Analysis

The student can always trigger re-analysis manually. But the system should also suggest it at the right moments.

**Signal-based suggestions**:
- **Cumulative change volume**: "You've edited 8 sentences across 3 paragraphs since your last analysis. Want a fresh read to see how it all fits together?" The threshold is adaptive per student — a student who typically makes 20 changes before requesting analysis has a higher threshold than one who requests after every 3.
- **Structural change**: "You added a new paragraph — the essay's structure has shifted. A fresh analysis would help me understand how everything flows now." Structural changes almost always warrant re-analysis; the suggestion is a strong nudge.
- **Thesis-area changes**: "You rewrote the sentence I identified as thesis-carrying. That's a significant change — want me to re-read with fresh eyes?" Changes to the essay's most structurally important elements get faster suggestions.
- **Declining profile reliability**: If strong-staleness markers pile up, the system recognizes its own declining reliability: "I've been tracking your changes but my understanding is getting thin. A fresh analysis would give us both a clearer picture."

**Anti-annoyance safeguards**:
- Never suggest more than once per editing session without the student making additional changes
- Never suggest during a rapid editing burst (respect the flow state)
- If the student dismisses a suggestion, wait for at least 5 more changes before suggesting again
- Frame suggestions as helpful, not prescriptive: "When you're ready" not "You should"

### TypeScript Types

```typescript
interface ChangeEntry {
  id: string;
  timestamp: number;

  /** Location of the change */
  location: {
    paragraph: number;
    sentence?: number;  // Undefined for paragraph-level structural changes
  };

  /** The actual change */
  oldText: string;
  newText: string;

  /** Deterministic classification from Pathway 1 significance detection */
  changeCategory: 'word_swap' | 'sentence_rewrite' | 'paragraph_rewrite'
                 | 'insertion' | 'deletion' | 'structural';

  /** Tags from ProfileIndex at time of change (for significance context) */
  sentenceTags?: string[];

  /** Optional: intent annotation from workshop conversation */
  intentAnnotation?: {
    studentStatement: string;
    insightCategory: string;
    conversationTimestamp: number;
  };
}

interface LightTouchAdjustment {
  timestamp: number;

  /** What was adjusted */
  target: {
    paragraph: number;
    sentence: number;
    field: 'text_reference' | 'index_remap' | 'staleness_marker'
         | 'inferred_intent' | 'connection_flag';
  };

  /** What the adjustment was */
  adjustment: string;

  /** Whether this was purely mechanical or based on conversation context */
  basis: 'mechanical' | 'conversation_derived';

  /** For double-check loop -- was this verified by re-analysis? */
  verified?: {
    reAnalysisRunId: string;
    agreement: 'confirmed' | 'missed_additional' | 'contradicted';
    details?: string;
  };
}

interface VersionRecord {
  id: string;

  /** Essay ID this version belongs to */
  essayId: string;

  /** Analysis run IDs that bookend this version */
  previousAnalysisId: string | null;  // null for first version
  nextAnalysisId: string | null;      // null until re-analysis runs

  /** Essay text at the start of this version (checkpoint) */
  baselineText: string;

  /** Running list of changes since baseline */
  changes: ChangeEntry[];

  /** Conversation insights collected during this version */
  conversationInsights: Array<{
    id: string;
    category: string;
    scope: { paragraph: number; sentence?: number };
    content: string;
    confidence: number;
    timestamp: number;
    /** Durability for cross-session persistence */
    durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';
  }>;

  /** Log of all light-touch profile adjustments */
  lightTouchLog: LightTouchAdjustment[];

  /** Re-analysis brief (populated when Pathway 2 is triggered) */
  reAnalysisBrief?: ReAnalysisBrief;

  /** Version lifecycle */
  createdAt: number;
  closedAt?: number;  // Set when re-analysis completes
  status: 'active' | 'closed' | 'failed';
}
```

---

## Section C: Version Tracking

### What a "Version" Is

A version is not every keystroke, and it is not every save. A version is the accumulated state of the essay between two analysis points — the text the student had when analysis last ran, and the text they have now. But the text is only half the story. A version also carries a changelog with intent annotations — a structured record of what changed and, crucially, why.

Think of it as the space between two commits. The version record is the diff, the commit messages, the PR comments, and the code review notes — everything that happened between the two states.

### What Gets Stored

The version record grows incrementally as the student edits. Each component serves a specific purpose:

| Component | What it captures | Size estimate | Purpose |
|-----------|-----------------|---------------|---------|
| **Baseline text** | Essay text at last analysis checkpoint | ~2-4KB | Enables full diff computation for re-analysis brief |
| **Change entries** | Each edit with timestamp, location, old/new text, type, optional intent | ~200-500 bytes each | The changelog — what physically happened |
| **Conversation insights** | Categorized student statements with scope and confidence | ~100-300 bytes each | The commit messages — why things happened |
| **Light-touch log** | Profile adjustments made during Pathway 1 | ~100-200 bytes each | Hypotheses for the double-check loop |

**Storage size estimate**: Even a student who makes 50 changes between analyses, with 10 conversation exchanges, produces a version record under 20KB. This is negligible — a single essay profile is 50-200KB.

### Version Lifecycle

```
+---------------------------------------------------------------------+
| Analysis Run #1 completes                                           |
|   -> Version V1 CREATED (status: active)                            |
|   -> baselineText = essay text at analysis completion                |
|   -> previousAnalysisId = run #1                                    |
|                                                                     |
| Student edits...                                                    |
|   -> changes[] grows with each edit                                  |
|   -> conversationInsights[] grows with each workshop exchange        |
|   -> lightTouchLog[] grows with each profile adjustment              |
|                                                                     |
| Student requests re-analysis (or system suggests and student agrees) |
|   -> reAnalysisBrief computed from accumulated version data          |
|   -> Analysis Run #2 begins, using the brief                        |
|   -> Analysis Run #2 completes                                      |
|   -> Version V1 CLOSED (status: closed, closedAt set)               |
|   -> nextAnalysisId = run #2                                        |
|   -> Version V2 CREATED (status: active)                            |
|   -> V2.baselineText = essay text at run #2 completion              |
|   -> V2.previousAnalysisId = run #2                                 |
|                                                                     |
| Cycle continues...                                                  |
+---------------------------------------------------------------------+
```

**Cross-session persistence**: Version records persist across sessions. If the student leaves and comes back tomorrow, the active version record is still there with all accumulated changes and insights. The conversational workshop picks up where it left off. The engagement threshold resets (review finding M3), but the version data does not.

**Pruning**: Closed version records are retained for the double-check calibration loop but are not loaded into active memory. After re-analysis verifies light-touch adjustments and produces comparison records, the closed version's raw data is archived. Only the comparison records (for calibration) and conversation insights tagged as `essay_durable` or `student_durable` persist in active storage.

### Version Comparison: Beyond Text Diffs

When re-analysis runs, it does not just compare text. The version record enables a much richer comparison:

**Text diff** (what changed): Computed from baseline text vs current text. The change entries provide the granular history, but the final diff is what matters for re-analysis.

**Intent diff** (why it changed): Which changes have conversation context and which do not. Changes with known intent can be analyzed more precisely — the LLM evaluates whether the execution matches the intent. Changes without intent need independent investigation.

**Profile evolution** (what the profile did): The light-touch log shows how the profile was adjusted during Pathway 1. Re-analysis verifies these adjustments, producing the double-check comparison records.

**Pattern recognition** (how the student worked): The change entries reveal editing patterns:
- All changes in one paragraph -> focused rewrite, rest of essay stable
- Changes concentrated on voice-carrying sentences -> voice revision
- Mix of additions and deletions -> structural experimentation
- Many small word swaps -> polishing pass

These patterns inform mode selection for re-analysis. A focused rewrite in one paragraph -> partial comprehensive for that paragraph, focused for the rest. A polishing pass across the essay -> focused mode for each changed sentence.

### Net Change Computation

The version record captures every individual edit, but re-analysis cares about the NET change. A student who changes a sentence three times (A -> B -> C -> D) creates three change entries, but the re-analysis brief presents the net result: "P2S4 changed from A to D."

**Reverted changes**: If the student changes a sentence and then changes it back (A -> B -> A), the net change is zero. The re-analysis brief notes this: "P2S4 was edited but returned to its original form." The conversation insight ("student considered changing this but decided against it") is still captured and potentially valuable — it reveals something about the student's relationship to that sentence.

**Partially reverted changes**: The student changes "I walked to my desk" -> "I drifted to my desk" -> "I drifted toward my desk." Two change entries, net result: "walked" -> "drifted toward." The re-analysis brief presents the net change, but the version record preserves the intermediate step in case the double-check loop needs the full history.

### Database Storage

Version records map to the `essay_version_records` table (per review finding C1):

```typescript
// Database table: essay_version_records
// One row per change entry -- lightweight, append-only during editing
interface VersionRecordRow {
  id: string;                        // UUID
  essay_id: string;                  // FK to essays
  user_id: string;                   // Clerk user ID (TEXT, not UUID)
  version_id: string;               // Groups rows into a version
  previous_analysis_id: string | null;
  next_analysis_id: string | null;

  // The baseline text is stored once per version (first row or separate table)
  baseline_text?: string;

  // Change entry data
  entry_type: 'change' | 'conversation_insight' | 'light_touch_adjustment';
  paragraph_index: number;
  sentence_index: number | null;
  old_text: string | null;
  new_text: string | null;
  change_category: string | null;
  intent_annotation: object | null;  // JSONB
  insight_data: object | null;       // JSONB (for conversation insights)
  adjustment_data: object | null;    // JSONB (for light-touch log entries)

  // Lifecycle
  created_at: timestamp;
  status: 'active' | 'closed' | 'failed';

  // Double-check verification (populated after re-analysis)
  verification: object | null;       // JSONB
}
```

**Why per-entry rows instead of a single JSONB blob**: Each change entry is appended independently during editing. Per-row storage means no read-modify-write cycle, no contention from concurrent edits (review finding M8), and the ability to query individual changes ("show me all changes to paragraph 2 since last analysis") without loading the entire version record.

**RLS**: Standard user-scoped RLS. `WHERE user_id = auth.uid()` on all queries.

### Edge Cases

**Failed re-analysis**: If re-analysis fails (crashes, timeout, budget exceeded), the version record stays active (`status: 'active'`). The student can continue editing, and the version record continues accumulating. The next re-analysis attempt uses the full accumulated context. The failed attempt is logged but does not close the version.

**Very long versions**: A student who makes 200+ changes without requesting re-analysis produces a large version record. The re-analysis brief summarizes rather than includes every change — grouping by paragraph, presenting net changes, and surfacing the most significant conversation insights. The full change log is available for the double-check loop but does not bloat the re-analysis prompt.

**First analysis**: Before the first analysis, there is no previous analysis and no baseline text. The version record for the first version is created when the student starts editing (baseline = empty or initial text). The first analysis does not use a re-analysis brief — it runs the full pipeline from scratch.

---

## Section D: Analysis Modes -- Comprehensive vs Focused (Updated)

The old Analysis Modes section used a Haiku impact classifier to decide between Comprehensive and Focused modes. That classifier is replaced by the Edit Understanding Pipeline's scope recommendation. The two-pathway model also changes when and how each mode is triggered.

### Why Two Modes (Unchanged Rationale, Updated Mechanism)

As the profile gets deeper, re-analysis should get **narrower but MORE surgical**. A comprehensive profile IS your depth — you do not need to re-earn it every round. You need to LEVERAGE it as the foundation for focused, precise analysis of what actually changed.

The difference from the old design: mode selection is no longer a function of mechanical text change ratios and profile confidence levels alone. The Edit Understanding Pipeline's Sonnet-powered scope recommendation provides genuinely informed mode selection — the system has already UNDERSTOOD the change before deciding how to analyze it.

### Mode Decision Logic (Updated)

```typescript
function selectAnalysisMode(
  profile: EssayProfile,
  editUnderstanding: EditUnderstanding | null,
  versionRecord: VersionRecord | null,
): 'comprehensive' | 'focused' {
  // ── No existing deep profile -> comprehensive (nothing to leverage) ──
  if (profile.index.confidenceLevel === 'initial' ||
      profile.index.confidenceLevel === 'developing') {
    return 'comprehensive';
  }

  // ── No edit understanding (first analysis, or manual trigger without
  //    going through the Edit Understanding Pipeline) -> comprehensive ──
  if (!editUnderstanding) {
    return 'comprehensive';
  }

  // ── Edit Understanding scope recommendation drives the decision ──
  const scope = editUnderstanding.scopeRecommendation.scope;

  // Comprehensive scope recommended by Edit Understanding Pipeline
  if (scope === 'comprehensive') {
    return 'comprehensive';
  }

  // Structural changes always go comprehensive, regardless of scope rec
  // (safety net — the pipeline should already recommend comprehensive,
  //  but structural changes are too important to risk a focused miss)
  if (editUnderstanding.changeDetection.structuralChanges.length > 0) {
    return 'comprehensive';
  }

  // Conversation context can NARROW scope: if the version record has
  // student-stated intents explaining the changes, we can be more
  // confident that focused mode will catch everything
  const hasConversationContext = versionRecord?.conversationInsights
    .some(i => i.confidence > 0.7) ?? false;

  // High-significance changes without conversation context ->
  // default to comprehensive (we don't fully understand the intent)
  if (editUnderstanding.significance.level === 'critical' &&
      !hasConversationContext) {
    return 'comprehensive';
  }

  // Holistic refresh recommended -> comprehensive (but targeted)
  // The re-analysis will use the scope rec's holisticSections list
  // to focus only on affected holistic sections
  if (scope === 'holistic_refresh') {
    // Comprehensive, but the re-analysis brief narrows the actual work
    return 'comprehensive';
  }

  // Sentence or paragraph scope with deep profile -> FOCUSED
  if (scope === 'sentence' || scope === 'paragraph') {
    return 'focused';
  }

  // Default: comprehensive (safe)
  return 'comprehensive';
}
```

**Key change from old design**: The old `selectAnalysisMode` checked `textChangeRatio > 0.30` and counted significant rewrites. Those mechanical thresholds are gone. The Edit Understanding Pipeline has already read the actual words and judged significance contextually. A 50% text change ratio that preserves paragraph function routes to focused mode. A 3% text change ratio that shifts the thesis routes to comprehensive.

### Comprehensive Mode (Updated for Two-Pathway Integration)

Comprehensive mode runs the full pipeline subset appropriate for re-analysis: L1 re-impressions for changed paragraphs, Connection Scout refresh, L3 Understanding re-walk from the edit point, L3.75 Holistic Synthesis refresh, L3.5 Analysis Pass for affected paragraphs, L4+L5 re-crystallization and feedback.

**What is NEW**: The re-analysis brief is injected into every re-analysis prompt. The LLM is not discovering changes from scratch — it knows what changed, why the student changed it (when intent is available), and what structural roles the changed areas play.

**When triggered**:
- First analysis (no prior profile)
- Pathway 2 re-analysis when Edit Understanding recommends comprehensive scope
- Structural edits (insertion, deletion, reorder)
- Critical significance edits without conversation context
- Profile confidence below 'deep'

**Structural edit handling** (from old "Incremental Update" section, updated):

**Paragraph insertion** (e.g., new P3 inserted between old P2 and P3):
1. Remap ALL indices via `essayProfileManager.remapIndices()`
2. New paragraph gets full L1 first impressions
3. Re-run Connection Scout on full essay (new paragraph may connect to anything)
4. RE-WALK from the inserted paragraph forward (new P3 -> P4 -> P5 -> P6)
5. Back-propagations to P1-P2 applied as normal
6. Full L3.5 re-analysis (structural change affects every paragraph's effectiveness)
7. Re-crystallize + re-annotate
8. Re-analysis brief provides: why the student added this paragraph (if discussed), what the surrounding paragraphs' structural roles are

**Paragraph deletion** (e.g., P3 removed):
1. Remove P3's profile entry and all connections with P3 as an endpoint
2. Remap indices via `essayProfileManager.remapIndices()`
3. Re-run Connection Scout (connections through deleted paragraph may be orphaned)
4. RE-WALK from the deletion point forward (new P3 -> P4 -> P5)
5. Full L3.5 re-analysis
6. Re-crystallize + re-annotate (holistic sections likely shifted significantly)
7. Re-analysis brief provides: why the student deleted it (if discussed), what connections are now orphaned

**Paragraph reorder** (e.g., P2 and P4 swapped):
1. Remap all indices, connectionRefs, Profile Index
2. Re-run Connection Scout
3. Full re-walk from the earliest moved paragraph (the sequential understanding is broken)
4. Full L3.5 re-analysis
5. Re-crystallize + re-annotate
6. Cost: nearly equivalent to full analysis (~$0.40-0.80)
7. Re-analysis brief provides: what the student hoped to achieve with the reorder

**Index remapping implementation** (`essayProfileManager.ts`):
```typescript
function remapIndices(profile: EssayProfile, mapping: Map<number, number>): void {
  // Remap connection endpoints
  for (const conn of profile.connections.all) {
    conn.from[0] = mapping.get(conn.from[0]) ?? conn.from[0];
    conn.to[0] = mapping.get(conn.to[0]) ?? conn.to[0];
  }
  // Remap connectionRefs on sentences (IDs don't change, but paragraph indices do)
  // Remap Profile Index paragraphDigest entries
  // Remap holistic section references (pivotPoints, peakMoments, etc.)
  // Remap strengthsFound/weaknessesFound paragraph references
}
```

### Focused Mode (Updated to Use Edit Understanding Pipeline)

Focused mode is NOT "cheaper comprehensive" — it is a fundamentally different analytical lens. **More magnification, narrower aperture.** The LLM's depth-per-token is HIGHER because it is not spreading across the full essay.

**When triggered**: Edit Understanding recommends sentence or paragraph scope AND profile confidence is 'deep' or 'comprehensive'.

**The Focused Mode Pipeline (Updated)**:

```
1. EDIT UNDERSTANDING (already completed -- from Section A)
   The Edit Understanding Pipeline has already run. We have:
   - Significance assessment (contextual, not mechanical)
   - Change type classification (refinement, deepening, meaning_evolution, etc.)
   - Profile mapping (what is affected, what is NOT)
   - Scope recommendation (sentence or paragraph)
   This REPLACES the old Step 2 "Impact Classification (Haiku, ~$0.002)"

2. FOCUSED UNDERSTANDING UPDATE (single Sonnet call, ~$0.02-0.04)
   Input:
   - The changed sentence's CURRENT understanding from the profile
     (observation labels [U1], [U2] rendered for reference)
   - The specific text change (old -> new)
   - The Edit Understanding's significance + change types + apparent purpose
   - Relevant profile context loaded via Profile Router based on the
     Edit Understanding's profile mapping (not generic impact classification):
     paragraph understanding, connected sentences, relevant holistic sections
   - The re-analysis brief (if triggered via Pathway 2)

   Prompt:
   "Here is P2S4's CURRENT understanding from the profile:
    [U1] 'Transitions the reader from the pawnshop to the writing desk'
    [U2] 'Slows the pacing to signal reflection'

    The student changed: 'I walked to my desk' -> 'I drifted to my desk'

    Edit Understanding assessment: Refinement + voice shift. The word
    'drifted' introduces a dreamlike quality that aligns with the fog
    imagery in P5. Moderate significance — the sentence's transitional
    function is preserved but its emotional register changed.

    Student's stated intent (from workshop): 'I wanted it to feel more
    dreamlike, connecting to the fog in paragraph 5.'

    Given the profile context:
    - How does this word change affect P2S4's understanding?
    - Does 'drifted' change any connections, voice reading, or thematic contributions?
    - Does this ripple beyond P2S4? If so, what SPECIFICALLY changes?"

   Output:
   - Updated understanding for the changed sentence (supersession)
   - Ripple flags: { beyondSentence: boolean; beyondParagraph: boolean;
     holisticShift: boolean; specificRipples: string[] }
   - Any new/removed connections

3. FOCUSED ANALYSIS UPDATE (single Sonnet call, ~$0.02-0.04)
   Input:
   - Updated understanding from step 2
   - Previous analysis for the changed sentence
   - Current improvement phase
   - The Edit Understanding's change types (so the analysis knows WHAT
     kind of change to evaluate, not just that something changed)

   Prompt:
   "P2S4's understanding was updated: [new understanding].
    Previous analysis: effectiveness 72, weakness: 'walked is generic.'
    Change type: refinement + voice shift.

    Re-evaluate P2S4 with the new word choice.
    Does the weakness resolve? Any new strengths?
    Does paragraph-level effectiveness shift?"

   Output:
   - Updated analysis for the changed sentence (supersession)
   - Paragraph-level effectiveness delta (if any)

4. RIPPLE HANDLING (conditional -- only if flagged in step 2)
   The escalation ladder. Each step is a DECISION POINT, not automatic:

   +-------------------------------------------------------------------------+
   | Word-level focus (1 sentence) -> no ripple -> DONE                      |
   |                                -> ripple beyond sentence ->              |
   | Paragraph-level focus (1 paragraph re-analysis) -> no broader -> DONE   |
   |                                                  -> holistic shift ->   |
   | Section-level focus (holistic section re-synthesis) -> stable -> DONE   |
   |                                                     -> thesis/voice -> |
   | Comprehensive mode (full re-analysis)                                    |
   +-------------------------------------------------------------------------+

   Most Round 4+ changes resolve at the first step. Occasionally one ripples
   to paragraph level. Rarely to comprehensive. The escalation ladder catches
   the edge cases without paying the comprehensive cost on every edit.

   KEY IMPROVEMENT: The escalation decision is informed by the Edit
   Understanding's profile mapping. If the mapping said "no holistic impact,"
   the escalation is less likely to reach section-level. If it said "thematic
   architecture affected," escalation to section-level is expected.

5. PHASE-AWARE FEEDBACK GENERATION
   Generate feedback at the current improvement phase zoom level.
   Profile preserved; only changed parts updated.
   If the focused analysis changed the phase (e.g., fixing the last
   sentence-level issue shifts Craft -> Polish), update ProfileIndex.
```

### Why Focused Mode Produces BETTER Results for Small Changes

This is counterintuitive but critical: focused mode is not just cheaper — it is actually **higher quality** for surgical edits.

| Dimension | Comprehensive re-analysis | Focused analysis |
|-----------|---------------------------|------------------|
| **Cognitive focus** | Sonnet spreads across entire paragraph (10+ sentences), most unchanged | Sonnet focuses 100% on the changed text + its immediate context |
| **Depth per token** | ~$0.03 per paragraph spread across everything | ~$0.04 concentrated on the change |
| **Context precision** | Generic "re-analyze P2" prompt | Specific "how does 'drifted' differ from 'walked' in this context?" prompt |
| **Change awareness** | LLM might not even notice the word change among 10 sentences | LLM's ENTIRE prompt is about the word change |
| **Existing understanding** | LLM rebuilds understanding from scratch (may drift from prior reading) | LLM STARTS from existing understanding, updates the delta |
| **Edit Understanding context** | No pre-digested understanding of the change | Full significance, classification, apparent purpose, and profile mapping already available |
| **Student intent** | Not available (re-analysis only sees text) | Available from Pathway 1 conversation (when student engaged) |

The last two points are new. The old design could not inject edit understanding or student intent into focused mode because those systems did not exist. The Edit Understanding Pipeline and Pathway 1 conversation together provide focused mode with context that comprehensive mode does not have.

### Risk Mitigation: Focused Mode Missing Secondary Effects

**Risk**: If "drifted" subtly shifts the emotional register of all of P2, a focused call on P2S4 alone might miss that.

**Mitigation (built into the pipeline, updated)**:

1. **Edit Understanding profile mapping** (replaces old impact classification) pre-assesses ripple potential with full contextual understanding. If the changed sentence carries thematic weight or is a voice-defining moment, the Edit Understanding pipeline flags holistic impact from the start — and the mode decision logic routes to comprehensive.

2. **Ripple flags in focused understanding update** (step 2) — the prompt explicitly asks "does this ripple beyond P2S4?" with enough profile context (P2's paragraph understanding, connections, voice reading) for the LLM to detect secondary effects.

3. **Escalation ladder** (step 4) — if ripples are detected, scope widens incrementally. Not to full comprehensive (overkill), but to exactly the scope needed. The Edit Understanding's profile mapping guides escalation: if it flagged "voice identity possibly affected," escalation to section-level voice refresh is a natural next step, not a surprise.

4. **Phase re-computation** — after every focused update, the improvement phase is re-checked. If the phase shifts (unlikely for small changes, but possible), the system adapts.

5. **Double-check loop** (from Pathway 2) — when re-analysis eventually runs, it compares its findings against all focused updates since the last full analysis. Systematic misses are caught and feed back into calibration.

**What could go wrong**: A focused call misses a subtle thematic ripple. Impact: one iteration of feedback is slightly less informed about a secondary effect. Self-correcting: the next time the student edits near that area OR triggers Pathway 2 re-analysis, the comprehensive context catches it. This is acceptable — the alternative (comprehensive re-analysis every time) is both more expensive and lower quality for small changes.

### Interaction: Analysis Modes x Two Pathways x Progressive Precision

These three systems reinforce each other:

```
Round 1: Full pipeline (no pathways yet -- first analysis).
  Mode: Comprehensive | Phase: Foundation
  Cost: ~$0.52-1.00 | Time: 30-45s

  Student works on thesis, restructures P3.
  -> Pathway 1 captures: "Student said thesis was unclear, wants the
    diamond to carry the central question"
  -> Pathway 1 flags: structural change (P3 restructured) + thesis edit

Round 2: Student requests re-analysis.
  Edit Understanding: structural_reorganization + meaning_evolution.
    Scope: comprehensive. Structural roles injected from North Star.
  Mode: Comprehensive (structural change) | Phase: Architecture
  Brief tells re-analysis: "Student restructured P3 to strengthen the
  diamond metaphor. P3's old ending replaced entirely. Student's goal:
  'the reader should feel the weight of the diamond.'"
  Cost: ~$0.25-0.40 (cheaper -- knows where to focus)

  Student improves transitions, rewrites P4.
  -> Pathway 1 captures: "Student wants gradual emotional transition
    between pawnshop and reflection"
  -> Pathway 1 notes: P4 rewrite, but role as fulcrum preserved

Round 3: Student requests re-analysis.
  Edit Understanding: deepening + voice_shift. Scope: paragraph.
    "P4's fulcrum role preserved but emotional register changed."
  Mode: Comprehensive (paragraph-level rewrite) | Phase: Craft
  Brief: focused on P4, knows student's transition goal, knows fulcrum
  is preserved. Re-analysis evaluates whether the new P4 achieves the
  gradual transition the student wanted.
  Cost: ~$0.15-0.30

  Student rewrites 3 specific sentences.
  -> Pathway 1: mostly silent (craft-level edits, low significance)
  -> Pathway 1 captures one nudge response: "I wanted P2S4 to feel
    more dreamlike"

Round 4: Student requests re-analysis.
  Edit Understanding: 3x refinement. Scope: sentence for each.
    One has student intent ("dreamlike"), two without.
  Mode: Focused (sentence-level edits against deep profile) | Phase: Polish
  Brief: 3 sentence changes, one with intent ("dreamlike"), two without.
  3 focused Sonnet calls, word-level feedback.
  Cost: ~$0.06-0.12

Round 5: Student tweaks 2 phrases.
  Edit Understanding: 2x refinement. Scope: sentence.
  Mode: Focused (micro) | Phase: Distinction
  2 focused calls, memorability feedback.
  Cost: ~$0.02-0.04
```

The acceleration curve: as the essay improves, Pathway 1 gets quieter (fewer significant changes to comment on), Pathway 2 gets cheaper (more focused mode, better briefs), and feedback gets more surgical (higher-phase zoom level). The system converges toward perfection through increasingly precise interventions.

---

## Section E: Updated Progressive Cost Curve

### Per-Event Costs (Updated with Edit Understanding + Two Pathways)

| Event | Pipeline Components | Cost | Time |
|-------|-------------------|------|------|
| First full analysis (L1-L3.75-L3.5-L4-L5) | Comprehensive, no brief | ~$0.52-1.00 | 30-45s |
| Edit Understanding per meaningful edit | Haiku pre-filter + Sonnet understanding | ~$0.02-0.05 | 1-3s |
| Edit Understanding per trivial edit | Haiku pre-filter only | ~$0.001 | <1s |
| Conversational workshop session | Pathway 1 (nudges + responses) | ~$0.03-0.08 | ongoing |
| Structural edit re-analysis (via Pathway 2) | Comprehensive + brief | ~$0.25-0.40 | 20-30s |
| Major paragraph rewrite (via Pathway 2) | Comprehensive (partial) + brief | ~$0.12-0.28 | 12-18s |
| Multiple sentence rewrites (via Pathway 2) | Focused + brief | ~$0.06-0.12 | 6-10s |
| Single sentence rewrite (via Pathway 2) | Focused + brief | ~$0.03-0.06 | 2-4s |
| Word-level change (via Pathway 2) | Focused + brief | ~$0.02-0.04 | 1-3s |
| Conversation turn (L6 coaching) | Profile-aware context routing | ~$0.01-0.02 | 1-3s |

**Cost reduction from conversation context**: Events marked "via Pathway 2" assume the re-analysis brief carries accumulated context from Pathway 1. When conversation context is rich (student actively engaged with the workshop), costs are at the LOWER end of each range — the brief narrows the analytical scope and the student's stated intents eliminate guesswork. When no conversation occurred, costs are at the UPPER end.

**Why Pathway 2 re-analysis is cheaper than the old model**:

| Old Model (analyze every edit) | New Model (Pathway 2 with brief) | Savings |
|-------------------------------|----------------------------------|---------|
| Blind re-analysis: "here's a changed essay, figure it out" | Informed re-analysis: "here's what changed, why, and where to focus" | 20-40% |
| Mode selection by mechanical ratios | Mode selection by Edit Understanding + conversation context | Better routing, fewer comprehensive-when-focused-would-suffice |
| Every edit triggers analysis | Only deliberate re-analysis trigger | Eliminates wasted analysis on exploratory edits |

### The Acceleration Curve (Typical Editing Session, Updated)

```
Round 1: Comprehensive. Full pipeline.
  Mode: Comprehensive | Phase: Foundation
  Analysis cost: ~$0.52-1.00 | Time: 30-45s             ||||||||||||||||||||
  Pathway 1 cost during editing: ~$0.04                  ||

Round 2: Student restructures P3, rewrites P4.
  Mode: Comprehensive (structural) | Phase: Architecture
  Analysis cost: ~$0.25-0.40 | Time: 20-30s              ||||||||||||||||
  Pathway 1 cost during editing: ~$0.05                  ||
  Edit understanding (2 meaningful edits): ~$0.06        |||

Round 3: Student rewrites P2S3-S5, improves P4S2.
  Mode: Focused (sentence-level) | Phase: Craft
  Analysis cost: ~$0.08-0.15 | Time: 8-12s               ||||||||
  Pathway 1 cost during editing: ~$0.03                  |
  Edit understanding (4 meaningful edits): ~$0.12        ||||||

Round 4: Student changes 3 words across P2-P3.
  Mode: Focused (word-level) | Phase: Polish
  Analysis cost: ~$0.03-0.06 | Time: 3-5s                |||
  Pathway 1 cost during editing: ~$0.02                  |
  Edit understanding (3 meaningful edits): ~$0.09        ||||

Round 5: Student tweaks P4S2 phrasing.
  Mode: Focused (micro) | Phase: Distinction
  Analysis cost: ~$0.02-0.04 | Time: 2-3s                ||
  Pathway 1 cost during editing: ~$0.01                  |
  Edit understanding (1 meaningful edit): ~$0.03         |

  + 10 coaching turns (L6) across session:               ~$0.10-0.20
  + ~15 trivial edits (typos, commas): ~$0.015           (negligible)
```

### Cumulative Session Cost (Updated)

| After | Analysis Cost | Edit Understanding Cost | Pathway 1 Cost | Cumulative Total | Notes |
|-------|-------------|----------------------|---------------|-----------------|-------|
| Round 1 | ~$0.52-1.00 | -- | ~$0.04 | ~$0.56-1.04 | Full deep understanding built |
| Round 2 | ~$0.25-0.40 | ~$0.06 | ~$0.05 | ~$0.92-1.55 | Structural issues resolved |
| Round 3 | ~$0.08-0.15 | ~$0.12 | ~$0.03 | ~$1.15-1.85 | Sentence-level craft improved |
| Round 4 | ~$0.03-0.06 | ~$0.09 | ~$0.02 | ~$1.29-2.02 | Word-level polish applied |
| Round 5 + coaching | ~$0.02-0.04 + ~$0.12 | ~$0.03 | ~$0.01 | ~$1.47-2.22 | Essay near-perfect |

**Budget assessment**: The typical session lands at ~$1.50-2.00, near the $2 ceiling. The Edit Understanding pipeline adds ~$0.30 in understanding calls across the session, but this is offset by:

1. **Pathway 1 eliminates wasted analysis** — exploratory edits that the student reverses never trigger re-analysis
2. **Better mode selection** — conversation context routes more edits to focused mode, which is 3-10x cheaper than comprehensive
3. **Informed re-analysis** — the brief reduces per-event analysis cost by 20-40%

For sessions with lighter editing (3 rounds instead of 5, fewer edits per round), total cost is ~$0.80-1.40, well under budget.

For heavy editing sessions (6+ rounds, 50+ edits), the adaptive batching for active editors (5-minute windows after 10+ understanding calls) caps the Edit Understanding cost at ~$0.50-0.60 regardless of edit count. Total session cost remains under ~$2.50, acceptable for intensive usage.

### Cost Breakdown by Component

| Component | Typical Session Cost | % of Total |
|-----------|---------------------|------------|
| First analysis (L1-L5) | ~$0.52-1.00 | 35-50% |
| Edit Understanding (all rounds) | ~$0.30-0.45 | 15-25% |
| Pathway 1 workshop | ~$0.15-0.25 | 8-12% |
| Pathway 2 re-analysis (all rounds) | ~$0.38-0.65 | 25-35% |
| L6 coaching turns | ~$0.10-0.20 | 5-10% |
| **Total** | **~$1.45-2.55** | **100%** |

The first analysis dominates. Every subsequent round costs less. The Edit Understanding pipeline is a fixed overhead per edit but enables the savings everywhere else. The investment pays for itself by Round 3.

---

## Appendix: Type Summary

All TypeScript interfaces defined in this document, collected for reference:

- **`ChangeDetectionOutput`** (Section A) -- mechanical diff output
- **`EditUnderstanding`** (Section A) -- the core output of the Edit Understanding Pipeline
- **`ReAnalysisBrief`** (Section B) -- structured context for Pathway 2 re-analysis
- **`ChangeEntry`** (Section B) -- individual change record in the version timeline
- **`LightTouchAdjustment`** (Section B) -- minimal profile adjustments from Pathway 1
- **`VersionRecord`** (Section C) -- accumulated state between two analysis points
- **`VersionRecordRow`** (Section C) -- database schema for version tracking

These types will be implemented in `src/services/essayIntelligence/types.ts` alongside the existing EssayProfile and related types.
