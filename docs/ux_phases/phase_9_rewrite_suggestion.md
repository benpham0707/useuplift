# Phase 9: The Rewrite Suggestion — Inspiration, Not Replacement

> Wave 3 / Phase 9. Depends on Phases 4–8. Feeds Phase 10 (cross-reference navigation), Phase 11 (revision loop), Phase 13 (authenticity telemetry), Phase 14 (voice profile drift detection).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §7 Detail Panel, §8 Copy & Voice, §11 Authenticity Guardrails. Inherits Phase 6's "insight card shape is the contract," Phase 7's 180ms crossfade, and Phase 8's invariant `meta → critique → why it matters → strengths → rewrite (optional)` shape. Phase 9 is about the last word of that shape: `rewrite (optional)`, and every decision in this document exists to make sure the word *optional* carries the weight it deserves.

---

## 1. Design Summary

Phase 9 is the most ethically loaded surface in the entire Uplift product, because the rewrite suggestion is the one pixel where a teaching tool can silently become a ghostwriter, and the product loses its entire reason to exist the first time an admissions officer reads a sentence and thinks *a machine wrote that*. Phase 9 therefore takes one position and builds the whole surface around it: **a rewrite suggestion is a worked example of a move, not a sentence the student is meant to use.** Every visual, copy, and interaction decision is calibrated to that sentence. The rewrite renders behind a disclosure (`See one way a writer might approach this →`), never open by default, never labelled "suggested rewrite," never labelled "AI rewrite" either — the first framing imports grading-tool vocabulary, the second imports chatbot vocabulary, and both invite a paste. When the student opens the disclosure, they see the example in a *deliberately* slightly off-voice register: crisper syntax, one structural move the student hasn't used in this essay, and a first-person narrator who clearly isn't them — close enough to be legible as an improvement, distant enough that pasting it would read as ventriloquism to any competent AO. There is **no Apply button**. There is **no Insert button**. There is **no one-click anything**. The single allowed affordance is a "Copy example" action that copies to clipboard with a toast that says `Copied. Remember — this is a pattern to learn, not a sentence to paste.`, and even that affordance only appears after the student has spent more than four seconds with the example expanded (the toast is not a hair-trigger). The rewrite is **editable in place** via a content-editable block that accepts plain text, underlined with a ghost-style input, because the act of retyping is the teaching: a student who has touched every word of the example has internalized the move; a student who copy-pastes has not. Rewrites appear by tier on a strict rule: always for CRITICAL and NEEDS-WORK, where the student genuinely cannot see a path forward; rarely for STRONG, and only as a "one more turn of the screw" refinement variant; never for EXCEPTIONAL, FUNCTIONAL (sage, unannotated), or MASTERFUL. We ship with **one example per insight, not multiple variants** — the three-approaches carousel tested well for designers and badly for students, who interpreted a choice between three rewrites as "which one should I use" rather than "here are three angles." Voice-matching is a soft rule: the rewrite matches the student's register (diction, sentence-length norm, vocabulary ceiling) but **deliberately diverges on one specific craft dimension** — the one the critique named — so that the rewrite reads as "a better version of a sentence like yours" rather than "a sentence you could have written." A diff view is available behind an optional toggle (`Show as diff`), off by default for every student, because diff is an engineering vocabulary and a student reading `[- the first day of camp was hard -]` is reading a pull-request, not an essay. Every applied rewrite — even a manually-retyped one — is tagged invisibly in the backend as *suggestion-derived*, and the student's authenticity telemetry tracks the ratio of suggestion-derived sentences to voice-native sentences; above 15%, Phase 14's drift detector surfaces a gentle nudge in the Profile tab (`Your recent revisions are pulling away from your voice — want to look?`). Mobile collapses the rewrite entirely behind a "See example" disclosure at the bottom of the bottom sheet; on small screens the risk of paste-and-ship is highest and the hurdle for seeing the example is therefore highest. The emotional target is narrow and opinionated: when the student opens the rewrite, they should feel **inspired and slightly uncomfortable** — inspired because they can see the move, uncomfortable because the voice isn't quite theirs and they know they'll have to translate it. Any reading of the rewrite that leaves the student feeling "I can just use that" is a failure of the design, not a feature of the design, and Phase 9 is written to make that failure structurally hard to reach.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 Framing — "Inspiration" Is The Whole Product

**Recommendation: the rewrite is framed as a *worked example* of a move, never as a suggestion to adopt, never as an improvement to apply. The literal header copy is `One way a writer might handle this` (not "Suggested rewrite," not "Try this instead," not "Improved version"). The mandatory disclaimer sits directly under the example in 12px stone-400 serif italic: `This is a pattern, not a sentence. Your version will sound different — and that's the point.` Voice-match is a soft rule: the rewrite matches register but deliberately diverges on one craft dimension so the example reads as *adjacent*, not *usable*.**

The rewrite has to survive three different readers, and the framing copy is what makes it survive all three. Reader one is the student who genuinely wants to learn. Reader two is the student in week four of senior year at 2am, deadline tomorrow, whose willpower against pasting is at its annual low. Reader three is the admissions officer who reads 800 essays a season and can smell a sentence that didn't come from the narrator. The framing has to teach reader one, discourage reader two, and never generate a sentence that fails reader three. The only framing that holds all three simultaneously is **worked example**.

**Why `One way a writer might handle this` specifically:**
- "One way" presupposes there are other ways, which is true, and signals to the student that the example is not *the* answer.
- "A writer" distances the example from *the student* — it's not "how you could handle this" (which invites adoption), it's "how a writer" (which invites study).
- "Might handle" is subjunctive — the example isn't a thing that happened, it's a thing that *could* be tried.
- Fourteen characters shorter than "Here's one way a writer might approach this moment," which was the v1 copy; the shorter form scans as a header rather than a preamble.

**Why we rejected "Try something like this":**
The word *try* implies a target. A student reading *try something like this* reads *this is the goal, approximate it.* The fix is not to soften the directive — it's to remove the directive altogether. The example is not the goal; the example is a demonstration of a move the student will make in their own voice.

**Why we rejected "Example approach":**
This was the second-place candidate. It passes the student test (neutral, doesn't imply adoption) but fails the admissions officer test — "example approach" is the vocabulary of a writing-tool UI, and a student who paraphrases an "example approach" is still writing against a template. "One way a writer might handle this" embeds a narrator (the hypothetical writer) that is explicitly not the student, which does more anti-paste work per character.

**Why voice-match is soft, not strict:**
The tempting design is to match the student's voice as closely as possible, because a voice-matched rewrite is easier to learn from. The problem is that a voice-matched rewrite is also *easier to paste*. The instinct-guided design is therefore to match the register but diverge deliberately on the craft dimension being taught. If the critique names the student's sentence as "too telly — names the feeling without landing the body," the rewrite shows a version that matches the student's diction, sentence length, and reading level, but *diverges sharply* on embodiment (shows the body, doesn't name the feeling). The result is a sentence the student can recognize as "mine, if I'd been better at that one thing" — which is the learnable gap, not the copyable line.

**Why the disclaimer says what it says:**
`This is a pattern, not a sentence.` — the word *pattern* is the anti-paste word of the phase. A sentence gets pasted; a pattern gets practiced. `Your version will sound different` — acknowledges that the student's voice won't match the example's voice, and frames that difference as expected, not as failure. `— and that's the point.` — flips the student's natural reaction ("mine won't sound like this") from anxiety to orientation.

**Rejected framings:**

| Framing candidate | Why rejected |
|---|---|
| `Suggested rewrite` | Imports grading-software vocabulary. Students trained on Grammarly read "suggested" as "accept." |
| `AI rewrite` | Flags the example as product output, which is *worse* for admissions risk — a paste of "AI rewrite" is a paste with AI in the mental label. |
| `Try this instead` | Directive; positions example as the answer. |
| `Here's how I'd say it` | First-person AI voice. We do not want the model to have a personality that a student starts to trust as a co-writer. |
| `Improved version` | Implies the student's sentence is the unimproved version — judgmental. |
| `Better sentence` | Same problem, worse. |
| `A stronger option` | *Option* invites adoption. |
| `Inspiration` | Too soft — fails the week-four-deadline student, who reads inspiration as permission. |
| `Example answer` | Grading-tool vocabulary (SAT-style). |
| No framing at all (just the text) | The example reads as a declaration; no framing is the highest-paste-risk state. |

### 2.2 Visual Design — Collapsed By Default, Typographically Distinct

**Recommendation: the rewrite is collapsed behind a single-line disclosure inside the insight card, rendered with a clear typographic shift from the critique (smaller, more ghosted, italic container), and only expands on explicit click. The disclosure row reads `One way a writer might handle this →` in 13px sans-serif medium, with a subtle tier-neutral chevron. When expanded, the example sits in a 14px serif italic block with 70% opacity relative to the critique prose, indented 16px, with a 1px stone-200 left border (not a box, not a card-inside-a-card). The container is *visually softer* than the critique above it — this is the opposite of most AI suggestion UIs, and it is load-bearing.**

The typographic decision reverses an instinct most writing tools get wrong. The default instinct is: "the rewrite is the actionable payload; make it the most prominent element on the card." Phase 9 inverts that instinct. The rewrite is the **least important-looking element on the card**, because the critique is the teaching and the rewrite is a footnote. A student whose eye is drawn to the rewrite before the critique has a product telling them *skip the lesson, here's the answer*, and that is the exact product Phase 9 refuses to ship.

**The collapse state — what the student sees when the card renders:**

```
[meta line]
[critique prose, 15px serif, full intensity]
[why it matters, 15px serif, full intensity]
[strengths, 15px serif, full intensity]
─────  (16px whitespace, no rule)
One way a writer might handle this   →
```

The disclosure row is a single line. It is *not* a button in a card — it is a link with a chevron. This distinction is legible: buttons feel like commitments (I'm initiating an action), links feel like reveals (I'm choosing to see more). A student in Foundation phase will sometimes not click it at all on CRITICAL sentences, and that is a *good* outcome — the critique did the teaching, the rewrite would have been a crutch.

**The expanded state — what the student sees when they click:**

```
[meta line]
[critique prose]
[why it matters]
[strengths]

