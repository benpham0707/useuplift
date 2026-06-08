# Phase 8: Reading the Insight — Where Learning Actually Happens

> Wave 3 / Phase 8. Depends on Phases 4–7. Feeds Phase 9 (Profile tab depth), Phase 10 (cross-reference navigation), Phase 11 (revision loop).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §7 Detail Panel, §8 Copy & Voice, §10 Typography. Inherits Phase 5's overview card, Phase 6's "insight card shape is the contract," Phase 7's click→panel contract and crossfade timing.

---

## 1. Design Summary

Phase 8 is where a student actually *learns*. Every motion decision, every tier color, every panel choice we've made in Phases 4–7 exists to deliver the student, calm and oriented, to a rectangle of text they will read for eight to thirty seconds. If that rectangle fails — if it feels like a graded paper, or a chatbot's wall of suggestions, or a therapy session's soft non-answer — the entire pipeline is wasted. So Phase 8 is opinionated about one thing above all: **the insight card has a shape, the shape is a contract, and the contract is the teaching**. The shape is `meta line → critique → why it matters → strengths → rewrite (optional)`, in that order, for every single annotation the student ever sees, on every sentence, in every tier. The critique is 2–4 sentences, evidence-grounded (it quotes the student's own words back at them), and direct — "this sentence tells me what you did, but not why it mattered to you" — without ever crossing into judgment of the student themself. The "why it matters" is a single sentence that anchors the critique to structural significance: it says *the essay pays a price for this, here, now*, and it does so by referencing specific architectural facts (your North Star is resilience-through-repair, this is your hook paragraph, your second beat is already working harder than it should be). **Strengths are non-negotiable on every annotation, including CRITICAL ones** — not as consolation but as *scaffolding*: every sentence a struggling student sees starts with "here is what this sentence is already doing right, underneath the problem." The strengths sit *after* critique (so the critique isn't pre-softened into mush before it arrives) and *before* rewrite (so the student walks into the rewrite suggestion standing on something that works, not fleeing something broken). The rewrite itself is optional, phase-gated, and never prescriptive: in Foundation phase, we almost never rewrite — we ask a question instead. In Craft phase, we offer a single alternate sentence with a one-line note on what it trades. In Polish phase, we show three calibrated variants. Typography: 15px serif for critique prose (reading mode, not UI mode), 13px sans for meta and structural labels (system mode), generous 1.55 line-height, a hard 68ch max line length, and section separators that are *pure whitespace* (no horizontal rules, no background differentiation, no colored stripes — the shape teaches itself through rhythm, not fences). Multiple annotations on one sentence surface as a ranked *stack*: the highest-priority insight is open by default, the rest are collapsed into a single disclosure row reading "2 more on this sentence" with a tier-dot preview of each. Cross-references — when the critique says "this moment needs P1 to have landed first" — are rendered as inline pill-style jump links that navigate the panel to the referenced sentence, leaving a breadcrumb in the panel header so the student can `← P4` their way back. There is no "Got it" button, no "Mark as read" checkbox, no completion ceremony for a single insight; the click away *is* the acknowledgment, and viewed state is tracked silently for the progress UI in Phase 12. SAGE sentences inherit Phase 7's empty-state treatment but Phase 8 defines what fills that empty state: a single curated *Profile* preview ("This sentence is carrying three narrative functions without strain — view in Profile →"). The emotional arc target is precise: at 5 seconds the student should feel *seen* (the critique quotes their text, the tier word matches the vibe they already felt), at 15 seconds they should feel *oriented* (the why-it-matters connects to a North Star they already know from the overview card), at 30 seconds they should feel *capable* (the strengths and rewrite together hand them the next move). Every choice in this phase — including the ones we explicitly reject, like score numbers, confidence percentages, grade-like badges, and "AI suggests" disclaimers — serves that arc.

---

## 2. The Ten Deep-Dive Decisions

### 2.1 Content Hierarchy — What Appears in What Order

**Recommendation: `meta line → critique → why it matters → strengths → rewrite (optional)`, always, in that order, for every tier, with no variations, no A/B based on tier, no personalization. The shape is the contract Phase 6 established; Phase 8 fixes it.**

The student learns the shape from their first insight. From their second insight onward, they know exactly where to look for the parts they care about most. That consistency is worth more than any local optimization we could extract by reordering based on tier or phase. A Foundation-phase student skimming for "what should I do next" learns on insight #1 that the rewrite is at the bottom; by insight #4 they're scrolling there directly without reading the critique, and that's *fine* — they'll come back for the critique when they're ready. The shape lets them *choose their own depth*, but the choice is legible because the layout is invariant.

**Why critique before why-it-matters (not why-first):**
The critique is the *specific observation* — the thing anchored in their own text. "Why it matters" is the *generalization* — the thing that ties the specific to the structural. Specific before general is how humans read instruction naturally; flip the order and the why-it-matters becomes an abstract claim waiting for evidence, and the student either skims over it or feels lectured. Put the critique first and the why-it-matters becomes the *conclusion* of the thought they're already having: "yeah, I see what you mean, and *that's why it costs me*."

**Why strengths after critique, not before:**
This is the decision we've argued hardest about. There's a tempting version — "strengths first, then critique, so the student enters the hard part from a footing of confidence." We reject it for three reasons. First: with strengths first, the student reads the strengths as *setup* for the critique ("you're clearly smart, but..."), which is the rhetorical move that makes corporate performance reviews feel dishonest. Second: the critique is what the student came for — burying it below strengths makes the panel feel like it's softening bad news, which is *more* anxiety-inducing, not less, because now they have to parse whether you're being honest. Third: Phase 7's crossfade lands them on the top of the insight at t=180ms, which means strengths-first means the critique is below the fold on most laptops, and we've spent an entire pipeline getting them to this moment — we do not want the critique below the fold. The compromise that works is: critique is direct *but not judgmental* (see §2.3's voice spec), so it doesn't *need* softening, and strengths immediately after land the student on solid ground before the rewrite ask.

**Why strengths before rewrite, not after:**
The rewrite is an *action*. Actions work better when taken from confidence. Reading the strengths last would feel like a consolation prize after the rewrite — "here's what to do, oh and also you did fine." Reading the strengths right before the rewrite means the student picks up the rewrite holding something that works. The spatial logic is: critique (here is what went wrong) → why (here is what it costs you) → strengths (here is what already works to build on) → rewrite (here is a possible move).

**The meta line stays first, permanently.**
Phase 7 already fixed the meta line as the panel header (`¶4 · sentence 2 · EXCEPTIONAL`). Phase 8 does not change this; it only adds that when an insight is a *structural* insight (paragraph-scope, not sentence-scope), the meta line reads `¶4 · paragraph · structural` and the body begins with the paragraph text pull-quoted at 85% opacity in a 13px serif italic, so the student remembers which block of text we're talking about.

**Read-time calibration:**
- **5s read:** meta line + first sentence of critique. Student knows *what* sentence, *what tier*, and *what the core observation is*. This is the "seen" moment.
- **15s read:** entire critique + why-it-matters. Student knows *why this costs the essay*.
- **30s read:** full card including strengths and rewrite. Student has a move.
- **60s+ read:** only happens if the student clicks a cross-reference pill or expands a second annotation. This is the Phase 10 territory.

If we haven't delivered *seen* by 5s, the critique is too long or the quote is buried. If we haven't delivered *oriented* by 15s, the why-it-matters is being asked to carry too much or the critique ran past 4 sentences. If we haven't delivered *capable* by 30s, the rewrite is either missing (Foundation phase rule) or too abstract.

**Rejected alternatives:**

| Alternative order | Why rejected |
|---|---|
| `why-it-matters → critique → strengths → rewrite` | Abstract-before-specific. Students skim past the why because it floats without evidence. |
| `strengths → critique → why → rewrite` | Compliment sandwich. Reads as dishonest; teaches students to distrust the strengths. |
| `critique → rewrite → why → strengths` | "Do this" before "here's why" reads as prescriptive. Rewrite should be the *offer*, not the *answer*. |
| Tier-conditional order (CRITICAL leads with rewrite, STRONG leads with strengths) | Breaks the shape contract. Students must relearn the layout per annotation. Cognitive tax outweighs the "helpful adaptation." |
| Phase-conditional order (Foundation vs Polish reorder) | Same contract-break. Phase affects *content depth*, not *structure*. |
| Tabbed interior ("Critique" / "Why" / "Rewrite" tabs inside the card) | Buries 2/3 of the content behind clicks; destroys the "skim-and-choose-your-depth" property. |

### 2.2 Insight Type Taxonomy — Growth / Strength / Structural / Teaching

**Recommendation: keep the four types as semantic categories in the L5 schema (they shape the voice and content of the critique), but render them in the UI as a single *subtle text-only label* in the meta line — `¶4 · sentence 2 · EXCEPTIONAL · structural` — not as a colored badge, icon, or separate row. No `Score: 42/100`, no confidence percentages, no AI-disclaimer text. The tier name is the only score-shaped signal, and even it reads as a word, not a number.**

The four types are real and useful:

| Type | What it means | Typical trigger |
|---|---|---|
| **growth** | A specific improvement lever on a specific sentence | Sentence is CRITICAL/NEEDS-WORK and has a concrete revision path |
| **strength** | An observation of what's working, worth naming explicitly | Sentence is STRONG/EXCEPTIONAL/MASTERFUL; student may not see their own craft |
| **structural** | A paragraph-scope or cross-paragraph issue, not about one sentence | Ordering, pacing, beat-missing, paragraph-role mismatch |
| **teaching** | A craft principle the student hasn't encountered yet, grounded in their sentence | First-time use of show-don't-tell, first hook-landing, first callback |

These types change the *voice and shape* of the card but not the *structure* of the card. A `teaching` insight's critique leans toward "here's what you're reaching for" rather than "here's what's underperforming"; a `structural` insight's critique opens with the paragraph-level observation before zooming to the trigger sentence; a `strength` insight's "why it matters" carries more weight than its critique (because the critique-of-a-strength is "this is working *well enough to notice*," which is a short thought). But the five-section shape holds in every case.

**Why not colored badges?**
Because we already have tier colors doing semantic work, and stacking a second color-coded dimension on top of tier colors creates a palette that's illegible at a glance. A student looking at five annotations sees six colored things (five tiers + one type badge per card) and their eye can't tell which dimension they're in. Tier is the only color-coded dimension in this product; type is a text word.

**Why not icons?**
Icons require a legend. A legend is a tax. The tier legend already lives in the overview card and the filter menu — adding a second (type-icon) legend doubles the cognitive tax. Words like "structural" and "teaching" self-document; icons for those concepts do not.

**Why the label goes in the meta line, not in its own row:**
A dedicated row ("Type: Structural") occupies 24px of vertical space for a word the student learns to skim past after annotation #3. Meta line integration keeps it at zero additional vertical cost.

**Why no score number:**
A number is the fastest path to grade-anxiety. `Score: 42/100` flashes a student back to every math test they've failed. The L3.5 effectiveness number (0–100) *exists* in the data model and drives the tier word — that's enough. If a student ever asks to see the underlying number, a Phase 12 dev-mode toggle can surface it, but it is *never* the default UI. The tier word carries every signal a student needs to calibrate how hard this sentence is hurting the essay.

**Why no confidence percentage:**
"AI 87% confident" is a disclaimer trying to be a feature. It achieves neither — students don't know what the number means, and it dilutes the authority of the critique. If we aren't confident enough to show the insight, we shouldn't show the insight. (The threshold logic for "show / don't show / degrade" lives in the L5 output gate, not in the UI.)

**Rejected alternatives:**

- *Colored type badges (green for strength, blue for teaching, etc.):* palette collision with tier colors; see above.
- *Icon + text ("↗ structural"):* doubles visual weight of the label for zero legibility gain.
- *Separate row under meta ("INSIGHT TYPE: STRUCTURAL"):* vertical tax; reads as form-field pedantry.
- *Score pill ("42/100"):* grade-anxiety trigger; number carries no teaching signal beyond what tier already conveys.
- *Confidence stripe ("AI: 87%"):* disclaimer-as-feature; dilutes authority without adding information.
- *Six or seven finer-grained types (voice, pacing, evidence, stakes, diction, structure, hook):* too granular for the student; the L3.5 data retains this granularity for analytics and Profile tab, but the Insights card collapses to four semantic classes.

### 2.3 The Critique Itself — Voice, Length, Evidence

**Recommendation: 2–4 sentences, always evidence-grounded by quoting the student's own text in the first or second sentence, written in a voice that is *direct but never judgmental* — addressed to the student's writing, not the student's character. Template: `[What the sentence currently does, in their words] + [what it isn't doing that the context needs] + [optional: a one-sentence pointer toward the move].`**

The critique is load-bearing. It has to do three things in a small space: (1) prove we read the sentence, (2) name the problem precisely, (3) stop before it becomes a lecture. The template:

```
Sentence 1 — Observation:   "The sentence opens with [short quote]..."
Sentence 2 — Gap:           "...which tells me what happened, but not what it cost you."
Sentence 3 — Pointer (opt): "The beat this paragraph owes is the one that
                             makes the repair *feel* expensive."
```

**Quote rule:** the first or second sentence of every critique contains a 2–7 word direct quote from the student's sentence, rendered in the critique inline with a light weight (font-weight 400 inside a 500-weight paragraph — the quote is set *lighter* than the surrounding prose, not heavier, to feel like an echo of their voice rather than a courtroom callback). The quote is not in italics, not in quote marks, not in a different color — it is simply unstyled text that happens to be their own. This is critical: students in usability testing described bold-quoted-back feedback as "throwing my own words in my face." Light-weight inline quote feels like listening.

**Voice calibration:**
- *Direct:* "This sentence tells me what, but not why."
- *Not judgmental:* not "you didn't go deep enough" — we address the *sentence*, never the student.
- *Specific:* not "add more detail" — name the specific thing the sentence lacks relative to its context.
- *No hedging:* no "you might want to consider possibly," no "it could be worth thinking about." Hedging reads as evasion, which increases anxiety.
- *No superlatives:* no "brilliantly" (for strengths), no "catastrophically" (for critical). Both are fawning registers that undermine trust. A strong sentence is "doing something most essays don't" — a specific claim, not a superlative.
- *No disclaimers:* no "as an AI," no "this is subjective," no "your instincts may vary." The critique stands on the observation; the observation is either anchored in the text or it isn't.

**Length rule:**
- Minimum: 2 sentences. One sentence feels drive-by; a student reading a one-sentence critique asks "is that all?" and loses trust.
- Maximum: 4 sentences. Anything past 4 becomes essay-about-essay, which is exactly the recursive spiral that makes writing feedback feel exhausting. If the critique wants to say more, it gets pushed into "why it matters" or into a separate second annotation on the same sentence.
- Typical: 3 sentences. Observation → gap → pointer is the dominant shape.

**Evidence grounding — the cognitive-forcing function:**
L5 prompts must require a quote token from the original sentence in the critique output. This is not a post-hoc validation — it's a prompt-level forcing function that prevents the model from writing generic critique. A sentence-level observation without a sentence-level quote is, by definition, a paragraph-level observation misfiled at the sentence scope, and we promote it to a structural insight instead.

**Rejected alternatives:**

- *One-sentence critiques (to maximize skim speed):* feels flip, loses trust, students ask "is that it?"
- *5–7 sentence critiques (to be thorough):* lectures; becomes text the student skims past.
- *Quote in italics + block-indented:* turns the quote into a courtroom exhibit; the register is too adversarial.
- *Quote in tier-accent color:* double-coding (semantic quote as color-coded); conflicts with tier palette; hurts legibility.
- *Second-person "you" address as default ("you did X"):* makes every sentence a verdict on the student. Reserve "you" for the why-it-matters, where the stakes belong to them. Critique addresses "the sentence," "this line," "the opening."
- *Socratic-only critique ("What do you think this line is doing?"):* too evasive for the majority use case. Reserved for a Foundation-phase variant in §2.4.

### 2.4 "Why It Matters" — North Star and Structural Significance

**Recommendation: always present, never collapsed, exactly one sentence, always connecting the critique to either (a) the student's North Star theme or (b) the sentence's structural role in its paragraph. Rendered with a 13px sans 500-weight label reading `WHY IT MATTERS` and a 15px serif body sentence directly below. No toggle, no expand, no "learn more."**

The why-it-matters is the bridge between the sentence-level observation and the essay-level stakes. Without it, every critique is a local nag; with it, every critique connects to something the student cares about (the essay working, the story landing). A Foundation-phase student reading a critique about a flat sentence doesn't yet know that sentence's structural burden — the why-it-matters *tells them* that burden in one sentence.

**Two flavors, decided by L5:**

**Flavor A — North Star connection** (default for mid-paragraph sentences, used in ~60% of cases):
> "Your essay's through-line is *rebuilding after loss* — this is the moment where 'rebuilding' should feel physical, and right now it reads conceptual."

Opens with the North Star phrase in italics, then states the gap between what this beat *should* do for the through-line and what the current sentence *does* do.

**Flavor B — Structural role connection** (default for hook sentences, transitions, and closers, used in ~40% of cases):
> "This is your hook's landing line — the first paragraph pays the essay's opening cost, and every sentence after it has to earn back what this one didn't promise."

Names the sentence's structural role explicitly ("hook's landing line," "P2's pivot," "the closer's echo") and states the ripple cost.

**Why always present, never collapsed:**
An expandable "why this matters" section teaches the student that the why is optional. It isn't. Every critique without a why is a prescription without a diagnosis, which is the exact pattern that makes old-school teacher comments feel arbitrary. Always-present why-it-matters is the *explanation contract* — the student never has to work to understand *why we care about this*.

**Why exactly one sentence:**
A two-sentence why-it-matters becomes a second critique. The why's job is to *connect* the critique to the macro, not to elaborate it. If the why wants to be two sentences, the critique should absorb the second sentence and the why should shrink.

**Why the label is all-caps 13px sans:**
This is the *only* visual hierarchy cue inside the card that isn't pure typography rhythm. `WHY IT MATTERS` reads as a section anchor — a legitimate semantic unit — not as decoration. It also aligns with the strengths label (`WHAT'S WORKING`) and the rewrite label (`ONE POSSIBLE MOVE`) to create a three-part label rhythm down the card.

**Foundation-phase Socratic variant:**
In Foundation phase, when the L5 insight is a `teaching` type, the why-it-matters becomes a *question* instead of a declaration:
> "What would this sentence look like if the reader could *see* the moment instead of being told it happened?"

This is the one place in Phase 8 where we break the declarative voice, and we break it deliberately: Foundation-phase students are learning to *ask* their own sentences questions, and a Socratic why-it-matters models that move. The Socratic form is opt-in per-insight (L5 decides), not phase-global.

**Rejected alternatives:**
- *Collapsed/expandable why-it-matters:* makes the why optional, destroys the explanation contract.
- *Two-sentence why:* bloats into second critique; violates the one-sentence rhythm.
- *Generic "why it matters" ("This affects readability"):* empty calories; if we can't connect to North Star or structural role, don't include it.
- *Label reading "CONTEXT" or "STAKES":* "context" is too vague, "stakes" over-dramatizes. "Why it matters" is the phrase students already use.
- *Icon-only label (e.g., a target icon):* requires legend; fails the "no icons without legend" rule established in §2.2.

### 2.5 Strengths on Problem Sentences — The Non-Negotiable Rule

**Recommendation: every insight card has a `WHAT'S WORKING` section, on every tier, on every annotation, including CRITICAL. It sits *after* critique+why and *before* rewrite. Copy pattern: 1–3 bullet-like lines, each 6–14 words, each naming a *specific* thing the sentence is already doing, each grounded in a micro-quote from the sentence when possible. Never generic.**

This is the rule that most distinguishes Uplift from every other writing tool. The premise: **no sentence is entirely broken**. A CRITICAL sentence that L3.5 scored 32/100 still has three or four things going right, underneath the dominant problem. A student reading a CRITICAL-only card ("this doesn't work, here's why, rewrite it") experiences the sentence as *all wrong*, and generalizes to *I am all wrong at writing*. That generalization is what kills revision energy. Naming the strengths disarms it.

**Copy pattern — the specificity rule:**

Every strength line has to pass the "could this be said about any sentence?" test. If it could, it's generic and we cut it.

**Bad (generic):**
- ✗ "Good sentence structure."
- ✗ "Clear writing."
- ✗ "Nice use of detail."
- ✗ "Solid opening."

**Good (specific):**
- ✓ "The verb *clawed* carries the whole struggle."
- ✓ "Opening with the stethoscope image grounds us physically before the abstraction."
- ✓ "You resist summarizing — the reader does the work, which is the right bet."
- ✓ "The comma splice here is working; it mimics the interrupted thought."

The specific version quotes or names a precise mechanic. The generic version could be copy-pasted across any essay and would not feel wrong, which is exactly why it also doesn't feel *earned*.

**Count rule:**
- 1 strength line: allowed if the sentence is genuinely struggling and only one thing clearly works.
- 2–3 lines: typical.
- 4+ lines: prohibited on CRITICAL/NEEDS-WORK sentences (feels like padding); allowed on STRONG+ sentences where there's genuinely a lot to name.

**Positioning — why after critique, not before:**

Already argued in §2.1. Restated here as the copy rule: critique's last sentence and strengths' first line should be a *reframe*, not a contradiction. A well-written critique lands with a gap. The strengths' first line acknowledges what survives the gap.

Example transition:
- Critique ends: "...the sentence tells me the event happened but not what it cost you."
- Strengths opens: "The sequencing — *before* the accident, *after* the hospital — is doing the right temporal work."

The critique and strengths aren't contradicting each other; they're two observations about the same sentence, and the strengths give the student something that *didn't* get torn down.

**Label — `WHAT'S WORKING`:**

Not "Strengths" (too report-card), not "Pros" (too pros-and-cons), not "Wins" (too sports), not "The good news" (too compliment-sandwich). `WHAT'S WORKING` is present tense, mechanical, specific. It is the voice of a writing partner, not a grader.

**On STRONG+ tiers:**

When the tier is STRONG/EXCEPTIONAL/MASTERFUL, the strengths section becomes the *dominant* section and the critique shrinks to a single sentence — usually a "here's the one thing I'd push further" observation. The card is now about *why this is working*, not *what's wrong*. The shape holds; the weight shifts.

**Rejected alternatives:**

- *Strengths only on STRONG+ tiers:* defeats the whole premise. A CRITICAL sentence's strengths are where revision energy comes from.
- *Strengths above critique:* compliment sandwich; teaches students the strengths are setup.
- *Strengths collapsed by default:* makes them optional; a Foundation-phase student skimming the card misses them, which is exactly the student who needs them most.
- *Mixed into the critique prose ("despite X, the sentence does Y"):* hides strengths in the critique's shadow; students remember the critique and forget the Y.
- *Icon-prefixed checkmarks (✓ Good verb choice):* reads as a checklist; trivializes the observation.
- *One generic default line when L5 can't find specifics ("This sentence has potential"):* generic default lines are worse than no strengths. If L5 genuinely can't find a specific strength, the L5 output is incomplete and should be flagged; the UI must refuse to render a generic fallback.

### 2.6 Readability & Typography — The Reading Experience

**Recommendation: 15px ECRM serif for all prose (critique, why body, strength lines, rewrite body); 13px ui-sans (Inter or system-ui) for labels and meta; line-height 1.55 on serif, 1.4 on sans; max-line-length 68ch hard cap; 24px section spacing (no horizontal rules, no background fills, no dividers); color is `oklch(0.22 0.02 240)` on glass panel background at 92% opacity.**

The foundational decision: **the insight panel is a reading environment, not a UI environment.** The critique is prose — sentences meant to be read, re-read, and absorbed. Every type choice follows from that premise.

**The serif vs. sans split:**

Serif (we recommend ECRM, or as a fallback, Source Serif 4) for all *content* prose. Serifs slow the eye down just enough to prevent skimming, which is what we want for critique absorption. The 15px size is deliberately just above standard UI text (13–14px) and just below book-reading text (16–18px) — it signals "this is content worth reading" without tipping into "this is a document."

Sans (Inter or ui-sans system stack) for all *system* text — meta line, labels (`WHY IT MATTERS`, `WHAT'S WORKING`, `ONE POSSIBLE MOVE`), cross-reference pills, breadcrumbs. This creates a two-register rhythm where the student's eye learns: *serif = read this slowly, sans = structural scaffold, skim if you want.*

**Size calibration:**

| Element | Family | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Meta line | ui-sans | 12px | 500 | 1.3 | 0.02em |
| Tier word (inline in meta) | ui-sans | 12px | 600 | 1.3 | 0.04em |
| Critique paragraph | ECRM serif | 15px | 400 | 1.55 | 0em |
| Inline quote (in critique) | ECRM serif | 15px | 400 | 1.55 | 0em |
| Label (`WHY IT MATTERS`) | ui-sans | 11px | 600 | 1.3 | 0.08em (uppercase) |
| Why-it-matters body | ECRM serif | 15px | 400 | 1.55 | 0em |
| Strengths line | ECRM serif | 14px | 400 | 1.5 | 0em |
| Rewrite body | ECRM serif | 15px | 400 | 1.55 | 0em |
| Cross-reference pill | ui-sans | 12px | 500 | 1.2 | 0.01em |
| Panel header (sentence meta) | ui-sans | 13px | 500 | 1.4 | 0.02em |
| Breadcrumb (`← P4`) | ui-sans | 12px | 500 | 1.3 | 0.01em |

Strengths lines are 14px (vs. 15px body) — slightly smaller to signal "supporting observations, not primary prose." The eye registers the size step as hierarchy without a label change.

**Max line length:**

68ch hard cap, enforced via `max-width: 68ch` on the card's prose container. The panel is 40% of a 1440px viewport = 576px, which at 15px serif is already close to the 68ch ceiling; the `max-width` prevents edge cases (wider viewports, user font-size overrides) from pushing line lengths past 75ch, which is where readability degrades sharply. On narrower viewports the panel shrinks and lines compress naturally.

**Line-height 1.55 on serif:**

This is the "read, don't skim" number. 1.4 is UI-dense; 1.7 is marketing-airy; 1.55 is the reading-comprehension sweet spot used by Medium, Substack, and most serious-longform properties. The student's eye can saccade between lines without losing place.

**Color and contrast:**

- Primary prose: `oklch(0.22 0.02 240)` — near-black with a faint cool undertone. On the glass panel background (~ `oklch(0.97 0.01 240 / 0.92)`), this yields a WCAG AAA contrast ratio (~13:1) without the harsh black-on-white edge that laptop screens render poorly under glass.
- Meta line: `oklch(0.45 0.03 240)` — a softer mid-gray-blue. Secondary hierarchy.
- Labels: `oklch(0.40 0.05 240)` — slightly more saturated, 11px uppercase, reads as semantic section marker.
- Tier word in meta: colored by tier, at 100% saturation on `CRITICAL/NEEDS-WORK/STRONG/EXCEPTIONAL/MASTERFUL`, at 70% on `FUNCTIONAL` (SAGE) to honor Phase 5's "visual silence" rule.
- Inline quote: same color as prose, weight 400 (same as prose). The distinction comes from the context ("the sentence opens with *X*"), not from color or weight.
- Rewrite body: `oklch(0.22 0.02 240)` but on a `oklch(0.98 0.005 240 / 0.55)` inset card, so the rewrite feels like a *surface within the surface* — a quoted surface, a thing to read distinctly, but without a hard border.

**Section separators — whitespace only:**

Between meta and critique: 16px.
Between critique and why-it-matters label: 20px.
Between why label and why body: 6px.
Between why body and strengths label: 24px.
Between strengths label and first strength line: 6px.
Between last strength line and rewrite label (if present): 24px.
Between rewrite label and rewrite body: 6px.

No horizontal rules. No background color changes. No colored left-borders. The card teaches its own shape via rhythm; any fence (hr, bg change) undermines the one-object feel.

**Rejected alternatives:**

- *All-sans (Inter throughout):* reads as a product UI; prose loses its "read me" register.
- *All-serif (including labels and meta):* flattens the hierarchy; eye can't tell content from scaffold.
- *16px or 17px serif body:* tips into document-reading register; card starts to feel long; critique-below-the-fold risk increases.
- *14px body (closer to UI):* loses the "content worth reading" signal; card feels like a tooltip.
- *Line-height 1.4 or 1.7:* 1.4 is too dense for absorption; 1.7 makes the card too tall.
- *Horizontal rules between sections:* fences the sections; breaks the one-object feel.
- *Background color differentiation per section:* creates a "data panel" register; wrong tonal match for a reading environment.
- *Colored left-border per section:* adds three accent colors to a card that already has a tier color doing semantic work.

### 2.7 In-Panel Scrolling — Overflow, Indicators, Snap-Back

**Recommendation: panel body scrolls independently of editor (Phase 7 rule). When a card's content overflows the panel height, a 1px hairline scroll indicator appears on the panel's right edge, 20% opacity, tier-accent-colored, fading in only during active scroll and 2 seconds after. On annotation change (Phase 7 crossfade), panel auto-scrolls to the *top of the insight card* (not the top of the panel, which may contain a sticky header). No section-anchor jump links within a single card (the card should never be tall enough to need them); cross-reference jumps are a different mechanism (§2.9).**

**Scroll indicator spec:**

```css
.uplift-panel-scrollbar {
  width: 1px;
  background: color-mix(in oklch, var(--tier-accent) 20%, transparent);
  border-radius: 1px;
  transition: opacity 180ms ease-out;
}
.uplift-panel-scrollbar--active { opacity: 1; }
.uplift-panel-scrollbar--idle   { opacity: 0; }
```

The scroll indicator is visible for 2000ms after the last scroll event, then fades. The 1px width is deliberately below most students' conscious-scan threshold — it signals "there's more" without competing for visual weight.

**Snap-back-to-top on annotation change:**

Phase 7 established that panel content crossfades on annotation change. Phase 8 adds: during that crossfade, the panel body's `scrollTop` resets to 0 *synchronously with the crossfade*, so the new annotation's meta line is always the first thing visible. This is important because a student who scrolled down into the strengths of annotation A, then clicked a new sentence, expects to land at the top of annotation B — anything else is disorienting.

Implementation detail: the `scrollTop = 0` happens during the 60ms fade-out phase of the crossfade (when the old content is invisible), so the student never sees the scroll jump. The new content then fades in from its natural scrollTop-0 position.

**Why no section-anchor jumps inside a card:**

If a card is tall enough to need internal anchors ("Jump to strengths"), the card is too tall. The content hierarchy (§2.1) and length rules (§2.3, §2.5) are calibrated to keep the whole card within 1.5× the panel's visible height on a standard 13" MacBook — meaning the student scrolls at most once per card, and can always see the structural shape by scrolling back up. Adding internal anchors would encourage card bloat and violate the "skim-and-choose-your-depth" property.

**Editor-side scroll coordination (inherited from Phase 7):**
- Clicked sentence stays visible in the editor; panel does the moving.
- Editor only scrolls if the clicked sentence is currently outside the viewport, and only enough to bring it to the viewport's vertical center (never the very top, which would displace the reader's current reading position).

