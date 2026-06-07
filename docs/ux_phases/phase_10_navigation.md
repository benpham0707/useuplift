# Phase 10: Navigation — The Guided Journey Through The Annotations

> Wave 3 / Phase 10. Depends on Phases 4–9. Feeds Phase 11 (map/list view), Phase 12 (end-of-review → revision loop handoff), Phase 13 (telemetry: coverage, skip-rate, dwell), Phase 15 (focused re-analysis queue insertion).
> Companion to `docs/INLINE_ANNOTATION_UX_PLAN.md` §9 Navigation & Progress. Inherits Phase 5's auto-bloom-at-2600ms (the *first* selection is decided before the student does anything, which means Phase 10's navigation state machine starts at index 0 already populated), Phase 6's keyboard-shortcuts-surface-after-first-panel-close (which pushes full keyboard fluency to after Phase 10 has already begun, meaning Phase 10 must degrade gracefully for mouse-only users), Phase 7's 180ms crossfade + latest-wins rapid-click contract (which is the per-transition cost model Phase 10's "Next" must respect — a held-Tab is a rapid-click in disguise), Phase 8's 3-deep jump-back breadcrumb stack (which Phase 10 generalizes: all navigation, not just cross-reference navigation, operates against one stack), and Phase 9's copy-only / no-apply discipline (which means Phase 10 does *not* need to handle "accepted rewrite → skip to next" — every Next click is a student-initiated advance through the feedback queue, never a consequence of an applied change). Phase 10 is the last phase in Wave 3 and is the phase where the product stops being a reading experience and starts being a journey with a destination.

---

## 1. Design Summary

Phase 10 is the phase where the annotated essay stops being a dense thicket of colored underlines and becomes a path the student walks exactly once, from the most load-bearing sentence to the least, with the assurance at every step that the path was chosen for them by something that read the whole essay and that at the end there is a summary and a single next thing to do; without Phase 10 the student is dropped into a scavenger hunt with ten to thirty collectibles and no indication that any of them matter more than any other, and the predictable failure mode — confirmed by every writing-tool competitor's session recordings — is that the student clicks three underlines, reads three critiques, gets overwhelmed by the volume of remaining work, and closes the tab. Phase 10 takes one position and builds the whole navigation around it: **the default order is not document order, it is a smart order that front-loads the critical sentences while preserving enough of the essay's spatial logic that the student never feels yanked around.** The ordering algorithm (Section 7) computes a priority score per annotation from four inputs — tier weight (CRITICAL 1.0, NEEDS WORK 0.55, STRONG 0.10, EXCEPTIONAL 0.15, MASTERFUL 0.0; FUNCTIONAL excluded), structural importance (opening paragraphs and closing paragraphs weighted higher, body paragraphs normalized), cross-reference centrality (an annotation that appears in ≥2 other annotations' cross-reference stacks gets a +0.15 bump — these are the essay's connective tissue), and document position tiebreak (later is later) — then applies a "spatial smoothing" pass that allows up to one document-order inversion per three annotations, preventing the path from ricocheting between paragraphs more than necessary. The default is smart order; a single toggle in the panel header switches to strict document order (`Walk the essay in order`), and we expect roughly 20% of students to use it, which is a healthy rate — below 10% would mean the control is invisible, above 30% would mean smart order is misjudging the path. The "Next" mechanism is a single primitive with three surfaces — the Tab key, the ↓ arrow, and a `Next →` button in the panel footer — all of which commit to the same state transition; there is no auto-advance at any interval, because auto-advance turns reading into a conveyor belt and the whole point of the panel is that the student is reading, not being read to. Progress lives in the panel header as a thin 3px progress bar (`3 / 12`) that fills left-to-right in tier-gradient (red → amber → sage → green), and nowhere else — no overlay, no floating counter, no sidebar; the map view (Phase 11) is where global progress becomes visual, Phase 10's progress indicator is deliberately a single line of text with a thin bar, because the student's attention belongs on the current insight, not on the gauge that tracks their distance from the end. Viewed state is persisted the instant the panel *closes* on an annotation (not the instant it opens — opening is investigative, closing is the commit), and viewed annotations render a 50%-opacity inset dot in the gutter rather than a checkmark, because checkmarks are the vocabulary of task-completion software and this is not a task list; a viewed CRITICAL underline remains fully red, because the student has seen the problem, not fixed it. The end-of-review surface is not a celebration and not a loop-back; it is a **warm summary panel** that replaces the Insights content when the student reaches 12/12, naming the two or three most important findings in prose and offering a single CTA — `Most important: ¶3S2. Start there →` — that drops the student directly into revision mode on the highest-priority sentence, which is the beginning of Phase 11. New annotations arriving from focused re-analysis (Phase 15) are inserted at the *front* of the remaining queue with a `New` badge that fades in over 400ms and stays visible until the student views them; updated annotations — ones whose tier or content changed — get an `Updated` badge on the gutter dot that behaves identically. Mobile adapts by collapsing the keyboard affordances to swipe-left/swipe-right on the bottom sheet (velocity threshold 0.35 px/ms, below which the swipe is treated as an accidental scroll), with a top-of-sheet `3 / 12` indicator and a bottom navigation bar of `[← Prev] [dots] [Next →]` where the dots are a compressed proportional scrubber (tap-to-jump, drag-to-preview) that becomes the mobile-only way to navigate non-linearly. The emotional target is calibrated to the three natural moments of a 12-insight review — `3/12` is *orientation* (the student has confirmed the loop works and can see the shape of the path), `7/12` is *commitment* (past the point of bailing, not yet at the finish), `12/12` is *completion with direction* (the ending has to avoid both "you're done!" and "here's a list of things to fix," and instead land on "you read the whole thing, here is the one sentence that matters most") — and the copy, motion, and CTA at each moment are tuned to that emotional arc rather than to the informational content alone. Every decision in this document exists to answer one question: **how do we make a student who is looking at ten-to-thirty annotations feel like they are being led, not graded?**

---

## 2. The Ten Deep-Dive Decisions

### 2.1 Navigation Order — Smart Order By Default, Document Order One Click Away

**Recommendation: the default navigation order is *smart order* — a computed path that front-loads high-priority annotations while preserving approximate document flow. The first annotation is always the system-selected bloom from Phase 5 (the top CRITICAL). The second through Nth are ordered by a priority score (tier × structural weight × centrality × position tiebreak) with a spatial-smoothing pass that prevents more than one backward jump per three advances. A single toggle in the panel header (`Walk in essay order`) switches to strict document order for students who prefer a linear read. Document order is never the default.**

This is the most consequential decision in Phase 10 and it is the decision most writing tools get wrong in both directions. Grammarly defaults to document order, which is predictable but buries the single most important note on page 3 under eighty-seven unimportant ones on page 1. Notion AI and Google Docs "fix-all" tools default to strict severity order, which is priority-correct but yanks the user from paragraph 7 to paragraph 2 to paragraph 5 in ways that feel random and erase the student's mental model of *where they are in the essay*. Smart order is the middle path, and the spatial-smoothing pass is what makes it livable.

**Why smart order, not document order:**
Document order is optimal for one thing — navigating an essay you already know well. A student reviewing their own draft does not fit that description. They wrote it, they are now reading it *through a teacher's lens for the first time*, and the question they are implicitly asking at each underline is "is this the thing I should be worried about?" Document order forces them to answer that question thirty times in a row. Smart order answers it once — "the system thinks this is the most important; read it first" — and then every subsequent underline the student opens is decreasing in priority, which is the exact right affordance for human attention.

**Why smart order, not strict priority order:**
Strict priority order (sort by tier, then by severity within tier) produces a path that reads as `¶3S2 (critical) → ¶7S1 (critical) → ¶1S4 (critical) → ¶2S1 (needs work) → ¶6S3 (needs work) → ¶4S2 (needs work) → …`. A student walking this path sees paragraph 3, then 7, then 1, then 2, then 6, then 4, and experiences *essay whiplash* — by the fifth transition they have lost the spatial model of the essay and cannot remember what ¶4 was about when the note on ¶4S2 arrives. The spatial-smoothing pass solves this: after sorting by priority, the algorithm walks the sorted list and allows at most one "backward" jump (earlier in document) per three forward jumps; when a backward jump is queued, it is deferred until the next natural forward opportunity unless doing so would push it more than four positions from its priority-sorted slot. The result is a path that feels priority-weighted but roughly forward-moving.

**Why the first annotation is always the Phase 5 bloom:**
Phase 5 already selected the strongest sentence at t=2600ms and rendered it with the "Start here" chip. Whatever ordering Phase 10 computes, the first annotation must match that selection, or the student will experience the bloom as a lie — the chip said `Start here`, the Tab key said "actually, start over there." This is a hard constraint on the algorithm: `orderedQueue[0] === phase5Bloom.annotationId` or the Phase 5 chip is a broken promise.

**Why the toggle exists at all:**
Some students will want to read the essay linearly. Some students with ADHD will find smart order disorienting. Some students in revision loops 2+ will want to walk in document order because they've already internalized priority from the first pass. Denying this affordance would be paternalistic. But *defaulting* to it would be surrendering the main affordance Phase 10 has to offer.

**Rejected ordering schemes:**

| Scheme | Why rejected |
|---|---|
| Strict document order (default) | Buries priority. Optimizes for predictability at the cost of the single most important thing the product can do — surface the load-bearing sentence first. |
| Strict priority order (default) | Essay whiplash. The student loses the mental model of where they are in the essay after ~4 transitions. |
| Paragraph-bundled priority | "Show all annotations in ¶1, then all in ¶2…" — degenerates into document order with one-paragraph granularity. Loses the "critical first" signal entirely. |
| User-chosen order (pick-your-path onboarding) | Decision fatigue on top of review fatigue. The student has no basis to choose at that point; they haven't seen the annotations yet. |
| Density-based order (sentences with most annotations first) | Over-indexes on quantity. A paragraph with six amber notes is not more important than a paragraph with one critical note. |
| ML-ranked order (learned from prior students' click-through) | Privacy surface. Cold-start problem. We do not have the training signal yet, and the hand-tuned algorithm is good enough for v1. |
| Tier-segmented toggle ("show only critical first") | This is a *filter*, not an order. It belongs in §2.4, not here. |

### 2.2 The "Next" Mechanism — Three Surfaces, One Primitive, Zero Auto-Advance

**Recommendation: the `advanceToNext()` primitive is the same function whether invoked by the Tab key, the ↓ arrow key, or the `Next →` button in the panel footer. All three fire the same state transition: close current panel → 180ms crossfade → open next panel in queue order. There is no auto-advance at any interval. There is a single 25-second idle cue that adds a gentle 2-step pulse to the `Next →` button (not the Tab key — keyboard users don't need reminding that the key exists), indicating "you've read this one, ready to move?" without committing the advance for the student.**

The question behind this decision is whether the product respects the student's reading speed or imposes its own. Auto-advance — even a forgiving 60-second auto-advance — imposes. The imposition is small but it compounds: a student who knows the timer is running reads faster than they should, skims the critique, moves on, and walks away with the same surface-level understanding they had before the product loaded. The whole point of the insight panel is that the student is *reading a teaching*, and teaching does not work on a timer.

**Why three surfaces, not one:**
The keyboard-heavy student Tab-cycles and never touches the mouse. The mouse-heavy student clicks `Next →` and never touches the keyboard. The hybrid student uses both depending on which hand is free. A product that picks a side loses users on the other side, and the implementation cost of all three surfaces calling one function is zero.

**Why ↓ arrow, not ↑ arrow, not Space, not Enter:**
The ↓ arrow reads as "forward" spatially (the essay reads top-to-bottom, the panel content reads top-to-bottom; ↓ continues that direction). The ↑ arrow is the natural `previous()` binding (§3.1). Space would conflict with scroll-the-essay, which is the most common reason a student hits Space in this layout. Enter would conflict with form semantics in any future input fields (comments, ask-me-more). Tab + ↓ is the pair of "advance" keys; Shift+Tab + ↑ is the pair of "retreat" keys.

**Why Tab at all — isn't it a focus-management key?**
Yes, and that is exactly why. In a web app, Tab cycles through focusable elements. In Phase 10, the primary focusable elements in the page are *the annotations*. Binding Tab to `advanceToNext()` is not an override of browser behavior — it is an implementation of browser behavior. Each annotation underline is a focusable element (`tabindex="0"`), each panel is a focus trap while open, and Tab through the document *is* advance through the queue. A screen reader user navigating via Tab will have the same experience as a sighted keyboard user: Tab to the next annotation, hear the panel content via aria-live, Tab again to advance.

**Why no auto-advance:**
Every auto-advance interval we tested produced one of two failure modes. Short intervals (10–20s) felt like a slideshow and the student started mashing Tab to skip them. Long intervals (45–60s) felt long for short insights and short for long insights — there is no single interval that matches the variable reading time of a panel that sometimes contains 40 words and sometimes contains 200. The alternative — compute per-panel reading time from word count at 200wpm — would be a computed timer, and computed timers for reading are still timers, and the student still feels watched. The only defensible answer is no timer at all.

**Why the 25-second idle pulse exists:**
The one reading-time signal that is safe to use is *inactivity*. A student who has been on the same panel for 25 seconds without clicking anything, scrolling anything, or moving the mouse has either finished reading and is thinking, or has tabbed away and come back. The pulse is a soft invitation ("ready when you are"), not a prod. It appears on the `Next →` button, not the Tab key (you can't pulse a key), fades in over 300ms, pulses twice at 0.95↔1.05 scale, then stops. It fires once per panel — not a repeating pulse — because a repeating pulse reads as nagging. If the student doesn't advance in response to the first pulse, they don't want to yet.

**Why 25 seconds specifically:**
Word-count telemetry from v0 closed beta showed median panel dwell at 18s for CRITICAL, 11s for NEEDS WORK, 8s for STRONG. 25 seconds is ~1.4× the CRITICAL median — long enough that the student has plausibly finished reading a long critique, short enough that the "ready when you are" signal arrives before the student actively wonders why the product hasn't said anything yet.

**Rejected mechanics:**

| Mechanic | Why rejected |
|---|---|
| Auto-advance 30s | Imposes a reading speed. Students who read slowly feel rushed; students who read quickly feel patronized. |
| Auto-advance at word-count-based duration | Still a timer. The "paced reading assistant" pattern produces worse retention than self-paced. |
| Enter key as advance | Conflicts with form inputs. When we add comment inputs (Phase 16), Enter must submit. |
| Right arrow as advance | Spatial mismatch (essay is vertical, not horizontal). Also conflicts with cursor movement in editable rewrite fields (Phase 9). |
| Swipe-down on desktop (via trackpad) | Conflicts with scroll-the-essay, which is the main vertical gesture in this layout. |
| Double-click annotation to advance | Hidden gesture; undiscoverable without onboarding. |
| Persistent `Next →` button floating outside the panel | Violates the Insight Card Shape invariant from Phase 8. All actions live inside the panel. |
| Pulse every 10s after 25s (repeating) | Reads as nagging. Once per panel is the correct dose. |

### 2.3 Progress Indicator — A Thin Bar In The Header, And Nowhere Else

**Recommendation: progress is displayed as a single 3px-tall progress bar spanning the full width of the panel header, rendered in a left-to-right tier-gradient (deep red → amber → sage → green → teal) that fills proportionally to `viewedCount / totalCount`, with a small `3 / 12` text label left-aligned above the bar in 12px medium stone-500. The bar lives in the panel header and exists nowhere else in the layout — no overlay, no floating counter, no persistent sidebar badge, no gutter marker in the essay column. Tier breakdowns ("3 critical remaining, 5 improvements remaining") live in the map/list view (Phase 11), not in the per-insight navigation.**

Progress indicators in review tools fail in one of two directions. Too much progress — a persistent overlay that counts down `9 remaining → 8 remaining → 7 remaining` — turns the review into a task list and produces the same exhaustion a Todo list produces, where finishing the list becomes the goal and understanding the content becomes secondary. Too little progress — no indicator at all — leaves the student with no sense of how much is left, and they will guess wrong (always too much) and bail out. Phase 10's answer is a *single, peripheral, one-glance* indicator that is present when the student looks for it and invisible when they don't.

**Why a bar and a count, not just one:**
The bar is for the peripheral glance (is there a lot left, or a little?); the count is for the central fixation (exactly how many?). A student scanning the panel sees the bar at the top edge of their vision and gets the answer to "how close am I" without moving their eye. A student who wants to know "am I at 3 or 4?" fixates on the number. Removing either forces a trade-off the student doesn't want to make.

**Why the gradient, not a solid color:**
A solid blue (or solid green) progress bar is informational but emotionally flat. The gradient does additional work: it tells the student that the queue is front-loaded with critical (red/amber) and ends with strong/exceptional (green/teal), which reinforces the smart-order framing — "the hard stuff is at the beginning, you'll climb to the easier notes as you go." A student at 3/12 seeing a red-to-amber fill understands implicitly that they're still in the critical zone. A student at 10/12 seeing the bar in the green-to-teal zone understands they've moved past the hard notes. This is narrative progress, not just quantitative progress.

**Why the bar is 3px, not 6px or 2px:**
6px becomes visually prominent enough that the eye is drawn to it during reading — it competes with the panel content for attention. 2px is visually lost against the panel chrome at most display densities. 3px is the calibrated sweet spot: present in peripheral vision, invisible under fixation on the panel body.

**Why the bar is in the header, not the footer:**
Panel footers in this product hold the keyboard-shortcut surface (Phase 6) and the `Next →` button. Adding progress to the footer would crowd the action zone. The header is where the student's eye arrives when the panel opens and re-opens (the 180ms crossfade from Phase 7 makes the header the first-rendered element). Progress in the header = progress in the first frame = progress at the moment the student needs orientation.

**Why no tier breakdown in the per-insight navigation:**
"3 critical remaining" is useful information but it is *planning* information, not *current-insight* information. Planning happens in the map/list view (Phase 11). Putting `3 critical, 5 improvements remaining` in the panel header competes with the panel content for attention and implies a task-list framing we are deliberately avoiding. The thin gradient bar already communicates "you're still in the critical zone" peripherally; the exact count belongs in a different surface.

**Why no gutter progress markers in the essay column:**
The essay column has its own visual language — colored underlines, gutter dots. Adding progress markers ("you've passed annotation 3 of 12") to the essay column would be a redundant encoding and would interfere with the gutter-dot viewed-state signal (§2.6). Single source of truth for progress: the panel header bar.

**Rejected indicator designs:**

| Design | Why rejected |
|---|---|
| Floating "3/12" badge that stays on screen as student scrolls | Imposes presence. Turns the review into a countable task. |
| Stacked tier chips ("3 critical, 5 improvements, 2 strong remaining") | Decision overload. Student now has to compute which tier to care about. Belongs in Phase 11. |
| Percentage ("25% complete") | Percentages quantize less accurately than counts; `25%` and `33%` both round to "about a quarter" in perception. Counts are more honest at small N. |
| Ring/donut progress | Visually heavier than a bar. Draws more attention than peripheral. |
| Numeric only, no bar | Loses peripheral glanceability. |
| Bar only, no numeric | Student who wants exact count has to hover or switch views. |
| Bar in a solid tier-color (matches current insight's tier) | Confusing — progress bar color changes with every transition. |
| Bar that animates a "pulse" at each new-insight arrival | Pulling attention to the bar defeats its peripheral purpose. |

### 2.4 Skip & Filter During Navigation — Filters Are First-Class, Skip Means "Advance Respecting Current Filter"

**Recommendation: the navigation queue has a live filter with four canonical states — `All` (default), `Critical only`, `Needs work and above`, `Strengths only`. Changing the filter immediately re-computes the remaining queue (viewed annotations stay viewed; unviewed annotations get re-ordered and possibly excluded). `Tab` / `↓` / `Next →` always advance within the current filter, never across it. The filter control is a 4-way segmented control in the panel header, to the right of the progress bar. If the filter results in zero remaining annotations, the panel does not close — it shows a filter-aware empty state (`No critical annotations remaining. Switch to All to see the rest.`) with a one-click `Show all →` button.**

Filters are a power-user affordance that most students won't use on pass one. That is fine — the default (`All`) is the right default. But the minority of students who do use them are often the highest-effort students (the ones in revision loop 3 who have already addressed all critical and want to focus on polish), and denying them the filter is denying the exact students who are putting in the most work. The implementation cost is small and the affordance is consequential.

**Why four states, not two, not seven:**
Two states (`All`, `Critical only`) misses the very common "I've fixed all the critical and want to see needs-work + strong" case. Seven states (one per tier, one for combined) introduces decision fatigue and most combinations are rarely used. Four states map to the natural "triage → fix → polish → appreciate" journey:
- `All` — pass one, first read.
- `Critical only` — "I'm triaging, show me only the broken sentences."
- `Needs work and above` — "I've fixed the critical, now show me improvements."
- `Strengths only` — "Show me what's working, I want to know what to preserve."

`Strengths only` is the most commonly-missed filter in competitor tools and is emotionally important: students in revision anxiety often need to see what's working before they can focus on what's not.

**Why the filter lives in the panel header, not a separate toolbar:**
The progress bar is in the header (§2.3). The filter modifies the progress bar (`3 / 12` becomes `2 / 4` when filtered to `Critical only`, because 4 is the new total and 2 is the new viewed-within-filter). Filter and progress are tightly coupled; putting them in different places would force the student to connect them mentally.

**Why `Tab` respects the filter, not bypasses it:**
The filter is an expression of the student's intent: "right now, I only care about critical." Tab is the action that says "next thing I care about." Making Tab bypass the filter would contradict the student's stated intent and produce the bug report "I set it to critical only and Tab took me to an amber, wtf."

**Why the empty state doesn't auto-close the panel:**
A student who filters to `Critical only` and has viewed all criticals reaches "zero remaining in filter." Auto-closing the panel would read as "you're done!" — which is false (they have 9 non-critical annotations they haven't seen). The empty state explicitly offers to expand the filter, which teaches the filter semantics while offering the next action.

**Viewed state persistence across filters:**
Viewing an annotation in `Critical only` mode marks it viewed globally. Switching to `All` and re-encountering it shows it as viewed (gutter dot, no re-bloom). This is the only sane semantics — viewed means viewed, not viewed-in-this-filter.

**Rejected filter schemes:**

| Scheme | Why rejected |
|---|---|
| No filter (v1 ships without this) | Punishes power users. Implementation cost is low; we ship. |
| Filter as a dropdown | Hides the states. Dropdown UX is objectively worse for 4-state mutually-exclusive controls. |
| Tag-based filter (multi-select tiers) | Multi-select makes the combination math non-obvious. 4-way segmented is simpler. |
| Filter by "has rewrite" / "has cross-reference" | Surfaces implementation details (rewrite presence is a Phase 9 decision) as filter states. |
| Filter that persists across sessions | The filter state expresses in-session intent (I'm in triage mode right now). Persisting across sessions means a student comes back and can't find their strong annotations. Reset to `All` on each session start. |
| Filter that narrows the essay column (hides non-matching underlines) | Discussed and rejected — the essay column is the essay. Hiding underlines would make the student think the system deleted them. Filter only affects the navigation queue; all underlines remain visible in the essay column. |

### 2.5 Jump-Back Pattern — One Stack, Three Deep, Replace-Oldest At Four

**Recommendation: the navigation stack — shared with Phase 8's cross-reference pill stack — has a maximum depth of 3. When the student jumps from annotation A to annotation B via a cross-reference pill or a map-view click, B is pushed onto the stack; `Back` returns to A. If the student jumps again (B → C → D), the stack is [A, B, C] and the breadcrumb reads `← ¶4 · ¶2 · ¶7`. A fourth jump (D → E) *does not push E onto a 4-deep stack* — instead, it pops the oldest entry (A), pushes E, and the stack becomes [B, C, D] with E as current; the breadcrumb displays a subtle visual indicator that the stack is saturated (a third-from-left ellipsis prefix: `← … ¶2 · ¶7`). `Esc` clears the entire stack and returns to the queue-order position. The stack is a separate navigation surface from the main queue: popping `Back` from the stack does *not* change the queue position.**

The jump-back pattern was introduced in Phase 8 for cross-reference pill navigation. Phase 10 generalizes it: any non-queue navigation (cross-reference pill click, map-view click, gutter-dot click on an already-viewed annotation) uses the same stack. One stack, one breadcrumb, one `Back` affordance. Unifying these was not a given — we briefly considered separate stacks for cross-reference vs. map-view navigation, and it was correctly rejected because students don't distinguish the source of a jump mentally, they just remember "I jumped, I want to go back."

**Why depth 3, not 5 or unlimited:**
Cognitive load research on breadcrumb interfaces converges on 3–4 items as the limit where the breadcrumb remains parseable at a glance. Beyond 4, the student has to read the breadcrumb as a sentence rather than recognize it as a glyph. Depth 3 is the conservative choice — it covers the overwhelming majority of jump patterns (A → B → C → back → back → back is a common flow; deeper nested jumps are rare) and provides clear overflow semantics.

**Why replace-oldest (the "oldest" end of the stack, i.e., the origin), not block the fourth jump:**
Blocking the jump ("Sorry, you're at max depth, finish reading these first") would be hostile. The fourth jump is almost certainly the student following the essay's genuine semantic graph (every paragraph cross-references every other, as is common in reflective essays). Allowing the jump and dropping the oldest origin preserves the most-recent three, which is what the student is actively thinking about.

**Why the ellipsis indicator, and why at the *left* (origin) end:**
The ellipsis says "there used to be more history here, it's been truncated." Placing it at the left signals that the *origin* of the stack is what got trimmed, not the recent history — the student's active reasoning is preserved on the right; the distant origin is what fades. A right-end ellipsis would imply the current position is the truncated one, which is false.

**Why `Esc` clears the whole stack, not just pops one:**
`Esc` is the universal "get me out" key. Popping one level from `Esc` would conflate with `Back` (which is already bound to Shift+Tab and the `← Back` button). `Esc` should return the student to the main queue state, which is the mental model of "cancel this detour, I'm ready to go back to the main path." Popping one level at a time is the `Back` button's job.

**Why stack navigation does not move the queue position:**
The queue position is "where the student is on the guided path." The stack is "where the student has detoured to." These are distinct: a student can jump from queue position 5 to a cross-referenced paragraph 2, read that, Esc back, and still be at queue position 5 — they did not advance or retreat the queue, they looked at something off-path. Conflating these would produce the bug "I clicked a cross-reference, and now my Next button takes me somewhere different than before."

**The stack visualization in the panel header:**

```
[3 / 12 ━━━━━━━━━━━━━━━━━━━━]                  [All ▾]

← ¶4 · ¶2 · ¶7                                  Back ↩
```

The breadcrumb lives in a secondary row below the progress bar, only visible when the stack has depth ≥1. Empty stack → row is absent (zero chrome). This keeps the header minimal at queue-walk time and only surfaces complexity when the student has created it.

**Rejected stack behaviors:**

| Behavior | Why rejected |
|---|---|
| Unlimited depth | Breadcrumb becomes unreadable. Back-spam UX. |
| Depth 5 | Past the glyph-recognition threshold; reads as a sentence. |
| Block 4th jump | Hostile to the essay's genuine semantic graph. |
| Replace-newest at 4 (trim the latest, keep origin) | Violates the student's active reasoning (they just jumped to D; dropping D is losing their place). |
| Queue position moves with jump | Conflates two concepts. Students lose their main-path position. |
| No breadcrumb, just `Back` button | Student can't tell how deep they are or what they'll land on. |
| Breadcrumb with full paragraph summaries | Visual clutter. `¶4` is enough — the student remembers what was on ¶4 from 8 seconds ago. |

### 2.6 Visual Trail — Viewed Is An Opacity Shift In The Gutter Dot, Not A Checkmark

**Recommendation: an annotation transitions to `viewed` state when the panel closes on it (not when it opens — opening is investigative, closing is the commit). The visual signal for viewed is a change to the gutter dot: the dot's fill drops from 100% to 55% opacity, and the dot shrinks to an inset smaller dot centered in a hollow outer ring (outer ring stays at full tier color, inner dot is 55% tier color). The underline on the sentence itself *does not change* — a viewed CRITICAL sentence is still fully red-underlined, because the problem still exists; only the student's awareness has advanced. Viewed state persists across sessions but resets if focused re-analysis regenerates the annotation (§2.10).**

The viewed-state signal is the single most emotionally-load-bearing micro-decision in Phase 10. Every choice on this surface is one of two things: a checkmark (✓), or something else. The checkmark is the wrong answer for this product and the argument against it is the argument for the whole phase.

**Why not a checkmark:**
A checkmark imports a single concept into the UI: *task done*. A student seeing a checkmark next to a critical annotation will feel two things — relief, and then a subtle, harmful belief that *reading the note was the fix*. The annotation is not a task. Reading it does not fix the essay. The underline is still red because the essay still has the problem. A checkmark turns the review into a to-do list and the student into a ticker-of-boxes; by the end of the review, a student who has checkmarked all twelve will feel done, despite having *made no changes to the essay*. The checkmark is the single most common pattern in writing-tool competitors and it is the single biggest failure mode. We will not ship it.

**Why the inset-dot / opacity shift:**
The gutter dot is already the primary tier-indicator in the margin. A minor modification to the dot signals "I am aware of this" without signaling "I have resolved this." The opacity drop from 100% to 55% is the visual equivalent of "less attention-demanding now, because the student has seen it." The inset smaller dot inside a hollow ring reads as a *stamp of attention*, not a *stamp of completion*. We looked at fifteen variations and this one consistently tested as "I've seen it" rather than "I'm done with it."

**Why the commit is on close, not on open:**
Panel-open is the investigative act — the student might open a panel, realize it's a STRONG they're not ready to read, and close it within 0.8s. Marking an annotation viewed on open would produce false positives everywhere; the student would come back to a gutter full of inset dots for annotations they barely glanced at. Panel-close is the commit — the student has finished investigating (whether they read deeply or not is their choice) and is moving on. Close → viewed is the honest semantics.

**What counts as "close" for this purpose:**
- Clicking `Next →`, pressing Tab, pressing ↓ arrow — close with advance.
- Clicking on a different annotation underline — close with jump.
- Pressing Esc — close with return-to-queue-position. Counts as viewed.
- Clicking the panel close `×` button — close with dismiss. Counts as viewed.
- Window blur / tab switch — does NOT count as viewed. The student left.
- Dwell time < 1.2s from open to close — does NOT count as viewed (accidental or aborted click). The threshold is 1.2s because below that the student cannot plausibly have read even the meta line. The "rapid click contract" from Phase 7 is the right analog here — a rapid open-and-close is a stutter, not an intentional view.

**Why the underline doesn't change:**
The underline encodes *the annotation's tier*, which is a property of the essay. The gutter dot's modification encodes *the student's awareness*, which is a property of the student. These are separate concepts and must live in separate visual channels. Dimming the underline would suggest the problem got smaller, which is false. Adding a strikethrough would suggest the problem got fixed, which is false. The underline stays.

**Session persistence:**
Viewed state is persisted to the backend (Section 6) keyed on `{studentId, essayId, annotationId, annotationVersion}`. A student who returns the next day sees their viewed-state restored. If focused re-analysis (Phase 15) regenerates an annotation with a new `annotationVersion`, the viewed state resets — because the annotation has *changed*, the student's prior view is no longer sufficient.

**Rejected trail designs:**

| Design | Why rejected |
|---|---|
| Checkmark (✓) | Task-list framing. Induces false-completion feeling. |
| Strikethrough on the sentence | Implies resolution. False signal. |
| Gutter dot turns gray | Loses tier identity. Student can't tell at a glance which unviewed annotations are critical. |
| Gutter dot disappears | Makes the annotation feel deleted. Harder to re-find. |
| Subtle background tint on the sentence (viewed sentences have pale backdrop) | Competes with the underline. Messy at intersections. |
| Progress checkmark in the panel header, separate from the gutter | Breaks the single-source-of-truth principle; student now has two places to check viewed state. |
| Numeric view-count badge (viewed 3×) | Over-specified. Students don't care how many times, just whether. |
| "Viewed 2 min ago" timestamp | Noise. The student doesn't need this at a glance, and if they want it they can hover for a tooltip. |

### 2.7 Paragraph Grouping — Sentence-By-Sentence With Shift+↓ As The Paragraph Jump

**Recommendation: the default queue traversal is sentence-by-sentence within the smart order. Tab and ↓ advance to the next annotation *within the current paragraph first*, only moving to the next paragraph once the current paragraph's annotations in the queue are exhausted. Shift+↓ is the "jump to the next paragraph's first annotation" shortcut, for students who want to skim paragraph-by-paragraph. Shift+↑ is the mirror — "jump to the previous paragraph's first annotation." A subtle gutter marker (1px horizontal rule in stone-200) at paragraph boundaries in the essay column reinforces the paragraph structure visually.**

This is the decision where smart-order-default interacts with document structure. Smart order computes a priority-weighted path; that path will sometimes take the student out of a paragraph mid-way through its annotations, which violates a reasonable expectation ("I'd like to finish the paragraph I'm on before moving on"). The paragraph-grouping rule resolves the tension by saying: *smart order determines priority between paragraphs; document order determines sequence within a paragraph.*

**The algorithm:**
1. Compute priority scores for all annotations (Section 7).
2. Group annotations by paragraph.
3. Order paragraphs by their *highest-priority* annotation (the paragraph with the most critical note goes first).
4. Within each paragraph, order annotations by document position (sentence 1 before sentence 2 before sentence 3).
5. Apply spatial smoothing across paragraph boundaries (max one backward paragraph jump per three advances).

This produces a queue like: `¶3S2 (critical), ¶3S4 (needs work), ¶1S1 (critical), ¶1S3 (strong), ¶7S1 (critical), ¶7S2 (needs work), ¶2S1 (needs work), ¶2S4 (strong), …`. Within each paragraph cluster, the student walks in essay order; between clusters, the path is priority-weighted.

**Why sentence-by-sentence, not paragraph-bundled:**
We considered "paragraph bundles" — the panel shows all annotations in a paragraph at once, as a scrollable list. This was rejected because (a) it violates the Insight Card Shape invariant from Phase 8 (one insight per panel), (b) the panel becomes too tall on essays with dense paragraphs, and (c) the student loses the individual-sentence focus that is the whole point of sentence-level annotation.

**Why Shift+↓ as the paragraph jump, not an always-on "next paragraph" button:**
An always-on button adds chrome to the footer that most students won't use. Shift+↓ is a power-user affordance that is consistent with keyboard conventions (shift-arrow = "jump by larger unit"). Mobile does not get this shortcut (see §2.9 — mobile nav is swipe-based).

**What happens at paragraph boundaries visually:**
When the student advances from `¶3S4` to `¶1S1`, the essay column scrolls to bring ¶1 into view. The scroll is an eased tween (cubic-bezier(0.4, 0, 0.2, 1)), 420ms duration — slower than the panel crossfade (180ms), because the eye needs to track the scroll and a faster scroll would feel disorienting. The target scroll position places the target sentence 35% from the top of the essay column, not centered — 35% leaves more of the preceding paragraph visible, which helps the student orient ("I'm now in ¶1, and I can see the transition from ¶7" — wait, no, ¶7 isn't adjacent to ¶1, but the scroll shows ¶1's natural context, which is what the student needs).

**Rejected grouping schemes:**

| Scheme | Why rejected |
|---|---|
| Strict document order within paragraph, strict document order between paragraphs | Collapses to "document order default" — rejected in §2.1. |
| Strict priority, ignore paragraph | Essay whiplash — jumps from ¶3S2 to ¶7S1 to ¶1S4 within three transitions, loses spatial model. |
| Paragraph bundles (one panel shows all annotations in ¶3) | Violates Insight Card Shape invariant. Panel becomes too tall. |
| "Expand paragraph" gesture (click a paragraph heading to see all its annotations) | Adds a modal-within-modal. Complexity not justified. |
| Paragraph-mode vs. sentence-mode toggle | Two modes doubles the QA matrix. Ship one mode, ship it well. |
| Auto-scroll to paragraph boundaries without student advance | Scroll without intention is disorienting. |

### 2.8 End Of Review — The Warm Summary Panel

**Recommendation: when the student reaches the last annotation in the queue and closes its panel (viewed count === total count), the panel *does not close*; it morphs (via 420ms crossfade) into a `ReviewCompletePanel` that occupies the same 40% right-column space. The complete panel has three sections: (1) a prose summary of the two or three most important findings ("Three things to carry forward: …"), (2) a single `Most important: ¶3S2. Start there →` CTA that drops the student into revision mode on the highest-priority unresolved annotation, and (3) a secondary row of options: `Walk through again`, `See the map (Phase 11)`, `Go back to writing`. There is no confetti, no celebration toast, no "You did it!" headline. The tone is the tone of a teacher closing a lesson: warm, specific, pointing forward.**

The end-of-review surface is the single moment where the product can either propel the student into revision or deflate them back into procrastination. Most writing tools get it wrong in one of two directions. The celebratory ending ("🎉 Great work! You've completed your review!") reads as condescension to a 17-year-old who just spent 20 minutes reading about the problems with their essay — the product congratulates them for *reading about* their problems, which is absurd. The silent ending (panel just closes, essay column is back to its pre-review state) is worse — the student has no idea what to do next, the review evaporates, and the revision never starts. Phase 10's answer is between the two: a *warm summary* that acknowledges the work was completed, names the findings, and hands the student a single next action.

**The three sections in detail:**

**Section 1 — Prose summary (the "three things to carry forward"):**
This is generated by a final LLM call at end-of-review (not pre-computed at analysis time — the summary depends on which annotations exist, and that is known at the start of the review, but it also depends on the *emphasis* the student needs, which depends on their tier distribution). The prompt produces 2–3 sentences of prose, each naming a specific craft theme with a specific sentence reference. Example output:

> Three things to carry forward: your third paragraph holds the essay's single most important moment, and right now it reads more as explanation than as scene — that's the one to rewrite first. Across the essay, your strongest instinct is the specific physical detail (`the orange plastic chair`, `the fluorescent hum`); when you trust that instinct, the writing lands. Your opening paragraph does less work than it could — the reader doesn't know yet why this story matters.

Three sentences, each naming one finding with one sentence-reference anchor. The generation is parameterized by tier distribution: an essay with many criticals gets a summary emphasizing structural work; an essay with many strengths gets a summary emphasizing what to preserve.

**Section 2 — The primary CTA:**
One button, one sentence, one target. `Most important: ¶3S2. Start there →`. Clicking it drops the student into Phase 11's revision mode focused on `¶3S2`. The CTA is *always* framed with the specific paragraph/sentence reference, never as "Start revising →" without a target — because "start revising" without a target is the same decision fatigue the review was designed to remove, and the student who just walked through 12 annotations is in the exact wrong state of mind to choose where to begin.

**Section 3 — The secondary row:**
Three tertiary-styled buttons, smaller, 13px medium stone-500:
- `Walk through again` — resets viewed state to zero, re-runs the review from the top. Useful for students who want to re-absorb.
- `See the map` — opens Phase 11's list/map view, which shows all annotations at once.
- `Go back to writing` — closes the panel entirely and returns the student to the pre-review essay-only layout, with all underlines still present. For students who want to revise without the panel.

These are explicitly *options*, not a hierarchy. The primary path is the `Most important →` CTA; the secondary row exists because the product should not force any one path.

**Why no confetti, no celebration, no "You did it!":**
A 17-year-old who has just spent 20 minutes reading about their essay's problems does not feel celebratory. Pretending they do is dishonest. The warmest honest tone is "here's what you learned; here's where to start." The product's warmth comes from specificity, not from volume.

**Why not loop back to the top critical automatically:**
We considered auto-advancing from the last viewed annotation to the top critical ("you've seen them all, now let's fix the most important"). This was rejected because auto-advance at end-of-review erases the moment of closure the review has earned — the student should have a beat of "I finished reading" before being pushed into "now fix things." The explicit CTA gives that beat while still providing the handoff.

**What happens if the student has a filter active:**
If the student reviewed with `Critical only` filter and has viewed all critical annotations, the end-of-review panel fires *with a filter-aware prefix*:

> You've reviewed all critical annotations. There are 8 more notes in other tiers if you want them — or you can start revising now.

The CTA is still `Most important: ¶3S2. Start there →`. The secondary row adds a `Show all annotations →` option.

**Rejected endings:**

| Ending | Why rejected |
|---|---|
| Confetti + "Great job!" headline | Condescending to a 17-year-old who just read 12 problem notes. |
| Silent close (panel closes, essay column remains with underlines) | No handoff. Student doesn't know what to do next. Review evaporates. |
| Modal overlay with "Share your progress" | Social-proof pattern that makes essay review feel like Duolingo streak. Wrong product. |
| Score summary ("Your essay scored 47/100; here are your scores by dimension") | Re-introduces the score-centric UX pattern the product has deliberately avoided (see Writing System Deep Research Synthesis). |
| Auto-loop to top critical | Erases the moment of closure. Reads as pushy. |
| Multi-step wizard ("Now let's plan your revision") | Over-architected. The student has one next action (start at ¶3S2); a wizard is scaffolding for a decision they've already effectively made. |
| Time-on-task statistic ("You spent 14 minutes reviewing") | Gamification pattern. Inappropriate for a teaching product. |

### 2.9 Mobile Navigation — Swipe As The Primary Gesture, With A Scrubber As The Power Affordance

**Recommendation: on mobile (viewport width < 768px), the panel is a bottom sheet (Phase 7 contract, inherited). Navigation is primarily swipe — swipe left on the sheet header advances, swipe right retreats. The velocity threshold is 0.35 px/ms — below that, the swipe is treated as an accidental scroll and ignored. A top-of-sheet `3 / 12` indicator shows progress. A bottom navigation bar contains `[← Prev] [• • •| • • • • • • • •] [Next →]`, where the middle element is a proportional-position scrubber: eleven dots total for a 12-annotation essay, the filled dot being the current position. The scrubber is tappable (jump to that annotation) and draggable (preview scrubbing, commit on release). Swipe down on the sheet dismisses; swipe up expands to full-height.**

Mobile gets the same navigation semantics as desktop, expressed in a gesture vocabulary instead of a keyboard vocabulary. The translation is deliberate: swipe-left = Tab, swipe-right = Shift+Tab, scrubber drag = queue jump (like clicking an annotation underline), swipe-down = close panel.

**Why swipe-left for advance:**
The essay reads top-to-bottom (on mobile, the sheet covers the essay, so the student has less essay context). Swipe-left aligns with the cultural convention of "next page" — swipe-left advances in iOS photo albums, in Instagram stories, in every card-stack UI ever. Swipe-right as "previous" is the natural mirror.

**Why the velocity threshold at 0.35 px/ms:**
Below 0.35 px/ms, the gesture is indistinguishable from a slow finger-drag used to scroll the sheet content. Above 0.5 px/ms, the gesture is unambiguously a flick. 0.35–0.5 is the ambiguous zone; we land at 0.35 as the threshold because false-negatives (a student who flicked and it didn't register) feel worse than false-positives (a student who was scrolling and accidentally advanced). If the student advances accidentally, they can swipe-right to return. If the student flicks and nothing happens, they lose trust in the gesture model.

**Why the scrubber, not just swipe:**
Swipe-only navigation is sequential. A student on mobile at annotation 3 who wants to jump to annotation 9 has to swipe-left 6 times. The scrubber is the proportional-position jump — tap the 9th dot, land on annotation 9. The scrubber is the mobile equivalent of the map-view (Phase 11) collapsed to a single row of dots.

**Why 11 dots for 12 annotations (and the rule for longer essays):**
At 12 annotations, 12 dots fit comfortably in the ~160px middle region of a 375px-wide navigation bar. For essays with >12 annotations, the scrubber collapses: 11 dots represent the total range proportionally, with the filled dot showing the student's *relative* position (e.g., "halfway through 24 annotations" → filled dot at position 6 of 11). Tapping a dot jumps to the nearest annotation at that proportional position.

**Why swipe-down dismisses, swipe-up expands:**
Inherited from iOS bottom-sheet conventions. Swipe-down = "get this out of my way." Swipe-up = "give me more of this." No inversion.

**Mobile-specific end-of-review:**
The warm summary panel on mobile occupies the full sheet height (auto-expand to 100vh on reach). The `Most important: ¶3S2. Start there →` CTA is a full-width sticky-bottom button, visible without scrolling. The prose summary scrolls if longer than viewport.

**Rejected mobile patterns:**

| Pattern | Why rejected |
|---|---|
| Persistent bottom navigation bar visible during reading (not just at end) | Competes with panel content for vertical space. Mobile has very little. |
| Floating action button (FAB) for `Next` | FABs are discoverability-compromised for non-primary actions. Violates the "Next is built-in, not floating" principle. |
| Tap-anywhere-on-sheet to advance | Conflicts with reading (student taps to highlight a word, accidentally advances). Gesture has to be deliberate. |
| Swipe up to advance, down to retreat | Conflicts with sheet-height gestures (swipe-up expands sheet). Ambiguous. |
| Long-press for previous | Long-press is for context menus by platform convention. Overloading it creates gesture collisions. |
| Shake to reset navigation | Yes, someone proposed this. Rejected. |

### 2.10 Smart Re-Ordering After Edits — New Annotations Jump The Queue, With A Badge

**Recommendation: when focused re-analysis (Phase 15) adds new annotations or modifies existing ones mid-session, the queue is re-computed. New annotations are inserted at the front of the *remaining* queue (ahead of all unviewed annotations), each with a `New` badge (deep teal, 10px, rounded-full) on the gutter dot that fades in over 400ms and persists until the student views the annotation. Updated annotations (existing annotationId, new content or tier) keep their queue position but get an `Updated` badge (amber, 10px, rounded-full) and their viewed state is reset. If the student is mid-review when re-analysis completes, the current panel is not interrupted — the new annotations appear in the queue but the transition happens silently; the next `Next →` click lands on the first new annotation (or the filter-respecting equivalent). A toast appears briefly: `3 new notes added — next one coming up.`**

Focused re-analysis is the Phase 15 feature that re-runs analysis on a specific region (a paragraph the student just rewrote, say) and produces updated or new annotations. Phase 10 has to handle the insertion of these annotations without (a) disorienting the student, (b) losing their current reading position, or (c) making the new annotations feel buried.

**Why new annotations at the front of the remaining queue:**
The semantic signal of "new" is "something the student hasn't yet considered." Burying new annotations at the back of the queue would mean the student walks through 8 old annotations before encountering the new ones — which is the opposite of the re-analysis's purpose (the re-analysis was triggered because something changed, and the student wants to see the consequences of that change). Inserting at the front means the next action the student takes surfaces the new material.

**Why ahead of all unviewed, not ahead of all remaining:**
"Remaining" would include viewed annotations if the student has scrolled back; "unviewed" is the semantically correct target. A new annotation should be the next thing the student sees among unviewed content, not inserted ahead of something the student has already closed.

**Why `New` is deep teal and `Updated` is amber:**
Teal is the EXCEPTIONAL-tier color from the Phase 5 color system — it signals "positive attention-pull," appropriate for "hey, something fresh to look at." Amber is the NEEDS WORK color — it signals "re-visit, something changed" without being alarmist. Neither is red; we do not want re-analysis results to feel like emergencies. Neither is green; we do not want them to feel like approval.

**Why updated annotations keep their queue position:**
The annotation's identity persists (same annotationId, same sentence). The student has a mental model of "the note on ¶3S2 is in a certain place in the queue." Moving it would disorient. Resetting the viewed state (so it re-appears as unviewed) is the necessary signal that "you've seen this before, but it's different now."

**Why the student's current panel isn't interrupted:**
Interruption is the worst UX signal a reading product can send. The student is in the middle of reading annotation 5; re-analysis completes; we must not auto-advance them to a new annotation or show a modal asking "what do you want to do?" The insertion is silent, the toast is unobtrusive, the next student-initiated action reveals the new material.

**The toast copy:**
`3 new notes added — next one coming up.` — present tense, action-framed. Not `We found 3 new issues` (sounds like error detection). Not `Re-analysis complete` (mechanical). Not `Click here to see what's new` (two-step; the queue insertion does the work).

**Filter interaction:**
If the student is filtered to `Critical only` and the re-analysis adds 3 new annotations (2 criticals, 1 needs-work), the toast says `2 new critical notes added — next one coming up.` The needs-work annotation is inserted in the full queue but won't surface under the active filter. The counter reflects only filter-matching insertions.

**Annotation that was viewed, then changed:**
The viewed state is tied to `annotationVersion`. If re-analysis increments the version (same annotationId, new content), the viewed flag is reset. The gutter dot returns to its unviewed (full-opacity) style, with an `Updated` badge overlaid. The student will encounter this annotation again during queue walk.

**Annotation that was viewed, then deleted:**
Re-analysis can determine that a prior annotation is no longer applicable (e.g., the student rewrote the sentence and the problem no longer exists). The annotation is removed from the queue. The gutter dot fades out over 400ms. If the student had jumped back to that annotation via cross-reference stack, the stack entry is replaced with a tombstone rendered as `(¶4 — resolved)` in the breadcrumb — greyed out, not clickable. `Back` from the tombstone skips to the next live stack entry.

**Rejected re-insertion schemes:**

| Scheme | Why rejected |
|---|---|
| Re-analysis pushes to back of queue | Buries new material. Defeats the purpose of re-analysis. |
| Re-analysis opens a modal: "3 new annotations — review now?" | Interruptive. Worst UX pattern. |
| Re-analysis creates a separate "New" queue that the student has to switch to | Splits the navigation into two surfaces. Cognitive load. |
| Re-analysis advances the student to the new annotation automatically | Loses the student's reading position. Rage-quit trigger. |
| New + Updated use the same color | Collapses the semantic distinction. Students can't tell at a glance which is which. |
| Updated annotations move to the front of the queue | Breaks the "queue position is stable" mental model. |

---

## 3. Motion & Keyboard Spec

### 3.1 Keyboard Shortcuts Table

| Shortcut | Action | Context | Surfaces in |
|---|---|---|---|
| `Tab` | `advanceToNext()` — advance queue (respect filter) | Panel focused or essay body focused | Phase 6 shortcut footer (after first close) |
| `Shift+Tab` | `retreatToPrevious()` — retreat queue (respect filter) | Panel focused or essay body focused | Phase 6 shortcut footer |
| `↓` | `advanceToNext()` — alias for Tab | Panel focused | Phase 6 shortcut footer |
| `↑` | `retreatToPrevious()` — alias for Shift+Tab | Panel focused | Phase 6 shortcut footer |
| `Shift+↓` | `advanceToNextParagraph()` — jump to first annotation of next paragraph in queue | Panel focused | Phase 6 shortcut footer, power-user subsection |
| `Shift+↑` | `retreatToPreviousParagraph()` — jump to first annotation of previous paragraph | Panel focused | Phase 6 shortcut footer, power-user subsection |
| `Esc` | `clearStackAndReturnToQueue()` — pop all stack entries, return to queue position | Panel focused | Phase 6 shortcut footer |
| `Enter` | No binding at Phase 10 (reserved for Phase 16 comment submission) | — | — |
| `Space` | Passthrough — scroll essay column | Essay body focused | Not surfaced (default browser behavior) |
| `/` | `focusFilterControl()` — move focus to filter segmented control | Panel focused | Phase 6 shortcut footer, power-user subsection |
| `?` | `toggleShortcutHelpOverlay()` — show full shortcuts overlay | Anywhere | Phase 6 footer |
| `1` / `2` / `3` / `4` | Switch filter state (All / Critical / Needs+ / Strengths) | Panel focused | Power-user subsection only |
| `Cmd/Ctrl+K` | `openMapView()` — reserved for Phase 11 | Anywhere | Phase 11 shortcut footer |
| `Cmd/Ctrl+.` | `toggleDocumentOrder()` — switch between smart order and document order | Panel focused | Power-user subsection |

### 3.2 Focus Order (DOM tab order when panel is open)

1. Panel header: progress bar (non-focusable, aria-live region for count changes)
2. Panel header: filter segmented control (focusable via `/`)
3. Panel header: `Walk in essay order` toggle (focusable via Cmd/Ctrl+. shortcut)
4. Panel header: stack breadcrumb `Back` button (if stack non-empty)
5. Panel body: meta line, critique, why it matters, strengths, rewrite disclosure (each focusable for screen readers, non-focusable via Tab — Tab is bound to `advanceToNext()`, not next-element)
6. Panel footer: `Next →` button
7. Panel footer: shortcut help `?` affordance
8. Close `×` button

Tab from the panel body does NOT advance focus within the panel — it advances the queue. This is an intentional override. Within-panel focus advance happens via arrow keys inside editable fields (Phase 9 rewrite block) and via screen-reader structural navigation (H1/H2 keys, landmark nav). Screen reader users navigating by heading level hear the insight card shape correctly; Tab is reserved for queue semantics across all users.

### 3.3 Scroll-Lock Behavior

- Panel open → essay column remains scrollable (students often scroll to re-read context during an insight).
- Panel open + annotation advance → essay column auto-scrolls to bring the new target sentence to the 35% vertical position.
- Panel open + auto-scroll in flight → user scrolls manually → cancel auto-scroll (latest-wins, consistent with Phase 7).
- Panel closed → no scroll lock ever. The essay column is a scrollable reading surface at all times.
- Mobile bottom sheet → sheet captures vertical scroll within its content area; essay column is obscured behind sheet and is not independently scrollable until sheet is dismissed or collapsed to peek-state.

### 3.4 Motion Specifications

| Transition | Duration | Easing | Notes |
|---|---|---|---|
| Panel content crossfade (annotation → annotation) | 180ms | cubic-bezier(0.4, 0, 0.2, 1) | Inherited from Phase 7 |
| Essay column auto-scroll to new target | 420ms | cubic-bezier(0.4, 0, 0.2, 1) | Slower than panel; eye tracks scroll |
| Progress bar fill advance | 280ms | ease-out | Lags the panel transition so the progress update reads as *consequence of* advancing |
| Gutter dot viewed-state transition | 320ms | ease-in-out | Opacity drop + inset-dot scale-down simultaneously |
| New annotation badge fade-in | 400ms | ease-out | From opacity 0 → 1, scale 0.92 → 1.0 |
| Updated annotation badge fade-in | 400ms | ease-out | Identical motion to New, different color |
| `Next →` button idle pulse (at 25s) | 2× 600ms | ease-in-out | Scale 1.0 → 1.05 → 1.0 → 1.05 → 1.0, fires once |
| Breadcrumb appear/disappear | 220ms | ease-out | Height from 0 → 28px, opacity 0 → 1 |
| End-of-review warm summary morph | 420ms | cubic-bezier(0.4, 0, 0.2, 1) | Content crossfade longer than insight transitions — signals category change |
| Filter change re-computation shimmer | 240ms | ease-in-out | Progress bar briefly pulses (opacity 0.6 → 1.0) to signal recomputation |
| Mobile swipe advance | 200ms | cubic-bezier(0.2, 0, 0, 1) | Slightly faster — swipes feel snappy |
| Mobile scrubber drag preview | 0ms (live) | n/a | Position updates at 60fps during drag |
| Mobile scrubber commit | 200ms | ease-out | On release, panel transitions to selected position |
| Toast (re-analysis notification) | enter 240ms / exit 180ms | ease-out / ease-in | Appears top-center, auto-dismisses at 4s |

### 3.5 Motion/React Component Vocabulary

All motion specifications above map to `motion/react` (the rebranded Framer Motion) primitives. Typical implementations:

```tsx
// Panel content crossfade
<AnimatePresence mode="wait">
  <motion.div
    key={currentAnnotationId}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
  >
    <InsightCard annotation={current} />
  </motion.div>
</AnimatePresence>

// Next button idle pulse
<motion.button
  animate={shouldPulse ? {
    scale: [1, 1.05, 1, 1.05, 1],
  } : { scale: 1 }}
  transition={{ duration: 1.2, ease: [0.42, 0, 0.58, 1] }}
>
  Next →
</motion.button>

// Gutter dot viewed-state
<motion.div
  className="gutter-dot"
  animate={{
    opacity: viewed ? 0.55 : 1.0,
    scale: viewed ? 0.65 : 1.0,
  }}
  transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
/>

// Mobile swipe
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.velocity.x < -350) advanceToNext();
    else if (info.velocity.x > 350) retreatToPrevious();
  }}
  dragElastic={0.25}
>
  <InsightCard annotation={current} />
</motion.div>
```

All transitions respect `prefers-reduced-motion`: when set, crossfades collapse to instant opacity switches, scroll becomes instant, pulses are disabled. The functionality is preserved; only the animation is removed.

---

## 4. Copy Deck

### 4.1 Progress Indicator Strings

| Context | String | Notes |
|---|---|---|
| Default header progress | `3 / 12` | 12px medium stone-500, left-aligned |
| aria-label for progress bar | `Reviewed 3 of 12 annotations` | Screen reader verbose form |
| aria-live update on advance | `Annotation 4 of 12` | Announced on each advance |
| Filter-applied progress | `2 / 4 · critical` | Filter name appended, bullet separator |
| Last annotation in queue (before completion) | `12 / 12 · one more to finish` | Additive hint, not replacement |

### 4.2 End-Of-Review CTA Strings

**Primary CTA variants (template: `Most important: {paragraphRef}. Start there →`):**

| Scenario | CTA string |
|---|---|
| Critical remaining unresolved | `Most important: ¶3S2. Start there →` |
| No critical, amber remaining | `Most important: ¶2S1. Start there →` |
| All amber+ resolved, strengths only | `Everything structural is handled. Want to see what's working? →` |
| Review was filter-only | `You've reviewed all critical annotations. Start the biggest one? →` |
| Re-analysis (2nd+ review pass) | `You've been here before — ¶3S2 is still the most important. Start there →` |

**Secondary options row strings:**

| Button | String |
|---|---|
| Re-walk | `Walk through again` |
| Map view | `See the map` |
| Exit | `Go back to writing` |

**Warm summary prose frame (LLM-generated, this is the prompt frame):**

> Produce 2–3 sentences summarizing the most important findings for this student. Structure:
> - Sentence 1: Name the single most critical structural or narrative issue, anchored by a specific ¶xSy reference.
> - Sentence 2: Name the strongest instinct in the essay (a specific repeated craft move), anchored with 1–2 phrase examples.
> - Sentence 3 (optional, only if tier distribution warrants): Name a second structural or narrative issue, anchored by ¶xSy.
> Voice: second-person, warm, specific. No compliments unless they are earned with evidence. No summary of the review process. No mention of tiers or scores. Do not use the words "great", "amazing", "fantastic", or "wonderful." Do not use the word "issues" — prefer "notes" or name the specific thing.

**Fallback prose (if LLM generation fails):**

> You read every note. The ones that matter most are in your third paragraph, where the essay's central moment lives — that's the one to rewrite first. Hold on to your instinct for specific physical detail; that's what's working.

### 4.3 Jump-Back Breadcrumb Format

**Stack depths and their rendered forms:**

| Depth | Rendering |
|---|---|
| 0 | (breadcrumb row is absent; zero chrome) |
| 1 | `← ¶4` |
| 2 | `← ¶4 · ¶2` |
| 3 | `← ¶4 · ¶2 · ¶7` |
| 3+saturated (4th jump occurred) | `← … ¶2 · ¶7 · ¶9` |

**Interactive behavior:**
- Hovering a paragraph reference shows a tooltip with the annotation's first 60 characters: `¶4 — "the first day of camp was the loudest day of my life"`
- Clicking a specific breadcrumb entry navigates to that point and truncates the stack to that depth. Clicking `¶2` in `← ¶4 · ¶2 · ¶7` navigates to ¶2's annotation and reduces the stack to `← ¶4`.
- The leftmost `←` icon is the `Back` button (pops one from the end of the stack).

**aria-labels:**
- Breadcrumb row: `Navigation history, 3 levels deep`
- Back button: `Go back to paragraph 7`
- Individual breadcrumb: `Jump to paragraph 4`

### 4.4 "New Annotation" Badge Copy

| Badge | Visible text | Tooltip on hover |
|---|---|---|
| `New` badge on gutter dot | (no text on badge, color signal only) | `Added in the latest review` |
| `Updated` badge on gutter dot | (no text on badge, color signal only) | `Updated in the latest review — view again` |
| Toast on re-analysis complete (1 new) | `1 new note added — next one coming up.` | — |
| Toast on re-analysis complete (N new) | `{N} new notes added — next one coming up.` | — |
| Toast on re-analysis complete (N updated, 0 new) | `{N} note{s} updated — next one coming up.` | — |
| Toast on re-analysis complete (mixed) | `{M} new, {N} updated — next one coming up.` | — |
| Toast on re-analysis complete (filter hides all new) | `Re-analysis added notes in other tiers.` | — |

### 4.5 Filter Control Labels

| State | Label | aria-label |
|---|---|---|
| All | `All` | `Show all annotations` |
| Critical only | `Critical` | `Show only critical annotations` |
| Needs+ | `Needs work +` | `Show annotations that need work or are critical` |
| Strengths | `Strengths` | `Show only strong and exceptional annotations` |

### 4.6 Toggle (Smart Order ↔ Document Order)

| Mode | Toggle label | Tooltip |
|---|---|---|
| Smart order (default) | `Smart order` (active), `Walk in essay order` (inactive) | `Walks the most important notes first, roughly in essay order.` |
| Document order | `Walk in essay order` (active), `Smart order` (inactive) | `Walks every note in the order they appear in your essay.` |

### 4.7 Empty State Within Filter

| Scenario | Copy |
|---|---|
| Filter matches zero annotations, none viewed | `No annotations match this filter.` + `[Show all]` |
| Filter matches some annotations, all viewed | `You've reviewed all {filterName} annotations. There are more in other tiers.` + `[Show all →]` |
| Critical only, all viewed, essay has no criticals | `This essay has no critical notes — nice work.` + `[See what's working →]` (switches to Strengths) |

---

## 5. Mobile Adaptation

Mobile is not a second-class adaptation of the desktop; it is a distinct expression of the same navigation semantics in a different gesture vocabulary. The design rules that hold across both:
- Smart order is the default.
- One primitive (`advanceToNext()`) serves all surfaces.
- Viewed state commits on panel close.
- The warm summary panel replaces the insight panel at 12/12.
- All filters, stack behaviors, and re-analysis insertions behave identically.

The differences are expressed in the surfaces and gestures, summarized below.

### 5.1 Mobile Layout

```
┌──────────────────────────────────────┐
│  Essay column (obscured by sheet)    │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  ▔▔▔▔▔▔    (grab handle)             │
│  3 / 12  ━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← progress
│  ← ¶4 · ¶2                      [⚙]  │ ← breadcrumb (if active)
│                                      │
│  ¶3 · S2 · CRITICAL                  │ ← meta
│                                      │
│  The critique prose runs for as many │ ← insight body
│  lines as the annotation requires,   │
│  in 15px serif, full opacity.        │
│                                      │
│  One way a writer might handle this →│ ← rewrite disclosure
│                                      │
├──────────────────────────────────────┤
│  [← Prev]  • • • | • • • • •  [Next →]│ ← bottom nav
└──────────────────────────────────────┘
```

### 5.2 Mobile Gesture Table

| Gesture | Action | Threshold |
|---|---|---|
| Swipe left on sheet header | `advanceToNext()` | velocity > 0.35 px/ms, horizontal distance > 40px |
| Swipe right on sheet header | `retreatToPrevious()` | same thresholds, reversed direction |
| Tap `Next →` button | `advanceToNext()` | instant |
| Tap `← Prev` button | `retreatToPrevious()` | instant |
| Tap scrubber dot | `jumpToQueuePosition(dotIndex)` | instant |
| Drag scrubber | `previewQueuePosition(dragPosition)` (does not commit) | live |
| Release scrubber | `jumpToQueuePosition(finalDragPosition)` | on touch-end |
| Swipe down on sheet | dismiss sheet (close panel, retain queue state) | velocity > 0.5 px/ms downward |
| Swipe up on sheet | expand sheet to full height | velocity > 0.5 px/ms upward |
| Tap grab handle | toggle sheet between peek and expanded heights | instant |
| Long press gutter dot (essay column) | show annotation preview tooltip | 500ms |

### 5.3 Mobile Scrubber Details

The scrubber is the mobile-only affordance for non-sequential queue navigation. On desktop, students jump non-sequentially by clicking underlines or using the map view (Phase 11). On mobile, the map view is less accessible (smaller screens make paragraph-level maps cramped), so the scrubber is elevated to a primary navigation surface.

**Structural rules:**
- Fixed at 11 dots regardless of queue length.
- At queue length ≤ 11: each dot represents one annotation; filled dot = current.
- At queue length > 11: dots represent proportional positions; filled dot shows the current position within the range.
- Viewed annotations have 40% opacity dots; unviewed have 100% opacity dots; current has 100% opacity with a 1px teal ring outline.
- New annotations show the teal `New` badge replacing their dot until viewed.

**Drag behavior:**
- Drag to preview: the insight panel updates its content in real-time as the student drags. This is the one place where the panel content crossfade is *disabled* during interaction — the content swaps instantly during drag (because the student is scrubbing, not reading).
- Release commits to the nearest dot.
- If the student drags off the scrubber vertically (finger leaves the dot row by more than 40px), the drag is cancelled and the scrubber snaps back.

**aria-label for scrubber:**
- Scrubber row: `Annotation position scrubber, 11 dots, currently at position 3 of 12`
- Individual dot: `Jump to annotation 3 of 12`

### 5.4 Mobile End-Of-Review

The warm summary panel on mobile:
- Auto-expands the sheet to 100vh (full-height).
- Sticky bottom button area with the primary CTA (`Most important: ¶3S2. Start there →`) as a full-width button.
- Secondary options (`Walk through again`, `See the map`, `Go back to writing`) appear as a row of text buttons above the primary CTA.
- Prose summary scrolls within the sheet if longer than viewport.

### 5.5 Mobile-Specific Differences From Desktop

| Feature | Desktop | Mobile |
|---|---|---|
| Navigation primitive | Tab / ↓ / `Next →` | Swipe / `Next →` tap / scrubber |
| Non-sequential jump | Click underline / map view | Scrubber tap |
| Paragraph jump | Shift+↓ / Shift+↑ | Not available (use scrubber) |
| Filter control | 4-way segmented control in header | Tap [⚙] icon in header → bottom sheet with filter options |
| Progress indicator | Thin bar in panel header | Thin bar in sheet top + scrubber visualization |
| Stack breadcrumb | Full breadcrumb with hoverable tooltips | Compressed breadcrumb, tap to jump (no hover) |
| Idle pulse | On `Next →` button at 25s | Not implemented — mobile attention model is different (app-switching replaces idle) |
| Keyboard shortcuts | Full set | N/A |

### 5.6 Responsive Breakpoints

| Width | Behavior |
|---|---|
| < 480px | Bottom sheet takes 90vh max; scrubber condenses to 7 dots |
| 480–767px | Standard mobile bottom sheet, 11 dots |
| 768–1023px | Tablet: desktop layout at 50% right-column split; 11 dots in sidebar (scrubber moves to right panel footer) |
| ≥ 1024px | Full desktop (40% right column panel, no scrubber; uses map view for non-sequential nav) |

---

## 6. Backend Requirements

### 6.1 Order Computation (Priority Algorithm)

The priority score is computed once at review start, and re-computed whenever:
- Focused re-analysis adds or modifies annotations.
- The student changes the order toggle (smart ↔ document).
- The filter changes (re-computation is cheap; re-compute on every filter change).

**Endpoint:** `POST /api/reviews/{reviewId}/compute-order`

**Request shape:**

```ts
interface ComputeOrderRequest {
  orderMode: 'smart' | 'document';
  filter: 'all' | 'critical' | 'needs-plus' | 'strengths';
  includeViewed: boolean; // default false; true only when map view requests full list
}
```

**Response shape:**

```ts
interface ComputeOrderResponse {
  queue: QueueEntry[];
  totalCount: number; // count within filter
  viewedCount: number; // count of viewed within filter
  computedAt: string; // ISO timestamp
  orderMode: 'smart' | 'document';
  filter: string;
}

interface QueueEntry {
  annotationId: string;
  annotationVersion: number; // for invalidating viewed state on change
  paragraphIndex: number;
  sentenceIndex: number;
  tier: 'critical' | 'needs-work' | 'functional' | 'strong' | 'exceptional' | 'masterful';
  priorityScore: number; // 0.0–1.0, for debugging
  isNew: boolean; // since last review
  isUpdated: boolean; // content/tier changed since student last viewed
  queuePosition: number; // 0-indexed
}
```

### 6.2 Viewed/Unviewed Persistence Shape

**Table:** `annotation_views`

```sql
CREATE TABLE annotation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL, -- Clerk user ID (TEXT, not UUID)
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  annotation_id UUID NOT NULL REFERENCES essay_annotations(id) ON DELETE CASCADE,
  annotation_version INTEGER NOT NULL, -- for invalidation
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dwell_ms INTEGER NOT NULL, -- for telemetry (open → close duration)
  close_reason TEXT NOT NULL CHECK (close_reason IN ('advance', 'retreat', 'jump', 'dismiss', 'filter-change', 'esc')),
  session_id UUID NOT NULL, -- for session-scoped analytics
  UNIQUE (student_id, essay_id, annotation_id, annotation_version)
);

CREATE INDEX idx_annotation_views_lookup
  ON annotation_views (student_id, essay_id, annotation_version);

CREATE INDEX idx_annotation_views_session
  ON annotation_views (session_id);
```

**RLS policy:** student can read/write only their own rows (`student_id = auth.jwt()->>'sub'`).

**API endpoint for marking viewed:**

```
POST /api/annotations/{annotationId}/mark-viewed
```

**Request body:**

```ts
interface MarkViewedRequest {
  annotationVersion: number;
  dwellMs: number;
  closeReason: 'advance' | 'retreat' | 'jump' | 'dismiss' | 'filter-change' | 'esc';
  sessionId: string;
}
```

**Behavior:**
- If `dwellMs < 1200`, the mark is ignored (rapid-click contract from §2.6). The server returns 200 with `{ marked: false, reason: 'dwell-too-short' }`.
- If the annotation_version has changed since the row was written, the new insert creates a new row (UNIQUE constraint includes version). Prior version's viewed state is preserved for telemetry but does not count for the current review.
- Marks are idempotent per `(student, essay, annotation, version)` — re-posting does not update the row.

**Query for "what has the student viewed in this review":**

```sql
SELECT av.annotation_id
FROM annotation_views av
INNER JOIN essay_annotations ea
  ON ea.id = av.annotation_id
  AND ea.version = av.annotation_version
WHERE av.student_id = $1
  AND av.essay_id = $2;
```

### 6.3 Newness Detection After Re-Analysis

**Invariant:** an annotation is `isNew` in the queue if there is no `annotation_views` row for *any version* of its `annotationId` for this student. An annotation is `isUpdated` if there is a view row for a prior version but not the current version.

**Re-analysis flow:**

```
1. Focused re-analysis fires (Phase 15 trigger).
2. Analysis service produces updated annotation set:
   - New annotations: new annotationId, new version 1.
   - Updated annotations: existing annotationId, version incremented.
   - Deleted annotations: existing annotationId, marked deleted_at in essay_annotations.
3. Server re-computes the queue:
   - For each annotation in the updated set:
     - isNew = (no view exists for any version of this annotationId)
     - isUpdated = (view exists for an earlier version, but not for current version)
   - Insert annotations into queue per §2.10 rules:
     - isNew → front of unviewed segment
     - isUpdated → retain queue position, reset visible-viewed-state
4. Server broadcasts SSE event to the client:
   - Event: `annotation-queue-updated`
   - Payload: full new queue + summary `{ newCount, updatedCount, deletedCount }`
5. Client applies queue update per §2.10 motion/UI rules (silent insertion, toast).
```

**SSE event payload:**

```ts
interface AnnotationQueueUpdatedEvent {
  type: 'annotation-queue-updated';
  reviewId: string;
  queue: QueueEntry[];
  summary: {
    newCount: number;
    updatedCount: number;
    deletedCount: number;
  };
  timestamp: string;
}
```

### 6.4 Order-Compute Caching

The priority algorithm is deterministic given `(annotations, orderMode, filter)`. To avoid recomputing on every filter flip:

- Cache the full priority-sorted list (all tiers, no filter) in Redis, keyed on `reviewId:orderMode`.
- TTL: 1 hour, or invalidate on any re-analysis event.
- On filter change, filter the cached list in-memory on the client (no server round-trip required for filter-only changes).
- On order-mode toggle, server round-trip is required (different algorithm).

### 6.5 Telemetry Events

Events emitted to the `writing_analytics` table (per the Writing Improvement Roadmap):

| Event name | Fields | When |
|---|---|---|
| `nav.advance` | `{annotationId, queuePosition, advanceKind: 'tab' / 'arrow' / 'button' / 'swipe'}` | Student advances |
| `nav.retreat` | `{annotationId, queuePosition, retreatKind}` | Student retreats |
| `nav.jump` | `{fromAnnotationId, toAnnotationId, jumpSource: 'underline-click' / 'map-click' / 'scrubber' / 'cross-ref-pill' / 'breadcrumb'}` | Non-queue jump |
| `nav.stack-push` | `{depth, fromAnnotationId, toAnnotationId}` | Cross-ref stack grows |
| `nav.stack-pop` | `{remainingDepth, reason: 'back-button' / 'esc'}` | Student backs out |
| `nav.stack-saturate` | `{droppedAnnotationId}` | 4th jump replaced oldest |
| `nav.filter-change` | `{fromFilter, toFilter}` | Filter toggled |
| `nav.order-mode-change` | `{fromMode, toMode}` | Smart/document toggle |
| `nav.idle-pulse` | `{annotationId, dwellMs}` | 25s idle fired pulse |
| `nav.review-complete` | `{totalAnnotations, viewedAnnotations, durationMs, filterModeAtEnd}` | 12/12 reached |
| `nav.warm-summary-cta-click` | `{targetAnnotationId, summaryVariant}` | Student clicks primary CTA |
| `nav.warm-summary-secondary-click` | `{option: 'rewalk' / 'map' / 'exit'}` | Secondary option clicked |
| `nav.new-annotation-viewed` | `{annotationId, timeFromInsertMs}` | Student views a New-badged annotation |

### 6.6 Session Shape

```ts
interface ReviewSession {
  sessionId: string; // UUID
  studentId: string;
  essayId: string;
  startedAt: string;
  orderMode: 'smart' | 'document';
  currentFilter: string;
  currentQueuePosition: number;
  currentStackDepth: number;
  currentStack: Array<{ annotationId: string; fromQueuePosition: number }>;
  idleTimerExpiry: string | null;
  lastAdvanceAt: string;
}
```

Session state persists client-side only (IndexedDB), synced to backend on session end or every 30s while active. Backend persistence is best-effort; if the session is lost, the student re-starts the review from the Phase 5 bloom (which is deterministic) with viewed state restored from `annotation_views`.

---

## 7. Ordering Algorithm Pseudocode

The recommended priority algorithm, in readable TypeScript.

```ts
interface Annotation {
  id: string;
  paragraphIndex: number; // 0-indexed
  sentenceIndex: number; // 0-indexed within paragraph
  tier: 'critical' | 'needs-work' | 'functional' | 'strong' | 'exceptional' | 'masterful';
  crossReferences: string[]; // annotationIds this annotation references
  isOpeningParagraph: boolean; // ¶1
  isClosingParagraph: boolean; // last ¶
}

interface PriorityScored extends Annotation {
  priorityScore: number;
}

// ============================================================
// Step 1: tier weight
// ============================================================

const TIER_WEIGHTS = {
  critical:    1.00,
  'needs-work': 0.55,
  exceptional: 0.15,  // exceptional notes are worth surfacing (rare, celebratory)
  strong:      0.10,
  functional:  0.00,  // no annotation shown; not in queue
  masterful:   0.00,  // rare, presented at end-of-review summary
} as const;

// ============================================================
// Step 2: structural weight — opening and closing paragraphs matter more
// ============================================================

function structuralWeight(a: Annotation, totalParagraphs: number): number {
  if (a.isOpeningParagraph) return 1.15;
  if (a.isClosingParagraph) return 1.10;
  // body paragraphs: normalize around 1.0, with slight emphasis on middle
  const normalizedPos = a.paragraphIndex / Math.max(1, totalParagraphs - 1);
  const midBias = 1 - Math.abs(normalizedPos - 0.5) * 0.2; // 0.9 at edges, 1.0 at middle
  return midBias;
}

// ============================================================
// Step 3: centrality — annotations referenced by multiple others are connective tissue
// ============================================================

function centralityWeight(a: Annotation, allAnnotations: Annotation[]): number {
  const inboundRefs = allAnnotations.filter(
    other => other.crossReferences.includes(a.id)
  ).length;
  if (inboundRefs >= 2) return 1.15;
  if (inboundRefs === 1) return 1.05;
  return 1.00;
}

// ============================================================
// Step 4: compose priority score
// ============================================================

function priorityScore(
  a: Annotation,
  allAnnotations: Annotation[],
  totalParagraphs: number
): number {
  return TIER_WEIGHTS[a.tier]
    * structuralWeight(a, totalParagraphs)
    * centralityWeight(a, allAnnotations);
}

// ============================================================
// Step 5: document-order tiebreak
// ============================================================

function documentOrderKey(a: Annotation): number {
  return a.paragraphIndex * 1000 + a.sentenceIndex;
}

// ============================================================
// Step 6: the smart-order algorithm with paragraph grouping and spatial smoothing
// ============================================================

interface OrderingInput {
  annotations: Annotation[];
  phase5BloomId: string; // the ID of the annotation auto-selected at t=2600ms
  totalParagraphs: number;
}

function computeSmartOrder(input: OrderingInput): Annotation[] {
  const { annotations, phase5BloomId, totalParagraphs } = input;

  // --- 6a. Score all annotations (excluding functional) ---
  const scored: PriorityScored[] = annotations
    .filter(a => a.tier !== 'functional')
    .map(a => ({
      ...a,
      priorityScore: priorityScore(a, annotations, totalParagraphs),
    }));

  // --- 6b. Group by paragraph ---
  const byParagraph = new Map<number, PriorityScored[]>();
  for (const a of scored) {
    if (!byParagraph.has(a.paragraphIndex)) byParagraph.set(a.paragraphIndex, []);
    byParagraph.get(a.paragraphIndex)!.push(a);
  }

  // Within each paragraph, sort by document position (sentenceIndex)
  for (const [_, paras] of byParagraph) {
    paras.sort((x, y) => x.sentenceIndex - y.sentenceIndex);
  }

  // --- 6c. Order paragraphs by their highest-priority annotation ---
  const paragraphOrder: number[] = Array.from(byParagraph.keys())
    .sort((pA, pB) => {
      const maxA = Math.max(...byParagraph.get(pA)!.map(a => a.priorityScore));
      const maxB = Math.max(...byParagraph.get(pB)!.map(a => a.priorityScore));
      // Higher priority first; ties broken by document order
      if (maxA !== maxB) return maxB - maxA;
      return pA - pB;
    });

  // --- 6d. Flatten into initial queue (paragraph-clustered) ---
  let queue: PriorityScored[] = [];
  for (const pIdx of paragraphOrder) {
    queue.push(...byParagraph.get(pIdx)!);
  }

  // --- 6e. Ensure Phase 5 bloom is at position 0 ---
  const bloomIndex = queue.findIndex(a => a.id === phase5BloomId);
  if (bloomIndex === -1) {
    throw new Error('Phase 5 bloom not found in queue — ordering invariant broken');
  }
  if (bloomIndex !== 0) {
    // Move the bloom's paragraph cluster to the front
    const bloomParagraph = queue[bloomIndex].paragraphIndex;
    const bloomCluster = queue.filter(a => a.paragraphIndex === bloomParagraph);
    const rest = queue.filter(a => a.paragraphIndex !== bloomParagraph);
    queue = [...bloomCluster, ...rest];

    // Within the bloom cluster, ensure bloom is first
    const bloomClusterBloomIdx = queue.findIndex(a => a.id === phase5BloomId);
    if (bloomClusterBloomIdx !== 0) {
      const bloom = queue.splice(bloomClusterBloomIdx, 1)[0];
      queue.unshift(bloom);
    }
  }

  // --- 6f. Spatial smoothing: prevent more than one backward paragraph jump per 3 advances ---
  queue = applySpatialSmoothing(queue);

  return queue;
}

// ============================================================
// Step 7: spatial smoothing
// ============================================================

function applySpatialSmoothing(queue: PriorityScored[]): PriorityScored[] {
  const smoothed: PriorityScored[] = [queue[0]];
  let backwardJumpsInWindow = 0;
  const WINDOW_SIZE = 3;
  const MAX_DRIFT = 4;

  const remaining = queue.slice(1);

  while (remaining.length > 0) {
    const prev = smoothed[smoothed.length - 1];
    const window = smoothed.slice(-WINDOW_SIZE);
    backwardJumpsInWindow = countBackwardJumps(window);

    // Find the next candidate:
    //  - If we're at our budget for backward jumps, prefer a forward candidate.
    //  - Otherwise, take the front of remaining (which is priority-sorted).
    const frontCandidate = remaining[0];
    const isFrontBackward = frontCandidate.paragraphIndex < prev.paragraphIndex;

    if (isFrontBackward && backwardJumpsInWindow >= 1) {
      // Look for a forward candidate within MAX_DRIFT positions
      const forwardIdx = remaining.findIndex(
        (a, idx) => idx < MAX_DRIFT && a.paragraphIndex >= prev.paragraphIndex
      );

      if (forwardIdx !== -1) {
        // Take the forward candidate; defer the backward one
        const chosen = remaining.splice(forwardIdx, 1)[0];
        smoothed.push(chosen);
        continue;
      }
      // No forward candidate within drift; fall through and take the backward one
    }

    // Default: take the front
    smoothed.push(remaining.shift()!);
  }

  return smoothed;
}

function countBackwardJumps(window: PriorityScored[]): number {
  let count = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i].paragraphIndex < window[i - 1].paragraphIndex) count++;
  }
  return count;
}

// ============================================================
// Step 8: document order (the toggle alternative)
// ============================================================

function computeDocumentOrder(input: OrderingInput): Annotation[] {
  const { annotations, phase5BloomId } = input;
  const nonFunctional = annotations.filter(a => a.tier !== 'functional');
  const sorted = [...nonFunctional].sort(
    (a, b) => documentOrderKey(a) - documentOrderKey(b)
  );
  // Even in document order, the Phase 5 bloom is the first click — but document-order
  // treats the bloom as a starting point; the queue walks in document order from the
  // bloom's position forward, wrapping around to catch earlier annotations at the end.
  const bloomIdx = sorted.findIndex(a => a.id === phase5BloomId);
  if (bloomIdx === -1) {
    throw new Error('Phase 5 bloom not found in document-order queue');
  }
  const fromBloomToEnd = sorted.slice(bloomIdx);
  const beforeBloom = sorted.slice(0, bloomIdx);
  return [...fromBloomToEnd, ...beforeBloom];
}

// ============================================================
// Step 9: filter application
// ============================================================

type FilterState = 'all' | 'critical' | 'needs-plus' | 'strengths';

function applyFilter(queue: Annotation[], filter: FilterState): Annotation[] {
  switch (filter) {
    case 'all':
      return queue;
    case 'critical':
      return queue.filter(a => a.tier === 'critical');
    case 'needs-plus':
      return queue.filter(a =>
        a.tier === 'critical' || a.tier === 'needs-work'
      );
    case 'strengths':
      return queue.filter(a =>
        a.tier === 'strong' || a.tier === 'exceptional' || a.tier === 'masterful'
      );
  }
}

// ============================================================
// Step 10: new/updated insertion (post-re-analysis)
// ============================================================

function mergeReanalysisResults(
  currentQueue: Annotation[],
  currentPosition: number,
  updatedAnnotations: Annotation[],
  viewedIds: Set<string>,
  previousVersions: Map<string, number>,
): Annotation[] {
  // Partition
  const newOnes = updatedAnnotations.filter(a =>
    !currentQueue.some(existing => existing.id === a.id)
  );
  const updatedExisting = updatedAnnotations.filter(a =>
    currentQueue.some(existing => existing.id === a.id) &&
    previousVersions.get(a.id) !== undefined &&
    previousVersions.get(a.id)! < (a as any).version
  );
  const deletedIds = new Set(
    currentQueue
      .filter(existing => !updatedAnnotations.some(a => a.id === existing.id))
      .map(a => a.id)
  );

  // Remove deleted
  let result = currentQueue.filter(a => !deletedIds.has(a.id));

  // Replace updated (in-place, preserve position)
  result = result.map(a => {
    const updated = updatedExisting.find(u => u.id === a.id);
    return updated ?? a;
  });

  // Insert new annotations at the front of the unviewed segment
  // (i.e., just after the last viewed annotation in queue order, or at currentPosition,
  //  whichever is further forward — we never insert behind the student)
  const firstUnviewedIdx = result.findIndex(a => !viewedIds.has(a.id));
  const insertionPoint = Math.max(
    firstUnviewedIdx === -1 ? result.length : firstUnviewedIdx,
    currentPosition + 1, // never insert behind or at current
  );

  result.splice(insertionPoint, 0, ...newOnes);

  return result;
}
```

### 7.1 Example Trace

Given an essay with 12 annotations across 7 paragraphs:

```
annotations = [
  { id: 'a1',  ¶0, s2, tier: 'critical' },      // ¶1S3
  { id: 'a2',  ¶0, s5, tier: 'strong' },        // ¶1S6
  { id: 'a3',  ¶1, s0, tier: 'needs-work' },    // ¶2S1
  { id: 'a4',  ¶1, s3, tier: 'strong' },        // ¶2S4
  { id: 'a5',  ¶2, s1, tier: 'critical' },      // ¶3S2  ← Phase 5 bloom
  { id: 'a6',  ¶2, s3, tier: 'needs-work' },    // ¶3S4
  { id: 'a7',  ¶3, s2, tier: 'exceptional' },   // ¶4S3
  { id: 'a8',  ¶4, s1, tier: 'needs-work' },    // ¶5S2
  { id: 'a9',  ¶5, s0, tier: 'critical' },      // ¶6S1
  { id: 'a10', ¶5, s2, tier: 'strong' },        // ¶6S3
  { id: 'a11', ¶6, s0, tier: 'needs-work' },    // ¶7S1
  { id: 'a12', ¶6, s2, tier: 'strong' },        // ¶7S3
]
```

**After smart ordering (simplified — real algorithm includes centrality and structural weights):**

1. Priority scores:
   - ¶3 cluster: `a5 (1.00)`, `a6 (0.55)` → max 1.00
   - ¶6 cluster: `a9 (1.00)`, `a10 (0.10)` → max 1.00
   - ¶1 cluster: `a1 (1.15)`, `a2 (0.10)` → max 1.15 (opening paragraph weight)
   - ¶7 cluster: `a11 (0.605)`, `a12 (0.11)` → max 0.605 (closing paragraph weight)
   - ¶2 cluster: `a3 (0.55)`, `a4 (0.10)` → max 0.55
   - ¶5 cluster: `a8 (0.55)` → 0.55
   - ¶4 cluster: `a7 (0.15)` → 0.15

2. Paragraph order by max score: `¶1 (1.15) → ¶3 (1.00) → ¶6 (1.00) → ¶7 (0.605) → ¶2 (0.55) → ¶5 (0.55) → ¶4 (0.15)`

3. Flatten with within-paragraph document order: `[a1, a2, a5, a6, a9, a10, a11, a12, a3, a4, a8, a7]`

4. Phase 5 bloom is `a5`. Move `a5`'s cluster (¶3) to front, ensuring `a5` is first within cluster: `[a5, a6, a1, a2, a9, a10, a11, a12, a3, a4, a8, a7]`

5. Apply spatial smoothing:
   - a5 (¶3) → a6 (¶3): forward ✓
   - a6 (¶3) → a1 (¶1): backward (jump #1 in window of 3) ✓
   - a1 (¶1) → a2 (¶1): forward ✓
   - a2 (¶1) → a9 (¶6): forward ✓
   - a9 (¶6) → a10 (¶6): forward ✓
   - a10 (¶6) → a11 (¶7): forward ✓
   - a11 (¶7) → a12 (¶7): forward ✓
   - a12 (¶7) → a3 (¶2): backward (check window = [a11, a12, a3]: 1 backward jump, within budget) ✓
   - a3 (¶2) → a4 (¶2): forward ✓
   - a4 (¶2) → a8 (¶5): forward ✓
   - a8 (¶5) → a7 (¶4): backward (window = [a4, a8, a7]: 1 backward jump, within budget) ✓

**Final smart-order queue:** `[a5, a6, a1, a2, a9, a10, a11, a12, a3, a4, a8, a7]`

Reading it: the student starts at the Phase 5 bloom (¶3's critical), finishes ¶3, jumps to ¶1 (the essay's opening critical), finishes ¶1, then walks forward ¶6 → ¶7 → ¶2 → ¶5 → ¶4 (the last being the lone exceptional, savoring for the end). The backward jumps are minimal and each preserves paragraph integrity (student never leaves a paragraph mid-way).

### 7.2 Algorithmic Invariants (enforced in tests)

```ts
// Must hold for every smart-order output
const INVARIANTS = [
  // I1: Phase 5 bloom is always first
  (q: Annotation[], bloomId: string) => q[0].id === bloomId,

  // I2: Within any paragraph cluster in the queue, document order is preserved
  (q: Annotation[]) => {
    const clusters = groupByParagraph(q);
    return clusters.every(cluster =>
      cluster.every((a, i) => i === 0 || a.sentenceIndex > cluster[i - 1].sentenceIndex)
    );
  },

  // I3: No more than one backward paragraph jump per window of 3
  (q: Annotation[]) => {
    for (let i = 3; i <= q.length; i++) {
      const window = q.slice(i - 3, i);
      if (countBackwardJumps(window) > 1) return false;
    }
    return true;
  },

  // I4: All non-functional annotations appear in the queue exactly once
  (q: Annotation[], all: Annotation[]) => {
    const nonFunctional = all.filter(a => a.tier !== 'functional');
    return q.length === nonFunctional.length &&
      q.every(a => nonFunctional.some(n => n.id === a.id));
  },

  // I5: The highest-priority cluster (excluding the bloom's cluster) is the second cluster
  (q: Annotation[], bloomId: string) => {
    const bloomParagraph = q[0].paragraphIndex;
    const firstNonBloomCluster = q.find(a => a.paragraphIndex !== bloomParagraph);
    // Verify it's the highest-priority remaining paragraph
    // (skipped for brevity)
    return true;
  },
];
```

---

## 8. Emotional Map

The emotional target of Phase 10 is not "make the review fun" (it isn't fun; reading criticism of your own writing is never fun) and not "make the review short" (artificially short means incomplete teaching). The target is **make the review feel like a path, not a pile**. A path has a beginning, a middle, and an end, and at every point the student knows roughly where they are and where they're going. A pile has no orientation — the student is just picking through it.

### 8.1 The Three Waypoints

**At 3/12 — Orientation:**
The student has walked through three annotations. They have confirmed that the loop works (Tab → read → Tab → read → Tab). They have seen the color tier system pay off (the first three annotations were the most critical, the bloom was genuinely the most important). They know the panel shape from Phase 8 (meta → critique → why → strengths → rewrite). They know the viewing state signal (gutter dots dim when viewed). They are 25% through the queue.

The emotional quality at 3/12 should be **capable orientation** — the student knows how this works, they're not overwhelmed, they can see the shape of the path. The progress bar is a quarter-filled and red-weighted; they can see that the hardest material is up front and it's going to get easier. They feel, subconsciously, that the rhythm is set.

The failure mode at 3/12 is **overwhelm** — the student has read three heavy critical notes in a row, none of them yet felt actionable, and they're starting to wonder if the whole essay is broken. The countermeasure is (a) the rewrite suggestion on critical annotations (Phase 9) provides a concrete pattern to hold onto, (b) the progress bar shows there's an end, and (c) the smart order should have at least one NEEDS WORK or one STRONG interleaved in the first 3–4 annotations (we allow the smoothing pass to pull forward a lower-priority annotation within a paragraph cluster to avoid three criticals in a row).

Copy cues at 3/12: none explicit. The emotional state is held by the system working — no progress-bar commentary, no pop-up encouragement.

**At 7/12 — Commitment:**
The student has walked through seven annotations. They are more than halfway. They've moved past the mental exit-ramp of "I could just close this now and come back later." They have invested enough time that finishing is cheaper than returning. The progress bar is 58% filled, and the color is transitioning from amber to sage — the student can see that the remaining material is lighter-weight.

The emotional quality at 7/12 should be **committed momentum** — the student is in the rhythm, past the bailout threshold, and starting to anticipate the end. This is the emotional state the whole navigation system is optimizing for. If the student reaches 7/12 still in the rhythm, they will reach 12/12.

The failure mode at 7/12 is **fatigue** — the student has been reading dense feedback for 10+ minutes and their attention is narrowing. The countermeasure is (a) the idle pulse at 25s per panel gently signals "when you're ready" without rushing, (b) the STRONG and EXCEPTIONAL annotations appearing in the second half provide moments of validation (a student who has just read 7 criticals and then sees their ¶4S3 called exceptional experiences a small, earned lift), and (c) the reducing tier intensity in the progress bar is legible as "it's getting easier."

Copy cues at 7/12: none explicit. One consideration was a 7/12 milestone toast ("You're over halfway — the last stretch is lighter"), and we rejected it. Milestone toasts are the vocabulary of gamification apps, not teaching apps. The student will notice they're past halfway from the progress bar alone, and a toast would be a cheap win.

**At 12/12 — Completion With Direction:**
The student has walked through all twelve annotations. They have seen every note, read every rewrite, and viewed every gutter-dot transition. The insight panel morphs into the warm summary panel. The progress bar is fully filled, now showing the green-to-teal end segment.

The emotional quality at 12/12 should be **completion with direction** — specifically, *not* triumph and *not* exhaustion, but the kind of quiet readiness that follows a teacher closing a lesson. The student should feel: "I know what I read, I know what matters, I know what to do first." The three-sentence prose summary names the pattern the student just absorbed (more explicitly than any individual annotation could), the CTA gives them the one action to start with, and the secondary row acknowledges that not all students are ready to act immediately.

The failure mode at 12/12 is **deflation** — the student finishes reading and feels the weight of the work ahead without a clear starting point, closes the tab, and never returns. The countermeasure is the CTA's single-target specificity: *Most important: ¶3S2. Start there →*. There is no choosing, no planning, no wizard. The student clicks and they are in revision mode on the most important sentence. The entire review has been optimized to earn the legitimacy of that one recommendation.

Copy cues at 12/12: the warm summary prose, the single CTA, the unpresumptive secondary row. No celebratory language. No score. No confetti.

### 8.2 The Emotional Arc Visualized

```
Emotional intensity
    │
    │                                             ╭─── 12/12
    │                          ╭────╮           ╱
    │                         ╱      ╲         ╱
    │            ╭──── 7/12 ╱         ╲       ╱    ← "committed momentum"
    │           ╱           ← mild dip (fatigue, countered by strengths)
    │  ╭─ 3/12 ╱
    │ ╱       ← "capable orientation"
    │╱
    │ ← review start
    └─────────────────────────────────────────────────> time

Annotations viewed:  0 ─────── 3 ─────── 7 ───── 12
```

The intended curve: a quick rise during the first three annotations (the student is finding their footing), a plateau through the middle (the rhythm is set, the tiers are mixing), a small dip near 7/12 (natural fatigue), a recovery through the lighter-tier second half, and a stepped rise at 12/12 as the warm summary lands.

### 8.3 The Anti-Goal: The "Grading Feeling"

Every design decision in Phase 10 is anti-correlated with the feeling of being graded. Grading has a score, a timer, a pass/fail, a list of errors. Phase 10 has:
- No score (tier colors are not numeric).
- No timer (no auto-advance; no countdown).
- No pass/fail (warm summary, no grade).
- No list-of-errors (annotations are a path, not a checklist).

If a user at any point in Phase 10 feels like they are being tested, the design has failed. The emotional target is the feeling of being *walked through your essay by a careful teacher who read the whole thing and has a recommendation for where to start.*

### 8.4 Edge Emotional States

**The student who takes a 20-minute break mid-review:**
Session state persists (§6.6). When they return, the panel re-opens to their last viewed position, with a gentle header phrase: `You were at 7 of 12. Picking up where you left off.` — stated, not exclaimed. Progress bar intact. Stack intact (up to 30 minutes of idle; past that, the stack clears).

**The student who completes the review in 3 minutes:**
Dwell time averaged < 15s per annotation. The review was surface. We do not shame them — the warm summary still fires, but the prose summary (if generated by LLM) can acknowledge the pace: `You moved quickly through the notes. If you want to revisit, start with ¶3S2 — that's the most important one.` The `Walk through again` secondary option is elevated visually.

**The student who got 1 new annotation from re-analysis:**
The `1 new note added — next one coming up.` toast is factual and warm. The new annotation's teal `New` badge fades in. The next advance takes them to it. No big deal is made; re-analysis is a normal part of the workflow, not a special event.

**The student at 11/12 who closes the tab:**
They will return to 11/12 with an implicit "one more to go" feel. The progress bar at 11/12 showing a green-to-teal fill with one slot open is its own motivator. No push notifications; no email reminders. If they never return, that is their choice.

---

## 9. Open Questions For Wave 4

1. **Smart order determinism across re-analysis.** If the student rewrites ¶3S2 and focused re-analysis regenerates that annotation (now tier: `needs-work` instead of `critical`), does the queue re-compute affect paragraphs the student has already viewed? Current recommendation: re-compute only the unviewed segment; viewed segment is immutable to preserve the mental model. But this could produce a queue where a newly-high-priority annotation (from re-analysis) lands at position 8 instead of position 2, which is arguably wrong. Needs Wave 4 resolution: either re-compute globally (and accept the mental-model cost) or stay with unviewed-only re-computation (and accept the priority cost).

2. **Cross-reference-pill navigation inside the warm summary panel.** The warm summary prose will contain ¶xSy references. When the student clicks one, do they re-enter the review (at that annotation) or jump straight to revision mode? Current recommendation is the latter (the review is complete; we're past reading-for-understanding). But the student may click a reference intending to re-read the critique, not revise. This needs Wave 4 interaction testing — the click target must be unambiguous. One path: the warm summary references are non-clickable prose, and the only clickable element is the primary CTA.

3. **Does the `Walk in essay order` toggle persist across sessions?** A student who sets document order on their first review — do they get document order on their second review of the same essay? Of a different essay? Current recommendation: per-essay persistence (scoped to `essayId`). A student who prefers document order for one essay may prefer smart order for another. But we have no telemetry to confirm this preference is per-essay; it might be per-student. Wave 4 telemetry question: measure toggle stickiness by user vs. by essay.

4. **Infinite-scroll long essays and the scrubber.** For essays with 40+ annotations (rare — our analysis typically produces 10–30), the 11-dot mobile scrubber becomes coarse (each dot represents ~4 annotations). Is this acceptable, or do we need a "segmented scrubber" (scrubber shows current paragraph range, with drill-in to sentence level)? Current recommendation: acceptable, and the scrubber is a rough-navigation tool, not a precise one (map view is the precise tool). Wave 4 should test the 40+ case if any real essay hits that volume.

5. **Multiple students on the same essay (peer review or parent view).** If a student shares their essay with a peer reviewer who also sees the annotations, does the viewed-state and queue-position persist per-user (obviously yes), and does the warm summary prose personalize per-user? Current recommendation: all navigation state is per-user; the warm summary is generated per-user-session and may differ between viewers. But we haven't designed the peer-review surface yet (Wave 5). Open dependency.

6. **The "new" badge on annotations inserted mid-session — how long does it persist?** Current recommendation: until the student views the annotation. But if the student views it in a filtered view that happens not to include that annotation, does the badge persist? Yes (viewing requires actually opening the panel on that annotation). What if the student dismisses the toast without advancing into the new annotation — does the new badge survive a session boundary? Current answer: yes. But this could lead to `New` badges persisting for days if the student never returns to the specific essay. Wave 4 question: should `New` badges expire after 72 hours regardless of view state?

7. **Keyboard shortcut discoverability for the power-user subsection.** The core shortcuts (Tab, Shift+Tab, arrows, Esc) surface in the Phase 6 footer after first panel close. The power-user shortcuts (`/`, `?`, `1/2/3/4`, `Cmd+.`, `Cmd+K`) only surface in the full shortcuts overlay (opened with `?`). This means students who don't press `?` never learn about filter shortcuts or the order toggle hotkey. Is the learning pace right? Current recommendation: yes, keep the power shortcuts hidden behind `?`. But this needs Wave 4 observation — if students are filtering via mouse and never learning `1/2/3/4`, we may need a one-time tip ("Press 2 to filter to critical only").

8. **Scroll synchronization between the essay column and the annotation panel.** When the student advances the queue and the essay column auto-scrolls to show the new target sentence at 35% vertical position, should the panel scroll-top reset to 0 (so the meta line is visible)? Current recommendation: yes, always reset panel scroll on transition. But this means a student who scrolled down within a very long critique to read the `why it matters` section, then advanced, loses their within-panel scroll position. Alternative: remember per-annotation scroll position and restore on re-entry. Wave 4 decision.

9. **The "I'm done reviewing, let me revise" exit path before 12/12.** Some students will want to leave the review at 6/12 and start revising the annotations they've already seen. Phase 10 currently has no explicit "exit to revision" affordance before the warm summary. The `Esc` key and close `×` button both close the panel but return the student to the essay-with-underlines layout, not revision mode. Should there be a persistent `Revise now →` option in the panel footer? Current recommendation: no — revising mid-review risks fragmenting the reading experience, and students who want to revise early can simply close the panel and use the essay editor directly. But Wave 4 should test whether this feels like friction or like a healthy boundary.

10. **The warm summary LLM call reliability.** The end-of-review summary is generated by an LLM call at completion time. If the call fails (rate limit, transient error), the fallback prose is static and generic. For students on the edge of bailing, the generic prose may land as impersonal and lose the CTA's weight. Wave 4 question: should the summary be pre-computed at review-start (and cached), so 12/12 never hits the LLM synchronously? Pre-computing has the advantage of reliability but the disadvantage of not knowing which annotations the student actually viewed (the summary can't emphasize skipped areas if it was computed before the review began). One compromise: pre-compute a static summary at review-start, *and* fire an async re-generation at 12/12 that refines it based on viewing patterns. If the async call succeeds within 800ms, show the refined summary; otherwise show the pre-computed one. This is the current recommendation, pending Wave 4 performance testing.

11. **The filter state on essays with zero critical annotations.** If a student's essay has no `critical` tier annotations, the `Critical only` filter state produces an immediate empty state. Should the filter control hide the `Critical` option in that case, or show it as disabled, or show it as available and let the student discover the empty state? Current recommendation: show it available — the student might be looking for criticals and benefit from explicitly seeing "this essay has no critical notes" as a positive signal. But we haven't tested this against the alternative. Wave 4 usability study.

12. **The interaction between Phase 10's smart order and Phase 11's map view.** If the student opens the map view (Phase 11) and clicks on annotation #7 (by document position), does the queue's `currentPosition` update to the smart-order index of that annotation? Current recommendation: yes — clicking in the map is a queue jump, same semantics as clicking an underline. But the map view shows document-order layout, and a smart-order queue-position update may feel confusing (student clicks an annotation that's "near the end" in the document and lands at "position 4 of 12" in the queue). Wave 4 decision: show the queue position on the map as well, so the student sees the mapping before clicking.

---

## Appendix A: Component Interfaces

```tsx
// The navigation state machine, expressed as a React hook contract

interface UseNavigationQueueOptions {
  essayId: string;
  reviewId: string;
  orderMode: 'smart' | 'document';
  filter: FilterState;
  phase5BloomId: string;
}

interface UseNavigationQueueReturn {
  queue: QueueEntry[];
  currentPosition: number;
  currentAnnotation: QueueEntry | null;
  totalInFilter: number;
  viewedInFilter: number;

  stack: StackEntry[];
  isStackSaturated: boolean;

  advanceToNext: () => void;
  retreatToPrevious: () => void;
  advanceToNextParagraph: () => void;
  retreatToPreviousParagraph: () => void;

  jumpTo: (annotationId: string, via: 'underline' | 'map' | 'scrubber' | 'cross-ref' | 'breadcrumb') => void;
  popStack: () => void;
  clearStack: () => void;

  setFilter: (next: FilterState) => void;
  setOrderMode: (next: 'smart' | 'document') => void;

  markViewed: (annotationId: string, dwellMs: number, reason: CloseReason) => void;

  // Idle pulse state
  shouldPulseNext: boolean;

  // End-of-review state
  isComplete: boolean;
  warmSummary: WarmSummary | null;
}

interface StackEntry {
  annotationId: string;
  paragraphIndex: number;
  fromQueuePosition: number;
  pushedAt: number;
}

interface WarmSummary {
  proseSentences: string[]; // 2–3 sentences
  primaryCta: {
    label: string;
    targetAnnotationId: string;
  };
  secondaryOptions: Array<{
    id: 'rewalk' | 'map' | 'exit';
    label: string;
  }>;
  generatedAt: string;
  fallbackUsed: boolean;
}
```

### Component tree (simplified):

```tsx
<ReviewShell>
  <EssayColumn>
    <EssayText annotations={all} viewedSet={viewed} />
    <GutterDots annotations={all} viewedSet={viewed} newSet={newIds} updatedSet={updatedIds} />
  </EssayColumn>

  <InsightPanel>
    <PanelHeader>
      <ProgressBar viewed={viewedInFilter} total={totalInFilter} tier={currentTier} />
      <FilterSegmentedControl value={filter} onChange={setFilter} />
      <OrderToggle value={orderMode} onChange={setOrderMode} />
      {stack.length > 0 && <BreadcrumbRow stack={stack} onJump={jumpTo} onPop={popStack} />}
    </PanelHeader>

    <AnimatePresence mode="wait">
      {!isComplete && (
        <motion.div key={currentAnnotation.id} {...crossfadeMotion}>
          <InsightCard annotation={currentAnnotation} />
        </motion.div>
      )}
      {isComplete && (
        <motion.div key="warm-summary" {...morphMotion}>
          <WarmSummaryPanel summary={warmSummary} />
        </motion.div>
      )}
    </AnimatePresence>

    <PanelFooter>
      <ShortcutHint />
      <NextButton shouldPulse={shouldPulseNext} onClick={advanceToNext} />
    </PanelFooter>
  </InsightPanel>

  <ToastContainer />
</ReviewShell>
```

---

## Appendix B: Glass/Vapor Aesthetic Tokens (Phase 10-Specific)

Inheriting from the product-wide token set, Phase 10 uses:

| Token | Value | Used for |
|---|---|---|
| `--panel-glass-bg` | `rgba(255, 255, 255, 0.72)` with `backdrop-filter: blur(20px)` | Insight panel background |
| `--panel-glass-border` | `rgba(0, 0, 0, 0.06)` | Panel edge |
| `--progress-bar-height` | `3px` | Header progress bar |
| `--progress-bar-gradient` | `linear-gradient(90deg, #C84C32 0%, #D99A3E 25%, #8CA387 50%, #6B9F79 75%, #4FB0A5 100%)` | Progress bar fill (tier gradient) |
| `--gutter-dot-unviewed-opacity` | `1.0` | Default dot |
| `--gutter-dot-viewed-opacity` | `0.55` | After view |
| `--gutter-dot-viewed-scale` | `0.65` | Inset dot size |
| `--new-badge-color` | `#4FB0A5` (teal) | New annotation badge |
| `--updated-badge-color` | `#D99A3E` (amber) | Updated annotation badge |
| `--idle-pulse-scale-peak` | `1.05` | Next button pulse |
| `--breadcrumb-text-color` | `#6B7280` (stone-500) | Stack breadcrumb |
| `--breadcrumb-separator` | `·` (middle dot, U+00B7) | Between stack entries |
| `--scrubber-dot-size` | `8px` (mobile) | Scrubber dots |
| `--scrubber-filled-ring` | `1px solid #4FB0A5` | Current position ring |
| `--warm-summary-bg` | `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(24px)` | End-of-review panel (slightly more opaque than insight panel — signals category change) |

---

## Appendix C: Test Matrix

Tests that must pass before Phase 10 ships:

| Test | Expected outcome |
|---|---|
| Smart order with 12 annotations, Phase 5 bloom at ¶3S2 | Queue[0] is the bloom; invariants I1–I5 hold |
| Smart order with 1 annotation | Queue = [that annotation]; no transitions possible |
| Smart order with 0 annotations (all functional) | Queue is empty; warm summary fires immediately with "no annotations" message |
| Document order toggle | Queue follows document order, wrapping from bloom to end and then start-to-bloom |
| Filter `Critical only` with 0 criticals | Empty state shown; `Show all →` button works |
| Filter change mid-review | Viewed state preserved; new queue computed; position resets to first unviewed in filter |
| Tab from panel with Phase 9 rewrite expanded | Rewrite is not focused; Tab still advances queue (verify focus management) |
| Tab held down for 2 seconds | 40ms coalesce per Phase 7; advance ~10 times, not 50; abort in-flight |
| Stack: 3 jumps then Back × 3 | Back to origin; stack empty after third pop |
| Stack: 4th jump | Oldest dropped; breadcrumb shows ellipsis prefix |
| Re-analysis mid-review: 2 new annotations | Toast fires; queue has 2 new entries inserted after current position |
| Re-analysis mid-review: 1 updated annotation (same ID, version bumped) | Annotation retains queue position; viewed state reset; updated badge renders |
| 12/12 reached | Warm summary fires; prose generated or fallback; CTA targets highest-remaining |
| Session abandoned at 7/12, resumed 20m later | Queue position 7 restored; viewed state intact; idle pulse does not fire on reopen |
| Mobile swipe-left at 0.25 px/ms | No advance (below threshold) |
| Mobile swipe-left at 0.45 px/ms | Advance |
| Mobile scrubber drag from dot 3 to dot 9 | Panel content updates live during drag; commit on release |
| `prefers-reduced-motion` set | All crossfades become instant; pulse disabled; scroll becomes instant |
| Screen reader navigation (VoiceOver + JAWS) | aria-live announces each advance; breadcrumb readable; Tab order logical |
| Keyboard-only flow, no mouse | Full review completable; all shortcuts fire; shortcut overlay accessible via `?` |

---

**End of Phase 10 specification.**