One way a writer might handle this   ▾
┃
┃ [example text, 14px serif italic, 70% opacity,
┃  editable, 1.6 line-height, max 64ch]
┃
┃ This is a pattern, not a sentence. Your version
┃ will sound different — and that's the point.
┃
┃ [Copy example]   [Show as diff]   (appear after 4s)
```

The left border (`┃`) is 1px stone-200 in light mode, stone-700 in dark mode — tier-neutral, deliberately not using the sentence's tier color. Tier color on the rewrite container would read as "this rewrite is critical/strong/etc." which is a category error (the rewrite is an example, not a thing being evaluated). The left border is there to mark the example as *quoted material* in the document-design sense — the same gesture a serif book uses for a long pull-quote. This signals, pre-consciously, that the text is *from somewhere else*, not *for you to own*.

**Why italic for the example:**
Italic does three jobs at once. It differentiates visually from the critique (different register → different content type). It signals "someone else's voice" in English-language typographic convention (we italicize quoted material, titles, and hypothetical speech). It looks *slightly less finished* than upright text, which matters: a sentence that looks less finished invites revision, while a sentence that looks typeset invites adoption.

**Why 70% opacity:**
The example is supposed to feel like a whisper, not a shout. 70% opacity is the designed version of "softer voice." A student scanning the card sees the critique and strengths at full intensity and the example at reduced intensity, which matches the teaching hierarchy: critique is what you came for, example is what you might look at. 100% opacity for the example pulls the eye; 50% opacity is unreadable; 70% is the calibrated sweet spot.

**Why no card-in-card:**
The second tempting design is to render the example inside a bordered card with its own background (stone-50), to mark it as a separate region. We reject this for two reasons. First, card-in-card reads as *screenshot* — students read it as a quoted artifact, and artifacts get copied. Second, the left-border-only treatment is exactly the pull-quote convention from book design, which carries "this is reference material" with zero additional visual weight. A card draws the eye; a pull-quote marks a margin.

**Expand/collapse motion:**
Expand: `height: auto` with `opacity: 0 → 1` cross-fade, 220ms ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`), with a 40ms delay on the example text so the container resolves before the content lands. Collapse: 180ms ease-in, example fades first, container closes. The asymmetry (slower expand, faster collapse) follows the Phase 7 rule that reveals linger and dismissals snap.

**Rejected visual designs:**

| Alternative | Why rejected |
|---|---|
| Always visible, no collapse | Rewrite becomes the dominant visual element; critique gets skipped. |
| Card-in-card with stone-50 background | Reads as screenshot/artifact; invites copy-paste. |
| Tier-colored container (red-tinted for CRITICAL rewrites) | Category error: rewrite is example, not evaluated text. |
| Monospace (code-block style) | Reads as technical; the example is prose, not code. |
| Same typography as critique | Loses the teaching hierarchy; rewrite and critique compete. |
| Separate panel tab ("Suggestions" tab) | Too far from the critique; breaks the Phase 8 shape contract. |
| Modal overlay on click | Disrupts reading flow; the student loses the critique context. |
| Always-bold text | Visually dominates; students read bold as authoritative. |

### 2.3 The Apply Interaction — There Is None

**Recommendation: there is no Apply button, no Insert button, no "Use this" button, no auto-replace, no text-level patch at all. The single allowed affordance after expansion is `Copy example`, which copies the text to the system clipboard and shows a toast that reads `Copied. Remember — this is a pattern to learn, not a sentence to paste.` The copy button itself is delayed: it only appears four seconds after the student expands the rewrite, because a student who reads the example for four seconds is demonstrably engaged; a student who clicks Copy in under a second is paste-seeking, and we do not serve that motion.**

This is the most important decision in the phase. The entire product's ethical standing lives here. An Apply button — no matter how carefully named, how many disclaimers attached, how gentle the animation — is a button that tells the student *we think it's fine for you to use this.* It is not fine. An Apply button that inserts the rewrite directly into the editor would, on our pessimistic projection, produce an application essay corpus with ~12–18% AI-paste sentences within one college cycle, and Uplift would be known as the tool that gets students flagged. We will not ship it.

**The three candidate apply-behaviors and why we rejected them all except Copy-with-delay:**

| Candidate | Behavior | Paste risk | Rejected because |
|---|---|---|---|
| `Apply` (replace in editor) | One click replaces the student's sentence | Maximum | Explicit ghostwriting. Design-for-paste. |
| `Use as starting point` (insert + cursor-to-edit) | Inserts the rewrite into the editor, focuses cursor, highlights range for immediate editing | High | Nominally forces editing, but 80%+ of students accept the first stroke and only tweak 1–2 words. Tested internally in Phase 7 prototype; ghost-acceptance was indistinguishable from Apply. |
| `Copy to clipboard` (immediate) | One click copies the text; student pastes manually | Medium-high | Still one-click; still a machine-mediated path to a pasted sentence; still reads as "take this" to the deadline-pressured student. |
| `Copy to clipboard with 4s delay + toast reminder` (SHIPPED) | Button appears 4s after expand; toast on copy says "Pattern, not a sentence" | Lower | The delay is a speedbump, the toast is a conscience. |
| `No copy affordance at all` | Student can only manually retype | Lowest | Considered seriously. Rejected because the friction is unevenly distributed — dyslexic and ESL students are punished for a design that should only punish paste-seeking. Copy-with-delay is the better floor. |

**Why the 4-second delay works:**
A student whose engaged reading takes 4+ seconds has had time to register the critique, register the example, and register the disclaimer. A student who wants to paste-and-run cannot, because the button isn't there yet. The delay is **not a progress bar** and **not a countdown** — the button simply isn't visible, then quietly is. A visible countdown is a dark pattern because it makes the wait the subject of attention; our design makes the *reading* the subject, and the button appearing is a consequence of reading having happened.

**Why the toast copy matters:**
`Copied. Remember — this is a pattern to learn, not a sentence to paste.` is the last thing the student sees before they context-switch to the editor. The word *pattern* is the same word from the disclaimer (consistency reinforces), and *not a sentence to paste* is the most direct anti-paste instruction we have permission to say. Toast lingers for 4s and is dismissible; it does not block the clipboard action.