**Rejected alternatives:**

- *Standard system scrollbar:* too heavy visually; breaks glass aesthetic.
- *Always-visible scroll indicator:* visual noise when the card fits.
- *Scroll-memory per annotation (remember where you were):* confusing on re-visit; student expects top-of-card.
- *Section-anchor jump links ("Jump to rewrite"):* encourages card bloat; breaks skim-and-choose.
- *Shadow-overlay indicator at panel bottom ("more below"):* crowds the already-busy coaching bar area (Phase 4/11).

### 2.8 Multiple Annotations Per Sentence — Stacking and Disclosure

**Recommendation: highest-priority annotation opens in full; additional annotations for the same sentence collapse into a single disclosure row reading `2 more on this sentence ›` (with a tier-dot preview for each), placed at the bottom of the expanded card. Click expands the stack into a *ranked list of collapsed cards* (meta line only), each click-to-expand. Only one card in the stack is ever fully expanded at a time.**

L5 produces 2–3 annotations on some sentences — typically when the sentence carries multiple distinct issues (e.g., a weak verb choice *and* a pacing problem *and* a missed callback). The naive render is to stack all three as fully-expanded cards, which instantly drowns the student. The opinionated render: show the one that matters most, disclose the existence of the others, let the student choose to dig.

**Priority ordering:**

