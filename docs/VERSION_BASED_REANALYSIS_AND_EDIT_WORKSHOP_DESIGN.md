# Version-Based Re-Analysis & Conversational Edit Workshop

> Conceptual design for the dual-pathway edit handling system. This replaces the "analyze every edit" model with two distinct pathways that match how students actually work.

---

## The Core Insight

The old design treated every edit as a trigger for analysis — the system was always reacting to changes, trying to determine on its own whether something was a big deal or not. The new design recognizes that editing an essay is a *process*, not a series of isolated events. Students work in bursts: they tweak a word, reconsider a phrase, rewrite half a sentence, undo it, try again. Somewhere in that flurry, they arrive at something they're satisfied with. *That* is the moment analysis becomes valuable — not during the flurry, but after it settles.

This leads to two fundamentally different experiences:

**Pathway 1 — The Conversational Edit Workshop** is the student's real-time companion while they're actively editing. It's light, responsive, conversational. It notices changes, helps the student think through them, and captures *why* things changed. It updates the profile just enough to stay coherent, but doesn't re-analyze.

**Pathway 2 — Version-Based Re-Analysis** is a deliberate act. The student says "I'm ready for a fresh read" — or the system suggests it. By this point, the system has accumulated a rich context of what changed, why, and what the student was trying to achieve. Re-analysis is therefore *cheaper* (it knows where to focus), *better* (it understands the student's intent behind changes), and *more trustworthy* (it can double-check its own light-touch adjustments from Pathway 1).

Think of it like a writing tutor. The tutor doesn't stop you mid-sentence to analyze your grammar. They watch you write, ask "what are you going for there?" when something interesting happens, and when you put the pen down and say "what do you think?", they give you a considered, informed reading.

---

## Version Tracking: What a "Version" Actually Means

A version is not every keystroke, and it's not every save. A version is the accumulated state of the essay between two analysis points — the text the student had when analysis last ran, and the text they have now.

But the text is only half the story. A version also carries a *changelog with intent annotations* — a structured record of what changed and, crucially, why.

### The Anatomy of a Version Record

Consider a student who, since their last analysis, made these changes:
- Changed "walked to my desk" to "drifted to my desk" (word swap, P2S4)
- Rewrote the last sentence of paragraph 3 entirely
- Added a new sentence to paragraph 1
- Deleted a sentence from paragraph 4

The version record captures each of these as a change entry. But if the student discussed any of these changes with the conversational workshop, the entry also includes conversation-derived context: "Student said they wanted P2S4 to feel more dreamlike — the drifting connects to the fog imagery in P5." "Student deleted P4S3 because they felt it was redundant after rewriting P3's ending."

Some changes will have conversation context. Some won't — the student just made the edit without discussing it. That's fine. The presence or absence of intent data is itself informative: changes with known intent can be analyzed more precisely, while changes without intent need the re-analysis to investigate independently.

### What Gets Stored

The version record is a lightweight structure that grows incrementally as the student edits:
- **The essay text at each analysis checkpoint** (so we can compute full diffs later and revert if needed)
- **A running list of change entries**: each with a timestamp, location (paragraph/sentence), the old and new text, the type of change (word swap, rewrite, insertion, deletion), and an optional intent annotation from conversations
- **Conversation insights collected since last analysis**: categorized (confirmation, reinterpretation, new context, preference) with their scope (which part of the essay they relate to)
- **Light-touch profile adjustments**: a log of what the conversational pathway adjusted in the profile, so re-analysis can verify these later

This is not onerous storage. Each change entry is a few hundred bytes. Even a student who makes 50 changes between analyses produces a version record under 20KB.

---

## The Conversational Edit Workshop: What the Student Experiences

The student is in the editor. They change "walked" to "drifted." What happens?

**Not every change gets a comment.** The workshop uses a lightweight detection layer (Haiku-level, effectively free) that classifies each change along two axes: *magnitude* (word swap, sentence rewrite, structural change) and *significance* (does this touch a thesis-carrying sentence? a voice-defining passage? a connection endpoint?). Most word swaps in unremarkable sentences are logged silently — the system notes the change in the version record but says nothing. The student isn't interrupted.

**Significant changes get a conversational nudge.** If the student rewrites the last sentence of their strongest paragraph, or changes a word that the profile flagged as a key voice marker, the workshop opens a gentle conversational thread: "I noticed you changed the ending of your third paragraph — the one that carries the turn in your narrative. Tell me what you're going for with the new version?" This is not analysis. There's no score, no evaluation. It's a workshop assistant asking a clarifying question.

**The student's response becomes gold.** When the student says "I felt like the old ending was too abrupt — I want the reader to sit with the image for a moment before the pivot," the system has captured something no amount of textual analysis could discover: the student's *intent*. This gets attached to the change entry in the version record. When re-analysis eventually runs, it doesn't have to guess why the paragraph ending changed — it knows.

**Sometimes the workshop helps the student think through the change.** If the student seems uncertain ("I'm not sure if this works"), the workshop can draw on its existing understanding of the essay to offer a perspective: "Your original ending created a sharp contrast with paragraph 4's opening. The new version softens that contrast — which could work if you want a more gradual emotional transition. Does that match what you're going for?" Again, no scoring, no evaluation — just helping the student think.

**The threshold for engagement is adaptive.** Early in the session (few changes), the workshop is more willing to comment — each change is relatively significant. After 15 changes in rapid succession, the threshold rises — the student is clearly in a flow state and shouldn't be interrupted. If the student hasn't engaged with any workshop prompts in the last 5 changes, the threshold rises further. If the student actively engages and asks follow-up questions, the threshold drops. The workshop learns the student's editing rhythm.

---

## Light-Touch Profile Updates: How Much Is "Enough"

When the student edits through the conversational pathway, the essay text has changed but the profile hasn't been re-analyzed. This creates a gap: the profile's sentence-level understanding refers to text that may no longer exist.

The conversational pathway makes *minimal, defensive adjustments* to keep the profile coherent without doing real analysis:

**What gets updated immediately:**
- **Sentence text references**: If the profile references the text of a changed sentence, the reference is updated to the new text. This is mechanical, not analytical.
- **Structural bookkeeping**: If sentences are added or deleted, the paragraph's sentence count and indices are adjusted. Connection references are remapped if their endpoints moved.
- **Staleness markers**: Changed sentences (and their connected sentences) get flagged as "stale" — meaning the profile's understanding and analysis for those sentences may no longer be accurate. This is a flag, not a re-analysis.

**What gets a light-touch adjustment (when conversation context exists):**
- If the student explained their intent behind a change, the sentence's `inferredIntents` can be updated with the student's own words. This is safe because the student is the authority on their own intent.
- If the workshop detected that a change aligns with or contradicts the essay's existing voice/theme (a cheap check against the ProfileIndex), a note is added to the version record for re-analysis to verify.

**What does NOT get updated:**
- Effectiveness scores, strength/weakness assessments, or any evaluative analysis. These require the LLM to actually read and judge the new text.
- Holistic sections (voice identity, thematic architecture, narrative strategy). These are too interconnected to update partially.
- Connection semantics. If a connection existed between P1S1 and P5S4 based on a shared metaphor, and the student changed P1S1's text, the system flags the connection as "needs verification" but doesn't decide whether it still holds.

The philosophy is: **keep the profile structurally sound and honestly marked** (we know what's stale, we know what the student intended), rather than attempting analytical updates that might be wrong. The light-touch adjustments are hypotheses, not conclusions. Re-analysis will verify them.

---

## Accumulated Context as Re-Analysis Fuel

This is the paradigm shift's key payoff. By the time re-analysis runs, the system is not staring at a changed essay wondering what happened. It has a rich dossier:

**The change log** tells it exactly which sentences changed, when, and how much. It can immediately see that all changes were concentrated in paragraphs 2 and 3 (focus there), or scattered across the whole essay (broader scope needed), or all word-level tweaks in one paragraph (very focused).

**Conversation insights** tell it *why* things changed. "The student said the diamond metaphor wasn't landing — they rewrote P3 to make the metaphor more physical." Now re-analysis doesn't need to independently discover the relationship between the old and new P3 — it knows the student's goal and can evaluate whether the rewrite achieved it.

**Light-touch adjustments** give it hypotheses to verify. "We tentatively updated P2S4's inferred intent to 'creating a dreamlike transition.' Re-analysis should check: does the new text actually achieve this? Did we capture the full impact?"

**The pattern of changes** reveals the student's editing strategy. All changes in one paragraph suggest a focused rewrite — re-analysis can treat the rest of the essay as stable. Changes concentrated on voice-carrying sentences suggest a voice revision — re-analysis should pay special attention to voice consistency. A mix of additions and deletions suggests structural experimentation — more comprehensive scope might be warranted.

### How This Context Gets Packaged for Re-Analysis

The version record gets distilled into a *re-analysis brief* — a structured summary designed to be injected into the re-analysis prompts. It answers three questions for the LLM:

1. **What changed?** A structured diff at the paragraph and sentence level — not character-by-character, but semantically meaningful ("P2S4: word swap, 'walked' to 'drifted'. P3S5: full sentence rewrite. P1: new sentence inserted after S2.").

2. **Why did it change?** The student's stated intents, quoted from conversations. "Student's goal for P3 rewrite: 'I want the reader to feel the weight of the diamond before I talk about what it means.'" Where no intent was captured: "No conversation context — student edited without discussion."

3. **What did we already tentatively assess?** The light-touch adjustments and staleness flags. "P2S4's intent was tentatively updated to 'dreamlike transition.' P3S5 is marked fully stale — no light-touch assessment attempted. The connection between P1S1 and P5S4 is flagged for verification."

This brief replaces the blind "here's a changed essay, figure it out" approach. The LLM starts from a position of *knowledge*, not ignorance.

### The Cost Implication

Because the re-analysis brief tells the system exactly where to focus, mode selection becomes more precise. Changes that would have been classified as "ambiguous — default to comprehensive" can now be confidently routed to focused mode because we know from conversation context that the student was working on voice in one paragraph, not restructuring the essay. The conversation context acts as a free impact classifier, often more accurate than the Haiku-based classifier because it has the student's own words about their intent.

Estimated savings: 20-40% reduction in re-analysis cost for sessions where the student actively engaged with the conversational workshop, because mode selection is more precise and focused analysis prompts are better targeted.

---

## The Double-Check Loop: Verifying Light-Touch Adjustments

After re-analysis completes, the system has two readings of the changed areas: the light-touch adjustments from Pathway 1 (quick, conversational, hypothesis-level) and the full re-analysis from Pathway 2 (thorough, LLM-evaluated, authoritative).

The double-check compares them:

**Agreement**: The light-touch adjustment said "P2S4's change strengthens the dreamlike quality" and re-analysis confirmed "drifted creates a dissociative quality that enhances the reflective tone." These align — the light-touch system's judgment was sound.

**Disagreement — light-touch missed something**: Re-analysis discovered that the word change in P2S4 actually broke a subtle rhythmic pattern that connected P2 to P4's pacing. The light-touch system didn't catch this because it doesn't analyze craft at the inter-paragraph level. This is expected and fine — it's exactly why re-analysis exists.

**Disagreement — light-touch was wrong**: The light-touch system flagged P3's rewrite as "likely improves the metaphor's physicality" based on the student's stated intent. Re-analysis found the rewrite actually made the metaphor more abstract, not more physical — the student's intent didn't match their execution. This is valuable feedback both for the student ("you wanted this to be more physical, but the new version actually moved in the opposite direction") and for the system (the student's stated intent is useful context but isn't always reliable as an assessment).

### Building a Feedback Loop

Over time, the double-check results reveal patterns in the light-touch system's accuracy. If it consistently overestimates the impact of word-level changes (flagging them as significant when re-analysis finds them negligible), the significance threshold for word swaps can be tuned upward. If it consistently misses ripple effects from changes to connection endpoints, the staleness propagation for connected sentences can be made more aggressive.

This isn't a machine learning loop — it's more like calibration data that informs prompt tuning and threshold adjustment. The double-check produces structured comparison records ("light-touch predicted X, re-analysis found Y, delta = Z") that can be reviewed periodically to spot systematic biases.

---

## When to Suggest Re-Analysis

The student can always trigger re-analysis manually — a "Get Fresh Analysis" button that says "I've made changes and I want your updated read." But the system should also suggest it at the right moments.

**Signal-based suggestions** (the system notices something worth flagging):
- **Cumulative change volume**: "You've edited 8 sentences across 3 paragraphs since your last analysis. Want a fresh read to see how it all fits together?" The threshold is adaptive — a student who typically makes 20 changes before requesting analysis has a higher threshold than one who requests after every 3.
- **Structural change**: "You added a new paragraph — the essay's structure has shifted. A fresh analysis would help me understand how everything flows now." Structural changes almost always warrant re-analysis; the suggestion is more of a strong nudge.
- **Thesis-area changes**: "You rewrote the sentence I identified as thesis-carrying. That's a significant change — want me to re-read with fresh eyes?" Changes to the essay's most structurally important elements get faster suggestions.
- **Contradictory light-touch signals**: If the light-touch system's staleness markers are piling up — many sentences flagged stale, connections unverified, holistic sections increasingly out of date — the system recognizes its own declining reliability: "I've been tracking your changes but my understanding is getting thin. A fresh analysis would give us both a clearer picture."

**Anti-annoyance safeguards**:
- Never suggest more than once per editing session without the student making additional changes
- Never suggest during a rapid editing burst (respect the flow state)
- If the student dismisses a suggestion, wait for at least 5 more changes before suggesting again
- Frame suggestions as helpful, not prescriptive: "When you're ready" not "You should"

---

## Edge Cases and Risks

**Tiny change, immediate re-analysis request.** The student changes one word and clicks "Analyze." This is fine — it just runs focused mode. The version record has one entry, no conversation context, straightforward. The system doesn't penalize this or discourage it; it's just expensive relative to the value. Over time, the student learns that the conversational workshop handles small changes more naturally.

**Massive changes, no re-analysis request.** The student rewrites 60% of their essay over a week but never requests re-analysis. The profile becomes increasingly stale — most sentences flagged, holistic sections unreliable, connections unverified. The system suggests re-analysis with increasing confidence. If the student ignores suggestions, the conversational workshop becomes less useful (it's drawing on a profile that's largely outdated). Eventually the system is honest: "I've lost track of your essay's current shape — my understanding is based on a much earlier version. A fresh analysis would let me be genuinely helpful again."

**Reverted changes.** The student changes a sentence, discusses it with the workshop, then changes it back. The version record captures both changes. If the student requests re-analysis, the system sees the net change is zero for that sentence — the revert cancels the edit. But the conversation insight ("student considered changing this but decided against it") is still valuable context. The student's reason for reverting often reveals something about their understanding of the essay's needs.

**Contradictory changes.** The student improves voice consistency in P2 but introduces a telling-not-showing problem in P3. The conversational workshop can notice this at a surface level ("Your P3 edit states the emotion directly — your P2 changes were doing a beautiful job of showing instead of telling. Want to try a similar approach here?"). But the full assessment waits for re-analysis, which has the analytical depth to evaluate the trade-off holistically.

**Session boundaries.** If the student leaves and comes back tomorrow, the version record persists. The conversational workshop picks up where it left off, with the accumulated change log and conversation insights intact. Re-analysis doesn't require a single continuous session.

---

## Why This Is Better Than "Analyze Every Edit"

The analyze-every-edit approach has three fundamental problems that this design solves:

**1. Waste.** Most edits during active writing are exploratory. The student tries something, decides against it, tries something else. Analyzing each attempt burns cost and latency on versions that won't survive five minutes. Version-based re-analysis waits until the student has settled, analyzing only the version that matters.

**2. Blindness.** Without conversation context, re-analysis stares at changed text and has to independently reconstruct what the student was trying to do. This is like reading a diff without the commit message — you can see WHAT changed but not WHY. The conversational pathway captures intent, making re-analysis both faster and more perceptive.

**3. Disruption.** Constant analysis results popping up while the student is actively editing breaks their creative flow. The conversational workshop matches the student's rhythm — quiet during flow states, engaged during reflection. Re-analysis happens when the student is ready to receive it.

The dual-pathway design turns what was a reactive system (change happens, system scrambles to understand it) into a *collaborative* system (student works with a companion who helps them think, and when they're ready, provides a deep, informed reading). The system gets smarter as the student works, instead of starting from scratch every time.