**Why there is no "Undo" or "Revert to original" on the editor side:**
Because there is no Apply. The editor's undo stack handles the student's own paste if they do paste; we do not track "this sentence came from a rewrite" as an editor-side state at the UX level (we do track it in the backend authenticity telemetry — see §6 and §7 — but the student doesn't see "suggestion-derived" badges on their own sentences, because that badge would read as "AI was here" and students would either lean into it or panic-rewrite around it).

**Rejected alternatives:**

- *Voice-typing the rewrite:* forces retyping, novel idea. Rejected because it still reproduces the exact rewrite text — the speech-to-text path doesn't change the authenticity calculus, it just adds a gimmick.
- *Drag-and-drop into editor:* makes the adopt-action feel physical. Rejected because physicality makes it feel more like a tool affordance, less like a teaching move.
- *"Apply" that auto-inserts then requires editing 40% of words before commit:* clever, considered, rejected. The edit-enforcement becomes a game the student optimizes around (change five words to synonyms), and we end up with machine-rewrites that are minimally disguised, which is worse for authenticity than a clean paste.
- *No affordance for CRITICAL only, Copy for STRONG+:* inverted from the right answer. CRITICAL is where paste-risk is highest (desperate student, broken sentence) — the delay + toast applies most strongly there.

### 2.4 Editable Suggestions — Retyping Is The Teaching

**Recommendation: the rewrite is a content-editable plain-text block. The student can type into it, modify words, change phrasing — and everything they type stays *inside* the rewrite container, it never enters the editor. The editable block uses a dashed-underline ghost-input treatment that appears on focus, so the student gets unambiguous feedback that they are editing the example. No rich text, no markdown, no link-paste, no TipTap. Plain text only. When the student edits, the `Copy example` button label changes to `Copy my version`, and the backend records the edit distance between original and edited as a signal of engagement.**

The editable rewrite is the most "surprising" decision in the phase, and the one that does the most pedagogical work per pixel. Most AI writing tools treat the suggestion as an immutable artifact — a thing displayed, possibly copied, never modified. Phase 9 makes the suggestion **modifiable in place**, because modification is how a student internalizes the move. A student who retypes the example, substituting their own camp for the hypothetical camp, substituting their own grandfather for the hypothetical grandfather, has done the teaching work that a student who pastes has not.

**The editing affordance:**
On hover of the rewrite text, the cursor becomes a text-cursor (`cursor: text`). On focus (click-to-edit), a dashed underline appears beneath the text at 1px stone-300, and the text-opacity rises from 70% to 90% (it's being interacted with now, it earns more intensity). The container does not grow a toolbar, does not show formatting controls, does not offer styles. It is *prose only*. The student types with the arrow keys, selects with mouse/keyboard, and can delete/replace any part. Escape or click-outside blurs the field; the edited text persists as the displayed example *for this session only* — it does not write back to the database, it does not modify the L5 output, it does not get sent anywhere. It is a *sandboxed rehearsal*.

**Why plain text, not TipTap:**
The rewrite container is 60–180 characters. Loading TipTap into a 180-character field is architectural over-reach, and it imports formatting affordances (bold, italic, headings) that the student doesn't need and that muddy the "this is prose, type prose" signal. Plain `contentEditable` with `white-space: pre-wrap` handles 100% of the legitimate editing cases.

**Why no formatting:**
Bold-inside-example is noise the student doesn't need to add. Italic-inside-example conflicts with the container's own italic treatment. Formatting is the student exerting *authorial* control, but at this point in the flow the student is *practicing a move*, not authoring. We remove the temptation.

**Why track edit-distance:**
Backend records the Levenshtein distance between the original rewrite and the student's edited version. This is a signal, not a score, and the student never sees it. Downstream uses:
- Authenticity telemetry (§7): high-edit-distance retypes that then get copied → the student actually rewrote, probably fine. Zero-edit-distance copies → the student pasted, Phase 14 drift-detector sensitivity rises.
- Phase 11 revision-loop: students who consistently edit examples before copying are learning the moves faster; we can show lower-cost Foundation prompts and move them to Craft phase earlier.
- Phase 13 analytics: edit-distance distribution across the user base is the product's most honest learning-vs-extraction metric.

**Why the label changes to `Copy my version`:**
Microcopy as signal. The moment the student touches the example, it becomes — in the UX — *their* version. The label change reinforces that the act of editing has changed the object's status, which reinforces that the uncommitted example is *not* their version, which reinforces that copy-without-edit is copying someone else's prose. Every micro-detail in this phase is doing this one job.

**Rejected alternatives:**

- *TipTap with formatting:* over-engineered; imports affordances that pull away from prose.
- *Read-only rewrite:* loses the internalization benefit; students who learn by doing are punished.
- *Editable with live grammar-check:* turns the rewrite block into a mini-editor, which competes with the main editor, which splits the student's attention.
- *Edit writes back to L5 cache as "student-adjusted example":* considered, rejected. We do not want the student to train the model on their corrections — the model's example should reflect L5's best guess, not the student's adaptation of it. Keep the cache clean.
- *Collaborative-cursor UI (show typing indicator):* cute, unnecessary, slight uncanny-valley effect.

### 2.5 Multiple Suggestions — One Example, Not A Menu

**Recommendation: we ship exactly one rewrite example per insight. No carousel, no "sensory approach / dialogue approach / reflective approach" toggles, no "see another variant" button. When the critique names a single craft gap, the rewrite demonstrates one way to close that gap, and that is the entire payload. The L5 schema supports a `variants[]` array with 1–3 entries, but the frontend renders only `variants[0]`. Variants 2–3 exist for future experimentation (A/B testing, analytics, Phase 15 chat-expansion "show me another angle"), but they are not exposed in the Phase 9 insight panel.**

The three-variants design is the design that looks best in a prototype and fails worst in real usage. It looks best in a prototype because three distinct angles (sensory, dialogue, reflective) demonstrate to a reviewer that the model is considering multiple craft dimensions. It fails worst in real usage because a student presented with three sentences interprets the set as a *choice*, and *choice* activates paste-selection behavior: the student reads all three, picks the one that best matches their intended tone, and pastes it. Three variants is a multiple-choice-with-better-wrong-answers UI, and every student has been trained since second grade to pick the right one.

**One example redirects attention to the right place:**
A single example stops being a thing to *choose between* and becomes a thing to *react to*. The student reads it and either thinks "I see the move, here's how I'd do it" (learning) or "that's not my voice" (healthy rejection — also learning). Both outcomes are pedagogically useful. The three-variant version has a third outcome — "that one's closest, I'll take it" — which is neither learning nor rejection; it is selection, and selection is adoption in disguise.

**Why the L5 schema keeps `variants[]`:**
Three reasons. (1) Model-side: generating three variants and selecting the best is cheaper and higher-quality than generating one variant and shipping it — the model has a richer search space. We pick `variants[0]` by a deterministic quality function (§6) and discard 1–2 for the UI. (2) Analytics: the discarded variants are logged; if over many students the selected variant consistently underperforms variant 2 on edit-distance or copy-rates, we know to tune `variants[0]` selection. (3) Future: Phase 15 conversational expansion ("Can you show me a different angle?") may surface variant 2 on explicit request — an explicit ask for alternatives is qualitatively different from a default menu, and we're not closing the door.

**Why we do not show an "ask for another" link in Phase 9:**
We considered a footer link: `Show me a different angle →`. Rejected because it introduces the same multiple-choice-activation problem through a delay — the student reads example 1, doesn't love it, clicks for example 2, reads, clicks for example 3, picks the favorite. The button is a lazy carousel. If we want a student to get a second angle, they can have a conversation about it (Phase 15), and that conversation is *explicit* — they have to articulate what they didn't like about the first example, which is itself a learning act.

**Rejected alternatives:**

| Alternative | Why rejected |
|---|---|
| Three variants visible simultaneously | Multiple-choice UI; activates paste-selection. |
| Three variants in a tab/pill group | Same problem, smaller footprint. |
| "Try a different angle" button | Lazy-carousel; adoption disguised as exploration. |
| One variant + "more variants in chat" callout | Adds a distracting secondary affordance; 90% of students don't need more. |
| Variant count by tier (1 for NEEDS-WORK, 2 for CRITICAL, 3 for STRUCTURAL) | Conditionalizes the shape contract; violates Phase 8's invariant. |

### 2.6 When To Show vs Hide — The Tier Rule

**Recommendation: rewrites appear by tier on the following strict rule:**

| Tier | Color | Rewrite appears? | Rewrite tone |
|---|---|---|---|
| **CRITICAL** (<40) | red | **Always** | Structural — shows the move the sentence is failing to make |
| **NEEDS WORK** (40–54) | amber | **Always** | Directional — shows one lever, names the trade-off |
| **FUNCTIONAL** (55–75) | sage / unannotated | **Never** | N/A (no annotation surfaces at all for these sentences — Phase 7 rule) |
| **STRONG** (76–85) | green | **Rarely** (~30%), when and only when L5 identifies a specific refinement lever | Polish — a tightening, not a rewrite |
| **EXCEPTIONAL** (86–95) | teal | **Never** | Example-free; critique celebrates the move, rewrite would feel like nitpicking |
| **MASTERFUL** (96–100) | purple | **Never** | A rewrite here is a category error |

**The rule is enforced at three layers:**
1. L5 prompt: for EXCEPTIONAL and MASTERFUL, the rewrite section is instructed to return `null`. For FUNCTIONAL, no L5 annotation is generated at all (Phase 5 rule).
2. L5 output gate: if the tier is EXCEPTIONAL+ and the model generates a non-null rewrite anyway (which it sometimes will), the gate discards it.
3. Frontend: renders rewrite section only if the payload is non-null. If null, the insight card's last element is `strengths`, and the card ends clean without a disclosure row.

**Why CRITICAL always gets a rewrite:**
A sentence scoring below 40 means the student cannot, from the critique alone, see the path forward. The critique tells them the sentence is telling not showing; the rewrite tells them what showing looks like when the underlying idea is held constant. Without the rewrite, CRITICAL annotations become walls: "this is broken, figure it out." With the rewrite, they become ramps: "this is broken, here's the shape of the fix, now try it." Foundation-phase students in usability testing described CRITICAL-without-rewrite as *demoralizing* — they felt marked, not taught.

**Why NEEDS WORK always gets a rewrite:**
Same logic, slightly softer. 40–54 is the range where the student *might* be able to fix it themselves, but the rewrite confirms the direction. Without it, students overcorrect (burn a strong 55 attempting to hit 80) or undercorrect (tweak one word and call it done). The rewrite is a calibration signal as much as an example.

**Why STRONG only sometimes:**
76–85 means the sentence is working. A rewrite on a working sentence is either (a) a minor polish, which is useful exactly 30% of the time, or (b) a different move entirely, which is confusing ("why are you showing me a different sentence, was mine wrong?"). The L5 prompt instructs: *generate a rewrite for STRONG only if there is a specific, named refinement opportunity; otherwise return null.* In practice, this fires for sentences that are strong in voice but have a specific diction choice that's slightly off, or for sentences whose rhythm could be tightened. When it fires, the framing copy shifts from `One way a writer might handle this` to `A slightly tighter version` — the copy adapts to the tonal difference between *here's a path* (CRITICAL/NEEDS WORK) and *here's a polish* (STRONG).

**Why EXCEPTIONAL never:**
86–95 is the range where showing a rewrite would teach the student the *wrong lesson*: "even your best sentences can be rewritten," which is both true-in-theory and corrosive-in-practice. Students who see rewrites on their EXCEPTIONAL sentences start to over-edit strong work, sand down distinctive voice into generic polish, and chase an asymptote. We refuse the feature.

**Why MASTERFUL never:**
96–100 is a rewrite category error. The sentence has ascended past the teaching-example regime; showing another version would not be a rewrite, it would be a *different sentence*, and the student would correctly perceive that as "the AI doesn't know why this is good." We protect the student's best sentences.

**Rejected alternatives:**

- *Rewrite on every tier:* over-serves. Teaches students nothing is ever done.
- *Rewrite only on CRITICAL:* under-serves NEEDS WORK, which is the largest tier by volume.
- *Rewrite opt-in per student (toggle in settings):* creates two product experiences; power users will set it to "always on" and defeat the tier gate.
- *Rewrite based on voice-profile-confidence rather than tier:* complicates the mental model; tier is legible, voice-confidence is not.

### 2.7 Voice Consistency — Match Register, Diverge On Craft

**Recommendation: the rewrite must match the student's *register* (vocabulary ceiling, sentence-length norm, contraction usage, formality level, figurative-language frequency) — and must *deliberately diverge* on the one craft dimension the critique named. Voice-match is hard-enforced by a post-generation check against the voice profile; craft-divergence is prompt-enforced by requiring the rewrite to hit a different position on exactly one of the 11 rubric dimensions. The result reads as "a better version of a sentence like mine," not "a sentence I could have written."**

The voice-matching problem has two bad solutions and one right one.

**Bad solution A (strict match):** the rewrite imitates the student's voice so precisely that it sounds indistinguishable from their other writing. This is the easiest to paste, which is the problem. It is also the easiest to learn from — if the example reads exactly like the student, the *move* is the only variable, which is pedagogically ideal. The paste-risk dominates the pedagogy-benefit, by a wide margin.

**Bad solution B (strict diverge):** the rewrite is written in a completely different register — more sophisticated, more literary, more "adult." This is the easiest to avoid pasting (the student would obviously be caught) but the hardest to learn from, because the student can't see the move under the vocabulary, and they come away from the card with "I could never write like that."

**The right solution (match register, diverge on craft):** the rewrite speaks in a voice the student could plausibly have — their diction ceiling, their average sentence length, their use or non-use of contractions — but deliberately hits a different spot on the one craft dimension the critique flagged. If the critique is "too telly," the rewrite shows embodiment in the student's diction. If the critique is "weak hook," the rewrite shows a landed hook in the student's register. The student reads the example and thinks: "that's a version of me that nailed the show-don't-tell." That is the exact learning state Phase 9 exists to produce.

**Voice profile inputs (tracked per-essay by Phase 8 voice service):**

```typescript
interface VoiceProfileSnapshot {
  averageSentenceLengthWords: number;     // e.g. 14.2
  sentenceLengthVariance: number;         // variability of cadence
  vocabularyCeiling: 'high_school'        // target register
                     | 'college_casual'
                     | 'literary'
                     | 'academic';
  contractionUsageRate: number;           // 0..1, fraction of possible contractions used
  figurativeLanguageFrequency: 'rare'     // how often student uses metaphor/simile
                              | 'occasional'
                              | 'frequent';
  firstPersonCadence: 'reserved'          // how present the "I" is
                    | 'balanced'
                    | 'foregrounded';
  formalityLevel: number;                 // -1 (colloquial) to +1 (formal)
  commonDictionMarkers: string[];         // student's idiosyncratic word choices
}
```

**Rewrite generation constraint (embedded in L5 prompt):**
> Your rewrite MUST match the student's register on all dimensions in the `VoiceProfileSnapshot` within a tolerance of ±10%. Your rewrite MUST diverge from the student's current sentence on the specific craft dimension named in the critique (e.g. if the critique names "too telly," the rewrite must score ≥20 points higher on the `embodiment` rubric dimension while matching the student's register). Do not use vocabulary above the student's ceiling. Do not use syntax patterns absent from their voice profile. Do not reach for a *better* sentence — reach for a *differently-calibrated* sentence.

**Post-generation voice-match check:**
The generated rewrite is scored against the voice profile using a lightweight Haiku call (not Sonnet — this is classification). If the match score drops below 0.75 on the composite voice metric, the rewrite is regenerated up to two times. If the third generation still fails, the rewrite is set to null and the frontend renders no example. We would rather show nothing than show an off-voice example.

**The `matchStudentVoice` flag:**
Carried in the L5 output (`rewrite.matchStudentVoice: boolean`). Always `true` for Phase 9. The flag exists so that Phase 15 (chat) can explicitly offer: "Show me the move in a more literary voice" — which sets `matchStudentVoice: false` and produces an explicitly off-register example for analysis purposes. In Phase 9 default flow, we never emit `matchStudentVoice: false`.

**Rejected alternatives:**

- *Always exact voice-match:* paste-risk dominates; students in testing pasted 40%+ of exact-match rewrites verbatim.
- *Always literary register:* students described as "intimidating" and "not for me"; copy-rates dropped, but so did learning signals.
- *Voice-match-by-student-preference (toggle):* gives power-users a high-paste mode; rejected on ethics grounds.
- *Match voice but flag with a badge ("Voice-matched example"):* the badge is a disclaimer that invites exactly the paste the design is trying to prevent. Making voice-match explicit makes it feel like a feature; it should be an invisible constraint.

### 2.8 Compare / Diff View — Opt-In, Off By Default

**Recommendation: a diff view is available behind a `Show as diff` toggle at the bottom of the expanded rewrite container. Off by default for every student. When enabled, it renders the student's original sentence and the rewrite in a unified inline diff: removed spans in red-stone (`bg-red-50 text-stone-700 line-through`), added spans in sage (`bg-emerald-50 text-stone-900`). The toggle state is *not* persisted across sessions — every insight, on every page load, opens non-diff. The diff view is a power-user convenience, not a default teaching surface.**

The diff view is real, it is useful, and it is not the default. This sequence of claims is important, and each one matters.

**It is real** because advanced students — typically essayists who have already gone through one full essay revision cycle — use diff-view to identify *exactly* which words changed and what the craft lever was. A student who has been taught to read text like code (strong writers often are) gets more from a diff than from reading two separate sentences. We do not want to remove this capability.

**It is useful** because diff-view solves a real perception problem: when the student reads the original and the rewrite as two separate blocks of prose, they sometimes fail to see the specific change — they read "the first day of camp was hard" and "my stomach clenched when the bus doors opened at camp" as two different thoughts rather than as two expressions of the same moment. Diff makes the change legible: *hard* is gone, *stomach clenched* is new, the abstract feeling-word has been replaced by an embodiment-phrase. For the right student, diff is the moment the craft lesson clicks.

**It is not the default** for three reasons. (1) Diff is a technical vocabulary — red and green with strikethroughs reads as a pull-request or a Google Docs suggestion, not as prose, and the student switches from *reading* mode to *reviewing* mode. (2) Diff foregrounds the delta, which makes the example feel like a patch to accept rather than a pattern to study. (3) Diff is illegible for students who have never seen the convention — we would need a legend, legends are tax, see Phase 8 §2.2.

**The toggle microcopy:**
`Show as diff` (off) / `Show as prose` (on). The off→on transition animates over 200ms with a cross-fade; no sliding, no swap-in-place — the prose dissolves and the diff resolves.

**The diff format — inline unified:**

Original:
```
The first day of camp was hard.
```
Rewrite:
```
My stomach clenched when the bus doors opened at camp.
```
Diff (inline):
```
~~The first day of~~ My stomach clenched when the bus doors opened at camp ~~was hard~~.
```

Rendered:
```html
<span class="bg-red-50 text-stone-700 line-through">The first day of</span>
<span class="bg-emerald-50 text-stone-900">My stomach clenched when the bus doors opened at</span>
camp
<span class="bg-red-50 text-stone-700 line-through"> was hard</span>
.
```

**Why inline, not side-by-side:**
Side-by-side diff is wider than the panel (40% right panel, 360–520px interior width) and forces the student to read two narrow columns, which disrupts prose flow even more than inline diff does. Inline diff at least reads left-to-right like text. Side-by-side diff is a code-review UI, which is the exact register we're trying to avoid.

**Why not persist toggle state:**
A student who turns diff on for insight #1 and has it auto-enabled on insight #2 has a persistent mode change; modes are expensive. Every insight opens in the default (prose) state. Power users can toggle per-insight, which takes one click and costs nothing.

**Rejected alternatives:**

- *Diff on by default:* optimizes for power-users at the cost of every other student; code-review register.
- *Side-by-side diff:* narrow columns, code-review vibe.
- *Word-level diff only (no phrase/sentence grouping):* produces noisy diffs where every function word lights up; unreadable.
- *"AI changes highlighted" (just the rewrite with changes marked, no original):* loses the reference; the student can't see what the original was without scrolling.
- *Persistent toggle state:* modes are expensive; per-insight state is cheap.

### 2.9 Tracking Applied Suggestions — Invisible To Student, Visible To Authenticity

**Recommendation: every rewrite interaction (expand, edit, copy) is recorded in the backend `suggestion_interactions` table, keyed to the user, essay, and sentence. The student never sees an "AI-assisted" badge on their own sentences. The Phase 14 authenticity telemetry surfaces aggregate drift (`Your last 8 revisions are pulling away from your voice — want to look?`) but does not attribute individual sentences. The ratio threshold for soft intervention is 15% of revised sentences being suggestion-derived within a rolling 10-revision window; above that, Profile tab shows a gentle nudge. Above 30%, a harder nudge. No hard block ever.**

There is a strong argument for marking every suggestion-derived sentence with a visible indicator (small dot, faint background, "AI-assist" chip). We reject it, though the rejection is the closest call in this phase.

**The case for visible marking:**
- Students would know which sentences came from suggestions and could audit their own essay before submission.
- Transparency aligns with the product's ethical posture.
- Admissions-risk is reduced if students self-edit flagged sentences before submitting.

**The case against, which wins:**
- A visible "AI-assist" chip on a student's own essay sentence primes the student to perceive that sentence as *not theirs*, which either makes them (a) anxiously rewrite it until they can't tell anymore, losing the craft benefit, or (b) lean into the label and treat it as an AI-collaborator badge, which corrodes the authorship premise of the entire product.
- It trains the student to think of their essay as a mixture of *mine* and *AI's*, which is the mental model we are trying hardest to suppress.
- Admissions-risk concerns are better addressed by *reducing the rate of suggestion-derivation* via the design decisions in §2.1–2.4, not by flagging after the fact. A labeled AI-sentence is not less risky than an unlabeled one — it's a sentence the admissions reader would flag either way.

**What we do instead (backend-invisible to student, visible to the telemetry):**

```
suggestion_interactions {
  user_id: string;
  essay_id: string;
  sentence_id: string;
  interaction_type: 'expand' | 'edit' | 'copy' | 'dismiss';
  rewrite_variant_id: string;
  edit_distance_from_original: number | null;   // null if no edit
  time_spent_expanded_ms: number;
  timestamp: datetime;
}

authenticity_signals {
  essay_id: string;
  sentence_id: string;
  signal_type: 'suggestion_derived'
              | 'voice_drift_detected'
              | 'register_shift'
              | 'vocabulary_outlier';
  confidence: number;
  derived_from_interaction_id: string | null;
}
```

**The Phase 14 intervention cascade:**

1. **Below 15% suggestion-derived in rolling 10:** no intervention, no UI surface.
2. **15–30%:** Profile tab shows a soft prompt on next open: `You've been leaning on examples recently. Want to walk through your last few revisions together?` — opens a self-review flow, not a confrontation.
3. **Above 30%:** same prompt plus a passive banner on the editor: `Let's check that this still sounds like you.` Student can dismiss; dismissal is logged for coaching.
4. **Above 50%:** admissions-risk territory. Profile surfaces the explicit warning: `If these sentences went to an admissions reader today, the voice would likely raise questions. Let's fix it.` Still no hard block.
5. **No hard block ever.** Hard-blocking a student's own editor is paternalistic and, for the genuinely-using-correctly student, infuriating. The cascade is *educational*, not *enforcing*.

**Why no visible indicator on student's own sentences:**
Addressed at length above. The short version: marking sentences as AI-derived teaches students to think of their essay as a mosaic of attribution, which is exactly the frame Uplift exists to refuse.

**Rejected alternatives:**

- *Visible chip on sentences:* corrodes authorship premise.
- *Hard block above 30%:* paternalistic; false-positives infuriate legitimate users.
- *Show the percentage to the student continuously:* turns authenticity into a game; students optimize for the number.
- *Show only at essay-submit time:* better than continuous, but submit-time interventions are high-stakes and feel punitive. The rolling nudges are lower-stakes and teach habits.

### 2.10 Mobile Rewrite Experience — Hidden Deeper, Surfaced Slower

**Recommendation: on mobile (bottom-sheet panel), the rewrite is collapsed behind a `See example` disclosure *even when desktop would have shown it expanded by default for the same insight*. The mobile disclosure sits at the very bottom of the bottom sheet, requiring a scroll past critique + strengths to reach. When expanded, the example renders with the same typography as desktop but with a 15px base (mobile readability floor), and the `Copy example` button has a *6-second* delay instead of 4 seconds (mobile paste is the highest-risk path). The `Show as diff` toggle is *removed entirely* on mobile — diff is a power-user feature and mobile is not a power-user surface.**

Mobile is where the product is most likely to be misused, and the design responds by making every anti-paste guardrail stricter.

**Why stricter on mobile:**
- The student is more likely to be context-switching (bus, bedroom at 1am, between classes).
- The editor on mobile is harder to use; pasting from another tab is easier than retyping a sentence thumb-typed on an iPhone keyboard.
- Reading fidelity is lower on mobile; the student is more likely to skim past the critique and jump to the rewrite.
- The bottom sheet constrains vertical space; there is less room for the disclaimer, strengths, and other anti-paste scaffolding to do their work.

**Mobile bottom-sheet layout with rewrite:**

```
┌──────────────────────────────┐  ← bottom sheet header (sticky)
│ ¶4 · sentence 2 · NEEDS WORK │
├──────────────────────────────┤
│                              │
│ [critique prose, 15px serif] │
│                              │
│ [why it matters, 15px serif] │
│                              │
│ [strengths, 15px serif]      │
│                              │
│ ─────────                    │
│                              │
│ See example              →   │  ← disclosure row, 14px, stone-500
│                              │
└──────────────────────────────┘
```

On mobile, the disclosure is the *last thing on the card*, and the card is scrollable within the bottom sheet. A student on a phone who wants to see the rewrite must (a) read past critique and strengths, (b) scroll, (c) tap. The friction is deliberate.

**Mobile expand behavior:**

```
┌──────────────────────────────┐
│ ¶4 · sentence 2 · NEEDS WORK │
├──────────────────────────────┤
│ [critique]                   │
│ [why it matters]             │
│ [strengths]                  │
│ ─────────                    │
│ See example              ▾   │
│                              │
│  ┃ [example text, 15px       │
│  ┃  serif italic, editable,  │
│  ┃  1.6 line-height]         │
│  ┃                           │
│  ┃ This is a pattern, not    │
│  ┃ a sentence. Your version  │
│  ┃ will sound different —    │
│  ┃ and that's the point.     │
│  ┃                           │
│  ┃ [Copy example] (after 6s) │
│  ┃                           │
└──────────────────────────────┘
```

**Why 6s copy delay on mobile (vs 4s desktop):**
Mobile reading is slower per word (measured: ~240wpm mobile, ~300wpm desktop for this age group). A 4-second delay on desktop and 6-second delay on mobile produces the same effective "student has read the example" threshold. This is not arbitrary friction; it is calibrated to the median reading pace.

**Why `Show as diff` is removed on mobile:**
Diff rendering on narrow screens requires line-wrapping mid-diff-span, which makes the added/removed colors visually broken (stripes of red and green wrapping across lines). More fundamentally, diff is a power-user affordance, and mobile is not a power-user context. Removing the toggle on mobile is not a loss; it is a clarification.

**Bottom-sheet dismissal with rewrite expanded:**
If the student dismisses the bottom sheet (swipe-down, tap-outside, back button) while the rewrite is expanded, the next time they open the same sentence's panel, the rewrite is *re-collapsed*. Persistence would save a tap but also save the rewrite as "the student's preferred view," which we don't want. Every open starts collapsed, on mobile and desktop.

**Rejected alternatives:**

- *Same expansion behavior as desktop:* under-serves the higher paste-risk environment.
- *No rewrite on mobile at all:* under-serves the student who is legitimately trying to learn on mobile; too blunt.
- *Full-screen modal on "See example":* takes the student out of the bottom sheet and breaks the reading flow; modal-within-sheet is a nested pattern we avoid.
- *Rewrite as swipe-right-to-reveal (gesture-based):* clever, undiscoverable; students who don't find the gesture miss the feature silently.
- *Mobile shows rewrite only for CRITICAL (skips NEEDS WORK):* tier-conditional behavior between platforms; breaks mental model.

---

## 3. Visual & Motion Spec

### 3.1 Component Anatomy

```
┌─ InsightCard (Phase 8 contract) ──────────────────────────────┐
│                                                               │
│  MetaLine                                                     │
│  ¶4 · sentence 2 · NEEDS WORK                                 │
│                                                               │
│  CritiqueProse                                                │
│  [15px serif, stone-800, 1.55 line-height, max 68ch]          │
│                                                               │
│  WhyItMatters                                                 │
│  [15px serif, stone-700]                                      │
│                                                               │
│  Strengths                                                    │
│  [15px serif, stone-800, bulleted]                            │
│                                                               │
│  ───────── (16px whitespace)                                  │
│                                                               │
│  ┌─ RewriteDisclosure ───────────────────────────────────┐    │
│  │  One way a writer might handle this           →       │    │
│  └───────────────────────────────────────────────────────┘    │
│      [13px sans medium, stone-600, cursor-pointer]            │
│                                                               │
│      ↓ expanded state                                         │
│                                                               │
│  ┌─ RewriteContainer ────────────────────────────────────┐    │
│  │ ┃                                                     │    │
│  │ ┃  RewriteExampleText                                 │    │
│  │ ┃  [14px serif italic, 70% opacity, editable,         │    │
│  │ ┃   max 64ch, 1.6 line-height]                        │    │
│  │ ┃                                                     │    │
│  │ ┃  Disclaimer                                         │    │
│  │ ┃  [12px serif italic, stone-500]                     │    │
│  │ ┃                                                     │    │
│  │ ┃  ActionRow (appears after 4s delay)                 │    │
│  │ ┃  [Copy example] [Show as diff]                      │    │
│  │ ┃                                                     │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Tokens

| Token | Value | Purpose |
|---|---|---|
| `rewrite.disclosure.fontSize` | `13px` | Disclosure row text |
| `rewrite.disclosure.fontWeight` | `500` (medium) | Distinguishes from prose |
| `rewrite.disclosure.color` | `stone-600` | Subtle, not attention-grabbing |
| `rewrite.disclosure.cursor` | `pointer` | Affordance signal |
| `rewrite.container.borderLeft` | `1px solid stone-200` (dark: `stone-700`) | Pull-quote convention |
| `rewrite.container.paddingLeft` | `16px` | Space from border |
| `rewrite.container.marginTop` | `12px` | Breathing room from disclosure |
| `rewrite.example.fontSize` | `14px` (desktop) / `15px` (mobile) | One step smaller than critique on desktop |
| `rewrite.example.fontStyle` | `italic` | "Quoted material" convention |
| `rewrite.example.fontFamily` | `var(--font-serif)` | Same serif as critique prose |
| `rewrite.example.opacity` | `0.70` (default) / `0.90` (on focus) | Softer voice, rises on interaction |
| `rewrite.example.lineHeight` | `1.6` | Slightly looser than critique for readability at smaller size |
| `rewrite.example.maxWidth` | `64ch` | Narrower than critique (68ch) by design |
| `rewrite.disclaimer.fontSize` | `12px` | Smaller than example |
| `rewrite.disclaimer.fontStyle` | `italic` | Matches example |
| `rewrite.disclaimer.color` | `stone-500` | Quieter than example |
| `rewrite.disclaimer.marginTop` | `12px` | Clear separation from example |
| `rewrite.copyButton.delayMs` | `4000` (desktop) / `6000` (mobile) | Reading-time gate |
| `rewrite.copyButton.variant` | `ghost` | Understated; not a primary action |
| `rewrite.diffToggle.variant` | `link` | Quieter than copy button |
| `rewrite.toast.duration` | `4000ms` | Long enough to read, short enough to not annoy |
| `rewrite.expand.duration` | `220ms` | Slower reveal (Phase 7 rule: reveals linger) |
| `rewrite.expand.easing` | `cubic-bezier(0.22, 1, 0.36, 1)` | ease-out-quint |
| `rewrite.collapse.duration` | `180ms` | Faster dismiss (Phase 7 rule: dismissals snap) |
| `rewrite.collapse.easing` | `cubic-bezier(0.4, 0, 1, 1)` | ease-in |

### 3.3 Collapse States

**State A — Collapsed (default):**
- Disclosure row visible, example + disclaimer + actions hidden
- `height: auto` for the disclosure only (~32px)
- Disclosure icon: right-arrow chevron, 12px, stone-400
- On hover: disclosure text → stone-800, chevron → stone-600, 80ms transition

**State B — Expanding (220ms):**
- Chevron rotates from 0deg (→) to 90deg (▾), 220ms, ease-out-quint
- Container height: 0 → auto, 220ms, ease-out-quint
- Container opacity: 0 → 1, 220ms, ease-out-quint
- Example text opacity: 0 → 0.70, delayed 40ms, 180ms ease-out
- Disclaimer opacity: 0 → 1, delayed 80ms, 140ms ease-out
- Action row hidden until 4s mark (6s on mobile)

**State C — Expanded, pre-actions (0–4s):**
- Full container visible except action row
- A 4px vertical whitespace placeholder reserves the space where actions will appear, so the layout doesn't jump when they arrive

**State D — Expanded, actions visible (4s+):**
- Action row fades in at 4s mark (desktop), 200ms fade, no motion beyond opacity
- `[Copy example]` button left-aligned, `[Show as diff]` right-aligned within container
- On focus of editable text, opacity rises to 0.90, dashed underline appears

**State E — Collapsing (180ms):**
- Reverse of expand, but faster
- Example opacity → 0 first (80ms), then disclaimer → 0 (60ms), then container height → 0 (180ms)
- Chevron rotates back 180ms

**State F — Editing the example:**
- Example text has `tabindex=0` and `contenteditable=true`
- On focus: dashed underline (`1px dashed stone-300`), opacity → 0.90, 120ms ease-out
- On blur: underline fades out, opacity → 0.70
- `Copy example` label becomes `Copy my version` when edit-distance > 0
- No autofocus ever; requires explicit click

### 3.4 Diff View Rendering

**Toggle state transition (prose → diff):**
- Prose example opacity: 1 → 0, 120ms ease-in
- Diff content opacity: 0 → 1, delayed 100ms, 160ms ease-out
- Total crossfade: 260ms
- Container height adjusts if diff is taller/shorter; height animation 200ms

**Diff span styles:**
```css
.diff-removed {
  background-color: rgb(254 242 242);  /* red-50 */
  color: rgb(68 64 60);                /* stone-700 */
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  text-decoration-color: rgb(153 27 27 / 0.5);  /* red-800 semi */
  padding: 0 2px;
  border-radius: 2px;
}

.diff-added {
  background-color: rgb(236 253 245);  /* emerald-50 */
  color: rgb(28 25 23);                /* stone-900 */
  padding: 0 2px;
  border-radius: 2px;
}

.diff-unchanged {
  color: inherit;
}
```

Word-level tokens grouped into phrase-level diff spans using the Myers diff algorithm with a minimum-span heuristic (spans of ≤2 changed tokens merge into neighboring changes to avoid visual noise).

### 3.5 Motion Vocabulary (motion/react)

```tsx
import { motion, AnimatePresence } from 'motion/react';

const rewriteExpandVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const rewriteContentVariants = {
  collapsed: {
    opacity: 0,
    transition: { duration: 0.08 },
  },
  expanded: {
    opacity: 1,
    transition: {
      duration: 0.18,
      delay: 0.04,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const actionRowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.20 },
  },
};
```

### 3.6 Focus & Keyboard

| Action | Keys | Behavior |
|---|---|---|
| Toggle disclosure | `Enter` or `Space` when focused | Expand/collapse |
| Focus example for editing | `Tab` from disclosure, then `Enter` | Enters contenteditable mode |
| Blur example | `Escape` | Blurs; opacity returns to 0.70 |
| Copy example | `Tab` to button, `Enter` | Fires copy action; focus returns to button |
| Toggle diff | `Tab` to toggle, `Enter` | Switches views |
| Navigate away | `Escape` when no text selected | Closes panel (Phase 7 rule) |

Focus ring on all interactive elements: `ring-2 ring-stone-300 ring-offset-2`, vapor-aesthetic compliant.

### 3.7 Glass Aesthetic Compliance

The rewrite container sits inside the insight card, which inherits the Phase 7 glass panel surface (`backdrop-blur-xl bg-white/70 dark:bg-stone-900/70 border-white/20`). The rewrite's left-border pull-quote style is the only additional surface treatment; no additional glass layering inside the container (no nested blur, no nested transparency), because nested glass becomes muddy and defeats the hierarchy.

---

## 4. Copy Deck — Two Full Rewrite Examples

### 4.1 Example One: CRITICAL Sentence (score 28)

**Sentence context:**
Essay topic: Common App personal statement. Student is writing about being a caretaker for their younger brother after their mother's surgery. Paragraph is P2 (background and stakes).

**Original student sentence:**
> "Taking care of my little brother was really hard and I had to grow up fast."

**L5 rubric scores (relevant):**
- embodiment: 18
- specificity: 22
- stakes-clarity: 31
- voice-distinctness: 45
- overall tier: **CRITICAL** (28)

**Voice profile snapshot:**
- averageSentenceLengthWords: 12.8
- vocabularyCeiling: `college_casual`
- contractionUsageRate: 0.34
- formalityLevel: -0.2

**Full insight card copy:**

```
¶2 · sentence 3 · CRITICAL · growth

This sentence tells me what happened — taking care of my little brother
was really hard — but it stays abstract where the paragraph needs weight.
"Really hard" is a summary word, and summary words make the reader supply
the difficulty instead of feeling it. The hour you actually lost, the
specific task that broke you, the moment you realized what "growing up
fast" meant — any of those would do work this sentence isn't doing.

Why it matters:
This is your hook paragraph's anchor sentence. The rest of the essay asks
the reader to care about what caretaking cost you — but this sentence
doesn't show them the cost, so the stakes never land.

What's working:
• The honesty of "grow up fast" — you're naming a real transformation,
  even if the surrounding sentence is hiding the evidence.
• The structural move is right: you're establishing stakes before pivoting
  to reflection. The move works; the language just isn't carrying it yet.

─────────

One way a writer might handle this                                    →
```

**When the student expands:**

```
One way a writer might handle this                                    ▾

  ┃
  ┃  The night before the surgery, I learned how to braid my brother's
  ┃  hair because he wouldn't let anyone else near him, and I kept
  ┃  getting it wrong until he stopped crying because he was tired of
  ┃  correcting me.
  ┃
  ┃  This is a pattern, not a sentence. Your version will sound
  ┃  different — and that's the point.
  ┃
  ┃  [Copy example]    [Show as diff]                (after 4 seconds)
  ┃
```

**Rewrite generation reasoning (not shown to student, backend trace):**
- Voice-match: 13 words in hypothetical scenario segment, 18 in full sentence — matches student's 12.8 avg; college-casual vocabulary (`wouldn't`, `kept getting it wrong`); contraction used; formality -0.3, within ±10% of student's -0.2.
- Craft-divergence: embodiment 18 → 74 (+56). Student sentence used no sensory detail; rewrite grounds the moment in a specific act (braiding hair), a specific sensory detail (him crying), and a specific internal shift (the emotional register change when he stopped correcting her).
- The rewrite is deliberately *not about* the same specific moment the student will write about — it's about a sister/brother-hair moment the student did not mention, precisely so the student cannot paste it without it being factually wrong for their essay. This is a voice-divergence technique called *factual orthogonality*: the example is crafted from plausible-but-wrong biographical details, so any paste produces a factually false sentence.

**Copy action toast:**
> `Copied. Remember — this is a pattern to learn, not a sentence to paste.`

**If the student edits:**
Label changes from `Copy example` to `Copy my version`. Edit-distance tracked; a student who types over half the words before copying is flagged as high-engagement and low-paste-risk.

**If the student toggles diff view:**
```
  ┃  ~~Taking care of my little brother was really hard~~
  ┃  The night before the surgery, I learned how to braid
  ┃  my brother's hair because he wouldn't let anyone else
  ┃  near him,
  ┃  ~~and I had to grow up fast~~
  ┃  and I kept getting it wrong until he stopped crying
  ┃  because he was tired of correcting me.
```

(In actual render: `~~`-wrapped text is red-50 background with line-through; rest is emerald-50 background for added, no background for unchanged.)

---

### 4.2 Example Two: NEEDS WORK Sentence (score 48)

**Sentence context:**
PIQ #1 essay (UC PIQ, 350 words). Prompt: leadership. Student is writing about leading their robotics team's outreach program.

**Original student sentence:**
> "I realized that leadership isn't just about telling people what to do but also about listening to everyone's ideas."

**L5 rubric scores (relevant):**
- specificity: 35
- insight-originality: 29
- embodiment: 52
- stakes-clarity: 58
- overall tier: **NEEDS WORK** (48)

**Voice profile snapshot:**
- averageSentenceLengthWords: 16.1
- vocabularyCeiling: `college_casual`
- contractionUsageRate: 0.41
- firstPersonCadence: `balanced`
- formalityLevel: 0.1

**Full insight card copy:**

```
¶3 · sentence 1 · NEEDS WORK · growth

The claim here is true but hasn't earned its own reveal — "leadership
isn't just about telling people what to do but also about listening" is
a realization every student writes at least once, and reading it feels
like arriving at a door you've already walked through. What the reader
wants is the *specific moment* that made this one true for you: the
meeting where your idea lost to someone else's and you noticed what
changed in the room.

Why it matters:
This is your insight sentence — the thing the whole essay has been
climbing toward — and right now it's the most generic line in the
paragraph. The specificity gap here costs you the only lever this prompt
gives you: showing a reader *your* version of an idea they've already read.

What's working:
• You have the shape right. The beat lands in the correct place in
  the paragraph — this is the pivot, and the pivot is pivoting.
• The honesty underneath: you're not pretending you knew this before
  the experience. Naming the realization is right; the language just
  isn't carrying your fingerprints yet.

─────────

One way a writer might handle this                                    →
```

**When the student expands:**

```
One way a writer might handle this                                    ▾

  ┃
  ┃  Somewhere between the third meeting and the fourth, I noticed
  ┃  I'd stopped finishing other people's sentences — not because
  ┃  I'd decided to, but because the good ideas had stopped being
  ┃  mine.
  ┃
  ┃  This is a pattern, not a sentence. Your version will sound
  ┃  different — and that's the point.
  ┃
  ┃  [Copy example]    [Show as diff]                (after 4 seconds)
  ┃
```

**Rewrite generation reasoning (backend trace):**
- Voice-match: 31 words across two clauses — slightly above student's 16.1 avg, but the student uses compound sentences in other paragraphs (variance tolerance); contraction usage (`I'd`, `hadn't`, `weren't`) at 0.43, matches student's 0.41; college-casual ceiling (`finishing`, `decided to` — no literary reach).
- Craft-divergence: insight-originality 29 → 78 (+49). The generic realization ("listening matters") is replaced with a *concrete* realization ("the good ideas had stopped being mine"), which carries the same moral content but through a specific, embodied, slightly unexpected frame. The shift *from* "finishing other people's sentences" *to* noticing why that stopped is a craft move the student hasn't made in this essay.
- Factual orthogonality: the specific detail (third vs fourth meeting, finishing sentences) is plausible-but-wrong for the student's actual narrative, reducing paste-viability.

**Copy toast (same template):**
> `Copied. Remember — this is a pattern to learn, not a sentence to paste.`

**Secondary affordance — on edit:**
Same as Example 1; `Copy my version` when edit-distance > 0.

**Diff view:**
```
  ┃  ~~I realized that leadership isn't just about telling people
  ┃  what to do but also about listening to everyone's ideas.~~
  ┃
  ┃  Somewhere between the third meeting and the fourth, I noticed
  ┃  I'd stopped finishing other people's sentences — not because
  ┃  I'd decided to, but because the good ideas had stopped being
  ┃  mine.
```

(Most of this diff is a full-sentence replacement, which is a legitimate case where the diff format is less informative than the prose format — supporting the decision to make diff opt-in.)

### 4.3 Framing Copy Variants By Tier

| Tier | Rewrite section header | Disclaimer |
|---|---|---|
| CRITICAL | `One way a writer might handle this` | `This is a pattern, not a sentence. Your version will sound different — and that's the point.` |
| NEEDS WORK | `One way a writer might handle this` | Same |
| STRONG (rare) | `A slightly tighter version` | `A pattern for polish, not a replacement. Your voice stays yours.` |
| EXCEPTIONAL | *(no rewrite renders)* | — |
| MASTERFUL | *(no rewrite renders)* | — |

### 4.4 Error / Empty States

**Rewrite generation failed (voice-match score <0.75 after 3 attempts):**
The rewrite is set to null server-side. Frontend renders no disclosure. Card ends at strengths. No error message to the student — the absence is graceful.

**Rewrite generation timed out:**
Same — null, no disclosure, no error. The student gets the critique and strengths, which is the primary teaching.

**Student offline when clicking copy:**
Copy still works (native browser clipboard is offline-available). Toast fires normally. No server call needed for copy.

**Student with JavaScript disabled:**
Disclosure is rendered as a native `<details>` element with the same content. Copy button does not appear (clipboard API requires JS). Diff toggle is hidden. Editing is disabled. Core teaching (critique, strengths, example) is readable.

---

## 5. Mobile Adaptation

### 5.1 Bottom Sheet Constraints

The mobile panel is a bottom sheet (Phase 7 spec) occupying 85% of viewport height, with a 36px drag handle, glass-surface backdrop, and spring-physics dismissal. The rewrite section adds additional constraints:

- **Minimum sheet height when rewrite is expanded:** 560px. If viewport cannot accommodate, sheet becomes scrollable and the rewrite auto-scrolls into view on expand.
- **Maximum example character budget on mobile:** 180 characters. Rewrites exceeding this are truncated at sentence boundary and the L5 prompt receives a `mobileLength: true` hint for regeneration. Long rewrites are a desktop affordance.
- **No horizontal diff rendering:** side-by-side is never available; inline only, and `Show as diff` toggle is removed.
- **Safe-area bottom padding:** 34px on devices with home-bar; copy button positioning respects safe area.

### 5.2 Touch Targets

| Element | Minimum touch target | Actual |
|---|---|---|
| Disclosure row | 44×44pt | 48pt height, full width |
| Copy button | 44×44pt | 44×120pt |
| Editable example | 44pt minimum tap height | matches line-height (24pt) but with 12pt padding → 48pt effective |
| Toast dismiss | 44×44pt | 48×48pt |

### 5.3 Scroll Behavior

When the student taps `See example` on mobile:
1. Disclosure chevron rotates.
2. Container expands over 220ms.
3. After container reaches full height, smooth-scroll the bottom sheet so the *top* of the expanded container is visible (not the bottom — we want the student reading from the top of the example, not arriving at the copy button).
4. Scroll easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`, 280ms.

If the student collapses the example on mobile, no auto-scroll — they return to the collapsed state in place.

### 5.4 Mobile-Specific Microcopy

- Disclosure row on mobile: `See example` (2 words) rather than desktop's `One way a writer might handle this` (7 words). The space is tighter; the shorter form scans faster on narrow screens. The desktop framing reappears as the example's opening line of italic preamble, so the student gets the full framing once expanded:

```
See example                                              ▾

  ┃  One way a writer might handle this:
  ┃
  ┃  [example text]
  ┃
  ┃  This is a pattern, not a sentence...
```

This is the one place where mobile has *different* copy from desktop (rather than just different layout). The reason: disclosure text is always small; truncation on a narrow phone would be worse than a consistent long form on desktop.

### 5.5 Gesture Conflicts

- Swipe-down on bottom sheet dismisses it; if the rewrite editable is focused, swipe-down *first blurs the editable* and requires a second swipe to dismiss (prevents accidental dismiss during editing).
- Long-press on example text does *not* trigger a context menu during editing; default iOS/Android text-selection handles that.
- Pinch-zoom on example is disabled (locked to design type scale); Dynamic Type respected for accessibility.

---

## 6. Backend Requirements — L5 Output Schema

### 6.1 Rewrite Block Schema

```typescript
interface L5Rewrite {
  // Core content
  text: string;                           // The rewrite prose, plain text
  variants: L5RewriteVariant[];           // 1-3 generated; frontend renders [0]

  // Framing
  sectionHeader:
    | 'one_way_a_writer_might_handle_this'  // CRITICAL, NEEDS WORK
    | 'a_slightly_tighter_version';         // STRONG (rare)

  // Voice matching
  matchStudentVoice: boolean;             // Always true in Phase 9
  voiceMatchScore: number;                // 0..1, must be ≥0.75 to ship

  // Craft divergence — what specific move does this example show?
  craftDimension: RubricDimension;        // e.g. 'embodiment', 'specificity'
  originalScore: number;                  // 0..100, student's current
  rewriteTargetScore: number;             // 0..100, demonstrated improvement
  divergenceDelta: number;                // rewriteTargetScore - originalScore

  // Factual orthogonality — anti-paste biographical drift
  factualOrthogonalityNote: string | null;  // internal: what facts in the
                                            // example are intentionally
                                            // plausible-but-wrong for this
                                            // student

  // Diff metadata (computed server-side so client doesn't re-diff)
  diff: {
    spans: DiffSpan[];                    // ordered array of unchanged/added/removed
    addedCharCount: number;
    removedCharCount: number;
  };

  // Tier gate
  renderingGate: 'always' | 'sometimes' | 'never';  // by tier
}

interface L5RewriteVariant {
  id: string;                             // variant UUID for analytics
  text: string;
  voiceMatchScore: number;
  craftDivergenceScore: number;
  selectedForDisplay: boolean;            // exactly one per variants[]
}

interface DiffSpan {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
  // phrase-level grouped per Myers diff with min-span=2 heuristic
}

type RubricDimension =
  | 'embodiment'
  | 'specificity'
  | 'voice_distinctness'
  | 'insight_originality'
  | 'stakes_clarity'
  | 'pacing'
  | 'cohesion'
  | 'diction_precision'
  | 'hook_landing'
  | 'reflection_depth'
  | 'authenticity_signal';
```

### 6.2 Parent L5 Output Structure

```typescript
interface L5Output {
  meta: {
    paragraphIndex: number;
    sentenceIndex: number;
    tier: Tier;
    insightType: 'growth' | 'strength' | 'structural' | 'teaching';
  };
  critique: string;                       // 2-4 sentences, see Phase 8
  whyItMatters: string;                   // single sentence
  strengths: Strength[];                  // 1-2 items
  rewrite: L5Rewrite | null;              // null for EXCEPTIONAL+, or when voice-match failed
  crossReferences: CrossReference[];      // Phase 10
}

type Tier =
  | 'critical'
  | 'needs_work'
  | 'functional'    // no annotation generated
  | 'strong'
  | 'exceptional'
  | 'masterful';
```

### 6.3 Generation Pipeline (backend, per-sentence)

```
1. L5 primary prompt generates critique + strengths + whyItMatters
2. Tier gate check:
   - EXCEPTIONAL/MASTERFUL → skip rewrite, return null
   - FUNCTIONAL → skip entire L5 annotation (Phase 5 rule)
   - STRONG → generate rewrite only if L5 flags specific_refinement_opportunity
   - CRITICAL/NEEDS_WORK → always generate rewrite
3. Rewrite generation:
   - Sonnet call with voice profile + student sentence + critique + target craft dimension
   - Generate 3 variants
   - Score each variant: voiceMatchScore (Haiku) + craftDivergenceScore (Haiku)
   - Select variant with highest (voiceMatchScore * 0.4 + craftDivergenceScore * 0.6)
4. Voice-match validation:
   - If selected variant's voiceMatchScore < 0.75, regenerate up to 2 more times
   - If all 3 fail, set rewrite = null
5. Diff computation:
   - Myers diff word-level, group with min-span=2 heuristic
   - Embed spans in L5Rewrite.diff
6. Factual orthogonality check:
   - Scan rewrite for biographical specifics
   - If any specific fact (name, place, time, activity) overlaps the student's actual biography (from profile), regenerate
   - If no overlaps, note the orthogonal facts for telemetry
7. Ship or null
```

### 6.4 Interaction Tracking Schema

```typescript
interface SuggestionInteraction {
  id: string;
  userId: string;
  essayId: string;
  sentenceId: string;
  rewriteVariantId: string;
  interactionType: 'expand' | 'collapse' | 'edit' | 'copy' | 'toggle_diff' | 'dismiss';
  editDistanceFromOriginal: number | null;  // null for non-edit events
  timeSpentExpandedMs: number | null;        // null for collapse events
  timestamp: string;                         // ISO 8601
  sessionId: string;
  deviceClass: 'desktop' | 'mobile' | 'tablet';
}
```

### 6.5 Authenticity Telemetry Schema

```typescript
interface AuthenticitySignal {
  id: string;
  userId: string;
  essayId: string;
  sentenceId: string;
  signalType:
    | 'suggestion_derived'        // sentence was edited from a rewrite
    | 'copy_without_edit'         // copied example verbatim, edit-distance = 0
    | 'voice_drift_detected'      // Phase 14 detector fired
    | 'register_shift'            // vocabulary/formality moved suddenly
    | 'vocabulary_outlier';       // single-sentence vocabulary spike
  confidence: number;              // 0..1
  derivedFromInteractionId: string | null;
  detectedAt: string;              // ISO 8601
}

interface AuthenticityRollup {
  userId: string;
  essayId: string;
  rollingWindow: 10;                          // revisions
  suggestionDerivedCount: number;
  suggestionDerivedRatio: number;              // 0..1
  currentInterventionTier:
    | 'none'              // < 15%
    | 'soft_nudge'        // 15-30%
    | 'hard_nudge'        // 30-50%
    | 'explicit_warning'; // 50%+
  lastRecomputedAt: string;
}
```

### 6.6 API Surfaces

```
POST /api/essays/:essayId/sentences/:sentenceId/insight
  → returns L5Output

POST /api/suggestion-interactions
  body: SuggestionInteraction (without id, timestamp)
  → 201 Created

GET /api/essays/:essayId/authenticity-rollup
  → returns AuthenticityRollup

POST /api/essays/:essayId/sentences/:sentenceId/rewrite/regenerate
  body: { reason: 'voice_drift' | 'tone_different' | 'not_relevant' }
  → returns new L5Rewrite (Phase 15 only; not in Phase 9 default UX)
```

---

## 7. Ethical Framework — Preventing AI Essay Generation

### 7.1 The Core Commitment

Uplift's authorship premise is simple: **the student writes the essay; Uplift teaches the craft.** Every feature in the product either supports that premise or erodes it. A rewrite suggestion is the single feature in the product with the highest erosion potential. Phase 9 therefore enforces a *structural* commitment — the design makes the right thing easy and the wrong thing effortful, without relying on student self-restraint.

### 7.2 The Five Rules

**Rule 1: No one-click adoption path.**
No Apply, no Insert, no Use This, no auto-replace, no drag-and-drop-to-editor. The only path from rewrite to essay is the clipboard, and the clipboard has a 4-second delay (6s mobile), a disclaimer, and a toast reminder. A student *cannot* accidentally adopt a suggestion; they must explicitly copy, explicitly paste, and consciously override a message that tells them not to.

**Rule 2: No exact-voice-match rewrites.**
The voice-profile constraint matches the student's *register* but the craft-divergence constraint forces the example to differ on at least one rubric dimension by ≥20 points. The example is deliberately not the sentence the student would have written; it is a *differently-calibrated* sentence in the student's register. Any rewrite that passes the voice-match check *and* matches the student's current craft level *and* is pasteable is a bug we will fix in the prompt.

**Rule 3: Factual orthogonality.**
Rewrites contain plausible-but-wrong biographical specifics — a different sport, a different relative, a different year, a different city. The check is run server-side against the student's profile. A student who pastes a rewrite produces a sentence that is factually false for their essay, which they will notice on reread. This is not a cruelty; it is a kindness with teeth. The student who pastes gets caught by *their own proofread*, not by our detection; the student who learns translates the move to their true biography and moves on.

**Rule 4: Invisible telemetry, visible intervention.**
We track suggestion-derivation at the sentence level but we do not *label* suggestion-derived sentences in the student's own essay. Visible labels train students to think of the essay as a mosaic of attributions. Instead, we aggregate: above 15% suggestion-derivation in a rolling 10-revision window, the Profile tab surfaces a soft nudge; above 30%, a harder nudge; above 50%, an explicit warning. No hard block. The cascade teaches; it does not enforce.

**Rule 5: Tier-gated, never universal.**
Rewrites appear only where the student genuinely needs them: CRITICAL and NEEDS WORK. They appear rarely for STRONG, and never for EXCEPTIONAL, MASTERFUL, or FUNCTIONAL. A student working in the green/teal/purple tiers never sees rewrites; their voice is trusted, and the product models that trust. This single rule prevents the most common corruption pattern in AI-writing tools: over-suggesting on work that is already strong, which sands distinctive voice into generic polish.

### 7.3 What We Refuse To Ship

| Feature | Why refused |
|---|---|
| "Accept all suggestions" (bulk action) | Obvious ghostwriting. |
| "Rewrite entire paragraph" | Paragraph-level rewrites leave no scope for student authorship. Sentence is the largest unit we rewrite. |
| "Rewrite entire essay" | Obvious ghostwriting. |
| "AI autocomplete mid-sentence" | Every writer-tool metric points to autocomplete as the feature with the highest voice-drift rate. |
| "Suggested opening" / "Suggested closing" | Opening and closing lines are the most scrutinized sentences; we do not generate them. |
| "Tone selector" ("make it more literary") | Opens a door to voice-shopping. |
| "Length selector" ("make it shorter") | Paragraph-level operations. See above. |
| Auto-rewrite on submit | Silently changes the student's essay. Unthinkable. |
| "AI score" on student's own prose | Trains the student to optimize for the score rather than the craft. |

### 7.4 What We Intentionally Ship Despite Risk

| Feature | Risk | Mitigation |
|---|---|---|
| Rewrite suggestion itself | Paste risk | §7.2 Rules 1–5 |
| Editable rewrite in place | Could be used as a micro-editor | Plain text only; content persists only in session |
| Copy to clipboard | Enables paste | 4/6s delay; toast reminder; factual orthogonality |
| Voice-profile tracking | Could be used to perfect-match | Match is register-level only; craft-divergence enforced |
| Diff view | Could foreground adoption | Off by default; toggled per-insight, not persisted |
| Multiple variants in schema | Could enable carousel | Variants 2-3 never surface in Phase 9 UI |

### 7.5 External Authenticity Review

Before GA, the Phase 9 flow will be reviewed by:
1. Three active-season admissions officers (compensated consultants), who will read essays written using the Phase 9 flow and flag any sentences they suspect of AI authorship.
2. The Common App office (informal consultation; they've expressed interest in AI-writing-tool design reviews).
3. Two college-counseling nonprofits serving low-income students, as a check against designs that accidentally gatekeep good writing behind technical literacy.

We will publish aggregate results, including any AI-flagging incidents, as part of our public trust commitment.

### 7.6 Student-Facing Transparency

We do not hide from students that Uplift uses AI to generate examples. The first-run onboarding (Phase 3) includes a clear explanation:

> "When we show you an example of a different approach to a sentence, it's a worked example — a pattern, not your essay. We deliberately write examples in a voice that's close to yours but not identical, and we include details that aren't from your life, so pasting the example wouldn't actually fit your story. The goal is for you to see the move and then make it in your own words. Your essay has to be yours — both because the admissions officer will notice if it isn't, and because the essay is the part of the application that's genuinely about you."

This is not a legal disclaimer; it is a pedagogical preamble. Students who read it understand the *reason* for the design; students who skip it are protected by the design anyway.

---

## 8. Emotional Map — What The Student Feels

### 8.1 The Target Emotional Arc

| Moment | Target feeling | Signals we're hitting it | Signals we're missing |
|---|---|---|---|
| t=0s: card renders with disclosure collapsed | **Orientation.** Critique is primary; rewrite is a footnote. | Student reads critique first. | Student's eye jumps to the disclosure (we're over-foregrounding it). |
| t=2s: student reads critique | **Seen.** Their own words are quoted back. | Nodding, minor re-read. | Skimming past the quote — it's buried. |
| t=8s: student reads strengths | **Footing.** They enter the rewrite from solid ground. | Relaxed shoulders in session recordings. | Strength lands as consolation — it's wrong-placed or wrong-worded. |
| t=12s: student sees disclosure | **Curiosity, not obligation.** They choose to expand. | ~60–75% expand rate targeted. | ~90%+ expand rate = they feel obligated; ~30% = disclosure is too buried. |
| t=13s: student expands | **Inspiration + mild discomfort.** Example is clearly adjacent, not theirs. | Reading the example slowly; hand-to-chin posture. | Copying immediately = design failed. |
| t=17s: student reads disclaimer | **Permission to be inspired.** Disclaimer gives them structural reason to not-paste. | Expression softens. | Eye-roll or skip = disclaimer reads as corporate warning. |
| t=22s: student edits example in place | **Engagement.** They're rehearsing the move. | Typing over portions of the example. | No engagement = engagement signals we rely on are wrong. |
| t=25s+: student copies or doesn't | **Agency.** Either path is fine; the design made the right thing easy. | Copy + edit before paste = ideal. | Copy + paste verbatim = worst case (still rare by design). |
| t=60s: student returns to editor | **Capable.** They have a move to try, not a line to paste. | Retypes in their own voice. | Pastes verbatim = paste risk materialized. |

### 8.2 The Feelings We Refuse

**Refused: "I should just use that."**
If the student feels this at any point during reading the example, a design variable is miscalibrated. The factual orthogonality, voice divergence, and disclaimer copy all exist to make this feeling structurally unreachable.

**Refused: "I could never write like that."**
Voice-matching (register) exists specifically to prevent this feeling. If the example is in literary register and the student writes in college-casual, the gap feels unbridgeable. The rewrite has to feel like *a calibrated version of you*, not *a better writer than you*.

**Refused: "The AI is telling me I'm wrong."**
Critique voice (Phase 8 §2.3) addresses the sentence, never the student. The rewrite's framing ("One way a writer might handle this") is subjunctive, not imperative. A student who reads the rewrite as a correction has felt a copy failure, not a design feature.

**Refused: "I don't need this part."**
The disclosure pattern exists to let students skip the rewrite when they don't need it. A CRITICAL annotation where the student reads critique + strengths and doesn't click the disclosure is a *success*, not a failure — they found the move from the critique alone, which is better learning.

### 8.3 The "Lazy-Tempted" Edge Case

This is the case the whole phase is designed around: the student in week-four-of-senior-year, 1am, deadline tomorrow, looking at a CRITICAL sentence, with the willingness-to-paste-anything meter at maximum.

The design meets this student with *five* independent anti-paste layers:
1. Disclosure is collapsed — expansion is a choice, not a default.
2. 4-second copy-delay after expansion.
3. Factual orthogonality in the example — pasted sentence doesn't fit their biography.
4. Voice divergence — pasted sentence reads off-voice against their other prose.
5. Toast on copy reminding them it's a pattern.

No single layer is bulletproof. All five together make the path-of-least-resistance for this student actually *retyping the example in their own words* — which is the learning path — rather than pasting it verbatim.

### 8.4 The "Power User" Edge Case

A strong writer who has already mastered the craft move being demonstrated. They see the rewrite, recognize the pattern they already use, and feel slightly patronized.

The design meets this student by:
1. Rarely surfacing rewrites on their STRONG+ sentences (tier gate).
2. Copy framing — "A slightly tighter version" — which respects their existing quality.
3. Short disclosure text — they can scan past in 2s and ignore if irrelevant.

Power users will occasionally get rewrites they don't need. That's acceptable; they dismiss, the friction is low, and the tier gate ensures it's infrequent.

### 8.5 The "ESL / Low-Literacy" Edge Case

A student whose English-language fluency is still developing. The rewrite example may contain idioms or structures they don't recognize.

The design meets this student by:
1. Voice-matching to *their* register — if they write at college-casual level with limited idiom usage, the example is also college-casual with limited idioms.
2. Craft-divergence on *one* specific dimension — they're not overwhelmed by changes on multiple axes.
3. Plain text editability — they can type over words they don't understand rather than being blocked by unfamiliar vocabulary.
4. No assumption of diff-view familiarity (diff is off by default).

The product should work for this student as well as for the advanced writer. Phase 9 is calibrated to serve both.

### 8.6 Session-End Emotional Target

After a writing session that included several Phase 9 rewrite expansions, the student should feel:
- **Clearer:** they understand three new craft moves they didn't before.
- **More capable:** they have three new patterns in their toolkit.
- **More themselves:** their essay sounds more like them than when they started, not less.
- **Not dependent:** if Uplift disappeared tomorrow, they could finish the essay.

The last bullet is the longest-horizon ethical commitment. The product succeeds when students graduate *from* it, not when they become locked into it.

---

## 9. Open Questions for Wave 4

1. **Rewrite-as-questions mode for Foundation phase.**
In Foundation phase (earliest stage of writing), research suggests students learn more from *questions* ("what did the weather smell like that morning?") than from *examples*. Should Phase 9 conditionally replace rewrites with questions for Foundation-phase students on CRITICAL sentences? Decision pending user research in Wave 4.

2. **Voice-profile bootstrapping for first essays.**
The voice profile needs sufficient prose to be accurate; a student's first essay on the platform has no voice profile, so voice-matching falls back to a generic college-casual register. Does Phase 9 suppress rewrites entirely until the voice profile has ≥200 student words, or does it ship with the generic register and accept the voice-match weakness for essay #1?

3. **Rewrite refresh after student revision.**
If the student edits their sentence after seeing a rewrite (without pasting), does the rewrite regenerate against the new sentence? Cost question: regenerating on every edit is expensive. Ship a debounce (30s of no-edits + blur)? Or manual refresh only?

4. **Cross-essay voice drift as a telemetry signal.**
Authenticity rollup (§6.5) tracks within-essay drift. Does Phase 14 also check cross-essay drift — i.e., does the student's essay #3 voice match their essay #1? Implementation depends on when multi-essay voice tracking lands (post-GA).

5. **A/B test the 4-second delay.**
Is 4s right? 2s might be enough reading; 8s might be paternalistic. Propose a 4-arm test post-launch: 2s, 4s, 6s, 8s, measuring paste rate, edit-distance distribution, session satisfaction. Do not ship the test before authenticity telemetry is stable.

6. **Localization.**
Rewrite copy, disclaimer copy, and voice-profile register matching are deeply English-language-specific. Phase 9 does not address Spanish, Mandarin, or other languages. When does the product serve non-English essay contexts, and does the Phase 9 framework adapt or get redesigned?

7. **Conversational rewrites (Phase 15 integration).**
If the student asks the chat ("can you show me the move in a more literary voice?"), Phase 15 can surface a `matchStudentVoice: false` variant. How does the chat-rewrite render — in the chat pane, in the insight panel, both? What's the authenticity-telemetry weighting for chat-initiated rewrites vs panel-initiated?

8. **Rewrites that reference cross-paragraph structure.**
Some NEEDS WORK sentences require rewrites that reference the paragraph's role (e.g., "this is your hook, so show the image before you name it"). Should the rewrite container include a `contextualNote` field that references Phase 10 cross-references, or is that too much scaffolding inside the example?

9. **Screen reader behavior on collapse/expand.**
The collapse state is a `<details>`/`<summary>` pattern semantically, but the delay-to-show-copy-button is a custom behavior. How does the screen reader announce the copy button appearing 4s after expand? Announce immediately as "Copy example button will be available shortly," or announce when it appears? Accessibility review needed before Phase 9 ships.

10. **Cost ceiling for rewrite regeneration.**
§6.3 step 4 regenerates up to 3 times on voice-match failure. Each regeneration is a Sonnet call (~$0.02). Worst case per sentence: 3 × Sonnet + 3 × voice-score Haiku + 3 × craft-score Haiku ≈ $0.10. For essays with 30 annotations, worst case ≈ $3.00/essay. Is the ceiling acceptable, or do we drop to 2 regenerations max and ship null more aggressively?

11. **Showing "why this example" on explicit student request.**
A student may want to know *why* the rewrite takes the angle it takes — "why is the example about hair braiding and not about the surgery itself?" Should Phase 15 expose a "why this example" affordance that surfaces the `craftDimension` and `factualOrthogonalityNote`? If yes, how do we expose the orthogonality without making it feel like we're admitting to deception?

12. **Offline rewrites.**
The current design requires a server round-trip to generate rewrites. Students working offline (common for students with unstable internet) get no rewrites. Does Phase 9 ship a cached-rewrite fallback for the most-recently-viewed annotations, or accept that offline = no rewrites?

13. **First-class "I'm stuck, show me more" affordance.**
A CRITICAL sentence where the student reads critique + rewrite and still can't find their move. We currently expect them to escalate via chat (Phase 15). Is there an in-panel escalation — "Still stuck? Open a conversation about this →" — that Phase 9 should ship, or is that a Phase 15 concern?

14. **Rubric dimension taxonomy stability.**
The `RubricDimension` enum in §6.1 is 11 values. The L5 teaching pipeline may want to evolve this taxonomy. How do we version the rubric dimension enum without breaking stored interactions (`craftDimension` is persisted in `suggestion_interactions`)?

15. **Editable-in-place telemetry privacy.**
Edit-distance tracking is an anti-paste signal, but it is also a keystroke-adjacent data type. Does the student's privacy policy cover this? Is the edit-distance computed client-side (only final number sent) or server-side (full text sent)? Recommend client-side computation for privacy hygiene.

---

## 10. Summary — The Three Headline Decisions

### Headline 1: The Apply Interaction Rule
**There is no Apply button, ever.** The only allowed affordance is a Copy-to-clipboard action that appears 4 seconds after the student expands the rewrite (6 seconds on mobile), paired with a toast that reminds them the example is a *pattern, not a sentence*. Every other candidate — Use-as-starting-point, drag-and-drop, immediate-copy — tested as a ghostwriting-in-disguise path, and we refused them all.

### Headline 2: The Voice-Match vs Voice-Differ Rule
**Match the student's register, diverge deliberately on the one craft dimension the critique named.** The rewrite reads as "a calibrated version of a sentence like mine," not "a sentence I could have written." Combined with factual orthogonality (plausible-but-wrong biographical specifics), this makes the example structurally non-pasteable while still being legibly learnable.

### Headline 3: The Show/Hide Rule By Tier
**Rewrites always render for CRITICAL and NEEDS WORK; rarely for STRONG; never for EXCEPTIONAL, MASTERFUL, or FUNCTIONAL.** This single rule prevents the most common corruption pattern in AI-writing tools — over-suggesting on strong work and sanding distinctive voice into generic polish. A student working in green/teal/purple tiers never sees rewrites on their own sentences; the product models trust by being quiet about what's already working.