The priority rule comes from L5, not the UI. L5 ranks the annotations on a sentence by `impactScore` (how much this annotation moves the essay's effectiveness if addressed). The UI renders in that order. Tie-breakers: tier severity first, then insight type (`structural > growth > teaching > strength`).

**The disclosure row:**

```
╭───────────────────────────────────────────╮
│ 2 more on this sentence      ● ● ›        │
╰───────────────────────────────────────────╯
```

- Text: `N more on this sentence` (plural-aware: "1 more," "2 more").
- Tier-dot preview: one 6px circle per additional annotation, colored by tier. Students can see at a glance whether the hidden annotations are all CRITICAL (3 red dots — the sentence is in trouble) or a mix (1 red, 1 green — one problem and one strength worth naming).
- Chevron: `›` indicates expandable. No accent color, 40% opacity.
- Hover: row darkens to 6% black overlay; chevron rotates 90° to `⌄`.
- Click: expands the stack inline; the current primary card collapses to its meta-line-only form; the expanded stack animates in below with a 180ms stagger.

**The expanded stack:**

When the student expands, they see:
1. The primary card, now collapsed to meta-line only (tier word + first 8 words of critique + tier dot).
2. Additional annotations as collapsed rows in priority order, meta-line only.

Clicking any collapsed row expands *that* annotation to full form and collapses whichever was previously full. Only one is ever fully expanded.

**Why not tabbed cards:**

Tabs ("Tab 1 / Tab 2 / Tab 3") hide the relationship between the annotations — the student can't see *how many* exist without inspecting the tabs, and tabs imply peer-relationship ("these three things are equally important") when in fact they're ranked. The stacked-ranked-disclosure pattern makes the priority visible, which teaches the student the L5 ranking as they learn to read multiple annotations.

**Why not a single merged card (all critiques, all strengths, all rewrites combined):**

Merging loses the annotation-as-unit structure, which is load-bearing for Phase 10 (cross-reference links) and Phase 11 (revision tracking per annotation). An annotation has to be an addressable object. Merging also inflates the card past the scroll-budget rule of §2.7.

**Why only one fully expanded at a time:**

A student reading three full cards on one sentence is a student drowning in critique. The one-at-a-time rule forces engagement with one observation before moving on, which matches the pedagogical reality: you can only revise one dimension of a sentence at a time anyway.

**Rejected alternatives:**

- *Tabbed stacked cards (Tab 1 / Tab 2 / Tab 3):* hides count, implies peer-relationship, fails the ranking teachability.
- *All three fully expanded (vertical stack):* drowns the student; card becomes 3× the scroll budget.
- *"Show all" button that expands everything:* same drowning problem, but with a gesture cost.
- *Carousel (dots below, swipe to next):* touch-native feels off on desktop; dots are a weak legend.
- *Only ever show one annotation per sentence, period:* throws away ~30% of L5 output; students learn the product hides things.

### 2.9 Cross-Reference Links — P1/P4 Jump, Breadcrumb, Stack

**Recommendation: cross-references within critique or why-it-matters prose render as *inline pill-style jump links* (small rounded-rect with the target's meta — `¶1`, `¶4 · s2`, `¶3 · closer`). Click navigates the panel (and optionally scrolls the editor) to the referenced target via the Phase 7 crossfade. The panel header's meta line grows a *breadcrumb* showing the navigation stack, tier-colored per step, max 3 deep. `Esc` pops one step; a "jump back" affordance (`← ¶4`) sits left-of-meta.**

L5 insights frequently reference other parts of the essay: "this moment needs P1 to have landed first," "this echoes the closer's final image," "your hook paragraph is paying for this sentence's missing beat." Those references are teaching *structure-level* thinking, and the UI should make the act of chasing a reference frictionless — otherwise the references become abstract and students don't follow them.

**Pill rendering:**

```
...needs [¶1] to have landed first.
```

The `[¶1]` is a small pill (4px padding, 2px vertical, 1px ring at tier-accent 30%, 11px ui-sans 500, rounded-full), inline with the serif prose baseline. Hovering the pill shows a 240ms-delay tooltip with a 2-line preview of the target sentence (not the full sentence — just enough to orient). Clicking navigates.

**What a "click" does:**

1. Panel crossfades to the target's insight card (Phase 7 crossfade, 180ms).
2. Editor: if the target sentence isn't in the viewport, scroll it to viewport-center. If it is, no scroll.
3. Panel header grows a breadcrumb: `← ¶4 · s2 · EXCEPTIONAL` (where `¶4 · s2` is the sentence the student came from), rendered as a clickable back-pill left of the main meta line.
4. Selection ring on the source sentence (the one the student was viewing) remains *dimmed* in the editor (40% opacity, tier-colored); the target sentence gets the active ring.

**Navigation stack — 3 deep max:**

If the student is already 2 levels deep (they came from ¶4, then jumped to ¶1, now they're on ¶1 and see a reference to ¶7), clicking that third reference pushes the stack to 3 deep. The breadcrumb grows: `← ¶4 · ← ¶1 · ¶7`. A fourth jump would exceed the stack depth — in that case, the breadcrumb collapses the oldest entry: `← ... · ¶1 · ¶7` with a hover-disclosure of the hidden root.

Why 3 deep: at 4+ the breadcrumb consumes the panel header width and becomes illegible. Three is enough to handle the realistic "from→detour→home" pattern without teaching students that infinite drilling is supported.

**Back navigation:**

- `Esc` pops one step.
- Clicking the `← ¶4` pill pops to that step directly.
- Clicking the editor's source sentence pops to that sentence (Phase 7's normal click behavior; the stack clears).
- Clicking a new sentence entirely resets the stack.

**Why pills, not footnotes or hover-previews:**

- *Footnotes ([1], [2] with a footnote panel at the bottom):* academic register; requires the student to eye-travel to the bottom of the card and back; hides the target's identity.
- *Hover-preview only (no click navigation):* teaches the student that references are decorative; wastes the L5 cross-reference signal.
- *Tooltip-only (click shows bigger tooltip with full target):* doesn't commit to navigation; the student has to choose between "read the tooltip" and "go there," and the product should be opinionated that going there is the move.
- *Auto-open in a side-by-side view:* expensive real estate; breaks the one-object panel feel.

Pills commit to navigation. The breadcrumb makes navigation reversible. Together they turn cross-references into a navigation mesh the student can explore, which is exactly the cognitive move Phase 10 extends.

**Rejected alternatives:**

- *Full-sentence hover preview in pill tooltip:* bloats the tooltip; the 2-line preview is enough.
- *No pill styling, just underlined text ("paragraph 1"):* loses the meta-line format; students don't learn the `¶N · sN` vocabulary.
- *Tier-color fill on the pill instead of ring:* visual weight too high; pill competes with the critique prose it's embedded in.
- *Cross-reference section at the bottom of the card ("See also: ¶1"):* separates the reference from the sentence that motivated it; weaker teaching.

### 2.10 The "I Understand" Moment — Implicit, Silent, No Ceremony

**Recommendation: no "Got it" button, no "Mark as read" checkbox, no "I understand" acknowledgment affordance of any kind. The student's next click *is* the acknowledgment. Viewed state is tracked silently (panel renders → `viewed.add(annotationId)` at t=1500ms if panel still on that annotation); progress UI (Phase 12) consumes the viewed set to show "you've read 4 of 7 insights" in the overview, but never surfaces read/unread state in the panel itself while the student is reading.**

This decision is about *what obligation the product imposes on the student*. A "Got it" button is an obligation: the student is told their attention must culminate in an affirmative gesture. Two consequences: (1) the gesture becomes rote — students click "Got it" to clear the card, not to signal understanding. (2) The *absence* of the gesture makes the student feel behind: unchecked checkboxes in a feedback UI are guilt objects.

Both consequences are bad for learning. Remove the button, and the card becomes what it is: a thing the student read, then moved on from. The next-click-is-the-acknowledgment model matches how a reader actually reads — you finish a paragraph, you move to the next, there's no "I have finished reading this paragraph" button in a book.

**Silent tracking:**

Viewed state logic:
- Panel renders annotation A at time t₀.
- If panel is still on annotation A at t₀ + 1500ms, fire `markViewed(A)`. This is the "dwell threshold" — long enough that accidental clicks don't mark things viewed, short enough that a normal read (5s+) always counts.
- If the student scrolls within the card, that's also evidence of engagement and marks viewed immediately (at t₀ + 500ms if scrollTop > 20px).
- If the student clicks a cross-reference pill, that's engagement with the card — mark viewed before navigating.

The viewed set is stored in session state, synced to the backend on debounce (every 5 seconds of inactivity, or on panel close). Phase 12 consumes this for the progress UI in the overview card ("You've read 4 of 7 insights — 3 remaining").

**Why no visual feedback for "viewed" in the panel itself:**

A checkmark or a subtle "✓ Viewed" indicator on a card the student is looking at is a grade-like signal. It tells the student the system is watching them read. That's corrosive to the reading experience. The overview card can surface aggregate progress; the panel cannot surface per-annotation viewed state.

Annotations in the editor *do* visibly change when viewed — the tier underline becomes 10% dimmer — but that's a Phase 5/11 concern and the dim is subtle enough that it reads as "I've been here" rather than "the system tracked me."

**Why no re-engagement hints ("You haven't read this one yet"):**

Nagging. The overview card's progress state ("3 remaining") is enough; the sentence-level dim tells the student visually which ones they've touched. Adding a "new" badge in the panel or a "jump to next unread" button starts pressuring the student toward completionism, which is the opposite of the exploratory reading posture we want.

**Rejected alternatives:**

- *Explicit "Got it" button:* obligation; rote clicking; guilt when absent.
- *"Mark as read" checkbox:* bureaucratic; same obligation problem.
- *Auto-advance-to-next-annotation after X seconds:* violates student agency; panicky for slow readers.
- *"I still have questions" button:* well-intentioned, but creates a fork the student has to navigate; most won't click it anyway.
- *Dwell meter ("you've been on this for 30s"):* creepy; makes reading feel surveilled.
- *Badge/checkmark on viewed cards in the stack:* grade-like; undermines exploratory posture.

---

## 3. Typography & Layout Spec

### 3.1 Token table — exact values

```ts
// src/design/tokens/phase8.ts
export const phase8Tokens = {
  panel: {
    paddingX: "24px",
    paddingTop: "20px",
    paddingBottom: "32px",
    maxContentWidth: "68ch",
    background: "oklch(0.97 0.01 240 / 0.92)",
    backdropFilter: "blur(18px) saturate(1.4)",
  },
  type: {
    metaLine:       { family: "ui-sans",  size: "12px", weight: 500, lineHeight: 1.3, tracking: "0.02em" },
    tierWordInline: { family: "ui-sans",  size: "12px", weight: 600, lineHeight: 1.3, tracking: "0.04em" },
    critique:       { family: "ecrm",     size: "15px", weight: 400, lineHeight: 1.55, tracking: "0em" },
    inlineQuote:    { family: "ecrm",     size: "15px", weight: 400, lineHeight: 1.55, tracking: "0em" },
    sectionLabel:   { family: "ui-sans",  size: "11px", weight: 600, lineHeight: 1.3, tracking: "0.08em", textTransform: "uppercase" },
    whyBody:        { family: "ecrm",     size: "15px", weight: 400, lineHeight: 1.55, tracking: "0em" },
    strengthLine:   { family: "ecrm",     size: "14px", weight: 400, lineHeight: 1.5, tracking: "0em" },
    rewriteBody:    { family: "ecrm",     size: "15px", weight: 400, lineHeight: 1.55, tracking: "0em" },
    pillInline:     { family: "ui-sans",  size: "12px", weight: 500, lineHeight: 1.2, tracking: "0.01em" },
    panelHeader:    { family: "ui-sans",  size: "13px", weight: 500, lineHeight: 1.4, tracking: "0.02em" },
    breadcrumb:     { family: "ui-sans",  size: "12px", weight: 500, lineHeight: 1.3, tracking: "0.01em" },
  },
  color: {
    prose:           "oklch(0.22 0.02 240)",
    meta:            "oklch(0.45 0.03 240)",
    label:           "oklch(0.40 0.05 240)",
    tierWord: {
      CRITICAL:     "oklch(0.58 0.20 25)",   // red
      NEEDS_WORK:   "oklch(0.70 0.15 75)",   // amber
      FUNCTIONAL:   "oklch(0.55 0.06 150 / 0.70)",  // sage, 70%
      STRONG:       "oklch(0.65 0.15 150)",  // green
      EXCEPTIONAL:  "oklch(0.60 0.12 195)",  // teal
      MASTERFUL:    "oklch(0.55 0.20 295)",  // purple
    },
    rewriteSurface:  "oklch(0.98 0.005 240 / 0.55)",
    pillRing:        "color-mix(in oklch, var(--tier-accent) 30%, transparent)",
    scrollbar:       "color-mix(in oklch, var(--tier-accent) 20%, transparent)",
  },
  spacing: {
    metaToCritique:       "16px",
    critiqueToWhyLabel:   "20px",
    whyLabelToWhyBody:    "6px",
    whyBodyToStrengthsLbl:"24px",
    strengthsLblToFirst:  "6px",
    strengthBetween:      "8px",
    strengthsToRewriteLbl:"24px",
    rewriteLblToBody:     "6px",
    rewriteInsetPaddingX: "16px",
    rewriteInsetPaddingY: "14px",
    rewriteInsetRadius:   "10px",
  },
  motion: {
    sectionFadeIn:        "180ms cubic-bezier(0.22, 1, 0.36, 1)",
    stackExpand:          "220ms cubic-bezier(0.22, 1, 0.36, 1)",
    pillHover:            "140ms ease-out",
    scrollIndicatorFade:  "180ms ease-out",
  },
} as const;
```

### 3.2 Card structure (component tree)

```
InsightCard
├── MetaLine
│   ├── ParagraphRef  (¶4)
│   ├── Separator     (·)
│   ├── SentenceRef   (sentence 2)
│   ├── Separator     (·)
│   ├── TierWord      (EXCEPTIONAL) — colored
│   └── TypeWord      (structural)  — if non-default, neutral gray
├── CritiqueProse
│   └── Paragraph     (may contain <InlineQuote> and <CrossRefPill>)
├── Section (if structural, optionally a ParagraphPullQuote between meta and critique)
├── WhySection
│   ├── SectionLabel  ("WHY IT MATTERS")
│   └── WhyBody       (single sentence, may contain <CrossRefPill>)
├── StrengthsSection
│   ├── SectionLabel  ("WHAT'S WORKING")
│   └── StrengthLines (1–3 × <StrengthLine>)
└── RewriteSection (optional — phase-gated)
    ├── SectionLabel  ("ONE POSSIBLE MOVE")
    └── RewriteSurface
        ├── RewriteBody (1–3 sentences of alternate prose)
        └── RewriteNote (optional 1-sentence note on the trade-off)

InsightStack (when multiple annotations on one sentence)
├── InsightCard (primary, expanded)
└── DisclosureRow ("N more on this sentence")
    └── (on click) expands to:
        ├── CollapsedCardRow (primary, collapsed)
        ├── CollapsedCardRow (secondary)
        └── CollapsedCardRow (tertiary)
```

### 3.3 Tailwind / shadcn class sketch

```tsx
// src/components/panel/InsightCard.tsx (sketch)
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function InsightCard({ insight, tier, isPrimary = true }: InsightCardProps) {
  return (
    <motion.article
      className={cn(
        "max-w-[68ch] px-6 pb-8 pt-5",
        "text-[15px] leading-[1.55] text-[oklch(0.22_0.02_240)]",
        "font-serif",  // ECRM
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <MetaLine insight={insight} tier={tier} />
      <div className="mt-4">
        <CritiqueProse text={insight.critique} />
      </div>
      <WhyItMatters body={insight.whyItMatters} className="mt-5" />
      <Strengths lines={insight.strengths} className="mt-6" />
      {insight.rewrite && <Rewrite rewrite={insight.rewrite} className="mt-6" />}
    </motion.article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      "font-sans text-[11px] font-semibold uppercase tracking-[0.08em]",
      "text-[oklch(0.40_0.05_240)]",
      "mb-1.5",
    )}>
      {children}
    </div>
  );
}

function MetaLine({ insight, tier }: { insight: Insight; tier: Tier }) {
  return (
    <div className="font-sans text-[12px] font-medium tracking-[0.02em]
                    text-[oklch(0.45_0.03_240)] flex items-center gap-1.5">
      <span>¶{insight.paragraph}</span>
      <span aria-hidden>·</span>
      <span>sentence {insight.sentenceIndex}</span>
      <span aria-hidden>·</span>
      <TierWord tier={tier} />
      {insight.type !== "growth" && (
        <>
          <span aria-hidden>·</span>
          <span className="text-[oklch(0.50_0.02_240)]">{insight.type}</span>
        </>
      )}
    </div>
  );
}
```

### 3.4 Responsive breakpoints

| Viewport | Panel width | Max line length | Prose size | Notes |
|---|---|---|---|---|
| ≥1440px (desktop) | 40% (576px) | 68ch | 15px | Target |
| 1024–1439px | 40% (410–576px) | 55–68ch | 15px | Slight compression |
| 768–1023px (tablet) | 50% (384–512px) | 50–60ch | 15px | Panel grows to 50% of viewport |
| <768px (mobile) | bottom sheet | 90% of sheet width | 15px | See §5 |

---

## 4. Copy Deck — Three Full Example Insights

### 4.1 Example 1 — CRITICAL (red)

**Student's essay — ¶2, sentence 1:**
> "I worked at the grocery store for two years and it taught me responsibility."

**Insight card as rendered:**

```
¶2 · sentence 1 · CRITICAL

The sentence moves directly from the fact ("I worked at the
grocery store for two years") to the lesson ("it taught me
responsibility") without staying inside the work long enough
for the reader to feel why the job was a teacher. Right now
"responsibility" is the conclusion, and the essay has to earn
that word by showing us a single moment where it was at stake.

WHY IT MATTERS
Your North Star is about becoming the person other people
count on — and this is the first paragraph where a reader
could watch that happen, but the sentence skips past it.

WHAT'S WORKING
• "Two years" is the right number to name — it signals duration
  without being showy.
• Keeping the job concrete (grocery store, not "a job") resists
  the abstraction most opening sentences fall into.

ONE POSSIBLE MOVE
  The night the freezer broke at 10pm and I was the only person
  in the building under thirty, I learned what responsibility
  actually costs.

  The rewrite names a specific night so the word "responsibility"
  is paid for by the moment, not claimed before it's earned.
```

**Inline rendering notes:**
- Tier word `CRITICAL` in red (`oklch(0.58 0.20 25)`), all caps, 12px 600 weight.
- Critique opens with a 9-word inline quote ("I worked at the grocery store for two years") rendered at 400 weight inside the 400-weight paragraph (no visual distinction beyond the quotation in the context).
- `WHY IT MATTERS`, `WHAT'S WORKING`, `ONE POSSIBLE MOVE` each 11px 600 uppercase sans, tracked at 0.08em.
- Rewrite body in an inset rounded rect (10px radius, `oklch(0.98 0.005 240 / 0.55)` bg), 14px/16px padding.
- Rewrite note sits below the rewrite prose at the same 14px indent, smaller (14px serif), weight 400, color `oklch(0.45 0.03 240)`.

### 4.2 Example 2 — NEEDS-WORK (amber)

**Student's essay — ¶3, sentence 4:**
> "My grandmother, who had always been the anchor of our family, began to lose her memory during my sophomore year."

**Insight card as rendered:**

```
¶3 · sentence 4 · NEEDS WORK

The sentence names "the anchor of our family" and then names
"lose her memory" in the same breath — both of those phrases
are carrying a lot of emotional weight, and stacking them
inside one clause means neither gets time to land. The reader
hears the metaphor and the diagnosis almost as a single fact,
when the whole paragraph depends on them being separate.

WHY IT MATTERS
This is the pivot of [¶3] — the moment the essay shifts from
your grandmother's presence to her absence — and the pivot's
work is carried by exactly how long the reader is allowed to
sit between the two ideas.

WHAT'S WORKING
• "Anchor" is the right metaphor; it's not decorative, it's
  structural — anchors hold ships in place.
• Pinning the change to "my sophomore year" gives the memory
  loss a specific clock, which most essays about grandparents
  miss entirely.

ONE POSSIBLE MOVE
  My grandmother had always been the anchor of our family.
  During my sophomore year, she began to lose her memory.

  Splitting the sentence in two lets each idea have its own
  beat — the anchor gets to be the anchor for a full breath
  before the memory starts leaving.
```

**Inline rendering notes:**
- Tier word `NEEDS WORK` in amber (`oklch(0.70 0.15 75)`), all caps, with non-breaking space between words.
- Cross-reference pill `[¶3]` in the why-it-matters: 4px horizontal padding, amber 30% ring, 11px 500 sans.
- Two strength lines (fewer bullet items = more room to read each).
- Rewrite includes a double-sentence construction, demonstrating the pivot split.

### 4.3 Example 3 — EXCEPTIONAL (teal)

**Student's essay — ¶5, sentence 2:**
> "The stethoscope was warm from her hands before it touched my chest."

**Insight card as rendered:**

```
¶5 · sentence 2 · EXCEPTIONAL · strength

This sentence is doing what most college essays try and fail
to do: it shows inheritance through a physical object without
ever naming "inheritance." The warmth is hers before it's
yours; the sequence ("warm from her hands before it touched
my chest") places the reader inside the transfer of care
rather than telling us about it.

WHY IT MATTERS
This is the essay's emotional fulcrum — every earlier beat
about your mother's work and every later beat about choosing
medicine now has a physical anchor, which is what lets the
closing paragraph land without sentimentality.

WHAT'S WORKING
• "Warm from her hands" is the exact sensory choice — temperature
  beats vision here because warmth carries presence in a way
  sight can't.
• The preposition "before" is doing structural work — it turns a
  moment into a sequence, and a sequence is what the reader
  needs to feel the transfer.
• You resist following this with an explanation; the next
  sentence lets this one breathe, which is the harder choice
  and the right one.
```

**Inline rendering notes:**
- Tier word `EXCEPTIONAL` in teal (`oklch(0.60 0.12 195)`), all caps.
- Type word `strength` appears in the meta line because type is non-default (growth is default, not shown).
- **No rewrite section** — STRONG+ tiers omit rewrite because there's nothing to rewrite toward; the card ends on strengths.
- Three strength lines (allowed on STRONG+ because there's genuinely a lot to name).
- Critique is a single paragraph but also shorter — STRONG+ critique is about *naming the craft*, not diagnosing a gap, so 3 sentences is plenty.

---

## 5. Mobile Adaptation — Bottom Sheet Content Design

Phase 7 established that on touch/mobile viewports (<768px), the side panel becomes a bottom sheet that peaks to 55% and expands to 90% on drag. Phase 8 specifies what the *content* inside that sheet looks like.

### 5.1 Peak state (55% sheet, ~380px tall on a 690px viewport)

At peak, the sheet shows:

```
╭────────── drag handle ──────────╮
│                                 │
│ ¶4 · sentence 2 · EXCEPTIONAL    │
│                                 │
│ This sentence is doing what     │
│ most college essays try and     │
│ fail to do: it shows inheritance│
│ through a physical object       │
│ without ever naming...          │
│                                 │
│ ▼ Pull up for full insight      │
╰─────────────────────────────────╯
```

- Drag handle: 32px × 4px, 20% black, 4px top margin.
- Meta line at 12px/600 weight (up from 500 on desktop — mobile needs heavier meta because the surface has less visual hierarchy).
- Critique first 2 sentences, ECRM serif 15px, line-height 1.55 (unchanged from desktop).
- Bottom hint: `▼ Pull up for full insight` at 11px sans, 50% opacity, fades after 3 seconds of user presence on the sheet (they've learned it exists).
- No WHY / STRENGTHS / REWRITE at peak — those are below the fold. This is intentional: peak gives the student the *seen* moment (5s goal) and invites expansion for the rest.

### 5.2 Expanded state (90% sheet, ~620px tall)

Full card structure identical to desktop but with adjustments:

- Padding: 20px horizontal (down from 24px) to maximize text width.
- Max line length: 56ch (down from 68ch) — mobile viewports are narrower.
- Prose size: 15px (unchanged — readability trumps density).
- Section spacing: 20px between sections (down from 24px) — slightly tighter rhythm.
- Rewrite inset: unchanged, but inset padding reduced to 12px to save horizontal space.
- Scroll indicator: moved from right edge (not useful on touch) to bottom-edge fade-gradient indicating "more below" if applicable.

### 5.3 Touch-specific interactions

- **Swipe down on drag handle:** collapses sheet to peak.
- **Swipe down from top of sheet (not handle):** collapses sheet to closed (returns to editor).
- **Swipe horizontally on meta line:** navigates to next/previous annotation (the "power-user gesture" Phase 7 mentioned) — but *not* on card body, which is reserved for text selection.
- **Tap on cross-reference pill:** same as desktop — navigates the sheet content to the target, breadcrumb appears in a new row above the meta line.
- **Tap on disclosure row ("2 more on this sentence"):** expands the stack inline; sheet grows to fit if needed.
- **Long-press on strength line:** no action. We deliberately do *not* enable long-press menus; students in usability testing triggered these accidentally.

### 5.4 Breadcrumb on mobile

The breadcrumb for cross-reference navigation sits in its own row above the meta line, not inline (no horizontal room):

```
╭────────── drag handle ──────────╮
│ ← ¶4 · s2                        │  ← breadcrumb row, tappable
│ ¶1 · sentence 3 · STRONG         │  ← current meta line
│                                 │
│ The sentence's opening image... │
```

### 5.5 Mobile-specific rejected alternatives

- *Full-screen takeover modal instead of bottom sheet:* destroys the "essay is still visible" mental model; student loses context on where they are.
- *Side drawer on mobile (same as desktop but narrower):* unusable at <768px widths; prose becomes too narrow.
- *Horizontal scrolling between annotations instead of swipe-at-meta-line:* broke touch convention expectations in testing; students scrolled vertically by accident.

---

## 6. Backend Requirements — L5 Output Schema

The frontend's ability to render the spec above depends entirely on L5 producing well-shaped output. Here is the exact schema required.

### 6.1 TypeScript schema

```ts
// src/services/essayIntelligence/types/l5.ts

export type InsightTier =
  | "CRITICAL"
  | "NEEDS_WORK"
  | "FUNCTIONAL"
  | "STRONG"
  | "EXCEPTIONAL"
  | "MASTERFUL";

export type InsightType =
  | "growth"      // specific improvement lever
  | "strength"    // what's working, worth naming
  | "structural"  // paragraph- or cross-paragraph-scope
  | "teaching";   // craft principle

export type ImprovementPhase =
  | "foundation"
  | "architecture"
  | "craft"
  | "polish"
  | "distinction";

export interface CrossReference {
  /** Unique ID of the referenced annotation. */
  targetAnnotationId: string;
  /** Paragraph index, 1-based. */
  paragraph: number;
  /** Sentence index within paragraph, 1-based. Omit for paragraph-scope refs. */
  sentenceIndex?: number;
  /** Short label for pill rendering: "¶1", "¶4 · s2", "¶3 · closer". */
  label: string;
  /** 2-line preview for hover tooltip, <= 140 chars. */
  preview: string;
}

export interface InlineQuote {
  /** The exact substring from the student's sentence. 2–7 words. */
  text: string;
  /** Character offset within the student's sentence. */
  startOffset: number;
  /** End offset (exclusive). */
  endOffset: number;
}

export interface CritiqueBody {
  /** Full critique prose, 2–4 sentences. Contains placeholders {{quote:0}}, {{xref:0}}. */
  text: string;
  /** Inline quotes referenced by {{quote:N}} placeholders, in order. */
  quotes: InlineQuote[];
  /** Cross-references referenced by {{xref:N}} placeholders, in order. */
  crossReferences: CrossReference[];
}

export interface WhyItMatters {
  /** Flavor: "north_star" connects to theme; "structural" names the sentence's role. */
  flavor: "north_star" | "structural";
  /** Single-sentence body (or Socratic question for foundation-phase teaching insights). */
  body: string;
  /** Cross-references within the body, referenced by {{xref:N}}. */
  crossReferences: CrossReference[];
  /** If flavor === "north_star", the theme phrase to highlight in italics. */
  northStarPhrase?: string;
  /** If flavor === "structural", the role name (e.g., "hook's landing line"). */
  structuralRole?: string;
  /** True iff this is a Socratic-form question (foundation + teaching only). */
  isSocratic?: boolean;
}

export interface StrengthLine {
  /** 6–14 word observation. Must be specific, not generic. */
  text: string;
  /** Optional micro-quote anchoring this strength to the student's text. */
  quote?: InlineQuote;
}

export interface RewriteSuggestion {
  /** The alternate prose, 1–3 sentences. */
  text: string;
  /** Optional one-sentence note on what the rewrite trades / gains. */
  note?: string;
  /** Phase gate: only rendered if student's current phase is in this list. */
  showInPhases: ImprovementPhase[];
  /** Variant count: 1 for craft, up to 3 for polish. */
  variantCount: 1 | 2 | 3;
  /** Additional variants (rendered as tabbed within the rewrite surface when variantCount > 1). */
  additionalVariants?: Array<{ text: string; note?: string }>;
}

export interface Insight {
  /** Stable ID — used for viewed-state tracking and cross-references. */
  id: string;

  /** Scope this insight applies to. */
  scope:
    | { kind: "sentence"; paragraph: number; sentenceIndex: number }
    | { kind: "paragraph"; paragraph: number };

  /** L3.5 effectiveness tier. Single source of color and tier word. */
  tier: InsightTier;

  /** Insight type; shapes voice but not structure. */
  type: InsightType;

  /** Priority for same-sentence ranking. Higher = more important. */
  impactScore: number;

  /** THE CRITIQUE. 2–4 sentences, evidence-grounded. Required. */
  critique: CritiqueBody;

  /** WHY IT MATTERS. Always present, always one sentence. */
  whyItMatters: WhyItMatters;

  /** WHAT'S WORKING. 1–3 specific strengths. Always present, never empty. */
  strengths: StrengthLine[];

  /** ONE POSSIBLE MOVE. Optional; phase-gated. */
  rewrite?: RewriteSuggestion;

  /** Metadata for progress tracking (populated by frontend on render). */
  meta?: {
    viewed?: boolean;
    viewedAt?: string;
  };
}

export interface SentenceAnnotations {
  /** All insights targeting this sentence, in priority order. */
  insights: Insight[];
  /** Original sentence text, for quote validation and pull-quote rendering. */
  sentenceText: string;
}

export interface ParagraphAnnotations {
  paragraph: number;
  paragraphText: string;
  /** Paragraph-scope insights (type: "structural"). */
  paragraphInsights: Insight[];
  /** Per-sentence annotations. */
  sentences: Record<number, SentenceAnnotations>;
}

export interface EssayAnnotationReport {
  essayId: string;
  northStar: {
    theme: string;          // e.g., "rebuilding after loss"
    phrase: string;         // short form for italic highlight
  };
  currentPhase: ImprovementPhase;
  paragraphs: ParagraphAnnotations[];
  /** Generated at timestamp; used for cache-bust and progress resets. */
  generatedAt: string;
}
```

### 6.2 Placeholder resolution

The frontend receives `critique.text` containing `{{quote:0}}`, `{{quote:1}}`, `{{xref:0}}` placeholders. Renderer logic:

```tsx
function renderCritiqueBody(body: CritiqueBody): React.ReactNode {
  const tokens = body.text.split(/(\{\{(?:quote|xref):\d+\}\})/g);
  return tokens.map((token, i) => {
    const quoteMatch = token.match(/^\{\{quote:(\d+)\}\}$/);
    if (quoteMatch) {
      const q = body.quotes[parseInt(quoteMatch[1], 10)];
      return <InlineQuoteText key={i}>{q.text}</InlineQuoteText>;
    }
    const xrefMatch = token.match(/^\{\{xref:(\d+)\}\}$/);
    if (xrefMatch) {
      const x = body.crossReferences[parseInt(xrefMatch[1], 10)];
      return <CrossRefPill key={i} xref={x} />;
    }
    return <span key={i}>{token}</span>;
  });
}
```

### 6.3 L5 prompt-level requirements

For the frontend to render correctly, L5's generation prompt must enforce:

1. **Evidence grounding (forcing function):** every `critique.text` must contain at least one `{{quote:N}}` placeholder, and each quote must be a substring of `sentenceText` (validated server-side; if validation fails, reject and regenerate).
2. **Strengths non-emptiness:** `strengths.length >= 1` on every insight, regardless of tier. On CRITICAL, L5 is instructed to find at least one specific working thing even if the dominant problem is severe. If L5 genuinely cannot, it must return the insight as `type: "structural"` at paragraph scope instead of sentence scope.
3. **Why-it-matters single sentence:** `whyItMatters.body` must be exactly one sentence (validated by period count; multi-sentence bodies are rejected).
4. **Critique length cap:** `critique.text` must be 2–4 sentences (validated; 1-sentence or 5+ sentence critiques are rejected and regenerated).
5. **No generic strengths:** strengths must either contain a `quote` field OR reference a specific mechanic (named by a word-list validator — presence of concrete nouns like "verb," "metaphor," "sequence," "pacing," or a quoted word). Strengths that pass no validation are flagged and regenerated.
6. **Phase gating for rewrites:** L5 must populate `rewrite.showInPhases` based on the essay's current phase. Foundation phase suppresses rewrites on most sentences; polish phase shows up to 3 variants.
7. **Cross-reference validity:** every `CrossReference.targetAnnotationId` must exist in the same report (referential integrity validated server-side).
8. **impactScore ordering:** insights within a `sentence.insights[]` array must be pre-sorted by `impactScore` descending (frontend trusts the order; does not re-sort).

### 6.4 Size / performance expectations

Per essay (650 words, ~45 sentences, ~7 paragraphs):
- Typical insight count: 25–35 (not every sentence has an insight; SAGE sentences produce a "functional" placeholder that the frontend renders as the Phase 7 empty state, not as an insight card).
- Typical payload size: 80–150 KB uncompressed JSON, 20–40 KB gzipped.
- Delivered as a single report fetch on session start (not streamed per-click); panel interactions are pure client-side after initial load.

### 6.5 What NOT to include in the schema

- **No `score` field per insight.** The `tier` is the only score-shaped value.
- **No `confidence` field.** If L5 isn't confident enough, the insight isn't generated.
- **No `severity` enum separate from tier.** Tier carries severity.
- **No `suggestedReadTime` field.** Frontend derives read time from content length (our goal is 30s, not enforcement).
- **No `category` taxonomy beyond `type`.** The L3.5 data retains fine-grained categories for analytics and Profile tab; the Insights card keeps to four types.

---

## 7. Emotional Map — How Does Reading Feedback FEEL at 5s / 15s / 30s?

The single most important thing about Phase 8: the student has to feel a specific way at three specific time marks. Miss any of them and we've built a beautiful panel that ships a bad product.

### 7.1 t=0 to t=5s — "Seen"

**Target feeling:** *this thing is about my sentence.*

The student's eyes land on the meta line, then the first sentence of critique. Within those first 5 seconds they should see:

1. Their paragraph number and sentence number matching the one they just clicked (meta line).
2. The tier word matching the vibe they already felt when they saw the underline (CRITICAL sentences had red wavy underlines; EXCEPTIONAL sentences had teal shimmer — the tier word confirms, it doesn't surprise).
3. A quoted snippet of *their own words* in the critique's first sentence.

If all three land, the student feels *seen* — this is specifically about the sentence they clicked, it knows what it is, and it's read the text carefully enough to quote them back. Trust is established.

**Failure modes:**
- If the quote is missing (generic critique): feels like a chatbot template; trust doesn't form.
- If the tier word contradicts what they expected (they clicked a red underline but the card reads "STRONG"): breaks the color-tier compact from Phase 5.
- If the meta line is wrong paragraph/sentence: catastrophic; whole product loses credibility.

**Failure countermeasures:**
- L5 prompt forcing function requires a quote (§6.3).
- Tier is driven by L3.5 effectiveness score deterministically; UI never overrides.
- Panel header meta line is sourced from the clicked sentence's position data, never from L5 output.

### 7.2 t=5s to t=15s — "Oriented"

**Target feeling:** *I understand why this matters.*

The student has finished the critique and their eye moves down to `WHY IT MATTERS`. The single sentence ties the local observation to something they already care about — usually their North Star theme, which they saw in the Phase 5 overview card and which has been sitting in their head as the essay's purpose.

If the why-it-matters succeeds, they feel *oriented* — the critique is no longer a random annotation, it's a piece of a larger architecture they can see. The feeling is sometimes described as "oh, so *that's* what this paragraph is supposed to be doing."

**Failure modes:**
- If the why-it-matters is generic ("this affects the flow"): the student reads it, shrugs, and the critique loses its weight retroactively.
- If the North Star phrase doesn't match what the overview card said: breaks the essay-level coherence; student starts distrusting the North Star.
- If the why-it-matters is two sentences: it crosses into critique-2 territory and the student re-reads the critique, losing the orientation moment.

**Failure countermeasures:**
- Generic-why-it-matters is rejected at L5 generation (§6.3 requires either `northStarPhrase` or `structuralRole` to be populated).
- North Star phrase is sourced from the essay's top-level theme data, reused across overview, coaching bar, and why-it-matters.
- One-sentence rule validated by period count (§6.3 item 3).

### 7.3 t=15s to t=30s — "Capable"

**Target feeling:** *I have a move.*

The student scrolls into `WHAT'S WORKING`. They read 1–3 specific observations of things their sentence is already doing right. The observations quote small phrases from their sentence, name specific mechanics, and don't feel like consolation — they feel like *correct readings* of craft choices they may not have noticed they made.

Then the rewrite (if present). The rewrite isn't "the right answer." It's *a* possible move, with a one-line note on what it trades. The student reads it, considers it, maybe agrees, maybe doesn't — either way, they now have a concrete alternate reality to compare their current sentence against.

If the strengths + rewrite succeed together, the student feels *capable* — they have a foothold (strengths) and a direction (rewrite). Revision energy is at its highest.

**Failure modes:**
- Generic strengths ("good sentence"): destroys the feeling; strengths without specificity feel like participation trophies.
- Too-prescriptive rewrite ("change this to this"): makes the student feel inadequate, not capable; rewrite should be a demonstration, not a command.
- No strengths at all on a CRITICAL sentence: the student looks at the card and sees only failure; revision energy craters.
- Foundation-phase student getting a Polish-level word-by-word rewrite: tonally off; they're not at the word level yet, they're at the paragraph level.

**Failure countermeasures:**
- Generic-strengths validator (§6.3 item 5).
- Rewrite is always framed as "one possible move," never "the right answer" (copy convention enforced by prompt).
- Strengths non-empty requirement (§6.3 item 2).
- Phase gating on rewrite (§6.3 item 6) — Foundation phase suppresses word-level rewrites.

### 7.4 t=30s+ — "Curious" (if they stay)

**Target feeling (bonus):** *I want to see the next one.*

If the student stays past 30s on a card, it usually means they clicked a cross-reference pill or expanded a second annotation. This is the *curiosity* moment — not about the current card, but about the essay's mesh of observations.

The emotional goal here is subtler: the student should feel that the feedback is a *landscape* they can explore, not a gradebook they have to finish. The breadcrumb navigation (§2.9) teaches this — they can wander ¶4 → ¶1 → ¶7 and come back, and the product supports the wandering without pushing them toward "done."

**Failure modes:**
- If cross-references dead-end (targetAnnotationId missing): breaks the exploration.
- If breadcrumb doesn't let them return: they feel lost, abandon the exploration.
- If completionism pressure appears ("3 remaining!" in the panel): exploration turns into homework.

**Failure countermeasures:**
- Referential integrity validation (§6.3 item 7).
- Breadcrumb implementation spec (§2.9).
- No per-panel completion UI (§2.10).

### 7.5 The failure the whole phase is optimized against — "Graded"

At no point should the student feel *graded*. Graded feels:
- a number in a box
- a colored badge that reads like a letter-grade
- a "strengths/weaknesses" split that feels like a report card
- a completion counter that tracks "read / unread"
- a pass/fail threshold anywhere in the UI
- phrases like "needs improvement," "unsatisfactory," "below standard"

Every rejected alternative in §2 is rejected because it tipped toward graded. The five-section shape, the absence of scores, the implicit acknowledgment, the strength-on-every-card rule — all of these are calibrated to keep the student in a *reading a trusted coach* headspace, not a *receiving a graded paper* headspace.

---

## 8. Open Questions for Wave 4

The following questions are genuinely unresolved and require either user research, L5 capability validation, or a Wave 4 design decision. Each is flagged with what would unblock it.

### 8.1 What happens when the student disagrees with a critique?

Phase 8 does not include a "disagree" affordance. There's a case for one (student agency, false-positive correction, training data) and a case against (every disagreement button I've seen teaches students the product's feedback is negotiable, which dilutes the authority of every *correct* critique). The question: is there a narrow, dignified way to accept disagreement without training students that critiques are optional?

**Unblocks:** Wave 4 concept test of three variants — no button, "This doesn't apply" button, "Tell us why" freeform.

### 8.2 Do we ever proactively update an insight after the student revises?

When a student revises a sentence flagged CRITICAL and the revision moves it to STRONG, the old insight is stale. Do we (a) silently update on next L5 pass, (b) show a "this insight has been updated" banner the next time they click, (c) show a celebration ("This sentence moved from CRITICAL to STRONG"), or (d) surface a new insight on the revised sentence?

**Unblocks:** Phase 11 (revision loop) design; Phase 12 (progress celebration) design. Likely answer is (d) with a subtle hint at (c).

### 8.3 How much should we show students about how the insights are generated?

Some students (often high-agency, research-oriented ones) want to know *how* the critique was produced — which model, what context, what prompt. Showing that transparently risks leaking prompt-engineering that competitors could copy. Hiding it risks feeling like a black box, which young users are increasingly skeptical of.

**Unblocks:** A settings-page "How insights are generated" explainer — no per-insight model-showing, but a once-available transparency page. Wave 4 copy work.

### 8.4 Multi-annotation stack — should priority be visible as a number or a label?

§2.8 says priority comes from L5's `impactScore` and the UI shows annotations in that order without showing the score. But should the disclosure row read "2 more on this sentence" or "2 more (lower priority)"? The first is neutral, the second is more honest about the ranking but teaches students that the hidden ones are *less important*, which we may not want.

**Unblocks:** User testing with both strings; leaning toward the neutral form until proven otherwise.

### 8.5 Cross-reference pill proliferation — where's the ceiling?

A paragraph-level structural insight might reference 4–5 other sentences. At some point a critique sentence peppered with 5 pills becomes illegible. Should we cap pills-per-critique at 2? 3? And if we cap, how does L5 decide which ones to keep inline vs. push into a "see also" tail?

**Unblocks:** L5 capability check — can it rank cross-references by strength? If yes, inline top 2, tail the rest. If no, we need a heuristic (e.g., nearest-paragraph wins).

### 8.6 Rewrite variants — how many is too many?

Polish phase allows up to 3 variants. Is 3 the right ceiling, or should it be 2? Three variants with tabs inside the rewrite surface start to feel like a chooser — "pick your favorite" — which might be too much decision-burden for a student in Polish phase who should be making *fewer* decisions per sentence, not more.

**Unblocks:** Internal style review on 10 polished essays; checking whether 3 variants ever materially outperform 2.

### 8.7 The "teaching" type — is it too rare to justify its own category?

In initial L5 output samples, `type: "teaching"` appears on roughly 4–8% of insights. That's rare enough that students might see only 1–2 per essay, which means the category isn't teaching anything (in aggregate). Options: (a) merge into `growth`, (b) promote by making L5 generate more, (c) keep it as-is because the 4–8% that *do* land are high-value.

**Unblocks:** Wave 4 pedagogy review — what's the learning dose response here? Is 4–8% the right rate, or should teaching insights be more frequent?

### 8.8 North Star phrase reuse — when does it start to feel repetitive?

If 60% of insights open their why-it-matters with "Your North Star is *rebuilding after loss*," the student will see that phrase 18 times in a 30-insight session. Is that reinforcement or fatigue? Does the italicized phrase need to rotate across synonyms, or is the repetition actually load-bearing for theme-anchoring?

**Unblocks:** Copy test: variant A with straight repetition, variant B with L5-generated paraphrases of the North Star. Hypothesis: repetition wins because the student is not reading the cards sequentially — they're reading them as-they-click, with time between them.

### 8.9 Foundation-phase Socratic whys — do they work at scale?

§2.4 allows `isSocratic: true` for Foundation-phase teaching insights, rendering the why-it-matters as a question. This is a voice break — if L5 produces Socratic whys inconsistently (some insights declarative, some question), the card shape could feel unstable. Either we go all-in on Socratic for Foundation phase (every why is a question) or we never allow them. The middle ground we've specified might be the worst of both worlds.

**Unblocks:** Prototype test with 20 Foundation-phase students — do they read the Socratic whys more deeply? Do the declarative whys feel inconsistent next to them?

### 8.10 When does the panel show "the whole essay is being rewritten" at once?

If the student makes a structural edit (moves a paragraph, deletes a hook), L5 re-runs and many insights change simultaneously. Right now Phase 8 treats each insight as independent — the student clicks, sees the new insight. But do we need a "major revision detected — here's what changed" overview card? And if so, is that a Phase 8 concern or a Phase 11 concern?

**Unblocks:** Phase 11 revision-loop design. Likely answer: it's a Phase 11 concern, but Phase 8's contract is that *any* insight the student clicks after a major edit should render cleanly and independently; the "overview of changes" lives elsewhere.

---

## 9. Three Headline Decisions (for reference)

1. **The Insight Card Shape is the contract.** Every annotation, every tier, every phase renders in exactly this order: `meta line → critique → why it matters → strengths → rewrite (optional)`. No variations. The shape is taught by the first insight the student reads and is rewarded by being identical forever after, because the cognitive tax of relearning layouts outweighs any local optimization from tier- or phase-conditional reordering.

2. **Strengths appear on every card, including CRITICAL, and they sit between critique and rewrite.** This is the single most distinguishing pedagogical choice in the spec: no sentence is ever rendered as entirely broken, every critique is grounded by naming what the sentence is already doing right, and the student enters every rewrite suggestion from a footing of things that already work — not as consolation, but as scaffolding for revision energy.

3. **Cross-references are inline pills with a breadcrumb navigation stack, not footnotes or hover-previews.** When a critique says "this moment needs ¶1 to have landed first," the `[¶1]` is a click-commit — it navigates the panel, leaves a `← ¶4` breadcrumb, and lets the student wander a three-deep navigation mesh of the essay's structural connections without ever losing the way home.

---

*End of Phase 8 spec. Feeds Phase 9 (Profile tab depth — the L3 understanding view), Phase 10 (extended cross-reference navigation and connection graph visualization), and Phase 11 (revision loop — what happens when the student actually rewrites).*
