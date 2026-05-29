# PLAN.md Gap Analysis: Expanded Implementation Proposals (v2)

> **6-agent deep research swarm output — expanded with Tue's feedback.**
> Each section describes how the system works conceptually, why, and the risks.
> No code — concepts, reasoning, and scenarios only.
>
> **Deep-dive documents** (full designs, 1500-2500 words each):
> - `docs/EDIT_UNDERSTANDING_SYSTEM_DESIGN.md` — Edit detection, magnitude measurement, profile mapping
> - `docs/ESSAY_NORTH_STAR_DESIGN.md` — Holistic vision, through-lines, structural roles, trajectory
> - `docs/VERSION_BASED_REANALYSIS_AND_EDIT_WORKSHOP_DESIGN.md` — Dual pathway, version tracking, conversational workshop
> - `docs/DESIGN_TYPE_SYSTEM_PROFILE_MANAGER_VOICE_EMOTION.md` — Interconnected types, voice map, emotional earned-ness
> - `docs/ESSAY_INTELLIGENCE_DATABASE_ARCHITECTURE.md` — 15-table modular schema, access patterns, migration
>
> **How to read**: Each section has a summary of key decisions, then "For full detail, see [doc]." Your feedback determines what gets written into PLAN.md.

---

## Table of Contents

