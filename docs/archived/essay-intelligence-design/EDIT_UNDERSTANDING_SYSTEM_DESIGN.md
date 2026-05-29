# Edit Understanding & Change Mapping — Conceptual Design (v2)

> Replaces the old 1B (Edit Diff) and 1D (Impact Classification / Haiku classifier) from the gap proposals.
> **v2 update**: Every step uses LLM intelligence. The structured pipeline provides the framework; Sonnet provides the nuance.

---

## Vision

The old design had two problems going in opposite directions. The original 1D asked a cheap Haiku call to PREDICT impact — unreliable guesswork disconnected from real understanding. The v1 correction swung too far the other way, making everything deterministic — word count ratios, syntactic pattern matching, mechanical graph traversal. But essay editing is a meaning-making activity. When a student changes one word, the significance depends entirely on context that only an LLM reading the actual words can understand.

The new design holds the middle: a structured pipeline (detect → understand → classify → map → scope) that provides discipline and predictability, with Sonnet-level LLM intelligence at each interpretive step. The pipeline tells the system WHAT to do at each stage. The LLM brings the judgment of HOW significant, WHAT kind, and HOW FAR the impact reaches.

The key distinction from the old 1D: the Haiku classifier was a separate, shallow prediction call ("what will this change affect?") that guessed without deeply understanding the change itself. The new approach doesn't predict — it UNDERSTANDS the change first, and the scope FOLLOWS from that understanding. Understanding and scoping happen in the same call, with the same context, by the same model.

---

## How It Works

### Step 1: Change Detection — What Physically Changed (Mechanical)

This is the one step that remains purely mechanical. It produces the raw material the LLM will interpret.

**Paragraph alignment**: Hash each paragraph. Unchanged hashes = paragraph didn't change. If paragraphs were inserted, deleted, or reordered, produce a remapping (old P3 → new P4).

**Sentence alignment within changed paragraphs**: Align sentences between old and new versions. Pair each changed sentence with its most likely counterpart (by position, confirmed by textual overlap). Flag genuinely new sentences and deleted sentences.

**Word-level diff within changed sentences**: For each changed sentence, produce the actual textual difference — old text, new text, which words changed. This is the input the LLM will read.

The output is a complete, hierarchical description: "paragraph 2, sentence 4: old text 'I decided to keep the ring,' new text 'I couldn't let it go.' Also: paragraph 1, sentence 2: new sentence inserted."

This step is fast (~10-50ms), costs nothing, and produces clean structured input for the LLM.

### Step 2: Change Understanding — What This Change MEANS (Sonnet Call)