1. [Conversation Insight System](#1-conversation-insight-system)
2. [Edit Understanding & Change Mapping](#2-edit-understanding--change-mapping)
3. [Essay North Star (replaces EssayDNA)](#3-essay-north-star-replaces-essaydna)
4. [Version-Based Re-Analysis & Conversational Edit Workshop](#4-version-based-re-analysis--conversational-edit-workshop)
5. [Interconnected Type System, Voice Map & Emotional Earned-ness](#5-interconnected-type-system-voice-map--emotional-earned-ness)
6. [Profile Manager Excellence](#6-profile-manager-excellence)
7. [Database Architecture](#7-database-architecture)
8. [Rendering & Prompt Caching](#8-rendering--prompt-caching)

---

## 1. Conversation Insight System

### Vision

The Conversation Insight system is the bridge between the student's inner world and the system's analytical model. Every other layer reads the essay text and builds understanding outward. L6 is the only layer where information flows inward — the student tells us something the text alone could never reveal. When a student says "actually, the diamond is about my grandfather — he always said flawed things are more interesting," that statement is authoritative in a way no inference can be. It doesn't just update a field; it can reshape the entire profile's understanding.

The system should treat every student utterance as a potential signal — not just explicit revelations, but hesitations, corrections, patterns of what they keep returning to and what they avoid. A student who asks about paragraph 3 four times but never mentions paragraph 2 is telling us something about paragraph 2.

### How It Works

**The Insight Lifecycle** has four stages:

1. **Extraction**: During L6 coaching, focus detection already reads the student's message. Insight extraction extends this: in addition to "what is the student focused on," we ask "what did the student reveal?" A student might be focused on paragraph 2 but reveal something about their relationship with their grandmother that affects the entire essay.

2. **Categorization**: A layered taxonomy, not a flat enum. The primary category drives mechanical behavior (what the Profile Manager does). Secondary attributes drive nuanced response (how the coach adapts).

   **Primary categories** (drives Profile Manager action):
   - **Confirmation** — "Yes, that's exactly what I meant" → boosts confidence in existing understanding
   - **Reinterpretation** — "Actually, it's more about my grandfather" → replaces inferredIntents, triggers cascade check
   - **New context** — "I also volunteer at a food bank" → adds new understanding
   - **Correction** — "No, that sentence isn't about fear" → negates something we said, lowers confidence in related inferences
   - **Preference** — "I like the shorter version better" → records stylistic preference
   - **Clarification** — "What I meant was..." → refines existing understanding
   - **Emotional reaction** — "That paragraph makes me cringe" → carries signal about the student's relationship to their own writing (maybe technically strong but emotionally dishonest)
   - **Resistance** — "I know the transition is abrupt, but I want it that way" → asserts artistic intent, the system should probe for the reason rather than repeating the suggestion

   **Secondary attributes** (modulates nuance): emotional valence, confidence level, explicitness, scope certainty, novelty. A single statement can be captured as "reinterpretation, with strong emotional investment, high confidence, affecting essay-level understanding."

   New categories can be added to either layer without restructuring the other. The Profile Manager doesn't need to change; the coaching layer reads the new attribute and adapts.

3. **Scope Detection**: Treated as a probability distribution, not a point estimate. "I like the ending" has high probability of referring to the last paragraph, moderate for the last 2-3 sentences. Resolution comes from immediate context (did the coach just ask about a specific sentence?) and natural follow-up probing.

   Multi-scope insights are supported — "I wrote the first and last paragraphs together — they're meant to mirror each other" creates a connection between two paragraphs.

4. **Profile Integration & Downstream Propagation**: Each category maps to specific Profile Manager behavior:
   - **Direct update** — the targeted field is changed
   - **Cascade** — the change invalidates related understanding (e.g., reinterpreting the diamond → every holistic section referencing the imperfection theme is flagged stale)
   - **Connection creation** — insight reveals a link the analytical layers missed
   - **Phase shift** — significant insight changes the improvement phase

### Supersession Model

Instead of only full replacement, insights support **partial supersession**. "Yes, it's about imperfection, but specifically how imperfection makes things MORE valuable" — the core insight (imperfection) is confirmed while the framing (negative vs positive) is revised. The system marks the original as partially superseded, preserving the confirmed portions.

### Pattern Detection

Over a session, patterns emerge. The student who keeps circling back to a theme we haven't recognized. The student who agrees with feedback but never implements it. These patterns are meta-insights — observations about the coaching process, not the essay — stored separately so they inform coaching strategy without polluting the essay profile.

### Cross-Session Durability

Each insight gets a durability level inferred from scope and category:
- **Ephemeral** — tied to specific text, invalidated by edits ("I chose 'stumbled' deliberately")
- **Draft-durable** — survives minor edits, invalidated by structural rewrites
- **Essay-durable** — persists as long as this essay is being worked on
- **Student-durable** — persists across all essays ("I'm a perfectionist and that's part of what I'm writing about")

### Key Risks

- **Misclassification**: If Haiku tags a reinterpretation as confirmation, the system boosts confidence in an understanding the student just contradicted. Mitigation: two-pass classification where Sonnet can override Haiku's classification (~$0.001 extra).
- **Over-reliance on student statements**: Students don't always know what their essay is about. The insight is stored as student intent, but the understanding layer maintains its own reading. The tension IS a coaching opportunity.
- **Insight decay**: Insights from earlier drafts may become irrelevant after rewrites. Track which essay version each insight was generated against; flag insights whose text has changed significantly.

---

## 2. Edit Understanding & Change Mapping

> Full detail: `docs/EDIT_UNDERSTANDING_SYSTEM_DESIGN.md` (being updated to reflect this LLM-nuanced approach)

### Vision

**Replaces both the old Edit Diff (1B) and Impact Classification (1D).** The standalone Haiku impact classifier (a separate prediction call) is eliminated — but NOT because we avoid LLM intelligence. The opposite: we bring LLM nuance into EVERY step of the pipeline. The old 1D design was a cheap, shallow Haiku guess disconnected from the actual analysis. The new design uses thoughtful, integrated LLM calls that understand what they're looking at.

The structured logic — measure the change, understand its significance, classify its type, map to the profile, determine scope — is the FRAMEWORK. But each step is executed with Sonnet-level intelligence, not mechanical string counting. A word swap isn't just "7% change ratio" — it's "the student replaced 'decided' with 'couldn't' in the fulcrum sentence, shifting the entire essay's theory of agency from rational choice to involuntary attachment."

### The Pipeline: Detect → Understand → Classify → Map → Scope

**Step 1 — Change Detection** (mechanical pre-processing): Compare old and new text at three levels — paragraph alignment (hash comparison, detects structural changes), sentence alignment (within changed paragraphs), and word-level diff (within changed sentences). This step IS mechanical — it produces the raw textual diff that the LLM will then interpret. Output: a complete hierarchical description of what physically changed, including old text, new text, and their positions.

**Step 2 — Change Understanding** (Sonnet call — the core intelligence): The LLM receives the raw diff alongside the relevant profile context (the changed sentence's existing understanding, its tags, its connections, its paragraph's role) and produces a nuanced reading:

- **How significant is this change?** Not just "7% of words changed" but "this single word changes the sentence's meaning from active agency to passive compulsion." A word swap that alters the essay's central tension is far more significant than a paragraph rewrite that just polishes existing ideas. The LLM understands this because it reads the actual words in context.

- **What kind of change is this?** The LLM classifies with nuance that syntactic analysis cannot:
  - **Word-level refinement**: Same meaning, better word. "walked" → "drifted" where drifting captures the dreamlike quality the student is building. The LLM knows this because it can see the surrounding context.
  - **Meaning evolution**: The sentence now communicates something different. "I decided to keep the ring" → "I couldn't let it go" — the student shifted from rational choice to emotional compulsion.
  - **Tonal/voice shift**: Same content, different register. "The experience was impactful" → "That moment cracked something open in me."
  - **Content expansion**: New information added. "I sat down" → "I sat down at my grandfather's desk, the one he built the year I was born."
  - **Content reduction**: Information removed. Might be trimming or might be cutting something important.
  - **Structural reorganization**: Paragraphs moved, split, merged. The essay's skeleton changed.

  These are NOT derived from counting words or checking syntax. The LLM reads old and new text and UNDERSTANDS what the student did and why it matters.

- **What is the apparent purpose?** The LLM infers likely intent: "The student seems to be softening the transition" or "This rewrite shifts the emotional register from analytical to visceral." This inference is tentative — it can be confirmed or corrected by the Conversational Edit Workshop if the student discusses the change.

**Step 3 — Profile Mapping** (Sonnet call, continued or separate): Given the LLM's understanding of the change, it maps to the profile with full awareness of how the essay's meaning architecture works:

- **Direct impact**: The changed sentence's own understanding and analysis always need updating. But the LLM determines HOW they need updating — is the old understanding now wrong, or just slightly stale?
- **Connection impact**: The LLM reads the sentence's connections and judges whether the change alters, strengthens, weakens, or breaks each connection. "The student changed 'decided' to 'couldn't' — this doesn't break the setup-payoff connection to P5, but it TRANSFORMS it. The payoff now lands differently because the setup carries a different emotional charge."
- **Paragraph impact**: Does this change alter the paragraph's role, emotional register, or contribution to the narrative? The LLM judges this with awareness of the paragraph's structural role in the essay.
- **Holistic impact**: Does this change ripple into voice identity, thematic architecture, narrative strategy, or the North Star? The LLM traces the implications: "Changing 'decided' to 'couldn't' in the fulcrum sentence shifts the essay's thesis from 'choosing inherited values' to 'being unable to escape inherited values.' This affects the thematic architecture and the North Star's through-line."

**Step 4 — Scope Determination** (LLM judgment): Based on its understanding of the change and its profile mapping, the LLM recommends the analysis scope:

- **Sentence-level update**: The change is well-understood, its connections are clear, and the ripple is contained. "Update P2S4's understanding and check its connection to P4S1."
- **Paragraph-level re-analysis**: The change affects the paragraph's role or multiple sentences need re-evaluation. "Re-walk paragraph 2's understanding — the voice shift changes how the whole paragraph functions."
- **Targeted holistic refresh**: The change touches thesis/voice/arc. "Refresh thematic architecture and voice identity — the meaning shift in the fulcrum alters both."
- **Comprehensive re-analysis**: Multiple paragraphs affected, structural changes, or the change is so fundamental that incremental updating would be unreliable.

The LLM's scope recommendation comes with reasoning, which the system logs for the double-check loop and future calibration.

### Why LLM Intelligence at Every Step

The old design tried to be clever with mechanical shortcuts — word count ratios, syntactic pattern matching, deterministic profile graph traversal. But essay editing is fundamentally a meaning-making activity. When a student changes "walked" to "drifted," the significance depends entirely on context: Is this in a thesis sentence or a transitional detail? Does "drifted" connect to a fog metaphor in paragraph 5? Is the student building a dreamlike quality or just picking a better word?

No amount of string comparison can answer these questions. Only an LLM that reads the words in context — alongside the existing profile understanding — can judge significance, classify the change type, trace the implications, and determine the right analysis scope.

The structured pipeline (detect → understand → classify → map → scope) provides discipline and predictability. The LLM at each step provides the nuance and judgment that makes the system actually intelligent.

### Cost Model

The Edit Understanding pipeline uses a single Sonnet call (or two if the profile context is large enough to warrant splitting). This call receives:
- The raw diff (old text, new text, positions)
- The changed sentence's existing profile (understanding, analysis, tags, connections)
- The paragraph's role and key neighboring context
- The North Star summary (structural roles, through-line relevance)

**Estimated cost per edit**: ~$0.02-0.05 for the understanding call, depending on how much profile context is loaded. This is comparable to the old Haiku classifier cost but infinitely more reliable and useful — it produces actionable understanding, not vague predictions.

**For micro-edits** (single word in an unremarkable sentence): The understanding call is small (minimal profile context needed) and fast. ~$0.02.

**For significant edits** (rewrite of a structurally important sentence): More profile context is loaded, the call is richer. ~$0.03-0.05. But this is exactly when you WANT thorough understanding.

**For structural changes** (paragraph insert/delete/reorder): The understanding call identifies the scope as comprehensive re-analysis, which then follows the re-analysis pipeline. ~$0.03 for the understanding + $0.15-0.50 for the re-analysis itself.

### Escalation During Analysis

The system starts at the scope the understanding call recommended, but can escalate mid-analysis if the actual re-analysis work reveals broader impact than expected. A sentence-level update might discover that the meaning shift broke a connection to a thesis-carrying sentence → escalates to targeted holistic refresh. A paragraph re-walk might produce back-propagations that cross the edit boundary → escalates to comprehensive.

This is a safety net: the LLM's initial scope judgment is usually right, but when the actual analysis work uncovers surprises, the system widens rather than producing a stale profile.

### Integration with Conversational Edit Workshop

When the student makes an edit through the conversational pathway (Pathway 1 from section 4), the Edit Understanding pipeline feeds the workshop with its reading: "You changed 'decided' to 'couldn't' in the sentence I identified as your essay's fulcrum. That's a subtle but significant shift — 'decided' framed your choice as rational, 'couldn't' frames it as something deeper. Tell me more about what you're going for."

This is massively more valuable than "you made a word change in P4S3." The LLM-powered understanding enables the workshop to have genuinely intelligent conversations about the student's edits.

### Key Risks

- **Cost per edit**: Every edit now costs ~$0.02-0.05 for the understanding call. For a student making 50 edits in a session, that's $1-2.50 just for edit understanding. Mitigation: the Conversational Edit Workshop batches rapid edits (debounce) and only runs the full understanding pipeline for changes above a minimum threshold (structural changes or changes to flagged sentences). Silent micro-edits (word swap in an unremarkable sentence) can use a lighter-weight Haiku call (~$0.002) that decides whether the edit warrants full Sonnet understanding.
- **Latency**: A Sonnet call adds 1-3 seconds before the system can respond to an edit. Mitigation: the understanding call runs asynchronously — the student can keep editing while the system processes. Results are ready by the time the conversational workshop engages (if it engages at all).
- **Over-interpretation**: The LLM might read too much into a simple word change. Mitigation: the understanding call's output includes a confidence level. Low-confidence interpretations are logged but don't trigger escalation unless confirmed by subsequent analysis.
- **Under-interpretation**: The LLM might miss a significant change buried in a batch of minor edits. Mitigation: the double-check loop (from section 4) catches cases where the understanding call underestimated significance.

---

## 3. Essay North Star (replaces EssayDNA)

> Full detail: `docs/ESSAY_NORTH_STAR_DESIGN.md`

### Vision

The North Star is the system's understanding of how an essay **means** — not what it says or how well, but the architecture by which individual moments compose into a unified act of self-revelation. It's the conductor's interpretive markings — not the notes, but how they relate to create the symphony.

**This is NOT a summary.** A summary is a lossy compression — everything in it exists more deeply elsewhere. The North Star is an emergent property that no individual profile section contains. You cannot derive it by compressing; you can only produce it by synthesizing.

### Five Conceptual Dimensions

**1. Through-Line Map**: Traces the essay's central element (image, question, tension, metaphor) — where it surfaces, submerges, transforms, and resolves. For the diamond essay: the diamond's MEANING transforms from commodity → inheritance → identity. This isn't "diamond appears in P1, P3, P5" (the connection graph does that). It's "the diamond's meaning undergoes a specific transformation, and the essay's power comes from the reader experiencing that transformation."

**2. Structural Roles Map**: What each section IS in the architecture of meaning. The pawnshop scene isn't "the opening" — it's the essay's frame of risk. Without the risk of loss, nothing else has stakes. The grandfather's backstory isn't "context" — it's the value system the student will be tested against. The near-selling moment is the fulcrum. This matters because significance-awareness changes everything — editing the fulcrum should be treated with far more care than editing a transitional sentence.

**3. Trajectory and Potential**: Where the essay IS and where it's TRYING to go. For a work in progress: "this essay is building toward a test — the through-line demands a moment where the student confronts trading sentimental value for market value." For a nearly-finished essay: "the closing metaphor of light-through-cloudiness could be threaded backward — maybe there's a sentence in P2 where the grandfather holds the ring up to light that would strengthen the callback." The North Star sees unrealized connections.

**4. Distinctiveness Signature**: What makes this essay non-interchangeable. NOT "about family and imperfection" (describes thousands of essays). Instead: "uses pawnshop economics to dramatize the gap between market value and inherited worth. The student's voice oscillates between transaction language ('fourteen karat,' 'forty dollars') and inheritance language, and that oscillation IS the essay's argument."

**5. Intent Bridge**: Holds the student's stated understanding alongside the system's. The divergence itself is valuable coaching fuel. A student who says "I just thought it was a good story" when the essay is doing sophisticated thematic work — that gap is a coaching opportunity, not a problem.

### How It's Built (Progressive Crystallization)

| After Layer | Quality | Looks Like |
|-------------|---------|-----------|
| L1 (Haiku) | Rough hypotheses | "Recurring diamond image. Possible bracket structure." |
| L2 + L2.5 | Structural skeleton | "Bracket essay, recurring diamond, tonal arc." |
| L3 (Walk) | Real connections | "P1 is frame of risk. Grandfather story transforms diamond from object to symbol. Near-selling is fulcrum." |
| L3.75 (Synthesis) | Full architecture | Complete through-line map, structural roles, trajectory, distinctiveness. The conductor's score. |
| L6 (Conversation) | Architecture + student voice | Intent Bridge populated, trajectory may shift based on student-revealed context. |

L4 Crystallization is where the North Star is articulated as a coherent artifact — the earlier layers provide raw material, L4 synthesizes.

### How It's Used (4 Scenarios)

**Annotations**: Without North Star → "Consider showing your grandfather's values through action." With North Star → "Your grandfather's values need to be FELT before paragraph 4, where you almost trade them away. Right now we're told he chose the diamond — we don't experience the weight. What if we SAW the moment he chose it? The reader needs to carry that choice so when you almost sell the ring, we feel what's at stake."

**Edit Interpretation**: Student changes "decided" to "couldn't" in P4. Without North Star → minor word swap. With North Star → P4 is the fulcrum. "Decided" = rational choice aligned with values. "Couldn't" = overcome by attachment they don't understand. This is a shift in the essay's entire theory of agency.

**Portfolio Strategy**: Five essays, each with its own North Star. The portfolio intelligence reads all five: "Across these essays, the student repeatedly explores the gap between how the world measures value and how they've learned to measure it. Each essay illuminates a different facet. The portfolio's collective argument is a coherent philosophy of value."

**Coaching**: Student asks "what should I work on?" Without North Star → "Paragraph 2 has the lowest score." With North Star → "Your turning point depends on the reader FEELING your grandfather's values. Paragraph 2 tells us about them but we don't feel them. Strengthening P2 makes your entire climax land harder."

### Key Risks

- **Essays without clear through-lines**: The North Star must be flexible enough for ANY essay, not just metaphor-rich ones. For chronological narratives, the through-line might be a deepening question. For collage structures, a thematic tension each fragment illuminates differently.
- **Over-interpretation**: Calling something "the fulcrum" is a strong claim. Mitigation: confidence levels, the Intent Bridge for student confirmation/correction.
- **Prescriptive drift**: The North Star reads the essay's own momentum — it does NOT impose an external ideal. "The essay wants to arrive at..." reads the essay's intent. "The essay should have..." is prescription wearing a descriptive mask.

---

## 4. Version-Based Re-Analysis & Conversational Edit Workshop

> Full detail: `docs/VERSION_BASED_REANALYSIS_AND_EDIT_WORKSHOP_DESIGN.md`

### The Paradigm Shift

**Old**: Every edit triggers analysis (focused or comprehensive). System is always reacting.
**New**: Two distinct pathways matching how students actually work.

Think of a writing tutor. They don't stop you mid-sentence to analyze your grammar. They watch you write, ask "what are you going for there?" when something interesting happens, and when you put the pen down and say "what do you think?", they give you a considered, informed reading.

### Pathway 1 — Conversational Edit Workshop (real-time companion)

The student is actively editing. The workshop is light, responsive, conversational.

**Not every change gets a comment.** A lightweight detection layer classifies each change by magnitude and significance. Most word swaps in unremarkable sentences are logged silently.

**Significant changes get a conversational nudge.** If the student rewrites the ending of their strongest paragraph: "I noticed you changed the ending of your third paragraph — the one that carries the turn. Tell me what you're going for with the new version?" No score, no evaluation — a workshop assistant asking a clarifying question.

**The student's response becomes gold.** "I felt like the old ending was too abrupt — I want the reader to sit with the image." The system now knows the student's INTENT — something no amount of textual analysis could discover. This gets attached to the change in the version record.

**Adaptive engagement threshold.** Early in the session → more willing to comment. After 15 rapid changes → threshold rises (respect the flow state). If student actively engages → threshold drops.

### Light-Touch Profile Updates (minimal, defensive)

What gets updated immediately:
- **Sentence text references** — mechanical, not analytical
- **Structural bookkeeping** — sentence counts, index remapping
- **Staleness markers** — changed sentences and their connections flagged as "stale"

What gets a light adjustment (when conversation context exists):
- **Inferred intents** — the student's own words are authoritative on their intent

What does NOT get updated:
- Effectiveness scores, strength/weakness assessments, holistic sections. These require LLM judgment. Light-touch adjustments are hypotheses, not conclusions.

### Pathway 2 — Version-Based Re-Analysis (deliberate action)

The student says "I'm ready for a fresh read" (or the system suggests it). A "version" is the accumulated essay state between two analysis points.

**The version record carries**:
- Essay text at each analysis checkpoint
- Running list of change entries (timestamp, location, old/new text, type, optional intent annotation from conversations)
- Conversation insights collected since last analysis
- Light-touch adjustment log

**The re-analysis brief** — a structured summary injected into re-analysis prompts:
1. **What changed?** Paragraph and sentence-level diffs
2. **Why did it change?** Student's stated intents, quoted from conversations. Where no intent was captured: "No conversation context."
3. **What did we tentatively assess?** Light-touch adjustments and staleness flags

This replaces blind "here's a changed essay, figure it out." The LLM starts from knowledge, not ignorance. Estimated 20-40% cost reduction for sessions with active conversational engagement.

### The Double-Check Loop

After re-analysis, compare its findings with light-touch adjustments:
- **Agreement**: Light-touch was sound. Build calibration confidence.
- **Light-touch missed something**: Expected — focused analysis can't catch inter-paragraph effects. That's why re-analysis exists.
- **Light-touch was wrong**: Valuable for both the student ("you wanted this to be more physical, but the new version moved more abstract") and system calibration.

Over time, comparison records identify systematic biases in the light-touch system, informing threshold tuning.

### When to Suggest Re-Analysis

**Signal-based suggestions**:
- Cumulative change volume (adaptive threshold per student's editing style)
- Structural changes (paragraph added/deleted — strong nudge)
- Thesis-area changes (changes to the essay's most structurally important elements)
- Declining profile reliability (many staleness markers → "My understanding is getting thin")

**Anti-annoyance safeguards**: Never more than once per session without new changes. Never during rapid editing. If dismissed, wait 5+ more changes. Frame as "when you're ready" not "you should."

### Key Risks

- **Massive changes without re-analysis request**: Profile becomes increasingly stale. System becomes honest: "I've lost track of your essay's current shape."
- **Reverted changes**: The net change is zero, but the conversation insight ("student considered changing this but decided against it") is still valuable.

---

## 5. Interconnected Type System, Voice Map & Emotional Earned-ness

> Full detail: `docs/DESIGN_TYPE_SYSTEM_PROFILE_MANAGER_VOICE_EMOTION.md`

### The Dimensional Web (Comprehensive Architecture)

The seven holistic dimensions (voice, emotion, theme, narrative, character, craft, admissions) are the right categories. But they're not independent columns in a spreadsheet — they're a web. The type system must make the interconnections explicit and traversable.

**Voice feeds Theme**: The bracket essay's voice shifts from sensory-concrete to reflective-abstract. That shift IS the thematic move — the essay moves from transactional valuation to felt value. The system captures voice-theme entanglement.

**Structure enables Emotion**: The emotional climax (choosing to keep the ring) lands because of structural choices made three paragraphs earlier. Emotional progression is not just "what emotion appears where" but "what structural scaffolding makes each shift possible."

**Character emerges from everything**: Who this writer is emerges from voice + theme + emotion + craft + narrative. Character Revelation should explicitly draw from every other dimension.

**Admissions Positioning is the outermost layer**: The AO pitch depends on theme (what's distinctive), voice (how memorable), character (who emerges), craft (polish level). The system makes these dependencies traceable.

### Cross-Dimension Entanglements

A new section in the holistic profile that records moments where two or more dimensions intersect: "P2S3's voice shift from concrete to reflective IS the thematic pivot from transaction to value." This isn't stored in voice (more than a voice observation) or theme (more than a theme observation). It's an entanglement — and these are what make understanding feel "deep" rather than "categorized."

### Voice Map (Not a Score)

The consistency score is eliminated. Instead, voice is tracked as a four-dimensional map:

**Four dimensions**: Register (formality/distance), vocabulary fingerprint (recurring word families, domain-specific language), sentence rhythm (cadence patterns), perspective and distance (how close the narrator stands to events).

**Consistency as a map**: Each passage is mapped for voice stability. Where voice shifts, the system notes:
- **Whether intentional or unintentional**: Intentional variation has three hallmarks — aligns with structural boundaries, serves an identifiable purpose in another dimension, commits fully. Unintentional inconsistency happens mid-paragraph, serves no purpose, oscillates.
- **What passages are involved**: Specific locations, not a number

This replaces "consistency = 0.78" with: "Your voice shift in paragraph 3 works because it aligns with the emotional turn" or "Your voice drifts in paragraph 4 — the SAT vocabulary doesn't match your natural register from paragraphs 1-2."

### Emotional Progression as an Earned-ness Map

The "isEarned" flag is replaced with a backward-tracing network. For each significant emotional moment, the map traces HOW it was earned through specific narrative mechanisms:

**Mechanism types**:
- **Sensory grounding** — physical details that made the situation real. "P1S1-3: pawnshop described through fluorescent lights, magnifying glass. The reader can SEE the place."
- **Emotional setup** — earlier moments that built toward this one. "P2S4: grandmother's hands described with tenderness."
- **Stakes establishment** — moments that defined what could be lost. "P1S5: the forty-dollar offer."
- **Character revelation** — earlier moments revealing who this person is, making their emotional response feel consistent.
- **Thematic preparation** — earlier thematic work giving the emotion meaning beyond the immediate scene.

**When emotion is unearned**: The map identifies the gap. "P3S5 claims devastation but no prior passage established emotional proximity." This is a diagnosis that directly informs what to add.

**Structural insight from the map**: If all the arrows for P4's climax point to P2 but none to P1, that reveals P1 is structurally underutilized — it sets up space but doesn't contribute to payoff. Actionable feedback from the map's structure itself.

### "No Gaps" in Understanding

For every sentence: what it does (understanding), how well (analysis), which dimensions it participates in (tags), what it contributes to those dimensions (entries in holistic sections pointing back to it).

For every paragraph: structural role, emotional register relative to neighbors, thematic threads, narrative arc contribution, character revelation.

For the whole essay: complete map of how each dimension evolves, explicit cross-dimension entanglements, and a synthesis layer (admissions, North Star) that draws demonstrably from every dimension.

### Portfolio-Level Power

- **Cross-essay voice consistency**: Does the student sound like the same person? Intentional adaptation (more formal for supplements) vs unintentional inconsistency.
- **Thematic coverage**: Are major identity aspects represented? Any redundancy?
- **Character mosaic**: Each essay reveals one facet. Do they compose into a coherent, multidimensional person?
- **Emotional range**: Does the portfolio show vulnerability, humor, determination — or defaults to one register?

---

## 6. Profile Manager Excellence

### What It Does

The Profile Manager is the sole authority for all profile mutations. No layer writes to the profile directly. It provides specific methods for each layer's output and handles all the complexity internally.

### Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Mutation model** | Mutable in-place | Performance during L3 walk (5+ mutations). Manager is sole mutator. |
| **Initialization** | Factory function | Plain data object, no lifecycle ceremony, easy to serialize/test. |
| **Index recomputation** | Hybrid — cheap fields always, expensive at checkpoints | Paragraph digests and connection graph = always fresh. Token estimates = at boundaries. |
| **Persistence** | Manager does NOT own persistence | Keeps it testable. Orchestrator calls storage service. |

### Maintaining the Interconnected Web

When a voice drift entry is added, the Profile Manager knows this may affect emotional topography, thematic architecture, and cross-dimension entanglements. But it doesn't recalculate — that's the LLM's job. Instead, it maintains a **lightweight staleness-tracking system**: marks affected sections as "stale relative to latest voice update" so the Profile Router includes them in the next relevant LLM call.

### Handling Complex Structures

The voice map and earned-ness map are graph-like structures with internal references. The manager handles these through:
- **Structural integrity on mutation**: When a paragraph is edited, entries pointing to that paragraph are flagged for the next synthesis pass
- **Granular updates**: Unlike supersession fields, these maps support targeted updates (add an entry, update intentionality assessment, remove unsupported entries) with internal reference validation after each update

### Validation (Two Tiers)

**Quick (after every mutation)**: Referential integrity. Do all connection IDs point to entries that exist? Do all earned-ness arrows point to valid paragraphs? Do voice shift entries reference valid boundaries?

**Full (at checkpoints)**: Semantic coherence. Does the voice map's "intentional shift at P3" align with emotional topography's "emotional transition at P3"? Does the earned-ness map's "P1 earns P4" align with a P1-to-P4 connection?

### Profile Manager Boundary

Must be maintained strictly:
- **Owns**: Mutations, staleness-tracking, referential integrity, index recomputation
- **Does NOT own**: Synthesis (L3.75), evaluation (L3.5), storage (orchestrator), rendering (Profile Router)

### Readiness Scoring

Four functions (essay/paragraph/sentence/word), each returns 0-100. These feed improvement phase detection. Calibration targets: strong essay starts ~Craft/Polish (80/75/70/60), weak essay at Foundation (~25/40). Will need tuning against real essays.

---

## 7. Database Architecture

> Full detail: `docs/ESSAY_INTELLIGENCE_DATABASE_ARCHITECTURE.md`

### Design Philosophy

**5 organizing principles**:
1. **One entity, one table**: Every distinct concept gets dedicated storage. Coaching turns updating one sentence shouldn't require loading a 300KB blob.
2. **JSONB where structure varies, columns where queries need speed**: If we'll ever write `WHERE column = ...`, it's a scalar column.
3. **The profile is assembled, not fetched**: The Profile Router decides which tables to query based on the task. A coaching turn about voice loads the voice section + tagged sentences. Not everything.
4. **Write frequency drives table boundaries**: Profile index (updated often) is separate from paragraph profiles (updated once per walk). Two concurrent processes never contend for the same row.
5. **Hard ownership**: Every row has user_id with RLS. Service role bypasses for pipeline operations.

### 6 Domain Modules

| Module | Purpose | Tables |
|--------|---------|--------|
| **Essay Core** | Text, versions, metadata (existing) | `essays`, `essay_revision_history` |
| **Essay Profile** | Multi-resolution understanding map | `essay_profiles`, `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_sentence_analyses`, `essay_connections`, `essay_dna` |
| **Analysis Lifecycle** | Pipeline audit trail | `analysis_runs`, `analysis_checkpoints` |
| **Conversation & Coaching** | L6 messages, insights | `coaching_sessions`, `coaching_messages`, `conversation_insights` |
| **Feedback & Improvement** | Progressive precision | `improvement_phases`, `annotation_deliveries`, `feedback_quality` |
| **Portfolio Intelligence** | Cross-essay patterns | `portfolio_essay_index`, `portfolio_cross_patterns` |

### Key Table Decisions

**`essay_holistic_sections`**: 7 rows per essay (one per section type), not 7 JSONB columns. Individual rows can be updated independently, TOAST compression is per-row, and "load sections X, Y, Z" maps directly to `WHERE section_type IN (...)`.

**`essay_sentence_analyses`**: One row per sentence (~25 rows per essay), not a JSONB array on paragraphs. Back-propagation from P5 to P1S1 updates one row, not the entire P1 array. Enables tag-based and score-based queries without JSONB traversal. Effectiveness and isProblem as scalar columns for fast querying.

**`essay_connections`**: Single canonical store. Each connection stored once. Sentences reference by ID. Eliminates the duplication problem.

### Concurrency Model

- **Optimistic concurrency** (write version on `essay_profiles`): Every update includes `WHERE write_version = $expected`. Two coaching turns racing → second retries with merged state.
- **Analysis locks**: Prevents concurrent analysis runs. Heartbeat every 10 seconds; stale locks detected after 60s (crashed processes).
- **Coaching during re-analysis**: No contention — different tables. Profile index updated atomically at analysis completion.

### Migration Strategy (3-Phase, Zero Data Loss)

**Phase A**: Create new tables alongside existing. Write to both. Read from new when available, fall back to old.
**Phase B**: Backfill migration script decomposes existing JSONB into new tables. Verify integrity.
**Phase C**: Switch reads to new tables exclusively. After 1-2 week confidence period, drop old table.

### Key Risks

- **Join overhead**: We NEVER assemble the full profile in one query. Profile Router always loads selectively. Most common query is single-table single-row.
- **Stale profile index**: Profile Manager always recomputes the index after any mutation, writes atomically with optimistic concurrency.
- **JSONB evolution**: Application layer treats JSONB as typed but tolerant — missing fields get defaults at read time. TypeScript interfaces define canonical shape.

---

## 8. Rendering & Prompt Caching

### Rendering: Structured Text (Not JSON)

Profile data is rendered as structured text with headers, indentation, and labels. ~35% token savings over raw JSON. LLMs comprehend structured text more naturally.

Example:
```
P1S1: "The fluorescent lights hummed above..."
  Understanding:
    [U1] Grounds reader in pawnshop scene through physical action
    [U2] Introduces the cloudy diamond as imperfection-with-value
  Tags: metaphor:diamond, theme:imperfection, opening
  Connections: → P5S4 (setup → payoff)
```

### Observation Labels

Position-based: `P1S1.U1` = paragraph 1, sentence 1, first understanding observation. Generated at render time (zero storage). Creates shared language between understanding and analysis passes.

### Token Budget: Two-Pass

1. **Estimate pass**: ProfileIndex token counts → select sections by priority (P0: index, P1: target paragraph, P2: connected sentences, P3: relevant holistic, P4: adjacent, P5: background)
2. **Render pass**: Render selected sections. Trim lowest-priority if >10% over budget.

### Prompt Caching: 3-Block Structure

Each call uses:
- **Block 1** (static): System instructions + output schema. Cached forever.
- **Block 2** (essay-specific): Essay text + profile sections. Cached across calls within the same layer pass.
- **Block 3** (call-specific): The specific paragraph/question. Never cached.

Biggest savings: L3 walk (~$0.04), L3.5 analysis (~$0.07), L6 coaching (~$0.07/session). Total: ~$0.25-0.35 per session.

### Infrastructure Need

`callClaude` wrapper needs support for multi-block system prompts with individual cache flags (instead of single `cacheSystemPrompt: boolean`).

---

## Integration Order

| Priority | Domain | Why First |
|----------|--------|-----------|
| 1 | **Type System + Voice + Emotion** | Everything depends on data shapes |
| 2 | **North Star** | Central to how everything connects — guides all feedback and analysis |
| 3 | **Database Architecture** | Must be settled before Profile Manager |
| 4 | **Profile Manager** | Central hub, uses all types, writes to all tables |
| 5 | **Edit Understanding** | Foundation for both pathways |
| 6 | **Conversation Insight** | Powers the conversational edit pathway |
| 7 | **Version Tracking + Re-Analysis** | Depends on Edit Understanding + Conversation Insight |
| 8 | **Rendering + Caching** | Prompt-level details, can iterate |

---

## Appendix: Quality Review Findings & Fixes

> 3-agent critical review of all sections. 25 findings organized by severity.
> Each finding includes the issue, why it matters, and the fix.

### Critical Findings (Block Implementation)

**C1. Database schema missing tables for new concepts**

The database architecture was designed before several concepts were finalized. Missing storage for:
- **Version records** (change entries + intent annotations for the Conversational Edit Workshop). `essay_version_snapshots` is a rollback backup, not a running change log. Fix: Add `essay_version_records` table — one row per change entry with timestamp, location, old/new text, type classification, and optional intent annotation. Lightweight rows (~200-500 bytes each).
- **North Star** (replacing EssayDNA). The `essay_dna` table has fields designed for the old "business card" concept (thesis, AO pitch, paragraph score matrix). The North Star's five dimensions (through-line map, structural roles, trajectory, distinctiveness, intent bridge) are fundamentally different data. Fix: Replace `essay_dna` with `essay_north_star` table carrying the five dimensions as JSONB.
- **Cross-dimension entanglements**. Described as "a new section in the holistic profile" but the schema has exactly 7 rows per essay in `essay_holistic_sections`. Fix: Add an 8th section type value (`cross_dimension_entanglements`) to the enum. The "7 rows per essay" becomes "8 rows per essay." Simple, no structural change.
- **Student-durable insights**. Insights tagged `student-durable` ("I'm a perfectionist") transcend any single essay, but `conversation_insights` is essay-scoped. Fix: Add `student_insights` table at the user level, separate from essay-specific insights. The re-analysis brief should pull from both essay-level and student-level insight stores.

**C2. PLAN.md not updated to reflect new designs**

The authoritative PLAN.md still defines `consistencyScore: number` on voiceIdentity, `isEarned: boolean` on emotionalProgression, and references EssayDNA throughout. A developer reading PLAN.md will build different things than one reading the proposals. Fix: PLAN.md must be updated to reflect voice map, earned-ness map, and North Star before implementation begins.

**C3. Re-analysis brief omits North Star context**

The re-analysis brief packages what changed, why, and tentative assessments — but NOT the North Star's structural roles. If a student changed the fulcrum sentence, re-analysis should know it's the fulcrum without rediscovering it. Fix: Add a fourth section to the re-analysis brief: "What is structurally significant about the changed areas?" populated from the North Star's structural roles map.

**C4. North Star doesn't scale for short essays**

The five dimensions are rich for 650-word personal statements but overpowered for 150-word supplements and 350-word PIQs. A 150-word "Why This School" doesn't have a through-line that "surfaces, submerges, transforms, and resolves." Fix: Scaled North Star by essay length:
- **Supplements** (<250 words): Two dimensions — structural role (what this essay does in the portfolio) + distinctiveness signature
- **PIQs** (~350 words): Three dimensions — add trajectory
- **Personal statements** (~650 words): Full five dimensions

### Significant Findings (Design Gaps)

**S1. Staleness propagation is unbounded in well-connected essays**

In strong, well-connected essays (which is what good essays look like), changing one sentence can mark 3-5 connected sentences stale, each with their own connections. After 10 edits, the majority of the profile is flagged stale. The students who benefit most from the workshop (strong essays, craft-level revisions) hit degradation fastest. Fix: Implement staleness depth limits. Direct staleness (the changed sentence) = strong. One-hop connection staleness = moderate. Two-hop = weak/informational. Re-analysis suggestions should trigger on strong-staleness count, not total staleness.

**S2. Conversation insight extraction trigger is unspecified during editing**

When does insight extraction run during Pathway 1? On every student message? Only on responses to workshop nudges? The "effectively free" cost claim depends on this. Fix: Haiku classifies every student message using both the L6 4-way classification (drives Profile Manager) AND the insight taxonomy (enriches version record) in a single call. One call, two outputs.

**S3. Pathway 1 cost is underestimated**

30 edits × Haiku classification + 5 nudge-generation Sonnet calls + 3 response-processing Sonnet calls = ~$0.15-0.25, not "effectively free." Fix: Revise cost model. Magnitude classification and significance detection are deterministic (diff ratio + ProfileIndex lookup, no LLM). Nudge generation uses Haiku (simple question, not deep analysis). Only response processing uses Sonnet. Revised Pathway 1 cost: ~$0.03-0.08 per session.

**S4. Voice map missing humor/irony and code-switching**

The four dimensions (register, vocabulary, rhythm, perspective) miss humor, irony, self-awareness, and multilingual code-switching — some of the most distinctive voice qualities in admissions essays. Fix: Add a fifth dimension — **tonal disposition** (humor, irony, earnestness, irreverence, solemnity). Add notation for code-switching events (language, trigger, cultural function) as a special case of intentional variation.

**S5. Earned-ness map assumes emotional payoffs only**

The five mechanism types are all oriented toward emotions. Strong essays also have intellectual arcs (paradigm shifts, realizations) and humorous arcs (comedic builds with unexpected depth). Fix: Generalize from "emotional earned-ness" to **"moment earned-ness."** Add mechanism types for intellectual scaffolding (prior reasoning that makes a realization inevitable) and comedic/subversive setup (expectations established that the payoff subverts).

**S6. Through-line map vs connection graph overlap**

The through-line map traces "where a central element surfaces, submerges, transforms" — but the connection graph already records cross-sentence links. Are they redundant? Fix: Define clearly — the connection graph is raw DATA (these sentences are linked, here's the type). The through-line map is INTERPRETATION (the diamond's meaning transforms from commodity → inheritance → identity across these links). L4 crystallization READS the connection graph and sentence understanding to PRODUCE the through-line map as a higher-order synthesis. The through-line is a computed view, not redundant storage.

**S7. Distinctiveness signature vs entanglements ownership boundary**

Both describe voice-theme intersections at different granularities. Without clear ownership, L3.75 and L4 produce redundant/contradictory readings. Fix: Entanglements = evidence layer (specific, located: "P2S3's voice shift IS the thematic pivot"). Distinctiveness signature = synthesis layer (global, interpretive: "the oscillation between transaction and inheritance language IS the argument"). L4 reads entanglements as input. Staleness cascades from entanglements → distinctiveness, not the reverse.

**S8. Profile Manager god-object risk**

The manager mutates 15+ table interactions with cross-table integrity checks. It embeds deep domain knowledge about which dimensions affect which. Fix: Split into a thin **coordinator** (owns write lock, dispatches, cross-table staleness propagation via declared dependency map) that delegates to domain-specific **mutators** (SentenceMutator, HolisticMutator, ConnectionMutator, VoiceMapMutator, EarnednessMutator). Each mutator owns its table's integrity; the coordinator owns cross-domain propagation.

**S9. Trajectory dimension is inherently prescriptive**

"The essay wants to arrive at..." projects a narrative expectation. If Sonnet prefers resolution-based arcs (likely from training data), it projects resolution-seeking trajectories onto intentionally open-ended essays. Fix: Trajectory should always present **multiple plausible paths**: "The essay could resolve through X (most supported by current text), or through Y (if the student wants to emphasize Z)." This makes trajectory a student decision tool, not an LLM prescription.

**S10. No retry/circuit-breaker for analysis crashes**

If analysis crashes repeatedly on the same paragraph (e.g., malformed essay causing unparseable Sonnet output), the system resumes from checkpoint, crashes again, and loops forever. Fix: Max 3 retries per checkpoint. After 3 failures, mark analysis as failed with error details. Alert the student: "We're having trouble analyzing this section."

### Moderate Findings (Polish)

**M1. Token budget for North Star unspecified**: A well-populated North Star could be 400-600 tokens — 5-15% of a coaching prompt's budget. Fix: Specify max tokens and selective loading rules (through-line + structural roles for edit interpretation, full North Star for portfolio strategy).

**M2. Double-check loop produces data nobody consumes**: Comparison records accumulate without a consumer. Fix: Either build a simple report surfacing systematic patterns for manual prompt tuning, or defer the data collection until enough re-analyses exist to make calibration meaningful.

**M3. Session boundary handling for adaptive threshold**: If the student leaves mid-flow-state with a high engagement threshold and returns the next day in reflective mode, the threshold is wrong. Fix: Reset engagement threshold at session boundaries. Version record persists, but editing rhythm restarts.

**M4. Voice intentionality confidence**: The system's judgment of intentional vs unintentional voice shifts is hard even for humans. Fix: Add confidence level to every intentionality assessment. Below 0.6 confidence → present as a question: "I notice your voice shifts in P3 — was that a deliberate choice?"

**M5. Portfolio composition at mixed maturity**: Composing a mature North Star with a hypothesis-stage North Star produces unreliable portfolio insights. Fix: Require minimum "deep" confidence for portfolio composition. Below that, qualify all claims and state which essays aren't mature enough.

**M6. Token estimation accuracy**: `length / 3.8` undercounts for structured text with labels/headers (~15-20% overhead). Fix: Calibrate ratio against rendered format, not raw content. Use ~3.2 for structured text sections.

**M7. Multi-essay context switching**: Student editing Essay A references Essay B ("I want my Common App to complement my Stanford supplement"). No mechanism to capture this. Fix: Add `portfolio_intent` insight category routed to portfolio intelligence layer.

**M8. Concurrency for light-touch updates**: Two browser tabs editing different paragraphs through Pathway 1 will conflict on the optimistic write lock unnecessarily. Fix: Light-touch updates (text reference updates, staleness markers) use per-sentence row-level updates on `essay_sentence_analyses` — no profile-level lock needed. Only Profile Manager analytical mutations use the optimistic lock.

**M9. Migration cost for existing essays**: Backfill can decompose existing JSONB but can't synthesize new structures (voice map, earned-ness map, North Star). Migrated profiles will have empty new sections. Fix: Add `legacy_profile` flag triggering re-analysis to populate new structures. Estimate cost: ~$0.50-1.00 per essay for re-analysis.