This is the heart of the system. A single Sonnet call receives:
- The raw diff from Step 1 (old text → new text for each changed sentence)
- The changed sentence's existing profile data (understanding, analysis, tags, connections)
- The paragraph's role and structural context
- A compact summary from the North Star (the sentence's structural role, through-line relevance)
- If available: conversation insights about the student's intent for this edit

The LLM produces a structured reading:

**Significance Assessment**: Not a word count ratio but a contextual judgment. "This is a single word change ('decided' → 'couldn't') but it's in the fulcrum sentence and shifts the essay's theory of agency. High significance." Or: "Three sentences were rewritten in P3 but the paragraph's role and emotional register are unchanged — the student polished the prose without altering the meaning. Moderate significance."

The assessment considers:
- Where the change is (thesis sentence vs transitional detail vs sensory description)
- What structural role the sentence plays (fulcrum, setup, payoff, bridge, atmosphere)
- Whether the change alters the sentence's function or just its expression
- Whether key meaning-carrying words changed (nouns/verbs) vs modifiers (adjectives/adverbs)
- Whether the change connects to or disconnects from other parts of the essay

**Change Type Classification**: The LLM categorizes the change with nuance:

- **Refinement**: Same meaning, better execution. "walked → drifted" where drifting serves the essay's dreamlike quality. The student is polishing, not rethinking.
- **Deepening**: The sentence now carries more weight. Adding a sensory detail, a specific memory, a revealing word choice. The student is enriching.
- **Meaning evolution**: The sentence communicates something different. "decided" → "couldn't" shifts from rational agency to emotional compulsion. The student is rethinking.
- **Voice/tone shift**: Same content, different register. Analytical → visceral, formal → intimate, distant → close. The student is finding their voice.
- **Structural reorganization**: Paragraphs moved, split, merged, sentences reordered. The student is re-architecting.
- **Simplification/compression**: Content removed, sentences shortened. The student is cutting — which might mean trimming fat or losing substance.
- **Expansion**: New content added. The student is building — adding detail, context, or a new thread.

These are not mutually exclusive. A change can be both a deepening and a voice shift. The LLM captures the full character of the change.

**Apparent Purpose**: A tentative inference about WHY the student made this change: "The student seems to be softening the essay's rational framework — three changes in this paragraph all move from analytical language to felt language." This inference is tagged as tentative. If the student discusses the edit in the Conversational Workshop, their stated intent supersedes this inference.

### Step 3: Profile Mapping — What Does This Change Touch? (Same Sonnet Call)

With its understanding of the change in hand, the LLM maps the impact to the profile. This happens in the same call as Step 2 — the LLM has all the context it needs.

**Connection assessment**: For each connection involving the changed sentence, the LLM judges the impact:
- "The setup-payoff connection to P5S4 is NOT broken — the ring is still being kept. But the NATURE of the payoff changed. The student no longer 'chooses' inherited value; they're 'unable to let go' of it. The connection transforms rather than breaks."
- "The echo connection to P1S3 is strengthened — 'couldn't' echoes the grandmother's emotional attachment established in P1."
- "No impact on the contrast connection to P4S2 — the contrast still holds."

This is qualitatively different from mechanical graph traversal, which can only say "this sentence has 3 connections, therefore check 3 sentences." The LLM understands WHETHER and HOW each connection is affected.

**Paragraph-level impact**: Does the change alter the paragraph's role, emotional register, or structural function? The LLM judges: "Paragraph 4's role as the fulcrum is preserved, but its emotional quality shifted from resolve to vulnerability. The paragraph's craft profile needs updating — the sentence rhythm changed from declarative (decision) to fragmented (inability)."

**Holistic impact**: Does this ripple into essay-level understanding? The LLM traces: "This change affects the thematic architecture — the essay's thesis shifts from 'choosing inherited values over market values' to 'being unable to escape inherited values.' It affects voice identity — the rational register of 'decided' is replaced by the emotional register of 'couldn't.' It affects the North Star's distinctiveness signature — the essay's argument about agency changes."

**What does NOT need updating**: Equally important — the LLM identifies what's unaffected. "The connection graph structure is intact. Paragraph 1's understanding is unaffected. The emotional earned-ness map for P4's climax is actually STRENGTHENED — the new phrasing makes the emotion more raw and earned."

### Step 4: Scope Recommendation (Same Sonnet Call, Final Output)

Based on everything above, the LLM recommends the analysis scope with reasoning:

**Sentence-level update**: "This change is well-contained. Update P2S4's understanding and analysis. Check the two connections but I expect them to hold. No holistic work needed." → Cost: ~$0.02-0.04

**Paragraph-level re-analysis**: "The voice shift across three sentences changes how this paragraph functions. Re-walk paragraph 3's understanding — the individual sentence changes compose into a paragraph-level transformation." → Cost: ~$0.05-0.10

**Targeted holistic refresh**: "The meaning evolution in the fulcrum sentence alters the thematic architecture and voice identity. Update the changed sentence, its connections, and refresh those two holistic sections." → Cost: ~$0.08-0.15

**Comprehensive re-analysis**: "The student inserted a new paragraph and reordered two others. The essay's structural skeleton changed. Comprehensive re-walk needed." → Cost: ~$0.15-0.50

The scope recommendation includes reasoning that gets logged for the double-check loop and future calibration.

---

## The Role of Haiku (Lightweight Pre-Filter Only)

While the full understanding pipeline uses Sonnet, a lightweight Haiku pre-filter prevents unnecessary Sonnet calls for trivially insignificant edits:

**When Haiku is enough**: The student fixes a typo ("teh" → "the"), adds a comma, or changes capitalization. Haiku receives the raw diff (no profile context needed) and classifies: "mechanical correction, no semantic change." No Sonnet call, no profile update. Cost: ~$0.001.

**When Haiku escalates to Sonnet**: Any change to actual content words, sentence structure, added/removed content, or any change to a sentence the profile has tagged as structurally important. Haiku's job is binary: "is this a trivial mechanical fix or a real content change?" If real → hand to Sonnet.

This keeps costs manageable for students who make many trivial fixes while ensuring every meaningful edit gets full LLM understanding.

---

## Integration with the Conversational Edit Workshop

The Edit Understanding pipeline's output feeds directly into the workshop's conversational ability. Instead of "you made a change in P4S3," the workshop can say:

"You changed 'decided to keep the ring' to 'couldn't let it go.' That's interesting — 'decided' framed this as a rational choice you made. 'Couldn't' suggests something deeper, like the ring has a hold on you that's beyond reason. Is that what you're going for? Because that shift changes how your whole essay reads — instead of arguing for inherited values, you're showing how inherited attachments work on us even when we don't choose them."

This is the payoff of LLM-powered edit understanding. The workshop doesn't just notice the edit — it UNDERSTANDS it and can have an intelligent conversation about it.

---

## Cost Model

**Per-edit costs** (the full pipeline):
- Haiku pre-filter (every edit): ~$0.001
- Sonnet understanding call (real content changes only): ~$0.02-0.05 depending on profile context loaded
- Total per meaningful edit: ~$0.02-0.05

**Session cost estimates**:
- Student making 30 edits, 20 trivial + 10 meaningful: ~$0.02 (Haiku) + ~$0.30 (Sonnet) = ~$0.32
- Student making 50 edits, 35 trivial + 15 meaningful: ~$0.05 + ~$0.50 = ~$0.55
- Debounce batching reduces this further (rapid consecutive edits collapsed into one understanding call)

**Comparison to old approach**: The Haiku impact classifier cost ~$0.002 per edit but provided only unreliable scope predictions. The new approach costs ~$0.02-0.05 per meaningful edit but provides deep understanding that feeds the workshop, the re-analysis brief, and the double-check loop. The additional cost buys dramatically better intelligence.

---

## Edge Cases & Risks

**Multiple simultaneous changes across paragraphs**: The student makes changes to P1, P3, and P5 in one submission. The understanding call receives all three diffs together and can see cross-paragraph patterns: "All three changes move from analytical to felt language — the student is doing a voice revision, not fixing individual sentences." This holistic view is another advantage of LLM understanding over mechanical per-sentence analysis.

**Rapid successive edits**: Debounce (1.5s) collapses rapid changes. The understanding call processes the accumulated diff, not each individual keystroke. If the student makes 5 changes in 3 seconds, one Sonnet call understands all 5 together.

**The "not" problem**: No longer a special case. The LLM naturally understands that adding "not" inverts meaning. It doesn't need a magnitude threshold to tell it this is significant — it reads the words and knows.

**Over-interpretation risk**: The LLM might read profound significance into a casual word swap. Mitigation: the understanding output includes confidence levels. Low-confidence interpretations are logged but don't trigger escalation unless confirmed. The Conversational Workshop can also ground-truth by asking the student.

**Under-interpretation risk**: The LLM might miss a subtle but important change buried among many edits. Mitigation: the double-check loop (section 4) compares the edit understanding's assessment against the re-analysis findings. Systematic under-interpretation is caught and calibrated.

**Cost escalation with very active editors**: A student who makes 100+ meaningful edits in a session could accumulate $2-5 in edit understanding costs alone. Mitigation: adaptive batching — after 10+ understanding calls in a session, the system groups subsequent edits into larger batches (5-minute windows) and processes them together. The workshop shifts from per-edit conversation to periodic check-ins: "You've been making a lot of changes to paragraphs 2 and 3 — want to talk about what you're working toward?"

---

## Why This Approach

**Why NOT purely mechanical (the v1 design)**: Word count ratios can't distinguish "walked → drifted" (refinement, low significance) from "decided → couldn't" (meaning evolution, high significance) from "happy → not happy" (meaning inversion, critical significance). Only reading the words in context with understanding of the essay's architecture can make these distinctions. The structured pipeline provides rigor; the LLM provides understanding.

**Why NOT the standalone Haiku classifier (the original 1D)**: Haiku was making scope predictions WITHOUT understanding the change itself. It saw "one word changed in P4S3" and guessed which profile sections might be affected. The new approach doesn't predict — it UNDERSTANDS the change first, and scope follows naturally from understanding. Understanding and scoping are inseparable.

**Why Sonnet, not Haiku, for understanding**: This is one of the most consequential calls in the system. Getting edit understanding wrong means either: (a) under-scoping, letting the profile go stale, or (b) over-scoping, wasting money on unnecessary re-analysis. Sonnet's superior reasoning handles the nuance of "does this word change alter the essay's thesis?" reliably. Haiku handles the binary pre-filter ("is this a typo or a real edit?") where it excels.

**Why a single integrated call instead of multiple steps**: The understanding, classification, mapping, and scoping all need the same context (the diff + the profile data). Splitting them into separate calls would mean loading the same context multiple times. One well-structured Sonnet call that produces all four outputs is cheaper and more coherent than four smaller calls.
